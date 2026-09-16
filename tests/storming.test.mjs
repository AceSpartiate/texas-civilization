// The storming of Béxar: docs/COLONIES.md §6l, build step 6, researched in docs/battle-research/bexar-storming.md and decided
// by the owner by multiple choice (§7c, 2026-09-16).
//
// On December 4 the army is ordered into winter quarters: families nobody plays send men home at about the documented rate,
// and a played family is asked on its volunteer's card. That afternoon Milam calls for men and each volunteer still in camp
// is asked whether they go in; on December 8 those still at the camp are asked whether they go in with the companies sent
// from it. At the white flag, those who went in fought and the camp was present: 2 in 100 killed and 8 in 100 wounded
// (the record's 1.7 and 7-9, rounded), each rolled on their own and weighted by hidden strength and health, the reserve
// unhurt, and no limit on how many a class loses - a later death from a dangerous wound rolled on its own too (owner's
// correction, 2026-09-16). Wounds come in three grades; worse than slight keeps somebody lying at Béxar. Word comes by rider, wrong
// first, then the victory with each family's own person's part. The class ends on the evening of December 15.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { STORMING_DEATH_RISK, STORMING_WOUND_RISK, WOUND_GRADES, dieOfWounds, fightStorming, openQuestion, stormedIn, withTheArmy } from '../sim/army.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done) => { for (let t = 0; t < 6000 && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMinute = (world, minute) => until(world, () => world.minute >= minute);
const card = (world, household, person) => view(world, household.id).army?.ours?.find(one => one.id === person.id);
const asked = (world, household, person, key) => card(world, household, person)?.questions?.some(q => q.key === key && q.answer === 'open');
const RISK = /kill|die|death|danger|risk|wound|hurt/i;

let shared = null;
/** A class with automatic neighbours and two played volunteers: A stays and goes in with Milam; B goes home for the winter. */
const storming = () => shared ??= (() => {
  const world = createGonzalesWorld('storming-class', 15, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const families = Object.values(world.households).filter(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId)).slice(0, 2);
  for (const household of families) household.played = true;
  const sent = [];
  for (const household of families) {
    until(world, () => world.calls?.[household.id]);
    const found = Object.entries(view(world, household.id).request?.answerers || {}).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) { applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' }); sent.push({ household, person: world.entities[found[0]] }); }
  }
  assert.equal(sent.length, 2, 'two played families did not both send a volunteer');
  const [a, b] = sent;
  const seen = {};
  // Through the siege, answering to stay: both pledge, neither goes after the pack train.
  until(world, () => {
    for (const { household, person } of sent) for (const q of card(world, household, person)?.questions || []) {
      if (q.answer === 'open' && ['storm', 'pledge', 'grass'].includes(q.key)) applyAction(world, household.id, { action: 'army-answer', entityId: person.id, question: q.key, answer: q.key === 'pledge' ? 'yes' : 'no' });
    }
    return asked(world, a.household, a.person, 'winter') && asked(world, b.household, b.person, 'winter');
  });
  assert.ok(withTheArmy(world, a.person.id) && withTheArmy(world, b.person.id), 'a played volunteer left the army before December 4');
  seen.winter = { card: card(world, a.household, a.person).questions.find(q => q.key === 'winter'), phase: world.director.phase };
  applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'winter', answer: 'yes' });
  applyAction(world, b.household.id, { action: 'army-answer', entityId: b.person.id, question: 'winter', answer: 'no' });
  seen.bHome = { inArmy: withTheArmy(world, b.person.id), to: world.entities[b.person.id].travel?.to, home: b.household.homeSiteId };
  until(world, () => asked(world, a.household, a.person, 'milam'));
  seen.milam = { card: card(world, a.household, a.person).questions.find(q => q.key === 'milam'), phase: world.director.phase };
  applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'milam', answer: 'yes' });
  until(world, () => world.director.milestones.reinforce);
  seen.reinforceToA = world.army.questions.reinforce?.asks?.[a.person.id];
  seen.atCamp = world.army.members.filter(id => world.army.questions.milam?.asks?.[id] !== 'yes');
  seen.reinforceAsked = Object.keys(world.army.questions.reinforce?.asks || {});
  until(world, () => world.director.milestones['white-flag']);
  seen.flag = { minute: world.minute, told: world.events.some(e => e.householdId === a.household.id && /storming of Béxar/.test(e.text) && e.type !== 'glory'), report: structuredClone(world.knowledge.households[b.household.id]['bexar-storming']) };
  until(world, () => world.director.milestones['cos-marches']);
  seen.disbanded = { members: world.army.members.length };
  until(world, () => world.director.complete);
  validateWorld(world);
  return { world, a, b, seen };
})();

test('December 4: families nobody plays send men home, a played family is asked on the card, and a no goes home on the horse', () => {
  const { world, b, seen } = storming();
  assert.match(seen.winter.card.ask, /winter quarters/);
  assert.equal(seen.winter.phase, 'news', 'the calendar did not slow while a played family had the question open');
  assert.equal(seen.bHome.inArmy, false, 'a volunteer who went home for the winter stayed in the army');
  assert.equal(seen.bHome.to, seen.bHome.home, 'a volunteer who went home for the winter is not going home');
  assert.equal(world.army.questions.winter.asks[b.person.id], 'no');
  const unplayed = Object.entries(world.army.questions.winter.asks).filter(([id]) => !world.households[world.entities[id].householdId].played);
  assert.ok(unplayed.length > 0 && unplayed.every(([, answer]) => ['yes', 'no'].includes(answer)), 'families nobody plays did not answer for themselves');
  // Nobody who went home is asked to go in with Milam.
  assert.equal(world.army.questions.milam.asks[b.person.id], undefined, 'a volunteer who went home was asked to go in');
});

test('Milam\'s call is asked on the volunteer\'s card with nothing about the risk, and the camp\'s reinforcement is not asked of those already in', () => {
  const { world, a, seen } = storming();
  assert.match(seen.milam.card.ask, /Ben Milam/);
  assert.doesNotMatch(`${seen.milam.card.ask} ${seen.milam.card.yes} ${seen.milam.card.no}`, RISK, 'the question says what it risks');
  assert.equal(seen.milam.phase, 'news');
  assert.equal(world.army.questions.milam.asks[a.person.id], 'yes');
  assert.equal(seen.reinforceToA, undefined, 'a volunteer already in the town was asked to go in again');
  assert.deepEqual([...seen.reinforceAsked].sort(), [...seen.atCamp].sort(), 'the reinforcement was not asked of exactly those at the camp');
  const part = world.participation['bexar-storming'];
  assert.equal(part[a.person.id]?.role, 'fought');
  for (const [id, p] of Object.entries(part)) assert.equal(p.role, stormedIn(world, id) ? 'fought' : 'present', `${id} is counted ${p.role}`);
  assert.equal(world.glory[a.household.id].awards[`bexar-storming:${a.person.id}`].role, 'fought');
});

test('word of the storming comes by rider: the wrong express first, then the victory with each family\'s own part, the terms as signed', () => {
  const { world, a, b, seen } = storming();
  assert.equal(seen.flag.told, false, 'a family was told its person\'s part on the day of the white flag');
  assert.equal(seen.flag.report?.status, 'rumor', 'the first word was not the wrong express');
  assert.match(seen.flag.report.text, /daylight on the 6th/);
  for (const household of Object.values(world.households)) {
    const report = world.knowledge.households[household.id]['bexar-storming'];
    assert.equal(report?.status, 'confirmed', `${household.id} never heard the victory`);
  }
  const victory = world.knowledge.households[b.household.id]['bexar-storming'].text;
  assert.match(victory, /Milam was killed/);
  assert.match(victory, /Constitution of 1824/, 'the terms are not as signed');
  assert.doesNotMatch(victory, /prisoners/, 'the terms are the memoirs\', not the capitulation\'s');
  assert.match(victory, /about a hundred and fifty, or about three hundred/, 'the Mexican losses are not the range');
  assert.match(victory, /carrying water/, 'the people of Béxar are left out');
  assert.ok(world.events.some(e => e.householdId === a.household.id && e.type === 'consequence' && /storming of Béxar/.test(e.text)), 'the family was never told its person\'s part');
});

test('Cos marches out on December 14, the army goes home, and the class ends on the evening of the 15th', () => {
  const { world, seen } = storming();
  assert.equal(seen.disbanded.members, 0, 'the army did not break up');
  assert.equal(world.status, 'ended');
  assert.ok(world.minute >= momentOf(world, 'bexar-end'));
  assert.ok(world.events.some(e => e.visibility === 'public' && /white flag/.test(e.text)));
  assert.ok(world.events.some(e => e.visibility === 'public' && /Milam has been shot dead/.test(e.text)));
});

/** Everybody grown in a class of thirty put in the camp and sent in with Milam: one class cloned, a new seed each fight. */
let crowd = null;
function crowdedStorming(seed, { strength, health, sex, all = true } = {}) {
  crowd ??= (() => { const base = createGonzalesWorld('storming-crowd', 30, { map: 'colonies' }); base.status = 'running'; untilMinute(base, momentOf(base, 'organised') + 1); return base; })();
  const world = structuredClone(crowd);
  world.seed = seed;
  const people = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
  world.army.members = people.map(p => p.id);
  for (const p of people) {
    p.traits = { ...(p.traits || {}), ...(strength !== undefined && { strength }), ...(health !== undefined && { health }) };
    if (sex) p.sex = sex;
  }
  openQuestion(world, 'milam', null);
  people.forEach((p, i) => { world.army.questions.milam.asks[p.id] = all || i % 2 ? 'yes' : 'no'; });
  return { world, people, result: fightStorming(world, null) };
}

test('the storming kills 2 and wounds 8 in 100 of those who went in, each rolled on their own, a crowd can lose several, and nobody at the camp', () => {
  // The record, rounded as the owner allows: about 5 killed and 21 wounded of ~300 (1.7%, 7-9%). docs/battle-research/bexar-storming.md §8.
  assert.equal(STORMING_DEATH_RISK, 0.02);
  assert.equal(STORMING_WOUND_RISK, 0.08);
  let fighters = 0, killed = 0, wounded = 0, frailDeaths = 0, hardyDeaths = 0, most = 0;
  const grades = { slight: 0, severe: 0, dangerous: 0 };
  for (let n = 0; n < 40; n++) {
    // Strength 10 and health 2 is exactly middling (frailty 1), so those who go in should fall at the record's own rate.
    const half = crowdedStorming(`storming-half-${n}`, { all: false, strength: 10, health: 2 });
    most = Math.max(most, half.result.killed.length);
    assert.ok(half.result.present.length > 0, 'nobody held the camp');
    for (const id of half.result.present) {
      assert.equal(half.world.entities[id].health?.condition ?? 'well', 'well', 'somebody at the camp was hurt');
      assert.equal(half.world.glory[half.world.entities[id].householdId].awards[`bexar-storming:${id}`]?.role, 'present', 'the camp earned nothing');
    }
    fighters += half.result.fought.length; killed += half.result.killed.length; wounded += half.result.wounded.length;
    for (const id of half.result.wounded) grades[half.world.entities[id].health.grade]++;
    const frail = crowdedStorming(`storming-frail-${n}`, { strength: 1, health: 2 }).result.killed.length;
    frailDeaths += frail; most = Math.max(most, frail);
    hardyDeaths += crowdedStorming(`storming-hardy-${n}`, { strength: 10, health: 18 }).result.killed.length;
    validateWorld(half.world);
  }
  assert.ok(most > 1, `no storming of a large crowd ever lost more than ${most}: a limit is being kept`);
  const killRate = killed / fighters, woundRate = wounded / fighters;
  assert.ok(fighters > 1500, `only ${fighters} went in`);
  assert.ok(killRate > 0.013 && killRate < 0.027, `killed ${(100 * killRate).toFixed(2)} in 100 of ${fighters} who went in`);
  assert.ok(woundRate > 0.065 && woundRate < 0.095, `wounded ${(100 * woundRate).toFixed(2)} in 100 of ${fighters} who went in`);
  assert.ok(frailDeaths > 1.8 * hardyDeaths, `the frail died ${frailDeaths} times and the hardy ${hardyDeaths}`);
  assert.ok(grades.severe > grades.slight && grades.dangerous > grades.slight, `grades ${JSON.stringify(grades)}`);
});

test('a wound worse than slight keeps somebody lying at Béxar, unable to travel, until it mends; a dangerous one can mark them or kill them later, each rolled on its own', () => {
  let checkedLying = false, checkedMark = false, checkedOnTop = false, checkedSeveral = false, dangerous = 0, laterDeaths = 0;
  for (let n = 0; n < 200 && !(checkedLying && checkedMark && checkedOnTop && checkedSeveral && n >= 60); n++) {
    const { world, result } = crowdedStorming(`storming-wounds-${n}`);
    for (const id of result.wounded) {
      const person = world.entities[id], { grade } = person.health;
      assert.ok(Math.abs(person.health.recoversAt - world.minute - WOUND_GRADES[grade].minutes) < 1, `a ${grade} wound mends at the wrong time`);
      if (grade === 'slight') { assert.equal(person.health.condition, 'minor-injury'); assert.ok(withTheArmy(world, id)); continue; }
      assert.equal(person.health.condition, 'wounded');
      assert.equal(withTheArmy(world, id), false, 'a badly wounded volunteer is still in the ranks');
      assert.equal(person.location.siteId, 'bexar', 'a badly wounded volunteer is not lying at Béxar');
      assert.throws(() => beginTravel(world, person, world.households[person.householdId].homeSiteId, null, 'visit'), /lying wounded/);
      checkedLying = true;
      if (person.marks?.length) { assert.equal(grade, 'dangerous', 'a wound that is not dangerous left a lasting mark'); checkedMark = true; }
    }
    dangerous += result.wounded.filter(id => world.entities[id].health.grade === 'dangerous').length;
    const later = [...world.army.storming.later], before = result.killed.length;
    assert.ok(later.every(id => world.entities[id].health.grade === 'dangerous'), 'a wound that is not dangerous killed later');
    const died = dieOfWounds(world);
    // Every later death rolled comes, whatever the fight already cost the class.
    assert.deepEqual(died, later, 'a later death rolled did not come');
    for (const id of died) assert.equal(world.entities[id].health.condition, 'dead');
    assert.equal(world.army.storming.killed.length, before + died.length);
    laterDeaths += died.length;
    if (before && died.length) checkedOnTop = true;
    if (died.length > 1) checkedSeveral = true;
  }
  assert.ok(checkedLying && checkedMark && checkedOnTop && checkedSeveral, `lying ${checkedLying}, mark ${checkedMark}, a later death on top of one in the fight ${checkedOnTop}, several later deaths in one class ${checkedSeveral}`);
  // About 15 in 100 dangerous wounds (the record: about 3 of 23 wounds fatal, bexar-storming.md §8).
  const laterRate = laterDeaths / dangerous;
  assert.ok(laterRate > 0.09 && laterRate < 0.21, `${laterDeaths} of ${dangerous} dangerous wounds killed later`);
});
