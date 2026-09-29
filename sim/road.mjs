// The road east: what a family does besides run, and what runs behind it (owner, 2026-09-16, docs/ROAD_EAST.md).
//
// "Players that are running during the Runaway Scrape, they need things to do besides just running. Wasn't it wet? Wagon
// could get stuck and they'd need to free it. Hunt for food while at camp? Various things. The Mexican army should be close
// enough that if players spend too much time in one place that they could be caught. Historically accurate consequences."
//
// The record (docs/battle-research/goliad-scrape-san-jacinto.md, `HIST-TEX-068` to `-074`): the spring of 1836 was
// unusually cold and wet and the rivers were swollen and impassable; Dilue Rose Harris's family left home hauling its
// things on a sleigh behind one yoke of oxen, the mother and the girl walking, and on the prairie a wagon bogged, four carts
// stuck fast behind it, all the oxen together could not move it, and the wagons "had to be unloaded and pulled out"; five
// thousand people waited three days at Lynch's ferry; families ate cold corn bread and cold boiled beef and bread grew
// scarce; measles and whooping cough broke out at the Trinity, a sister died and was buried at Liberty, and the mother
// nursed the sick until she had to rest; Santa Anna's column took the ferry and the ferryman at Thompson's on April 12, the
// printers at Harrisburg on the 14th, the servants, residents and workmen at New Washington on the 16th, and a boy of
// thirteen who would not give up his horse; families hid in the cane-brake without anything to eat, and came home to
// houses torn up and everything destroyed. Nothing in the record read here has the Mexican army killing a family it
// overtook on the road, so nothing here does.
//
// What this module invents (`FIC-GONZ-049` to `-052`): which days it rains, the share of rain days a wagon bogs, the hours
// it takes to dig out and what it costs the ox and the diggers, that a family may leave its wagon and go on on foot, a hunt
// from the camp with the family halted, a real for two food among the families camped at a crossing or a refuge, a day of
// nursing that keeps the sick alive and mends them sooner, and the pursuit: each Mexican column as a head moving between
// the record's dated places (sim/advance.mjs since 2026-09-26), a warning when one is within `WARNING_MILES`, and a family overtaken when it sits
// within `OVERTAKEN_MILES` of one - robbed of its wagon, its animals and its goods, its grown men taken prisoner at a share,
// the rest let go to walk on with nothing.
//
// The chores here register themselves into the one table (`registerChores`); the flight's state stays on
// `household.flight` (sim/scrape.mjs), and every field this module adds to it is absent until it happens, so no saved class
// changes and no save version moves.
import { CHORES, COIN, abandonChore, reales, registerChores } from './chores.mjs';
import { dateOf } from './clock.mjs';
import { REGIONS, WATER_SHUT, rainingAt, waterAt, weatherAt, weatherOn } from './weather.mjs';
import { record } from './events.mjs';
import { familyAnsweredFor, recordLapse } from './lapse.mjs';
import { canAnswerCalls, householdName, mainPersonId, tooYoung } from './family.mjs';
// Who is with the family and answers for it (sim/acting.mjs, 2026-09-28): the road's questions are theirs.
import { actingId } from './acting.mjs';
import { WAGON_SPEED, WALK_SPEED, propertyId } from './travel.mjs';
import { beastsOf } from './beasts.mjs';
import { findWay } from './ways.mjs';
import { CARRIED_ROOM, FLIGHT_SPACE, REFUGES, share } from './scrape.mjs';
import { spotlight } from './host.mjs';
import { awardGlory } from './glory.mjs';
import { COLUMNS, ORDER_GRACE_MINUTES, ROAD_DETOUR, clockOf, columnLeg as advanceLeg, headAt } from './advance.mjs';
// The children's bundles and the lookout on the road behind (sim/flight-work.mjs, docs/CHILDREN.md §7).
import { bundleRoom, cowPace, lookoutMiles, lookoutOf, loseCow } from './flight-work.mjs';
// The soldiers who can see a family, the order to halt and the chase (sim/pursuit.mjs, owner 2026-09-27), and the family's own
// route (sim/flight-route.mjs): a cycle through these, safe because each side uses the other only inside functions.
import { advancePursuit, altoOptions, altoText, answerAlto, chaseProjection, runRefusal, sightMiles, strippedBy } from './pursuit.mjs';
import { flightPlaces, routeProjection } from './flight-route.mjs';
import { limitLeft, limitOut, roadLimitKey, roadOnLimit } from './decision-budget.mjs';
import { campedApart } from './disease.mjs';

const DAY = 1440;
const round = value => Math.round(value * 100) / 100;

/**
 * Rain: the share of days it rains on the road. Kept for a class saved before 2026-09-20 to read, and for nothing else: the
 * weather is `sim/weather.mjs` now, where the share is the month's and the country's (`FIC-GONZ-132`) and the rivers carry
 * a water level that remembers the days before (`FIC-GONZ-133`). The one-day-in-two here stood in for the wet spring
 * (`HIST-TEX-068`) and was two to three times any measured frequency, for every month of the year.
 */
export const RAIN_SHARE = 0.5;
/**
 * And the share of days it rains the rest of the year (`FIC-GONZ-094`, 2026-09-19). Half of all days is the spring of 1836,
 * which the record calls unusually wet and which is what the road east was measured against; the autumn the class opens in
 * was not that, and a ford reads the weather on every crossing now, which the wagon's bogging never did. Nothing read gives
 * a rain count for those months, so one day in five is the game's own.
 */
export const RAIN_SHARE_ORDINARY = 0.2;
/** The months the record calls wet: March and April of 1836, the Runaway Scrape's own weather. */
const WET_MONTHS = [2, 3];
/** On a rain day a family moving with its wagon bogs at this share, rolled once a day. */
export const BOG_SHARE = 0.5;
/** Unloading and digging the wagon out takes this long, in hours of 1836. */
export const DIG_HOURS = 8;
/** Digging out wears everybody grown who digs by this much road (sim/routines.mjs `TIRING_MILES` is 20). */
export const DIG_MILES = 8;
/** After a dig-out the ox is spent: the wagon goes at this share of its pace for `OX_SPENT_HOURS`, and a second dig-out takes twice the hours. */
export const OX_SPENT_HOURS = 24, SPENT_PACE = 0.5;
/**
 * A road question waits this many ticks for a family nobody is reading before it is answered as auto answers. A played family
 * at its screen has **ninety real seconds** instead (owner, 2026-09-29, "Real-time limits"; sim/decision-budget.mjs
 * `QUESTION_BUDGETS.road`, `roadOnLimit`), the same at every pace, and then it lapses (`lapseRoad`); the calendar holds for it.
 */
export const ROAD_PATIENCE_TICKS = 12;
/** A column within this many miles is a warning; within `OVERTAKEN_MILES` it has come up with a family that is not moving. */
export const WARNING_MILES = 20, OVERTAKEN_MILES = 5;
/** A family moving on the road is only overtaken when a column is on top of it. */
export const CLOSE_MILES = 1.5;
/** Grown men of an overtaken family are taken prisoner at this share (`HIST-TEX-073`: men, workmen and a boy taken; no count). */
export const PRISONER_SHARE = 0.5;
/** Among the families camped at a crossing or a refuge, a real buys this much food: dear, because bread was scarce on the road. */
export const CAMP_FOOD_PER_REAL = 2;
/** The food a hunt from the camp brings in when the shot goes home, before skill. */
export const CAMP_HUNT_FOOD = 6;
/**
 * What a line in the river brings back at a crossing or a refuge: less than the same two hours bring at the family's own
 * creek (three, sim/gathering.mjs), because five thousand people are camped on the same bank (`HIST-TEX-238`).
 */
export const ROAD_FISH_FOOD = 2;

/** A count of miles in words: "1 mile", "17 miles" (it read "1 miles an hour" and "about 1 miles off", 2026-09-28). */
export const milesWord = miles => `${miles} ${miles === 1 ? 'mile' : 'miles'}`;
/** How far off something is, rounded as the road says it: "about 17 miles", "about 1 mile", and under half a mile "less than a mile". */
export function aboutMiles(miles) {
  const whole = Math.round(miles);
  return whole < 1 ? 'less than a mile' : `about ${milesWord(whole)}`;
}

/**
 * The Mexican columns as the refugees felt them. Since 2026-09-26 each is a body of men on its dated road with a commander,
 * its camps and its crossings (sim/advance.mjs `COLUMNS`, docs/battle-research/mexican-advance.md), marching along the map's
 * roads (owner, 2026-09-17: "Game's roads, same dates") at whatever pace brings it in on the record's date. Before its first
 * date a column is not in the country; after its last it stands where it stopped, except Santa Anna's, which ends at San
 * Jacinto on the afternoon of April 21 (`HIST-TEX-067`), and Cos's, which the battle draws coming in over Vince's bridge.
 * The dates are the record's timeline, read against the class's own clock (`clockOf`).
 */
export const columns = () => COLUMNS;
export { ROAD_DETOUR };
/** The line a column's head follows from one dated stop to the next on this world's map (sim/advance.mjs `columnLeg`). */
export const columnLeg = (world, a, b) => advanceLeg(world.map, a, b);

/** Where a column's head stands at this minute of the class's clock, and the place it is making for: null before it enters the country. */
export function columnHead(world, column, minute) {
  const head = headAt(world.map, column, minute - clockOf(world));
  return head && { x: head.x, y: head.y, toward: head.toward, towardName: head.towardName, ...(head.retreat && { retreat: true }) };
}

/**
 * The nearest column to a point right now: its name, how far, and the place it is making for. Null when none is in the
 * country. Given a column's id, that column's, whether or not another is nearer.
 */
export function pursuit(world, point, onlyId = null) {
  if (!point || !world.map?.sites?.gonzales) return null;
  let nearest = null;
  for (const column of columns()) {
    if (onlyId && column.id !== onlyId) continue;
    const head = columnHead(world, column, world.minute);
    // A column going back after San Jacinto is hunting nobody (sim/advance.mjs, the retreat).
    if (!head || head.retreat) continue;
    const miles = Math.hypot(head.x - point.x, head.y - point.y);
    if (!nearest || miles < nearest.miles) nearest = { id: column.id, name: column.name, miles: round(miles), toward: head.toward, towardName: head.towardName };
  }
  return nearest;
}

/**
 * Whether it rains on this day of the calendar: the class's own weather, the same for every family in it.
 *
 * The day is mixed before it is hashed (2026-09-19). `share` is FNV-1a, and over keys that differ by one digit it runs in
 * streaks: one class had twenty rainy days together and another none in its first twenty, at a share meant to be one day in
 * two. It was hard to see while only the wagon's bogging read it; a ford in high water reads it on every crossing.
 */
/** Whether rain is falling on this family where it stands (sim/weather.mjs), which is what bogs a wagon. */
const wetWhere = (world, household, day) => { const where = standsAt(world, household); return where ? rainingAt(world, where, day) : false; };
const raining = one => one.kind === 'rain' || one.kind === 'storm' || (one.kind === 'norther' && one.wet);
export const rainyDay = (world, day) => REGIONS.some(region => raining(weatherOn(world, day).regions[region]));
export const dayOf = minute => Math.floor(minute / DAY);
/** What the day is where this family stands: its own country's weather (sim/weather.mjs), not the whole map's. */
export const weatherOf = (world, household) => {
  const where = household && standsAt(world, household);
  return where ? weatherAt(world, where).kind : weatherOn(world).regions.centre.kind;
};
/** Where a family is, for the weather: whoever of it is on the road, else its own home. */
function standsAt(world, household) {
  const leader = people(world, household).find(person => person.travel) || people(world, household)[0];
  if (leader?.location && Number.isFinite(leader.location.x)) return leader.location;
  return world.map.sites[household.homeSiteId] || null;
}

const GONE = ['dead', 'captured'];
const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one && !GONE.includes(one.health?.condition));
// Every animal and the wagon the family owns: the ones it always had, and any bought in town (sim/beasts.mjs).
const beasts = (world, household) => ['horse', 'ox', 'wagon'].flatMap(role => beastsOf(world, household, role));
/** The family's people who are with it on the road or at the refuge, and the beasts likewise. */
export function withFamily(world, household) {
  const flight = household.flight;
  // A man serving with the army is never with his family, even camped at the same place: Lynchburg and San Felipe are both
  // refuges and Houston's camps, and a serving man at Lynchburg was taken prisoner with his refugee family by Santa Anna's
  // column the day before the battle (docs/battle-research/staging.md §8.6 e, `FIC-GONZ-442`).
  const there = one => one.service?.status !== 'serving' && (flight?.status === 'fled' ? one.travel?.purpose === 'flee' : flight?.status === 'refuged' ? (!one.travel && one.location?.siteId === flight.refuge) : false);
  return { people: people(world, household).filter(there), beasts: beasts(world, household).filter(beast => there(beast) && !['taken', 'lost', 'dead'].includes(beast.condition)) };
}
/** Where the family stands: the leader's point on the road, or the refuge. */
export function familyPoint(world, household) {
  const flight = household.flight;
  if (flight?.status === 'refuged') return world.map.sites[flight.refuge] || null;
  const leader = withFamily(world, household).people[0];
  return leader?.location || null;
}
const wagonWith = (world, household) => { const { beasts: with_ } = withFamily(world, household); return ['wagon', 'ox'].every(kind => with_.some(beast => beast.kind === kind || beast.species === kind)); };
const oxSpent = household => Number.isFinite(household.flight?.oxSpentUntil);
/** Digging out takes `DIG_HOURS`, twice that with an ox already spent from the last time. */
export const digHours = household => oxSpent(household) ? DIG_HOURS * 2 : DIG_HOURS;
const camping = (world, household) => people(world, household).some(one => one.chore && CHORES[one.chore.id]?.road && CHORES[one.chore.id]?.halts);
const tell = (world, household, text, extra = {}) => record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-049', text, ...extra });

// ------------------------------------------------------------------------------------------------ the road's questions

/**
 * The road's questions, put to the family on its main person's card in the shape every question here takes: options with
 * their prices on them, what is open decided live, silence decided by the fallback in order (sim/chores.mjs `ASKS`).
 */
export const ROAD_ASKS = {
  bog: {
    text: (world, household) => `The wagon is fast in the mud${['rain', 'storm'].includes(weatherOf(world, household)) ? ', and it is still raining' : ''}. The ox cannot pull it out alone.`,
    fallback: ['dig', 'wait', 'abandon'],
    options: (world, household) => [
      { id: 'dig', label: 'Unload and dig it out', note: `${digHours(household)} hours${oxSpent(household) ? ', with the ox already spent' : ''}. Everybody grown is worn by it, and the ox is spent and goes at half pace for a day after.` },
      { id: 'wait', label: 'Wait for the ground to dry', note: 'Nothing spent. The family sits where it is until a dry day, and the Mexican army does not wait.' },
      { id: 'abandon', label: 'Leave the wagon and go on on foot', note: `The wagon and the ox stay in the mud. The family carries ${carriedRoom(world, household)} room’s worth (food first) and the rest is lost; on foot it goes faster.` },
    ],
    requires: {},
  },
  danger: {
    text: (world, household) => { const near = household.flight?.danger; return `${near?.name || 'The Mexican army'} is ${aboutMiles(near?.miles ?? 0)} off, making for ${near?.towardName || 'the east'}. A family that sits still may be caught.`; },
    fallback: ['press-on', 'stay', 'abandon'],
    options: (world, household) => {
      const flight = household.flight, options = [];
      const camp = camping(world, household);
      if (flight.status === 'refuged') {
        const next = nextRefuge(world, household);
        options.push(next ? { id: 'press-on', label: `Go on east to ${next.name}`, note: `About ${milesWord(next.miles)}. The family sets out the moment it is pressed${wagonWith(world, household) ? ', with the wagon' : ', on foot'}.` } : { id: 'press-on', label: 'Go on east', note: 'There is no refuge further east on the map from here.' });
      } else if (camp) options.push({ id: 'press-on', label: 'Break camp and press on', note: 'The hunt or the nursing is left off where it stands, and the family moves the next tick.' });
      else if (flight.crossing) options.push({ id: 'press-on', label: 'Get over the moment the turn comes, and go on', note: 'The wait is the wait; the family goes the moment it is over.' });
      else options.push({ id: 'press-on', label: 'Press on as we are', note: 'The wagon keeps its pace. A family on the move is not caught unless the army is on top of it.' });
      options.push({ id: 'stay', label: 'Stay as we are, and take the risk', note: flight.status === 'refuged' ? 'The family keeps its camp. If the army comes it takes the wagon, the animals and the goods, and may take the men.' : 'Whatever the family is doing goes on. If the army comes it takes the wagon, the animals and the goods, and may take the men.' });
      if (wagonWith(world, household)) options.push({ id: 'abandon', label: 'Leave the wagon and go on on foot', note: `The wagon and the ox stay where they are${flight.crossing ? '; on foot the family fords at once' : ''}. The family carries ${carriedRoom(world, household)} room’s worth (food first) and the rest is lost; on foot it goes faster.` });
      return options;
    },
    requires: {
      'press-on': { test: (world, household) => household.flight.status !== 'refuged' || Boolean(nextRefuge(world, household)), why: 'There is no refuge further east on the map from here.' },
    },
  },
  // Mexican troops close enough to call on the family to halt (sim/pursuit.mjs, owner 2026-09-27): halt and be taken, or run
  // and be fired on. Silence halts, as the soldiers ordered (after thirty real seconds with the chase held, sim/decision-budget.mjs
  // `QUESTION_BUDGETS.alto`), and an automatic family halts at once.
  alto: {
    text: altoText,
    fallback: ['halt'],
    options: altoOptions,
    requires: {
      run: { test: (world, household) => !runRefusal(world, household), why: 'The family cannot run as it is.' },
      'abandon-run': { test: (world, household) => !(household.flight.status === 'refuged' && !nextRefuge(world, household)), why: 'There is no refuge further east to run for.' },
      'timber-run': { test: (world, household) => !household.flight.bog && !(household.flight.crossing && household.flight.mode === 'wagon'), why: 'The family cannot run as it is.' },
    },
  },
};

/** How much the grown people with the family can carry on foot, in the wagon's units of room. */
export function carriedRoom(world, household) {
  const with_ = withFamily(world, household).people;
  // And the bundles the children made up before they left (sim/flight-work.mjs `flee-bundle`).
  return round(with_.filter(canAnswerCalls).length * CARRIED_ROOM + bundleRoom(household, with_));
}
/** The nearest refuge east of where the family camps, or null. */
export function nextRefuge(world, household) {
  const here = world.map.sites[household.flight?.refuge];
  if (!here) return null;
  const further = REFUGES.filter(id => world.map.sites[id] && world.map.sites[id].x > here.x + 2)
    .map(id => ({ id, name: world.map.sites[id].name, miles: Math.round(Math.hypot(world.map.sites[id].x - here.x, world.map.sites[id].y - here.y)) }))
    .filter(one => findWay(world, here.id, one.id, 'foot'))
    .sort((a, b) => a.miles - b.miles);
  return further[0] || null;
}

/** Whether an answer is open to this family now, and why not. */
export function roadAskAvailability(world, household, optionId) {
  const ask = household.flight?.ask;
  if (!ask) return { can: false, why: 'Nobody is waiting on an answer.' };
  const rule = ROAD_ASKS[ask.id]?.requires?.[optionId];
  if (rule && !rule.test(world, household)) return { can: false, why: (ask.id === 'alto' && optionId === 'run' && runRefusal(world, household)) || rule.why };
  return { can: true, why: '' };
}

/** The open question as the family is shown it: the words, the prices, what is open right now. */
export function roadAskProjection(world, household) {
  const ask = household.flight?.ask;
  if (!ask) return null;
  const spec = ROAD_ASKS[ask.id];
  const leftMs = askLeftMs(world, household);
  return { id: ask.id, openedMinute: ask.openedMinute, ...(leftMs !== null && { leftMs }), text: spec.text(world, household), fallback: spec.fallback, options: spec.options(world, household).map(option => ({ ...option, ...roadAskAvailability(world, household, option.id) })) };
}

/** What the family decides when nobody answers for it: the fallback in order, the first that is open (`FIC-GONZ-048`'s rule). */
export function roadAutoAnswer(world, household) {
  const shown = roadAskProjection(world, household);
  if (!shown) return null;
  return shown.fallback.find(id => shown.options.some(option => option.id === id && option.can)) || shown.options.find(option => option.can)?.id || null;
}

function openAsk(world, household, id, text) {
  household.flight.ask = { id, openedMinute: world.minute, openedTick: world.tick };
  record(world, 'pressure', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-049', text: `${text} The family is asked what it will do.` });
}

/** Why this answer is refused, or null. */
export function roadAnswerRefusal(world, household, option) {
  const ask = household.flight?.ask;
  if (!ask) return 'Nobody is waiting on an answer.';
  const spec = ROAD_ASKS[ask.id];
  if (!spec.options(world, household).some(one => one.id === option)) return 'That is not one of the answers.';
  return roadAskAvailability(world, household, option).why || null;
}

/** The family answers the road's question, by hand, by auto, or by silence; what it chose is written down and done. */
export function answerRoad(world, household, option, how = 'answered') {
  const why = roadAnswerRefusal(world, household, option);
  if (why) throw new Error(why);
  const flight = household.flight, ask = flight.ask;
  const chosen = ROAD_ASKS[ask.id].options(world, household).find(one => one.id === option);
  delete flight.ask;
  record(world, 'choice', {
    householdId: household.id, decision: `road-${ask.id}-${option}`, importance: how === 'auto' ? 1 : 2, claimId: 'FIC-GONZ-049',
    text: how === 'silence' ? `Nobody answered for the family. It did what most did: ${chosen.label.toLowerCase()}.`
      : how === 'auto' ? `The family, deciding for itself, chose: ${chosen.label.toLowerCase()}.`
      : `The family will ${chosen.label.toLowerCase()}.`,
  });
  if (ask.id === 'bog') {
    if (option === 'dig') { flight.bog.freeing = { until: world.minute + digHours(household) * 60, hours: digHours(household) }; tell(world, household, 'The wagon is unloaded and everybody grown is at the wheels and the ox.', { importance: 1 }); }
    else if (option === 'wait') { flight.bog.waiting = true; tell(world, household, 'The family waits by the wagon for the ground to dry.', { importance: 1 }); }
    else if (option === 'abandon') abandonWagon(world, household);
  } else if (ask.id === 'danger') {
    if (option === 'press-on') pressOn(world, household);
    else if (option === 'abandon') abandonWagon(world, household);
    else if (option === 'stay') flight.danger.stayed = true;
  } else if (ask.id === 'alto') answerAlto(world, household, option);
  return option;
}

/**
 * Nobody answered the road's question in its time, and it lapses (owner, 2026-09-27: "questions that are not answered fast
 * enough disappear"; sim/lapse.mjs). Nothing new is done. The wagon in the mud stays in the mud until the ground dries, which
 * is what it does with nobody at the wheels (the same state as waiting, though nobody chose to wait); with the army close
 * behind, whatever the family was doing goes on - moving if it was moving, camped if it was camped - and it is not asked again
 * about that column.
 */
export function lapseRoad(world, household) {
  const flight = household.flight, ask = flight?.ask;
  if (!ask) return;
  delete flight.ask;
  if (ask.id === 'bog' && flight.bog) flight.bog.waiting = true;
  recordLapse(world, { householdId: household.id, text: ask.id === 'bog'
    ? 'Nobody answered for the family in time, and the question lapsed. Nothing was done: the wagon stays in the mud where it is until the ground dries.'
    : 'Nobody answered for the family in time, and the question lapsed. Nothing new was done: whatever the family was doing goes on, with the army behind it.' });
}

/** The family presses on: a camp is broken, a refuge left for the next east; a family already moving simply goes on. */
export function pressOn(world, household) {
  const flight = household.flight;
  for (const one of people(world, household)) if (one.chore && CHORES[one.chore.id]?.road) abandonChore(world, household, one);
  if (flight.status === 'refuged') {
    const next = nextRefuge(world, household);
    if (next) moveOn(world, household, next.id);
  }
}

/** From its refuge the family sets out again for one further east, everybody there together, by the wagon when it can. */
export function moveOn(world, household, refuge) {
  const flight = household.flight, at = flight.refuge;
  const { people: goers, beasts: with_ } = withFamily(world, household);
  const mode = ['wagon', 'ox'].every(kind => with_.some(beast => (beast.kind === kind || beast.species === kind) && (!beast.condition || beast.condition === 'sound'))) ? 'wagon' : 'foot';
  // The flight's crossings are its own waits (sim/scrape.mjs), not the ferries' ordinary hour.
  const path = findWay(world, at, refuge, mode, { ferries: false }) || findWay(world, at, refuge, 'foot', { ferries: false });
  if (!goers.length || !path) return false;
  const departure = tell(world, household, `The family broke camp at ${world.map.sites[at].name} and set out east again for ${world.map.sites[refuge].name}${mode === 'wagon' ? ' with the ox and wagon' : ' on foot'}.`);
  const speed = mode === 'wagon' ? WAGON_SPEED : WALK_SPEED;
  for (const entity of [...goers, ...with_]) {
    entity.chore = null;
    entity.travel = { from: at, to: refuge, points: path.points.map(point => ({ ...point })), progress: 0, distance: path.distance, speed, mode, purpose: 'flee', silent: true, causeId: departure, ...(path.pace?.length && { pace: path.pace }) };
    entity.location = { ...path.points[0], siteId: null };
    if (entity.kind === 'person') entity.task = 'travel';
    if (entity.kind === 'wagon') entity.laden = true;
    if (entity.kind !== 'person') entity.borrowedBy = goers[0]?.id || null;
  }
  // The refuge left is a crossing town; it is not waited at again on the way out of it.
  Object.assign(flight, { status: 'fled', refuge, mode, crossed: [at], leftMinute: world.minute });
  delete flight.arrivedMinute; delete flight.danger; delete flight.oxSpentUntil;
  // On foot with the milk cow, at her pace (sim/flight-work.mjs `cowPace`).
  cowPace(world, household);
  return true;
}

/**
 * The wagon and the ox are left where they stand (`HIST-TEX-069`: "We had to leave the sleigh"); what the grown people can
 * carry goes on with them, food first, and the rest is lost. On foot the family fords a river at once.
 */
export function abandonWagon(world, household) {
  const flight = household.flight;
  const { people: goers, beasts: with_ } = withFamily(world, household);
  const room = carriedRoom(world, household);
  const kept = {}; let left = room;
  for (const good of ['food', 'seed', 'cotton', 'powder']) {
    const have = household.resources?.[good] ?? 0;
    const fits = Math.min(have, Math.floor(left / FLIGHT_SPACE[good]));
    kept[good] = fits; left -= fits * FLIGHT_SPACE[good];
  }
  const lost = Object.entries(kept).filter(([good, amount]) => (household.resources?.[good] ?? 0) > amount).map(([good, amount]) => `${round((household.resources[good] ?? 0) - amount)} ${good}`);
  for (const [good, amount] of Object.entries(kept)) household.resources[good] = amount;
  for (const beast of with_) {
    if (beast.kind === 'horse' || beast.species === 'horse') continue;
    beast.condition = 'lost'; beast.laden = false; beast.borrowedBy = null;
    if (beast.travel) beast.travel = { ...beast.travel, halted: true, purpose: 'lost' };
  }
  for (const one of goers) if (one.travel) { one.travel.mode = 'foot'; one.travel.speed = WALK_SPEED; delete one.travel.halted; }
  for (const beast of with_) if ((beast.kind === 'horse' || beast.species === 'horse') && beast.travel) { beast.travel.speed = WALK_SPEED; delete beast.travel.halted; }
  flight.mode = 'foot';
  // On foot now: with the milk cow along, at her pace (sim/flight-work.mjs `cowPace`).
  cowPace(world, household);
  delete flight.bog; delete flight.oxSpentUntil;
  if (flight.crossing) { flight.crossed = [...(flight.crossed || []), flight.crossing.siteId]; delete flight.crossing; }
  tell(world, household, `The family left the wagon and the ox where they stood and went on on foot, carrying ${Object.entries(kept).filter(([, amount]) => amount > 0).map(([good, amount]) => `${amount} ${good}`).join(', ') || 'nothing'}${lost.length ? `; ${lost.join(', ')} had to be left with the wagon` : ''}.`, { importance: 3, claimId: 'HIST-TEX-069' });
}

// ---------------------------------------------------------------------------------------------------- overtaken

/** The place on the map nearest a point: where a family was when something happened to it on the road. */
const siteNear = (world, point) => point && Object.values(world.map.sites).reduce((best, site) => !best || Math.hypot(site.x - point.x, site.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? site : best, null)?.id;

/** The place a column's prisoners and takings go: where its head is making for. */
const columnSite = (world, near) => world.map.sites[near.toward] ? near.toward : 'san-felipe';

/**
 * The Mexican army comes up with the family (`HIST-TEX-073`): the wagon, the animals and everything in the wagon are taken,
 * the grown men are taken prisoner at `PRISONER_SHARE`, and the rest are let go to walk on with nothing. Coin is not taken
 * (`ceiling:` the record has houses ransacked and goods looted, not purses; a purse taken is the way out if the owner wants one).
 */
export function overtake(world, household, near) {
  const flight = household.flight;
  const { people: with_, beasts: had } = withFamily(world, household);
  const siteId = columnSite(world, near), site = world.map.sites[siteId];
  flight.overtakenBy = [...(flight.overtakenBy || []), near.id];
  flight.overtaken = { minute: world.minute, column: near.id };
  delete flight.ask; delete flight.bog; delete flight.danger; delete flight.oxSpentUntil;
  const taken = Object.entries(household.resources || {}).filter(([good, amount]) => good in FLIGHT_SPACE && amount > 0).map(([good, amount]) => `${round(amount)} ${good}`);
  for (const good of Object.keys(FLIGHT_SPACE)) if (household.resources) household.resources[good] = 0;
  // "the wagon, the ox, the horse", as it always read; a family that bought more is told how many: "two horses".
  const counted = new Map();
  for (const beast of had) { const word = beast.kind === 'wagon' ? 'wagon' : beast.species || beast.kind; counted.set(word, (counted.get(word) || 0) + 1); }
  const animals = [...counted].map(([word, n]) => n === 1 ? `the ${word}` : `${n === 2 ? 'two' : n === 3 ? 'three' : n} ${word === 'ox' ? 'oxen' : `${word}s`}`);
  // The milk cow a child drove along is taken with the rest (sim/flight-work.mjs, owner 2026-09-27: "lost if overtaken").
  if (loseCow(household)) animals.push('the milk cow');
  for (const beast of had) {
    beast.travel = null; beast.condition = 'taken'; beast.laden = false; beast.borrowedBy = null;
    beast.location = { x: site.x, y: site.y, siteId };
  }
  const prisoners = [];
  for (const person of with_) {
    if (person.chore) abandonChore(world, household, person);
    if (person.sex === 'male' && canAnswerCalls(person) && share(world, person.id, 'overtaken') < PRISONER_SHARE) {
      person.health = { condition: 'captured' }; person.task = 'rest'; person.chore = null; person.travel = null;
      person.location = { x: site.x, y: site.y, siteId };
      prisoners.push(person);
    } else if (person.travel) { person.travel.mode = 'foot'; person.travel.speed = WALK_SPEED; delete person.travel.halted; }
  }
  if (flight.crossing) { flight.crossed = [...(flight.crossed || []), flight.crossing.siteId]; delete flight.crossing; }
  // On foot from here, whether caught on the road or at a refuge: the wagon and the ox are the column's. A family caught at its
  // refuge was once left 'wagon' and went home in 'the wagon' the soldiers took - hidden while a question nobody answered pressed
  // it on east on foot (auto's answer), and found when such a question began to lapse (2026-09-27).
  flight.mode = 'foot';
  // The cow taken, nobody is held to her pace any longer.
  cowPace(world, household);
  const where = flight.status === 'refuged' ? `at ${world.map.sites[flight.refuge].name}` : 'on the road';
  const text = `${near.name} came up with the family ${where}. The soldiers took ${animals.length ? animals.join(', ') : 'what animals there were'}${taken.length ? ` and everything in the wagon: ${taken.join(', ')}` : ''}. ${prisoners.length ? `${prisoners.map(one => one.name).join(' and ')} ${prisoners.length > 1 ? 'were' : 'was'} taken prisoner and marched off with the column${with_.length > prisoners.length ? '; the rest were let go' : ''}.` : 'Nobody was taken.'}${flight.status === 'fled' && with_.length > prisoners.length ? ' The family went on on foot with nothing.' : ''}`;
  const eventId = record(world, 'consequence', { householdId: household.id, importance: 3, claimId: 'HIST-TEX-073', classification: 'FICTIONAL FOR GAMEPLAY', text });
  // Caught costs the family glory as a desertion does (owner, 2026-09-17: "Keep as it is, but with a minus glory
  // consequence", "Like a desertion"): twice what enlisting is worth, by the miles from home, once for each column.
  // Charged to whoever was answering for the family on the road, not to a father away with the army (interactions B1).
  const principal = actingId(world, household) || mainPersonId(world, household) || household.members[0];
  awardGlory(world, { event: `overtaken-${near.id}`, claimId: 'HIST-TEX-073', personId: principal, householdId: household.id, role: 'enlisted', fromSiteId: siteNear(world, familyPoint(world, household)) || siteId, causes: eventId ? [eventId] : [], adjust: earned => -2 * earned, note: 'They stayed too long on the road and the Mexican army caught them.' });
  for (const one of prisoners) record(world, 'consequence', { actorId: one.id, householdId: household.id, importance: 3, claimId: 'HIST-TEX-073', text: `${one.name} was taken prisoner by the Mexican army ${where}.` });
  if (household.played) spotlight(world, { key: `overtaken:${household.id}:${near.id}`, text: `${near.name} overtakes ${householdName(world, household)} ${where === 'on the road' ? 'on the road east' : where} and takes the wagon, the animals and the goods${prisoners.length ? `, and ${prisoners.map(one => one.name).join(' and ')} prisoner` : ''}.`, x: familyPoint(world, household)?.x, y: familyPoint(world, household)?.y, claimId: 'HIST-TEX-073', householdId: household.id });
}

// ------------------------------------------------------------------------------------------------ one tick of the road

/**
 * One tick of the road for a family on it or camped at its refuge: the rain and the bog, the ox recovering, the camp
 * (a road chore halts the family), the pursuit's warning and its overtaking, and a question nobody has answered decided.
 * Returns whether the family is halted this tick by any of it (the crossing is sim/scrape.mjs's own).
 */
export function advanceRoad(world, household) {
  const flight = household.flight;
  if (!flight || !['fled', 'refuged'].includes(flight.status)) return false;
  const day = dayOf(world.minute), moving = flight.status === 'fled';
  const camp = camping(world, household);
  // The bog: freed by digging after its hours, or by a dry day; rolled once a rain day for a family moving with its wagon.
  if (flight.bog) {
    if (flight.bog.freeing && world.minute >= flight.bog.freeing.until) {
      const hours = flight.bog.freeing.hours || DIG_HOURS;
      delete flight.bog;
      flight.oxSpentUntil = world.minute + OX_SPENT_HOURS * 60;
      for (const one of withFamily(world, household).people) if (canAnswerCalls(one)) one.exertion = Math.round(((one.exertion || 0) + DIG_MILES) * 10000) / 10000;
      for (const one of [...withFamily(world, household).people, ...withFamily(world, household).beasts]) if (one.travel) one.travel.speed = WAGON_SPEED * SPENT_PACE;
      tell(world, household, `After ${hours} hours the wagon came out of the mud and was loaded again. Everybody who dug is worn by it, and the ox is spent: the wagon goes at half pace for a day.`);
    } else if (flight.bog.waiting && day > flight.bog.day && !wetWhere(world, household, day)) {
      delete flight.bog;
      tell(world, household, 'The ground has dried enough; the ox drew the wagon out and the family went on.');
    }
  } else if (moving && !flight.crossing && !camp && !flight.ask && wagonWith(world, household) && wetWhere(world, household, day) && flight.bogDay !== day) {
    flight.bogDay = day;
    if (share(world, household.id, `bog:${day}`) < BOG_SHARE) {
      flight.bog = { minute: world.minute, day };
      openAsk(world, household, 'bog', 'It rained, and on the soft ground the wagon sank to its axles and stuck fast; the ox could not move it.');
    }
  }
  // The ox rested.
  if (Number.isFinite(flight.oxSpentUntil) && world.minute >= flight.oxSpentUntil) {
    delete flight.oxSpentUntil;
    for (const one of [...withFamily(world, household).people, ...withFamily(world, household).beasts]) if (one.travel && one.travel.mode === 'wagon') one.travel.speed = WAGON_SPEED;
    tell(world, household, 'The ox has rested and pulls at its pace again.', { importance: 1 });
  }
  // The pursuit: a warning while a column is near, put to the family once for each column; overtaken when it sits in reach.
  const point = familyPoint(world, household);
  const nearest = point ? pursuit(world, point) : null;
  // The column the family was warned of stays the one it is warned of while it is still within reach, though another
  // marching beside it is a few yards nearer this tick (since 2026-09-26 columns march together: Santa Anna's with Sesma's
  // division, the army at Old Fort). Being overtaken is by whichever column is on top of the family.
  const kept = nearest && flight.danger && flight.danger.id !== nearest.id ? pursuit(world, point, flight.danger.id) : null;
  // Somebody of the family watching the road behind sees the riders further off (sim/flight-work.mjs `road-lookout`).
  const warnAt = lookoutMiles(world, household, WARNING_MILES);
  const near = kept && kept.miles <= warnAt ? kept : nearest;
  // Never of a column whose army has stripped the family, it or one of its patrols (owner, 2026-09-28, "One army"; `strippedBy`).
  if (near && near.miles <= warnAt && !strippedBy(flight, near.id)) {
    if (!flight.danger || flight.danger.id !== near.id) {
      flight.danger = { id: near.id, name: near.name, miles: near.miles, towardName: near.towardName, minute: world.minute };
      const watcher = near.miles > WARNING_MILES ? lookoutOf(world, household) : null;
      record(world, 'consequence', { householdId: household.id, importance: 3, claimId: watcher ? 'FIC-GONZ-487' : 'FIC-GONZ-051', text: `${watcher ? `${watcher.name}, watching the road behind, saw the dust first. ` : ''}Word along the road: ${near.name} is ${aboutMiles(near.miles)} off and coming this way, making for ${near.towardName}. A family that sits still may be caught.` });
    } else Object.assign(flight.danger, { miles: near.miles, towardName: near.towardName });
    // Put to the family once for each column, after any bog it is in has been answered.
    if (!flight.danger.asked && !flight.ask) { flight.danger.asked = true; openAsk(world, household, 'danger', `${near.name} is close behind.`); }
  } else if (flight.danger && (!near || near.miles > warnAt || strippedBy(flight, near.id))) {
    delete flight.danger;
    if (flight.ask?.id === 'danger') delete flight.ask;
  }
  // Coming up with the family (owner, 2026-09-27; sim/pursuit.mjs): no longer a circle round each column's head, but the
  // soldiers who can see the family - a column on its road, or a patrol out ahead of one - coming after it, calling on it to
  // halt, and taking it if it halts or they catch it. The rules kept from before are there: never twice by the same army,
  // not again where it was stripped until it has set out (three columns pass San Felipe in ten days), and never in the day its
  // order gives it (`ORDER_GRACE_MINUTES`, `FIC-GONZ-465`: the record's Gonzales families left the night before Sesma came in).
  const chased = advancePursuit(world, household);
  // A question nobody answered in its time. For a family a student is answering for, **it lapses** (owner, 2026-09-27;
  // sim/lapse.mjs): nothing new is done (`lapseRoad`). A family nobody is answering for is decided as auto decides. Its time is
  // ninety real seconds for a played family at its screen (owner, 2026-09-29, `roadOnLimit`), twelve ticks otherwise.
  if (flight.ask && (roadOnLimit(world, household) ? limitOut(world, roadLimitKey(household, flight.ask)) : world.tick - flight.ask.openedTick >= ROAD_PATIENCE_TICKS)) {
    if (familyAnsweredFor(world, household) && !world.entities[actingId(world, household)]?.auto) lapseRoad(world, household);
    else {
      const option = roadAutoAnswer(world, household);
      if (option) answerRoad(world, household, option, 'silence'); else delete flight.ask;
    }
  }
  return Boolean(flight.bog) || camping(world, household) || chased;
}

/** What the family sees of the road: the weather, the bog, the camp, the danger and the open question. Never a fate. */
export function roadProjection(world, household) {
  const flight = household.flight;
  if (!flight || !['fled', 'refuged'].includes(flight.status)) return {};
  const camp = people(world, household).find(one => one.chore && CHORES[one.chore.id]?.road);
  return {
    weather: weatherOf(world, household),
    ...(flight.bog && { bogged: { freeing: Boolean(flight.bog.freeing), waiting: Boolean(flight.bog.waiting) } }),
    ...(Number.isFinite(flight.oxSpentUntil) && { oxSpent: true }),
    ...(camp && { camp: CHORES[camp.chore.id].name }),
    ...(flight.danger && { danger: { name: flight.danger.name, miles: Math.round(flight.danger.miles), towardName: flight.danger.towardName, ...(flight.danger.stayed && { stayed: true }) } }),
    ...(flight.overtaken && { overtaken: true }),
    ...(flight.ask && { ask: roadAskProjection(world, household) }),
    // The soldiers after the family, as it sees them (sim/pursuit.mjs); where it is going and how, and how far off it can be seen.
    ...(() => { const chase = chaseProjection(world, household); return chase ? { chase } : {}; })(),
    ...(() => { const route = routeProjection(world, household); return route ? { route: { ...route, places: flightPlaces(world.map) } } : {}; })(),
    ...(() => { const sight = flight.status === 'fled' || flight.status === 'refuged' ? sightMiles(world, household) : null; return sight ? { seen: sight } : {}; })(),
  };
}

/**
 * The real milliseconds the road's open question has left before it lapses - ninety seconds, or the soldiers' ¡Alto! thirty
 * (sim/decision-budget.mjs `QUESTION_BUDGETS`, owner 2026-09-29) - for the countdown on the "!" (docs/audits/2026-09-28-design.md
 * S33), or null for a question that is not on the real clock (nobody is reading it). The server's clock is what lapses it.
 */
export function askLeftMs(world, household) {
  const ask = household?.flight?.ask;
  if (!ask || !Number.isFinite(ask.openedTick) || !roadOnLimit(world, household)) return null;
  return limitLeft(world, roadLimitKey(household, ask), ask.id === 'alto' ? 'alto' : 'road');
}

/** A saved road that cannot be, or null. */
export function roadInvalid(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight) continue;
    if (flight.ask && (!ROAD_ASKS[flight.ask.id] || !Number.isFinite(flight.ask.openedTick))) return 'Invalid road question';
    if (flight.bog && !Number.isFinite(flight.bog.day)) return 'Invalid bog';
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------- the road's chores

/** A road chore halts the family where it is: the camp. */
function haltFamily(world, household, entity) {
  for (const one of [...withFamily(world, household).people, ...withFamily(world, household).beasts]) if (one.travel) one.travel.halted = true;
}
/**
 * The family runs from the soldiers (sim/pursuit.mjs `answerAlto`): whoever held the camp - a hunt, a line in the river, the
 * nursing, a day's rest - leaves it off unfinished, or the camp would halt the train again on the next tick.
 */
export function breakCamp(world, household) {
  for (const one of people(world, household)) if (one.chore && CHORES[one.chore.id]?.road && CHORES[one.chore.id]?.halts) abandonChore(world, household, one);
}

/**
 * Why nobody of this family can be sent on a road chore now, or null (sim/chores.mjs `choreAvailability` asks first).
 * On the road means with the family on its way east, or camped with it at the refuge.
 */
export function roadChoreRefusal(world, household, entity, chore) {
  const flight = household.flight;
  const onRoad = flight && (flight.status === 'fled' ? entity.travel?.purpose === 'flee' : flight.status === 'refuged' && !entity.travel && entity.location?.siteId === flight.refuge);
  if (!onRoad) return 'The family is not on the road east.';
  if (flight.bog) return 'The wagon is fast in the mud; free it first.';
  // No camp is made with soldiers coming after the family (sim/pursuit.mjs): a halt to rest, hunt or nurse would only let them
  // up with it, and a chase is no rest for the sick (sim/disease.mjs `activityOf`).
  if (chore.halts && flight.chase && !['caught', 'escaped'].includes(flight.chase.phase)) return 'Soldiers are coming after the family: this is no time to stop.';
  // 'campsite', not 'camp': that key is Houston's camp work (sim/camp.mjs), which the army's march breaks off.
  if (chore.campsite && !(flight.crossing || flight.status === 'refuged')) return 'There are no other families camped here to trade with; there are at a crossing or a refuge.';
  // Camped apart from the crowd, away from its sickness (sim/disease.mjs `camp-apart`): the other families are a mile off.
  if (chore.skill === 'trade' && campedApart(world, household)) return 'The family is camped apart from the others, and there is nobody near to trade with.';
  if (chore.nurses && !people(world, household).some(one => one.health?.condition === 'sick')) return 'Nobody of the family is sick.';
  // A line goes in where there is water to put it in: at a crossing the family is standing at the river, and every refuge
  // the flight makes for stands on one - San Felipe and Washington on the Brazos, Lynchburg on the San Jacinto, Liberty on
  // the Trinity, Nacogdoches on its creeks.
  if (chore.water) {
    if (!(flight.crossing || flight.status === 'refuged')) return 'There is no water to put a line in here; there is at a crossing and at the refuges.';
    // And not while it is over its banks. Dilue Harris at the Trinity: the water "broke over the banks above where we were
    // and ran around us", "drift wood covered the water as far as we could see", and the families in the bottom stayed the
    // night "without fire or anything to eat" (`HIST-TEX-238`). A flooded river is why they are waiting and why they are
    // hungry, and it must not also be where they are fed.
    const where = world.map.sites[flight.crossing?.siteId] || entity.location;
    if (waterAt(world, where) >= WATER_SHUT) return 'The river is over its banks and thick with drift; nothing will take a line today.';
  }
  return null;
}

/**
 * The road's chores, built when asked for rather than at load: this module is reached through sim/chores.mjs itself
 * (chores → houston → scrape → road), so nothing of that table may be touched while it is still being made. sim/world.mjs
 * registers them once its own imports are done; a second call registers nothing.
 */
let registered = false;
export function registerRoadChores() {
  if (registered) return;
  registered = true;
  registerChores(roadChores());
}
const roadChores = () => ({
  'hunt-road': {
    // The family's one rifle goes with whoever hunts (owner, 2026-09-24; sim/keeping.mjs).
    takes: ['rifle'],
    name: 'Hunt from the camp', skill: 'hunting', where: 'road', road: true, halts: true, refuse: roadChoreRefusal,
    needs: { powder: 1 },
    describe: `The family halts where it is while they go out from the camp for game. The shot is theirs to take or wait for, as at home; what they bring back (${CAMP_HUNT_FOOD} food, more for a good hand) is the family’s. The Mexican army does not halt.`,
    begin: (world, household, entity) => { haltFamily(world, household, entity); entity.chore.ground = { cover: 'the timber by the road' }; },
    steps: [
      { work: 2, doing: 'going out from the camp for game' },
      { quarry: 'far', work: 1, doing: 'waiting downwind, and still' },
      { ask: 'shot' },
      { when: ['wait'], quarry: 'near', work: 3, doing: 'letting it come closer' },
      { when: ['take', 'wait'], shot: true, doing: 'the shot' },
      { when: ['take', 'wait'], strike: { food: CAMP_HUNT_FOOD } },
      { when: ['carrying'], work: 1, doing: 'carrying it back to the camp' },
      { when: ['empty'], work: 1, doing: 'coming back to the camp with nothing' },
    ],
  },
  // The food a family with neither powder nor coin can still get. Measured 2026-09-20 (docs/BIOME_GAMEPLAY.md §10.4): the
  // four gathering works at home took the median family's hungry ticks from 65.5 to 8.5, and did nothing at all for
  // Columbia and Matagorda, whose hunger is this road and not their farm. `FIC-GONZ-178`.
  'fish-road': {
    name: 'Put a line in the river', skill: 'hands', where: 'road', road: true, halts: true, water: true, refuse: roadChoreRefusal,
    describe: `The family is stopped at the water anyway. A line costs no powder and no coin and wants no knack, and brings back ${ROAD_FISH_FOOD} food — less than the same hours at the family's own creek, because everybody else on the road is camped on the same bank. Not while the river is over its banks.`,
    begin: haltFamily,
    steps: [
      { work: 6, doing: 'sat at the water with a line' },
      { produce: { food: ROAD_FISH_FOOD } },
    ],
    done: (world, household, entity) => tell(world, household, `${entity.name} took ${ROAD_FISH_FOOD} food out of the river at the camp.`, { claimId: 'FIC-GONZ-178', actorId: entity.id }),
  },
  'tend-sick': {
    name: 'Nurse the sick', skill: 'hands', where: 'road', road: true, halts: true, nurses: true, refuse: roadChoreRefusal,
    describe: 'The family halts for a day while they nurse whoever is sick: nobody in their care dies while they nurse, and when the day is done the sick are a day nearer mending. The Mexican army does not halt.',
    begin: haltFamily,
    steps: [
      { work: 6, doing: 'nursing the sick' },
    ],
    // The day done: everybody sick and with the family is a day nearer mending (`FIC-GONZ-052`). Left off early, nothing.
    done: (world, household, entity) => {
      const nursed = withFamily(world, household).people.filter(one => one.health?.condition === 'sick' && Number.isFinite(one.health.recoversAt));
      for (const one of nursed) one.health.recoversAt -= DAY;
      if (nursed.length) tell(world, household, `${entity.name} nursed ${nursed.map(one => one.name).join(' and ')} through the day; ${nursed.length > 1 ? 'they are' : `${nursed[0].name} is`} a day nearer mending.`, { claimId: 'FIC-GONZ-052' });
    },
  },
  'trade-crossing': {
    // No skill of the family's bears on a price: `trade` is a skill nobody has, so a real buys exactly what it says.
    name: 'Trade for food with the families camped here', skill: 'trade', where: 'road', road: true, campsite: true, refuse: roadChoreRefusal,
    needs: { money: 1 },
    describe: `Among the families waiting at a crossing or camped at a refuge, ${reales(1)} buys ${CAMP_FOOD_PER_REAL} food: dear, because bread is scarce on the road (in town it buys ${COIN.foodPerReal}).`,
    steps: [
      { work: 1, doing: 'among the families camped here' },
      { consume: { money: 1 } },
      { produce: { food: CAMP_FOOD_PER_REAL } },
    ],
  },
});
