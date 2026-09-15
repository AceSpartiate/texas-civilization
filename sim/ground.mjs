// The going: how the real land slows people, horses and the wagon, where a lane runs, and what a house site is like.
//
// docs/LAND_GRANTS.md §8.2–8.3 steps 3–4, docs/COLONIES.md §6 item 3. Only a class on the real land of the colonies
// (`map.source`) has any of this; the invented Gonzales country and every class saved before travel exactly as they did.
//
// What is measured: heights (USGS 3DEP) and watercourses with whether USGS calls them perennial or intermittent today
// (NHD), read through sim/terrain-data.mjs. What is borrowed: the shape of walking speed against slope, Tobler's hiking
// function (1993), which is a modern empirical rule and not a description of 1835. Everything else here is invented
// (`FIC-GONZ-026`): what timber and brush and a creek cost, where the timber stands, how much harder the wagon finds a
// hill, how far is too far to carry water, and every refusal's threshold.
import { realTerrain } from './terrain-data.mjs';
import { BARRIER_RIVERS } from './colonies-map.mjs';
import { patchAt, patchCover, timberMilesFrom } from './woods.mjs';

const METRES_PER_MILE = 1609.344;
const FEET_PER_METRE = 3.28084;
const round = (value, places = 2) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Whether a world's map is the real land, which is the only land that has going. */
export const onRealLand = world => world?.map?.source === 'texas-colonies-map';

/** How far apart the ground along a route is read, in miles. */
export const SAMPLE_MILES = 1 / 16;
/**
 * Timber stands along the rivers this far out, and along a running creek this far (HIST-GONZ-012; the widths FIC-GONZ-026):
 * the rule of a class on the real land saved before the woods grid (`rule` 'rivers'). A class made since reads its timber
 * from the woods (sim/woods.mjs, `rule` 'landfire').
 */
export const TIMBER_FROM_RIVER = 0.9;
export const TIMBER_FROM_CREEK = 0.2;
/** Ground steeper than this, rise over run, is broken and grown up in brush (FIC-GONZ-026). */
export const BRUSH_GRADE = 0.08;
/** How many times as long a mile of timber or brush takes as a mile of open ground, by way of going (FIC-GONZ-026). */
export const COVER_PACE = Object.freeze({
  foot: Object.freeze({ open: 1, timber: 1.3, brush: 1.6 }),
  horse: Object.freeze({ open: 1, timber: 1.5, brush: 1.8 }),
  wagon: Object.freeze({ open: 1, timber: 2, brush: 2.5 }),
});
/** What getting over a creek or a lesser river costs, in miles of open going (FIC-GONZ-026). The big rivers are crossed only at their crossings. */
export const CROSSING_MILES = Object.freeze({
  foot: Object.freeze({ creek: 0.1, river: 0.3 }),
  horse: Object.freeze({ creek: 0.05, river: 0.2 }),
  wagon: Object.freeze({ creek: 0.4, river: 1 }),
});

/**
 * How many times as long a mile at this grade takes as a level one.
 *
 * Tobler's hiking function, v = 6·e^(−3.5·|s + 0.05|), relative to level ground: a gentle downhill is a little quicker,
 * and every climb slower. A horse is given the same shape. An ox team is never quicker downhill - it is holding the
 * wagon back - and feels a climb twice over (the square), which is invented.
 */
export function slopePace(grade, mode) {
  const walking = Math.exp(3.5 * (Math.abs(grade + 0.05) - 0.05));
  return mode === 'wagon' ? Math.max(1, walking) ** 2 : walking;
}

// ---------------------------------------------------------------- the land round a place

/** The land is indexed in square blocks this many miles a side, each built once, the first time anything looks there. */
const BLOCK = 16;
const BUCKET = 0.25;
const blocks = new Map();
let courseInfo = null;
/** What each course is, and the box round it, worked out once for the whole map. */
function coursesOf(terrain) {
  if (courseInfo) return courseInfo;
  courseInfo = [];
  for (const course of terrain.courses) {
    // Water that runs, or ran within the season: USGS's perennial and intermittent streams, and the few it cannot say.
    if (course.flow === 'ephemeral') continue;
    const river = /River$/.test(course.name || '');
    const kind = BARRIER_RIVERS.includes(course.name) ? 'barrier' : river ? 'river' : 'creek';
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const point of course.points) { minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x); minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y); }
    courseInfo.push({ course, info: { name: course.name, kind, perennial: course.flow === 'perennial' }, minX, minY, maxX, maxY, segments: null });
  }
  return courseInfo;
}
const bucketKey = (bx, by) => bx * 100003 + by;
/** One block's buckets: every stretch of running water that touches the block, filed by the quarter mile it lies in. */
function blockAt(terrain, ix, iy) {
  const key = ix * 100003 + iy;
  if (blocks.has(key)) return blocks.get(key);
  const minX = ix * BLOCK, minY = iy * BLOCK, maxX = minX + BLOCK, maxY = minY + BLOCK;
  const buckets = new Map();
  for (const entry of coursesOf(terrain)) {
    if (entry.maxX < minX || entry.minX > maxX || entry.maxY < minY || entry.minY > maxY) continue;
    // One object per stretch for the whole map, so a stretch filed in two blocks is still one stretch.
    entry.segments ||= entry.course.points.slice(1).map((b, i) => ({ a: entry.course.points[i], b, info: entry.info }));
    for (const segment of entry.segments) {
      const { a, b } = segment;
      if (Math.max(a.x, b.x) < minX || Math.min(a.x, b.x) > maxX || Math.max(a.y, b.y) < minY || Math.min(a.y, b.y) > maxY) continue;
      for (let bx = Math.max(Math.floor(minX / BUCKET), Math.floor(Math.min(a.x, b.x) / BUCKET)); bx <= Math.min(Math.floor(maxX / BUCKET) - 1, Math.floor(Math.max(a.x, b.x) / BUCKET)); bx++) {
        for (let by = Math.max(Math.floor(minY / BUCKET), Math.floor(Math.min(a.y, b.y) / BUCKET)); by <= Math.min(Math.floor(maxY / BUCKET) - 1, Math.floor(Math.max(a.y, b.y) / BUCKET)); by++) {
          const k = bucketKey(bx, by);
          if (!buckets.has(k)) buckets.set(k, []);
          buckets.get(k).push(segment);
        }
      }
    }
  }
  blocks.set(key, buckets);
  return buckets;
}
let land = null;
/**
 * The watercourses of the real land, indexed so "how far is water" and "does this cross a creek" are cheap. One index for
 * the whole map, built a block at a time as places are looked at and shared by every class in the process.
 *
 * It was built afresh for each box asked about and kept for the last sixty-four boxes, and a box fitted to each line or
 * point was nearly always a new one: a real-map class of thirty neighbours spent most of every tick rebuilding indices from
 * a million and a half points (found 2026-09-14). `box` is no longer needed and is accepted so every caller stays as it was.
 * ceiling: blocks are never let go. The colonies map is some two hundred blocks; a map many times larger would want them
 * dropped when unused.
 */
export function landAround(box) { // eslint-disable-line no-unused-vars
  if (land) return land;
  const terrain = realTerrain();
  const segmentsNear = (point, reach) => {
    const found = new Set();
    for (let bx = Math.floor((point.x - reach) / BUCKET); bx <= Math.floor((point.x + reach) / BUCKET); bx++) {
      for (let by = Math.floor((point.y - reach) / BUCKET); by <= Math.floor((point.y + reach) / BUCKET); by++) {
        const buckets = blockAt(terrain, Math.floor(bx * BUCKET / BLOCK), Math.floor(by * BUCKET / BLOCK));
        for (const segment of buckets.get(bucketKey(bx, by)) || []) found.add(segment);
      }
    }
    return found;
  };
  const closest = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    return { x: a.x + dx * t, y: a.y + dy * t };
  };
  /** The nearest water that passes `accept`, within `reach` miles: its distance, the point on it, and what it is. */
  const nearestWater = (point, accept = () => true, reach = 3) => {
    let best = null;
    const radii = [...[0.25, 0.5, 1, 2].filter(r => r < reach), reach];
    for (const r of radii) {
      if (best) break;
      for (const segment of segmentsNear(point, r)) {
        if (!accept(segment.info)) continue;
        const at = closest(point, segment.a, segment.b), d = distance(point, at);
        if (d <= r && (!best || d < best.distance)) best = { distance: d, at, ...segment.info };
      }
    }
    return best;
  };
  const cross = (a, b, p, q) => {
    const o = (u, v, w) => Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
    return o(a, b, p) !== o(a, b, q) && o(p, q, a) !== o(p, q, b);
  };
  /** The water a straight line crosses: creeks and lesser rivers counted once each by name (or by line, unnamed), and whether it crosses a big river. */
  const crossings = (a, b) => {
    const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const creeks = new Set(), rivers = new Set();
    let barrier = false;
    for (const segment of segmentsNear(middle, distance(a, b) / 2 + BUCKET)) {
      if (!cross(a, b, segment.a, segment.b)) continue;
      if (segment.info.kind === 'barrier') barrier = true;
      else (segment.info.kind === 'river' ? rivers : creeks).add(segment.info.name || segment.info);
    }
    return { creeks: creeks.size, rivers: rivers.size, barrier };
  };
  const grade = point => {
    const step = 0.0625, run = 2 * step * METRES_PER_MILE;
    const dx = terrain.heightAt(point.x + step, point.y) - terrain.heightAt(point.x - step, point.y);
    const dy = terrain.heightAt(point.x, point.y + step) - terrain.heightAt(point.x, point.y - step);
    return Math.hypot(dx, dy) / run;
  };
  /**
   * What covers a point: `timber`, `brush` or `open`. Under the woods (`rule` 'landfire', docs/WOODS_AND_BUILDING.md §4.1)
   * a patch of ten or more log-sized trees an acre is timber and mesquite is brush; under the old rule timber is along the
   * water (HIST-GONZ-012). Either way steep open ground is broken and grown up in brush.
   */
  const nearCreek = (point, miles) => Boolean(nearestWater(point, info => info.kind === 'creek', miles));
  const coverAt = (point, rule = 'rivers') => {
    if (rule === 'landfire') {
      const cover = patchCover(patchAt(point, { rule, nearCreek }));
      return cover === 'open' && grade(point) > BRUSH_GRADE ? 'brush' : cover;
    }
    const river = nearestWater(point, info => info.kind !== 'creek', TIMBER_FROM_RIVER);
    if (river) return 'timber';
    if (nearestWater(point, info => info.kind === 'creek', TIMBER_FROM_CREEK)) return 'timber';
    return grade(point) > BRUSH_GRADE ? 'brush' : 'open';
  };
  land = { heightAt: terrain.heightAt, nearestWater, crossings, grade, coverAt, nearCreek };
  return land;
}

const boxAround = (points, pad) => ({
  minX: Math.min(...points.map(p => p.x)) - pad, minY: Math.min(...points.map(p => p.y)) - pad,
  maxX: Math.max(...points.map(p => p.x)) + pad, maxY: Math.max(...points.map(p => p.y)) + pad,
});

// ---------------------------------------------------------------- the ground along a route

/**
 * What lies along each segment of a route, forward: `[rise in metres, share of it in timber, share in brush, creeks
 * crossed, lesser rivers crossed]`. Stored on the route, so a journey's going is worked out from the saved map alone.
 */
export function groundAlong(points, land = null, rule = 'rivers') {
  if (points.length < 2) return [];
  land ||= landAround(boxAround(points, 1));
  return points.slice(1).map((b, index) => {
    const a = points[index], length = distance(a, b);
    const samples = Math.max(1, Math.round(length / SAMPLE_MILES));
    let timber = 0, brush = 0;
    for (let s = 0; s < samples; s++) {
      const f = (s + 0.5) / samples, cover = land.coverAt({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, rule);
      if (cover === 'timber') timber++; else if (cover === 'brush') brush++;
    }
    const ha = land.heightAt(a.x, a.y), hb = land.heightAt(b.x, b.y);
    const rise = Number.isFinite(ha) && Number.isFinite(hb) ? hb - ha : 0;
    const { creeks, rivers } = land.crossings(a, b);
    return [round(rise, 1), round(timber / samples), round(brush / samples), creeks, rivers];
  });
}

/** How many times as long this segment takes as the same length of level open ground, going this way. */
export function segmentPace(length, ground, mode) {
  if (!ground || length <= 0) return 1;
  const [rise, timber, brush, creeks, rivers] = ground;
  const cover = COVER_PACE[mode] || COVER_PACE.foot, crossing = CROSSING_MILES[mode] || CROSSING_MILES.foot;
  const along = 1 + timber * (cover.timber - 1) + brush * (cover.brush - 1);
  const grade = rise / (length * METRES_PER_MILE);
  return (length * along * slopePace(grade, mode) + creeks * crossing.creek + rivers * crossing.river) / length;
}

/** The same segment walked the other way: the rise turns into a fall. */
export const reversedGround = ground => ground && [-ground[0], ground[1], ground[2], ground[3], ground[4]];

/**
 * A journey's going, as `[segment index, pace]` for every segment that is not level open road. Empty when none is -
 * which is every road, and every journey on a map without going.
 */
export function paceOf(points, ground, mode) {
  if (!ground?.some(Boolean)) return [];
  const runs = [];
  for (let i = 1; i < points.length; i++) {
    const factor = round(segmentPace(distance(points[i - 1], points[i]), ground[i - 1], mode), 3);
    if (ground[i - 1] && factor !== 1) runs.push([i - 1, factor]);
  }
  return runs;
}

// ---------------------------------------------------------------- lanes

/** A lane is laid over a grid this fine, in miles. */
export const LANE_STEP = 0.125;
/** How far outside the straight line between its ends a lane may wander looking for easier ground. */
const LANE_ROOM = 1.5;

/**
 * The easiest way for a wagon from one point to another over the real land, or null when there is none: never across a
 * big river, never through water. Costed as the wagon's going (`segmentPace`), so a lane goes round a hill or a thicket
 * when going round is quicker, and fords a creek where it has to.
 */
export function layLane(from, to, rule = 'rivers') {
  const land = landAround(boxAround([from, to], LANE_ROOM + 1));
  const box = boxAround([from, to], LANE_ROOM);
  const columns = Math.ceil((box.maxX - box.minX) / LANE_STEP) + 1, rows = Math.ceil((box.maxY - box.minY) / LANE_STEP) + 1;
  // A place on the lane: where it is, its height and its ground. Grid nodes are read once each, as the search reaches them.
  const WET = 'wet';
  const read = (x, y) => {
    const height = land.heightAt(x, y);
    return { x, y, height, cover: Number.isFinite(height) && height >= 0.3 ? land.coverAt({ x, y }, rule) : WET };
  };
  const nodes = new Array(columns * rows);
  const nodeAt = i => nodes[i] || (nodes[i] = read(box.minX + (i % columns) * LANE_STEP, box.minY + Math.floor(i / columns) * LANE_STEP));
  const share = (a, b, cover) => ((a.cover === cover) + (b.cover === cover)) / 2;
  /** The wagon's time over a straight step, in miles of level open going; Infinity across a big river or into water. */
  const stepCost = (a, b) => {
    if (a.cover === WET || b.cover === WET) return Infinity;
    const passage = land.crossings(a, b);
    if (passage.barrier) return Infinity;
    const length = distance(a, b);
    return length * segmentPace(length, [b.height - a.height, share(a, b, 'timber'), share(a, b, 'brush'), passage.creeks, passage.rivers], 'wagon');
  };
  /** The same over a longer straight run, read every lane step, so straightening sees what a run passes through. */
  const runCost = (a, b) => {
    const pieces = Math.max(1, Math.ceil(distance(a, b) / LANE_STEP));
    let total = 0, previous = a;
    for (let k = 1; k <= pieces && Number.isFinite(total); k++) {
      const next = k === pieces ? b : read(a.x + (b.x - a.x) * k / pieces, a.y + (b.y - a.y) * k / pieces);
      total += stepCost(previous, next); previous = next;
    }
    return total;
  };
  const start = read(from.x, from.y), end = read(to.x, to.y);
  const first = Math.round((from.y - box.minY) / LANE_STEP) * columns + Math.round((from.x - box.minX) / LANE_STEP);
  const cost = new Float64Array(columns * rows).fill(Infinity);
  const via = new Int32Array(columns * rows).fill(-1);
  const open = [];
  const push = (i, f) => { open.push([f, i]); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
  // The lane leaves from the exact point, into the grid cell it stands in.
  const firstCost = stepCost(start, nodeAt(first));
  if (!Number.isFinite(firstCost)) return null;
  cost[first] = firstCost; push(first, firstCost + distance(nodeAt(first), to));
  let reached = -1, reachedCost = Infinity;
  while (open.length) {
    const [f, i] = pop();
    if (f >= reachedCost) break;
    const here = nodeAt(i), g = cost[i];
    if (f > g + distance(here, to) + 1e-9) continue;
    if (distance(here, to) <= LANE_STEP * 1.5) {
      const finish = g + stepCost(here, end);
      if (finish < reachedCost) { reachedCost = finish; reached = i; }
    }
    const c = i % columns, r = (i - c) / columns;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= columns || nr >= rows) continue;
      const j = nr * columns + nc, next = g + stepCost(here, nodeAt(j));
      if (next < cost[j]) { cost[j] = next; via[j] = i; push(j, next + distance(nodeAt(j), to)); }
    }
  }
  if (reached < 0) return null;
  const raw = [start];
  const cells = [];
  for (let i = reached; i >= 0; i = via[i]) cells.unshift(nodeAt(i));
  raw.push(...cells, end);
  // Straightened where a straight run is no harder going for the wagon than the bends it replaces.
  const along = [0];
  for (let k = 1; k < raw.length; k++) along.push(along[k - 1] + stepCost(raw[k - 1], raw[k]));
  const kept = [raw[0]];
  let anchor = 0;
  while (anchor < raw.length - 1) {
    let far = anchor + 1;
    for (const reach of [48, 24, 12, 6, 3, 2]) {
      const k = Math.min(raw.length - 1, anchor + reach);
      if (k <= anchor + 1) continue;
      if (runCost(raw[anchor], raw[k]) <= (along[k] - along[anchor]) * 1.02) { far = k; break; }
    }
    kept.push(raw[far]); anchor = far;
  }
  return kept.map(p => ({ x: round(p.x), y: round(p.y) })).filter((p, k, all) => k === 0 || p.x !== all[k - 1].x || p.y !== all[k - 1].y);
}

// ---------------------------------------------------------------- the house site

/** Water further than this from the house is too far to carry every day without a well (FIC-GONZ-026). */
export const WATER_CARRY_MILES = 0.25;
/** A house is set at least this far inside the family's own line (FIC-GONZ-026). */
export const SITE_MARGIN = 0.05;
/** The steepest ground a house is set on, rise over run (FIC-GONZ-026; the land dealt to families is no steeper than 0.06). */
export const STEEPEST_SITE = 0.08;
/** Closer than this to a watercourse is in it. */
const IN_THE_WATER = 0.03;
/** Lower than this above a river, and near it, is bottom land that floods (FIC-GONZ-026). */
export const FLOOD_FEET = 20;
const FLOOD_REACH = 1.5;

const nameOf = water => water.name || (water.kind === 'creek' ? 'a branch' : 'the river');

/**
 * What a spot on the real land is like to set a house on, and whether it can be, as the family will see it before
 * choosing: the ground, how high above the nearest water, how far to water that runs all year, how far to timber,
 * whether it is bottom land that floods. `bounds` is the family's holding; `why` is the refusal, in a sentence.
 */
export function siteFacts(point, bounds, rule = 'rivers') {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return { can: false, why: 'Choose a place on the map.' };
  if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return { can: false, why: 'That is not your land.' };
  const land = landAround(boxAround([point], 3));
  const height = land.heightAt(point.x, point.y);
  const nearest = land.nearestWater(point);
  if (!Number.isFinite(height) || height < 0.3 || (nearest && nearest.distance < IN_THE_WATER)) return { can: false, why: 'That is in the water.' };
  const running = land.nearestWater(point, info => info.perennial);
  const river = land.nearestWater(point, info => info.kind !== 'creek', FLOOD_REACH);
  const creekTimber = land.nearestWater(point, info => info.kind === 'creek');
  const aboveFeet = nearest ? Math.max(0, Math.round((height - land.heightAt(nearest.at.x, nearest.at.y)) * FEET_PER_METRE)) : null;
  const riverFeet = river ? (height - land.heightAt(river.at.x, river.at.y)) * FEET_PER_METRE : Infinity;
  const timberMiles = rule === 'landfire'
    ? timberMilesFrom(point, { rule, nearCreek: land.nearCreek }) ?? Infinity
    : Math.max(0, Math.min(river ? river.distance - TIMBER_FROM_RIVER : Infinity, creekTimber ? creekTimber.distance - TIMBER_FROM_CREEK : Infinity));
  const facts = {
    ground: land.coverAt(point, rule),
    ...(nearest && { nearest: nameOf(nearest), aboveFeet }),
    ...(running ? { water: nameOf(running), waterMiles: round(running.distance) } : { water: null, waterMiles: null }),
    timberMiles: Number.isFinite(timberMiles) ? round(timberMiles) : null,
    bottom: riverFeet < FLOOD_FEET,
  };
  facts.needsWell = !running || running.distance > WATER_CARRY_MILES;
  if (point.x < bounds.minX + SITE_MARGIN || point.x > bounds.maxX - SITE_MARGIN || point.y < bounds.minY + SITE_MARGIN || point.y > bounds.maxY - SITE_MARGIN) return { can: false, why: 'That is on the line of your land. Set the house back from it.', ...facts };
  if (land.grade(point) > STEEPEST_SITE) return { can: false, why: 'The ground there is too steep to set a house on.', ...facts };
  return { can: true, ...facts };
}

/** The facts of a site, in the family's own words. */
export function siteWords(facts, laneMiles) {
  const ground = { timber: 'in the timber', brush: 'on broken ground grown up in brush', open: 'on open ground' }[facts.ground];
  const parts = [`The house will stand ${ground}`];
  if (facts.nearest) parts[0] += `, ${facts.aboveFeet} feet above ${facts.nearest}`;
  parts[0] += '.';
  if (facts.water) parts.push(facts.needsWell ? `Water that runs all year is ${facts.waterMiles} miles off at ${facts.water}: too far to carry, until there is a well.` : `Water that runs all year is close by at ${facts.water}.`);
  else parts.push('There is no water that runs all year within three miles: the family will want a well.');
  if (facts.timberMiles) parts.push(`The timber is ${facts.timberMiles} miles off.`);
  if (facts.bottom) parts.push('It is low ground in the river bottom, and the river comes over it in a flood.');
  if (Number.isFinite(laneMiles)) parts.push(`The lane to the road will be ${round(laneMiles, 1)} miles.`);
  return parts.join(' ');
}
