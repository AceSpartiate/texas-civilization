// Who acts for a family, in the browser (owner, 2026-09-28: "fix the blockers", and "The oldest child steps up"; sim/acting.mjs,
// docs/FAMILY_PANEL.md §20).
//
// tests/acting.test.mjs proves the rules. This proves what a student sees and does, at 1366x768:
//
//   1. **The father serving with Houston.** The student starred him in October. On the morning the family is told to leave, the
//      "!" is on the mother's row, not his; pressing it opens her card at the order, and "Leave for the east" is taken from her.
//      Then Santa Anna's dragoons come up with the family on the road, the father on auto in the camp: the "!" and "¡Alto!" are on
//      the mother, and her "run" is taken - the family is not caught by a question nobody could answer.
//   2. **A family of children.** Everybody of ten or more taken: the "!" is on the nine-year-old, the oldest, whose card says he
//      answers for the family; he gives the order to leave, and on the road he answers "¡Alto!".
//   3. **Very sick.** A girl of twelve very sick at home: her "!" opens her card at who can nurse her, and pressing one sends them
//      to it (design audit S34) - not at her own work, all of which is refused to somebody too sick to get up.
//
// Nothing on the page scrolls sideways and no page error is thrown. Same computer only: headless Chrome. Run: npm run test:acting
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { spring, SPRING_SEED } from '../tests/support/scrape-spring.mjs';
import { sceneFor } from '../tests/support/scrape-scene.mjs';
import { taught } from '../tests/support/settled.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];

/** Wait as a page waits, and fail in words a check can be recognised by. */
async function until(page, message, fn, arg, options) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.name + error.message)) throw new assert.AssertionError({ message }); throw error; }
}
const serve = (world, man) => {
  const siteId = houstonCamp(world), site = world.map.sites[siteId];
  Object.assign(man, { travel: null, chore: null, task: 'rest', service: { kind: 'houston', status: 'serving', since: world.minute, siteId }, location: { x: site.x, y: site.y, siteId } });
};

// The class's own world as the server holds it: the scenes below are put into it between two ticks, as the tests put them.
let live = null;
/** The spring class at the start of its third period, the first family's house site chosen, its guided start behind it. */
function inTheSpring(prepare) {
  return () => {
    const world = live = taught(spring());
    const household = world.households['hh-1'];
    if (household.choosingSite) { const mark = world.map.sites[household.homeSiteId]; chooseSite(world, household, { x: mark.x, y: mark.y }); }
    household.resources = { ...household.resources, food: 40 };
    prepare(world, household);
    world.status = 'lobby';
    return world;
  };
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
mkdirSync('docs/evidence', { recursive: true });

async function run({ tag, prepare, prove }) {
  const app = createClassroom({ seed: SPRING_SEED, playerCount: 8, tickMs: 1500, worldFactory: inTheSpring(prepare) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const world = () => live;
  const household = () => world().households['hh-1'];
  const shot = async (page, name) => { const path = `docs/evidence/acting-${tag}-${name}.png`; await page.screenshot({ path }); shots.push(path); };
  const noSideways = async (page, where) => { const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over <= 1, `${where}: the page scrolls sideways by ${over}px`); };
  try {
    const student = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    student.on('pageerror', error => errors.push(`${tag} student: ${error.message}`));
    await student.goto(url);
    await student.locator('[name=name]').fill('Family reader');
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(student);
    for (let i = 2; i <= 8; i++) {
      const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
      assert.equal(response.status, 200);
    }
    const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    host.on('pageerror', error => errors.push(`${tag} host: ${error.message}`));
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
    await host.getByRole('button', { name: 'Start' }).click();
    await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
    if (await student.locator('#tutorial-skip').isVisible().catch(() => false)) await student.locator('#tutorial-skip').click();
    await prove({ app, student, world, household, shot, noSideways });
  } finally {
    await app.close?.();
  }
}

/** Presses the "!" on this person's row and waits for their card to open at the family's decision. */
async function openFlight(student, id) {
  await student.locator(`[data-attention="${id}"]`).click({ force: true });
  await student.locator('#selection-flight').waitFor({ state: 'visible', timeout: 10000 });
}

try {
  // ------------------------------------------------------------------------------------------ 1. the father serving
  await run({
    tag: 'serving',
    prepare: (world, household) => {
      const father = world.entities[household.principalId];
      serve(world, father);
      household.mainId = father.id;
    },
    prove: async ({ app, student, world, household, shot, noSideways }) => {
      app.setPace(8000);
      const father = world().entities[household().principalId];
      const mother = household().members.map(id => world().entities[id]).find(one => one.kin?.role === 'mother');
      await until(student, 'the family was never told to leave', () => window.__snapshot?.world.flight?.status === 'ordered', null, { timeout: 60000 });
      await until(student, 'no "!" on the mother\'s row for the order to leave', id => { const mark = document.querySelector(`[data-attention="${id}"]`); return mark && !mark.hidden; }, mother.id, { timeout: 20000 });
      const onFather = await student.evaluate(id => { const mark = document.querySelector(`[data-attention="${id}"]`); return Boolean(mark && !mark.hidden && /leave/i.test(mark.title || mark.getAttribute('aria-label') || '')); }, father.id);
      assert.equal(onFather, false, 'the "!" for the order is on the father, who is with the army');
      observed.servingShown = await student.evaluate(() => ({ mainId: window.__snapshot.world.household.mainId ?? window.__snapshot.world.household.principalId, actingId: window.__snapshot.world.household.actingId }));
      assert.equal(observed.servingShown.actingId, mother.id);
      await openFlight(student, mother.id);
      await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 10000 });
      assert.equal(await student.locator('#selection-name').textContent(), mother.name, 'the card that opened is not the mother\'s');
      await shot(student, 'order-on-mother');
      await noSideways(student, 'the order on the mother\'s card');
      ok(`serving: ${father.name} is with Houston's army; the order to leave is a "!" on ${mother.name}'s row, and opens her card`);
      await student.locator('#selection-flight [data-action="flee"]').click();
      // The Leave button asks to be pressed twice (the page's confirm), as a student does.
      if (household().flight.status === 'ordered') await student.locator('#selection-flight [data-action="flee"]').click().catch(() => {});
      await until(student, 'the family did not leave on the mother\'s word', () => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 20000 });
      assert.notEqual(father.travel?.purpose, 'flee', 'the father with the army was put on the family\'s road');
      ok(`serving: ${mother.name} gave the order and the family left; ${father.name} stayed with the army`);

      // The dragoons, the father on auto in the camp.
      app.setPace(10000);
      sceneFor(world(), { kind: 'cavalry', how: 'wagon', ahead: 1.2 });
      household().mainId = father.id;
      father.auto = true;
      app.setPace(1500);
      await until(student, 'the dragoons never called on the family to halt', () => window.__snapshot?.world.flight?.ask?.id === 'alto' || ['caught', 'escaped'].includes(window.__snapshot?.world.flight?.chase?.phase), null, { timeout: 60000 });
      assert.equal(household().flight.ask?.id, 'alto', `the family was ${household().flight.chase?.phase} without being asked`);
      app.setPace(10000);
      await openFlight(student, mother.id);
      await student.locator('#selection-flight [data-option="run"]').waitFor({ state: 'visible', timeout: 10000 });
      assert.match(await student.locator('#selection-flight').textContent(), /¡Alto!/);
      await shot(student, 'alto-on-mother');
      await noSideways(student, '"¡Alto!" on the mother\'s card');
      await student.locator('#selection-flight [data-option="run"]').click();
      await until(student, 'the mother\'s "run" was not taken', () => window.__snapshot?.world.flight?.chase?.answer === 'run' || window.__snapshot?.world.flight?.pursued?.length, null, { timeout: 20000 });
      observed.servingRun = { answer: household().flight.chase?.answer || null, lapsed: world().events.filter(event => event.householdId === 'hh-1' && event.lapsed && /soldiers/.test(event.text)).length };
      assert.equal(observed.servingRun.lapsed, 0, 'the soldiers\' question lapsed');
      app.setPace(1500);
      ok(`serving: "¡Alto!" was on ${mother.name}'s card with ${father.name} on auto in the camp, and she answered "run" - no lapse, no capture unasked`);
    },
  });

  // ------------------------------------------------------------------------------------------ 2. a family of children
  await run({
    tag: 'children',
    prepare: (world, household) => {
      for (const one of household.members.map(id => world.entities[id])) if (one.age >= 10) one.health = { condition: 'captured' };
    },
    prove: async ({ app, student, world, household, shot, noSideways }) => {
      app.setPace(8000);
      const oldest = household().members.map(id => world().entities[id]).filter(one => one.health.condition !== 'captured').sort((a, b) => b.age - a.age)[0];
      assert.ok(oldest.age >= 7 && oldest.age < 10, `the oldest left is ${oldest.age}`);
      await until(student, 'the family was never told to leave', () => window.__snapshot?.world.flight?.status === 'ordered', null, { timeout: 60000 });
      await until(student, 'no "!" on the oldest child\'s row', id => { const mark = document.querySelector(`[data-attention="${id}"]`); return mark && !mark.hidden; }, oldest.id, { timeout: 20000 });
      await openFlight(student, oldest.id);
      await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 10000 });
      const card = await student.locator('#selection-flight').textContent();
      assert.match(card, /oldest with the family, with nobody grown here, and answers for it/, 'the card does not say the child answers for the family');
      await shot(student, 'order-on-child');
      await noSideways(student, 'the order on the child\'s card');
      ok(`children: everybody of ten or more taken, the order is a "!" on ${oldest.name}, ${oldest.age}, whose card says the oldest answers for the family`);
      await student.locator('#selection-flight [data-action="flee"]').click();
      if (household().flight.status === 'ordered') await student.locator('#selection-flight [data-action="flee"]').click().catch(() => {});
      await until(student, 'the children did not leave on the oldest one\'s word', () => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 20000 });
      ok(`children: ${oldest.name} gave the order to leave, and the children set out`);

      app.setPace(10000);
      sceneFor(world(), { kind: 'cavalry', how: 'wagon', ahead: 1.2 });
      app.setPace(1500);
      await until(student, 'the dragoons never called on the children to halt', () => window.__snapshot?.world.flight?.ask?.id === 'alto' || ['caught', 'escaped'].includes(window.__snapshot?.world.flight?.chase?.phase), null, { timeout: 60000 });
      assert.equal(household().flight.ask?.id, 'alto', `the children were ${household().flight.chase?.phase} without being asked`);
      app.setPace(10000);
      await openFlight(student, oldest.id);
      await student.locator('#selection-flight [data-option="halt"]').waitFor({ state: 'visible', timeout: 10000 });
      await shot(student, 'alto-on-child');
      await noSideways(student, '"¡Alto!" on the child\'s card');
      await student.locator('#selection-flight [data-option="halt"]').click();
      await until(student, 'the oldest child\'s answer was not taken', () => !window.__snapshot?.world.flight?.ask || window.__snapshot.world.flight.ask.id !== 'alto', null, { timeout: 20000 });
      observed.childrenHalt = { answer: household().flight.chase?.answer || household().flight.pursued?.at(-1)?.outcome || null };
      app.setPace(1500);
      ok(`children: "¡Alto!" was on ${oldest.name}'s card, and his "halt" was taken`);
    },
  });
  // ------------------------------------------------------------------------------------------ 3. very sick, and who nurses
  await run({
    tag: 'nurse',
    prepare: (world, household) => {
      const sick = household.members.map(id => world.entities[id]).find(one => one.age === 12);
      sick.health = { condition: 'sick', disease: 'measles', recoversAt: world.minute + 7 * 1440, grave: true, graveDay: Math.floor(world.minute / 1440) };
    },
    prove: async ({ app, student, world, household, shot, noSideways }) => {
      app.setPace(8000);
      const sick = household().members.map(id => world().entities[id]).find(one => one.age === 12);
      await until(student, 'no "!" on the very sick girl\'s row', id => { const mark = document.querySelector(`[data-attention="${id}"]`); return mark && !mark.hidden; }, sick.id, { timeout: 30000 });
      await student.locator(`[data-attention="${sick.id}"]`).click({ force: true });
      await student.locator('#selection-nurse [data-chore]').first().waitFor({ state: 'visible', timeout: 10000 });
      const card = await student.locator('#selection-nurse').textContent();
      assert.match(card, /too sick to get up\. Somebody of the family can nurse them/);
      const nurseId = await student.locator('#selection-nurse [data-chore]').first().getAttribute('data-entity-id');
      await shot(student, 'nurse-card');
      await noSideways(student, 'the nursing card');
      await student.locator('#selection-nurse [data-chore]').first().click();
      await until(student, 'the nurse was not sent', id => ['nurse-home', 'tend-sick'].includes(window.__snapshot?.world.entities.find(one => one.id === id)?.chore?.id), nurseId, { timeout: 20000 });
      observed.nurse = { sick: sick.name, nurse: world().entities[nurseId].name, chore: world().entities[nurseId].chore?.id };
      ok(`nurse: ${sick.name}'s "!" opened a card offering nursing; ${observed.nurse.nurse} was sent to nurse her (${observed.nurse.chore})`);
    },
  });
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
writeFileSync('docs/evidence/acting-browser.json', `${JSON.stringify({ record: 'acting-browser', date: new Date().toISOString().slice(0, 10), environment: 'Same computer: a local classroom server and headless Chrome at 1366x768.', pass, observed, shots }, null, 2)}\n`);
console.log(`\n${pass.length} checks passed. Wrote docs/evidence/acting-browser.json`);
process.exit(0);
