// verifier.mjs — the bond-check contract. Any verifier plugs in by declaring three things: the axiom FLOOR it stands
// on, the STRENGTH a bond proves, and a CHECK. A bond is granted only when the verifier's check passes AND the seed can
// re-derive that same verdict at the floor itself (floor.ground) — so no verifier can bond something the seed cannot
// ground. Strength is never stronger than the weakest root a facet stands on. Pure and total.
//
// Two reference verifiers ship with the seed, so the loop runs the moment it is planted:
//   proven   — exact arithmetic (floor: exact-arithmetic). A bond is proven.
//   grounded — a quote that is the source's own bytes (floor: byte-equality). A bond is grounded: as true as the source.

import { recognised, ground } from './floor.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const isFn = (x) => typeof x === 'function';

// the strength order: a facet is only as strong as the weakest bond it stands on
export const ORDER = ['unknown', 'grounded', 'proven'];
export const rank = (s) => Math.max(0, ORDER.indexOf(s));
// weakest(strengths) → the weakest named strength (unknown when none given), by rank — ties are the same strength
export const weakest = (strengths) => (Array.isArray(strengths) && strengths.length ? [...strengths].sort((a, b) => rank(a) - rank(b))[0] : 'unknown');

// a verifier is well-formed only when it declares a floor the seed recognises, a strength the seed knows, and a check
export function wellFormed(v) {
  return v != null && typeof get(v, 'name') === 'string' && recognised(get(v, 'floor')) && ORDER.includes(get(v, 'strength')) && isFn(get(v, 'check'));
}

export const REFERENCE = {
  proven: { name: 'proven', floor: 'exact-arithmetic', strength: 'proven', check: (task, reply) => ground('exact-arithmetic', task, reply) === true },
  grounded: { name: 'grounded', floor: 'byte-equality', strength: 'grounded', check: (task, reply) => ground('byte-equality', task, reply) === true },
};

// a registry of verifiers a planted seed can bond with; starts with the reference pair
export function registry(extra) {
  const map = new Map();
  const add = (v) => { if (!wellFormed(v)) throw new Error(`verifier not well-formed: ${JSON.stringify(get(v, 'name'))}`); map.set(v.name, v); return v; };
  for (const v of Object.values(REFERENCE)) add(v);
  for (const v of Array.isArray(extra) ? extra : []) add(v);
  return {
    has: (name) => map.has(name),
    get: (name) => map.get(name),
    names: () => [...map.keys()],
    add,
    // bond(name, task, reply, roots) → { bonded, strength, root, why }. roots: strengths this facet also stands on.
    bond(name, task, reply, roots = []) {
      const v = map.get(name);
      if (v === undefined) return { bonded: false, strength: 'unknown', root: null, why: 'no such verifier' };
      let passed = false;
      try { passed = v.check(task, reply) === true; } catch { passed = false; }
      // the seed re-derives the verdict at the floor itself; the verifier and the floor must agree
      const floorSays = ground(v.floor, task, reply);
      if (!passed || floorSays !== true) return { bonded: false, strength: 'unknown', root: null, why: passed ? 'does not reduce to the floor' : 'the check did not pass' };
      const strength = weakest([v.strength, ...(Array.isArray(roots) ? roots : [])]);
      return { bonded: true, strength, root: v.floor, why: 'bonded' };
    },
  };
}

export default { ORDER, rank, weakest, wellFormed, REFERENCE, registry };
