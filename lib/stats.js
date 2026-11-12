// Statistiques anonymes de SAFIO : uniquement des compteurs par jour (aucun pseudo, aucune adresse IP,
// aucun identifiant de joueur ou d'appareil). Conforme au plan RGPD validé : rien n'est stocké sur l'appareil.
// En ligne : stockées dans Upstash (mêmes variables que le classement, préfixe LB_PREFIX pour le site de test).
// Sans Upstash : en mémoire (perdues au redémarrage), utile en local.
const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const PRE = process.env.LB_PREFIX ? process.env.LB_PREFIX + ":" : "";
const KEEP_DAYS = 400;

const day = (d = new Date()) => d.toISOString().slice(0, 10);
const clean = (v) => String(v == null || v === "" ? "-" : v).toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40) || "-";
// Taille du groupe, en tranches (jamais le nombre exact au-delà de 2)
const size = (n) => (n <= 1 ? "1" : n === 2 ? "2" : n <= 4 ? "3-4" : n <= 8 ? "5-8" : "9+");

let buf = new Map(); // "jour" -> Map(champ -> nombre)
const mem = new Map(); // stockage local sans Upstash

// Compte un événement : ev = room | join | start | finish ; dims = { game, mode, lang, src, n }
function hit(ev, dims = {}) {
  const f = [ev, dims.game, dims.mode, dims.lang, dims.src, dims.n == null ? "-" : size(dims.n)].map(clean).join("|");
  const d = day();
  if (!buf.has(d)) buf.set(d, new Map());
  const m = buf.get(d);
  m.set(f, (m.get(f) || 0) + 1);
}

async function pipeline(cmds) {
  const r = await fetch(URL.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmds) });
  return r.json();
}

async function flush() {
  if (!buf.size) return;
  const cur = buf;
  buf = new Map();
  if (!(URL && TOKEN)) {
    for (const [d, m] of cur) {
      if (!mem.has(d)) mem.set(d, new Map());
      const t = mem.get(d);
      for (const [f, n] of m) t.set(f, (t.get(f) || 0) + n);
    }
    return;
  }
  const cmds = [];
  for (const [d, m] of cur) {
    for (const [f, n] of m) cmds.push(["HINCRBY", `${PRE}st:${d}`, f, n]);
    cmds.push(["EXPIRE", `${PRE}st:${d}`, KEEP_DAYS * 86400]);
  }
  try { await pipeline(cmds); } catch (e) { console.error("stats", e.message); }
}
setInterval(flush, 60000).unref();

// Lecture des N derniers jours : [{ day, rows: [{ ev, game, mode, lang, src, n, count }] }]
async function read(days = 30) {
  await flush();
  const list = [];
  for (let i = 0; i < days; i++) list.push(day(new Date(Date.now() - i * 86400000)));
  let raw;
  if (URL && TOKEN) {
    const res = await pipeline(list.map((d) => ["HGETALL", `${PRE}st:${d}`]));
    raw = res.map((x) => {
      const a = x.result || [], m = new Map();
      for (let i = 0; i < a.length; i += 2) m.set(a[i], Number(a[i + 1]));
      return m;
    });
  } else raw = list.map((d) => mem.get(d) || new Map());
  return list.map((d, i) => ({
    day: d,
    rows: [...raw[i]].map(([f, count]) => {
      const [ev, game, mode, lang, src, n] = f.split("|");
      return { ev, game, mode, lang, src, n, count };
    }),
  }));
}

module.exports = { hit, read, flush, _size: size };
