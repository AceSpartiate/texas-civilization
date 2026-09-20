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
//   On the horse   two-thirds as fast again and hardly tiring, but one rider at a time.
//   Ox and wagon   slower than walking, hauls four times what a person can, ties up
//                  two pieces of property at once, and does not go over the ford.
//
// The paces are the period's own (`HIST-TEX-093`): a man walks about three miles an hour, a
// saddle horse walks near four and trots near eight, an ox team makes about two, and a day on
// the road was twelve to twenty miles with a wagon and eighteen to twenty-five on foot. What
// is rounded or chosen from those - the family's horse at five, the seven hours of going in a
// day - is `FIC-GONZ-059`, and the loads and the ford are `FIC-GONZ-014`.
//
// Owner, 2026-09-18, playtesting: "when i sent my main character to gonzales on foot he ran
// inhumanly fast." Two things were wrong. The family horse went at a courier's trot, and in the
// long ticks of the gathering and the campaign (sim/clock.mjs) everybody went at their hourly
// pace for all twenty-four hours of every day: seventy-two miles a day on foot, a hundred and
// eighty-seven on the horse. `roadTicks` below is the fix for the second.
//
// This module is deliberately free of imports. `sim/world.mjs` owns journeys and
// `sim/chores.mjs` owns work, and both need to agree about what a mode is; if either of
// them owned the table the other would have to import it, and `chores.mjs` is already
// handed `beginTravel` as a parameter precisely to keep that arrow from existing.

// A mile per twenty-minute tick is three miles an hour. Every speed here is relative to it:
// miles a tick of the farming clock, which is what `travel.speed` stores.
export const WALK_SPEED = 1;
// The family's horse on an errand: five miles an hour, a walk with spells of trot (`FIC-GONZ-059`;
// the cavalry's walk is three and three-quarters and its trot seven and a half, `HIST-TEX-093`).
// It was 2.6, a courier's trot kept up for every mile, which is not how anybody rode their own
// horse to town and back.
export const HORSE_SPEED = 5 / 3;
// A courier or an express carrying word (sim/world.mjs `relayReport`, sim/expresses.mjs): a hard
// trot, about seven and a half miles an hour, kept up night and day (`ridesAllHours`). Martin rode
// the seventy miles from the Alamo to Gonzales through the night (`HIST-TEX-093`). The expresses'
// waits are calibrated against this pace to land on `HIST-TEX-006`'s dates, so it does not move.
export const RIDER_SPEED = 2.6;
// An ox team hauling a loaded wagon: not quite two miles an hour. Slower than the people
// walking beside it, which is the whole reason taking it is a decision and not a free win.
export const WAGON_SPEED = 0.65;
/** Minutes of 1835 in a tick of the farming clock (sim/clock.mjs `TICK_MINUTES`), which every speed is measured against. */
export const FARMING_TICK_MINUTES = 20;
/**
 * Hours of actual going in a day on the road (`FIC-GONZ-059`). The emigrant trains rolled at seven,
 * nooned an hour and circled at six, and made twelve to fifteen miles (`HIST-TEX-093`): at the ox's
 * two miles an hour that is about seven hours of wheels turning. Seven hours makes the day's road
 * 21 miles on foot, 35 on the horse and 13.7 with the wagon.
 */
export const ROAD_HOURS_A_DAY = 7;
/**
 * Hours of going in a day of Houston's march east (`FIC-GONZ-064`; owner, 2026-09-19, by multiple choice: a forced march).
 * Houston: "a forced march of fifty-five miles" to opposite Harrisburg (`HIST-TEX-088`), made from the fork on the 16th
 * to the evening of the 18th. Ten hours is thirty miles a day on foot: the army keeps its dated camps where a family's
 * seven would put it at Harrisburg two days late.
 */
export const FORCED_MARCH_HOURS = 10;
/**
 * The longest tick that is still watched hour by hour: up to an hour of the calendar a tick, the
 * traveller moves at their pace for the whole of it. The farming day and the news are ticks like
 * this, and the moments dated inside them - the march upriver in the night, a man walking two
 * miles into town - are an hour's walking, not a share of a day's.
 *
 * ceiling: at these ticks nobody stops for the night, so a man sent forty miles through the news
 * walks it in thirteen hours; tiredness (`TIRING_MILES`, sim/routines.mjs) is all that costs him.
 * The long journeys of the news are made by riders with word, who did ride through the night. A
 * journey that camps after a day's going would need its own day on the travel record.
 */
export const WATCHED_TICK_MINUTES = 60;
/** Somebody carrying word rides all hours: a courier, a relayed report, an express. Everybody else keeps a day on the road. */
export const ridesAllHours = entity => Boolean(entity?.courier || entity?.report || entity?.express);
/**
 * How many farming ticks' worth of road one tick of `calendar` minutes carries.
 *
 * A tick of an hour or less carries its own minutes at the traveller's pace. A longer tick - four
 * hours in the gathering, twelve in the campaign - carries its share of a day on the road: seven
 * hours of going in every twenty-four, spread evenly through the day as `ARMY_MILES_PER_HOUR`
 * (sim/army.mjs) spreads the army's march, so a traveller moves steadily from tick to tick rather
 * than all day and then not at all. Before this a long tick carried every one of its hours at the
 * pace, and a walker made seventy-two miles a day.
 */
export function roadTicks(calendar, allHours = false, hours = ROAD_HOURS_A_DAY) {
  if (allHours || calendar <= WATCHED_TICK_MINUTES) return calendar / FARMING_TICK_MINUTES;
  return (calendar / 1440) * hours * 60 / FARMING_TICK_MINUTES;
}
/** Miles an hour and miles a day on the road for a stored `speed` (miles a farming tick): what the tests and the docs quote. */
export const milesAnHour = speed => speed * 60 / FARMING_TICK_MINUTES;
export const milesADay = (speed, allHours = false, hours = ROAD_HOURS_A_DAY) => speed * roadTicks(1440, allHours, hours);
/** A traveller's hours of going in a day: a forced march's, or an ordinary day on the road. */
export const roadHours = travel => travel?.forced ? FORCED_MARCH_HOURS : ROAD_HOURS_A_DAY;

/**
 * `carry` is in the same abstract units the household's resources are counted in, and it
 * is a cap on what one journey brings home rather than a pack to be filled. A hunt in the
 * timber kills what it kills; what changes is how much of it comes back.
 *
 * `exertion` scales the miles that tire the traveller. Walking counts every one of them.
 * `needs` names household property that must come along, which is what makes the horse
 * and the wagon rivalrous: a family has one of each and four people.
 */
/**
 * The wait at a ferry, in minutes (`FIC-GONZ-092`): the boat fetched from the far bank and loaded, the one load at a time a
 * flatboat on a rope took (`HIST-TEX-140`). Nothing read gives an ordinary crossing's time; the record has the ferryman bound
 * to cross anybody from sunrise to ten at night, and the waits of April 1836 in days, which are the flight's own
 * (sim/scrape.mjs `CROSSING_HOURS`). ceiling: the same hour by day and by night.
 *
 * ceiling: no ferriage is charged. The rates of 1831 are documented (`HIST-TEX-140`) - half a real on foot, a real on the
 * horse, eight reales for a loaded wagon - and money is half of the ending (docs/MONEY_AND_GLORY.md); the owner chose (2026-09-19)
 * to leave the ferries free. Charging them would take the coin here, as the wait is taken.
 */
export const FERRY_MINUTES = 60;
/** The ferry's wait as miles of this way of going: the same hour whoever waits, laid on the road as going (sim/ways.mjs). */
export const ferryMiles = modeId => FERRY_MINUTES / FARMING_TICK_MINUTES * (MODES[modeId] || MODES[DEFAULT_MODE]).speed;
/**
 * The wade at a ford, in minutes (`FIC-GONZ-094`). Owner, 2026-09-19, by multiple choice: fording should cost "a wade that
 * can go wrong", and high water should cost more. A ford was a place the road came down to water shallow enough to walk a
 * team through, not a free stretch of road: people took their shoes off, carried what would spoil above the water, and led
 * the stock over one at a time. Nothing read times an ordinary crossing, so these are the game's own, set against the
 * ferry's hour: a river's ford a third of it, a creek's a twelfth.
 *
 * The ox and wagon pay double - the load is the thing that has to be got across dry - and a rider three quarters, because
 * the horse does the wading. What a class is planning for is this ordinary wade; the river being up is what meets them on
 * the road (`HIGH_WATER_TIMES`, sim/world.mjs).
 */
export const FORD_MINUTES = Object.freeze({ river: 20, creek: 5 });
const FORD_SHARE = Object.freeze({ foot: 1, horse: 0.75, wagon: 2 });
/** The wade at one ford for this way of going, in minutes: longer with the wagon, shorter on the horse. */
export const fordMinutes = (modeId, waterKind) => Math.round((waterKind === 'creek' ? FORD_MINUTES.creek : FORD_MINUTES.river) * (FORD_SHARE[modeId] ?? 1));
/** The wade as miles of this way of going, laid on the road as going (sim/ways.mjs), as the ferry's wait is. */
export const fordMiles = (modeId, waterKind) => fordMinutes(modeId, waterKind) / FARMING_TICK_MINUTES * (MODES[modeId] || MODES[DEFAULT_MODE]).speed;
/**
 * A ford with the water up: the wade takes this many times as long, and at `WADE_WRONG_SHARE` of them it goes wrong (the
 * traveller is carried off their feet, or the team baulks and the load has to come off and be brought over a piece at a
 * time). The water is up on a day it rains (sim/road.mjs `rainyDay`, `FIC-GONZ-049`) - the spring of 1836 was "unusually
 * wet and the rivers swollen" (`HIST-TEX-068`) - and the rest is the game's own (`FIC-GONZ-094`).
 */
export const HIGH_WATER_TIMES = 3, WADE_WRONG_SHARE = 0.25, WADE_WRONG_MINUTES = 60;
/** What every way of going is told of the ferries and the fords, on the control (`describe`). */
const FERRY_WORDS = 'Over a ferry, an hour waiting for the boat; over a ford, a wade, and longer when the water is up.';

export const MODES = Object.freeze({
  foot: Object.freeze({
    id: 'foot', name: 'On foot', speed: WALK_SPEED, carry: 5, exertion: 1, needs: [], crossesFord: true,
    describe: `Three miles an hour, about twenty miles in a day. Always possible, and it is the legs that pay for it. ${FERRY_WORDS}`,
  }),
  horse: Object.freeze({
    id: 'horse', name: 'On the horse', speed: HORSE_SPEED, carry: 7, exertion: .3, needs: ['horse'], crossesFord: true,
    describe: `Five miles an hour, thirty-five in a day, and hardly tiring, but the horse carries little and only one of you can be on it. ${FERRY_WORDS}`,
  }),
  wagon: Object.freeze({
    id: 'wagon', name: 'With the ox and wagon', speed: WAGON_SPEED, carry: 20, exertion: .5, needs: ['ox', 'wagon'], crossesFord: false,
    describe: `Two miles an hour and a dozen or so in a day, slower than walking, and it brings home four times what a person can carry. The ford at Gonzales is no place for it. ${FERRY_WORDS}`,
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
