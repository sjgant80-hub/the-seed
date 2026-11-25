// app.js — the page. It plants the seed with a small model running in this tab: asks the model each task, then runs the
// pure plant loop (PLANT) over its replies, and draws the result on the glass. On load it shows the published plant run,
// baked in at build time so the numbers read with scripts off. Browser-only APIs are guarded so the build can render
// this same script headless.
const MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const WEBLLM = 'https://esm.run/@mlc-ai/web-llm';
const NM = 'not planted yet';
const S = { data: { published: null, gates: null }, engine: null, gpu: null, canRun: false, glass: null, busy: false, local: null };
const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bind = (key, html) => { if (typeof document === 'undefined') return; for (const e of document.querySelectorAll(`[data-bind="${key}"]`)) e.innerHTML = html; };
const getJSON = async (p) => { try { const r = await fetch(p, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } };

// ── the model, in the tab ──
async function device() {
  const out = $('device'); if (!out) return;
  if (typeof navigator === 'undefined' || !navigator.gpu) { out.innerHTML = '<span class="fail">This browser has no WebGPU, so the model cannot run here.</span> The recorded plant still reads, below.'; return; }
  try {
    const a = await navigator.gpu.requestAdapter();
    if (!a) throw new Error('no adapter');
    const info = a.info || (a.requestAdapterInfo ? await a.requestAdapterInfo() : {});
    S.gpu = [info.vendor, info.architecture].filter(Boolean).join(' ') || 'WebGPU'; S.canRun = true;
    out.innerHTML = `<span class="pass">WebGPU is available</span> (${esc(S.gpu)}). Press Plant it here.`;
  } catch { out.innerHTML = '<span class="fail">WebGPU did not start on this device.</span> The recorded plant still reads, below.'; }
}
async function loadModel(out) {
  if (S.engine) return true;
  if (!S.canRun) { if (out) out.innerHTML = '<span class="fail">No WebGPU here, so the model cannot run.</span>'; return false; }
  try {
    const webllm = await import(WEBLLM);
    S.engine = await webllm.CreateMLCEngine(MODEL, { initProgressCallback: (p) => { if (out) out.textContent = p.text; } });
    return true;
  } catch (e) { if (out) out.innerHTML = `<span class="fail">The model did not load:</span> ${esc(e && e.message)}`; return false; }
}
async function sealHash() {
  try { const r = await fetch('SEAL.json', { cache: 'no-store' }); if (!r.ok) return null; const text = (await r.text()).split('\r\n').join('\n'); const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); } catch { return null; }
}
async function ask(prompt) {
  const r = await S.engine.chat.completions.create({ messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 160 });
  return (r.choices && r.choices[0] && r.choices[0].message.content) || '';
}

// the tasks the live plant needs the model to answer: the floor, the cells, and the sibling each proven cell would forge
function liveTasks() {
  const floor = SEEDSET.FLOOR, cells = SEEDSET.CELLS;
  const siblings = cells.filter((c) => c.verify === 'proven').map((c) => PLANT.sibling({ id: c.id, ask: c.ask, task: c.id, bond: { root: 'exact-arithmetic' }, strength: 'proven' })).filter(Boolean);
  return { floor, cells, all: [...floor, ...cells, ...siblings] };
}

async function plantLive() {
  if (S.busy) return; const out = $('plantOut'); if (!out) return;
  S.busy = true; $('plant').disabled = true;
  try {
    if (!(await loadModel(out))) { S.busy = false; $('plant').disabled = false; return; }
    const { floor, cells, all } = liveTasks();
    const reply = new Map();
    for (let i = 0; i < all.length; i++) { const t = all[i]; out.textContent = `asking the model: ${i + 1} of ${all.length}…`; reply.set(t.id, await ask(SEEDSET.prompt(t))); }
    const generate = (t) => reply.get(t && t.id) || '';
    const record = PLANT.plant(generate, { floorTasks: floor, cellTasks: cells, at: new Date().toISOString() });
    record.model = MODEL; record.gpu = S.gpu; record.venue = 'tab (WebLLM, WebGPU)'; record.sealSha256 = await sealHash();
    record.replies = Object.fromEntries(reply); // every model reply, so the run re-grows with no model to the same result
    S.local = record;
    show(record);
    out.innerHTML = `<b>Planted.</b> ${record.sealed} cells sealed, ${record.alive ? 'and the pattern reproduced — the organism is <span class="pass">alive</span>' : 'but it did not reproduce a sealed next cell'}. Nothing left your browser. <button id="save" class="quiet" type="button">Save this plant</button>`;
    const sv = $('save'); if (sv) sv.addEventListener('click', () => saveRun(record));
  } catch (e) { out.innerHTML = `<span class="fail">It stopped:</span> ${esc(e && e.message)}`; }
  S.busy = false; $('plant').disabled = false;
}
async function saveRun(record) {
  try { const r = await fetch('http://127.0.0.1:8842/save?name=plant', { method: 'POST', body: JSON.stringify(record) }); $('save').textContent = r.ok ? 'saved' : 'save failed'; } catch { $('save').textContent = 'no receiver'; }
}

// ── rendering (the live run, or the published one) ──
function shown() { return S.local || (S.data.published) || null; }
function strengthTally(record) { const t = { proven: 0, grounded: 0 }; for (const c of (record && record.cells) || []) if (c.sealed) t[c.strength] = (t[c.strength] || 0) + 1; return t; }

function render() {
  const r = shown();
  const gates = S.data.gates && S.data.gates.files ? S.data.gates.files : {};
  // blueprint: the nine organs and their gates
  const ORGANS = [
    ['src/genome.mjs', 'The genome', 'The four laws every cell runs on itself at birth: describe, verify, prune, know your edge.'],
    ['src/floor.mjs', 'The axiom floor', 'What the seed re-derives itself, with no model: exact arithmetic and byte-equality. The termination below.'],
    ['src/verifier.mjs', 'The verifier contract', 'The bond-check any verifier plugs into, with its floor and strength; a bond is only as strong as its weakest root.'],
    ['src/loop.mjs', 'The loop', 'Generate, verify-or-dissolve, crystallise. One turn, one sealed cell.'],
    ['src/terminate.mjs', 'The terminations', 'The floor below, and a human above: nothing irreversible without a grant the seed cannot mint.'],
    ['src/watcher.mjs', 'The watcher skeleton', 'Each layer wraps the one below, with a hard budget, and emits telemetry for the glass.'],
    ['src/forge.mjs', 'The forge', 'A sealed cell reproduces the next; it never emits debris.'],
    ['src/distill.mjs', 'The distillation', 'Verified cells to training data; adopt new weights only if they beat the sealed set, and only with a grant.'],
    ['src/plant.mjs', 'The plant', 'Probe the floor, grow and seal cells, prove the pattern reproduces. Does no irreversible act.'],
  ];
  const gate = (f) => { const g = gates[f]; if (!g) return '<span class="pend">built; gate not recorded</span>'; return g.clean ? `<span class="pass">gated ${g.killed}/${g.total}</span>` : `<span class="fail">gate not clean ${g.killed}/${g.total}</span>`; };
  const blueprint = `<table><thead><tr><th>organ</th><th>what it is</th><th>proof</th></tr></thead><tbody>${ORGANS.map(([f, n, d]) => `<tr><td><b>${esc(n)}</b><br><span class="small">${esc(f)}</span></td><td>${esc(d)}</td><td>${gate(f)}</td></tr>`).join('')}</tbody></table>`;
  if ($('blueprint')) $('blueprint').innerHTML = blueprint;
  const w = S.data.walk;
  if ($('walk')) $('walk').innerHTML = w ? `<h3>A simulated buyer walk</h3><p class="small">${esc(w.note)}</p>${(w.personas || []).map((p) => `<details><summary>${esc(p.who)}: ${esc(p.verdict)}</summary><ul>${(p.gaps || []).map((g) => `<li>${esc(g.gap)} <span class="small">→ ${esc(g.fix)}</span></li>`).join('')}</ul></details>`).join('')}` : '';

  if (!r) {
    bind('h.source', 'No plant has been recorded yet.');
    for (const id of ['planted', 'floorTable', 'cellsTable']) if ($(id)) $(id).innerHTML = NM;
    for (const k of ['n.floor', 'n.sealed', 'n.proven', 'n.grounded', 'n.alive']) bind(k, '—');
    return;
  }
  const t = strengthTally(r), where = S.local ? 'this device' : 'the published plant';
  bind('n.floor', `${r.floor ? r.floor.right : 0}/${r.floor ? r.floor.asked : 0}`);
  bind('n.sealed', String(r.sealed));
  bind('n.proven', String(t.proven)); bind('n.grounded', String(t.grounded));
  bind('n.alive', r.alive ? 'yes' : 'no');
  bind('h.source', `From ${esc(where)}${r.model ? `: ${esc(r.model)}${r.gpu ? `, ${esc(r.gpu)}` : ''}` : ''}${r.at ? ` (${esc(String(r.at).slice(0, 10))})` : ''}.`);
  if ($('planted')) $('planted').innerHTML = `<p>Planted, the seed probed the floor, grew <b>${r.sealed}</b> cells (${t.proven} proven, ${t.grounded} grounded) and dissolved <b>${r.dissolved}</b>. A sealed cell carried the seed and forged the next, which grew and sealed in turn: the pattern is self-similar, so the organism is <b class="${r.alive ? 'pass' : 'fail'}">${r.alive ? 'alive' : 'not yet alive'}</b>. The seed did nothing irreversible — it asked for no grant.</p>`;
  if ($('floorTable')) $('floorTable').innerHTML = `<table><thead><tr><th>axiom task</th><th>floor</th><th>model, cold</th></tr></thead><tbody>${(r.floor && r.floor.rows || []).map((x) => `<tr><td>${esc(x.id)}</td><td>${esc(x.floor)}</td><td>${x.ok ? '<span class="pass">right</span>' : '<span class="fail">wrong</span>'}</td></tr>`).join('')}</tbody></table>`;
  if ($('cellsTable')) $('cellsTable').innerHTML = `<table><thead><tr><th>cell</th><th>the model wrote</th><th>bond</th></tr></thead><tbody>${(r.cells || []).map((c) => `<tr><td>${esc(c.ask)}</td><td>${esc(String(c.reply).slice(0, 40))}</td><td>${c.sealed ? `<span class="${c.strength === 'proven' ? 'proven' : 'grounded'}">${esc(c.strength)}</span>` : `<span class="fail">dissolved</span> <span class="small">(${esc(c.why)})</span>`}</td></tr>`).join('')}</tbody></table>`;
}

function show(record) { S.local = record || S.local; render(); if (S.glass && record) try { S.glass.draw(record); } catch { /* glass is decoration */ } }
function play() { if (S.data.published) { S.local = null; render(); if (S.glass) try { S.glass.draw(S.data.published); } catch { /* ignore */ } } }

// ── start ──
const ready = (async function start() {
  const published = await getJSON('data/published.json');
  const P = published || {};
  S.data.published = P.plant ? await getJSON(P.plant) : null;
  S.data.walk = P.walk ? await getJSON(P.walk) : null;
  S.data.gates = await getJSON('data/gates.json');
  if (typeof document !== 'undefined') {
    const canvas = $('glass');
    try { S.glass = canvas && typeof canvas.getContext === 'function' ? GLASS.createGlass(canvas) : null; } catch { S.glass = null; }
    const p = $('plant'); if (p) p.addEventListener('click', plantLive);
    const pl = $('play'); if (pl) pl.addEventListener('click', play);
  }
  render();
  if (S.glass && S.data.published) try { S.glass.draw(S.data.published); } catch { /* ignore */ }
  device();
})();
if (typeof window !== 'undefined') window.__seed = { S, ready, render, plantLive, liveTasks };
