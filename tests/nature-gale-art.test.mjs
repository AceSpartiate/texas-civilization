import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawWeatherTree,galePose} from '../public/weather-art.js';
const hard={norther:1,wind:{x:0,y:1}},fair={norther:0,wind:{x:0,y:0}};
test('generic trees take their painted gale without double shear, preserving rooted draw coordinates',()=>{
 for(const tree of ['cottonwood','sapling']){const calls=[];assert.equal(drawWeatherTree({},tree,30,90,140,hard,(...args)=>{calls.push(args);return 1;}),true);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1),[`${tree}-gale-1`,30,90,140]);assert.equal(galePose(tree,fair),null);}
});
test('missing gale sheet falls back to the same tree and normal wind lean; calm never asks for the gale',()=>{
 for(const tree of ['cottonwood','sapling']){const calls=[];assert.equal(drawWeatherTree({},tree,30,90,140,hard,(...args)=>{calls.push(args);return args[1]===tree?1:0;}),true);assert.equal(calls.length,2);assert.equal(calls[1][1],tree);assert.ok(Math.abs(calls[1][5].lean)>.1);const calm=[];assert.equal(drawWeatherTree({},tree,30,90,140,fair,(...args)=>{calm.push(args);return 1;}),true);assert.equal(calm.length,1);assert.equal(calm[0][1],tree);assert.equal(calm[0][5].lean,0);}
 assert.equal(drawWeatherTree({},'sapling',0,0,100,hard,()=>0),false);
});
test('four complete alpha silhouettes and two authored loops are delivered',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),clips=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url))).clips;
 assert.deepEqual(atlas.sheets['nature-gales'].alpha.cornerAlpha,[0,0,0,0]);
 for(const tree of ['cottonwood','sapling']){const clip=clips[`${tree}-gale`];assert.equal(clip.authored,true);assert.equal(clip.loop,true);assert.equal(clip.motion,'none');assert.equal(clip.frames.length,2);for(const frame of clip.frames){const f=atlas.frames[frame.sprite];assert.equal(f.sheet,'nature-gales');assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>1200);}}
});
