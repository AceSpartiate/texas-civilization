// One proof sheet per rig figure (docs/evidence/claude-art/rig-<figure>.png): every pose the rig can take, drawn at the
// source size on a transparent cell, with Astra's own south idle and east walk frame of the same identity at the left for
// comparison where she has drawn one. Read it to judge whether the figure keeps its identity across poses.
//
// Run: node scripts/claude-art/proof-rig.mjs [figure ...]   (PLAYWRIGHT_MODULE / BROWSER_EXECUTABLE as for the proofs)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAST, PEOPLE } from './kit/style.mjs';
import { drawPerson, frameOf, personFrame } from './kit/rig.mjs';
import { POSES, INFANT_POSES } from './kit/poses.mjs';
import { drawHorse, mountedFrame } from './kit/horse.mjs';
import { withBrowser, shoot } from './kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../public/assets/frontier-v1/', import.meta.url));
const SHARED = readFileSync(fileURLToPath(new URL('../../public/assets/claude-standins/svg/_shared-defs.svg', import.meta.url)), 'utf8');
const atlas = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8'));
const dataUrls = new Map();
const sheetUrl = sheet => {
  if (!dataUrls.has(sheet)) dataUrls.set(sheet, 'data:image/png;base64,' + readFileSync(ASTRA + atlas.sheets[sheet].image).toString('base64'));
  return dataUrls.get(sheet);
};

/** An Astra frame drawn as the game would at `height` logical px, its ground anchor at (x, y) of the page. */
export function astraFrameHtml(name, x, y, height) {
  const f = atlas.frames[name];
  if (!f) return '';
  const s = height / (f.logicalHeight || f.h), sheet = atlas.sheets[f.sheet];
  const w = f.w * s, h = f.h * s;
  return `<div style="position:absolute;left:${x - w * f.anchorX}px;top:${y - h * f.anchorY}px;width:${w}px;height:${h}px;background:url(${sheetUrl(f.sheet)}) -${f.x * s}px -${f.y * s}px / ${sheet.width * s}px ${sheet.height * s}px"></div>`;
}
/** A Claude frame (from personFrame) drawn the same way. */
export function claudeFrameHtml(frame, x, y, height) {
  const s = height / frame.logicalHeight, w = frame.w * s, h = frame.h * s;
  return `<div style="position:absolute;left:${x - w * frame.anchorX}px;top:${y - h * frame.anchorY}px;width:${w}px;height:${h}px">${frame.svg.replace(/<svg /, `<svg style="width:${w}px;height:${h}px;display:block" `)}</div>`;
}

const ASTRA_REF = { rust: ['rust-idle-s', 'rust-walk-1', 'rust-work-3'], teal: ['teal-idle-s', 'teal-walk-1', 'teal-work-3'], elder: ['elder-idle-s', 'elder-walk-1', 'elder-work-3'],
  blue: ['blue-idle-s', 'blue-walk-1', 'blue-work-3'], 'rust-woman': ['rust-woman-idle-s', 'rust-woman-walk-1', 'rust-woman-work-3'], indigo: ['indigo-idle-s', 'indigo-walk-1', 'indigo-work-3'],
  ochre: ['ochre-idle-s', 'ochre-walk-1', 'ochre-work-3'], 'blue-girl': ['blue-girl-idle-s', 'blue-girl-walk-1', 'blue-girl-work-3'], girl: ['girl-idle-s', 'girl-walk-1'], boy: ['boy-idle-s', 'boy-walk-1'],
  smallchild: ['smallchild-idle-s', 'smallchild-walk-1'], infant: ['infant-idle-s', 'infant-idle-e'], volunteer: ['volunteer-s', 'volunteer-march-1', 'volunteer-aim'], regular: ['regular-s', 'regular-march-1', 'regular-aim'],
  cavalryman: ['dragoon-s', 'dragoon-march-1'], townsman: [] };

export async function proofSheet(page, figure, path) {
  const H = 150, gap = 150, row = 230, parts = [], F = frameOf(figure);
  let x = 70, y = 190;
  parts.push(`<div style="position:absolute;left:8px;top:6px;font:bold 15px Georgia;color:#3a2a1a">${figure}: Astra's frames (left of the rule) and the Claude rig (right), at ${H} px logical height. Claude-drawn, temporary.</div>`);
  for (const ref of ASTRA_REF[figure] || []) { parts.push(astraFrameHtml(ref, x, y, H)); x += gap * 0.8; }
  parts.push(`<div style="position:absolute;left:${x - 30}px;top:40px;width:2px;height:${row * 3.5}px;background:#8a7a5a"></div>`);
  const cells = [];
  for (const [pose, make] of Object.entries(F.spec.age === 'infant' ? INFANT_POSES : POSES)) make(F).forEach((p, i) => cells.push({ label: `${pose} ${i + 1}`, pose: p }));
  const perRow = 9, start = x;
  cells.forEach((cell, i) => {
    if (i && i % perRow === 0) { x = start; y += row; }
    const frame = personFrame(`${figure}-proof-${i}`, ink => drawPerson(ink, figure, cell.pose), { note: cell.label });
    parts.push(claudeFrameHtml(frame, x, y, H));
    parts.push(`<div style="position:absolute;left:${x - 50}px;top:${y + 12}px;width:100px;text-align:center;font:11px Georgia;color:#3a2a1a">${cell.label}</div>`);
    x += gap;
  });
  if (!['smallchild', 'infant'].includes(figure)) {
    // Mounted, drawn as the game draws a rider (1.8 of a person), beside Astra's own mounted frame where she has one.
    y += row * 1.2;
    const horse = mountedFrame(`${figure}-proof-ride`, figure, 0);
    if (atlas.frames[`${figure}-ride-e-1`]) { parts.push(astraFrameHtml(`${figure}-ride-e-1`, 70 + H * 0.9, y, H * 1.8)); parts.push(`<div style="position:absolute;left:40px;top:${y + 12}px;font:11px Georgia;color:#3a2a1a">Astra: ${figure}-ride-e-1</div>`); }
    parts.push(claudeFrameHtml(horse, start + H * 1.6, y, H * 1.8));
    parts.push(`<div style="position:absolute;left:${start + H}px;top:${y + 12}px;font:11px Georgia;color:#3a2a1a">Claude: mounted, walking 1</div>`);
  }
  const width = start + perRow * gap + 120, height = y + 70;
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#d9cda8"><svg width="0" height="0" style="position:absolute">${SHARED}</svg>${parts.join('')}</body>`;
  await shoot(page, html, width, height, path, { transparent: false });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const figures = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CAST);
  await withBrowser(async page => { for (const figure of figures) { await proofSheet(page, figure, `${OUT}rig-${figure}.png`); console.log(`rig-${figure}.png`); } });
}
