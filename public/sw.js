// SAFIO – service worker (safio) (application installable).
// Réseau d'abord : on affiche toujours la version en ligne ; la copie locale
// ne sert que si le téléphone est hors connexion.
var CACHE = 'safio-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  var u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/socket.io') === 0) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('/') : Response.error());
    });
  }));
});
