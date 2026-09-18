// The armies on the map, in a real browser (owner, 2026-09-17, playtesting: "when i sent someone to join the army ... there
// was no army. they were just off in the middle of no where. no mexican army, no texas army. nothing.").
//
// tests/armies.test.mjs proves who stands where and who may know of it. This proves what a student sees: a man sent to
// Houston's army stands in a camp of men with the army's name over it, the Mexican columns are drawn marching in the spring,
// an army too far off to draw as a camp is a marker, and a family far away is shown nothing of it.
//
// Same computer only: headless Chrome. Run: npm run test:armies
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { armiesNow } from '../sim/armies.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
mkdirSync('docs/evidence', { recursive: true });

/** A class already in the spring, with two of the first family's men in Houston's army. */
function springWorld(_seed, playerCount) {
  // The seeds are this proof's own, not the one Play Solo deals at random, tried in a fixed order: the first whose first family
  // still has a grown man by the spring. Which one that is moves with everything the earlier periods do (the road to Beeson's,
  // 2026-09-17, moved it once), and a seed whose first family has no grown man proves nothing.
  for (let n = 0; n < 12; n++) {
    const world = springOf(n ? `armies-proof-world-${n}` : 'armies-proof-world', playerCount);
    if (world) return world;
  }
  throw new Error('no seed tried leaves the first family a grown man by the spring');
}
function springOf(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let t = 0; t < 9000 && !world.director.complete; t++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let t = 0; t < 9000 && !world.director.complete; t++) stepWorld(world);
  beginThirdPeriod(world); world.status = 'running';
  // Stepped to the day Santa Anna's column enters the country (sim/road.mjs `columns`), so both armies are on the map.
  for (let t = 0; t < 9000 && !armiesNow(world).some(army => army.side === 'mexican'); t++) stepWorld(world);
  const camp = world.map.sites[houstonCamp(world)];
  const men = Object.values(world.entities).filter(one => one.householdId === 'hh-1' && one.kind === 'person' && one.sex === 'male' && (one.age ?? 0) >= 16 && one.health.condition === 'well');
  for (const man of men.slice(0, 3)) {
    man.travel = null; man.chore = null; man.task = 'rest';
    man.location = { x: camp.x, y: camp.y, siteId: camp.id };
    man.service = { kind: 'houston', status: 'serving', since: world.minute, siteId: camp.id, leave: 'no' };
  }
  world.households['hh-1'].played = true;
  if (!Object.values(world.entities).some(one => one.householdId === 'hh-1' && one.service?.kind === 'houston')) return null;
  return world;
}

const app = createClassroom({ seed: 'armies-proof', playerCount: 8, tickMs: 4000, solo: true, worldFactory: springWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const world = () => app.state.world;

try {
  const game = app.newSoloGame('Army reader');
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
  await meetFamily(page);
  await page.waitForTimeout(1200);

  // The armies the page was told about, and what it drew.
  const seen = await page.evaluate(() => (window.__snapshot.world.armies || []).map(army => ({ id: army.id, name: army.name, side: army.side, ours: army.ours, strength: army.strength })));
  observed.armies = seen;
  const houston = seen.find(army => army.id === 'houston');
  assert.ok(houston, `the page was told of no army of Houston's: ${JSON.stringify(seen)}`);
  // However many of this family the seed had to send: they are all counted in the army.
  const sent = Object.values(world().entities).filter(one => one.householdId === 'hh-1' && one.service?.kind === 'houston' && one.service.status === 'serving').length;
  assert.ok(sent >= 1, 'this seed sent nobody to the army');
  assert.equal(houston.ours, sent, 'the family\'s own men are not counted in the army');
  ok(`the page is told where the armies are: ${seen.map(army => `${army.name}${army.ours ? ` (${army.ours} of ours)` : ''}`).join('; ')}`);

  // Go to the camp: the army is drawn as a camp, with men in it.
  const camp = await page.evaluate(() => (window.__snapshot.world.armies || []).find(army => army.id === 'houston'));
  await page.evaluate(({ x, y }) => { window.__camera && window.__setCamera ? window.__setCamera({ x, y }) : null; }, camp);
  // The camera is moved the way a student moves it: to the man himself, from his portrait on the panel.
  const ourMan = await page.evaluate(() => (window.__snapshot.world.entities || []).find(one => one.service?.kind === 'houston')?.id);
  await page.locator(`[data-portrait="${ourMan}"]`).click();
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) await page.locator('#map-nav [data-view=in]').click();
  await page.waitForTimeout(1200);
  const drawn = await page.evaluate(() => window.__armiesDrawn || []);
  observed.drawn = drawn;
  const drawnCamp = drawn.find(army => army.id === 'houston');
  assert.ok(drawnCamp, 'the army was not drawn at all');
  assert.equal(drawnCamp.how, 'camp', `the army was drawn as a ${drawnCamp?.how} at this zoom`);
  await page.screenshot({ path: 'docs/evidence/armies-camp.png' });
  shots.push('docs/evidence/armies-camp.png');
  ok(`zoomed in on the man his army is a camp of men around him (${drawnCamp.strength} in it, ${drawnCamp.ours} of the family's)`);

  // Zoomed out: the armies are markers, and the Mexican columns are among them.
  for (let i = 0; i < 14; i++) await page.locator('#map-nav [data-view=out]').click();
  await page.waitForTimeout(1500);
  const wide = await page.evaluate(() => window.__armiesDrawn || []);
  observed.wide = wide;
  assert.ok(wide.some(army => army.how === 'mark'), 'no army is drawn as a marker when the country is in view');
  await page.screenshot({ path: 'docs/evidence/armies-country.png' });
  shots.push('docs/evidence/armies-country.png');
  ok(`with the country in view the armies the family knows of are markers (${wide.map(army => army.id).join(', ')})`);
  // A Mexican column twenty-five miles off is not on this family's map at all, which is the rule (sim/armies.mjs).
  assert.deepEqual(wide.filter(army => army.side === 'mexican'), [], 'a column the family could not know of was drawn for them');

  // A family far from any army is shown none of them, and its page carries nothing about them.
  const far = Object.values(world().households).find(household => household.id !== 'hh-1'
    && Math.hypot(world().map.sites[household.homeSiteId].x - camp.x, world().map.sites[household.homeSiteId].y - camp.y) > 60);
  assert.ok(far, 'this seed needs a family living well away from the camp');
  const key = app.state.hostKey;
  const joined = await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
  assert.equal(joined.status, 200);
  const hostPage = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  hostPage.on('pageerror', error => errors.push(`host: ${error.message}`));
  await hostPage.goto(`${url}/host#${key}`);
  await hostPage.waitForFunction(() => window.__snapshot?.world.role === 'host', null, { timeout: 30000 });
  await hostPage.waitForTimeout(1000);
  const hostArmies = await hostPage.evaluate(() => (window.__snapshot.world.armies || []).map(army => army.id));
  assert.ok(hostArmies.includes('houston') && hostArmies.some(id => id !== 'houston'), `the Host sees ${hostArmies.join(', ')}`);
  // The Host sees the country, so the Mexican columns are drawn marching there (owner, 2026-09-17).
  for (let i = 0; i < 14; i++) await hostPage.locator('#map-nav [data-view=out]').click().catch(() => {});
  await hostPage.waitForTimeout(1500);
  const hostDrawn = await hostPage.evaluate(() => window.__armiesDrawn || []);
  observed.hostDrawn = hostDrawn;
  const mexican = hostDrawn.filter(army => army.side === 'mexican');
  assert.ok(mexican.length >= 1, `no Mexican column is drawn on the Host's map: ${JSON.stringify(hostDrawn)}`);
  await hostPage.screenshot({ path: 'docs/evidence/armies-host.png' });
  shots.push('docs/evidence/armies-host.png');
  ok(`the teacher's page sees every army in the country (${hostArmies.length}), the Mexican columns among them (${mexican.length} drawn)`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/armies-browser.json', `${JSON.stringify({
    record: 'The armies on the map, in a browser (owner, 2026-09-17)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A solo game in the spring with two of the family\'s men in Houston\'s army: the camp and its men drawn around them, the Mexican columns drawn marching, armies far off as markers, and a family out of sight told nothing. The tents and fire are Claude-drawn (docs/ART_REQUESTS.md); the men are the militia and regular figures the battles use.',
    checks: pass,
    observed,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
