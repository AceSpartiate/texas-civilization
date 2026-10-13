import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,MODULE_METADATA} from '../scripts/art-deliveries/house-construction-complete-2026-10-11.mjs';
import {drawHousePlot,roofSeat} from '../public/house-plot.js';
import {plotCatalogue} from '../sim/houseplot.mjs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),names=SHEETS['house-construction-complete'],catalogue=plotCatalogue();
test('all eight construction modules are complete, transparent and carry independent footprint/occlusion contracts',()=>{
 assert.equal(names.length,8);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));assert.deepEqual(f.footprintFeet,MODULE_METADATA[n].footprintFeet);assert.equal(f.occlusion.source,'sprite-alpha');assert.equal(f.rigid,true);}
 assert.notEqual(atlas.frames['house-puncheon-floor'],atlas.frames['house-half-loft']);
});
test('jacal construction selects posts, wattle, daub and independently seated thatch at every turn',()=>{
 const ctx={save(){},restore(){},fillRect(){},strokeRect(){}},frame=n=>atlas.frames[n]||null;
 for(const rotation of [0,90,180,270])for(const [stage,progress,expected] of [[1,0,'house-jacal-posts'],[1,.5,'house-jacal-wattle'],[2,0,'house-jacal-daub-walls'],[3,0,'house-jacal-daub-walls']]){
  const calls=[];drawHousePlot(ctx,400,300,110,{house:{pieces:[['pen-jacal',3,2,stage,progress]]}},catalogue,(_c,name,...args)=>{calls.push({name,args});return 100;},frame,{rotation});
  assert.equal(calls[0].name,expected);assert.equal(calls.some(c=>c.name==='house-jacal-thatch-roof'),stage===3);
  if(stage===3){const roof=calls.find(c=>c.name==='house-jacal-thatch-roof');assert.ok(roof.args[2]>0);assert.ok(roof.args[3].anchor.every(Number.isFinite));}
 }
 const walls=frame('house-jacal-daub-walls'),roof=frame('house-jacal-thatch-roof');assert.ok(walls.ground);
 assert.equal(walls.roofScale,walls.w/roof.w*1.06);assert.ok(roofSeat(walls,roof,0,0,110));
});
test('shed frame replaces unfinished lean-to; unavailable construction sprites retain whole-house fallback',()=>{
 const ctx={save(){},restore(){},fillRect(){},strokeRect(){}},frame=n=>atlas.frames[n]||null,calls=[];
 drawHousePlot(ctx,400,300,110,{house:{pieces:[['shed',3,2,1,0]]}},catalogue,(_c,n)=>{calls.push(n);return 100;},frame);
 assert.ok(calls.includes('house-shed-frame'));
 const missing=[];drawHousePlot(ctx,400,300,110,{house:{pieces:[['pen-jacal',3,2,3,0]]}},catalogue,(_c,n)=>{missing.push(n);return n.startsWith('house-jacal-')?0:100;},frame);
 assert.ok(missing.includes('house-jacal')); // legacy whole-house illustration remains usable
});

