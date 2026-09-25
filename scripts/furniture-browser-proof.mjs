// Furniture, in a real browser: docs/SETTLING_IN.md §6, build step 6.
//
// tests/furniture.test.mjs proves the rules. This proves a student can do it with the controls they
// have: the Make furniture icon on a person's row of the family panel, the question the work stops to
// ask with every piece saying what it does, the choice, the trip to the timber and back, and the
// piece in the family's book at the end.
//
// Run: npm run test:furniture
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';
import { sendTheWay } from './support/going.mjs';
// The title screen and the family made on it (public/creation.js, owner 2026-09-17). This proof pressed straight through to
// the panel and the curtain swallowed the press: `#creation-scene`, the canvas behind Begin, took every click at
// `.panel-focus`. The panel is drawn under it and reads as visible, so the failure was a timeout on a button nobody could
// have pressed rather than anything about furniture. A student presses Begin first; so does this now.
import { meetFamily } from './support/meet-family.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'furniture-proof', playerCount: 5, tickMs: 200, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Furniture reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  // The title screen, and whatever of the family the page still asks for. These families were founded with their names
  // (`keepFoundingFamilies`), so nothing here is rolled; it is the curtain that has to come down.
  await meetFamily(page);
  // The wagon opens by itself in the lobby, and a covering panel dims what is under it (docs/FAMILY_PANEL.md §12.11), so a
  // press aimed at the panel would be refused through the dim. It is put away first, the way a student does.
  for (const button of ['#wagon-done', '#tutorial-skip']) {
    if (await page.locator(button).isVisible()) await page.locator(button).click({ timeout: 5000 }).catch(() => {});
  }
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  // This family is settled on its land with a roof up, so `sim/lesson.mjs` never starts a lesson on it (`beginsAt`) and
  // nothing here is gated by a step. Asserted rather than assumed: a lesson standing would shut `make-furniture` and the
  // failure below would read as a missing icon.
  assert.equal(await page.evaluate(() => window.__snapshot?.world.lesson ?? null), null, 'a lesson stands on a family that was settled before it began');

  // The icon, with its sentence.
  const worker = 'hh-1-elena';
  await asMain(page, worker);
  const icon = page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="make-furniture"]`);
  await icon.waitFor({ state: 'visible' });
  observed.icon = `${await icon.getAttribute('data-name')}: ${await icon.getAttribute('data-summary') || ''}`;
  await icon.click();
  // How they go is asked first (owner, 2026-09-24; public/going.js): on foot, as this proof always watched the walk.
  await sendTheWay(page, { way: 'foot' });
  ok(`the family panel offers the work: ${observed.icon}`);

  // The question, with every piece saying what it does.
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.ask, worker, { timeout: 30000 });
  await page.locator(`.panel-row[data-entity-id="${worker}"] .panel-portrait`).click();
  await page.locator('#selection-work button[data-action=answer-chore]').first().waitFor({ state: 'visible' });
  const options = await page.locator('#selection-work button[data-action=answer-chore]').evaluateAll(buttons =>
    buttons.map(button => ({ option: button.dataset.option, label: button.querySelector('.work-name')?.textContent, note: button.querySelector('.work-note')?.textContent, disabled: button.disabled })));
  observed.options = options;
  assert.deepEqual(options.map(o => o.option), ['bedstead', 'table', 'benches', 'shelves', 'cradle', 'leave']);
  // A piece the family can make says what it does and what it costs; one it cannot says why not.
  for (const o of options.filter(o => o.option !== 'leave')) assert.match(o.note, o.disabled ? /wants|already/ : /spells of work/, `${o.option} says neither what it costs nor why not: "${o.note}"`);
  assert.ok(options.some(o => o.option !== 'leave' && !o.disabled), 'nothing could be made');
  ok(`the work asks which piece, and each says what it does: ${options.map(o => `${o.label} (${o.note})`).join('; ')}`);

  const chosen = options.find(o => o.option === 'benches' && !o.disabled) ? 'benches' : options.find(o => !o.disabled && o.option !== 'leave').option;
  await page.locator(`#selection-work button[data-action=answer-chore][data-option="${chosen}"]`).click();
  let left = false;
  await page.waitForFunction(([id, piece]) => {
    const world = window.__snapshot?.world;
    const person = world?.entities.find(e => e.id === id);
    if (person && person.location.siteId !== world.household.homeSiteId) window.__leftForTimber = true;
    return world?.household.furniture?.[piece];
  }, [worker, chosen], { timeout: 120000, polling: 100 });
  left = await page.evaluate(() => Boolean(window.__leftForTimber));
  assert.ok(left, 'the piece was made without anybody leaving the land for timber');
  ok(`${chosen} made, after a trip off the land for timber`);

  await page.locator('#journal-toggle').click();
  const line = page.locator('#property li[data-furniture="true"]');
  await line.waitFor({ state: 'visible' });
  observed.book = await line.textContent();
  assert.match(observed.book, new RegExp(`${chosen} \\(made\\)`));
  ok(`the family book lists it: "${observed.book}"`);

  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/furniture-book.png' });
  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/furniture-browser.json', `${JSON.stringify({
    record: 'Furniture, in a browser: docs/SETTLING_IN.md build step 6',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A student started Make furniture from the family panel, chose a piece at the question, watched the trip to the timber and back, and found the piece in the family book. Buying from the carpenter is proved in tests/furniture.test.mjs. No LAN or district claim.',
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
