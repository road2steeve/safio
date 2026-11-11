// SAFIO Blind Test (mode Soirée) : la musique vient de l'abonnement du DJ, SAFIO gère tout le reste.
// Aucun son n'est diffusé par SAFIO ici : le DJ lance le morceau dans son appli, puis appuie sur « La musique joue ».
const { CATS, AUTO, ALL } = require("../data/blindtest");
const { shuffle, norm, lev, clamp } = require("../lib/util");

const FMTS = ["auto", "title", "artist", "both", "work"];
const INPUTS = ["free", "choice", "buzz"];
const FLASH_MS = 5000; // bonus éclair : bonne réponse en moins de 5 s
const LANGS = ["fr", "en", "es"];

const vals = (x) => (x && typeof x === "object" ? LANGS.map((l) => x[l]).filter(Boolean) : x ? [x] : []);
// « Titre (Remastered) » -> accepte aussi « Titre » ; « A feat. B » -> accepte aussi « A »
const stripParen = (s) => String(s).replace(/\s*\([^)]*\)\s*/g, " ").trim();
const mainArtist = (s) => String(s).split(/\s+(?:feat\.?|ft\.?|featuring)\s+/i)[0].trim();
const groupMembers = (s) => mainArtist(s).split(/\s*(?:&|\band\b|\bet\b|\by\b)\s*/i).map((x) => x.trim()).filter((x) => x.length > 2);

function accepted(song, part) {
  let list = [];
  if (part === "title") {
    list = [...vals(song.t), ...(song.alt || [])];
    if (song.inst && song.w) list.push(...vals(song.w), ...(song.altW || []));
  } else if (part === "artist") {
    if (song.a) list = [song.a, mainArtist(song.a), ...groupMembers(song.a), ...(song.altA || [])];
  } else if (part === "work") {
    list = [...vals(song.w), ...(song.altW || [])];
  }
  const out = new Set();
  for (const x of list) { out.add(x); out.add(stripParen(x)); }
  return [...out].filter((x) => norm(x));
}

// Tolérant (majuscules, accents, ponctuation, articles, petite faute) mais pas laxiste :
// pas de faute permise sous 5 lettres, 1 faute par tranche de 5 lettres au-delà.
function matches(answer, song, part) {
  const x = norm(answer);
  if (!x) return false;
  return accepted(song, part).some((ok) => {
    const y = norm(ok);
    if (x === y) return true;
    if (/^\d+$/.test(y)) return false;
    return lev(x, y) <= Math.floor(y.length / 5);
  });
}

// Ce qu'on demande pour cette chanson, selon le format choisi (et ce que la chanson permet)
function partsFor(song, fmt) {
  if (!song) return [];
  if (fmt === "auto") fmt = (AUTO[song.c] || ["both"])[0];
  let p = fmt === "both" ? ["title", "artist"] : [fmt];
  if (p.includes("artist") && !song.a) p = p.map((x) => (x === "artist" ? (song.w ? "work" : "title") : x));
  if (p.includes("work") && !song.w) p = p.map((x) => (x === "work" ? "title" : x));
  return [...new Set(p)];
}
// Texte d'une proposition (4 choix) : selon ce qu'on demande
function labelOf(song, parts) {
  const pick = (part) => (part === "title" ? song.t : part === "artist" ? song.a : song.w);
  if (parts.length === 1) return pick(parts[0]);
  const a = pick(parts[0]), b = pick(parts[1]);
  const o = {};
  for (const l of LANGS) o[l] = `${typeof a === "object" ? a[l] || a.en : a} — ${typeof b === "object" ? b[l] || b.en : b}`;
  return o;
}
const keyOf = (lbl) => norm(typeof lbl === "object" ? lbl.en : lbl);

function reveal(song) {
  if (!song || song.own) return { own: true };
  return { title: song.t, artist: song.a || null, year: song.y, work: song.w || null, cat: song.c };
}

const bt = {
  minPlayers: 2,
  defaults: { cats: ["y80", "y90", "y00"], count: 10, time: 30, fmt: "auto", input: "free", dj: "host", pts: 100, bonus: 50, flash: 25 },
  clean(s, d) {
    let cats = Array.isArray(s.cats) ? [...new Set(s.cats.filter((c) => CATS.includes(c) || c === "own"))] : d.cats;
    if (cats.includes("own")) cats = ["own"]; // « Ma playlist » : aucune liste SAFIO
    if (!cats.length) cats = d.cats;
    const one = (v, list, def) => (list.includes(v) ? v : def);
    const out = {
      cats,
      count: clamp(s.count, 3, 30, d.count),
      time: clamp(s.time, 10, 90, d.time),
      fmt: one(s.fmt, FMTS, d.fmt),
      input: one(s.input, INPUTS, d.input),
      dj: one(s.dj, ["host", "rotate"], d.dj),
      pts: clamp(s.pts, 50, 200, d.pts),
      bonus: clamp(s.bonus, 0, 100, d.bonus),
      flash: clamp(s.flash, 0, 50, d.flash),
    };
    if (cats[0] === "own") out.input = "buzz"; // sans liste, seul le buzzer (validé à l'oral par le DJ) est possible
    return out;
  },

  start(room, ctx) {
    const s = room.settings;
    let list;
    if (s.cats[0] === "own") list = Array.from({ length: s.count }, () => ({ own: true }));
    else {
      const pool = ALL.filter((x) => s.cats.includes(x.c));
      list = ctx.pickQuestions(room, pool, s.count);
    }
    room.g = { list, index: -1, total: list.length, djTurn: -1, gains: {} };
    this.nextRound(room, ctx);
  },

  // Le DJ de ce morceau : l'organisateur, ou chacun son tour (parmi les joueurs connectés)
  pickDj(room) {
    const g = room.g;
    if (room.settings.dj === "host") return room.hostPid;
    const on = [...room.players.values()].filter((p) => p.connected);
    if (!on.length) return room.hostPid;
    g.djTurn = (g.djTurn + 1) % on.length;
    return on[g.djTurn].pid;
  },

  nextRound(room, ctx) {
    const g = room.g;
    g.index++;
    if (g.index >= g.total) return ctx.finish(room);
    const song = g.list[g.index];
    Object.assign(g, {
      song, dj: this.pickDj(room), step: "cue", parts: partsFor(song, room.settings.fmt),
      res: {}, buzz: [], winner: null, gains: {}, startedAt: 0, paused: null, choices: null, deadline: null,
    });
    if (room.settings.input === "choice" && !song.own) {
      // 3 leurres de la même catégorie (ou des catégories choisies), sans doublon de libellé
      const right = labelOf(song, g.parts);
      const seen = new Set([keyOf(right)]);
      const lures = [];
      // D'abord la même catégorie (sinon la décennie trahirait la réponse), puis les autres catégories choisies
      const same = shuffle(ALL.filter((y) => y !== song && y.c === song.c));
      const other = shuffle(ALL.filter((y) => y.c !== song.c && room.settings.cats.includes(y.c)));
      for (const x of [...same, ...other]) {
        if (lures.length >= 3) break;
        const p = partsFor(x, room.settings.fmt);
        if (p.join() !== g.parts.join()) continue;
        const l = labelOf(x, p), k = keyOf(l);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        lures.push(l);
      }
      g.choices = shuffle([{ l: right, ok: true }, ...lures.map((l) => ({ l, ok: false }))]);
    }
    // Pas de chrono tant que le DJ n'a pas lancé la musique
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
    room.phase = "play";
    ctx.broadcast(room);
  },

  isDj: (room, pid) => room.g && (room.g.dj === pid || room.hostPid === pid),
  players(room) {
    return [...room.players.values()].filter((p) => p.connected && p.pid !== room.g.dj);
  },

  act(room, pid, d, ctx, reply) {
    const g = room.g, s = room.settings;
    if (!g || room.phase !== "play") return;
    const dj = this.isDj(room, pid);
    // ----- Actions du DJ (ou de l'organisateur) -----
    if (d.type === "go" && dj && g.step === "cue") {
      g.step = "listen";
      g.startedAt = Date.now();
      return ctx.play(room, s.time, () => this.endRound(room, ctx));
    }
    if (d.type === "pause" && dj && g.step === "listen" && !g.paused) {
      g.paused = { at: Date.now(), left: Math.max(1000, g.deadline - Date.now()) };
      if (room.timer) clearTimeout(room.timer);
      room.timer = null;
      g.deadline = null;
      return ctx.broadcast(room);
    }
    if (d.type === "resume" && dj && g.paused) {
      g.startedAt += Date.now() - g.paused.at; // la pause ne compte pas dans le temps de réponse
      const left = g.paused.left;
      g.paused = null;
      ctx.setDeadline(room, left / 1000, () => this.endRound(room, ctx));
      return ctx.broadcast(room);
    }
    if (d.type === "reveal" && dj && g.step === "listen") return this.endRound(room, ctx);
    if (d.type === "verdict" && dj && g.step === "listen") {
      const b = g.buzz.find((x) => !x.out && x.ok === undefined);
      if (!b || b.pid !== d.pid) return;
      b.ok = !!d.ok;
      if (b.ok) { g.winner = b.pid; return this.endRound(room, ctx); }
      b.out = true;
      if (this.players(room).every((p) => g.buzz.some((x) => x.pid === p.pid && x.out))) return this.endRound(room, ctx);
      return ctx.broadcast(room);
    }
    // ----- Joueurs -----
    if (pid === g.dj || g.step !== "listen" || g.paused) return;
    const time = Date.now() - g.startedAt;
    if (d.type === "buzz" && s.input === "buzz") {
      if (g.buzz.some((x) => x.pid === pid)) return;
      g.buzz.push({ pid, time });
      reply && reply({ ok: true });
      return ctx.broadcast(room);
    }
    if (d.type !== "answer" || s.input === "buzz" || pid in g.res) return;
    const r = { time, ok: {}, txt: {} };
    if (s.input === "choice") {
      const c = g.choices && g.choices[Number(d.choice)];
      if (!c) return;
      r.pick = Number(d.choice);
      for (const p of g.parts) r.ok[p] = !!c.ok;
    } else {
      const v = d.values && typeof d.values === "object" ? d.values : { [g.parts[0]]: d.value };
      for (const p of g.parts) {
        r.txt[p] = String(v[p] ?? "").trim().slice(0, 80);
        r.ok[p] = matches(r.txt[p], g.song, p);
      }
    }
    g.res[pid] = r;
    reply && reply({ ok: true });
    ctx.broadcast(room);
    if (this.players(room).every((p) => p.pid in g.res)) this.endRound(room, ctx);
  },

  // L'organisateur peut corriger un verdict (faute de frappe trop grosse, variante non prévue…)
  hostAct(room, d, ctx) {
    const g = room.g;
    if (!g || room.phase !== "review" || d.type !== "judge") return;
    const r = g.res[d.pid];
    if (!r) return;
    const part = g.parts.includes(d.part) ? d.part : null;
    for (const p of g.parts) if (!part || p === part) r.ok[p] = !!d.ok;
    this.computeGains(room);
    ctx.broadcast(room);
  },

  endRound(room, ctx) {
    const g = room.g;
    if (room.phase !== "play") return;
    if (g.step === "cue") g.skipped = true; // morceau passé sans être joué
    g.step = "reveal";
    g.paused = null;
    this.computeGains(room);
    ctx.review(room);
  },

  computeGains(room) {
    const g = room.g, s = room.settings;
    const total = s.time * 1000, min = Math.round(s.pts * 0.3);
    const base = (t) => Math.round(s.pts - (s.pts - min) * Math.min(1, Math.max(0, t) / total));
    g.gains = {};
    if (s.input === "buzz") {
      const b = g.winner && g.buzz.find((x) => x.pid === g.winner);
      if (b) g.gains[b.pid] = base(b.time) + (b.time < FLASH_MS ? s.flash : 0);
      return;
    }
    for (const [pid, r] of Object.entries(g.res)) {
      const found = g.parts.filter((p) => r.ok[p]).length;
      if (!found) { g.gains[pid] = 0; continue; }
      const all = found === g.parts.length;
      let pts = Math.round((base(r.time) * found) / g.parts.length);
      if (all && g.parts.length > 1 && s.input === "free") pts += s.bonus;
      if (all && r.time < FLASH_MS) pts += s.flash;
      g.gains[pid] = pts;
    }
  },

  view(room, v, pid) {
    const g = room.g;
    const listen = g.step === "listen", rev = room.phase === "review";
    v.step = g.step;
    v.answered = listen ? Object.keys(g.res).concat(g.buzz.map((b) => b.pid)) : [];
    // Partie publique : identique pour tout le monde (et pour la télé)
    v.bt = {
      step: g.step, dj: g.dj, cat: g.song.own ? "own" : g.song.c, parts: g.parts, input: room.settings.input,
      paused: g.paused ? g.paused.left : 0,
      buzz: g.buzz.map((b) => ({ pid: b.pid, time: b.time, out: !!b.out, ok: b.ok === true })),
    };
    if (g.choices && (listen || rev)) v.bt.choices = g.choices.map((c) => c.l);
    if (rev) {
      v.bt.reveal = reveal(g.song);
      v.bt.skipped = !!g.skipped;
      v.bt.winner = g.winner;
      if (g.choices) v.bt.right = g.choices.findIndex((c) => c.ok);
      v.bt.res = Object.fromEntries(Object.entries(g.res).map(([id, r]) => [id, { time: r.time, ok: r.ok, txt: r.txt, pick: r.pick }]));
      v.gains = g.gains;
    }
    // Partie privée
    if (pid === g.dj && !rev) v.cue = reveal(g.song); // le DJ voit le morceau à lancer
    if (pid === g.dj && g.step === "cue" && room.settings.dj === "host" && !g.song.own) {
      v.playlist = g.list.map((x, i) => ({ n: i + 1, ...reveal(x), done: i < g.index }));
    }
    if (g.res[pid] && listen) v.mine = { sent: true, pick: g.res[pid].pick, txt: g.res[pid].txt };
    if (listen && room.settings.input === "buzz") {
      const b = g.buzz.findIndex((x) => x.pid === pid);
      if (b >= 0) v.mine = { buzz: b + 1, out: !!g.buzz[b].out };
    }
  },
};

module.exports = { blindtest: bt, matches, partsFor, accepted };
