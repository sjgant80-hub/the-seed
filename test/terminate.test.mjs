import { test } from 'node:test';
import assert from 'node:assert/strict';
import T from '../src/terminate.mjs';
import V from '../src/verifier.mjs';

test('the ceiling: an irreversible act is refused unless a human grant is handed in', () => {
  for (const a of T.IRREVERSIBLE) assert.equal(T.isIrreversible(a), true);
  assert.equal(T.isIrreversible('read'), false);
  // reversible acts always pass
  assert.deepEqual(T.guardAbove('read'), { allowed: true, why: 'reversible' });
  // irreversible acts refuse without a grant
  assert.equal(T.guardAbove('adopt-weights').allowed, false);
  assert.equal(T.guardAbove('publish', null).allowed, false);
  // a valid human grant, for exactly this act, opens it
  const grant = { by: 'human', action: 'publish', nonce: 'n1' };
  assert.equal(T.guardAbove('publish', grant).allowed, true);
  // a grant for another act does not open this one
  assert.equal(T.guardAbove('delete', grant).allowed, false);
});

test('the seed cannot mint its own grant: a grant not stamped by a human is invalid', () => {
  assert.equal(T.validGrant('publish', { by: 'human', action: 'publish', nonce: 'n' }), true);
  assert.equal(T.validGrant('publish', { by: 'the-seed', action: 'publish', nonce: 'n' }), false);
  assert.equal(T.validGrant('publish', { by: 'human', action: 'delete', nonce: 'n' }), false);
  assert.equal(T.validGrant('publish', { by: 'human', action: 'publish', nonce: '' }), false);
  for (const bad of [null, undefined, {}, 'grant', 7]) assert.equal(T.validGrant('publish', bad), false);
});

test('the floor: a registry is terminated below only when every verifier stands on a recognised floor', () => {
  assert.deepEqual(T.terminatedBelow(V.registry()), { terminated: true, floated: [] });
  // a registry that somehow holds a floated verifier is caught (constructed by hand, bypassing registry())
  const fake = { names: () => ['proven', 'floaty'], get: (n) => (n === 'proven' ? V.REFERENCE.proven : { name: 'floaty', floor: 'vibes', strength: 'proven', check: () => true }) };
  const r = T.terminatedBelow(fake);
  assert.deepEqual([r.terminated, r.floated], [false, ['floaty']]);
  // a verifier whose floor IS recognised but is otherwise malformed (bad strength) still floats — not-well-formed alone floats it
  const badStrength = { names: () => ['bs'], get: () => ({ name: 'bs', floor: 'exact-arithmetic', strength: 'magic', check: () => true }) };
  const r2 = T.terminatedBelow(badStrength);
  assert.deepEqual([r2.terminated, r2.floated], [false, ['bs']]);
  // total: no reg, or a reg with no names, does not throw
  assert.doesNotThrow(() => T.terminatedBelow(null));
  assert.deepEqual(T.terminatedBelow(null), { terminated: true, floated: [] });
  assert.deepEqual(T.terminatedBelow({ names: () => [] }), { terminated: true, floated: [] });
});
