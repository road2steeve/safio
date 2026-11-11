// SAFIO TV : écran collectif (télé, vidéoprojecteur, ordinateur branché à la télé).
// La télé n'est jamais un joueur : elle ne reçoit qu'une vue publique construite ici, par liste autorisée.
// Elle ne rejoint jamais le canal Socket.io du salon (io.to(room.code)) : tout lui est envoyé directement.
const crypto = require("crypto");

const MAX_SCREENS = 4;
const PAIR_TTL = 10 * 60 * 1000; // durée de vie d'un « code écran »
const PAIR_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LINK_TRIES = 6; // essais de code écran par minute et par salon
const TV_ROOM_MAX = 12 * 60 * 60 * 1000; // une salle ouverte par une télé, sans joueur, vit au plus 12 h
const TV_OPTS = { sound: true, music: true, volume: 0.8 };

// Champs de la vue « jeu » qu'une télé peut recevoir. Tout le reste est ignoré.
// Les champs personnels (mine, myVote, myOk, myTime, target, isValidator, ships cachés…) n'y sont jamais.
const GAME_KEYS = [
  "round", "total", "deadline", "theme", "question", "img", "answered", "step",
  "answers", "times", "solution", "unit", "judged", "gains", "marks", "comments",
  "groups", "votes", "tally", "elected",
  "letter", "categories", "stoppedBy", "page", "pages", "vRound", "category", "entries", "totals",
  "size", "log", "shotsLeft",
];
const TV_PID = "\u0000tv"; // identifiant fictif : aucun joueur ne peut l'avoir

const token = () => crypto.randomBytes(16).toString("hex");
const pairCode = () => Array.from(crypto.randomBytes(6), (b) => PAIR_CHARS[b % PAIR_CHARS.length]).join("");
const cleanLang = (l) => (["fr", "en", "es"].includes(l) ? l : "fr");

function cleanOpts(o, base = TV_OPTS) {
  const out = { ...base };
  if (!o || typeof o !== "object") return out;
  if (typeof o.sound === "boolean") out.sound = o.sound;
  if (typeof o.music === "boolean") out.music = o.music;
  if (typeof o.volume === "number" && Number.isFinite(o.volume)) out.volume = Math.round(Math.max(0, Math.min(1, o.volume)) * 10) / 10;
  return out;
}

// Vue publique d'une partie : on part de la vue d'un « non-joueur », puis on ne garde que la liste autorisée.
function publicGame(v) {
  const g = {};
  for (const k of GAME_KEYS) if (v[k] !== undefined && v[k] !== null) g[k] = v[k];
  g.sub = v.phase; // play | review
  // Mytho : les propositions (sans « c'est la mienne » ni « mon vote »)
  if (Array.isArray(v.options)) g.options = v.options.map(({ id, text, truth, authors, voters }) => ({ id, text, ...(truth !== undefined ? { truth, authors, voters } : {}) }));
  // Torpille : seulement ce que tout le monde voit (tirs, navires coulés, flottes restantes)
  if (v.boards) {
    g.boards = {};
    for (const [owner, b] of Object.entries(v.boards)) g.boards[owner] = { shots: b.shots, down: b.down, left: b.left, sunk: b.sunk };
  }
  return g;
}

function createTv({ io, rooms, newRoom, viewOf }) {
  const pairs = new Map(); // code écran -> { socketId, lang, until }

  const screensOf = (room) => (room.screens ||= new Map());
  const hasScreen = (room) => [...screensOf(room).values()].some((s) => s.connected);
  const ensureMain = (room) => {
    const list = [...screensOf(room).values()];
    if (list.some((s) => s.main && s.connected)) return;
    list.forEach((s) => (s.main = false));
    const next = list.find((s) => s.connected) || list[0];
    if (next) next.main = true;
  };

  function addScreen(room, lang) {
    const scr = screensOf(room);
    if (scr.size >= MAX_SCREENS) {
      // On remplace le plus ancien écran déconnecté, sinon on refuse
      const off = [...scr.values()].find((s) => !s.connected);
      if (!off) return { error: "tv_full" };
      scr.delete(off.sid);
    }
    const s = { sid: token().slice(0, 12), token: token(), lang: cleanLang(lang), connected: false, socketId: null, main: false };
    scr.set(s.sid, s);
    room.tvOpts ||= { ...TV_OPTS };
    ensureMain(room);
    return { code: room.code, sid: s.sid, token: s.token };
  }

  function viewFor(room, s) {
    const phase = room.phase === "play" || room.phase === "review" ? "playing" : room.phase === "final" ? "results" : "lobby";
    const players = [...room.players.values()].map((p) => ({ pid: p.pid, name: p.name, avatar: p.avatar, ac: p.ac || 0, score: p.score, connected: !!p.connected, ready: !!p.ready }));
    const tv = {
      code: room.code, now: Date.now(), main: !!s.main, opts: room.tvOpts || TV_OPTS,
      phase, gameId: room.game, host: room.players.has(room.hostPid) ? room.hostPid : null,
      settings: room.settings, players, chat: [],
    };
    if (phase === "playing" && room.g) {
      const v = viewOf(room, TV_PID);
      tv.game = publicGame(v);
      tv.game.scores = Object.fromEntries(players.map((p) => [p.pid, p.score]));
    }
    if (phase === "results") {
      tv.results = { ranking: [...players].sort((a, b) => b.score - a.score).map((p) => ({ pid: p.pid, points: p.score })) };
    }
    return tv;
  }

  function broadcastTv(room) {
    if (!room.screens) return;
    for (const s of room.screens.values()) if (s.connected && s.socketId) io.to(s.socketId).emit("tv", viewFor(room, s));
  }

  function removeScreen(room, sid, notify) {
    const s = screensOf(room).get(sid);
    if (!s) return;
    screensOf(room).delete(sid);
    if (notify && s.socketId) io.to(s.socketId).emit("tvEnd", {});
    ensureMain(room);
    broadcastTv(room);
  }

  // Une salle supprimée prévient ses écrans (qui rouvrent aussitôt une nouvelle salle)
  function roomGone(room) {
    if (!room.screens) return;
    for (const s of room.screens.values()) if (s.socketId) io.to(s.socketId).emit("tvEnd", {});
  }

  // Salle sans joueur mais avec une télé allumée : on la garde (12 h max)
  const keepAlive = (room, now) => room.players.size === 0 && hasScreen(room) && now - (room.createdAt || now) < TV_ROOM_MAX;

  // Infos pour le téléphone : écrans reliés et réglages du son (rien de secret)
  const playerInfo = (room) => ({
    screens: [...screensOf(room).values()].map((s) => ({ sid: s.sid, connected: s.connected, main: s.main })),
    tvOpts: room.tvOpts || TV_OPTS,
  });

  function bind(socket, { R, isHost, broadcast }) {
    const reply = (cb, v) => typeof cb === "function" && cb(v);
    const auth = (d) => {
      const room = rooms.get(String((d && d.code) || ""));
      const s = room && screensOf(room).get(String(d.sid || ""));
      if (!s || typeof d.token !== "string" || d.token.length !== s.token.length) return null;
      if (!crypto.timingSafeEqual(Buffer.from(d.token), Buffer.from(s.token))) return null;
      return { room, s };
    };
    const dropPair = () => { for (const [k, p] of pairs) if (p.socketId === socket.id) pairs.delete(k); };

    // La télé ouvre elle-même une salle (au plus une toutes les 5 s par connexion)
    let lastCreate = 0;
    socket.on("tvCreate", (d = {}, cb) => {
      if (Date.now() - lastCreate < 5000) return reply(cb, { error: "slowDown" });
      lastCreate = Date.now();
      const room = newRoom("quiz", null, { tvRoom: true });
      reply(cb, addScreen(room, d.lang));
    });

    socket.on("tvHello", (d = {}, cb) => {
      const a = auth(d);
      if (!a) return reply(cb, { error: "tv_auth" });
      const { room, s } = a;
      if (s.socketId && s.socketId !== socket.id) io.to(s.socketId).emit("replaced", {});
      s.socketId = socket.id;
      s.connected = true;
      if (d.lang) s.lang = cleanLang(d.lang);
      socket.data.tv = { code: room.code, sid: s.sid };
      dropPair();
      ensureMain(room);
      reply(cb, { ok: true });
      broadcast(room); // les téléphones voient l'écran relié ; la télé reçoit sa vue
    });

    // Code écran : pour relier la télé à une salle créée sur un téléphone
    socket.on("tvPair", (d = {}, cb) => {
      dropPair();
      for (const [k, p] of pairs) if (p.until < Date.now()) pairs.delete(k);
      let k;
      do k = pairCode(); while (pairs.has(k));
      pairs.set(k, { socketId: socket.id, lang: cleanLang(d.lang), until: Date.now() + PAIR_TTL });
      reply(cb, { pair: k, ttl: PAIR_TTL });
    });
    socket.on("tvPairStop", () => dropPair());

    socket.on("tvBye", (d = {}) => {
      const a = auth(d);
      if (!a) return;
      screensOf(a.room).delete(a.s.sid);
      if (socket.data.tv && socket.data.tv.sid === a.s.sid) socket.data.tv = null;
      ensureMain(a.room);
      if (a.room.players.size === 0 && screensOf(a.room).size === 0) rooms.delete(a.room.code);
      else broadcast(a.room);
    });

    // ---------- Actions de l'organisateur (depuis son téléphone) ----------
    socket.on("tvLink", (d = {}, cb) => {
      const room = R();
      if (!room || !isHost() || room.solo || room.quick) return reply(cb, { error: "tv_host" });
      const now = Date.now();
      room.tvTries = (room.tvTries || []).filter((x) => now - x < 60e3);
      if (room.tvTries.length >= LINK_TRIES) return reply(cb, { error: "tv_slow" });
      room.tvTries.push(now);
      const k = String(d.pair || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const p = pairs.get(k);
      if (!p || p.until < now) return reply(cb, { error: "tv_code" });
      const sock = io.sockets.sockets.get(p.socketId);
      if (!sock) { pairs.delete(k); return reply(cb, { error: "tv_code" }); }
      const r = addScreen(room, p.lang);
      if (r.error) return reply(cb, r);
      pairs.delete(k);
      sock.emit("tvLinked", r);
      reply(cb, { ok: true });
    });
    socket.on("tvOpts", (d = {}) => {
      const room = R();
      if (!room || !isHost()) return;
      room.tvOpts = cleanOpts(d, room.tvOpts);
      broadcast(room);
    });
    socket.on("tvStop", (d = {}) => {
      const room = R();
      if (!room || !isHost()) return;
      const sids = d.sid ? [String(d.sid)] : [...screensOf(room).keys()];
      for (const sid of sids) removeScreen(room, sid, true);
      broadcast(room);
    });

    socket.on("disconnect", () => {
      dropPair();
      const t = socket.data.tv;
      const room = t && rooms.get(t.code);
      const s = room && screensOf(room).get(t.sid);
      if (!s || s.socketId !== socket.id) return;
      s.connected = false;
      ensureMain(room);
      broadcast(room);
    });
  }

  return { addScreen, broadcastTv, roomGone, keepAlive, hasScreen, playerInfo, bind, viewFor };
}

module.exports = { createTv, publicGame, cleanOpts, GAME_KEYS, TV_PID };
