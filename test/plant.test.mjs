import { test } from 'node:test';
import assert from 'node:assert/strict';
import P from '../src/plant.mjs';
import { oracle, FLOOR_TASKS, CELL_TASKS } from './_oracle.mjs';

test('plant: probe the floor, grow and seal cells, and prove the pattern reproduces — the organism is alive', () => {
  const r = P.plant(oracle, { floorTasks: FLOOR_TASKS, cellTasks: CELL_TASKS, at: '2026-11-25' });
  assert.equal(r.v, 'the-seed-plant/1');
  assert.equal(r.at, '2026-11-25', 'the planting time is kept');
  assert.equal(r.terminatedBelow, true);
  assert.equal(r.floor.rate, 1);
  assert.equal(r.sealed, 3); assert.equal(r.dissolved, 0);
  assert.deepEqual(r.byStrength, { proven: 2, grounded: 1 });
  // self-similar: a sealed cell carries the seed, forges the next, and it seals in turn
  assert.deepEqual([r.selfSimilar.carries, r.selfSimilar.forged, r.selfSimilar.nextSealed], [true, true, true]);
  assert.equal(r.alive, true);
});

test('not alive unless a cell carries the seed AND reproduces a sealed next cell', () => {
  // a model that answers nothing: nothing seals, nothing reproduces, not alive
  const dead = P.plant(() => '', { floorTasks: FLOOR_TASKS, cellTasks: CELL_TASKS });
  assert.equal(dead.sealed, 0); assert.equal(dead.alive, false);
  assert.equal(dead.floor.rate, 0);
  // cells seal, but the reproduced sibling (its id ends with '+') is answered wrong → carries, but not alive
  const noRepro = P.plant((t) => (String(t.id).endsWith('+') ? 'wrong' : oracle(t)), { floorTasks: FLOOR_TASKS, cellTasks: CELL_TASKS });
  assert.ok(noRepro.sealed > 0);
  assert.deepEqual([noRepro.selfSimilar.carries, noRepro.selfSimilar.forged, noRepro.selfSimilar.nextSealed, noRepro.alive], [true, true, false, false]);
});

test('self-similar reproduces from a PROVEN cell: a grounded cell first does not derail it', () => {
  const g = { id: 'g1', verify: 'grounded', ask: 'cite the fee', source: 'The fee is 19 pounds.', want: '19', stands: ['grounded'], purpose: 'A cell that cites the fee from the document, grounded in its own words, byte for byte.', prune: 'die when the fee is no longer stated', lane: { accepts: 'a figure in the document', refuses: 'a figure not in it' } };
  const p = { id: 'p1', ask: '6 × 7', verify: 'proven', stands: ['proven'], purpose: 'A cell that works out 6 times 7 and proves it by exact arithmetic to the last digit.', prune: 'die when a smaller cell proves it', lane: { accepts: 'a whole-number sum', refuses: 'anything else' } };
  const r = P.plant(oracle, { floorTasks: FLOOR_TASKS, cellTasks: [g, p] });
  assert.equal(r.sealed, 2);
  assert.equal(r.alive, true, 'it reproduces from the proven cell, not the grounded one it meets first');
  // a plant with only grounded cells: the grounded cell still carries the seed, though it has no arithmetic sibling to forge
  const onlyG = P.plant(oracle, { floorTasks: FLOOR_TASKS, cellTasks: [g] });
  assert.equal(onlyG.sealed, 1);
  assert.deepEqual([onlyG.selfSimilar.carries, onlyG.selfSimilar.forged, onlyG.alive], [true, false, false]);
});

test('a seed whose verifiers float off the floor cannot be planted', () => {
  assert.throws(() => P.plant(oracle, { floorTasks: FLOOR_TASKS, cellTasks: CELL_TASKS, extraVerifiers: [{ name: 'floaty', floor: 'vibes', strength: 'proven', check: () => true }] }));
});

test('sibling reproduces a proven cell into a harder, still-plantable one; refuses a non-arithmetic cell', () => {
  const r = P.plant(oracle, { floorTasks: FLOOR_TASKS, cellTasks: CELL_TASKS });
  const provenCell = r.cells.find((c) => c.sealed && c.bond.root === 'exact-arithmetic');
  const sib = P.sibling(provenCell);
  assert.equal(sib.verify, 'proven'); assert.ok(sib.ask.includes('+'));
  const groundedCell = r.cells.find((c) => c.bond.root === 'byte-equality');
  assert.equal(P.sibling(groundedCell), null, 'a grounded cell has no arithmetic sibling');
  assert.equal(P.sibling(null), null);
});
