/* Memory Castle prototype - vanilla JS, data stays in this browser (localStorage). */
(function () {
  'use strict';
  var KEY = 'memoryCastle.v1';
  var app = document.getElementById('app'), back = document.getElementById('back'),
      bartitle = document.getElementById('bartitle'), toastEl = document.getElementById('toast');

  /* ---------- data ---------- */
  var S = load();
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.castles) { d.prefs = d.prefs || {}; return d; } } catch (e) {}
    return { castles: [], prefs: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Sorry, I could not save on this phone.'); } }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function castle(id) { for (var i = 0; i < S.castles.length; i++) if (S.castles[i].id === id) return S.castles[i]; return null; }
  function chunk(c, id) { for (var i = 0; i < c.chunks.length; i++) if (c.chunks[i].id === id) return c.chunks[i]; return null; }
  function mkChunk(text) { return { id: uid(), text: text || '', stop: '', image: '', sr: SR.newSr() }; }
  function dueCount(c) {
    if (!c.built) return 0; var t = SR.today(), n = 0;
    c.chunks.forEach(function (k) { if (SR.isDue(k.sr, t)) n++; }); return n;
  }
  function totalDue() { return S.castles.reduce(function (a, c) { return a + dueCount(c); }, 0); }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  var toastTimer;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- splitting text into chunks ---------- */
  function splitText(text, mode) {
    text = String(text || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return [];
    var clean = function (a) { return a.map(function (s) { return s.trim(); }).filter(Boolean); };
    var blocks = clean(text.split(/\n\s*\n/)), lines = clean(text.split('\n')),
        sentences = clean(text.replace(/\n+/g, ' ').match(/[^.!?]+[.!?]+["')\]\u201d]*|[^.!?]+$/g) || [text]);
    if (mode === 'blank') return blocks;
    if (mode === 'line') return lines;
    if (mode === 'sentence') return sentences;
    if (blocks.length > 1) return blocks;
    if (lines.length > 1) return lines;
    return sentences;
  }

  var BEATITUDES = ['Poor in spirit', 'Gentle', 'Those who mourn', 'Hunger and thirst for what is right', 'Merciful', 'Pure in heart', 'Peacemakers', 'Persecuted for the cause of right'];
  var HOUSE_STOPS = ['Front gate', 'Letterbox', 'Front door', 'Hallway', 'Lounge room', 'Kitchen', 'Dining table', 'Bedroom', 'Bathroom', 'Back verandah', 'Backyard', 'Garage', 'Clothesline'];
  var WALK_STOPS = ['Front gate', 'End of the street', 'Bus stop', 'Corner shop', 'Park bench', 'Traffic lights', 'Bridge or crossing', 'Church doors', 'Office entrance', 'Lift or stairs', 'Your desk'];
  var NUDGES = ['Make it odd. Strange pictures stick better than sensible ones.', 'Make it big. Giants, mountains, enormous or tiny.', 'Make it move. Something crashing, dancing, pouring, climbing.', 'Make it funny. If it makes you smile, you will remember it.', 'Use your senses. What can you smell, hear, taste or feel there?', 'Put yourself in the picture. What are you doing? How do you feel?'];

  /* ---------- router ---------- */
  var ui = { session: null, reveal: false, nudge: false, ideas: '', mode: 'auto' };
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function route() { var p = (location.hash || '#/home').replace(/^#\/?/, '').split('/'); return { name: p[0] || 'home', id: p[1], n: parseInt(p[2], 10) || 0 }; }
  function parentOf(r) {
    var c = castle(r.id);
    switch (r.name) {
      case 'new': case 'backup': case 'castle': return '#/home';
      case 'edit': return c && c.built ? '#/castle/' + c.id : '#/home';
      case 'stops': return c ? '#/edit/' + c.id : '#/home';
      case 'images': return c && c.built ? '#/castle/' + c.id : (c ? '#/stops/' + c.id : '#/home');
      case 'walk': return c ? '#/castle/' + c.id : '#/home';
      case 'recall': return ui.session ? ui.session.back : '#/home';
    }
    return '#/home';
  }
  back.addEventListener('click', function () { go(parentOf(route())); });
  window.addEventListener('hashchange', render);

  function render() {
    var r = route(), c = castle(r.id), html = '', title = 'Memory Castle';
    window.scrollTo(0, 0);
    back.hidden = r.name === 'home';
    if (r.name !== 'home' && r.name !== 'new' && r.name !== 'backup' && r.name !== 'recall' && !c) { go('#/home'); return; }
    switch (r.name) {
      case 'new': title = 'New castle'; html = vNew(); break;
      case 'backup': title = 'Back up'; html = vBackup(); break;
      case 'edit': title = 'Step 1: the text'; html = vEdit(c); break;
      case 'stops': title = 'Step 2: your route'; html = vStops(c); break;
      case 'images': title = 'Step 3: your images'; html = vImages(c, r.n); break;
      case 'castle': title = c.title; html = vCastle(c); break;
      case 'walk': title = 'Walk through'; html = vWalk(c, r.n); break;
      case 'recall': if (!ui.session) { go('#/home'); return; } title = ui.session.label; html = vRecall(); break;
      default: html = vHome();
    }
    bartitle.textContent = title;
    app.innerHTML = html;
  }

  /* ---------- views ---------- */
  function vHome() {
    var due = totalDue(), h = '';
    if (!S.castles.length) {
      h += '<h2>Welcome</h2><div class="card"><p>A memory castle helps you keep words in your head by hanging each piece on a place you already know well, like your own home or your walk to work.</p>' +
        '<p>You choose the place and you make the pictures. I will guide you and bring each piece back at just the right time.</p>' +
        '<p class="soft small">Everything stays on this phone. There are no accounts and nothing is sent anywhere.</p></div>';
    } else {
      h += '<h2>Today</h2>';
      if (due) h += '<div class="card gold"><div class="big">' + due + '</div><p>' + (due === 1 ? 'piece is' : 'pieces are') + ' ready to practise today.</p><button class="btn warm" data-act="practiseDue">Start today\u2019s practice</button></div>';
      else h += '<div class="card"><p>\u2705 Nothing is due today. Lovely. You can still walk through a castle or practise any time.</p></div>';
      h += '<h2>Your castles</h2>';
      S.castles.forEach(function (c) {
        var d = dueCount(c);
        h += '<div class="card" data-act="openCastle" data-id="' + c.id + '" role="button" tabindex="0" style="cursor:pointer"><h3>' + esc(c.title) + '</h3><div class="soft small">' + plural(c.chunks.length, 'piece', 'pieces') + (c.route ? ' \u00b7 ' + esc(c.route) : '') + '</div><div style="margin-top:8px">' +
          (c.built ? (d ? '<span class="badge">' + d + ' due today</span>' : '<span class="badge ok">Up to date</span>') : '<span class="badge">Still setting up</span>') + '</div></div>';
      });
    }
    h += '<button class="btn primary" data-act="goNew">+ Build a new castle</button>';
    h += '<button class="btn" data-act="goBackup">Back up or restore my castles</button>';
    if (!S.prefs.hideInstall) h += '<div class="card"><h3>Keep it on your home screen</h3><p class="small">On iPhone: tap the Share button, then \u201cAdd to Home Screen\u201d. On Android: open the browser menu and choose \u201cInstall app\u201d or \u201cAdd to Home screen\u201d.</p><button class="btn small" data-act="hideInstall">Got it</button></div>';
    h += '<p class="soft small" style="text-align:center">Prototype \u00b7 your castles are saved only on this phone</p>';
    return h;
  }

  function vNew() {
    var modes = [['auto', 'Automatically'], ['blank', 'Blank lines'], ['line', 'Each line'], ['sentence', 'Each sentence']];
    return '<h2>What would you like to remember?</h2><p class="soft">Paste your own copy of the text. I will break it into small pieces, and you can adjust them next.</p>' +
      '<label for="paste">Your text</label><textarea id="paste" style="min-height:200px" placeholder="Paste or type here\u2026"></textarea>' +
      '<label>Break it up by</label><div class="chips" id="modes">' + modes.map(function (m) { return '<button class="chip' + (ui.mode === m[0] ? ' on' : '') + '" data-act="mode" data-v="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>' +
      '<button class="btn primary" data-act="split" style="margin-top:12px">Break it into pieces</button>' +
      '<div class="card gold" style="margin-top:18px"><h3>Just want to look around?</h3><p class="small">Try the Beatitudes example. It starts with eight short reminder titles only. The Bible text is under copyright, so this app does not include it. You paste in your own copy.</p><button class="btn warm" data-act="example">Try the Beatitudes example</button></div>';
  }

  function vEdit(c) {
    var h = '<h2>Check the pieces</h2><p class="soft">Each piece gets its own place in your castle. Keep each one small enough to picture. You can edit, join, split or reorder.</p>';
    if (c.example) h += '<div class="card gold small"><b>About this example.</b> These are only short reminder titles, not the Bible text (it is under copyright). To remember the actual words, paste your own copy into each piece.</div>';
    h += '<label for="ctitle">Name of this castle</label><input type="text" id="ctitle" value="' + esc(c.title) + '" data-cfield="title">';
    c.chunks.forEach(function (k, i) {
      h += '<div class="card" style="margin-top:14px"><div class="cardhead"><span class="num">' + (i + 1) + '</span><span class="t soft small">Piece ' + (i + 1) + ' of ' + c.chunks.length + '</span></div>' +
        '<textarea data-field="text" data-cid="' + k.id + '" aria-label="Piece ' + (i + 1) + '">' + esc(k.text) + '</textarea><div class="ops">' +
        '<button class="btn small" data-act="up" data-cid="' + k.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">\u2191 Up</button>' +
        '<button class="btn small" data-act="down" data-cid="' + k.id + '"' + (i === c.chunks.length - 1 ? ' disabled' : '') + ' aria-label="Move down">\u2193 Down</button>' +
        '<button class="btn small" data-act="join" data-cid="' + k.id + '"' + (i === c.chunks.length - 1 ? ' disabled' : '') + '>Join with next</button>' +
        '<button class="btn small" data-act="splitAt" data-cid="' + k.id + '">Split at cursor</button>' +
        '<button class="btn small danger" data-act="remove" data-cid="' + k.id + '">Remove</button></div></div>';
    });
    h += '<button class="btn" data-act="addChunk">+ Add a piece</button><div style="height:70px"></div>' +
      '<div class="sticky"><button class="btn primary" data-act="toStops">Next: choose your route</button></div>';
    return h;
  }

  function vStops(c) {
    var h = '<h2>Choose a place you know well</h2><p class="soft">Think of a route you could walk with your eyes closed: your home, your street, your walk to work or to church.</p>' +
      '<label for="route">Name of your place or route</label><input type="text" id="route" data-cfield="route" value="' + esc(c.route) + '" placeholder="e.g. My childhood home">' +
      '<label>Name one stop for each piece, in the order you would walk</label>' +
      '<div class="chips"><button class="chip' + (ui.ideas === 'house' ? ' on' : '') + '" data-act="ideas" data-v="house">Ideas: a house</button><button class="chip' + (ui.ideas === 'walk' ? ' on' : '') + '" data-act="ideas" data-v="walk">Ideas: a walk</button></div>';
    if (ui.ideas) {
      var used = c.chunks.map(function (k) { return k.stop.toLowerCase(); });
      var list = (ui.ideas === 'house' ? HOUSE_STOPS : WALK_STOPS).filter(function (s) { return used.indexOf(s.toLowerCase()) < 0; });
      h += '<p class="small soft">Tap an idea to use it for the next empty stop, or ignore these and type your own.</p><div class="chips">' + list.map(function (s) { return '<button class="chip" data-act="idea" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    }
    c.chunks.forEach(function (k, i) {
      h += '<div class="card"><div class="cardhead"><span class="num">' + (i + 1) + '</span><span class="t">' + esc(short(k.text, 60)) + '</span></div>' +
        '<input type="text" data-field="stop" data-cid="' + k.id + '" value="' + esc(k.stop) + '" placeholder="Stop ' + (i + 1) + ' along your route" aria-label="Stop for piece ' + (i + 1) + '"></div>';
    });
    h += '<div style="height:70px"></div><div class="sticky"><button class="btn primary" data-act="toImages">Next: make your images</button></div>';
    return h;
  }

  function vImages(c, n) {
    var i = Math.min(Math.max(n, 0), c.chunks.length - 1), k = c.chunks[i], last = i === c.chunks.length - 1;
    var h = '<div class="progress"><i style="width:' + Math.round((i + 1) / c.chunks.length * 100) + '%"></i></div><p class="soft small">Stop ' + (i + 1) + ' of ' + c.chunks.length + '</p>' +
      '<div class="stop">' + esc(k.stop || 'Stop ' + (i + 1)) + '</div>' +
      '<div class="card"><div class="small soft">Remember this</div><div style="font-family:Georgia,serif;font-size:20px;white-space:pre-wrap">' + esc(short(k.text, 300)) + '</div></div>' +
      '<label for="img">Picture it at this stop. What do you see?</label>' +
      '<textarea id="img" data-field="image" data-cid="' + k.id + '" placeholder="Write the picture in your own words\u2026">' + esc(k.image) + '</textarea>' +
      '<button class="btn small" data-act="nudge" style="margin-top:8px">' + (ui.nudge ? 'Hide the nudges' : 'Need a nudge?') + '</button>';
    if (ui.nudge) h += '<div class="card gold small"><p><b>Ideas to spark your picture</b> (you are the artist, these are only hints):</p><ul style="margin:0;padding-left:20px">' + NUDGES.map(function (t) { return '<li style="margin-bottom:6px">' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    h += '<div style="height:80px"></div><div class="sticky"><div class="row" style="max-width:640px;margin:0 auto">' +
      '<button class="btn" data-act="imgPrev" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' style="margin:0">Back</button>' +
      '<button class="btn primary" data-act="imgNext" data-i="' + i + '" style="margin:0">' + (last ? 'Finish my castle' : 'Next stop') + '</button></div></div>';
    return h;
  }

  function vCastle(c) {
    var d = dueCount(c), n = c.chunks.length;
    var h = '<h2>' + esc(c.title) + '</h2><p class="soft">' + plural(n, 'stop', 'stops') + (c.route ? ' along \u201c' + esc(c.route) + '\u201d' : '') + '</p>';
    if (!c.built) {
      return h + '<div class="card gold"><p>This castle is still being set up.</p><button class="btn warm" data-act="resume" data-id="' + c.id + '">Carry on setting up</button></div>' +
        '<button class="btn danger" data-act="del" data-id="' + c.id + '">Delete this castle</button>';
    }
    h += '<div class="card ' + (d ? 'gold' : '') + '"><p>' + (d ? '<b>' + plural(d, 'piece is', 'pieces are') + '</b> due today.' : 'Nothing due today. \u2705') + '</p>' +
      (d ? '<button class="btn warm" data-act="practiseCastleDue" data-id="' + c.id + '">Practise what is due</button>' : '') + '</div>' +
      '<button class="btn primary" data-act="walk" data-id="' + c.id + '">Walk through my castle</button>' +
      '<h3 style="margin-top:18px">Practise recall</h3><p class="small soft">You see the stop and your image, then try to remember the words.</p>' +
      '<button class="btn" data-act="practice" data-v="fwd" data-id="' + c.id + '">In order (first to last)</button>' +
      '<button class="btn" data-act="practice" data-v="back" data-id="' + c.id + '">Backwards (last to first)</button>' +
      '<button class="btn" data-act="practice" data-v="rand" data-id="' + c.id + '">Random stops</button>' +
      '<h3 style="margin-top:18px">Change things</h3>' +
      '<button class="btn" data-act="goEdit" data-id="' + c.id + '">Edit the text and pieces</button>' +
      '<button class="btn" data-act="goStops" data-id="' + c.id + '">Edit my route and stops</button>' +
      '<button class="btn" data-act="goImages" data-id="' + c.id + '">Edit my images</button>' +
      '<button class="btn danger" data-act="del" data-id="' + c.id + '">Delete this castle</button>';
    return h;
  }

  function vWalk(c, n) {
    var i = Math.min(Math.max(n, 0), c.chunks.length - 1), k = c.chunks[i], last = i === c.chunks.length - 1;
    return '<div class="progress"><i style="width:' + Math.round((i + 1) / c.chunks.length * 100) + '%"></i></div><p class="soft small">Stop ' + (i + 1) + ' of ' + c.chunks.length + '</p>' +
      '<div class="stop">' + esc(k.stop || 'Stop ' + (i + 1)) + '</div>' +
      (k.image ? '<div class="image">' + esc(k.image) + '</div>' : '<div class="card soft">You have not made an image for this stop yet.</div>') +
      '<p class="soft small">Take a moment. See it in your mind.</p>' +
      (ui.reveal ? '<div class="reveal">' + esc(k.text) + '</div>' : '<button class="btn warm" data-act="reveal">Tap to show the words</button>') +
      '<div style="height:80px"></div><div class="sticky"><div class="row" style="max-width:640px;margin:0 auto">' +
      '<button class="btn" data-act="walkPrev" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' style="margin:0">Back</button>' +
      '<button class="btn primary" data-act="walkNext" data-i="' + i + '" style="margin:0">' + (last ? 'Finish' : 'Next stop') + '</button></div></div>';
  }

  /* ---------- recall ---------- */
  function startSession(items, label, backTo) {
    if (!items.length) { toast('There is nothing to practise here yet.'); return; }
    ui.session = { items: items, i: 0, shown: false, label: label, back: backTo, tally: { missed: 0, hard: 0, good: 0, easy: 0 }, done: false };
    go('#/recall');
  }
  function castleItems(c) { return c.chunks.map(function (k) { return { cid: c.id, kid: k.id }; }); }

  function vRecall() {
    var s = ui.session;
    if (s.done) {
      var t = s.tally, total = t.missed + t.hard + t.good + t.easy;
      return '<h2>Well done \ud83c\udf89</h2><div class="card"><p>You practised ' + plural(total, 'piece', 'pieces') + '.</p><p class="small">Missed: ' + t.missed + ' \u00b7 Hard: ' + t.hard + ' \u00b7 Good: ' + t.good + ' \u00b7 Easy: ' + t.easy + '</p>' +
        '<p class="small soft">The ones you found harder will come back sooner. Short, regular practice works better than long sessions.</p></div>' +
        '<button class="btn primary" data-act="goHome">Back to home</button>' + (s.back !== '#/home' ? '<button class="btn" data-act="goBackSession">Back to my castle</button>' : '');
    }
    var it = s.items[s.i], c = castle(it.cid), k = c && chunk(c, it.kid);
    if (!k) { s.i++; if (s.i >= s.items.length) s.done = true; return vRecall(); }
    var h = '<div class="progress"><i style="width:' + Math.round(s.i / s.items.length * 100) + '%"></i></div><p class="soft small">' + (s.i + 1) + ' of ' + s.items.length + ' \u00b7 ' + esc(c.title) + '</p>' +
      '<div class="stop">' + esc(k.stop || 'A stop') + '</div>' +
      (k.image ? '<div class="image">' + esc(k.image) + '</div>' : '<div class="card soft small">No image written for this stop.</div>');
    if (!s.shown) return h + '<p>What words go with this place? Say them out loud or in your head, then check.</p><button class="btn warm" data-act="show">Show me the words</button>';
    var now = SR.today(), early = SR.isEarly(k.sr, now);
    h += '<div class="reveal">' + esc(k.text) + '</div><p><b>How did you go?</b></p>' + (early ? '<p class="small soft">Not due yet, so this is just practice. Only \u201cMissed\u201d will change your schedule.</p>' : '') + '<div class="rate">';
    [['missed', 'Missed it', 'm'], ['hard', 'Hard', 'h'], ['good', 'Good', 'g'], ['easy', 'Easy', 'e']].forEach(function (r) {
      var nx = SR.apply(k.sr, r[0], now), hint = early && r[0] !== 'missed' ? 'no change' : SR.label(nx.interval);
      h += '<button class="btn ' + r[2] + '" data-act="rate" data-v="' + r[0] + '">' + r[1] + '<small>' + hint + '</small></button>';
    });
    return h + '</div>';
  }

  /* ---------- backup ---------- */
  function vBackup() {
    return '<h2>Back up or restore</h2><p class="soft">Your castles live only on this phone. A backup file lets you keep a copy safe or move to a new phone.</p>' +
      '<div class="card"><h3>Save a backup</h3><p class="small">Creates a file with all your castles. Keep it somewhere safe, like your Files app or email it to yourself.</p><button class="btn primary" data-act="export">Save a backup file</button></div>' +
      '<div class="card"><h3>Restore from a backup</h3><p class="small">Choose a backup file you saved earlier. Castles in the file are added; if one is already here, the backup version replaces it.</p>' +
      '<input type="file" id="file" accept="application/json,.json" class="hide"><button class="btn" data-act="pickFile">Choose a backup file</button></div>';
  }
  function exportData() {
    var blob = new Blob([JSON.stringify({ app: 'memory-castle', version: 1, exportedAt: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'memory-castle-backup-' + SR.today() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Backup saved to your downloads.');
  }
  function importData(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { toast('That file does not look like a Memory Castle backup.'); return; }
    var data = d && d.app === 'memory-castle' && d.data ? d.data : null;
    if (!data || !Array.isArray(data.castles)) { toast('That file does not look like a Memory Castle backup.'); return; }
    var added = 0;
    data.castles.forEach(function (ic) {
      if (!ic || !ic.id || !Array.isArray(ic.chunks)) return;
      ic.title = ic.title || 'My castle'; ic.route = ic.route || '';
      ic.chunks.forEach(function (k) { k.id = k.id || uid(); k.sr = k.sr || SR.newSr(); k.text = k.text || ''; k.stop = k.stop || ''; k.image = k.image || ''; });
      var ex = castle(ic.id); if (ex) S.castles[S.castles.indexOf(ex)] = ic; else S.castles.push(ic); added++;
    });
    save(); toast('Restored ' + plural(added, 'castle', 'castles') + '.'); go('#/home'); render();
  }

  /* ---------- actions ---------- */
  var actions = {
    goNew: function () { go('#/new'); }, goBackup: function () { go('#/backup'); }, goHome: function () { go('#/home'); },
    goBackSession: function () { go(ui.session ? ui.session.back : '#/home'); },
    hideInstall: function () { S.prefs.hideInstall = true; save(); render(); },
    mode: function (el) { ui.mode = el.dataset.v; var v = document.getElementById('paste').value; render(); document.getElementById('paste').value = v; },
    split: function () {
      var text = document.getElementById('paste').value, parts = splitText(text, ui.mode);
      if (!parts.length) { toast('Please paste or type some text first.'); return; }
      var c = { id: uid(), title: short(parts[0], 28) || 'My castle', route: '', chunks: parts.map(mkChunk), built: false, created: Date.now() };
      S.castles.push(c); save(); go('#/edit/' + c.id);
    },
    example: function () {
      var c = { id: uid(), title: 'The Beatitudes', route: '', example: true, chunks: BEATITUDES.map(mkChunk), built: false, created: Date.now() };
      S.castles.push(c); save(); go('#/edit/' + c.id);
    },
    openCastle: function (el) { go('#/castle/' + el.dataset.id); },
    resume: function (el) { go(stepRoute(castle(el.dataset.id))); },
    del: function (el) { var c = castle(el.dataset.id); confirmBox('Delete \u201c' + c.title + '\u201d?', 'This cannot be undone unless you have a backup.', 'Yes, delete it', function () { S.castles.splice(S.castles.indexOf(c), 1); save(); go('#/home'); }); },
    goEdit: function (el) { go('#/edit/' + el.dataset.id); }, goStops: function (el) { go('#/stops/' + el.dataset.id); }, goImages: function (el) { ui.nudge = false; go('#/images/' + el.dataset.id + '/0'); },
    /* chunk editing */
    up: function (el) { moveChunk(el.dataset.cid, -1); }, down: function (el) { moveChunk(el.dataset.cid, 1); },
    join: function (el) {
      var c = castle(route().id), i = idx(c, el.dataset.cid); if (i < 0 || i >= c.chunks.length - 1) return;
      var a = c.chunks[i], b = c.chunks.splice(i + 1, 1)[0]; a.text = (a.text.trim() + '\n' + b.text.trim()).trim();
      if (b.image && !a.image) a.image = b.image; a.sr = SR.newSr(); save(); keepRender();
    },
    splitAt: function (el) {
      var c = castle(route().id), i = idx(c, el.dataset.cid), ta = app.querySelector('textarea[data-cid="' + el.dataset.cid + '"]');
      var pos = ta.selectionStart, v = ta.value, a = v.slice(0, pos).trim(), b = v.slice(pos).trim();
      if (!a || !b) { toast('Tap inside the text where you want the break, then press Split.'); return; }
      c.chunks[i].text = a; c.chunks[i].sr = SR.newSr(); c.chunks.splice(i + 1, 0, mkChunk(b)); save(); keepRender();
    },
    remove: function (el) { var c = castle(route().id), i = idx(c, el.dataset.cid); if (c.chunks.length <= 1) { toast('A castle needs at least one piece.'); return; } c.chunks.splice(i, 1); save(); keepRender(); },
    addChunk: function () { var c = castle(route().id); c.chunks.push(mkChunk('')); save(); keepRender(); setTimeout(function () { var t = app.querySelectorAll('textarea'); t[t.length - 1].focus(); }, 0); },
    toStops: function () {
      var c = castle(route().id);
      if (!c.chunks.some(function (k) { return k.text.trim(); })) { toast('Add some text to at least one piece first.'); return; }
      c.chunks = c.chunks.filter(function (k) { return k.text.trim(); });
      save(); go('#/stops/' + c.id);
    },
    /* stops */
    ideas: function (el) { ui.ideas = ui.ideas === el.dataset.v ? '' : el.dataset.v; keepRender(); },
    idea: function (el) {
      var c = castle(route().id), k = c.chunks.filter(function (x) { return !x.stop.trim(); })[0];
      if (!k) { toast('Every stop already has a name.'); return; } k.stop = el.dataset.v; save(); keepRender();
    },
    toImages: function () {
      var c = castle(route().id), missing = c.chunks.filter(function (k) { return !k.stop.trim(); }).length;
      if (missing) { toast('Please name a stop for every piece (' + missing + ' to go).'); return; }
      ui.nudge = false; go('#/images/' + c.id + '/0');
    },
    /* images */
    nudge: function () { ui.nudge = !ui.nudge; keepRender(); },
    imgPrev: function (el) { go('#/images/' + route().id + '/' + (parseInt(el.dataset.i, 10) - 1)); },
    imgNext: function (el) {
      var c = castle(route().id), i = parseInt(el.dataset.i, 10);
      if (i >= c.chunks.length - 1) {
        var blanks = c.chunks.filter(function (k) { return !k.image.trim(); }).length;
        c.built = true; save(); toast(blanks ? 'Castle ready. ' + plural(blanks, 'stop has', 'stops have') + ' no image yet.' : 'Your castle is ready!'); go('#/castle/' + c.id);
      } else go('#/images/' + c.id + '/' + (i + 1));
    },
    /* walk */
    walk: function (el) { ui.reveal = false; go('#/walk/' + el.dataset.id + '/0'); },
    reveal: function () { ui.reveal = true; keepRender(); },
    walkPrev: function (el) { ui.reveal = false; go('#/walk/' + route().id + '/' + (parseInt(el.dataset.i, 10) - 1)); },
    walkNext: function (el) { var c = castle(route().id), i = parseInt(el.dataset.i, 10); ui.reveal = false; if (i >= c.chunks.length - 1) go('#/castle/' + c.id); else go('#/walk/' + c.id + '/' + (i + 1)); },
    /* recall */
    practice: function (el) {
      var c = castle(el.dataset.id), items = castleItems(c), v = el.dataset.v;
      if (v === 'back') items.reverse(); else if (v === 'rand') items = shuffle(items);
      startSession(items, { fwd: 'In order', back: 'Backwards', rand: 'Random stops' }[v], '#/castle/' + c.id);
    },
    practiseCastleDue: function (el) {
      var c = castle(el.dataset.id), t = SR.today();
      startSession(castleItems(c).filter(function (it) { return SR.isDue(chunk(c, it.kid).sr, t); }), 'Due today', '#/castle/' + c.id);
    },
    practiseDue: function () {
      var t = SR.today(), items = [];
      S.castles.forEach(function (c) { if (c.built) castleItems(c).forEach(function (it) { if (SR.isDue(chunk(c, it.kid).sr, t)) items.push(it); }); });
      startSession(items, 'Today\u2019s practice', '#/home');
    },
    show: function () { ui.session.shown = true; keepRender(); },
    rate: function (el) {
      var s = ui.session, it = s.items[s.i], c = castle(it.cid), k = chunk(c, it.kid), r = el.dataset.v;
      k.sr = SR.apply(k.sr, r, SR.today()); s.tally[r]++; save();
      s.i++; s.shown = false; if (s.i >= s.items.length) s.done = true; render();
    },
    /* backup */
    export: exportData,
    pickFile: function () { document.getElementById('file').click(); }
  };

  function stepRoute(c) {
    if (!c.chunks.length) return '#/new';
    if (c.chunks.some(function (k) { return !k.stop.trim(); })) return '#/stops/' + c.id;
    return '#/images/' + c.id + '/0';
  }
  function idx(c, id) { for (var i = 0; i < c.chunks.length; i++) if (c.chunks[i].id === id) return i; return -1; }
  function moveChunk(id, d) {
    var c = castle(route().id), i = idx(c, id), j = i + d; if (j < 0 || j >= c.chunks.length) return;
    var t = c.chunks[i]; c.chunks[i] = c.chunks[j]; c.chunks[j] = t; save(); keepRender();
  }
  // Re-draw but keep the scroll position (render() normally jumps to the top).
  function keepRender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  function confirmBox(title, msg, yes, fn) {
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><p class="soft">' + esc(msg) + '</p><button class="btn danger" id="cy">' + esc(yes) + '</button><button class="btn" id="cn">No, keep it</button></div>';
    document.body.appendChild(m);
    m.querySelector('#cn').onclick = function () { m.remove(); };
    m.querySelector('#cy').onclick = function () { m.remove(); fn(); };
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    var fn = actions[el.dataset.act]; if (fn) fn(el);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
  });
  // Save as you type (no re-render, so the keyboard stays open).
  document.addEventListener('input', function (e) {
    var t = e.target, c = castle(route().id); if (!c) return;
    if (t.dataset.cfield) { c[t.dataset.cfield] = t.value; save(); }
    else if (t.dataset.field) { var k = chunk(c, t.dataset.cid); if (k) { k[t.dataset.field] = t.value; save(); } }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'file' && e.target.files[0]) { var rd = new FileReader(); rd.onload = function () { importData(rd.result); }; rd.readAsText(e.target.files[0]); }
  });

  /* ---------- start ---------- */
  window.MC = { splitText: splitText };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  render();
})();
