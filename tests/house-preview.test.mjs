// The translucent house a student moves over the land before "Build here" is the house that will stand there: the same
// size, the same turn and the same footprint (docs/WOODS_AND_BUILDING.md §6.2, HANDOFF.md "House placement preview").
// A student said on 2026-09-23 that the preview was too small. It was: public/app.js `drawPlacedHouse` drew the preview
// and the placed house in true feet - an eight-foot cell, a pen seventeen feet high - on a map whose people are drawn a
// hundred feet tall and whose house at its site is SIZE.cabin people high, so the house came out a sixth of a person.
// These tests run the page's own `drawPlacedHouse` and `cabinSize`, read out of public/app.js, against a context that
// records what is drawn, and hold the preview to the built house and both to the house drawn at the site.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawHousePlot, houseFootprint, plotCell } from '../public/house-plot.js';
import { CABIN_PEOPLE, houseOnGround } from '../sim/house-footprint.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { pageCamera } from './support/page-camera.mjs';

const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const catalogue = plotCatalogue();

/** One top-level declaration of the page, by its first line, up to the line that closes it. */
function declaration(start, end) {
  const from = page.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in public/app.js, so this test checks nothing`);
  const to = page.indexOf(end, from);
  assert.ok(to > from, `the end of ${start} was not found`);
  return page.slice(from, to + end.length);
}

// SIZE.cabin is the server's number for how tall a house is drawn (sim/house-footprint.mjs), which the page imports.
const SIZE = new Function('CABIN_PEOPLE', `${declaration('const SIZE = {', '\n};')} return SIZE;`)(CABIN_PEOPLE);
const window = { __placedHousesDrawn: [] };
const drawSprite = (ctx, name, x, y, height, options) => { ctx.log.push(['sprite', name, x, y, height, Boolean(options?.flip)]); return height; };
const { frames } = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const spriteFrame = name => frames[name] || null;
const { cabinSize, drawPlacedHouse } = new Function('SIZE', 'plotCatalogue', 'drawSprite', 'spriteFrame', 'drawHousePlot', 'houseFootprint', 'plotCell', 'window',
  `${declaration('const cabinSize = ', ';\n')}\n${declaration('function drawPlacedHouse(', '\n}\n')}\nreturn { cabinSize, drawPlacedHouse };`,
)(SIZE, catalogue, drawSprite, spriteFrame, drawHousePlot, houseFootprint, plotCell, window);

function recorder() {
  const log = [];
  return {
    log, globalAlpha: 1,
    save() { log.push(['save']); }, restore() { log.push(['restore']); },
    translate(x, y) { log.push(['translate', x, y]); }, rotate(angle) { log.push(['rotate', angle]); },
    fillRect(...box) { log.push(['fillRect', ...box]); }, strokeRect(...box) { log.push(['strokeRect', ...box]); },
  };
}
/** A camera as the page makes one (`figure` is scale times PERSON_MILES, 0.019), looking at the middle of the map. */
const cameraAt = scale => pageCamera(scale, p => ({ x: 720 + p.x * scale, y: 500 + p.y * scale }));
/** A plan finished, as the preview draws it (public/app.js `drawSitePick`). */
const finished = id => catalogue.plans.find(plan => plan.id === id).pieces.map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type).stageCount, 0]);
const sprites = ctx => ctx.log.filter(entry => entry[0] === 'sprite');
const pen = ctx => sprites(ctx).find(entry => /walls|^house-(round|hewn)-log$/.test(entry[1]));

for (const plan of ['round-log', 'dog-run']) {
  for (const rotation of [0, 90, 180, 270]) {
    test(`the ${plan} preview is the ${plan} house that stands there, turned ${rotation}: same size, turn and footprint`, () => {
      const camera = cameraAt(2000), placement = { x: 0.1, y: -0.05, rotation }, pieces = finished(plan);
      window.__placedHousesDrawn = [];
      const preview = recorder(), built = recorder();
      drawPlacedHouse(preview, camera, { placement, pieces }, 0.5);
      drawPlacedHouse(built, camera, { placement, pieces });
      // Every piece is drawn where it is drawn in the house that stands, at the same height, mirrored or not the same.
      assert.ok(sprites(built).length >= pieces.length, 'the built house drew nothing, so there is nothing to compare');
      assert.deepEqual(sprites(preview), sprites(built));
      assert.deepEqual(preview.log.filter(entry => ['translate', 'rotate'].includes(entry[0])), built.log.filter(entry => ['translate', 'rotate'].includes(entry[0])));
      // The outline on the ground is the footprint of the pieces, turned, in the cells they are drawn in, round the point.
      const [shown, standing] = window.__placedHousesDrawn;
      assert.equal(shown.preview, true); assert.equal(standing.preview, false);
      assert.equal(shown.size, standing.size); assert.equal(shown.cell, standing.cell);
      assert.deepEqual(shown.footprint, standing.footprint);
      const outline = preview.log.find(entry => entry[0] === 'fillRect').slice(1);
      const at = camera.toScreen(placement);
      assert.deepEqual(outline, [at.x + shown.footprint.x, at.y + shown.footprint.y, shown.footprint.w, shown.footprint.h]);
      const foot = houseFootprint({ pieces }, catalogue, rotation);
      assert.deepEqual(shown.footprint, { x: foot.x * shown.cell, y: foot.y * shown.cell, w: foot.w * shown.cell, h: foot.h * shown.cell });
      assert.equal(built.log.some(entry => entry[0] === 'fillRect'), false, 'a standing house has no preview outline');
      // Turned a quarter, the footprint's long side runs the way the ground the server checks does (sim/house-footprint.mjs;
      // tests/house-spacing.test.mjs holds the two to the same ground exactly).
      const unturned = houseFootprint({ pieces }, catalogue), ground = houseOnGround({ pieces }, catalogue, placement).footprint;
      assert.deepEqual([foot.w, foot.h], rotation % 180 ? [unturned.h, unturned.w] : [unturned.w, unturned.h]);
      assert.equal(foot.w > foot.h, ground.maxX - ground.minX > ground.maxY - ground.minY, `at ${rotation} degrees the outline's long side runs across the server's`);
    });
  }
}

test('a placed house and its preview are drawn the size of the house at its site, in the yardstick of the people', () => {
  for (const scale of [200, 2000, 9000]) {
    const camera = cameraAt(scale), pieces = finished('round-log');
    const placed = recorder(), site = recorder();
    drawPlacedHouse(placed, camera, { placement: { x: 0, y: 0, rotation: 0 }, pieces }, 0.5);
    drawHousePlot(site, 720, 500, cabinSize(camera), { house: { pieces } }, catalogue, drawSprite, spriteFrame);
    // The pen stands as high on the placed house as on the house at its site: SIZE.cabin people, not seventeen feet.
    assert.equal(pen(placed)[4], pen(site)[4], `at ${scale} pixels a mile`);
    assert.ok(pen(placed)[4] > camera.figure * 2, `at ${scale} pixels a mile a pen of ${pen(placed)[4]} pixels stands under two people of ${camera.figure}`);
  }
  // And the house at its site is drawn at that size too, so there is one size for a house on the land.
  assert.match(page, /if \(settlement \|\| site\.kind === 'homestead' \|\| !site\.kind\) \{\n\s*const size = cabinSize\(camera, settlement\);/);
});
