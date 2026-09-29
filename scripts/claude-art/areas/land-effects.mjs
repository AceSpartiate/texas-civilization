// Effects of area F (docs/CLAUDE_ART_PLAN.md): the work's effects (F3, request 2026-09-28 — people at work, item 15), the
// smoke of a burning farm and town seen from afar (F4, request 2026-09-26 — the Mexican advance, item 2) and a campfire at
// night (F10, request 2026-09-25 — the south's fights, item 2). Drawn procedurally in the manner of Astra's `effects` sheet:
// outlined billows lit to the upper left, small outlined chips and clods, no text, transparent ground.
//
// **Scale.** Each work effect's frame is one person tall (logicalHeight = its cell height), drawn by public/work-art.js at the
// figure's height on the ground under the strike, so its particles land where the canvas stand-in's did (`EFFECTS`: the
// same heights, reaches and sizes in figure heights). East-facing; the page mirrors it for a figure facing west.
import { billow, solid, frameDoc, rng, shade, f1, INK } from '../land/paint.mjs';

export const AREA = 'land';
export const DATE = '2026-09-28';
const MODULE = 'land-effects';
const WORK = 'Request 2026-09-28 — people at work';
const ADVANCE = 'Request 2026-09-26 — the Mexican advance';
const SOUTH = "Request 2026-09-25 — the south's fights: San Patricio by night and Agua Dulce Creek";

// ---- the work's effects: 160 px = one person, ground at y 150 --------------------------------------------------------
const FX = 160, GY = 150, P = FX; // P: pixels a person
// Drawn in 160 units and rendered at twice that (a 320 px cell), so a small effect still has the library's minimum of real paint.
const CELL = FX * 2, doubled = body => `<g transform="scale(2)">${body}</g>`;
const frameOf = (name, note, body, originX) => ({ svg: frameDoc(name, CELL, CELL, note, doubled(body), MODULE), anchorX: +(originX / FX).toFixed(4), anchorY: +(GY / FX).toFixed(4), logicalHeight: CELL });

/** Particles thrown from (ox, oy) out `out` and up `up` (persons) along an arc, at phase u (0 at the strike, 1 landed). */
function arc(R, n, u, { ox, oy, out, up, spread = 0.65 }) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = 0.35 + spread * R(), b = 0.5 + R();
    const x = ox + out * P * a * u, y = oy - up * P * b * (u - u * u * 1.6);
    list.push({ x, y: Math.min(GY - 2, y), turn: R() * 360 + u * 400 * (R() - 0.5), k: 0.8 + R() * 0.5 });
  }
  return list;
}
const U = [0.18, 0.55, 0.92];

function woodChips(f) {
  const R = rng(101), u = U[f], ox = 30, oy = GY - 0.2 * P, parts = [];
  if (f === 0) parts.push(`<path d="M ${ox - 4} ${f1(oy)} l -10 -8 M ${ox - 2} ${f1(oy - 4)} l -4 -13 M ${ox} ${f1(oy + 3)} l -12 4" stroke="#fff3cf" stroke-width="2.2"/>`);
  for (const c of arc(R, 7, u, { ox, oy, out: 0.55, up: 0.42 })) {
    const s = 7.2 * c.k;
    parts.push(solid(c.x, c.y, [[-s, -s * 0.28], [s * 0.8, -s * 0.4], [s, s * 0.25], [-s * 0.7, s * 0.35]], R() < 0.3 ? '#9c6b3f' : '#e6c690', c.turn, 1));
  }
  if (f === 2) for (let i = 0; i < 3; i++) parts.push(solid(ox + 30 + i * 22 + R() * 8, GY - 1, [[-5, -1.5], [5, -2], [5, 1.5], [-5, 1.5]], '#e2c08a', R() * 30 - 15, 0.9));
  return frameOf(`fx-wood-chips-${f + 1}`, `pale chips flying from an axe cut, frame ${f + 1} of 3`, parts.join(''), ox);
}
function earthToss(f) {
  const R = rng(202), u = U[f], ox = 130, oy = GY - 0.08 * P, parts = [];
  if (f === 0) parts.push(billow(R, ox - 10, oy - 6, 13, { fill: '#6b4a2b', lobes: 6, outline: 1.3 }));
  for (const c of arc(R, 6, u, { ox, oy, out: -0.5, up: 0.55 })) {
    const s = 8 * c.k;
    parts.push(solid(c.x, c.y, [[-s, -s * 0.2], [-s * 0.3, -s * 0.8], [s * 0.7, -s * 0.5], [s, s * 0.3], [0, s * 0.7]], R() < 0.35 ? '#4b3220' : '#6b4a2b', c.turn, 1.1));
  }
  if (f === 2) parts.push(billow(R, ox - 70, GY - 6, 12, { fill: '#b89c74', lobes: 6, outline: 1.1, alpha: 0.85 }), billow(R, ox - 48, GY - 4, 8, { fill: '#b89c74', lobes: 5, outline: 1, alpha: 0.8 }));
  return frameOf(`fx-earth-toss-${f + 1}`, `a spadeful of dark earth thrown back, frame ${f + 1} of 3`, parts.join(''), ox);
}
function dust(f) {
  const R = rng(303), ox = 50, parts = [];
  const sizes = [[10, 0], [15, 24], [15, 44]][f], alpha = 1;
  parts.push(billow(R, ox + sizes[1] * 0.4, GY - sizes[0] * 0.7, sizes[0], { fill: '#c9b08a', lobes: 7, outline: 1.3, alpha }));
  if (f) parts.push(billow(R, ox + sizes[1], GY - sizes[0] * 0.5, sizes[0] * 0.7, { fill: '#c9b08a', lobes: 6, outline: 1.2, alpha: alpha * 0.9 }));
  if (f === 2) parts.push(billow(R, ox + sizes[1] + 22, GY - 8, 8, { fill: '#c9b08a', lobes: 5, outline: 1, alpha: 0.5 }));
  for (let i = 0; i < 3 + f; i++) parts.push(`<circle cx="${f1(ox + 10 + R() * (20 + f * 25))}" cy="${f1(GY - 16 - R() * (10 + f * 10))}" r="${f1(1.8 + R())}" fill="#a88e68" stroke="${INK}" stroke-width="0.7"/>`);
  return frameOf(`fx-dust-${f + 1}`, `a low puff of dust where a hoe strikes dry ground, frame ${f + 1} of 3`, parts.join(''), ox);
}
function shavings(f) {
  const R = rng(404), u = U[f], ox = 50, oy = GY - 0.42 * P, parts = [];
  for (const c of arc(R, 7, u, { ox, oy, out: 0.25, up: 0.2, spread: 0.9 })) {
    const s = 7.5 * c.k;
    parts.push(`<path transform="translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(c.turn)})" d="M ${f1(-s)} 0 C ${f1(-s)} ${f1(-s)} ${f1(s * 0.8)} ${f1(-s)} ${f1(s * 0.8)} 0 C ${f1(s * 0.8)} ${f1(s * 0.6)} ${f1(-s * 0.2)} ${f1(s * 0.6)} ${f1(-s * 0.1)} ${f1(s * 0.1)}" fill="none" stroke="${INK}" stroke-width="3.4"/><path transform="translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(c.turn)})" d="M ${f1(-s)} 0 C ${f1(-s)} ${f1(-s)} ${f1(s * 0.8)} ${f1(-s)} ${f1(s * 0.8)} 0 C ${f1(s * 0.8)} ${f1(s * 0.6)} ${f1(-s * 0.2)} ${f1(s * 0.6)} ${f1(-s * 0.1)} ${f1(s * 0.1)}" fill="none" stroke="#f0dcaa" stroke-width="1.8"/>`);
  }
  if (f === 2) for (let i = 0; i < 3; i++) parts.push(`<path d="M ${f1(ox + 6 + i * 12)} ${GY - 1} q 3 -5 6 0" fill="none" stroke="#e2c690" stroke-width="2" />`);
  return frameOf(`fx-shavings-${f + 1}`, `curls of shaving coming off a drawknife, frame ${f + 1} of 3`, parts.join(''), ox);
}
// Anchored at the near edge of the widest ring (0.09 of a person below the float), so no ring is painted under the anchor.
function ripple(f) {
  const cx = 80, cy = 126, parts = [];
  const rings = [[0.1], [0.16, 0.07], [0.24, 0.14]][f];
  // The water stirred round the float, paler than the pond.
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${f1(rings[0] * P * 0.9)}" ry="${f1(rings[0] * P * 0.3)}" fill="#a9c6cb" opacity="0.45"/>`);
  rings.forEach((r, i) => {
    const rx = r * P, ry = rx * 0.34, a = i ? 0.7 : 1;
    parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="#3f5f68" stroke-width="3.2" opacity="${f1(a * 100) / 100}"/><ellipse cx="${cx}" cy="${cy}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="#e8f2f2" stroke-width="1.7" opacity="${f1(a * 100) / 100}"/>`);
  });
  if (f === 0) parts.push(`<path d="M ${cx - 5} ${cy - 3} q 2 -6 4 -1 M ${cx + 3} ${cy - 3} q 2 -5 4 0" fill="none" stroke="#e8f2f2" stroke-width="1.6"/>`);
  return { svg: frameDoc(`fx-ripple-${f + 1}`, CELL, CELL, `rings spreading on still water round a fishing float, frame ${f + 1} of 3`, doubled(parts.join('')), MODULE), anchorX: 0.5, anchorY: +((cy + 14) / FX).toFixed(4), logicalHeight: CELL };
}

const FX_DEFS = {
  'fx-wood-chips': { draw: woodChips, what: 'pale wood chips and a bit of bark flying from an axe cut, up and out ahead of the chopper and falling', compare: [['rust-work-3', 1], ['smoke-small', 0.4]] },
  'fx-earth-toss': { draw: earthToss, what: 'a spadeful of dark earth thrown back over the digger\'s shoulder, the clods arcing and landing in a small puff of dust', compare: [['rust-work-3', 1]] },
  'fx-dust': { draw: dust, what: 'a low puff of tan dust where a hoe strikes dry ground, spreading and thinning', compare: [['rust-work-3', 1], ['dust-small', 0.4]] },
  'fx-shavings': { draw: shavings, what: 'pale curls of shaving coming off a drawknife at the shaving horse, tumbling to the ground', compare: [['rust-repair', 1]] },
  'fx-ripple': { draw: ripple, what: 'rings spreading on still water round a fishing float, pale on the water with a dark edge', compare: [['water-ripple', 0.3]] },
};

// ---- the smoke of a burning farm or town, seen from afar --------------------------------------------------------------
// A tall column leaning with the wind (to the right) over a low orange glow; eight frames looping, the billows rising
// through the column. Each billow's shape is a smooth function of its height, not of which billow it is, so the eighth frame
// runs into the first without a jump (a billow at a height always looks the same, and changes as it climbs).
function column({ name, w, h, gy, ox, spread, columns, frame, dark }) {
  const parts = [], N = 18, id = name.replace(/[^a-z0-9-]/g, '');
  // The glow at the foot: a warm light on the ground, flickering a little from frame to frame.
  const flick = 1 + 0.08 * Math.sin(frame * 2.1) + 0.05 * Math.sin(frame * 5.3);
  parts.push(`<defs><radialGradient id="${id}-glow"><stop offset="0" stop-color="#ffcf6a" stop-opacity="0.8"/><stop offset="0.45" stop-color="#e2772a" stop-opacity="0.45"/><stop offset="1" stop-color="#b8401c" stop-opacity="0"/></radialGradient></defs>`);
  parts.push(`<ellipse cx="${ox + spread * 0.2}" cy="${gy - 6}" rx="${f1(spread * 0.9 * flick)}" ry="${f1(12 * flick)}" fill="url(#${id}-glow)"/>`);
  for (const c of columns) {
    const billows = [];
    for (let i = N - 1; i >= 0; i--) {
      const t = (i + frame / 8) / N;
      if (t > 1) continue;
      const r = c.r0 + c.r1 * t, lift = Math.min(1, t * 1.3);
      // The top of the column (t = 1) stays inside the frame with its billow; it is the thinnest part.
      const x = ox + c.dx + Math.pow(t, 1.35) * c.lean + Math.sin(t * 9 + c.dx) * 7 * t, y = gy - 14 - t * (gy - 20 - c.r0 - c.r1) * c.height;
      const fill = shade(dark, lift * 0.45), alpha = t > 0.66 ? Math.max(0, 1 - (t - 0.66) / 0.34) : 1;
      // Shape as a function of height: a repeatable generator seeded from the height band, blended smoothly.
      const seed = Math.floor(t * 40) + c.seed, R = rng(seed * 7919);
      billows.push(billow(R, x + (R() - 0.5) * r * 0.5, y, r, { fill, lobes: 9, outline: 1.6, alpha: f1(alpha * 100) / 100, squash: 0.75, lift: 0.14 }));
    }
    parts.push(...billows);
  }
  // Embers going up in the first few billows, and the glow's light under the smoke's foot.
  const R = rng(frame * 13 + 5);
  for (let i = 0; i < 5; i++) { const t = ((i * 0.23 + frame / 8) % 1) * 0.25; parts.push(`<circle cx="${f1(ox + (R() - 0.5) * spread * 0.6 + t * 30)}" cy="${f1(gy - 10 - t * (h - 40))}" r="1.8" fill="#ffb347" opacity="${f1((1 - t * 3) * 100) / 100}"/>`); }
  return frameDoc(name, w, h, `a column of smoke leaning with the wind over a low orange glow, frame ${frame + 1} of 8`, parts.join(''), MODULE);
}
const FARM = { w: 240, h: 440, gy: 428, ox: 70, spread: 40, dark: '#3b3531', columns: [{ dx: 0, lean: 120, r0: 16, r1: 40, height: 1, seed: 1 }] };
const TOWN = { w: 380, h: 460, gy: 448, ox: 110, spread: 90, dark: '#37322e', columns: [{ dx: -30, lean: 130, r0: 20, r1: 46, height: 0.86, seed: 11 }, { dx: 40, lean: 140, r0: 22, r1: 50, height: 1, seed: 23 }, { dx: 5, lean: 150, r0: 24, r1: 56, height: 0.95, seed: 37 }] };
const smokeFrame = (spec, kind, frame) => ({ svg: column({ ...spec, name: `${kind}-smoke-rise-${frame + 1}`, frame }), anchorX: +(spec.ox / spec.w).toFixed(4), anchorY: +(spec.gy / spec.h).toFixed(4), logicalHeight: spec.h });

// ---- a campfire burning at night --------------------------------------------------------------------------------------
function campfireNight(frame) {
  const W = 200, H = 170, gy = 150, cx = 100, R = rng(900 + frame), name = `campfire-night-${frame + 1}`, parts = [];
  parts.push(`<defs><radialGradient id="${name}-pool"><stop offset="0" stop-color="#ffc56a" stop-opacity="0.75"/><stop offset="0.5" stop-color="#e98a36" stop-opacity="0.35"/><stop offset="1" stop-color="#b5521f" stop-opacity="0"/></radialGradient><radialGradient id="${name}-halo"><stop offset="0" stop-color="#ffe7a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs>`);
  // The pool of firelight on the ground, and a halo round the flames: light, not shadow.
  parts.push(`<ellipse cx="${cx}" cy="${gy - 4}" rx="${f1(88 + frame * 3)}" ry="24" fill="url(#${name}-pool)"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${gy - 44}" rx="${f1(56 + (frame % 2) * 5)}" ry="${f1(52 + (frame % 2) * 4)}" fill="url(#${name}-halo)"/>`);
  // Ring of stones, the far ones first.
  const stones = 10;
  for (const back of [true, false]) for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2, sx = cx + Math.cos(a) * 40, sy = gy - 8 + Math.sin(a) * 11;
    if ((Math.sin(a) < 0) !== back) continue;
    if (!back) continue;
    parts.push(`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(9 + (i % 3))}" ry="${f1(6 + (i % 2))}" fill="#7b7468" stroke="${INK}" stroke-width="1.4"/><ellipse cx="${f1(sx - 2)}" cy="${f1(sy - 2)}" rx="4" ry="2.4" fill="#d9a466" opacity="0.8"/>`);
  }
  // Logs crossed, glowing at their ends.
  for (const [a, b, c, d] of [[cx - 30, gy - 6, cx + 20, gy - 20], [cx + 30, gy - 6, cx - 18, gy - 22], [cx - 8, gy - 2, cx + 6, gy - 26]]) {
    parts.push(`<path d="M ${a} ${b} L ${c} ${d}" stroke="${INK}" stroke-width="10.5"/><path d="M ${a} ${b} L ${c} ${d}" stroke="#5a3a22" stroke-width="8"/><path d="M ${f1(a + (c - a) * 0.55)} ${f1(b + (d - b) * 0.55)} L ${c} ${d}" stroke="#e8662a" stroke-width="5" opacity="0.9"/>`);
  }
  // The flames: three tongues and a core, shifting frame to frame.
  const tongue = (x, top, wd, fill, lean) => `<path d="M ${f1(x - wd)} ${gy - 14} C ${f1(x - wd * 1.1)} ${f1(gy - 30)} ${f1(x - wd * 0.3 + lean)} ${f1(top + 20)} ${f1(x + lean)} ${f1(top)} C ${f1(x + wd * 0.4 + lean)} ${f1(top + 22)} ${f1(x + wd * 1.1)} ${f1(gy - 30)} ${f1(x + wd)} ${gy - 14} Z" fill="${fill}"/>`;
  const sway = [0, 4, -3][frame], tall = [0, 8, 3][frame];
  parts.push(`<g stroke="${INK}" stroke-width="1.4">${tongue(cx - 14, gy - 62 - tall * 0.5, 13, '#d9481f', -4 + sway)}${tongue(cx + 14, gy - 58 + tall * 0.3, 12, '#d9481f', 3 + sway)}${tongue(cx, gy - 84 - tall, 19, '#e8662a', sway)}</g>`);
  parts.push(tongue(cx, gy - 70 - tall, 12, '#f7a33a', sway * 0.7), tongue(cx - 1, gy - 52 - tall * 0.6, 7, '#ffe08a', sway * 0.5));
  // Front stones, over the logs' feet.
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2, sx = cx + Math.cos(a) * 40, sy = gy - 8 + Math.sin(a) * 11;
    if (Math.sin(a) < 0) continue;
    parts.push(`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(9 + (i % 3))}" ry="${f1(6 + (i % 2))}" fill="#6a6358" stroke="${INK}" stroke-width="1.4"/><ellipse cx="${f1(sx - 2)}" cy="${f1(sy - 3)}" rx="4" ry="2" fill="#f0b870" opacity="0.85"/>`);
  }
  for (let i = 0; i < 6; i++) { const y = gy - 90 - R() * 50, x = cx + (R() - 0.5) * 40 + sway * 2; parts.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.3 + R() * 1.2)}" fill="#ffd27a"/>`); }
  return { svg: frameDoc(name, W, H, `a campfire burning at night, its light on the ground round it, frame ${frame + 1} of 3`, parts.join(''), MODULE), anchorX: 0.5, anchorY: +(gy / H).toFixed(4), logicalHeight: 140 };
}

export const SHEETS = {
  'claude-work-effects': { cell: CELL, columns: 6, request: WORK, replaceWith: 'item 15: 3 frames on the ground anchor of the work, one played from the strike, east-facing and mirrored',
    frames: Object.entries(FX_DEFS).flatMap(([name, def]) => [0, 1, 2].map(f => ({ name: `${name}-${f + 1}`, height: 1, compare: def.compare,
      prompt: `${def.what}; frame ${f + 1} of 3 (${['the strike', 'in the air', 'coming down'][f]}). One person tall on the ground under the strike, east-facing (mirrored for west), in the manner of Astra's effects sheet: small outlined shapes, billows lit to the upper left, transparent ground, no shadow, no text.`,
      draw: () => def.draw(f) }))) },
  'claude-smoke-rise': { cell: { w: TOWN.w, h: TOWN.h }, columns: 8, request: ADVANCE, replaceWith: 'item 2: a looping 6-8 frame clip, readable at 30-160 px, anchored at the foot of the column',
    frames: [['farm', FARM], ['town', TOWN]].flatMap(([kind, spec]) => [...Array(8).keys()].map(f => ({ name: `${kind}-smoke-rise-${f + 1}`, height: kind === 'town' ? 4.4 : 3, compare: [['chimney-smoke', 1.2], ['smoke-column-far-2', 3]],
      prompt: `A ${kind === 'town' ? 'town' : 'farm'} burning twenty miles off, seen only as its smoke: ${kind === 'town' ? 'three broad dark columns merging' : 'one tall dark column'} leaning with the wind to the right, billowing and paling as it rises and thinning at the top, over a low orange glow at its foot - never the fire itself or what is burning (VISION.md §16). Frame ${f + 1} of 8, the billows rising through the column so the loop runs on. Outlined billows lit to the upper left, as Astra's smoke; transparent ground.`,
      draw: () => smokeFrame({ ...(kind === 'town' ? TOWN : FARM), w: TOWN.w, h: TOWN.h, gy: TOWN.h - 12, ox: (kind === 'town' ? TOWN : FARM).ox + (kind === 'town' ? 0 : 60) }, kind, f) }))) },
  'claude-campfire-night': { cell: { w: 200, h: 170 }, columns: 3, request: SOUTH, replaceWith: 'item 2: a campfire burning at night, 2-4 frames, the light round it reading through the dark',
    frames: [0, 1, 2].map(f => ({ name: `campfire-night-${f + 1}`, height: 0.9, compare: [['campfire', 0.9]],
      prompt: `A campfire burning at night (San Patricio's camp, a moonless rain night): a ring of stones, three logs crossed and glowing at their ends, tall bright flames in three tongues with a yellow core, sparks going up, and a warm pool of firelight on the ground round it that reads through the dark wash over the field - light, not shadow. Frame ${f + 1} of 3 of the flicker. In the manner of Astra's campfire; transparent ground, no text.`,
      draw: () => campfireNight(f) })) },
};

export const CLIPS = {
  ...Object.fromEntries(Object.keys(FX_DEFS).map(name => [name, { frames: [1, 2, 3].map(n => ({ sprite: `${name}-${n}`, duration: name === 'fx-ripple' ? 800 : 160 })), loop: false, motion: 'none', direction: 'east; west by mirroring',
    prompt: `${FX_DEFS[name].what}: three frames played once from the strike.` }])),
  'farm-smoke-rise': { frames: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ sprite: `farm-smoke-rise-${n}`, duration: 260 })), loop: true, motion: 'none', direction: 'not applicable', prompt: 'The smoke of a burning farm seen from afar, rising and leaning with the wind over a low glow, looping.' },
  'town-smoke-rise': { frames: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ sprite: `town-smoke-rise-${n}`, duration: 280 })), loop: true, motion: 'none', direction: 'not applicable', prompt: 'The smoke of a burning town seen from afar: three broad columns merging, rising and leaning with the wind, looping.' },
  'campfire-night': { frames: [1, 2, 3, 2].map(n => ({ sprite: `campfire-night-${n}`, duration: 150 })), loop: true, motion: 'none', direction: 'not applicable', prompt: 'A campfire burning at night, its flames flickering and its light on the ground, looping.' },
};
