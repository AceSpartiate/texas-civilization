import { ALAMO_LAYOUT, distanceToSegment } from './alamo-layout.js';

// Art reconstruction from the owner's Nelson panorama, not a cadastral survey.
// Coordinates are feet in a north-up local plane; positive y points south.
const buildings = [], props = [];
const plazas = [
  { id:'plaza-armas', label:'Plaza de Armas', x:720,y:1840,width:340,height:350 },
  { id:'plaza-islas', label:'Plaza de las Islas', x:1240,y:1840,width:360,height:350 },
  { id:'plaza-valero', label:'Plaza de Valero', x:2630,y:1140,width:310,height:250 },
];
const river = { id:'san-antonio-river',label:'San Antonio River',widthFeet:64,points:[
  {x:2010,y:0},{x:1900,y:280},{x:2050,y:540},{x:1900,y:780},
  {x:2040,y:1000},{x:2220,y:1160},{x:2230,y:1420},{x:2030,y:1530},
  {x:1900,y:1740},{x:1990,y:1970},{x:2290,y:2170},{x:2510,y:2150},
  {x:2730,y:2310},{x:2780,y:2580},{x:2590,y:2760},{x:2300,y:2700},
  {x:2170,y:2480},{x:1980,y:2540},{x:1940,y:2800},{x:2080,y:3120},{x:2040,y:3400},
]};
const roads = [
  {id:'plaza-north-lane',widthFeet:42,points:[{x:350,y:1780},{x:1750,y:1780},{x:2030,y:1530}]},
  {id:'plaza-south-lane',widthFeet:42,points:[{x:350,y:2250},{x:1700,y:2250}]},
  {id:'west-road',widthFeet:36,points:[{x:0,y:2040},{x:720,y:2040}]},
  {id:'north-road',widthFeet:36,points:[{x:570,y:600},{x:570,y:2760}]},
  {id:'south-road',widthFeet:36,points:[{x:1420,y:2190},{x:1420,y:3400}]},
  {id:'east-town-lane',widthFeet:32,points:[{x:1720,y:1410},{x:1720,y:2740}]},
  {id:'valero-crossing-road',widthFeet:36,points:[{x:1600,y:2015},{x:1790,y:1660},{x:2030,y:1530},{x:2420,y:1480},{x:2780,y:1300},{x:2750,y:1087}]},
  {id:'alameda',widthFeet:46,points:[{x:2780,y:1300},{x:3200,y:1480},{x:3990,y:1480}]},
  {id:'villita-lane',widthFeet:30,points:[{x:2420,y:1480},{x:2530,y:1760},{x:3010,y:1980},{x:3340,y:2440}]},
];
function building(id,sprite,x,y,heightFeet=62,label){buildings.push({id,sprite,x,y,heightFeet,...(label&&{label}),reconstruction:true});}
// Named civic structures retain their place in the composition, but use generic
// library silhouettes. They are not exact architectural portraits.
// stand-in: Request 2026-09-14 — Béxar civic architecture; researched 1836 façade pending.
building('san-fernando','chapel',1150,2020,105,'San Fernando Church');
building('governors-palace','adobe-flat',650,1980,80,'Governor’s Palace');
building('town-hall','trading-house',905,2285,82,'Civic buildings · reconstructed');
let serial=0;
const homes=['adobe-flat','adobe-tile','adobe-flat','adobe-flat','trading-house'];
function frontage(id,positions){for(const [x,y] of positions)building(`${id}-${++serial}`,homes[serial%homes.length],x,y,57+(serial%3)*6);}
// Open plaza interiors and connected lanes remain clear of building sprites.
for(const plaza of plazas.slice(0,2)){
  frontage(plaza.id+'-north',Array.from({length:5},(_,i)=>[plaza.x+20+i*75,plaza.y-70]));
  frontage(plaza.id+'-south',Array.from({length:5},(_,i)=>[plaza.x+20+i*75,plaza.y+plaza.height+120]));
}
frontage('western-lane',Array.from({length:10},(_,i)=>[430,1280+i*125]));
frontage('outer-west',Array.from({length:7},(_,i)=>[255,1450+i*140]));
frontage('eastern-lane',Array.from({length:7},(_,i)=>[1660,1570+i*145]));
frontage('north-neighbourhood',Array.from({length:10},(_,i)=>[760+(i%5)*185,1430+Math.floor(i/5)*170]));
frontage('south-neighbourhood',Array.from({length:10},(_,i)=>[770+(i%5)*180,2570+Math.floor(i/5)*210]));
frontage('valero-houses',[[2490,1240],[2520,1390],[3000,1260],[3100,1370]]);
frontage('la-villita',[[2530,1590],[2720,1700],[2900,1800],[3100,1890],[3060,2130],[3210,2180],[3280,2380]]);
building('villita-jacal-1','house-jacal',3260,2560,57);
building('villita-jacal-2','house-jacal',3470,2460,61);

export function riverDistance(point){return Math.min(...river.points.slice(1).map((p,i)=>distanceToSegment(point,river.points[i],p)));}
// Repeatable vegetation: only fixed arithmetic, never Math.random(). Riverbank
// trees are clustered along both banks with clear water between them.
for(let i=1;i<river.points.length;i++){
  const a=river.points[i-1],b=river.points[i],length=Math.hypot(b.x-a.x,b.y-a.y);
  for(let j=0;j<Math.ceil(length/100);j++)for(const side of [-1,1]){
    const t=(j+.5)/Math.ceil(length/100),offset=65+(i+j)%3*15;
    const x=a.x+(b.x-a.x)*t-side*(b.y-a.y)/length*offset;
    const y=a.y+(b.y-a.y)*t+side*(b.x-a.x)/length*offset;
    if(roads.some(r=>r.points.slice(1).some((p,k)=>distanceToSegment({x,y},r.points[k],p)<65)))continue;
    if(buildings.some(p=>Math.hypot(p.x-x,p.y-y)<85))continue;
    props.push({id:`bank-tree-${i}-${j}-${side}`,sprite:(i+j)%3?'cottonwood':'pecan',x,y,heightFeet:40+(i+j)%4*5});
  }
}
for(let i=0;i<12;i++)for(const side of [-1,1])props.push({id:`alameda-tree-${i}-${side}`,sprite:'cottonwood',x:3220+i*62,y:1480+side*75,heightFeet:46});
const alamo = {x:2650,y:550,rotation:0,layout:ALAMO_LAYOUT};
export function alamoToBexar(point){const angle=alamo.rotation*Math.PI/180;return {x:alamo.x+point.x*Math.cos(angle)-point.y*Math.sin(angle),y:alamo.y+point.x*Math.sin(angle)+point.y*Math.cos(angle)};}
export function bexarToAlamo(point){const angle=-alamo.rotation*Math.PI/180,x=point.x-alamo.x,y=point.y-alamo.y;return {x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};}
export const BEXAR_LAYOUT = {
  id:'bexar-1836-reconstruction',units:'ft',bounds:{x:0,y:0,width:4000,height:3400},
  plazas,river,roads,buildings,props,alamo,
  crossings:[{id:'valero-crossing',x:2030,y:1530,label:'River crossing · reconstructed'}],
  annotations:[{x:890,y:2010,label:'PLAZA DE ARMAS'},{x:1420,y:2010,label:'PLAZA DE LAS ISLAS'},
    {x:1150,y:2090,label:'SAN FERNANDO'},{x:2790,y:1280,label:'PLAZA DE VALERO'},
    {x:2830,y:470,label:'THE ALAMO'},{x:3500,y:1380,label:'ALAMEDA'},{x:3120,y:2300,label:'LA VILLITA'}],
  sources:[{title:'User-supplied San Antonio de Bexar 1836 panorama, George Nelson, GLO map 83600',url:'https://historictexasmaps.com/collection/search-results/83600-san-antonio-de-bexar-1836-general-map-collection'},
    {title:'User-supplied aerial Alamo reconstruction',file:'Screenshot 2026-09-14 162509.png'}],
  note:'Illustrated reconstruction from the supplied references. Streets, river course, building count, dimensions and plots are interpretive, not surveyed 1836 geography. Generic existing artwork stands in for named civic architecture. No historical household occupancy or battle state is inferred.',
};

/**
 * Where the reconstruction is laid on the map (2026-09-17, docs/MAP_ACCURACY.md §7). The owner's Nelson panorama is drawn in
 * its own feet, north up as its author read it; the map is in miles from Béxar's site point.
 *
 * - **Anchor: the centre of the Plaza de las Islas**, which is Béxar's official point (Main Plaza, `HIST-TEX-010`). Until
 *   now the frame was pinned by a point 220 ft west of the plaza's west edge, so the whole town sat that much east - its
 *   eastern streets ran into the river.
 * - **Turn: 21.1 degrees clockwise**, so the Alamo church lies from the plaza on the bearing it truly has: 29.42583,
 *   -98.48611 (`HIST-TEX-085`), a little north of east. The panorama puts it well north of east - an oblique view read as
 *   north up. ceiling: the panorama also draws the church about three quarters of its true distance from the plaza
 *   (1,860 ft against about 2,470); the town is not stretched to meet it, so the church is drawn some 600 ft short.
 *
 * The map's own San Antonio through the town is this reconstruction's 1836 river, laid by the same frame
 * (scripts/build-colonies-map.mjs): the modern line there is the 1920s cut-off channel, which ran through the town's lots.
 */
const islas = plazas.find(plaza => plaza.id === 'plaza-islas');
export const BEXAR_FRAME = Object.freeze({ anchor: Object.freeze({ x: islas.x + islas.width / 2, y: islas.y + islas.height / 2 }), turn: 21.1 });
/** A point of the reconstruction, in feet, as miles east and south of Béxar's site point. */
export function bexarToSite(point) {
  const angle = BEXAR_FRAME.turn * Math.PI / 180, x = point.x - BEXAR_FRAME.anchor.x, y = point.y - BEXAR_FRAME.anchor.y;
  return { x: (x * Math.cos(angle) - y * Math.sin(angle)) / 5280, y: (x * Math.sin(angle) + y * Math.cos(angle)) / 5280 };
}
/**
 * A point of the Alamo compound's own north-up plan (public/alamo-layout.js) as miles from Béxar's site point. The town is
 * turned to lay the church on its bearing; the compound is turned back about the church's front, so the published plan keeps
 * its compass on the map - the north wall runs east and west, as the owner's plan of it shows (2026-09-17).
 */
export const ALAMO_FRONT = Object.freeze({ x: 291, y: 393 });
export function alamoOnMap(point) {
  const angle = -BEXAR_FRAME.turn * Math.PI / 180, x = point.x - ALAMO_FRONT.x, y = point.y - ALAMO_FRONT.y;
  return bexarToSite(alamoToBexar({ x: ALAMO_FRONT.x + x * Math.cos(angle) - y * Math.sin(angle), y: ALAMO_FRONT.y + x * Math.sin(angle) + y * Math.cos(angle) }));
}
