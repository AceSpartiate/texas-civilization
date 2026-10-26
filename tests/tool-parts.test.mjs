// The tools the work cycles hold, painted with the local pipeline (2026-10-26; public/work-art.js `TOOL_PARTS`): each tool's butt and
// head are where its sheet's pixels put them, a tool in the hoeing cycle's hands is the painting where its sheet has come (laid from
// behind the hands to the hoe's head, mirrored with a figure facing west) and the stroked axe or maul while it loads, and the dig,
// the well, the grubbing, the beating of the wash and the sweeping each hold their tool.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HAFTS, HAFT_TOOLS, STROKES, TOOL_PARTS, WORK, drawHaftTool, paintToolPart } from '../public/work-art.js';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));

test("each painted tool's butt and head are on its pixels, with nothing beyond them along the tool", () => {
  for (const [tool, part] of Object.entries(TOOL_PARTS)) {
    const frame = atlas.frames[part.sprite];
    assert.ok(frame, `${part.sprite} is not in the library`);
    const sheet = decodeRgba(readFileSync(new URL(`../public/assets/frontier-v1/${atlas.sheets[frame.sheet].image}`, import.meta.url)));
    const alpha = (fx, fy) => {
      const x = frame.x + Math.round(fx * (frame.w - 1)), y = frame.y + Math.round(fy * (frame.h - 1));
      return x < frame.x || y < frame.y || x >= frame.x + frame.w || y >= frame.y + frame.h ? 0 : sheet.data[(y * sheet.width + x) * 4 + 3];
    };
    const near = ([fx, fy]) => Math.max(...[-3, -1, 0, 1, 3].flatMap(dx => [-3, -1, 0, 1, 3].map(dy => alpha(fx + dx / frame.w, fy + dy / frame.h))));
    assert.ok(near(part.butt) > 128, `${tool}: no tool at its butt`);
    assert.ok(near(part.head) > 128, `${tool}: no tool at its head`);
    // Out past each end along the tool's own line, clear: they are its ends.
    const [bx, by] = part.butt, [hx, hy] = part.head, ux = (hx - bx) * 0.04, uy = (hy - by) * 0.04;
    assert.ok(alpha(bx - ux, by - uy) < 24, `${tool}: the tool goes on past its butt`);
    assert.ok(alpha(hx + ux, hy + uy) < 24, `${tool}: the tool goes on past its head`);
  }
});

function recorder() {
  const calls = [];
  let m = [1, 0, 0, 1, 0, 0];
  const ctx = {
    calls, lineCap: '', lineJoin: '', strokeStyle: '', fillStyle: '', lineWidth: 1,
    save() { calls.push(['save']); }, restore() { calls.push(['restore']); },
    translate(x, y) { calls.push(['translate', x, y]); }, rotate(a) { calls.push(['rotate', a]); }, scale(x, y) { calls.push(['scale', x, y]); },
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() { calls.push(['fill']); }, stroke() { calls.push(['stroke']); },
  };
  void m;
  return ctx;
}

test('a tool in the hoeing hands is the painting once its sheet has come, the strokes before, mirrored for a figure facing west', () => {
  const drawn = [];
  const art = { spriteFrame: name => atlas.frames[name] || null, drawSprite: (ctx, name, x, y, h, o) => { drawn.push({ name, h, anchor: o.anchor }); return 10; } };
  for (const tool of HAFT_TOOLS) {
    drawn.length = 0;
    const ctx = recorder();
    assert.equal(drawHaftTool(ctx, tool, 'rust', 1, 100, 200, 60, 1, art), 2, `${tool}: the painting was not drawn (a haft and a head, as the strokes count)`);
    assert.deepEqual(drawn.map(one => one.name), [TOOL_PARTS[tool].sprite]);
    assert.deepEqual(drawn[0].anchor, TOOL_PARTS[tool].butt, `${tool} is not laid from its butt`);
    assert.ok(!ctx.calls.some(([what]) => what === 'scale'), `${tool} is mirrored facing east`);
    const west = recorder();
    drawHaftTool(west, tool, 'rust', 1, 100, 200, 60, -1, art);
    assert.ok(west.calls.some(([what, x, y]) => what === 'scale' && x === 1 && y === -1), `${tool} is not mirrored facing west`);
  }
  // While the sheets load: the axe and the maul in strokes, and the others leave the hoe as it is.
  const loading = { spriteFrame: () => null, drawSprite: () => 0 };
  assert.equal(drawHaftTool(recorder(), 'axe', 'rust', 1, 100, 200, 60, 1, loading), 2);
  assert.equal(drawHaftTool(recorder(), 'maul', 'rust', 1, 100, 200, 60, 1, null), 2);
  assert.equal(drawHaftTool(recorder(), 'spade', 'rust', 1, 100, 200, 60, 1, loading), 0);
  // A figure the table does not know keeps its hoe, painted tool or not.
  assert.equal(drawHaftTool(recorder(), 'axe', 'nobody', 1, 100, 200, 60, 1, art), 0);
  assert.ok(Object.keys(HAFTS).length > 10);
  assert.equal(paintToolPart(recorder(), 'rod', 0, 0, 10, -10, false, loading), false);
});

test('the dig, the well, the grubbing, the beaten wash and the sweeping each hold their painted tool', () => {
  for (const key of ['dig', 'well', 'grub']) assert.equal(STROKES[key].tool, 'spade', key);
  assert.equal(STROKES.beat.tool, 'stick');
  assert.equal(STROKES.sweep.tool, 'broom');
  assert.ok(WORK['keep-house'].by.some(([words, stroke]) => words.test('sweeping the floor') && stroke === 'sweep'), 'sweeping is not the sweep');
  for (const key of ['chop', 'split', 'notch']) assert.ok(HAFT_TOOLS.has(STROKES[key].tool), key);
});
