// SAFIO – service worker (SAFIO Quiz) : application installable + écran de chargement.
// Sur l'offre gratuite de l'hébergeur, le jeu s'endort après un moment sans visite.
// Au lieu de laisser un écran blanc ou celui de l'hébergeur, on affiche tout de suite
// l'écran de chargement SAFIO (logo + barre qui avance) jusqu'à ce que le jeu soit prêt.
// Le serveur du jeu ajoute l'en-tête « X-Safio » : sans lui, ce n'est pas encore le jeu.
var CACHE = 'safio-quiz-v3';
var LOGO = "<svg class=\"logo\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">  <rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#ffcf3d\"/>  <rect x=\"17\" y=\"9\" width=\"30\" height=\"46\" rx=\"7\" fill=\"#17112e\"/>  <rect x=\"27\" y=\"13\" width=\"10\" height=\"2.5\" rx=\"1.25\" fill=\"#3a2e6b\"/>  <rect x=\"21\" y=\"30\" width=\"11\" height=\"3.6\" rx=\"1.4\" fill=\"#2fd6c1\"/>  <rect x=\"24.7\" y=\"26.2\" width=\"3.6\" height=\"11\" rx=\"1.4\" fill=\"#2fd6c1\"/>  <circle cx=\"39\" cy=\"28.5\" r=\"2.6\" fill=\"#ff5c8a\"/>  <circle cx=\"39\" cy=\"36\" r=\"2.6\" fill=\"#ffcf3d\"/>  <rect x=\"27\" y=\"46\" width=\"10\" height=\"3\" rx=\"1.5\" fill=\"#3a2e6b\"/></svg>";
var NAME = 'SAFIO Quiz';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll([]); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

var TX = {
  fr: ['Ouverture de', 'Le jeu se réveille, encore quelques secondes…', 'Presque prêt ! Le premier lancement peut prendre jusqu’à une minute.'],
  en: ['Opening', 'The game is waking up, just a few more seconds…', 'Almost ready! The first launch can take up to a minute.'],
  es: ['Abriendo', 'El juego se está despertando, unos segundos más…', '¡Casi listo! El primer arranque puede tardar hasta un minuto.'],
  nl: ['Bezig met openen van', 'Het spel wordt wakker, nog even geduld…', 'Bijna klaar! De eerste keer opstarten kan tot een minuut duren.'],
  de: ['Öffne', 'Das Spiel wacht auf, nur noch ein paar Sekunden…', 'Fast fertig! Der erste Start kann bis zu einer Minute dauern.'],
};
function splash(lang) {
  var t = TX[lang] || TX.fr;
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    '<meta name="theme-color" content="#070b1f"><title>' + NAME + '</title><style>' +
    'html,body{margin:0;height:100%;background:#070b1f;color:#eef1ff;font:600 17px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    'body{display:grid;place-items:center;text-align:center;padding:24px;box-sizing:border-box}' +
    '.logo{width:96px;height:96px;border-radius:26px;box-shadow:0 18px 50px rgba(0,0,0,.45);animation:bob 1.6s ease-in-out infinite}' +
    '@keyframes bob{50%{transform:translateY(-8px) scale(1.04)}}' +
    'h1{font-size:26px;margin:22px 0 6px;font-weight:900}p{margin:0;color:#b7bfe6;min-height:3em;max-width:320px}' +
    '.bar{width:min(280px,80vw);height:12px;border-radius:999px;background:rgba(255,255,255,.12);margin:18px auto 10px;overflow:hidden}' +
    '.bar i{display:block;height:100%;width:4%;border-radius:999px;background:linear-gradient(90deg,#7c5cff,#ffcf3d);transition:width .8s ease}' +
    '</style></head><body><div>' + LOGO + '<h1><span style="font-weight:600;opacity:.8">' + t[0] + '</span><br>' + NAME + '</h1>' +
    '<div class="bar"><i></i></div><p id="w"></p></div><script>(function(){' +
    'var t0=Date.now(),bar=document.querySelector(".bar i"),w=document.getElementById("w"),done=false;' +
    'setTimeout(function(){w.textContent=' + JSON.stringify(t[1]) + '},2500);setTimeout(function(){w.textContent=' + JSON.stringify(t[2]) + '},20000);' +
    '(function tick(){if(done)return;bar.style.width=Math.min(95,4+96*(1-Math.exp(-(Date.now()-t0)/22000))).toFixed(1)+"%";setTimeout(tick,500)})();' +
    'function ready(){done=true;bar.style.width="100%";setTimeout(function(){location.reload()},350)}' +
    '(function probe(){fetch("/icons/icon-192.png?awake="+Date.now(),{cache:"no-store"}).then(function(r){if(r.headers.get("X-Safio"))ready();else setTimeout(probe,1500)},function(){setTimeout(probe,2000)})})();' +
    'setTimeout(function(){location.reload()},120000);' +
    '})()</script></body></html>';
}
function splashResponse(req) {
  // Langue : ?lang= dans l'adresse (lien du portail), sinon celle du navigateur ; une langue hors des 5 → anglais
  var q = (new URL(req.url).searchParams.get('lang') || '').slice(0, 2).toLowerCase();
  var lang = TX[q] ? q : ((req.headers.get('Accept-Language') || 'fr').slice(0, 2)).toLowerCase();
  return new Response(splash(TX[lang] ? lang : 'en'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/socket.io') === 0) return;
  if (req.mode === 'navigate') {
    // Page : si le jeu ne répond pas vite, ou si ce n'est pas encore lui qui répond → écran SAFIO.
    e.respondWith(new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () { if (!settled) { settled = true; resolve(splashResponse(req)); } }, 2500);
      fetch(req).then(function (res) {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve(res.headers.get('X-Safio') ? res : splashResponse(req));
      }, function () {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve(splashResponse(req));
      });
    }));
    return;
  }
  if (u.searchParams.has('awake')) return; // sonde de l'écran de chargement : toujours le réseau
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok && res.headers.get('X-Safio')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || Response.error(); });
  }));
});
