import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,FRAME_ALIASES,ANIMATION_CLIPS,IDENTITIES} from '../scripts/art-deliveries/family-rig-complete-2026-10-13.mjs';
import {semanticMaterial,tintSemanticFrame} from '../public/semantic-rig.js';
import {SKIN_COLOURS,HAIR_COLOURS,CLOTHING_COLOURS} from '../public/looks-art.js';
import {familyRigBattlePose,familyRigCanFire,familyRigSeat} from '../public/family-rig-bindings.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all 632 painted components retain every pixel, clear corners and explicit sockets',()=>{
 assert.equal(Object.keys(SHEETS).length,45);assert.equal(Object.values(SHEETS).flat().length,632);
 for(const [sheet,names]of Object.entries(SHEETS))for(const n of names){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(f.socketPixels>=8,n);assert.ok(atlas.sheets[sheet].alpha.cornerAlpha.every(a=>a<=2),sheet);}
});
test('every identity has aligned age/sex components and distinct living/dead transport',()=>{
 assert.equal(Object.keys(IDENTITIES).length,22);
 for(const [id,body]of Object.entries(IDENTITIES)){
  for(const pose of ['idle-s','wounded-1','camp-rest-1','camp-sleep-1','covered-1']){const f=atlas.frames[id+'-rig-'+pose];assert.equal(f.rig.body,body);assert.equal(f.rig.identity,id);assert.ok(f.rig.head.startsWith('rig-head-'+id+'-'));}
  for(const kind of ['living','dead']){const f=atlas.frames[id+'-rig-carry-'+kind+'-1'];assert.equal(f.compound.kind,kind);assert.ok(f.compound.patient.includes(kind==='living'?'wounded':'covered'));}
  assert.equal(Boolean(animation.clips[id+'-rig-fire-reload']),familyRigCanFire(id));
 }
 for(const [id,a]of Object.entries(FRAME_ALIASES)){const f=atlas.frames[id];assert.ok(f,id);assert.equal(f.x,atlas.frames[a.source].x);assert.equal(f.w,atlas.frames[a.source].w);}
});
test('all 792 clips have stable phase scales and combat retains the 2470ms discharge contract',()=>{
 assert.equal(Object.keys(ANIMATION_CLIPS).length,792);
 for(const [id,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[id].frames,c.frames,id);assert.equal(new Set(c.frames.map(p=>atlas.frames[p.sprite].logicalHeight)).size,1,id);if(id.includes('fire')){assert.equal(c.loop,false);assert.deepEqual(c.frames.map(p=>p.duration),[700,120,750,900]);}}
});
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
test('every offered pigment colours only its semantic material; linen and socket remain independent',()=>{
 for(const [material,colours,pixel]of [['skin',SKIN_COLOURS,[255,0,0]],['hair',HAIR_COLOURS,[0,0,255]],['clothing',CLOTHING_COLOURS,[0,255,0]]])for(const [name,colour]of Object.entries(colours)){
  const d={data:new Uint8ClampedArray([...pixel,123,0,255,255,255,210,195,165,255])};tintSemanticFrame(d,{[material]:name});assert.deepEqual([...d.data.slice(0,3)],rgb(colour));assert.equal(d.data[3],123);assert.equal(d.data[7],0);assert.equal(semanticMaterial(210,195,165),'ink');assert.ok(d.data[8]>d.data[9]&&d.data[9]>d.data[10]);
 }
 const baby={data:new Uint8ClampedArray([200,200,200,255])};tintSemanticFrame(baby,{clothing:'indigo'},{neutralClothing:true});assert.ok(baby.data[2]>baby.data[0]);
});
test('battle mapping preserves timing, fate precedence and age limits without inventing transport',()=>{
 const firing={clip:'volunteer-fire-reload',timeMs:700,flip:true};assert.deepEqual(familyRigBattlePose('mother-braid',firing),{...firing,clip:'mother-braid-rig-fire-reload',rig:true});
 assert.equal(familyRigBattlePose('boy',firing).clip,'boy-rig-idle-e');
 assert.equal(familyRigBattlePose('father-beard',{sprite:'volunteer-injured'},{fate:'killed'}).sprite,'father-beard-rig-fall');
 assert.equal(familyRigBattlePose('father-beard',{sprite:'volunteer-reclining'}).sprite,'father-beard-rig-still');
 assert.equal(familyRigBattlePose('girl',{sprite:'volunteer-injured'},{grade:'serious'}).clip,'girl-rig-wounded');
 assert.equal(familyRigBattlePose('girl',{sprite:'volunteer-injured'},{grade:'serious',carried:true}).clip,'girl-rig-carry-living');
 assert.equal(familyRigBattlePose('girl',{sprite:'volunteer-injured'},{grade:'slight',carried:true}).clip,'girl-rig-wounded');
 assert.equal(familyRigBattlePose('unknown',firing),firing);assert.equal(familyRigSeat('infant','e'),null);assert.equal(familyRigSeat('smallchild','e','horse'),null);
 assert.equal(familyRigSeat('mother-braid','n','horse').id,'mother-braid-rig-saddle-n');
 const ride={clip:'volunteer-ride-e',timeMs:900,flip:true};
 const shot=familyRigBattlePose('father-beard',ride,{firing:true,heading:'n',fireTime:700});assert.equal(shot.clip,'father-beard-rig-mounted-fire-n');assert.equal(shot.timeMs,700);assert.equal(shot.flip,false);
 assert.equal(familyRigBattlePose('father-beard',ride,{firing:true,moving:true}).clip,'father-beard-rig-saddle-e');
});
