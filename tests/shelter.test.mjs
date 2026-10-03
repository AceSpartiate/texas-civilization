// Out of the weather (owner, 2026-10-02; sim/shelter.mjs, docs/SETTLING_IN.md §4c, docs/CHILDREN.md §13).
//
// "families should put up tents to get out of the rain if their house isn't finished. when there's inclement weather, families that
// have members that aren't on a specific task that needs them outdoors, those characters should seek shelter. kids should always seek
// shelter, and a 10+yo character should have to accompany them and play with them since they can't play outdoors."
//
// Each test is about one rule and was proved by injecting the exact regression it guards (scripts/shelter-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { weatherAt } from '../sim/weather.mjs';
import { CANNOT_LEAVE, INCLEMENT, inclement, leavable, shelterPlace, tentPoint } from '../sim/shelter.mjs';
import { choresFor } from '../sim/chores.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { settle, taught } from './support/settled.mjs';

/**
 * A class on its land, every family rolled and `id` played, with no roof (or one, `housed`). `shelter-16`'s first family has rain
 * on the class's first day and fair weather the next (`weatherAt`, asserted, so a change to the weather fails here and not later).
 */
function family({ seed = 'shelter-16', id = 'hh-1', housed = false } = {}) {
  const world = taught(settle(createGonzalesWorld(seed, 5, { map: 'colonies' })));
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const household = world.households[id];
  // A second felling axe, so one may fell while another makes furniture by the house (docs/TOWNS.md §4c: one copy a person).
  household.spares = { ...(household.spares || {}), axe: [0] };
  household.played = true;
  world.status = 'running';
  if (!housed) household.improvements = { ...household.improvements, cabin: 'none' };
  delete household.choosingSite;
  const people = household.members.map(member => world.entities[member]);
  for (const person of people) { person.task = 'rest'; person.chore = null; }
  return { world, household, people };
}
const sky = (world, household, day = 0) => weatherAt(world, world.map.sites[household.homeSiteId], day).kind;
const step = (world, n = 1) => { for (let t = 0; t < n; t++) stepWorld(world); };
const view = (world, household) => projectWorld(world, household.id, 'student', { includeMap: false });
const grownOf = people => people.filter(person => person.age >= 10);
const childrenOf = people => people.filter(person => person.age < 10);
/** Set somebody to make a piece of furniture from the pile by the house (work near the house that can be left), answered, so it goes on. */
function toFurniture(world, household, person) {
  // Logs to spare beyond any house, so the furniture is made from the pile at home and not from a tree out in the timber.
  household.logs = { wall: 90, sill: 10, poor: 10 };
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'make-furniture' });
  for (const option of ['table', 'shelves', 'benches', 'cradle']) {
    if (!person.chore?.ask) break;
    try { applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option }); } catch { /* wants a tool the house has not got */ }
  }
  assert.ok(person.chore && !person.chore.ask, `${person.name} is not at the furniture`);
}
/** Step to the first tick of the next day, when `shelter-16` clears. */
const toTomorrow = world => { while (Math.floor(world.minute / 1440) < 1) stepWorld(world); };

test('the weather that sends people in: rain, a storm and a norther, wet or dry; never fog or a fair day', () => {
  assert.deepEqual(INCLEMENT, ['rain', 'storm', 'norther']);
  for (const kind of ['rain', 'storm', 'norther']) assert.equal(inclement({ kind }), true, kind);
  assert.equal(inclement({ kind: 'norther', wet: false }), true, 'a dry norther is bitter: everybody without a task goes in');
  for (const kind of ['fair', 'fog']) assert.equal(inclement({ kind }), false, kind);
  assert.equal(inclement(null), false, 'no reading is not foul weather');
});

test('the tent: offered to anybody of ten or more while there is no roof, put up by the camp, and struck when a pen is roofed', () => {
  const { world, household, people } = family();
  const [grown] = grownOf(people), [child] = childrenOf(people);
  assert.ok(choresFor(world, household, grown).some(entry => entry.id === 'pitch-tent' && entry.can), 'a grown person is not offered the tent');
  assert.ok(!choresFor(world, household, child).some(entry => entry.id === 'pitch-tent'), 'a child of nine or under is offered the tent');
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'pitch-tent' });
  for (let t = 0; t < 6 && grown.chore; t++) stepWorld(world);
  assert.equal(grown.chore, null, 'putting up the tent took more than six ticks');
  assert.deepEqual({ x: household.tent.x, y: household.tent.y }, tentPoint(world, household), 'the tent is not where the camp is');
  assert.ok(world.events.some(event => event.actorId === grown.id && /put up the tent/.test(event.text)));
  assert.deepEqual(view(world, household).land.tent, { x: household.tent.x, y: household.tent.y }, 'the page is not told where the tent stands');
  assert.ok(!choresFor(world, household, grown).some(entry => entry.id === 'pitch-tent'), 'a second tent is offered');
  // A roof: the canvas goes back on the wagon, and nobody is offered a tent.
  household.improvements = { ...household.improvements, cabin: 'sound' };
  stepWorld(world);
  assert.equal(household.tent, undefined, 'the tent still stands with a roof over the family');
  assert.ok(!choresFor(world, household, grown).some(entry => entry.id === 'pitch-tent'));
  validateWorld(world);
});

test('rain: everybody with no task and every child goes in under the tent; somebody at a task keeps at it; out again when it clears', () => {
  const { world, household, people } = family();
  assert.ok(INCLEMENT.includes(sky(world, household, 0)) && !INCLEMENT.includes(sky(world, household, 1)), 'the seed no longer rains on day 0 and clears on day 1');
  household.tent = { ...tentPoint(world, household), minute: 0 };
  const [maker, idle] = grownOf(people);
  const children = childrenOf(people);
  assert.ok(maker && idle && children.length >= 2, 'the family has two grown people and children');
  // At a task on the land by the house, where the rain falls on them as on everybody - raising the house's walls - they keep at it.
  applyAction(world, household.id, { action: 'plan-house', layout: 'round-log' });
  household.logs = { wall: 90, sill: 10, poor: 10 };
  applyAction(world, household.id, { action: 'chore', entityId: maker.id, chore: 'build-house' });
  assert.equal(maker.chore?.id, 'build-house');
  // One child set to a job before the weather is read: the job waits inside.
  const [worker] = children.filter(child => child.age >= 7);
  applyAction(world, household.id, { action: 'chore', entityId: worker.id, chore: 'child-water' });
  const before = Object.fromEntries(people.map(person => [person.id, { ...person.location }]));
  step(world, 1);
  const job = structuredClone(worker.chore);
  step(world, 1);
  const tent = shelterPlace(world, household);
  assert.equal(tent.at, 'tent');
  for (const child of children) {
    assert.equal(child.shelter?.at, 'tent', `${child.name}, ${child.age}, is out in the rain`);
    assert.deepEqual([child.location.x, child.location.y], [tent.x, tent.y]);
  }
  assert.equal(idle.shelter?.at, 'tent', 'somebody with nothing to do stayed out in the rain');
  // Tick after tick, not just this one: at work, never in.
  for (let t = 0; t < 4; t++) {
    assert.equal(maker.shelter, undefined, 'somebody at a task left it for the rain');
    assert.equal(maker.chore?.id, 'build-house');
    step(world, 1);
  }
  assert.equal(maker.location.siteId, household.homeSiteId, 'the maker is not on the land, so this proves nothing');
  assert.deepEqual(worker.chore, job, 'the child’s job went on in the rain');
  // On the way in the first tick, in after it; the page is told, and draws nothing more than that.
  assert.equal(children[0].shelter.phase, 'in');
  const shown = view(world, household).entities.find(entity => entity.id === children[0].id);
  assert.deepEqual(shown.shelter, { at: 'tent', phase: 'in' });
  // It clears: everybody goes back to where they stood, and the child's job goes on from where it stood.
  toTomorrow(world);
  step(world, 1);
  for (const person of [...children, idle]) {
    assert.equal(person.shelter, undefined, `${person.name} stayed in after the rain`);
    if (person !== worker) assert.deepEqual(person.location, before[person.id], `${person.name} did not go back to where they were`);
  }
  assert.equal(idle.aside, undefined);
  assert.ok(worker.chore === null || worker.chore.step >= job.step, 'the job was lost');
  validateWorld(world);
});

test('somebody of ten or more sits with the children: one already in first; else the nearest at work near the house, whose work stands', () => {
  const { world, household, people } = family();
  household.tent = { ...tentPoint(world, household), minute: 0 };
  const [father, mother] = grownOf(people);
  const children = childrenOf(people);
  // Both at work: he at the house (it can be left), she felling (it cannot).
  household.improvements.cabin = 'none';
  applyAction(world, household.id, { action: 'chore', entityId: mother.id, chore: 'fell-trees' });
  applyAction(world, household.id, { action: 'plan-house', layout: 'round-log' });
  household.logs = { wall: 60, sill: 0, poor: 0 };
  // The house wants the felling axe the mother holds; the father sits with the children whatever he was at near the house.
  toFurniture(world, household, father);
  assert.ok(leavable(father) && !leavable(mother), 'furniture can be left a while and felling cannot');
  // Called in at the end of the first tick, after its work: from then on it stands.
  step(world, 1);
  const held = structuredClone(father.chore);
  step(world, 1);
  assert.equal(father.aside?.kind, 'shelter', 'nobody of ten or more came in to the children');
  assert.deepEqual(father.aside.childIds.sort(), children.map(child => child.id).sort());
  assert.equal(mother.aside, undefined, 'the feller was called in from the timber');
  assert.equal(mother.chore?.id, 'fell-trees');
  assert.deepEqual(father.chore, held, 'his work went on while he sat with the children');
  assert.match(view(world, household).entities.find(entity => entity.id === father.id).life, /^Inside with .* out of the weather\.$/);
  assert.equal(view(world, household).entities.find(entity => entity.id === father.id).shelter.minding, true);
  step(world, 4);
  assert.deepEqual(father.chore, held, 'his work moved while he sat with the children');
  // It clears: he goes back to his work exactly where it stood.
  toTomorrow(world);
  step(world, 1);
  assert.equal(father.aside, undefined);
  assert.equal(father.shelter, undefined);
  validateWorld(world);
});

test("a student's order wins: the one with the children sent to new work goes to it, and is not called in again that day", () => {
  const { world, household, people } = family();
  household.tent = { ...tentPoint(world, household), minute: 0 };
  const [first, other] = grownOf(people);
  // The other grown person away in town: the one at home is the only one who can sit with the children.
  other.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  step(world, 2);
  assert.equal(first.aside?.kind, 'shelter', 'nobody sat with the children');
  // Nothing is refused them: the bar is open, and the order is taken.
  const open = view(world, household).work[first.id] || [];
  assert.ok(open.some(entry => entry.can), 'the one with the children was refused everything');
  toFurniture(world, household, first);
  step(world, 1);
  assert.equal(first.aside, undefined, 'the order did not send them');
  assert.equal(first.shelter, undefined, 'the one sent to work is still sheltering');
  assert.equal(first.chore?.id, 'make-furniture');
  const at = first.chore.step;
  // Their work near the house could be left for the children - but the student sent them to it: not called in again today.
  step(world, 4);
  assert.equal(first.aside, undefined, 'called in again the same day');
  assert.ok(!first.chore || first.chore.step >= at, 'the work did not go on');
  assert.ok(childrenOf(people).every(child => child.shelter), 'a child came out in the rain');
  validateWorld(world);
});

test('the companion: somebody free before anybody at work, an older child of ten to fifteen before a grown person, and never the timber', () => {
  const { world, household, people } = family();
  household.tent = { ...tentPoint(world, household), minute: 0 };
  const [father, mother] = grownOf(people);
  const children = childrenOf(people);
  const elder = children.find(child => child.age >= 7);
  // An elder child of twelve at work near the house, the father at work near the house, the mother free.
  elder.age = 12;
  household.spares = { axe: [0, 0] };
  for (const one of [elder, father]) applyAction(world, household.id, { action: 'chore', entityId: one.id, chore: 'make-furniture' });
  assert.ok(elder.chore && father.chore);
  step(world, 2);
  assert.equal(mother.aside?.kind, 'shelter', 'the free mother was not the one with the children');
  assert.equal(elder.aside, undefined);
  assert.equal(father.aside, undefined);
  // The mother is sent to fell: now an older child at work near the house is called in before the father.
  const { world: w2, household: h2, people: p2 } = family();
  h2.tent = { ...tentPoint(w2, h2), minute: 0 };
  h2.spares = { axe: [0, 0] };
  const [f2, m2] = grownOf(p2);
  const e2 = childrenOf(p2).find(child => child.age >= 7);
  e2.age = 12;
  applyAction(w2, h2.id, { action: 'chore', entityId: m2.id, chore: 'fell-trees' });
  applyAction(w2, h2.id, { action: 'chore', entityId: f2.id, chore: 'make-furniture' });
  applyAction(w2, h2.id, { action: 'chore', entityId: e2.id, chore: 'make-furniture' });
  assert.ok(m2.chore && f2.chore && e2.chore, 'somebody was not set to work');
  step(w2, 2);
  assert.equal(e2.aside?.kind, 'shelter', 'the father was called in before the elder child of twelve');
  assert.equal(f2.aside, undefined);
  assert.equal(m2.aside, undefined, 'the feller was called in');
  for (const flag of ['hunts', 'forage', 'fells', 'stock', 'nurses']) assert.ok(CANNOT_LEAVE.includes(flag), `${flag} may be left`);
  validateWorld(w2);
});

test('with nobody of ten or more who can come, the children keep each other company, and the family is told once', () => {
  const { world, household, people } = family();
  household.tent = { ...tentPoint(world, household), minute: 0 };
  for (const one of grownOf(people)) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  step(world, 3);
  const children = childrenOf(people);
  assert.ok(children.every(child => child.shelter?.at === 'tent'), 'a child stayed out in the rain');
  assert.ok(!people.some(person => person.aside?.kind === 'shelter'));
  const told = world.events.filter(event => event.householdId === household.id && /keep each other company out of the weather/.test(event.text));
  assert.equal(told.length, 1, 'the family was told more or less than once');
  validateWorld(world);
});

test('a family nobody plays: its children go in out of the rain, and nobody is called in to them', () => {
  const { world, household, people } = family();
  household.tent = { ...tentPoint(world, household), minute: 0 };
  delete household.played;
  step(world, 3);
  assert.ok(childrenOf(people).every(child => child.shelter?.at === 'tent'), 'a child of a family nobody plays stayed out in the rain');
  assert.ok(!people.some(person => person.aside?.kind === 'shelter'), 'somebody of a family nobody plays was called in to the children');
  validateWorld(world);
});

test('the first turn of the weather with no roof and no tent: whoever is free puts it up, and everybody else goes under the wagon meanwhile', () => {
  const { world, household, people } = family();
  assert.equal(household.tent, undefined);
  assert.equal(shelterPlace(world, household).at, 'wagon', 'with no tent and no roof the wagon is not the place to go');
  step(world, 1);
  const pitching = people.find(person => person.chore?.id === 'pitch-tent');
  assert.ok(pitching && pitching.age >= 10, 'nobody of ten or more put the tent up by themself');
  assert.ok(childrenOf(people).every(child => child.shelter?.at === 'wagon'), 'the children were not under the wagon while the tent went up');
  step(world, 4);
  assert.ok(household.tent, 'the tent never went up');
  step(world, 1);
  assert.ok(childrenOf(people).every(child => child.shelter?.at === 'tent'), 'the children were not moved in under the tent');
  validateWorld(world);
});

test('with a roof the family goes into the house, and the page is told so; the shelter saves and opens again as it was', () => {
  const { world, household, people } = family({ housed: true });
  step(world, 2);
  assert.equal(shelterPlace(world, household).at, 'house');
  const children = childrenOf(people);
  assert.ok(children.every(child => child.shelter?.at === 'house' && child.shelter.phase === 'in'));
  const dir = mkdtempSync(join(tmpdir(), 'shelter-'));
  try {
    const path = join(dir, 'class.json');
    writeSave(path, JSON.stringify({ saveVersion: 3, revision: 0, hostKey: 'k', sessionId: 's', sessionCode: 'AAAAAA', clients: {}, hostCommands: [], world }));
    const again = readSave(path).world;
    validateWorld(again);
    assert.deepEqual(again.entities[children[0].id].shelter, children[0].shelter);
    // A shelter that cannot be does not open.
    again.entities[children[0].id].shelter.at = 'cave';
    assert.throws(() => validateWorld(again), /Invalid shelter/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
