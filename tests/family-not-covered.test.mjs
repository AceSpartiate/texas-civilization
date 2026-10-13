// The family sitting out the rain is seen, not covered (2026-10-13). Found by the weather proof: in the yard, Benjamin, Henry,
// Peter and Frances Weatherby, sheltering at the tent, had their names and a `__drawnAt` spot and nothing of them to be seen.
// They were drawn - Astra's rig `camp-rest` figures, every one - and then covered twice over:
//
//   1. by Juniper the ox, whose cosmetic separation (public/app.js `stableOffset`) carried him a figure and a half west of where
//      the server has him, onto the tent, and in front of three of them. Not fixed: drawing a beast that stands alone on its own
//      point (`standsApart`, 2026-10-13) stacked the parked wagons, the two horses and a bought mule on one another at the yard's
//      rails and on a zoomed-out map (test:wagons, test:errand, test:shops), so it was taken out before release; see HANDOFF.md;
//   2. by the trees drawn again over each of them (public/trees-front.js `paintInFront`), thinned once for each person - and the
//      family sits close, so each person's trees were laid again over their neighbours, three and four layers deep.
//
// It predates the rig: at 3542cba7 the same family was hidden the same way, under trees then laid at full strength.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FRONT_STRENGTH, clearLaid, paintInFront } from '../public/trees-front.js';

/**
 * A canvas that keeps one alpha a pixel, enough of a 2D context for `paintInFront`: clearing, a rectangular clip, and copying a
 * box from another canvas under `source-over`, `destination-in` or `destination-out` at the context's `globalAlpha`.
 */
function gridCanvas(width = 120, height = 100) {
  const alpha = new Float32Array(width * height);
  const canvas = { width, height, alpha, at: (x, y) => alpha[y * width + x] };
  let clip = null; const saved = [];
  const inside = (x, y) => !clip || (x >= clip[0] && x < clip[0] + clip[2] && y >= clip[1] && y < clip[1] + clip[3]);
  const context = {
    canvas, globalAlpha: 1, globalCompositeOperation: 'source-over', box: null,
    setTransform() {}, beginPath() {},
    save() { saved.push({ clip, alpha: this.globalAlpha, op: this.globalCompositeOperation }); },
    restore() { const was = saved.pop(); clip = was.clip; this.globalAlpha = was.alpha; this.globalCompositeOperation = was.op; },
    rect(...box) { this.box = box; }, clip() { clip = this.box; },
    clearRect(x0, y0, w, h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inside(x, y)) alpha[y * width + x] = 0; },
    /** A tree's crown, solid. */
    fillRect(x0, y0, w, h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inside(x, y)) alpha[y * width + x] = 1; },
    drawImage(from, x0, y0, w, h) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (!inside(x, y)) continue;
        const i = y * width + x, src = from.alpha[i] * this.globalAlpha;
        if (this.globalCompositeOperation === 'destination-in') alpha[i] *= src;
        else if (this.globalCompositeOperation === 'destination-out') alpha[i] *= 1 - src;
        else alpha[i] = src + alpha[i] * (1 - src);
      }
    },
  };
  canvas.getContext = () => context;
  return canvas;
}

test('the trees drawn again over a family sitting close are laid on the page once, not once for each of them', () => {
  const page = gridCanvas(), kept = [gridCanvas(), gridCanvas(), gridCanvas()], layers = () => kept;
  // Two of the family side by side, their boxes overlapping from x 30 to 50, and the woods in front of both (the whole box).
  const left = { left: 10, top: 10, width: 40, height: 50 }, right = { left: 30, top: 10, width: 40, height: 50 };
  const woods = box => on => on.fillRect(box.left, box.top, box.width, box.height);
  clearLaid(layers, page.width, page.height);
  paintInFront(page.getContext('2d'), left, woods(left), null, layers);
  paintInFront(page.getContext('2d'), right, woods(right), null, layers);
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  assert.ok(near(page.at(20, 30), FRONT_STRENGTH), 'over the first alone, thinned');
  assert.ok(near(page.at(60, 30), FRONT_STRENGTH), 'over the second alone, thinned');
  // Laid twice there, the leaves would cover 1 - 0.55² of whoever sits under both: up to four layers the weather proof's yard
  // had over Peter Weatherby left 9% of him.
  assert.ok(near(page.at(40, 30), FRONT_STRENGTH), `where the two overlap, thinned once (${page.at(40, 30).toFixed(3)}, not ${(1 - (1 - FRONT_STRENGTH) ** 2).toFixed(3)})`);
  assert.equal(page.at(80, 30), 0, 'and nothing off them');
  // A frame later the page is drawn afresh, and what was laid last frame is forgotten, or nobody would get trees over them again.
  clearLaid(layers, page.width, page.height);
  const next = gridCanvas();
  paintInFront(next.getContext('2d'), right, woods(right), null, layers);
  assert.ok(near(next.at(40, 30), FRONT_STRENGTH), 'laid again the next frame');
});

test('the page forgets what it laid at the start of each frame\'s trees, and keeps a third layer for it', () => {
  const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const from = page.indexOf('function treesInFront(');
  const body = page.slice(from, page.indexOf('\n}\n', from));
  assert.ok(body.indexOf('clearLaid(frontLayers') > 0 && body.indexOf('clearLaid(frontLayers') < body.indexOf('standing.push('), 'cleared before any group is laid');
  assert.match(page, /function frontLayers\(width, height\) \{\n  for \(let i = 0; i < 3; i\+\+\)/);
});
