import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BEXAR_LAYOUT} from '../public/bexar-layout.js';
test('both civic landmarks use delivered art without moving the existing town placements',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 for(const [id,sprite,x,y,height,fallback] of [['san-fernando','bexar-san-fernando-1836',1150,2020,105,'chapel'],['governors-palace','bexar-governors-palace-1836',650,1980,80,'adobe-flat']]){
  const b=BEXAR_LAYOUT.buildings.find(b=>b.id===id);assert.equal(b.sprite,sprite);assert.deepEqual([b.x,b.y,b.heightFeet],[x,y,height]);assert.equal(b.fallbackSprite,fallback);assert.ok(atlas.frames[fallback]);const f=atlas.frames[sprite];assert.ok(f);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>10000);assert.deepEqual(atlas.sheets[f.sheet].alpha.cornerAlpha,[0,0,0,0]);
 }
});
