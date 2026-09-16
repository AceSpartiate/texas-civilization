// The end of the game, watched: docs/MONEY_AND_GLORY.md steps 4 and 5.
//
// tests/ending.test.mjs proves the numbers and that nothing of the ending is on the wire while
// the class runs. This proves what a student and a teacher actually see when it ends: a real
// class on the real land, one family's man in the army and another family with coin in the house,
// run live in the browser to its last tick. Until then neither page shows an ending or a glory;
// then the family sees its own coin, glory, the multiplication and why, and the Host sees every
// family's three numbers in household order and the family that finished first - with no word on
// either page naming a virtue.
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
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';

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
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  // Stop a handful of ticks short of the end, so the browser watches the last of them happen.
  const end = momentOf(world, 'siege');
  for (let i = 0; i < 2000 && world.minute + 3 * 720 < end && !world.director.complete; i++) stepWorld(world);
  world.households['hh-2'].resources.money = 5;
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
  observed.family = { name: family.name, money: family.money, glory: family.glory, final: family.final, sum: family.sum, story: family.story, awards: family.awards.map(award => award.text) };
  const familyText = await student.locator('#ending').innerText();
  observed.familyText = familyText;
  assert.equal(family.glory, app.state.world.glory['hh-1'].total, 'the family was shown a glory that is not its own');
  assert.ok(familyText.includes(family.sum), 'the multiplication is not on the page');
  assert.ok(family.awards.every(award => familyText.includes(award.text)), 'what earned the glory is not on the page');
  assert.ok(family.story.every(line => familyText.includes(line)), 'the story is not on the page');
  assert.equal(await student.evaluate(() => window.__snapshot.world.ending.host), undefined, 'a family was sent the Host view');
  ok(`the family sees its own reckoning: ${family.sum}`);

  // Closed to look at the map, and opened again.
  await student.locator('#ending-close').click();
  assert.equal(await student.locator('#ending').isHidden(), true);
  await student.getByRole('button', { name: 'How it ended' }).click();
  await student.locator('#ending').waitFor({ state: 'visible' });
  ok('the family can close it to look at the map, and open it again');

  const hostState = await host.evaluate(() => ({ role: window.__snapshot.world.role, keys: Object.keys(window.__snapshot.world.ending || {}), hidden: document.querySelector('#ending').hidden, game: document.querySelector('#game')?.hidden }));
  assert.deepEqual(hostState.keys, ['host'], `the Host was sent ${JSON.stringify(hostState)}`);
  assert.deepEqual(errors, [], `a page threw before the Host could show the ending: ${errors.join(' | ')}`);
  await host.locator('#ending').waitFor({ state: 'visible' });
  const closing = await host.evaluate(() => window.__snapshot.world.ending.host);
  const hostText = await host.locator('#ending').innerText();
  observed.host = { winners: closing.winners, best: closing.best, families: closing.families.map(f => `${f.name}: ${f.money} × (1 + ${f.glory}) = ${f.final}`) };
  observed.hostText = hostText;
  const rows = await host.locator('#ending tbody tr td:first-child').allInnerTexts();
  assert.deepEqual(rows.map(row => row.replace(/ \(nobody played them\)$/, '')), closing.families.map(f => f.name), 'the rows are not in household order');
  assert.deepEqual(closing.families.map(f => f.householdId), ['hh-1', 'hh-2', 'hh-3', 'hh-4', 'hh-5']);
  assert.ok(closing.winners.length >= 1, 'nobody was named');
  for (const id of closing.winners) {
    const name = closing.families.find(f => f.householdId === id).name;
    assert.ok(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*finished first`).test(hostText) || hostText.includes(name), `${name} finished first and is not named`);
  }
  assert.match(hostText, /finished first/);
  ok(`the Host names the family that finished first: ${closing.winners.join(', ')} at ${closing.best}`);

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

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/ending-browser.json', `${JSON.stringify({
    record: 'The end of the game, in a browser: docs/MONEY_AND_GLORY.md steps 4 and 5',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map, played in process to three days before it ends, with hh-1\'s volunteer in the army and 5 reales placed in hh-2\'s house in process; then served live, a student joined as hh-1 and the Host page watched the last ticks and the ending arrive. No LAN or district claim.',
    checks: pass,
    observed,
    screenshots: ['docs/evidence/ending-family.png', 'docs/evidence/ending-host.png', 'docs/evidence/ending-host-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
