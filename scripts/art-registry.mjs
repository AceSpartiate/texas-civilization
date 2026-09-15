// Complete, reproducible art inventory, including unanimated state pieces and gaps.
import { readFileSync, writeFileSync } from 'node:fs';
import { ALAMO_LAYOUT } from '../public/alamo-layout.js';
import { BEXAR_LAYOUT } from '../public/bexar-layout.js';
const base = new URL('../public/assets/frontier-v1/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);
export const LOCATION_KITS = {
  gonzales: { label:'Gonzales', sprites:['cabin-small','cabin-wide','cabin-weathered','trading-house','shed-open','fence-rail','corn-young','corn-mature','cotton-young','cotton-mature','oak-broad','cannon-iron-e'], note:'Current schematic settlement. Cannon is illustrative, not an identification of a surviving gun.' },
  alamo: { label:'Alamo, 1836', sprites:['roofless-church-shell','stone-long-barrack','wall-straight','wall-corner','gate','earth-rampart','palisade','wall-breach','log-barricade','cannon-iron-n','cannon-bronze-w','roundshot','tent'], note:'Roofless church shell without the later rounded facade. Assemble a researched compound; these are modular illustrations, not a measured plan.' },
  san_antonio: { label:'San Antonio de Béxar', sprites:['courtyard-house','adobe-flat','adobe-tile','stone-tile-house','arcade','church-generic','wall-straight','gate','skiff','barrel','crate'], note:'Courtyard houses, plazas and river geography. Generic church is not an exact cathedral portrait.' },
  goliad: { label:'Goliad / La Bahía', sprites:['church-generic','barracks','stone-long-barrack','wall-straight','wall-corner','gate','earth-rampart','adobe-flat','wall-breach','tent'], note:'Presidio compound and old settlement; no modern courthouse. Chapel and walls require site-specific arrangement.' },
  liberty: { label:'Liberty', sprites:['cabin-small','cabin-wide','trading-house','storehouse','wharf','ferry-raft','skiff','barrel','sacks','cottonwood'], note:'Timber river town and landing. River width and crossing behavior come from world data.' },
  anahuac: { label:'Anahuac', sprites:['brick-fort-ruin','brick-barracks-ruin','brick-breach','wharf','timber-shop','cabin-small','reeds','ferry-raft'], note:'For September 1835 onward depict the disused ruined fort, not an operational cannon battery. Intact brick-bastion is for earlier researched context only.' },
  san_felipe: { label:'San Felipe', sprites:['frame-hall','timber-shop','cabin-wide','storehouse','cabin-ruin','packed-belongings','wagon-body-loaded'], note:'Timber settlement. Ruin/fire requires an authorized event, never decorative default burning.' },
  washington: { label:'Washington-on-the-Brazos', sprites:['frame-hall','timber-hall','cabin-small','trading-house','wharf','barrel'], note:'Modest frame meeting place and river settlement. No monumental capitol.' },
  san_jacinto: { label:'San Jacinto', sprites:['tent','lean-to','reeds','grass-tuft','oak-spreading','cannon-iron-e','limber','bedroll','crate'], note:'Prairie/marsh camps; no later monument. Reuse paired iron gun art symbolically for Twin Sisters; do not assert a disputed caliber.' },
  evacuation: { label:'Runaway Scrape / road camps', sprites:['wagon-body-covered','wagon-body-loaded','wagon-wheel','wagon-broken','ox-yoke','packed-belongings','bedroll','lean-to','cooking-pot','ferry-raft','water-ripple','bandage-roll'], note:'Reusable travel, aid and shelter kit; journeys, crowd knowledge and belongings remain persistent world state.' },
};
const FUTURE_WORK = [
  { id:'wagon-cardinal', scope:'Wagons/carts', delivered:'Three body variants with separate spinning wheels in E/W; static damaged wagon, carts and limber.', remaining:'N/S wagon/carts, articulated hitch/yoke and crew pushing/loading. Current oblique rig translates along any route without pretending to turn in 3D.' },
  { id:'people-actions', scope:'People', delivered:'Four cast variants, cardinal walking, E/W work/carry/sow/repair/search/trade, care pair, rest/injury poses; Joe walk/hide/emerge/speak/rest; mounted courier listening/speaking/letter offer/pointing.', remaining:'N/S work/dialogue action poses, turns, climbing, swimming, assisted walking/stretcher pairs, individual civilian riding/dismounting and final mounted cross-sheet registration. Dedicated mounted courier and dragoon travel already exist.' },
  { id:'family-cast', scope:'Families and riders', delivered:'One cast of four: a man (rust, reserved for the principal), a woman (teal), an elder man and an adolescent; no children.', remaining:'Requested 2026-09-12 in docs/ART_REQUESTS.md: children (girl, boy, small child, an infant in a basket), a second cast (a woman in the principal rust, a second woman, a younger man, an adolescent girl), the rider dismounting, remounting and talking on foot beside a tethered horse, and N/S dialogue facings for riders and the existing cast.' },
  { id:'animals', scope:'Animals', delivered:'Ox/chestnut horse/cow/pig cardinal walking and four-pose grazing; alternate animals have idle breathing only.', remaining:'Cream ox/grey horse/sheep/chicken locomotion, other species grazing, drinking, flight and load/harness behavior. Do not substitute a different coat mid-journey.' },
  { id:'artillery-service', scope:'Cannons and soldiers', delivered:'Cardinal iron gun poses, E/W iron/bronze carriage recoil, smoke, volunteer/regular aim-fire-load-ramrod and surrender, mounted marching.', remaining:'Crew serving/ramming a gun, limber/unlimber, elevated aim, mounted firing and remounting. Gun recoil is whole-carriage translation, not an articulated barrel rig.' },
  { id:'structural-states', scope:'Buildings and environment', delivered:'Modular intact/ruined/breached pieces, Alamo door/chest opening pairs and collapse sequence; ground-anchor wind and separate effects.', remaining:'Continuous door/gate hinge rig, construction/repair progression, crown-only tree rig, boat rowing/poling and ferry loading. Building stillness is intentional; condition changes require simulation state.' },
  { id:'cast-registration', scope:'Production finish', delivered:'Measured alpha frames and per-row logical heights for stable cycle scale.', remaining:'Generated pose proportions can drift between sheets. Hand-register additional transitions and final cast/period uniform variants as the game defines them. These are prototype assets, not exact historical portraits.' },
];
export function buildRegistry(atlas, animation) {
  const sources = JSON.parse(readFileSync(new URL('art-provenance.json', docs),'utf8')).assetSources;
  const clips = animation.clips;
  const locationKits=structuredClone(LOCATION_KITS);
  locationKits.alamo.sprites=[...new Set([...locationKits.alamo.sprites,...Object.keys(atlas.frames).filter(id=>id.startsWith('alamo-')||id.startsWith('joe-'))])];
  locationKits.alamo.assembly='/alamo-workshop.html';locationKits.alamo.layout='/alamo-layout.js';
  const assets = Object.fromEntries(Object.entries(atlas.frames).map(([id, frame]) => {
    const usedBy = Object.entries(clips).filter(([,clip]) => clip.frames.some(f=>f.sprite===id) || clip.parts?.some(p=>p.sprite===id)).map(([name])=>name);
    const classifications = [...new Set(usedBy.map(name=>clips[name].parts ? 'layered-rig' : clips[name].authored ? 'pose-frame-cycle' : clips[name].motion==='none' ? 'state-artwork' : 'procedural-motion'))];
    return [id, { ...frame, source:atlas.sheets[frame.sheet].image, status:'usable-prototype', classifications:classifications.length?classifications:['state-artwork'], clips:usedBy,
      locationKits:Object.entries(locationKits).filter(([,kit])=>kit.sprites.includes(id)).map(([name])=>name), promptId:`frontier-v1/${frame.sheet}` }];
  }));
  for (const kit of Object.values(LOCATION_KITS)) for (const id of kit.sprites) if (!assets[id]) throw new Error(`Location kit references missing sprite ${id}`);
  for (const name of Object.keys(atlas.sheets)) if (!sources.some(source=>source.sheet===name)) throw new Error(`Missing provenance for ${name}`);
  return { schemaVersion:1, library:'frontier-v1', maturity:'prototype',
    counts:{sheets:Object.keys(atlas.sheets).length,sprites:Object.keys(assets).length,clips:Object.keys(clips).length,poseCycles:Object.values(clips).filter(c=>c.authored).length,rigs:Object.values(clips).filter(c=>c.parts).length},
    entrypoints:{atlas:'atlas.json',animation:'animation.json',catalog:'/art-catalog.html',guide:'docs/ASSETS.md',provenance:'docs/art-provenance.json',prompts:'docs/art-prompts.json'},
    coordinateContract:{rectangles:'Source pixels; never assume equal grid slicing.',anchor:'Fractional ground contact within measured rectangle.',logicalHeight:'Requested height is scaled by logicalHeight when present, otherwise h.',directions:'North-up world: +x east, +y south. Action cycles face east and may mirror west unless direction says otherwise.',units:'Frame duration and display clock are milliseconds. Rigs use drawing-height-relative positions and turns/second.',authority:'Rendering never changes world state. No frame callbacks cause outcomes. Purge concealed actors; snap across time jumps. Buildings stay still.'},
    sheets:atlas.sheets, assets, clips, locationKits, excludedFrames:atlas.excludedFrames,
    assemblies:{bexar:{...BEXAR_LAYOUT,alamo:{x:BEXAR_LAYOUT.alamo.x,y:BEXAR_LAYOUT.alamo.y,rotation:0,assembly:'alamo'},layout:'/bexar-layout.js',preview:'/alamo-workshop.html'},alamo:{layout:'/alamo-layout.js',preview:'/alamo-workshop.html',units:'ft',referenceHeightFeet:ALAMO_LAYOUT.referenceHeightFeet,dimensions:ALAMO_LAYOUT.dimensions,rooms:ALAMO_LAYOUT.rooms,walls:ALAMO_LAYOUT.walls,doors:ALAMO_LAYOUT.doors,roofs:ALAMO_LAYOUT.roofs,props:ALAMO_LAYOUT.props,note:ALAMO_LAYOUT.note}},
    codeArtwork:[{id:'terrain',source:'public/app.js',type:'canvas geometry',purpose:'Prairie, relief, field polygons and fallbacks follow map geometry; not baked into atlases.'},{id:'landscape-materials',source:'public/landscape-art.js',type:'canvas geometry with existing sprite accents',pieces:['river','creek','dirt-road','ford','timber-bridge'],animation:'Static surface detail; water motion remains future work.',purpose:'Shared depth shading, bank detail, wheel ruts, shallow stone fords and explicit-site timber bridges. Never creates a crossing or changes travel geometry.',guide:'docs/LANDSCAPE_ART.md'},{id:'gonzales-town',source:'public/gonzales-art.js',type:'existing sprite assembly',purpose:'Thirty structures with work yards, paths, props and trees; illustrative scenery around the authoritative Gonzales site.',guide:'docs/GONZALES_ART.md'},{id:'interface',source:'public/style.css',type:'CSS',purpose:'Parchment/wood/olive/rust panels, contextual card, family journal and responsive touch controls; no external font or UI image dependency.'}],
    remainingWork:FUTURE_WORK,
    provenance:{tool:'Built-in image_gen.imagegen',sourceCount:sources.length,originalPNGsUnmodified:true,referenceImagesRedistributed:false,details:'docs/art-provenance.json'},
  };
}
export function writeRegistry(atlas, animation) {
  const registry=buildRegistry(atlas,animation);
  writeFileSync(new URL('manifest.json',base),JSON.stringify(registry,null,2)+'\n');
  const lines=['# Complete art manifest','',`Generated from the shipped library: **${registry.counts.sprites} usable sprites, ${registry.counts.sheets} PNG atlases, ${registry.counts.clips} clips** (${registry.counts.poseCycles} pose cycles; ${registry.counts.rigs} layered rigs).`, '',
    'Read [ASSETS.md](ASSETS.md) for integration. The complete machine-readable inventory is [manifest.json](../public/assets/frontier-v1/manifest.json); every frame, clip, duration, anchor, direction, rig part, checksum, location kit and exclusion is indexed there. Rebuild with `npm run build:art`.', '',
    'These are reusable prototype pieces, not completed later scenarios. Static buildings/props are intentional. Pending action coverage is explicit below. Open `/art-catalog.html` to play, scrub, pause and inspect every frame on different backgrounds.','',
    'Assemblies: [Béxar town](BEXAR_ASSEMBLY.md) and [complete Alamo](ALAMO_LAYOUT.md) share the same compound geometry. The machine-readable manifest includes every town building, tree, plaza, road and its Alamo transform.','',
    '## Atlas inventory','', '| Atlas | Frames | Size | PNG bytes |', '| --- | ---: | --- | ---: |'];
  for(const [id,sheet] of Object.entries(registry.sheets)) lines.push(`| ${id} | ${Object.values(registry.assets).filter(a=>a.sheet===id).length} | ${sheet.width} × ${sheet.height} | ${sheet.bytes} |`);
  lines.push('','## Every usable piece','','| Sprite ID | Atlas | Animation clips |','| --- | --- | --- |');
  for(const [id,asset] of Object.entries(registry.assets)) lines.push(`| ${id} | ${asset.sheet} | ${asset.clips.join(', ')||'State artwork; no motion required'} |`);
  lines.push('','## Animation families','','| Clip | Method | Frames | Duration (ms) | Loop | Direction |','| --- | --- | ---: | ---: | --- | --- |');
  for(const [id,c] of Object.entries(registry.clips)) lines.push(`| ${id} | ${c.parts?'Layered rig':c.authored?'Pose cycle':c.motion==='none'?'Still state':c.motion} | ${c.frames.length} | ${c.frames.reduce((n,f)=>n+f.duration,0)} | ${c.loop?'yes':'one-shot'} | ${c.direction} |`);
  lines.push('','## Further production work','');
  for(const gap of FUTURE_WORK) lines.push(`- **${gap.scope}:** ${gap.remaining}`);
  lines.push('','## Excluded art','','The first cell of `fortifications.png` depicts a later rounded facade. It has no sprite ID and is never drawn. Use `roofless-church-shell` for a schematic 1836 Alamo. The unchanged source PNG is retained for provenance.','');
  writeFileSync(new URL('ART_MANIFEST.md',docs),lines.join('\n'));
  return registry;
}
