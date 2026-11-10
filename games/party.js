// Jeux de soirée : Mytho ! (bluff), Même cerveau, C'est toi !
const { bluff, same, who } = require("../data/party");
const { norm, lev, isMatch, shuffle, clamp } = require("../lib/util");

// ---------- Mytho ! ----------
// 1) chacun invente une fausse réponse  2) chacun vote pour ce qu'il croit vrai
// +2 si on trouve la vraie réponse, +1 par joueur piégé par sa fausse réponse
const mytho = {
  minPlayers: 2,
  defaults: { count: 6, time: 45, voteTime: 25 },
  clean(s, d) {
    return { count: clamp(s.count, 2, 20, d.count), time: clamp(s.time, 20, 120, d.time), voteTime: clamp(s.voteTime, 10, 60, d.voteTime) };
  },
  start(room, ctx) {
    const list = ctx.pickQuestions(room, bluff, room.settings.count);
    room.g = { list, index: -1, total: list.length };
    this.nextRound(room, ctx);
  },
  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total) return ctx.finish(room);
    Object.assign(g, { current: g.list[g.index], step: "write", fakes: {}, votes: {}, options: [], gains: {} });
    ctx.play(room, room.settings.time, () => this.toVote(room, ctx));
  },
  act(room, pid, d, ctx, reply) {
    const g = room.g;
    if (room.phase !== "play") return;
    if (g.step === "write" && d.type === "answer") {
      const text = String(d.value ?? "").trim().slice(0, 60);
      if (!text) return;
      if (isMatch(text, g.current.a)) return reply({ error: "err_truth" });
      g.fakes[pid] = text;
      reply({ ok: true });
      ctx.broadcast(room);
      if (ctx.everyone(room, (p) => p.pid in g.fakes)) this.toVote(room, ctx);
    } else if (g.step === "vote" && d.type === "vote") {
      const opt = g.options.find((o) => o.id === d.id);
      if (!opt || opt.authors.includes(pid) || pid in g.votes) return;
      g.votes[pid] = opt.id;
      ctx.broadcast(room);
      if (ctx.everyone(room, (p) => p.pid in g.votes || !this.canVote(g, p.pid))) this.endRound(room, ctx);
    }
  },
  canVote(g, pid) { return g.options.some((o) => !o.authors.includes(pid)); },
  toVote(room, ctx) {
    const g = room.g;
    if (room.phase !== "play" || g.step !== "write") return;
    // Les fausses réponses identiques sont regroupées
    const groups = new Map();
    for (const [pid, text] of Object.entries(g.fakes)) {
      const k = norm(text);
      if (!groups.has(k)) groups.set(k, { text, authors: [] });
      groups.get(k).authors.push(pid);
    }
    const opts = [...groups.values()].map((o) => ({ ...o, truth: false }));
    opts.push({ text: null, authors: [], truth: true });
    g.options = shuffle(opts).map((o, i) => ({ ...o, id: i + 1 }));
    g.step = "vote";
    ctx.play(room, room.settings.voteTime, () => this.endRound(room, ctx));
  },
  endRound(room, ctx) {
    if (room.phase !== "play") return;
    const g = room.g;
    if (g.step === "write") return this.toVote(room, ctx);
    for (const pid of room.players.keys()) g.gains[pid] = 0;
    for (const [pid, id] of Object.entries(g.votes)) {
      const opt = g.options.find((o) => o.id === id);
      if (opt.truth) g.gains[pid] += 2;
      else opt.authors.forEach((a) => (g.gains[a] = (g.gains[a] || 0) + 1));
    }
    ctx.review(room);
  },
  forceEnd(room, ctx) { room.g.step === "write" ? this.toVote(room, ctx) : this.endRound(room, ctx); },
  view(room, v, pid) {
    const g = room.g;
    v.step = g.step;
    v.question = g.current.q;
    if (g.step === "write") v.answered = Object.keys(g.fakes);
    if (g.step === "vote") v.answered = Object.keys(g.votes);
    if (g.step === "vote" || room.phase === "review") {
      const reveal = room.phase === "review";
      v.options = g.options.map((o) => ({
        id: o.id,
        text: o.truth ? g.current.show : o.text,
        mine: o.authors.includes(pid),
        ...(reveal ? { truth: o.truth, authors: o.authors, voters: Object.keys(g.votes).filter((p) => g.votes[p] === o.id) } : {}),
      }));
      v.myVote = g.votes[pid];
    }
    if (room.phase === "review") v.gains = g.gains;
  },
};

// ---------- Même cerveau ----------
// Chacun répond à un thème : +1 par autre joueur ayant la même réponse
const brain = {
  minPlayers: 2,
  defaults: { count: 8, time: 25 },
  clean(s, d) { return { count: clamp(s.count, 3, 20, d.count), time: clamp(s.time, 10, 60, d.time) }; },
  start(room, ctx) {
    const list = ctx.pickQuestions(room, same, room.settings.count);
    room.g = { list, index: -1, total: list.length };
    this.nextRound(room, ctx);
  },
  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total) return ctx.finish(room);
    Object.assign(g, { current: g.list[g.index], answers: {}, gains: {}, groups: [] });
    ctx.play(room, room.settings.time, () => this.endRound(room, ctx));
  },
  act(room, pid, d, ctx) {
    const g = room.g;
    if (room.phase !== "play" || d.type !== "answer" || pid in g.answers) return;
    const text = String(d.value ?? "").trim().slice(0, 40);
    if (!text) return;
    g.answers[pid] = text;
    ctx.broadcast(room);
    if (ctx.everyone(room, (p) => p.pid in g.answers)) this.endRound(room, ctx);
  },
  same(a, b) {
    const x = norm(a), y = norm(b);
    if (!x || !y) return false;
    if (x === y) return true;
    // pluriel ou petite faute : « fraises » = « fraise »
    return Math.min(x.length, y.length) >= 4 && lev(x, y) <= 1;
  },
  regroup(room) {
    const g = room.g;
    const groups = [];
    for (const [pid, text] of Object.entries(g.answers)) {
      const grp = groups.find((gr) => this.same(gr.text, text));
      if (grp) grp.pids.push(pid);
      else groups.push({ text, pids: [pid] });
    }
    g.groups = groups.sort((a, b) => b.pids.length - a.pids.length);
    g.gains = {};
    for (const gr of g.groups) for (const pid of gr.pids) g.gains[pid] = gr.pids.length - 1;
  },
  endRound(room, ctx) {
    if (room.phase !== "play") return;
    this.regroup(room);
    ctx.review(room);
  },
  // L'hôte peut fusionner deux réponses équivalentes (« fraise » et « strawberry »)
  hostAct(room, d, ctx) {
    const g = room.g;
    if (d.type !== "merge" || room.phase !== "review") return;
    const a = g.groups[d.a], b = g.groups[d.b];
    if (!a || !b || a === b) return;
    a.pids.push(...b.pids);
    g.groups.splice(d.b, 1);
    g.groups.sort((x, y) => y.pids.length - x.pids.length);
    g.gains = {};
    for (const gr of g.groups) for (const pid of gr.pids) g.gains[pid] = gr.pids.length - 1;
    ctx.broadcast(room);
  },
  view(room, v) {
    const g = room.g;
    v.question = g.current.q;
    v.answered = Object.keys(g.answers);
    if (room.phase === "review") { v.groups = g.groups; v.gains = g.gains; }
  },
};

// ---------- C'est toi ! ----------
// Chacun vote pour un joueur : ceux qui ont voté comme la majorité marquent
const youre = {
  minPlayers: 3,
  defaults: { count: 8, time: 20 },
  clean(s, d) { return { count: clamp(s.count, 3, 20, d.count), time: clamp(s.time, 10, 60, d.time) }; },
  start(room, ctx) {
    const list = ctx.pickQuestions(room, who, room.settings.count);
    room.g = { list, index: -1, total: list.length };
    this.nextRound(room, ctx);
  },
  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total) return ctx.finish(room);
    Object.assign(g, { current: g.list[g.index], votes: {}, gains: {}, elected: [] });
    ctx.play(room, room.settings.time, () => this.endRound(room, ctx));
  },
  act(room, pid, d, ctx) {
    const g = room.g;
    if (room.phase !== "play" || d.type !== "vote" || pid in g.votes) return;
    if (d.pid === pid || !room.players.has(d.pid)) return;
    g.votes[pid] = d.pid;
    ctx.broadcast(room);
    if (ctx.everyone(room, (p) => p.pid in g.votes)) this.endRound(room, ctx);
  },
  endRound(room, ctx) {
    if (room.phase !== "play") return;
    const g = room.g;
    const tally = {};
    for (const target of Object.values(g.votes)) tally[target] = (tally[target] || 0) + 1;
    const max = Math.max(0, ...Object.values(tally));
    g.tally = tally;
    g.elected = Object.keys(tally).filter((k) => tally[k] === max && max > 0);
    for (const [voter, target] of Object.entries(g.votes)) g.gains[voter] = g.elected.includes(target) ? 1 : 0;
    ctx.review(room);
  },
  view(room, v) {
    const g = room.g;
    v.question = g.current.q;
    v.answered = Object.keys(g.votes);
    if (room.phase === "review") { v.votes = g.votes; v.tally = g.tally; v.elected = g.elected; v.gains = g.gains; }
  },
};

module.exports = { mytho, brain, youre };
