/* Memory Castle prototype - vanilla JS, data stays in this browser (localStorage). */
(function () {
  'use strict';
  var KEY = 'memoryCastle.v1', NKEY = 'memoryCastle.notes.v1', VERSION = '0.3.1';
  var app = document.getElementById('app'), back = document.getElementById('back'),
      bartitle = document.getElementById('bartitle'), toastEl = document.getElementById('toast');

  /* ---------- data ---------- */
  var S = load(), NT = loadNotes();
  function loadNotes() { try { return Notes.sane(JSON.parse(localStorage.getItem(NKEY))); } catch (e) { return Notes.empty(); } }
  function saveNotes() { try { localStorage.setItem(NKEY, JSON.stringify(NT)); } catch (e) {} }
  function logEvent(name, detail) { Notes.addTrail(NT, 'event', name, detail); saveNotes(); }
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.castles) { d.prefs = d.prefs || {}; return d; } } catch (e) {}
    return { castles: [], prefs: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Sorry, I could not save on this phone.'); } }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function castle(id) { if (id === 'practice') return practiceCastle(); for (var i = 0; i < S.castles.length; i++) if (S.castles[i].id === id) return S.castles[i]; return null; }
  function chunk(c, id) { for (var i = 0; i < c.chunks.length; i++) if (c.chunks[i].id === id) return c.chunks[i]; return c.own && c.own.id === id ? c.own : null; }
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

  /* ---------- splitting text into chunks (see splitter.js) ---------- */
  var LEVEL_NAMES = Splitter.LEVELS.map(function (l) { return l.name; });
  function proposed() { return Splitter.split(ui.pasteText, { mode: ui.mode, level: ui.level }); }

  /* ---------- induction: a ready-made practice castle (kept in memory only, never in spaced repeats unless kept) ---------- */
  var PRACTICE = [
    { stop: 'Front gate', text: 'Milk', image: 'A giant milk carton has burst all over the front gate. Cold milk is pouring down the bars and splashing over your shoes. It smells a bit sour and you have to wade through it.', why: ['Big', 'Moving', 'Senses', 'You are in it'] },
    { stop: 'Front door', text: 'Bread', image: 'The front door is one enormous warm loaf of bread. When you push it, it squashes like a pillow and puffs out steam that smells of fresh toast. You tear off the door handle and eat it.', why: ['Odd', 'Senses', 'You are in it'] },
    { stop: 'Hallway', text: 'Eggs', image: 'Hundreds of eggs are rolling down the hallway like bowling balls. You jump over them, but one cracks under your foot with a loud crunch and the yolk squelches between your toes.', why: ['Moving', 'Big', 'Senses', 'You are in it'] },
    { stop: 'Kitchen', text: 'Bananas', image: 'A banana the size of a canoe is lying across the kitchen bench, singing opera at the top of its voice. It peels itself and the peel flops onto your head like a yellow wig.', why: ['Odd', 'Big', 'Funny', 'Moving'] },
    { stop: 'Back garden', text: 'Soap', image: 'The back garden is full of foam. A bar of soap as big as a car is skidding across the lawn, blowing bubbles that pop on your face and smell of lavender.', why: ['Big', 'Moving', 'Senses'] }
  ];
  var PRACTICE_OWN = { stop: 'Garden shed', text: 'Batteries' };
  var INTRO_STOP0 = 3, INTRO_TRY = INTRO_STOP0 + PRACTICE.length, INTRO_READY = INTRO_TRY + 1;
  function practiceCastle() {
    if (!ui.practice) {
      ui.practice = { id: 'practice', title: 'Practice castle', route: 'A simple house', practice: true, built: true, chunks: PRACTICE.map(function (x) { var k = mkChunk(x.text); k.stop = x.stop; k.image = x.image; k.why = x.why; return k; }) };
      var own = mkChunk(PRACTICE_OWN.text); own.stop = PRACTICE_OWN.stop; own.own = true; ui.practice.own = own;
    }
    return ui.practice;
  }

  var BEATITUDES = ['Poor in spirit', 'Gentle', 'Those who mourn', 'Hunger and thirst for what is right', 'Merciful', 'Pure in heart', 'Peacemakers', 'Persecuted for the cause of right'];
  var HOUSE_STOPS = ['Front gate', 'Letterbox', 'Front door', 'Hallway', 'Lounge room', 'Kitchen', 'Dining table', 'Bedroom', 'Bathroom', 'Back verandah', 'Backyard', 'Garage', 'Clothesline'];
  var WALK_STOPS = ['Front gate', 'End of the street', 'Bus stop', 'Corner shop', 'Park bench', 'Traffic lights', 'Bridge or crossing', 'Church doors', 'Office entrance', 'Lift or stairs', 'Your desk'];
  var NUDGES = ['Make it odd. Strange pictures stick better than sensible ones.', 'Make it big. Giants, mountains, enormous or tiny.', 'Make it move. Something crashing, dancing, pouring, climbing.', 'Make it funny. If it makes you smile, you will remember it.', 'Use your senses. What can you smell, hear, taste or feel there?', 'Put yourself in the picture. What are you doing? How do you feel?'];

  /* ---------- router ---------- */
  var ui = { practice: null, pbpIdeas: false, session: null, reveal: false, nudge: false, ideas: '', mode: 'auto', level: 1, pasteText: '', ideaSeed: 0, lastKey: '' };
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function route() { var p = (location.hash || '#/home').replace(/^#\/?/, '').split('/'); return { name: p[0] || 'home', id: p[1], n: parseInt(p[2], 10) || 0 }; }
  function parentOf(r) {
    var c = castle(r.id);
    switch (r.name) {
      case 'new': case 'backup': case 'castle': case 'notes': return '#/home';
      case 'preview': return '#/paste';
      case 'paste': return '#/new';
      case 'intro': return r.n > 0 ? '#/intro/practice/' + (r.n - 1) : '#/home';
      case 'piece': return r.n > 0 ? '#/piece/' + r.id + '/' + (r.n - 1) : '#/new';
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
    if (r.name !== 'home' && r.name !== 'new' && r.name !== 'backup' && r.name !== 'recall' && r.name !== 'preview' && r.name !== 'notes' && r.name !== 'paste' && !c) { go('#/home'); return; }
    switch (r.name) {
      case 'new': title = 'New castle'; html = vNew(); break;
      case 'paste': title = 'New castle'; html = vPaste(); break;
      case 'intro': title = 'Practice castle'; html = vIntro(r.n); break;
      case 'piece': title = r.n ? 'Stop ' + r.n : 'Your route'; html = vPiece(c, r.n); break;
      case 'preview': if (!ui.pasteText.trim()) { go('#/new'); return; } title = 'Step 1: the pieces'; html = vPreview(); break;
      case 'notes': title = 'Session notes'; html = vNotes(); break;
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
    var sc = screenInfo(r, c);
    if (sc.key !== ui.lastKey) { ui.lastKey = sc.key; Notes.addTrail(NT, 'screen', sc.name, sc.detail); saveNotes(); }
    setTimeout(autosizeAll, 0);
    app.innerHTML = html + '<div class="confused"><button class="linkbtn" data-act="confused">\ud83e\udd14 Something confused me</button></div>';
  }

  /* name of the current screen for the notes and trail (never includes the user's own words) */
  function screenInfo(r, c) {
    var n = c ? c.chunks.length : 0, i = c ? Math.min(Math.max(r.n, 0), n - 1) + 1 : 0;
    switch (r.name) {
      case 'new': return { key: 'new', name: 'Choose how to start' };
      case 'paste': return { key: 'paste', name: 'Paste text' };
      case 'intro': return { key: 'intro/' + r.n, name: 'Practice castle', detail: 'step ' + (r.n + 1) + ' of ' + (INTRO_READY + 1) };
      case 'piece': return { key: 'piece/' + r.n, name: 'Piece by piece', detail: r.n ? 'stop ' + r.n + ' of ' + n : 'route' };
      case 'preview': return { key: 'preview', name: 'Check the proposed pieces', detail: plural(proposed().length, 'piece', 'pieces') + ', ' + (ui.mode === 'auto' ? 'automatic, ' + LEVEL_NAMES[ui.level].toLowerCase() : ui.mode) };
      case 'edit': return { key: 'edit', name: 'Edit pieces', detail: plural(n, 'piece', 'pieces') };
      case 'stops': return { key: 'stops', name: 'Route and stops', detail: plural(n, 'stop', 'stops') };
      case 'images': return { key: 'images/' + i, name: 'Make images', detail: 'stop ' + i + ' of ' + n };
      case 'castle': return { key: 'castle', name: 'Castle page', detail: c.built ? 'built' : 'not finished' };
      case 'walk': return { key: 'walk/' + i, name: 'Walk through', detail: 'stop ' + i + ' of ' + n };
      case 'recall': return { key: 'recall' + (ui.session && ui.session.done ? '-done' : ''), name: ui.session && ui.session.done ? 'Practice finished' : 'Practice', detail: ui.session ? ui.session.label : undefined };
      case 'backup': return { key: 'backup', name: 'Back up or restore' };
      case 'notes': return { key: 'notes', name: 'Session notes' };
    }
    return { key: 'home', name: 'Home' };
  }

  /* textareas grow to show all their text, so nothing is hidden behind an inner scroll */
  function autosize(t) { if (!t || t.id === 'paste') return; t.style.height = 'auto'; t.style.height = (t.scrollHeight + 4) + 'px'; }
  function autosizeAll() { Array.prototype.forEach.call(app.querySelectorAll('textarea'), autosize); }

  /* ---------- views ---------- */
  function vHome() {
    var due = totalDue(), h = '';
    if (!S.prefs.introDone && !S.prefs.introSkipped) h += '<div class="card gold"><h3>New to memory castles?</h3><p class="small">Take a short practice walk through a ready-made house first. It takes about three minutes, and you can skip it.</p><button class="btn warm" data-act="introStart">Start the practice castle</button><button class="btn small" data-act="introSkip">Skip for now</button></div>';
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
    h += '<button class="btn" data-act="introStart">Practice castle: how it works</button>';
    h += '<button class="btn" data-act="goBackup">Back up or restore my castles</button>';
    h += '<button class="btn" data-act="goNotes">Share session notes' + (NT.notes.length ? ' (' + NT.notes.length + ')' : '') + '</button>';
    if (!S.prefs.hideInstall) h += '<div class="card"><h3>Keep it on your home screen</h3><p class="small">On iPhone: tap the Share button, then \u201cAdd to Home Screen\u201d. On Android: open the browser menu and choose \u201cInstall app\u201d or \u201cAdd to Home screen\u201d.</p><button class="btn small" data-act="hideInstall">Got it</button></div>';
    h += '<p class="soft small" style="text-align:center">Prototype v' + VERSION + ' \u00b7 your castles are saved only on this phone</p>';
    return h;
  }

  function vNew() {
    return '<h2>How would you like to start?</h2>' +
      '<div class="card"><h3>Paste it all</h3><p class="small">Paste the whole text and I will suggest how to break it into pieces, one for each stop. Good for prayers, poems and passages.</p><button class="btn primary" data-act="goPaste">Paste it all and I\u2019ll suggest pieces</button></div>' +
      '<div class="card"><h3>Piece by piece</h3><p class="small">Name your route, then go stop by stop: name the stop, add the thing to remember there, and make your image. Good for lists, talks and notes.</p><button class="btn primary" data-act="pieceStart">Add piece by piece</button></div>' +
      '<div class="card gold"><h3>Just want to look around?</h3><p class="small">Try the Beatitudes example. It starts with eight short reminder titles only. The Bible text is under copyright, so this app does not include it. You paste in your own copy.</p><button class="btn warm" data-act="example">Try the Beatitudes example</button></div>';
  }

  function vPaste() {
    return '<h2>What would you like to remember?</h2><p class="soft">Paste your own copy of the text. Next I will show you how I would break it into small pieces, one for each stop in your castle, and you can change it.</p>' +
      '<label for="paste">Your text</label><textarea id="paste" style="min-height:200px" placeholder="Paste or type here\u2026">' + esc(ui.pasteText) + '</textarea>' +
      '<button class="btn primary" data-act="split" style="margin-top:12px">Show me the pieces</button>';
  }

  function vPreview() {
    var parts = proposed(), modes = [['auto', 'Automatically'], ['blank', 'Blank lines'], ['line', 'Each line'], ['sentence', 'Each sentence']];
    var h = '<h2>Here is how I would break it up</h2><p class="soft">I found <b>' + plural(parts.length, 'piece', 'pieces') + '</b>. Each piece gets its own stop in your castle, so small pieces are easier to picture. Not right? Change the size below, or edit the pieces on the next screen: you can join, split or reword any of them.</p>' +
      '<label>Break it up by</label><div class="chips">' + modes.map(function (m) { return '<button class="chip' + (ui.mode === m[0] ? ' on' : '') + '" data-act="mode" data-v="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
    if (ui.mode === 'auto') h += '<label>Size of each piece</label><div class="chips">' + LEVEL_NAMES.map(function (nm, i) { return '<button class="chip' + (ui.level === i ? ' on' : '') + '" data-act="level" data-v="' + i + '">' + nm + '</button>'; }).join('') + '</div>';
    if (parts.length === 1 && Splitter.wordCount(parts[0]) > 25) h += '<div class="card gold small">This is still one big piece. Try \u201cSmaller\u201d, or pick another way to break it up.</div>';
    parts.forEach(function (p, i) {
      var w = Splitter.wordCount(p);
      h += '<div class="card"><div class="cardhead"><span class="num">' + (i + 1) + '</span><span class="t soft small">' + plural(w, 'word', 'words') + (w > 40 ? ' \u00b7 long' : '') + '</span></div><div class="piece">' + esc(p) + '</div></div>';
    });
    return h + '<div style="height:70px"></div><div class="sticky"><button class="btn primary" data-act="usePieces">Use these ' + plural(parts.length, 'piece', 'pieces') + '</button></div>';
  }

  function vEdit(c) {
    var h = c.built ? '<h2>Edit the words</h2><p class="soft">Change the words of any piece, or add, remove, join, split or reorder pieces.</p><div class="card gold small">Your stops and images stay with each piece. Pieces whose words you change start their practice again; unchanged pieces keep their progress.</div>'
      : '<h2>Check the pieces</h2><p class="soft">Each piece gets its own place in your castle. Keep each one small enough to picture. You can edit, join, split or reorder.</p>';
    if (c.example) h += '<div class="card gold small"><b>About this example.</b> These are only short reminder titles, not the Bible text (it is under copyright). To remember the actual words, paste your own copy into each piece.</div>';
    h += '<label for="ctitle">Name of this castle</label><input type="text" id="ctitle" value="' + esc(c.title) + '" data-cfield="title">';
    c.chunks.forEach(function (k, i) {
      h += '<div class="card" style="margin-top:14px"><div class="cardhead"><span class="num">' + (i + 1) + '</span><span class="t soft small">Piece ' + (i + 1) + ' of ' + c.chunks.length + (c.built ? (k.stop ? ' \u00b7 at ' + esc(k.stop) : ' \u00b7 needs a stop') + (k.orig && k.text.trim() !== k.orig.text.trim() ? ' \u00b7 <b>changed</b>' : '') : '') + '</span></div>' +
        (Splitter.wordCount(k.text) > 40 ? '<p class="small soft" style="margin:0 0 6px">This one is long (' + Splitter.wordCount(k.text) + ' words). Try \u201cBreak into smaller pieces\u201d.</p>' : '') +
        '<textarea data-field="text" data-cid="' + k.id + '" aria-label="Piece ' + (i + 1) + '">' + esc(k.text) + '</textarea><div class="ops">' +
        '<button class="btn small" data-act="up" data-cid="' + k.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">\u2191 Up</button>' +
        '<button class="btn small" data-act="down" data-cid="' + k.id + '"' + (i === c.chunks.length - 1 ? ' disabled' : '') + ' aria-label="Move down">\u2193 Down</button>' +
        '<button class="btn small" data-act="join" data-cid="' + k.id + '"' + (i === c.chunks.length - 1 ? ' disabled' : '') + '>Join with next</button>' +
        '<button class="btn small" data-act="splitAt" data-cid="' + k.id + '">Split at cursor</button>' +
        '<button class="btn small" data-act="smaller" data-cid="' + k.id + '">Break into smaller pieces</button>' +
        '<button class="btn small danger" data-act="remove" data-cid="' + k.id + '">Remove</button></div></div>';
    });
    h += '<button class="btn" data-act="addChunk">+ Add a piece</button><div style="height:70px"></div>' +
      '<div class="sticky"><button class="btn primary" data-act="' + (c.built ? 'editDone' : 'toStops') + '">' + (c.built ? 'Done' : 'Next: choose your route') + '</button></div>';
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
      h += '<div class="card"><div class="cardhead"><span class="num">' + (i + 1) + '</span><span class="t full">' + esc(k.text) + '</span></div>' +
        '<input type="text" data-field="stop" data-cid="' + k.id + '" value="' + esc(k.stop) + '" placeholder="Stop ' + (i + 1) + ' along your route" aria-label="Stop for piece ' + (i + 1) + '"></div>';
    });
    h += '<div style="height:70px"></div><div class="sticky"><button class="btn primary" data-act="toImages">Next: make your images</button></div>';
    return h;
  }

  function vImages(c, n) {
    var i = Math.min(Math.max(n, 0), c.chunks.length - 1), k = c.chunks[i], last = i === c.chunks.length - 1;
    var h = '<div class="progress"><i style="width:' + Math.round((i + 1) / c.chunks.length * 100) + '%"></i></div><p class="soft small">Stop ' + (i + 1) + ' of ' + c.chunks.length + '</p>' +
      '<div class="stop">' + esc(k.stop || 'Stop ' + (i + 1)) + '</div>' +
      '<div class="card"><div class="small soft">Remember this</div><div class="piece" style="font-size:20px">' + esc(k.text) + '</div></div>' +
      ideasCard(k, i) +
      '<label for="img">Picture it at this stop. What do you see?</label>' +
      '<textarea id="img" data-field="image" data-cid="' + k.id + '" placeholder="Write the picture in your own words\u2026">' + esc(k.image) + '</textarea>' +
      nudgeBlock();
    h += '<div style="height:80px"></div><div class="sticky"><div class="row" style="max-width:640px;margin:0 auto">' +
      '<button class="btn" data-act="imgPrev" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' style="margin:0">Back</button>' +
      '<button class="btn primary" data-act="imgNext" data-i="' + i + '" style="margin:0">' + (last ? 'Finish my castle' : 'Next stop') + '</button></div></div>';
    return h;
  }

  function nudgeBlock() {
    var h = '<button class="btn small" data-act="nudge" style="margin-top:8px">' + (ui.nudge ? 'Hide the nudges' : 'Need a nudge?') + '</button>';
    if (ui.nudge) h += '<div class="card gold small"><p><b>Ideas to spark your picture</b> (you are the artist, these are only hints):</p><ul style="margin:0;padding-left:20px">' + NUDGES.map(function (t) { return '<li style="margin-bottom:6px">' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  /* ---------- induction views ---------- */
  function introBar(n) { return '<div class="progress"><i style="width:' + Math.round((n + 1) / (INTRO_READY + 1) * 100) + '%"></i></div>'; }
  function introNav(n, nextLabel, nextAct) {
    return '<div style="height:80px"></div><div class="sticky"><div class="row" style="max-width:640px;margin:0 auto">' +
      (n > 0 ? '<button class="btn" data-act="introGo" data-n="' + (n - 1) + '" style="margin:0">Back</button>' : '<button class="btn" data-act="introSkip" style="margin:0">Skip</button>') +
      '<button class="btn primary" data-act="' + (nextAct || 'introGo') + '" data-n="' + (n + 1) + '" style="margin:0">' + nextLabel + '</button></div></div>';
  }
  function vIntro(n) {
    var c = practiceCastle(), skip = '<p class="small soft" style="text-align:center"><button class="linkbtn" data-act="introSkip">Skip the practice</button></p>';
    if (n === 0) return introBar(n) + '<h2>Your memory loves places</h2><div class="card"><p>You can probably walk through your childhood home in your head right now, room by room. Your memory for places is very strong.</p><p>A memory castle borrows that strength. You put each thing you want to remember at a stop along a route you know well.</p></div>' + skip + introNav(n, 'Next');
    if (n === 1) return introBar(n) + '<h2>How it works</h2><div class="card"><p><span class="num">1</span> Pick a route you know, like your house.</p><p><span class="num">2</span> At each stop, picture a vivid image that joins the stop to the thing you want to remember.</p><p style="margin:0"><span class="num">3</span> Later, walk the route in your head. The images bring the things back.</p></div>' + skip + introNav(n, 'Next');
    if (n === 2) return introBar(n) + '<h2>What makes a good image?</h2><div class="card"><p>Ordinary pictures fade. Strange ones stick. The best images are:</p><div class="chips">' + ['Big', 'Odd', 'Moving', 'Funny', 'Full of senses', 'With you in it'].map(function (t) { return '<span class="badge">' + t + '</span>'; }).join('') + '</div><p style="margin-top:10px">Let\u2019s walk through a practice house with <b>five things on a shopping list</b>. Read each image slowly and really picture it.</p></div>' + skip + introNav(n, 'Walk the house');
    if (n >= INTRO_STOP0 && n < INTRO_TRY) {
      var i = n - INTRO_STOP0, k = c.chunks[i], last = i === c.chunks.length - 1;
      return introBar(n) + '<p class="soft small">Stop ' + (i + 1) + ' of ' + c.chunks.length + ' \u00b7 A simple house</p><div class="stop">' + esc(k.stop) + '</div>' +
        '<div class="card"><div class="small soft">Remember</div><div class="piece" style="font-size:24px">' + esc(k.text) + '</div></div>' +
        '<div class="image">' + esc(k.image) + '</div>' +
        '<p class="small soft" style="margin-bottom:6px">Why this image works:</p><div class="chips">' + k.why.map(function (t) { return '<span class="badge ok">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<p class="soft small">Close your eyes for a moment and see it.</p>' + introNav(n, last ? 'Test me' : 'Next stop', last ? 'introTest' : 'introGo');
    }
    if (n === INTRO_TRY) {
      var o = c.own;
      return introBar(n) + '<h2>Now try making one yourself</h2><p class="soft">Your turn. There is one more stop in the house and one more thing on the list. Make your own picture: you are the artist.</p>' +
        '<div class="stop">' + esc(o.stop) + '</div><div class="card"><div class="small soft">Remember</div><div class="piece" style="font-size:24px">' + esc(o.text) + '</div></div>' +
        ideasCard(o, 0) + '<label for="img">Picture it at the garden shed. What do you see?</label>' +
        '<textarea id="img" data-field="image" data-cid="' + o.id + '" placeholder="Write the picture in your own words\u2026">' + esc(o.image) + '</textarea>' + nudgeBlock() + introNav(n, 'Next');
    }
    var mine = c.own.image.trim();
    return introBar(INTRO_READY) + '<h2>You\u2019re ready \ud83c\udf89</h2><div class="card"><p>That is the whole method: a route you know, one vivid image at each stop, and a walk through it in your head.</p>' +
      (mine ? '<p class="small">Your own image for the garden shed:</p><div class="image">' + esc(mine) + '</div>' : '') +
      '<p class="small soft" style="margin:0">Tip: pick a route you could walk with your eyes closed, and keep each piece small enough to picture.</p></div>' +
      '<button class="btn primary" data-act="introDone" data-v="new">Add your own text</button>' +
      '<button class="btn" data-act="introDone" data-v="keep">Keep the practice castle for spaced repeats</button>' +
      '<p class="small soft">If you keep it, it is added to your castles and comes back for practice like any other. Otherwise nothing from the practice is saved.</p>' +
      '<button class="btn" data-act="introDone" data-v="home">Back to home</button>';
  }

  /* ---------- piece-by-piece builder ---------- */
  function vPiece(c, n) {
    if (!n) {
      return '<h2>Name your route</h2><p class="soft">Think of a route you could walk with your eyes closed: your home, your street, your walk to work or to church. You will add one stop at a time, in the order you would walk.</p>' +
        '<label for="ctitle">What are you remembering?</label><input type="text" id="ctitle" data-cfield="title" value="' + esc(c.title) + '" placeholder="e.g. My talk on Sunday">' +
        '<label for="route">Name of your place or route</label><input type="text" id="route" data-cfield="route" value="' + esc(c.route) + '" placeholder="e.g. My childhood home">' +
        (c.chunks.length ? '<p class="small soft" style="margin-top:12px">' + plural(c.chunks.length, 'stop', 'stops') + ' added so far.</p>' : '') +
        '<div style="height:80px"></div><div class="sticky"><button class="btn primary" data-act="pieceGo" data-n="1">' + (c.chunks.length ? 'Carry on with the stops' : 'Start with stop 1') + '</button></div>';
    }
    while (c.chunks.length < n) c.chunks.push(mkChunk(''));
    var k = c.chunks[n - 1], h = '<p class="soft small">' + esc(c.route || 'Your route') + ' \u00b7 stop ' + n + (c.chunks.length > 1 ? ' of ' + c.chunks.length : '') + '</p>';
    if (c.chunks.length > 1) h += '<div class="chips">' + c.chunks.map(function (x, j) { return '<button class="chip' + (j === n - 1 ? ' on' : '') + '" data-act="pieceGo" data-n="' + (j + 1) + '">' + (j + 1) + '. ' + esc(x.stop || '(no name)') + '</button>'; }).join('') + '</div>';
    h += '<label for="pstop">1. Name this stop</label><input type="text" id="pstop" data-field="stop" data-cid="' + k.id + '" value="' + esc(k.stop) + '" placeholder="e.g. Front gate">' +
      '<label for="ptext">2. What do you want to remember here?</label><textarea id="ptext" data-field="text" data-cid="' + k.id + '" style="min-height:90px" placeholder="Paste or type one small piece\u2026">' + esc(k.text) + '</textarea>' +
      '<label for="img">3. Picture it at this stop. What do you see?</label><textarea id="img" data-field="image" data-cid="' + k.id + '" placeholder="Write the picture in your own words\u2026">' + esc(k.image) + '</textarea>' +
      '<button class="btn small" data-act="pbpIdeas" style="margin-top:8px">' + (ui.pbpIdeas ? 'Hide image ideas' : 'Show image ideas') + '</button>';
    if (ui.pbpIdeas) h += ideasCard(k, n - 1);
    h += nudgeBlock() + (c.chunks.length > 1 ? '<div><button class="btn small danger" data-act="pieceRemove" data-n="' + n + '" style="margin-top:6px">Remove this stop</button></div>' : '');
    var isLast = n === c.chunks.length;
    h += '<div style="height:80px"></div><div class="sticky"><div class="row" style="max-width:640px;margin:0 auto">' +
      '<button class="btn primary" data-act="pieceNext" data-n="' + n + '" style="margin:0">' + (isLast ? '+ Add next stop' : 'Next stop') + '</button>' +
      '<button class="btn warm" data-act="pieceFinish" data-n="' + n + '" style="margin:0">Finished</button></div></div>';
    return h;
  }

  function ideasCard(k, i) {
    var list = Ideas.ideas(k.stop, k.text, ui.ideaSeed);
    return '<div class="card gold"><p style="margin-bottom:8px"><b>Not sure where to start?</b></p><p class="small" style="margin-bottom:10px">Here are three ideas in words. Tap one to use it as a starting point, then change it to make it yours. Or ignore them and write your own. You are the artist.</p>' +
      list.map(function (t, n) { return '<button class="idea" data-act="useIdea" data-n="' + n + '" data-text="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') +
      '<button class="btn small" data-act="moreIdeas" style="margin:4px 0 0">Show different ideas</button></div>';
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
      '<button class="btn" data-act="goEdit" data-id="' + c.id + '">Edit the words</button>' +
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
  function startSession(items, label, backTo, opts) {
    if (!items.length) { toast('There is nothing to practise here yet.'); return; }
    ui.session = { items: items, i: 0, shown: false, label: label, back: backTo, tally: { missed: 0, hard: 0, good: 0, easy: 0 }, done: false };
    for (var o in (opts || {})) ui.session[o] = opts[o];
    go('#/recall');
  }
  function castleItems(c) { return c.chunks.map(function (k) { return { cid: c.id, kid: k.id }; }); }

  function vRecall() {
    var s = ui.session;
    if (s.done) {
      var t = s.tally, total = t.missed + t.hard + t.good + t.easy;
      if (s.practiceOnly) return '<h2>Well done \ud83c\udf89</h2><div class="card"><p>You remembered <b>' + (total - t.missed) + ' of ' + total + '</b> things on the list.</p><p class="small soft" style="margin:0">' + (t.missed ? 'Anything you missed usually needs a bigger, stranger image. ' : 'That is the power of places and vivid pictures. ') + 'This was just practice, so nothing is scheduled.</p></div>' +
        '<button class="btn primary" data-act="goNextSession">Carry on</button>';
      return '<h2>Well done \ud83c\udf89</h2><div class="card"><p>You practised ' + plural(total, 'piece', 'pieces') + '.</p><p class="small">Missed: ' + t.missed + ' \u00b7 Hard: ' + t.hard + ' \u00b7 Good: ' + t.good + ' \u00b7 Easy: ' + t.easy + '</p>' +
        '<p class="small soft">The ones you found harder will come back sooner. Short, regular practice works better than long sessions.</p></div>' +
        '<button class="btn primary" data-act="goHome">Back to home</button>' + (s.back !== '#/home' ? '<button class="btn" data-act="goBackSession">Back to my castle</button>' : '');
    }
    var it = s.items[s.i], c = castle(it.cid), k = c && chunk(c, it.kid);
    if (!k) { s.i++; if (s.i >= s.items.length) s.done = true; return vRecall(); }
    var h = '<div class="progress"><i style="width:' + Math.round(s.i / s.items.length * 100) + '%"></i></div><p class="soft small">' + (s.i + 1) + ' of ' + s.items.length + ' \u00b7 ' + esc(c.title) + '</p>' +
      '<div class="stop">' + esc(k.stop || 'A stop') + '</div>' +
      (s.hideImage && !s.shown ? '' : k.image ? '<div class="image">' + esc(k.image) + '</div>' : '<div class="card soft small">No image written for this stop.</div>');
    if (!s.shown && s.hideImage) return h + '<p>Walk to this stop in your head. What was waiting here?</p><button class="btn warm" data-act="show">Show me</button>';
    if (s.practiceOnly) {
      h += '<div class="reveal">' + esc(k.text) + '</div><p><b>Did you remember it?</b></p><div class="rate">';
      [['missed', 'No', 'm'], ['good', 'Yes', 'g']].forEach(function (r) { h += '<button class="btn ' + r[2] + '" data-act="rate" data-v="' + r[0] + '">' + r[1] + '</button>'; });
      return h + '</div>';
    }
    if (!s.shown) return h + '<p>What words go with this place? Say them out loud or in your head, then check.</p><button class="btn warm" data-act="show">Show me the words</button>';
    var now = SR.today(), early = SR.isEarly(k.sr, now);
    h += '<div class="reveal">' + esc(k.text) + '</div><p><b>How did you go?</b></p>' + (early ? '<p class="small soft">Not due yet, so this is just practice. Only \u201cMissed\u201d will change your schedule.</p>' : '') + '<div class="rate">';
    [['missed', 'Missed it', 'm'], ['hard', 'Hard', 'h'], ['good', 'Good', 'g'], ['easy', 'Easy', 'e']].forEach(function (r) {
      var nx = SR.apply(k.sr, r[0], now), hint = early && r[0] !== 'missed' ? 'no change' : SR.label(nx.interval);
      h += '<button class="btn ' + r[2] + '" data-act="rate" data-v="' + r[0] + '">' + r[1] + '<small>' + hint + '</small></button>';
    });
    return h + '</div>';
  }

  /* ---------- session notes ---------- */
  function notesExport() { return Notes.build(NT, { viewport: window.innerWidth + 'x' + window.innerHeight, homeScreenApp: !!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)), version: VERSION }); }
  function vNotes() {
    var x = notesExport(), h = '<h2>Share session notes</h2>' +
      '<div class="card"><p>When something confuses you, tap <b>\ud83e\udd14 Something confused me</b> at the bottom of any screen. It saves a short note on this phone with the time and the screen you were on.</p>' +
      '<p>When you are ready, you can send the notes to the person improving the app.</p></div>' +
      '<div class="card gold"><p class="small"><b>What gets shared:</b> your notes, the list of screens you used and when, and your screen size.</p><p class="small"><b>What never gets shared:</b> your text, your images, your stop and route names, or your castles.</p><p class="small" style="margin:0"><b>Nothing is sent automatically.</b> You choose whether to send the file, and to whom.</p></div>' +
      '<h3>Your notes (' + NT.notes.length + ')</h3>';
    if (!NT.notes.length) h += '<p class="soft small">No notes yet.</p>';
    NT.notes.slice().reverse().forEach(function (n) { h += '<div class="card small"><div class="soft">' + esc(new Date(n.t).toLocaleString()) + ' \u00b7 ' + esc(n.screen) + '</div>' + (n.text ? esc(n.text) : '<i class="soft">(no text)</i>') + '</div>'; });
    h += '<details class="card small"><summary>See exactly what would be shared</summary><pre>' + esc(Notes.asText(x)) + '</pre></details>' +
      '<button class="btn primary" data-act="shareNotes">Share session notes</button>' +
      '<button class="btn" data-act="copyNotes">Copy as text</button>' +
      '<button class="btn danger" data-act="clearNotes">Clear all notes and trail</button>';
    return h;
  }
  function notesFile() { return new File([JSON.stringify(notesExport(), null, 2)], 'memory-castle-session-notes-' + SR.today() + '.json', { type: 'application/json' }); }
  function shareNotes() {
    var f; try { f = notesFile(); } catch (e) { f = null; }
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Memory Castle session notes' }).catch(function (e) { if (e && e.name !== 'AbortError') downloadNotes(); }); return; }
    downloadNotes();
  }
  function downloadNotes() {
    var blob = new Blob([JSON.stringify(notesExport(), null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'memory-castle-session-notes-' + SR.today() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Notes file saved to your downloads. Send it on.');
  }
  function confusedBox() {
    var sc = screenInfo(route(), castle(route().id)), m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div role="dialog" aria-modal="true"><h3>Something confused me</h3><p class="soft small">This saves a note on your phone with the time and screen (\u201c' + esc(sc.name + (sc.detail && /stop|of/.test(sc.detail) ? ', ' + sc.detail : '')) + '\u201d). It is only shared if you choose to send your notes.</p>' +
      '<label for="cnote">What was confusing? (optional, a few words is plenty)</label><textarea id="cnote" maxlength="' + Notes.MAX_TEXT + '" style="min-height:80px"></textarea>' +
      '<button class="btn primary" id="cy" style="margin-top:12px">Save note</button><button class="btn" id="cn">Cancel</button></div>';
    document.body.appendChild(m);
    setTimeout(function () { var t = m.querySelector('#cnote'); if (t) t.focus(); }, 50);
    m.querySelector('#cn').onclick = function () { m.remove(); };
    m.querySelector('#cy').onclick = function () {
      Notes.addNote(NT, sc.name + (sc.detail && /stop|of/.test(sc.detail) ? ' (' + sc.detail + ')' : ''), m.querySelector('#cnote').value); saveNotes(); m.remove();
      toast('Noted. Thank you.'); if (route().name === 'notes') keepRender();
    };
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
    goNew: function () { go('#/new'); }, goPaste: function () { go('#/paste'); },
    goNextSession: function () { go(ui.session && ui.session.next ? ui.session.next : '#/home'); },
    introStart: function () { ui.practice = null; ui.nudge = false; ui.ideaSeed = 0; go('#/intro/practice/0'); },
    introSkip: function () { S.prefs.introSkipped = true; save(); logEvent('Skipped the practice castle'); go('#/home'); render(); },
    introGo: function (el) { ui.nudge = false; go('#/intro/practice/' + el.dataset.n); },
    introTest: function () {
      var c = practiceCastle();
      startSession(castleItems(c), 'Practice test', '#/intro/practice/' + (INTRO_TRY - 1), { practiceOnly: true, hideImage: true, next: '#/intro/practice/' + INTRO_TRY });
    },
    introDone: function (el) {
      var c = practiceCastle(), v = el.dataset.v;
      S.prefs.introDone = true;
      if (v === 'keep') {
        var keep = { id: uid(), title: 'Practice castle: shopping list', route: 'A simple house', built: true, created: Date.now(), chunks: c.chunks.concat(c.own.image.trim() ? [c.own] : []).map(function (k) { var n = mkChunk(k.text); n.stop = k.stop; n.image = k.image; return n; }) };
        S.castles.push(keep); save(); logEvent('Kept the practice castle'); ui.practice = null; toast('Saved to your castles.'); go('#/castle/' + keep.id); return;
      }
      save(); logEvent('Finished the practice castle'); ui.practice = null; go(v === 'new' ? '#/new' : '#/home');
    },
    pieceStart: function () {
      var c = { id: uid(), title: '', route: '', pbp: true, chunks: [], built: false, created: Date.now() };
      S.castles.push(c); save(); ui.pbpIdeas = false; ui.nudge = false; go('#/piece/' + c.id + '/0');
    },
    pieceGo: function (el) { ui.ideaSeed = 0; go('#/piece/' + route().id + '/' + el.dataset.n); },
    pieceNext: function (el) {
      var c = castle(route().id), n = parseInt(el.dataset.n, 10), k = c.chunks[n - 1];
      if (!k.stop.trim() || !k.text.trim()) { toast(!k.stop.trim() ? 'Please name this stop first.' : 'Please add what to remember at this stop.'); return; }
      if (n === c.chunks.length) { c.chunks.push(mkChunk('')); save(); logEvent('Added a stop (piece by piece)', 'stop ' + (n + 1)); }
      ui.ideaSeed = 0; go('#/piece/' + c.id + '/' + (n + 1));
    },
    pieceFinish: function () {
      var c = castle(route().id);
      c.chunks = c.chunks.filter(function (k) { return k.stop.trim() || k.text.trim() || k.image.trim(); });
      var bad = c.chunks.filter(function (k) { return !k.stop.trim() || !k.text.trim(); }).length;
      if (!c.chunks.length) { c.chunks.push(mkChunk('')); save(); toast('Add at least one stop first.'); keepRender(); return; }
      if (bad) { save(); toast(plural(bad, 'stop needs', 'stops need') + ' a name and something to remember.'); var i = 0; while (c.chunks[i].stop.trim() && c.chunks[i].text.trim()) i++; go('#/piece/' + c.id + '/' + (i + 1)); return; }
      if (!c.title.trim()) c.title = short(c.route || c.chunks[0].text, 28) || 'My castle';
      c.built = true; save(); logEvent('Finished a castle (piece by piece)', plural(c.chunks.length, 'stop', 'stops'));
      var blanks = c.chunks.filter(function (k) { return !k.image.trim(); }).length;
      toast(blanks ? 'Castle ready. ' + plural(blanks, 'stop has', 'stops have') + ' no image yet.' : 'Your castle is ready!'); go('#/castle/' + c.id);
    },
    pieceRemove: function (el) {
      var c = castle(route().id), n = parseInt(el.dataset.n, 10);
      confirmBox('Remove stop ' + n + '?', 'Its name, text and image will be removed.', 'Yes, remove it', function () { c.chunks.splice(n - 1, 1); save(); go('#/piece/' + c.id + '/' + Math.max(1, Math.min(n, c.chunks.length))); });
    },
    pbpIdeas: function () { ui.pbpIdeas = !ui.pbpIdeas; keepRender(); }, goNotes: function () { go('#/notes'); },
    confused: confusedBox, shareNotes: shareNotes,
    copyNotes: function () {
      var t = Notes.asText(notesExport());
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied. Paste it into a message.'); }, function () { toast('Sorry, I could not copy. Use Share session notes instead.'); });
      else toast('Copy is not available here. Use Share session notes instead.');
    },
    clearNotes: function () { confirmBox('Clear all notes?', 'This removes your notes and the screen trail from this phone.', 'Yes, clear them', function () { NT = Notes.empty(); saveNotes(); keepRender(); }); }, goBackup: function () { go('#/backup'); }, goHome: function () { go('#/home'); },
    goBackSession: function () { go(ui.session ? ui.session.back : '#/home'); },
    hideInstall: function () { S.prefs.hideInstall = true; save(); render(); },
    mode: function (el) { ui.mode = el.dataset.v; keepRender(); },
    level: function (el) { ui.level = parseInt(el.dataset.v, 10); keepRender(); },
    split: function () {
      var text = document.getElementById('paste').value;
      if (!text.trim()) { toast('Please paste or type some text first.'); return; }
      ui.pasteText = text; ui.mode = 'auto'; ui.level = 1; go('#/preview');
    },
    usePieces: function () {
      var parts = proposed(); if (!parts.length) return;
      var c = { id: uid(), title: short(parts[0], 28) || 'My castle', route: '', chunks: parts.map(mkChunk), built: false, created: Date.now() };
      logEvent('Used proposed pieces', plural(parts.length, 'piece', 'pieces'));
      ui.pasteText = ''; S.castles.push(c); save(); go('#/edit/' + c.id);
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
      if (b.image && !a.image) a.image = b.image; a.sr = SR.newSr(); logEvent('Joined two pieces'); save(); keepRender();
    },
    splitAt: function (el) {
      var c = castle(route().id), i = idx(c, el.dataset.cid), ta = app.querySelector('textarea[data-cid="' + el.dataset.cid + '"]');
      var pos = ta.selectionStart, v = ta.value, a = v.slice(0, pos).trim(), b = v.slice(pos).trim();
      if (!a || !b) { toast('Tap inside the text where you want the break, then press Split.'); return; }
      c.chunks[i].text = a; c.chunks[i].sr = SR.newSr(); c.chunks.splice(i + 1, 0, mkChunk(b)); logEvent('Split a piece at cursor'); save(); keepRender();
    },
    smaller: function (el) {
      var c = castle(route().id), i = idx(c, el.dataset.cid), ta = app.querySelector('textarea[data-cid="' + el.dataset.cid + '"]'), parts = Splitter.splitPiece(ta.value);
      if (parts.length < 2) { toast('That piece is already as small as it can go.'); return; }
      c.chunks[i].text = parts[0]; c.chunks[i].sr = SR.newSr();
      for (var n = 1; n < parts.length; n++) c.chunks.splice(i + n, 0, mkChunk(parts[n]));
      logEvent('Broke a piece into smaller pieces', parts.length + ' parts'); save(); keepRender();
    },
    remove: function (el) { var c = castle(route().id), i = idx(c, el.dataset.cid); if (c.chunks.length <= 1) { toast('A castle needs at least one piece.'); return; } c.chunks.splice(i, 1); save(); keepRender(); },
    addChunk: function () { var c = castle(route().id); c.chunks.push(mkChunk('')); save(); keepRender(); setTimeout(function () { var t = app.querySelectorAll('textarea'); t[t.length - 1].focus(); }, 0); },
    editDone: function () {
      var c = castle(route().id);
      if (!c.chunks.some(function (k) { return k.text.trim(); })) { toast('Add some text to at least one piece first.'); return; }
      c.chunks = c.chunks.filter(function (k) { return k.text.trim(); });
      var changed = c.chunks.filter(function (k) { return k.orig && k.text.replace(/\s+/g, ' ').trim() !== k.orig.text.replace(/\s+/g, ' ').trim(); }).length;
      c.chunks.forEach(function (k) { delete k.orig; });
      c.title = c.title.trim() || short(c.chunks[0].text, 28);
      var missing = c.chunks.filter(function (k) { return !k.stop.trim(); }).length;
      save(); logEvent('Edited the words', changed + ' changed, ' + plural(c.chunks.length, 'piece', 'pieces'));
      if (missing) { toast('Please name a stop for ' + (missing === 1 ? 'the new piece.' : 'the ' + missing + ' new pieces.')); go('#/stops/' + c.id); return; }
      toast(changed ? 'Saved. ' + plural(changed, 'changed piece starts', 'changed pieces start') + ' practice again.' : 'Saved.'); go('#/castle/' + c.id);
    },
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
      ui.ideaSeed = 0;
      var c = castle(route().id), missing = c.chunks.filter(function (k) { return !k.stop.trim(); }).length;
      if (missing) { toast('Please name a stop for every piece (' + missing + ' to go).'); return; }
      ui.nudge = false; go('#/images/' + c.id + '/0');
    },
    /* images */
    nudge: function () { ui.nudge = !ui.nudge; keepRender(); },
    moreIdeas: function () { ui.ideaSeed++; logEvent('Asked for different image ideas'); keepRender(); },
    useIdea: function (el) {
      var c = castle(route().id), ta = document.getElementById('img'), k = ta && chunk(c, ta.dataset.cid); if (!k) return;
      var t = el.dataset.text; ta.value = ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n\n' + t : t; autosize(ta);
      k.image = ta.value; save(); logEvent('Used an image idea', 'idea ' + (parseInt(el.dataset.n, 10) + 1));
      try { ta.scrollIntoView({ block: 'center' }); } catch (e) {} ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); toast('Added. Now make it your own: change anything you like.');
    },
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
      if (!s.practiceOnly) { k.sr = SR.apply(k.sr, r, SR.today()); delete k.orig; } s.tally[r]++; save();
      s.i++; s.shown = false; if (s.i >= s.items.length) s.done = true; render();
    },
    /* backup */
    export: exportData,
    pickFile: function () { document.getElementById('file').click(); }
  };

  /* editing the words of a built castle: changed pieces restart their practice, unchanged (or changed back) keep it */
  function textChanged(k, v) {
    if (!k.orig) k.orig = { text: k.text, sr: k.sr };
    var same = String(v).replace(/\s+/g, ' ').trim() === String(k.orig.text).replace(/\s+/g, ' ').trim();
    k.sr = same ? k.orig.sr : SR.newSr();
  }
  function stepRoute(c) {
    if (c.pbp && !c.built) return '#/piece/' + c.id + '/' + (c.chunks.length ? c.chunks.length : 0);
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
    if (e.target.tagName === 'TEXTAREA') autosize(e.target);
    var t = e.target, c = castle(route().id); if (!c) return;
    if (t.dataset.cfield) { c[t.dataset.cfield] = t.value; save(); }
    else if (t.dataset.field) {
      var k = chunk(c, t.dataset.cid); if (!k) return;
      if (t.dataset.field === 'text' && c.built && !c.practice) textChanged(k, t.value);
      k[t.dataset.field] = t.value; save();
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'file' && e.target.files[0]) { var rd = new FileReader(); rd.onload = function () { importData(rd.result); }; rd.readAsText(e.target.files[0]); }
  });

  /* ---------- start ---------- */
  window.MC = { split: function (t, o) { return Splitter.split(t, o); } };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  render();
})();
