// What a family ate between deer: sim/gathering.mjs, docs/BIOMES.md §17.3, `FIC-GONZ-173` to `-177`.
//
// Four short works - small game, a line in the water, the oyster beds, a bee tree - and the winter that makes a turkey fat
// and a deer lean. The rules each of these holds are the ones that make them worth having:
//
//   **The country decides.** A family on the coast is shown the oyster beds and a family forty miles inland is not; a
//   family with no timber within reach is shown no bee tree; a family with no water that runs all year is shown no line.
//   **Nothing can go wrong.** The hunt can miss, and these cannot: whoever goes comes home with something. That is what
//   makes them the food a family falls back on rather than a second hunt.
//   **Two of them want no knack.** A person the hunt would refuse the shot still brings home perch, which is who the
//   record has bringing it home.
//
// Each test here was proven by injecting the regression it guards (scripts/gathering-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { settleMeans } from '../sim/means.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, forageFor } from '../sim/chores.mjs';
import { FORAGE, SALT_STANDS, fishingWater, onSaltWater } from '../sim/gathering.mjs';
import { GAME, WINTER_MONTHS, WINTER_YIELD, huntingPlace, killYield, winterShare } from '../sim/hunting.mjs';
import { SHOT_COST } from '../sim/chores.mjs';
import { settle } from './support/settled.mjs';

const KINDS = ['smallgame', 'fish', 'oysters', 'honey'];
const CHORE_OF = { smallgame: 'take-small-game', fish: 'fish-the-water', oysters: 'gather-oysters', honey: 'cut-bee-tree' };

/** A class on the real land, everybody home and under a roof. */
function landed(seed, count = 12) {
  // Home with its means, which a class made since 2026-09-25 gives on its first running tick (sim/means.mjs).
  const setUp = createGonzalesWorld(seed, count, { map: 'colonies' });
  settleMeans(setUp);
  const world = settle(setUp);
  world.status = 'running';
  return world;
}
const can = (world, household, kind) => forageFor(world, household, kind).can;
/** Work one person's chore through to its end, and say how many ticks it took. */
function workThrough(world, entity, cap = 120) {
  let ticks = 0;
  while (entity.chore && ticks < cap) { stepWorld(world); ticks++; }
  return ticks;
}
const send = (world, household, entity, kind) =>
  applyAction(world, household.id, { action: 'chore', entityId: entity.id, chore: CHORE_OF[kind] });

test('the country decides what a family can gather, and says so when it cannot', () => {
  let salt = 0, inland = 0, noTimber = 0, noWater = 0, families = 0;
  for (const seed of ['forage-a', 'forage-b', 'forage-c', 'forage-d']) {
    const world = landed(seed, 30);
    for (const household of Object.values(world.households)) {
      families++;
      const home = world.map.sites[household.homeSiteId];
      const facts = Object.fromEntries(KINDS.map(kind => [kind, forageFor(world, household, kind)]));
      // The oyster bed is the coast's and nobody else's. This is the rule the whole set is for.
      if (facts.oysters.can) {
        salt++;
        assert.ok(onSaltWater(world, home), 'a family was offered the beds off salt water');
      } else {
        inland++;
        assert.match(facts.oysters.why, /coast/, `the reason was "${facts.oysters.why}"`);
      }
      if (!facts.honey.can) { noTimber++; assert.match(facts.honey.why, /timber|axe/); }
      if (!facts.fish.can) { noWater++; assert.match(facts.fish.why, /water/); }
      // Every refusal says why, and every offer says what it gives and how long it takes.
      for (const kind of KINDS) {
        const fact = facts[kind];
        if (fact.can) {
          assert.equal(fact.food, FORAGE[kind].food, `${kind} offered the wrong food`);
          assert.ok(fact.hours > 0 && fact.what, `${kind} offered nothing to read`);
        } else assert.ok(fact.why?.length > 4, `${kind} was refused with no reason`);
      }
    }
  }
  assert.ok(families > 100, `only ${families} families`);
  assert.ok(salt > 0 && inland > salt, `${salt} families on salt water of ${families}`);
  // The country has to actually refuse somebody, or the gate is decoration.
  assert.ok(noTimber > 0, 'no family in four classes was short of timber for a bee tree');
  assert.ok(noWater > 0, 'no family in four classes was short of water that runs all year');
});

test('the beds are on salt ground, and the line wants water that runs all year', () => {
  const world = landed('forage-water');
  // `onSaltWater` is the rule, and it is the biomes' own salt prairie and dunes rather than a distance from a town.
  for (const household of Object.values(world.households)) {
    const home = world.map.sites[household.homeSiteId];
    if (!onSaltWater(world, home)) continue;
    const stands = [home, { x: home.x + 3, y: home.y }, { x: home.x - 3, y: home.y }, { x: home.x, y: home.y + 3 }, { x: home.x, y: home.y - 3 }]
      .map(point => huntingPlace(world, point).stand);
    assert.ok(stands.some(stand => SALT_STANDS.includes(stand)), 'salt water was found off salt ground');
  }
  // Deep inland is never salt: Gonzales is ninety miles from the sea.
  const gonzales = world.map.sites.gonzales;
  assert.equal(onSaltWater(world, gonzales), false, 'Gonzales stands on the coast');
  // And the water a line goes in has to be within reach of the house.
  const water = fishingWater(world, gonzales);
  if (water) assert.ok(water.miles <= 3, `the nearest water was ${water.miles} miles off and still offered`);
});

test('somebody sent to the water comes home with food, and nothing about it can go wrong', () => {
  const world = landed('forage-fish');
  const household = Object.values(world.households).find(candidate => can(world, candidate, 'fish'));
  assert.ok(household, 'no family in this class could fish');
  const person = world.entities[household.members[0]];
  const before = household.resources.food;
  send(world, household, person, 'fish');
  const ticks = workThrough(world, person);
  assert.ok(ticks > 0 && ticks < 40, `the trip took ${ticks} ticks`);
  assert.ok(household.resources.food > before, `the food went ${before} to ${household.resources.food}`);
  const forage = world.events.filter(event => event.type === 'forage');
  assert.equal(forage.length, 1, 'one trip, one thing said');
  assert.equal(forage[0].forage, 'fish');
  assert.match(forage[0].text, /perch and trout/);
  assert.equal(forage[0].claimId, 'FIC-GONZ-174');
  // The whole point of these four: there is no miss in them, and nobody comes home empty.
  assert.ok(forage[0].food > 0, 'somebody came home from the water with nothing');
  assert.equal(world.events.filter(event => /missed|with nothing/.test(event.text || '')).length, 0);
  validateWorld(world);

  // And the same class does the same thing twice: nothing here is drawn from a stream (`FIC-GONZ-008`).
  const again = landed('forage-fish');
  const twice = Object.values(again.households).find(candidate => candidate.id === household.id);
  const second = again.entities[twice.members[0]];
  send(again, twice, second, 'fish');
  workThrough(again, second);
  assert.equal(twice.resources.food, household.resources.food, 'two runs of one class brought home different catches');
});

test('small game costs a shot, and the knack the long hunt wants is not needed for it', () => {
  const world = landed('forage-small');
  const household = Object.values(world.households).find(candidate => can(world, candidate, 'smallgame'));
  assert.ok(household, 'no family in this class could take small game');
  // Somebody the hunt itself would refuse the shot: the knack is what the long shot wants (sim/chores.mjs `steadyHand`),
  // and this is the work that does not want it. Dilue Harris's family ate "venison, and small game".
  const person = world.entities[household.members.find(id => (world.entities[id].skills?.hunting ?? 1) < 2)] || world.entities[household.members[0]];
  person.skills = { ...person.skills, hunting: 1 };
  const powder = household.resources.powder, food = household.resources.food;
  send(world, household, person, 'smallgame');
  workThrough(world, person);
  assert.equal(Math.round((powder - household.resources.powder) * 100) / 100, SHOT_COST, 'the shot was free');
  assert.ok(household.resources.food > food, 'the hour brought home nothing');
  const forage = world.events.filter(event => event.type === 'forage');
  assert.equal(forage.length, 1);
  assert.match(forage[0].text, /a squirrel or two/);
  validateWorld(world);

  // With no powder in the house there is no shot, and the work is not offered at all.
  household.resources.powder = 0;
  const facts = forageFor(world, household, 'smallgame');
  assert.equal(facts.can, false);
  assert.match(facts.why, /powder/);
  assert.equal(CHORES['take-small-game'].offered(world, household), false, 'a dry house was still offered the rifle work');
});

test('a bee tree wants an axe, and the oyster beds want nothing at all', () => {
  const world = landed('forage-axe');
  const household = Object.values(world.households).find(candidate => can(world, candidate, 'honey'));
  assert.ok(household, 'no family in this class could cut a bee tree');
  const tools = household.tools;
  household.tools = Object.fromEntries(Object.entries(tools).filter(([tool]) => tool !== 'axe'));
  const without = forageFor(world, household, 'honey');
  assert.equal(without.can, false, 'a bee tree was cut without an axe');
  assert.match(without.why, /axe/);
  household.tools = tools;
  assert.equal(forageFor(world, household, 'honey').can, true);

  // The beds cost the walk and nothing else: no tool, no powder, no knack.
  assert.equal(FORAGE.oysters.axe, undefined, 'the oyster beds were given a tool to want');
  assert.equal(FORAGE.oysters.powder, undefined, 'somebody shot an oyster');
  const coast = landed('forage-coast', 30);
  const coastal = Object.values(coast.households).find(candidate => can(coast, candidate, 'oysters'));
  assert.ok(coastal, 'no family of thirty stood on salt water');
  const gatherer = coast.entities[coastal.members[0]];
  const had = coastal.resources.food;
  send(coast, coastal, gatherer, 'oysters');
  workThrough(coast, gatherer);
  assert.ok(coastal.resources.food > had, 'the beds gave nothing');
  assert.match(coast.events.filter(event => event.type === 'forage').at(-1).text, /oysters/);
  validateWorld(coast);
});

test('the four works go on foot to a place, and carry no numbers a student never reads', () => {
  const world = landed('forage-channel');
  const household = Object.values(world.households).find(candidate => can(world, candidate, 'fish'));
  const person = world.entities[household.members[0]];
  send(world, household, person, 'fish');
  // A walk out over the family's own ground, not a journey down a road: there is no road to a creek bank, and asking the
  // map for one is how these four first failed ("No known route to that destination", found 2026-09-20).
  assert.ok(person.chore.ground, 'the work set out for nowhere');
  assert.equal(person.travel, null, 'a walk to the water was made a journey');
  // And it is the water they walk to, not the timber the hunt walks to: each of the four has its own place, and a fisher
  // sent to a stand of post oaks catches nothing.
  const home = world.map.sites[household.homeSiteId], water = fishingWater(world, home);
  assert.ok(water, 'the family offered the line had no water');
  const off = Math.hypot(person.chore.ground.x - water.x, person.chore.ground.y - water.y);
  assert.ok(off < 0.05, `the fisher set out ${Math.round(off * 100) / 100} miles from the water`);
  workThrough(world, person);

  // What each brings home is fixed and is said in words on the control, so the per-tick channel is spared four more
  // numbers for every person in the family (tests/family.test.mjs holds the size).
  const projected = projectWorld(world, household.id, 'student', { includeMap: false });
  for (const offered of Object.values(projected.work)) {
    for (const entry of offered) {
      if (!CHORES[entry.id].forage) continue;
      assert.equal(entry.haul, undefined, `${entry.id} put its haul on the tick`);
      assert.ok(entry.cost?.length > 0, `${entry.id} said nothing about what it costs`);
    }
  }
});

test('a turkey is fat in the winter and a deer is lean, and nothing else moves', () => {
  // Kuykendall, near Independence in 1822: "The deer were lean but the turkies were fat and fine and constituted, for
  // several months, the most valuable part of our subsistence" (`HIST-TEX-264`, `FIC-GONZ-177`).
  const plain = amount => amount;
  for (const month of WINTER_MONTHS) {
    assert.equal(killYield('turkey', Infinity, plain, month).meat, GAME.turkey.meat * WINTER_YIELD.turkey);
    assert.equal(killYield('deer', Infinity, plain, month).meat, GAME.deer.meat * WINTER_YIELD.deer);
    // In the winter the bird is worth more than it is in the summer, and the deer less.
    assert.ok(killYield('turkey', Infinity, plain, month).meat > killYield('turkey', Infinity, plain, 6).meat);
    assert.ok(killYield('deer', Infinity, plain, month).meat < killYield('deer', Infinity, plain, 6).meat);
  }
  for (const month of [3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(killYield('turkey', Infinity, plain, month).meat, GAME.turkey.meat, `the turkey was not itself in month ${month}`);
    assert.equal(killYield('deer', Infinity, plain, month).meat, GAME.deer.meat, `the deer was not itself in month ${month}`);
  }
  // Everything else in GAME is untouched: the bear is denned, the buffalo is not in the colonies, and no source read says
  // what the winter did to a javelina.
  for (const id of Object.keys(GAME)) {
    if (id === 'turkey' || id === 'deer') continue;
    for (const month of WINTER_MONTHS) assert.equal(winterShare(id, month), 1, `${id} was given a winter of its own`);
  }
  // And a kill with no month at all is the kill it always was, so nothing that does not know the date is changed.
  assert.equal(killYield('turkey', Infinity, plain).meat, GAME.turkey.meat);
});
