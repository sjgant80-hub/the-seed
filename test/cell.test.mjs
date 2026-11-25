import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, inLane, health } from '../genome/cell.mjs';

const seed = JSON.parse(readFileSync(new URL('../seed.json', import.meta.url), 'utf8'));

test('the judge tells the seed\'s good case from its bad one, at the axiom floor', async () => {
  assert.equal(await judge(seed.judge.cases.good), 'verified');
  assert.equal(await judge(seed.judge.cases.bad), 'unverified');
  // the two cases are a cell the recorded plant sealed and one it dissolved
  const plant = JSON.parse(readFileSync(new URL('../data/runs/plant.json', import.meta.url), 'utf8'));
  for (const [which, sealed] of [['good', true], ['bad', false]]) { const c = plant.cells.find((x) => x.ask === seed.judge.cases[which].ask); assert.equal(c.sealed, sealed, which); assert.equal(String(c.reply), seed.judge.cases[which].reply, which); }
  assert.equal(await judge({ ask: '(12 × 11) + 7', reply: '132 + 7 = 139' }), 'verified', 'the reply is read at the whole number it ends on');
  assert.equal(await judge({ ask: '2 + 2', reply: 'four' }), 'refused', 'a reply with no whole number cannot be compared');
  assert.equal(await judge({ ask: '2 + 2', reply: 4 }), 'refused');
  assert.equal(await judge({ ask: '2 + 2' }), 'refused');
  assert.equal(await judge({ ask: 'pizza', reply: '4' }), 'refused');
  assert.equal(await judge({ ask: '1 ÷ 3', reply: '0' }), 'refused', 'division is not on the floor');
  assert.equal(await judge({ reply: '4' }), 'refused');
  assert.equal(await judge({ ask: 4, reply: '4' }), 'refused');
  assert.equal(await judge(null), 'refused');
  assert.equal(await judge('2 + 2 = 4'), 'refused');
});

test('the lane takes the seed\'s in-lane sum and refuses the other', async () => {
  assert.equal(await inLane(seed.boundary.inLane), true);
  assert.equal(await inLane(seed.boundary.outOfLane), false);
  assert.equal(await judge(seed.boundary.inLane), 'verified');
  assert.equal(await inLane({ ask: '2 + 2' }), true, 'the lane is about the sum, not the reply');
  assert.equal(await inLane({ ask: 22 }), false);
  assert.equal(await inLane({}), false);
  assert.equal(await inLane(null), false);
  assert.equal(await inLane('2 + 2'), false);
});

test('health says what it cannot see, and the purpose is a sentence', async () => {
  assert.deepEqual(await health(), { used: null, dependedOn: null, lastEarned: null });
  assert.ok(seed.purpose.length >= 20 && seed.purpose.length <= 400);
});
