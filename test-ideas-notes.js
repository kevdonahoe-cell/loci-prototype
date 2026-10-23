// Run: node test-ideas-notes.js
var I = require('./ideas.js'), N = require('./notes.js'), assert = require('assert');
// keywords
assert.deepEqual(I.keywords('Happy are those who are merciful: they shall have mercy shown them.'), ['merciful']);
var g = I.keywords('Happy are those who tend the garden: they shall never go hungry.'); assert.ok(g.length === 2 && g.indexOf('garden') >= 0, g.join());
var kw = I.keywords('Happy are those who forgive quickly: they shall sleep soundly.'); assert.ok(kw.length === 2 && kw.indexOf('forgive') >= 0, kw.join());
assert.deepEqual(I.keywords(''), []); assert.deepEqual(I.keywords('a the of'), []);
// place phrase
assert.equal(I.place('Front gate'), 'the front gate'); assert.equal(I.place('My bedroom window'), 'my bedroom window'); assert.equal(I.place('Your desk'), 'your desk'); assert.equal(I.place(''), 'this stop');
// three distinct ideas, mention the stop, use a key word, no AI/server
var text = 'Happy are those who forgive quickly: they shall sleep soundly.', ids = I.ideas('Front gate', text, 0);
assert.equal(ids.length, 3); assert.equal(new Set(ids).size, 3);
ids.forEach(function (s) { assert.ok(/front gate|my |the /i.test(s)); assert.ok(s.length < 200, 'short: ' + s); });
assert.ok(ids.some(function (s) { return /forgive|quickly|sleep|soundly/.test(s); }));
var again = I.ideas('Front gate', text, 1); assert.notDeepEqual(again, ids, 'shuffle gives different ideas'); assert.deepEqual(I.ideas('Front gate', text, 0), ids, 'deterministic');
assert.equal(I.ideas('Kitchen', '', 0).length, 3); assert.equal(I.ideas('', 'something memorable here', 0).length, 3);
// notes: privacy
var d = N.empty();
N.addTrail(d, 'screen', 'Check the pieces', '8 pieces', 1000); N.addTrail(d, 'screen', 'Make images', 'stop 3 of 8', 31000); N.addTrail(d, 'event', 'Used an image idea', 'idea 2', 40000);
N.addNote(d, 'Make images', 'I did not know what to do here', 35000); N.addNote(d, 'Walk through', '', 99000);
var x = N.build(d, { viewport: '390x844' }, 123456), json = JSON.stringify(x);
assert.equal(x.notes.length, 2); assert.equal(x.notes[1].text, ''); assert.equal(x.trail[0].secondsHere, 30);
var txt = N.asText(x); assert.ok(txt.indexOf('I did not know what to do here') > 0 && txt.indexOf('Make images') > 0);
assert.equal(N.sane(null).notes.length, 0); assert.equal(N.sane({ notes: 'x', trail: 5 }).trail.length, 0);
var big = N.empty(); for (var i = 0; i < 900; i++) N.addTrail(big, 'screen', 's' + i); assert.equal(big.trail.length, 600);
var long = N.empty(); N.addNote(long, 's', new Array(500).join('x')); assert.equal(long.notes[0].text.length, 300);
console.log('Ideas and notes checks passed.');
