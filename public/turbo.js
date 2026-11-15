// ======== SAFIO Turbo Bac : textes (5 langues), règles et écrans du téléphone ========
// Chargé après locales/index.js (site et télé). Les fonctions d'écran utilisent les outils d'app.js
// (S, t, esc, tr, isHost, act…) seulement quand elles sont appelées, donc après le chargement complet.

const TB_T = {
  fr: {
    g_turbo: "Turbo Bac", g_turbo_d: "Tes lettres, un thème, le plus vite possible !", p_turbo: "Dès 2 joueurs (ou avec des Robix)",
    r_turbo: "Chacun a ses propres lettres. Un thème s'affiche : trouve un mot du thème qui commence par une de tes lettres pour la poser. Le premier qui n'a plus de lettres gagne la manche !",
    rounds: "Manches", time: "Temps par thème", hand: "Lettres par joueur",
    theme: "Thème {n}", round: "Manche {a} / {b}", yourLetters: "Tes lettres", ph: "Un mot du thème…", send: "Poser",
    hint: "Ton mot doit commencer par une de tes lettres. Les autres ont 5 s pour le contester.",
    feed: "Mots posés", none: "Pas encore de mot pour ce thème. À toi !", contest: "✋ Contester", contested: "✋ Contesté",
    pending: "en attente", ok: "accepté", ko: "refusé", lettersLeft: "Lettres restantes", done: "🎉 Toutes tes lettres sont posées ! Attends la validation…",
    noHand: "Tu as rejoint en cours de manche : tu joueras à la prochaine.", skip: "Thème suivant",
    tb_letter: "Ce mot ne commence par aucune de tes lettres.", tb_taken: "Ce mot a déjà été donné pour ce thème.", tb_short: "Mot trop court.", tb_notIn: "Tu joueras à la prochaine manche.",
    winner: "🏆 {name} a posé toutes ses lettres !", noWinner: "⏱ Personne n'a fini : tous les thèmes sont passés.", posed: "{n} lettre(s) posée(s)", bonus: "+3 victoire",
    newTheme: "Nouveau thème !", accepted: "✓ Lettre {l} posée !", refused: "✗ Mot refusé : la lettre {l} revient.",
  },
  en: {
    g_turbo: "Turbo Bac", g_turbo_d: "Your letters, one theme, as fast as you can!", p_turbo: "2+ players (or with Robix)",
    r_turbo: "Everyone has their own letters. A theme appears: find a word for it that starts with one of your letters to play it. The first to run out of letters wins the round!",
    rounds: "Rounds", time: "Time per theme", hand: "Letters per player",
    theme: "Theme {n}", round: "Round {a} / {b}", yourLetters: "Your letters", ph: "A word for the theme…", send: "Play",
    hint: "Your word must start with one of your letters. The others have 5 s to challenge it.",
    feed: "Words played", none: "No word for this theme yet. Go!", contest: "✋ Challenge", contested: "✋ Challenged",
    pending: "pending", ok: "accepted", ko: "rejected", lettersLeft: "Letters left", done: "🎉 All your letters are played! Waiting for approval…",
    noHand: "You joined mid-round: you'll play in the next one.", skip: "Next theme",
    tb_letter: "That word doesn't start with any of your letters.", tb_taken: "That word was already given for this theme.", tb_short: "Word too short.", tb_notIn: "You'll play in the next round.",
    winner: "🏆 {name} played all their letters!", noWinner: "⏱ Nobody finished: all the themes are used up.", posed: "{n} letter(s) played", bonus: "+3 win",
    newTheme: "New theme!", accepted: "✓ Letter {l} played!", refused: "✗ Word rejected: letter {l} comes back.",
  },
  es: {
    g_turbo: "Turbo Bac", g_turbo_d: "Tus letras, un tema, ¡lo más rápido posible!", p_turbo: "Desde 2 jugadores (o con Robix)",
    r_turbo: "Cada uno tiene sus propias letras. Aparece un tema: encuentra una palabra del tema que empiece por una de tus letras para colocarla. ¡El primero que se queda sin letras gana la ronda!",
    rounds: "Rondas", time: "Tiempo por tema", hand: "Letras por jugador",
    theme: "Tema {n}", round: "Ronda {a} / {b}", yourLetters: "Tus letras", ph: "Una palabra del tema…", send: "Colocar",
    hint: "Tu palabra debe empezar por una de tus letras. Los demás tienen 5 s para impugnarla.",
    feed: "Palabras colocadas", none: "Aún no hay palabras para este tema. ¡Vamos!", contest: "✋ Impugnar", contested: "✋ Impugnada",
    pending: "en espera", ok: "aceptada", ko: "rechazada", lettersLeft: "Letras restantes", done: "🎉 ¡Has colocado todas tus letras! Esperando la validación…",
    noHand: "Has entrado a mitad de ronda: jugarás en la siguiente.", skip: "Tema siguiente",
    tb_letter: "Esa palabra no empieza por ninguna de tus letras.", tb_taken: "Esa palabra ya se dio para este tema.", tb_short: "Palabra demasiado corta.", tb_notIn: "Jugarás en la próxima ronda.",
    winner: "🏆 ¡{name} ha colocado todas sus letras!", noWinner: "⏱ Nadie ha terminado: se acabaron los temas.", posed: "{n} letra(s) colocada(s)", bonus: "+3 victoria",
    newTheme: "¡Nuevo tema!", accepted: "✓ ¡Letra {l} colocada!", refused: "✗ Palabra rechazada: la letra {l} vuelve.",
  },
  nl: {
    g_turbo: "Turbo Bac", g_turbo_d: "Jouw letters, één thema, zo snel mogelijk!", p_turbo: "Vanaf 2 spelers (of met Robix)",
    r_turbo: "Iedereen heeft zijn eigen letters. Er verschijnt een thema: vind een woord bij het thema dat begint met een van je letters om die letter kwijt te raken. Wie als eerste geen letters meer heeft, wint de ronde!",
    rounds: "Rondes", time: "Tijd per thema", hand: "Letters per speler",
    theme: "Thema {n}", round: "Ronde {a} / {b}", yourLetters: "Jouw letters", ph: "Een woord bij het thema…", send: "Leggen",
    hint: "Je woord moet beginnen met een van je letters. De anderen hebben 5 s om het af te keuren.",
    feed: "Gelegde woorden", none: "Nog geen woord voor dit thema. Aan jou!", contest: "✋ Afkeuren", contested: "✋ Afgekeurd",
    pending: "wacht", ok: "goedgekeurd", ko: "afgekeurd", lettersLeft: "Letters over", done: "🎉 Al je letters zijn gelegd! Even wachten op de goedkeuring…",
    noHand: "Je kwam midden in de ronde binnen: je speelt mee in de volgende.", skip: "Volgend thema",
    tb_letter: "Dat woord begint met geen enkele van je letters.", tb_taken: "Dat woord is al gegeven voor dit thema.", tb_short: "Woord te kort.", tb_notIn: "Je speelt mee in de volgende ronde.",
    winner: "🏆 {name} heeft alle letters gelegd!", noWinner: "⏱ Niemand is klaar: alle thema's zijn op.", posed: "{n} letter(s) gelegd", bonus: "+3 winst",
    newTheme: "Nieuw thema!", accepted: "✓ Letter {l} gelegd!", refused: "✗ Woord afgekeurd: letter {l} komt terug.",
  },
  de: {
    g_turbo: "Turbo Bac", g_turbo_d: "Deine Buchstaben, ein Thema, so schnell wie möglich!", p_turbo: "Ab 2 Spielern (oder mit Robix)",
    r_turbo: "Jeder hat seine eigenen Buchstaben. Ein Thema erscheint: Finde ein passendes Wort, das mit einem deiner Buchstaben beginnt, um ihn abzulegen. Wer zuerst keine Buchstaben mehr hat, gewinnt die Runde!",
    rounds: "Runden", time: "Zeit pro Thema", hand: "Buchstaben pro Spieler",
    theme: "Thema {n}", round: "Runde {a} / {b}", yourLetters: "Deine Buchstaben", ph: "Ein Wort zum Thema…", send: "Ablegen",
    hint: "Dein Wort muss mit einem deiner Buchstaben beginnen. Die anderen haben 5 s, um es anzufechten.",
    feed: "Abgelegte Wörter", none: "Noch kein Wort zu diesem Thema. Los geht's!", contest: "✋ Anfechten", contested: "✋ Angefochten",
    pending: "wartet", ok: "angenommen", ko: "abgelehnt", lettersLeft: "Übrige Buchstaben", done: "🎉 Alle deine Buchstaben sind abgelegt! Warte auf die Bestätigung…",
    noHand: "Du bist mitten in der Runde dazugekommen: Du spielst in der nächsten mit.", skip: "Nächstes Thema",
    tb_letter: "Dieses Wort beginnt mit keinem deiner Buchstaben.", tb_taken: "Dieses Wort wurde für dieses Thema schon genannt.", tb_short: "Wort zu kurz.", tb_notIn: "Du spielst in der nächsten Runde mit.",
    winner: "🏆 {name} hat alle Buchstaben abgelegt!", noWinner: "⏱ Niemand ist fertig geworden: Alle Themen sind durch.", posed: "{n} Buchstabe(n) abgelegt", bonus: "+3 Sieg",
    newTheme: "Neues Thema!", accepted: "✓ Buchstabe {l} abgelegt!", refused: "✗ Wort abgelehnt: Buchstabe {l} kommt zurück.",
  },
};

// Le nom du jeu et sa fiche rejoignent les textes du site (accueil, salon, télé)
if (typeof T !== "undefined") for (const l of Object.keys(TB_T)) if (T[l]) for (const k of ["g_turbo", "g_turbo_d", "p_turbo", "r_turbo"]) T[l][k] = TB_T[l][k];
if (typeof RULES !== "undefined") {
  const R = {
    fr: { ex: { top: "🔥 Thème : « Ça se mange au petit-déjeuner »", rows: [["Léa · B C M", "Brioche → B posée", "✓"], ["Tom · C P T", "Croissant → C posée", "✓"], ["Inès · M R S", "Salade ?", "✋"]], note: "Léa et Tom posent une lettre. Inès est contestée par la majorité : sa lettre S revient." },
      steps: ["Chacun reçoit ses propres lettres (5 par défaut), visibles seulement sur son téléphone.", "Un thème s'affiche. Tout le monde joue en même temps : tape un mot du thème qui commence par une de tes lettres pour la poser. Un mot déjà donné pour ce thème ne compte plus.", "Pendant 5 secondes, les autres peuvent contester ton mot (✋). Si la majorité conteste, ta lettre revient.", "Le thème change toutes les 5 réponses acceptées (ou à la fin du chrono). Le premier qui a posé toutes ses lettres gagne la manche.", "Points : 1 par lettre posée, +3 pour le gagnant de la manche."] },
    en: { ex: { top: "🔥 Theme: “Something you eat for breakfast”", rows: [["Léa · B C M", "Bagel → B played", "✓"], ["Tom · C P T", "Cereal → C played", "✓"], ["Inès · M R S", "Salad?", "✋"]], note: "Léa and Tom each play a letter. Most players challenge Inès: her S comes back." },
      steps: ["Everyone gets their own letters (5 by default), shown only on their phone.", "A theme appears. Everybody plays at once: type a word for the theme that starts with one of your letters to play it. A word already given for this theme doesn't count.", "For 5 seconds, the others can challenge your word (✋). If most of them do, your letter comes back.", "The theme changes after 5 accepted answers (or when the timer runs out). The first to play all their letters wins the round.", "Points: 1 per letter played, +3 for the round winner."] },
    es: { ex: { top: "🔥 Tema: «Algo que se come en el desayuno»", rows: [["Léa · C M T", "Churros → C colocada", "✓"], ["Tom · B P T", "Bizcocho → B colocada", "✓"], ["Inès · M R S", "¿Sopa?", "✋"]], note: "Léa y Tom colocan una letra. La mayoría impugna a Inès: su S vuelve." },
      steps: ["Cada uno recibe sus propias letras (5 por defecto), visibles solo en su móvil.", "Aparece un tema. Todos juegan a la vez: escribe una palabra del tema que empiece por una de tus letras para colocarla. Una palabra ya dada para este tema no cuenta.", "Durante 5 segundos, los demás pueden impugnar tu palabra (✋). Si la mayoría la impugna, tu letra vuelve.", "El tema cambia cada 5 respuestas aceptadas (o al acabar el tiempo). El primero que coloca todas sus letras gana la ronda.", "Puntos: 1 por letra colocada, +3 para el ganador de la ronda."] },
    nl: { ex: { top: "🔥 Thema: ‘Iets wat je eet bij het ontbijt’", rows: [["Léa · B C M", "Boterham → B gelegd", "✓"], ["Tom · C H T", "Hagelslag → H gelegd", "✓"], ["Inès · M R S", "Soep?", "✋"]], note: "Léa en Tom leggen een letter. De meerderheid keurt het woord van Inès af: haar S komt terug." },
      steps: ["Iedereen krijgt zijn eigen letters (standaard 5), alleen zichtbaar op zijn eigen telefoon.", "Er verschijnt een thema. Iedereen speelt tegelijk: typ een woord bij het thema dat begint met een van je letters om die te leggen. Een woord dat al gegeven is voor dit thema telt niet meer.", "De anderen hebben 5 seconden om je woord af te keuren (✋). Keurt de meerderheid het af, dan komt je letter terug.", "Het thema verandert na 5 goedgekeurde antwoorden (of als de tijd om is). Wie als eerste al zijn letters heeft gelegd, wint de ronde.", "Punten: 1 per gelegde letter, +3 voor de winnaar van de ronde."] },
    de: { ex: { top: "🔥 Thema: „Etwas, das man zum Frühstück isst“", rows: [["Léa · B C M", "Brötchen → B abgelegt", "✓"], ["Tom · C H M", "Müsli → M abgelegt", "✓"], ["Inès · M R S", "Suppe?", "✋"]], note: "Léa und Tom legen je einen Buchstaben ab. Die Mehrheit ficht Inès an: Ihr S kommt zurück." },
      steps: ["Jeder bekommt eigene Buchstaben (standardmäßig 5), die nur auf dem eigenen Handy zu sehen sind.", "Ein Thema erscheint. Alle spielen gleichzeitig: Tippe ein Wort zum Thema, das mit einem deiner Buchstaben beginnt, um ihn abzulegen. Ein Wort, das zu diesem Thema schon genannt wurde, zählt nicht.", "5 Sekunden lang können die anderen dein Wort anfechten (✋). Ficht die Mehrheit es an, kommt dein Buchstabe zurück.", "Das Thema wechselt nach 5 angenommenen Antworten (oder wenn die Zeit abläuft). Wer zuerst alle Buchstaben abgelegt hat, gewinnt die Runde.", "Punkte: 1 pro abgelegtem Buchstaben, +3 für den Rundensieger."] },
  };
  for (const l of Object.keys(R)) if (RULES[l]) RULES[l].turbo = R[l];
}

const TB = {
  t(lang, k, vars) {
    const s = (TB_T[lang] && TB_T[lang][k]) || TB_T.fr[k] || k;
    return vars ? s.replace(/\{(\w+)\}/g, (_, x) => (vars[x] == null ? "" : vars[x])) : s;
  },
  theme(lang, th) { return th ? th[lang] || th.fr : ""; },
};

// ---------- Écrans du téléphone (appelés par app.js) ----------
const tb = (k, v) => TB.t(lang, k, v);
let tbDraft = "";
let tbSeen = {}; // statut connu de mes mots (pour les sons « posé » / « refusé »)

function tbLobby() {
  return `<div class="sliders">${slider("rounds", tb("rounds"), 1, 10, 1)}${slider("time", tb("time"), 20, 120, 5, " s")}${slider("hand", tb("hand"), 3, 8, 1)}</div>`;
}

// Écran de jeu : la partie fixe (formulaire) ne bouge pas ; tbLive() met à jour le reste sans toucher au champ de saisie
function tbPlay() {
  const x = S.tb;
  return `<div class="stage tb-stage">
    <div class="hud"><div class="round"><span class="num">🏁</span><span id="tbHud"></span></div></div>
    ${timerHTML()}
    <div class="tb-theme" id="tbTheme"></div>
    <div id="tbHand"></div>
    ${S.hand ? `<form class="answer-form tb-form" id="tbForm"><input class="input" id="tbIn" autocomplete="off" autocapitalize="words" maxlength="30" placeholder="${tb("ph")}" aria-label="${tb("ph")}" value="${esc(tbDraft)}"><button class="btn primary">${tb("send")}</button></form>
      <p class="muted small">${tb("hint")}</p>` : `<p class="muted">${tb("noHand")}</p>`}
    <div class="tb-feed" id="tbFeed"></div>
    <div class="tb-left" id="tbLeft"></div>
    ${isHost() ? `<div class="actions"><button class="btn ghost small" id="tbSkip">${tb("skip")} ⏭</button></div>` : ""}
    ${x ? "" : ""}</div>`;
}

const tbTiles = (letters, cls = "") => `<div class="tb-tiles ${cls}">${letters.map((l) => `<span class="tb-tile">${esc(l)}</span>`).join("")}</div>`;

function tbLive() {
  if (!S || S.game !== "turbo" || S.phase !== "play" || !S.tb) return;
  const x = S.tb;
  const set = (id, html) => { const el = document.getElementById(id); if (el && el.getAttribute("data-h") !== html) { el.setAttribute("data-h", html); el.innerHTML = html; return el; } return null; };
  set("tbHud", `${tb("round", { a: S.round, b: S.total })} · ${tb("theme", { n: x.themeN })}`);
  const th = set("tbTheme", `<span class="tb-ico">${x.theme.ico || "🔥"}</span><b>${esc(TB.theme(lang, x.theme))}</b><span class="tb-count">${"●".repeat(x.okN)}${"○".repeat(Math.max(0, x.perTheme - x.okN))}</span>`);
  if (th && x.themeN > 1) { th.classList.remove("pop"); void th.offsetWidth; th.classList.add("pop"); Sound.play("pop"); }
  if (S.hand) set("tbHand", `<p class="label">${tb("yourLetters")}</p>${S.hand.length ? tbTiles(S.hand) : `<p class="sent">${tb("done")}</p>`}`);
  const cur = x.words.filter((w) => w.cur || w.status === "pending").slice().reverse();
  const mine = S.tbMine || [];
  const feed = set("tbFeed", `<p class="label">${tb("feed")}</p>` + (cur.length ? `<div class="answers">${cur.map((w) => {
    const can = w.status === "pending" && w.pid !== pid && !mine.includes(w.id) && !(playerOf(pid).bot);
    const tag = w.status === "pending" ? (mine.includes(w.id) ? `<span class="tag">${tb("contested")}</span>` : can ? `<button class="btn ghost small" data-tbc="${w.id}">${tb("contest")}</button>` : `<span class="muted small">⏳ ${tb("pending")}${w.n ? " · ✋" + w.n : ""}</span>`)
      : `<span class="tb-st ${w.status}">${w.status === "ok" ? "✓" : "✗"}</span>`;
    return `<div class="ans ${w.status === "ok" ? "ok" : w.status === "ko" ? "ko" : ""}"><span class="who">${who(w.pid)}</span><span class="what"><b class="tb-l">${esc(w.letter)}</b> ${esc(w.word)}</span>${tag}</div>`;
  }).join("")}</div>` : `<p class="muted">${tb("none")}</p>`));
  if (feed) feed.querySelectorAll("[data-tbc]").forEach((b) => (b.onclick = () => { b.disabled = true; act({ type: "contest", id: +b.dataset.tbc }); }));
  const rows = S.players.filter((p) => p.pid in x.left).sort((a, b) => x.left[a.pid] - x.left[b.pid]);
  set("tbLeft", `<p class="label">${tb("lettersLeft")}</p><div class="tb-race">${rows.map((p) => `<span class="tb-run ${x.left[p.pid] ? "" : "fin"}">${avHTML(p, "xs")}<b>${esc(p.name)}</b><i>${x.left[p.pid]}</i></span>`).join("")}</div>`);
  // Sons : mes mots acceptés ou refusés
  for (const w of x.words) {
    if (w.pid !== pid) continue;
    const was = tbSeen[w.id];
    if (was === "pending" && w.status === "ok") { Sound.play("correct"); toast(tb("accepted", { l: w.letter })); }
    if (was === "pending" && w.status === "ko") { Sound.play("wrong"); toast(tb("refused", { l: w.letter })); }
    tbSeen[w.id] = w.status;
  }
}

function tbReview() {
  const x = S.tb;
  const win = x.winner ? playerOf(x.winner) : null;
  const rows = S.players.filter((p) => p.pid in x.left).sort((a, b) => (S.gains[b.pid] || 0) - (S.gains[a.pid] || 0));
  return `<div class="stage">
    <div class="hud"><div class="round"><span class="num">🏁</span>${tb("round", { a: S.round, b: S.total })}</div></div>
    <p class="big-msg">${win ? tb("winner", { name: esc(win.name) }) : tb("noWinner")}</p>
    <div class="answers">${rows.map((p) => {
      const n = (x.dealt[p.pid] || 0) - x.left[p.pid];
      return `<div class="ans ${p.pid === x.winner ? "ok" : ""}"><span class="who">${who(p.pid)}</span><span class="what">${tb("posed", { n })}${p.pid === x.winner ? ` · <b>${tb("bonus")}</b>` : ""}</span>${gainsTag(p.pid)}</div>`;
    }).join("")}</div>${nextBtn()}</div>`;
}

function tbBind() {
  const f = document.getElementById("tbForm");
  const sk = document.getElementById("tbSkip");
  if (sk) sk.onclick = () => act({ type: "skip" });
  if (!f) return;
  const inp = document.getElementById("tbIn");
  inp.oninput = () => (tbDraft = inp.value);
  f.onsubmit = (e) => {
    e.preventDefault();
    const v = inp.value.trim();
    if (!v) return;
    const L = v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^(l'|d')/i, "")[0];
    if (S.hand && L && !S.hand.includes(L.toUpperCase()) && !/^(le|la|les|un|une|des|the|a|an|el|los|las|het|een|der|die|das)\s/i.test(v)) { Sound.play("wrong"); return toast(tb("tb_letter")); }
    act({ type: "word", value: v }, (r) => {
      if (r && r.error) { Sound.play("wrong"); toast(tb(r.error)); return; }
      Sound.play("send");
      tbDraft = ""; inp.value = "";
    });
    inp.focus();
  };
  if (!isTouch()) inp.focus();
}
