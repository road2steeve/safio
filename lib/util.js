// Petits outils partagés par les jeux.
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Minuscules, sans accents, sans ponctuation ni articles
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(le|la|les|l|un|une|des|du|de|d|the|a|an|el|los|las)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
// Tolère une petite faute de frappe (1 faute par tranche de 5 lettres)
function isMatch(answer, accepted, strict) {
  const x = norm(answer);
  if (!x) return false;
  return accepted.some((ok) => {
    const y = norm(ok);
    if (!y) return false;
    if (x === y) return true;
    if (strict) return false;
    if (/^\d+$/.test(y)) return false; // les nombres doivent être exacts
    return lev(x, y) <= Math.floor(y.length / 5);
  });
}
const clamp = (v, lo, hi, def) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.round(+v))) : def);

module.exports = { shuffle, pick, norm, lev, isMatch, clamp };
