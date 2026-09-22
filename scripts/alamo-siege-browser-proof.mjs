// The siege of the Alamo, in the browser: docs/COLONIES.md §7f, build step 9, and Travis's runner with the real-time decision
// budget (owner, 2026-09-22; docs/ALAMO_FATES.md, docs/MILITARY_EXPERIENCE.md steps 1 and 4).
//
// tests/alamo.test.mjs, tests/alamo-runner.test.mjs and tests/decision-budget.test.mjs prove the rules. This proves what a
// student sees when somebody of theirs is inside: their row has no order and says why; the message card opens the person;
// on the day Travis wants riders a man of the garrison is seen walking across the compound to them, step by step, and the
// card leads to him; the meeting shows what he says and the two answers; while the Host has paused the class the question's
// budget does not run; after Resume, left unanswered, it runs out and the journal says the choice was made for them; and on
// the next day Travis sends riders he comes again (unless the fallback's offer was chosen and the man has ridden out), and
// the answer given in the meeting is the one the server takes. The layout is checked at a Chromebook's 1366 by 768.
//
// The class is a real one on the colonies map with rolled families, played in process through the first period, continued
// into the winter, with hh-1's father set in the garrison at Béxar in process (said so in the record), run to just after
// the Mexican army arrives on February 23, and then stood at the far end of the compound's plaza so the runner's walk takes
// several ticks. The decision budget is 15 seconds instead of 90, so the proof does not wait a minute and a half.
//
// Same computer only: headless Chrome. Desktop and Chromebook sizes; phones are not supported. Run: npm run test:alamo-siege
import assert from 'node:assert/strict';
import { meetFamily } from './support/meet-family.mjs';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { RUNNER_FEET_PER_TICK, onMap } from '../sim/alamo-runner.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const BUDGET_MS = 15_000;
const feet = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * 5280;

function besieged(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world);
  world.status = 'running';
  const household = world.households['hh-1'];
  const father = household.members.map(id => world.entities[id]).find(person => person.kin?.role === 'father') || world.entities[household.members[0]];
  for (let i = 0; i < 400 && !world.director.milestones['winter-news']; i++) stepWorld(world);
  const site = world.map.sites.bexar;
  Object.assign(father, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' }, service: { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' } });
  for (let i = 0; i < 2000 && !world.director.milestones['alamo-siege']; i++) stepWorld(world);
  // The far end of the compound's plaza, so the runner's walk from Travis's door is seen for several ticks.
  father.location = onMap(world, { x: 180, y: 420 });
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'alamo-siege-proof', playerCount: 5, tickMs: 5000, decisionBudgetMs: BUDGET_MS, worldFactory: besieged });
const father = Object.values(app.state.world.entities).find(person => person.householdId === 'hh-1' && person.service?.besieged);
assert.ok(father, 'nobody of hh-1 is shut in the Alamo');
assert.equal(app.state.world.director.milestones['courier-1-opens'], undefined, 'the riders were asked for before the browser could watch');
const runnerId = `alamo-runner-${father.id}`;
const server = () => app.state.world;
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Alamo reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(student);
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

  // Shut in: the row has nothing to give them, and says why in place of its icons.
  await student.waitForFunction(() => [...document.querySelectorAll('.panel-reason')].some(one => /shut in the Alamo/.test(one.textContent)), null, { timeout: 30000 });
  observed.row = await student.evaluate(() => [...document.querySelectorAll('.panel-reason')].map(one => one.textContent).find(text => /shut in the Alamo/.test(text)));
  assert.equal(await student.locator(`.panel-icon[data-entity-id="${father.id}"]:not([aria-disabled="true"])`).count(), 0, 'somebody shut in the Alamo has an order they can be given');
  ok(`${father.name}'s row gives no order and says why: "${observed.row}"`);

  // Travis's runner: a man of the garrison seen crossing the compound's plaza, a tick at a time, toward the family's person.
  const sample = () => student.evaluate(([id, personId]) => {
    const world = window.__snapshot?.world;
    const runner = (world?.others || []).find(one => one.id === id);
    const person = (world?.entities || []).find(one => one.id === personId);
    return runner && person ? { tick: world.tick, runner: runner.location, person: person.location, courier: person.service?.courier || null } : null;
  }, [runnerId, father.id]);
  await student.waitForFunction(id => (window.__snapshot?.world.others || []).some(one => one.id === id), runnerId, { timeout: 120000 });
  const walk = [await sample()];
  await student.locator('#military-notice').waitFor({ state: 'visible', timeout: 10000 });
  observed.comingTitle = await student.locator('#military-title').innerText();
  await student.screenshot({ path: 'docs/evidence/alamo-runner-coming.png' });
  while (walk.at(-1).courier === 'coming' && walk.length < 12) {
    const last = walk.at(-1).tick;
    await student.waitForFunction(tick => window.__snapshot?.world.tick > tick, last, { timeout: 20000 });
    walk.push(await sample());
  }
  const gaps = walk.map(step => feet(step.runner, step.person));
  observed.runnerFeetFromPerson = gaps.map(gap => Math.round(gap));
  assert.ok(walk.length >= 3, `the runner was seen in only ${walk.length} snapshots`);
  for (let i = 1; i < walk.length; i++) {
    assert.ok(gaps[i] < gaps[i - 1], 'the runner did not come nearer between two snapshots');
    assert.ok(feet(walk[i].runner, walk[i - 1].runner) <= RUNNER_FEET_PER_TICK * (walk[i].tick - walk[i - 1].tick) + 0.5, 'the runner jumped further than he walks');
  }
  assert.equal(walk.at(-1).courier, 'open', 'the question never opened');
  assert.ok(gaps.at(-1) <= 7, 'the question opened with the runner still across the plaza');
  ok(`the runner is seen walking to ${father.name} across the plaza (${observed.runnerFeetFromPerson.join(' → ')} ft), and the question opens only beside them; the card said "${observed.comingTitle}"`);

  // The card leads to the runner himself: what he said, the two answers, and what happens if nobody answers.
  await student.waitForFunction(() => document.querySelector('#military-title')?.textContent === 'A call for riders at the Alamo', null, { timeout: 15000 });
  await student.locator('#military-go').click();
  await student.locator('#encounter').waitFor({ state: 'visible', timeout: 10000 });
  await student.waitForFunction(() => document.querySelectorAll('#encounter-asks [data-action="alamo-courier"]').length === 2, null, { timeout: 15000 });
  observed.meeting = (await student.locator('#encounter').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(observed.meeting, /Colonel Travis/);
  assert.match(observed.meeting, /leaves the fort tonight/);
  assert.match(observed.meeting, /decided for/, 'the fallback is not said before it happens');
  assert.doesNotMatch(observed.meeting, /killed|die|death|will fall/i, 'the meeting foretells the fall');
  assert.equal(server().entities[father.id].service.courier, 'open', 'looking at the meeting answered it');
  await student.screenshot({ path: 'docs/evidence/alamo-runner-meeting.png' });
  ok(`the message card opens the meeting with the runner: "${observed.meeting.slice(0, 240)}…"`);

  // The Host pauses: the budget does not run while the class stands still, however long. A few seconds of it are spent first,
  // so the pause is seen holding a budget part-used.
  for (let i = 0; i < 30 && !((server().decisionClock?.[`courier:${father.id}`]?.spent ?? 0) > 0); i++) await student.waitForTimeout(500);
  await host.locator('#host-controls [data-action="pause"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 10000 });
  const spentBefore = server().decisionClock?.[`courier:${father.id}`]?.spent ?? 0;
  await student.waitForTimeout(BUDGET_MS + 5000);
  assert.equal(server().entities[father.id].service.courier, 'open', 'the question ran out while the Host had paused the class');
  assert.equal(server().decisionClock?.[`courier:${father.id}`]?.spent ?? 0, spentBefore, 'paused time was counted against the answer');
  ok(`paused for ${(BUDGET_MS + 5000) / 1000} s, longer than the whole budget: the question is still open, ${Math.round(spentBefore / 1000)} s spent before the pause and none during it`);

  // A Chromebook's screen, with the meeting open.
  await student.setViewportSize({ width: 1366, height: 768 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at 1366 by 768 by ${overflow}px`);
  const box = await student.locator('#encounter').boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= 1366 && box.y >= 0 && box.y + box.height <= 768, 'the meeting does not fit a Chromebook screen');
  for (const button of await student.locator('#encounter-asks [data-action="alamo-courier"]').all()) {
    const b = await button.boundingBox();
    assert.ok(b && b.y + b.height <= 768, 'an answer is off the bottom of a Chromebook screen');
  }
  await student.screenshot({ path: 'docs/evidence/alamo-runner-chromebook.png' });
  ok('at a Chromebook\'s 1366 by 768 the meeting and both answers are on the screen, and the page does not scroll sideways');
  await student.setViewportSize({ width: 1440, height: 950 });

  // Resume, and leave it unanswered: the budget runs out, the fallback decides, and the journal says so.
  await host.locator('#host-controls [data-action="resume"]').click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 10000 });
  const resumed = Date.now();
  await student.waitForFunction(id => !['open', 'coming'].includes((window.__snapshot?.world.entities || []).find(one => one.id === id)?.service?.courier), father.id, { timeout: BUDGET_MS + 30000 });
  const tookMs = Date.now() - resumed;
  await student.waitForFunction(() => /Nobody answered for .* in time/.test(document.querySelector('#event-log')?.textContent || ''), null, { timeout: 15000 });
  observed.journal = await student.evaluate(() => [...document.querySelectorAll('#event-log li')].map(li => li.textContent).find(text => /Nobody answered for/.test(text)));
  observed.note = await student.locator('#encounter-note').innerText().catch(() => null);
  const afterFirst = server().entities[father.id].service.courier;
  assert.ok(tookMs >= BUDGET_MS - spentBefore - 6000, `the question ran out ${tookMs} ms after Resume, before its budget`);
  await student.screenshot({ path: 'docs/evidence/alamo-runner-expired.png' });
  ok(`left unanswered, it ran out ${Math.round(tookMs / 1000)} s after Resume and was decided for them (${afterFirst}); the journal says: "${observed.journal}"`);

  // The next day Travis sends riders, the runner comes again - unless the fallback's offer was chosen and the man is gone.
  const sentFirst = () => server().entities[father.id].service.courier === 'sent';
  for (let i = 0; i < 60 && !server().director.milestones['courier-2-opens'] && !sentFirst(); i++) await student.waitForTimeout(1000);
  if (sentFirst()) {
    observed.secondDay = 'the fallback offered and Travis chose him on the first night: he rode out and was not asked again';
    assert.notEqual(server().entities[father.id].service.courier, 'coming');
    ok(observed.secondDay);
  } else {
    await student.waitForFunction(() => /^A call for riders at the Alamo$/.test(document.querySelector('#military-title')?.textContent || ''), null, { timeout: 90000 });
    assert.equal(server().entities[father.id].service.courierDay, 'courier-2', 'the second call was not the next day\'s');
    await student.locator('#military-go').click();
    await student.locator('#encounter').waitFor({ state: 'visible', timeout: 10000 });
    const offer = student.locator('#encounter-asks [data-action="alamo-courier"][data-answer="volunteer"]');
    await offer.waitFor({ state: 'visible', timeout: 15000 });
    await offer.click();
    await student.waitForFunction(id => (window.__snapshot?.world.entities || []).find(one => one.id === id)?.service?.courier !== 'open', father.id, { timeout: 15000 });
    assert.equal(server().entities[father.id].service.courier, 'volunteered', 'the answer given in the meeting was not taken');
    observed.secondDay = `asked again on the next day (${server().entities[father.id].service.courierDay}); offering in the meeting was taken`;
    ok(`the runner came again on the next day Travis sent riders, and offering to ride in the meeting is the answer the server took`);
  }

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/alamo-siege-browser.json', `${JSON.stringify({
    record: 'The siege of the Alamo, in a browser: Travis\'s runner and the real-time decision budget (docs/ALAMO_FATES.md, docs/MILITARY_EXPERIENCE.md steps 1 and 4)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: `Same computer only, headless Chrome, desktop 1440x950 and Chromebook 1366x768. A real class on the colonies map with rolled families, played in process through the first period and into the winter, hh-1's father set in the garrison at Béxar in process, run to just after February 23 and stood at the far end of the compound's plaza; then served live at 5 s a tick with a ${BUDGET_MS / 1000} s decision budget in place of 90. No LAN, Chromebook-device or classroom claim.`,
    checks: pass, observed,
    screenshots: ['docs/evidence/alamo-runner-coming.png', 'docs/evidence/alamo-runner-meeting.png', 'docs/evidence/alamo-runner-chromebook.png', 'docs/evidence/alamo-runner-expired.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
