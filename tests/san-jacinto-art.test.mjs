import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS,CAMP_GROUPS,RELOAD_DURATIONS} from '../scripts/art-deliveries/san-jacinto-complete-2026-10-12.mjs';
import {avatarVariant,PARENT_VARIANTS,familyCampBinding} from '../public/avatar-identity.js';
import {mountedReloadClip} from '../public/southern-battle-art.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('complete San Jacinto refinement inventory has 136 usable frames without alpha clipping',()=>{
 const names=Object.values(SHEETS).flat().filter(Boolean);assert.equal(names.length,136);assert.equal(Object.keys(ANIMATION_CLIPS).length,50);
 for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1,n);assert.equal(c.authored,true);}
});
test('every offered parent head and every age retains a healthy camp identity',()=>{
 const cast=Object.values(CAMP_GROUPS).flat().filter(Boolean);assert.equal(new Set(cast).size,22);
 for(const [sex,heads]of Object.entries(PARENT_VARIANTS))for(const head of Object.keys(heads))for(const sleep of [false,true]){
  const e={sex,band:'adult',appearance:{head}},p=familyCampBinding(e,{sleep,timeMs:150});assert.equal(p.clip,`${avatarVariant(e.appearance,sex,e)}-rig-camp-${sleep?'sleep':'rest'}`);assert.ok(animation.clips[p.clip]);assert.equal(p.timeMs,150);assert.equal(p.camp,true);
 }
 for(const band of ['youth','child','small','infant'])for(const sex of ['female','male']){const e={band,sex,appearance:{head:'beard'}},p=familyCampBinding(e,{sleep:true});assert.ok(animation.clips[p.clip]);assert.ok(!p.clip.startsWith('father'));}
 assert.equal(familyCampBinding({}, {sleep:true}).clip,'volunteer-sleep');
});
test('mounted full reload is a non-looping eight-step sequence with fixed pacing and independent headings',()=>{
 assert.equal(RELOAD_DURATIONS.reduce((a,b)=>a+b),8000);
 for(const kind of ['rider','dragoon'])for(const d of ['e','w','n','s']){const n=mountedReloadClip(kind,d),c=animation.clips[n];assert.ok(c,n);assert.equal(c.frames.length,8);assert.equal(c.loop,false);assert.deepEqual(c.frames.map(f=>f.duration),RELOAD_DURATIONS);}
 assert.equal(mountedReloadClip('lancer','n'),null);
});
