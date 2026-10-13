import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOWN_LAYOUTS} from '../sim/town-layouts.mjs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/town-landmarks-2026-10-11.mjs';
test('three researched landmarks replace stand-ins with complete transparent crops',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 for(const sprites of Object.values(SHEETS)) for(const sprite of sprites){
  const f=atlas.frames[sprite];assert.ok(f,sprite);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);
  // Smoke has a one-byte alpha rounding residue at two corners (1/255); no visible opaque background.
  assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=1));
 }
 for(const [town,id,sprite,x,y] of [['velasco','vel-fort-stockade','town-fort-velasco-1835',-420,-180],['harrisburg','hbg-mill','town-harrisburg-steam-mill-1835',620,-500],['nacogdoches','nac-stone-house','town-nacogdoches-stone-house-1835',-60,-60]]){
  const b=TOWN_LAYOUTS[town].buildings.find(b=>b.id===id);assert.deepEqual([b.sprite,b.x,b.y],[sprite,x,y]);
 }
 assert.equal(TOWN_LAYOUTS.velasco.buildings.find(b=>b.id==='vel-fort-stockade').drawWidthFeet,90);
 assert.ok(TOWN_LAYOUTS.velasco.buildings.some(b=>b.id==='vel-fort-gun'&&b.sprite==='cannon-iron-e'));
 assert.ok(!TOWN_LAYOUTS.velasco.walls.some(w=>w.name==='Fort Velasco'));
 assert.ok(!TOWN_LAYOUTS.harrisburg.buildings.some(b=>['hbg-mill-boiler','hbg-mill-logs'].includes(b.id)));
});
test('mill smoke has four distinct registered authored phases',()=>{
 const c=ANIMATION_CLIPS['town-mill-smoke'];assert.equal(c.authored,true);assert.equal(c.loop,true);
 assert.equal(new Set(c.frames.map(f=>f.sprite)).size,4);assert.equal(c.frames.reduce((n,f)=>n+f.duration,0),1400);
 const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
 assert.deepEqual(animation.clips['town-mill-smoke'].frames,c.frames);
});
