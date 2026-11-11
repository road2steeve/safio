// Sélection des questions d'une partie, commune à tous les jeux.
// Ordre de priorité :
//   1. jamais une question déjà posée dans cette salle (sauf si la banque est épuisée) ni une question périmée ;
//   2. d'abord les questions qu'aucun joueur présent n'a vues (mémoire du téléphone) ;
//   3. sinon celles vues par le moins de joueurs, puis vues il y a le plus longtemps ;
//   4. thèmes équilibrés (tirage thème par thème, pas deux fois le même d'affilée si possible) ;
//   5. difficultés mélangées (≈ 35 % facile, 45 % moyen, 20 % difficile), avec une progression douce ;
//   6. jamais deux questions « sœurs » (même réponse) dans la même partie.
const { shuffle, norm } = require("./util");

const MIX = { 1: 0.35, 2: 0.45, 3: 0.2 };
const themeOf = (x) => (x && (x.c || (typeof x.t === "string" ? x.t : null))) || "_"; // c = catégorie Blind Test (t y est le titre)
const levelOf = (x) => (x && (x.d === 1 || x.d === 2 || x.d === 3) ? x.d : 2);
// Clé « réponse » pour repérer les questions sœurs (les drapeaux ont chacun leur pays : inutile)
function answerKey(x) {
  if (!x || !x.show || x.t === "flags") return null;
  const k = norm(typeof x.show === "object" ? x.show.fr : x.show);
  return k || null;
}
// Une question avec une date d'expiration (« until » = AAAA-MM-JJ) dépassée ne sort plus
const isExpired = (x, now = Date.now()) => !!(x && x.until && Date.parse(x.until) < now);

// players : [{ seen: Map(id -> ordre), seenMax }] ; roomSeen : Set des objets déjà posés dans la salle
function pick(pool, n, { players = [], roomSeen = new Set(), qid, now = Date.now(), rand = Math.random } = {}) {
  const fresh = pool.filter((x) => !isExpired(x, now));
  const base = fresh.length >= Math.min(n, pool.length) ? fresh : pool;
  // Score : 0 = inédite pour tous ; 1..k = vue par k joueurs (+ fraction = ancienneté) ; +1000 = déjà posée ici
  const cands = shuffle(base).map((x) => {
    const id = qid(x);
    let cnt = 0, rec = 0;
    for (const p of players) {
      if (!p.seen || !p.seen.has(id)) continue;
      cnt++;
      rec = Math.max(rec, p.seenMax ? p.seen.get(id) / p.seenMax : 1); // 0 = vue il y a longtemps, 1 = à l'instant
    }
    const room = roomSeen.has(x) ? 1 : 0;
    return { x, id, theme: themeOf(x), lvl: levelOf(x), key: answerKey(x), cls: room ? 2 : cnt ? 1 : 0, sc: room * 1000 + cnt + rec * 0.99 };
  });
  cands.sort((a, b) => a.sc - b.sc);

  // Files par thème, déjà triées (meilleure en tête)
  const byTheme = new Map();
  for (const c of cands) {
    if (!byTheme.has(c.theme)) byTheme.set(c.theme, []);
    byTheme.get(c.theme).push(c);
  }
  const want = Math.min(n, cands.length);
  const need = { 1: Math.round(want * MIX[1]), 3: Math.round(want * MIX[3]) };
  need[2] = want - need[1] - need[3];
  const perTheme = new Map(), keys = new Set(), out = [], spare = [];
  let last = null;
  const order = shuffle([...byTheme.keys()]);
  while (out.length < want) {
    // Meilleure « classe » encore disponible (inédites d'abord)
    let best = Infinity;
    for (const q of byTheme.values()) if (q.length) best = Math.min(best, q[0].cls);
    if (best === Infinity) break;
    let themes = order.filter((t) => byTheme.get(t).length && byTheme.get(t)[0].cls === best);
    if (themes.length > 1) themes = themes.filter((t) => t !== last);
    const low = Math.min(...themes.map((t) => perTheme.get(t) || 0));
    themes = themes.filter((t) => (perTheme.get(t) || 0) === low);
    const t = themes[Math.floor(rand() * themes.length)];
    const q = byTheme.get(t);
    // Dans ce thème : parmi les candidates de même classe que la tête, la difficulté la plus « manquante »,
    // en sautant les sœurs d'une question déjà choisie
    let idx = -1, score = -Infinity;
    for (let i = 0; i < q.length && q[i].cls === best && i < 40; i++) {
      if (q[i].key && keys.has(q[i].key)) continue;
      const s = (need[q[i].lvl] || 0) * 10 - i * 0.01;
      if (s > score) { score = s; idx = i; }
    }
    if (idx < 0) {
      // seulement des sœurs dans cette classe : on les met de côté (réserve) et on recommence
      while (q.length && q[0].cls === best && q[0].key && keys.has(q[0].key)) spare.push(q.shift());
      continue;
    }
    const c = q.splice(idx, 1)[0];
    out.push(c);
    if (c.key) keys.add(c.key);
    need[c.lvl] = (need[c.lvl] || 0) - 1;
    perTheme.set(t, (perTheme.get(t) || 0) + 1);
    last = t;
  }
  // Banque trop petite : on complète avec les sœurs mises de côté
  while (out.length < want && spare.length) out.push(spare.shift());
  // Progression douce : plutôt faciles au début, plus difficiles vers la fin
  out.forEach((c) => (c.o = c.lvl + rand() * 1.6));
  out.sort((a, b) => a.o - b.o);
  // Éviter deux thèmes identiques d'affilée après ce tri
  for (let i = 1; i < out.length; i++) {
    if (out[i].theme !== out[i - 1].theme) continue;
    const j = out.findIndex((c, k) => k > i && c.theme !== out[i - 1].theme && (k + 1 >= out.length || out[k + 1].theme !== out[i].theme));
    if (j > 0) [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Thème « au hasard » : de préférence un thème où il reste beaucoup de questions inédites pour le groupe
function pickTheme(themes, poolOf, players, qid, rand = Math.random) {
  const w = themes.map((t) => {
    let fresh = 0;
    for (const x of poolOf(t)) {
      const id = qid(x);
      if (!players.some((p) => p.seen && p.seen.has(id))) fresh++;
    }
    return fresh + 1;
  });
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < themes.length; i++) if ((r -= w[i]) < 0) return themes[i];
  return themes[themes.length - 1];
}

module.exports = { pick, pickTheme, isExpired, answerKey, levelOf, themeOf };
