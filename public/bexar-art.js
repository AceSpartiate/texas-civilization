import {drawSprite,spriteFrame} from '/art.js';
import {drawRoad,drawWater} from '/landscape-art.js';
import {DRAWN_HEIGHT} from '/town-layouts.js';
import {BEXAR_LAYOUT as town,alamoToBexar} from '/bexar-layout.js';
import {alamoMassing} from '/alamo-layout.js';
import {ALAMO_FACES,STOREYS,blockFace,openingFace,wallFace} from '/alamo-faces.js';

const corners=r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
function polygon(ctx,points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
// Shared scenery renderer: no people, hidden events, clock or second simulation.
export function drawBexarGround(ctx,project,pixelsPerFoot,{river=true}={}){
  if(river)drawWater(ctx,town.river.points.map(project),Math.max(1,town.river.widthFeet*pixelsPerFoot));
  for(const road of town.roads)drawRoad(ctx,road.points.map(project),Math.max(1,road.widthFeet*pixelsPerFoot));
  for(const plaza of town.plazas)polygon(ctx,corners(plaza).map(project),'#ccb985','#a59063');
}

/*
 * The Alamo compound in the game's building style (2026-09-18, docs/ALAMO_LAYOUT.md "On the map"). Owner: "bring the Alamo
 * complex into the same art style as the rest of the game. ensure it matches the dimensions of the historical building."
 *
 * Every footprint is the plan's, in true feet (public/alamo-layout.js `alamoMassing`, HIST-TEX-090 to -092): the map is
 * plan-true, so a building stands on the ground it covered. What is drawn as the towns draw it:
 * - **Height** is its true height times `DRAWN_HEIGHT`, the factor every town building is drawn at (sim/town-layouts.mjs),
 *   so the church's 22½ ft walls stand as tall as San Fernando's sprite beside the plaza.
 * - **Walls and faces** carry Astra's own straight-on south elevations (public/alamo-faces.js, delivered 2026-09-21) and the palisade
 *   its stakes (`alamo-palisade`), laid on each face at the art's own proportion - not stretched - once the
 *   faces are big enough to show it. A wall is drawn as the solid it is: its top, the face turned to the camera and the end
 *   turned to it, so a wall running north and south stands as a column of stone and not a floating line.
 * - **Roofs** are the flat, parapeted terrado roofs the adobe and stone sprites have, in their colours; the rooms of a range
 *   are seamed across one roof; the long barrack's second storey and the gate through the low barrack show.
 * - Dark outlines and a soft ground shadow, as the sprites have; from a county away, flat colour and no texture, as a sprite
 *   is a blob at that distance.
 *
 * ceiling: the camera looks north, so a face turned west or east is edge on: the church's carved front faces west and is not
 * seen - its south side is. A camera that could turn, or the front as a sign beside the church, would show it.
 */
const PALETTE={face:'#ccb489',cap:'#e4d6b1',roof:'#d9c8a0',roofWell:'#c9b58c',seam:'#ad9870',line:'#4b3a26',door:'#3b2c1e',viga:'#6b4a2c',
  shadow:'rgba(56,40,20,.26)',endFace:'#b9a179',timber:'#7c5c3a',timberCap:'#9b7b52',plaza:'#ccb985',plazaEdge:'#a59063',pen:'#b9a171',church:'#b8a177'};
// Each art's painted face, as fractions of its frame: the part of it laid on a wall face. **Which** of Astra's five
// south-facing elevations goes on what is public/alamo-faces.js and is held by tests/alamo-faces.test.mjs; this file only
// lays it. A strip delivered for this is its whole frame; the palisade module, painted as a sprite, has a gutter to cut.
const FACE_UV={[ALAMO_FACES.palisade]:{u:[.04,.96],v:[.03,.9]}};
const face=sprite=>({sprite,...(FACE_UV[sprite]||{u:[0,1],v:[0,1]})});
// What of the compound's painted surfaces was actually laid on the canvas this pass, for the proofs (`__alamoDrawn.faces`).
// A sprite only gets in here when drawSprite returned a width, so a sheet that failed to load cannot put its name in it.
const facesDrawn=new Set();
const TEXTURED=.12; // pixels a foot: about 630 a mile. Nearer than this a face shows its stones.
const MASSING=alamoMassing(town.alamo.layout);
// The art laid along a face from `a` to `b` (on the screen, at the ground), `rise` pixels high, one copy of the art after
// another - or, with `once`, a single copy stretched over the whole run, which is what one gate passage wants.
function faceArt(ctx,art,a,b,rise,once=false){
  const frame=spriteFrame(art.sprite),length=Math.hypot(b.x-a.x,b.y-a.y);if(!frame||rise<3||length<2)return;
  const u0=art.u[0]*frame.w,u1=art.u[1]*frame.w,v0=art.v[0]*frame.h,v1=art.v[1]*frame.h,piece=once?length:rise*(u1-u0)/(v1-v0);
  for(let s=0;s<length;s+=piece){
    const f=s/length,g=Math.min(1,(s+piece)/length),e=(s+piece)/length,S={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},G={x:a.x+(b.x-a.x)*g,y:a.y+(b.y-a.y)*g},E={x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e};
    ctx.save();ctx.beginPath();ctx.moveTo(S.x,S.y);ctx.lineTo(G.x,G.y);ctx.lineTo(G.x,G.y-rise);ctx.lineTo(S.x,S.y-rise);ctx.closePath();ctx.clip();
    const ax=(E.x-S.x)/(u1-u0),ay=(E.y-S.y)/(u1-u0),dv=rise/(v1-v0);
    ctx.transform(ax,ay,0,dv,S.x-ax*u0,S.y-rise-ay*u0-dv*v0);
    if(drawSprite(ctx,art.sprite,0,0,frame.logicalHeight||frame.h,{anchor:[0,0]}))facesDrawn.add(art.sprite);ctx.restore();
  }
}
const lift=(p,r)=>({x:p.x,y:p.y-r});
// The gate strip, one copy at its own proportion, centred between `a` and `b` along the face that runs `sw` to `se`.
function gateArt(ctx,a,b,sw,se,rise){
  const frame=spriteFrame(openingFace());if(!frame)return;
  const dx=se.x-sw.x,dy=se.y-sw.y,run=Math.hypot(dx,dy);if(run<2)return;
  const half=rise*(frame.w/frame.h)/2,ux=dx/run,uy=dy/run,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
  faceArt(ctx,face(openingFace()),{x:cx-ux*half,y:cy-uy*half},{x:cx+ux*half,y:cy+uy*half},rise,true);
}
function drawBlock(ctx,block,convert,ppf){
  const r=block.height*DRAWN_HEIGHT*ppf,close=ppf>=TEXTURED,line=ppf>.5?1.4:1;
  const nw=convert({x:block.x0,y:block.y0}),ne=convert({x:block.x1,y:block.y0}),se=convert({x:block.x1,y:block.y1}),sw=convert({x:block.x0,y:block.y1});
  const shadow={x:r*.22,y:r*.05};polygon(ctx,[sw,se,ne,nw].map(p=>({x:p.x+shadow.x,y:p.y+shadow.y})),PALETTE.shadow);
  // The south face, the one the camera sees, with the gate through it.
  polygon(ctx,[sw,se,lift(se,r),lift(sw,r)],PALETTE.face);
  if(close)faceArt(ctx,face(blockFace(block)),sw,se,r);
  for(const o of block.openings){const a=convert({x:o.x0,y:block.y1}),b=convert({x:o.x1,y:block.y1});
    polygon(ctx,[a,b,lift(b,r*.72),lift(a,r*.72)],PALETTE.door,PALETTE.line,line);
    // One gate passage, centred on the opening the layout gives and drawn at the strip's own proportion, so the painted
    // way through lines up with the way through. The dark opening stays under it and is what shows without the sheet.
    // ceiling: the strip carries a little wall either side of its passage, so it covers a few feet of the room front on
    // each hand. A passage cut to the opening's own width would need the art's own opening measured out of its pixels.
    if(close)gateArt(ctx,a,b,sw,se,r);}
  // Beam ends under the parapet, as the adobe and stone sprites have them; a storey more shows a second row.
  if(close&&r>12){const storeys=block.height>=STOREYS?2:1;ctx.fillStyle=PALETTE.viga;
    for(let k=1;k<=storeys;k++){const y=-r*(k/storeys)+r*.1,step=Math.max(6,r*.42/storeys);
      for(let x=sw.x+step/2;x<se.x-step/3;x+=step){if(block.openings.some(o=>{const a=convert({x:o.x0,y:block.y1}).x,b=convert({x:o.x1,y:block.y1}).x;return x>a-2&&x<b+2;}))continue;ctx.fillRect(x-r*.02,sw.y+y,Math.max(1,r*.04),Math.max(1,r*.035));}}}
  // The flat roof with its parapet round a slightly sunken middle, and the rooms of a range seamed across it.
  const top=[nw,ne,se,sw].map(p=>lift(p,r));polygon(ctx,top,PALETTE.roof);
  const inset=Math.max(1,Math.min(6,Math.min(ne.x-nw.x,sw.y-nw.y)*.12));
  if(ne.x-nw.x>3*inset&&sw.y-nw.y>3*inset)polygon(ctx,[{x:top[0].x+inset,y:top[0].y+inset},{x:top[1].x-inset,y:top[1].y+inset},{x:top[2].x-inset,y:top[2].y-inset},{x:top[3].x+inset,y:top[3].y-inset}],PALETTE.roofWell);
  if(close)for(const seam of block.seams){ctx.beginPath();
    if(seam.y!==undefined){const a=lift(convert({x:block.x0,y:seam.y}),r),b=lift(convert({x:block.x1,y:seam.y}),r);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
    else{const a=lift(convert({x:seam.x,y:block.y0}),r),b=lift(convert({x:seam.x,y:block.y1}),r);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
    ctx.strokeStyle=PALETTE.seam;ctx.lineWidth=Math.max(1,inset*.8);ctx.stroke();}
  polygon(ctx,[sw,se,lift(se,r),lift(ne,r),lift(nw,r),lift(sw,r)],null,PALETTE.line,line);
  ctx.beginPath();ctx.moveTo(top[3].x,top[3].y);ctx.lineTo(top[2].x,top[2].y);ctx.strokeStyle=PALETTE.line;ctx.lineWidth=line;ctx.stroke();
}
function drawWall(ctx,wall,convert,ppf){
  const r=wall.height*DRAWN_HEIGHT*ppf,close=ppf>=TEXTURED,line=ppf>.5?1.2:1,timber=wall.material==='timber';
  const dx=wall.b.x-wall.a.x,dy=wall.b.y-wall.a.y,length=Math.hypot(dx,dy);let nx=-dy/length,ny=dx/length;if(ny<0||(ny===0&&nx<0)){nx=-nx;ny=-ny;}
  // Its true thickness, or a pixel and a half where that is less, so a wall does not vanish from a county away.
  const half=Math.max(wall.thickness,1.5/ppf)/2,at=(p,s)=>convert({x:p.x+nx*half*s,y:p.y+ny*half*s});
  const fa=at(wall.a,1),fb=at(wall.b,1),ba=at(wall.a,-1),bb=at(wall.b,-1);
  // The end turned to the camera: the southern end, across the wall's thickness.
  const [ea,eb]=wall.b.y>=wall.a.y?[bb,fb]:[ba,fa];
  if(Math.abs(eb.x-ea.x)>.5)polygon(ctx,[ea,eb,lift(eb,r),lift(ea,r)],timber?PALETTE.timber:PALETTE.endFace,PALETTE.line,line*.8);
  polygon(ctx,[ba,bb,fb,fa].map(p=>lift(p,r)),timber?PALETTE.timberCap:PALETTE.cap,PALETTE.line,line*.8);
  if(Math.abs(fb.x-fa.x)>1){polygon(ctx,[fa,fb,lift(fb,r),lift(fa,r)],timber?PALETTE.timber:PALETTE.face);
    // The roofless church's shell wears its own unfinished 1836 wall; every other stone run wears the plain limestone.
    if(close)faceArt(ctx,face(wallFace(wall)),fa.x<fb.x?fa:fb,fa.x<fb.x?fb:fa,r);
    polygon(ctx,[fa,fb,lift(fb,r),lift(fa,r)],null,PALETTE.line,line);}
}
function alamoDrawables(ctx,convert,ppf){
  const items=[];
  facesDrawn.clear();
  items.push({y:-Infinity,draw:()=>{
    // Open ground solid and edged, as Béxar's own plazas are (drawBexarGround): no tuft or tree of the map shows through it.
    for(const floor of MASSING.floors){const points=floor.points.map(convert),open=floor.kind==='plaza'||floor.kind==='east-court';
      polygon(ctx,points,open?PALETTE.plaza:floor.kind==='pen'?PALETTE.pen:PALETTE.church);
      if(open){ctx.globalAlpha=.5;polygon(ctx,points,null,PALETTE.plazaEdge,Math.max(1,ppf*4));ctx.globalAlpha=1;}}
  }});
  for(const wall of MASSING.walls)items.push({y:Math.max(convert(wall.a).y,convert(wall.b).y)+wall.thickness/2*ppf,draw:()=>drawWall(ctx,wall,convert,ppf)});
  // A building stands in front of the outer wall it is built along: the low barrack's front is the south wall.
  for(const block of MASSING.blocks)items.push({y:convert({x:block.x0,y:block.y1}).y+2*ppf,draw:()=>drawBlock(ctx,block,convert,ppf)});
  // Presentation evidence for proofs (scripts/alamo-style-shots.mjs): what of the compound this frame draws, and how close.
  // `faces` is read after the items above have been drawn, so it is a getter and not a copy taken before any of them ran.
  globalThis.__alamoDrawn={blocks:MASSING.blocks.length,walls:MASSING.walls.length,floors:MASSING.floors.length,pixelsPerFoot:ppf,textured:ppf>=TEXTURED,drawnHeight:DRAWN_HEIGHT,get faces(){return [...facesDrawn].sort();}};
  return items;
}
export function bexarDrawables(ctx,project,pixelsPerFoot,{alamo=true,bankTrees=true,alamoProject=null}={}){
  const items=[];
  // Bank trees line the illustrated river; without that river (the live game keeps its own) they would ring bare grass.
  for(const b of [...town.buildings,...town.props.filter(p=>bankTrees||!p.id.startsWith('bank-tree-'))]){const p=project(b);items.push({y:p.y,draw:()=>drawSprite(ctx,b.sprite,p.x,p.y,b.heightFeet*pixelsPerFoot)});}
  // `alamoProject` lays the compound by its own plan (the live map keeps it north-up, public/bexar-layout.js `alamoOnMap`).
  if(alamo)items.push(...alamoDrawables(ctx,alamoProject||(p=>project(alamoToBexar(p))),pixelsPerFoot));
  return items;
}
export function drawBexar(ctx,project,pixelsPerFoot,options={}){
  drawBexarGround(ctx,project,pixelsPerFoot,options);const items=bexarDrawables(ctx,project,pixelsPerFoot,options);items.sort((a,b)=>a.y-b.y);items.forEach(i=>i.draw());
}
