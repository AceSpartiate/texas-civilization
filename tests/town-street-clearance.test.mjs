import test from 'node:test';
import assert from 'node:assert/strict';
import {TOWN_LAYOUTS} from '../sim/town-layouts.mjs';
test('town building ground anchors do not stand inside built street carriageways',()=>{
 let checked=0;
 for(const [id,town] of Object.entries(TOWN_LAYOUTS)) for(const building of town.buildings) {
  if(building.onWater||/ferry|landing|rock|pecan/.test(building.id))continue;
  for(const street of town.streets.filter(s=>!s.faint))for(let i=1;i<street.points.length;i++){
   const a=street.points[i-1],b=street.points[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
   const at=length?Math.max(0,Math.min(1,((building.x-a.x)*dx+(building.y-a.y)*dy)/length)):0;
   const distance=Math.hypot(building.x-a.x-at*dx,building.y-a.y-at*dy);
   assert.ok(distance>=street.width/2,`${id}/${building.id} stands ${distance.toFixed(1)}ft from ${street.name}'s centre, inside its ${street.width}ft carriageway`);checked++;
  }
 }
 assert.ok(checked>100);
});
