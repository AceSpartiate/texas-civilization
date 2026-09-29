// A felled tree's stump, in the style of Astra's `stump-post-oak` (plan item F6): the cut face an ellipse seen from a little
// above (sapwood ring, heartwood, growth rings, a check across it), the bark sides deeply ridged and running down into
// root buttresses that splay over the ground in front, moss on the bark, tufts of grass between the roots. Species differ
// in bark (ridges, loose strips, diamond furrows, blocks) and wood (pale, tan and rayed, dark-hearted).
import { rng, shade, f1 } from './tree.mjs';

const INK = '#23180f';
const path = pts => `M ${pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L ')}`;

/** spec: { width, height (of the sides), bark, barkLight, barkDark, sap, heart, heartShare, rings, roots, shaggy, diamond, ridges, rays } */
export function drawStump(spec, { w, gy, seed }) {
  const R = rng(seed), cx = w / 2, rw = spec.width / 2, top = gy - spec.height, ry = rw * 0.36, out = [];
  // The body: straight-sided under the cut, flaring into its roots toward the ground; the foot of it scalloped, a root at
  // each point and a hollow between.
  const bodyY = y => rw * (1 + 0.75 * Math.max(0, (y - top) / spec.height) ** 2.4);
  const left = [], right = [], foot = [], roots = spec.roots ?? 5;
  for (let i = 0; i <= 12; i++) { const y = top + (gy - 6 - top) * i / 12; left.push([cx - bodyY(y), y]); right.push([cx + bodyY(y), y]); }
  const B = bodyY(gy - 6);
  for (let k = 0; k < roots; k++) {
    const u = k / (roots - 1) * 2 - 1, x = cx + u * (B + 6);
    foot.push([x + (R() - 0.5) * 6, gy + 2 - Math.abs(u) * 3 + R() * 2]);
    if (k < roots - 1) foot.push([cx + ((k + 0.5) / (roots - 1) * 2 - 1) * B * 0.9, gy - 9 - R() * 5]);
  }
  const body = `${path([...left, ...foot, ...right.reverse()])} Z`;
  out.push(`<path d="${body}" fill="${spec.bark}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`);
  out.push(`<path d="${path([[cx - rw * 0.96, top + 2], [cx - rw * 1.02, top + spec.height * 0.5], [cx - B * 0.95, gy - 4], [cx - B * 0.35, gy - 8], [cx - rw * 0.4, top + 4]])} Z" fill="${spec.barkLight}" opacity="0.75"/>`);
  out.push(`<path d="${path([[cx + rw * 0.5, top + 4], [cx + B * 0.4, gy - 8], [cx + B * 0.95, gy - 4], [cx + rw * 1.02, top + spec.height * 0.5], [cx + rw * 0.97, top + 2]])} Z" fill="${spec.barkDark}" opacity="0.5"/>`);
  // Bark: ridges down the sides, dark furrows between lit ridges; a hickory's strips peel away, an ash's cross in diamonds.
  const ridges = spec.ridges ?? 9;
  for (let i = 0; i < ridges * 2; i++) {
    const u = (i + 0.5) / (ridges * 2) * 2 - 1, pts = [];
    for (let k = 0; k <= 7; k++) { const y = top + ry * Math.sqrt(Math.max(0, 1 - u * u)) * 0.95 + (gy - 3 - top - ry * 0.5) * k / 7; pts.push([cx + u * bodyY(y) * 0.95 + (R() - 0.5) * (spec.diamond ? 5 : 2.4), y]); }
    const lit = i % 2 === 1;
    out.push(`<path d="${path(pts)}" fill="none" stroke="${lit ? shade(spec.barkLight, 0.15) : spec.barkDark}" stroke-width="${lit ? 1.4 : spec.shaggy ? 2.4 : 1.8}" stroke-linecap="round" opacity="${lit ? (u < 0.2 ? 0.8 : 0.35) : 0.9}"/>`);
    if (spec.shaggy && !lit && R() < 0.55) {
      const p = pts[2 + Math.floor(R() * 3)];
      out.push(`<path d="M ${f1(p[0])} ${f1(p[1])} q ${f1(4 + R() * 3)} 3 ${f1(3 + R() * 3)} ${f1(12 + R() * 6)}" fill="none" stroke="${spec.barkLight}" stroke-width="2.6" stroke-linecap="round"/><path d="M ${f1(p[0] + 1.5)} ${f1(p[1] + 1)} q 4 3 3 13" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.8"/>`);
    }
  }
  if (spec.diamond) for (let i = 0; i < 10; i++) { const x = cx + (R() - 0.5) * rw * 1.6, y = top + ry + R() * (spec.height - ry - 10); out.push(`<path d="M ${f1(x - 4)} ${f1(y)} l 4 -3 l 4 3" fill="none" stroke="${spec.barkDark}" stroke-width="1.2"/>`); }
  // Moss on the bark, low and to the shaded side.
  for (let i = 0; i < 4; i++) {
    const x = cx + (R() * 1.4 - 0.4) * rw, y = gy - 8 - R() * spec.height * 0.55, s = 4 + R() * 5;
    out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s)}" ry="${f1(s * 0.7)}" fill="#6c7f34" opacity="0.85"/><circle cx="${f1(x - s * 0.3)}" cy="${f1(y - s * 0.2)}" r="${f1(s * 0.35)}" fill="#98a94e" opacity="0.8"/>`);
  }
  // The cut face.
  out.push(`<ellipse cx="${f1(cx)}" cy="${f1(top)}" rx="${f1(rw)}" ry="${f1(ry)}" fill="${spec.barkDark}" stroke="${INK}" stroke-width="2.2"/>`);
  out.push(`<ellipse cx="${f1(cx)}" cy="${f1(top)}" rx="${f1(rw * 0.9)}" ry="${f1(ry * 0.84)}" fill="${spec.sap}"/>`);
  const hs = spec.heartShare ?? 0.7;
  out.push(`<ellipse cx="${f1(cx - rw * 0.02)}" cy="${f1(top)}" rx="${f1(rw * hs)}" ry="${f1(ry * hs * 0.94)}" fill="${spec.heart}"/>`);
  for (let i = 1; i <= (spec.rings ?? 6); i++) {
    const s = i / ((spec.rings ?? 6) + 1) * 0.86;
    out.push(`<ellipse cx="${f1(cx - rw * 0.03 + (R() - 0.5) * 1.5)}" cy="${f1(top + (R() - 0.5))}" rx="${f1(rw * s)}" ry="${f1(ry * s * 0.94)}" fill="none" stroke="${shade(spec.heart, -0.3)}" stroke-width="0.9" opacity="0.7"/>`);
  }
  if (spec.rays) for (let i = 0; i < 10; i++) { const a = R() * Math.PI * 2, d0 = 0.15 + R() * 0.2, d1 = 0.55 + R() * 0.3; out.push(`<path d="M ${f1(cx + Math.cos(a) * rw * d0)} ${f1(top + Math.sin(a) * ry * d0)} L ${f1(cx + Math.cos(a) * rw * d1)} ${f1(top + Math.sin(a) * ry * d1)}" stroke="${shade(spec.heart, 0.25)}" stroke-width="0.9" opacity="0.8"/>`); }
  out.push(`<path d="M ${f1(cx + rw * 0.05)} ${f1(top - ry * 0.1)} L ${f1(cx + rw * 0.55)} ${f1(top + ry * 0.35)}" stroke="${INK}" stroke-width="1.2" opacity="0.7"/>`);
  out.push(`<path d="M ${f1(cx - rw * 0.85)} ${f1(top + ry * 0.2)} A ${f1(rw * 0.88)} ${f1(ry * 0.82)} 0 0 1 ${f1(cx + rw * 0.2)} ${f1(top - ry * 0.82)}" fill="none" stroke="${shade(spec.sap, 0.4)}" stroke-width="1.6" opacity="0.85"/>`);
  // Tufts of grass between the roots and at the sides.
  for (let i = 0; i < 6; i++) {
    const x = cx + (i / 5 - 0.5) * rw * 3.4 + (R() - 0.5) * 10, y = gy + 1 - R() * 3;
    for (let k = 0; k < 6; k++) { const l = 5 + R() * 8, a = -Math.PI / 2 + (k / 5 - 0.5) * 1.6; out.push(`<path d="M ${f1(x - 1.5)} ${f1(y)} L ${f1(x + Math.cos(a) * l)} ${f1(y + Math.sin(a) * l)} L ${f1(x + 1.5)} ${f1(y)} Z" fill="${k % 2 ? '#7f9a42' : '#5f7a32'}" stroke="${INK}" stroke-width="0.4"/>`); }
  }
  return { body: out.join('') };
}
