import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS,ANIMATION_CLIPS} from '../scripts/art-deliveries/alamo-complete-2026-10-12.mjs';
import {createAlamoGrade,drawAlamoGrade,alamoGunName,alamoLancerClip,travisFireClip} from '../public/alamo-battle-art.js';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const animation=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url)));
test('all Alamo art frames survive extraction and retain constant animation scale',()=>{
 assert.equal(Object.values(SHEETS).flat().length,76);assert.equal(Object.keys(ANIMATION_CLIPS).length,21);
 for(const n of Object.values(SHEETS).flat()){const f=atlas.frames[n];assert.ok(f,n);assert.equal(f.audit.retainedFraction,1,n);assert.equal(f.audit.trimmedPixels,0,n);assert.ok(atlas.sheets[f.sheet].alpha.cornerAlpha.every(a=>a<=2));}
 for(const [n,c]of Object.entries(ANIMATION_CLIPS)){assert.deepEqual(animation.clips[n].frames,c.frames);assert.equal(new Set(c.frames.map(f=>atlas.frames[f.sprite].logicalHeight)).size,1,n);assert.equal(c.authored,true);}
});
test('Alamo selectors limit lancers/guns to explicit staged identities and keep cardinal Travis unmirrored',()=>{
 assert.equal(alamoGunName('north-gun',false),'cannon-alamo-north-w');assert.equal(alamoGunName('church-guns'),'cannon-alamo-church-e');assert.equal(alamoGunName('eighteen'),null);
 assert.equal(alamoLancerClip({id:'alamo'},{side:'mexican',key:'g:lancers-east',facing:{x:0,y:-1}},true),'lancer-upright-march-n');
 assert.equal(alamoLancerClip({id:'alamo'},{side:'mexican',key:'g:lancers-south',facing:{x:-1,y:0}},false),'lancer-upright-idle-e');
 assert.equal(alamoLancerClip({id:'gonzales'},{side:'mexican',key:'g:lancers-east'},true),null);assert.equal(alamoLancerClip({id:'alamo'},{side:'mexican',key:'g:other-cavalry'},true),null);
 for(const d of ['east','west','north','south'])assert.ok(animation.clips[travisFireClip(d)]);
});
test('night/dawn grade remains continuous through retargeting, including the return to daylight',()=>{
 const grade=createAlamoGrade();assert.equal(grade.update(1,0),1);assert.equal(grade.update(.4,100),1);const dim=grade.sample(900);assert.ok(dim>.4&&dim<1);assert.equal(grade.update(0,900),dim);assert.equal(grade.sample(2700),0);
 const fills=[],ctx={save(){},restore(){},fillRect(...rect){fills.push({color:this.fillStyle,rect});}};
 drawAlamoGrade(ctx,.5,{width:100,height:80});assert.equal(fills.length,2);assert.match(fills[0].color,/0\.3100/);assert.match(fills[1].color,/214,155,94/);drawAlamoGrade(ctx,0,{width:100,height:80});assert.equal(fills.length,2);
});
