// What stands round a family's house, each in a place of its own (owner, 2026-10-13: "a lot of assets get put in the same place and
// overlap. garden and logs for example conflict with roads and the tent"). sim/yard-layout.mjs; docs/LAND_GRANTS.md §10.6.
//
// Across families on the real land and on the invented country, at the camp, with a house at the site, with a dog-run, and with a
// house set off the site: the woodpile, the garden, the tent, the camp and every beast's and wagon's stand are clear of one another,
// of the houses as drawn, of the field, the lane, the water and the line, never across the yard's rails, and on the house's side of a
// creek; everything that reads a place reads the layout's; the family's ways go round them; the beasts stand at their stands, a class
// saved before included; and no plot is staked over them.
//
// Every test here was watched failing against the exact mistake it guards (scripts/yard-layout-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { settle } from './support/settled.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { planHouse } from '../sim/houses.mjs';
import { PIECES } from '../sim/houseplot.mjs';
import { checkHousePlacement, housesOnLand } from '../sim/house-placement.mjs';
import { drawnWater, plotsOf, squareOf } from '../sim/fields.mjs';
import { advanceLandPaths, pathsOf, raiseYard, woodpileAt, yardBox, yardOf } from '../sim/land-paths.mjs';
import { houseSettled } from '../sim/houses.mjs';
import { tentPoint, pitchTent } from '../sim/settling.mjs';
import { gardenPoint } from '../sim/housework.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { plotRefusal } from '../sim/survey.mjs';
import { TREE_MILES } from '../sim/woods.mjs';
import { YARD_GAP, lineNear, settleStands, woodpileFront, yardLayout, yardWalls } from '../sim/yard-layout.mjs';

const meets = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
const crossing = (p, q, r, s) => {
  const d = (q.x - p.x) * (s.y - r.y) - (q.y - p.y) * (s.x - r.x);
  if (!d) return false;
  const t = ((r.x - p.x) * (s.y - r.y) - (r.y - p.y) * (s.x - r.x)) / d, u = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

/** A family home with its site chosen nearest the middle of its land, everybody standing there, no house yet. */
function homestead(seed, { map = 'colonies' } = {}) {
  const world = createGonzalesWorld(seed, 5, map ? { map } : {});
  settleMeans(world); settle(world);
  world.status = 'running';
  const household = world.households['hh-1'];
  if (map) {
    const bounds = holdingOf(world, household).bounds, mid = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    const sites = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) sites.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 9).toFixed(2), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 9).toFixed(2) });
    sites.sort((a, b) => Math.hypot(a.x - mid.x, a.y - mid.y) - Math.hypot(b.x - mid.x, b.y - mid.y));
    // Off the mark, so the family moves its camp over to the site as a student's does.
    applyAction(world, 'hh-1', { action: 'choose-site', ...sites.find(point => Math.hypot(point.x - mid.x, point.y - mid.y) > 0.01 && siteFactsFor(world, household, point).can) });
    settle(world);
  }
  for (const one of Object.values(world.households)) one.lesson = { step: 'done' };
  household.improvements.cabin = 'none';
  return { world, household };
}
/** The house of `plan` finished, at the site or at `placement`. */
function build(world, household, plan = 'round-log', placement = null) {
  household.improvements.cabin = 'none';
  delete household.tent; delete household.house; delete household.completedHouses;
  planHouse(world, household, plan, false, placement);
  if (Array.isArray(household.house.pieces)) for (const piece of household.house.pieces) piece.stage = PIECES[piece.type].stages.length;
  else household.house.work = 1e6;
  household.improvements.cabin = 'sound';
}
/** A placement for a round-log cabin off the family's site, a fifth of a mile or so away, that the server takes. */
function offSite(world, household) {
  const site = world.map.sites[household.homeSiteId];
  for (const [dx, dy] of [[0.2, 0.1], [-0.2, 0.1], [0.2, -0.15], [-0.2, -0.15], [0.1, 0.25], [0.3, 0], [-0.3, 0]]) {
    const placement = { x: +(site.x + dx).toFixed(2), y: +(site.y + dy).toFixed(2), rotation: 0 };
    try { checkHousePlacement(world, household, placement, 'round-log'); return placement; } catch { /* the next */ }
  }
  return null;
}

/** Every rule a layout is held to, on this family's land as it stands now; returns the faults. */
function faults(world, household) {
  const layout = yardLayout(world, household), out = [];
  const bounds = holdingOf(world, household).bounds, site = world.map.sites[household.homeSiteId];
  const boxes = layout.boxes;
  const name = one => one.id || one.what;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (meets(boxes[i].box, boxes[j].box)) out.push(`${name(boxes[i])} over ${name(boxes[j])}`);
  const houses = housesOnLand(world, household);
  const rails = yardOf(household) || (houses.length ? yardBox(world, household) : null);
  const lane = Object.values(world.map.routes).find(route => route.to === household.homeSiteId)?.points || [];
  const courses = drawnWater(world).filter(course => course.points.some(p => Math.abs(p.x - site.x) < 1 && Math.abs(p.y - site.y) < 1));
  for (const one of boxes) {
    const box = one.box;
    for (const house of houses) if (meets(box, house.claim)) out.push(`${name(one)} over the house`);
    for (const plot of plotsOf(world, household)) if (Number.isFinite(plot.x) && meets(box, squareOf(plot))) out.push(`${name(one)} over ${plot.id}`);
    if (box.minX < bounds.minX || box.maxX > bounds.maxX || box.minY < bounds.minY || box.maxY > bounds.maxY) out.push(`${name(one)} off the land`);
    if (lane.length > 1 && lineNear(box, lane, 0.004)) out.push(`${name(one)} on the lane`);
    for (const course of courses) if (lineNear(box, course.points, course.kind === 'river' ? 0.015 : 0.005)) out.push(`${name(one)} in ${course.name || course.kind}`);
    if (rails) {
      const inside = box.minX >= rails.minX && box.maxX <= rails.maxX && box.minY >= rails.minY && box.maxY <= rails.maxY;
      if (!inside && meets(box, rails)) out.push(`${name(one)} across the yard's rails`);
    }
  }
  if (!layout.woodpile || !layout.garden) out.push('no woodpile or no garden');
  if (household.improvements.cabin === 'sound' ? layout.tent || layout.camp : !layout.tent || !layout.camp) out.push('the tent and the camp are not there while, and only while, there is no roof');
  return out;
}

const SEEDS = ['yard-layout-1', 'yard-layout-2', 'yard-layout-4', 'yard-layout-7', 'yard-layout-9', 'land-paths-10'];

test('everything round the house has a place of its own: clear of each other, the houses, the field, the lane, the water, the line and the rails', () => {
  const seen = [];
  let placed = 0;
  for (const seed of SEEDS) {
    const { world, household } = homestead(seed);
    const stages = [['camp', () => {}], ['round-log', () => build(world, household)], ['fenced', () => { household.herd = { cattle: 4, hogs: 3 }; raiseYard(world, household, null); }],
      ['dog-run', () => { delete household.yard; build(world, household, 'dog-run'); }]];
    for (const [stage, make] of stages) {
      make();
      seen.push(...faults(world, household).map(fault => `${seed} ${stage}: ${fault}`));
    }
    const placement = offSite(world, household);
    if (placement) { placed++; delete household.yard; build(world, household, 'round-log', placement); seen.push(...faults(world, household).map(fault => `${seed} placed off the site: ${fault}`)); }
  }
  // And on the invented country, which has no trees counted and its own river.
  const { world, household } = homestead('yard-layout-invented', { map: null });
  seen.push(...faults(world, household).map(fault => `invented camp: ${fault}`));
  build(world, household);
  seen.push(...faults(world, household).map(fault => `invented house: ${fault}`));
  assert.deepEqual(seen, []);
  assert.ok(placed >= 3, `a house was set off its site on only ${placed} families, so that is hardly tested`);
});

test('a thing round the house stays on the house\'s side of a creek', () => {
  // yard-layout-7: a creek runs past the house's front; the nearest clear ground for the tent and the camp lay across it.
  const { world, household } = homestead('yard-layout-7');
  const layout = yardLayout(world, household), site = world.map.sites[household.homeSiteId];
  const courses = drawnWater(world).filter(course => course.points.some(p => Math.abs(p.x - site.x) < 1 && Math.abs(p.y - site.y) < 1));
  assert.ok(courses.some(course => course.points.some(p => Math.hypot(p.x - site.x, p.y - site.y) < 0.15)), 'no creek near this house, so this proves nothing');
  const across = layout.boxes.filter(one => {
    const at = { x: (one.box.minX + one.box.maxX) / 2, y: one.box.maxY };
    return courses.some(course => course.points.some((p, i) => i > 0 && crossing(layout.door, at, course.points[i - 1], p)));
  }).map(one => one.id || one.what);
  assert.deepEqual(across, []);
});

test('the tent, the garden, the woodpile and the camp are read where the layout puts them, by the family, the shelter and the Host', () => {
  const { world, household } = homestead('yard-layout-2');
  pitchTent(world, household);
  household.garden = { x: 0, y: 0, laid: 0, worked: 0 };
  household.logs = { wall: 20, sill: 2, poor: 1 };
  // A tent and a garden recorded where they stood before 2026-10-13 are drawn, and gone to, where the layout puts them.
  const site = world.map.sites[household.homeSiteId];
  household.tent = { x: site.x - 0.0878, y: site.y + 0.0188, minute: 0 };
  household.garden = { x: site.x + 0.045, y: site.y + 0.012, laid: 0, worked: 0 };
  const layout = yardLayout(world, household);
  const land = projectWorld(world, 'hh-1', 'player').land;
  const host = hostOverview(world).lands['hh-1'];
  const at = p => p && { x: p.x, y: p.y };
  assert.deepEqual({ tent: at(tentPoint(world, household)), garden: at(gardenPoint(world, household)), pile: at(woodpileAt(world, household)) },
    { tent: at(layout.tent), garden: at(layout.garden), pile: at(layout.woodpile) });
  assert.deepEqual({ tent: at(land.tent), garden: at(land.garden), pile: at(land.woodpileAt), camp: at(land.campAt) },
    { tent: at(layout.tent), garden: at(layout.garden), pile: at(layout.woodpile), camp: at(layout.camp) });
  assert.deepEqual({ tent: at(host.tent), pile: at(host.woodpileAt), camp: at(host.campAt) }, { tent: at(layout.tent), pile: at(layout.woodpile), camp: at(layout.camp) });
});

test('the family\'s ways go round the woodpile, the garden, the tent and the wagons, and the way to the logs ends before the pile', () => {
  const seen = [];
  for (const seed of ['yard-layout-1', 'yard-layout-4', 'land-paths-10']) {
    const { world, household } = homestead(seed);
    build(world, household);
    household.herd = { cattle: 4, hogs: 3 };
    raiseYard(world, household, null);
    for (let i = 0; i < 12; i++) advanceLandPaths(world, houseSettled);
    const walls = yardWalls(world, household);
    assert.ok(walls.length >= 3, `${seed}: the woodpile, the garden and a wagon`);
    const ways = pathsOf(household).filter(path => path.kind === 'trodden');
    assert.ok(ways.length >= 3, `${seed}: ways trodden (${ways.length})`);
    for (const way of ways) for (const box of walls) {
      const inner = { minX: box.minX + TREE_MILES, minY: box.minY + TREE_MILES, maxX: box.maxX - TREE_MILES, maxY: box.maxY - TREE_MILES };
      if (lineNear(inner, way.points, 1e-6)) seen.push(`${seed}: the way to ${way.to} runs through something in the yard`);
    }
    const pile = ways.find(way => way.to === 'woodpile'), front = woodpileFront(world, household);
    if (pile) assert.ok(Math.hypot(pile.points.at(-1).x - front.x, pile.points.at(-1).y - front.y) < 0.002, `${seed}: the way to the logs ends at ${JSON.stringify(pile.points.at(-1))}, not before the pile ${JSON.stringify(front)}`);
  }
  assert.deepEqual(seen, []);
});

test('the beasts and the wagons stand at their stands: in from a journey, and in a class saved before', () => {
  const { world, household } = homestead('yard-layout-4');
  const site = world.map.sites[household.homeSiteId];
  const beasts = household.property.map(id => world.entities[id]).filter(one => one.kind !== 'person');
  assert.ok(beasts.length >= 3, 'an ox, a horse and a wagon');
  // As a class saved before 2026-10-13 has them: at the old fixed spots by the site, the ox and the horse on the house's ground.
  const old = { wagon: [-.045, .05], horse: [-.06, .01], ox: [-.035, .02] };
  for (const one of beasts) { const [dx, dy] = old[one.kind === 'wagon' ? 'wagon' : one.species === 'horse' ? 'horse' : 'ox']; one.location = { x: site.x + dx, y: site.y + dy, siteId: site.id }; }
  // And one taken off to the timber, which is left where it was taken.
  const timber = { x: site.x + 0.2, y: site.y - 0.2, siteId: site.id };
  const away = beasts.find(one => one.species === 'horse');
  away.location = { ...timber };
  assert.doesNotThrow(() => validateWorld(world), 'the class opens');
  settleStands(world);
  const layout = yardLayout(world, household);
  for (const one of beasts) {
    if (one === away) { assert.deepEqual(one.location, timber, 'the horse left at the timber was moved'); continue; }
    assert.deepEqual({ x: one.location.x, y: one.location.y }, layout.stands[one.id], `${one.id} is not at its stand`);
  }
  // A house planned over a stand: the beast standing there is moved to its new one.
  build(world, household, 'dog-run');
  settleStands(world);
  const after = yardLayout(world, household);
  for (const one of beasts) if (one !== away) assert.deepEqual({ x: one.location.x, y: one.location.y }, after.stands[one.id], `${one.id} is not at its stand once the house is planned`);
  // Coming in with the camp to the site (sim/homesite.mjs `chooseSite`), the place it stood at the mark carried over: in at its stand.
  const ox = beasts.find(one => one.kind === 'animal' && one.species !== 'horse');
  ox.location = { x: site.x + 0.3, y: site.y, siteId: null };
  ox.travel = { from: site.id, to: site.id, points: [{ x: site.x + 0.3, y: site.y }, { x: site.x, y: site.y }], progress: 0.29, distance: 0.3, speed: 2, mode: 'wagon', purpose: 'arrive', silent: true, settle: { x: site.x - 0.035, y: site.y + 0.02 } };
  for (let i = 0; i < 3 && ox.travel; i++) stepWorld(world);
  assert.equal(ox.travel, null, 'the ox did not come home');
  assert.deepEqual({ x: ox.location.x, y: ox.location.y }, yardLayout(world, household).stands[ox.id]);
  // Left by work about the yard on the wagon (the layout unchanged): moved off it to its stand; the wagon, at its own, stays.
  const wagon = beasts.find(one => one.kind === 'wagon');
  ox.location = { x: wagon.location.x + 0.004, y: wagon.location.y, siteId: site.id };
  settleStands(world);
  assert.deepEqual({ x: ox.location.x, y: ox.location.y }, yardLayout(world, household).stands[ox.id], 'the ox was left standing on the wagon');
  assert.deepEqual({ x: wagon.location.x, y: wagon.location.y }, yardLayout(world, household).stands[wagon.id]);
});

test('no plot is staked over the woodpile, the garden or a beast\'s stand', () => {
  const { world, household } = homestead('yard-layout-1');
  build(world, household);
  const layout = yardLayout(world, household);
  // Ten acres laid with each thing at their middle: refused as the house yard (or, where the house's own ground or the field is nearer, for that).
  const why = Object.fromEntries(layout.boxes.map(one => [one.id || one.what, plotRefusal(world, household, { x: (one.box.minX + one.box.maxX) / 2, y: (one.box.minY + one.box.maxY) / 2 })]));
  assert.deepEqual(Object.entries(why).filter(([, words]) => !words), [], JSON.stringify(why));
  // And ten acres beside the woodpile, clear of the house's ground and the field, refused for the woodpile alone.
  const pile = layout.boxes.find(one => one.what === 'woodpile').box, side = Math.sqrt(10 / 640);
  const beside = [-1, 1].flatMap(sx => [-1, 1].map(sy => ({ x: +(sx < 0 ? pile.minX - side / 2 + 0.002 : pile.maxX + side / 2 - 0.002).toFixed(4), y: +(sy < 0 ? pile.minY - side / 2 + 0.002 : pile.maxY + side / 2 - 0.002).toFixed(4) })));
  const words = beside.map(point => plotRefusal(world, household, point));
  assert.ok(words.includes('That would take in the house yard.'), `ten acres just over the woodpile's corner: ${JSON.stringify(words)}`);
});
