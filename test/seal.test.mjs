import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SEALED } from '../scripts/seal.mjs';

const root = new URL('..', import.meta.url);
const ROOT = fileURLToPath(root).replace(/[\\/]$/, '');
const sha = (b) => createHash('sha256').update(b).digest('hex');

test('every sealed file still has the bytes the seal froze', { skip: !existsSync(`${ROOT}/SEAL.json`) && 'not sealed yet' }, () => {
  const seal = JSON.parse(readFileSync(`${ROOT}/SEAL.json`, 'utf8'));
  assert.equal(seal.v, 'the-seed-seal/1');
  assert.deepEqual(Object.keys(seal.files).sort(), [...SEALED].sort(), 'the seal lists exactly the sealed files');
  for (const f of SEALED) {
    const bytes = readFileSync(`${ROOT}/${f}`);
    assert.ok(!bytes.includes(13), `${f} has a carriage return`);
    assert.equal(sha(bytes), seal.files[f], `${f} changed since the seal`);
  }
});
