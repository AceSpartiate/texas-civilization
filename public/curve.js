// A line through points that reads as a watercourse rather than a survey traverse.
//
// The map carries a *sample* of a course - a few points a mile on the real land, and on the
// invented country as few as four points for the whole Guadalupe. Joining those samples with
// straight lines is itself a guess, and the wrong one: at any zoom past a mile it draws ruled
// lines meeting at corners, which no river does. A curve through the same samples is the better
// guess, and it is the only thing invented here - every point the map gives is a point the line
// passes through exactly.
//
// Kept in its own file with no browser imports so it can be tested (tests/rivers.test.mjs);
// `landscape-art.js` uses it for water and for roads.

/**
 * A Catmull-Rom curve through every point, laid into `ctx` as one path.
 *
 * The control points are pulled back to a third of the segment they belong to, because an
 * unclamped Catmull-Rom overshoots on a sharp corner between two long runs - and the invented map,
 * whose river turns ninety degrees between points five miles apart, is exactly that case. Clamped,
 * a corner rounds; unclamped, it throws a loop out into the prairie and the water leaves its bed.
 */
export function curveThrough(ctx, points, visible = null) {
  ctx.beginPath();
  if (points.length < 3) { points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); return; }
  // `visible` (from `visibleSegments`) skips the pieces that cannot reach the screen. A skipped piece breaks the path, and
  // the next drawn piece starts where the course really is, with the neighbours it always had, so it is the same curve.
  let open = !visible;
  if (open) ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    if (visible && !visible[i]) { open = false; continue; }
    if (!open) { ctx.moveTo(points[i].x, points[i].y); open = true; }
    const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
    const out = pull(p1, p2, (p2.x - p0.x) / 6, (p2.y - p0.y) / 6);
    const into = pull(p1, p2, (p3.x - p1.x) / 6, (p3.y - p1.y) / 6);
    ctx.bezierCurveTo(p1.x + out.x, p1.y + out.y, p2.x - into.x, p2.y - into.y, p2.x, p2.y);
  }
}

/**
 * Which segments of a course, already in screen pixels, can put paint on a `width` by `height` screen: 1 for each that can.
 * The curve between two points stays inside their box grown by a third of the span (a control offset is held to that, see
 * `pull`), and `pad` is whatever is drawn beside the line - half the widest stroke, the reeds on the bank. `count` is how many.
 * On the colonies map a river is thousands of points across the whole country, and close in a few dozen are on screen.
 */
export function visibleSegments(points, width, height, pad = 0) {
  const segments = new Uint8Array(Math.max(0, points.length - 1));
  let count = 0;
  for (let i = 0; i < segments.length; i++) {
    const a = points[i], b = points[i + 1], reach = (Math.abs(b.x - a.x) + Math.abs(b.y - a.y)) / 3 + pad;
    if (Math.max(a.x, b.x) + reach < 0 || Math.min(a.x, b.x) - reach > width || Math.max(a.y, b.y) + reach < 0 || Math.min(a.y, b.y) - reach > height) continue;
    segments[i] = 1; count++;
  }
  return { segments, count };
}

/** A control offset, held to a third of the span it belongs to. */
function pull(from, to, dx, dy) {
  const span = Math.hypot(to.x - from.x, to.y - from.y), reach = Math.hypot(dx, dy), limit = span / 3;
  return reach > limit && reach > 0 ? { x: (dx * limit) / reach, y: (dy * limit) / reach } : { x: dx, y: dy };
}
