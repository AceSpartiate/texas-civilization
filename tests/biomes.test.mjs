// The country of 1836 on the real land: docs/BIOMES.md §7, built 2026-09-19.
//
// Owner, 2026-09-19: "woods should only exist where woods make sense. some families are going to have a harder time hunting
// because there's no woods. thats okay"; and, by multiple choice, the thick woods round the Alamo cleared to fields. Held here:
// LANDFIRE's settings and EPA's ecoregions read as the biomes where the research puts them, the ten settings the week before
// mis-filed filed right, Béxar in its fields, the Hill Country a savanna and not a wood; a creek keeps its timber only where it
// runs all year; the outside layer is filed by the same rules, so the seam matches; a class made in the week of 2026-09-15 opens
// on its own grid with its felled trees where they fell; and a family with no timber on its land still raises a house.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseBuilt, shelterOf } from '../sim/houses.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { fellFacts, fellRefusal, fellTree, logsLying, standingTrees } from '../sim/felling.mjs';
import { huntFacts } from '../sim/hunting.mjs';
import { landAround } from '../sim/ground.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import {
  KINDS, QUARRY, STANDS, STANDS_2016, WOODS_SOURCE, WOODS_SOURCE_2016, gridStandAt, patchAt, patchCover, standAt, treeById, treesIn, woodsRule,
} from '../sim/woods.mjs';
import { outsideStandAt } from '../sim/outside-woods.mjs';
import { woodsTile } from '../sim/woods-view.mjs';
import { STAND_IDS, standOfSetting } from '../scripts/terrain/biomes.mjs';

const terrain = realTerrain(), at = (lon, lat) => milesFrom(terrain, lon, lat);
const land = landAround();
const biomes = { rule: 'biomes', nearCreek: land.nearCreek }, old = { rule: 'landfire', nearCreek: land.nearCreek };
/** The share of ground within `miles` of a point whose patch is timber, water left out. */
function timberShare(point, options, miles) {
  let timber = 0, n = 0;
  for (let dx = -miles; dx <= miles; dx += 1 / 16) for (let dy = -miles; dy <= miles; dy += 1 / 16) {
    if (dx * dx + dy * dy > miles * miles) continue;
    const patch = patchAt({ x: point.x + dx, y: point.y + dy }, options);
    if (patch.stand === 'water' || patch.stand === 'none') continue;
    n++; if (patchCover(patch) === 'timber') timber++;
  }
  return timber / n;
}

test('the country of 1836 stands where the research puts it, and every biome is one the simulation can read', () => {
  for (const [name, lon, lat, stand] of [
    ['the Lost Pines at Bastrop', -97.23, 30.12, 'pine'],
    ['the Big Thicket', -94.95, 30.45, 'thicket'],
    ['the coastal prairie at Harrisburg', -95.3, 29.75, 'coastal-prairie'],
    ['the chaparral south-west of the Nueces', -98.65, 28.2, 'chaparral'],
    ['the thornscrub north-east of the Nueces, open mesquite prairie in 1836', -98.84, 29.28, 'mesquite-savanna'],
    ['the Hill Country near Boerne, a savanna', -98.73, 29.8, 'hill-savanna'],
    ['the cedar on the breaks at Helotes', -98.686, 29.591, 'cedar-brake'],
    ['the canebrake of Caney Creek', -95.85, 29.0, 'canebrake'],
    ['longleaf in the south-east', -94.204, 30.809, 'longleaf'],
    ['the Cross Timbers at their southern end', -97.304, 31.809, 'cross-timbers'],
    ['cypress in the Neches lowlands', -94.019, 30.054, 'cypress-swamp'],
    ['the fields at the Alamo', -98.4861, 29.426, 'fields'],
    // Cut to the record 2026-09-20 (owner; HIST-TEX-203): the fields are a band on the river, the creek, the missions and the
    // Alamo, not twenty square miles. A mile east of the Alamo is the prairie the county still was in 1858.
    ['the prairie a mile east of the Alamo', -98.47, 29.426, 'tallgrass-prairie'],
  ]) assert.equal(gridStandAt(at(lon, lat)), stand, name);
  // The coast filed right (2026-09-20, `FIC-GONZ-095`): LANDFIRE's thornscrub in the humid Gulf coastal prairie and on the
  // barrier islands was drawn as mesquite prairie until then - 127 square miles of it, which is why a Matagorda family could
  // hunt an antelope. The rule, and one of the cells it moved, on the coastal prairie north-west of Harrisburg.
  for (const [eco, stand] of [['34a', 'coastal-prairie'], ['34c', 'coastal-prairie'], ['34g', 'salt-prairie'], ['34h', 'salt-prairie'], ['34i', 'salt-prairie'],
    // 33b and 34b keep theirs: the research contemplated the post oak savanna and the subhumid coast and said so (§3.2).
    ['33b', 'mesquite-savanna'], ['34b', 'mesquite-savanna']]) {
    for (const model of ['13900', '13920', '14380']) assert.equal(standOfSetting(model, { lon: -96, lat: 29, eco }), stand, `LANDFIRE ${model} in EPA ${eco}`);
  }
  assert.equal(gridStandAt({ x: 90.94, y: -42.56 }), 'coastal-prairie', 'the coastal prairie north-west of Harrisburg is drawn as mesquite');
  // The ten settings the week of 2026-09-15 filed under the wrong stand (docs/BIOMES.md §6.3).
  const plain = { lon: -97, lat: 30, eco: '' };
  for (const [model, stand] of [['14800', 'cypress-swamp'], ['13230', 'thicket'], ['15060', 'thicket'], ['13930', 'cedar-brake'], ['15230', 'cedar-brake'],
    ['15240', 'cedar-brake'], ['14390', 'chaparral'], ['14950', 'marsh'], ['11620', 'creek'], ['11320', 'mixedgrass-prairie'], ['11490', 'mixedgrass-prairie'], ['31', 'dunes']]) {
    assert.equal(standOfSetting(model, plain), stand, `LANDFIRE ${model}`);
  }
  // Every stand the grids hold, and every one the creeks make, has what the simulation reads.
  for (const id of [...STAND_IDS, 'creek-draw', 'bank']) {
    const stand = STANDS[id];
    assert.ok(stand, id);
    assert.ok(stand.name && Number.isFinite(stand.game) && stand.game >= 0 && stand.game <= 1, `${id}'s name and game`);
    assert.ok(Array.isArray(stand.quarry) && stand.quarry.every(q => QUARRY[q]), `${id}'s quarry`);
    assert.ok(Math.abs(stand.classes.reduce((sum, c) => sum + c.share, 0) - 1) < 1e-9, `${id}'s classes make a whole`);
    for (const c of stand.classes) {
      assert.ok(Number.isFinite(c.perAcre) && (c.perAcre === 0 || c.size), `${id} ${c.name}: trees an acre and their size`);
      for (const [k] of c.kinds || stand.kinds) assert.ok(KINDS[k], `${id} grows ${k}`);
      if (c.perAcre > 0) assert.ok((c.kinds || stand.kinds).length > 0, `${id} ${c.name} has trees of some kind`);
    }
  }
  // No log timber in the mesquite or the chaparral (Holley p. 21), none in the fields, the prairies all but none.
  const logsIn = (point, side = 0.5) => (treesIn({ minX: point.x, minY: point.y, maxX: point.x + side, maxY: point.y + side }, biomes) || []).reduce((sum, t) => sum + t.logs, 0);
  const chaparral = at(-98.65, 28.2), inChaparral = (treesIn({ minX: chaparral.x, minY: chaparral.y, maxX: chaparral.x + 0.5, maxY: chaparral.y + 0.5 }, biomes) || []).filter(t => standAt(t, biomes) === 'chaparral');
  assert.ok(inChaparral.length > 50 && inChaparral.every(t => t.logs === 0), 'the chaparral\'s mesquite gives no logs');
  assert.ok(logsIn(at(-94.95, 30.45)) > 500, 'the Big Thicket is thick with logs');
});

test('the Hill Country is a savanna with cedar on its breaks, not a wood', () => {
  // Boerne's country: the 2016 grid made it 40 in 100 closed woods and every creek a strip of timber.
  const hills = at(-98.73, 29.8);
  // The savanna itself: three patches in four open grass with a few big oaks, a motte or a cedar clump in the rest.
  const savanna = STANDS['hill-savanna'].classes.filter(c => c.perAcre >= 10).reduce((sum, c) => sum + c.share, 0);
  assert.ok(savanna <= 0.25, `hill-country savanna is ${(100 * savanna).toFixed(0)} in 100 timber`);
  // Round Boerne, where the Balcones breaks' cedar and the running creeks' galleries come in, well under the 2016 grid's woods.
  const now = timberShare(hills, biomes, 2), before = timberShare(hills, old, 2);
  assert.ok(now < 0.4, `the Hill Country near Boerne is ${(100 * now).toFixed(0)} in 100 timber`);
  assert.ok(now < before * 0.7, `it was ${(100 * before).toFixed(0)} in 100`);
});

test('Béxar and the Alamo stand among fields, with a line of trees on the river and no woods', () => {
  const places = coloniesMap().places, alamo = { x: places.bexar.x + 0.45, y: places.bexar.y };
  const now = timberShare(alamo, biomes, 0.25), before = timberShare(alamo, old, 0.25);
  assert.ok(before > 0.3, `the old woods round the Alamo, ${(100 * before).toFixed(0)} in 100`);
  // What is left is the line of bank trees on the river, which passes within the quarter mile.
  assert.ok(now < 0.15, `the Alamo's quarter mile is ${(100 * now).toFixed(0)} in 100 timber`);
  // The fields run from the head of the river to Espada; the mission stood in them (HIST-TEX-098).
  for (const [name, lon, lat] of [['the head of the river', -98.475, 29.46], ['Mission Concepción', -98.4925, 29.3903], ['Mission Espada', -98.4636, 29.3183]]) {
    assert.ok(['fields', 'water'].includes(gridStandAt(at(lon, lat))), `${name} is in the fields: ${gridStandAt(at(lon, lat))}`);
  }
  // The river keeps its bank trees: patches along it in the fields are the bank's, and nothing else in the fields stands.
  let bank = 0, fieldTrees = 0;
  for (let dy = -2; dy <= 5; dy += 1 / 16) {
    const point = { x: places.bexar.x + 0.1, y: places.bexar.y + dy };
    const river = land.nearestWater(point, info => info.name === 'San Antonio River', 1);
    if (!river) continue;
    const patch = patchAt(river.at, biomes);
    if (patch.stand === 'bank') bank++;
  }
  for (const tree of treesIn({ minX: alamo.x - 0.2, minY: alamo.y - 0.2, maxX: alamo.x + 0.2, maxY: alamo.y + 0.2 }, biomes) || []) if (patchAt(tree, biomes).stand === 'fields') fieldTrees++;
  assert.ok(bank > 20, `${bank} bank patches on the San Antonio through the fields`);
  assert.equal(fieldTrees, 0, 'no tree stands in a field');
  // And the hunt says so.
  const words = huntFacts(createGonzalesWorld('biomes-hunt', 5, { map: 'colonies' }), null, alamo);
  assert.equal(words.can, false, 'no family to hunt for');
});

test('a creek keeps its timber only where it runs all year: none on a dry prairie creek, a few trees in the post oak', () => {
  // Places on creeks, looked for on a grid round San Felipe and Gonzales, by the creek's flow and the country it runs through.
  const found = { dryPrairie: null, runningPrairie: null, dryOak: null };
  for (const centre of [at(-96.1, 29.8), at(-97.45, 29.5), at(-96.4, 30.0)]) {
    for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) {
      const probe = { x: centre.x + i * 0.4, y: centre.y + j * 0.4 };
      for (const flow of ['intermittent', 'perennial']) {
        const creek = land.nearestWater(probe, info => info.kind === 'creek' && info.perennial === (flow === 'perennial'), 0.4);
        if (!creek) continue;
        const grid = gridStandAt(creek.at), other = land.nearCreek(creek.at, 0.1, flow === 'perennial' ? 'intermittent' : 'perennial');
        if (other) continue;
        if (flow === 'intermittent' && ['coastal-prairie', 'tallgrass-prairie'].includes(grid)) found.dryPrairie ||= creek.at;
        if (flow === 'perennial' && ['coastal-prairie', 'tallgrass-prairie'].includes(grid)) found.runningPrairie ||= creek.at;
        if (flow === 'intermittent' && grid === 'post-oak') found.dryOak ||= creek.at;
      }
    }
  }
  assert.ok(found.dryPrairie && found.runningPrairie && found.dryOak, JSON.stringify(found));
  assert.equal(standAt(found.dryPrairie, biomes), gridStandAt(found.dryPrairie), 'an intermittent prairie creek has no timber (Lincecum 1835, HIST-TEX-094)');
  assert.equal(standAt(found.dryPrairie, old), 'creek', 'where the 2016 grid gave it a strip of timber');
  assert.equal(standAt(found.runningPrairie, biomes), 'creek', 'a creek that runs all year keeps its gallery');
  assert.equal(standAt(found.dryOak, biomes), 'creek-draw', 'a dry creek through post oak keeps a few trees');
  assert.equal(patchCover({ ...STANDS['creek-draw'].classes[0], stand: 'creek-draw' }), 'open', 'a few trees, not closed woods');
});

test('the country outside the box is filed by the same rules, so the woods meet at its edge', () => {
  const header = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/outside-woods.json.gz', import.meta.url))).toString('utf8'));
  const own = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-woods.json.gz', import.meta.url))).toString('utf8'));
  assert.deepEqual(header.stands, own.stands.map(stand => stand.id), 'one list of stands');
  // Every mile along the box's four edges, a quarter mile inside against a quarter mile outside.
  const edges = { west: -99, east: -94, south: 28, north: 32 };
  let same = 0, pairs = 0;
  const pair = (inside, outside) => {
    const a = gridStandAt(at(...inside)), b = outsideStandAt(at(...outside));
    if (['none', 'water'].includes(a) || ['none', 'water'].includes(b)) return;
    pairs++; if (a === b) same++;
  };
  const dLon = 0.25 / 60.26, dLat = 0.25 / 68.88;
  for (let lat = 28.05; lat < 31.95; lat += 1 / 69) { pair([edges.west + dLon, lat], [edges.west - dLon, lat]); pair([edges.east - dLon, lat], [edges.east + dLon, lat]); }
  for (let lon = -98.95; lon < -94.05; lon += 1 / 60) pair([lon, edges.south + dLat], [lon, edges.south - dLat]);
  assert.ok(pairs > 300, `${pairs} pairs`);
  // Two places half a mile apart inside the box are the same stand 63 in 100 times (measured 2026-09-19); across the edge, as
  // often. Filed by other rules or other ids they would all but never agree.
  assert.ok(same / pairs > 0.5, `${(100 * same / pairs).toFixed(0)} in 100 of the stands meet across the edge`);
  // Mexico is its own country, not one brush: chaparral, the delta round Matamoros, the south bank's river woods.
  const mexico = ['chaparral', 'mesquite-savanna', 'thorn-riparian', 'palm-grove', 'hill-savanna'];
  for (const [lon, lat] of [[-99.8, 26.5], [-100.2, 27.5], [-97.7, 25.85]]) assert.ok(mexico.includes(outsideStandAt(at(lon, lat))), `${lat}, ${lon}: ${outsideStandAt(at(lon, lat))}`);
  assert.equal(outsideStandAt(at(-99.8, 26.5)), 'chaparral');
});

test('a class made in the week of 2026-09-15 opens on its own grid, its felled trees where they fell', () => {
  const world = createGonzalesWorld('biomes-old-save', 5, { map: 'colonies' });
  assert.equal(world.map.woods, WOODS_SOURCE);
  // A class of that week: its map recorded the 2016 grid.
  world.map.woods = WOODS_SOURCE_2016;
  assert.equal(woodsRule(world), 'landfire');
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(h => h.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
  const places = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) places.push({ x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 9, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 9 });
  applyAction(world, 'hh-1', { action: 'choose-site', ...places.find(point => siteFactsFor(world, household, point).can) });
  // Fell three trees where the 2016 grid has timber.
  const place = places.find(point => standingTrees(world, point).length >= 3);
  assert.ok(place, 'timber on the old grid');
  const trees = standingTrees(world, place).slice(0, 3);
  for (const tree of trees) assert.deepEqual(treeById(tree.id, old), tree, 'the tree is the 2016 grid\'s');
  // As the axe does it, one by one (`fellTree` keeps its count on the feller's chore).
  const feller = { ...world.entities[household.principalId], chore: { id: 'fell-trees' } };
  for (const tree of trees) assert.ok(fellTree(world, household, feller, tree.id));
  // Saved and opened again, as the classroom does.
  const opened = JSON.parse(JSON.stringify(world));
  validateWorld(opened);
  assert.equal(woodsRule(opened), 'landfire');
  const lying = logsLying(opened, opened.households['hh-1']);
  assert.equal(lying.length, trees.length);
  for (const entry of lying) {
    const tree = trees.find(t => t.id === entry.id);
    assert.equal(entry.x, tree.x); assert.equal(entry.y, tree.y);
  }
  // The map's close-up tile shows them as stumps, from the same grid.
  const size = 0.25, tx = Math.floor(trees[0].x / size), ty = Math.floor(trees[0].y / size);
  const tile = woodsTile(opened, 'trees', tx, ty);
  assert.ok(tile.stumps.some(([x, y]) => x === trees[0].x && y === trees[0].y), 'the stump is drawn where the tree stood');
  // And the 2016 stands' own words and game, not the biomes'.
  assert.equal(STANDS_2016['hill-savanna'].game, 0.6);
});

test('a family with no timber on its land still raises a house: a jacal, which wants no logs', () => {
  // A Matagorda family on marsh and coastal prairie: no log timber anywhere on its holding. (The seed was `fell-tiles-2`
  // until 2026-09-19, when the named creeks' wider galleries put a belt of timber on that holding; `fell-tiles-1`'s
  // Matagorda family is still without.)
  const world = createGonzalesWorld('fell-tiles-1', 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(h => h.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
  const places = [];
  for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 11).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 11).toFixed(3) });
  applyAction(world, 'hh-1', { action: 'choose-site', ...places.find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  assert.ok(places.every(point => !fellFacts(world, household, point).can), 'no timber to fell anywhere on the holding');
  assert.ok(places.some(point => fellRefusal(world, household, point) === 'No timber stands there to fell.'));
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  const people = household.members.map(id => world.entities[id]).filter(person => choreAvailability(world, household, person, 'build-house')?.can);
  assert.ok(people.length > 0, 'somebody can build');
  let ticks = 0;
  for (; ticks < 400 && !houseBuilt(household); ticks++) {
    for (const person of people) if (!person.chore && !person.travel) applyAction(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'build-house' });
    stepWorld(world);
  }
  assert.ok(houseBuilt(household), `the jacal stands after ${ticks} ticks`);
  assert.ok(shelterOf(world, household), 'and the family lives in it');
});
