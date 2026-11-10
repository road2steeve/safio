// Torpille : une question, puis des tirs sur la flotte adverse.
// Bonne réponse = 3 tirs, mauvaise = 1 tir. +1 point par touche.
// La première flotte entièrement coulée arrête la partie.
const { quizPool } = require("./qa");
const { isMatch, clamp } = require("../lib/util");

const SIZE = 6;
const SHIPS = [3, 2, 2, 1];

function placeFleet() {
  const taken = new Set();
  const ships = [];
  for (const len of SHIPS) {
    for (let tries = 0; tries < 500; tries++) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - len + 1));
      const c = Math.floor(Math.random() * (horiz ? SIZE - len + 1 : SIZE));
      const cells = Array.from({ length: len }, (_, i) => (horiz ? r * SIZE + c + i : (r + i) * SIZE + c));
      if (cells.some((x) => taken.has(x))) continue;
      cells.forEach((x) => taken.add(x));
      ships.push(cells);
      break;
    }
  }
  return { ships, shots: {} }; // shots : case -> "hit" | "miss"
}
const shipCells = (b) => b.ships.flat();
const isSunk = (b, ship) => ship.every((x) => b.shots[x] === "hit");
const fleetDown = (b) => b.ships.every((s) => isSunk(b, s));

module.exports = {
  minPlayers: 2,
  defaults: { count: 15, time: 25, shootTime: 25, theme: "all" },
  clean(s, d) {
    const { THEMES } = require("../data/questions");
    return {
      count: clamp(s.count, 3, 30, d.count), time: clamp(s.time, 10, 60, d.time), shootTime: clamp(s.shootTime, 10, 60, d.shootTime),
      theme: ["all", "random", ...THEMES].includes(s.theme) ? s.theme : d.theme,
    };
  },
  start(room, ctx) {
    const { pool, theme } = quizPool(room.settings.theme);
    const list = ctx.pickQuestions(room, pool, room.settings.count);
    const boards = {};
    for (const pid of room.players.keys()) boards[pid] = placeFleet();
    room.g = { list, index: -1, total: list.length, theme, boards, log: [] };
    this.nextRound(room, ctx);
  },
  alive(room) { return [...room.players.keys()].filter((pid) => room.g.boards[pid] && !fleetDown(room.g.boards[pid])); },
  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total || this.alive(room).length < 2 || Object.values(g.boards).some(fleetDown)) return ctx.finish(room);
    Object.assign(g, { current: g.list[g.index], step: "question", answers: {}, judged: {}, shotsLeft: {}, targets: {}, log: [], gains: {} });
    ctx.play(room, room.settings.time, () => this.toShoot(room, ctx));
  },
  act(room, pid, d, ctx) {
    const g = room.g;
    if (room.phase !== "play" || !g.boards[pid]) return;
    if (g.step === "question" && d.type === "answer" && !(pid in g.answers)) {
      g.answers[pid] = String(d.value ?? "").slice(0, 80);
      ctx.broadcast(room);
      if (ctx.everyone(room, (p) => p.pid in g.answers || !g.boards[p.pid])) this.toShoot(room, ctx);
    }
    if (g.step !== "shoot") return;
    if (d.type === "target" && d.pid !== pid && g.boards[d.pid] && !fleetDown(g.boards[d.pid])) {
      g.targets[pid] = d.pid;
      ctx.broadcast(room);
    }
    if (d.type === "shot" && g.shotsLeft[pid] > 0) {
      const target = g.targets[pid];
      const b = g.boards[target];
      const cell = Math.floor(d.cell);
      if (!b || target === pid || !(cell >= 0 && cell < SIZE * SIZE) || b.shots[cell]) return;
      const hit = shipCells(b).includes(cell);
      b.shots[cell] = hit ? "hit" : "miss";
      g.shotsLeft[pid]--;
      const ship = b.ships.find((s) => s.includes(cell));
      g.log.push({ from: pid, to: target, cell, hit, sunk: !!(hit && isSunk(b, ship)) });
      if (hit) g.gains[pid] = (g.gains[pid] || 0) + 1;
      // cible coulée : on passe à une autre automatiquement
      if (fleetDown(b)) {
        const others = this.alive(room).filter((x) => x !== pid);
        for (const [shooter, t] of Object.entries(g.targets)) if (t === target) g.targets[shooter] = others.find((x) => x !== shooter);
      }
      ctx.broadcast(room);
      const someoneDown = Object.values(g.boards).some(fleetDown);
      if (someoneDown || Object.values(g.shotsLeft).every((n) => n <= 0)) this.endRound(room, ctx);
    }
  },
  toShoot(room, ctx) {
    const g = room.g;
    if (room.phase !== "play" || g.step !== "question") return;
    const alive = this.alive(room);
    for (const pid of alive) {
      g.judged[pid] = isMatch(g.answers[pid], g.current.a);
      g.shotsLeft[pid] = g.judged[pid] ? 3 : 1;
      if (alive.length === 2 || !g.targets[pid]) g.targets[pid] = alive.find((x) => x !== pid);
    }
    g.step = "shoot";
    ctx.play(room, room.settings.shootTime, () => this.endRound(room, ctx));
  },
  endRound(room, ctx) {
    if (room.phase !== "play") return;
    if (room.g.step === "question") return this.toShoot(room, ctx);
    ctx.review(room);
  },
  forceEnd(room, ctx) { this.endRound(room, ctx); },
  view(room, v, pid) {
    const g = room.g;
    v.step = g.step;
    v.theme = g.theme;
    v.size = SIZE;
    v.question = g.current.q;
    v.img = g.current.img;
    v.answered = Object.keys(g.answers);
    v.boards = {};
    for (const [owner, b] of Object.entries(g.boards)) {
      v.boards[owner] = {
        shots: b.shots,
        down: fleetDown(b),
        left: b.ships.filter((s) => !isSunk(b, s)).length,
        sunk: b.ships.filter((s) => isSunk(b, s)), // les navires coulés sont révélés
        ...(owner === pid || room.phase === "final" ? { ships: b.ships } : {}),
      };
    }
    if (g.step === "shoot" || room.phase === "review") {
      v.judged = g.judged;
      v.solution = g.current.show;
      v.shotsLeft = g.shotsLeft;
      v.target = g.targets[pid];
      v.log = g.log;
    }
    if (room.phase === "review") v.gains = g.gains;
  },
};
