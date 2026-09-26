// Display-only state. Holds only the currently permitted projection; never predicts
// travel, resolves work, or keeps an actor after visibility is withdrawn.
// The one person a student directs wears a colour nobody else can wear, and the choice
// has to be made here rather than in the renderer's procedural fallback. That fallback
// returns only when a sprite is unavailable, so for a while after the art library landed
// the principal's mark existed solely when the art failed to load - and worse, 'rust' was
// in the shared pool, so a neighbour could be drawn in the colour that means "this is
// you". Keeping the principal's palette out of the pool is what makes the mark true.
export const PRINCIPAL_VARIANT = 'rust';
export const VARIANTS = ['teal', 'elder', 'blue'];
export function visualVariant(id, principal = false) {
  if (principal) return PRINCIPAL_VARIANT;
  let hash = 0;
  for (const char of String(id)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return VARIANTS[hash % VARIANTS.length];
}
/**
 * Which figure somebody is drawn as, from who they are.
 *
 * The second cast is complete since Astra's north/south walk and dialogue sheets landed on 2026-09-21
 * (docs/ART_DELIVERY_2026-09-21-CAST2-VERTICAL.md, `-CAST2-DIALOGUE.md`), so the family is no longer four copies of two
 * figures: a woman is `teal` or `indigo`, a man `elder` or `ochre`, an adolescent girl `blue-girl` and a boy `blue`,
 * chosen by the same stable hash of the id that has always chosen a neighbour's coat. Two of each, so a mother and a
 * grown daughter standing in the same yard are not the same person twice.
 *
 * **A mother who is the principal is drawn as a woman in the principal's own colour** (`rust-woman`), which is what the
 * request asked for and what could not be done with one rust figure: until today a student playing a mother watched a man
 * in a rust coat do everything she ordered. `rust-woman` is kept out of the pool exactly as `rust` is, so no neighbour can
 * wear either and the mark still means "this is you".
 *
 * The server sends every person the page may draw on foot with a sex and a band (sim/town.mjs `seenAs`): the founding four
 * from the role the world gives them, a town's keeper from the tables they are made from. Until 2026-09-24 neither was sent,
 * and both fell to the id hash below, whose pool is a woman, a man and a boy - so a far family's mother, Antonia
 * (`hh-9-elena`), was drawn as an old man and her son as a woman, on the Host's map and on any student's who met them. The
 * hash is now only for something with no sex at all (a beast, whose clip ignores it, or a rider, drawn as the courier).
 */
export const WOMEN = ['teal', 'indigo'], MEN = ['elder', 'ochre'];
const fromPool = (pool, id) => {
  let hash = 0;
  for (const char of String(id)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
};
export function castVariant(entity, observed = false) {
  const grown = ['adult', undefined, null].includes(entity.band);
  if (entity.principal && !observed) return entity.sex === 'female' ? 'rust-woman' : PRINCIPAL_VARIANT;
  if (entity.sex === 'female') return grown ? fromPool(WOMEN, entity.id) : 'blue-girl';
  if (entity.sex === 'male') return grown ? fromPool(MEN, entity.id) : 'blue';
  return visualVariant(entity.id);
}
/**
 * How big somebody is drawn, as a fraction of a grown person.
 *
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-12, priority 1. Until there is child art a
 * child is a grown figure drawn smaller; the delivered sheets are drawn to fill their cells
 * and will need exactly this scaling too, so it stays when the stand-in goes.
 */
export const FIGURE_SCALE = Object.freeze({ adult: 1, youth: 0.9, child: 0.7, small: 0.55, infant: 0.45 });
export const figureScale = entity => FIGURE_SCALE[entity?.band] ?? 1;
/**
 * Which way somebody is facing, taken from the leg of the route they are actually on.
 * Returns 'n', 's' or null: north and south have their own drawn cycles, while east and
 * west share one and are mirrored by the caller. The projection already carries the route
 * the server computed, so nothing here invents a direction that was never sent. An almost
 * level leg returns null rather than committing to a vertical cycle, because a sidestep
 * drawn as walking north reads worse than the mirror does.
 */
export function travelDirection(entity) {
  const travel = entity?.travel, points = travel?.points;
  if (!Array.isArray(points) || points.length < 2) return null;
  // `base` is how far along the road the points begin: the Host is sent only the stretch round each traveller
  // (sim/overview.mjs `roadWindow`); a student's own people carry the whole road and no base.
  let left = (Number.isFinite(travel.progress) ? travel.progress : 0) - (travel.base || 0);
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1], to = points[index];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (left <= length || index === points.length - 1) {
      const dx = to.x - from.x, dy = to.y - from.y;
      return Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? 's' : 'n') : dx < 0 ? 'w' : 'e';
    }
    left -= length;
  }
  return null;
}
export function travelHeading(entity) { const direction=travelDirection(entity); return direction==='s'||direction==='n'?direction:null; }
// The conditions a person can actually be in, as the simulation names them.
//
// This list existed once before as `['injured', 'wounded']` written inline, and it was
// wrong in the way a list of magic strings usually is: the simulation has never set
// either of those. The only hurt state it produces is `minor-injury` (set when somebody
// goes upriver already tired, cleared again by `advanceRoutine` once `recoversAt`
// passes), and because that name was not on the list every hurt person was drawn resting
// or standing - the delivered injured pose sitting unused behind a binding that matched
// nothing. `tests/motion-binding.test.mjs` now reads the vocabulary out of `sim/` and
// fails if a condition appears there that is not classified here.
export const HURT_CONDITIONS = ['minor-injury', 'injured', 'wounded'];
// Distinct server states, and this project draws no casualty.
export const STILL_CONDITIONS = ['dead', 'captured'];
// Conditions that need no pose of their own: the person is drawn doing whatever they are
// doing, and the state is carried in words.
// ceiling: somebody sick on the road (sim/scrape.mjs) is drawn as they are, travelling or resting; the sickness is carried in
// words on their card. A sick pose is nobody's request yet.
export const ORDINARY_CONDITIONS = ['well', 'tired', 'sick'];
/**
 * A rider, drawn as a rider.
 *
 * `mounted-courier-*` is a dedicated horse-and-rider sheet, and until news started being
 * carried by people nothing used it: a courier fell through to the civilian walk cycles
 * and a message arrived on foot in a coloured coat. The encounter frames - listening and
 * speaking - are the ones that make a conversation look like a conversation rather than
 * two figures standing near each other.
 *
 * `speaking` and `facing` are only ever set by the server while a meeting is actually
 * open, and neither says one word about what is being carried.
 */
// A rider talks from the saddle turned toward the listener: east or west (the east sheet mirrored), and since Astra's
// courier-encounters-vertical sheet (2026-09-14) north or south when the listener is above or below them on the map.
// stand-in: docs/ART_REQUESTS.md, request 2026-09-12, priority 3. The rider still never gets down: the delivered
// courier-dismount sheet (dismount, remount, on foot, the horse waiting) needs an encounter that knows when a rider
// has got down and where the horse is, and is registered but not yet bound.
/**
 * Somebody of a family going on the family's horse is drawn in the saddle, and the horse under them is not drawn a second
 * time trotting alongside. Both read the journey the server gave: a horse only ever travels harnessed (sim/world.mjs
 * `harness`) or marching with its rider (sim/keeping.mjs), so a horse on a journey made on horseback is being ridden.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-14 - family members on horseback. The rider is their own figure sitting
 * on the family's walking horse (`seatedClip`, `seatLayout`): the top of them drawn over its back, from the waist up. It
 * replaced the courier's sheet on 2026-09-16, because the owner saw a stranger on the horse and "characters don't actually
 * sit on the horse".
 */
// And somebody the family put on the horse for its journey together (sim/company.mjs `saddle`; owner, 2026-09-25: "the horse
// should carry a rider"): drawn in the saddle the same way, whatever way the rest of the family goes. A baby in their arms is not.
export const inTheSaddle = entity => entity.kind === 'person' && !entity.carrier && (entity.travel?.mode === 'horse' || (Boolean(entity.travel?.saddle) && !entity.travel.carried));
/** How tall a rider and horse are drawn, as a person is 1: the horse at its own size with somebody sitting up on it. */
export const MOUNTED_HEIGHT = 1.8;
export const mounted = entity => entity.kind === 'person' && (entity.carrier || inTheSaddle(entity));
export const underARider = entity => entity.kind === 'animal' && entity.species === 'horse' && entity.travel?.mode === 'horse';

/**
 * Who drives this family's wagon on the road: whoever has it (`borrowedBy`, sim/keeping.mjs), or - on the family's own
 * arrival, which nobody took it on - the principal if they are coming in with it, or else the first grown person who is.
 * Everybody else going the wagon's way walks beside it. Null while the wagon is not on the road.
 */
export function wagonDriverId(householdId, entities = [], wagonId = null) {
  const teams = wagonTeams(householdId, entities);
  const team = wagonId ? teams.find(one => one.wagon.id === wagonId) : teams[0];
  return team?.driverId || null;
}
/**
 * Every wagon of this family on the road, with who drives it and the ox that draws it (owner, 2026-09-25: a family of nine or more
 * comes in with a wagon for every eight, sim/beasts.mjs). A wagon somebody took is theirs to drive - one wagon a person, the first
 * that names them - and the ox that went with them draws it. On the family's arrival, which nobody took, and in the flight east,
 * where every wagon names the one who leads the family, the drivers are dealt in order: the principal, then the grown people, then
 * anybody, one to a wagon, and the oxen to the wagons in the order the family has them. A wagon with nobody left to drive it is
 * drawn by itself. Pure: a reading of the projection, never a rule of the server's.
 */
export function wagonTeams(householdId, entities = []) {
  const own = entities.filter(entity => entity.householdId === householdId);
  const wagons = own.filter(entity => entity.kind === 'wagon' && entity.travel?.mode === 'wagon');
  if (!wagons.length) return [];
  const aboard = own.filter(entity => entity.kind === 'person' && !entity.carrier && entity.travel?.mode === 'wagon');
  const young = ['child', 'small', 'infant'];
  const order = [...aboard.filter(entity => entity.principal), ...aboard.filter(entity => !entity.principal && !young.includes(entity.band)), ...aboard.filter(entity => !entity.principal && young.includes(entity.band))];
  const oxen = own.filter(entity => entity.kind === 'animal' && entity.species !== 'horse' && entity.travel?.mode === 'wagon');
  const taken = new Set(), yoked = new Set();
  const teams = wagons.map(wagon => ({ wagon, driverId: null, ox: null }));
  // A family's journey together in a class made since 2026-09-25 (sim/company.mjs): the server has said who drives each wagon, who
  // rides and who walks, and that is the whole answer - nobody it seated as a rider or a walker is dealt a wagon to drive here.
  const planned = aboard.some(entity => entity.travel.drives || entity.travel.rides || entity.travel.afoot);
  if (planned) {
    for (const team of teams) {
      const by = aboard.find(entity => entity.travel.drives === team.wagon.id);
      if (by) { team.driverId = by.id; taken.add(by.id); } else team.none = true;
    }
  }
  // First the wagons somebody took on a journey of their own: theirs to drive. A name on several wagons - the flight - drives one.
  for (const team of teams) {
    if (planned) break;
    const by = team.wagon.borrowedBy;
    if (!by || taken.has(by)) continue;
    if (!aboard.some(entity => entity.id === by)) { team.none = true; continue; }
    team.driverId = by; taken.add(by);
  }
  // Then every other wagon - nobody's (the arrival), or one more of the flight's under a name already driving - from the family in
  // order. A journey's wagon whose driver is not on it is nobody's to draw.
  for (const team of teams) {
    if (team.driverId || team.none) continue;
    team.driverId = order.find(entity => !taken.has(entity.id))?.id || null;
    if (team.driverId) taken.add(team.driverId);
  }
  // The ox each wagon goes behind: the one that went with its driver, else the next of the family's.
  for (const team of teams) {
    team.ox = oxen.find(ox => !yoked.has(ox.id) && team.driverId && ox.borrowedBy === team.driverId && ox.borrowedBy === team.wagon.borrowedBy) || null;
    if (team.ox) yoked.add(team.ox.id);
  }
  for (const team of teams) {
    if (team.ox) continue;
    team.ox = oxen.find(ox => !yoked.has(ox.id) && (!ox.borrowedBy || ox.borrowedBy === team.wagon.borrowedBy)) || null;
    if (team.ox) yoked.add(team.ox.id);
  }
  return teams;
}
/** The wagon this person drives, with its ox, or null. */
export const teamDrivenBy = (entity, entities = []) => wagonTeams(entity?.householdId, entities).find(team => team.driverId === entity?.id) || null;
/**
 * Who rides in this wagon beside its driver, as the server seated them on a family's journey together (sim/company.mjs `rides`),
 * in the family's own order: the babies in their carriers' laps and the youngest, the sick first.
 */
export const passengersOf = (team, entities = []) => (team ? entities.filter(entity => entity.kind === 'person' && !entity.carrier && entity.householdId === team.wagon.householdId && entity.travel?.mode === 'wagon' && entity.travel.rides === team.wagon.id && entity.id !== team.driverId) : []);
/** The wagon this person rides in and its team, or null: somebody the server seated in a wagon, not driving it. */
export const teamRiddenBy = (entity, entities = []) => (entity?.kind === 'person' && entity.travel?.rides ? wagonTeams(entity.householdId, entities).find(team => team.wagon.id === entity.travel.rides) || null : null);
/**
 * Somebody the server said walks beside the wagons on the family's journey together (sim/company.mjs `afoot`) - or, for a family
 * with no vehicle (sim/means.mjs, owner 2026-09-25), walks with the others on foot: drawn in the same file, so a family of eight
 * walking in reads as eight and not one figure.
 */
export const walksBeside = entity => entity?.kind === 'person' && (entity.travel?.mode === 'wagon' || entity.travel?.mode === 'foot') && Boolean(entity.travel.afoot);
/** What this person is sitting on: 'horse', 'wagon', or null for anybody on their own feet. */
export function seatOf(entity, entities = []) {
  if (entity.kind !== 'person' || entity.carrier || entity.observed) return null;
  if (HURT_CONDITIONS.includes(entity.health?.condition) || STILL_CONDITIONS.includes(entity.health?.condition)) return null;
  if (inTheSaddle(entity)) return 'horse';
  if (entity.travel?.mode === 'wagon' && teamDrivenBy(entity, entities)) return 'wagon';
  return null;
}
/** Whether a beast is drawn with the person on it rather than by itself: the ridden horse, the ox and wagon being driven. */
export function carriedWithRider(entity, entities = []) {
  if (underARider(entity)) return true;
  // The family's horse with somebody the server put on it for the journey together (sim/company.mjs), and a baby in that rider's
  // arms: drawn with the rider, not again by themselves. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - riders, walkers
  // and the cart; the baby is not drawn in the rider's arms until a figure carrying one lands.
  if (entity.kind === 'animal' && entity.species === 'horse' && entities.some(one => one.kind === 'person' && one.travel?.saddle && !one.travel.carried && one.travel.rides === entity.id)) return true;
  if (entity.kind === 'person' && entity.travel?.saddle && entity.travel.carried) return true;
  // A rider in the wagon is drawn in it with its driver (public/app.js `drawSeated`), not a second time walking beside it.
  if (entity.kind === 'person' && entity.travel?.rides) {
    const team = teamRiddenBy(entity, entities);
    const driver = team?.driverId && entities.find(other => other.id === team.driverId);
    return Boolean(driver && seatOf(driver, entities) === 'wagon');
  }
  if ((entity.kind === 'wagon' || (entity.kind === 'animal' && entity.species !== 'horse')) && entity.travel?.mode === 'wagon') {
    const team = wagonTeams(entity.householdId, entities).find(one => one.wagon.id === entity.id || one.ox?.id === entity.id);
    const driver = team?.driverId && entities.find(other => other.id === team.driverId);
    return Boolean(driver && seatOf(driver, entities) === 'wagon');
  }
  return false;
}
/**
 * The eight identities Astra painted on horseback (`people-mounted-cast*`, 2026-09-21,
 * docs/ART_DELIVERY_2026-09-21-MOUNTED-FAMILY.md): the whole rider and the whole chestnut horse in one frame, with legs,
 * boots, stirrups and reins, in place of the cropped person laid over a separate horse. Four walk frames each, east (west
 * mirrored), south and north.
 *
 * The children's figures - `girl`, `boy`, `smallchild`, `infant` - are **not** in this delivery, so a child sent on the
 * horse keeps the composite (`seatLayout` without `whole`). That is a real case: a girl of twelve may be sent on it.
 */
export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl']);
/**
 * The four original-cast identities Astra painted driving (`people-wagon-drivers`, 2026-09-21,
 * docs/ART_DELIVERY_2026-09-21-WAGON-DRIVERS.md): a seated figure with connected reins and a short ox goad and no bench,
 * wagon, team or ground, composited over the wagon the renderer already draws.
 *
 * **The second cast's driver layers are not delivered and are not invented**: `rust-woman`, `indigo`, `ochre` and
 * `blue-girl` - and every child's figure - keep the standing pose cut at the hip until their own layers land.
 */
export const DRIVING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue']);
/**
 * Which figure somebody is drawn as: their own child's figure if the children's sheets draw them, else their cast figure.
 * **The one chooser.** The map (`entityClip`, which keeps a grown figure's pose for a child where the child's sheet has none),
 * a seat on the horse or the wagon (`seatedClip`), and the family panel's portrait (public/app.js `renderFamilyPanel`) all
 * ask this, so a person is the same figure wherever they are drawn. `observed`: somebody of another family (or anybody on the
 * Host's map), who never wears this student's principal's rust.
 */
export const figureOf = (entity, observed = false) => (!entity.carrier && childFigure(entity)) || castVariant(entity, observed);
/** Which figure somebody is drawn as on a mount: `figureOf`, as a family's own. */
export const seatFigure = entity => figureOf(entity);
/**
 * What is drawn for somebody on a mount, and whether it is the whole rig or only them.
 *
 * `whole` says the frame is the mount and the person together, so `seatLayout` draws nothing under it and the caller
 * mirrors it for west as it mirrors every other east-facing cycle. `seated` says the frame is a complete seated figure
 * standing on its own base rather than a standing figure to be cut off at the hip.
 */
export function seatedClip(entity, direction = 'e', seat = 'horse') {
  const figure = seatFigure(entity);
  const facing = ['n', 's', 'e', 'w'].includes(direction) ? direction : 'e';
  // No west sheet: west is the east cycle mirrored, which the caller's `flip` does. North and south are painted and are
  // never mirrored, which is what `upright` means everywhere else in this file.
  if (seat === 'horse' && RIDING_FIGURES.includes(figure)) {
    return { id: `${figure}-ride-${facing === 'w' ? 'e' : facing}`, whole: true, ...(facing === 'n' || facing === 's' ? { upright: true } : {}) };
  }
  // Each heading is painted, west included, so a driver is never mirrored. Not frozen: the delivery registers one held
  // breathing frame and the renderer's own breath is what keeps it alive.
  if (seat === 'wagon' && DRIVING_FIGURES.includes(figure)) return { id: `${figure}-wagon-driver-${facing}`, upright: true, seated: true };
  // The infant's sheet has no back view.
  const pose = figure === 'infant' && facing === 'n' ? 'idle-s' : `idle-${facing}`;
  return { id: `${figure}-${pose}`, upright: true, frozen: true };
}
/**
 * Where the parts of a seat are drawn, in a person's heights from the point the server gives them.
 *
 * `horseBack`, `horseBackUpright`, `wagonSeat`, `hip` and `overlap` belong to the **composite stand-in**: where a standing
 * figure's hip has to land on the mount, and how much of them is drawn before the saddle or the wagon's box would swallow
 * the rest. `driverHeight` is one of Astra's seated driver layers as a standing person is 1, and `driverHip` where the hip
 * sits up that layer from its own base - the boot soles on the footboard, which is what the frame stands on.
 * ceiling: the driver's two are read off the delivered sheet by eye and proved by a photograph
 * (scripts/riding-browser-proof.mjs, docs/evidence/riding-wagon.png), not measured out of the pixels. A seat anchor in the
 * manifest would settle them.
 */
export const SEAT = Object.freeze({ horseBack: 0.57, horseBackUpright: 0.6, wagonSeat: 0.44, hip: 0.44, overlap: 0.07, driverHeight: 0.92, driverHip: 0.42 });
/**
 * Where each part of a rider and their mount is drawn, and in the order to draw them. `sizes` are the mounts' drawn heights
 * as a person is 1 (public/app.js `SIZE`).
 *
 * Each part is `{ part: 'horse'|'ox'|'wagon'|'rider', dx, dy, height, shown?, whole?, seated? }`: `dx` is along the way
 * they face (mirrored for west by the caller's `flip`), `dy` down the screen to the part's ground line; `shown`, on a
 * rider of the composite, is how much of their height is drawn from the top of the head down.
 *
 * `delivered` is how tall the delivered art for this seat is drawn, as a person is 1, or **0 for the composite stand-in**:
 * the rider's own figure laid over a separately drawn mount, which is still what a child on the horse and a second-cast
 * driver get (`RIDING_FIGURES`, `DRIVING_FIGURES`). `seatedClip` is what decides which of the two a person is given.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-14 (on horseback) and 2026-09-16 (driving the ox wagon), both narrowed
 * on 2026-09-21 to exactly the figures Astra has not painted on a mount.
 */
export function seatLayout(seat, direction = 'e', { horse = 1.5, ox = 1.45, wagon = 1.55 } = {}, rider = 1, delivered = 0) {
  const vertical = direction === 'n' || direction === 's';
  // The rider's feet are put where their hip lands on the seat, and they are cut a little below the hip.
  const sitting = (seatHeight, dx = 0) => ({ part: 'rider', dx, dy: -seatHeight + SEAT.hip * rider, height: rider, shown: 1 - SEAT.hip + SEAT.overlap });
  if (seat === 'horse') {
    // Astra's mounted frames (2026-09-21) are the horse and the person on it painted as one, so there is nothing to lay
    // under them and nothing to cut: one part, standing on the hooves, at the height a rider and horse are drawn
    // (`MOUNTED_HEIGHT`), which is the height the click target and the travel marker already use.
    // ceiling: `rider` is not applied, so an adolescent rides at the same drawn height as their father - the horse is most
    // of that height and a horse does not shrink under a younger rider, and the sheets draw the adolescent as an
    // adolescent. A youth-sized rig would need a second set of frames, which is nobody's request.
    if (delivered > 0) return [{ part: 'rider', dx: 0, dy: 0, height: delivered, whole: true }];
    const on = sitting(horse * (vertical ? SEAT.horseBackUpright : SEAT.horseBack), vertical ? 0 : -0.05 * horse);
    const mount = { part: 'horse', dx: 0, dy: 0, height: horse };
    // Coming toward the camera the horse's head and shoulders are in front of the rider.
    return direction === 's' ? [on, mount] : [mount, on];
  }
  if (seat === 'wagon') {
    const box = { part: 'wagon', dx: vertical ? 0 : -0.55 * wagon, dy: 0, height: wagon };
    const team = { part: 'ox', dx: vertical ? 0 : 0.95 * ox, dy: vertical ? (direction === 'n' ? -0.5 : 0.5) * ox : 0, height: ox };
    const dx = vertical ? 0 : box.dx + 0.42 * wagon;
    // A delivered driver layer is a whole seated figure with its own boots: it stands on the footboard rather than being
    // a standing figure cut at the hip, so its base goes where its hip lands on the seat and none of it is clipped away.
    const seated = { part: 'rider', dx, dy: -wagon * SEAT.wagonSeat + SEAT.driverHip * SEAT.driverHeight * rider, height: SEAT.driverHeight * rider, seated: true };
    const driver = delivered > 0 ? seated : sitting(wagon * SEAT.wagonSeat, dx);
    // Going away the ox is further off and drawn first; coming toward the camera it is nearer and drawn last.
    return direction === 's' ? [box, driver, team] : [team, box, driver];
  }
  return [];
}
/**
 * Where a rider sits in the wagon behind its driver (sim/company.mjs; owner, 2026-09-25), as `seatLayout`'s parts are: `dx` along
 * the way they face, `dy` to the ground line, cut at the hip like the composite driver. Two abreast from the seat back toward the
 * tail, a cart's two and a wagon's four, each a little lower and further back than the one before; going north or south the wagon
 * is still side-on, so they sit along it.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - riders in the wagon. Their own figure's idle pose cut off below the waist,
 * set on the front of the wagon's cover behind the driver: the covered wagon has no open bed to seat anybody in.
 */
export function bedLayout(direction = 'e', index = 0, { wagon = 1.55 } = {}, rider = 1) {
  const vertical = direction === 'n' || direction === 's';
  const box = vertical ? 0 : -0.55 * wagon;
  const row = Math.floor(index / 2), side = index % 2;
  // Going north the bed is nearer the camera than the driver's seat, so they sit lower on the screen and in front of the driver;
  // going south, higher and behind. Either way two abreast, either side of the driver.
  const dx = vertical ? (side ? 0.24 : -0.24) * wagon : box + (0.24 - 0.2 * row - 0.08 * side) * wagon;
  const back = vertical ? (direction === 'n' ? 1 : -1) * 0.13 * wagon * (row + 1) : 0;
  const seat = wagon * SEAT.wagonSeat * (1.02 - 0.04 * side);
  return { part: 'passenger', dx, dy: -seat + SEAT.hip * rider + back, height: rider, shown: 1 - SEAT.hip + SEAT.overlap, ...(direction === 'n' && { front: true }) };
}
export function carrierClip(entity) {
  const vertical = entity.facing === 'n' || entity.facing === 's';
  if (entity.speaking) return vertical ? { id: `mounted-courier-speak-${entity.facing}`, upright: true } : { id: 'mounted-courier-speak' };
  if (entity.facing) return vertical ? { id: `mounted-courier-listen-${entity.facing}`, upright: true } : { id: 'mounted-courier-listen' };
  if (entity.travel) {
    const heading = travelHeading(entity);
    // No west sheet: east is mirrored, and a vertical cycle is never mirrored.
    return heading ? { id: `mounted-courier-${heading}`, upright: true } : { id: 'mounted-courier-e' };
  }
  return { id: 'mounted-courier-graze', upright: true };
}
/**
 * The children's figures Astra delivered (2026-09-14): a girl and a boy of about five to nine, a small child, and an
 * infant, with the poses the sheets hold. A child is drawn as their own figure wherever it has the pose, and as the
 * nearest grown figure scaled down (`figureScale`, which stays) wherever it does not yet. North/south walking is
 * delivered; task poses remain unnecessary for children under ten.
 */
export const CHILD_POSES = Object.freeze({
  girl: ['idle-s', 'idle-e', 'idle-w', 'idle-n', 'walk', 'walk-s', 'walk-n', 'rest', 'rest-s', 'rest-e', 'injured-rest', 'injured-rest-s', 'injured-rest-e'],
  boy: ['idle-s', 'idle-e', 'idle-w', 'idle-n', 'walk', 'walk-s', 'walk-n', 'rest', 'rest-s', 'rest-e', 'injured-rest', 'injured-rest-s', 'injured-rest-e'],
  smallchild: ['idle-s', 'idle-e', 'idle-w', 'idle-n', 'walk', 'walk-s', 'walk-n', 'rest', 'rest-s', 'rest-e', 'injured-rest', 'injured-rest-s', 'injured-rest-e'],
  infant: ['idle-s', 'idle-e', 'idle-w', 'rest'],
});
/** Which child's figure somebody is, or null for anyone the children's sheets do not draw. */
export function childFigure(entity) {
  if (entity.band === 'infant') return 'infant';
  if (entity.band === 'small') return 'smallchild';
  if (entity.band === 'child') return entity.sex === 'female' ? 'girl' : entity.sex === 'male' ? 'boy' : null;
  return null;
}
export function entityClip(entity, observed = false) {
  // In the saddle: their own figure sitting up, which public/app.js puts on the horse (`seatLayout`). The person alone and
  // at a person's height, because this is the figure-only path (public/app.js `miniPerson`); the whole painted rig is
  // asked for by name in `drawSeated`, which knows it has a mount's height to give it.
  if (!observed && seatOf(entity) === 'horse') return seatedClip(entity, travelDirection(entity) || 'e', null);
  const clip = grownClip(entity, observed);
  const grown = castVariant(entity, observed), young = entity.kind === 'person' && figureOf(entity, observed);
  if (!young || young === grown) return clip;
  const pose = clip.id.slice(grown.length + 1);
  return CHILD_POSES[young].includes(pose) ? { ...clip, id: `${young}-${pose}` } : clip;
}
function grownClip(entity, observed) {
  // Somebody else's principal is not this student's principal: an observed person never
  // wears the mark, whatever their own household may call them.
  const variant = castVariant(entity, observed);
  const condition = entity.health?.condition || entity.condition;
  // Somebody hurt is drawn hurt, and a condition outranks whatever they were doing.
  if (HURT_CONDITIONS.includes(condition)) return { id: `${variant}-injured-rest`, frozen: true, upright: true };
  // Capture and death stay a still upright pose; a lying-down figure would be a depiction
  // this project never chose.
  if (STILL_CONDITIONS.includes(condition)) return { id: `${variant}-idle-s`, frozen: true, upright: true };
  if (entity.carrier) return carrierClip(entity);
  // Standing talking with a rider who has reined in. The server says which - and only while the meeting is open
  // (sim/encounters.mjs `listeningOf`) - so nothing here invents a conversation. Every cast figure has these three poses:
  // a two-frame east-facing speaking cycle, mirrored for west, and a front and a back listening pose. There is no
  // east-facing listening pose on any sheet, so somebody listening to a rider beside them is drawn facing the camera,
  // which is what the delivery painted and reads correctly at map scale.
  // ceiling: `speak` is the east cycle whichever way they are turned; a person speaking to somebody above or below them
  // is drawn side on. A vertical speaking cycle is nobody's request yet.
  if (!observed && entity.speaking) return { id: `${variant}-speak` };
  // Not frozen: the listening frame is one pose and the renderer's own breathing is what keeps it alive, which is what
  // the delivery note asked for. `upright`, because a back view is never mirrored.
  if (!observed && entity.facing) return { id: `${variant}-listen-${entity.facing === 'n' ? 'n' : 's'}`, upright: true };
  // Walking across Gonzales from one place in it to another (public/town-scenes.js `TownWalker`): the page, not the server,
  // knows the figure is between the two, because it is the page that walks them there instead of sliding them.
  if (entity.kind === 'person' && entity.stepping) {
    return entity.stepping === 'n' || entity.stepping === 's' ? { id: `${variant}-walk-${entity.stepping}`, upright: true } : { id: `${variant}-walk` };
  }
  // Doing something in one of the town's scenes before the fight (sim/town-scenes.mjs): the pose the server names, which is
  // a delivered one. Listening and the idle poses are turned by their own sheets; everything else is east, mirrored for west.
  if (entity.kind === 'person' && entity.scenePose?.pose) {
    const { pose, face = 's' } = entity.scenePose;
    if (pose === 'idle') return { id: `${variant}-idle-${face}`, upright: true };
    if (pose === 'listen') return { id: `${variant}-listen-${face === 'n' ? 'n' : 's'}`, upright: true };
    return { id: `${variant}-${pose}` };
  }
  if (entity.kind === 'animal') {
    // A class saved before there were horses has no `species` on anything, and every
    // animal in it is an ox - so the absent field reads correctly as one.
    const beast = entity.species === 'horse' ? 'horse' : 'ox';
    const heading = travelHeading(entity);
    return entity.travel
      ? { id: heading ? `${beast}-walk-${heading}` : `${beast}-walk`, upright: Boolean(heading) }
      : { id: beast === 'horse' ? 'horse-chestnut-idle' : 'ox-brown-idle' };
  }
  // A wagon coming home from the timber with a kill in it is drawn with something in it.
  // The library has carried loaded and empty travel cycles since the art landed and
  // nothing had ever distinguished them, because until now nothing was ever carried.
  if (entity.kind === 'wagon') {
    if (!entity.travel || entity.condition !== 'sound') return { id: 'wagon-idle' };
    return { id: entity.laden ? 'wagon-loaded-travel' : 'wagon-travel' };
  }
  // Other households expose only broad task. Never infer their private chore/cargo.
  const doing = observed ? '' : entity.chore?.doing || '';
  // Coming back with something, from the field or out of the timber. The carry cycle has
  // been in the library since the art landed and only the harvest had ever used it.
  if (/carrying the crop|carrying it home/.test(doing)) return { id: `${variant}-carry` };
  // A hunt, drawn as the thing it is. Waiting downwind is a person holding still, so the
  // pose is frozen on purpose: a fidgeting hunter is a hunter who has been seen. The shot
  // itself changes no pose - the smoke does that work, in public/app.js - because the
  // library has no civilian firing cycle and dressing a farmer in the militia sheet to
  // borrow one would put a soldier in the timber.
  if (/waiting downwind|the shot/.test(doing)) return { id: `${variant}-idle-s`, frozen: true, upright: true };
  if (/reading the ground/.test(doing)) return { id: `${variant}-search` };
  if (entity.travel || entity.task === 'travel' || /walking|coming in|fetching the hoe/.test(doing)) {
    const heading = travelHeading(entity);
    return heading ? { id: `${variant}-walk-${heading}`, upright: true } : { id: `${variant}-walk` };
  }
  if (/breaking the rows|cutting the crop/.test(doing)) return { id: `${variant}-work` };
  if (/putting in seed/.test(doing)) return { id: `${variant}-sow` };
  if (/mending the hoe/.test(doing)) return { id: `${variant}-repair` };
  if (/hunting in the timber|looking for/.test(doing)) return { id: `${variant}-search` };
  if (/trading for/.test(doing)) return { id: `${variant}-trade` };
  if (entity.task === 'rest') return { id: `${variant}-rest`, upright: true };
  return { id: `${variant}-idle-s` };
}
/** The point `miles` along a road, for a caller drawing somebody somewhere other than where `position` puts them. */
export const alongRoute = (points, miles) => along(points, miles);
function along(points, distance) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length) { const f = length ? distance / length : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
    distance -= length;
  }
  return points.at(-1);
}
/**
 * The minutes of 1835 one live tick can move the calendar: `CALENDAR_SCALE` in sim/clock.mjs,
 * which the browser cannot import. A snapshot one tick on by any of these is the next tick and
 * is drawn as a walk; any other gap is a Host's time jump and is snapped. This list used to be
 * the single number 20, so on the real land every tick of the news phase (an hour a tick) was
 * taken for a jump and a traveller was drawn teleporting three miles every tick.
 * tests/movement.test.mjs holds it equal to the clock's own table.
 */
export const CALENDAR_STEPS = Object.freeze([20, 60, 240, 720]);
export const sameJourney = (a, b) => Boolean(a && b && a.from === b.from && a.to === b.to);
/**
 * How far along a journey somebody is drawn, as a fraction `f` of the way through the tick.
 * Linear in real time from where they were drawn when the tick arrived to where the server
 * says they are now: an even walk, with no easing, so the figure never hurries at the start
 * of a tick and dawdles at the end.
 */
export const drawnProgress = (start, end, f) => start + (end - start) * Math.min(1, Math.max(0, f));
export class ProjectionMotion {
  constructor() { this.records = new Map(); this.session = null; this.tick = null; }
  accept(snapshot, now) {
    const world = snapshot.world;
    // A repeat render/map fetch must not restart the current interpolation.
    if (snapshot.sessionId === this.session && world.tick === this.tick && snapshot.revision === this.revision) return;
    const cadence = Number.isFinite(snapshot.tickMs) ? snapshot.tickMs : 1000;
    const entities = [...(world.entities || []), ...(world.others || [])].filter(entity => entity.location);
    // The same tick again with a new revision: somebody in the class did something (any command
    // bumps the revision and every screen is sent a snapshot). Nobody moved, so nothing restarts.
    // This used to be treated as a break in time: every traveller on every screen snapped to the
    // end of the tick, and the next tick's walk was then squeezed into whatever was left of the
    // interval - a lurch and a stand, once a tick, in any class where students are doing things.
    if (snapshot.sessionId === this.session && world.tick === this.tick && world.minute === this.minute) {
      const next = new Map();
      for (const entity of entities) {
        const was = this.records.get(entity.id);
        next.set(entity.id, was ? { ...was, current: structuredClone(entity) } : { current: structuredClone(entity), previous: null, at: now, duration: cadence });
      }
      this.records = next; this.revision = snapshot.revision;
      return;
    }
    const step = world.minute - this.minute;
    const ordinaryTime = !Number.isFinite(world.minute) || !Number.isFinite(this.minute) || CALENDAR_STEPS.includes(step);
    const sequential = snapshot.sessionId === this.session && world.tick === this.tick + 1 && world.status === 'running' && ordinaryTime;
    // One tick's movement is spread across one tick's worth of real time: the interval the server
    // says a tick costs, not a flat second (a traveller at the study pace once glided for one second
    // and stood for eight and a half) and not the gap since the last snapshot, which a command in
    // the middle of a tick or a pace change could make far shorter than the tick really is.
    const duration = Math.max(80, cadence);
    const next = new Map();
    for (const entity of entities) {
      const was = this.records.get(entity.id), previous = sequential ? was?.current : null;
      // Carry on from where the figure is actually drawn. A tick that arrives a little early
      // would otherwise pull the walker back or push them forward in one frame.
      const startProgress = previous && sameJourney(previous.travel, entity.travel) && was.previous && sameJourney(was.previous.travel, previous.travel)
        ? this.progressAt(was, previous, now) : null;
      next.set(entity.id, { current: structuredClone(entity), previous, at: now, duration, startProgress });
    }
    this.records = next; this.session = snapshot.sessionId; this.tick = world.tick; this.minute = world.minute; this.revision = snapshot.revision;
  }
  progressAt(record, entity, now) {
    const oldTravel = record.previous.travel, f = (now - record.at) / record.duration;
    return drawnProgress(record.startProgress ?? oldTravel.progress, entity.travel?.progress ?? oldTravel.distance, f);
  }
  position(entity, now, reducedMotion = false) {
    const record = this.records.get(entity.id), previous = record?.previous;
    if (!previous || reducedMotion) return entity.location;
    const f = Math.min(1, Math.max(0, (now - record.at) / record.duration));
    const oldTravel = previous.travel, travel = entity.travel;
    if (oldTravel?.points?.length && (!travel || sameJourney(oldTravel, travel))) {
      // `base`: the Host is sent only the stretch of road round each traveller (sim/overview.mjs `roadWindow`).
      return along(oldTravel.points, this.progressAt(record, entity, now) - (oldTravel.base || 0)) || entity.location;
    }
    if (previous.location.siteId && previous.location.siteId === entity.location.siteId && Math.hypot(previous.location.x - entity.location.x, previous.location.y - entity.location.y) < .6) {
      return { x: previous.location.x + (entity.location.x - previous.location.x) * f, y: previous.location.y + (entity.location.y - previous.location.y) * f };
    }
    return entity.location;
  }
  /**
   * The journey somebody is drawn along now, or null: the one `position` walks them down. On the tick they arrive it is the
   * journey just finished, which they are still drawn walking the end of while the server already has them at the place.
   */
  journey(entity, reducedMotion = false) {
    const previous = this.records.get(entity.id)?.previous, travel = entity.travel;
    const oldTravel = !reducedMotion && previous?.travel;
    if (oldTravel?.points?.length && (!travel || sameJourney(oldTravel, travel))) return oldTravel;
    return travel?.points?.length ? travel : null;
  }
  /**
   * How far along that journey they are drawn, in the miles its `progress` counts: where `position` puts them. Between two
   * ticks it runs from where they were drawn toward the server's progress and stops there - never beyond it
   * (tests/travel-drawn.test.mjs), so nothing drawn from it can arrive before the server says so.
   */
  drawnMiles(entity, now, reducedMotion = false) {
    const record = this.records.get(entity.id), travel = entity.travel;
    const oldTravel = !reducedMotion && record?.previous?.travel;
    if (oldTravel?.points?.length && (!travel || sameJourney(oldTravel, travel))) return this.progressAt(record, entity, now);
    return travel?.progress ?? 0;
  }
}
/**
 * How a journey is drawn, so nobody is ever seen moving faster than they could move.
 *
 * Owner, 2026-09-18, playtesting Solo: "when i sent my main character to gonzales on foot he ran inhumanly fast". A marker
 * on a dotted road was built for that, and on 2026-09-22 the owner threw it out: "characters are still seen zipping around.
 * i don't want to see icons. i want to see them walk at a normal pace, then when they've walked a ways (say if they're
 * going somewhere that isn't their farm) they should fade out. then after they travel extra fast, they fade back in after
 * arriving close enough to when normally the rest of the way. that way they arrive at the correct time, but no one sees
 * them move unnaturally."
 *
 * And the correction the same day, which the land test below is: "this shouldn't be a thing on their land. everyone should
 * move at normal speed at all times (unless on horseback or wagon) on their land."
 *
 * **Nothing here touches the simulation.** The server owns every journey, every pace (sim/travel.mjs) and every arrival
 * minute; this decides only where along the road a figure is *drawn* and how much of it is drawn at all. `travelSight` maps
 * the journey's end to the journey's end, so the drawn arrival is the server's arrival and nothing else could make it not
 * be. docs/MAP_ACCURACY.md §12a says the same in words.
 */
/**
 * The fastest a figure may be drawn crossing the ground, in its own drawn heights a real second.
 *
 * 1.2 is how much ground the library's travel cycles cover at the rate they were drawn: a person's walk is one stride of
 * 0.86 of a height in 720 ms (1.19 a second), the horse's and the ox's walk a body in 840 ms (1.19), the wagon's wheel 1.23
 * bodies a turn at 1.1 turns a second (1.35). `gaitStep` never plays a cycle faster than it was drawn, so above this the
 * ground runs out from under the feet and the figure skates - which reads as running. It sits in the 1 to 1.5 a walk looks
 * natural at: a real walker covers about 0.8 of their height a second, a brisk one 1.1.
 *
 * Because it is counted in the figure's *own* drawn height it is already the pace of whatever somebody is on: a rider and
 * horse are drawn 1.8 of a person (`MOUNTED_HEIGHT`) and so may cross 1.8 times the ground a walker may, and a driver the
 * wagon's own height. That is the owner's "unless on horseback or wagon" (2026-09-22), and it needs no second number.
 * ceiling: one number for people, riders, beasts and the wagon, from cycles that happen to agree within a tenth; a cycle
 * drawn much slower or faster (a trot, a gallop) would want its own, from its own stride.
 */
export const GAIT_CEILING = 1.2;
/**
 * The stretch walked in view at each end of a journey before the figure fades, in yards and in miles of ground.
 *
 * The owner chose "a short fixed stretch" by multiple choice (2026-09-22): about a hundred yards of ordinary walking, the
 * same everywhere, whatever the land looks like. A hundred yards is two or three seconds of walking on screen - long enough
 * to read as setting out and as coming in, short enough that the middle still has room to be crossed invisibly. A bigger
 * number costs the fade itself: past what the journey can spare (`room` in `travelSight`) there is no fade at all and the
 * whole thing is drawn at the server's pace, which is the zipping. A smaller one reads as a figure appearing at the gate.
 */
export const SEEN_YARDS = 100, YARDS_A_MILE = 1760, SEEN_MILES = SEEN_YARDS / YARDS_A_MILE;
/**
 * How long a figure takes to fade out, and to fade back in, in real milliseconds.
 *
 * 700 ms reads as a fade and not a blink at the five frames a second a close-in view of a town makes on a slow computer,
 * where 400 ms was a single step between. Longer, and the fade itself eats the middle of a short journey and the fade is
 * given up; shorter, and it pops, which is the one thing the owner asked not to see.
 */
export const TRAVEL_FADE_MS = 700;
/**
 * The most the drawn share of a figure may change in one painted frame, as a share of `TRAVEL_FADE_MS`, and how long a gap
 * between two frames is still eased across rather than taken at once.
 *
 * The schedule's own fade is a ramp in the server's progress, and left to itself it never pops. What pops is the schedule
 * *changing under it*: a student rolling the zoom wheel in on somebody already halfway across the country moves the gait
 * (which is measured in the figure's drawn height) past the server's pace in one frame, and the figure they were watching
 * would vanish between two frames. So the drawn share is eased toward whatever the schedule asks for, at twice the fade's
 * own rate - fast enough never to slow the schedule's own ramp down, slow enough that the worst jump takes half a fade
 * rather than a frame. Longer than `FADE_STALE_MS` since this traveller was last drawn and the time between is not counted:
 * somebody standing is never asked, so the last their entry heard of them may be their last journey.
 */
export const FADE_RATE = 2, FADE_STALE_MS = 250;
/** A drawn share moved toward `target` for `elapsedMs`, a whole fade taking `fadeMs`. */
export function fadeToward(alpha, target, elapsedMs, fadeMs = TRAVEL_FADE_MS / FADE_RATE) {
  if (!(fadeMs > 0)) return target;
  const step = Math.max(0, elapsedMs || 0) / fadeMs;
  return target > alpha ? Math.min(target, alpha + step) : Math.max(target, alpha - step);
}
/**
 * The miles the server says a tick carries this journey (sim/world.mjs `milesATick`, sent as `step`); without it (a class
 * saved before it was sent) a speed is miles a farming tick, carried as many times over as the last tick was longer
 * (it is only needed for a class saved and served before `step` was sent; whether a journey may be watched at all is the
 * server's, sim/sight.mjs).
 */
export function travelMilesATick(travel, minutesATick = 0) {
  if (!travel) return 0;
  if (Number.isFinite(travel.step)) return Math.max(0, travel.step);
  if (!Number.isFinite(travel.speed)) return 0;
  return Math.max(0, travel.speed) * (minutesATick > 0 ? minutesATick / CALENDAR_STEPS[0] : 1);
}
/**
 * How fast somebody is drawn crossing the screen, in their own drawn heights a real second: the miles a tick carries them,
 * at the camera's pixels a mile, over the real milliseconds a tick is drawn in, against how tall they are drawn in pixels.
 * This is the number the evidence quotes (docs/evidence/travel-speed-screen.json), and what `GAIT_CEILING` is a ceiling on.
 */
export function drawnHeightsPerSecond({ milesATick, tickMs, scale, heightPx }) {
  if (!(milesATick > 0) || !(tickMs > 0) || !(scale > 0) || !(heightPx > 0)) return 0;
  return milesATick * scale / heightPx / (tickMs / 1000);
}
/** The same speed in ground rather than heights: miles of the world a real second, which is what `travelSight` schedules. */
export function drawnMilesASecond({ milesATick, tickMs }) {
  return !(milesATick > 0) || !(tickMs > 0) ? 0 : milesATick / (tickMs / 1000);
}
/** How much ground this figure may cross a real second and still be walking: `GAIT_CEILING` of its own drawn height. */
export function gaitMilesASecond({ scale, heightPx, ceiling = GAIT_CEILING }) {
  return !(scale > 0) || !(heightPx > 0) ? 0 : ceiling * heightPx / scale;
}
/**
 * The first point of `points` lying beyond `miles` along them, or `points.length` when none does: where the road still ahead
 * of a traveller begins. Allocates nothing, since it runs for every road drawn on every frame.
 */
export function routeIndexAfter(points, miles) {
  let gone = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index];
    gone += Math.hypot(b.x - a.x, b.y - a.y);
    if (gone > miles) return index;
  }
  return points.length;
}
/**
 * Where a journey leaves the family's own land and where it last comes back onto it, in miles along the road.
 *
 * Owner, 2026-09-22: "this shouldn't be a thing on their land. everyone should move at normal speed at all times (unless on
 * horseback or wagon) on their land." So the land, not a distance, decides where the fade may begin: a journey that starts
 * at the house walks its whole on-land stretch in view whatever its length, and one that ends at the house is back in view
 * before it crosses the line. `inside` is the caller's test of one point - the family's own grant - and a caller with no
 * land to test (the Host, somebody else's family) passes none, which reads as off-land the whole way.
 *
 * `base` is how far along the road `points` begins: the Host is sent only the stretch round each traveller (sim/overview.mjs
 * `roadWindow`). `enters` is backed off one sample, so the fade-in is finished *before* the line rather than on it.
 * ceiling: only the run at the start and the run at the end are found. A journey that crosses its own land in the middle -
 * which no road on this map does - is drawn crossing it invisibly; the way out is a run-by-run schedule instead of two ends.
 */
export function landRuns(points, inside, distance, base = 0, step = SEEN_MILES / 2) {
  const far = Number.isFinite(distance) && distance > 0 ? distance : 0;
  if (typeof inside !== 'function' || !Array.isArray(points) || points.length < 2 || !far) return { leaves: 0, enters: far };
  let leaves = null, lastOnFrom = null, gone = base;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index], length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(length / step));
    for (let k = index === 1 ? 0 : 1; k <= steps; k++) {
      const f = k / steps, at = gone + length * f;
      if (inside({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })) { if (lastOnFrom === null) lastOnFrom = at; }
      else { if (leaves === null) leaves = at; lastOnFrom = null; }
    }
    gone += length;
  }
  return { leaves: leaves === null ? far : leaves, enters: lastOnFrom === null ? far : Math.max(0, lastOnFrom - step) };
}
/**
 * Where along the road a traveller is drawn, and how much of them is drawn at all.
 *
 * Walk, fade, cross, fade, walk. `miles` is where the server's own progress has them (`ProjectionMotion.drawnMiles`), and
 * everything here is a function of it, so the schedule cannot drift and cannot outlive its journey: at `miles === distance`
 * it returns `distance` at full strength, which is the arrival the server decided.
 *
 *   - the road up to `leaves` is the family's own land and is walked in view at the figure's own gait, however long it is;
 *   - a hundred yards past the line (`SEEN_MILES`) is walked too, and then the figure fades out over `TRAVEL_FADE_MS`;
 *   - the middle is crossed with nobody watching, at whatever speed the server's arrival needs;
 *   - the figure fades back in a hundred yards short of the end - or short of its own land, whichever comes first - and
 *     walks the rest at its own gait.
 *
 * `gait` is the ground this figure may cross a real second and still be walking (`gaitMilesASecond`) and `milesASecond` the
 * ground the server is actually carrying them over. Below the gait there is nothing to hide, and the journey is drawn exactly
 * where the server has it. `rate` is the one over the other: how much drawn road a mile of the server's progress buys while
 * the figure is in view.
 *
 * ceiling: **a journey whose own-land stretches the road cannot pay for is drawn at the server's pace, in view, from end to
 * end** - a farm crossing pressed close in, and a hurried short errand that begins on the farm, can both still outrun the
 * gait. That is one rule and not two, and nothing else is possible: on their own land nobody may be faded (owner,
 * 2026-09-22), and the arrival is the server's. The ways out are the class clock (docs/evidence/pace.json) or fading on the
 * farm too, which the owner refused.
 */
export function travelSight({ distance, miles, milesASecond, gait, leaves = 0, enters = null, fadeMs = TRAVEL_FADE_MS, seen = SEEN_MILES }) {
  const far = Number.isFinite(distance) && distance > 0 ? distance : 0;
  const at = Math.min(Math.max(0, miles || 0), far);
  const whole = { miles: at, alpha: 1, rate: 1, lead: far, tail: far, faded: false };
  if (!far || !(milesASecond > 0) || !(gait > 0) || milesASecond <= gait) return whole;
  const rate = gait / milesASecond;
  // One fade, counted in the server's own miles, because that is the clock everything here is a function of.
  const fade = Math.max(0, fadeMs) / 1000 * milesASecond;
  const onLead = Math.min(Math.max(0, leaves), far);
  const onTail = Math.min(Math.max(0, far - (Number.isFinite(enters) ? enters : far)), far);
  // `room` is all the drawn road the two walked ends may share: what the two fades leave of the journey at the gait's pace.
  // It will not always stretch to everything, and **the family's own land is paid for first and in full**.
  //
  // The owner's correction of 2026-09-22 is absolute - "everyone should move at normal speed at all times ... on their
  // land" - so a figure may never *begin* to fade while it is still on its own land, whatever that costs. Walking a farm's
  // own half mile at the gait costs about thirteen real seconds, and a journey has only `rate` of its length to spend, so
  // at a hurried class pace pressed right in a five-mile errand cannot pay for it. Then there is no fade at all and the
  // whole journey is drawn where the server has it, in view: the same answer a journey that never leaves their land gets,
  // and the price of it is that a hurried short errand is visibly quick.
  const room = rate * (far - 2 * fade), land = onLead + onTail;
  if (!(room >= land)) return whole;
  // The hundred yards off the land at each end, out of whatever is left. Off their land it is a target and not a promise:
  // it shortens, and goes to nothing, rather than start a fade a foot inside the family's own line.
  const give = Math.min(seen, (room - land) / 2);
  const lead = onLead + give, tail = onTail + give;
  // Under about half the hundred yards a walked end stops reading as walking - fifty yards is a second and a bit of it -
  // and what is left is a figure that blinks out and back. Better drawn whole and brisk than blinking, so there is no fade
  // at all: that is the owner's "a journey shorter than about 200 yards is simply walked the whole way", arrived at from the
  // road left rather than from a second constant. Pressed close in at a farming tick it falls at about seven hundred yards.
  // A journey that carries its own land at an end has already paid for a walk there, so the land counts toward this.
  if (!(lead >= seen / 2) || !(tail >= seen / 2)) return whole;
  const out = lead / rate, back = far - tail / rate - fade;
  const alpha = Math.max(0, Math.min(1, Math.max((out + fade - at) / fade, (at - back) / fade)));
  const held = rate * (out + fade), rejoin = far - rate * (far - back);
  const drawn = at <= out + fade ? rate * at
    : at >= back ? far - rate * (far - at)
    : held + (rejoin - held) * (at - out - fade) / Math.max(1e-9, back - out - fade);
  return { miles: Math.min(far, Math.max(0, drawn)), alpha, rate, lead, tail, faded: true };
}
/**
 * How much ground one loop of a travel cycle covers, in the drawn height of whoever is doing it.
 *
 * Every walk and ride cycle in the library is one stride: two steps. A person's step is a little
 * under half their height, so a stride is 0.86 of one; a horse or an ox covers about its own
 * drawn height in a stride of its walk. A wheel covers its own circumference in a turn, which the
 * clip already states (`clipGait`).
 */
export const STRIDE = Object.freeze({ foot: 0.86, hoof: 1 });
/**
 * The slowest a travel cycle plays, as a share of its authored speed. Feet matched exactly to a
 * crawl would stand still on a figure that is still, just, going somewhere.
 */
export const GAIT_FLOOR = 0.25;
/** A clip's loop length and the ground one loop covers: from its turning wheels if it has them, its frames if not. */
export function clipGait(clip, strideBodies = STRIDE.foot) {
  const wheel = (clip?.parts || []).find(part => part.turnsPerSecond > 0 && part.height > 0);
  if (wheel) return { cycleMs: 1000 / wheel.turnsPerSecond, strideBodies: Math.PI * wheel.height };
  const cycleMs = (clip?.frames || []).reduce((total, frame) => total + (Number.isFinite(frame.duration) ? frame.duration : 0), 0);
  return cycleMs > 0 ? { cycleMs, strideBodies } : null;
}
/**
 * How many milliseconds of a travel cycle to play for one painted frame.
 *
 * The owner (2026-09-16): walking "still looks too fast", without the ground covered changing.
 * The authored cycles step at their own rate whatever the ground does - 2.8 steps a second for a
 * person - and a figure drawn covering less ground than that has feet running ahead of the road
 * under it, which reads as hurry. So the cycle plays at the rate the drawn ground demands: one
 * loop per stride of screen actually covered. Never faster than authored, so a class on a fast
 * pace or a compressed calendar glides rather than flails; never slower than `GAIT_FLOOR`.
 */
export function gaitStep({ elapsedMs, movedBodies, cycleMs, strideBodies, floor = GAIT_FLOOR }) {
  if (!(elapsedMs > 0) || !(cycleMs > 0) || !(strideBodies > 0)) return 0;
  const matched = Math.max(0, movedBodies || 0) / strideBodies * cycleMs;
  return Math.min(elapsedMs, Math.max(elapsedMs * floor, matched));
}
/**
 * Each traveller's own place in their stride, advanced by the ground they were drawn covering.
 * Kept in loops rather than milliseconds, so turning from an east cycle to a south one (different
 * lengths) keeps the foot where it was. Display state only; `clockMs` is the renderer's
 * animation clock, which stops when the class is paused.
 *
 * ceiling: one entry per traveller ever drawn in this page, never pruned. A class has a few
 * hundred people and animals; prune by age if a class ever draws thousands.
 */
export class GaitClock {
  constructor() { this.walkers = new Map(); }
  time(id, { clockMs, at, bodyMiles, gait }) {
    let walker = this.walkers.get(id);
    if (!walker || clockMs < walker.clockMs) { walker = { loops: 0, clockMs, at }; this.walkers.set(id, walker); }
    const moved = walker.at && at && bodyMiles > 0 ? Math.hypot(at.x - walker.at.x, at.y - walker.at.y) / bodyMiles : 0;
    walker.loops += gaitStep({ elapsedMs: clockMs - walker.clockMs, movedBodies: moved, ...gait }) / gait.cycleMs;
    walker.clockMs = clockMs; walker.at = at;
    return walker.loops * gait.cycleMs;
  }
}
