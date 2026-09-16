// The water, as a reader sees it.
//
// A reader looked at the map and said the rivers changed shape when they zoomed in, that parts of
// them were not connected, and that they were angular instead of curved. Three separate things
// were true. This holds all three fixed: the drawn line is a curve through the map's own points,
// a creek's mouth reaches the river it runs into, and an end that was cut at the edge of the kept
// country is left open rather than joined to whatever happens to pass near it.
//
// The width - water drawn in the same exaggerated yardstick as every tree and person on the map -
// and the trees kept out of the channel are in `public/app.js`, which cannot be imported here
// (it is a browser module that touches `document`); those are held by the browser proof and the
// record in docs/evidence/rivers.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { curveThrough } from '../public/curve.js';
import { JOIN_MILES, joinMouths } from '../sim/colonies-region.mjs';

/** A canvas context that records the path laid into it rather than painting one. */
function recorder() {
  const calls = [];
  return { calls, beginPath: () => calls.push(['begin']), moveTo: (x, y) => calls.push(['move', x, y]), lineTo: (x, y) => calls.push(['line', x, y]), bezierCurveTo: (...a) => calls.push(['bezier', ...a]) };
}
/** A point on a cubic Bézier. */
const along = (p0, c1, c2, p1, t) => {
  const u = 1 - t, b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: b[0] * p0.x + b[1] * c1.x + b[2] * c2.x + b[3] * p1.x, y: b[0] * p0.y + b[1] * c1.y + b[2] * c2.y + b[3] * p1.y };
};
const water = seed => {
  const world = createGonzalesWorld(seed, 15, { map: 'colonies' });
  return (world.map.terrain || []).filter(feature => ['river', 'creek'].includes(feature.kind));
};
const segmentDistance = (q, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / length)) : 0;
  return Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t));
};
const offAnyOther = (point, self, courses) => {
  let best = Infinity;
  for (const course of courses) {
    if (course.id === self) continue;
    for (let i = 1; i < course.points.length; i++) best = Math.min(best, segmentDistance(point, course.points[i - 1], course.points[i]));
  }
  return best;
};

test('a course is drawn as a curve that passes through every point the map gives, and through no others', () => {
  const points = [{ x: 0, y: 0 }, { x: 40, y: 10 }, { x: 70, y: 60 }, { x: 120, y: 40 }];
  const ctx = recorder();
  curveThrough(ctx, points);
  assert.deepEqual(ctx.calls[0], ['begin']);
  assert.deepEqual(ctx.calls[1], ['move', 0, 0]);
  const curves = ctx.calls.filter(call => call[0] === 'bezier');
  assert.equal(curves.length, points.length - 1, 'the line is not one curve a segment');
  assert.equal(ctx.calls.some(call => call[0] === 'line'), false, 'part of the course is still drawn as a straight line');
  // Every curve ends exactly on the next point the map gave: the samples are honoured, only the
  // water between them is rounded.
  curves.forEach((curve, i) => assert.deepEqual({ x: curve[5], y: curve[6] }, points[i + 1], `curve ${i} does not end on the map's own point`));
});

test('a hairpin rounds rather than throwing a loop out into the prairie', () => {
  // Two long runs meeting at a sharp corner - the invented map's river, whose points are five
  // miles apart. An unclamped Catmull-Rom overshoots here and the water leaves its bed.
  const points = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 290, y: 20 }, { x: 0, y: 30 }];
  const ctx = recorder();
  curveThrough(ctx, points);
  let worst = 0;
  for (const [, c1x, c1y, c2x, c2y, ex, ey] of ctx.calls.filter(call => call[0] === 'bezier')) {
    const start = points.find((p, i) => i < points.length - 1 && points[i + 1].x === ex && points[i + 1].y === ey);
    const end = { x: ex, y: ey };
    for (let t = 0; t <= 1; t += 0.05) {
      const at = along(start, { x: c1x, y: c1y }, { x: c2x, y: c2y }, end, t);
      let nearest = Infinity;
      for (let i = 1; i < points.length; i++) nearest = Math.min(nearest, segmentDistance(at, points[i - 1], points[i]));
      worst = Math.max(worst, nearest);
    }
  }
  // Within a tenth of the shortest run: the corner is rounded, not swung around.
  assert.ok(worst < 10, `the curve swung ${worst.toFixed(1)} away from the course it was given`);
});

test("a creek's mouth reaches the river it runs into", () => {
  const courses = water('rivers-join');
  const gaps = [];
  for (const course of courses) {
    for (const [which, end] of [['start', course.points[0]], ['end', course.points.at(-1)]]) {
      // A cut end is the course carrying on into country this map does not keep; where it happens
      // to pass near another course on its way out is not a confluence and is left alone.
      if (course.cut?.includes(which)) continue;
      const off = offAnyOther(end, course.id, courses);
      // Either it meets another course, or it is a headwater with nothing near it. What there is
      // never any excuse for is a mouth stopping a hundred feet short of the river it runs into.
      if (off > 0.02 && off < 0.25) gaps.push(`${course.id} ends ${(off * 5280).toFixed(0)} feet off another course`);
    }
  }
  assert.deepEqual(gaps, [], gaps.slice(0, 4).join(' | '));
  const meeting = courses.filter(course => [course.points[0], course.points.at(-1)].some(end => offAnyOther(end, course.id, courses) < 0.02));
  assert.ok(meeting.length > 30, `only ${meeting.length} courses meet another at all, which is too few to be the real drainage`);
});

test('an end cut at the edge of the country this map keeps is left open, and a far end is not reached for', () => {
  // The rule itself, on three courses made for it: a river, a creek whose mouth stops a hundred
  // feet short of it, and a creek cut where it leaves the kept country a hundred feet short of the
  // same river. The first should be carried onto the river; the second must be left exactly where
  // it is, because it is not a mouth - the course carries on into country this map does not keep.
  const river = { id: 'river', kind: 'river', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] };
  const mouth = { id: 'mouth', kind: 'creek', points: [{ x: 5, y: 3 }, { x: 5, y: 0.02 }] };
  const leaving = { id: 'leaving', kind: 'creek', points: [{ x: 8, y: 3 }, { x: 8, y: 0.02 }], cut: ['end'] };
  const far = { id: 'far', kind: 'creek', points: [{ x: 2, y: 9 }, { x: 2, y: 4 }] };
  const joined = joinMouths([river, mouth, leaving, far]);
  assert.deepEqual(mouth.points.at(-1), { x: 5, y: 0 }, 'the mouth was not carried onto the river');
  assert.deepEqual(leaving.points.at(-1), { x: 8, y: 0.02 }, 'an end that was cut was joined anyway');
  assert.deepEqual(far.points.at(-1), { x: 2, y: 4 }, 'a course was reached across four miles of prairie to meet something');
  assert.equal(joined, 1, `${joined} ends were joined, and only one should have been`);
  assert.ok(JOIN_MILES < 0.5, 'a mouth may be carried further than a few hundred yards');
});

test('every end left open on the real map is a headwater or the edge of the country, never a short mouth', () => {
  const courses = water('rivers-join');
  const open = courses.reduce((count, course) => count + [course.points[0], course.points.at(-1)].filter(end => offAnyOther(end, course.id, courses) >= 0.25).length, 0);
  // If every end had been joined to its nearest neighbour the map would claim confluences nobody
  // surveyed, so this number staying large is the guard on the other side of the same rule.
  assert.ok(open > 100, `only ${open} ends are left open, so ends are being joined that should not be`);
  assert.ok(courses.some(course => course.cut?.length), 'no course is marked as leaving the kept country, so the cut rule is never exercised');
});

test('the same seed still deals the same class, however the water was joined', () => {
  // Joining a mouth adds a point to a course, and the timber band along it is jittered per point:
  // done before the deal, one extra draw would shift every random number after it and hand out a
  // different class from the same seed. The join is done last for that reason.
  const one = createGonzalesWorld('rivers-seed', 15, { map: 'colonies' });
  const two = createGonzalesWorld('rivers-seed', 15, { map: 'colonies' });
  const shape = world => Object.values(world.households).map(h => `${h.id}:${h.settlementId}:${h.crop}:${world.map.sites[h.homeSiteId].x.toFixed(3)}`);
  assert.deepEqual(shape(one), shape(two));
  // And the class is dealt across the settlements, so this is a real deal rather than an empty list.
  assert.ok(new Set(shape(one).map(row => row.split(':')[1])).size > 2);
});
