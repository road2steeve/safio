// Filtre de pseudos volontairement simple (copie adaptée de celui de SAFIO Party, sans code partagé) :
// masque les insultes les plus courantes (FR/EN/ES), car les pseudos s'affichent dans le classement mondial
// et en partie rapide avec des inconnus. Ce n'est pas une modération parfaite : l'hôte peut aussi exclure un joueur.
const { norm } = require("./util");

const BAD = [
  // fr
  "connard", "connasse", "salope", "pute", "encule", "enculer", "batard", "pd", "fdp", "ntm", "nique", "niquer", "tg", "conne", "con",
  // en
  "fuck", "fucking", "shit", "bitch", "cunt", "asshole", "dick", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  // es
  "puta", "puto", "mierda", "cabron", "gilipollas", "pendejo", "marica", "coño", "joder", "verga",
];
const BAD_SET = new Set(BAD.map(norm));
// Mots assez longs pour être cherchés aussi À L'INTÉRIEUR d'un pseudo collé (« xxFuckxx ») sans faux positifs
const BAD_INSIDE = BAD.map(norm).filter((w) => w.length >= 4 && !["conne", "pute", "puta", "puto", "dick", "shit"].includes(w));

function filterText(text) {
  return String(text).replace(/[\p{L}\p{N}]+/gu, (w) => {
    const n = norm(w);
    return BAD_SET.has(n) || BAD_INSIDE.some((b) => n.includes(b)) ? "★".repeat(Math.min(w.length, 6)) : w;
  });
}
module.exports = { filterText };
