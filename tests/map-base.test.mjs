// What the map keeps between frames, and how its detail hands over as a student zooms (docs/PERFORMANCE_RENDER.md).
//
// Owner, 2026-09-17: the game was "exceptionally laggy" on a school laptop, and "rivers and forests pop in and out of their
// places during zoom. their shapes and sizes change too." The drawing itself is in public/app.js, a browser module these
// tests cannot import; what decides it - when the kept ground is still right, which pieces of a river can reach the screen,
// how wide water is, how the woods and the scattered ground hand over between zooms, how a grid of cover is smoothed, and
// how a class of ground looks - is here, pure, and held.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_PIXEL_BUDGET, canvasRatio, distanceToSegments, ramp, sameLayerKey, scatterItem, scatterLevels, segmentsNear, setText, smoothCover, WATER, waterWidth, creekOpacity } from '../public/map-base.js';
import { curveThrough, visibleSegments } from '../public/curve.js';
import { WOODS_BANDS, woodsLayers } from '../public/woods-view.js';
import { DEFAULT_GROUND, GROUND_CLASSES, groundClassAt, markFor } from '../public/ground-classes.js';
import { decodeLand, decodeProvince, flatPoints, landWeights, lineBand } from '../public/land-levels.js';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

/** One wheel step of the map (public/app.js, the wheel handler). */
const STEP = 1.15;
const zooms = (from, to) => { const out = []; for (let v = from; v <= to; v *= STEP) out.push(v); return out; };

test('the kept ground is laid down again only for the same snapshot, camera and canvas', () => {
  const world = {}, key = [3, world, world.map, 1366, 768, 88.1, -24.2, 401.8];
  assert.equal(sameLayerKey(key, [3, world, world.map, 1366, 768, 88.1, -24.2, 401.8]), true);
  assert.equal(sameLayerKey(key, [3, {}, undefined, 1366, 768, 88.1, -24.2, 401.8]), false, 'a new snapshot draws the ground again');
  assert.equal(sameLayerKey(key, [4, world, world.map, 1366, 768, 88.1, -24.2, 401.8]), false, 'art or a woods tile landing draws it again');
  assert.equal(sameLayerKey(key, [3, world, world.map, 1366, 768, 88.1, -24.2, 402]), false, 'a zoom draws it again');
  assert.equal(sameLayerKey(key, [3, world, world.map, 1280, 768, 88.1, -24.2, 401.8]), false, 'a resize draws it again');
  assert.equal(sameLayerKey(null, key), false, 'nothing kept yet');
});

test('the map is drawn sharp on a dense screen but never at more pixels than a 1080p frame', () => {
  // A plain 1366 by 768 Chromebook: one canvas pixel a CSS pixel, as ever.
  assert.equal(canvasRatio(1366, 768, 1), 1);
  // A small dense screen keeps its full density while it fits.
  assert.equal(canvasRatio(800, 600, 2), 2);
  // A 1536 by 864 screen at density 1.25 (a 1080p Chromebook) is drawn at its own density: it fits.
  assert.equal(canvasRatio(1536, 864, 1.25), 1.25);
  // A 1440 by 900 screen at density 2 was 2880 by 1800, 5.2 million pixels a frame: now at the budget.
  const ratio = canvasRatio(1440, 900, 2);
  assert.ok(ratio > 1 && ratio < 2);
  assert.ok(Math.abs(1440 * ratio * 900 * ratio - CANVAS_PIXEL_BUDGET) < 1, `${Math.round(1440 * ratio * 900 * ratio)} pixels`);
  // Never below one canvas pixel a CSS pixel, however large the window.
  assert.equal(canvasRatio(3840, 2160, 2), 1);
  assert.equal(canvasRatio(0, 0, 3), 2, 'density held to two, as before');
});

test('a node is written only when its words change, so the drawing loop does not touch the page twelve times a second', () => {
  let writes = 0, text = 'Following';
  const node = { get textContent() { return text; }, set textContent(value) { writes++; text = value; } };
  for (let i = 0; i < 12; i++) setText(node, 'Following');
  assert.equal(writes, 0);
  setText(node, 'Watching Rosa');
  assert.equal(writes, 1);
  assert.equal(text, 'Watching Rosa');
});

test('a course is measured against only its segments near the view, and every distance in the view is unchanged', () => {
  // A long wandering course, like a river across the colonies.
  const points = Array.from({ length: 1200 }, (_, i) => ({ x: i * 0.25, y: Math.sin(i / 7) * 3 + Math.cos(i / 31) * 9 }));
  const box = { minX: 140, minY: points[572].y - 2, maxX: 146, maxY: points[572].y + 2 }, reach = 0.4;
  const near = segmentsNear(points, box, reach);
  assert.ok(near.length > 0 && near.length < 80, `${near.length} segments kept of ${points.length - 1}`);
  const all = Array.from({ length: points.length - 1 }, (_, i) => i + 1);
  for (let i = 0; i < 400; i++) {
    const p = { x: box.minX + ((i * 37) % 97) / 97 * (box.maxX - box.minX), y: box.minY + ((i * 53) % 89) / 89 * (box.maxY - box.minY) };
    const whole = distanceToSegments(p, points, all), kept = distanceToSegments(p, points, near);
    if (whole < reach) assert.equal(kept, whole, `the distance at ${p.x},${p.y}`);
    else assert.ok(kept >= reach, `a point further than the reach stays further at ${p.x},${p.y}`);
  }
  // A creek running just outside the view, closer to its edge than the reach: it is still measured.
  const beside = [{ x: 0, y: 10.3 }, { x: 5, y: 10.3 }];
  const view = { minX: 1, minY: 8, maxX: 4, maxY: 10 };
  assert.deepEqual(segmentsNear(beside, view, 0.5), [1]);
  assert.ok(Math.abs(distanceToSegments({ x: 2, y: 9.9 }, beside, segmentsNear(beside, view, 0.5)) - 0.4) < 1e-9);
});

test('a river laid down only where it can reach the screen is the same curve there', () => {
  const recorder = () => { const calls = []; return { calls, beginPath: () => calls.push(['begin']), moveTo: (x, y) => calls.push(['move', x, y]), lineTo: (x, y) => calls.push(['line', x, y]), bezierCurveTo: (...a) => calls.push(['bezier', ...a])  }; };
  // In screen pixels: a course that runs far off both sides of a 1000 by 600 screen.
  const points = Array.from({ length: 400 }, (_, i) => ({ x: -6000 + i * 40, y: 300 + Math.sin(i / 5) * 200 }));
  const full = recorder(), culled = recorder();
  curveThrough(full, points);
  const { segments, count } = visibleSegments(points, 1000, 600, 20);
  curveThrough(culled, points, segments);
  const fullCurves = full.calls.filter(call => call[0] === 'bezier');
  const culledCurves = culled.calls.filter(call => call[0] === 'bezier');
  assert.equal(culledCurves.length, count);
  assert.ok(count < 60 && count > 20, `${count} of ${points.length - 1} segments laid down`);
  // Every piece of the full curve that could put paint on the screen is laid down, identically.
  const kept = new Set(culledCurves.map(call => call.join()));
  fullCurves.forEach((call, i) => {
    const xs = [points[i].x, call[1], call[3], call[5]], ys = [points[i].y, call[2], call[4], call[6]];
    const onScreen = Math.max(...xs) + 20 >= 0 && Math.min(...xs) - 20 <= 1000 && Math.max(...ys) + 20 >= 0 && Math.min(...ys) - 20 <= 600;
    if (onScreen) assert.ok(kept.has(call.join()), `segment ${i} reaches the screen and was not laid down as it was`);
  });
  // A bend whose two points are above the screen, but whose curve dips into it, is laid down.
  const bend = [{ x: 400, y: -2000 }, { x: 400, y: -60 }, { x: 700, y: -60 }, { x: 700, y: -2000 }];
  assert.equal(visibleSegments(bend, 1000, 600, 20).segments[1], 1, 'the bend dips into the screen');
  // A course wholly off screen lays nothing down.
  assert.equal(visibleSegments(points.map(p => ({ x: p.x, y: p.y + 5000 })), 1000, 600, 20).count, 0);
});

test('water narrows steadily as the camera pulls back and never swells into a lake at a wide zoom', () => {
  for (const [kind, water] of Object.entries(WATER)) {
    let last = null;
    for (const scale of zooms(1.5, 5000)) {
      const width = waterWidth(water.miles, scale, water.floor);
      if (last) {
        assert.ok(width >= last.width, `${kind} gets narrower as the camera comes in at ${scale}`);
        assert.ok(width / last.width <= STEP + 1e-9, `${kind} jumps from ${last.width} to ${width} in one wheel step at ${scale}`);
      }
      last = { width };
    }
    // True width close in, where the trees on its bank are drawn at their size.
    assert.ok(Math.abs(waterWidth(water.miles, 4736, water.floor) - water.miles * 4736) < 0.5, `${kind} is its true width close in`);
  }
  // Pulled back to a county and beyond, a river is a line a few pixels wide: it was eighteen, and read as a lake.
  assert.ok(waterWidth(WATER.river.miles, 40, WATER.river.floor) < 4, 'a river at a county\'s zoom');
  assert.ok(waterWidth(WATER.river.miles, 4, WATER.river.floor) < 3.1, 'a river across the whole country');
  // Creeks are detail: none at the whole country, all of them at a colony, and faded in between rather than switched.
  assert.equal(creekOpacity(3.6), 0);
  assert.equal(creekOpacity(30), 1);
  for (const scale of zooms(2, 60)) assert.ok(Math.abs(creekOpacity(scale * STEP) - creekOpacity(scale)) < 0.4, `creeks pop at ${scale}`);
});

test('the woods hand over between trees, canopy and shade across bands of zoom, never at one wheel step', () => {
  const aspect = 768 / 1366;
  let last = null;
  for (const wide of zooms(0.25, 200)) {
    const layers = woodsLayers(wide, wide * wide * aspect);
    for (const value of Object.values(layers)) assert.ok(value >= 0 && value <= 1);
    if (last) for (const name of ['trees', 'patches', 'shade']) {
      assert.ok(Math.abs(layers[name] - last[name]) <= 0.5, `the ${name} jump from ${last[name]} to ${layers[name]} in one wheel step at ${wide} miles across`);
    }
    // Wherever the map draws woods at all, some layer of them is there: no zoom where the forest blinks out.
    if (wide <= 60) assert.ok(layers.patches + layers.shade > 0.3, `the woods thin to nothing at ${wide} miles across`);
    last = layers;
  }
  // Close in every tree, and the canopy still under them; middle distance the canopy alone; far out the shade.
  assert.deepEqual(woodsLayers(0.3, 0.05).trees, 1);
  assert.ok(woodsLayers(0.3, 0.05).patches > 0.3, 'the canopy is kept under the trees');
  assert.equal(woodsLayers(4, 9).trees, 0);
  assert.equal(woodsLayers(4, 9).shade, 0);
  assert.equal(woodsLayers(30, 500).patches, 0);
  assert.equal(woodsLayers(30, 500).shade, 1);
  assert.ok(WOODS_BANDS.trees[0] / WOODS_BANDS.trees[1] >= 2, 'the trees fade over at least two wheel steps');
});

/** Every scattered thing a view of `viewMiles` across draws in a box, by where it stands, with the strength it is drawn at. */
function scatterIn(box, viewMiles) {
  const found = new Map();
  for (const { level, cell, alpha } of scatterLevels(viewMiles, { finest: 0.01, across: 48 })) {
    for (let cy = Math.floor(box.minY / cell); cy <= Math.floor(box.maxY / cell); cy++) {
      for (let cx = Math.floor(box.minX / cell); cx <= Math.floor(box.maxX / cell); cx++) {
        const item = scatterItem(level, cx, cy);
        if (item.roll > 0.105) continue;
        const x = (cx + item.jx) * cell, y = (cy + item.jy) * cell;
        if (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY) continue;
        found.set(`${x.toFixed(9)},${y.toFixed(9)}`, { alpha, share: item.share });
      }
    }
  }
  return found;
}

test('the scattered ground stays where it is as the camera comes in, and only fades in or out', () => {
  // A small patch of prairie watched from a county's width down to a farm's.
  const box = { minX: 88.1, minY: -24.3, maxX: 88.35, maxY: -24.15 };
  let wider = null;
  for (let view = 40; view >= 0.3; view /= STEP) {
    const now = scatterIn(box, view);
    if (wider) {
      for (const [at, thing] of wider) {
        const still = now.get(at);
        assert.ok(still, `something at ${at}, seen ${view * STEP} miles across, is gone at ${view}`);
        assert.equal(still.share, thing.share, 'and is still the same kind of thing');
        assert.ok(still.alpha >= thing.alpha - 1e-9, 'and no fainter closer in');
      }
    }
    wider = now;
  }
  // A view costs about what the old scatter did: a few hundred things, not thousands.
  for (const view of [0.3, 1, 5, 20, 40]) {
    const levels = scatterLevels(view, { finest: 0.01, across: 48 });
    const cells = levels.reduce((sum, { cell }) => sum + Math.ceil(view / cell + 1) * Math.ceil(view * 0.57 / cell + 1), 0);
    assert.ok(cells * 0.105 < 1400, `${Math.round(cells * 0.105)} things expected at ${view} miles across`);
  }
});

test('a grid of cover is smoothed into soft edges without bleeding grey into the empty cells', () => {
  // One timber cell in the middle of five by five, as the woods' patches colour it.
  const colour = [86, 116, 56, 0.7];
  const { width, height, data } = smoothCover(5, 5, (column, row) => column === 2 && row === 2 ? colour : null, { upscale: 4 });
  assert.equal(width, 20); assert.equal(height, 20);
  const pixel = (x, y) => Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 4));
  const middle = pixel(10, 10), edge = pixel(8, 10), outside = pixel(5, 10), far = pixel(0, 0);
  assert.ok(middle[3] > edge[3] && edge[3] > outside[3], `alpha falls away from the middle: ${middle[3]} ${edge[3]} ${outside[3]}`);
  assert.ok(edge[3] > 0 && edge[3] < 255 * 0.7, 'the cell\'s edge is soft');
  assert.equal(far[3], 0, 'far cells stay empty');
  for (const p of [middle, edge, outside]) if (p[3] > 3) assert.ok([0, 1, 2].every(i => Math.abs(p[i] - colour[i]) <= 2), `the colour holds where it thins: ${p}`);
});

test('a class of ground is a table entry, and the prairie draws the marks the map always drew', () => {
  // The scatter before classes: rocks below .095, scrub below .17, prickly pear below .21, grass above.
  for (const [share, sprite, size] of [[0.05, 'rocks', .5], [0.094, 'rocks', .5], [0.1, 'scrub', 1], [0.12, 'scrub', 1], [0.19, 'prickly-pear', 1], [0.5, 'grass-tuft', .6], [0.999, 'grass-tuft', .6]]) {
    const mark = markFor('prairie', share);
    assert.equal(mark.sprite, sprite, `share ${share}`);
    assert.equal(mark.size, size);
  }
  assert.equal(markFor('no-such-ground', 0.05).sprite, 'rocks', 'an unknown class is drawn as prairie');
  for (const [id, kind] of Object.entries(GROUND_CLASSES)) {
    assert.equal(kind.colour.length, 3, `${id} has a colour`);
    assert.ok(id === 'water' ? kind.alpha === 0 : kind.alpha > 0 && kind.alpha < 1, `${id} lets the relief show through`);
    assert.ok(kind.marks.at(-1).upTo >= 1, `${id}'s marks cover every roll`);
  }
  const grid = { minX: 10, minY: 20, cellMiles: 0.5, columns: 3, rows: 2, classes: ['prairie', 'desert', 'marsh'], cells: '012210' };
  assert.equal(groundClassAt(grid, 10.1, 20.1), 'prairie');
  assert.equal(groundClassAt(grid, 10.6, 20.1), 'desert');
  assert.equal(groundClassAt(grid, 11.2, 20.6), 'prairie');
  assert.equal(groundClassAt(grid, 10.6, 20.6), 'desert');
  assert.equal(groundClassAt(grid, 9, 20), DEFAULT_GROUND, 'off the grid');
  assert.equal(groundClassAt(null, 0, 0), DEFAULT_GROUND, 'a map without a grid');
  assert.equal(ramp(5, 0, 10), 0.5);
  assert.equal(ramp(5, 20, 10), 1, 'a ramp that falls');
});

test("the real land's levels decode as the data says, and a zoom picks its band and grids without a jump", () => {
  const read = name => JSON.parse(gunzipSync(readFileSync(new URL(`../public/terrain/${name}`, import.meta.url))));
  const province = decodeProvince(read('colonies-province.json.gz'));
  const land = decodeLand(read('colonies-land.json.gz'));
  // Every land class the data names has a table entry, so none is drawn as something else.
  for (const id of land[0].classes) if (id !== 'none') assert.ok(GROUND_CLASSES[id], `${id} has a table entry`);
  // Grids finest first; a cell is its class, the low nibble of the data's byte.
  assert.deepEqual(land.map(grid => grid.cellMiles), [0.5, 2, 8]);
  assert.equal(land[0].cells.length, land[0].columns * land[0].rows);
  assert.ok(land[0].cells.every(value => value < land[0].classes.length));
  assert.ok(land[0].cells.some(value => land[0].classes[value] === 'floodplain'), 'the bottomland is on the land');
  // A river is its points in miles, and every coarser band keeps only points of the finer one: choosing a band never moves it.
  const brazos = province.rivers.find(river => river.name === 'Brazos River' && river.levels[3]);
  assert.ok(brazos.miles > 0.05 && brazos.miles < 0.1, `the Brazos is ${brazos.miles} miles across`);
  for (let band = 1; band < 4; band++) {
    const finer = new Set(brazos.levels[band - 1].map(p => `${p.x},${p.y}`));
    assert.ok(brazos.levels[band].every(p => finer.has(`${p.x},${p.y}`)), `band ${band} keeps only points of band ${band - 1}`);
  }
  // Bands by zoom: coarse far out, finest close in, and never coarser as the camera comes in.
  let last = 3;
  for (const scale of zooms(1, 5000)) { const band = lineBand(province.bands, scale); assert.ok(band <= last); last = band; }
  assert.equal(lineBand(province.bands, 2000), 0);
  assert.ok(lineBand(province.bands, 4) >= 1, 'the whole country is not drawn at the finest band');
  // Grids by zoom: the weights sum to one and hand over across wheel steps.
  let previous = null;
  for (const scale of zooms(1, 5000)) {
    const weights = landWeights(scale);
    assert.ok(Math.abs(weights.reduce((sum, w) => sum + w, 0) - 1) < 1e-9);
    if (previous) weights.forEach((w, i) => assert.ok(Math.abs(w - previous[i]) <= 0.5, `grid ${i} jumps at scale ${scale}`));
    previous = weights;
  }
  assert.deepEqual(landWeights(1), [0, 0, 1], 'pulled right back: the eight-mile grid');
  assert.deepEqual(landWeights(5), [0, 1, 0], 'the whole country on a laptop: the two-mile grid');
  assert.deepEqual(landWeights(400), [1, 0, 0], 'a county: the half-mile grid');
  assert.deepEqual(flatPoints([100, -250, 1, 2]), [{ x: 1, y: -2.5 }, { x: 0.01, y: 0.02 }]);
});

test('the land\'s pictures are made by one pure function, off the page\'s main thread when the browser has workers', async () => {
  // Found profiling a load (2026-09-17): making them on the main thread was one task of about two seconds with the CPU
  // throttled six times, the page frozen just after the map first appeared.
  const { landPictureData, landUpscale, smoothCover } = await import('../public/map-base.js');
  const { readFileSync } = await import('node:fs');
  const grid = { columns: 6, rows: 4, cells: Uint8Array.from({ length: 24 }, (_, i) => i % 3), shade: Uint8Array.from({ length: 24 }, (_, i) => 100 + i * 4) };
  const palette = [null, [200, 180, 90, 0.4], [60, 90, 40, 0.7]];
  const pictures = landPictureData(grid, palette, 2);
  assert.deepEqual(pictures.wash, smoothCover(6, 4, (c, r) => palette[grid.cells[r * 6 + c]] || null, { upscale: 2 }), 'the wash is not each cell its class colour, smoothed');
  assert.equal(pictures.shade.width, 12);
  assert.ok(pictures.shade.data.some(v => v > 0), 'no hillshade drawn');
  assert.equal(landUpscale({ columns: 602, rows: 550 }), 2);
  const worker = readFileSync(new URL('../public/land-worker.js', import.meta.url), 'utf8');
  assert.match(worker, /import \{ landPictureData, smoothCover \} from '\.\/map-base\.js'/);
  assert.match(worker, /kind === 'cover'/, 'the worker does not smooth the woods cover');
  const client = readFileSync(new URL('../public/smooth-worker.js', import.meta.url), 'utf8');
  assert.match(client, /new Worker\('\/land-worker\.js', \{ type: 'module' \}\)/);
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /if \(!canSmoothOffThread\(\)\) \{/, 'the page makes the land pictures on the main thread even where it has workers');
  assert.match(app, /smoothOffThread\(\{ kind: 'land'/, 'the page does not send the land to the worker');
  // The woods' cover too (2026-09-17): a third of a second each time it was smoothed on the main thread.
  const woodsPage = readFileSync(new URL('../public/woods-view.js', import.meta.url), 'utf8');
  assert.match(woodsPage, /if \(across && canSmoothOffThread\(\)\) \{/, 'the woods cover is smoothed on the main thread even where the page has workers');
  assert.match(woodsPage, /smoothOffThread\(\{ kind: 'cover'/);
  const server = readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8');
  assert.match(server, /\['\/land-worker\.js', \['\.\.\/public\/land-worker\.js', 'text\/javascript'\]\]/, 'the server does not serve the worker');
  assert.match(server, /\['\/smooth-worker\.js', \['\.\.\/public\/smooth-worker\.js', 'text\/javascript'\]\]/, 'the server does not serve the worker client');
});

test('a long journey is out of sight in the middle, and a short one is watched all the way', async () => {
  // Owner, 2026-09-17, playtesting: "when i sent someone to join the army, they zipped excessively fast across the map", then
  // "what if we used fog of war to hide teleporting the character to their destination ... hide long distance travel on the
  // class view?" In the winter and spring a tick is twelve hours (sim/clock.mjs), so a walker crosses about 36 miles in the
  // fifth of a second a tick is drawn in. The clock is left alone; the long middle of a journey is not watched.
  const { IN_SIGHT_MILES, WATCHABLE_MILES_A_TICK, outOfSight } = await import('../public/map-base.js');
  // A campaign tick is twelve hours, in which a walker at three miles an hour crosses thirty-six; a farming tick is twenty
  // minutes, which is a mile, and is watched from end to end as it always was.
  const CAMPAIGN = 720, FARMING = 20, WALK = 1;
  const road = points => ({ points, distance: 40, speed: WALK });
  const on = (progress, distance = 40) => ({ travel: { points: [{ x: 0, y: 0 }, { x: 40, y: 0 }], distance, progress, speed: WALK } });
  assert.equal(outOfSight({ travel: null }, CAMPAIGN), false, 'somebody standing still went out of sight');
  assert.equal(outOfSight({ travel: road([]) }, CAMPAIGN), false, 'a journey with no line went out of sight');
  assert.equal(outOfSight(on(0), CAMPAIGN), false, 'somebody setting out was not watched');
  assert.equal(outOfSight(on(IN_SIGHT_MILES - 0.1), CAMPAIGN), false, 'somebody still near home was not watched');
  assert.equal(outOfSight(on(IN_SIGHT_MILES + 0.1), CAMPAIGN), true, 'the middle of a long journey is watched');
  assert.equal(outOfSight(on(38), CAMPAIGN), false, 'somebody walking in at the far end was not watched');
  assert.equal(outOfSight(on(40), CAMPAIGN), false, 'somebody arriving was not watched');
  // A short journey - one end of a family's land to the other - is watched the whole way.
  for (const progress of [0, 1, 2, 3]) assert.equal(outOfSight(on(progress, 4), CAMPAIGN), false, `a four-mile walk went out of sight at ${progress}`);
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /entitiesOf\(world\)\.filter\(entity => entity\.location && !outOfSight\(entity, minutesATick\)\)/, 'the map draws somebody who is out of sight');
  assert.match(app, /observedOf\(world\)\.filter\(entity => entity\.location && !outOfSight\(entity, minutesATick\)\)/, 'a neighbour out of sight is drawn');
  assert.match(app, /minutesATick = world\.minute - lastTickSeen\.minute/, 'the page does not know how long a tick stood for');
  assert.match(app, /out of sight, \$\{Math\.max\(1, Math\.round\(\(chosen\.travel\.distance \|\| 0\) - \(chosen\.travel\.progress \|\| 0\)\)\)\} miles to go/, 'the card does not say where they are');
});
