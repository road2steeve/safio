// SAFIO – application installable : service worker + fenêtre « Installer l'appli ».
// Tout élément [data-install] ouvre l'aide (étapes iPhone / Android, bouton direct sur Android).
(function () {
  "use strict";
  var NAME = "SAFIO Quizz";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) document.documentElement.classList.add("is-app");
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { deferred = null; close(); });

  var TX = {
    fr: { tip2: "💡 <b>Chaque jeu SAFIO a sa propre icône.</b> Si tu vois une croix <b>✕</b> en haut de l’écran (jeu ouvert depuis l’icône SAFIO), ouvre d’abord ce jeu dans ton navigateur : touche la boussole <b>🧭</b> en bas (iPhone) ou <b>⋮</b> puis « Ouvrir dans Chrome » (Android). Ensuite, suis les étapes ci-dessous.", title: "Installe " + NAME + " sur ton téléphone", sub: "Une icône sur ton écran d’accueil, comme une vraie appli. Gratuit, sans store.",
      btn: "Installer maintenant", ios: "Sur iPhone / iPad", android: "Sur Android", close: "Fermer",
      iosSteps: ["Ouvre <b>{host}</b> dans <b>Safari</b>.", "Touche <b>Partager</b> <span class=\"si-ico\">⬆︎</span> (iPhone récent : touche d’abord <b>•••</b>).", "Choisis <b>« Sur l’écran d’accueil »</b>.", "Touche <b>« Ajouter »</b>. Et voilà !"],
      androidSteps: ["Ouvre <b>{host}</b> dans <b>Chrome</b>.", "Touche le menu <b>⋮</b> en haut à droite.", "Choisis <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>.", "Confirme. Et voilà !"] },
    en: { tip2: "💡 <b>Each SAFIO game has its own icon.</b> If you see an <b>✕</b> at the top of the screen (game opened from the SAFIO icon), first open this game in your browser: tap the compass <b>🧭</b> at the bottom (iPhone) or <b>⋮</b> then “Open in Chrome” (Android). Then follow the steps below.", title: "Install " + NAME + " on your phone", sub: "An icon on your home screen, just like a real app. Free, no app store.",
      btn: "Install now", ios: "On iPhone / iPad", android: "On Android", close: "Close",
      iosSteps: ["Open <b>{host}</b> in <b>Safari</b>.", "Tap <b>Share</b> <span class=\"si-ico\">⬆︎</span> (recent iPhones: tap <b>•••</b> first).", "Choose <b>“Add to Home Screen”</b>.", "Tap <b>“Add”</b>. That’s it!"],
      androidSteps: ["Open <b>{host}</b> in <b>Chrome</b>.", "Tap the <b>⋮</b> menu at the top right.", "Choose <b>“Install app”</b> or <b>“Add to Home screen”</b>.", "Confirm. That’s it!"] },
    es: { tip2: "💡 <b>Cada juego SAFIO tiene su propio icono.</b> Si ves una <b>✕</b> arriba de la pantalla (juego abierto desde el icono SAFIO), abre primero este juego en tu navegador: toca la brújula <b>🧭</b> abajo (iPhone) o <b>⋮</b> y luego «Abrir en Chrome» (Android). Después, sigue los pasos de abajo.", title: "Instala " + NAME + " en tu móvil", sub: "Un icono en tu pantalla de inicio, como una app de verdad. Gratis, sin tienda.",
      btn: "Instalar ahora", ios: "En iPhone / iPad", android: "En Android", close: "Cerrar",
      iosSteps: ["Abre <b>{host}</b> en <b>Safari</b>.", "Toca <b>Compartir</b> <span class=\"si-ico\">⬆︎</span> (iPhone reciente: toca primero <b>•••</b>).", "Elige <b>«Añadir a pantalla de inicio»</b>.", "Toca <b>«Añadir»</b>. ¡Listo!"],
      androidSteps: ["Abre <b>{host}</b> en <b>Chrome</b>.", "Toca el menú <b>⋮</b> arriba a la derecha.", "Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.", "Confirma. ¡Listo!"] },
  };
  var CSS = ".is-app [data-install]{display:none!important}" +
    ".si-bg{position:fixed;inset:0;z-index:9999;background:rgba(5,6,20,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
    "@media(min-width:600px){.si-bg{align-items:center}}" +
    ".si{width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#141a3c;color:#eef1ff;border:1px solid rgba(160,180,255,.22);border-radius:24px;padding:22px 20px;font:16px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.5)}" +
    ".si h2{margin:0 0 6px;font-size:22px;line-height:1.2}.si p{margin:0 0 14px;color:#b7bfe6}" +
    ".si h3{margin:16px 0 8px;font-size:17px}.si ol{margin:0;padding:0;list-style:none;counter-reset:i;display:grid;gap:9px}" +
    ".si li{counter-increment:i;display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start}" +
    ".si li::before{content:counter(i);width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#1d1600;background:linear-gradient(135deg,#ffd34d,#22d3c5)}" +
    ".si .host{color:#22d3c5}.si-ico{padding:0 5px;border-radius:5px;background:rgba(255,255,255,.12)}" +
    ".si-mine{border:2px solid #22d3c5;border-radius:16px;padding:4px 12px 12px;margin-top:12px}" +
    ".si button{font:inherit;font-weight:800;border:0;border-radius:999px;cursor:pointer;min-height:46px;padding:0 20px}" +
    ".si .si-go{width:100%;color:#fff;background:linear-gradient(120deg,#7c5cff,#22d3c5);margin-bottom:4px}" +
    ".si .si-tip{margin:0 0 4px;padding:10px 12px;border-radius:14px;background:rgba(255,211,77,.1);border:1px dashed rgba(255,211,77,.45);color:#eef1ff;font-size:15px}" +
    ".si .si-x{display:block;margin:18px auto 0;background:rgba(255,255,255,.1);color:#eef1ff}";
  var CSS2 = ".safio-links{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:22px auto 8px;padding:0 16px;max-width:760px}" +
    ".safio-link{flex:1 1 220px;display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:0 20px;border-radius:999px;font-weight:800;font-size:17px;text-decoration:none;color:#fff;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.22);transition:transform .2s,background .2s}" +
    ".safio-link:hover{transform:translateY(-2px);background:rgba(255,255,255,.14)}" +
    ".safio-link--install{border:0;color:#fff;background:linear-gradient(120deg,#7c5cff,#22d3c5);box-shadow:0 10px 26px rgba(124,92,255,.35)}" +
    ".is-app .safio-links .safio-link{flex-basis:100%}";
  var st = document.createElement("style"); st.textContent = CSS + CSS2; (document.head || document.documentElement).appendChild(st);

  var bg = null;
  function close() { if (bg) { bg.remove(); bg = null; } }
  function open() {
    close();
    var l = (document.documentElement.lang || navigator.language || "fr").slice(0, 2);
    var x = window.SAFIO_L10N && window.SAFIO_L10N[l] && window.SAFIO_L10N[l].install; // langues de public/locales/
    if (!TX[l] && x) TX[l] = Object.assign({}, x, { title: x.title.replace("{NAME}", NAME) });
    var t = TX[l] || TX.fr;
    var ua = navigator.userAgent || "";
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var host = '<span class="host">' + location.host + "</span>";
    var block = function (k, mine) {
      return '<div class="' + (mine ? "si-mine" : "") + '"><h3>' + (k === "ios" ? "📱 " + t.ios : "🤖 " + t.android) + "</h3><ol>" +
        t[k + "Steps"].map(function (s) { return "<li><span>" + s.replace("{host}", host) + "</span></li>"; }).join("") + "</ol></div>";
    };
    var blocks = ios ? block("ios", true) + block("android") : /Android/.test(ua) ? block("android", true) + block("ios") : block("ios") + block("android");
    bg = document.createElement("div"); bg.className = "si-bg";
    bg.innerHTML = '<div class="si" role="dialog" aria-modal="true" aria-label="' + t.title + '"><h2>📲 ' + t.title + "</h2><p>" + t.sub + "</p>" +
      (deferred ? '<button type="button" class="si-go">' + t.btn + "</button>" : "") + '<p class="si-tip">' + t.tip2 + "</p>" + blocks +
      '<button type="button" class="si-x">' + t.close + "</button></div>";
    bg.addEventListener("click", function (e) {
      if (e.target === bg || e.target.classList.contains("si-x")) close();
      else if (e.target.classList.contains("si-go") && deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; close(); }); }
    });
    document.body.appendChild(bg);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-install]");
    if (a) { e.preventDefault(); open(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
