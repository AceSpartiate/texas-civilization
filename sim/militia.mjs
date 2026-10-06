// Away at the war: a volunteer's life between answering the call and coming home (owner, 2026-10-05;
// docs/MILITARY_EXPERIENCE.md, "Away at the war").
//
// Owner, 2026-10-05, verbatim: "When my character reached Gonzales I never received a notification that he was participating
// in battle. I went to check on him and he was just standing around in town doing nothing with others that had been sent by
// npc's. They shouldn't be just standing around. Why can they still see the tasks they could do back home? They're off to
// serve as part of the militia and/or army. They should have skills and tasks for that. After the battle, if they're just
// staying in Gonzales, I'm assuming that they would find local work? Try to make some money? Talking to other people that are
// nearby? Players should be able to read the conversations they're having via thought bubbles to learn what's going on in
// that area even if a rider wouldn't normally tell them. ... They'll need shelter, so they should set up a tent, or if they
// find local work maybe they take reduced pay for food and shelter? They should have food on them, not be pulling from the
// home supply. They should have to replenish that supply, or be forced to return home. If they're serving in the militia then
// the militia/army should give them replacement ammunition, they're not at home, so they're not pulling from the same supply."
//
// And by multiple choice the same day: **"Camp duties, auto"** (a militia bar replaces the home bar - drill, stand picket, cook
// at the mess fire, cut firewood, mould bullets; he does them on his own when left alone, and the student can pick one), and
// for rations **"i like the pick days to carry, but i also want them to have historically accurate ways to replenish."**
//
// **One state.** A person is away at the war (`atWar`) while his promise to serve stands and he is away from home, as
// sim/acting.mjs `awayWithTheArmy` says; Houston's men and the winter's enlisted (sim/winter.mjs `service`) are the army's own
// and eat its rations. While he is, he carries `person.militia` (absent on everybody else, and on every class saved before:
// made the first tick it is wanted, `militiaOf`):
//
//   person.militia?: {
//     since: minute,            // when he first stood away at the war
//     pack: food,               // what he carries to eat, taken from home when he went (`takePack`), bought, hunted or earned
//     rounds: shots,            // powder and ball he carries: the family's when he went, the militia's after (`mould`)
//     drilled?: days,           // days of drill: three make him steady in the line (sim/army.mjs `steadiness`)
//     fed?: day,                // the day the mess or the house he works at fed him whole
//     shelter?: 'brush' | 'board',   // absent: a blanket under the sky
//     boardDay?: day,           // the night he sleeps in the house he works at
//     owed?: reales,            // wages earned and not yet a whole real
//     short?: days,             // days in a row the pack was empty and he went short
//     emptyTold?: true,         // "has eaten the last of what he carried", said once
//     mess?: day,               // the day he last cooked or cut wood for the mess: his turn comes round every `MESS_TURN_DAYS`
//   }
//
// What it costs and gives is the game's own (`FIC-GONZ-1176` to `-1183`); what fed, armed and sheltered the volunteers of 1835
// is documented (`HIST-TEX-1184` to `-1188`), and where the record is silent - no volunteer is recorded taking paid work or
// board - it says so (`HIST-TEX-1187`).
import { record } from './events.mjs';
import { awayWithTheArmy, servesNow } from './acting.mjs';
import { eatenADay } from './family.mjs';
import { ate, watchedFamily } from './hunger.mjs';
import { learn, wouldLearn } from './knowledge.mjs';
import { calendarMinutes, dateOf } from './clock.mjs';
import { heldByBattle } from './battle-stage.mjs';
import { placeOf } from './town-scenes.mjs';
import { share } from './shares.mjs';
import { SICK_PER_DAY, coldSky, sicknessWeight } from './scrape.mjs';
import { fallSick } from './disease.mjs';
import { modeWith } from './keeping.mjs';

const DAY = 1440;
const GONE = Object.freeze(['dead', 'captured']);
const round = value => Math.round(value * 10000) / 10000;
const today = world => Math.floor(world.minute / DAY);

/** The days of food the going popup offers a man going to the war (owner, 2026-10-05: "the pick days to carry"; `FIC-GONZ-1179`). */
export const PACK_DAYS = Object.freeze([3, 7, 14]);
/** What a man is taken to have carried when nobody chose: the smallest, and on a class saved before packs, given and not taken. */
export const DEFAULT_PACK_DAYS = 3;
/** The most days of food a man carries: the fourteen of the largest pack. */
export const PACK_MOST_DAYS = 14;
/**
 * The share of a day's eating a man is issued at the gathering of the volunteers, before there is an army: the beef the town and the
 * commissary had in plenty, and not the bread and meal he was told to bring (`HIST-TEX-1184`, `-1185`: "Bring as much as they can").
 * The half is the game's (`FIC-GONZ-1180`), so that what he carries matters - the record's men at Gonzales were "well supplied with
 * beef and bread" early on, and the bread ran short later. The rest he eats from his pack, or is fed whole by the mess or the house
 * he works for. Once the army is made its commissary feeds its men whole (`eat`).
 */
export const ISSUE_SHARE = 0.5;
/** Days in a row of the pack empty and the man short before he gives it up and walks home (`FIC-GONZ-1179`). */
export const SHORT_DAYS_HOME = 2;
/** Powder and ball a man carries at most, and what a spell of moulding adds from the militia's lead and powder (`FIC-GONZ-1178`). */
export const ROUNDS_MOST = 6, MOULD_ROUNDS = 2;
/**
 * When the militia at Gonzales first had lead to mould: Royall's letter of October 11 has it fetched from Stafford's old place,
 * after Austin's "Lead - Lead we want Lead" of the 8th (`HIST-TEX-1185`). Before it, moulding is refused in those words.
 */
const LEAD_FROM = Date.UTC(1835, 9, 11);
/** A day's hire in town, and the reduced pay of work for board, in reales a day (`FIC-GONZ-1182`). Paid in whole reales. */
export const WAGE_A_DAY = 0.5, BOARD_PAY_A_DAY = 0.25;
/** Food a real buys over a counter in the town: the store's own rate (sim/chores.mjs `COIN.foodPerReal`). */
export const FOOD_A_REAL = 3;
/** What a day's hunt with the rifle brings in when it finds game, and how often it does (`FIC-GONZ-1180`, on `HIST-TEX-261`). */
export const HUNT_FOOD = 2, HUNT_FINDS = 0.6;
/**
 * Days of drill that make a man steady in the line: Houston's camp's three (sim/houston.mjs `DRILL_TO_STEADY`), read in the
 * autumn's fights too (sim/army.mjs `rollFates`, `FIC-GONZ-1177`). Restated so this file imports nothing of the spring's camp.
 */
export const DRILL_DAYS = 3;
/** How far a man walks to his place in the camp in a tick at most: a walker's twenty minutes a mile, as the force's men do. */
const WALK_MILES_A_MINUTE = 1 / 20;
/** Ticks between two things he overhears (`overhear`): about a minute at the Study pace. */
export const OVERHEAR_TICKS = 6;
/** A man's turn at the mess's work - its fire or its wood - comes round one day in this many (`FIC-GONZ-1180`). */
export const MESS_TURN_DAYS = 3;
/** How long an overheard exchange stays on the family's page, in ticks. */
export const OVERHEARD_TICKS = 2;

// ------------------------------------------------------------------------------------------------------------- who

const alive = person => person?.kind === 'person' && Boolean(person.householdId) && !GONE.includes(person.health?.condition);
/**
 * Whether this person is away at the war as a volunteer (`FIC-GONZ-1176`): his promise to serve stands, he is away from home
 * (sim/acting.mjs `awayWithTheArmy`), and he is nobody's enlisted man (Houston's army, the garrison: sim/winter.mjs `service`).
 */
export const atWar = (world, person) => alive(person) && !person.service && servesNow(person) && awayWithTheArmy(world, person);
/** The 1835 army halted in a camp on its road, with this man on its halted journey (sim/army.mjs `marchingTravel`). */
export const inArmyCamp = (world, person) => person?.travel?.purpose === 'march' && Boolean(person.travel.halted) && Boolean(world.army?.camp) && Boolean(world.army?.members?.includes(person.id));
/**
 * Whether he is in a camp, able to do its work: standing at the place the volunteers gathered (Gonzales, Victoria) or with the army
 * where it stands, and not in a fight (sim/battle-stage.mjs `heldByBattle`).
 */
export function inCamp(world, person) {
  if (!atWar(world, person) || heldByBattle(world, person)) return false;
  if (inArmyCamp(world, person)) return true;
  // Where the volunteers gathered: a town (Gonzales, Victoria) - never the timber on Williams's land the men went up the river to,
  // where the fight is the only work (sim/directors.mjs `CAMP_SITE`), nor a road's crossing.
  return !person.travel && ['town', 'village'].includes(world.map?.sites?.[person.location?.siteId]?.kind);
}
/**
 * In a town, where there is a counter to buy at and work to be had: the gathering at Gonzales or Victoria, never the army's camp.
 * ceiling: staying on in the town once the army has marched is not offered - a volunteer there follows it (sim/army.mjs
 * `followTheArmy`) or is sent home; leaving the volunteers to live in the town would want a person away from home with no promise
 * to serve, which this state is not.
 */
export const inTown = (world, person) => inCamp(world, person) && !person.travel && ['town', 'village'].includes(world.map?.sites?.[person.location.siteId]?.kind);

// --------------------------------------------------------------------------------------------------------- the record

/** His record, made when first wanted: on a class saved before, a pack of the smallest size given and not taken from home. */
export function militiaOf(world, person) {
  if (person.militia?.since !== undefined) return person.militia;
  // ceiling: a man already at the war on a class saved before packs is given three days and the rounds of the powder a
  // volunteer took (sim/calls.mjs `VOLUNTEER_POWDER`), not charged to his family; reading what he really took from the record is the way out.
  person.militia = { ...(person.militia || {}), since: world.minute, pack: round(eatenADay(world, [person]) * DEFAULT_PACK_DAYS), rounds: 2 };
  return person.militia;
}
/** A day's eating for this man. */
export const rationOf = (world, person) => eatenADay(world, [person]);
/** His pack in days of eating, to a tenth: what the row shows. */
export const packDays = (world, person) => Math.floor((person.militia?.pack || 0) / Math.max(0.0001, rationOf(world, person)) * 10) / 10;

/**
 * The going popup's food row (owner, 2026-10-05): each size of pack, the food it takes out of the family's store, and whether the
 * store has it. The smallest is always offered: with less than three days in the house he takes what there is, and it says so.
 */
export function packOptions(world, household, person) {
  const ration = rationOf(world, person), store = Math.max(0, household?.resources?.food || 0);
  return PACK_DAYS.map((days, index) => {
    const food = round(ration * days);
    if (store >= food) return { days, food: Math.round(food * 10) / 10, can: true };
    if (index === 0) return { days, food: Math.round(store * 10) / 10, can: true, short: true, note: `The house has food for ${Math.floor(store / ration * 10) / 10} days of his. He takes what there is.` };
    return { days, food: Math.round(food * 10) / 10, can: false, why: `The house has food for only ${Math.floor(store / ration * 10) / 10} days of his.` };
  });
}
/**
 * He goes to the war with `days` of food from the family's store and the family's powder he took (`FIC-GONZ-1179`): his pack and
 * his rounds from now on, never the home store's. A size the store cannot fill is refused before anything is taken, except the
 * smallest, which takes what there is. Returns the food taken.
 */
export function takePack(world, household, person, days = DEFAULT_PACK_DAYS, { rounds = 0 } = {}) {
  const wanted = PACK_DAYS.includes(Number(days)) ? Number(days) : DEFAULT_PACK_DAYS;
  const option = packOptions(world, household, person).find(one => one.days === wanted);
  if (!option.can) throw new Error(option.why);
  const food = round(Math.min(Math.max(0, household.resources.food || 0), rationOf(world, person) * wanted));
  household.resources.food = round((household.resources.food || 0) - food);
  const kept = person.militia?.drilled ? { drilled: person.militia.drilled } : {};
  person.militia = { ...kept, since: world.minute, pack: food, rounds: Math.max(0, Math.round(rounds)), days: wanted };
  return food;
}
/** The words of the family's record for what he took. */
export const packWords = (world, household, person, food) => (food > 0
  ? `${person.name} took ${Math.round(food * 10) / 10} food for the road, about ${Math.round(food / rationOf(world, person))} days of his; there is ${Math.round((household.resources.food || 0) * 10) / 10} left in the house.`
  : `${person.name} went with no food of his own: there was none in the house.`);

// ----------------------------------------------------------------------------------------------------- where he stands

/** Where in the volunteers' camp on the commons at Gonzales each kind of work is done, in miles from the muster ground (sim/town-scenes.mjs). */
const SPOTS = Object.freeze({
  idle: [-0.02, -0.012], 'camp-cook': [0.004, 0.022], 'camp-wood': [-0.045, 0.034], 'camp-bullets': [0.02, 0.026],
  'camp-drill': [0.05, -0.035], 'camp-guard': null, 'camp-shelter': [-0.03, -0.02], 'town-wages': [-0.16, -0.2], 'town-board': [-0.12, 0.03],
  'camp-buy': [-0.12, 0.03], 'camp-hunt': [0.18, 0.12],
});
/**
 * Where this man stands now in the volunteers' camp at Gonzales: at his work's own place on the commons, a step apart from the
 * next man by his id - never on the town's own point, where everybody used to stand (the owner's "just standing around in town").
 * Null anywhere but Gonzales: the army's camps stand their men in its ranks (sim/army.mjs).
 */
export function campSpot(world, person) {
  if (person.location?.siteId !== 'gonzales' || person.travel) return null;
  const town = world.map?.sites?.gonzales;
  if (!town) return null;
  const work = person.chore?.id;
  const muster = placeOf(world, 'muster');
  if (work === 'camp-guard') { const out = placeOf(world, 'eastEdge'); return { x: round(town.x + out.x - 0.02), y: round(town.y + out.y + 0.01) }; }
  const [dx, dy] = SPOTS[work] || SPOTS.idle;
  const slot = Math.floor(share(world, person.id, 'camp-slot') * 6);
  return { x: round(town.x + muster.x + dx + (slot % 3 - 1) * 0.012), y: round(town.y + muster.y + dy + Math.floor(slot / 3) * 0.01) };
}
/** A walker's step toward his place, as the force's men walk to theirs (sim/directors.mjs `standWithTheForce`). */
function walkToSpot(world, person) {
  const spot = campSpot(world, person);
  if (!spot) return;
  const gap = Math.hypot(spot.x - person.location.x, spot.y - person.location.y);
  if (gap < 1e-4) return;
  const reach = Math.max(0.02, calendarMinutes(world) * WALK_MILES_A_MINUTE);
  const part = gap <= reach ? 1 : reach / gap;
  person.location = { ...person.location, x: round(person.location.x + (spot.x - person.location.x) * part), y: round(person.location.y + (spot.y - person.location.y) * part) };
}

// ---------------------------------------------------------------------------------------------------------- the duties

const tell = (world, person, text, { claimId = 'FIC-GONZ-1176', importance = 2, type = 'consequence', ambient = false } = {}) => record(world, type, {
  actorId: person.id, householdId: person.householdId, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text, ...(ambient && { ambient: true }),
});
/**
 * The camp's routine, said in the family's story but not in the few lines its page is sent (sim/world.mjs `projectWorld` leaves
 * `ambient` lines out) when he took it up himself: a day's drill or cooking every few minutes of the class would push out the news a
 * family must read. A duty the student picked is said as it always is.
 */
const routine = person => Boolean(person.chore?.onAuto);
const place = (world, person) => (world.map?.sites?.[person.location?.siteId]?.name || 'the camp').replace(/^The /, 'the ');

/** Why this man cannot be given this work of the militia's now, or null (sim/camp.mjs gives every camp chore its refusal here). */
export function militiaRefusal(world, household, person, choreId) {
  if (!atWar(world, person)) return `${person.name} is not away with the volunteers.`;
  if (!inCamp(world, person)) return person.travel ? `${person.name} is on the road.` : `${person.name} is with the men in the fight.`;
  // Read, never made, here: this is asked by the projection, which changes nothing (`militiaOf` makes it on the tick).
  const m = person.militia?.since !== undefined ? person.militia : { pack: round(rationOf(world, person) * DEFAULT_PACK_DAYS), rounds: 2, ...(person.militia || {}) };
  if (choreId === 'camp-drill' && (m.drilled || 0) >= DRILL_DAYS) return `${person.name} has drilled ${DRILL_DAYS} days and stands steady in the line.`;
  if (choreId === 'camp-bullets') {
    if (dateOf(world, world.minute).getTime() < LEAD_FROM && (world.period ?? 1) === 1) return 'There is no lead in the camp to mould: the men have written to the settlements for it.';
    if ((m.rounds || 0) >= ROUNDS_MOST) return `${person.name} carries all the powder and ball he can.`;
  }
  if (['camp-cook', 'camp-wood'].includes(choreId) && m.mess !== undefined && today(world) - m.mess < MESS_TURN_DAYS) return `${person.name} has had his turn at the mess's work; it comes round again in ${MESS_TURN_DAYS - (today(world) - m.mess)} ${MESS_TURN_DAYS - (today(world) - m.mess) === 1 ? 'day' : 'days'}.`;
  if (choreId === 'camp-shelter' && m.shelter) return m.shelter === 'board' ? `${person.name} sleeps in the house he works at.` : `${person.name} has a shelter put up already.`;
  // The army keeps its men in its camp, and its orders forbade shooting about it (`HIST-TEX-029`): the town's work, a hunt and a
  // counter are the gathering's, in a town.
  if (['camp-hunt', 'camp-buy', 'town-wages', 'town-board', 'camp-shelter'].includes(choreId) && !inTown(world, person)) return 'The army keeps its men in the camp.';
  if (choreId === 'camp-hunt') {
    if (!person.carries?.items?.includes('rifle')) return `${person.name} has no rifle with him.`;
    if (!(m.rounds > 0)) return `${person.name} has no powder and ball left to hunt with.`;
  }
  if (choreId === 'camp-buy') {
    if ((household.resources?.money || 0) < 1) return 'It costs a real, and the family has no coin.';
    if ((m.pack || 0) >= rationOf(world, person) * PACK_MOST_DAYS) return `${person.name} carries all the food he can.`;
  }
  return null;
}

/**
 * Whole reales of what he has earned go to the family's coin, the rest kept until it is a real (docs/MONEY_AND_GLORY.md §3).
 * ceiling: the coin he earns and spends is the family's, as if he carried its purse; coin of his own, and sending it home by
 * somebody going that way, would want a person's purse, which nothing has yet.
 */
function earn(world, household, person, amount) {
  const m = militiaOf(world, person);
  const owed = round((m.owed || 0) + amount);
  const whole = Math.floor(owed + 1e-9);
  if (whole > 0) household.resources.money = (household.resources.money || 0) + whole;
  m.owed = round(owed - whole);
  if (!m.owed) delete m.owed;
  return whole;
}

/** What each duty does when its last step is reached (sim/camp.mjs `RUNS`). */
export const MILITIA_RUNS = Object.freeze({
  drill(world, household, person) {
    const m = militiaOf(world, person);
    m.drilled = (m.drilled || 0) + 1;
    tell(world, person, m.drilled >= DRILL_DAYS
      ? `${person.name} drilled a day with the volunteers at ${place(world, person)}, and has drilled ${m.drilled} days: steady in the line now, which will count when they fight.`
      : `${person.name} drilled a day with the volunteers at ${place(world, person)} (${m.drilled} of ${DRILL_DAYS} days to stand steady in the line).`, { type: 'memory', claimId: 'FIC-GONZ-1177', ambient: routine(person) && m.drilled < DRILL_DAYS });
  },
  picket(world, household, person) {
    // Word brought in by whoever rode past the picket (`FIC-GONZ-1183`): what the country round about has heard and the family has not.
    const heard = newsHere(world, household, person);
    if (heard) learn(world, household.id, heard.topic, { status: heard.status, source: `Heard on picket at ${place(world, person)}` });
    tell(world, person, heard
      ? `${person.name} stood picket on the road above ${place(world, person)}, and a man riding in told the picket: "${heard.words[0]}"`
      : `${person.name} stood a watch on the picket line round ${place(world, person)}. Nothing came up the road.`, { ambient: !heard && routine(person) });
  },
  cook(world, household, person) {
    const m = militiaOf(world, person);
    m.fed = today(world); m.mess = today(world);
    tell(world, person, `${person.name} cooked at the mess fire, and the mess fed him his day's beef and bread.`, { claimId: 'FIC-GONZ-1180', ambient: routine(person) });
  },
  wood(world, household, person) {
    const m = militiaOf(world, person);
    m.fed = today(world); m.mess = today(world);
    tell(world, person, `${person.name} cut firewood for the mess fires, and the mess fed him his day's beef and bread.`, { claimId: 'FIC-GONZ-1180', ambient: routine(person) });
  },
  bullets(world, household, person) {
    const m = militiaOf(world, person);
    const before = m.rounds || 0;
    m.rounds = Math.min(ROUNDS_MOST, before + MOULD_ROUNDS);
    tell(world, person, `${person.name} moulded bullets at the fire from the militia's lead, and was given powder for them: ${m.rounds} rounds now.`, { claimId: 'FIC-GONZ-1178', ambient: routine(person) });
  },
  hunt(world, household, person) {
    const m = militiaOf(world, person);
    m.rounds = Math.max(0, (m.rounds || 0) - 1);
    const found = share(world, person.id, `camp-hunt:${today(world)}:${m.rounds}`) < HUNT_FINDS;
    if (found) m.pack = round(Math.min(rationOf(world, person) * PACK_MOST_DAYS, (m.pack || 0) + HUNT_FOOD));
    tell(world, person, found ? `${person.name} went out from ${place(world, person)} with the rifle and brought back a deer: ${HUNT_FOOD} food in his pack.` : `${person.name} went out from ${place(world, person)} with the rifle, fired once, and came back with nothing.`, { claimId: 'FIC-GONZ-1180' });
  },
  // ceiling: bought at a counter from his bar at the store's own rate, not on the errand to town's popup (docs/TOWNS.md §4b) and not
  // from a named keeper's stock; the errand, with its list and its keepers, from a volunteer in a town is the way out.
  buy(world, household, person) {
    const m = militiaOf(world, person);
    household.resources.money = (household.resources.money || 0) - 1;
    m.pack = round(Math.min(rationOf(world, person) * PACK_MOST_DAYS, (m.pack || 0) + FOOD_A_REAL));
    tell(world, person, `${person.name} bought meal and dried beef in ${place(world, person)} with a real of the family's: ${FOOD_A_REAL} food in his pack.`, { claimId: 'FIC-GONZ-1180' });
  },
  wages(world, household, person) {
    const paid = earn(world, household, person, WAGE_A_DAY);
    tell(world, person, `${person.name} worked a day for hire in ${place(world, person)}, hauling and grinding meal${paid ? `, and was paid ${paid === 1 ? 'a real' : `${paid} reales`} for the family` : ' for half a real, to be paid when it comes to a real'}.`, { claimId: 'FIC-GONZ-1182' });
  },
  board(world, household, person) {
    const m = militiaOf(world, person);
    m.fed = today(world); m.boardDay = today(world); m.shelter = 'board';
    const paid = earn(world, household, person, BOARD_PAY_A_DAY);
    tell(world, person, `${person.name} worked a day at a house in ${place(world, person)} for his meals and a bed${paid ? `, and a real for the family besides` : ', at a quarter of a real a day'}.`, { claimId: 'FIC-GONZ-1182' });
  },
  shelter(world, household, person) {
    militiaOf(world, person).shelter = 'brush';
    tell(world, person, `${person.name} put up a shelter of brush and poles at the volunteers' camp, with his blanket over it.`, { claimId: 'FIC-GONZ-1181' });
  },
});

/**
 * What an idle man at the camp takes up of his own accord (owner, 2026-10-05, "Camp duties, auto": "He does them on his own when
 * left alone"; `FIC-GONZ-1176`): a shelter first if he has none in a town, food when his pack is nearly gone and the family has
 * coin, then the day's turn - mostly drill, about one day in six on picket, at the mess fire or the wood, and moulding when he is
 * short of rounds - by a hashed share of the man and the day, so a class replays the same. `offered` is his work list as the
 * projection sends it, so it chooses only what a student could.
 */
export function militiaChoice(world, person, offered = []) {
  if (!inCamp(world, person) || person.chore) return null;
  const can = id => offered.some(entry => entry.id === id && entry.can);
  const m = militiaOf(world, person), ration = rationOf(world, person);
  if (can('camp-shelter')) return 'camp-shelter';
  // Short of food: bought with the family's coin when nearly gone, and meanwhile the work that feeds him whole today.
  if ((m.pack || 0) < ration && can('camp-buy')) return 'camp-buy';
  if ((m.pack || 0) < ration * 2) { const fed = ['town-board', 'camp-cook', 'camp-wood'].find(can); if (fed) return fed; }
  if ((m.rounds || 0) < 2 && can('camp-bullets')) return 'camp-bullets';
  // The day's turn: drill three times in six while he is learning it, otherwise picket, the mess fire and the wood alike.
  const turns = [['camp-drill', 3], ['camp-guard', 1], ['camp-cook', 1], ['camp-wood', 1]].filter(([id]) => can(id));
  if (!turns.length) return null;
  const total = turns.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = share(world, person.id, `militia:${today(world)}`) * total;
  for (const [id, weight] of turns) { if (roll < weight) return id; roll -= weight; }
  return turns.at(-1)[0];
}

// -------------------------------------------------------------------------------------------------------- every tick

/**
 * Every tick, after the day's eating at home (sim/world.mjs `stepWorld`): each man away at the war eats from what the camp
 * issues and his own pack, walks to his place in the camp, takes up its work when idle, sleeps under what shelter he has, and,
 * with his pack empty and nothing else to feed him, gives it up and walks home. Whoever is home again gives back what he carried.
 */
export function advanceMilitia(world, { beginTravel, workFor = null, begin = null } = {}) {
  const minutes = calendarMinutes(world), days = minutes / DAY;
  for (const person of Object.values(world.entities)) {
    if (person.kind !== 'person' || !person.householdId) continue;
    const household = world.households[person.householdId];
    if (!household) continue;
    if (!atWar(world, person)) { if (person.militia?.since !== undefined) homeWith(world, household, person); continue; }
    const m = militiaOf(world, person);
    // Busy is not left alone: the tick he stands idle is counted from when his work ends.
    if (person.chore) delete m.idle;
    if (inCamp(world, person)) walkToSpot(world, person);
    // The board he works for is a night's roof only: tomorrow he is under his own shelter, or the sky, again.
    if (m.shelter === 'board' && m.boardDay !== undefined && m.boardDay < today(world)) { delete m.shelter; delete m.boardDay; }
    eat(world, household, person, days);
    coldNight(world, person);
    // Never on a road or in the army's ranks (fed whole there, `eat`), and never one who cannot get up: said, and he waits.
    if (m.short >= SHORT_DAYS_HOME && beginTravel && !world.army?.members?.includes(person.id) && !homeRefusal(world, household, person)) {
      try { walkHome(world, household, person, { beginTravel }); } catch { /* no road home from here today: tried again the next tick */ }
    }
  }
  // Idle men take up the camp's work by themselves: asked of the list a student would be sent.
  if (workFor && begin) {
    for (const person of Object.values(world.entities)) {
      if (!inCamp(world, person) || person.chore) continue;
      const household = world.households[person.householdId];
      const m = militiaOf(world, person);
      // Left alone a tick first, so a student who has just called him off sees him stand before he goes to something.
      if (m.idle === undefined) { m.idle = world.tick; continue; }
      if (world.tick - m.idle < 1) continue;
      const choice = militiaChoice(world, person, workFor(world, household, person));
      if (!choice) continue;
      delete m.idle;
      try { begin(world, household, person, choice); } catch { /* refused this tick: tried again the next */ }
    }
  }
}

/** A day's eating for a man away at the war (`FIC-GONZ-1179`, `-1180`): the issue, the mess or the house, then his pack. */
function eat(world, household, person, days) {
  const m = person.militia;
  // A family nobody plays, or whose student has gone, is the director's: its man is fed, and his pack is not drawn (`FIC-GONZ-998`).
  if (!watchedFamily(household) || !(days > 0)) return;
  const need = rationOf(world, person) * days;
  // The army's commissary fed its men whole - beef and corn in rations, flour from Goliad (`HIST-TEX-1184`); the gathering before it
  // gives half (`ISSUE_SHARE`); a road nothing.
  // Whole to the end of the autumn by the owner's decision (2026-10-06: "Keep the army's food in full", `FIC-GONZ-1184`), though from
  // November 22 it was "out of Flour and the corn is exhausted" and men lived on beef (`HIST-TEX-029`): counted half, it would send the
  // played families' men home before the storming of Béxar.
  const share_ = m.fed === today(world) || world.army?.members?.includes(person.id) ? 1 : inCamp(world, person) ? ISSUE_SHARE : 0;
  const issued = need * share_;
  const fromPack = Math.min(m.pack || 0, need - issued);
  m.pack = round(Math.max(0, (m.pack || 0) - fromPack));
  const had = issued + fromPack;
  ate(world, household, [person], need, had, days);
  if (m.pack <= 1e-6 && share_ < 1 && !m.emptyTold) {
    m.emptyTold = true;
    tell(world, person, `${person.name} has eaten the last of the food he carried. The camp's beef is not enough to live on: he needs to buy food, hunt or work for his board, or come home.`, { claimId: 'FIC-GONZ-1179', importance: 3 });
  }
  if (m.pack > 1e-6) { delete m.emptyTold; delete m.short; return; }
  if (had < need - 1e-6) m.short = round((m.short || 0) + days);
  else delete m.short;
}

/** A blanket under the sky in a norther can bring a chill on the chest, as a family under canvas risks at home (`FIC-GONZ-1181`). */
function coldNight(world, person) {
  const m = person.militia;
  if (m.shelter || person.travel || !person.location?.siteId) return;
  const day = today(world);
  if (m.coldDay === day) return;
  m.coldDay = day;
  const site = world.map?.sites?.[person.location.siteId];
  if (!site || !coldSky(world, site, day) || !['well', 'tired'].includes(person.health?.condition)) return;
  const weight = sicknessWeight(person, { hungry: (m.pack || 0) <= 0, cold: true });
  if (share(world, person.id, `militia-cold:${day}`) >= 1 - (1 - SICK_PER_DAY) ** weight) return;
  fallSick(world, person, 'lung-fever', { claimId: 'FIC-GONZ-1181', text: `${person.name} has fallen sick with a chill on the chest: a norther came through and he had only his blanket under the sky.` });
}

/**
 * He goes home: sent for by the family (sim/world.mjs `send-for`), or because his pack is empty and nothing else feeds him. His
 * promise is ended, his work left off, and he starts home on what he came with. The army's own is sim/army.mjs `callHome`.
 */
export function walkHome(world, household, person, { beginTravel, why = null }) {
  const promise = person.commitments?.find(one => one.id === 'volunteer' && one.status === 'active');
  if (promise) promise.status = 'ended';
  if (person.chore) { person.chore = null; person.task = 'rest'; }
  const hungry = why === null && (person.militia?.short || 0) >= SHORT_DAYS_HOME;
  const causeId = tell(world, person, hungry
    ? `${person.name} has had nothing of his own to eat for ${SHORT_DAYS_HOME} days, and the camp's beef is not enough to live on. He is walking home.`
    : why || `${person.name} left the volunteers and started home.`, { claimId: 'FIC-GONZ-1179', importance: 3 });
  if (person.militia) delete person.militia.short;
  const home = household.homeSiteId, mode = modeWith(world, person);
  try { beginTravel(world, person, home, causeId, 'home', mode); } catch (error) { if (mode === 'foot') throw error; beginTravel(world, person, home, causeId, 'home'); }
  return causeId;
}
/** Why this man cannot be sent home from the volunteers now, or null. Leaving is always allowed while he can walk. */
export function homeRefusal(world, household, person) {
  if (!person || person.householdId !== household.id) return 'That is not your family.';
  if (!atWar(world, person)) return `${person.name} is not away with the volunteers.`;
  const held = heldByBattle(world, person);
  if (held) return held;
  if (person.travel) return `${person.name} is on the road.`;
  if (person.health?.grave) return `${person.name} is too sick to get up.`;
  if (person.health?.condition === 'wounded') return `${person.name} is lying wounded.`;
  return null;
}

/** Home again: what is left in his pack goes into the store, and his powder and ball into the house's powder. */
function homeWith(world, household, person) {
  // Still promised and only at home for a while - Seguín's men waiting at home to ride, a man home for winter clothing
  // (sim/army.mjs `leaveArmy`) - he keeps what he carries for going back.
  if (servesNow(person) && !GONE.includes(person.health?.condition)) return;
  if (person.travel || person.location?.siteId !== household.homeSiteId) {
    // Off the war, but not home yet (on the road home): he still carries it.
    if (!GONE.includes(person.health?.condition)) return;
  }
  const m = person.militia;
  const food = round(m.pack || 0), rounds = Math.round(m.rounds || 0);
  if (!GONE.includes(person.health?.condition) && (food > 0 || rounds > 0)) {
    household.resources.food = round((household.resources.food || 0) + food);
    household.resources.powder = round((household.resources.powder || 0) + rounds);
    tell(world, person, `${person.name} is home${food > 0 ? ` with ${Math.round(food * 10) / 10} food left of what he carried` : ''}${rounds > 0 ? `${food > 0 ? ' and' : ' with'} ${rounds} powder and ball` : ''}, back into the house.`, { claimId: 'FIC-GONZ-1179' });
  }
  if (m.drilled) person.militia = { drilled: m.drilled };
  else delete person.militia;
}

/** Spend powder and ball in a fight: what he fired, from what he carried (`FIC-GONZ-1178`). */
export function spendRounds(world, person, most) {
  if (!person?.militia) return 0;
  const spent = Math.min(most, person.militia.rounds || 0);
  person.militia.rounds = (person.militia.rounds || 0) - spent;
  return spent;
}

// ------------------------------------------------------------------------------------------------- what he overhears

/**
 * The talk's war news and how far word has walked (sim/ambient.mjs `EXCHANGES`, `hearsayOf`), handed in by sim/world.mjs when it
 * loads (`hearNewsFrom`): imported here, sim/ambient.mjs would load the children's and the lesson's modules in the middle of the
 * chores' table, which they read as they load.
 */
const NEWS = { exchanges: [], hearsayOf: null };
export function hearNewsFrom({ exchanges, hearsayOf }) { NEWS.exchanges = exchanges; NEWS.hearsayOf = hearsayOf; }

/**
 * War news the country round about him has heard - by the hearsay of the place (sim/ambient.mjs `hearsayOf`: once word could
 * have walked there) - and his family has not, or has only as a rumour where the place is sure. Never anything the place has not:
 * no news leaks (docs/LIVING_INFORMATION.md). The first such, in the order the talk lists them, with its words.
 */
export function newsHere(world, household, person) {
  const { exchanges, hearsayOf } = NEWS;
  if (!hearsayOf) return null;
  const point = person.location?.siteId ? world.map.sites[person.location.siteId] || person.location : person.location;
  for (const line of exchanges) {
    if (!line.topic) continue;
    const topics = line.topic.endsWith(':') || line.topic.endsWith('-') ? Object.keys(world.truth || {}).filter(id => id.startsWith(line.topic)).sort() : [line.topic];
    for (const topic of topics) {
      const status = hearsayOf(world, topic, point);
      if (!status || !world.truth[topic]) continue;
      if (!wouldLearn(world, household.id, topic, status)) continue;
      return { topic, status, words: status === 'confirmed' ? line.lines : line.hedged || line.lines, line: line.id };
    }
  }
  return null;
}

/**
 * The talk he overhears in the camp (owner, 2026-10-05: "Players should be able to read the conversations they're having via
 * thought bubbles to learn what's going on in that area even if a rider wouldn't normally tell them"; `FIC-GONZ-1183`). Every
 * `OVERHEAR_TICKS` for a man of a played family standing in a camp, two of the men about him say what the place has heard and his
 * family has not (`newsHere`). It is said over two of the volunteers' camp's own men on the family's page (`overheardFor`), the
 * family knows it from then on as **heard it said** - the source says where - and the journal keeps the line. Only ever what
 * the place has heard: nothing the family's people could not have overheard there.
 */
export function overhear(world) {
  for (const household of Object.values(world.households || {})) {
    if (!watchedFamily(household)) continue;
    // One exchange a family at most every `OVERHEAR_TICKS` (`world.heardAt`, kept so a reload does not say it again at once).
    if (world.heardAt?.[household.id] !== undefined && world.tick - world.heardAt[household.id] < OVERHEAR_TICKS) continue;
    for (const id of household.members) {
      const person = world.entities[id];
      if (!overhearing(world, person)) continue;
      const heard = newsHere(world, household, person);
      if (!heard) continue;
      (world.heardAt ||= {})[household.id] = world.tick;
      learn(world, household.id, heard.topic, { status: heard.status, source: `Heard it said at ${place(world, person)}` });
      tell(world, person, `At ${place(world, person)}, ${person.name} heard men talking: "${heard.words[0]}" "${heard.words[1]}"`, { claimId: 'FIC-GONZ-1183' });
      (world.overheard ||= {})[household.id] = { tick: world.tick, personId: person.id, line: heard.line, words: [...heard.words] };
      break;
    }
  }
  for (const [householdId, said] of Object.entries(world.overheard || {})) if (world.tick - said.tick > OVERHEARD_TICKS) delete world.overheard[householdId];
  if (world.overheard && !Object.keys(world.overheard).length) delete world.overheard;
}

/**
 * Who can overhear: a volunteer away at the war (`atWar`) standing in the volunteers' camp or the army's - never on a road, in a
 * fight, or at home. Not an enlisted man (sim/winter.mjs `service`): the garrison shut in the Alamo, Fannin's men and Houston's are
 * the army's, whose word reaches their families by the war's own couriers and expresses (docs/BATTLES.md §2b.1: the family learns of
 * the fall "only when the word reaches them"). Found 2026-10-06: a man of the garrison "overheard" the siege and the fall, and his
 * family learned them through him days before the word - `test:battle-alamo` lost him falling.
 */
export function overhearing(world, person) {
  if (!atWar(world, person) || heldByBattle(world, person)) return false;
  if (inArmyCamp(world, person)) return true;
  return !person.travel && ['town', 'village'].includes(world.map?.sites?.[person.location?.siteId]?.kind);
}

/**
 * The family's own overheard exchange as town-scene lines (sim/town-scenes.mjs `townScenesFor`), over two of the volunteers' camp's
 * men drawn on its page, or over two of whoever stands nearest him: `speakers` are the ids the page draws. Null when nothing.
 */
export function overheardFor(world, householdId, speakers = []) {
  const said = world.overheard?.[householdId];
  if (!said || speakers.length < 2) return null;
  const at = Math.floor(share(world, `${householdId}:${said.tick}`, 'overheard-pair') * (speakers.length - 1));
  const pair = [speakers[at], speakers[at + 1]];
  return said.words.map((text, order) => ({ id: `overheard:${householdId}:${said.tick}:${order}`, pair: `overheard:${householdId}`, order, sceneId: 'volunteers-camp', speakerId: pair[order], text, kind: 'reconstructed', claimId: 'FIC-GONZ-1183', heard: true }));
}

// ------------------------------------------------------------------------------------------------------ what is shown

/** His row's facts (`FIC-GONZ-1176`): days of food in his pack, his rounds, his shelter. Absent for everybody not away at the war. */
export function militiaShown(world, person) {
  if (!atWar(world, person)) return {};
  const m = person.militia || {};
  return { militia: { days: m.since !== undefined ? packDays(world, person) : DEFAULT_PACK_DAYS, rounds: m.since !== undefined ? m.rounds || 0 : 2, ...(m.shelter && { shelter: m.shelter }), ...(m.drilled && { drilled: m.drilled }), ...(inCamp(world, person) && { camp: true }) } };
}

/** A saved militia record that cannot be, or null. Absent everywhere is correct: no class saved before has one. */
export function militiaInvalid(world) {
  for (const person of Object.values(world.entities || {})) {
    const m = person.militia;
    if (m === undefined) continue;
    if (!m || typeof m !== 'object') return 'Invalid militia';
    for (const key of ['pack', 'rounds', 'drilled', 'owed', 'short']) if (m[key] !== undefined && !(Number.isFinite(m[key]) && m[key] >= 0)) return 'Invalid militia';
    if (m.shelter !== undefined && !['brush', 'board'].includes(m.shelter)) return 'Invalid militia';
  }
  if (world.heardAt !== undefined && (!world.heardAt || typeof world.heardAt !== 'object' || Object.entries(world.heardAt).some(([id, tick]) => !world.households?.[id] || !Number.isInteger(tick)))) return 'Invalid militia';
  return null;
}
