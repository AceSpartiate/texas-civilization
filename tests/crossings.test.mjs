// The crossings: a ford, a ferry or a bridge wherever a road meets a river or creek the map draws, at the historical crossing
// where the record gives one (owner, 2026-09-18; docs/MAP_ACCURACY.md §10, HISTORY.md HIST-TEX-140 to -155, FIC-GONZ-090 to -092).
//
// The built map (public/terrain/colonies-map.json.gz) is checked against the record's crossings and against its own roads and
// water; the ferry's wait is checked on a class; and the army's dated camps are checked to hold with the ferries' waits in them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { coloniesMap, isStage } from '../sim/colonies-map.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, progressTravel, validateWorld } from '../sim/world.mjs';
import { findWay } from '../sim/ways.mjs';
import { FERRY_MINUTES, FARMING_TICK_MINUTES, FORCED_MARCH_HOURS, MODES, ferryMiles, groundLeft, milesAnHour, propertyId } from '../sim/travel.mjs';
import { HOUSTON_CAMPS } from '../sim/houston.mjs';
import { crossingsAlong } from '../sim/scrape.mjs';
import { settle } from './support/settled.mjs';

const map = coloniesMap();
const terrain = realTerrain();
const at = (lon, lat) => milesFrom(terrain, lon, lat);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};
const toLine = (p, points) => points.slice(1).reduce((best, q, i) => Math.min(best, toSegment(p, points[i], q)), Infinity);
const roads = map.roads.filter(road => ['road', 'crossing'].includes(road.kind));
const crossings = Object.values(map.places).filter(place => ['ford', 'ferry', 'bridge'].includes(place.kind));
const drawnAt = place => place.over || place;
const water = name => map.watercourses.filter(course => course.name === name);

test("Beeson's stands on the east bank where the army camped, and the Atascosito road crosses nine miles below it", () => {
  // Owner, 2026-09-19. Until then Beeson's stood at Columbus's official point, on the Gonzales side of the river the map
  // draws, though Houston's army "camped on the east bank of the Colorado River opposite Beason's crossing" (HIST-TEX-157);
  // and the Atascosito road went over at Beeson's, not at its own crossing nine miles below Columbus (HIST-TEX-156).
  const colorado = water('Colorado River');
  // How many times a line between two points crosses the drawn river: odd when the river is between them.
  const between = (a, b) => colorado.reduce((count, course) => count + course.points.slice(1).filter((q, i) => {
    const p = course.points[i], r = { x: b.x - a.x, y: b.y - a.y }, s = { x: q.x - p.x, y: q.y - p.y };
    const den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-12) return false;
    const t = ((p.x - a.x) * s.y - (p.y - a.y) * s.x) / den, u = ((p.x - a.x) * r.y - (p.y - a.y) * r.x) / den;
    return t > 0 && t < 1 && u > 0 && u < 1;
  }).length, 0);
  const beesons = map.places['columbus-crossing'], lower = map.places['lower-colorado-crossing'];
  assert.equal(between(map.places.gonzales, beesons) % 2, 1, "the Colorado is not between Gonzales and Beeson's: the camp is on the wrong bank");
  assert.equal(between(map.places['san-felipe'], beesons) % 2, 0, "the Colorado is between San Felipe and Beeson's: the camp is on the wrong bank");
  // The road the army took east from the camp does not cross the river again; the road it came by does.
  const mail = map.roads.find(road => road.id === 'road-columbus-crossing-san-felipe');
  assert.equal(mail.name, "The mail road by Beeson's", 'the road east from Beeson\'s is the mail road (HIST-TEX-146)');
  assert.equal(between(map.places['san-felipe'], beesons), 0, 'the mail road east crosses the Colorado');
  // The Atascosito road goes over at its own crossing, and nowhere near Beeson's.
  for (const id of ['road-victoria-lower-colorado-crossing', 'road-lower-colorado-crossing-san-felipe']) {
    const road = map.roads.find(r => r.id === id);
    assert.ok(road, `${id} is not a road`);
    assert.equal(road.name, 'The Atascosito road');
  }
  assert.ok(!map.roads.some(road => road.name === 'The Atascosito road' && [road.from, road.to].includes('columbus-crossing')), "the Atascosito road still goes by Beeson's");
  assert.ok(toLine(drawnAt(lower), map.roads.find(r => r.id === 'road-lower-colorado-crossing-san-felipe').points) <= 0.05, 'the lower crossing is not on the Atascosito road');
  const apart = distance(drawnAt(lower), drawnAt(beesons));
  assert.ok(apart > 4 && apart < 9, `the lower crossing is ${apart.toFixed(1)} miles from Beeson's in a straight line, for nine by the river`);
  assert.ok(drawnAt(lower).y > drawnAt(beesons).y, 'the lower crossing is not below Beeson\'s');
});

test('each crossing the record gives is at its place, of its kind, and on its road and its water', () => {
  // [id, kind, claim, lon, lat, within miles]: the record's point, or the town the crossing is at.
  const RECORD = [
    ['ford', 'ford', 'HIST-GONZ-007', -97.4524926, 29.5016257, 0.5], // "the ford" opposite Gonzales
    ['lynchs-ferry', 'ferry', 'HIST-TEX-150', -95.08000, 29.76361, 0.15], // the middle of the water at the present ferry's crossing
    ['vinces-bridge', 'bridge', 'HIST-TEX-153', -95.22015, 29.71933, 0.15], // the 1912 marker
    ['groces-ferry', 'ferry', 'HIST-TEX-088', -96.08359, 30.02738, 1], // the 1936 marker "Site of Groce's Ferry"
    // The river the map draws, today's, runs about a mile east of the town's point (HIST-TEX-085 holds it within 1.5).
    ['san-felipe-ferry', 'ferry', 'HIST-TEX-142', -96.1007929, 29.7930093, 1.5],
    ['robinsons-ferry', 'ferry', 'HIST-TEX-143', -96.1566258, 30.3252093, 1],
    ['brighams-ferry', 'ferry', 'HIST-TEX-144', -95.56016, 29.05593, 0.5],
    ['harrisburg-ferry', 'ferry', 'HIST-TEX-151', -95.2785, 29.7228, 0.5], // "opposite the town of Harrisburg"
    ['lower-ford', 'ford', 'HIST-TEX-148', -97.3830, 28.6476, 1], // "the lower ford", on the Victoria road
    ['bexar-ford', 'ford', 'HIST-TEX-149', -98.4936282, 29.4241219, 1],
    ['mina-ford', 'ford', 'HIST-TEX-147', -97.3152701, 30.1104947, 1], // Smithwick's ford at Mina
    ['columbus-crossing', 'ferry', 'HIST-TEX-146', -96.5352167, 29.7043667, 0.15], // Beeson's ferry, at the 1993 marker
    // "29°40' N, 96°27' W", nine miles below Columbus (TSHA): a coordinate given to the minute, about a mile either way.
    ['lower-colorado-crossing', 'ford', 'HIST-TEX-156', -96.45, 29.6666667, 1],
    ['la-grange-crossing', 'ferry', 'HIST-TEX-145', -96.876647, 29.9055033, 1], // Burnam's ferry, near La Grange
    ['atascosito-crossing', 'ferry', 'HIST-TEX-152', -94.7954784, 30.057993, 4], // three miles above Liberty
  ];
  for (const [id, kind, claimId, lon, lat, within] of RECORD) {
    const place = map.places[id];
    assert.ok(place, `${id} is not a place`);
    assert.equal(place.kind, kind, `${id} is a ${place.kind}, not a ${kind}`);
    assert.equal(place.claimId, claimId, `${id} names ${place.claimId}`);
    const off = distance(drawnAt(place), at(lon, lat));
    assert.ok(off <= within, `${id} is ${off.toFixed(2)} miles from where the record puts it`);
    assert.ok(roads.some(road => toLine(drawnAt(place), road.points) <= 0.05), `no road goes over ${id}`);
    if (place.water) assert.ok(water(place.water).some(course => toLine(drawnAt(place), course.points) <= 0.1), `${id} is not on the ${place.water}`);
  }
  // The places the map already had stay where they were: Gonzales's ford at the river nearest the town, the three named
  // crossings at their towns' points, drawn where their roads meet the river.
  assert.deepEqual([map.places.ford.x, map.places.ford.y], [0.89, -0.48], 'the ford at Gonzales moved');
  assert.ok(distance(map.places['columbus-crossing'], at(-96.5352167, 29.7043667)) < 0.01, 'Beeson\'s moved off the marker');
  assert.ok(distance(map.places['la-grange-crossing'], at(-96.876647, 29.9055033)) < 0.01, 'the Colorado crossing moved');
  // Lynch's ferry is the ferry at Lynchburg; Groce's is on Groce's road to Bernardo.
  assert.ok(distance(map.places['lynchs-ferry'], map.places.lynchburg) < 0.6, 'Lynch\'s ferry is not by Lynchburg');
  assert.ok(toLine(map.places['groces-ferry'], map.roads.find(road => road.id === 'road-groces-bernardo').points) <= 0.05, 'Groce\'s ferry is not on the road from the camp to Bernardo');
  // The three that were `crossing` places are stages, and nothing else is.
  assert.deepEqual(Object.values(map.places).filter(isStage).map(place => place.id).sort(), ['atascosito-crossing', 'columbus-crossing', 'la-grange-crossing']);
});

test('every place a road meets a river or creek the map draws has a crossing on that road, and every crossing is on a road and its water', () => {
  let met = 0;
  for (const road of roads) {
    for (const course of map.watercourses) {
      for (let i = 1; i < road.points.length; i++) for (let j = 1; j < course.points.length; j++) {
        const a = road.points[i - 1], b = road.points[i], c = course.points[j - 1], d = course.points[j];
        const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        met++;
        const hit = { x: a.x + t * r.x, y: a.y + t * r.y };
        // A road that wanders along a creek bottom meets it again and again, and those meetings are one crossing (the
        // build's CHAIN_MILES along the road); a crossing at a confluence stands for both waters there.
        const here = crossings.filter(place => toLine(drawnAt(place), road.points) <= 0.05
          && ((place.water === course.name && distance(drawnAt(place), hit) <= 4) || distance(drawnAt(place), hit) <= 0.2));
        assert.ok(here.length, `${road.id} meets ${course.name} at ${hit.x.toFixed(2)}, ${hit.y.toFixed(2)} with no crossing there`);
      }
    }
  }
  assert.ok(met > 150, `the roads meet the water ${met} times`);
  for (const place of crossings) {
    assert.ok(roads.some(road => toLine(drawnAt(place), road.points) <= 0.05), `${place.id} is on no road`);
    if (place.water) assert.ok(water(place.water).some(course => toLine(drawnAt(place), course.points) <= 0.1), `${place.id} is not on the ${place.water}`);
    assert.match(place.claimId, /^(HIST|FIC)-/, `${place.id} names its claim`);
  }
  // Where nothing is in the record the game's choice is a ford, and a ferry only on the big rivers and the tidal water.
  for (const place of crossings.filter(p => p.claimId === 'FIC-GONZ-090')) {
    assert.equal(place.kind, ['San Jacinto River', 'Buffalo Bayou'].includes(place.water) ? 'ferry' : 'ford', `${place.id}`);
  }
});

let shared = null;
const colonies = () => structuredClone(shared ??= (() => {
  const world = settle(createGonzalesWorld('crossings', 5, { map: 'colonies' }));
  world.status = 'running';
  return world;
})());
/** Farming ticks from setting out at San Felipe to arriving at Harrisburg, and the journey. */
function journey(mode, { ferries = true } = {}) {
  const world = colonies();
  const person = Object.values(world.entities).find(entity => entity.principal);
  const household = world.households[person.householdId];
  for (const role of ['ox', 'horse', 'wagon']) {
    const beast = world.entities[propertyId(household.id, role)];
    if (beast) { beast.location = { x: world.map.sites['san-felipe'].x, y: world.map.sites['san-felipe'].y, siteId: 'san-felipe' }; beast.borrowedBy = null; }
  }
  person.location = { x: world.map.sites['san-felipe'].x, y: world.map.sites['san-felipe'].y, siteId: 'san-felipe' };
  person.chore = null; person.task = 'rest';
  beginTravel(world, person, 'harrisburg', null, 'errand', mode);
  const travel = person.travel;
  if (!ferries) travel.pace = findWay(world, 'san-felipe', 'harrisburg', mode, { ferries: false }).pace;
  const open = groundLeft(travel);
  let ticks = 0;
  while (person.travel && ticks < 5000) { world.minute += FARMING_TICK_MINUTES; progressTravel(world, person); ticks++; }
  return { world, travel, open, ticks };
}

test('a ferry costs an hour\'s wait, whoever waits, and is said on the control and in the travel words', () => {
  assert.equal(FERRY_MINUTES, 60);
  for (const mode of ['foot', 'horse', 'wagon']) {
    const over = journey(mode), without = journey(mode, { ferries: false });
    const path = findWay(over.world, 'san-felipe', 'harrisburg', mode);
    assert.ok(path.ferries?.includes('san-felipe-ferry'), `${mode}: the way from San Felipe to Harrisburg does not go over the San Felipe ferry`);
    // The wait is the ferry's miles of this way of going, laid on the stretch it stands on: an hour at the mode's pace.
    const waited = (over.open - without.open) / MODES[mode].speed * FARMING_TICK_MINUTES;
    // The pace is kept to three places, so to a tenth of a minute.
    assert.ok(Math.abs(waited - FERRY_MINUTES * path.ferries.length) < 0.1, `${mode}: the ferries cost ${waited} minutes, not ${FERRY_MINUTES} each`);
    assert.ok(Math.abs(ferryMiles(mode) - milesAnHour(MODES[mode].speed) * FERRY_MINUTES / 60) < 1e-9, `${mode}: a ferry's miles are not an hour's going`);
    // And the journey, stepped, arrives that much later, to the tick.
    const late = (over.ticks - without.ticks) * FARMING_TICK_MINUTES;
    assert.ok(Math.abs(late - FERRY_MINUTES * path.ferries.length) <= FARMING_TICK_MINUTES, `${mode}: arrived ${late} minutes later over the ferries`);
    assert.match(MODES[mode].describe, /ferry, an hour waiting for the boat/, `${mode}: the control does not say what a ferry costs`);
  }
  const { world } = journey('foot');
  assert.ok(world.events.some(event => event.type === 'departure' && /goes over the San Felipe ferry, with a wait for the boat/.test(event.text)), 'the departure does not say the ferry');
  // Where no ferry lies on the way there is no wait.
  const world2 = colonies();
  const plain = findWay(world2, 'gonzales', 'victoria', 'foot');
  assert.equal(plain.ferries, undefined, 'the road from Gonzales to Victoria has a ferry on it');
});

test('a rider with word and the flight of the spring do not wait for the ferries: their waits are their own', () => {
  const world = colonies();
  // A rider carrying word keeps the roads by findPath and the pace the letters were calibrated on (sim/expresses.mjs).
  const rider = Object.values(world.entities).find(entity => entity.principal);
  rider.location = { x: world.map.sites['san-felipe'].x, y: world.map.sites['san-felipe'].y, siteId: 'san-felipe' };
  rider.express = { topicId: 'test' };
  beginTravel(world, rider, 'harrisburg', null, 'express');
  assert.equal(rider.travel.pace, undefined, 'a rider with word waits at the ferry');
  // The flight waits at the three named crossings and the river towns, as it always did, and at no ferry besides.
  const path = findWay(world, 'gonzales', 'lynchburg', 'foot', { ferries: false });
  assert.equal(path.ferries, undefined, 'the flight is given the ferries\' wait');
  const stops = crossingsAlong(world, { points: path.points, distance: path.distance });
  assert.ok(stops.length, 'the flight to Lynchburg waits nowhere');
  for (const stop of stops) assert.ok(isStage(world.map.sites[stop.id]) || ['san-felipe', 'washington', 'lynchburg', 'liberty'].includes(stop.id), `the flight waits at ${stop.id}`);
});

test('the army keeps its dated camps with the ferries\' waits on its road', () => {
  const world = colonies();
  const camps = HOUSTON_CAMPS.filter(camp => world.map.sites[camp.siteId]);
  let ferried = 0;
  for (let i = 1; i < camps.length; i++) {
    const way = findWay(world, camps[i - 1].siteId, camps[i].siteId, 'foot');
    assert.ok(way, `no way from ${camps[i - 1].siteId} to ${camps[i].siteId}`);
    ferried += (way.ferries || []).length;
    // Open-road miles at three miles an hour, ten hours of going a day (FORCED_MARCH_HOURS, FIC-GONZ-064).
    const open = way.points.slice(1).reduce((sum, p, k) => sum + distance(way.points[k], p) * (way.pace.find(([s]) => s === k)?.[1] ?? 1), 0);
    const minutes = open / milesAnHour(MODES.foot.speed) * 60 * 24 / FORCED_MARCH_HOURS;
    // Sets out at its camp's hour; must be there before it sets out again - and Lynchburg by noon on the 20th, before the battle.
    const due = i + 1 < camps.length ? camps[i + 1].from : camps[i].from + 24 * 60;
    assert.ok(camps[i].from + minutes <= due, `the army reaches ${camps[i].siteId} ${((camps[i].from + minutes - due) / 60).toFixed(1)} hours after it should set out again`);
  }
  assert.ok(ferried >= 2, `the army's road goes over ${ferried} ferries (Groce's at least, and Harrisburg's or Lynch's)`);
});

test('a class saved before the crossings opens and plays: its map keeps its own crossings, and no ferry is waited at', () => {
  const world = colonies();
  // The map as it was saved before 2026-09-19: no ford, ferry or bridge but Gonzales's ford, and the three named crossings `crossing`.
  for (const site of Object.values(world.map.sites)) {
    if (!('water' in site)) continue;
    if (['atascosito-crossing', 'columbus-crossing', 'la-grange-crossing'].includes(site.id)) { site.kind = 'crossing'; delete site.stage; delete site.over; }
    else if (site.id !== 'ford') { delete world.map.sites[site.id]; continue; }
    delete site.water; delete site.waterKind; delete site.across;
  }
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  const path = findWay(saved, 'san-felipe', 'harrisburg', 'foot');
  assert.equal(path.ferries, undefined, 'an old class waits at a ferry it never had');
  // Its three named crossings are what they were, stops and no ferries: the way on from Beeson's has no wait.
  assert.equal(findWay(saved, 'columbus-crossing', 'san-felipe', 'foot').ferries, undefined, 'an old class waits at Beeson\'s');
  assert.ok(isStage(saved.map.sites['columbus-crossing']), 'an old class\'s crossing is not a stage');
  const person = Object.values(saved.entities).find(entity => entity.principal);
  person.location = { x: saved.map.sites['san-felipe'].x, y: saved.map.sites['san-felipe'].y, siteId: 'san-felipe' };
  person.chore = null;
  beginTravel(saved, person, 'harrisburg', null, 'errand', 'foot');
  for (let tick = 0; tick < 200 && person.travel; tick++) { saved.minute += FARMING_TICK_MINUTES; progressTravel(saved, person); }
  assert.equal(person.location.siteId, 'harrisburg', 'the old class\'s journey did not arrive');
  validateWorld(saved);
});
