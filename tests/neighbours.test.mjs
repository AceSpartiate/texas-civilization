// Automatic neighbours: docs/COLONIES.md §5.9, build step 3.
//
// Families nobody plays farm, build, hunt and go to town; answer a fair trade and refuse an unfair one in their own
// words; raise walls a student can help with; never touch a student's family; never read glory; and do nothing in a
// class that was not made with them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, choresFor } from '../sim/chores.mjs';
import { houseBuilt, raising } from '../sim/houses.mjs';
import { ONE_AT_A_TIME, markPlayed, thinkFor } from '../sim/neighbours.mjs';
import { createClassroom } from '../server/app.mjs';

const lively = (seed, players = 5, options = {}) => {
  const world = createGonzalesWorld(seed, players, { neighbours: true, ...options });
  world.status = 'running';
  return world;
};
const run = (world, ticks) => { for (let tick = 0; tick < ticks; tick++) stepWorld(world); };
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);

test('a family nobody plays builds its house, plants and brings in its crop, and goes on living', () => {
  const world = lively('neighbours-live', 5);
  // One person at a time on a one-person errand: a whole family sent to the timber with no powder never built or planted,
  // and a live class sent a whole family to town for seed.
  const played = lively('neighbours-played', 5);
  markPlayed(played, 'hh-1');
  for (let tick = 0; tick < 500; tick++) {
    stepWorld(world); stepWorld(played);
    for (const each of [world, played]) {
      for (const household of Object.values(each.households)) {
        for (const errand of ONE_AT_A_TIME) {
          const on = household.members.filter(id => each.entities[id].chore?.id === errand).length;
          assert.ok(on <= 1 || household.played, `${household.id} put ${on} people on ${errand} at tick ${each.tick}`);
        }
      }
    }
  }
  assert.ok(houseBuilt(played.households['hh-2']), 'the family that once hunted itself hungry builds its house');
  validateWorld(world);
  for (const household of Object.values(world.households)) {
    assert.ok(household.house?.layout, `${household.id} chose a house`);
    assert.ok(houseBuilt(household), `${household.id} built it`);
    const story = storyOf(world, household.id).join(' ');
    assert.match(story, /set out: plant the field/, `${household.id} planted`);
  }
  assert.equal(Object.values(world.entities).filter(entity => entity.health?.condition === 'dead').length, 0, 'and nobody died of it');
});

test('a family nobody plays rides its horse on a journey when the horse is at hand, and walks when it is not', () => {
  // Found in play 2026-09-14: nobody ever got on a horse. Every neighbour walked to town with the horse in the yard.
  const world = lively('neighbours-ride', 5);
  const ridden = new Set(), walked = new Set(), seen = new Set();
  for (let tick = 0; tick < 700; tick++) {
    stepWorld(world);
    for (const entity of Object.values(world.entities)) {
      if (entity.kind !== 'person' || !entity.travel || world.households[entity.householdId]?.played) continue;
      (entity.travel.mode === 'horse' ? ridden : walked).add(entity.householdId);
      if (seen.has(entity.travel.causeId)) continue;
      seen.add(entity.travel.causeId);
      if (entity.travel.mode !== 'horse') {
        const horse = world.entities[`${entity.householdId}-horse`];
        const free = horse && !horse.borrowedBy && !horse.travel && horse.location.siteId === entity.travel.from && (!horse.condition || horse.condition === 'sound');
        // Setting out from home, where the family decides how to go. Coming back, a chore keeps the way it went out: somebody
        // who walked to town walks home, even if another of the family has since ridden in.
        const fromHome = entity.travel.from === world.households[entity.householdId].homeSiteId;
        assert.ok(!free || !fromHome || entity.travel.purpose === 'arrive', `${entity.name} walked to ${entity.travel.to} with the horse standing free at tick ${world.tick}`);
      }
    }
  }
  assert.ok(ridden.size >= 3, `families rode: ${[...ridden]}`);
  // And somebody left in town with the horse beside them rides it home.
  const town = lively('neighbours-ride-home', 5), household = town.households['hh-2'];
  const person = town.entities[household.members.find(id => town.entities[id].principal)], horse = town.entities['hh-2-horse'];
  run(town, 150);
  for (const each of [person, horse]) Object.assign(each, { travel: null, chore: null, borrowedBy: null, task: 'rest', location: { x: town.map.sites.gonzales.x, y: town.map.sites.gonzales.y, siteId: 'gonzales' } });
  thinkFor(town, household, { project: id => projectWorld(town, id, 'student', { includeMap: false }), act: input => applyAction(town, 'hh-2', input) });
  assert.equal(person.travel?.mode, 'horse', 'rides home');
});

test("a student's family is never run, and a class made without neighbours leaves every family to its students", () => {
  const world = lively('neighbours-played', 5);
  markPlayed(world, 'hh-1');
  run(world, 300);
  const played = world.households['hh-1'];
  assert.equal(played.house, undefined, 'nobody chose a house for the student');
  assert.equal(played.field.state, 'bare', 'nobody planted for the student');
  assert.ok(houseBuilt(world.households['hh-2']), 'while the neighbour next door got on with its own');

  const quiet = createGonzalesWorld('neighbours-played', 5);
  quiet.status = 'running';
  run(quiet, 300);
  assert.ok(Object.values(quiet.households).every(household => !household.house), 'a class without neighbours is as it always was');
});

test("a family nobody plays is offered its town errands and goes for powder before its last shot; a student's family is offered neither", () => {
  // Found 2026-09-19 (docs/BIOME_GAMEPLAY.md §5.2): the errands hidden from students were hidden from the director too, and
  // it never went for powder anyway, so a family nobody played fired its three shots and went without for the rest of the class.
  const world = lively('neighbours-powder', 5);
  markPlayed(world, 'hh-1');
  run(world, 40);
  const neighbourHousehold = world.households['hh-2'];
  const home = world.map.sites[neighbourHousehold.homeSiteId];
  for (const id of neighbourHousehold.members) Object.assign(world.entities[id], { chore: null, travel: null, task: 'rest', location: { x: home.x, y: home.y, siteId: home.id } });
  neighbourHousehold.resources = { ...neighbourHousehold.resources, food: 20, powder: 1, money: 0 };
  const neighbour = world.entities[neighbourHousehold.principalId];
  assert.ok(choresFor(world, neighbourHousehold, neighbour).some(entry => entry.id === 'fetch-powder' && entry.can), 'the director is offered the errand to town');
  const student = world.entities[world.households['hh-1'].principalId];
  assert.ok(!choresFor(world, world.households['hh-1'], student).some(entry => CHORES[entry.id]?.directorOnly), "a student's family deals at the counter instead");
  thinkFor(world, neighbourHousehold, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, 'hh-2', input) });
  assert.equal(neighbourHousehold.members.filter(id => world.entities[id].chore?.id === 'fetch-powder').length, 1, 'one of the family goes to town for powder');
});

test('a neighbour takes a fair trade, and refuses an unfair one or one it cannot spare, saying why in both stories', () => {
  const world = lively('neighbours-trade', 5);
  markPlayed(world, 'hh-1');
  run(world, 40);
  const student = world.entities[world.households['hh-1'].principalId];
  const neighbourHousehold = world.households['hh-2'];
  const neighbour = world.entities[neighbourHousehold.principalId];
  // The student goes to stand on the neighbour's land; the neighbour's principal is kept at home for the test.
  student.location = { ...world.map.sites[neighbourHousehold.homeSiteId], siteId: neighbourHousehold.homeSiteId };
  student.chore = null; student.travel = null; student.task = 'rest';
  neighbour.chore = null; neighbour.travel = null; neighbour.task = 'rest';
  neighbour.location = { ...world.map.sites[neighbourHousehold.homeSiteId], siteId: neighbourHousehold.homeSiteId };
  world.households['hh-1'].resources = { ...world.households['hh-1'].resources, powder: 5, cotton: 3, food: 20 };
  neighbourHousehold.resources = { ...neighbourHousehold.resources, food: 40, seed: 2, powder: 1 };
  neighbourHousehold.field = { ...neighbourHousehold.field, state: 'bare' };
  const offerAndAnswer = (give, ask) => {
    applyAction(world, 'hh-1', { action: 'offer', entityId: student.id, toEntityId: neighbour.id, give, ask });
    thinkFor(world, neighbourHousehold, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, 'hh-2', input) });
  };
  offerAndAnswer({ powder: 2 }, { food: 5 });
  assert.equal(neighbourHousehold.resources.food, 35, 'two shots for five food is fair, and taken');
  offerAndAnswer({ cotton: 1 }, { food: 6 });
  assert.ok(storyOf(world, 'hh-1').some(text => /declined .*"That's not a fair trade for us\."/.test(text)), "the student's family is told why");
  assert.ok(storyOf(world, 'hh-2').some(text => /declined .*"That's not a fair trade for us\."/.test(text)), "and so is the neighbour's");
  offerAndAnswer({ powder: 2 }, { seed: 1 });
  assert.ok(storyOf(world, 'hh-1').some(text => /"We can't spare seed before the field is in\."/.test(text)));
  neighbourHousehold.resources.powder = 1;
  offerAndAnswer({ food: 9 }, { powder: 1 });
  assert.ok(storyOf(world, 'hh-1').some(text => /"That's the last powder in the house\."/.test(text)));
  assert.equal(neighbourHousehold.resources.seed, 2);
  assert.equal(neighbourHousehold.resources.powder, 1, 'it kept its last shot');
});

test("a student can help raise a neighbour's walls, and the neighbour only ever acts for its own family", () => {
  const world = lively('neighbours-raise', 5);
  markPlayed(world, 'hh-1');
  const host = world.households['hh-2'];
  for (let tick = 0; tick < 400 && !raising(host); tick++) stepWorld(world);
  assert.ok(raising(host), "the neighbour's walls went up to be helped with");
  const helper = world.entities[world.households['hh-1'].principalId];
  helper.chore = null; helper.travel = null; helper.task = 'rest';
  helper.location = { ...world.map.sites[host.homeSiteId], siteId: host.homeSiteId };
  assert.ok(choresFor(world, world.households['hh-1'], helper).some(entry => entry.id === 'help-raise' && entry.can), 'Help raise the walls is offered');
  applyAction(world, 'hh-1', { action: 'chore', entityId: helper.id, chore: 'help-raise' });
  assert.ok(storyOf(world, 'hh-2').some(text => /came to help raise the walls/.test(text)), "it is in the neighbour's story");

  // Everything a neighbour tries names only its own people.
  const tried = thinkFor(world, host, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: () => {} });
  for (const input of tried) if (input.entityId) assert.equal(world.entities[input.entityId].householdId, 'hh-2', `${input.action} is for its own family`);
});

test('a neighbour never reads glory: the same class with glory planted plays out the same', () => {
  const plain = lively('neighbours-glory', 5), planted = lively('neighbours-glory', 5);
  planted.glory = Object.fromEntries(Object.keys(planted.households).map((id, i) => [id, { total: 1000 * (i + 1), awards: {} }]));
  run(plain, 200); run(planted, 200);
  const strip = world => { const { glory, ...rest } = JSON.parse(JSON.stringify(world)); return rest; };
  assert.deepEqual(strip(planted), strip(plain));
});

test('a family a student joins is marked theirs, so the neighbours leave it alone', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-neighbours-'));
  const app = createClassroom({ seed: 'neighbours-http', savePath: join(dir, 'save.json'), tickMs: 10, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { neighbours: true }) });
  const port = await app.listen();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Joiner', code: app.state.sessionCode }) });
    const body = await response.json();
    assert.equal(app.state.world.households[body.world.householdId].played, true);
    assert.equal(app.state.world.households['hh-2'].played, undefined, 'nobody has joined the next family');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
