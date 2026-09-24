// Turning a house turns the house, not its pictures (2026-09-23). `drawPlacedHouse` in public/app.js turned the canvas by
// the house's quarter turn and drew the whole house inside it, so a house placed at 90 degrees lay on its side and one at
// 180 stood on its roof, chimney pointing at the ground. The house-modules pieces are drawn in the one fixed upright
// three-quarter view every tree, person and ox on the map is drawn in; a turn has to change what is on the ground - the
// footprint, which way the long side runs, which piece stands in front of which - and leave every picture upright.
//
// These tests draw with the page's own `drawSprite` (public/art.js, its sheets stubbed so nothing is fetched), its own
// `drawHousePlot` and its own `drawPlacedHouse` (read out of public/app.js), against a context that follows the transform,
// and look at the transform each picture is drawn under and where on the screen each one's foot lands.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
import { CABIN_PEOPLE, PICTURE_REACH, turned } from '../sim/house-footprint.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { pageCamera } from './support/page-camera.mjs';

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
// SIZE.cabin is the server's number for how tall a house is drawn (sim/house-footprint.mjs), which the page imports.
const SIZE = new Function('CABIN_PEOPLE', `${declaration('const SIZE = {', '\n};')} return SIZE;`)(CABIN_PEOPLE);
const { cabinSize, drawPlacedHouse } = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window',
  `${declaration('const cabinSize = ', ';\n')}\n${declaration('function drawPlacedHouse(', '\n}\n')}\nreturn { cabinSize, drawPlacedHouse };`,
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, {});

/** A canvas context that keeps the transform and records every picture drawn: its frame, the transform, its foot. */
function recorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], drawn = [], outlines = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const byCut = new Map(Object.entries(atlas.frames).map(([name, f]) => [`${f.sheet}:${f.x},${f.y},${f.w},${f.h}`, name]));
  const sheetOf = new Map(Object.entries(atlas.frames).map(([, f]) => [`${f.x},${f.y},${f.w},${f.h}`, f.sheet]));
  return {
    drawn, outlines, globalAlpha: 1,
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    transform(a, b, c, d, e, f) { m = times(m, [a, b, c, d, e, f]); },
    fillRect(x, y, w, h) { outlines.push({ transform: m, x, y, w, h }); }, strokeRect() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`;
      const name = byCut.get(`${sheetOf.get(cut)}:${cut}`), frame = atlas.frames[name];
      const screen = (u, v) => { const x = dx + u * dw / sw, y = dy + v * dh / sh; return { x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] }; };
      drawn.push({ name, transform: at, foot: screen(frame.anchorX * frame.w, frame.anchorY * frame.h) });
    },
  };
}

const finished = id => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type).stageCount, 0]);
const camera = pageCamera(2600, p => ({ x: 720 + p.x * 2600, y: 500 + p.y * 2600 }));
const placement = rotation => ({ x: 0.1, y: -0.05, rotation });
/**
 * Whether each picture drawn should be mirrored, from the plan alone. At a quarter turn every picture is: the corner-on pen
 * seen after a quarter turn is its picture mirrored. At 0 and 180 degrees a log pen is mirrored when its chimney's gable
 * is to the left on the screen - west of the pen at 0, east of it at 180 - so that the picture's back gable, which has no
 * door, is that side (2026-09-24, "fix the chimney standing in front of the door"; tests/house-chimney.test.mjs), and
 * nothing else is. A pen's pictures are its walls, standing where the pen does (`originX` and its turned middle), and the
 * roof drawn on them. Until 2026-09-24 no picture at 0 or 180 was mirrored. A house of two pens is drawn in the house's
 * mirroring, both pens the same way round so that their ridges run on one line (2026-09-24, "they don't seem to be
 * connected single buildings"; tests/house-connected.test.mjs).
 */
function mirroredAt(ctx, plan, rotation, originX, cell) {
  const pieces = catalogue.plans.find(each => each.id === plan).pieces, chimneys = pieces.filter(([type]) => /^chimney/.test(type));
  if (twoPen(plan)) return ctx.drawn.map(() => rotation % 180 !== 0);
  const pens = pieces.filter(([type]) => type.startsWith('pen-')).map(([type, x, y]) => {
    const gables = chimneys.filter(([, cx, cy]) => cy >= y && cy < y + 2 && (cx === x + 2 || cx === x - 1)).map(([, cx]) => cx === x + 2);
    const left = gables.length > 0 && gables.every(east => turned(east ? 1 : -1, 0, rotation)[0] < 0);
    return { x: originX + turned(x + 1 - catalogue.columns / 2, y + 1 - catalogue.rows / 2, rotation)[0] * cell, mirrored: rotation % 180 !== 0 || (type !== 'pen-jacal' && left) };
  });
  let pen = null;
  return ctx.drawn.map(({ name, foot }) => {
    if (/-(sill|low-walls|full-walls)$/.test(name)) pen = pens.reduce((a, b) => Math.abs(b.x - foot.x) < Math.abs(a.x - foot.x) ? b : a);
    else if (!/roof-(partial|finished)$/.test(name)) pen = null;
    return pen ? pen.mirrored : rotation % 180 !== 0;
  });
}
const twoPen = plan => catalogue.plans.find(each => each.id === plan).pieces.filter(([type]) => type.startsWith('pen-')).length > 1;
/** The pictures standing on the ground: every one but a roof, which is seated on its walls (tests/house-roof.test.mjs). */
const standing = ctx => ctx.drawn.filter(each => !/roof/.test(each.name));

for (const plan of ['round-log', 'hewn-log', 'dog-run', 'saddlebag', 'jacal']) {
  for (const rotation of [0, 90, 180, 270]) {
    test(`the ${plan} house turned ${rotation} degrees stands upright, every piece on its turned footprint, back to front`, () => {
      for (const alpha of [1, 0.5]) {
        const ctx = recorder(), where = `${plan} at ${rotation}${alpha < 1 ? ' (its preview)' : ''}`;
        drawPlacedHouse(ctx, camera, { placement: placement(rotation), pieces: finished(plan) }, alpha);
        assert.ok(ctx.drawn.length >= 1, `${where}: nothing was drawn`);
        const mirrored = mirroredAt(ctx, plan, rotation, camera.toScreen(placement(rotation)).x, plotCell(cabinSize(camera)));
        for (const [i, { name, transform: [a, b, c, d] }] of ctx.drawn.entries()) {
          // No turn and no shear: the picture's up is the screen's up, and it is not stood on its head.
          assert.ok(Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9, `${where}: ${name} is drawn turned (${[a, b, c, d].map(n => n.toFixed(3))})`);
          assert.ok(d > 0, `${where}: ${name} is drawn upside down`);
          // Mirrored at a quarter turn - the gable brought round to the other face - and as drawn at a half turn, but for a
          // pen whose chimney is on its left (`mirroredAt`).
          assert.equal(a < 0, mirrored[i], `${where}: ${name} is ${a < 0 ? '' : 'not '}mirrored`);
        }
        // Each piece stands in the footprint the preview outlines, turned on the ground round the point it was placed at. A
        // house of two pens stands along its roof's ridge, which the sheet draws on a diagonal (tests/house-connected.test.mjs),
        // so its near pen stands in front of that outline at 0 and 180 degrees, and its end chimneys beside it at 90 and 270:
        // on the ground it claims round it (`PICTURE_REACH`), which the server holds other houses off.
        const at = camera.toScreen(placement(rotation)), cell = plotCell(cabinSize(camera)), foot = houseFootprint({ pieces: finished(plan) }, catalogue, rotation);
        const reach = twoPen(plan) ? PICTURE_REACH : { up: 0, side: 0, down: 0 };
        const box = { left: at.x + (foot.x - reach.side) * cell, top: at.y + (foot.y - reach.up) * cell, right: at.x + (foot.x + foot.w + reach.side) * cell, bottom: at.y + (foot.y + foot.h + reach.down) * cell };
        for (const { name, foot: { x, y } } of standing(ctx)) {
          assert.ok(x >= box.left - 1e-6 && x <= box.right + 1e-6 && y >= box.top - 1e-6 && y <= box.bottom + 1e-6, `${where}: ${name} stands at ${x.toFixed(1)}, ${y.toFixed(1)}, off its footprint ${JSON.stringify(box)}`);
        }
        // Drawn back to front: each thing on the ground stands no further back than the one drawn before it. Not a chimney,
        // which stands against its pen's gable wall and is drawn before the pen or after it by which side of the pen that
        // wall is on, not by where its foot is (tests/house-chimney.test.mjs holds it there).
        const grounded = standing(ctx).filter(each => !/chimney/.test(each.name)), feet = grounded.map(each => each.foot.y);
        feet.forEach((y, i) => assert.ok(i === 0 || y >= feet[i - 1] - 1e-6, `${where}: ${grounded[i].name} drawn after a piece in front of it`));
        if (alpha < 1) assert.ok(ctx.outlines.every(({ transform: [, b, c] }) => b === 0 && c === 0), `${where}: the outline is drawn turned`);
      }
    });
  }
}

test('a dog-run runs along its ridge, the east pen right of the west at 0, left at 180, in front at 90, behind at 270, its chimneys at its two ends', () => {
  const pens = rotation => { const ctx = recorder(); drawPlacedHouse(ctx, camera, { placement: placement(rotation), pieces: finished('dog-run') }); return ctx; };
  // The feet of the full walls' corner posts, read by eye off the sheet on a ten-pixel grid (tests/house-chimney.test.mjs):
  // a pen's depth along its ridge runs from the front corner to the right one.
  const front = [180, 247], right = [290, 168];
  const cell = plotCell(cabinSize(camera)), frame = spriteFrame('house-round-full-walls'), depth = Math.hypot(right[0] - front[0], right[1] - front[1]) * cell * 2.2 / frame.h;
  for (const rotation of [0, 90, 180, 270]) {
    const ctx = pens(rotation), walls = ctx.drawn.filter(each => /full-walls$/.test(each.name)), chimneys = ctx.drawn.filter(each => /chimney/.test(each.name));
    assert.equal(walls.length, 2, `${rotation}: two pens`); assert.equal(chimneys.length, 2, `${rotation}: two chimneys`);
    // The pens stand a pen and the passage apart along the ridge - sixteen feet and twelve (`HIST-GONZ-025`; the passage
    // was eight until 2026-09-24), a pen's depth and three quarters - the far one up the screen, to the right where the
    // house is not mirrored (0 and 180) and to the left where it is.
    const [far, near] = [...walls].sort((p, q) => p.foot.y - q.foot.y).map(each => each.foot), [dx, dy] = [far.x - near.x, far.y - near.y];
    assert.ok(Math.abs(Math.hypot(dx, dy) / ((16 + 12) / 16 * depth) - 1) < 0.1, `${rotation}: the pens stand ${(Math.hypot(dx, dy) / depth).toFixed(2)} pen depths apart`);
    assert.ok(dy < 0 && (rotation % 180 ? dx < 0 : dx > 0), `${rotation}: the far pen stands ${dx.toFixed(1)}, ${dy.toFixed(1)} from the near one`);
    // The plan's east pen is the one at the house's turned east end: right of the west pen at 0, in front of it at 90,
    // left of it at 180, behind it at 270.
    const [tx, ty] = turned(1, 0, rotation), [west, east] = walls.map(each => each.foot).sort((p, q) => (p.x * tx + p.y * ty) - (q.x * tx + q.y * ty));
    assert.ok({ 0: east.x > west.x, 90: east.y > west.y, 180: east.x < west.x, 270: east.y < west.y }[rotation], `${rotation}: the east pen is not at the turned east end`);
    // The chimneys stand at the two ends of that line, beyond each pen's foot, the far one drawn first and the near one last.
    const line = p => ((p.x - near.x) * dx + (p.y - near.y) * dy) / (dx * dx + dy * dy), ends = chimneys.map(each => line(each.foot)).sort((p, q) => p - q);
    assert.ok(ends[0] < 0 && ends[1] > 1, `${rotation}: the chimneys stand at ${ends.map(n => n.toFixed(2))} along the line from the near pen to the far one`);
    assert.deepEqual([ctx.drawn[0].name, ctx.drawn.at(-1).name].map(name => /chimney/.test(name)), [true, true], `${rotation}: the far chimney is not drawn first and the near one last`);
  }
  // A half turn puts the house's ends the other way round: the round-log cabin's chimney, right of its pen at 0, is left of it.
  const side = rotation => { const ctx = recorder(); drawPlacedHouse(ctx, camera, { placement: placement(rotation), pieces: finished('round-log') }); const pen = ctx.drawn.find(each => /full-walls$/.test(each.name)).foot, chimney = ctx.drawn.find(each => /chimney/.test(each.name)).foot; return { dx: chimney.x - pen.x, dy: chimney.y - pen.y }; };
  assert.ok(side(0).dx > 0 && side(180).dx < 0, 'the chimney does not change ends at a half turn');
  // At 90 the east end has come round to the front, the chimney against the gable toward the viewer, its foot about level
  // with the pen's; at 270 behind it, against the gable behind the walls.
  assert.ok(side(90).dy > -0.1 * cell && side(270).dy < -cell / 2, 'a quarter turn does not bring the chimney end to the front or the back');
});

test('the house at its site, placed nowhere, is drawn as it always was: upright and unmirrored', () => {
  for (const plan of ['round-log', 'dog-run']) {
    const ctx = recorder();
    drawHousePlot(ctx, 720, 500, 163.35, { house: { pieces: finished(plan) } }, catalogue, drawSprite, spriteFrame);
    const mirrored = mirroredAt(ctx, plan, 0, 720, plotCell(163.35));
    assert.ok(ctx.drawn.length > 1 && ctx.drawn.every(({ transform: [a, b, c, d] }, i) => (a < 0) === mirrored[i] && d > 0 && b === 0 && c === 0), `${plan} at its site`);
    // Until 2026-09-24 the dog-run's west pen, whose chimney is west of it, was mirrored for it; now both pens are drawn one
    // way, so that their ridges run on one line (tests/house-connected.test.mjs), and nothing is.
    assert.deepEqual(ctx.drawn.filter((each, i) => mirrored[i]).map(each => each.name), [], `${plan} at its site`);
  }
});
