// A complete schematic 1836 compound in feet, not another game world.
// Published envelope dimensions: Alamo educator packet pp. 8–10. Internal room
// partitions/door locations are explicit reconstruction; see docs/ALAMO_LAYOUT.md.
const rooms=[], walls=[], doors=[], roofs=[];
const wall=(id,a,b,options={})=>walls.push({id,a,b,thickness:2.5,heightFeet:10,material:'limestone',...options});
function room(id,label,x,y,width,height,entry='e',options={}) {
  const r={id,label,x,y,width,height,reconstruction:true,...options}; rooms.push(r);
  const points=[{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
  ['n','e','s','w'].forEach((side,i)=>wall(`${id}-${side}`,points[i],points[(i+1)%4],{roomId:id,heightFeet:options.wallHeight||10}));
  const opening=entry==='n'||entry==='s'?{x:x+width/2-3,y:(entry==='n'?y:y+height)-3,width:6,height:6}:{x:(entry==='w'?x:x+width)-3,y:y+height/2-3,width:6,height:6};
  doors.push({id:`${id}-door`,roomId:id,...opening});
  if(options.roof!==false) roofs.push({id:`${id}-roof`,roomId:id,x,y,width,height});
  return r;
}
// The published plan is slightly tapered. Long edges are kept in the same north-up
// plane; named dimensional constraints, not bitmap proportions, determine the scale.
const northWidth=243.75, westLength=537+5/12;
for(let i=0;i<12;i++)wall(`north-${i}`,{x:northWidth*i/12,y:27*i/12},{x:northWidth*(i+1)/12,y:27*(i+1)/12},{destructible:true,thickness:3});
wall('west-perimeter',{x:0,y:0},{x:0,y:westLength});
wall('south-perimeter',{x:0,y:westLength},{x:200,y:westLength});
doors.push({id:'south-gate',roomId:'south-entry',x:96,y:westLength-5,width:10,height:10});
wall('east-north',{x:northWidth,y:27},{x:230.92,y:190});
wall('east-south',{x:211,y:381.12},{x:200,y:westLength});
wall('palisade-south',{x:200,y:westLength},{x:291,y:418},{material:'timber',thickness:1.5,heightFeet:8});
// West ranges and north quarters: room subdivisions are navigable placeholders,
// not an assertion of exact occupancy or a surviving floor plan.
for(let i=0;i<9;i++)room(`west-room-${i+1}`,i===0?'Travis / Joe quarters · reconstructed':i===1?'Officers’ quarters':`West range · room ${i+1}`,5,42+i*45,25,38,'e');
room('north-quarter','North range · artillery quarters',50,32,55,24,'s');
room('north-store','North range · stores',117,40,54,24,'s');
const longLength=191+1/12+3/8/12, longWidth=19+11/12;
for(let i=0;i<6;i++)room(`long-barrack-${i+1}`,`Long Barrack · room ${i+1}`,211,190+i*longLength/6,longWidth,longLength/6,'w');
room('pen-cattle','Cattle pen / former garden',230.92,190,148,74,'w',{roof:false,wallHeight:6});
room('pen-horse','Horse pen / former garden',230.92,264,148,85,'w',{roof:false,wallHeight:6});
// Openings through the long range into both stock pens.
doors.push({id:'cattle-through',x:207,y:223,width:28,height:8},{id:'horse-through',x:207,y:302,width:28,height:8});
room('hospital','Hospital / convento room',238,354,42,26,'w');
room('kitchen','Kitchen',171,423,22,20,'w');
room('low-west','Low Barrack · west room',55,westLength-17,41,17,'n');
room('south-entry','Low Barrack · gate passage',96,westLength-17,10,17,'n');
room('low-east','Low Barrack · east room',106,westLength-17,63,17,'n');
// Church runs west-to-east. Footprint approximately 105'8¼" × 62'11⅜".
// Nave/transepts/chancel are a union of open volumes with traversable connections.
const churchX=291, churchY=355, churchLength=105+8/12+.25/12, churchWidth=62+11/12+.375/12;
const naveY=churchY+(churchWidth-25.25)/2;
room('church-nave','Church · roofless nave',churchX,naveY,61,25.25,'w',{roof:false,wallHeight:23});
room('church-transept','Church · transepts',352,churchY,26,churchWidth,'w',{roof:false,wallHeight:23});
room('church-chancel','Church · chancel',378,naveY,churchLength-87,25.25,'w',{roof:false,wallHeight:23});
doors.push({id:'nave-transept',x:348,y:389,width:9,height:8},{id:'transept-chancel',x:374,y:389,width:9,height:8});
room('sacristy','Sacristy · survivors’ refuge',310,naveY-25,32.6,15.5,'s',{wallHeight:12});
room('church-side-room','Church · side room',306,naveY-9.5,27,9.5,'s',{roof:false});
doors.push({id:'sacristy-through',x:318,y:naveY-13,width:8,height:17});
room('confessional','Church · confessional',churchX,naveY-12,12,12,'s',{roof:false,wallHeight:12});
room('baptistry','Church · baptistry',churchX,naveY+25.25,12,12,'n',{roof:false,wallHeight:12});
// A powder store adjoining the east stock-pen wall (placement is schematic).
room('powder-store','Powder store · reconstructed',363,322,15.92,27,'w',{wallHeight:8});
const ground=[{id:'plaza',label:'Main plaza',points:[{x:0,y:0},{x:northWidth,y:27},{x:230.92,y:190},{x:211,y:381.12},{x:200,y:westLength},{x:0,y:westLength}]},{id:'east-court',label:'East court',points:[{x:211,y:190},{x:378.92,y:190},{x:378.92,y:349},{x:396.69,y:380},{x:396.69,y:405.25},{x:291,y:418},{x:200,y:westLength}]}];
export const ALAMO_LAYOUT={id:'alamo-1836-study',units:'ft',referenceHeightFeet:5.7,bounds:{x:-32,y:-32,width:464,height:605},rooms,walls,doors,roofs,ground,
  dimensions:{northWallFeet:243.75,westWallFeet:westLength,longBarrackLengthFeet:longLength,longBarrackWidthFeet:longWidth,churchLengthFeet:churchLength,churchWidthFeet:churchWidth},
  annotations:[{x:122,y:2,label:'NORTH WALL'},{x:120,y:285,label:'MAIN PLAZA'},{x:120,y:550,label:'SOUTH GATE'},{x:327,y:180,label:'STOCK PENS'},{x:353,y:435,label:'ROOFLESS CHURCH'}],
  props:[{sprite:'alamo-water-jar',x:10,y:48,height:3},{sprite:'alamo-cot-blanket',x:12,y:74,height:5},{sprite:'alamo-table',x:23,y:51,height:4},{sprite:'alamo-chest-closed',x:24,y:75,height:3},{sprite:'alamo-stool',x:20,y:54,height:2.5},{sprite:'crate',x:88,y:41,height:3},{sprite:'sacks',x:130,y:53,height:3},{sprite:'alamo-pot',x:182,y:433,height:2.5},{sprite:'alamo-firewood',x:174,y:440,height:3},{sprite:'alamo-cot-blanket',x:252,y:372,height:5},{sprite:'bandage-roll',x:258,y:367,height:1.5},{sprite:'alamo-straw-pallet',x:320,y:363,height:3},{sprite:'cannon-iron-n',x:117,y:31,height:5.5},{sprite:'cannon-iron-e',x:371,y:389,height:5.5},{sprite:'cannon-iron-w',x:36,y:502,height:5.5}],
  source:'https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-4th-grade-lesson-plan.pdf',
  note:'Schematic complete compound in real feet. Room partitions, door positions and props are reconstructed; dimensions are published approximations, not exact archaeological measurements.'};
export function createDamageState(){return {version:0,walls:Object.fromEntries(walls.filter(w=>w.destructible).map(w=>[w.id,100]))};}
export function damageWall(state,id,amount){if(!(id in state.walls)||!Number.isFinite(amount)||amount<0)throw new Error('Invalid destructible wall damage');state.walls[id]=Math.max(0,state.walls[id]-amount);state.version++;return state.walls[id];}
export const roomCenter=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
function inRect(p,r,pad=0){return p.x>=r.x+pad&&p.x<=r.x+r.width-pad&&p.y>=r.y+pad&&p.y<=r.y+r.height-pad;}
export function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function isWalkable(p,state,{radius=.65}={}) {
  if(!inRect(p,ALAMO_LAYOUT.bounds,radius))return false;
  for(const w of walls){if(w.destructible&&state.walls[w.id]===0)continue;
    if(distanceToSegment(p,w.a,w.b)<w.thickness/2+radius&&!doors.some(d=>inRect(p,d,radius)))return false;
  }return true;
}
const grids=new WeakMap();
function walkGrid(state,radius){const cached=grids.get(state);if(cached?.version===state.version&&cached.radius===radius)return cached;
  const cell=2,b=ALAMO_LAYOUT.bounds,cols=Math.floor(b.width/cell)+1,rows=Math.floor(b.height/cell)+1,open=new Uint8Array(cols*rows);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)open[y*cols+x]=isWalkable({x:b.x+x*cell,y:b.y+y*cell},state,{radius})?1:0;
  const grid={version:state.version,radius,cell,cols,rows,open};grids.set(state,grid);return grid;
}
export function findPath(start,end,state,{radius=.65}={}){
  if(!isWalkable(start,state,{radius})||!isWalkable(end,state,{radius}))return null;
  const g=walkGrid(state,radius),b=ALAMO_LAYOUT.bounds;
  const index=p=>Math.round((p.y-b.y)/g.cell)*g.cols+Math.round((p.x-b.x)/g.cell), point=i=>({x:b.x+i%g.cols*g.cell,y:b.y+Math.floor(i/g.cols)*g.cell});
  const nearest=p=>{const i=index(p);if(g.open[i])return i;let best=-1,dist=Infinity;for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const n=i+y*g.cols+x;if(g.open[n]){const q=point(n),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<dist){best=n;dist=d;}}}return best;};
  const s=nearest(start),target=nearest(end);if(s<0||target<0)return null;
  const parent=new Int32Array(g.open.length);parent.fill(-1);const queue=new Int32Array(g.open.length);let head=0,tail=0;queue[tail++]=s;parent[s]=s;
  while(head<tail&&parent[target]===-1){const i=queue[head++];for(const n of [i-1,i+1,i-g.cols,i+g.cols]){if(n<0||n>=g.open.length||!g.open[n]||parent[n]!==-1||Math.abs(n%g.cols-i%g.cols)>1)continue;const a=point(i),c=point(n);if(!isWalkable({x:(a.x+c.x)/2,y:(a.y+c.y)/2},state,{radius}))continue;parent[n]=i;queue[tail++]=n;}}
  if(parent[target]===-1)return null;
  const path=[];for(let n=target;;n=parent[n]){path.push(point(n));if(n===s)break;}path.reverse();
  const compact=[{...start}];for(let i=1;i<path.length-1;i++){const a=path[i-1],p=path[i],c=path[i+1];if((p.x-a.x)*(c.y-p.y)!==(p.y-a.y)*(c.x-p.x))compact.push(p);}compact.push({...end});return compact;
}
export function moveActor(actor,path,distanceFeet){if(!path?.length)return actor;let remaining=Math.max(0,distanceFeet);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(remaining<=length){const f=length?remaining/length:1;return {...actor,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,heading:Math.abs(b.y-a.y)>Math.abs(b.x-a.x)?b.y>a.y?'s':'n':b.x>a.x?'e':'w'};}remaining-=length;}return {...actor,...path.at(-1)};}
export const pathLength=path=>(path||[]).slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
