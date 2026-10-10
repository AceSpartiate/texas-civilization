import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS} from '../scripts/art-deliveries/lesson-marks-2026-10-07.mjs';
test('the complete guided-start art group has four retained transparent marks',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.deepEqual(SHEETS['lesson-marks'],['lesson-point','lesson-ring','lesson-pip','lesson-pip-done']);
 assert.ok(a.sheets['lesson-marks'].alpha.transparentFraction>.25);
 for(const id of SHEETS['lesson-marks']){const f=a.frames[id];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
});
