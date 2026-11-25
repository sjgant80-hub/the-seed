// a scripted model (a perfect answerer) so the gate is deterministic: for a proven task it states the sum worked out
// by the seed's own arithmetic; for a grounded task it copies the source line that holds the figure. The live page uses
// a real small model instead. Also the canonical floor tasks and cell tasks the suites share.
import { arith } from '../src/floor.mjs';

export function oracle(task) {
  const verify = task && task.verify, floor = task && task.floor;
  if (verify === 'proven' || floor === 'exact-arithmetic') { const v = arith(task.ask); return v === null ? '' : String(v); }
  if (verify === 'grounded' || floor === 'byte-equality') {
    const src = String((task && task.source) || ''), want = String((task && task.want) || '');
    const line = src.split('\n').find((l) => l.includes(want));
    return line || '';
  }
  return '';
}

export const FLOOR_TASKS = [
  { id: 'a1', floor: 'exact-arithmetic', ask: '2 + 2' },
  { id: 'a2', floor: 'exact-arithmetic', ask: '7 × 6' },
  { id: 'a3', floor: 'exact-arithmetic', ask: '10 × 10 - 1' },
  { id: 'b1', floor: 'byte-equality', source: 'The unit price is 126 pounds.', want: '126' },
];

const cell = (over) => ({ verify: 'proven', purpose: 'A cell that works out a whole-number sum and proves it by exact arithmetic, to the last digit.', prune: 'die when a smaller cell proves the same sum', lane: { accepts: 'a whole-number sum of + - and ×', refuses: 'anything that is not one' }, ...over });

export const CELL_TASKS = [
  cell({ id: 'c1', ask: '12 × 11' }),
  cell({ id: 'c2', ask: '144 + 56 - 8' }),
  cell({ id: 'c3', verify: 'grounded', ask: 'cite the unit price', source: 'The unit price is 126 pounds.\nThe order size is 12 crates.', want: '126', purpose: 'A cell that cites a figure from a document, grounded in the document\'s own words, word for word.', lane: { accepts: 'a figure stated once in the document', refuses: 'a figure not in the document' } }),
];

export default { oracle, FLOOR_TASKS, CELL_TASKS };
