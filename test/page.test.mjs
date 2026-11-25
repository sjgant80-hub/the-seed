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

const visible = (html) => html.slice(html.indexOf('<body>'), html.indexOf('<script type="module">'));
const words = (html) => visible(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('the page meets the house standard: the ship gate, and the kit it vendors is the house kit', async () => {
  const STANDARD = (await import('../vendor/house/standard.mjs')).default, html = LF(read('index.html'));
  const r = STANDARD.check(html);
  assert.equal(r.pass, true, r.rules.filter((x) => !x.pass).map((x) => `${x.id} ${x.name}: ${x.why}`).join(' | '));
  assert.ok(r.measured.viewWords <= 1250 && r.measured.longest <= 45, 'no wall of text greets a visitor');
  assert.deepEqual(r.measured.clashes, [], 'no id is on two elements: a script that asks for one gets the element it means');
  // every section the page had before the rebuild is still on it: each sits behind a click, none was dropped
  for (const id of ['start', 'how', 'numbers', 'built', 'limits', 'buyers', 'paper']) assert.ok(new RegExp(`<details class="honest reveal" id="${id}"`).test(html), `the ${id} section is on the page, folded`);
  for (const f of ['house.css', 'crystal.js', 'house.js', 'receipts.mjs', 'standard.mjs']) assert.ok(read(`vendor/house/${f}`).length > 500, f);
  for (const m of read('vendor/house/house.css').matchAll(/url\('([^']+\.woff2)'\)/g)) assert.ok(existsSync(new URL(m[1], root)), `the font ${m[1]} is in the repository`);
});

test('the receipts are the recorded plant and the gate record, and the stack is every gated file with its own count', () => {
  const html = LF(read('index.html')), text = words(html);
  const plant = JSON.parse(read('data/runs/plant.json')), gates = JSON.parse(read('data/gates.json')), files = Object.entries(gates.files);
  const strong = { proven: 0, grounded: 0 }; for (const c of plant.cells) if (c.sealed) strong[c.strength]++;
  assert.equal(plant.sealed + plant.dissolved, plant.cells.length);
  for (const said of [
    `${plant.sealed} /${plant.cells.length} Cells sealed, of ${plant.cells.length} grown. ${strong.proven} proven by exact arithmetic, ${strong.grounded} grounded in a cited document.`,
    `${plant.dissolved} Cells dissolved. The check did not pass, so they were not kept.`,
    `${plant.floor.right} /${plant.floor.asked} Right on the floor, cold.`,
    plant.alive ? 'yes It reproduces.' : 'no It did not reproduce.',
    `${gates.killed} /${gates.total} Planted bugs caught. Across its ${files.length} gated files, by their own tests.`,
  ]) assert.ok(text.includes(said), `the page does not say: ${said}`);
  // a dissolved cell is shown as a failure, in red, and never left off
  assert.match(html, new RegExp(`<span class="bad">${plant.dissolved}</span>`));
  const rows = [...html.matchAll(/<div class="srow[^"]*"><div class="d">(\d\d)<\/div><div class="nm"><b>[^<]*<\/b><span>[^<]*<\/span><span class="tag cy">gated (\d+)\/(\d+)<\/span>/g)];
  assert.equal(rows.length, files.length, 'one row for each gated file');
  assert.deepEqual(rows.map((m) => `${m[2]}/${m[3]}`), files.map(([, g]) => `${g.killed}/${g.total}`));
  assert.equal(rows.reduce((a, m) => a + Number(m[2]), 0), gates.killed);
});

test('nothing on the page is dead: every button is wired, every link has somewhere to go', () => {
  const html = LF(read('index.html')), app = read('page/app.js'), shown = visible(html), ids = [...shown.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const buttons = [...shown.matchAll(/<button[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(buttons, ['plant', 'play']);
  for (const id of buttons) assert.ok(app.split('\n').some((l) => l.includes(`= $('${id}'); if (`) && l.includes(".addEventListener('click', ")), `the button #${id} does nothing`);
  for (const m of shown.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), `a link goes to #${m[1]}, which is not on the page`);
  for (const m of shown.matchAll(/href="([^"#][^"]*)"/g)) if (!/^https?:/.test(m[1])) assert.ok(existsSync(new URL(m[1], root)), `a link goes to ${m[1]}, which is not in the repository`);
  // every id the page script and the house layer write to is on the page, once
  for (const src of [app, read('page/house-app.js')]) for (const m of src.matchAll(/(?:\$|el)\('([A-Za-z]+)'\)/g)) if (m[1] !== 'save') assert.equal(ids.filter((x) => x === m[1]).length, 1, `#${m[1]} is on the page once`);
});
