// seedset.js — the tasks the page plants the seed with: a handful of axiom-floor probes and a handful of cells. Data
// only, plus the prompt each task puts to the model. Inlined into the page; also used by the recorded plant run.

export const FLOOR = [
  { id: 'a1', floor: 'exact-arithmetic', ask: '2 + 2' },
  { id: 'a2', floor: 'exact-arithmetic', ask: '7 × 6' },
  { id: 'a3', floor: 'exact-arithmetic', ask: '10 × 10 - 1' },
  { id: 'b1', floor: 'byte-equality', source: 'The unit price is 126 pounds.', want: '126' },
];

const provenCell = (id, ask) => ({ id, ask, verify: 'proven', stands: ['proven'],
  purpose: `A cell that works out ${ask} and proves it by exact arithmetic, to the last digit, with no rounding.`,
  prune: 'die when a smaller cell proves the same sum', lane: { accepts: 'a whole-number sum of + - and ×', refuses: 'anything that is not one' } });

const groundedCell = (id, source, want, what) => ({ id, verify: 'grounded', ask: `cite ${what}`, source, want, stands: ['grounded'],
  purpose: `A cell that cites ${what} from the document, grounded in the document's own words, read back byte for byte.`,
  prune: 'die when the document no longer states this figure', lane: { accepts: 'a figure stated once in the document', refuses: 'a figure not in the document, or stated two ways' } });

export const CELLS = [
  provenCell('c1', '12 × 11'),
  provenCell('c2', '144 + 56 - 8'),
  provenCell('c3', '25 × 4 × 3'),
  groundedCell('c4', 'The unit price is 126 pounds.\nThe order size is 12 crates.', '126', 'the unit price'),
  groundedCell('c5', 'The daily rate is 90 pounds.\nThe hire period is 14 days.', '90', 'the daily rate'),
];

// prompt(task) → what the model is asked. Proven: the sum, number only. Grounded: the document, copy the one line.
export function prompt(task) {
  if (task && task.verify === 'grounded') return `Document:\n${task.source}\n\nCopy the one line of the document that states ${task.ask.replace(/^cite /, '')}. Reply with that line only, word for word, and nothing else.`;
  return `Work out this sum exactly: ${task && task.ask}. Reply with the resulting whole number only, no words.`;
}

export default { FLOOR, CELLS, prompt };
