// The cold: `FIC-GONZ-135`'s last unbuilt row, docs/WEATHER.md §10.5, `sim/scrape.mjs` `COLD_WEIGHT`.
//
// Dilue Rose Harris's Runaway Scrape is the only place the record puts this: "many persons died" of "**disease, cold,
// rain and hunger**" (`HIST-TEX-065`, `HIST-TEX-069`). Until 2026-09-21 a norther was a lean in the grass and nothing
// more, and a family could walk to the Sabine in February as though it were May.
//
//   **Hunger already doubled a person's weight in the day's sickness; cold now doubles it too**, and only for somebody
//   the cold can get at: on the road east, or camped on their own land with no roof up.
//   **A family in its own cabin is cold and nothing more**, which is the line the claim draws and the reason a roof is
//   worth having before the winter.
//   **Rain is the third word of that sentence and is deliberately not here**: a wet day on the road is the mud and the
//   bog, and doubling the sickness for half the spring as well would make the road a lottery rather than a journey.
//
// The rule itself is `sicknessWeight` and `coldSky`, written out as functions on 2026-09-21 for exactly the reason this
// file exists: the first draft of these tests asserted that the cold *happened* rather than that it made a difference,
// and of twelve injected regressions it caught four. Each test here was proven by injection
// (scripts/cold-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { COLD_WEIGHT, SICK_PER_DAY, coldSky, sicknessWeight } from '../sim/scrape.mjs';
import { weatherAt } from '../sim/weather.mjs';
import { shelterOf } from '../sim/houses.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const until = (world, done, limit = 9000) => { for (let tick = 0; tick < limit && !done() && world.status === 'running'; tick++) stepWorld(world); };
const landed = (seed, count = 8) => {
  const world = settle(createGonzalesWorld(seed, count, { map: 'colonies' }));
  world.status = 'running';
  return world;
};
/** The first day at this place whose sky is of the kind wanted. */
function dayOfKind(world, point, kind, from = 0) {
  for (let day = from; day < 210; day++) if (weatherAt(world, point, day).kind === kind) return day;
  return -1;
}

test('the weight is frailty, childhood, hunger and cold, and cold is the only one of them that is weather', () => {
  const grown = { age: 30, health: { condition: 'well' } };
  const child = { age: 3, health: { condition: 'well' } };
  const plain = sicknessWeight(grown);
  assert.ok(plain > 0);
  // Each term doubles, and they compound: that is the rule the road has always had, with one term added to it.
  assert.equal(sicknessWeight(grown, { hungry: true }), plain * 2);
  assert.equal(sicknessWeight(grown, { cold: true }), plain * COLD_WEIGHT);
  assert.equal(sicknessWeight(grown, { hungry: true, cold: true }), plain * 2 * COLD_WEIGHT);
  assert.equal(sicknessWeight(child), plain * 2, 'a small child is not weighted double');
  assert.equal(sicknessWeight(child, { cold: true }), plain * 2 * COLD_WEIGHT);
  // And cold with nothing set is the warm day it always was: the default cannot be the cold one.
  assert.equal(sicknessWeight(grown, { cold: false }), plain);
  assert.equal(COLD_WEIGHT, 2);
  // Small enough that a road is a journey and not a lottery: a fortnight of northers is still a coin worth taking.
  const cold = 1 - (1 - SICK_PER_DAY) ** COLD_WEIGHT;
  assert.ok(1 - (1 - cold) ** 14 < 0.15, 'a fortnight in the cold is a sentence rather than a risk');
});

test('a norther is the only sky the cold gets through', () => {
  const world = landed('cold-sky');
  const home = world.map.sites[Object.values(world.households)[0].homeSiteId];
  let seen = 0;
  for (let day = 0; day < 210; day++) {
    const kind = weatherAt(world, home, day).kind;
    assert.equal(coldSky(world, home, day), kind === 'norther', `a ${kind} day was ${coldSky(world, home, day) ? '' : 'not '}counted as cold`);
    if (kind === 'norther') seen++;
  }
  assert.ok(seen > 0, 'this class never saw a norther at that house');
  // **Rain is not cold here, and that is on purpose**: a wet day on the road is already the mud and the bog.
  const wet = dayOfKind(world, home, 'rain');
  assert.ok(wet >= 0 && !coldSky(world, home, wet), 'rain was counted as cold');
  assert.equal(coldSky(world, null, 0), false, 'nowhere at all was counted as cold');
});

test('a family camped on its own land is reached by a norther; one under its own roof is not', () => {
  // Built on purpose rather than waited for: measured over a class of twenty run to the end, the cold at home never
  // fires at all, because by the northers every family has its cabin up. The rule still has to be right for the family
  // that is slow, and this is how it is held.
  // The same class twice, one of them with every cabin down: a whole class of twenty rather than one family, because a
  // norther is a risk of about one in a hundred and twenty a person a day, and one family of four is four coins.
  const roofless = landed('cold-camp', 20), housed = landed('cold-camp', 20);
  // `settle` puts a sound cabin on every family; in one of these classes nobody has one up yet and every family lives
  // in its camp (`STATES`, sim/improvements.mjs: a cabin is 'none', 'sound' or 'ruined').
  for (const household of Object.values(roofless.households)) household.improvements = { ...household.improvements, cabin: 'none' };
  const noRoof = Object.values(roofless.households)[0], withRoof = Object.values(housed.households)[0];
  assert.equal(shelterOf(roofless, noRoof).kind, 'camp', 'the roofless family is somehow under a roof');
  assert.equal(shelterOf(housed, withRoof).kind, 'house', 'the housed family has no roof');

  const home = roofless.map.sites[noRoof.homeSiteId];
  const norther = dayOfKind(roofless, home, 'norther');
  assert.ok(norther > 0, 'this class never saw a norther at that house');
  // Stand both classes in the same norther and run a fortnight of it, day by day.
  let sick = { camp: 0, house: 0 };
  for (const [where, world] of [['camp', roofless], ['house', housed]]) {
    for (let day = norther; day < norther + 40; day++) {
      world.minute = day * DAY + 9 * 60;
      for (let tick = 0; tick < 2; tick++) stepWorld(world);
    }
    sick[where] = world.events.filter(event => /no roof up yet/.test(event.text || '')).length;
  }
  assert.ok(sick.camp > 0, 'forty days of northers under canvas cost the family nothing at all');
  assert.equal(sick.house, 0, 'a family under its own roof was made sick by the weather');
  const said = roofless.events.filter(event => /a norther came through and the family has no roof up yet/.test(event.text || ''));
  assert.ok(said.length > 0 && said.every(event => event.claimId === 'FIC-GONZ-135'), 'the cold at home carries no claim');
  // Every one of them fell on a day that was a norther over that family's own house, and nobody twice in a day.
  for (const event of said) {
    const household = roofless.households[event.householdId];
    const at = roofless.map.sites[household.homeSiteId];
    assert.ok(coldSky(roofless, at, Math.floor(event.minute / DAY)), `${event.householdId} fell cold-sick on a day that was not a norther`);
  }
  const perPersonDay = said.map(event => `${event.actorId}:${Math.floor(event.minute / DAY)}`);
  assert.equal(new Set(perPersonDay).size, perPersonDay.length, 'somebody fell sick of the cold twice in one day');
  validateWorld(roofless);
});

/** A class carried to the end, with the families the director runs: the road east actually happening. */
let shared = null;
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('cold-class', 20, { map: 'colonies', neighbours: true });
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  return world;
})());

test('the cold reaches the road east, is told once, and never touches the armies\' dates', () => {
  const world = spring();
  const told = world.events.filter(event => /A norther came down on the road/.test(event.text || ''));
  assert.ok(told.length > 0, 'no family in twenty met a norther on the road east');
  assert.ok(told.every(event => event.claimId === 'FIC-GONZ-135'), 'the cold on the road carries no claim');
  // Once a family, not once a tick.
  const perHousehold = told.reduce((count, event) => ({ ...count, [event.householdId]: (count[event.householdId] || 0) + 1 }), {});
  for (const [id, count] of Object.entries(perHousehold)) assert.equal(count, 1, `${id} was told of the cold ${count} times`);
  // Where each family was on the day it was told cannot be reconstructed afterwards - it has walked on since - so what
  // is held here is that it was told at all and told once. That the sky is read where the family *is* rather than where
  // it set out from is held at the house, above, where the place stands still.
  assert.ok(world.events.some(event => /has fallen sick on the road/.test(event.text || '')), 'nobody in twenty families fell sick on the road east');
  // And a family on the road is never *also* rolled at home: the road has its own roll, and two of them for the same
  // day would be the cold counted twice over. A family that has come home again may be camped in its own ashes, and
  // that one is the at-home rule's own business.
  for (const event of world.events.filter(item => /no roof up yet/.test(item.text || ''))) {
    const status = world.households[event.householdId]?.flight?.status;
    assert.ok(!status || status === 'home', `${event.householdId} was rolled at home while its flight was ${status}`);
  }
  // And the one rule this must not break (`FIC-GONZ-135`): weather changes what a family meets, never what history did.
  const moments = Object.keys(world.director?.milestones || {});
  assert.ok(moments.length > 0, 'the director reached none of its dated moments');
  validateWorld(world);
});
