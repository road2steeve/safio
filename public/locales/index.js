// ======== Langues de SAFIO Quiz ========
// SAFIO_LANGS est la SEULE liste à modifier pour ajouter une langue : ajouter une ligne ici,
// puis créer public/locales/<code>.js (copier nl.js et traduire) et l'ajouter dans index.html et tv.html.
// Le français, l'anglais et l'espagnol sont historiquement dans i18n.js, i18n_ui.js, rules.js, blindtest.js
// et tvapp/tv.js ; les autres langues arrivent par public/locales/<code>.js et sont branchées ici.
// Un texte absent dans une langue s'affiche en français (langue de secours).
var SAFIO_LANGS = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "nl", name: "Nederlands" },
  { code: "de", name: "Deutsch" },
];
var SAFIO_DEFAULT_LANG = "fr";
// Langue proposée quand le navigateur n'utilise aucune de nos langues (visiteur japonais, etc.)
var SAFIO_FOREIGN_LANG = "en";

// Première visite : langue choisie dans l'adresse (?lang=xx, envoyée par playsafio.com), sinon langues du navigateur
function safioDetectLang(ok) {
  var m = /[?&]lang=([a-z]{2})/.exec(location.search || "");
  if (m && ok(m[1])) return m[1];
  var L = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (var i = 0; i < L.length; i++) { var c = String(L[i]).slice(0, 2).toLowerCase(); if (ok(c)) return c; }
  return SAFIO_FOREIGN_LANG;
}
// Langue demandée par l'adresse (?lang=xx), prioritaire sur le choix enregistré
function safioUrlLang(ok) { var m = /[?&]lang=([a-z]{2})/.exec(location.search || ""); return m && ok(m[1]) ? m[1] : null; }

// Petits drapeaux dessinés en code (les drapeaux emoji ne s'affichent pas sous Windows)
var SAFIO_FLAG = (function () {
  var n = 0;
  var tri = function (a, b, c, v) {
    return v ? '<rect width="10" height="20" fill="' + a + '"/><rect x="10" width="10" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/>'
      : '<rect width="30" height="7" fill="' + a + '"/><rect y="6.67" width="30" height="6.67" fill="' + b + '"/><rect y="13.33" width="30" height="6.67" fill="' + c + '"/>';
  };
  var D = {
    fr: function () { return tri("#002395", "#fff", "#ed2939", true); },
    nl: function () { return tri("#ae1c28", "#fff", "#21468b"); },
    de: function () { return tri("#000", "#dd0000", "#ffce00"); },
    es: function () { return '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'; },
    en: function (u) { return '<clipPath id="gb' + u + '"><rect width="30" height="20"/></clipPath><g clip-path="url(#gb' + u + ')"><rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6"/><path d="M15 0V20M0 10H30" stroke="#c8102e" stroke-width="3.6"/></g>'; },
  };
  return function (code, size) {
    size = size || 22;
    return D[code] ? '<svg class="flag" viewBox="0 0 30 20" width="' + size + '" height="' + Math.round(size * 2 / 3) + '" aria-hidden="true" focusable="false">' + D[code](++n) + "</svg>" : "";
  };
})();

// Branche les textes de public/locales/<code>.js dans les structures existantes du site et de la télé
(function () {
  var L = window.SAFIO_L10N || {};
  var put = function (table, map, code) {
    if (!table || !map) return;
    for (var id in map) if (table[id]) table[id][code] = map[id];
  };
  for (var code in L) {
    var d = L[code];
    if (typeof T !== "undefined") T[code] = Object.assign({}, T[code] || {}, d.ui || {});
    if (typeof LANGS !== "undefined") LANGS[code] = SAFIO_LANGS.filter(function (l) { return l.code === code; }).map(function (l) { return l.name; })[0] || code;
    if (typeof THEME_INFO !== "undefined") put(THEME_INFO, d.themes, code);
    if (typeof BAC_CATS !== "undefined") put(BAC_CATS, d.bac, code);
    if (typeof RULES !== "undefined" && d.rules) RULES[code] = d.rules;
    if (typeof RULES_UI !== "undefined" && d.rulesUi) RULES_UI[code] = d.rulesUi;
    if (typeof BT_T !== "undefined" && d.bt) BT_T[code] = d.bt;
    if (typeof BT_CATS !== "undefined") put(BT_CATS, d.btCats, code);
  }
  // Ordre du sélecteur = ordre de SAFIO_LANGS
  if (typeof LANGS !== "undefined") {
    var all = {};
    SAFIO_LANGS.forEach(function (l) { if (LANGS[l.code]) all[l.code] = l.name; });
    Object.keys(LANGS).forEach(function (k) { delete LANGS[k]; });
    Object.assign(LANGS, all);
  }
})();
