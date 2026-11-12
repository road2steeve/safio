// SAFIO Quiz en 5 langues : partie mixte dans un vrai navigateur (une télé en allemand + des téléphones
// en français, néerlandais, allemand et anglais), détection de la langue, changement de langue en pleine
// partie, et contrôle des débordements (textes allemands plus longs) sur mobile, tablette et ordinateur.
// Usage : node test/e2e-langs.js [dossier-captures]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUT = process.argv[2] || path.join(__dirname, "..", "captures-langs");
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5400 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [], overflow = [];
let n = 0;
async function step(name, fn) {
  try { await fn(); console.log(`ok   - ${name}`); n++; }
  catch (e) { console.log(`FAIL - ${name}\n       ${e.message.split("\n")[0]}`); throw e; }
}
const ok = (c, m) => { if (!c) throw new Error(m); };
// Éléments dont le texte déborde de leur boîte (boutons, puces, cartes) ou page plus large que l'écran
async function audit(page, where) {
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    if (document.documentElement.scrollWidth > W + 1) out.push("page plus large que l'écran (" + document.documentElement.scrollWidth + " > " + W + ")");
    for (const e of document.querySelectorAll("button:not(.avatar-btn), .btn, .chip, .pill, .theme, .game-card, label, .tag, h1, h2, h3")) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || !e.offsetParent) continue;
      if (e.scrollWidth > e.clientWidth + 2 && cs.overflowX !== "auto" && cs.overflowX !== "scroll" && cs.textOverflow !== "ellipsis") out.push((e.className || e.tagName) + " « " + (e.textContent || "").trim().slice(0, 40) + " »");
    }
    return out.slice(0, 6);
  });
  for (const x of r) overflow.push(`${where} : ${x}`);
}

(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: { ...process.env, PORT: String(PORT), UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((r) => srv.stdout.on("data", (d) => String(d).includes("Serveur prêt") && r()));
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const watch = (page, who) => {
    page.on("pageerror", (e) => errors.push(`${who}: ${e.message} ${(e.stack || "").split("\n")[1] || ""}`));
    page.on("console", (m) => m.type() === "error" && !/favicon|fonts\.g/.test(m.text()) && errors.push(`${who}: ${m.text()}`));
  };
  const SIZES = { mobile: { width: 390, height: 844 }, tablette: { width: 820, height: 1180 }, ordi: { width: 1440, height: 900 } };
  const device = async (who, locale, size = "mobile") => {
    const ctx = await browser.newContext({ viewport: SIZES[size], deviceScaleFactor: 1, isMobile: size === "mobile", hasTouch: size !== "ordi", locale });
    const p = await ctx.newPage();
    watch(p, who);
    return p;
  };
  const shot = (page, file) => page.screenshot({ path: path.join(OUT, file) });
  const langOf = (p) => p.evaluate(() => document.documentElement.lang);

  try {
    await step("Première visite : la langue du navigateur est choisie (nl-BE → NL, de-DE → DE, ja → EN, fr-BE → FR)", async () => {
      for (const [loc, want] of [["nl-BE", "nl"], ["de-DE", "de"], ["ja-JP", "en"], ["fr-BE", "fr"], ["es-MX", "es"]]) {
        const p = await device("détection " + loc, loc);
        await p.goto(BASE + "/");
        await p.waitForSelector("#langBtn");
        ok((await langOf(p)) === want, `${loc} → ${await langOf(p)} au lieu de ${want}`);
        await p.context().close();
      }
    });

    await step("?lang=de venu de playsafio.com l'emporte et reste enregistré", async () => {
      const p = await device("lien portail", "fr-FR");
      await p.goto(BASE + "/?lang=de");
      await p.waitForSelector("#langBtn");
      ok((await langOf(p)) === "de", "langue de l'adresse");
      await p.goto(BASE + "/");
      await p.waitForSelector("#langBtn");
      ok((await langOf(p)) === "de", "langue retenue à la visite suivante");
      await p.context().close();
    });

    await step("Accueil en NL et DE sur mobile, tablette et ordinateur : captures + débordements", async () => {
      for (const l of ["nl", "de"]) for (const s of Object.keys(SIZES)) {
        const p = await device(`accueil ${l} ${s}`, l, s);
        await p.goto(BASE + "/?lang=" + l);
        await p.waitForSelector("#langBtn");
        await wait(500);
        await audit(p, `accueil ${l} ${s}`);
        await shot(p, `q-accueil-${l}-${s}.png`);
        if (s !== "tablette") { await p.click("#langBtn"); await wait(150); await shot(p, `q-accueil-${l}-${s}-menu.png`); }
        await p.context().close();
      }
    });

    const tv = await device("télé", "fr-FR", "ordi");
    let code;
    await step("La télé s'ouvre en allemand (sa propre langue) avec les drapeaux sur l'écran de démarrage", async () => {
      await tv.setViewportSize({ width: 1920, height: 1080 });
      await tv.goto(BASE + "/tv?lang=de");
      await tv.waitForSelector(".join .qrbox img");
      code = (await tv.textContent(".join .code")).trim();
      ok((await langOf(tv)) === "de", "télé en allemand");
      ok((await tv.textContent("#gate-btn")).includes("OK"), "bouton OK");
      await wait(600);
      await shot(tv, "q-tv-de-demarrage.png");
      await tv.keyboard.press("Enter");
    });

    const team = [["Alice", "fr-FR"], ["Bram", "nl-BE"], ["Dieter", "de-DE"], ["Emma", "en-GB"]];
    const P = {};
    await step("4 joueurs rejoignent, chacun dans sa langue (FR, NL, DE, EN)", async () => {
      for (const [name, loc] of team) {
        const p = await device(name, loc);
        await p.goto(`${BASE}/?code=${code}`);
        await p.fill("#name", name);
        await p.click("#joinBtn");
        await p.waitForSelector(".lobby");
        P[name] = p;
      }
      ok((await langOf(P.Bram)) === "nl" && (await langOf(P.Dieter)) === "de" && (await langOf(P.Emma)) === "en" && (await langOf(P.Alice)) === "fr", "langues des joueurs");
      await P.Alice.waitForSelector(".host-banner");
      await wait(500);
      for (const nm of ["Bram", "Dieter"]) { await audit(P[nm], `salon ${nm}`); await shot(P[nm], `q-salon-${nm === "Bram" ? "nl" : "de"}.png`); }
      await shot(tv, "q-tv-de-salon.png");
    });

    await step("Partie de Quiz Éclair : chaque téléphone affiche les boutons dans sa langue", async () => {
      await P.Alice.click('[data-game="duel"]');
      await wait(200);
      await P.Alice.evaluate(() => socket.emit("settings", { settings: { count: 3, time: 40 } }));
      await wait(200);
      await P.Alice.click("#start");
      await P.Dieter.waitForSelector("#ans", { timeout: 9000 });
      await P.Bram.waitForSelector("#ans");
      const send = { Alice: "Envoyer", Bram: "Versturen", Dieter: "Senden", Emma: "Send" };
      for (const [nm, word] of Object.entries(send)) {
        const txt = await P[nm].evaluate(() => document.querySelector(".stage").innerText);
        ok(txt.includes(word), `${nm} voit « ${word} »`);
      }
      await wait(400);
      for (const nm of ["Bram", "Dieter"]) { await audit(P[nm], `question ${nm}`); await shot(P[nm], `q-question-${nm === "Bram" ? "nl" : "de"}.png`); }
      await shot(tv, "q-tv-de-question.png");
    });

    await step("Emma passe de l'anglais à l'espagnol en pleine question : sans rechargement, réponse en cours conservée, les autres ne changent pas", async () => {
      await P.Emma.fill("#ans", "draft");
      await P.Emma.evaluate(() => { window.__noReload = 1; });
      await P.Emma.click("#langBtn");
      await P.Emma.click('[data-setlang="es"]');
      await P.Emma.waitForFunction(() => document.documentElement.lang === "es");
      ok(await P.Emma.evaluate(() => window.__noReload === 1), "pas de rechargement");
      ok((await P.Emma.evaluate(() => document.querySelector(".stage").innerText)).includes("Enviar"), "bouton en espagnol");
      ok((await P.Emma.inputValue("#ans")) === "draft", "réponse en cours conservée");
      ok((await langOf(P.Alice)) === "fr" && (await langOf(P.Bram)) === "nl" && (await langOf(P.Dieter)) === "de", "les autres gardent leur langue");
      ok((await langOf(tv)) === "de", "la télé garde sa langue");
      await shot(P.Emma, "q-changement-es.png");
    });

    await step("Fin de partie : classement dans chaque langue", async () => {
      for (let i = 0; i < 10; i++) {
        if (await P.Alice.$(".final, .podium, .res, .end")) break;
        await P.Alice.evaluate(() => socket.emit("next"));
        await wait(350);
      }
      await wait(1500);
      for (const nm of ["Bram", "Dieter"]) { await audit(P[nm], `fin ${nm}`); await shot(P[nm], `q-fin-${nm === "Bram" ? "nl" : "de"}.png`); }
      await shot(tv, "q-tv-de-fin.png");
    });

    await step("Petit Bac en allemand : catégories traduites (Stadt, Land, Fluss)", async () => {
      await P.Alice.evaluate(() => socket.emit("lobby"));
      await P.Alice.waitForSelector('[data-game="bac"]');
      await P.Alice.click('[data-game="bac"]');
      await wait(300);
      await P.Alice.click("#start");
      await P.Dieter.waitForSelector(".stage", { timeout: 9000 });
      await wait(900);
      const txt = await P.Dieter.evaluate(() => document.querySelector(".stage").innerText);
      ok(/Buchstabe|beginnt/.test(txt), "consigne en allemand");
      await audit(P.Dieter, "Petit Bac de");
      await shot(P.Dieter, "q-bac-de.png");
      await shot(P.Bram, "q-bac-nl.png");
    });

    // Lot 8 : les jeux de soirée affichent leurs contenus (pas seulement les boutons) dans la langue de chacun
    for (const [game, label] of [["closest", "Au plus près"], ["mytho", "Mytho !"], ["brain", "Même cerveau"], ["youre", "C'est toi !"]]) {
      await step(`${label} : la question s'affiche en néerlandais chez Bram et en allemand chez Dieter`, async () => {
        await P.Alice.evaluate(() => socket.emit("lobby"));
        await P.Alice.waitForSelector(`[data-game="${game}"]`);
        await P.Alice.click(`[data-game="${game}"]`);
        await wait(300);
        await P.Alice.click("#start");
        await P.Dieter.waitForSelector(".stage", { timeout: 9000 });
        const lists = { closest: require("../data/questions").closest, mytho: require("../data/party").bluff, brain: require("../data/party").same, youre: require("../data/party").who };
        const seen = (txt, lang) => lists[game].some((x) => txt.includes(String(x.q[lang]).split("___").map((f) => f.trim()).sort((a, b) => b.length - a.length)[0].slice(0, 40)));
        let de = "", nl = "";
        for (let i = 0; i < 20 && !(seen(de, "de") && seen(nl, "nl")); i++) {
          await wait(300);
          de = await P.Dieter.evaluate(() => document.querySelector(".stage")?.innerText || "");
          nl = await P.Bram.evaluate(() => document.querySelector(".stage")?.innerText || "");
        }
        ok(seen(de, "de"), `${label} : question allemande attendue chez Dieter :\n${de.slice(0, 200)}`);
        ok(seen(nl, "nl"), `${label} : question néerlandaise attendue chez Bram :\n${nl.slice(0, 200)}`);
        ok(nl !== de, `${label} : textes différents`);
        await audit(P.Dieter, `${label} de`);
        await shot(P.Dieter, `q-${game}-de.png`);
        await shot(P.Bram, `q-${game}-nl.png`);
      });
    }
  } catch (e) {
    process.exitCode = 1;
  } finally {
    console.log(`\n${n} étape(s) réussie(s).`);
    if (overflow.length) console.log("Débordements :\n  " + overflow.join("\n  ")); else console.log("Aucun débordement détecté.");
    if (errors.length) { console.log("Erreurs navigateur :\n  " + errors.join("\n  ")); process.exitCode = 1; }
    await browser.close();
    srv.kill();
  }
})();
