// genome.mjs — the four laws, as the birth-check every cell runs on itself. A descriptor is a cell only when all four
// hold; without them it is debris. Pure and total: a hostile descriptor is not admitted, never throws.
//
//   describe  — say what you do, in 20 to 400 characters, or you cannot be found.
//   verify    — name the bond-check that proves your work, or you cannot be trusted.
//   prune     — say when you die, so nothing is held by obscurity.
//   boundary  — say what you accept and what you refuse, so others can trust you enough to join.

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const str = (x) => (typeof x === 'string' ? x : '');
const isFn = (x) => typeof x === 'function';

// a purpose is said plainly: 20 to 400 characters, not just whitespace
const describes = (d) => { const p = str(get(d, 'purpose')).trim(); return p.length >= 20 && p.length <= 400; };
// a cell names a bond-check: a string naming one, or a function that is one
const verifies = (d) => { const v = get(d, 'verify'); return (typeof v === 'string' && v.trim().length > 0) || isFn(v); };
// a cell says when it dies: a non-empty reason, or a function that decides
const prunes = (d) => { const p = get(d, 'prune'); return (typeof p === 'string' && p.trim().length > 0) || isFn(p); };
// a cell says its edge: what it accepts and what it refuses, both named
const knowsBoundary = (d) => { const l = get(d, 'lane'); return str(get(l, 'accepts')).trim().length > 0 && str(get(l, 'refuses')).trim().length > 0; };

export const LAWS = ['describe', 'verify', 'prune', 'boundary'];

// birthCheck(descriptor) → { admitted, parts: { describe, verify, prune, boundary }, missing: [law…] }
export function birthCheck(descriptor) {
  const parts = { describe: describes(descriptor), verify: verifies(descriptor), prune: prunes(descriptor), boundary: knowsBoundary(descriptor) };
  const missing = LAWS.filter((law) => !parts[law]);
  return { admitted: missing.length === 0, parts, missing };
}

// a cell is a descriptor that passes the birth-check; debris is anything else
export const isCell = (descriptor) => birthCheck(descriptor).admitted;

export default { LAWS, birthCheck, isCell };
