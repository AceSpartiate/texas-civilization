// Concepción: docs/COLONIES.md §6i, build step 6, researched in docs/battle-research/concepcion.md and decided by the
// owner by multiple choice (§7a, 2026-09-16).
//
// The army halts where and when the order book says: the Cibolo, the Salado, then south to Espada. On October 22 a family
// with somebody in the ranks is asked whether they go ahead with Bowie and Fannin. On the 28th those who went fought and
// everybody else was present. Each fighter's fate is rolled against about one in a hundred, weighted by hidden strength and
// health, and a class never loses more than one person there. A woman sent to fight keeps her award if she comes through
// and has it taken away twice over if she does not. Families hear that the reports of Mexican losses disagree.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { CIBOLO_MILES, CONCEPCION_DEATH_RISK, closeDetachment, fightConcepcion, frailty, openDetachment, withTheArmy } from '../sim/army.mjs';
import { awardGlory } from '../sim/glory.mjs';
import { familyEnding, finalNumber } from '../sim/ending.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const colonies = (seed, players = 15) => { const world = createGonzalesWorld(seed, players, { map: 'colonies' }); world.status = 'running'; return world; };
const untilMinute = (world, minute) => { for (let t = 0; t < 3000 && world.minute < minute && world.status === 'running'; t++) stepWorld(world); };
const until = (world, done) => { for (let t = 0; t < 3000 && !done() && world.status === 'running'; t++) stepWorld(world); };
const storyOf = (world, householdId) => world.events.filter(e => e.householdId === householdId).map(e => e.text);

/** A class with one family's volunteer in the army, played to a moment. */
function withVolunteer(seed, { second = false } = {}) {
  const world = colonies(seed);
  const families = Object.values(world.households).filter(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId)).slice(0, second ? 2 : 1);
  const sent = [];
  for (const household of families) {
    until(world, () => world.calls?.[household.id]);
    const answerers = view(world, household.id).request?.answerers || {};
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (!found) continue;
    applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
    sent.push({ household, personId: found[0] });
  }
  until(world, () => sent.every(({ personId }) => world.army?.members.includes(personId)));
  const [first, other] = sent;
  return { world, household: first.household, person: world.entities[first.personId], ...(other && { other: { household: other.household, person: world.entities[other.personId] } }) };
}

let shared = null;
/** One class: the volunteer answered "go" on the 22nd, and the class played to its end. Recorded along the way. */
const campaign = () => shared ??= (() => {
  const { world, household, person, other } = withVolunteer('concepcion-class', { second: true });
  const seen = {};
  // A campaign tick is twelve hours of 1835, so each look is taken a day before the move it precedes.
  untilMinute(world, momentOf(world, 'leave-cibolo') - 1440);
  seen.cibolo = { camp: world.army.camp, progress: world.army.progress, strength: world.army.members.length };
  untilMinute(world, momentOf(world, 'detachment') + 1);
  seen.salado = { camp: world.army.camp, progress: world.army.progress, left: world.army.road.distance - world.army.progress, stopLeft: world.army.road.distance - world.army.road.stops.salado };
  seen.asked = view(world, household.id).army.ours.find(one => one.id === person.id)?.detachment;
  seen.story = storyOf(world, household.id).filter(text => /Bowie and Fannin/.test(text));
  applyAction(world, household.id, { action: 'detachment-go', entityId: person.id });
  if (other) applyAction(world, other.household.id, { action: 'detachment-stay', entityId: other.person.id });
  seen.again = (() => { try { applyAction(world, household.id, { action: 'detachment-stay', entityId: person.id }); return null; } catch (error) { return error.message; } })();
  untilMinute(world, momentOf(world, 'concepcion') - 1440);
  seen.espada = { camp: world.army.camp };
  untilMinute(world, momentOf(world, 'concepcion') + 1);
  seen.concepcion = { camp: world.army.camp, y: world.army.y };
  until(world, () => world.director.complete);
  validateWorld(world);
  return { world, household, person, seen };
})();

test('the army halts where the order book halts it: the Cibolo, the Salado five miles out, then south to Espada and Concepción', () => {
  const { world, seen } = campaign();
  assert.equal(seen.cibolo.camp, 'the Cibolo');
  assert.equal(seen.cibolo.progress, CIBOLO_MILES, 'the army did not wait at the Cibolo');
  assert.equal(seen.salado.camp, 'the Salado');
  assert.ok(Math.abs(seen.salado.left - seen.salado.stopLeft) < 1e-6);
  assert.equal(seen.espada.camp, 'Mission Espada');
  assert.equal(seen.concepcion.camp, 'Mission Concepción');
  // It never marched into the town: Concepción is south of Béxar, and that is where the march ended.
  assert.ok(seen.concepcion.y > world.map.sites.bexar.y, 'the march ended north of Béxar');
  assert.equal(world.director.phase, 'preserved');
  assert.ok(world.events.some(e => /voted not to storm/.test(e.text)), 'the councils of war never voted');
});

test('on October 22 a family is asked whether its volunteer goes ahead with Bowie and Fannin, once, and the risk is not on the question', () => {
  const { world, person, seen } = campaign();
  assert.equal(seen.asked, 'open', 'the family was never asked');
  assert.ok(seen.story.some(text => /Does .* go with them/.test(text)), 'the question is not in the family story');
  assert.ok(seen.story.every(text => !/killed|die|danger|risk/i.test(text)), 'the question warned of the risk');
  assert.match(seen.again, /already been answered/);
  assert.equal(world.army.detachment.asks[person.id], 'go');
});

test('those who went fought and those who stayed were present, and each is told what their part was', () => {
  const { world, household, person } = campaign();
  const part = world.participation.concepcion;
  assert.equal(part[person.id].role, 'fought');
  const stayed = Object.entries(part).filter(([, p]) => p.role === 'present');
  for (const [id] of stayed) assert.notEqual(world.army.detachment.asks[id], 'go', `${id} went ahead and is counted present`);
  // And everybody who stayed with the main body is present, not fought: there must be some, or this proves nothing.
  const stayers = Object.entries(world.army.detachment.asks).filter(([, answer]) => answer === 'stay').map(([id]) => id);
  assert.ok(stayers.length > 0, 'nobody in the class stayed with the main army');
  for (const id of stayers) if (part[id]) assert.equal(part[id].role, 'present', `${id} stayed at Espada and is counted as having fought`);
  const award = world.glory[household.id].awards[`concepcion:${person.id}`];
  assert.equal(award.role, 'fought');
  assert.ok(storyOf(world, household.id).some(text => new RegExp(`${person.name} (fought with Bowie|was hurt in the fight|was killed in the fight)`).test(text)), 'the family was not told what happened to its person');
  // The news: the outcome, Andrews, and Mexican losses as a range that does not agree, never one figure.
  const word = world.events.find(e => /fight at Mission Concepción/.test(e.text) && e.visibility === 'public');
  assert.ok(word, 'the country never heard of the fight');
  assert.match(word.text, /Richard Andrews/);
  assert.match(word.text, /do not agree/);
  assert.match(word.text, /sixteen/); assert.match(word.text, /sixty-seven/);
  // And the families hear it in their own reports, not the Host's page alone.
  for (const household of Object.values(world.households)) assert.match(world.knowledge.households[household.id]['concepcion-fight']?.text || '', /do not agree/, `${household.id} never heard of Concepción`);
});

test('an unanswered family\'s volunteer stays with the main army, and a volunteer sent for is no longer asked', () => {
  const { world, household, person } = withVolunteer('concepcion-unanswered');
  untilMinute(world, momentOf(world, 'detachment') + 1);
  assert.equal(world.army.detachment.asks[person.id], 'open');
  untilMinute(world, momentOf(world, 'to-espada') + 1);
  assert.equal(world.army.detachment.asks[person.id], 'stay');
  assert.ok(storyOf(world, household.id).some(text => /Nobody answered, so .* stayed with the main army/.test(text)));
  assert.throws(() => applyAction(world, household.id, { action: 'detachment-go', entityId: person.id }), /Nobody is being asked/);

  const again = withVolunteer('concepcion-sent-for');
  untilMinute(again.world, momentOf(again.world, 'detachment') + 1);
  applyAction(again.world, again.household.id, { action: 'send-for', entityId: again.person.id });
  assert.equal(withTheArmy(again.world, again.person.id), false);
  assert.equal(again.world.army.detachment.asks[again.person.id], undefined);
});

/** Everybody of a class put in the ranks and sent ahead, their strength and health set, and the fight fought. */
let crowd = null;
function crowdedFight(seed, { strength, health, sex } = {}) {
  // One class played to the muster, cloned for every fight: the fates are rolled from the seed, so a new seed is a new fight.
  crowd ??= (() => { const base = colonies('concepcion-crowd', 30); untilMinute(base, momentOf(base, 'organised') + 1); return base; })();
  const world = structuredClone(crowd);
  world.seed = seed;
  const people = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
  world.army.members = people.map(p => p.id);
  for (const p of people) {
    p.traits = { ...(p.traits || {}), ...(strength !== undefined && { strength }), ...(health !== undefined && { health }) };
    if (sex) p.sex = sex;
  }
  openDetachment(world, null);
  for (const p of people) world.army.detachment.asks[p.id] = 'go';
  closeDetachment(world);
  return { world, result: fightConcepcion(world, null), people };
}

test('a class never loses more than one person at Concepción, and the weak and frail are the likelier to be the one', () => {
  let deaths = 0, frailDeaths = 0, hardyDeaths = 0, fights = 0;
  for (let n = 0; n < 40; n++) {
    const frail = crowdedFight(`concepcion-frail-${n}`, { strength: 1, health: 2 });
    const hardy = crowdedFight(`concepcion-hardy-${n}`, { strength: 10, health: 18 });
    for (const { result } of [frail, hardy]) {
      assert.ok(result.killed.length <= 1, `${result.killed.length} killed in one class`);
      assert.ok(result.fought.length > 50, 'the crowd did not fight');
      fights++;
    }
    frailDeaths += frail.result.killed.length; hardyDeaths += hardy.result.killed.length;
  }
  deaths = frailDeaths + hardyDeaths;
  assert.ok(deaths > 0, 'nobody ever died, so the bound was never tested');
  assert.ok(frailDeaths > hardyDeaths, `the frail died ${frailDeaths} times and the hardy ${hardyDeaths}`);
  assert.ok(frailty({ traits: { strength: 1, health: 2 } }) > frailty({ traits: { strength: 10, health: 18 } }));
  assert.equal(frailty({}), 1, 'somebody with no hidden stats is not treated as average');
  // The expected number in a real class is far below one: about one in a hundred for each fighter.
  assert.ok(CONCEPCION_DEATH_RISK > 0.005 && CONCEPCION_DEATH_RISK < 0.02);
  void fights;
});

test('a woman sent to fight keeps her award if she comes through, and has it taken away twice over if she does not', () => {
  let checkedDeath = false, checkedLife = false;
  for (let n = 0; n < 60 && !(checkedDeath && checkedLife); n++) {
    const { world, result } = crowdedFight(`concepcion-women-${n}`, { strength: 1, health: 2, sex: 'female' });
    for (const id of result.fought) {
      const person = world.entities[id];
      const award = world.glory[person.householdId].awards[`concepcion:${id}`];
      if (result.killed.includes(id)) {
        assert.ok(award.points < 0, 'a woman killed in the fight earned glory');
        assert.match(award.note, /held against a family/);
        assert.match(award.note, /game.s own reading/);
        checkedDeath = true;
      } else {
        assert.ok(award.points > 0, 'a woman who came through lost her award');
        assert.equal(award.note, undefined);
        checkedLife = true;
      }
    }
    validateWorld(world);
  }
  assert.ok(checkedDeath && checkedLife, 'no class had both a woman killed and one come through');
  // The penalty is exactly twice the award taken away, and it can never add.
  const world = colonies('concepcion-adjust');
  const person = world.entities[Object.values(world.households)[0].principalId];
  const earned = awardGlory(world, { event: 'probe', claimId: 'X', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'bexar' });
  const taken = awardGlory(world, { event: 'probe-2', claimId: 'X', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'bexar', adjust: points => -2 * points });
  assert.equal(taken, -2 * earned);
  assert.equal(awardGlory(world, { event: 'probe-3', claimId: 'X', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'bexar', adjust: points => 10 * points }), earned, 'an adjustment added glory');
  // And glory below nothing counts as nothing at the end: the coin is never erased.
  assert.equal(finalNumber(3, -6), 3);
  world.glory[person.householdId].total = -4;
  world.households[person.householdId].resources.money = 2;
  assert.match(familyEnding(world, person.householdId).sum, /-4 glory, counted as 0\) = 2$/);
});
