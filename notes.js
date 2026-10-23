/* Session notes for Memory Castle: what the user marked as confusing and which screens they used.
   Never includes the user's text, images, stop names or route names. Pure functions, no DOM. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Notes = factory();
})(this, function () {
  'use strict';
  var MAX_TRAIL = 600, MAX_NOTES = 200, MAX_TEXT = 300;

  function empty() { return { notes: [], trail: [] }; }
  function sane(d) {
    d = d && typeof d === 'object' ? d : {};
    return { notes: Array.isArray(d.notes) ? d.notes.slice(-MAX_NOTES) : [], trail: Array.isArray(d.trail) ? d.trail.slice(-MAX_TRAIL) : [] };
  }
  function addNote(d, screen, text, now) {
    d.notes.push({ t: new Date(now || Date.now()).toISOString(), screen: String(screen || 'unknown'), text: String(text || '').trim().slice(0, MAX_TEXT) });
    if (d.notes.length > MAX_NOTES) d.notes.shift();
  }
  // kind 'screen' (arrived on a screen) or 'event' (a button such as "joined two pieces"); detail must be short and free of user text
  function addTrail(d, kind, name, detail, now) {
    d.trail.push({ t: new Date(now || Date.now()).toISOString(), kind: kind, name: String(name), detail: detail == null ? undefined : String(detail).slice(0, 80) });
    if (d.trail.length > MAX_TRAIL) d.trail.shift();
  }

  /* the exact thing that would be shared */
  function build(d, extra, now) {
    var trail = d.trail.map(function (e, i) {
      var nxt = d.trail[i + 1], secs = nxt ? Math.round((Date.parse(nxt.t) - Date.parse(e.t)) / 1000) : null;
      var o = { t: e.t, kind: e.kind, name: e.name };
      if (e.detail !== undefined) o.detail = e.detail;
      if (e.kind === 'screen' && secs != null && secs >= 0 && secs < 3600) o.secondsHere = secs;
      return o;
    });
    return {
      app: 'memory-castle', kind: 'session-notes', version: 1, exportedAt: new Date(now || Date.now()).toISOString(),
      about: 'Contains only the notes you chose to write and which screens you used. It does not contain your text, images, stop names or route names.',
      device: extra || {},
      notes: d.notes.map(function (n) { return { t: n.t, screen: n.screen, text: n.text }; }),
      trail: trail
    };
  }

  function asText(x) {
    var L = ['Memory Castle session notes', 'Exported ' + x.exportedAt, ''];
    if (x.device && x.device.viewport) L.push('Screen: ' + x.device.viewport + (x.device.homeScreenApp ? ' (home screen app)' : ' (browser)'), '');
    L.push('NOTES (' + x.notes.length + ')');
    if (!x.notes.length) L.push('  none');
    x.notes.forEach(function (n) { L.push('  ' + n.t + '  [' + n.screen + ']  ' + (n.text || '(no text)')); });
    L.push('', 'SCREENS AND ACTIONS (' + x.trail.length + ')');
    x.trail.forEach(function (e) { L.push('  ' + e.t + '  ' + (e.kind === 'event' ? '* ' : '') + e.name + (e.detail ? ' (' + e.detail + ')' : '') + (e.secondsHere != null ? '  ' + e.secondsHere + 's' : '')); });
    return L.join('\n');
  }

  return { empty: empty, sane: sane, addNote: addNote, addTrail: addTrail, build: build, asText: asText, MAX_TEXT: MAX_TEXT };
});
