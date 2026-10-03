// Going round the trees on the family's own land, the ways it treads to what it places, and the yard it fences (owner, 2026-10-02:
// "it's weird seeing characters walk over trees. paths should be cut to facilitate quick, reasonable movement on a families
// land. there should be an option to fence in a yard too. if there's a fenced in yard then kids on auto play will not be
// disobedient as often."; and 2026-10-03, "All automatic": every path trodden on its own, *Cut a path* gone). sim/land-paths.mjs;
// docs/LAND_GRANTS.md §10, docs/WOODS_AND_BUILDING.md §6.12, docs/CHILDREN.md §14.
//
// Every test here was watched failing against the exact mistake it guards (scripts/land-paths-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, choreAvailability, choresFor, yardFacts, yardFenceBy, yardTrees } from '../sim/chores.mjs';
import { fellAndCarryTicks, fellStanding } from '../sim/felling.mjs';
import { WORK_PACE } from '../sim/work-pace.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { plotsOf } from '../sim/fields.mjs';
import { plotFacts } from '../sim/survey.mjs';
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
  GATE_HALF, PATHS_TRODDEN_WHY, PATH_PACE, YARD_SHARE, doorOf, inYard, landRoute, pathsOf, stockGround, treeCellAt, treesInBox, walkLand, woodpileAt,
  yardBox, yardGate, yardMiddle,
} from '../sim/land-paths.mjs';
import { walkedFrom } from '../public/motion.js';
import { nightGround } from '../public/herd-view.js';
import { ON_MAP, PANEL_SUMMARIES } from '../public/family-panel.js';

const grid = (bounds, side = 11) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** How far a point is from a straight line between two others. */
const toLine = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy, t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0; return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)); };
/** The standing trees whose trunks are within `half` (about thirteen feet) of a straight line: those a straight path along it would fell. */
const treesAlong = (world, a, b, half = 0.0025) => treesInBox(world, { minX: Math.min(a.x, b.x) - half, maxX: Math.max(a.x, b.x) + half, minY: Math.min(a.y, b.y) - half, maxY: Math.max(a.y, b.y) + half }).filter(tree => toLine(tree, a, b) <= half);
/**
 * Where a polyline goes in or out of the fenced yard other than at its gate: every place it crosses the rails, a gate's width and a
 * cell of the woods' grid either side of the gate's middle left out.
 */
const overTheRails = (points, yard, gate) => {
  const inside = p => p.x > yard.minX && p.x < yard.maxX && p.y > yard.minY && p.y < yard.maxY, crossed = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], steps = Math.max(1, Math.ceil(distance(a, b) / 0.0003));
    for (let s = 1; s <= steps; s++) {
      const p = { x: a.x + (b.x - a.x) * (s - 1) / steps, y: a.y + (b.y - a.y) * (s - 1) / steps }, q = { x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps };
      if (inside(p) !== inside(q) && !(Math.abs(q.y - yard.maxY) < 0.006 && Math.abs(q.x - gate.x) < GATE_HALF + 0.004)) crossed.push(q);
    }
  }
  return crossed;
};
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
  return grid(bounds).filter(point => distance(point, site) > 0.12 && dry(point) && !treeCellAt(world, point) && !treesAlong(world, { x: point.x - 0.006, y: point.y }, { x: point.x + 0.006, y: point.y }).length)
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
  // A straight path out to it, its trees felled (as a path cut before 2026-10-03 felled them, and a class saved with one keeps it).
  for (const tree of treesAlong(world, site, target)) (world.woods ||= { felled: {}, revision: 0 }).felled[tree.id] = { by: household.id, minute: 0, kind: tree.kind, use: tree.use, logs: tree.logs, left: 0 };
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

test('once the house stands the family treads a way from the door to its water, each plot, the woodpile and where its stock comes in at night - round the trees, nobody sent, nothing felled; a class saved with none opens with none', () => {
  const { world, household } = onTheLand();
  household.herd = { cattle: 4, hogs: 3 };
  assert.deepEqual(pathsOf(household), [], 'none before the house');
  const saved = JSON.parse(JSON.stringify(world));
  delete saved.households[household.id].paths;
  validateWorld(saved);
  settle(household);
  const felledBefore = Object.keys(world.woods?.felled || {}).length;
  for (let tick = 0; tick < 4; tick++) stepWorld(world);
  const trodden = pathsOf(household).filter(path => path.kind === 'trodden');
  const plots = plotsOf(world, household).filter(plot => plot.state === 'cleared');
  assert.ok(plots.length >= 1, 'a cleared plot to tread a way to');
  const door = doorOf(world, household);
  const wayTo = to => trodden.find(path => path.to === to);
  for (const plot of plots) assert.ok(wayTo(plot.id), `a way to ${plot.id}`);
  if (household.site?.needsWell === false) assert.ok(wayTo('water'), 'a way to the water');
  // The woodpile, where the page draws it, and each kind of stock where it is brought in at night (owner, 2026-10-03, "All automatic").
  assert.deepEqual(wayTo('woodpile')?.points.at(-1), woodpileAt(world, household), 'a way to the woodpile');
  for (const kind of ['cattle', 'hogs']) {
    const ground = stockGround(world, household, kind);
    assert.deepEqual(wayTo(`stock-${kind}`)?.points.at(-1), ground, `a way to where the ${kind} come in at night`);
    // The very place the page draws that kind standing at night.
    const site = world.map.sites[household.homeSiteId], drawn = nightGround(kind, site, site.id);
    assert.ok(distance(drawn, ground) < 1e-4, `${kind}: the server's ${JSON.stringify(ground)} is the page's ${JSON.stringify(drawn)}`);
  }
  for (const path of trodden) {
    assert.ok(distance(path.points[0], door) < 1e-4, `${path.to}: from the door`);
    assert.equal(treesOver(world, path.points), 0, `${path.to}: laid round the trees`);
  }
  // Nobody was sent to make them and nothing was felled for them.
  assert.equal(Object.keys(world.woods?.felled || {}).length, felledBefore, 'no tree felled');
  assert.ok(household.members.every(id => !/path/.test(world.entities[id].chore?.id || '')), 'nobody sent');
  // Laid once.
  stepWorld(world);
  assert.deepEqual(pathsOf(household).filter(path => path.kind === 'trodden'), trodden);
  const shown = projectWorld(world, household.id, 'student').land.paths;
  assert.ok(['woodpile', 'stock-cattle', 'stock-hogs'].every(to => shown.some(path => path.to === to)), 'on the family\'s land line, each saying where it goes');
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('a new plot gets its way when it is cleared; a fenced yard gets a way to its gate and the ways out go through it; with the rails down, or the stock gone, the ways follow', () => {
  const { world, household } = onTheLand();
  household.herd = { cattle: 4, hogs: 3 };
  settle(household);
  for (let tick = 0; tick < 4; tick++) stepWorld(world);
  const trodden = () => pathsOf(household).filter(path => path.kind === 'trodden');
  const wayTo = to => trodden().find(path => path.to === to);
  // A plot cleared later: its way appears on its own.
  // Out of the thick timber, where a way may have to squeeze between trunks (`TREE_COST` is not a wall) and would prove nothing here.
  const at = grid(holdingOf(world, household).bounds).find(point => plotFacts(world, household, point).can && plotFacts(world, household, point).ground !== 'timber');
  const fresh = { id: 'plot-99', x: at.x, y: at.y, ground: plotFacts(world, household, at).ground, state: 'cleared' };
  household.plots = [...plotsOf(world, household), fresh];
  fellStanding(world, household, fresh);
  stepWorld(world);
  assert.ok(wayTo(fresh.id), 'a way to the plot cleared since');
  // The yard fenced (its trees felled, as fencing it fells them): a way to its gate, and every way to a place outside the rails laid
  // again out through the gate - the rails are not climbed.
  const box = yardBox(world, household);
  for (const tree of treesInBox(world, box)) (world.woods ||= { felled: {}, revision: 0 }).felled[tree.id] = { by: household.id, minute: 0, kind: tree.kind, use: tree.use, logs: tree.logs, left: 0 };
  household.yard = { ...box, fence: 'sound' };
  for (let tick = 0; tick < 6; tick++) stepWorld(world);
  const gate = yardGate(world, household), yard = household.yard;
  assert.ok(gate && Math.abs(gate.y - yard.maxY) < 1e-4 && gate.x > yard.minX && gate.x < yard.maxX, `the gate in the front rail: ${JSON.stringify(gate)}`);
  assert.deepEqual(wayTo('yard-gate')?.points.at(-1), gate, 'a way to the gate');
  const outside = trodden().filter(path => path.to !== 'yard-gate' && !inYard(household, path.points.at(-1)));
  assert.ok(outside.length >= 2, 'ways out of the yard');
  for (const path of outside) {
    assert.equal(path.gate, true, `${path.to}: marked as going out through the gate`);
    assert.deepEqual(overTheRails(path.points, yard, gate), [], `${path.to}: out through the gate, never over the rails`);
    assert.equal(treesOver(world, path.points), 0, `${path.to}: round the trees`);
  }
  const shown = projectWorld(world, household.id, 'student').land.yard;
  assert.deepEqual({ x: shown.gate.x, y: shown.gate.y }, gate, 'the page is told where the gate is');
  // The hogs all sold: the way to where they came in goes. The yard's rails pulled down: no gate, and the ways go from the door again.
  household.herd = { cattle: 4, hogs: 0 };
  ruin(world, household, ['fence']);
  for (let tick = 0; tick < 6; tick++) stepWorld(world);
  assert.equal(wayTo('stock-hogs'), undefined, 'no way to stock the family no longer has');
  assert.ok(wayTo('stock-cattle'), 'the cattle\'s way stays');
  assert.equal(wayTo('yard-gate'), undefined, 'no gate with the rails down');
  assert.ok(trodden().every(path => path.gate === undefined), 'every way from the door again');
  validateWorld(JSON.parse(JSON.stringify(world)));
});

test('Cut a path is gone: not on anybody\'s row, its order and its place on the map refused in words, nowhere in the lesson or the panel', async () => {
  const { world, household } = onTheLand();
  settle(household);
  const cutter = world.entities[household.principalId];
  assert.equal(CHORES['cut-path'], undefined, 'no such work');
  assert.ok(!choresFor(world, household, cutter).some(entry => entry.id === 'cut-path'), 'not on the row');
  assert.ok(!Object.hasOwn(PANEL_SUMMARIES, 'cut-path') && !ON_MAP.includes('cut-path'), 'not on the bar, not chosen on the map');
  assert.ok(!FARM_WORK.includes('cut-path') && FARM_WORK.includes('chore:fence-yard'), 'the lesson holds back only the yard');
  // A page loaded before, or a command saved before, sending it: a clear refusal, nothing staked, nobody sent.
  const before = JSON.stringify(household.paths || []);
  for (const order of [{ action: 'cut-path', entityId: cutter.id, x: plotsOf(world, household)[0].x, y: plotsOf(world, household)[0].y }, { action: 'chore', entityId: cutter.id, chore: 'cut-path' }]) {
    assert.throws(() => applyAction(world, household.id, order), error => error.message === PATHS_TRODDEN_WHY, JSON.stringify(order));
  }
  assert.equal(JSON.stringify(household.paths || []), before, 'nothing staked');
  assert.equal(cutter.chore, null, 'nobody sent');
  assert.match(PATHS_TRODDEN_WHY, /treads its own ways/);
  // And through the server, as a page loaded before would send it: the place chooser told so, the order refused in the same words.
  const dir = mkdtempSync(join(tmpdir(), 'texas-paths-'));
  const app = createClassroom({ seed: 'paths-http', savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
  const base = `http://127.0.0.1:${await app.listen()}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Cutter', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const householdId = (await joined.json()).world.householdId, family = app.state.world.households[householdId];
    const home = app.state.world.map.sites[family.homeSiteId];
    const facts = (await (await fetch(`${base}/api/plot?x=${home.x + 0.1}&y=${home.y}&job=cut-path`, { headers: { cookie } })).json()).facts;
    assert.deepEqual(facts, { can: false, why: PATHS_TRODDEN_WHY });
    const sent = await fetch(`${base}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ id: 'stale-cut-path-1', action: 'cut-path', entityId: family.principalId, x: home.x + 0.1, y: home.y }) });
    assert.notEqual(sent.status, 200);
    assert.equal((await sent.json()).error, PATHS_TRODDEN_WHY);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a class saved with somebody part way through cutting a path opens: they leave off, said so; what was cut stays a path, its stakes come up, nothing is felled', () => {
  const { world, household } = onTheLand();
  settle(household);
  const cutter = world.entities[household.principalId];
  const door = doorOf(world, household), far = { x: door.x + 0.2, y: door.y };
  // As a class saved on 2026-10-03 holds it: a cut path, a path a third cut, and the cutter at it, part through felling a tree.
  household.paths = [
    { id: 'path-1', kind: 'cut', points: [{ ...door }, { x: door.x, y: door.y + 0.1 }] },
    { id: 'path-2', kind: 'cut', points: [{ ...door }, far], cut: 0.07 },
  ];
  const tree = treesInBox(world, holdingOf(world, household).bounds)[0];
  cutter.chore = { id: 'cut-path', step: 1, wait: 2, doing: 'felling a post oak in the way of the path', pathId: 'path-2', felling: tree.id };
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  stepWorld(saved);
  const person = saved.entities[cutter.id], paths = saved.households[household.id].paths;
  assert.equal(person.chore, null, 'left off');
  assert.ok(saved.events.some(event => event.actorId === cutter.id && /left off cutting the path unfinished/.test(event.text)), 'and said so');
  assert.deepEqual(paths.find(path => path.id === 'path-1'), household.paths[0], 'a path cut before stays as it was');
  const part = paths.find(path => path.id === 'path-2');
  assert.equal(part.cut, undefined, 'its stakes come up');
  assert.ok(Math.abs(distance(part.points[0], part.points.at(-1)) - 0.07) < 1e-3, `what was cut stays: ${JSON.stringify(part.points)}`);
  assert.equal(saved.woods?.felled?.[tree.id], undefined, 'the tree being felled still stands');
  assert.ok(paths.some(path => path.kind === 'trodden'), 'and the ways are trodden as for any family');
  validateWorld(JSON.parse(JSON.stringify(saved)));
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
  assert.deepEqual(household.yard, { ...box, fence: 'sound', gate: household.yard.gate });
  assert.ok(household.yard.gate > box.minX && household.yard.gate < box.maxX, 'its gate hung in the front rail');
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
  const { gate: shownGate, ...shownYard } = projectWorld(world, household.id, 'student').land.yard;
  assert.deepEqual(shownYard, { ...box, fence: 'sound' });
  assert.ok(Number.isFinite(shownGate?.x), 'and the gate in its rails');
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
