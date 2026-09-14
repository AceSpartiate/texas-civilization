import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BEXAR_LAYOUT as layout, riverDistance, alamoToBexar, bexarToAlamo} from '../public/bexar-layout.js';
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
