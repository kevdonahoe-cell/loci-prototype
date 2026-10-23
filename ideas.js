/* Image ideas "in words" for Memory Castle. Simple local templates: stop name + a couple of key words.
   No server, no AI. The learner picks one, edits it, or ignores it and writes their own. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Ideas = factory();
})(this, function () {
  'use strict';
  var STOP = {};
  ('a an the and or but of to in on at for with by from as is are was were be been being am it its this that these those who whom whose which what when where he she they them his her their you your we our us i me my not no nor so if then than there shall will would should can could may might must do does did have has had into upon unto very all any each every some shown those happy blessed also just like said says say').split(' ').forEach(function (w) { STOP[w] = 1; });

  function keywords(text, max) {
    max = max || 2;
    var seen = {}, list = [];
    String(text || '').split(/\s+/).forEach(function (raw, i) {
      var w = raw.toLowerCase().replace(/^[^a-z0-9\u00c0-\u024f]+|[^a-z0-9\u00c0-\u024f]+$/g, '').replace(/\u2019s$|'s$/, '');
      if (w.length < 4 || STOP[w] || /^\d+$/.test(w)) return;
      var stem = w.slice(0, 4); if (seen[stem]) return; seen[stem] = 1;
      list.push({ w: w, i: i, score: w.length + (list.length === 0 ? 0 : 0) });
    });
    return list.slice().sort(function (a, b) { return b.score - a.score || a.i - b.i; }).slice(0, max).sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.w; });
  }

  function place(stop) {
    var s = String(stop || '').trim().replace(/\s+/g, ' ');
    if (!s) return 'this stop';
    s = s.charAt(0).toLowerCase() + s.slice(1);
    return /^(the|a|an|my|your|our|his|her|their|this|that|some)\b/.test(s) ? s : 'the ' + s;
  }

  // Each template gets: P = place (e.g. "the front gate"), K = key word, L = second key word (or K).
  var T = [
    function (P, K) { return 'The word \u201c' + K + '\u201d is carved in enormous glowing letters across ' + P + '. You cannot miss it.'; },
    function (P, K) { return 'Someone you know well is standing at ' + P + ', acting out \u201c' + K + '\u201d in the most over-the-top way they can.'; },
    function (P, K) { return 'A giant, odd object that reminds you of \u201c' + K + '\u201d is blocking ' + P + ', and you have to climb past it.'; },
    function (P, K, L) { return L !== K ? 'At ' + P + ', \u201c' + K + '\u201d and \u201c' + L + '\u201d crash into each other with a big noise. What happens next?' : 'At ' + P + ', \u201c' + K + '\u201d appears twice as big as a house and starts to move.'; },
    function (P, K) { return 'You are at ' + P + ' and everything around you is about \u201c' + K + '\u201d. What can you see, hear, smell and feel?'; },
    function (P, K) { return 'A tiny version of \u201c' + K + '\u201d is dancing near ' + P + ', and nobody else has noticed.'; },
    function (P, K, L) { return 'Picture ' + P + ' completely changed so that it is made of \u201c' + L + '\u201d. Walk through it slowly.'; }
  ];
  var NO_KEY = [
    function (P) { return 'Something very strange is happening at ' + P + '. Make it big, loud and a bit funny.'; },
    function (P) { return 'A person you know well is at ' + P + ', doing something they would never normally do.'; },
    function (P) { return 'A giant object that does not belong there is blocking ' + P + '. What is it?'; }
  ];

  /* three different ideas for one stop; seed changes which three */
  function ideas(stop, text, seed) {
    var P = place(stop), kw = keywords(text, 2), K = kw[0], L = kw[1] || kw[0], seedN = seed || 0, out = [];
    if (!K) return NO_KEY.map(function (f) { return f(P); });
    // k is derived from the key word so neighbouring stops usually show different styles; seed rotates them
    var base = 0; for (var i = 0; i < K.length; i++) base += K.charCodeAt(i);
    for (var n = 0; n < 3; n++) out.push(T[(base + seedN * 3 + n) % T.length](P, K, L));
    return out;
  }

  return { ideas: ideas, keywords: keywords, place: place };
});
