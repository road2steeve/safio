// Turbo Bac dans le navigateur (téléphones + télé) : node test/e2e-turbo.js [dossier captures]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const OUT = process.argv[2] || "captures-turbo";
require("fs").mkdirSync(OUT, { recursive: true });
const PORT = 6200 + Math.floor(Math.random() * 300);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((ok) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && ok()));
  const browser = await chromium.launch();
  const errors = [];
  const phone = async (lang) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lang, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(lang + " : " + e.message));
    return p;
  };
  try {
    const tvCtx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: "fr" });
    const tv = await tvCtx.newPage();
    tv.on("pageerror", (e) => errors.push("télé : " + e.message));
    await tv.goto(BASE + "/tv");
    await tv.waitForSelector(".join .qrbox img");
    const code = (await tv.textContent(".join .code")).trim();
    await tv.keyboard.press("Enter");

    const A = await phone("fr");
    await A.goto(`${BASE}/?code=${code}&lang=fr`);
    await A.fill("#name", "Sacha");
    await A.click("#joinBtn");
    await A.waitForSelector(".host-banner");
    // Accueil : la carte du jeu
    await A.click('[data-game="turbo"]');
    await wait(500);
    await A.screenshot({ path: `${OUT}/01-salon-turbo.png` });
    await A.locator(".howto").first().scrollIntoViewIfNeeded();
    await A.screenshot({ path: `${OUT}/02-regles.png` });
    const B = await phone("de");
    await B.goto(`${BASE}/?code=${code}&lang=de`);
    await B.fill("#name", "Lena");
    await B.click("#joinBtn");
    await B.waitForSelector(".lobby");
    await A.click("[data-addbot]");
    await wait(500);
    await A.evaluate(() => socket.emit("settings", { settings: { rounds: 2, time: 60, hand: 5 } }));
    await wait(300);
    await A.click("#start");
    await A.waitForSelector("#tbForm", { timeout: 10000 });
    await wait(4000);
    // Sacha pose un mot avec sa première lettre, Lena le conteste
    const L = await A.evaluate(() => S.hand[0]);
    await A.fill("#tbIn", L + "ugubu");
    await A.click("#tbForm button");
    await B.waitForSelector("[data-tbc]");
    await A.screenshot({ path: `${OUT}/03-partie-fr.png` });
    await B.screenshot({ path: `${OUT}/04-partie-de-contester.png` });
    await tv.screenshot({ path: `${OUT}/05-tele-partie.png` });
    await B.click("[data-tbc]");
    await A.waitForFunction(() => S.tb.words.some((w) => w.status === "ko"));
    // Mauvaise lettre : refus immédiat
    const bad = await A.evaluate(() => "ABCDEFGHILMNOPRSTV".split("").find((x) => !S.hand.includes(x)));
    await A.fill("#tbIn", bad + "olala");
    await A.click("#tbForm button");
    await wait(300);
    await A.screenshot({ path: `${OUT}/06-mauvaise-lettre.png` });
    // Fin de manche : l'organisateur passe les thèmes jusqu'au bout
    for (let i = 0; i < 8; i++) { if (await A.$("#tbSkip")) await A.click("#tbSkip").catch(() => {}); await wait(250); }
    await A.waitForSelector("#next", { timeout: 10000 });
    await A.screenshot({ path: `${OUT}/07-fin-manche.png` });
    await tv.screenshot({ path: `${OUT}/08-tele-fin-manche.png` });
    // Mode confort sur le téléphone de Lena
    await B.click("#comfortBtn");
    await A.click("#next");
    await B.waitForSelector("#tbForm");
    await wait(1500);
    await B.screenshot({ path: `${OUT}/09-confort-de.png` });
  } catch (e) { errors.push("ÉCHEC : " + e.message); }
  console.log(errors.length ? errors.join("\n") : "OK, aucune erreur JS");
  await browser.close();
  srv.kill();
  process.exit(errors.length ? 1 : 0);
})();
