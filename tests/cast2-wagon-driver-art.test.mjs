import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRIVING_FIGURES,seatedClip,seatFigure} from '../public/motion.js';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('all second-cast wagon drivers have four authored heading loops with retained frames',()=>{
 const atlas=read('atlas'),animation=read('animation');
 for(const who of ['rust-woman','indigo','ochre','blue-girl']){assert.ok(DRIVING_FIGURES.includes(who));for(const dir of ['s','e','w','n']){const clip=animation.clips[`${who}-wagon-driver-${dir}`];assert.equal(clip.frames.length,2);assert.equal(clip.loop,true);assert.equal(clip.authored,true);for(const {sprite} of clip.frames){const f=atlas.frames[sprite];assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.audit.visiblePixels>0);}}}
});
test('actual family seat chooser selects complete seated layers for all four second-cast identities',()=>{
 const found=new Map();for(const sex of ['male','female'])for(const band of ['adult','youth'])for(const principal of [true,false])for(let n=0;n<100;n++){const entity={id:`hh-${n}-${sex}`,kind:'person',sex,band,principal};const figure=seatFigure(entity);if(['rust-woman','indigo','ochre','blue-girl'].includes(figure))found.set(figure,entity);}
 assert.equal(found.size,4);for(const [figure,entity] of found)for(const dir of ['s','e','w','n'])assert.deepEqual(seatedClip(entity,dir,'wagon'),{id:`${figure}-wagon-driver-${dir}`,upright:true,seated:true});
 // The children are not given a layer of hers: Claude's child drivers stand in (public/motion.js CLAUDE_DRIVING_FIGURES,
 // held by tests/riding.test.mjs), and the baby, carried, has none.
 for(const band of ['child','small','infant'])assert.ok(!DRIVING_FIGURES.includes(seatFigure({id:'child',kind:'person',sex:'female',band})));
 assert.ok(!seatedClip({id:'child',kind:'person',band:'infant'},'s','wagon').seated);
});
