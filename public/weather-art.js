// The weather, drawn. Owner, 2026-09-20: "Weather should be a visual thing... Players should see the weather. If
// implemented correctly, no text should be required." So there is no weather line, no label and no icon here, and there
// must never be one: everything this file knows it says in paint.
//
// What it draws, and why it is that and not something else, is `docs/WEATHER.md` - the dated record of 1835-36 and the
// model built from it. The five kinds of day are its §10.1 and the water level its §10.4. Three things in the record
// decided the pictures:
//
//   - A norther is the most Texan thing in the weather and it is a WIND, not a cold number. Gray, at San Felipe on
//     25 February 1836: "the wind chopped suddenly round to the north, and there commenced what is familiarly called in
//     this country a norther, by which is always understood a hard and cold blow from the north." Almonte at Béxar has
//     "clear" or "clear and pleasant" on every morning behind one. So: the grass and the trees lean, dust and leaves
//     stream north to south down the screen, the light goes thin and blue - and the sky goes HARD AND CLEAR, not grey.
//     A norther drawn as a grey day would be the popular image rather than the record.
//   - The Alamo siege was cold and clear, not cold and wet (§3.3). `norther` therefore carries no rain of its own.
//   - Fog is scenery and never knowledge. What a family may see is decided on the server (VISION.md, fog of war); a veil
//     on the page that hid a person, a house or a marker would be the client deciding. So the fog is laid down BEFORE
//     the figures, the houses, the markers and the names, and they are drawn at full strength over it.
//
// The contract this draws from is the snapshot's `world.weather`, and it adds nothing to it:
//   { day, bounds: { westOf, eastOf }, regions: { west|centre|east: { kind, water, wind: { from, force }, since } } }
// `kind` is one of `fair` `rain` `norther` `storm` `fog`; `water` is 0 ordinary to 1 in flood; `wind.from` is the bearing
// the wind comes FROM in radians, clockwise from north, so 0 is a norther; `since` is the minute the kind began.
// No weather in the snapshot draws nothing at all, which is the correct empty value for every class saved before it.
//
// How it stays cheap, measured in docs/PERFORMANCE_RENDER.md:
//   - Falling rain and driven dust are ONE pre-rendered tile each, laid as a pattern with a scrolling offset. A frame of
//     rain is one fillRect, not a particle system. The tiles are built once per kind and zoom band and kept.
//   - The wet ground, the cold light and the flat grey are single fills, and where the view straddles two regions they
//     are one linear gradient across the screen rather than three rectangles.
//   - The fog's shape, the high water and the lean on the trees live in the kept ground (public/map-base.js), so they
//     cost nothing on a frame that only moves people. The fog's veil is one drawImage whose alpha is the morning's.

export const KINDS = Object.freeze(['fair', 'rain', 'norther', 'storm', 'fog']);
export const REGIONS = Object.freeze(['west', 'centre', 'east']);

/**
 * How wide the hand-over between two weather regions is, in map miles.
 *
 * "Three different weathers on one map must not look like three rectangles" (owner, 2026-09-20). A region boundary is a
 * line on a map and nothing in the sky, so the country either side of it is mixed over this band: at the line itself the
 * two are half and half. Eighteen miles is about a day's travel and a twentieth of the map's width - wide enough that the
 * Host, looking at four hundred miles, sees rain thin out rather than stop, and narrow enough that a family, looking at
 * four, is in one weather.
 */
export const BLEND_MILES = 18;
/**
 * How long a new kind of day takes to come up, in minutes of 1835. A norther's wind chopped round in an hour - Almonte's
 * "A strong north wind commenced at nine at night" - and rain arrives over a morning. Ninety minutes is the compromise,
 * and it is what `since` is in the contract for.
 * ceiling: one fade for all five kinds. A norther arriving faster than rain is the way out, if the difference is missed.
 */
export const FADE_MINUTES = 90;

const clamp01 = value => Math.max(0, Math.min(1, value));
/** Smooth between 0 and 1 over [edge0, edge1], flat at both ends: the hand-over between regions, with no crease at the line. */
export function smoothStep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * How much of each region's weather is felt at a point `x` miles across the map. The three always sum to 1. Away from
 * both cut lines one region has all of it; at a cut line the two either side have half each.
 */
export function regionWeights(weather, x) {
  const westOf = weather?.bounds?.westOf, eastOf = weather?.bounds?.eastOf;
  if (!Number.isFinite(westOf) || !Number.isFinite(eastOf) || !Number.isFinite(x)) return { west: 0, centre: 1, east: 0 };
  const half = BLEND_MILES / 2;
  // `west` fades out across the first line, `east` fades in across the second, and the centre is whatever is left over.
  const west = 1 - smoothStep(westOf - half, westOf + half, x);
  const east = smoothStep(eastOf - half, eastOf + half, x);
  // Two lines closer together than the blend would overlap and give more than one; share what is left rather than clip.
  const over = west + east;
  if (over > 1) return { west: west / over, centre: 0, east: east / over };
  return { west, centre: 1 - over, east };
}

/** 0 while the kind is still arriving, 1 once it is fully up. Missing `since` (an old class, a written-in day) is fully up. */
export function sinceFade(region, minute) {
  if (!Number.isFinite(region?.since) || !Number.isFinite(minute)) return 1;
  return clamp01((minute - region.since) / FADE_MINUTES);
}

/**
 * How much fog is left at this hour. The record is exact about this and it is the one thing fog does over a morning:
 * Gray at San Felipe, 18 February 1836 - "this morning, like yesterday, was very foggy. Cleared off about 9 o'clock" -
 * and Bowie at Concepción, 28 October 1835, whose "heavy, dense fog" rose about 8 a.m. Full before seven, gone by ten,
 * and nothing in the afternoon.
 */
export const FOG_HOLDS = 7, FOG_GONE = 9.5;
export function fogFade(minute) {
  if (!Number.isFinite(minute)) return 0;
  const hour = ((minute % 1440) + 1440) % 1440 / 60;
  if (hour >= FOG_GONE) return 0;
  if (hour <= FOG_HOLDS) return 1;
  return 1 - smoothStep(FOG_HOLDS, FOG_GONE, hour);
}

/** The screen vector a wind blows along: `from` is the bearing it comes from, clockwise from north, and north is up. */
export function windVector(wind) {
  const from = Number.isFinite(wind?.from) ? wind.from : 0;
  return { x: -Math.sin(from), y: Math.cos(from) };
}

/**
 * Everything the drawing needs at one point of the map, as weights from 0 to 1, with the three regions mixed and each
 * kind faded in from its `since`. Nothing here is a kind: a point between a raining region and a fair one is part rain,
 * which is what keeps the boundary from being a rectangle.
 *
 * `rain` and `storm` are how hard it is falling; `norther` how hard it blows; `fog` how thick the veil is before the
 * drawing thins it for the hour; `water` how high the rivers run; `wind` the screen vector to drive things along, its
 * length the force; `flat` how far the light has gone flat and grey; `cold` how far it has gone thin and blue.
 */
export function weatherMix(weather, x, minute, { fade = true } = {}) {
  const mix = { rain: 0, storm: 0, norther: 0, fog: 0, water: 0, wind: { x: 0, y: 0 }, flat: 0, cold: 0 };
  if (!weather?.regions) return mix;
  const weights = regionWeights(weather, x);
  for (const name of REGIONS) {
    const weight = weights[name], region = weather.regions[name];
    if (!(weight > 0) || !region) continue;
    // The water level is the state of the rivers, not of the sky: it is already days old by the time it matters and it
    // does not fade in with today's kind.
    mix.water += weight * clamp01(region.water || 0);
    // `fade: false` is for anything drawn into the KEPT ground, which is redrawn only when `weatherGroundKey` moves and
    // that key deliberately leaves `since` out. A fade in the ground would be drawn once, at the strength of the one
    // frame that drew it, and then stand there stale for the rest of the day - which is exactly what the ground audit
    // caught on 2026-09-20 (`window.__groundAudit`, scripts/farm-browser-proof.mjs), a whole-screen difference falling
    // tick by tick as the day came up. What fades is drawn on the page's own canvas, every frame.
    const up = weight * (fade ? sinceFade(region, minute) : 1);
    if (!(up > 0)) continue;
    const force = clamp01(region.wind?.force ?? (region.kind === 'norther' ? 1 : 0));
    const vector = windVector(region.wind);
    mix.wind.x += vector.x * force * up; mix.wind.y += vector.y * force * up;
    if (region.kind === 'rain') { mix.rain += up; mix.flat += up; }
    else if (region.kind === 'storm') { mix.storm += up; mix.rain += up; mix.flat += up; }
    else if (region.kind === 'norther') {
      mix.norther += up; mix.cold += up;
      // A norther's first day may carry its rain with it, and the record has one: 20 November 1835 at Béxar, Maverick's
      // "Thermometer 42° with rain and wind" (sim/weather.mjs `wet`, `FIC-GONZ-132`). Drawn as both at once - the driven
      // dust and the lean, with rain falling through them and the light half out - because that is what it was. Every
      // other day of a norther is clear, which is the record's own insistence (§3.3).
      if (region.wet) { mix.rain += up * 0.8; mix.flat += up * 0.55; }
    } else if (region.kind === 'fog') mix.fog += up;
  }
  return mix;
}

/**
 * How far a tree or a tuft leans, as the shear a drawing applies about its own base: 0 upright, positive leaning the way
 * the wind blows. Only the across-the-screen part of the wind bends anything - a wind blowing straight down the screen
 * out of the north is coming at the viewer and leans nothing sideways - so a norther, which is exactly that, is given
 * the lean its force earns anyway, out of the north and towards the reader.
 *
 * ceiling: one lean for the whole view, fixed while the ground is kept, so the trees hold a steady bend rather than
 * working in the gusts. Swaying trees drawn on each frame over the kept ground is the way out (public/app.js's own
 * ceiling on the oaks' wind says the same).
 */
export const MAX_LEAN = 0.44;
// The shear is now the LESSER wind's alone. Astra's gale poses landed on 2026-09-21
// (docs/ART_DELIVERY_2026-09-21-WEATHER-NORTHER.md) and a hard norther is drawn with them instead (`galePose` below); a
// storm, a rainy blow and the light air of a fair day still bend the library's own upright sprite about its foot, which
// is what the stand-in proved a wind has to do to be seen at all.
export function windLean(mix) {
  const force = Math.hypot(mix.wind.x, mix.wind.y);
  if (!(force > 0.02)) return 0;
  // Sideways where there is a sideways component; otherwise - and a norther is exactly that, blowing straight into the
  // page - a lean off to the right anyway. A tree on this map is drawn as an upright figure seen from the side, so a
  // lean across the page is the only bend that can read at all, and a norther that bent nothing would be a norther a
  // student could not see. `ceiling:` the lean is across the page where the wind is into it; a canopy pressed down and
  // foreshortened would be truer, and wants tree art drawn from above.
  const across = Math.abs(mix.wind.x) > 0.12 ? mix.wind.x : (mix.wind.y > 0 ? 0.85 : -0.85);
  return clamp01(force) * MAX_LEAN * Math.max(-1, Math.min(1, across));
}

/**
 * The painted gale, and where it takes over from the shear.
 *
 * Astra delivered five silhouettes of the country in a hard north wind on 2026-09-21: three trees driven over, a
 * flattened grass tuft and low streaming smoke (docs/ART_DELIVERY_2026-09-21-WEATHER-NORTHER.md). They are painted at one
 * strength - a gale, not a range of winds - so they are used where the wind IS that, and nowhere else. The delivery note
 * is explicit about it: "the renderer to choose the authored gale pose while continuing to derive local wind strength and
 * residual motion from simulation state."
 *
 * `galeForce` is the smaller of two things, and both have to be true for a pose that was painted for a norther:
 *   - how far the norther has arrived at this point (`mix.norther`, which is the region's weight times its fade, so a
 *     day coming up over an hour and a half comes up in the trees too, and a point half-way across the eighteen-mile
 *     blend counts half);
 *   - how hard the wind is blowing there (the mix's own vector, which a storm can raise as high as 0.7).
 * A storm is therefore never a gale, however hard it blows, because no norther is arriving: a tree driven flat under a
 * black sky and falling rain would be the wrong picture, and the lean the storm already gets is the right one.
 *
 * `GALE` sits below the 0.7 the east of the country blows in a norther (sim/weather.mjs: 1 in the west and centre, 0.7
 * in the east) and above what half a blend or half a fade can reach, so the whole of a norther's country takes the pose
 * and its edges hand back to the shear. The number is the game's own: `FIC-GONZ-201`.
 */
export const GALE = 0.62;
export function galeForce(mix) {
  return Math.min(clamp01(mix?.norther || 0), Math.hypot(mix?.wind?.x || 0, mix?.wind?.y || 0));
}
export function inGale(mix) { return galeForce(mix) >= GALE; }
/**
 * The authored pose for an upright sprite: only the four the delivery painted. Anything else the map scatters - a pine, a
 * cedar, a mesquite, prickly pear, reeds, and every sized tree of `trees-colonies-1` and `-2` - has no gale pose and
 * keeps the shear at every strength of wind.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-20 - the country in a norther. A pine in a hard norther is still the
 * library's own upright pine sheared about its foot. More gale silhouettes replace it, one sprite at a time.
 *
 * The names collide with four one-frame `*-wind` CLIPS that predate the delivery and hold the upright sprite swaying
 * (public/assets/frontier-v1/animation.json). Frames and clips are separate tables in public/art.js, so `drawSprite`
 * takes the painted gale and `drawClip` the old sway; every caller here means the frame.
 */
export const GALE_POSES = Object.freeze({
  // `weather-norther`, 2026-09-21.
  'oak-broad': 'oak-broad-wind',
  'oak-spreading': 'oak-spreading-wind',
  pecan: 'pecan-wind',
  'grass-tuft': 'grass-tuft-wind',
  // `biome-ground-bexar` the same day carried two more of exactly the same kind - "two cane clumps and a wind pose, tall
  // prairie grass and a wind pose" - so the canebrake and the tallgrass prairie go over in a norther with everything else.
  'grass-tall': 'grass-tall-wind',
  'cane-1': 'cane-wind',
  'cane-2': 'cane-wind',
});
/** The gale pose to draw this sprite as, or null to draw it upright and sheared by `windLean`. */
export function galePose(sprite, mix) {
  return inGale(mix) ? (GALE_POSES[sprite] || null) : null;
}
/** The smoke of a fire in a hard norther: lying flat and streaming, rather than rising. */
export const GALE_SMOKE = 'smoke-streaming';

/**
 * What of the weather is drawn into the kept ground, as one string: the high water on the rivers, the lean on the trees
 * and the fog's shape. The ground is drawn again when this changes (public/map-base.js `groundInputs`), so a day that
 * turns redraws it once and a day that holds costs nothing.
 *
 * Quantised deliberately. `water` falls about 0.15 a day and would otherwise redraw the whole country on every tick that
 * moved it a thousandth; a tenth is finer than the picture can show.
 */
export function weatherGroundKey(weather) {
  if (!weather?.regions) return '';
  const step = value => Math.round(clamp01(value || 0) * 10);
  return [
    Math.round(weather.bounds?.westOf ?? 0), Math.round(weather.bounds?.eastOf ?? 0),
    ...REGIONS.map(name => {
      const region = weather.regions[name];
      if (!region) return '-';
      return `${region.kind || 'fair'}:${step(region.water)}:${step(region.wind?.force)}:${Math.round((region.wind?.from ?? 0) * 8)}`;
    }),
  ].join('|');
}

/** Whether there is anything at all to draw: a fair, dry day is not drawn, and costs nothing. */
export function weatherShown(weather) {
  if (!weather?.regions) return false;
  return REGIONS.some(name => {
    const region = weather.regions[name];
    return region && (region.kind !== 'fair' || (region.water || 0) > WATER_HIGH * 0.75 || (region.wind?.force || 0) > 0.2);
  });
}

/**
 * The view cut into spans across the screen, each with the weather at its middle. One span wherever the view is in one
 * weather - which is every student's view, a few miles across a region a hundred and thirty miles wide - and up to
 * `most` where it straddles a boundary, which is the Host looking at the whole country. This is what keeps a pattern
 * that cannot be masked cheaply from costing a full-screen composite: it is laid down once, not per pixel.
 */
export function weatherSpans(weather, minute, leftMiles, rightMiles, width, most = 12, options) {
  const left = weatherMix(weather, leftMiles, minute, options), right = weatherMix(weather, rightMiles, minute, options);
  const same = ['rain', 'storm', 'norther', 'fog', 'water', 'flat', 'cold'].every(key => Math.abs(left[key] - right[key]) < 0.02)
    && Math.abs(left.wind.x - right.wind.x) < 0.05 && Math.abs(left.wind.y - right.wind.y) < 0.05;
  if (same) return [{ x: 0, width, mix: left }];
  const spans = [];
  for (let i = 0; i < most; i++) {
    const at = leftMiles + (rightMiles - leftMiles) * ((i + 0.5) / most);
    spans.push({ x: width * i / most, width: width / most + 1, mix: weatherMix(weather, at, minute, options) });
  }
  return spans;
}

// ------------------------------------------------------------------------------------------------ the tiles
//
// Rain, and the dust a norther drives, are pre-rendered once into a small square and laid down as a repeating pattern
// with an offset that scrolls. A full screen of rain is then one fillRect a frame instead of a thousand strokes, which
// is the difference between this being affordable on a school Chromebook and not (docs/PERFORMANCE_RENDER.md).
//
// Each streak is drawn nine times, once in each neighbouring copy of the tile, so one crossing an edge comes back in on
// the other side and the tile joins itself seamlessly however far it has scrolled.

// How big one tile of falling weather is. It was 128, and at a county's zoom a norther's dozen leaves repeated visibly
// across the screen as wallpaper (seen 2026-09-20). Bigger costs nothing a frame - the fill is the same - only a little
// more to build each tile once and a little more memory; each depth is also rolled from its own salt below, so the three
// layers never line up into one pattern.
const TILE = 192;
const tiles = new Map();
/** A number in [0, 1) fixed by two integers: the tiles are the same every time they are built. */
const roll = (n, salt) => {
  let v = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35);
  v = Math.imul(v ^ (v >>> 13), 0x27d4eb2f);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
};

/**
 * How near the falling rain is drawn, as a band of the zoom: a student watching one family from a few rods sees long,
 * fat, fast streaks close to their eye; the Host looking at four hundred miles sees fine ones. Three bands rather than a
 * continuous size, so the tiles are built once each and kept.
 */
export function zoomBand(scale) { return scale >= 160 ? 2 : scale >= 12 ? 1 : 0; }

/**
 * How much harder the LIGHT has to work the further back the camera is.
 *
 * Falling rain is drawn in the air, at a size the eye can see, and from four hundred miles away there is no size at
 * which a raindrop reads: the Host's map showed a faint scatter of specks and almost no weather at all (seen
 * 2026-09-20). What does read from that far is what a rain cloud does to the country under it - the colour out of it,
 * the ground darker, the rivers brown - so the washes are laid on harder as the camera pulls back and settle to their
 * own strength by the time a county fills the screen.
 */
export const farEmphasis = scale => 1 + 0.6 * (1 - smoothStep(4, 44, scale || 0));

/** How many ways the wind may be baked into a tile: a norther and a squall are different tiles, a degree of wind is not. */
export const WIND_STEPS = 16;
export function windStep(wind) {
  const angle = Math.atan2(wind.x, wind.y);
  return ((Math.round(angle / (Math.PI * 2) * WIND_STEPS) % WIND_STEPS) + WIND_STEPS) % WIND_STEPS;
}
/**
 * One tile of falling weather, with the wind's direction and the layer's depth ALREADY DRAWN INTO IT.
 *
 * Why baked, rather than turned where it is laid down: a pattern carrying a rotation and a scale cannot be tiled by the
 * fast path, and three full-screen fills of one a frame cost more than everything else on the map put together -
 * measured 2026-09-20, a storm over Gonzales took the frame from 14 ms to 64 and the drawing loop fell to six frames a
 * second. Baked, the fill is a plain repeat at a whole-pixel offset, which is the path a browser is quick at. The cost
 * is a handful more small pictures, built once each: a day has one wind, so a class builds three or six of these.
 */
const TILE_CAP = 48;
function tileFor(kind, band, dir, spread) {
  const key = `${kind}:${band}:${dir}:${spread}`;
  const kept = tiles.get(key);
  if (kept) { tiles.delete(key); tiles.set(key, kept); return kept; }
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
  if (!canvas) return null;
  canvas.width = TILE; canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  // The way the wind drives, on the screen. Everything below is drawn along it.
  const angle = dir / WIND_STEPS * Math.PI * 2;
  const vx = Math.sin(angle), vy = Math.cos(angle);
  // Across the wind, for the curve of a whipped leaf.
  const ax = -vy, ay = vx;
  // A layer further off is drawn smaller and sparser in its own tile, instead of by scaling the pattern.
  const size = [1, 0.62, 0.4][spread] ?? 1, thin = [1, 0.8, 0.62][spread] ?? 1;
  // Each depth rolled from its own salt, so three layers of the same weather are three different scatters rather than
  // one pattern laid three times at three offsets.
  const salt = spread * 37;
  const streak = (x, y, length, drift, curved) => {
    // Nine copies, one into each neighbouring tile, so a streak crossing an edge comes back in on the other side and
    // the tile joins itself however far it has scrolled.
    const reach = length + Math.abs(drift) + 4;
    for (let wy = -1; wy <= 1; wy++) for (let wx = -1; wx <= 1; wx++) {
      const px = x + wx * TILE, py = y + wy * TILE;
      if (px < -reach || px > TILE + reach || py < -reach || py > TILE + reach) continue;
      ctx.beginPath(); ctx.moveTo(px, py);
      if (curved) ctx.quadraticCurveTo(px + vx * length * 0.6 + ax * drift, py + vy * length * 0.6 + ay * drift, px + vx * length + ax * drift * 0.4, py + vy * length + ay * drift * 0.4);
      else ctx.lineTo(px + vx * length, py + vy * length);
      ctx.stroke();
    }
  };
  ctx.lineCap = 'round';
  if (kind === 'rain' || kind === 'storm') {
    const count = Math.round((kind === 'storm' ? 92 : 56) * thin);
    const long = [5, 9, 15][band] * (kind === 'storm' ? 1.45 : 1) * size;
    const wide = [0.7, 0.9, 1.3][band] * (kind === 'storm' ? 1.3 : 1) * Math.max(0.55, size);
    for (let i = 0; i < count; i++) {
      // A drop near the front of the eye is brighter and longer than one further off; the mix of the two is what makes
      // a flat pattern read as falling through depth.
      const near = roll(i, 4 + salt);
      ctx.strokeStyle = near > 0.72 ? 'rgba(226,238,246,.85)' : near > 0.4 ? 'rgba(206,222,234,.55)' : 'rgba(186,204,218,.34)';
      ctx.lineWidth = wide * (0.6 + near * 0.9);
      streak(roll(i, 1 + salt) * TILE, roll(i, 2 + salt) * TILE, long * (0.6 + roll(i, 3 + salt) * 0.8), 0, false);
    }
  } else if (kind === 'norther') {
    // Not rain: a norther's sky is clear (Almonte, every morning of the siege). What streams is what the wind has
    // picked up off the prairie - dust, and the last of the leaves - so these are long, dry, brown-grey commas, not
    // drops. Sparse on purpose: drawn as thick as rain it read as sleet, and the one thing the record will not have is
    // a norther that looks wet (seen 2026-09-20). What carries it is the lean on the country and a few things going
    // past fast, not a curtain.
    const count = Math.max(5, Math.round([13, 17, 22][band] * thin));
    const long = [9, 16, 26][band] * size;
    for (let i = 0; i < count; i++) {
      const leaf = roll(i, 14 + salt) > 0.5;
      ctx.strokeStyle = leaf ? 'rgba(146,108,49,.82)' : 'rgba(203,180,133,.58)';
      ctx.lineWidth = Math.max(0.6, (leaf ? [1.2, 2, 3.2][band] : [0.9, 1.3, 2][band]) * Math.max(0.6, size));
      const length = long * (0.5 + roll(i, 13 + salt) * 1.1);
      streak(roll(i, 11 + salt) * TILE, roll(i, 12 + salt) * TILE, length, (roll(i, 15 + salt) - 0.5) * length * 0.9, true);
    }
  }
  const made = { canvas, pattern: ctx.createPattern(canvas, 'repeat'), vx, vy };
  tiles.set(key, made);
  // A class only ever has a handful of these; the cap is against a run that walks every wind and every zoom.
  if (tiles.size > TILE_CAP) tiles.delete(tiles.keys().next().value);
  return made;
}
/** Every tile built so far, for a proof to count: the whole falling weather is this many small pictures and no more. */
export function tilesBuilt() { return [...tiles.keys()]; }

/**
 * One layer of falling weather, laid down over a span of the screen. `alpha` is how hard it falls, `speed` how fast it
 * scrolls in pixels a second, `wind` which way, and `spread` which of the three depths it is.
 *
 * One fillRect with a plain repeating pattern at a whole-pixel offset. The wind and the size are in the tile, so
 * nothing here rotates or scales anything (`tileFor`).
 */
function layFalling(ctx, kind, band, span, { alpha, speed, wind, time, spread = 0 }) {
  if (!(alpha > 0.01)) return 0;
  const tile = tileFor(kind, band, windStep(wind), spread);
  if (!tile?.pattern) return 0;
  // Slid along the wind by the clock, wrapped to the tile so the offset stays small and the pattern stays seamless.
  const travel = (time / 1000) * speed;
  const dx = Math.round(tile.vx * travel) % TILE, dy = Math.round(tile.vy * travel) % TILE;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * alpha;
  ctx.translate(dx, dy);
  ctx.fillStyle = tile.pattern;
  ctx.fillRect(span.x - dx, -dy, span.width, ctx.canvas.height);
  ctx.translate(-dx, -dy);
  ctx.globalAlpha = was;
  return 1;
}

/**
 * A flat wash across the whole view, its strength read from each span's own weather.
 *
 * One fill for a view in one weather. Across a boundary it is still one fill, as a gradient with a stop at each span
 * rather than a rectangle each: the wet ground under a rain cloud is a wash of some strength everywhere, and filling the
 * spans one at a time left twelve visible vertical seams down the Host's map (seen 2026-09-20, the first shots).
 */
export function washAcross(ctx, spans, [r, g, b], alphaOf) {
  const height = ctx.canvas.height, width = ctx.canvas.width;
  if (spans.length === 1) {
    const alpha = alphaOf(spans[0].mix);
    if (!(alpha > 0.004)) return 0;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(spans[0].x, 0, spans[0].width, height);
    return 1;
  }
  let most = 0;
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  spans.forEach((span, i) => {
    const alpha = Math.max(0, alphaOf(span.mix));
    most = Math.max(most, alpha);
    // A stop at each span's middle, and the first and last carried out to the edges of the view.
    if (i === 0) gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
    gradient.addColorStop(Math.min(1, (span.x + span.width / 2) / width), `rgba(${r},${g},${b},${alpha})`);
    if (i === spans.length - 1) gradient.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);
  });
  if (!(most > 0.004)) return 0;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return 1;
}

// ------------------------------------------------------------------------------------------------ what is drawn, and where
//
// Three passes, in the order the page draws them, and the order matters:
//
//   1. `drawWeatherGround` goes into the KEPT ground, under everything: the high water on the rivers and the wet, dark
//      earth under rain. It costs nothing on a frame that only moves people.
//   2. `drawWeatherVeil` goes on the page's own canvas after the ground and BEFORE the figures, the houses, the markers
//      and the names: the fog, and the shadow a rain cloud lays on the country. Nothing a student is entitled to see is
//      ever under it.
//   3. `drawWeatherAir` goes over everything: the rain itself falling in front of the reader, the dust a norther drives,
//      the lightning of a distant storm, and the colour the light has gone.

/**
 * The high water, into the kept ground. `courses` are the water courses already drawn, in screen points with the width
 * each was drawn at; `waterAt(point)` gives the level there, 0 to 1.
 *
 * docs/WEATHER.md §10.4: the rivers rise when it rains and fall back over days, and that is what makes a ford hard and a
 * wagon bog. Drawn as three things a reader can tell apart without a word: the low ground along the bank darkened and
 * wet, because Gray's approach to the Trinity was "a boggy, miry, nasty prairie... subject to overflow when the river is
 * high"; the channel itself run fuller, over its own banks; and the water gone brown, because a river in flood carries
 * the country down with it - Harris on the Trinity, "Drift wood covered the water as far as we could see".
 */
export const WATER_HIGH = 0.3, WATER_SHUT = 0.85;
export function drawHighWater(ctx, courses, waterAt) {
  let drawn = 0, shut = 0;
  for (const course of courses) {
    const water = waterAt(course);
    if (!(water > WATER_HIGH * 0.75)) continue;
    const rise = smoothStep(WATER_HIGH * 0.75, 1, water);
    // Past WATER_SHUT the ford is not to be crossed at all (sim/weather.mjs), and that is the one level of the river a
    // student has to be able to read at a glance, because it is the one that stops them. Over its banks: the channel
    // doubled, the bottoms flooded out to twice again, and drift on the water.
    const over = smoothStep(WATER_SHUT - 0.08, Math.min(1, WATER_SHUT + 0.1), water);
    const points = course.points;
    if (!(points?.length > 1)) continue;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = () => { ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };
    const was = ctx.globalAlpha;
    // The bottoms: a wide, soft, dark band of soaked ground either side of the channel, and wider again once the river
    // is out of them - Gray's approach to the Trinity, "a boggy, miry, nasty prairie... subject to overflow".
    ctx.globalAlpha = was * (0.3 + 0.22 * over) * rise;
    ctx.strokeStyle = '#5c6446'; ctx.lineWidth = course.width * (2.2 + rise * 2.6 + over * 5);
    line(); ctx.stroke();
    // The water itself, run fuller and gone brown with what it is carrying. Wider than the channel was drawn, always:
    // a stroke narrower than the water left a blue core showing through a river in flood (seen 2026-09-20).
    ctx.globalAlpha = was * (0.55 + 0.4 * rise);
    ctx.strokeStyle = '#8a7444'; ctx.lineWidth = course.width * (1.3 + rise * 0.6 + over * 1.9);
    line(); ctx.stroke();
    ctx.globalAlpha = was * 0.45 * rise;
    ctx.strokeStyle = '#a78d53'; ctx.lineWidth = course.width * (0.7 + rise * 0.35 + over * 1.1);
    line(); ctx.stroke();
    // Drift, once it is over: Harris on the Trinity, "Drift wood covered the water as far as we could see." Dashes on
    // the water, laid along it, which cost one more stroke and are what says a river is carrying the country away.
    if (over > 0.05) {
      const wide = course.width * (1 + over * 1.6);
      ctx.globalAlpha = was * 0.5 * over;
      ctx.strokeStyle = '#6b5530'; ctx.lineWidth = Math.max(1, wide * 0.13);
      ctx.setLineDash([Math.max(3, wide * 0.6), Math.max(6, wide * 1.7)]);
      line(); ctx.stroke();
      ctx.setLineDash([]);
      shut++;
    }
    ctx.globalAlpha = was;
    drawn++;
  }
  return { drawn, shut };
}

/**
 * The wet earth, into the kept ground: rain darkens the ground it falls on, and a country under a rain cloud is a
 * different colour from one in the sun. Laid as a multiply so the grass, the roads and the fields all darken together
 * and keep their own colours, rather than being greyed out under a flat sheet.
 */
export const WET = Object.freeze([150, 163, 174]);
export function drawWetGround(ctx, spans, emphasis = 1) {
  if (!spans.some(span => span.mix.rain > 0.02 || span.mix.storm > 0.02)) return 0;
  const was = ctx.globalCompositeOperation, alpha = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1;
  const drawn = washAcross(ctx, spans, WET, mix => Math.min(0.55, 0.34 * emphasis) * clamp01(mix.rain * 0.7 + mix.storm * 0.3));
  ctx.globalCompositeOperation = was; ctx.globalAlpha = alpha;
  return drawn;
}

/**
 * The fog's own shape, into the kept ground's companion layer: a low veil that lies in the bottoms and along the water,
 * thickest on the river and thinning as the land rises away from it. `courses` are the water courses in screen points.
 *
 * `spans` here must be the FADE-FREE ones (`weatherMix(..., { fade: false })`), because this is baked with the kept
 * ground: the hour's own thinning is applied when the layer is laid down (`drawWeatherVeil`), every frame.
 *
 * Maverick, at Béxar on 6 November 1835, says where fog comes from and it is not the sky: "A great fog this morning,
 * arising by evaporation from the river (spring water)." So it is drawn from the rivers outward. A view with no water in
 * it still gets a thin general haze, because a fog on the bottoms is still in the air on the prairie above them.
 */
export function drawFogShape(ctx, canvas, spans, courses) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const strength = spans.reduce((most, span) => Math.max(most, span.mix.fog), 0);
  if (!(strength > 0.02)) return 0;
  // The general haze first, across the view, so a region that is not in fog has none of it and the two meet smoothly.
  washAcross(ctx, spans, [232, 238, 240], mix => 0.46 * mix.fog);
  // Then the bottoms, banked along the water. Wide soft strokes, brightest at the channel.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let drawn = 0;
  for (const course of courses) {
    const points = course.points;
    if (!(points?.length > 1)) continue;
    const line = () => { ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };
    // Banked in three passes rather than a blur: a blur of a whole screen is the one thing here that could not be
    // afforded, and three widening strokes at falling opacity read the same at every zoom.
    for (const [spread, alpha] of [[9, 0.16], [5, 0.2], [2.2, 0.3]]) {
      ctx.globalAlpha = alpha * strength;
      ctx.strokeStyle = '#eef3f4';
      ctx.lineWidth = Math.max(10, course.width * spread);
      line(); ctx.stroke();
    }
    drawn++;
  }
  ctx.globalAlpha = 1;
  return drawn;
}

/**
 * The veil, on the page's own canvas, between the ground and the people: the fog laid down at the strength the hour
 * leaves it, and the shadow a rain cloud puts on the country.
 *
 * `fog` is the layer `drawFogShape` filled. Everything a student may act on - a person, a house, a marker, a name - is
 * drawn after this and at full strength, so the fog is scenery and never hides a fact (VISION.md, fog of war is the
 * server's).
 */
export const FOG_CEILING = 0.55;
export function drawWeatherVeil(ctx, spans, fog, minute, emphasis = 1) {
  const hour = fogFade(minute);
  if (fog && hour > 0.01) {
    const was = ctx.globalAlpha;
    // Capped well below opaque, and under the figures besides: at its very thickest the ground is still read through it.
    ctx.globalAlpha = was * FOG_CEILING * hour;
    ctx.drawImage(fog, 0, 0);
    ctx.globalAlpha = was;
  }
  // A rain cloud's shadow: the light gone flat, the colour out of the country. Under the figures, so a person in the rain
  // is still a person and not a silhouette.
  washAcross(ctx, spans, [93, 106, 114], mix => (0.19 * mix.flat + 0.15 * mix.storm) * emphasis);
}

/**
 * The air, over everything: what is actually falling or being blown past the reader, and the colour the light has gone.
 *
 * `time` is the page's animation clock in milliseconds; `still` is a reader who has asked for reduced motion, for whom
 * the rain hangs rather than falls and the lightning never flashes.
 */
export function drawWeatherAir(ctx, spans, { time = 0, scale = 1, still = false } = {}) {
  const band = zoomBand(scale), emphasis = farEmphasis(scale);
  let layers = 0;
  for (const span of spans) {
    const mix = span.mix;
    // Falling rain. Two layers at different speeds and sizes - the near one bright and quick, the far one fine and slow -
    // because one layer of one speed reads as a moving texture and two read as depth. It must carry at every zoom, so the
    // tile is chosen by the zoom band and the near layer is spread wider as the camera comes in.
    const rain = clamp01(mix.rain), storm = clamp01(mix.storm);
    // A storm's rain is the heavier tile; ordinary rain the lighter. A region between the two gets both, which is what
    // makes the boundary a gradient rather than a line.
    const wind = Math.hypot(mix.wind.x, mix.wind.y) > 0.05 ? mix.wind : { x: 0.22, y: 1 };
    if (rain > 0.02) {
      layers += layFalling(ctx, 'rain', band, span, { alpha: 0.5 * rain, speed: still ? 0 : 520 + band * 260, wind, time, spread: 0 });
      layers += layFalling(ctx, 'rain', band, span, { alpha: 0.34 * rain, speed: still ? 0 : 360 + band * 180, wind, time: time * 1.31 + 3100, spread: 1 });
    }
    if (storm > 0.02) {
      layers += layFalling(ctx, 'storm', band, span, { alpha: 0.5 * storm, speed: still ? 0 : 1150 + band * 520, wind, time, spread: 0 });
    }
    // A norther: dust and the last leaves driven past, north to south, hard. No rain - the sky behind a norther is clear,
    // so this and the lean on the trees are the whole of it and they have to carry it. Three layers, the far one spread
    // wide and slow and the near one small and quick, which is what makes a flat pattern read as a country full of
    // blowing dust rather than a texture sliding over the map.
    if (mix.norther > 0.02) {
      layers += layFalling(ctx, 'norther', band, span, { alpha: 0.95 * mix.norther, speed: still ? 0 : 1150 + band * 520, wind, time, spread: 0 });
      layers += layFalling(ctx, 'norther', band, span, { alpha: 0.72 * mix.norther, speed: still ? 0 : 700 + band * 320, wind, time: time * 1.27 + 1700, spread: 1 });
      layers += layFalling(ctx, 'norther', band, span, { alpha: 0.5 * mix.norther, speed: still ? 0 : 400 + band * 200, wind, time: time * 0.81 + 5300, spread: 2 });
    }
  }
  // The colour of the light, last, over what falls through it, and across the whole view in one fill so two regions'
  // light meets without a seam.
  //  - rain and storm: flat and grey, the colour drained out.
  //  - a norther: thin and blue, and CLEAR. A little brightness with it, because the air behind a front is hard and
  //    bright, not gloomy - which is the whole difference between a norther and a wet day, and the record insists on it.
  layers += washAcross(ctx, spans, [120, 134, 146], mix => (0.1 * mix.flat + 0.13 * mix.storm) * emphasis);
  // The cold light takes only a little of the far emphasis, and the brightening none of it. What thickens with distance
  // is CLOUD - a rain cloud's shadow on four hundred miles of country is a real thing to see - and a norther has none:
  // bleaching the whole country for one made the Host's map look fogged, which is the opposite of what the record says a
  // norther's sky is (seen 2026-09-20).
  layers += washAcross(ctx, spans, [122, 160, 206], mix => 0.18 * mix.cold * (1 + (emphasis - 1) * 0.35));
  // The brightening behind a front, and the blend only where there is one to draw: setting a composite other than
  // source-over on a canvas costs even when the fill that follows is empty, and a rain day has no cold light in it.
  if (spans.some(span => span.mix.cold > 0.02)) {
    const blend = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'screen';
    layers += washAcross(ctx, spans, [223, 234, 246], mix => 0.19 * mix.cold);
    ctx.globalCompositeOperation = blend;
  }
  drawLightning(ctx, spans, time, still);
  return layers;
}

/**
 * Lightning, seen at a distance rather than overhead (owner, 2026-09-20). The one dated severe storm of the period is
 * Gray's, on the night of 29 February - 1 March 1836 at Washington-on-the-Brazos: the wind "blew a gale, accompanied by
 * lightning, thunder, rain and hail". A distant storm is a sheet lighting the far sky, not a bolt on the map, so this
 * is a brief brightening banked at the top of the view with a faint fork inside it, and never a strike among the people.
 *
 * Deterministic from the clock, brief, capped low, and off entirely for a reader who asked for reduced motion.
 */
const FLASH_EVERY_MS = 7400, FLASH_MS = 190;
export function flashAt(time) {
  const phase = ((time % FLASH_EVERY_MS) + FLASH_EVERY_MS) % FLASH_EVERY_MS;
  if (phase > FLASH_MS) return 0;
  // Two beats to a flash, as real sheet lightning goes: bright, nearly out, bright again, gone.
  const t = phase / FLASH_MS;
  return Math.max(0, Math.sin(t * Math.PI * 2.4) * (1 - t));
}
function drawLightning(ctx, spans, time, still) {
  if (still) return 0;
  const flash = flashAt(time);
  if (!(flash > 0.02)) return 0;
  const strongest = spans.reduce((most, span) => (span.mix.storm > (most?.mix.storm ?? 0) ? span : most), null);
  if (!strongest || !(strongest.mix.storm > 0.2)) return 0;
  const height = ctx.canvas.height, strength = flash * strongest.mix.storm;
  const was = ctx.globalAlpha, blend = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';
  // The far sky lit: a band across the top of the view, fading down into the country.
  const glow = ctx.createLinearGradient(0, 0, 0, height * 0.42);
  glow.addColorStop(0, 'rgba(226,236,250,.9)'); glow.addColorStop(1, 'rgba(226,236,250,0)');
  ctx.globalAlpha = was * 0.3 * strength;
  ctx.fillStyle = glow;
  ctx.fillRect(strongest.x, 0, strongest.width, height * 0.42);
  // One faint fork inside it, well up in the sky and never reaching the ground.
  const seed = Math.floor(time / FLASH_EVERY_MS);
  const x = strongest.x + strongest.width * (0.2 + roll(seed, 21) * 0.6);
  ctx.globalAlpha = was * 0.5 * strength;
  ctx.strokeStyle = 'rgba(240,246,255,.95)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, 0);
  let at = x;
  for (let i = 1; i <= 4; i++) { at += (roll(seed, 21 + i) - 0.5) * 40; ctx.lineTo(at, height * 0.07 * i); }
  ctx.stroke();
  ctx.globalAlpha = was; ctx.globalCompositeOperation = blend;
  return 1;
}
