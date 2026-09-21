// The Alamo beside the towns, for judging whether it is drawn in their style (docs/MAP_ACCURACY.md §7, 2026-09-18).
//
//   node scripts/alamo-style-shots.mjs [label]
//
// A real-land class on the Host's page in headless Chrome (same computer only). The camera goes to Gonzales and to Béxar,
// at a town's streets (400 px a mile), at a street's length (1,500) and at the closest the map allows. At Béxar the view is
// dragged so the Alamo compound is in the middle; at Gonzales, so the general store and the houses round it are.
// Writes docs/evidence/alamo-<label>-<place>-<zoom>.png and docs/evidence/alamo-<label>.json.
//
// Since Astra's five south-facing elevation strips landed (2026-09-21) this is also the proof that they are laid on the
// compound and not merely chosen: `window.__alamoDrawn.faces` is what `drawSprite` really painted, and at the closest zoom
// all five must be in it. A check made at a zoom too far out to texture a face would pass against any mistake at all, so
// the assertion is made only where `textured` is true and fails rather than skip if it is not.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ALAMO_FACES } from '../public/alamo-faces.js';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';

const label = process.argv[2] || 'after';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 8, worldFactory: (seed, n) => createWorld(seed, n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const out = 'docs/evidence';
mkdirSync(out, { recursive: true });
const shots = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__snapshot.world.map?.sites?.bexar);
  const box = await page.locator('#world-map').boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const zoomTo = async target => {
    for (let guard = 0; guard < 80; guard++) {
      const scale = await page.evaluate(() => window.__camera.scale);
      if (target !== Infinity && Math.abs(Math.log(scale / target)) < Math.log(1.15) / 2) break;
      await page.mouse.move(centre.x, centre.y);
      await page.mouse.wheel(0, scale > target ? 120 : -120);
      await page.waitForTimeout(20);
      if (await page.evaluate(() => window.__camera.scale) === scale) break;
    }
  };
  // Drag the map so a point (miles from the page's origin) comes to the middle of the canvas.
  const bring = async point => {
    const at = await page.evaluate(({ x, y }) => { const c = window.__camera, canvas = document.querySelector('#world-map'), r = canvas.getBoundingClientRect();
      return { x: r.left + r.width / 2 + (x - c.cx) * c.scale * r.width / canvas.width, y: r.top + r.height / 2 + (y - c.cy) * c.scale * r.height / canvas.height }; }, point);
    await page.mouse.move(at.x, at.y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(at.x + (centre.x - at.x) * i / 12, at.y + (centre.y - at.y) * i / 12);
    await page.mouse.up(); await page.waitForTimeout(300);
  };
  const alamo = await page.evaluate(async () => {
    const { alamoOnMap } = await import('/bexar-layout.js'), site = window.__snapshot.world.map.sites.bexar, o = alamoOnMap({ x: 200, y: 280 });
    return { x: site.x + o.x, y: site.y + o.y };
  });
  // The general store of Gonzales (public/gonzales-art.js), with houses about it.
  const store = await page.evaluate(() => { const site = window.__snapshot.world.map.sites.gonzales; return { x: site.x - .12, y: site.y - .12 }; });
  const middle = { bexar: alamo, gonzales: store };
  for (const [place, zoom, target] of [['gonzales', 'town', 400], ['gonzales', 'street', 1500], ['gonzales', 'closest', Infinity], ['bexar', 'town', 400], ['bexar', 'street', 1500], ['bexar', 'closest', Infinity]]) {
    await page.selectOption('#host-goto', place);
    await page.waitForTimeout(200);
    await zoomTo(400); await bring(middle[place]);
    await zoomTo(target);
    await bring(middle[place]);
    await page.waitForTimeout(900);
    const path = `${out}/alamo-${label}-${place}-${zoom}.png`;
    await page.locator('#world-map').screenshot({ path });
    shots.push({ place, zoom, scale: +(await page.evaluate(() => window.__camera.scale)).toFixed(2), path, ...(place === 'bexar' && { alamoDrawn: await page.evaluate(() => window.__alamoDrawn || null) }) });
  }
  // Astra's elevations, on the compound, at the zoom that shows them. `textured` is asserted first: a face is drawn flat
  // below 0.12 pixels a foot, and a check run there could not tell a wrong face from a missing one.
  const closest = shots.find(shot => shot.place === 'bexar' && shot.zoom === 'closest');
  assert.ok(closest?.alamoDrawn?.textured, `the compound was not drawn close enough to show a face (${JSON.stringify(closest?.alamoDrawn)})`);
  const laid = closest.alamoDrawn.faces || [];
  const wanted = [...new Set(Object.values(ALAMO_FACES))].sort();
  assert.deepEqual([...laid].sort(), wanted, `the compound laid ${laid.join(', ') || 'nothing'}`);
  writeFileSync(`${out}/alamo-${label}.json`, JSON.stringify({ result: errors.length ? 'FAIL' : 'PASS', label, date: new Date().toISOString(), sameComputerOnly: true, facesLaid: laid, shots, errors }, null, 2) + '\n');
  console.log(`${errors.length ? 'FAIL' : 'PASS'} (${label}): ${shots.length} screenshots`, errors);
} finally { await browser.close(); await app.close(); }
