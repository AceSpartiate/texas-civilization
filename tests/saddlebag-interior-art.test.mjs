import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INTERIORS} from '../sim/interior-data.mjs';
test('saddlebag uses its own retained transparent interior, central hearths and saved spot IDs',()=>{
 const a=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),room=INTERIORS.saddlebag;
 assert.equal(room.sprite,'interior-saddlebag');const f=a.frames[room.sprite];assert.ok(f.audit.visiblePixels>0);assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(a.sheets[room.sprite].alpha.transparentFraction>.25);
 assert.deepEqual(room.spots.map(s=>s[0]),['west-hearth','west-window','west-back','west-middle','west-door','east-hearth','east-window','east-back','east-middle','east-door']);
 assert.equal(room.spots[0][2],.42);assert.equal(room.spots[5][2],.58);assert.ok(room.spots.every(s=>s[2]>0&&s[2]<1&&s[3]>0&&s[3]<1));
 assert.equal(INTERIORS['dog-run'].sprite,'interior-dog-run');
});
