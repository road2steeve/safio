// Temps confort : l'organisateur double les chronos, réglage gardé quand on change de jeu, refusé aux invités.
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

test("Temps confort : chrono doublé, gardé au changement de jeu, réservé à l'organisateur", async () => {
  const h = await client("comforthost1");
  const r = await h.call("create", { ...prof("comforthost1", "Sacha"), game: "quiz", lang: "fr" });
  const g = await client("comfortguest1");
  await g.call("join", { code: r.code, ...prof("comfortguest1", "Tom") });
  await wait(100);
  assert.strictEqual(h.last.comfort, false);
  g.emit("settings", { comfort: true }); // un invité ne peut pas
  await wait(150);
  assert.strictEqual(h.last.comfort, false);
  h.emit("settings", { comfort: true });
  h.emit("settings", { game: "closest" });
  h.emit("settings", { game: "quiz" });
  h.emit("settings", { settings: { count: 3, time: 10 } });
  await wait(150);
  assert.strictEqual(g.last.comfort, true);
  assert.strictEqual(h.last.settings.time, 10);
  h.emit("start");
  assert.ok(await until(() => h.last.phase === "play" && h.last.deadline));
  const left = (h.last.deadline - Date.now()) / 1000;
  assert.ok(left > 15 && left <= 20.5, "chrono doublé (" + left + " s)");
});

test("Sans confort : chrono normal", async () => {
  const h = await client("comforthost2");
  const r = await h.call("create", { ...prof("comforthost2", "Sacha"), game: "quiz", lang: "fr" });
  const g = await client("comfortguest2");
  await g.call("join", { code: r.code, ...prof("comfortguest2", "Tom") });
  h.emit("settings", { settings: { count: 3, time: 10 } });
  await wait(150);
  h.emit("start");
  assert.ok(await until(() => h.last.phase === "play" && h.last.deadline));
  const left = (h.last.deadline - Date.now()) / 1000;
  assert.ok(left > 5 && left <= 10.5, "chrono normal (" + left + " s)");
});
