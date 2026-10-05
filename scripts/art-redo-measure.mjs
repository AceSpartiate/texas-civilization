import {writeFileSync} from 'node:fs';
import {SHEETS,buildManifest} from './build-atlas-manifest.mjs';
const wanted=['icons-family-service','famous-lamar','joe-poses','famous-grant-gallop'];
for(const id of Object.keys(SHEETS)) if(!wanted.includes(id)) delete SHEETS[id];
const atlas=buildManifest();
const height=id=>atlas.frames[id].audit.sourceBounds[3];
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
const ratios=Object.fromEntries(['lamar','joe'].map(id=>{
 const walk=median([1,2,3,4].map(n=>height(id==='joe'?`joe-walk-${n}`:`lamar-walk-e-${n}`)));
 return [id,{walk,idle:height(`${id}-idle`),ratio:height(`${id}-idle`)/walk}];
}));
writeFileSync('docs/evidence/art-redo-after.json',JSON.stringify({...atlas,ratios},null,2));
console.log(JSON.stringify({ratios,grant:[1,2,3,4].map(n=>atlas.frames[`grant-mounted-gallop-e-${n}`].audit)},null,2));
