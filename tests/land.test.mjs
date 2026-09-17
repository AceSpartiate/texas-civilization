// What kind of land each part of the colonies is: docs/MAP_ACCURACY.md §5, FIC-GONZ-057.
//
// Checked where the country is known: the Lost Pines at Bastrop, the coastal prairie round Harrisburg and Lynchburg, the
// brush country south-west of Béxar, the hill country and its escarpment north-west of San Antonio, the bluff at La Grange,
// the beach and marsh of Galveston Island. And the bands: each coarser band is its cells' most common class, so a place
// keeps its class from one zoom to the next.
import test from 'node:test';
import assert from 'node:assert/strict';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { LAND, LAND_BANDS, RELIEF, landAt, landBand, landData } from '../sim/land.mjs';
import { provinceBands } from '../sim/province.mjs';

const terrain = realTerrain();
const at = (lon, lat) => milesFrom(terrain, lon, lat);
/** Shares of each land and relief class within `miles` of a point, from the eighth-of-a-mile grid. */
function around(lon, lat, miles) {
  const p = at(lon, lat), land = {}, relief = {};
  let n = 0;
  for (let dx = -miles; dx <= miles; dx += 0.125) for (let dy = -miles; dy <= miles; dy += 0.125) {
    if (dx * dx + dy * dy > miles * miles) continue;
    const here = landAt(p.x + dx, p.y + dy);
    land[here.land] = (land[here.land] || 0) + 1; relief[here.relief] = (relief[here.relief] || 0) + 1; n++;
  }
  const share = counts => new Proxy(counts, { get: (target, key) => (target[key] || 0) / n });
  return { land: share(land), relief: share(relief) };
}

test('the Lost Pines stand east of Mina, and the coast round Harrisburg and Lynchburg is prairie', () => {
  // LANDFIRE 13580/13710 pine at Bastrop; EPA 33e Bastrop Lost Pines (docs/evidence/woods-data.json).
  const pines = around(-97.25, 30.12, 3);
  assert.ok(pines.land.pine > 0.5, `the Lost Pines are ${(100 * pines.land.pine).toFixed(0)} in 100 pine`);
  for (const [name, lon, lat] of [['Harrisburg', -95.2785, 29.7228], ['Lynchburg', -95.074, 29.769]]) {
    const coast = around(lon, lat, 3);
    assert.ok(coast.land.prairie + coast.land.marsh > 0.7, `${name}: ${(100 * (coast.land.prairie + coast.land.marsh)).toFixed(0)} in 100 prairie and marsh`);
    assert.ok(coast.relief.flat > 0.75, `${name} is flat`);
    assert.equal(coast.land.pine, 0, `${name} has no pine woods`);
  }
});

test('south-west of Béxar is brush country, and there is no desert anywhere in the colonies', () => {
  // LANDFIRE's Tamaulipan thornscrub and mesquite settings; EPA 31c Texas-Tamaulipan Thornscrub.
  const brush = around(-98.8, 29.2, 2);
  assert.ok(brush.land.brush > 0.5, `south-west of Béxar is ${(100 * brush.land.brush).toFixed(0)} in 100 brush`);
  assert.ok(around(-98.49, 29.42, 2).land.brush < 0.05, 'Béxar itself is not in the brush');
  assert.ok(!LAND.some(entry => /desert/i.test(`${entry.id} ${entry.name}`)), 'no class of land is desert');
});

test('north-west of San Antonio the hill country rises at the escarpment; Béxar is on the plain below it; La Grange has its bluff', () => {
  const hills = around(-98.69, 29.60, 3), bexar = around(-98.49, 29.42, 2);
  assert.ok(hills.land['hill-country'] > 0.8, 'Helotes is hill country');
  assert.ok(hills.relief.escarpment + hills.relief.steep + hills.relief.hills > 0.8, 'the hill country is hills');
  assert.ok(hills.relief.escarpment > 0.2, 'the escarpment is there');
  assert.ok(bexar.relief.flat + bexar.relief.rolling > 0.9, 'Béxar is on flat or rolling ground');
  // EPA's line runs between them.
  const line = landData().header.escarpment, from = at(-98.49, 29.42), to = at(-98.69, 29.60);
  let crossings = 0;
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  for (let i = 2; i < line.length; i += 2) {
    const c = { x: line[i - 2] / 100, y: line[i - 1] / 100 }, d = { x: line[i] / 100, y: line[i + 1] / 100 };
    if (side(from, to, c) !== side(from, to, d) && side(c, d, from) !== side(c, d, to)) crossings++;
  }
  assert.equal(crossings % 2, 1, 'the escarpment line is not between Béxar and the hill country');
  // Monument Hill above the Colorado at La Grange.
  assert.ok(around(-96.88, 29.89, 0.5).relief.bluff > 0.25, 'the bluff at La Grange');
});

test('Galveston Island is beach on the Gulf side and marsh behind; the bays are water', () => {
  const island = around(-94.95, 29.20, 2);
  assert.ok(island.land.sand > 0.1, `the island's beach is ${(100 * island.land.sand).toFixed(0)} in 100`);
  assert.ok(island.land.marsh > 0.05, 'marsh behind the beach');
  const bay = landAt(at(-94.85, 29.55).x, at(-94.85, 29.55).y);
  assert.equal(bay.land, 'water', 'Galveston Bay is water');
  assert.equal(around(-97.45, 29.50, 3).land.sand, 0, 'no beach inland');
});

test('each band is the most common class of its cells, so a place keeps its class as the map zooms out', () => {
  const { header, cells } = landData();
  const native = header.native;
  assert.deepEqual(header.land.map(entry => entry.id), LAND.map(entry => entry.id));
  assert.deepEqual(header.relief.map(entry => entry.id), RELIEF.map(entry => entry.id));
  LAND_BANDS.forEach((miles, index) => {
    const band = landBand(index);
    assert.equal(band.cell, miles);
    const block = Math.round(miles / native.cell);
    // Sampled blocks: a band cell is its block's most common land class (off the map only if all of it is).
    for (let k = 0; k < 400; k++) {
      const bc = (k * 7919) % band.columns, br = (k * 104729) % band.rows;
      const votes = new Map();
      for (let r = br * block; r < Math.min(native.rows, (br + 1) * block); r++) for (let c = bc * block; c < Math.min(native.columns, (bc + 1) * block); c++) {
        const v = cells[r * native.columns + c] & 15;
        votes.set(v, (votes.get(v) || 0) + 1);
      }
      const ranked = [...votes].filter(([v]) => v !== 0).sort((a, b) => b[1] - a[1]);
      const cell = band.classes[br * band.columns + bc] & 15;
      if (!ranked.length) { assert.equal(cell, 0); continue; }
      assert.equal(votes.get(cell), ranked[0][1], `band ${miles} cell ${bc},${br} is not its block's most common class`);
    }
  });
  // The province's outlines are drawn from the same classes: the pines at Bastrop are inside its forest outline.
  const forest = provinceBands().woods.covers.find(cover => cover.id === 'forest');
  const p = at(-97.25, 30.12);
  const inside = ring => { let hit = false; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) { const xi = ring[i] / 100, yi = ring[i + 1] / 100, xj = ring[j] / 100, yj = ring[j + 1] / 100; if ((yi > p.y) !== (yj > p.y) && p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi) hit = !hit; } return hit; };
  for (let band = 1; band < forest.levels.length; band++) {
    assert.equal(forest.levels[band].filter(inside).length % 2, 1, `the Lost Pines are not inside the forest outline at band ${band}`);
  }
});
