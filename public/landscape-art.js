// Material detail follows the supplied polyline: every point it is given is a point the line
// passes through, and no bend, branch or crossing is invented between courses.
//
// What IS invented is the shape *between* two points, and deliberately. A river's course is a
// curve; the map carries a sample of it - a few points a mile on the real land, and on the
// invented country as few as four points for the whole Guadalupe. Joining those samples with
// straight lines does not draw a river, it draws a survey traverse: at any zoom past a mile it
// reads as ruled lines meeting at corners, which is what a reader noticed. So the line is drawn
// as a curve through every sample instead. The samples are honoured exactly; only the water
// between them is rounded, which is the more truthful of the two guesses.
//
// ceiling: the surface detail - ripples, reeds, the stones on the bank - is still placed along the
// straight chords by `samples`, so at a wide river's sharpest bends a ripple can sit a little
// inside the curve. It is a few pixels at the widths this is drawn at.
import {drawSprite} from '/art.js';
import {curveThrough,visibleSegments} from '/curve.js';
import {ramp} from '/map-base.js';
function stroke(ctx,points,color,width,visible){curveThrough(ctx,points,visible);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function samples(points,spacing,visit,bounds){let count=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)continue;
  let lo=0,hi=1;for(const [origin,delta,min,max] of [[a.x,dx,-100,bounds.width+100],[a.y,dy,-100,bounds.height+100]]){if(!delta){if(origin<min||origin>max){hi=-1;break;}continue;}const u=(min-origin)/delta,v=(max-origin)/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}
  if(hi<lo)continue;
  for(let d=Math.ceil(lo*length/spacing)*spacing;d<=hi*length;d+=spacing){visit({x:a.x+dx*d/length,y:a.y+dy*d/length,tx:dx/length,ty:dy/length,index:i*101+Math.round(d/spacing)});if(++count>CAP)return;}
}}
// How many pieces of surface detail one course may put on the screen.
//
// It was seven hundred, and seven hundred is reached partway along a wide river at close zoom -
// so the ripples and reeds simply stopped in the middle of the water, leaving one half of the
// river dressed and the other half bare with a hard seam between them. Only what is on screen is
// ever visited (the loop above clips first), so the number is a budget for a frame rather than
// for a river, and this is what a full screen of the widest water actually asks for.
const CAP=2600;
export function drawWater(ctx,points,width){
  // Only the stretch that can reach the screen is laid down: the widest stroke's half, and the reeds and rocks on the bank.
  const {segments,count}=visibleSegments(points,ctx.canvas.width,ctx.canvas.height,width+48);if(!count)return;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  stroke(ctx,points,'#798666',width+Math.min(12,width*.35),segments);
  stroke(ctx,points,'#b6aa7d',width+Math.min(6,width*.18),segments);
  for(const [i,color] of ['#91b5a8','#87afa6','#7ca8a3','#72a2a0','#699c9c','#62979a','#5e9498'].entries())stroke(ctx,points,color,width*(1-i*.08),segments);
  // The ripples, stones and reeds fade in as the water widens, rather than appearing at one width (2026-09-17).
  const base=ctx.globalAlpha,ripples=ramp(width,6,10),reeds=ramp(width,14,20);
  if(ripples>0)samples(points,Math.max(15,width*.55),p=>{
    const offset=Math.sin(p.index*2.399)*width*.24,x=p.x-p.ty*offset,y=p.y+p.tx*offset;
    ctx.strokeStyle=p.index%3?'#abd0c0':'#cee0cc';ctx.globalAlpha=base*.55*ripples;ctx.lineWidth=Math.max(.7,Math.min(1.8,width*.035));
    ctx.beginPath();ctx.moveTo(x-p.tx*width*.10,y-p.ty*width*.10);ctx.quadraticCurveTo(x-p.ty*2,y+p.tx*2,x+p.tx*width*.13,y+p.ty*width*.13);ctx.stroke();
    if(p.index%3===0){const side=p.index%2?1:-1;ctx.fillStyle='#8d9570';ctx.globalAlpha=base*.7*ripples;ctx.beginPath();ctx.ellipse(p.x-p.ty*width*.52*side,p.y+p.tx*width*.52*side,Math.max(1,width*.055),Math.max(1,width*.025),Math.atan2(p.ty,p.tx),0,Math.PI*2);ctx.fill();}
    if(reeds>0&&p.index%4===0){const side=p.index%8?1:-1;ctx.globalAlpha=base*reeds;drawSprite(ctx,p.index%12?'reeds':'rocks',p.x-p.ty*width*.57*side,p.y+p.tx*width*.57*side,Math.min(32,width*.32));}
  },ctx.canvas);ctx.restore();
}
export function drawRoad(ctx,points,width){
  const {segments,count}=visibleSegments(points,ctx.canvas.width,ctx.canvas.height,width*1.6+24);if(!count)return;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';stroke(ctx,points,'#ac9f71',width*1.55,segments);stroke(ctx,points,'#c2ac7d',width*1.2,segments);stroke(ctx,points,'#d1bc8f',width,segments);
  const base=ctx.globalAlpha,ruts=ramp(width,5,8),tufts=ramp(width,10,14);
  if(ruts>0)samples(points,Math.max(8,width*.5),p=>{
    ctx.globalAlpha=base*.35*ruts;ctx.strokeStyle='#806d49';ctx.lineWidth=Math.max(.6,width*.045);
    for(const side of [-1,1]){const x=p.x-p.ty*width*.25*side,y=p.y+p.tx*width*.25*side;ctx.beginPath();ctx.moveTo(x-p.tx*3,y-p.ty*3);ctx.lineTo(x+p.tx*3,y+p.ty*3);ctx.stroke();}
    ctx.globalAlpha=base*.28*ruts;ctx.fillStyle='#6e7250';const side=p.index%2?1:-1;ctx.beginPath();ctx.ellipse(p.x-p.ty*width*.62*side,p.y+p.tx*width*.62*side,1.8,1,0,0,Math.PI*2);ctx.fill();
    for(let n=0;n<5;n++){const off=Math.sin(p.index*7+n*3.17)*width*.42;ctx.fillStyle=n%2?'#ead5a7':'#88734c';ctx.globalAlpha=base*.25*ruts;ctx.fillRect(p.x-p.ty*off+p.tx*(n-2),p.y+p.tx*off+p.ty*(n-2),1.4,.8);}
    if(p.index%5===0&&tufts>0){ctx.globalAlpha=base*tufts*ruts;drawSprite(ctx,'grass-tuft',p.x-p.ty*width*.8*side,p.y+p.tx*width*.8*side,Math.min(13,width*.25));}
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
/**
 * A ferry: the rope stretched bank to bank on a post at each end, and the boat lying at one bank on it (`HIST-TEX-140`: "a
 * flat raft-like barge" on "a bank-to-bank cable"; Lynch's "a flatboat service with a hand-pulled rope", `HIST-TEX-150`).
 * `length` is the span in pixels, `angle` the way across the water.
 *
 * The boat is `ferry-flatboat` and the posts `ferry-post`, both delivered 2026-09-21
 * (docs/ART_DELIVERY_2026-09-21-RIVER-TRANSPORT.md): a square-ended sawn-plank cable flatboat with apron ramps, and a
 * braced bank post with the rope made fast to it, which is the 1829-30s ferry the request asked for rather than the
 * emergency log raft (`ferry-raft`) that stood in for it. The rope between the posts is still canvas strokes, because it
 * spans whatever width the map's own river is here and no sprite can.
 * ceiling: the boat lies at the near bank whatever is crossing. `ferry-flatboat-laden` - the same boat with a covered
 * wagon, an ox team and the ferryman working the cable - is registered and unused, because nothing on this map says who
 * is on the water at this moment; a crossing that knew would draw it.
 */
export function drawFerry(ctx,x,y,length,angle,figure,road=0){
  const half=length/2,post=Math.max(2,length*.035),dx=Math.cos(angle),dy=Math.sin(angle);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineCap='round';
  // The road stops at the water: the river is laid back over the road between the landings, so the way over is the boat.
  if(road>0){const w=road*.62,run=half/1.9;ctx.fillStyle='#6a9e9c';ctx.beginPath();ctx.moveTo(-run,-w);ctx.lineTo(run,-w);ctx.quadraticCurveTo(run+w*.6,0,run,w);ctx.lineTo(-run,w);ctx.quadraticCurveTo(-run-w*.6,0,-run,-w);ctx.fill();
    ctx.strokeStyle='#abd0c0';ctx.globalAlpha=.5;ctx.lineWidth=Math.max(.7,w*.08);for(const f of [-.45,.1,.5]){ctx.beginPath();ctx.moveTo(-run*.6+f*run*.4,f*w*.8);ctx.lineTo(-run*.2+f*run*.4,f*w*.8);ctx.stroke();}ctx.globalAlpha=1;}
  // The landings: bare, trodden bank at each end, where the gullies were filled for the boat.
  ctx.fillStyle='#c5bc90';ctx.globalAlpha=.7;for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*half,0,Math.max(3,length*.09),Math.max(3,length*.12),0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  // The rope: a slack double line, darker beneath.
  for(const [color,width,sag] of [['#4d3b26',Math.max(1.6,length*.016),.035],['#a88a5a',Math.max(.8,length*.008),.03]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(-half,0);ctx.quadraticCurveTo(0,length*sag,half,0);ctx.stroke();}
  ctx.restore();
  // The posts the rope is made fast to, upright whatever way the river runs - a sprite has no business being rotated with
  // the water - and the drawn strokes beneath them while the sheet has not arrived.
  const postHeight=Math.max(6,Math.min(length*.22,figure*1.1));
  for(const s of [-1,1]){
    const px=x+s*dx*half,py=y+s*dy*half;
    if(drawSprite(ctx,'ferry-post',px,py,postHeight))continue;
    ctx.save();ctx.translate(px,py);ctx.rotate(angle);
    ctx.fillStyle='#59452d';ctx.fillRect(-post/2,-post*2.2,post,post*2.6);ctx.fillStyle='#c1a170';ctx.fillRect(-post/2,-post*2.2,post*.7,post*.6);
    ctx.restore();
  }
  // The boat at the near landing, upright whatever way the river runs.
  const bx=x-dx*half*.55,by=y-dy*half*.55,height=Math.max(8,Math.min(length*.45,figure*2.4));
  if(!drawSprite(ctx,'ferry-flatboat',bx,by+height*.35,height))drawSprite(ctx,'ferry-raft',bx,by+height*.35,height);
}
export function drawCrossing(ctx,x,y,length,angle,bridge=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);const half=length/2,wide=Math.max(4,length*.12);
  if(bridge){ctx.fillStyle='#263c3440';ctx.fillRect(-half+4,-wide+5,length,wide*2);ctx.fillStyle='#4e4938';ctx.fillRect(-half,-wide,length,wide*2);let n=0;for(let p=-half;p<half;p+=Math.max(3,length/16)){ctx.fillStyle=n++%3?'#aa8453':'#bc975f';ctx.fillRect(p,-wide,Math.max(2,length/16-1),wide*2);ctx.strokeStyle='#705333';ctx.lineWidth=.7;for(const f of [-.6,0,.6]){ctx.beginPath();ctx.moveTo(p+1,f*wide);ctx.lineTo(p+length/16-2,f*wide+1);ctx.stroke();}}ctx.strokeStyle='#60482e';ctx.lineWidth=2;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-half,s*wide);ctx.lineTo(half,s*wide);ctx.stroke();for(let p=-half;p<=half;p+=length/4){ctx.fillStyle='#59452d';ctx.fillRect(p-2,s*wide-3,4,6);ctx.fillStyle='#c1a170';ctx.fillRect(p-2,s*wide-3,3,2);}}}
  else{ctx.fillStyle='#c5bc90';ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(0,0,half,wide*1.4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<9;i++){const p=-half+length*(i+.5)/9;ctx.fillStyle=i%2?'#929883':'#b8bda4';ctx.beginPath();ctx.ellipse(p,Math.sin(i*2.4)*wide*.5,Math.max(1,length*.025),Math.max(1,wide*.25),i,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d6e4cf';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(p,wide*.45,Math.max(2,wide*.35),0,Math.PI*.8);ctx.stroke();}}
  ctx.restore();
}
