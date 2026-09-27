// The Mexican advance's places, made real (owner, 2026-09-26, docs/SCRAPE.md §10 (c): "Real places to go"; docs/MAP_ACCURACY.md
// §14): Thompson's and its ferry, the Old Fort, Stafford's, New Washington and Mrs. Powell's are places of the map at their
// markers, with the roads the columns went by; a family can go to each; the columns pass through them and burn Stafford's, New
// Washington and Mrs. Powell's there; an old save is given them at its door, nothing it had moved; Emily West is at New
// Washington itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { validateWorld } from '../sim/world.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { findWay } from '../sim/ways.mjs';
import { COLUMNS, clockOf, firesNow, headAt, on } from '../sim/advance.mjs';
import { ADVANCE_PLACES, advancePlacesOpen, openAdvancePlaces } from '../sim/advance-places.mjs';
import { famousNow } from '../sim/famous.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { siteOfPlace } from '../sim/colonies-region.mjs';

const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const built = coloniesMap();
/** The record's points, written here from the markers (THC Atlas, converted; Fort Bend's site; Mrs. Powell's on Turkey Creek). */
const MARKERS = { thompsons: [-95.78529, 29.60016, 'landing'], 'old-fort': [-95.7517, 29.5772, 'village'], staffords: [-95.583099, 29.623819, 'farmstead'], 'new-washington': [-95.00822, 29.67226, 'village'], powells: [-95.9656, 29.4613, 'farmstead'] };
const cross = (a, c, p, q) => { const s = (u, v, w) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x)); return s(a, c, p) !== s(a, c, q) && s(p, q, a) !== s(p, q, c); };
const brazosCrossings = road => {
  const found = [];
  for (const course of built.watercourses.filter(one => one.name === 'Brazos River')) {
    for (let i = 1; i < road.points.length; i++) for (let j = 1; j < course.points.length; j++) if (cross(road.points[i - 1], road.points[i], course.points[j - 1], course.points[j])) found.push(road.points[i]);
  }
  return found;
};
const roadOf = (from, to) => built.roads.find(road => road.from === from && road.to === to);

test('the five are places of the map at their markers, with the roads the columns went by and Thompson\'s ferry over the Brazos', () => {
  const terrain = realTerrain();
  for (const [id, [lon, lat, kind]] of Object.entries(MARKERS)) {
    const place = built.places[id], at = milesFrom(terrain, lon, lat);
    assert.ok(place, `${id} is not a place of the map`);
    assert.equal(place.kind, kind);
    assert.ok(near(place, at) < 0.02, `${id} is ${near(place, at).toFixed(2)} miles off its marker`);
    assert.ok(!place.outside, `${id} is drawn and never walked`);
  }
  const ferry = built.places['thompsons-ferry'];
  assert.equal(ferry.kind, 'ferry');
  assert.equal(ferry.water, 'Brazos River');
  assert.ok(near(ferry, built.places.thompsons) < 0.3, "Thompson's ferry is not at Thompson's");
  // Down the right bank from San Felipe, as Santa Anna went, and over only at Thompson's ferry on the way to Stafford's.
  assert.deepEqual(brazosCrossings(roadOf('san-felipe', 'thompsons')), [], 'the road from San Felipe crosses the Brazos');
  assert.deepEqual(brazosCrossings(roadOf('thompsons', 'old-fort')), []);
  const over = brazosCrossings(roadOf('thompsons', 'staffords'));
  assert.equal(over.length, 1, 'the road to Stafford\'s does not cross the Brazos once');
  assert.ok(near(over[0], ferry) < 0.3, 'the road to Stafford\'s crosses the Brazos away from Thompson\'s ferry');
  for (const [from, to] of [['staffords', 'harrisburg'], ['harrisburg', 'new-washington'], ['old-fort', 'powells'], ['powells', 'columbia']]) assert.ok(roadOf(from, to), `no road from ${from} to ${to}`);
});

test('a family can go to each of them, on foot and by wagon, over the ferries and fords', () => {
  const world = createGonzalesWorld('advance-places', 5, { map: 'colonies' });
  for (const id of ADVANCE_PLACES) {
    for (const mode of ['foot', 'wagon']) {
      const way = findWay(world, 'san-felipe', id, mode);
      assert.ok(way, `nobody can go from San Felipe to ${id} ${mode === 'foot' ? 'on foot' : 'by wagon'}`);
    }
  }
  // Stafford's and New Washington are over the Brazos: the way from San Felipe goes by a ferry of it.
  assert.ok(findWay(world, 'harrisburg', 'new-washington', 'foot').distance > 10);
});

test('the columns pass through them, and Stafford\'s, New Washington and Mrs. Powell\'s burn there on their dates', () => {
  const world = createGonzalesWorld('advance-places', 5, { map: 'colonies' });
  const santa = COLUMNS.find(one => one.id === 'santa-anna');
  let over = false;
  for (let t = on(1836, 4, 14, 15); t <= on(1836, 4, 15, 6); t += 10) if (near(headAt(world.map, santa, t), world.map.sites['thompsons-ferry']) < 0.1) over = true;
  assert.ok(over, "Santa Anna's column never went over at Thompson's ferry");
  world.director.arrival = true;
  for (const [id, minute] of [['staffords', on(1836, 4, 15, 14)], ['new-washington', on(1836, 4, 20, 10)], ['powells', on(1836, 4, 26, 14)]]) {
    world.minute = minute + clockOf(world);
    const fire = firesNow(world).find(one => one.id === id);
    assert.ok(fire, `${id} is not smoking on its date`);
    assert.ok(near(fire, world.map.sites[id]) < 0.01, `${id}'s smoke is not at the place`);
  }
});

test('an old save is given them at its door, nothing it had moved; and only once', () => {
  const dir = mkdtempSync(join(tmpdir(), 'advance-places-'));
  try {
    const world = createGonzalesWorld('advance-places-old', 5, { map: 'colonies', zoneDeal: false });
    // A class saved before the places: none of them, none of their roads, none of the crossings only those roads have.
    const newRoads = built.roads.filter(road => [road.from, road.to].some(end => ADVANCE_PLACES.includes(end)));
    const theirs = id => ADVANCE_PLACES.includes(id) || (['ford', 'ferry', 'bridge'].includes(built.places[id]?.kind) && newRoads.some(road => road.points.some(p => near(p, built.places[id]) < 0.05)) && !built.roads.filter(road => !newRoads.includes(road)).some(road => road.points.slice(1).some((p, i) => near(p, built.places[id]) < 0.05 || near(road.points[i], built.places[id]) < 0.05)));
    const stripped = Object.keys(world.map.sites).filter(theirs);
    assert.ok(stripped.length > ADVANCE_PLACES.length, 'no crossing of the new roads to take out');
    for (const id of stripped) delete world.map.sites[id];
    for (const [id, route] of Object.entries(world.map.routes)) if ([route.from, route.to].some(end => ADVANCE_PLACES.includes(end))) delete world.map.routes[id];
    assert.equal(advancePlacesOpen(world), false);
    const before = JSON.parse(JSON.stringify(world.map));
    writeSave(join(dir, 'class.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'class.json')).world;
    validateWorld(opened);
    assert.equal(advancePlacesOpen(opened), true, 'the save opened without the places');
    for (const id of stripped) assert.deepEqual(opened.map.sites[id], JSON.parse(JSON.stringify(siteOfPlace(built.places[id]))), `${id} is not the built map's`);
    for (const [id, site] of Object.entries(before.sites)) assert.deepEqual(opened.map.sites[id], site, `${id} moved when the class was opened`);
    for (const [id, route] of Object.entries(before.routes)) assert.deepEqual(opened.map.routes[id], route, `${id} changed when the class was opened`);
    for (const id of stripped) assert.ok(opened.map.sites[id], `${id} was not given back`);
    for (const road of newRoads) assert.ok(Object.values(opened.map.routes).some(route => route.from === road.from && route.to === road.to), `the road from ${road.from} to ${road.to} was not given`);
    assert.ok(findWay(opened, 'san-felipe', 'old-fort', 'foot'), 'the old class cannot go to the Old Fort');
    assert.equal(openAdvancePlaces(opened), false, 'the door gave the places twice');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Emily West is at New Washington itself until the army takes her', () => {
  const world = createGonzalesWorld('advance-places', 5, { map: 'colonies' });
  world.director.arrival = true;
  world.minute = on(1836, 4, 1, 12) + clockOf(world);
  const emily = famousNow(world).find(one => one.id === 'emily-west');
  assert.ok(emily, 'Emily West is not on the map');
  assert.ok(near(emily, world.map.sites['new-washington']) < 0.1, `Emily West is ${near(emily, world.map.sites['new-washington']).toFixed(2)} miles from New Washington`);
  assert.equal(emily.place, 'New Washington');
});
