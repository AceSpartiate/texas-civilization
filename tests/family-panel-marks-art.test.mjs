import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEETS} from '../scripts/art-deliveries/family-panel-marks-2026-10-07.mjs';
test('all six requested panel marks are production frames with full transparent silhouettes',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url)));
 assert.deepEqual(SHEETS['family-panel-marks'],['mark-need','mark-need-rider','mark-main','mark-idle','mark-auto-off','mark-auto-on']);
 assert.ok(a.sheets['family-panel-marks'].alpha.transparentFraction>.25);assert.ok(a.sheets['family-panel-marks'].alpha.cornerAlpha.every(v=>v<24));
 for(const id of SHEETS['family-panel-marks']){const f=a.frames[id];assert.equal(f.sheet,'family-panel-marks');assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);}
});
