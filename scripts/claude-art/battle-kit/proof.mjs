// Working proofs for the battle kit: a row of Claude frames beside Astra's nearest, drawn as the game draws them (scaled by
// logical height, set on the ground anchor), and a clip's frames laid over each other (the onion skin: do the feet stay
// planted, does the body move on smooth arcs?) and played along a strip. Used while drawing; the committed evidence is
// scripts/claude-art/compare.mjs (play size) and scripts/claude-art/battle-kit/motion.mjs (clips moving beside hers).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { astraFrameHtml, claudeFrameHtml } from '../proof-rig.mjs';
import { shoot } from '../kit/browser.mjs';

const SHARED = readFileSync(fileURLToPath(new URL('../../../public/assets/claude-standins/svg/_shared-defs.svg', import.meta.url)), 'utf8');

/**
 * rows: [{ title, items: [{ label, astra?: name, frame?: personFrame output, h?: multiple of H }], onion?: bool }]
 */
export async function proofRows(page, rows, path, { H = 150, gap = 1.05, background = '#d9cda8' } = {}) {
  const parts = [];
  let y = 40, width = 400;
  for (const row of rows) {
    const rowH = H * Math.max(...row.items.map(it => it.h || 1)) * 1.15 + 40;
    y += rowH;
    let x = 30;
    parts.push(`<div style="position:absolute;left:8px;top:${y - rowH - 2}px;font:bold 13px Georgia;color:#3a2a1a">${row.title || ''}</div>`);
    const opacity = row.onion ? 1 / Math.max(1.6, row.items.length * 0.7) : 1;
    const ox = x + H * 0.8;
    for (const it of row.items) {
      const height = H * (it.h || 1);
      const px = row.onion ? ox : x + H * 0.5 * (it.w || 1);
      const html = it.astra ? astraFrameHtml(it.astra, px, y, height) : claudeFrameHtml(it.frame, px, y, height);
      parts.push(row.onion ? html.replace('position:absolute;', `position:absolute;opacity:${opacity};`) : html);
      if (!row.onion) {
        parts.push(`<div style="position:absolute;left:${px - 70}px;top:${y + 6}px;width:140px;text-align:center;font:10px Georgia;color:${it.astra ? '#23180f' : '#6a1e10'}">${it.astra ? 'Astra: ' + it.astra : it.label}</div>`);
        x += H * gap * (it.w || 1);
      }
    }
    if (row.onion) x = ox + H;
    parts.push(`<div style="position:absolute;left:0;top:${y}px;width:${Math.max(x, 400)}px;height:1px;background:rgba(60,40,20,.35)"></div>`);
    width = Math.max(width, x + 40);
  }
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${background}"><svg width="0" height="0" style="position:absolute">${SHARED}</svg>${parts.join('')}</body>`;
  return shoot(page, html, Math.ceil(width), Math.ceil(y + 40), path, { transparent: false });
}
