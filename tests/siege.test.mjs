// The siege and the Grass Fight: docs/COLONIES.md §6k, build step 6, researched in docs/battle-research/grass-fight.md and
// decided by the owner by multiple choice (§7b, 2026-09-16).
//
// After the councils vote not to storm on November 2 the army camps above the town, goes back down to Concepción, and is
// united at the old mill on the 15th. Families nobody plays send men home for winter clothing and about half come back.
// On the 21st Austin orders a storm and each volunteer is asked, on their own card, whether they would go in; those who
// say yes earn their family glory when it is countermanded. On the 24th each is asked to pledge, and one who does not goes
// home. On the 26th, after the rumour of silver, each is asked whether they go out after the pack train: nobody is killed,
// about three in a hundred are slightly hurt, and about one in a hundred runs home, which is held against the family. Word
// of it rides home days later, the rumour first. The class ends on December 4 with Milam's call.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { CLOTHING_RETURN_SHARE, CLOTHING_SHARE, GRASS_RUN_RISK, GRASS_WOUND_RISK, SIEGE_CAMPS, armyInvalid, fightGrass, goForClothing, openQuestion, returnFromClothing, withTheArmy } from '../sim/army.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const untilMinute = (world, minute) => { for (let t = 0; t < 4000 && world.minute < minute && world.status === 'running'; t++) stepWorld(world); };
const until = (world, done) => { for (let t = 0; t < 4000 && !done() && world.status === 'running'; t++) stepWorld(world); };
const card = (world, household, person) => view(world, household.id).army?.ours?.find(one => one.id === person.id);
const RISK = /kill|die|death|danger|risk|wound|hurt|run/i;

/** A class with automatic neighbours and two played families whose volunteers are in the army, played to the end. */
let shared = null;
const siege = () => shared ??= (() => {
  const world = createGonzalesWorld('siege-class', 15, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const families = Object.values(world.households).filter(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId)).slice(0, 2);
  for (const household of families) household.played = true;
  const sent = [];
  for (const household of families) {
    until(world, () => world.calls?.[household.id]);
    const answerers = view(world, household.id).request?.answerers || {};
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) { applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' }); sent.push({ household, person: world.entities[found[0]] }); }
  }
  assert.equal(sent.length, 2, 'two played families did not both send a volunteer');
  until(world, () => sent.every(({ person }) => withTheArmy(world, person.id)) && world.director.milestones.concepcion);
  const [a, b] = sent;
  const seen = { camps: {}, cards: {}, phase: {}, story: {} };
  for (const [key, camp] of [['siege', 'above'], ['to-concepcion', 'concepcion'], ['united', 'mill']]) {
    untilMinute(world, momentOf(world, key) + 1);
    stepWorld(world);
    seen.camps[camp] = { camp: world.army.camp, x: world.army.x, y: world.army.y };
  }
  seen.clothing = { furloughs: structuredClone(world.army.furloughs || {}), members: world.army.members.length };
  // November 21: the storm order. A says yes; B is left unanswered.
  until(world, () => card(world, a.household, a.person)?.questions?.some(q => q.key === 'storm'));
  seen.cards.storm = card(world, a.household, a.person).questions.find(q => q.key === 'storm');
  seen.phase.storm = world.director.phase;
  seen.story.storm = world.events.filter(e => e.householdId === a.household.id && e.type === 'pressure').map(e => e.text).at(-1);
  applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'storm', answer: 'yes' });
  seen.again = (() => { try { applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'storm', answer: 'no' }); return null; } catch (error) { return error.message; } })();
  seen.otherFamily = (() => { try { applyAction(world, a.household.id, { action: 'army-answer', entityId: b.person.id, question: 'storm', answer: 'yes' }); return null; } catch (error) { return error.message; } })();
  seen.forged = (() => { try { applyAction(world, b.household.id, { action: 'army-answer', entityId: b.person.id, question: 'storm-now', answer: 'yes' }); return null; } catch (error) { return error.message; } })();
  until(world, () => world.director.milestones.countermand);
  seen.afterStorm = { phase: world.director.phase, closed: (() => { try { applyAction(world, b.household.id, { action: 'army-answer', entityId: b.person.id, question: 'storm', answer: 'yes' }); return null; } catch (error) { return error.message; } })() };
  // November 24: the pledge. A pledges; B does not.
  until(world, () => card(world, b.household, b.person)?.questions?.some(q => q.key === 'pledge'));
  applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'pledge', answer: 'yes' });
  applyAction(world, b.household.id, { action: 'army-answer', entityId: b.person.id, question: 'pledge', answer: 'no' });
  seen.pledge = { bInArmy: withTheArmy(world, b.person.id), bGoing: world.entities[b.person.id].travel?.to, bHome: b.household.homeSiteId };
  // November 26: the rumour, then the question, then the fight.
  until(world, () => card(world, a.household, a.person)?.questions?.some(q => q.key === 'grass'));
  seen.alarm = { minute: world.minute, phase: world.director.phase, silver: world.events.some(e => e.visibility === 'public' && /silver/.test(e.text)) };
  seen.cards.grass = card(world, a.household, a.person).questions.find(q => q.key === 'grass');
  applyAction(world, a.household.id, { action: 'army-answer', entityId: a.person.id, question: 'grass', answer: 'yes' });
  until(world, () => world.director.milestones['grass-fight']);
  seen.fight = { minute: world.minute, alarmFirst: seen.alarm.minute < world.minute, told: world.events.some(e => e.householdId === a.household.id && /November 26/.test(e.text)), public: world.events.filter(e => e.visibility === 'public' && e.minute >= seen.alarm.minute).map(e => e.text) };
  until(world, () => world.director.milestones['grass-rumour']);
  seen.rumour = { minute: world.minute, told: world.events.some(e => e.householdId === a.household.id && /November 26/.test(e.text)), report: structuredClone(world.knowledge.households[b.household.id]['grass-fight']) };
  seen.silverBefore = structuredClone(world.knowledge.households[b.household.id]['silver-train']);
  until(world, () => world.director.complete);
  validateWorld(world);
  return { world, a, b, seen };
})();

test('after November 2 the army camps above the town, goes back down to Concepción, and is united at the mill', () => {
  const { world, seen } = siege();
  const bexar = world.map.sites.bexar;
  assert.equal(seen.camps.above.camp, SIEGE_CAMPS.above.name);
  assert.ok(seen.camps.above.y < bexar.y, 'the camp above the town is not north of it');
  assert.equal(seen.camps.concepcion.camp, 'Mission Concepción');
  assert.ok(seen.camps.concepcion.y > bexar.y, 'Concepción is not south of the town');
  assert.equal(seen.camps.mill.camp, 'the old mill above Béxar');
  assert.ok(Math.abs(seen.camps.mill.y - (bexar.y + SIEGE_CAMPS.mill.dy)) < 1e-6);
  // And never in the town: Béxar was Cos's until December.
  assert.ok(Math.hypot(world.army.x - bexar.x, world.army.y - bexar.y) >= 0.5, 'the army is camped in Béxar');
  assert.equal(armyInvalid(world), null);
});

test('families nobody plays send men home for winter clothing and about half come back; a played family is never sent', () => {
  let sent = 0, members = 0, back = 0;
  for (let n = 0; n < 10; n++) {
    const { world, people } = crowdedCamp(`clothing-${n}`);
    world.neighbours = true;
    const played = new Set(Object.values(world.households).slice(0, 5).map(h => h.id));
    for (const id of played) world.households[id].played = true;
    const homeward = [];
    goForClothing(world, { beginTravel: (w, person, destination) => homeward.push({ id: person.id, destination }) });
    members += people.filter(p => !played.has(p.householdId)).length;
    for (const [id, furlough] of Object.entries(world.army.furloughs)) {
      const person = world.entities[id];
      assert.ok(!played.has(person.householdId), `${person.name}, of a played family, was sent home for clothing`);
      assert.equal(withTheArmy(world, id), false, `${person.name} went home and is still in the ranks`);
      assert.ok(homeward.some(h => h.id === id && h.destination === world.households[person.householdId].homeSiteId), `${person.name} did not start home`);
      const promise = person.commitments?.find(p => p.id === 'volunteer');
      if (promise) assert.equal(promise.status === 'active', furlough.back, `${person.name}'s promise does not match whether they come back`);
      sent++; if (furlough.back) back++;
    }
    // Home, and the days up: those who promised set out again for Béxar, and nobody else does.
    const again = [];
    for (const [id] of Object.entries(world.army.furloughs)) {
      const person = world.entities[id];
      person.travel = null;
      person.location = { ...world.map.sites[world.households[person.householdId].homeSiteId], siteId: world.households[person.householdId].homeSiteId };
    }
    world.minute += 17 * 1440;
    returnFromClothing(world, { beginTravel: (w, person, destination) => again.push({ id: person.id, destination }) });
    for (const [id, furlough] of Object.entries(world.army.furloughs)) {
      assert.equal(again.some(h => h.id === id && h.destination === 'bexar'), furlough.back, `${world.entities[id].name} set out again or stayed home against their promise`);
    }
  }
  const share = sent / members, returning = back / sent;
  assert.ok(share > CLOTHING_SHARE * 0.6 && share < CLOTHING_SHARE * 1.4, `${share.toFixed(2)} went home for clothing`);
  assert.ok(returning > CLOTHING_RETURN_SHARE * 0.6 && returning < CLOTHING_RETURN_SHARE * 1.4, `${returning.toFixed(2)} came back`);
  // And in a real class it happened after the vote, and played families' volunteers were never among them.
  const { world, a, b } = siege();
  for (const id of Object.keys(world.army.furloughs || {})) assert.ok(![a.household.id, b.household.id].includes(world.entities[id].householdId));
});

test('the storm order is asked on the volunteer\'s own card, once, with nothing about the risk, and a yes earns glory when it is countermanded', () => {
  const { world, a, b, seen } = siege();
  assert.equal(seen.cards.storm.answer, 'open');
  assert.match(seen.cards.storm.ask, /stormed at dawn/);
  assert.doesNotMatch(`${seen.cards.storm.ask} ${seen.cards.storm.yes} ${seen.cards.storm.no}`, RISK);
  assert.match(seen.story.storm, /stormed at dawn/, 'the family\'s own story does not carry the question');
  assert.equal(seen.phase.storm, 'news', 'the calendar did not slow while a played family had the question in front of it');
  assert.match(seen.again, /already been answered/);
  assert.ok(seen.otherFamily, 'a family answered for another family\'s volunteer');
  assert.match(seen.forged, /no such question/);
  assert.match(seen.afterStorm.closed, /Nobody is being asked/);
  assert.equal(world.army.questions.storm.asks[a.person.id], 'yes');
  assert.equal(world.army.questions.storm.asks[b.person.id], 'silent', 'an unanswered volunteer was not answered by silence');
  const willing = world.glory[a.household.id].awards[`storm-order:${a.person.id}`];
  assert.equal(willing?.role, 'willing', 'saying yes to the storm earned nothing');
  assert.ok(willing.points > 0);
  assert.equal(world.glory[b.household.id]?.awards?.[`storm-order:${b.person.id}`], undefined, 'silence earned glory');
  // Families nobody plays answered for themselves, most of them no, as the army did.
  const unplayed = Object.entries(world.army.questions.storm.asks).filter(([id]) => !world.households[world.entities[id].householdId].played);
  assert.ok(unplayed.length > 0 && unplayed.every(([, answer]) => ['yes', 'no'].includes(answer)));
});

test('a volunteer who does not pledge on November 24 leaves the army and starts home', () => {
  const { world, a, seen } = siege();
  assert.equal(seen.pledge.bInArmy, false, 'a volunteer who did not pledge stayed in the army');
  assert.equal(seen.pledge.bGoing, seen.pledge.bHome, 'a volunteer who did not pledge is not going home');
  assert.equal(world.army.questions.pledge.asks[a.person.id], 'yes');
  assert.ok(withTheArmy(world, a.person.id) || world.participation['grass-fight'][a.person.id]?.role === 'ran', 'a volunteer who pledged left the army');
});

test('the rumour of silver comes before the Grass Fight, and its word rides home days later, the wrong rumour first', () => {
  const { world, a, seen } = siege();
  assert.ok(seen.alarm.silver, 'nobody heard the rumour of silver');
  assert.match(seen.cards.grass.ask, /silver/);
  assert.doesNotMatch(`${seen.cards.grass.yes} ${seen.cards.grass.no}`, RISK);
  assert.ok(seen.fight.alarmFirst);
  assert.equal(seen.fight.told, false, 'the family was told what happened on the day of the fight');
  assert.ok(!seen.fight.public.some(text => /grass cut|no loss/.test(text)), 'the country was told of the fight on the day');
  assert.equal(seen.rumour.told, false, 'the family heard its own news with the first rumour');
  const rumour = world.events.find(e => e.visibility === 'public' && /no loss on our side/.test(e.text));
  const fuller = world.events.find(e => e.visibility === 'public' && /grass cut for the horses/.test(e.text));
  assert.ok(rumour && fuller && rumour.minute < fuller.minute, 'the rumour did not come before the fuller account');
  assert.ok(rumour.minute - seen.fight.minute >= 4 * 1440, 'word of the fight came in less than four days');
  assert.match(fuller.text, /three, fifteen, about fifty, or sixty/, 'the Mexican losses are not the disagreeing range');
  // Every family hears it, in its own reports, a family with nobody in the army as well: the rumour first, then the word.
  assert.equal(seen.rumour.report?.status, 'rumor', 'the family did not hear the rumour');
  assert.match(seen.rumour.report.text, /no loss on our side/);
  assert.equal(seen.silverBefore?.status, 'rumor', 'the family did not hear the rumour of silver');
  for (const household of Object.values(world.households)) {
    assert.equal(world.knowledge.households[household.id]['grass-fight']?.status, 'confirmed', `${household.id} never heard the fuller word`);
    assert.equal(world.knowledge.households[household.id]['silver-train']?.status, 'contradicted', `${household.id} still believes in the silver`);
  }
  assert.ok(projectWorld(world, a.household.id, 'student', { includeMap: false }).reports.some(r => r.topicId === 'grass-fight' && /three, fifteen, about fifty, or sixty/.test(r.text)), 'the student payload does not carry the word');
  const part = world.participation['grass-fight'][a.person.id];
  assert.ok(['fought', 'ran'].includes(part.role));
  assert.ok(world.events.some(e => e.householdId === a.household.id && e.minute >= fuller.minute && /November 26/.test(e.text)), 'the family was never told what happened to their person');
});

test('the class ends on December 4 with Milam\'s call, at the mill, with the siege\'s parts in the ending', () => {
  const { world, a } = siege();
  assert.equal(world.status, 'ended');
  assert.ok(world.minute >= momentOf(world, 'milam'));
  assert.ok(world.events.some(e => e.type === 'slice-preserved' && /Milam/.test(e.text)));
  assert.equal(world.army.camp, 'the old mill above Béxar');
  const ending = projectWorld(world, a.household.id, 'student', { includeMap: false }).ending.family;
  assert.ok(ending.awards.some(award => /order to storm Béxar/.test(award.text)), 'the ending does not name the storm order');
  assert.ok(ending.awards.some(award => /Grass Fight/.test(award.text)), 'the ending does not name the Grass Fight');
});

/** Everybody grown in a class of thirty put in the camp: one class played to the muster, cloned, with a new seed each time. */
let crowd = null;
function crowdedCamp(seed) {
  crowd ??= (() => { const base = createGonzalesWorld('grass-crowd', 30, { map: 'colonies' }); base.status = 'running'; untilMinute(base, momentOf(base, 'organised') + 1); return base; })();
  const world = structuredClone(crowd);
  world.seed = seed;
  const people = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
  world.army.members = people.map(p => p.id);
  for (const p of people) {
    const promise = p.commitments?.find(c => c.id === 'volunteer');
    if (promise) promise.status = 'active'; else (p.commitments ??= []).push({ id: 'volunteer', status: 'active' });
  }
  return { world, people };
}
/** Everybody of a class put in the camp and sent out after the pack train, and the fight fought. */
function crowdedGrass(seed) {
  const { world, people } = crowdedCamp(seed);
  openQuestion(world, 'grass', null);
  for (const p of people) world.army.questions.grass.asks[p.id] = 'yes';
  const homeward = [];
  const result = fightGrass(world, null, { beginTravel: (w, person, destination) => homeward.push({ id: person.id, destination }) });
  return { world, result, people, homeward };
}

test('nobody is killed in the Grass Fight; about three in a hundred are hurt and about one in a hundred runs home, held against the family', () => {
  let fighters = 0, wounded = 0, ran = 0, checkedRunner = false;
  for (let n = 0; n < 30; n++) {
    const { world, result, homeward } = crowdedGrass(`grass-${n}`);
    assert.ok(result.fought.length > 50, 'the crowd did not fight');
    assert.ok(Object.values(world.entities).every(e => e.health?.condition !== 'dead'), 'somebody was killed in the Grass Fight');
    fighters += result.fought.length; wounded += result.wounded.length; ran += result.ran.length;
    for (const id of result.ran) {
      const person = world.entities[id], award = world.glory[person.householdId].awards[`grass-fight:${id}`];
      assert.ok(award.points < 0, 'a volunteer who ran earned glory');
      assert.match(award.note, /held against the family/);
      assert.match(award.note, /game.s own reading/);
      assert.equal(withTheArmy(world, id), false, 'a volunteer who ran is still in the ranks');
      assert.ok(homeward.some(h => h.id === id && h.destination === world.households[person.householdId].homeSiteId), 'a volunteer who ran did not start home');
      assert.equal(world.participation['grass-fight'][id].role, 'ran');
      checkedRunner = true;
    }
    for (const id of result.wounded) assert.equal(world.entities[id].health.condition, 'minor-injury');
    validateWorld(world);
  }
  assert.ok(checkedRunner, 'nobody ever ran, so the rule was never tested');
  const woundRate = wounded / fighters, runRate = ran / fighters;
  assert.ok(woundRate > GRASS_WOUND_RISK * 0.4 && woundRate < GRASS_WOUND_RISK * 2, `wounded ${woundRate.toFixed(3)} of fighters`);
  assert.ok(runRate > GRASS_RUN_RISK * 0.3 && runRate < GRASS_RUN_RISK * 2.5, `ran ${runRate.toFixed(3)} of fighters`);
});

test('a saved army with an answer or a camp that does not exist is refused', () => {
  const { world } = siege();
  const broken = structuredClone(world);
  broken.army.questions.pledge.asks[Object.keys(broken.army.questions.pledge.asks)[0]] = 'maybe';
  assert.match(armyInvalid(broken), /Invalid answer/);
  const lost = structuredClone(world);
  lost.army.road.campKey = 'alamo';
  assert.match(armyInvalid(lost), /camp that does not exist/);
});
