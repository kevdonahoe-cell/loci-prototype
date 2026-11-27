// v0.4 checks: backup/restore, idea button, first-castle example, old data loads unchanged. Serve this folder on :8765 first.
const { chromium } = require(process.env.PW || 'playwright-core'); const assert = require('assert'), fs = require('fs');
const SH = '/workspace/memory-castle-shots/', U = 'http://localhost:8765/';
const sr = (due) => ({ step: 1, due, reps: 1 });
const mk = (id, stop, text, image, due) => ({ id, stop, text, image, sr: sr(due || '2026-11-01') });
const OLD = { prefs: { introSkipped: true }, castles: [
  { id: 'c1', title: 'Beatitudes', route: 'Church', built: true, created: 1, chunks: [mk('a', 'Font', 'How happy are the poor in spirit', 'A bucket of empty pockets'), mk('b', 'Pew', 'Happy the gentle', 'A lamb in the pew'), mk('c', 'Front door', 'Happy those who mourn: they shall be comforted', 'Tears fill the door')] },
  { id: 'c2', title: 'Second castle', route: 'Home', built: false, created: 2, chunks: [mk('d', 'Hall table', 'Happy the merciful', ''), mk('e', 'Art on right side of Foyer', 'Happy the pure in heart', '')] } ] };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const newCtx = async (seed, extra) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
    await ctx.addInitScript(([seed, extra]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); if (seed) localStorage.setItem('memoryCastle.v1', JSON.stringify(seed)); if (extra) eval(extra); }, [seed, extra || '']);
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); return { ctx, p }; };
  const st = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('memoryCastle.v1')));
  const strip = (s) => JSON.parse(JSON.stringify(s)).castles;

  // ---- 1. old v0.3.2 data loads unchanged, and the reminder shows (never backed up)
  let { ctx, p } = await newCtx(OLD);
  await p.goto(U); await p.waitForSelector('text=Your castles');
  assert.deepEqual(strip(await st(p)), strip(OLD), 'old castles unchanged after load');
  assert.ok((await p.textContent('body')).includes('Time for a backup?') && (await p.textContent('body')).includes('not saved a backup yet'));
  await p.click('text=Beatitudes'); await p.waitForSelector('text=Walk through'); assert.deepEqual(strip(await st(p)), strip(OLD), 'opening a castle changes nothing');
  await p.goto(U + '#/home'); await p.waitForSelector('text=Your castles'); await p.screenshot({ path: SH + '27-backup-reminder.png' });
  // practice still works and does not trigger the "changes" reminder by itself
  await p.click('text=Start today'); await p.waitForSelector('text=Show me'); await p.click('text=Show me'); await p.click('.rate .btn >> nth=2'); await p.waitForSelector('.reveal, text=Did you remember it?', { timeout: 2000 }).catch(() => {});
  console.log('practice runs');

  // ---- 2. backup round trip
  await p.goto(U + '#/backup'); await p.waitForSelector('text=Save a backup');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Save a backup")')]);
  assert.ok(/^memory-castle-backup-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  await dl.saveAs('/workspace/pw/v04-backup.json'); const bk = JSON.parse(fs.readFileSync('/workspace/pw/v04-backup.json', 'utf8'));
  assert.equal(bk.app, 'memory-castle'); assert.equal(bk.version, 2); assert.equal(bk.data.castles.length, 2); assert.ok(bk.notes && Array.isArray(bk.notes.notes), 'notes included'); assert.ok(bk.data.castles[0].chunks[0].sr, 'progress included');
  await p.waitForSelector('text=Last backup:'); assert.ok(await p.locator('#dl').count(), 'fallback link shown'); await p.screenshot({ path: SH + '28-backup-screen.png' });
  await p.goto(U + '#/home'); await p.waitForSelector('text=Your castles'); assert.ok(!(await p.textContent('body')).includes('Time for a backup?'), 'reminder gone after backup');
  // a castle change brings it back; 14 days also; "later" hides it
  await p.goto(U + '#/edit/c1'); await p.waitForSelector('textarea'); await p.fill('textarea >> nth=0', 'How happy are the poor in spirit!'); await p.goto(U + '#/home'); await p.waitForSelector('text=Your castles');
  assert.ok((await p.textContent('body')).includes('changes since your last backup'), 'change reminder');
  await p.click('text=Remind me tomorrow'); assert.ok(!(await p.textContent('body')).includes('Time for a backup?'));
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('memoryCastle.v1')); d.prefs.lastBackup = Date.now() - 15 * 86400000; d.prefs.changedAt = d.prefs.lastBackup - 1; delete d.prefs.remindAfter; localStorage.setItem('memoryCastle.v1', JSON.stringify(d)); });
  await p.reload(); await p.waitForSelector('text=15 days since your last backup'); console.log('reminders: never, change, 14 days, snooze OK');
  assert.deepEqual(p.errs, []); await ctx.close();

  // ---- 3. share sheet path (iOS): navigator.share with a File
  ({ ctx, p } = await newCtx(OLD, "window.__shared = null; navigator.canShare = (d) => !!(d && d.files && d.files.length); navigator.share = (d) => { return d.files[0].text().then(t => { window.__shared = { name: d.files[0].name, type: d.files[0].type, text: t }; }); };"));
  await p.goto(U + '#/backup'); await p.click('button:has-text("Save a backup")'); await p.waitForFunction(() => window.__shared);
  const sh = await p.evaluate(() => window.__shared); assert.ok(sh.name.endsWith('.json') && sh.type === 'application/json'); assert.equal(JSON.parse(sh.text).data.castles.length, 2);
  await p.waitForSelector('text=Last backup:'); assert.equal(await p.locator('#dl').count(), 0, 'no download link when the share sheet worked'); console.log('navigator.share with File OK');
  await ctx.close();
  // share cancelled -> not marked as backed up
  ({ ctx, p } = await newCtx(OLD, "navigator.canShare = () => true; navigator.share = () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' }));"));
  await p.goto(U + '#/backup'); await p.click('button:has-text("Save a backup")'); await p.waitForTimeout(400); assert.ok(!(await st(p)).prefs.lastBackup, 'cancelled share is not a backup'); await ctx.close();

  // ---- 4. restore: replace, merge, cancel, bad files
  ({ ctx, p } = await newCtx({ castles: [], prefs: { introSkipped: true } }));
  await p.goto(U + '#/backup'); await p.setInputFiles('#file', '/workspace/pw/v04-backup.json'); await p.waitForSelector('text=Restore this backup?');
  assert.ok((await p.textContent('.modal')).includes('2 castles') && (await p.textContent('.modal')).includes('5 pieces')); await p.screenshot({ path: SH + '29-restore-choice.png' });
  await p.click('#rc'); assert.equal((await st(p)).castles.length, 0, 'cancel changes nothing');
  await p.setInputFiles('#file', '/workspace/pw/v04-backup.json'); await p.waitForSelector('#rr'); await p.click('#rr'); await p.waitForSelector('text=Your castles');
  const rs = await st(p); assert.equal(rs.castles.length, 2); assert.equal(rs.castles[0].chunks[0].text, 'How happy are the poor in spirit', 'restored the backed-up text'); assert.deepEqual(rs.castles[1], bk.data.castles[1]);
  // merge: local c1 differs, c3 only local; backup has c1 and c2
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('memoryCastle.v1')); d.castles = d.castles.filter(c => c.id === 'c1'); d.castles[0].title = 'Local title'; d.castles.push({ id: 'c3', title: 'Only here', route: '', built: true, chunks: [{ id: 'z', stop: 's', text: 't', image: 'i', sr: { step: 0, due: '2026-12-01', reps: 0 } }] }); localStorage.setItem('memoryCastle.v1', JSON.stringify(d)); });
  await p.reload(); await p.goto(U + '#/backup'); await p.setInputFiles('#file', '/workspace/pw/v04-backup.json'); await p.waitForSelector('#rm'); await p.click('#rm'); await p.waitForSelector('text=Your castles');
  const ms = await st(p); assert.deepEqual(ms.castles.map(c => c.id).sort(), ['c1', 'c2', 'c3']); assert.equal(ms.castles.find(c => c.id === 'c1').title, 'Local title', 'merge keeps what is here'); console.log('restore: cancel, replace, merge OK');
  // bad files
  for (const [n, t] of [['bad1', '{not json'], ['bad2', '{"hello":1}'], ['bad3', JSON.stringify({ app: 'memory-castle', version: 2, data: { castles: [] } })], ['bad4', JSON.stringify({ app: 'memory-castle', data: { castles: [{ id: 'x', chunks: 'no' }] } })]]) {
    fs.writeFileSync('/workspace/pw/' + n + '.json', t); await p.goto(U + '#/backup'); await p.setInputFiles('#file', '/workspace/pw/' + n + '.json'); await p.waitForSelector('#toast.show');
    assert.ok((await p.textContent('#toast')).includes('does not look like'), n); assert.equal(await p.locator('.modal').count(), 0); await p.waitForTimeout(2700); }
  // an old v1 backup (no notes, no version 2) still restores, and damaged fields are repaired
  fs.writeFileSync('/workspace/pw/old1.json', JSON.stringify({ app: 'memory-castle', version: 1, exportedAt: '2026-11-01T00:00:00Z', data: { castles: [{ id: 'q', title: 5, chunks: [{ text: 'hello' }, null] }], prefs: {} } }));
  await p.goto(U + '#/backup'); await p.setInputFiles('#file', '/workspace/pw/old1.json'); await p.waitForSelector('#rr'); await p.click('#rr'); await p.waitForSelector('text=Your castles');
  const o1 = (await st(p)).castles[0]; assert.equal(o1.title, 'My castle'); assert.equal(o1.chunks.length, 1); assert.ok(o1.chunks[0].id && o1.chunks[0].sr && o1.chunks[0].sr.level === -1); console.log('bad files rejected; v1 backup repaired and restored');
  assert.deepEqual(p.errs, []); await ctx.close();

  // ---- 5. idea button: first castle shows a worked example, others start with just the button
  ({ ctx, p } = await newCtx(OLD));
  await p.goto(U + '#/images/c1/0'); await p.waitForSelector('text=Picture it at this stop');
  assert.equal(await p.locator('#ideatext').count(), 0, 'filled box: no example'); await p.fill('#img', ''); await p.evaluate(() => document.getElementById('img').dispatchEvent(new Event('input', { bubbles: true })));
  await p.reload(); await p.waitForSelector('#ideatext');
  assert.equal(await p.inputValue('#img'), '', 'box empty'); assert.ok((await p.textContent('.card.gold')).includes('An example, to show how it works'));
  const ex = await p.textContent('#ideatext'); assert.ok(/font/i.test(ex)); await p.screenshot({ path: SH + '30-first-castle-example.png' });
  await p.click('text=Different idea'); const ex2 = await p.textContent('#ideatext'); assert.notEqual(ex, ex2); await p.click('text=Use this idea'); assert.equal(await p.inputValue('#img'), ex2); assert.equal((await st(p)).castles[0].chunks[0].image, ex2);
  assert.equal(await p.locator('#ideatext').count(), 0, 'idea card closes after use'); assert.equal(await p.locator('text=Give me an idea').count(), 1);
  await p.goto(U + '#/images/c2/0'); await p.waitForSelector('text=Picture it at this stop');
  assert.equal(await p.locator('#ideatext').count(), 0, 'second castle: no pre-shown idea'); assert.equal(await p.inputValue('#img'), '');
  await p.click('text=Give me an idea'); const a1 = await p.textContent('#ideatext'); assert.ok(/hall table/i.test(a1) && /bandage|first-aid/.test(a1), a1);
  const seen = new Set([a1]); for (let i = 0; i < 5; i++) { await p.click('text=Different idea'); seen.add(await p.textContent('#ideatext')); } assert.ok(seen.size >= 4, 'different ideas: ' + seen.size);
  await p.click('text=Use this idea'); assert.ok((await p.inputValue('#img')).length > 40);
  // next stop is back to just a button; the long-stop move still works
  await p.click('text=Next stop'); await p.waitForSelector('text=Stop 2 of 2'); assert.equal(await p.locator('#ideatext').count(), 0); assert.equal(await p.inputValue('#img'), '');
  await p.goto(U + '#/images/c2/1'); await p.click('text=Give me an idea'); await p.waitForSelector('#ideatext'); assert.ok(/art on right side of Foyer/i.test(await p.textContent('#ideatext'))); await p.screenshot({ path: SH + '31-give-me-an-idea.png' });
  assert.deepEqual(p.errs, []); await ctx.close();
  await b.close(); console.log('V0.4 CHECKS PASSED');
})().catch(e => { console.error('V0.4 FAILED', e); process.exit(1); });
