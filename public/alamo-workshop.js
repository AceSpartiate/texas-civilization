import {loadArt,drawSprite,drawClip,spriteFrame} from '/art.js';
import {collapsePose} from '/alamo-collapse.js';
import {BEXAR_LAYOUT as bexar,bexarToAlamo} from '/bexar-layout.js';
import {drawBexar} from '/bexar-art.js';
import {ALAMO_LAYOUT as layout,createDamageState,damageWall,isWalkable,findPath,moveActor,pathLength,roomCenter} from '/alamo-layout.js';
const $=s=>document.querySelector(s),canvas=$('#alamo-map'),ctx=canvas.getContext('2d');
const media=matchMedia('(prefers-reduced-motion: reduce)');
let damage=createDamageState(),mode='roofs',playing=true,time=0,last=0,paint=0,selected='scale-person',study=false;
let camera={x:190,y:270,scale:1},width=1,height=1;
let showBexar=false;
const initialActors=[{id:'scale-person',name:'Scale figure',cast:'rust',x:110,y:480},{id:'joe-study',name:'Joe · interpreted appearance',cast:'joe',x:36,y:90},{id:'officer-study',name:'Officer · generic study figure',cast:'regular',x:47,y:100}];
let actors=structuredClone(initialActors);
let collapses=new Map();
function advanceCollapses(){
  for(const [id,start] of collapses){if(collapsePose(time-start,$('#reduced-motion').checked).complete){
    damageWall(damage,id,100);collapses.delete(id);for(const a of actors)delete a.path;
    status('The studied wall section is rubble. Its opening is now walkable; adjacent sections retain their state.');
  }}
}
const inside=(p,r)=>p.x>r.x&&p.x<r.x+r.width&&p.y>r.y&&p.y<r.y+r.height;
const roomAt=p=>layout.rooms.find(r=>inside(p,r));
// Fixed oblique camera matches the supplied compound reference. Coordinates remain
// north-up feet; this affine projection changes only the view, never dimensions.
const project=p=>{const x=p.x-camera.x,y=p.y-camera.y;return {x:width/2+(x*.9+y*.62)*camera.scale,y:height*.46+(-x*.35+y*.55)*camera.scale};};
const unproject=p=>{const x=(p.x-width/2)/camera.scale,y=(p.y-height*.46)/camera.scale;return {x:camera.x+(x*.55-y*.62)/.712,y:camera.y+(y*.9+x*.35)/.712};};
const status=text=>{$('#workshop-status').textContent=text;};
function fit(){camera={x:190,y:278,scale:Math.max(.25,Math.min((width-100)/720,(height-280)/465))};}
function resize(){width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function rectPoints(r){return [{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}].map(project);}
function label(text,x,y,font=11){ctx.font=`${font}px Georgia`;ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#f4e9cd';ctx.lineWidth=3;ctx.strokeText(text,x,y);ctx.fillStyle='#59482e';ctx.fillText(text,x,y);}
function imageAt(sprite,x,y,heightFeet){return drawSprite(ctx,sprite,project({x,y}).x,project({x,y}).y,heightFeet*camera.scale*.8);}
// Reuse the illustrated material sheets, while keeping the layout's foot-sized
// surfaces authoritative. Clip tiles at room edges, never scale a whole building.
function surfaceArt(points,sprite,bounds,elevation=0,tileFeet=16){
  const frame=spriteFrame(sprite);if(!frame||mode==='plan')return;
  const lift=elevation*camera.scale*.8;
  ctx.save();ctx.beginPath();points.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(q.x,q.y-lift):ctx.moveTo(q.x,q.y-lift);});ctx.closePath();ctx.clip();
  const origin=project({x:0,y:0});ctx.transform(.9*camera.scale,-.35*camera.scale,.62*camera.scale,.55*camera.scale,origin.x,origin.y-lift);
  for(let y=bounds.y;y<bounds.y+bounds.height;y+=tileFeet)for(let x=bounds.x;x<bounds.x+bounds.width;x+=tileFeet){
    ctx.save();ctx.beginPath();ctx.rect(x,y,tileFeet+.1,tileFeet+.1);ctx.clip();
    // Use the interior of each material patch; its illustrated perimeter would
    // otherwise turn a continuous dirt plaza into a grid of outlined islands.
    ctx.globalAlpha=sprite==='alamo-floor-earth'?.35:.8;
    ctx.translate(x-tileFeet*.35,y-tileFeet*.35);ctx.scale(tileFeet*1.7/frame.w,tileFeet*1.7/frame.h);
    drawSprite(ctx,sprite,0,0,frame.logicalHeight||frame.h,{anchor:[0,0]});ctx.restore();
  }ctx.restore();
}
function wallSections(w){
  // Clip every doorway from the wall's drawn face as well as from collision.
  const dx=w.b.x-w.a.x,dy=w.b.y-w.a.y,length=Math.hypot(dx,dy),cuts=[0,1];
  for(const d of layout.doors){let near=false;for(let i=0;i<=16;i++){const t=i/16;if(inside({x:w.a.x+dx*t,y:w.a.y+dy*t},d)){near=true;break;}}
    if(near){const t0=Math.abs(dx)>=Math.abs(dy)?(d.x-w.a.x)/dx:(d.y-w.a.y)/dy,t1=Math.abs(dx)>=Math.abs(dy)?(d.x+d.width-w.a.x)/dx:(d.y+d.height-w.a.y)/dy;cuts.push(Math.max(0,Math.min(t0,t1)),Math.min(1,Math.max(t0,t1)));}}
  cuts.sort((a,b)=>a-b);const out=[];
  for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],mid=(a+b)/2;if(b<=a||layout.doors.some(d=>inside({x:w.a.x+dx*mid,y:w.a.y+dy*mid},d)))continue;out.push({a:{x:w.a.x+dx*a,y:w.a.y+dy*a},b:{x:w.a.x+dx*b,y:w.a.y+dy*b},length:(b-a)*length});}return out;
}
function drawWall(w){
  const health=damage.walls[w.id]??100,cutaway=mode==='cutaway'&&w.roomId;
  const wallHeight=mode==='plan'?.5:cutaway?2.2:w.heightFeet;
  for(const segment of wallSections(w)){
    const a=project(segment.a),b=project(segment.b),rise=wallHeight*camera.scale*.8,thick=Math.max(1,w.thickness*camera.scale*.55);
    if(health===0){const count=Math.max(1,Math.ceil(segment.length/12));for(let i=0;i<count;i++){const f=(i+.5)/count;drawSprite(ctx,'alamo-wall-rubble',a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,Math.min(6,segment.length/count*.5)*camera.scale);}continue;}
    // The masonry face is an affine-mapped atlas module on a geometry-defined wall.
    // It cannot change the wall's thickness, passage clearance or historic scale.
    const face=[a,b,{x:b.x,y:b.y-rise},{x:a.x,y:a.y-rise}];if(!collapses.has(w.id))polygon(face,w.material==='timber'?'#927449':'#c9b895','#76664b');
    const sprite=collapses.has(w.id)?collapsePose(time-collapses.get(w.id)).sprite:w.material==='timber'?'alamo-palisade':health<100?'alamo-wall-cracked':'alamo-wall-intact';
    const frame=spriteFrame(sprite),count=Math.max(1,Math.ceil(segment.length/12));
    if(frame&&camera.scale>.75){for(let i=0;i<count;i++){
      const f=i/count,g=(i+1)/count,start={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},end={x:a.x+(b.x-a.x)*g,y:a.y+(b.y-a.y)*g};
      ctx.save();polygon([start,end,{x:end.x,y:end.y-rise},{x:start.x,y:start.y-rise}],collapses.has(w.id)?'#00000000':'#c8b794');ctx.clip();
      // Existing oblique wall imagery supplies texture; footprints remain data.
      const h=100,renderWidth=h*frame.w/(frame.logicalHeight||frame.h);
      ctx.transform((end.x-start.x)/renderWidth,(end.y-start.y)/renderWidth,0,rise/h,start.x,start.y);
      drawSprite(ctx,sprite,0,0,h,{anchor:[0,1]});ctx.restore();
    }}
    if(!collapses.has(w.id))polygon([{x:a.x,y:a.y-rise},{x:b.x,y:b.y-rise},{x:b.x+thick,y:b.y-rise-thick*.45},{x:a.x+thick,y:a.y-rise-thick*.45}],w.material==='timber'?'#b39a69':'#e1d3ad','#8b7b5c');
  }
}
function draw(){
  advanceCollapses();
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#9daa71';ctx.fillRect(0,0,width,height);
  if(showBexar){const toScreen=p=>project(bexarToAlamo(p));drawBexar(ctx,toScreen,camera.scale*.8,{alamo:false});
    if($('#show-labels').checked)for(const note of bexar.annotations){const p=toScreen(note);label(note.label,p.x,p.y-14,11);}}
  for(const g of layout.ground)polygon(g.points.map(project),g.id==='plaza'?'#cbb783':'#bfad7b');
  for(const g of layout.ground){const xs=g.points.map(p=>p.x),ys=g.points.map(p=>p.y);surfaceArt(g.points,'alamo-floor-earth',{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)},0,28);}
  if($('#show-grid').checked){ctx.strokeStyle='#706b4530';ctx.lineWidth=.5;for(let x=0;x<430;x+=10){const a=project({x,y:0}),b=project({x,y:550});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(let y=0;y<550;y+=10){const a=project({x:0,y}),b=project({x:430,y});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
  // Distinct open pens, ranges and a cruciform church; no whole-building bitmap.
  for(const r of layout.rooms){polygon(rectPoints(r),r.id.startsWith('pen-')?'#b4a578':r.id.startsWith('church')||['sacristy','baptistry','confessional'].includes(r.id)?'#d8c9a6':'#bca378','#ad9269');
    if(camera.scale>2&&!r.id.startsWith('pen-')){ctx.save();ctx.beginPath();rectPoints(r).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.strokeStyle='#9c896830';ctx.lineWidth=.6;for(let y=r.y;y<r.y+r.height;y+=4){const a=project({x:r.x,y}),b=project({x:r.x+r.width,y});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}}
  const chosen=actors.find(a=>a.id===selected);
  for(const r of layout.rooms)surfaceArt([{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}],r.id.startsWith('pen-')?'alamo-floor-earth':'alamo-floor-limestone',r,0,12);
  if(chosen.path){ctx.strokeStyle='#5c7258';ctx.setLineDash([4,5]);ctx.beginPath();chosen.path.map(project).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);}
  const standing=layout.walls.map(w=>({y:Math.max(w.a.y,w.b.y),draw:()=>drawWall(w)}));
  if(mode==='roofs')standing.push({y:418,draw:()=>{
    const a=project({x:291,y:355}),b=project({x:291,y:355+layout.dimensions.churchWidthFeet});
    const f=spriteFrame('alamo-church-front-1836');if(!f)return;const h=100,w=h*f.w/f.h;
    ctx.save();ctx.transform((b.x-a.x)/w,(b.y-a.y)/w,0,23*camera.scale*.8/h,a.x,a.y);
    drawSprite(ctx,'alamo-church-front-1836',0,0,h,{anchor:[0,1]});ctx.restore();
  }});
  for(const p of layout.props)standing.push({y:p.y,draw:()=>imageAt(p.sprite,p.x,p.y,p.height)});
  for(const a of actors)standing.push({y:a.y,draw:()=>{
    const q=project(a),scale=layout.referenceHeightFeet*camera.scale*.8*($('#large-figures').checked?2:1),heading=a.heading||'s';
    let clip=a.cast==='regular'?(a.path?'regular-march':'regular-idle-e'):a.path?`${a.cast}-walk${['s','n'].includes(heading)?'-'+heading:''}`:a.cast==='joe'?'joe-idle':`${a.cast}-idle-s`;
    let at=time;if(a.hiding)clip='joe-hide';
    if(a.gesture&&!a.path){clip=`joe-${a.gesture}`;at=time-(a.gestureAt||0);}
    if(a.id===selected){ctx.strokeStyle='#ffffc9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y,Math.max(3,scale*.24),Math.max(1.5,scale*.09),0,0,Math.PI*2);ctx.stroke();}
    drawClip(ctx,clip,q.x,q.y,scale,{timeMs:at,flip:heading==='w',reducedMotion:$('#reduced-motion').checked});
    if(camera.scale>4)label(a.id==='joe-study'?'Joe':a.name,q.x,q.y+16,11);
  }});
  standing.sort((a,b)=>a.y-b.y);standing.forEach(item=>item.draw());
  if(mode==='roofs')for(const r of layout.roofs){const room=layout.rooms.find(x=>x.id===r.roomId),rise=room.wallHeight||10;const points=rectPoints(r).map(p=>({x:p.x,y:p.y-rise*camera.scale*.8}));polygon(points,'#796348','#4e412e');ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.strokeStyle='#b59a68';ctx.lineWidth=1;for(let y=r.y;y<r.y+r.height;y+=3){const a=project({x:r.x,y}),b=project({x:r.x+r.width,y});ctx.beginPath();ctx.moveTo(a.x,a.y-rise*camera.scale*.8);ctx.lineTo(b.x,b.y-rise*camera.scale*.8);ctx.stroke();}ctx.restore();}
  if(mode==='roofs')for(const r of layout.roofs){const room=layout.rooms.find(x=>x.id===r.roomId);surfaceArt([{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}],'alamo-roof-panel',r,room.wallHeight||10,18);}
  if($('#show-labels').checked&&(!showBexar||camera.scale>.3)){for(const note of layout.annotations){const p=project(note);label(note.label,p.x,p.y-12,camera.scale>2?13:10);}if(camera.scale>3)for(const r of layout.rooms){const p=project(roomCenter(r));label(r.label,p.x,p.y,11);}}
  const bar= camera.scale>5?10:50;$('#scale-bar').style.width=`${bar*camera.scale*Math.hypot(.9,.35)}px`;$('#scale-distance').textContent=`${bar} ft east–west`;
  $('#actor-readout').textContent=`${chosen.name} · ${roomAt(chosen)?.label||'courtyard / grounds'}${chosen.path?' · walking':''}`;
  window.__alamo={ready:true,units:layout.units,rooms:layout.rooms.length,wallStates:{...damage.walls},collapsePoses:Object.fromEntries([...collapses].map(([id,start])=>[id,collapsePose(time-start).sprite])),actors:structuredClone(actors),camera:{...camera},roofMode:mode,timeMs:time,scaleHeightFeet:layout.referenceHeightFeet};
}
function walk(id,target){const actor=actors.find(a=>a.id===id),path=findPath(actor,target,damage);if(!path){status('That spot is blocked. Choose an open floor or doorway.');return false;}actor.path=path;actor.distance=0;actor.hiding=false;status(`${actor.name} is walking along connected open ground.`);return true;}
function focusRoom(id){$('#room-focus').value=id;const r=layout.rooms.find(r=>r.id===id);if(!r){fit();return;}const p=roomCenter(r);camera={...p,scale:Math.min(16,(width-90)/(r.width*.9+r.height*.62+45),(height-280)/(r.width*.35+r.height*.55+45))};}
function reset(){actors=structuredClone(initialActors);study=false;$('#history-note').hidden=true;draw();}
for(const r of layout.rooms){const option=document.createElement('option');option.value=r.id;option.textContent=r.label;$('#room-focus').append(option);const li=document.createElement('li');li.textContent=`${r.label}: ${r.width.toFixed(1)} by ${r.height.toFixed(1)} feet, reconstructed room.`;$('#room-list').append(li);}
for(const a of actors){const o=document.createElement('option');o.value=a.id;o.textContent=a.name;$('#actor-select').append(o);}
$('#assembly-description').textContent=layout.note;
$('#fit-compound').onclick=()=>{focusRoom('');draw();};$('#room-focus').onchange=e=>{if(e.target.value){mode='cutaway';$('#roof-mode').value=mode;$('#preview-state').textContent='Cutaway rooms';}focusRoom(e.target.value);draw();};
$('#fit-bexar').onclick=()=>{showBexar=true;mode='roofs';$('#roof-mode').value=mode;const b=bexar.bounds,center=bexarToAlamo({x:b.x+b.width/2,y:b.y+b.height/2});camera={...center,scale:Math.max(.08,Math.min((width-80)/(b.width*.9+b.height*.62),(height-280)/(b.width*.35+b.height*.55)))};$('#preview-state').textContent='San Antonio de Béxar · reconstructed town';status('Twin plazas, river, streets and the Alamo assembled from the game art. Building locations are a reference-based reconstruction.');draw();};
$('#zoom-in').onclick=()=>{camera.scale=Math.min(25,camera.scale*1.4);draw();};$('#zoom-out').onclick=()=>{camera.scale=Math.max(.25,camera.scale/1.4);draw();};
$('#roof-mode').onchange=e=>{mode=e.target.value;$('#preview-state').textContent=`${mode} · north wall ${$('#north-wall').value}`;draw();};
$('#actor-select').onchange=e=>{selected=e.target.value;draw();};$('#clear-walk').onclick=()=>{delete actors.find(a=>a.id===selected).path;draw();};$('#reset-figures').onclick=reset;
$('#preview-play').onclick=()=>{playing=!playing;$('#preview-play').textContent=playing?'Pause':'Play';$('#preview-play').setAttribute('aria-pressed',String(playing));last=0;draw();};
$('#north-wall').onchange=e=>{collapses.clear();damage=createDamageState();const amount=e.target.value==='breached'?100:e.target.value==='damaged'?55:0;for(const id of ['north-4','north-5'])damageWall(damage,id,amount);for(const a of actors)delete a.path;$('#preview-state').textContent=`${mode} · north wall ${e.target.value}`;status('Two north-wall sections changed. Routes now use the visible opening; this is a construction preview, not a dated battle event.');draw();};
for(const selector of ['#show-labels','#show-grid','#large-figures','#reduced-motion'])$(selector).onchange=()=>{$('#scale-readout').textContent=$('#large-figures').checked?'Inspection figures ×2 · ground remains in feet':'Real feet · people 5.7 ft';$('#scale-readout').dataset.enlarged=String($('#large-figures').checked);draw();};
$('#reduced-motion').checked=media.matches;
for(const w of layout.walls.filter(w=>w.destructible)){const o=document.createElement('option');o.value=w.id;o.textContent=`North wall · section ${w.id.split('-').at(-1)}`;$('#collapse-section').append(o);}
$('#collapse-section').value='north-4';
$('#collapse-wall').onclick=()=>{const id=$('#collapse-section').value,w=layout.walls.find(w=>w.id===id);if(!w)return;
  damage.walls[id]=100;damage.version++;for(const a of actors)delete a.path;collapses.set(id,time);
  camera={x:(w.a.x+w.b.x)/2,y:(w.a.y+w.b.y)/2,scale:Math.min(10,(width-80)/70)};
  status('Watching one reconstructed wall section break. The passage opens when the collapse finishes.');draw();};
$('#joe-study').onclick=()=>{selected='joe-study';$('#actor-select').value=selected;mode='cutaway';$('#roof-mode').value=mode;study=true;focusRoom('west-room-1');walk(selected,{x:16,y:61});const note=$('#history-note');note.hidden=false;note.replaceChildren();const title=document.createElement('strong');title.textContent='Joe · refuge scene study';const p=document.createElement('p');p.textContent='Joe retreats into a room and takes cover. The room is reconstructed and the appearance is interpreted. Dedicated poses show Joe crouching, emerging and speaking.';const detail=document.createElement('p');detail.textContent='According to the account recorded by William F. Gray, Joe emerged when officers called for Black survivors. Soldiers attacked him, and a captain intervened. Do not script a simple declaration of enslavement as the sole cause of survival.';const link=document.createElement('a');link.href='https://www.thealamo.org/remember/battle-and-revolution/joes-account';link.textContent='Read the preserved account';link.target='_blank';link.rel='noopener';const emerge=document.createElement('button');emerge.textContent='Study emergence';emerge.onclick=()=>{study=false;const joe=actors.find(a=>a.id==='joe-study');delete joe.path;joe.hiding=false;joe.gesture='emerge';joe.gestureAt=time;joe.emergeTarget={x:27,y:61};};const close=document.createElement('button');close.textContent='Close note';close.onclick=()=>{note.hidden=true;};note.append(title,p,detail,link,emerge,close);draw();};
const pointers=new Map();let dragged=false,down=null;
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});down={x:e.clientX,y:e.clientY};dragged=false;};
canvas.onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;const next={x:e.clientX,y:e.clientY};if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);if(before)camera.scale=Math.min(25,Math.max(.25,camera.scale*after/before));dragged=true;}else if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>4||dragged){const dx=(next.x-old.x)/camera.scale,dy=(next.y-old.y)/camera.scale;camera.x-=(dx*.55-dy*.62)/.712;camera.y-=(dy*.9+dx*.35)/.712;dragged=true;}pointers.set(e.pointerId,next);draw();};
canvas.onpointerup=e=>{if(!dragged&&pointers.size===1)walk(selected,unproject({x:e.clientX,y:e.clientY}));pointers.delete(e.pointerId);draw();};canvas.onpointercancel=e=>pointers.delete(e.pointerId);
canvas.onwheel=e=>{e.preventDefault();const before=unproject({x:e.clientX,y:e.clientY});camera.scale=Math.min(25,Math.max(.25,camera.scale*Math.exp(-e.deltaY*.001)));const after=unproject({x:e.clientX,y:e.clientY});camera.x+=before.x-after.x;camera.y+=before.y-after.y;draw();};
canvas.onkeydown=e=>{const a=actors.find(a=>a.id===selected),delta={ArrowUp:[0,-5],ArrowDown:[0,5],ArrowLeft:[-5,0],ArrowRight:[5,0]}[e.key];if(delta){e.preventDefault();walk(selected,{x:a.x+delta[0],y:a.y+delta[1]});}};
window.addEventListener('resize',()=>{resize();draw();});document.addEventListener('visibilitychange',()=>{last=0;});
resize();fit();await loadArt({all:true});status('Whole 1836 compound · published approximate dimensions · room partitions reconstructed.');
// Useful bounded test seam. It manipulates this unsaved workshop only.
window.__alamoStudy={walk,focusRoom,reset,layout,getDamage:()=>damage,draw};
function frame(stamp){const dt=last?Math.min(100,stamp-last):0;last=stamp;if(playing&&!document.hidden){time+=dt;for(let i=0;i<actors.length;i++){const a=actors[i];if(a.emergeTarget&&time-a.gestureAt>=1400){const target=a.emergeTarget;delete a.emergeTarget;delete a.gesture;walk(a.id,target);a.sayAfter=true;walk('officer-study',{x:35,y:61});}if(!a.path)continue;a.distance+=dt/1000*4;actors[i]=moveActor(a,a.path,a.distance);if(a.distance>=pathLength(a.path)){delete actors[i].path;if(study&&a.id==='joe-study')actors[i].hiding=true;if(a.sayAfter){actors[i].gesture='speak';actors[i].gestureAt=time;delete actors[i].sayAfter;}}}}if(stamp-paint>80){draw();paint=stamp;}requestAnimationFrame(frame);}requestAnimationFrame(frame);draw();
