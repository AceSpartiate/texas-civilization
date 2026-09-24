// He takes the rifle to the war, and the felling axe is one person's off the land (owner, 2026-09-24; docs/TOWNS.md §4b).
//
// > "The rifle and the war: he takes the rifle." A man who turns out for a call or the march upriver, or leaves to enlist or
// > join, carries the family's rifle for as long as he is away; the family cannot hunt or practise until he is home, and the
// > refusal names him.
// > "Tools: hold the felling axe off the land." Whoever carries it away from the family's own land has it until home; at home
// > the tools stay shared.
//
// Held here: every way he goes (a settlement's call, the march upriver, the winter's joining), every way he comes back (sent
// for and home, dead, taken prisoner), going without it when somebody has it out, an old save opening with it gone; and the
// axe carried off, refused to work at home meanwhile, shared among the work at home, and the family's again once home.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { userOf } from '../sim/keeping.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { createSettledWorld, taught } from './support/settled.mjs';

const view = (world, id) => projectWorld(world, id, 'student', { includeMap: false });
const until = (world, done, limit = 8000) => { for (let t = 0; t < limit && !done() && world.status === 'running' && !world.director?.complete; t++) stepWorld(world); };
/** Somebody of the family at home who could hunt but for the rifle: a grown person, well, not the one who went. */
const stayerOf = (world, household, gone) => {
  const stayer = household.members.map(id => world.entities[id]).find(p => p.id !== gone.id && p.location.siteId === household.homeSiteId && !p.travel && (p.age ?? 20) >= 16 && p.health.condition === 'well');
  // An ordinary hand, so the mark is open to them but for the rifle.
  if (stayer) stayer.skills = { ...stayer.skills, hunting: 1 };
  return stayer;
};

let calledShared = null;
/** A class on the colonies, run to the moment a family's settlement asks its men to turn out. */
function called() {
  if (calledShared) return structuredClone(calledShared);
  const world = createGonzalesWorld('war-rifle', 15, { map: 'colonies' });
  world.status = 'running';
  const household = () => Object.values(world.households).find(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId) && world.calls?.[h.id]?.status === 'open');
  until(world, () => household());
  calledShared = world;
  return structuredClone(world);
}
function turnOut(world) {
  const household = Object.values(world.households).find(h => ['san-felipe', 'mina', 'victoria'].includes(h.settlementId) && world.calls?.[h.id]?.status === 'open');
  const answerers = view(world, household.id).request.answerers;
  const [id] = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out').can);
  const volunteer = world.entities[id];
  household.resources.powder = 10;
  return { household, volunteer };
}

test('a man who turns out takes the rifle: nobody at home can hunt or practise, and the refusal names him and where he went', () => {
  const world = called();
  const { household, volunteer } = turnOut(world);
  applyAction(world, household.id, { action: 'turn-out', entityId: volunteer.id });
  assert.equal(userOf(world, household, 'rifle'), volunteer, 'the volunteer did not take the rifle');
  const place = world.map.sites[world.calls[household.id].gather].name;
  const stayer = stayerOf(world, household, volunteer);
  assert.ok(stayer, 'nobody at home to try the rifle, so this proves nothing');
  const said = `${volunteer.name} has the rifle, gone with the volunteers to ${place}.`;
  assert.equal(choreAvailability(world, household, stayer, 'practise-shooting').why, said);
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: stayer.id, chore: 'take-small-game' }), new RegExp(said.replace(/[.()]/g, '\\$&')));
  assert.ok(world.events.some(e => e.actorId === volunteer.id && /took the family's rifle/.test(e.text)), 'the story does not say he took it');
  // Still his at the gathering, days on.
  until(world, () => !volunteer.travel);
  assert.equal(userOf(world, household, 'rifle'), volunteer, 'the rifle came home without him');
  validateWorld(world);
  // Sent for, once there is an army to be sent for from: his until he is in the yard, and the family's again the tick he is.
  until(world, () => world.army?.members?.includes(volunteer.id), 4000);
  assert.equal(userOf(world, household, 'rifle'), volunteer, 'the rifle came home while he marched');
  applyAction(world, household.id, { action: 'send-for', entityId: volunteer.id });
  assert.equal(userOf(world, household, 'rifle'), volunteer);
  until(world, () => !volunteer.travel && volunteer.location.siteId === household.homeSiteId, 600);
  assert.equal(volunteer.location.siteId, household.homeSiteId, 'he never came home');
  assert.equal(userOf(world, household, 'rifle'), null, 'home, and still holding the rifle');
  stepWorld(world);
  assert.equal(volunteer.carries, undefined, 'the rifle he brought home is still written down as with him at the war');
  assert.equal(choreAvailability(world, household, stayer, 'practise-shooting').why?.includes('has the rifle') ?? false, false);
  validateWorld(world);
});

test('a man killed or taken holds nothing: the family has its rifle again', () => {
  for (const fate of ['dead', 'captured', 'prisoner']) {
    const world = called();
    const { household, volunteer } = turnOut(world);
    applyAction(world, household.id, { action: 'turn-out', entityId: volunteer.id });
    assert.equal(userOf(world, household, 'rifle'), volunteer);
    if (fate === 'prisoner') volunteer.service = { kind: 'fannin', status: 'prisoner', since: world.minute, siteId: 'goliad', prisonerSince: world.minute };
    else volunteer.health = { condition: fate };
    stepWorld(world);
    assert.equal(userOf(world, household, 'rifle'), null, `a man ${fate} still holds the rifle`);
    assert.equal(volunteer.carries, undefined, `the rifle is still written down with a man ${fate}`);
  }
});

test('a man who turns out while somebody has the rifle out goes without it, and is not handed it on a reload', () => {
  const world = called();
  const { household, volunteer } = turnOut(world);
  const hunter = stayerOf(world, household, volunteer);
  applyAction(world, household.id, { action: 'chore', entityId: hunter.id, chore: 'take-small-game' });
  assert.equal(userOf(world, household, 'rifle'), hunter);
  applyAction(world, household.id, { action: 'turn-out', entityId: volunteer.id });
  assert.equal(userOf(world, household, 'rifle'), hunter, 'the volunteer took the rifle out of the hunter\'s hands');
  assert.ok(world.events.some(e => e.actorId === volunteer.id && /went without the family's rifle/.test(e.text)), 'the story does not say he went without it');
  const dir = mkdtempSync(join(tmpdir(), 'texas-war-'));
  try {
    for (let t = 0; t < 200 && hunter.chore; t++) stepWorld(world);
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    assert.equal(userOf(opened, opened.households[household.id], 'rifle'), null, 'a reload handed him the rifle he went without');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a class saved with a man away at the war opens with the rifle gone with him', () => {
  const world = called();
  const { household, volunteer } = turnOut(world);
  applyAction(world, household.id, { action: 'turn-out', entityId: volunteer.id });
  delete volunteer.carries; // saved before 2026-09-24's second change
  assert.equal(userOf(world, household, 'rifle'), null, 'the fixture still held it, so this proves nothing');
  const dir = mkdtempSync(join(tmpdir(), 'texas-war-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    const holder = userOf(opened, opened.households[household.id], 'rifle');
    assert.equal(holder?.id, volunteer.id, 'the class opened with the rifle at home');
    assert.match(holder.carries.doing, /^gone with the volunteers to /);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('going upriver with the march takes the rifle too', () => {
  const world = createGonzalesWorld('war-march', 5);
  world.status = 'running';
  while (!world.truth['cannon-request']) stepWorld(world);
  learn(world, 'hh-1', 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  let went = null;
  for (let t = 0; t < 4000 && !went; t++) {
    stepWorld(world);
    const call = view(world, 'hh-1').request;
    if (call?.status !== 'open') continue;
    const principal = world.households['hh-1'].principalId;
    if (call.kind === 'supplies') { try { applyAction(world, 'hh-1', { action: 'help', entityId: principal }); } catch { /* not yet */ } }
    if (call.kind === 'march') { applyAction(world, 'hh-1', { action: 'go-upriver', entityId: call.actorId }); went = world.entities[call.actorId]; }
  }
  assert.ok(went, 'the march never asked, so this proves nothing');
  const household = world.households['hh-1'];
  assert.equal(userOf(world, household, 'rifle'), went);
  const stayer = stayerOf(world, household, went);
  if (stayer) assert.equal(choreAvailability(world, household, stayer, 'practise-shooting').why, `${went.name} has the rifle, gone upriver with the men at Gonzales.`);
});

test('leaving to join the garrison takes the rifle', () => {
  const world = createGonzalesWorld('war-winter', 5, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete, 20000);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news'], 20000);
  let found = null;
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const person = world.entities[id];
      if (view(world, household.id).work[id]?.some(entry => entry.id === 'join-garrison' && entry.can)) { found = { household, person }; break; }
    }
    if (found) break;
  }
  assert.ok(found, 'nobody could be sent to the garrison, so this proves nothing');
  const { household, person } = found;
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'join-garrison' });
  assert.equal(userOf(world, household, 'rifle'), person);
  const stayer = stayerOf(world, household, person);
  if (stayer) assert.equal(choreAvailability(world, household, stayer, 'practise-shooting').why, `${person.name} has the rifle, gone to the garrison at Béxar.`);
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ the felling axe
function axeWorld(seed) {
  const world = taught(createSettledWorld(seed, 5));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  household.resources.food = 30;
  // The family's line drawn tight round the house, so the timber is off its land (sim/grants.mjs: the whole grant with stock).
  const home = world.map.sites[household.homeSiteId];
  household.stock = true;
  household.grant = { minX: home.x - 0.02, minY: home.y - 0.02, maxX: home.x + 0.02, maxY: home.y + 0.02 };
  return { world, household, rosa: world.entities['hh-1-rosa'], mateo: world.entities['hh-1-mateo'], thomas: world.entities['hh-1-thomas'] };
}

test('the felling axe carried off the land is one person\'s until home, and nobody fells or builds with it meanwhile', () => {
  const { world, household, rosa, mateo, thomas } = axeWorld('axe-away');
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'make-furniture' });
  assert.deepEqual(rosa.chore.with, ['axe'], 'going for a small tree off the land did not take the axe');
  assert.equal(rosa.chore.shares, undefined, 'an axe carried off the land was shared');
  // At home meanwhile: the work that wants the axe is refused, in her name.
  assert.equal(choreAvailability(world, household, mateo, 'fell-trees').why, `${rosa.name} has the felling axe, deciding what to make.`);
  assert.match(choreAvailability(world, household, thomas, 'make-furniture').why, new RegExp(`^${rosa.name} has the felling axe`));
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: rosa.id, option: 'benches' });
  until(world, () => rosa.travel);
  assert.match(choreAvailability(world, household, mateo, 'fell-trees').why, new RegExp(`^${rosa.name} has the felling axe, on the road to `));
  // Home with the tree: the axe is the family's again while she makes the benches at home.
  until(world, () => !rosa.travel && rosa.location.siteId === household.homeSiteId && rosa.chore?.doing === 'making benches', 800);
  assert.equal(userOf(world, household, 'axe', mateo, { shares: ['axe'] }), null, 'home again, and the axe is still off the land');
  validateWorld(world);
});

test('at home the felling axe is shared by the work at home, and cannot be carried off while it is at work there', () => {
  const { world, household, rosa, mateo, thomas } = axeWorld('axe-home');
  // Mateo felling on the family's own land.
  mateo.chore = { id: 'fell-trees', step: 1, wait: 2, doing: 'felling a post oak', ground: { x: 0, y: 0 }, with: ['axe'], shares: ['axe'] };
  mateo.task = 'work';
  // Another at work at home shares it; nobody carries it off.
  assert.equal(userOf(world, household, 'axe', thomas, { shares: ['axe'] }), null, 'two at work at home could not share the axe');
  assert.equal(choreAvailability(world, household, rosa, 'make-furniture').why, `${mateo.name} has the felling axe, felling a post oak.`);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'make-furniture' }), new RegExp(`${mateo.name} has the felling axe`));
  // Done felling: it is free to go.
  mateo.chore = null; mateo.task = 'rest';
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'make-furniture' });
  assert.deepEqual(rosa.chore.with, ['axe']);
});

test('the axe is let go on every way the trip ends: called off, and a class saved with it off the land opens with it gone', () => {
  const { world, household, rosa, mateo } = axeWorld('axe-exits');
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'make-furniture' });
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: rosa.id });
  assert.equal(userOf(world, household, 'axe', mateo, { shares: ['axe'] }), null, 'the axe stayed off the land after the trip was called off');
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'make-furniture' });
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: rosa.id, option: 'benches' });
  until(world, () => rosa.travel);
  delete rosa.chore.with; // saved before 2026-09-24's second change
  const dir = mkdtempSync(join(tmpdir(), 'texas-axe-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    assert.equal(userOf(opened, opened.households['hh-1'], 'axe', opened.entities[mateo.id], { shares: ['axe'] })?.id, rosa.id, 'a class saved with the axe off the land opened with it at home');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  rosa.health = { condition: 'dead' };
  assert.equal(userOf(world, household, 'axe', mateo, { shares: ['axe'] }), null, 'the dead hold the axe');
});
