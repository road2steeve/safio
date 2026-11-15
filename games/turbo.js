// Turbo Bac : chacun a ses propres lettres, un thème commun s'affiche, tout le monde joue en même temps.
// Un mot du thème qui commence par une de mes lettres = la lettre est posée (après 5 s pendant lesquelles
// les autres peuvent la contester). Le premier qui a posé toutes ses lettres gagne la manche.
// Points : 1 par lettre posée, +3 pour le gagnant de la manche.
const { norm, lev, clamp, shuffle } = require("../lib/util");
const { filterText } = require("../lib/moderation");
const { THEMES } = require("../data/turbo");

// Lettres faciles dans les cinq langues (pas de K, Q, W, X, Y, Z, J, U)
const LETTERS = "ABCDEFGHILMNOPRSTV".split("");
const PER_THEME = 5; // réponses acceptées avant de changer de thème
const MAX_THEMES = 8; // au-delà, la manche s'arrête (personne n'a fini)
const CONTEST_MS = 5000;
const WIN_BONUS = 3;

const first = (w) => (norm(w)[0] || "").toUpperCase();
// Même mot (ou presque : pluriel, petite faute) déjà donné pour ce thème ?
function sameWord(a, b) {
  const x = norm(a).replace(/s$/, ""), y = norm(b).replace(/s$/, "");
  if (x === y) return true;
  return Math.min(x.length, y.length) >= 5 && lev(x, y) <= 1;
}

const turbo = {
  minPlayers: 2,
  defaults: { rounds: 3, time: 45, hand: 5 },
  clean(s, d) {
    return { rounds: clamp(s.rounds, 1, 10, d.rounds), time: clamp(s.time, 20, 120, d.time), hand: clamp(s.hand, 3, 8, d.hand) };
  },
  start(room, ctx) {
    room.g = { index: -1, total: room.settings.rounds, seq: 0 };
    this.nextRound(room, ctx);
  },
  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total) return ctx.finish(room);
    // Distribution : chacun ses lettres, en évitant autant que possible que deux joueurs aient les mêmes
    const used = Object.fromEntries(LETTERS.map((l) => [l, 0]));
    g.hands = {};
    g.dealt = {};
    for (const p of shuffle([...room.players.values()].filter((p) => p.connected))) {
      const hand = shuffle(LETTERS).sort((a, b) => used[a] - used[b]).slice(0, room.settings.hand).sort();
      hand.forEach((l) => used[l]++);
      g.hands[p.pid] = hand;
      g.dealt[p.pid] = hand.length;
    }
    Object.assign(g, { themeN: 0, words: [], winner: null, gains: {}, step: "play" });
    this.newTheme(room, ctx);
  },
  // Thème suivant (jamais deux fois le même dans la salle tant qu'il en reste)
  newTheme(room, ctx) {
    const g = room.g;
    if (g.step !== "play") return;
    if (g.themeN >= MAX_THEMES) return this.endRound(room, ctx);
    room.tbSeen = room.tbSeen || new Set();
    let pool = THEMES.filter((t) => !room.tbSeen.has(t.id));
    if (!pool.length) { room.tbSeen.clear(); pool = THEMES; }
    g.theme = pool[Math.floor(Math.random() * pool.length)];
    room.tbSeen.add(g.theme.id);
    g.themeN++;
    g.okN = 0;
    g.words = g.words.filter((w) => w.status === "pending"); // les mots en cours de contestation restent visibles
    const n = g.themeN;
    ctx.play(room, room.settings.time, () => { if (room.g === g && g.themeN === n && room.phase === "play") this.newTheme(room, ctx); });
  },
  act(room, pid, d, ctx, reply = () => {}) {
    const g = room.g;
    if (room.phase !== "play" || g.step !== "play") return;
    if (d.type === "word") {
      const hand = g.hands[pid];
      if (!hand) return reply({ error: "tb_notIn" });
      const text = filterText(String(d.value ?? "").trim().slice(0, 30)).trim();
      if (norm(text).length < 2) return reply({ error: "tb_short" });
      const L = first(text);
      if (!hand.includes(L)) return reply({ error: "tb_letter" });
      if (g.words.some((w) => w.theme === g.themeN && w.status !== "ko" && sameWord(w.word, text))) return reply({ error: "tb_taken" });
      hand.splice(hand.indexOf(L), 1);
      const w = { id: ++g.seq, pid, word: text, letter: L, theme: g.themeN, status: "pending", contest: [], at: Date.now() };
      g.words.push(w);
      reply({ ok: true });
      // Personne ne peut contester (que des Robix en face) : accepté tout de suite
      if (!this.voters(room, w).length) return this.resolve(room, ctx, w.id);
      const wait = CONTEST_MS * (room.comfort ? 1.6 : 1);
      w.until = Date.now() + wait;
      setTimeout(() => { if (room.g === g) this.resolve(room, ctx, w.id); }, wait);
      ctx.broadcast(room);
    } else if (d.type === "contest") {
      const w = g.words.find((x) => x.id === d.id);
      if (!w || w.status !== "pending" || w.pid === pid || w.contest.includes(pid)) return;
      if (!this.voters(room, w).some((p) => p.pid === pid)) return;
      w.contest.push(pid);
      if (w.contest.length * 2 > this.voters(room, w).length) return this.resolve(room, ctx, w.id);
      ctx.broadcast(room);
    } else if (d.type === "skip" && pid === room.hostPid) {
      this.newTheme(room, ctx);
    }
  },
  // Qui peut contester : les humains connectés, sauf l'auteur
  voters(room, w) { return [...room.players.values()].filter((p) => p.connected && !p.bot && p.pid !== w.pid); },
  resolve(room, ctx, id) {
    const g = room.g;
    const w = g.words.find((x) => x.id === id);
    if (!w || w.status !== "pending") return;
    if (w.contest.length * 2 > this.voters(room, w).length) {
      w.status = "ko";
      if (g.hands[w.pid]) g.hands[w.pid].push(w.letter), g.hands[w.pid].sort();
    } else {
      w.status = "ok";
      if (w.theme === g.themeN) g.okN++;
    }
    if (room.phase !== "play" || g.step !== "play") return ctx.broadcast(room);
    const hand = g.hands[w.pid];
    if (w.status === "ok" && hand && !hand.length && !g.words.some((x) => x.pid === w.pid && x.status === "pending")) {
      g.winner = w.pid;
      return this.endRound(room, ctx);
    }
    if (g.okN >= PER_THEME) return this.newTheme(room, ctx);
    ctx.broadcast(room);
  },
  endRound(room, ctx) {
    const g = room.g;
    if (room.phase !== "play" || g.step !== "play") return;
    // Les mots encore en attente sont acceptés
    for (const w of g.words) if (w.status === "pending") w.status = "ok";
    g.step = "done";
    g.gains = {};
    for (const [pid, hand] of Object.entries(g.hands)) g.gains[pid] = g.dealt[pid] - hand.length + (pid === g.winner ? WIN_BONUS : 0);
    ctx.review(room);
  },
  forceEnd(room, ctx) { this.newTheme(room, ctx); },
  view(room, v, pid) {
    const g = room.g;
    const left = Object.fromEntries(Object.entries(g.hands).map(([id, h]) => [id, h.length]));
    v.tb = {
      theme: { fr: g.theme.fr, en: g.theme.en, es: g.theme.es, nl: g.theme.nl, de: g.theme.de, ico: g.theme.ico },
      themeN: g.themeN, maxThemes: MAX_THEMES, okN: g.okN, perTheme: PER_THEME, left, dealt: g.dealt, winner: g.winner, step: g.step,
      words: g.words.slice(-12).map((w) => ({ id: w.id, pid: w.pid, word: w.word, letter: w.letter, status: w.status, n: w.contest.length, until: w.until || 0, cur: w.theme === g.themeN })),
    };
    delete v.answered; // pas de « qui a répondu » : tout le monde joue en continu (la course aux lettres le remplace)
    if (room.phase === "review") v.gains = g.gains;
    // Champs personnels (jamais envoyés à la télé)
    if (g.hands[pid]) v.hand = g.hands[pid];
    v.tbMine = g.words.filter((w) => w.contest.includes(pid)).map((w) => w.id);
  },
};

module.exports = { turbo, LETTERS, sameWord };
