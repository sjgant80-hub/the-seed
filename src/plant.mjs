// plant.mjs — the bootstrap. Plant the seed with a model (a generate function) and a set of tasks; it probes the floor,
// grows and seals cells, and proves the pattern is self-similar: a sealed cell carries the seed, so it reproduces the
// next cell, which grows and seals in turn. The plant does no irreversible act — it never adopts weights, publishes, or
// rewrites the floor; those terminate at the ceiling (a person). Pure and total given a pure generate.

import { probe } from './floor.mjs';
import { registry } from './verifier.mjs';
import { grow, growAll } from './loop.mjs';
import { terminatedBelow } from './terminate.mjs';
import { forge, carriesSeed } from './forge.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const str = (x) => (typeof x === 'string' ? x : '');

// sibling(cell) → the next task a proven (arithmetic) cell reproduces: a harder ask, the same genome. The axiom floor
// re-derives the answer, so the sibling needs no stored result. Returns null when the cell is not a proven-floor cell.
export function sibling(cell) {
  const t = get(cell, 'task'), ask = str(get(cell, 'ask'));
  if (get(get(cell, 'bond'), 'root') !== 'exact-arithmetic' || ask === '') return null;
  return {
    id: `${get(cell, 'id')}+`, ask: `(${ask}) + ${ask.length}`, verify: 'proven', stands: [get(cell, 'strength')],
    purpose: `The next cell: ${ask.length} added to the sum this one proved, worked out and proven by exact arithmetic.`,
    prune: 'die when a smaller cell proves the same sum', lane: { accepts: 'a whole-number sum of + - and ×', refuses: 'anything that is not one' },
  };
}

// plant(generate, opts) → the plant record. opts: { floorTasks, cellTasks, extraVerifiers }.
export function plant(generate, opts) {
  const reg = registry(get(opts, 'extraVerifiers'));
  const below = terminatedBelow(reg);
  if (!below.terminated) throw new Error(`the seed is not terminated below: ${below.floated.join(', ')} float off the floor`);
  const baseline = probe(generate, get(opts, 'floorTasks'));
  const grown = growAll(get(opts, 'cellTasks'), generate, reg);
  // self-similar: a sealed cell carries the seed, forges the next cell, and that cell grows and seals in turn
  const first = grown.cells.find((c) => c.sealed && get(get(c, 'bond'), 'root') === 'exact-arithmetic') || grown.cells.find((c) => c.sealed) || null;
  let selfSimilar = { carries: false, forged: false, nextSealed: false };
  if (first) {
    const carries = carriesSeed(first);
    const f = forge(first, sibling);
    let nextSealed = false, nextCell = null;
    if (f.emitted) { nextCell = grow(f.spec, generate, reg); nextSealed = nextCell.sealed === true; }
    selfSimilar = { carries, forged: f.emitted, nextSealed, next: nextCell };
  }
  return {
    v: 'the-seed-plant/1', at: str(get(opts, 'at')) || null,
    terminatedBelow: true, floor: baseline, cells: grown.cells, sealed: grown.sealed, dissolved: grown.dissolved,
    byStrength: grown.byStrength, selfSimilar,
    // the organism is alive only when a cell carries the seed (so a cell sealed) and it reproduced a sealed next cell
    alive: selfSimilar.carries === true && selfSimilar.nextSealed === true,
  };
}

export default { sibling, plant };
