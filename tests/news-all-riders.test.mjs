// All the rest of the news by express (owner, 2026-09-29, answering the spring-news builder's questions: "Hold the end", "Keep
// it", "All of it"; docs/COLONIES.md §5.4d, `FIC-GONZ-956` to `-958`).
//
// Until 2026-09-29 the autumn's and winter's news - Goliad taken, Concepción, the silver and the Grass Fight, the storming of
// Béxar, Houston's call, the word of Béxar and the council, Travis and Crockett, what Béxar believed, the Mexican army at Béxar,
// Travis's letter, Fannin turned back, San Patricio, Agua Dulce and the declaration - reached every family in the country on
// one tick. Each now leaves by express from where the record has it come in, on the spring's schedule of stops and six-hour
// waits (sim/expresses.mjs `schedule`), and a word the record dates at San Felipe leaves the army in time to be there then
// (sim/directors.mjs `leaveInTime`). What follows a word waits for each family's own hearing of it; the class's end waits a day
// at most for every played family to hear of San Jacinto (and, kept the same way, of Béxar); and a word still on the road when
// the first period ends has come in by the winter.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { WORD_HOLD_MINUTES, momentOf } from '../sim/directors.mjs';
import { findPath } from '../sim/geography.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { spring } from './support/scrape-spring.mjs';
import { sendSouth, winterClass } from './support/south.mjs';

const until = (world, done, limit = 20000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };
/** The minute a family's journal first had this word, a rumour or not; or with `status`, first had it at that status. */
const firstHeard = (world, householdId, topicId, status = null) => world.events.find(event => event.type === 'information' && event.householdId === householdId && event.topicId === topicId && (!status || event.status === status))?.minute ?? null;

let autumnShared = null, winterShared = null;
/** A real-land class of fifteen rolled families nobody plays, through the first period to its end. */
const autumn = () => structuredClone(autumnShared ??= (() => {
  const world = createGonzalesWorld('all-riders', 15, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  return world;
})());
/** The same class continued through the winter to the night Gonzales burns. */
const winter = () => structuredClone(winterShared ??= (() => {
  const world = autumn();
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  return world;
})());

/** Each word, where it leaves from, and the moment of the thing itself, which nobody may hear of before. */
const AUTUMN = [
  { key: 'goliad-taken', from: 'goliad', after: 'goliad' },
  { key: 'concepcion-fight', from: 'bexar', after: 'concepcion' },
  { key: 'silver-train', from: 'bexar', after: 'grass-alarm' },
  { key: 'grass-fight', from: 'bexar', after: 'grass-fight' },
  { key: 'grass-fight#news', topic: 'grass-fight', status: 'confirmed', from: 'bexar', after: 'grass-fight' },
  { key: 'bexar-storming', from: 'bexar', after: 'assault' },
  { key: 'bexar-storming#victory', topic: 'bexar-storming', status: 'confirmed', from: 'bexar', after: 'capitulation', last: true },
];
const WINTER = [
  { key: 'winter-terms', from: 'san-felipe', after: 'winter-news' },
  { key: 'winter-bexar', from: 'bexar', after: 'winter-news' },
  { key: 'winter-council', from: 'san-felipe', after: 'winter-news' },
  { key: 'winter-travis', from: 'bexar', after: 'travis-news' },
  { key: 'winter-crockett', from: 'bexar', after: 'crockett-news' },
  { key: 'winter-grass', from: 'bexar', after: 'spring-grass' },
  { key: 'bexar-arrival', from: 'gonzales', after: 'arrival-gonzales' },
  { key: 'alamo-siege', from: 'gonzales', after: 'travis-gonzales' },
  { key: 'fannin-back', from: 'goliad', after: 'fannin-back' },
  { key: 'san-patricio', from: 'goliad', after: 'san-patricio-news' },
  { key: 'agua-dulce', from: 'goliad', after: 'agua-dulce-news' },
  { key: 'declaration', from: 'washington', after: 'declaration-news' },
];
/** Checks one word: by express from its place, never heard before the thing itself, and heard days apart across the class. */
function carried(world, { key, topic = key, status = null, from, after, last = false }, households) {
  const state = world.expresses?.[key];
  assert.ok(state?.word, `${key} was told to every family at once, not carried by express`);
  assert.equal(state.from, from, `${key} left from ${state.from}, not ${from}`);
  const heard = households.map(household => firstHeard(world, household.id, topic, status)).filter(Number.isFinite);
  // The period's last word (`last`) is still on the road to some families nobody plays when it ends: they hear over the winter.
  assert.ok(heard.length >= (last ? 2 : households.length - 1), `${key} reached only ${heard.length} of ${households.length} families`);
  for (const minute of heard) assert.ok(minute >= momentOf(world, after), `a family heard ${key} before ${after}`);
  const spread = Math.max(...heard) - Math.min(...heard);
  assert.ok(spread >= 12 * 60, `${key} reached the first family and the last only ${Math.round(spread / 60)} hours apart`);
  return heard;
}

test('the autumn\'s news goes by express from Goliad and the army before Béxar, reaching families days apart and nobody before it happened; San Felipe hears the storming on the record\'s dates', () => {
  const world = autumn();
  const families = Object.values(world.households);
  for (const word of AUTUMN) carried(world, word, families);
  // The record dates the Béxar express and the victory at San Felipe (`HIST-TEX-044`): each left the army in time to be there then,
  // within a tick of the calendar before Béxar (twelve hours), and never before the thing itself.
  for (const [key, anchor] of [['bexar-storming', 'bexar-express'], ['bexar-storming#victory', 'bexar-victory'], ['grass-fight', 'grass-rumour'], ['grass-fight#news', 'grass-news']]) {
    const due = world.expresses[key].due['san-felipe'];
    assert.ok(Number.isFinite(due), `${key} never came to San Felipe`);
    assert.ok(Math.abs(due - momentOf(world, anchor)) <= 720, `${key} came to San Felipe ${Math.round((due - momentOf(world, anchor)) / 60)} hours from the record's date`);
  }
  // In the order of the roads: a family of a settlement nearer Béxar hears of the victory before one farther off.
  const road = household => findPath(world.map, 'bexar', household.settlementId)?.distance ?? 0;
  const byRoad = [...families].sort((a, b) => road(a) - road(b));
  const [near, far] = [byRoad[0], byRoad.at(-1)];
  assert.ok(firstHeard(world, near.id, 'bexar-storming', 'confirmed') < (firstHeard(world, far.id, 'bexar-storming', 'confirmed') ?? Infinity), `${near.settlementId} did not hear of the victory before ${far.settlementId}`);
  // The wrong express first, then the victory, for every family that heard both.
  for (const household of families) {
    const [rumour, victory] = [firstHeard(world, household.id, 'bexar-storming', 'rumor'), firstHeard(world, household.id, 'bexar-storming', 'confirmed')];
    if (Number.isFinite(rumour) && Number.isFinite(victory)) assert.ok(rumour < victory, `${household.id} heard the victory before the wrong express`);
  }
  validateWorld(world);
});

test('word still on the road when the autumn ends has come in by the winter, and nobody is told what became of their own before they hear it', () => {
  const world = autumn();
  const families = Object.values(world.households);
  const stragglers = families.filter(household => world.knowledge.households[household.id]['bexar-storming']?.status !== 'confirmed');
  assert.ok(stragglers.length, 'every family had heard of the victory by the end of the autumn, so nothing is left to come in over the winter');
  // Nobody plays these, so the end did not wait for them. A family with somebody at the storming is told what became of them
  // only when the word of the victory reaches it (a killed man's family: tests/battle-bexar.test.mjs).
  for (const outcome of world.army?.storming?.outcomes || []) {
    const householdId = world.entities[outcome.id]?.householdId;
    const heard = householdId && firstHeard(world, householdId, 'bexar-storming', 'confirmed');
    const told = world.events.filter(event => event.householdId === householdId && event.actorId === outcome.id && /storming of Béxar|held the camp at the old mill/.test(event.text) && event.claimId === 'FIC-GONZ-041');
    for (const event of told) assert.ok(Number.isFinite(heard) && event.minute >= heard, `${householdId} was told of its own at the storming before the word came`);
  }
  beginSecondPeriod(world);
  for (const household of stragglers) {
    const known = world.knowledge.households[household.id]['bexar-storming'];
    assert.equal(known?.status, 'confirmed', `${household.id} never heard of the victory, even over the winter`);
    assert.equal(known.source, 'Word that came over the winter');
  }
  assert.ok(!Object.values(world.entities).some(entity => entity.express?.topicId?.startsWith('bexar-storming')), 'a rider was still carrying the autumn\'s word in January');
  validateWorld(world);
});

test('the winter\'s news and the spring\'s first word go by express from San Felipe, Béxar, Gonzales, Goliad and Washington, days apart and never early', () => {
  const world = winter();
  const families = Object.values(world.households);
  for (const word of WINTER) carried(world, word, families);
  // Travis's letter: at Gonzales first, the rest of the country from its own settlement's riders after.
  const gonzales = families.find(household => household.settlementId === 'gonzales');
  const far = families.filter(household => household.settlementId !== 'gonzales');
  for (const household of far) assert.ok(firstHeard(world, household.id, 'alamo-siege') > firstHeard(world, gonzales.id, 'alamo-siege'), `${household.settlementId} heard Travis's letter with Gonzales`);
  // And not all on the evening the other settlements used to be told (the tick the public report was made then): the farthest after.
  const evening = world.events.find(event => event.type === 'information' && event.visibility === 'public' && event.topicId === 'bexar-arrival')?.minute;
  assert.ok(Number.isFinite(evening) && evening >= momentOf(world, 'travis-colonies'), 'the public report of the 26th was not made');
  assert.ok(far.some(household => firstHeard(world, household.id, 'alamo-siege') > evening), 'every family away from Gonzales had Travis\'s letter by the evening of the 26th');
  assert.ok(far.some(household => /Travis's letter, carried on from Gonzales, and on from /.test(world.knowledge.households[household.id]['alamo-siege']?.source || '')), 'no family says where the letter was carried on from');
  validateWorld(world);
});

test('a family is told what became of its own men in the south only when the rumour of their fight reaches it', () => {
  const world = winterClass();
  const { sent } = sendSouth(world, 4);
  assert.ok(sent.length >= 3, 'the class could not send men south');
  const watched = sent.map(man => man.id);
  let later = 0;
  for (let t = 0; t < 20000 && world.status === 'running'; t++) {
    stepWorld(world);
    for (const id of watched) {
      const man = world.entities[id], fight = man.service?.party || man.service?.escapedFrom;
      if (!fight) continue;
      const heard = world.knowledge.households[man.householdId]?.[fight];
      if (!heard) {
        assert.ok(!['dead', 'captured'].includes(man.health.condition), `${man.name}'s family saw him ${man.health.condition} before the word of ${fight} reached it`);
        assert.ok(!world.battles?.[fight]?.told?.[man.householdId], `${man.name}'s family was told of ${fight} before the word reached it`);
      } else if (heard.receivedMinute > momentOf(world, `${fight}-news`)) later++;
    }
    if (world.director.milestones['agua-dulce-news'] && watched.every(id => { const man = world.entities[id], fight = man.service?.party || man.service?.escapedFrom; return !fight || world.knowledge.households[man.householdId]?.[fight]; })) break;
  }
  assert.ok(later, 'every family heard on the day the word left Goliad, so the order was never put to the test');
  for (const id of watched) {
    const man = world.entities[id], fight = man.service?.party;
    if (!fight || !man.service?.fate || man.service.kind === 'fannin') continue;
    assert.equal(man.health.condition, man.service.fate === 'killed' ? 'dead' : 'captured', `${man.name} was not ${man.service.fate} once the word came`);
  }
  validateWorld(world);
});

/**
 * The spring, with one played family's people standing at `siteId` from before the word of San Jacinto leaves, and the word
 * delayed on its road by `delay` minutes past the camp (a stand-in for a road longer than the map has): run to the end.
 */
function holdScene(delay) {
  const world = spring();
  const household = Object.values(world.households).find(one => one.members.some(id => world.entities[id]?.kind === 'person'));
  const bexar = world.map.sites.bexar;
  const pin = () => {
    for (const person of household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person' && one.health.condition !== 'dead')) {
      Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: bexar.x, y: bexar.y, siteId: 'bexar' } });
    }
  };
  until(world, () => world.minute >= momentOf(world, 'santa-anna-taken') - calendarMinutes(world) * 2, 6000);
  for (const other of Object.values(world.households)) delete other.played;
  household.played = true;
  pin();
  until(world, () => { pin(); return world.expresses?.['san-jacinto']; }, 200);
  const state = world.expresses['san-jacinto'];
  for (const stop of Object.keys(state.due)) if (stop !== state.from) state.due[stop] += delay;
  until(world, () => { if (!world.knowledge.households[household.id]['san-jacinto']) pin(); return world.director.complete; }, 2000);
  return { world, household };
}

test('the class\'s end waits, a day at most, until every played family has heard of San Jacinto', () => {
  // The word reaching the played family after dawn on April 25: the end waits for it.
  const { world, household } = holdScene(1200);
  const end = momentOf(world, 'scrape-end');
  const heard = firstHeard(world, household.id, 'san-jacinto');
  assert.ok(heard > end, `the family heard at ${heard}, before the end at ${end}, so the end had nothing to wait for`);
  assert.equal(world.status, 'ended');
  const ended = world.events.find(event => event.type === 'slice-preserved' && event.minute >= end);
  assert.ok(ended && ended.minute >= heard, 'the class ended before the played family heard of San Jacinto');
  assert.ok(ended.minute <= end + WORD_HOLD_MINUTES, 'the end waited more than a day');
  assert.match(ended.text, /^April 2[56], 1836\. The war is won/);
  assert.ok(projectWorld(world, household.id, 'student', { includeMap: false }).reports.some(report => report.topicId === 'san-jacinto'), 'the played family was not sent the word before the end');
  // A word that could not come inside the day: the end waits the day and no more.
  const { world: late, household: lateFamily } = holdScene(4 * 1440);
  const lateEnd = late.events.find(event => event.type === 'slice-preserved' && event.minute >= end);
  assert.ok(lateEnd, 'the class never ended');
  // Within a tick of the spring's four-hour calendar.
  assert.ok(lateEnd.minute >= end + WORD_HOLD_MINUTES && lateEnd.minute <= end + WORD_HOLD_MINUTES + 240, `the end came at ${lateEnd.minute - end} minutes past dawn, not a day`);
  assert.equal(late.knowledge.households[lateFamily.id]['san-jacinto'], undefined, 'the family heard a word still on the road');
  validateWorld(world);
});
