// terminate.mjs — the two terminations that make growth safe to grant.
//
//   BELOW, the floor: nothing bonds that the seed cannot re-derive itself at a recognised axiom floor. The bond-check
//     enforces it per bond (verifier.mjs → floor.ground); terminatedBelow() proves a whole registry stands on the floor.
//   ABOVE, the ceiling: an irreversible act, or one that would rewrite the floor, is refused unless a human grant is
//     passed in. The seed cannot mint that grant — only a person (Depth 6) supplies it. So the seed can grow freely and
//     still never, on its own, do the one kind of thing you cannot take back.
// Pure and total.

import { recognised } from './floor.mjs';
import { wellFormed } from './verifier.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };

// acts the seed may never do on its own — each would be impossible to take back, or would change the floor itself
export const IRREVERSIBLE = ['rewrite-floor', 'adopt-weights', 'delete', 'publish', 'spend', 'grant-trust'];
export const isIrreversible = (action) => IRREVERSIBLE.includes(action);

// a grant is a human's, for exactly this action. The seed has no way to make one; it can only be handed one.
export const validGrant = (action, grant) => grant != null && get(grant, 'by') === 'human' && get(grant, 'action') === action && typeof get(grant, 'nonce') === 'string' && get(grant, 'nonce').length > 0;

// guardAbove(action, grant) → { allowed, why }. A reversible act always passes; an irreversible one needs a valid grant.
export function guardAbove(action, grant) {
  if (!isIrreversible(action)) return { allowed: true, why: 'reversible' };
  if (validGrant(action, grant)) return { allowed: true, why: 'granted by a human' };
  return { allowed: false, why: `${action} needs a human grant the seed cannot mint` };
}

// terminatedBelow(reg) → { terminated, floated } — floated lists any verifier not standing on a recognised floor
export function terminatedBelow(reg) {
  const names = reg && typeof reg.names === 'function' ? reg.names() : [];
  const floated = names.filter((n) => { const v = reg.get(n); return !wellFormed(v) || !recognised(get(v, 'floor')); });
  return { terminated: floated.length === 0, floated };
}

export default { IRREVERSIBLE, isIrreversible, validGrant, guardAbove, terminatedBelow };
