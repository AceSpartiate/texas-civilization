// The gathering and the march, watched: docs/COLONIES.md §5.5, build step 5.
//
// tests/army.test.mjs proves the simulation - that the army is made out of people who promised
// and got there, that a volunteer marches inside it, that a family can send for its own. What it
// cannot prove is that a student is told any of it. This is a real class on the real land: a
// family answers its settlement's call, its man rides to Gonzales, the army is made and marches,
// and the page says where it has got to and offers the one control that takes him out of it.
//
// The class is played to the muster in process before the browser opens, because reaching
// October 11 takes about 240 ticks and no proof should spend four minutes of a reviewer's life
// getting there. Everything it shows was produced by the same `stepWorld` a class runs on.
//
// Run: npm run test:army
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

/** A class on the real land, played to the morning the army is made, with hh-1's man in the ranks. */
function playedToTheMuster(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  // hh-1 is the family the browser joins, so it is the one that has to have somebody in it.
  const household = world.households['hh-1'];
  const step = limit => { for (let i = 0; i < limit && !world.director.complete; i++) stepWorld(world); };
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  for (let i = 0; i < 1200 && !world.army && !world.director.complete; i++) stepWorld(world);
  // On past the muster until the column is actually on the road, which is what a student sees.
  for (let i = 0; i < 400 && world.army?.phase !== 'marching' && !world.director.complete; i++) stepWorld(world);
  step(1);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'army-proof', playerCount: 5, tickMs: 4000, worldFactory: playedToTheMuster });
assert.ok(app.state.world.army, 'the class never made an army to look at');
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
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Army reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // What the page says about the army, in the words a student reads.
  await page.locator('#army').waitFor({ state: 'visible' });
  observed.where = await page.locator('#army-where').textContent();
  assert.match(observed.where, /army/i, `the army panel says nothing about an army: "${observed.where}"`);
  assert.match(observed.where, /\d+ miles from your land/, `it does not say how far off it is: "${observed.where}"`);
  assert.match(observed.where, /\d+ went from the settlements/, `it does not say how many went: "${observed.where}"`);
  ok(`the page says where the army is: "${observed.where}"`);

  // The family's own man in it, with the one control that brings him back. Chosen the way a
  // student chooses anybody of theirs - from the roster - because that is where his controls are.
  const mine = await page.evaluate(() => window.__snapshot.world.army.ours[0]);
  await page.locator('#journal-toggle').click();
  await page.locator('[data-select="' + mine.id + '"]').click();
  await page.locator('#journal-close').click();
  await page.locator('#selection-army').waitFor({ state: 'visible' });
  observed.ours = await page.locator('#selection-army').textContent();
  const button = page.locator('#selection-army button[data-action=send-for]').first();
  await button.waitFor({ state: 'visible' });
  observed.control = await button.textContent();
  assert.match(observed.control, /^Send for /, `the control is not the one described: "${observed.control}"`);
  ok(`the family's own volunteer is named, with a control: "${observed.ours.trim()}"`);

  // Asked twice, because it cannot be taken back.
  await button.click();
  observed.confirm = await button.textContent();
  assert.match(observed.confirm, /Confirm/, `sending for somebody was not asked twice: "${observed.confirm}"`);
  ok(`sending for somebody is asked twice: "${observed.confirm}"`);

  const strengthBefore = await page.evaluate(() => window.__snapshot.world.army.strength);
  await button.click();
  await page.waitForFunction(before => (window.__snapshot?.world.army?.ours?.length ?? 0) < before,
    await page.evaluate(() => window.__snapshot.world.army.ours.length));
  observed.after = await page.locator('#army-where').textContent();
  const strengthAfter = await page.evaluate(() => window.__snapshot.world.army.strength);
  assert.equal(strengthAfter, strengthBefore - 1, 'the army did not lose the man who was sent for');
  ok(`he left the ranks and the army is one fewer: ${strengthBefore} to ${strengthAfter}`);

  // And he is on the road home, which is the world's own answer rather than the page's.
  const home = await page.evaluate(() => {
    const world = window.__snapshot.world;
    const person = world.entities.find(e => e.travel && e.travel.to === world.land?.siteId) || world.entities.find(e => e.travel);
    return person && { name: person.name, to: person.travel.to };
  });
  assert.ok(home, 'nobody was on the road after being sent for');
  observed.home = home;
  ok(`${home.name} is on the road to ${home.to}`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/army-browser.json', `${JSON.stringify({
    record: 'The gathering and the march, in a browser: docs/COLONIES.md build step 5',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map, played in process to the morning of October 11 and then served live; a student joined as hh-1 in the browser and read and used the army panel. No LAN or district claim.',
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
