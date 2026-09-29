// A tree of the colonies drawn from a description (plan item F6, request 2026-09-19 — the country of 1836), for the kinds
// Astra has not painted: anacua, Texas ebony, tupelo, cedar elm, willow and shortleaf pine. Drawn to sit beside her
// `trees-colonies-1` and `-2` in the map's woods, so it copies what her trees do, read by eye off those sheets
// (docs/evidence/claude-art/land-look.png):
//
//   - a low mound of grass at the foot, a thin dark outline round everything, and light from the upper left;
//   - a stout tapered trunk flaring at the foot, lit down its left side and shaded down its right, with bark marks; limbs
//     that fork up into the crown and show through its gaps;
//   - a crown made of sprays of leaves at the ends of twigs - each leaf outlined, the lit ones to the upper left - so its
//     edge is ragged and leafy and it has holes, with the sprays at the back darker; a pine's sprays are tufts of needles on
//     whorled limbs.
//
// The first version (2026-09-28) built the crown of round outlined masses and read as broccoli on a stick beside her trees;
// this one grows it from the limbs outward. Everything is placed from one seed, so a frame redraws identically. Units are
// source pixels, y down.
const INK = '#23180f', LEAF_INK = '#1f2412', LEAF_EDGE = '#2e3b17';
export const f1 = v => Math.round(v * 10) / 10;
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))).toString(16).padStart(2, '0')).join('');
}
export const quad = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];

/** A tapered limb along a quadratic curve from `a` through control `c` to `b`, widths wa to wb: a closed path. */
export function limbPath(a, c, b, wa, wb, flare = 0) {
  const n = 14, left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = quad(a, c, b, t), q = quad(a, c, b, Math.min(1, t + 0.01)), r = quad(a, c, b, Math.max(0, t - 0.01));
    const dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const w = (wa + (wb - wa) * t) / 2 * (1 + flare * Math.max(0, 1 - t * 6) ** 2);
    left.push([p[0] + nx * w, p[1] + ny * w]); right.push([p[0] - nx * w, p[1] - ny * w]);
  }
  const pts = [...left, ...right.reverse()];
  return `M ${pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L ')} Z`;
}

/** The grass at a tree's foot: a low mound with blades along its top, as her trees stand on. */
export function grassMound(cx, gy, g, R) {
  const out = [`<ellipse cx="${f1(cx)}" cy="${f1(gy - g * 0.1)}" rx="${f1(g)}" ry="${f1(g * 0.26)}" fill="#5f7a32" stroke="${INK}" stroke-width="1.2"/>`];
  for (let i = 0; i < 22; i++) {
    const u = R() * 2 - 1, x = cx + u * g * 0.9, y = gy - g * 0.1 - Math.sqrt(1 - u * u) * g * 0.12 + R() * g * 0.18, hgt = g * (0.14 + R() * 0.16), lean = (R() - 0.5) * g * 0.12;
    out.push(`<path d="M ${f1(x - 1.4)} ${f1(y)} L ${f1(x + lean)} ${f1(y - hgt)} L ${f1(x + 1.4)} ${f1(y)} Z" fill="${R() < 0.5 ? '#7f9a42' : '#9ab456'}"/>`);
  }
  return out.join('');
}

/**
 * spec:
 *   height   the tree's height in pixels, ground to crown top
 *   trunk    { width, top (fractions of height, at the foot and at the fork), lean, bow, stems, spread, flare, fork (height
 *            fraction where the limbs leave), bark, barkLight, barkDark }
 *   crown    { masses: [[x, y, rx, ry] ...] (fractions of height; x from the foot, y up) - the envelope the sprays fill;
 *            clump (a spray's radius, fraction of height), spacing, gaps (share of the envelope left open), colours [dark,
 *            mid, light, highlight], leaf 'broad' | 'fine' | 'narrow' | 'needle', droop, back (share of sprays behind the
 *            limbs), style 'pine' (whorled limbs with tufts along them) }
 *   limbs    main limbs from the fork, fanned through `fan` degrees
 */
export function drawTree(spec, { w, gy, seed }) {
  const R = rng(seed), H = spec.height, cx = w / 2 + (spec.offset || 0) * H;
  const T = spec.trunk, C = spec.crown, out = [];
  const at = (x, y) => [cx + x * H, gy - y * H];
  out.push(grassMound(cx, gy, H * (spec.grass ?? 0.15), R));
  const rc = C.clump * H, inside = (x, y) => C.masses.some(([mx, my, rx, ry]) => ((x - mx) / rx) ** 2 + ((y - my) / ry) ** 2 <= 1);
  const stems = T.stems || 1, limbs = [], nodes = [], sprays = [];
  for (let s = 0; s < stems; s++) {
    const off = stems > 1 ? (s / (stems - 1) - 0.5) * (T.spread || 0.15) : 0;
    const foot = at(off * 0.3, 0), top = at((T.lean || 0) + off, T.fork), ctrl = at((T.lean || 0) * 0.35 + off * 0.3 + (T.bow || 0), T.fork * 0.5);
    const wFoot = T.width * H * (stems > 1 ? 0.72 : 1), wTop = T.top * H * (stems > 1 ? 0.8 : 1);
    limbs.push({ a: foot, c: ctrl, b: top, wa: wFoot, wb: wTop, flare: T.flare ?? 0.6, trunk: true });
    for (let i = 1; i <= 6; i++) nodes.push({ p: quad(foot, ctrl, top, 0.5 + i / 12), w: wTop });
    if (C.style === 'pine') continue;
    const n = spec.limbs ?? 4, fan = (spec.fan ?? 110) * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : i / (n - 1) - 0.5, ang = u * fan + (R() - 0.5) * 0.25 + off * 1.5 + (T.lean || 0) * 0.8, dir = [Math.sin(ang), -Math.cos(ang)];
      let reach = 0;
      for (let d = 0; d < 1.2; d += 0.01) { const q = [top[0] + dir[0] * d * H, top[1] + dir[1] * d * H]; if (inside((q[0] - cx) / H, (gy - q[1]) / H)) reach = d; }
      const len = Math.max(0.08, reach * (0.62 + R() * 0.15)) * H, b = [top[0] + dir[0] * len, top[1] + dir[1] * len];
      const c = [top[0] + dir[0] * len * 0.45 + Math.sign(u) * H * 0.02, top[1] + dir[1] * len * 0.45 - H * 0.03];
      limbs.push({ a: top, c, b, wa: wTop * 0.7, wb: wTop * 0.2 });
      for (let k = 1; k <= 8; k++) nodes.push({ p: quad(top, c, b, k / 8), w: wTop * (0.7 - 0.5 * k / 8) });
    }
  }
  if (C.style === 'pine') {
    // Whorls: a limb each side under each tuft of the crown, rising a little, with tufts along it and at its end.
    const trunk = limbs[0];
    for (const [mx, my, rx] of C.masses) for (const side of [-1, 1]) {
      const t = Math.min(0.97, my / T.fork), p = quad(trunk.a, trunk.c, trunk.b, t), reach = rx * (0.75 + R() * 0.3);
      const e = at(mx + side * reach, my + 0.01 + R() * 0.06), c = [(p[0] + e[0]) / 2, p[1] - H * 0.005];
      limbs.push({ a: p, c, b: e, wa: T.width * H * 0.22 * (1 - t * 0.6), wb: T.width * H * 0.06 });
      // Tufts along the limb, not in a row: some above it, some below, a gap here and there so the limb shows.
      for (const k of [0.3, 0.5, 0.7, 0.88, 1]) if (k === 1 || R() > 0.2) {
        const q = quad(p, c, e, k);
        sprays.push({ p: [q[0] + (R() - 0.5) * rc * 0.5, q[1] + (R() - 0.6) * rc * 0.9], r: rc * (0.7 + 0.35 * k) * (0.8 + R() * 0.4) });
      }
    }
    const crown = quad(trunk.a, trunk.c, trunk.b, 1);
    sprays.push({ p: [crown[0], crown[1] - rc * 0.4], r: rc * 0.9 }, { p: [crown[0] - rc * 0.6, crown[1] + rc * 0.5], r: rc * 0.8 }, { p: [crown[0] + rc * 0.6, crown[1] + rc * 0.5], r: rc * 0.8 });
  } else {
    // Sprays through the envelope, spaced, with holes where a smooth pattern says so (never in the top of the crown).
    const topOf = Math.max(...C.masses.map(m => m[1] + m[3] * 0.6));
    for (let tries = 0; tries < 6000 && sprays.length < 320; tries++) {
      const m = C.masses[Math.floor(R() * C.masses.length)], a = R() * Math.PI * 2, d = Math.sqrt(R());
      const x = m[0] + Math.cos(a) * d * m[2], y = m[1] + Math.sin(a) * d * m[3];
      if (!inside(x, y)) continue;
      const r = rc * (0.8 + R() * 0.4), p = at(x, y);
      if (sprays.some(q => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < (q.r + r) * (C.spacing ?? 0.4))) continue;
      const hole = Math.sin(x * 23 + y * 7 + seed) * Math.sin(y * 19 - x * 5 + seed * 0.3);
      if (hole > 1 - (C.gaps ?? 0.25) * 2 && y < topOf) continue;
      sprays.push({ p, r });
    }
    // A twig to each spray from the nearest point of a limb, preferring one below it.
    for (const s of sprays) {
      let best = null, bd = Infinity;
      for (const n of nodes) { const d = Math.hypot(n.p[0] - s.p[0], n.p[1] - s.p[1]) + Math.max(0, s.p[1] - n.p[1]) * 1.5; if (d < bd) { bd = d; best = n; } }
      if (best && bd > rc * 0.5) limbs.push({ a: best.p, c: [(best.p[0] + s.p[0]) / 2, Math.min(best.p[1], s.p[1]) + (best.p[1] - s.p[1]) * 0.15], b: s.p, wa: Math.max(1.6, best.w * 0.45), wb: 1.2, twig: true });
    }
  }
  for (const s of sprays) s.back = R() < (C.back ?? 0.4);
  sprays.sort((a, b) => a.p[1] - b.p[1]);
  for (const s of sprays.filter(s => s.back)) out.push(spray(s, C, R, -0.14));
  for (const l of limbs) out.push(limb(l, T, R));
  for (const s of sprays.filter(s => !s.back)) out.push(spray(s, C, R, 0));
  // A willow's hanging twigs, from the lower edge of the crown: a thin twig strung with narrow hanging leaves.
  if (C.droop) for (const s of sprays.filter(s => !s.back && R() < C.droop)) {
    const [x, y] = s.p, len = s.r * (1.3 + R() * 1.6), sway = (R() - 0.25) * s.r * 0.5, a = [x, y], c = [x + sway, y + len * 0.6], b = [x + sway * 1.3, y + len];
    out.push(`<path d="M ${f1(x)} ${f1(y)} Q ${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}" fill="none" stroke="${T.barkDark}" stroke-width="0.9"/>`);
    const steps = Math.max(3, Math.round(len / 3.2));
    for (let i = 1; i <= steps; i++) {
      const p = quad(a, c, b, i / steps), side = i % 2 ? 1 : -1, l = 4 + R() * 2.5;
      out.push(`<path d="M ${f1(p[0])} ${f1(p[1])} q ${f1(side * l * 0.45)} ${f1(l * 0.35)} ${f1(side * l * 0.3)} ${f1(l)} q ${f1(-side * l * 0.25)} ${f1(-l * 0.4)} ${f1(-side * l * 0.3)} ${f1(-l)} Z" fill="${R() < 0.5 ? C.colours[2] : C.colours[3]}" stroke="${LEAF_INK}" stroke-width="0.5"/>`);
    }
  }
  return { body: out.join('') };
}

function limb(l, T, R) {
  const d = limbPath(l.a, l.c, l.b, l.wa, l.wb, l.flare || 0);
  if (l.twig) return `<path d="${d}" fill="${T.barkDark}" stroke="${INK}" stroke-width="0.6"/>`;
  const parts = [`<path d="${d}" fill="${T.bark}" stroke="${INK}" stroke-width="${l.trunk ? 1.8 : 1.3}" stroke-linejoin="round"/>`];
  // Lit down the left, in shade down the right, bark marks down the length: dark furrows and a few lit ridges.
  const side = (k, s, wide) => limbPath([l.a[0] + l.wa * k, l.a[1]], [l.c[0] + l.wa * k * 0.8, l.c[1]], [l.b[0] + l.wb * k, l.b[1]], l.wa * wide, l.wb * wide, (l.flare || 0) * s);
  parts.push(`<path d="${side(-0.2, 0.6, 0.38)}" fill="${T.barkLight}" opacity="0.9"/>`, `<path d="${side(0.34, 0.8, 0.22)}" fill="${T.barkDark}" opacity="0.55"/>`);
  const marks = l.trunk ? Math.round(l.wa * 2.2) : Math.round(6 * Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) / 60);
  for (let i = 0; i < marks; i++) {
    const t = R() * 0.95, p = quad(l.a, l.c, l.b, t), wv = (l.wa + (l.wb - l.wa) * t) * (1 + (l.flare || 0) * Math.max(0, 1 - t * 6) ** 2), x = p[0] + (R() - 0.5) * wv * 0.8, len = 3 + R() * (l.trunk ? 10 : 4);
    const lit = R() < 0.3;
    // A pine's bark is in plates: short dark cracks across, as well as along.
    if (l.trunk && T.plates) parts.push(`<path d="M ${f1(x - wv * 0.12)} ${f1(p[1])} l ${f1(wv * 0.24)} ${f1((R() - 0.5) * 2)}" stroke="${T.barkDark}" stroke-width="1" opacity="0.9"/>`);
    parts.push(`<path d="M ${f1(x)} ${f1(p[1])} q ${f1((R() - 0.5) * 3)} ${f1(-len / 2)} ${f1((R() - 0.5) * 1.5)} ${f1(-len)}" fill="none" stroke="${lit ? shade(T.barkLight, 0.2) : T.barkDark}" stroke-width="${f1(lit ? 1 : 1 + R() * 0.8)}" opacity="${lit ? 0.8 : 0.95}"/>`);
  }
  return parts.join('');
}

/**
 * A spray of leaves at the end of a twig: a dark body, and leaves scattered through it pointing outward from its heart, the
 * lit ones (upper left) laid over the shaded ones - clumpy, not a pinwheel.
 */
function spray(s, C, R, depth) {
  const [dark, mid, light, hi] = C.colours.map(col => shade(col, depth)), [x, y] = s.p, r = s.r, parts = [];
  if (C.leaf === 'needle') {
    parts.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 0.72)}" ry="${f1(r * 0.62)}" fill="${dark}" stroke="${LEAF_INK}" stroke-width="1"/>`);
    const needles = [];
    for (let i = 0; i < 34; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * Math.PI * 2, l = r * (0.55 + R() * 0.6), ox = (R() - 0.5) * r * 0.5, oy = (R() - 0.5) * r * 0.4;
      const lit = -(Math.cos(a) * 0.6 + Math.sin(a)) - (ox + oy) / r + (R() - 0.5);
      needles.push({ lit, d: `M ${f1(x + ox)} ${f1(y + oy)} l ${f1(Math.cos(a) * l)} ${f1(Math.sin(a) * l * 0.85)}` });
    }
    needles.sort((a, b) => a.lit - b.lit);
    for (const n of needles) parts.push(`<path d="${n.d}" stroke="${n.lit > 1.4 ? hi : n.lit > 0.3 ? light : n.lit > -0.8 ? mid : LEAF_INK}" stroke-width="1.2" stroke-linecap="round"/>`);
    return `<g>${parts.join('')}</g>`;
  }
  for (let i = 0; i < 3; i++) { const a = R() * Math.PI * 2, d = r * 0.2; parts.push(`<circle cx="${f1(x + Math.cos(a) * d)}" cy="${f1(y + Math.sin(a) * d)}" r="${f1(r * 0.4)}" fill="${dark}"/>`); }
  const n = C.leaves ?? (C.leaf === 'fine' ? 28 : C.leaf === 'narrow' ? 20 : 20), leaves = [];
  for (let i = 0; i < n; i++) {
    const pa = R() * Math.PI * 2, pd = Math.sqrt(R()) * r * 0.62, bx = x + Math.cos(pa) * pd, by = y + Math.sin(pa) * pd * 0.9;
    let a = pa + (R() - 0.5) * 1.6;
    if (C.leaf === 'narrow') a = Math.PI / 2 + (R() - 0.5) * 1.4; // a willow's leaves hang
    const len = r * (C.leaf === 'fine' ? 0.3 : C.leaf === 'narrow' ? 0.55 : 0.42) * (0.75 + R() * 0.5), wid = len * (C.leaf === 'narrow' ? 0.24 : C.leaf === 'fine' ? 0.45 : 0.5);
    const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len, mx = (bx + tx) / 2, my = (by + ty) / 2, nx = -Math.sin(a) * wid / 2, ny = Math.cos(a) * wid / 2;
    const lit = -((bx - x) * 0.8 + (by - y)) / r * 1.6 + (R() - 0.5) * 1.2;
    leaves.push({ lit, d: `M ${f1(bx)} ${f1(by)} Q ${f1(mx + nx)} ${f1(my + ny)} ${f1(tx)} ${f1(ty)} Q ${f1(mx - nx)} ${f1(my - ny)} ${f1(bx)} ${f1(by)} Z` });
  }
  leaves.sort((a, b) => a.lit - b.lit);
  for (const l of leaves) parts.push(`<path d="${l.d}" fill="${l.lit > 0.9 ? hi : l.lit > 0 ? light : l.lit > -0.8 ? mid : dark}" stroke="${LEAF_EDGE}" stroke-width="0.45" stroke-linejoin="round"/>`);
  return `<g>${parts.join('')}</g>`;
}
