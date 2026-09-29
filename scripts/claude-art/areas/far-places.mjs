// Places of the colonies the library has no picture of, drawn by Claude as temporary stand-ins (owner, 2026-09-28: "make all
// of the remaining art. yours will be temporary. label yours so astra can replace as it makes the final versions"):
//   - E10 the Mexican advance's places as map cutouts, the form public/place-art.js gives the places past the box:
//         `plantation-sugar` (Stafford's), `blockhouse-village` (the Old Fort), `townsite-bay` (New Washington),
//         `tavern-house` (Mrs. Powell's) - request 2026-09-26, the Mexican advance, item 4 (docs/MAP_ACCURACY.md §14)
//   - E12 three buildings the towns' research found: `fort-velasco`, `sawmill-steam` (Harrisburg), `stone-house-nacogdoches`
//         - request 2026-09-16, the buildings the towns' research found, items 8-10 (docs/town-research/)
//
// Drawn procedurally in the view of her building sheets (scripts/claude-art/kit/oblique.mjs); every frame's prompt says what
// is documented, what is inferred and what is not known, and names its sources.

import { LINE, tone } from '../kit/style.mjs';
import { MATERIAL, buildingFrame, rand, path, blob } from '../kit/oblique.mjs';

export const AREA = 'places';
export const DATE = '2026-09-28';

const building = buildingFrame;

// ------------------------------------------------------------------------------------------------------ pieces of building
const LOG = '#8a6440', LOG_END = '#d2a870', PLANK = '#8d6c48', PLANK_GREY = '#8f8472', IRONSTONE = '#8e5d3c', BRICK = '#9a4b31';
const SHINGLE = MATERIAL.shingle, CLAP = '#b59470';

/** Horizontal log courses on a front face, with the logs' round ends at the corners - her `house-hewn-log` texture, lighter. */
function logCourses(o, x0, x1, y0, y1, z, { ends = true } = {}) {
  for (let y = y0 + 1; y < y1 - 0.2; y += 1) o.line([[x0, y, z], [x1, y, z]], { width: LINE.fine, colour: tone(LOG, -0.45), opacity: 0.75 });
  if (ends) for (let y = y0 + 0.5; y < y1; y += 1) for (const x of [x0, x1]) { const c = o.at(x, y, z); o.ink.shape(`M ${c[0] - 0.45 * o.px} ${c[1]} a ${0.45 * o.px} ${0.45 * o.px} 0 1 0 ${0.9 * o.px} 0 a ${0.45 * o.px} ${0.45 * o.px} 0 1 0 ${-0.9 * o.px} 0 Z`, LOG_END, { shade: false, outline: LINE.fine }); }
}
/** Upright boards on a front face. */
function boards(o, x0, x1, y0, y1, z, colour, step = 1) {
  for (let x = x0 + step; x < x1 - 0.1; x += step) o.line([[x, y0 + 0.1, z], [x, y1 - 0.1, z]], { width: LINE.fine, colour: tone(colour, -0.45), opacity: 0.7 });
}
/**
 * A house: walls x0..x1 by z0..z1 to `eave`, a gable roof to `ridge` running east and west. `wall` is 'log', 'plank',
 * 'stone' (with a colour) or 'frame'; doors and windows on the front; a stick-and-mud or stone chimney at either end.
 */
function house(o, { x0, x1, z0, z1, eave, ridge, wall = 'log', colour, roof = SHINGLE, doors = [], windows = [], chimneys = [], over = 1, seed = 1, courses = 4 }) {
  const fill = colour || (wall === 'log' ? LOG : wall === 'plank' ? PLANK : wall === 'frame' ? CLAP : IRONSTONE);
  for (const c of chimneys.filter(c => c.side === 'left')) chimney(o, x0 - 2.2, x0, (z0 + z1) / 2, ridge + 1.5, c.kind);
  o.box({ x0, x1, z0, z1, y1: eave }, fill, { top: false });
  if (wall === 'log') logCourses(o, x0, x1, 0, eave, z0);
  else if (wall === 'plank') boards(o, x0, x1, 0, eave, z0, fill);
  else if (wall === 'frame') for (let y = 0.8; y < eave; y += 0.8) o.line([[x0, y, z0], [x1, y, z0]], { width: LINE.fine, colour: tone(fill, -0.35), opacity: 0.6 });
  else o.masonry(x0, x1, 0, eave, z0, fill, { course: 1.4, seed, rubble: true, opacity: 0.55 });
  for (const d of doors) o.rect(d.x, 0, d.w || 3, d.h || 6.5, z0, MATERIAL.door, { boards: 3, lintel: 0.3 });
  for (const w of windows) o.rect(w.x, w.y ?? 3, w.w || 2.2, w.h || 2.4, z0, w.dark ? MATERIAL.opening : '#5d4a36', { lintel: 0.25, sill: 0.3, bars: w.bars || 0 });
  o.gable({ x0, x1, z0, z1, eave, ridge, over }, roof, wall === 'stone' || wall === 'log' ? CLAP : fill, { courses });
  for (const c of chimneys.filter(c => c.side === 'right')) chimney(o, x1, x1 + 2.2, (z0 + z1) / 2, ridge + 1.5, c.kind);
}
function chimney(o, x0, x1, zc, top, kind = 'stick', y0 = 0) {
  const colour = kind === 'brick' ? BRICK : kind === 'stone' ? tone(MATERIAL.limestone, -0.15) : '#a0784c';
  o.box({ x0, x1, z0: zc - 1.2, z1: zc + 1.2, y0, y1: top }, colour);
  if (kind === 'stick') for (let y = 1.2; y < top; y += 1.3) o.line([[x0, y, zc - 1.2], [x1, y, zc - 1.2]], { width: LINE.fine, colour: tone(colour, -0.4), opacity: 0.7 });
}
/** A log lying east-west from x0 to x1, its cut end to the right. */
function logX(o, x0, x1, y, z, r, bark = LOG) {
  const pts = [];
  for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; for (const x of [x0, x1]) pts.push([x, y + r + Math.sin(t) * r, z + Math.cos(t) * r]); }
  o.ink.shape(path(o.hull(pts)), bark, { off: r * o.px * 0.4, outline: LINE.inner });
  const end = []; for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; end.push([x1, y + r + Math.sin(t) * r, z + Math.cos(t) * r]); }
  o.face(end, LOG_END, { outline: LINE.fine + 0.4 });
}
/** A post, square and sharpened or flat-topped, standing at (x, z) to height h, leaning by `lean` feet at its top. */
function post(o, x, z, h, { r = 0.5, colour = '#7a5a3a', sharp = true, lean = 0 } = {}) {
  const t = sharp ? 0.9 : 0;
  o.face([[x - r, 0, z], [x + r, 0, z], [x + r + lean, h - t, z], [x + lean, h, z], [x - r + lean, h - t, z]], colour, { outline: LINE.fine + 0.5 });
  o.face([[x + r, 0, z], [x + r, 0, z + r * 2], [x + r + lean, h - t, z + r * 2], [x + r + lean, h - t, z]], tone(colour, -0.25), { outline: LINE.fine + 0.2 });
}
/** A worm (zigzag) rail fence along x at z. */
function railFence(o, x0, x1, z) {
  for (let x = x0; x < x1; x += 5) {
    const zz = z + ((x - x0) / 5) % 2 * 1.2;
    for (const y of [0.8, 1.9, 3]) o.line([[x, y, zz], [x + 5, y, z + ((x + 5 - x0) / 5) % 2 * 1.2]], { width: LINE.inner + 0.8, colour: '#6e5234' });
  }
}
/** An open shed on posts with a shed roof, lower toward the front. */
function openShed(o, { x0, x1, z0, z1, high, low, colour = PLANK, roof = SHINGLE, backWall = true }) {
  if (backWall) o.face([[x0, 0, z1], [x1, 0, z1], [x1, high, z1], [x0, high, z1]], tone(colour, -0.15));
  if (backWall) boards(o, x0, x1, 0, high, z1, colour, 1.2);
  o.face([[x1, 0, z0], [x1, 0, z1], [x1, high, z1], [x1, low, z0]], tone(colour, -0.28));
  for (const x of [x0, (x0 + x1) / 2, x1]) post(o, x, z0, low, { r: 0.35, sharp: false, colour: '#6e5234' });
  o.face([[x0 - 0.8, low - 0.2, z0 - 0.8], [x1 + 0.8, low - 0.2, z0 - 0.8], [x1 + 0.8, high + 0.2, z1 + 0.4], [x0 - 0.8, high + 0.2, z1 + 0.4]], roof);
}

// ------------------------------------------------------------------------------------------------------------ E12 buildings
/**
 * Fort Velasco in October 1835: the 1832 Mexican work, three and a half years derelict (docs/town-research/velasco.md §3):
 * a small circle about ninety feet across of two rows of sharpened posts six feet apart filled with sand, earth and shell, a
 * banquette inside, a central mound about ten feet high revetted with higher posts and carrying a long gun on a pivot behind
 * a low wooden parapet, and a silted ditch - its palisade robbed for timber in long gaps.
 */
function fortVelasco(o) {
  const C = [0, 0], SAND = '#d8c08c', SAND_TOP = '#e2cf9f', GRASSY = '#b7a878';
  const ring = (r, y = 0, n = 48) => Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [C[0] + Math.cos(t) * r, y, C[1] + Math.sin(t) * r]; });
  // The glacis and the silted ditch round it, then the floor inside.
  o.ink.shape(path(o.hull(ring(53))), GRASSY, { shade: false, outline: LINE.fine + 0.6 });
  o.ink.shape(path(o.hull(ring(50.5))), '#a89868', { shade: false, outline: LINE.fine });
  o.ink.shape(path(o.hull(ring(47.5))), tone(SAND, -0.05), { shade: false, outline: 0 });
  o.ink.shape(path(o.hull(ring(38.5, 0.6))), '#d6c393', { shade: false, outline: LINE.fine + 0.4 });
  // Where the palisade was robbed: arcs (degrees, 0 east, 90 north) with no posts, the sand fill slumped and spilled.
  const robbedOuter = [[18, 58], [128, 150], [205, 232], [296, 318]], robbedInner = [[25, 48], [120, 160], [300, 330], [215, 222]];
  const gone = (arcs, deg) => arcs.some(([a, b]) => deg >= a && deg <= b);
  const N = 72, items = [];
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2, deg = ((i + 0.5) / N) * 360;
    const slump = gone(robbedOuter, deg), top = slump ? 2.2 + rand(i) * 1.2 : 5.4;
    const P = (r, t, y) => [C[0] + Math.cos(t) * r, y, C[1] + Math.sin(t) * r];
    const zc = C[1] + Math.sin((t0 + t1) / 2) * 42;
    items.push({ z: zc, draw: () => {
      const outR = slump ? 47 : 44.8, inR = 39.4;
      const nOut = [Math.cos((t0 + t1) / 2), 0, Math.sin((t0 + t1) / 2)];
      if (o.sees(nOut.map(k => -k))) o.face([P(inR, t0, 0.6), P(inR, t1, 0.6), P(inR, t1, top), P(inR, t0, top)], tone(SAND, -0.12), { outline: LINE.fine });
      o.face([P(inR, t0, top), P(inR, t1, top), P(outR - (slump ? 3 : 0), t1, top), P(outR - (slump ? 3 : 0), t0, top)], SAND_TOP, { outline: 0 });
      if (o.sees(nOut)) o.face([P(outR, t0, 0), P(outR, t1, 0), P(outR - (slump ? 3 : 0), t1, top), P(outR - (slump ? 3 : 0), t0, top)], o.lit(SAND, nOut), { outline: LINE.fine });
    } });
    // Posts, two to a segment a row, missing where robbed; a few leaning or broken short.
    for (const [r, h, arcs] of [[45, 8.6, robbedOuter], [39, 7, robbedInner]]) for (const k of [0.25, 0.75]) {
      const t = t0 + (t1 - t0) * k, d = (t / (Math.PI * 2)) * 360, s = i * 7 + k * 3 + r;
      if (gone(arcs, d) && rand(s) > 0.12) continue;
      const broken = rand(s + 1) < 0.14, lean = (rand(s + 2) - 0.5) * (broken ? 0 : 1.4);
      const x = C[0] + Math.cos(t) * r, z = C[1] + Math.sin(t) * r;
      items.push({ z: z - 0.01, draw: () => post(o, x - 0.45, z, broken ? h * (0.4 + rand(s + 3) * 0.3) : h - rand(s + 4) * 0.8, { r: 0.55, lean, sharp: !broken, colour: tone('#7d6446', (rand(s + 5) - 0.5) * 0.25) }) });
    }
  }
  // The central mound, revetted with higher posts, the gun on its pivot behind a low wooden parapet.
  items.push({ z: C[1], draw: () => {
    const mound = [...ring(13, 0.6, 32), ...ring(9.5, 10, 32)];
    o.ink.shape(path(o.hull(mound)), SAND, { off: 10, outline: LINE.inner });
    o.ink.shape(path(o.hull(ring(9.5, 10, 32))), SAND_TOP, { shade: false, outline: LINE.fine + 0.4 });
    const parapet = [...ring(8.8, 10, 32), ...ring(8.8, 12, 32)];
    o.ink.shape(path(o.hull(parapet)), MATERIAL.timberLight, { shade: false, outline: LINE.fine + 0.4 });
    o.ink.shape(path(o.hull(ring(8.4, 12, 32))), tone(SAND_TOP, -0.06), { shade: false, outline: LINE.fine });
    // The pivot carriage and the long gun, laid toward the sea (south-east, to the right and toward the camera).
    o.box({ x0: -2.2, x1: 2.2, z0: C[1] - 1.6, z1: C[1] + 1.6, y0: 12, y1: 13.2 }, MATERIAL.timber);
    const a = o.at(-2.5, 14, C[1] + 0.8), b = o.at(8.5, 14.2, C[1] - 3.2), r0 = 0.95 * o.px, r1 = 0.6 * o.px;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), n = [-dy / L, dx / L];
    o.ink.shape(`M ${a[0] + n[0] * r0} ${a[1] + n[1] * r0} L ${b[0] + n[0] * r1} ${b[1] + n[1] * r1} L ${b[0] - n[0] * r1} ${b[1] - n[1] * r1} L ${a[0] - n[0] * r0} ${a[1] - n[1] * r0} Z`, MATERIAL.iron, { off: 2, outline: LINE.inner });
    // The revetment's higher posts round the mound's shoulder, on the side the camera sees.
    for (let k = 0; k < 20; k++) {
      const t = Math.PI * (1 + k / 19), x = C[0] + Math.cos(t) * 12.2, z = C[1] + Math.sin(t) * 12.2;
      if (rand(k + 90) < 0.2) continue;
      post(o, x - 0.4, z, 5.2 + rand(k) * 0.6, { r: 0.45, sharp: true, colour: '#7d6446' });
    }
  } });
  items.sort((a, b) => b.z - a.z).forEach(item => item.draw());
  // Tufts of grass come up in the sand of a work nobody has kept for three years.
  for (let i = 0; i < 26; i++) {
    const t = rand(i * 3) * Math.PI * 2, r = 40 + rand(i * 5) * 12, c = o.at(C[0] + Math.cos(t) * r, 0.2, C[1] + Math.sin(t) * r);
    if (Math.sin(t) > 0.1 && r < 47) continue;
    o.ink.line(`M ${c[0] - 3} ${c[1]} l 2 -5 M ${c[0]} ${c[1]} l 0 -6 M ${c[0] + 3} ${c[1]} l -1 -5`, { width: LINE.fine, colour: '#5e6b34' });
  }
}

/**
 * The Harrisburg steam mills in the autumn of 1835 (docs/town-research/harrisburg.md §5): nothing records the building, so
 * this is a period steam sawmill - a long plank shed with the saw floor open to the front, a boiler house with its stack, a
 * deck of pine logs and stacks of sawn boards.
 */
function sawmill(o) {
  // The boiler house and its stack, behind and to the right.
  house(o, { x0: 30, x1: 44, z0: 18, z1: 32, eave: 9, ridge: 14, wall: 'plank', courses: 2 });
  const sx = 38, sz = 25;
  o.box({ x0: sx - 1.3, x1: sx + 1.3, z0: sz - 1.3, z1: sz + 1.3, y0: 12, y1: 36 }, BRICK);
  for (let y = 14; y < 36; y += 2.2) o.line([[sx - 1.3, y, sz - 1.3], [sx + 1.3, y, sz - 1.3]], { width: LINE.fine, colour: tone(BRICK, -0.4), opacity: 0.6 });
  o.box({ x0: sx - 1.7, x1: sx + 1.7, z0: sz - 1.7, z1: sz + 1.7, y0: 36, y1: 37.2 }, tone(BRICK, -0.1));
  // A little smoke from the stack: the mills were "in working order" all that autumn.
  const s = o.at(sx, 38.5, sz);
  for (const [dx, dy, r] of [[2, -4, 9], [12, -12, 12], [26, -18, 10]]) o.ink.shape(blob([[s[0] + dx - r, s[1] + dy], [s[0] + dx - r * 0.3, s[1] + dy - r * 0.8], [s[0] + dx + r * 0.7, s[1] + dy - r * 0.6], [s[0] + dx + r, s[1] + dy + r * 0.2], [s[0] + dx, s[1] + dy + r * 0.7]]), '#c9c3b6', { shade: false, outline: LINE.fine + 0.4 });
  // The long mill shed: plank walls, the saw floor open to the front, a log on the carriage inside.
  const X0 = -30, X1 = 28, Z0 = 14, Z1 = 36, EAVE = 11, RIDGE = 19;
  o.box({ x0: X0, x1: X1, z0: Z0, z1: Z1, y1: EAVE }, PLANK_GREY, { top: false });
  boards(o, X0, X1, 0, EAVE, Z0, PLANK_GREY, 1.2);
  o.face([[-16, 1.2, Z0], [12, 1.2, Z0], [12, 9, Z0], [-16, 9, Z0]], '#3a2b1e', { outline: LINE.inner });
  logX(o, -14, 6, 2.6, Z0 + 3, 1.2, '#7a5634');
  o.box({ x0: -15, x1: 8, z0: Z0 + 1.5, z1: Z0 + 4.5, y0: 1.2, y1: 2.6 }, MATERIAL.timber);
  o.face([[-2, 2.6, Z0 + 2], [-1.2, 2.6, Z0 + 2], [-1.2, 8.8, Z0 + 2], [-2, 8.8, Z0 + 2]], '#8a8a84', { outline: LINE.fine });
  for (const x of [-16, -2, 12]) post(o, x - 0.4, Z0 - 0.05, 9.2, { r: 0.45, sharp: false, colour: '#6e5a42' });
  o.rect(21, 0, 3, 6.8, Z0, MATERIAL.door, { boards: 3 });
  o.gable({ x0: X0, x1: X1, z0: Z0, z1: Z1, eave: EAVE, ridge: RIDGE, over: 1.2 }, SHINGLE, PLANK_GREY, { courses: 4 });
  // The log deck: pine logs on skids beside the saw floor, the ramp up to it.
  for (const [x0, x1, y, z] of [[-34, -12, 0, 5], [-33, -13, 0, 7.8], [-35, -14, 0, 10.6], [-33.5, -13, 2.4, 6.4], [-34, -14, 2.4, 9.2]]) logX(o, x0, x1, y, z, 1.25, tone(LOG, (rand(x0 + z) - 0.5) * 0.2));
  // Stacks of sawn boards, stickered to dry.
  for (const [x0, z0, h] of [[4, 3, 4.6], [16, 5, 3.4]]) {
    o.box({ x0, x1: x0 + 10, z0, z1: z0 + 5, y1: h }, '#d0ad78');
    for (let y = 0.45; y < h; y += 0.45) o.line([[x0, y, z0], [x0 + 10, y, z0]], { width: LINE.fine, colour: '#8f6d42', opacity: 0.8 });
    for (const x of [x0 + 1, x0 + 5, x0 + 9]) for (let y = 0.9; y < h; y += 0.9) o.face([[x - 0.3, y - 0.12, z0], [x + 0.3, y - 0.12, z0], [x + 0.3, y + 0.1, z0], [x - 0.3, y + 0.1, z0]], MATERIAL.timberDark, { outline: 0 });
  }
  // Sawdust and slabs heaped at the shed's end.
  const d = o.at(27, 0, 8);
  o.ink.shape(blob([[d[0] - 34, d[1] + 4], [d[0] - 16, d[1] - 13], [d[0] + 8, d[1] - 16], [d[0] + 30, d[1] - 2], [d[0] + 10, d[1] + 6]]), '#dcc08c', { off: 4, outline: LINE.inner });
}

/**
 * The Stone House at Nacogdoches (docs/town-research/nacogdoches.md §4): 70 ft along the road and 23 ft deep, two storeys and
 * about 20 ft to the eaves, of the local iron-bearing stone; drawn with the 1885 photograph's steep shingled gable roof and
 * clapboarded gable ends, a chimney at each end, the two-storey wooden gallery along the long side, a door to each room, and
 * the outside stair on the gable end rising to an upper door.
 */
function stoneHouse(o) {
  const X0 = -35, X1 = 35, Z0 = 8, Z1 = 31, EAVE = 20, RIDGE = 31;
  chimney(o, X0 + 1, X0 + 4, (Z0 + Z1) / 2, RIDGE + 4, 'brick');
  o.box({ x0: X0, x1: X1, z0: Z0, z1: Z1, y1: EAVE }, IRONSTONE, { top: false });
  const openings = [];
  const hole = (x, y, w, h) => { openings.push([x - w / 2 - 0.4, y - 0.4, x + w / 2 + 0.4, y + h + 0.4]); };
  for (const x of [-17.5, 17.5]) { hole(x, 0, 3.6, 7.2); hole(x, 10.8, 3.4, 6.6); }
  for (const x of [-28, -6, 6, 28]) { hole(x, 3.2, 2.6, 3.6); hole(x, 13.4, 2.6, 3.4); }
  o.masonry(X0, X1, 0, EAVE, Z0, IRONSTONE, { course: 1.5, seed: 17, rubble: true, opacity: 0.6, skip: (x, y) => openings.some(([a, b, c, d]) => x > a && x < c && y > b && y < d) });
  for (const x of [-17.5, 17.5]) { o.rect(x, 0, 3.6, 7.2, Z0, MATERIAL.door, { boards: 3, lintel: 0.4 }); o.rect(x, 10.8, 3.4, 6.6, Z0, MATERIAL.door, { boards: 3, lintel: 0.4 }); }
  for (const x of [-28, -6, 6, 28]) { o.rect(x, 3.2, 2.6, 3.6, Z0, MATERIAL.opening, { lintel: 0.35, sill: 0.35, bars: 1 }); o.rect(x, 13.4, 2.6, 3.4, Z0, MATERIAL.opening, { lintel: 0.35, sill: 0.35, bars: 1 }); }
  // The gable end toward the camera's right: the upper door the stair climbs to.
  o.face([[X1, 10.8, 25], [X1, 10.8, 28.4], [X1, 17.4, 28.4], [X1, 17.4, 25]], MATERIAL.door, { outline: LINE.inner });
  o.gable({ x0: X0, x1: X1, z0: Z0, z1: Z1, eave: EAVE, ridge: RIDGE, over: 1.2 }, SHINGLE, IRONSTONE, { gableEnd: false, courses: 6 });
  // The clapboarded gable end over the stone.
  const zm = (Z0 + Z1) / 2;
  o.face([[X1, EAVE, Z0], [X1, EAVE, Z1], [X1, RIDGE, zm]], CLAP);
  for (let y = EAVE + 1; y < RIDGE - 0.5; y += 1) { const k = (y - EAVE) / (RIDGE - EAVE); o.line([[X1, y, Z0 + (zm - Z0) * k], [X1, y, Z1 - (Z1 - zm) * k]], { width: LINE.fine, colour: tone(CLAP, -0.4), opacity: 0.7 }); }
  o.line([[X1 + 1.2, EAVE - 0.5, Z0 - 1.2], [X1 + 1.2, RIDGE, zm], [X1 + 1.2, EAVE - 0.5, Z1 + 1.2]], { width: LINE.inner + 0.6 });
  chimney(o, X1 - 4, X1 - 1, zm, RIDGE + 4, 'brick', RIDGE - 3);
  // The two-storey gallery along the front: its shed roof under the eaves, the upper floor's beam and railing, square posts.
  const G = 0, GT = 17.6;
  o.face([[X0 - 0.6, GT, G - 0.6], [X1 + 0.6, GT, G - 0.6], [X1 + 0.6, EAVE - 0.4, Z0 - 0.6], [X0 - 0.6, EAVE - 0.4, Z0 - 0.6]], SHINGLE);
  for (let k = 1; k < 3; k++) o.line([[X0 - 0.6, GT + (EAVE - GT) * k / 3, G + (Z0 - G) * k / 3], [X1 + 0.6, GT + (EAVE - GT) * k / 3, G + (Z0 - G) * k / 3]], { width: LINE.fine, colour: tone(SHINGLE, -0.4), opacity: 0.7 });
  o.face([[X1 + 0.6, GT, G - 0.6], [X1 + 0.6, EAVE - 0.4, Z0 - 0.6], [X1 + 0.6, GT - 0.6, Z0 - 0.6]], tone(SHINGLE, -0.25));
  o.box({ x0: X0, x1: X1, z0: G, z1: G + 0.6, y0: 9.8, y1: 10.8 }, MATERIAL.timberLight);
  o.box({ x0: X1 - 0.3, x1: X1, z0: G, z1: Z0, y0: 9.8, y1: 10.8 }, MATERIAL.timberLight, { front: false });
  for (let x = X0 + 1; x < X1; x += 1.25) o.line([[x, 10.8, G], [x, 13.6, G]], { width: LINE.fine + 0.2, colour: '#5d4128' });
  o.box({ x0: X0, x1: X1, z0: G, z1: G + 0.4, y0: 13.6, y1: 14.2 }, MATERIAL.timberLight);
  for (let x = X0; x <= X1 + 0.01; x += 10) post(o, x - 0.35, G, GT, { r: 0.35, sharp: false, colour: '#8a6a44' });
  // The stair on the gable end: from the street along the end wall up to a landing at the upper door.
  for (let i = 0; i < 12; i++) o.box({ x0: X1 + 0.3, x1: X1 + 3.4, z0: 12 + i * 1.05, z1: 13.2 + i * 1.05, y0: i * 0.88, y1: i * 0.88 + 0.35 }, '#9a7650', { outline: LINE.fine + 0.3 });
  o.box({ x0: X1 + 0.3, x1: X1 + 3.4, z0: 24.6, z1: 29, y0: 10.2, y1: 10.8 }, '#9a7650');
  post(o, X1 + 3.1, 28.5, 10.2, { r: 0.25, sharp: false, colour: '#6e5234' });
  o.line([[X1 + 3.4, 3, 12], [X1 + 3.4, 13.5, 24.6], [X1 + 3.4, 13.5, 29]], { width: LINE.inner + 0.4, colour: '#5d4128' });
  o.line([[X1 + 3.4, 0, 12], [X1 + 3.4, 10.2, 24.6]], { width: LINE.inner, colour: '#5d4128' });
}

// ------------------------------------------------------------------------------------------------------------ E10 cutouts
/** A patch of ground lifted out of the map, as her place cutouts stand on one: grass on top, a band of earth below. */
function island(o, plan, { thick = 5, grass = '#8a9a55', earth = '#6e5234', seed = 1 } = {}) {
  o.prism(plan, -thick, 0, earth, { top: false, outline: LINE.inner });
  o.face(plan.map(([x, z]) => [x, 0, z]), grass, { outline: LINE.inner });
  for (let i = 0; i < 40; i++) {
    const p = plan[Math.floor(rand(seed + i) * plan.length)], q = [p[0] * (0.2 + rand(seed + i * 3) * 0.7), p[1] * (0.2 + rand(seed + i * 5) * 0.7)];
    const c = o.at(q[0], 0, q[1] + 18 * (1 - 0.2));
    o.ink.line(`M ${c[0] - 2.5} ${c[1]} l 1.5 -4 M ${c[0]} ${c[1]} l 0 -5 M ${c[0] + 2.5} ${c[1]} l -1 -4`, { width: LINE.fine, colour: tone(grass, -0.4), opacity: 0.8 });
  }
}
const blobPlan = (x0, x1, z0, z1, seed, n = 14) => Array.from({ length: n }, (_, i) => {
  const t = (i / n) * Math.PI * 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, k = 0.9 + rand(seed + i) * 0.16;
  return [cx + Math.cos(t) * (x1 - x0) / 2 * k, cz + Math.sin(t) * (z1 - z0) / 2 * k];
});
function dirt(o, points, colour = '#c2a36e') { o.face(points.map(([x, z]) => [x, 0.05, z]), colour, { outline: 0 }); }
function tree(o, x, z, h, seed, crown = '#5e7438') {
  o.face([[x - 0.5, 0, z], [x + 0.5, 0, z], [x + 0.4, h * 0.5, z], [x - 0.4, h * 0.5, z]], MATERIAL.timberDark, { outline: LINE.fine });
  const c = o.at(x, h * 0.72, z), r = h * 0.38 * o.px;
  o.ink.shape(blob(Array.from({ length: 9 }, (_, i) => { const t = (i / 9) * Math.PI * 2, k = 0.8 + rand(seed + i) * 0.35; return [c[0] + Math.cos(t) * r * k, c[1] + Math.sin(t) * r * 0.8 * k]; })), crown, { off: r * 0.25, lift: true, outline: LINE.inner });
}
/** A dog-run house: two pens under one roof with an open passage between, a chimney at each end. */
function dogRun(o, { x0, x1, z0, z1, pass = 8, eave = 8, ridge = 15, gallery = false, seed = 1 }) {
  const a = (x0 + x1) / 2 - pass / 2, b = (x0 + x1) / 2 + pass / 2;
  chimney(o, x0 - 2.2, x0, (z0 + z1) / 2, ridge + 1.5, 'stick');
  o.box({ x0, x1: a, z0, z1, y1: eave }, LOG, { top: false });
  logCourses(o, x0, a, 0, eave, z0);
  o.face([[a, 0, z0], [b, 0, z0], [b, 0, z1], [a, 0, z1]], '#6c5234', { outline: LINE.fine });
  o.face([[a, 0, z1], [b, 0, z1], [b, eave, z1], [a, eave, z1]], '#b9a26e', { outline: LINE.fine });
  o.box({ x0: b, x1, z0, z1, y1: eave }, LOG, { top: false });
  logCourses(o, b, x1, 0, eave, z0);
  o.rect(x0 + (a - x0) / 2, 0, 2.8, 6.2, z0, MATERIAL.door, { boards: 3 });
  o.rect(b + (x1 - b) / 2, 3, 2.2, 2.2, z0, '#5d4a36', { lintel: 0.25 });
  o.gable({ x0, x1, z0, z1, eave, ridge, over: 1 }, SHINGLE, CLAP, { courses: 3 });
  chimney(o, x1, x1 + 2.2, (z0 + z1) / 2, ridge + 1.5, 'stick');
  if (gallery) {
    o.face([[x0 - 0.8, eave - 1.6, z0 - 6], [x1 + 0.8, eave - 1.6, z0 - 6], [x1 + 0.8, eave - 0.2, z0 - 0.6], [x0 - 0.8, eave - 0.2, z0 - 0.6]], SHINGLE);
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) post(o, x - 0.3, z0 - 6, eave - 1.6, { r: 0.3, sharp: false, colour: '#6e5234' });
  }
  void seed;
}

function staffords(o) {
  island(o, blobPlan(-44, 46, -8, 44, 3), { seed: 3 });
  dirt(o, [[-30, 2], [30, -2], [34, 2], [-26, 6]]);
  // Cane rows at the back left, the crop the mill was built for.
  for (let r = 0; r < 5; r++) for (let x = -36; x < -8; x += 2.2) { const c = o.at(x + (r % 2) * 1.1, 0, 30 + r * 2.4); o.ink.line(`M ${c[0]} ${c[1]} l -1 -9 M ${c[0]} ${c[1]} l 2 -8`, { width: LINE.fine + 0.4, colour: '#4f6a2c' }); }
  // The gin house, tall, at the back right, and the horse sweep that drove it.
  house(o, { x0: 16, x1: 30, z0: 22, z1: 34, eave: 14, ridge: 21, wall: 'plank', courses: 3, doors: [{ x: 23, w: 3.4, h: 7 }] });
  const hub = [36, 0, 14];
  const track = Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [hub[0] + Math.cos(t) * 8, hub[2] + Math.sin(t) * 8]; });
  dirt(o, track, '#b89868');
  o.face(Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [hub[0] + Math.cos(t) * 5.5, 0.08, hub[2] + Math.sin(t) * 5.5]; }), '#8a9a55', { outline: 0 });
  post(o, hub[0] - 0.5, hub[2], 6, { r: 0.5, sharp: false });
  o.line([[hub[0], 5.2, hub[2]], [hub[0] - 8, 3, hub[2] - 1]], { width: LINE.inner + 1.4, colour: '#6e5234' });
  o.line([[hub[0], 5.6, hub[2]], [26, 9, 22]], { width: LINE.inner, colour: '#5d4128' });
  // The cane mill: an open shed over the rollers, and the boiling house's furnace chimney beside it.
  openShed(o, { x0: -6, x1: 8, z0: 16, z1: 24, high: 8, low: 6 });
  chimney(o, 9, 11.6, 21, 13, 'brick');
  o.box({ x0: 0, x1: 2.4, z0: 18, z1: 20.4, y1: 3.2 }, MATERIAL.iron);
  // The planter's house at the front left: a storey-and-a-half house with a gallery.
  dogRun(o, { x0: -34, x1: -6, z0: 6, z1: 18, pass: 7, eave: 9, ridge: 17, gallery: true });
  railFence(o, -40, -8, -3);
  tree(o, 20, 4, 16, 7);
  tree(o, 40, 30, 18, 9, '#566b33');
}

function oldFort(o) {
  island(o, blobPlan(-44, 44, -8, 44, 11), { seed: 11 });
  dirt(o, [[-20, 0], [28, -4], [30, 0], [-18, 4]]);
  // The fort: a double log house with a small gun in the passage between its rooms (probable: the county history).
  dogRun(o, { x0: -18, x1: 14, z0: 14, z1: 26, pass: 8, eave: 10, ridge: 18 });
  const gun = o.at(-2, 1.4, 17.5);
  o.box({ x0: -3.4, x1: -0.6, z0: 16.6, z1: 18.4, y1: 1.2 }, MATERIAL.timber);
  o.ink.shape(`M ${gun[0] - 12} ${gun[1] - 3} L ${gun[0] + 10} ${gun[1] + 2} L ${gun[0] + 10} ${gun[1] + 7} L ${gun[0] - 12} ${gun[1] + 4} Z`, MATERIAL.iron, { off: 2, outline: LINE.inner });
  for (const [cx, cz] of [[-6, 16.4], [2, 16.4]]) { const c = o.at(cx - 2.6, 1.3, cz); o.ink.shape(`M ${c[0] - 7} ${c[1]} a 7 7 0 1 0 14 0 a 7 7 0 1 0 -14 0 Z`, MATERIAL.timber, { shade: false, outline: LINE.fine + 0.4 }); }
  // Cabins round it.
  house(o, { x0: -40, x1: -26, z0: 26, z1: 36, eave: 7, ridge: 12, doors: [{ x: -33 }], chimneys: [{ side: 'left' }], courses: 2 });
  house(o, { x0: 22, x1: 36, z0: 24, z1: 34, eave: 7, ridge: 12, doors: [{ x: 29 }], chimneys: [{ side: 'right' }], courses: 2 });
  house(o, { x0: -36, x1: -24, z0: 2, z1: 11, eave: 6.5, ridge: 11, doors: [{ x: -30 }], chimneys: [{ side: 'left' }], courses: 2 });
  house(o, { x0: 20, x1: 32, z0: 0, z1: 9, eave: 6.5, ridge: 11, doors: [{ x: 26 }], windows: [{ x: 29.5 }], courses: 2 });
  tree(o, 40, 12, 17, 5);
  tree(o, -42, 16, 15, 12, '#566b33');
}

function newWashington(o) {
  // The bay at the front right: water, and a short landing into it (likely; not documented).
  o.face(blobPlan(6, 58, -15, 15, 17).map(([x, z]) => [x, -1.6, z]), '#6f9aa4', { outline: LINE.inner });
  island(o, [[-46, 8], [-44, -4], [-30, -8], [-10, -6], [4, 2], [14, 12], [30, 18], [46, 24], [44, 40], [20, 46], [-20, 46], [-44, 36]], { seed: 17 });
  for (let i = 0; i < 5; i++) { const c = o.at(18 + i * 7, -1.5, -8 + (i % 3) * 5); o.ink.line(`M ${c[0] - 8} ${c[1]} q 4 -3 8 0 q 4 3 8 0`, { width: LINE.fine + 0.2, colour: '#d7e6e4', opacity: 0.8 }); }
  // The landing on piles into the bay.
  for (const z of [6, 1, -4]) for (const x of [12, 18]) post(o, x, z, 1.6, { r: 0.35, sharp: false, colour: '#5d4128' });
  o.face([[10, 0.8, 8], [20, 0.8, 8], [20, 0.8, -5], [10, 0.8, -5]], '#b08a58');
  for (let z = -4; z < 8; z += 1.3) o.line([[10, 0.85, z], [20, 0.85, z]], { width: LINE.fine, colour: '#6e5234', opacity: 0.8 });
  // Morgan's two plank warehouses and the Association's dwelling house (TSHA).
  house(o, { x0: -6, x1: 18, z0: 26, z1: 38, eave: 10, ridge: 17, wall: 'plank', doors: [{ x: 6, w: 5, h: 7.5 }], courses: 3 });
  house(o, { x0: -34, x1: -12, z0: 22, z1: 34, eave: 10, ridge: 17, wall: 'plank', doors: [{ x: -23, w: 5, h: 7.5 }], courses: 3 });
  house(o, { x0: -38, x1: -22, z0: 2, z1: 12, eave: 8, ridge: 14, wall: 'frame', doors: [{ x: -30 }], windows: [{ x: -35 }, { x: -25.5 }], chimneys: [{ side: 'left', kind: 'brick' }], courses: 2 });
  openShed(o, { x0: 24, x1: 36, z0: 30, z1: 36, high: 6.5, low: 5 });
  for (const [x, z] of [[-6, 10], [-3, 12]]) { o.box({ x0: x, x1: x + 2.4, z0: z, z1: z + 2.4, y1: 2.2 }, '#a07a50'); }
  tree(o, -42, 40, 16, 3);
}

function powells(o) {
  island(o, blobPlan(-44, 44, -8, 44, 23), { seed: 23 });
  dirt(o, [[-44, 0], [40, -4], [42, 1], [-42, 5]]);
  // Mrs. Powell's house: a double-pen dog-run (documented), and her detached kitchen.
  dogRun(o, { x0: -22, x1: 12, z0: 14, z1: 26, pass: 8, eave: 9, ridge: 16, gallery: true });
  house(o, { x0: 20, x1: 30, z0: 22, z1: 30, eave: 7, ridge: 11.5, doors: [{ x: 25 }], chimneys: [{ side: 'right' }], courses: 2 });
  // The stage stop's sheds and a stable (inferred from the trail: a stand's usual sheds), a wagon standing by.
  openShed(o, { x0: -42, x1: -26, z0: 28, z1: 36, high: 8, low: 6 });
  openShed(o, { x0: 26, x1: 42, z0: 4, z1: 12, high: 7, low: 5.5 });
  const w = o.at(-12, 0, 2);
  for (const dx of [0, 34]) o.ink.shape(`M ${w[0] + dx - 9} ${w[1] - 1} a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z`, '#7a5a3a', { shade: false, outline: LINE.inner });
  o.box({ x0: -14.5, x1: -3, z0: 2, z1: 6, y0: 2.2, y1: 4.4 }, MATERIAL.timberLight);
  railFence(o, -44, -24, 8);
  tree(o, 38, 30, 18, 4);
  tree(o, -36, 16, 14, 8, '#566b33');
}

// ---------------------------------------------------------------------------------------------------------------- frames
// Town buildings (E12). Drawn at `px` source pixels a real foot, their logical height 20 ft, so a layout that draws one at
// `artHeight` 20 (sim/town-layouts.mjs) draws it at the town's own exaggeration (DRAWN_HEIGHT) and true to its size; a
// smaller `artHeight` shrinks it for a town too tight to hold it (the layout says which).
const REF_FEET = 20;
function townFrame(name, spec, draw) { return building(name, { ...spec, logicalHeight: Math.round(REF_FEET * spec.px) }, draw); }
const E12 = {
  'fort-velasco': () => townFrame('fort-velasco', { w: 660, h: 270, origin: [334, 171], anchor: [0, -53], px: 5.5, note: 'Fort Velasco in 1835: the circular log-and-sand work of 1832, derelict, its palisade gapped, the gun on its central mound' }, fortVelasco),
  'sawmill-steam': () => townFrame('sawmill-steam', { w: 700, h: 420, origin: [290, 395], px: 7, note: 'the Harrisburg steam mills, 1835: a long plank mill shed open to the saw floor, the boiler house and its brick stack, a log deck and stacks of sawn boards' }, sawmill),
  'stone-house-nacogdoches': () => townFrame('stone-house-nacogdoches', { w: 740, h: 390, origin: [320, 365], px: 8, note: 'the Stone House at Nacogdoches: two storeys of iron-bearing stone, 70 by 23 ft, a shingled gable roof, the two-storey gallery along the front and the outside stair on the gable end' }, stoneHouse),
};
// Map cutouts (E10), the form of her `village-irish-colony` and `ferry-landing`: a patch of ground with its buildings on it,
// drawn whole as a place's picture at the map's size (public/app.js draws a place's picture 24-90 px tall, the whole frame).
// Her cutouts look down more steeply than her buildings do, over a thick base of earth: so these (kx 0.45, ky 0.55).
const CUT = { w: 640, h: 290, origin: [270, 232], px: 5, anchor: [0, -9, -5], kx: 0.45, ky: 0.55 };
const cutout = (name, note, draw) => () => building(name, { ...CUT, logicalHeight: CUT.h, note }, draw);
const E10 = {
  'plantation-sugar': cutout('plantation-sugar', 'Stafford\'s plantation before April 15, 1836: the planter\'s house, the cane mill and its furnace, the gin house and its horse sweep, cane rows', staffords),
  'blockhouse-village': cutout('blockhouse-village', 'the Old Fort at Fort Bend: the double log house of 1822 with a small gun in its passage, and the cabins round it', oldFort),
  'townsite-bay': cutout('townsite-bay', 'New Washington on the bay: Morgan\'s two warehouses, the dwelling house, sheds and a short landing into the water', newWashington),
  'tavern-house': cutout('tavern-house', 'Mrs. Powell\'s on the San Bernard trail: her double-pen dog-run house and detached kitchen, the stage stop\'s sheds and a wagon', powells),
};

const TOWN_REQUEST = 'Request 2026-09-16 — the buildings the towns\' research found';
const ADVANCE_REQUEST = 'Request 2026-09-26 — the Mexican advance';
const STYLE = 'Warm hand-drawn storybook style in the frontier-v1 building view (front square to the camera, the top and the right-hand end seen a little), thin dark olive-brown outline, flat facets lit from the upper left, transparent ground, no shadow, no text.';
// `height` and `compare` (scripts/claude-art/compare.mjs) are in the ratio the game draws them, not persons: the town
// buildings by sim/town-layouts.mjs's heights (a trading-house 18 as 1; the fort and the Stone House at `artHeight` 10, the
// mill 8, timber-hall 24, storehouse 14, stone-tile-house 20, a palisade piece 8), the cutouts all at the map's one place
// height (public/app.js), as her place cutouts are.
export const SHEETS = {
  'claude-fort-velasco': { cell: { w: 660, h: 270 }, columns: 1, request: TOWN_REQUEST, replaceWith: 'item 8: a circular log-and-sand fort, gapped and derelict, at the scale of house-hewn-log and trading-house, south-facing',
    frames: [{ name: 'fort-velasco', draw: E12['fort-velasco'], height: 0.56, compare: [['palisade', 0.44], ['house-hewn-log', 1], ['trading-house', 1]],
      prompt: `Fort Velasco at the mouth of the Brazos in October 1835: the 1832 Mexican work three and a half years after it was given up (docs/town-research/velasco.md §3, from four eyewitnesses - Russell, Waller, John H. Brown, Henry Smith - and the 1832 return of arms). DOCUMENTED: a circle, small (Harkort's scaled drawing of February 1836: about 87 ft, and "just less than 100 feet" in Kneupper's reading of the original; drawn 90 ft), two concentric rows of sharpened posts about six feet apart filled between with sand, earth and shell, a banquette inside to fire over, a central mound about ten feet above the interior revetted with higher posts and carrying the gun en barbette on a pivot behind a low wooden parapet, and a ditch outside. INFERRED: that it was derelict - "abandoned", its "ruins" standing - is documented for 1833-35; the palisade robbed for timber in long gaps, the sand slumped where the posts went, the ditch silted and grassed are a reading of that; the long gun on the mound follows McKinney's "a most superior long 18 pounder" mounted on "our fort at Velasco" on October 24, 1835, which the research takes to be this work (I-3; nobody says so). UNCERTAIN: the height of the posts (drawn about 8.5 ft outside, 7 inside), how much of the palisade was gone, the parapet. Not the dimensioned polygon of 1836 (a different, later fort). ${STYLE}` }] },
  'claude-sawmill-steam': { cell: { w: 700, h: 420 }, columns: 1, request: TOWN_REQUEST, replaceWith: 'item 9: a steam sawmill on a bayou - a long plank shed, a boiler house with a stack and smoke, a log deck and stacks of sawn pine',
    frames: [{ name: 'sawmill-steam', draw: E12['sawmill-steam'], height: 0.44, compare: [['timber-hall', 1.33], ['storehouse', 0.78], ['house-hewn-log', 1]],
      prompt: `The Harrisburg Steam Mills on Buffalo Bayou in the autumn of 1835 (docs/town-research/harrisburg.md §5; TSHA Harrisburg and Harris, John Richardson; the Brazoria Texas Republican's notices of July-November 1835). DOCUMENTED: steam-powered saw- and grist-mills begun by J. R. Harris in 1829, in working order through 1835 under the Harrisburg Steam Mill Company, cutting yellow pine and oak, sold at the mills at $25 a thousand and loaded into vessels there; burned with the town on April 16, 1836. NOT RECORDED - so this is a period steam sawmill and not a portrait: where it stood, its size, its engine and saw, what it was built of. Drawn as a long plank mill shed with the saw floor open to the front and a pine log on the carriage by an upright sash saw, a smaller plank boiler house behind with a brick stack (brick or sheet iron: unknown) and a little smoke, a deck of pine logs on skids, two stacks of sawn boards stickered to dry, and a heap of sawdust and slabs. The bayou is the map's own water and is not drawn. ${STYLE}` }] },
  'claude-stone-house': { cell: { w: 740, h: 390 }, columns: 1, request: TOWN_REQUEST, replaceWith: 'item 10: a two-storey stone house with a gallery and an outside stair, 70 x 23 ft',
    frames: [{ name: 'stone-house-nacogdoches', draw: E12['stone-house-nacogdoches'], height: 0.56, compare: [['stone-tile-house', 1.11], ['trading-house', 1], ['house-hewn-log', 1]],
      prompt: `The Stone House at Nacogdoches (later called the Old Stone Fort) as it stood in 1835, on the north side of the Camino Real at Fredonia Street, its long side to the road (docs/town-research/nacogdoches.md §2, §4; TSHA Old Stone Fort; the 1936 and 1962 markers; the 1885 photograph, Portal to Texas History metapth38479). DOCUMENTED: 70 ft along the road and 23 ft along Fredonia, two storeys and about 20 ft high, outer walls of the local iron-bearing stone laid as rough coursed rubble, adobe inner walls, black-walnut sills and casements, two rooms a storey, an exterior door to each room, fireplaces. FROM THE 1885 PHOTOGRAPH, fifty years after (the research's I-5): the steep gabled roof of wood shingles with clapboarded gable ends, a chimney at each end (brick above the roof), the two-storey wooden gallery on square posts along the long side with a railing above, and the wooden stair on the gable end up to an upper door - whether the gallery stood in 1835, which side it was on, and the roof's covering then are not known. Drawn south-facing, the long side and its gallery to the camera, the east gable end and its stair on the right; the later lean-to at the back is not drawn. The windows' number and place are a reading. ${STYLE}` }] },
  'claude-advance-places': { cell: { w: CUT.w, h: CUT.h }, columns: 2, request: ADVANCE_REQUEST, replaceWith: 'item 4: a map cutout as public/place-art.js gives the places past the box',
    frames: [
      { name: 'plantation-sugar', draw: E10['plantation-sugar'], height: 1.5, compare: [['village-irish-colony', 1.5], ['ferry-landing', 1.5]],
        prompt: `Stafford's plantation (William Stafford, Stafford's Point); the Mexican column burned it on April 15, 1836 (HIST-TEX-587, -595; TSHA Stafford, William Joseph; the Fort Bend county history's list of what burned: "dwelling, gin, cane mill, outhouses"). A map cutout on a patch of ground, in the form of the library's place cutouts. DOCUMENTED: a cane (sugar) mill and a horse-powered cotton gin, both working by 1834; the dwelling and the gin houses burned. NOT RECORDED, and drawn as a period reading: the house (a storey-and-a-half double-pen log house with a gallery), the gin house (a tall plank house with its horse sweep beside it), the cane mill (an open shed over the rollers and the boiling house's furnace chimney), cane rows and a rail fence. The fire is not drawn: the map draws the burning. ${STYLE}` },
      { name: 'blockhouse-village', draw: E10['blockhouse-village'], height: 1.5, compare: [['village-irish-colony', 1.5], ['ferry-landing', 1.5]],
        prompt: `The Old Fort at Fort Bend on the Brazos (HIST-TEX-590; TSHA Fort Bend): the log post built in November 1822 by W. W. Little, Joseph Polley and others on a bluff in a great bend of the river, called in the record a "little log shanty"; Filisola's rear was there when San Jacinto was fought. A map cutout on a patch of ground. PROBABLE (the county history, quoted but not read here): a double log house with a small wheeled cannon in the passage between its two rooms - drawn so, where the request imagined a blockhouse. UNCERTAIN: whether it still stood in 1836, and the cabins round it (drawn four, of the settlement that grew there). ${STYLE}` },
      { name: 'townsite-bay', draw: E10['townsite-bay'], height: 1.5, compare: [['ferry-landing', 1.5], ['village-irish-colony', 1.5]],
        prompt: `New Washington, James Morgan's townsite where Buffalo Bayou meets San Jacinto Bay (HIST-TEX-588, -595; TSHA New Washington and New Washington Association): by 1835 Morgan's store and warehouse, and the Association's dwelling house, two warehouses and outbuildings - all burned by Almonte's men and Santa Anna's column in April 1836. A map cutout on a patch of ground by the bay. DOCUMENTED: the two warehouses and the dwelling house. LIKELY and not documented: a landing into the bay (two schooners were based there), drawn short on piles. The bluff the request imagined is not documented: drawn a low shore. The buildings' forms (plank warehouses, a frame house with a brick chimney) are a reading. ${STYLE}` },
      { name: 'tavern-house', draw: E10['tavern-house'], height: 1.5, compare: [['village-irish-colony', 1.5], ['ferry-landing', 1.5]],
        prompt: `Mrs. Elizabeth Powell's place on Turkey Creek by the San Bernard, on the trail from Brazoria and Columbia to San Felipe (HIST-TEX-596; TSHA Powell, Elizabeth; the Houston Archeological Society's excavations of 1999-2005, report 25, not read): the Mexican army gathered there after San Jacinto and its rear guard burned the house on April 26, 1836. A map cutout on a patch of ground. DOCUMENTED: a double-pen dog-run house - two rooms and an open hall through, one roof - with a separate kitchen and several small buildings. INFERRED from the trail and the request: a stage stop's sheds and a wagon standing by (a stage line's stop there is not documented; a stand for travellers on the trail is the reading); the gallery and the rail fence. ${STYLE}` },
    ] },
};
