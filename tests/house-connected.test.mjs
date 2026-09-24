// A house of two pens is one building (owner, 2026-09-24: "the angle of the houses makes it so they don't seem to be
// connected single buildings. fix this."). The house-modules sheet draws a pen corner-on, its ridge running back up the
// screen on a diagonal. The page stood a dog-run's or a saddlebag's pens where their cells are, side by side along the
// house's long side, so their two ridges ran side by side - and, each pen mirrored for its own chimney, on two diagonals, a
// V - with grass between them and the passage a small roof on posts of its own: two cabins, not one house. An 1830s dog-run
// was "two pens under one roof" with the open passage between (`HIST-GONZ-025`), Austin's house a "passage" with a "chimney
// at each end" (`HIST-GONZ-035`); a saddlebag two pens against one "big double chimney" (`HIST-TEX-017`).
//
// These tests draw with the page's own `drawSprite` (public/art.js, its sheets stubbed so nothing is fetched), its own
// `drawHousePlot` and its own `drawPlacedHouse` (read out of public/app.js), against a context that follows the transform,
// and hold each two-pen plan, at every turn, in the chooser, at its site, placed and previewed, to four things: every pen
// drawn the same way round with its ridge on one line along the house (a); the pens the plan's one cell apart and the
// pieces between touching both (b); the passage's roof on that line, running into both pens' roofs (c); and the house drawn
// back to front, far pen, what stands between, near pen (d). The ridges and the walls' ground are read by eye off the sheet
// below, not taken from the atlas or the code.
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

/** A canvas context that keeps the transform and records, in order, every picture drawn: its frame, where, which way. */
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
    strokeRect() {}, fillRect() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`;
      const name = byCut.get(`${sheetOf.get(cut)}:${cut}`), frame = atlas.frames[name];
      const screen = (u, v) => apply(at, dx + u * dw / sw, dy + v * dh / sh);
      const [a, b] = [screen(0, 0), screen(sw, sh)];
      drawn.push({ name, screen, mirrored: at[0] < 0, perPixel: Math.abs(at[0]) * dw / sw, foot: screen(frame.anchorX * frame.w, frame.anchorY * frame.h), box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) } });
    },
  };
}

// The ridge of each roof picture: the middles of the two end faces of its ridge log, front (the gable to the lower left)
// and back, read by eye off the sheet on a five-pixel grid (frame pixels, as scripts/build-atlas-manifest.mjs cuts them).
// The sheet's own passage roof, on four posts, is here so that a passage drawn with it is held to the same line.
const RIDGE = {
  'house-hewn-roof-finished': [[105, 102], [208, 11]],
  'house-round-roof-partial': [[107, 98], [207, 12]],
  'house-passage-roof': [[92, 53], [170, 7]],
};
// The feet of the three corner posts of the full walls the viewer sees, read by eye off the sheet on a ten-pixel grid
// (tests/house-chimney.test.mjs reads the same); the fourth, behind the walls, closes the figure. The door's gable is the
// face from the left corner to the front one, the other gable from the right corner to the back one; the pen's depth
// along its ridge runs from the front corner to the right one.
const GROUND = {
  'house-round-full-walls': { left: [12, 198], front: [180, 247], right: [290, 168] },
  'house-hewn-full-walls': { left: [12, 202], front: [175, 252], right: [288, 172] },
};
// Which end of the house is the far one, up its ridge, at each turn: a house of two pens is drawn in the house's own
// quarter-turn mirroring, not mirrored at 0 and 180 degrees (its ridge running up to the right) and mirrored at 90 and 270
// (up to the left). The turn is clockwise on the screen, east to south (`turned`): east is to the right at 0, so the
// ridge's far end is east; toward the viewer at 90, so the far end is west; to the left at 180, west; away at 270, east.
const FAR = { 0: 'east', 90: 'west', 180: 'west', 270: 'east' };
// A ridge on the line of another: both its ends within this many frame pixels of it - a quarter of the ridge log's
// thickness (about twenty). Drawn where their cells are the two ridges of a dog-run were a cell and a half apart.
const ON_LINE = 5;
// The pens' facing gable walls stand the plan's one cell apart - half a pen's depth (eight feet of sixteen) - to within this
// share of it. Drawn where their cells are, they were three and a half times that apart on the screen.
const APART = 0.2;

const TWO_PEN = catalogue.plans.filter(plan => plan.pieces.filter(([type]) => type.startsWith('pen-')).length > 1).map(plan => plan.id);
const camera = scale => pageCamera(scale, p => ({ x: 720 + p.x * scale, y: 500 + p.y * scale }));
/** The plan at a pen stage: what stands between two pens (a passage, a double chimney) begun only once their walls are up. */
const at = (plan, penStage) => catalogue.plans.find(each => each.id === plan).pieces.map(([type, x, y]) => {
  const kind = catalogue.pieces.find(piece => piece.id === type);
  return [type, x, y, kind.pen ? penStage : kind.place === 'between' && penStage <= 11 ? 0 : kind.stageCount, 0];
});
/** Every way the house is drawn: in the chooser and at its site (unturned), placed and previewed at each turn and zoom. */
function draws(plan, penStage) {
  const out = [];
  for (const size of [65, 163.35]) { const ctx = recorder(); drawHousePlot(ctx, 720, 500, size, { house: { pieces: at(plan, penStage) } }, catalogue, drawSprite, spriteFrame); out.push({ where: `${size} high at its site`, rotation: 0, ctx }); }
  for (const rotation of [0, 90, 180, 270]) for (const scale of [400, 2600, 9000]) for (const alpha of [1, 0.5]) {
    const ctx = recorder(); drawPlacedHouse(ctx, camera(scale), { placement: { x: 0.1, y: -0.05, rotation }, pieces: at(plan, penStage) }, alpha);
    out.push({ where: `placed at ${rotation} degrees, ${scale} pixels a mile${alpha < 1 ? ', as its preview' : ''}`, rotation, ctx });
  }
  return out;
}

/**
 * The house as drawn: its two pens, east and west by the plan's turned east, each with its pictures - walls (or sills),
 * the roof drawn on them - and the pictures drawn between them that are neither a pen's nor an end chimney.
 */
function house(plan, rotation, ctx) {
  const [ex, ey] = turned(1, 0, rotation), along = p => p.x * ex + p.y * ey;
  const all = ctx.drawn.map((each, index) => ({ ...each, index }));
  const walls = all.filter(each => /-(sill|low-walls|full-walls)$/.test(each.name));
  assert.equal(walls.length, 2, `${plan}: ${walls.length} pens drawn`);
  const [west, east] = [...walls].sort((a, b) => along(a.foot) - along(b.foot)).map(each => {
    const roof = all[each.index + 1] && /roof-(partial|finished)$/.test(all[each.index + 1].name) ? all[each.index + 1] : null;
    return { walls: each, roof, pictures: roof ? [each, roof] : [each] };
  });
  const [far, near] = FAR[rotation] === 'east' ? [east, west] : [west, east];
  const own = new Set([...far.pictures, ...near.pictures].map(each => each.index));
  const between = all.filter(each => !own.has(each.index) && (/passage/.test(each.name) || /roof/.test(each.name) || (/chimney/.test(each.name) && each.index > far.walls.index && each.index < near.walls.index)));
  return { far, near, between, all };
}
/** A roof's ridge on the screen: its two ends, through the transform the roof was drawn with. */
const ridgeOf = roof => RIDGE[roof.name].map(([u, v]) => roof.screen(u, v));
/** How far a point stands off the line through two others, in screen pixels. */
const offLine = (p, [a, b]) => Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / Math.hypot(b.x - a.x, b.y - a.y);
/** Where a point lies along the line through two others, as a share of their distance from the first. */
const alongLine = (p, [a, b]) => ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
const touch = (a, b) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
/** A gable wall's middle on the ground, and the pen's depth along its ridge, on the screen, from the corners read by eye. */
function groundOf(walls) {
  const { left: l, front: f, right: r } = GROUND[walls.name], b = [l[0] + r[0] - f[0], l[1] + r[1] - f[1]];
  const mid = (p, q) => walls.screen((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), [F, R] = [walls.screen(...f), walls.screen(...r)];
  return { door: mid(l, f), back: mid(r, b), depth: Math.hypot(R.x - F.x, R.y - F.y) };
}

for (const plan of TWO_PEN) {
  test(`the ${plan}'s two pens are drawn the same way round, their ridges on one line along the house, at every turn`, () => {
    for (const penStage of [12, 13]) for (const { where, rotation, ctx } of draws(plan, penStage)) {
      const what = `${plan} at stage ${penStage}, ${where}`, { far, near } = house(plan, rotation, ctx);
      // The same way round: every picture of both pens in the house's quarter-turn mirroring. Mirrored each for its own
      // chimney, a dog-run's two pens at 0 and 180 degrees were mirror images, their ridges a V.
      for (const pen of [far, near]) for (const picture of pen.pictures) assert.equal(picture.mirrored, rotation % 180 !== 0, `${what}: the ${pen === far ? 'far' : 'near'} pen's ${picture.name} is ${picture.mirrored ? '' : 'not '}mirrored`);
      assert.ok(far.roof && near.roof, `${what}: a pen drawn without its roof`);
      // One line: both ends of the far pen's ridge on the line of the near pen's.
      const line = ridgeOf(near.roof);
      for (const end of ridgeOf(far.roof)) assert.ok(offLine(end, line) <= ON_LINE * far.roof.perPixel, `${what}: the far pen's ridge stands ${(offLine(end, line) / far.roof.perPixel).toFixed(1)} frame pixels off the near pen's`);
      // Along the house: the far pen's ridge is the near one's carried on up it, beyond its back end, so the plan's east and
      // west are the ends of one ridge and not two ridges side by side.
      const [a, b] = ridgeOf(far.roof).map(end => alongLine(end, line));
      assert.ok(Math.min(a, b) > 1, `${what}: the far pen's ridge does not run on beyond the near one's (${a.toFixed(2)}, ${b.toFixed(2)} of its length along it)`);
    }
  });

  test(`the ${plan}'s pens stand the plan's one cell apart along their ridge, and what stands between touches both, at every stage and turn`, () => {
    for (const penStage of [1, 5, 12, 13]) for (const { where, rotation, ctx } of draws(plan, penStage)) {
      const what = `${plan} at stage ${penStage}, ${where}`, { far, near, between } = house(plan, rotation, ctx);
      // The near pen's back gable faces the far pen's door gable across the passage or the chimney: a cell of the plan, half
      // a pen's depth, apart on the ground.
      if (/full-walls$/.test(far.walls.name) && /full-walls$/.test(near.walls.name)) {
        const [f, n] = [groundOf(far.walls), groundOf(near.walls)], gap = Math.hypot(f.door.x - n.back.x, f.door.y - n.back.y);
        assert.ok(Math.abs(gap / (n.depth / 2) - 1) <= APART, `${what}: the pens' facing gables stand ${(gap / (n.depth / 2)).toFixed(2)} of a cell apart`);
      }
      // No grass between: the pens' pictures touch, and so does what stands between them - the passage, the chimney - both.
      const box = pictures => pictures.reduce((a, b) => ({ left: Math.min(a.left, b.box.left), top: Math.min(a.top, b.box.top), right: Math.max(a.right, b.box.right), bottom: Math.max(a.bottom, b.box.bottom) }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
      assert.ok(touch(box(far.pictures), box(near.pictures)), `${what}: grass between the two pens`);
      for (const piece of between) for (const pen of [far, near]) assert.ok(touch(piece.box, box(pen.pictures)), `${what}: the ${piece.name} between the pens does not touch the ${pen === far ? 'far' : 'near'} one`);
      if (penStage > 11) assert.ok(between.length > 0, `${what}: nothing drawn between the pens once their walls are up`);
    }
  });

  test(`the ${plan} is drawn back to front: the far pen, what stands between, the near pen, at every stage and turn`, () => {
    for (const penStage of [1, 5, 12, 13]) for (const { where, rotation, ctx } of draws(plan, penStage)) {
      const what = `${plan} at stage ${penStage}, ${where}`, { far, near, between } = house(plan, rotation, ctx);
      // The far pen stands up the screen from the near one, and every picture of it is drawn before anything between them,
      // and that before the near pen, which is drawn over both.
      assert.ok(far.walls.foot.y < near.walls.foot.y, `${what}: the ${FAR[rotation]} pen, the far end at ${rotation} degrees, does not stand behind the other`);
      const last = Math.max(...far.pictures.map(each => each.index));
      for (const piece of between) assert.ok(piece.index > last && piece.index < near.walls.index, `${what}: the ${piece.name} is drawn at ${piece.index}, not between the far pen (to ${last}) and the near one (${near.walls.index})`);
      assert.ok(last < near.walls.index, `${what}: the far pen is drawn after the near one`);
    }
  });
}

test('the dog-run\'s passage is roofed on the pens\' ridge line, its roof running into both pens\' roofs, at every turn', () => {
  for (const penStage of [12, 13]) for (const { where, rotation, ctx } of draws('dog-run', penStage)) {
    const what = `dog-run at stage ${penStage}, ${where}`, { far, near, between } = house('dog-run', rotation, ctx);
    const roofs = between.filter(each => RIDGE[each.name]);
    assert.equal(roofs.length, 1, `${what}: ${roofs.length} roofs over the passage`);
    const [roof] = roofs, line = ridgeOf(near.roof);
    // On the one line, drawn the same way round as the pens.
    assert.equal(roof.mirrored, rotation % 180 !== 0, `${what}: the passage roof is ${roof.mirrored ? '' : 'not '}mirrored`);
    for (const end of ridgeOf(roof)) assert.ok(offLine(end, line) <= ON_LINE * roof.perPixel, `${what}: the passage roof's ridge stands ${(offLine(end, line) / roof.perPixel).toFixed(1)} frame pixels off the pens' line`);
    // And running into both: along that line its ridge overlaps the near pen's ridge (0 to 1) and the far pen's.
    const span = ends => ends.map(end => alongLine(end, line)).sort((a, b) => a - b);
    const [passage, nearRidge, farRidge] = [span(ridgeOf(roof)), span(ridgeOf(near.roof)), span(ridgeOf(far.roof))];
    assert.ok(passage[0] < nearRidge[1] && passage[1] > farRidge[0], `${what}: the passage roof's ridge runs ${passage.map(n => n.toFixed(2))} along the line, the near pen's ${nearRidge.map(n => n.toFixed(2))} and the far pen's ${farRidge.map(n => n.toFixed(2))}`);
  }
});
