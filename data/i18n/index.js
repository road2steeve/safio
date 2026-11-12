// Traductions des contenus du Quiz dans les langues ajoutées après le français, l'anglais et l'espagnol.
// Les fichiers d'origine (FR/EN/ES) ne changent pas : chaque langue a son dossier data/i18n/<langue>/,
// avec un fichier par thème. Chaque entrée est reliée à sa question par un identifiant calculé à partir
// du texte français (même calcul que le serveur) :
//   "identifiant": ["question traduite", "réponse traduite / autre réponse acceptée / …"]
// La réponse est facultative quand elle est identique dans toutes les langues (nombres, noms propres).
// Une question sans traduction s'affiche en français, avec une mention, chez le joueur.
// Vérifier la couverture : npm run check:i18n
const fs = require("fs");
const path = require("path");

// Même identifiant que le serveur (server.js, qid)
function contentId(x) {
  const src = JSON.stringify([x.q && x.q.fr, x.img || "", x.fr || "", x.t || ""]);
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
const LANGS = fs.readdirSync(__dirname, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const load = (lang, file) => { try { return require(path.join(__dirname, lang, file)); } catch (e) { if (e.code === "MODULE_NOT_FOUND") return {}; throw e; } };
const allOf = (lang, prefix) => Object.assign({}, ...fs.readdirSync(path.join(__dirname, lang)).filter((f) => f.startsWith(prefix) && f.endsWith(".js")).map((f) => load(lang, f)));
// Réponse « texte / variante / variante » → [affichée, ...acceptées]
const split = (s) => String(s || "").split(" / ").map((x) => x.trim()).filter(Boolean);
const universal = (show) => (show && show.fr === show.en && show.en === show.es ? show.fr : null);

// Questions à réponse libre (quiz, éclair, torpille, solo…)
function applyQuiz(quiz) {
  const stats = {};
  for (const lang of LANGS) {
    const T = allOf(lang, "quiz-");
    let n = 0;
    for (const x of quiz) {
      const e = T[contentId(x)];
      if (!e) continue;
      const [q, ans] = e;
      const answers = split(ans);
      const shown = answers[0] || universal(x.show);
      if (!q || !shown) continue; // réponse manquante pour une réponse qui dépend de la langue : on garde le français
      x.q[lang] = q;
      x.show[lang] = shown;
      x.a = [...new Set([...x.a, ...answers])];
      n++;
    }
    stats[lang] = n;
  }
  return stats;
}

// Contenus des jeux de soirée, même principe (un fichier par jeu et par lot : <jeu>-<n>.js) :
//   Au plus près  "id": ["question", "unité"]           (unité facultative)
//   Mytho !       "id": ["phrase avec ___", "réponse / autre réponse acceptée"] (réponse facultative si identique partout)
//   Même cerveau  "id": ["thème"]
//   C'est toi !   "id": ["question complète"]
function applyContent(prefix, list) {
  const stats = {};
  for (const lang of LANGS) {
    const T = allOf(lang, prefix + "-");
    let n = 0;
    for (const x of list) {
      const e = T[contentId(x)];
      if (!e || !e[0]) continue;
      if (prefix === "bluff") {
        const answers = split(e[1]);
        const shown = answers[0] || universal(x.show);
        if (!shown) continue;
        x.show[lang] = shown;
        x.a = [...new Set([...x.a, ...answers])];
      }
      if (prefix === "closest" && x.u) x.u[lang] = e[1] != null ? e[1] : x.u.en;
      x.q[lang] = e[0];
      n++;
    }
    stats[lang] = n;
  }
  return stats;
}

module.exports = { LANGS, contentId, applyQuiz, applyContent, split };
