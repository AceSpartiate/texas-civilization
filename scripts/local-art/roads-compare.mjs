// The road tiles at the sizes students see them, before and after a repaint (batch 0, 2026-10-26: klein 9B -> klein 4B).
// Draws the same winding road, a town's streets and a family's path with public/landscape-art.js and public/ground-texture.js
// on the map's own ground (docs/evidence/roads-before-land.png, a corner with no road tile on it), once with each sheet, in
// headless Chrome, and writes one labelled sheet.
//
//   node scripts/local-art/roads-compare.mjs <before sheet.png> <after sheet.png> <out.png>
//   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the proofs)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../../server/app.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const [before, after, out] = process.argv.slice(2);
const data = path => `data:image/png;base64,${readFileSync(path).toString('base64')}`;
const ground = data(new URL('../../docs/evidence/roads-before-land.png', import.meta.url));
const app = createClassroom({ seed: 'roads-compare', playerCount: 5, tickMs: 10000 });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/landscape-art.js`);
  const png = await page.evaluate(async ({ sheets, ground }) => {
    const { drawRoad, drawStreets } = await import('/landscape-art.js');
    const { useTextureSource, paveWay, TEXTURES } = await import('/ground-texture.js');
    const atlas = await (await fetch('/assets/frontier-v1/atlas.json')).json();
    const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const field = await load(ground);
    const W = 640, H = 400, gap = 24, head = 34;
    const canvas = document.createElement('canvas'); canvas.width = 2 * W + 3 * gap; canvas.height = 3 * (H + head) + 4 * gap;
    const c = canvas.getContext('2d');
    c.fillStyle = '#f5f1e8'; c.fillRect(0, 0, canvas.width, canvas.height);
    const scenes = [
      ['the map: a road 20 px', ctx => drawRoad(ctx, Array.from({ length: 60 }, (_, i) => ({ x: i * 12, y: 200 + Math.sin(i / 6) * 90 })), 20, { tile: 52, anchor: { x: 0, y: 0 } })],
      ['close: streets 24 px, a road 46 px', ctx => { drawStreets(ctx, [0, 1, 2].map(i => ({ points: [{ x: 40, y: 70 + i * 110 }, { x: 600, y: 70 + i * 110 }], width: 24 })).concat([{ points: [{ x: 320, y: 20 }, { x: 320, y: 380 }], width: 24 }]), { tile: 40, anchor: { x: 0, y: 0 } }); drawRoad(ctx, [{ x: 0, y: 360 }, { x: 640, y: 300 }], 46, { tile: 120, anchor: { x: 0, y: 0 } }); }],
      ['the land: a path 14 px, a road 46 px', ctx => { paveWay(ctx, 'path', Array.from({ length: 40 }, (_, i) => ({ x: 60 + i * 14, y: 120 + Math.sin(i / 5) * 50 })), 14, { tile: 36, anchor: { x: 0, y: 0 } }); drawRoad(ctx, [{ x: 0, y: 330 }, { x: 320, y: 280 }, { x: 640, y: 340 }], 46, { tile: 120, anchor: { x: 0, y: 0 } }); }],
    ];
    for (const [col, src] of sheets.entries()) {
      const image = await load(src);
      useTextureSource(name => (atlas.frames[name] ? { image, frame: atlas.frames[name] } : null));
      for (const [row, [label, draw]] of scenes.entries()) {
        const x = gap + col * (W + gap), y = gap + row * (H + head + gap);
        const tile = document.createElement('canvas'); tile.width = W; tile.height = H;
        const t = tile.getContext('2d');
        t.drawImage(field, 1010, 130, 356, 350, 0, 0, W, H);
        draw(t);
        c.drawImage(tile, x, y + head);
        c.fillStyle = '#222'; c.font = 'bold 17px Arial';
        c.fillText(`${col ? 'AFTER  klein 4B (2026-10-26)' : 'BEFORE  klein 9B (2026-10-13)'}  -  ${label}`, x, y + 22);
      }
    }
    void TEXTURES;
    return canvas.toDataURL('image/png');
  }, { sheets: [data(before), data(after)], ground });
  writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
  console.log(out);
} finally {
  await browser.close();
  await app.close?.();
  process.exit(0);
}
