// Area F's play-size proofs: rows of Astra's and Claude's frames drawn as the game draws them (public/art.js `drawSprite`:
// scaled so the logical height is the height asked for, set down on the anchor, `lean` a shear about the foot), on the map's
// grass or a chosen ground, at the sizes a class sees them. `compare.mjs` puts every frame of a module in one long row; these
// are smaller scenes a person can actually look at: an upright tree, the shear that stood in for its gale, and the gale pose.
//
// Run: node scripts/claude-art/land/proof.mjs [scene ...]   (scenes: see SCENES below) -> docs/evidence/claude-art/land-*.png
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser } from '../kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../../public/assets/frontier-v1/', import.meta.url));
const CLAUDE = fileURLToPath(new URL('../../../public/assets/claude-standins/', import.meta.url));

/**
 * A scene: `rows` of items; an item is { name, h (persons), lean?, dx? (persons of room after it), label?, clip?: [names], ms? }.
 * `person` is the pixel height of a person; `ground` the colour under it. A `strip` item draws each frame of `clip` in turn
 * side by side (an animation's frames), so a proof shows motion as a film strip.
 */
export async function drawScene(page, { title, person = 77, ground = '#7f9f58', rows, width = 1400, file }) {
  const astra = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8')), claude = JSON.parse(readFileSync(CLAUDE + 'atlas.json', 'utf8'));
  const find = name => claude.frames[name] && !astra.frames[name] ? { lib: 'c', f: claude.frames[name] } : astra.frames[name] ? { lib: 'a', f: astra.frames[name] } : null;
  const needed = new Set();
  const items = rows.map(row => row.map(it => {
    const names = it.strip || [it.name];
    const found = names.map(n => ({ n, ...find(n) }));
    for (const x of found) if (x.f) needed.add(`${x.lib}:${x.f.sheet}`);
    return { ...it, found };
  }));
  const images = {};
  for (const key of needed) {
    const [lib, sheet] = key.split(':');
    const file = lib === 'a' ? ASTRA + astra.sheets[sheet].image : CLAUDE + claude.sheets[sheet].image.split('/').at(-1);
    images[key] = 'data:image/png;base64,' + readFileSync(file).toString('base64');
  }
  const rowH = rows.map(row => Math.max(...row.map(it => (it.h || 1) * person * 1.25)) + 46);
  const height = 44 + rowH.reduce((a, b) => a + b, 0);
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0"><canvas id="c" width="${width}" height="${Math.ceil(height)}"></canvas><script>
const rows = ${JSON.stringify(items)}, rowH = ${JSON.stringify(rowH)}, sources = ${JSON.stringify(images)}, person = ${person};
const c = document.getElementById('c'), ctx = c.getContext('2d');
ctx.fillStyle = ${JSON.stringify(ground)}; ctx.fillRect(0, 0, c.width, c.height);
for (let i = 0; i < 1400; i++) { const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * c.width, y = (Math.sin(i * 78.233) * 12543.21 % 1 + 1) % 1 * c.height; ctx.fillStyle = 'rgba(40,50,20,.14)'; ctx.fillRect(x, y, 3, 1.5); }
ctx.fillStyle = '#23180f'; ctx.font = 'bold 15px Georgia'; ctx.fillText(${JSON.stringify(title)}, 12, 24);
const load = src => new Promise(done => { const im = new Image(); im.onload = () => done(im); im.onerror = () => done(null); im.src = src; });
(async () => {
  const img = {};
  for (const [k, s] of Object.entries(sources)) img[k] = await load(s);
  let top = 44;
  rows.forEach((row, r) => {
    const base = top + rowH[r] - 30; let x = 20;
    for (const it of row) {
      const h = (it.h || 1) * person;
      for (const one of it.found) {
        if (!one.f) { ctx.fillStyle = '#a00'; ctx.fillText('missing ' + one.n, x, base); x += 120; continue; }
        const f = one.f, scale = h / (f.logicalHeight || f.h), w = f.w * scale, hh = f.h * scale, ax = x + w * f.anchorX + (it.pad || 0) * person;
        ctx.save(); ctx.translate(ax, base); if (it.lean) ctx.transform(1, 0, it.lean, 1, 0, 0); if (it.flip) ctx.scale(-1, 1);
        if (it.alpha != null) ctx.globalAlpha = it.alpha;
        ctx.drawImage(img[one.lib + ':' + f.sheet], f.x, f.y, f.w, f.h, -w * f.anchorX, -hh * f.anchorY, w, hh); ctx.restore();
        x = Math.max(x + w + 10, ax + 10) + (it.pad || 0) * person;
      }
      if (it.label) { ctx.fillStyle = '#23180f'; ctx.font = '11px Georgia'; ctx.fillText(it.label, x - 10 - Math.min(160, it.label.length * 5.6), base + 18); }
      x += (it.dx || 0.3) * person;
    }
    top += rowH[r];
  });
  document.title = 'done';
})();
</script></body>`;
  await page.setViewportSize({ width, height: Math.ceil(height) });
  await page.setContent(html);
  await page.waitForFunction(() => document.title === 'done');
  const path = OUT + file;
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height: Math.ceil(height) } });
  return path;
}

const SCENES = {};
/** Register a scene builder (called by the area F proof below and by nothing else). */
export const scene = (name, make) => { SCENES[name] = make; };

// The gale: each tree upright (hers), sheared as the page stood it in (hers, lean 0.3), and bent (Claude's), at two sizes.
scene('gale', async () => {
  const { GALE } = await import('../areas/land-gale.mjs');
  const drawn = { pole: 1.07, log: 1.37, large: 1.66 };
  const out = [];
  for (const person of [40, 77]) {
    const rows = [];
    let row = [];
    for (const [upright, gale] of Object.entries(GALE)) {
      const size = upright.match(/-(pole|log|large)$/)?.[1], h = size ? drawn[size] : upright === 'cottonwood' ? 2.18 : 1;
      row.push({ name: upright, h }, { name: upright, h, lean: 0.3 }, { name: gale, h, dx: 0.9, label: person > 50 ? gale : '' });
      if (row.length >= (person > 50 ? 12 : 21)) { rows.push(row); row = []; }
    }
    if (row.length) rows.push(row);
    out.push({ title: `Gale poses (Claude, temporary) - each tree: Astra's upright, the old stand-in (her upright sheared 0.3), Claude's bend of her painting. A person ${person} px.`, person, rows, width: person > 50 ? 2000 : 1900, file: `land-gale-${person}.png` });
  }
  return out;
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  for (const file of ['./proof-scenes.mjs']) { try { await import(file); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; } }
  const wanted = process.argv.slice(2);
  await withBrowser(async (first, browser) => {
    for (const [name, make] of Object.entries(SCENES)) {
      if (wanted.length && !wanted.includes(name)) continue;
      for (const s of [].concat(await make())) { const page = await browser.newPage({ deviceScaleFactor: 1 }); console.log(await drawScene(page, s)); await page.close(); }
    }
  });
}
