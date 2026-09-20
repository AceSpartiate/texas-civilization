// What decides the weather's picture, held apart from the drawing (docs/WEATHER.md, public/weather-art.js).
//
// Owner, 2026-09-20: "Weather should be a visual thing... If implemented correctly, no text should be required." The
// drawing itself is canvas and can only be judged by eye (scripts/weather-browser-proof.mjs writes the shots). What is
// testable without a browser is everything the drawing is told: how the three regions blend so they are not three
// rectangles, how a kind comes up from `since`, what hour the fog has burnt off by, which way a wind blows on the screen,
// how far a tree leans in it, and - the one that decides whether this is affordable - when the kept ground has to be
// drawn again and how many spans a view is cut into.
//
// Each of these was proven by injecting the exact regression it guards (scripts/weather-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLEND_MILES, FADE_MINUTES, FOG_CEILING, MAX_LEAN, REGIONS,
  WIND_STEPS,
  fogFade, regionWeights, sinceFade, smoothStep, weatherGroundKey, weatherMix, weatherShown, weatherSpans, windLean, windStep, windVector, zoomBand,
} from '../public/weather-art.js';

/** A world's weather on the contract the server sends (docs/WEATHER.md §10): three regions across a map 400 miles wide. */
const weatherOf = (kinds, extra = {}) => ({
  day: 12,
  bounds: { westOf: 140, eastOf: 260 },
  regions: Object.fromEntries(REGIONS.map(name => [name, {
    kind: kinds[name] || 'fair',
    water: extra[name]?.water ?? 0,
    wind: extra[name]?.wind ?? { from: 0, force: kinds[name] === 'norther' ? 1 : 0 },
    since: extra[name]?.since ?? 0,
  }])),
});

test('a region boundary is a blend, not a line: the two weathers are half and half where they meet', () => {
  const weather = weatherOf({ west: 'rain', middle: 'fair', east: 'fair' });
  const at = regionWeights(weather, 140);
  assert.ok(Math.abs(at.west - 0.5) < 0.01, `half the west at the line, got ${at.west}`);
  assert.ok(Math.abs(at.middle - 0.5) < 0.01, `half the middle at the line, got ${at.middle}`);
  // Well either side of the band it is wholly one country.
  assert.ok(regionWeights(weather, 140 - BLEND_MILES).west > 0.99);
  assert.ok(regionWeights(weather, 140 + BLEND_MILES).middle > 0.99);
  // And it changes all the way across, so no student ever sees rain stop at a vertical edge.
  let previous = 1;
  for (let x = 140 - BLEND_MILES / 2; x <= 140 + BLEND_MILES / 2; x += 1) {
    const west = regionWeights(weather, x).west;
    assert.ok(west <= previous + 1e-9, 'the west only ever gives way going east');
    previous = west;
  }
  assert.ok(previous < 0.02, 'and has wholly given way by the far side of the band');
});

test('the three weights always make one whole country, wherever you stand', () => {
  const weather = weatherOf({ west: 'storm', middle: 'rain', east: 'fog' });
  for (let x = -40; x <= 440; x += 7) {
    const at = regionWeights(weather, x);
    assert.ok(Math.abs(at.west + at.middle + at.east - 1) < 1e-9, `at ${x} the weights are ${JSON.stringify(at)}`);
    for (const name of REGIONS) assert.ok(at[name] >= 0 && at[name] <= 1);
  }
});

test('rain thins out across a boundary instead of stopping at it', () => {
  const weather = weatherOf({ west: 'rain', middle: 'fair', east: 'fair' });
  const deep = weatherMix(weather, 60, 600), line = weatherMix(weather, 140, 600), beyond = weatherMix(weather, 200, 600);
  assert.ok(deep.rain > 0.99, 'raining hard in the west');
  assert.ok(line.rain > 0.4 && line.rain < 0.6, `half rain on the line, got ${line.rain}`);
  assert.equal(beyond.rain, 0, 'and dry well inside the middle');
});

test('a norther is a wind and a cold clear sky, and it brings no rain of its own', () => {
  // docs/WEATHER.md §3.3: "The Alamo siege was cold and CLEAR, not cold and wet." Almonte has "day clear", "clear and
  // pleasant", "clear", "weather clear" for 1-5 March. A norther drawn as a wet day is the popular image, not the record.
  const mix = weatherMix(weatherOf({ west: 'norther', middle: 'norther', east: 'norther' }), 200, 600);
  assert.equal(mix.rain, 0, 'no rain in a norther');
  assert.equal(mix.storm, 0);
  assert.equal(mix.flat, 0, 'and the light does not go flat and grey - that is a rain day');
  assert.ok(mix.norther > 0.99 && mix.cold > 0.99, 'it is a wind and a cold');
  assert.ok(mix.wind.y > 0.9 && Math.abs(mix.wind.x) < 0.01, 'blowing straight down the screen, north to south');
});

test('a wind blows the way it comes from: north is down the screen, and the compass goes round clockwise', () => {
  // The record's own signature (Gray, 25 February 1836): "the wind chopped suddenly round to the north". North is up on
  // the map, so a wind out of the north drives everything down the screen.
  const north = windVector({ from: 0 });
  assert.ok(Math.abs(north.x) < 1e-9 && Math.abs(north.y - 1) < 1e-9, `out of the north drives south, got ${JSON.stringify(north)}`);
  const east = windVector({ from: Math.PI / 2 });
  assert.ok(Math.abs(east.x + 1) < 1e-9 && Math.abs(east.y) < 1e-9, 'out of the east drives west');
  const south = windVector({ from: Math.PI });
  assert.ok(Math.abs(south.y + 1) < 1e-9, 'out of the south drives north, up the screen');
  // A missing bearing is a norther, which is the only wind this game draws.
  assert.deepEqual(windVector(undefined), north);
});

test('a day comes up over its first hour and a half rather than flicking on', () => {
  const region = { kind: 'rain', since: 600 };
  assert.equal(sinceFade(region, 600), 0, 'nothing at the minute it began');
  assert.ok(Math.abs(sinceFade(region, 600 + FADE_MINUTES / 2) - 0.5) < 1e-9, 'half way through');
  assert.equal(sinceFade(region, 600 + FADE_MINUTES), 1, 'fully up');
  assert.equal(sinceFade(region, 600 + FADE_MINUTES * 4), 1, 'and stays there');
  assert.equal(sinceFade(region, 500), 0, 'and is not up before it began');
  // A class saved before the weather existed, or a day written in from the record, has no `since`: it is simply the day.
  assert.equal(sinceFade({ kind: 'rain' }, 600), 1);
});

test('the fog burns off by the hour the record says, and never comes back in the afternoon', () => {
  // Gray at San Felipe, 18 February 1836: "very foggy. Cleared off about 9 o'clock." Bowie at Concepción, 28 October
  // 1835: the dawn fog rose about 8 a.m. Full before seven, going by nine, gone by ten.
  assert.equal(fogFade(6 * 60), 1, 'thick before seven');
  assert.equal(fogFade(7 * 60), 1);
  assert.ok(fogFade(9 * 60) < 0.2, `all but gone by nine, got ${fogFade(9 * 60)}`);
  assert.equal(fogFade(10 * 60), 0, 'and gone by ten');
  assert.equal(fogFade(15 * 60), 0, 'and there is no afternoon fog');
  // The clock runs past midnight over a class; the hour is read off the day, not off the running total.
  assert.equal(fogFade(6 * 60 + 1440 * 30), 1, 'the thirtieth morning is a morning too');
});

test('the fog is a veil and never a curtain: it cannot be drawn to opacity', () => {
  // It is also drawn under the people, the houses and the names, which only the browser proof can show. This is the other
  // half of the same rule: what a family may know is the server's (VISION.md), and fog is scenery.
  assert.ok(FOG_CEILING > 0 && FOG_CEILING < 0.7, `the thickest fog is ${FOG_CEILING} of the way to opaque`);
});

test('the trees lean with the wind, and no further than a tree bends', () => {
  const norther = weatherMix(weatherOf({ west: 'norther', middle: 'norther', east: 'norther' }), 200, 600);
  const lean = windLean(norther);
  assert.ok(Math.abs(lean) > 0.1, `a norther bends the country, got ${lean}`);
  assert.ok(Math.abs(lean) <= MAX_LEAN + 1e-9, 'and never past the limit');
  assert.equal(windLean(weatherMix(weatherOf({}), 200, 600)), 0, 'a fair day bends nothing');
  // Half the force is about half the bend: the lean follows the wind rather than switching on with it.
  const half = windLean(weatherMix(weatherOf({ west: 'norther' }, { west: { wind: { from: 0, force: 0.5 } } }), 60, 600));
  assert.ok(Math.abs(Math.abs(half) - Math.abs(lean) / 2) < 0.02, `half a wind is half a lean, got ${half} against ${lean}`);
});

test('the kept ground is drawn again when the day turns, and not when the rivers fall a thousandth', () => {
  // This is the whole cost of the weather in the ground (docs/PERFORMANCE_RENDER.md). The high water, the wet earth and
  // the lean live in the kept ground; a key that moved with every tick would redraw the whole country twelve times a
  // second, which is the state the kept ground was built to end.
  const fair = weatherOf({});
  assert.equal(weatherGroundKey(fair), weatherGroundKey(weatherOf({})), 'the same day is the same key');
  assert.notEqual(weatherGroundKey(weatherOf({ west: 'rain' })), weatherGroundKey(fair), 'a day that turns redraws it');
  const wet = weatherOf({ west: 'rain' }, { west: { water: 0.62 } });
  const trickle = weatherOf({ west: 'rain' }, { west: { water: 0.6207 } });
  assert.equal(weatherGroundKey(wet), weatherGroundKey(trickle), 'a river falling a thousandth does not');
  assert.notEqual(weatherGroundKey(wet), weatherGroundKey(weatherOf({ west: 'rain' }, { west: { water: 0.9 } })), 'a river in flood does');
  // `since` is what fades the day in on the page, frame by frame; it must never be in the ground's key.
  assert.equal(weatherGroundKey(weatherOf({ west: 'rain' }, { west: { since: 0 } })), weatherGroundKey(weatherOf({ west: 'rain' }, { west: { since: 900 } })));
});

test('a fair, dry, still day draws nothing at all', () => {
  assert.equal(weatherShown(weatherOf({})), false);
  assert.equal(weatherShown(undefined), false, 'and a class saved before the weather existed draws nothing');
  assert.equal(weatherShown({ regions: {} }), false);
  assert.equal(weatherShown(weatherOf({ east: 'fog' })), true);
  // A fair day after a wet week still has its rivers up, and that is worth drawing.
  assert.equal(weatherShown(weatherOf({}, { middle: { water: 0.8 } })), true);
});

test('a view inside one weather is laid down in one piece; only a view across a boundary is cut up', () => {
  // The cheapness of the whole thing rests here. Falling rain is a pattern, and a pattern cannot be masked by a gradient
  // without compositing a whole screen; so it is laid down once for a view in one weather - which is every student's,
  // four miles across a region a hundred and thirty miles wide - and in spans only for the Host's whole country.
  const weather = weatherOf({ west: 'rain', middle: 'fair', east: 'storm' });
  assert.equal(weatherSpans(weather, 600, 58, 62, 1366).length, 1, "a family's own land is one span");
  assert.equal(weatherSpans(weather, 600, 300, 330, 1366).length, 1, 'so is a view deep inside the east');
  const whole = weatherSpans(weather, 600, 0, 400, 1366);
  assert.ok(whole.length > 1, 'the whole country is cut up');
  assert.ok(whole.at(-1).x + whole.at(-1).width >= 1366, 'and the spans cover the view');
  assert.equal(whole[0].x, 0);
  // Each span carries the weather at its own middle, so the picture goes rain, thinner rain, fair, storm across the map.
  assert.ok(whole[0].mix.rain > 0.9 && whole.at(-1).mix.storm > 0.9);
});

test('the rain is drawn nearer the eye the closer the camera is', () => {
  // It "must read at every zoom - a student watching one family close in, and the Host looking at the whole map"
  // (owner, 2026-09-20). Three bands, so the tiles are built once each and kept.
  assert.equal(zoomBand(2), 0, 'the whole colonies');
  assert.equal(zoomBand(40), 1, 'a county');
  assert.equal(zoomBand(600), 2, "a family's own yard");
  assert.ok(zoomBand(1e6) === zoomBand(600), 'and no band beyond the closest');
});

test('the blend between regions has no crease in it', () => {
  // A straight ramp would make a visible kink at each end of the band; this is the reason for the smooth step.
  for (const [a, b] of [[0, 1], [140 - 9, 140 + 9]]) {
    assert.equal(smoothStep(a, b, a), 0);
    assert.equal(smoothStep(a, b, b), 1);
    assert.ok(Math.abs(smoothStep(a, b, (a + b) / 2) - 0.5) < 1e-9);
    const step = (b - a) / 200;
    // Flat at both ends: the first step in is smaller than a straight line's would be, so nothing creases.
    assert.ok(smoothStep(a, b, a + step) < step / (b - a), 'flat where it begins');
    assert.ok(1 - smoothStep(a, b, b - step) < step / (b - a), 'and flat where it ends');
  }
});

test('the wind a tile is drawn for is the wind that is blowing, to within a step of the compass', () => {
  // The direction is drawn into the tile rather than turned where it is laid down (public/weather-art.js `tileFor`), so
  // a wrong step here would drive the rain sideways and cost nothing visible in any other test. North is step 0.
  assert.equal(windStep({ x: 0, y: 1 }), 0, 'out of the north falls down the screen');
  assert.equal(windStep({ x: 0, y: -1 }), WIND_STEPS / 2, 'and out of the south, up it');
  assert.equal(windStep({ x: 1, y: 0 }), WIND_STEPS / 4, 'a quarter round for a wind across the screen');
  assert.equal(windStep({ x: -1, y: 0 }), WIND_STEPS * 3 / 4);
  // Always a step of the compass, never off the end and never negative: it is a cache key.
  for (let angle = -8; angle < 8; angle += 0.05) {
    const step = windStep({ x: Math.sin(angle), y: Math.cos(angle) });
    assert.ok(Number.isInteger(step) && step >= 0 && step < WIND_STEPS, `${angle} gave ${step}`);
  }
  // And near enough the true angle that nothing falls visibly askew: half a step at most.
  for (let angle = 0; angle < Math.PI * 2; angle += 0.017) {
    const step = windStep({ x: Math.sin(angle), y: Math.cos(angle) });
    const apart = step / WIND_STEPS * Math.PI * 2 - angle;
    const off = Math.abs(Math.atan2(Math.sin(apart), Math.cos(apart)));
    assert.ok(off <= Math.PI / WIND_STEPS + 1e-9, `${angle} is ${off} from step ${step}`);
  }
});
