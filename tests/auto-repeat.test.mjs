// Auto repeats one task, and works about the place while it cannot be done (owner, 2026-09-25, docs/FAMILY_PANEL.md §16,
// sim/auto.mjs).
//
// "if it's on, the character should perform that task on repeat, and if it can't, then it should work around the house until
// that task becomes available again. i'm thinking that i could put a character on planting autoplay, and another one on
// harvest. then they'd naturally keep going until i turned off autoplay for them."
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, beginTravel, modeAvailability, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { RIPEN_TICKS } from '../sim/chores.mjs';
import { TOOL_LIFE } from '../sim/tools.mjs';
import { REPEATED, WAITS, advanceAuto } from '../sim/auto.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { autoLabel, autoLine, panelActions } from '../public/family-panel.js';

const running = seed => { const world = createSettledWorld(seed); world.status = 'running'; return world; };
const view = (world, householdId = 'hh-1') => projectWorld(world, householdId, 'student', { includeMap: false });
const shown = (world, id) => view(world, world.entities[id].householdId).entities.find(one => one.id === id);
const story = (world, id) => world.events.filter(event => event.actorId === id).map(event => event.text);
const finished = (world, id, name) => story(world, id).filter(text => text.endsWith(`finished: ${name}.`)).length;
const order = (world, id, chore) => applyAction(world, world.entities[id].householdId, { action: 'chore', entityId: id, chore });
const autoOn = (world, id, on = true) => applyAction(world, world.entities[id].householdId, { action: 'set-auto', entityId: id, auto: on });
const deps = { beginTravel, modeAvailability };

test('planting and the harvest on auto, two people, across a season: the field is planted, grows, is brought in and planted again, and nobody is stuck', () => {
  const world = running('auto-season');
  const household = world.households['hh-1'];
  household.resources.seed = 20;
  const planter = 'hh-1-thomas', reaper = 'hh-1-elena';
  autoOn(world, planter); autoOn(world, reaper);
  order(world, planter, 'plant-field');
  assert.equal(world.entities[planter].chore?.id, 'plant-field');
  // The harvest cannot be done yet - nothing is planted - and on auto it is taken as her task rather than refused.
  order(world, reaper, 'harvest-field');
  assert.equal(world.entities[reaper].order?.chore, 'harvest-field', 'the harvest was not remembered as her task');
  assert.equal(world.entities[reaper].chore, null);
  assert.equal(world.entities[reaper].task, 'work', 'waiting for the crop, she is not working about the place');
  assert.match(shown(world, reaper).autoTask.says, /^Auto: bring in the crop\. The field is not ready\. Working about the place meanwhile\.$/);
  assert.equal(shown(world, reaper).autoTask.waiting, true);
  // By hand the same order is still refused in the server's words: only a person on auto waits for it.
  assert.throws(() => order(world, 'hh-1-rosa', 'harvest-field'), /The field is not ready/);
  const states = [household.field.state];
  let plantedWaits = 0, longest = 0, since = { [planter]: 0, [reaper]: 0 };
  for (let t = 0; t < 400 && (finished(world, planter, 'plant the field') < 3 || finished(world, reaper, 'bring in the crop') < 2); t++) {
    stepWorld(world);
    if (states.at(-1) !== household.field.state) states.push(household.field.state);
    for (const id of [planter, reaper]) {
      const person = world.entities[id];
      since[id] = person.chore ? since[id] + 1 : 0;
      longest = Math.max(longest, since[id]);
      if (!person.chore) assert.equal(person.task, 'work', `${person.name}, on auto and waiting, was not working about the place (tick ${world.tick})`);
    }
    if (household.field.state === 'planted' && !world.entities[planter].chore) {
      plantedWaits++;
      assert.match(shown(world, planter).autoTask.says, /Auto: plant the field\. The field is already planted\. Working about the place/);
    }
  }
  assert.ok(finished(world, planter, 'plant the field') >= 3, `planted ${finished(world, planter, 'plant the field')} times`);
  assert.ok(finished(world, reaper, 'bring in the crop') >= 2, `brought in ${finished(world, reaper, 'bring in the crop')} times`);
  assert.deepEqual(states.slice(0, 7), ['bare', 'planted', 'ripe', 'bare', 'planted', 'ripe', 'bare'], `the field went ${states.join(' > ')}`);
  assert.ok(plantedWaits >= RIPEN_TICKS / 2, 'the planter never waited while the crop grew');
  assert.ok(longest < 40, `somebody was at one piece of work for ${longest} ticks`);
  assert.ok(household.resources.food > 16, 'the season brought nothing in');
  // Both still on auto, and each still remembering their own one task.
  assert.deepEqual([planter, reaper].map(id => world.entities[id].order.chore), ['plant-field', 'harvest-field']);
  validateWorld(world);
});

test('a worn hoe: auto mends it about the house, and goes back to the field', () => {
  const world = running('auto-hoe');
  const household = world.households['hh-1'];
  household.resources.seed = 20;
  household.tools.hoe = TOOL_LIFE;
  autoOn(world, 'hh-1-thomas');
  order(world, 'hh-1-thomas', 'plant-field');
  const thomas = world.entities['hh-1-thomas'];
  assert.equal(thomas.order.chore, 'plant-field');
  stepWorld(world);
  assert.equal(thomas.chore?.id, 'mend-hoe', 'the worn hoe was not mended');
  assert.match(shown(world, thomas.id).autoTask.says, /Auto: plant the field\. The hoe is worn out and wants mending\. Mending it first\./);
  for (let t = 0; t < 60 && thomas.chore?.id !== 'plant-field'; t++) stepWorld(world);
  assert.equal(thomas.chore?.id, 'plant-field', 'the hoe mended, the field was not taken up again');
});

test('the exits: off, called away, dead, and the family on the road east', () => {
  // Off: the work in hand finishes and nothing is taken up again, even when it could be.
  const world = running('auto-exits');
  const household = world.households['hh-1'];
  household.resources.seed = 20;
  const thomas = world.entities['hh-1-thomas'];
  autoOn(world, thomas.id);
  order(world, thomas.id, 'plant-field');
  autoOn(world, thomas.id, false);
  for (let t = 0; t < 60 && thomas.chore; t++) stepWorld(world);
  household.field = { ...household.field, state: 'bare' };
  for (let t = 0; t < 10; t++) stepWorld(world);
  assert.equal(thomas.chore, null, 'off, he went back to the field');
  assert.equal(shown(world, thomas.id).autoTask, undefined, 'off, the row still says what auto is doing');
  assert.equal(thomas.order.chore, 'plant-field', 'the task is remembered for the next time the switch is pressed');

  // Called away: the switch stays on, nothing is started while they are gone, and the task is taken up again at home.
  autoOn(world, thomas.id);
  applyAction(world, 'hh-1', { action: 'set-main', entityId: thomas.id });
  applyAction(world, 'hh-1', { action: 'travel', entityId: thomas.id, destination: 'gonzales', mode: 'foot' });
  assert.ok(thomas.travel, 'he did not set out');
  stepWorld(world);
  assert.equal(thomas.auto, true);
  assert.equal(thomas.chore, null, 'on the road, he started work at home');
  assert.match(shown(world, thomas.id).autoTask.says, /Auto: plant the field, taken up again when they are home\./);
  for (let t = 0; t < 900 && thomas.travel; t++) stepWorld(world);
  assert.equal(thomas.location.siteId, 'gonzales');
  // Standing in town, off the road: still away, and nothing is asked of him there.
  stepWorld(world); stepWorld(world);
  assert.equal(thomas.chore, null);
  assert.match(shown(world, thomas.id).autoTask.says, /Auto: plant the field, taken up again when they are home\./, 'in town, auto gave him work at home');
  applyAction(world, 'hh-1', { action: 'travel', entityId: thomas.id, destination: household.homeSiteId, mode: 'foot' });
  for (let t = 0; t < 900 && thomas.chore?.id !== 'plant-field'; t++) stepWorld(world);
  assert.equal(thomas.chore?.id, 'plant-field', 'home again, he did not take up the field');

  // The family on the road east: paused while it is gone, taken up again the tick it is home.
  for (let t = 0; t < 60 && thomas.chore; t++) stepWorld(world);
  household.field = { ...household.field, state: 'bare' };
  household.flight = { status: 'fled' };
  advanceAuto(world, deps);
  assert.equal(thomas.chore, null, 'with the family fled, he started work at home');
  assert.match(shown(world, thomas.id).autoTask.says, /taken up again when they are home/);
  household.flight.status = 'home';
  advanceAuto(world, deps);
  assert.equal(thomas.chore?.id, 'plant-field', 'the family home, he did not take up the field');
  delete household.flight;

  // Dead: nobody can press the switch for them any more, so it goes off and the task is forgotten.
  thomas.health = { condition: 'dead' };
  stepWorld(world);
  assert.equal(thomas.auto, undefined, 'a dead man is still on auto');
  assert.equal(thomas.order, undefined);
  assert.equal(shown(world, thomas.id).auto, undefined);
  validateWorld(world);
});

test('the guided start holds the gate for auto: a task the step does not allow is not taken up, nor taken as a task to wait for', () => {
  const world = running('auto-lesson');
  const household = world.households['hh-1'];
  household.played = true;
  household.lesson = { step: 'plant' };
  household.resources.seed = 20;
  const thomas = world.entities['hh-1-thomas'], elena = world.entities['hh-1-elena'];
  autoOn(world, thomas.id); autoOn(world, elena.id);
  // On the step to plant, the harvest is not this step's: refused by the lesson, and not remembered.
  assert.throws(() => order(world, elena.id, 'harvest-field'), /Not yet - first, put a crop in the ground\./);
  assert.equal(elena.order, undefined, 'the lesson\'s refusal was taken as a task');
  order(world, thomas.id, 'plant-field');
  for (let t = 0; t < 60 && household.lesson.step === 'plant'; t++) stepWorld(world);
  assert.equal(household.lesson.step, 'harvest');
  for (let t = 0; t < 60 && household.field.state !== 'ripe'; t++) stepWorld(world);
  order(world, elena.id, 'harvest-field');
  for (let t = 0; t < 60 && household.lesson.step === 'harvest'; t++) stepWorld(world);
  assert.equal(household.lesson.step, 'sell', 'the crop was not brought in');
  // The field is bare and Thomas is on auto to plant it, but the step is to sell: he waits about the place in the lesson's words.
  for (let t = 0; t < 10; t++) stepWorld(world);
  assert.equal(household.field.state, 'bare');
  assert.equal(thomas.chore, null, 'auto planted past the guided start');
  assert.equal(thomas.task, 'work');
  assert.match(shown(world, thomas.id).autoTask.says, /Auto: plant the field\. Not yet - first, sell what you grew\. Working about the place/);
  // The lesson over, he goes back to the field.
  household.lesson = { step: 'done' };
  stepWorld(world);
  assert.equal(thomas.chore?.id, 'plant-field', 'the gate open, auto did not take the field up again');
});

test('what repeats: the owner\'s field and hunts, the gathering and the house; never the errand, the herd or the war', () => {
  for (const id of ['plant-field', 'harvest-field', 'hunt-timber', 'hunt-land', 'fish-the-water', 'build-house']) assert.ok(REPEATED.includes(id), id);
  for (const id of ['visit-shop', 'butcher-beef', 'butcher-hog', 'practise-shooting', 'survey-plot', 'clear-plot', 'enlist-regular', 'join-houston', 'go-vote', 'child-eggs']) assert.ok(!REPEATED.includes(id), id);
  // Work done once leaves the task as it was: sent to mend the hoe, the hunter goes back to hunting when it is mended.
  const world = running('auto-once');
  const household = world.households['hh-1'];
  household.tools.hoe = TOOL_LIFE; household.resources.powder = 3;
  const elena = world.entities['hh-1-elena'];
  autoOn(world, elena.id);
  elena.order = { chore: 'hunt-timber', mode: 'foot' };
  order(world, elena.id, 'mend-hoe');
  assert.equal(elena.chore?.id, 'mend-hoe');
  assert.equal(elena.order.chore, 'hunt-timber', 'work done once replaced the task');
  assert.match(shown(world, elena.id).autoTask.says, /^Auto: hunt in the timber, once the work in hand is done\.$/);
  for (let t = 0; t < 60 && elena.chore?.id !== 'hunt-timber'; t++) stepWorld(world);
  assert.equal(elena.chore?.id, 'hunt-timber', 'the hoe mended, she did not go back to hunting');
  // A family whose student has gone is played by the director (sim/absence.mjs): what it orders is not the student's task.
  for (let t = 0; t < 400 && elena.chore; t++) stepWorld(world);
  household.absent = true; household.resources.seed = 20;
  delete elena.auto;
  order(world, elena.id, 'plant-field');
  assert.equal(elena.order.chore, 'hunt-timber', 'the director\'s order replaced the task the student left her on');
});

test('the page says what the server says: the switch\'s words, the row\'s line, and refused work that can be waited for', () => {
  const world = running('auto-page');
  const elena = world.entities['hh-1-elena'];
  assert.equal(autoLine(shown(world, elena.id)), '', 'a line for somebody not on auto');
  autoOn(world, elena.id);
  let seen = shown(world, elena.id);
  assert.equal(autoLine(seen), seen.autoTask.says);
  assert.match(seen.autoTask.says, /^Auto: nothing to repeat yet\./);
  order(world, elena.id, 'harvest-field');
  seen = shown(world, elena.id);
  assert.equal(autoLine(seen), 'Auto: bring in the crop. The field is not ready. Working about the place meanwhile.');
  assert.match(autoLabel(seen, true), /Auto: bring in the crop\. The field is not ready\./);
  assert.match(autoLabel(seen, true), /take the choices back/);
  // The work list: a refused harvest is offered to press, with the server's words, for somebody on auto and nobody else.
  const work = view(world).work;
  const theirs = work[elena.id].find(entry => entry.id === 'harvest-field'), rosas = work['hh-1-rosa'].find(entry => entry.id === 'harvest-field');
  assert.equal(theirs.waits, WAITS);
  assert.equal(rosas.waits, undefined);
  const icons = panelActions({ entity: seen, offered: work[elena.id], settable: true });
  const harvest = icons.find(icon => icon.key === 'harvest-field');
  assert.equal(harvest.can, true, 'on auto, the refused harvest cannot be pressed');
  assert.equal(harvest.waits, true);
  assert.equal(harvest.note, `The field is not ready. ${WAITS}`);
  const rosa = panelActions({ entity: shown(world, 'hh-1-rosa'), offered: work['hh-1-rosa'], settable: true }).find(icon => icon.key === 'harvest-field');
  assert.equal(rosa.can, false, 'by hand, the refused harvest can be pressed');
});

test('a class saved before opens as it was: a person on auto with a remembered hunt keeps it as their one task', () => {
  const world = running('auto-old');
  const mateo = world.entities['hh-1-mateo'];
  world.households['hh-1'].resources.powder = 0;
  mateo.auto = true;
  mateo.order = { chore: 'hunt-timber', mode: 'foot', held: 'there is no powder in the house to hunt with.' }; // as saved before 2026-09-25
  const dir = mkdtempSync(join(tmpdir(), 'auto-old-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    const him = opened.entities[mateo.id];
    assert.equal(him.order.chore, 'hunt-timber');
    assert.match(projectWorld(opened, 'hh-1', 'student', { includeMap: false }).entities.find(one => one.id === him.id).autoTask.says, /^Auto: hunt in the timber\./);
    stepWorld(opened);
    assert.equal(him.order.held, 'There is no powder in the house to hunt with.');
    assert.equal(him.task, 'work');
    opened.households['hh-1'].resources.powder = 3;
    stepWorld(opened);
    assert.equal(him.chore?.id, 'hunt-timber', 'the old save\'s hunt was not taken up again');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
