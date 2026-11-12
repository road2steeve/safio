// SAFIO TV (Quiz) : parcours complet dans un vrai navigateur (une télé + des téléphones).
// Usage : node test/e2e-tv.js [dossier-captures]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUT = process.argv[2] || path.join(__dirname, "..", "captures-tv");
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4900 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
let n = 0;
async function step(name, fn) {
  try { await fn(); console.log(`ok   - ${name}`); n++; }
  catch (e) { console.log(`FAIL - ${name}\n       ${e.message.split("\n")[0]}`); throw e; }
}
const ok = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((r) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && r()));
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const watch = (page, who) => {
    page.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && !/favicon|fonts\.g/.test(m.text()) && errors.push(`${who}: ${m.text()}`));
  };
  const tvCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "fr-FR" });
  const tv = await tvCtx.newPage();
  watch(tv, "télé");
  const phone = async (name) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" });
    const p = await ctx.newPage();
    watch(p, name);
    return p;
  };
  const shot = (page, file) => page.screenshot({ path: path.join(OUT, file) });
  let code;

  try {
    await step("Ouvrir /tv suffit : la salle et le QR géant s'affichent, rien à taper", async () => {
      await tv.goto(BASE + "/tv");
      await tv.waitForSelector(".join .qrbox img");
      code = (await tv.textContent(".join .code")).trim();
      ok(/^[A-Z]{4}$/.test(code), "code de salle affiché");
      await tv.waitForFunction(() => /^[A-Z0-9]{6}$/.test((document.querySelector("#pair-code") || {}).textContent || ""));
      await wait(900);
      await shot(tv, "tv-01-salle-ouverte.png");
    });

    await step("Un seul « OK » sur la télé active le son ; la musique d'ambiance démarre", async () => {
      await tv.keyboard.press("Enter"); // la touche OK de la télécommande
      await tv.waitForFunction(() => window.SAFIO_TV.audio() === "running" && window.SAFIO_TV.music() === "lobby");
    });

    const players = [];
    await step("Le premier qui scanne devient l'organisateur ; chaque arrivée est saluée sur la télé", async () => {
      for (const name of ["Alice", "Bruno", "Chloé"]) {
        const p = await phone(name);
        await p.goto(`${BASE}/?code=${code}`);
        await p.fill("#name", name);
        await p.click("#joinBtn");
        await p.waitForSelector(".lobby");
        players.push(p);
        await tv.waitForFunction((nm) => [...document.querySelectorAll(".guest .nm")].some((e) => e.textContent === nm), name);
      }
      await players[0].waitForSelector(".host-banner");
      ok(!(await players[1].$(".host-banner")), "Bruno n'est pas organisateur");
      await tv.waitForSelector(".banner.show.welcome");
      await shot(tv, "tv-02-arrivees.png");
    });

    const [alice, bruno, chloe] = players;
    await step("Lancement : compte à rebours 3-2-1, puis question géante, chrono et qui a répondu", async () => {
      await alice.click('[data-game="duel"]');
      await wait(200);
      await alice.evaluate(() => socket.emit("settings", { settings: { count: 3, time: 30 } }));
      await wait(200);
      await alice.click("#start");
      await tv.waitForSelector(".count .n");
      await tv.waitForSelector(".qz .q", { timeout: 8000 });
      await tv.waitForFunction(() => !document.querySelector(".count"), null, { timeout: 8000 });
      ok(await tv.evaluate(() => window.SAFIO_TV.music() === null), "pas de musique pendant la question");
      await bruno.fill("#ans", "Paris");
      await bruno.press("#ans", "Enter");
      await tv.waitForSelector(".answered .dot.done");
      await shot(tv, "tv-03-question.png");
    });

    await step("Correction sur la télé : bonne réponse, réponses de chacun, classement qui bouge", async () => {
      await alice.fill("#ans", "Lisbonne");
      await alice.press("#ans", "Enter");
      await chloe.fill("#ans", "Rome");
      await chloe.press("#ans", "Enter");
      await tv.waitForSelector(".qz.reveal .sol");
      await tv.waitForSelector(".qz .answers .ans");
      await wait(900);
      await shot(tv, "tv-04-correction.png");
    });

    await step("Fin de partie : podium en suspense (3e, 2e, puis gagnant)", async () => {
      for (let i = 0; i < 8; i++) {
        const done = await tv.$(".res");
        if (done) break;
        await alice.evaluate(() => socket.emit("next"));
        await wait(350);
      }
      await tv.waitForSelector("#pod3.up", { timeout: 6000 });
      ok(!(await tv.$("#pod1.up")), "le gagnant n'est pas encore révélé");
      await tv.waitForSelector("#pod1.up", { timeout: 6000 });
      await wait(1600);
      await shot(tv, "tv-05-podium.png");
    });

    await step("Téléphone de l'organisateur : télé reliée, son et volume réglables", async () => {
      await alice.evaluate(() => socket.emit("lobby"));
      await alice.waitForSelector("#tvBtn");
      await alice.click("#tvBtn");
      await alice.waitForSelector("#tvModal [data-o=music]");
      await alice.click("#tvModal [data-o=music]");
      await tv.waitForFunction(() => window.SAFIO_TV.music() === null);
      await alice.click('#tvModal [data-vol="0.6"]');
      await alice.waitForSelector('#tvModal [data-vol="0.6"].on');
      await shot(alice, "tv-06-telephone-tele.png");
    });

    await step("Une 2e télé se relie avec le code écran tapé sur le téléphone", async () => {
      const tv2 = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
      watch(tv2, "télé 2");
      await tv2.goto(BASE + "/tv");
      await tv2.waitForFunction(() => /^[A-Z0-9]{6}$/.test((document.querySelector("#pair-code") || {}).textContent || ""));
      const pair = (await tv2.textContent("#pair-code")).trim();
      await alice.fill("#tvCode", pair);
      await alice.click("#tvLink");
      await tv2.waitForFunction((c) => (document.querySelector(".pill.code b") || {}).textContent === c, code);
      await alice.waitForFunction(() => document.querySelectorAll("#tvModal .chip.on").length >= 2);
    });

    await step("Rechargement de la télé : elle revient seule dans la même salle", async () => {
      await tv.reload();
      await tv.waitForFunction((c) => (document.querySelector(".pill.code b") || {}).textContent === c, code);
    });

    await step("Téléphone : l'accueil explique la télé, sans débordement horizontal", async () => {
      const p = await phone("accueil");
      await p.goto(BASE + "/");
      await p.waitForSelector(".tv-hint a[href='/tv']");
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "pas de défilement horizontal");
      await p.locator(".tv-hint").scrollIntoViewIfNeeded();
      await shot(p, "tv-07-accueil-telephone.png");
    });

    ok(!errors.length, "erreurs JavaScript : " + errors.join(" | "));
    console.log(`SAFIO Quiz TV : ${n} étapes vertes`);
  } catch (e) {
    if (errors.length) console.log("Erreurs navigateur :", errors.join("\n"));
    process.exitCode = 1;
  } finally {
    await browser.close();
    srv.kill();
  }
})();
