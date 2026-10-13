// What stands round a family's house, each in a place of its own (owner, 2026-10-13: "a lot of assets get put in the same place and
// overlap. garden and logs for example conflict with roads and the tent").
//
// Until 2026-10-13 everything round the house was set down at a fixed offset from the site, each on its own and none of them looking at
// the others: the tent 0.088 mile west (sim/settling.mjs), the woodpile 0.076 west (sim/land-paths.mjs `PILE_AT`, the page drawing it
// at its own sum, public/app.js), the camp's goods where the page drew them (a camp "the size of a house" at the site, or 0.06 west of
// it), the kitchen garden 0.045 east (sim/housework.mjs), the wagon, the ox and the horse at their founding offsets (sim/world.mjs,
// sim/beasts.mjs `yardSpot`). The woodpile was drawn over the tent, the camp's goods over the beasts, the garden under the house's
// front corner, the beasts under the woodpile; the family's ways ran under the pile and the wagon (seen in the browser on three
// families, before and after the house: docs/evidence/yard-layout-compare.png). And a house placed anywhere but the site was drawn over
// whatever stood there.
//
// Now one layout (`yardLayout`) sets every one of them down in turn, each with its own footprint - the box its picture covers, in a
// person's drawn height (`YARD_PICTURES`, sim/house-footprint.mjs `PERSON_MILES`) - where it is clear of everything already there:
//
//   - the houses as the map draws them, roofs and all (their claims, sim/house-footprint.mjs), and before any house is planned the
//     round-log cabin a first house would be at the site (sim/house-placement.mjs `houseAtSite`);
//   - the ground before the door, where the family's ways begin, the yard spot where work in the yard is done (sim/chores.mjs
//     `yardPoint`), and the ground before the yard's gate;
//   - the family's plots, its lane and any path it cut (the trodden ways are not looked at: they are laid round all of this, below);
//   - the river and the creeks the map draws, the line of the family's land, and the yard's rails - a thing stands inside the yard or
//     outside it, never across its fence;
//   - and each other: the woodpile, the garden, the camp and the tent while there is no roof, then each wagon's and each beast's stand.
//
// Each has a place it would rather be (left of the house and a little before it for the woodpile, as it always was; before the house's
// right-hand corner, east of the door, for the garden; west for the tent and the beasts; the camp before the house), and is set at the
// nearest clear place to it on the door's side of any creek, searched outward a few yards at a time. Everything else reads its place here: the tent (sim/settling.mjs `tentPoint`), the garden
// (sim/housework.mjs `gardenPlace`), the woodpile and the way to it (sim/land-paths.mjs `woodpileAt`), the camp and the woodpile the
// page draws (`yardProjection`), where a beast or a wagon stands when it comes home (sim/beasts.mjs `yardSpot`), and the trodden ways,
// which go round the woodpile, the garden, the tent and the wagons' stands (sim/land-paths.mjs `groundFor`) and are laid again where
// one crosses them. Survey refuses ten acres over any of them (sim/survey.mjs `plotRefusal`).
//
// The page draws each picture fitted inside its footprint (public/app.js `fitInside`), so a sheet drawn larger than its stand-in can
// never spill over a neighbour; scripts/yard-layout-browser-proof.mjs reads the drawn boxes back.
//
// **Nothing is stored and no save version moved.** The layout is worked out from the land as it is, so a class saved before opens with
// everything in its place: a stored tent or garden keeps its record and is drawn where the layout puts it, and a beast standing at
// one of the old fixed spots is set down at its stand on the first tick (`settleStands`). Every number here is the game's own
// (`FIC-GONZ-1240`).
import { holdingOf } from './grants.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { drawnWater, plotsOf, squareOf } from './fields.mjs';
import { houseAtSite, housesOnLand } from './house-placement.mjs';
import { PERSON_MILES, YARD_PICTURES } from './house-footprint.mjs';
import { improvementsOf } from './improvements.mjs';
import { pathsOf, stockGround, yardBox, yardOf } from './land-paths.mjs';

export { YARD_PICTURES };
const F = PERSON_MILES;
/** The clear ground kept between two things, in miles: a sixth of a person's drawn height. */
export const YARD_GAP = 0.003;
/** How far out from where a thing would rather be it is looked for, and how finely (miles). */
const SEARCH_MILES = 0.3, SEARCH_STEP = 0.004;
/** The ground before the door kept clear, either side of its middle and out from the house's front (miles). */
const DOORYARD = Object.freeze({ half: 0.02, out: 0.03 });
/** Half the lane's drawn width and a little more, in miles: nothing stands on the family's own road. */
const LANE_HALF = 0.008;
/** Half a cut path's width, in miles. */
const PATH_HALF = 0.005;
/** Kept in from the line of the family's land, in miles. */
const LINE_MARGIN = 0.01;

const r4 = value => { const fixed = Math.round(value * 10000) / 10000; return fixed === 0 ? 0 : fixed; };
const meets = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
const grow = (box, by) => ({ minX: box.minX - by, minY: box.minY - by, maxX: box.maxX + by, maxY: box.maxY + by });
/** The box a thing's picture covers, standing at `at`: its footprint in `YARD_PICTURES`, in miles. */
export function pictureBox(what, at) {
  const p = YARD_PICTURES[what] || YARD_PICTURES.ox;
  return { minX: r4(at.x - p.left * F), maxX: r4(at.x + p.right * F), minY: r4(at.y - p.up * F), maxY: r4(at.y + p.down * F) };
}
/** How far a box lies from a stretch of line (0 where they cross). */
function boxToSegment(box, a, b) {
  const inside = p => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
  if (inside(a) || inside(b)) return 0;
  const corners = [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY }, { x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY }];
  const cross = (p, q, r, s) => {
    const d = (q.x - p.x) * (s.y - r.y) - (q.y - p.y) * (s.x - r.x);
    if (!d) return false;
    const t = ((r.x - p.x) * (s.y - r.y) - (r.y - p.y) * (s.x - r.x)) / d, u = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };
  for (let i = 0; i < 4; i++) if (cross(a, b, corners[i], corners[(i + 1) % 4])) return 0;
  const toSeg = (p, s, e) => { const dx = e.x - s.x, dy = e.y - s.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / l)) : 0; return Math.hypot(p.x - s.x - dx * t, p.y - s.y - dy * t); };
  const toBox = p => Math.hypot(Math.max(box.minX - p.x, 0, p.x - box.maxX), Math.max(box.minY - p.y, 0, p.y - box.maxY));
  return Math.min(toBox(a), toBox(b), ...corners.map(c => toSeg(c, a, b)));
}
/** Whether two stretches of line cross. */
function crossing(p, q, r, s) {
  const d = (q.x - p.x) * (s.y - r.y) - (q.y - p.y) * (s.x - r.x);
  if (!d) return false;
  const t = ((r.x - p.x) * (s.y - r.y) - (r.y - p.y) * (s.x - r.x)) / d, u = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
/** Whether a polyline passes within `reach` of a box. */
export const lineNear = (box, points, reach) => points.some((p, i) => i > 0 && boxToSegment(box, points[i - 1], p) < reach);

/** The family's beasts and wagons, in the order their stands are laid: wagons, oxen, horses, mules, each by id. */
function standers(world, household) {
  const order = { wagon: 0, ox: 1, horse: 2, mule: 3 };
  return (household.property || []).map(id => world.entities[id]).filter(one => one && (one.kind === 'wagon' || one.kind === 'animal'))
    .map(one => ({ id: one.id, what: one.kind === 'wagon' ? 'wagon' : one.species === 'horse' ? 'horse' : one.species === 'mule' ? 'mule' : 'ox' }))
    .sort((a, b) => order[a.what] - order[b.what] || a.id.localeCompare(b.id, 'en', { numeric: true }));
}
/** The house the yard is laid round: the family's home (the first it finished, else the one it is raising), or a first house at the site. */
function homeHouse(world, household) {
  const home = household.completedHouses?.[0] || household.house;
  const [placed] = home ? housesOnLand(world, household, [home]) : [];
  return placed || houseAtSite(world, household);
}
/** Whether the family has a roof: the tent is struck and the camp packed away (sim/settling.mjs `housed`). */
const roofed = household => improvementsOf(household).cabin === 'sound';

/** What the layout is worked out from, as a key: when none of it changes, neither does the layout. */
function layoutKey(world, household) {
  const site = world.map.sites[household.homeSiteId], bounds = holdingOf(world, household)?.bounds;
  const lane = Object.values(world.map.routes || {}).find(route => route.to === household.homeSiteId);
  return JSON.stringify([site?.x, site?.y, bounds, household.house?.placement || null, household.house?.plan || household.house?.layout || null,
    household.house?.pieces?.length || 0, (household.completedHouses || []).map(house => [house.placement, house.plan || house.layout, house.pieces?.length || 0]),
    plotsOf(world, household).map(plot => [plot.x, plot.y]), yardOf(household), lane?.points?.length || 0, lane?.points?.at(-1) || null,
    pathsOf(household).filter(path => path.kind !== 'trodden').map(path => path.points.length), roofed(household), standers(world, household).map(one => one.id)]);
}
const kept = new WeakMap();

/**
 * Where everything round the family's house stands: `{ woodpile, garden, tent, camp, stands, boxes, key }` - each a point in miles
 * (its picture's foot, as the page draws it), `stands` a beast's or a wagon's by its id, and `boxes` every footprint by what it is
 * (`{ what, id?, box }`). The tent and the camp only while the family has no roof. Null for a family with no site.
 */
export function yardLayout(world, household) {
  const site = household && world.map.sites[household.homeSiteId];
  if (!site) return null;
  let byFamily = kept.get(world);
  if (!byFamily) { byFamily = new Map(); kept.set(world, byFamily); }
  const key = layoutKey(world, household), was = byFamily.get(household.id);
  if (was && was.key === key) return was;
  const layout = { ...layOut(world, household, site), key };
  byFamily.set(household.id, layout);
  return layout;
}

function layOut(world, household, site) {
  const bounds = holdingOf(world, household)?.bounds;
  const home = homeHouse(world, household);
  const H = home?.footprint || { minX: site.x - 0.03, maxX: site.x + 0.03, minY: site.y - 0.05, maxY: site.y };
  const C = home?.claim || H;
  const houses = housesOnLand(world, household);
  const middle = (H.minX + H.maxX) / 2;
  // What nothing may stand on.
  const walls = [...(houses.length ? houses : [home]).filter(Boolean).map(house => house.claim)];
  walls.push({ minX: middle - DOORYARD.half, maxX: middle + DOORYARD.half, minY: H.maxY, maxY: H.maxY + DOORYARD.out });
  // The yard spot (sim/chores.mjs `yardPoint`): somebody standing at work in the yard.
  const spot = { x: site.x - 0.025, y: site.y + 0.035 };
  walls.push({ minX: spot.x - 0.3 * F, maxX: spot.x + 0.3 * F, minY: spot.y - 1.05 * F, maxY: spot.y + 0.1 * F });
  for (const plot of plotsOf(world, household)) if (Number.isFinite(plot.x)) walls.push(squareOf(plot));
  // The yard's rails, standing or where they would go round the house: inside or outside them, never across them; and the gate's apron.
  const rails = yardOf(household) || (houses.length ? yardBox(world, household) : null);
  if (rails && Number.isFinite(rails.gate)) walls.push({ minX: rails.gate - 0.015, maxX: rails.gate + 0.015, minY: rails.maxY - 0.01, maxY: rails.maxY + 0.025 });
  // Where the stock is brought in at night (sim/land-paths.mjs `stockGround`): a way is trodden to it, and the herd stands there.
  for (const kind of ['cattle', 'hogs']) { const at = stockGround(world, household, kind); if (at) walls.push({ minX: at.x - 0.012, maxX: at.x + 0.012, minY: at.y - 0.012, maxY: at.y + 0.012 }); }
  const lane = Object.values(world.map.routes || {}).find(route => route.to === household.homeSiteId)?.points || [];
  const cut = pathsOf(household).filter(path => path.kind !== 'trodden' && path.points?.length > 1).map(path => path.points);
  // The water the map draws near the land, and on the real land any water at all under a thing.
  const near = { minX: site.x - 0.6, maxX: site.x + 0.6, minY: site.y - 0.6, maxY: site.y + 0.6 };
  const real = onRealLand(world);
  const courses = drawnWater(world).filter(course => course.points.some(p => p.x > near.minX && p.x < near.maxX && p.y > near.minY && p.y < near.maxY));
  // Their stretches near the house, each once, for the bank the house stands on (`sameBank`).
  const stretches = courses.flatMap(course => course.points.slice(1).map((p, i) => [course.points[i], p]))
    .filter(([a, b]) => Math.max(a.x, b.x) > near.minX && Math.min(a.x, b.x) < near.maxX && Math.max(a.y, b.y) > near.minY && Math.min(a.y, b.y) < near.maxY);
  const wide = course => (real ? (course.kind === 'river' ? 0.03 : 0.01) : (course.kind === 'river' ? 0.28 : 0.12));
  const land = real ? landAround(near) : null;
  const placed = [];
  // On the house's side of the water: no river or creek the map draws between the door and the thing (found on yard-layout-7, 2026-10-13:
  // the tent, the camp and the cart set down across the creek from the house, each clear of it and nearer than any place on its side).
  const door = { x: middle, y: H.maxY };
  const sameBank = at => !stretches.some(([a, b]) => crossing(door, at, a, b));
  const clear = (box, at) => {
    if (bounds && (box.minX < bounds.minX + LINE_MARGIN || box.maxX > bounds.maxX - LINE_MARGIN || box.minY < bounds.minY + LINE_MARGIN || box.maxY > bounds.maxY - LINE_MARGIN)) return false;
    const room = grow(box, YARD_GAP);
    if (walls.some(wall => meets(room, wall))) return false;
    if (placed.some(one => meets(room, one.box))) return false;
    if (rails) {
      const inside = box.minX > rails.minX + YARD_GAP && box.maxX < rails.maxX - YARD_GAP && box.minY > rails.minY + YARD_GAP && box.maxY < rails.maxY - YARD_GAP;
      if (!inside && meets(room, rails)) return false;
    }
    if (!sameBank(at)) return false;
    if (lane.length > 1 && lineNear(box, lane, LANE_HALF + YARD_GAP)) return false;
    if (cut.some(points => lineNear(box, points, PATH_HALF + YARD_GAP))) return false;
    if (courses.some(course => lineNear(box, course.points, wide(course) + YARD_GAP))) return false;
    if (land && land.waterNear(box, YARD_GAP * 2)) return false;
    return true;
  };
  /** The nearest clear place to `want` for a thing, ring by ring outward; where none is, `want` itself. */
  const setDown = (what, want, id = null) => {
    let at = null;
    for (let ring = 0; ring * SEARCH_STEP <= SEARCH_MILES && !at; ring++) {
      const ringAt = [];
      for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        ringAt.push({ x: r4(want.x + i * SEARCH_STEP), y: r4(want.y + j * SEARCH_STEP) });
      }
      ringAt.sort((a, b) => Math.hypot(a.x - want.x, a.y - want.y) - Math.hypot(b.x - want.x, b.y - want.y) || a.y - b.y || a.x - b.x);
      at = ringAt.find(p => clear(pictureBox(what, p), p)) || null;
    }
    // ceiling: a family with no clear ground within a third of a mile of where a thing would rather be has it there, over whatever
    // stands; none was found in the families measured (tests/yard-layout.test.mjs). A smaller footprint is the way out.
    at ||= { x: r4(want.x), y: r4(want.y) };
    placed.push({ what, ...(id && { id }), at, box: pictureBox(what, at) });
    return at;
  };
  const before = H.maxY;
  const woodpile = setDown('woodpile', { x: C.minX - YARD_PICTURES.woodpile.right * F - YARD_GAP, y: before + 0.02 });
  // Before the house's right-hand corner, below its pictures and east of the door.
  const garden = setDown('garden', { x: H.maxX - YARD_PICTURES.garden.right * F, y: C.maxY + YARD_PICTURES.garden.up * F + YARD_GAP });
  // The camp and the tent before the beasts and the wagons, so the family sitting out the rain is by the house, where its yard is seen
  // (the weather proof's yard, 2026-10-13); the stands move in once the tent comes down.
  const open = !roofed(household);
  const camp = open ? setDown('camp', { x: H.minX + 0.01, y: C.maxY + YARD_PICTURES.camp.up * F + YARD_GAP }) : null;
  const tent = open ? setDown('tent', { x: (camp?.x ?? H.minX) - YARD_PICTURES.camp.left * F - YARD_PICTURES.tent.right * F - YARD_GAP, y: camp?.y ?? before + 0.05 }) : null;
  const stands = {};
  for (const one of standers(world, household)) {
    const want = one.what === 'wagon' ? { x: C.minX - 1.5 * F, y: C.maxY + 0.05 } : { x: C.minX - F, y: C.maxY + 0.03 };
    stands[one.id] = setDown(one.what, want, one.id);
  }
  return { woodpile, garden, tent, camp, stands, door, boxes: placed.map(({ what, id, box }) => ({ what, ...(id && { id }), box })) };
}

/**
 * The footprints the family's trodden ways and walks keep off (sim/land-paths.mjs `groundFor`): the woodpile, the garden, the tent and
 * where each wagon stands. Not a beast's stand: a beast moves off it, and a way round where it might be is no way at all.
 */
export function yardWalls(world, household) {
  const layout = yardLayout(world, household);
  return layout ? layout.boxes.filter(one => ['woodpile', 'garden', 'tent', 'wagon'].includes(one.what)).map(one => one.box) : [];
}

/** Where the way to the woodpile ends: before its foot, a step out, where somebody stands to take a log off it. */
export function woodpileFront(world, household) {
  const layout = yardLayout(world, household);
  if (!layout) return null;
  return { x: layout.woodpile.x, y: r4(layout.woodpile.y + YARD_PICTURES.woodpile.down * F + YARD_GAP * 2) };
}

/**
 * Where a beast or a wagon of the family stands at home, or null for one the layout does not know (not the family's, or no site).
 * Its picture stands clear of every other thing round the house (`yardLayout`).
 */
export function standOf(world, household, entity) {
  return yardLayout(world, household)?.stands?.[entity?.id] || null;
}

/** For the family's own land line and the Host's map: where the page draws the woodpile and the camp. */
// The woodpile only once there are logs on it: the page draws none before, and this goes to every page on every tick.
// ceiling: the camp is not drawn while the family is still on its road in; it was drawn at the site from the first tick until 2026-10-13.
export function yardProjection(world, household) {
  const layout = yardLayout(world, household);
  if (!layout) return {};
  const logs = household.logs ? (household.logs.wall || 0) + (household.logs.sill || 0) + (household.logs.poor || 0) : 0;
  // And the camp once the family is on its land: it is made when they get there (sim/settling.mjs).
  return { ...(logs > 0 && { woodpileAt: { x: layout.woodpile.x, y: layout.woodpile.y } }), ...(layout.camp && !household.arriving && { campAt: { x: layout.camp.x, y: layout.camp.y } }) };
}

// ------------------------------------------------------------------------------------------------ the beasts walked to their stands

/** Where a beast or a wagon was set down before 2026-10-13, from the site: its founding place and the old rail (sim/beasts.mjs). */
function oldSpots(site, entity) {
  const n = Number(String(entity.id).match(/-(\d+)$/)?.[1] || 1);
  const [dx, dy] = entity.kind === 'wagon' ? [-.045, .05] : entity.species === 'horse' ? [-.06, .01] : entity.species === 'mule' ? [-.075, .015] : [-.035, .02];
  return [{ x: site.x + dx, y: site.y + dy }, { x: site.x + dx - .02 * (n - 1), y: site.y + dy + .012 }, { x: site.x, y: site.y }];
}
const standsSeen = new WeakMap();
/**
 * Once a tick: a beast or a wagon standing idle at home is moved to its stand as the layout has it now when it stands where it was
 * last set down - its stand as the layout had it, or one of the fixed spots of before 2026-10-13 - and the layout has changed (the
 * first tick of a class saved before; a house planned over a stand), or when its picture lies over anything else round the house or
 * over another idle beast or wagon (left by work about the yard where another stands). So a class saved before opens with its stock
 * clear of the woodpile and the tent, and two wagons are never left one on the other. Anything held by somebody, on the road, or
 * standing clear somewhere it was taken - a wagon left at the timber - is left where it is.
 * ceiling: set down, not walked; it is a few rods across the yard, and a beast's own walk about the yard is the way out if it shows.
 */
export function settleStands(world) {
  let seen = standsSeen.get(world);
  if (!seen) { seen = new Map(); standsSeen.set(world, seen); }
  for (const household of Object.values(world.households || {})) {
    const site = world.map.sites[household.homeSiteId];
    const layout = site && yardLayout(world, household);
    if (!layout) continue;
    const before = seen.get(household.id), changed = before?.key !== layout.key;
    const idle = Object.keys(layout.stands).map(id => world.entities[id])
      .filter(entity => entity && !entity.travel && !entity.borrowedBy && entity.location?.siteId === household.homeSiteId);
    const whatOf = entity => (entity.kind === 'wagon' ? 'wagon' : entity.species === 'horse' ? 'horse' : entity.species === 'mule' ? 'mule' : 'ox');
    const pictures = new Map(idle.map(entity => [entity.id, pictureBox(whatOf(entity), entity.location)]));
    for (const entity of idle) {
      const stand = layout.stands[entity.id], at = entity.location;
      if (Math.abs(stand.x - at.x) < 1e-6 && Math.abs(stand.y - at.y) < 1e-6) continue;
      const was = before?.stands?.[entity.id];
      const left = changed && [...(was ? [was] : []), ...oldSpots(site, entity)].some(p => Math.hypot(p.x - at.x, p.y - at.y) < 0.002);
      const mine = pictures.get(entity.id);
      const over = layout.boxes.some(one => one.id !== entity.id && meets(mine, one.box))
        || idle.some(other => other !== entity && meets(mine, pictures.get(other.id)));
      if (left || over) { entity.location = { x: stand.x, y: stand.y, siteId: household.homeSiteId }; pictures.set(entity.id, pictureBox(whatOf(entity), stand)); }
    }
    seen.set(household.id, { key: layout.key, stands: layout.stands });
  }
}
