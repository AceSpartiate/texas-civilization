// Measure sprite frames from the atlas alpha channel and write atlas.json.
//
// The atlases were generated from a prompt asking for a "strict 4 by 4 grid of equal
// square cells". They are not one: sprites vary in size and sit at different heights,
// and two tree canopies overlap by three pixels. Slicing at width/4 would clip them.
// So this measures what is actually there - connected regions of visible alpha - and
// records the real rectangle and ground-contact point of each sprite.
//
// Run: node scripts/build-atlas-manifest.mjs
// It reads atlas PNGs and writes measured manifests. The art is never modified.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { writeRegistry } from './art-registry.mjs';
import { SHEETS as DELIVERED_SHEETS, ANIMATION_CLIPS as DELIVERED_CLIPS } from './art-deliveries/index.mjs';

export const root = fileURLToPath(new URL('../public/assets/frontier-v1/', import.meta.url));

// Reading order of each sheet, from docs/art-prompts.json. The prompt fixes the order;
// this file fixes the names the game uses for them.
export const SHEETS = {
  ...DELIVERED_SHEETS,
  'courier-encounters': ['listen','speak','letter','point'].flatMap(action=>[1,2,3,4].map(n=>`mounted-courier-${action}-${n}`)),
  'alamo-facades': ['alamo-church-front-1836','alamo-church-front-inside','alamo-church-front-cracked','alamo-church-buttress-wall'],
  'alamo-interiors': ['alamo-cot-blanket','alamo-cot-empty','alamo-table','alamo-stool','alamo-chest-closed','alamo-chest-open','alamo-straw-pallet','alamo-crates','alamo-pot','alamo-water-jar','alamo-bucket','alamo-firewood','alamo-roof-panel','alamo-floor-limestone','alamo-floor-earth','alamo-stones'],
  'joe-poses': ['joe-walk-1','joe-walk-2','joe-walk-3','joe-walk-4','joe-walk-s-1','joe-walk-s-2','joe-walk-n-1','joe-walk-n-2','joe-hide-1','joe-hide-2','joe-rise','joe-cautious','joe-idle','joe-speak-1','joe-speak-2','joe-rest-pose'],
  'people-search-trade': ['rust','teal','elder','blue'].flatMap(p=>['search-1','search-2','trade-1','trade-2'].map(a=>`${p}-${a}`)),
  'courier-mounted': ['e','s','n','graze'].flatMap(d=>[1,2,3,4].map(n=>`mounted-courier-${d}-${n}`)),
  'animal-graze': ['ox','horse','cow','pig'].flatMap(p=>[1,2,3,4].map(n=>`${p}-graze-${n}`)),
  'alamo-modules': ['alamo-wall-intact','alamo-wall-cracked','alamo-wall-breach','alamo-wall-rubble','alamo-wall-doorway','alamo-wall-window','alamo-wall-cutaway','alamo-wall-corner','alamo-door-closed','alamo-door-open','alamo-palisade','alamo-palisade-broken','alamo-earth-ramp','alamo-stairs','alamo-beam','alamo-buttress'],
  'people-vertical': ['rust','teal','elder','blue'].flatMap(p => ['s-1','s-2','n-1','n-2'].map(d => `${p}-walk-${d}`)),
  'animal-vertical': ['ox','horse','cow','pig'].flatMap(p => ['s-1','s-2','n-1','n-2'].map(d => `${p}-walk-${d}`)),
  'military-vertical': ['volunteer','regular','courier','dragoon'].flatMap(p => ['s-1','s-2','n-1','n-2'].map(d => `${p}-march-${d}`)),
  'people-care': ['rust','teal','elder','blue'].flatMap(p => [`${p}-rest-pose`,`${p}-injured-pose`,`${p}-care-1`,`${p}-care-2`]),
  civilians: ['rust','teal','elder','blue'].flatMap(p => ['s','e','w','n'].map(d => `${p}-idle-${d}`)),
  'people-walk': ['rust','teal','elder','blue'].flatMap(p => [1,2,3,4].map(n => `${p}-walk-${n}`)),
  'people-work': ['rust','teal','elder','blue'].flatMap(p => [1,2,3,4].map(n => `${p}-work-${n}`)),
  'people-carry': ['rust','teal','elder','blue'].flatMap(p => [1,2,3,4].map(n => `${p}-carry-${n}`)),
  'people-tasks': ['rust','teal','elder','blue'].flatMap(p => [`${p}-sow-1`,`${p}-sow-2`,`${p}-repair-1`,`${p}-repair-2`]),
  'animal-motion': ['ox','horse','cow','pig'].flatMap(p => [1,2,3,4].map(n => `${p}-walk-${n}`)),
  'military-motion': ['volunteer','regular','courier','dragoon'].flatMap(p => [1,2,3,4].map(n => `${p}-march-${n}`)),
  'military-actions': ['volunteer-aim','volunteer-fire','volunteer-load','volunteer-ramrod','regular-aim','regular-fire','regular-load','regular-ramrod','volunteer-surrender-1','volunteer-surrender-2','volunteer-injured','volunteer-reclining','regular-surrender-1','regular-surrender-2','regular-injured','regular-reclining'],
  equipment: ['cannon-iron-w','cannon-iron-e','cannon-bronze-w','cannon-bronze-e','cannon-iron-n','cannon-iron-s','limber','roundshot','barrel','crate','sacks','tools','fence-rail','fence-corner','bucket','bedroll'],
  fortifications: [null,'long-barrack','earth-rampart','palisade','church-generic','courtyard-house','stone-tile-house','arcade','brick-bastion','brick-breach','brick-barracks-ruin','wharf','timber-hall','timber-shop','wall-breach','log-barricade'],
  'architecture-extra': ['roofless-church-shell','stone-long-barrack','frame-hall','brick-fort-ruin'],
  'wagon-rig': ['wagon-body-covered','wagon-body-empty','wagon-wheel','wagon-body-loaded'],
  nature: ['oak-broad', 'oak-spreading', 'cottonwood', 'pecan', 'sapling', 'log-fallen', 'stump', 'rocks',
    'grass-tuft', 'reeds', 'prickly-pear', 'scrub', 'corn-young', 'corn-mature', 'cotton-young', 'cotton-mature'],
  buildings: ['cabin-small', 'cabin-wide', 'shed-open', 'storehouse', 'adobe-flat', 'adobe-tile', 'trading-house', 'chapel',
    'wall-straight', 'wall-corner', 'gate', 'barracks', 'tent', 'lean-to', 'cabin-weathered', 'cabin-ruin'],
  transport: ['ox-brown', 'ox-cream', 'horse-chestnut', 'horse-grey', 'cow', 'pig', 'sheep', 'chicken',
    'wagon-empty', 'wagon-loaded', 'wagon-covered', 'wagon-broken', 'ox-cart', 'horse-cart', 'skiff', 'ferry-raft'],
  military: ['volunteer-s', 'volunteer-w', 'volunteer-e', 'volunteer-n',
    'regular-s', 'regular-w', 'regular-e', 'regular-n', 'courier-s', 'courier-w', 'courier-e', 'courier-n',
    'dragoon-s', 'dragoon-w', 'dragoon-e', 'dragoon-n'],
  household: ['householder-step-e-1', 'householder-step-e-2', 'householder-hoe', 'householder-rest',
    'caregiver-step-e-1', 'caregiver-step-e-2', 'caregiver-basket', 'caregiver-aid',
    'child-step-e', 'child-rest', 'householder-carry', 'caregiver-blanket',
    'cooking-pot', 'packed-belongings', 'bandage-roll', 'ox-yoke'],
  effects: ['smoke-small', 'smoke-growing', 'smoke-dense', 'smoke-dispersing',
    'muzzle-flash-w', 'muzzle-flash-e', 'dust-small', 'dust-large',
    'water-ripple', 'water-splash', 'campfire', 'chimney-smoke',
    'crop-stubble', 'corn-dry', 'cotton-dry', 'fence-broken'],
};
// A real sprite must have this much visible art. Small disconnected pieces (smoke
// particles, splashes, tools) are retained with the object in their reading-order cell.
const SPRITE_AREA = 1200;
const VISIBLE = 24;
const COMPONENT_AREA = 12;
const MAX_TRIM_FRACTION = 0.0025;

// Authored frame sequences are registered only after their sheets have passed review.
// A single sprite with presentation motion must explicitly say authored: false.
export const ANIMATION_CLIPS = { ...DELIVERED_CLIPS };
const poseClip = (name, sprites, durations = 180, loop = true, motion = 'none') => {
  ANIMATION_CLIPS[name] = { frames: sprites.map((sprite, i) => ({ sprite, duration: Array.isArray(durations) ? durations[i] : durations })), loop, authored: sprites.length > 1, motion, direction: 'east; west by mirroring' };
};
for(const action of ['listen','speak','letter','point']) poseClip(`mounted-courier-${action}`,[1,2,3,4].map(n=>`mounted-courier-${action}-${n}`),400,!['letter','point'].includes(action));
poseClip('joe-walk',[1,2,3,4].map(n=>`joe-walk-${n}`),180);
for(const d of ['n','s'])poseClip(`joe-walk-${d}`,[1,2].map(n=>`joe-walk-${d}-${n}`),220);
poseClip('joe-hide',['joe-hide-1','joe-hide-2'],900);
poseClip('joe-emerge',['joe-hide-2','joe-rise','joe-cautious'],[300,400,700],false);
poseClip('joe-speak',['joe-speak-1','joe-speak-2'],[750,900]);
poseClip('joe-idle',['joe-idle'],2400,true,'breathe');
poseClip('joe-rest',['joe-rest-pose'],2600,true,'breathe');
poseClip('alamo-wall-collapse',['alamo-wall-intact','alamo-wall-cracked','alamo-wall-breach','alamo-wall-rubble'],[250,300,250,1000],false);
poseClip('alamo-door-opening',['alamo-door-closed','alamo-door-open'],[250,750],false);
poseClip('alamo-chest-opening',['alamo-chest-closed','alamo-chest-open'],[250,750],false);
for (const person of ['rust','teal','elder','blue']) {
  poseClip(`${person}-search`,[`${person}-search-1`,`${person}-search-2`],[900,900]);
  poseClip(`${person}-trade`,[`${person}-trade-1`,`${person}-trade-2`],[500,700]);
  for (const dir of ['s','n']) poseClip(`${person}-walk-${dir}`, [1,2].map(n=>`${person}-walk-${dir}-${n}`),220);
  poseClip(`${person}-care`, [1,2].map(n=>`${person}-care-${n}`),420);
  poseClip(`${person}-rest`, [`${person}-rest-pose`],2500,true,'breathe');
  poseClip(`${person}-injured-rest`, [`${person}-injured-pose`],3000,true,'breathe');
  for (const action of ['walk','work','carry']) poseClip(`${person}-${action}`, [1,2,3,4].map(n => `${person}-${action}-${n}`), action === 'work' ? [240,120,220,220] : 180);
  for (const action of ['sow','repair']) poseClip(`${person}-${action}`, [1,2].map(n => `${person}-${action}-${n}`), 360);
  for (const dir of ['s','e','w','n']) poseClip(`${person}-idle-${dir}`, [`${person}-idle-${dir}`], 2200, true, 'breathe');
}
for (const animal of ['ox','horse','cow','pig']) {
  poseClip(`${animal}-graze`,[1,2,3,4].map(n=>`${animal}-graze-${n}`),[800,650,1500,750]);
  poseClip(`${animal}-walk`, [1,2,3,4].map(n => `${animal}-walk-${n}`), 210);
  for (const dir of ['s','n']) poseClip(`${animal}-walk-${dir}`, [1,2].map(n=>`${animal}-walk-${dir}-${n}`),240);
}
for(const direction of ['e','s','n','graze']) {
  poseClip(`mounted-courier-${direction}`, [1,2,3,4].map(n=>`mounted-courier-${direction}-${n}`),direction==='graze'?700:230);
  ANIMATION_CLIPS[`mounted-courier-${direction}`].direction = direction==='e'||direction==='graze'?'east; west by mirroring':direction==='n'?'north':'south';
}
for (const role of ['volunteer','regular','courier','dragoon']) {
  for (const dir of ['s','n']) poseClip(`${role}-march-${dir}`, [1,2].map(n=>`${role}-march-${dir}-${n}`),220);
  poseClip(`${role}-march`, [1,2,3,4].map(n => `${role}-march-${n}`), 200);
  for (const dir of ['s','w','e','n']) poseClip(`${role}-idle-${dir}`, [`${role}-${dir}`], 2400, true, 'breathe');
}
for (const role of ['volunteer','regular']) {
  poseClip(`${role}-fire-reload`, ['aim','fire','load','ramrod'].map(a => `${role}-${a}`), [700,120,750,900], false);
  poseClip(`${role}-surrender`, [1,2].map(n => `${role}-surrender-${n}`), [400,900], false);
  poseClip(`${role}-injured-rest`, [`${role}-injured`], 2700, true, 'breathe');
}
for (const sprite of ['oak-broad','oak-spreading','cottonwood','pecan','sapling','reeds','scrub','grass-tuft','corn-young','corn-mature','cotton-young','cotton-mature']) poseClip(`${sprite}-wind`, [sprite], 3800, true, 'sway');
for (const sprite of ['ox-brown','ox-cream','horse-chestnut','horse-grey','cow','pig','sheep','chicken']) poseClip(`${sprite}-idle`, [sprite], 2900, true, 'breathe');
poseClip('wagon-travel', ['wagon-covered'], 850, true, 'rock');
poseClip('wagon-idle', ['wagon-covered'], 1000, true);
poseClip('skiff-float', ['skiff'], 3100, true, 'rock');
poseClip('ferry-float', ['ferry-raft'], 3400, true, 'rock');
for (const gun of ['cannon-iron-e','cannon-iron-w','cannon-bronze-e','cannon-bronze-w']) poseClip(`${gun}-recoil`, [gun], 900, false, 'recoil');
poseClip('musket-smoke', ['smoke-small','smoke-growing','smoke-dispersing'], [140,350,650], false, 'drift');
poseClip('cannon-smoke', ['smoke-dense','smoke-dispersing'], [400,900], false, 'drift');
poseClip('road-dust', ['dust-small','dust-large'], [180,420], false, 'drift');
poseClip('water-motion', ['water-ripple'], 1800, true, 'pulse');
poseClip('fire-flicker', ['campfire'], 500, true, 'pulse');
poseClip('smoke-rise', ['chimney-smoke'], 2100, true, 'drift');
for (const [name, body, moving] of [['wagon-travel','covered',true],['wagon-idle','covered',false],['wagon-empty-travel','empty',true],['wagon-loaded-travel','loaded',true]]) {
  poseClip(name, [`wagon-body-${body}`], 850, true, moving ? 'rock' : 'none');
  Object.assign(ANIMATION_CLIPS[name], { direction: 'west; east by mirroring', technique: 'layered body and independently rotating wheels', bodyOffsetY: -.18,
    parts: [-.31,.31].map(x => ({ sprite:'wagon-wheel', x, y:-.17, height:.39, anchor:[.5,.5], turnsPerSecond: moving ? 1.1 : 0 })) });
}
// Direction describes the actual source pose, not merely the default used by poseClip.
for (const [name, clip] of Object.entries(ANIMATION_CLIPS)) {
  const cardinal = name.match(/-(?:walk|march|idle)-([nswe])$/)?.[1];
  if (cardinal) clip.direction = ({ n:'north', s:'south', w:'west', e:'east' })[cardinal];
  if (/wind$|smoke|dust|water|fire-flicker/.test(name)) clip.direction = 'not applicable';
  if(name.startsWith('alamo-'))clip.direction='elevation; orient with structure geometry';
  if (name.startsWith('cannon-')) {
    clip.direction = name.includes('-w-') ? 'west' : 'east';
    clip.recoilSign = clip.direction === 'west' ? -1 : 1;
  }
}

export function decodeRgba(buf) {
  let pos = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  const parts = [];
  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') parts.push(data);
    else if (type === 'IEND') break;
    pos += 12 + length;
  }
  if (depth !== 8 || colorType !== 6 || interlace !== 0) throw new Error(`expected 8-bit RGBA, got depth ${depth} colour ${colorType} interlace ${interlace}`);
  const raw = inflateSync(Buffer.concat(parts)), stride = width * 4, out = Buffer.alloc(height * stride);
  let read = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[read++], line = raw.subarray(read, read + stride);
    read += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride), prior = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? cur[i - 4] : 0, b = prior ? prior[i] : 0, c = prior && i >= 4 ? prior[i - 4] : 0;
      let value;
      if (filter === 0) value = line[i];
      else if (filter === 1) value = line[i] + a;
      else if (filter === 2) value = line[i] + b;
      else if (filter === 3) value = line[i] + ((a + b) >> 1);
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value = line[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else throw new Error('unknown scanline filter ' + filter);
      cur[i] = value & 255;
    }
  }
  return { width, height, data: out };
}

// Flood fill every region of visible alpha. Reading-order grouping below reunites
// detached pieces of one sprite; only isolated regions smaller than twelve pixels go.
function regions({ width, height, data }) {
  const seen = new Uint8Array(width * height), labels = new Int32Array(width * height), stack = new Int32Array(width * height), found = [];
  let component = 0;
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || data[start * 4 + 3] <= VISIBLE) continue;
    let top = 0;
    component++;
    stack[top++] = start; seen[start] = 1;
    let area = 0, minX = width, maxX = 0, minY = height, maxY = 0;
    while (top) {
      const p = stack[--top], x = p % width, y = (p / width) | 0;
      labels[p] = component;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const q = ny * width + nx;
        if (!seen[q] && data[q * 4 + 3] > VISIBLE) { seen[q] = 1; stack[top++] = q; }
      }
    }
    if (area >= COMPONENT_AREA) found.push({ component, area, minX, minY, maxX, maxY });
  }
  return { found, labels };
}

// Where the sprite meets the ground. Every sprite carries a soft shadow under its base,
// so the widest row in the bottom seven percent is the contact line, and its middle
// is the point the world position should sit on. Placing by the frame's bottom-centre
// instead would float a wagon above its own shadow, and placing by the frame's middle
// would bury an ox to the knees.
//
// A broader window can select an ox's flank or a low tree branch instead of the base.
// The low threshold includes the soft shadow without following nearly invisible noise.
function anchorOf(image, frame) {
  const { width, data } = image;
  const height = frame.maxY - frame.minY + 1, w = frame.maxX - frame.minX + 1;
  let bestY = frame.maxY, bestSpan = -1, bestMinX = frame.minX, bestMaxX = frame.maxX;
  for (let y = frame.minY + Math.floor(height * 0.93); y <= frame.maxY; y++) {
    let lo = -1, hi = -1;
    for (let x = frame.minX; x <= frame.maxX; x++) {
      if (data[(y * width + x) * 4 + 3] > 40) { if (lo < 0) lo = x; hi = x; }
    }
    if (lo >= 0 && hi - lo > bestSpan) { bestSpan = hi - lo; bestY = y; bestMinX = lo; bestMaxX = hi; }
  }
  return {
    anchorX: +(((bestMinX + bestMaxX) / 2 - frame.minX) / w).toFixed(4),
    anchorY: +((bestY - frame.minY) / height).toFixed(4),
  };
}

// Where a roof sits on its walls (public/house-plot.js `drawLogPen`). The house-modules sheet draws every piece of a pen
// alone in its own cell, with nothing to say how they register on one another. The ground anchor above says where the
// walls stand, but a roof measured the same way is anchored at the low front tip of its eaves, and a roof drawn at the
// walls' ground anchor came down in front of them to the ground (student, 2026-09-23: "the roof doesn't seem to stay
// where it's supposed to be. It slides forward."). So both are measured one more way, from the silhouette: the middle of
// the line between the tops of the frame's leftmost and rightmost columns. On full walls those are the tops of the left
// and right corner posts, whose middle is the middle of the wall tops a roof rests on; on a roof they are the two outer
// ends of its eaves, whose middle is the middle of the eaves. The roof is drawn with that point on that point.
// ceiling: read off a silhouette - a round log end or a pole standing past the eave moves it - so each lands within about
// 3% of its frame's width of the middle read by eye on a ten-pixel grid, and a roof within 6% of the walls' width of
// where the eye puts it (tests/house-roof.test.mjs holds it to that; drawn at the walls' ground anchor it was 33%).
// A seat point drawn with the art (docs/ART_REQUESTS.md, 2026-09-15 house plot's pieces) would replace the measure.
const SEATED = /^house-(round|hewn)-(full-walls|roof-partial|roof-finished)$/;
function seatOf(image, frame) {
  const { width, data } = image, w = frame.maxX - frame.minX + 1, h = frame.maxY - frame.minY + 1;
  const band = Math.max(2, Math.round(w * 0.01)), seen = (x, y) => data[(y * width + x) * 4 + 3] > 40;
  let left = frame.maxX, right = frame.minX;
  for (let y = frame.minY; y <= frame.maxY; y++) for (let x = frame.minX; x <= frame.maxX; x++) if (seen(x, y)) { left = Math.min(left, x); right = Math.max(right, x); }
  const topOf = (from, to) => { for (let y = frame.minY; y <= frame.maxY; y++) for (let x = from; x <= to; x++) if (seen(x, y)) return y; return frame.maxY; };
  const top = (topOf(left, left + band) + topOf(right - band, right)) / 2;
  return { seatX: +(((left + right) / 2 - frame.minX) / w).toFixed(4), seatY: +((top - frame.minY) / h).toFixed(4) };
}

// Where a pen's walls meet the ground (public/house-plot.js `gableMiddle`), so a chimney can be stood against a gable wall.
// The sheet draws the pen corner-on: its ground is a four-sided figure whose left, front and right corners are the feet of
// the three corner posts the viewer sees, the fourth hidden behind the walls. Until 2026-09-23 a chimney was drawn at its
// own cell of the plot, and a cell of the plot is not where the picture's wall is: it stood on the grass beside the pen, in
// front of it at a quarter turn (owner: "Something looks wrong with the chimneys too"). So the full walls are measured one
// more way, from the silhouette: the left corner is the foot of the leftmost columns, the right the foot of the rightmost,
// and the front the lowest pixel of the frame. The back corner is the fourth corner of the figure the three make.
// ceiling: read off a silhouette, so the log ends standing past a corner move it: each lands within about 3% of the
// frame's width of the post foot read by eye on a ten-pixel grid (tests/house-chimney.test.mjs holds the chimney to those).
// A ground outline drawn with the art (docs/ART_REQUESTS.md, 2026-09-15 house plot's pieces) would replace the measure.
const GROUNDED = /^house-(round|hewn)-full-walls$/;
function groundOf(image, frame) {
  const { width, data } = image, w = frame.maxX - frame.minX + 1, h = frame.maxY - frame.minY + 1;
  const band = Math.max(2, Math.round(w * 0.01)), seen = (x, y) => data[(y * width + x) * 4 + 3] > 40;
  let left = frame.maxX, right = frame.minX, lowest = frame.minY;
  for (let y = frame.minY; y <= frame.maxY; y++) for (let x = frame.minX; x <= frame.maxX; x++) if (seen(x, y)) { left = Math.min(left, x); right = Math.max(right, x); lowest = Math.max(lowest, y); }
  const footOf = (from, to) => { for (let y = frame.maxY; y >= frame.minY; y--) for (let x = from; x <= to; x++) if (seen(x, y)) return y; return frame.maxY; };
  let lo = frame.maxX, hi = frame.minX;
  for (let x = frame.minX; x <= frame.maxX; x++) if (seen(x, lowest)) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  const at = (x, y) => [+((x - frame.minX) / w).toFixed(4), +((y - frame.minY) / h).toFixed(4)];
  return { ground: { left: at(left + band / 2, footOf(left, left + band)), front: at((lo + hi) / 2, lowest), right: at(right - band / 2, footOf(right - band, right)) } };
}

// ---------------------------------------------------------------------------------------------------------------------
// Astra's frames measured the way she drew them (docs/ART_REQUESTS.md, "Redo and edit requests - 2026-10-04", C1-C3).
// The audit of 2026-10-04 found three faults in how this file measured her sheets, none in her drawing. Each is fixed
// below and held by tests/art-measure.test.mjs, which measures the built manifests the way the audit did.
// ---------------------------------------------------------------------------------------------------------------------

/**
 * C1 - the clips that move a figure along the ground: walks, marches, rides, runs, gallops, bounds and the like. In these
 * the figure is drawn in place - the ground slides under it - so its body should stay put over its ground point while
 * its legs swing. The per-frame anchor (`anchorOf`, the middle of the widest row near the bottom) lands on one hoof or one
 * boot in a long stride, and the figure jumped back and forth along its path by up to 0.81 of its height (javelina run).
 * So every frame of these clips gets one ground point per clip: the same horizontal offset from the middle of the figure's
 * painted mass (`bodyOf`, the centroid of its silhouette) in every frame, that offset being the clip's median of the old
 * per-frame offsets, so a clip's ground point sits where its frames' shadows mostly put it. A body going along at a steady
 * pace carries its centre of mass at a steady pace, and in a picture drawn side-on the silhouette's centroid is that centre.
 * The middle of the upper body was tried first (docs/ART_REQUESTS.md suggested it) and agrees with the centroid to within
 * 0.07 of a height on every walk and ride, but not on a deer's or a turkey's bound or the geese in flight, where the "upper
 * body" of an airborne frame is measured up from a hoof or a wing in the air: there it made the geese slide 0.22 of a
 * height where they had slid 0.06. The vertical anchor stays per frame: the lowest foot is on the ground.
 * ceiling: a carry, a dig or a gun drill is not here - the feet are planted and the body bends, so the per-frame foot
 * anchor is the right one there; the audit measured locomotion only. A clip that walks while it carries (`*-sandbag-carry`,
 * `bearers-carry`) keeps the per-frame anchor; add it here if one is seen to slide.
 */
export const LOCOMOTION = /(?:^|-)(?:walk|march|run|gallop|canter|trot|ride|bound|travel|flight|escape)(?:-|$)|^lancer-charge$|^mounted-courier-[esn]$/;

/**
 * C2 - a logical height for the figures on sheets the name rules below leave without one. Without it every frame is drawn
 * at the requested height whatever its pose: the deer shrank about 30% raising its head, the bear came out 0.69 of itself
 * mid-bound, and a gun crew's man bending for the shot grew to the height of the man standing beside him.
 *
 * Each entry names a figure on the sheet by the start of its frame names ('' is the whole sheet) and its reference:
 * - 'tallest': the tallest frame of that figure on the sheet, when that is the figure standing or walking upright
 *   (an animal's alert pose with its head up, a man walking with a rammer or a sandbag);
 * - a frame name: the upright pose to measure, where the tallest frame is a prop held high (a rammer, a rod) or a pose
 *   that is not the figure standing;
 * - { standing, why }: the figure's standing height in this sheet's source pixels, for a sheet with no upright figure in
 *   it at all (only sitting, sleeping or kneeling men). Astra's sheets are not all drawn at one scale, so this is measured
 *   by eye against an upright frame of the same costume she drew elsewhere, matching the face and hat. The way out is
 *   the delivery's own reference line (docs/ART_REQUESTS.md C2): the standing frame the sheet was drawn beside.
 *   ceiling: by eye at the face and the hat brim, about +-8%; the guessed multipliers it replaced (0.65, 0.7) were within
 *   that of it, which is the check that it is not far wrong.
 *
 * Sheets of effects, flags, guns, trees, fog and boats are not here: their frames grow or change shape on purpose (a smoke
 * puff grows, a gun recoils) and each caller sizes them; tests/art-measure.test.mjs lists each with why.
 */
export const FIGURE_HEIGHTS = {
  'artillery-service': [['volunteer-', 'tallest'], ['regular-', 'tallest']],
  'regular-ladder-climb': [['', 'tallest']],
  'alamo-scaling-ladders': [['', 'tallest']],
  'regular-bugler': [['', 'tallest']],
  'regular-drummer': [['', 'tallest']],
  'white-flag-regular': [['', 'tallest']],
  'white-flag-volunteer': [['', 'tallest']],
  'lancer-charge': [['', 'tallest']],
  'dragoon-carbine-actions': [['', 'tallest']],
  'regular-prone-actions': [['', 'tallest']],
  'goliad-prisoner': [['', 'tallest']],
  'mule-packed-grass': [['', 'tallest']],
  'ox-packed': [['', 'tallest']],
  'volunteer-engineer-actions': [['', 'tallest']],
  'regular-engineer-actions': [['', 'tallest']],
  'volunteer-bearers': [['', 'tallest']],
  'regular-bearers': [['', 'tallest']],
  'dragoon-wounded-led': [['', 'tallest']],
  'volunteer-mounted': [['', 'tallest']],
  'carreta-solid-wheels': [['', 'tallest']],
  'wildlife-deer': [['', 'tallest']],
  'wildlife-mustang': [['', 'tallest']],
  'wildlife-turkey': [['', 'tallest']],
  'wildlife-bear-javelina': [['bear-', 'tallest'], ['javelina-', 'tallest']],
  'wildlife-bison-pronghorn': [['bison-', 'tallest'], ['pronghorn-', 'tallest']],
  'wildlife-geese-cattle': [['geese-', 'tallest'], ['wild-cattle-', 'tallest']],
  'gonzales-settler-charge': [['', 'tallest']],
  'gonzales-settler-igniter': [['', 'tallest']],
  // The rammer's sheet has no upright frame: he lunges with the rammer (518) or crouches with his hands over his ears.
  // The three Gonzales crew sheets were made as one set (scripts/art-deliveries/survivor-travel-gonzales-crew-2026-10-03.mjs,
  // "same four equal cells full-body scale"); his hat brim is about 0.94 of the charge man's, standing 597.
  'gonzales-settler-rammer': [['', { standing: 561, why: 'the charge man standing (settler-gun-charge-wait-1, 597) x 0.94, his hat brim against the rammer\'s; the lunge (518) is 0.92 of it' }]],
  // The rammer carried upright stands its sponge above his hat (577); the shot carrier walks upright with nothing raised.
  'twin-sisters-crew': [['', 'twin-crew-shot-carry']],
  // The cart's upright frame, so it does not swell to the same height as it tips onto its side.
  'coleto-baggage-cart': [['', 'cart-baggage']],
  // Kneeling at a loophole, all four: the man's face and hat are 2.0x those of Astra's upright volunteer carrying a
  // sandbag (volunteer-sandbag-carry-2, 304 tall in a stride, about 310 standing).
  'volunteer-loophole-actions': [['', { standing: 620, why: 'face and hat brim 2.0x volunteer-sandbag-carry-2 (about 310 standing)' }]],
};
// C2 for the camp sheet, which the `military-` rule measured row by row: its rows are seated and sleeping men only, so a
// row's tallest frame was a seated man, drawn as tall as a standing one (public/battle-view.js guessed x0.7 to undo it).
// Its volunteer's face and hat are about 1.18x the sandbag carrier's (about 310 standing); the regular sits 271 to the
// volunteer's 230 in the same pose on the same sheet, so stands in proportion.
FIGURE_HEIGHTS['military-camp-life'] = [
  ['volunteer-', { standing: 365, why: 'face and hat brim about 1.18x volunteer-sandbag-carry-2 (about 310 standing)' }],
  ['regular-', { standing: 430, why: 'the volunteer standing (365) x 271/230, the two seated in the same pose' }],
];

/**
 * C3 - a famous person's sheet is measured from its walking frames. Until 2026-10-04 its height was the tallest frame in
 * rows 1-3, which can be an action pose - Hockley's arm raised for the signal, Sherman's rally - so the person was drawn
 * 6-17% small in every pose (Hockley 13.5%, Sherman 12%). Walking is the one pose every person's sheet draws upright.
 * A sheet with no walking frame keeps the old rule, unless a frame on it is named here as the person standing.
 */
const FAMOUS_STANDING = {
  // Castrillón on the crate: the fourth frame is him standing on the ground beside it, so the crate is drawn the crate's
  // height above him (1.17x; public/battle-view.js guessed x1.18 to put it back).
  'famous-castrillon-crate': 'castrillon-crate-ground',
};
const WALKING = /-walk(?:-|$)/;

/** The horizontal middle of a frame's painted mass - its silhouette's centroid - in sheet pixels (C1). */
function bodyOf(image, frame, members, labels) {
  let sum = 0, count = 0;
  for (let y = frame.minY; y <= frame.maxY; y++) for (let x = frame.minX; x <= frame.maxX; x++) {
    const p = y * image.width + x;
    if (members.has(labels[p]) && image.data[p * 4 + 3] > 40) { sum += x; count++; }
  }
  return sum / count;
}

/** Groups of locomotion clips that share a frame, so a shared frame gets one anchor (C1). */
export function locomotionGroups(clips = ANIMATION_CLIPS, frames = null) {
  const parent = new Map(), find = name => { while (parent.get(name) !== name) name = parent.get(name); return name; };
  for (const [id, clip] of Object.entries(clips)) {
    const sprites = [...new Set(clip.frames.map(frame => frame.sprite))];
    if (!LOCOMOTION.test(id) || sprites.length < 2 || (frames && !sprites.every(sprite => frames[sprite]))) continue;
    for (const sprite of sprites) if (!parent.has(sprite)) parent.set(sprite, sprite);
    for (const sprite of sprites.slice(1)) parent.set(find(sprite), find(sprites[0]));
  }
  const groups = new Map();
  for (const sprite of parent.keys()) { const root = find(sprite); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(sprite); }
  return [...groups.values()];
}

export function buildManifest() {
const sheets = {}, frames = {}, bodies = {};
const moving = new Set(locomotionGroups().flat());
for (const [sheet, names] of Object.entries(SHEETS)) {
  const file = `atlases/${sheet}.png`;
  const source = readFileSync(root + file), image = decodeRgba(source);
  const cornerAlpha = [0, image.width - 1, (image.height - 1) * image.width, image.height * image.width - 1].map(pixel => image.data[pixel * 4 + 3]);
  if (cornerAlpha.some(alpha => alpha > VISIBLE)) throw new Error(`${sheet}: opaque or matted corner; regenerate a genuinely transparent atlas before publishing`);
  let transparentPixels = 0;
  for (let p = 3; p < image.data.length; p += 4) if (image.data[p] === 0) transparentPixels++;
  if (transparentPixels / (image.width * image.height) < 0.25) throw new Error(`${sheet}: less than 25% clear alpha; inspect for a baked background`);
  const { found, labels } = regions(image), grouped = new Map();
  const columns = names.length === 1 ? 1 : (names.length === 4 || names.length === 6) ? 2 : 4, rows = names.length / columns;
  const cellWidth = image.width / columns, cellHeight = image.height / rows;
  for (const region of found) {
    const col = Math.min(columns - 1, Math.floor((region.minX + region.maxX) / 2 / cellWidth));
    const row = Math.min(rows - 1, Math.floor((region.minY + region.maxY) / 2 / cellHeight));
    const index = row * columns + col;
    if (!grouped.has(index)) grouped.set(index, { ...region, row, col, members: [region.component] });
    else {
      const group = grouped.get(index);
      group.area += region.area; group.members.push(region.component);
      group.minX = Math.min(group.minX, region.minX); group.minY = Math.min(group.minY, region.minY);
      group.maxX = Math.max(group.maxX, region.maxX); group.maxY = Math.max(group.maxY, region.maxY);
    }
  }
  for(const [index,name] of names.entries())if(name&&!grouped.has(index))throw new Error(`${sheet}: missing required reading-order cell ${index+1} (${name})`);
  const placed = [...grouped.entries()].sort(([a], [b]) => a - b).map(([, group]) => {
    if (group.area < SPRITE_AREA) throw new Error(`${sheet}: cell ${group.row + 1},${group.col + 1} contains only ${group.area} visible pixels`);
    return { ...group, sourceBounds: [group.minX, group.minY, group.maxX - group.minX + 1, group.maxY - group.minY + 1],
      minX: Math.max(0, group.minX - 2), minY: Math.max(0, group.minY - 2),
      maxX: Math.min(image.width - 1, group.maxX + 2), maxY: Math.min(image.height - 1, group.maxY + 2) };
  });
  // Two canopies overlap by a few pixels. Split the overlap so no frame can draw a
  // sliver of its neighbour, rather than pretending the grid was clean.
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i], b = placed[j];
    if (a.minX > b.maxX || b.minX > a.maxX || a.minY > b.maxY || b.minY > a.maxY) continue;
    if (a.col !== b.col) {
      const split = Math.round((Math.max(a.minX, b.minX) + Math.min(a.maxX, b.maxX)) / 2);
      if (a.col < b.col) { a.maxX = split - 1; b.minX = split; } else { b.maxX = split - 1; a.minX = split; }
    } else {
      const split = Math.round((Math.max(a.minY, b.minY) + Math.min(a.maxY, b.maxY)) / 2);
      if (a.row < b.row) { a.maxY = split - 1; b.minY = split; } else { b.maxY = split - 1; a.minY = split; }
    }
  }
  sheets[sheet] = { image: file, width: image.width, height: image.height,
    bytes: source.length, sha256: createHash('sha256').update(source).digest('hex'),
    alpha: { threshold: VISIBLE, transparentFraction: +(transparentPixels / (image.width * image.height)).toFixed(6), cornerAlpha },
    layout: { rows, columns, method: 'Connected alpha components grouped in reading order; measured bounds with two-pixel padding and audited overlap splits.',
      measuredRows: Array.from({ length: rows }, (_, row) => {
        const rowFrames = placed.filter(frame => frame.row === row);
        return { row: row + 1, yRange: rowFrames.length ? [Math.min(...rowFrames.map(frame => frame.minY)), Math.max(...rowFrames.map(frame => frame.maxY)) + 1] : [],
          columns: rowFrames.map(frame => [frame.minX, frame.maxX + 1]) };
      }) } };
  const heightOf = p => p.maxY - p.minY + 1, nameOf = p => names[p.row * columns + p.col] || '';
  const tallest = list => Math.max(...list.map(heightOf));
  const frameNamed = name => { const p = placed.find(q => nameOf(q) === name); if (!p) throw new Error(`${sheet}: reference frame ${name} is not on this sheet`); return p; };
  // The height a frame's requested drawing height stands for (public/art.js drawSprite), or undefined for the frame's own.
  // In the order the rules were written; the first that applies wins.
  const logicalOf = (frame, name) => {
    const figure = FIGURE_HEIGHTS[sheet]?.find(([start]) => name.startsWith(start));
    if (figure) {
      const [start, reference] = figure;
      if (reference === 'tallest') return tallest(placed.filter(p => nameOf(p).startsWith(start)));
      if (typeof reference === 'string') return heightOf(frameNamed(reference));
      return reference.standing + 4; // the measured frames carry two pixels of padding top and bottom
    }
    if (sheet === 'alamo-modules' && frame.row === 0) return tallest(placed.filter(p => p.row === 0));
    if (sheet === 'land-clearing' && frame.row === 2) return tallest(placed.filter(p => p.row === 2));
    if (sheet === 'houses-settling') return tallest(placed.filter(p => p.row === frame.row));
    // Named people keep one standing scale even when a later cell contains a table, cot or reclining pose (C3: their walk).
    if (sheet.startsWith('famous-') && sheet !== 'famous-picnic-props') {
      const walking = placed.filter(p => WALKING.test(nameOf(p)));
      if (walking.length) return tallest(walking);
      if (FAMOUS_STANDING[sheet]) return heightOf(frameNamed(FAMOUS_STANDING[sheet]));
      return tallest(placed.filter(p => p.row < 3));
    }
    if (sheet === 'alamo-funeral-pyre') return heightOf(placed[0]);
    if (sheet === 'joe-poses' || sheet === 'joe-story-actions') return tallest(placed);
    if (sheet === 'wagon-rig') return name !== 'wagon-wheel' ? heightOf(placed[0]) : undefined;
    // Family sheets keep seated figures at their own standing scale.
    if (sheet.startsWith('people-family-')) return tallest(placed.filter(p => p.row < 3));
    if (/^(people-|animal-|military-|courier-)/.test(sheet)) return tallest(placed.filter(p => p.row === frame.row));
    return undefined;
  };
  placed.forEach(frame => {
    const index=frame.row*columns+frame.col;
    if (!names[index]) return; // Period-inaccurate first fortification is intentionally not a usable frame.
    const members = new Set(frame.members);
    let retainedPixels = 0;
    for (let y = frame.minY; y <= frame.maxY; y++) for (let x = frame.minX; x <= frame.maxX; x++) if (members.has(labels[y * image.width + x])) retainedPixels++;
    const trimmedPixels = frame.area - retainedPixels, trimmedFraction = trimmedPixels / frame.area;
    if (trimmedFraction > MAX_TRIM_FRACTION) throw new Error(`${sheet}/${names[index]}: overlap split clips ${trimmedPixels} pixels (${(trimmedFraction * 100).toFixed(3)}%); requires a clean regeneration or explicit layout review`);
    const anchor = anchorOf(image, frame), logicalHeight = logicalOf(frame, names[index]);
    if (moving.has(names[index])) bodies[names[index]] = bodyOf(image, frame, members, labels);
    frames[names[index]] = {
      sheet, x: frame.minX, y: frame.minY,
      w: frame.maxX - frame.minX + 1, h: frame.maxY - frame.minY + 1,
      ...anchor,
      ...(sheet === 'house-modules' && SEATED.test(names[index]) ? seatOf(image, frame) : {}),
      ...(sheet === 'house-modules' && GROUNDED.test(names[index]) ? groundOf(image, frame) : {}),
      ...(logicalHeight ? { logicalHeight } : {}),
      label: names[index].replaceAll('-', ' '), kind: sheet,
      row: frame.row + 1, column: frame.col + 1,
      audit: { sourceBounds: frame.sourceBounds, visiblePixels: frame.area, trimmedPixels, retainedFraction: +(retainedPixels / frame.area).toFixed(6) },
    };
  });
}
// C1: one ground point per locomotion clip - the same offset from the silhouette's centroid in every frame, as a fraction of the
// figure's height, so a clip mixing sheets drawn at different scales still agrees.
for (const group of locomotionGroups(ANIMATION_CLIPS, frames)) {
  const logical = name => frames[name].logicalHeight || frames[name].h;
  const offsets = group.map(name => (frames[name].x + frames[name].anchorX * frames[name].w - bodies[name]) / logical(name)).sort((a, b) => a - b);
  const middle = offsets.length % 2 ? offsets[(offsets.length - 1) / 2] : (offsets[offsets.length / 2 - 1] + offsets[offsets.length / 2]) / 2;
  for (const name of group) {
    const frame = frames[name];
    frame.anchorX = +((bodies[name] + middle * logical(name) - frame.x) / frame.w).toFixed(4);
  }
}

return {
  library: 'frontier-v1',
  excludedFrames: [{ sheet: 'fortifications', row: 1, column: 1, reason: 'Generated later rounded facade. Never use for the 1836 Alamo; use roofless-church-shell instead.' }],
  note: 'Generated by scripts/build-atlas-manifest.mjs from the alpha channel of the atlas PNGs. Do not hand-edit; rerun the script. x/y/w/h are pixels in the named sheet. anchorX/anchorY are the ground-contact point as a fraction of the frame, not its centre.',
  sheets, frames,
};
}

export function buildAnimations(manifest, source = ANIMATION_CLIPS) {
  const clips = {};
  const motions = new Set(['none', 'sway', 'breathe', 'rock', 'recoil', 'drift', 'pulse']);
  for (const [name, clip] of Object.entries(source)) {
    if (!Array.isArray(clip.frames) || !clip.frames.length) throw new Error(`${name}: animation needs at least one frame`);
    if (typeof clip.loop !== 'boolean' || typeof clip.authored !== 'boolean' || !motions.has(clip.motion)) throw new Error(`${name}: explicit loop, authored, and motion metadata required`);
    for (const frame of clip.frames) {
      if (!manifest.frames[frame.sprite]) throw new Error(`${name}: unknown sprite ${frame.sprite}`);
      if (!Number.isFinite(frame.duration) || frame.duration <= 0) throw new Error(`${name}: frame duration must be positive milliseconds`);
    }
    for (const part of clip.parts || []) {
      if (!manifest.frames[part.sprite] || ![part.x,part.y,part.height,part.turnsPerSecond].every(Number.isFinite) || part.height <= 0) throw new Error(`${name}: invalid rig part`);
    }
    if (clip.authored && new Set(clip.frames.map(frame => frame.sprite)).size < 2) throw new Error(`${name}: a single pose cannot claim authored animation`);
    if (clip.duration !== undefined && (!Number.isFinite(clip.duration) || clip.duration <= 0)) throw new Error(`${name}: motion duration must be positive milliseconds`);
    clips[name] = structuredClone(clip);
  }
  return { version: 'frontier-v1', note: 'Presentation only: elapsed display time selects these frames; animation never advances simulation state. Authored identifies sequences of distinct source poses, not transforms of one sprite.', clips };
}

// Only write when run directly. The acceptance test imports this module to re-measure
// the atlases and compare, which is the whole point of keeping the measurement here
// rather than in a one-off script that was run once and then lost.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = buildManifest();
  writeFileSync(root + 'atlas.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`atlas.json: ${Object.keys(manifest.frames).length} frames across ${Object.keys(manifest.sheets).length} sheets`);
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    const frames = Object.values(manifest.frames).filter(frame => frame.sheet === name);
    console.log(`  ${name}: ${sheet.width}x${sheet.height}, ${(sheet.alpha.transparentFraction * 100).toFixed(1)}% clear alpha, ${frames.reduce((sum, frame) => sum + frame.audit.trimmedPixels, 0)} overlap pixels trimmed, min ${(Math.min(...frames.map(frame => frame.audit.retainedFraction)) * 100).toFixed(4)}% object retained`);
  }
  if (Object.keys(ANIMATION_CLIPS).length) {
    const animation = buildAnimations(manifest);
    writeFileSync(root + 'animation.json', JSON.stringify(animation, null, 2) + '\n');
    writeRegistry(manifest, animation);
    console.log(`animation.json: ${Object.keys(animation.clips).length} validated clips`);
  }
  if (process.argv.includes('--verbose')) for (const [name, frame] of Object.entries(manifest.frames)) {
    console.log(`  ${name.padEnd(16)} ${frame.sheet.padEnd(10)} ${String(frame.w).padStart(3)}x${String(frame.h).padStart(3)} at ${String(frame.x).padStart(4)},${String(frame.y).padStart(4)}  anchor ${frame.anchorX.toFixed(2)},${frame.anchorY.toFixed(2)}`);
  }
}
