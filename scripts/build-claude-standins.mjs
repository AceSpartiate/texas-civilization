// Render the Claude-drawn stand-in art and write its own manifest.
//
// Everything registered here was drawn by Claude, not by Astra, to fill an open request in docs/ART_REQUESTS.md
// ("Claude-drawn stand-ins (replace with Astra's)"). It lives apart from her library on purpose: its own folder
// (public/assets/claude-standins/), its own sheets (every file prefixed `claude-`), its own atlas.json (every entry
// `madeBy: "claude"`), and the loader in public/art.js lets any frame of the same name in her atlas win. So when Astra
// delivers, say, `mark-need`, registering it through `npm run build:art` replaces this one without touching a line of
// the page; delete the SVG and the row in PIECES afterwards and rerun this script.
//
// Sources are hand-written SVGs in public/assets/claude-standins/svg/, one per frame, drawn at the request's delivered
// size. This script inlines them into one page per sheet and screenshots the sheet with a transparent background, so
// the PNGs never need a rasteriser dependency: only the Playwright the browser proofs already use.
//
// Run: PLAYWRIGHT_MODULE=... BROWSER_EXECUTABLE=... node scripts/build-claude-standins.mjs
//      (the same environment as the browser proofs; a plain `playwright` install also works)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../public/assets/claude-standins/', import.meta.url));
export const WEB_ROOT = '/assets/claude-standins/';

const MARKS = 'Request 2026-09-16 — the family panel’s marks';
const WINTER = 'Request 2026-09-16 — the winter’s icons';
const ICONS = 'Request 2026-09-15 — action icons for the family panel';
const PORTRAITS = 'Request 2026-09-15 — face portraits for the family panel';
const TOOLS = 'Request 2026-09-12 (second) — interiors and furnishings: the wagon’s tools';

/**
 * Every Claude-drawn frame: the name the code draws (the name Astra's delivery will carry, so hers replaces it), the
 * sheet it is packed on, the request it answers and what she should deliver in its place. The SVG source is
 * svg/claude-<name>.svg and the cell is the request's delivered size.
 */
export const SHEETS = {
  'claude-marks': { cell: 96, request: MARKS, replaceWith: '96 by 96, transparent, no text', frames: [
    'mark-need', 'mark-need-rider', 'mark-main', 'mark-idle', 'mark-auto-off', 'mark-auto-on',
  ] },
  'claude-icons-winter': { cell: 128, request: WINTER, replaceWith: '128 by 128, transparent, one silhouette, reads dimmed to 40 per cent', frames: [
    'icon-enlist-regular', 'icon-enlist-auxiliary', 'icon-join-garrison', 'icon-join-matamoros', 'icon-go-vote', 'icon-winter-recall',
    'icon-join-relief', 'icon-join-houston',
  ] },
  'claude-icons-actions': { cell: 128, request: ICONS, replaceWith: '128 by 128, transparent, one silhouette, reads dimmed to 40 per cent', frames: [
    'icon-survey-plot', 'icon-cut-lane', 'icon-dig-well', 'icon-plant-field', 'icon-harvest-field', 'icon-clear-plot', 'icon-fence-plot',
    'icon-build-house', 'icon-help-raise', 'icon-hunt-timber', 'icon-hunt-land', 'icon-practise-shooting', 'icon-sell-cotton',
    'icon-fetch-powder', 'icon-fetch-seed', 'icon-sell-food', 'icon-mend-hoe', 'icon-replace-hoe', 'icon-fell-trees', 'icon-haul-logs',
    'icon-travel-gonzales', 'icon-travel-home', 'icon-visit', 'icon-work', 'icon-rest', 'icon-stop-chore',
    'icon-visit-shop', 'icon-make-furniture', 'icon-buy-furniture',
  ] },
  'claude-portraits': { cell: 192, request: PORTRAITS, replaceWith: '192 by 192, head and shoulders facing the viewer, matching the sheet figure', frames: [
    'portrait-rust', 'portrait-teal', 'portrait-elder', 'portrait-blue', 'portrait-rust-woman', 'portrait-indigo', 'portrait-ochre',
    'portrait-blue-girl', 'portrait-girl', 'portrait-boy', 'portrait-smallchild', 'portrait-infant',
  ] },
  'claude-home-tools': { cell: 160, request: TOOLS, replaceWith: 'in the home-furnishings style and scale, standing or leaning as in a cabin', frames: [
    'home-hoe', 'home-felling-axe', 'home-broadaxe', 'home-froe', 'home-auger',
  ] },
};

export const sourceOf = name => `svg/claude-${name}.svg`;

/** The pieces that have a source on disk, sheet by sheet. A name listed without a source is simply not built yet. */
export function plannedSheets() {
  const planned = {};
  for (const [sheet, spec] of Object.entries(SHEETS)) {
    const frames = spec.frames.filter(name => existsSync(root + sourceOf(name)));
    if (frames.length) planned[sheet] = { ...spec, frames };
  }
  return planned;
}

const shared = () => readFileSync(root + 'svg/_shared-defs.svg', 'utf8');

/** One sheet's page: every piece inlined at its cell, columns by the square root, transparent ground. */
export function sheetPage(sheet, spec) {
  const columns = Math.ceil(Math.sqrt(spec.frames.length)), rows = Math.ceil(spec.frames.length / columns);
  const ids = new Map();
  const pieces = spec.frames.map((name, index) => {
    const svg = readFileSync(root + sourceOf(name), 'utf8');
    // Every SVG is inlined into one document, so an id must belong to one piece only.
    for (const id of svg.matchAll(/\bid="([^"]+)"/g)) {
      if (ids.has(id[1])) throw new Error(`${sheet}: id "${id[1]}" is in both ${ids.get(id[1])} and ${name}; prefix ids with the piece's name`);
      ids.set(id[1], name);
    }
    if (!new RegExp(`viewBox="0 0 ${spec.cell} ${spec.cell}"`).test(svg)) throw new Error(`${name}: viewBox must be 0 0 ${spec.cell} ${spec.cell}`);
    const x = (index % columns) * spec.cell, y = Math.floor(index / columns) * spec.cell;
    return { name, x, y, html: `<div style="position:absolute;left:${x}px;top:${y}px;width:${spec.cell}px;height:${spec.cell}px">${svg.replace(/<svg /, `<svg style="width:${spec.cell}px;height:${spec.cell}px;display:block" `)}</div>` };
  });
  const width = columns * spec.cell, height = rows * spec.cell;
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style><svg width="0" height="0" style="position:absolute">${shared()}</svg>${pieces.map(piece => piece.html).join('')}`;
  return { html, width, height, columns, rows, pieces };
}

export async function build({ chromium, executablePath } = {}) {
  const browser = await chromium.launch({ headless: true, ...(executablePath && { executablePath }) });
  const sheets = {}, frames = {};
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const [sheet, spec] of Object.entries(plannedSheets())) {
      const { html, width, height, columns, rows, pieces } = sheetPage(sheet, spec);
      await page.setViewportSize({ width, height });
      await page.setContent(html);
      await page.waitForTimeout(50);
      const file = `${sheet}.png`;
      const png = await page.screenshot({ path: root + file, omitBackground: true, clip: { x: 0, y: 0, width, height }, type: 'png' });
      sheets[sheet] = { image: WEB_ROOT + file, width, height, bytes: png.length, sha256: createHash('sha256').update(png).digest('hex'),
        madeBy: 'claude', request: spec.request, layout: { rows, columns, cell: spec.cell, method: 'Fixed cells; each frame is one whole cell of the SVG it was drawn in.' } };
      for (const piece of pieces) {
        frames[piece.name] = { sheet, x: piece.x, y: piece.y, w: spec.cell, h: spec.cell, anchorX: 0.5, anchorY: 1,
          madeBy: 'claude', request: spec.request, replaceWith: `${piece.name}: ${spec.replaceWith}`, source: sourceOf(piece.name),
          label: piece.name.replaceAll('-', ' '), kind: sheet };
      }
    }
  } finally { await browser.close(); }
  const manifest = {
    library: 'claude-standins', madeBy: 'claude',
    note: 'Claude-drawn stand-ins for open requests in docs/ART_REQUESTS.md, generated by scripts/build-claude-standins.mjs from the SVGs in svg/. Not Astra’s art. A frame of the same name in frontier-v1/atlas.json wins over one listed here, so registering her delivery replaces the stand-in; then delete the SVG and its entry and rerun the script. x/y/w/h are pixels in the named sheet; anchorX/anchorY the base centre.',
    sheets, frames,
  };
  writeFileSync(root + 'atlas.json', JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const manifest = await build({ chromium, executablePath: process.env.BROWSER_EXECUTABLE });
  console.log(`wrote ${Object.keys(manifest.sheets).length} sheets, ${Object.keys(manifest.frames).length} frames to ${root}atlas.json`);
}
