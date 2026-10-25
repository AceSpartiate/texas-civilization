// Astra's puncheon floor (2026-10-11, docs/ART_DELIVERY_2026-10-11-HOUSE-CONSTRUCTION-COMPLETE.md), wired 2026-10-25 (batch W of
// docs/ART_PLAN_LOCAL_2026-10-25.md): a pen with a finished floor (sim/houseplot.mjs `floor`) has `house-puncheon-floor` drawn
// under its walls, stood by the middle of the pen's foot and as large as fits inside it (`floorFit`: both are the pen's sixteen
// feet square, hers drawn squarer), so it shows through the doorway and over the low courses. Before, Claude's `house-floor` stood in,
// and since her library had a floor
// it was held back by subject (public/art-subjects.js), so no floor was drawn at all. A pen with no floor draws none.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, floorFit } from '../public/house-plot.js';
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
await loadArt({ sheets: ['house-modules', 'house-back-views', 'houses-settling', 'house-construction-complete'] });
const catalogue = plotCatalogue();

/** A context that records every picture drawn, its frame name and where its own pixels land (no transform is used here). */
function recorder() {
  const byCut = new Map(Object.entries(atlas.frames).map(([name, f]) => [`${f.sheet}:${f.x},${f.y},${f.w},${f.h}`, name]));
  const sheetOf = new Map(Object.entries(atlas.frames).map(([, f]) => [`${f.x},${f.y},${f.w},${f.h}`, f.sheet]));
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [], drawn = [];
  const times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const apply = (at, x, y) => ({ x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] });
  return {
    drawn, globalAlpha: 1, fillStyle: '',
    save() { stack.push(m); }, restore() { m = stack.pop(); },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); },
    scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    rotate() {}, transform() {}, fillRect() {}, strokeRect() {}, beginPath() {}, rect() {}, clip() {}, fill() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {},
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const at = m, cut = `${sx},${sy},${sw},${sh}`, name = byCut.get(`${sheetOf.get(cut)}:${cut}`);
      drawn.push({ name, screen: (u, v) => apply(at, dx + u * dw / sw, dy + v * dh / sh) });
    },
  };
}

const cabin = withFloor => {
  const pieces = catalogue.plans.find(plan => plan.id === 'round-log').pieces.map(([type, x, y]) => {
    const kind = catalogue.pieces.find(piece => piece.id === type);
    return [type, x, y, kind.pen ? 6 : kind.stageCount, 0];
  });
  const pen = pieces.find(([type]) => type.startsWith('pen-'));
  if (withFloor) pieces.push(['floor', pen[1], pen[2], catalogue.pieces.find(piece => piece.id === 'floor').stageCount, 0]);
  return { house: { pieces } };
};

test('floorFit stands the floor by the middle of the pen\'s foot, as large as fits inside it, and needs both measures', () => {
  const walls = spriteFrame('house-round-full-walls'), floor = spriteFrame('house-puncheon-floor');
  assert.ok(walls.ground && floor.ground, 'scripts/build-atlas-manifest.mjs measures the walls\' and the floor\'s ground');
  const fit = floorFit(walls, floor), scale = fit.height / (floor.logicalHeight || floor.h) * (walls.logicalHeight || walls.h);
  const mid = frame => [0, 1].map(i => (frame.ground.left[i] + frame.ground.right[i]) / 2);
  const span = frame => (frame.ground.right[0] - frame.ground.left[0]) * frame.w, deep = frame => (frame.ground.front[1] - mid(frame)[1]) * frame.h;
  // As wide as the pen or as deep, whichever binds first, and never past it either way.
  assert.ok(span(floor) * scale <= span(walls) + 0.5 && deep(floor) * scale <= deep(walls) + 0.5, 'the floor stands out past the walls');
  assert.ok(Math.abs(span(floor) * scale - span(walls)) < 0.5 || Math.abs(deep(floor) * scale - deep(walls)) < 0.5, 'the floor is smaller than the pen needs it to be');
  assert.deepEqual(fit.anchor, mid(floor));
  assert.equal(floorFit(walls, { ...floor, ground: undefined }), null);
});

test('a pen with a finished puncheon floor has Astra\'s floor under its walls, inside them; a pen without has none', () => {
  for (const size of [65, 163.35]) {
    const ctx = recorder();
    drawHousePlot(ctx, 720, 500, size, cabin(true), catalogue, drawSprite, spriteFrame);
    const floorAt = ctx.drawn.findIndex(each => each.name === 'house-puncheon-floor');
    const wallsAt = ctx.drawn.findIndex(each => each.name === 'house-round-full-walls');
    assert.ok(floorAt >= 0, `${size}: no puncheon floor drawn (${ctx.drawn.map(each => each.name).join(', ')})`);
    assert.ok(wallsAt > floorAt, `${size}: the floor is drawn after the walls (${floorAt}, ${wallsAt})`);
    const [floor, walls] = [ctx.drawn[floorAt], ctx.drawn[wallsAt]], [ff, wf] = [atlas.frames[floor.name], atlas.frames[walls.name]];
    // The middles of the two feet on one another, and every corner of the floor inside the walls' foot.
    const corner = (each, frame, which) => each.screen(frame.ground[which][0] * frame.w, frame.ground[which][1] * frame.h);
    const middle = (each, frame) => { const [l, r] = [corner(each, frame, 'left'), corner(each, frame, 'right')]; return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 }; };
    const [fm, wm] = [middle(floor, ff), middle(walls, wf)];
    assert.ok(Math.hypot(fm.x - wm.x, fm.y - wm.y) < size * 0.02, `${size}: the floor stands ${Math.hypot(fm.x - wm.x, fm.y - wm.y).toFixed(1)} px off the middle of the pen`);
    const [wl, wr, wfr] = ['left', 'right', 'front'].map(which => corner(walls, wf, which));
    const [fl, fr, ffr] = ['left', 'right', 'front'].map(which => corner(floor, ff, which));
    const slack = size * 0.02;
    assert.ok(fl.x >= wl.x - slack && fr.x <= wr.x + slack && ffr.y <= wfr.y + slack, `${size}: a corner of the floor stands out past the walls (${[fl.x, fr.x, ffr.y].map(n => n.toFixed(1))} against ${[wl.x, wr.x, wfr.y].map(n => n.toFixed(1))})`);
    const bare = recorder();
    drawHousePlot(bare, 720, 500, size, cabin(false), catalogue, drawSprite, spriteFrame);
    assert.ok(!bare.drawn.some(each => /floor/.test(each.name || '')), `${size}: a floor drawn in a pen without one`);
  }
});
