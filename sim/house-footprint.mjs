// A house on the ground, as the map draws it and as the server checks where it may stand (docs/WOODS_AND_BUILDING.md
// §6.5). One source for both: the page imports this file as it is (served as /sim/house-footprint.mjs, and
// public/house-plot.js reaches it as `../sim/house-footprint.mjs`, which is the same file from node), so the house a
// student sees and the house the server refuses cannot drift apart. No imports, for that reason.
//
// Until 2026-09-23 they had drifted: the house was drawn at the map's symbol size - `CABIN_PEOPLE` people high, a person
// `PERSON_MILES` of ground - while the server placed and checked it in true feet, an 80 by 64 foot envelope. A drawn
// eight-foot cell is about 149 feet of the map, so two houses the server let stand a hundred feet apart were drawn one
// over the other, and a house on dry ground beside a creek was drawn over the water (owner: "fix the overlapping houses
// so spacing matches the drawings").

/**
 * How tall a person is drawn, in miles of ground: the yardstick every tree, cabin and ox on the map is drawn in (public/
 * app.js `cameraFor`, `figure`). A symbol size, not anybody's height.
 *
 * It was 0.115 - a person drawn six hundred feet tall - and a labor of 177 acres, half a mile a side, read as five people
 * wide at every zoom, so a family's land looked like a yard (owner, 2026-09-14: "it's not communicating how large the land
 * tracts were"). A sixth of that, and the camera zooms far enough in to keep a person readable, makes a labor about
 * thirty people across and a league a hundred and fifty. Still a symbol: a real person would be a hundredth of this.
 */
export const PERSON_MILES = 0.019;
/** How tall a house is drawn, in people (public/app.js `SIZE.cabin`, `cabinSize`). */
export const CABIN_PEOPLE = 3.3;
/** How wide one eight-foot cell of the house plot is drawn, as a share of the house's drawn height (`plotCell`). */
export const CELL_SHARE = 0.45;
/**
 * One cell of the house plot, in miles of the map, as it is drawn: about 149 feet for eight. A round-log cabin (three
 * cells by two) covers about three acres of the map and a dog-run (seven by two) about seven.
 *
 * Exact at every zoom the page draws a family's houses apart (public/app.js `houseScale`): a house is drawn at this size
 * whatever the people are, who are floored at seven pixels, so it is never drawn past this ground. Where that would draw it
 * under `HOUSE_LEGIBLE` (16 pixels, about 255 pixels a mile) and further out, the family's houses are drawn as one - its
 * home, at that height - so no house can be drawn over another of its own family. Until 2026-09-23 the house was floored
 * with the people, and from about 370 pixels a mile out two houses as close as allowed were drawn into each other (owner:
 * "fix the zoom issue"). Holding them apart at the country's zoom here instead would push them a mile apart.
 */
export const CELL_MILES = PERSON_MILES * CABIN_PEOPLE * CELL_SHARE;

/**
 * How far a house's pictures reach past its ground footprint, in cells: up the screen (north) for the roofs and chimneys
 * of the three-quarter view standing above the ground they cover, either side for pictures drawn wider than their cells,
 * and down the screen for the foot of each picture. Measured on every plan at every quarter turn from the house sheets
 * (tests/house-spacing.test.mjs holds every picture inside it): the saddlebag's roofs rise 0.9 of a cell above its back
 * wall, the jacal's picture is 0.86 of a cell wider each side than its pen, every foot 0.16 below.
 * ceiling: one reach for every plan at every turn, the widest of them, measured on each picture's whole frame, clear edges
 * and all. So two houses as close as allowed show a gap - a round-log cabin east of another could stand about a cell
 * closer before any picture touched. A reach per plan and turn, read from the atlas, is the way out if a student finds the
 * houses held too far apart.
 */
export const PICTURE_REACH = Object.freeze({ up: 1, side: 0.9, down: 0.2 });

/**
 * A point on the ground `(x, y)` from the middle of the plot, turned by a quarter turn `rotation` (0, 90, 180 or 270) the
 * way a canvas turns: clockwise on the screen, east to south. The house is turned on the ground by this and nothing
 * else - its pictures are never rotated (public/house-plot.js `drawHousePlot`).
 */
export function turned(x, y, rotation = 0) {
  const turn = ((Math.round(rotation / 90) % 4) + 4) % 4;
  return turn === 1 ? [-y, x] : turn === 2 ? [-x, -y] : turn === 3 ? [y, -x] : [x, y];
}

/** A piece as the page carries it (`[type, x, y, stage, progress]`) or as the server stores it (`{ type, x, y }`). */
const pieceAt = p => Array.isArray(p) ? p : [p.type, p.x, p.y];

/**
 * Where a house's pieces stand, in cells from the middle of its plot - the point it is placed at, which `drawHousePlot`
 * called with `y` one cell down centres its grid on - turned on the ground by the house's quarter turn. What a preview
 * outlines on the ground is this: the house the pieces make, not the whole grid; at 90 or 270 degrees a dog-run's is two
 * cells wide and seven deep. null for a house with nothing on the ground. `catalogue` is the plot's (sim/houseplot.mjs
 * `plotCatalogue`), which the page is sent.
 */
export function houseFootprint(house, catalogue, rotation = 0) {
  let box = null;
  for (const piece of house?.pieces || []) {
    const [type, x, y] = pieceAt(piece);
    const kind = catalogue.pieces.find(each => each.id === type);
    if (!kind || kind.place === 'in') continue;
    const left = x - catalogue.columns / 2, top = y - catalogue.rows / 2;
    const [[ax, ay], [bx, by]] = [turned(left, top, rotation), turned(left + kind.w, top + kind.h, rotation)];
    const each = { left: Math.min(ax, bx), top: Math.min(ay, by), right: Math.max(ax, bx), bottom: Math.max(ay, by) };
    box = box ? { left: Math.min(box.left, each.left), top: Math.min(box.top, each.top), right: Math.max(box.right, each.right), bottom: Math.max(box.bottom, each.bottom) } : each;
  }
  return box && { x: box.left, y: box.top, w: box.right - box.left, h: box.bottom - box.top };
}

/**
 * The cells a house covers: its pieces, or a house chosen whole (`{ layout, work }`, a class from before the plot) as its
 * plan's pieces. ceiling: a house with neither claims the whole eight-by-six plot; a house of pieces the catalogue does
 * not know is the only way to get one, and no save has one.
 */
export function houseCells(house, catalogue, rotation = 0) {
  const pieces = house?.pieces?.length ? house.pieces : catalogue.plans.find(plan => plan.id === (house?.plan || house?.layout))?.pieces;
  const foot = pieces && houseFootprint({ pieces }, catalogue, rotation);
  if (foot) return foot;
  const [w, h] = rotation % 180 ? [catalogue.rows, catalogue.columns] : [catalogue.columns, catalogue.rows];
  return { x: -w / 2, y: -h / 2, w, h };
}

/**
 * Where a house stands, for its footprint: its own placement, or - placed nowhere (an old save, a house planned before
 * placement) - at the family's site, where public/app.js `drawLandHouses` draws it by `drawHousePlot` at the site point,
 * which puts the middle of the plot one cell above that point.
 */
export const standingAt = (house, site) => house?.placement || (site ? { x: site.x, y: site.y - CELL_MILES, rotation: 0 } : null);

/**
 * A house on the ground, in miles of the map, as `{ footprint, claim }`: `footprint` the ground its pieces are drawn over,
 * `claim` that grown by `PICTURE_REACH` to the ground its pictures stand over. `at` is `{ x, y, rotation }`.
 */
export function houseOnGround(house, catalogue, at) {
  const cells = houseCells(house, catalogue, at.rotation || 0);
  const footprint = { minX: at.x + cells.x * CELL_MILES, minY: at.y + cells.y * CELL_MILES, maxX: at.x + (cells.x + cells.w) * CELL_MILES, maxY: at.y + (cells.y + cells.h) * CELL_MILES };
  const claim = {
    minX: footprint.minX - PICTURE_REACH.side * CELL_MILES, maxX: footprint.maxX + PICTURE_REACH.side * CELL_MILES,
    minY: footprint.minY - PICTURE_REACH.up * CELL_MILES, maxY: footprint.maxY + PICTURE_REACH.down * CELL_MILES,
  };
  return { footprint, claim };
}

/** Whether two boxes `{ minX, minY, maxX, maxY }` share any ground. Edge to edge is not overlapping. */
export const overlaps = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

export const SPACE_REFUSAL = 'Leave space between this house and the existing house.';
/**
 * Why a house cannot stand here for the houses already standing, or null (both from `houseOnGround`). The rule: no house's
 * ground or pictures may cover another's ground or pictures - no two claims overlap. So one house's roof, drawn standing
 * up the screen, never lies over the house behind it, and two houses side by side never share a picture's width. It is
 * judged on the ground the pictures stand over, not on where they are drawn on the screen, so it is the same at every zoom.
 */
export const spacingRefusal = (house, standing) => standing.some(other => overlaps(house.claim, other.claim)) ? SPACE_REFUSAL : null;
