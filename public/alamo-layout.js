// A complete schematic 1836 compound in feet, not another game world.
// Published envelope dimensions: Alamo educator packet pp. 8–10; the west range, the outer walls' thickness and height
// and the church's walls from the sources in HISTORY.md HIST-TEX-090 to HIST-TEX-092 (2026-09-18). Internal room
// partitions/door locations are explicit reconstruction; see docs/ALAMO_LAYOUT.md.
const rooms=[], walls=[], doors=[], roofs=[];
const wall=(id,a,b,options={})=>walls.push({id,a,b,thickness:2.5,heightFeet:10,material:'limestone',...options});
function room(id,label,x,y,width,height,entry='e',options={}) {
  const r={id,label,x,y,width,height,reconstruction:true,...options}; rooms.push(r);
  const points=[{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}],thickness=options.wallThickness||2.5;
  ['n','e','s','w'].forEach((side,i)=>wall(`${id}-${side}`,points[i],points[(i+1)%4],{roomId:id,heightFeet:options.wallHeight||10,thickness}));
  // An opening goes right through the wall it is cut in: six feet deep through the ordinary 2½-foot walls.
  const deep=Math.max(6,thickness+3.5);
  const opening=entry==='n'||entry==='s'?{x:x+width/2-3,y:(entry==='n'?y:y+height)-deep/2,width:6,height:deep}:{x:(entry==='w'?x:x+width)-deep/2,y:y+height/2-3,width:deep,height:6};
  doors.push({id:`${id}-door`,roomId:id,...opening});
  if(options.roof!==false) roofs.push({id:`${id}-roof`,roomId:id,x,y,width,height});
  return r;
}
// The published plan is slightly tapered. Long edges are kept in the same north-up
// plane; named dimensional constraints, not bitmap proportions, determine the scale.
// A wall stands on its centre line, so its faces lie half its thickness either side.
const northWidth=243.75, westLength=537+5/12;
// The outer walls: 33 inches of adobe where Ivey dug the west wall, 12½ ft high along the west rooms and about 7 ft from
// them south to the south-west corner (HIST-TEX-092). The north wall's 3 ft is the reconstruction's own.
const outerWall=2.75, westRoomsEnd=42+9*45;
for(let i=0;i<12;i++)wall(`north-${i}`,{x:northWidth*i/12,y:27*i/12},{x:northWidth*(i+1)/12,y:27*(i+1)/12},{destructible:true,thickness:3});
wall('west-perimeter',{x:0,y:0},{x:0,y:westRoomsEnd},{thickness:outerWall,heightFeet:12.5});
wall('west-perimeter-south',{x:0,y:westRoomsEnd},{x:0,y:westLength},{thickness:outerWall,heightFeet:7});
wall('south-perimeter',{x:0,y:westLength},{x:200,y:westLength},{thickness:outerWall});
doors.push({id:'south-gate',roomId:'south-entry',x:96,y:westLength-5,width:10,height:10});
wall('east-north',{x:northWidth,y:27},{x:230.92,y:190},{thickness:outerWall});
wall('east-south',{x:211,y:381.12},{x:200,y:westLength},{thickness:outerWall});
wall('palisade-south',{x:200,y:westLength},{x:291,y:418},{material:'timber',thickness:1.5,heightFeet:8});
// West ranges and north quarters: room subdivisions are navigable placeholders,
// not an assertion of exact occupancy or a surviving floor plan. The west range measures 16 ft 9 in from the west wall's
// outer face to the east face of its inner wall (HIST-TEX-092), so its rooms back onto the west wall.
const westRangeDepth=16.75, westRoomWidth=westRangeDepth-outerWall/2-2.5/2;
for(let i=0;i<9;i++)room(`west-room-${i+1}`,i===0?'Travis / Joe quarters · reconstructed':i===1?'Officers’ quarters':`West range · room ${i+1}`,0,42+i*45,westRoomWidth,45,'e',{wallHeight:12.5});
room('north-quarter','North range · artillery quarters',50,32,55,24,'s');
room('north-store','North range · stores',117,40,54,24,'s');
// The convento's west range, two storeys in 1836 (HIST-TEX-091): 191'1⅜" × 19'11" to its outer faces, which are the plaza's
// and the pens' edges (x 211 to 230.92, y 190 on), so its rooms' walls stand 1¼ ft inside them.
const longLength=191+1/12+3/8/12, longWidth=19+11/12, longHeight=18, inside=1.25, longRoom=(longLength-2*inside)/6;
for(let i=0;i<6;i++)room(`long-barrack-${i+1}`,`Long Barrack · room ${i+1}`,211+inside,190+inside+i*longRoom,longWidth-2*inside,longRoom,'w',{wallHeight:longHeight});
room('pen-cattle','Cattle pen / former garden',230.92,190,148,74,'w',{roof:false,wallHeight:6});
room('pen-horse','Horse pen / former garden',230.92,264,148,85,'w',{roof:false,wallHeight:6});
// Openings through the long range into both stock pens.
doors.push({id:'cattle-through',x:207,y:223,width:28,height:8},{id:'horse-through',x:207,y:302,width:28,height:8});
room('hospital','Hospital / convento room',238,354,42,26,'w');
room('kitchen','Kitchen',171,423,22,20,'w');
// The low barrack, 114 ft by 17 to its outer faces (HIST-TEX-091), from x 55; its south face is the compound's.
const lowSouth=westLength+outerWall/2, lowNorth=lowSouth-17+inside, lowDeep=17-2*inside;
room('low-west','Low Barrack · west room',55+inside,lowNorth,96-55-inside,lowDeep,'n');
room('south-entry','Low Barrack · gate passage',96,lowNorth,10,lowDeep,'n');
room('low-east','Low Barrack · east room',106,lowNorth,169-inside-106,lowDeep,'n');
// Church runs west-to-east. Its outer faces enclose 105'8¼" × 62'11⅜" (HIST-TEX-090) from its front at x 291 (the
// church's point on the map, public/bexar-layout.js ALAMO_FRONT) and its north face at y 355. Its walls are 4 ft of
// limestone and 22½ ft high, so their centre lines stand 2 ft inside those faces.
// Nave/transepts/chancel are a union of open volumes with traversable connections.
const churchX=291, churchY=355, churchLength=105+8/12+.25/12, churchWidth=62+11/12+.375/12, churchWall=4, churchHeight=22.5;
const inX=churchX+churchWall/2, inY=churchY+churchWall/2, outX=churchX+churchLength-churchWall/2, outY=churchY+churchWidth-churchWall/2;
// The nave is 25¼ ft clear between its walls, on the church's middle line.
const naveY=churchY+churchWidth/2-25.25/2-churchWall/2, naveH=25.25+churchWall, masonry={wallThickness:churchWall};
room('church-nave','Church · roofless nave',inX,naveY,352-inX,naveH,'w',{roof:false,wallHeight:churchHeight,...masonry});
room('church-transept','Church · transepts',352,inY,26,outY-inY,'w',{roof:false,wallHeight:churchHeight,...masonry});
room('church-chancel','Church · chancel',378,naveY,outX-378,naveH,'w',{roof:false,wallHeight:churchHeight,...masonry});
doors.push({id:'nave-transept',x:348,y:389,width:9,height:8},{id:'transept-chancel',x:374,y:389,width:9,height:8});
// The sacristy and a side room stand between the nave and the church's north face, inside its envelope.
room('sacristy','Sacristy · survivors’ refuge',310,inY,32.6,naveY-inY,'s',{wallHeight:12,...masonry});
room('church-side-room','Church · side room',342.6,inY,352-342.6,naveY-inY,'s',{roof:false,wallHeight:12,...masonry});
doors.push({id:'sacristy-through',x:318,y:naveY-5,width:8,height:10});
room('confessional','Church · confessional',inX,naveY-12,12,12,'s',{roof:false,wallHeight:12,...masonry});
room('baptistry','Church · baptistry',inX,naveY+naveH,12,12,'n',{roof:false,wallHeight:12,...masonry});
// A powder store adjoining the east stock-pen wall (placement is schematic).
room('powder-store','Powder store · reconstructed',363,322,15.92,27,'w',{wallHeight:8});
const ground=[{id:'plaza',label:'Main plaza',points:[{x:0,y:0},{x:northWidth,y:27},{x:230.92,y:190},{x:211,y:381.12},{x:200,y:westLength},{x:0,y:westLength}]},{id:'east-court',label:'East court',points:[{x:211,y:190},{x:378.92,y:190},{x:378.92,y:349},{x:396.69,y:380},{x:396.69,y:405.25},{x:291,y:418},{x:200,y:westLength}]}];
export const ALAMO_LAYOUT={id:'alamo-1836-study',units:'ft',referenceHeightFeet:5.7,bounds:{x:-32,y:-32,width:464,height:605},rooms,walls,doors,roofs,ground,
  dimensions:{northWallFeet:243.75,westWallFeet:westLength,longBarrackLengthFeet:longLength,longBarrackWidthFeet:longWidth,longBarrackHeightFeet:longHeight,
    churchLengthFeet:churchLength,churchWidthFeet:churchWidth,churchWallFeet:churchWall,churchHeightFeet:churchHeight,churchCorner:{x:churchX,y:churchY},
    lowBarrackLengthFeet:114,lowBarrackDepthFeet:17,westRangeDepthFeet:westRangeDepth,outerWallFeet:outerWall,claims:['HIST-TEX-090','HIST-TEX-091','HIST-TEX-092']},
  annotations:[{x:122,y:2,label:'NORTH WALL'},{x:120,y:285,label:'MAIN PLAZA'},{x:120,y:550,label:'SOUTH GATE'},{x:327,y:180,label:'STOCK PENS'},{x:353,y:435,label:'ROOFLESS CHURCH'}],
  props:[{sprite:'alamo-water-jar',x:4,y:47,height:3},{sprite:'alamo-cot-blanket',x:8,y:76,height:5},{sprite:'alamo-table',x:9,y:52,height:4},{sprite:'alamo-chest-closed',x:4,y:82,height:3},{sprite:'alamo-stool',x:5,y:56,height:2.5},{sprite:'crate',x:88,y:41,height:3},{sprite:'sacks',x:130,y:53,height:3},{sprite:'alamo-pot',x:182,y:433,height:2.5},{sprite:'alamo-firewood',x:174,y:440,height:3},{sprite:'alamo-cot-blanket',x:252,y:372,height:5},{sprite:'bandage-roll',x:258,y:367,height:1.5},{sprite:'alamo-straw-pallet',x:320,y:365,height:3},{sprite:'cannon-iron-n',x:117,y:31,height:5.5},{sprite:'cannon-iron-e',x:371,y:389,height:5.5},{sprite:'cannon-iron-w',x:36,y:502,height:5.5}],
  source:'https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-4th-grade-lesson-plan.pdf',
  note:'Schematic complete compound in real feet. Room partitions, door positions and props are reconstructed; dimensions are published approximations, not exact archaeological measurements.'};
/**
 * The compound as the map draws it (public/bexar-art.js, 2026-09-18): what stands, in the plan's feet, and nothing else.
 * - `blocks`: the roofed buildings, a range of rooms as one building - the west range, the long barrack, the low barrack
 *   with its gate - each to its walls' outer faces, with the room divisions as `seams` across the roof and `openings` in its
 *   south face.
 * - `walls`: what stands without a roof: the outer walls, the palisade, the pens' walls and the roofless church's shell.
 *   The church's walls are its outline only, where church lies on one side and not the other: its nave, crossing and chancel
 *   were one open space. Each wall is a run along its centre line.
 * - `floors`: open ground inside - the plaza, the east court, the pens and the church.
 */
const RANGES={'west-room-':'west-range','long-barrack-':'long-barrack','low-':'low-barrack','south-entry':'low-barrack'};
const RANGE_NAMES={'west-range':'West range','long-barrack':'Long Barrack','low-barrack':'Low Barrack'};
const CHURCH=/^(church-|confessional|baptistry)/;
export function alamoMassing(layout=ALAMO_LAYOUT){
  const byId=new Map(layout.rooms.map(r=>[r.id,r])),thick=id=>layout.walls.find(w=>w.roomId===id)?.thickness||2.5;
  const blocks=new Map();
  for(const r of layout.rooms){if(r.roof===false)continue;
    const id=Object.entries(RANGES).find(([prefix])=>r.id.startsWith(prefix))?.[1]||r.id,t=thick(r.id)/2;
    const face={x0:r.x-t,y0:r.y-t,x1:r.x+r.width+t,y1:r.y+r.height+t},block=blocks.get(id);
    if(!block){blocks.set(id,{id,label:RANGE_NAMES[id]||r.label,...face,height:r.wallHeight||10,rooms:[r.id],seams:[],openings:[]});continue;}
    Object.assign(block,{x0:Math.min(block.x0,face.x0),y0:Math.min(block.y0,face.y0),x1:Math.max(block.x1,face.x1),y1:Math.max(block.y1,face.y1),height:Math.max(block.height,r.wallHeight||10)});
    block.rooms.push(r.id);
  }
  for(const block of blocks.values()){
    const rs=block.rooms.map(id=>byId.get(id)),across=block.x1-block.x0<block.y1-block.y0;
    // A division between two rooms of a range, as the line across the roof where their walls meet.
    for(const r of rs.slice(1))block.seams.push(across?{y:r.y}:{x:r.x});
    for(const d of layout.doors)if(d.id==='south-gate'&&block.rooms.includes(d.roomId))block.openings.push({x0:d.x,x1:d.x+d.width,id:d.id});
  }
  const church=layout.rooms.filter(r=>CHURCH.test(r.id)||r.id==='sacristy'),inside=p=>church.some(r=>p.x>r.x&&p.x<r.x+r.width&&p.y>r.y&&p.y<r.y+r.height);
  const walls=[];
  for(const w of layout.walls){
    const room=w.roomId&&byId.get(w.roomId);
    if(room&&room.roof!==false)continue;
    if(!room||!CHURCH.test(room.id)){walls.push({id:w.id,a:w.a,b:w.b,thickness:w.thickness,height:w.heightFeet,material:w.material});continue;}
    // The church's outline: a foot at a time, kept where one side is church and the other is not.
    const dx=w.b.x-w.a.x,dy=w.b.y-w.a.y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length,off=w.thickness/2+.5;
    let run=null;const close=()=>{if(run&&run.to-run.from>.5)walls.push({id:`${w.id}@${run.from.toFixed(0)}`,a:{x:w.a.x+dx*run.from/length,y:w.a.y+dy*run.from/length},b:{x:w.a.x+dx*run.to/length,y:w.a.y+dy*run.to/length},thickness:w.thickness,height:w.heightFeet,material:w.material});run=null;};
    for(let s=0;s<=length;s+=.5){
      const p={x:w.a.x+dx*s/length,y:w.a.y+dy*s/length},outline=inside({x:p.x+nx*off,y:p.y+ny*off})!==inside({x:p.x-nx*off,y:p.y-ny*off});
      if(outline){if(!run)run={from:Math.max(0,s-.25),to:s};run.to=Math.min(length,s+.25);}else close();
    }close();
  }
  const rect=r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
  const floors=[...layout.ground.map(g=>({id:g.id,kind:g.id,points:g.points})),...layout.rooms.filter(r=>r.roof===false).map(r=>({id:r.id,kind:r.id.startsWith('pen-')?'pen':'church',points:rect(r)}))];
  return {blocks:[...blocks.values()],walls,floors};
}
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
