// The family's first ten acres, laid where they can be worked (owner, 2026-10-05: "When starting the game, if I put my house
// somewhere, the starting plot that we can plant is frequently straddling a river, or outside of the borders of my property line.
// We should add something to dynamically take care of this."; sim/starting-plot.mjs, docs/LAND_GRANTS.md §5.4, FIC-GONZ-1164).
//
// Measured before the change, 2026-10-05: of 718 sites a family could choose on four classes, the fixed block south-east of the
// house put the first ten acres off the land 405 times, over the house 172 times and in a drawn river or creek 21 times.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { PLOT_SIDE, overlaps, plotWater, plotsOf, squareOf } from '../sim/fields.mjs';
import { FIRST_PLOT, startingPlotWhy } from '../sim/starting-plot.mjs';
import { housesOnLand } from '../sim/house-placement.mjs';
import { treesInBox } from '../sim/land-paths.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { treeById, woodsRule } from '../sim/woods.mjs';
import { landAround } from '../sim/ground.mjs';

const arrived = (seed, players = 5) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
};
/** Every place on the holding the family may set its house, a grid of them. */
const sitesOn = (world, household, side = 5) => {
  const bounds = holdingOf(world, household).bounds, places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(2), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(2) };
    if (siteFactsFor(world, household, point).can) places.push(point);
  }
  return places;
};
const firstOf = (world, household) => plotsOf(world, household).find(plot => plot.id === FIRST_PLOT);
const inside = (point, square) => point.x >= square.minX && point.x <= square.maxX && point.y >= square.minY && point.y <= square.maxY;
/** The trees still standing on a plot (the very trees the map draws and people go round). */
const standingOn = (world, plot) => treesInBox(world, squareOf(plot));

test('wherever the house is set, the first ten acres are laid inside the line, off the yard and the house, out of the water, with no tree standing in them and none on the pile', () => {
  let looked = 0;
  for (const seed of ['first-acres-1', 'first-acres-2']) {
    const world = arrived(seed, 5);
    for (const household of Object.values(world.households)) {
      for (const site of sitesOn(world, household)) {
        const copy = structuredClone(world), mine = copy.households[household.id];
        const facts = siteFactsFor(copy, mine, site);
        const logs = structuredClone(mine.logs || null);
        applyAction(copy, household.id, { action: 'choose-site', ...site });
        const first = firstOf(copy, mine), square = squareOf(first), bounds = holdingOf(copy, mine).bounds;
        assert.equal(startingPlotWhy(copy, mine, first), null, `${seed} ${household.id} at ${JSON.stringify(site)}: the first ten acres at ${JSON.stringify(first)} lie on ground they may not`);
        assert.ok(square.minX >= bounds.minX && square.maxX <= bounds.maxX && square.minY >= bounds.minY && square.maxY <= bounds.maxY, 'inside the line');
        assert.ok(!housesOnLand(copy, mine).some(house => overlaps(house.footprint, square)), 'off the house');
        assert.equal(plotWater(copy, first), null, 'out of the water the map draws');
        assert.ok(Math.hypot(first.x - site.x, first.y - site.y) < 0.5, 'near the house');
        assert.deepEqual(facts.field, { x: first.x, y: first.y }, 'where the family was shown they would go before choosing');
        assert.equal(standingOn(copy, first).length, 0, 'no tree stands in cleared ground');
        for (const entry of Object.values(copy.woods?.felled || {})) assert.deepEqual([entry.field, entry.logs, entry.left], [FIRST_PLOT, 0, 0], 'felled with the ground, no log');
        assert.deepEqual(mine.logs || null, logs, 'nothing onto the pile');
        validateWorld(copy);
        looked++;
      }
    }
  }
  assert.ok(looked >= 40, `only ${looked} sites looked at`);
});

/**
 * A family with its site chosen, and a placement for its first house over its first ten acres that the land allows; with `trees`, first
 * ten acres that had trees standing on them, which came down when they were laid.
 */
function houseOverField(seed, { trees = false } = {}) {
  const world = arrived(seed, 5);
  for (const household of Object.values(world.households)) {
    for (const site of sitesOn(world, household)) {
      const copy = structuredClone(world), mine = copy.households[household.id];
      applyAction(copy, household.id, { action: 'choose-site', ...site });
      const first = firstOf(copy, mine);
      if (trees && !Object.values(copy.woods?.felled || {}).some(entry => entry.field === FIRST_PLOT)) continue;
      for (const [dx, dy] of [[0, 0], [0, 0.03], [0.03, 0], [-0.03, 0], [0, -0.03]]) {
        const placement = { x: +(first.x + dx).toFixed(3), y: +(first.y + dy).toFixed(3), rotation: 0 };
        const trial = structuredClone(copy);
        try { applyAction(trial, household.id, { action: 'plan-house', layout: 'round-log', placement }); } catch { continue; }
        return { world: copy, household: mine, placement, first };
      }
    }
  }
  return null;
}

test('the first house may be set on ten acres nobody has worked: they are laid again round it, their trees standing again where they were; worked ten acres refuse it', () => {
  const found = houseOverField('first-acres-house', { trees: true });
  assert.ok(found, 'no family had ground for a house over its first ten acres, so this test checks nothing');
  const { world, household, placement, first } = found;
  const before = Object.keys(world.woods?.felled || {}).filter(id => world.woods.felled[id].field === FIRST_PLOT);
  applyAction(world, household.id, { action: 'plan-house', layout: 'round-log', placement });
  const moved = firstOf(world, household), [house] = housesOnLand(world, household);
  assert.notDeepEqual({ x: moved.x, y: moved.y }, { x: first.x, y: first.y }, 'laid again');
  assert.ok(!overlaps(house.footprint, squareOf(moved)), 'not under the house');
  assert.equal(startingPlotWhy(world, household, moved), null, 'on ground they may lie on');
  assert.equal(standingOn(world, moved).length, 0, 'no tree standing in them where they lie now');
  // Where they lay, the trees taken with them stand again: they were never anybody's logs.
  assert.ok(before.length > 0, 'no tree came down with the first ten acres where they lay, so this test checks nothing');
  for (const id of before) {
    const tree = treeById(id, { rule: woodsRule(world), nearCreek: landAround().nearCreek });
    assert.equal(Boolean(world.woods.felled[id]), inside(tree, squareOf(moved)), `${id} is down only if it stands in the ten acres where they lie now`);
  }
  validateWorld(world);

  // Sown, they stay where they are, and a house over them is refused as it always was.
  const sown = houseOverField('first-acres-house');
  sown.household.field = { ...sown.household.field, state: 'planted' };
  assert.throws(() => applyAction(sown.world, sown.household.id, { action: 'plan-house', layout: 'round-log', placement: sown.placement }), /That would stand on your field\./);
  const stayed = firstOf(sown.world, sown.household);
  assert.deepEqual({ x: stayed.x, y: stayed.y }, { x: sown.first.x, y: sown.first.y }, 'the sown ten acres where they lay');
});

test('a class saved with its first ten acres off its land opens with them laid again; ten acres worked stay where they are; no tree stands in cleared ground', () => {
  const world = arrived('first-acres-saved', 5);
  const household = world.households['hh-1'];
  applyAction(world, 'hh-1', { action: 'choose-site', ...sitesOn(world, household)[0] });
  // As a class saved before 2026-10-05 had them: the block south-east of the house, wherever that fell, its trees standing.
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === 'hh-1');
  const bounds = holdingOf(world, household).bounds, off = { x: bounds.maxX - PLOT_SIDE * 0.2, y: bounds.maxY - PLOT_SIDE * 0.2 };
  const minX = Math.min(...field.points.map(p => p.x)), minY = Math.min(...field.points.map(p => p.y));
  field.points = field.points.map(p => ({ x: p.x + off.x - PLOT_SIDE / 2 - minX, y: p.y + off.y - PLOT_SIDE / 2 - minY }));
  world.woods = { felled: {}, revision: 0 };
  assert.ok(startingPlotWhy(world, household, firstOf(world, household)), 'the ten acres lie off the land, so this test checks nothing');
  const worked = structuredClone(world);
  worked.households['hh-1'].field = { ...worked.households['hh-1'].field, state: 'planted' };
  const dir = mkdtempSync(join(tmpdir(), 'first-acres-'));
  try {
    writeSave(join(dir, 'open.json'), { saveVersion: 3, world });
    writeSave(join(dir, 'worked.json'), { saveVersion: 3, world: worked });
    const opened = readSave(join(dir, 'open.json')).world, mine = opened.households['hh-1'];
    validateWorld(opened);
    assert.equal(startingPlotWhy(opened, mine, firstOf(opened, mine)), null, 'laid again where they can be worked');
    assert.equal(standingOn(opened, firstOf(opened, mine)).length, 0, 'their trees down');
    const kept = readSave(join(dir, 'worked.json')).world;
    validateWorld(kept);
    const was = firstOf(worked, worked.households['hh-1']), now = firstOf(kept, kept.households['hh-1']);
    assert.deepEqual({ x: now.x, y: now.y }, { x: was.x, y: was.y }, 'sown: where they lay');
    assert.equal(standingOn(kept, firstOf(kept, kept.households['hh-1'])).length, 0, 'and cleared ground has no tree standing');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a person sent out to the field goes to the field, at the edge of the cleared ground nearest the door', () => {
  const world = arrived('first-acres-field', 5);
  const household = world.households['hh-1'];
  applyAction(world, 'hh-1', { action: 'choose-site', ...sitesOn(world, household)[0] });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  household.resources.powder = 10;
  const shooter = world.entities[household.principalId];
  assert.ok(shooter, 'a man at home to practise');
  household.tools = { ...household.tools, rifle: household.tools?.rifle ?? 0 };
  applyAction(world, 'hh-1', { action: 'chore', entityId: shooter.id, chore: 'practise-shooting' });
  stepWorld(world);
  const first = firstOf(world, household), square = squareOf(first);
  // A step in from the edge: the old block's middle is the corner of the first ten acres, on their line.
  assert.ok(inside(shooter.location, { minX: square.minX + 0.005, maxX: square.maxX - 0.005, minY: square.minY + 0.005, maxY: square.maxY - 0.005 }), `set up the mark at the field: ${JSON.stringify(shooter.location)} is not in the ten acres at ${JSON.stringify(first)}`);
});
