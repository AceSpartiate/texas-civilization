// The armies on the map (owner, 2026-09-17, playtesting: "when i sent someone to join the army ... there was no army. they
// were just off in the middle of no where. no mexican army, no texas army. nothing."), and the Mexican columns of the
// spring, which the owner asked to see as well.
//
// sim/armies.mjs says where each army stands and who may see it. Nothing here is new history: an army's strength is the men
// the simulation holds in it, and a Mexican column has none - only where its head is on its dated march (sim/road.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { ARMY_SIGHT_MILES, armiesNow, armiesSeen } from '../sim/armies.mjs';
import { houstonCamp } from '../sim/houston.mjs';

const spring = () => {
  const world = createGonzalesWorld('armies', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let t = 0; t < 9000 && !world.director.complete; t++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let t = 0; t < 9000 && !world.director.complete; t++) stepWorld(world);
  beginThirdPeriod(world); world.status = 'running';
  return world;
};
const serve = (world, person, kind, siteId) => {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind, status: 'serving', since: world.minute, siteId, leave: 'no' };
};
const men = world => Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && one.sex === 'male' && (one.age ?? 0) >= 16 && one.health.condition === 'well');

test('a man who joins an army stands in it: the army is on the map where he is, with his own family counted in it', () => {
  const world = spring();
  const [ours, theirs] = men(world);
  assert.ok(ours && theirs, 'this seed needs two grown men');
  serve(world, ours, 'houston', houstonCamp(world));
  serve(world, theirs, 'houston', houstonCamp(world));
  const army = armiesNow(world, ours.householdId).find(one => one.id === 'houston');
  assert.ok(army, 'Houston\'s army is not on the map although men serve in it');
  assert.equal(army.side, 'texian');
  assert.equal(army.strength, 2, 'the army holds the men the simulation holds in it');
  assert.equal(army.ours, ours.householdId === theirs.householdId ? 2 : 1, 'the family\'s own men are not counted');
  const camp = world.map.sites[houstonCamp(world)];
  assert.ok(Math.hypot(army.x - camp.x, army.y - camp.y) < 0.001, 'the army is not drawn at its camp');
  assert.match(army.name, /Houston's army at /);
  // And the page is told, within what the family can know.
  const view = projectWorld(world, ours.householdId, 'student', { includeMap: false });
  assert.ok((view.armies || []).some(one => one.id === 'houston'), 'the page is not told about the army its own man is in');
});

test('the Mexican columns are on the map in the spring, with no strength, and the garrison and Fannin stand where they serve', () => {
  const world = spring();
  const [one, two] = men(world);
  serve(world, one, 'garrison', 'bexar');
  serve(world, two, 'fannin', 'goliad');
  // Before the columns enter the country there are none; the spring brings them (sim/road.mjs `columns`).
  const early = armiesNow(world).filter(army => army.side === 'mexican');
  assert.deepEqual(early, [], 'a Mexican column was on the map before it entered the country');
  // Santa Anna reaches Gonzales on March 24 (sim/road.mjs `columns`, HIST-TEX-065): the world is stepped to the day.
  for (let t = 0; t < 9000 && !armiesNow(world).some(army => army.side === 'mexican'); t++) stepWorld(world);
  const armies = armiesNow(world);
  const mexican = armies.filter(army => army.side === 'mexican');
  assert.ok(mexican.length, 'no Mexican column is on the map in the spring');
  for (const column of mexican) {
    assert.equal(column.strength, null, 'a Mexican column was given a strength the record does not fix here');
    assert.match(column.place, /making for |on the march/);
  }
  const garrison = armies.find(army => army.id === 'garrison');
  if (garrison) assert.equal(Math.round(garrison.x), Math.round(world.map.sites.bexar.x), 'the garrison is not at Béxar');
  const fannin = armies.find(army => army.id === 'fannin');
  if (fannin) assert.equal(Math.round(fannin.y), Math.round(world.map.sites.goliad.y), 'Fannin\'s command is not at Goliad');
});

test('a family is told of an army it has men in, or one within sight of its own people; the Host sees them all', () => {
  const world = spring();
  const [ours] = men(world);
  const household = world.households[ours.householdId];
  serve(world, ours, 'houston', houstonCamp(world));
  const far = Object.values(world.households).find(other => {
    const home = world.map.sites[other.homeSiteId], camp = world.map.sites[houstonCamp(world)];
    return other.id !== household.id && Math.hypot(home.x - camp.x, home.y - camp.y) > ARMY_SIGHT_MILES + 20;
  });
  assert.ok(far, 'this seed needs a family living well away from the camp');
  const seenByFar = armiesSeen(world, far.id, 'student').map(army => army.id);
  assert.ok(!seenByFar.includes('houston'), `a family ${Math.round(Math.hypot(world.map.sites[far.homeSiteId].x - world.map.sites[houstonCamp(world)].x, world.map.sites[far.homeSiteId].y - world.map.sites[houstonCamp(world)].y))} miles off was told where the army is`);
  assert.ok(armiesSeen(world, household.id, 'student').some(army => army.id === 'houston'), 'the family whose man serves was not told');
  assert.ok(armiesSeen(world, undefined, 'host').some(army => army.id === 'houston'), 'the Host cannot see the army');
  // Nothing about an army it cannot see rides on that family's wire.
  const wire = JSON.stringify(projectWorld(world, far.id, 'student', { includeMap: false }));
  assert.doesNotMatch(wire, /"houston"/, 'an army out of sight rode on the wire');
});
