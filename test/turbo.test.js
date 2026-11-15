// Turbo Bac : lettres personnelles, thème commun, contestation, Robix, fin de manche.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");
const { io } = require("socket.io-client");
const { THEMES } = require("../data/turbo");
const { sameWord } = require("../games/turbo");

const PORT = 5800 + Math.floor(Math.random() * 300);
const URL = `http://localhost:${PORT}`;
let srv;
const sockets = [];
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
before(async () => {
  srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((ok) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && ok()));
});
after(() => { sockets.forEach((s) => s.close()); srv.kill(); });
function client(pid) {
  const s = io(URL, { transports: ["websocket"], auth: { pid, key: crypto.randomBytes(16).toString("hex") }, forceNew: true });
  sockets.push(s);
  s.on("state", (v) => (s.last = v));
  s.call = (ev, data) => new Promise((ok) => s.emit(ev, data, ok));
  return new Promise((ok) => s.on("connect", () => ok(s)));
}
const prof = (pid, name) => ({ pid, name, avatar: "🦊", ac: 1, xp: 0, seen: [] });
const until = async (fn, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await wait(50); } return false; };
const act = (s, d) => new Promise((ok) => { s.emit("act", d, ok); setTimeout(() => ok(null), 800); });

test("contenu : thèmes complets en 5 langues, identifiants uniques", () => {
  assert.ok(THEMES.length >= 290);
  assert.strictEqual(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
  for (const t of THEMES) {
    for (const l of ["fr", "en", "es", "nl", "de"]) assert.ok(t[l] && t[l].length > 3, `${t.id} ${l}`);
    for (const l of ["fr", "en", "es"]) assert.ok(t.w[l].length >= 10, `${t.id} exemples ${l}`);
    for (const l of ["nl", "de"]) if (t.w[l]) assert.ok(t.w[l].length >= 10, `${t.id} exemples ${l}`);
  }
  assert.ok(sameWord("Pommes", "pomme") && sameWord("Éléphant", "elephan") && !sameWord("chat", "chut"));
});

test("partie à 2 : mot accepté, mot déjà pris, mauvaise lettre, contestation", async () => {
  const a = await client("tbA"), b = await client("tbB");
  const r = await a.call("create", { ...prof("tbA", "Léa"), game: "turbo", lang: "fr" });
  await b.call("join", { code: r.code, ...prof("tbB", "Tom") });
  a.emit("settings", { settings: { rounds: 1, time: 60, hand: 3 } });
  await wait(100);
  a.emit("start");
  assert.ok(await until(() => a.last && a.last.phase === "play" && a.last.hand && b.last.hand));
  assert.strictEqual(a.last.hand.length, 3);
  assert.ok(a.last.tb.theme.fr && a.last.tb.theme.de);
  assert.strictEqual(a.last.tb.left.tbB, 3);
  const L = a.last.hand[0];
  const bad = "ABCDEFGHILMNOPRSTV".split("").find((x) => !a.last.hand.includes(x));
  assert.strictEqual((await act(a, { type: "word", value: bad + "xyz" })).error, "tb_letter");
  assert.ok((await act(a, { type: "word", value: L + "lpha" })).ok);
  await until(() => b.last.tb.words.length === 1);
  assert.strictEqual(b.last.tb.words[0].status, "pending");
  assert.strictEqual(a.last.hand.length, 2);
  // Tom conteste : il est le seul à pouvoir voter, la majorité est atteinte, la lettre revient
  b.emit("act", { type: "contest", id: b.last.tb.words[0].id });
  assert.ok(await until(() => a.last.tb.words[0].status === "ko" && a.last.hand.length === 3));
  // Un mot que Tom a déjà donné ne compte pas pour Léa (s'ils ont la même lettre)
  const common = a.last.hand.find((x) => b.last.hand.includes(x));
  if (common) {
    assert.ok((await act(b, { type: "word", value: common + "ruc" })).ok);
    assert.strictEqual((await act(a, { type: "word", value: common + "rucs" })).error, "tb_taken");
  }
  // Léa pose toutes ses lettres : acceptées après 5 s, elle gagne la manche
  for (const x of [...a.last.hand]) assert.ok((await act(a, { type: "word", value: x + "olo" + Math.random().toString(36).slice(2, 5) })).ok);
  assert.ok(await until(() => a.last.phase === "review", 9000));
  assert.strictEqual(a.last.tb.winner, "tbA");
  assert.strictEqual(a.last.gains.tbA, 3 + 3);
  a.emit("next");
  assert.ok(await until(() => a.last.phase === "final"));
  assert.ok(a.last.players.find((p) => p.pid === "tbA").score >= 6);
});

test("Robix : à 1 humain + 2 Robix, les Robix posent des lettres", async () => {
  const h = await client("tbH");
  await h.call("create", { ...prof("tbH", "Sacha"), game: "turbo", lang: "fr" });
  assert.strictEqual((await h.call("start")).error, "err_min");
  assert.ok((await h.call("addBot", { n: 2, lang: "fr" })).ok);
  h.emit("settings", { settings: { rounds: 1, time: 20, hand: 3 } });
  await wait(100);
  assert.ok(h.last.robix.includes("turbo"));
  h.emit("start");
  assert.ok(await until(() => h.last && h.last.phase === "play"));
  assert.ok(await until(() => h.last.tb.words.some((w) => w.pid.startsWith("bot")), 40000), "un Robix a joué");
  const w = h.last.tb.words.find((x) => x.pid.startsWith("bot"));
  assert.ok(w.word.length > 1);
});
