// Robix : joueurs robots que l'organisateur ajoute pour compléter un salon (ex. jouer à 2 à « C'est toi ! »).
// Ce sont de vrais joueurs (mêmes règles, mêmes points), toujours connectés, jamais organisateurs.
// Ils jouent aux jeux de ROBIX ci-dessous ; aux autres (Petit Bac, Blind Test, Torpille, Même cerveau),
// ils restent sur le banc le temps de la partie.
const { bluff } = require("../data/party");

const NAMES = ["Bip", "Zazou", "Pixel", "Biscotte", "Nougat", "Gizmo", "Turbo", "Choupi", "Boulon", "Kiwi", "Tic-Tac", "Praline", "Bidule", "Zigzag", "Loustic", "Wattson"];
const MAX = 8;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const loc = (x, lang) => (x && typeof x === "object" ? x[lang] || x.fr || Object.values(x)[0] : x);
// Délai « humain », raccourci pour répondre avant la fin du chrono
const wait = (room, min, max) => {
  let w = rnd(min, max);
  if (room.g && room.g.deadline) w = Math.min(w, Math.max(400, room.g.deadline - Date.now() - 1500));
  return w;
};
// Une mauvaise réponse crédible : la réponse d'une autre question du même thème
function wrongAnswer(room, lang) {
  const list = (room.g.list || []).filter((x) => x !== room.g.current && x.show);
  return list.length ? loc(pick(list).show, lang) : "?";
}

// Chaque fonction : (room, bot) → { d: action, wait: ms } ou null (rien à faire)
const ROBIX = {
  // Quiz libre : environ une bonne réponse sur deux (l'organisateur valide comme pour tout le monde)
  quiz(room, b) {
    const g = room.g;
    if (room.phase !== "play" || b.pid in g.answers) return null;
    const ok = Math.random() < 0.5;
    return { d: { type: "answer", value: ok ? loc(g.current.show, b.lang) : wrongAnswer(room, b.lang) }, wait: wait(room, 5000, 15000) };
  },
  // Éclair : rapide mais faillible
  duel(room, b) {
    const g = room.g;
    if (room.phase !== "play" || b.pid in g.answers) return null;
    const ok = Math.random() < 0.45;
    return { d: { type: "answer", value: ok ? loc(g.current.show, b.lang) : wrongAnswer(room, b.lang) }, wait: wait(room, 2500, 8000) };
  },
  // Au plus près : une estimation autour de la bonne valeur (±40 %)
  closest(room, b) {
    const g = room.g;
    if (room.phase !== "play" || b.pid in g.answers) return null;
    const n = g.current.n;
    let guess = n * (1 + (Math.random() - 0.5) * 0.8);
    if (Number.isInteger(n)) guess = Math.round(guess);
    else guess = Math.round(guess * 100) / 100;
    if (Math.random() < 0.08) guess = n; // pile poil, de temps en temps
    return { d: { type: "answer", value: String(guess) }, wait: wait(room, 4000, 12000) };
  },
  // C'est toi ! : un vote pour un autre joueur, au hasard
  youre(room, b) {
    const g = room.g;
    if (room.phase !== "play" || b.pid in g.votes) return null;
    const others = [...room.players.values()].filter((p) => p.pid !== b.pid && p.connected);
    if (!others.length) return null;
    return { d: { type: "vote", pid: pick(others).pid }, wait: wait(room, 3000, 10000) };
  },
  // Mytho ! : une fausse réponse prise dans d'autres anecdotes, puis un vote (trouve le vrai 4 fois sur 10)
  mytho(room, b) {
    const g = room.g;
    if (room.phase !== "play") return null;
    if (g.step === "write" && !(b.pid in g.fakes)) {
      const others = bluff.filter((x) => x !== g.current);
      return { d: { type: "answer", value: loc(pick(others).show, b.lang) }, wait: wait(room, 6000, 18000) };
    }
    if (g.step === "vote" && !(b.pid in g.votes)) {
      const opts = g.options.filter((o) => !o.authors.includes(b.pid));
      if (!opts.length) return null;
      const truth = opts.find((o) => o.truth);
      const o = truth && Math.random() < 0.4 ? truth : pick(opts);
      return { d: { type: "vote", id: o.id }, wait: wait(room, 4000, 12000) };
    }
    return null;
  },
};

function makeBot(room, lang) {
  const used = new Set([...room.players.values()].map((p) => p.name));
  const free = NAMES.filter((n) => !used.has("🤖 " + n));
  const name = "🤖 " + (free.length ? pick(free) : pick(NAMES) + " " + (room.players.size + 1));
  return { pid: "bot" + Math.random().toString(36).slice(2, 10), name, avatar: "🤖", ac: rnd(0, 10), score: 0, ready: true, xp: 0,
    connected: true, bot: true, lang: ["fr", "en", "es", "nl", "de"].includes(lang) ? lang : "fr" };
}

module.exports = { ROBIX, makeBot, MAX, GAMES: Object.keys(ROBIX) };
