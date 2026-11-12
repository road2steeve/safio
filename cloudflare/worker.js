// SAFIO Quiz – Cloudflare Worker « écran de chargement » (route : quiz.playsafio.com/*).
// Gratuit (offre Workers Free). Le jeu est hébergé sur l'offre gratuite de Render, qui l'endort
// après 15 minutes sans visite. Ce Worker répond tout de suite, même à la toute première visite :
// si le jeu ne répond pas en 2,5 s, ou si ce n'est pas encore lui (en-tête X-Safio absent),
// il affiche l'écran SAFIO (logo + barre qui avance), qui recharge la page dès que le jeu est prêt.
// Tout le reste (images, scripts, connexion temps réel) passe directement au jeu.
var LOGO = "<svg class=\"logo\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">  <rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#ffcf3d\"/>  <rect x=\"17\" y=\"9\" width=\"30\" height=\"46\" rx=\"7\" fill=\"#17112e\"/>  <rect x=\"27\" y=\"13\" width=\"10\" height=\"2.5\" rx=\"1.25\" fill=\"#3a2e6b\"/>  <rect x=\"21\" y=\"30\" width=\"11\" height=\"3.6\" rx=\"1.4\" fill=\"#2fd6c1\"/>  <rect x=\"24.7\" y=\"26.2\" width=\"3.6\" height=\"11\" rx=\"1.4\" fill=\"#2fd6c1\"/>  <circle cx=\"39\" cy=\"28.5\" r=\"2.6\" fill=\"#ff5c8a\"/>  <circle cx=\"39\" cy=\"36\" r=\"2.6\" fill=\"#ffcf3d\"/>  <rect x=\"27\" y=\"46\" width=\"10\" height=\"3\" rx=\"1.5\" fill=\"#3a2e6b\"/></svg>";
var NAME = 'SAFIO Quiz';

var TX = {
  fr: ['Ouverture de', 'Le jeu se réveille, encore quelques secondes…', 'Presque prêt ! Le premier lancement peut prendre jusqu’à une minute.'],
  en: ['Opening', 'The game is waking up, just a few more seconds…', 'Almost ready! The first launch can take up to a minute.'],
  es: ['Abriendo', 'El juego se está despertando, unos segundos más…', '¡Casi listo! El primer arranque puede tardar hasta un minuto.'],
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
  var lang = ((req.headers.get('Accept-Language') || 'fr').slice(0, 2)).toLowerCase();
  return new Response(splash(TX[lang] ? lang : 'fr'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(req) {
    var u = new URL(req.url);
    var isPage = req.method === 'GET' && (req.headers.get('Accept') || '').indexOf('text/html') !== -1 &&
      u.pathname.indexOf('/socket.io') !== 0 && !u.searchParams.has('awake') && !req.headers.get('Upgrade');
    if (!isPage) return fetch(req);
    var timeout = new Promise(function (r) { setTimeout(function () { r(null); }, 2500); });
    var res = await Promise.race([fetch(req).catch(function () { return null; }), timeout]);
    if (res && res.headers.get('X-Safio')) return res;
    return splashResponse(req);
  },
};
