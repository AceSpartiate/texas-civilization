// A town of the colonies, drawn from its layout (sim/town-layouts.mjs, served as /town-layouts.js; docs/TOWNS.md §5b).
//
// The same data the server puts the shopkeepers in, so a keeper always stands at a building that is drawn. Streets and
// squares go on the ground first; buildings are returned as drawables so they sort with the people standing among them.
import { drawClip, drawSprite, hasSprite, spriteFrame } from '/art.js';
import { drawStreets } from '/landscape-art.js';
import { groundPattern } from '/ground-texture.js';
import { FEET_PER_MILE, townDrawnHeight, townPoint, townSpread } from '/town-layouts.js';
import { PERSON_MILES } from '/sim/house-footprint.mjs';

/** Streets and public squares, under everything. `project` takes miles from the town's site point to the screen. */
export function drawTownGround(ctx, layout, project, scale) {
  // The town is drawn `townSpread` times its survey (sim/town-layouts.mjs `TOWN_SPREAD`): its streets as wide again as far apart.
  const at = point => project(townPoint(layout, point)), pixelsPerFoot = scale / FEET_PER_MILE, spread = townSpread(layout);
  // The painted street tile, one for the whole town (public/ground-texture.js): fifty feet of ground a tile, pinned to the
  // town's corner so the earth stays where it lies as the map is dragged. The squares are the same trodden ground.
  const tile = Math.max(32, pixelsPerFoot * 50), anchor = at({ x: 0, y: 0 });
  const earth = groundPattern(ctx, 'street', tile, anchor);
  ctx.save();
  for (const square of layout.squares) {
    // A square is a block (x, y, width, height), or, where the research measured an irregular one, its corner `points`.
    // A square marked `inPlace` (a burying ground a mile out) keeps its surveyed place and size, as its buildings do.
    const corners = square.points ? square.points.map(at) : [[0, 0], [square.width, 0], [square.width, square.height], [0, square.height]].map(([dx, dy]) => at({ x: square.x + dx, y: square.y + dy, inPlace: square.inPlace }));
    ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.globalAlpha = .7; ctx.fillStyle = '#ccb985'; ctx.fill();
    if (earth) { ctx.globalAlpha = .8; ctx.fillStyle = earth; ctx.fill(); }
    ctx.globalAlpha = .5; ctx.strokeStyle = '#a59063'; ctx.lineWidth = Math.max(1, pixelsPerFoot * 4 * spread); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A street the town platted and nobody had yet built along is drawn as a faint trace, not a road.
  drawStreets(ctx,layout.streets.map(street => {
    // Drawn at six tenths of the platted width: `drawRoad` edges a road half as wide again, and at full width the streets
    // outweighed the town standing along them.
    const points = street.points.map(at), width = Math.max(1, street.width * spread * pixelsPerFoot * .6);
    return {points,width:street.faint?width*.6:width,faint:street.faint};
  }), { tile, anchor });
  ctx.restore();
}

/**
 * Every building as a drawable. `labels` supplies a keeper's label and trade sprite by building id, from the map's own
 * shops (sim/shops.mjs); a building's documented name and sprite show otherwise. Names appear only when the town is close.
 */
/**
 * The drawables of a town are the same from one frame to the next while the camera stands still, so they are kept by what
 * decides them: the canvas, the scale, where the town's corner lands on the screen, and the keepers' names. Working them out
 * again on every frame was about 105 ms of a nine-second load on a Chromebook-slow CPU (2026-09-17, docs/PERFORMANCE_LOAD.md).
 */
const keptDrawables = new WeakMap();
/**
 * The buildings' names drawn this frame, as boxes on the canvas: the page empties it before it draws and hands it to the
 * speech bubbles' layout, which keeps every bubble off a name (public/speech.js `speechLayout`, owner 2026-09-29).
 */
export const townLabelsDrawn = [];
/**
 * The names of a town's buildings waiting to be written this frame. They are written after everything standing in the town
 * (`drawTownLabels`, called by public/app.js once the buildings and people are drawn), so a building drawn in front never
 * covers the name of the one behind it: with the lots drawn wider than surveyed and the buildings three times taller (owner,
 * 2026-10-27), a name under one building fell under the roof of the next one down the street at some zooms.
 */
const townLabelsQueued = [];
/**
 * A building's name, under its foot at `x`, `y` on the screen. A keeper's trade is written beside the door, not under it: the
 * keeper stands at the door (public/app.js `keeperAtDoor`) and steps out to the east, so the name ends a quarter of a person
 * west of them and they are never behind it. public/gonzales-art.js writes Gonzales's names by this too.
 */
export function queueTownLabel(label, x, y, scale, kept = false) {
  townLabelsQueued.push({ label, x, y, kept, edge: kept ? x - Math.max(7, Math.min(150, scale * PERSON_MILES)) * .25 : x });
}
/** Forget the names queued and drawn: public/app.js, as it begins a frame. */
export function beginTownLabels() { townLabelsQueued.length = 0; townLabelsDrawn.length = 0; }
/** Every name queued this frame, over the town, each kept as a box for the speech bubbles to keep off (`townLabelsDrawn`). */
export function drawTownLabels(ctx) {
  if (!townLabelsQueued.length) return;
  ctx.save(); ctx.font = '12px Georgia'; ctx.lineWidth = 3; ctx.strokeStyle = '#f2e6c9'; ctx.fillStyle = '#4c422e';
  for (const { label, x, y, kept, edge } of townLabelsQueued) {
    ctx.textAlign = kept ? 'right' : 'center';
    ctx.strokeText(label, edge, y + 16); ctx.fillText(label, edge, y + 16);
    const w = ctx.measureText(label).width + 6;
    townLabelsDrawn.push({ x: kept ? edge - w + 3 : x - w / 2, y: y + 4, w, h: 16, name: label });
  }
  ctx.restore();
  townLabelsQueued.length = 0;
}
export function townDrawables(ctx, layout, project, scale, labels = {}) {
  const corner = project(townPoint(layout, { x: 0, y: 0 })), across = project(townPoint(layout, { x: 100, y: 0 }));
  const key = [scale, corner.x, corner.y, across.x, across.y, JSON.stringify(labels)].join('|');
  const kept = keptDrawables.get(layout);
  if (kept?.ctx === ctx && kept.key === key) return kept.drawables;
  const drawables = makeTownDrawables(ctx, layout, project, scale, labels);
  keptDrawables.set(layout, { ctx, key, drawables });
  return drawables;
}
function makeTownDrawables(ctx, layout, project, scale, labels) {
  // Pixels a foot of the town as drawn: its survey `townSpread` times over, its buildings `townDrawnHeight` times their height.
  const pixelsPerFoot = scale / FEET_PER_MILE, spread = townSpread(layout), tall = townDrawnHeight(layout);
  // A wall is its pieces laid along its line, every `spacing` feet, with a breach piece where the research has it broken.
  const walls = (layout.walls || []).flatMap(wall => {
    const pieces = [];
    for (let i = 1; i < wall.points.length; i++) {
      const a = wall.points[i - 1], b = wall.points[i], span = Math.hypot(b.x - a.x, b.y - a.y), count = Math.max(1, Math.round(span / wall.spacing));
      for (let j = 0; j < count; j++) {
        const t = (j + .5) / count, n = pieces.length;
        const p = project(townPoint(layout, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
        const sprite = wall.breach && wall.breachEvery && n % wall.breachEvery === wall.breachEvery - 1 ? wall.breach : wall.sprite;
        // The pieces that stood for a drawing of the whole work (Fort Velasco's ring) give way once that drawing is in.
        pieces.push({ y: p.y, draw: () => (wall.standInFor && hasSprite(wall.standInFor)) || drawSprite(ctx, sprite, p.x, p.y, wall.height * tall * pixelsPerFoot) });
      }
    }
    return pieces;
  });
  return [...walls, ...layout.buildings.map(building => {
    const p = project(townPoint(layout, building)), shop = labels[building.id];
    const label = typeof shop === 'string' ? shop : shop?.label || building.label;
    const sprite = typeof shop === 'object' && shop?.sprite ? shop.sprite : building.sprite;
    return { y: p.y + (building.sortOffsetFeet || 0) * spread * pixelsPerFoot, draw: () => {
      // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins" - a building's own drawing (`art`, sim/town-layouts.mjs) once
      // its sheet is in, and the library pieces that stood for it (`standInFor`) then left out; a keeper's trade sprite wins.
      if (building.standInFor && hasSprite(building.standInFor)) return;
      const frame = spriteFrame(sprite);
      // A whole stockade represents a measured footprint, rather than an exaggerated wall height.
      const height = building.drawWidthFeet && frame ? building.drawWidthFeet * spread * pixelsPerFoot * (frame.logicalHeight || frame.h) / frame.w : building.height * tall * pixelsPerFoot;
      if (sprite === 'shop-stockman') {
        // Living stock are separate from the pen art. Draw them behind its front rail so neither animal is frozen into
        // the structure, and let each existing grazing clip run at a stable, different phase.
        const timeMs = performance.now();
        drawClip(ctx, 'horse-graze', p.x - height * .34, p.y - height * .23, height * .27, { timeMs, seed: `${building.id}-horse` });
        drawClip(ctx, 'cow-graze', p.x + height * .21, p.y - height * .19, height * .23, { timeMs, seed: `${building.id}-cow` });
      }
      const own = sprite === building.sprite && building.art && drawSprite(ctx, building.art, p.x, p.y, (building.artHeight ?? building.height) * tall * pixelsPerFoot);
      if (!own) drawSprite(ctx, sprite, p.x, p.y, height, { anchor: building.anchor });
      // The mill's own plume (Astra, 2026-10-11) only while the server says it is working (`operating`).
      if (sprite === 'town-harrisburg-steam-mill-1835' && shop?.operating === true) {
        drawTownMillSmoke(ctx, p.x, p.y, height, { timeMs: performance.now(), operating: true });
      }
      // A keeper's trade shows as soon as the town does, as in Gonzales; a building's own documented name only close in,
      // where the names of a street of buildings no longer sit on top of each other.
      if (label && scale > (labels[building.id] ? 1000 : 2600)) queueTownLabel(label, p.x, p.y, scale, Boolean(labels[building.id]));
    } };
  })];
}

/**
 * The ground each building of a town covers as drawn, in miles of the map: its picture's width, from its foot up as far as it
 * is drawn tall, and a tree's height in front of it and half a tree's width either side. The wild trees of the woods (public/woods-view.js) are not drawn there
 * (public/app.js `drawGroundDetail`): the woods' 0.25-mile ring of town fields (scripts/terrain/biomes.mjs `TOWN_RING_MILES`)
 * held them off a town drawn as surveyed, and with the lots drawn three times wider (owner, 2026-10-27) the outer lots stood
 * in timber, with oaks growing through the roofs. Presentation only: the woods themselves, their timber and game, are as they were.
 * ceiling: a box a building; a lot's own ground round it is still open to the woods' trees.
 */
export function townLots(layout, site) {
  // A tree is drawn up to about two people tall from its foot and half a person either side of it (public/app.js
  // `SIZE.timberTree`): one standing closer in front of the building would fill its front with leaves.
  const tall = townDrawnHeight(layout) / FEET_PER_MILE, reach = PERSON_MILES * 2.2, side = PERSON_MILES * .5;
  return layout.buildings.map(building => {
    const p = townPoint(layout, building), frame = spriteFrame(building.sprite), high = building.height * tall;
    const wide = high * (frame ? frame.w / (frame.logicalHeight || frame.h) : 1.3);
    return { left: site.x + p.x - wide / 2 - side, right: site.x + p.x + wide / 2 + side, top: site.y + p.y - high, bottom: site.y + p.y + reach };
  });
}

/** Separate authored plume; callers must supply authoritative operation state, including shutdown/destruction. */
export function drawTownMillSmoke(ctx, x, y, height, {timeMs = performance.now(), operating = false} = {}) {
  if (!operating) return 0;
  const frame = spriteFrame('town-harrisburg-steam-mill-1835');
  if (!frame) return 0;
  const scale = height / (frame.logicalHeight || frame.h), width = frame.w * scale, drawnHeight = frame.h * scale;
  return drawClip(ctx, 'town-mill-smoke', x + width * .37, y - drawnHeight * .927, drawnHeight * .5,
    {timeMs, anchor: [undefined, 1]});
}
