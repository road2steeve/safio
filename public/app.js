// ======== Réglages faciles ========
const APP_NAME = ["SAF", "IO", "Quizz"]; // le nom affiché (2e partie en dégradé) + la gamme SAFIO
const AVATARS = ["🦊", "🐼", "🐸", "🐙", "🦁", "🐵", "🐧", "🦄", "🐯", "🐨", "🐷", "🐢", "🐳", "🦉", "🐝", "🦖", "👽", "🤖", "👻", "🎃", "😎", "🤠", "🥷", "🧙", "🌵", "🍕", "🍩", "🌈"];
const GAMES = {
  quiz: { ico: "💡", color: "#3b82f6" },
  mytho: { ico: "🎭", color: "#8b5cf6" },
  bac: { ico: "🔤", color: "#14b8a6" },
  duel: { ico: "⚡", color: "#f59e0b" },
  brain: { ico: "🤝", color: "#ec4899" },
  youre: { ico: "👉", color: "#f97316" },
  closest: { ico: "🎯", color: "#eab308" },
  torpille: { ico: "🚢", color: "#0ea5e9" },
  blindtest: { ico: "🎵", color: "#d946ef" },
};
const MIN_PLAYERS = { mytho: 2, brain: 2, youre: 3, torpille: 2, blindtest: 2 };
// Ambiance musicale selon le type de jeu
const GAME_MUSIC = { quiz: "play", bac: "calm", duel: "fast", closest: "fast", mytho: "calm", brain: "calm", youre: "calm", torpille: "play" };

// ======== Langue & stockage ========
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
let lang = store.get("lang", null) || (navigator.language || "en").slice(0, 2);
if (!T[lang]) lang = "en";
document.documentElement.lang = lang;
const t = (k, vars = {}) => String(T[lang][k] ?? T.en[k] ?? k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");
const tr = (obj) => (obj && typeof obj === "object" ? obj[lang] ?? obj.en ?? Object.values(obj)[0] : obj ?? "");
const catName = (c) => (BAC_CATS[c] ? BAC_CATS[c][lang] : c);
const gameName = (g) => t("g_" + g);
const themeName = (th) => (th === "_global" ? t("allThemes") : THEME_INFO[th] ? `${THEME_INFO[th].ico} ${THEME_INFO[th][lang]}` : th);
function setLang(l) { lang = l; store.set("lang", l); document.documentElement.lang = l; screenKey = ""; render(); }
const langSelect = () => `<select class="lang" id="langSel" aria-label="${t("language")}">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? "selected" : ""}>${innerWidth < 520 ? v.split(" ")[0] : v}</option>`).join("")}</select>`;

// ======== État ========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let pid = store.get("pid", null);
if (!pid) { pid = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set("pid", pid); }
const me = {
  name: store.get("name", ""),
  avatar: store.get("avatar", AVATARS[Math.floor(Math.random() * AVATARS.length)]),
  ac: store.get("ac", Math.floor(Math.random() * AV_COLORS.length)),
};
me.xp = Math.max(0, +store.get("xp", 0) || 0);
const profile = () => ({ pid, name: me.name, avatar: me.avatar, ac: me.ac, xp: me.xp });
// Questions déjà vues sur ce téléphone (pour ne pas retomber sur les mêmes d'une partie à l'autre)
let seenIds = store.get("seen", []);
if (!Array.isArray(seenIds)) seenIds = [];
const withSeen = (o) => ({ ...o, seen: seenIds });
// Niveaux : il faut 60 XP pour passer niveau 2, puis 30 XP de plus à chaque niveau
function levelInfo(xp) {
  let lvl = 1, need = 60, rest = Math.max(0, xp | 0);
  while (rest >= need) { rest -= need; lvl++; need = 60 + 30 * (lvl - 1); }
  return { lvl, into: rest, need };
}
const lvlTitle = (lvl) => { const a = (T[lang] && T[lang].lvlTitles) || T.en.lvlTitles; return a[Math.min(a.length - 1, Math.floor((lvl - 1) / 5))]; };
const lvlTag = (p) => (p && p.lvl ? `<span class="lvl-tag">${t("lvl", { n: p.lvl })}</span>` : "");
function lvlCard(xp, opts = {}) {
  const L = levelInfo(xp);
  return `<div class="lvl-card ${opts.cls || ""}"><div class="lvl-row"><span class="lvl-badge">${L.lvl}</span><div class="lvl-txt"><b>${t("lvlLong", { n: L.lvl })} · ${lvlTitle(L.lvl)}</b><small>${t("nextLvl", { n: L.need - L.into, l: L.lvl + 1 })}</small></div></div>
    <div class="lvl-bar"><i style="width:${Math.round((L.into / L.need) * 100)}%"></i></div></div>`;
}
let lastXpShown = null; // animation de gain d'XP (une seule fois par fin de partie)
let S = null;              // dernier état reçu du serveur (null = hors salon)
let local = "home";        // écran hors salon : home | solo | queue | ranking
let clockOffset = 0;
let screenKey = "";
let sceneKey = "";
let myAnswer = null;       // réponse envoyée pour la manche en cours
let bacDraft = [];
let soloTheme = store.get("soloTheme", "all");
let rankTheme = "_global", rankPeriod = "week", rankRows = null;
let queueSize = 0;
let mergeSel = null;       // Même cerveau : groupe sélectionné par l'hôte
let homeCat = "all";       // filtre des jeux sur l'accueil
let avOpen = false;        // panneau avatar ouvert sur l'accueil
let lastScores = {};       // pour animer les scores qui montent

const socket = io({ auth: { pid } });
socket.on("connect", () => {
  const code = store.get("room", null);
  if (code) socket.emit("join", withSeen({ code, ...profile() }), (r) => { if (r.error) { store.del("room"); S = null; screenKey = ""; render(); } });
});
socket.on("state", (v) => {
  clockOffset = v.now - Date.now();
  const prev = S;
  S = v;
  store.set("room", v.code);
  if (v.phase === "final" && v.xp && v.xp.id && store.get("xpId", "") !== v.xp.id) {
    store.set("xpId", v.xp.id);
    me.xp = Math.max(me.xp, v.xp.after | 0);
    store.set("xp", me.xp);
    lastXpShown = v.xp.id + ":new";
    if (v.xp.up > 0) setTimeout(() => Sound.play("rankUp"), 1800);
  }
  try { soundFor(prev, v); } catch {}
  render();
  if (tvDraw) tvDraw();
});
socket.on("queueSize", (n) => { queueSize = n; const el = $("#queueSize"); if (el) el.textContent = t("inQueue", { n }); });
socket.on("kicked", () => { leaveLocal(); toast(t("kicked")); });
socket.on("seenAdd", (ids) => {
  if (!Array.isArray(ids)) return;
  const set = new Set(seenIds);
  ids.forEach((id) => typeof id === "string" && set.add(id));
  seenIds = [...set].slice(-5000);
  store.set("seen", seenIds);
});
socket.on("collect", () => { if (S && S.game === "bac" && S.phase === "play") act({ type: "answer", value: readBac(), round: S.round }); });

function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.hidden = false;
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3500);
}
const act = (d, cb) => socket.emit("act", d, cb);
const isHost = () => S && S.hostPid === pid && !S.auto;
const iDid = () => S && (S.answered || []).includes(pid);
const joinUrl = (code) => `${location.origin}/?code=${code}`;
const avColor = (i) => AV_COLORS[((i | 0) % AV_COLORS.length + AV_COLORS.length) % AV_COLORS.length];
const avHTML = (p, cls = "") => `<span class="avt ${cls}" style="--c:${avColor(p.ac)}">${esc(p.avatar)}</span>`;
const brandHTML = () => `<button class="brand" id="brand" aria-label="SAFIO Quizz">${LOGO_SVG}<h1><b class="nm">${APP_NAME[0]}<span>${APP_NAME[1]}</span></b><em class="line">${APP_NAME[2]}</em></h1></button>`;
const playerOf = (id) => (S && S.players.find((p) => p.pid === id)) || { name: "?", avatar: "❔", ac: 0 };
const who = (id) => { const p = playerOf(id); return `<span class="who-in">${avHTML(p, "xs")}${esc(p.name)}</span>`; };
function leaveLocal() { store.del("room"); S = null; local = "home"; screenKey = ""; history.replaceState(null, "", "/"); render(); }
let qrHandled = false;
function needName() {
  const el = $("#name");
  if (el) { me.name = el.value.trim(); store.set("name", me.name); }
  if (!me.name) {
    if (local !== "home" || !$("#name")) { local = "home"; screenKey = ""; render(); }
    toast(t("needName"));
    const n = $("#name"); if (n) { n.scrollIntoView({ block: "center", behavior: "smooth" }); n.focus(); }
    return false;
  }
  return true;
}

// ======== Son : réactions aux changements d'état ========
function soundFor(prev, v) {
  if (!prev || prev.code !== v.code) { if (v.phase === "play" || v.phase === "starting") Sound.play("start"); return; }
  const n0 = prev.players.length, n1 = v.players.length;
  if (v.phase === "lobby" && n1 > n0) Sound.play("join");
  if (v.phase === "lobby" && n1 < n0) Sound.play("leave");
  const r0 = prev.players.filter((p) => p.ready).length, r1 = v.players.filter((p) => p.ready).length;
  if (v.phase === "lobby" && r1 > r0) Sound.play("ready");
  if ((prev.phase === "lobby" || prev.phase === "final" || prev.phase === "starting") && v.phase === "play") Sound.play("start");
  if (v.game === "duel" && v.phase === "play" && "myOk" in v && !("myOk" in prev)) Sound.play(v.myOk ? "correct" : "wrong");
  if (v.game === "bac" && v.phase === "play" && v.stoppedBy && !prev.stoppedBy) Sound.play("stop");
  if (v.game === "torpille" && v.boards && prev.boards) {
    const cnt = (b, k) => Object.values(b).reduce((s, x) => s + Object.values(x.shots || {}).filter((y) => y === k).length, 0);
    if (cnt(v.boards, "hit") > cnt(prev.boards, "hit")) Sound.play("hit");
    else if (cnt(v.boards, "miss") > cnt(prev.boards, "miss")) Sound.play("splash");
  }
  if (prev.phase === "play" && v.phase === "review") {
    const g = (v.gains || {})[pid];
    if (v.game !== "duel" && v.judged && pid in (v.judged || {}) && v.game !== "quiz") Sound.play(v.judged[pid] ? "correct" : "wrong");
    if (g > 0) setTimeout(() => Sound.play("points"), 350);
  }
  const rank = (s) => [...s.players].sort((a, b) => b.score - a.score).findIndex((p) => p.pid === pid);
  if (v.phase !== "lobby" && prev.phase !== "lobby" && rank(v) < rank(prev)) setTimeout(() => Sound.play("rankUp"), 600);
  if (prev.phase !== "final" && v.phase === "final") {
    const top = [...v.players].sort((a, b) => b.score - a.score)[0];
    Sound.play(top && top.pid === pid && top.score > 0 ? "victory" : "end");
  }
}
function musicFor() {
  if (!S) return Sound.music(local === "queue" ? "lobby" : "home");
  if (S.phase === "lobby" || S.phase === "starting") return Sound.music("lobby");
  if (S.phase === "final") return Sound.music("calm");
  if (S.game === "blindtest") return Sound.music(null); // le Blind Test : silence, c'est la musique du DJ qu'on écoute
  Sound.music(GAME_MUSIC[S.game] || "play");
}

// ======== Rendu principal ========
function render() {
  musicFor();
  if (!S) return renderLocal();
  const g = S;
  let dyn = "";
  if (g.phase === "play") {
    dyn = [g.step, iDid()].join(",");
    if (g.game === "mytho") dyn += "," + g.myVote;
    if (g.game === "duel") dyn += "," + g.myOk;
    if (g.game === "blindtest") dyn += JSON.stringify([g.bt, g.mine, !!g.cue]);
    if (g.game === "torpille" && g.step === "shoot") dyn += JSON.stringify([g.boards, g.target, g.shotsLeft]);
  }
  if (g.phase === "lobby") dyn = isHost() ? "h" : "p";
  if (g.phase === "review" || g.phase === "final") dyn = JSON.stringify([g.judged, g.valid, g.groups, g.result, g.players.map((p) => p.pid), mergeSel, g.page, g.entries, g.coval, g.marks, g.comments, g.recap]);
  const key = [lang, g.code, g.phase, g.game, g.round, g.hostPid, JSON.stringify(g.settings), dyn].join("|");
  if (key !== screenKey) {
    const sameRound = screenKey.includes(`|${g.code}|play|${g.game}|${g.round}|`);
    if (g.phase === "play" && !sameRound) { myAnswer = null; bacDraft = []; }
    if (g.phase !== "review") mergeSel = null;
    if (g.phase === "play" && g.game === "bac" && sameRound && $("[data-bac]")) bacDraft = readBac();
    const scrollY = window.scrollY;
    const sk = [g.code, g.phase, g.game, g.round, g.step, g.page].join("|");
    const newScene = sk !== sceneKey;
    sceneKey = sk;
    screenKey = key;
    app.innerHTML = roomShell();
    const main = $("#main");
    main.innerHTML = mainHTML();
    if (newScene) { main.classList.add("scene-in"); if (g.phase !== "lobby") window.scrollTo({ top: 0 }); }
    else window.scrollTo({ top: scrollY });
    bindRoom();
    if (g.phase === "final" && newScene) confetti();
  }
  updateLive();
}

function mainHTML() {
  if (S.phase === "lobby") return lobbyHTML();
  if (S.phase === "starting") return `<div class="stage" style="padding:60px 0"><div class="spinner"></div><p class="big-msg">⚡ ${t("matchFound")}</p></div>`;
  if (S.phase === "final") return finalHTML();
  const fn = {
    quiz: [qaPlay, quizReview], duel: [qaPlay, quizReview], closest: [qaPlay, closestReview], bac: [bacPlay, bacReview],
    mytho: [mythoPlay, mythoReview], brain: [brainPlay, brainReview], youre: [yourePlay, youreReview], torpille: [torpPlay, torpReview],
    blindtest: [btPlay, btReview],
  }[S.game];
  return S.phase === "play" ? fn[0]() : fn[1]();
}

// ======== En-tête commun ========
function navHTML(inRoom) {
  const links = inRoom ? "" : `<nav class="nav-links"><a href="#games">${t("nav_games")}</a><a href="#how">${t("nav_how")}</a><a href="#" id="navRank">${t("nav_ranking")}</a></nav>`;
  const g = inRoom && S ? GAMES[S.game] : null;
  const pill = inRoom && S ? `<span class="room-pill"><span class="gi">${g.ico}</span><span class="hide-sm">${gameName(S.game)}</span>${S.solo ? "" : S.auto ? "" : `<span class="room-code">${S.code}</span>`}</span>` : "";
  return `<header class="nav">${brandHTML()}${links}
    <div class="nav-right">${pill}
      <button class="icon-btn" id="sndBtn" aria-label="${t("soundTitle")}">${soundIcon()}</button>
      ${langSelect()}
      ${inRoom ? "" : `<button class="btn violet small create-top" id="createTop">${t("createGame")}</button>`}
    </div></header>`;
}
const soundIcon = () => { const p = Sound.prefs; return p.muted || (!p.music && !p.sfx) ? "🔇" : "🔊"; };
function bindNav() {
  const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };
  const ls = $("#langSel"); if (ls) ls.onchange = (e) => setLang(e.target.value);
  on("#sndBtn", openSound);
  on("#brand", () => { if (!S) { local = "home"; screenKey = ""; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
  on("#navRank", (e) => { e.preventDefault(); openRanking("_global"); });
  on("#createTop", () => { if (local !== "home") { local = "home"; screenKey = ""; render(); } const g = $("#games"); if (g) g.scrollIntoView({ behavior: "smooth" }); });
}

// ======== Panneau son ========
function openSound() {
  const old = $("#soundModal"); if (old) old.remove();
  Sound.unlock();
  const el = document.createElement("div");
  el.className = "modal-back"; el.id = "soundModal";
  const draw = () => {
    const p = Sound.prefs;
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${t("soundTitle")}">
      <h3>${t("soundTitle")} <button class="x" id="sndClose" aria-label="${t("close")}">✕</button></h3>
      <div class="snd-row"><div class="snd-top"><span>🎵 ${t("musicLbl")}</span><button class="switch ${p.music ? "on" : ""}" data-sw="music" aria-label="${t("musicLbl")}"></button></div>
        <input type="range" min="0" max="1" step="0.05" value="${p.mv}" data-vol="mv" aria-label="${t("volume")}"></div>
      <div class="snd-row"><div class="snd-top"><span>🔔 ${t("sfxLbl")}</span><button class="switch ${p.sfx ? "on" : ""}" data-sw="sfx" aria-label="${t("sfxLbl")}"></button></div>
        <input type="range" min="0" max="1" step="0.05" value="${p.sv}" data-vol="sv" aria-label="${t("volume")}"></div>
      <button class="btn ${p.muted ? "teal" : "coral"} big" id="muteAll" style="margin-top:16px">${p.muted ? "🔊 " + t("unmuteAll") : "🔇 " + t("muteAll")}</button>
      <p class="muted small" style="margin-top:10px;text-align:center">${t("soundHint")}</p></div>`;
    el.querySelectorAll("[data-sw]").forEach((b) => (b.onclick = () => { Sound.set(b.dataset.sw, !Sound.prefs[b.dataset.sw]); draw(); Sound.play("click"); }));
    el.querySelectorAll("[data-vol]").forEach((r) => (r.oninput = () => Sound.set(r.dataset.vol, +r.value)));
    el.querySelectorAll("[data-vol=sv]").forEach((r) => (r.onchange = () => Sound.play("points")));
    el.querySelector("#muteAll").onclick = () => { Sound.set("muted", !Sound.prefs.muted); draw(); };
    el.querySelector("#sndClose").onclick = close;
  };
  const close = () => { el.remove(); const b = $("#sndBtn"); if (b) b.innerHTML = soundIcon(); };
  el.onclick = (e) => { if (e.target === el) close(); };
  document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
  draw();
  document.body.appendChild(el);
}
// ======== SAFIO TV : relier une télé et régler son son (organisateur) ========
let tvDraw = null;
function openTv() {
  const old = $("#tvModal"); if (old) old.remove();
  const el = document.createElement("div");
  el.className = "modal-back"; el.id = "tvModal";
  let code = "", msg = "";
  const err = { tv_code: "tv_err_code", tv_slow: "tv_err_slow", tv_full: "tv_err_full", tv_host: "tv_err_host" };
  tvDraw = () => {
    if (!S || !isHost()) return close();
    const sc = S.screens || [], o = S.tvOpts || { sound: true, music: true, volume: 0.8 };
    const k = JSON.stringify([sc, o, msg, lang]);
    if (el.dataset.k === k) return;
    el.dataset.k = k;
    const url = `<b>${esc(location.host)}/tv</b>`;
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${t("tv_title")}">
      <h3>${t("tv_title")} <button class="x" id="tvClose" aria-label="${t("close")}">✕</button></h3>
      <p>${t("tv_step1", { url })}</p><p class="muted small">${t("tv_step2")}</p>
      <div class="row"><input class="input" id="tvCode" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="${t("tv_codePh")}" value="${esc(code)}" style="text-transform:uppercase;letter-spacing:.12em"><button class="btn primary" id="tvLink">${t("tv_link")}</button></div>
      ${msg ? `<p class="small" style="color:var(--coral);margin-top:8px">${esc(msg)}</p>` : ""}
      ${sc.length ? `<p class="label" style="margin-top:16px">${t("tv_screens")}</p>
        <div class="chips">${sc.map((x, i) => `<span class="chip ${x.connected ? "on" : ""}">${t("tv_screen", { n: i + 1 })}${x.connected ? "" : " · " + t("tv_off")}${x.main ? " · " + t("tv_main") : ""}</span>`).join("")}</div>
        <div class="chips" style="margin-top:12px"><button class="chip ${o.sound ? "on" : ""}" data-o="sound">${o.sound ? "🔊" : "🔇"} ${t("tv_sound")}</button><button class="chip ${o.music ? "on" : ""}" data-o="music">🎵 ${t("tv_music")}</button></div>
        <div class="chips" style="margin-top:8px;align-items:center"><span class="muted small">${t("tv_volume")}</span>${[0.3, 0.6, 0.8, 1].map((v) => `<button class="chip ${o.volume === v ? "on" : ""}" data-vol="${v}">${Math.round(v * 100)} %</button>`).join("")}</div>
        <button class="btn ghost small" id="tvStop" style="margin-top:14px">⏹ ${t("tv_stop")}</button>` : ""}</div>`;
    const input = el.querySelector("#tvCode");
    input.oninput = () => { code = input.value.toUpperCase(); };
    const link = () => {
      code = input.value.toUpperCase().trim();
      if (!code) return input.focus();
      socket.emit("tvLink", { pair: code }, (r) => {
        if (r && r.ok) { code = ""; msg = ""; toast(t("tv_linked")); }
        else msg = t(err[r && r.error] || "tv_err_code");
        if (tvDraw) tvDraw();
      });
    };
    el.querySelector("#tvLink").onclick = link;
    input.onkeydown = (e) => { if (e.key === "Enter") link(); };
    el.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => socket.emit("tvOpts", { ...o, [b.dataset.o]: !o[b.dataset.o] })));
    el.querySelectorAll("[data-vol]").forEach((b) => (b.onclick = () => socket.emit("tvOpts", { ...o, volume: +b.dataset.vol })));
    const stop = el.querySelector("#tvStop");
    if (stop) stop.onclick = () => socket.emit("tvStop", {});
    el.querySelector("#tvClose").onclick = close;
  };
  const close = () => { tvDraw = null; el.remove(); };
  el.onclick = (e) => { if (e.target === el) close(); };
  tvDraw();
  document.body.appendChild(el);
  if (!(S.screens || []).length) setTimeout(() => { const i = $("#tvCode"); if (i) i.focus(); }, 50);
}

Sound.onChange(() => { const b = $("#sndBtn"); if (b) b.innerHTML = soundIcon(); });

// Clic sonore sur les éléments interactifs importants
document.addEventListener("click", (e) => {
  const el = e.target.closest(".btn, .chip, .tab, .gp, .theme, .option, .vote-btn, .mark, .icon-btn, .avatar-grid button, .color-row button");
  if (el && !el.disabled) Sound.play(el.matches(".btn.primary, .btn.big") ? "pop" : "click");
}, true);

// ======== Écrans hors salon ========
function renderLocal() {
  const key = "local|" + lang + "|" + local + "|" + soloTheme + "|" + rankTheme + "|" + rankPeriod + "|" + JSON.stringify(rankRows) + "|" + homeCat + "|" + avOpen + "|" + me.avatar + me.ac;
  if (key === screenKey) return;
  screenKey = key;
  if (local === "solo") return renderSolo();
  if (local === "queue") return renderQueue();
  if (local === "ranking") return renderRanking();
  renderHome();
}

function avatarEditor(cur) {
  return `<div class="avatar-panel"><p class="label">${t("pickAvatar")}</p>
    <div class="avatar-grid" id="avGrid">${AVATARS.map((a) => `<button data-av="${a}" class="${a === cur.avatar ? "on" : ""}" aria-label="${a}">${a}</button>`).join("")}</div>
    <p class="label" style="margin-top:12px">${t("avColor")}</p>
    <div class="color-row">${AV_COLORS.map((c, i) => `<button data-ac="${i}" class="${i === cur.ac ? "on" : ""}" style="--c:${c}" aria-label="${t("avColor")} ${i + 1}"></button>`).join("")}</div></div>`;
}

function gameCard(id, i) {
  const m = GAME_META[id];
  return `<article class="gcard" data-card="${id}" style="animation-delay:${i * 0.05}s">
    ${m.tags.includes("new") ? `<span class="tagnew">${t("cat_new")}</span>` : ""}${ART[id]}
    <div class="gbody"><h3>${gameName(id)}</h3><p>${t("g_" + id + "_d")}</p>
      <div class="gmeta"><span>👥 ${t("playersN", { n: m.players })}</span><span>⏱ ${t("minutes", { n: m.mins })}</span></div>
      <button class="btn violet" data-create="${id}">${t("playBtn")} ▸</button></div></article>`;
}

function renderHome() {
  const preCode = new URLSearchParams(location.search).get("code") || "";
  const cats = ["all", "popular", "new", "quick", "friends"];
  const ids = Object.keys(GAMES).filter((id) => homeCat === "all" || GAME_META[id].tags.includes(homeCat));
  app.innerHTML = `${navHTML(false)}
  <section class="hero">
    <div>
      <span class="kicker"><i></i>${t("heroKicker")}</span>
      <h2>${t("heroTitle").replace(/(\S+)\s*$/, '<span class="grad">$1</span>')}</h2>
      <p class="sub-lead">${t("heroSub")}</p>
      <div class="hero-ctas">
        <button class="btn primary" id="ctaCreate">🎉 ${t("ctaCreate")}</button>
        <button class="btn ghost" id="ctaJoin">🔑 ${t("ctaJoin")}</button>
      </div>
      <p class="trust">${t("noSignup")}</p>
    </div>
    <div class="hero-deco">
      <div class="floaties"><span class="floaty" style="right:10px;top:0">🎲</span><span class="floaty" style="right:120px;top:-26px;animation-delay:-2s">⚡</span><span class="floaty" style="right:30px;top:330px;animation-delay:-4s">🏆</span></div>
      <div class="card profile-card">
        <p class="label">${t("yourProfile")}</p>
        <div class="avatar-pick">
          <button class="avatar-btn" id="avBtn" aria-label="${t("pickAvatar")}">${avHTML(me, "lg")}<span class="edit">✎</span></button>
          <input class="input" id="name" maxlength="16" placeholder="${t("namePh")}" value="${esc(me.name)}" autocomplete="nickname">
        </div>
        ${lvlCard(me.xp)}
        ${avOpen ? avatarEditor(me) : ""}
        ${preCode ? `<p class="invite-note">🎟️ ${t("qrInvite", { c: esc(preCode.toUpperCase()) })}</p>` : ""}
        <p class="label" id="joinZone">${t("codeLbl")}</p>
        <div class="row">
          <input class="input code-input" id="code" maxlength="4" placeholder="ABCD" value="${esc(preCode)}" autocomplete="off" autocapitalize="characters" inputmode="text">
          <button class="btn teal" id="joinBtn">${t("join")}</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="games">
    <div class="section-head"><div><h2>${t("gamesTitle")}</h2><p>${t("gamesSub")}</p></div>
      <div class="tabs" role="tablist">${cats.map((c) => `<button class="tab ${homeCat === c ? "on" : ""}" data-cat-tab="${c}" role="tab" aria-selected="${homeCat === c}">${t("cat_" + c)}</button>`).join("")}</div></div>
    <div class="game-cards">${ids.map(gameCard).join("")}</div>
  </section>

  <section class="section" id="how">
    <div class="section-head"><div><h2>${t("howTitle")}</h2></div></div>
    <div class="how">${[1, 2, 3].map((n, i) => `<div class="how-step"><b style="background:${["var(--violet)", "var(--blue)", "var(--turq)"][i]}">${n}</b><span>${t("how" + n)}</span></div>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><div><h2>${t("nowTitle")}</h2></div></div>
    <div class="modes">
      <button class="mode-tile" id="goSolo"><b>${t("soloMode")}</b><span>${t("soloMode_d")}</span></button>
      <button class="mode-tile" id="goQuick"><b>${t("quickMode")}</b><span>${t("quickMode_d")}</span></button>
      <button class="mode-tile" id="goRank"><b>${t("worldRanking")}</b><span>${t("nav_ranking")}</span></button>
    </div>
  </section>
  <p class="tv-hint">${t("tv_homeHint", { url: `<a href="/tv"><b>${esc(location.host)}/tv</b></a>` })}</p>
  <footer class="footer">SAFIO Quizz · ${t("noSignup")}<br><a class="universe-link" href="https://playsafio.onrender.com${({ en: "/en/", es: "/es/" })[lang] || "/"}">${t("universeLink")}</a></footer>`;
  bindNav();
  $("#avBtn").onclick = () => { avOpen = !avOpen; screenKey = ""; render(); };
  $$("[data-av]").forEach((b) => (b.onclick = () => { me.avatar = b.dataset.av; store.set("avatar", me.avatar); screenKey = ""; render(); }));
  $$("[data-ac]").forEach((b) => (b.onclick = () => { me.ac = +b.dataset.ac; store.set("ac", me.ac); screenKey = ""; render(); }));
  $("#name").oninput = () => { me.name = $("#name").value.trim(); store.set("name", me.name); };
  const join = () => {
    if (!needName()) return;
    const code = $("#code").value.trim().toUpperCase();
    if (code.length !== 4) { $("#code").focus(); return toast(t("code4")); }
    socket.emit("join", withSeen({ code, ...profile() }), (r) => {
      if (r && r.error) return toast(t(r.error));
      if (location.search) history.replaceState(null, "", location.pathname);
    });
  };
  $("#joinBtn").onclick = join;
  // Arrivée par QR code / lien : on amène directement le joueur au formulaire
  const qr = new URLSearchParams(location.search).get("code");
  if (qr && !qrHandled) {
    qrHandled = true;
    setTimeout(() => {
      const target = me.name ? $("#joinBtn") : $("#name");
      if (!target) return;
      $(".profile-card").scrollIntoView({ block: "center" });
      if (!me.name) target.focus({ preventScroll: true });
    }, 150);
  }
  $("#code").onkeydown = (e) => { if (e.key === "Enter") join(); };
  $("#ctaJoin").onclick = () => { const c = $("#code"); c.scrollIntoView({ block: "center", behavior: "smooth" }); c.focus(); };
  $("#ctaCreate").onclick = () => $("#games").scrollIntoView({ behavior: "smooth" });
  $$("[data-cat-tab]").forEach((b) => (b.onclick = () => { homeCat = b.dataset.catTab; screenKey = ""; const y = scrollY; render(); scrollTo({ top: y }); }));
  const create = (game) => {
    if (!needName()) return;
    socket.emit("create", withSeen({ ...profile(), game }), (r) => r.error && toast(t(r.error)));
  };
  $$("[data-create]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); create(b.dataset.create); }));
  $$("[data-card]").forEach((c) => (c.onclick = () => create(c.dataset.card)));
  $("#goSolo").onclick = () => { if (needName()) { local = "solo"; render(); } };
  $("#goQuick").onclick = () => {
    if (!needName()) return;
    local = "queue"; render();
    socket.emit("quick", withSeen(profile()));
  };
  $("#goRank").onclick = () => openRanking("_global");
  if (preCode && me.name) $("#joinBtn").focus(); else if (preCode) $("#name").focus();
}

function localShell(title, body) {
  app.innerHTML = `${navHTML(false)}
    <section class="card narrow" style="margin-top:18px"><button class="btn ghost small" id="back">← ${t("back").replace(/^←\s*/, "")}</button><h2 class="title">${title}</h2>${body}</section>`;
  bindNav();
  $("#back").onclick = () => { if (local === "queue") socket.emit("quickCancel"); local = "home"; render(); };
}

// Thèmes : "all", "random", ou un ou plusieurs thèmes séparés par des virgules
const themeSel = (sel) => (sel === "all" || sel === "random" ? [sel] : String(sel || "all").split(",").filter(Boolean));
const toggleTheme = (sel, id) => {
  if (id === "all" || id === "random") return id;
  const cur = themeSel(sel).filter((x) => x !== "all" && x !== "random");
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  return next.length ? next.join(",") : "all";
};
const rankOf = (sel) => (sel === "random" || String(sel).includes(",") ? "all" : sel);
const themeGrid = (sel, attr) => { const on = themeSel(sel); return `<div class="theme-grid">${Object.entries(THEME_INFO).map(([id, th]) => `<button class="theme ${on.includes(id) ? "on" : ""} ${id === "random" || id === "all" ? "special" : ""}" ${attr}="${id}"><span>${th.ico}</span>${th[lang]}</button>`).join("")}</div>`; };

function renderSolo() {
  localShell(t("soloTitle"), `<p class="muted" style="margin:6px 0 16px">${t("soloHint")}</p>
    <h3 class="sub" style="margin-bottom:10px">${t("theme")}</h3>${themeGrid(soloTheme, "data-st")}
    <div class="actions"><button class="btn ghost" id="soloRank">${t("worldRanking")}</button></div>
    <button class="btn primary big" id="soloGo" style="margin-top:16px">${t("play")}</button>`);
  $$("[data-st]").forEach((b) => (b.onclick = () => { soloTheme = toggleTheme(soloTheme, b.dataset.st); store.set("soloTheme", soloTheme); render(); }));
  $("#soloGo").onclick = () => socket.emit("solo", withSeen({ ...profile(), theme: soloTheme }));
  $("#soloRank").onclick = () => openRanking(rankOf(soloTheme));
}

function renderQueue() {
  localShell(t("quickMode"), `<div class="stage" style="padding:30px 0">${avHTML(me, "xl")}<div class="spinner"></div><p class="big-msg">${t("searching")}</p>
    <p class="muted" id="queueSize">${t("inQueue", { n: queueSize })}</p></div>`);
}

function openRanking(theme) {
  rankTheme = theme; rankRows = null; local = "ranking"; render();
  socket.emit("leaderboard", { theme: rankTheme, period: rankPeriod }, (rows) => { rankRows = rows; render(); });
}
function renderRanking() {
  const opts = ["_global", "all", ...Object.keys(THEME_INFO).filter((k) => k !== "random" && k !== "all")];
  const rows = rankRows === null ? `<div class="spinner"></div>` : rankRows.length
    ? `<ol class="ranking">${rankRows.map((r, i) => `<li class="${r.me ? "me" : ""}"><span class="pos">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span><span class="av">${esc(r.avatar)}</span><span class="nm">${esc(r.name)}</span><b>${r.score}</b></li>`).join("")}</ol>`
    : `<p class="muted">${t("noScores")}</p>`;
  localShell(t("worldRanking"), `
    <div class="chips" style="margin:10px 0">${["week", "all"].map((p) => `<button class="chip ${rankPeriod === p ? "on" : ""}" data-rp="${p}">${p === "week" ? t("week") : t("allTime")}</button>`).join("")}</div>
    <select class="input" id="rankTheme" style="margin-bottom:14px">${opts.map((o) => `<option value="${o}" ${o === rankTheme ? "selected" : ""}>${o === "_global" ? t("allThemes") + " (∑)" : themeName(o)}</option>`).join("")}</select>
    ${rows}`);
  $$("[data-rp]").forEach((b) => (b.onclick = () => { rankPeriod = b.dataset.rp; openRanking(rankTheme); }));
  $("#rankTheme").onchange = (e) => openRanking(e.target.value);
}

// ======== Salon ========
function roomShell() {
  return `${navHTML(true)}
  <div class="layout">
    <section class="card g-${S.game}" id="main"></section>
    <aside class="card">
      <div class="side-head"><p class="label" style="margin:0">${S.phase === "lobby" ? t("playersInRoom") : t("scoresLbl")} · <span id="nbPlayers"></span></p></div>
      <div class="players" id="players"></div>
      <div class="side-actions">
        ${isHost() && S.phase !== "lobby" ? `<button class="btn ghost small" id="toLobby">${t("backLobby")}</button>` : ""}
        <button class="btn ghost small" id="leave">${t("leave")}</button>
      </div>
    </aside>
  </div>`;
}

function slider(key, label, min, max, step, unit = "") {
  const v = S.settings[key];
  return `<div class="slider"><div class="slider-head"><span>${label}</span><b id="lbl-${key}">${v}${unit}</b></div>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-range="${key}" data-unit="${unit}" aria-label="${label}"></div>`;
}
function howToHTML(g, open = true) {
  const R = (typeof RULES !== "undefined" && (RULES[lang] || RULES.fr)[g]) || null;
  const head = `<div class="howto-head"><b>${GAMES[g].ico} ${t("howTo", { g: gameName(g) })}</b><span class="muted small">${t("p_" + g)}</span></div>`;
  if (!R) return `<div class="howto">${head}<p>${t("r_" + g)}</p></div>`;
  const ex = R.ex;
  return `<details class="howto" ${open ? "open" : ""}><summary>${head}</summary>
    <div class="ex"><p class="label">${RULES_UI[lang] ? RULES_UI[lang].ex : RULES_UI.fr.ex}</p>
      ${ex.top ? `<div class="ex-top">${ex.top}</div>` : ""}
      <div class="ex-rows">${ex.rows.map((r) => `<div class="ex-row"><b>${r[0]}</b><span>${r[1]}</span>${r[2] ? `<em class="${r[2].startsWith("+") ? "plus" : ""}">${r[2]}</em>` : ""}</div>`).join("")}</div>
      ${ex.note ? `<p class="muted small">${ex.note}</p>` : ""}</div>
    <p class="label" style="margin-top:12px">${RULES_UI[lang] ? RULES_UI[lang].rules : RULES_UI.fr.rules}</p>
    <ol class="rules">${R.steps.map((s) => `<li>${s}</li>`).join("")}</ol></details>`;
}

function lobbyHTML() {
  const s = S.settings, host = isHost(), G = S.game;
  const url = joinUrl(S.code).replace(/^https?:\/\//, "");
  const invite = `<div class="invite">
      <div class="qr" id="qr"></div>
      <div>
        <p class="label">${t("inviteFriends")}</p>
        <div class="code-big">${S.code}</div>
        <p class="url">${esc(url)}</p>
        <div class="actions"><button class="btn teal small" id="share">${t("share")}</button><button class="btn ghost small" id="copyLink">🔗 ${t("copyLink")}</button>${host && !S.solo && !S.quick ? `<button class="btn ghost small" id="tvBtn">${(S.screens || []).some((x) => x.connected) ? t("tv_on") : t("tv_btn")}</button>` : ""}</div>
      </div>
    </div>`;
  const crowd = `<div class="panel"><p class="label">${t("playersInRoom")}</p><div class="crowd" id="crowd"></div>
    ${host ? "" : `<div class="actions"><button class="btn ghost small" id="editMe">✎ ${t("editProfile")}</button></div>`}</div>`;
  if (!host) {
    return `<div class="lobby">${invite}${crowd}
      ${howToHTML(G)}
      <div class="startbar"><div class="status" id="startStatus"></div><button class="btn green" id="readyBtn"></button></div></div>`;
  }
  let settings = "";
  if (G === "blindtest") settings = btLobby();
  else if ("themes" in s) {
    const sel = s.themes || [];
    const ids = Object.keys(THEME_INFO).filter((id) => id !== "random" && id !== "all");
    settings += `<div><h3 class="sub">${t("theme")} <span class="muted small">(${sel.length ? sel.length : t("allThemes")})</span></h3><p class="muted small" style="margin:4px 0 12px">${t("themesHint")}</p>
      <div class="theme-grid"><button class="theme special ${sel.length ? "" : "on"}" data-tm="all"><span>${THEME_INFO.all.ico}</span>${THEME_INFO.all[lang]}</button>${ids.map((id) => `<button class="theme ${sel.includes(id) ? "on" : ""}" data-tm="${id}"><span>${THEME_INFO[id].ico}</span>${THEME_INFO[id][lang]}</button>`).join("")}</div></div>`;
  }
  if (G === "blindtest") settings += "";
  else if ("theme" in s) settings += `<div><h3 class="sub">${t("theme")}</h3><p class="muted small" style="margin:4px 0 12px">${t("themeHint")}</p>${themeGrid(s.theme, "data-tg")}</div>`;
  const sl = [];
  if (G === "blindtest") sl.length = 0;
  else if ("time" in s) sl.push(slider("time", G === "bac" ? t("timePerRound") : t("timePerQ"), G === "bac" ? 30 : G === "duel" ? 5 : 10, G === "bac" ? 300 : G === "duel" ? 60 : 120, 5, " s"));
  if ("count" in s && G !== "blindtest") sl.push(slider("count", t(G === "torpille" ? "rounds" : "questions"), 3, G === "closest" ? 20 : 30, 1));
  if ("rounds" in s) sl.push(slider("rounds", t("rounds"), 1, 10, 1));
  if (sl.length) settings += `<div class="sliders">${sl.join("")}</div>`;
  if (G === "bac") settings += `<p class="muted small">${t("covalHint")}</p>`;
  if (G === "quiz") settings += `<p class="muted small">${t("covalHintQuiz")}</p>`;
  if (G === "bac") settings += `<div><p class="label">${t("catMode")}</p><div class="chips">
    <button class="chip ${s.mix ? "on" : ""}" data-mix="1">🎲 ${t("catMix")}</button><button class="chip ${s.mix ? "" : "on"}" data-mix="0">📌 ${t("catFixed")}</button></div>
    <p class="muted small" style="margin-top:6px">${t(s.mix ? "catMixHint" : "catFixedHint")}</p>
    ${s.mix ? `<div class="sliders" style="margin-top:8px">${slider("perRound", t("perRound"), 3, 10, 1)}</div>` : ""}</div>`;
  if (G === "bac") settings += `
    <div><p class="label">${s.mix ? t("myCats") : t("categories")} (${s.mix ? s.categories.filter((c) => !BAC_CATS[c]).length : s.categories.length})</p><div class="chips">${(s.mix ? s.categories.filter((c) => !BAC_CATS[c]) : [...new Set([...Object.keys(BAC_CATS), ...s.categories])]).map((c) => `<button class="chip ${s.categories.includes(c) ? "on" : ""}" data-cat="${esc(c)}">${esc(catName(c))}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><input class="input" id="newCat" maxlength="30" placeholder="${t("addCat")}"><button class="btn" id="addCat">+</button></div></div>`;
  return `<div class="lobby">
    <p class="host-banner">👑 ${t("hostPanel")}</p>
    ${invite}${crowd}
    <div class="panel"><p class="label">${t("chooseGame")}</p>
      <div class="game-pick">${Object.keys(GAMES).map((id) => `<button class="gp ${G === id ? "on" : ""}" data-game="${id}">${ART[id]}<b>${GAMES[id].ico} ${gameName(id)}</b></button>`).join("")}</div></div>
    ${howToHTML(G, false)}
    <div class="panel"><p class="label">${t("gameSettings")}</p><div class="settings">${settings}</div></div>
    <div class="startbar"><div class="status" id="startStatus"></div><button class="btn primary big" id="start">▶ ${t("startGame")}</button></div>
  </div>`;
}

// Profil dans le salon (avatar, couleur, pseudo)
function openProfile() {
  const el = document.createElement("div");
  el.className = "modal-back";
  const mine = playerOf(pid);
  const cur = { avatar: mine.avatar, ac: mine.ac || 0, name: mine.name };
  const draw = () => {
    el.innerHTML = `<div class="modal"><h3>${t("yourProfile")} <button class="x" data-close>✕</button></h3>
      <div class="avatar-pick" style="margin-top:14px">${avHTML(cur, "lg")}<input class="input" id="pName" maxlength="16" value="${esc(cur.name)}"></div>
      ${avatarEditor(cur)}<button class="btn primary big" data-save style="margin-top:16px">✓ OK</button></div>`;
    el.querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => { cur.name = el.querySelector("#pName").value; cur.avatar = b.dataset.av; draw(); }));
    el.querySelectorAll("[data-ac]").forEach((b) => (b.onclick = () => { cur.name = el.querySelector("#pName").value; cur.ac = +b.dataset.ac; draw(); }));
    el.querySelector("[data-close]").onclick = () => el.remove();
    el.querySelector("[data-save]").onclick = () => {
      cur.name = el.querySelector("#pName").value.trim() || cur.name;
      Object.assign(me, { name: cur.name, avatar: cur.avatar, ac: cur.ac });
      store.set("name", me.name); store.set("avatar", me.avatar); store.set("ac", me.ac);
      socket.emit("profile", { name: me.name, avatar: me.avatar, ac: me.ac });
      el.remove();
    };
  };
  el.onclick = (e) => { if (e.target === el) el.remove(); };
  draw();
  document.body.appendChild(el);
}

// ---------- Morceaux communs ----------
const timerHTML = () => `<div class="timer" id="timer"><div class="timer-bar"><i id="tbar"></i></div><span class="timer-num" id="tnum"></span></div>`;
const themeBadge = () => (S.theme && THEME_INFO[S.theme] ? ` · ${THEME_INFO[S.theme].ico} ${THEME_INFO[S.theme][lang]}` : "");
const roundHTML = (word = "question") => `<div class="hud"><div class="round"><span class="num">${GAMES[S.game].ico}</span>${t(word)} ${S.round} / ${S.total}${themeBadge()}</div></div>`;
const questionHTML = () => `<div class="question">${esc(tr(S.question))}</div>${S.img ? `<img class="qimg" src="${esc(S.img)}" alt="">` : ""}`;
const answerForm = (ph, numeric) => `<div id="answerZone"><form class="answer-form" id="ansForm">
    <input class="input" id="ans" autocomplete="off" ${numeric ? 'inputmode="decimal"' : ""} placeholder="${ph}" maxlength="80" aria-label="${ph}">
    <button class="btn primary">${t("send")}</button></form></div>`;
const sentHTML = (txt) => `<p class="sent">✓ ${t("sent")}${txt ? ` : <b>${esc(txt)}</b>` : ""}</p>`;
const waitingHTML = () => `<p class="muted small" style="margin-top:14px;font-weight:700" id="waiting"></p>`;
const skipBtn = (label = "showAnswers") => (isHost() ? `<div class="actions"><button class="btn ghost small" id="skip">${t(label)} ⏭</button></div>` : "");
const nextBtn = () => (isHost() ? `<div class="actions"><button class="btn primary big" id="next" style="max-width:420px">${S.round >= S.total ? "🏆 " + t("ranking") : t("next") + " ▸"}</button></div>`
  : S.auto ? `<p class="muted" style="margin-top:10px">${t("autoNext")}</p>` : `<p class="muted" style="margin-top:10px">${t("hostChecking")} <span class="dots"><i></i><i></i><i></i></span></p>`);
const gainsTag = (id) => (S.gains && S.gains[id] ? `<span class="pts">+${S.gains[id]}</span>` : `<span class="pts"></span>`);

// ---------- Quiz libre / Éclair / Au plus près ----------
function qaPlay() {
  const numeric = S.game === "closest", duel = S.game === "duel";
  const flash = duel && "myOk" in S
    ? `<div class="flash ${S.myOk ? "ok" : "ko"}">${S.myOk ? "✓ " + t("flashOk") : "✗ " + t("flashKo")}<span>${esc(myAnswer || "")} · ${t("inSec", { s: (S.myTime / 1000).toFixed(1) })}</span></div>` : "";
  return `<div class="stage">${roundHTML()}${timerHTML()}${questionHTML()}
    ${duel && !iDid() ? `<p class="muted small" style="margin:-6px 0 10px">${t("duelHint")}</p>` : ""}
    ${iDid() ? flash || sentHTML(myAnswer) : answerForm(numeric ? t("numberPh") : t("answerPh"), numeric)}
    ${waitingHTML()}${skipBtn()}</div>`;
}
function quizValidation() {
  const v = S.isValidator;
  const mk = { no: "✗", almost: "≈", ok: "✓" };
  const ids = Object.keys(S.answers).sort((a, b) => S.times[a] - S.times[b]);
  const rows = ids.map((id) => {
    const m = S.marks[id] || "no", c = (S.comments || {})[id];
    const marks = v
      ? `<span class="marks">${["no", "almost", "ok"].map((x) => `<button class="mark ${x} ${m === x ? "on" : ""}" data-qmark="${x}" data-pid="${id}">${mk[x]} <span class="mlbl">${t("q_" + x)}</span></button>`).join("")}</span>`
      : `<span class="mark ${m} on">${mk[m]} ${t("q_" + m)}</span>`;
    const com = v
      ? `<input class="input comment" data-comment="${id}" maxlength="120" placeholder="${t("commentPh")}" value="${esc(c || "")}">`
      : c ? `<div class="comment-view">💬 ${esc(c)}</div>` : "";
    return `<div class="qv ${m} ${id === pid ? "me" : ""}"><div class="ans ${m === "ok" ? "ok" : m === "almost" ? "almost" : "ko"}"><span class="who">${who(id)}</span>
      <span class="what">${esc(S.answers[id]) || `<i class='muted'>${t("empty")}</i>`}</span>${marks}${gainsTag(id)}</div>${com}</div>`;
  }).join("") || `<p class="muted">${t("nobody")}</p>`;
  const left = S.toCheck || 0;
  return `<div class="stage">${roundHTML()}${questionHTML()}
    <p class="label" style="margin-top:6px">${t("expected")}</p><div class="solution">${esc(tr(S.solution))}</div>
    <div class="answers">${rows}</div>
    <p class="muted small">${t("quizRules")}${v ? " " + (left ? t("toCheck", { n: left }) : t("allChecked")) : ""}</p>
    ${v && !isHost() ? `<p class="muted" style="margin-top:10px">${t("hostNext")}</p>` : nextBtn()}</div>`;
}
function quizReview() {
  if (S.game === "quiz" && !S.auto && S.marks) return quizValidation();
  const host = isHost() && S.game === "quiz";
  const ids = Object.keys(S.answers);
  const right = ids.filter((id) => S.judged[id]).sort((a, b) => S.times[a] - S.times[b]);
  const rows = ids.sort((a, b) => S.times[a] - S.times[b]).map((id) => {
    const ok = S.judged[id];
    const extra = S.game === "duel" ? ` <span class="muted small">${t("inSec", { s: (S.times[id] / 1000).toFixed(1) })}${ok && right[0] === id && !S.solo ? " · " + t("fastest") : ""}</span>` : "";
    return `<div class="ans ${ok ? "ok" : "ko"}"><span class="who">${who(id)}</span><span class="what">${esc(S.answers[id]) || `<i class='muted'>${t("empty")}</i>`}${extra}</span>
      ${host ? `<button class="toggle ${ok ? "ok" : "ko"}" data-judge="${id}" data-ok="${ok ? 0 : 1}">${ok ? t("correct") : t("wrong")}</button>` : gainsTag(id)}</div>`;
  }).join("") || `<p class="muted">${t("nobody")}</p>`;
  return `<div class="stage">${roundHTML()}${questionHTML()}<div class="solution">${esc(tr(S.solution))}</div>
    <div class="answers">${rows}</div>${host ? `<p class="muted small">${t("autoHint")}</p>` : ""}${nextBtn()}</div>`;
}
function closestReview() {
  const fmt = (n) => Number(n).toLocaleString(lang);
  const rows = Object.entries(S.answers).map(([id, a]) => ({ id, a, d: Math.abs(Number(a) - S.solution) }))
    .sort((x, y) => (isNaN(x.d) ? 1 : isNaN(y.d) ? -1 : x.d - y.d))
    .map(({ id, a, d }) => `<div class="ans ${S.gains[id] ? "ok" : ""}"><span class="who">${who(id)}</span><span class="what">${esc(isNaN(+a) ? a : fmt(a))} <span class="muted small">${isNaN(d) ? "" : d === 0 ? t("exact") : t("gap", { d: fmt(d) })}</span></span>${gainsTag(id)}</div>`)
    .join("") || `<p class="muted">${t("nobody")}</p>`;
  return `<div class="stage">${roundHTML()}${questionHTML()}<div class="solution">${fmt(S.solution)} ${esc(tr(S.unit))}</div><div class="answers">${rows}</div>${nextBtn()}</div>`;
}

// ---------- Petit Bac ----------
function bacPlay() {
  return `<div class="stage">${roundHTML("round")}${timerHTML()}<div class="letter">${S.letter}</div>
    <p class="muted" id="stopMsg" style="margin-bottom:12px">${t("bacHint", { l: S.letter })}</p>
    <div class="bac-grid">${S.categories.map((c, i) => `<div><label for="bac${i}">${esc(catName(c))}</label><input class="input" id="bac${i}" data-bac="${i}" autocomplete="off" maxlength="40" value="${esc(bacDraft[i] || "")}"></div>`).join("")}</div>
    <button class="btn pink big" id="stopBtn" style="max-width:560px">${t("stop")}</button>${skipBtn("endRound")}</div>`;
}
function bacReview() {
  const v = S.isValidator;
  const mk = (m) => ({ ok: "✓", almost: "≈", no: "✗" }[m]);
  const n = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const rows = S.entries.map((e) => {
    const dup = e.text && S.entries.some((o) => o.pid !== e.pid && n(o.text) === n(e.text));
    const btns = v
      ? `<span class="marks">${["ok", "almost", "no"].map((m) => `<button class="mark ${m} ${e.mark === m ? "on" : ""}" data-mark="${m}" data-pid="${e.pid}" title="${t("m_" + m)}">${mk(m)}</button>`).join("")}</span>`
      : `<span class="mark ${e.mark} on">${mk(e.mark)} ${t("m_" + e.mark)}</span>`;
    return `<div class="ans ${e.mark === "ok" ? "ok" : e.mark === "almost" ? "almost" : "ko"}"><span class="who">${who(e.pid)}</span>
      <span class="what">${esc(e.text) || "—"}${dup ? ` <span class="muted small">(${t("double")})</span>` : ""}</span>${btns}<span class="pts">${e.pts ? "+" + e.pts : ""}</span></div>`;
  }).join("") || `<p class="muted">${t("nobody")}</p>`;
  const last = S.page >= S.pages - 1;
  const nav = v
    ? `<div class="actions"><button class="btn ghost" id="prevPage" ${S.page === 0 ? "disabled" : ""}>${t("prev")}</button>
        ${last ? `<button class="btn primary" id="finishVal">${t("finishVal")}</button>` : `<button class="btn primary" id="nextPage">${t("nextPage")}</button>`}</div>`
    : `<p class="muted" style="margin-top:10px">${t("valWait")}</p>`;
  const totals = [...S.players].sort((a, b) => (S.totals[b.pid] || 0) - (S.totals[a.pid] || 0)).map((p) => `${p.avatar} ${esc(p.name)} <b>${S.totals[p.pid] || 0}</b>`).join(" · ");
  return `<div class="stage">
    <div class="round">${t("validation")} · ${t("round")} ${S.vRound}/${S.total} · ${S.page + 1}/${S.pages}</div>
    <div class="val-head"><div class="letter small-letter">${S.letter}</div><h2>${esc(catName(S.category))}</h2></div>
    <div class="answers">${rows}</div>
    <p class="muted small">${t("bacRules2")} ${v ? t("valHint") : ""}</p>${nav}
    <p class="small" style="margin-top:14px">${t("runningTotal")} : ${totals}</p></div>`;
}

// ---------- Mytho ! ----------
const blank = (q) => esc(tr(q)).replace("___", `<span class="blank">______</span>`);
function mythoPlay() {
  if (S.step === "write") return `<div class="stage">${roundHTML()}${timerHTML()}<div class="question">${blank(S.question)}</div>
    <p class="muted" style="margin:-8px 0 14px">${t("mythoWrite")}</p>
    ${iDid() ? sentHTML(myAnswer) : answerForm(t("mythoPh"))}${waitingHTML()}${skipBtn("next")}</div>`;
  const voted = S.myVote;
  return `<div class="stage">${roundHTML()}${timerHTML()}<div class="question">${blank(S.question)}</div>
    <p class="muted" style="margin:-8px 0 14px">${voted ? t("voteSent") : t("mythoVote")}</p>
    <div class="options">${S.options.map((o) => `<button class="option ${o.mine ? "mine" : ""} ${voted === o.id ? "on" : ""}" data-vote="${o.id}" ${o.mine || voted ? "disabled" : ""}>${esc(tr(o.text))}${o.mine ? ` <span class="muted small">(${t("mythoMine")})</span>` : ""}</button>`).join("")}</div>
    ${waitingHTML()}${skipBtn("showAnswers")}</div>`;
}
function mythoReview() {
  const rows = [...S.options].sort((a, b) => b.truth - a.truth).map((o) => `
    <div class="ans ${o.truth ? "ok" : ""}"><span class="what"><b>${esc(tr(o.text))}</b><br><span class="muted small">${o.truth ? t("mythoTruth") : t("mythoBy", { n: o.authors.map((a) => who(a)).join(", ") })}</span></span>
      <span class="voters">${o.voters.map((v) => playerOf(v).avatar).join(" ")}</span></div>`).join("");
  const gains = S.players.filter((p) => S.gains[p.pid]).map((p) => `${p.avatar} ${esc(p.name)} <b class="pts">+${S.gains[p.pid]}</b>`).join(" · ");
  return `<div class="stage">${roundHTML()}<div class="question">${blank(S.question)}</div><div class="answers">${rows}</div>
    <p class="small">${gains}</p>${nextBtn()}</div>`;
}

// ---------- Même cerveau ----------
function brainPlay() {
  return `<div class="stage">${roundHTML()}${timerHTML()}<div class="question">${esc(tr(S.question))}</div>
    ${iDid() ? sentHTML(myAnswer) : answerForm(t("brainPh"))}${waitingHTML()}${skipBtn()}</div>`;
}
function brainReview() {
  const host = isHost();
  const rows = S.groups.map((gr, i) => `<div class="ans ${gr.pids.length > 1 ? "ok" : ""} ${mergeSel === i ? "sel" : ""}" ${host ? `data-merge="${i}"` : ""}>
      <span class="what"><b>${esc(gr.text)}</b> <span class="muted small">×${gr.pids.length}</span></span>
      <span class="voters">${gr.pids.map((p) => playerOf(p).avatar).join(" ")}</span>${gr.pids.length > 1 ? `<span class="pts">+${gr.pids.length - 1}</span>` : ""}</div>`).join("")
    || `<p class="muted">${t("nobody")}</p>`;
  return `<div class="stage">${roundHTML()}<div class="question">${esc(tr(S.question))}</div><div class="answers">${rows}</div>
    ${host ? `<p class="muted small">${t("brainMerge")}</p>` : ""}${nextBtn()}</div>`;
}

// ---------- C'est toi ! ----------
function yourePlay() {
  const others = S.players.filter((p) => p.pid !== pid);
  return `<div class="stage">${roundHTML()}${timerHTML()}<div class="question">${esc(tr(S.question))}</div>
    ${iDid() ? `<p class="sent">${t("voteSent")}</p>` : `<p class="muted" style="margin-bottom:12px">${t("youreVote")}</p>
    <div class="vote-grid">${others.map((p) => `<button class="vote-btn" data-who="${p.pid}"><span>${p.avatar}</span>${esc(p.name)}</button>`).join("")}</div>`}
    ${waitingHTML()}${skipBtn()}</div>`;
}
function youreReview() {
  const names = S.elected.map((id) => who(id)).join(", ");
  const rows = Object.entries(S.tally).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<div class="ans ${S.elected.includes(id) ? "ok" : ""}"><span class="who">${who(id)}</span>
    <span class="what muted small">${t("votesFor", { n })}</span><span class="voters">${Object.keys(S.votes).filter((v) => S.votes[v] === id).map((v) => playerOf(v).avatar).join(" ")}</span></div>`).join("");
  const gains = S.players.filter((p) => S.gains[p.pid]).map((p) => `${p.avatar} ${esc(p.name)} <b class="pts">+1</b>`).join(" · ");
  return `<div class="stage">${roundHTML()}<div class="question">${esc(tr(S.question))}</div>
    ${names ? `<div class="solution">👑 ${t("elected", { n: names })}</div>` : `<p class="muted">${t("nobody")}</p>`}
    <div class="answers">${rows}</div><p class="small">${gains}</p>${nextBtn()}</div>`;
}

// ---------- Torpille ----------
function gridHTML(owner, clickable) {
  const b = S.boards[owner];
  if (!b) return "";
  const ships = new Set((b.ships || []).flat());
  const sunk = new Set(b.sunk.flat());
  let cells = "";
  for (let i = 0; i < S.size * S.size; i++) {
    const shot = b.shots[i];
    const cls = [shot || "", ships.has(i) ? "ship" : "", sunk.has(i) ? "sunk" : "", clickable && !shot ? "aim" : ""].join(" ");
    cells += `<button class="cell ${cls}" ${clickable && !shot ? `data-shot="${i}"` : "disabled"}>${shot === "hit" ? "💥" : shot === "miss" ? "•" : ""}</button>`;
  }
  return `<div class="grid" style="grid-template-columns:repeat(${S.size},1fr)">${cells}</div>`;
}
function fleetCard(owner, title, clickable) {
  const b = S.boards[owner];
  return `<div class="fleet ${b.down ? "down" : ""}"><p class="label">${title} · <span class="muted">${b.down ? t("fleetDown") : t("shipsLeft", { n: b.left })}</span></p>${gridHTML(owner, clickable)}</div>`;
}
function torpPlay() {
  if (S.step === "question") return `<div class="stage">${roundHTML("round")}${timerHTML()}${questionHTML()}
    <p class="muted" style="margin:-8px 0 12px">${t("torpQuestion")}</p>
    ${iDid() ? sentHTML(myAnswer) : answerForm(t("answerPh"))}${waitingHTML()}${skipBtn("next")}
    ${S.boards[pid] ? `<div class="fleets">${fleetCard(pid, t("yourFleet"), false)}</div>` : ""}</div>`;
  const left = (S.shotsLeft || {})[pid] || 0;
  const alive = Object.keys(S.boards).filter((id) => id !== pid && !S.boards[id].down);
  const target = S.target;
  return `<div class="stage">${roundHTML("round")}${timerHTML()}
    <div class="solution small-sol">${esc(tr(S.solution))} · ${S.judged[pid] ? t("correct") : t("wrong")}</div>
    <p class="big-msg">${left > 0 ? `${t("torpShoot")} <b>${t("shotsLeft", { n: left })}</b>` : t("waitShots")}</p>
    ${alive.length > 1 && left > 0 ? `<p class="label">${t("chooseTarget")}</p><div class="chips" style="justify-content:center;margin-bottom:12px">${alive.map((id) => `<button class="chip ${target === id ? "on" : ""}" data-target="${id}">${who(id)}</button>`).join("")}</div>` : ""}
    <div class="fleets">${target && S.boards[target] ? fleetCard(target, t("targetFleet", { n: esc(playerOf(target).name) }), left > 0) : ""}${S.boards[pid] ? fleetCard(pid, t("yourFleet"), false) : ""}</div>
    ${skipBtn("next")}</div>`;
}
function torpReview() {
  const log = (S.log || []).map((l) => `<div class="ans ${l.hit ? "ok" : ""}"><span class="what">${who(l.from)} → ${who(l.to)}</span><span>${l.sunk ? t("sunk") : l.hit ? t("hit") : t("miss")}</span></div>`).join("");
  const others = Object.keys(S.boards).filter((id) => id !== pid);
  return `<div class="stage">${roundHTML("round")}<div class="answers">${log || `<p class="muted">${t("nobody")}</p>`}</div>
    <div class="fleets">${S.boards[pid] ? fleetCard(pid, t("yourFleet"), false) : ""}${others.map((id) => fleetCard(id, t("targetFleet", { n: esc(playerOf(id).name) }), false)).join("")}</div>${nextBtn()}</div>`;
}

// ---------- Fin de partie ----------
function finalHTML() {
  const ranked = [...S.players].sort((a, b) => b.score - a.score);
  if (S.solo) {
    const r = S.result;
    return `<div class="stage" style="padding:20px 0">${avHTML(playerOf(pid), "xl")}<h2 class="final-title">${t("gameOver")}</h2>
      <p class="muted" style="margin-top:14px;font-weight:800">${t("yourScore")}</p><div class="score-big">${ranked[0] ? ranked[0].score : 0}</div>
      <p class="big-msg">${r ? (r.rank ? `🏆 ${t("yourRank", { r: r.rank, t: themeName(r.theme) })}` : "") : t("rankSaving")}</p>
      ${xpBlock()}
      <div class="actions"><button class="btn primary" id="again">🔁 ${t("playAgain")}</button><button class="btn violet" id="seeRank">🏆 ${t("seeRanking")}</button><button class="btn ghost" id="home">${t("home")}</button></div></div>`;
  }
  const [a, b, c] = ranked;
  const top = a && a.score > 0 ? a : null;
  const pod = (p, n) => (p ? `<div class="pod p${n}"><div class="who-top">${n === 1 ? `<span style="font-size:26px">👑</span>` : ""}${avHTML(p, n === 1 ? "xl" : "lg")}<div class="nm">${esc(p.name)}</div><div class="sc">${p.score} pts</div></div><div class="step">${n}</div></div>` : "");
  const btns = S.auto
    ? `<div class="actions"><button class="btn primary" id="requeue">⚡ ${t("playAgainOnline")}</button><button class="btn ghost" id="home">${t("home")}</button></div>`
    : isHost() ? `<div class="actions"><button class="btn primary" id="again">🔁 ${t("playAgain")}</button><button class="btn violet" id="toLobby2">🎮 ${t("changeGameBtn")}</button><button class="btn ghost" id="home">${t("mainMenu")}</button></div><p class="keep">${t("keepRoom")}</p>`
    : `<p class="muted" style="font-weight:700">${t("hostCanRestart")}</p><div class="actions"><button class="btn ghost" id="home">${t("mainMenu")}</button></div>`;
  const mk = { no: "✗", almost: "≈", ok: "✓" };
  const recap = S.recap && S.recap.length ? `<details class="recap" open><summary class="label">${t("recap")} (${S.recap.length})</summary>${S.recap.map((r, i) => {
    const m = r.marks[pid], mine = r.answers[pid];
    return `<div class="recap-row"><span class="num">${i + 1}</span><div class="rq"><div>${THEME_INFO[r.t] ? THEME_INFO[r.t].ico + " " : ""}${esc(tr(r.q))}</div>
      <div class="ra">✅ <b>${esc(tr(r.a))}</b>${pid in r.answers ? ` · ${t("yourAnswer")} : <span class="mark ${m} on">${mk[m] || ""}</span> ${esc(mine) || "—"}` : ""}${r.comments[pid] ? ` · 💬 ${esc(r.comments[pid])}` : ""}</div></div></div>`;
  }).join("")}</details>` : "";
  const full = `<p class="label" style="margin-top:8px">${t("finalRanking")}</p><ol class="ranking final">${ranked.map((p, i) => `<li class="${p.pid === pid ? "me" : ""}" style="animation-delay:${1.1 + i * 0.06}s"><span class="pos">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>${avHTML(p, "sm")}<span class="nm">${esc(p.name)}</span>${lvlTag(p)}<b>${p.score} pts</b></li>`).join("")}</ol>`;
  const headline = top ? (top.pid === pid ? `🎉 ${t("youWin")}` : t("winnerIs", { n: esc(top.name) })) : "";
  return `<div class="stage"><h2 class="final-title">${t("gameOver")}</h2>${headline ? `<p class="final-sub">${headline}</p>` : ""}
    <div class="podium">${pod(b, 2)}${pod(a, 1)}${pod(c, 3)}</div>${xpBlock()}${full}${btns}${recap}</div>`;
}
// Bloc « +XP » de fin de partie, avec la barre qui se remplit
function xpBlock() {
  const x = S && S.xp;
  if (!x) return "";
  const A = levelInfo(x.before), B = levelInfo(x.after);
  const from = x.up > 0 ? 0 : Math.round((A.into / A.need) * 100), to = Math.round((B.into / B.need) * 100);
  return `<div class="xp-end ${x.up > 0 ? "up" : ""}"><div class="xp-gain">${t("xpGain", { n: x.g })}</div>
    <div class="lvl-row"><span class="lvl-badge">${B.lvl}</span><div class="lvl-txt"><b>${x.up > 0 ? "⭐ " + t("levelUp") + " " : ""}${t("lvlLong", { n: B.lvl })} · ${lvlTitle(B.lvl)}</b><small>${t("xpOf", { a: B.into, b: B.need })}</small></div></div>
    <div class="lvl-bar"><i style="--from:${from}%;--to:${to}%"></i></div></div>`;
}

// Confettis légers (canvas, ~3 s, s'arrête tout seul)
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const old = $("#confetti"); if (old) old.remove();
  const cv = document.createElement("canvas"); cv.id = "confetti"; document.body.appendChild(cv);
  const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
  cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
  const cols = ["#7c5cff", "#22d3c5", "#3b82f6", "#ff6b6b", "#ffd34d", "#34d399", "#ec4899"];
  const N = innerWidth < 600 ? 90 : 160;
  const ps = Array.from({ length: N }, (_, i) => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 22 * dpr, vy: (-Math.random() * 20 - 8) * dpr,
    r: (4 + Math.random() * 6) * dpr, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, delay: i < N / 2 ? 0 : 25,
  }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      if (f < p.delay) continue;
      p.vy += 0.55 * dpr; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - f / 190);
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (++f < 190) requestAnimationFrame(tick); else cv.remove();
  })();
}

function readBac() { return S.categories.map((_, i) => { const el = $(`#bac${i}`); return el ? el.value : bacDraft[i] || ""; }); }

function bindRoom() {
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el[ev] = fn; };
  bindNav();
  on("#readyBtn", "onclick", () => socket.emit("ready"));
  on("#editMe", "onclick", openProfile);
  on("#tvBtn", "onclick", openTv);
  on("#copyLink", "onclick", async () => { try { await navigator.clipboard.writeText(joinUrl(S.code)); toast(t("linkCopied")); } catch { toast(joinUrl(S.code)); } });
  on("#leave", "onclick", () => { if (!confirm(t("leaveQ"))) return; socket.emit("leave"); leaveLocal(); });
  on("#home", "onclick", () => { socket.emit("leave"); leaveLocal(); });
  on("#requeue", "onclick", () => { socket.emit("leave"); store.del("room"); S = null; local = "queue"; screenKey = ""; render(); socket.emit("quick", withSeen(profile())); });
  on("#seeRank", "onclick", () => { const th = rankOf(S.settings.theme); socket.emit("leave"); store.del("room"); S = null; openRanking(th); });
  on("#toLobby", "onclick", () => confirm(t("backLobbyQ")) && socket.emit("lobby"));
  on("#toLobby2", "onclick", () => socket.emit("lobby"));
  const start = () => socket.emit("start", null, (r) => r && r.error && toast(t(r.error, { min: r.min })));
  on("#again", "onclick", start);
  on("#start", "onclick", start);
  on("#next", "onclick", () => socket.emit("next"));
  on("#skip", "onclick", () => socket.emit("next"));
  on("#share", "onclick", async () => {
    const url = joinUrl(S.code);
    try { if (navigator.share) await navigator.share({ title: t("inviteTitle"), text: t("shareText", { code: S.code }), url }); else { await navigator.clipboard.writeText(url); toast(t("linkCopied")); } } catch {}
  });
  const qr = $("#qr");
  if (qr) fetch(`/qr?u=${encodeURIComponent(joinUrl(S.code))}`).then((r) => r.text()).then((svg) => (qr.innerHTML = svg)).catch(() => {});

  // Réglages (hôte)
  $$("[data-game]").forEach((b) => (b.onclick = () => socket.emit("settings", { game: b.dataset.game })));
  $$("[data-tg]").forEach((b) => (b.onclick = () => socket.emit("settings", { settings: { theme: toggleTheme(S.settings.theme, b.dataset.tg) } })));
  $$("[data-set]").forEach((b) => (b.onclick = () => { const v = b.dataset.val; socket.emit("settings", { settings: { [b.dataset.set]: isNaN(+v) ? v : +v } }); }));
  $$("[data-range]").forEach((r) => {
    r.oninput = () => ($("#lbl-" + r.dataset.range).textContent = r.value + r.dataset.unit);
    r.onchange = () => socket.emit("settings", { settings: { [r.dataset.range]: +r.value } });
  });
  $$("[data-cat]").forEach((b) => (b.onclick = () => {
    const c = b.dataset.cat, cur = S.settings.categories;
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    if (!next.length) return toast(t("keepOneCat"));
    socket.emit("settings", { settings: { categories: next } });
  }));
  const addCat = () => { const v = $("#newCat").value.trim(); if (v && !S.settings.categories.includes(v)) socket.emit("settings", { settings: { categories: [...S.settings.categories, v] } }); };
  on("#addCat", "onclick", addCat);
  on("#newCat", "onkeydown", (e) => { if (e.key === "Enter") addCat(); });

  // Réponses
  on("#ansForm", "onsubmit", (e) => {
    e.preventDefault();
    let v = $("#ans").value.trim();
    if (!v) return;
    if (S.game === "closest") {
      v = v.replace(",", ".").replace(/\s/g, "");
      if (!Number.isFinite(Number(v))) return toast(t("enterNumber"));
    }
    Sound.play("send");
    act({ type: "answer", value: v }, (r) => {
      if (r && r.error) { myAnswer = null; screenKey = ""; render(); toast(t(r.error)); }
    });
    myAnswer = v;
  });
  if ($("#ans") && !isTouch()) $("#ans").focus();
  $$("[data-bac]").forEach((inp) => (inp.oninput = () => {
    bacDraft[+inp.dataset.bac] = inp.value;
    clearTimeout(bindRoom.t); bindRoom.t = setTimeout(() => { if (S && S.phase === "play") act({ type: "answer", value: readBac(), round: S.round }); }, 400);
  }));
  on("#stopBtn", "onclick", () => {
    const v = readBac();
    if (!v.every((x) => x.trim())) return toast(t("fillAll"));
    act({ type: "stop", value: v, round: S.round });
  });
  $$("[data-vote]").forEach((b) => (b.onclick = () => act({ type: "vote", id: +b.dataset.vote })));
  $$("[data-who]").forEach((b) => (b.onclick = () => act({ type: "vote", pid: b.dataset.who })));
  $$("[data-target]").forEach((b) => (b.onclick = () => act({ type: "target", pid: b.dataset.target })));
  $$("[data-shot]").forEach((b) => (b.onclick = () => { b.disabled = true; act({ type: "shot", cell: +b.dataset.shot }); }));

  $$("[data-mix]").forEach((b) => (b.onclick = () => socket.emit("settings", { settings: { mix: b.dataset.mix === "1" } })));
  // Quiz libre : validation
  $$("[data-qmark]").forEach((b) => (b.onclick = () => act({ type: "mark", pid: b.dataset.pid, mark: b.dataset.qmark })));
  $$("[data-comment]").forEach((el) => (el.onchange = () => act({ type: "comment", pid: el.dataset.comment, text: el.value })));
  $$("[data-tm]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.tm, cur = S.settings.themes || [];
    const themes = id === "all" ? [] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    socket.emit("settings", { settings: { themes } });
  }));
  // Petit Bac : validation commune
  $$("[data-mark]").forEach((b) => (b.onclick = () => act({ type: "mark", pid: b.dataset.pid, mark: b.dataset.mark })));
  on("#prevPage", "onclick", () => act({ type: "page", dir: -1 }));
  on("#nextPage", "onclick", () => act({ type: "page", dir: 1 }));
  on("#finishVal", "onclick", () => act({ type: "finish" }));
  if (S.game === "blindtest") btBind();

  // Correction (hôte)
  $$("[data-judge]").forEach((b) => (b.onclick = () => act({ type: "judge", pid: b.dataset.judge, ok: b.dataset.ok === "1" })));
  $$("[data-bv]").forEach((td) => (td.onclick = () => act({ type: "judge", pid: td.dataset.bv, i: +td.dataset.i, ok: td.dataset.ok === "1" })));
  $$("[data-merge]").forEach((el) => (el.onclick = () => {
    const i = +el.dataset.merge;
    if (mergeSel === null) { mergeSel = i; screenKey = ""; render(); return; }
    if (mergeSel !== i) act({ type: "merge", a: Math.min(mergeSel, i), b: Math.max(mergeSel, i) });
    mergeSel = null; screenKey = ""; render();
  }));
}
const isTouch = () => matchMedia("(pointer: coarse)").matches;

// Parties qui changent sans reconstruire l'écran (joueurs, compteur de réponses)
function updateLive() {
  if (!S) return;
  const list = $("#players");
  const conn = S.players.filter((p) => p.connected);
  if (list) {
    const ranked = [...S.players].sort((a, b) => b.score - a.score);
    $("#nbPlayers").textContent = S.players.length;
    list.innerHTML = ranked.map((p, i) => `
      <div class="player ${p.connected ? "" : "off"} ${S.phase === "play" && (S.answered || []).includes(p.pid) ? "done" : ""}">
        ${S.phase !== "lobby" ? `<span class="rk">${i + 1}</span>` : ""}${avHTML(p, "sm")}<span class="nm">${esc(p.name)}${p.pid === pid ? ` (${t("you")})` : ""}</span>${lvlTag(p)}
        ${p.pid === S.hostPid && !S.auto ? `<span class="tag host">${t("hostLbl")}</span>` : ""}
        ${S.phase === "lobby" && p.ready && p.pid !== S.hostPid ? `<span class="tag ready">${t("readyTag")}</span>` : ""}
        ${!p.connected ? `<span class="tag">${t("offlineTag")}</span>` : ""}
        ${["bac", "quiz"].includes(S.game) && (S.coval || []).includes(p.pid) ? `<span class="tag val">${t("validator")}</span>` : ""}
        ${["bac", "quiz"].includes(S.game) && !S.auto && isHost() && p.pid !== pid && S.phase === "lobby" ? `<button class="x" data-coval="${p.pid}" title="${t("makeCoval")}" aria-label="${t("makeCoval")}">${(S.coval || []).includes(p.pid) ? "☑" : "☐"}</button>` : ""}
        ${S.phase !== "lobby" ? `<span class="sc ${lastScores[p.pid] !== undefined && p.score > lastScores[p.pid] ? "bump" : ""}">${p.score}</span>` : ""}
        ${isHost() && p.pid !== pid ? `<button class="x" data-kick="${p.pid}" aria-label="kick">✕</button>` : ""}
      </div>`).join("");
    list.querySelectorAll("[data-coval]").forEach((b) => (b.onclick = () => socket.emit("coval", b.dataset.coval)));
    list.querySelectorAll("[data-kick]").forEach((b) => (b.onclick = () => confirm(t("kickQ")) && socket.emit("kick", b.dataset.kick)));
    lastScores = Object.fromEntries(S.players.map((p) => [p.pid, p.score]));
  }
  // Lobby : foule de joueurs, statut « prêt », barre de lancement
  const crowd = $("#crowd");
  if (crowd) {
    const slots = Math.max(0, (MIN_PLAYERS[S.game] || 2) - S.players.length);
    crowd.innerHTML = S.players.map((p) => `<div class="bubble ${p.ready || p.pid === S.hostPid ? "ready" : ""} ${p.connected ? "" : "off"}" ${p.pid === pid && !isHost() ? 'data-edit-me="1" style="cursor:pointer"' : ""}>
        ${p.pid === S.hostPid ? `<span class="crown">👑</span>` : ""}${avHTML(p)}<span class="bn">${esc(p.name)}</span>${lvlTag(p)}
        <span class="st">${p.pid === S.hostPid ? t("hostLbl") : p.ready ? "✓ " + t("readyTag") : t("waitingTag")}</span></div>`).join("")
      + Array.from({ length: slots }, () => `<div class="bubble empty"><span class="avt">+</span><span class="bn muted">…</span></div>`).join("");
    crowd.querySelectorAll("[data-edit-me]").forEach((b) => (b.onclick = openProfile));
  }
  const st = $("#startStatus");
  if (st) {
    const others = conn.filter((p) => p.pid !== S.hostPid);
    const ready = others.filter((p) => p.ready).length;
    const min = MIN_PLAYERS[S.game] || 1;
    if (isHost()) {
      const okN = conn.length >= min;
      st.innerHTML = `${t("hostStatus", { n: conn.length })}<small>${!okN ? t("needMore", { n: min }) : others.length && ready === others.length ? "✓ " + t("allReady") : t("readyCount", { r: ready, n: others.length })}</small>`;
      const b = $("#start"); if (b) b.disabled = !okN;
    } else {
      const mine = S.players.find((p) => p.pid === pid);
      st.innerHTML = `${t("waitStart")}<small>${t("readyCount", { r: ready, n: others.length })}</small>`;
      const rb = $("#readyBtn");
      if (rb) { rb.textContent = mine && mine.ready ? "↩ " + t("notReadyBtn") : "✓ " + t("readyBtn"); rb.className = "btn " + (mine && mine.ready ? "ghost" : "green"); }
    }
  }
  const w = $("#waiting");
  if (w && S.phase === "play") w.textContent = t("answered", { n: (S.answered || []).length, t: conn.length });
  if (S.phase === "play" && S.game === "bac" && S.stoppedBy) {
    const m = $("#stopMsg");
    if (m) m.innerHTML = `<b style="color:var(--coral)">${t("stopped", { n: esc(S.stoppedBy) })} ${t("stop10")}</b>`;
    const b = $("#stopBtn"); if (b) b.disabled = true;
  }
}

// Chronomètre animé (couleur + battement dans les 5 dernières secondes, tic-tac sonore)
let lastSec = null;
setInterval(() => {
  if (!S || S.phase !== "play" || !S.deadline) return;
  const bar = $("#tbar"), num = $("#tnum"), box = $("#timer");
  if (!bar) return;
  const left = Math.max(0, S.deadline - (Date.now() + clockOffset));
  if (!bar.dataset.total || left > +bar.dataset.total) bar.dataset.total = left; // durée de l'étape en cours
  const ratio = Math.min(1, left / (+bar.dataset.total || 1));
  bar.style.width = ratio * 100 + "%";
  const sec = Math.ceil(left / 1000);
  num.textContent = sec + " s";
  if (box) { box.classList.toggle("danger", sec <= 5 && left > 0); box.classList.toggle("warn", sec > 5 && ratio < 0.35); }
  if (sec !== lastSec) { if (sec <= 5 && sec > 0 && !iDid()) Sound.play(sec <= 3 ? "tickUrgent" : "tick"); lastSec = sec; }
}, 200);

render();
