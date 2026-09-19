// The country outside the colonies' box: docs/MAP_ACCURACY.md §8 (owner, 2026-09-18).
//
// The map grows east to the Sabine and south and west to the Rio Grande, as a display layer round the box
// (scripts/build-outside.mjs). Held here: the box's own files are byte for byte what they were; the map's bounds are the new
// extent; the outside layer's bands nest; the rivers that cross the box's edge meet the box's own line there; the Rio Grande,
// the Nueces and the Sabine are where they are and named; Mexico is country, not sea or a hole; the outside leaves the box to
// the box except for the ring at its edge, whose classes are the box's; the outside's rules are the box's; the page's pieces
// tile the outside with no seam; and the woods outside are drawn by the map's tiles while the simulation never sees them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { coloniesProvince, mapBounds, mapForPage, outsideBands, provinceBands } from '../sim/province.mjs';
import { LAND, landBitsOf, landData } from '../sim/land.mjs';
import { patchAt, standAt } from '../sim/woods.mjs';
import { outsideStandAt } from '../sim/outside-woods.mjs';
import { woodsTile } from '../sim/woods-view.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { bandShade, reliefKind, slopeAt, windowRange } from '../scripts/terrain/land-rules.mjs';
import { decodeLand, emptyMiddle, tileGrid, withoutClaims } from '../public/land-levels.js';
import { aroundHole, landUpscale } from '../public/map-base.js';

const terrain = realTerrain(), at = (lon, lat) => milesFrom(terrain, lon, lat);
const outside = outsideBands(), province = provinceBands();
const outsideLand = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/outside-land.json.gz', import.meta.url))).toString('utf8'));
const toPoints = flat => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i] / 100, y: flat[i + 1] / 100 }); return out; };
function distanceTo(p, lines) {
  let best = Infinity;
  for (const line of lines) for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t));
  }
  return best;
}
const box = province.bounds;
const inBox = p => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
const linesOf = (name, from) => outside.rivers.filter(river => river.name === name && (!from || river.from === from)).map(river => toPoints(river.levels[0]));

/**
 * The box's built files as they were before the country outside it (commit 1487b0d): they feed the simulation, so they must
 * never change with it. build-land and build-province, rerun on 2026-09-18, gave these bytes again.
 */
const BOX_FILES = {
  'colonies-elevation.bin.gz': 'a6aab196e3b58322881b7522be45a79e3d214ec7dcd0e30851fe5c3f6b21a8b9',
  // Rebuilt on purpose 2026-09-19 for the biomes of 1836 (docs/BIOMES.md): the woods grid re-filed from LANDFIRE and the land's
  // classes one a biome, five bits of a cell where there were four. Relief, water and the edge of the data are cell for cell
  // as they were (checked by decoding both). Were dd7bf095...adc6adb and a327b651...95c2e.
  'colonies-land.bin.gz': '65f44999f8d78565b49a1fd64437959949343e10c71752db78e490820c82ca6a',
  'colonies-land.json.gz': '675d9a49129a8a1292bc8105dbe65aa116736baf37838af4bdaeb2db9f3508a4',
  // Rebuilt on purpose on main the same day, the march east's four houses made places (HIST-TEX-088); the outside layer does
  // not read it. Was 872c0ef1...965a4.
  'colonies-map.json.gz': '920d32946658d69a4d4a8576df90380478b2b82e049ebac74f10253744ce39ce',
  'colonies-province.json.gz': '8ef9b839a6f03b82a1ef81e832eb3d483cd7761e8f4eef32eea33b3508883dc7',
  'colonies-water.json.gz': '22900ae34954db4225fba11e1e977beab6161e4d53d84b5ebc923089e3162c44',
  // The biomes of 1836 (2026-09-19). The grid a class of the week before was made on is kept as it was, beside it, and read
  // by that class alone: its old hashes are now colonies-woods-2016's.
  'colonies-woods.bin.gz': '65205bbb9e66ae64d33c47ecd2dff430641593c3eb11d6b67e855f54eecc4c87',
  'colonies-woods.json.gz': '0f50376bbca82aa92a74442b4f20f95801ff4464e2788133efe8ce9c36c777aa',
  'colonies-woods-2016.bin.gz': '16221666bf6757126faba1b8237fd82b42618aa277c36265da80ff6abeca067a',
  'colonies-woods-2016.json.gz': '66bf252a4d8161564866def57ba1c1680bf4075b30e8dee9ccb156fb43ab3e1e',
};

test('the box\'s own files are byte for byte what they were', () => {
  for (const [file, hash] of Object.entries(BOX_FILES)) {
    const bytes = readFileSync(new URL(`../public/terrain/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `${file} has changed`);
  }
});

test('the map reaches the Sabine and the Rio Grande: 93.5-100.5°W, 25.8-32°N', () => {
  const corner = at(-100.5, 32), far = at(-93.5, 25.8), bounds = mapBounds();
  for (const [key, value] of [['minX', corner.x], ['minY', corner.y], ['maxX', far.x], ['maxY', far.y]]) assert.ok(Math.abs(bounds[key] - value) < 0.01, `${key} ${bounds[key]} is not ${value.toFixed(2)}`);
  assert.ok(bounds.minX < box.minX && bounds.maxX > box.maxX && bounds.maxY > box.maxY && bounds.minY === box.minY, 'the map holds the box, north edge to north edge');
  // The page is sent it for a class on the real land, whatever the class saved; the box's own province keeps the box's.
  const sent = mapForPage({ source: 'texas-colonies-map', sites: {}, bounds: { minX: -92.14, maxX: 209.15, minY: -172.81, maxY: 102.69 } });
  assert.deepEqual(sent.bounds, bounds);
  assert.deepEqual(sent.province.bounds, box);
  assert.equal(sent.province.levels.outside, '/terrain/outside-province.json');
  assert.equal(sent.province.levels.outsideLand, '/terrain/outside-land.json');
  const invented = { sites: {}, province: { rivers: [] }, bounds: { minX: -340, maxX: 400, minY: -310, maxY: 200 } };
  assert.equal(mapForPage(invented), invented, 'the invented Gonzales country keeps its own');
});

test('every band of the outside layer nests in the band finer than it', () => {
  assert.deepEqual(outside.bands, province.bands, 'the province\'s own bands');
  const key = (flat, i) => `${flat[i]},${flat[i + 1]}`;
  const nest = (fine, coarse, tolerance, what) => {
    const fineKeys = new Set(); for (let i = 0; i < fine.length; i += 2) fineKeys.add(key(fine, i));
    for (let i = 0; i < coarse.length; i += 2) assert.ok(fineKeys.has(key(coarse, i)), `${what}: a point not on the finer band`);
    const coarseLine = toPoints(coarse);
    for (const p of toPoints(fine)) assert.ok(distanceTo(p, [coarseLine]) <= tolerance + 0.02, `${what} strays from the finer band`);
  };
  for (const river of outside.rivers) for (let band = 1; band < outside.bands.length; band++) {
    if (river.levels[band] && river.levels[band - 1]) nest(river.levels[band - 1], river.levels[band], outside.bands[band], `${river.id} band ${band}`);
  }
  outside.escarpment.levels.forEach((pieces, band) => { if (band > 1) pieces.forEach((piece, i) => nest(outside.escarpment.levels[band - 1][i], piece, outside.bands[band], `escarpment band ${band}`)); });
  // The sea's rings: every point of a coarser ring is a point of the finer band's rings.
  for (let band = 1; band < outside.bands.length; band++) {
    const fine = new Set(outside.sea.levels[band - 1].flatMap(ring => { const out = []; for (let i = 0; i < ring.length; i += 2) out.push(key(ring, i)); return out; }));
    for (const ring of outside.sea.levels[band]) for (let i = 0; i < ring.length; i += 2) assert.ok(fine.has(key(ring, i)), `sea band ${band}: a point not on band ${band - 1}`);
  }
  // The land's bands are the box's, cell for cell on its lattice.
  const boxBands = landData().header.bands;
  outsideLand.bands.forEach((band, i) => {
    assert.equal(band.cell, boxBands[i].cell);
    for (const axis of ['minX', 'minY']) assert.ok(Number.isInteger((boxBands[i][axis] - band[axis]) / band.cell), `the ${band.cell}-mile band is off the box's lattice`);
  });
});

test('the rivers that cross the box\'s edge meet the box\'s own line there', () => {
  const crossing = new Set();
  for (const river of outside.rivers.filter(r => r.from === 'outside')) {
    const line = toPoints(river.levels[0]);
    for (const [end, next] of [[line[0], line[1]], [line.at(-1), line.at(-2)]]) {
      if (!inBox(end) && !inBox(next)) continue;
      // A piece that comes to the box is carried one point into it, so the two lines overlap rather than meet end to end.
      assert.ok(inBox(end) && !inBox(next), `${river.id} stops short of the box's edge`);
      const inside = [...province.rivers.filter(r => r.name === river.name).map(r => toPoints(r.levels[0])), ...linesOf(river.name, 'box')];
      const d = distanceTo(end, inside);
      assert.ok(d < 0.15, `${river.id} meets the box's ${river.name} ${d.toFixed(3)} miles off`);
      crossing.add(river.name);
    }
  }
  for (const name of ['Sabine River', 'Nueces River', 'Colorado River', 'Frio River', 'Guadalupe River', 'Medina River', 'Neches River']) assert.ok(crossing.has(name), `the ${name} crosses the box's edge and meets itself`);
  // The Brazos and the San Antonio never leave the box inside the map: the Brazos goes out at 32°N, which is the map's edge
  // too, and the San Antonio runs from Béxar to its bay inside the box.
  for (const name of ['Brazos River', 'San Antonio River']) assert.ok(!outside.rivers.some(r => r.name === name), `${name} has a piece outside the box`);
  // Every piece has the name and the id of its river, numbered on from the province's own pieces.
  const ids = new Set([...province.rivers, ...outside.rivers].map(r => r.id));
  assert.equal(ids.size, province.rivers.length + outside.rivers.length, 'a river piece\'s id is used twice');
  for (const river of outside.rivers) assert.match(river.id, new RegExp(`^${river.name.toLowerCase().replace(/[^a-z]+/g, '-')}-\\d+$`));
});

test('the Rio Grande, the Nueces and the Sabine are where they are, and named wherever the box\'s rivers are', () => {
  const rio = linesOf('Rio Grande');
  // Modern towns on its banks (USGS GNIS), and its mouth at the Gulf.
  for (const [name, lon, lat, within] of [['Laredo', -99.5075, 27.5064, 1], ['Rio Grande City', -98.8203, 26.3795, 1.5], ['Brownsville', -97.4975, 25.9017, 1.5], ['its mouth', -97.146, 25.957, 1.5]]) {
    const d = distanceTo(at(lon, lat), rio);
    assert.ok(d < within, `the Rio Grande is ${d.toFixed(2)} miles from ${name}`);
  }
  const seaRings = outside.sea.levels[0].map(toPoints).map(ring => [...ring, ring[0]]);
  const endsAtSea = name => Math.min(...linesOf(name, 'outside').flatMap(line => [line[0], line.at(-1)]).map(p => distanceTo(p, seaRings)));
  assert.ok(endsAtSea('Nueces River') < 1, 'the Nueces runs out into Nueces Bay');
  assert.ok(endsAtSea('Sabine River') < 1, 'the Sabine runs out into Sabine Lake');
  // The Sabine is the line between Texas and Louisiana: east of the box, west of 93.5°W.
  const sabine = linesOf('Sabine River', 'outside').flat();
  assert.ok(sabine.every(p => p.x > box.maxX - 0.2 && p.x < at(-93.5, 30).x + 0.2), 'the Sabine runs outside the box to the east');
  // Named in the shape the map has always carried (`/api/map`), as the box's rivers are.
  const classic = coloniesProvince().rivers;
  for (const name of ['Rio Grande', 'Nueces River', 'Sabine River']) assert.ok(classic.some(river => river.name === name && river.points.length > 5), `the ${name} is not in the map the page is sent`);
});

test('Mexico is country, not sea or a hole; the Gulf is sea', () => {
  const grids = decodeLand(outsideLand), half = grids[0];
  const classAt = (lon, lat) => { const p = at(lon, lat); return half.classes[half.cells[Math.floor((p.y - half.minY) / half.cellMiles) * half.columns + Math.floor((p.x - half.minX) / half.cellMiles)]]; };
  // Since 2026-09-19 Mexico is its own country (docs/BIOMES.md §4.12): chaparral, the delta round Matamoros, the river woods.
  const MEXICO = ['chaparral', 'mesquite-savanna', 'thorn-riparian', 'palm-grove', 'hill-country'];
  for (const [lon, lat] of [[-99.8, 26.5], [-97.7, 25.9], [-100.2, 27.5], [-99.6, 27.3]]) assert.ok(MEXICO.includes(classAt(lon, lat)), `Mexico at ${lat}, ${lon}: ${classAt(lon, lat)}`);
  for (const [lon, lat] of [[-96.8, 26.5], [-93.8, 28.5], [-93.7, 29.4]]) assert.equal(classAt(lon, lat), 'water', `the Gulf at ${lat}, ${lon}`);
  // And across the Rio Grande, Texas: the Tamaulipan thornscrub at Laredo, LANDFIRE's own, south-west of the Nueces.
  assert.ok(['chaparral', 'mesquite-savanna', 'thorn-riparian', 'floodplain'].includes(classAt(-99.45, 27.6)), 'the Texas bank at Laredo is the land\'s own');
  const none = LAND.findIndex(entry => entry.id === 'none');
  let holes = 0;
  const bounds = mapBounds();
  for (let r = 0; r < half.rows; r++) for (let c = 0; c < half.columns; c++) {
    const x = half.minX + (c + 0.5) * half.cellMiles, y = half.minY + (r + 0.5) * half.cellMiles;
    if (x < bounds.minX + 1 || x > bounds.maxX - 1 || y < bounds.minY + 1 || y > bounds.maxY - 1 || inBox({ x, y })) continue;
    if (half.cells[r * half.columns + c] === none) holes++;
  }
  assert.equal(holes, 0, 'no cell of the map outside the box is left undrawn');
});

test('the outside leaves the box to the box, but for the ring at its edge, whose classes are the box\'s', () => {
  const outsideGrids = decodeLand(outsideLand), boxGrids = decodeLand(landData().header);
  outsideGrids.forEach((grid, k) => {
    const own = boxGrids[k], cell = grid.cellMiles;
    const offsetColumn = Math.round((own.minX - grid.minX) / cell), offsetRow = Math.round((own.minY - grid.minY) / cell);
    // A cell is deep in the box when it and its eight neighbours lie wholly inside it.
    const whole = (c, r) => { const x0 = grid.minX + c * cell, y0 = grid.minY + r * cell; return x0 >= box.minX && y0 >= box.minY && x0 + cell <= box.maxX && y0 + cell <= box.maxY; };
    let ring = 0;
    for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.columns; c++) {
      const value = grid.cells[r * grid.columns + c];
      let deep = true;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (!whole(c + dc, r + dr)) deep = false;
      if (deep) { assert.equal(value, 0, `${cell}-mile cell ${c},${r} deep in the box is drawn from outside`); continue; }
      const oc = c - offsetColumn, or = r - offsetRow;
      const boxValue = oc >= 0 && or >= 0 && oc < own.columns && or < own.rows ? own.cells[or * own.columns + oc] : 0;
      if (boxValue) { assert.equal(value, boxValue, `${cell}-mile cell ${c},${r} on the box's edge is not the box's class`); ring++; }
    }
    assert.ok(ring > 0, `the ${cell}-mile band claims the box's edge`);
  });
  // Rivers inside the box are only the ones it does not draw itself.
  for (const river of outside.rivers.filter(r => r.from === 'box')) assert.ok(!province.rivers.some(r => r.name === river.name), `${river.name} is drawn twice inside the box`);
});

test('the rules outside are the box\'s own: on the box\'s heights they give the box\'s hillshade and relief', () => {
  const { header, heights } = terrain, { columns, rows, cell, noData } = header.grid;
  const metres = new Float32Array(columns * rows);
  for (let i = 0; i < metres.length; i++) metres[i] = heights[i] === noData ? 0 : heights[i] / 10;
  // The two-mile band's hillshade, from its blocks' mean heights, is the box's own, cell for cell.
  const band = landData().header.bands[1], block = Math.round(band.cell / cell);
  const mean = new Float32Array(band.columns * band.rows);
  for (let br = 0; br < band.rows; br++) for (let bc = 0; bc < band.columns; bc++) {
    let total = 0, n = 0;
    for (let r = br * block; r < Math.min(rows, (br + 1) * block); r++) for (let c = bc * block; c < Math.min(columns, (bc + 1) * block); c++) { total += metres[r * columns + c]; n++; }
    mean[br * band.columns + bc] = total / n;
  }
  assert.deepEqual(Buffer.from(bandShade(mean, band.columns, band.rows, band.cell, cell)).toString('base64'), band.shade, 'the hillshade rule is not the box\'s');
  // Relief away from rivers and the escarpment: the rise within the window and the slope give the box's class.
  const range = windowRange(metres, columns, rows), cells = landData().cells;
  const RELIEF = ['flat', 'rolling', 'hills', 'steep', 'bluff', 'escarpment'];
  let compared = 0;
  for (let r = 200; r < rows - 200; r += 37) for (let c = 200; c < columns - 200; c += 41) {
    const bits = landBitsOf(landData().header), i = r * columns + c, own = RELIEF[cells[i] >> bits], land = cells[i] & ((1 << bits) - 1);
    if (land <= 1 || own === 'bluff' || own === 'escarpment') continue;
    assert.equal(reliefKind(range[i], slopeAt(metres, columns, rows, c, r, cell)), own, `relief at ${c},${r}`);
    compared++;
  }
  assert.ok(compared > 1000, `only ${compared} cells compared`);
});

test('the page draws the outside in pieces that tile it with no seam, and each cell of the box\'s edge once', () => {
  const grids = decodeLand(outsideLand), boxGrids = decodeLand(landData().header);
  for (const grid of grids) {
    const pieces = tileGrid(grid);
    let covered = 0;
    for (const piece of pieces) {
      assert.ok(landUpscale(piece) >= 2, `a piece of the ${grid.cellMiles}-mile grid would be drawn unsmoothed`);
      const core = piece.core, cell = grid.cellMiles;
      covered += Math.round((core.maxX - core.minX) / cell) * Math.round((core.maxY - core.minY) / cell);
      // Its margin is its neighbours' cells, exactly: the smoothing near a piece's edge is the whole grid's.
      const c0 = Math.round((piece.minX - grid.minX) / cell), r0 = Math.round((piece.minY - grid.minY) / cell);
      if (pieces.length > 1) assert.ok(core.minX - piece.minX >= 3 * cell - 1e-9 || c0 === 0, 'a piece without its margin');
      for (let r = 0; r < piece.rows; r += 7) for (let c = 0; c < piece.columns; c += 5) assert.equal(piece.cells[r * piece.columns + c], grid.cells[(r0 + r) * grid.columns + c0 + c]);
    }
    // The pieces left out have nothing to draw; the cores of the rest never overlap.
    const cores = pieces.map(piece => piece.core);
    for (let i = 0; i < cores.length; i++) for (let j = i + 1; j < cores.length; j++) {
      const a = cores[i], b = cores[j];
      assert.ok(a.maxX <= b.minX + 1e-9 || b.maxX <= a.minX + 1e-9 || a.maxY <= b.minY + 1e-9 || b.maxY <= a.minY + 1e-9, 'two pieces draw the same ground');
    }
    assert.ok(covered <= grid.columns * grid.rows);
  }
  // The box's grids lose exactly the cells the outside draws: between them every cell with a class is drawn once.
  boxGrids.forEach((own, k) => {
    const grid = grids[k], kept = withoutClaims(own, grid);
    const offsetColumn = Math.round((own.minX - grid.minX) / own.cellMiles), offsetRow = Math.round((own.minY - grid.minY) / own.cellMiles);
    let lost = 0;
    for (let r = 0; r < own.rows; r++) for (let c = 0; c < own.columns; c++) {
      const i = r * own.columns + c, theirs = grid.cells[(r + offsetRow) * grid.columns + c + offsetColumn];
      if (!own.cells[i]) continue;
      assert.ok(Boolean(kept.cells[i]) !== Boolean(theirs), `${own.cellMiles}-mile cell ${c},${r} is drawn ${kept.cells[i] ? 'twice' : 'by nobody'}`);
      if (!kept.cells[i]) lost++;
    }
    assert.ok(lost > 0);
  });
});

test('the woods outside are drawn by the map\'s tiles, and the simulation never sees them', () => {
  // The Sabine's pine woods, east of the box.
  const sabine = at(-93.75, 31.0);
  assert.equal(standAt(sabine, { rule: 'landfire' }), 'none', 'the simulation reads woods past the box');
  assert.equal(patchAt(sabine, { rule: 'landfire' }).stand, 'none');
  assert.ok(['pine', 'longleaf', 'thicket', 'bottomland', 'creek', 'post-oak'].includes(outsideStandAt(sabine)), `the outside layer has ${outsideStandAt(sabine)} by the Sabine`);
  assert.equal(outsideStandAt(at(-97, 30)), 'none', 'inside the box the outside layer has no woods: the box\'s own are read');
  const world = createGonzalesWorld('outside-woods', 5, { map: 'colonies' });
  const shade = woodsTile(world, 'shade', Math.floor(sabine.x / 8), Math.floor(sabine.y / 8));
  assert.ok([...shade.cells].some(share => Number(share) > 0), 'the map\'s shade of timber stops at the box');
  const patches = woodsTile(world, 'patches', Math.floor(sabine.x), Math.floor(sabine.y));
  assert.ok(patches.cells.includes('t'), 'the map\'s patches stop at the box');
  // The outside woods grid is on the box's own lattice.
  const header = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/outside-woods.json.gz', import.meta.url))).toString('utf8'));
  const own = terrain.header.grid;
  assert.equal(header.grid.cell, own.cell);
  for (const axis of ['minX', 'minY']) assert.ok(Number.isInteger((own[axis] - header.grid[axis]) / own.cell), 'the outside woods are off the box\'s lattice');
});

test('the page lays the outside down only around the middle of the box, and that middle has nothing of the outside in it', () => {
  // Every cell of each outside grid within a cell of its empty middle (the softening reaches about a cell) is empty.
  for (const grid of decodeLand(outsideLand)) {
    const middle = emptyMiddle(grid, box), cell = grid.cellMiles;
    assert.ok(middle && middle.maxX - middle.minX > 150 && middle.maxY - middle.minY > 150, `the ${cell}-mile grid has an empty middle worth leaving out`);
    let checked = 0;
    for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.columns; c++) {
      const x0 = grid.minX + c * cell, y0 = grid.minY + r * cell;
      if (x0 + cell <= middle.minX - cell || x0 >= middle.maxX + cell || y0 + cell <= middle.minY - cell || y0 >= middle.maxY + cell) continue;
      assert.equal(grid.cells[r * grid.columns + c], 0, `${cell}-mile cell ${c},${r} in the empty middle has a class`);
      checked++;
    }
    assert.ok(checked > 100);
  }
  // Around a hole, the parts of a view never overlap, and with the hole they are the whole view.
  const area = r => (r.maxX - r.minX) * (r.maxY - r.minY);
  for (const [view, hole] of [
    [{ minX: 0, minY: 0, maxX: 100, maxY: 60 }, { minX: 20, minY: 10, maxX: 70, maxY: 40 }],
    [{ minX: 0, minY: 0, maxX: 100, maxY: 60 }, { minX: -20, minY: -10, maxX: 170, maxY: 40 }],
    [{ minX: 0, minY: 0, maxX: 100, maxY: 60 }, { minX: 30, minY: -10, maxX: 60, maxY: 90 }],
    [{ minX: 0, minY: 0, maxX: 100, maxY: 60 }, { minX: -10, minY: -10, maxX: 200, maxY: 200 }],
    [{ minX: 0, minY: 0, maxX: 100, maxY: 60 }, { minX: 120, minY: 10, maxX: 170, maxY: 40 }],
  ]) {
    const parts = aroundHole(view, hole);
    const cut = { minX: Math.max(view.minX, hole.minX), minY: Math.max(view.minY, hole.minY), maxX: Math.min(view.maxX, hole.maxX), maxY: Math.min(view.maxY, hole.maxY) };
    const inside = cut.maxX > cut.minX && cut.maxY > cut.minY ? area(cut) : 0;
    assert.equal(parts.reduce((sum, part) => sum + area(part), 0) + inside, area(view));
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j];
      assert.ok(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY, 'two parts overlap');
    }
  }
});
