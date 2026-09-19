// The country outside the colonies' box, on the page: docs/MAP_ACCURACY.md §8.
//
//   node scripts/map-outside-browser-proof.mjs
//
// A real-land class on the Host's page in headless Chrome (same computer only; not a LAN or district test). The page is
// checked for the whole map's bounds and its zoom-out limit, the outside layer fetched and drawn, and then the camera goes
// to the places the owner named and a screenshot of each is written to docs/evidence/map-outside/: the colonies zoomed
// right out and at the colonies' zoom, the Sabine, the mouth of the Nueces, the Rio Grande at Laredo and at Matamoros, and
// the seam at the box's south-west corner at a county and a closer zoom. Each screenshot is looked at by a person; what the
// script checks is that each place is drawn from the outside layer, that the land there is land and the sea sea, and that
// the page threw nothing.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { mapBounds } from '../sim/province.mjs';

const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const terrain = realTerrain(), at = (lon, lat) => milesFrom(terrain, lon, lat);
const app = createClassroom({ playerCount: 8, worldFactory: (seed, n) => createWorld(seed, n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const out = 'docs/evidence/map-outside';
mkdirSync(out, { recursive: true });
const shots = [], checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__outsideLoaded, null, { timeout: 60000 });
  // The Host's two panels closed, as a Host may close them, so the map's west edge is not under them in the screenshots.
  for (const id of ['#host-class', '#rumor-mill']) if (await page.locator(`${id}[open] > summary`).count()) await page.locator(`${id} > summary`).click();
  const box = await page.locator('#world-map').boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const camera = () => page.evaluate(() => {
    const canvas = document.querySelector('#world-map');
    return { ...window.__camera, ratio: canvas.width / canvas.getBoundingClientRect().width, width: canvas.width, height: canvas.height };
  });
  const settle = async ms => { await page.waitForTimeout(ms); };

  // ---- The map's reach -------------------------------------------------------------------------------------------
  const map = await page.evaluate(async () => (await (await fetch('/api/map')).json()).map);
  assert.deepEqual(map.bounds, mapBounds(), 'the page is sent the whole map\'s bounds');
  assert.ok(map.province.levels.outside && map.province.levels.outsideLand, 'and where the country outside the box is');
  const loaded = await page.evaluate(() => window.__outsideLoaded);
  for (const name of ['Rio Grande', 'Nueces River', 'Sabine River']) assert.ok(loaded.rivers.includes(name), `the page holds the ${name}`);
  checks.push({ check: 'bounds and outside layer', bounds: map.bounds, rivers: [...new Set(loaded.rivers)], pieces: loaded.pieces });
  // All the way out: the wheel stops at the scale where the whole map's wider side fills the view.
  for (let i = 0; i < 40; i++) { await page.mouse.move(centre.x, centre.y); await page.mouse.wheel(0, 240); await page.waitForTimeout(15); }
  await settle(600);
  const out1 = await camera();
  const b = map.bounds, cover = Math.max(out1.width / (b.maxX - b.minX), out1.height / (b.maxY - b.minY));
  assert.ok(Math.abs(out1.scale - cover) / cover < 0.01, `zoomed right out the scale is ${out1.scale}, the whole map's ${cover.toFixed(3)}`);
  checks.push({ check: 'zoom-out limit', scale: +out1.scale.toFixed(3), wholeMap: +cover.toFixed(3), boxAlone: +Math.max(out1.width / 301.29, out1.height / 275.5).toFixed(3) });

  /**
   * Bring a point of the map to the middle of the view at a scale, as a student would: drag it to the middle, and wheel in
   * there. Every press and every wheel is at the middle of the map, clear of the panels over its edges.
   */
  async function centreOn(target) {
    for (let guard = 0; guard < 30; guard++) {
      const now = await camera();
      const dx = (target.x - now.cx) * now.scale / now.ratio, dy = (target.y - now.cy) * now.scale / now.ratio;
      if (Math.hypot(dx, dy) < 3) return;
      const step = Math.min(1, 250 / Math.hypot(dx, dy));
      await page.mouse.move(centre.x, centre.y);
      await page.mouse.down();
      await page.mouse.move(centre.x - dx * step, centre.y - dy * step, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(40);
      const moved = await camera();
      if (Math.abs(moved.cx - now.cx) < 1e-6 && Math.abs(moved.cy - now.cy) < 1e-6) return; // held by the map's edge
    }
  }
  async function goTo(target, scale) {
    for (let i = 0; i < 40 && (await camera()).scale > cover * 1.01; i++) { await page.mouse.move(centre.x, centre.y); await page.mouse.wheel(0, 240); await page.waitForTimeout(15); }
    await centreOn(target);
    for (let guard = 0; guard < 120; guard++) {
      const now = await camera();
      if (Math.abs(Math.log(now.scale / scale)) < Math.log(1.15) / 2) break;
      await page.mouse.move(centre.x, centre.y);
      await page.mouse.wheel(0, now.scale > scale ? 120 : -120);
      await page.waitForTimeout(15);
      if ((await camera()).scale === now.scale) break;
      if (guard % 4 === 3) await centreOn(target);
    }
    await centreOn(target);
  }
  /** The colour drawn at a point of the map, from the page's own canvas. */
  const colourAt = point => page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('#world-map'), c = window.__camera;
    const px = Math.round(canvas.width / 2 + (x - c.cx) * c.scale), py = Math.round(canvas.height / 2 + (y - c.cy) * c.scale);
    if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return null;
    return [...canvas.getContext('2d').getImageData(px, py, 1, 1).data.slice(0, 3)];
  }, point);
  const SEA = [143, 176, 189];
  const isSea = rgb => rgb && Math.abs(rgb[0] - SEA[0]) + Math.abs(rgb[1] - SEA[1]) + Math.abs(rgb[2] - SEA[2]) < 30;

  const PLACES = [
    // name, the middle of the view, scale, points that must be land and points that must be sea
    ['whole', null, null, [at(-99.8, 29.5), at(-93.7, 31.0), at(-100.2, 30.5)], [at(-93.7, 29.4)]],
    ['whole-south', { x: (mapBounds().minX + mapBounds().maxX) / 2, y: mapBounds().maxY }, 3.05, [at(-99.9, 26.5), at(-98.0, 26.8)], [at(-96.5, 26.5)]],
    ['colonies-southwest', at(-98.6, 28.2), 5, [at(-99.5, 27.5), at(-98.5, 28.6)], [at(-96.8, 27.0)]],
    ['sabine', at(-93.85, 30.3), 45, [at(-93.9, 30.35), at(-94.05, 30.25)], []],
    ['nueces-mouth', at(-97.45, 27.82), 45, [at(-97.6, 27.85)], [at(-97.25, 27.75)]],
    ['rio-grande-laredo', at(-99.507, 27.506), 45, [at(-99.45, 27.55), at(-99.56, 27.46)], []],
    ['rio-grande-matamoros', at(-97.50, 25.88), 45, [at(-97.45, 25.93), at(-97.55, 25.84)], []],
    ['seam-southwest-county', at(-99.0, 28.0), 45, [at(-99.1, 28.1), at(-98.9, 27.9), at(-98.9, 28.1), at(-99.1, 27.9)], []],
    ['seam-southwest-close', at(-99.0, 28.0), 200, [at(-99.01, 28.01), at(-98.99, 27.99)], []],
    ['seam-west-colorado', at(-99.0, 31.3), 20, [at(-99.1, 31.3), at(-98.9, 31.3)], []],
  ];
  for (const [name, target, scale, landAt, seaAt] of PLACES) {
    if (target) await goTo(target, scale);
    await settle(1500); // the pictures of the land in view are smoothed off the page's thread and arrive
    const now = await camera();
    const drawn = await page.evaluate(() => window.__outsidePiecesDrawn);
    const land = [], sea = [];
    for (const p of landAt) land.push(await colourAt(p));
    for (const p of seaAt) sea.push(await colourAt(p));
    const path = `${out}/${name}.png`;
    await page.screenshot({ path });
    land.forEach((rgb, i) => assert.ok(rgb && !isSea(rgb), `${name}: point ${i} is drawn as land (${rgb})`));
    sea.forEach((rgb, i) => assert.ok(isSea(rgb), `${name}: point ${i} is drawn as sea (${rgb})`));
    assert.ok(drawn > 0, `${name}: the outside layer's land is drawn`);
    shots.push({ name, scale: +now.scale.toFixed(2), centre: { x: +now.cx.toFixed(2), y: +now.cy.toFixed(2) }, outsidePiecesDrawn: drawn, path });
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/proof.json`, `${JSON.stringify({ result: 'PASS', date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, browser: await browser.version(), viewport: '1280x800', checks, shots, errors }, null, 2)}\n`);
  console.log(`PASS: ${shots.length} screenshots in ${out}`);
  for (const check of checks) console.log(JSON.stringify(check));
} finally { await browser.close(); await app.close(); }
