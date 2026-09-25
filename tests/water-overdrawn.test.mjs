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
  let path = [], dashed = false;
  return {
    strokes, canvas: { width, height },
    beginPath() { path = []; }, moveTo(x, y) { path.push(['move', x, y]); }, lineTo(x, y) { path.push(['line', x, y]); },
    bezierCurveTo(...a) { path.push(['bezier', ...a]); }, quadraticCurveTo(...a) { path.push(['quad', ...a]); },
    stroke() { path.dashed = dashed; path.width = this.lineWidth; strokes.push(path); },
    setLineDash(dash) { dashed = dash.length > 0; }, clearRect() {}, fillRect() {}, createLinearGradient: () => ({ addColorStop() {} }),
  };
}
/** Points along a recorded path, `per` to each piece: straight between the ends of a line, on the curve of a Bézier. */
function along(path, per) {
  const out = [];
  let at = null;
  for (const [kind, ...a] of path) {
    if (kind === 'move') { at = { x: a[0], y: a[1] }; out.push(at); continue; }
    const end = kind === 'line' ? { x: a[0], y: a[1] } : kind === 'quad' ? { x: a[2], y: a[3] } : { x: a[4], y: a[5] };
    for (let n = 1; n <= per; n++) {
      const t = n / per, u = 1 - t;
      out.push(kind === 'line'
        ? { x: at.x + (end.x - at.x) * t, y: at.y + (end.y - at.y) * t }
        : kind === 'quad'
        ? { x: u * u * at.x + 2 * u * t * a[0] + t * t * end.x, y: u * u * at.y + 2 * u * t * a[1] + t * t * end.y }
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
      // so off the curve through all of them. The chords were tens of pixels off, across the grass. A ripple of the current
      // (a mark narrower than a third of the channel) is scattered across the water on purpose, and has only to stay on it:
      // inside the water the flood lays down - its widest stroke but one, the widest being the soaked bottoms, which are
      // ground and not water.
      const water = strokes.map(each => each.width).sort((a, b) => b - a)[1] / 2;
      if (path.width < width / 3) assert.ok(off < water, `a ripple on the flood is drawn ${off.toFixed(1)} px off the river's line, off the water (${water.toFixed(1)} px wide each side)`);
      else assert.ok(off < 2, `${what} is drawn ${off.toFixed(1)} px off the river's own line, across its bends`);
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

// ---------------------------------------------------------------------------------------------- the flood reads as water
//
// On its curve, the flood was the owner's brown trail still: a tan body (#8a7444) and a lighter tan crown (#a78d53) that,
// laid over the river, came within a few ΔE of the roads' own dirt. A flooded river has to read at a glance as water, muddy
// and high, never as a road; and it must not show the ordinary river's blue either (docs/WEATHER.md §10.8: a river at the
// level that shuts a ford must read at a glance, and a blue core showing through read as an ordinary river, 2026-09-20).

/** sRGB hex to CIE L*a*b* (D65). */
function lab(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, y = 0.2126 * r + 0.7152 * g + 0.0722 * b, z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
/** CIEDE2000 colour difference (Sharma, Wu and Dalal 2005). About 2 is just noticeable; past 10 two colours are different colours. */
function deltaE([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C7 = c => c ** 7 / (c ** 7 + 25 ** 7);
  const G = 0.5 * (1 - Math.sqrt(C7((Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2)));
  const A1 = a1 * (1 + G), A2 = a2 * (1 + G), C1 = Math.hypot(A1, b1), C2 = Math.hypot(A2, b2);
  const hue = (a, b) => (a || b ? (Math.atan2(b, a) / rad + 360) % 360 : 0);
  const h1 = hue(A1, b1), h2 = hue(A2, b2);
  let dh = C1 * C2 ? h2 - h1 : 0;
  if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dL = L2 - L1, dC = C2 - C1, dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh * rad / 2);
  const L = (L1 + L2) / 2, C = (C1 + C2) / 2;
  const h = C1 * C2 ? (Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2) : h1 + h2;
  const T = 1 - 0.17 * Math.cos((h - 30) * rad) + 0.24 * Math.cos(2 * h * rad) + 0.32 * Math.cos((3 * h + 6) * rad) - 0.2 * Math.cos((4 * h - 63) * rad);
  const SL = 1 + 0.015 * (L - 50) ** 2 / Math.sqrt(20 + (L - 50) ** 2), SC = 1 + 0.045 * C, SH = 1 + 0.015 * C * T;
  const RT = -2 * Math.sqrt(C7(C)) * Math.sin(60 * Math.exp(-(((h - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const toHex = rgb => `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

// What a road, a lane or a trail is drawn in. Its surface is the band a reader takes for a road: `drawRoad`'s three strokes
// (every road, lane, timber track and town street, public/landscape-art.js), a ford's trodden ground (`drawCrossing`), and
// the old line styles (public/app.js `TERRAIN_STYLE.road`, the province's roads). Its marks are thin: the ruts, and a lane's
// uncut stakes (public/app.js).
const ROAD_SURFACE = { '#ac9f71': "a road's verge", '#c2ac7d': "a road's shoulder", '#d1bc8f': "a road's track", '#c5bc90': "a ford's trodden ground", '#c3b189': "the terrain style's road", '#b9a97f': "the province's roads" };
const ROAD_MARKS = { '#806d49': "a road's ruts", '#6b4f2a': "a lane's uncut stakes" };
/** The ordinary river's middle (`drawWater`, its innermost stroke). */
const RIVER_CORE = '#5e9498';
// The floors, and why. ΔE 2000 past 10 is two different colours side by side; a road's surface is held at twice that from the
// flood, and fifteen L* lighter as well, so the two differ in value and not only in hue - seen in grey, or by a student who
// does not see colour well, the flood is still not a road. A mark is a line a pixel or two wide and needs only to be another
// colour. And the flood is held from the ordinary river, so a river in flood never reads as one that is not.
const SURFACE_APART = 20, DARKER = 15, MARK_APART = 10, NOT_ORDINARY = 15;

/** A recorder that keeps what each stroke was drawn in. */
function styled() {
  const strokes = [];
  const ctx = { canvas: { width: 1280, height: 800 }, globalAlpha: 1, strokeStyle: '#000000', lineWidth: 1, dash: [],
    beginPath() {}, moveTo() {}, lineTo() {}, bezierCurveTo() {}, quadraticCurveTo() {}, setLineDash(dash) { ctx.dash = dash; },
    stroke() { strokes.push({ color: ctx.strokeStyle, alpha: ctx.globalAlpha, width: ctx.lineWidth, dashed: ctx.dash.length > 0 }); } };
  return { ctx, strokes };
}
/** The colour a reader sees where these strokes lie: each laid over the last, over the river's own middle. */
const seen = strokes => toHex(strokes.reduce((rgb, s) => rgb.map((c, i) => c * (1 - s.alpha) + rgbOf(s.color)[i] * s.alpha), rgbOf(RIVER_CORE)));

test('a river in flood reads as water, never as a road: far from the roads\' colours in hue and in value, and not the ordinary river', () => {
  // The roads are still drawn in what the flood is held apart from.
  const art = readFileSync(new URL('../public/landscape-art.js', import.meta.url), 'utf8');
  const roadColours = [...art.slice(art.indexOf('export function drawRoad'), art.indexOf('export function crossingAngle')).matchAll(/stroke\(ctx,points,'(#[0-9a-f]{6})'/g)].map(m => m[1]);
  assert.deepEqual(roadColours, ['#ac9f71', '#c2ac7d', '#d1bc8f'], 'drawRoad is drawn in other colours now: hold the flood apart from those');
  const width = 28;
  for (const water of [0.25, 0.4, 0.6, 0.85, 1]) {
    const { ctx, strokes } = styled();
    assert.equal(drawHighWater(ctx, [{ points: [{ x: 0, y: 400 }, { x: 600, y: 380 }, { x: 1200, y: 420 }], width }], () => water).drawn, 1);
    // Mid-channel, every solid stroke lies there (each is centred on the river); where a streak of current passes, it too.
    // At the bank, only the strokes wider than the channel reach.
    // The water is the strokes laid along the whole river, each centred on it; a ripple of the current, or a stick of drift,
    // is a mark a pixel or two wide, as a rut is, and is held as a mark is: another colour from every road's.
    const solid = strokes.filter(s => s.width >= width / 2), marks = strokes.filter(s => s.width < width / 2);
    assert.ok(marks.length >= 10, `the flood has ${marks.length} ripples of current on it`);
    const places = [['the middle', seen(solid)], ['the bank', seen(solid.filter(s => s.width > width))]];
    for (const mark of new Map(marks.map(m => [`${m.color}|${m.alpha}`, m])).values()) {
      const colour = seen([...solid, mark]);
      for (const [road, what] of Object.entries({ ...ROAD_SURFACE, ...ROAD_MARKS })) {
        const apart = deltaE(lab(colour), lab(road));
        assert.ok(apart >= MARK_APART, `at water ${water}, a mark on the flood (${colour}) is ΔE ${apart.toFixed(1)} from ${what} (${road})`);
      }
    }
    for (const [where, colour] of places) {
      for (const [road, what] of Object.entries(ROAD_SURFACE)) {
        const apart = deltaE(lab(colour), lab(road)), darker = lab(road)[0] - lab(colour)[0];
        assert.ok(apart >= SURFACE_APART, `at water ${water}, ${where} of the flood (${colour}) is ΔE ${apart.toFixed(1)} from ${what} (${road}): it reads as a road`);
        assert.ok(darker >= DARKER, `at water ${water}, ${where} of the flood (${colour}) is only ${darker.toFixed(1)} L* darker than ${what} (${road})`);
      }
      for (const [mark, what] of Object.entries(ROAD_MARKS)) {
        const apart = deltaE(lab(colour), lab(mark));
        assert.ok(apart >= MARK_APART, `at water ${water}, ${where} of the flood (${colour}) is ΔE ${apart.toFixed(1)} from ${what} (${mark})`);
      }
    }
    const ordinary = deltaE(lab(places[0][1]), lab(RIVER_CORE));
    assert.ok(ordinary >= NOT_ORDINARY, `at water ${water} the flood (${places[0][1]}) is ΔE ${ordinary.toFixed(1)} from the ordinary river: its blue shows through`);
  }
});
