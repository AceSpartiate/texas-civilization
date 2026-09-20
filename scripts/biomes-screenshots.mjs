// The country of 1836 on the page, before and after the biomes: docs/BIOMES.md, docs/MAP_ACCURACY.md §9.
//
//   node scripts/biomes-screenshots.mjs --label after [--root <an export of another build>]
//
// A real-land class on the Host's page in headless Chrome (same computer only; not a LAN or district test). The camera goes
// to the places the biomes change most - Béxar and the Alamo close in, Béxar's fields, Gonzales, the coastal prairie at
// Harrisburg, the Piney Woods and the Big Thicket, the Lost Pines, the Hill Country, South Texas past the Nueces, and the
// whole map - and writes a screenshot of each to docs/evidence/biomes/<label>-<place>.png for a person to look at. With
// `--root` the same views are taken of another copy of the game (an export of the commit before), so the two can be laid
// side by side. The page must throw nothing.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'after');
const root = arg('root') ? pathToFileURL(`${resolve(arg('root'))}/`).href : new URL('../', import.meta.url).href;
const { createClassroom } = await import(new URL('server/app.mjs', root).href);
const { createWorld } = await import(new URL('sim/world.mjs', root).href);
const { milesFrom, realTerrain } = await import(new URL('sim/terrain-data.mjs', root).href);
const { coloniesMap } = await import(new URL('sim/colonies-map.mjs', root).href);
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const terrain = realTerrain(), at = (lon, lat) => milesFrom(terrain, lon, lat);
const places = coloniesMap().places;
const place = id => ({ x: places[id].x, y: places[id].y });
// The Alamo stands about half a mile east of Béxar's plaza, across the river (docs/ALAMO_LAYOUT.md).
const alamo = { x: place('bexar').x + 0.45, y: place('bexar').y - 0.05 };
const VIEWS = [
  // name, centre (null: all the way out), scale in pixels a mile
  ['whole', null, null],
  ['bexar-alamo-close', alamo, 260],
  ['bexar-fields', { x: place('bexar').x + 0.3, y: place('bexar').y + 2.5 }, 60],
  ['gonzales', place('gonzales'), 60],
  ['coastal-prairie-harrisburg', at(-95.2, 29.75), 30],
  // Added 2026-09-19 for the creek galleries: Harrisburg on Buffalo Bayou, where the timber a running bayou carries shows.
  ['buffalo-bayou-harrisburg', place('harrisburg'), 150],
  ['piney-woods-nacogdoches', at(-94.65, 31.6), 30],
  ['big-thicket', at(-94.45, 30.45), 12],
  ['lost-pines-bastrop', at(-97.32, 30.11), 30],
  ['hill-country', at(-98.4, 30.15), 12],
  ['south-texas', at(-98.7, 27.9), 8],
  ['pine-close', at(-94.8, 31.35), 1500],
];

const out = 'docs/evidence/biomes';
mkdirSync(out, { recursive: true });
const app = createClassroom({ seed: 'biomes-look', playerCount: 8, worldFactory: (seed, n) => createWorld('biomes-look', n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shots = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__landDrawn, null, { timeout: 120000 });
  for (const id of ['#host-class', '#rumor-mill']) if (await page.locator(`${id}[open] > summary`).count()) await page.locator(`${id} > summary`).click();
  const box = await page.locator('#world-map').boundingBox(), centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const camera = () => page.evaluate(() => {
    const canvas = document.querySelector('#world-map');
    return { ...window.__camera, ratio: canvas.width / canvas.getBoundingClientRect().width };
  });
  const outAll = async () => { for (let i = 0; i < 40; i++) { await page.mouse.move(centre.x, centre.y); await page.mouse.wheel(0, 240); await page.waitForTimeout(10); } };
  async function centreOn(target) {
    for (let guard = 0; guard < 30; guard++) {
      const now = await camera();
      const dx = (target.x - now.cx) * now.scale / now.ratio, dy = (target.y - now.cy) * now.scale / now.ratio;
      if (Math.hypot(dx, dy) < 3) return;
      const step = Math.min(1, 250 / Math.hypot(dx, dy));
      await page.mouse.move(centre.x, centre.y); await page.mouse.down();
      await page.mouse.move(centre.x - dx * step, centre.y - dy * step, { steps: 8 }); await page.mouse.up();
      await page.waitForTimeout(40);
      const moved = await camera();
      if (Math.abs(moved.cx - now.cx) < 1e-6 && Math.abs(moved.cy - now.cy) < 1e-6) return;
    }
  }
  async function goTo(target, scale) {
    await outAll();
    await centreOn(target);
    for (let guard = 0; guard < 160; guard++) {
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
  for (const [name, target, scale] of VIEWS) {
    if (target) await goTo(target, scale); else await outAll();
    // The land's pictures are smoothed off the page's thread, and the woods' tiles fetched: let both land.
    await page.waitForTimeout(3500);
    const now = await camera();
    const path = `${out}/${LABEL}-${name}.png`;
    await page.screenshot({ path });
    shots.push({ name, scale: +now.scale.toFixed(2), centre: { x: +now.cx.toFixed(2), y: +now.cy.toFixed(2) }, path });
    console.log(`${name} at scale ${now.scale.toFixed(1)}`);
  }
  if (errors.length) throw new Error(`The page threw: ${errors.join('; ')}`);
  writeFileSync(`${out}/${LABEL}.json`, `${JSON.stringify({ label: LABEL, date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, browser: await browser.version(), viewport: '1280x800', shots, errors }, null, 2)}\n`);
  console.log(`PASS: ${shots.length} screenshots in ${out}`);
} finally { await browser.close(); await app.close(); }
