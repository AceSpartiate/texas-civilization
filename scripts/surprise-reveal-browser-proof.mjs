// The ending's reveal of the snow march and the surprise at Béxar, on the Host's closing screen and a family's (owner,
// 2026-09-26: the true story of the snow march goes to the teacher "At the ending"; sim/surprise.mjs `surpriseReveal`,
// public/ending.js `revealView`; docs/battle-research/surprise-at-bexar.md §6).
//
// A class on the colonies map played in process through the first period and the second to the evening of March 13, 1836, a
// few minutes before the second period stops; two students join (1366x768 and 1024x768) and the Host starts it. When it stops,
// the Host's closing view and each family's carry the reveal - the belief in the grass, the warnings, the bell, the snow of
// February 13-14 in Coahuila with Santa Anna ahead of it at Guerrero, and the Yucatán dead of Urrea's norther - readable in the
// panel without the page scrolling sideways. Same computer, headless Chrome. Run: npm run test:surprise-reveal
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { alamoClass } from './support/alamo-class.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const directory = mkdtempSync(join(tmpdir(), 'texas-reveal-'));
/** The class a little before the second period stops on the night of March 13. */
function lateClass(seed, count) {
  const world = alamoClass(seed, count);
  world.status = 'running';
  const end = momentOf(world, 'alamo-end');
  for (let i = 0; i < 20000 && world.status === 'running' && world.minute < end - 1500; i++) stepWorld(world);
  assert.ok(world.director.milestones['alamo-siege'] && !world.director.milestones['alamo-end'], `the class is not between the siege and the period's end: ${world.status} at ${world.minute} of ${end}`);
  world.status = 'lobby';
  return world;
}
const app = createClassroom({ seed: 'surprise-reveal', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: lateClass });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { screens: [] };
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = async (page, name) => { const path = `test-results/surprise-reveal-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };
/** The reveal as the page drew it, scrolled into view in the ending panel, and whether the page scrolls sideways. */
async function revealOn(page, width) {
  await page.locator('#ending').waitFor({ state: 'visible', timeout: 120000 });
  await page.locator('#ending .ending-reveal').waitFor({ state: 'attached', timeout: 20000 });
  await page.locator('#ending .ending-reveal').scrollIntoViewIfNeeded();
  const text = (await page.locator('#ending .ending-reveal').innerText()).replace(/\s+/g, ' ');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at ${width}x768 by ${overflow}px`);
  const box = await page.locator('#ending').boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= 768, `the ending panel is not on the screen at ${width}x768`);
  return text;
}
const SAID = [/grass/, /Herrera/, /bell/, /snow/, /February 13/, /Coahuila/, /sixteen inches/, /Guerrero/, /Urrea/, /February 25/];

try {
  mkdirSync('test-results', { recursive: true });
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Garrison', 'hh-2': 'Faraway' }[householdId]);
    students[householdId] = page;
  }
  await host.waitForFunction(() => window.__snapshot.connected === 2);
  // Nothing of the reveal while the class runs.
  assert.equal(await host.evaluate(() => 'ending' in window.__snapshot.world), false, 'the Host had an ending before the class stopped');
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => ['running', 'ended'].includes(window.__snapshot.world.status), null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => ['running', 'ended'].includes(window.__snapshot.world.status));
  }
  ok(`a class played in process to ${await host.evaluate(() => window.__snapshot.world.historicalDate)}, two students joined, the Host started it; no ending on the wire while it ran`);

  const hostText = await revealOn(host, 1366);
  for (const said of SAID) assert.match(hostText, said, `the Host's reveal does not say ${said}`);
  await shot(host, 'host-1366');
  ok(`the Host's closing view reveals it at 1366x768: "${hostText.slice(0, 200)}…"`);
  for (const [householdId, page] of Object.entries(students)) {
    const width = householdId === 'hh-1' ? 1366 : 1024;
    const text = await revealOn(page, width);
    for (const said of SAID) assert.match(text, said, `${householdId}'s reveal does not say ${said}`);
    await shot(page, `${householdId}-${width}`);
    ok(`${householdId}'s ending reveals it too, in its panel at ${width}x768, nothing sideways`);
  }

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  evidence.verdict = 'PASS';
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/surprise-reveal-browser.json`);
} catch (error) {
  evidence.verdict = 'FAIL'; evidence.failure = error.message;
  throw error;
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(evidence.verdict === 'PASS' ? 'docs/evidence/surprise-reveal-browser.json' : 'test-results/surprise-reveal-browser-failed.json', `${JSON.stringify({
    record: 'surprise-reveal-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 (Host, hh-1) and 1024x768 (hh-2), 300 ms a tick. A real class on the colonies map with rolled families, played in process through the first period and the second to the evening of March 13, 1836. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
