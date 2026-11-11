// Serveur temps réel : salons, joueurs, jeux, mode solo, parties rapides en ligne.
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const qa = require("./games/qa");
const bac = require("./games/bac");
const party = require("./games/party");
const torpille = require("./games/torpille");
const { blindtest } = require("./games/blindtest");
const { filterText } = require("./lib/moderation");
const { pick, pickTheme } = require("./lib/pick");
const leaderboard = require("./lib/leaderboard");
const { createTv } = require("./lib/tv");
const { THEMES } = require("./data/questions");

const GAMES = {
  quiz: qa.quiz, mytho: party.mytho, bac, duel: qa.duel,
  brain: party.brain, youre: party.youre, closest: qa.closest, torpille, blindtest,
};

// Maximum réaliste par jeu (au-delà, le jeu devient pénible sur un téléphone). Le salon, lui, accepte 30 personnes.
const MAX_PLAYERS = { quiz: 16, mytho: 12, bac: 16, torpille: 8 };
const ROOM_MAX = 30;

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

app.use(express.static(path.join(__dirname, "public")));
app.use("/flags", express.static(path.join(path.dirname(require.resolve("flag-icons/package.json")), "flags", "4x3"), { maxAge: "7d" }));
app.get("/qr", async (req, res) => {
  const text = String(req.query.u || "").slice(0, 300);
  if (!/^https?:\/\//.test(text)) return res.status(400).end();
  res.type("svg").send(await QRCode.toString(text, { type: "svg", margin: 1 }));
});
app.get("/health", (_, res) => res.send("ok"));
// SAFIO TV : la page de l'écran collectif
app.get("/tv", (_, res) => res.sendFile(path.join(__dirname, "public", "tv.html")));

// ---------- Salons ----------
const rooms = new Map();
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I ni O (confusion avec 1 et 0)
function newCode() {
  let c;
  do c = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  while (rooms.has(c));
  return c;
}
const SOLO = { count: 10, time: 20 }; // réglages fixes du solo, pour un classement équitable
const QUICK = { count: 7, time: 10, theme: "all" };

const cleanSettings = (game, s = {}) => GAMES[game].clean(s, GAMES[game].defaults);
const connected = (room) => [...room.players.values()].filter((p) => p.connected);

function newRoom(game, hostPid, extra = {}) {
  const r = { code: newCode(), game, hostPid, phase: "lobby", settings: cleanSettings(game), players: new Map(), g: null, timer: null, createdAt: Date.now(), ...extra };
  rooms.set(r.code, r);
  return r;
}
const cleanName = (n) => filterText(String(n || "").trim().slice(0, 16)).trim() || "Player";
const cleanAv = (a) => String(a || "🙂").slice(0, 4);
const cleanAc = (c) => (Number.isInteger(c) && c >= 0 && c < 10 ? c : 0); // couleur de fond de l'avatar
// Niveau / XP (gardés sur le téléphone du joueur, renvoyés au serveur pour l'affichage)
const cleanXp = (x) => (Number.isFinite(+x) ? Math.max(0, Math.min(1e7, Math.floor(+x))) : 0);
// Questions déjà vues par ce téléphone (identifiants courts)
const SEEN_MAX = 15000;
const cleanSeen = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.length <= 12).slice(-SEEN_MAX) : []);
// Mémoire des questions vues : identifiant -> ordre (plus grand = vue plus récemment)
function addSeen(p, ids) {
  if (!p.seen) { p.seen = new Map(); p.seenMax = 0; }
  for (const id of ids) { p.seen.delete(id); p.seen.set(id, ++p.seenMax); }
  while (p.seen.size > SEEN_MAX) p.seen.delete(p.seen.keys().next().value);
}
function levelOf(xp) {
  let lvl = 1, need = 60;
  while (xp >= need) { xp -= need; lvl++; need = 60 + 30 * (lvl - 1); }
  return lvl;
}
function addPlayer(r, { pid, name, avatar, ac, xp, seen }) {
  if (!r.players.has(pid)) r.players.set(pid, { pid, name: cleanName(name), avatar: cleanAv(avatar), ac: cleanAc(ac), score: 0, ready: false, xp: cleanXp(xp) });
  if (!r.players.get(pid).seen) addSeen(r.players.get(pid), cleanSeen(seen));
  else {
    const p = r.players.get(pid);
    if (xp !== undefined) p.xp = Math.max(p.xp || 0, cleanXp(xp));
    if (seen) { const known = p.seen || new Map(); addSeen(p, cleanSeen(seen).filter((id) => !known.has(id))); }
  }
  return r.players.get(pid);
}
// Identifiant stable d'une question (indépendant de sa position dans les fichiers)
const QID = new WeakMap();
function qid(x) {
  if (!x || typeof x !== "object") return String(x).slice(0, 12);
  if (QID.has(x)) return QID.get(x);
  const src = JSON.stringify([x.q && x.q.fr, x.img || "", x.fr || "", x.t || ""]) || JSON.stringify(x);
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
  const id = (h >>> 0).toString(36);
  QID.set(x, id);
  return id;
}
// XP gagnés à la fin d'une partie
function giveXp(room) {
  const ranked = [...room.players.values()].sort((a, b) => b.score - a.score);
  const many = ranked.length >= 2;
  room.xpId = Math.random().toString(36).slice(2, 10);
  room.xpGain = {};
  ranked.forEach((p, i) => {
    const pts = room.solo ? p.score / 150 : p.score; // solo : ~150 points par bonne réponse
    let g = 20 + Math.round(Math.max(0, pts) * 4);
    if (many && p.score > 0) g += [30, 18, 10][i] || 0;
    if (!p.connected) g = Math.round(g / 2);
    g = Math.min(250, g);
    const before = p.xp || 0;
    p.xp = before + g;
    room.xpGain[p.pid] = { g, before, after: p.xp, up: levelOf(p.xp) - levelOf(before) };
  });
}

function viewOf(room, pid) {
  const v = {
    code: room.code, hostPid: room.hostPid, game: room.game, phase: room.phase, solo: !!room.solo, auto: !!room.auto,
    settings: room.settings, now: Date.now(), result: room.result, coval: room.coval || [],
    recap: room.phase === "final" ? room.recap || null : null,
    players: [...room.players.values()].map((p) => ({ pid: p.pid, name: p.name, avatar: p.avatar, ac: p.ac || 0, lvl: levelOf(p.xp || 0), ready: !!p.ready, score: p.score, connected: p.connected })),
  };
  if (room.screens && room.screens.size) Object.assign(v, tv.playerInfo(room));
  if (room.phase === "final" && room.xpGain && room.xpGain[pid]) v.xp = { id: room.xpId, ...room.xpGain[pid] };
  if (room.g && room.phase !== "lobby" && room.phase !== "final") {
    v.round = room.g.index + 1;
    v.total = room.g.total;
    v.deadline = room.g.deadline;
    v.answered = [];
    GAMES[room.game].view(room, v, pid);
  }
  return v;
}
// Chaque joueur reçoit sa propre vue (ex. : sa flotte à Torpille)
function broadcast(room) {
  for (const p of room.players.values()) if (p.socketId) io.to(p.socketId).emit("state", viewOf(room, p.pid));
  tv.broadcastTv(room);
}
const tv = createTv({ io, rooms, newRoom, viewOf });
// Supprime un salon (et prévient ses écrans TV)
function dropRoom(room) {
  clearTimer(room);
  rooms.delete(room.code);
  tv.roomGone(room);
}
function clearTimer(room) {
  clearTimeout(room.timer);
  room.timer = null;
}
function setDeadline(room, seconds, fn) {
  clearTimer(room);
  room.g.deadline = Date.now() + seconds * 1000;
  room.timer = setTimeout(fn, seconds * 1000 + 300);
}

// Outils donnés aux jeux
const ctx = {
  broadcast,
  setDeadline,
  emit: (room, ev) => io.to(room.code).emit(ev),
  everyone: (room, test) => connected(room).every(test),
  play(room, seconds, onEnd) {
    room.phase = "play";
    setDeadline(room, seconds, onEnd);
    broadcast(room);
  },
  review(room) {
    clearTimer(room);
    room.phase = "review";
    room.g.deadline = null;
    if (room.auto) {
      // Solo et parties rapides : on enchaîne tout seul
      room.g.deadline = Date.now() + (room.solo ? 3500 : 5000);
      room.timer = setTimeout(() => nextStep(room), room.solo ? 3500 : 5000);
    }
    broadcast(room);
  },
  finish(room) {
    clearTimer(room);
    room.phase = "final";
    room.g = null;
    try { giveXp(room); } catch (e) { console.error(e); }
    if (room.solo) submitSolo(room);
    broadcast(room);
  },
  // Sélection commune à tous les jeux (voir lib/pick.js) : inédites d'abord, puis les plus anciennes,
  // thèmes et difficultés équilibrés, jamais deux questions sœurs, jamais une question déjà posée dans la salle.
  pickQuestions(room, pool, n) {
    room.seen = room.seen || new Set();
    const ps = [...room.players.values()].filter((p) => p.connected !== false);
    const list = pick(pool, n, { players: ps, roomSeen: room.seen, qid });
    const ids = list.map((o) => o.id);
    for (const o of list) room.seen.add(o.x);
    for (const p of room.players.values()) addSeen(p, ids);
    io.to(room.code).emit("seenAdd", ids);
    return list.map((o) => o.x);
  },
  // Thème « au hasard » : un thème où il reste des questions inédites pour le groupe
  pickTheme(room, themes, poolOf) {
    const ps = [...room.players.values()].filter((p) => p.connected !== false);
    return pickTheme(themes, poolOf, ps, qid);
  },
};

function startGame(room) {
  for (const p of room.players.values()) { p.score = 0; p.ready = false; }
  room.result = null;
  room.recap = null;
  GAMES[room.game].start(room, ctx);
}
function nextStep(room) {
  const mod = GAMES[room.game];
  if (room.phase === "review") {
    const gains = mod.gains ? mod.gains(room) : room.g.gains || {};
    for (const [pid, pts] of Object.entries(gains)) {
      const p = room.players.get(pid);
      if (p) p.score += pts;
    }
    mod.nextRound(room, ctx);
  } else if (room.phase === "play") {
    mod.forceEnd ? mod.forceEnd(room, ctx) : mod.endRound(room, ctx);
  }
}

async function submitSolo(room) {
  const p = [...room.players.values()][0];
  if (!p) return;
  // Plusieurs thèmes à la fois : le score compte dans le classement « Tous les thèmes »
  const theme = String(room.settings.theme || "all").includes(",") ? "all" : room.settings.theme;
  try {
    await leaderboard.submit({ pid: p.pid, name: p.name, avatar: p.avatar, theme, score: p.score });
    const rows = await leaderboard.top(theme, "all");
    const rank = rows.findIndex((r) => r.pid === p.pid);
    room.result = { score: p.score, rank: rank >= 0 ? rank + 1 : null, theme };
  } catch (e) {
    room.result = { score: p.score, rank: null, theme };
  }
  broadcast(room);
}

// ---------- Parties rapides : file d'attente mondiale ----------
let queue = []; // { socket, pid, name, avatar }
function tryMatch() {
  queue = queue.filter((q) => q.socket.connected);
  io.emit("queueSize", queue.length);
  if (queue.length < 2) return;
  const pair = queue.splice(0, 2);
  const r = newRoom("duel", pair[0].pid, { auto: true, quick: true });
  r.settings = cleanSettings("duel", QUICK);
  for (const q of pair) attach(q.socket, r, addPlayer(r, q));
  r.phase = "starting";
  broadcast(r);
  setTimeout(() => rooms.has(r.code) && startGame(r), 3000);
}

// ---------- Identité des téléphones ----------
// Le « pid » d'un joueur est public (il circule dans la vue de tous) : il ne prouve donc rien.
// Chaque téléphone garde aussi une clé secrète (« key ») ; le premier qui présente un pid fixe sa clé,
// et plus personne ne peut ensuite se faire passer pour ce joueur (ni pour l'organisateur).
const OWNERS_MAX = 200000;
const owners = new Map(); // pid -> clé secrète
function identify(pid, key) {
  if (typeof pid !== "string" || !pid || pid.length > 40 || typeof key !== "string" || !/^[a-f0-9]{32,64}$/.test(key)) return null;
  const k = owners.get(pid);
  if (k !== undefined && k !== key) return null;
  owners.delete(pid);
  owners.set(pid, key);
  if (owners.size > OWNERS_MAX) owners.delete(owners.keys().next().value);
  return pid;
}

// Essais de code de salon : un humain se trompe parfois, un robot essaie des milliers de codes.
const JOIN_WINDOW = 60 * 1000, JOIN_FAILS_IP = 30, JOIN_FAILS_SOCKET = 10;
const joinFails = new Map(); // adresse -> { n, t }
const ipOf = (socket) => {
  const xff = String(socket.handshake.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : socket.handshake.address;
};
const failsOf = (map, k, now) => { const f = map.get(k); return f && now - f.t < JOIN_WINDOW ? f.n : 0; };
function noteFail(map, k, now) {
  let f = map.get(k);
  if (!f || now - f.t >= JOIN_WINDOW) f = { n: 0, t: now };
  f.n++;
  map.set(k, f);
}

// ---------- Connexions ----------
function attach(socket, r, p) {
  socket.data.room = r;
  socket.data.me = p;
  p.socketId = socket.id;
  p.connected = true;
  socket.join(r.code);
  broadcast(r);
}

io.on("connection", (socket) => {
  const R = () => socket.data.room;
  const ME = () => socket.data.me;
  const isHost = () => R() && ME() && R().hostPid === ME().pid;
  const auth = socket.handshake.auth || {};
  const myPid = identify(auth.pid, auth.key); // null : téléphone non reconnu (clé absente ou fausse)
  if (auth.pid && !myPid) socket.emit("reauth");
  const mine = (pid) => !!myPid && pid === myPid;
  const ip = ipOf(socket);
  const myFails = new Map();
  tv.bind(socket, { R, isHost, broadcast });

  socket.on("create", ({ pid, name, avatar, ac, game, xp, seen }, cb) => {
    if (!mine(pid)) return cb && cb({ error: "err_auth" });
    if (!GAMES[game] || !pid) return cb && cb({ error: "err_game" });
    const r = newRoom(game, pid);
    attach(socket, r, addPlayer(r, { pid, name, avatar, ac, xp, seen }));
    cb && cb({ code: r.code });
  });

  socket.on("join", ({ code, pid, name, avatar, ac, xp, seen }, cb) => {
    if (!mine(pid)) return cb && cb({ error: "err_auth" });
    const now = Date.now();
    if (failsOf(joinFails, ip, now) >= JOIN_FAILS_IP || failsOf(myFails, "s", now) >= JOIN_FAILS_SOCKET) return cb && cb({ error: "err_slow" });
    const r = rooms.get(String(code || "").toUpperCase().trim());
    if (!r) {
      noteFail(joinFails, ip, now);
      noteFail(myFails, "s", now);
      return cb && cb({ error: "err_nf" });
    }
    if (!r.players.has(pid)) {
      if (r.solo || r.quick) return cb && cb({ error: "err_private" });
      if (r.banned && r.banned.has(pid)) return cb && cb({ error: "err_banned" });
      if (r.players.size >= ROOM_MAX) return cb && cb({ error: "err_full" });
    }
    // Salle ouverte par une télé : le premier qui arrive devient l'organisateur
    if (!r.hostPid || !r.players.has(r.hostPid)) r.hostPid = pid;
    attach(socket, r, addPlayer(r, { pid, name, avatar, ac, xp, seen }));
    cb && cb({ code: r.code });
  });

  socket.on("solo", ({ pid, name, avatar, ac, theme, xp, seen }, cb) => {
    if (!mine(pid)) return cb && cb({ error: "err_auth" });
    const r = newRoom("duel", pid, { solo: true, auto: true });
    r.settings = cleanSettings("duel", { ...SOLO, theme: theme === "random" ? "all" : theme });
    attach(socket, r, addPlayer(r, { pid, name, avatar, ac, xp, seen }));
    startGame(r);
    cb && cb({ code: r.code });
  });

  socket.on("quick", ({ pid, name, avatar, ac, xp, seen }) => {
    if (!mine(pid) || queue.some((q) => q.pid === pid)) return;
    queue.push({ socket, pid, name, avatar, ac, xp, seen });
    tryMatch();
  });
  socket.on("quickCancel", () => {
    queue = queue.filter((q) => q.socket !== socket);
    io.emit("queueSize", queue.length);
  });

  socket.on("leaderboard", async ({ theme, period }, cb) => {
    try {
      const t = ["_global", ...THEMES, "all"].includes(theme) ? theme : "_global";
      const rows = await leaderboard.top(t, period === "week" ? "week" : "all");
      const pid = myPid;
      cb(rows.map(({ pid: id, name, avatar, score }) => ({ name: filterText(String(name || "")), avatar, score, me: id === pid })));
    } catch {
      cb([]);
    }
  });

  socket.on("settings", ({ game, settings }) => {
    const room = R();
    if (!isHost() || room.auto || (room.phase !== "lobby" && room.phase !== "final")) return;
    if (game && GAMES[game] && game !== room.game) {
      room.game = game;
      room.settings = cleanSettings(game);
    } else room.settings = cleanSettings(room.game, { ...room.settings, ...settings });
    room.phase = "lobby";
    broadcast(room);
  });

  socket.on("start", (_, cb) => {
    const room = R();
    if (!isHost() || (room.phase !== "lobby" && room.phase !== "final")) return;
    const min = GAMES[room.game].minPlayers || 1;
    if (connected(room).length < min) return cb && cb({ error: "err_min", min });
    const max = MAX_PLAYERS[room.game] || ROOM_MAX;
    if (connected(room).length > max) return cb && cb({ error: "err_max", max });
    if (room.solo) {
      room.settings = cleanSettings("duel", { ...SOLO, theme: room.settings.theme });
    }
    startGame(room);
  });

  // Actions de jeu (réponse, vote, tir…)
  socket.on("act", (d, cb) => {
    const room = R(), me = ME();
    if (!room || !me || !room.g || !d) return;
    const reply = (x) => cb && cb(x);
    if (d.type === "judge" || d.type === "merge") {
      if (isHost() && GAMES[room.game].hostAct) GAMES[room.game].hostAct(room, d, ctx);
      return;
    }
    GAMES[room.game].act(room, me.pid, d, ctx, reply);
  });

  socket.on("next", () => {
    if (isHost() && !R().auto) nextStep(R());
  });

  socket.on("lobby", () => {
    const room = R();
    if (!isHost() || room.auto) return;
    clearTimer(room);
    room.phase = "lobby";
    room.g = null;
    for (const p of room.players.values()) p.ready = false;
    broadcast(room);
  });

  // Petit Bac : l'hôte choisit des co-validateurs
  socket.on("coval", (pid) => {
    const room = R();
    if (!isHost() || !room.players.has(pid) || pid === room.hostPid) return;
    room.coval = room.coval || [];
    room.coval = room.coval.includes(pid) ? room.coval.filter((x) => x !== pid) : [...room.coval, pid];
    broadcast(room);
  });

  // Salon : « je suis prêt » et changement de pseudo / avatar
  socket.on("ready", () => {
    const room = R(), me = ME();
    if (!room || !me || room.phase !== "lobby") return;
    me.ready = !me.ready;
    broadcast(room);
  });
  socket.on("profile", ({ name, avatar, ac } = {}) => {
    const room = R(), me = ME();
    if (!room || !me) return;
    if (name !== undefined) me.name = cleanName(name);
    if (avatar !== undefined) me.avatar = cleanAv(avatar);
    if (ac !== undefined) me.ac = cleanAc(ac);
    broadcast(room);
  });

  socket.on("kick", (pid) => {
    const room = R();
    if (!isHost() || pid === ME().pid) return;
    const p = room.players.get(pid);
    if (!p) return;
    room.players.delete(pid);
    (room.banned ||= new Set()).add(pid); // retiré par l'hôte : il ne peut pas revenir dans ce salon
    const ks = p.socketId && io.sockets.sockets.get(p.socketId);
    if (ks) {
      ks.emit("kicked");
      ks.leave(room.code);
      if (ks.data.room === room) ks.data.room = ks.data.me = null;
    }
    broadcast(room);
  });

  socket.on("leave", () => {
    const room = R(), me = ME();
    if (!room || !me) return;
    room.players.delete(me.pid);
    socket.leave(room.code);
    socket.data.room = socket.data.me = null;
    handleHostGone(room);
    if (room.players.size === 0) {
      // Une télé est encore allumée : la salle redevient une salle d'accueil vide, prête pour d'autres joueurs
      if (tv.hasScreen(room)) { clearTimer(room); room.phase = "lobby"; room.g = null; room.hostPid = null; broadcast(room); }
      else dropRoom(room);
    } else broadcast(room);
  });

  socket.on("disconnect", () => {
    queue = queue.filter((q) => q.socket !== socket);
    const room = R(), me = ME();
    if (!room || !me || me.socketId !== socket.id) return;
    me.connected = false;
    broadcast(room);
    // Si l'hôte ne revient pas dans les 20 s, on passe la main
    setTimeout(() => {
      if (!me.connected && room.hostPid === me.pid) handleHostGone(room, true);
    }, 20000);
  });
});

function handleHostGone(room, force) {
  if (!force && room.players.has(room.hostPid)) return;
  const next = connected(room).find((p) => p.pid !== room.hostPid);
  if (next) {
    room.hostPid = next.pid;
    broadcast(room);
  }
}

// Ménage : salons vides depuis 30 min
setInterval(() => {
  const now = Date.now();
  for (const [k, f] of joinFails) if (now - f.t >= JOIN_WINDOW) joinFails.delete(k);
  for (const [code, r] of rooms) {
    if (connected(r).length || tv.keepAlive(r, now)) r.lastActive = now;
    else if (now - (r.lastActive || now) > 30 * 60 * 1000 || r.players.size === 0) dropRoom(r);
    else r.lastActive = r.lastActive || now;
  }
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`Serveur prêt sur http://localhost:${PORT}`);
  console.log(`Classement mondial : ${process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? "Upstash (sauvegardé)" : "fichier local (effacé à chaque mise à jour)"}${process.env.LB_PREFIX ? " · préfixe " + process.env.LB_PREFIX : ""}`);
});
