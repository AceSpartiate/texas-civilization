// What the map can keep between frames instead of drawing again (docs/PERFORMANCE_RENDER.md).
//
// Everything under the people - relief, woods, scattered ground, water, roads, fields, the town's ground - changes only when a
// snapshot arrives, the camera moves, the canvas is resized, or art or a woods tile lands. The animation loop repaints the
// map twelve times a second so people walk; it was repainting all of that too, and on a throttled laptop that was the whole
// of the main thread. `public/app.js` draws the ground once into a canvas of its own and lays it down each frame.
//
// Kept in its own file with no browser imports so the decisions can be tested (tests/map-base.test.mjs).

/**
 * Whether the ground drawn for one key can be laid down for another. Keys are short arrays compared item by item with
 * `Object.is`, so a snapshot's world object counts as changed when a new one arrives even if it looks the same.
 */
export function sameLayerKey(kept, wanted) {
  if (!kept || !wanted || kept.length !== wanted.length) return false;
  for (let i = 0; i < kept.length; i++) if (!Object.is(kept[i], wanted[i])) return false;
  return true;
}

/**
 * What in a snapshot the kept ground is drawn from, as one string: the ground is drawn again when this changes, and not when
 * only people move, the clock turns or the story grows (2026-09-18, docs/PERFORMANCE_RENDER.md "Redrawn only when it
 * changed"). Until then every snapshot - and every click, which renders one - drew the whole country again.
 *
 * Read from what public/app.js's ground draws: the family's own land (its plots and their work, fences and crop, its grant,
 * its lane, the site being chosen) and field, or on the Host's map every family's; the ground somebody is on the way to
 * survey; and whether the class's woods are the land's. The map itself, the camera, the canvas, art and woods tiles are keyed
 * or invalidated apart. Kept for each snapshot, so the frames between snapshots pay nothing for it.
 * ceiling: a new thing drawn into the ground must be added here, or it goes stale until the camera moves; the ground audit
 * (`window.__groundAudit` in public/app.js) is what finds one.
 */
const groundOfWorld = new WeakMap();
export function groundInputs(world) {
  if (!world || typeof world !== 'object') return '';
  let kept = groundOfWorld.get(world);
  if (kept !== undefined) return kept;
  const host = world.role === 'host';
  const landOf = land => land ? [land.plots || null, land.grant || null, land.lane || null, land.choosingSite ?? null] : null;
  const lands = host
    ? Object.entries(world.overview?.lands || {}).sort(([a], [b]) => a.localeCompare(b)).map(([id, land]) => [id, land.homeSiteId || null, land.field || null, landOf(land)])
    : [[world.householdId || null, world.household?.homeSiteId || null, world.household?.field || null, landOf(world.land)]];
  const surveys = ((host ? world.others : world.entities) || []).filter(person => person.chore?.id === 'survey-plot' && person.chore.plot)
    .map(person => [person.chore.plot.x, person.chore.plot.y]);
  kept = JSON.stringify([world.role || null, world.map?.woods || null, lands, surveys]);
  groundOfWorld.set(world, kept);
  return kept;
}

/**
 * The drawing state the people and buildings used to inherit from the ground drawn before them in the same context. The
 * ground is now drawn into another context, so its last state is carried across each frame and nothing drawn on top of it
 * can look different for having lost, say, the roads' round line caps.
 */
export const INHERITED_STATE = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'globalAlpha', 'globalCompositeOperation', 'imageSmoothingEnabled', 'lineDashOffset'];
export function readDrawState(ctx) {
  const state = {};
  for (const key of INHERITED_STATE) state[key] = ctx[key];
  state.lineDash = ctx.getLineDash ? ctx.getLineDash() : [];
  return state;
}
export function applyDrawState(ctx, state) {
  if (!state) return;
  for (const key of INHERITED_STATE) if (ctx[key] !== state[key]) ctx[key] = state[key];
  ctx.setLineDash?.(state.lineDash);
}

/**
 * The pieces of a polyline that could come within `reach` of a box, as index pairs into `points`. A course with thousands
 * of points crossing the whole colonies is measured against only the few segments near the view; any segment that could be
 * within `reach` of a point in the box has a bounding box that meets the box grown by `reach`, so the nearest distance to
 * anything in the box is unchanged.
 */
export function segmentsNear(points, box, reach) {
  const kept = [];
  const minX = box.minX - reach, maxX = box.maxX + reach, minY = box.minY - reach, maxY = box.maxY + reach;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (Math.max(a.x, b.x) < minX || Math.min(a.x, b.x) > maxX || Math.max(a.y, b.y) < minY || Math.min(a.y, b.y) > maxY) continue;
    kept.push(i);
  }
  return kept;
}

/** The distance from a point to the nearest of the chosen segments (each `i` joins points[i - 1] to points[i]). */
export function distanceToSegments(p, points, indices) {
  let best = Infinity;
  for (const i of indices) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
    best = Math.min(best, Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)));
  }
  return best;
}

/**
 * Set a node's text only when it differs. Assigning `textContent` replaces the node's children even with the same words,
 * which the drawing loop did twelve times a second to five nodes: a DOM mutation and a style and layout pass each time.
 */
export function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

/**
 * How many canvas pixels to draw the map at for each CSS pixel. The screen's own density, up to 2, as before - but never
 * more pixels in all than `budget`, about a 1080p frame. A Chromebook with a 1.5 or 2 density screen was drawing the whole
 * map, every frame, at up to 4.8 million pixels; at the budget it is 2.1 million, a little softer and less than half the
 * work. Never below 1, so a plain screen is untouched.
 * ceiling: one budget for every machine; measuring the frame time and choosing the density from it is the way out.
 */
export const CANVAS_PIXEL_BUDGET = 1920 * 1100;
export function canvasRatio(cssWidth, cssHeight, density, budget = CANVAS_PIXEL_BUDGET) {
  const wanted = Math.min(2, density || 1), area = cssWidth * cssHeight;
  if (!(area > 0)) return wanted;
  return Math.max(Math.min(1, wanted), Math.min(wanted, Math.sqrt(budget / area)));
}

// ------------------------------------------------------------------------------------------------ level of detail
//
// Owner, 2026-09-17: "Rivers and forests pop in and out of their places during zoom. their shapes and sizes change too."
// Every detail band here hands over across a range of zoom instead of at one number, and nothing that is shown at one zoom
// moves when the zoom changes: it only fades.

/** 0 at `from`, 1 at `to`, straight between; `from` may be above `to` for something that fades as the value grows. */
export function ramp(value, from, to) {
  if (from === to) return value >= to ? 1 : 0;
  return Math.max(0, Math.min(1, (value - from) / (to - from)));
}

/**
 * How wide water is drawn, in pixels: its true width in the map's miles at this scale, never thinner than `floor` pixels.
 * The two meet smoothly (`hypot`), so a river narrows steadily as the camera pulls back and settles on a line, instead of
 * holding one width across a hundred-fold of zoom - the old floor was tied to the figure size and drew a river eighteen
 * pixels wide at every zoom below a county, which read as a lake, then as a tangle, as the map filled around it.
 */
export function waterWidth(miles, scale, floor) {
  return Math.hypot(miles * scale, floor);
}
export const WATER = Object.freeze({ river: Object.freeze({ miles: 0.05, floor: 3 }), creek: Object.freeze({ miles: 0.012, floor: 1.4 }) });
/** Creeks are detail: they fade in as the camera comes down to a colony, where rivers alone are the map. */
export const creekOpacity = scale => ramp(scale, 6, 14);

/**
 * The ground's scattered tufts, rocks, scrub and oaks, as levels of a grid that doubles: level 0 cells are `finest` miles,
 * level 1 cells twice that, and so on up to `top`. Every cell of every level may hold one thing, at a place fixed by the
 * cell alone. A view draws its finest level so that about `across` cells span it, fades in the level below as the camera
 * comes closer, and always draws every coarser level - so a thing on screen stays exactly where it is as the camera comes
 * in, and new things fade in between; pulling back, the finest fade out. The old scatter re-rolled every cell at each
 * doubling and thinned with a density that changed with every wheel step, so the prairie reshuffled as the student zoomed.
 */
export function scatterLevels(viewMiles, { finest = 0.01, across = 48, top = 16 } = {}) {
  const exact = Math.log2(Math.max(1e-9, viewMiles) / (across * finest));
  const full = Math.max(0, Math.ceil(exact));
  const levels = [];
  for (let level = Math.min(top, full); level <= top; level++) levels.push({ level, cell: finest * 2 ** level, alpha: 1 });
  const fading = full - 1, alpha = full - exact;
  if (fading >= 0 && alpha > 0.02) levels.unshift({ level: fading, cell: finest * 2 ** fading, alpha: Math.min(1, alpha) });
  return levels;
}

/**
 * A grid of cells as a smooth picture: each cell `upscale` pixels a side, blurred about a cell wide (two box passes each way,
 * which is close to a smooth bell), so a patch of timber or a class of ground has a soft edge instead of a staircase of
 * squares. `colourAt(column, row)` gives `[r, g, b, alpha 0-1]` or null. Returns `{ width, height, data }`, RGBA with straight
 * alpha, for `ImageData`. Blurred with alpha premultiplied, so a colour does not bleed grey into the empty cells around it.
 * The picture is laid down scaled and smoothed (bilinear), so it stays the same shape at every zoom.
 */
export function smoothCover(columns, rows, colourAt, { upscale = 4, radius = upscale >> 1 } = {}) {
  const width = columns * upscale, height = rows * upscale, size = width * height;
  const channels = [new Float32Array(size), new Float32Array(size), new Float32Array(size), new Float32Array(size)];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const colour = colourAt(column, row);
    if (!colour || !(colour[3] > 0)) continue;
    const a = colour[3];
    for (let dy = 0; dy < upscale; dy++) for (let dx = 0; dx < upscale; dx++) {
      const at = (row * upscale + dy) * width + column * upscale + dx;
      channels[0][at] = colour[0] * a; channels[1][at] = colour[1] * a; channels[2][at] = colour[2] * a; channels[3][at] = a;
    }
  }
  if (radius > 0) {
    const scratch = new Float32Array(Math.max(width, height));
    const pass = (channel, length, count, step, stride) => {
      const span = radius * 2 + 1;
      for (let line = 0; line < count; line++) {
        const start = line * stride;
        let sum = 0;
        // Edges are held (the nearest cell repeats), so a picture's border does not fade to nothing.
        for (let i = -radius; i <= radius; i++) sum += channel[start + Math.min(length - 1, Math.max(0, i)) * step];
        for (let i = 0; i < length; i++) {
          scratch[i] = sum / span;
          sum += channel[start + Math.min(length - 1, i + radius + 1) * step] - channel[start + Math.max(0, i - radius) * step];
        }
        for (let i = 0; i < length; i++) channel[start + i * step] = scratch[i];
      }
    };
    for (const channel of channels) for (let round = 0; round < 2; round++) { pass(channel, width, height, 1, width); pass(channel, height, width, width, 1); }
  }
  const data = new Uint8ClampedArray(size * 4);
  for (let i = 0; i < size; i++) {
    const a = channels[3][i];
    if (a <= 0.002) continue;
    data[i * 4] = channels[0][i] / a; data[i * 4 + 1] = channels[1][i] / a; data[i * 4 + 2] = channels[2][i] / a; data[i * 4 + 3] = a * 255;
  }
  return { width, height, data };
}

/** A number in [0, 1) fixed by a level, a cell and a salt. */
export function cellHash(level, cx, cy, salt = 0) {
  let value = Math.imul(cx ^ 0x27d4eb2f, 0x165667b1) ^ Math.imul(cy ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(level + 1, 0x632be5ab) ^ Math.imul(salt + 1, 0x5bd1e995);
  value = Math.imul(value ^ (value >>> 13), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 15), 0x297a2d39);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** What one cell of one level holds: where in the cell (0-1 each way), the roll that decides whether anything does, and the kind's share. */
export function scatterItem(level, cx, cy) {
  return { roll: cellHash(level, cx, cy, 1), jx: cellHash(level, cx, cy, 2), jy: cellHash(level, cx, cy, 3), share: cellHash(level, cx, cy, 4) };
}

/**
 * A land grid's two pictures as RGBA data: `wash`, each cell its class's colour, and `shade`, the hillshade (128 is level
 * ground; darker faces a shadow, brighter faces a light, docs/MAP_ACCURACY.md §6.2). `grid` is `{ columns, rows, cells,
 * shade }` as public/land-levels.js decodes it; `palette[classIndex]` is `[r, g, b, alpha]` or null. Pure and free of the
 * page, so the same pictures are made by the page or by public/land-worker.js, and a test can hold them to each other.
 */
export function landPictureData(grid, palette, upscale) {
  const wash = smoothCover(grid.columns, grid.rows, (column, row) => palette[grid.cells[row * grid.columns + column]] || null, { upscale });
  const shade = grid.shade ? smoothCover(grid.columns, grid.rows, (column, row) => {
    const i = row * grid.columns + column, value = grid.shade[i];
    if (!grid.cells[i] || value === 128) return null;
    return value < 128 ? [38, 46, 30, Math.min(.45, (128 - value) / 128 * .9)] : [255, 250, 226, Math.min(.3, (value - 128) / 127 * .6)];
  }, { upscale }) : null;
  return { wash, shade };
}

/**
 * A view with a hole cut out of it, as the rectangles left: above the hole, below it, and either side of it between. The
 * country outside the colonies' box is a picture with nothing in the middle, where the box is drawn (docs/MAP_ACCURACY.md §8);
 * laying down only these parts of it keeps a view of the box from paying for the empty middle. The rectangles never overlap,
 * and with the hole they cover the view. Each is `{ minX, minY, maxX, maxY }`; none is empty. No hole: the view.
 */
export function aroundHole(view, hole) {
  if (!hole || hole.maxX <= view.minX || hole.minX >= view.maxX || hole.maxY <= view.minY || hole.minY >= view.maxY) return [view];
  const top = Math.max(view.minY, hole.minY), bottom = Math.min(view.maxY, hole.maxY);
  return [
    { minX: view.minX, maxX: view.maxX, minY: view.minY, maxY: top },
    { minX: view.minX, maxX: view.maxX, minY: bottom, maxY: view.maxY },
    { minX: view.minX, maxX: Math.min(view.maxX, hole.minX), minY: top, maxY: bottom },
    { minX: Math.max(view.minX, hole.maxX), maxX: view.maxX, minY: top, maxY: bottom },
  ].filter(rect => rect.maxX > rect.minX && rect.maxY > rect.minY);
}

/** How far a land grid's picture is scaled up: as much as keeps it under about a million and a half pixels. */
export const landUpscale = grid => { const cells = grid.columns * grid.rows; return cells * 16 <= 1.5e6 ? 4 : cells * 4 <= 1.5e6 ? 2 : 1; };

/**
 * How near a journey's two ends somebody is still drawn (miles), and how far a tick may carry them before the middle of the
 * journey is left unwatched.
 *
 * Owner, 2026-09-17, playtesting: "when i sent someone to join the army, they zipped excessively fast across the map", and
 * then: "what if we used fog of war to hide teleporting the character to their destination so they could walk slower, but
 * still appear to arrive on time? ... hide long distance travel on the class view?" In the winter and the spring a tick is
 * twelve hours (sim/clock.mjs `CALENDAR_SCALE`), so a walking man crosses about thirty-six miles in the fifth of a second a
 * tick is drawn in. The clock and the real distances are left alone; the long middle of such a journey is not watched.
 *
 * At the farming scale a tick is twenty minutes and a walk is a mile, which is a walk a student can follow: nothing is
 * hidden there, and a family crossing its own land is watched from end to end as it always was.
 */
export const IN_SIGHT_MILES = 2.5, WATCHABLE_MILES_A_TICK = 2;
/** A tick of the farming clock, in minutes of 1835 (sim/clock.mjs TICK_MINUTES): what a travelling speed is measured against. */
export const FARMING_TICK_MINUTES = 20;
/**
 * Whether somebody is out of sight on the long middle of a journey. `minutesATick` is how many minutes of 1835 the last tick
 * stood for, which the page reads from two snapshots in a row; without it nothing is hidden.
 */
export function outOfSight(entity, minutesATick = 0) {
  const travel = entity?.travel;
  if (!travel?.points?.length || !Number.isFinite(travel.distance)) return false;
  // The server says how many miles its next tick carries this journey (sim/world.mjs `milesATick`): a tick longer than an
  // hour carries a share of a day on the road, not every hour of it at the pace (sim/travel.mjs `roadTicks`), and the page
  // must not work that out again. Without it (a class saved and served before it was sent), the old reading: a speed is
  // miles a farming tick, and a tick of the compressed calendar carries that many times over.
  if (!(minutesATick > 0)) return false;
  const milesATick = Number.isFinite(travel.step) ? travel.step : travel.speed * (minutesATick / FARMING_TICK_MINUTES);
  if (!(milesATick > WATCHABLE_MILES_A_TICK)) return false;
  const gone = travel.progress ?? 0, left = travel.distance - gone;
  return Math.min(gone, left) > IN_SIGHT_MILES;
}
