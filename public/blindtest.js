// ======== SAFIO Blind Test (mode Soirée) : textes, catégories et écrans du téléphone ========
// Chargé avant app.js (site) et avant tvapp/tv.js (télé). Les fonctions d'écran utilisent les outils d'app.js
// (S, t, esc, tr, isHost, act…) seulement quand elles sont appelées, donc après le chargement complet.
// Aucune chanson n'est ici : les réponses restent sur le serveur jusqu'à la révélation.

const BT_CATS = {
  y70: { ico: "🕺", fr: "Années 70", en: "70s", es: "Años 70" },
  y80: { ico: "📼", fr: "Années 80", en: "80s", es: "Años 80" },
  y90: { ico: "💿", fr: "Années 90", en: "90s", es: "Años 90" },
  y00: { ico: "📱", fr: "Années 2000", en: "2000s", es: "Años 2000" },
  y10: { ico: "🎧", fr: "Années 2010", en: "2010s", es: "Años 2010" },
  films: { ico: "🎬", fr: "Films et séries", en: "Movies & TV", es: "Cine y series" },
  disney: { ico: "🏰", fr: "Disney et animation", en: "Disney & animation", es: "Disney y animación" },
  frcult: { ico: "🇫🇷", fr: "Chansons françaises cultes", en: "French classics", es: "Clásicos franceses" },
  own: { ico: "🎛️", fr: "Ma playlist", en: "My playlist", es: "Mi playlist" },
};

const BT_T = {
  fr: {
    g_blindtest: "Blind Test", g_blindtest_d: "Reconnais la chanson", p_blindtest: "Dès 2 joueurs, idéal en soirée",
    r_blindtest: "Le DJ lance un morceau depuis son appli musicale : trouve le titre, l'artiste ou le film le plus vite possible. Plus tu es rapide, plus tu gagnes de points.",
    legal: "🎧 <b>Mode Soirée</b> : la musique vient de ton appli (Spotify, Deezer, Apple Music…) et de ton abonnement. SAFIO ne diffuse aucun extrait. Branche ton téléphone à la télé ou à une enceinte.",
    cats: "Catégories", catsHint: "Choisis-en une ou plusieurs.", ownHint: "Ma playlist : tu passes ce que tu veux, les joueurs buzzent et tu valides à voix haute.",
    keepOne: "Garde au moins une catégorie", songsN: "{n} titres",
    fmt: "À trouver", f_auto: "✨ Auto", f_title: "Titre", f_artist: "Artiste", f_both: "Titre + artiste", f_work: "Film / dessin animé",
    autoHint: "Auto : titre + artiste pour les décennies, le film pour Films et Disney.",
    input: "Réponses", i_free: "✍️ Texte libre", i_choice: "🔢 4 propositions", i_buzz: "🔔 Buzzer",
    buzzHint: "Buzzer : le premier qui buzze répond à voix haute, le DJ dit si c'est juste.",
    dj: "Le DJ", d_host: "🎧 L'organisateur", d_rotate: "🔁 Chacun son tour",
    djHint: "Le DJ voit la réponse pour lancer le morceau : il ne marque pas de points sur ce morceau.",
    songs: "Morceaux", listen: "Temps pour répondre", pts: "Points max", bonus: "Bonus titre + artiste", flash: "Bonus éclair (moins de 5 s)",
    points: "Points",
    youDj: "🎧 C'est toi le DJ !", song: "Morceau {a} / {b}", openIn: "Trouve-le dans ton appli :",
    go: "▶ La musique joue !", goHint: "Lance le morceau, puis appuie ici : le chrono démarre.", ownCue: "Lance le morceau de ton choix.",
    playlist: "📋 Toute la playlist", djPrep: "{name} prépare le morceau…", getReady: "Prépare-toi, ça va commencer !",
    find: "Trouve", p_title: "le titre", p_artist: "l'artiste", p_work: "le film / dessin animé", and: "et",
    ph_title: "Titre de la chanson", ph_artist: "Artiste ou groupe", ph_work: "Film, série ou dessin animé",
    sent: "Réponse envoyée ! Verdict à la révélation.", buzzBtn: "BUZZ !", buzzed: "🔔 Tu as buzzé en n°{n} : réponds à voix haute !",
    buzzOut: "❌ Raté pour ce morceau.", buzzers: "Buzzers", nobodyBuzz: "Personne n'a encore buzzé.", right: "✓ Juste", wrong: "✗ Faux",
    pause: "⏸ Pause", resume: "▶ Reprendre", paused: "⏸ En pause", reveal: "Révéler la réponse",
    djListen: "Les joueurs cherchent… Tu peux mettre en pause ou révéler quand tu veux.",
    itWas: "C'était…", nobody: "Personne n'a trouvé", skipped: "Morceau passé", ownRev: "Réponse donnée à voix haute",
    fixHint: "Organisateur : touche une réponse pour corriger le verdict.", noAnswer: "pas de réponse", djTag: "DJ",
    skipSong: "Passer ce morceau", toPlay: "À lancer :",
    onTv: "📺 Tout s'affiche aussi sur la télé (SAFIO TV).",
  },
  en: {
    g_blindtest: "Blind Test", g_blindtest_d: "Name that song", p_blindtest: "2+ players, perfect for parties",
    r_blindtest: "The DJ plays a song from their music app: find the title, the artist or the movie as fast as you can. The faster you are, the more points you get.",
    legal: "🎧 <b>Party mode</b>: the music comes from your own app (Spotify, Deezer, Apple Music…) and subscription. SAFIO doesn't stream any clip. Connect your phone to the TV or a speaker.",
    cats: "Categories", catsHint: "Pick one or several.", ownHint: "My playlist: play whatever you like, players buzz in and you judge out loud.",
    keepOne: "Keep at least one category", songsN: "{n} songs",
    fmt: "To find", f_auto: "✨ Auto", f_title: "Title", f_artist: "Artist", f_both: "Title + artist", f_work: "Movie / cartoon",
    autoHint: "Auto: title + artist for decades, the movie for Movies and Disney.",
    input: "Answers", i_free: "✍️ Free text", i_choice: "🔢 4 choices", i_buzz: "🔔 Buzzer",
    buzzHint: "Buzzer: the first to buzz answers out loud, the DJ says if it's right.",
    dj: "The DJ", d_host: "🎧 The host", d_rotate: "🔁 Take turns",
    djHint: "The DJ sees the answer to play the song, so they score no points on that song.",
    songs: "Songs", listen: "Time to answer", pts: "Max points", bonus: "Title + artist bonus", flash: "Lightning bonus (under 5 s)",
    points: "Points",
    youDj: "🎧 You're the DJ!", song: "Song {a} / {b}", openIn: "Find it in your app:",
    go: "▶ The music is playing!", goHint: "Start the song, then tap here: the timer starts.", ownCue: "Play any song you like.",
    playlist: "📋 Full playlist", djPrep: "{name} is getting the song ready…", getReady: "Get ready, here it comes!",
    find: "Find", p_title: "the title", p_artist: "the artist", p_work: "the movie / cartoon", and: "and",
    ph_title: "Song title", ph_artist: "Artist or band", ph_work: "Movie, show or cartoon",
    sent: "Answer sent! Verdict at the reveal.", buzzBtn: "BUZZ!", buzzed: "🔔 You buzzed #{n}: answer out loud!",
    buzzOut: "❌ Missed for this song.", buzzers: "Buzzers", nobodyBuzz: "Nobody has buzzed yet.", right: "✓ Right", wrong: "✗ Wrong",
    pause: "⏸ Pause", resume: "▶ Resume", paused: "⏸ Paused", reveal: "Reveal the answer",
    djListen: "Players are searching… You can pause or reveal whenever you want.",
    itWas: "It was…", nobody: "Nobody found it", skipped: "Song skipped", ownRev: "Answer given out loud",
    fixHint: "Host: tap an answer to fix the verdict.", noAnswer: "no answer", djTag: "DJ",
    skipSong: "Skip this song", toPlay: "To play:",
    onTv: "📺 Everything also shows on the TV (SAFIO TV).",
  },
  es: {
    g_blindtest: "Blind Test", g_blindtest_d: "Adivina la canción", p_blindtest: "Desde 2 jugadores, ideal para fiestas",
    r_blindtest: "El DJ pone una canción desde su app de música: encuentra el título, el artista o la película lo antes posible. Cuanto más rápido, más puntos.",
    legal: "🎧 <b>Modo Fiesta</b>: la música sale de tu app (Spotify, Deezer, Apple Music…) y de tu suscripción. SAFIO no emite ningún fragmento. Conecta tu móvil a la tele o a un altavoz.",
    cats: "Categorías", catsHint: "Elige una o varias.", ownHint: "Mi playlist: pones lo que quieras, los jugadores pulsan y tú validas en voz alta.",
    keepOne: "Deja al menos una categoría", songsN: "{n} canciones",
    fmt: "Qué adivinar", f_auto: "✨ Auto", f_title: "Título", f_artist: "Artista", f_both: "Título + artista", f_work: "Película / dibujos",
    autoHint: "Auto: título + artista para las décadas, la película para Cine y Disney.",
    input: "Respuestas", i_free: "✍️ Texto libre", i_choice: "🔢 4 opciones", i_buzz: "🔔 Pulsador",
    buzzHint: "Pulsador: el primero en pulsar responde en voz alta, el DJ dice si es correcto.",
    dj: "El DJ", d_host: "🎧 El anfitrión", d_rotate: "🔁 Por turnos",
    djHint: "El DJ ve la respuesta para poner la canción: no suma puntos en esa canción.",
    songs: "Canciones", listen: "Tiempo para responder", pts: "Puntos máx.", bonus: "Bonus título + artista", flash: "Bonus relámpago (menos de 5 s)",
    points: "Puntos",
    youDj: "🎧 ¡Tú eres el DJ!", song: "Canción {a} / {b}", openIn: "Búscala en tu app:",
    go: "▶ ¡La música suena!", goHint: "Pon la canción y pulsa aquí: empieza el cronómetro.", ownCue: "Pon la canción que quieras.",
    playlist: "📋 Toda la playlist", djPrep: "{name} prepara la canción…", getReady: "¡Prepárate, ya empieza!",
    find: "Encuentra", p_title: "el título", p_artist: "el artista", p_work: "la película / los dibujos", and: "y",
    ph_title: "Título de la canción", ph_artist: "Artista o grupo", ph_work: "Película, serie o dibujos",
    sent: "¡Respuesta enviada! Veredicto al revelar.", buzzBtn: "¡BUZZ!", buzzed: "🔔 Has pulsado n.º {n}: ¡responde en voz alta!",
    buzzOut: "❌ Fallado en esta canción.", buzzers: "Pulsadores", nobodyBuzz: "Nadie ha pulsado todavía.", right: "✓ Correcto", wrong: "✗ Incorrecto",
    pause: "⏸ Pausa", resume: "▶ Reanudar", paused: "⏸ En pausa", reveal: "Revelar la respuesta",
    djListen: "Los jugadores buscan… Puedes pausar o revelar cuando quieras.",
    itWas: "Era…", nobody: "Nadie la encontró", skipped: "Canción saltada", ownRev: "Respuesta dada en voz alta",
    fixHint: "Anfitrión: toca una respuesta para corregir el veredicto.", noAnswer: "sin respuesta", djTag: "DJ",
    skipSong: "Saltar esta canción", toPlay: "Para poner:",
    onTv: "📺 Todo se ve también en la tele (SAFIO TV).",
  },
};

// Le nom du jeu et sa fiche rejoignent les textes du site (accueil, salon, télé)
if (typeof T !== "undefined") for (const l of Object.keys(BT_T)) if (T[l]) for (const k of ["g_blindtest", "g_blindtest_d", "p_blindtest", "r_blindtest"]) T[l][k] = BT_T[l][k];
if (typeof RULES !== "undefined") {
  const R = {
    fr: { ex: { top: "🎵 Le DJ lance un tube des années 80", rows: [["Léa", "Take On Me — a-ha · 3 s", "+148"], ["Tom", "Take on me · 12 s", "+76"], ["Inès", "Africa — Toto", ""]], note: "Léa a le titre, l'artiste, le bonus et l'éclair. Tom n'a que le titre." },
      steps: ["L'organisateur choisit les catégories (plusieurs à la fois), ce qu'il faut trouver et le DJ.", "Le DJ voit le morceau sur son téléphone, le lance dans son appli musicale (télé ou enceinte), puis appuie sur « La musique joue ».", "Chacun répond sur son téléphone : texte libre, 4 propositions ou buzzer. Les majuscules, accents et petites fautes sont acceptés.", "Plus tu réponds vite, plus tu gagnes de points. Bonus si tu trouves le titre et l'artiste, et bonus éclair en moins de 5 secondes."] },
    en: { ex: { top: "🎵 The DJ plays an 80s hit", rows: [["Léa", "Take On Me — a-ha · 3 s", "+148"], ["Tom", "Take on me · 12 s", "+76"], ["Inès", "Africa — Toto", ""]], note: "Léa got the title, the artist, the bonus and the lightning bonus. Tom only got the title." },
      steps: ["The host picks the categories (several at once), what to find and the DJ.", "The DJ sees the song on their phone, plays it in their music app (TV or speaker), then taps “The music is playing”.", "Everyone answers on their phone: free text, 4 choices or buzzer. Capitals, accents and small typos are fine.", "The faster you answer, the more points you get. Bonus for title and artist, and a lightning bonus under 5 seconds."] },
    es: { ex: { top: "🎵 El DJ pone un éxito de los 80", rows: [["Léa", "Take On Me — a-ha · 3 s", "+148"], ["Tom", "Take on me · 12 s", "+76"], ["Inès", "Africa — Toto", ""]], note: "Léa acertó título, artista, bonus y relámpago. Tom solo el título." },
      steps: ["El anfitrión elige las categorías (varias a la vez), qué adivinar y el DJ.", "El DJ ve la canción en su móvil, la pone en su app de música (tele o altavoz) y pulsa «La música suena».", "Cada uno responde en su móvil: texto libre, 4 opciones o pulsador. Se aceptan mayúsculas, tildes y pequeñas faltas.", "Cuanto antes respondas, más puntos. Bonus por título y artista, y bonus relámpago en menos de 5 segundos."] },
  };
  for (const l of Object.keys(R)) if (RULES[l]) RULES[l].blindtest = R[l];
}

const BT = {
  t(lang, k, vars) {
    const s = (BT_T[lang] && BT_T[lang][k]) || BT_T.fr[k] || k;
    return vars ? s.replace(/\{(\w+)\}/g, (_, x) => (vars[x] == null ? "" : vars[x])) : s;
  },
  cat(lang, c) { const i = BT_CATS[c]; return i ? `${i.ico} ${i[lang] || i.en}` : ""; },
  // Égaliseur animé (barres en CSS) : purement décoratif
  eq(n = 24, cls = "") { return `<div class="bt-eq ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="animation-delay:-${((i * 0.37) % 1.3).toFixed(2)}s;animation-duration:${(0.7 + ((i * 7) % 5) / 10).toFixed(2)}s"></i>`).join("")}</div>`; },
  // « Trouve le titre et l'artiste »
  ask(lang, parts) { return `${BT.t(lang, "find")} ${parts.map((p) => `<b>${BT.t(lang, "p_" + p)}</b>`).join(` ${BT.t(lang, "and")} `)}`; },
  // Recherche du morceau dans l'appli du DJ (simples liens de recherche, rien n'est lu par SAFIO)
  links(q) {
    const e = encodeURIComponent(q);
    return [["Spotify", `https://open.spotify.com/search/${e}`], ["Deezer", `https://www.deezer.com/search/${e}`], ["Apple Music", `https://music.apple.com/search?term=${e}`], ["YouTube Music", `https://music.youtube.com/search?q=${e}`]];
  },
};

// ---------- Écrans du téléphone (appelés par app.js) ----------
let btDraft = {};
const bt = (k, v) => BT.t(lang, k, v);

function btLobby() {
  const s = S.settings, own = s.cats[0] === "own";
  const chip = (key, val, label) => `<button class="chip ${s[key] === val ? "on" : ""}" data-set="${key}" data-val="${val}">${label}</button>`;
  const cats = Object.keys(BT_CATS).map((c) => `<button class="theme ${s.cats.includes(c) ? "on" : ""}" data-btcat="${c}"><span>${BT_CATS[c].ico}</span>${BT_CATS[c][lang] || BT_CATS[c].en}</button>`).join("");
  return `<p class="bt-legal">${bt("legal")}</p>
    <div><h3 class="sub">${bt("cats")}</h3><p class="muted small" style="margin:4px 0 12px">${own ? bt("ownHint") : bt("catsHint")}</p><div class="theme-grid">${cats}</div></div>
    ${own ? "" : `<div><p class="label">${bt("fmt")}</p><div class="chips">${["auto", "title", "artist", "both", "work"].map((f) => chip("fmt", f, bt("f_" + f))).join("")}</div>
      ${s.fmt === "auto" ? `<p class="muted small" style="margin-top:6px">${bt("autoHint")}</p>` : ""}</div>
    <div><p class="label">${bt("input")}</p><div class="chips">${["free", "choice", "buzz"].map((f) => chip("input", f, bt("i_" + f))).join("")}</div>
      ${s.input === "buzz" ? `<p class="muted small" style="margin-top:6px">${bt("buzzHint")}</p>` : ""}</div>`}
    <div><p class="label">${bt("dj")}</p><div class="chips">${chip("dj", "host", bt("d_host"))}${chip("dj", "rotate", bt("d_rotate"))}</div><p class="muted small" style="margin-top:6px">${bt("djHint")}</p></div>
    <div class="sliders">${slider("count", bt("songs"), 3, 30, 1)}${slider("time", bt("listen"), 10, 90, 5, " s")}</div>
    <div><p class="label">${bt("points")}</p><div class="sliders">${slider("pts", bt("pts"), 50, 200, 10)}${own ? "" : slider("bonus", bt("bonus"), 0, 100, 10)}${slider("flash", bt("flash"), 0, 50, 5)}</div></div>`;
}

const btHead = () => `<div class="hud"><div class="round"><span class="num">🎵</span>${bt("song", { a: S.round, b: S.total })}${S.bt && BT_CATS[S.bt.cat] ? " · " + BT.cat(lang, S.bt.cat) : ""}</div></div>`;
const btIsDj = () => S.bt && S.bt.dj === pid;
const btAnswerText = (r, parts) => parts.map((p) => r.txt && r.txt[p]).filter(Boolean).join(" — ");
function btRevealCard(R, cue) {
  if (!R || R.own) return `<div class="bt-reveal"><div class="vinyl" aria-hidden="true"></div><div><p class="label">${bt("itWas")}</p><b class="bt-title">${bt("ownRev")}</b></div></div>`;
  const work = R.work ? `🎬 ${esc(tr(R.work))} · ${R.year}` : `📅 ${R.year}`;
  return `<div class="bt-reveal"><div class="vinyl" aria-hidden="true"></div><div><p class="label">${bt(cue ? "toPlay" : "itWas")} ${BT.cat(lang, R.cat)}</p>
    <b class="bt-title">${esc(tr(R.title))}</b>${R.artist ? `<span class="bt-artist">${esc(R.artist)}</span>` : ""}<span class="bt-meta">${work}</span></div></div>`;
}

function btPlay() {
  const b = S.bt, dj = btIsDj(), djName = esc(playerOf(b.dj).name);
  const head = btHead();
  if (b.step === "cue") {
    btDraft = {};
    if (!dj) return `<div class="stage">${head}${BT.eq(20, "idle")}<p class="big-msg">🎧 ${bt("djPrep", { name: djName })}</p><p class="muted">${bt("getReady")}</p>${isHost() ? `<div class="actions"><button class="btn ghost small" id="skip">⏭ ${bt("skipSong")}</button></div>` : ""}</div>`;
    const c = S.cue || {};
    const q = c.own ? "" : [tr(c.title), c.artist || (c.work ? tr(c.work) : "")].filter(Boolean).join(" ");
    const pl = S.playlist ? `<details class="howto bt-pl"><summary><b>${bt("playlist")}</b></summary><ol>${S.playlist.map((x) => `<li class="${x.done ? "done" : ""}">${esc(tr(x.title))}${x.artist ? " — " + esc(x.artist) : x.work ? " — " + esc(tr(x.work)) : ""}</li>`).join("")}</ol></details>` : "";
    return `<div class="stage">${head}<p class="host-banner">${bt("youDj")}</p>
      ${c.own ? `<p class="big-msg">${bt("ownCue")}</p>` : `${btRevealCard(c, true)}<p class="label">${bt("openIn")}</p><div class="chips bt-links">${BT.links(q).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${n}</a>`).join("")}</div>`}
      <button class="btn primary big bt-go" id="btGo">${bt("go")}</button><p class="muted small">${bt("goHint")}</p>${pl}</div>`;
  }
  // Écoute
  const paused = b.paused ? `<p class="bt-paused">${bt("paused")}</p>` : "";
  const djTools = (isHost() || dj) ? `<div class="actions">${b.paused ? `<button class="btn green small" id="btResume">${bt("resume")}</button>` : `<button class="btn ghost small" id="btPause">${bt("pause")}</button>`}<button class="btn ghost small" id="btReveal">${bt("reveal")} ⏭</button></div>` : "";
  let body;
  if (dj) {
    const c = S.cue || {};
    let buzz = "";
    if (b.input === "buzz") {
      const first = b.buzz.find((x) => !x.out && !x.ok);
      buzz = `<p class="label">${bt("buzzers")}</p><div class="answers">${b.buzz.map((x, i) => `<div class="ans ${x.out ? "ko" : ""}"><span class="who">${i + 1}. ${who(x.pid)}</span><span class="what muted small" style="white-space:nowrap">${(x.time / 1000).toFixed(1)} s</span>
        ${first && first.pid === x.pid ? `<button class="btn green small" data-btv="${x.pid}" data-ok="1">${bt("right")}</button><button class="btn red small" data-btv="${x.pid}" data-ok="0">${bt("wrong")}</button>` : ""}</div>`).join("") || `<p class="muted">${bt("nobodyBuzz")}</p>`}</div>`;
    }
    body = `<p class="host-banner">${bt("youDj")}</p>${c.own ? "" : btRevealCard(c, true)}${BT.eq(20, b.paused ? "idle" : "")}${paused}${buzz}<p class="muted small">${bt("djListen")}</p>`;
  } else if (b.input === "buzz") {
    const m = S.mine;
    body = `${BT.eq(24, b.paused ? "idle" : "")}${paused}${m ? `<p class="big-msg">${m.out ? bt("buzzOut") : bt("buzzed", { n: m.buzz })}</p>` : `<button class="bt-buzz" id="btBuzz" ${b.paused ? "disabled" : ""}>${bt("buzzBtn")}</button>`}`;
  } else if (S.mine && S.mine.sent) {
    const m = S.mine;
    const txt = m.pick !== undefined && b.choices ? tr(b.choices[m.pick]) : btAnswerText(m, b.parts);
    body = `${BT.eq(24, b.paused ? "idle" : "")}${paused}<p class="sent">✓ ${bt("sent")}${txt ? `<br><b>${esc(txt)}</b>` : ""}</p>`;
  } else if (b.input === "choice" && b.choices) {
    body = `${BT.eq(24, b.paused ? "idle" : "")}${paused}<p class="bt-ask">${BT.ask(lang, b.parts)}</p><div class="bt-choices">${b.choices.map((c, i) => `<button class="bt-choice" data-btc="${i}" ${b.paused ? "disabled" : ""}><span class="L">${"ABCD"[i]}</span>${esc(tr(c))}</button>`).join("")}</div>`;
  } else {
    body = `${BT.eq(24, b.paused ? "idle" : "")}${paused}<p class="bt-ask">${BT.ask(lang, b.parts)}</p><form class="bt-form" id="btForm">${b.parts.map((p) => `<input class="input" data-btp="${p}" autocomplete="off" maxlength="80" placeholder="${bt("ph_" + p)}" aria-label="${bt("ph_" + p)}" value="${esc(btDraft[p] || "")}">`).join("")}
      <button class="btn primary">${t("send")}</button></form>`;
  }
  return `<div class="stage">${head}${timerHTML()}${body}${dj ? "" : waitingHTML()}${djTools}</div>`;
}

function btReview() {
  const b = S.bt, R = b.reveal || {};
  const host = isHost();
  let rows = "";
  if (b.input === "buzz") {
    rows = b.buzz.map((x, i) => `<div class="ans ${x.ok ? "ok" : x.out ? "ko" : ""}"><span class="who">${i + 1}. ${who(x.pid)}</span><span class="what muted small" style="white-space:nowrap">${(x.time / 1000).toFixed(1)} s</span>${gainsTag(x.pid)}</div>`).join("");
  } else {
    const res = b.res || {};
    rows = Object.keys(res).sort((x, y) => (S.gains[y] || 0) - (S.gains[x] || 0) || res[x].time - res[y].time).map((id) => {
      const r = res[id];
      const all = b.parts.every((p) => r.ok[p]), some = b.parts.some((p) => r.ok[p]);
      const txt = r.pick !== undefined && b.choices ? tr(b.choices[r.pick]) : btAnswerText(r, b.parts);
      const marks = b.parts.map((p) => host && b.input === "free"
        ? `<button class="toggle ${r.ok[p] ? "ok" : "ko"}" data-btj="${id}" data-part="${p}" data-ok="${r.ok[p] ? 0 : 1}">${r.ok[p] ? "✓" : "✗"} ${bt("f_" + p)}</button>`
        : `<span class="bt-mk ${r.ok[p] ? "ok" : "ko"}">${r.ok[p] ? "✓" : "✗"} ${bt("f_" + p)}</span>`).join("");
      return `<div class="ans ${all ? "ok" : some ? "almost" : "ko"}"><span class="who">${who(id)}</span><span class="what">${esc(txt) || `<i class="muted">${bt("noAnswer")}</i>`} <span class="muted small">${(r.time / 1000).toFixed(1)} s</span><span class="bt-mks">${marks}</span></span>${gainsTag(id)}</div>`;
    }).join("");
  }
  const none = !Object.values(S.gains || {}).some((x) => x > 0);
  return `<div class="stage">${btHead()}
    ${b.skipped ? `<p class="muted">${bt("skipped")}</p>` : ""}${btRevealCard(R)}
    ${none && !b.skipped ? `<p class="big-msg">😶 ${bt("nobody")}</p>` : ""}
    <div class="answers">${rows}</div>${host && b.input === "free" && rows ? `<p class="muted small">${bt("fixHint")}</p>` : ""}${nextBtn()}</div>`;
}

function btBind() {
  const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };
  $$("[data-btcat]").forEach((b) => (b.onclick = () => {
    const c = b.dataset.btcat, cur = S.settings.cats;
    let next = c === "own" ? ["own"] : cur.includes(c) ? cur.filter((x) => x !== c) : [...cur.filter((x) => x !== "own"), c];
    if (!next.length) return toast(bt("keepOne"));
    socket.emit("settings", { settings: { cats: next } });
  }));
  on("#btGo", () => { Sound.play("start"); act({ type: "go" }); });
  on("#btPause", () => act({ type: "pause" }));
  on("#btResume", () => act({ type: "resume" }));
  on("#btReveal", () => act({ type: "reveal" }));
  on("#btBuzz", () => { Sound.play("stop"); if (navigator.vibrate) navigator.vibrate(60); act({ type: "buzz" }); });
  $$("[data-btv]").forEach((b) => (b.onclick = () => act({ type: "verdict", pid: b.dataset.btv, ok: b.dataset.ok === "1" })));
  $$("[data-btc]").forEach((b) => (b.onclick = () => { Sound.play("send"); act({ type: "answer", choice: +b.dataset.btc }); }));
  $$("[data-btj]").forEach((b) => (b.onclick = () => act({ type: "judge", pid: b.dataset.btj, part: b.dataset.part, ok: b.dataset.ok === "1" })));
  $$("[data-btp]").forEach((inp) => (inp.oninput = () => (btDraft[inp.dataset.btp] = inp.value)));
  const f = $("#btForm");
  if (f) {
    f.onsubmit = (e) => {
      e.preventDefault();
      const values = {};
      $$("[data-btp]").forEach((inp) => (values[inp.dataset.btp] = inp.value.trim()));
      if (!Object.values(values).some(Boolean)) return;
      Sound.play("send");
      act({ type: "answer", values });
    };
    const first = $("[data-btp]");
    if (first && !isTouch()) first.focus();
  }
}
