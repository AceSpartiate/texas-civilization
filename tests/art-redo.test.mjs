import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
const height=id=>atlas.frames[id].audit.sourceBounds[3];
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
test('R2 Lamar and Joe remain the same size when stopping',()=>{
 for(const id of ['lamar','joe']) {
  const walk=median([1,2,3,4].map(n=>height(id==='joe'?`joe-walk-${n}`:`lamar-walk-e-${n}`)));
  for(const pose of id==='joe'?['idle','speak-1','speak-2']:['idle','command','salute','saber-low','reach','withdraw-signal','listen','rest']){
   const ratio=height(`${id}-${pose}`)/walk;
   assert.ok(ratio>=(pose==='idle'?.98:.95)&&ratio<=1.05,`${id}-${pose}: ${ratio}`);
  }
 }
});
test('R3 Grant gallop has no trimmed pixels or neighboring silhouettes',()=>{
 const sheet=atlas.sheets['famous-grant-gallop'];
 for(const n of [1,2,3,4]) {
  const f=atlas.frames[`grant-mounted-gallop-e-${n}`], [x,y,w,h]=f.audit.sourceBounds;
  assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);
  const left=(f.column-1)*sheet.width/2,right=left+sheet.width/2;
  assert.ok(x-left>=24&&right-x-w>=24,`frame ${n} clear gutters`);
 }
});
test('R1 replacement service icons retain transparent readable silhouettes and IDs',()=>{
 for(const id of ['icon-enlist-regular','icon-enlist-auxiliary','icon-camp-drill']) {
  const f=atlas.frames[id];assert.equal(f.sheet,'icons-family-service');
  assert.ok(f.audit.visiblePixels>1000);assert.equal(f.audit.trimmedPixels,0);
 }
 assert.ok(atlas.sheets['icons-family-service'].alpha.cornerAlpha.every(a=>a<24));
});
