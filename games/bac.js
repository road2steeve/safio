// Petit Bac : une lettre, des catégories, STOP !
// Toutes les manches se jouent d'abord. Ensuite, validation commune :
// lettre par lettre et catégorie par catégorie, les réponses de tout le monde
// s'affichent sur tous les écrans. L'hôte (et les co-validateurs qu'il choisit)
// marque chaque réponse : juste, presque ou fausse.
// Points : juste = 2 (1 si quelqu'un a le même mot), presque = 1 (½ si doublon), faux = 0.
const { norm, clamp } = require("../lib/util");
const LETTERS = "ABCDEFGHIJLMNOPRSTV".split("");
// [seul à l'avoir trouvé, trouvé par d'autres aussi]
const POINTS = { ok: [2, 1], almost: [1, 0.5], no: [0, 0] };

// Catégories connues (traduites côté client). Avec « catégories mélangées »,
// chaque manche tire au sort de nouvelles catégories dans cette liste.
const CAT_IDS = ["country", "city", "firstname", "animal", "job", "fruitveg", "object", "sport", "brand", "celebrity", "movie", "body", "dish", "color", "cartoon", "instrument",
  "castle", "playground", "longword", "fragile", "pirate", "sky", "kitchen", "beach", "school", "party", "superhero", "song", "drink", "clothes", "toy", "vehicle",
  "insult", "excuse", "tinyThing", "bigThing", "smelly", "sticky", "inFridge", "inBag", "christmas", "halloween", "fear", "gift", "hobby", "wedding", "farm", "jungle",
  "sea", "space", "bathroom", "videogame", "candy", "dessert", "flower", "tree", "bird", "insect", "mythology", "villain"];
const STOP_DELAY = 10;
const isValidator = (room, pid) => room.hostPid === pid || (room.coval || []).includes(pid);

module.exports = {
  defaults: { rounds: 3, time: 90, mix: true, perRound: 6, categories: ["country", "firstname", "animal", "job", "fruitveg", "object"] },
  clean(s, d) {
    const cats = Array.isArray(s.categories)
      ? s.categories.map((c) => String(c).trim().slice(0, 30)).filter(Boolean).slice(0, 10)
      : d.categories;
    return {
      rounds: clamp(s.rounds, 1, 10, d.rounds), time: clamp(s.time, 30, 300, d.time),
      mix: typeof s.mix === "boolean" ? s.mix : d.mix, perRound: clamp(s.perRound, 3, 10, d.perRound),
      categories: cats.length ? cats : d.categories,
    };
  },
  start(room, ctx) {
    room.g = { index: -1, total: room.settings.rounds, used: [], usedCats: [], history: [] };
    this.nextRound(room, ctx);
  },
  nextRound(room, ctx) {
    const g = room.g;
    if (g.step === "validate") return;
    g.index++;
    if (g.index >= g.total) return this.startValidation(room, ctx);
    const free = LETTERS.filter((l) => !g.used.includes(l));
    g.letter = free[Math.floor(Math.random() * free.length)];
    g.used.push(g.letter);
    g.categories = this.pickCategories(room);
    g.answers = {};
    g.stoppedBy = null;
    ctx.play(room, room.settings.time, () => this.endRound(room, ctx));
  },
  // Catégories de la manche : fixes, ou tirées au sort (sans répéter tant que possible)
  pickCategories(room) {
    const st = room.settings, g = room.g;
    if (!st.mix) return st.categories;
    const custom = st.categories.filter((c) => !CAT_IDS.includes(c));
    const pool = [...new Set([...CAT_IDS, ...custom])];
    let fresh = pool.filter((c) => !g.usedCats.includes(c));
    if (fresh.length < st.perRound) { g.usedCats = []; fresh = pool; }
    const out = [];
    // les catégories perso de l'hôte passent en priorité
    const mine = custom.filter((c) => fresh.includes(c)).sort(() => Math.random() - 0.5);
    const rest = fresh.filter((c) => !mine.includes(c)).sort(() => Math.random() - 0.5);
    for (const c of [...mine, ...rest]) if (out.length < st.perRound) out.push(c);
    g.usedCats.push(...out);
    return out;
  },
  clip(g, value) { return g.categories.map((_, i) => String((value || [])[i] || "").slice(0, 40)); },
  act(room, pid, d, ctx) {
    const g = room.g;
    if (room.phase === "review") return this.validatorAct(room, pid, d, ctx);
    if (room.phase !== "play" || !Array.isArray(d.value)) return;
    // Ignore les envois en retard d'une manche précédente
    if (d.round && d.round !== g.index + 1) return;
    if (d.type === "answer") g.answers[pid] = this.clip(g, d.value);
    if (d.type === "stop" && !g.stoppedBy) {
      g.answers[pid] = this.clip(g, d.value);
      if (!g.answers[pid].every((x) => x.trim())) return;
      g.stoppedBy = room.players.get(pid).name;
      // STOP : tous les chronos passent à 10 secondes (sauf s'il restait moins)
      const left = Math.max(1, Math.ceil((g.deadline - Date.now()) / 1000));
      const idx = g.index;
      ctx.setDeadline(room, Math.min(STOP_DELAY, left), () => {
        ctx.emit(room, "collect");
        setTimeout(() => { if (room.g === g && g.index === idx) this.endRound(room, ctx); }, 700);
      });
      ctx.broadcast(room);
    }
  },
  // Fin d'une manche : on garde les réponses et on enchaîne
  endRound(room, ctx) {
    if (room.phase !== "play") return;
    const g = room.g;
    g.history.push({ letter: g.letter, categories: g.categories, answers: g.answers, stoppedBy: g.stoppedBy });
    this.nextRound(room, ctx);
  },
  forceEnd(room, ctx) { this.endRound(room, ctx); },

  // ---------- Validation commune ----------
  startValidation(room, ctx) {
    const g = room.g;
    g.pages = [];
    g.marks = {};
    g.history.forEach((h, r) => {
      const L = norm(h.letter);
      h.categories.forEach((_, i) => {
        g.pages.push({ r, i });
        for (const [pid, list] of Object.entries(h.answers)) {
          const w = norm(list[i]);
          // Pré-remplissage : juste si le mot commence par la bonne lettre
          g.marks[`${r}.${i}.${pid}`] = w.length > 1 && w.startsWith(L) ? "ok" : "no";
        }
      });
    });
    g.page = 0;
    g.index = g.total - 1;
    g.step = "validate";
    ctx.review(room);
  },
  validatorAct(room, pid, d, ctx) {
    const g = room.g;
    if (g.step !== "validate" || !isValidator(room, pid)) return;
    if (d.type === "mark" && ["ok", "almost", "no"].includes(d.mark)) {
      const p = g.pages[g.page];
      const k = `${p.r}.${p.i}.${d.pid}`;
      if (k in g.marks) g.marks[k] = d.mark;
    }
    if (d.type === "page") g.page = Math.max(0, Math.min(g.pages.length - 1, g.page + (d.dir > 0 ? 1 : -1)));
    if (d.type === "finish") {
      for (const [p, pts] of Object.entries(this.totals(room))) {
        const pl = room.players.get(p);
        if (pl) pl.score += pts;
      }
      return ctx.finish(room);
    }
    ctx.broadcast(room);
  },
  pagePoints(room, r, i) {
    const g = room.g, h = g.history[r];
    const counts = {}, pts = {};
    for (const [pid, list] of Object.entries(h.answers))
      if (g.marks[`${r}.${i}.${pid}`] !== "no") counts[norm(list[i])] = (counts[norm(list[i])] || 0) + 1;
    for (const [pid, list] of Object.entries(h.answers)) {
      const m = g.marks[`${r}.${i}.${pid}`];
      pts[pid] = POINTS[m][counts[norm(list[i])] > 1 ? 1 : 0];
    }
    return pts;
  },
  totals(room) {
    const tot = {};
    for (const { r, i } of room.g.pages) for (const [pid, n] of Object.entries(this.pagePoints(room, r, i))) tot[pid] = (tot[pid] || 0) + n;
    return tot;
  },
  gains() { return {}; }, // les points sont ajoutés à la fin de la validation

  view(room, v, pid) {
    const g = room.g;
    v.coval = room.coval || [];
    if (room.phase === "play") {
      v.letter = g.letter;
      v.categories = g.categories;
      v.stoppedBy = g.stoppedBy;
      v.answered = Object.keys(g.answers);
      return;
    }
    if (g.step === "validate") {
      const p = g.pages[g.page], h = g.history[p.r];
      const pts = this.pagePoints(room, p.r, p.i);
      v.step = "validate";
      v.page = g.page;
      v.pages = g.pages.length;
      v.vRound = p.r + 1;
      v.letter = h.letter;
      v.category = h.categories[p.i];
      v.stoppedBy = h.stoppedBy;
      v.isValidator = isValidator(room, pid);
      v.entries = Object.entries(h.answers).map(([id, list]) => ({ pid: id, text: list[p.i] || "", mark: g.marks[`${p.r}.${p.i}.${id}`], pts: pts[id] }));
      v.totals = this.totals(room);
      v.deadline = null;
    }
  },
};
