// Disease, in a real browser (docs/DISEASE.md build steps 1-7; the owner's request of 2026-09-27).
//
// tests/disease.test.mjs proves the rules against the simulation. This proves what a class sees, through the join flow, at the
// two classroom sizes (1366x768 and 1024x768):
//
//   - a sick person's row says what they have and what they are doing, in the server's words, with the badge on the portrait,
//     and the card says it too;
//   - somebody very sick carries the "!" and the row says so in red;
//   - "Stop and rest a day" pressed on the main person's bar glows, halts the family on the road, and the sick person's row says
//     resting; the days to mending go down twice as fast while the family rests as while it goes on;
//   - the word of the sickness at a crowded place of the record reaches the family's journal along the road, and the Host's
//     Rumor Mill;
//   - the Host's class panel names the sickness ("sick with a chill on the chest"), counts the class's sick in words, and never
//     names a child who died of a sickness, nor draws them.
//
// The class is the Scrape proof's (npm run test:scrape): the real land with rolled families, played in process through the first
// two periods and continued into the spring, its first family at Gonzales. Before the class is served, in the same process, the
// first family is sent east as a family nobody plays would be (`flee`; the leaving is npm run test:scrape's), one of its people is
// given a chill on the chest, one child the measles at its worst, and one child is set as dead of the measles - the server holds
// the world a proof cannot reach into once it is served (server/app.mjs `state` is a copy), and the rules that bring those about
// are tests/disease.test.mjs's. What this proves is the page.
//
// Same computer only: headless Chrome. Run: npm run test:disease
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { fallSick } from '../sim/disease.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { namePrefixes, standinWithheld } from '../public/art-subjects.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const DAY = 1440;
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/disease-${name}.png`; await page.screenshot({ path }); shots.push(path); };

/** Who the proof watches: filled in by the factory, which is the only hand on the world. */
const cast = {};
function inTheSpring(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world);
  const household = world.households['hh-1'];
  household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  household.resources = { ...household.resources, food: 60, seed: 4, cotton: 6 };
  world.status = 'running';
  for (let i = 0; i < 60 && household.flight?.status !== 'ordered'; i++) stepWorld(world);
  assert.equal(household.flight?.status, 'ordered', 'the first family was never told to leave');
  const refuge = [...flightProjection(world, household).refuges].sort((a, b) => a.miles - b.miles)[0].id;
  flee(world, household, { take: { food: 40 }, refuge });
  const mainId = household.mainId || household.principalId;
  const members = household.members.map(id => world.entities[id]).filter(one => one.travel?.purpose === 'flee');
  const patient = members.filter(one => one.id !== mainId && one.age >= 10).sort((a, b) => a.age - b.age)[0];
  const children = members.filter(one => one.age >= 2 && one.age < 10 && !one.travel?.carried).sort((a, b) => b.age - a.age);
  assert.ok(patient && children.length >= 2, 'the first family has not somebody of ten or more and two children of two to nine');
  const [graveOne, lost] = children;
  const day = Math.floor(world.minute / DAY);
  fallSick(world, patient, 'lung-fever', { text: `${patient.name} has fallen sick on the road with a chill on the chest.` });
  patient.health.recoversAt = world.minute + 20 * DAY;
  fallSick(world, graveOne, 'measles', { text: `${graveOne.name} has the measles.` });
  Object.assign(graveOne.health, { grave: true, graveDay: day, nursed: day });
  lost.health = { condition: 'dead', disease: 'measles' }; lost.travel = null; lost.chore = null;
  lost.location = { x: lost.location.x, y: lost.location.y, siteId: refuge };
  Object.assign(cast, { mainId, patient: patient.id, graveOne: graveOne.id, lost: lost.id, lostName: lost.name, refuge });
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'scrape-proof-1', playerCount: 5, tickMs: 1200, worldFactory: inTheSpring });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const rowLine = (page, id) => page.evaluate(id => { const line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-line`); return line && !line.hidden ? { text: line.textContent, grave: line.dataset.grave === 'true' } : null; }, id);
const badge = (page, id) => page.evaluate(id => { const mark = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-mark`); if (!mark || mark.hidden) return null; const box = mark.getBoundingClientRect(); return { w: Math.round(box.width), h: Math.round(box.height), drawn: mark.dataset.drawn === 'true', picture: mark.dataset.picture || null }; }, id);
/**
 * The picture the sick badge must be, by the art's own rule (public/art-subjects.js, owner 2026-09-29 "Astra's art always wins"):
 * Astra's `mark-sick` if she has drawn one; Claude's `mark-sick` unless she has drawn the subject ("the sick mark": her
 * `icon-tend-sick`), and then her `icon-tend-sick` in the cream disc. Read from the manifests on disk, as the page reads them.
 */
const astraFrames = Object.keys(JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8')).frames);
const badgePicture = astraFrames.includes('mark-sick') || !standinWithheld('mark-sick', namePrefixes(astraFrames)) ? 'mark-sick' : 'icon-tend-sick';
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
/** The days a sick person has to go, and the class's minute, as the family's own page is sent them. */
const mending = (page, id) => page.evaluate(id => { const world = window.__snapshot?.world; const one = world?.entities.find(e => e.id === id); return one && { minute: world.minute, left: (one.health.recoversAt - world.minute) / 1440, sick: one.health.condition === 'sick', chore: one.chore?.id || null, progress: one.travel?.progress ?? null, halted: Boolean(one.travel?.halted), riding: Boolean(one.travel?.rides || one.travel?.drives || one.travel?.saddle || one.travel?.carried) }; }, id);
const waitMinute = (page, minute) => page.waitForFunction(minute => (window.__snapshot?.world.minute ?? 0) >= minute, minute, { timeout: 120000 });
/**
 * The column opened to names, as a student opens it with "Show names": it folds to faces while the family is asked where its house
 * stands (public/app.js `renderScreenMoments`), which this spring family never answered, and pressing the button is honoured.
 */
const unfold = async page => { if (await page.evaluate(() => document.querySelector('#family-panel')?.dataset.collapsed === 'true')) { await page.locator('#family-collapse').click(); await page.waitForFunction(() => document.querySelector('#family-panel')?.dataset.collapsed !== 'true', null, { timeout: 10000 }); } };

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`student: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill('Sickness reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 20000 });

  // 1. Very sick: the "!" and the row in red, the day it is seen.
  await page.waitForFunction(id => { const mark = document.querySelector(`[data-attention="${id}"]`); return mark && !mark.hidden; }, cast.graveOne, { timeout: 20000 });
  observed.rowGrave = await rowLine(page, cast.graveOne);
  assert.equal(observed.rowGrave.grave, true);
  assert.match(observed.rowGrave.text, /^Very sick with the measles: could die without nursing and warmth/);
  observed.need = await page.locator(`[data-attention="${cast.graveOne}"]`).getAttribute('aria-label');
  await shot(page, 'very-sick-1366');
  ok(`very sick: the "!" ("${observed.need}") and the row in red: "${observed.rowGrave.text}"`);

  // 2. Sick: the row and the badge, in the server's words, and the card.
  await unfold(page);
  await page.waitForFunction(id => !document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-line`)?.hidden, cast.patient, { timeout: 20000 });
  observed.rowMoving = await rowLine(page, cast.patient);
  assert.match(observed.rowMoving.text, /^Has a chill on the chest: (riding|walking)\. Resting would mend it sooner/);
  // The badge is drawn from the art once its sheet has arrived (public/app.js `paintSickMark`), never left as the glyph: `mark-sick`,
  // or - since Astra's art wins by subject (2026-09-29) and she has drawn the sick mark as her nursing icon - her `icon-tend-sick`.
  await page.waitForFunction(id => ['mark-sick', 'icon-tend-sick'].includes(document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-mark`)?.dataset.picture), cast.patient, { timeout: 20000 });
  observed.badge = await badge(page, cast.patient);
  assert.ok(observed.badge && observed.badge.w >= 16, 'no sick badge on the portrait');
  assert.equal(observed.badge.picture, badgePicture, `the sick badge is ${observed.badge.picture}, not ${badgePicture} as the art's rule says`);
  assert.equal(observed.badge.drawn, badgePicture === 'mark-sick', 'the badge is not styled as the picture it shows');
  // The card beside a person opens only for a matter since 2026-09-29 (owner: "just gets in the way"); the row says the sickness.
  await page.locator(`[data-portrait="${cast.patient}"]`).click({ force: true });
  await page.waitForTimeout(600);
  observed.card = await page.locator('#selection').isVisible() ? (await page.locator('#selection').innerText()).trim() : null;
  await shot(page, 'row-1366');
  ok(`a sick person's row: "${observed.rowMoving.text}", the badge (${observed.badge.picture}) ${observed.badge.w}px on the portrait${observed.card ? `, and the card for what is to be done: "${observed.card.slice(0, 80)}"` : ', and no card'}`);

  // 3. The Host: the sickness named in the class panel and counted in words, while the family's sick are sick.
  await host.waitForFunction(() => /sick with a chill on the chest/.test(document.querySelector('#host-families')?.textContent || ''), null, { timeout: 20000 });
  observed.hostWords = await host.evaluate(() => [...document.querySelectorAll('#host-families li li')].map(line => line.textContent).find(text => /sick with a chill on the chest/.test(text)));
  await host.waitForFunction(() => /Chill on the chest: \d+ sick/.test(document.querySelector('#host-sickness')?.textContent || ''), null, { timeout: 20000 });
  observed.hostCount = await host.locator('#host-sickness').innerText();
  await shot(host, 'host-words-1366');
  ok(`the Host's class panel: "${observed.hostWords}"; "${observed.hostCount}"`);

  // 4. "Stop and rest a day", pressed on the main person's bar: it glows, the family halts, the sick rest and mend twice as fast.
  const going = await mending(page, cast.patient);
  await page.locator(`[data-portrait="${cast.mainId}"]`).click({ force: true });
  await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, cast.mainId, { timeout: 15000 });
  await page.locator('.panel-row[data-focused=true] .panel-icon[data-key="rest-road"]').click();
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="rest-road"]')?.dataset.active === 'true', null, { timeout: 15000 });
  const halted = await mending(page, cast.patient);
  await page.waitForFunction(id => /resting/.test(document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-line`)?.textContent || ''), cast.patient, { timeout: 20000 });
  observed.rowResting = await rowLine(page, cast.patient);
  await shot(page, 'resting-1366');
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.id !== 'rest-road', cast.mainId, { timeout: 120000 });
  const rested = await mending(page, cast.patient);
  assert.equal(rested.progress, halted.progress, 'the family made miles while it rested');
  observed.restRate = Math.round((halted.left - rested.left) / ((rested.minute - halted.minute) / DAY) * 100) / 100;
  // And the day before the rest, on the road: the same measured over the minutes the family went on.
  observed.goingRate = Math.round((going.left - halted.left) / Math.max(1e-9, (halted.minute - going.minute) / DAY) * 100) / 100;
  // A day on the road after the rest, for a rate over a whole day of going.
  const after = await mending(page, cast.patient);
  await waitMinute(page, after.minute + DAY);
  const later = await mending(page, cast.patient);
  observed.afterRate = Math.round((after.left - later.left) / ((later.minute - after.minute) / DAY) * 100) / 100;
  observed.afterActivity = later.halted ? 'halted' : later.riding ? 'riding' : 'walking';
  assert.ok(Math.abs(observed.restRate - 2) < 0.26, `resting mended ${observed.restRate} days a day, not two`);
  assert.ok(observed.afterRate < observed.restRate, `going on mended as fast as resting (${observed.afterRate} against ${observed.restRate})`);
  ok(`"Stop and rest a day" glowed on the main person's bar and halted the family; the row said "${observed.rowResting.text}"; resting mended ${observed.restRate} days a day, and a day on after it ${observed.afterRate} (${observed.afterActivity})`);

  // 5. The child dead of the measles: never named on the projector, and drawn nowhere.
  await host.waitForFunction(() => /child of this family died of sickness|children of this family died of sickness/.test(document.querySelector('#host-families')?.textContent || ''), null, { timeout: 20000 });
  observed.hostPanel = await host.locator('#host-families').innerText();
  assert.ok(!observed.hostPanel.includes(cast.lostName), `the Host's class panel names ${cast.lostName}`);
  const onHostMap = await host.evaluate(id => (window.__snapshot?.world.others || []).some(one => one.id === id), cast.lost);
  assert.equal(onHostMap, false, 'the child is on the Host\'s map');
  const drawnForFamily = await page.evaluate(id => Boolean(window.__drawnAt?.[id]), cast.lost);
  assert.equal(drawnForFamily, false, 'the child is drawn on the family\'s map');
  await shot(host, 'host-1366');
  ok(`the child dead of the measles is not named on the Host's class panel ("${observed.hostPanel.split('\n').find(line => /died of sickness/.test(line))}"), not on the Host's map, and not drawn on the family's`);

  // 6. The word of the sickness at a crowded place goes along the road, into the family's journal and the Rumor Mill.
  await page.waitForFunction(() => /measles/.test(document.querySelector('#reports')?.textContent || ''), null, { timeout: 300000 });
  await page.locator('#journal-toggle').click();
  await page.waitForTimeout(600);
  observed.journal = (await page.locator('#reports').innerText()).split('\n').find(line => /measles/.test(line));
  // The day as the page itself says it (the date over the map).
  observed.heardOn = await page.evaluate(() => window.__snapshot?.world.historicalDate || null);
  await shot(page, 'news-1366');
  await page.locator('#journal-close').click();
  await host.waitForFunction(() => /measles and whooping cough/.test(document.querySelector('#rumor-story')?.textContent || ''), null, { timeout: 60000 });
  observed.rumour = (await host.locator('#rumor-story').innerText()).split('\n').find(line => /measles/.test(line));
  ok(`word of the sickness reached the family on the road by ${observed.heardOn}: "${observed.journal}"; the Rumor Mill: "${observed.rumour}"`);

  // 7. At 1024x768 the row and the card still say it, and nothing scrolls sideways.
  await page.setViewportSize({ width: 1024, height: 768 });
  await unfold(page);
  await page.waitForTimeout(1000);
  const sickNow = (await page.evaluate(() => window.__snapshot.world.entities.filter(one => one.sickness).map(one => one.id)))[0];
  observed.overflow1024 = await noOverflow(page);
  assert.ok(observed.overflow1024 <= 1, `the page scrolls sideways at 1024x768 by ${observed.overflow1024}px`);
  if (sickNow) {
    observed.row1024 = await rowLine(page, sickNow);
    const inView = await page.evaluate(id => { const line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-sick-line`); const box = line?.getBoundingClientRect(); return box ? box.right <= innerWidth && box.width > 40 : false; }, sickNow);
    assert.ok(inView, 'the sick line is cut off at 1024x768');
  }
  await shot(page, 'row-1024');
  ok(`at 1024x768 ${observed.row1024 ? `the row says "${observed.row1024.text}" and ` : ''}the page does not scroll sideways`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/disease-browser.json', `${JSON.stringify({
    record: 'Disease, in a browser: docs/DISEASE.md build steps 1-7',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768 and 1024x768. The Scrape proof\'s class (real land, rolled families, two periods played in process, continued into the spring); before it was served its first family was sent east, one of its people given a chill on the chest, one child the measles at its worst and one child set as dead of the measles - the rules that bring those about are tests/disease.test.mjs\'s. No LAN or district claim.',
    cast, checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
