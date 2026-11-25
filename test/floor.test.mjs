import { test } from 'node:test';
import assert from 'node:assert/strict';
import F from '../src/floor.mjs';
import { oracle, FLOOR_TASKS } from './_oracle.mjs';

test('the seed works out whole-number arithmetic itself, exactly, with no model', () => {
  for (const [text, want] of [['2 + 2', 4n], ['7 × 6', 42n], ['10 × 10 - 1', 99n], ['2 + 3 × 4', 14n], ['(2 + 3) × 4', 20n], ['100 - 40 - 10', 50n], ['0', 0n]]) assert.equal(F.arith(text), want, text);
  // digits up to and including 9, read whole (a run must not stop at a 9)
  for (const [text, want] of [['9', 9n], ['99', 99n], ['19 + 1', 20n], ['9 × 9', 81n], ['909 - 9', 900n]]) assert.equal(F.arith(text), want, text);
  for (const bad of ['', '2 +', '+ 2', '2 2', '2 / 2', '2.5 + 1', 'p + 1', '2 + (3', '(2 + 3', '2 )', 'x', null, undefined, 5]) assert.equal(F.arith(bad), null, JSON.stringify(bad));
  // the size limit, to the digit: a value of exactly ten-to-the-fortieth is held, one past it is not, either sign
  const E = '100000000000000000000'; // ten to the twentieth; E × E = ten to the fortieth = the limit
  assert.equal(F.arith(`${E} × ${E}`), 10n ** 40n, 'exactly the limit is held');
  assert.equal(F.arith(`${E} × ${E} + 1`), null, 'one past the limit is not');
  assert.equal(F.arith(`0 - ${E} × ${E}`), -(10n ** 40n), 'exactly minus the limit is held');
  assert.equal(F.arith(`0 - ${E} × ${E} - 1`), null, 'one past minus the limit is not');
  assert.equal(F.arith(`${'9'.repeat(40)} × ${'9'.repeat(40)}`), null);
});

test('the floor arithmetic is total: no string, however broken, makes it throw', () => {
  let s = 7 >>> 0; const r = (n) => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) % n; };
  const chars = ['0', '1', '2', '9', ' ', '+', '-', '×', '*', '(', ')', ')', '(', 'x', '.', '/'];
  for (let k = 0; k < 8000; k++) { const text = Array.from({ length: 1 + r(10) }, () => chars[r(chars.length)]).join(''); assert.doesNotThrow(() => F.arith(text), text); }
});

test('the reply is read at the floor as the last whole number it writes', () => {
  assert.equal(F.lastWhole('the answer is 42'), 42n);
  assert.equal(F.lastWhole('132 then 42.'), 42n);
  assert.equal(F.lastWhole('-7'), -7n);
  for (const bad of ['no number', '', null, undefined, {}]) assert.equal(F.lastWhole(bad), null);
});

test('two axiom floors are recognised; nothing else is, and each is a verdict the seed re-derives', () => {
  assert.deepEqual(Object.keys(F.FLOORS).sort(), ['byte-equality', 'exact-arithmetic']);
  assert.equal(F.recognised('exact-arithmetic'), true);
  assert.equal(F.recognised('byte-equality'), true);
  assert.equal(F.recognised('vibes'), false);
  assert.equal(F.recognised(''), false);
  // exact-arithmetic: the sum equals the number the reply ends on
  assert.equal(F.ground('exact-arithmetic', { ask: '7 × 6' }, 'it is 42'), true);
  assert.equal(F.ground('exact-arithmetic', { ask: '7 × 6' }, 'it is 41'), false);
  // byte-equality: the reply is the source's own bytes and holds what was wanted
  const t = { source: 'The unit price is 126 pounds.', want: '126' };
  assert.equal(F.ground('byte-equality', t, 'The unit price is 126 pounds.'), true);
  assert.equal(F.ground('byte-equality', t, 'The unit price is 12 pounds.'), false, 'not the source bytes');
  assert.equal(F.ground('byte-equality', t, 'pounds.'), false, 'the source bytes, but not the figure');
  assert.equal(F.ground('byte-equality', t, ''), false, 'an empty reply cites nothing');
  assert.equal(F.ground('byte-equality', { source: 'The unit price is 126 pounds.', want: '' }, 'The unit price is 126 pounds.'), false, 'nothing wanted, nothing cited');
  assert.equal(F.ground('vibes', t, 'anything'), null, 'an unknown floor grounds nothing');
  // a name that is a property of plain objects but not a floor the seed declared is not recognised
  assert.equal(F.recognised('toString'), false);
  assert.equal(F.recognised('hasOwnProperty'), false);
  assert.equal(F.ground('toString', t, 'x'), null);
});

test('probe measures what the model gets right cold at the floor; total on a model that throws', () => {
  const r = F.probe(oracle, FLOOR_TASKS);
  assert.equal(r.asked, 4); assert.equal(r.right, 4); assert.equal(r.rate, 1);
  assert.deepEqual(r.rows.map((x) => x.ok), [true, true, true, true]);
  const half = F.probe((t) => (t.id === 'a1' ? oracle(t) : 'nonsense'), FLOOR_TASKS);
  assert.equal(half.right, 1); assert.equal(half.rate, 0.25);
  assert.doesNotThrow(() => F.probe(() => { throw new Error('x'); }, FLOOR_TASKS));
  assert.equal(F.probe(() => { throw new Error('x'); }, FLOOR_TASKS).right, 0);
  assert.deepEqual([F.probe(oracle, null).asked, F.probe(oracle, []).rate], [0, 0]);
});
