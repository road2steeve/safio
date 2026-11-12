// SAFIO – passage à la nouvelle adresse (quiz.playsafio.com).
// Sur l'ancienne adresse de l'hébergeur, on part vers la nouvelle en emportant
// ce que le navigateur avait gardé (pseudo, progression, réglages…), pour que rien ne se perde.
// Sur la nouvelle adresse, on récupère ces données sans écraser ce qui existe déjà.
(function () {
  "use strict";
  var OLD = "safio-hjov.onrender.com", NEW = "quiz.playsafio.com", TAG = "#safio-move=";
  var ls; try { ls = window.localStorage; } catch (e) { ls = null; }
  if (location.hostname === OLD) {
    var url = "https://" + NEW + location.pathname + location.search, h = location.hash;
    if (!h && ls) {
      try {
        var data = {};
        for (var i = 0; i < ls.length; i++) { var k = ls.key(i); data[k] = ls.getItem(k); }
        if (ls.length) h = TAG + encodeURIComponent(JSON.stringify(data));
      } catch (e) { /* on part sans les données */ }
    }
    location.replace(url + h);
    return;
  }
  if (location.hash.indexOf(TAG) === 0) {
    try {
      var got = JSON.parse(decodeURIComponent(location.hash.slice(TAG.length)));
      if (ls && got && typeof got === "object") {
        Object.keys(got).forEach(function (k) {
          if (ls.getItem(k) === null && typeof got[k] === "string") ls.setItem(k, got[k]);
        });
      }
    } catch (e) { /* données illisibles : on les ignore */ }
    history.replaceState(null, "", location.pathname + location.search);
  }
})();
