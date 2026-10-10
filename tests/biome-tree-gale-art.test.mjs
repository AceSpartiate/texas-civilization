import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {galePose} from '../public/weather-art.js';
import {SHEETS} from '../scripts/art-deliveries/biome-trees-fields.mjs';
const read=name=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${name}.json`,import.meta.url)));
test('all thirteen biome-tree sizes select retained production gale poses only in hard northers',()=>{
 const atlas=read('atlas'),animation=read('animation');
 for(const name of ['pine-longleaf-pole', 'palm-sabal-pole', 'cypress-bald-pole', 'pine-longleaf-log', 'palm-sabal-log', 'cypress-bald-log', 'pine-longleaf-large', 'palm-sabal-large', 'cypress-bald-large', 'magnolia-log', 'beech-log', 'magnolia-large', 'beech-large']){
  assert.equal(galePose(name,{norther:1,wind:{x:0,y:1}}),`${name}-gale-1`);
  assert.equal(galePose(name,{norther:.4,wind:{x:0,y:.4}}),null);
  assert.equal(galePose(name,{norther:0,wind:{x:0,y:1}}),null);
  const clip=animation.clips[`${name}-gale`];assert.equal(clip.frames.length,2);
  assert.equal(new Set(clip.frames.map(f=>f.sprite)).size,2);
  for(const {sprite} of clip.frames){const frame=atlas.frames[sprite];assert.equal(frame.sheet,name.startsWith('cypress')?'biome-cypress-gale':name.startsWith('pine')||name.startsWith('palm')?'biome-pine-palm-gale':'biome-broadleaf-gale');assert.equal(frame.audit.trimmedPixels,0);assert.equal(frame.audit.retainedFraction,1);assert.ok(frame.audit.visiblePixels>0);}
 }
 for(const sheet of ['biome-cypress-gale','biome-pine-palm-gale','biome-broadleaf-gale'])assert.ok(atlas.sheets[sheet].alpha.transparentFraction>.4);
 const standing=SHEETS['biome-trees-fields'].filter(name=>!name.startsWith('field-'));
 assert.equal(standing.length,13);
 for(const name of standing)assert.ok(atlas.frames[galePose(name,{norther:1,wind:{x:0,y:1}})],`${name} has production gale art`);

});
