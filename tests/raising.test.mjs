// The house-raising: docs/SETTLING_IN.md §6, step 5.
//
// Somebody from another family standing on the land while its walls are going up can help raise
// them. It speeds the walls, it is written into both families' stories, and nobody is ever pressed
// to do it. All of it is FIC-GONZ-024 (no first-hand account was found: HIST-GONZ-032).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { tooYoung } from '../sim/family.mjs';
import { HOUSES, RAISING_FROM, RAISING_TO, houseBuilt, raising } from '../sim/houses.mjs';

const WORK = HOUSES['round-log'].work;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

/** Two families on their land, hh-1 with a round-log cabin at the given share of its work, and one of hh-2 standing on it. */
function scene(seed = 'raising', share = RAISING_FROM) {
  const world = createGonzalesWorld(seed, 5);
  const [host, neighbour] = [world.households['hh-1'], world.households['hh-2']];
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  world.status = 'running';
  for (let tick = 0; tick < 60 && (host.arriving || neighbour.arriving); tick++) stepWorld(world);
  host.house.work = Math.ceil(WORK * share);
  const helper = world.entities[neighbour.principalId];
  helper.location = { ...world.map.sites[host.homeSiteId], siteId: host.homeSiteId };
  helper.task = 'rest';
  validateWorld(world);
  return { world, host, neighbour, helper };
}
const builder = (world, household) => household.members.map(id => world.entities[id]).find(person => !tooYoung(person));

test('help is a thing to do only on a neighbour\'s land, and only while the walls are going up', () => {
  const { world, host, neighbour, helper } = scene();
  assert.equal(choreAvailability(world, neighbour, helper, 'help-raise').can, true);
  assert.ok(choresFor(world, neighbour, helper).some(entry => entry.id === 'help-raise' && entry.can));
  // At home, it is not on the list at all.
  const stayedHome = world.entities[neighbour.members.find(id => id !== helper.id)];
  assert.ok(!choresFor(world, neighbour, stayedHome).some(entry => entry.id === 'help-raise'));
  assert.match(choreAvailability(world, neighbour, stayedHome, 'help-raise').why, /not on a neighbour's land/);
  // Too early, and too late, each said plainly.
  host.house.work = Math.floor(WORK * RAISING_FROM) - 1;
  assert.match(choreAvailability(world, neighbour, helper, 'help-raise').why, /felling and hauling logs; the walls are not ready/);
  host.house.work = Math.ceil(WORK * RAISING_TO);
  assert.match(choreAvailability(world, neighbour, helper, 'help-raise').why, /walls .* are up/);
  delete host.house;
  assert.match(choreAvailability(world, neighbour, helper, 'help-raise').why, /have not begun a house/);
  // Nobody can be sent to help while the class has not begun.
  const early = scene('raising-lobby');
  early.world.status = 'lobby';
  assert.match(choreAvailability(early.world, early.neighbour, early.helper, 'help-raise').why, /once the class has begun/);
});

test('a neighbour\'s work goes into the house, speeds the walls, and stops when they are up', () => {
  // The host family raising its walls with one pair of hands.
  const alone = scene('raising-speed');
  applyAction(alone.world, 'hh-1', { action: 'chore', entityId: builder(alone.world, alone.host).id, chore: 'build-house' });
  const aloneStart = alone.world.tick;
  for (let tick = 0; tick < 300 && raising(alone.host); tick++) stepWorld(alone.world);
  const aloneTicks = alone.world.tick - aloneStart;

  // The same, with a neighbour beside them.
  const helped = scene('raising-speed');
  const own = builder(helped.world, helped.host);
  applyAction(helped.world, 'hh-1', { action: 'chore', entityId: own.id, chore: 'build-house' });
  applyAction(helped.world, 'hh-2', { action: 'chore', entityId: helped.helper.id, chore: 'help-raise' });
  assert.equal(helped.helper.chore.hostHouseholdId, 'hh-1');
  const helpedStart = helped.world.tick;
  for (let tick = 0; tick < 300 && raising(helped.host); tick++) stepWorld(helped.world);
  const helpedTicks = helped.world.tick - helpedStart;
  assert.ok(helpedTicks < aloneTicks * 0.8, `the walls went up in ${helpedTicks} ticks with help and ${aloneTicks} without`);

  // The helper stopped when the walls were up; the family's own builder carries on to the roof.
  assert.equal(helped.helper.chore, null, 'the neighbour went off when the walls were up');
  assert.ok(own.chore, 'the family goes on with its own house');
  assert.ok(helped.host.house.work / WORK >= RAISING_TO && !houseBuilt(helped.host));
  // Their work is the host's house, and none of it is the helper's own.
  assert.equal(helped.neighbour.house, undefined, 'helping builds no house for the helper');
  validateWorld(helped.world);
});

test('both families remember it, in their own stories, with the hours put in', () => {
  const { world, host, neighbour, helper } = scene('raising-story');
  applyAction(world, 'hh-2', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
  for (let tick = 0; tick < 300 && raising(host); tick++) stepWorld(world);
  // Nobody else is working here, so the helper's own spell put the walls up - and they stopped in that same tick.
  assert.equal(helper.chore, null, 'the helper stopped the moment the walls were up');
  assert.equal(host.house.work, Math.ceil(WORK * RAISING_TO), 'and put in no spell past them');
  const story = id => world.events.filter(event => event.householdId === id && event.type === 'raising').map(event => event.text);
  const helperStory = story('hh-2'), hostStory = story('hh-1');
  assert.equal(helperStory.length, 2);
  assert.equal(hostStory.length, 2);
  assert.match(helperStory[0], new RegExp(`${helper.name} went to help .* raise the walls of their round-log cabin`));
  assert.match(helperStory[1], /put \d+ hours? into raising .* walls, and saw them up/);
  assert.match(hostStory[0], new RegExp(`${helper.name} of .* came to help raise the walls`));
  assert.match(hostStory[1], /put \d+ hours? into raising the walls, and they are up/);
  // Each family sees its own lines and not the other's.
  assert.ok(view(world, 'hh-1').events.every(event => event.householdId === 'hh-1'));
  assert.ok(view(world, 'hh-2').events.every(event => event.householdId === 'hh-2'));
  assert.equal(neighbour.house, undefined);
  assert.equal(host.house.layout, 'round-log');
});

test('a neighbour who arrives as the walls go up is told so, in both stories', () => {
  const { world, host, helper } = scene('raising-too-late');
  applyAction(world, 'hh-2', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
  // The family puts its walls up before the neighbour's first spell is done.
  host.house.work = Math.ceil(WORK * RAISING_TO);
  stepWorld(world);
  assert.equal(helper.chore, null);
  assert.ok(world.events.some(event => event.householdId === 'hh-2' && /were up before .* could put any work in/.test(event.text)), 'the helper’s story says why');
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && /The walls were up before .* could put any work in/.test(event.text)), 'and so does the family’s');
});

test('called home partway, a neighbour\'s hours are still remembered', () => {
  const { world, helper } = scene('raising-called-home');
  applyAction(world, 'hh-2', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
  for (let tick = 0; tick < 12; tick++) stepWorld(world);
  assert.ok(helper.chore?.spells > 0, 'some work was put in');
  applyAction(world, 'hh-2', { action: 'stop-chore', entityId: helper.id });
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && /put \d+ hours? into raising the walls\./.test(event.text)));
  assert.ok(world.events.some(event => event.householdId === 'hh-2' && /put \d+ hours? into raising .*'s walls\./.test(event.text)));
  validateWorld(world);
});

test('helping is never asked for, and a family raises its walls alone if nobody comes', () => {
  // From the first log, so the moment the walls are ready to raise is passed through, not skipped.
  const { world, host } = scene('raising-alone', 0);
  const pressureBefore = world.events.filter(event => event.type === 'pressure').length;
  for (const id of host.members) {
    const person = world.entities[id];
    if (!tooYoung(person)) applyAction(world, 'hh-1', { action: 'chore', entityId: id, chore: 'build-house' });
  }
  for (let tick = 0; tick < 400 && !houseBuilt(host); tick++) stepWorld(world);
  assert.ok(houseBuilt(host), 'the house stands with nobody\'s help');
  assert.equal(world.events.filter(event => event.type === 'pressure').length, pressureBefore, 'nobody was asked or pressed');
  assert.equal(world.events.filter(event => event.type === 'raising').length, 0, 'and no neighbour is recorded as having helped');
});

test('a raising survives save and reload, and a helper for a family that is not there is refused', () => {
  const { world, helper } = scene('raising-save');
  applyAction(world, 'hh-2', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
  for (let tick = 0; tick < 5; tick++) stepWorld(world);
  const reloaded = JSON.parse(JSON.stringify(world));
  stepWorld(world); stepWorld(reloaded);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(world)), 'a reloaded raising steps identically');
  validateWorld(reloaded);
  reloaded.entities[helper.id].chore.hostHouseholdId = 'hh-99';
  assert.throws(() => validateWorld(reloaded), /not there/);
});
