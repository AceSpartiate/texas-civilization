// Lines and outlines for the built map: simplification that nests, contours from a grid, and a watercourse's reaches
// joined into one line. Shared by scripts/build-colonies-map.mjs and scripts/build-province.mjs.

/**
 * Douglas-Peucker on [{x, y}]: the points kept are always a subset of the points given, so a line simplified again
 * from this result keeps a subset of these. That is what makes the map's bands of detail nest: every point drawn
 * at a coarse band is a point of the finer band, and every point of the finer band lies within the coarse band's
 * tolerance of the coarse line.
 */
export function simplifyLine(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Uint8Array(points.length); keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = points[a], B = points[b], dx = B.x - A.x, dy = B.y - A.y, length = Math.hypot(dx, dy) || 1e-12;
    let worst = 0, index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i].x - dx * points[i].y + B.x * A.y - B.y * A.x) / length;
      if (d > worst) { worst = d; index = i; }
    }
    if (index > 0 && worst > tolerance) { keep[index] = 1; stack.push([a, index], [index, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

/** A closed ring (first point not repeated) simplified the same way, split at its first point and the point farthest from it. */
export function simplifyRing(ring, tolerance) {
  if (ring.length <= 4) return ring.slice();
  let far = 1, best = -1;
  ring.forEach((p, i) => { const d = Math.hypot(p.x - ring[0].x, p.y - ring[0].y); if (d > best) { best = d; far = i; } });
  const first = simplifyLine(ring.slice(0, far + 1), tolerance);
  const second = simplifyLine([...ring.slice(far), ring[0]], tolerance);
  return [...first, ...second.slice(1, -1)];
}

/** Signed area of a ring (shoelace), square miles. */
export const ringArea = ring => ring.reduce((sum, p, i) => { const q = ring[(i + 1) % ring.length]; return sum + p.x * q.y - q.x * p.y; }, 0) / 2;
export const lineLength = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
/** Even-odd point in ring. */
export function insideRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * The contour at `iso` of a grid of samples (row by row, `columns` across), with `at(column, row)` the sample's point.
 * A sample that is NaN is no sample: squares touching one draw nothing, so a contour between two kinds of ground can
 * leave out a third. Crossings are placed by linear interpolation, so a smooth field gives a smooth outline.
 * Returns `rings` (closed, first point not repeated) and `lines` (open: they end at the grid's edge or at a gap).
 */
export function contours(values, columns, rows, iso, at) {
  // Every crossing lies on a square's edge; an edge is named by a number, horizontal ones first.
  const horizontal = (column, row) => row * columns + column; // between (column, row) and (column + 1, row)
  const vertical = (column, row) => columns * rows + row * columns + column; // between (column, row) and (column, row + 1)
  const points = new Map();
  const crossing = (edge, c0, r0, c1, r1) => {
    if (!points.has(edge)) {
      const v0 = values[r0 * columns + c0], v1 = values[r1 * columns + c1];
      const t = v1 === v0 ? 0.5 : (iso - v0) / (v1 - v0);
      const p0 = at(c0, r0), p1 = at(c1, r1);
      points.set(edge, { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
    }
    return edge;
  };
  const links = new Map();
  const link = (a, b) => {
    if (!links.has(a)) links.set(a, []);
    if (!links.has(b)) links.set(b, []);
    links.get(a).push(b); links.get(b).push(a);
  };
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const tl = values[row * columns + column], tr = values[row * columns + column + 1];
      const bl = values[(row + 1) * columns + column], br = values[(row + 1) * columns + column + 1];
      if (Number.isNaN(tl) || Number.isNaN(tr) || Number.isNaN(bl) || Number.isNaN(br)) continue;
      const code = (tl >= iso ? 8 : 0) | (tr >= iso ? 4 : 0) | (br >= iso ? 2 : 0) | (bl >= iso ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const top = () => crossing(horizontal(column, row), column, row, column + 1, row);
      const bottom = () => crossing(horizontal(column, row + 1), column, row + 1, column + 1, row + 1);
      const left = () => crossing(vertical(column, row), column, row, column, row + 1);
      const right = () => crossing(vertical(column + 1, row), column + 1, row, column + 1, row + 1);
      const centreHigh = (tl + tr + bl + br) / 4 >= iso;
      switch (code) {
        case 1: case 14: link(left(), bottom()); break;
        case 2: case 13: link(bottom(), right()); break;
        case 3: case 12: link(left(), right()); break;
        case 4: case 11: link(top(), right()); break;
        case 6: case 9: link(top(), bottom()); break;
        case 7: case 8: link(left(), top()); break;
        case 5: if (centreHigh) { link(left(), top()); link(bottom(), right()); } else { link(left(), bottom()); link(top(), right()); } break;
        case 10: if (centreHigh) { link(top(), right()); link(left(), bottom()); } else { link(left(), top()); link(bottom(), right()); } break;
      }
    }
  }
  const used = new Set(), rings = [], lines = [];
  const walk = start => {
    const chain = [start]; used.add(start);
    let previous = null, current = start;
    for (;;) {
      const next = links.get(current).find(edge => edge !== previous && !used.has(edge));
      if (next === undefined) break;
      used.add(next); chain.push(next); previous = current; current = next;
    }
    return chain;
  };
  // Open lines start at an end (a crossing with one neighbour); what is left is rings.
  for (const [edge, neighbours] of links) {
    if (used.has(edge) || neighbours.length !== 1) continue;
    lines.push(walk(edge).map(e => points.get(e)));
  }
  for (const edge of links.keys()) {
    if (used.has(edge)) continue;
    const chain = walk(edge);
    if (chain.length >= 3) rings.push(chain.map(e => points.get(e)));
  }
  return { rings, lines };
}

/**
 * The data keeps each watercourse as many short reaches drawn downstream; join a name's reaches end to start into
 * continuous lines, so a creek is one line and not forty.
 */
export function joinReaches(courses) {
  const byName = new Map();
  for (const course of courses) {
    if (!course.name || course.points.length < 2) continue;
    if (!byName.has(course.name)) byName.set(course.name, []);
    byName.get(course.name).push(course);
  }
  const joined = [];
  const key = p => `${Math.round(p.x * 50)},${Math.round(p.y * 50)}`;
  for (const [name, reaches] of byName) {
    const startsAt = new Map();
    for (const reach of reaches) {
      const k = key(reach.points[0]);
      if (!startsAt.has(k)) startsAt.set(k, []);
      startsAt.get(k).push(reach);
    }
    const hasUpstream = new Set(reaches.flatMap(reach => startsAt.get(key(reach.points.at(-1))) || []));
    const used = new Set();
    const follow = first => {
      const points = [...first.points];
      let reach = first; used.add(reach);
      for (;;) {
        const next = (startsAt.get(key(reach.points.at(-1))) || []).find(r => !used.has(r));
        if (!next) break;
        used.add(next); points.push(...next.points.slice(1)); reach = next;
      }
      joined.push({ name, flow: first.flow, points });
    };
    for (const reach of reaches) if (!hasUpstream.has(reach) && !used.has(reach)) follow(reach);
    for (const reach of reaches) if (!used.has(reach)) follow(reach);
  }
  return joined;
}
