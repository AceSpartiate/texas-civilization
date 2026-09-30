// The end of the game, watched: docs/MONEY_AND_GLORY.md steps 4 and 5.
//
// tests/ending.test.mjs proves the numbers and that nothing of the ending is on the wire while
// the class runs. This proves what a student and a teacher actually see when it ends: a real
// class on the real land, one family's man in the army and another family with coin in the house,
// run live in the browser to its last tick. Until then neither page shows an ending or a glory.
// This is the end of the first of three class periods, so what comes is interim standings, and since 2026-09-28 (design audit
// B4, VISION §20) they carry no glory at all - **coin and land only**, the owner's choice of the same day: the family sees its
// coin and its land promised; the Host every family's coin and land in household order, nobody named as leading - with no word
// on either page naming a virtue. The final reckoning, glory, story and prisoners and all, is tests/ending.test.mjs's and npm run
// test:whole-game's; the prisoner planted below is kept to show the interim does not tell it.
//
// The class is played in process to the day before it ends, because the march takes about 250
// ticks. The coin is placed in process too, and says so in the record: selling for coin is proved
// in tests/money.test.mjs and tests/ending.test.mjs, and is not what this watches.
//
// Run: npm run test:ending
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { heardOut } from '../tests/support/heard-out.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const VIRTUE = /\b(good|better|best|brave\w*|loyal\w*|patriot\w*|hero\w*|virtu\w*|honou?r\w*|worthy|courag\w*|coward\w*|deserv\w*)\b/i;

/** A class on the real land, played to a few ticks before it ends, hh-1's man marching and hh-2 holding coin. */
function playedToTheEnd(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    // The call is put while the rider who brought the word is still talking with the family, and waits until he has gone (one
    // rider, one visit: sim/encounters.mjs `questionWaits`, FIC-GONZ-909); he is let go as a student's Done does.
    heardOut(world, household.id);
    const request = projectWorld(world, household.id, 'student', { includeMap: false }).request;
    assert.equal(request?.kind, 'call', 'hh-1 was not shown its settlement’s call once its rider had gone');
    const answerers = request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  // Stop a handful of ticks short of the end, so the browser watches the last of them happen.
  const end = momentOf(world, 'bexar-end');
  for (let i = 0; i < 2000 && world.minute + 3 * 720 < end && !world.director.complete; i++) stepWorld(world);
  world.households['hh-2'].resources.money = 5;
  // One of hh-1's people at home taken prisoner, placed in process as the coin is (owner, 2026-09-27: the ending names the Scrape's
  // prisoners and weighs them, sim/ending.mjs `PRISONER_WEIGHT`). The Scrape is the spring's and this class ends in December: the
  // prisoner is planted to watch the page draw them; tests/ending.test.mjs takes them the real way. hh-1 has already acted, so
  // joining it rolls nobody new (sim/family.mjs `rollRefusal`).
  const home = world.households['hh-1'];
  const taken = home.members.map(id => world.entities[id]).find(person => person.id !== home.principalId && !person.travel && !person.service && person.health?.condition === 'well' && person.location?.siteId === home.homeSiteId);
  assert.ok(taken, 'nobody of hh-1 was at home to be taken');
  Object.assign(taken, { health: { condition: 'captured' }, task: 'rest', chore: null });
  observed.planted = { prisoner: taken.name };
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'ending-proof', playerCount: 5, tickMs: 1000, worldFactory: playedToTheEnd });
assert.ok(app.state.world.glory?.['hh-1']?.total > 0, 'hh-1 earned no glory to reveal');
assert.equal(app.state.world.director.complete, false, 'the class ended before the browser could watch it');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
};

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Ending reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The family-making curtain (owner, 2026-09-17) stands over the page until the student has met their family; this proof
  // predated it, and its first press landed on the curtain until 2026-09-26.
  await meetFamily(student);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });

  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // While it runs: no ending, no glory, on either page.
  for (const [who, page] of [['student', student], ['host', host]]) {
    const running = await page.evaluate(() => ({ ending: 'ending' in window.__snapshot.world, hidden: document.querySelector('#ending').hidden, wire: JSON.stringify(window.__snapshot.world) }));
    assert.equal(running.ending, false, `the ${who} was sent an ending while the class ran`);
    assert.equal(running.hidden, true, `the ${who} page showed an ending while the class ran`);
    assert.doesNotMatch(running.wire, /"glory"/, `the ${who} wire carried glory while the class ran`);
  }
  ok('while the class runs neither page has an ending or a glory');

  // The last ticks happen, live.
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 60000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 60000 });
  ok('the class ended on its own, with both pages watching');

  await student.locator('#ending').waitFor({ state: 'visible' });
  const family = await student.evaluate(() => window.__snapshot.world.ending.family);
  observed.family = { name: family.name, money: family.money, story: family.story, keys: Object.keys(family) };
  const familyText = await student.locator('#ending').innerText();
  observed.familyText = familyText;
  // The end of the first period is interim standings, and interim standings carry no glory (VISION §20; design audit 2026-09-28
  // B4): not the number, not the final number it multiplies, not the sum, not what earned it - on the wire or on the page. The
  // final reckoning, with all of it, is the last period's: tests/ending.test.mjs and npm run test:whole-game.
  assert.equal(family.interim, true, 'the end of the first period was not interim');
  assert.ok(app.state.world.glory['hh-1'].total > 0, 'hh-1 earned no glory, so its absence proves nothing');
  const familyWire = await student.evaluate(() => JSON.stringify(window.__snapshot.world.ending));
  for (const key of ['glory', 'final', 'sum', 'awards']) assert.ok(!(key in family), `the family's interim standings carry ${key}`);
  assert.doesNotMatch(familyWire, /glory/i, 'the family\'s interim standings on the wire speak of glory');
  assert.doesNotMatch(familyText, /glory|final number/i, 'the family\'s interim page shows glory');
  // Coin and land only (owner, 2026-09-28, by multiple choice): the coin held and the land promised. The story, what moved the
  // coin and who was taken (the planted prisoner) are the final reckoning's, with the glory.
  assert.deepEqual(Object.keys(family).sort(), ['acres', 'householdId', 'interim', 'land', 'money', 'name'], `the family's interim standing carries ${Object.keys(family)}`);
  assert.match(familyText, /coin in the house/i, 'the coin is not on the page');
  assert.match(familyText, /land promised/i, 'the land is not on the page');
  assert.ok(familyText.includes(`${family.money} real`), 'the coin held is not the number on the page');
  assert.doesNotMatch(familyText, /taken prisoner|our story/i, 'the family\'s interim page tells the ending\'s story');
  assert.equal(await student.evaluate(() => window.__snapshot.world.ending.host), undefined, 'a family was sent the Host view');
  ok(`the family sees where it stands so far - coin and land only - and no glory, on the page or the wire (${family.money} reales)`);

  // Closed to look at the map, and opened again.
  await student.locator('#ending-close').click();
  assert.equal(await student.locator('#ending').isHidden(), true);
  await student.locator('#ending-open').click();
  await student.locator('#ending').waitFor({ state: 'visible' });
  ok('the family can close it to look at the map, and open it again');

  const hostState = await host.evaluate(() => ({ role: window.__snapshot.world.role, keys: Object.keys(window.__snapshot.world.ending || {}), hidden: document.querySelector('#ending').hidden, game: document.querySelector('#game')?.hidden }));
  assert.deepEqual(hostState.keys, ['host'], `the Host was sent ${JSON.stringify(hostState)}`);
  assert.deepEqual(errors, [], `a page threw before the Host could show the ending: ${errors.join(' | ')}`);
  await host.locator('#ending').waitFor({ state: 'visible' });
  const closing = await host.evaluate(() => window.__snapshot.world.ending.host);
  const hostText = await host.locator('#ending').innerText();
  observed.host = { keys: Object.keys(closing), families: closing.families.map(f => `${f.name}: ${f.money} reales`) };
  observed.hostText = hostText;
  const rows = await host.locator('#ending tbody tr td:first-child').allInnerTexts();
  const heads = await host.locator('#ending thead th').allInnerTexts();
  assert.deepEqual(heads, ['Family', 'Coin', 'Land'], `the Host's interim table is not coin and land only: ${heads.join(' | ')}`);
  const coinCells = await host.locator('#ending tbody tr td:nth-child(2)').allInnerTexts();
  assert.deepEqual(coinCells, closing.families.map(f => `${f.money} ${f.money === 1 ? 'real' : 'reales'}`), 'the coin column is not the server\'s');
  assert.deepEqual(rows.map(row => row.replace(/ \(nobody played them\)$/, '')), closing.families.map(f => f.name), 'the rows are not in household order');
  assert.deepEqual(closing.families.map(f => f.householdId), ['hh-1', 'hh-2', 'hh-3', 'hh-4', 'hh-5']);
  // The first of three class periods (sim/periods.mjs, docs/COLONIES.md §7e): where the families stand, the war not over. No glory
  // and nobody named as leading by it, on the Host's wire or its page (VISION §20: glory is hidden from the Host too until the
  // ending; design audit 2026-09-28 B4).
  assert.equal(closing.interim, true, 'the end of the first period was not interim');
  for (const key of ['winners', 'best']) assert.ok(!(key in closing), `the Host's interim standings carry ${key}`);
  for (const one of closing.families) for (const key of ['glory', 'final']) assert.ok(!(key in one), `${one.name}'s row carries ${key}`);
  assert.doesNotMatch(await host.evaluate(() => JSON.stringify(window.__snapshot.world.ending)), /glory/i, 'the Host\'s interim standings on the wire speak of glory');
  assert.doesNotMatch(hostText, /glory|final number|\bleads?\b|finished first/i, 'the Host\'s interim page shows glory or who leads');
  assert.equal(await host.locator('#ending tbody tr[data-first=true]').count(), 0, 'a row was marked first');
  ok(`the Host sees where every family stands so far - coin and land only (${heads.join(' | ')}: ${coinCells.join(', ')}) - with no glory and nobody named as leading`);

  for (const [who, text] of [['family', familyText], ['Host', hostText]]) {
    assert.doesNotMatch(text, VIRTUE, `the ${who} page names a virtue`);
  }
  ok('no word on either page names a virtue');

  // At phone width the Host table scrolls inside itself and the page does not.
  await host.setViewportSize({ width: 400, height: 860 });
  const overflow = await host.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  mkdirSync('docs/evidence', { recursive: true });
  await host.screenshot({ path: 'docs/evidence/ending-host-phone.png' });
  await host.setViewportSize({ width: 1440, height: 950 });
  await host.screenshot({ path: 'docs/evidence/ending-host.png' });
  await student.screenshot({ path: 'docs/evidence/ending-family.png' });
  ok('at phone width the page does not scroll sideways');

  // The next class meets: the Host continues the same class into the winter (sim/periods.mjs, docs/COLONIES.md §7e). The
  // standings go, both pages open on January 25, 1836, paused; the teacher resumes, and the student is still hh-1 and can
  // give an order.
  const session = app.state.sessionId;
  await host.getByRole('button', { name: 'Continue to the winter of 1836' }).click();
  for (const page of [student, host]) {
    await page.waitForFunction(() => window.__snapshot?.world.status === 'paused' && !window.__snapshot.world.ending, null, { timeout: 15000 });
    await page.locator('#ending').waitFor({ state: 'hidden' });
  }
  const winter = await student.evaluate(() => ({ householdId: window.__snapshot.world.householdId, date: document.querySelector('#world').textContent }));
  observed.winter = winter;
  assert.equal(app.state.sessionId, session, 'continuing started a new class');
  assert.equal(winter.householdId, 'hh-1', 'the student lost their family over the winter');
  assert.match(winter.date, /1836/, `the date did not move to 1836: ${winter.date}`);
  assert.equal(await host.getByRole('button', { name: 'Continue to the winter of 1836' }).isHidden(), true, 'the winter was offered twice');
  ok(`the Host continues the class into the winter: both pages open paused on "${winter.date}", the standings gone`);
  await host.getByRole('button', { name: 'Resume' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  const principal = await student.evaluate(() => window.__snapshot.world.household.principalId);
  const rested = await student.evaluate(async id => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `winter-${Date.now()}`, action: 'rest', entityId: id }) })).status, principal);
  assert.equal(rested, 200, 'the student could not give an order in the winter');
  await student.screenshot({ path: 'docs/evidence/ending-winter.png' });
  ok('the teacher resumes, and the same student gives an order in January 1836');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/ending-browser.json', `${JSON.stringify({
    record: 'The end of the game, in a browser: docs/MONEY_AND_GLORY.md steps 4 and 5',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map, played in process to three days before it ends, with hh-1\'s volunteer in the army, 5 reales placed in hh-2\'s house and one of hh-1\'s people at home made a prisoner, in process; then served live, a student joined as hh-1 and the Host page watched the last ticks and the ending arrive. No LAN or district claim.',
    checks: pass,
    observed,
    screenshots: ['docs/evidence/ending-family.png', 'docs/evidence/ending-host.png', 'docs/evidence/ending-host-phone.png', 'docs/evidence/ending-winter.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
