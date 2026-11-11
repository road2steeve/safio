// SAFIO Blind Test : validation des réponses, points, secret de la réponse (téléphones et télé).
const { test } = require("node:test");
const assert = require("node:assert");
const { blindtest: bt, matches, partsFor } = require("../games/blindtest");
const { ALL, CATS, SONGS } = require("../data/blindtest");
const { publicGame } = require("../lib/tv");

const song = (title) => ALL.find((x) => (typeof x.t === "object" ? Object.values(x.t) : [x.t]).includes(title));

test("Listes : 8 catégories, chaque chanson a un titre, une année plausible et une catégorie", () => {
  assert.strictEqual(CATS.length, 8);
  for (const c of CATS) assert.ok(SONGS[c].length >= 20, `${c} : au moins 20 titres`);
  for (const s of ALL) {
    assert.ok(s.t && s.c, "titre et catégorie");
    assert.ok(Number.isInteger(s.y) && s.y >= 1930 && s.y <= 2025, `année de ${JSON.stringify(s.t)}`);
    if (s.c === "disney" || s.c === "films") assert.ok(s.w, `œuvre pour ${JSON.stringify(s.t)}`);
  }
});

test("Réponses : tolérant (accents, majuscules, petite faute) mais pas laxiste", () => {
  const ok = (t, a, p) => assert.ok(matches(a, song(t), p), `« ${a} » devrait valider ${t} (${p})`);
  const ko = (t, a, p) => assert.ok(!matches(a, song(t), p), `« ${a} » ne doit PAS valider ${t} (${p})`);
  ok("Bohemian Rhapsody", "bohemian rapsody", "title");
  ok("Bohemian Rhapsody", "BOHEMIAN RHAPSODY !", "title");
  ok("Bohemian Rhapsody", "Queen", "artist");
  ok("Désenchantée", "desenchantee", "title");
  ok("Another Brick in the Wall (Part 2)", "Another brick in the wall", "title");
  ok("Crazy in Love", "Beyonce", "artist");
  ok("Y.M.C.A.", "ymca", "title");
  ok("Let It Go", "Libérée délivrée", "title");
  ok("Let It Go", "la reine des neiges", "work");
  ok("Let It Go", "Frozen", "work");
  ok("Star Wars – Main Title", "La guerre des étoiles", "title");
  ok("Take On Me", "aha", "artist");
  ok("Despacito", "despasito", "title");
  ko("Bohemian Rhapsody", "bohemian", "title");
  ko("Bohemian Rhapsody", "Green", "artist");
  ko("Hakuna Matata", "Aladdin", "work");
  ko("ABC", "abd", "title");
  ko("Uptown Funk", "Bruno Mars", "artist");
  ko("Africa", "", "title");
  ko("Rasputin", "Boney", "artist");
});

test("Format : Disney et films demandent le film en Auto ; artiste inconnu -> on demande le film", () => {
  assert.deepStrictEqual(partsFor(song("Hakuna Matata"), "auto"), ["work"]);
  assert.deepStrictEqual(partsFor(song("Africa"), "auto"), ["title", "artist"]);
  assert.deepStrictEqual(partsFor(song("Hakuna Matata"), "artist"), ["work"]);
  assert.deepStrictEqual(partsFor(song("Africa"), "work"), ["title"]);
});

// Petite salle simulée (sans serveur)
function fakeRoom(settings) {
  const players = new Map(["dj", "a", "b"].map((pid) => [pid, { pid, connected: true, score: 0 }]));
  const room = { code: "TEST", game: "blindtest", hostPid: "dj", phase: "lobby", players, settings: bt.clean(settings, bt.defaults), timer: null };
  const ctx = {
    broadcast() {}, review(r) { r.phase = "review"; }, finish(r) { r.phase = "final"; },
    play(r, sec, fn) { r.phase = "play"; r.g.deadline = Date.now() + sec * 1000; r.onEnd = fn; },
    setDeadline(r, sec, fn) { r.g.deadline = Date.now() + sec * 1000; r.onEnd = fn; },
    pickQuestions(r, pool, n) { return pool.filter((x) => x.t === "Africa").concat(pool).slice(0, n); },
  };
  return { room, ctx };
}
const viewFor = (room, pid) => { const v = { phase: room.phase }; bt.view(room, v, pid); return v; };

test("Secret : avant la révélation, seul le DJ voit le morceau (ni les joueurs, ni la télé)", () => {
  const { room, ctx } = fakeRoom({ cats: ["y80"], input: "choice" });
  bt.start(room, ctx);
  const title = room.g.song.t;
  const has = (v) => JSON.stringify(v).includes(title) || JSON.stringify(v).includes('"artist":"Toto"');
  assert.ok(has(viewFor(room, "dj")), "le DJ voit le morceau à lancer");
  for (const pid of ["a", "b"]) assert.ok(!JSON.stringify(viewFor(room, pid).cue), `${pid} ne voit pas le morceau`);
  bt.act(room, "dj", { type: "go" }, ctx);
  assert.strictEqual(room.g.step, "listen");
  for (const pid of ["a", "b", "\u0000tv"]) {
    const v = viewFor(room, pid);
    assert.ok(!v.cue && !v.bt.reveal && !v.bt.res && v.bt.right === undefined, `${pid} : rien de la réponse pendant l'écoute`);
  }
  const tvView = publicGame({ ...viewFor(room, "\u0000tv"), phase: "play" });
  assert.ok(!("cue" in tvView) && !("mine" in tvView) && !("playlist" in tvView), "la télé ne reçoit que la partie publique");
});

test("Points : rapide > lent, bonus titre + artiste, le DJ ne joue pas", () => {
  const { room, ctx } = fakeRoom({ cats: ["y80"], input: "free", fmt: "both", pts: 100, bonus: 50, flash: 25, time: 30 });
  bt.start(room, ctx);
  bt.act(room, "dj", { type: "go" }, ctx);
  bt.act(room, "dj", { type: "answer", values: { title: "Africa", artist: "Toto" } }, ctx);
  assert.ok(!("dj" in room.g.res), "le DJ ne peut pas répondre");
  bt.act(room, "a", { type: "answer", values: { title: "africa", artist: "toto" } }, ctx);
  room.g.startedAt -= 20000; // b répond 20 s plus tard
  bt.act(room, "b", { type: "answer", values: { title: "Afrika", artist: "Survivor" } }, ctx);
  assert.strictEqual(room.phase, "review", "tout le monde a répondu : révélation");
  const g = room.g.gains;
  assert.ok(g.a >= 100 + 50, `a : titre + artiste + bonus (${g.a})`);
  assert.ok(g.b > 0 && g.b < 50, `b : seulement le titre, tard (${g.b})`);
  // L'organisateur corrige un verdict
  bt.hostAct(room, { type: "judge", pid: "b", part: "artist", ok: true }, ctx);
  assert.ok(room.g.gains.b > g.b, "correction prise en compte");
});

test("Buzzer et pause : le premier buzz validé gagne, la pause ne compte pas", () => {
  const { room, ctx } = fakeRoom({ cats: ["y80"], input: "buzz" });
  bt.start(room, ctx);
  bt.act(room, "dj", { type: "go" }, ctx);
  bt.act(room, "dj", { type: "pause" }, ctx);
  assert.ok(room.g.paused && !room.g.deadline, "en pause");
  bt.act(room, "a", { type: "buzz" }, ctx);
  assert.strictEqual(room.g.buzz.length, 0, "pas de buzz pendant la pause");
  bt.act(room, "dj", { type: "resume" }, ctx);
  bt.act(room, "a", { type: "buzz" }, ctx);
  bt.act(room, "b", { type: "buzz" }, ctx);
  bt.act(room, "dj", { type: "verdict", pid: "b", ok: true }, ctx);
  assert.strictEqual(room.phase, "play", "on ne peut valider que le premier en attente");
  bt.act(room, "dj", { type: "verdict", pid: "a", ok: false }, ctx);
  bt.act(room, "dj", { type: "verdict", pid: "b", ok: true }, ctx);
  assert.strictEqual(room.phase, "review");
  assert.ok(room.g.gains.b > 0 && !room.g.gains.a);
});

test("Ma playlist : pas de liste SAFIO, buzzer imposé", () => {
  const s = bt.clean({ cats: ["own", "y80"], input: "free" }, bt.defaults);
  assert.deepStrictEqual(s.cats, ["own"]);
  assert.strictEqual(s.input, "buzz");
});
