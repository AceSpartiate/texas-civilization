// SVG helpers every Claude-drawn frame is built from: the olive-brown outline, flat shading with the light from the upper
// left, and the frame wrapper that puts the ground anchor where the manifest says it is. Shapes are made in whatever units
// the caller draws in (the person rig uses rig units, y up; a prop may use pixels) and outlined in source pixels.
import { LINE, LIGHT, tone } from './style.mjs';

export const f2 = v => Math.round(v * 100) / 100;
export const pt = ([x, y]) => `${f2(x)} ${f2(y)}`;
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, s) => [a[0] * s, a[1] * s];
export const len = a => Math.hypot(a[0], a[1]);
export const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const perp = a => [-a[1], a[0]];
export const deg = d => d * Math.PI / 180;
/** A direction `a` degrees from straight down, turning toward +x (forward) as `a` grows; y is up. */
export const down = a => [Math.sin(deg(a)), -Math.cos(deg(a))];
/** A direction `a` degrees from straight up, turning toward +x as `a` grows. */
export const up = a => [Math.sin(deg(a)), Math.cos(deg(a))];

/** A limb: a tapered capsule from `a` (radius ra) to `b` (radius rb), as one closed path. */
export function capsule(a, b, ra, rb = ra) {
  const d = norm(sub(b, a)), n = perp(d);
  const a1 = add(a, mul(n, ra)), a2 = add(a, mul(n, -ra)), b1 = add(b, mul(n, rb)), b2 = add(b, mul(n, -rb));
  return `M ${pt(a1)} L ${pt(b1)} A ${f2(rb)} ${f2(rb)} 0 0 0 ${pt(b2)} L ${pt(a2)} A ${f2(ra)} ${f2(ra)} 0 0 0 ${pt(a1)} Z`;
}
/** A closed smooth blob through points (a Catmull-Rom loop as cubic Béziers). */
export function blob(points, tension = 1) {
  const n = points.length, parts = [`M ${pt(points[0])}`];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1 = add(p1, mul(sub(p2, p0), tension / 6)), c2 = sub(p2, mul(sub(p3, p1), tension / 6));
    parts.push(`C ${pt(c1)} ${pt(c2)} ${pt(p2)}`);
  }
  return parts.join(' ') + ' Z';
}
/** An open smooth line through points. */
export function curve(points, tension = 1) {
  const n = points.length, parts = [`M ${pt(points[0])}`];
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(n - 1, i + 2)];
    const c1 = add(p1, mul(sub(p2, p0), tension / 6)), c2 = sub(p2, mul(sub(p3, p1), tension / 6));
    parts.push(`C ${pt(c1)} ${pt(c2)} ${pt(p2)}`);
  }
  return parts.join(' ');
}
export const poly = points => `M ${points.map(pt).join(' L ')} Z`;
export const ellipse = ([cx, cy], rx, ry, rot = 0) => {
  const c = Math.cos(deg(rot)), s = Math.sin(deg(rot));
  const p = t => [cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c];
  return blob([0, 1, 2, 3, 4, 5, 6, 7].map(i => p(i * Math.PI / 4)), 1.1);
};

/**
 * A drawing context: collects shapes back to front, keeps ids unique within the frame (every frame of a sheet is inlined in
 * one page), and knows how many drawing units make a source pixel so the outline is always LINE.outer source pixels thick.
 */
export class Ink {
  constructor(prefix, pxPerUnit = 1, { yUp = true, shadeOffset } = {}) { this.yUp = yUp; this.shadeOffset = shadeOffset; this.prefix = prefix.replace(/[^a-z0-9-]/gi, '-'); this.k = pxPerUnit; this.parts = []; this.defs = []; this.n = 0; }
  id(what) { return `${this.prefix}-${what}-${this.n++}`; }
  w(px) { return f2(px / this.k); }
  /** A filled shape with the flat shade to its lower right (light from the upper left) and the outline over both. */
  shape(d, fill, { shade = true, outline = LINE.outer, lift = false, opacity, off: offset } = {}) {
    if (!fill) { this.line(d, { width: outline }); return; }
    const o = opacity != null ? ` opacity="${opacity}"` : '';
    if (shade) {
      const clip = this.id('c');
      this.defs.push(`<clipPath id="${clip}"><path d="${d}"/></clipPath>`);
      // Shade the whole shape, then lay the lit colour over it moved toward the light: the crescent left uncovered on the far
      // side is the shade. A second, smaller lift on the near side is the highlight her flat shading has on round forms.
      const off = offset ?? this.shadeOffset ?? 1.2;
      this.parts.push(`<g clip-path="url(#${clip})"${o}><path d="${d}" fill="${tone(fill, LIGHT.shade)}"/><path d="${d}" fill="${fill}" transform="translate(${f2(-off * 0.55)} ${f2(this.yUp ? off : -off)})"/>${lift ? `<path d="${d}" fill="${tone(fill, LIGHT.lift)}" transform="translate(${f2(-off * 1.4)} ${f2(this.yUp ? off * 2.2 : -off * 2.2)})" opacity="0.55"/>` : ''}</g>`);
    } else this.parts.push(`<path d="${d}" fill="${fill}"${o}/>`);
    if (outline) this.parts.push(`<path d="${d}" fill="none" stroke="${LINE.ink}" stroke-width="${this.w(outline)}" stroke-linejoin="round"/>`);
  }
  /** An unfilled line: a seam, a fold, a haft's edge. */
  line(d, { width = LINE.inner, colour = LINE.ink, cap = 'round', opacity } = {}) {
    this.parts.push(`<path d="${d}" fill="none" stroke="${colour}" stroke-width="${this.w(width)}" stroke-linecap="${cap}" stroke-linejoin="round"${opacity != null ? ` opacity="${opacity}"` : ''}/>`);
  }
  /** A flat dot or patch with no outline (an eye, a highlight, a knot). */
  dot(d, fill, opacity) { this.parts.push(`<path d="${d}" fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ''}/>`); }
  raw(svg) { this.parts.push(svg); }
  toString() { return this.parts.join(''); }
}

/**
 * One frame's SVG document at `w` by `h` source pixels: the drawing's groups, a header comment saying what it is and that
 * Claude drew it, and the grain filter from svg/_shared-defs.svg (inlined once per sheet by the build).
 */
export function frameSvg({ name, w, h, body, defs = [], note }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <!-- ${name}: ${note}
       Claude-drawn stand-in (temporary: replace with Astra's ${name}). Generated by scripts/claude-art/; do not hand-edit. -->
  <defs>${defs.join('')}</defs>
  <g filter="url(#grain)" stroke-linejoin="round" stroke-linecap="round">${body}</g>
</svg>
`;
}
