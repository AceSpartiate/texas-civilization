// Somebody travelling faster than a student can follow is away on the road, not a figure skating over the map.
//
// Owner, 2026-09-21, after a class played it on Chromebooks: "students saw characters moving too fast. i thought we were
// going to use fog of war for that? if they're moving too fast then players shouldn't be able to follow them until they
// arrive."
//
// Two earlier answers to the same complaint are still in the project and are not enough on their own:
//   - 2026-09-17, `outOfSight` in public/map-base.js: the long *middle* of a fast journey was not drawn, but the first and
//     last two and a half miles still were - and at four or twelve hours a tick a single tick is longer than that window,
//     so what a student actually saw was the figure appear, jump the whole window in one step, and vanish. The page also
//     decided it for itself, from a position the server had already sent: a client-side fudge, against VISION.md §4.
//   - 2026-09-18, the marker in public/motion.js: past `MARKER_ABOVE` drawn heights a second a traveller is a token on a
//     dotted route instead of a running figure. That is right, and it stays; it is about how *close the camera is*, and it
//     cannot help when the ground itself runs out - a token that crosses the country in four ticks is no more followable
//     than a skating man.
//
// So the rule moves to the server, where what a family may see has always been decided, and it covers the whole journey
// rather than its middle. `FIC-GONZ-230`, `FIC-GONZ-231`; docs/MAP_ACCURACY.md §12.
import { calendarMinutes, dateOf } from './clock.mjs';
import { groundLeft, ridesAllHours, roadHours, roadTicks } from './travel.mjs';

/** How many farming ticks' worth of road the next tick carries this traveller (sim/travel.mjs `roadTicks`). */
export const roadTicksFor = (world, entity) => roadTicks(calendarMinutes(world), ridesAllHours(entity), roadHours(entity.travel));
/** Miles the next tick carries this traveller over open road: what the server says a tick is worth, projected for the page. */
export const milesATick = (world, entity) => entity.travel ? entity.travel.speed * roadTicksFor(world, entity) : 0;

/**
 * Miles of ground one tick may carry a traveller and still be worth watching.
 *
 * The measure is **how far the figure would jump**, not what the clock says: the miles the next tick carries *this*
 * traveller, which is their pace times the calendar (sim/world.mjs `milesATick`). A walk across a field at twenty minutes
 * a tick is a mile and stays drawn; the same walk at twelve hours a tick is ten and a half and does not. The phase is
 * never asked.
 *
 * Three miles, for a reason already measured on this page rather than guessed at. `ROAD_WINDOW_MILES` (sim/overview.mjs)
 * is three because it is the stretch of road that has to ride along beside a traveller for the page to draw them
 * *sliding* along it between two ticks, and it was set at three because "nobody goes further than a rider's 7.8 miles an
 * hour times a twenty-minute tick (2.6 miles)". Its own `ceiling:` names exactly today's bug: "a traveller put further
 * along than this in one step is drawn jumping to where they are rather than sliding there." So three miles a tick is the
 * line at which this project's own drawing stops being a walk and becomes a jump, and it is the line drawn here.
 *
 * What it lets through, at the four calendars of sim/clock.mjs (speeds from sim/travel.mjs):
 *   - the farming day, twenty minutes a tick: everybody. A walk is 1 mile, the family's horse 1.67, the ox wagon 0.65,
 *     a courier riding all hours 2.6. The hunt's walk out, the wagon's arrival, a ride to Gonzales and a rider coming up
 *     to the door are all watched from end to end, exactly as they were.
 *   - the news, an hour a tick: a walk (3 miles, at the line and not over it) and the wagon (1.95). Not the horse (5) and
 *     not a courier (7.8).
 *   - the gathering, four hours: the ox wagon only (2.275).
 *   - the campaign, twelve hours: nothing on its own feet (a walk is 10.5).
 *
 * ceiling: one number for people, riders, beasts and the wagon. It is a fact about the drawing, not about the traveller,
 * so one number is right until something is drawn at a different scale from everything else.
 */
export const WATCHABLE_MILES_A_TICK = 3;

/**
 * Whether this journey is too fast to follow: the traveller is away, and the page is never handed a point on the road.
 *
 * `milesATick` is what the server says the next tick carries them (sim/world.mjs). Somebody who is not moving is never
 * away, however fast the calendar runs - a rider reined in to speak (`halted`) is standing in front of somebody, and
 * somebody held at a ford while the water is up (`waitUntil`, sim/world.mjs `wadeAt`) is sitting on the bank, sometimes
 * for days. Both are things a student should watch, and neither jumps anywhere.
 */
export function tooFastToFollow(travel, milesATick, minute = 0) {
  if (!travel) return false;
  if (travel.halted) return false;
  if (travel.waitUntil && minute < travel.waitUntil) return false;
  return milesATick > WATCHABLE_MILES_A_TICK;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COUNT = ['no', 'an', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/**
 * Roughly when somebody away will be back, in the family's own terms: hours while it is today's business, a date once it
 * is not. Never a minute and never a clock face - a family in 1835 knew "before dark" and "about the fourth", and the
 * arrival is an estimate anyway (a shut ford can hold it a day, sim/world.mjs `wadeAt`).
 */
export function backWords(world, minute, minutesLeft) {
  const hours = minutesLeft / 60;
  if (hours <= 1) return 'there within the hour';
  // An hour and a quarter rounds to one, and "about an hours" is not a sentence.
  if (hours < 1.5) return 'there in about an hour';
  if (hours < 12) { const count = Math.round(hours); return `there in about ${COUNT[count] || count} hours`; }
  const at = dateOf(world, minute + minutesLeft);
  return `there about ${MONTHS[at.getUTCMonth()]} ${at.getUTCDate()}`;
}

/**
 * What a family is told of one of its own people who is away: where they were going, how far is left, and roughly when
 * they get there. Not where they are - that is the whole point - and so no point on the road, no progress and no pace
 * ever reaches the page for them.
 *
 * `minutes` is how many minutes of 1835 a tick stands for now (sim/clock.mjs `calendarMinutes`); `milesATick` how far one
 * carries this traveller. The arrival is counted in whole ticks, as sim/time.mjs counts it for the Host's timeline, so
 * the words and the Host's own list of what is coming cannot drift apart.
 */
export function awayProjection(world, travel, { milesATick, minutes }) {
  const left = Math.max(0, groundLeft(travel));
  const ticks = milesATick > 0 ? Math.ceil(left / milesATick) : 0;
  const minutesLeft = ticks * minutes;
  return {
    away: true,
    miles: Math.max(1, Math.round(left)),
    due: world.minute + minutesLeft,
    back: backWords(world, world.minute, minutesLeft),
  };
}
