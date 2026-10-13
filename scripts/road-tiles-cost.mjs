// What laying the roads in their painted tiles costs a ground redraw (2026-10-13; public/ground-texture.js), against the flat
// strokes they replace: the same road drawn both ways on a 1366x768 canvas in headless Chrome with the CPU slowed six-fold, as
// docs/PERFORMANCE_RENDER.md measures. A road is only drawn when the kept ground is (a few times a minute in play), so this is
// the cost of one such redraw's roads, not of a frame.
//
// Run: node scripts/road-tiles-cost.mjs   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the proofs)
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const app = createClassroom({ seed: 'road-tiles-cost', playerCount: 5, tickMs: 10000 });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`http://127.0.0.1:${port}/landscape-art.js`);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const result = await page.evaluate(async () => {
    const { loadArt, spriteImage } = await import('/art.js');
    await loadArt({ sheets: ['ground-roads'] });
    const { drawRoad, drawStreets } = await import('/landscape-art.js');
    const { useTextureSource } = await import('/ground-texture.js');
    const canvas = document.createElement('canvas'); canvas.width = 1366; canvas.height = 768;
    const ctx = canvas.getContext('2d');
    // A road winding right across the screen and back, 300 points, and a grid of twelve streets 60 px wide covering most of the
    // screen (a worst case).
    const road = Array.from({ length: 300 }, (_, i) => ({ x: (i % 150) * 9.4 + Math.sin(i / 7) * 20, y: 120 + Math.floor(i / 150) * 400 + Math.sin(i / 11) * 60 }));
    const streets = Array.from({ length: 12 }, (_, i) => ({ points: i < 6 ? [{ x: 80, y: 80 + i * 110 }, { x: 1300, y: 80 + i * 110 }] : [{ x: 120 + (i - 6) * 220, y: 40 }, { x: 120 + (i - 6) * 220, y: 740 }], width: 60 }));
    // A town as the close view draws one: the same grid at the width San Felipe's streets are drawn (about 24 px).
    const town = streets.map(street => ({ ...street, width: 24 }));
    const time = (draw, runs = 20) => { draw(); const t = performance.now(); for (let i = 0; i < runs; i++) draw(); ctx.getImageData(0, 0, 1, 1); return (performance.now() - t) / runs; };
    const out = {};
    for (const [label, source] of [['tiles', spriteImage], ['flat', () => null]]) {
      useTextureSource(source);
      out[label] = {
        road20: +time(() => drawRoad(ctx, road, 20, { tile: 52, anchor: { x: 0, y: 0 } })).toFixed(2),
        road46: +time(() => drawRoad(ctx, road, 46, { tile: 120, anchor: { x: 0, y: 0 } })).toFixed(2),
        streets: +time(() => drawStreets(ctx, streets, { tile: 200, anchor: { x: 3.4, y: 7.7 } })).toFixed(2),
        townStreets: +time(() => drawStreets(ctx, town, { tile: 200, anchor: { x: 3.4, y: 7.7 } })).toFixed(2),
        painted: drawRoad(ctx, road, 20),
      };
    }
    useTextureSource(spriteImage);
    return out;
  });
  const record = { record: 'road tiles against flat strokes, ms per draw, CPU throttled 6x', date: new Date().toISOString().slice(0, 10), ...result };
  writeFileSync('docs/evidence/road-tiles-cost.json', `${JSON.stringify(record, null, 2)}\n`);
  console.log(JSON.stringify(record));
} finally { await browser.close(); await app.close?.(); process.exit(0); }
