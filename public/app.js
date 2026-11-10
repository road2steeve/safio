// ======== Réglages faciles ========
const APP_NAME = ["SAF", "IO"]; // le nom affiché (2e partie en couleur)
const AVATARS = ["🦊", "🐼", "🐸", "🐙", "🦁", "🐵", "🐧", "🦄", "🐯", "🐨", "🐷", "🐢", "👽", "🤖", "👻", "🎃", "🌵", "🍕"];
const GAMES = {
  quiz: { ico: "💡", color: "#4ea8ff" },
  mytho: { ico: "🎭", color: "#a78bfa" },
  bac: { ico: "🔤", color: "#2fd6c1" },
  duel: { ico: "⚡", color: "#4ade80" },
  brain: { ico: "🤝", color: "#ff5c8a" },
  youre: { ico: "👉", color: "#ff9f43" },
  closest: { ico: "🎯", color: "#e0a96d" },
  torpille: { ico: "🚢", color: "#7aa2c8" },
};

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
const langSelect = () => `<select class="lang" id="langSel" aria-label="${t("language")}">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? "selected" : ""}>${v}</option>`).join("")}</select>`;

// ======== État ========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let pid = store.get("pid", null);
if (!pid) { pid = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set("pid", pid); }
const me = { name: store.get("name", ""), avatar: store.get("avatar", AVATARS[Math.floor(Math.random() * AVATARS.length)]) };
let S = null;              // dernier état reçu du serveur (null = hors salon)
let local = "home";        // écran hors salon : home | solo | queue | ranking
let clockOffset = 0;
let screenKey = "";
let myAnswer = null;       // réponse envoyée pour la manche en cours
let bacDraft = [];
let soloTheme = store.get("soloTheme", "all");
let rankTheme = "_global", rankPeriod = "week", rankRows = null;
let queueSize = 0;
let mergeSel = null;       // Même cerveau : groupe sélectionné par l'hôte

const socket = io({ auth: { pid } });
socket.on("connect", () => {
  const code = store.get("room", null);
  if (code) socket.emit("join", { code, pid, name: me.name, avatar: me.avatar }, (r) => { if (r.error) { store.del("room"); S = null; screenKey = ""; render(); } });
});
socket.on("state", (v) => {
  clockOffset = v.now - Date.now();
  S = v;
  store.set("room", v.code);
  render();
});
socket.on("queueSize", (n) => { queueSize = n; const el = $("#queueSize"); if (el) el.textContent = t("inQueue", { n }); });
socket.on("kicked", () => { leaveLocal(); toast(t("kicked")); });
socket.on("collect", () => { if (S && S.game === "bac" && S.phase === "play") act({ type: "answer", value: readBac(), round: S.round }); });

function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3500);
}
const act = (d, cb) => socket.emit("act", d, cb);
const isHost = () => S && S.hostPid === pid && !S.auto;
const iDid = () => S && (S.answered || []).includes(pid);
const joinUrl = (code) => `${location.origin}/?code=${code}`;
const brandHTML = () => `<div class="brand"><img src="logo.svg" alt=""><h1>${APP_NAME[0]}<span>${APP_NAME[1]}</span></h1></div>`;
const playerOf = (id) => (S && S.players.find((p) => p.pid === id)) || { name: "?", avatar: "❔" };
const who = (id) => { const p = playerOf(id); return `${p.avatar} ${esc(p.name)}`; };
function leaveLocal() { store.del("room"); S = null; local = "home"; screenKey = ""; history.replaceState(null, "", "/"); render(); }
function needName() {
  const el = $("#name");
  if (el) { me.name = el.value.trim(); store.set("name", me.name); }
  if (!me.name) { local = "home"; screenKey = ""; render(); toast(t("needName")); $("#name") && $("#name").focus(); return false; }
  return true;
}

// ======== Rendu principal ========
function render() {
  if (!S) return renderLocal();
  const g = S;
  let dyn = "";
  if (g.phase === "play") {
    dyn = [g.step, iDid()].join(",");
    if (g.game === "mytho") dyn += "," + g.myVote;
    if (g.game === "duel") dyn += "," + g.myOk;
    if (g.game === "torpille" && g.step === "shoot") dyn += JSON.stringify([g.boards, g.target, g.shotsLeft]);
  }
  if (g.phase === "review" || g.phase === "final") dyn = JSON.stringify([g.judged, g.valid, g.groups, g.result, g.players.map((p) => p.pid), mergeSel, g.page, g.entries, g.coval, g.marks, g.comments, g.recap]);
  const key = [lang, g.code, g.phase, g.game, g.round, g.hostPid, JSON.stringify(g.settings), dyn].join("|");
  if (key !== screenKey) {
    const sameRound = screenKey.includes(`|${g.code}|play|${g.game}|${g.round}|`);
    if (g.phase === "play" && !sameRound) { myAnswer = null; bacDraft = []; }
    if (g.phase !== "review") mergeSel = null;
    if (g.phase === "play" && g.game === "bac" && sameRound && $("[data-bac]")) bacDraft = readBac();
    screenKey = key;
    app.innerHTML = roomShell();
    $("#main").innerHTML = mainHTML();
    bindRoom();
  }
  updateLive();
}

function mainHTML() {
  if (S.phase === "lobby") return lobbyHTML();
  if (S.phase === "starting") return `<div class="stage"><p class="big-msg">⚡ ${t("matchFound")}</p></div>`;
  if (S.phase === "final") return finalHTML();
  const fn = {
    quiz: [qaPlay, quizReview], duel: [qaPlay, quizReview], closest: [qaPlay, closestReview], bac: [bacPlay, bacReview],
    mytho: [mythoPlay, mythoReview], brain: [brainPlay, brainReview], youre: [yourePlay, youreReview], torpille: [torpPlay, torpReview],
  }[S.game];
  return S.phase === "play" ? fn[0]() : fn[1]();
}

// ======== Écrans hors salon ========
function renderLocal() {
  const key = "local|" + lang + "|" + local + "|" + soloTheme + "|" + rankTheme + "|" + rankPeriod + "|" + JSON.stringify(rankRows);
  if (key === screenKey) return;
  screenKey = key;
  if (local === "solo") return renderSolo();
  if (local === "queue") return renderQueue();
  if (local === "ranking") return renderRanking();
  renderHome();
}

function renderHome() {
  const preCode = new URLSearchParams(location.search).get("code") || "";
  app.innerHTML = `
  <div class="home">
    <section class="hero">
      <div class="topbar" style="margin:0">${brandHTML()}${langSelect()}</div>
      <p class="lead">${t("tagline")}</p>
      <div class="badges"><span class="badge">${t("free")}</span><span class="badge">${t("noAccount")}</span><span class="badge">${t("remote")}</span></div>
      <div class="modes">
        <button class="mode-tile" id="goSolo"><b>${t("soloMode")}</b><span>${t("soloMode_d")}</span></button>
        <button class="mode-tile" id="goQuick"><b>${t("quickMode")}</b><span>${t("quickMode_d")}</span></button>
        <button class="mode-tile" id="goRank"><b>${t("worldRanking")}</b></button>
      </div>
    </section>
    <section class="card">
      <p class="label">${t("nickname")}</p>
      <div class="row">
        <button class="avatar-btn" id="avBtn">${me.avatar}</button>
        <input class="input" id="name" maxlength="16" placeholder="${t("namePh")}" value="${esc(me.name)}" autocomplete="nickname">
      </div>
      <div class="avatar-grid" id="avGrid" hidden>${AVATARS.map((a) => `<button data-av="${a}" class="${a === me.avatar ? "on" : ""}">${a}</button>`).join("")}</div>
      <p class="label" style="margin-top:18px">${t("haveCode")}</p>
      <div class="row">
        <input class="input code-input" id="code" maxlength="4" placeholder="CODE" value="${esc(preCode)}" autocomplete="off" autocapitalize="characters">
        <button class="btn teal" id="joinBtn">${t("join")}</button>
      </div>
      <div class="sep">${t("orCreate")}</div>
      <div class="games">
        ${Object.entries(GAMES).map(([id, g]) => `
          <button class="game-tile" data-create="${id}">
            <span class="game-ico" style="background:${g.color}22;color:${g.color}">${g.ico}</span>
            <span><h3>${gameName(id)}</h3><p>${t("g_" + id + "_d")}</p></span>
          </button>`).join("")}
      </div>
    </section>
  </div>`;
  $("#langSel").onchange = (e) => setLang(e.target.value);
  $("#avBtn").onclick = () => ($("#avGrid").hidden = !$("#avGrid").hidden);
  $("#avGrid").onclick = (e) => {
    const a = e.target.closest("[data-av]"); if (!a) return;
    me.avatar = a.dataset.av; store.set("avatar", me.avatar);
    $("#avBtn").textContent = me.avatar; $("#avGrid").hidden = true;
  };
  $("#name").oninput = () => { me.name = $("#name").value.trim(); store.set("name", me.name); };
  const join = () => {
    if (!needName()) return;
    const code = $("#code").value.trim().toUpperCase();
    if (code.length !== 4) return toast(t("code4"));
    socket.emit("join", { code, pid, name: me.name, avatar: me.avatar }, (r) => r.error && toast(t(r.error)));
  };
  $("#joinBtn").onclick = join;
  $("#code").onkeydown = (e) => e.key === "Enter" && join();
  $$("[data-create]").forEach((b) => (b.onclick = () => {
    if (!needName()) return;
    socket.emit("create", { pid, name: me.name, avatar: me.avatar, game: b.dataset.create }, (r) => r.error && toast(t(r.error)));
  }));
  $("#goSolo").onclick = () => { if (needName()) { local = "solo"; render(); } };
  $("#goQuick").onclick = () => {
    if (!needName()) return;
    local = "queue"; render();
    socket.emit("quick", { pid, name: me.name, avatar: me.avatar });
  };
  $("#goRank").onclick = () => openRanking("_global");
  if (preCode && me.name) $("#joinBtn").focus(); else if (preCode) $("#name").focus();
}

function localShell(title, body) {
  app.innerHTML = `<div class="topbar">${brandHTML()}${langSelect()}</div>
    <section class="card narrow"><button class="btn ghost small" id="back">${t("back")}</button><h2 class="title">${title}</h2>${body}</section>`;
  $("#langSel").onchange = (e) => setLang(e.target.value);
  $("#back").onclick = () => { if (local === "queue") socket.emit("quickCancel"); local = "home"; render(); };
}

const themeGrid = (sel, attr) => `<div class="theme-grid">${Object.entries(THEME_INFO).map(([id, th]) => `<button class="theme ${sel === id ? "on" : ""} ${id === "random" || id === "all" ? "special" : ""}" ${attr}="${id}"><span>${th.ico}</span>${th[lang]}</button>`).join("")}</div>`;

function renderSolo() {
  localShell(t("soloTitle"), `<p class="muted" style="margin:6px 0 16px">${t("soloHint")}</p>
    <h3 class="sub" style="margin-bottom:10px">${t("theme")}</h3>${themeGrid(soloTheme, "data-st")}
    <div class="actions"><button class="btn ghost" id="soloRank">${t("worldRanking")}</button></div>
    <button class="btn primary big" id="soloGo" style="margin-top:16px">${t("play")}</button>`);
  $$("[data-st]").forEach((b) => (b.onclick = () => { soloTheme = b.dataset.st; store.set("soloTheme", soloTheme); render(); }));
  $("#soloGo").onclick = () => socket.emit("solo", { pid, name: me.name, avatar: me.avatar, theme: soloTheme });
  $("#soloRank").onclick = () => openRanking(soloTheme === "random" ? "all" : soloTheme);
}

function renderQueue() {
  localShell(t("quickMode"), `<div class="stage"><div class="spinner"></div><p class="big-msg">${t("searching")}</p>
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
  const g = GAMES[S.game];
  const label = S.solo ? t("soloTitle") : S.auto ? t("quickMode") : `${t("room")} <span class="room-code">${S.code}</span>`;
  return `
  <div class="topbar">
    ${brandHTML()}
    <div class="row" style="align-items:center">
      <div style="text-align:right">
        <div class="small muted">${g.ico} ${gameName(S.game)}</div>
        <div class="small">${label}</div>
      </div>
      ${langSelect()}
    </div>
  </div>
  <div class="layout">
    <section class="card" id="main"></section>
    <aside class="card">
      <p class="label">${t("players")} (<span id="nbPlayers"></span>)</p>
      <div class="players" id="players"></div>
      <div class="actions" style="justify-content:flex-start;margin-top:16px">
        ${isHost() && S.phase !== "lobby" ? `<button class="btn ghost small" id="toLobby">${t("backLobby")}</button>` : ""}
        <button class="btn ghost small" id="leave">${t("leave")}</button>
      </div>
    </aside>
  </div>`;
}

function slider(key, label, min, max, step, unit = "") {
  const v = S.settings[key];
  return `<div class="slider"><div class="slider-head"><span>${label}</span><b id="lbl-${key}">${v}${unit}</b></div>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-range="${key}" data-unit="${unit}"></div>`;
}
function howToHTML(g) {
  const R = (typeof RULES !== "undefined" && (RULES[lang] || RULES.fr)[g]) || null;
  const head = `<div class="howto-head"><b>${GAMES[g].ico} ${t("howTo", { g: gameName(g) })}</b><span class="muted small">${t("p_" + g)}</span></div>`;
  if (!R) return `<div class="howto">${head}<p>${t("r_" + g)}</p></div>`;
  const ex = R.ex;
  return `<div class="howto">${head}
    <div class="ex"><p class="label">${RULES_UI[lang] ? RULES_UI[lang].ex : RULES_UI.fr.ex}</p>
      ${ex.top ? `<div class="ex-top">${ex.top}</div>` : ""}
      <div class="ex-rows">${ex.rows.map((r) => `<div class="ex-row"><b>${r[0]}</b><span>${r[1]}</span>${r[2] ? `<em class="${r[2].startsWith("+") ? "plus" : ""}">${r[2]}</em>` : ""}</div>`).join("")}</div>
      ${ex.note ? `<p class="muted small">${ex.note}</p>` : ""}</div>
    <p class="label" style="margin-top:12px">${RULES_UI[lang] ? RULES_UI[lang].rules : RULES_UI.fr.rules}</p>
    <ol class="rules">${R.steps.map((s) => `<li>${s}</li>`).join("")}</ol></div>`;
}

function lobbyHTML() {
  const s = S.settings, host = isHost(), G = S.game;
  let settings = "";
  if (host) {
    settings = `<div class="settings"><div><h3 class="sub" style="margin-bottom:10px">${t("game")}</h3>
      <div class="games two">${Object.entries(GAMES).map(([id, g]) => `<button class="game-tile ${G === id ? "on" : ""}" data-game="${id}"><span class="game-ico" style="background:${g.color}22;color:${g.color}">${g.ico}</span><span><h3>${gameName(id)}</h3><p>${t("g_" + id + "_d")}</p></span></button>`).join("")}</div></div>
      ${howToHTML(G)}`;
    if ("themes" in s) {
      const sel = s.themes || [];
      const ids = Object.keys(THEME_INFO).filter((id) => id !== "random" && id !== "all");
      settings += `<div><h3 class="sub">${t("theme")} <span class="muted small">(${sel.length ? sel.length : t("allThemes")})</span></h3><p class="muted small" style="margin:4px 0 12px">${t("themesHint")}</p>
        <div class="theme-grid"><button class="theme special ${sel.length ? "" : "on"}" data-tm="all"><span>${THEME_INFO.all.ico}</span>${THEME_INFO.all[lang]}</button>${ids.map((id) => `<button class="theme ${sel.includes(id) ? "on" : ""}" data-tm="${id}"><span>${THEME_INFO[id].ico}</span>${THEME_INFO[id][lang]}</button>`).join("")}</div></div>`;
    }
    if ("theme" in s) settings += `<div><h3 class="sub">${t("theme")}</h3><p class="muted small" style="margin:4px 0 12px">${t("themeHint")}</p>${themeGrid(s.theme, 'data-set="theme" data-val')}</div>`;
    const sl = [];
    if ("time" in s) sl.push(slider("time", G === "bac" ? t("timePerRound") : t("timePerQ"), G === "bac" ? 30 : G === "duel" ? 5 : 10, G === "bac" ? 300 : G === "duel" ? 60 : 120, 5, " s"));
    if ("count" in s) sl.push(slider("count", t(G === "torpille" ? "rounds" : "questions"), 3, G === "closest" ? 20 : 30, 1));
    if ("rounds" in s) sl.push(slider("rounds", t("rounds"), 1, 10, 1));
    settings += `<div class="sliders"><h3 class="sub">${t("settings")}</h3>${sl.join("")}</div>`;
    if (G === "bac") settings += `<p class="muted small">${t("covalHint")}</p>`;
    if (G === "quiz") settings += `<p class="muted small">${t("covalHintQuiz")}</p>`;
    if (G === "bac") settings += `<div><p class="label">${t("catMode")}</p><div class="chips">
      <button class="chip ${s.mix ? "on" : ""}" data-mix="1">🎲 ${t("catMix")}</button><button class="chip ${s.mix ? "" : "on"}" data-mix="0">📌 ${t("catFixed")}</button></div>
      <p class="muted small" style="margin-top:6px">${t(s.mix ? "catMixHint" : "catFixedHint")}</p>
      ${s.mix ? `<div class="sliders" style="margin-top:8px">${slider("perRound", t("perRound"), 3, 10, 1)}</div>` : ""}</div>`;
    if (G === "bac") settings += `
      <div><p class="label">${s.mix ? t("myCats") : t("categories")} (${s.mix ? s.categories.filter((c) => !BAC_CATS[c]).length : s.categories.length})</p><div class="chips">${(s.mix ? s.categories.filter((c) => !BAC_CATS[c]) : [...new Set([...Object.keys(BAC_CATS), ...s.categories])]).map((c) => `<button class="chip ${s.categories.includes(c) ? "on" : ""}" data-cat="${esc(c)}">${esc(catName(c))}</button>`).join("")}</div>
        <div class="row" style="margin-top:10px"><input class="input" id="newCat" maxlength="30" placeholder="${t("addCat")}"><button class="btn" id="addCat">+</button></div></div>`;
    settings += `</div>`;
  }
  return `
    <div class="join-box">
      <div class="qr" id="qr"></div>
      <div>
        <p class="label">${t("toJoin")}</p>
        <p class="muted">${t("scanOr", { host: esc(location.host) })}</p>
        <div class="code-big">${S.code}</div>
        <button class="btn ghost small" id="share" style="margin-top:10px">${t("share")}</button>
      </div>
    </div>
    ${host ? settings + `<button class="btn primary big" id="start" style="margin-top:20px">${t("start")}</button>` : `${howToHTML(G)}<p class="sent" style="margin-top:20px;color:var(--muted)">${t("waitStart")}</p>`}`;
}

// ---------- Morceaux communs ----------
const timerHTML = () => `<div class="row" style="align-items:center"><div class="timer-bar" style="flex:1"><i id="tbar"></i></div><span class="timer-num" id="tnum"></span></div>`;
const themeBadge = () => (S.theme && THEME_INFO[S.theme] ? ` · ${THEME_INFO[S.theme].ico} ${THEME_INFO[S.theme][lang]}` : "");
const roundHTML = (word = "question") => `<div class="round">${t(word)} ${S.round} / ${S.total}${themeBadge()}</div>`;
const questionHTML = () => `<div class="question">${esc(tr(S.question))}</div>${S.img ? `<img class="qimg" src="${esc(S.img)}" alt="">` : ""}`;
const answerForm = (ph, numeric) => `<div id="answerZone"><form class="answer-form" id="ansForm">
    <input class="input" id="ans" autocomplete="off" ${numeric ? 'inputmode="decimal"' : ""} placeholder="${ph}" maxlength="80">
    <button class="btn primary">${t("send")}</button></form></div>`;
const sentHTML = (txt) => `<p class="sent">${t("sent")}${txt ? ` : <b>${esc(txt)}</b>` : ""}</p>`;
const waitingHTML = () => `<p class="muted small" style="margin-top:14px" id="waiting"></p>`;
const skipBtn = (label = "showAnswers") => (isHost() ? `<div class="actions"><button class="btn ghost" id="skip">${t(label)}</button></div>` : "");
const nextBtn = () => (isHost() ? `<div class="actions"><button class="btn primary big" id="next" style="max-width:420px">${S.round >= S.total ? t("ranking") : t("next")}</button></div>`
  : S.auto ? `<p class="muted" style="margin-top:10px">${t("autoNext")}</p>` : `<p class="muted" style="margin-top:10px">${t("hostChecking")}</p>`);
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
    return `<div class="stage"><h2 style="font-size:30px">${t("gameOver")}</h2>
      <p class="muted" style="margin-top:14px">${t("yourScore")}</p><div class="score-big">${ranked[0] ? ranked[0].score : 0}</div>
      <p class="big-msg">${r ? (r.rank ? `🏆 ${t("yourRank", { r: r.rank, t: themeName(r.theme) })}` : "") : t("rankSaving")}</p>
      <div class="actions"><button class="btn primary" id="again">${t("again")}</button><button class="btn" id="seeRank">${t("seeRanking")}</button><button class="btn ghost" id="home">${t("home")}</button></div></div>`;
  }
  const [a, b, c] = ranked;
  const pod = (p, n) => (p ? `<div class="pod p${n}"><div class="av">${p.avatar}</div><div class="nm">${esc(p.name)}</div><div class="sc">${p.score} pts</div><div>${["🥇", "🥈", "🥉"][n - 1]}</div></div>` : "");
  const btns = S.auto
    ? `<div class="actions"><button class="btn primary" id="requeue">${t("playAgainOnline")}</button><button class="btn ghost" id="home">${t("home")}</button></div>`
    : isHost() ? `<div class="actions"><button class="btn primary" id="again">${t("again")}</button><button class="btn" id="toLobby2">${t("changeSettings")}</button><button class="btn ghost" id="home">${t("mainMenu")}</button></div>`
    : `<p class="muted">${t("hostCanRestart")}</p><div class="actions"><button class="btn ghost" id="home">${t("mainMenu")}</button></div>`;
  const mk = { no: "✗", almost: "≈", ok: "✓" };
  const recap = S.recap && S.recap.length ? `<details class="recap" open><summary class="label">${t("recap")} (${S.recap.length})</summary>${S.recap.map((r, i) => {
    const m = r.marks[pid], mine = r.answers[pid];
    return `<div class="recap-row"><span class="num">${i + 1}</span><div class="rq"><div>${THEME_INFO[r.t] ? THEME_INFO[r.t].ico + " " : ""}${esc(tr(r.q))}</div>
      <div class="ra">✅ <b>${esc(tr(r.a))}</b>${pid in r.answers ? ` · ${t("yourAnswer")} : <span class="mark ${m} on">${mk[m] || ""}</span> ${esc(mine) || "—"}` : ""}${r.comments[pid] ? ` · 💬 ${esc(r.comments[pid])}` : ""}</div></div></div>`;
  }).join("")}</details>` : "";
  const full = `<p class="label" style="margin-top:8px">${t("finalRanking")}</p><ol class="ranking final">${ranked.map((p, i) => `<li class="${p.pid === pid ? "me" : ""}"><span class="pos">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span><span class="av">${p.avatar}</span><span class="nm">${esc(p.name)}</span><b>${p.score} pts</b></li>`).join("")}</ol>`;
  return `<div class="stage"><h2 style="font-size:34px">${t("gameOver")}</h2><div class="podium">${pod(b, 2)}${pod(a, 1)}${pod(c, 3)}</div>${full}${btns}${recap}</div>`;
}

function readBac() { return S.categories.map((_, i) => { const el = $(`#bac${i}`); return el ? el.value : bacDraft[i] || ""; }); }

function bindRoom() {
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el[ev] = fn; };
  on("#langSel", "onchange", (e) => setLang(e.target.value));
  on("#leave", "onclick", () => { if (!confirm(t("leaveQ"))) return; socket.emit("leave"); leaveLocal(); });
  on("#home", "onclick", () => { socket.emit("leave"); leaveLocal(); });
  on("#requeue", "onclick", () => { socket.emit("leave"); store.del("room"); S = null; local = "queue"; screenKey = ""; render(); socket.emit("quick", { pid, name: me.name, avatar: me.avatar }); });
  on("#seeRank", "onclick", () => { const th = S.settings.theme; socket.emit("leave"); store.del("room"); S = null; openRanking(th); });
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
  on("#newCat", "onkeydown", (e) => e.key === "Enter" && addCat());

  // Réponses
  on("#ansForm", "onsubmit", (e) => {
    e.preventDefault();
    let v = $("#ans").value.trim();
    if (!v) return;
    if (S.game === "closest") {
      v = v.replace(",", ".").replace(/\s/g, "");
      if (!Number.isFinite(Number(v))) return toast(t("enterNumber"));
    }
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
  if (list) {
    const ranked = [...S.players].sort((a, b) => b.score - a.score);
    $("#nbPlayers").textContent = S.players.length;
    list.innerHTML = ranked.map((p) => `
      <div class="player ${p.connected ? "" : "off"} ${S.phase === "play" && (S.answered || []).includes(p.pid) ? "done" : ""}">
        <span class="av">${p.avatar}</span><span class="nm">${esc(p.name)}${p.pid === pid ? ` (${t("you")})` : ""}</span>
        ${p.pid === S.hostPid && !S.auto ? `<span class="tag">${t("host")}</span>` : ""}
        ${["bac", "quiz"].includes(S.game) && (S.coval || []).includes(p.pid) ? `<span class="tag val">${t("validator")}</span>` : ""}
        ${["bac", "quiz"].includes(S.game) && !S.auto && isHost() && p.pid !== pid && S.phase === "lobby" ? `<button class="x" data-coval="${p.pid}" title="${t("makeCoval")}">${(S.coval || []).includes(p.pid) ? "☑" : "☐"}</button>` : ""}
        <span class="sc">${p.score}</span>
        ${isHost() && p.pid !== pid ? `<button class="x" data-kick="${p.pid}">✕</button>` : ""}
      </div>`).join("");
    list.querySelectorAll("[data-coval]").forEach((b) => (b.onclick = () => socket.emit("coval", b.dataset.coval)));
    list.querySelectorAll("[data-kick]").forEach((b) => (b.onclick = () => confirm(t("kickQ")) && socket.emit("kick", b.dataset.kick)));
  }
  const w = $("#waiting");
  if (w && S.phase === "play") w.textContent = t("answered", { n: (S.answered || []).length, t: S.players.filter((p) => p.connected).length });
  if (S.phase === "play" && S.game === "bac" && S.stoppedBy) {
    const m = $("#stopMsg");
    if (m) m.innerHTML = `<b style="color:var(--pink)">${t("stopped", { n: esc(S.stoppedBy) })} ${t("stop10")}</b>`;
    const b = $("#stopBtn"); if (b) b.disabled = true;
  }
}

setInterval(() => {
  if (!S || S.phase !== "play" || !S.deadline) return;
  const bar = $("#tbar"), num = $("#tnum");
  if (!bar) return;
  const left = Math.max(0, S.deadline - (Date.now() + clockOffset));
  if (!bar.dataset.total || left > +bar.dataset.total) bar.dataset.total = left; // durée de l'étape en cours
  bar.style.width = Math.min(100, (left / (+bar.dataset.total || 1)) * 100) + "%";
  num.textContent = Math.ceil(left / 1000) + " s";
}, 250);

render();
