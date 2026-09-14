// How somebody goes, as distinct from where and why.
//
// The owner's complaint was that people moved too fast; the fix for that was the class
// clock, not the settlers (see `docs/evidence/pace.json`). But slowing the clock down is
// what makes this file possible at all: at twenty fictional minutes a second, nobody
// would ever have cared how they travelled, because every journey finished before a
// student could think about it. Once a walk to Gonzales costs a visible part of a lesson,
// how you go becomes a decision, and the three ways a colony family actually had are
// genuinely different from one another.
//
// Three modes, and none of them dominates the others:
//
//   On foot        always available, never blocked, tiring, and carries what two arms can.
//   On the horse   near three times the pace and hardly tiring, but one rider at a time.
//   Ox and wagon   half the pace of walking, hauls four times what a person can, ties up
//                  two pieces of property at once, and does not go over the ford.
//
// The numbers below are invented for the lesson, like every other number in `sim/chores.mjs`,
// and `FIC-GONZ-014` registers them. The *shape* is not invented: a saddle horse really is
// about two and a half times a walking pace and carries little, and an ox team really does
// walk slower than a person and pulls a load no person could.
//
// This module is deliberately free of imports. `sim/world.mjs` owns journeys and
// `sim/chores.mjs` owns work, and both need to agree about what a mode is; if either of
// them owned the table the other would have to import it, and `chores.mjs` is already
// handed `beginTravel` as a parameter precisely to keep that arrow from existing.

// A mile per twenty-minute tick is three miles an hour. Every speed here is relative to it.
export const WALK_SPEED = 1;
// A horse at a steady road pace: about seven and a half miles an hour.
export const RIDER_SPEED = 2.6;
// An ox team hauling a loaded wagon: not quite two miles an hour. Slower than the people
// walking beside it, which is the whole reason taking it is a decision and not a free win.
export const WAGON_SPEED = 0.65;

/**
 * `carry` is in the same abstract units the household's resources are counted in, and it
 * is a cap on what one journey brings home rather than a pack to be filled. A hunt in the
 * timber kills what it kills; what changes is how much of it comes back.
 *
 * `exertion` scales the miles that tire the traveller. Walking counts every one of them.
 * `needs` names household property that must come along, which is what makes the horse
 * and the wagon rivalrous: a family has one of each and four people.
 */
export const MODES = Object.freeze({
  foot: Object.freeze({
    id: 'foot', name: 'On foot', speed: WALK_SPEED, carry: 5, exertion: 1, needs: [], crossesFord: true,
    describe: 'Three miles an hour. Always possible, and it is the legs that pay for it.',
  }),
  horse: Object.freeze({
    id: 'horse', name: 'On the horse', speed: RIDER_SPEED, carry: 7, exertion: .3, needs: ['horse'], crossesFord: true,
    describe: 'Near three times the pace and hardly tiring, but the horse carries little and only one of you can be on it.',
  }),
  wagon: Object.freeze({
    id: 'wagon', name: 'With the ox and wagon', speed: WAGON_SPEED, carry: 20, exertion: .5, needs: ['ox', 'wagon'], crossesFord: false,
    describe: 'Slower than walking, and it brings home four times what a person can carry. The ford is no place for it.',
  }),
});
export const DEFAULT_MODE = 'foot';
export const MODE_IDS = Object.keys(MODES);

/**
 * The mode a journey is being made in.
 *
 * A class saved before there was any choice has no `mode` on its travel records, and the
 * correct empty value is the one everybody had then: on foot. That is why no save version
 * moved for this - `sim/trade.mjs` is the worked example of the same judgement.
 */
export const modeOf = travel => MODES[travel?.mode] || MODES[DEFAULT_MODE];

/**
 * Going over ground that is not level open road (sim/ground.mjs): `pace` lists `[segment, factor]` for each segment of the
 * journey's points that takes `factor` times as long as open road. A journey with none - every road, every journey on the
 * invented map and in every class saved before - moves exactly as it always did.
 *
 * `budget` is the ground this tick is worth on open road (speed × ticks). Returns where the traveller has got to and what
 * of the budget was left over past the end.
 */
export function moveOnGround(points, pace, distance, progress, budget) {
  // Open road all the way: the arithmetic every journey had before, to the last bit.
  if (!pace?.length) return { progress: Math.min(distance, progress + budget), left: Math.max(0, progress + budget - distance) };
  const slow = new Map(pace || []);
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    const end = start + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (progress < end) {
      const factor = slow.get(i - 1) || 1, room = (end - progress) * factor;
      if (budget < room) return { progress: Math.min(distance, progress + budget / factor), left: 0 };
      budget -= room; progress = end;
    }
    start = end;
  }
  return { progress: distance, left: budget };
}

/** What is left of a journey, in miles of open road: what the ticks still to come are spent on. */
export function groundLeft(travel) {
  if (!travel.pace?.length) return travel.distance - travel.progress;
  const slow = new Map(travel.pace);
  let start = 0, left = 0;
  for (let i = 1; i < travel.points.length; i++) {
    const end = start + Math.hypot(travel.points[i].x - travel.points[i - 1].x, travel.points[i].y - travel.points[i - 1].y);
    if (travel.progress < end) left += (end - Math.max(start, travel.progress)) * (slow.get(i - 1) || 1);
    start = end;
  }
  return left;
}

/** What this person can bring home from where they are, given how they got there. */
export const carryCapacity = mode => (MODES[mode] || MODES[DEFAULT_MODE]).carry;

/**
 * The entity id of a piece of a household's property, by the part it plays.
 *
 * The ox has been `${householdId}-animal` since the world was first built and there is no
 * reason to rename it and break every save; the horse arrived later and is `-horse`. The
 * mapping lives here so no other file has to know that.
 */
const PROPERTY_IDS = { ox: 'animal', horse: 'horse', wagon: 'wagon' };
export const propertyId = (householdId, role) => `${householdId}-${PROPERTY_IDS[role] || role}`;
