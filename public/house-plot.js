// The house plot on the family's page: docs/WOODS_AND_BUILDING.md §6.2, build step 5.
//
// A grid of eight-foot cells, the period plans to start from, and the pieces to place. What each piece needs and does,
// what the whole plan would give and still wants, and how far each piece has got all come from the server (the catalogue
// once, the family's land line on the tick); the page only lays them out and sends what the student chooses. The server
// decides where a piece may go.
import { CELL_SHARE, houseFootprint, turned } from '../sim/house-footprint.mjs';
// A house's cells turned on the ground, and the footprint they make, are the server's own (sim/house-footprint.mjs): the
// house drawn here is the house sim/house-placement.mjs checks.
export { houseFootprint, turned };

const PHASES = { site: 'the site laid out', walls: 'walls going up', roofing: 'roof going on', finished: 'standing' };

let selected = null, shown = '', pending = false;

const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const partsIn100 = share => Math.round(share * 100);
const logWords = logs => [logs.wall && `${logs.wall} wall`, logs.sill && `${logs.sill} sill`, logs.any && `${logs.any} of any kind`].filter(Boolean).join(', ') || 'no logs';

/**
 * The next stage, what it wants before anybody can start it, and what the family has to start it with (owner, 2026-09-17:
 * "say what the next house stage needs"). Until now the panel said what the whole plan still wanted - "still wants 26 wall
 * logs" - and a student who hauled eleven logs in could not tell why the walls still would not go up. The stage and its
 * want are the server's (`stageWants` in sim/houseplot.mjs); the pile is the family's own land line. A stage already begun
 * wants no more logs: they went onto it when it started.
 */
export function nextLine(house, logs) {
  const wants = house.wants || null;
  if (!wants) return `Next: ${house.stage}.`;
  const asks = wants.logs.wall || wants.logs.sill || wants.logs.any;
  const sound = (logs?.wall || 0) + (logs?.sill || 0), poor = logs?.poor || 0, lying = logs?.lying || 0;
  const have = `${sound} sound${poor ? ` and ${poor} poor` : ''} at the house${lying ? `, ${lying} lying out` : ''}`;
  return `Next: ${house.stage}. It wants ${asks ? `${logWords(wants.logs)} logs and ` : ''}about ${wants.hours} hours\u2019 work; ${have}.`;
}

/** Whether this family plans its house on the plot. */
export const plotted = (world, catalogue) => Boolean(catalogue && world.role !== 'host' && world.land?.plot);

/**
 * Draw the plot panel. `send(command)` posts an order and resolves or throws with the server's sentence; `rerender` asks
 * for the page to be drawn again.
 */
export function renderHousePlot(world, catalogue, { open, send, rerender, drawSprite, spriteFrame, place }) {
  const panel = document.querySelector('#house-plot');
  if (!panel) return;
  panel.hidden = !open;
  if (!open) { shown = ''; return; }
  const land = world.land || {}, house = land.house;
  panel.dataset.additional = String(Boolean(land.canAddHouse));
  const shape = JSON.stringify([house, land.choices, land.planned, land.home, land.logs, selected]);
  // Repaint previews when lazy-loaded art becomes available, even if the plan is unchanged.
  shown = shape;


  const summary = panel.querySelector('#plot-summary');
  const count = (land.completedHouses?.length || 0) + (house ? 1 : 0);
  summary.replaceChildren(el('p', house ? `House ${count}: ${house.stage || 'planned'}.` : 'Pick a house for your family.'));
  if (house?.wants) summary.append(el('p', nextLine(house, land.logs), 'house-line'));
  if (house?.why) summary.append(el('p', house.why, 'house-line'));

  // The period plans, while nothing is begun.
  const plans = panel.querySelector('#plot-plans');
  plans.replaceChildren(...(land.additionalChoices || land.choices || []).map(choice => {
    const plan = catalogue.plans.find(each => each.id === choice.id);
    const button = el('button', undefined, 'house-choice');
    const preview = el('canvas');
    preview.width = 280; preview.height = 130;
    preview.setAttribute('aria-hidden', 'true');
    const finished = (plan?.pieces || []).map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type)?.stageCount || 1, 0]);
    if (drawSprite) drawHousePlot(preview.getContext('2d'), 140, 105, 65, { house: { pieces: finished } }, catalogue, drawSprite, spriteFrame);
    button.append(preview, el('strong', plan?.name || choice.id), el('span', land.canAddHouse ? 'Build another' : house?.plan === choice.id ? 'Selected' : 'Choose this house'));

    button.type = 'button'; button.dataset.plan = choice.id; button.disabled = !choice.can || pending;
    button.setAttribute('aria-pressed', String(!land.canAddHouse && house?.plan === choice.id));
    if (!choice.can) button.title = choice.why;
    return button;
  }));
  plans.hidden = !land.choices && !land.additionalChoices;

  // The presets are the complete player-facing choice; construction details stay in the simulation.
  panel.querySelector('#plot-grid').hidden = true;
  panel.querySelector('#plot-palette').hidden = true;
  panel.querySelector('#plot-hint').textContent = 'Choose a finished house below. Then close this panel and assign Build house from your person’s actions.';
  // Wire the controls once; they read `selected` and send through `send`.
  if (!panel.dataset.wired) {
    panel.dataset.wired = 'true';
    panel.addEventListener('click', async event => {
      const note = panel.querySelector('#plot-note');
      const target = event.target.closest('button');
      if (!target || target.disabled) return;
      const act = async command => {
        if (pending) return;
        pending = true; note.textContent = ''; shown = ''; rerender();
        try { await send(command); } catch (error) { note.textContent = error.message; } finally { pending = false; shown = ''; rerender(); }
      };
      if (target.dataset.piece) { selected = selected === target.dataset.piece ? null : target.dataset.piece; shown = ''; rerender(); return; }
      if (target.dataset.plan) { selected = null; if (place) return place({ action: 'plan-house', layout: target.dataset.plan, additional: panel.dataset.additional === 'true' }); return act({ action: 'plan-house', layout: target.dataset.plan, additional: panel.dataset.additional === 'true' }); }
      if (target.dataset.remove !== undefined) return act({ action: 'remove-piece', index: Number(target.dataset.remove) });
      if (target.dataset.x !== undefined && selected) return act({ action: 'place-piece', piece: selected, x: Number(target.dataset.x), y: Number(target.dataset.y) });
    });
  }
}

/** Which of the house pictures a pen is drawn with, and how far up: site, walls, roofing, or finished (no suffix). */
function penPicture(p) {
  const kind = p.type === 'pen-hewn' ? 'hewn-log' : p.type === 'pen-jacal' ? 'jacal' : 'round-log';
  if (p.stage >= p.kind.stageCount) return `house-${kind}`;
  const lastWall = p.type === 'pen-jacal' ? 1 : 10;
  return `house-${kind}-${p.stage < 1 ? 'site' : p.stage <= lastWall ? 'walls' : 'roofing'}`;
}

/**
 * Where a roof goes on its walls, when the walls are drawn standing at (x, y) `height` high: the point to draw it at, the
 * height to draw it and the point of its own frame to put there. The house-modules sheet draws each piece of a pen alone
 * in its cell, and a frame's ground anchor is where it meets the ground - which for a roof is the low front tip of its
 * eaves. Drawn at the walls' ground anchor, the roof came down in front of the walls to the ground (student, 2026-09-23:
 * "the roof doesn't seem to stay where it's supposed to be. It slides forward."). The atlas measures a seat on the full
 * walls and on each roof (`seatX`, `seatY`: the middle of the wall tops, the middle of the eaves; scripts/
 * build-atlas-manifest.mjs `seatOf`), and the roof is drawn with the one on the other, at the walls' own pixel scale.
 * null when either frame has no seat, and then no roof is seated at all.
 */
export function roofSeat(walls, roof, x, y, height, flip = false) {
  if (!Number.isFinite(walls?.seatX) || !Number.isFinite(roof?.seatX)) return null;
  const scale = height / (walls.logicalHeight || walls.h);
  return {
    // Mirrored (a pen at a quarter turn, `drawHousePlot`), the walls' seat is as far the other side of their anchor.
    x: x + (flip ? -1 : 1) * (walls.seatX - walls.anchorX) * walls.w * scale,
    y: y + (walls.seatY - walls.anchorY) * walls.h * scale,
    height: (roof.logicalHeight || roof.h) * scale,
    anchor: [roof.seatX, roof.seatY],
  };
}

/**
 * A round- or hewn-log pen from the modular pieces, at its stage: sills, low walls, full walls, then its roof on them.
 * Every stage is drawn at the full walls' pixel scale, `height` being the height the full walls stand, so the pen does
 * not grow or shrink as it goes up: drawn each to `height`, the sill frame (198 pixels) came out 28% bigger than the walls
 * (253) that replaced it. The roof is clapboard whatever the logs are, so both pens take the sheet's two roofs, which are
 * named for the row they were drawn in: `house-round-roof-partial` once the roof stage is done and the pen is still to be
 * chinked, `house-hewn-roof-finished` when it is. Returns the width drawn, or 0 when the modular art cannot be drawn and
 * seated - no sheet, no frames, no seats - so the caller draws the pen's whole picture instead (`penPicture`). `flip`
 * says the `drawSprite` given mirrors every picture about its foot, so the roof's seat is mirrored with the walls.
 */
function drawLogPen(ctx, p, x, y, height, drawSprite, spriteFrame, flip = false) {
  if (p.type === 'pen-jacal' || !spriteFrame) return 0;
  const material = p.type === 'pen-hewn' ? 'hewn' : 'round';
  const course = Math.max(0, p.stage - 1);
  const base = course === 0 ? `house-${material}-sill` : course <= 4 ? `house-${material}-low-walls` : `house-${material}-full-walls`;
  const walls = spriteFrame(`house-${material}-full-walls`), frame = spriteFrame(base);
  const roofName = penRoof([p]);
  const seat = p.stage >= 12 ? roofSeat(walls, spriteFrame(roofName), x, y, height, flip) : null;
  if (!walls || !frame || (p.stage >= 12 && !seat)) return 0;
  const drawn = drawSprite(ctx, base, x, y, height * (frame.logicalHeight || frame.h) / (walls.logicalHeight || walls.h));
  if (!drawn) return 0;
  if (seat) drawSprite(ctx, roofName, seat.x, seat.y, seat.height, { anchor: seat.anchor });
  return drawn;
}

/**
 * The roof a pen has on (`drawLogPen`), and a passage between pens (`drawHousePlot`): the finished one when every pen is
 * done, the partial one while any is still to be chinked.
 */
const penRoof = pens => pens.every(p => p.stage >= p.kind.stageCount) ? 'house-hewn-roof-finished' : 'house-round-roof-partial';

/** How wide one eight-foot cell of the plot is drawn, for a house drawn `size` high: the one rule both draws below use. */
export const plotCell = size => size * CELL_SHARE;

/**
 * How far a chimney's foot stands out from the middle of its gable wall, as a share of the pen's depth through that wall:
 * half a chimney's depth, so its back is against the wall and its front stands clear of it. A stick-and-mud or stone
 * chimney was built against the outside of a gable wall, centred on it (`HIST-GONZ-025`: "an exterior chimney centred in
 * one gable wall").
 * ceiling: one depth for every chimney, a guess at five feet of a sixteen-foot pen; the sheet's chimneys are drawn alone
 * with no depth to read. A chimney drawn with its wall-side foot marked (docs/ART_REQUESTS.md, 2026-09-15) replaces it.
 */
export const CHIMNEY_STANDS_OUT = 0.1;
/**
 * How high a chimney is drawn, in cells of the plot (the pen's full walls are 2.2): high enough that one against the gable
 * behind the walls rises over the ridge, as the chimney does in the whole-house pictures (the houses-settling sheet). At
 * 1.55 its top was under the roof's back slope once it stood against its wall, and the pen hid it whole. And how high the
 * saddlebag's double chimney - the same picture - is drawn where it stands between its far pen's front gable and its near
 * pen's back gable (`standChimneys`): half a cell of the ridge out from the far pen's door, behind the near pen's roof, it
 * has to be taller, and so wider, than a single chimney to hide that door whole (at 2.35 the door's top corner showed;
 * until 2026-09-24 it stood `DOUBLE_TOWARD`, 0.8 of a cell, down the screen from the far gable at 90 and 270 degrees, and
 * `CHIMNEY_HIGH` behind both pens' back gables at 0 and 180).
 * ceiling: one height, tuned by eye to the house-modules sheet; the reach it takes up the screen is inside
 * `PICTURE_REACH.up` (tests/house-spacing.test.mjs), so a taller chimney has to move that and the server's spacing with it.
 */
export const CHIMNEY_HIGH = 2.1, DOUBLE_RISE = 2.7;
/**
 * The passage of a dog-run between its two pens along their ridge (`alongRidge`): its roof is the roof its pens have on -
 * the finished one, or the partial one while their walls are still to chink (`penRoof`) - seated as on a pen standing at
 * the middle of the passage, so it runs on from one pen's roof to the other's a pen's depth long, half a cell of the ridge
 * over each. Its floor (`house-passage-floor`) is drawn
 * `PASSAGE_FLOOR_HIGH` cells high - its deck as wide as a pen's gable wall, read by eye (150 pixels of the floor's frame to
 * the walls' 186) - with its foot `PASSAGE_FLOOR_BACK` cells of the ridge toward the near pen, so its back edge is on the
 * far pen's front wall and the near pen stands over its front.
 * ceiling: the floor's deck read by eye; the pens' roof reused because the sheet's passage roof does not meet them.
 */
export const PASSAGE_FLOOR_HIGH = 1.5, PASSAGE_FLOOR_BACK = 0.6;

/**
 * A gable wall of a pen as the full walls are drawn, in pixels of their frame: the middle of the wall where it meets the
 * ground, and the pen's depth through it pointing out of it. The atlas measures the feet of the three corner posts the
 * viewer sees (`ground`: scripts/build-atlas-manifest.mjs `groundOf`); the fourth, behind the walls, closes the figure.
 * The sheet draws the pen corner-on with its roof's gables on the face to the left and front (the door's) and the face to
 * the right and back, so `front` is the one on the viewer's side, and the other is behind the walls. null with no ground.
 */
function gableOf(walls, front) {
  const ground = walls?.ground;
  if (!ground) return null;
  const [l, f, r] = [ground.left, ground.front, ground.right].map(([u, v]) => [u * walls.w, v * walls.h]);
  const b = [l[0] + r[0] - f[0], l[1] + r[1] - f[1]];
  const [one, other] = front ? [l, f] : [r, b];
  return { middle: [(one[0] + other[0]) / 2, (one[1] + other[1]) / 2], out: front ? [f[0] - r[0], f[1] - r[1]] : [r[0] - f[0], r[1] - f[1]] };
}

/**
 * Where a chimney's foot goes against a pen's gable wall, when the pen's full walls are drawn with their foot at (x, y),
 * `height` high, mirrored or not (a quarter turn, `drawHousePlot`): the middle of the wall on the ground, `out` of the
 * pen's depth outside it. `front` is the gable on the viewer's side of the picture. null when the walls are not measured.
 */
export function gableFoot(walls, front, x, y, height, flip = false, out = CHIMNEY_STANDS_OUT) {
  const gable = gableOf(walls, front);
  if (!gable) return null;
  const scale = height / (walls.logicalHeight || walls.h);
  const [u, v] = [gable.middle[0] + out * gable.out[0], gable.middle[1] + out * gable.out[1]];
  return { x: x + (flip ? -1 : 1) * (u - walls.anchorX * walls.w) * scale, y: y + (v - walls.anchorY * walls.h) * scale };
}

/**
 * The pens' chimneys, as the plan has them: each pen with the gables its chimneys stand against, `east` true for its east
 * gable. A single chimney is the cell beside a pen's end wall, on one of its two rows; the saddlebag's double chimney is
 * the cell between two pens on their row, the west pen's east gable and the east pen's west.
 */
function chimneyGables(order) {
  const pens = order.filter(each => each.p.kind.pen), found = [];
  const row = (pen, p) => p.y >= pen.p.y && p.y < pen.p.y + 2;
  for (const chimney of order.filter(each => /^chimney/.test(each.p.type))) {
    const { p } = chimney;
    if (p.kind.place === 'between') {
      found.push({ chimney, walls: [[pens.find(pen => pen.p.y === p.y && pen.p.x + 2 === p.x), true], [pens.find(pen => pen.p.y === p.y && pen.p.x === p.x + 1), false]] });
      continue;
    }
    const east = pens.find(pen => row(pen, p) && pen.p.x + 2 === p.x && pen.p.type !== 'pen-jacal');
    found.push({ chimney, walls: [east ? [east, true] : [pens.find(pen => row(pen, p) && pen.p.x - 1 === p.x), false]] });
  }
  return found;
}

/**
 * Whether a pen's gable that faces `(dx, dy)` on the ground, turned (`turned`), is the one the sheet draws in front - the
 * door's - in the picture drawn mirrored (`flip`) or not. The sheet draws a pen corner-on, the door in its left-front gable
 * and none in its right-back one, behind the walls; mirrored, the door's gable is the right-front and the other the
 * left-back. A gable toward the viewer is the front one in either picture, one away from the viewer the back one in
 * either, and one to the side the front one of the picture that has its door on that side.
 */
export const doorGable = (dx, dy, flip) => dy > 0 || (dy === 0 && (flip ? dx > 0 : dx < 0));

/**
 * Which way a house's log pens are drawn - all of them the same way, mirrored (`true`) or not - so that as few of its
 * chimneys as can be stand on the gable the sheet draws the door in (owner, 2026-09-24: "fix the chimney standing in front
 * of the door"), and so that a house of two pens has one ridge line (owner, 2026-09-24: "the angle of the houses makes it
 * so they don't seem to be connected single buildings"). Sets `flip` on each pen in `order`; `flip` is the house's own
 * mirroring (a quarter turn mirrors every piece, `drawHousePlot`), which it keeps where the two pictures are as good.
 *
 * The round-log cabin at 180 degrees is mirrored, its chimney against the doorless back gable to the left; at 0 and 270
 * either picture puts its chimney behind the walls and at 90 in front, so it keeps the house's. A dog-run or saddlebag
 * has one chimney gable on the door's side whichever way it is drawn (`alongRidge`), and keeps the house's.
 *
 * Until 2026-09-24 each pen was chosen alone (`mirrorPens`), so a dog-run at 0 or 180 had its two pens as mirror images,
 * each chimney behind its outer end, and their two ridges on different diagonals, a V: two cabins, not one house.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-23 - the house from its other sides. A chimney whose gable is the door's
 * - the cabins at 90 degrees, the dog-run's near pen and the saddlebag's far pen at every turn - has no picture to stand
 * against: the gable is the door's in both. It stays against that gable, in front of the door and hiding it whole, so the
 * gable reads as the chimney's end (coordinator, 2026-09-24), until the sheet has a pen with its door in the other gable
 * (tests/house-chimney.test.mjs holds the whole door covered).
 */
function housePicture(order, rotation, flip) {
  const logPens = order.filter(each => each.p.kind.pen && each.p.type !== 'pen-jacal');
  for (const pen of order.filter(each => each.p.kind.pen)) pen.flip = flip;
  const gables = chimneyGables(order).flatMap(({ walls }) => walls).filter(([pen]) => pen && pen.p.type !== 'pen-jacal').map(([, east]) => turned(east ? 1 : -1, 0, rotation));
  const onDoors = mirrored => gables.filter(([dx, dy]) => doorGable(dx, dy, mirrored)).length;
  const chosen = onDoors(!flip) < onDoors(flip) ? !flip : flip;
  for (const pen of logPens) pen.flip = chosen;
  return chosen;
}

/**
 * The ridge of the pen's finished roof on the house-modules sheet (`house-hewn-roof-finished`), in its frame's pixels: two
 * points on the axis of the ridge log, from its lower edge read column by column every five pixels from 125 to 210 and
 * fitted to a line, half the log's thickness above it. The sheet draws the roof's ridge steeper than the ground of the
 * walls it sits on (slope 0.88 against 0.72): drawn along the walls' ground, two pens' ridges came out a sixth of a cell
 * apart. The partial roof (`house-round-roof-partial`) has its ridge within a degree of this one (read by its log ends).
 * ceiling: read by eye; a ridge line drawn with the roof (docs/ART_REQUESTS.md, request 2026-09-24 - one roof over a
 * two-pen house) replaces it.
 */
export const RIDGE = Object.freeze([[110, 96], [205, 12]]);

/**
 * The pens of a house in one row - a dog-run or a saddlebag - stood one behind the other along their roof's ridge, so
 * that the house reads as one building under one ridge line (owner, 2026-09-24: "the angle of the houses makes it so they
 * don't seem to be connected single buildings"). The house-modules sheet draws a pen corner-on, its ridge running back up
 * the screen on a diagonal (to the right; mirrored, to the left), and nothing in it runs along the house's long side on
 * the ground: stood side by side where their cells are, two pens made two ridges side by side - two cabins with grass
 * between, and mirrored one against the other as `mirrorPens` chose them, a V. So each piece is moved from where its cells
 * put it along the house's long side to as far along the ridge: one cell of the plan (eight feet) is half the pen's depth
 * along the ridge - the walls' own ground (`ground`, from the front corner to the right one) laid on the ridge's line
 * (`RIDGE`). The end that goes up the ridge, away from the viewer, is the one whose gable is the back one in the house's
 * picture (`doorGable`): east at 0 and 270 degrees, west at 90 and 180.
 *
 * The middle of the row - the passage, the double chimney - stays where the row's feet were at the middle of the house,
 * but across the screen the middle of the pens' ground stands there, not their feet (a foot is the front corner, a fifth
 * of a cell to the side of the middle of the pen): so the house reaches as far past its ground to the left as to the
 * right. A piece in front of a pen or behind it (a porch, a shed room: only a free-built plot has them) moves with its pen.
 * Returns `{ along, flip, walls }` for the row, `along` the screen offset of one cell up the ridge, or null for a house
 * that is not one row of log pens with measured walls, which stays where its cells are.
 *
 * ceiling: the house runs on the art's diagonal while the ground the server checks is its cells, so a dog-run's far pen
 * stands a cell and a quarter higher than its near one: its pictures reach past its ground further up and down the screen
 * at 0 and 180 degrees, and either side at 90 and 270, than a cabin's, and its near pen stands in front of its ground's
 * front edge (`PICTURE_REACH`, which the server's spacing reads). The pen's long side toward the viewer (docs/
 * ART_REQUESTS.md, request 2026-09-24 - one roof over a two-pen house) would let a house run along its ground.
 */
function alongRidge(order, rotation, cell, spriteFrame, flip, catalogue, x, y) {
  const pens = order.filter(each => each.p.kind.pen);
  if (pens.length < 2 || pens.some(pen => pen.p.type === 'pen-jacal' || pen.p.y !== pens[0].p.y)) return null;
  const wallsName = `house-${pens[0].p.type === 'pen-hewn' ? 'hewn' : 'round'}-full-walls`, walls = spriteFrame?.(wallsName);
  if (!walls?.ground) return null;
  const scale = cell * 2.2 / (walls.logicalHeight || walls.h), { left: l, front: f, right: r } = walls.ground, side = flip ? -1 : 1;
  const depth = Math.hypot((r[0] - f[0]) * walls.w, (r[1] - f[1]) * walls.h);
  const [[ax, ay], [bx, by]] = RIDGE, ridge = Math.hypot(bx - ax, by - ay);
  const along = { x: side * (bx - ax) / ridge * depth / 2 * scale, y: (by - ay) / ridge * depth / 2 * scale };
  // Which way the plan's east runs along the ridge: up it where the east gable is the back one in this picture.
  const [ex, ey] = turned(1, 0, rotation), up = doorGable(ex, ey, flip) ? -1 : 1;
  const middle = (Math.min(...pens.map(pen => pen.p.x)) + Math.max(...pens.map(pen => pen.p.x + pen.p.kind.w))) / 2, rowY = pens[0].p.y;
  // Where the row's feet stand at its middle - the front edge of its pens' cells - and the pens' ground middle across.
  const [mx, my] = turned(middle - catalogue.columns / 2, rowY + 1 - catalogue.rows / 2, rotation);
  const across = -side * ((l[0] + r[0]) / 2 - walls.anchorX) * walls.w * scale;
  for (const each of order) {
    const t = each.p.x + each.p.kind.w / 2 - middle, [cx, cy] = turned(t, 0, rotation);
    each.along = t * up;
    const inRow = each.p.y >= rowY && each.p.y + each.p.kind.h <= rowY + 2;
    const from = inRow ? { x: x + mx * cell, y: y + my * cell } : { x: each.footX - cx * cell, y: each.footY - cy * cell };
    each.footX = from.x + across + each.along * along.x;
    each.footY = from.y + each.along * along.y;
  }
  // Back to front along the ridge: the far pen, what stands between, the near pen.
  order.sort((a, b) => a.footY - b.footY);
  return { along, flip, walls: wallsName, pens: pens.map(pen => pen.p) };
}

/**
 * Stand each chimney against its gable wall, and put it in the drawing order where that wall is (owner, 2026-09-23:
 * "Something looks wrong with the chimneys too. Are they positioned correctly?"). A chimney's piece of the plot is the
 * cell beside its pen's end wall, and it was drawn with its foot at the front of that cell. But the sheet draws a pen
 * corner-on, two and a half cells wide and little more than one deep, so the cell beside a pen is not where the picture's
 * end wall is: the chimney stood on the grass to the right of a cabin, in front of it at 90 degrees, behind it at 270.
 *
 * The plot says which pen and which end - east of the pen is its east gable, west its west - and the turn says where on
 * the screen that gable faces (`turned`). The house's pens are drawn one way, as `housePicture` chose: their gables are the
 * left-front face (the door's) and the right-back face, mirrored the right-front and the left-back (`doorGable`). A cabin
 * is drawn so that a gable to the side is its back one; a house of two pens in the house's own mirroring, so that their
 * ridges run on one line (`alongRidge`), and the gable at the near end of that line is the door's:
 *
 *                   0            90            180           270
 *   a cabin
 *   east gable   right-back   right-front   left-back    left-back
 *   west gable   left-back    left-back     right-back   right-front
 *   two pens
 *   east gable   right-back   right-front   left-front   left-back
 *   west gable   left-front   left-back     right-back   right-front
 *
 * A chimney against a gable behind the walls is drawn before its pen, which hides its foot, and it rises behind the roof;
 * against one in front it is drawn after its pen. The saddlebag's double chimney stands between its two pens, the one
 * pen's east gable and the other's west: one behind the other along their ridge, the far pen's front gable faces the near
 * pen's back gable across the chimney's cell, and it stands at the middle between them, drawn after the far pen and before
 * the near one, whose roof hides its foot (until 2026-09-24 it stood behind both pens' back gables at 0 and 180 degrees,
 * and at 90 and 270 against the far pen's gable brought 0.8 of a cell toward the near one).
 *
 * `order` is the pieces back to front, `{ p, footX, footY, flip, ... }` as `drawHousePlot` places them and `housePicture`
 * and `alongRidge` turn and move them; it is changed in place. A chimney whose pen has no measured walls - a jacal, or no
 * `spriteFrame` - stays at its own cell, as it always was.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-23 - the house from its other sides; the front gables in the table are
 * the door's (`housePicture`).
 */
function standChimneys(order, rotation, cell, spriteFrame) {
  const gable = ([pen, east]) => {
    const walls = pen && pen.p.type !== 'pen-jacal' && spriteFrame?.(`house-${pen.p.type === 'pen-hewn' ? 'hewn' : 'round'}-full-walls`);
    if (!walls?.ground) return null;
    const [dx, dy] = turned(east ? 1 : -1, 0, rotation), front = doorGable(dx, dy, pen.flip);
    return { pen, front, foot: out => gableFoot(walls, front, pen.footX, pen.footY, cell * 2.2, pen.flip, out) };
  };
  for (const { chimney, walls: ends } of chimneyGables(order)) {
    const walls = ends.map(gable);
    if (!walls.length || !walls.every(Boolean)) continue;
    if (walls.length === 2) {
      // Between two pens one behind the other along the ridge (`alongRidge`): the far pen's front gable and the near pen's
      // back gable face one another across the chimney's cell, and it stands at the middle between them, drawn after the
      // far pen and before the near one, whose roof hides its foot. Its two pens are drawn one way (`housePicture`), so one
      // gable is the front one and the other the back.
      order.splice(order.indexOf(chimney), 1);
      const far = walls.find(each => each.front)?.pen, near = walls.find(each => !each.front)?.pen;
      const [a, b] = walls.map(each => each.foot(0));
      Object.assign(chimney, { footX: (a.x + b.x) / 2, footY: (a.y + b.y) / 2 });
      if (far && near && order.indexOf(near) < order.indexOf(far)) { order.splice(order.indexOf(near), 1); order.splice(order.indexOf(far) + 1, 0, near); }
      order.splice(order.indexOf(far || near) + 1, 0, chimney);
      continue;
    }
    const [wall] = walls, foot = wall.foot(CHIMNEY_STANDS_OUT);
    Object.assign(chimney, { footX: foot.x, footY: foot.y });
    order.splice(order.indexOf(chimney), 1);
    order.splice(order.indexOf(wall.pen) + (wall.front ? 1 : 0), 0, chimney);
  }
}

/**
 * The house plot drawn on the family's own land, piece by piece at its stage, round the house's point. Returns how many
 * pieces were drawn. `spriteFrame(name)` gives a frame's measurements (public/art.js); without it a pen is drawn as its
 * whole picture, since the modular pieces cannot be seated on one another. Delivered modular art covers round/hewn pens,
 * passage, porch, finished shed room, and single chimneys. stand-in: jacal stages, the shed frame, double chimney and
 * independent interior floor/loft layers still use earlier pictures or shapes. Requested in docs/ART_REQUESTS.md
 * 2026-09-15 (the house plot's pieces).
 *
 * `rotation` turns the house on the ground and never its pictures (2026-09-23: a house turned 90 degrees lay on its side,
 * and one at 180 stood on its roof, chimney and all). Everything on the map - tree, person, ox, house - is drawn upright
 * in the one fixed three-quarter view, so a turn moves each piece to its turned cells (`turned`) and draws it upright
 * there, back to front by its turned front edge. The sheet draws a pen corner-on, the gable and door on the face to the
 * left and the ridge running back to the right. A quarter turn brings the gable round to the other face and lays the ridge
 * along the other diagonal, which is the picture mirrored; a half turn leaves the silhouette as it was. So at 90 and 270
 * degrees every piece is mirrored about its own foot, and at 0 and 180 it is not - but for a cabin whose chimney is to
 * its left on the screen, mirrored so that the chimney stands against its doorless back gable (2026-09-24,
 * `housePicture`). A dog-run or saddlebag stands along its pens' one ridge (2026-09-24, `alongRidge`): up the screen to
 * the right at 0 and 180 degrees, to the left at 90 and 270, its far chimney and pen behind the passage or the double
 * chimney, its near pen and chimney in front.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-23 - the house from its other sides. The gable facing the viewer always
 * shows the door, so a chimney on a gable toward the viewer (`housePicture`) stands in front of it, and the porch and shed
 * room are their one picture (mirrored at a quarter turn) whichever way they run.
 *
 * `drawn`, when given, collects the screen box of every picture drawn, `{ left, top, right, bottom }`: where a tap on
 * the house lands (public/app.js `houseAt`).
 */
export function drawHousePlot(ctx, x, y, size, land, catalogue, drawSprite, spriteFrame, { rotation = 0, drawn } = {}) {
  for (const [index, house] of (land.completedHouses || []).entries()) {
    drawHousePlot(ctx, x - (index + 1) * size * 2.2, y, size, { house }, catalogue, drawSprite, spriteFrame, { rotation, drawn });
  }
  const pieces = (land.house?.pieces || []).map(([type, px, py, stage, progress]) => ({ type, x: px, y: py, stage, progress, kind: catalogue.pieces.find(each => each.id === type) }))
    .filter(p => p.kind && (p.stage > 0 || p.progress > 0));
  const cell = plotCell(size), flip = Math.round(rotation / 90) % 2 !== 0;
  // Every picture upright - mirrored at a quarter turn, or a pen's as `housePicture` chose (`options.flip`) - and where it
  // was drawn noted.
  const sprite = (c, name, sx, sy, height, options) => {
    const mirror = options && 'flip' in options ? options.flip : flip;
    const width = drawSprite(c, name, sx, sy, height, mirror ? { ...options, flip: true } : options && { ...options, flip: false });
    const frame = width && drawn && spriteFrame?.(name);
    if (frame) {
      const scale = height / (frame.logicalHeight || frame.h), w = frame.w * scale, h = frame.h * scale;
      const ax = options?.anchor?.[0] ?? frame.anchorX, ay = options?.anchor?.[1] ?? frame.anchorY;
      const left = mirror ? sx - w * (1 - ax) : sx - w * ax, top = sy - h * ay;
      drawn.push({ left, top, right: left + w, bottom: top + h });
    }
    return width;
  };
  // Each piece's foot - the middle of its front edge on the ground - in its turned cells, round the plot's middle one cell
  // above (x, y). Unturned, this is where the pieces have always stood.
  const placed = pieces.filter(each => each.kind.place !== 'in').map(p => {
    const [cx, cy] = turned(p.x + p.kind.w / 2 - catalogue.columns / 2, p.y + p.kind.h / 2 - catalogue.rows / 2, rotation);
    const [w, h] = flip ? [p.kind.h, p.kind.w] : [p.kind.w, p.kind.h];
    return { p, w, h, front: cy + h / 2, footX: x + cx * cell, footY: y - cell + (cy + h / 2) * cell };
  });
  // Back to front by the turned front edge, so a piece nearer the viewer is drawn over one further off.
  const order = placed.sort((a, b) => a.front - b.front);
  const row = alongRidge(order, rotation, cell, spriteFrame, housePicture(order, rotation, flip), catalogue, x, y);
  standChimneys(order, rotation, cell, spriteFrame);
  for (const { p, w, h, footX, footY, flip: penFlip } of order) {
    if (p.kind.pen) {
      // The modular pen drawn the way `housePicture` chose; its whole picture, where the pieces cannot be drawn, as the house is.
      const penSprite = (c, name, sx, sy, height, options) => sprite(c, name, sx, sy, height, { ...options, flip: penFlip });
      if (!drawLogPen(ctx, p, footX, footY, cell * 2.2, penSprite, spriteFrame, penFlip)) sprite(ctx, penPicture(p), footX, footY, cell * 2.2);
      continue;
    }
    if (p.type === 'shed') {
      const name = p.stage >= p.kind.stageCount ? 'house-shed-room' : 'lean-to';
      if (!sprite(ctx, name, footX, footY, cell * 1.1) && name !== 'lean-to') sprite(ctx, 'lean-to', footX, footY, cell * 1.1);
      continue;
    }
    if (p.type === 'porch') { if (!sprite(ctx, 'house-porch', footX, footY, cell * 0.9)) sprite(ctx, 'shed-open', footX, footY, cell * 0.9); continue; }
    ctx.save();
    if (p.type === 'passage' && row) {
      // Between two pens along their ridge (`alongRidge`): the floor with its back edge on the far pen's front wall, and
      // the passage roofed with the pens' own roof, seated as on a pen standing at the middle of the passage, so that it
      // runs on from the far pen's roof to the near one's along the one ridge.
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-24 - one roof over a two-pen house. The sheet's passage roof
      // (`house-passage-roof`) is drawn flatter than the pens' and nearly square, on four posts, and meets neither roof.
      const floorAt = { x: footX - PASSAGE_FLOOR_BACK * row.along.x, y: footY - PASSAGE_FLOOR_BACK * row.along.y };
      if (!sprite(ctx, 'house-passage-floor', floorAt.x, floorAt.y, cell * PASSAGE_FLOOR_HIGH, { flip: row.flip })) {
        ctx.fillStyle = '#7b6a52';
        ctx.fillRect(floorAt.x - cell / 2, floorAt.y - cell * .35, cell, cell * .35);
      }
      const walls = spriteFrame(row.walls), roofName = penRoof(row.pens), roof = spriteFrame(roofName);
      const seat = p.stage >= p.kind.stageCount ? roofSeat(walls, roof, footX, footY, cell * 2.2, row.flip) : null;
      if (seat) sprite(ctx, roofName, seat.x, seat.y, seat.height, { anchor: seat.anchor, flip: row.flip });
    } else if (p.type === 'passage') {
      const floor = sprite(ctx, 'house-passage-floor', footX, footY, cell * .72);
      if (!floor) {
        ctx.fillStyle = '#7b6a52';
        ctx.fillRect(footX - w * cell / 2, footY - (h - .4) * cell, w * cell, cell * .35);
      }
      if (p.stage >= p.kind.stageCount) sprite(ctx, 'house-passage-roof', footX, footY, cell * 1.35);
    } else if (p.type === 'chimney' || p.type === 'chimney-stone') {
      const complete = p.stage >= p.kind.stageCount;
      const name = p.type === 'chimney-stone' ? 'house-chimney-stone' : complete ? 'house-chimney-stick' : 'house-chimney-stick-building';
      if (!sprite(ctx, name, footX, footY, cell * CHIMNEY_HIGH)) {
        ctx.fillStyle = p.type === 'chimney-stone' ? '#9b968a' : '#9a6b43';
        const wide = cell * .45, tall = cell * (p.kind.h + .9) * Math.min(1, (p.stage + .3) / p.kind.stageCount);
        ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
      }
    } else {
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-15 - the double chimney, two-sided, to its two-cell footprint. Until
      // then it is the single stick-and-mud chimney's picture (since 2026-09-24; it was a flat rectangle), between the far
      // pen's front gable and the near pen's back gable, taller than a single chimney so it hides the far pen's door,
      // its foot behind the near pen's roof.
      const complete = p.stage >= p.kind.stageCount, high = cell * DOUBLE_RISE;
      if (!sprite(ctx, complete ? 'house-chimney-stick' : 'house-chimney-stick-building', footX, footY, high)) {
        ctx.fillStyle = '#9a6b43';
        const wide = cell * 0.6, tall = high * Math.min(1, (p.stage + 0.3) / p.kind.stageCount);
        ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
        drawn?.push({ left: footX - wide / 2, top: footY - tall, right: footX + wide / 2, bottom: footY });
      }
    }
    ctx.restore();
  }
  return pieces.length;
}
