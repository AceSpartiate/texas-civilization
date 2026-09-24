// A chimney stands against its gable wall (owner, 2026-09-23: "Something looks wrong with the chimneys too. Are they
// positioned correctly?"). An 1830s Texas log house had an exterior chimney centred in one gable wall (`HIST-GONZ-025`),
// and a saddlebag its "big double chimney" between two pens (`HIST-TEX-017`). The page drew each chimney at the front of its
// own cell of the plot, and the sheet draws a pen corner-on, two and a half cells wide and little more than one deep, so
// that cell is not where the picture's wall is: a round-log cabin's chimney stood on the grass to its right at 0 degrees,
// in front of it at 90, and the dog-run's at its two ends, apart from both pens.
//
// These tests draw with the page's own `drawSprite` (public/art.js, its sheets stubbed so nothing is fetched), its own
// `drawHousePlot` and its own `drawPlacedHouse` (read out of public/app.js), against a context that follows the transform,
// and check where each chimney's foot lands against the gable wall read by eye off the sheet - the feet of the corner posts
// on a ten-pixel grid - and not against the ground the atlas measured, which is what is being checked. Which gable a
// chimney is on comes from the plan (east of its pen or west of it), and which face of the picture that gable is at each
// turn is written out below, not taken from the code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
import { CABIN_PEOPLE, turned } from '../sim/house-footprint.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { declaration, pageCamera } from './support/page-camera.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
globalThis.fetch = async url => {
  const path = String(url);
  if (path === '/assets/frontier-v1/atlas.json') return { ok: true, json: async () => atlas };
  if (/\.png(\?|$)/.test(path)) return { ok: true, blob: async () => ({}) };
  return { ok: false };
};
globalThis.createImageBitmap = async () => ({ stub: 'sheet' });
const { drawSprite, loadArt, spriteFrame } = await import('../public/art.js');
await loadArt({ sheets: ['house-modules', 'houses-settling'] });
const catalogue = plotCatalogue();

const SIZE = new Function('CABIN_PEOPLE', `${declaration('const SIZE = {', '\n};')} return SIZE;`)(CABIN_PEOPLE);
const { drawPlacedHouse } = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window',
  `${declaration('const cabinSize = ', ';\n')}\n${declaration('function drawPlacedHouse(', '\n}\n')}\nreturn { cabinSize, drawPlacedHouse };`,
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, {});

/** A canvas context that keeps the transform and records, in order, every picture drawn and every shape filled. */
function recorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], drawn = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const apply = (at, x, y) => ({ x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] });
  const byCut = new Map(Object.entries(atlas.frames).map(([name, f]) => [`${f.sheet}:${f.x},${f.y},${f.w},${f.h}`, name]));
  const sheetOf = new Map(Object.entries(atlas.frames).map(([, f]) => [`${f.x},${f.y},${f.w},${f.h}`, f.sheet]));
  return {
    drawn, globalAlpha: 1, fillStyle: '',
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    transform(a, b, c, d, e, f) { m = times(m, [a, b, c, d, e, f]); },
    strokeRect() {},
    fillRect(x, y, w, h) {
      const at = m, [a, b] = [apply(at, x, y), apply(at, x + w, y + h)];
      // A chimney drawn as a shape (the double chimney's stand-in, in the chimneys' colours); not the preview's outline.
      if (!['#9a6b43', '#9b968a'].includes(this.fillStyle)) return;
      drawn.push({ name: 'filled', box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) }, foot: apply(at, x + w / 2, y + h) });
    },
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`;
      const name = byCut.get(`${sheetOf.get(cut)}:${cut}`), frame = atlas.frames[name];
      // The screen point of the frame's own pixel (u, v).
      const screen = (u, v) => apply(at, dx + u * dw / sw, dy + v * dh / sh);
      const [a, b] = [screen(0, 0), screen(sw, sh)];
      drawn.push({ name, screen, foot: screen(frame.anchorX * frame.w, frame.anchorY * frame.h), box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) } });
    },
  };
}

// The feet of the three corner posts the viewer sees, read by eye off the sheet on a ten-pixel grid (frame pixels, as
// scripts/build-atlas-manifest.mjs cuts them). The fourth, behind the walls, closes the figure.
const BY_EYE = {
  'house-round-full-walls': { left: [12, 198], front: [180, 247], right: [290, 168] },
  'house-hewn-full-walls': { left: [12, 202], front: [175, 252], right: [288, 172] },
};
// The two gable walls in the sheet's picture: the roof's gables are over the face to the left and front (the one with the
// door) and the face to the right and back. Mirrored at a quarter turn they are the right-front and left-back faces.
const face = (name, front) => {
  const { left: l, front: f, right: r } = BY_EYE[name], b = [l[0] + r[0] - f[0], l[1] + r[1] - f[1]];
  // The wall's two ends, and the pen's depth through it, pointing out of the pen.
  return front ? { ends: [l, f], out: [f[0] - r[0], f[1] - r[1]] } : { ends: [r, b], out: [r[0] - f[0], r[1] - f[1]] };
};
// Which face of the picture each gable is at each turn. The turn is clockwise on the screen, east to south (`turned`), and
// a quarter turn mirrors the picture: east is to the right at 0, toward the viewer at 90, to the left at 180, away at 270.
const GABLE = {
  east: { 0: 'right-back', 90: 'right-front', 180: 'left-front', 270: 'left-back' },
  west: { 0: 'left-front', 90: 'left-back', 180: 'right-back', 270: 'right-front' },
};
// A chimney's foot is centred on its wall to within a tenth of the wall's length, and stands outside it by no more than a
// fifth of the pen's depth (public/house-plot.js `CHIMNEY_STANDS_OUT` is a tenth). Drawn at the front of its own
// cell it was more than half the wall's length off the middle and most of a pen's depth out.
const CENTRED = 0.1, OUTSIDE = 0.2;
// The saddlebag's double chimney: its foot within this share of a pen's drawn width of the middle between its two walls.
const BETWEEN = 0.06;

const at = (plan, penStage) => catalogue.plans.find(each => each.id === plan).pieces.map(([type, x, y]) => {
  const kind = catalogue.pieces.find(piece => piece.id === type);
  return [type, x, y, kind.pen ? penStage ?? kind.stageCount : kind.stageCount, 0];
});
const PLANS = catalogue.plans.map(plan => plan.id);
const camera = scale => pageCamera(scale, p => ({ x: 720 + p.x * scale, y: 500 + p.y * scale }));

/** Every way the house is drawn: in the chooser and at its site (unturned), and placed and previewed at each turn and zoom. */
function draws(plan, penStage) {
  const out = [];
  for (const size of [65, 163.35]) { const ctx = recorder(); drawHousePlot(ctx, 720, 500, size, { house: { pieces: at(plan, penStage) } }, catalogue, drawSprite, spriteFrame); out.push({ where: `${size} high at its site`, rotation: 0, ctx }); }
  for (const rotation of [0, 90, 180, 270]) for (const scale of [400, 2600, 9000]) for (const alpha of [1, 0.5]) {
    const ctx = recorder(); drawPlacedHouse(ctx, camera(scale), { placement: { x: 0.1, y: -0.05, rotation }, pieces: at(plan, penStage) }, alpha);
    out.push({ where: `placed at ${rotation} degrees, ${scale} pixels a mile${alpha < 1 ? ', as its preview' : ''}`, rotation, ctx });
  }
  return out;
}

/** The plan's pens and chimneys, each with the drawing of it, matched along the house's turned east. */
function matched(plan, rotation, ctx) {
  const pieces = catalogue.plans.find(each => each.id === plan).pieces;
  const [ex, ey] = turned(1, 0, rotation), along = p => p.x * ex + p.y * ey;
  const byEast = (a, b) => a[1] - b[1];
  const pens = pieces.filter(([type]) => type.startsWith('pen-')).sort(byEast);
  const walls = ctx.drawn.map((each, index) => ({ ...each, index })).filter(each => /full-walls$/.test(each.name)).sort((a, b) => along(a.foot) - along(b.foot));
  assert.equal(walls.length, pens.length, `${plan}: ${walls.length} pens drawn for ${pens.length}`);
  return { pens: pens.map((pen, i) => ({ x: pen[1], y: pen[2], walls: walls[i] })), along };
}

/** A gable wall on the screen: its middle, its length and the pen's depth through it, as vectors. */
function onScreen(walls, which, rotation) {
  const front = which.endsWith('front'), { ends: [a, b], out } = face(walls.name, front);
  const [sa, sb] = [walls.screen(...a), walls.screen(...b)], middle = walls.screen((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  const o = walls.screen((a[0] + b[0]) / 2 + out[0], (a[1] + b[1]) / 2 + out[1]);
  // The face named is the face drawn: to the left or right of the pen's foot, mirrored at a quarter turn.
  assert.equal(middle.x < walls.foot.x, which.startsWith('left'), `the ${which} gable at ${rotation} is drawn on the ${middle.x < walls.foot.x ? 'left' : 'right'}`);
  return { middle, along: [sb.x - sa.x, sb.y - sa.y], out: [o.x - middle.x, o.y - middle.y], front };
}
/** A point as so much of a wall's length along it and so much of the pen's depth out from it. */
function measure(point, wall) {
  const [dx, dy] = [point.x - wall.middle.x, point.y - wall.middle.y], [[a, b], [c, d]] = [wall.along, wall.out];
  const det = a * d - b * c;
  return { along: (dx * d - dy * c) / det, out: (a * dy - b * dx) / det };
}
const overlaps = (a, b) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
/** Where a pen's last picture was drawn: its roof, or its walls where there is none yet. */
const lastOf = (ctx, walls) => { const next = ctx.drawn[walls.index + 1]; return next && /roof/.test(next.name) ? walls.index + 1 : walls.index; };

for (const plan of PLANS) {
  test(`the ${plan} house's chimneys stand against their gable walls, centred, and drawn in front of or behind them, at every turn`, () => {
    const chimneys = catalogue.plans.find(each => each.id === plan).pieces.filter(([type]) => /^chimney/.test(type));
    for (const penStage of [12, undefined]) for (const { where, rotation, ctx } of draws(plan, penStage)) {
      const isChimney = each => /chimney/.test(each.name || '') || each.name === 'filled';
      // The jacal has none, and draws none.
      if (!chimneys.length) { assert.equal(ctx.drawn.filter(isChimney).length, 0, `${plan}, ${where}: a chimney drawn`); continue; }
      const { pens, along } = matched(plan, rotation, ctx);
      const drawnChimneys = ctx.drawn.map((each, index) => ({ ...each, index })).filter(isChimney).sort((a, b) => along(a.foot) - along(b.foot));
      assert.equal(drawnChimneys.length, chimneys.length, `${plan}, ${where}: ${drawnChimneys.length} chimneys drawn for ${chimneys.length}`);
      chimneys.sort((a, b) => a[1] - b[1]).forEach(([type, x, y], i) => {
        const chimney = drawnChimneys[i], what = `${plan}, ${where}: the ${type} at ${x},${y}`;
        if (type === 'chimney-double') {
          // Between the west pen's east gable and the east pen's west gable, touching both.
          const west = pens.find(pen => pen.x + 2 === x && pen.y === y), east = pens.find(pen => pen.x === x + 1 && pen.y === y);
          const [a, b] = [onScreen(west.walls, GABLE.east[rotation], rotation), onScreen(east.walls, GABLE.west[rotation], rotation)];
          const middle = { x: (a.middle.x + b.middle.x) / 2, y: (a.middle.y + b.middle.y) / 2 }, wide = west.walls.box.right - west.walls.box.left;
          const off = Math.hypot(chimney.foot.x - middle.x, chimney.foot.y - middle.y);
          assert.ok(off <= BETWEEN * wide, `${what} stands ${(off / wide * 100).toFixed(1)}% of a pen's width off the middle between its two walls`);
          for (const pen of [west, east]) assert.ok(overlaps(chimney.box, pen.walls.box), `${what} does not touch the pen at ${pen.x},${pen.y}`);
          // Drawn after the pen whose gable it stands in front of, and before the one whose gable it stands behind.
          const [before, after] = a.front ? [west, east] : [east, west];
          assert.equal(a.front, !b.front, `${what}: both its walls on the same side`);
          assert.ok(chimney.index > lastOf(ctx, before.walls) && chimney.index < after.walls.index, `${what} is drawn at ${chimney.index}, not after the pen in front (${lastOf(ctx, before.walls)}) and before the one behind (${after.walls.index})`);
          return;
        }
        // East of its pen it is on the pen's east gable; west of it, the west.
        const east = pens.find(pen => pen.x + 2 === x && y >= pen.y && y < pen.y + 2), pen = east || pens.find(pen => pen.x - 1 === x && y >= pen.y && y < pen.y + 2);
        const which = GABLE[east ? 'east' : 'west'][rotation], wall = onScreen(pen.walls, which, rotation), { along: t, out } = measure(chimney.foot, wall);
        assert.ok(Math.abs(t) <= CENTRED, `${what} stands ${(t * 100).toFixed(0)}% of its ${which} wall's length off the middle of it`);
        assert.ok(out >= 0 && out <= OUTSIDE, `${what} stands ${(out * 100).toFixed(0)}% of the pen's depth ${out < 0 ? 'inside' : 'outside'} its ${which} wall`);
        // Behind the walls it is drawn first and the pen hides its foot; in front of them, after the pen and its roof.
        if (wall.front) assert.ok(chimney.index > lastOf(ctx, pen.walls), `${what} is against the ${which} gable and drawn before its pen`);
        else assert.ok(chimney.index < pen.walls.index, `${what} is against the ${which} gable, behind the walls, and drawn after its pen`);
      });
    }
  });
}

test('a chimney stands where it will stand from the day the sills are down: the pen going up does not move it', () => {
  for (const plan of ['round-log', 'dog-run', 'saddlebag']) for (const rotation of [0, 90, 180, 270]) {
    const feet = [1, 5, 12, 13].map(penStage => {
      const ctx = recorder();
      drawPlacedHouse(ctx, camera(2600), { placement: { x: 0.1, y: -0.05, rotation }, pieces: at(plan, penStage) });
      return ctx.drawn.filter(each => /chimney/.test(each.name || '') || each.name === 'filled').map(each => [each.foot.x, each.foot.y]);
    });
    for (const each of feet.slice(1)) assert.deepEqual(each.flat().map(n => +n.toFixed(6)), feet[0].flat().map(n => +n.toFixed(6)), `${plan} at ${rotation}: the chimney moves as the pen goes up`);
  }
});
