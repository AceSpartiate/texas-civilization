// The map south to the Nueces (owner, 2026-09-25, docs/BATTLES.md §2b.4; docs/MAP_ACCURACY.md §13).
//
// San Patricio, the Agua Dulce ground and the end of the walked road south are places the roads go to, over land the
// simulation reads from the same USGS and LANDFIRE data as the box (scripts/build-south.mjs, the strip laid under the box's
// grid by sim/terrain-data.mjs and sim/woods.mjs). The Nueces is a barrier crossed at San Patricio. The box's own files and
// every place and road the map had are what they were; a class saved before gains the south at the save's door and opens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { coloniesMap, BARRIER_RIVERS } from '../sim/colonies-map.mjs';
import { boxTerrain, milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { gridStandAt } from '../sim/woods.mjs';
import { findWay } from '../sim/ways.mjs';
import { findPath } from '../sim/geography.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { validateWorld } from '../sim/world.mjs';
import { openSouth, southSite, southWalkable } from '../sim/south.mjs';
import { readSave } from '../server/storage.mjs';

const map = coloniesMap();
const terrain = realTerrain(), box = boxTerrain();
const at = (lon, lat) => milesFrom(terrain, lon, lat);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};
const toLine = (p, points) => points.slice(1).reduce((best, q, i) => Math.min(best, toSegment(p, points[i], q)), Infinity);
const road = (from, to) => map.roads.find(one => one.from === from && one.to === to);

test('the land the simulation reads runs on below the box to 27.6°N, on the box\'s own lattice, and the box is untouched', () => {
  const g = box.header.grid, all = terrain.header.grid;
  assert.equal(all.columns, g.columns); assert.equal(all.minX, g.minX); assert.equal(all.minY, g.minY); assert.equal(all.cell, g.cell);
  assert.ok(all.rows > g.rows, 'the strip was not laid under the box');
  // Every cell of the box above the strip is the box's own height, byte for byte.
  const above = all.south.row0 * g.columns;
  for (let i = 0; i < above; i += 997) assert.equal(terrain.heights[i], box.heights[i], `cell ${i} of the box moved`);
  // To 27.6°N: the southern edge of the grid lies past it.
  assert.ok(terrain.bounds.maxY >= at(-97.8, 27.6).y, `the land ends at y ${terrain.bounds.maxY}`);
  // The places south have real ground under them - heights and woods where there were none - and the Gulf is still water.
  for (const id of ['san-patricio', 'agua-dulce', 'matamoros-road']) {
    const place = map.places[id];
    assert.ok(Number.isFinite(terrain.heightAt(place.x, place.y)), `${id} has no height`);
    assert.ok(!Number.isFinite(box.heightAt(place.x, place.y)) || place.y < 102.7, `${id} had a height in the box alone`);
    assert.notEqual(gridStandAt(place), 'none', `${id} has no woods`);
  }
  const heightAtSP = terrain.heightAt(map.places['san-patricio'].x, map.places['san-patricio'].y);
  assert.ok(heightAtSP > 3 && heightAtSP < 40, `San Patricio stands ${heightAtSP} m up; the Nueces valley is low`);
  // The brush country's woods: the strip is filed by the box's own rules (mesquite, thornscrub, the river woods).
  const stands = new Set(['mesquite-savanna', 'chaparral', 'thorn-riparian', 'coastal-prairie', 'live-oak', 'salt-prairie', 'bottomland', 'fields', 'water', 'marsh', 'tallgrass-prairie']);
  for (const id of ['san-patricio', 'agua-dulce']) assert.ok(stands.has(gridStandAt(map.places[id])), `${id} is ${gridStandAt(map.places[id])}`);
  // The water: the Nueces and Agua Dulce Creek are among the courses the simulation reads.
  for (const name of ['Nueces River', 'Agua Dulce Creek', 'Banquete Creek']) assert.ok(terrain.courses.some(course => course.name === name), `no ${name}`);
});

test('San Patricio, the Agua Dulce ground and the end of the road south are places at the record\'s points', () => {
  const RECORD = [
    ['san-patricio', 'village', 'HIST-TEX-159', -97.776421, 27.9771416],
    ['agua-dulce', 'ground', 'HIST-TEX-512', -97.81428, 27.7886],
    ['matamoros-road', 'ground', 'FIC-GONZ-436', -97.81, 27.62],
  ];
  for (const [id, kind, claimId, lon, lat] of RECORD) {
    const place = map.places[id];
    assert.ok(place, `${id} is not a place`);
    assert.equal(place.kind, kind);
    assert.equal(place.claimId, claimId);
    assert.ok(!place.outside, `${id} is still outside`);
    assert.ok(distance(place, at(lon, lat)) < 0.05, `${id} is not at its point`);
  }
  // San Patricio by the Nueces. (The Agua Dulce ground at the road's crossing of the creek the NHD draws: the test below.)
  const nueces = terrain.courses.filter(course => course.name === 'Nueces River').map(course => course.points);
  assert.ok(Math.min(...nueces.map(points => toLine(map.places['san-patricio'], points))) < 2, 'San Patricio is not by the Nueces');
  // No town in the south: nothing is kept or sold there, and the word stops at no express stop there.
  assert.ok(!Object.values(map.places).some(place => place.kind === 'town' && place.y > 95), 'a town was made in the south');
});

test('the Nueces is crossed only at San Patricio, and the roads from Refugio and Goliad reach San Patricio and go on by Agua Dulce', () => {
  assert.ok(BARRIER_RIVERS.includes('Nueces River'));
  const crossing = map.places['san-patricio-crossing'];
  assert.equal(crossing.kind, 'ford'); assert.equal(crossing.water, 'Nueces River'); assert.ok(!crossing.outside);
  assert.ok(map.crossings['san-patricio:Nueces River'], 'no window in the Nueces at San Patricio');
  for (const [from, to, low, high] of [['refugio', 'san-patricio', 30, 45], ['san-patricio', 'goliad', 45, 62], ['san-patricio', 'agua-dulce', 15, 16.5], ['agua-dulce', 'matamoros-road', 11, 12.5]]) {
    const one = road(from, to);
    assert.ok(one, `no road ${from} to ${to}`);
    assert.equal(one.kind, 'road', `${from} to ${to} is not walked`);
    assert.ok(one.miles >= low && one.miles <= high, `${from} to ${to} is ${one.miles} miles`);
  }
  // The road south goes over the Nueces at the crossing and nowhere else.
  const south = road('san-patricio', 'agua-dulce');
  assert.ok(toLine(crossing, south.points) < 0.1, 'the road south does not go over the crossing at San Patricio');
  // The fords the roads south make, on the creeks they cross, Agua Dulce Creek among them.
  assert.ok(Object.values(map.places).some(place => place.kind === 'ford' && place.water === 'Agua Dulce Creek' && toLine(place, road('san-patricio', 'agua-dulce').points) < 0.1), 'no ford on Agua Dulce Creek');
  // Matamoros is still drawn and never walked: its road ends where the walked road does.
  assert.equal(road('matamoros', 'matamoros-road')?.kind, 'outside');
});

test('a class can walk and ride to San Patricio and on to Agua Dulce, the word can be carried there, and never to Matamoros', () => {
  const world = createGonzalesWorld('south-walk', 5, { map: 'colonies' });
  assert.ok(southWalkable(world)); assert.equal(southSite(world), 'san-patricio');
  for (const mode of ['foot', 'horse']) {
    for (const [from, to] of [['refugio', 'san-patricio'], ['goliad', 'san-patricio'], ['san-patricio', 'agua-dulce'], ['agua-dulce', 'matamoros-road'], ['gonzales', 'san-patricio']]) {
      const way = findWay(world, from, to, mode);
      assert.ok(way, `no way on ${mode} from ${from} to ${to}`);
    }
  }
  assert.ok(findPath(world.map, 'goliad', 'san-patricio'), 'the word cannot reach San Patricio');
  assert.equal(findWay(world, 'san-patricio', 'matamoros', 'foot'), null, 'a family can walk to Matamoros');
  assert.equal(findWay(world, 'agua-dulce', 'laredo', 'horse'), null, 'a family can ride to Laredo');
});

/** A class as it was saved before 2026-09-25: San Patricio outside, no south, the outside roads drawn to it. */
function oldShape(world) {
  const old = structuredClone(world);
  const map = old.map;
  for (const id of Object.keys(map.sites)) {
    const site = map.sites[id];
    if (site.y > 86 && site.y < 140 && site.x > -45 && site.x < 20 && !site.outside && id !== 'san-patricio') delete map.sites[id];
  }
  map.sites['san-patricio'] = { id: 'san-patricio', name: 'San Patricio', kind: 'distant', x: -18.41, y: 104.26, claimId: 'HIST-TEX-159', outside: true };
  map.sites['san-patricio-crossing'] = { id: 'san-patricio-crossing', name: 'The crossing at San Patricio', kind: 'ford', x: -19.95, y: 103.96, claimId: 'HIST-TEX-159', water: 'Nueces River', waterKind: 'river', across: 1.77, outside: true };
  for (const [id, route] of Object.entries(map.routes)) if ([route.from, route.to].some(end => !map.sites[end]) || [route.from, route.to].includes('san-patricio')) delete map.routes[id];
  map.routes['route-matamoros-san-patricio'] = { id: 'route-matamoros-san-patricio', from: 'matamoros', to: 'san-patricio', kind: 'outside', name: 'The road up from Matamoros', points: [{ x: 1, y: 250 }, { x: -18.41, y: 104.26 }] };
  map.routes['route-san-patricio-goliad'] = { id: 'route-san-patricio-goliad', from: 'san-patricio', to: 'goliad', kind: 'outside', name: 'The Camino Real from Goliad to Laredo', points: [{ x: -18.41, y: 104.26 }, { x: 5.3, y: 58.09 }] };
  map.terrain = map.terrain.filter(feature => !String(feature.id).startsWith('water-south-'));
  return old;
}

test('a class saved before the south opens with it at the save\'s door: added, nothing it had moved, and no save version', () => {
  const fresh = createGonzalesWorld('south-old', 5, { map: 'colonies' });
  const old = oldShape(fresh);
  assert.ok(!southWalkable(old)); assert.equal(southSite(old), 'refugio', 'a map with no south sends the men to Refugio');
  const before = structuredClone(old.map);
  // Through the one door every save comes by.
  const dir = mkdtempSync(join(tmpdir(), 'south-old-'));
  const path = join(dir, 'class.json');
  writeFileSync(path, JSON.stringify({ saveVersion: 3, revision: 1, hostKey: 'k', sessionId: 's', sessionCode: 'C', clients: {}, hostCommands: [], world: old }));
  const opened = readSave(path).world;
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).saveVersion, 3);
  assert.ok(southWalkable(opened), 'the old class did not gain the south');
  validateWorld(opened);
  // Every place and road it had is what it was, but San Patricio, its crossing and the two roads drawn to it.
  for (const [id, site] of Object.entries(before.sites)) if (!['san-patricio', 'san-patricio-crossing'].includes(id)) assert.deepEqual(opened.sites?.[id] ?? opened.map.sites[id], site, `${id} moved`);
  for (const [id, route] of Object.entries(before.routes)) if (!['route-matamoros-san-patricio', 'route-san-patricio-goliad'].includes(id)) assert.deepEqual(opened.map.routes[id], route, `${id} moved`);
  // The south it gained is the fresh class's own.
  for (const id of ['san-patricio', 'san-patricio-crossing', 'agua-dulce', 'matamoros-road']) assert.deepEqual(opened.map.sites[id], fresh.map.sites[id], `${id} is not the built map's`);
  for (const id of ['route-refugio-san-patricio', 'route-san-patricio-goliad', 'route-san-patricio-agua-dulce', 'route-agua-dulce-matamoros-road']) assert.deepEqual(opened.map.routes[id], fresh.map.routes[id], `${id} is not the built map's`);
  assert.equal(opened.map.routes['route-matamoros-san-patricio'], undefined, 'the old outside road to San Patricio is still drawn');
  // A ford it gained has its creek under it.
  const ford = Object.values(opened.map.sites).find(site => site.water === 'Agua Dulce Creek');
  assert.ok(opened.map.terrain.some(feature => feature.name === 'Agua Dulce Creek' && toLine(ford, feature.points) < 0.25), 'the new ford stands on dry ground');
  assert.ok(findWay(opened, 'refugio', 'san-patricio', 'foot'), 'the old class cannot walk south');
  // Once open, the door changes nothing more.
  const again = structuredClone(opened);
  assert.equal(openSouth(again), false);
  assert.deepEqual(again.map, opened.map);
});

// Owner, 2026-09-26 ("At the creek crossing, 16 mi"; docs/BATTLES.md §2b.12): Agua Dulce is fought where the road south from San
// Patricio crosses the creek the map's NHD calls Agua Dulce - not at the Handbook of Texas's "twenty-six miles below San Patricio"
// (where it stood for a day) nor at Wikipedia's point near Banquete, ten miles out (`HIST-TEX-512` names all three).
const HANDBOOK = [-97.81, 27.639], BANQUETE = [-97.84972, 27.8475];
test('the Agua Dulce ground is where the road south crosses Agua Dulce Creek, about sixteen miles below San Patricio', () => {
  const ground = map.places['agua-dulce'], sp = map.places['san-patricio'];
  const walked = road('san-patricio', 'agua-dulce');
  assert.ok(walked.miles >= 15 && walked.miles <= 16.5, `the road from San Patricio to the Agua Dulce ground is ${walked.miles} miles, not about sixteen`);
  assert.ok(ground.y > sp.y + 10, 'the Agua Dulce ground is not below (south of) San Patricio');
  // At the crossing: the road's ford on the creek is a quarter mile north of the ground, and the creek itself as near.
  const ford = map.places['ford-agua-dulce-creek'];
  assert.ok(ford && ford.water === 'Agua Dulce Creek' && toLine(ford, walked.points) < 0.1, 'the road to the ground does not ford Agua Dulce Creek');
  assert.ok(distance(ford, ground) <= 0.35, `the ground is ${distance(ford, ground).toFixed(2)} miles from the road's crossing of the creek`);
  const creek = terrain.courses.filter(course => course.name === 'Agua Dulce Creek').map(course => course.points);
  assert.ok(Math.min(...creek.map(points => toLine(ground, points))) <= 0.35, 'the ground is not by Agua Dulce Creek');
  // Neither of the other two placements.
  assert.ok(distance(ground, at(...HANDBOOK)) > 8, 'the Agua Dulce ground is still at the Handbook\'s twenty-six miles');
  assert.ok(distance(ground, at(...BANQUETE)) > 3, 'the Agua Dulce ground is still at the point near Banquete');
  // On the road south, short of its end: Grant's men drive the horses north to it from where they wait.
  const onward = road('agua-dulce', 'matamoros-road').miles;
  assert.ok(onward > 11 && onward < 12.5, `the ground is ${onward} road miles from the end of the road where Grant's men wait`);
  // A class walks there on the roads.
  const world = createGonzalesWorld('south-crossing', 5, { map: 'colonies' });
  const path = findWay(world, 'san-patricio', 'agua-dulce', 'foot');
  assert.ok(path && path.distance >= 15 && path.distance <= 16.6, `a class walks ${path?.distance} miles from San Patricio to the Agua Dulce ground`);
});

test('a class saved with the south at either earlier Agua Dulce ground has it moved at the save\'s door, unless its drive north has begun', () => {
  const fresh = createGonzalesWorld('south-moved', 5, { map: 'colonies' });
  // The shape of a class saved before the move: the ground near Banquete (2026-09-25) or at the Handbook's twenty-six miles
  // (2026-09-26), and the two roads through it.
  for (const [label, point] of [['near Banquete', BANQUETE], ['at twenty-six miles', HANDBOOK]]) {
    const stale = structuredClone(fresh);
    const old = at(...point);
    stale.map.sites['agua-dulce'] = { ...stale.map.sites['agua-dulce'], x: +old.x.toFixed(2), y: +old.y.toFixed(2) };
    stale.map.routes['route-san-patricio-agua-dulce'].points = [stale.map.sites['san-patricio'], stale.map.sites['agua-dulce']].map(p => ({ x: p.x, y: p.y }));
    stale.map.routes['route-agua-dulce-matamoros-road'].points = [stale.map.sites['agua-dulce'], stale.map.sites['matamoros-road']].map(p => ({ x: p.x, y: p.y }));
    const later = structuredClone(stale);
    assert.ok(southWalkable(stale));
    assert.equal(openSouth(stale), true, `the door did not move the Agua Dulce ground ${label}`);
    assert.deepEqual(stale.map.sites['agua-dulce'], fresh.map.sites['agua-dulce'], `the ground ${label} is not the built map's`);
    for (const id of ['route-san-patricio-agua-dulce', 'route-agua-dulce-matamoros-road']) assert.deepEqual(stale.map.routes[id], fresh.map.routes[id], `${id} is not the built map's`);
    for (const [id, site] of Object.entries(fresh.map.sites)) if (site.kind !== 'ford') assert.deepEqual(stale.map.sites[id], site, `${id} moved`);
    validateWorld(stale);
    assert.equal(openSouth(stale), false, 'the door moved it twice');
    // A class that has begun the drive keeps the ground its fight was fought on.
    later.minute = 10 ** 7;
    assert.equal(openSouth(later), false, `a class past the drive north had its ground ${label} moved`);
  }
});

test('the strip\'s own files are the ones the build wrote: its grid on the box\'s lattice and its sources named', () => {
  const header = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/south-water.json.gz', import.meta.url))).toString('utf8'));
  assert.equal(header.kind, 'texas-south-strip');
  assert.deepEqual(header.area, { west: -99, east: -94, south: 27.6, north: 28 });
  assert.equal(header.grid.columns, box.header.grid.columns);
  assert.equal(header.grid.row0, box.header.grid.rows - 2, 'the strip does not begin at the box\'s first empty row');
  assert.equal(Buffer.from(header.woods.cells, 'base64').length, header.grid.columns * header.grid.rows);
  for (const source of ['heights', 'water', 'woods']) assert.match(header.sources[source], /public domain/);
});
