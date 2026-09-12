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
export function carrierClip(entity) {
  if (entity.speaking) return { id: 'mounted-courier-speak' };
  if (entity.facing) return { id: 'mounted-courier-listen' };
  if (entity.travel) {
    const heading = travelHeading(entity);
    // No west sheet: east is mirrored, and a vertical cycle is never mirrored.
    return heading ? { id: `mounted-courier-${heading}`, upright: true } : { id: 'mounted-courier-e' };
  }
  return { id: 'mounted-courier-graze', upright: true };
}
export function entityClip(entity, observed = false) {
  // Somebody else's principal is not this student's principal: an observed person never
  // wears the mark, whatever their own household may call them.
  const variant = visualVariant(entity.id, Boolean(entity.principal) && !observed);
  const condition = entity.health?.condition || entity.condition;
  // Somebody hurt is drawn hurt, and a condition outranks whatever they were doing.
  if (HURT_CONDITIONS.includes(condition)) return { id: `${variant}-injured-rest`, frozen: true, upright: true };
  // Capture and death stay a still upright pose; a lying-down figure would be a depiction
  // this project never chose.
  if (STILL_CONDITIONS.includes(condition)) return { id: `${variant}-idle-s`, frozen: true, upright: true };
  if (entity.carrier) return carrierClip(entity);
  if (entity.kind === 'animal') {
    const heading = travelHeading(entity);
    return entity.travel ? { id: heading ? `ox-walk-${heading}` : 'ox-walk', upright: Boolean(heading) } : { id: 'ox-brown-idle' };
  }
  if (entity.kind === 'wagon') return { id: entity.travel && entity.condition === 'sound' ? 'wagon-travel' : 'wagon-idle' };
  // Other households expose only broad task. Never infer their private chore/cargo.
  const doing = observed ? '' : entity.chore?.doing || '';
  if (/carrying the crop/.test(doing)) return { id: `${variant}-carry` };
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
