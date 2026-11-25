// floor.mjs — the axiom floor: the termination below. Nothing bonds that does not reduce to something the seed can
// re-derive itself, with no model. Two axiom floors are recognised, each a pure grounding the seed computes on its own:
//
//   exact-arithmetic — a whole-number sum of + - × is worked out in exact integers and compared, no rounding.
//   byte-equality    — a span is the source's own bytes, exactly, start to end.
//
// A verifier declares which floor it stands on; one whose floor the seed does not recognise cannot bond (checked in
// verifier.mjs). probe() measures what a planted model gets right cold on the floor tasks: the baseline a grown cell
// must beat. Pure and total.

const get = (o, k) => { try { return o == null ? undefined : o[k]; } catch { return undefined; } };
const str = (x) => (typeof x === 'string' ? x : '');

// the seed's own exact arithmetic over whole numbers: + - ×, left to right with × before + -, brackets allowed.
// returns a BigInt or null (not a whole-number expression, or past a size limit)
const LIMIT = 10n ** 40n;
const SIGN = { '+': '+', '-': '-', '*': '*', '×': '*' };
const RANK = { '+': 1, '-': 1, '*': 2 };
const DO = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b };
export function arith(text) {
  const t = str(text).trim();
  const out = [], ops = [];
  let i = 0, want = 'num';
  while (i < t.length) {
    const c = t[i];
    if (c === ' ') { i++; continue; }
    if (want === 'num') {
      if (c === '(') { ops.push('('); i++; continue; }
      if (c >= '0' && c <= '9') { let j = i; while (t[j] >= '0' && t[j] <= '9') j++; out.push(BigInt(t.slice(i, j))); i = j; want = 'op'; continue; }
      return null;
    }
    if (c === ')') { while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop()); if (ops.pop() !== '(') return null; i++; continue; }
    const op = SIGN[c];
    if (op === undefined) return null;
    while (ops.length && RANK[ops[ops.length - 1]] >= RANK[op]) out.push(ops.pop());
    ops.push(op); i++; want = 'num';
  }
  if (want === 'num') return null;
  while (ops.length) { const o = ops.pop(); if (o === '(') return null; out.push(o); }
  const st = [];
  for (const tok of out) {
    if (typeof tok === 'bigint') st.push(tok);
    else { const b = st.pop(), a = st.pop(); const v = DO[tok](a, b); if (v > LIMIT || v < -LIMIT) return null; st.push(v); }
  }
  return st.length === 1 ? st[0] : null;
}

// the last whole number written in a reply, as a BigInt, or null — how a model's answer is read at the floor
export function lastWhole(reply) {
  const m = str(reply).match(/-?\d+/g);
  return m && m.length ? BigInt(m[m.length - 1]) : null;
}

export const FLOORS = {
  // the sum in task.ask, worked out exactly, equals the whole number the reply ends on
  'exact-arithmetic': (task, reply) => { const want = arith(get(task, 'ask')), got = lastWhole(reply); return want !== null && got !== null && want === got; },
  // the reply is a span of the source, byte for byte, that holds what the task wants
  'byte-equality': (task, reply) => { const src = str(get(task, 'source')), q = str(reply).trim(), want = str(get(task, 'want')); return want.length > 0 && src.includes(q) && q.includes(want); },
};

export const recognised = (name) => Object.prototype.hasOwnProperty.call(FLOORS, name) && typeof FLOORS[name] === 'function';
// ground(name, task, reply) → the floor-level verdict the seed re-derives itself, or null when the floor is unknown
export const ground = (name, task, reply) => (recognised(name) ? FLOORS[name](task, reply) === true : null);

// probe(generate, floorTasks) → what the model gets right cold at the floor: the baseline a grown cell must beat.
// generate(task) → the model's reply (a string). Pure given a pure generate; total.
export function probe(generate, floorTasks) {
  const rows = [], tasks = Array.isArray(floorTasks) ? floorTasks : [];
  let right = 0;
  for (const task of tasks) {
    let reply = '';
    try { reply = str(typeof generate === 'function' ? generate(task) : ''); } catch { reply = ''; }
    const ok = ground(get(task, 'floor'), task, reply) === true;
    if (ok) right++;
    rows.push({ id: get(task, 'id'), floor: get(task, 'floor'), ok });
  }
  return { asked: tasks.length, right, rate: tasks.length ? right / tasks.length : 0, rows };
}

export default { FLOORS, recognised, ground, arith, lastWhole, probe, LIMIT };
