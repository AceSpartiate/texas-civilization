// Audits every crossing on the built map: is it on its water, on its road, and does that road really go from one bank to
// the other there? docs/MAP_ACCURACY.md §10.
//
//   node scripts/crossings-audit.mjs            # the table, and a verdict line
//   node scripts/crossings-audit.mjs --json     # the same as JSON, for a test or a proof to read
//   node scripts/crossings-audit.mjs --flagged  # only the crossings with a finding
//
// Reads public/terrain/colonies-map.json.gz through sim/colonies-map.mjs and nothing else: it checks the map a class is
// actually served, not the build's own working data, so a fault in the build shows here as the class would see it.
//
// The six questions (owner, 2026-09-19), one column each:
//   water  the drawn point is on the watercourse it names
//   road   the drawn point is on a road
//   cross  that road goes bank to bank through it, rather than running alongside or clipping a meander
//   names  the water it names is the water it sits on, not a neighbour whose line is nearer
//   cover  every meeting of a road with drawn water has a crossing, and every crossing has a meeting
//   once   one crossing where a road crosses one water once; no two crossings for the same meeting
//   dry    the water is actually drawn under the crossing on the map a class is served (--region)
//
// Tolerances, and why:
//   ON_WATER / ON_ROAD 0.16 miles. Every coordinate on the map is rounded to a hundredth of a mile, and a crossing is an
//     exact intersection of two of its polylines, so the honest error is ~0.015. The build lets a place stand up to
//     CONFLUENCE_MILES (0.15) from its meeting before it draws the crossing at `over` instead, so 0.15 + rounding is the
//     widest a correct crossing can be off. Anything past that is drawn off its water or off its road.
//   TIGHT 0.03 miles: what a crossing that came straight from an intersection should be, reported so a merely-tolerated
//     one (a barrier window's place, a confluence fold) is visible as such rather than hiding inside the tolerance.
//   BANK 0.2 miles: how far along the road either side of the crossing the bank test stands. Far enough to be clear of the
//     water it is testing, near enough that the water's local line is still the right line to be on a side of.
//   NEAR_DUPLICATE 0.35 miles: past the build's own CONFLUENCE_MILES (0.15), so two crossings of one water this close are
//     two the fold should have made one.
//   GRAZING 20 degrees: how square the road must meet the water to be crossing it rather than running along it. A ford is
//     drawn as an ellipse square across the water; met at less than this the road lies along the water and the drawn ford
//     does not read as a way over.
//   STUB 0.1 miles: how near the end of a drawn watercourse a crossing may stand. On the end itself the road goes round the
//     head of the water rather than over it, and the ford sits at a line that stops.
//   DRY 0.25 miles: how far the water may be from the crossing on the map a class is actually served.
import { coloniesMap } from '../sim/colonies-map.mjs';
import { realTerrain } from '../sim/terrain-data.mjs';

const ON_WATER = 0.16, ON_ROAD = 0.16, TIGHT = 0.03, BANK = 0.2, NEAR_DUPLICATE = 0.35;
const GRAZING = 20, STUB = 0.1, DRY = 0.25, DEGENERATE = 0.05;
// The build own TIP_MILES: nearer than this to the end of a drawn line the road passes the head of the water, and no crossing.
const TIP = 0.05;
// The build's own chaining: meetings of one road with one water closer than this along the road are one crossing.
const CHAIN_MILES = 1.5;
const CROSSING_KINDS = ['ford', 'ferry', 'bridge'];

const map = coloniesMap();
const land = realTerrain();
const roads = map.roads.filter(road => ['road', 'crossing'].includes(road.kind));
const crossings = Object.values(map.places).filter(place => CROSSING_KINDS.includes(place.kind));
/** Where a crossing is drawn: `over` for a place that stands off its water, else its own point (public/app.js). */
const drawnAt = place => place.over || place;

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// The build own choice of which meeting of a run is the crossing: the squarest, ties to the earliest along the road.
const squareness = hit => Math.abs(Math.sin(hit.direction - hit.roadDirection));
const squarest = run => run.reduce((best, hit) => (squareness(hit) > squareness(best) + 1e-9 ? hit : best));
const toSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return { d: Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t), t, dx, dy };
};
/** The nearest point of a polyline to p: how far off, and the line's direction there. */
function toLine(p, points) {
  let best = { d: Infinity };
  for (let i = 1; i < points.length; i++) {
    const hit = toSegment(p, points[i - 1], points[i]);
    if (hit.d < best.d) best = { d: hit.d, i, direction: Math.atan2(hit.dy, hit.dx), a: points[i - 1], b: points[i] };
  }
  return best;
}
const intersect = (a, b, c, d) => {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + t * r.x, y: a.y + t * r.y, t, u, direction: Math.atan2(s.y, s.x) } : null;
};
const boxOf = points => points.reduce((box, p) => ({ minX: Math.min(box.minX, p.x), minY: Math.min(box.minY, p.y), maxX: Math.max(box.maxX, p.x), maxY: Math.max(box.maxY, p.y) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
const waterBoxes = map.watercourses.map(course => boxOf(course.points));
const lengthOf = course => course.points.slice(1).reduce((sum, p, i) => sum + distance(p, course.points[i]), 0);

// ---- Every meeting of every road with every drawn watercourse -------------------------------------------------------
/** Arc length along a road (or a watercourse) to each of its points, so a meeting can be placed along it. */
const alongOf = road => road.points.reduce((run, p, i) => (run.push(i ? run[i - 1] + distance(p, road.points[i - 1]) : 0), run), []);
const alongs = new Map(roads.map(road => [road.id, alongOf(road)]));
const waterAlongs = map.watercourses.map(alongOf);
const meetings = [], tips = [];
for (const road of roads) {
  const box = boxOf(road.points), along = alongs.get(road.id);
  map.watercourses.forEach((course, index) => {
    const w = waterBoxes[index];
    if (w.maxX < box.minX || w.minX > box.maxX || w.maxY < box.minY || w.minY > box.maxY) return;
    const water = waterAlongs[index], length = water.at(-1);
    for (let i = 1; i < road.points.length; i++) for (let j = 1; j < course.points.length; j++) {
      const hit = intersect(road.points[i - 1], road.points[i], course.points[j - 1], course.points[j]);
      if (!hit) continue;
      const found = { road, water: course.name, waterKind: course.kind, course, x: hit.x, y: hit.y, along: along[i - 1] + (along[i] - along[i - 1]) * hit.t, direction: hit.direction, roadDirection: Math.atan2(road.points[i].y - road.points[i - 1].y, road.points[i].x - road.points[i - 1].x) };
      // The build's TIP_MILES: a meeting inside the last few yards of a drawn line is the road passing the water's head,
      // not going over it, and is deliberately no crossing. Listed so the choice is visible rather than silent.
      const down = water[j - 1] + (water[j] - water[j - 1]) * hit.u;
      if (Math.min(down, length - down) < TIP) { tips.push(found); continue; }
      meetings.push(found);
    }
  });
}
// Chained into runs exactly as the build chains them: one road, one water, no gap longer than CHAIN_MILES along the road.
const runs = [];
{
  const byKey = new Map();
  for (const hit of meetings) {
    const key = `${hit.road.id} :: ${hit.water}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(hit);
  }
  for (const hits of byKey.values()) {
    hits.sort((a, b) => a.along - b.along);
    let run = [hits[0]];
    const close = () => runs.push({ road: run[0].road, water: run[0].water, waterKind: run[0].waterKind, hits: run, middle: squarest(run), span: run.at(-1).along - run[0].along });
    for (const hit of hits.slice(1)) {
      if (hit.along - run.at(-1).along > CHAIN_MILES) { close(); run = [hit]; } else run.push(hit);
    }
    close();
  }
}

/**
 * Which bank of a water a point is on, read off one segment of it: the sign of the cross product of the segment's
 * direction with the way to the point. Read off the crossing's own segment, not the nearest anywhere, so a meander's far
 * lobe cannot answer for the near one.
 */
const bankSide = (p, a, b) => Math.sign((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
/** A point on a road at a given arc length, clamped to its ends. */
function alongRoad(road, target) {
  const along = alongs.get(road.id);
  if (target <= 0) return { ...road.points[0], clamped: true };
  if (target >= along.at(-1)) return { ...road.points.at(-1), clamped: true };
  const i = along.findIndex(v => v >= target);
  const t = (target - along[i - 1]) / (along[i] - along[i - 1] || 1);
  const a = road.points[i - 1], b = road.points[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, clamped: false };
}
/**
 * Does the road go from one bank to the other **at this crossing**? The road a little before the crossing and a little
 * after must lie on opposite sides of the water's own line there. The reach is BANK miles, cut back to half the gap to the
 * neighbouring meeting so that on a braided run - a road laid along a creek bottom, crossing it again and again - the
 * next crossing cannot answer for this one; never under a fiftieth of a mile, which is twice the rounding.
 * `parity` is the run's: an even number of meetings means the road came back to the bank it started on, which is a clipped
 * meander unless the water is genuinely drawn as two channels there (the Colorado at Matagorda).
 */
const BANK_FLOOR = 0.02;
function banksOf(run) {
  const crossing = run.middle, { course } = crossing;
  const j = (() => { let best = { d: Infinity, j: 1 }; for (let k = 1; k < course.points.length; k++) { const d = toSegment(crossing, course.points[k - 1], course.points[k]).d; if (d < best.d) best = { d, j: k }; } return best.j; })();
  const a = course.points[j - 1], b = course.points[j];
  const index = run.hits.indexOf(crossing);
  const gapBack = index > 0 ? (crossing.along - run.hits[index - 1].along) / 2 : Infinity;
  const gapOn = index < run.hits.length - 1 ? (run.hits[index + 1].along - crossing.along) / 2 : Infinity;
  const back = Math.max(BANK_FLOOR, Math.min(BANK, gapBack)), on = Math.max(BANK_FLOOR, Math.min(BANK, gapOn));
  const before = alongRoad(run.road, crossing.along - back), after = alongRoad(run.road, crossing.along + on);
  return { before: bankSide(before, a, b), after: bankSide(after, a, b), clamped: before.clamped || after.clamped, parity: run.hits.length % 2 };
}
for (const run of runs) Object.assign(run, banksOf(run));

// ---- Each crossing against its run ------------------------------------------------------------------------------------
const verdicts = [];
for (const place of crossings) {
  const point = drawnAt(place), notes = [], flags = [];
  // (a) on the water it names. `water: null` is open water the map draws as the sea, not as a line (Lynch's ferry).
  let onWater = null;
  if (place.water) {
    // Only real lines count. The built map carries 85 courses of two points under a fiftieth of a mile long - the leavings
    // of joining and simplifying the reaches - and standing on one of those is not standing on the water.
    const courses = map.watercourses.filter(course => course.name === place.water && lengthOf(course) >= DEGENERATE);
    onWater = courses.length ? Math.min(...courses.map(course => toLine(point, course.points).d)) : Infinity;
    if (!courses.length) flags.push('water: the map draws no watercourse of that name');
    else if (onWater > ON_WATER) flags.push(`water: ${onWater.toFixed(2)} mi off the ${place.water}`);
    else if (onWater > TIGHT) notes.push(`${onWater.toFixed(2)} mi off its water`);
    // A crossing at the very end of a drawn line: the road goes round the head of the water, not over it.
    const stub = Math.min(...courses.flatMap(course => [distance(point, course.points[0]), distance(point, course.points.at(-1))]));
    if (Number.isFinite(stub) && stub < STUB) flags.push(`water: ${stub.toFixed(2)} mi from where the drawn ${place.water} ends`);
  } else if (!(place.span > 0)) flags.push('water: open water with no measured span');
  // (b) on a road.
  const onRoads = roads.map(road => ({ road, ...toLine(point, road.points) })).sort((a, b) => a.d - b.d);
  const onRoad = onRoads[0].d;
  if (onRoad > ON_ROAD) flags.push(`road: ${onRoad.toFixed(2)} mi off the nearest road (${onRoads[0].road.id})`);
  else if (onRoad > TIGHT) notes.push(`${onRoad.toFixed(2)} mi off its road`);
  const carrying = onRoads.filter(entry => entry.d <= ON_ROAD).map(entry => entry.road);
  // (c) a road that really goes bank to bank here. Its run is the one whose meetings this crossing stands among.
  const mine = place.water
    ? runs.filter(run => carrying.includes(run.road) && run.water === place.water
      && (distance(run.middle, point) <= ON_WATER + TIGHT || run.hits.some(hit => distance(hit, point) <= CHAIN_MILES)))
    : [];
  const crossed = mine.filter(run => run.before && run.after && run.before !== run.after);
  if (!place.water) {
    // Open water the map draws as the sea, not as a line: the build measured the wet stretch of road bank to bank (`span`).
    // It crosses water when the road is under water at the place and out of it a span either side.
    const road = onRoads[0].road, along = toLine(point, road.points);
    const at = alongOf(road);
    const s = (() => { let best = { d: Infinity, s: 0 }; for (let i = 1; i < road.points.length; i++) { const hit = toSegment(point, road.points[i - 1], road.points[i]); if (hit.d < best.d) best = { d: hit.d, s: at[i - 1] + (at[i] - at[i - 1]) * hit.t }; } return best.s; })();
    const wetAt = p => { const h = land.heightAt(p.x, p.y); return !Number.isFinite(h) || h < 0.3; };
    const half = (place.span || 0) / 2;
    if (!wetAt(point)) flags.push('cross: the open water it spans is dry ground at the place');
    else if (wetAt(alongRoad(road, s - half - 0.25)) && wetAt(alongRoad(road, s + half + 0.25))) notes.push('the road is wet a quarter mile past both landings');
    void along;
  } else if (!mine.length) flags.push('cross: no road meets this water here');
  else if (!crossed.length) {
    const clamped = mine.some(run => run.clamped);
    flags.push(`cross: the road${mine.length > 1 ? 's' : ''} ${mine.map(r => r.road.id).join(', ')} stay${mine.length > 1 ? '' : 's'} on one bank here${clamped ? ' (a road end is inside the bank test)' : ''}`);
  }
  // Met slantwise, the road lies along the water rather than going over it, and the ford drawn square across it does not
  // read as a way over.
  for (const run of mine) {
    const roadDirection = toLine(run.middle, run.road.points).direction;
    let d = Math.abs(run.middle.direction - roadDirection) % Math.PI;
    const met = Math.min(d, Math.PI - d) * 180 / Math.PI;
    if (met < GRAZING) flags.push(`cross: ${run.road.id} meets the ${run.water} at ${met.toFixed(0)}°, along it rather than over it`);
    else if (met < 30) notes.push(`met at ${met.toFixed(0)}°`);
  }
  // (d) the water it names is the water it is on.
  if (place.water) {
    let nearer = null;
    for (const course of map.watercourses) {
      if (course.name === place.water) continue;
      const d = toLine(point, course.points).d;
      if (d < (onWater ?? Infinity) - TIGHT && (!nearer || d < nearer.d)) nearer = { d, name: course.name };
    }
    if (nearer && nearer.d < TIGHT) flags.push(`names: sits on ${nearer.name} (${nearer.d.toFixed(2)} mi), not the ${place.water} (${onWater.toFixed(2)})`);
    else if (nearer) notes.push(`${nearer.name} is nearer (${nearer.d.toFixed(2)})`);
  }
  // (f) one crossing for one meeting: no other crossing of the same water within NEAR_DUPLICATE.
  const twin = crossings.find(other => other !== place && other.water === place.water && place.water && distance(drawnAt(other), point) <= NEAR_DUPLICATE);
  if (twin) flags.push(`once: ${twin.id} is ${distance(drawnAt(twin), point).toFixed(2)} mi away on the same water`);
  // (f, the other way) a road that crosses the same water more than once inside one claimed crossing.
  for (const run of crossed) {
    if (run.hits.length > 2 && run.span > CHAIN_MILES * 0.5) notes.push(`${run.road.id} meets the ${run.water} ${run.hits.length} times over ${run.span.toFixed(2)} mi, all one crossing`);
  }
  // How the crossing lies, which is what the page draws it by (public/app.js, landscape-art drawFerry/drawCrossing).
  if (Number.isFinite(place.across) && mine.length) {
    const waterDirection = mine[0].middle.direction;
    const roadDirection = toLine(point, onRoads[0].road.points).direction;
    const off = (a, b) => { let d = Math.abs(a - b) % Math.PI; return Math.min(d, Math.PI - d) * 180 / Math.PI; };
    // A ford or a bridge lies straight across the water; a ferry's rope lies along its road, bank to bank.
    const wanted = place.kind === 'ferry' ? roadDirection : waterDirection + Math.PI / 2;
    const slew = off(place.across, wanted);
    if (slew > 25) flags.push(`lies: drawn ${slew.toFixed(0)}° off ${place.kind === 'ferry' ? 'its road' : 'square to its water'}`);
    else if (slew > 10) notes.push(`${slew.toFixed(0)}° off ${place.kind === 'ferry' ? 'its road' : 'square'}`);
  }
  verdicts.push({
    id: place.id, name: place.name, kind: place.kind, water: place.water, waterKind: place.waterKind,
    x: point.x, y: point.y, off: place.over ? +distance(place, place.over).toFixed(2) : 0, claimId: place.claimId,
    onWater: onWater === null ? null : +onWater.toFixed(3), onRoad: +onRoad.toFixed(3),
    roads: carrying.map(road => road.id), meetings: mine.reduce((sum, run) => sum + run.hits.length, 0),
    verdict: flags.length ? 'FLAG' : 'ok', flags, notes,
  });
}

// ---- (e) Every meeting covered ------------------------------------------------------------------------------------------
// A run is covered when a crossing stands on that road within a chain's length along it of the run's meetings and either
// names that water or is close enough to be the confluence fold the build made of it.
const uncovered = [];
for (const run of runs) {
  const covered = crossings.some(place => {
    const point = drawnAt(place);
    if (toLine(point, run.road.points).d > ON_ROAD) return false;
    if (place.water === run.water) return run.hits.some(hit => distance(hit, point) <= CHAIN_MILES);
    return run.hits.some(hit => distance(hit, point) <= 0.2);
  });
  if (!covered) uncovered.push({ road: run.road.id, water: run.water, x: +run.middle.x.toFixed(2), y: +run.middle.y.toFixed(2), meetings: run.hits.length });
}

// ---- The map a class is actually served ---------------------------------------------------------------------------------
// The built map is not what a student looks at. A class is served two kinds of water and the page draws each from its own
// place (`drawTerrain`, public/app.js): on the real land a **river** comes from the province's detail levels, which hold
// every river whole at every band, and the class's own river runs are skipped; a **creek** comes only from the class's
// terrain, which `sim/colonies-region.mjs` keeps within KEPT_ROUND_SETTLEMENT of a settled town and for CREEK_AT_CROSSING
// miles round each ford. So a creek crossing is drawn on dry ground when its creek is not kept, and a river crossing when
// the province has no such river. Checked on a small class and a large one, because how much creek is kept follows which
// towns have families.
const regions = [];
if (process.argv.includes('--region')) {
  const { createGonzalesWorld } = await import('../sim/gonzales.mjs');
  const { gunzipSync } = await import('node:zlib');
  const { readFileSync } = await import('node:fs');
  const { decodeProvince } = await import('../public/land-levels.js');
  // The finest band: what the page draws at a crossing's own zoom (`lineBand`, a pixel and a half off the line).
  const province = decodeProvince(JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-province.json.gz', import.meta.url))).toString('utf8')));
  for (const families of [5, 30]) {
    const world = createGonzalesWorld('crossings-audit', families, { map: 'colonies' });
    const creeks = world.map.terrain.filter(feature => feature.kind === 'creek');
    const dry = [];
    for (const place of Object.values(world.map.sites).filter(site => CROSSING_KINDS.includes(site.kind))) {
      const point = drawnAt(place);
      // Open water the map draws as the sea (Lynch's ferry) is neither: it is drawn by the shore, and the span was measured
      // off the elevation, which the built-map pass above checks.
      if (!place.water) continue;
      const lines = place.waterKind === 'creek'
        ? creeks.filter(feature => feature.name === place.water).map(feature => feature.points)
        : province.rivers.filter(river => river.name === place.water).map(river => river.levels[0]).filter(Boolean);
      const off = lines.length ? Math.min(...lines.map(points => toLine(point, points).d)) : Infinity;
      if (off > DRY) dry.push({ id: place.id, kind: place.kind, water: place.water, waterKind: place.waterKind, off: Number.isFinite(off) ? +off.toFixed(2) : null });
    }
    regions.push({ families, creeksDrawn: creeks.length, dry });
    for (const miss of dry) {
      const verdict = verdicts.find(v => v.id === miss.id);
      if (!verdict) continue;
      if (!verdict.flags.some(f => f.startsWith('dry:'))) verdict.flags.push(`dry: no ${miss.water} is drawn under it on a class's map (${miss.off === null ? 'the water is not drawn at all' : `${miss.off} mi off`})`);
      verdict.verdict = 'FLAG';
    }
  }
}

const flagged = verdicts.filter(v => v.verdict === 'FLAG');
const noted = verdicts.filter(v => v.verdict === 'ok' && v.notes.length);
const report = {
  built: 'public/terrain/colonies-map.json.gz', date: new Date().toISOString(),
  tolerances: { ON_WATER, ON_ROAD, TIGHT, BANK, NEAR_DUPLICATE, CHAIN_MILES },
  counts: {
    crossings: crossings.length, fords: crossings.filter(c => c.kind === 'ford').length,
    ferries: crossings.filter(c => c.kind === 'ferry').length, bridges: crossings.filter(c => c.kind === 'bridge').length,
    roads: roads.length, watercourses: map.watercourses.length,
    degenerateWatercourses: map.watercourses.filter(course => lengthOf(course) < DEGENERATE).length,
    meetings: meetings.length, runs: runs.length,
    // Deliberately not crossings: the road passes the head or the mouth of the drawn line, it does not go over it.
    tips: tips.length,
    flagged: flagged.length, noted: noted.length, uncovered: uncovered.length,
  },
  uncovered, regions, crossings: verdicts,
  passedTheHead: tips.map(hit => ({ road: hit.road.id, water: hit.water, x: +hit.x.toFixed(2), y: +hit.y.toFixed(2) })),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const rows = process.argv.includes('--flagged') ? [...flagged, ...noted] : verdicts;
  const columns = ['id', 'kind', 'water', 'x', 'y', 'onWater', 'onRoad', 'roads', 'verdict'];
  const table = rows.map(v => [v.id, v.kind, v.water ?? '(open water)', v.x, v.y, v.onWater ?? '-', v.onRoad, v.roads.length, v.verdict]);
  const width = columns.map((c, i) => Math.max(c.length, ...table.map(r => String(r[i]).length)));
  console.log(columns.map((c, i) => c.padEnd(width[i])).join('  '));
  console.log(width.map(w => '-'.repeat(w)).join('  '));
  for (const [i, row] of table.entries()) {
    console.log(row.map((cell, k) => String(cell).padEnd(width[k])).join('  '));
    for (const flag of rows[i].flags) console.log(`    ! ${flag}`);
    for (const note of rows[i].notes) console.log(`    · ${note}`);
  }
  for (const miss of uncovered) console.log(`! ${miss.road} meets ${miss.water} at ${miss.x}, ${miss.y} (${miss.meetings} meetings) with no crossing there`);
  for (const tip of report.passedTheHead) console.log(`· ${tip.road} passes the head of ${tip.water} at ${tip.x}, ${tip.y}: the water stops at the road, so no crossing (TIP_MILES)`);
  for (const region of regions) console.log(`A class of ${region.families}: ${region.creeksDrawn} creeks drawn, ${region.dry.length} crossings with no water under them.`);
  console.log(`\n${report.counts.crossings} crossings (${report.counts.fords} fords, ${report.counts.ferries} ferries, ${report.counts.bridges} bridges); ${report.counts.meetings} meetings of a road with drawn water in ${report.counts.runs} runs.`);
  console.log(`${flagged.length} flagged, ${noted.length} with a note, ${uncovered.length} meetings uncovered.`);
}
process.exitCode = flagged.length || uncovered.length ? 1 : 0;
