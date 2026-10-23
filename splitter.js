/* Text splitter for Memory Castle. Pure functions, no DOM.
   Goal: propose roughly one idea per castle stop, whatever shape the pasted text has. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Splitter = factory();
})(this, function () {
  'use strict';
  var STOP = {};
  ('a an the and or but of to in on at for with by from as is are was were be been being am it its this that these those who whom whose which what when where he she they them his her their you your we our us i me my not no nor so if then than there shall will would should can could may might must do does did have has had into upon unto very all any each every some').split(' ').forEach(function (w) { STOP[w] = 1; });

  /* size levels: max words per piece before we try to cut it smaller; pack = join neighbours up to this many words */
  var LEVELS = [{ name: 'Smaller', max: 14, pack: 0 }, { name: 'Balanced', max: 30, pack: 0 }, { name: 'Bigger', max: 60, pack: 45 }];
  var MIN_WORDS = 4;

  function wc(s) { s = String(s || '').trim(); return s ? s.split(/\s+/).length : 0; }
  function clean(a) { return a.map(function (s) { return s.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean); }
  function norm(text) {
    return String(text || '').replace(/\r\n?/g, '\n').replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function flat(a) { return a.reduce(function (x, y) { return x.concat(y); }, []); }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }

  /* ---- numbered / verse-numbered text: "1. foo 2. bar", "3 Happy ... 4 Happy ...", "5:3 ..." ---- */
  function numberedUnits(text) {
    var re = /(^|\s)\(?(?:\d{1,3}:)?(\d{1,3})[.):]?[ \t]+(?=[A-Za-z\u201c"\u2018'(])/g, m, c = [];
    while ((m = re.exec(text))) c.push({ pos: m.index + m[1].length, end: m.index + m[0].length, v: parseInt(m[2], 10) });
    if (c.length < 2) return null;
    var best = [];
    for (var i = 0; i < c.length; i++) {
      var chain = [c[i]], last = c[i].v;
      for (var j = i + 1; j < c.length; j++) if (c[j].v === last + 1) { chain.push(c[j]); last = c[j].v; }
      if (chain.length > best.length) best = chain;
    }
    var atLineStart = best.filter(function (x) { return x.pos === 0 || text.charAt(x.pos - 1) === '\n'; }).length;
    if (best.length < 3 && !(best.length === 2 && atLineStart === 2)) return null;
    var out = [], pre = text.slice(0, best[0].pos).trim();
    if (wc(pre) >= 3) out.push(pre);
    best.forEach(function (x, k) { out.push(text.slice(x.end, k + 1 < best.length ? best[k + 1].pos : text.length).trim()); });
    return clean(out);
  }

  /* ---- sentences ---- */
  var ABBR = { mr: 1, mrs: 1, ms: 1, dr: 1, st: 1, vs: 1, cf: 1, fr: 1, ch: 1, no: 1, v: 1, vv: 1, etc: 1, eg: 1, ie: 1 };
  function sentences(text) {
    var t = String(text).replace(/\n+/g, ' ').replace(/([.!?]+["\u201d\u2019')\]]*)(\s+)(?=["\u201c\u2018'(\[]*[A-Z0-9])/g, function (all, p, sp, off, str) {
      var before = str.slice(0, off + 1).match(/([A-Za-z]+)\.?$/);
      if (p === '.' && before && ABBR[before[1].toLowerCase()]) return all;
      return p + '\u0001';
    });
    return clean(t.split('\u0001'));
  }

  /* ---- repeated openers: "Happy are those who ... Happy are those who ..." (works with no punctuation at all) ---- */
  function wordKey(w) { return w.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f']/g, ''); }
  function repetitionSplit(text) {
    var toks = [], re = /\S+/g, m;
    while ((m = re.exec(text))) toks.push({ pos: m.index, k: wordKey(m[0]), raw: m[0] });
    if (toks.length < 12) return null;
    var best = null;
    for (var n = 5; n >= 1; n--) {
      var seen = {};
      for (var i = 0; i + n <= toks.length; i++) {
        var key = toks.slice(i, i + n).map(function (t) { return t.k; }).join(' ');
        if (!key.trim()) continue;
        (seen[key] = seen[key] || []).push(i);
      }
      for (var key2 in seen) {
        var occ = seen[key2];
        if (occ.length < 3) continue;
        var words = key2.split(' ');
        if (STOP[words[0]] || !words.some(function (w) { return w.length >= 4 && !STOP[w]; })) continue;
        var o2 = [occ[0]]; // drop overlapping hits
        for (var q = 1; q < occ.length; q++) if (occ[q] >= o2[o2.length - 1] + n) o2.push(occ[q]);
        if (o2.length < 3) continue;
        var gaps = []; for (var g = 1; g < o2.length; g++) gaps.push(o2[g] - o2[g - 1]);
        var med = median(gaps);
        if (med < 4) continue;
        if (gaps.some(function (x) { return x < med * 0.25 || x > med * 4; })) continue;
        var first = o2[0], prev = first > 0 ? toks[first - 1].raw : '';
        if (!(first <= 3 || first <= med * 0.3 || /[.!?;]["\u201d\u2019')\]]*$/.test(prev))) continue;
        var cand = { occ: o2, n: n };
        if (!best || cand.occ.length > best.occ.length || (cand.occ.length === best.occ.length && cand.n > best.n)) best = cand;
      }
    }
    if (!best) return null;
    var cuts = best.occ.map(function (i) { return toks[i].pos; }), out = [];
    if (cuts[0] > 0) out.push(text.slice(0, cuts[0]));
    cuts.forEach(function (p, k) { out.push(text.slice(p, k + 1 < cuts.length ? cuts[k + 1] : text.length)); });
    out = clean(out);
    if (out[0] && wc(out[0]) < MIN_WORDS && out.length > 1) { out[1] = out[0] + ' ' + out[1]; out.shift(); }
    return out.length > 1 ? out : null;
  }

  /* ---- punctuation clauses ---- */
  function afterMark(text, ch) { return clean(text.split(new RegExp('(?<=' + ch + ')\\s+'))); }
  function evenCuts(parts, max) { // pack small clauses into balanced pieces of <= max words
    var total = parts.reduce(function (a, p) { return a + wc(p); }, 0), k = Math.ceil(total / max), target = total / k, out = [], cur = '';
    parts.forEach(function (p) {
      if (cur && wc(cur) + wc(p) > max || (cur && wc(cur) >= target && out.length < k - 1)) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
    });
    if (cur) out.push(cur);
    return out;
  }
  function byWords(text, max) {
    var w = text.trim().split(/\s+/), k = Math.ceil(w.length / max), per = Math.ceil(w.length / k), out = [];
    for (var i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(' '));
    return out;
  }

  function mergeTiny(parts, max) {
    var out = [];
    parts.forEach(function (p) {
      if (wc(p) < MIN_WORDS && out.length && wc(out[out.length - 1]) + wc(p) <= max * 1.5) out[out.length - 1] += ' ' + p; else out.push(p);
    });
    if (out.length > 1 && wc(out[0]) < MIN_WORDS) { out[1] = out[0] + ' ' + out[1]; out.shift(); }
    return out;
  }

  /* cut one over-long unit into pieces of <= max words, using the most meaningful break available */
  function refine(unit, max, noRep) {
    if (wc(unit) <= max) return [unit];
    var parts = sentences(unit);
    if (parts.length > 1) return mergeTiny(flat(parts.map(function (p) { return refine(p, max, noRep); })), max);
    if (!noRep && (parts = repetitionSplit(unit))) return mergeTiny(flat(parts.map(function (p) { return refine(p, max, true); })), max);
    parts = afterMark(unit, ';');
    if (parts.length > 1) return mergeTiny(flat(parts.map(function (p) { return refine(p, max, noRep); })), max);
    parts = afterMark(unit, ':');
    if (parts.length > 1) return mergeTiny(flat(parts.map(function (p) { return refine(p, max, noRep); })), max);
    parts = afterMark(unit, '[,\u2014\u2013]');
    if (parts.length > 1) return flat(evenCuts(parts, max).map(function (p) { return wc(p) > max ? byWords(p, max) : [p]; }));
    return byWords(unit, max);
  }

  /* ---- paragraphs and lines ---- */
  function lineUnits(block) {
    var lines = clean(block.split('\n'));
    if (lines.length < 2) return lines;
    var term = lines.filter(function (l) { return /[.!?;:]["\u201d\u2019')\]]*$/.test(l); }).length / lines.length;
    var lower = 0, breaks = 0;
    for (var i = 1; i < lines.length; i++) { breaks++; if (/^[a-z]/.test(lines[i])) lower++; }
    var wrapped = (breaks && lower / breaks >= 0.5) || (median(lines.map(function (l) { return l.length; })) >= 45 && term < 0.4);
    return wrapped ? [lines.join(' ')] : lines;
  }

  function pack(parts, limit) {
    var out = [];
    parts.forEach(function (p) {
      if (out.length && wc(out[out.length - 1]) + wc(p) <= limit) out[out.length - 1] += '\n' + p; else out.push(p);
    });
    return out;
  }

  /* mode: auto | blank | line | sentence.  level: 0 smaller, 1 balanced, 2 bigger. */
  function split(text, opts) {
    opts = opts || {}; var mode = opts.mode || 'auto', lv = LEVELS[opts.level == null ? 1 : opts.level] || LEVELS[1];
    text = norm(text); if (!text) return [];
    if (mode === 'blank') return clean(text.split(/\n\s*\n/));
    if (mode === 'line') return clean(text.split('\n'));
    if (mode === 'sentence') return sentences(text);
    var units = numberedUnits(text);
    if (!units) units = flat(clean(text.split(/\n\s*\n/)).map(lineUnits));
    var parts = flat(units.map(function (u) { return refine(u, lv.max); }));
    parts = mergeTiny(parts, lv.max);
    if (parts.length < 3 && lv.max > LEVELS[0].max && wc(text) >= 12) { // a castle of 1-2 stops is pointless: try harder
      var smaller = mergeTiny(flat(units.map(function (u) { return refine(u, LEVELS[0].max); })), LEVELS[0].max);
      if (smaller.length > parts.length) parts = smaller;
    }
    if (lv.pack) parts = pack(parts, lv.pack);
    return parts;
  }

  /* split one existing piece into two or more smaller ones (the "Break into smaller pieces" button) */
  function splitPiece(text) {
    var n = wc(text); if (n < 2) return [String(text).trim()];
    var r = refine(String(text).trim(), Math.max(MIN_WORDS, Math.min(14, Math.ceil(n / 2))));
    return r.length > 1 ? r : byWords(String(text).trim(), Math.ceil(n / 2));
  }

  return { split: split, splitPiece: splitPiece, wordCount: wc, LEVELS: LEVELS };
});
