// Nothing brown lies over the water but the water itself (owner, 2026-09-24: "why can I see brown trail looking things over
// the rivers?"). docs/MAP_ACCURACY.md §10.8.
//
// Two things drew brown over the rivers. The high water (public/weather-art.js `drawHighWater`) - the river in flood gone
// brown, as it did at the start of every class - was laid along the straight chords between a course's points while the
// water under it is drawn as a curve through them (public/curve.js), so close in it cut every bend in straight translucent
// brown bands and stood off the channel over the grass; the fog was banked along the same chords. And a family's lane,
// dealt per class over the easiest ground to the road and wading the smaller water on the way, was drawn straight over the
// creek or the river with no ford, where a road's wade is one of the map's fords.
//
// `public/app.js` cannot be imported here (a browser module that touches `document`); the helpers it draws with can, and
// are driven with the map a class is actually sent. That the page wires them in is the browser proof's
// (`window.__wadesDrawn`, `window.__weatherGround`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { curveThrough } from '../public/curve.js';
import { drawFogShape, drawHighWater } from '../public/weather-art.js';
import { decodeProvince } from '../public/land-levels.js';
import { wadesOf } from '../public/map-base.js';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const province = decodeProvince(JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-province.json.gz', import.meta.url))).toString('utf8')));

/** A canvas context that records every path it strokes, as the calls that laid it, and paints nothing. */
function recorder(width = 1280, height = 800) {
  const strokes = [];
  let path = [];
  return {
    strokes, canvas: { width, height },
    beginPath() { path = []; }, moveTo(x, y) { path.push(['move', x, y]); }, lineTo(x, y) { path.push(['line', x, y]); },
    bezierCurveTo(...a) { path.push(['bezier', ...a]); }, stroke() { strokes.push(path); },
    setLineDash() {}, clearRect() {}, fillRect() {}, createLinearGradient: () => ({ addColorStop() {} }),
  };
}
/** Points along a recorded path, `per` to each piece: straight between the ends of a line, on the curve of a Bézier. */
function along(path, per) {
  const out = [];
  let at = null;
  for (const [kind, ...a] of path) {
    if (kind === 'move') { at = { x: a[0], y: a[1] }; out.push(at); continue; }
    const end = kind === 'line' ? { x: a[0], y: a[1] } : { x: a[4], y: a[5] };
    for (let n = 1; n <= per; n++) {
      const t = n / per, u = 1 - t;
      out.push(kind === 'line'
        ? { x: at.x + (end.x - at.x) * t, y: at.y + (end.y - at.y) * t }
        : { x: u * u * u * at.x + 3 * u * u * t * a[0] + 3 * u * t * t * a[2] + t * t * t * end.x, y: u * u * u * at.y + 3 * u * u * t * a[1] + 3 * u * t * t * a[3] + t * t * t * end.y });
    }
    at = end;
  }
  return out;
}
const toSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};
const toLine = (p, points) => { let best = Infinity; for (let i = 1; i < points.length; i++) best = Math.min(best, toSegment(p, points[i - 1], points[i])); return best; };

/**
 * The Guadalupe's bends above Victoria at a student's closest zoom, in screen pixels, as the page hands them to the weather
 * (`weatherCourses`, public/app.js: a point closer than COURSE_STEP pixels to the last one kept is dropped). The brown
 * bands were first seen here and at Gonzales.
 */
const COURSE_STEP = 6, SCALE = 1400, CENTRE = { x: 26.84, y: 46.72 };
function bend() {
  const inView = q => q.x > -200 && q.x < 1480 && q.y > -200 && q.y < 1000;
  const shown = province.rivers.filter(each => each.name === 'Guadalupe River' && each.levels[0])
    .map(each => each.levels[0].map(p => ({ x: (p.x - CENTRE.x) * SCALE + 640, y: (p.y - CENTRE.y) * SCALE + 400 })).filter(inView))
    .sort((a, b) => b.length - a.length)[0] || [];
  const water = [], thinned = [];
  for (const q of shown) {
    water.push(q);
    const last = thinned.at(-1);
    if (!last || Math.abs(q.x - last.x) + Math.abs(q.y - last.y) >= COURSE_STEP) thinned.push(q);
  }
  return { water, thinned };
}

test('the river in flood and the fog on it lie on the water as it is drawn, never across its bends', () => {
  const { water, thinned } = bend();
  assert.ok(thinned.length >= 6, `only ${thinned.length} points of the Guadalupe are in view`);
  // The water's own line: the curve `drawWater` strokes through every point (public/landscape-art.js).
  const drawnWater = recorder();
  curveThrough(drawnWater, water); drawnWater.stroke();
  const channel = along(drawnWater.strokes[0], 48);
  // The chords are well off it on these bends: the check below has something to catch.
  const chordOff = Math.max(...along(water.map((p, i) => [i ? 'line' : 'move', p.x, p.y]), 24).map(p => toLine(p, channel)));
  assert.ok(chordOff > 20, `the straight chords are only ${chordOff.toFixed(1)} px off the curve here`);
  const width = 28;
  const flood = recorder();
  const flooded = drawHighWater(flood, [{ points: thinned, width }], () => 1);
  assert.equal(flooded.drawn, 1);
  const fog = recorder();
  const banked = drawFogShape(fog, fog.canvas, [{ x: 0, width: 1280, mix: { fog: 1 } }], [{ points: thinned, width }]);
  assert.equal(banked, 1);
  for (const [what, strokes] of [['the high water', flood.strokes], ['the fog', fog.strokes]]) {
    assert.ok(strokes.length >= 3, `${what} drew ${strokes.length} strokes`);
    for (const path of strokes) {
      const off = Math.max(...along(path, 12).map(p => toLine(p, channel)));
      // Within two pixels: the page thins the points it hands the weather, and a curve through fewer points is a pixel or
      // so off the curve through all of them. The chords were tens of pixels off, across the grass.
      assert.ok(off < 2, `${what} is drawn ${off.toFixed(1)} px off the river's own line, across its bends`);
    }
  }
});

/** Where two segments cross, or null. */
function meet(a, b, c, d) {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y, den = rx * sy - ry * sx;
  if (!den) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den, u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + rx * t, y: a.y + ry * t } : null;
}

test('every place a family\'s lane goes over drawn water, a ford is drawn there', () => {
  let meetings = 0, wadesDrawn = 0, rivers = 0;
  for (const seed of ['gonzales-1835', 'lanes-over-water']) {
    const world = createGonzalesWorld(seed, 30, { map: 'colonies' });
    const sites = world.map.sites;
    // The water as the page draws it on the real land (`wadeWaterOf`, public/app.js): the class's creeks, and the land's rivers
    // at their finest level - the class's own river features are not drawn there.
    const water = [
      ...world.map.terrain.filter(feature => feature.kind === 'creek').map(feature => ({ points: feature.points, kind: 'creek', name: feature.name })),
      ...province.rivers.filter(river => river.levels[0]?.length > 1).map(river => ({ points: river.levels[0], kind: 'river', name: river.name })),
    ];
    const crossings = Object.values(sites).filter(site => ['ford', 'ferry', 'bridge', 'crossing'].includes(site.kind)).map(site => site.over || site);
    const lanes = Object.values(world.map.routes).filter(route => sites[route.to]?.kind === 'homestead');
    assert.equal(lanes.length, 30, 'every family has a lane');
    for (const lane of lanes) {
      const wades = wadesOf(lane.points, water, crossings);
      wadesDrawn += wades.length;
      for (const course of water) for (let j = 1; j < course.points.length; j++) for (let i = 1; i < lane.points.length; i++) {
        const at = meet(lane.points[i - 1], lane.points[i], course.points[j - 1], course.points[j]);
        if (!at) continue;
        meetings++;
        if (course.kind === 'river') rivers++;
        const crossing = Math.min(...crossings.map(p => Math.hypot(p.x - at.x, p.y - at.y)));
        const wade = Math.min(Infinity, ...wades.filter(w => w.name === (course.name ?? null)).map(w => Math.hypot(w.x - at.x, w.y - at.y)));
        assert.ok(crossing < 0.25 || wade < 0.1, `${seed}: ${lane.id} goes over the ${course.name || course.kind} at ${at.x.toFixed(2)}, ${at.y.toFixed(2)} with no ford drawn: the nearest wade is ${wade.toFixed(2)} miles off and the nearest crossing ${crossing.toFixed(2)}`);
      }
    }
  }
  // A floor, not a count: the lanes of sixty families do go over water, creeks and rivers both, so the check ran on something.
  // Read 2026-09-24: 53 meetings, 7 of them on rivers, and 47 wades.
  assert.ok(meetings >= 20 && rivers >= 2 && wadesDrawn >= 20, `${meetings} meetings (${rivers} on rivers), ${wadesDrawn} wades`);
});
