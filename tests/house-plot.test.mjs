// The house plot: docs/WOODS_AND_BUILDING.md §6.2-6.3, build steps 5 and 6.
//
// A family on the real land plans its house from period plans or pieces placed on a grid, each piece saying what it
// needs and does; it is raised stage by stage - sills, walls course by course, roof, chinking - each stage taking its logs
// off the family's pile; courses above the sixth want two people or go at a third of the pace; the family lives in it
// once a pen stands. Every other class chooses one of the four houses whole, as before.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { handsOn, helpRefusal, houseBuilt, landView, pieced, raising, shelterOf, stageOf } from '../sim/houses.mjs';
import {
  PIECES, PLANS, PLAN_IDS, TWO_HANDED_ABOVE, logsShort, nextStage, pieceDone, placeRefusal, planInvalid, planPieces, plotCatalogue,
  plotNeeds, plotShelter, stageWants,
} from '../sim/houseplot.mjs';
import { nextLine } from '../public/house-plot.js';

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class, hh-1's house sited and everybody over to it. */
function onTheLand(seed, options = {}) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies', ...options });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  applyAction(world, 'hh-1', { action: 'choose-site', ...grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  return { world, household };
}
const personsOf = (world, household) => household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && choreAvailability(world, household, person, 'survey-plot').can !== undefined);
const storyOf = (world, id) => world.events.filter(event => event.householdId === id).map(event => event.text);

test('every period plan is a valid plot, and says what it holds, how it rests and keeps, and what it wants', () => {
  for (const id of PLAN_IDS) assert.equal(planInvalid(planPieces(id)), null, id);
  const said = id => ({ ...plotShelter(planPieces(id), { built: false }), ...plotNeeds(planPieces(id)) });
  // A round-log pen warmed by its chimney; a hewn one tighter and slower; a dog-run twice the room, its passage keeping food.
  assert.deepEqual([said('round-log').room, said('round-log').restShare, said('round-log').spoilagePerDay], [4, 0.95, 0.015]);
  assert.deepEqual([said('hewn-log').restShare, said('hewn-log').spoilagePerDay], [1.25, 0]);
  assert.ok(said('hewn-log').hours > said('round-log').hours);
  assert.deepEqual(said('hewn-log').tools.sort(), ['axe', 'broadaxe']);
  assert.equal(said('dog-run').room, 8);
  assert.equal(said('dog-run').spoilagePerDay, 0.0075, 'the passage halves the spoiling');
  assert.equal(said('saddlebag').restShare, 0.95, 'the double chimney warms both pens');
  assert.equal(said('jacal').logs.wall + said('jacal').logs.sill + said('jacal').logs.any, 0, 'a jacal wants no logs');
  assert.deepEqual(said('round-log').logs, { wall: 46, sill: 4, any: 0 });
  // A shed room and a loft each hold two more; a puncheon floor rests better; a shed room keeps stores.
  const plus = [...planPieces('round-log'), { type: 'shed', x: 3, y: 4, stage: 0, progress: 0 }, { type: 'loft', x: 3, y: 2, stage: 0, progress: 0 }, { type: 'floor', x: 3, y: 2, stage: 0, progress: 0 }];
  assert.equal(planInvalid(plus), null);
  assert.deepEqual(plotShelter(plus, { built: false }), { room: 8, restShare: 1, spoilagePerDay: 0.01 });
  // Only what is built counts.
  assert.equal(plotShelter(planPieces('round-log')), null, 'nothing built, no house');
  // The catalogue carries every piece's words and wants.
  const catalogue = plotCatalogue();
  assert.equal(catalogue.pieces.length, Object.keys(PIECES).length);
  assert.ok(catalogue.pieces.every(piece => piece.describe && piece.does && piece.stageCount === PIECES[piece.id].stages.length && Number.isFinite(piece.hours)));
  assert.deepEqual(catalogue.plans.map(plan => plan.id), Object.keys(PLANS));
});

test('the plot refuses what could not be built, in the words of what is wrong', () => {
  const pen = { type: 'pen-round', x: 3, y: 2, stage: 0, progress: 0 };
  assert.match(placeRefusal([pen], { type: 'pen-round', x: 4, y: 3 }), /already built there/);
  assert.match(placeRefusal([], { type: 'pen-round', x: 7, y: 0 }), /off the house plot/);
  assert.match(placeRefusal([pen], { type: 'passage', x: 5, y: 2 }), /between two pens/);
  assert.match(placeRefusal([pen], { type: 'chimney', x: 0, y: 0 }), /end wall of a pen/);
  assert.equal(placeRefusal([pen], { type: 'chimney', x: 2, y: 3 }), null, 'at the west end');
  assert.match(placeRefusal([pen], { type: 'porch', x: 3, y: 4 }), /along the front/);
  assert.equal(placeRefusal([pen], { type: 'porch', x: 3, y: 1 }), null);
  assert.match(placeRefusal([pen], { type: 'shed', x: 3, y: 1 }), /back wall/);
  assert.match(placeRefusal([{ type: 'pen-jacal', x: 3, y: 2 }], { type: 'loft', x: 3, y: 2 }), /inside a log pen/);
  assert.match(placeRefusal([pen, { type: 'loft', x: 3, y: 2 }], { type: 'loft', x: 3, y: 2 }), /already has a loft/);
  assert.match(placeRefusal([], { type: 'tower', x: 0, y: 0 }), /not a piece/);
});

test('a family on the real land plans on the plot, places and takes away pieces; every other class chooses a house whole', () => {
  const { world, household } = onTheLand('plot-plan');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'dog-run' });
  assert.ok(pieced(household));
  assert.deepEqual(household.house.pieces.map(p => p.type), PLANS['dog-run'].pieces.map(([type]) => type));
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  applyAction(world, 'hh-1', { action: 'place-piece', piece: 'shed', x: 3, y: 4 });
  assert.equal(household.house.plan, 'own', 'a plan added to is the family\'s own');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'place-piece', piece: 'porch', x: 0, y: 0 }), /along the front/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'remove-piece', index: 0 }), /Other pieces stand against the round-log pen/);
  applyAction(world, 'hh-1', { action: 'remove-piece', index: 2 });
  assert.equal(household.house.pieces.length, 2);
  validateWorld(world);
  const land = projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  assert.equal(land.plot, true);
  assert.deepEqual(land.house.pieces, [['pen-round', 3, 2, 0, 0], ['chimney', 5, 2, 0, 0]]);
  assert.deepEqual(land.planned.logs, { wall: 46, sill: 4, any: 0 });
  assert.deepEqual(land.choices.map(choice => choice.id), PLAN_IDS);
  assert.match(land.house.why, /log pile has not got them/);
  // The invented map, and a real-land class saved before, choose one of the four houses whole.
  const settled = createSettledWorld('plot-invented', 5);
  settled.status = 'running';
  const invented = createGonzalesWorld('plot-invented-new', 5);
  invented.status = 'running';
  delete invented.households['hh-1'].house;
  invented.households['hh-1'].improvements = { ...invented.households['hh-1'].improvements, cabin: 'none' };
  assert.throws(() => applyAction(invented, 'hh-1', { action: 'place-piece', piece: 'pen-round', x: 3, y: 2 }), /chooses its house whole/);
  const saved = structuredClone(world);
  delete saved.map.woods;
  delete saved.households['hh-2'].house;
  assert.equal(projectWorld(saved, 'hh-2', 'student', { includeMap: false }).land.plot, undefined);
});

test('the house goes up stage by stage, each taking its logs; the family moves in when the pen stands, and the house is built when all is', () => {
  const { world, household } = onTheLand('plot-raise');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  const people = personsOf(world, household).filter(person => choreAvailability(world, household, person, 'build-house').why !== undefined);
  // No logs: the house cannot be worked on, and says why.
  assert.match(choreAvailability(world, household, people[0], 'build-house').why, /Laying the sills on the round-log pen wants 4 sill logs, and the log pile has not got them\./);
  // Sills from sill logs first; walls from wall logs first, then sound sill logs; poor logs never.
  household.logs = { wall: 44, sill: 6, poor: 20 };
  for (const person of people) applyAction(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'build-house' });
  const seen = new Set();
  for (let tick = 0; tick < 300 && people.some(person => person.chore); tick++) {
    stepWorld(world);
    validateWorld(world);
    seen.add(stageOf(household));
    if (household.house.pieces[0].stage === 1) {
      assert.equal(household.logs.sill, 2, 'the sills took four sill logs');
      assert.equal(household.logs.wall, household.house.pieces[0].progress ? 40 : 44, 'wall logs are charged when the first course begins');
    }
  }
  assert.ok([...seen].some(stage => /course 7 of 10/.test(stage)) && [...seen].some(stage => /rafters/.test(stage)), [...seen].join(' / '));
  assert.ok(houseBuilt(household), 'built');
  assert.equal(household.logs.poor, 20, 'no poor log went into the walls');
  assert.equal(household.logs.wall + household.logs.sill, 44 + 6 - 50);
  assert.equal(shelterOf(world, household).kind, 'house');
  assert.equal(shelterOf(world, household).restShare, 0.95);
  const story = storyOf(world, 'hh-1');
  assert.ok(story.includes('The round-log pen is finished. The family sleeps under its own roof tonight.'));
  assert.ok(story.includes('The house is built: a round-log pen and a stick-and-mud chimney.'));
  assert.deepEqual(landView(household), { shelter: 'house', layout: 'round-log' });
  // Short of logs, the work stops and says so.
  const { world: short, household: shortHousehold } = onTheLand('plot-short');
  applyAction(short, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  shortHousehold.logs = { wall: 6, sill: 4, poor: 0 };
  const worker = personsOf(short, shortHousehold)[0];
  applyAction(short, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'build-house' });
  for (let tick = 0; tick < 100 && worker.chore; tick++) stepWorld(short);
  assert.equal(worker.chore, null);
  assert.ok(storyOf(short, 'hh-1').some(text => text === 'Work on the house stopped: raising the walls, course 2 of 10 on the round-log pen wants 4 sound logs, and the log pile has not got them.'));
  assert.equal(shelterOf(short, shortHousehold).kind, 'camp');
});

test('the panel says what the next stage wants, not only what the whole plan wants', () => {
  // Owner, 2026-09-17: a family that had hauled logs in could read "still wants 26 wall logs" and not know what the next
  // spell of work itself needed. The stage, its logs and its hours come from the server; the page puts the family's own
  // pile beside them.
  const { world, household } = onTheLand('plot-next');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  household.logs = { wall: 2, sill: 1, poor: 1 };
  for (let tick = 0; tick < 2; tick++) stepWorld(world);
  const land = () => projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  const sills = land();
  assert.deepEqual(sills.house.wants.logs, { sill: 4 }, 'the sills want their four sill logs and nothing else');
  assert.equal(sills.house.wants.piece, 'the round-log pen');
  assert.ok(sills.house.wants.hours > 0, 'the stage asks for no work at all');
  assert.equal(nextLine(sills.house, sills.logs),
    `Next: laying the sills on the round-log pen. It wants 4 sill logs and about ${sills.house.wants.hours} hours\u2019 work; 3 sound and 1 poor at the house.`);
  // The whole plan's want is a different, larger number: that is the line this one was added beside.
  assert.ok(plotNeeds(household.house.pieces).logs.wall > 4, 'the plan wants no more wall logs than one stage does');

  // Once the sills are laid the next stage is the first course, and the panel moves on with it.
  household.logs = { wall: 40, sill: 8, poor: 0 };
  const worker = personsOf(world, household).find(person => choreAvailability(world, household, person, 'build-house').can);
  applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'build-house' });
  for (let tick = 0; tick < 300 && household.house.pieces[0].stage === 0; tick++) stepWorld(world);
  assert.ok(household.house.pieces[0].stage >= 1, 'the sills never went on');
  assert.match(land().house.stage, /course 1 of 10/);

  // A stage already begun has taken its logs: it wants no more, and the line says so rather than asking twice.
  const begun = { ...land().house, wants: { ...stageWants(household.house.pieces), logs: {} } };
  assert.match(nextLine(begun, { wall: 36, sill: 8, poor: 0, lying: 6 }), /It wants about \d+ hours\u2019 work; 44 sound at the house, 6 lying out\./);
  // And a house with nothing to start says only what it is at.
  assert.equal(nextLine({ stage: 'waiting on the pens' }, null), 'Next: waiting on the pens.');
  validateWorld(world);
});

test('a course above the sixth goes at a third of the pace with one person on it, and a neighbour helping raise it counts as a hand', () => {
  const timeHighCourse = helpers => {
    const { world, household } = onTheLand('plot-hands');
    applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
    household.logs = { wall: 60, sill: 4, poor: 0 };
    const pen = household.house.pieces[0];
    pen.stage = TWO_HANDED_ABOVE + 1; // course 7
    const [first] = personsOf(world, household);
    applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'build-house' });
    if (helpers) {
      const neighbour = world.households['hh-2'];
      const helper = personsOf(world, neighbour).find(person => choreAvailability(world, neighbour, person, 'survey-plot'));
      helper.location = { ...first.location, siteId: household.homeSiteId };
      assert.equal(raising(household), true, 'walls going up');
      assert.equal(helpRefusal(world, helper), null);
      applyAction(world, 'hh-2', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
      assert.equal(handsOn(world, household), 2);
    }
    let ticks = 0;
    while (pen.stage === TWO_HANDED_ABOVE + 1 && ticks < 200) { stepWorld(world); ticks++; }
    return ticks;
  };
  const alone = timeHighCourse(false), together = timeHighCourse(true);
  assert.ok(alone > together * 2, `alone ${alone} ticks, with a neighbour ${together}`);
  // Before the walls and after them there is nothing for a neighbour to raise.
  const { world, household } = onTheLand('plot-hands-refuse');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  assert.equal(raising(household), false, 'sills are the family\'s own work');
  assert.equal(nextStage(household.house.pieces).stage.id, 'sills');
  assert.equal(logsShort({ wall: 3, sill: 0, poor: 9 }, { wall: 4 }), '4 sound logs');
  assert.equal(logsShort({ wall: 0, sill: 4, poor: 0 }, { wall: 4 }), null, 'sill logs lay up in a wall');
  assert.equal(logsShort({ wall: 0, sill: 0, poor: 6 }, { any: 6 }), null);
});

test('a chimney waits for the sills and a loft for the roof, and the world cannot claim a plot that is not one', () => {
  const pieces = [...planPieces('round-log'), { type: 'loft', x: 3, y: 2, stage: 0, progress: 0 }];
  const order = [];
  const pile = { wall: 200, sill: 20, poor: 0 };
  for (let guard = 0; guard < 200; guard++) {
    const next = nextStage(pieces);
    if (!next) break;
    order.push(`${next.piece.type}:${next.stage.id}`);
    next.piece.stage += 1;
  }
  assert.ok(order.indexOf('chimney:build') > order.indexOf('pen-round:sills'));
  assert.ok(order.indexOf('loft:loft') > order.indexOf('pen-round:roof'));
  assert.ok(pieces.every(pieceDone));
  assert.ok(pile);
  const { world, household } = onTheLand('plot-valid');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'dog-run' });
  validateWorld(world);
  for (const [corrupt, message] of [
    [h => { h.house.pieces[0].type = 'tower'; }, /Invalid house piece/],
    [h => { h.house.pieces[0].stage = 99; }, /Invalid house piece/],
    [h => { h.house.pieces[1].x = 7; }, /./],
    [h => { h.house.plan = 'castle'; }, /Invalid house plan/],
    [h => { h.house.pieces[0].stage = PIECES['pen-round'].stages.length; }, /finished house with no roof/],
  ]) {
    const copy = structuredClone(world);
    corrupt(copy.households['hh-1']);
    assert.throws(() => validateWorld(copy), message);
  }
});

test('families nobody plays on the real land fell, haul and raise houses of pieces, and a family with no timber near builds a jacal', () => {
  const world = createGonzalesWorld('site-neighbours', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  for (let tick = 0; tick < 300; tick++) stepWorld(world);
  validateWorld(world);
  const households = Object.values(world.households);
  assert.ok(households.every(pieced), 'every one planned on the plot');
  assert.ok(households.filter(houseBuilt).length >= 4, households.map(h => `${h.id}:${h.house.plan}:${houseBuilt(h)}`).join(' '));
  assert.ok(households.some(h => h.house.plan === 'round-log' && houseBuilt(h)), 'a log cabin raised from felled logs');
  assert.ok(Object.values(world.woods.felled).length > 0);
  assert.ok(households.some(h => h.house.plan === 'jacal'), 'a family on the prairie built a jacal');
});
