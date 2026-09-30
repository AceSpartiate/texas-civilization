// The spring's big news by express, settlement by settlement (docs/COLONIES.md §5.4c, `FIC-GONZ-955`; triage 2.7, "every family
// hears the spring's big news at the same moment").
//
// Until 2026-09-29 the fall of the Alamo reached every family away from Gonzales on the same evening, and Houston's retreat,
// Goliad, the massacre, Santa Anna over the Brazos and San Jacinto reached every family in the country on one tick. Each now
// leaves by express from where the record has it come in, with the autumn's stops, waits and riders (sim/expresses.mjs
// `sendExpress`), and a family hears it - a quiet line in its journal, never a rider who stops to talk - when a rider from the
// stop nearest its people could have reached them, at home or on the road east (`hearExpresses`). What the word means for the
// family's own (a death, a man released, the turn for home) waits for the family's hearing of it (sim/directors.mjs
// `tellWhenHeard`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { RELAY_MINUTES } from '../sim/expresses.mjs';
import { findPath } from '../sim/geography.mjs';
import { classHooks } from '../sim/ending-story.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { householdName } from '../sim/family.mjs';
import { spring } from './support/scrape-spring.mjs';
import { hasHeard } from './support/spring-word.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
/** The minute a family's journal first had this word, a rumour or not. */
const firstHeard = (world, householdId, topicId) => world.events.find(event => event.type === 'information' && event.householdId === householdId && event.topicId === topicId)?.minute ?? null;

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('spring-news', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
const menOf = (world, household) => household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16 && !['dead', 'captured'].includes(person.health.condition));
const serve = (world, person, kind, siteId) => {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind, status: 'serving', since: world.minute, siteId };
};

test('the Alamo\'s fall reaches each family as the express from Gonzales could bring it: days apart, in the order of the roads, never before it happened, and a family\'s dead are dead on its screen only then', () => {
  const world = winter();
  const others = Object.values(world.households).filter(household => household.settlementId !== 'gonzales');
  const roadFrom = household => findPath(world.map, 'gonzales', household.settlementId)?.distance ?? 0;
  // The farthest family with a grown man to send to the Alamo.
  const far = [...others].filter(household => menOf(world, household).length).sort((a, b) => roadFrom(b) - roadFrom(a))[0];
  const near = [...others].sort((a, b) => roadFrom(a) - roadFrom(b))[0];
  assert.ok(roadFrom(far) - roadFrom(near) > 60, `the class has no family much farther from Gonzales than another (${far.settlementId}, ${near.settlementId})`);
  const [farMan] = menOf(world, far);
  serve(world, farMan, 'garrison', 'bexar');
  untilMoment(world, 'alamo-assault');
  until(world, () => world.minute >= momentOf(world, 'alamo-assault') + 120);
  assert.equal(farMan.service.fate, 'fell');
  // Tick by tick until every family has heard, into the spring if need be: until the far family has, the death is not on its
  // screen and the word is not in what the server sends it.
  const everyone = Object.keys(world.households);
  const allHeard = () => everyone.every(id => hasHeard(world, id, 'alamo-fall'));
  const watch = () => {
    for (let t = 0; t < 9000 && !allHeard() && world.status === 'running'; t++) {
      stepWorld(world);
      // Nothing piles up at a gate: no rider of a settlement is sent out to a family's door with it, as the autumn's riders are.
      assert.ok(!Object.values(world.entities).some(entity => entity.report?.topicId === 'alamo-fall'), 'a rider was sent to a family\'s door with the fall');
      if (hasHeard(world, far.id, 'alamo-fall', false)) continue;
      assert.notEqual(farMan.health.condition, 'dead', 'the far family saw the death before the word reached it');
      assert.ok(!view(world, far.id).reports.some(report => report.topicId === 'alamo-fall'), 'the far family was sent the word before it reached it');
    }
  };
  watch();
  if (!allHeard() && world.period === 2 && world.director.complete) { beginThirdPeriod(world); world.status = 'running'; watch(); }
  assert.ok(allHeard(), 'a family never heard of the fall');
  const heard = Object.fromEntries(everyone.map(id => [id, firstHeard(world, id, 'alamo-fall')]));
  // Never before it happened; the rest of the country not before Gonzales had it confirmed and sent it on.
  for (const id of everyone) assert.ok(heard[id] >= momentOf(world, 'alamo-assault'), `${id} heard of the fall before the assault`);
  for (const household of others) assert.ok(heard[household.id] >= momentOf(world, 'fall-confirmed'), `${household.id} of ${household.settlementId} heard before the word left Gonzales`);
  // Days apart, and in the order of the roads: the family farthest from Gonzales hears well after the nearest.
  assert.ok(heard[far.id] - heard[near.id] >= 24 * 60, `the far family (${far.settlementId}) heard ${Math.round((heard[far.id] - heard[near.id]) / 60)} hours after the near one (${near.settlementId})`);
  const state = world.expresses['alamo-fall'];
  const byRoad = [...others].filter(household => Number.isFinite(state.heard[household.settlementId])).sort((a, b) => state.heard[a.settlementId] - state.heard[b.settlementId]);
  for (let i = 1; i < byRoad.length; i++) {
    const [a, b] = [byRoad[i - 1], byRoad[i]];
    if (state.heard[b.settlementId] - state.heard[a.settlementId] >= 12 * 60) assert.ok(heard[a.id] < heard[b.id], `${a.settlementId}, where the express came first, heard after ${b.settlementId}`);
  }
  // From its own country's riders, not a rider straight out of Gonzales: read at a stop first, and said so.
  const known = world.knowledge.households[far.id]['alamo-fall'];
  assert.equal(known.status, 'unconfirmed');
  assert.match(known.source, /^A rider from Gonzales, carried on from /);
  const via = Object.keys(state.heard).find(stop => known.source.endsWith(world.map.sites[stop].name.replace(/^The /, 'the ')));
  assert.ok(via && via !== 'gonzales' && heard[far.id] >= state.heard[via] + RELAY_MINUTES, 'the far family heard before the stop it heard from had read the express');
  assert.equal(farMan.health.condition, 'dead', 'the word came and the death was not true');
  assert.ok(world.events.some(event => event.householdId === far.id && event.minute >= heard[far.id] && /killed when the Alamo was stormed/.test(event.text)), 'the far family was not told what became of theirs when the word came');
  // Nothing piles up: the word is a line in the journal, and no rider stopped to talk about it.
  assert.ok(!Object.values(world.encounters || {}).some(encounter => encounter.topicId === 'alamo-fall'), 'a rider stopped to talk about the fall');
  // The class's own debrief can name the gap now.
  for (const household of Object.values(world.households)) household.played = true;
  assert.ok(classHooks(world).some(hook => /heard that the Alamo had fallen on .*; .* not until /.test(hook)), 'the debrief did not name the gap in hearing of the Alamo');
  validateWorld(world);
});

test('in the spring a family hears where its people are: the victory reaches a far refuge later, and a family there turns for home only when it has', () => {
  const world = spring();
  const [west, west2] = ['gonzales', 'mina'].map(id => Object.values(world.households).find(household => household.settlementId === id));
  assert.ok(west && west2, 'the class has no family of Gonzales and of Mina');
  const flee = (household, refuge) => {
    until(world, () => household.flight?.status === 'ordered', 3000);
    const shown = view(world, household.id).flight;
    assert.ok(shown.refuges.some(one => one.id === refuge), `${refuge} is not a refuge for ${household.settlementId}`);
    applyAction(world, household.id, { action: 'flee', entityId: shown.actingId || household.mainId || household.principalId, take: shown.packed.take, refuge });
  };
  flee(west, 'lynchburg');
  flee(west2, 'nacogdoches');
  until(world, () => [west, west2].every(household => household.flight.status === 'refuged'), 6000);
  assert.deepEqual([west, west2].map(household => household.flight.status), ['refuged', 'refuged'], 'the families never reached their refuges');
  // Neither hears of the victory before it was won.
  untilMoment(world, 'san-jacinto');
  for (const household of [west, west2]) assert.ok(!hasHeard(world, household.id, 'san-jacinto', false), `${household.settlementId} heard of San Jacinto before it was fought`);
  until(world, () => [west, west2].every(household => hasHeard(world, household.id, 'san-jacinto')), 3000);
  const [nearMinute, farMinute] = [west, west2].map(household => firstHeard(world, household.id, 'san-jacinto'));
  assert.ok(farMinute - nearMinute >= 12 * 60, `Nacogdoches heard ${Math.round((farMinute - nearMinute) / 60)} hours after Lynchburg`);
  assert.ok(nearMinute >= momentOf(world, 'santa-anna-taken'), 'the word left before Santa Anna was taken');
  // Each turned for home the tick it heard, and not before: the far family was still at its refuge when the near one went.
  for (const household of [west, west2]) {
    const turned = world.events.find(event => event.householdId === household.id && /turned for home/.test(event.text || ''));
    assert.ok(turned, `${household.settlementId}'s family never turned for home`);
    assert.equal(turned.minute, firstHeard(world, household.id, 'san-jacinto'), `${household.settlementId}'s family turned for home when it had not heard, or long after`);
  }
  assert.match(world.knowledge.households[west2.id]['san-jacinto'].source, /carried on from Nacogdoches/);
  validateWorld(world);
});

test('the debrief\'s widest gap counts from when a family first heard the word, a rumour included, not from its last firmer account', () => {
  const world = createGonzalesWorld('spring-news-gap', 5, { map: 'colonies' });
  const [early, late] = Object.values(world.households);
  early.played = true; late.played = true;
  establishTruth(world, { id: 'alamo-fall', text: 'The Alamo has fallen.' });
  // The early family has the rumour on day 0 and the firm word on day 5; the late family first hears on day 4.
  world.minute = 1000; learn(world, early.id, 'alamo-fall', { status: 'rumor', source: 'test' });
  world.minute = 1000 + 4 * 1440; learn(world, late.id, 'alamo-fall', { status: 'unconfirmed', source: 'test' });
  world.minute = 1000 + 5 * 1440; learn(world, early.id, 'alamo-fall', { status: 'confirmed', source: 'test' });
  const hook = classHooks(world).find(one => /the Alamo had fallen/.test(one));
  assert.ok(hook, 'no hook on the gap in hearing of the Alamo');
  assert.ok(hook.startsWith(householdName(world, early)), `the family that heard first is not named first: ${hook}`);
});

test('an express\'s word is checked like any saved state, and a class saved before it opens and hears as the autumn did', () => {
  const world = winter();
  untilMoment(world, 'fall-confirmed');
  const state = world.expresses?.['alamo-fall'];
  assert.ok(state?.word && state.from === 'gonzales', 'the fall did not leave Gonzales by express');
  validateWorld(world);
  const copy = structuredClone(world);
  copy.expresses['alamo-fall'].from = 'nowhere';
  assert.throws(() => validateWorld(copy), /express/i);
  const bad = structuredClone(world);
  bad.expresses['alamo-fall'].word.status = 'sure';
  assert.throws(() => validateWorld(bad), /express/i);
  // A class saved before the spring's word went by express has no such state: it opens, and the evening's word is told as it was.
  const old = structuredClone(world);
  delete old.expresses['alamo-fall'];
  for (const entity of Object.values(old.entities)) if (entity.express?.topicId === 'alamo-fall') delete old.entities[entity.id];
  validateWorld(old);
  untilMoment(old, 'fall-colonies');
  for (const household of Object.values(old.households)) assert.ok(hasHeard(old, household.id, 'alamo-fall'), `${household.id} never heard in a class saved before the express`);
  validateWorld(old);
});
