// glass.js — the glass: it draws a plant record and decides nothing. A canvas of cells, each a diamond in the material
// of its strength (proven bright, grounded warm), stacked as they grow, with the floor at the base and the forged next
// cell branching off the first — the self-similar reproduction, made visible. Pure drawing; gated nowhere, checked by eye.

export function createGlass(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const COLOR = { proven: '#5ef2e4', grounded: '#f2b05e', unknown: '#5a6b78' };
  const diamond = (x, y, r, fill, glow) => {
    ctx.save();
    if (glow) { ctx.shadowColor = fill; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  };
  const line = (x1, y1, x2, y2, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  return {
    draw(record) {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#02070c'; ctx.fillRect(0, 0, W, H);
      const cells = (record && Array.isArray(record.cells) ? record.cells : []).filter((c) => c && c.sealed);
      const floor = record && record.floor ? record.floor : null;
      // the floor, a bar at the base
      const baseY = H - 34;
      ctx.fillStyle = '#0a1620'; ctx.fillRect(0, baseY, W, H - baseY);
      ctx.fillStyle = '#9fb0bd'; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(floor ? `axiom floor — the model cold: ${floor.right}/${floor.asked}` : 'axiom floor', 12, baseY + 21);
      // the cells, stacked upward, newest highest
      const n = Math.max(1, cells.length);
      const colX = W * 0.42, gap = Math.min(64, (baseY - 40) / n);
      cells.forEach((c, i) => {
        const y = baseY - 24 - i * gap, fill = COLOR[c.strength] || COLOR.unknown;
        if (i > 0) line(colX, y + gap - 14, colX, y + 14, '#24323c');
        else line(colX, baseY - 6, colX, y + 14, '#24323c');
        diamond(colX, y, 13, fill, true);
        ctx.fillStyle = '#c7d2da'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${String(c.ask || '').slice(0, 22)} — ${c.strength}`, colX + 24, y + 4);
      });
      // the self-similar next cell: branches off the first sealed cell, glowing, to one side
      const ss = record && record.selfSimilar;
      if (ss && ss.nextSealed && cells.length) {
        const y0 = baseY - 24, bx = colX - 110, by = y0 - 26;
        line(colX - 13, y0, bx + 13, by, '#2a3b44');
        diamond(bx, by, 11, '#5ef2e4', true);
        ctx.fillStyle = '#7fe8dd'; ctx.font = 'italic 11px ui-monospace, monospace';
        ctx.fillText('reproduces →', bx - 2, by - 20);
      }
      ctx.textAlign = 'left';
    },
  };
}

export default { createGlass };
