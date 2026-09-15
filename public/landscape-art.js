// Material detail follows the supplied polyline exactly: no invented bends or crossings.
import {drawSprite} from '/art.js';
function trace(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));}
function stroke(ctx,points,color,width){trace(ctx,points);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function samples(points,spacing,visit,bounds){let count=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)continue;
  let lo=0,hi=1;for(const [origin,delta,min,max] of [[a.x,dx,-100,bounds.width+100],[a.y,dy,-100,bounds.height+100]]){if(!delta){if(origin<min||origin>max){hi=-1;break;}continue;}const u=(min-origin)/delta,v=(max-origin)/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}
  if(hi<lo)continue;
  for(let d=Math.ceil(lo*length/spacing)*spacing;d<=hi*length;d+=spacing){visit({x:a.x+dx*d/length,y:a.y+dy*d/length,tx:dx/length,ty:dy/length,index:i*101+Math.round(d/spacing)});if(++count>700)return;}
}}
export function drawWater(ctx,points,width){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  stroke(ctx,points,'#798666',width+Math.min(12,width*.35));
  stroke(ctx,points,'#b6aa7d',width+Math.min(6,width*.18));
  for(const [i,color] of ['#91b5a8','#87afa6','#7ca8a3','#72a2a0','#699c9c','#62979a','#5e9498'].entries())stroke(ctx,points,color,width*(1-i*.08));
  if(width>6)samples(points,Math.max(15,width*.55),p=>{
    const offset=Math.sin(p.index*2.399)*width*.24,x=p.x-p.ty*offset,y=p.y+p.tx*offset;
    ctx.strokeStyle=p.index%3?'#abd0c0':'#cee0cc';ctx.globalAlpha=.55;ctx.lineWidth=Math.max(.7,Math.min(1.8,width*.035));
    ctx.beginPath();ctx.moveTo(x-p.tx*width*.10,y-p.ty*width*.10);ctx.quadraticCurveTo(x-p.ty*2,y+p.tx*2,x+p.tx*width*.13,y+p.ty*width*.13);ctx.stroke();
    if(p.index%3===0){const side=p.index%2?1:-1;ctx.fillStyle='#8d9570';ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(p.x-p.ty*width*.52*side,p.y+p.tx*width*.52*side,Math.max(1,width*.055),Math.max(1,width*.025),Math.atan2(p.ty,p.tx),0,Math.PI*2);ctx.fill();}
    if(width>14&&p.index%4===0){const side=p.index%8?1:-1;ctx.globalAlpha=1;drawSprite(ctx,p.index%12?'reeds':'rocks',p.x-p.ty*width*.57*side,p.y+p.tx*width*.57*side,Math.min(32,width*.32));}
  },ctx.canvas);ctx.restore();
}
export function drawRoad(ctx,points,width){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';stroke(ctx,points,'#ac9f71',width*1.55);stroke(ctx,points,'#c2ac7d',width*1.2);stroke(ctx,points,'#d1bc8f',width);
  if(width>5)samples(points,Math.max(8,width*.5),p=>{
    ctx.globalAlpha=.35;ctx.strokeStyle='#806d49';ctx.lineWidth=Math.max(.6,width*.045);
    for(const side of [-1,1]){const x=p.x-p.ty*width*.25*side,y=p.y+p.tx*width*.25*side;ctx.beginPath();ctx.moveTo(x-p.tx*3,y-p.ty*3);ctx.lineTo(x+p.tx*3,y+p.ty*3);ctx.stroke();}
    ctx.globalAlpha=.28;ctx.fillStyle='#6e7250';const side=p.index%2?1:-1;ctx.beginPath();ctx.ellipse(p.x-p.ty*width*.62*side,p.y+p.tx*width*.62*side,1.8,1,0,0,Math.PI*2);ctx.fill();
    for(let n=0;n<5;n++){const off=Math.sin(p.index*7+n*3.17)*width*.42;ctx.fillStyle=n%2?'#ead5a7':'#88734c';ctx.globalAlpha=.25;ctx.fillRect(p.x-p.ty*off+p.tx*(n-2),p.y+p.tx*off+p.ty*(n-2),1.4,.8);}
    if(p.index%5===0&&width>10){ctx.globalAlpha=1;drawSprite(ctx,'grass-tuft',p.x-p.ty*width*.8*side,p.y+p.tx*width*.8*side,Math.min(13,width*.25));}
  },ctx.canvas);ctx.restore();
}
export function crossingAngle(site,features,toScreen){
  const q=toScreen(site);let best=Infinity,angle=0;
  for(const f of features.filter(f=>['river','creek'].includes(f.kind)))for(let i=1;i<f.points.length;i++){
    const a=toScreen(f.points[i-1]),b=toScreen(f.points[i]),dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;if(!l)continue;
    const t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/l)),d=Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy);
    if(d<best){best=d;angle=Math.atan2(dy,dx)+Math.PI/2;}
  }return angle;
}
export function drawCrossing(ctx,x,y,length,angle,bridge=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);const half=length/2,wide=Math.max(4,length*.12);
  if(bridge){ctx.fillStyle='#263c3440';ctx.fillRect(-half+4,-wide+5,length,wide*2);ctx.fillStyle='#4e4938';ctx.fillRect(-half,-wide,length,wide*2);let n=0;for(let p=-half;p<half;p+=Math.max(3,length/16)){ctx.fillStyle=n++%3?'#aa8453':'#bc975f';ctx.fillRect(p,-wide,Math.max(2,length/16-1),wide*2);ctx.strokeStyle='#705333';ctx.lineWidth=.7;for(const f of [-.6,0,.6]){ctx.beginPath();ctx.moveTo(p+1,f*wide);ctx.lineTo(p+length/16-2,f*wide+1);ctx.stroke();}}ctx.strokeStyle='#60482e';ctx.lineWidth=2;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-half,s*wide);ctx.lineTo(half,s*wide);ctx.stroke();for(let p=-half;p<=half;p+=length/4){ctx.fillStyle='#59452d';ctx.fillRect(p-2,s*wide-3,4,6);ctx.fillStyle='#c1a170';ctx.fillRect(p-2,s*wide-3,3,2);}}}
  else{ctx.fillStyle='#c5bc90';ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(0,0,half,wide*1.4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<9;i++){const p=-half+length*(i+.5)/9;ctx.fillStyle=i%2?'#929883':'#b8bda4';ctx.beginPath();ctx.ellipse(p,Math.sin(i*2.4)*wide*.5,Math.max(1,length*.025),Math.max(1,wide*.25),i,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d6e4cf';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(p,wide*.45,Math.max(2,wide*.35),0,Math.PI*.8);ctx.stroke();}}
  ctx.restore();
}
