// Survey: docs/LAND_GRANTS.md §4, build step 2.
//
// A student picks a place on the family's own land and sends one of the family to survey ten acres there. The server
// refuses what is not the family's land, what runs over its line, ground already staked or being surveyed, the house
// yard, the field, the water, the lobby and a house site not yet chosen. The person walks out over the family's own
// ground a tick at a time, stakes it and walks back; the plot is staked and uncleared, and the story says what and where.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createWorld, applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { PLOT_SIDE, plotFacts, plotRefusal, whereFromHouse } from '../sim/survey.mjs';
import { createClassroom } from '../server/app.mjs';

/** A class under way with its families on their land, and on the real land a house site chosen near the mark. */
const settled = (seed, map = 'gonzales') => {
  const world = createGonzalesWorld(seed, 5, { map });
  // The first family drives stock in, so it holds a league and a labor: room to survey more than a mile from the house.
  applyAction(world, 'hh-1', { action: 'load-wagon', item: 'provisions', amount: 2 });
  applyAction(world, 'hh-1', { action: 'bring-stock', stock: true });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  for (const household of Object.values(world.households)) {
    if (!household.choosingSite) continue;
    const home = world.map.sites[household.homeSiteId];
    applyAction(world, household.id, { action: 'choose-site', x: home.x, y: home.y });
  }
  for (let tick = 0; tick < 100 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
};
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);
/** Places on the family's holding where ten acres can be surveyed, farthest from the house first. */
const openGround = (world, household) => {
  const bounds = holdingOf(world, household).bounds, home = world.map.sites[household.homeSiteId], found = [];
  for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * i / 8).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * j / 8).toFixed(3) };
    if (!plotRefusal(world, household, point)) found.push(point);
  }
  return found.sort((a, b) => Math.hypot(b.x - home.x, b.y - home.y) - Math.hypot(a.x - home.x, a.y - home.y));
};

test('a family surveys ten acres where it chose: the person walks out over its own land, stakes them and walks back', () => {
  for (const map of ['gonzales', 'colonies']) {
    const world = settled(`survey-walk-${map}`, map);
    const household = world.households['hh-1'];
    const [far] = openGround(world, household);
    assert.ok(far, `there is open ground to survey on the ${map} map`);
    const facts = plotFacts(world, household, far);
    assert.equal(facts.can, true);
    const surveyor = world.entities[household.members[0]];
    const yard = { ...surveyor.location };
    applyAction(world, household.id, { action: 'survey-plot', entityId: surveyor.id, x: far.x, y: far.y });
    assert.deepEqual(surveyor.chore.plot, far, 'the place goes with the work');
    let ticks = 0, longest = 0, farthest = 0, last = { ...surveyor.location };
    const home = world.map.sites[household.homeSiteId];
    while (surveyor.chore && ticks < 200) {
      stepWorld(world); ticks++;
      assert.equal(surveyor.location.siteId, household.homeSiteId, 'never off the family\'s own land');
      longest = Math.max(longest, Math.hypot(surveyor.location.x - last.x, surveyor.location.y - last.y));
      farthest = Math.max(farthest, Math.hypot(surveyor.location.x - home.x, surveyor.location.y - home.y));
      last = { ...surveyor.location };
    }
    assert.ok(longest <= 1.0001, `walked out a tick at a time (${longest.toFixed(3)} miles at most) on the ${map} map`);
    assert.ok(Math.hypot(far.x - home.x, far.y - home.y) > 1.2, "the place is further than a tick's walk");
    assert.ok(farthest >= Math.hypot(far.x - home.x, far.y - home.y) - 0.01, 'and went all the way out to the place');
    assert.ok(Math.hypot(surveyor.location.x - yard.x, surveyor.location.y - yard.y) < 0.1, 'and came back to the yard');
    assert.equal(household.plots.length, 1);
    const [plot] = household.plots;
    assert.deepEqual({ x: plot.x, y: plot.y, state: plot.state }, { x: far.x, y: far.y, state: 'staked' });
    assert.equal(plot.ground, facts.ground, 'the ground is what the family was told');
    assert.ok(storyOf(world, household.id).includes(`${surveyor.name} staked out ${facts.words.charAt(0).toLowerCase()}${facts.words.slice(1)}`), `the story says what and where: ${facts.words}`);
    assert.deepEqual(projectWorld(world, household.id, 'student').land.plots, household.plots, 'the family sees its plots');
    const saved = JSON.parse(JSON.stringify(world));
    validateWorld(saved);
    assert.deepEqual(saved, JSON.parse(JSON.stringify(world)));
  }
});

test("the server refuses a plot off the family's land, over its line, on staked ground, the yard, the field or the water, and says why", () => {
  const world = settled('survey-refuse', 'gonzales');
  const household = world.households['hh-1'];
  const bounds = holdingOf(world, household).bounds, home = world.map.sites[household.homeSiteId];
  assert.equal(plotRefusal(world, household, { x: bounds.maxX + 1, y: bounds.minY }), 'That is not your land.');
  assert.equal(plotRefusal(world, household, { x: bounds.minX + PLOT_SIDE / 4, y: (bounds.minY + bounds.maxY) / 2 }), 'Ten acres there would run over the line of your land.');
  assert.equal(plotRefusal(world, household, { x: home.x + 0.02, y: home.y - 0.02 }), 'That would take in the house yard.');
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);
  assert.equal(plotRefusal(world, household, { x: (field.points[0].x + field.points[2].x) / 2, y: (field.points[0].y + field.points[2].y) / 2 }), 'That is ground the field already has.');
  assert.equal(plotRefusal(world, household, { x: 'here', y: 1 }), 'Choose a place on your land to survey.');
  const [first, second] = openGround(world, household);
  const one = world.entities[household.members[0]], two = world.entities[household.members[1]];
  applyAction(world, household.id, { action: 'survey-plot', entityId: one.id, x: first.x, y: first.y });
  assert.throws(() => applyAction(world, household.id, { action: 'survey-plot', entityId: two.id, x: first.x + PLOT_SIDE / 3, y: first.y }), new RegExp(`${one.name} is already surveying there`), 'nor ground somebody is on the way to survey');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: two.id, chore: 'survey-plot' }), /Choose a place on your land to survey/, 'and survey is never sent without a place');
  while (one.chore) stepWorld(world);
  const inward = Math.sign(home.y - first.y) || 1;
  assert.equal(plotRefusal(world, household, { x: first.x, y: first.y + inward * PLOT_SIDE / 2 }), 'That runs over ground already staked out.');
  assert.equal(plotRefusal(world, household, second), null, 'while ground elsewhere is still open: the plots need not be side by side');
  // In the water, on the real land: on a river the class's own map draws.
  const real = settled('survey-water', 'colonies');
  const course = real.map.terrain.find(feature => feature.kind === 'river'), river = course.points[Math.floor(course.points.length / 2)];
  const somebody = real.households['hh-1'];
  somebody.grant = { minX: river.x - 1, minY: river.y - 1, maxX: river.x + 1, maxY: river.y + 1 };
  somebody.stock = true;
  assert.equal(plotRefusal(real, somebody, river), `That runs into ${course.name}.`, 'a river the map draws');
  validateWorld(world);
});

test('no survey from the lobby or before the house site is chosen, and a class saved before Survey has no plots', () => {
  const lobby = createGonzalesWorld('survey-lobby', 5);
  const household = lobby.households['hh-1'];
  const home = lobby.map.sites[household.homeSiteId];
  assert.throws(() => applyAction(lobby, 'hh-1', { action: 'survey-plot', entityId: household.members[0], x: home.x + 0.2, y: home.y }), /once the class has begun/);
  const choosing = createGonzalesWorld('survey-choosing', 5, { map: 'colonies' });
  choosing.status = 'running';
  for (let tick = 0; tick < 200 && choosing.households['hh-1'].arriving; tick++) stepWorld(choosing);
  const mark = choosing.map.sites[choosing.households['hh-1'].homeSiteId];
  assert.throws(() => applyAction(choosing, 'hh-1', { action: 'survey-plot', entityId: choosing.households['hh-1'].members[0], x: mark.x + 0.2, y: mark.y }), /Choose where the house will stand first/);
  const old = createWorld('survey-old', 5);
  assert.equal(old.households['hh-1'].plots, undefined);
  assert.equal(projectWorld(old, 'hh-1', 'student').land.plots, undefined);
  validateWorld(old);
});

test('the words for where ten acres lie read the way a family would say it', () => {
  const world = createWorld('survey-words', 5);
  const household = world.households['hh-1'];
  const home = world.map.sites[household.homeSiteId];
  assert.equal(whereFromHouse(world, household, { x: home.x + 0.1, y: home.y }), 'beside the house');
  assert.equal(whereFromHouse(world, household, { x: home.x, y: home.y - 0.3 }), 'a quarter mile north of the house');
  assert.equal(whereFromHouse(world, household, { x: home.x + 0.4, y: home.y + 0.4 }), 'half a mile south-east of the house');
  assert.equal(whereFromHouse(world, household, { x: home.x - 1, y: home.y }), 'a mile west of the house');
  assert.equal(whereFromHouse(world, household, { x: home.x, y: home.y + 2.1 }), '2 miles south of the house');
});

test('a family asks the server about ten acres of its own land only', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-survey-'));
  const app = createClassroom({ seed: 'survey-http', savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count) });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Surveyor', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await fetch(`${base}/api/plot?x=0&y=0`, { headers: { cookie } })).json()).facts.why, 'The family surveys its land once the class has begun.');
    assert.equal((await fetch(`${base}/api/plot?x=0&y=0`)).status, 401, 'and nobody who has not joined asks at all');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
