// Contrôle qualité des banques de contenu : node scripts/check-content.js [--verbose]
// Erreurs (le script échoue) : doublon exact, langue manquante, réponse vide, niveau ou thème invalide,
//   drapeau sans image, nombre invalide dans « Au plus près », date de validité mal écrite.
// Avertissements : questions presque identiques, réponse écrite dans la question, questions périmées
//   ou à revérifier dans les 6 mois.
const fs = require("fs");
const path = require("path");
const { THEMES, quiz, closest } = require("../data/questions");
const party = require("../data/party");
const { norm } = require("../lib/util");
const { answerKey } = require("../lib/pick");

const verbose = process.argv.includes("--verbose");
const errors = [], warnings = [];
const LANGS = ["fr", "en", "es"];
const flagDir = path.join(path.dirname(require.resolve("flag-icons/package.json")), "flags", "4x3");
const now = Date.now(), soon = now + 183 * 864e5;

const STOP = new Set("le la les l un une des du de d en a au aux et est quel quelle quels quelles qui que quoi dans sur par pour combien ce cette son sa ses il elle on se ne pas plus".split(" "));
const words = (s) => new Set(norm(s).split(" ").filter((w) => (w.length > 2 || /\d/.test(w)) && !STOP.has(w)));
function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function checkBank(name, list, { themes, answers = true, numeric = false } = {}) {
  const exact = new Map();
  for (const [i, x] of list.entries()) {
    const where = `${name} #${i} « ${(x.q && x.q.fr) || "?"} »`;
    for (const l of LANGS) if (!x.q || !String(x.q[l] || "").trim()) errors.push(`${where} : texte ${l.toUpperCase()} manquant`);
    if (themes && !themes.includes(x.t)) errors.push(`${where} : thème inconnu ${x.t}`);
    if (x.d !== undefined && ![1, 2, 3].includes(x.d)) errors.push(`${where} : niveau invalide ${x.d}`);
    for (const k of ["until"]) if (x[k] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(x[k])) errors.push(`${where} : date ${k} invalide`);
    if (x.until && Date.parse(x.until) < now) warnings.push(`${where} : PÉRIMÉE depuis ${x.until} (ne sort plus)`);
    else if (x.until && Date.parse(x.until) < soon) warnings.push(`${where} : à revérifier avant ${x.until}`);
    if (answers) {
      if (!x.show || LANGS.some((l) => !String(x.show[l] || "").trim())) errors.push(`${where} : réponse manquante`);
      else if (!x.img && x.t !== "emoji") {
        const a = norm(x.show.fr);
        if (a.length > 3 && ` ${norm(x.q.fr)} `.includes(` ${a} `)) warnings.push(`${where} : la réponse « ${x.show.fr} » apparaît dans la question`);
      }
    }
    if (numeric && !Number.isFinite(x.n)) errors.push(`${where} : nombre invalide`);
    if (x.img && x.img.startsWith("/flags/") && !fs.existsSync(path.join(flagDir, path.basename(x.img)))) errors.push(`${where} : image ${x.img} introuvable`);
    const key = [x.q ? norm(x.q.fr) : "", x.img || "", x.t || "", x.img || !x.show ? "" : norm(x.show.fr)].join("|");
    if (exact.has(key)) errors.push(`${where} : doublon exact de #${exact.get(key)}`);
    else exact.set(key, i);
  }
  // Questions presque identiques (même thème, mots très proches), hors drapeaux et emojis
  const items = list.filter((x) => !x.img && x.t !== "emoji").map((x) => ({ x, w: words(x.q.fr) }));
  let near = 0;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.x.t !== b.x.t) continue;
      const J = jaccard(a.w, b.w);
      const sameAns = answers && answerKey(a.x) && answerKey(a.x) === answerKey(b.x);
      if (J >= 0.8 || (sameAns && J >= 0.5)) {
        near++;
        warnings.push(`${name} : presque identiques (${J.toFixed(2)}) « ${a.x.q.fr} » / « ${b.x.q.fr} »`);
      }
    }
  return near;
}

const banks = [
  ["Quiz", quiz, { themes: THEMES }],
  ["Au plus près", closest, { answers: false, numeric: true }],
  ["Mytho !", party.bluff, {}],
  ["Même cerveau", party.same, { answers: false }],
  ["C'est toi !", party.who, { answers: false }],
];
for (const [name, list, opt] of banks) checkBank(name, list, opt);

// Résumé
console.log("Contenu de SAFIO Quiz");
for (const [name, list] of banks) console.log(`  ${name.padEnd(14)} ${String(list.length).padStart(5)}`);
const byTheme = {}, byLevel = { 1: 0, 2: 0, 3: 0, "?": 0 };
for (const x of quiz) {
  byTheme[x.t] = (byTheme[x.t] || 0) + 1;
  byLevel[x.d || "?"]++;
}
console.log("  Quiz par thème : " + THEMES.map((t) => `${t} ${byTheme[t] || 0}`).join(", "));
console.log(`  Quiz par niveau : facile ${byLevel[1]}, moyen ${byLevel[2]}, difficile ${byLevel[3]}, non noté ${byLevel["?"]}`);
console.log(`  Avec date de validité : ${quiz.concat(closest, party.bluff).filter((x) => x.until).length}`);
console.log(`\n${errors.length} erreur(s), ${warnings.length} avertissement(s)`);
const show = (arr, tag) => arr.slice(0, verbose ? Infinity : 30).forEach((m) => console.log(`  ${tag} ${m}`));
show(errors, "✗");
show(warnings, "!");
if (!verbose && warnings.length > 30) console.log(`  … (--verbose pour tout voir)`);
process.exit(errors.length ? 1 : 0);
