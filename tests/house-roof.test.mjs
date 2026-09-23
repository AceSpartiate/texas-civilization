// The roof stays on its walls (student, 2026-09-23: "the roof doesn't seem to stay where it's supposed to be. It slides
// forward."). A log pen is drawn from the house-modules sheet a piece at a time - sills, low walls, full walls, then a
// roof - and every piece is cut from its own cell with nothing saying how the pieces register on one another. The roof
// was drawn at the walls' ground anchor, and a roof's ground anchor is the low front tip of its eaves, so it came down in
// front of its walls to the ground: a third of the house's width forward of where it belongs, on every pen, in the
// chooser, the preview and the house that stands, at every turn and zoom.
//
// These tests draw with the page's own `drawSprite` (public/art.js, its sheets stubbed so nothing is fetched), its own
// `drawHousePlot` and its own `drawPlacedHouse` (read out of public/app.js), against a context that follows the transform,
// and check where the pixels of each frame land on the screen against points read off the sheet by eye - not against the
// seat the atlas measured, which is what is being checked.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell, roofSeat } from '../public/house-plot.js';
import { plotCatalogue } from '../sim/houseplot.mjs';

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

const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
function declaration(start, end) {
  const from = page.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in public/app.js, so this test checks nothing`);
  return page.slice(from, page.indexOf(end, from) + end.length);
}
const SIZE = new Function(`${declaration('const SIZE = {', '\n};')} return SIZE;`)();
const { cabinSize, drawPlacedHouse } = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window',
  `${declaration('const cabinSize = ', ';\n')}\n${declaration('function drawPlacedHouse(', '\n}\n')}\nreturn { cabinSize, drawPlacedHouse };`,
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, {});

/** A canvas context that keeps the transform and records, for every picture drawn, where each of its pixels lands. */
function recorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], drawn = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const byCut = new Map(Object.entries(atlas.frames).map(([name, f]) => [`${f.sheet}:${f.x},${f.y},${f.w},${f.h}`, name]));
  const sheetOf = new Map(Object.entries(atlas.frames).map(([, f]) => [`${f.x},${f.y},${f.w},${f.h}`, f.sheet]));
  return {
    drawn, globalAlpha: 1,
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    transform(a, b, c, d, e, f) { m = times(m, [a, b, c, d, e, f]); },
    fillRect() {}, strokeRect() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`;
      const name = byCut.get(`${sheetOf.get(cut)}:${cut}`);
      // The screen point of the frame's own pixel (u, v), and how many screen pixels one frame pixel is drawn.
      const screen = (u, v) => { const x = dx + u * dw / sw, y = dy + v * dh / sh; return { x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] }; };
      drawn.push({ name, screen, perPixel: dw / sw });
    },
  };
}

// The middle of the wall tops and the middle of the eaves, read by eye off the sheet on a ten-pixel grid (frame pixels:
// scripts/build-atlas-manifest.mjs cuts them): the tops of the left and right corner posts, the two outer ends of the eaves.
const middle = ([ax, ay], [bx, by]) => [(ax + bx) / 2, (ay + by) / 2];
const BY_EYE = {
  'house-round-full-walls': middle([10, 75], [283, 45]),
  'house-hewn-full-walls': middle([12, 72], [282, 50]),
  'house-round-roof-partial': middle([15, 160], [348, 130]),
  'house-hewn-roof-finished': middle([10, 170], [351, 132]),
};
// ceiling: the atlas measures its seats off the silhouette (`seatOf`), each within about 3% of its frame's width of these,
// so a roof may land up to 6% of the walls' width off the middle read by eye. Drawn at the walls' ground anchor it was 33%.
const WITHIN = 0.06;

/** Every plan with log pens, at the stage its roof is on and chinking waits, and finished. */
const plans = ['round-log', 'hewn-log', 'dog-run', 'saddlebag'];
const atStage = (id, penStage) => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => {
  const kind = catalogue.pieces.find(piece => piece.id === type);
  return [type, x, y, kind.pen ? penStage : kind.stageCount, 0];
});
const cameraAt = scale => ({ scale, figure: Math.max(7, Math.min(150, scale * 0.019)), toScreen: p => ({ x: 720 + p.x * scale, y: 500 + p.y * scale }) });

/** Each roof drawn and the walls it went on, as the screen shows them. */
function roofsOn(ctx) {
  const pairs = [];
  ctx.drawn.forEach((each, index) => {
    if (!/roof-(partial|finished)$/.test(each.name || '')) return;
    const walls = ctx.drawn.slice(0, index).reverse().find(before => /full-walls$/.test(before.name || ''));
    pairs.push({ roof: each, walls });
  });
  return pairs;
}

for (const plan of plans) {
  for (const [penStage, roofName] of [[12, 'house-round-roof-partial'], [13, 'house-hewn-roof-finished']]) {
    test(`the ${plan} house's roof sits on its walls at stage ${penStage}, in the chooser, at its site and placed at every turn`, () => {
      const pieces = atStage(plan, penStage), pens = pieces.filter(([type]) => type.startsWith('pen-')).length;
      const draws = [];
      // The house at its site and the chooser's picture of it: public/app.js and renderHousePlot call this.
      for (const size of [65, 163.35]) { const ctx = recorder(); drawHousePlot(ctx, 720, 500, size, { house: { pieces } }, catalogue, drawSprite, spriteFrame); draws.push([`${size} high at its site`, ctx]); }
      // The house placed on the land, and its preview, at each quarter turn and three zooms.
      for (const rotation of [0, 90, 180, 270]) for (const scale of [400, 2600, 9000]) for (const alpha of [1, 0.5]) {
        const ctx = recorder(); drawPlacedHouse(ctx, cameraAt(scale), { placement: { x: 0.1, y: -0.05, rotation }, pieces }, alpha);
        draws.push([`placed at ${rotation} degrees, ${scale} pixels a mile${alpha < 1 ? ', as its preview' : ''}`, ctx]);
      }
      for (const [where, ctx] of draws) {
        const pairs = roofsOn(ctx);
        assert.equal(pairs.length, pens, `${where}: ${pairs.length} roofs drawn on ${pens} pens`);
        for (const { roof, walls } of pairs) {
          assert.equal(roof.name, roofName, `${where}: the wrong roof for the stage`);
          assert.ok(walls, `${where}: a roof drawn with no full walls under it`);
          // The roof is drawn at the walls' own scale: one pixel of the sheet is as big in both.
          assert.ok(Math.abs(roof.perPixel / walls.perPixel - 1) < 1e-9, `${where}: the roof is drawn ${roof.perPixel / walls.perPixel} times the walls' scale`);
          const eaves = roof.screen(...BY_EYE[roof.name]), tops = walls.screen(...BY_EYE[walls.name]);
          const off = Math.hypot(eaves.x - tops.x, eaves.y - tops.y), wide = spriteFrame(walls.name).w * walls.perPixel;
          assert.ok(off <= WITHIN * wide, `${where}: the middle of the ${roof.name} eaves is ${(off / wide * 100).toFixed(1)}% of the walls' width off the middle of the ${walls.name} tops (${(eaves.x - tops.x).toFixed(1)}, ${(eaves.y - tops.y).toFixed(1)} pixels)`);
        }
      }
    });
  }
}

test('a pen stands the same size at every stage of its raising, from the sills to the roof', () => {
  for (const pen of ['pen-round', 'pen-hewn']) {
    const material = pen === 'pen-hewn' ? 'hewn' : 'round', walls = spriteFrame(`house-${material}-full-walls`);
    for (let stage = 1; stage <= 13; stage++) {
      const ctx = recorder(), size = 163.35;
      drawHousePlot(ctx, 720, 500, size, { house: { pieces: [[pen, 3, 2, stage, 0]] } }, catalogue, drawSprite, spriteFrame);
      const piece = ctx.drawn.find(each => /-(sill|low-walls|full-walls)$/.test(each.name || ''));
      assert.ok(piece, `the ${pen} at stage ${stage} drew no piece of the modular pen`);
      // One pixel of the sheet is drawn as big at every stage: the full walls' scale, the full walls `cell * 2.2` high.
      const perPixel = plotCell(size) * 2.2 / walls.h;
      assert.ok(Math.abs(piece.perPixel / perPixel - 1) < 1e-9, `the ${pen}'s ${piece.name} at stage ${stage} is drawn ${piece.perPixel / perPixel} times the scale of its full walls`);
    }
  }
});

test('the seat is where the roof goes: its point on the roof put on its point on the walls, at the walls’ scale', () => {
  const walls = spriteFrame('house-round-full-walls'), roof = spriteFrame('house-hewn-roof-finished');
  const seat = roofSeat(walls, roof, 100, 200, 253);
  // Drawn 253 high, one frame pixel is one screen pixel, so the seat is the walls' seat measured from their ground anchor.
  assert.ok(Math.abs(seat.x - (100 + (walls.seatX - walls.anchorX) * walls.w)) < 1e-9 && Math.abs(seat.y - (200 + (walls.seatY - walls.anchorY) * walls.h)) < 1e-9);
  assert.equal(seat.height, roof.h); assert.deepEqual(seat.anchor, [roof.seatX, roof.seatY]);
  // A frame the atlas has not measured a seat on seats nothing, and a pen then draws its whole picture instead.
  assert.equal(roofSeat(walls, spriteFrame('house-passage-roof'), 0, 0, 100), null);
  const ctx = recorder();
  drawHousePlot(ctx, 720, 500, 100, { house: { pieces: [['pen-round', 3, 2, 13, 0]] } }, catalogue, drawSprite);
  assert.deepEqual(ctx.drawn.map(each => each.name), ['house-round-log'], 'without the frames a pen draws its whole picture, not a roof it cannot seat');
});
