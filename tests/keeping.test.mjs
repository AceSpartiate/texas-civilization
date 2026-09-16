// One horse, one ox, one wagon, and one person using each (owner's playtest, 2026-09-16).
//
// "More than one character is able to use each mode of transportation even if it's already in use, that shouldn't be the
// case." A beast used to be anybody's the moment its journey ended, wherever that was. Whoever takes it now keeps it until
// it is home (sim/keeping.mjs), and the server refuses a second person whatever the page sent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, projectWorld, stepWorld, travelModesFor, validateWorld } from '../sim/world.mjs';
import { propertyId } from '../sim/travel.mjs';
import { oxFree } from '../sim/felling.mjs';

const running = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const person = (world, name) => world.entities[`hh-1-${name}`];
const beast = (world, role) => world.entities[propertyId('hh-1', role)];
const modeOf = (world, entity, id) => travelModesFor(world, entity).find(mode => mode.id === id);
function travelTo(world, entity, destination, mode) {
  beginTravel(world, entity, destination, null, 'visit', mode);
  for (let tick = 0; tick < 900 && entity.travel; tick++) stepWorld(world);
  assert.equal(entity.location.siteId, destination, `${entity.name} never arrived at ${destination}`);
}

test('the horse is his in town too: the second person there is told who has it, and a forged order is refused', () => {
  const world = running('keeping-town');
  const mateo = person(world, 'mateo'), thomas = person(world, 'thomas');
  const home = world.households['hh-1'].homeSiteId;
  travelTo(world, mateo, 'gonzales', 'horse');
  travelTo(world, thomas, 'gonzales', 'foot');
  // Both in town, the horse beside them both. It came with Mateo, and it is his until it is home.
  assert.equal(beast(world, 'horse').location.siteId, 'gonzales');
  const offered = modeOf(world, thomas, 'horse');
  assert.equal(offered.can, false, 'the horse was offered to a second person while the man who rode it stood beside it');
  assert.equal(offered.why, `${mateo.name} has the horse.`);
  // The page shows that. The server does not trust the page: the same order sent anyway is refused, and nothing moves.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: thomas.id, destination: home, mode: 'horse' }), new RegExp(`${mateo.name} has the horse`));
  assert.equal(thomas.location.siteId, 'gonzales', 'a refused order moved him anyway');
  assert.equal(beast(world, 'horse').borrowedBy, mateo.id);
  // Walking is never taken from anybody, and the projection says the same thing the refusal did.
  assert.equal(modeOf(world, thomas, 'foot').can, true);
  assert.equal(projectWorld(world, 'hh-1', 'student', { includeMap: false }).travelModes[thomas.id].find(mode => mode.id === 'horse').why, `${mateo.name} has the horse.`);
  // Mateo himself can ride on.
  assert.equal(modeOf(world, mateo, 'horse').can, true);
  validateWorld(world);
});

test('the horse is free again when it is home, and when whoever had it goes on without it', () => {
  const world = running('keeping-home');
  const mateo = person(world, 'mateo'), rosa = person(world, 'rosa');
  const home = world.households['hh-1'].homeSiteId;
  travelTo(world, mateo, 'gonzales', 'horse');
  travelTo(world, mateo, home, 'horse');
  assert.equal(beast(world, 'horse').borrowedBy, null, 'home again, and still held by the man who rode it');
  assert.equal(modeOf(world, rosa, 'horse').can, true, 'the horse is in the yard and Rosa cannot take it');
  // The ox and wagon the same way: taken to town, home, and free for the hauling a family does at home (sim/felling.mjs).
  travelTo(world, mateo, 'gonzales', 'wagon');
  assert.equal(oxFree(world, world.households['hh-1']), false);
  travelTo(world, mateo, home, 'wagon');
  assert.equal(oxFree(world, world.households['hh-1']), true, 'the ox came home and is still lent to the man who drove it');
  // Left behind: Mateo rides to town and walks home. The horse stays in town, nobody's, for whoever goes to fetch it.
  travelTo(world, mateo, 'gonzales', 'horse');
  travelTo(world, rosa, 'gonzales', 'foot');
  beginTravel(world, mateo, home, null, 'visit', 'foot');
  assert.equal(beast(world, 'horse').borrowedBy, null);
  assert.equal(modeOf(world, rosa, 'horse').can, true, 'the horse Mateo walked away from is still his');
  validateWorld(world);
});

test('the ox pulls the wagon: whoever has the wagon has the ox, and is said to have both', () => {
  const world = running('keeping-team');
  const mateo = person(world, 'mateo'), thomas = person(world, 'thomas');
  travelTo(world, mateo, 'gonzales', 'wagon');
  travelTo(world, thomas, 'gonzales', 'foot');
  for (const role of ['ox', 'wagon']) assert.equal(beast(world, role).borrowedBy, mateo.id, `the ${role} was let go in town`);
  const wagon = modeOf(world, thomas, 'wagon');
  assert.equal(wagon.can, false);
  assert.equal(wagon.why, `${mateo.name} has the ox and wagon.`);
  // The horse is a different animal, at home, and nobody has it: not here is all that is wrong with it.
  assert.match(modeOf(world, thomas, 'horse').why, /The horse is not here/);
});

test('work given with the horse holds it before the road out begins', () => {
  const world = running('keeping-promise');
  const mateo = person(world, 'mateo'), rosa = person(world, 'rosa');
  // Making furniture asks which piece before anybody leaves the yard, so the horse has not moved yet.
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'make-furniture', mode: 'horse' });
  assert.ok(mateo.chore?.ask, 'the work did not stop to ask first, so this proves nothing');
  assert.equal(beast(world, 'horse').travel, null);
  assert.equal(modeOf(world, rosa, 'horse').why, `${mateo.name} has the horse.`);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'hunt-timber', mode: 'horse' }), new RegExp(`${mateo.name} has the horse`));
  // Called off, it is free.
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: mateo.id });
  assert.equal(modeOf(world, rosa, 'horse').can, true);
});

test('a volunteer who rode to the army has the horse with them in the ranks, and rides it home when sent for', () => {
  const world = createGonzalesWorld('keeping-army', 15, { map: 'colonies' });
  world.status = 'running';
  const until = (done, limit = 3000) => { for (let tick = 0; tick < limit && !done() && !world.director.complete; tick++) stepWorld(world); };
  const household = Object.values(world.households).find(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId));
  until(() => world.calls?.[household.id]);
  const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
  const [volunteerId] = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out').can);
  const volunteer = world.entities[volunteerId];
  applyAction(world, household.id, { action: 'turn-out', entityId: volunteerId, mode: 'horse' });
  const horse = world.entities[propertyId(household.id, 'horse')];
  assert.equal(horse.borrowedBy, volunteerId, 'the volunteer did not ride');
  until(() => world.army?.phase === 'marching' && world.army.progress > 5);
  assert.ok(world.army?.members.includes(volunteerId), 'the volunteer never marched');
  // With them on the march, not left standing at the gathering.
  assert.equal(horse.travel?.purpose, 'march', 'the horse stayed behind when the army marched');
  assert.deepEqual([horse.location.x, horse.location.y], [volunteer.location.x, volunteer.location.y]);
  assert.equal(volunteer.travel.mode, 'horse', 'a volunteer with their horse is drawn walking beside it');
  const stayer = household.members.map(id => world.entities[id]).find(p => p.id !== volunteerId && p.location.siteId === household.homeSiteId && !p.travel && (p.age ?? 20) >= 16);
  assert.ok(stayer, 'nobody at home to ask for the horse, so this proves nothing');
  assert.equal(modeOf(world, stayer, 'horse').why, `${volunteer.name} has the horse.`);
  validateWorld(world);
  // Sent for: home on the horse, and the horse is free once it is in the yard.
  applyAction(world, household.id, { action: 'send-for', entityId: volunteerId });
  assert.equal(volunteer.travel?.mode, 'horse', 'sent home on foot, leaving the horse on the road');
  assert.equal(horse.travel?.purpose, 'harness');
  for (let tick = 0; tick < 400 && volunteer.travel; tick++) stepWorld(world);
  assert.equal(volunteer.location.siteId, household.homeSiteId);
  assert.equal(horse.location.siteId, household.homeSiteId);
  assert.equal(horse.borrowedBy, null);
  validateWorld(world);
});
