import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/concepcion-complete-2026-10-12.mjs';
import {CONCEPCION} from '../sim/battles/concepcion.mjs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all thirty-one final Concepcion frames retain complete transparent silhouettes',()=>{
 const names=Object.values(SHEETS).flat();assert.equal(names.length,31);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1);assert.equal(f.audit.trimmedPixels,0);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
});
test('all seven authored loops have four registered phases and stable display scale',()=>{
 assert.equal(Object.keys(ANIMATION_CLIPS).length,7);
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.equal(c.authored,true);assert.equal(c.loop,true);assert.equal(c.frames.length,4);assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1);}
});
test('live scenery replaces bank and mission placeholders while retaining geographic course and unloaded-art fallbacks',()=>{
 const ground={bend:{x:0,y:0},mission:{x:1,y:2}},items=CONCEPCION.scenery(ground);
 const banks=items.filter(i=>i.sprite==='riverbank-cut-e');assert.equal(banks.length,9);assert.ok(banks.every(i=>i.fallbackSprite==='earth-rampart'));
 const mission=items.find(i=>i.sprite==='mission-concepcion');assert.deepEqual([mission.x,mission.y,mission.size],[1,2,4.5]);assert.equal(mission.fallbackSprite,'church-generic');
 assert.equal(items.filter(i=>i.water).length,1);assert.equal(items.find(i=>i.water).water.length,5);
 // Whole-bend illustration and transport actors need future authoritative scene registration.
 assert.ok(items.every(i=>!String(i.clip||'').startsWith('casualty-cart')&&!String(i.clip||'').startsWith('limber-mules')));
});

