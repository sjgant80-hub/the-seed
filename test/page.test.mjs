import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, page, KERNELS, body, rewrite } from '../scripts/make-page.mjs';

const root = new URL('..', import.meta.url);
const ROOT = fileURLToPath(root).replace(/[\\/]$/, '');
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const LF = (s) => s.split('\r\n').join('\n');

test('index.html is exactly the build of page/ and the kernels, baked from the published plant', { skip: !existsSync(`${ROOT}/index.html`) && 'not built yet' }, async () => {
  const html = LF(read('index.html')), built = await page(ROOT);
  let i = 0; while (i < html.length && html[i] === built[i]) i++;
  assert.equal(html.length === built.length && i === html.length, true, `index.html and the build first differ at character ${i} of ${html.length} (built ${built.length}):\nINDEX: ${JSON.stringify(html.slice(Math.max(0, i - 120), i + 160))}\nBUILT: ${JSON.stringify(built.slice(Math.max(0, i - 120), i + 160))}`);
});

test('every kernel is inlined byte for byte, its imports read from the scopes above it', () => {
  const html = LF(build(ROOT));
  for (const [ns, file] of KERNELS) {
    const { code } = body(read(file), file);
    assert.ok(html.includes(`const ${ns} = (() => {\n${code}\n`), `${file} is not inlined as built`);
    for (const line of LF(read(file)).split('\n')) {
      if (line.startsWith('import ')) assert.ok(rewrite(line, file), `${file}: an import the page cannot inline: ${line}`);
    }
  }
  assert.equal(new Set(KERNELS.map(([, f]) => f.split('/').pop())).size, KERNELS.length, 'no two kernels share a file name');
});
