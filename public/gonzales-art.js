import {drawSprite} from '/art.js';
import {drawStreets} from '/landscape-art.js';
import {queueTownLabel} from '/town-art.js';
// Reconstructed scenery, in miles relative to the existing town. These are not
// new buildings in the simulation or assertions of an attested street survey.
const homes=[[-.265,-.21],[-.21,-.24],[-.10,-.23],[.02,-.25],[.13,-.22],[.25,-.19],[.32,-.10],
[-.34,-.09],[-.29,.04],[-.34,.16],[-.24,.25],[-.12,.29],[.02,.30],[.17,.28],[.29,.22],[.34,.09],
[-.25,-.15],[-.07,-.15],[.06,-.16],[.23,-.10],[-.25,.14],[.29,.15],[.19,.21],[-.12,.22]];
/**
 * How many times its `height` a Gonzales building is drawn (owner, 2026-10-27: the town buildings were drawn about as tall as
 * the people in them). 2.2 puts a house of .023 at .0506 of a mile, 2.66 people of `PERSON_MILES`: as tall as a twenty-two
 * foot log house in the towns of the colonies (sim/town-layouts.mjs `townDrawnHeight`), whose lots are drawn wider than
 * surveyed for it. Gonzales needs no spreading: its invented lots were always a tenth of a mile apart, and the town's scenes
 * (sim/town-scenes.mjs), its residents' rounds and its keepers stand where they always did. Only the house the blacksmith's
 * shed stood behind moved, from x -.30, so the shed and the scene at it are not hidden. tests/town-lots.test.mjs holds it.
 */
export const GONZALES_TALL=2.2;
export const GONZALES_BUILDINGS=[
  {id:'gonzales-store-art',sprite:'trading-house',x:-.16,y:-.13,height:.027,label:'General store'},
  {id:'gonzales-iron-art',sprite:'shed-open',x:.18,y:.05,height:.024,label:'Ironworker’s yard'},
  ...homes.map(([x,y],i)=>({id:`gonzales-house-art-${i}`,sprite:['house-round-log','cabin-weathered','house-hewn-log','cabin-small','house-dog-run','shed-open'][i%6],x,y,height:i%6===4?.030:.023})),
  ...[[-.31,-.25],[.29,-.24],[-.32,.10],[.32,.27]].map(([x,y],i)=>({id:`gonzales-outbuilding-art-${i}`,sprite:i%2?'storehouse':'shed-open',x,y,height:.018})),
];
export const GONZALES_PROPS=[[-.19,-.115,'barrel',.006],[-.135,-.115,'sacks',.006],[.16,.065,'crate',.007],[.205,.065,'alamo-firewood',.006],[-.303,-.17,'fence-rail',.010],[.26,.24,'fence-rail',.010],[-.274,.191,'oak-broad',.029],[.27,-.14,'pecan',.032],[-.07,.255,'oak-spreading',.031],[.114,-.279,'oak-broad',.026]];
export const GONZALES_ART_BOUNDS={left:-.38,right:.38,top:-.30,bottom:.34};
export function drawGonzalesGround(ctx,project,scale){
  const paths=[[[-.38,-.02],[-.22,-.025],[-.07,0],[.08,.015],[.24,-.02],[.38,-.06]],
    [[-.18,-.28],[-.205,-.125],[-.10,-.015],[-.04,.10],[.015,.20],[.02,.33]],
    [[.18,-.23],[.20,-.10],[.22,.05],[.24,.15],[.27,.29]]];
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.fillStyle='#b6a47e';ctx.globalAlpha=.5;
  for(const b of GONZALES_BUILDINGS){const p=project(b),h=b.height*GONZALES_TALL*scale;ctx.beginPath();ctx.ellipse(p.x,p.y-h*.025,h*.64,h*.16,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  // The painted street tile at fifty feet a tile, pinned to the town's point (public/ground-texture.js).
  drawStreets(ctx,paths.map(path=>({points:path.map(([x,y])=>project({x,y})),width:Math.max(1,.009*scale)})),{tile:Math.max(32,scale/5280*50),anchor:project({x:0,y:0})});
  ctx.restore();
}
// `labels` names the buildings the town's shopkeepers keep, by building id, from the map's own shops (sim/shops.mjs):
// a shop is one of these drawn buildings, never a new one set down on top of the town. Its names are written over the town
// with the other towns' (public/town-art.js `queueTownLabel`), a keeper's trade west of the door the keeper stands at.
export function gonzalesDrawables(ctx,project,scale,labels={}){
  const items=GONZALES_BUILDINGS.map(b=>{const p=project(b),label=labels[b.id]||b.label;return {y:p.y,draw:()=>{drawSprite(ctx,b.sprite,p.x,p.y,b.height*GONZALES_TALL*scale);if(label&&scale>1000)queueTownLabel(label,p.x,p.y,scale,Boolean(labels[b.id]));}};});
  for(const [x,y,sprite,height] of GONZALES_PROPS){const p=project({x,y});items.push({y:p.y,draw:()=>drawSprite(ctx,sprite,p.x,p.y,height*scale)});}
  return items;
}
