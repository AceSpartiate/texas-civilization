import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {galePose} from '../public/weather-art.js';
const read=name=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${name}.json`,import.meta.url)));
test('all three basic ground covers select retained production gale poses only in hard northers',()=>{
 const atlas=read('atlas'),animation=read('animation');
 for(const name of ['scrub','reeds','prickly-pear']){
  assert.equal(galePose(name,{norther:1,wind:{x:0,y:1}}),`${name}-gale-1`);
  assert.equal(galePose(name,{norther:.4,wind:{x:0,y:.4}}),null);
  assert.equal(galePose(name,{norther:0,wind:{x:0,y:1}}),null);
  const clip=animation.clips[`${name}-gale`];assert.equal(clip.frames.length,2);
  assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,2);
  for(const {sprite} of clip.frames){const frame=atlas.frames[sprite];assert.equal(frame.sheet,'norther-ground');assert.equal(frame.audit.trimmedPixels,0);assert.equal(frame.audit.retainedFraction,1);assert.ok(frame.audit.visiblePixels>0);}
 }
 assert.ok(atlas.sheets['norther-ground'].alpha.transparentFraction>.4);
});
