// Run: node test-ideas-notes.js
var I = require('./ideas.js'), N = require('./notes.js'), assert = require('assert');
// keywords
assert.deepEqual(I.keywords('Happy are those who are merciful: they shall have mercy shown them.'), ['merciful']);
var g = I.keywords('Happy are those who tend the garden: they shall never go hungry.'); assert.ok(g.length === 2 && g.indexOf('garden') >= 0, g.join());
var kw = I.keywords('Happy are those who forgive quickly: they shall sleep soundly.'); assert.ok(kw.length === 2 && kw.indexOf('forgive') >= 0, kw.join());
assert.deepEqual(I.keywords(''), []); assert.deepEqual(I.keywords('a the of'), []);
// place phrase
assert.equal(I.place('Front gate'), 'the front gate'); assert.equal(I.place('My bedroom window'), 'my bedroom window'); assert.equal(I.place('Your desk'), 'your desk'); assert.equal(I.place(''), 'this stop');
// ideas (v0.4): several different ideas, concrete pictures for abstract words, place interaction, grammar
var text = 'Happy are those who mourn: they shall be comforted.', ids = I.ideas('Front door', text, 0);
assert.ok(ids.length >= 4 && new Set(ids).size === ids.length); assert.deepEqual(I.ideas('Front door', text, 0), ids, 'deterministic');
ids.forEach(function (s) { assert.ok(/front door/i.test(s), s); assert.ok(s.length < 420, 'short enough: ' + s); assert.ok(!/undefined|\[object/.test(s)); assert.ok(/^(Picture|Imagine|See) /.test(s)); });
assert.ok(ids.some(function (s) { return /bucket filling with tears/.test(s); }) && ids.some(function (s) { return /warm woolly blanket/.test(s); }), 'mourn and comfort become pictures');
assert.notDeepEqual(I.ideas('Front door', text, 1), ids, 'seed rotates');
assert.ok(I.size >= 120, 'word list size ' + I.size);
function first(t) { return I.ideas('Hall', t, 0)[0]; }
assert.ok(/lightbulb/.test(first('understanding'))); assert.ok(/bandage/.test(first('the merciful'))); assert.ok(/blanket/.test(first('comforted'))); assert.ok(/empty pockets/.test(first('the poor'))); assert.ok(/crown/.test(first('kingdom'))); assert.ok(/lamb/.test(first('the meek'))); assert.ok(/scales/.test(first('what is right'))); assert.ok(/snow/.test(first('the pure'))); assert.ok(/dove/.test(first('peacemakers'))); assert.ok(/chains/.test(first('persecuted')));
// agreement: plural pictures get plural verbs
assert.ok(/They (are|leave)/.test(first('the poor')) && !/It (is|leaves)/.test(first('the poor')), first('the poor'));
assert.ok(/ It (is|leaves)/.test(first('the merciful')) && !/They (are|leave)/.test(first('the merciful')));
// sacred subjects stay gentle
I.ideas('Altar', 'they shall see God', 0).forEach(function (s) { assert.ok(!/crash|burst|shout|chase|tickle|squeak|bang/i.test(s), s); });
// unknown words fall back to a sign, and no text still works
assert.ok(/neon sign/.test(I.ideas('Gate', 'Remember the umbrella', 0)[0]));
assert.ok(I.ideas('Kitchen', '', 0).length >= 1); assert.ok(/this stop/.test(I.ideas('', 'something memorable here', 0)[0]));
// awkward stops
assert.ok(/art on right side of Foyer/.test(I.ideas('art on right side of Foyer', 'the merciful', 0)[0]));
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
