// Robix (joueurs robots) : l'organisateur complète son salon, les Robix jouent vraiment, jamais organisateurs.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");
const { io } = require("socket.io-client");

const PORT = 5500 + Math.floor(Math.random() * 300);
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
const until = async (fn, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await wait(100); } return false; };

test("C'est toi ! à 1 humain + 2 Robix : ils votent, la manche se termine", async () => {
  const h = await client("robixhost1");
  const r = await h.call("create", { ...prof("robixhost1", "Sacha"), game: "youre", lang: "fr" });
  h.emit("settings", { settings: { count: 3, time: 10 } });
  assert.strictEqual((await h.call("start")).error, "err_min");
  assert.ok((await h.call("addBot", { n: 2, lang: "fr" })).ok);
  await wait(100);
  const bots = h.last.players.filter((p) => p.bot);
  assert.strictEqual(bots.length, 2);
  assert.ok(bots.every((b) => b.name.startsWith("🤖 ") && b.connected && b.ready));
  assert.ok(h.last.robix.includes("youre"));
  h.emit("start");
  assert.ok(await until(() => h.last.phase === "play"));
  h.emit("act", { type: "vote", pid: bots[0].pid });
  assert.ok(await until(() => h.last.phase === "review", 12000), "les Robix ont voté");
  assert.strictEqual(Object.keys(h.last.votes).length, 3);
  assert.ok(r.code);
});

test("Au plus près : les Robix répondent un nombre ; un Robix ne devient jamais organisateur", async () => {
  const h = await client("robixhost2");
  const g = await client("robixguest2");
  const r = await h.call("create", { ...prof("robixhost2", "Lina"), game: "closest", lang: "nl" });
  await g.call("join", { code: r.code, ...prof("robixguest2", "Tom") });
  h.emit("settings", { settings: { count: 3, time: 8 } });
  await h.call("addBot", { n: 1, lang: "nl" });
  h.emit("start");
  assert.ok(await until(() => h.last.phase === "play"));
  h.emit("act", { type: "answer", value: "10" });
  g.emit("act", { type: "answer", value: "20" });
  assert.ok(await until(() => h.last.phase === "review", 10000));
  const bot = h.last.players.find((p) => p.bot);
  assert.ok(Number.isFinite(Number(h.last.answers[bot.pid])), "réponse chiffrée du Robix");
  h.emit("leave");
  assert.ok(await until(() => g.last.hostPid === "robixguest2"), "la main passe à l'humain");
});

test("Petit Bac : les Robix restent sur le banc", async () => {
  const h = await client("robixhost3");
  const g = await client("robixguest3");
  const r = await h.call("create", { ...prof("robixhost3", "Noa"), game: "youre", lang: "fr" });
  await g.call("join", { code: r.code, ...prof("robixguest3", "Eli") });
  await h.call("addBot", { n: 1, lang: "fr" });
  h.emit("settings", { game: "bac" });
  await wait(100);
  h.emit("start");
  assert.ok(await until(() => h.last.phase === "play"));
  assert.strictEqual(h.last.players.find((p) => p.bot).connected, false);
});
