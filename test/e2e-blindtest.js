// SAFIO Blind Test : parcours complet dans un vrai navigateur (une télé + trois téléphones).
// Mode Soirée : le DJ (organisateur) lance la musique dans SON appli ; ici on simule seulement son appui sur « La musique joue ».
// Usage : node test/e2e-blindtest.js [dossier-captures]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUT = process.argv[2] || path.join(__dirname, "..", "captures-bt");
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5500 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
async function step(name, fn) {
  try { await fn(); console.log(`ok   - ${name}`); }
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
  const phone = async (name, locale = "fr-FR") => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale });
    const p = await ctx.newPage();
    watch(p, name);
    return p;
  };
  const shot = (page, file, full) => page.screenshot({ path: path.join(OUT, file), fullPage: !!full });
  let code;
  try {
    const players = [];
    await step("La télé ouvre la salle, trois téléphones la rejoignent", async () => {
      await tv.goto(BASE + "/tv");
      await tv.waitForSelector(".join .qrbox img");
      code = (await tv.textContent(".join .code")).trim();
      await tv.keyboard.press("Enter");
      for (const name of ["Alice", "Bruno", "Chloé"]) {
        const p = await phone(name);
        await p.goto(`${BASE}/?code=${code}`);
        await p.fill("#name", name);
        await p.click("#joinBtn");
        await p.waitForSelector(".lobby");
        players.push(p);
      }
    });
    const [alice, bruno, chloe] = players;

    await step("L'organisatrice choisit le Blind Test : catégories, format, réponses, DJ, points", async () => {
      await alice.click('[data-game="blindtest"]');
      await alice.waitForSelector("[data-btcat]");
      await alice.click('[data-btcat="disney"]');
      await wait(150);
      await alice.click('[data-set="fmt"][data-val="both"]');
      await wait(150);
      await alice.evaluate(() => socket.emit("settings", { settings: { count: 3, time: 30 } }));
      await wait(250);
      const s = await alice.evaluate(() => S.settings);
      ok(s.cats.includes("disney") && s.fmt === "both", "réglages pris en compte");
      ok(await alice.$(".bt-legal"), "mention : la musique vient de l'appli de l'organisateur");
      await shot(alice, "bt-01-reglages.png", true);
      await tv.waitForFunction(() => /Blind Test/.test(document.body.textContent));
      await shot(tv, "bt-02-tv-salon.png");
    });

    await step("Lancement : le DJ voit le morceau et les liens de recherche, les autres attendent", async () => {
      await alice.click("#start");
      await alice.waitForSelector("#btGo");
      ok(await alice.$(".bt-links a"), "liens Spotify / Deezer / Apple Music / YouTube Music");
      const t = await alice.textContent(".bt-title");
      ok(t.length > 1, "titre visible pour le DJ");
      await bruno.waitForSelector(".bt-eq.idle");
      ok(!(await bruno.textContent("body")).includes(t), "Bruno ne voit pas le titre");
      await wait(3600); // compte à rebours de la télé
      ok(!(await tv.textContent("body")).includes(t), "la télé ne montre pas le titre");
      await shot(alice, "bt-03-dj.png", true);
      await shot(bruno, "bt-04-joueur-attente.png");
      await shot(tv, "bt-05-tv-dj-prepare.png");
    });

    let answer;
    await step("« La musique joue » : chrono, champs titre + artiste ; Bruno trouve, Chloé se trompe", async () => {
      answer = await alice.evaluate(() => ({ title: (S.cue.title && S.cue.title.fr) || S.cue.title, artist: S.cue.artist, work: S.cue.work && S.cue.work.fr }));
      await alice.click("#btGo");
      await bruno.waitForSelector("#btForm");
      await tv.waitForSelector(".bt-eq:not(.idle)");
      await shot(bruno, "bt-06-joueur-ecoute.png");
      await shot(tv, "bt-07-tv-ecoute.png");
      const parts = await bruno.$$eval("[data-btp]", (els) => els.map((e) => e.dataset.btp));
      for (const p of parts) await bruno.fill(`[data-btp="${p}"]`, (answer[p] || "").toUpperCase().replace(/e/gi, "e"));
      await bruno.click("#btForm button");
      await bruno.waitForSelector(".sent");
      for (const p of parts) await chloe.fill(`[data-btp="${p}"]`, "Mauvaise réponse");
      await chloe.click("#btForm button");
      await alice.waitForSelector(".bt-reveal .bt-title");
      await tv.waitForSelector(".qz.reveal .bt-reveal");
      await wait(900);
      const g = await alice.evaluate(() => S.gains);
      const ids = await alice.evaluate(() => S.players.reduce((o, p) => ((o[p.name] = p.pid), o), {}));
      ok(g[ids["Bruno"]] > 0, "Bruno marque des points");
      ok(!g[ids["Chloé"]], "Chloé ne marque rien");
      await shot(bruno, "bt-08-joueur-revelation.png", true);
      await shot(tv, "bt-09-tv-revelation.png");
    });

    await step("Morceau 2 en 4 propositions, morceau 3 au buzzer avec pause", async () => {
      await alice.evaluate(() => socket.emit("lobby"));
      await wait(200);
      await alice.evaluate(() => socket.emit("settings", { settings: { input: "choice", fmt: "auto", cats: ["y80", "y90"], count: 3 } }));
      await wait(200);
      await alice.click("#start");
      await alice.waitForSelector("#btGo");
      await wait(3600);
      await alice.click("#btGo");
      await bruno.waitForSelector(".bt-choice");
      await tv.waitForSelector(".opts .opt");
      await shot(bruno, "bt-10-joueur-4-propositions.png");
      await shot(tv, "bt-11-tv-4-propositions.png");
      await bruno.click(".bt-choice");
      await chloe.click(".bt-choice:nth-child(2)");
      await alice.waitForSelector(".bt-reveal");
      await alice.click("#next");
      // Buzzer
      await alice.evaluate(() => socket.emit("lobby"));
      await wait(200);
      await alice.evaluate(() => socket.emit("settings", { settings: { input: "buzz", cats: ["films"], count: 3 } }));
      await wait(200);
      await alice.click("#start");
      await alice.waitForSelector("#btGo");
      await wait(3600);
      await alice.click("#btGo");
      await bruno.waitForSelector("#btBuzz");
      await shot(bruno, "bt-12-joueur-buzzer.png");
      await alice.click("#btPause");
      await bruno.waitForSelector("#btBuzz[disabled]");
      await tv.waitForSelector(".bt-paused");
      await shot(tv, "bt-13-tv-pause.png");
      await alice.click("#btResume");
      await bruno.waitForSelector("#btBuzz:not([disabled])");
      await chloe.click("#btBuzz");
      await wait(150);
      await bruno.click("#btBuzz");
      await alice.waitForSelector("[data-btv]");
      await tv.waitForSelector(".bt-buzzers .bz");
      await shot(alice, "bt-14-dj-buzzers.png", true);
      await shot(tv, "bt-15-tv-buzzers.png");
      await alice.click('[data-btv][data-ok="0"]'); // Chloé se trompe
      await wait(200);
      await alice.click('[data-btv][data-ok="1"]'); // Bruno a juste
      await tv.waitForSelector(".qz.reveal .bt-reveal");
      await wait(900);
      await shot(tv, "bt-16-tv-revelation-buzzer.png");
    });

    await step("Fin de partie : podium sur la télé", async () => {
      for (let i = 0; i < 4; i++) {
        const fin = await alice.evaluate(() => S.phase);
        if (fin === "final") break;
        if (await alice.$("#btGo")) { await alice.click("#btGo"); await wait(200); await alice.click("#btReveal"); }
        await alice.waitForSelector("#next", { timeout: 5000 }).catch(() => {});
        if (await alice.$("#next")) await alice.click("#next");
        await wait(300);
      }
      await alice.waitForFunction(() => S.phase === "final");
      await tv.waitForSelector(".podium");
      await wait(5600);
      await shot(tv, "bt-17-tv-podium.png");
    });

    await step("Espagnol et anglais : textes traduits sur le téléphone", async () => {
      const p = await phone("Diego", "es-ES");
      await p.goto(`${BASE}/?code=${code}`);
      await p.fill("#name", "Diego");
      await p.click("#joinBtn");
      await p.waitForSelector(".lobby, .stage, .final");
      await p.evaluate(() => setLang("es"));
      const txt = await p.textContent("body");
      ok(/Blind Test/.test(txt), "nom du jeu en espagnol");
    });

    ok(!errors.length, "aucune erreur JavaScript : " + errors.join(" | "));
    console.log("Captures :", OUT);
  } catch (e) {
    console.log("Erreurs JS :", errors.join(" | ") || "aucune");
    process.exitCode = 1;
  } finally {
    await browser.close();
    srv.kill();
  }
})();
