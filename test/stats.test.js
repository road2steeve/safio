// Statistiques anonymes : compteurs seulement, aucune donnée personnelle, page /stats protégée.
const test = require("node:test");
const assert = require("node:assert");
delete process.env.UPSTASH_REDIS_REST_URL;
const stats = require("../lib/stats");
const { render } = require("../lib/statspage");

test("compteurs agrégés par jour, sans pseudo ni identifiant", async () => {
  stats.hit("room", { game: "quiz", mode: "room", lang: "nl", src: "meta" });
  stats.hit("start", { game: "quiz", mode: "room", n: 5 });
  stats.hit("finish", { game: "quiz", mode: "room", n: 5 });
  stats.hit("start", { game: "duel", mode: "solo", n: 1 });
  const days = await stats.read(1);
  const rows = days[0].rows;
  assert.ok(rows.find((r) => r.ev === "room" && r.lang === "nl" && r.src === "meta"));
  assert.ok(rows.find((r) => r.ev === "finish" && r.n === "5-8"));
  for (const r of rows) assert.deepStrictEqual(Object.keys(r).sort(), ["count", "ev", "game", "lang", "mode", "n", "src"].sort());
  const html = render("SAFIO Quiz", days);
  assert.match(html, /parties réelles terminées/);
  assert.match(html, /noindex/);
});

test("valeurs nettoyées (pas d'injection dans la page)", async () => {
  stats.hit("room", { game: "quiz", src: "<script>x" });
  const html = render("SAFIO Quiz", await stats.read(1));
  assert.doesNotMatch(html, /<script>x/);
});
