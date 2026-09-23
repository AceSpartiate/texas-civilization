// A tap on a house opens its rooms where the house is drawn (2026-09-23). Since houses are placed on the land (HANDOFF.md
// "House placement preview") a family's house stands wherever the student put it, but the spot a tap was tested against
// (`housesDrawn` in public/app.js) was still the family's site point: tapping the house did nothing, and tapping the bare
// ground at the site opened a house that was not there.
//
// These tests run the page's own `drawLandHouses`, `drawPlacedHouse`, `notePlacedHouse` and `houseAt`, and the line of
// `drawWorld` that notes a family's site, read out of public/app.js, drawing with the page's own `drawSprite` (public/art.js,
// its sheets stubbed) against a context that follows the transform - and tap where the pictures actually landed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
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
// The line of drawWorld that notes where a family's house at its site can be tapped.
const siteLine = page.match(/^\s*if \(!settlement && \(ownLand \|\| host\)\) housesDrawn\.set\(site\.id, [^\n]*$/m);
assert.ok(siteLine, 'the line of drawWorld that notes a house at its site was not found, so this test checks nothing');
const SIZE = new Function(`${declaration('const SIZE = {', '\n};')} return SIZE;`)();
const page_ = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window', 'drawnNow',
  [declaration('const cabinSize = ', ';\n'), declaration('const housesDrawn = new Map();', ';\n'), declaration('function houseAt(', '\n}\n'),
    declaration('function drawLandHouses(', '\n}\n'), declaration('function notePlacedHouse(', '\n}\n'), declaration('function drawPlacedHouse(', '\n}\n'),
    `const noteSite = (site, q, size) => { const settlement = false, ownLand = true, host = false; ${siteLine[0]} };`,
    'return { cabinSize, housesDrawn, houseAt, drawLandHouses, noteSite };'].join('\n'),
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, {}, spots => spots);

/** A canvas context that keeps the transform and records the screen box each picture covers. */
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
      const screen = (x, y) => ({ x: at[0] * x + at[2] * y + at[4], y: at[1] * x + at[3] * y + at[5] });
      // The middle of the picture as it lands on the screen: where a finger goes to tap it.
      drawn.push({ name: byCut.get(`${sheetOf.get(cut)}:${cut}`), middle: screen(dx + dw / 2, dy + dh / 2) });
    },
  };
}

const finished = id => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type).stageCount, 0]);
const camera = { scale: 2600, figure: 2600 * 0.019, toScreen: p => ({ x: 720 + p.x * 2600, y: 500 + p.y * 2600 }) };
const site = { id: 'home-1', x: 0, y: 0 };
/** One frame of the family's land: its site noted, then its houses drawn, as drawWorld does. */
function frame(current, completed = []) {
  const ctx = recorder(), q = camera.toScreen(site), size = page_.cabinSize(camera);
  page_.housesDrawn.clear();
  page_.noteSite(site, q, size);
  page_.drawLandHouses(ctx, camera, site.id, q, size, current, completed);
  return { ctx, q, size };
}
/** Where a tap on the bare site point lands: the middle of where a house at the site is drawn. */
const atSite = ({ q, size }) => ({ x: q.x, y: q.y - size * .35 });

for (const plan of ['round-log', 'dog-run']) {
  for (const rotation of [0, 90, 180, 270]) {
    test(`a ${plan} placed at ${rotation} degrees opens where it is drawn, and the bare site does not`, () => {
      // Placed a third of a mile east of its site: 780 pixels at this zoom, clear of the site's reach.
      const house = { pieces: finished(plan), placement: { x: 0.3, y: 0.05, rotation } }, drawnFrame = frame(house);
      const pictures = drawnFrame.ctx.drawn;
      assert.ok(pictures.some(each => /full-walls$/.test(each.name)), 'no pen was drawn, so there is nothing to tap');
      for (const { name, middle } of pictures) assert.equal(page_.houseAt(middle), site.id, `a tap on the middle of the ${name} at ${middle.x.toFixed(0)}, ${middle.y.toFixed(0)} opened nothing`);
      assert.equal(page_.houseAt(atSite(drawnFrame)), null, 'a tap on the bare site point, where no house is drawn, opened the house');
      // Not everywhere: well to the side of every picture of the house, nothing opens.
      const right = Math.max(...pictures.map(each => each.middle.x)) + drawnFrame.size * 3;
      assert.equal(page_.houseAt({ x: right, y: pictures[0].middle.y }), null, 'a tap beside the house opened it');
    });
  }
}

test('a house placed nowhere still opens at its site, and a finished placed house beside it where that one stands', () => {
  const unplaced = frame({ pieces: finished('round-log') });
  assert.equal(page_.houseAt(atSite(unplaced)), site.id, 'the house at its site no longer opens at the site');
  for (const { name, middle } of unplaced.ctx.drawn) assert.equal(page_.houseAt(middle), site.id, `a tap on the ${name} at its site opened nothing`);
  // The family's first house placed and finished, a second planned before placement existed: both open.
  const both = frame({ pieces: finished('hewn-log') }, [{ pieces: finished('dog-run'), placement: { x: -0.3, y: 0.1, rotation: 90 } }]);
  assert.equal(page_.houseAt(atSite(both)), site.id);
  const placedWalls = both.ctx.drawn.filter(each => /round-full-walls$/.test(each.name));
  assert.equal(placedWalls.length, 2, 'the placed dog-run drew two pens');
  for (const { middle } of placedWalls) assert.equal(page_.houseAt(middle), site.id);
});
