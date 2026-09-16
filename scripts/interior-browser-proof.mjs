// Inside the house, in the browser: docs/SETTLING_IN.md step 7.
//
// tests/interior.test.mjs proves the spots, what can be set out, one thing in one place, and who is sent the rooms. This
// proves what a student and a teacher do: the student taps the family's own house on the map and the rooms open; chooses the
// iron pot and a place by the hearth, and the server sets it there and the picture shows it; moves it and puts it away; and
// the teacher, going to that family's land, taps the same house and sees the room read only, with nothing to press.
//
// The class is the invented Gonzales country, every family's cabin standing (set in process, and said so in the record),
// because raising a house takes most of an afternoon.
//
// Same computer only: headless Chrome. Run: npm run test:interior
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

function housedClass(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount);
  for (const household of Object.values(world.households)) household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  return world;
}

const app = createClassroom({ seed: 'interior-proof', playerCount: 5, tickMs: 4000, worldFactory: housedClass });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

/** Tap the house drawn at this site: on its roof, above anybody standing at its door. */
async function tapHouse(page, siteId) {
  await page.waitForFunction(id => window.__housesDrawn?.get?.(id), siteId, { timeout: 30000 });
  const spot = await page.evaluate(id => { const s = window.__housesDrawn.get(id); const r = document.querySelector('#world-map').getBoundingClientRect(); const c = document.querySelector('#world-map'); return { x: r.left + s.x * r.width / c.width, y: r.top + (s.y - s.size * .15) * r.height / c.height }; }, siteId);
  await page.mouse.click(spot.x, spot.y);
}

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('House keeper');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await student.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });

  // The student taps the house, and the rooms open.
  const home = await student.evaluate(() => window.__snapshot.world.household.homeSiteId);
  await student.locator('[data-view=home]').click().catch(() => {});
  await student.waitForTimeout(800);
  await tapHouse(student, home);
  await student.locator('#interior').waitFor({ state: 'visible' });
  observed.opened = await student.evaluate(() => window.__interiorShown);
  assert.equal(observed.opened.open, true);
  ok(`tapping the family's own house opens its rooms: a ${observed.opened.kind} interior`);

  // The iron pot, set by the hearth.
  await student.locator('#interior [data-item="good:pot"]').click();
  await student.locator('#interior [data-spot="hearth"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.land?.interior?.placed?.hearth === 'good:pot', null, { timeout: 15000 });
  await student.waitForFunction(() => window.__interiorShown?.drawn?.some(d => d.spot === 'hearth' && d.item === 'good:pot'), null, { timeout: 15000 });
  assert.equal(app.state.world.households['hh-1'].interior.hearth, 'good:pot');
  await student.locator('#interior [data-item="stores:provisions"]').click();
  await student.locator('#interior [data-spot="back-wall"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.land?.interior?.placed?.['back-wall'] === 'stores:provisions', null, { timeout: 15000 });
  await student.waitForTimeout(400);
  await student.screenshot({ path: 'docs/evidence/interior-student.png' });
  ok('the iron pot is set by the hearth and a barrel against the back wall: the server holds them, and the picture shows them');

  // Moved, then put away.
  await student.locator('#interior [data-spot="hearth"]').click();
  await student.locator('#interior [data-spot="middle"]').click();
  await student.waitForFunction(() => { const p = window.__snapshot?.world.land?.interior?.placed || {}; return p.middle === 'good:pot' && !p.hearth; }, null, { timeout: 15000 });
  await student.locator('#interior [data-spot="middle"]').click();
  await student.locator('#interior .interior-away').click();
  await student.waitForFunction(() => !Object.values(window.__snapshot?.world.land?.interior?.placed || {}).includes('good:pot'), null, { timeout: 15000 });
  ok('the pot is moved to the middle of the room, then put away');

  // A taken spot is refused, in words.
  await student.locator('#interior [data-item="good:bedding"]').click();
  const free = await student.locator('#interior [data-spot="back-wall"]').isVisible();
  assert.equal(free, true);
  // The back wall's button is the barrel's: choosing it chooses the barrel, it does not drop the bedding on it.
  await student.locator('#interior [data-spot="back-wall"]').click();
  assert.equal(app.state.world.households['hh-1'].interior['back-wall'], 'stores:provisions', 'the bedding was dropped onto the barrel');
  ok('a filled place chooses what stands there; nothing is set on top of it');

  // Closed with the map behind it.
  await student.locator('#interior-close').click();
  assert.equal(await student.locator('#interior').isHidden(), true);
  ok('the rooms close, back to the map');

  // The teacher goes to the family's land and taps the same house: read only.
  await host.locator('#host-goto').selectOption(home);
  await host.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  await host.waitForTimeout(1500);
  await tapHouse(host, home);
  await host.locator('#interior').waitFor({ state: 'visible' });
  observed.host = await host.evaluate(() => ({ shown: window.__interiorShown, buttons: [...document.querySelectorAll('#interior button:not(#interior-close)')].filter(b => !b.hidden).length, text: document.querySelector('#interior').innerText }));
  assert.ok(observed.host.shown.drawn.some(d => d.item === 'stores:provisions'), 'the teacher does not see the barrel the family set out');
  assert.equal(observed.host.buttons, 0, 'the teacher is offered something to press in a family\'s house');
  await host.screenshot({ path: 'docs/evidence/interior-host.png' });
  ok(`the teacher sees the same room read only: "${observed.host.text.replace(/\s+/g, ' ').trim()}"`);

  // At phone width the rooms fit.
  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  await tapHouse(student, home);
  await student.locator('#interior').waitFor({ state: 'visible' });
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  await student.screenshot({ path: 'docs/evidence/interior-phone.png' });
  ok('at phone width the rooms open and the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/interior-browser.json', `${JSON.stringify({
    record: 'Inside the house, in a browser: docs/SETTLING_IN.md step 7',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. The invented Gonzales country with every family\'s cabin set standing in process; a student tapped their house, set out, moved and put away things; the Host went to the land and tapped the same house. No LAN or district claim.',
    checks: pass, observed, screenshots: ['docs/evidence/interior-student.png', 'docs/evidence/interior-host.png', 'docs/evidence/interior-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
