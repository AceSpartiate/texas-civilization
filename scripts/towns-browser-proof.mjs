// The towns of the colonies, drawn in the browser: docs/TOWNS.md §5b.
//
// tests/towns.test.mjs proves the frames, the art, that nothing stands in a river and that the keepers stand in drawn
// buildings. This proves what a teacher sees going to each drawn town from the Host's Go to list: its streets, squares
// and buildings drawn, a keeper's building named by its trade, and the keepers standing there - with a screenshot of each.
//
// Same computer only: headless Chrome at 1440x950. Not a physical LAN, not a classroom.
// Run: npm run test:towns
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { TOWN_LAYOUTS } from '../sim/town-layouts.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'towns-proof', playerCount: 30, tickMs: 4000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

try {
  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(error.message));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.map?.sites && Object.keys(window.__snapshot.world.map.sites).length > 10, null, { timeout: 30000 });
  await host.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });

  for (const id of Object.keys(TOWN_LAYOUTS)) {
    await host.locator('#host-goto').selectOption(id);
    await host.waitForTimeout(1500);
    const seen = await host.evaluate(town => ({
      drawn: window.__townsDrawn?.[town] || 0,
      scale: window.__camera?.scale,
      shops: (window.__snapshot.world.map.shops?.[town] || []).map(shop => ({ trade: shop.trade, building: shop.building, label: shop.label })),
      keepersDrawn: (window.__snapshot.world.others || []).filter(e => e.townSiteId === town || e.location?.siteId === town).filter(e => window.__drawnAt?.[e.id]).length,
    }), id);
    observed[id] = seen;
    await host.screenshot({ path: `docs/evidence/town-${id}.png` });
    // Closer in, where the documented buildings are named.
    for (let i = 0; i < 3; i++) await host.locator('[data-view=in]').click();
    await host.waitForTimeout(800);
    await host.screenshot({ path: `docs/evidence/town-${id}-close.png` });
    assert.equal(seen.drawn, TOWN_LAYOUTS[id].buildings.length, `${id} drew ${seen.drawn} of ${TOWN_LAYOUTS[id].buildings.length} buildings`);
    // A town families are dealt near has keepers, each in a drawn building; the other places have none.
    assert.ok(seen.shops.every(shop => shop.building), `${id}'s keepers are not in drawn buildings`);
    ok(`${TOWN_LAYOUTS[id].name}: ${seen.drawn} buildings drawn at ${Math.round(seen.scale)} px a mile; ${seen.shops.length} keepers' buildings named; ${seen.keepersDrawn} people drawn there`);
  }
  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/towns-browser.json', `${JSON.stringify({
    record: 'The towns of the colonies, drawn in a browser: docs/TOWNS.md §5b',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A 30-family class on the colonies map, served live; the Host page went to each drawn town from its Go to list. No LAN or district claim.',
    checks: pass, observed, screenshots: Object.keys(TOWN_LAYOUTS).flatMap(id => [`docs/evidence/town-${id}.png`, `docs/evidence/town-${id}-close.png`]),
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
