import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(new URL(`../public/assets/frontier-v1/${n}.json`,import.meta.url)));
test('four timber states retain complete silhouettes and true transparency',()=>{const atlas=read('atlas');assert.ok(atlas.sheets['timber-felled'].alpha.transparentFraction>.4);for(const name of ['timber-felled-e','timber-felled-n','timber-trimmed-e','timber-stack']){const f=atlas.frames[name];assert.equal(f.sheet,'timber-felled');assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}});
test('rigid timber has held poses without synthetic swaying or breathing',()=>{const animation=read('animation');for(const name of ['timber-felled-e','timber-felled-n','timber-trimmed-e','timber-stack']){const clip=animation.clips[name];assert.equal(clip.frames.length,1);assert.equal(clip.frames[0].sprite,name);assert.equal(clip.motion,'none');assert.equal(clip.loop,false);}});
