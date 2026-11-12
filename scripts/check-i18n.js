// Couverture des langues de SAFIO Quiz : `npm run check:i18n`
// Interface (textes, thèmes, catégories, règles, Blind Test, TV, installation) et contenus des jeux.
// Code de sortie 1 si un texte d'interface manque dans une langue (le contenu des jeux est seulement compté).
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const pub = (f) => path.join(__dirname, "..", "public", f);

const ctx = { window: {}, document: { documentElement: {} }, navigator: { language: "fr", languages: ["fr"] }, location: { search: "" }, console, innerWidth: 800 };
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(pub(f), "utf8").replace(/^const /gm, "var ").replace(/^let /gm, "var "), ctx);
["i18n.js", "rules.js", "i18n_ui.js", "blindtest.js"].forEach(load);
for (const f of fs.readdirSync(pub("locales")).filter((f) => f !== "index.js")) load("locales/" + f);
load("locales/index.js");
const LANGS = ctx.SAFIO_LANGS.map((l) => l.code);

let bad = 0;
const report = (what, missing) => { if (missing.length) { bad += missing.length; console.log(`✗ ${what} : ${missing.length} manquant(s) → ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}`); } };
const deepKeys = (o, p = "") => (o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => deepKeys(v, p ? p + "." + k : k)) : [p]);
for (const l of LANGS) {
  report(`[${l}] interface`, Object.keys(ctx.T.fr).filter((k) => ctx.T[l][k] === undefined));
  report(`[${l}] thèmes`, Object.keys(ctx.THEME_INFO).filter((k) => !ctx.THEME_INFO[k][l]));
  report(`[${l}] Petit Bac`, Object.keys(ctx.BAC_CATS).filter((k) => !ctx.BAC_CATS[k][l]));
  report(`[${l}] règles`, deepKeys(ctx.RULES.fr).filter((k) => deepKeys(ctx.RULES[l] || {}).indexOf(k) < 0));
  report(`[${l}] Blind Test`, Object.keys(ctx.BT_T.fr).filter((k) => !ctx.BT_T[l] || ctx.BT_T[l][k] === undefined));
  report(`[${l}] catégories Blind Test`, Object.keys(ctx.BT_CATS).filter((k) => !ctx.BT_CATS[k][l]));
}
// Textes de la télé et de l'installation (FR/EN/ES dans les fichiers, autres langues dans public/locales)
const grab = (file, name) => {
  const src = fs.readFileSync(pub(file), "utf8");
  const i = src.indexOf("var " + name + " = {"); let j = src.indexOf("{", i), d = 0, k = j;
  for (; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && !--d) break; }
  return vm.runInNewContext("(" + src.slice(j, k + 1) + ")", { NAME: "" });
};
const TV = grab("tvapp/tv.js", "TX"), BTV = grab("tvapp/tv.js", "BTX"), INS = grab("install.js", "TX");
for (const l of LANGS) {
  const x = ctx.window.SAFIO_L10N[l] || {};
  report(`[${l}] TV`, Object.keys(TV.fr).filter((k) => !(TV[l] || x.tv || {})[k]));
  report(`[${l}] TV Blind Test`, Object.keys(BTV.fr).filter((k) => !(BTV[l] || x.btv || {})[k]));
  report(`[${l}] installation`, Object.keys(INS.fr).filter((k) => !(INS[l] || x.install || {})[k]));
}

// Contenus des jeux (questions, réponses) : couverture par langue
const Q = require("../data/questions");
const P = require("../data/party");
const cover = (name, list, get) => {
  const row = LANGS.map((l) => { const n = list.filter((x) => { const o = get(x); return o && o[l] != null && o[l] !== ""; }).length; return `${l} ${Math.round((100 * n) / list.length)} %`; });
  console.log(`  ${name.padEnd(16)} ${String(list.length).padStart(5)}  ${row.join("  ")}`);
};
console.log("\nContenus des jeux (part traduite) :");
cover("Questions", Q.quiz, (x) => x.q);
cover("Au plus près", Q.closest, (x) => x.q);
cover("Mytho !", P.bluff, (x) => x.q);
cover("Même cerveau", P.same, (x) => x.q);
cover("C'est toi !", P.who, (x) => x.q);
// Traductions orphelines (question française modifiée ou supprimée depuis)
const I = require("../data/i18n");
const ids = new Set(Q.quiz.map(I.contentId));
for (const l of I.LANGS) {
  const dir = path.join(__dirname, "..", "data", "i18n", l);
  for (const f of fs.readdirSync(dir).filter((f) => f.startsWith("quiz-"))) {
    const lost = Object.keys(require(path.join(dir, f))).filter((id) => !ids.has(id));
    if (lost.length) { bad += lost.length; console.log(`✗ [${l}] ${f} : ${lost.length} traduction(s) sans question française (texte FR modifié ?) → ${lost.slice(0, 5).join(", ")}`); }
  }
}
console.log(bad ? `\n${bad} texte(s) d'interface manquant(s).` : "\n✓ Interface complète dans les " + LANGS.length + " langues.");
process.exit(bad ? 1 : 0);
