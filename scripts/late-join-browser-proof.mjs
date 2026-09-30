// A student who joins a class that is already running, walked through the die in a real browser (classroom, 2026-09-30:
// "student tried to join late and it was stuck on the rolling for the family part. wouldn't let him past.").
//
// What the classroom met, and v2026.09.29.3 and integration-2026-09-28 both did: a class started at the Study pace, a latecomer
// given a family still on its road in - untouched, so its die was offered - and the family's own arrival on its land, a tick or a
// few later, closing the die (sim/family.mjs `rollRefusal`). Every Roll after that was refused, the refusal was written to a line
// behind the curtain, and the page, which fetches the family once, went on offering the die. The fix throws the die in the join
// (server/app.mjs `/api/join`, `rolledAtJoin`) and the page throws it on that number; a refused or unanswered throw is said on
// the card and the family asked for again (public/app.js `ROLL_WAIT_MS`, `refreshFamily`).
//
//   A. The classroom's case on the classroom's own world (thirty families on the colonies, starts dealt, the Study pace): join
//      while the family is on the road, wait on the die until the family has arrived, press Roll, and reach the last name.
//   B. The same while the teacher has the class paused, before the first tick: the die still lands.
//   C. A latecomer whose family has already begun (the director has worked it): straight into the world, no die, no hang.
//   D. A class with no family left: the join form says so, and what to do.
//   E. A throw the class never answers, and one it refuses: said on the card, in bounded time, and never a die left spinning.
//
// Same computer only, headless Chrome at the Chromebook's 1366x768. No Chromebook, LAN or classroom claim.
// Run: npm run test:late-join
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom, PACES } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const CHROMEBOOK = { width: 1366, height: 768 };
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const opened = [];

async function classroom(options) {
  const app = createClassroom({ seed: 'late-join-proof', ...options });
  opened.push(app);
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const host = await browser.newContext();
  assert.equal((await host.request.post(`${url}/api/host`, { data: { key: app.state.hostKey } })).status(), 200);
  const command = async (action, extra = {}) => {
    const res = await host.request.post(`${url}/api/command`, { data: { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra } });
    assert.equal(res.status(), 200, `${action}: ${await res.text()}`);
  };
  const early = async count => {
    for (let i = 0; i < count; i++) {
      const student = await browser.newContext();
      assert.equal((await student.request.post(`${url}/api/join`, { data: { name: `Early ${i}`, code: app.state.sessionCode } })).status(), 200);
    }
  };
  return { app, url, command, early };
}
/** A student's page at the Chromebook's size, joined through the form as a student does. */
async function joinPage({ app, url }, name) {
  const context = await browser.newContext({ viewport: CHROMEBOOK });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill(name);
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  return page;
}
const arrived = (app, householdId) => app.state.world.events.some(event => event.householdId === householdId && event.type === 'arrival');
const onCard = page => page.evaluate(() => ({ step: document.querySelector('#creation')?.dataset.step, curtain: !document.querySelector('#creation')?.hidden,
  die: !document.querySelector('#family-roll')?.hidden, button: document.querySelector('#roll-family')?.textContent, result: document.querySelector('#family-roll-result')?.textContent }));

/** Press Roll, see the die land on the server's number, meet the family, and reach the last name. */
async function throwAndMeet(page, app, householdId, label) {
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 })
    .catch(async () => { throw new Error(`${label}: the die never landed - ${JSON.stringify(await onCard(page))}`); });
  const shown = Number(await page.locator('#family-die').innerText());
  const roll = app.state.world.households[householdId].roll;
  assert.equal(shown, roll, `${label}: the die shows ${shown}, the server rolled ${roll}`);
  const result = (await page.locator('#family-roll-result').innerText()).trim();
  assert.match(result, /^You rolled an? \d+ for your family/, `${label}: the result line is not the throw's`);
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  return { roll, result };
}

try {
  mkdirSync('docs/evidence', { recursive: true });

  // ------------------------------------------------------------------ A. the classroom's case
  {
    const one = await classroom({ playerCount: 30, tickMs: PACES.study,
      worldFactory: (seed, n) => createGonzalesWorld(seed, n, { map: 'colonies', neighbours: true, starts: true }) });
    await one.early(3);
    await one.command('start', { anyway: true });
    const page = await joinPage(one, 'Late student');
    await page.waitForFunction(() => window.__snapshot?.world.householdId, null, { timeout: 60000 });
    const householdId = await page.evaluate(() => window.__snapshot.world.householdId);
    assert.equal(arrived(one.app, householdId), false, 'A: the family had already arrived at the join - this is not the classroom case');
    await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 60000 });
    await page.locator('#creation-begin-button').click();
    await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 15000 });
    // The student looks at the die while the class goes on, and the family reaches its land - the moment that closed the die.
    const since = Date.now();
    while (!arrived(one.app, householdId) && Date.now() - since < 90000) await page.waitForTimeout(500);
    assert.equal(arrived(one.app, householdId), true, 'A: the family never arrived, so the classroom\'s moment was not reached');
    observed.a = { householdId, waitedOnDieMs: Date.now() - since, card: await onCard(page) };
    assert.equal(observed.a.card.die, true, 'A: the die is not up after the arrival');
    const thrown = await throwAndMeet(page, one.app, householdId, 'A');
    Object.assign(observed.a, thrown);
    await page.screenshot({ path: 'docs/evidence/late-join-surname.png' });
    shots.push('docs/evidence/late-join-surname.png');
    ok(`A: a latecomer at the Study pace waited ${(observed.a.waitedOnDieMs / 1000).toFixed(0)} s on the die while the family arrived, threw it (${thrown.result}) and reached the last name`);
    await page.locator('#surname-input').fill('Latimer');
    await page.locator('#surname-save').click();
    await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });
    assert.equal(one.app.state.world.households[householdId].surname, 'Latimer');
    assert.equal((await onCard(page)).die, false, 'A: the die came back after the family was met');
    ok('A: the last name is taken, and the die is not offered again');
  }

  // ------------------------------------------------------------------ B. paused before the first tick
  {
    const two = await classroom({ playerCount: 8, tickMs: 10000, worldFactory: createGonzalesWorld });
    await two.early(5);
    await two.command('start');
    await two.command('pause');
    const page = await joinPage(two, 'Paused latecomer');
    await page.waitForFunction(() => window.__snapshot?.world.householdId, null, { timeout: 30000 });
    const householdId = await page.evaluate(() => window.__snapshot.world.householdId);
    await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#creation-begin-button').click();
    await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 15000 });
    observed.b = await throwAndMeet(page, two.app, householdId, 'B');
    assert.equal(two.app.state.world.status, 'paused');
    ok(`B: with the class paused the die still lands (${observed.b.result}) and the last name follows`);

    // ---------------------------------------------------------------- D. no family left
    // Eight families: five joined before Start and one just now. Two more take the last of them, through the door as anybody does.
    for (const name of ['Seventh', 'Eighth']) {
      const student = await browser.newContext();
      assert.equal((await student.request.post(`${two.url}/api/join`, { data: { name, code: two.app.state.sessionCode } })).status(), 200);
    }
    const refused = await joinPage(two, 'Ninth');
    await refused.waitForFunction(() => /Every family in this class already has a student/.test(document.querySelector('#join-error')?.textContent || ''), null, { timeout: 15000 });
    observed.d = (await refused.locator('#join-error').innerText()).trim();
    assert.equal(await refused.locator('#join-error').isVisible(), true, 'D: the refusal is not on the screen');
    assert.match(observed.d, /Ask your teacher/, 'D: the refusal does not say what to do');
    ok(`D: a class with no family left says so on the join form, with what to do: "${observed.d}"`);
  }

  // ------------------------------------------------------------------ C. a family that has already begun
  {
    const three = await classroom({ playerCount: 8, tickMs: 40, worldFactory: createGonzalesWorld });
    await three.early(5);
    await three.command('start');
    const since = Date.now();
    while (!['hh-6', 'hh-7', 'hh-8'].every(id => arrived(three.app, id)) && Date.now() - since < 30000) await new Promise(done => setTimeout(done, 100));
    await three.command('pause');
    const page = await joinPage(three, 'Day two latecomer');
    await page.waitForFunction(() => window.__snapshot?.world.householdId, null, { timeout: 30000 });
    const householdId = await page.evaluate(() => window.__snapshot.world.householdId);
    await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#creation-begin-button').click();
    await page.waitForFunction(() => document.querySelector('#creation')?.hidden, null, { timeout: 15000 })
      .catch(async () => { throw new Error(`C: the page never let the student into the world - ${JSON.stringify(await onCard(page))}`); });
    observed.c = { householdId, roll: three.app.state.world.households[householdId].roll ?? null, card: await onCard(page) };
    assert.equal(observed.c.roll, null, 'C: a family that had begun was rolled');
    assert.equal(observed.c.card.die, false);
    ok(`C: a latecomer whose family had begun (${householdId}) goes straight into the world with the family it has - no die, no hang`);
  }

  // ------------------------------------------------------------------ E. a throw never answered, and one refused
  {
    const four = await classroom({ playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
    const page = await joinPage(four, 'Lobby student');
    await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#creation-begin-button').click();
    await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 15000 });
    // The throw goes out and nothing ever comes back.
    const held = [];
    await page.route('**/api/command', route => { held.push(route); /* never answered */ });
    const pressed = Date.now();
    await page.locator('#roll-family').click();
    await page.waitForFunction(() => /did not come back/.test(document.querySelector('#family-roll-result')?.textContent || '') && !document.querySelector('#roll-family')?.disabled, null, { timeout: 20000 })
      .catch(async () => { throw new Error(`E: an unanswered throw left the die spinning - ${JSON.stringify(await onCard(page))}`); });
    observed.e = { unansweredGivenUpAfterMs: Date.now() - pressed, card: await onCard(page) };
    assert.ok(observed.e.unansweredGivenUpAfterMs < 16000, `E: the die spun ${observed.e.unansweredGivenUpAfterMs} ms`);
    ok(`E: an unanswered throw is given up after ${(observed.e.unansweredGivenUpAfterMs / 1000).toFixed(1)} s and said on the card: "${observed.e.card.result}"`);
    // The lost throw never reaches the class (let go, it would, and the page would rightly go on to the family it made).
    for (const route of held) await route.abort('connectionreset');
    await page.unroute('**/api/command');
    await page.waitForTimeout(500);
    assert.equal((await onCard(page)).die, true, 'E: the die went away after a throw that never reached the class');
    await page.route('**/api/command', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Wait until the class is running.' }) }));
    await page.locator('#roll-family').click();
    await page.waitForFunction(() => document.querySelector('#family-roll-result')?.textContent === 'Wait until the class is running.', null, { timeout: 10000 });
    assert.equal(await page.locator('#family-roll-result').isVisible(), true, 'E: the refusal is not on the card');
    observed.e.refused = await onCard(page);
    ok('E: a refused throw is said on the die\'s own card, not on a line behind the curtain');
    await page.unroute('**/api/command');
    // And the real throw still works afterwards.
    const householdId = await page.evaluate(() => window.__snapshot.world.householdId);
    observed.e.after = await throwAndMeet(page, four.app, householdId, 'E');
    ok(`E: after both, the real throw lands (${observed.e.after.result})`);
  }

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/late-join-browser.json', `${JSON.stringify({
    record: 'A student who joins a running class, through the die, in a real browser (classroom report 2026-09-30)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    viewport: CHROMEBOOK,
    note: 'Same computer, headless Chrome. No Chromebook, LAN or classroom claim. A is the classroom\'s own world and pace.',
    checks: pass,
    observed,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  for (const app of opened) await app.close();
}
