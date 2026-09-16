// The gathering and the march: docs/COLONIES.md §5.5 and §6h, build step 5.
//
// After the fight the volunteers keep coming into Gonzales, the town's own families are asked for
// the first time, the army is made on the afternoon of October 11 and marches for Béxar on the
// 13th (`HIST-TEX-018`). A family's volunteer is a person inside one body rather than one of forty
// walkers, and can be sent for at any time. The invented Gonzales country still stops when the
// fight is over, exactly as every class saved before this does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { ARMY_MILES_PER_HOUR, OBJECTIVE, RENDEZVOUS, armyInvalid, withTheArmy } from '../sim/army.mjs';
import { momentOf } from '../sim/directors.mjs';
import { calendarMinutes } from '../sim/clock.mjs';

const colonies = (seed, players = 15, options = {}) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies', ...options });
  world.status = 'running';
  return world;
};
const until = (world, done, limit = 2000) => { for (let tick = 0; tick < limit && !done() && !world.director.complete; tick++) stepWorld(world); };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId);
/** A family that answered its settlement's call, and the person it sent. */
function sentSomebody(world, settlements = ['san-felipe', 'mina', 'victoria']) {
  const household = Object.values(world.households).find(h => settlements.includes(h.settlementId));
  until(world, () => world.calls?.[household.id]);
  const answerers = view(world, household.id).request.answerers;
  const [personId] = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out').can);
  applyAction(world, household.id, { action: 'turn-out', entityId: personId, mode: 'horse' });
  return { household, person: world.entities[personId] };
}

let mustered = null;
/** One played-out class, shared: a volunteer sent, the army made, the march begun. */
const marchingClass = () => {
  if (mustered) return mustered;
  const world = colonies('army-march', 15);
  const sent = sentSomebody(world);
  until(world, () => world.director.milestones.organised);
  const atMuster = { members: [...world.army.members], minute: world.minute };
  until(world, () => world.director.milestones.march);
  until(world, () => world.director.complete);
  validateWorld(world);
  return (mustered = { world, sent, atMuster });
};

test('the volunteers are made into an army in the town, and it marches for Béxar', () => {
  const { world, sent, atMuster } = marchingClass();
  // Made on the eleventh out of whoever was standing there under a promise to serve.
  assert.ok(atMuster.members.includes(sent.person.id), `${sent.person.name} was at Gonzales and was not mustered`);
  assert.ok(atMuster.minute >= momentOf(world, 'organised'), 'the army formed before it was raised');
  assert.equal(world.army.phase, 'marching', 'the army never took the road');
  assert.ok(world.army.progress > 0, 'the army marched no distance at all');
  // Build step 6: it never marched into the town. By December 4 it stands at the old mill above Béxar, at the end of its
  // last short road (tests/concepcion.test.mjs has the march to Concepción, tests/siege.test.mjs the camps after).
  assert.equal(world.army.progress, world.army.road.distance, 'the army did not reach its last camp by the end');
  assert.equal(world.army.camp, 'the old mill above Béxar');
  // Out of the town it formed in, on the road to the town it is going to.
  assert.equal(world.army.road.points.length >= 2, true);
  // The taking of Goliad reached every family's own reports, not the Host's page alone.
  for (const household of Object.values(world.households)) assert.match(world.knowledge.households[household.id]['goliad-taken']?.text || '', /took the presidio/, `${household.id} never heard of Goliad`);
  assert.ok(world.map.sites[RENDEZVOUS] && world.map.sites[OBJECTIVE]);
  // The march is dated, and the calendar's longest stride comes in with it.
  assert.ok(world.director.milestones.march);
  assert.equal(world.director.phase, 'preserved');
  const said = world.events.filter(e => e.type === 'army').map(e => e.text);
  assert.ok(said.some(text => /mustered into the army/.test(text)), said.slice(0, 3).join(' / '));
  assert.ok(said.some(text => /marched out of .* for /.test(text)), said.slice(-3).join(' / '));
});

test('a volunteer marches as a person inside the army, and what the family is told is where it has got to', () => {
  const { world, sent } = marchingClass();
  assert.ok(withTheArmy(world, sent.person.id), `${sent.person.name} is not with the army`);
  // On the road: the world knows a person as at a place or between two, and marching is between.
  assert.equal(sent.person.location.siteId, null);
  assert.equal(sent.person.travel?.to, OBJECTIVE);
  assert.equal(sent.person.travel.purpose, 'march');
  // Carried by the army rather than walking their own road: their progress is the army's.
  assert.equal(sent.person.travel.progress, world.army.progress);
  const army = view(world, sent.household.id).army;
  assert.equal(army.phase, 'marching');
  // By the class's end it is camped at the old mill above Béxar, and a family is told the camp by name.
  assert.equal(army.at, 'the old mill above Béxar');
  assert.equal(army.camp, 'the old mill above Béxar');
  assert.ok(army.ours.some(one => one.id === sent.person.id), 'the family is not told its own man is in it');
  assert.equal(army.strength, world.army.members.length);
  assert.ok(army.miles > 0, 'the army is said to be no distance from home');
  // A family that sent nobody is told the same public facts and none of its own.
  const other = Object.values(world.households).find(h => h.id !== sent.household.id && !world.army.members.some(id => world.entities[id].householdId === h.id));
  if (other) assert.deepEqual(view(world, other.id).army.ours, []);
});

test('standing in the ranks the day the army was made is a part the family took', () => {
  const { world, sent } = marchingClass();
  const part = world.participation?.gathering?.[sent.person.id];
  assert.equal(part?.role, 'present', 'being there when it was made counted for nothing');
  assert.equal(part.householdId, sent.household.id);
  // Glory is written down sealed, and never projected while the class runs (sim/glory.mjs).
  const ledger = world.glory?.[sent.household.id];
  assert.ok(ledger?.awards[`gathering:${sent.person.id}`], 'no award for the gathering');
  assert.equal(view(world, sent.household.id).glory, undefined, 'glory leaked into what a student is told');
});

test('a family sends for its own volunteer, who leaves the ranks and starts home', () => {
  const world = colonies('army-send-for', 15);
  const sent = sentSomebody(world);
  until(world, () => world.army?.members.includes(sent.person.id));
  const marched = world.army.members.length;
  // Not another family's man, and not somebody who is not in it.
  const stranger = Object.values(world.households).find(h => h.id !== sent.household.id);
  assert.throws(() => applyAction(world, stranger.id, { action: 'send-for', entityId: sent.person.id }), /one of your family|not your family/i);
  const athome = world.households[sent.household.id].members.map(id => world.entities[id]).find(p => !withTheArmy(world, p.id));
  assert.throws(() => applyAction(world, sent.household.id, { action: 'send-for', entityId: athome.id }), /not with the army/);
  applyAction(world, sent.household.id, { action: 'send-for', entityId: sent.person.id });
  assert.equal(withTheArmy(world, sent.person.id), false, 'still in the ranks after being sent for');
  assert.equal(world.army.members.length, marched - 1);
  assert.equal(sent.person.travel?.to, world.households[sent.household.id].homeSiteId, 'not on the road home');
  assert.ok(sent.person.commitments.every(promise => promise.id !== 'volunteer' || promise.status !== 'active'), 'still promised to serve');
  assert.ok(storyOf(world, sent.household.id).some(event => event.text === `${sent.person.name} left the army and started home.`));
  // The army goes on without them, and they are not dragged along with it.
  const where = { ...sent.person.location };
  until(world, () => world.army.progress > 0 && world.minute > world.army.leftMinute + 1440);
  assert.notDeepEqual({ x: sent.person.location.x, y: sent.person.location.y }, { x: where.x, y: where.y });
  assert.equal(withTheArmy(world, sent.person.id), false);
  validateWorld(world);
});

test('somebody who reaches the rendezvous after the army has gone catches it on the road', () => {
  const world = colonies('army-late', 15);
  const sent = sentSomebody(world, ['liberty']);
  // Held at home until the army has left, then put at the rendezvous the way an arrival leaves them.
  until(world, () => world.director.milestones.march);
  assert.ok(!withTheArmy(world, sent.person.id) || sent.person.travel?.purpose === 'march');
  if (!withTheArmy(world, sent.person.id)) {
    const site = world.map.sites[RENDEZVOUS];
    sent.person.travel = null;
    sent.person.location = { x: site.x, y: site.y, siteId: RENDEZVOUS };
    // The army is up the road by now, so falling in has to happen where it actually is.
    until(world, () => withTheArmy(world, sent.person.id), 60);
  }
  assert.ok(withTheArmy(world, sent.person.id), 'a volunteer who came late never caught the army');
  assert.ok(storyOf(world, sent.household.id).some(event => /caught the army on the road|mustered into the army/.test(event.text)));
  validateWorld(world);
});

test('the ranks are made of people who promised and got there, and nobody else', () => {
  const world = colonies('army-muster-rule', 15);
  const sent = sentSomebody(world);
  until(world, () => world.minute >= momentOf(world, 'organised') - 600);
  const gonzales = world.map.sites[RENDEZVOUS];
  // Somebody standing in the town who never promised anything: a neighbour who carried food in,
  // a family that came to trade. Being where the army forms is not joining it.
  const bystander = Object.values(world.entities).find(person =>
    person.kind === 'person' && person.householdId && person.householdId !== sent.household.id && !person.travel && person.principal);
  bystander.location = { x: gonzales.x, y: gonzales.y, siteId: RENDEZVOUS };
  // And a volunteer who promised but is still on the road when the army is made. Riding within
  // sight of the town is not reaching it: they are on a journey of their own and are not to be
  // scooped into the ranks as the column passes. Set up on the last tick before the muster, half
  // a mile off and barely moving, which is the only way the case can be held still long enough to
  // look at - the gathering calendar carries twelve miles of road in a tick.
  const late = Object.values(world.households).find(h => h.id !== sent.household.id && h.id !== bystander.householdId);
  const latecomer = world.entities[late.members.find(id => world.entities[id].principal)];
  until(world, () => world.minute + calendarMinutes(world) >= momentOf(world, 'organised'));
  latecomer.commitments = [...(latecomer.commitments || []), { id: 'volunteer', type: 'service', status: 'active', gather: RENDEZVOUS }];
  latecomer.travel = { from: late.homeSiteId, to: 'victoria', points: [{ x: gonzales.x - 0.5, y: gonzales.y }, { x: gonzales.x - 60, y: gonzales.y }], progress: 0, distance: 60, speed: 0.01, mode: 'foot', purpose: 'volunteer', silent: true };
  latecomer.location = { x: gonzales.x - 0.5, y: gonzales.y, siteId: null };
  until(world, () => world.director.milestones.organised, 3);
  assert.ok(world.army, 'the army was never made');
  assert.equal(withTheArmy(world, bystander.id), false, `${bystander.name} was mustered without ever promising`);
  assert.equal(withTheArmy(world, latecomer.id), false, `${latecomer.name} was mustered while still on the road`);
  assert.ok(withTheArmy(world, sent.person.id), 'the one who promised and got there was left out');
  validateWorld(world);
});

test('somebody can be sent for after the column has gone, not only before it', () => {
  // The browser proof found this: a marching man holds a journey of the army's own, and every
  // other way of setting somebody off refuses to begin a journey inside one. Sending for a
  // volunteer worked at the muster and failed the moment the army moved - which is exactly when
  // a family would want him back.
  const world = colonies('army-send-for-marching', 15);
  const sent = sentSomebody(world);
  until(world, () => world.army?.phase === 'marching' && world.army.progress > 0);
  assert.ok(withTheArmy(world, sent.person.id), 'the volunteer never marched');
  assert.equal(sent.person.travel?.purpose, 'march');
  applyAction(world, sent.household.id, { action: 'send-for', entityId: sent.person.id });
  assert.equal(withTheArmy(world, sent.person.id), false);
  assert.equal(sent.person.travel?.purpose, 'home', 'he is not on a road of his own');
  assert.equal(sent.person.travel.to, world.households[sent.household.id].homeSiteId);
  // Started from a place the army had actually passed, rather than from a point in a field.
  assert.ok(world.map.sites[sent.person.travel.from], `he set out from ${sent.person.travel.from}`);
  validateWorld(world);
});

test('the army makes its miles by the calendar, so a fortnight of marching fits a lesson', () => {
  const { world } = marchingClass();
  const hours = (world.minute - world.army.leftMinute) / 60;
  const expected = ARMY_MILES_PER_HOUR * hours;
  // A mile an hour of 1835, whatever the tick was worth: the pace is a fact about men and carts.
  assert.ok(Math.abs(world.army.progress - Math.min(expected, world.army.road.distance)) < 1e-6,
    `${world.army.progress.toFixed(1)} miles in ${hours.toFixed(1)} hours`);
});

test('the invented Gonzales country still stops when the fight is over', () => {
  const world = createGonzalesWorld('army-invented', 15);
  world.status = 'running';
  until(world, () => world.director.complete);
  assert.equal(world.army, undefined, 'an army formed on the invented map');
  assert.equal(world.minute, momentOf(world, 'finish'), 'the class ended somewhere new');
  assert.equal(world.director.milestones['gathering-opens'], undefined, 'the gathering opened on the invented map');
  assert.ok(world.events.some(event => event.type === 'slice-preserved' && /Gonzales prototype stops here/.test(event.text)));
});

test('a saved class with an army opens, and one that claims an impossible army does not', () => {
  const { world } = marchingClass();
  const saved = structuredClone(world);
  assert.equal(armyInvalid(saved), null);
  validateWorld(saved);
  for (const [what, damage] of [
    ['a phase that is not one', w => { w.army.phase = 'winning'; }],
    ['somebody twice in the ranks', w => { w.army.members.push(w.army.members[0]); }],
    ['somebody who is not a person', w => { w.army.members.push('ox-1'); }],
    ['standing nowhere', w => { w.army.x = NaN; }],
    ['a place that is not there', w => { w.army.siteId = 'nowhere-at-all'; }],
  ]) {
    const broken = structuredClone(world);
    damage(broken);
    assert.ok(armyInvalid(broken), `${what} was accepted`);
    assert.throws(() => validateWorld(broken), undefined, `${what} opened`);
  }
});
