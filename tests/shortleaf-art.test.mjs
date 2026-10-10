import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KINDS} from '../sim/woods.mjs';
import {galePose} from '../public/weather-art.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('shortleaf owns distinct size and stump art without changing forestry yields',()=>{assert.equal(KINDS.shortleaf.picture,'pine-shortleaf');assert.equal(KINDS.shortleaf.stump,'stump-pine-shortleaf');assert.equal(KINDS.shortleaf.sized,true);assert.deepEqual(KINDS.shortleaf.logs,[2,3,3]);assert.equal(KINDS.shortleaf.fell,.8);assert.equal(KINDS.shortleaf.use,'wall');});
test('all twelve shortleaf frames retain their pixels and gale selectors resolve three authored loops',()=>{
 const atlas=read('atlas'),animation=read('animation');assert.ok(atlas.sheets['trees-shortleaf'].alpha.transparentFraction>.4);
 for(const size of ['pole','log','large']){const name=`pine-shortleaf-${size}`;assert.equal(galePose(name,{norther:1,wind:{x:0,y:1}}),`${name}-gale-1`);assert.equal(galePose(name,{norther:0,wind:{x:0,y:1}}),null);const clip=animation.clips[`${name}-gale`];assert.equal(clip.frames.length,2);assert.equal(clip.loop,true);for(const id of [name,...clip.frames.map(f=>f.sprite),size==='large'?'stump-pine-shortleaf':`stump-pine-shortleaf-${size}`]){const f=atlas.frames[id];assert.equal(f.sheet,'trees-shortleaf');assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}}
});
