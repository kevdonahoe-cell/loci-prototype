// Run: node test-sr.js
var SR = require('./sr.js'), assert = require('assert');
var t = '2026-10-23';
assert.equal(SR.addDays('2026-10-31', 1), '2026-11-01'); assert.equal(SR.addDays('2026-12-31', 1), '2027-01-01'); assert.equal(SR.addDays('2026-10-23', 30), '2026-11-22');
// new item: good -> 1d, then good ladder 3,7,14,30
var s = SR.newSr(), got = [];
for (var i = 0; i < 5; i++) { s = SR.apply(s, 'good', s.due || t); got.push(s.interval); } // reviewed on the day each falls due
assert.deepEqual(got, [1, 3, 7, 14, 30]);
// easy skips a step
assert.equal(SR.next(SR.newSr(), 'easy', t).interval, 3);
assert.equal(SR.next({ level: 2, interval: 7, lapses: 0, reviews: 3 }, 'easy', t).interval, 30);
// missed resets to 1 day and counts a lapse
var m = SR.next({ level: 4, interval: 30, lapses: 0, reviews: 5 }, 'missed', t); assert.equal(m.interval, 1); assert.equal(m.level, 0); assert.equal(m.lapses, 1);
// hard stays on the same rung with a shorter gap
var h = SR.next({ level: 2, interval: 7, lapses: 0, reviews: 3 }, 'hard', t); assert.equal(h.level, 2); assert.equal(h.interval, 4);
// caps at the top
var top = { level: 6, interval: 120, lapses: 0, reviews: 9 }; assert.equal(SR.next(top, 'easy', t).interval, 120);
// early practice does not change the schedule except Missed
var early = { level: 1, due: '2026-10-26', interval: 3, lapses: 0, reviews: 1 };
assert.strictEqual(SR.apply(early, 'good', t), early); assert.strictEqual(SR.apply(early, 'easy', t), early);
assert.equal(SR.apply(early, 'missed', t).interval, 1);
// due logic
assert.ok(SR.isDue(SR.newSr(), t)); assert.ok(SR.isDue({ due: t }, t)); assert.ok(!SR.isDue({ due: '2026-10-24' }, t)); assert.ok(SR.isDue({ due: '2026-10-01' }, t));
console.log('All scheduling checks passed.');
