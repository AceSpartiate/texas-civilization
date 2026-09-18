import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BEXAR_LAYOUT as layout, BEXAR_FRAME, ALAMO_FRONT, alamoOnMap, bexarToSite, riverDistance, alamoToBexar, bexarToAlamo} from '../public/bexar-layout.js';
import {coloniesMap} from '../sim/colonies-map.mjs';
import {milesFrom, realTerrain} from '../sim/terrain-data.mjs';
import {ALAMO_LAYOUT} from '../public/alamo-layout.js';

test('Béxar uses shipped art, distinct placements and the same foot-scale Alamo clear of the river',()=>{
  const frames=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))).frames;
  const placements=[...layout.buildings,...layout.props];
  assert.equal(new Set(placements.map(p=>p.id)).size,placements.length,'placement IDs must be unique');
  for(const p of placements)assert.ok(frames[p.sprite],`missing sprite ${p.sprite}`);
  assert.equal(layout.alamo.layout,ALAMO_LAYOUT,'reuse the authoritative compound geometry object');
  assert.equal(layout.units,ALAMO_LAYOUT.units);
  for(const wall of ALAMO_LAYOUT.walls){
    const a=alamoToBexar(wall.a),b=alamoToBexar(wall.b);
    assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(wall.a.x-wall.b.x,wall.a.y-wall.b.y))<1e-8,'compound feet must not be rescaled');
    const restored=bexarToAlamo(a);
    assert.ok(Math.hypot(restored.x-wall.a.x,restored.y-wall.a.y)<1e-8,'compound transform must be reversible');
  }
  for(const building of layout.buildings)assert.ok(riverDistance(building)>layout.river.widthFeet/2+50,`${building.id} intrudes into river corridor`);
});

// Laid on the map (2026-09-17, docs/MAP_ACCURACY.md §7): the owner sent the Nelson panorama again - the river looping round
// La Villita and the Potrero between the plazas and the Alamo - and the map's modern line through the town is the 1920s
// cut-off channel. The town is pinned by its plaza, turned so the Alamo lies on its true bearing, and the map's river through
// it is the reconstruction's own.
test('Béxar is laid on the map by its plaza, the Alamo on its true bearing, and the map draws its 1836 river through the town', () => {
  const map = coloniesMap(), site = map.places.bexar;
  const onMap = point => { const o = bexarToSite(point); return { x: site.x + o.x, y: site.y + o.y }; };
  const feet = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * 5280;
  // The Plaza de las Islas is Béxar's point (HIST-TEX-010), its centre and not a corner.
  const islas = layout.plazas.find(plaza => plaza.id === 'plaza-islas');
  assert.ok(feet(onMap({ x: islas.x + islas.width / 2, y: islas.y + islas.height / 2 }), site) < 1, 'the Plaza de las Islas is not on Béxar\'s point');
  assert.deepEqual(BEXAR_FRAME.anchor, { x: islas.x + islas.width / 2, y: islas.y + islas.height / 2 });
  // The church's front on the bearing from the plaza that 29.42583, -98.48611 has (HIST-TEX-085), to within a degree.
  const church = onMap(alamoToBexar({ x: 291, y: 393 })), real = milesFrom(realTerrain(), -98.48611, 29.42583);
  const bearing = p => Math.atan2(p.y - site.y, p.x - site.x) * 180 / Math.PI;
  assert.ok(Math.abs(bearing(church) - bearing(real)) < 1, `the Alamo is drawn ${bearing(church).toFixed(1)} degrees from east, not ${bearing(real).toFixed(1)}`);
  // The compound keeps its plan's compass on the map, turned back about the church's front: the north wall runs as drawn.
  const front = alamoOnMap(ALAMO_FRONT), fitted = bexarToSite(alamoToBexar(ALAMO_FRONT));
  assert.ok(Math.hypot(front.x - fitted.x, front.y - fitted.y) * 5280 < 0.01, 'turning the compound moved the church');
  for (const wall of ALAMO_LAYOUT.walls) {
    const a = alamoOnMap(wall.a), b = alamoOnMap(wall.b);
    assert.ok(Math.abs((b.x - a.x) * 5280 - (wall.b.x - wall.a.x)) < 0.01 && Math.abs((b.y - a.y) * 5280 - (wall.b.y - wall.a.y)) < 0.01, `${wall.id} is turned off its plan's compass`);
  }
  // ceiling: the panorama draws it short of its distance; held so the town is not stretched to meet it.
  assert.ok(feet(church, site) > 0.7 * feet(real, site) && feet(church, site) < feet(real, site), 'the Alamo is drawn further off than the panorama puts it');
  // The river the map draws is the reconstruction's river through the town: every bend of it within a rounding of the line.
  const river = map.watercourses.filter(course => course.name === 'San Antonio River');
  const segment = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1e-12; const s = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - s * dx, p.y - a.y - s * dy); };
  const fromRiver = p => Math.min(...river.flatMap(course => course.points.slice(1).map((q, i) => segment(p, course.points[i], q)))) * 5280;
  for (const bend of layout.river.points) assert.ok(fromRiver(onMap(bend)) < 40, `the map's river passes ${fromRiver(onMap(bend)).toFixed(0)} ft from the 1836 river at ${bend.x},${bend.y}`);
  // So no building of the town stands in the river the map draws, and the river runs between the plazas and the Alamo.
  for (const building of layout.buildings) assert.ok(fromRiver(onMap(building)) > layout.river.widthFeet / 2 + 40, `${building.id} stands ${fromRiver(onMap(building)).toFixed(0)} ft from the river the map draws`);
  const crossings = river.flatMap(course => course.points.slice(1).map((b, i) => [course.points[i], b])).filter(([a, b]) => {
    const d = (church.x - site.x) * (b.y - a.y) - (church.y - site.y) * (b.x - a.x); if (!d) return false;
    const s = ((a.x - site.x) * (b.y - a.y) - (a.y - site.y) * (b.x - a.x)) / d, u = ((a.x - site.x) * (church.y - site.y) - (a.y - site.y) * (church.x - site.x)) / d;
    return s >= 0 && s <= 1 && u >= 0 && u <= 1;
  }).length;
  assert.equal(crossings % 2, 1, 'the river the map draws is not between the Plaza de las Islas and the Alamo');
});
