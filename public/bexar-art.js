import {drawSprite} from '/art.js';
import {drawRoad,drawWater} from '/landscape-art.js';
import {BEXAR_LAYOUT as town,alamoToBexar} from '/bexar-layout.js';

const corners=r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
// Shared scenery renderer: no people, hidden events, clock or second simulation.
export function drawBexarGround(ctx,project,pixelsPerFoot,{river=true}={}){
  const line=(points,color,width)=>{ctx.beginPath();points.map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,width*pixelsPerFoot);ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();};
  if(river)drawWater(ctx,town.river.points.map(project),Math.max(1,town.river.widthFeet*pixelsPerFoot));
  for(const road of town.roads)drawRoad(ctx,road.points.map(project),Math.max(1,road.widthFeet*pixelsPerFoot));
  for(const plaza of town.plazas)polygon(ctx,corners(plaza).map(project),'#ccb985','#a59063');
}
export function bexarDrawables(ctx,project,pixelsPerFoot,{alamo=true,bankTrees=true}={}){
  const items=[];
  // Bank trees line the illustrated river; without that river (the live game keeps its own) they would ring bare grass.
  for(const b of [...town.buildings,...town.props.filter(p=>bankTrees||!p.id.startsWith('bank-tree-'))]){const p=project(b);items.push({y:p.y,draw:()=>drawSprite(ctx,b.sprite,p.x,p.y,b.heightFeet*pixelsPerFoot)});}
  if(alamo){const layout=town.alamo.layout,convert=p=>project(alamoToBexar(p));
    for(const g of layout.ground)items.push({y:-Infinity,draw:()=>polygon(ctx,g.points.map(convert),'#c9b17e')});
    for(const wall of layout.walls){if(wall.roomId)continue;const a=convert(wall.a),b=convert(wall.b),count=Math.max(1,Math.ceil(Math.hypot(wall.b.x-wall.a.x,wall.b.y-wall.a.y)/12));
      items.push({y:Math.max(a.y,b.y),draw:()=>{for(let i=0;i<count;i++){const t=(i+.5)/count;drawSprite(ctx,wall.material==='timber'?'alamo-palisade':'alamo-wall-intact',a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,wall.heightFeet*pixelsPerFoot);}}});}
    for(const room of layout.rooms){const points=corners(room).map(convert);items.push({y:Math.max(...points.map(p=>p.y)),draw:()=>{
      polygon(ctx,points,'#c9b68c','#66573e');
      for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],rise=(room.wallHeight||10)*pixelsPerFoot;polygon(ctx,[a,b,{x:b.x,y:b.y-rise},{x:a.x,y:a.y-rise}],'#c9b68c','#695b41');}
      if(room.roof!==false){const rise=(room.wallHeight||10)*pixelsPerFoot;polygon(ctx,points.map(p=>({x:p.x,y:p.y-rise})),'#796047','#4c412e');}
    }});}
    const portal=convert({x:291,y:393});items.push({y:portal.y+.1,draw:()=>drawSprite(ctx,'alamo-church-front-1836',portal.x,portal.y,23*pixelsPerFoot)});
  }return items;
}
export function drawBexar(ctx,project,pixelsPerFoot,options={}){
  drawBexarGround(ctx,project,pixelsPerFoot,options);const items=bexarDrawables(ctx,project,pixelsPerFoot,options);items.sort((a,b)=>a.y-b.y);items.forEach(i=>i.draw());
}
