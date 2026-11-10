// Classement mondial du mode solo.
// Par défaut : stocké dans un fichier (data/leaderboard.json).
// En ligne : si UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN sont définis,
// le classement est stocké dans Upstash Redis (gratuit) et survit aux redémarrages.
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "leaderboard.json");
const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIMIT = 50;

function weekKey(d = new Date()) {
  // Semaine ISO, ex. 2026-W46
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}
const keyOf = (theme, period) => `lb:${theme}:${period === "week" ? weekKey() : "all"}`;

// ---------- Stockage fichier ----------
let mem = { boards: {}, players: {} };
try { mem = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFile(FILE, JSON.stringify(mem), () => {}), 1000);
};

// ---------- Stockage Upstash ----------
async function redis(...cmd) {
  const r = await fetch(URL, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function submit({ pid, name, avatar, theme, score }) {
  const keys = [keyOf(theme, "all"), keyOf(theme, "week"), keyOf("_global", "all"), keyOf("_global", "week")];
  if (URL && TOKEN) {
    await redis("HSET", "lb:players", pid, JSON.stringify({ name, avatar }));
    for (const k of keys) await redis("ZADD", k, "GT", score, pid);
    return;
  }
  mem.players[pid] = { name, avatar };
  for (const k of keys) {
    const b = (mem.boards[k] = mem.boards[k] || {});
    if (!(b[pid] >= score)) b[pid] = score;
  }
  save();
}

async function top(theme, period) {
  const k = keyOf(theme || "_global", period);
  let rows;
  if (URL && TOKEN) {
    const flat = await redis("ZRANGE", k, 0, LIMIT - 1, "REV", "WITHSCORES");
    const pids = flat.filter((_, i) => i % 2 === 0);
    const infos = pids.length ? await redis("HMGET", "lb:players", ...pids) : [];
    rows = pids.map((pid, i) => ({ pid, score: Number(flat[i * 2 + 1]), ...JSON.parse(infos[i] || "{}") }));
  } else {
    rows = Object.entries(mem.boards[k] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, LIMIT)
      .map(([pid, score]) => ({ pid, score, ...(mem.players[pid] || {}) }));
  }
  return rows;
}

module.exports = { submit, top };
