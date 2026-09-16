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
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-12, priorities 1 and 2. The library has one
 * cast - `rust` a man, `teal` a woman, `elder` an older man, `blue` an adolescent - and no
 * children, so a person is drawn as the nearest figure it has: a woman or girl as `teal`, a
 * boy as `blue`, a man as `elder`, the principal in `rust` whoever they are. Replace with
 * `rust-woman`, `indigo`, `ochre`, `blue-girl`, `girl`, `boy` and `smallchild` when
 * they are delivered. Somebody with no stated sex - the founding four, the town, a class saved
 * before rolling - keeps the old choice by id, which is what they have always looked like.
 */
export function castVariant(entity, observed = false) {
  if (entity.principal && !observed) return PRINCIPAL_VARIANT;
  if (entity.sex === 'female') return 'teal';
  if (entity.sex === 'male') return ['adult', undefined, null].includes(entity.band) ? 'elder' : 'blue';
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
  let left = Number.isFinite(travel.progress) ? travel.progress : 0;
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
export const ORDINARY_CONDITIONS = ['well', 'tired'];
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
 * `harness`), so a horse on a journey made on horseback is being ridden.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-14 - family members on horseback. Whoever rides is drawn as the courier
 * rider, until the cast has mounted figures of its own.
 */
export const inTheSaddle = entity => entity.kind === 'person' && !entity.carrier && entity.travel?.mode === 'horse';
/** How tall a rider and horse are drawn, as a person is 1: the horse at its own size with somebody sitting up on it. */
export const MOUNTED_HEIGHT = 1.8;
export const mounted = entity => entity.kind === 'person' && (entity.carrier || inTheSaddle(entity));
export const underARider = entity => entity.kind === 'animal' && entity.species === 'horse' && entity.travel?.mode === 'horse';
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
  const clip = grownClip(entity, observed);
  const young = entity.kind === 'person' && !entity.carrier && childFigure(entity);
  if (!young) return clip;
  const pose = clip.id.slice(castVariant(entity, observed).length + 1);
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
  if (inTheSaddle(entity)) {
    const heading = travelHeading(entity);
    return heading ? { id: `mounted-courier-${heading}`, upright: true } : { id: 'mounted-courier-e' };
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
function along(points, distance) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length) { const f = length ? distance / length : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
    distance -= length;
  }
  return points.at(-1);
}
export class ProjectionMotion {
  constructor() { this.records = new Map(); this.session = null; this.tick = null; this.receivedAt = 0; }
  accept(snapshot, now) {
    const world = snapshot.world;
    // A repeat render/map fetch must not restart the current interpolation.
    if (snapshot.sessionId === this.session && world.tick === this.tick && snapshot.revision === this.revision) return;
    const ordinaryTime = !Number.isFinite(world.minute) || !Number.isFinite(this.minute) || world.minute - this.minute === 20;
    const sequential = snapshot.sessionId === this.session && world.tick === this.tick + 1 && world.status === 'running' && ordinaryTime;
    // One tick's movement is spread across one tick's worth of real time. The ceiling
    // used to be a flat second, which was invisible while a tick *was* a second and became
    // a bug the moment a class could be slowed down: a traveller glided for one second and
    // then stood frozen for the remaining eight and a half. Measured from the arrivals
    // themselves, and bounded by what the server says a tick costs.
    const cadence = Number.isFinite(snapshot.tickMs) ? snapshot.tickMs : 1000;
    const duration = Math.max(80, Math.min(cadence * 1.5, now - this.receivedAt));
    const next = new Map();
    for (const entity of [...(world.entities || []), ...(world.others || [])]) {
      if (!entity.location) continue;
      const previous = this.records.get(entity.id)?.current;
      next.set(entity.id, { current: structuredClone(entity), previous: sequential ? previous : null, at: now, duration });
    }
    this.records = next; this.session = snapshot.sessionId; this.tick = world.tick; this.minute = world.minute; this.revision = snapshot.revision; this.receivedAt = now;
  }
  position(entity, now, reducedMotion = false) {
    const record = this.records.get(entity.id), previous = record?.previous;
    if (!previous || reducedMotion) return entity.location;
    const f = Math.min(1, Math.max(0, (now - record.at) / record.duration));
    const oldTravel = previous.travel, travel = entity.travel;
    if (oldTravel?.points?.length && (!travel || (oldTravel.from === travel.from && oldTravel.to === travel.to))) {
      return along(oldTravel.points, oldTravel.progress + ((travel?.progress ?? oldTravel.distance) - oldTravel.progress) * f) || entity.location;
    }
    if (previous.location.siteId && previous.location.siteId === entity.location.siteId && Math.hypot(previous.location.x - entity.location.x, previous.location.y - entity.location.y) < .6) {
      return { x: previous.location.x + (entity.location.x - previous.location.x) * f, y: previous.location.y + (entity.location.y - previous.location.y) * f };
    }
    return entity.location;
  }
}
