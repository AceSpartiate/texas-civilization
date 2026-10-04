// One wood pile, felling on auto and building on auto (owner, 2026-09-28; docs/WOODS_AND_BUILDING.md §6.7, docs/FAMILY_PANEL.md §21).
//
// "the tasks are way too complicated. Why do we need multiple action buttons for moving logs? That should be consolidated and an
// automatic part of felling trees. Any task that pulls from wood should be able to pull from the universal wood pile. I should be
// able to set one person on felling trees, and one person on building the house, set each to auto, and eventually get a house."
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreJourney, choresFor } from '../sim/chores.mjs';
import { sexOf, tooYoung } from '../sim/family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseBuilt } from '../sim/houses.mjs';
import { fellingGround, logsLeftOut, standingTrees } from '../sim/felling.mjs';
import { WOOD_MARGIN, houseStillWants, logsOnPile, pileFull, spareLogs } from '../sim/woodpile.mjs';
import { plotsOf } from '../sim/fields.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { panelActions } from '../public/family-panel.js';

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class, the families on their land, `id`'s house site chosen and everybody brought over to it. */
function onTheLand(seed, id = 'hh-1', count = 5) {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households[id];
  const site = grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, id, { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(member => world.entities[member].travel); tick++) stepWorld(world);
  return { world, household };
}
// The family's men and boys: felling, building, clearing and surveying are the men's work while a man is at home (owner, 2026-10-03,
// "Custom, necessity opens"; sim/custom.mjs).
const grown = (world, household) => household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person) && sexOf(person) !== 'female');
const said = (world, id) => projectWorld(world, world.entities[id].householdId, 'student', { includeMap: false }).entities.find(one => one.id === id)?.autoTask?.says;

test('one person felling on auto and one building on auto, left alone, raise the house with no further clicks', () => {
  const { world, household } = onTheLand('auto-house');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  const [feller, builder] = grown(world, household);
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: feller.id, auto: true });
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: builder.id, auto: true });
  // One press each: felling needs no place chosen, and the house with no logs yet is taken as her task to wait for.
  applyAction(world, 'hh-1', { action: 'chore', entityId: feller.id, chore: 'fell-trees' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: builder.id, chore: 'build-house' });
  assert.equal(feller.chore?.id, 'fell-trees');
  assert.equal(builder.chore, null);
  assert.equal(builder.order.chore, 'build-house');
  // The row says she is waiting for logs, in plain words, and she works about the place meanwhile.
  stepWorld(world);
  assert.match(said(world, builder.id), /^Auto: work on the house\. Waiting for logs\. .* the log pile has not got them\. Working about the place meanwhile\.$/);
  assert.equal(builder.task, 'work');
  // That first tick is her wait for logs (the match above); since felling went at half again (2026-10-02, sim/work-pace.mjs
  // `FELL_PACE`) the pile may never run dry under her after it, so the loop no longer looks for a second one.
  let enough = false, most = 0;
  for (let tick = 0; tick < 1500 && !houseBuilt(household); tick++) {
    stepWorld(world);
    if (/The log pile has enough/.test(said(world, feller.id) || '')) enough = true;
    most = Math.max(most, logsOnPile(household));
    // Nothing is left lying to be carried: every log is on the pile the moment its tree is down.
    assert.equal(logsLeftOut(world, household), 0, 'no log lies out');
    if (tick % 100 === 0) validateWorld(world);
  }
  assert.ok(houseBuilt(household), 'the house stands, and nobody pressed anything after the first two orders');
  assert.equal(household.improvements.cabin, 'sound');
  // The feller stopped when the pile held enough, rather than felling the whole holding.
  assert.ok(enough, 'the feller never said the pile had enough');
  assert.ok(most <= houseStillWants(world, { ...household, house: undefined, improvements: { cabin: 'none' } }) + WOOD_MARGIN + 20, `the pile ran to ${most} logs`);
  // Both still on auto, each remembering their own one task.
  assert.deepEqual([feller, builder].map(person => person.order.chore), ['fell-trees', 'build-house']);
  validateWorld(world);
});

test('felling is one press: the nearest timber on the family\'s land, the logs onto the pile, and nothing to haul or fetch on the panel', () => {
  const { world, household } = onTheLand('fell-one-press');
  const [axe] = grown(world, household);
  const place = fellingGround(world, household);
  assert.ok(place?.sound, 'sound timber stands on the land');
  const offered = choresFor(world, household, axe);
  assert.ok(offered.some(entry => entry.id === 'fell-trees' && entry.can), 'felling is offered');
  for (const gone of ['haul-logs', 'fetch-logs']) assert.ok(!offered.some(entry => entry.id === gone), `${gone} is not a button any more`);
  // Nobody is asked how they will go: felling is on the family's own land.
  assert.equal(choreJourney(world, household, axe, 'fell-trees'), null);
  applyAction(world, 'hh-1', { action: 'chore', entityId: axe.id, chore: 'fell-trees' });
  assert.deepEqual({ x: axe.chore.ground.x, y: axe.chore.ground.y }, { x: Math.round(place.x * 10000) / 10000, y: Math.round(place.y * 10000) / 10000 });
  for (let tick = 0; tick < 300 && axe.chore; tick++) stepWorld(world);
  assert.equal(axe.chore, null, 'by hand, one stand of timber and home');
  const felled = Object.values(world.woods.felled).filter(entry => entry.by === 'hh-1');
  assert.ok(felled.length > 0);
  assert.equal(logsOnPile(household), felled.reduce((sum, entry) => sum + entry.logs, 0), 'every log of every tree felled is on the pile');
  assert.ok(felled.every(entry => entry.left === 0), 'none lies out');
  assert.ok(world.events.some(event => event.actorId === axe.id && / logs? went onto the pile at the house\.$/.test(event.text)));
  assert.equal(standingTrees(world, place).some(tree => tree.x === place.x && tree.y === place.y), false, 'the nearest tree is down');
  validateWorld(world);
});

test('a family whose land has no timber fells at the nearest timber off it, with the ox and wagon, and it glows as felling', () => {
  const { world, household } = onTheLand('t3', 'hh-7', 12); // hh-7: the burn zone's deal by the seed (owner, 2026-09-29, D12) moved hh-8 onto timber
  assert.equal(fellingGround(world, household), null, 'nothing stands to fell on this land');
  const [axe] = grown(world, household);
  applyAction(world, 'hh-7', { action: 'chore', entityId: axe.id, chore: 'fell-trees' });
  assert.equal(axe.chore.id, 'fetch-logs', 'fetching logs from the timber off the land, begun by Fell trees');
  assert.equal(axe.chore.mode, 'wagon');
  const icons = panelActions({ entity: axe, offered: choresFor(world, household, axe), main: false });
  assert.equal(icons.find(icon => icon.active)?.key, 'fell-trees', 'the felling icon glows');
  for (let tick = 0; tick < 400 && axe.chore; tick++) stepWorld(world);
  assert.equal(axe.chore, null);
  assert.ok(logsOnPile(household) >= 6, 'a wagon load of logs is on the pile');
  validateWorld(world);
});

test('everything that uses wood takes it from the one pile: furniture made from a spare log asks nobody how they will go', () => {
  const { world, household } = onTheLand('pile-furniture');
  household.house = undefined;
  household.improvements = { ...household.improvements, cabin: 'sound' };
  household.logs = { wall: 0, sill: 0, poor: 3 };
  const [maker] = grown(world, household);
  assert.equal(spareLogs(world, household), 3, 'with a roof up the house wants nothing, and all three are spare');
  assert.equal(choreJourney(world, household, maker, 'make-furniture'), null, 'from the pile, nobody goes anywhere');
  applyAction(world, 'hh-1', { action: 'chore', entityId: maker.id, chore: 'make-furniture' });
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: maker.id, option: 'benches' });
  for (let tick = 0; tick < 100 && maker.chore; tick++) { stepWorld(world); assert.equal(maker.travel, null, 'never on a road'); }
  assert.equal(household.furniture?.benches, 'made', 'the benches were made');
  assert.equal(logsOnPile(household), 2, 'one log came off the pile');
  // The house still to be built comes first: with the pile no bigger than what it wants, nothing is spare.
  household.improvements.cabin = 'none';
  household.logs = { wall: 0, sill: 0, poor: 3 };
  assert.equal(spareLogs(world, household), 0);
  assert.notEqual(choreJourney(world, household, maker, 'make-furniture'), null, 'a small tree from the timber, as before');
  validateWorld(world);
});

test('a feller on auto calls it enough when the house has its logs and a margin, and takes the axe up again when the pile falls', () => {
  const { world, household } = onTheLand('auto-enough');
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'round-log' });
  const [feller] = grown(world, household);
  const wants = houseStillWants(world, household);
  household.logs = { wall: wants + WOOD_MARGIN, sill: 0, poor: 0 };
  assert.match(pileFull(world, household), /^The log pile has enough: \d+ logs at the house, and the house still wants \d+\.$/);
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: feller.id, auto: true });
  applyAction(world, 'hh-1', { action: 'chore', entityId: feller.id, chore: 'fell-trees' });
  for (let tick = 0; tick < 200 && feller.chore; tick++) stepWorld(world);
  stepWorld(world);
  assert.equal(feller.chore, null, 'enough: nobody goes out');
  assert.equal(feller.task, 'work', 'and works about the place meanwhile');
  assert.match(said(world, feller.id), /^Auto: fell trees\. The log pile has enough/);
  // Poor logs are no pile for walls: fifteen of them and nothing sound is not enough (found 2026-09-28).
  household.logs = { wall: 0, sill: 0, poor: wants + WOOD_MARGIN };
  assert.equal(pileFull(world, household), null, 'a pile of poor logs is not enough for the walls');
  stepWorld(world);
  assert.equal(feller.chore?.id, 'fell-trees', 'the axe taken up again the tick the pile wanted more');
  validateWorld(world);
});

test('clearing on auto: the plot given, then the next staked plot nearest the house, until none is left', () => {
  const { world, household } = onTheLand('auto-clear');
  const [clearer, surveyor] = grown(world, household);
  const home = world.map.sites[household.homeSiteId];
  // Two plots staked, as a student stakes them.
  for (const point of grid(holdingOf(world, household).bounds, 9).sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y))) {
    if (plotsOf(world, household).filter(plot => plot.state === 'staked').length >= 2) break;
    try { applyAction(world, 'hh-1', { action: 'survey-plot', entityId: surveyor.id, ...point }); } catch { continue; }
    for (let tick = 0; tick < 100 && surveyor.chore; tick++) stepWorld(world);
  }
  const staked = plotsOf(world, household).filter(plot => plot.state === 'staked');
  assert.equal(staked.length, 2, 'two plots staked');
  const far = staked.sort((a, b) => Math.hypot(b.x - home.x, b.y - home.y) - Math.hypot(a.x - home.x, a.y - home.y))[0];
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: clearer.id, auto: true });
  applyAction(world, 'hh-1', { action: 'clear-plot', entityId: clearer.id, x: far.x, y: far.y });
  assert.equal(clearer.order.chore, 'clear-plot');
  assert.equal(clearer.order.plotId, far.id);
  const order = [];
  for (let tick = 0; tick < 2000 && plotsOf(world, household).some(plot => plot.state === 'staked'); tick++) {
    stepWorld(world);
    for (const plot of plotsOf(world, household)) if (plot.state === 'cleared' && staked.some(one => one.id === plot.id) && !order.includes(plot.id)) order.push(plot.id);
  }
  assert.equal(order.length, 2, 'both plots cleared with one order');
  assert.equal(order[0], far.id, 'the plot given first');
  stepWorld(world);
  assert.match(said(world, clearer.id), /^Auto: clear a staked plot\. There is no staked ground to clear\. Survey ten acres first\. Working about the place meanwhile\.$/);
  validateWorld(world);
});

test('an old save with logs lying out and a hauler on auto opens with the logs on the pile and the hauler felling', () => {
  const { world, household } = onTheLand('fold-old');
  const [hauler] = grown(world, household);
  const place = fellingGround(world, household);
  applyAction(world, 'hh-1', { action: 'fell-trees', entityId: hauler.id, x: place.x, y: place.y });
  for (let tick = 0; tick < 300 && hauler.chore; tick++) stepWorld(world);
  const logs = logsOnPile(household);
  assert.ok(logs > 0);
  // As a class saved before 2026-09-28 had it: the logs lying where they fell, none on the pile, and a hauler remembered on auto.
  for (const entry of Object.values(world.woods.felled)) entry.left = entry.logs;
  household.logs = { wall: 0, sill: 0, poor: 0 };
  hauler.auto = true;
  hauler.order = { chore: 'haul-logs', mode: 'foot' };
  const directory = mkdtempSync(join(tmpdir(), 'fold-'));
  try {
    const path = join(directory, 'class.json');
    writeSave(path, { saveVersion: 3, world });
    const { world: opened } = readSave(path);
    validateWorld(opened);
    assert.equal(logsOnPile(opened.households['hh-1']), logs, 'every log lying out is on the pile');
    assert.equal(logsLeftOut(opened, opened.households['hh-1']), 0, 'and none lies out');
    assert.deepEqual(opened.entities[hauler.id].order, { chore: 'fell-trees', mode: 'foot' }, 'the hauler remembers felling');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
