// Going round the trees on the family's own land, the paths it treads and cuts, and the yard it fences (owner, 2026-10-02:
// "it's weird seeing characters walk over trees. paths should be cut to facilitate quick, reasonable movement on a families
// land. there should be an option to fence in a yard too. if there's a fenced in yard then kids on auto play will not be
// disobedient as often."). sim/land-paths.mjs; docs/LAND_GRANTS.md §10, docs/WOODS_AND_BUILDING.md §6.12, docs/CHILDREN.md §14.
//
// Every test here was watched failing against the exact mistake it guards (scripts/land-paths-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor, cutPathFacts, yardFacts, yardFenceBy, yardTrees } from '../sim/chores.mjs';
import { fellAndCarryTicks } from '../sim/felling.mjs';
import { WORK_PACE } from '../sim/work-pace.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { landAround } from '../sim/ground.mjs';
import { fenceBy } from '../sim/woodpile.mjs';
import { FENCE_LOGS } from '../sim/woodpile.mjs';
import { ruin } from '../sim/improvements.mjs';
import { FARM_WORK } from '../sim/lesson.mjs';
import { OBEDIENCE_RATES, YARD_KEEPS, autoOffChance, keptByYard, tiresOfAuto, wanderChance, wandersOff } from '../sim/obedience.mjs';
import { PLAY_REACH } from '../sim/children.mjs';
import { setChildAuto } from '../sim/childhood.mjs';
import { beginChore } from '../sim/chores.mjs';
import {
  PATH_PACE, YARD_SHARE, doorOf, landRoute, pathsOf, treeCellAt, treesInBox, treesInTheWay, walkLand, yardBox, yardMiddle,
} from '../sim/land-paths.mjs';
import { walkedFrom } from '../public/motion.js';

const grid = (bounds, side = 11) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/**
 * The standing trees a polyline runs over: every tree whose cell of the woods' grid (about 21 feet a side, the very trees the map
 * draws) it passes through, its two ends left out - where somebody stands to fell a tree, or sets out from beside one.
 */
const treesOver = (world, points) => {
  const ids = new Set();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], steps = Math.max(1, Math.ceil(distance(a, b) / 0.0005));
    for (let s = 0; s <= steps; s++) {
      const at = { x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps };
      if (distance(at, points[0]) < 0.006 || distance(at, points.at(-1)) < 0.006) continue;
      const id = treeCellAt(world, at);
      if (id) ids.add(id);
    }
  }
  return ids.size;
};

/** A class on the real land, this family's house site chosen in the woods and everybody home, its house standing and taught. */
function onTheLand(seed = 'smoke-paths', id = 'hh-2') {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households[id];
  const site = grid(holdingOf(world, household).bounds, 7).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, id, { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(member => world.entities[member].travel); tick++) stepWorld(world);
  for (const one of Object.values(world.households)) one.lesson = { step: 'done' };
  return { world, household, site, bounds: holdingOf(world, household).bounds };
}
/** A place on the land with no tree near it, whose straight line from the house runs over standing trees. */
function acrossTheWoods(world, household, site, bounds) {
  // Dry: no river or creek between, so the way and a path along the line differ by the trees alone.
  const dry = point => { const crossing = landAround().crossings(site, point); return !crossing.barrier && !crossing.rivers && !crossing.creeks; };
  return grid(bounds).filter(point => distance(point, site) > 0.12 && dry(point) && !treeCellAt(world, point) && !treesInTheWay(world, { x: point.x - 0.006, y: point.y }, { x: point.x + 0.006, y: point.y }).length)
    .map(point => ({ point, over: treesOver(world, [site, point]) })).filter(entry => entry.over >= 3).sort((a, b) => b.over - a.over)[0]?.point;
}
const settle = household => { household.improvements = { ...household.improvements, cabin: 'sound' }; };

test('a way across the family\'s land goes round the standing trees, and the person walks it, drawn along the points walked', () => {
  const { world, household, site, bounds } = onTheLand();
  const target = acrossTheWoods(world, household, site, bounds);
  assert.ok(target, 'a place across the woods from the house');
  const straight = treesOver(world, [site, target]);
  const route = landRoute(world, household, site, target);
  assert.ok(straight >= 3, `the straight line runs over ${straight} trees`);
  assert.equal(treesOver(world, route), 0, `the way found runs over no tree (the straight line ran over ${straight})`);
  assert.ok(route.length > 2, 'it bends');
  // Walked a little at a time: every stretch walked is on the way found, and no tick's walk runs over a tree.
  const walker = world.entities[household.principalId];
  walker.location = { x: site.x, y: site.y, siteId: household.homeSiteId };
  let steps = 0;
  const walked = [];
  while (!walkLand(world, household, walker, target, 0.05) && steps < 200) { steps++; walked.push(...walker.walked.points); world.tick++; }
  walked.push(...walker.walked.points);
  assert.deepEqual({ x: walker.location.x, y: walker.location.y }, target, 'arrived');
  assert.equal(treesOver(world, walked), 0, 'no tick walked over a tree');
  assert.equal(walker.walkRoute, undefined, 'the way is let go on arrival');
  // The page draws them along exactly those points: begun where they were, ended where they are.
  const previous = { location: { ...walker.walked.points[0], siteId: household.homeSiteId } };
  const drawn = walkedFrom(previous, { location: walker.location, walked: walker.walked.points });
  assert.ok(drawn && drawn.points === walker.walked.points, 'the page walks them along the server\'s points');
  // And the projection carries them, for this tick only.
  const view = projectWorld(world, household.id, 'student');
  assert.deepEqual(view.entities.find(one => one.id === walker.id).walked, walker.walked.points);
  world.tick++;
  assert.equal(projectWorld(world, household.id, 'student').entities.find(one => one.id === walker.id).walked, undefined, 'not on the next tick');
});

test('walking a path is quicker than the country it crosses, and the way found keeps to it', () => {
  const { world, household, site, bounds } = onTheLand();
  const target = acrossTheWoods(world, household, site, bounds);
  const walker = world.entities[household.principalId];
  const timeTo = () => {
    walker.location = { x: site.x, y: site.y, siteId: household.homeSiteId };
    delete walker.walkRoute;
    let spent = 0;
    while (!walkLand(world, household, walker, target, 0.01) && spent < 1000) spent++;
    return spent;
  };
  const without = timeTo();
  // A path cut straight out to it: its trees felled, as cutting one fells them.
  for (const tree of treesInTheWay(world, site, target)) (world.woods ||= { felled: {}, revision: 0 }).felled[tree.id] = { by: household.id, minute: 0, kind: tree.kind, use: tree.use, logs: tree.logs, left: 0 };
  // The same line with its trees down and no path made of it: what the path itself saves is the rest.
  const felledOnly = timeTo();
  household.paths = [{ id: 'path-1', kind: 'cut', points: [{ ...site }, { ...target }] }];
  const along = landRoute(world, household, site, target);
  const offPath = point => { const t = Math.max(0, Math.min(1, ((point.x - site.x) * (target.x - site.x) + (point.y - site.y) * (target.y - site.y)) / distance(site, target) ** 2)); return distance(point, { x: site.x + (target.x - site.x) * t, y: site.y + (target.y - site.y) * t }); };
  assert.ok(along.every(point => offPath(point) < 0.006), `the way keeps to the path: ${JSON.stringify(along)}`);
  const withPath = timeTo();
  assert.ok(withPath < without, `quicker on the path: ${withPath} hundredths of a tick against ${without}`);
  assert.ok(withPath < felledOnly && PATH_PACE < 1, `quicker on the path than over the same line cleared of its trees: ${withPath} against ${felledOnly}`);
  // Exactly the path's pace over its length, to the piece.
  const miles = distance(site, target);
  assert.ok(Math.abs(withPath - Math.ceil(miles * PATH_PACE / 0.01)) <= 1, `${withPath} for ${miles} miles at ${PATH_PACE}`);
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('once the house stands the family treads a way to its water and its plots; a class saved with none opens with none and validates', () => {
  const { world, household } = onTheLand();
  assert.deepEqual(pathsOf(household), [], 'none before the house');
  const saved = JSON.parse(JSON.stringify(world));
  delete saved.households[household.id].paths;
  validateWorld(saved);
  settle(household);
  stepWorld(world);
  const trodden = pathsOf(household).filter(path => path.kind === 'trodden');
  const plots = household.plots?.filter(plot => plot.state === 'cleared') || [];
  assert.ok(trodden.length >= 1, 'trodden paths');
  for (const plot of plots) assert.ok(trodden.some(path => path.to === plot.id), `a way to ${plot.id}`);
  if (household.site?.needsWell === false) assert.ok(trodden.some(path => path.to === 'water'), 'a way to the water');
  for (const path of trodden) assert.equal(treesOver(world, path.points), 0, `${path.to}: laid round the trees`);
  // Laid once.
  stepWorld(world);
  assert.equal(pathsOf(household).filter(path => path.kind === 'trodden').length, trodden.length);
  assert.ok(projectWorld(world, household.id, 'student').land.paths.length >= trodden.length, 'on the family\'s land line');
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('Cut a path: the trees in its way come down onto the pile, it wants an axe, it is held back in the lesson, and it is walked', () => {
  const { world, household, site, bounds } = onTheLand();
  settle(household);
  const cutter = world.entities[household.principalId];
  const candidates = grid(bounds).map(point => ({ point, facts: cutPathFacts(world, household, point) })).filter(entry => entry.facts.can && entry.facts.trees >= 2);
  const { point, facts } = candidates.sort((a, b) => a.facts.trees - b.facts.trees)[0];
  assert.match(facts.words, /trees? stands? in its way/);
  assert.match(facts.words, /About .* of work\./);
  assert.ok(Number.isFinite(facts.from?.x) && Number.isFinite(facts.to?.x), 'the line to draw');
  // No axe: refused before anybody goes, with the axe the family lacks.
  const noAxe = structuredClone(world);
  delete noAxe.households[household.id].tools.axe;
  const dry = cutPathFacts(noAxe, noAxe.households[household.id], point);
  assert.equal(dry.can, false);
  assert.match(dry.why, /wants an axe/);
  assert.deepEqual(dry.lack, { axe: [0, 1] });
  assert.throws(() => applyAction(noAxe, household.id, { action: 'cut-path', entityId: cutter.id, x: point.x, y: point.y }), /wants an axe/);
  // Held back while the family is being walked through its first farm work (sim/lesson.mjs).
  assert.ok(FARM_WORK.includes('cut-path') && FARM_WORK.includes('chore:fence-yard'));
  // Too near, and off the land.
  const door = doorOf(world, household);
  assert.match(cutPathFacts(world, household, { x: door.x + 0.01, y: door.y + 0.005 }).why, /near enough/);
  assert.equal(cutPathFacts(world, household, { x: bounds.maxX + 0.1, y: bounds.minY }).why, 'That is not your land.');
  const before = Object.values(household.logs || {}).reduce((sum, n) => sum + n, 0);
  const inTheWay = treesInTheWay(world, facts.from, facts.to);
  applyAction(world, household.id, { action: 'cut-path', entityId: cutter.id, x: point.x, y: point.y });
  const path = pathsOf(household).find(one => one.kind === 'cut');
  assert.ok(path, 'staked out at once');
  let ticks = 0;
  for (; ticks < 300 && cutter.chore?.id === 'cut-path'; ticks++) stepWorld(world);
  assert.ok(!cutter.chore, `finished in ${ticks} ticks`);
  assert.equal(path.cut, undefined, 'cut all the way');
  for (const tree of inTheWay) assert.ok(world.woods.felled[tree.id], `${tree.id} felled`);
  const after = Object.values(household.logs || {}).reduce((sum, n) => sum + n, 0);
  assert.equal(after - before, inTheWay.reduce((sum, tree) => sum + tree.logs, 0), 'their logs onto the pile');
  assert.ok(world.events.some(event => /cut a path/.test(event.text) && /onto the pile/.test(event.text)), 'said once');
  assert.equal(treesOver(world, path.points), 0, 'nothing left standing in it');
  assert.equal(cutPathFacts(world, household, point).why, 'There is a path there already.');
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('Fence a yard: half a plot\'s rails and the trees inside felled at felling\'s time, refused before the house and without an axe, drawn on the land, pulled down in the Scrape', () => {
  const { world, household } = onTheLand();
  const worker = world.entities[household.principalId];
  assert.match(choreAvailability(world, household, worker, 'fence-yard').why, /Raise the house/);
  settle(household);
  // The cost and the time: a plot's fence at the yard's middle, at half its work and half its logs off the pile.
  const plotFence = fenceBy(world, household, yardMiddle(yardBox(world, household)));
  const yardFence = yardFenceBy(world, household);
  assert.equal(YARD_SHARE, 0.5);
  assert.equal(yardFence.ticks, Math.max(2, Math.round(plotFence.ticks * YARD_SHARE)));
  assert.equal(yardFence.how, plotFence.how);
  if (plotFence.logs) assert.equal(yardFence.logs, Math.ceil(FENCE_LOGS * YARD_SHARE));
  assert.match(yardFacts(world, household).words, /A yard round the house\. .*about/);
  // Without an axe: refused, and shown greyed with the axe it wants.
  const noAxe = structuredClone(world);
  delete noAxe.households[household.id].tools.axe;
  const greyed = choresFor(noAxe, noAxe.households[household.id], noAxe.entities[worker.id]).find(entry => entry.id === 'fence-yard');
  assert.equal(greyed?.can, false);
  assert.deepEqual(greyed.lack, { axe: [0, 1] });
  // The trees standing inside it (owner, 2026-10-03, "Auto kids; fell trees"): said on the bar and in the yard's words before anybody
  // goes - how many, the hours more, the logs - and felled at felling's own time, their logs onto the pile, before the rails go up.
  const box = yardBox(world, household);
  const inside = treesInBox(world, box), extra = yardTrees(world, household);
  assert.ok(inside.length >= 3, `trees inside the yard: ${inside.length}`);
  const line = choresFor(world, household, worker).find(entry => entry.id === 'fence-yard')?.estimate;
  assert.match(line, new RegExp(`^${inside.length} trees inside: about .+ more, ${extra.logs} logs for the pile\\.$`));
  assert.ok(yardFacts(world, household).words.endsWith(line), 'and in the yard\'s own words');
  const logs = () => Object.values(household.logs || {}).reduce((sum, n) => sum + n, 0), before = logs();
  applyAction(world, household.id, { action: 'chore', entityId: worker.id, chore: 'fence-yard' });
  let ticks = 0, railsBegun = null;
  for (; ticks < 400 && worker.chore?.id === 'fence-yard'; ticks++) {
    stepWorld(world);
    if (railsBegun === null && /splitting rails|carrying rails|mesquite/.test(worker.chore?.doing || '')) railsBegun = ticks;
  }
  assert.deepEqual(household.yard, { ...box, fence: 'sound' });
  for (const tree of inside) assert.ok(world.woods.felled[tree.id], `${tree.id} felled`);
  assert.deepEqual(treesInBox(world, box), [], 'nothing left standing inside the rails');
  assert.equal(logs() - before, extra.logs, 'their logs onto the pile');
  // Paid for: the felling took felling's time - at the quickest hand's pace and the family's, not less - before the rails were split.
  const felling = extra.ticks * 0.7 * WORK_PACE;
  assert.ok(railsBegun !== null && railsBegun >= Math.floor(felling), `the rails were begun after ${railsBegun} ticks of felling, where felling ${inside.length} trees takes ${felling}`);
  assert.equal(extra.ticks, inside.reduce((sum, tree) => sum + fellAndCarryTicks(tree), 0));
  assert.ok(world.events.some(event => /fenced a yard round the house\. \d+ trees inside it came down/.test(event.text)), 'said with the trees');
  assert.match(choreAvailability(world, household, worker, 'fence-yard').why, /The yard is fenced/);
  // No plot inside it, and the house within it.
  const home = world.map.sites[household.homeSiteId];
  assert.ok(home.x > box.minX && home.x < box.maxX && home.y > box.minY && home.y < box.maxY);
  assert.deepEqual(projectWorld(world, household.id, 'student').land.yard, household.yard);
  // The Scrape's burning pulls its rails down too.
  ruin(world, household, ['fence']);
  assert.equal(household.yard.fence, 'ruined');
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('a child on auto at home with a fenced yard is disobedient half as often, and only then', () => {
  const { world, household } = onTheLand();
  settle(household);
  // A small child of the family, at the hardest roll of the die.
  const grown = world.entities[household.principalId];
  const child = { ...structuredClone(grown), id: `${household.id}-test-child`, name: 'Tom Test', age: 5, kin: { role: 'son', parents: [grown.id] }, traits: { ...(grown.traits || {}), obedience: 1 }, chore: null, auto: true, childAuto: { day: 0, since: 0, picks: 0 } };
  delete child.principal;
  world.entities[child.id] = child;
  const rate = test => { let n = 0; for (let tick = 0; tick < 4000; tick++) { world.tick = tick; if (test()) n++; } return n / 4000; };
  const offWithout = rate(() => tiresOfAuto(world, child)), wanderWithout = rate(() => wandersOff(world, child));
  household.yard = { ...yardBox(world, household), fence: 'sound' };
  assert.equal(keptByYard(household, child), true);
  const offWith = rate(() => tiresOfAuto(world, child)), wanderWith = rate(() => wandersOff(world, child));
  assert.equal(YARD_KEEPS, 0.5);
  // Measured against the die's own rates: 5 in 100 a tick at a roll of 1, and 2.5 in 100 with the yard.
  assert.ok(Math.abs(offWithout - autoOffChance(1)) < 0.012, `${offWithout} against ${autoOffChance(1)}`);
  assert.ok(Math.abs(offWith - autoOffChance(1) * YARD_KEEPS) < 0.01, `${offWith} against ${autoOffChance(1) * YARD_KEEPS}`);
  assert.ok(Math.abs(wanderWith - wanderChance(1) * YARD_KEEPS) < 0.012, `${wanderWith} against ${wanderChance(1) * YARD_KEEPS}`);
  assert.ok(offWith < offWithout * 0.7 && wanderWith < wanderWithout * 0.7, 'fewer with the yard');
  assert.deepEqual(OBEDIENCE_RATES.autoOff, [0.05, 0.002], 'the die itself is as it was');
  // Not a child told what to do, and not with the rails down.
  child.auto = undefined;
  assert.equal(keptByYard(household, child), false);
  child.auto = true;
  household.yard.fence = 'ruined';
  assert.equal(keptByYard(household, child), false);
});

test('the little ones at play keep inside the fenced yard', () => {
  const { world, household } = onTheLand();
  settle(household);
  household.yard = { ...yardBox(world, household), fence: 'sound' };
  const grown = world.entities[household.principalId];
  const child = { ...structuredClone(grown), id: `${household.id}-test-child`, name: 'Ann Test', age: 6, kin: { role: 'daughter', parents: [grown.id] }, chore: null };
  delete child.principal; delete child.auto;
  world.entities[child.id] = child;
  household.members = [...household.members, child.id];
  // Begun at the far side of the house's ground, outside the rails.
  child.location = { x: household.yard.maxX + 0.05, y: household.yard.maxY + 0.05, siteId: household.homeSiteId };
  const yard = household.yard, inside = point => point.x >= yard.minX && point.x <= yard.maxX && point.y >= yard.minY && point.y <= yard.maxY;
  for (const kind of ['child-tag', 'child-stick-horse', 'child-hoop', 'child-hide']) {
    child.chore = null; child.task = 'rest';
    beginChore(world, household, child, kind, { beginTravel: () => {}, modeAvailability: () => ({ can: true }) });
    for (let tick = 0; tick < 12; tick++) {
      stepWorld(world);
      if (!child.chore) break;
      assert.ok(inside(child.location), `${kind}: ${JSON.stringify(child.location)} inside ${JSON.stringify(yard)}`);
    }
  }
  assert.ok(PLAY_REACH < (yard.maxX - yard.minX), 'room to play');
  setChildAuto(world, household, child, false);
});
