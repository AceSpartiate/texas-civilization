// The ground of the fights, area F (docs/CLAUDE_ART_PLAN.md): the cut riverbank, the bend, the fog, the dry creek bed and
// the ford of Concepción and the Grass Fight (F8, request 2026-09-25 — Concepción and the Grass Fight, items 1, 3, 7), the
// edge of the marsh at San Jacinto (F9, request 2026-09-25 — San Jacinto, item 4), and the light of the night fights (F7,
// request 2026-09-25 — the Alamo, item 4). Drawn procedurally in the manner of Astra's `earth-rampart`, `water-ripple` and
// `marsh-cordgrass`: raw earth and grass lips thinly outlined, water teal with pale ripple lines, fog as pale billows.
//
// **What is known and what is a reading.** Concepción: the Texians lay in the river bottom under the bank of a horseshoe bend
// of the San Antonio, and cut steps in the bank to fire from (HIST-TEX-020, HIST-TEX-480; fog in the morning, the battle's
// own `fog` phase). The Grass Fight: the train's guard fought from a dry creek bed and a ditch in mesquite, and Jack's men
// forded a creek (HIST-TEX-031, HIST-TEX-483). San Jacinto: the marsh at the Mexican rear. The shapes of bank, bed and
// marsh are readings at play size, not surveys of those places.
import { billow, frameDoc, rng, shade, f1, INK } from '../land/paint.mjs';

export const AREA = 'land';
export const DATE = '2026-09-28';
const MODULE = 'land-ground';
const CONCEPCION = 'Request 2026-09-25 — Concepción and the Grass Fight';
const SANJAC = 'Request 2026-09-25 — San Jacinto';
const ALAMO = 'Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night';
const GROUND = 'a ground piece seen from the map\'s three-quarter view, transparent, to lay along or scatter';

const WATER = '#4f8088', WATER_LIGHT = '#8fbcbc', EARTH = '#8a6440', EARTH_DARK = '#5e4128', EARTH_LIGHT = '#b98f5e', SAND = '#cdb382', GRASS = '#6f8a3a', GRASS_LIGHT = '#98ae52';
const path = pts => `M ${pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L ')} Z`;
const smoothPath = (pts, closed = true) => {
  const n = pts.length, parts = [`M ${f1(pts[0][0])} ${f1(pts[0][1])}`];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    parts.push(`C ${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`);
  }
  return parts.join(' ') + (closed ? ' Z' : '');
};
/** Grass blades along a line from a to b, pointing up. */
function blades(R, a, b, n, len = 9, colours = [GRASS, GRASS_LIGHT]) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = R(), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, l = len * (0.6 + R() * 0.8), lean = (R() - 0.5) * 5;
    out.push(`<path d="M ${f1(x - 1.6)} ${f1(y)} L ${f1(x + lean)} ${f1(y - l)} L ${f1(x + 1.6)} ${f1(y)} Z" fill="${colours[i % colours.length]}" stroke="${INK}" stroke-width="0.5"/>`);
  }
  return out.join('');
}
/** Pale ripple lines on water inside a band. */
function ripples(R, x0, x1, y0, y1, n) {
  const out = [];
  for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), w = 8 + R() * 16; out.push(`<path d="M ${f1(x - w)} ${f1(y)} q ${f1(w / 2)} -3 ${f1(w)} 0 q ${f1(w / 2)} 3 ${f1(w)} 0" fill="none" stroke="${WATER_LIGHT}" stroke-width="1.6" opacity="0.85"/>`); }
  return out.join('');
}
const doc = (name, w, h, note, body, gy, logicalHeight, anchorX = 0.5) => ({ svg: frameDoc(name, w, h, note, body, MODULE), anchorX, anchorY: +(gy / h).toFixed(4), logicalHeight: logicalHeight ?? h });

// ---- the cut riverbank ---------------------------------------------------------------------------------------------------
// A length of earthen bank running up the screen (the bank at Concepción runs north and south), its crest grassed and its
// raw face dropping to the east (`-e`) toward the men below it, with two steps cut into the face to stand on and fire from.
function riverbank(dir) {
  const W = 220, H = 240, gy = 226, R = rng(dir === 'e' ? 71 : 72), out = [];
  const m = x => dir === 'e' ? x : W - x;
  // Ground behind the bank (the crest's top, grass), the face, and the bottom it drops to.
  const crest = [[m(78), 30], [m(110), 20], [m(120), 200], [m(86), 212]];
  const face = [[m(110), 20], [m(196), 48], [m(206), 226], [m(120), 200]];
  out.push(`<path d="${smoothPath(crest)}" fill="${GRASS}" stroke="${INK}" stroke-width="1.6"/>`);
  out.push(`<path d="${path(face)}" fill="${EARTH}" stroke="${INK}" stroke-width="1.8"/>`);
  // Strata and roots down the face; the lit upper edge.
  for (let i = 1; i < 6; i++) { const t = i / 6; out.push(`<path d="M ${f1(m(110 + 60 * t * 0.05))} ${f1(20 + 180 * t)} Q ${f1(m(140))} ${f1(30 + 180 * t)} ${f1(m(172 + 10 * t))} ${f1(44 + 182 * t)}" fill="none" stroke="${EARTH_DARK}" stroke-width="1.2" opacity="0.7"/>`); }
  for (let i = 0; i < 7; i++) { const y = 40 + R() * 150, x = 118 + R() * 40; out.push(`<path d="M ${f1(m(x))} ${f1(y)} q ${f1(dir === 'e' ? 4 : -4)} 6 ${f1(dir === 'e' ? 2 : -2)} 12" fill="none" stroke="#3d2a18" stroke-width="1"/>`); }
  out.push(`<path d="M ${m(110)} 20 L ${m(170)} 44" stroke="${EARTH_LIGHT}" stroke-width="3"/>`);
  // The two steps: a flat ledge (lit) with its riser below it.
  for (const y of [78, 146]) {
    out.push(`<path d="${path([[m(128), y], [m(166), y + 14], [m(166), y + 26], [m(128), y + 12]])}" fill="${EARTH_DARK}" stroke="${INK}" stroke-width="1.3"/>`);
    out.push(`<path d="${path([[m(128), y], [m(166), y + 14], [m(156), y + 8], [m(122), y - 4]])}" fill="${EARTH_LIGHT}" stroke="${INK}" stroke-width="1.3"/>`);
  }
  out.push(blades(R, [m(80), 32], [m(112), 22], 10, 10), blades(R, [m(86), 210], [m(120), 200], 6, 8));
  for (let i = 0; i < 10; i++) { const y = 40 + R() * 160, x = 86 + R() * 22; out.push(`<path d="M ${f1(m(x))} ${f1(y)} l ${f1((R() - 0.5) * 4)} -7" stroke="${GRASS_LIGHT}" stroke-width="1.6"/>`); }
  return doc(`riverbank-cut-${dir}`, W, H, `a length of cut riverbank, its raw face dropping to the ${dir === 'e' ? 'east' : 'west'} with two steps cut into it`, out.join(''), gy, null, 0.5);
}

// ---- the bend, the dry bed, the ford ---------------------------------------------------------------------------------------
function riverBend() {
  const W = 420, H = 260, gy = 250, R = rng(81), out = [];
  const inner = [[20, 60], [150, 70], [250, 110], [300, 170], [310, 240]], outer = [[20, 150], [130, 150], [200, 185], [225, 240]];
  const bankA = [[10, 30], [160, 38], [285, 90], [345, 160], [360, 246], [300, 246], [270, 170], [230, 118], [140, 76], [10, 68]];
  const bankB = [[10, 142], [128, 142], [206, 176], [236, 246], [196, 246], [178, 196], [120, 162], [10, 162]];
  out.push(`<path d="${smoothPath(bankA)}" fill="${SAND}" stroke="${INK}" stroke-width="1.5"/>`, `<path d="${smoothPath(bankB)}" fill="${SAND}" stroke="${INK}" stroke-width="1.5"/>`);
  const water = [...inner, ...outer.slice().reverse()];
  out.push(`<path d="${smoothPath(water)}" fill="${WATER}" stroke="${INK}" stroke-width="1.8"/>`);
  out.push(`<path d="${smoothPath([[26, 72], [150, 80], [240, 118], [284, 172], [290, 236], [236, 236], [210, 190], [140, 142], [26, 140]])}" fill="${shade(WATER, 0.12)}" opacity="0.6"/>`);
  out.push(ripples(R, 40, 270, 90, 140, 9), ripples(R, 220, 290, 170, 230, 4));
  out.push(blades(R, [12, 32], [280, 88], 26, 10), blades(R, [300, 120], [362, 246], 12, 10), blades(R, [12, 164], [120, 164], 10, 8));
  return doc('river-bend', W, H, 'a bend of a river between sandy banks, seen from the three-quarter view', out.join(''), gy, null, 0.5);
}
function creekBedDry() {
  const W = 340, H = 180, gy = 168, R = rng(91), out = [];
  const top = [[10, 60], [120, 50], [230, 70], [330, 58], [330, 150], [10, 150]];
  out.push(`<path d="${smoothPath([[8, 40], [330, 38], [334, 70], [8, 76]])}" fill="${GRASS}" stroke="${INK}" stroke-width="1.4"/>`);
  // The far bank's cut face, then the bed of sand and cobbles, then the near bank's lip.
  out.push(`<path d="${path([[10, 60], [120, 52], [230, 70], [330, 58], [330, 84], [230, 96], [120, 80], [10, 88]])}" fill="${EARTH}" stroke="${INK}" stroke-width="1.5"/>`);
  out.push(`<path d="${smoothPath([[10, 88], [120, 80], [230, 96], [330, 84], [330, 132], [230, 140], [120, 126], [10, 134]])}" fill="${SAND}" stroke="${INK}" stroke-width="1.4"/>`);
  for (let i = 0; i < 26; i++) { const x = 20 + R() * 300, y = 94 + R() * 34, r = 2.5 + R() * 4; out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.65)}" fill="${R() < 0.5 ? '#a89c86' : '#8d8270'}" stroke="${INK}" stroke-width="0.8"/>`); }
  for (let i = 0; i < 5; i++) { const x = 40 + R() * 260, y = 100 + R() * 24; out.push(`<path d="M ${f1(x)} ${f1(y)} q 10 4 22 0" fill="none" stroke="#b09a6c" stroke-width="1.4"/>`); }
  out.push(`<path d="${smoothPath([[10, 134], [120, 126], [230, 140], [330, 132], [330, 158], [10, 158]])}" fill="${GRASS}" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(blades(R, [12, 40], [328, 40], 30, 9, ['#a79b5a', GRASS_LIGHT]), blades(R, [12, 134], [328, 134], 30, 10, ['#a79b5a', GRASS]));
  void top;
  return doc('creek-bed-dry', W, H, 'a dry creek bed: a cut bank, a bed of sand and cobbles, dry grass on its lips', out.join(''), gy, null, 0.5);
}
function creekFord() {
  const W = 340, H = 200, gy = 188, R = rng(97), out = [];
  out.push(`<path d="${smoothPath([[8, 30], [330, 36], [334, 70], [8, 64]])}" fill="${GRASS}" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(`<path d="${smoothPath([[10, 58], [330, 64], [332, 150], [10, 142]])}" fill="${WATER}" stroke="${INK}" stroke-width="1.8"/>`);
  // The ford: a shallow gravel bar across the creek, paler water and stones breaking the surface.
  out.push(`<path d="${smoothPath([[140, 60], [200, 62], [214, 148], [150, 146]])}" fill="${shade(WATER, 0.3)}" opacity="0.9"/>`);
  for (let i = 0; i < 16; i++) { const x = 146 + R() * 60, y = 70 + R() * 72, r = 2.5 + R() * 3.5; out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.6)}" fill="#a39884" stroke="${INK}" stroke-width="0.8"/><path d="M ${f1(x - r - 3)} ${f1(y + 1)} q ${f1(r + 3)} 3 ${f1(2 * r + 6)} 0" fill="none" stroke="${WATER_LIGHT}" stroke-width="1.2"/>`); }
  out.push(ripples(R, 20, 130, 74, 136, 6), ripples(R, 220, 320, 78, 140, 6));
  out.push(`<path d="${smoothPath([[10, 140], [330, 148], [334, 176], [8, 172]])}" fill="${SAND}" stroke="${INK}" stroke-width="1.4"/>`);
  out.push(blades(R, [12, 32], [330, 36], 26, 9), blades(R, [12, 170], [330, 174], 22, 9));
  return doc('creek-ford', W, H, 'a creek with a shallow gravel ford across it, stones breaking the water', out.join(''), gy, null, 0.5);
}

// ---- fog ------------------------------------------------------------------------------------------------------------------
// A bank of fog lying on the ground: pale billows under a soft grey outline, the dense bank solid, the thin one broken into
// wisps; three frames drifting to the right, the billows' shapes a function of where they are so the drift runs on.
function fog(kind, frame) {
  const W = 520, H = 200, gy = 190, dense = kind === 'dense', out = [];
  const n = dense ? 16 : 10, drift = frame / 3;
  for (let i = -1; i <= n; i++) {
    const t = (i + drift) / n, x = 20 + t * (W - 40), R = rng(Math.floor((i + 100) * 13 + (dense ? 7 : 3)));
    if (x < 80 || x > W - 80) continue;
    const r = (dense ? 30 : 20) + R() * (dense ? 22 : 16), y = gy - r * 0.9 - (dense ? 10 + Math.sin(t * 6) * 12 : 6 + R() * 30);
    const edge = Math.min(1, Math.min(x - 80, W - 80 - x) / 70);
    out.push(billow(R, x, y, r, { fill: dense ? '#e6e8e4' : '#eceee9', lobes: 8, outline: 1.2, ink: '#9aa19c', lift: 0.3, squash: 0.6, alpha: dense ? 1 : Math.max(0.55, edge) }));
    if (dense) out.push(billow(R, x + r * 0.6, gy - r * 0.5, r * 0.8, { fill: '#dadfda', lobes: 7, outline: 1, ink: '#9aa19c', lift: 0.25, squash: 0.55 }));
  }
  return doc(`fog-bank-${kind}-${frame + 1}`, W, H, `a ${dense ? 'dense' : 'thin'} bank of fog lying on the ground, drifting, frame ${frame + 1} of 3`, out.join(''), gy, null, 0.5);
}

// The marsh edge (`marsh-edge-1`..`-3`): Astra's `marsh-edge-dense` and `-sparse` (2026-10-08) since the merge of 2026-10-09.

// ---- the light of a night fight --------------------------------------------------------------------------------------------
// Not a sprite but a layer: the renderer stretches the grade over the whole view and multiplies it into what is drawn, at the
// strength the phase's light asks for (public/battle-view.js), so a change of pace changes only that strength and nothing
// snaps. White is no change. The 16-pixel clear gutter is only the library's sprite rule; the page draws the inside.
const GRADE = 256, GUTTER = 16;
function grade(name, stops, spot, note) {
  const id = name, inner = GRADE - GUTTER * 2;
  const body = `<defs><linearGradient id="${id}-v" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient><radialGradient id="${id}-s" cx="${spot.x}" cy="${spot.y}" r="${spot.r}"><stop offset="0" stop-color="${spot.colour}" stop-opacity="${spot.alpha}"/><stop offset="1" stop-color="${spot.colour}" stop-opacity="0"/></radialGradient><radialGradient id="${id}-edge" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${spot.vignette}"/></radialGradient></defs>
  <rect x="${GUTTER}" y="${GUTTER}" width="${inner}" height="${inner}" fill="url(#${id}-v)"/><rect x="${GUTTER}" y="${GUTTER}" width="${inner}" height="${inner}" fill="url(#${id}-s)"/><rect x="${GUTTER}" y="${GUTTER}" width="${inner}" height="${inner}" fill="url(#${id}-edge)"/>`;
  return { svg: frameDoc(name, GRADE, GRADE, note, body, MODULE), anchorX: +(0.5).toFixed(4), anchorY: 1, logicalHeight: GRADE };
}
export const GRADE_GUTTER = GUTTER / GRADE;

// Retired 2026-10-03 when Astra's own art of the same names was merged (Astra's art wins): the fog banks (`fog-bank-dense`, `fog-bank-thin`).
export const SHEETS = {
  'claude-banks-creeks': { cell: { w: 420, h: 260 }, columns: 3, request: CONCEPCION, replaceWith: 'items 1 and 7: a ground piece seen from above at the map\'s scale, transparent, laid along the bank or the creek',
    frames: [
      { name: 'riverbank-cut-e', height: 1.3, draw: () => pad(riverbank('e'), 420, 260), compare: [['earth-rampart', 1.3]], prompt: 'A length of the cut bank at Concepción: an earthen river bank running up the screen, its crest grassed, its raw brown face with strata and roots dropping to the east toward the men in the bottom, two steps cut into the face to stand on and fire from; outlined, lit from the upper left, transparent ground. Laid end to end along the bank.' },
      { name: 'riverbank-cut-w', height: 1.3, draw: () => pad(riverbank('w'), 420, 260), compare: [['earth-rampart', 1.3]], prompt: 'The same length of cut bank with its face and steps dropping to the west, for a bank held from the other side.' },
      { name: 'river-bend', height: 3, draw: () => pad(riverBend(), 420, 260), compare: [['water-ripple', 1]], prompt: 'A bend of a small Texas river - the horseshoe of the San Antonio below Concepción - between sandy banks with grass on their lips, teal water with pale ripple lines, seen from the three-quarter view; transparent ground.' },
      { name: 'creek-bed-dry', height: 2, draw: () => pad(creekBedDry(), 420, 260), compare: [['earth-rampart', 1]], prompt: 'A dry creek bed of the Grass Fight: a low cut bank, a bed of sand and grey cobbles with the marks of old water, dry grass along both lips; seen from the three-quarter view, transparent ground.' },
      { name: 'creek-ford', height: 2, draw: () => pad(creekFord(), 420, 260), compare: [['water-ripple', 1]], prompt: 'A creek forded on foot: teal water between a grassy far bank and a sandy near one, a shallow gravel bar across it where the water runs pale and stones break the surface; transparent ground.' },
    ] },
  'claude-grades': { cell: GRADE, columns: 3, request: ALAMO, replaceWith: 'item 4: a light layer the renderer lays over the ground and figures, not a sprite; must not snap when the pace changes',
    frames: [
      { name: 'night-grade', height: 1, prompt: 'A moonless night (San Patricio in the rain; the Alamo before the assault): a deep blue-violet laid over the ground and the figures by multiplying, darkest at the top and the edges, so that lit windows and fires drawn over it read. A layer, not a picture; white would be no change.', draw: () => grade('night-grade', [[0, '#1f2744'], [0.6, '#2c3658'], [1, '#34405f']], { x: 0.5, y: 0.7, r: 0.6, colour: '#46527a', alpha: 0.6, vignette: 0.35 }, 'the light of a moonless night, multiplied over the view') },
      { name: 'moonlight-grade', height: 1, prompt: 'A moonlit night (the storming of Béxar): a cool blue-silver laid over the view by multiplying, lighter toward the upper left where the moon is, darker to the lower right; things stay readable by their shapes. A layer, not a picture.', draw: () => grade('moonlight-grade', [[0, '#4d5b86'], [1, '#3a4568']], { x: 0.2, y: 0.15, r: 0.8, colour: '#b9c6e4', alpha: 0.8, vignette: 0.25 }, 'moonlight, multiplied over the view') },
      { name: 'dawn-grade', height: 1, prompt: 'The dawn coming up through the Alamo assault (sunrise 6:20 on March 6, 1836, computed): a cold blue above warming to a rose and amber low in the east, multiplied over the view; a layer, not a picture.', draw: () => grade('dawn-grade', [[0, '#6f7aa6'], [0.55, '#b39aa8'], [1, '#e6b07e']], { x: 0.85, y: 0.8, r: 0.6, colour: '#ffd9a0', alpha: 0.7, vignette: 0.15 }, 'the light at dawn, multiplied over the view') },
    ] },
};
/** A piece drawn in a smaller canvas, centred on the bottom of the sheet's cell (the anchor keeps its place on the ground). */
function pad(piece, W, H) {
  const m = piece.svg.match(/viewBox="0 0 (\d+) (\d+)"/), w = +m[1], h = +m[2], dx = Math.round((W - w) / 2), dy = H - h;
  const svg = piece.svg.replace(`width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"`, `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`).replace('<g stroke-linejoin', `<g transform="translate(${dx} ${dy})" stroke-linejoin`);
  return { svg, anchorX: +((dx + piece.anchorX * w) / W).toFixed(4), anchorY: +((dy + piece.anchorY * h) / H).toFixed(4), logicalHeight: H };
}

export const CLIPS = {
};
void GROUND;
