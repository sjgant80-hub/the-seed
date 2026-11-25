// forge.mjs — reproduction. A SEALED cell may emit the spec for the next cell; the pattern carries to the next scale.
// The forge refuses an unsealed cell (nothing reproduces from a cell that did not bond), and refuses to emit a spec
// that is not itself a cell (it never emits debris): the next spec must pass the genome birth-check. Pure and total.

import { birthCheck } from './genome.mjs';
import { descriptorOf } from './loop.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };

// forge(cell, next) → { emitted, spec, why }. next(cell) → a proposed task spec for the next cell.
export function forge(cell, next) {
  if (get(cell, 'sealed') !== true) return { emitted: false, spec: null, why: 'a cell that did not seal does not reproduce' };
  let spec = null;
  try { spec = typeof next === 'function' ? next(cell) : null; } catch { spec = null; }
  if (spec == null) return { emitted: false, spec: null, why: 'no next spec proposed' };
  const birth = birthCheck(descriptorOf(spec));
  if (!birth.admitted) return { emitted: false, spec: null, why: `the next spec is not a cell: ${birth.missing.join(', ')}` };
  return { emitted: true, spec, why: 'emitted' };
}

// carriesSeed(cell) → true when a sealed cell can be planted again: it is itself a well-formed cell (self-similar)
export const carriesSeed = (cell) => get(cell, 'sealed') === true && birthCheck(get(cell, 'descriptor')).admitted === true;

export default { forge, carriesSeed };
