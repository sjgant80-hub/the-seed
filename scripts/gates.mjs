// gates.mjs (the-seed) — run the witness mutation gate on every kernel and record the result in data/gates.json.
//   node scripts/gates.mjs --witness <path to witness.mjs> [--check] [--only <file>] [--list] [--record]
// --check (CI): every gate must be CLEAN and match the committed counts, or this exits 1. Nothing is exempted.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const GATED = [
  ['src/genome.mjs', ['test/genome.test.mjs']],
  ['src/floor.mjs', ['test/floor.test.mjs']],
  ['src/verifier.mjs', ['test/verifier.test.mjs']],
  ['src/loop.mjs', ['test/loop.test.mjs']],
  ['src/terminate.mjs', ['test/terminate.test.mjs']],
  ['src/watcher.mjs', ['test/watcher.test.mjs']],
  ['src/forge.mjs', ['test/forge.test.mjs']],
  ['src/distill.mjs', ['test/distill.test.mjs']],
  ['src/plant.mjs', ['test/plant.test.mjs']],
  ['genome/cell.mjs', ['test/cell.test.mjs']],
];
export const NOTHING_TO_MUTATE = {
  'genome/io.mjs, judge.mjs, lane.mjs, health.mjs, tombstone.mjs': "the estate genome's hook template, byte for byte; gated in estate-genome (template/genome), exercised here by the birth check in CI",
  'vendor/house/': 'the house kit, byte for byte from house-standard, where its ship gate and receipts reader are gated; the page test holds this page to that gate',
  'page/house-app.js': 'the house layer shows the recorded plant and the gate record as receipts and decides nothing; what it draws is baked into index.html and held to the ship gate by the page test',
  'page/glass.js': 'the glass draws a plant record and decides nothing; its drawing is checked in a browser',
};

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
const witness = opt('--witness'), only = opt('--only'), checkMode = args.includes('--check');
if (args.includes('--list')) { console.log(JSON.stringify(GATED.map(([f]) => f))); process.exit(0); }
if (args.includes('--record')) {
  const g = existsSync('data/gates.json') ? JSON.parse(readFileSync('data/gates.json', 'utf8')) : { files: {} }, rows = Object.values(g.files || {});
  const same = JSON.stringify(Object.keys(g.files || {}).sort()) === JSON.stringify(GATED.map(([f]) => f).sort());
  const ok = same && g.clean === true && rows.every((f) => f.clean === true) && g.total === rows.reduce((a, f) => a + f.total, 0) && g.killed === rows.reduce((a, f) => a + f.killed, 0);
  console.log(ok ? `the gate record lists all ${rows.length} gated files, each CLEAN: ${g.killed}/${g.total}` : 'the gate record is incomplete, not clean, or its totals are not its files\'');
  process.exit(ok ? 0 : 1);
}
if (!witness || !existsSync(witness)) { console.error('usage: node scripts/gates.mjs --witness <witness.mjs> [--check] [--only <file>] [--list] [--record]'); process.exit(2); }

const committed = existsSync('data/gates.json') ? JSON.parse(readFileSync('data/gates.json', 'utf8')) : { files: {} };
const files = Object.fromEntries(Object.entries(committed.files || {}).filter(([f]) => GATED.some(([g]) => g === f)));
let bad = 0;
for (const [file, tests] of GATED) {
  if (only && only !== file) continue;
  const r = spawnSync(process.execPath, [witness, 'mutate', file, '--cap', '100000', '--timeout', '120000', '--test', 'node', '--test', ...tests], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const out = r.stdout || '';
  let j = null;
  try { j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch { j = null; }
  const got = j ? { total: j.total, killed: j.killed, ignored: (j.ignored || []).length, clean: j.clean === true } : { total: 0, killed: 0, ignored: 0, clean: false };
  const was = committed.files && committed.files[file];
  const drift = checkMode && (!was || was.total !== got.total || was.killed !== got.killed || (was.ignored || 0) !== got.ignored);
  if (!got.clean || drift) bad++;
  console.log(`${got.clean ? 'CLEAN' : 'NOT CLEAN'} ${got.killed}/${got.total}  ${file}${drift ? '  (differs from data/gates.json)' : ''}`);
  if (j && !got.clean) for (const s of j.survived || []) console.log('  survivor: ' + JSON.stringify(s).slice(0, 200));
  files[file] = got;
}
if (!checkMode) {
  const total = Object.values(files).reduce((a, f) => a + f.total, 0), killed = Object.values(files).reduce((a, f) => a + f.killed, 0);
  writeFileSync('data/gates.json', JSON.stringify({ witness: 'v0.6', total, killed, clean: Object.values(files).every((f) => f.clean), files, nothingToMutate: NOTHING_TO_MUTATE }, null, 1) + '\n');
}
process.exit(bad ? 1 : 0);
