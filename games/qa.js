// Jeux « une question, chacun répond » : Quiz libre, Éclair (duel/solo), Au plus près.
const { THEMES, quiz, closest } = require("../data/questions");
const { isMatch, clamp } = require("../lib/util");

// theme : "all", "random", un thème, ou plusieurs thèmes séparés par des virgules ("geo,hist")
const themeList = (t) => String(t || "").split(",").filter((x) => THEMES.includes(x));
const byTheme = (t) => quiz.filter((x) => x.t === t);
function quizPool(theme, room, ctx) {
  if (theme === "random") theme = ctx && ctx.pickTheme ? ctx.pickTheme(room, THEMES, byTheme) : THEMES[Math.floor(Math.random() * THEMES.length)];
  const list = themeList(theme);
  if (!list.length) return { theme: "all", pool: quiz };
  const pool = quiz.filter((x) => list.includes(x.t));
  return { theme: list.length > 1 ? "mix" : list[0], pool: pool.length ? pool : quiz };
}
const cleanTheme = (t, d) => {
  if (t === "all" || t === "random") return t;
  const list = [...new Set(themeList(t))];
  return list.length ? list.join(",") : d;
};
const isValidator = (room, pid) => room.hostPid === pid || (room.coval || []).includes(pid);
// Quiz libre : juste = 1 pt, presque = ½, faux = 0
const MARK_PTS = { ok: 1, almost: 0.5, no: 0 };

function makeQA(kind) {
  const isQuiz = kind === "quiz", isDuel = kind === "duel", isClosest = kind === "closest";
  return {
    defaults: isClosest ? { count: 8, time: 25 } : isQuiz ? { count: 10, time: 30, themes: [] } : { count: 10, time: 10, theme: "all" },
    clean(s, d) {
      const out = { count: clamp(s.count, 3, 30, d.count), time: clamp(s.time, 5, isDuel ? 60 : 120, d.time) };
      if (isQuiz) out.themes = Array.isArray(s.themes) ? [...new Set(s.themes.filter((x) => THEMES.includes(x)))] : d.themes;
      else if (!isClosest) out.theme = cleanTheme(s.theme, d.theme);
      return out;
    },
    start(room, ctx) {
      let pool = closest, theme;
      if (isQuiz) {
        const th = room.settings.themes || [];
        pool = th.length ? quiz.filter((x) => th.includes(x.t)) : quiz;
        if (!pool.length) pool = quiz;
      } else if (!isClosest) ({ pool, theme } = quizPool(room.settings.theme, room, ctx));
      const list = ctx.pickQuestions(room, pool, room.settings.count);
      room.g = { list, index: -1, total: list.length, theme, mix: theme === "mix", answers: {}, times: {} };
      room.recap = isQuiz ? [] : null;
      this.nextRound(room, ctx);
    },
    nextRound(room, ctx) {
      const g = room.g;
      g.index++;
      if (g.index >= g.total) return ctx.finish(room);
      g.current = g.list[g.index];
      g.answers = {}; g.times = {}; g.judged = {}; g.gains = {}; g.marks = {}; g.comments = {}; g.checked = {};
      if (isQuiz || g.mix) g.theme = g.current.t;
      g.startedAt = Date.now();
      ctx.play(room, room.settings.time, () => this.endRound(room, ctx));
    },
    act(room, pid, d, ctx) {
      const g = room.g;
      if (isQuiz && room.phase === "review" && !room.auto) return this.validatorAct(room, pid, d, ctx);
      if (d.type !== "answer" || room.phase !== "play" || pid in g.answers) return;
      g.answers[pid] = String(d.value ?? "").slice(0, 80);
      g.times[pid] = Date.now() - g.startedAt;
      // Éclair : une seule tentative, corrigée tout de suite, orthographe exacte
      if (isDuel) g.judged[pid] = isMatch(g.answers[pid], g.current.a);
      ctx.broadcast(room);
      if (ctx.everyone(room, (p) => p.pid in g.answers)) this.endRound(room, ctx);
    },
    endRound(room, ctx) {
      if (room.phase !== "play") return;
      const g = room.g;
      if (isClosest) {
        // 3 / 2 / 1 points aux plus proches (+2 si pile juste)
        const target = g.current.n;
        const entries = Object.entries(g.answers)
          .map(([pid, v]) => ({ pid, d: Math.abs(Number(String(v).replace(/[\s\u00a0]/g, "").replace(",", ".")) - target) })) // « 9,58 » et « 5 840 » acceptés
          .filter((e) => Number.isFinite(e.d))
          .sort((a, b) => a.d - b.d);
        const distinct = [...new Set(entries.map((e) => e.d))];
        for (const e of entries) {
          const rank = distinct.indexOf(e.d);
          g.gains[e.pid] = (rank < 3 ? 3 - rank : 0) + (e.d === 0 ? 2 : 0);
        }
      } else {
        for (const [pid, ans] of Object.entries(g.answers)) {
          g.judged[pid] = isMatch(ans, g.current.a);
          g.marks[pid] = g.judged[pid] ? "ok" : "no";
        }
        this.computeGains(room);
        if (isQuiz) room.recap.push({ q: g.current.q, a: g.current.show, img: g.current.img, t: g.current.t, answers: g.answers, marks: g.marks, comments: g.comments });
      }
      ctx.review(room);
    },
    computeGains(room) {
      const g = room.g;
      g.gains = {};
      const total = room.settings.time * 1000;
      const right = Object.keys(g.answers).filter((pid) => g.judged[pid]);
      for (const pid of Object.keys(g.answers)) g.gains[pid] = 0;
      if (room.solo) {
        // Solo : 100 points par bonne réponse + bonus de rapidité (jusqu'à 100)
        for (const pid of right) g.gains[pid] = 100 + Math.round(100 * Math.max(0, 1 - g.times[pid] / total));
      } else if (isDuel) {
        // Éclair : 1 point par bonne réponse, +1 pour le plus rapide
        for (const pid of right) g.gains[pid] = 1;
        const fastest = right.sort((a, b) => g.times[a] - g.times[b])[0];
        if (fastest) g.gains[fastest] += 1;
      } else if (isQuiz && !room.auto) {
        for (const pid of Object.keys(g.answers)) g.gains[pid] = MARK_PTS[g.marks[pid]] || 0;
      } else for (const pid of right) g.gains[pid] = 1;
    },
    // Quiz libre : le validateur (et les co-validateurs) jugent juste / presque / faux
    validatorAct(room, pid, d, ctx) {
      const g = room.g;
      if (!isValidator(room, pid) || !(d.pid in g.answers)) return;
      if (d.type === "mark" && d.mark in MARK_PTS) {
        g.marks[d.pid] = d.mark;
        g.judged[d.pid] = d.mark !== "no";
        g.checked[d.pid] = true;
      } else if (d.type === "comment") {
        const c = String(d.text || "").trim().slice(0, 120);
        if (c) g.comments[d.pid] = c; else delete g.comments[d.pid];
      } else return;
      this.computeGains(room);
      ctx.broadcast(room);
    },
    view(room, v, pid) {
      const g = room.g;
      v.theme = g.theme;
      v.question = g.current.q;
      v.img = g.current.img;
      v.answered = Object.keys(g.answers);
      if (isDuel && room.phase === "play" && pid in g.answers) { v.myOk = !!g.judged[pid]; v.myTime = g.times[pid]; }
      if (room.phase === "review") {
        v.answers = g.answers;
        v.times = g.times;
        v.solution = isClosest ? g.current.n : g.current.show;
        v.unit = g.current.u;
        v.judged = g.judged;
        v.gains = g.gains;
        if (isQuiz && !room.auto) {
          v.marks = g.marks;
          v.comments = g.comments;
          v.isValidator = isValidator(room, pid);
          v.toCheck = Object.keys(g.answers).filter((id) => !g.checked[id]).length;
        }
      }
    },
  };
}

module.exports = { quiz: makeQA("quiz"), duel: makeQA("duel"), closest: makeQA("closest"), quizPool, cleanTheme };
