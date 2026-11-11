// Sélection des questions : pas de répétition, plus anciennes d'abord, thèmes/difficultés équilibrés, sœurs séparées.
const { test } = require("node:test");
const assert = require("node:assert");
const { pick, pickTheme } = require("../lib/pick");
const { quiz } = require("../data/questions");
const party = require("../data/party");

const ids = new WeakMap();
let next = 0;
const qid = (x) => (ids.has(x) ? ids.get(x) : (ids.set(x, "q" + next++), ids.get(x)));
// Joueur avec la mémoire du téléphone (Map id -> ordre)
const player = () => ({ seen: new Map(), seenMax: 0 });
const remember = (p, list) => list.forEach((x) => { const id = qid(x); p.seen.delete(id); p.seen.set(id, ++p.seenMax); });

function play(pool, n, games, players, roomSeen = new Set()) {
  const all = [];
  for (let g = 0; g < games; g++) {
    const list = pick(pool, n, { players, roomSeen, qid }).map((o) => o.x);
    list.forEach((x) => roomSeen.add(x));
    players.forEach((p) => remember(p, list));
    all.push(list);
  }
  return all;
}

test("aucune répétition tant que la banque n'est pas épuisée (nouvelles salles à chaque partie)", () => {
  const ps = [player(), player(), player()];
  const games = Math.floor(quiz.length / 10);
  const seen = new Set();
  for (const list of play(quiz, 10, games, ps).map((l) => l)) for (const x of list) {
    assert.ok(!seen.has(x), "question répétée : " + x.q.fr);
    seen.add(x);
  }
  // pareil dans les petits jeux
  for (const pool of [party.bluff, party.who, party.same]) {
    const s = new Set(), p = [player()];
    for (const list of play(pool, 10, Math.floor(pool.length / 10), p)) for (const x of list) { assert.ok(!s.has(x)); s.add(x); }
  }
});

test("une fois tout vu, les questions vues il y a le plus longtemps reviennent d'abord", () => {
  const pool = party.bluff.slice(0, 100); // 10 parties pile pour tout voir une fois
  const p = player();
  const first = play(pool, 10, 1, [p])[0];
  play(pool, 10, Math.ceil(pool.length / 10) - 1, [p]); // tout le reste
  const again = pick(pool, 10, { players: [p], qid }).map((o) => o.x);
  const firstSet = new Set(first);
  assert.ok(again.filter((x) => firstSet.has(x)).length >= 8, "les plus anciennes doivent revenir en premier");
});

test("une question déjà posée dans la salle passe après tout le reste", () => {
  const room = new Set(quiz.slice(0, quiz.length - 5));
  const list = pick(quiz, 5, { roomSeen: room, qid }).map((o) => o.x);
  list.forEach((x) => assert.ok(!room.has(x)));
});

test("thèmes équilibrés et jamais deux fois le même thème d'affilée en « tous thèmes »", () => {
  for (let k = 0; k < 50; k++) {
    const list = pick(quiz, 10, { qid }).map((o) => o.x);
    const count = {};
    list.forEach((x) => (count[x.t] = (count[x.t] || 0) + 1));
    assert.ok(Math.max(...Object.values(count)) <= 1, "10 questions = 10 thèmes différents (20 thèmes disponibles)");
    for (let i = 1; i < list.length; i++) assert.notStrictEqual(list[i].t, list[i - 1].t);
  }
});

test("jamais deux questions sœurs (même réponse) dans une partie", () => {
  const pool = [
    { t: "music", q: { fr: "A" }, show: { fr: "Stromae" } }, { t: "music", q: { fr: "B" }, show: { fr: "Stromae" } },
    { t: "music", q: { fr: "C" }, show: { fr: "Adele" } }, { t: "music", q: { fr: "D" }, show: { fr: "Queen" } },
  ];
  for (let k = 0; k < 30; k++) {
    const list = pick(pool, 3, { qid }).map((o) => o.x.show.fr);
    assert.strictEqual(new Set(list).size, 3);
  }
  // banque trop petite : on complète quand même
  assert.strictEqual(pick(pool, 4, { qid }).length, 4);
});

test("difficultés mélangées et progression douce", () => {
  const pool = [];
  for (let i = 0; i < 300; i++) pool.push({ t: "t" + (i % 6), q: { fr: "q" + i }, show: { fr: "a" + i }, d: 1 + (Math.floor(i / 6) % 3) });
  let early = 0, late = 0;
  for (let k = 0; k < 40; k++) {
    const list = pick(pool, 10, { qid }).map((o) => o.x);
    const c = { 1: 0, 2: 0, 3: 0 };
    list.forEach((x) => c[x.d]++);
    assert.ok(c[1] >= 3 && c[2] >= 3 && c[3] >= 1, JSON.stringify(c));
    early += list.slice(0, 3).reduce((s, x) => s + x.d, 0);
    late += list.slice(-3).reduce((s, x) => s + x.d, 0);
  }
  assert.ok(late > early, "plus difficile vers la fin");
});

test("questions périmées écartées", () => {
  const pool = [{ q: { fr: "old" }, until: "2000-01-01" }, { q: { fr: "a" } }, { q: { fr: "b" } }];
  for (let k = 0; k < 20; k++) assert.ok(pick(pool, 2, { qid }).every((o) => o.x.q.fr !== "old"));
});

test("thème au hasard : privilégie les thèmes encore inédits", () => {
  const themes = ["a", "b"];
  const pools = { a: Array.from({ length: 50 }, (_, i) => ({ q: { fr: "a" + i } })), b: Array.from({ length: 50 }, (_, i) => ({ q: { fr: "b" + i } })) };
  const p = player();
  remember(p, pools.a);
  let b = 0;
  for (let k = 0; k < 200; k++) if (pickTheme(themes, (t) => pools[t], [p], qid) === "b") b++;
  assert.ok(b > 180);
});
