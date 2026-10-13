// The towns draw only the streets somebody lived or did business along (owner, 2026-10-13: "there's a lot of
// unnecessary streets in towns"; docs/TOWNS.md §5c).
//
// Each town's research has it as a cluster on a few blocks of a much bigger plat, or a handful of buildings along a road
// (docs/town-research/<town>.md, the "built town" section), and the towns were drawn with the whole plat: Matagorda's
// nineteen modules, Liberty's forty-nine blocks, Refugio's sixteen lines on open prairie. This holds every drawn street to
// something standing along it - a building, or the edge of one of the town's squares, within half a block beside it - and
// stops it a block past the last of them, unless it ends at another drawn street. A road out of town (`leadsTo`, the place
// it goes) is the one street that may run on past everything, so long as it starts in the town.
//
// The distances are the plats': blocks of 220 to 351 ft with streets of 55 to 83 ft between them, so a house on the near
// half of a lot is within 200 ft of the street's middle, and 300 ft is about a block.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_LAYOUTS } from '../sim/town-layouts.mjs';

const BESIDE = 200, PAST = 300;
const length = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
/** How far along `street` a point stands beside it (within `BESIDE` of its middle, level with it), or null. */
function along(street, p) {
  let walked = 0, best = null;
  for (let i = 1; i < street.points.length; i++) {
    const a = street.points[i - 1], b = street.points[i], dx = b.x - a.x, dy = b.y - a.y, span = Math.hypot(dx, dy);
    if (!span) continue;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (span * span), off = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / span;
    if (t >= 0 && t <= 1 && off <= BESIDE && (!best || off < best.off)) best = { off, at: walked + t * span };
    walked += span;
  }
  if (best) return best.at;
  // A building just off a street's end, as a house at the head of a lane, stands along it too.
  if (Math.hypot(p.x - street.points[0].x, p.y - street.points[0].y) <= BESIDE) return 0;
  if (Math.hypot(p.x - street.points.at(-1).x, p.y - street.points.at(-1).y) <= BESIDE) return walked;
  return null;
}
/** A square's edge, every 20 ft: a street along a public square is a street somebody uses. */
function squareEdge(square) {
  const corners = square.points || [[0, 0], [square.width, 0], [square.width, square.height], [0, square.height]].map(([dx, dy]) => ({ x: square.x + dx, y: square.y + dy }));
  return corners.flatMap((a, i) => {
    const b = corners[(i + 1) % corners.length], steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 20);
    return Array.from({ length: steps }, (_, k) => ({ x: a.x + (b.x - a.x) * k / steps, y: a.y + (b.y - a.y) * k / steps }));
  });
}
/** Whether `end` meets another of the town's drawn streets: a corner or a T, not a street left hanging. */
const meets = (town, street, end) => town.streets.some(other => other !== street && other.points.some((b, i) => {
  if (!i) return false;
  const a = other.points[i - 1], dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((end.x - a.x) * dx + (end.y - a.y) * dy) / l));
  return Math.hypot(end.x - a.x - t * dx, end.y - a.y - t * dy) <= other.width / 2 + 5;
}));

/** Every way a town's streets break the rule, in words. */
function streetsWithNobody(town) {
  const things = [...town.buildings, ...town.squares.flatMap(squareEdge)], faults = [];
  for (const street of town.streets) {
    const name = street.name || `the unnamed street from (${street.points[0].x}, ${street.points[0].y})`;
    const at = things.map(thing => along(street, thing)).filter(value => value !== null).sort((a, b) => a - b);
    const total = length(street.points), first = at.length ? at[0] : Infinity, last = at.length ? total - at.at(-1) : Infinity;
    if (street.leadsTo) {
      if (first > PAST && !meets(town, street, street.points[0])) faults.push(`${name}, the road to ${street.leadsTo}, does not start in the town`);
      continue;
    }
    if (!at.length) { faults.push(`${name} has nothing along it`); continue; }
    if (first > PAST && !meets(town, street, street.points[0])) faults.push(`${name} runs ${Math.round(first)} ft before anything stands along it`);
    if (last > PAST && !meets(town, street, street.points.at(-1))) faults.push(`${name} runs on ${Math.round(last)} ft past the last thing along it`);
  }
  return faults;
}

test('every street a town draws has a building or a square along it, and none runs on past the town', () => {
  let streets = 0;
  for (const [id, town] of Object.entries(TOWN_LAYOUTS)) {
    assert.deepEqual(streetsWithNobody(town), [], `${id}: a street nobody lives along`);
    streets += town.streets.length;
  }
  // The guard itself: a street laid where nothing stands, in a town that has buildings, is found.
  const matagorda = TOWN_LAYOUTS.matagorda;
  assert.deepEqual(streetsWithNobody({ ...matagorda, streets: [...matagorda.streets, { name: 'Burton Street', width: 83, points: [{ x: -333, y: 1165 }, { x: 5074, y: 1165 }] }] }), ['Burton Street has nothing along it']);
  assert.ok(streets > 30 && streets < 90, `${streets} streets in the fourteen towns`);
});

test('a road out of town names where it goes and starts in the town', () => {
  for (const [id, town] of Object.entries(TOWN_LAYOUTS)) for (const street of town.streets.filter(s => 'leadsTo' in s)) {
    assert.ok(typeof street.leadsTo === 'string' && street.leadsTo.length > 2, `${id}: ${street.name} leads nowhere named`);
    assert.ok(street.name, `${id}: a road out of town to ${street.leadsTo} has no name`);
  }
});
