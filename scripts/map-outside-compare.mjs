// The box drawn the same with the country outside it as without: docs/MAP_ACCURACY.md §8.4.
//
//   node scripts/map-outside-compare.mjs --root <an export of the build before>
//
// The same class (one seed, one deal) on the Host's page of each build, in headless Chrome on this computer: the camera goes
// to the same views inside the box, well away from its edge, and the map's own canvas is read back pixel by pixel from each
// and compared. Inside the box nothing should differ; the views on the box's edge (its south-west corner) differ by design,
// and are written beside each other under docs/evidence/map-outside/ for a person to look at.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
if (rootArg < 0) { console.error('usage: node scripts/map-outside-compare.mjs --root <before-dir>'); process.exit(2); }
const roots = { before: pathToFileURL(`${resolve(process.argv[rootArg + 1])}/`).href, after: new URL('../', import.meta.url).href };
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { milesFrom, realTerrain } = await import(new URL('sim/terrain-data.mjs', roots.after).href);
const terrain = realTerrain(), at = (lon, lat) => milesFrom(terrain, lon, lat);
// [name, centre, scale, inside the box well away from its edge]
const VIEWS = [
  ['interior-colonies', at(-96.6, 30.2), 9, true],
  ['interior-county', at(-97.9, 30.7), 45, true],
  ['interior-close', at(-96.0, 29.6), 200, true],
  ['edge-southwest', at(-98.8, 28.3), 20, false],
];
const out = 'docs/evidence/map-outside';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const pictures = {};
try {
  for (const [label, root] of Object.entries(roots)) {
    const { createClassroom } = await import(new URL('server/app.mjs', root).href);
    const { createWorld } = await import(new URL('sim/world.mjs', root).href);
    const app = createClassroom({ seed: 'outside-compare', playerCount: 8, worldFactory: (seed, n) => createWorld('outside-compare', n, { map: 'colonies' }) });
    const port = await app.listen(0, '127.0.0.1');
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
      await page.goto(`http://127.0.0.1:${port}/host#${app.state.hostKey}`);
      await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__landDrawn, null, { timeout: 120000 });
      for (const id of ['#host-class', '#rumor-mill']) if (await page.locator(`${id}[open] > summary`).count()) await page.locator(`${id} > summary`).click();
      const box = await page.locator('#world-map').boundingBox(), centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const camera = () => page.evaluate(() => window.__camera);
      for (const [name, target, scale] of VIEWS) {
        for (let i = 0; i < 40; i++) { await page.mouse.move(centre.x, centre.y); await page.mouse.wheel(0, 240); await page.waitForTimeout(10); }
        const centreOn = async () => {
          for (let guard = 0; guard < 30; guard++) {
            const now = await camera(), dx = (target.x - now.cx) * now.scale, dy = (target.y - now.cy) * now.scale;
            if (Math.hypot(dx, dy) < 2) return;
            const step = Math.min(1, 250 / Math.hypot(dx, dy));
            await page.mouse.move(centre.x, centre.y); await page.mouse.down();
            await page.mouse.move(centre.x - dx * step, centre.y - dy * step, { steps: 6 }); await page.mouse.up();
            await page.waitForTimeout(40);
          }
        };
        await centreOn();
        for (let guard = 0; guard < 80; guard++) {
          const now = await camera();
          if (Math.abs(Math.log(now.scale / scale)) < Math.log(1.15) / 2) break;
          await page.mouse.move(centre.x, centre.y); await page.mouse.wheel(0, now.scale > scale ? 120 : -120); await page.waitForTimeout(15);
          if (guard % 4 === 3) await centreOn();
        }
        await centreOn();
        await page.waitForTimeout(2500);
        const shot = `${out}/compare-${name}-${label}.png`;
        await page.screenshot({ path: shot });
        pictures[`${name}:${label}`] = { camera: await camera(), data: await page.evaluate(() => document.querySelector('#world-map').toDataURL('image/png')) };
      }
      await page.close();
    } finally { await app.close(); }
  }
  // Compare in a page of its own: each view's two canvases, pixel by pixel.
  const page = await browser.newPage();
  const results = [];
  for (const [name, , , interior] of VIEWS) {
    const a = pictures[`${name}:before`], b = pictures[`${name}:after`];
    const diff = await page.evaluate(async ([one, two]) => {
      const load = src => new Promise(done => { const image = new Image(); image.onload = () => done(image); image.src = src; });
      const [p, q] = await Promise.all([load(one), load(two)]);
      const read = image => { const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; const x = c.getContext('2d'); x.drawImage(image, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
      const d1 = read(p), d2 = read(q);
      let differ = 0, most = 0;
      for (let i = 0; i < d1.length; i += 4) { const d = Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]); if (d > 24) differ++; most = Math.max(most, d); }
      return { pixels: d1.length / 4, differ, most };
    }, [a.data, b.data]);
    const sameCamera = Math.abs(a.camera.cx - b.camera.cx) < 0.01 && Math.abs(a.camera.cy - b.camera.cy) < 0.01 && Math.abs(a.camera.scale - b.camera.scale) / a.camera.scale < 0.001;
    results.push({ view: name, insideTheBox: interior, scale: +b.camera.scale.toFixed(2), sameCamera, differingShare: +(diff.differ / diff.pixels).toFixed(5), largestDifference: diff.most });
    console.log(`${name.padEnd(18)} ${interior ? 'inside ' : 'on edge'} scale ${b.camera.scale.toFixed(1).padStart(6)} same camera ${sameCamera} | ${(100 * diff.differ / diff.pixels).toFixed(3)}% of pixels differ (largest ${diff.most})`);
  }
  writeFileSync(`${out}/compare.json`, `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, note: 'a pixel differs when its red, green and blue differ by more than 24 in all; the map canvas only', results }, null, 2)}\n`);
} finally { await browser.close(); }
