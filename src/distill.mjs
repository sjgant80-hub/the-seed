// distill.mjs — the metabolism: verified crystal → training data → new weights, adopted ONLY if the new weights beat
// the old on the sealed set, and ONLY with a human grant (adopting weights is irreversible — it rewrites the floor the
// model stands on, so it terminates at the ceiling). The seed can harvest the data and measure the contest; it cannot
// adopt on its own. Training the weights is Depth 5 and is NOT built here — distill prepares and gates, no more. Pure
// and total.

import { guardAbove } from './terminate.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };

// harvest(cells) → the training data a distillation would use: every sealed cell's task and verified reply
export function harvest(cells) {
  return (Array.isArray(cells) ? cells : []).filter((c) => get(c, 'sealed') === true).map((c) => ({ ask: get(c, 'ask'), reply: get(c, 'reply'), strength: get(c, 'strength') }));
}

// adopt({ oldScore, newScore }, grant) → { adopted, why }. Adopts only when the new weights strictly beat the old on
// the sealed set AND a human grant for 'adopt-weights' is supplied. Never adopts on a tie or on the seed's say-so.
export function adopt(contest, grant) {
  const oldScore = get(contest, 'oldScore'), newScore = get(contest, 'newScore');
  if (!(typeof oldScore === 'number' && typeof newScore === 'number')) return { adopted: false, why: 'no measured contest on the sealed set' };
  if (!(newScore > oldScore)) return { adopted: false, why: `new weights did not beat the old (${newScore} vs ${oldScore})` };
  const gate = guardAbove('adopt-weights', grant);
  if (!gate.allowed) return { adopted: false, why: gate.why };
  return { adopted: true, why: `beat the sealed set (${newScore} vs ${oldScore}) and granted` };
}

export default { harvest, adopt };
