import { test } from 'node:test';
import assert from 'node:assert/strict';
import G from '../src/genome.mjs';

const good = { purpose: 'Adds two whole numbers and proves the sum by exact arithmetic.', verify: 'proven', prune: 'die when a smaller adder beats it on the sealed set', lane: { accepts: 'two whole numbers', refuses: 'anything that is not two whole numbers' } };

test('a descriptor with all four laws is a cell; one missing any is debris', () => {
  const r = G.birthCheck(good);
  assert.deepEqual(r, { admitted: true, parts: { describe: true, verify: true, prune: true, boundary: true }, missing: [] });
  assert.equal(G.isCell(good), true);
  assert.deepEqual(G.LAWS, ['describe', 'verify', 'prune', 'boundary']);
  // drop each law in turn → not admitted, and that law is named missing
  for (const [patch, law] of [
    [{ purpose: 'too short' }, 'describe'],
    [{ verify: '' }, 'verify'],
    [{ prune: '  ' }, 'prune'],
    [{ lane: { accepts: 'x', refuses: '' } }, 'boundary'],
  ]) { const r2 = G.birthCheck({ ...good, ...patch }); assert.equal(r2.admitted, false); assert.ok(r2.missing.includes(law), `${law}: ${JSON.stringify(r2.missing)}`); }
});

test('describe: 20 to 400 characters, said plainly', () => {
  assert.equal(G.birthCheck({ ...good, purpose: 'x'.repeat(19) }).parts.describe, false);
  assert.equal(G.birthCheck({ ...good, purpose: 'x'.repeat(20) }).parts.describe, true);
  assert.equal(G.birthCheck({ ...good, purpose: 'x'.repeat(400) }).parts.describe, true);
  assert.equal(G.birthCheck({ ...good, purpose: 'x'.repeat(401) }).parts.describe, false);
  assert.equal(G.birthCheck({ ...good, purpose: '  ' + 'y'.repeat(25) + '  ' }).parts.describe, true, 'trimmed, still in range');
  assert.equal(G.birthCheck({ ...good, purpose: '   '.repeat(20) }).parts.describe, false, 'whitespace is not a purpose');
});

test('verify and prune accept a name or a function; boundary needs both sides', () => {
  assert.equal(G.birthCheck({ ...good, verify: () => true }).parts.verify, true);
  assert.equal(G.birthCheck({ ...good, verify: 5 }).parts.verify, false);
  assert.equal(G.birthCheck({ ...good, prune: () => false }).parts.prune, true);
  assert.equal(G.birthCheck({ ...good, prune: 5 }).parts.prune, false);
  assert.equal(G.birthCheck({ ...good, lane: { accepts: 'x' } }).parts.boundary, false, 'refuses missing');
  assert.equal(G.birthCheck({ ...good, lane: { accepts: '', refuses: 'y' } }).parts.boundary, false, 'accepts empty');
  assert.equal(G.birthCheck({ ...good, lane: { accepts: '   ', refuses: 'y' } }).parts.boundary, false, 'accepts whitespace only');
  assert.equal(G.birthCheck({ ...good, lane: { accepts: 'x', refuses: 'y' } }).parts.boundary, true, 'both sides said');
  assert.equal(G.birthCheck({ ...good, lane: null }).parts.boundary, false);
});

test('pure and total: nothing a hostile descriptor can do makes it throw or get admitted', () => {
  const hostile = [null, undefined, 7, 'x', [], true, () => 1, { get purpose() { throw new Error('no'); } }, new Proxy({}, { get() { throw new Error('no'); } })];
  hostile.forEach((bad, i) => {
    assert.doesNotThrow(() => G.birthCheck(bad), `birthCheck threw on hostile #${i}`);
    assert.equal(G.isCell(bad), false, `hostile #${i} was admitted`);
  });
});
