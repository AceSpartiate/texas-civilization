// Builders fell their own (owner, 2026-10-09, by multiple choice; docs/WOODS_AND_BUILDING.md §6.14, `FIC-GONZ-1235` to `-1239`):
//
// > "'Work on the house' is always on the bar once the house is placed; with no logs on the pile, the builders fell what they need
// > themselves. One name everywhere."
//
// A play-through as a new student (2026-10-09) found *Work on the house* off the bar until logs were on the pile, the house card naming a
// button that was not there ("assign Build house"), and the one felling axe in a feller's hands greying the house for everybody else.
// Each test here was proved by injecting the regression it guards (HANDOFF.md, the section of 2026-10-09).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choreCatalogue, choresFor } from '../sim/chores.mjs';
import { sexOf, tooYoung } from '../sim/family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseBuilt } from '../sim/houses.mjs';
import { houseNeeds, logsOnPile } from '../sim/woodpile.mjs';
import { CUSTOM } from '../sim/custom.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { barIcons, panelActions } from '../public/family-panel.js';
import { TIPS } from '../public/tips.js';

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class, hh-1 on its land with its site chosen and everybody home, and a round-log cabin placed: the pile empty. */
function placed(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const site = grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, 'hh-1', { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(member => world.entities[member].travel); tick++) stepWorld(world);
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  household.logs = { wall: 0, sill: 0, poor: 0 };
  const [thomas, elena, rosa, mateo] = ['thomas', 'elena', 'rosa', 'mateo'].map(key => world.entities[`hh-1-${key}`]);
  return { world, household, thomas, elena, rosa, mateo };
}
/**
 * Two little ones, two and four, so the family is six and keeps the custom (sim/custom.mjs `smallFamily`: fewer than six keep none).
 * Under seven, neither keeps, helps or is given work.
 */
function littleOnes(world, household) {
  const site = world.map.sites[household.homeSiteId];
  for (const [n, age, sex] of [[1, 2, 'female'], [2, 4, 'male']]) {
    const id = `${household.id}-little-${n}`;
    world.entities[id] = { id, name: `Little ${n}`, kind: 'person', householdId: household.id, depth: 'moderate', principal: false, location: { x: site.x, y: site.y, siteId: site.id },
      travel: null, health: { condition: 'well' }, task: 'rest', skills: {}, chore: null, kin: { role: sex === 'male' ? 'son' : 'daughter', spouse: null, parents: [], children: [] },
      relationships: {}, propertyRefs: [], commitments: [], sex, age };
    household.members.push(id);
  }
}
const view = world => projectWorld(world, 'hh-1', 'student', { includeMap: false });
const felledBy = (world, id) => Object.values(world.woods?.felled || {}).filter(entry => entry.by === id);

test('Work on the house is on the bar, pressable, once the house is placed and with nothing on the pile', () => {
  const { world, household, thomas } = placed('logs-bar');
  assert.equal(logsOnPile(household), 0, 'the pile starts empty');
  assert.ok(houseNeeds(world, household).wall > 0, 'the house wants logs');
  const entry = view(world).work[thomas.id].find(one => one.id === 'build-house');
  assert.ok(entry?.can, `Work on the house refused with an empty pile: ${entry?.why}`);
  const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));
  const icons = panelActions({ entity: thomas, offered: choresFor(world, household, thomas), catalogue, main: true });
  const bar = barIcons(icons);
  const icon = bar.find(one => one.key === 'build-house');
  assert.ok(icon?.can, 'Work on the house is not on the bar to press');
  assert.equal(icon.name, 'Work on the house', 'one name everywhere');
  // The house card says who fells them, and the tip names the same button.
  assert.equal(view(world).land.house.why, 'Whoever works on the house fells the logs first.');
  assert.match(TIPS.house, /“Work on the house”: they fell the logs it needs/);
  assert.doesNotMatch(TIPS.house, /Fell trees/, 'the tip still sends one to Fell trees');
  validateWorld(world);
});

test('one press: the builder fells what the house wants, onto the pile, then raises it from them, and nothing comes free', () => {
  const { world, household, thomas } = placed('logs-one');
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'build-house' });
  const wanted = houseNeeds(world, household);
  let fell = false, raisedAfterFelling = false;
  for (let tick = 0; tick < 600 && !houseBuilt(household); tick++) {
    stepWorld(world);
    if (houseBuilt(household)) break;
    assert.equal(thomas.chore?.id, 'build-house', `tick ${tick}: the one job set once was dropped`);
    if (thomas.chore.forLogs === 'fell') { fell = true; assert.deepEqual(thomas.chore.with, ['axe'], 'a feller holds an axe of their own'); assert.equal(thomas.chore.shares, undefined); }
    if (fell && !thomas.chore.forLogs && /course|sills|rafters/.test(thomas.chore.doing)) raisedAfterFelling = true;
    if (tick % 100 === 0) validateWorld(world);
  }
  assert.ok(fell, 'the builder never felled');
  assert.ok(raisedAfterFelling, 'the builder never raised the house from the logs felled');
  assert.ok(houseBuilt(household), 'the house never stood');
  // Every log came off a tree the builder felled: what was felled is what the house took and what is left on the pile.
  const felled = felledBy(world, 'hh-1');
  assert.ok(felled.length > 0);
  const logs = felled.reduce((sum, entry) => sum + entry.logs, 0);
  assert.equal(logs, wanted.wall + wanted.sill + wanted.any + logsOnPile(household), 'logs came from nowhere, or went nowhere');
  assert.ok(world.events.some(event => event.actorId === thomas.id && / logs? went onto the pile at the house\.$/.test(event.text)), 'the felling was never said');
  assert.ok(!world.events.some(event => /^Work on the house stopped/.test(event.text)), 'the house stopped for want of logs');
  validateWorld(world);
});

test('one felling axe locks no builder out: one fells, the other drags the logs in and raises the walls; and Fell trees and the house share it', () => {
  // Two on the house with the family's one axe.
  {
    const { world, household, thomas, mateo } = placed('logs-two');
    applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'build-house' });
    assert.ok(choreAvailability(world, household, mateo, 'build-house').can, 'the second builder was refused');
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
    stepWorld(world);
    const kinds = [thomas, mateo].map(person => person.chore?.forLogs).sort();
    assert.deepEqual(kinds, ['fell', 'haul'], 'one fells and one drags the logs in');
    const hauler = [thomas, mateo].find(person => person.chore.forLogs === 'haul');
    assert.equal(hauler.chore.with, undefined, 'dragging logs in holds no axe');
    let raised = false;
    for (let tick = 0; tick < 400 && !houseBuilt(household); tick++) {
      stepWorld(world);
      if (houseBuilt(household)) break;
      assert.ok(thomas.chore && mateo.chore, `tick ${tick}: a builder was locked out`);
      if (hauler.chore?.id === 'build-house' && !hauler.chore.forLogs && /course|sills/.test(hauler.chore.doing)) raised = true;
    }
    assert.ok(raised, 'the builder without the axe never raised a course');
    assert.ok(houseBuilt(household));
    validateWorld(world);
  }
  // Fell trees has the axe: the house is still open, and its builder drags the feller's logs in.
  {
    const { world, household, thomas, mateo } = placed('logs-feller');
    applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'fell-trees' });
    const open = choreAvailability(world, household, mateo, 'build-house');
    assert.ok(open.can, `the house was greyed by the feller's axe: ${open.why}`);
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
    stepWorld(world);
    assert.equal(mateo.chore?.forLogs, 'haul');
    assert.equal(mateo.chore.hauls, thomas.id);
  }
  // And the other way: somebody raising the walls with the axe shared at home leaves Fell trees open to another.
  {
    const { world, household, thomas, mateo } = placed('logs-raiser');
    household.logs = { wall: 60, sill: 6, poor: 0 };
    applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
    assert.deepEqual(mateo.chore.shares, ['axe'], 'the walls share the axe at home');
    const open = choreAvailability(world, household, thomas, 'fell-trees');
    assert.ok(open.can, `Fell trees was refused while the walls went up: ${open.why}`);
  }
  // The family's only axe carried off the land: the house is still open, and its builder waits at it, saying who has the axe.
  {
    const { world, household, thomas, rosa } = placed('logs-away');
    household.logs = { wall: 60, sill: 6, poor: 0 };
    rosa.location = { ...rosa.location, siteId: 'gonzales' };
    rosa.carries = { items: ['axe'], doing: 'gone to the timber off the land' };
    const open = choreAvailability(world, household, thomas, 'build-house');
    assert.ok(open.can, `the house was refused with the axe off the land: ${open.why}`);
    applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'build-house' });
    stepWorld(world);
    assert.equal(thomas.chore?.forLogs, 'wait');
    assert.equal(thomas.chore.doing, `waiting for the felling axe: ${rosa.name} has the felling axe, gone to the timber off the land`);
  }
});

test('a feller with a builder dragging in the logs fells faster, by the hands curve', () => {
  const trees = withHauler => {
    const { world, household, thomas, mateo } = placed('logs-pace');
    applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'fell-trees' });
    if (withHauler) applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
    for (let tick = 0; tick < 24; tick++) stepWorld(world);
    assert.equal(thomas.chore?.id, 'fell-trees');
    return thomas.chore.trees || 0;
  };
  const alone = trees(false), helped = trees(true);
  assert.ok(helped > alone, `a hauler made no difference: ${alone} trees alone, ${helped} with a hauler`);
});

test('auto does the same: somebody on auto at the house with the pile empty fells for it, and raises it', () => {
  const { world, household, thomas } = placed('logs-auto');
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: thomas.id, auto: true });
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'build-house' });
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: thomas.id });
  assert.equal(thomas.order?.chore, 'build-house');
  let fell = false;
  for (let tick = 0; tick < 600 && !houseBuilt(household); tick++) {
    stepWorld(world);
    fell ||= thomas.chore?.id === 'build-house' && thomas.chore.forLogs === 'fell';
    // Held only for a real reason - the rain on the roof is one - never for the pile.
    assert.doesNotMatch(thomas.order?.held || '', /logs|log pile/, `tick ${tick}: auto held the house for logs`);
  }
  assert.ok(fell, 'on auto, the builder never felled');
  assert.ok(houseBuilt(household));
  validateWorld(world);
});

test('the custom holds: a girl is refused the house with her father home, and a boy of fourteen leads it, felling, with no man home', () => {
  const { world, household, thomas, elena, rosa, mateo } = placed('logs-custom');
  littleOnes(world, household);
  Object.assign(rosa, { age: 13, sex: 'female', kin: { ...rosa.kin, role: 'daughter' } });
  Object.assign(mateo, { age: 14, sex: 'male', kin: { ...mateo.kin, role: 'son' } });
  // The father at home: building is his; the girl is refused it in the custom's words, and it is not on her bar.
  const refused = choreAvailability(world, household, rosa, 'build-house');
  assert.equal(refused.can, false);
  assert.equal(refused.why, `${CUSTOM['build-house'][1]} is men's work, and ${thomas.name} is at home.`);
  assert.equal(view(world).work[rosa.id].find(entry => entry.id === 'build-house'), undefined, 'the house is on the girl\'s bar');
  // The father away with the volunteers: the boy of fourteen keeps the men's work, and the house with it; he fells for it.
  thomas.task = 'help'; thomas.location = { ...thomas.location, siteId: 'gonzales' };
  assert.equal(choreAvailability(world, household, rosa, 'build-house').can, false, 'with the boy home, the girl may lead the house');
  assert.equal(choreAvailability(world, household, elena, 'build-house').can, false, 'with the boy home, his mother may lead the house');
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
  stepWorld(world);
  assert.equal(mateo.chore?.forLogs, 'fell', 'the boy did not fell for the house');
  // His mother may help him at it, and drags in what he fells.
  const help = choreAvailability(world, household, elena, 'build-house');
  assert.ok(help.can && help.help === mateo.id, `his mother may not help him: ${help.why}`);
  applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'build-house' });
  stepWorld(world);
  assert.equal(elena.chore?.helping, mateo.id);
  assert.equal(elena.chore?.forLogs, 'haul');
  validateWorld(world);
});

test('an old save opens: a builder on auto saved waiting for logs takes the house up and fells, and a builder saved felling goes on', () => {
  const { world, household, thomas, mateo } = placed('logs-old');
  // As a class saved before 2026-10-09 had it: the house refused for want of logs, the builder on auto holding the task about the place.
  thomas.auto = true;
  thomas.order = { chore: 'build-house', mode: 'foot', held: 'Waiting for logs. Laying the sills on the round-log pen wants 4 sill logs, and the log pile has not got them.' };
  thomas.chore = null;
  thomas.task = 'work';
  const directory = mkdtempSync(join(tmpdir(), 'house-logs-'));
  try {
    const path = join(directory, 'class.json');
    writeSave(path, { saveVersion: 3, world });
    const { world: opened } = readSave(path);
    validateWorld(opened);
    const builder = opened.entities[thomas.id];
    let fell = false;
    for (let tick = 0; tick < 20 && !fell; tick++) { stepWorld(opened); fell = builder.chore?.id === 'build-house' && builder.chore.forLogs === 'fell'; }
    assert.ok(fell, `the builder saved waiting for logs never felled: ${builder.chore?.doing || builder.order?.held}`);
    // Saved in the middle of felling for the house, and with a second builder dragging in: opened, both go on.
    applyAction(opened, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'build-house' });
    stepWorld(opened);
    writeSave(path, { saveVersion: 3, world: opened });
    const { world: again } = readSave(path);
    validateWorld(again);
    assert.equal(again.entities[thomas.id].chore.forLogs, 'fell');
    assert.equal(again.entities[mateo.id].chore.forLogs, 'haul');
    for (let tick = 0; tick < 10; tick++) stepWorld(again);
    assert.ok(again.entities[thomas.id].chore && again.entities[mateo.id].chore, 'a builder was dropped after the save');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
