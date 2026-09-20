// The crossings on the page: docs/MAP_ACCURACY.md §10.
//
//   node scripts/crossings-browser-proof.mjs
//
// A real-land class on the Host's page in headless Chrome (same computer only; not a LAN or district test). The camera goes
// to each crossing named below - the ford at Gonzales, Groce's ferry, Lynch's ferry, Beeson's, the Cypress Creek ford at
// Burnett's on the march east, and Vince's bridge - at three zooms, and a screenshot of each is written to
// docs/evidence/crossings/<crossing>-<zoom>.png. At each the page's own evidence (`__crossingsDrawn`) must say the crossing
// was drawn, as its kind, where its road meets the water. Three zooms: near (1,400 pixels a mile), close (420), a county (60).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createWorld } from '../sim/world.mjs';

const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 8, worldFactory: (seed, n) => createWorld(seed, n, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const out = 'docs/evidence/crossings';
mkdirSync(out, { recursive: true });
// [site, kind]: Cypress Creek's ford is found by its water, the build names it.
// The lower Colorado crossing is here for the Atascosito road's own ford, laid 2026-09-19 nine miles below Beeson's.
const CROSSINGS = [['ford', 'ford'], ['groces-ferry', 'ferry'], ['lynchs-ferry', 'ferry'], ['columbus-crossing', 'ferry'], ['lower-colorado-crossing', 'ford'], ['Cypress Creek', 'ford'], ['vinces-bridge', 'bridge']];
const ZOOMS = [['near', 1400], ['close', 420], ['county', 60]];
const shots = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__camera && window.__snapshot.world.map?.sites?.['lynchs-ferry']);
  await page.waitForTimeout(1000); // the class's first view settles before the camera is moved
  const box = await page.locator('#world-map').boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  for (const [key, kind] of CROSSINGS) {
    // The Host's "Go to…" names families and towns; a crossing is put in it for the proof, and chosen as a town would be.
    const siteId = await page.evaluate(([key]) => {
      const sites = Object.values(window.__snapshot.world.map.sites);
      const site = sites.find(s => s.id === key) || sites.find(s => s.water === key && s.kind === 'ford');
      const select = document.querySelector('#host-goto'), option = document.createElement('option');
      option.value = site.id; option.textContent = site.name; select.append(option);
      return site.id;
    }, [key]);
    await page.selectOption('#host-goto', siteId);
    await page.waitForTimeout(150);
    const camera = await page.evaluate(() => window.__camera);
    assert.ok(Number.isFinite(camera.cx) && Number.isFinite(camera.cy), `the camera went to ${JSON.stringify(camera)} for ${siteId}`);
    for (const [zoom, target] of ZOOMS) {
      for (let guard = 0; guard < 80; guard++) {
        const scale = await page.evaluate(() => window.__camera.scale);
        if (Math.abs(Math.log(scale / target)) < Math.log(1.15) / 2) break;
        await page.mouse.move(centre.x, centre.y);
        await page.mouse.wheel(0, scale > target ? 120 : -120);
        await page.waitForTimeout(20);
        if (await page.evaluate(() => window.__camera.scale) === scale) break;
      }
      await page.waitForTimeout(1200); // the woods tiles and the transport sheet arrive, and the ground is drawn again
      const drawn = await page.evaluate(id => window.__crossingsDrawn?.[id], siteId);
      assert.ok(drawn, `${siteId} was not drawn at the ${zoom} zoom`);
      assert.equal(drawn.kind, kind, `${siteId} was drawn as a ${drawn.kind}`);
      assert.ok(Number.isFinite(drawn.x) && Number.isFinite(drawn.y), `${siteId} was drawn nowhere: ${JSON.stringify(drawn)}`);
      const path = `${out}/${siteId}-${zoom}.png`;
      await page.screenshot({ path });
      shots.push({ siteId, kind, zoom, scale: +(await page.evaluate(() => window.__camera.scale)).toFixed(1), drawnAt: drawn, path });
    }
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/proof.json`, JSON.stringify({ result: 'PASS', date: new Date().toISOString(), sameComputerOnly: true, shots, errors }, null, 2));
  console.log(`PASS: ${shots.length} screenshots in ${out}`);
} finally { await browser.close(); await app.close(); }
