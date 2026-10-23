/* Spaced-repetition "ladder" for Memory Castle. Pure functions, no DOM. */
(function (root) {
  var LADDER = [1, 3, 7, 14, 30, 60, 120]; // days
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function addDays(str, n) {
    var p = str.split('-').map(Number);
    return dateStr(new Date(p[0], p[1] - 1, p[2] + n));
  }
  function newSr() { return { level: -1, due: null, interval: 0, lapses: 0, reviews: 0, last: null }; }
  // A chunk is due if it has never been scheduled, or its date has arrived.
  function isDue(sr, t) { return !sr || !sr.due || sr.due <= (t || today()); }
  function isEarly(sr, t) { return !!(sr && sr.due && sr.due > (t || today())); }
  // Returns the next schedule for a rating. rating: missed | hard | good | easy
  function next(sr, rating, t) {
    t = t || today();
    sr = sr || newSr();
    var level = typeof sr.level === 'number' ? sr.level : -1;
    var top = LADDER.length - 1, nl, interval, lapses = sr.lapses || 0;
    if (rating === 'missed') { nl = 0; interval = 1; lapses++; }
    else if (rating === 'hard') { nl = Math.max(level, 0); interval = Math.max(1, Math.round(LADDER[nl] * 0.6)); }
    else if (rating === 'easy') { nl = Math.min(level + 2, top); interval = LADDER[nl]; }
    else { nl = Math.min(level + 1, top); interval = LADDER[nl]; } // good
    return { level: nl, due: addDays(t, interval), interval: interval, lapses: lapses, reviews: (sr.reviews || 0) + 1, last: t };
  }
  // Practising a chunk BEFORE it is due only changes the schedule if you missed it.
  function apply(sr, rating, t) {
    t = t || today();
    if (isEarly(sr, t) && rating !== 'missed') return sr;
    return next(sr, rating, t);
  }
  function label(days) {
    if (days === 1) return 'tomorrow';
    if (days < 14) return 'in ' + days + ' days';
    if (days < 60) return 'in ' + Math.round(days / 7) + ' weeks';
    return 'in ' + Math.round(days / 30) + ' months';
  }
  var api = { LADDER: LADDER, today: today, addDays: addDays, newSr: newSr, isDue: isDue, isEarly: isEarly, next: next, apply: apply, label: label };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SR = api;
})(typeof self !== 'undefined' ? self : this);
