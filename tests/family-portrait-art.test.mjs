import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {drawPortrait} from '../public/family-panel.js';
const figures=['rust','teal','elder','blue','rust-woman','indigo','ochre','blue-girl','girl','boy','smallchild','infant'];
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
test('all twelve standard portraits are complete measured silhouettes and their old sources are retired',()=>{
 assert.deepEqual(Object.entries(atlas.frames).filter(([,f])=>f.sheet==='family-portraits').map(([n])=>n),figures.map(f=>`portrait-${f}`));
 assert.deepEqual(atlas.sheets['family-portraits'].alpha.cornerAlpha,[0,0,0,0]);
 for(const figure of figures){const f=atlas.frames[`portrait-${figure}`];assert.ok(f.w>=192&&f.h>=192);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(!existsSync(new URL(`../public/assets/claude-standins/svg/claude-portrait-${figure}.svg`,import.meta.url)));}
});
test('the production panel fits every portrait at both delivered UI sizes without idle fallback',()=>{
 for(const size of [44,56,192])for(const figure of figures){let painted=false;const ctx={clearRect(){},fillRect(){}};
  assert.equal(drawPortrait({width:size,getContext:()=>ctx},{figure},{spriteFrame:n=>atlas.frames[n],drawClip(){throw Error('unwanted idle fallback');},drawSprite(ctx,name,x,y,height){const f=atlas.frames[name],scale=height/(f.logicalHeight||f.h);assert.ok(f.w*scale<=size+.00001);assert.ok(f.h*scale<=size+.00001);assert.ok(Number.isFinite(x)&&Number.isFinite(y));painted=true;return true;}}),true);assert.ok(painted);
 }
});
test('missing portrait still draws the actual figure instead of a different identity',()=>{
 let clip;assert.equal(drawPortrait({width:56,getContext:()=>({clearRect(){},fillRect(){}})},{figure:'other',clip:'other-idle-s',band:'adult'},{spriteFrame:()=>null,drawClip(ctx,id){clip=id;return true;}}),true);assert.equal(clip,'other-idle-s');
});
