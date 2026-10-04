// A town of the colonies, drawn from its layout (sim/town-layouts.mjs, served as /town-layouts.js; docs/TOWNS.md §5b).
//
// The same data the server puts the shopkeepers in, so a keeper always stands at a building that is drawn. Streets and
// squares go on the ground first; buildings are returned as drawables so they sort with the people standing among them.
import { drawClip, drawSprite } from '/art.js';
import { drawStreets } from '/landscape-art.js';
import { DRAWN_HEIGHT, FEET_PER_MILE, townPoint } from '/town-layouts.js';

/** Streets and public squares, under everything. `project` takes miles from the town's site point to the screen. */
export function drawTownGround(ctx, layout, project, scale) {
  const at = point => project(townPoint(layout, point)), pixelsPerFoot = scale / FEET_PER_MILE;
  ctx.save();
  for (const square of layout.squares) {
    // A square is a block (x, y, width, height), or, where the research measured an irregular one, its corner `points`.
    const corners = square.points ? square.points.map(at) : [[0, 0], [square.width, 0], [square.width, square.height], [0, square.height]].map(([dx, dy]) => at({ x: square.x + dx, y: square.y + dy }));
    ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.globalAlpha = .7; ctx.fillStyle = '#ccb985'; ctx.fill();
    ctx.globalAlpha = .5; ctx.strokeStyle = '#a59063'; ctx.lineWidth = Math.max(1, pixelsPerFoot * 4); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A street the town platted and nobody had yet built along is drawn as a faint trace, not a road.
  drawStreets(ctx,layout.streets.map(street => {
    // Drawn at six tenths of the platted width: `drawRoad` edges a road half as wide again, and at full width the streets
    // outweighed the town standing along them.
    const points = street.points.map(at), width = Math.max(1, street.width * pixelsPerFoot * .6);
    return {points,width:street.faint?width*.6:width,faint:street.faint};
  }));
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
  const pixelsPerFoot = scale / FEET_PER_MILE;
  // A wall is its pieces laid along its line, every `spacing` feet, with a breach piece where the research has it broken.
  const walls = (layout.walls || []).flatMap(wall => {
    const pieces = [];
    for (let i = 1; i < wall.points.length; i++) {
      const a = wall.points[i - 1], b = wall.points[i], span = Math.hypot(b.x - a.x, b.y - a.y), count = Math.max(1, Math.round(span / wall.spacing));
      for (let j = 0; j < count; j++) {
        const t = (j + .5) / count, n = pieces.length;
        const p = project(townPoint(layout, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
        const sprite = wall.breach && wall.breachEvery && n % wall.breachEvery === wall.breachEvery - 1 ? wall.breach : wall.sprite;
        pieces.push({ y: p.y, draw: () => drawSprite(ctx, sprite, p.x, p.y, wall.height * DRAWN_HEIGHT * pixelsPerFoot) });
      }
    }
    return pieces;
  });
  return [...walls, ...layout.buildings.map(building => {
    const p = project(townPoint(layout, building)), shop = labels[building.id];
    const label = typeof shop === 'string' ? shop : shop?.label || building.label;
    const sprite = typeof shop === 'object' && shop?.sprite ? shop.sprite : building.sprite;
    return { y: p.y, draw: () => {
      const height = building.height * DRAWN_HEIGHT * pixelsPerFoot;
      if (sprite === 'shop-stockman') {
        // Living stock are separate from the pen art. Draw them behind its front rail so neither animal is frozen into
        // the structure, and let each existing grazing clip run at a stable, different phase.
        const timeMs = performance.now();
        drawClip(ctx, 'horse-graze', p.x - height * .34, p.y - height * .23, height * .27, { timeMs, seed: `${building.id}-horse` });
        drawClip(ctx, 'cow-graze', p.x + height * .21, p.y - height * .19, height * .23, { timeMs, seed: `${building.id}-cow` });
      }
      drawSprite(ctx, sprite, p.x, p.y, height);
      // A keeper's trade shows as soon as the town does, as in Gonzales; a building's own documented name only close in,
      // where the names of a street of buildings no longer sit on top of each other.
      if (label && scale > (labels[building.id] ? 1000 : 2600)) {
        ctx.save(); ctx.font = '12px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#f2e6c9';
        ctx.strokeText(label, p.x, p.y + 16); ctx.fillStyle = '#4c422e'; ctx.fillText(label, p.x, p.y + 16); ctx.restore();
      }
    } };
  })];
}
