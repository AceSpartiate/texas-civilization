// A family of twenty on the screen (owner, 2026-09-22: "if i roll a 20, there should be 18 kids").
//
// tests/family-roll.test.mjs proves a 20 makes two parents and eighteen children and that what they are sent fits the tick.
// What only a browser can show is that a student can still use the page with all of them on it: the names card holds
// twenty boxes and its Continue can be reached, the family panel down the left scrolls to its last child instead of running
// off the screen, and the map beside it is still the map - at a Chromebook's 1366 by 768 and at a phone's 400 by 800.
//
// Run: npm run test:family-twenty   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for every browser proof)
// Writes docs/evidence/family-twenty-browser.json. Same computer only: no classroom Wi-Fi, no Chromebook, no real phone.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
// The first seed whose first family rolls a 20: found, not forced, so the server rolls it exactly as it would in a class.
let n = 0; while (familyRoll(`twenty-${n}`, 'hh-1') !== 20) n++;
const seed = `twenty-${n}`;
const app = createClassroom({ seed, playerCount: 5, tickMs: 1000, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('test-results', { recursive: true });

/** Where the panel is, whether it scrolls, and how much of the screen the map is still the top thing at. */
const layout = page => page.evaluate(() => {
  const panel = document.querySelector('#family-panel'), box = panel.getBoundingClientRect();
  // On a phone the guided start's strip runs across the top (docs/FAMILY_PANEL.md §12.11); what the map is asked of is the
  // screen below it, as in test:family-panel, so the number is the panel's and not the lesson's.
  const strip = document.querySelector('#lesson');
  const stripBottom = strip && !strip.hidden && window.innerWidth <= 760 ? strip.getBoundingClientRect().bottom : 0;
  const grid = [];
  for (let gx = 0; gx < 16; gx++) for (let gy = 0; gy < 12; gy++) {
    const x = (gx + .5) * window.innerWidth / 16, y = (gy + .5) * window.innerHeight / 12;
    const top = document.elementFromPoint(x, y);
    grid.push({ below: y > stripBottom, map: top?.id === 'world-map', panel: Boolean(top?.closest?.('#family-panel')) });
  }
  return {
    rows: document.querySelectorAll('#family-rows .panel-row').length,
    panel: { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width), bottom: Math.round(box.bottom) },
    scrolls: panel.scrollHeight > panel.clientHeight + 1, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight,
    mapShare: grid.filter(point => point.below && point.map).length / grid.filter(point => point.below).length, stripBottom: Math.round(stripBottom),
    panelShare: grid.filter(point => point.panel).length / grid.length,
    pageScrolls: document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight + 1,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
});
/** The last child's row brought into view inside the panel: its portrait inside both the panel and the screen. */
const lastRowReachable = page => page.evaluate(async () => {
  const panel = document.querySelector('#family-panel');
  const rows = [...document.querySelectorAll('#family-rows .panel-row')];
  const last = rows.at(-1);
  last.scrollIntoView({ block: 'end' });
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const face = (last.querySelector('.panel-portrait') || last).getBoundingClientRect(), box = panel.getBoundingClientRect();
  const inside = face.top >= box.top - 1 && face.bottom <= box.bottom + 1 && face.bottom <= window.innerHeight + 1 && face.height > 0;
  const top = document.elementFromPoint(face.left + face.width / 2, face.top + face.height / 2);
  return { inside, onTop: Boolean(top && last.contains(top)), scrollTop: panel.scrollTop, id: last.dataset.entityId };
});

try {
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Twenty');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // Four classmates, so the class is the size it is built for and Start is taken the first time.
  for (let i = 2; i <= 5; i++) await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Classmate ${i}`, code: app.state.sessionCode }) });

  // The title screen and the die, as a student does.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  assert.equal(await page.locator('#family-die').textContent(), '20');
  ok('the server rolls this family a 20');
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#surname-input').fill('Twentyman');
  await page.locator('#surname-save').click();
  await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });

  // The names card: twenty boxes, and Continue reachable on a Chromebook's screen.
  await page.locator('#names').waitFor({ state: 'visible', timeout: 15000 });
  const boxes = await page.locator('#names input').count();
  measured.nameBoxes = boxes;
  assert.equal(boxes, 20, `the names card has ${boxes} boxes`);
  await page.locator('#names-done').scrollIntoViewIfNeeded();
  const done = await page.locator('#names-done').boundingBox();
  measured.namesDone = done;
  assert.ok(done && done.y >= 0 && done.y + done.height <= 768, `Continue is at ${JSON.stringify(done)}, off a 768-high screen`);
  await page.screenshot({ path: 'test-results/family-twenty-names.png' });
  ok(`the names card holds all ${boxes} names and its Continue can be reached at 1366 by 768`);
  await page.locator('#names-done').click();
  await page.locator('#names').waitFor({ state: 'hidden', timeout: 15000 });
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#family-rows .panel-row').length === 20, null, { timeout: 15000 });
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  await page.waitForTimeout(600);

  // ------------------------------------------------------------------------------------------------ 1366 by 768
  const desk = await layout(page);
  measured.desktop = desk;
  await page.screenshot({ path: 'test-results/family-twenty-desktop.png' });
  assert.equal(desk.rows, 20);
  assert.ok(desk.panel.bottom <= desk.viewport.height, `the panel runs off the bottom of the screen: ${JSON.stringify(desk.panel)}`);
  assert.ok(desk.scrolls, 'twenty rows fit a 768-high screen without scrolling, which this proof does not believe');
  assert.equal(desk.pageScrolls, false, 'the page itself scrolls instead of the panel');
  assert.ok(desk.panel.width <= 320, `the panel is ${desk.panel.width} px wide`);
  assert.ok(desk.mapShare > 0.55, `the map is the top thing at only ${Math.round(desk.mapShare * 100)}% of the screen`);
  ok(`at 1366 by 768 twenty rows scroll inside a ${desk.panel.width} px panel that ends at ${desk.panel.bottom} px, and the map is on top at ${Math.round(desk.mapShare * 100)}% of the screen`);
  const deskLast = await lastRowReachable(page);
  measured.desktopLast = deskLast;
  assert.ok(deskLast.inside && deskLast.onTop, `the last child cannot be brought into view: ${JSON.stringify(deskLast)}`);
  await page.screenshot({ path: 'test-results/family-twenty-desktop-last.png' });
  ok('the youngest child, last of twenty, scrolls into view inside the panel and nothing covers them');

  // ------------------------------------------------------------------------------------ the class running, the bar full
  // In the lobby the ability bar is one sentence; once the family is home it is a row of pictures across the bottom middle
  // (docs/FAMILY_PANEL.md §12). A family of four never reaches it. A family of twenty fills the column to its foot, and the
  // foot has to stop above the bar or the last children's portraits are under it (found 2026-09-22 by test:family-panel,
  // whose seed now rolls fourteen: the father's "Bring in the crop" took the click meant for his youngest).
  const hostResponse = await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) });
  const hostCookie = hostResponse.headers.get('set-cookie').split(';')[0];
  assert.equal(hostResponse.status, 200, 'the Host could not sign in');
  const start = n => fetch(`${url}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: hostCookie }, body: JSON.stringify({ id: `twenty-start-${n}-${Date.now()}`, action: 'start' }) });
  const started = await start(1);
  assert.equal(started.status, 200, `Start was refused: ${await started.text()}`);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 30000 });
  await page.waitForFunction(() => window.__snapshot.world.entities.filter(e => e.kind === 'person').every(e => !e.travel), null, { timeout: 60000 });
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  // The father's portrait, as a student chooses whose work is on the bar.
  await page.locator('#family-rows .panel-row').first().locator('.panel-portrait').click();
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  const barClear = async size => {
    await page.setViewportSize(size);
    await page.waitForFunction(() => document.querySelectorAll('.panel-row[data-focused=true] .panel-icon').length > 3, null, { timeout: 30000 });
    await page.waitForTimeout(500);
    return page.evaluate(async () => {
      const panel = document.querySelector('#family-panel');
      const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons').getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const last = [...document.querySelectorAll('#family-rows .panel-row')].at(-1);
      last.scrollIntoView({ block: 'end' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const face = last.querySelector('.panel-portrait').getBoundingClientRect();
      const top = document.elementFromPoint(face.left + face.width / 2, face.top + face.height / 2);
      const overlapsBar = box.bottom > bar.top && box.left < bar.right && box.right > bar.left;
      return { panelBottom: Math.round(box.bottom), barTop: Math.round(bar.top), barLeft: Math.round(bar.left), overlapsBar, lastOnTop: Boolean(top && last.contains(top)), covering: top ? `${top.tagName}.${top.className}` : 'nothing' };
    });
  };
  for (const size of [{ width: 1366, height: 768 }, { width: 1440, height: 950 }, { width: 1024, height: 768 }]) {
    const clear = await barClear(size);
    measured[`bar-${size.width}x${size.height}`] = clear;
    await page.screenshot({ path: `test-results/family-twenty-bar-${size.width}.png` });
    assert.ok(!clear.overlapsBar, `at ${size.width} by ${size.height} the panel runs down under the ability bar: ${JSON.stringify(clear)}`);
    assert.ok(clear.lastOnTop, `at ${size.width} by ${size.height} the youngest child's portrait is covered by ${clear.covering}`);
    ok(`with the class running at ${size.width} by ${size.height}, the panel ends at ${clear.panelBottom} px above the ability bar at ${clear.barTop} px, and the youngest child's portrait can be pressed`);
  }

  // ------------------------------------------------------------------------------------------------ a phone's width
  const phone = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 400, height: 800 }, isMobile: true, hasTouch: true });
  await phone.addCookies(await context.cookies());
  const small = await phone.newPage();
  small.on('pageerror', error => errors.push(`phone: ${error.message}`));
  await small.goto(url);
  await meetFamily(small);
  await small.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small.locator('#family-panel').waitFor({ state: 'visible' });
  // The class is still in its lobby, so a page opened afresh shows the wagon again; it is put away as on the desktop.
  if (await small.locator('#wagon-done').isVisible()) await small.locator('#wagon-done').click();
  if (await small.locator('#tutorial-skip').isVisible()) await small.locator('#tutorial-skip').click();
  if (await small.locator('#selection-close').isVisible()) await small.locator('#selection-close').click();
  await small.waitForTimeout(600);
  const mobile = await layout(small);
  measured.phone = mobile;
  await small.screenshot({ path: 'test-results/family-twenty-phone.png' });
  assert.equal(mobile.rows, 20);
  assert.ok(mobile.panel.bottom <= mobile.viewport.height, `on a phone the panel runs off the bottom: ${JSON.stringify(mobile.panel)}`);
  assert.equal(mobile.pageScrolls, false, 'on a phone the page itself scrolls');
  assert.ok(mobile.panelShare < 0.3, `on a phone the panel is on top at ${Math.round(mobile.panelShare * 100)}% of the screen`);
  assert.ok(mobile.mapShare > 0.4, `on a phone the map is on top at only ${Math.round(mobile.mapShare * 100)}% of the screen below the guided start`);
  const phoneLast = await lastRowReachable(small);
  measured.phoneLast = phoneLast;
  assert.ok(phoneLast.inside && phoneLast.onTop, `on a phone the last child cannot be brought into view: ${JSON.stringify(phoneLast)}`);
  ok(`on a 400 px phone twenty rows stay in the column (${Math.round(mobile.panelShare * 100)}% of the screen), the last scrolls into view, and the map is on top at ${Math.round(mobile.mapShare * 100)}% of the screen below the guided start`);

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page error in either');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/family-twenty-browser.json', `${JSON.stringify({
    record: 'family-twenty-browser', date: new Date().toISOString().slice(0, 10), seed,
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a classroom, a Chromebook or a real phone.',
    pass, measured,
    screenshots: ['test-results/family-twenty-names.png', 'test-results/family-twenty-desktop.png', 'test-results/family-twenty-desktop-last.png', 'test-results/family-twenty-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/family-twenty-browser.json`);
} finally {
  await browser.close();
  await app.close?.();
}
process.exit(0);
