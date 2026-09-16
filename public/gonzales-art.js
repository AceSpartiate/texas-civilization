import {drawSprite} from '/art.js';
import {drawRoad} from '/landscape-art.js';
// Reconstructed scenery, in miles relative to the existing town. These are not
// new buildings in the simulation or assertions of an attested street survey.
const homes=[[-.30,-.21],[-.21,-.24],[-.10,-.23],[.02,-.25],[.13,-.22],[.25,-.19],[.32,-.10],
[-.34,-.09],[-.29,.04],[-.34,.16],[-.24,.25],[-.12,.29],[.02,.30],[.17,.28],[.29,.22],[.34,.09],
[-.25,-.15],[-.07,-.15],[.06,-.16],[.23,-.10],[-.25,.14],[.29,.15],[.19,.21],[-.12,.22]];
export const GONZALES_BUILDINGS=[
  {id:'gonzales-store-art',sprite:'trading-house',x:-.16,y:-.13,height:.027,label:'General store'},
  {id:'gonzales-iron-art',sprite:'shed-open',x:.18,y:.05,height:.024,label:'Ironworker’s yard'},
  ...homes.map(([x,y],i)=>({id:`gonzales-house-art-${i}`,sprite:['house-round-log','cabin-weathered','house-hewn-log','cabin-small','house-dog-run','shed-open'][i%6],x,y,height:i%6===4?.030:.023})),
  ...[[-.31,-.25],[.29,-.24],[-.32,.10],[.32,.27]].map(([x,y],i)=>({id:`gonzales-outbuilding-art-${i}`,sprite:i%2?'storehouse':'shed-open',x,y,height:.018})),
];
const props=[[-.19,-.115,'barrel',.006],[-.135,-.115,'sacks',.006],[.16,.065,'crate',.007],[.205,.065,'alamo-firewood',.006],[-.28,-.18,'fence-rail',.010],[.26,.24,'fence-rail',.010],[-.27,.20,'oak-broad',.029],[.27,-.14,'pecan',.032],[-.07,.255,'oak-spreading',.031],[.12,-.265,'oak-broad',.026]];
export const GONZALES_ART_BOUNDS={left:-.38,right:.38,top:-.30,bottom:.34};
export function drawGonzalesGround(ctx,project,scale){
  const paths=[[[-.38,-.02],[-.22,-.025],[-.07,0],[.08,.015],[.24,-.02],[.38,-.06]],
    [[-.18,-.28],[-.16,-.13],[-.10,-.015],[-.04,.10],[.015,.20],[.02,.33]],
    [[.18,-.23],[.20,-.10],[.18,.05],[.24,.15],[.27,.29]]];
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.fillStyle='#b6a47e';ctx.globalAlpha=.5;
  for(const b of GONZALES_BUILDINGS){const p=project(b),h=b.height*scale;ctx.beginPath();ctx.ellipse(p.x,p.y-h*.025,h*.64,h*.16,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  for(const path of paths)drawRoad(ctx,path.map(([x,y])=>project({x,y})),Math.max(1,.009*scale));
  ctx.restore();
}
// `labels` names the buildings the town's shopkeepers keep, by building id, from the map's own shops (sim/shops.mjs):
// a shop is one of these drawn buildings, never a new one set down on top of the town.
export function gonzalesDrawables(ctx,project,scale,labels={}){
  const items=GONZALES_BUILDINGS.map(b=>{const p=project(b),label=labels[b.id]||b.label;return {y:p.y,draw:()=>{drawSprite(ctx,b.sprite,p.x,p.y,b.height*scale);if(label&&scale>1000){ctx.save();ctx.font='12px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#f2e6c9';ctx.strokeText(label,p.x,p.y+16);ctx.fillStyle='#4c422e';ctx.fillText(label,p.x,p.y+16);ctx.restore();}}};});
  for(const [x,y,sprite,height] of props){const p=project({x,y});items.push({y:p.y,draw:()=>drawSprite(ctx,sprite,p.x,p.y,height*scale)});}
  return items;
}
