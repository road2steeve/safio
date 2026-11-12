// Page /stats (protégée par la variable d'environnement STATS_KEY) : tableau de bord simple des compteurs anonymes.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function table(title, head, rows) {
  return `<h2>${esc(title)}</h2><table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${head.length}">—</td></tr>`}</table>`;
}

function render(name, days) {
  const all = days.flatMap((d) => d.rows.map((r) => ({ ...r, day: d.day })));
  const sum = (f) => all.filter(f).reduce((s, r) => s + r.count, 0);
  const real = (r) => r.ev === "finish" && r.mode !== "solo" && r.n !== "1";
  const group = (f, key) => {
    const m = new Map();
    for (const r of all.filter(f)) m.set(key(r), (m.get(key(r)) || 0) + r.count);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const daily = days.map((d) => {
    const s = (f) => d.rows.filter(f).reduce((a, r) => a + r.count, 0);
    return [d.day, s((r) => r.ev === "room"), s((r) => r.ev === "join"), s((r) => r.ev === "start"), s(real), s((r) => r.ev === "start" && r.mode === "solo")];
  });
  const byGame = group((r) => r.ev === "start", (r) => r.game).map(([g, n]) => [g, n, group((r) => real(r) && r.game === g, () => 1)[0]?.[1] || 0]);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(name)} – statistiques</title>
<style>body{font:15px/1.4 system-ui,sans-serif;background:#070b1f;color:#eef1ff;margin:0;padding:16px;max-width:900px;margin:auto}h1{font-size:22px}h2{font-size:17px;margin-top:28px}table{border-collapse:collapse;width:100%}th,td{padding:6px 8px;border-bottom:1px solid #2a3370;text-align:left}td.n,th:not(:first-child){text-align:right}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.k div{background:#121a3d;border-radius:12px;padding:12px}.k b{display:block;font-size:26px}p{color:#a3add6}</style></head><body>
<h1>${esc(name)} · 30 derniers jours</h1>
<p>Compteurs anonymes (aucune donnée personnelle). « Partie réelle » = partie terminée à 2 joueurs ou plus, hors solo.</p>
<div class="k"><div><b>${sum((r) => r.ev === "room")}</b>salles créées</div><div><b>${sum((r) => r.ev === "join")}</b>arrivées de joueurs</div><div><b>${sum((r) => r.ev === "start")}</b>parties lancées</div><div><b>${sum(real)}</b>parties réelles terminées</div><div><b>${sum((r) => r.ev === "start" && r.mode === "solo")}</b>parties solo</div></div>
${table("Par jour", ["Jour", "Salles", "Arrivées", "Lancées", "Réelles", "Solo"], daily)}
${table("Jeux les plus joués", ["Jeu", "Parties lancées", "Réelles terminées"], byGame)}
${table("Taille des groupes (parties lancées)", ["Joueurs", "Parties"], group((r) => r.ev === "start", (r) => r.n))}
${table("Sources des salles créées", ["Source", "Salles"], group((r) => r.ev === "room", (r) => r.src))}
${table("Langues des salles créées", ["Langue", "Salles"], group((r) => r.ev === "room", (r) => r.lang))}
</body></html>`;
}
module.exports = { render };
