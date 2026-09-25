// How they will go, asked before anybody leaves, in a real browser (owner, 2026-09-24; docs/FAMILY_PANEL.md §15).
//
// > "when sending someone to travel, the game should ask how they'll travel."
//
// tests/going.test.mjs proves the rules and tests/going-page.test.mjs the page's. This proves a student meets them with the
// controls they have: pressing Travel to Gonzales opens the chooser and sends nobody; the three ways are there, the horse
// marked quickest and chosen, each with the server's facts; the student picks walking, Enter sends, and the principal walks
// while the horse stays home; the hunt in the timber opens the chooser with the horse chosen, Send sends, and the hunter is
// drawn riding it; buying furniture in town finds the horse shut in the hunter's name, the student picks the wagon, and it
// goes after Escape has sent nobody the first time; the next person, with the horse and the wagon both out, has one way and is
// sent on foot at once with no chooser drawn (owner, 2026-09-25: "When a journey has only one possible way, skip the chooser").
// At 1366x768 and 1024x768 (phones unsupported, owner) the chooser fits, nothing is drawn over its own controls, it keeps off
// the family's column, and the ability bar steps aside while it is open and is back after.
//
// Same computer only. Run: npm run test:going
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
// hh-1 of modest means - one wagon, one ox - since what this proves is who has the wagon (sim/means.mjs gives others more).
import { createSettledWorld, keepFoundingFamilies, modestMeans, taught } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SHOTS = process.env.GOING_SHOTS || 'test-results';
mkdirSync(SHOTS, { recursive: true });
mkdirSync('test-results', { recursive: true });

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'going-proof', playerCount: 5, tickMs: 250, worldFactory: (seed, count) => modestMeans(taught(keepFoundingFamilies(createSettledWorld(seed, count)))) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};
/** The chooser as drawn: open or not, its ways as buttons, what the proof hook says, and the bar beside it. */
const chooser = page => page.evaluate(() => ({
  shown: !document.querySelector('#going').hidden,
  title: document.querySelector('#going-title').textContent,
  says: document.querySelector('#going-text').textContent,
  ways: [...document.querySelectorAll('#going [data-way]')].map(button => ({ way: button.dataset.way, label: button.textContent, open: !button.disabled, pressed: button.getAttribute('aria-pressed') === 'true', why: button.title || null })),
  send: !document.querySelector('#going-send').disabled,
  state: window.__going || null,
}));
/** The chooser measured against the screen and the furniture it must not cover (docs/FAMILY_PANEL.md §12.11). */
const measure = page => page.evaluate(() => {
  const box = element => { const r = element?.getBoundingClientRect(); return r && r.width > 1 && r.height > 1 ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) } : null; };
  const going = box(document.querySelector('#going'));
  const overlap = other => other && going ? Math.max(0, Math.min(going.r, other.r) - Math.max(going.x, other.x)) * Math.max(0, Math.min(going.b, other.b) - Math.max(going.y, other.y)) : 0;
  const column = box(document.querySelector('#family-rows')), bar = box(document.querySelector('.panel-row[data-focused=true] .panel-icons'));
  const covered = [...document.querySelectorAll('#going button')].filter(button => {
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(hit && (hit === button || button.contains(hit)));
  }).map(button => button.id || button.dataset.way || button.textContent);
  return { screen: { w: innerWidth, h: innerHeight }, going, fits: Boolean(going) && going.x >= 0 && going.y >= 0 && going.r <= innerWidth && going.b <= innerHeight, overColumn: overlap(column), bar, covered };
});
const press = async (page, id, key) => {
  const icon = page.locator(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`);
  await icon.waitFor({ state: 'visible' });
  await icon.click();
  await page.locator('#going').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__going?.ways?.length === 3, null, { timeout: 15000 });
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Going reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  if (await page.locator('#tutorial-skip').isVisible().catch(() => false)) await page.locator('#tutorial-skip').click();

  const world = () => app.state.world;
  const family = world().households['hh-1'];
  const principal = world().entities[family.principalId];
  const others = family.members.filter(id => id !== principal.id).map(id => world().entities[id]);
  const [hunter, driver, fourth] = others;
  assert.ok(hunter && driver && fourth, 'this family has not four grown people, so this proves nothing');
  const horse = () => world().entities['hh-1-horse'], wagon = () => world().entities['hh-1-wagon'];

  // --------------------------------------------------------------- to Gonzales: the chooser, and the student picks walking
  await asMain(page, principal.id);
  await press(page, principal.id, 'travel-gonzales');
  assert.equal(world().entities[principal.id].travel, null, 'pressing Travel to Gonzales sent him before he was asked how');
  const town = await chooser(page);
  observed.town = town;
  assert.deepEqual(town.ways.map(one => one.way), ['horse', 'foot', 'wagon']);
  assert.match(town.ways[0].label, /On the horse \(quickest\)/);
  assert.ok(town.ways[0].pressed && !town.ways[1].pressed, 'the quickest was not the one chosen');
  assert.ok(town.ways.every(one => one.open && /miles an hour · about .+ there · carries \d+/.test(one.label)), `a way is missing its facts: ${JSON.stringify(town.ways)}`);
  assert.equal(town.title, `How will ${principal.name} go?`);
  const bar = await measure(page);
  assert.equal(bar.bar, null, 'the ability bar is still drawn under the chooser');
  ok(`Travel to Gonzales asks first and sends nobody: "${town.title}", three ways with the server's facts, the horse marked quickest and chosen`);
  await page.locator('#going [data-way="foot"]').click();
  await page.waitForFunction(() => document.querySelector('#going [data-way="foot"]')?.getAttribute('aria-pressed') === 'true');
  await page.keyboard.press('Enter');
  await page.locator('#going').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel, principal.id, { timeout: 10000 });
  assert.equal(world().entities[principal.id].travel?.mode, 'foot', 'he did not go the way the student picked');
  assert.equal(horse().borrowedBy ?? null, null, 'the horse left the yard although the student picked walking');
  const back = await measure(page);
  assert.ok(back.bar && back.bar.w > 0 && back.bar.h > 0, 'the ability bar did not come back after the chooser closed');
  ok(`the student picks walking and presses Enter: ${principal.name} walks to Gonzales, the horse stays home, and the bar is back`);

  // ------------------------------------------------------------------------ to the timber: the horse chosen, and ridden
  await asMain(page, hunter.id);
  await press(page, hunter.id, 'hunt-timber');
  const timber = await chooser(page);
  observed.timber = timber;
  assert.ok(timber.ways[0].pressed && timber.ways[0].open, 'the horse is not chosen for the hunt');
  assert.ok(timber.ways.some(one => /Brings home \d+ food/.test(one.label)), 'the hunt does not say what each way brings home');
  await page.screenshot({ path: join(SHOTS, 'going-timber-1366.png') });
  const wide = await measure(page);
  observed.timber1366 = wide;
  assert.ok(wide.fits && !wide.covered.length && wide.overColumn === 0, `at 1366x768 the chooser does not fit or is covered: ${JSON.stringify(wide)}`);
  await page.locator('#going-send').click();
  await page.locator('#going').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.mode === 'horse', hunter.id, { timeout: 10000 });
  assert.equal(horse().borrowedBy, hunter.id);
  // Drawn riding it: the class held while the rider is looked at, the camera on him, the page's own record of what it drew.
  await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await page.locator(`.panel-portrait[data-portrait="${hunter.id}"]`).click();
  await page.waitForFunction(id => window.__seatedDrawn?.[id]?.seat === 'horse', hunter.id, { timeout: 20000 });
  const seated = await page.evaluate(id => ({ seat: window.__seatedDrawn[id].seat, art: window.__seatedDrawn[id].art }), hunter.id);
  observed.ridden = seated;
  await post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'running');
  ok(`the hunt in the timber asks with the horse chosen; Send sends ${hunter.name}, and the map draws them riding it (${seated.art || seated.seat})`);

  // ------------------------------------------------------------- to town for furniture: the horse shut, the wagon picked
  await asMain(page, driver.id);
  await press(page, driver.id, 'buy-furniture');
  const furniture = await chooser(page);
  observed.furniture = furniture;
  const shutHorse = furniture.ways.find(one => one.way === 'horse');
  assert.equal(shutHorse.open, false, 'the horse was offered while the hunter has it');
  assert.match(shutHorse.why, new RegExp(`^${hunter.name} has the horse`));
  assert.match(furniture.ways.find(one => one.way === 'foot').label, /quickest/);
  // Two ways open, walking and the wagon: a real choice, so it is asked (owner, 2026-09-25). Measured at both screens, and
  // Escape sends nobody.
  await page.screenshot({ path: join(SHOTS, 'going-taken-1366.png') });
  const shut1366 = await measure(page);
  observed.taken1366 = shut1366;
  assert.ok(shut1366.fits && !shut1366.covered.length && shut1366.overColumn === 0, `at 1366x768 the chooser does not fit or is covered: ${JSON.stringify(shut1366)}`);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOTS, 'going-taken-1024.png') });
  const narrow = await measure(page);
  observed.taken1024 = narrow;
  assert.ok(narrow.fits && !narrow.covered.length && narrow.overColumn === 0, `at 1024x768 the chooser does not fit or is covered: ${JSON.stringify(narrow)}`);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator('#going [data-way="foot"]').focus();
  await page.keyboard.press('Escape');
  await page.locator('#going').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForTimeout(600);
  assert.equal(world().entities[driver.id].chore, null, 'Escape sent them anyway');
  ok(`buying furniture has two ways open and asks, with the horse shut ("${shutHorse.why}"); it fits at 1366x768 (${shut1366.going.w}x${shut1366.going.h}) and 1024x768 (${narrow.going.w}x${narrow.going.h}); Escape sends nobody`);
  await press(page, driver.id, 'buy-furniture');
  await page.locator('#going [data-way="wagon"]').click();
  await page.locator('#going-send').click();
  await page.locator('#going').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.mode === 'wagon', driver.id, { timeout: 10000 });
  assert.equal(wagon().borrowedBy, driver.id);
  ok(`asked again, the student picks the wagon over walking, the quickest, and ${driver.name} drives it`);

  // --------------------- the next person: one way left, so nobody is asked (owner, 2026-09-25) and they walk straight away
  await asMain(page, fourth.id);
  const asked = await page.evaluate(() => { window.__goingSkipped = null; return window.__goingAsked || 0; });
  const icon = page.locator(`.panel-row[data-entity-id="${fourth.id}"] .panel-icon[data-key="make-furniture"]`);
  await icon.waitFor({ state: 'visible' });
  await icon.click();
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel?.mode === 'foot', fourth.id, { timeout: 15000 });
  const skipped = await page.evaluate(() => ({ skipped: window.__goingSkipped, asked: window.__goingAsked, shown: !document.querySelector('#going').hidden, bar: Boolean(document.querySelector('.panel-row[data-focused=true] .panel-icons')) }));
  observed.oneWay = skipped;
  assert.equal(skipped.asked, asked + 1, 'the order did not go through the question at all, so this proves nothing about skipping it');
  assert.equal(skipped.shown, false, 'the chooser was drawn for a journey with one way');
  assert.equal(skipped.skipped?.mode, 'foot');
  const shutWagon = skipped.skipped.ways.find(one => one.id === 'wagon');
  assert.equal(shutWagon.can, false, 'the wagon was open while it is on the road');
  assert.match(shutWagon.why, new RegExp(`^${driver.name} has the ox and wagon`));
  assert.match(skipped.skipped.ways.find(one => one.id === 'horse').why, new RegExp(`^${hunter.name} has the horse`));
  assert.deepEqual(skipped.skipped.ways.filter(one => one.can).map(one => one.id), ['foot']);
  assert.equal(world().entities[fourth.id].travel?.mode, 'foot');
  assert.ok(skipped.bar, 'the ability bar stepped aside for a chooser that was never drawn');
  ok(`${fourth.name}, with the horse and the wagon both out ("${shutWagon.why}"), is sent to make furniture on foot straight away: no chooser drawn, the one way sent with the order`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/going-browser.json', JSON.stringify({
    record: 'going-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: ['"when sending someone to travel, the game should ask how they\'ll travel." (2026-09-24)', '"When a journey has only one possible way, skip the \'how will they go?\' chooser." (2026-09-25)'],
    checks: pass,
    observed,
    notProved: [
      'Same computer only: no physical LAN, no Chromebook, no class.',
      'The call menu asking each person it sends in turn is proved by its rules (tests/going-page.test.mjs) and the server (tests/going.test.mjs), not here: no call is open in this class.',
      'The chooser on a phone: phones are not supported (owner).',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/going-browser.json');
} finally {
  await browser.close();
  await app.close();
}
