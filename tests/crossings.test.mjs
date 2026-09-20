// The crossings: a ford, a ferry or a bridge wherever a road meets a river or creek the map draws, at the historical crossing
// where the record gives one (owner, 2026-09-18; docs/MAP_ACCURACY.md §10, HISTORY.md HIST-TEX-140 to -155, FIC-GONZ-090 to -092).
//
// The built map (public/terrain/colonies-map.json.gz) is checked against the record's crossings and against its own roads and
// water; the ferry's wait is checked on a class; and the army's dated camps are checked to hold with the ferries' waits in them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { decodeProvince } from '../public/land-levels.js';
import { coloniesMap, isStage } from '../sim/colonies-map.mjs';
import { findPath } from '../sim/geography.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, progressTravel, validateWorld } from '../sim/world.mjs';
import { findWay } from '../sim/ways.mjs';
import { FERRY_MINUTES, FARMING_TICK_MINUTES, FORCED_MARCH_HOURS, MODES, ferryMiles, fordMinutes, groundLeft, milesAnHour, propertyId } from '../sim/travel.mjs';
import { HOUSTON_CAMPS } from '../sim/houston.mjs';
import { crossingsAlong } from '../sim/scrape.mjs';
import { WATER_HIGH, WATER_SHUT, waterAt } from '../sim/weather.mjs';
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
// The box's own crossings. The country outside the box has its own roads, its own rivers and its own test below.
const crossings = Object.values(map.places).filter(place => ['ford', 'ferry', 'bridge'].includes(place.kind) && !place.outside);
const drawnAt = place => place.over || place;
const water = name => map.watercourses.filter(course => course.name === name);
const lengthOf = course => course.points.slice(1).reduce((sum, p, i) => sum + distance(p, course.points[i]), 0);
/**
 * The courses of a water that are lines and not leavings: the built map carries 85 courses of two points under a fiftieth
 * of a mile long, where joining and simplifying the reaches left a dot. Standing on one of those is not standing on water.
 */
const realCourses = name => water(name).filter(course => lengthOf(course) >= 0.05);
/**
 * The crossings audit of 2026-09-19 (`scripts/crossings-audit.mjs`, docs/MAP_ACCURACY.md §10.6). Every crossing on the built
 * map was checked - on its water, on its road, the road really bank to bank through it - and two faults were found and
 * mended in `scripts/build-colonies-map.mjs`. These are the build's own constants; the tests below hold both rules.
 */
const TIP_MILES = 0.05;        // nearer the end of a drawn line than this, the road passes the water's head: no crossing
const CHAIN_MILES = 1.5;       // meetings of one road with one water closer than this along the road are one crossing
/** Every meeting of a road with a watercourse the map draws, with how squarely the two lines meet there. */
function meetingsOf(road, course) {
  const found = [], down = course.points.reduce((run, p, i) => (run.push(i ? run[i - 1] + distance(p, course.points[i - 1]) : 0), run), []);
  let road_along = 0;
  for (let i = 1; i < road.points.length; i++) {
    const a = road.points[i - 1], b = road.points[i], leg = distance(a, b);
    for (let j = 1; j < course.points.length; j++) {
      const c = course.points[j - 1], d = course.points[j];
      const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
      if (Math.abs(den) < 1e-12) continue;
      const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const along = down[j - 1] + (down[j] - down[j - 1]) * u;
      found.push({
        x: a.x + t * r.x, y: a.y + t * r.y, road: road_along + leg * t, toEnd: Math.min(along, down.at(-1) - along),
        square: Math.abs(Math.sin(Math.atan2(s.y, s.x) - Math.atan2(r.y, r.x))),
      });
    }
    road_along += leg;
  }
  return found.sort((a, b) => a.road - b.road);
}
/** Those meetings chained as the build chains them: a run is meetings no gap in which is longer than CHAIN_MILES. */
function runsOf(meetings) {
  if (!meetings.length) return [];
  const out = [];
  let run = [meetings[0]];
  for (const hit of meetings.slice(1)) {
    if (hit.road - run.at(-1).road > CHAIN_MILES) { out.push(run); run = [hit]; } else run.push(hit);
  }
  out.push(run);
  return out;
}

test('the country outside the box is drawn and never walked: its places, its crossings on its rivers, and no road into the graph', () => {
  // Owner, 2026-09-19: the places past the old box. Matamoros and the road up to San Patricio, the Camino Real to Laredo and
  // from the Presidio del Río Grande, and the Old San Antonio Road east to Gaines's ferry (HIST-TEX-158 to -163).
  const outside = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/outside-province.json.gz', import.meta.url))).toString('utf8'));
  const riverLines = name => outside.rivers.filter(river => river.name === name)
    .map(river => { const flat = river.levels[0]; const points = []; for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return points; });
  const RECORD = [
    ['matamoros', 'distant', 'HIST-TEX-158', -97.50417, 25.87972],
    ['san-patricio', 'distant', 'HIST-TEX-159', -97.776421, 27.9771416],
    ['laredo', 'distant', 'HIST-TEX-160', -99.49028, 27.52361],
    ['presidio-rio-grande', 'distant', 'HIST-TEX-161', -100.37694, 28.30833],
    // The crossings stand on the river the country outside draws, which is why they are not at the record's point to the yard.
    ['paso-de-francia', 'ford', 'HIST-TEX-161', -100.30721, 28.24683],
    ['matamoros-crossing', 'ferry', 'FIC-GONZ-091', -97.50417, 25.87972],
    ['san-patricio-crossing', 'ford', 'HIST-TEX-159', -97.776421, 27.9771416],
    ['gaines-ferry', 'ferry', 'HIST-TEX-163', -93.7537667, 31.4621167],
  ];
  for (const [id, kind, claimId, lon, lat] of RECORD) {
    const place = map.places[id];
    assert.ok(place, `${id} is not a place`);
    assert.equal(place.kind, kind, `${id} is a ${place.kind}`);
    assert.equal(place.claimId, claimId, `${id} names ${place.claimId}`);
    assert.equal(place.outside, true, `${id} is not marked as outside the box`);
    const off = distance(place, at(lon, lat));
    assert.ok(off <= 3, `${id} is ${off.toFixed(2)} miles from where the record puts it`);
  }
  // Every crossing outside is on the river it names, as that country draws it, and on a road that goes over it.
  const roadsOutside = map.roads.filter(road => road.kind === 'outside');
  assert.ok(roadsOutside.length >= 5, `${roadsOutside.length} roads outside the box`);
  for (const place of Object.values(map.places).filter(one => one.outside && one.water)) {
    assert.ok(riverLines(place.water).some(points => toLine(place, points) <= 0.2), `${place.id} is not on the ${place.water} the country outside draws`);
    assert.ok(roadsOutside.some(road => toLine(place, road.points) <= 0.05), `${place.id} is on no road outside the box`);
  }
  // Nothing of the box's is drawn as outside, and no place outside is a town: a town would take the word and a family's trade.
  assert.ok(!Object.values(map.places).some(place => place.outside && place.kind === 'town'), 'a place outside the box is a town');
  assert.ok(Object.values(map.places).filter(place => place.kind === 'town').every(place => !place.outside), 'a town is marked outside');
  // And none of it is walked: the roads outside are not in the graph, so no way to Matamoros is ever found.
  const world = createGonzalesWorld('crossings-outside', 5, { map: 'colonies' });
  assert.equal(findWay(world, 'goliad', 'matamoros', 'foot'), null, 'a family can walk to Matamoros');
  assert.equal(findWay(world, 'nacogdoches', 'gaines-ferry', 'foot'), null, "a family can walk to Gaines's ferry");
  assert.equal(findPath(world.map, 'san-felipe', 'laredo'), null, 'the word can be carried to Laredo');
  assert.ok(findWay(world, 'goliad', 'victoria', 'foot'), 'the box\'s own roads still carry');
});

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
  let met = 0, heads = 0;
  for (const road of roads) {
    for (const course of map.watercourses) {
      const down = course.points.reduce((run, p, i) => (run.push(i ? run[i - 1] + distance(p, course.points[i - 1]) : 0), run), []);
      for (let i = 1; i < road.points.length; i++) for (let j = 1; j < course.points.length; j++) {
        const a = road.points[i - 1], b = road.points[i], c = course.points[j - 1], d = course.points[j];
        const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        // Inside the last few yards of the drawn line the road passes the water's head, it does not go over it, and the
        // build makes no crossing there (`TIP_MILES`, 2026-09-19; the test below holds that rule on its own).
        const along = down[j - 1] + (down[j] - down[j - 1]) * u;
        if (Math.min(along, down.at(-1) - along) < TIP_MILES) { heads++; continue; }
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
  // How many meetings the head rule throws out is the next test's business, not this one's; counted here only so a rule
  // that quietly swallowed everything would show.
  assert.ok(heads < 10, `${heads} meetings are inside the head or the mouth of their line`);
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

test('a crossing stands where its road goes over the water, not where it runs along it: the squarest meeting of its run', () => {
  // The crossings audit, 2026-09-19. A road laid over the least effort follows a creek bottom for a mile at a time and
  // crosses and recrosses it; the crossing was the middle meeting of that run, which is a graze - the ford drawn square
  // across a water the road is running *in*. The ford on Brushy Creek stood on a meeting of three degrees with one of
  // ninety a third of a mile away; the ford on Sandy Creek on nine degrees with seventy-two two thirds of a mile away.
  // The rule, stated as the build states it: the crossing's drawn point **is** the squarest meeting of its run. Every
  // coordinate on the map is rounded to a hundredth of a mile, so a fiftieth is the whole honest slack - except for the
  // five crossings the map already had, whose points are the record's and stay where the record puts them (PLACE_CROSSINGS
  // in the build). One of those is drawn at its meeting through `over` only when it stands further off than
  // CONFLUENCE_MILES; nearer than that it is drawn at its own point, as Beeson's is, 0.09 miles from the water.
  const RECORD_PLACED = new Set(['ford', 'atascosito-crossing', 'la-grange-crossing', 'columbus-crossing', 'lower-colorado-crossing']);
  const CONFLUENCE_MILES = 0.15;
  let checked = 0;
  for (const place of crossings) {
    if (!place.water) continue; // open water the map draws as the sea (Lynch's ferry) is not a line to meet
    const point = drawnAt(place);
    for (const road of roads) {
      if (toLine(point, road.points) > 0.05) continue;
      for (const course of realCourses(place.water)) {
        // The run the crossing was made from: one of its meetings is where the crossing stands. A road that merely passes
        // near a crossing another road made, and meets the water its own few hundredths of a mile off, is not this road.
        for (const run of runsOf(meetingsOf(road, course)).filter(run => run.some(hit => distance(hit, point) <= 0.02))) {
          checked++;
          const squarest = run.reduce((best, hit) => (hit.square > best.square ? hit : best));
          const degrees = hit => (Math.asin(Math.min(1, hit.square)) * 180 / Math.PI).toFixed(0);
          const here = run.reduce((best, hit) => (distance(hit, point) < distance(best, point) ? hit : best));
          assert.ok(distance(squarest, point) <= (RECORD_PLACED.has(place.id) ? CONFLUENCE_MILES : 0.02),
            `${place.id} stands ${distance(squarest, point).toFixed(2)} miles from where ${road.id} most squarely goes over the ${place.water}: it is on a meeting of ${degrees(here)}° and the squarest of the ${run.length} in its run is ${degrees(squarest)}°`);
        }
      }
    }
  }
  assert.ok(checked >= 120, `only ${checked} crossings were matched to a run of meetings`);
});

test('no crossing stands on the head or the mouth of the water it names: there the road passes the water, it does not go over it', () => {
  // The crossings audit, 2026-09-19. Bear Branch ended dead at the road to Nacogdoches and East Branch Mad Island Slough at
  // the road from Matagorda, and a ford was drawn on each - on the tip of a creek that goes nowhere, the water arriving at
  // the road and vanishing. Both roads cross that water properly elsewhere or not at all; neither nick is a crossing now.
  for (const place of crossings) {
    if (!place.water) continue;
    const point = drawnAt(place);
    for (const course of realCourses(place.water)) {
      const down = course.points.reduce((run, p, i) => (run.push(i ? run[i - 1] + distance(p, course.points[i - 1]) : 0), run), []);
      let best = { d: Infinity };
      for (let i = 1; i < course.points.length; i++) {
        const d = toSegment(point, course.points[i - 1], course.points[i]);
        if (d < best.d) {
          const a = course.points[i - 1], b = course.points[i], dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
          const u = l ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / l)) : 0;
          best = { d, along: down[i - 1] + (down[i] - down[i - 1]) * u };
        }
      }
      if (best.d > 0.1) continue; // a different reach of the same water, nowhere near this crossing
      const toEnd = Math.min(best.along, down.at(-1) - best.along);
      assert.ok(toEnd >= TIP_MILES, `${place.id} stands ${toEnd.toFixed(3)} miles from where the drawn ${place.water} ends`);
    }
  }
  // And the other way about: wherever a road does nick the end of a drawn line, nothing was put there. Found by looking
  // rather than by name, so the rule is held on whatever roads the map has rather than on the three the audit happened to
  // find. At least one must exist, or the rule has quietly stopped applying to anything.
  let nicked = 0;
  for (const road of roads) {
    for (const course of map.watercourses) {
      if (lengthOf(course) < 0.05) continue;
      for (const nick of meetingsOf(road, course).filter(hit => hit.toEnd < TIP_MILES)) {
        nicked++;
        const there = crossings.find(place => place.water === course.name && distance(drawnAt(place), nick) <= 0.2);
        assert.ok(!there, `${there?.id} stands where ${road.id} nicks the end of ${course.name} at ${nick.x.toFixed(2)}, ${nick.y.toFixed(2)}`);
      }
    }
  }
  assert.ok(nicked >= 1, 'no road nicks the end of any drawn watercourse: the head rule is guarding nothing');
});

test('a crossing has its water drawn under it on the map a class is served, so none is drawn on dry ground', () => {
  // The crossings audit, 2026-09-19. A class is not sent the built map: `sim/colonies-region.mjs` keeps a creek within
  // KEPT_ROUND_SETTLEMENT of a settled town and for CREEK_AT_CROSSING miles round each ford, and the page draws a **river**
  // from the province's own detail levels instead (`drawTerrain`, public/app.js: a river feature of the class's terrain is
  // skipped when the land has levels). So a ford on a creek nobody settles near is drawn on bare grass unless the ford's
  // own two miles of creek are kept. Checked on a class of five, which keeps the least water.
  const world = settle(createGonzalesWorld('crossings-dry', 5, { map: 'colonies' }));
  const creeks = world.map.terrain.filter(feature => feature.kind === 'creek');
  const province = decodeProvince(JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-province.json.gz', import.meta.url))).toString('utf8')));
  let onCreeks = 0, onRivers = 0;
  for (const site of Object.values(world.map.sites).filter(site => ['ford', 'ferry', 'bridge'].includes(site.kind))) {
    if (!site.water) continue; // Lynch's ferry spans open water the map draws as the sea, measured bank to bank by `span`
    // A crossing of the country outside the box (docs/MAP_ACCURACY.md §11) stands on a river that country draws, not on the
    // box's own water: Paso de Francia on the Rio Grande, Gaines's ferry on the Sabine. Its own test checks it against the
    // lines the page is actually sent for it (`outside-province.json.gz`).
    if (site.outside) continue;
    const point = drawnAt(site);
    const lines = site.waterKind === 'creek'
      ? creeks.filter(feature => feature.name === site.water).map(feature => feature.points)
      : province.rivers.filter(river => river.name === site.water).map(river => river.levels[0]).filter(Boolean);
    assert.ok(lines.length, `${site.id}: a class is sent no ${site.water} at all`);
    const off = Math.min(...lines.map(points => toLine(point, points)));
    assert.ok(off <= 0.25, `${site.id} is ${off.toFixed(2)} miles from the ${site.water} a class is sent: it is drawn on dry ground`);
    if (site.waterKind === 'creek') onCreeks++; else onRivers++;
  }
  // A floor, not a count: it says the check ran over the map's crossings and not over a handful. It read 100 and 24 when the
  // Old San Antonio Road was laid again over Robbins's ferry (2026-09-19), which took its old southern creeks off the map.
  assert.ok(onCreeks >= 90 && onRivers >= 10, `${onCreeks} crossings on creeks and ${onRivers} on rivers were checked`);
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

/**
 * One walk from Liberty to Harrisburg with the rivers at the level wanted: what the water did, and how long it took.
 * `want` is 'down' (below `WATER_HIGH`), 'up' (between the two lines) or 'over' (past `WATER_SHUT`, when a river's ford is
 * not to be crossed at all).
 */
function crossOnce(seed, want, from = 'liberty', to = 'harrisburg') {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  // The class's weather is its own (sim/weather.mjs), so a day of the kind wanted is looked for rather than set.
  // At the fords this road actually crosses, which are not all in one country: the water is the region's (sim/weather.mjs).
  const onTheWay = (findWay(world, from, to, 'foot').fords || []).map(id => world.map.sites[id]);
  const level = day => Math.max(...onTheWay.map(site => waterAt(world, site, day)));
  // 'up' looks for a river well up rather than barely over the line: the wade grows with the water, and at a creek just
  // past WATER_HIGH it is a few minutes, which a twenty-minute tick swallows.
  // Only a river's ford shuts, so the flood is looked for on the rivers of the way.
  const rivers = onTheWay.filter(site => site.waterKind !== 'creek');
  const overLevel = day => (rivers.length ? Math.max(...rivers.map(site => waterAt(world, site, day))) : 0);
  const wanted = day => (want === 'down' ? level(day) < WATER_HIGH : want === 'up' ? level(day) >= 0.6 && level(day) < WATER_SHUT : overLevel(day) >= WATER_SHUT);
  let day = 0;
  while (day < 400 && !wanted(day)) day++;
  if (day >= 400) return null;
  world.minute = day * 1440 + 6 * 60;
  const person = Object.values(world.entities).find(entity => entity.principal);
  person.chore = null; person.task = 'rest'; person.travel = null;
  person.location = { x: world.map.sites[from].x, y: world.map.sites[from].y, siteId: from };
  beginTravel(world, person, to, null, 'errand', 'foot');
  const began = world.minute;
  let ticks = 0;
  while (person.travel && ticks < 5000) { world.minute += FARMING_TICK_MINUTES; progressTravel(world, person); ticks++; }
  return { world, minutes: world.minute - began, said: world.events.filter(event => event.claimId === 'FIC-GONZ-094').map(event => event.text) };
}

test('a ford costs a wade, and the water being up costs more and can go wrong', () => {
  // Owner, 2026-09-19, by multiple choice: fording should cost "a wade that can go wrong", and high water should cost more
  // (`FIC-GONZ-094`, sim/travel.mjs `FORD_MINUTES`, sim/world.mjs `wadeAt`).
  assert.deepEqual([fordMinutes('foot', 'river'), fordMinutes('horse', 'river'), fordMinutes('wagon', 'river'), fordMinutes('foot', 'creek')], [20, 15, 40, 5]);
  for (const mode of ['foot', 'horse', 'wagon']) {
    assert.match(MODES[mode].describe, /over a ford, a wade/, `${mode}: the control does not say what a ford costs`);
  }
  // The wade is in the pace of the road, so a way that wades costs that much more going than the same way without it.
  const world = colonies();
  for (const mode of ['foot', 'horse', 'wagon']) {
    const over = findWay(world, 'san-felipe', 'harrisburg', mode), dry = findWay(world, 'san-felipe', 'harrisburg', mode, { ferries: false });
    assert.ok(over.fords?.length >= 3, `${mode}: the way from San Felipe to Harrisburg wades ${over.fords?.length || 0} fords`);
    const waded = over.fords.reduce((sum, id) => sum + fordMinutes(mode, map.places[id]?.waterKind), 0);
    const ferried = (over.ferries || []).length * FERRY_MINUTES;
    const longer = (groundLeft({ ...over, progress: 0, distance: over.distance }) - groundLeft({ ...dry, progress: 0, distance: dry.distance })) / MODES[mode].speed * FARMING_TICK_MINUTES;
    assert.ok(Math.abs(longer - (waded + ferried)) < 0.2, `${mode}: the crossings cost ${longer.toFixed(1)} minutes, not the ${(waded + ferried).toFixed(1)} of their wades and waits`);
  }
  // The wade reads how high the rivers are running, not today's sky (sim/weather.mjs `water`, `FIC-GONZ-133`): a river stays
  // up for days after the rain that raised it. With the water down nothing is said at a ford; with it up the wade is longer
  // and the family is told at the water.
  const down = crossOnce('wade-fair', 'down'), wet = crossOnce('wade-wet', 'up');
  assert.ok(down && wet, 'no class ran its rivers down, or up');
  assert.equal(down.said.length, 0, 'a family was told of high water on a river that was down');
  assert.ok(wet.said.length >= 1, 'the water was never up at a ford');
  assert.ok(wet.minutes > down.minutes, `the crossing in high water took ${wet.minutes} minutes against ${down.minutes} with the rivers down`);
  // Some of those crossings go wrong, and are said differently; the share is hashed, so the same class crosses the same way twice.
  const wrong = wet.said.filter(text => /swept off the crossing/.test(text));
  assert.ok(wrong.length >= 1 && wrong.length < wet.said.length, `${wrong.length} of ${wet.said.length} crossings in high water went wrong`);
  assert.deepEqual(crossOnce('wade-wet', 'up').said, wet.said, 'the same class did not cross the same way twice');
  assert.ok(wet.said.every(text => /The water is up at /.test(text)), `the water was not named: ${wet.said[0]}`);
  // Past `WATER_SHUT` a river's ford is not to be crossed at all: whoever came down to it waits on the bank, and is told so
  // once, not every tick ("sudden rains made the Medina unfordable", 21 February 1836, `HIST-TEX-237`).
  // A river over its crossing is rare by design - nought to four days in a class of two hundred - so a few classes are
  // looked at to find one.
  let flood = null;
  // Over the ford at Gonzales and the one at Béxar, which are river fords: a creek's never shuts.
  // Over the ford on the San Bernard, a river ford in the wetter middle country: a creek's ford never shuts, and the west's
  // rivers, in twelve classes of four hundred days, never came within two hundredths of the line.
  for (let seed = 1; seed <= 12 && !flood; seed++) flood = crossOnce(`wade-flood-${seed}`, 'over', 'gonzales', 'san-felipe');
  assert.ok(flood, 'no class of twelve ran a river over its crossing in four hundred days');
  const shut = flood.world.events.filter(event => event.claimId === 'FIC-GONZ-133');
  assert.ok(shut.length >= 1, 'a river over its crossing was forded anyway');
  assert.match(shut[0].text, /The water is over the crossing at .*Nobody is fording it today/);
  assert.equal(new Set(shut.map(event => event.text)).size, shut.length, 'the same crossing was said shut twice in a day');
});

test('a ferry costs an hour\'s wait, whoever waits, and is said on the control and in the travel words', () => {
  assert.equal(FERRY_MINUTES, 60);
  for (const mode of ['foot', 'horse', 'wagon']) {
    const over = journey(mode), without = journey(mode, { ferries: false });
    const path = findWay(over.world, 'san-felipe', 'harrisburg', mode);
    assert.ok(path.ferries?.includes('san-felipe-ferry'), `${mode}: the way from San Felipe to Harrisburg does not go over the San Felipe ferry`);
    // The wait is the ferry's miles of this way of going, laid on the stretch it stands on: an hour at the mode's pace.
    // The fords on the same way are waded now (2026-09-19, FIC-GONZ-094), and their wade is in the same pace: taken off here,
    // so what is left is the ferries' own hour.
    const waded = (path.fords || []).reduce((sum, id) => sum + fordMinutes(mode, map.places[id]?.waterKind), 0);
    const waited = (over.open - without.open) / MODES[mode].speed * FARMING_TICK_MINUTES - waded;
    // The pace is kept to three places, so to a tenth of a minute.
    assert.ok(Math.abs(waited - FERRY_MINUTES * path.ferries.length) < 0.1, `${mode}: the ferries cost ${waited} minutes, not ${FERRY_MINUTES} each`);
    assert.ok(Math.abs(ferryMiles(mode) - milesAnHour(MODES[mode].speed) * FERRY_MINUTES / 60) < 1e-9, `${mode}: a ferry's miles are not an hour's going`);
    // And the journey, stepped, arrives that much later, to the tick.
    const late = (over.ticks - without.ticks) * FARMING_TICK_MINUTES - waded;
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
