// publish.mjs — a plant run is a record, not a remark: it is grown again here with NO model, from the replies the run
// recorded, and must come out identically before it is published. --check re-grows every published run.
//   node scripts/publish.mjs <incoming-plant.json> plant      publish a run
//   node scripts/publish.mjs --check                          re-grow every published run (CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { plant } from '../src/plant.mjs';
import SEEDSET from '../page/seedset.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
// re-grow a recorded run with no model: the generate just hands back the reply the run recorded for each task
function regrow(record) {
  const replies = record.replies || {};
  const again = plant((t) => (t && Object.prototype.hasOwnProperty.call(replies, t.id) ? replies[t.id] : ''), { floorTasks: SEEDSET.FLOOR, cellTasks: SEEDSET.CELLS, at: record.at });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ok = again.sealed === record.sealed && again.dissolved === record.dissolved && again.alive === record.alive
    && same(again.byStrength, record.byStrength) && same(again.floor.rows, record.floor.rows)
    && same(again.cells.map((c) => [c.ask, c.reply, c.sealed, c.strength]), record.cells.map((c) => [c.ask, c.reply, c.sealed, c.strength]));
  return { ok, again };
}

const args = process.argv.slice(2);
if (args.includes('--check')) {
  const pub = read('data/published.json');
  let bad = 0;
  for (const [k, path] of Object.entries(pub)) {
    if (k === 'note' || !path) continue;
    if (!existsSync(new URL(`../${path}`, import.meta.url))) { console.error(`missing: ${path}`); bad++; continue; }
    const rec = read(path), { ok } = regrow(rec);
    console.log(`${ok ? 'OK' : 'DIFFERS'}  ${k}: ${rec.sealed} cells, alive=${rec.alive}, grown again ${ok ? 'identically' : 'DIFFERENTLY'} with no model`);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}

const [incoming, name] = args;
if (!incoming || !name || !existsSync(incoming)) { console.error('usage: node scripts/publish.mjs <incoming.json> <name> | --check'); process.exit(2); }
const rec = JSON.parse(readFileSync(incoming, 'utf8'));
const { ok } = regrow(rec);
if (!ok) { console.error('refused: the run does not grow again identically from its recorded replies'); process.exit(1); }
const outPath = `data/runs/${name}.json`;
writeFileSync(new URL(`../${outPath}`, import.meta.url), JSON.stringify(rec, null, 1) + '\n');
const pub = read('data/published.json'); pub[name] = outPath;
writeFileSync(new URL('../data/published.json', import.meta.url), JSON.stringify(pub, null, 1) + '\n');
console.log(`${name}: ${rec.sealed} cells, alive=${rec.alive}; grown again identically with no model, published to ${outPath}`);
