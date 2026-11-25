import { test } from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/distill.mjs';
import L from '../src/loop.mjs';
import V from '../src/verifier.mjs';
import { oracle, CELL_TASKS } from './_oracle.mjs';

test('harvest takes training data only from sealed cells', () => {
  const reg = V.registry();
  const cells = CELL_TASKS.map((t) => L.grow(t, oracle, reg)).concat(L.grow(CELL_TASKS[0], () => 'wrong', reg));
  const data = D.harvest(cells);
  assert.equal(data.length, 3);
  assert.ok(data.every((d) => typeof d.reply === 'string' && d.strength));
  assert.deepEqual(D.harvest(null), []);
});

test('adopt only when the new weights beat the old on the sealed set AND a human grants it', () => {
  const grant = { by: 'human', action: 'adopt-weights', nonce: 'n1' };
  // beats and granted → adopted
  assert.equal(D.adopt({ oldScore: 0.8, newScore: 0.9 }, grant).adopted, true);
  // beats but no grant → refused (the seed cannot adopt on its own)
  assert.equal(D.adopt({ oldScore: 0.8, newScore: 0.9 }, null).adopted, false);
  // does not beat → refused even with a grant
  assert.equal(D.adopt({ oldScore: 0.9, newScore: 0.9 }, grant).adopted, false, 'a tie is not a win');
  assert.equal(D.adopt({ oldScore: 0.9, newScore: 0.8 }, grant).adopted, false);
  // no measured contest → refused, and for that reason (one score missing is still no contest, not "did not beat")
  assert.equal(D.adopt({}, grant).adopted, false);
  assert.match(D.adopt({ oldScore: 5, newScore: null }, grant).why, /no measured contest/);
  assert.match(D.adopt({ oldScore: null, newScore: 9 }, grant).why, /no measured contest/);
  assert.match(D.adopt({ oldScore: 0.9, newScore: 0.8 }, grant).why, /did not beat/);
  // a grant for another act does not open adoption
  assert.equal(D.adopt({ oldScore: 0.8, newScore: 0.9 }, { by: 'human', action: 'publish', nonce: 'n' }).adopted, false);
});
