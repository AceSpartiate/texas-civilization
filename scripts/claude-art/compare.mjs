// The play-size comparison (docs/ART_STYLE.md: "check it beside existing game art at actual play size"). For each area
// module, every Claude frame is drawn beside the Astra frames nearest to it, on the map's grass, with the game's own sprite
// arithmetic (public/art.js `drawSprite`: scaled so the logical height is the height asked for, set down on the anchor), at
// the two sizes a class sees a person: 40 px (the family's land at the classroom zoom) and 77 px (zoomed to the yard), and
// once at 150 px to see the drawing. Written to docs/evidence/claude-art/compare-<module>.png.
//
// Each frame names what it is compared with (`compare` in its area module: Astra frame names, and the height each is drawn
// at as a multiple of a person); a frame that names nothing is compared with the idle of its figure where one exists.
// The in-game pictures are the browser proofs' own: `npm run test:work` writes docs/evidence/work-house-close.png (rust
// felling in rust-chop beside Astra's cast) and work-wood-pile-*.png.
//
// Run: node scripts/claude-art/compare.mjs [module ...]
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadModules } from '../build-claude-standins.mjs';
import { withBrowser } from './kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../public/assets/frontier-v1/', import.meta.url));
const CLAUDE = fileURLToPath(new URL('../../public/assets/claude-standins/', import.meta.url));
const astra = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8'));
const claude = JSON.parse(readFileSync(CLAUDE + 'atlas.json', 'utf8'));
// The map's grass under the family's land (read off docs/evidence/work-wood-pile-1366.png), and a tuft of hers for texture.
const GRASS = '#7f9f58';

const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl', 'girl', 'boy', 'smallchild'];
/** The frames a Claude frame is compared with: its module's `compare`, else its figure's east idle. [name, height in persons]. */
function comparedWith(frame) {
  if (frame.compare) return frame.compare.map(entry => Array.isArray(entry) ? entry : [entry, 1]);
  const figure = FIGURES.sort((a, b) => b.length - a.length).find(f => frame.name.startsWith(`${f}-`));
  return figure ? [[`${figure}-idle-e`, 1], [`${figure}-idle-s`, 1]] : [];
}

async function compareModule(page, m, match = null) {
  // `match` (a regular expression) keeps a module of hundreds of frames to one readable sheet: `--match "^rust-"` for one figure.
  const frames = Object.values(m.SHEETS).flatMap(spec => spec.frames).filter(f => claude.frames[f.name] && (!match || new RegExp(match).test(f.name)));
  if (!frames.length) return null;
  const heightOf = f => f.height ?? 1; // a Claude frame's drawn height, as a multiple of a person
  const refs = [...new Map(frames.flatMap(comparedWith).filter(([name]) => astra.frames[name]).map(r => [r[0], r])).values()];
  const sheets = new Set([...refs.map(([name]) => `a:${astra.frames[name].sheet}`), ...frames.map(f => `c:${claude.frames[f.name].sheet}`)]);
  const images = {};
  for (const key of sheets) {
    const [lib, sheet] = key.split(':');
    const file = lib === 'a' ? ASTRA + astra.sheets[sheet].image : CLAUDE + claude.sheets[sheet].image.split('/').at(-1);
    images[key] = 'data:image/png;base64,' + readFileSync(file).toString('base64');
  }
  const items = [...refs.map(([name, h]) => ({ lib: 'a', name, frame: astra.frames[name], h, label: `Astra: ${name}` })),
    ...frames.map(f => ({ lib: 'c', name: f.name, frame: claude.frames[f.name], h: heightOf(f), label: `Claude: ${f.name}` }))];
  const sizes = [40, 77, 150];
  const gap = s => s * 1.25;
  // A module of many frames wraps onto several lines of the three rows, each line no wider than about 2600 px at 150 px.
  const span = it => Math.max(gap(150), it.frame.w * (150 * it.h / (it.frame.logicalHeight || it.frame.h)) + 20);
  const lines = [[]];
  for (const it of items) { const line = lines.at(-1); if (line.length && line.reduce((sum, one) => sum + span(one), 0) + span(it) > 2600) lines.push([it]); else line.push(it); }
  const width = Math.max(900, 40 + Math.max(...lines.map(line => line.reduce((sum, it) => sum + span(it), 0))));
  const rowH = sizes.map(s => s * 2.1 + 40), height = 60 + lines.length * rowH.reduce((a, b) => a + b, 0);
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c" width="${Math.ceil(width)}" height="${Math.ceil(height)}"></canvas>
<script>
const lines = ${JSON.stringify(lines)}, sizes = ${JSON.stringify(sizes)}, rowH = ${JSON.stringify(rowH)}, sources = ${JSON.stringify(images)};
const c = document.getElementById('c'), ctx = c.getContext('2d');
ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height);
// A little of the map's texture: darker flecks, as its grass has.
for (let i = 0; i < 900; i++) { const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * c.width, y = (Math.sin(i * 78.233) * 12543.21 % 1 + 1) % 1 * c.height; ctx.fillStyle = 'rgba(60,80,30,.18)'; ctx.fillRect(x, y, 3, 1.5); }
ctx.fillStyle = '#23180f'; ctx.font = 'bold 15px Georgia';
ctx.fillText(${JSON.stringify(`${m.module}: Claude-drawn frames (temporary) beside Astra's, drawn as the game draws them, on the map's grass. Rows: a person 40 px, 77 px, 150 px.`)}, 12, 24);
const load = src => new Promise(done => { const im = new Image(); im.onload = () => done(im); im.onerror = () => done(null); im.src = src; });
window.onerror = message => { document.title = 'error: ' + message; };
(async () => {
  const img = {};
  for (const [key, src] of Object.entries(sources)) img[key] = await load(src);
  let top = 50;
  for (const items of lines) sizes.forEach((size, row) => {
    const ground = top + size * 1.75;
    let x = 30;
    ctx.fillStyle = '#23180f'; ctx.font = '12px Georgia'; ctx.fillText(size + ' px', 4, ground - size * 0.5);
    for (const it of items) {
      const f = it.frame, height = size * it.h, scale = height / (f.logicalHeight || f.h), w = f.w * scale, h = f.h * scale;
      const left = x + 40 + w * f.anchorX;
      ctx.drawImage(img[it.lib + ':' + f.sheet], f.x, f.y, f.w, f.h, left - w * f.anchorX, ground - h * f.anchorY, w, h);
      if (row === sizes.length - 1) { ctx.fillStyle = it.lib === 'a' ? '#23180f' : '#6a1e10'; ctx.font = '11px Georgia'; ctx.fillText(it.label, x + 10, ground + 16); }
      x += Math.max(size * 1.25, w + 20);
    }
    top += rowH[row];
  });
  document.title = 'done';
})();
</script></body>`;
  await page.setViewportSize({ width: Math.ceil(width), height: Math.ceil(height) });
  await page.setContent(html);
  await page.waitForFunction(() => document.title === 'done' || document.title.startsWith('error'));
  const title = await page.title();
  if (title !== 'done') throw new Error(`${m.module}: ${title}`);
  const path = `${OUT}compare-${m.module}${match ? '-' + match.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') : ''}.png`;
  await page.screenshot({ path, clip: { x: 0, y: 0, width: Math.ceil(width), height: Math.ceil(height) } });
  return path;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const args = process.argv.slice(2), at = args.indexOf('--match'), match = at >= 0 ? args[at + 1] : null;
  const only = args.filter((a, i) => at < 0 || (i !== at && i !== at + 1));
  const modules = (await loadModules()).filter(m => !only.length || only.includes(m.module));
  // A fresh page each module: one page reused for a second, larger canvas never ran its script.
  await withBrowser(async (first, browser) => { for (const m of modules) { const page = await browser.newPage({ deviceScaleFactor: 1 }); const path = await compareModule(page, m, match); await page.close(); if (path) console.log(path); } });
}
