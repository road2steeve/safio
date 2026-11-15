// Turbo Bac : tous les thèmes. Chaque thème : { id, ico, fr, en, es, nl, de, w: { fr: [...], en: [...], es: [...] } }
// « w » = quelques exemples de réponses, utilisés par les Robix (ils jouent dans leur langue, sinon en anglais).
const rows = [...require("./turbo/t1"), ...require("./turbo/t2"), ...require("./turbo/t3")];
const split = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const THEMES = rows.map(([id, ico, fr, en, es, nl, de, wfr, wen, wes]) => ({ id, ico, fr, en, es, nl, de, w: { fr: split(wfr), en: split(wen), es: split(wes) } }));
module.exports = { THEMES };
