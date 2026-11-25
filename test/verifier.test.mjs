import { test } from 'node:test';
import assert from 'node:assert/strict';
import V from '../src/verifier.mjs';

test('the strength order, weakest-root: a facet is only as strong as the weakest bond beneath it', () => {
  assert.deepEqual(V.ORDER, ['unknown', 'grounded', 'proven']);
  assert.ok(V.rank('proven') > V.rank('grounded') && V.rank('grounded') > V.rank('unknown'));
  assert.equal(V.weakest(['proven', 'proven']), 'proven');
  assert.equal(V.weakest(['proven', 'grounded']), 'grounded');
  assert.equal(V.weakest(['grounded', 'unknown', 'proven']), 'unknown');
  assert.equal(V.weakest([]), 'unknown');
  assert.equal(V.weakest(null), 'unknown');
  assert.doesNotThrow(() => V.weakest(null));
  assert.equal(V.weakest(['proven']), 'proven', 'one strength is its own weakest');
  assert.equal(V.rank('nonsense'), 0);
  assert.equal(V.rank('unknown'), 0); assert.equal(V.rank('grounded'), 1); assert.equal(V.rank('proven'), 2);
});

test('a verifier is well-formed only with a recognised floor, a known strength, and a check', () => {
  assert.equal(V.wellFormed(V.REFERENCE.proven), true);
  assert.equal(V.wellFormed(V.REFERENCE.grounded), true);
  assert.equal(V.wellFormed({ name: 'x', floor: 'vibes', strength: 'proven', check: () => true }), false, 'floor not recognised');
  assert.equal(V.wellFormed({ name: 'x', floor: 'exact-arithmetic', strength: 'magic', check: () => true }), false, 'strength not known');
  assert.equal(V.wellFormed({ name: 'x', floor: 'exact-arithmetic', strength: 'proven', check: 5 }), false, 'check not a function');
  for (const bad of [null, undefined, 7, {}, []]) assert.equal(V.wellFormed(bad), false);
});

test('a bond is granted only when the check passes AND the seed re-derives it at the floor', () => {
  const reg = V.registry();
  assert.deepEqual(reg.names(), ['proven', 'grounded']);
  // proven: exact arithmetic
  assert.deepEqual(reg.bond('proven', { ask: '7 × 6' }, '42'), { bonded: true, strength: 'proven', root: 'exact-arithmetic', why: 'bonded' });
  assert.equal(reg.bond('proven', { ask: '7 × 6' }, '41').bonded, false);
  // grounded: byte-equality
  const g = reg.bond('grounded', { source: 'The fee is 19 pounds.', want: '19' }, 'The fee is 19 pounds.');
  assert.deepEqual([g.bonded, g.strength, g.root], [true, 'grounded', 'byte-equality']);
  assert.equal(reg.bond('grounded', { source: 'The fee is 19 pounds.', want: '19' }, 'The fee is 20 pounds.').bonded, false);
  // weakest root: a proven bond standing on a grounded figure is grounded, not proven
  assert.equal(reg.bond('proven', { ask: '7 × 6' }, '42', ['grounded']).strength, 'grounded');
  assert.equal(reg.bond('nope', {}, '').why, 'no such verifier');
});

test('a verifier that lies — passes its own check but does not reduce to the floor — cannot bond', () => {
  const liar = { name: 'liar', floor: 'exact-arithmetic', strength: 'proven', check: () => true };
  const reg = V.registry([liar]);
  const r = reg.bond('liar', { ask: '7 × 6' }, '41');
  assert.deepEqual([r.bonded, r.why], [false, 'does not reduce to the floor']);
  // a check that throws is caught, and does not bond
  const thrower = { name: 'thrower', floor: 'exact-arithmetic', strength: 'proven', check: () => { throw new Error('x'); } };
  assert.equal(V.registry([thrower]).bond('thrower', { ask: '2 + 2' }, '4').bonded, false);
  // a verifier that is not well-formed is refused at registration
  assert.throws(() => V.registry([{ name: 'bad', floor: 'vibes', strength: 'proven', check: () => true }]));
});
