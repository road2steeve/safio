// Robix dans le navigateur : node test/e2e-robix.js <dossier captures>
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const OUT = process.argv[2] || "captures-robix";
require("fs").mkdirSync(OUT, { recursive: true });
const PORT = 5900 + Math.floor(Math.random() * 300);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((ok) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && ok()));
  const browser = await chromium.launch();
  const errors = [];
  const phone = async (lang) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lang });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    return p;
  };
  try {
    const A = await phone("fr");
    await A.goto(BASE + "/?lang=fr");
    await A.fill("#name", "Sacha");
    await A.click('[data-create="youre"]');
    await A.waitForSelector(".host-banner");
    await A.locator("#robixBox").scrollIntoViewIfNeeded();
    await A.screenshot({ path: `${OUT}/01-cest-toi-seul.png` });
    await A.click("[data-addbot]");
    await wait(600);
    await A.locator("#crowd").scrollIntoViewIfNeeded();
    await A.screenshot({ path: `${OUT}/02-cest-toi-robix.png` });
    await A.click("#start");
    await A.waitForTimeout(2500);
    await A.screenshot({ path: `${OUT}/03-cest-toi-partie.png` });
    await A.click('[data-game="bac"]').catch(() => {});
    const B = await phone("de");
    await B.goto(BASE + "/?lang=de");
    await B.fill("#name", "Lena");
    await B.click('[data-create="bac"]');
    await B.waitForSelector(".host-banner");
    await B.click('[data-game="duel"]');
    await wait(400);
    await B.locator("#robixBox").scrollIntoViewIfNeeded();
    await B.screenshot({ path: `${OUT}/04-eclair-de.png` });
    await B.click('[data-game="bac"]');
    await wait(400);
    await B.locator("#robixBox").scrollIntoViewIfNeeded();
    await B.screenshot({ path: `${OUT}/05-bac-de-banc.png` });
  } catch (e) { errors.push("ÉCHEC : " + e.message); }
  console.log(errors.length ? errors.join("\n") : "OK, aucune erreur JS");
  await browser.close();
  srv.kill();
  process.exit(errors.length ? 1 : 0);
})();
