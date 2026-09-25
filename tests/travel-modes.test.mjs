// How somebody goes, and what it costs them.
//
// The owner's direction was "horse for speed, ox and wagon for heavy". The point of this
// file is that neither of those is a free upgrade: a family owns one horse, one ox and one
// wagon between four people, the wagon is slower than walking, and the thing you take is
// away from the farm while you have it. Walking is the only way that is always possible,
// which is what stops the other two from simply dominating it.
//
// `sim/travel.mjs` holds the table. Nothing in it is history: every number is invented for
// the lesson and `FIC-GONZ-014` registers it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, modestMeans } from './support/settled.mjs';
import {
  applyAction, beginTravel, createWorld, modeAvailability, projectWorld, stepWorld,
  travelModesFor, travelRefusal, validateWorld,
} from '../sim/world.mjs';
import { HORSE_SPEED, MODES, propertyId, WALK_SPEED } from '../sim/travel.mjs';
import { CHORES, haulFor } from '../sim/chores.mjs';
import { TIMELINE } from '../sim/directors.mjs';

const running = (seed = 'modes', count = 5) => {
  const world = createSettledWorld(seed, count);
  world.status = 'running';
  return world;
};
const person = (world, household, name) => world.entities[`${household}-${name}`];
const beast = (world, household, role) => world.entities[propertyId(household, role)];
/** Step until this person's journey is over, or give up rather than loop forever. */
function travelTo(world, entity, destination, mode) {
  beginTravel(world, entity, destination, null, 'visit', mode);
  for (let tick = 0; tick < 600 && entity.travel; tick++) stepWorld(world);
  assert.equal(entity.location.siteId, destination, `${entity.name} never arrived at ${destination}`);
}

test('the three ways of going are genuinely different, and none of them is simply best', () => {
  assert.deepEqual(Object.keys(MODES), ['foot', 'horse', 'wagon']);
  // Speed and load pull against each other. If they did not, there would be no decision.
  assert.ok(MODES.horse.speed > MODES.foot.speed, 'the horse is the fast one');
  assert.ok(MODES.wagon.speed < MODES.foot.speed, 'the wagon is slower than the people beside it');
  assert.ok(MODES.wagon.carry > MODES.horse.carry && MODES.horse.carry > MODES.foot.carry, 'and the slow one is the one that hauls');
  // Walking needs nothing and goes anywhere, which is what keeps it a real option.
  assert.deepEqual(MODES.foot.needs, [], 'walking must never depend on owning anything');
  assert.equal(MODES.foot.crossesFord, true);
  assert.equal(MODES.wagon.crossesFord, false, 'the ford is the wagon.s one hard stop');
  // Every way costs the legs something, and walking costs them the most.
  for (const mode of Object.values(MODES)) assert.ok(mode.exertion > 0 && mode.exertion <= 1, `${mode.id} tires by ${mode.exertion}`);
  assert.equal(MODES.foot.exertion, 1, 'walking is the full price and the others are fractions of it');
});

test('a family starts with an ox, a horse and a wagon - or no vehicle, on foot - and every one of them is somewhere', () => {
  const world = running('property');
  let walked = 0;
  for (const household of Object.values(world.households)) {
    // A family that came on foot (sim/means.mjs, the band that is hard up; owner 2026-09-25) has no wagon at all.
    if (household.means?.afoot) { walked++; assert.equal(beast(world, household.id, 'wagon'), undefined, `${household.id} came on foot with a wagon`); }
    for (const role of household.means?.afoot ? ['ox', 'horse'] : ['ox', 'horse', 'wagon']) {
      const owned = beast(world, household.id, role);
      assert.ok(owned, `${household.id} has no ${role}`);
      assert.equal(owned.location.siteId, household.homeSiteId, `the ${role} does not start at home`);
      assert.equal(owned.borrowedBy, null, `the ${role} starts out with nobody`);
      assert.ok(household.property.includes(owned.id), `the ${role} is not listed as the family.s`);
    }
    assert.equal(beast(world, household.id, 'ox').species, 'ox');
    assert.equal(beast(world, household.id, 'horse').species, 'horse', 'the renderer tells them apart by this and nothing else');
  }
  assert.ok(walked > 0, "no family of 'property' came on foot, so the family with no wagon is not held here");
});

test('taking the wagon takes the ox and the wagon, and they come back with you', () => {
  const world = running('harness');
  const mateo = person(world, 'hh-1', 'mateo');
  const ox = beast(world, 'hh-1', 'ox'), wagon = beast(world, 'hh-1', 'wagon');
  beginTravel(world, mateo, 'gonzales', null, 'visit', 'wagon');
  assert.equal(mateo.travel.mode, 'wagon');
  assert.equal(mateo.travel.speed, MODES.wagon.speed, 'the wagon sets the pace of the whole party');
  for (const carried of [ox, wagon]) {
    assert.equal(carried.borrowedBy, mateo.id, `${carried.name} was left behind`);
    assert.ok(carried.travel, `${carried.name} is not on the road`);
    assert.equal(carried.location.siteId, null, `${carried.name} cannot be travelling and at a place`);
  }
  validateWorld(world);
  // They keep step: one route, one speed, so nobody arrives without the load.
  for (let tick = 0; tick < 600 && mateo.travel; tick++) {
    stepWorld(world);
    if (mateo.travel) assert.equal(ox.travel?.progress, mateo.travel.progress, 'the ox drifted away from the person leading it');
  }
  assert.equal(mateo.location.siteId, 'gonzales');
  assert.equal(ox.location.siteId, 'gonzales', 'the ox is where it was taken, not back in the yard');
  assert.equal(wagon.location.siteId, 'gonzales');
  // Still his in town: whoever takes it keeps it until it is home (sim/keeping.mjs, owner's playtest 2026-09-16).
  assert.equal(ox.borrowedBy, mateo.id, 'the ox was handed to nobody the moment it stopped, away from home');
  validateWorld(world);
});

test('there is one wagon, so the second person to want it is told who has it', () => {
  const world = running('rivalrous');
  const mateo = person(world, 'hh-1', 'mateo'), rosa = person(world, 'hh-1', 'rosa');
  beginTravel(world, mateo, 'gonzales', null, 'visit', 'wagon');
  const refused = travelModesFor(world, rosa).find(mode => mode.id === 'wagon');
  assert.equal(refused.can, false);
  // Named from the world: who has the ox is a person whose name this class dealt.
  // The ox pulls the wagon, so he has both and is said to - and what he is doing with them (owner, 2026-09-24).
  assert.equal(refused.why, `${mateo.name} has the ox and wagon, on the road to Gonzales.`);
  assert.throws(() => beginTravel(world, rosa, 'gonzales', null, 'visit', 'wagon'), new RegExp(`${mateo.name} has the ox and wagon`));
  // The horse is a different animal and is still standing in the yard.
  assert.equal(travelModesFor(world, rosa).find(mode => mode.id === 'horse').can, true);
  // And walking is never taken away from anybody.
  assert.equal(travelModesFor(world, rosa).find(mode => mode.id === 'foot').can, true);
});

test('property left somewhere stays there, and cannot be used from anywhere else', () => {
  const world = running('left-behind');
  const mateo = person(world, 'hh-1', 'mateo'), rosa = person(world, 'hh-1', 'rosa');
  travelTo(world, mateo, 'gonzales', 'horse');
  // Mateo rode to town, so the horse is in town, with him. Rosa is at home and cannot ride it.
  const home = travelModesFor(world, rosa).find(mode => mode.id === 'horse');
  assert.equal(home.can, false);
  assert.equal(home.why, `${mateo.name} has the horse, at Gonzales.`);
  // Mateo, standing beside it, can.
  assert.equal(travelModesFor(world, mateo).find(mode => mode.id === 'horse').can, true);
  // He walks on without it: now it is nobody's, and simply not where Rosa is - which is what "not here" means.
  beginTravel(world, mateo, world.households['hh-1'].homeSiteId, null, 'visit', 'foot');
  assert.equal(beast(world, 'hh-1', 'horse').borrowedBy, null, 'a horse left behind is still held by the man who walked away');
  assert.match(travelModesFor(world, rosa).find(mode => mode.id === 'horse').why, /The horse is not here/);
});

test('riding is faster and costs the legs less; the wagon is slower and costs them little too', () => {
  // The same seed for all three, or they are three different maps and three different
  // roads, and the comparison is worth nothing.
  const [byFoot, byHorse, byWagon] = ['foot', 'horse', 'wagon'].map(mode => {
    const world = running('cost');
    const walker = person(world, 'hh-1', 'thomas');
    const before = world.tick;
    travelTo(world, walker, 'gonzales', mode);
    return { ticks: world.tick - before, exertion: walker.exertion };
  });
  assert.ok(byHorse.ticks < byFoot.ticks, `riding took ${byHorse.ticks} ticks against ${byFoot.ticks} walking`);
  assert.ok(byWagon.ticks > byFoot.ticks, `the wagon took ${byWagon.ticks} ticks against ${byFoot.ticks} walking`);
  // The same road, so the same miles - what differs is how much of them the body pays.
  assert.ok(byHorse.exertion < byFoot.exertion * .5, `riding cost ${byHorse.exertion} against ${byFoot.exertion} walking`);
  assert.ok(byWagon.exertion < byFoot.exertion, `the wagon cost ${byWagon.exertion} against ${byFoot.exertion} walking`);
  assert.ok(byHorse.exertion > 0, 'riding is not free');
});

test('the ford turns the wagon back, and lets the rider through', () => {
  const world = running('ford');
  const mateo = person(world, 'hh-1', 'mateo');
  travelTo(world, mateo, 'gonzales', 'foot');
  // Everything of theirs is still at home, so bring the wagon to town first; the refusal
  // has to be about the crossing and not about the wagon being somewhere else.
  const rosa = person(world, 'hh-1', 'rosa');
  travelTo(world, rosa, 'gonzales', 'wagon');
  assert.equal(beast(world, 'hh-1', 'wagon').location.siteId, 'gonzales');
  const stopped = travelRefusal(world, rosa, 'williams-camp', 'wagon');
  assert.match(stopped, /ford is no place for a wagon/);
  assert.throws(() => beginTravel(world, rosa, 'williams-camp', null, 'visit', 'wagon'), /ford is no place for a wagon/);
  assert.equal(rosa.travel, null, 'a refused journey must not have started one');
  // On foot the same road is simply a road.
  assert.equal(travelRefusal(world, rosa, 'williams-camp', 'foot'), null);
});

test('the call to go upriver is refused before a single thing moves', () => {
  // `handleMarch` writes the decision down and then sends somebody walking, so an
  // impossible journey discovered halfway through would leave a family that had agreed
  // to go with nobody on the road - the exact state the guard exists to prevent.
  const world = running('march-refusal');
  let asked = null;
  for (let tick = 0; tick < 400 && !asked; tick++) {
    stepWorld(world);
    for (const id of Object.keys(world.households)) {
      const view = projectWorld(world, id, 'student', { includeMap: false });
      if (view.request?.status === 'open' && view.request.kind !== 'march') {
        try { applyAction(world, id, { action: 'help', entityId: world.households[id].principalId }); } catch { /* not yet known */ }
      }
      if (view.request?.kind === 'march' && view.request.status === 'open') asked = { id, request: view.request };
    }
  }
  assert.ok(asked, 'no family was ever asked to go upriver');
  assert.ok(world.minute < TIMELINE.approach);
  const march = world.marches[asked.id];
  const actor = world.entities[asked.request.actorId];
  // Their wagon is at home, so this is refused for being absent rather than for the ford;
  // either way the promise must not be written down. Bring it to them and the ford is
  // then the only thing left to refuse it.
  assert.throws(() => applyAction(world, asked.id, { action: 'go-upriver', entityId: actor.id, mode: 'wagon' }), /ox is not here|ford is no place/);
  assert.equal(march.status, 'open', 'the march was recorded as accepted for a journey that never began');
  assert.equal(actor.travel, null);
  assert.equal(actor.commitments.filter(c => c.id === 'gonzales-march').length, 0, 'a promise was made for a journey that was refused');
  // On foot the same call is answered.
  applyAction(world, asked.id, { action: 'go-upriver', entityId: actor.id });
  assert.equal(world.marches[asked.id].status, 'accepted');
});

test('what a trip brings home is what they can carry home, and the rest is said out loud', () => {
  const hunter = CHORES['hunt-timber'];
  assert.equal(hunter.hauls, true);
  const world = running('haul');
  const mateo = person(world, 'hh-1', 'mateo');
  const full = haulFor(mateo, 'hunt-timber', 'wagon'), afoot = haulFor(mateo, 'hunt-timber', 'foot');
  assert.equal(full.kept, full.got, 'the wagon brings the whole kill back');
  assert.equal(afoot.kept, MODES.foot.carry, 'and a person brings back an armful');
  assert.ok(afoot.kept < full.kept, 'if those were the same there would be nothing to decide');

  // Played out, rather than reasoned about: the same hunter, the same timber, twice.
  const took = mode => {
    const played = running(`haul-${mode}`);
    const person_ = played.entities['hh-1-mateo'];
    const household = played.households['hh-1'];
    const before = household.resources.food;
    applyAction(played, 'hh-1', { action: 'chore', entityId: person_.id, chore: 'hunt-timber', mode });
    for (let tick = 0; tick < 600 && person_.chore; tick++) {
      // A hunt stops and asks now. Answering "wait" closes the range, so the shot is a
      // certainty and what is measured here is the carrying cap and nothing else - which
      // is what this test is about. Whether the shot connects has its own file.
      if (person_.chore?.ask) applyAction(played, 'hh-1', { action: 'answer-chore', entityId: person_.id, option: 'wait' });
      stepWorld(played);
    }
    return { gained: household.resources.food - before, world: played };
  };
  const walked = took('foot'), hauled = took('wagon');
  assert.ok(hauled.gained > walked.gained, `the wagon brought ${hauled.gained} against ${walked.gained} carried`);
  // Routine life also moves food, so this is about the difference and not the exact total.
  const said = walked.world.events.filter(e => /left .* behind/.test(e.text));
  assert.equal(said.length, 1, 'a family that had to leave food in the timber was never told');
  assert.match(said[0].text, /could carry 5 food home and left/);
  assert.equal(hauled.world.events.filter(e => /left .* behind/.test(e.text)).length, 0, 'the wagon left nothing and should say nothing');
});

test('a wagon with something in it knows it, and forgets once it is home', () => {
  const world = running('laden');
  const mateo = person(world, 'hh-1', 'mateo'), wagon = beast(world, 'hh-1', 'wagon');
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber', mode: 'wagon' });
  let everLaden = false;
  for (let tick = 0; tick < 600 && mateo.chore; tick++) {
    if (mateo.chore?.ask) applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'wait' });
    stepWorld(world);
    everLaden ||= Boolean(wagon.laden);
  }
  assert.ok(everLaden, 'the wagon came home from a hunt and was never drawn carrying anything');
  assert.equal(wagon.laden, false, 'and it is still loaded standing in its own yard');
  assert.equal(wagon.location.siteId, world.households['hh-1'].homeSiteId);
});

test('a student cannot invent a way of going', () => {
  const world = running('nonsense');
  // Journeys of their own belong to the principal; the rest of the family travels by
  // being sent on a chore. That split is older than this file and is not changed by it.
  const thomas = person(world, 'hh-1', 'thomas');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: thomas.id, destination: 'gonzales', mode: 'steamboat' }), /No such way of going/);
  assert.equal(thomas.travel, null);
  assert.equal(modeAvailability(world, thomas, 'steamboat').can, false);
  // An order that carries no way at all - a command older than the question, the director's - goes the quickest way that can
  // (owner, 2026-09-24; sim/going.mjs): the horse, standing free in the yard. Until then it walked.
  applyAction(world, 'hh-1', { action: 'travel', entityId: thomas.id, destination: 'gonzales' });
  assert.equal(thomas.travel.mode, 'horse');
  assert.equal(thomas.travel.speed, HORSE_SPEED);
});

test('a class saved before any of this existed still opens, and everybody in it walks', () => {
  // The judgement `CLAUDE.md` asks for, worked: the absent fields all have correct empty
  // values - no horse, and everybody on foot - so no save version moved and no class in
  // progress is lost. This is the same call `sim/trade.mjs` made for offers.
  const world = createWorld('old-save', 5);
  world.status = 'running';
  for (const household of Object.values(world.households)) {
    const horseId = propertyId(household.id, 'horse');
    household.property = household.property.filter(id => id !== horseId);
    delete world.entities[horseId];
    for (const id of household.property) delete world.entities[id].species;
  }
  validateWorld(world);
  const mateo = person(world, 'hh-1', 'mateo');
  const offered = travelModesFor(world, mateo);
  assert.equal(offered.find(mode => mode.id === 'horse').can, false);
  assert.match(offered.find(mode => mode.id === 'horse').why, /no horse/);
  assert.equal(offered.find(mode => mode.id === 'foot').can, true, 'walking must survive anything');
  assert.equal(offered.find(mode => mode.id === 'wagon').can, true, 'the ox and wagon were always there');
  travelTo(world, mateo, 'gonzales', 'foot');
  validateWorld(world);
});

test('the class is told how each of its people may travel, and never left to guess', () => {
  const world = running('projection');
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.ok(view.travelModes, 'the projection carries no travel permissions at all');
  for (const id of world.households['hh-1'].members) {
    assert.equal(view.travelModes[id].length, 3, `${id} was offered ${view.travelModes[id].length} ways`);
    for (const mode of view.travelModes[id]) assert.ok(mode.can || mode.why, 'a refused way that gives no reason is worse than no control');
    assert.ok(view.travelModes[id].every(mode => Number.isFinite(mode.carry)), 'the control cannot say what is left behind without this');
  }
  // Another household's people are none of this family's business.
  assert.equal(Object.keys(view.travelModes).length, world.households['hh-1'].members.length);
  const mateo = person(world, 'hh-1', 'mateo');
  beginTravel(world, mateo, 'gonzales', null, 'visit', 'horse');
  const moving = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.equal(moving.entities.find(e => e.id === mateo.id).travel.mode, 'horse', 'the renderer draws the horse from this');
  assert.equal(moving.entities.find(e => e.id === propertyId('hh-1', 'horse')).travel.mode, 'horse');
});

test('work that cannot be set out on is refused before it is written down', () => {
  // `beginChore` records the work and then immediately takes its first step, and for any
  // chore that goes somewhere that step is a journey. A journey refused after the work is
  // already written down leaves a person holding a chore with no road under it - and the
  // next tick simply moves them on to the *second* step, so they hunt in the timber
  // without ever leaving the yard. The refusal has to happen before anything is recorded.
  //
  // This is the one guard the nonsense case cannot prove. An invented mode is caught
  // three times over - by `applyAction`, by `beginTravel` and here - so breaking any one
  // of them alone changes nothing observable. A real mode that is merely unavailable is
  // caught here and nowhere else.
  // One ox and one wagon, so a second person asking for them is refused (sim/means.mjs gives a family of other means more).
  const world = modestMeans(running('half-written'));
  const mateo = person(world, 'hh-1', 'mateo'), rosa = person(world, 'hh-1', 'rosa');
  beginTravel(world, mateo, 'gonzales', null, 'visit', 'wagon');
  assert.throws(
    () => applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'hunt-timber', mode: 'wagon' }),
    new RegExp(`${mateo.name} has the ox`));
  assert.equal(rosa.chore, null, 'a refused order left the work written down anyway');
  assert.equal(rosa.task, 'rest', 'and left her set to work she was never sent on');
  // Played on, she must not quietly do the job from the yard.
  const before = world.households['hh-1'].resources.food;
  for (let tick = 0; tick < 40; tick++) stepWorld(world);
  assert.equal(rosa.location.siteId, world.households['hh-1'].homeSiteId);
  assert.ok(world.households['hh-1'].resources.food <= before + 1, 'food appeared from a hunt nobody went on');
});

test('an invented way of going never reaches a tick', () => {
  // Belt and braces, and said to be so: three separate guards refuse this, which is why
  // no single injection can make this test fail on its own. It is here because the thing
  // it protects is not one student's refused order - a journey begun with nonsense in it
  // throws from inside `advanceChores`, which is inside `stepWorld`, which stops the
  // whole class rather than one command.
  for (const id of Object.keys(CHORES)) {
    const world = running('tick-safety');
    const worker = person(world, 'hh-1', 'rosa');
    try { applyAction(world, 'hh-1', { action: 'chore', entityId: worker.id, chore: id, mode: 'steamboat' }); }
    catch (error) { assert.match(error.message, /No such way of going|not available|not ready|already planted|hoe is sound/); }
    assert.equal(worker.chore, null, `${id} was written down with a mode that does not exist`);
    for (let tick = 0; tick < 60; tick++) stepWorld(world);
  }
});
