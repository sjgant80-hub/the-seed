// loop.mjs — the cell. One turn: generate (the model works the task) → verify-or-dissolve (the bond-check rules) →
// crystallise (a sealed cell, or nothing). A cell seals only when BOTH hold: its reply bonds, and the cell it would
// become passes the genome birth-check — so every sealed cell is a cell, able to be planted again (it carries the seed).
// Pure and total: a model that throws dissolves the cell, never the loop.

import { birthCheck } from './genome.mjs';

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const str = (x) => (typeof x === 'string' ? x : '');

// descriptorOf(task) → the genome descriptor the grown cell carries, taken from the task's spec for it
export const descriptorOf = (task) => ({ purpose: get(task, 'purpose'), verify: get(task, 'verify'), prune: get(task, 'prune'), lane: get(task, 'lane') });

// grow(task, generate, reg) → a cell. generate(task) → the reply (a string). reg is a verifier registry (verifier.mjs).
//   { id, task, ask, reply, bond, descriptor, birth, sealed, why }
export function grow(task, generate, reg) {
  const id = get(task, 'id'), ask = str(get(task, 'ask'));
  let reply = '';
  try { reply = str(typeof generate === 'function' ? generate(task) : ''); } catch { reply = ''; }
  const descriptor = descriptorOf(task), birth = birthCheck(descriptor);
  const roots = Array.isArray(get(task, 'stands')) ? get(task, 'stands') : [];
  const bond = reg && typeof reg.bond === 'function' ? reg.bond(get(task, 'verify'), task, reply, roots) : { bonded: false, strength: 'unknown', root: null, why: 'no registry' };
  const sealed = bond.bonded === true && birth.admitted === true;
  const why = !bond.bonded ? bond.why : !birth.admitted ? `not a cell: ${birth.missing.join(', ')}` : 'sealed';
  return { id, task: get(task, 'id'), ask, reply, bond, descriptor, birth, sealed, why, strength: sealed ? bond.strength : null };
}

// growAll(tasks, generate, reg) → every cell, and the tally
export function growAll(tasks, generate, reg) {
  const cells = (Array.isArray(tasks) ? tasks : []).map((t) => grow(t, generate, reg));
  const sealed = cells.filter((c) => c.sealed);
  const byStrength = {};
  for (const c of sealed) byStrength[c.strength] = (byStrength[c.strength] || 0) + 1;
  return { cells, sealed: sealed.length, dissolved: cells.length - sealed.length, byStrength };
}

export default { descriptorOf, grow, growAll };
