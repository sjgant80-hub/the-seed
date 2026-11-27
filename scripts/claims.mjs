// claims.mjs — the verdict on six claims about the-seed, worked out from the recorded gate record
// (data/gates.json) and the recorded plant run (data/runs/plant.json). NOTE: these claims were written
// on 2026-11-27, AFTER the run of 2026-11-25 — a check of the record, not pre-registered bars; CLAIMS.md
// and the page say so. Pure and total: a claim whose evidence is missing is pending (pass: null), never
// passed by default. The bars are CLAIMS.md's, word for word in BARS; test/claims.test.mjs checks the file
// still says each one, that each verdict is the one the recorded data forces, and that each can fail on a
// tampered record. Nothing here asserts a pass — every pass is computed from the record.
const get = (o, k) => { try { return o[k]; } catch { return undefined; } };
const arr = (x) => (Array.isArray(x) ? x : []);
const admitted = (c) => get(get(c, 'bond'), 'bonded') === true && get(get(c, 'birth'), 'admitted') === true;
const LAWS = ['describe', 'verify', 'prune', 'boundary'];
const allLaws = (c) => { const p = get(get(c, 'birth'), 'parts') || {}; return LAWS.every((k) => p[k] === true); };

export const NAMES = {
  S1: 'Every organ proves itself under mutation',
  S2: 'A cell seals only if it bonds and passes the genome',
  S3: 'Every sealed cell is itself a cell',
  S4: 'Nothing is called truer than what it stands on',
  S5: 'The pattern reproduces',
  S6: 'A cell that cannot prove itself is dissolved and not kept',
};
export const BARS = {
  S1: 'Across every gated organ, no planted bug survives: the record is clean, and killed equals total for the whole and for each file.',
  S2: 'For every grown cell, it is sealed exactly when it bonded AND passed the genome birth-check — never one without the other.',
  S3: 'Every sealed cell passes all four genome laws: describe, verify, prune, know-your-edge.',
  S4: 'The bond chain terminates at an axiom floor the seed re-derives itself, with no model.',
  S5: 'A sealed cell carried the seed, forged the next, and that next one bonded and sealed too.',
  S6: 'Every cell that did not bond-and-admit is dissolved, and none of the dissolved is sealed.',
};

const pending = (id, why) => ({ id, name: NAMES[id], pass: null, result: `pending: ${why}` });

// evaluate({ gates, plant }) → [{ id, name, pass, result }] in the pre-registered order S1..S6.
export function evaluate(F) {
  const gates = get(F, 'gates') || {}, plant = get(F, 'plant') || {};
  const by = {};

  const files = get(gates, 'files') && typeof gates.files === 'object' ? gates.files : null;
  by.S1 = !Number.isInteger(get(gates, 'killed')) || !Number.isInteger(get(gates, 'total')) || !files
    ? pending('S1', 'needs the gate record')
    : { id: 'S1', name: NAMES.S1,
        pass: gates.clean === true && gates.killed === gates.total && Object.values(files).every((f) => f.clean === true && f.killed === f.total),
        result: `${gates.killed} of ${gates.total} planted bugs caught across ${Object.keys(files).length} organs; ${Object.values(files).filter((f) => f.clean === true).length} of ${Object.keys(files).length} files clean` };

  const cells = arr(get(plant, 'cells'));
  if (cells.length === 0) { by.S2 = pending('S2', 'needs the plant run'); by.S3 = pending('S3', 'needs the plant run'); by.S6 = pending('S6', 'needs the plant run'); }
  else {
    const held = cells.filter((c) => get(c, 'sealed') === admitted(c)).length;
    const sealed = cells.filter((c) => get(c, 'sealed') === true);
    const dissolved = cells.filter((c) => get(c, 'sealed') !== true);
    by.S2 = { id: 'S2', name: NAMES.S2, pass: held === cells.length,
      result: `${cells.length} cells grown, ${sealed.length} sealed, ${dissolved.length} dissolved; the seal-iff-proven rule held on ${held} of ${cells.length}` };
    by.S3 = { id: 'S3', name: NAMES.S3, pass: sealed.length > 0 && sealed.every(allLaws),
      result: `${sealed.filter(allLaws).length} of ${sealed.length} sealed cells pass describe · verify · prune · know-your-edge` };
    by.S6 = { id: 'S6', name: NAMES.S6, pass: dissolved.every((c) => !admitted(c)) && dissolved.every((c) => get(c, 'sealed') !== true),
      result: `${dissolved.length} dissolved; none bonded-and-admitted, none sealed` };
  }

  by.S4 = get(plant, 'terminatedBelow') === undefined
    ? pending('S4', 'needs the plant run')
    : { id: 'S4', name: NAMES.S4, pass: get(plant, 'terminatedBelow') === true,
        result: `the chain bottomed out at the floor${get(plant, 'floor') ? `; cold, the floor alone was right on ${plant.floor.right} of ${plant.floor.asked} — the bar a grown cell must beat` : ''}` };

  const ss = get(plant, 'selfSimilar');
  by.S5 = !ss ? pending('S5', 'needs the plant run')
    : { id: 'S5', name: NAMES.S5, pass: get(ss, 'carries') === true && get(ss, 'forged') === true && get(ss, 'nextSealed') === true,
        result: `a sealed cell carried the seed (${!!get(ss, 'carries')}), forged the next (${!!get(ss, 'forged')}), and it sealed too (${!!get(ss, 'nextSealed')})` };

  return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((id) => by[id]).filter(Boolean);
}

export default { NAMES, BARS, evaluate };
