// house-app.js — the house layer for The Seed. It adds nothing to what this build proves: it waits for the page
// script above to finish, reads the recorded plant and the gate record that script loaded, and shows them the house
// way: receipts, the organs as a stack, and a crystal whose lit faces are organs, grown cells and probes of the floor.
// The receipts are the published plant's, and stay so when a visitor plants one of their own in the glass below.
window.__houseLayer = (async () => {
  await window.__seed.ready;
  const S = window.__seed.S, r = S.data.published, gates = S.data.gates || {}, files = gates.files || {};
  const el = (id) => document.getElementById(id), safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = (href, words) => `<a class="src" href="${href}">receipt: ${words} ↗</a>`, of = (x) => `<span class="was" style="font-size:.42em"> /${safe(x)}</span>`;
  const stat = (n, lab, s) => `<div class="stat reveal"><div class="n">${n}</div><div class="lab">${lab}</div>${s}</div>`;
  const SEALING = '<span class="tag gd">sealing now</span>';
  const faces = [];                                                  // [state, what the face says, the section it belongs to]

  // the organs: the page script has already drawn them as a table, from its own list; this reads that table
  const table = String(el('blueprint') && el('blueprint').innerHTML || '');
  const organs = [...table.matchAll(/<tr><td><b>([^<]*)<\/b><br><span class="small">([^<]*)<\/span><\/td><td>([^<]*)<\/td>/g)].map((m) => ({ name: m[1], file: m[2], line: m[3] }));
  // a gated file that is not one of the organs is listed after them, by what it is
  const ALSO = { 'genome/cell.mjs': ['The birth check', 'This repository\'s own answers when the estate asks it to prove it is a cell.'] };
  for (const f of Object.keys(files)) if (!organs.some((o) => o.file === f)) organs.push({ name: safe((ALSO[f] || [f])[0]), file: safe(f), line: safe((ALSO[f] || ['', ''])[1]) });
  const rows = organs.map((o, i) => {
    const g = files[o.file], state = !g ? 2 : g.clean === true ? 1 : 3;
    faces.push([state, `<b>${o.name}</b> · ${!g ? 'gate not recorded yet' : `${g.clean === true ? 'gated' : 'gate not clean'} ${g.killed}/${g.total}`}`, 'organs']);
    return `<div class="srow ${state === 3 ? 'red' : state === 2 ? 'gold' : ''}"><div class="d">${String(i + 1).padStart(2, '0')}</div><div class="nm"><b>${o.name}</b><span>${o.line}</span>${!g ? SEALING : g.clean === true ? `<span class="tag cy">gated ${g.killed}/${g.total}</span>` : `<span class="tag rd">gate not clean ${g.killed}/${g.total}</span>`}</div></div>`;
  });
  el('hsClaims').innerHTML = rows.join('') || `<div class="srow gold"><div class="d">—</div><div class="nm"><span>the organs are not listed yet</span>${SEALING}</div></div>`;

  // the pre-registered claims, each verdict COMPUTED from the record by CLAIMS.evaluate — never asserted
  const verdicts = CLAIMS.evaluate({ gates, plant: r && Array.isArray(r.cells) ? r : {} });
  el('claimRows').innerHTML = verdicts.map((c) => {
    const state = c.pass === true ? 1 : c.pass === false ? 3 : 2;
    faces.push([state, `<b>${c.id} ${safe(c.name)}</b> · ${c.pass === true ? 'pass' : c.pass === false ? 'FAIL, kept' : 'sealing'}`, 'claims']);
    const tag = c.pass === true ? '<span class="tag cy">pass</span>' : c.pass === false ? '<span class="tag rd">fail · kept</span>' : SEALING;
    return `<div class="srow ${state === 3 ? 'red' : state === 2 ? 'gold' : ''}"><div class="d">${c.id}</div><div class="nm"><b>${safe(c.name)}</b><span>${safe(c.result)}</span>${tag}</div></div>`;
  }).join('') || `<div class="srow gold"><div class="d">—</div><div class="nm"><span>the claims are not decided yet</span>${SEALING}</div></div>`;

  // the receipts: the recorded plant, then the gate
  const stats = [];
  if (r && r.floor && Array.isArray(r.cells)) {
    const t = { proven: 0, grounded: 0 }; for (const c of r.cells) if (c.sealed) t[c.strength] = (t[c.strength] || 0) + 1;
    const plant = src('data/runs/plant.json', 'the recorded plant'), one = r.dissolved === 1;
    stats.push(stat(`<span class="now">${safe(r.sealed)}</span>${of(r.cells.length)}`, `<b>Cells sealed, of ${r.cells.length} grown.</b> ${t.proven} proven by exact arithmetic, ${t.grounded} grounded in a cited document.`, plant));
    stats.push(stat(`<span class="${r.dissolved > 0 ? 'bad' : 'now'}">${safe(r.dissolved)}</span>`, `<b>${one ? 'Cell' : 'Cells'} dissolved.</b> The check did not pass, so ${one ? 'it was' : 'they were'} not kept.`, plant));
    stats.push(stat(`<span class="was">${safe(r.floor.right)}</span>${of(r.floor.asked)}`, '<b>Right on the floor, cold.</b> The same model with no check: the bar a grown cell has to beat.', plant));
    stats.push(stat(r.alive ? '<span class="now">yes</span>' : '<span class="bad">no</span>', r.alive ? '<b>It reproduces.</b> A sealed cell carried the seed and forged the next, which grew and sealed in turn.' : '<b>It did not reproduce.</b> No sealed cell forged a next one that sealed.', plant));
    for (const c of r.cells) faces.push([c.sealed ? 1 : 3, `<b>Cell ${safe(c.id)} · ${safe(c.ask)}</b> · ${c.sealed ? `sealed, ${safe(c.strength)}` : `dissolved: ${safe(c.why)}`}`, 'result']);
    for (const p of r.floor.rows || []) faces.push([p.ok ? 1 : 3, `<b>Floor probe ${safe(p.id)}</b> · ${safe(p.floor)} · the model alone got it ${p.ok ? 'right' : 'wrong'}`, 'result']);
  } else stats.push(`<div class="stat"><div class="n"><span class="wait">—</span></div><div class="lab">The recorded plant. ${SEALING}</div></div>`);
  if (Number.isInteger(gates.killed) && Number.isInteger(gates.total)) stats.push(stat(`<span class="${gates.clean === true ? 'now' : 'bad'}">${gates.killed}</span>${of(gates.total)}`, `<b>Planted bugs caught.</b> Across its ${Object.keys(files).length} gated files, by their own tests.`, src('data/gates.json', 'the gate record')));
  el('hsReceipts').innerHTML = stats.join('');

  const rest = `${r ? `${safe(r.sealed)} cells sealed · ${safe(r.dissolved)} dissolved and kept on the page · ` : ''}${Number.isInteger(gates.killed) ? `${gates.killed} of ${gates.total} planted bugs caught · ` : ''}point at a face`;
  el('hsFacet').innerHTML = rest;
  const crystal = CRYSTAL.mount(el('crystal'), { energy: 0.9 });
  if (crystal) {
    crystal.setFaces(Array.from({ length: 32 }, (_, i) => (faces[i] ? faces[i][0] : 0)));
    crystal.onHover((i) => { el('hsFacet').innerHTML = faces[i] ? faces[i][1] : rest; });
    crystal.onPick((i) => { const s = el(faces[i] ? faces[i][2] : 'result'); if (s && s.scrollIntoView) s.scrollIntoView({ behavior: 'smooth' }); });
    HOUSE.bindScroll(crystal, 0.9);
  }
  HOUSE.reveal(document); HOUSE.light(document);
})();
