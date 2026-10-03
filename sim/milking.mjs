// Milking the cow: a chore a child can do, at home and on the road east (owner, 2026-10-02, answering the food builder's second
// question, verbatim: "yes, but make it a chore that kids can do. on the road it can be done by adults and set to auto.";
// docs/STOCK.md §9, docs/HUNGER.md §10a, `FIC-GONZ-1073`).
//
// Two works on the one chore table (`registerMilking`, called from sim/world.mjs as the flight's works are), one for each place the
// family's milk cow can be:
//
// | Work | Where | Who | The cow | Once a day | Yields |
// | --- | --- | --- | --- | --- | --- |
// | `milk-cow` Milk the cow | at home, on the family's own land | anybody of seven or more (`MILK_FROM_AGE`), a child's job or a grown person's | cattle in the family's herd (sim/stock.mjs `herdOf`) | `household.milkDay` | `MILK_AT_HOME` food |
// | `milk-road` Milk the cow | on the road east, at a crossing or the refuge, and on the road home | the same | the milk cow driven along (sim/flight-work.mjs `flight.cow`) | `flight.cow.milkedDay` | `MILK_A_DAY` food, nothing on a day she strayed |
//
// - **No cow, no milking.** A family with no cattle at home is offered the work greyed with its want - a cow - only where its own town
//   has the stock pens to buy one at (sim/shops.mjs `stockman`, "Buy a cow and calf"), the owner's "every gettable lack"
//   (docs/FAMILY_PANEL.md §23); otherwise it is not offered at all. On the road a family with no cow along is never offered it: there
//   is no buying one on the road. A child is offered it only where there is a cow: a child does not go to town.
// - **One cow, once a day**, under the same daily rule as gathering (sim/gathering.mjs): *"The cow has been milked today; she gives
//   once a day."* `ceiling:` one milk cow however big the herd - a family milks one cow, and a second wants another pair of hands in
//   the yard every evening; worth counting cows only if a dairy ever comes into the game.
// - **Children's work too**: from seven, the age the children's ladder trusts with a full pail (sim/children.mjs `CHILD_WORK_FROM`),
//   a job the child may dawdle over (sim/obedience.mjs) and one a child on auto takes up (sim/childhood.mjs `JOBS_FIRST`). On the road
//   a child may milk too - the child who drives the cow is the one beside her (the owner named the grown people for the road; nothing in
//   the road's rules keeps a child of seven from a pail). Anybody of ten and over may be set to it on auto (sim/auto.mjs `REPEATED`), at
//   home and on the road, and a person on auto at home goes on milking on the road with the cow along.
// - Until 2026-10-02 the cow on the road gave her milk by herself, every day she was with the family (sim/flight-work.mjs `milkCow`).
//   Now somebody has to milk her; the child's rope and her straying are as they were.
//
// Invented, every number (`FIC-GONZ-1073`): no source read gives a Texas family's milk in 1835, and a cow kept at home gives more than
// one driven all day on the road.
import { registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { tooYoung } from './family.mjs';
import { herdOf } from './stock.mjs';
import { tradesAt } from './shops.mjs';
import { MILK_A_DAY } from './flight-work.mjs';
import { beginsJob } from './obedience.mjs';

/** What one cow gives at home in a day, milked: a grown person's share (sim/family.mjs `ADULT_RATION`, 0.35). */
export const MILK_AT_HOME = 0.35;
/** The youngest who may milk: seven, the children's ladder's age for a full pail (sim/children.mjs). */
export const MILK_FROM_AGE = 7;
/** The two works. */
export const MILK_WORKS = Object.freeze(['milk-cow', 'milk-road']);
const CLAIM = 'FIC-GONZ-1073';

const dayOf = world => Math.floor((world.minute || 0) / 1440);
const ageOf = entity => (Number.isFinite(entity?.age) ? entity.age : 30);
/** The family's cow at home: cattle in its herd. */
export const cowAtHome = household => herdOf(household).cattle > 0;
/** The milk cow on the road with the family (sim/flight-work.mjs `takeCow`), while it is on the road, at a refuge or going home. */
export const cowOnRoad = household => Boolean(household?.flight?.cow) && ['fled', 'refuged', 'returning'].includes(household.flight.status);
/** Whether this person is on the road with the family and its cow: going east or home with it, or camped with it at the refuge. */
const withTheCow = (household, entity) => ['flee', 'return'].includes(entity.travel?.purpose)
  || (!entity.travel && Boolean(household.flight?.refuge) && entity.location?.siteId === household.flight.refuge);
/** Whether the family is at home, as the home's work reads it: no flight, or home again, or told to leave and not gone. */
const atHome = household => !household.flight || ['home', 'ordered', 'stayed'].includes(household.flight.status);
/** Whether the family's own town has the stock pens, where a cow and calf can be bought (sim/shops.mjs `stockman`). */
const cowToBuy = (world, household) => world.status !== 'lobby' && tradesAt(world, household.settlementId || 'gonzales').includes('stockman');
/** Whether this cow has been milked today. */
export const milkedToday = (world, household, where) => (where === 'road' ? household.flight?.cow?.milkedDay : household.milkDay) === dayOf(world);

/** Whether the work is on this person's bar: old enough, the family where the cow is, and a cow - or a grown person's way to one. */
function offered(where) {
  return (world, household, entity) => {
    if (ageOf(entity) < MILK_FROM_AGE) return false;
    if (where === 'road') return cowOnRoad(household);
    if (!atHome(household) || household.arriving) return false;
    return cowAtHome(household) || (!tooYoung(entity) && cowToBuy(world, household));
  };
}
/** Why not now, in the control's words, or null. */
function refusal(where) {
  return (world, household, entity) => {
    if (ageOf(entity) < MILK_FROM_AGE) return `${entity.name} is only ${ageOf(entity)}, and too small to milk a cow.`;
    if (where === 'road') {
      if (!cowOnRoad(household)) return 'The family has no milk cow with it.';
      if (!withTheCow(household, entity)) return `${entity.name} is not with the family and the cow.`;
      if (household.flight.cow.strayDay === dayOf(world)) return 'The milk cow got away into the brush today, and was found too late to milk.';
    // Away from home first, before the cow: this refusal is asked ahead of the table's own "not at home"
    // (sim/chores.mjs `choreAvailability`), and a person in Gonzales refused for want of a cow kept the work on the bar as a
    // goal, over the town's scene at 1024x600 (the overlap proof, 2026-10-02). Away, it is refused like any home work, and hidden.
    } else if (entity.location?.siteId !== household.homeSiteId) return `${entity.name} is not at home.`;
    else if (!cowAtHome(household)) return NO_COW;
    if (milkedToday(world, household, where)) return 'The cow has been milked today; she gives once a day.';
    return null;
  };
}
const NO_COW = 'The family has no cow to milk.';
/** The gettable want: a cow, bought at the stock pens, for a family at home with none - only when that is why it is refused. */
const lacks = where => (world, household, entity, why) => (where === 'home' && why === NO_COW ? { cow: [0, 1] } : null);

/** The day's milk, said once a day in the family's record. */
function milk(where) {
  return (world, household, entity) => {
    if (refusal(where)(world, household, entity)) return;
    const day = dayOf(world);
    if (where === 'road') household.flight.cow.milkedDay = day; else household.milkDay = day;
    const amount = where === 'road' ? MILK_A_DAY : MILK_AT_HOME;
    household.resources.food = Math.round(((household.resources.food ?? 0) + amount) * 10000) / 10000;
    record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIM,
      text: `${entity.name} milked the cow: ${amount} food.` });
  };
}

const describe = where => (where === 'road'
  ? `A few minutes with a pail beside the milk cow at the day's halt. She gives a little on the road, ${MILK_A_DAY} food, once a day; nothing on a day she strays into the brush. A child of seven or a grown person may milk her, and anybody of ten or more may be set to it on auto.`
  : `A few minutes with a pail in the cow pen, morning or evening. One cow gives ${MILK_AT_HOME} food a day, milked once a day. A child of seven can do it as well as anybody, and a grown person may be set to it on auto.`);

let registered = false;
/** The two works join the one table here, called from sim/world.mjs, as the flight's works do. */
export function registerMilking() {
  if (registered) return;
  registered = true;
  const work = where => ({
    name: 'Milk the cow', skill: 'hands', where, child: true, job: true, milk: where,
    ...(where === 'road' && { road: true, moving: true }),
    describe: describe(where),
    offered: offered(where),
    // Read by `choreAvailability` for a refusal it keeps on the bar greyed (sim/chores.mjs `lacking`, `chore.lacks`).
    refusal: refusal(where),
    lacks: lacks(where),
    // A child's job may be dawdled over (sim/obedience.mjs); a grown person's is begun at once.
    begin: (world, household, entity) => { if (tooYoung(entity)) beginsJob(world, household, entity, 'milking the cow'); },
    steps: [{ work: 1, doing: 'milking the cow' }, { run: milk(where) }],
  });
  registerChores({ 'milk-cow': work('home'), 'milk-road': work('road') });
}

/** A saved day of milking that cannot be, or null. Absent on every class saved before, which reads as not milked today. */
export function milkingInvalid(world) {
  for (const household of Object.values(world.households || {})) {
    if (household.milkDay !== undefined && !Number.isInteger(household.milkDay)) return 'Invalid milking day';
    const cow = household.flight?.cow;
    if (cow?.milkedDay !== undefined && !Number.isInteger(cow.milkedDay)) return 'Invalid milking day';
  }
  return null;
}
