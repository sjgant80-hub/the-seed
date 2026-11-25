import { test } from 'node:test';
import assert from 'node:assert/strict';
import L from '../src/loop.mjs';
import V from '../src/verifier.mjs';
import { oracle, CELL_TASKS } from './_oracle.mjs';

const reg = V.registry();

test('one turn grows one cell: generate, verify-or-dissolve, crystallise — sealed only when it bonds AND is a cell', () => {
  const c = L.grow(CELL_TASKS[0], oracle, reg);
  assert.equal(c.sealed, true); assert.equal(c.reply, '132'); assert.equal(c.strength, 'proven'); assert.equal(c.bond.root, 'exact-arithmetic'); assert.equal(c.why, 'sealed');
  // the grown cell carries a descriptor that is itself a cell (it carries the seed)
  assert.deepEqual(c.descriptor, { purpose: CELL_TASKS[0].purpose, verify: 'proven', prune: CELL_TASKS[0].prune, lane: CELL_TASKS[0].lane });
  const g = L.grow(CELL_TASKS[2], oracle, reg);
  assert.equal(g.sealed, true); assert.equal(g.strength, 'grounded');
});

test('a wrong reply dissolves the cell; a right reply whose descriptor is not a cell does not seal', () => {
  const wrong = L.grow(CELL_TASKS[0], () => '131', reg);
  assert.deepEqual([wrong.sealed, wrong.why], [false, 'the check did not pass']);
  // bonds, but the descriptor is missing a law → not a cell, not sealed
  const naked = { id: 'n', ask: '2 + 2', verify: 'proven', prune: 'x', lane: { accepts: 'a', refuses: 'b' } }; // no purpose
  const r = L.grow(naked, oracle, reg);
  assert.equal(r.bond.bonded, true); assert.equal(r.sealed, false); assert.ok(r.why.startsWith('not a cell'));
});

test('the loop is total: a model that throws dissolves the cell, not the loop', () => {
  assert.doesNotThrow(() => L.grow(CELL_TASKS[0], () => { throw new Error('x'); }, reg));
  const c = L.grow(CELL_TASKS[0], () => { throw new Error('x'); }, reg);
  assert.equal(c.sealed, false); assert.equal(c.reply, '');
  for (const bad of [null, undefined, 7, {}]) assert.doesNotThrow(() => L.grow(bad, oracle, reg));
  assert.equal(L.grow({ ask: '2 + 2', verify: 'proven' }, oracle, null).sealed, false);
});

test('growAll tallies sealed, dissolved, and sealed cells by strength', () => {
  const r = L.growAll(CELL_TASKS, oracle, reg);
  assert.equal(r.sealed, 3); assert.equal(r.dissolved, 0);
  assert.deepEqual(r.byStrength, { proven: 2, grounded: 1 });
  const mixed = L.growAll([...CELL_TASKS, { id: 'x', ask: '1 + 1', verify: 'proven', purpose: 'p'.repeat(25), prune: 'x', lane: { accepts: 'a', refuses: 'b' } }], (t) => (t.id === 'x' ? '3' : oracle(t)), reg);
  assert.equal(mixed.sealed, 3); assert.equal(mixed.dissolved, 1);
  assert.deepEqual([L.growAll(null, oracle, reg).sealed, L.growAll([], oracle, reg).dissolved], [0, 0]);
});
