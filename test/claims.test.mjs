// claims.test.mjs — the pre-registered claims module. Checks three things the page relies on:
//   1. every bar in BARS is a non-empty sentence and CLAIMS.md still carries it word for word;
//   2. on the committed record (data/gates.json + data/runs/plant.json) each verdict is the one the
//      data forces — so the page cannot show a verdict the record does not support;
//   3. each claim can FAIL — tampering the record flips it — so no verdict is a tautology that always passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import CLAIMS, { NAMES, BARS, evaluate } from '../scripts/claims.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const gates = JSON.parse(readFileSync(join(ROOT, 'data/gates.json'), 'utf8'));
const plant = JSON.parse(readFileSync(join(ROOT, 'data/runs/plant.json'), 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
const byId = (v) => Object.fromEntries(v.map((c) => [c.id, c]));
const IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

test('every claim has a name and a bar that is a real sentence', () => {
  for (const id of IDS) {
    assert.ok(NAMES[id] && NAMES[id].length > 8, `${id} needs a name`);
    assert.ok(BARS[id] && BARS[id].length > 20 && /\.$/.test(BARS[id]), `${id} needs a full-sentence bar`);
  }
});

test('CLAIMS.md carries every bar word for word (if the file exists)', { skip: !existsSync(join(ROOT, 'CLAIMS.md')) && 'no CLAIMS.md yet' }, () => {
  const md = readFileSync(join(ROOT, 'CLAIMS.md'), 'utf8');
  for (const id of IDS) assert.ok(md.includes(BARS[id]), `CLAIMS.md is missing the bar for ${id}`);
});

test('evaluate returns the six claims in the pre-registered order', () => {
  const v = evaluate({ gates, plant });
  assert.deepEqual(v.map((c) => c.id), IDS);
});

test('on the committed record, every claim passes — and the result cites the real numbers', () => {
  const v = byId(evaluate({ gates, plant }));
  for (const id of IDS) assert.equal(v[id].pass, true, `${id} should pass on the sealed record: ${v[id].result}`);
  assert.match(v.S1.result, /142 of 142/);
  assert.match(v.S2.result, /5 cells grown, 3 sealed, 2 dissolved/);
  assert.match(v.S3.result, /3 of 3/);
  assert.match(v.S5.result, /carried the seed \(true\)/);
});

test('S1 FAILS when a gated organ is not clean (not a tautology)', () => {
  const g = clone(gates); const k = Object.keys(g.files)[0]; g.files[k].clean = false; g.files[k].killed = g.files[k].total - 1; g.clean = false;
  assert.equal(byId(evaluate({ gates: g, plant })).S1.pass, false);
});

test('S2 FAILS when a cell is sealed without bonding (not a tautology)', () => {
  const p = clone(plant); const dead = p.cells.find((c) => !c.sealed); dead.sealed = true; // sealed though it never bonded
  assert.equal(byId(evaluate({ gates, plant: p })).S2.pass, false);
});

test('S3 FAILS when a sealed cell is missing a genome law', () => {
  const p = clone(plant); p.cells.find((c) => c.sealed).birth.parts.verify = false;
  assert.equal(byId(evaluate({ gates, plant: p })).S3.pass, false);
});

test('S4 FAILS when the chain did not terminate at the floor', () => {
  const p = clone(plant); p.terminatedBelow = false;
  assert.equal(byId(evaluate({ gates, plant: p })).S4.pass, false);
});

test('S5 FAILS when the forged next cell did not seal', () => {
  const p = clone(plant); p.selfSimilar.nextSealed = false;
  assert.equal(byId(evaluate({ gates, plant: p })).S5.pass, false);
});

test('S6 FAILS when a dissolved cell is also marked sealed somewhere', () => {
  const p = clone(plant); // a cell that bonded+admitted but is left unsealed breaks "dissolved ⇒ not provable"
  const d = p.cells.find((c) => !c.sealed); d.bond.bonded = true; d.birth.admitted = true; d.birth.parts = { describe: true, verify: true, prune: true, boundary: true };
  assert.equal(byId(evaluate({ gates, plant: p })).S6.pass, false);
});

test('missing evidence is pending (null), never a pass', () => {
  const v = byId(evaluate({ gates: {}, plant: {} }));
  for (const id of IDS) assert.notEqual(v[id].pass, true, `${id} must not pass with no evidence`);
  assert.equal(v.S2.pass, null);
  assert.equal(v.S4.pass, null);
});

test('default export exposes the same functions', () => {
  assert.equal(CLAIMS.evaluate, evaluate);
  assert.equal(CLAIMS.NAMES, NAMES);
});
