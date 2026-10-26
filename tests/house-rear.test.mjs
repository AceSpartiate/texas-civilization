// The house seen from behind (owner, 2026-10-13: "align the rear house views and turn them on"). Astra's rear walls
// (2026-10-11, docs/ART_DELIVERY_2026-10-11-HOUSE-OTHER-SIDES.md) are drawn where a pen's chimney stands against the gable
// toward the viewer, so that gable is blank logs instead of the front walls' door. Her sheet is drawn at its own, finer
// source resolution, and its anchor is not the same point of the footprint as the front walls': drawn as it came, at the
// front walls' place and height, the rear pen stood 7.7% wider than the front one and a twentieth of its width to the side
// of its ground.
//
// These tests draw with the page's own `drawSprite` (public/art.js, its sheets stubbed so nothing is fetched) and its own
// `drawHousePlot`, against a context that follows the transform, and measure what lands on the screen against the corner
// posts' feet read by eye off both sheets - not against the ground the atlas measured, which is what the fit uses.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot } from '../public/house-plot.js';
import { plotCatalogue } from '../sim/houseplot.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
globalThis.fetch = async url => {
  const path = String(url);
  if (path === '/assets/frontier-v1/atlas.json') return { ok: true, json: async () => atlas };
  if (/\.(png|webp)(\?|$)/.test(path)) return { ok: true, blob: async () => ({}) };
  return { ok: false };
};
globalThis.createImageBitmap = async () => ({ stub: 'sheet' });
const { drawSprite, loadArt, spriteFrame } = await import('../public/art.js');
await loadArt({ sheets: ['house-modules', 'house-back-views', 'houses-settling'] });
const catalogue = plotCatalogue();

/** A canvas context that keeps the transform and records every picture drawn, with the screen point of its own pixels. */
function recorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], drawn = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const byCut = new Map(Object.entries(atlas.frames).map(([name, f]) => [`${f.sheet}:${f.x},${f.y},${f.w},${f.h}`, name]));
  const sheetOf = new Map(Object.entries(atlas.frames).map(([, f]) => [`${f.x},${f.y},${f.w},${f.h}`, f.sheet]));
  return {
    drawn, globalAlpha: 1, fillStyle: '',
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    transform(a, b, c, d, e, f) { m = times(m, [a, b, c, d, e, f]); },
    fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, clip() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`, name = byCut.get(`${sheetOf.get(cut)}:${cut}`), frame = atlas.frames[name];
      const screen = (u, v) => { const x = dx + u * dw / sw, y = dy + v * dh / sh; return { x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] }; };
      drawn.push({ name, screen, foot: screen(frame.anchorX * frame.w, frame.anchorY * frame.h) });
    },
  };
}

// The feet of the three corner posts the viewer sees, read by eye (frame pixels): the front walls on a ten-pixel grid
// (tests/house-chimney.test.mjs reads the same), the rear on a five-pixel grid; each the middle of its post at its foot.
const BY_EYE = {
  'house-round-full-walls': { left: [12, 198], front: [180, 247], right: [290, 168] },
  'house-hewn-full-walls': { left: [12, 202], front: [175, 252], right: [288, 172] },
  'house-round-back-full-walls': { left: [15, 194], front: [178, 263], right: [305, 189] },
  'house-hewn-back-full-walls': { left: [15, 208], front: [181, 286], right: [313, 204] },
};
// The footprint as wide as the front walls' to within 2%, its middle within 2% of that width of theirs: unfitted the rear
// was 6% (round) to 9% (hewn) wider, and placed by its own anchor its middle stood 3.5% to the side. Each corner within 6%:
// Astra's rear draws its near gable a little steeper than the front walls' (her measured corners: the front corner 5% of
// the width to the left once the rest is fitted), which no uniform scale can take out.
const WIDE = 0.02, MIDDLE = 0.02, CORNER = 0.06;

const SIZE = 163.35;
const pen = (material, chimney) => [[`pen-${material}`, 3, 2, 13, 0], ...(chimney ? [['chimney', 5, 2, 1, 0]] : [])];
const wallsOf = ctx => { const all = ctx.drawn.filter(each => /full-walls$/.test(each.name)); assert.equal(all.length, 1, `${all.length} pens drawn`); return all[0]; };
const corners = walls => Object.fromEntries(Object.entries(BY_EYE[walls.name]).map(([k, [u, v]]) => [k, walls.screen(u, v)]));
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

for (const material of ['round', 'hewn']) {
  test(`a ${material}-log pen seen from behind stands on the ground the front walls stand on, at the front walls' size`, () => {
    // At 90 degrees the cabin's east chimney faces the viewer, and the pen is drawn from behind (`housePicture`); the same
    // pen with no chimney is drawn from the front, mirrored as the house is at a quarter turn, at the same cells.
    const draw = chimney => { const ctx = recorder(); drawHousePlot(ctx, 720, 500, SIZE, { house: { pieces: pen(material, chimney) } }, catalogue, drawSprite, spriteFrame, { rotation: 90 }); return wallsOf(ctx); };
    const [front, rear] = [draw(false), draw(true)];
    assert.equal(front.name, `house-${material}-full-walls`);
    assert.equal(rear.name, `house-${material}-back-full-walls`, 'the pen with its chimney against the gable toward the viewer is not seen from behind');
    const [f, r] = [corners(front), corners(rear)], wide = gap(f.left, f.right), what = `the ${material}-log pen from behind`;
    assert.ok(Math.abs(gap(r.left, r.right) / wide - 1) <= WIDE, `${what} is ${((gap(r.left, r.right) / wide - 1) * 100).toFixed(1)}% wider than from the front`);
    const middle = c => ({ x: (c.left.x + c.right.x) / 2, y: (c.left.y + c.right.y) / 2 });
    assert.ok(gap(middle(r), middle(f)) <= MIDDLE * wide, `${what} has its footprint's middle ${(gap(middle(r), middle(f)) / wide * 100).toFixed(1)}% of its width off the front walls'`);
    for (const k of ['left', 'front', 'right']) assert.ok(gap(r[k], f[k]) <= CORNER * wide, `${what} has its ${k} corner ${(gap(r[k], f[k]) / wide * 100).toFixed(1)}% of its width off the front walls'`);
  });
}

test('while the rear walls have not loaded the pen is drawn from the front, and its chimney stands against the front walls, not the rear ones it cannot draw', () => {
  // Astra's checklist, item 2: "handle unloaded-art fallback consistently across geometry and drawing". A `drawSprite` that
  // cannot draw the rear sheet yet, and says so.
  const rear = name => /-back-/.test(name);
  const notYet = Object.assign((ctx, name, ...rest) => rear(name) ? 0 : drawSprite(ctx, name, ...rest), { ready: name => !rear(name) && drawSprite.ready(name) });
  const ctx = recorder();
  drawHousePlot(ctx, 720, 500, SIZE, { house: { pieces: pen('round', true) } }, catalogue, notYet, spriteFrame, { rotation: 90 });
  const walls = wallsOf(ctx), chimney = ctx.drawn.find(each => /^house-chimney-/.test(each.name));
  assert.equal(walls.name, 'house-round-full-walls');
  // The chimney's foot against the middle of the front walls' gable toward the viewer (mirrored at 90: the right-front
  // face, from the front corner to the left one in the frame), a tenth of the pen's depth out (`CHIMNEY_STANDS_OUT`).
  const { left: l, front: f, right: r } = BY_EYE[walls.name];
  const foot = walls.screen((l[0] + f[0]) / 2 + 0.1 * (f[0] - r[0]), (l[1] + f[1]) / 2 + 0.1 * (f[1] - r[1]));
  const wide = gap(walls.screen(...l), walls.screen(...r));
  assert.ok(gap(chimney.foot, foot) <= 0.02 * wide, `the chimney stands ${(gap(chimney.foot, foot) / wide * 100).toFixed(1)}% of the pen's width off the front walls' gable`);
});

test('her rear full walls stand as high as the front ones: the wall top over the ground, in the front sheet\'s pixels', () => {
  // Request 2026-10-13, delivered 2026-10-26 by raising her own courses (scripts/local-art/rear_courses.py): from the middle of
  // the ground to the wall-top seat the rear stood 99 (round) and 97 (hewn) front-sheet pixels to the front's 116 and 125, so a
  // house of two pens was drawn from behind whole. Now within a twentieth of the front, and the rule is gone.
  const high = name => {
    const frame = atlas.frames[name], ground = (frame.ground.left[1] + frame.ground.right[1]) / 2;
    return (ground - frame.seatY) * frame.h / (frame.roofScale || 1);
  };
  for (const material of ['round', 'hewn']) {
    const front = high(`house-${material}-full-walls`), rear = high(`house-${material}-back-full-walls`);
    assert.ok(Math.abs(rear - front) / front < 0.05, `${material}: the rear walls stand ${rear.toFixed(1)} to the front's ${front.toFixed(1)}`);
  }
});
