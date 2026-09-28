// Disease: docs/DISEASE.md, the owner's request of 2026-09-27 ("also, plan for diseases. keep it historical as to which
// ones. stopping to rest should help characters recover.") and the owner's answers of the same day (sim/disease.mjs heads
// them). One test or more for each build step of docs/DISEASE.md §6, each seen failing under the injection that
// scripts/disease-injections.mjs names for it (docs/evidence/disease-injections.json).
//
// Build step 0 first: a sickness mends wherever the sick person is. Until 2026-09-27 a `sick` state was mended only inside
// the road's own loop (sim/scrape.mjs `advanceFlight`), so somebody made sick at home by a norther, or a man serving with the
// army, stayed sick for the rest of the class (docs/DISEASE.md §1.5).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { weatherAt } from '../sim/weather.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { whereWords, familiesOverview } from '../sim/host.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { thinkFor } from '../sim/neighbours.mjs';
import { TRADES, counterRefusal } from '../sim/shops.mjs';
import { panelActions, needsOf } from '../public/family-panel.js';
import { entityClip, visualVariant } from '../public/motion.js';
import {
  CROWDS, DISEASES, DISEASE_IDS, MEND, RISK, WORD_MILES_A_DAY, activityOf, advanceDisease, campedApart, canTake, classSickness, crowdHere, mendSickness,
  deathsAllowed, doctorSees, fallSick, fouledCamp, frostDay, hadIt, hadShare, homeCauses, minuteOn, onBottomland, riskWeight, roadSickness,
  sickWords, sicknessDay, sicknessShown, studiedRates,
} from '../sim/disease.mjs';
import { patchAt, woodsRule } from '../sim/woods.mjs';
import { landAround } from '../sim/ground.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const history = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');
const landed = (seed, count = 8) => {
  const world = settle(createGonzalesWorld(seed, count, { map: 'colonies' }));
  world.status = 'running';
  return world;
};
const people = (world, household) => household.members.map(id => world.entities[id]);
const grown = (world, household) => people(world, household).find(person => (person.age ?? 30) >= 16 && person.health.condition === 'well');
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
/** Step while something holds, for at most this many minutes of the calendar. */
const stepWhile = (world, holds, minutes, limit = 5000) => { const end = world.minute + minutes; for (let tick = 0; tick < limit && world.minute < end && holds(); tick++) stepWorld(world); };
const dayOf = world => Math.floor(world.minute / DAY);
/** A person the dice can be asked about without being one of the class: an id, a name, an age, a place and a sickness. */
const stranger = (world, household, id, { age = 30, health = { condition: 'well' }, task = 'rest' } = {}) => ({
  id, kind: 'person', name: `P${id}`, householdId: household.id, age, task, health, location: { ...world.entities[household.members[0]].location },
});

// ------------------------------------------------------------------------------------------------ step 0

test('step 0: somebody sick at home is well again once the sickness has run its course', () => {
  const world = landed('sick-home');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  person.health = { condition: 'sick', recoversAt: world.minute + 2 * DAY };
  // However it goes - resting, working, very sick for a day or two (build step 2) - it has run its course in twelve days.
  stepWhile(world, () => person.health.condition === 'sick', 12 * DAY);
  assert.notEqual(person.health.condition, 'sick', `still sick twelve days on (at home, ${person.location.siteId})`);
  validateWorld(world);
});

test('step 0: a man serving with the army who is sick mends in the camp', () => {
  const world = landed('sick-serving');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  // Serving at San Felipe, as a family's man serving with the army stands there (tests/scrape.test.mjs does the same).
  person.service = { kind: 'auxiliary-war', status: 'serving', siteId: 'san-felipe' };
  const site = world.map.sites['san-felipe'];
  person.location = { x: site.x, y: site.y, siteId: 'san-felipe' };
  person.health = { condition: 'sick', recoversAt: world.minute + 2 * DAY };
  stepWhile(world, () => person.health.condition === 'sick', 12 * DAY);
  assert.notEqual(person.health.condition, 'sick', 'a man with the army never mends');
});

test('step 0: somebody made sick by a norther with no roof up mends', () => {
  const world = landed('sick-cold', 20);
  for (const household of Object.values(world.households)) household.improvements = { ...household.improvements, cabin: 'none' };
  const home = world.map.sites[Object.values(world.households)[0].homeSiteId];
  let norther = -1;
  for (let day = 1; day < 210; day++) if (weatherAt(world, home, day).kind === 'norther') { norther = day; break; }
  assert.ok(norther > 0, 'this class never saw a norther');
  // Stood in the northers a day at a time, as tests/cold.test.mjs does, until somebody falls sick of the cold.
  let fell = null;
  for (let day = norther; day < norther + 60 && !fell; day++) {
    world.minute = day * DAY + 9 * 60;
    for (let tick = 0; tick < 2; tick++) stepWorld(world);
    const event = world.events.find(one => /no roof up yet/.test(one.text || ''));
    if (event) fell = world.entities[event.actorId];
  }
  assert.ok(fell, 'nobody fell sick of the cold in sixty days under canvas');
  assert.equal(fell.health.condition, 'sick');
  assert.equal(fell.health.disease, 'lung-fever', 'the cold at home is not a chill on the chest');
  stepWhile(world, () => fell.health.condition === 'sick', 12 * DAY);
  assert.notEqual(fell.health.condition, 'sick', 'somebody made sick by the cold at home never mended');
});

/**
 * A family set on the road east at once, without playing two class periods to get there: the third period's flight on a
 * settled class (`flee`, sim/scrape.mjs), nothing loaded, for the nearest refuge. The calendar is the autumn's; what these
 * tests hold is the road's own loop, not the spring's dates.
 */
function onTheRoad(seed, count = 5) {
  const world = landed(seed, count);
  world.period = 3;
  const household = Object.values(world.households)[0];
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = flightProjection(world, household).refuges.sort((a, b) => a.miles - b.miles)[0].id;
  flee(world, household, { take: {}, refuge });
  return { world, household };
}

test('step 0: on the road a sickness is still mended, and exactly once', () => {
  const { world, household } = onTheRoad('sick-road');
  const person = people(world, household).find(one => one.travel?.purpose === 'flee' && (one.age ?? 30) >= 16);
  person.health = { condition: 'sick', recoversAt: world.minute + DAY };
  stepWhile(world, () => person.health.condition === 'sick', 12 * DAY);
  assert.notEqual(person.health.condition, 'sick', 'the road no longer mends anybody');
  const mended = world.events.filter(event => event.actorId === person.id && /is well again|is over /.test(event.text || ''));
  assert.equal(mended.length, 1, `mended ${mended.length} times`);
});

// ------------------------------------------------------------------------------------------------ step 1: the names

test('step 1: five diseases, each with a name, a course and a registered claim; cholera, smallpox and yellow fever are not among them', () => {
  assert.deepEqual([...DISEASE_IDS].sort(), ['ague', 'flux', 'lung-fever', 'measles', 'whooping-cough']);
  const registered = id => new RegExp(`^\\| \\*\\*${id}\\*\\* \\|`, 'm').test(history);
  for (const id of DISEASE_IDS) {
    const spec = DISEASES[id];
    assert.ok(spec.name && spec.short, `${id} has no name`);
    assert.ok(spec.days > 0 && spec.worsen > 0 && spec.worsen < 1 && spec.death > 0 && spec.death < 1, `${id} has no course`);
    assert.ok(registered(spec.claimId), `${id}'s claim ${spec.claimId} is not registered in HISTORY.md`);
  }
  for (const crowd of CROWDS) assert.ok(registered(crowd.claimId), `${crowd.id}'s claim ${crowd.claimId} is not registered`);
  for (const id of ['HIST-TEX-661', 'HIST-TEX-662', 'HIST-TEX-663', 'HIST-TEX-664', 'HIST-TEX-665', 'HIST-TEX-666', 'HIST-TEX-667',
    'FIC-GONZ-661', 'FIC-GONZ-662', 'FIC-GONZ-663', 'FIC-GONZ-664', 'FIC-GONZ-665', 'FIC-GONZ-666', 'FIC-GONZ-667', 'FIC-GONZ-668']) {
    assert.ok(registered(id), `${id} is not registered in HISTORY.md`);
  }
  // None of the diseases the record does not have in 1835-36 (docs/DISEASE.md §2.1, `HIST-TEX-667`).
  for (const out of ['cholera', 'smallpox', 'yellow', 'typhoid', 'scurvy']) assert.ok(!DISEASE_IDS.some(id => id.includes(out)), `${out} is in play`);
});

test('step 1: a class saved before the diseases opens, and its bare sickness mends as a chill on the chest; a sickness that cannot be is refused', () => {
  const world = landed('sick-old-save');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  // Exactly what a class saved before 2026-09-27 holds: a sickness with no name, and nothing else of this module's.
  person.health = { condition: 'sick', recoversAt: world.minute + 2 * DAY };
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  assert.equal(reopened.saveVersion, world.saveVersion, 'the save version moved');
  const again = reopened.entities[person.id];
  assert.equal(again.health.recoversAt, person.health.recoversAt, 'a class saved mid-sickness lost its mending day');
  assert.match(sicknessShown(reopened, again).sickness.line, /^Sick: /, 'a bare sickness is not shown as plain sick');
  assert.equal(sickWords(again), 'sick, ');
  stepWhile(reopened, () => again.health.condition === 'sick', 12 * DAY);
  assert.notEqual(again.health.condition, 'sick', 'an old save\'s sickness never mends');
  // And what cannot be is refused, each field only when present.
  const bad = (change, why) => { const copy = JSON.parse(JSON.stringify(world)); change(copy.entities[person.id], copy); assert.throws(() => validateWorld(copy), why); };
  bad(one => { one.health.disease = 'cholera'; }, /Unknown sickness/);
  bad(one => { one.health.grave = true; }, /Invalid very sick/);
  bad(one => { one.had = ['smallpox']; }, /Invalid sickness had/);
  bad(one => { one.exposed = { measles: 'soon' }; }, /Invalid exposure/);
  bad((one, copy) => { copy.households[household.id].sickFood = -1; }, /Invalid sick-food/);
});

test('step 1: the family and the Host are told the sickness by name', () => {
  const world = landed('sick-names');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  fallSick(world, person, 'measles');
  assert.ok(world.events.some(event => event.actorId === person.id && /has the measles/.test(event.text)), 'the family was not told the name');
  assert.match(whereWords(world, person, household), /^sick with the measles, at home/);
  const shown = sicknessShown(world, person).sickness;
  assert.equal(shown.name, 'measles');
  assert.match(shown.line, /^Has the measles: resting/);
  // The projection carries it to the row.
  assert.match(view(world, household.id).entities.find(one => one.id === person.id).sickness.line, /measles/);
  person.health.grave = true; person.health.graveDay = dayOf(world);
  assert.match(whereWords(world, person, household), /^very sick with the measles, /);
});

// ------------------------------------------------------------------------------------------------ step 2: rest

test('step 2: rest is twice the mending and half the risk; riding once; walking or working half and double', () => {
  assert.deepEqual(MEND, { rest: 2, ride: 1, work: 0.5 });
  assert.deepEqual(RISK, { rest: 0.5, ride: 1, work: 2 });
  const child = { id: 'c', age: 3, health: { condition: 'sick', disease: 'measles' } };
  assert.equal(riskWeight(child, 'measles', { activity: 'work' }) / riskWeight(child, 'measles', { activity: 'rest' }), 4);
  assert.equal(riskWeight(child, 'measles', { activity: 'ride' }) / riskWeight(child, 'measles', { activity: 'rest' }), 2);
  // What each thing a person can be doing counts as.
  const world = { minute: 0, households: {} };
  assert.equal(activityOf(world, { task: 'rest' }), 'rest', 'somebody idle at home is not resting');
  assert.equal(activityOf(world, { task: 'work' }), 'work');
  assert.equal(activityOf(world, { task: 'work', chore: { id: 'hunt-timber' } }), 'work');
  assert.equal(activityOf(world, { task: 'work', chore: { id: 'rest-road' } }), 'rest', 'calling the halt to rest is work');
  assert.equal(activityOf(world, { travel: { halted: true, afoot: true } }), 'rest', 'a family held on the road is not resting');
  assert.equal(activityOf(world, { travel: { rides: 'w1' } }), 'ride');
  assert.equal(activityOf(world, { travel: { carried: 'm1' } }), 'ride');
  assert.equal(activityOf(world, { travel: { afoot: true, mode: 'wagon' } }), 'work');
  assert.equal(activityOf(world, { travel: { mode: 'foot' } }), 'work');
});

test('step 2: on the calendar, a resting patient is well in half the days, and a working one takes twice as long', () => {
  // An adult with the whooping cough, which never turns very sick past infancy, so nothing but the mending is being measured.
  const days = task => {
    const world = landed('sick-rest');
    const household = Object.values(world.households)[0];
    const person = grown(world, household);
    person.task = task;
    const from = world.minute;
    person.health = { condition: 'sick', recoversAt: from + 4 * DAY, disease: 'whooping-cough' };
    stepWhile(world, () => person.health.condition === 'sick', 12 * DAY);
    assert.notEqual(person.health.condition, 'sick');
    return (world.minute - from) / DAY;
  };
  const resting = days('rest'), working = days('work');
  assert.ok(Math.abs(resting - 2) < 0.1, `four days of sickness took ${resting} days resting, not two`);
  assert.ok(Math.abs(working - 8) < 0.1, `four days of sickness took ${working} days working, not eight`);
});

/** Many sick people run through many days of the road's rule, with the worst of everything: very young, hungry, cold, walking. */
function worstDays(world, household, { days = 12, count = 300, nursed = false, period = 3 } = {}) {
  world.period = period;
  const out = { deaths: 0, early: [], nursedDied: 0, grave: 0 };
  for (let i = 0; i < count; i++) {
    const person = stranger(world, household, `worst-${i}`, { age: 1, task: 'work', health: { condition: 'sick', recoversAt: world.minute + 99 * DAY, disease: 'lung-fever' } });
    let graveSince = null;
    for (let day = 100; day < 100 + days && person.health.condition === 'sick'; day++) {
      if (nursed) person.health.nursed = day;
      const before = person.health.grave ? person.health.graveDay : null;
      sicknessDay(world, household, person, { day, hungry: true, cold: true, where: 'road' });
      if (person.health.grave && graveSince === null) { graveSince = day; out.grave++; }
      if (person.health.condition === 'dead') {
        out.deaths++;
        if (nursed) out.nursedDied++;
        // Dead only from very sick, and only on a day after the one it was seen.
        if (before === null || before >= day) out.early.push({ id: person.id, day, before });
      }
    }
  }
  return out;
}

test('step 2: nobody dies of being sick - only of being very sick, which the family saw a day before', () => {
  const world = landed('sick-worst');
  const household = Object.values(world.households)[0];
  const spotlit = world.spotlight;
  const out = worstDays(world, household);
  assert.ok(out.grave > 50, `the worst case hardly ever turned very sick (${out.grave} of 300): nothing is being tested`);
  assert.ok(out.deaths > 10, `nobody in the worst case died (${out.grave} very sick): nothing is being tested`);
  assert.deepEqual(out.early, [], 'somebody died of a sickness without being very sick the day before');
  // Told plainly, and never to the Host's camera (the owner, 2026-09-27).
  assert.ok(world.events.some(event => event.sickness === 'died' && /died of a chill on the chest/.test(event.text)));
  assert.equal(world.spotlight, spotlit, 'a death from sickness was spotlit');
});

test('step 2: nursing keeps the very sick alive, and brings one who also rests past the worst', () => {
  const world = landed('sick-nursed');
  const household = Object.values(world.households)[0];
  const out = worstDays(world, household, { nursed: true });
  assert.ok(out.grave > 50, 'nobody turned very sick');
  assert.equal(out.nursedDied, 0, `${out.nursedDied} died while nursed`);
  // Nursed and resting: past the worst the next day.
  world.period = 3;
  const person = stranger(world, household, 'nursed-rest', { age: 1, task: 'rest', health: { condition: 'sick', recoversAt: world.minute + 9 * DAY, disease: 'measles', grave: true, graveDay: 199 } });
  person.health.nursed = 200;
  sicknessDay(world, household, person, { day: 200 });
  assert.equal(person.health.condition, 'sick');
  assert.equal(person.health.grave, undefined, 'nursed and resting, still very sick');
  assert.ok(world.events.some(event => event.actorId === person.id && /past the worst/.test(event.text)));
});

test('step 2: "Stop and rest a day" halts the family on the road, for its sick or tired, and not at its refuge', () => {
  const { world, household } = onTheRoad('sick-rest-road');
  const main = world.entities[household.mainId || household.principalId];
  const offered = () => view(world, household.id).work[main.id].find(entry => entry.id === 'rest-road');
  assert.equal(offered()?.can, false);
  assert.match(offered().why, /Nobody with the family is sick or tired/);
  const patient = people(world, household).find(one => one.id !== main.id && one.travel?.purpose === 'flee');
  patient.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY, disease: 'lung-fever' };
  assert.equal(offered().can, true, offered().why);
  applyAction(world, household.id, { action: 'chore', entityId: main.id, chore: 'rest-road' });
  assert.equal(main.chore?.id, 'rest-road', 'the halt is not on the main person, so nothing glows');
  const progress = patient.travel.progress;
  const left = () => (patient.health.recoversAt - world.minute) / DAY;
  const from = { minute: world.minute, left: left() };
  stepWorld(world);
  assert.equal(patient.travel.halted, true, 'the family was not halted');
  assert.equal(patient.travel.progress, progress, 'the family made miles while resting');
  assert.equal(activityOf(world, patient), 'rest', 'the sick are not resting while the family rests');
  assert.match(sicknessShown(world, patient).sickness.line, /resting/);
  stepWhile(world, () => Boolean(main.chore), DAY);
  // Every tick the family stood still is a tick of rest for the sick, to the last one: two days of mending a day.
  assert.equal(patient.travel.progress, progress, 'the family made miles while resting');
  const rate = (from.left - left()) / ((world.minute - from.minute) / DAY);
  assert.ok(Math.abs(rate - 2) < 1e-6, `the rest mended ${rate} days a day, not two`);
  stepWhile(world, () => household.flight.status === 'fled', 10 * DAY);
  assert.equal(household.flight.status, 'refuged');
  assert.match(offered()?.why || '', /camped at its refuge/);
});

test('step 2: a sick person may work, with the warning; a very sick person cannot get up or go anywhere', () => {
  const world = landed('sick-work');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  person.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY, disease: 'flux' };
  const work = view(world, household.id).work[person.id];
  const open = work.find(entry => entry.can);
  assert.ok(open, 'a sick person may not be sent to anything');
  const shown = view(world, household.id).entities.find(one => one.id === person.id);
  assert.match(shown.sickness.warn, /Working slows/);
  const icons = panelActions({ entity: shown, offered: work, catalogue: new Map() });
  assert.match(icons.find(icon => icon.key === open.id).note, /Working slows/, 'the warning is not on the work');
  person.health.grave = true; person.health.graveDay = dayOf(world);
  assert.equal(choreAvailability(world, household, person, open.id).can, false);
  assert.match(choreAvailability(world, household, person, open.id).why, /too sick to get up/);
  assert.throws(() => beginTravel(world, person, 'gonzales'), /too sick to get up/);
  const graveShown = view(world, household.id).entities.find(one => one.id === person.id);
  assert.deepEqual(needsOf({ entities: [graveShown] }, person.id).map(need => need.kind), ['sick'], 'no "!" for somebody very sick');
});

test('step 2: sick and left alone at home is resting: work about the place stops when the sickness comes, and the sick lie down', () => {
  const world = landed('sick-bed');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  person.task = 'work';
  fallSick(world, person, 'lung-fever');
  assert.equal(person.task, 'rest');
  assert.equal(activityOf(world, person), 'rest');
  assert.match(entityClip({ ...person, health: person.health }).id, /-injured-rest$/, 'the resting sick are not drawn lying down');
  person.task = 'work';
  assert.doesNotMatch(entityClip({ ...person, health: person.health }).id, /-injured-rest$/, 'somebody sick at work is drawn lying down');
});

// ------------------------------------------------------------------------------------------------ step 3: within a family

test('step 3: measles in the family: who can take it does, ten to twelve days on, and nobody who has had it', () => {
  const world = landed('sick-family', 12);
  let exposedSeen = 0, tookSeen = 0;
  for (const household of Object.values(world.households)) {
    const members = people(world, household);
    // Small children, few of whom have had it (`hadShare`), and one who certainly has.
    members.forEach((person, i) => { person.age = [3, 2, 4, 1, 5, 2][i % 6]; delete person.had; });
    const had = members[1];
    had.had = ['measles'];
    const first = members.find(person => person !== had && canTake(world, person, 'measles'));
    if (!first) continue;
    const start = world.minute;
    fallSick(world, first, 'measles');
    if (members.some(one => one.exposed?.measles)) assert.ok(world.events.some(event => event.householdId === household.id && /Measles is in the family/.test(event.text)), 'the family was not told');
    assert.equal(had.exposed, undefined, 'somebody who has had the measles was exposed');
    // In the order they come out, so no one's day is passed over on the way to another's.
    const due = members.filter(one => one.exposed?.measles).map(one => [one, one.exposed.measles]).sort((a, b) => a[1] - b[1]);
    for (const [person, at] of due) {
      exposedSeen++;
      assert.ok(at >= start + 10 * DAY && at < start + 13 * DAY, `${person.id} takes it ${(at - start) / DAY} days on`);
      world.minute = at - 60; advanceDisease(world);
      if (person.health.disease === 'measles' && person.health.since < at) assert.fail('taken before its day');
      world.minute = at; advanceDisease(world);
      assert.equal(person.health.disease, 'measles', 'not taken on its day');
      tookSeen++;
    }
    world.minute = start;
  }
  assert.ok(exposedSeen > 5 && tookSeen === exposedSeen, `only ${exposedSeen} exposed in twelve families`);
});

test('step 3: who has had the measles is dealt by age from the class seed, shown, and never written until taken', () => {
  const world = landed('sick-had');
  for (const age of [1, 4, 8, 12, 20, 40]) {
    let had = 0;
    const n = 3000;
    for (let i = 0; i < n; i++) if (hadIt(world, { id: `had-${age}-${i}`, age }, 'measles')) had++;
    assert.ok(Math.abs(had / n - hadShare('measles', age)) < 0.03, `age ${age}: ${had / n} had it against ${hadShare('measles', age)}`);
  }
  assert.ok(hadShare('measles', 40) > hadShare('measles', 4), 'the grown have had it less than small children');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  delete person.had;
  const dealt = hadIt(world, person, 'measles');
  assert.equal(person.had, undefined, 'dealing wrote a field onto an old save');
  assert.equal(Boolean(sicknessShown(world, person).hadMeasles), dealt, 'what was dealt is not what the card shows');
  person.had = ['measles'];
  assert.equal(canTake(world, person, 'measles'), false, 'somebody who has had the measles can take it');
});

test('step 3: whooping cough is a child\'s sickness, dangerous only to babies', () => {
  const world = landed('sick-whoop');
  assert.equal(canTake(world, { id: 'w-12', age: 12, health: { condition: 'well' } }, 'whooping-cough'), false, 'a child of twelve can take whooping cough');
  assert.equal(canTake(world, { id: 'w-0', age: 0, health: { condition: 'well' } }, 'whooping-cough'), true);
  assert.equal(riskWeight({ age: 4 }, 'whooping-cough'), 0, 'whooping cough can turn a child of four very sick');
  assert.ok(riskWeight({ age: 0 }, 'whooping-cough') > 0, 'whooping cough cannot turn a baby very sick');
});

// ------------------------------------------------------------------------------------------------ step 4: the crowded places

/** Families of the class camped at a refuge on a day of 1836, the flight's own state written as the road writes it. */
function campedAtRefuge(world, refuge, [month, day], { days = 0 } = {}) {
  world.period = 3;
  world.minute = minuteOn(world, 1836, month, day);
  const site = world.map.sites[refuge];
  for (const household of Object.values(world.households)) {
    household.flight = { status: 'refuged', refuge, arrivedMinute: world.minute - days * DAY, crossed: [], leftMinute: world.minute - (days + 3) * DAY, mode: 'foot' };
    for (const person of people(world, household)) { person.travel = null; person.location = { x: site.x, y: site.y, siteId: refuge }; person.age = 3; delete person.had; }
  }
}
const exposedAfter = (world, days) => {
  for (let d = 0; d < days; d++) {
    const day = dayOf(world);
    for (const household of Object.values(world.households)) roadSickness(world, household, people(world, household), { day });
    world.minute += DAY;
  }
  return Object.values(world.entities).filter(one => one.exposed?.measles || one.exposed?.['whooping-cough']).length;
};

test('step 4: measles and whooping cough go round only at the record\'s places, on the record\'s dates', () => {
  const inWindow = landed('sick-trinity', 12);
  campedAtRefuge(inWindow, 'liberty', [3, 1]);
  assert.equal(crowdHere(inWindow, Object.values(inWindow.households)[0])?.id, 'trinity');
  assert.ok(exposedAfter(inWindow, 10) > 5, 'ten days among the families at the Trinity in April exposed nobody');
  const before = landed('sick-trinity', 12);
  campedAtRefuge(before, 'liberty', [1, 1]);
  assert.equal(crowdHere(before, Object.values(before.households)[0]), null);
  assert.equal(exposedAfter(before, 10), 0, 'measles went round at the Trinity in February');
  const elsewhere = landed('sick-trinity', 12);
  campedAtRefuge(elsewhere, 'nacogdoches', [3, 1]);
  assert.equal(exposedAfter(elsewhere, 10), 0, 'measles went round at Nacogdoches, where the record has none');
  // Those who took it at the Trinity are told so when it comes out.
  const one = Object.values(inWindow.entities).find(person => person.exposed?.measles && person.health.condition !== 'sick');
  inWindow.minute = one.exposed.measles; advanceDisease(inWindow, 0);
  assert.ok(inWindow.events.some(event => event.actorId === one.id && /taken among the families at the Trinity/.test(event.text)));
});

test('step 4: the flux comes after two days camped in a crowd, not one, and camping apart keeps a family out of it', () => {
  const world = landed('sick-flux', 5);
  campedAtRefuge(world, 'washington', [3, 1], { days: 1 });
  const household = Object.values(world.households)[0];
  assert.equal(fouledCamp(world, household), false, 'the water was fouled after one day');
  world.minute += DAY;
  assert.equal(fouledCamp(world, household), true, 'the water was not fouled after two days');
  household.flight.apart = 'washington';
  assert.equal(campedApart(world, household), true);
  assert.equal(fouledCamp(world, household), false, 'camped apart and still fouled');
  const trader = people(world, household)[0];
  trader.age = 30;
  const trade = choreAvailability(world, household, trader, 'trade-crossing');
  assert.match(trade.why || '', /camped apart/, 'camped apart and still trading with the crowd');
  household.flight.refuge = 'liberty';
  assert.equal(campedApart(world, household), false, 'camped apart at one place counts at the next');
});

test('step 4: nobody dies of a sickness in the first period - not at the siege of Béxar', () => {
  const world = landed('sick-bexar');
  const household = Object.values(world.households)[0];
  assert.equal(deathsAllowed({ period: 1 }), false);
  assert.equal(deathsAllowed({}), false, 'a class saved before the periods is not the first');
  assert.equal(deathsAllowed({ period: 2 }), true);
  const out = worstDays(world, household, { period: 1 });
  assert.ok(out.grave > 50, 'nobody turned very sick in the first period: nothing is being tested');
  assert.equal(out.deaths, 0, `${out.deaths} died of sickness in the first period`);
});

test('step 4: word of the sickness at the Trinity goes along the road with the families, and not faster', () => {
  const world = landed('sick-word', 6);
  world.period = 3;
  world.minute = minuteOn(world, 1836, 2, 25);
  const [there, far] = Object.values(world.households);
  const liberty = world.map.sites.liberty;
  there.flight = { status: 'refuged', refuge: 'liberty', arrivedMinute: world.minute - DAY };
  for (const person of people(world, there)) { person.travel = null; person.location = { x: liberty.x, y: liberty.y, siteId: 'liberty' }; }
  far.flight = { status: 'ordered', orderedMinute: world.minute };
  const home = world.map.sites[far.homeSiteId];
  const miles = Math.hypot(home.x - liberty.x, home.y - liberty.y);
  const knows = household => world.knowledge.households[household.id]['sickness-trinity'];
  let heardOn = null;
  for (let day = 1; day <= 30 && heardOn === null; day++) {
    delete world.diseaseDay;
    advanceDisease(world);
    if (day === 1) assert.equal(knows(there)?.status, 'confirmed', 'a family camped at the Trinity did not hear of it there');
    if (knows(far)) heardOn = day;
    world.minute += DAY;
  }
  assert.ok(heardOn, 'the word never reached a family at home');
  assert.equal(heardOn, Math.max(1, Math.ceil(miles / WORD_MILES_A_DAY)), `heard ${Math.round(miles)} miles off on day ${heardOn}`);
  assert.equal(knows(far).status, 'unconfirmed', 'word from a hundred miles off was confirmed');
});

test('step 4: Houston\'s camp in April has its measles and flux, and a sick man there rests', () => {
  const world = landed('sick-camp');
  const household = Object.values(world.households)[0];
  const man = grown(world, household);
  delete man.had; man.age = 1; // who never had it: the camp's measles is asked of him
  man.service = { kind: 'houston', status: 'serving', siteId: 'san-felipe' };
  world.period = 3;
  world.minute = minuteOn(world, 1836, 3, 5);
  const causes = homeCauses(world, household, man, dayOf(world)).map(cause => cause.disease);
  assert.ok(causes.includes('flux'), 'no flux in the camp in April');
  if (!hadIt(world, man, 'measles')) assert.ok(causes.includes('measles'), 'no measles in the camp in April');
  world.minute = minuteOn(world, 1836, 2, 20);
  assert.deepEqual(homeCauses(world, household, man, dayOf(world)), [], 'sickness in the camp before April');
});

// ------------------------------------------------------------------------------------------------ step 5: the ague

/** A family moved onto river-bottom land, and one onto the prairie, found by the woods themselves (sim/woods.mjs). */
function bottomAndPrairie(world) {
  const [bottom, prairie] = Object.values(world.households);
  const options = { rule: woodsRule(world), nearCreek: landAround().nearCreek };
  const find = want => {
    for (const site of Object.values(world.map.sites).filter(one => one.kind === 'town')) {
      for (let dx = -3; dx <= 3; dx += 0.0625) for (let dy = -3; dy <= 3; dy += 0.25) {
        const point = { x: site.x + dx, y: site.y + dy };
        if (want(patchAt(point, options).stand)) return point;
      }
    }
    return null;
  };
  const b = find(stand => stand === 'bottomland' || stand === 'bottomland-cane'), p = find(stand => /prairie/.test(stand));
  assert.ok(b && p, 'no river-bottom or prairie ground found near any town');
  Object.assign(world.map.sites[bottom.homeSiteId], b);
  Object.assign(world.map.sites[prairie.homeSiteId], p);
  for (const [household, point] of [[bottom, b], [prairie, p]]) for (const person of people(world, household)) person.location = { x: point.x, y: point.y, siteId: household.homeSiteId };
  return { bottom, prairie };
}

test('step 5: the chills and fever come to river-bottom homes in the autumn, not the prairie, and stop with the frost', () => {
  const world = landed('sick-ague', 5);
  const { bottom, prairie } = bottomAndPrairie(world);
  assert.equal(onBottomland(world, bottom), true);
  assert.equal(onBottomland(world, prairie), false);
  world.period = 1;
  world.minute = minuteOn(world, 1835, 9, 10);
  const ague = household => homeCauses(world, household, grown(world, household), dayOf(world)).some(cause => cause.disease === 'ague');
  assert.equal(ague(bottom), true, 'no chills and fever on the river bottom in October');
  assert.equal(ague(prairie), false, 'chills and fever on the prairie');
  world.minute = frostDay(world, bottom) * DAY + 60;
  assert.ok(frostDay(world, bottom) * DAY >= Math.floor(minuteOn(world, 1835, 10, 1) / DAY) * DAY, 'the frost came before November');
  assert.equal(ague(bottom), false, 'chills and fever after the frost');
  world.period = 2; world.minute = minuteOn(world, 1835, 9, 10);
  assert.equal(ague(bottom), false, 'the autumn fever in the winter period');
});

test('step 5: the chills and fever come back in the winter only to somebody who had them, and never after the bark', () => {
  const world = landed('sick-relapse');
  const household = Object.values(world.households)[0];
  let relapsed = 0, barkedRelapsed = 0;
  const n = 200;
  for (let i = 0; i < n; i++) {
    for (const barked of [false, true]) {
      const person = stranger(world, household, `ague-${i}-${barked}`);
      world.entities[person.id] = person; household.members.push(person.id);
      fallSick(world, person, 'ague');
      if (barked) doctorSees(world, person);
      person.health.recoversAt = world.minute;
      mendSickness(world, 0);
      assert.notEqual(person.health.condition, 'sick');
      if (Number.isFinite(person.relapse)) { if (barked) barkedRelapsed++; else relapsed++; }
      household.members.pop(); delete world.entities[person.id];
    }
  }
  assert.ok(Math.abs(relapsed / n - 0.4) < 0.1, `${relapsed} of ${n} had it again`);
  assert.equal(barkedRelapsed, 0, 'the bark did not keep the fever from coming back');
  // Somebody who had a chill on the chest, not the fever of the bottoms, has nothing to come back.
  const other = stranger(world, household, 'never-ague');
  world.entities[other.id] = other; household.members.push(other.id);
  fallSick(world, other, 'lung-fever');
  other.health.recoversAt = world.minute;
  mendSickness(world, 0);
  assert.equal(other.relapse, undefined, 'somebody who never had the chills and fever has them coming back');
});

// ------------------------------------------------------------------------------------------------ step 6: the doctor

test('step 6: the doctor sees the sick: the bark halves the chills and fever; calomel and bleeding leave the sick weaker', () => {
  const world = landed('sick-doctor');
  const household = Object.values(world.households)[0];
  const person = grown(world, household);
  household.resources.money = 5;
  person.health = { condition: 'sick', recoversAt: world.minute + 4 * DAY, disease: 'ague' };
  assert.equal(counterRefusal(world, household, person, 'doctor:see:coin'), null, 'the doctor refuses the sick');
  assert.match(TRADES.doctor.offers[0].does, /bark/);
  assert.match(TRADES.doctor.offers[0].does, /calomel/);
  const said = doctorSees(world, person);
  assert.equal(person.health.recoversAt, world.minute + 2 * DAY, 'the bark did not halve the chills and fever');
  assert.match(said, /quinine/);
  person.health = { condition: 'sick', recoversAt: world.minute + 4 * DAY, disease: 'measles' };
  const bled = doctorSees(world, person);
  assert.equal(person.health.recoversAt, world.minute + 6 * DAY, 'calomel and bleeding did not leave the sick two days further from mending');
  assert.match(bled, /calomel/);
  assert.match(bled, /did no good/);
});

test('step 6: rice and tea kept for sickness count a day nearer mending, and keep nobody alive', () => {
  const world = landed('sick-rice');
  const household = Object.values(world.households)[0];
  household.sickFood = 2;
  const person = grown(world, household);
  // The whooping cough in a grown person never turns very sick, so the day is only the mending.
  person.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY, disease: 'whooping-cough', since: world.minute };
  const before = person.health.recoversAt;
  sicknessDay(world, household, person, { day: dayOf(world) + 1 });
  assert.equal(person.health.recoversAt, before - DAY, 'the rice and tea did nothing');
  assert.equal(household.sickFood, 1);
  assert.ok(world.events.some(event => event.actorId === person.id && /rice and tea/.test(event.text)));
  // A day already nursed is not nursed twice over by it.
  person.health.nursed = dayOf(world) + 2;
  sicknessDay(world, household, person, { day: dayOf(world) + 2 });
  assert.equal(household.sickFood, 1, 'the rice and tea were given on a day already nursed');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ step 7: auto and the Host

test('step 7: a family nobody plays never sends its sick to work, and nurses them at home', () => {
  const world = landed('sick-auto');
  const household = Object.values(world.households)[0];
  // The family chooses where its house stands first, and walks there (sim/homesite.mjs); the test begins with it home.
  const think = () => thinkFor(world, household, { project: id => view(world, id), act: input => applyAction(world, household.id, input) });
  think();
  stepWhile(world, () => people(world, household).some(one => one.travel), DAY);
  const sick = grown(world, household);
  sick.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY, disease: 'lung-fever' };
  sick.task = 'rest';
  if (sick.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: sick.id });
  for (let i = 0; i < 3; i++) think();
  assert.equal(sick.chore, null, `the sick were sent to ${sick.chore?.id}`);
  assert.ok(people(world, household).some(one => one.chore?.id === 'nurse-home'), 'nobody nursed the sick at home');
});

test('step 7: on the road a family nobody plays rests a day for the very sick, but not with the army close behind', () => {
  const run = danger => {
    const { world, household } = onTheRoad('sick-auto-road');
    const patient = people(world, household).find(one => one.travel?.purpose === 'flee' && one.id !== (household.mainId || household.principalId));
    patient.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY, disease: 'measles', grave: true, graveDay: dayOf(world) };
    if (danger) household.flight.danger = { id: 'santa-anna', name: 'Santa Anna\'s column', miles: 12, towardName: 'Harrisburg', minute: world.minute, asked: true };
    thinkFor(world, household, { project: id => view(world, id), act: input => applyAction(world, household.id, input) });
    return people(world, household).some(one => one.chore?.id === 'rest-road');
  };
  assert.equal(run(false), true, 'a family nobody plays did not stop for its very sick');
  assert.equal(run(true), false, 'a family nobody plays stopped to rest with the army twelve miles off');
});

test('step 7: a child who died of a sickness is never named on the Host\'s projector nor drawn; the class panel counts the sick', () => {
  const world = landed('sick-host');
  const household = Object.values(world.households)[0];
  const child = people(world, household).find(one => one.kin?.role === 'son' || one.kin?.role === 'daughter') || people(world, household)[2];
  child.age = 3;
  child.health = { condition: 'dead', disease: 'measles' };
  const family = familiesOverview(world).find(one => one.id === household.id);
  assert.ok(!family.people.some(one => one.name === child.name), 'the child is named on the Host\'s class panel');
  assert.equal(family.lost, 1, 'the class panel does not count the child');
  assert.ok(!hostOverview(world).everyone.some(one => one.id === child.id), 'the child is on the Host\'s map');
  assert.equal(view(world, household.id).entities.find(one => one.id === child.id).location, null, 'the child is sent to the family with a place to be drawn at');
  assert.ok(!JSON.stringify(familiesOverview(world)).includes(child.name), 'the child\'s name is somewhere in the class panel');
  const sick = grown(world, household);
  sick.health = { condition: 'sick', recoversAt: world.minute + DAY, disease: 'measles', grave: true, graveDay: 0 };
  const other = people(world, Object.values(world.households)[1])[0];
  other.health = { condition: 'sick', recoversAt: world.minute + DAY, disease: 'lung-fever' };
  const counted = classSickness(world);
  assert.deepEqual([...counted.lines].sort(), ['Chill on the chest: 1 sick.', 'Measles: 1 sick, 1 very sick.']);
  assert.equal(counted.died, 1);
  assert.ok(!JSON.stringify(counted).includes(sick.name), 'the count names somebody');
});

// ------------------------------------------------------------------------------------------------ step 8: the measurement

test('step 8: the measured deaths over the flight are about three in a hundred, mostly the youngest, measured against these rates', () => {
  const study = JSON.parse(readFileSync(new URL('../docs/evidence/disease-study.json', import.meta.url), 'utf8'));
  // The evidence is of these numbers: a rate moved without the study run again fails here (scripts/disease-study.mjs).
  assert.deepEqual(study.rates, studiedRates(), 'the rates have moved since the study was run: run scripts/disease-study.mjs again');
  // The class the owner's figure is read against: half its families seeing to their sick and half not (scripts/disease-study.mjs).
  const mixed = study.pooled.mixed;
  assert.ok(mixed.flights >= 12 && mixed.people >= 1500, `too small a study: ${mixed.flights} flights, ${mixed.people} people`);
  assert.ok(mixed.perHundred >= 2 && mixed.perHundred <= 4, `${mixed.perHundred} in a hundred died over the flight, not about three`);
  // "Still weighted to the small and the uncared-for": the careless half loses several times what the careful half does.
  const { careful, careless } = mixed.groups;
  assert.ok(careless.perHundred > 2 * careful.perHundred, `nursing and rest saved hardly anybody: ${careful.perHundred} against ${careless.perHundred}`);
  assert.ok(careful.perHundred <= 2, `a careful family loses ${careful.perHundred} in a hundred: not "almost never"`);
  const young = mixed.byBand['0-1'].died + mixed.byBand['2-5'].died;
  assert.ok(young / Math.max(1, mixed.died) >= 0.5, `only ${young} of ${mixed.died} deaths were of children under six`);
  const perYoung = young / (mixed.byBand['0-1'].people + mixed.byBand['2-5'].people), perGrown = mixed.byBand['16+'].died / mixed.byBand['16+'].people;
  assert.ok(perYoung > 3 * perGrown, 'a small child is not much more likely to die of it than a grown person');
  for (const one of study.autumnWinter) assert.equal(one.autumn.died, 0, `somebody died of sickness in the first period of ${one.seed}`);
});
