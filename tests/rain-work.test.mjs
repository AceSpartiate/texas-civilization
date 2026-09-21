// Rain on the roofing and the daubing: `FIC-GONZ-135`'s last unbuilt row, `FIC-GONZ-290`, docs/WEATHER.md §10.5.
//
// A person cannot sensibly daub a wall with mud or lay a roof in the rain - the daub washes out before it sets and the
// thatch or the boards go on wet. Until 2026-09-21 the sky did nothing to a house at all: a family roofed a pen in the
// equinoctial storm of 23 March exactly as fast as on a fine day in October.
//
//   **Two kinds of work are held and no others.** `daub` - the chinking between the logs (`HIST-GONZ-025`), the
//   cat-and-clay of a stick-and-mud chimney (`HIST-GONZ-029`), a jacal's woven wall - and `roof` - riven clapboards
//   (`HIST-GONZ-030`), thatch, the passage's roof, the shed room's, the porch's. **Felling, hauling, the sills, the ten
//   courses, the framing, the floor, the loft and the stone chimney are not held**, which is §10.5's own line and is the
//   half of this rule that is easiest to get wrong.
//   **Held, not stopped.** A wet sky is passed over: a family whose roof cannot go on today frames the shed room instead
//   and comes back to the roof when the rain does. The house only stands still when the rain is on everything left.
//
// The rule is `rainHold` in sim/weather.mjs and the `wet` tag on each stage in sim/houseplot.mjs, and this file tests
// **those** rather than whether a particular family happened to be rained on - which is the lesson the cold work paid
// for (docs/WEATHER.md §10.5: 4 of 12 injections caught became 11 of 12 when the rule was given a name). Each test here
// was proven by injection (scripts/rain-work-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { buildRefusal, houseProjection, skyAtHome, stageOf } from '../sim/houses.mjs';
import {
  PIECES, PIECE_IDS, nextStage, planPieces, plotBuildRefusal, plotBuildSpell, stageWants, weatherHold,
} from '../sim/houseplot.mjs';
import { RAIN_HOLDS, WET_WORK, rainHold, rainingOn, weatherAt } from '../sim/weather.mjs';

const DAY = 1440;
/** Every kind of day the model makes, and the one flag that decides whether a norther is a wet one. */
const SKIES = [
  { name: 'fair', here: { kind: 'fair' }, wet: false },
  { name: 'fog', here: { kind: 'fog' }, wet: false },
  { name: 'rain', here: { kind: 'rain' }, wet: true },
  { name: 'storm', here: { kind: 'storm' }, wet: true },
  { name: 'a dry norther', here: { kind: 'norther', wet: false }, wet: false },
  { name: 'a norther that brought its rain', here: { kind: 'norther', wet: true }, wet: true },
];

// ---- The rule itself ---------------------------------------------------------------------------

test('rain is falling on three of the six skies the model makes, and a dry norther is not one of them', () => {
  for (const sky of SKIES) assert.equal(rainingOn(sky.here), sky.wet, sky.name);
  // Asked about nothing at all - a family with no place yet, a caller with no world - the answer is "no sky is being
  // read", not "it is raining". Nothing is ever held for want of a reading.
  assert.equal(rainingOn(null), false);
  assert.equal(rainingOn(undefined), false);
});

test('the rule holds daubing and roofing on a wet day and holds nothing else, ever', () => {
  assert.deepEqual([...WET_WORK].sort(), ['daub', 'roof'], 'two kinds of work, and the test is written against both');
  for (const sky of SKIES) {
    for (const work of WET_WORK) {
      assert.equal(Boolean(rainHold(sky.here, work)), sky.wet, `${work} on ${sky.name}`);
      if (sky.wet) assert.equal(rainHold(sky.here, work), RAIN_HOLDS[work], 'and says which fault it is');
    }
    // Everything a stage could be tagged that is not one of the two, and the untagged stage itself.
    for (const other of [undefined, null, '', 'felling', 'walls', 'sills', 'roofs', 'daubing']) {
      assert.equal(rainHold(sky.here, other), null, `${other} on ${sky.name} is never held`);
    }
  }
  // A dry sky holds neither, which is the whole point of naming them.
  assert.equal(rainHold({ kind: 'fair' }, 'daub'), null);
  assert.equal(rainHold(null, 'roof'), null, 'no reading is not a wet reading');
});

test('the two faults are told apart in the words, because they are different faults', () => {
  assert.notEqual(RAIN_HOLDS.daub, RAIN_HOLDS.roof);
  assert.match(RAIN_HOLDS.daub, /wash/, 'the mud washes out before it sets');
  assert.match(RAIN_HOLDS.roof, /wet/, 'the roof goes on wet');
});

// ---- Which stages carry the tag ---------------------------------------------------------------

test('exactly the mud and the roofs are tagged, piece by piece and stage by stage', () => {
  const tagged = {};
  for (const id of PIECE_IDS) for (const stage of PIECES[id].stages) if (stage.wet) tagged[`${id}:${stage.id}`] = stage.wet;
  assert.deepEqual(tagged, {
    'pen-round:roof': 'roof', 'pen-round:chink': 'daub',
    'pen-hewn:roof': 'roof', 'pen-hewn:chink': 'daub',
    'pen-jacal:wattle': 'daub', 'pen-jacal:thatch': 'roof',
    'passage:roof': 'roof',
    'chimney:build': 'daub',
    'shed:roof': 'roof',
    'porch:roof': 'roof',
  });
  // Every tag is a kind the rule knows; a typo would silently hold nothing at all.
  for (const work of Object.values(tagged)) assert.ok(WET_WORK.includes(work), work);
  // And the ones deliberately left alone: felling is unaffected (§10.5), and so is everything that is not mud or a roof.
  for (const [id, stageId] of [
    ['pen-round', 'sills'], ['pen-round', 'course-1'], ['pen-round', 'course-10'], ['pen-hewn', 'course-7'],
    ['pen-jacal', 'posts'], ['chimney-stone', 'build'], ['chimney-double', 'build'], ['shed', 'frame'],
    ['loft', 'loft'], ['floor', 'floor'],
  ]) {
    assert.equal(PIECES[id].stages.find(stage => stage.id === stageId).wet, undefined, `${id}:${stageId} is not held`);
  }
});

test('every stage that says it is mud or a roof in its own words carries the tag', () => {
  // The words on the panel and the tag under it must not drift apart: a stage a student is told is "roofing the shed
  // room" and which the rain then does not stop would be the game lying quietly.
  for (const id of PIECE_IDS) {
    for (const stage of PIECES[id].stages) {
      const saysRoof = /roof|thatch|clapboard/.test(stage.doing);
      const saysMud = /daub|chink|clay/.test(stage.doing);
      if (saysRoof && !saysMud) assert.equal(stage.wet, 'roof', `${id}:${stage.id} — "${stage.doing}"`);
      // The double chimney is the one exception and it is a `ceiling:` in sim/houseplot.mjs: no source says what it was
      // laid up in, so the game does not stop for rain on it.
      if (saysMud && id !== 'chimney-double') assert.equal(stage.wet, 'daub', `${id}:${stage.id} — "${stage.doing}"`);
    }
  }
});

// ---- Held, not stopped -------------------------------------------------------------------------

/** A round-log cabin with the pen up to the stage named and the chimney not begun. */
function atStage(stageId, { extra = [] } = {}) {
  const pieces = [...planPieces('round-log'), ...extra];
  pieces[0].stage = PIECES['pen-round'].stages.findIndex(stage => stage.id === stageId);
  return pieces;
}

test('a wet sky passes over the work it holds and the family turns to the next piece it can', () => {
  const rain = { kind: 'rain' };
  // The pen is at its roof and a shed room is framed but not roofed. Dry, the pen's roof is next; wet, the framing is.
  const pieces = atStage('roof', { extra: [{ type: 'shed', x: 3, y: 4, stage: 0, progress: 0 }] });
  assert.equal(nextStage(pieces).stage.id, 'roof', 'pens first, as ever');
  assert.equal(nextStage(pieces, { kind: 'fair' }).stage.id, 'roof');
  assert.equal(nextStage(pieces, rain).stage.id, 'frame', 'the rain is on the roof, so they frame the shed room');
  // What is being held is named, whichever piece the family turned to.
  assert.equal(weatherHold(pieces, rain).stage.id, 'roof');
  assert.equal(weatherHold(pieces, { kind: 'fair' }), null);
  // The panel's "next" line follows the work, not the plot's order.
  assert.equal(stageWants(pieces, rain).doing, 'framing the shed room');
  assert.equal(stageWants(pieces).doing, 'putting on the rafters and riving the clapboards');
});

test('rain never holds a course, a sill or a felled log, so a house still goes up in a wet week', () => {
  for (const stageId of ['sills', 'course-1', 'course-6', 'course-10']) {
    const pieces = atStage(stageId);
    assert.equal(nextStage(pieces, { kind: 'storm' }).stage.id, stageId, `${stageId} goes on in a storm`);
    assert.equal(plotBuildRefusal({ house: { pieces }, logs: { wall: 99, sill: 99, poor: 99 }, tools: { axe: 0 } }, { kind: 'storm' }), null, `${stageId} is not refused in a storm`);
  }
  // The walls go up in the rain even though the chimney standing ready beside them cannot be laid: the hold is on the
  // stage, not on the house. `weatherHold` names that waiting chimney, and the family works on regardless.
  const walls = atStage('course-3');
  assert.equal(weatherHold(walls, { kind: 'storm' }).piece.type, 'chimney');
  assert.equal(nextStage(walls, { kind: 'storm' }).stage.id, 'course-3');
});

test('the house stands still only when the rain is on everything left of it', () => {
  // A round-log cabin at its roof: what is left is the roof, the chinking and a stick-and-mud chimney - all three held.
  const pieces = atStage('roof');
  const household = { id: 'hh-1', house: { pieces }, logs: { wall: 99, sill: 99, poor: 99 }, tools: { axe: 0 } };
  assert.equal(plotBuildRefusal(household, { kind: 'fair' }), null);
  const why = plotBuildRefusal(household, { kind: 'rain' });
  assert.match(why, /raining/);
  assert.match(why, /rafters/, 'and says which stage of which piece is waiting');
  assert.match(why, /dry day/);
  // A dry norther is not rain, and the roof goes on in it (`ceiling:` in sim/weather.mjs).
  assert.equal(plotBuildRefusal(household, { kind: 'norther', wet: false }), null);
  assert.ok(plotBuildRefusal(household, { kind: 'norther', wet: true }));
});

test('what a family is short of is what it is told, and the rain is only the answer when it is the whole answer', () => {
  const pieces = atStage('roof');
  const household = { id: 'hh-1', house: { pieces }, logs: { wall: 0, sill: 0, poor: 0 }, tools: { axe: 0 } };
  // Dry and with an empty pile, the pile is the reason and the family knows to go and haul.
  assert.match(plotBuildRefusal(household, { kind: 'fair' }), /log pile/);
  // Wet, the roof would not go on with the logs at the door either, so the rain is the reason - and nothing here refuses
  // felling or hauling, so the wet day is still the day to bring the logs in.
  assert.match(plotBuildRefusal(household, { kind: 'rain' }), /raining/);
});

test('a spell caught by the rain stops the work, says so once, and takes nothing off the pile', () => {
  const world = createGonzalesWorld('rain-spell', 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  household.house = { plan: 'round-log', pieces: atStage('roof') };
  household.logs = { wall: 20, sill: 4, poor: 0 };
  const before = { ...household.logs };
  assert.equal(plotBuildSpell(world, household, null, 1, { kind: 'rain' }), true, 'the chore stops');
  assert.deepEqual(household.logs, before, 'the roof took no logs off the pile');
  assert.equal(household.house.pieces[0].progress, 0, 'and no work went into it');
  const said = world.events.filter(event => event.claimId === 'FIC-GONZ-290').map(event => event.text);
  assert.equal(said.length, 1);
  assert.match(said[0], /Work on the house stopped/);
  assert.match(said[0], /raining/);
  // The same spell on a fair day does the work.
  assert.equal(plotBuildSpell(world, household, null, 1, { kind: 'fair' }), false);
  assert.ok(household.house.pieces[0].progress > 0);
  assert.equal(world.events.filter(event => event.claimId === 'FIC-GONZ-290').length, 1, 'and says nothing more about rain');
});

// ---- Through a world ---------------------------------------------------------------------------

/** A colonies class with hh-1 on its own land, its site chosen. */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(each => each.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const bounds = holdingOf(world, household).bounds;
  const places = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 7).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 7).toFixed(3) });
  applyAction(world, 'hh-1', { action: 'choose-site', ...places.find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  return { world, household };
}
/** The first day this family's own land has a sky of the kind wanted. */
function dayOfKind(world, household, kind, wet = null) {
  const home = world.map.sites[household.homeSiteId];
  for (let day = 0; day < 210; day++) {
    const here = weatherAt(world, home, day);
    if (here.kind === kind && (wet === null || Boolean(here.wet) === wet)) return day;
  }
  return -1;
}

test('the sky a house is read against is the one over the family\'s own land', () => {
  const { world, household } = onTheLand('rain-world');
  const home = world.map.sites[household.homeSiteId];
  assert.deepEqual(skyAtHome(world, household), weatherAt(world, home));
  // No world, or a family with no place yet: nothing is read, and nothing is held for want of a reading.
  assert.equal(skyAtHome(null, household), null);
  assert.equal(skyAtHome(world, { homeSiteId: undefined }), null);
});

test('a family cannot be set to roof a pen in the rain, is told why, and can the moment it clears', () => {
  const { world, household } = onTheLand('rain-world');
  household.house = { plan: 'round-log', pieces: atStage('roof') };
  household.logs = { wall: 20, sill: 4, poor: 0 };
  household.tools = { ...household.tools, axe: 0 };
  const person = world.entities[household.principalId];
  const wet = dayOfKind(world, household, 'rain'), dry = dayOfKind(world, household, 'fair');
  assert.ok(wet >= 0 && dry >= 0, 'the class meets both kinds of day');

  world.minute = wet * DAY + 8 * 60;
  const refused = choreAvailability(world, household, person, 'build-house');
  assert.equal(refused.can, false);
  assert.match(refused.why, /raining/);
  // The family's own land line carries the same sentence, so the reason is on the screen before anybody is sent
  // (`FIC-GONZ-008`: nothing that decides against a family is hidden from the student).
  assert.match(houseProjection(world, household).house.why, /raining/);
  assert.equal(stageOf(household, world), 'waiting for the rain to stop');

  world.minute = dry * DAY + 8 * 60;
  assert.equal(choreAvailability(world, household, person, 'build-house').can, true);
  assert.equal(stageOf(household, world), 'putting on the rafters and riving the clapboards on the round-log pen');
  validateWorld(world);
});

test('the same class on the same day gets the same answer, and no save version moved', () => {
  const asked = () => {
    const { world, household } = onTheLand('rain-world');
    household.house = { plan: 'round-log', pieces: atStage('roof') };
    household.logs = { wall: 20, sill: 4, poor: 0 };
    household.tools = { ...household.tools, axe: 0 };
    return Array.from({ length: 30 }, (_, day) => {
      world.minute = day * DAY + 8 * 60;
      return buildRefusal(household, world) || 'can build';
    });
  };
  const once = asked();
  assert.deepEqual(asked(), once, 'no die anywhere in it (`FIC-GONZ-008`)');
  assert.ok(once.some(answer => /raining/.test(answer)), 'and the rain does reach the house inside a month');
  assert.ok(once.some(answer => answer === 'can build'));
  // A class saved before this: a household read with no world at all is read exactly as it always was.
  const { household } = onTheLand('rain-world');
  household.house = { plan: 'round-log', pieces: atStage('roof') };
  household.logs = { wall: 20, sill: 4, poor: 0 };
  household.tools = { ...household.tools, axe: 0 };
  assert.equal(buildRefusal(household), null, 'no sky read, nothing held');
  assert.equal(nextStage(household.house.pieces).stage.id, 'roof');
});

test('a house chosen whole is not held by the rain, because it has no roofing stage to hold', () => {
  // The four houses of sim/houses.mjs are one bar of work covering felling, hauling, walls, roof and daub together
  // (`ceiling:` in sim/houses.mjs). Stopping the bar would stop the felling, which §10.5 says rain does not.
  const world = createGonzalesWorld('rain-whole', 5, {});
  const household = world.households['hh-1'];
  household.house = { layout: 'round-log', work: 30 };
  household.tools = { ...household.tools, axe: 0 };
  household.improvements = { ...household.improvements, cabin: 'none' };
  for (let day = 0; day < 40; day++) {
    world.minute = day * DAY + 8 * 60;
    assert.equal(buildRefusal(household, world), null, `day ${day}`);
  }
});
