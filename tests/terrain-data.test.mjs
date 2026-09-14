// The real terrain asset: docs/LAND_GRANTS.md §8, build step 1.
//
// The grid and the watercourses are checked against places whose height and water are published,
// so a broken build (a wrong projection, a flipped row order, a lost tile) cannot pass for the land.
import test from 'node:test';
import assert from 'node:assert/strict';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';

const terrain = realTerrain();

test('the grid stands at the heights published for the towns of 1835, across the whole area', () => {
  // Published elevations (USGS GNIS / the towns' own figures), in metres. A cell is the mean of about
  // forty samples over an eighth of a mile, so a town on a slope may sit some metres off its benchmark.
  for (const [place, lon, lat, metres, slack] of [
    ['Gonzales', -97.4525, 29.5016, 89, 8],
    ['San Antonio (Bexar)', -98.4936, 29.4241, 198, 15],
    ['Goliad', -97.3886, 28.6683, 50, 10],
    ['Victoria', -97.0036, 28.8053, 29, 10],
    ['Bastrop', -97.3153, 30.1105, 114, 12],
    ['Austin', -97.7431, 30.2672, 149, 20],
    ['Columbus', -96.5372, 29.7055, 62, 10],
    ['Nacogdoches', -94.6555, 31.6035, 85, 15],
    ['Seguin', -97.9647, 29.5688, 158, 10],
  ]) {
    const { x, y } = milesFrom(terrain, lon, lat);
    const height = terrain.heightAt(x, y);
    assert.ok(Math.abs(height - metres) <= slack, `${place}: ${height.toFixed(1)} m on the grid, ${metres} m published`);
  }
});

test('the land falls toward the coast, and the Gulf is not land', () => {
  const inland = terrain.heightAt(...Object.values(milesFrom(terrain, -97.5, 31.8)));
  const coast = terrain.heightAt(...Object.values(milesFrom(terrain, -95.9, 28.9)));
  assert.ok(inland > coast + 100, `inland ${inland} m, coast ${coast} m`);
  assert.ok(Number.isNaN(terrain.heightAt(...Object.values(milesFrom(terrain, -94.5, 28.3)))), 'open Gulf has no height');
});

test('the origin is where the San Marcos meets the Guadalupe, and Gonzales stands just north-east of it', () => {
  const near = (name, point) => terrain.courses.filter(course => course.name === name)
    .some(course => course.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 0.1));
  const origin = { x: 0, y: 0 };
  assert.ok(near('Guadalupe River', origin) && near('San Marcos River', origin), 'both rivers pass through the origin');
  const town = milesFrom(terrain, -97.4525, 29.5016);
  assert.ok(town.x > 0.5 && town.x < 2 && town.y < 0 && town.y > -1.5, `Gonzales at ${town.x.toFixed(2)}, ${town.y.toFixed(2)}`);
});

test('the rivers of the colonies are there by name, and what the present built is not', () => {
  const names = new Set(terrain.courses.map(course => course.name));
  for (const river of ['Guadalupe River', 'San Marcos River', 'Colorado River', 'Brazos River', 'Lavaca River', 'San Antonio River', 'Trinity River', 'Navasota River', 'Peach Creek', 'Sandies Creek', 'Kerr Creek', 'Plum Creek']) {
    assert.ok(names.has(river), `${river} is in the data`);
  }
  assert.ok(terrain.courses.every(course => ['perennial', 'intermittent', 'ephemeral', 'unknown'].includes(course.flow)));
  assert.ok(![...names].some(name => /canal|ditch|pipeline/i.test(name ?? '')), 'no canal, ditch or pipeline');
  // The Guadalupe runs downhill: its bed near Seguin stands well above its bed near Victoria.
  const bed = (lon, lat) => { const p = milesFrom(terrain, lon, lat); return terrain.heightAt(p.x, p.y); };
  assert.ok(bed(-97.96, 29.56) > bed(-97.0, 28.80) + 60);
});
