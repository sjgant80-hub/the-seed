// seal.mjs — freeze every file that can change a plant: the nine kernels and the page's own kernels (the task set and
// the glass are inlined into the page, and the task set fixes what the model is asked). Writes SEAL.json, a SHA-256 of
// each file's bytes. test/seal.test.mjs fails if a sealed byte changes, and a published plant records this seal's hash.
//   node scripts/seal.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sha = (b) => createHash('sha256').update(b).digest('hex');
export const SEALED = [
  ...readdirSync('src').filter((f) => f.endsWith('.mjs')).sort().map((f) => `src/${f}`),
  'page/seedset.js', 'page/glass.js',
];
if (process.argv[1] && process.argv[1].endsWith('seal.mjs')) {
  const files = Object.fromEntries(SEALED.map((f) => {
    const b = readFileSync(f);
    if (b.includes(13)) throw new Error(`${f} has a carriage return: the seal hashes LF bytes only`);
    return [f, sha(b)];
  }));
  writeFileSync('SEAL.json', JSON.stringify({ v: 'the-seed-seal/1', note: 'every file that can change a plant, frozen; a published plant records the SHA-256 of this file', files }, null, 1) + '\n');
  console.log(`SEAL.json: ${SEALED.length} files · seal sha256 ${sha(readFileSync('SEAL.json')).slice(0, 12)}`);
}
