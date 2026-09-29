// Buildings in the view Astra's building sheets are drawn in (buildings, fortifications, town-buildings-researched): the
// front of a building square to the camera, its top and its right-hand end seen a little, the receding edges running up and
// to the right. An oblique projection does exactly that and keeps a front face undistorted, so a door or a window on it is a
// plain rectangle and an arch a plain arch - what her fronts are.
//
// World units are feet: x east (across the picture), y up, z north (into it). A point is put on the page at
// `px` source pixels a foot across and up, and a foot into the picture moves it `kx` feet right and `ky` feet up.
// ceiling: one fixed recession (kx 0.34, ky 0.3), read by eye off her `stone-tile-house`, `adobe-flat` and `timber-hall`,
// whose right ends and tops show about that much; a measured one per sheet is the way out if a Claude building sits visibly
// steeper or flatter than hers beside it.
import { Ink, f2, ellipse, blob, curve, frameSvg } from './svg.mjs';
import { LINE, tone } from './style.mjs';

export const RECEDE = Object.freeze({ kx: 0.34, ky: 0.3 });
const P = p => `${f2(p[0])} ${f2(p[1])}`;
export const path = points => `M ${points.map(P).join(' L ')} Z`;
export const open = points => `M ${points.map(P).join(' L ')}`;
/** A deterministic 0..1 from a number, so every drawing is the same drawing each build. */
export const rand = seed => { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** The masonry and timber colours of her buildings (read off `adobe-flat`, `stone-tile-house`, `chapel`, `timber-hall`). */
export const MATERIAL = Object.freeze({
  plaster: '#dcb98a',      // adobe-flat's and chapel's warm limewash
  plasterPale: '#e8d2a8',
  limestone: '#d8c39c',    // stone-tile-house's and the presidio's pale stone
  stoneDark: '#a88e66',
  ironstone: '#8a5a38',    // the red-brown iron-bearing stone of East Texas
  timber: '#7c5c3a',       // timber-hall's weathered boards
  timberLight: '#a07a50',
  timberDark: '#56361d',
  shingle: '#6f5840',      // trading-house's and timber-hall's roofs
  shingleLight: '#8c7254',
  tile: '#b0532f',         // adobe-tile's and stone-tile-house's roofs
  door: '#6b4527',
  doorDark: '#3b2616',
  opening: '#2d2118',      // a dark doorway or a belfry arch
  sand: '#cdb27c',
  earth: '#9a7a4e',
  grass: '#7d8f4a',
  iron: '#3e3a36',
});

export class Oblique {
  /**
   * `ink` an Ink drawing in page pixels (y down); `origin` the page point of world (0, 0, 0); `px` pixels a foot.
   */
  constructor(ink, { origin, px, kx = RECEDE.kx, ky = RECEDE.ky }) { Object.assign(this, { ink, origin, px, kx, ky }); }
  at(x, y, z = 0) { return [this.origin[0] + (x + z * this.kx) * this.px, this.origin[1] - (y + z * this.ky) * this.px]; }
  /** A flat face through world points, filled and outlined. */
  face(points, fill, options = {}) { this.ink.shape(path(points.map(p => this.at(...p))), fill, { shade: false, outline: LINE.inner + 1, ...options }); }
  line(points, options = {}) { this.ink.line(open(points.map(p => this.at(...p))), options); }
  /**
   * A block from x0..x1, z0..z1, y0..y1: its right end, its front and its top, lit from the upper left (the end in shade,
   * the top lifted). `top: false` leaves the top for a roof to cover; `end: false` hides a right end another block hides.
   */
  box({ x0, x1, z0, z1, y0 = 0, y1 }, colour, { top = true, end = true, front = true, outline } = {}) {
    const o = outline ? { outline } : {};
    if (end) this.face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], tone(colour, -0.2), o);
    if (front) this.face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], colour, o);
    if (top) this.face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], tone(colour, 0.14), o);
  }
  /**
   * A gabled roof with its ridge running east and west (x0..x1) over z0..z1 from the eaves at `eave` to the ridge at `ridge`,
   * with an overhang `over`: the front slope (lit), and the right gable end (the wall's colour) under the right verge.
   */
  gable({ x0, x1, z0, z1, eave, ridge, over = 1 }, roof, wall, { gableEnd = true, courses = 0 } = {}) {
    const zm = (z0 + z1) / 2;
    if (gableEnd) this.face([[x1, eave, z0], [x1, eave, z1], [x1, ridge, zm]], tone(wall, -0.2));
    // The back slope's sliver beyond the ridge on the right, then the front slope.
    this.face([[x1 + over, ridge, zm], [x1 + over, eave - over * 0.4, z1 + over], [x1 + over * 0.2, eave - over * 0.4, z1 + over]], tone(roof, -0.25));
    const slope = [[x0 - over, eave - over * 0.4, z0 - over], [x1 + over, eave - over * 0.4, z0 - over], [x1 + over, ridge, zm], [x0 - over, ridge, zm]];
    this.face(slope, roof);
    for (let i = 1; i <= courses; i++) {
      const t = i / (courses + 1), y = eave - over * 0.4 + (ridge - eave + over * 0.4) * t, z = z0 - over + (zm - z0 + over) * t;
      this.line([[x0 - over, y, z], [x1 + over, y, z]], { width: LINE.fine, colour: tone(roof, -0.4), opacity: 0.7 });
    }
    // The right verge, a board along the gable's edge.
    this.line([[x1 + over, eave - over * 0.4, z0 - over], [x1 + over, ridge, zm], [x1 + over, eave - over * 0.4, z1 + over]], { width: LINE.inner + 0.6 });
  }
  /** A round-headed opening on a front face (plane z): width `w`, springing at `spring`, from `y0`. */
  arch(cx, y0, w, spring, z, fill = MATERIAL.opening, { outline = LINE.inner, frame } = {}) {
    const a = this.at(cx - w / 2, y0, z), b = this.at(cx + w / 2, y0, z), s1 = this.at(cx + w / 2, spring, z), s0 = this.at(cx - w / 2, spring, z);
    const r = (w / 2) * this.px;
    const d = `M ${P(a)} L ${P(b)} L ${P(s1)} A ${f2(r)} ${f2(r)} 0 0 0 ${P(s0)} Z`;
    if (frame) {
      const g = frame * this.px, R = r + g;
      const A = [a[0] - g, a[1]], B = [b[0] + g, b[1]], S1 = [s1[0] + g, s1[1]], S0 = [s0[0] - g, s0[1]];
      this.ink.shape(`M ${P(A)} L ${P(B)} L ${P(S1)} A ${f2(R)} ${f2(R)} 0 0 0 ${P(S0)} Z`, tone(fill === MATERIAL.opening ? MATERIAL.limestone : fill, 0.08), { shade: false, outline });
    }
    this.ink.shape(d, fill, { shade: false, outline });
    return d;
  }
  /** A square-headed opening (a door or a window) on a front face, with an optional lintel and sill. */
  rect(cx, y0, w, h, z, fill, { outline = LINE.inner, lintel, sill, bars = 0, boards = 0 } = {}) {
    const pts = [[cx - w / 2, y0, z], [cx + w / 2, y0, z], [cx + w / 2, y0 + h, z], [cx - w / 2, y0 + h, z]];
    this.face(pts, fill, { outline });
    for (let i = 1; i < boards; i++) this.line([[cx - w / 2 + (w * i) / boards, y0 + 0.2, z], [cx - w / 2 + (w * i) / boards, y0 + h - 0.2, z]], { width: LINE.fine, colour: tone(fill, -0.45), opacity: 0.8 });
    for (let i = 1; i <= bars; i++) this.line([[cx - w / 2 + (w * i) / (bars + 1), y0, z], [cx - w / 2 + (w * i) / (bars + 1), y0 + h, z]], { width: LINE.inner, colour: MATERIAL.iron });
    if (lintel) this.face([[cx - w / 2 - lintel, y0 + h, z], [cx + w / 2 + lintel, y0 + h, z], [cx + w / 2 + lintel, y0 + h + lintel * 0.8, z], [cx - w / 2 - lintel, y0 + h + lintel * 0.8, z]], MATERIAL.timber, { outline: LINE.fine + 0.4 });
    if (sill) this.face([[cx - w / 2 - sill * 0.6, y0 - sill * 0.5, z], [cx + w / 2 + sill * 0.6, y0 - sill * 0.5, z], [cx + w / 2 + sill * 0.6, y0, z], [cx - w / 2 - sill * 0.6, y0, z]], tone(MATERIAL.limestone, -0.05), { outline: LINE.fine + 0.4 });
  }
  /**
   * Coursed masonry on a front face: faint bed joints every `course` feet and a stagger of head joints, and a few darker
   * stones - the texture her `stone-tile-house` and presidio have, much lighter, so it reads as stone at play size and not
   * as a grid. `skip(x, y)` leaves openings bare.
   */
  masonry(x0, x1, y0, y1, z, colour, { course = 1.6, seed = 1, skip = () => false, opacity = 0.45, rubble = false } = {}) {
    const ink = colour => ({ width: LINE.fine, colour: tone(colour, -0.42), opacity });
    for (let y = y0 + course, row = 0; y < y1 - 0.2; y += course, row++) {
      const segs = []; let run = null;
      for (let x = x0; x <= x1 + 1e-6; x += 0.5) { const inside = !skip(x, y); if (inside && !run) run = [x, x]; else if (inside) run[1] = x; else if (run) { segs.push(run); run = null; } }
      if (run) segs.push(run);
      for (const [a, b] of segs) if (!rubble || rand(seed + row) > 0.25) this.line([[a, y + (rubble ? (rand(seed + row * 3) - 0.5) * 0.3 : 0), z], [b, y, z]], ink(colour));
      const step = rubble ? 1.6 + rand(seed + row) : 2.6;
      for (let x = x0 + (row % 2 ? step / 2 : 0) + rand(seed + row * 7) * 0.6; x < x1; x += step + rand(seed + x) * (rubble ? 1.4 : 0.4)) {
        if (skip(x, y - course / 2)) continue;
        this.line([[x, y - course, z], [x, y, z]], ink(colour));
      }
    }
    for (let i = 0; i < (x1 - x0) * (y1 - y0) / 18; i++) {
      const x = x0 + rand(seed + i * 13) * (x1 - x0), y = y0 + rand(seed + i * 29) * (y1 - y0);
      if (skip(x, y)) continue;
      const c = this.at(x, y, z);
      this.ink.dot(ellipse(c, (0.5 + rand(seed + i) * 0.5) * this.px, (0.3 + rand(seed + i * 3) * 0.2) * this.px), tone(colour, rand(seed + i * 5) > 0.5 ? -0.12 : 0.08), 0.6);
    }
  }
  /** Whether a face with outward normal `n` (world) is turned toward the camera: n · (kx, ky, -1) > 0. */
  sees(n) { return n[0] * this.kx + n[1] * this.ky - n[2] > 1e-6; }
  /** A face's colour by how it meets the light from the upper left and a little in front: flat shading by facet. */
  lit(colour, n) {
    const L = [-0.55, 0.62, -0.56], l = Math.hypot(...n) || 1, d = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / l;
    return tone(colour, d > 0 ? d * 0.16 : d * 0.3);
  }
  /**
   * An upright prism on a plan polygon (world [x, z] points, any winding), from y0 to y1: every side the camera sees, each
   * lit by its own facing, and its top unless `top` is false. For an octagonal tower, a polygonal apse or a chamfered bay.
   */
  prism(plan, y0, y1, colour, { top = true, outline } = {}) {
    const n = plan.length, cx = plan.reduce((s, p) => s + p[0], 0) / n, cz = plan.reduce((s, p) => s + p[1], 0) / n;
    const faces = [];
    for (let i = 0; i < n; i++) {
      const a = plan[i], b = plan[(i + 1) % n], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      let nx = b[1] - a[1], nz = -(b[0] - a[0]);
      if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
      if (this.sees([nx, 0, nz])) faces.push({ a, b, n: [nx, 0, nz], depth: mz - mx * 0.01 });
    }
    faces.sort((f, g) => g.depth - f.depth);
    for (const f of faces) this.face([[f.a[0], y0, f.a[1]], [f.b[0], y0, f.b[1]], [f.b[0], y1, f.b[1]], [f.a[0], y1, f.a[1]]], this.lit(colour, f.n), outline ? { outline } : {});
    if (top) this.face(plan.map(([x, z]) => [x, y1, z]), tone(colour, 0.12), outline ? { outline } : {});
    return faces;
  }
  /** A pyramid roof on a plan polygon at y0, rising to an apex at (centre, apexY): its seen facets, each lit. */
  pyramid(plan, y0, apexY, colour, { outline } = {}) {
    const n = plan.length, cx = plan.reduce((s, p) => s + p[0], 0) / n, cz = plan.reduce((s, p) => s + p[1], 0) / n, apex = [cx, apexY, cz];
    const faces = [];
    for (let i = 0; i < n; i++) {
      const a = [plan[i][0], y0, plan[i][1]], b = [plan[(i + 1) % n][0], y0, plan[(i + 1) % n][1]];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [apex[0] - a[0], apex[1] - a[1], apex[2] - a[2]];
      let N = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const m = [(a[0] + b[0]) / 2 - cx, 0, (a[2] + b[2]) / 2 - cz];
      if (N[0] * m[0] + N[2] * m[2] + N[1] * 1e-3 < 0) N = N.map(k => -k);
      if (this.sees(N)) faces.push({ pts: [a, b, apex], N, depth: (a[2] + b[2]) / 2 });
    }
    faces.sort((f, g) => g.depth - f.depth);
    for (const f of faces) this.face(f.pts, this.lit(colour, f.N), outline ? { outline } : {});
  }
  /** The outline, on the page, of a set of world points: their convex hull. */
  hull(points) {
    const p = points.map(q => this.at(...q)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
    for (const q of [...p].reverse()) { while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }
  /** An upright cylinder (a drum, a lantern, a post seen close): its hull, shaded to the right. */
  cylinder(cx, cz, r, y0, y1, colour, options = {}) {
    const pts = [];
    for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; for (const y of [y0, y1]) pts.push([cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]); }
    this.ink.shape(path(this.hull(pts)), colour, { off: r * this.px * 0.35, lift: true, outline: LINE.inner + 1, ...options });
    // The top's rim, so the drum reads as round.
    const rim = []; for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI * 2; rim.push([cx + Math.cos(t) * r, y1, cz + Math.sin(t) * r]); }
    this.line(rim, { width: LINE.fine, colour: tone(colour, -0.35), opacity: 0.6 });
  }
  /** A dome of radius r springing at y0 and rising h, centred (cx, cz): its hull, a lit side, and a few ribs. */
  dome(cx, cz, r, y0, h, colour, { ribs = 6 } = {}) {
    const pts = [];
    for (let i = 0; i < 24; i++) for (let j = 0; j <= 6; j++) {
      const t = (i / 24) * Math.PI * 2, phi = (j / 6) * Math.PI / 2;
      pts.push([cx + Math.cos(t) * Math.cos(phi) * r, y0 + Math.sin(phi) * h, cz + Math.sin(t) * Math.cos(phi) * r]);
    }
    this.ink.shape(path(this.hull(pts)), colour, { off: r * this.px * 0.3, lift: true, outline: LINE.inner + 1 });
    for (let k = 0; k < ribs; k++) {
      const t = Math.PI * (1.08 + (k / (ribs - 1)) * 0.84), rib = [];
      for (let j = 0; j <= 8; j++) { const phi = (j / 8) * Math.PI / 2; rib.push([cx + Math.cos(t) * Math.cos(phi) * r, y0 + Math.sin(phi) * h, cz + Math.sin(t) * Math.cos(phi) * r]); }
      this.line(rib, { width: LINE.fine, colour: tone(colour, -0.35), opacity: 0.55 });
    }
  }
  /** A round-headed opening on a plane x = const (a right-hand end), centred at z, sampled so the shear is exact. */
  sideArch(x, cz, y0, w, spring, fill = MATERIAL.opening, { outline = LINE.inner } = {}) {
    const pts = [[x, y0, cz - w / 2], [x, y0, cz + w / 2]];
    for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI; pts.push([x, spring + Math.sin(t) * w / 2, cz + Math.cos(t) * w / 2]); }
    this.face(pts, fill, { outline });
  }
  /** A round-headed opening on a vertical face from world a to world b (plan points), at `t` along it, `w` wide. */
  faceArch(a, b, t, y0, w, spring, fill = MATERIAL.opening, { outline = LINE.fine + 0.6 } = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], at = s => [c[0] + u[0] * s, c[1] + u[1] * s];
    const pts = [[...at(-w / 2), y0], [...at(w / 2), y0]];
    for (let i = 0; i <= 10; i++) { const k = (i / 10) * Math.PI, q = at(Math.cos(k) * w / 2); pts.push([q[0], q[1], spring + Math.sin(k) * w / 2]); }
    this.face(pts.map(([x, z, y]) => [x, y, z]), fill, { outline });
  }
  /** Worn limewash: soft patches where the plaster has come away and the stone shows. */
  wear(x0, x1, y0, y1, z, colour, { seed = 1, count = 6, skip = () => false } = {}) {
    for (let i = 0; i < count; i++) {
      const x = x0 + rand(seed + i * 17) * (x1 - x0), y = y0 + rand(seed + i * 31) * (y1 - y0) * 0.8;
      if (skip(x, y)) continue;
      const c = this.at(x, y, z), rx = (1 + rand(seed + i) * 2.2) * this.px, ry = (0.6 + rand(seed + i * 7) * 1.2) * this.px;
      this.ink.dot(blob([[c[0] - rx, c[1]], [c[0] - rx * 0.3, c[1] - ry], [c[0] + rx, c[1] - ry * 0.4], [c[0] + rx * 0.6, c[1] + ry * 0.6], [c[0] - rx * 0.4, c[1] + ry]]), tone(colour, -0.12), 0.55);
    }
  }
}

/** An Ink for a building frame drawn in page pixels, with the flat shade offset her buildings' shading suggests. */
export const buildingInk = name => new Ink(name, 1, { yUp: false, shadeOffset: 4 });

/**
 * One building frame: world (0, 0, 0) at page point `origin`, drawn by `draw(o, ink)`, anchored on the ground at world
 * `anchor` ([x, z] or [x, z, y], default the origin) - the front of the footprint, as hers are, so nothing is painted below the anchor.
 */
export function buildingFrame(name, { w, h, origin, px, note, logicalHeight, anchor = [0, 0], kx = RECEDE.kx, ky = RECEDE.ky }, draw) {
  const ink = buildingInk(name), o = new Oblique(ink, { origin, px, kx, ky });
  const extra = draw(o, ink);
  const a = o.at(anchor[0], anchor[2] || 0, anchor[1]);
  return { svg: frameSvg({ name, w, h, body: ink.toString(), defs: ink.defs, note }), anchorX: +(a[0] / w).toFixed(4), anchorY: +(a[1] / h).toFixed(4), logicalHeight, extra };
}
export { ellipse, blob, curve };
