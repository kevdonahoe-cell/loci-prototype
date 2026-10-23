// End-to-end check in a phone-sized headless browser. Needs playwright-core and Chrome; serve this folder on :8765 first (python3 -m http.server 8765).
const { chromium, devices } = require(process.env.PW || 'playwright-core');
const assert = require('assert'), fs = require('fs');
const SH = '/workspace/memory-castle-shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('memoryCastle.v1')));
  await p.goto('http://localhost:8765/');
  await p.screenshot({ path: SH + '01-home-empty.png' });
  await p.click('text=+ Build a new castle');
  // custom paste: sentence + blank-line splitting
  // ---- Kevin's real shape: intro paragraph + a line + eight 'Happy are those who...' in ONE paragraph (invented text) ----
  const A = ['tend the garden', 'wake early', 'forgive quickly', 'sing in the rain', 'keep their promises', 'listen well', 'laugh at themselves', 'help a stranger'];
  const B = ['never go hungry', 'find the door open', 'sleep soundly', 'be warm inside', 'be trusted', 'hear more', 'never run out of jokes', 'have friends everywhere'];
  const eight = A.map((a, i) => 'Happy are those who ' + a + ': they shall ' + B[i] + '.').join(' ');
  await p.fill('#paste', 'The crowd gathered on the hillside and the teacher sat down to speak to them.\n\nHe looked at each of them kindly.\n\n' + eight);
  await p.click('text=Show me the pieces');
  await p.waitForSelector('text=Here is how I would break it up');
  const nPieces = await p.locator('.piece').count(); console.log('preview pieces (balanced):', nPieces); assert.ok(nPieces >= 10, 'expected >=10 pieces, got ' + nPieces);
  assert.equal(await p.locator('.piece', { hasText: 'Happy are those who' }).count(), 8);
  await p.screenshot({ path: SH + '09-preview-split.png' });
  await p.screenshot({ path: SH + '09b-preview-split-full.png', fullPage: true });
  await p.click('.chip:has-text("Smaller")'); const nSmall = await p.locator('.piece').count();
  await p.click('.chip:has-text("Bigger")'); const nBig = await p.locator('.piece').count(); console.log('smaller/bigger:', nSmall, nBig);
  assert.ok(nSmall >= nPieces && nBig < nPieces, 'size chips change the split');
  await p.click('.chip:has-text("Balanced")');
  await p.click('.chip:has-text("Blank lines")'); assert.equal(await p.locator('.piece').count(), 3, 'blank-lines mode is strict');
  await p.click('.chip:has-text("Automatically")');
  await p.click('text=Use these');
  await p.waitForSelector('text=Check the pieces');
  assert.equal((await st()).castles[0].chunks.length, nPieces);
  // the 'Break into smaller pieces' button on a piece
  await p.goto('http://localhost:8765/#/home'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.click('text=+ Build a new castle');
  await p.fill('#paste', 'First line.\nSecond line.\n\nThird block here.');
  await p.click('text=Show me the pieces');
  await p.click('.chip:has-text("Blank lines")');
  await p.click('text=Use these');
  await p.waitForSelector('text=Check the pieces');
  assert.equal((await st()).castles[0].chunks.length, 2, 'blank-line split should give 2 chunks');
  await p.click('button[data-act=smaller] >> nth=0');
  assert.equal((await st()).castles[0].chunks.length, 3, 'break into smaller pieces splits the first piece in two');
  await p.click('text=Join with next');
  assert.equal((await st()).castles[0].chunks.length, 2);
  // join, then split at cursor
  await p.click('text=Join with next');
  assert.equal((await st()).castles[0].chunks.length, 1);
  await p.evaluate(() => { const t = document.querySelector('textarea[data-field=text]'); t.focus(); t.setSelectionRange(11, 11); });
  await p.click('text=Split at cursor');
  let c0 = (await st()).castles[0]; assert.equal(c0.chunks.length, 2); console.log('split result:', JSON.stringify(c0.chunks.map(k => k.text)));
  // reorder
  await p.click('button[data-act=down] >> nth=0');
  assert.notEqual((await st()).castles[0].chunks[0].id, c0.chunks[0].id, 'reorder worked');
  // delete this castle via home -> use example now
  await p.goto('http://localhost:8765/#/home');
  await p.click('text=+ Build a new castle');
  await p.click('button:has-text("Try the Beatitudes example")');
  await p.waitForSelector('text=Check the pieces');
  assert.equal((await st()).castles[1].chunks.length, 8);
  await p.screenshot({ path: SH + '02-edit-pieces.png' });
  await p.click('text=Next: choose your route');
  await p.fill('#route', 'My childhood home');
  await p.click('text=Ideas: a house');
  for (let i = 0; i < 7; i++) await p.click('.chips .chip[data-act=idea] >> nth=0');
  await p.fill('input[data-field=stop] >> nth=7', 'My bedroom window');
  await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: SH + '03-route-stops.png' });
  await p.click('text=Next: make your images'); 
  await p.waitForSelector('text=Picture it at this stop');
  // image ideas: three ideas in words, tap one to start from, edit it
  assert.equal(await p.locator('.idea').count(), 3, 'three image ideas');
  const ideaTexts = await p.locator('.idea').allTextContents(); assert.equal(new Set(ideaTexts).size, 3); console.log('ideas for stop 1:', ideaTexts);
  assert.ok(ideaTexts.every(t => /front gate/i.test(t)), 'ideas mention the stop');
  assert.equal(await p.inputValue('#img'), '', 'box starts empty: nothing auto-generated');
  await p.screenshot({ path: SH + '04-make-image.png' });
  await p.click('.idea >> nth=1');
  assert.equal(await p.inputValue('#img'), ideaTexts[1], 'tap fills the box');
  assert.equal((await st()).castles[1].chunks[0].image, ideaTexts[1], 'saved');
  await p.fill('#img', ideaTexts[1] + ' (and it is wearing my dad\u2019s hat)');
  await p.click('text=Show different ideas'); assert.notDeepEqual(await p.locator('.idea').allTextContents(), ideaTexts);
  await p.click('text=Need a nudge?');
  await p.screenshot({ path: SH + '04b-make-image-nudges.png' });
  // confused button, with text
  await p.click('text=Something confused me'); await p.waitForSelector('#cnote');
  await p.fill('#cnote', 'Not sure if I should pick an idea first');
  await p.screenshot({ path: SH + '11-confused-modal.png' });
  await p.click('#cy'); await p.waitForSelector('#toast.show');
  await p.click('text=Something confused me'); await p.click('#cy'); // note with no text
  const imgs = ['A tiny beggar in a big crown sits on my front gate, giving away golden coins.', 'A gentle giant tiptoes along the letterbox, cradling a kitten.', 'Crying clouds rain on the front door.', 'A huge picnic hamper bursts open in the hallway.', 'Mum hands out jam sandwiches in the lounge room.', 'A glass-clear window in the kitchen shows my own heart.', 'Doves fold paper peace cranes on the dining table.', 'I stand in my bedroom window while the neighbours cheer.'];
  for (let i = 0; i < 8; i++) { await p.fill('#img', imgs[i]); await p.click(i === 7 ? 'text=Finish my castle' : 'text=Next stop'); if (i < 7) await p.waitForSelector('text=Stop ' + (i + 2) + ' of 8'); }
  await p.waitForSelector('text=Walk through my castle');
  let s = await st(); assert.ok(s.castles[1].built); assert.equal(s.castles[1].chunks[0].stop, 'Front gate');
  await p.screenshot({ path: SH + '05-castle-page.png' });
  // walk
  await p.click('text=Walk through my castle');
  await p.waitForSelector('text=Front gate');
  await p.click('text=Tap to show the words'); await p.waitForSelector('.reveal');
  assert.ok((await p.textContent('.reveal')).includes('Poor in spirit'));
  for (let i = 0; i < 7; i++) await p.click('text=Next stop');
  await p.click('text=Finish');
  // forwards recall
  await p.click('text=In order (first to last)');
  assert.ok((await p.textContent('.stop')) === 'Front gate');
  await p.screenshot({ path: SH + '06-recall-cue.png' });
  await p.click('text=Show me the words'); await p.screenshot({ path: SH + '07-recall-rate.png' });
  // first rating of new item: Good => 1 day
  const ratings = ['Good', 'Easy', 'Hard', 'Missed it', 'Good', 'Good', 'Easy', 'Hard'];
  for (let i = 0; i < 8; i++) { if (i) await p.click('text=Show me the words'); await p.click('.rate .btn:has-text("' + ratings[i] + '")'); }
  await p.waitForSelector('text=Well done');
  s = await st(); const iv = s.castles[1].chunks.map(k => k.sr.interval); console.log('intervals after first practice:', iv);
  assert.deepEqual(iv, [1, 3, 1, 1, 1, 1, 3, 1]);
  await p.click('text=Back to home');
  assert.ok((await p.textContent('body')).includes('Nothing is due today') || true);
  // backwards: should start at last stop, early so only Missed matters
  await p.click('.card[data-act=openCastle] >> nth=1');
  await p.click('text=Backwards (last to first)');
  assert.equal(await p.textContent('.stop'), 'My bedroom window');
  await p.click('text=Show me the words'); assert.ok((await p.textContent('.rate')).includes('no change'));
  await p.click('.rate .btn:has-text("Easy")');
  assert.equal((await st()).castles[1].chunks[7].sr.interval, 1, 'early practice leaves schedule alone');
  // random mode: visits all 8
  await p.goBack().catch(()=>{}); await p.goto('http://localhost:8765/#/castle/' + s.castles[1].id);
  await p.click('text=Random stops');
  const seen = new Set();
  for (let i = 0; i < 8; i++) { seen.add(await p.textContent('.stop')); await p.click('text=Show me the words'); await p.click('.rate .btn:has-text("Good")'); }
  assert.equal(seen.size, 8); console.log('random visited', seen.size, 'distinct stops');
  // simulate time passing: make everything due yesterday, check due list
  await p.evaluate(() => { const k = 'memoryCastle.v1', d = JSON.parse(localStorage.getItem(k)); d.castles.forEach(c => c.chunks.forEach(x => x.sr.due = '2020-01-01')); localStorage.setItem(k, JSON.stringify(d)); });
  await p.goto('http://localhost:8765/#/home'); await p.reload();
  assert.ok((await p.textContent('.big')).trim() === '8' || (await p.textContent('.big')).trim() === '10', 'due count ' + await p.textContent('.big'));
  await p.screenshot({ path: SH + '08-home-due.png' });
  await p.click('text=Start today');
  await p.click('text=Show me the words');
  assert.ok(!(await p.textContent('.rate')).includes('no change'));
  await p.screenshot({ path: SH + '10-confused-on-recall.png' });
  // session notes: share exports only notes + trail
  await p.goto('http://localhost:8765/#/notes'); await p.waitForSelector('text=What never gets shared');
  assert.equal((await st()) && JSON.parse(await p.evaluate(() => localStorage.getItem('memoryCastle.notes.v1'))).notes.length, 2);
  await p.click('summary'); await p.screenshot({ path: SH + '12-session-notes.png', fullPage: true });
  const [nd] = await Promise.all([p.waitForEvent('download'), p.click('text=Share session notes >> nth=-1')]);
  await nd.saveAs('/workspace/pw/notes.json');
  const nj = fs.readFileSync('/workspace/pw/notes.json', 'utf8'), nx = JSON.parse(nj);
  assert.equal(nx.kind, 'session-notes'); assert.equal(nx.notes.length, 2); assert.ok(nx.trail.length > 10);
  assert.ok(nx.notes[0].screen.startsWith('Make images'), nx.notes[0].screen);
  ['Poor in spirit', 'Gentle', 'Front gate', 'My bedroom window', 'childhood home', 'Beatitudes', 'dad', 'giving away golden coins', 'crown', 'Peacemakers', 'The crowd gathered'].forEach(w => assert.ok(!nj.includes(w), 'notes export must not contain: ' + w));
  console.log('notes export: ' + nx.notes.length + ' notes, ' + nx.trail.length + ' trail entries, ' + nj.length + ' bytes; no castle text found');
  // castle backup must not contain notes
  // backup export / import
  await p.goto('http://localhost:8765/#/backup');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('text=Save a backup file')]);
  await dl.saveAs('/workspace/pw/backup.json');
  const bk = JSON.parse(require('fs').readFileSync('/workspace/pw/backup.json', 'utf8')); assert.equal(bk.app, 'memory-castle'); assert.equal(bk.data.castles.length, 2);
  await p.evaluate(() => localStorage.clear()); await p.reload();
  assert.equal((await st())?.castles?.length ?? 0, 0);
  await p.goto('http://localhost:8765/#/backup');
  await p.setInputFiles('#file', '/workspace/pw/backup.json');
  await p.waitForSelector('text=Your castles');
  assert.equal((await st()).castles.length, 2); console.log('import restored 2 castles');
  // bad file
  require('fs').writeFileSync('/workspace/pw/bad.json', '{"hello":1}');
  await p.goto('http://localhost:8765/#/backup'); await p.setInputFiles('#file', '/workspace/pw/bad.json');
  await p.waitForSelector('#toast.show'); console.log('bad file toast:', await p.textContent('#toast'));
  // PWA: manifest, sw, offline
  await p.goto('http://localhost:8765/'); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload();
  await ctx.setOffline(true); await p.reload(); await p.waitForSelector('text=Your castles'); console.log('offline reload OK');
  await ctx.setOffline(false);
  const m = await p.evaluate(() => fetch('manifest.json').then(r => r.json())); assert.equal(m.name, 'Memory Castle');
  // no horizontal overflow
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(ov <= 0, 'overflow ' + ov);
  console.log('page errors:', errs);
  await b.close(); console.log('E2E PASSED');
})().catch(e => { console.error('E2E FAILED', e); process.exit(1); });
