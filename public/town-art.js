// A town of the colonies, drawn from its layout (sim/town-layouts.mjs, served as /town-layouts.js; docs/TOWNS.md §5b).
//
// The same data the server puts the shopkeepers in, so a keeper always stands at a building that is drawn. Streets and
// squares go on the ground first; buildings are returned as drawables so they sort with the people standing among them.
import { drawSprite } from '/art.js';
import { drawRoad } from '/landscape-art.js';
import { DRAWN_HEIGHT, FEET_PER_MILE, townPoint } from '/town-layouts.js';

/** Streets and public squares, under everything. `project` takes miles from the town's site point to the screen. */
export function drawTownGround(ctx, layout, project, scale) {
  const at = point => project(townPoint(layout, point)), pixelsPerFoot = scale / FEET_PER_MILE;
  ctx.save();
  for (const square of layout.squares) {
    const corners = [[0, 0], [square.width, 0], [square.width, square.height], [0, square.height]].map(([dx, dy]) => at({ x: square.x + dx, y: square.y + dy }));
    ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.globalAlpha = .7; ctx.fillStyle = '#ccb985'; ctx.fill();
    ctx.globalAlpha = .5; ctx.strokeStyle = '#a59063'; ctx.lineWidth = Math.max(1, pixelsPerFoot * 4); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A street the town platted and nobody had yet built along is drawn as a faint trace, not a road.
  for (const street of layout.streets) {
    // Drawn at six tenths of the platted width: `drawRoad` edges a road half as wide again, and at full width the streets
    // outweighed the town standing along them.
    const points = street.points.map(at), width = Math.max(1, street.width * pixelsPerFoot * .6);
    if (street.faint) { ctx.globalAlpha = .35; drawRoad(ctx, points, width * .6); ctx.globalAlpha = 1; } else drawRoad(ctx, points, width);
  }
  ctx.restore();
}

/**
 * Every building as a drawable. `labels` names the buildings a shopkeeper keeps, by building id, from the map's own shops
 * (sim/shops.mjs); a building's own documented name shows otherwise. Names appear only when the town is close.
 */
export function townDrawables(ctx, layout, project, scale, labels = {}) {
  const pixelsPerFoot = scale / FEET_PER_MILE;
  return layout.buildings.map(building => {
    const p = project(townPoint(layout, building)), label = labels[building.id] || building.label;
    return { y: p.y, draw: () => {
      drawSprite(ctx, building.sprite, p.x, p.y, building.height * DRAWN_HEIGHT * pixelsPerFoot);
      // A keeper's trade shows as soon as the town does, as in Gonzales; a building's own documented name only close in,
      // where the names of a street of buildings no longer sit on top of each other.
      if (label && scale > (labels[building.id] ? 1000 : 2600)) {
        ctx.save(); ctx.font = '12px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#f2e6c9';
        ctx.strokeText(label, p.x, p.y + 16); ctx.fillStyle = '#4c422e'; ctx.fillText(label, p.x, p.y + 16); ctx.restore();
      }
    } };
  });
}
