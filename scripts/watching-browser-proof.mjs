// A student with no family left to play follows another family and watches it, in the browser (owner, 2026-09-29, "Follow and
// watch"; sim/watching.mjs, docs/FAMILY_PANEL.md §20a).
//
// tests/watching.test.mjs proves the rules. This proves what the student sees, at 1366x768 and 1024x768:
//
//   1. **Gone.** Everybody of the student's family dies between two ticks. The page says so in a plain line in the status column,
//      naming the family it now follows; the column is that family's people; no "!", no bar of icons, no Auto, no star; a portrait
//      still opens the person's card, which offers nothing to do; the names cannot be typed in; an order sent anyway is refused in
//      the server's words; no tip is put up; nothing of the Host's is on the page.
//   2. **Taken in.** Everybody of seven or more of the family taken, the little ones are taken in by a neighbour family: the page
//      follows that family, the little ones are on its map, and when a grown son comes for them the page is the family's own again.
//
// Nothing on the page scrolls sideways and no page error is thrown. Same computer only: headless Chrome. Run: npm run test:watching
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { spring, SPRING_SEED } from '../tests/support/scrape-spring.mjs';
import { taught } from '../tests/support/settled.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];

async function until(page, message, fn, arg, options) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.name + error.message)) throw new assert.AssertionError({ message }); throw error; }
}

let live = null;
function inTheSpring(prepare) {
  return () => {
    const world = live = taught(spring());
    const household = world.households['hh-1'];
    if (household.choosingSite) { const mark = world.map.sites[household.homeSiteId]; chooseSite(world, household, { x: mark.x, y: mark.y }); }
    household.resources = { ...household.resources, food: 40 };
    prepare?.(world, household);
    world.status = 'lobby';
    return world;
  };
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
mkdirSync('docs/evidence', { recursive: true });

async function run({ tag, prepare, prove, viewport = { width: 1366, height: 768 } }) {
  const app = createClassroom({ seed: SPRING_SEED, playerCount: 8, tickMs: 1500, worldFactory: inTheSpring(prepare) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const world = () => live;
  const household = () => world().households['hh-1'];
  const shot = async (page, name) => { const path = `docs/evidence/watching-${tag}-${name}.png`; await page.screenshot({ path }); shots.push(path); };
  const noSideways = async (page, where) => { const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over <= 1, `${where}: the page scrolls sideways by ${over}px`); };
  try {
    const student = await (await browser.newContext({ viewport })).newPage();
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

/** What the page shows of watching, read in the page. */
const readPage = page => page.evaluate(() => {
  const visible = selector => [...document.querySelectorAll(selector)].filter(node => node.offsetParent !== null || getComputedStyle(node).position === 'fixed' && getComputedStyle(node).display !== 'none' && node.getClientRects().length);
  const world = window.__snapshot?.world;
  return {
    watching: world?.watching || null,
    householdId: world?.householdId,
    line: document.querySelector('#watching')?.hidden ? null : document.querySelector('#watching')?.textContent,
    body: document.body.dataset.watching,
    rows: [...document.querySelectorAll('#family-rows .panel-row')].map(row => row.dataset.entityId),
    attention: visible('.panel-attention').length,
    icons: visible('.panel-icons .panel-icon, .panel-icons button').length,
    auto: visible('.panel-auto').length,
    star: visible('.panel-focus').length,
    readOnly: [...document.querySelectorAll('#family-rows .panel-name')].every(input => input.readOnly),
    tip: !document.querySelector('#tip')?.hidden,
    hostKeys: ['overview', 'live', 'chases'].filter(key => world && key in world),
    panelLabel: document.querySelector('#family-panel')?.getAttribute('aria-label'),
    // The watched family's own choosers and popups (its house site, its survey), which are theirs and not this student's.
    popups: ['#site-choose', '#survey-choose', '#house-plan', '#house-plot', '#errand', '#going', '#wagon-load', '#call-menu', '#encounter']
      .filter(selector => { const node = document.querySelector(selector); return node && !node.hidden && getComputedStyle(node).display !== 'none'; }),
  };
});

try {
  // ------------------------------------------------------------------------------------------ 1. gone
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }]) {
    const tag = `gone-${viewport.width}`;
    await run({
      tag, viewport,
      prove: async ({ app, student, world, household, shot, noSideways }) => {
        app.setPace(4000);
        await until(student, 'the family\'s own rows never came', () => document.querySelectorAll('#family-rows .panel-row').length > 0, null, { timeout: 30000 });
        const before = await readPage(student);
        assert.equal(before.body, 'false');
        assert.ok(before.line === null, 'the watching line is up over a family with people in it');
        // Everybody of the family dies between two ticks.
        for (const id of household().members) if (world().entities[id].kind === 'person') world().entities[id].health = { condition: 'dead' };
        await until(student, 'the page never said the family is gone', () => Boolean(window.__snapshot?.world.watching) && !document.querySelector('#watching').hidden, null, { timeout: 30000 });
        await until(student, 'the column is not the followed family\'s', () => { const of = window.__snapshot.world.watching.of; const rows = [...document.querySelectorAll('#family-rows .panel-row')]; return rows.length && rows.every(row => window.__snapshot.world.entities.find(one => one.id === row.dataset.entityId)?.householdId === of); }, null, { timeout: 20000 });
        const seen = await readPage(student);
        observed[tag] = seen;
        assert.match(seen.line, /^Everybody of .* has died\. You are following .*, your nearest neighbours, and watching what becomes of them\. You cannot give orders\.$/);
        assert.ok(seen.line.includes(seen.watching.ofName), 'the line does not name the family followed');
        assert.equal(seen.householdId, 'hh-1', 'the page took the watched family for its own');
        assert.equal(seen.body, 'true');
        assert.equal(seen.attention, 0, 'a "!" is on a watching page');
        assert.equal(seen.icons, 0, 'a bar of work is on a watching page');
        assert.equal(seen.auto, 0, 'an Auto switch is on a watching page');
        assert.equal(seen.star, 0, 'a star is on a watching page');
        assert.ok(seen.readOnly, 'another family\'s names can be typed in');
        assert.equal(seen.tip, false, 'a tip was put up on a watching page');
        // And not by the page's own once-a-second look for a tip either (found by this proof: the render hid it, the second put it back).
        await student.waitForTimeout(2500);
        assert.equal(await student.evaluate(() => !document.querySelector('#tip').hidden), false, 'a tip was put up on a watching page between two snapshots');
        assert.deepEqual(seen.hostKeys, [], 'the Host\'s knowledge reached the student');
        assert.deepEqual(seen.popups, [], `the watched family's own chooser is up on this page: ${seen.popups.join(', ')}`);
        assert.match(seen.panelLabel, /whom you are watching/);
        await shot(student, 'line');
        await noSideways(student, 'the watching page');
        ok(`${tag}: everybody died; the page says so and follows ${seen.watching.ofName}, whose people are the column - no "!", no bar, no Auto, no star, no tip, nothing of the Host's`);
        // A portrait opens the card, which offers nothing.
        const first = seen.rows[0];
        await student.locator(`[data-portrait="${first}"]`).click();
        await student.locator('#selection').waitFor({ state: 'visible', timeout: 10000 });
        const card = await student.evaluate(() => ({
          name: document.querySelector('#selection-name')?.textContent,
          buttons: [...document.querySelectorAll('#selection button')].filter(button => button.id !== 'selection-close' && button.getClientRects().length && getComputedStyle(button).visibility !== 'hidden').map(button => button.textContent.trim() || button.dataset.action || button.id),
        }));
        assert.deepEqual(card.buttons, [], `the card offers something to do: ${card.buttons.join(', ')}`);
        await shot(student, 'card');
        await noSideways(student, 'the watched person\'s card');
        ok(`${tag}: ${card.name}'s card opens from the portrait and offers nothing to do`);
        // An order sent anyway is refused in the server's words.
        const refused = await student.evaluate(async id => {
          const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `watch-${Date.now()}`, action: 'chore', entityId: id, chore: 'rest' }) });
          return { status: response.status, body: await response.json().catch(() => null) };
        }, first);
        assert.ok(refused.status >= 400, 'an order from a watching page was taken');
        assert.match(JSON.stringify(refused.body), /Nobody of your family is left to give an order to/);
        observed[`${tag}-refused`] = refused;
        ok(`${tag}: an order sent anyway is refused: "${refused.body?.error}"`);
      },
    });
  }

  // ------------------------------------------------------------------------------------------ 2. taken in
  await run({
    tag: 'taken-in',
    prepare: (world, household) => {
      const people = household.members.map(id => world.entities[id]).filter(one => one.kind === 'person');
      // Everybody of seven or more taken; the youngest kept, and made small if the family has nobody under seven.
      const youngest = [...people].sort((a, b) => a.age - b.age)[0];
      if (youngest.age >= 7) youngest.age = 5;
      for (const one of people) if (one !== youngest && one.age >= 7) one.health = { condition: 'captured' };
    },
    prove: async ({ app, student, world, household, shot, noSideways }) => {
      app.setPace(4000);
      await until(student, 'the little ones were never taken in', () => window.__snapshot?.world.watching?.why === 'taken-in', null, { timeout: 30000 });
      await until(student, 'the column is not the family that took them in', () => { const of = window.__snapshot.world.watching.of; const rows = [...document.querySelectorAll('#family-rows .panel-row')]; return rows.length && rows.every(row => window.__snapshot.world.entities.find(one => one.id === row.dataset.entityId)?.householdId === of); }, null, { timeout: 20000 });
      const seen = await readPage(student);
      observed.takenIn = seen;
      assert.match(seen.line, /took them in\. You are watching .*, who have them now\. You cannot give orders until somebody grown of your family comes for them\.$/);
      const ours = household().takenIn.ids;
      const onMap = await student.evaluate(ids => ids.every(id => (window.__snapshot.world.others || []).some(one => one.id === id)), ours);
      assert.ok(onMap, 'the little ones are not on the page of the family that took them in');
      assert.equal(seen.attention + seen.icons + seen.auto + seen.star, 0, 'something to press is on the watching page');
      await shot(student, 'line');
      await noSideways(student, 'the taken-in page');
      ok(`taken-in: the little ones were taken in by ${seen.watching.ofName}; the page follows that family and they are on its map`);
      // A grown son comes for them: the family is its own again.
      // Somebody grown (ten or more, `tooYoung`), put where the little ones stand - between two of the neighbours' journeys.
      const son = household().members.map(id => world().entities[id]).filter(one => one.kind === 'person' && one.health.condition === 'captured' && one.age >= 10).sort((a, b) => a.age - b.age)[0];
      assert.ok(son, 'nobody grown of the family to come for the little ones');
      const anchor = world().entities[ours[0]];
      for (let wait = 0; wait < 120 && anchor.travel; wait++) await new Promise(done => setTimeout(done, 500));
      assert.ok(!anchor.travel, 'the little ones never stopped on the road with the neighbours');
      observed.fetchedAt = anchor.location.siteId;
      Object.assign(son, { health: { condition: 'well' }, travel: null, chore: null, task: 'rest', location: { ...anchor.location } });
      delete son.service;
      await until(student, 'the page did not come back to the family when a grown son came for the little ones', () => !window.__snapshot?.world.watching && document.querySelector('#watching').hidden && document.body.dataset.watching === 'false', null, { timeout: 30000 });
      await until(student, 'the family\'s own rows did not come back', () => [...document.querySelectorAll('#family-rows .panel-row')].some(row => window.__snapshot.world.entities.find(one => one.id === row.dataset.entityId)?.householdId === 'hh-1'), null, { timeout: 20000 });
      await shot(student, 'fetched');
      ok(`taken-in: ${son.name} came for the little ones, and the page is the family's own again`);
    },
  });
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
writeFileSync('docs/evidence/watching-browser.json', `${JSON.stringify({ record: 'watching-browser', date: new Date().toISOString().slice(0, 10), environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768.', pass, observed, shots }, null, 2)}\n`);
console.log(`\n${pass.length} checks passed. Wrote docs/evidence/watching-browser.json`);
process.exit(0);
