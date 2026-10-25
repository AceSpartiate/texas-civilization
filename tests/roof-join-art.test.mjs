import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitRoofJoin,roofJoinClip} from '../public/house-roof-art.js';
import {roofSeat,drawHousePlot} from '../public/house-plot.js';
import {plotCatalogue} from '../sim/houseplot.mjs';
const atlas=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json',import.meta.url))),clips=JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json',import.meta.url))).clips;
const names=['house-roof-join','house-roof-join-partial','house-roof-join-chimney'];
test('all three rigid join states retain pixels, alpha and explicit ridge registration',()=>{
 assert.ok(atlas.sheets['house-roof-joins'].alpha.transparentFraction>.4);
 for(const n of names){const f=atlas.frames[n];assert.equal(f.audit.trimmedPixels,0);assert.equal(f.audit.retainedFraction,1);assert.ok(f.ridge.every(([x,y])=>x>=0&&x<f.w&&y>=0&&y<f.h));assert.equal(clips[n].motion,'none');assert.equal(clips[n].authored,false);assert.equal(clips[n].loop,false);}
 for(const n of ['house-hewn-roof-finished','house-round-roof-partial'])assert.equal(atlas.frames[n].ridge.length,2);
});
test('join ridge endpoints fit pen ridge exactly when upright or mirrored',()=>{
 for(const refName of ['house-hewn-roof-finished','house-round-roof-partial'])for(const n of names)for(const flip of [false,true]){
  const ref=atlas.frames[refName],join=atlas.frames[n],seat=roofSeat(atlas.frames['house-round-full-walls'],ref,500,400,100,flip),fit=fitRoofJoin(ref,join,seat,flip);
  const screen=(f,s,[x,y])=>[s.x+(flip?-1:1)*(x-s.anchor[0]*f.w)*s.height/(f.logicalHeight||f.h)*(s.widthScale||1),s.y+(y-s.anchor[1]*f.h)*s.height/(f.logicalHeight||f.h)];
  for(let i=0;i<2;i++){const a=screen(ref,seat,ref.ridge[i]),b=screen(join,fit,join.ridge[i]);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);}
 }
 assert.equal(fitRoofJoin(null,null,null),null);
});
// The finished double chimney is Astra's own since 2026-10-25 (batch W: its measured `centre`); it was the stick chimney drawn tall.
test('completed saddlebag draws chimney aperture before chimney and missing art retains roof fallback',()=>{
 const catalogue=plotCatalogue(),plan=catalogue.plans.find(p=>p.id==='saddlebag');
 // Catalogue plans expose placed-piece tuples; build a complete projection using its own piece stage counts.
 const pieces=plan.pieces.map(p=>{const [type,x,y]=p;return [type,x,y,catalogue.pieces.find(k=>k.id===type).stageCount,0];});
 const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});
 for(const rotation of [0,90,180,270]){const calls=[];drawHousePlot(ctx,400,400,120,{house:{pieces}},catalogue,(c,n)=>{calls.push(n);return 1;},n=>atlas.frames[n],{rotation});assert.ok(calls.includes('house-roof-join-chimney'));assert.ok(calls.indexOf('house-roof-join-chimney')<calls.indexOf('house-chimney-double'));}
 const dog=catalogue.plans.find(p=>p.id==='dog-run'),dogPieces=dog.pieces.map(([t,x,y])=>[t,x,y,catalogue.pieces.find(k=>k.id===t).stageCount,0]),calls=[];
 drawHousePlot(ctx,400,400,120,{house:{pieces:dogPieces}},catalogue,(c,n)=>{calls.push(n);return n.startsWith('house-roof-join')?0:1;},n=>atlas.frames[n],{});
 assert.ok(calls.includes('house-roof-join'));assert.ok(calls.filter(n=>n==='house-hewn-roof-finished').length>=3);
});
test('join clipping preserves overlap while trimming exposed short-end framing',()=>{
 const ref=atlas.frames['house-hewn-roof-finished'],join=atlas.frames['house-roof-join'];
 for(const flip of [false,true])for(const fraction of [.9,.65]){
  const seat=fitRoofJoin(ref,join,roofSeat(atlas.frames['house-round-full-walls'],ref,500,400,100,flip),flip),polygon=roofJoinClip(join,seat,flip,fraction),[a,b]=join.ridge,scale=seat.height/join.h;
  const dx=(b[0]-a[0])*scale*seat.widthScale*(flip?-1:1),dy=(b[1]-a[1])*scale,length=Math.hypot(dx,dy);
  for(const [x,y] of polygon)assert.ok(Math.abs(Math.abs(((x-seat.x)*dx+(y-seat.y)*dy)/length)-length*fraction/2)<1e-8);
 }
});
