import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, applyAction, projectWorld } from '../sim/world.mjs';
import { TIMELINE, CAMP_SITE, marchCost, marchRisk } from '../sim/directors.mjs';

// The second call: after a family's person has carried food into Gonzales, the force
// crosses the river and goes upriver, and the family is asked whether that person goes
// with them as far as the camp.
//
// Carrying food to a gathering and walking to where the shooting is are two different
// acts, so the game asks separately about the second. What it costs is stated on the
// control before the choice and resolves from the person's own condition, never from a
// hidden die. It stops at a minor, recoverable condition: HISTORY.md excludes individual
// wounds and casualty counts at Gonzales as historical fact, and FIC-GONZ-005 permits
// only fatigue or a minor condition as fiction.

const principal = (world, householdId) => world.entities[world.households[householdId].principalId];
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

// Play a class forward, answering the food call at once and the march call by policy.
function play(seed, { march = 'go-upriver', households = null, onTick = null } = {}) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  const ids = households || Object.keys(world.households);
  const helped = new Set(), answered = new Map(), atSettle = new Map();
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    // Conditions are read at the moment the errand settles, not at the end of the class:
    // since fatigue gained a second source, resting afterwards genuinely mends tiredness,
    // so the final state is about who rested rather than about what the errand cost.
    if (world.minute >= TIMELINE.resolved) for (const id of ids) if (!atSettle.has(id)) atSettle.set(id, world.entities[world.households[id].principalId].health.condition);
    for (const id of ids) {
      const request = view(world, id).request;
      if (request?.status === 'open' && request.kind !== 'march' && !helped.has(id)) {
        // A family with only a rumor goes to see first, and is asked properly once it is in town.
        try { applyAction(world, id, { action: request.kind === 'rumor' ? 'go-see' : 'help', entityId: world.households[id].principalId }); if (request.kind !== 'rumor') helped.add(id); } catch { /* not yet known */ }
      }
      if (request?.kind === 'march' && request.status === 'open' && !answered.has(id) && march) {
        answered.set(id, { tick, risk: request.risk, actorId: request.actorId });
        applyAction(world, id, { action: march, entityId: request.actorId });
      }
    }
    onTick?.(world, tick);
  }
  return { world, helped, answered, atSettle };
}

test('the call to go upriver is only put to a family whose person is actually standing in Gonzales', () => {
  const world = createGonzalesWorld('upriver-eligibility', 5);
  world.status = 'running';
  // hh-1 sends nobody; hh-2 sends its principal.
  let sent = false;
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    const offered = view(world, 'hh-2').request;
    if (offered?.status === 'open' && offered.kind !== 'march' && !sent) {
      try { applyAction(world, 'hh-2', { action: offered.kind === 'rumor' ? 'go-see' : 'help', entityId: world.households['hh-2'].principalId }); if (offered.kind !== 'rumor') sent = true; } catch { /* not yet known */ }
    }
    if (world.minute >= TIMELINE.crossing) {
      assert.equal(world.marches['hh-1'], undefined, 'a family that sent nobody was asked to march anyway');
      if (world.marches['hh-2']) break;
    }
  }
  assert.ok(sent, 'hh-2 never got the chance to help');
  assert.ok(world.marches['hh-2'], 'the family that sent somebody was never asked');
  assert.equal(world.marches['hh-2'].actorId, world.households['hh-2'].principalId);
});

test('somebody still on the road to Gonzales is not asked to go upriver from it', () => {
  // Answering the first call does not put you in town; walking there does. A family that
  // agreed late is still on the road when the force crosses, and cannot be asked to join
  // something it has not reached. This is the seam where distance from town will start
  // to matter once the map is large enough for it to.
  const world = createGonzalesWorld('upriver-onroad', 5);
  world.status = 'running';
  let sent = false, askedWhileTravelling = null, askedAfterArriving = null;
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    const entity = principal(world, 'hh-1');
    // Deliberately agree only just before the crossing, so the walk straddles it.
    if (!sent && world.minute >= TIMELINE.crossing - 120 && view(world, 'hh-1').request?.status === 'open') {
      try { applyAction(world, 'hh-1', { action: 'help', entityId: entity.id }); sent = true; } catch { /* not yet known */ }
    }
    if (sent && entity.travel && world.minute >= TIMELINE.crossing && world.marches['hh-1'] && askedWhileTravelling === null) askedWhileTravelling = true;
    if (sent && !entity.travel && entity.location.siteId === 'gonzales' && world.marches['hh-1'] && askedAfterArriving === null) askedAfterArriving = true;
  }
  assert.ok(sent, 'the fixture never managed a late agreement');
  assert.notEqual(askedWhileTravelling, true, 'a person still walking to Gonzales was asked to march out of it');
  assert.equal(askedAfterArriving, true, 'a person who did reach Gonzales in time was never asked');
});

test('going upriver is a journey over the ford, never a placement at the camp', () => {
  const seen = [];
  const { world, answered } = play('upriver-journey', {
    households: ['hh-1'],
    onTick: w => { const e = principal(w, 'hh-1'); if (e.travel?.to === CAMP_SITE) seen.push({ siteId: e.location.siteId, progress: e.travel.progress, distance: e.travel.distance }); },
  });
  assert.ok(answered.has('hh-1'), 'the march was never offered');
  assert.ok(seen.length >= 2, `going upriver took no measurable journey (${seen.length} travelling ticks)`);
  for (const step of seen) assert.equal(step.siteId, null, 'somebody travelling was still registered as standing at a site');
  assert.ok(seen.at(-1).progress > seen[0].progress, 'the journey never advanced');
  assert.ok(seen[0].distance > 2, `the camp was ${seen[0].distance.toFixed(1)} miles from Gonzales; that is not a journey over the ford`);
  assert.equal(principal(world, 'hh-1').location.siteId, CAMP_SITE, 'the person never arrived at the camp');
});

test('a family standing at the camp is sent the battle while it is happening', () => {
  let duringFight = null;
  play('upriver-witness', {
    households: ['hh-1'],
    onTick: w => {
      if (w.director.battle.phase === 'exchange' && !duringFight) {
        duringFight = { battle: view(w, 'hh-1').battle, at: principal(w, 'hh-1').location.siteId };
      }
    },
  });
  assert.ok(duringFight, 'the exchange never happened');
  assert.equal(duringFight.at, CAMP_SITE, 'the person was not at the camp during the exchange');
  assert.ok(duringFight.battle, 'a family standing at the camp was sent no battle to draw');
  assert.equal(duringFight.battle.phase, 'exchange');
  assert.equal(duringFight.battle.reconstruction, false, 'somebody present was shown a reconstruction rather than the thing itself');
});

test('what the control says it will cost is what actually happens', () => {
  // Exertion is set explicitly here rather than left to the walk, because since fatigue
  // gained a second source the walk itself decides the answer - which family this is and
  // how far they live from town now changes which of these two texts they see. That link
  // is what tests/fatigue.test.mjs covers; this test is about the two costs matching the
  // two texts, so it pins the input.
  const fresh = play('upriver-cost-fresh', {
    households: ['hh-1'],
    onTick: w => { const e = principal(w, 'hh-1'); if (w.minute < TIMELINE.crossing) { e.exertion = 0; if (e.health.condition === 'tired') e.health = { condition: 'well' }; } },
  });
  assert.match(fresh.answered.get('hh-1').risk, /will come back tired/);
  assert.equal(fresh.atSettle.get('hh-1'), 'tired');

  // Already tired: hurt, and it says so before the choice is made.
  const worn = play('upriver-cost-worn', {
    households: ['hh-1'],
    onTick: w => { const e = principal(w, 'hh-1'); if (w.minute >= TIMELINE.gathering && e.health.condition === 'well') e.health = { condition: 'tired' }; },
  });
  assert.match(worn.answered.get('hh-1').risk, /already tired.*hurt/s);
  assert.equal(worn.atSettle.get('hh-1'), 'minor-injury');
  const after = principal(worn.world, 'hh-1').health;
  assert.equal(after.condition, 'minor-injury');
  assert.ok(Number.isFinite(after.recoversAt) && after.recoversAt > worn.world.minute, 'a minor injury with no recovery is a permanent one');

  // The stated risk and the applied cost come from one place, so they cannot drift apart.
  assert.equal(marchCost('well'), 'tired');
  assert.equal(marchCost('tired'), 'minor-injury');
  assert.match(marchRisk('Ada', 'well'), /Ada will come back tired/);
});

test('the march never kills, captures or severely wounds anybody, whatever state they start in', () => {
  // Going upriver may move somebody one step down a short, recoverable ladder and no
  // further. It may never introduce death, capture or a severe wound that was not
  // already there, and it may never overwrite one that was.
  for (const condition of ['well', 'tired', 'minor-injury', 'dead', 'captured']) {
    const after = marchCost(condition);
    if (['dead', 'captured', 'minor-injury'].includes(condition)) {
      assert.equal(after, condition, `going upriver changed a ${condition} person into ${after}`);
      continue;
    }
    assert.ok(['tired', 'minor-injury'].includes(after),
      `starting ${condition}, going upriver produced ${after}; only fatigue or a minor condition is permitted by FIC-GONZ-005`);
  }
  // A dead or captured person is not asked at all, and is never quietly revived.
  const world = createGonzalesWorld('upriver-no-casualty', 5);
  world.status = 'running';
  let helped = false;
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    const request = view(world, 'hh-1').request;
    if (request?.status === 'open' && request.kind !== 'march' && !helped) {
      try { applyAction(world, 'hh-1', { action: 'help', entityId: world.households['hh-1'].principalId }); helped = true; } catch { /* not yet known */ }
    }
    if (world.minute >= TIMELINE.gathering && principal(world, 'hh-1').health.condition !== 'captured') principal(world, 'hh-1').health = { condition: 'captured' };
  }
  assert.equal(world.marches['hh-1'], undefined, 'a captured person was asked to march');
  assert.equal(principal(world, 'hh-1').health.condition, 'captured', 'a captured person was quietly restored');
});

test('staying in town is a real answer, recorded and not punished', () => {
  const { world, answered } = play('upriver-refuse', { households: ['hh-1'], march: 'stay-in-town' });
  assert.ok(answered.has('hh-1'), 'the march was never offered');
  const march = world.marches['hh-1'];
  assert.equal(march.status, 'refused');
  assert.equal(principal(world, 'hh-1').location.siteId, 'gonzales', 'somebody who declined was moved anyway');
  // Refusing the second call still leaves the first one honoured.
  assert.ok(world.households['hh-1'].relationships.neighbor >= 1, 'carrying the food stopped counting because they did not go on');
  const choice = world.events.find(e => e.id === march.choiceId);
  assert.equal(choice.decision, 'stay-in-town');
  assert.match(choice.text, /stay in Gonzales/);
  // Nothing repeats the ask.
  assert.equal(Object.values(world.events).filter(e => e.type === 'pressure' && e.householdId === 'hh-1' && e.claimId === 'FIC-GONZ-011').length, 1);
});

test('being there is recorded while it is happening, with the minute it happened', () => {
  // What this does and does not prove. It proves presence is stamped during the fight
  // and that the stamp is what the consequence reads. It does NOT prove that a late
  // arrival is denied the witness: at this map scale the walk from Gonzales to the camp
  // is short enough that everybody who answers is there in time, so `march.witnessed`
  // and "standing at the camp when it settles" cannot currently disagree. The stamp is
  // kept because it carries the minute - which the epilogue will want - and because it
  // stays correct if travel, the map or the timings change. Nothing here asserts a
  // divergence that cannot happen; see the `ceiling:` note in sim/directors.mjs.
  const { world } = play('upriver-late', { households: ['hh-1'] });
  const march = world.marches['hh-1'];
  assert.ok(Number.isFinite(march.witnessed), 'presence at the camp was never recorded');
  assert.ok(march.witnessed >= TIMELINE.approach && march.witnessed <= TIMELINE.withdrawal + 80,
    `the witness stamp was ${march.witnessed}, outside the window in which anything was happening`);
  const consequence = world.events.find(e => e.id === world.requests['hh-1'].consequenceId);
  assert.match(consequence.text, /stood at the camp/);
  assert.ok(consequence.causes.includes(march.choiceId), 'the consequence does not name the choice that caused it');
  const memory = world.events.find(e => e.id === world.households['hh-1'].memories.at(-1));
  assert.match(memory.text, /upriver to the camp and was there for it/);
});

test('a class saved before the march existed still runs and is simply never asked', () => {
  // No save version moves for this, so the guarantee is that the missing field defaults
  // rather than refusing the class. Same rule sim/trade.mjs set for offers.
  // A class where hh-1 hears the word firm enough to be called on, not third-hand as a rumor.
  const world = createGonzalesWorld('upriver-oldsave-1', 5);
  world.status = 'running';
  delete world.marches;
  world.barriers = world.barriers.filter(barrier => barrier.id !== 'gonzales:crossing');
  let helped = false;
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    const request = view(world, 'hh-1').request;
    if (request?.status === 'open' && request.kind !== 'march' && !helped) {
      assert.equal(request.kind, 'supplies', 'hh-1 was asked about a rumor, not called on');
      try { applyAction(world, 'hh-1', { action: 'help', entityId: world.households['hh-1'].principalId }); helped = true; } catch { /* not yet known */ }
    }
  }
  assert.equal(world.director.complete, true, 'a class saved before the march existed failed to finish');
  assert.ok(world.marches, 'the missing field was not defaulted');
  assert.ok(world.requests['hh-1'].consequenceId, 'the original food call stopped settling');
});
