// Felling the family's own trees and hauling the logs home: docs/WOODS_AND_BUILDING.md §6.1, build step 4.
//
// A student taps timber on the family's own land, is told what stands there, and sends somebody with the axe. The trees
// within a few rods come down one at a time, wall timber first, each a real tree of the woods that becomes a stump with
// its logs lying beside it. Hauling brings them to the house, one on the shoulder or six behind the ox, onto the log pile.
// Only a class that counts its trees one by one fells them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import {
  DRAG_LOGS, FELL_REACH, USE_ORDER, fellFacts, fellRefusal, fellTicks, logsLying, oxFree, standingTrees,
} from '../sim/felling.mjs';
import { treeById } from '../sim/woods.mjs';
import { landAround } from '../sim/ground.mjs';
import { woodsCatalogue, woodsTile } from '../sim/woods-view.mjs';
import { ensureWoods, stumpsVisible, treesVisible } from '../public/woods-view.js';
import { createClassroom } from '../server/app.mjs';

const woods = () => ({ rule: 'landfire', nearCreek: landAround().nearCreek });
const grid = (bounds, side = 11) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class, the families on their land, hh-1's house set and everybody brought over to it. */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const site = grid(holdingOf(world, household).bounds, 7).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, 'hh-1', { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  return { world, household, bounds: holdingOf(world, household).bounds };
}
/** Places on the holding where there is timber to fell, the fewest trees first. */
const timberOn = (world, household, bounds) => grid(bounds).map(point => ({ point, facts: fellFacts(world, household, point) })).filter(entry => entry.facts.can).sort((a, b) => a.facts.trees - b.facts.trees);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('the family is told what stands to fell, and cannot fell off its land, without an axe, or where the trees are not counted', () => {
  const { world, household, bounds } = onTheLand('fell-facts');
  const places = timberOn(world, household, bounds);
  assert.ok(places.length > 0, 'timber somewhere on the holding');
  for (const { point, facts } of places.slice(0, 5)) {
    const trees = standingTrees(world, point);
    assert.equal(facts.trees, trees.length);
    assert.equal(facts.logs, trees.reduce((sum, tree) => sum + tree.logs, 0));
    assert.equal(facts.wall, trees.filter(tree => tree.use === 'wall').reduce((sum, tree) => sum + tree.logs, 0));
    assert.ok(facts.words.includes(`${facts.trees} ${facts.trees === 1 ? 'tree' : 'trees'} in reach, ${facts.logs} logs, ${facts.wall} of them straight enough for walls`), facts.words);
    assert.ok(trees.every(tree => distance(tree, point) <= FELL_REACH && tree.logs > 0));
    const distances = trees.map(tree => distance(tree, point));
    assert.deepEqual(distances, [...distances].sort((a, b) => a - b), 'nearest first');
  }
  assert.equal(fellRefusal(world, household, { x: bounds.maxX + 0.2, y: bounds.minY }), 'That is not your land.');
  const open = grid(bounds).find(point => !standingTrees(world, point).length);
  if (open) assert.ok(['No timber stands there to fell.', 'That is in the water.'].includes(fellRefusal(world, household, open)));
  const noAxe = structuredClone(world);
  delete noAxe.households['hh-1'].tools.axe;
  assert.equal(fellRefusal(noAxe, noAxe.households['hh-1'], places[0].point), 'Felling wants an axe, and there is none in the house.');
  const saved = structuredClone(world);
  delete saved.map.woods;
  assert.equal(fellRefusal(saved, saved.households['hh-1'], places[0].point), 'The trees of this country are not counted one by one.');
  assert.ok(!choresFor(saved, saved.households['hh-1'], saved.entities[household.principalId]).some(chore => chore.id === 'fell-trees'), 'not offered there at all');
  const lobby = createGonzalesWorld('fell-lobby', 5, { map: 'colonies' });
  assert.equal(fellRefusal(lobby, lobby.households['hh-1'], places[0].point), 'The family fells its trees once the class has begun.');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'fell-trees', entityId: household.principalId, x: bounds.maxX + 0.2, y: bounds.minY }), /not your land/);
  assert.equal(world.entities[household.principalId].chore, null);
});

test('the trees come down one at a time, wall timber first, each a stump with its logs lying, until none is left in reach', () => {
  const { world, household, bounds } = onTheLand('fell-down');
  const { point } = timberOn(world, household, bounds).find(entry => entry.facts.trees >= 2 && entry.facts.trees <= 6);
  const before = standingTrees(world, point);
  const axe = world.entities[household.principalId];
  applyAction(world, 'hh-1', { action: 'fell-trees', entityId: axe.id, ...point });
  const order = [];
  for (let tick = 0; tick < 200 && axe.chore; tick++) {
    stepWorld(world);
    validateWorld(world);
    assert.equal(axe.location.siteId, household.homeSiteId, 'felling is on the family land, never a journey');
    for (const id of Object.keys(world.woods?.felled || {})) if (!order.includes(id)) order.push(id);
  }
  assert.equal(axe.chore, null, 'the felling finished');
  assert.deepEqual(new Set(order), new Set(before.map(tree => tree.id)), 'every tree in reach came down, and no other');
  // Wall timber first, then sill, then the rest.
  const uses = order.map(id => USE_ORDER.indexOf(treeById(id, woods()).use));
  assert.deepEqual(uses, [...uses].sort((a, b) => a - b), 'wall timber first');
  for (const id of order) {
    const tree = treeById(id, woods()), entry = world.woods.felled[id];
    assert.deepEqual({ by: entry.by, kind: entry.kind, use: entry.use, logs: entry.logs, left: entry.left }, { by: 'hh-1', kind: tree.kind, use: tree.use, logs: tree.logs, left: tree.logs });
  }
  assert.equal(standingTrees(world, point).length, 0);
  assert.equal(world.woods.revision, order.length);
  // A big tree of a hard kind takes longer than a pole of a soft one.
  assert.ok(fellTicks({ size: 'large', kind: 'live-oak' }) > fellTicks({ size: 'pole', kind: 'cottonwood' }));
  const logs = before.reduce((sum, tree) => sum + tree.logs, 0);
  const said = world.events.filter(event => event.actorId === axe.id && event.text.includes(' felled '));
  assert.equal(said.length, 1, 'said once');
  assert.ok(said[0].text.startsWith(`${axe.name} felled ${order.length} trees `), said[0].text);
  assert.ok(said[0].text.endsWith(`house. ${logs} logs lie where they fell, to be hauled to the house.`), said[0].text);
  assert.deepEqual(projectWorld(world, 'hh-1', 'student', { includeMap: false }).land.logs, { wall: 0, sill: 0, poor: 0, lying: logs });
  assert.equal(logsLying(world, household).length, order.length);
});

test('two people felling one place never fell the same tree, and called in, what came down is still said', () => {
  const { world, household, bounds } = onTheLand('fell-two');
  const { point, facts } = timberOn(world, household, bounds).at(-1);
  assert.ok(facts.trees > 10);
  const people = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && choreAvailability(world, household, person, 'fell-trees').can).slice(0, 2);
  assert.equal(people.length, 2);
  // Side by side, so both would reach for the same nearest tree.
  people[1].location = { ...people[0].location };
  for (const person of people) applyAction(world, 'hh-1', { action: 'fell-trees', entityId: person.id, ...point });
  for (let tick = 0; tick < 12; tick++) {
    stepWorld(world);
    const felling = people.map(person => person.chore?.felling).filter(Boolean);
    assert.equal(new Set(felling).size, felling.length, 'one tree, one axe');
  }
  assert.ok(Object.keys(world.woods.felled).length >= 2);
  const down = people[0].chore.trees;
  assert.ok(down >= 1);
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: people[0].id });
  assert.ok(world.events.some(event => event.actorId === people[0].id && event.text.startsWith(`${people[0].name} felled ${down} ${down === 1 ? 'tree' : 'trees'} `) && event.text.includes('lie where they fell')), 'called in, the trees down are said');
});

test('hauling brings the logs to the house, six behind the ox or one on the shoulder, onto the log pile by use', () => {
  const setup = () => {
    const { world, household, bounds } = onTheLand('fell-haul');
    const { point } = timberOn(world, household, bounds).find(entry => entry.facts.logs >= 8 && entry.facts.trees <= 8);
    const axe = world.entities[household.principalId];
    applyAction(world, 'hh-1', { action: 'fell-trees', entityId: axe.id, ...point });
    for (let tick = 0; tick < 200 && axe.chore; tick++) stepWorld(world);
    return { world, household, axe };
  };
  // Nothing lies out: hauling is not a thing to do.
  const { world: bare, household: bareHousehold } = onTheLand('fell-haul');
  assert.ok(!choresFor(bare, bareHousehold, bare.entities[bareHousehold.principalId]).some(chore => chore.id === 'haul-logs'));
  const trips = {};
  for (const withOx of [true, false]) {
    const { world, household, axe } = setup();
    const lying = logsLying(world, household).reduce((sum, entry) => sum + entry.left, 0);
    const byUse = Object.fromEntries(USE_ORDER.map(use => [use, logsLying(world, household).filter(entry => entry.use === use).reduce((sum, entry) => sum + entry.left, 0)]));
    const ox = world.entities[household.property.find(id => world.entities[id].species === 'ox')];
    if (!withOx) ox.borrowedBy = 'hh-1';
    assert.equal(oxFree(world, household), withOx);
    assert.ok(choresFor(world, household, axe).some(chore => chore.id === 'haul-logs' && chore.can));
    applyAction(world, 'hh-1', { action: 'chore', entityId: axe.id, chore: 'haul-logs' });
    let loads = 0, biggest = 0, carrying = false;
    for (let tick = 0; tick < 400 && axe.chore; tick++) {
      const load = axe.chore.load;
      if (load && !carrying) { loads++; biggest = Math.max(biggest, load.n); }
      carrying = Boolean(load);
      stepWorld(world);
    }
    if (!withOx) ox.borrowedBy = null;
    validateWorld(world);
    assert.equal(axe.chore, null, 'the hauling finished');
    assert.deepEqual(household.logs, byUse, 'every log on the pile, by use');
    assert.equal(logsLying(world, household).length, 0);
    assert.equal(biggest, withOx ? Math.min(DRAG_LOGS.ox, lying) : DRAG_LOGS.hand);
    assert.ok(world.events.some(event => event.text === `${axe.name} hauled ${lying} logs to the house.`));
    trips[withOx] = loads;
  }
  assert.ok(trips.true < trips.false, `with the ox ${trips.true} trips, without ${trips.false}`);
});

test('the map is told what was felled: stumps with their logs in the tile, fetched again when the woods change', async () => {
  const { world, household, bounds } = onTheLand('fell-tiles');
  const { point } = timberOn(world, household, bounds).find(entry => entry.facts.trees >= 2 && entry.facts.trees <= 6);
  // The tile of the nearest tree to come down: a place near a tile's edge fells into its neighbours too.
  const size = woodsCatalogue().tiles.trees, nearest = standingTrees(world, point)[0];
  const tx = Math.floor(nearest.x / size), ty = Math.floor(nearest.y / size);
  const standing = woodsTile(world, 'trees', tx, ty).trees.length;
  const axe = world.entities[household.principalId];
  applyAction(world, 'hh-1', { action: 'fell-trees', entityId: axe.id, ...point });
  for (let tick = 0; tick < 200 && axe.chore; tick++) stepWorld(world);
  const tile = woodsTile(world, 'trees', tx, ty);
  const felled = Object.keys(world.woods.felled).filter(id => { const tree = treeById(id, woods()); return Math.floor(tree.x / size) === tx && Math.floor(tree.y / size) === ty; });
  assert.ok(felled.length > 0);
  assert.equal(tile.stumps.length, felled.length);
  assert.equal(tile.trees.length, standing - felled.length);
  assert.ok(tile.stumps.every(([, , , left]) => left > 0));
  // The page drops only the close-up tiles when the woods change, and draws the stumps it is sent.
  const realFetch = globalThis.fetch;
  const asked = [];
  globalThis.fetch = async path => {
    const url = new URL(path, 'http://page');
    asked.push(`${url.searchParams.get('level')}:${url.searchParams.get('tx')}:${url.searchParams.get('ty')}`);
    const answer = woodsTile(world, url.searchParams.get('level'), Number(url.searchParams.get('tx')), Number(url.searchParams.get('ty')));
    return { ok: Boolean(answer), json: async () => ({ tile: answer }) };
  };
  try {
    const canvas = { width: 800, height: 500 }, scale = 2400;
    const camera = { scale, toWorld: s => ({ x: point.x + (s.x - canvas.width / 2) / scale, y: point.y + (s.y - canvas.height / 2) / scale }), toScreen: p => ({ x: canvas.width / 2 + (p.x - point.x) * scale, y: canvas.height / 2 + (p.y - point.y) * scale }) };
    const settle = () => new Promise(resolve => setTimeout(resolve, 20));
    for (let round = 0; round < 4; round++) { ensureWoods(world, camera, canvas, 'fell-class', woodsCatalogue(), () => {}, world.woods.revision); await settle(); }
    const shown = stumpsVisible(camera, canvas, woodsCatalogue());
    assert.ok(shown.length >= felled.length);
    assert.ok(!treesVisible(camera, canvas, woodsCatalogue()).some(tree => shown.some(stump => stump.x === tree.x && stump.y === tree.y)), 'a stump is not also a tree');
    asked.length = 0;
    ensureWoods(world, camera, canvas, 'fell-class', woodsCatalogue(), () => {}, world.woods.revision); await settle();
    assert.equal(asked.length, 0, 'nothing changed, nothing fetched');
    ensureWoods(world, camera, canvas, 'fell-class', woodsCatalogue(), () => {}, world.woods.revision + 1); await settle();
    assert.ok(asked.length > 0 && asked.every(key => key.startsWith('trees:')), 'the woods changed: the close-up tiles again');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('a world cannot claim a felling that is nowhere, and the server says what felling would give', async () => {
  const { world, household, bounds } = onTheLand('fell-valid');
  const { point } = timberOn(world, household, bounds).at(-1);
  applyAction(world, 'hh-1', { action: 'fell-trees', entityId: household.principalId, ...point });
  for (let tick = 0; tick < 8; tick++) stepWorld(world);
  validateWorld(world);
  assert.ok(world.entities[household.principalId].chore, 'still felling');
  assert.ok(Object.keys(world.woods.felled).length > 0);
  const [id] = Object.keys(world.woods.felled);
  for (const [corrupt, message] of [
    [w => { w.woods.felled['t:nonsense'] = { ...w.woods.felled[id] }; }, /no tree/],
    [w => { w.woods.felled[id].by = 'hh-99'; }, /felled by nobody/],
    [w => { w.woods.felled[id].left = w.woods.felled[id].logs + 1; }, /Invalid felled tree/],
    [w => { w.woods.felled[id].use = 'firewood'; }, /Invalid felled tree/],
    [w => { w.woods.revision = -1; }, /Invalid woods/],
    [w => { w.households['hh-1'].logs = { wall: -1, sill: 0, poor: 0 }; }, /Invalid log pile/],
    [w => { w.entities[household.principalId].chore.ground = { x: 'here' }; }, /Invalid felling place/],
  ]) {
    const copy = structuredClone(world);
    corrupt(copy);
    assert.throws(() => validateWorld(copy), message);
  }
  // A class saved before felling has no woods record and no log pile, and is valid as it is.
  const saved = structuredClone(world);
  delete saved.woods; delete saved.households['hh-1'].logs; saved.entities[household.principalId].chore = null;
  validateWorld(saved);
  assert.equal(projectWorld(saved, 'hh-1', 'student', { includeMap: false }).land.logs, undefined);

  const dir = mkdtempSync(join(tmpdir(), 'texas-fell-'));
  const app = createClassroom({ seed: 'fell-http', savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
  const base = `http://127.0.0.1:${await app.listen()}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Feller', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const householdId = (await joined.json()).world.householdId;
    const home = app.state.world.map.sites[app.state.world.households[householdId].homeSiteId];
    const facts = (await (await fetch(`${base}/api/plot?x=${home.x}&y=${home.y}&job=fell-trees`, { headers: { cookie } })).json()).facts;
    assert.deepEqual(facts, fellFacts(app.state.world, app.state.world.households[householdId], { x: home.x, y: home.y }));
    const state = await (await fetch(`${base}/api/state`, { headers: { cookie } })).json();
    assert.equal(state.woodsRevision, undefined, 'nothing felled, nothing said');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
