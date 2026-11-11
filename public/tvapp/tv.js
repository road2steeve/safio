// SAFIO Quizz TV : écran collectif indépendant (télé, vidéoprojecteur, ordinateur branché à la télé).
// La télé est le centre de la soirée : QR pour rejoindre, ambiance sonore, animations, classement, podium.
// Elle ne joue pas : elle reçoit seulement la vue publique de la partie (« tv »).
// JavaScript prudent (sans syntaxes récentes) pour les navigateurs des téléviseurs.
(function () {
  "use strict";
  // Ressources du site (scripts classiques déjà chargés) : textes T, THEME_INFO, BAC_CATS, dessins ART, LOGO_SVG, AV_COLORS
  var SITE_T = typeof T !== "undefined" ? T : {};
  var KEY = "sq-tv";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  // ---------- Textes ----------
  var TX = {
    fr: {
      start: "Appuie sur OK pour commencer", startHelp: "Active le son et le plein écran", soundHint: "🔊 Appuie sur OK pour le son",
      scan: "Scannez pour jouer", orGo: "ou va sur", code: "code",
      step1: "Scanne le QR avec ton téléphone", step2: "Choisis ton pseudo et ton avatar", step3: "Le premier arrivé choisit le jeu et lance la partie",
      players: "{n} joueurs", players1: "1 joueur", welcome: "Bienvenue {name} !", hostPicks: "👑 <b>{name}</b> choisit le jeu et lance la partie",
      linkCode: "Une salle déjà ouverte sur un téléphone ? Code écran", go: "C'est parti !",
      round: "Manche {a} / {b}", onPhones: "Jouez sur vos téléphones", ranking: "Classement", night: "Total de la soirée", pts: "pts",
      lead: "{name} prend la tête !", tie: "Égalité en tête !", andWinner: "Et la victoire revient à…", winner: "{name} gagne !",
      ended: "Diffusion terminée", endedHelp: "Une nouvelle salle va s'ouvrir.", replaced: "Cet écran est ouvert ailleurs.", badLink: "Ce lien a expiré ou a déjà été utilisé.",
      lost: "Reconnexion…", muted: "Son coupé",
      answered: "{a} / {b} ont répondu", answer: "Réponse", writeFake: "✍️ Inventez une fausse réponse crédible", findTruth: "🔎 Trouvez la vraie réponse !",
      truth: "La vraie réponse", trapBy: "Piège de", sameAns: "🧠 Même réponse que les autres = des points", elected: "Désigné·e par le groupe",
      stopBy: "STOP ! par {name}", correction: "Correction", letter: "Lettre", fleet: "Flottes", shipsLeft: "{n} navires", sunk: "Coulée !", whoIs: "👉 Votez sur vos téléphones", mix: "Thèmes mélangés",
    },
    en: {
      start: "Press OK to start", startHelp: "Turns on sound and full screen", soundHint: "🔊 Press OK for sound",
      scan: "Scan to play", orGo: "or go to", code: "code",
      step1: "Scan the QR with your phone", step2: "Pick your name and avatar", step3: "The first one in picks the game and starts",
      players: "{n} players", players1: "1 player", welcome: "Welcome {name}!", hostPicks: "👑 <b>{name}</b> picks the game and starts",
      linkCode: "Room already open on a phone? Screen code", go: "Let's go!",
      round: "Round {a} / {b}", onPhones: "Play on your phones", ranking: "Ranking", night: "Tonight's total", pts: "pts",
      lead: "{name} takes the lead!", tie: "Tie at the top!", andWinner: "And the winner is…", winner: "{name} wins!",
      ended: "Screen disconnected", endedHelp: "A new room will open.", replaced: "This screen is open somewhere else.", badLink: "This link has expired or was already used.",
      lost: "Reconnecting…", muted: "Sound off",
      answered: "{a} / {b} answered", answer: "Answer", writeFake: "✍️ Make up a believable fake answer", findTruth: "🔎 Find the real answer!",
      truth: "The real answer", trapBy: "Trap by", sameAns: "🧠 Same answer as the others = points", elected: "Picked by the group",
      stopBy: "STOP! by {name}", correction: "Checking answers", letter: "Letter", fleet: "Fleets", shipsLeft: "{n} ships", sunk: "Sunk!", whoIs: "👉 Vote on your phones", mix: "Mixed themes",
    },
    es: {
      start: "Pulsa OK para empezar", startHelp: "Activa el sonido y la pantalla completa", soundHint: "🔊 Pulsa OK para el sonido",
      scan: "Escanea para jugar", orGo: "o entra en", code: "código",
      step1: "Escanea el QR con tu móvil", step2: "Elige tu apodo y tu avatar", step3: "El primero en llegar elige el juego y empieza",
      players: "{n} jugadores", players1: "1 jugador", welcome: "¡Bienvenido/a {name}!", hostPicks: "👑 <b>{name}</b> elige el juego y empieza",
      linkCode: "¿Sala ya abierta en un móvil? Código de pantalla", go: "¡Vamos!",
      round: "Ronda {a} / {b}", onPhones: "Jugad en vuestros móviles", ranking: "Clasificación", night: "Total de la noche", pts: "pts",
      lead: "¡{name} toma la delantera!", tie: "¡Empate en cabeza!", andWinner: "Y la victoria es para…", winner: "¡{name} gana!",
      ended: "Pantalla desconectada", endedHelp: "Se abrirá una nueva sala.", replaced: "Esta pantalla está abierta en otro sitio.", badLink: "Este enlace ha caducado o ya se usó.",
      lost: "Reconectando…", muted: "Sonido apagado",
      answered: "{a} / {b} han respondido", answer: "Respuesta", writeFake: "✍️ Inventad una respuesta falsa creíble", findTruth: "🔎 ¡Encontrad la respuesta verdadera!",
      truth: "La respuesta verdadera", trapBy: "Trampa de", sameAns: "🧠 Misma respuesta que los demás = puntos", elected: "Elegido/a por el grupo",
      stopBy: "¡STOP! de {name}", correction: "Corrección", letter: "Letra", fleet: "Flotas", shipsLeft: "{n} barcos", sunk: "¡Hundido!", whoIs: "👉 Votad en vuestros móviles", mix: "Temas mezclados",
    },
  };
  // SAFIO Blind Test : textes de la télé (le son vient de l'appli du DJ, la télé affiche le jeu)
  var BTX = {
    fr: { dj: "{name} lance la musique…", ready: "Préparez-vous !", find: "Trouvez", title: "le titre", artist: "l'artiste", work: "le film / dessin animé", and: "et",
      paused: "⏸ Pause", itWas: "C'était…", nobody: "Personne n'a trouvé", own: "Réponse donnée à voix haute", buzzers: "🔔 Buzzers", skipped: "Morceau passé", song: "Morceau",
      y70: "Années 70", y80: "Années 80", y90: "Années 90", y00: "Années 2000", y10: "Années 2010", films: "Films et séries", disney: "Disney et animation", frcult: "Chansons françaises cultes", ownCat: "Ma playlist" },
    en: { dj: "{name} is starting the music…", ready: "Get ready!", find: "Find", title: "the title", artist: "the artist", work: "the movie / cartoon", and: "and",
      paused: "⏸ Paused", itWas: "It was…", nobody: "Nobody found it", own: "Answer given out loud", buzzers: "🔔 Buzzers", skipped: "Song skipped", song: "Song",
      y70: "70s", y80: "80s", y90: "90s", y00: "2000s", y10: "2010s", films: "Movies & TV", disney: "Disney & animation", frcult: "French classics", ownCat: "My playlist" },
    es: { dj: "{name} pone la música…", ready: "¡Preparaos!", find: "Encontrad", title: "el título", artist: "el artista", work: "la película / los dibujos", and: "y",
      paused: "⏸ Pausa", itWas: "Era…", nobody: "Nadie la encontró", own: "Respuesta dada en voz alta", buzzers: "🔔 Pulsadores", skipped: "Canción saltada", song: "Canción",
      y70: "Años 70", y80: "Años 80", y90: "Años 90", y00: "Años 2000", y10: "Años 2010", films: "Cine y series", disney: "Disney y animación", frcult: "Clásicos franceses", ownCat: "Mi playlist" },
  };
  var BT_ICO = { y70: "🕺", y80: "📼", y90: "💿", y00: "📱", y10: "🎧", films: "🎬", disney: "🏰", frcult: "🇫🇷", own: "🎛️" };
  function btt(k, vars) {
    var s = (BTX[lang] && BTX[lang][k]) || BTX.fr[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] == null ? "" : vars[x]; });
    return s;
  }
  function btCat(c) { return BT_ICO[c] ? BT_ICO[c] + " " + btt(c === "own" ? "ownCat" : c) : ""; }
  function btEq(n, idle, small) {
    var h = "";
    for (var i = 0; i < n; i++) h += '<i style="animation-delay:-' + ((i * 0.37) % 1.3).toFixed(2) + "s;animation-duration:" + (0.7 + ((i * 7) % 5) / 10).toFixed(2) + 's"></i>';
    return '<div class="bt-eq' + (idle ? " idle" : "") + (small ? " small" : "") + '">' + h + "</div>";
  }
  // Blind Test : ce que la télé montre (jamais la réponse avant la révélation : elle ne la reçoit pas)
  function btHTML(s, g) {
    var b = g.bt || {}, rev = g.sub === "review";
    var parts = (b.parts || []).map(function (p) { return "<b>" + esc(btt(p)) + "</b>"; }).join(" " + esc(btt("and")) + " ");
    if (!rev && b.step === "cue") {
      var dj = playerOf(b.dj);
      return btEq(32, true) + '<div class="bt-dj">' + avatar(dj, 96) + "<span>🎧 " + esc(btt("dj", { name: dj.name })) + "</span></div>" + '<div class="hint">' + esc(btt("ready")) + "</div>";
    }
    if (!rev) {
      var html = btEq(32, !!b.paused, !!b.choices) + (b.paused ? '<div class="bt-paused">' + esc(btt("paused")) + "</div>" : "");
      if (parts) html += '<div class="bt-find">' + esc(btt("find")) + " " + parts + "</div>";
      if (b.choices) html += '<div class="opts bt-opts">' + b.choices.map(function (c, i) { return '<div class="opt"><span class="L">' + "ABCD".charAt(i) + "</span>" + esc(tr(c)) + "</div>"; }).join("") + "</div>";
      if (b.input === "buzz" && b.buzz && b.buzz.length) {
        html += '<div class="bt-buzzers"><span class="kicker">' + esc(btt("buzzers")) + "</span>" + b.buzz.map(function (x, i) {
          var p = playerOf(x.pid);
          return '<span class="bz' + (x.out ? " out" : "") + '">' + (i + 1) + ". " + avatar(p, 54) + esc(p.name) + "</span>";
        }).join("") + "</div>";
      }
      return html;
    }
    var R = b.reveal || {};
    var card = R.own
      ? '<div class="bt-reveal"><div class="vinyl"></div><div><div class="kicker">' + esc(btt("itWas")) + '</div><div class="bt-title">' + esc(btt("own")) + "</div></div></div>"
      : '<div class="bt-reveal"><div class="vinyl"></div><div><div class="kicker">' + esc(btt("itWas")) + " " + esc(btCat(R.cat)) + '</div><div class="bt-title">' + esc(tr(R.title)) + "</div>" +
        (R.artist ? '<div class="bt-artist">' + esc(R.artist) + "</div>" : "") + '<div class="bt-meta">' + (R.work ? "🎬 " + esc(tr(R.work)) + " · " : "📅 ") + esc(R.year) + "</div></div></div>";
    var gains = g.gains || {}, res = b.res || {};
    var ids = b.input === "buzz" ? (b.buzz || []).map(function (x) { return x.pid; }) : Object.keys(res);
    ids.sort(function (x, y) { return (gains[y] || 0) - (gains[x] || 0); });
    var rows = ids.slice(0, 6).map(function (id) {
      var r = res[id] || {}, ok = r.ok || {}, partsOk = (b.parts || []).filter(function (p) { return ok[p]; }).length;
      var txt = r.pick != null && b.choices ? tr(b.choices[r.pick]) : (b.parts || []).map(function (p) { return r.txt && r.txt[p]; }).filter(Boolean).join(" — ");
      var mark = b.input === "buzz" ? (gains[id] ? "ok" : "no") : partsOk === (b.parts || []).length ? "ok" : partsOk ? "almost" : "no";
      var time = r.time != null ? r.time : ((b.buzz || []).filter(function (x) { return x.pid === id; })[0] || {}).time;
      return line(id, txt, mark, (time != null ? (time / 1000).toFixed(1) + " s" : "") + (gains[id] ? " · +" + gains[id] : ""));
    }).join("");
    var none = !ids.some(function (id) { return gains[id] > 0; });
    return (b.skipped ? '<div class="hint">' + esc(btt("skipped")) + "</div>" : "") + card + (none && !b.skipped ? '<div class="hint">😶 ' + esc(btt("nobody")) + "</div>" : "") + '<div class="answers bt-ans">' + rows + "</div>";
  }

  var lang = "fr";
  // Même langue que le site sur cet appareil, sinon celle du navigateur
  try { lang = JSON.parse(localStorage.getItem("lang") || "null") || ""; } catch (e) { lang = ""; }
  if (!TX[lang]) lang = (navigator.language || "fr").slice(0, 2);
  if (!TX[lang]) lang = "en";
  document.documentElement.lang = lang;
  function t(k, vars) {
    var s = TX[lang][k] || TX.fr[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] == null ? "" : vars[x]; });
    return s;
  }
  var site = function (k) { return (SITE_T[lang] && SITE_T[lang][k]) || (SITE_T.en && SITE_T.en[k]) || ""; };
  var title = function (id) { return site("g_" + id) || id; };
  var tr = function (o) { return o && typeof o === "object" ? (o[lang] != null ? o[lang] : o.en != null ? o.en : o.fr) : o == null ? "" : o; };
  var themeName = function (th) {
    if (!th) return "";
    if (th === "mix") return "🎲 " + t("mix");
    var i = typeof THEME_INFO !== "undefined" && THEME_INFO[th];
    return i ? i.ico + " " + (i[lang] || i.en) : "";
  };
  var catName = function (c) { return typeof BAC_CATS !== "undefined" && BAC_CATS[c] ? BAC_CATS[c][lang] || BAC_CATS[c].en : c; };
  var COLORS = typeof AV_COLORS !== "undefined" ? AV_COLORS : ["#7c5cff"];
  // Avatar du Quizz : un emoji sur une pastille de couleur
  var avatar = function (p, size) {
    p = p || {};
    var c = COLORS[(((p.ac | 0) % COLORS.length) + COLORS.length) % COLORS.length];
    return '<span class="av" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.58) + "px;background:" + c + '">' + esc(p.avatar || "🙂") + "</span>";
  };
  var logo = function (size) { return typeof LOGO_SVG !== "undefined" ? '<span class="logo" style="width:' + size + "px;height:" + size + 'px">' + LOGO_SVG + "</span>" : ""; };
  var gameArt = function (id) { return typeof ART !== "undefined" && ART[id] ? ART[id] : ""; };

  // ---------- Mise à l'échelle de la scène 1920×1080 ----------
  var stage = $("#stage");
  function fit() {
    var k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + k + ")";
  }
  window.addEventListener("resize", fit);
  fit();
  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (calm) document.body.classList.add("calm");

  // =====================================================================
  // Son de la TV : tout est synthétisé en direct (WebAudio), aucun fichier, aucun droit.
  // Les navigateurs bloquent le son tant qu'on n'a pas appuyé sur une touche : un seul « OK » suffit.
  // =====================================================================
  var ac = null, master = null, fx = null, mus = null;
  var opts = { sound: true, music: true, volume: 0.8 };
  var localMute = false;
  function audioOn() { return !!ac && ac.state === "running"; }
  function unlockAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ac) {
      ac = new AC();
      master = ac.createGain(); master.connect(ac.destination);
      fx = ac.createGain(); fx.connect(master);
      mus = ac.createGain(); mus.connect(master);
    }
    if (ac.state === "suspended" && ac.resume) ac.resume();
    applyVolume();
  }
  function applyVolume() {
    if (!ac) return;
    var on = opts.sound && !localMute;
    master.gain.setTargetAtTime(on ? opts.volume : 0, ac.currentTime, 0.05);
    mus.gain.setTargetAtTime(opts.music ? 0.32 : 0, ac.currentTime, 0.3);
  }
  function tone(freq, dur, o) {
    if (!audioOn()) return;
    o = o || {};
    var t0 = ac.currentTime + (o.at || 0);
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * o.slide), t0 + dur);
    var vol = o.vol || 0.25;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.out || fx);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  var noiseBuf = null;
  function noise(dur, o) {
    if (!audioOn()) return;
    o = o || {};
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t0 = ac.currentTime + (o.at || 0);
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = "bandpass"; f.Q.value = o.q || 1.2;
    f.frequency.setValueAtTime(o.from || 800, t0);
    f.frequency.exponentialRampToValueAtTime(o.to || 800, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(fx);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  var chord = function (fs, dur, o) { fs.forEach(function (f, i) { tone(f, dur, { type: (o && o.type) || "triangle", vol: (o && o.vol) || 0.14, at: ((o && o.at) || 0) + i * ((o && o.spread) || 0) }); }); };
  var SFX = {
    join: function () { tone(587, 0.12, { type: "triangle", vol: 0.22 }); tone(880, 0.16, { type: "triangle", vol: 0.22, at: 0.08 }); tone(1760, 0.2, { vol: 0.07, at: 0.16 }); },
    beep: function () { tone(660, 0.18, { type: "square", vol: 0.1 }); tone(660, 0.18, { vol: 0.2 }); },
    go: function () { chord([523, 659, 784, 1047], 0.6, { vol: 0.16 }); noise(0.5, { from: 2000, to: 6000, vol: 0.06 }); },
    launch: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, { type: "triangle", vol: 0.2, at: i * 0.07 }); }); },
    tick: function () { tone(1250, 0.05, { type: "square", vol: 0.06 }); tone(90, 0.08, { vol: 0.25 }); },
    buzzer: function () { tone(160, 0.6, { type: "square", vol: 0.12 }); tone(165, 0.6, { type: "sawtooth", vol: 0.08 }); },
    whoosh: function () { noise(0.45, { from: 400, to: 3500, vol: 0.12, q: 0.8 }); },
    coin: function () { tone(988, 0.08, { type: "square", vol: 0.07 }); tone(1319, 0.22, { type: "triangle", vol: 0.16, at: 0.07 }); },
    lead: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 0.16, { type: "triangle", vol: 0.2, at: i * 0.1 }); }); chord([523, 659, 784, 1047], 0.7, { at: 0.3, vol: 0.13 }); },
    message: function () { tone(1180, 0.07, { vol: 0.09 }); tone(1480, 0.08, { vol: 0.07, at: 0.05 }); },
    drumroll: function (dur) { for (var i = 0; i < dur * 22; i++) noise(0.05, { at: i / 22, from: 1800, to: 1800, q: 0.6, vol: 0.04 + 0.12 * (i / (dur * 22)), attack: 0.004 }); },
    stab: function (low) { chord(low ? [196, 247, 294] : [262, 330, 392], 0.5, { type: "sawtooth", vol: 0.07 }); tone(low ? 98 : 131, 0.5, { vol: 0.25 }); },
    reveal: function () { tone(784, 0.12, { type: "triangle", vol: 0.2 }); chord([523, 659, 784, 1047], 0.8, { at: 0.1, vol: 0.13 }); },
    pop: function () { tone(900, 0.06, { type: "triangle", vol: 0.12 }); },
    win: function () {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.24, { type: "triangle", vol: 0.2, at: i * 0.12 }); });
      chord([523, 659, 784, 1047, 1319], 1.6, { at: 0.85, vol: 0.12 });
      noise(1.2, { at: 0.85, from: 3000, to: 9000, vol: 0.05 });
    },
  };
  // Pour les tests automatiques : état du son (aucune donnée de jeu)
  window.SAFIO_TV = { audio: function () { return ac ? ac.state : "none"; }, music: function () { return music ? music.name : null; } };
  var sfx = function (name, arg) { if (isMain && SFX[name]) try { SFX[name](arg); } catch (e) {} };

  // Musique générative douce : ambiance au salon, musique de fête au podium. Jamais pendant une manche.
  var MUSIC = {
    lobby: { bpm: 96, chords: [[262, 330, 392, 494], [220, 262, 330, 392], [175, 220, 262, 330], [196, 247, 294, 349]], bass: [131, 110, 87, 98], arp: true },
    podium: { bpm: 128, chords: [[262, 330, 392], [349, 440, 523], [392, 494, 587], [262, 330, 392]], bass: [131, 175, 196, 131], arp: true, drums: true, bars: 4 },
  };
  var music = null, musicTimer = null;
  function playMusic(name) {
    if (!isMain || !opts.music || (music && music.name === name)) return;
    stopMusic();
    if (!MUSIC[name]) return;
    music = { name: name, m: MUSIC[name], step: 0, next: 0 };
    musicTimer = setInterval(scheduleMusic, 100);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; music = null; }
  function scheduleMusic() {
    if (!music || !audioOn()) return;
    var m = music.m, beat = 60 / m.bpm / 2; // croches
    if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
    while (music.next < ac.currentTime + 0.3) {
      var s = music.step, bar = Math.floor(s / 8) % m.chords.length, ch = m.chords[bar], at = music.next - ac.currentTime;
      if (m.bars && Math.floor(s / 8) >= m.bars * 2) { stopMusic(); return; }
      if (s % 8 === 0) { ch.forEach(function (f) { tone(f / 2, beat * 8, { type: "sine", vol: 0.05, at: at, attack: 0.3, out: mus }); }); tone(m.bass[bar] / 2, beat * 3, { type: "triangle", vol: 0.16, at: at, out: mus }); }
      if (s % 8 === 4) tone(m.bass[bar] / 2, beat * 2, { type: "triangle", vol: 0.1, at: at, out: mus });
      if (m.arp && s % 2 === 0) tone(ch[(s / 2) % ch.length] * 2, beat * 1.2, { type: "triangle", vol: 0.035, at: at, out: mus });
      if (m.drums && s % 4 === 0) tone(60, 0.15, { vol: 0.3, at: at, slide: 0.5, out: mus });
      if (m.drums && s % 4 === 2) noise(0.06, { at: at, from: 7000, to: 7000, vol: 0.04, attack: 0.003 });
      music.next += beat;
      music.step++;
    }
  }

  // ---------- Horloge (alignée sur le serveur) ----------
  var offset = 0;
  var now = function () { return Date.now() + offset; };

  // ---------- Session de l'écran ----------
  var session = null;
  try { session = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  function saveSession(s) {
    session = s;
    try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) {}
  }

  // ---------- Réseau ----------
  var socket = window.io({ transports: ["websocket", "polling"] });
  var emit = function (ev, data, cb) { socket.timeout(8000).emit(ev, data, function (err, r) { if (cb) cb(err ? { error: "timeout" } : r); }); };
  var state = null, isMain = false, pairCode = null, pairTimer = null, retry = null;

  function hello() {
    emit("tvHello", { code: session.code, sid: session.sid, token: session.token, lang: lang }, function (r) {
      if (r.error === "timeout") return;
      if (r.error) { saveSession(null); state = null; openRoom(); }
    });
  }
  // Sans salle : la TV ouvre la sienne tout de suite (le QR s'affiche, il n'y a rien à taper)
  function openRoom() {
    clearTimeout(retry);
    emit("tvCreate", { lang: lang }, function (r) {
      if (r.error) { retry = setTimeout(openRoom, 3000); return; }
      saveSession({ code: r.code, sid: r.sid, token: r.token });
      hello();
    });
  }
  // Code écran (secondaire) : pour relier cette TV à une salle déjà créée sur un téléphone
  function askPairCode() {
    clearTimeout(pairTimer);
    emit("tvPair", { lang: lang }, function (r) {
      if (r.error) return;
      pairCode = r.pair;
      var el = $("#pair-code");
      if (el) el.textContent = pairCode;
      pairTimer = setTimeout(askPairCode, Math.max(60e3, (r.ttl || 600e3) - 60e3));
    });
  }
  function claimFromHash() {
    var h = (location.hash || "").slice(1);
    if (!/^[A-Z]{4}\.[0-9a-f]{32}$/.test(h)) return false;
    history.replaceState(null, "", "/tv");
    var parts = h.split(".");
    emit("tvClaim", { code: parts[0], k: parts[1], lang: lang }, function (r) {
      if (r.error) { banner(t("badLink"), "warn"); openRoom(); return; }
      leaveOld();
      saveSession({ code: r.code, sid: r.sid, token: r.token });
      hello();
    });
    return true;
  }
  // En rejoignant une autre salle, la TV quitte proprement celle qu'elle avait ouverte
  function leaveOld() { if (session) emit("tvBye", { code: session.code, sid: session.sid, token: session.token }); }
  var started = false;
  socket.on("connect", function () {
    $("#net").hidden = true;
    if (!started) { started = true; if (claimFromHash()) return; }
    if (session) hello(); else openRoom();
  });
  socket.on("disconnect", function () { var n = $("#net"); n.textContent = t("lost"); n.hidden = false; });
  socket.on("tvLinked", function (r) { pairCode = null; leaveOld(); saveSession({ code: r.code, sid: r.sid, token: r.token }); hello(); });
  socket.on("tvEnd", function () {
    saveSession(null);
    state = null; sceneKey = null;
    stopMusic();
    banner("📺 " + t("ended") + " · " + t("endedHelp"), "warn");
    setTimeout(openRoom, 2500);
  });
  socket.on("replaced", function () { state = null; sceneKey = null; stopMusic(); stage.innerHTML = '<div class="scene center-msg"><h1>' + esc(t("replaced")) + "</h1></div>"; });
  socket.on("tv", function (v) {
    offset = v.now - Date.now();
    isMain = !!v.main;
    if (v.opts) { opts = v.opts; applyVolume(); if (!opts.music) stopMusic(); }
    var prev = state;
    state = v;
    render(prev);
  });

  // ---------- Démarrage : un seul « OK » (télécommande, clavier, clic) active le son et le plein écran ----------
  var gate = document.createElement("div");
  gate.className = "gate";
  gate.innerHTML = '<button class="gate-btn" id="gate-btn">▶ ' + esc(t("start")) + '</button><div class="gate-help">' + esc(t("startHelp")) + "</div>";
  document.body.appendChild(gate);
  var gateBtn = $("#gate-btn");
  setTimeout(function () { try { gateBtn.focus(); } catch (e) {} }, 50);
  function begin() {
    unlockAudio();
    var el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fs && !(document.fullscreenElement || document.webkitFullscreenElement)) { try { var p = fs.call(el); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    keepAwake();
    gate.className = "gate gone";
    document.body.classList.add("live");
    if (state) render(state, true);
  }
  gateBtn.onclick = begin;
  document.addEventListener("keydown", function (e) {
    var k = e.key || "";
    if (!audioOn()) { begin(); return; }
    if (k === "m" || k === "M") { localMute = !localMute; applyVolume(); banner(localMute ? "🔇 " + t("muted") : "🔊", ""); }
    if (k === "f" || k === "F") begin();
  });
  document.addEventListener("click", function () { if (!audioOn()) begin(); });
  document.addEventListener("mousemove", function () { document.body.classList.add("pointer"); clearTimeout(window.__pt); window.__pt = setTimeout(function () { document.body.classList.remove("pointer"); }, 3000); });

  // L'écran reste allumé pendant la soirée (si le navigateur le permet)
  var lock = null;
  function keepAwake() {
    try {
      if (navigator.wakeLock && document.visibilityState === "visible" && !lock) navigator.wakeLock.request("screen").then(function (l) { lock = l; l.addEventListener("release", function () { lock = null; }); }).catch(function () {});
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", keepAwake);

  // ---------- Bandeaux (moments forts) ----------
  var bannerTimer = null;
  function banner(text, kind, html) {
    var b = $("#banner");
    if (!b) { b = document.createElement("div"); b.id = "banner"; document.body.appendChild(b); }
    b.className = "banner " + (kind || "");
    b.innerHTML = html || esc(text);
    void b.offsetWidth;
    b.className = "banner show " + (kind || "");
    document.body.classList.add("bannering");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { b.className = "banner " + (kind || ""); document.body.classList.remove("bannering"); }, 2800);
  }

  // ---------- Scènes ----------
  var sceneKey = null;
  function setScene(key, html) {
    sceneKey = key;
    stage.innerHTML = '<div class="scene ' + key.split(":")[0] + '">' + html + "</div>" + '<div class="chat" id="chat"></div>';
  }
  var top = function (right) {
    return '<div class="top"><div class="brand">' + logo(72) + 'SAFIO <span class="qzname">Quizz</span> <span class="tvtag">TV</span></div><div class="grow"></div>' + (right || "") + "</div>";
  };
  var qr = function (url, size) { return '<div class="qrbox"><img src="/qr?u=' + encodeURIComponent(url) + '" width="' + size + '" height="' + size + '" alt="QR"></div>'; };
  var playerOf = function (pid) {
    var ps = (state && state.players) || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].pid === pid) return ps[i];
    return { name: "?", avatar: "🙂", ac: 0 };
  };

  function render(prev, force) {
    var s = state;
    var key = s.phase === "playing" ? "play:" + s.gameId : s.phase === "results" ? "res:" + s.gameId : "lobby";
    var fresh = key !== sceneKey || force;
    if (s.phase === "lobby") { renderLobby(fresh, prev); playMusic("lobby"); }
    else if (s.phase === "playing") { if (fresh) stopMusic(); renderPlay(fresh, prev); }
    else renderResults(fresh);
    renderChat();
    if (prev && prev.phase === "lobby" && s.phase === "playing") countdown();
  }

  // ---------- Salon ----------
  function renderLobby(fresh, prev) {
    var s = state;
    var join = location.origin + "/?code=" + s.code;
    var empty = !s.players.length;
    var lk = "lobby:" + s.gameId + lang + (empty ? "0" : "1");
    if (fresh || stage.getAttribute("data-k") !== lk) {
      stage.setAttribute("data-k", lk);
      var side = empty
        ? '<div class="howto"><div class="hstep"><span>1</span>' + t("step1") + '</div><div class="hstep"><span>2</span>' + t("step2") + '</div><div class="hstep"><span>3</span>' + t("step3") + "</div></div>" +
          '<div class="paircode">' + esc(t("linkCode")) + ' <b id="pair-code">' + esc(pairCode || "······") + "</b></div>"
        : '<div class="gamehead"><div class="gameart">' + gameArt(s.gameId) + '</div><div><div class="kicker" id="l-count"></div><h2>' + esc(title(s.gameId)) + "</h2></div></div>" +
          '<div class="crowd" id="crowd"></div><div class="wait-line" id="l-wait"></div>';
      setScene("lobby", top('<div class="pill code">' + esc(location.host) + " · <b>" + esc(s.code) + "</b></div>") +
        '<div class="lobby-body' + (empty ? " empty" : "") + '"><div class="join"><div class="kicker">' + t("scan") + "</div>" + qr(join, empty ? 460 : 360) +
        '<div class="addr">' + t("orGo") + " <b>" + esc(location.host) + "</b><br>" + t("code") + ' <b class="code">' + esc(s.code) + "</b></div></div>" +
        '<div class="lobby-side">' + side + "</div></div>");
      if (empty && !pairCode) askPairCode();
    }
    if (empty) return;
    if (pairCode) { pairCode = null; clearTimeout(pairTimer); emit("tvPairStop", {}); }
    var on = s.players.filter(function (p) { return p.connected; });
    $("#l-count").textContent = on.length === 1 ? t("players1") : t("players", { n: on.length });
    $("#l-wait").innerHTML = t("hostPicks", { name: esc(playerOf(s.host).name) });
    // Les joueurs déjà affichés restent en place ; seuls les nouveaux arrivent en animation
    var crowd = $("#crowd");
    var seen = {}, arrived = [];
    s.players.forEach(function (p) {
      seen[p.pid] = true;
      var el = crowd.querySelector('[data-p="' + p.pid + '"]');
      var html = avatar(p, 140) + '<span class="nm">' + esc(p.name) + "</span>" + (p.pid === s.host ? '<span class="badge">👑</span>' : "") + (p.ready ? '<span class="ok">✓</span>' : "");
      if (!el) {
        el = document.createElement("div");
        el.setAttribute("data-p", p.pid);
        crowd.appendChild(el);
        if (prev && prev.phase === "lobby" && !fresh) arrived.push(p);
      }
      el.className = "guest" + (p.connected ? "" : " off") + (arrived.indexOf(p) >= 0 ? " new" : "");
      if (el.getAttribute("data-h") !== html) { el.setAttribute("data-h", html); el.innerHTML = html; }
    });
    var els = crowd.querySelectorAll("[data-p]");
    for (var i = 0; i < els.length; i++) if (!seen[els[i].getAttribute("data-p")]) crowd.removeChild(els[i]);
    if (arrived.length) {
      sfx("join");
      banner("", "welcome", avatar(arrived[0], 64) + "<span>" + esc(t("welcome", { name: arrived[0].name })) + "</span>");
    }
  }

  // Compte à rebours 3-2-1 au lancement (purement visuel : la partie démarre en même temps sur les téléphones)
  function countdown() {
    var ov = document.createElement("div");
    ov.className = "count";
    document.body.appendChild(ov);
    var seq = ["3", "2", "1", t("go")];
    seq.forEach(function (x, i) {
      setTimeout(function () {
        ov.innerHTML = '<span class="n' + (i === 3 ? " go" : "") + '">' + esc(x) + "</span>";
        sfx(i === 3 ? "go" : "beep");
      }, i * 700);
    });
    setTimeout(function () { ov.className = "count out"; setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 500); }, 3300);
  }

  // ---------- Partie : chrono géant + classement vivant (scores publics uniquement) ----------
  function scoresOf(s) {
    var g = s.game || {}, scores = g.scores || {};
    var list = s.players.filter(function (p) { return typeof scores[p.pid] === "number"; }).map(function (p) { return { pid: p.pid, score: scores[p.pid] }; });
    if (!list.length) list = s.players.filter(function (p) { return p.connected; }).map(function (p) { return { pid: p.pid, score: p.score }; });
    return list;
  }
  function renderPlay(fresh, prev) {
    var s = state, g = s.game || {};
    if (fresh) {
      setScene("play:" + s.gameId, top('<div class="pill" id="p-round" hidden></div><div class="pill code">' + esc(location.host) + " · <b>" + esc(s.code) + "</b></div>") +
        '<div class="play-body"><div class="qz-left"><div class="qz-head"><div class="qz-title"><div class="gameart mini">' + gameArt(s.gameId) + '</div><div><div class="kicker" id="q-kicker"></div><h2>' + esc(title(s.gameId)) + "</h2></div></div>" +
        '<div class="timer" id="p-timer" hidden><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="9"/><circle id="p-arc" cx="50" cy="50" r="44" fill="none" stroke="#22d3c5" stroke-width="9" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="num" id="p-num"></div></div></div>' +
        '<div class="qz" id="qz"></div><div class="answered" id="answered"></div></div>' +
        '<div class="board"><h3 class="kicker">' + t("ranking") + '</h3><div class="rows" id="rows"></div></div></div>');
      timerTotal = 0; lastLeader = null;
    }
    var r = $("#p-round");
    if (g.round && g.total) { r.hidden = false; r.textContent = s.gameId === "blindtest" ? btt("song") + " " + g.round + " / " + g.total : t("round", { a: g.round, b: g.total }); } else r.hidden = true;
    if (s.gameId === "blindtest" && g.bt) $("#q-kicker").textContent = btCat(g.bt.cat) || "🎵";
    else $("#q-kicker").textContent = s.gameId === "mytho" && g.step === "vote" && g.sub === "play" ? t("findTruth") : themeName(g.theme) || "📱 " + t("onPhones");
    // Contenu de la manche : ne se redessine que s'il change (pas de clignotement)
    var qz = $("#qz"), html = qzHTML(s, g);
    if (qz.getAttribute("data-h") !== html) {
      qz.setAttribute("data-h", html);
      qz.innerHTML = html;
      qz.className = "qz" + (g.sub === "review" ? " reveal" : "");
    }
    answeredRow(s, g, prev);
    var pg = prev && prev.phase === "playing" ? prev.game || {} : null;
    if (pg && pg.sub === "play" && g.sub === "review") sfx("reveal");
    var list = scoresOf(s);
    var before = prev && prev.phase === "playing" && !fresh ? scoresOf(prev) : null;
    rankRows($("#rows"), list, before);
    if (before) moments(list, before);
    if ((g.deadline || 0) !== deadline) { deadline = g.deadline || 0; buzzed = false; }
    tick();
  }

  // Qui a déjà répondu (jamais quoi) : les pastilles s'allument une à une
  function answeredRow(s, g, prev) {
    var box = $("#answered");
    if (!box) return;
    var on = s.players.filter(function (p) { return p.connected && !(g.bt && g.bt.dj === p.pid); }); // le DJ du Blind Test ne répond pas
    if (g.sub !== "play" || !g.answered) { box.innerHTML = ""; box.removeAttribute("data-h"); return; }
    var done = {};
    g.answered.forEach(function (id) { done[id] = true; });
    var html = '<span class="cnt">' + esc(t("answered", { a: g.answered.length, b: on.length })) + "</span>" +
      on.map(function (p) { return '<span class="dot' + (done[p.pid] ? " done" : "") + '">' + avatar(p, 64) + "</span>"; }).join("");
    if (box.getAttribute("data-h") === html) return;
    box.setAttribute("data-h", html);
    box.innerHTML = html;
    var pg = prev && prev.game;
    if (pg && pg.answered && g.answered.length > pg.answered.length && pg.sub === "play") sfx("pop");
  }

  // Une ligne « joueur + texte + verdict » (réponses, Petit Bac…)
  var markIco = { ok: "✅", almost: "🟡", no: "❌" };
  function line(pid, text, mark, extra) {
    var p = playerOf(pid);
    return '<div class="ans ' + (mark || "") + '">' + avatar(p, 58) + '<b class="who">' + esc(p.name) + '</b><span class="txt">' + (text ? esc(text) : "—") + "</span>" +
      (extra ? '<span class="ex">' + extra + "</span>" : "") + (mark ? '<span class="mk">' + (markIco[mark] || "") + "</span>" : "") + "</div>";
  }
  function question(g, small) {
    return '<div class="q' + (small ? " small" : "") + '">' + esc(tr(g.question)) + "</div>" + (g.img ? '<img class="qimg" src="' + esc(g.img) + '" alt="">' : "");
  }
  function solution(g) {
    var sol = tr(g.solution);
    if (g.unit) sol += " " + tr(g.unit);
    return '<div class="sol"><span class="lbl">' + esc(t("answer")) + '</span><b>' + esc(sol) + "</b></div>";
  }

  // Ce que la télé montre au centre, jeu par jeu (uniquement des informations publiques)
  function qzHTML(s, g) {
    var id = s.gameId, rev = g.sub === "review";
    var ids = function (o) { return Object.keys(o || {}); };
    if (id === "mytho") {
      if (g.step === "write" && !rev) return question(g) + '<div class="hint">' + esc(t("writeFake")) + "</div>";
      var opts = (g.options || []).map(function (o, i) {
        var L = String.fromCharCode(65 + i);
        if (!rev) return '<div class="opt"><span class="L">' + L + "</span>" + esc(tr(o.text)) + "</div>";
        var who = o.truth ? '<span class="tag">' + esc(t("truth")) + "</span>" : (o.authors || []).length ? '<span class="tag trap">' + esc(t("trapBy")) + " " + o.authors.map(function (a) { return esc(playerOf(a).name); }).join(", ") + "</span>" : "";
        var voters = (o.voters || []).map(function (v) { return avatar(playerOf(v), 46); }).join("");
        return '<div class="opt' + (o.truth ? " truth" : "") + '"><span class="L">' + L + "</span><span class=\"ot\">" + esc(tr(o.text)) + "</span>" + who + '<span class="voters">' + voters + "</span></div>";
      }).join("");
      return question(g, true) + '<div class="opts">' + opts + "</div>";
    }
    if (id === "brain") {
      if (!rev) return question(g) + '<div class="hint">' + esc(t("sameAns")) + "</div>";
      return question(g, true) + '<div class="groups">' + (g.groups || []).slice(0, 6).map(function (gr) {
        return '<div class="grp' + (gr.pids.length > 1 ? " match" : "") + '"><b>' + esc(gr.text) + '</b><span class="pp">' + gr.pids.map(function (x) { return avatar(playerOf(x), 52); }).join("") + "</span>" + (gr.pids.length > 1 ? '<span class="plus">+' + (gr.pids.length - 1) + "</span>" : "") + "</div>";
      }).join("") + "</div>";
    }
    if (id === "youre") {
      if (!rev) return question(g) + '<div class="hint">' + esc(t("whoIs")) + "</div>";
      var tally = g.tally || {};
      var top = ids(tally).sort(function (a, b) { return tally[b] - tally[a]; }).slice(0, 5);
      return question(g, true) + '<div class="elect">' + top.map(function (x) {
        var el = (g.elected || []).indexOf(x) >= 0, p = playerOf(x);
        return '<div class="cand' + (el ? " win" : "") + '">' + avatar(p, el ? 150 : 100) + "<b>" + esc(p.name) + '</b><span class="n">' + tally[x] + " 🗳️</span></div>";
      }).join("") + "</div>";
    }
    if (id === "bac") {
      if (g.step === "validate") {
        return '<div class="bac-head"><span class="letter">' + esc(g.letter) + '</span><div><div class="kicker">' + esc(t("correction")) + " · " + esc(t("round", { a: g.vRound, b: g.total })) + "</div><h3>" + esc(catName(g.category)) + "</h3></div></div>" +
          '<div class="answers">' + (g.entries || []).slice(0, 8).map(function (e) { return line(e.pid, e.text, e.mark, e.pts ? "+" + e.pts : ""); }).join("") + "</div>";
      }
      return '<div class="bac-head"><span class="letter big">' + esc(g.letter) + '</span><div><div class="kicker">' + esc(t("letter")) + "</div>" +
        (g.stoppedBy ? '<div class="stop">' + esc(t("stopBy", { name: g.stoppedBy })) + "</div>" : "") + "</div></div>" +
        '<div class="cats">' + (g.categories || []).map(function (c) { return "<span>" + esc(catName(c)) + "</span>"; }).join("") + "</div>";
    }
    if (id === "torpille") {
      var boards = g.boards || {};
      var fleet = '<div class="fleet">' + ids(boards).map(function (o) {
        var b = boards[o], p = playerOf(o);
        return '<div class="fl' + (b.down ? " down" : "") + '">' + avatar(p, 58) + "<b>" + esc(p.name) + "</b><span>" + (b.down ? "💥 " + esc(t("sunk")) : "⛴️ " + esc(t("shipsLeft", { n: b.left }))) + "</span></div>";
      }).join("") + "</div>";
      var log = (g.log || []).slice(-3).reverse().map(function (l) {
        return '<div class="shot">' + avatar(playerOf(l.from), 44) + " → " + avatar(playerOf(l.to), 44) + " " + (l.sunk ? "💥💥" : l.hit ? "💥" : "💧") + "</div>";
      }).join("");
      if (g.step === "question" && !rev) return question(g) + fleet;
      return question(g, true) + solution(g) + fleet + '<div class="log">' + log + "</div>";
    }
    if (id === "blindtest") return btHTML(s, g);
    if (!rev) return question(g);
    // Quiz, Éclair, Au plus près : la correction
    var ans = g.answers || {};
    var rows;
    if (id === "closest") {
      var target = Number(g.solution);
      rows = ids(ans).sort(function (a, b) { return Math.abs(Number(ans[a]) - target) - Math.abs(Number(ans[b]) - target); }).slice(0, 6)
        .map(function (x) { return line(x, ans[x], null, g.gains && g.gains[x] ? "+" + g.gains[x] : ""); });
    } else {
      var marks = g.marks || {}, judged = g.judged || {};
      rows = ids(ans).sort(function (a, b) { return (judged[b] ? 1 : 0) - (judged[a] ? 1 : 0); }).slice(0, 6)
        .map(function (x) { return line(x, ans[x], marks[x] || (judged[x] ? "ok" : "no"), g.comments && g.comments[x] ? "💬 " + esc(g.comments[x]) : ""); });
    }
    return question(g, true) + solution(g) + '<div class="answers">' + rows.join("") + "</div>";
  }

  // Moments forts : nouveau leader, égalité en tête
  var lastLeader = null;
  function moments(list) {
    var sorted = list.slice().sort(function (a, b) { return b.score - a.score; });
    if (!sorted.length || sorted[0].score <= 0) return;
    var tie = sorted.length > 1 && sorted[1].score === sorted[0].score;
    var lead = tie ? "tie" : sorted[0].pid;
    if (lastLeader !== null && lead !== lastLeader) {
      if (tie) { banner(t("tie"), "lead"); sfx("whoosh"); }
      else { var p = playerOf(lead); banner("", "lead", avatar(p, 72) + "<span>" + esc(t("lead", { name: p.name })) + "</span>"); sfx("lead"); }
    }
    lastLeader = lead;
  }

  // Classement animé : chaque joueur garde sa ligne, qui glisse vers sa nouvelle place ; les points gagnés s'envolent
  function rankRows(box, list, before) {
    if (!box) return;
    list = list.slice().sort(function (a, b) { return b.score - a.score; });
    var old = {};
    if (before) before.forEach(function (x) { old[x.pid] = x.score; });
    var max = Math.min(list.length, 6), h = 116, keep = {}, gained = false, climbed = false;
    box.style.height = max * h + "px";
    list.slice(0, max).forEach(function (it, i) {
      keep[it.pid] = true;
      var p = playerOf(it.pid);
      var el = box.querySelector('[data-p="' + it.pid + '"]');
      if (!el) {
        el = document.createElement("div");
        el.setAttribute("data-p", it.pid);
        el.style.transform = "translateY(" + i * h + "px)";
        box.appendChild(el);
      }
      var was = el.getAttribute("data-rank");
      var up = was !== null && i < +was;
      el.className = "row" + (i === 0 && it.score > 0 ? " first" : "") + (up ? " up" : "");
      el.setAttribute("data-rank", i);
      el.style.transform = "translateY(" + i * h + "px)";
      var html = '<span class="rk">' + sharedRank(list, i) + "</span>" + avatar(p, 76) + '<span class="nm">' + esc(p.name) + '</span><span class="sc">' + it.score + "</span>";
      if (el.getAttribute("data-h") !== html) { el.setAttribute("data-h", html); el.innerHTML = html; }
      var diff = old[it.pid] !== undefined ? it.score - old[it.pid] : 0;
      if (diff > 0) {
        gained = true;
        var f = document.createElement("span");
        f.className = "gain";
        f.textContent = "+" + diff;
        el.appendChild(f);
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1600);
      }
      if (up) { climbed = true; setTimeout(function () { el.className = el.className.replace(" up", ""); }, 1200); }
    });
    var els = box.querySelectorAll("[data-p]");
    for (var j = 0; j < els.length; j++) if (!keep[els[j].getAttribute("data-p")]) box.removeChild(els[j]);
    if (climbed) sfx("whoosh"); else if (gained) sfx("coin");
  }
  function sharedRank(list, i) {
    var r = i;
    while (r > 0 && list[r - 1].score === list[i].score) r--;
    return r + 1;
  }

  // Chronomètre géant (anneau) : couleurs, battements sur les 5 dernières secondes, buzzer
  var deadline = 0, timerTotal = 0, lastSec = -1, buzzed = false;
  function tick() {
    var el = $("#p-timer");
    if (!el) return;
    var left = deadline ? Math.max(0, deadline - now()) : 0;
    if (!deadline || left <= 0) {
      if (deadline && !buzzed && timerTotal) { buzzed = true; sfx("buzzer"); }
      el.hidden = true; timerTotal = 0; return;
    }
    if (left > timerTotal) timerTotal = left;
    el.hidden = false;
    var sec = Math.ceil(left / 1000);
    $("#p-num").textContent = sec > 99 ? Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2) : sec;
    $("#p-arc").setAttribute("stroke-dashoffset", String(276.5 * (1 - left / timerTotal)));
    $("#p-arc").setAttribute("stroke", sec <= 5 ? "#ff5c6c" : sec <= 10 ? "#ffd23f" : "#2ee6d0");
    el.className = "timer" + (sec <= 5 ? " hurry" : "");
    if (sec !== lastSec && sec <= 5 && timerTotal > 6000) sfx("tick");
    lastSec = sec;
  }
  setInterval(tick, 250);

  // ---------- Podium : suspense, puis 3e, 2e, 1er ----------
  var podiumTimers = [];
  function renderResults(fresh) {
    var s = state;
    if (!fresh) { rankRows($("#rows"), s.players.map(function (p) { return { pid: p.pid, score: p.score }; })); return; }
    podiumTimers.forEach(clearTimeout); podiumTimers = [];
    stopMusic();
    var rk = (s.results && s.results.ranking) || [];
    var pod = function (r, place) {
      if (!r) return '<div class="pod p' + place + ' empty"></div>';
      var p = playerOf(r.pid);
      return '<div class="pod p' + place + '" id="pod' + place + '">' + (place === 1 ? '<div class="crown">👑</div>' : "") + avatar(p, place === 1 ? 180 : 140) +
        '<span class="nm">' + esc(p.name) + '</span><span class="pts">+' + r.points + " " + t("pts") + '</span><div class="block">' + place + "</div></div>";
    };
    setScene("res:" + s.gameId, '<div class="spot" id="spot"></div><div class="confetti" id="confetti"></div>' + top('<div class="pill">' + esc(title(s.gameId)) + "</div>") +
      '<div class="res-body"><div class="res-left"><h2 id="res-title">' + esc(t("andWinner")) + '</h2><div class="podium">' + pod(rk[1], 2) + pod(rk[0], 1) + pod(rk[2], 3) + "</div></div>" +
      '<div class="board" id="res-board"><h3 class="kicker">' + t("night") + '</h3><div class="rows" id="rows"></div></div></div>');
    var at = function (ms, fn) { podiumTimers.push(setTimeout(fn, calm ? 0 : ms)); };
    sfx("drumroll", 2.2);
    at(2300, function () { show(3); sfx("stab", true); });
    at(3100, function () { show(2); sfx("stab"); });
    at(4000, function () {
      show(1);
      var w = rk[0] ? playerOf(rk[0].pid) : null;
      if (w) $("#res-title").textContent = "🏆 " + t("winner", { name: w.name });
      $("#spot").className = "spot on";
      confetti();
      sfx("win");
      at(1800, function () { playMusic("podium"); });
    });
    at(5200, function () {
      $("#res-board").className = "board show";
      rankRows($("#rows"), s.players.map(function (p) { return { pid: p.pid, score: p.score }; }));
    });
  }
  function show(place) { var el = $("#pod" + place); if (el) el.className += " up"; }
  function confetti() {
    var box = $("#confetti");
    if (!box || calm) return;
    var colors = ["#ffd23f", "#2ee6d0", "#ff4f9a", "#ff8a3d", "#9b5cff", "#ffffff"], html = "";
    for (var i = 0; i < 46; i++) html += '<i style="left:' + ((i * 37) % 100) + "%;background:" + colors[i % 6] + ";animation-duration:" + (2.6 + (i % 5) * 0.5) + "s;animation-delay:" + ((i * 0.07) % 1.6).toFixed(2) + 's"></i>';
    box.innerHTML = html;
  }

  // ---------- Chat public : une bulle à la fois, dans le bandeau du haut ----------
  var lastChatId = null;
  function renderChat() {
    var box = $("#chat");
    if (!box || !state) return;
    var msgs = (state.chat || []).filter(function (m) { return !m.sys && m.text; });
    var newest = msgs.length ? msgs[msgs.length - 1].id : 0;
    if (lastChatId === null) { lastChatId = newest; return; }
    msgs.forEach(function (m) {
      if (m.id <= lastChatId) return;
      lastChatId = m.id;
      var p = playerOf(m.pid);
      var el = document.createElement("div");
      el.className = "bubble";
      el.innerHTML = avatar(p, 52) + "<b>" + esc(m.name) + "</b><span>" + esc(m.text) + "</span>";
      for (var i = 0; i < box.children.length; i++) box.children[i].className = "bubble out";
      box.appendChild(el);
      setTimeout(function () { while (box.children.length > 1 && box.firstChild !== el) box.removeChild(box.firstChild); }, 600);
      setTimeout(function () { el.className = "bubble out"; setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600); }, 9000);
      sfx("message");
    });
  }
})();
