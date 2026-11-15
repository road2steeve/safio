// Turbo Bac : tous les thèmes. Chaque thème : { id, ico, fr, en, es, nl, de, w: { fr: [...], en: [...], es: [...], nl?, de? } }
// « w » = quelques exemples de réponses, utilisés par les Robix (ils jouent dans leur langue, sinon en anglais).
// Lignes : [id, icône, fr, en, es, nl, de, exemples fr, en, es (, nl, de)]
const rows = ["t1", "t2", "t3", "t4", "t5", "t6", "t7"].flatMap((f) => require("./turbo/" + f));
const NLDE = { ...require("./turbo/nlde1"), ...require("./turbo/nlde2") };
const split = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const THEMES = rows.map(([id, ico, fr, en, es, nl, de, wfr, wen, wes, wnl, wde]) => {
  const w = { fr: split(wfr), en: split(wen), es: split(wes) };
  if (wnl) w.nl = split(wnl);
  if (wde) w.de = split(wde);
  if (!w.nl && NLDE[id]) w.nl = split(NLDE[id][0]);
  if (!w.de && NLDE[id]) w.de = split(NLDE[id][1]);
  return { id, ico, fr, en, es, nl, de, w };
});
module.exports = { THEMES };
