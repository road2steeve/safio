// SAFIO TV (Quizz) : tests de bout en bout par sockets, sur un vrai serveur.
// Le « canari » vérifie, à chaque étape de parties simulées dans les 8 jeux, que tout texte envoyé
// à la télé est déjà visible par CHAQUE joueur. Une fuite de secret (Mytho, Torpille…) ferait échouer le test.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("child_process");
const path = require("path");
const { io } = require("socket.io-client");

const PORT = 4100 + Math.floor(Math.random() * 800);
const URL = `http://localhost:${PORT}`;
let srv;
const sockets = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

before(async () => {
  srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((ok) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && ok()));
});
after(() => { sockets.forEach((s) => s.close()); srv.kill(); });

function client(pid) {
  const s = io(URL, { transports: ["websocket"], auth: { pid }, forceNew: true });
  sockets.push(s);
  s.last = null;
  s.on("state", (v) => (s.last = v));
  s.on("tv", (v) => (s.lastTv = v));
  s.call = (ev, data) => new Promise((ok) => s.emit(ev, data, ok));
  return new Promise((ok) => s.on("connect", () => ok(s)));
}
const profile = (pid, name) => ({ pid, name, avatar: "🦊", ac: 1, xp: 0, seen: [] });
async function screen(lang = "fr") {
  const tv = await client("tv-" + Math.random());
  const r = await tv.call("tvCreate", { lang });
  assert.ok(r.code && r.sid && r.token, "la télé ouvre une salle");
  tv.session = r;
  assert.deepStrictEqual(await tv.call("tvHello", r), { ok: true });
  await wait(60);
  return tv;
}
function strings(x, out = new Set()) {
  if (typeof x === "string") out.add(x);
  else if (Array.isArray(x)) x.forEach((y) => strings(y, out));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => strings(y, out));
  return out;
}
// Toute chaîne de la partie montrée à la télé doit figurer dans la vue de chaque joueur
function canary(tv, players, label) {
  const v = tv.lastTv;
  if (!v || !v.game) return;
  const g = v.game;
  if (g.boards) for (const b of Object.values(g.boards)) assert.ok(!("ships" in b), `${label} : flotte cachée envoyée à la télé`);
  if (g.options) for (const o of g.options) assert.ok(!("mine" in o), `${label} : « mine » envoyé à la télé`);
  for (const k of ["myOk", "myTime", "myVote", "target", "isValidator", "xp"]) assert.ok(!(k in g), `${label} : champ personnel ${k}`);
  for (const p of players) {
    if (!p.last || p.last.phase === "final" || p.last.phase === "lobby") continue;
    const seen = strings(p.last);
    for (const str of strings(g)) {
      if (["play", "review"].includes(str)) continue; // sous-phase, connue de tous
      assert.ok(seen.has(str), `${label} : « ${str} » visible sur la télé mais pas par ${p.pid}`);
    }
  }
}

test("La télé ouvre la salle ; le premier qui arrive devient l'organisateur", async () => {
  const tv = await screen();
  assert.strictEqual(tv.lastTv.phase, "lobby");
  assert.strictEqual(tv.lastTv.players.length, 0);
  const a = await client("pA1");
  const r = await a.call("join", { code: tv.session.code, ...profile("pA1", "Alice") });
  assert.strictEqual(r.code, tv.session.code);
  await wait(80);
  assert.strictEqual(a.last.hostPid, "pA1", "Alice est l'organisatrice");
  assert.strictEqual(tv.lastTv.host, "pA1");
  assert.strictEqual(tv.lastTv.players[0].name, "Alice");
  assert.ok(a.last.screens && a.last.screens[0].connected, "le téléphone voit la télé reliée");
  // La salle survit au départ du dernier joueur tant que la télé est allumée
  a.emit("leave");
  await wait(80);
  assert.strictEqual(tv.lastTv.players.length, 0);
  assert.strictEqual(tv.lastTv.host, null);
  const b = await client("pB1");
  await b.call("join", { code: tv.session.code, ...profile("pB1", "Bruno") });
  await wait(80);
  assert.strictEqual(b.last.hostPid, "pB1", "le suivant devient organisateur");
});

test("Code écran : relier une télé à une salle créée sur un téléphone ; réglages et arrêt réservés à l'organisateur", async () => {
  const host = await client("pH2");
  const { code } = await host.call("create", { ...profile("pH2", "Hugo"), game: "quiz" });
  const guest = await client("pG2");
  await guest.call("join", { code, ...profile("pG2", "Gina") });
  const tv = await client("tv2");
  const linked = new Promise((ok) => tv.once("tvLinked", ok));
  const { pair } = await tv.call("tvPair", { lang: "en" });
  assert.match(pair, /^[A-Z2-9]{6}$/);
  assert.strictEqual((await guest.call("tvLink", { pair })).error, "tv_host", "un invité ne peut pas relier");
  assert.strictEqual((await host.call("tvLink", { pair: "ZZZZZZ" })).error, "tv_code");
  assert.deepStrictEqual(await host.call("tvLink", { pair: pair.toLowerCase() }), { ok: true });
  const r = await linked;
  assert.strictEqual(r.code, code);
  assert.deepStrictEqual(await tv.call("tvHello", r), { ok: true });
  await wait(80);
  assert.strictEqual(tv.lastTv.code, code);
  assert.strictEqual(tv.lastTv.main, true);
  assert.strictEqual((await host.call("tvLink", { pair })).error, "tv_code", "un code ne sert qu'une fois");
  // Mauvais jeton : refusé
  assert.strictEqual((await tv.call("tvHello", { ...r, token: "x".repeat(32) })).error, "tv_auth");
  // Réglages du son : organisateur seulement, valeurs bornées
  guest.emit("tvOpts", { sound: false });
  host.emit("tvOpts", { music: false, volume: 7 });
  await wait(80);
  assert.deepStrictEqual(tv.lastTv.opts, { sound: true, music: false, volume: 1 });
  // Pour 6 essais par minute, le 7e est freiné
  for (let i = 0; i < 6; i++) await host.call("tvLink", { pair: "AAAAAA" });
  assert.strictEqual((await host.call("tvLink", { pair: "AAAAAA" })).error, "tv_slow");
  const end = new Promise((ok) => tv.once("tvEnd", ok));
  guest.emit("tvStop", {});
  host.emit("tvStop", {});
  await end;
  await wait(60);
  assert.strictEqual((host.last.screens || []).length, 0);
});

test("La télé ne rejoint pas le canal du salon (événements de groupe)", async () => {
  const tv = await screen();
  let leaked = false;
  for (const ev of ["seenAdd", "collect", "state"]) tv.on(ev, () => (leaked = true));
  const a = await client("pC3"), b = await client("pD3");
  await a.call("join", { code: tv.session.code, ...profile("pC3", "Chloé") });
  await b.call("join", { code: tv.session.code, ...profile("pD3", "Dan") });
  a.emit("settings", { game: "duel", settings: {} });
  await wait(50);
  a.emit("settings", { settings: { count: 3 } });
  await wait(50);
  a.emit("start");
  await wait(150);
  assert.strictEqual(tv.lastTv.phase, "playing");
  assert.strictEqual(leaked, false, "aucun événement de groupe ne parvient à la télé");
});

// ---------- Robot testeur : parties aléatoires dans les 8 jeux, canari à chaque étape ----------
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WORDS = ["Paris", "366", "Portugal", "pomme", "banane", "Bob", "42", "chat", "Rome", "1789"];
async function fuzz(game, n) {
  const tv = await screen(pick(["fr", "en", "es"]));
  const ps = [];
  for (let i = 0; i < n; i++) {
    const pid = `${game}-${i}-${Math.random().toString(36).slice(2, 6)}`;
    const c = await client(pid);
    c.pid = pid;
    await c.call("join", { code: tv.session.code, ...profile(pid, "J" + i + game) });
    ps.push(c);
  }
  const host = ps[0];
  host.emit("settings", { game, settings: {} });
  await wait(40);
  host.emit("settings", { settings: { count: 3, rounds: 2, time: 30 } });
  await wait(40);
  host.emit("start", null);
  await wait(120);
  let steps = 0;
  while (steps++ < 160) {
    const v = host.last;
    if (!v || v.phase === "final") break;
    canary(tv, ps, `${game} étape ${steps}`);
    for (const p of ps) {
      const s = p.last;
      if (!s || Math.random() < 0.3) continue;
      const others = ps.filter((x) => x !== p).map((x) => x.pid);
      if (game === "mytho" && s.step === "vote" && s.options) p.emit("act", { type: "vote", id: pick(s.options).id });
      else if (game === "youre") p.emit("act", { type: "vote", pid: pick(others) });
      else if (game === "bac" && s.categories && s.phase === "play") p.emit("act", { type: Math.random() < 0.1 ? "stop" : "answer", value: s.categories.map(() => (s.letter || "B") + pick(WORDS)), round: s.round });
      else if (game === "torpille" && s.step === "shoot") { p.emit("act", { type: "target", pid: pick(others) }); p.emit("act", { type: "shot", cell: Math.floor(Math.random() * 36) }); }
      else p.emit("act", { type: "answer", value: game === "closest" ? String(Math.floor(Math.random() * 500)) : pick(WORDS) + (game === "mytho" ? p.pid.slice(-3) : "") }, () => {});
    }
    // Validateur du Quiz libre / du Petit Bac
    if (v.phase === "review" && (v.isValidator || v.step === "validate")) {
      const tgt = pick([...(v.answered || []), ...((v.entries || []).map((e) => e.pid))].concat([ps[1].pid]));
      host.emit("act", { type: "mark", pid: tgt, mark: pick(["ok", "almost", "no"]) });
      if (v.step === "validate") host.emit("act", { type: Math.random() < 0.3 ? "finish" : "page", dir: 1, value: [] });
    }
    await wait(70);
    canary(tv, ps, `${game} étape ${steps}`);
    if (Math.random() < 0.45) host.emit("next");
    await wait(70);
  }
  await wait(120);
  assert.strictEqual(host.last.phase, "final", `${game} : la partie se termine`);
  assert.strictEqual(tv.lastTv.phase, "results");
  assert.strictEqual(tv.lastTv.results.ranking.length, n);
  ps.forEach((p) => p.emit("leave"));
}
for (const [game, n] of [["quiz", 3], ["mytho", 4], ["bac", 3], ["duel", 2], ["brain", 3], ["youre", 3], ["closest", 3], ["torpille", 3]]) {
  test(`Canari ${game} : rien de secret sur la télé, partie complète`, () => fuzz(game, n));
}
