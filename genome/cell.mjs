// cell.mjs — The Seed's three answers for the estate genome's birth check (seed.json, genome/).
//
// judge  the axiom floor's own ruling on one reply to one sum { ask, reply }: verified when the sum, worked out in
//        exact whole numbers, equals the whole number the reply ends on; unverified when it does not; refused when
//        the ask is not a whole-number sum the floor can work out, or the reply holds no whole number to compare.
// lane   the same reader the floor uses before it rules: in lane when the ask is such a sum.
// health the repository cannot see its page's visitors or callers from inside it, so it says so.
import { arith, lastWhole, ground } from '../src/floor.mjs';

const str = (x) => typeof x === 'string';
const sum = (input) => (input !== null && typeof input === 'object' && str(input.ask) ? arith(input.ask) : null);

export async function judge(input) {
  if (sum(input) === null || !str(input.reply) || lastWhole(input.reply) === null) return 'refused';
  return ground('exact-arithmetic', input, input.reply) === true ? 'verified' : 'unverified';
}

export async function inLane(input) {
  return sum(input) !== null;
}

export async function health() {
  return { used: null, dependedOn: null, lastEarned: null };
}
