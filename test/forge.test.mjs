import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fo from '../src/forge.mjs';
import L from '../src/loop.mjs';
import V from '../src/verifier.mjs';
import P from '../src/plant.mjs';
import { oracle, CELL_TASKS } from './_oracle.mjs';

const reg = V.registry();
const sealedCell = L.grow(CELL_TASKS[0], oracle, reg);

test('only a sealed cell reproduces, and it never emits debris — the next spec must itself be a cell', () => {
  assert.equal(sealedCell.sealed, true);
  const good = Fo.forge(sealedCell, P.sibling);
  assert.equal(good.emitted, true);
  assert.deepEqual(L.grow(good.spec, oracle, reg).sealed, true, 'the emitted spec grows and seals in turn');
  // an unsealed cell does not reproduce
  const dead = L.grow(CELL_TASKS[0], () => 'wrong', reg);
  assert.deepEqual(Fo.forge(dead, P.sibling), { emitted: false, spec: null, why: 'a cell that did not seal does not reproduce' });
  // a proposer that returns debris (not a cell) is refused
  const debris = Fo.forge(sealedCell, () => ({ ask: '1 + 1', verify: 'proven' })); // no purpose/prune/lane
  assert.equal(debris.emitted, false); assert.ok(debris.why.startsWith('the next spec is not a cell'));
  assert.equal(Fo.forge(sealedCell, () => null).emitted, false);
  assert.doesNotThrow(() => Fo.forge(sealedCell, () => { throw new Error('x'); }));
});

test('carriesSeed: a sealed cell is itself a well-formed cell, so it can be planted again', () => {
  assert.equal(Fo.carriesSeed(sealedCell), true);
  assert.equal(Fo.carriesSeed(L.grow(CELL_TASKS[0], () => 'wrong', reg)), false);
  for (const bad of [null, undefined, {}, 7]) assert.equal(Fo.carriesSeed(bad), false);
});
