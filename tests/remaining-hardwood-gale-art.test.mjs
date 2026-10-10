import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {galePose} from '../public/weather-art.js';
import {SHEETS} from '../scripts/art-deliveries/trees-colonies-2.mjs';
const read=name=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${name}.json`,import.meta.url)));
test('all nine hardwood sizes select retained production gale poses only in hard northers',()=>{
 const atlas=read('atlas'),animation=read('animation');
 for(const name of ['pecan-pole', 'hackberry-pole', 'sweetgum-pole', 'pecan-log', 'hackberry-log', 'sweetgum-log', 'pecan-large', 'hackberry-large', 'sweetgum-large']){
  assert.equal(galePose(name,{norther:1,wind:{x:0,y:1}}),`${name}-gale-1`);
  assert.equal(galePose(name,{norther:.4,wind:{x:0,y:.4}}),null);
  assert.equal(galePose(name,{norther:0,wind:{x:0,y:1}}),null);
  const clip=animation.clips[`${name}-gale`];assert.equal(clip.frames.length,2);
  assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,2);
  for(const {sprite} of clip.frames){const frame=atlas.frames[sprite];assert.equal(frame.sheet,name.startsWith('sweetgum')?'sweetgum-gale':'pecan-hackberry-gale');assert.equal(frame.audit.trimmedPixels,0);assert.equal(frame.audit.retainedFraction,1);assert.ok(frame.audit.visiblePixels>0);}
 }
 for(const sheet of ['sweetgum-gale','pecan-hackberry-gale'])assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.4);
 const standing=SHEETS['trees-colonies-2'].filter(name=>!name.startsWith('log-'));
 assert.equal(standing.length,15);
 for(const name of standing)assert.ok(atlas.frames[galePose(name,{norther:1,wind:{x:0,y:1}})],`${name} has production gale art`);

});
