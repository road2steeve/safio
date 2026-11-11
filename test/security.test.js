// Sécurité : un joueur ne peut pas prendre la place d'un autre (ni de l'organisateur),
// on ne peut pas essayer des milliers de codes, un joueur exclu ne revient pas, pseudos filtrés.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");
const { io } = require("socket.io-client");

const PORT = 5100 + Math.floor(Math.random() * 300);
const URL = `http://localhost:${PORT}`;
let srv;
const sockets = [];
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
before(async () => {
  srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((ok) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && ok()));
});
after(() => { sockets.forEach((s) => s.close()); srv.kill(); });

const newKey = () => crypto.randomBytes(16).toString("hex");
function client(pid, key = newKey()) {
  const s = io(URL, { transports: ["websocket"], auth: { pid, key }, forceNew: true });
  sockets.push(s);
  s.on("state", (v) => (s.last = v));
  s.on("reauth", () => (s.reauth = true));
  s.on("kicked", () => (s.kicked = true));
  s.call = (ev, data) => new Promise((ok) => s.emit(ev, data, ok));
  return new Promise((ok) => s.on("connect", () => ok(s)));
}
const prof = (pid, name) => ({ pid, name, avatar: "🦊", ac: 1, xp: 0, seen: [] });

test("Prendre la place de l'organisateur avec son identifiant public : refusé", async () => {
  const host = await client("hostpid01");
  const r = await host.call("create", { ...prof("hostpid01", "Hôte"), game: "torpille" });
  const guest = await client("guestpid01");
  assert.ok(!(await guest.call("join", { code: r.code, ...prof("guestpid01", "Invité") })).error);
  await wait(100);
  assert.ok(guest.last.players.some((p) => p.pid === "hostpid01"), "l'identifiant public reste visible (c'est normal)");
  const thief = await client("hostpid01"); // même pid, mais pas la bonne clé
  await wait(50);
  assert.ok(thief.reauth, "le serveur demande au téléphone de changer d'identité");
  assert.strictEqual((await thief.call("join", { code: r.code, ...prof("hostpid01", "Voleur") })).error, "err_auth");
  thief.emit("settings", { game: "quiz" });
  await wait(100);
  assert.strictEqual(host.last.game, "torpille", "le jeu n'a pas changé");
  assert.strictEqual(host.last.hostPid, "hostpid01");
});

test("Le vrai joueur revient avec sa clé (rechargement de page) : accepté", async () => {
  const key = newKey();
  const a = await client("backpid01", key);
  const r = await a.call("create", { ...prof("backpid01", "Léa"), game: "quiz" });
  a.close();
  const again = await client("backpid01", key);
  assert.ok(!(await again.call("join", { code: r.code, ...prof("backpid01", "Léa") })).error);
});

test("Codes essayés au hasard : bloqué après 10 erreurs", async () => {
  const bot = await client("botpid001");
  let last;
  for (let i = 0; i < 11; i++) last = await bot.call("join", { code: "ZZZ" + "ABCDEFGHJKL"[i], ...prof("botpid001", "Bot") });
  assert.strictEqual(last.error, "err_slow");
});

test("Joueur exclu par l'hôte : ne peut plus revenir dans ce salon", async () => {
  const host = await client("kickhost1");
  const r = await host.call("create", { ...prof("kickhost1", "Hôte"), game: "quiz" });
  const bad = await client("kickbad01");
  await bad.call("join", { code: r.code, ...prof("kickbad01", "Gêneur") });
  host.emit("kick", "kickbad01");
  await wait(100);
  assert.ok(bad.kicked);
  assert.ok(!host.last.players.some((p) => p.pid === "kickbad01"));
  assert.strictEqual((await bad.call("join", { code: r.code, ...prof("kickbad01", "Gêneur") })).error, "err_banned");
});

test("Pseudos insultants masqués", async () => {
  const a = await client("namepid01");
  await a.call("create", { ...prof("namepid01", "xxFuckxx"), game: "quiz" });
  await wait(100);
  assert.ok(!/fuck/i.test(a.last.players[0].name));
});

test("Maximum par jeu : Torpille refuse de démarrer à 9, démarre à 8", async () => {
  const host = await client("maxhost01");
  const r = await host.call("create", { ...prof("maxhost01", "Hôte"), game: "torpille" });
  const guests = [];
  for (let i = 0; i < 8; i++) {
    const g = await client("maxg" + i + "xx");
    await g.call("join", { code: r.code, ...prof("maxg" + i + "xx", "J" + i) });
    guests.push(g);
  }
  const res = await host.call("start", null);
  assert.strictEqual(res && res.error, "err_max");
  assert.strictEqual(res.max, 8);
  guests[0].emit("leave");
  await wait(100);
  host.emit("start", null);
  await wait(200);
  assert.notStrictEqual(host.last.phase, "lobby", "à 8, la partie démarre");
});
