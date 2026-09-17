// The map's rivers and woods where they are on the land: docs/MAP_ACCURACY.md.
//
//   node scripts/map-accuracy-browser-proof.mjs [label]
//
// A real-land class on the Host's page in headless Chrome (same computer only). The camera goes to Béxar, Liberty and
// Gonzales and backs out through three zooms at each - a town's streets, a county, the colonies - and a screenshot of
// each is written to docs/evidence/map-accuracy/<label>-<place>-<zoom>.png, so the map before and after a change can be
// looked at side by side. Then, unless the label is `before`, the page's own map is checked: the province it draws
// zoomed out is the real one, its rivers pass the towns on the documented sides, and every band of detail lies on the
// band finer than it.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';

const label = process.argv[2] || 'after';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 8, worldFactory: (seed, n) => createWorld(seed, n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const out = 'docs/evidence/map-accuracy';
mkdirSync(out, { recursive: true });
const shots = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__snapshot.world.map?.sites?.bexar);
  const box = await page.locator('#world-map').boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  // Pixels a mile: a town's streets, a county about twenty-five miles across, and most of the colonies.
  const ZOOMS = [['town', 400], ['county', 45], ['colonies', 5]];
  for (const place of ['bexar', 'liberty', 'gonzales']) {
    await page.selectOption('#host-goto', place);
    await page.waitForTimeout(150);
    for (const [zoom, target] of ZOOMS) {
      // The wheel steps the scale by 1.15 about the cursor; the cursor stays at the middle, over the town.
      for (let guard = 0; guard < 80; guard++) {
        const scale = await page.evaluate(() => window.__camera.scale);
        if (Math.abs(Math.log(scale / target)) < Math.log(1.15) / 2) break;
        const before = scale;
        await page.mouse.move(centre.x, centre.y);
        await page.mouse.wheel(0, scale > target ? 120 : -120);
        await page.waitForTimeout(20);
        if (await page.evaluate(() => window.__camera.scale) === before) break;
      }
      await page.waitForTimeout(900); // the woods tiles for the view arrive
      const path = `${out}/${label}-${place}-${zoom}.png`;
      await page.screenshot({ path });
      shots.push({ place, zoom, scale: +(await page.evaluate(() => window.__camera.scale)).toFixed(2), path });
    }
  }
  if (label !== 'before') {
    const map = await page.evaluate(async () => (await (await fetch('/api/map')).json()).map);
    const province = map.province;
    assert.ok(province.levels, 'the page is sent the real province with its bands of detail');
    const trinity = province.rivers.filter(river => river.name === 'Trinity River');
    const liberty = map.sites.liberty;
    const westOf = (points, site) => points.some((p, i) => i && (p.y - site.y) * (points[i - 1].y - site.y) <= 0 && p.x + (points[i - 1].x - p.x) * (site.y - p.y) / ((points[i - 1].y - p.y) || 1e-9) < site.x);
    assert.ok(trinity.some(river => westOf(river.points, liberty)), 'the Trinity drawn zoomed out passes west of Liberty');
    const served = await page.evaluate(async hrefs => Promise.all(hrefs.map(async href => {
      const response = await fetch(href), body = await response.json();
      return { status: response.status, kind: body.kind, bands: body.bands?.length };
    })), [province.levels.href, province.levels.land]);
    assert.deepEqual(served.map(file => [file.status, file.kind]), [[200, 'texas-colonies-province'], [200, 'colonies-land']], 'the province and the land are served whole');
    assert.ok(served.every(file => file.bands >= 3), 'each with its bands');
    assert.deepEqual(errors, []);
  }
  writeFileSync(`${out}/${label}.json`, JSON.stringify({ result: 'PASS', label, date: new Date().toISOString(), sameComputerOnly: true, shots, errors }, null, 2));
  console.log(`PASS (${label}): ${shots.length} screenshots in ${out}`);
} finally { await browser.close(); await app.close(); }
