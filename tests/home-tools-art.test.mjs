import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INTERIOR_ART} from '../sim/interior-data.mjs';

test('all five wagon tools use retained production artwork rather than stand-ins',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 const tools=['hoe','axe','broadaxe','froe','auger'];
 const names=new Set();
 for(const tool of tools){
  const [name,size]=INTERIOR_ART[`tool:${tool}`],frame=atlas.frames[name];
  names.add(name);assert.ok(frame,tool);assert.equal(frame.sheet,'home-tools');
  assert.ok(size>0);assert.ok(frame.audit.visiblePixels>0);assert.equal(frame.audit.trimmedPixels,0);assert.equal(frame.audit.retainedFraction,1);
 }
 assert.equal(names.size,5);assert.ok(atlas.sheets['home-tools'].alpha.transparentFraction>.35);
 assert.ok(atlas.frames['home-froe-club']);
});
