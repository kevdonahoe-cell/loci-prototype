// Run: node test-split.js   (all sample text below is invented; no copyrighted text)
var Sp = require('./splitter.js'), assert = require('assert');
var A = ['tend the garden', 'wake early', 'forgive quickly', 'sing in the rain', 'keep their promises', 'listen well', 'laugh at themselves', 'help a stranger'];
var B = ['never go hungry', 'find the door open', 'sleep soundly', 'be warm inside', 'be trusted', 'hear more', 'never run out of jokes', 'have friends everywhere'];
function item(i, c) { return (c ? 'happy' : 'Happy') + ' are those who ' + A[i] + ': they shall ' + B[i]; }
function build(sep, end, lower) { return A.map(function (_, i) { return item(i, lower && i > 0).replace(/^h/, i && lower ? 'h' : 'H') + (i < 7 ? end : '.'); }).join(sep); }
function words(s) { return s.replace(/\d+[.):]?\s/g, ' ').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean); }
function sameWords(orig, parts, label) { assert.deepEqual(words(parts.join(' ')), words(orig), label + ': no words lost or added'); }
function eachMax(parts, max, label) { parts.forEach(function (p) { assert.ok(Sp.wordCount(p) <= max, label + ': piece too long (' + Sp.wordCount(p) + '): ' + p); }); }
function startsHappy(parts, n, label) { assert.equal(parts.length, n, label + ': expected ' + n + ' pieces, got ' + parts.length + ' ' + JSON.stringify(parts)); parts.forEach(function (p, i) { assert.ok(/^happy are those who /i.test(p), label + ': piece ' + i + ' starts right: ' + p); assert.ok(p.indexOf(': they shall') > 0, label + ': colon pair kept together: ' + p); }); }
var n = 0; function ok(m) { n++; }

// 1. eight on separate lines
var lines = A.map(function (_, i) { return item(i) + '.'; }).join('\n'); var r = Sp.split(lines); startsHappy(r, 8, 'lines'); sameWords(lines, r, 'lines'); ok();
// 2. ONE paragraph, sentences separated by spaces
var para = A.map(function (_, i) { return item(i) + '.'; }).join(' '); r = Sp.split(para); startsHappy(r, 8, 'paragraph'); sameWords(para, r, 'paragraph'); ok();
// 3. ONE paragraph separated only by semicolons
var semi = A.map(function (_, i) { return (i ? 'happy' : 'Happy') + ' are those who ' + A[i] + ': they shall ' + B[i]; }).join('; ') + '.'; r = Sp.split(semi); startsHappy(r, 8, 'semicolons'); sameWords(semi, r, 'semicolons'); ok();
// 4. ONE paragraph separated only by spaces (no full stops or semicolons)
var spaces = A.map(function (_, i) { return item(i); }).join(' '); r = Sp.split(spaces); startsHappy(r, 8, 'spaces only'); sameWords(spaces, r, 'spaces only'); ok();
// 5. verse numbers inline, starting part-way through a chapter
var verses = A.map(function (_, i) { return (i + 3) + ' ' + item(i) + '.'; }).join(' '); r = Sp.split(verses); startsHappy(r, 8, 'inline verse numbers'); r.forEach(function (p) { assert.ok(!/^\d/.test(p), 'verse number stripped: ' + p); }); sameWords(verses, r, 'verses'); ok();
// 5b. chapter:verse numbers at line starts, and "1." / "1)" lists
var cv = A.map(function (_, i) { return '5:' + (i + 3) + ' ' + item(i) + '.'; }).join('\n'); startsHappy(Sp.split(cv), 8, 'chapter:verse lines'); ok();
var nl = A.map(function (_, i) { return (i + 1) + '. ' + item(i) + '.'; }).join('\n'); startsHappy(Sp.split(nl), 8, '1. list'); ok();
var np = A.map(function (_, i) { return (i + 1) + ') ' + item(i) + '.'; }).join(' '); startsHappy(Sp.split(np), 8, '1) inline list'); ok();
// 6. numbers that are NOT verse markers do not cause splits
r = Sp.split('We walked 3 miles to the old mill and met 12 sheep on the way, then rested by the river for an hour.'); assert.ok(r.join(' ').indexOf('3 miles') >= 0 && r.join(' ').indexOf('12 sheep') >= 0); ok();
// 7. Kevin's real-life shape: intro paragraph, a sentence, then the eight in ONE paragraph
var kev = 'The crowd gathered on the hillside and the teacher sat down to speak to them.\n\nHe looked at each of them kindly.\n\n' + para;
r = Sp.split(kev); assert.ok(r.length >= 10, 'kevin shape gives ' + r.length + ' pieces'); eachMax(r, 30, 'kevin'); assert.equal(r.filter(function (p) { return /^happy/i.test(p); }).length, 8, 'eight happy pieces'); sameWords(kev, r, 'kevin'); ok();
// 8. preamble before the eight in the same paragraph
var pre = 'Then he began to teach them. ' + para; r = Sp.split(pre); assert.equal(r.length, 9); assert.equal(r[0], 'Then he began to teach them.'); ok();
// 9. long ordinary paragraph (sentences)
var prose = 'The old lighthouse stood at the end of the headland and had guided ships for more than a hundred years. Every evening the keeper climbed the long spiral stairs to light the lamp. In winter the wind howled around the tower so fiercely that the windows rattled in their frames. Visitors came in summer to walk the cliffs and buy ice cream from the little kiosk. When the new automatic light was installed the keeper retired to a cottage nearby and watched the beam from his garden. The children of the town still say the lighthouse hums quietly on calm nights.';
r = Sp.split(prose); assert.ok(r.length >= 6, 'prose pieces ' + r.length); eachMax(r, 30, 'prose'); sameWords(prose, r, 'prose'); ok();
// 10. one very long sentence with commas, no full stops
var longs = 'Take the road past the church, turn left at the bakery, walk along the river until you reach the stone bridge, cross over it slowly, follow the path through the orchard, open the green gate, and wait by the oak tree until someone comes to find you';
r = Sp.split(longs); assert.ok(r.length >= 2); eachMax(r, 30, 'commas'); sameWords(longs, r, 'commas'); ok();
// 11. long run of words with no punctuation at all
var nopunc = new Array(80).join('walking slowly home ').trim(); r = Sp.split(nopunc); eachMax(r, 30, 'nopunc'); sameWords(nopunc, r, 'nopunc'); ok();
// 12. hard-wrapped prose is un-wrapped (not one piece per line)
var wrapped = 'The old lighthouse stood at the end of the headland and had\nguided ships for more than a hundred years. Every evening the keeper\nclimbed the long spiral stairs to light the lamp. In winter the wind\nhowled around the tower so fiercely that the windows rattled.'; r = Sp.split(wrapped); assert.equal(r.length, 3); assert.ok(/years\.$/.test(r[0])); ok();
// 13. short verse lines stay one per line
var poem = 'Our garden is green\nOur gate is wide\nCome in from the rain\nSit down by the fire\nTell us your name'; r = Sp.split(poem); assert.equal(r.length, 5); ok();
// 14. tiny fragments get joined to a neighbour
r = Sp.split('Amen.\n\nHappy are those who sing in the rain: they shall be warm inside.\n\nGo in peace.'); assert.ok(r.every(function (p) { return Sp.wordCount(p) >= 4; }), JSON.stringify(r)); ok();
// 15. size levels: smaller >= balanced >= bigger
var s0 = Sp.split(prose, { level: 0 }), s1 = Sp.split(prose, { level: 1 }), s2 = Sp.split(prose, { level: 2 }); assert.ok(s0.length >= s1.length && s1.length > s2.length, [s0.length, s1.length, s2.length].join(',')); eachMax(s0, 14, 'smaller'); sameWords(prose, s2, 'bigger'); ok();
//  ...and the eight beatitude-shaped items stay eight at 'balanced' but can be joined at 'bigger'
assert.equal(Sp.split(para, { level: 1 }).length, 8); assert.ok(Sp.split(para, { level: 2 }).length < 8); ok();
// 16. very short text is still cut into at least a few stops
r = Sp.split('Happy are those who sing in the rain: they shall be warm inside. Happy are those who listen well: they shall hear more. Happy are those who help a stranger: they shall have friends.'); assert.equal(r.length, 3); ok();
// 17. manual modes are strict
assert.equal(Sp.split('One. Two three.\nFour five.\n\nSix.', { mode: 'blank' }).length, 2); assert.equal(Sp.split('One. Two three.\nFour five.\n\nSix.', { mode: 'line' }).length, 3); assert.equal(Sp.split('One. Two three.\nFour five.\n\nSix.', { mode: 'sentence' }).length, 4); ok();
// 18. abbreviations do not end sentences; empty and odd input
r = Sp.split('Dr. Smith and Mr. Jones walked to St. Mary\u2019s church together on Sunday morning. They sat at the back and listened carefully to the whole homily from beginning to end.', { mode: 'sentence' }); assert.equal(r.length, 2); assert.deepEqual(Sp.split(''), []); assert.deepEqual(Sp.split('   \n\n  '), []); assert.equal(Sp.split('Just one short line.').length, 1); ok();
// 19. Windows line endings and tabs
r = Sp.split(lines.replace(/\n/g, '\r\n')); startsHappy(r, 8, 'CRLF'); ok();
// 20. "split this piece smaller" button
var one = item(0) + '. ' + item(1) + '.'; r = Sp.splitPiece(one); assert.equal(r.length, 2); r = Sp.splitPiece('one two three four five six seven eight nine ten eleven twelve'); assert.ok(r.length >= 2); assert.equal(Sp.splitPiece('Hello').length, 1); ok();
// 21. repeated ordinary word in prose should not cause bad splits
var lord = 'The Lord is my shepherd and I shall not want for anything at all. He makes me lie down in green pastures beside quiet waters. The Lord restores my soul and guides me along the right paths. Even in the darkest valley I fear no evil because the Lord is with me.'; r = Sp.split(lord); assert.ok(r.every(function (p) { return /[.]$/.test(p); }), 'pieces end at full stops: ' + JSON.stringify(r)); ok();
console.log('All ' + n + ' splitter checks passed.');
