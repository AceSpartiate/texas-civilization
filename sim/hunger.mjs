// Hunger and starvation: docs/HUNGER.md, the owner's words of 2026-09-30, changing the earlier answer ("Leave it"):
//
//   "player characters *can* die of starvation. players should have to ensure there's enough food. when you update this, also
//    update the ui to better facilitate player awareness of where the family resources stand and the severity of consequences
//    of running out. do it with highlights, colors, etc. don't use text and over explain."
//
// Until then nobody died of hunger at home; hunger only doubled the weight of a sickness (sim/disease.mjs `homeContext`).
//
// **One number a person carries** (`person.hunger.want`): days of want, counted wherever that person eats from the family's
// store - at home (sim/routines.mjs) and on the road east (sim/scrape.mjs) - by the share of the day's eating the family could
// not cover, times how hard hunger falls on that person (`hungerWeight`). A family that eats its fill wins it back
// (`RECOVER_PER_DAY`). The stages are read off it (`STAGES`): fed, hungry (the store is empty today), weak, starving, and death
// after a sustained stretch. Absent on everybody fed, which is the correct empty value: no class saved before changes, and no
// save version moved.
//
//   person.hunger?: { want: days, stage: 'fed' | 'hungry' | 'weak' | 'starving' }   absent: fed, nothing owed; 'fed' while
//                                                                           the want is being won back
//   person.health: { condition: 'dead', starved: true }                        died of hunger
//
// **Who** (`FIC-GONZ-996`): the weakest first - a baby, a small child, the old, the sick - and the family's children a little
// protected where somebody grown eats with them, since parents went short so that the children ate. **Whose**: only a family a
// student plays, and only while that student is at the screen (`FIC-GONZ-998`): a family nobody plays is the director's, which
// keeps it fed by its own rules (sim/neighbours.mjs: the hunt, the four works that cost no powder, the herd when down to the last
// day or two), and a family whose student has gone is the director's too - its want is held where it stood until the student is
// back. **When** (`FIC-GONZ-997`): never within a minute of real time of the person being said to be starving, on the clock the
// very sick are held by (sim/decision-budget.mjs, `QUESTION_BUDGETS.starve`), so a student at the screen always has the time to
// act. Every number here is the game's own (`FIC-GONZ-995`).
import { record } from './events.mjs';
import { ageNow, eatenADay, housekeepingSaving, sexOf } from './family.mjs';
import { shelterOf } from './houses.mjs';
import { furnitureShares } from './furniture.mjs';
import { limitLeft, limitOut } from './decision-budget.mjs';

const DAY = 1440;
const GONE = ['dead', 'captured'];

/** The claim IDs this module writes (HISTORY.md), in one place. */
export const CLAIMS = Object.freeze({ stages: 'FIC-GONZ-995', who: 'FIC-GONZ-996', hold: 'FIC-GONZ-997', director: 'FIC-GONZ-998', screen: 'FIC-GONZ-999' });

/**
 * The stages, in days of want at a weight of one (`FIC-GONZ-995`). A grown, well person with nothing at all to eat is weak after
 * five days, starving after ten and dead after sixteen. The record's figure for a grown person with water and nothing else is
 * weeks - commonly given as about three weeks to two months (docs/HUNGER.md §2) - and this is about a third of that, so that it
 * can happen inside the class periods a class plays: in the first period's campaign a calendar day passes in about twenty real
 * seconds at the Study pace, so sixteen days of want is five real minutes and more, and a family eating half its fill takes
 * twice as long. `hungry` is not a number: it is a day the family's store could not cover.
 */
export const WEAK_AT = 5, STARVING_AT = 10, DEATH_AT = 16;
/** Days of want a day of eating one's fill wins back: slower than it came would be truer, and would leave a fed family weak. */
export const RECOVER_PER_DAY = 2;
/** The stages, best first. `fed` is stored only while the want is being won back, and never sent to the page. */
export const STAGES = Object.freeze(['fed', 'hungry', 'weak', 'starving']);
/** Children eat first where somebody grown of the family eats with them: their want comes at this share (`FIC-GONZ-996`). */
export const CHILDREN_FIRST = 0.75;
/** How much longer a spell of family work takes someone weak, and someone starving (sim/chores.mjs). */
export const WORK_SLOWER = Object.freeze({ weak: 1.5, starving: 2 });
/** The share of their ordinary pace on a road, for somebody weak and somebody starving (sim/world.mjs `progressTravel`). */
export const STRIDE = Object.freeze({ weak: 0.75, starving: 0.5 });

const ageOf = (world, person) => { const age = ageNow(world, person); return Number.isFinite(age) ? age : 30; };
const grown = (world, person) => ageOf(world, person) >= 16;
const alive = person => person?.kind === 'person' && !GONE.includes(person.health?.condition);
const round = value => Math.round(value * 10000) / 10000;
/** A played family whose student is at the screen: the only one whose people's want grows (`FIC-GONZ-998`). */
export const watchedFamily = household => Boolean(household?.played && !household.absent);

/**
 * How hard a day short falls on this person (`FIC-GONZ-996`): the young and the old and the sick go down first. A baby under
 * two 2.5, a child under six 2, a child under sixteen 1.25, a grown person 1, somebody sixty or older 1.5; sick 1.5 times as
 * much again, very sick twice. A child eating with somebody grown of the family is fed first, at `CHILDREN_FIRST` of that.
 *
 * So, with nothing to eat at all and somebody grown at the fire, a baby dies after about eight and a half days, a small child
 * or an old person after about eleven, a grown person after sixteen and a child of ten after seventeen.
 */
export function hungerWeight(world, person, { withGrown = false } = {}) {
  const age = ageOf(world, person);
  let weight = age < 2 ? 2.5 : age < 6 ? 2 : age < 16 ? 1.25 : age >= 60 ? 1.5 : 1;
  if (age < 16 && withGrown) weight *= CHILDREN_FIRST;
  if (person.health?.condition === 'sick') weight *= person.health.grave ? 2 : 1.5;
  return weight;
}

/** A person's stage now: from their want, and whether the family's store went short this time they ate. */
function stageOf(want, short) {
  if (want >= STARVING_AT) return 'starving';
  if (want >= WEAK_AT) return 'weak';
  return short && want > 0 ? 'hungry' : 'fed';
}
export const stageIn = person => person?.hunger?.stage || 'fed';

/**
 * The eating of one stretch of the calendar, where it happens: `eaters` ate from the family's store, which needed `need` and had
 * `had` (the store and whatever came in over the stretch). Called by sim/routines.mjs for those at home and by sim/scrape.mjs
 * for those on the road east. The store itself is theirs to change; this only counts the want.
 */
export function ate(world, household, eaters, need, had, days) {
  if (!(days > 0) || !household?.played) return;
  const short = need > 0 && had < need ? Math.min(1, (need - Math.max(0, had)) / need) : 0;
  const people = eaters.filter(alive);
  const withGrown = people.some(person => grown(world, person));
  for (const person of people) {
    const was = person.hunger?.want || 0;
    if (!short && !was) { if (person.hunger) delete person.hunger; continue; }
    let want = was;
    // Held where it stood while the student is away (`FIC-GONZ-998`); won back by eating, whoever is at the screen.
    if (short) { if (!household.absent) want = Math.min(DEATH_AT, was + short * days * hungerWeight(world, person, { withGrown })); }
    else want = Math.max(0, was - RECOVER_PER_DAY * days);
    const stage = stageOf(want, short > 0);
    if (!want && stage === 'fed') { delete person.hunger; continue; }
    person.hunger = { want: round(want), stage };
  }
}

// ------------------------------------------------------------------------------------------------ the tick

const tell = (world, person, text, extra = {}) => record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.stages, text, ...extra });
const placeName = (world, siteId) => world.map?.sites?.[siteId]?.name || null;

/** The key of one person's minute on the real clock (sim/decision-budget.mjs): forgotten when they are no longer starving. */
export const starveLimitKey = person => `starve:${person.id}`;
/** Whether this person's minute is on the real clock: starving, in a family a student plays and is at the screen for. */
export const starveOnLimit = (world, person) => Boolean(alive(person) && person.hunger?.stage === 'starving' && watchedFamily(world.households?.[person.householdId]));
/** Whether that minute is still running: they cannot die of hunger yet (`FIC-GONZ-997`). */
export const starveHeld = (world, person) => starveOnLimit(world, person) && !limitOut(world, starveLimitKey(person));

/**
 * The tick's hunger, after the eating: each change of stage said once in the family's story, and the deaths. Somebody dies of
 * hunger only at `DEATH_AT`, in a played family at its screen, once their minute has run (`starveHeld`).
 */
export function advanceHunger(world) {
  for (const household of Object.values(world.households || {})) {
    if (!household.played) continue;
    const people = household.members.map(id => world.entities[id]).filter(alive);
    const told = household.hungerTold || {};
    let changed = false;
    const ran = people.some(person => stageIn(person) !== 'fed') && !people.some(person => told[person.id]);
    if (ran) record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.stages, text: 'The family has eaten the last of its food.' });
    for (const person of people) {
      const stage = stageIn(person), before = told[person.id] || 'fed';
      if (stage === before) continue;
      const worse = STAGES.indexOf(stage) > STAGES.indexOf(before);
      if (worse && stage === 'weak') tell(world, person, `${person.name} is weak with hunger.`);
      if (worse && stage === 'starving') tell(world, person, `${person.name} is starving.`, { importance: 3 });
      if (!worse && stage === 'fed' && STAGES.indexOf(before) >= STAGES.indexOf('weak')) tell(world, person, `${person.name} has eaten, and is getting ${sexOf(person) === 'female' ? 'her' : 'his'} strength back.`, { importance: 1 });
      if (stage === 'fed') delete told[person.id]; else told[person.id] = stage;
      changed = true;
    }
    for (const id of Object.keys(told)) if (!people.some(person => person.id === id)) { delete told[id]; changed = true; }
    if (changed || household.hungerTold) { if (Object.keys(told).length) household.hungerTold = told; else delete household.hungerTold; }
    if (!watchedFamily(household)) continue;
    for (const person of people) {
      if (person.hunger?.stage !== 'starving' || person.hunger.want < DEATH_AT || starveHeld(world, person)) continue;
      starve(world, household, person);
    }
  }
}

/** Death by hunger, by the same steps as a death by sickness (sim/disease.mjs `die`): one plain sentence, nothing drawn. */
function starve(world, household, person) {
  const flight = household.flight;
  const onRoad = person.travel && ['flee', 'return'].includes(person.travel.purpose);
  const site = person.location?.siteId || null;
  person.health = { condition: 'dead', starved: true };
  delete person.hunger;
  if (household.hungerTold) { delete household.hungerTold[person.id]; if (!Object.keys(household.hungerTold).length) delete household.hungerTold; }
  person.chore = null; person.task = 'rest'; person.travel = null;
  delete person.carriedBy; delete person.baby;
  person.location = { x: person.location.x, y: person.location.y, siteId: site || flight?.refuge || household.homeSiteId || 'gonzales' };
  const place = onRoad || !site ? null : site === household.homeSiteId ? 'home' : placeName(world, site);
  const text = onRoad
    ? `${person.name} died of hunger on the road, and was buried where they fell.`
    : `${person.name} died of hunger${place ? ` at ${place}` : ''}, and was buried there.`;
  record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.stages, text, hunger: 'died' });
}

/**
 * The winter nobody plays (sim/periods.mjs `beginSecondPeriod`): the family eats an ordinary winter (docs/COLONIES.md §7: "nobody
 * starves over time nobody could play"), so everybody comes out of it fed.
 */
export function recoverOverWinter(world) {
  for (const person of Object.values(world.entities || {})) if (person.hunger) delete person.hunger;
  for (const household of Object.values(world.households || {})) delete household.hungerTold;
}

// ------------------------------------------------------------------------------------------------ what it does to a person

/** How much longer a spell of family work takes them (sim/chores.mjs): 1 fed or hungry. */
export const hungerPace = person => WORK_SLOWER[person?.hunger?.stage] || 1;
/** The share of their pace on a road: the family's road east goes at its weakest walker's (sim/world.mjs `progressTravel`). */
export function hungerStride(world, entity) {
  const purpose = entity.travel?.purpose;
  if (['flee', 'return'].includes(purpose) && entity.householdId) {
    const household = world.households?.[entity.householdId];
    let least = 1;
    for (const id of household?.members || []) {
      const one = world.entities[id];
      if (one?.travel?.purpose === purpose) least = Math.min(least, STRIDE[one.hunger?.stage] || 1);
    }
    return least;
  }
  return entity.kind === 'person' ? STRIDE[entity.hunger?.stage] || 1 : 1;
}

/** Somebody who died of a sickness or of hunger: told in one plain sentence, not drawn, and a child never named on the projector. */
export const diedQuietly = person => person?.health?.condition === 'dead' && Boolean(person.health.disease || person.health.starved);

// ------------------------------------------------------------------------------------------------ a family handed to a student

/**
 * The days of its own eating a family is topped up to when a student takes it over from the director (owner, 2026-09-30, "A few
 * days' food"; `FIC-GONZ-998` as amended): the same three days a Mexican column leaves an overtaken family (sim/road.mjs
 * `LEFT_FOOD_DAYS`). A family the director runs never starves (above), so it can reach a student with an empty store - in a
 * winter class often none at all - and a student who took it over could lose people within a few real minutes.
 */
export const HANDOVER_DAYS = 3;

/**
 * Tops a family a student is taking over from the director up to `HANDOVER_DAYS` of its own eating (`dailyDraw`, rounded up to a
 * tenth): a late join into a family the director was running or had never played, and a student back at the screen of a family
 * the director ran while they were away - after a claim from the away list, a family key, or the page simply opening again
 * (sim/absence.mjs `setAbsent`, server/app.mjs `/api/join`). Returns the food added.
 *
 * **Never more than that, never less than the family has, and once a period.** Nothing is added to a family that already holds
 * three days' eating, so it tops up only a family whose want is at risk; and a family topped up once in a period
 * (`household.handoverFed`, the period) is not topped up again in it, so a student cannot farm food by closing the laptop for the
 * two minutes that make a family absent and opening it again. A family that did not need it keeps the chance for later in the
 * period. `ceiling:` once a period - a student who is away twice in one period and comes back both times to an empty store is fed
 * only the first time; the minute before hunger can kill still holds for them, and a per-handover rule would want the director to
 * have run the family for a while first, which is the way out if a class finds it.
 */
export function feedOnHandover(world, household) {
  if (!household?.resources || !household.played || world.status === 'lobby') return 0;
  const period = world.period || 1;
  if (household.handoverFed === period) return 0;
  const { eat } = dailyDraw(world, household);
  const floor = Math.ceil(eat * HANDOVER_DAYS * 10) / 10;
  const had = household.resources.food || 0;
  if (!(floor > had)) return 0;
  household.resources.food = floor;
  household.handoverFed = period;
  record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.director,
    text: `There is food in the house for a few days: ${Math.round(floor * 10) / 10} in all.` });
  return floor - had;
}

// ------------------------------------------------------------------------------------------------ what the page is sent

/** A person's stage, and while their minute runs its real time left, for the row and the "!"; nothing when fed. */
export function hungerShown(world, person) {
  const stage = stageIn(person);
  if (stage === 'fed' || !alive(person)) return {};
  const minute = stage === 'starving' && starveOnLimit(world, person) && !limitOut(world, starveLimitKey(person)) ? { leftMs: limitLeft(world, starveLimitKey(person), 'starve') } : {};
  return { hunger: { stage, ...minute } };
}

/**
 * What the family eats in a day, as the store is drawn on: at home by whoever is there (sim/routines.mjs), on the road east by
 * everybody with it (sim/scrape.mjs). Whoever is serving eats the army's rations. `make` is what comes in without an order, which
 * since 2026-10-02 is nothing (owner: working about the place makes no food; sim/routines.mjs).
 */
export function dailyDraw(world, household) {
  const people = household.members.map(id => world.entities[id]).filter(person => alive(person) && person.service?.status !== 'serving' && !person.visiting);
  const onRoad = household.flight && ['fled', 'refuged'].includes(household.flight.status);
  if (onRoad) return { eat: eatenADay(world, people), make: 0 };
  const housed = shelterOf(world, household).kind === 'house';
  const eat = eatenADay(world, people) * (1 - housekeepingSaving(people)) * furnitureShares(household, housed).eaten;
  return { eat, make: 0 };
}

/**
 * The family's food as a gauge (`FIC-GONZ-999`): the days its store lasts at what it eats less what working about the place brings
 * in (null while that brings in as much as it eats), and the worst stage among its people. The page colours it; it says no words.
 */
export function larderShown(world, household) {
  if (!household?.resources) return {};
  const { eat, make } = dailyDraw(world, household);
  const draw = eat - make;
  const food = Math.max(0, household.resources.food || 0);
  const days = draw > 0.0001 ? Math.round((food / draw) * 10) / 10 : null;
  const worst = household.members.map(id => world.entities[id]).filter(alive).reduce((low, person) => Math.max(low, STAGES.indexOf(stageIn(person))), 0);
  return { larder: { days, stage: STAGES[worst] } };
}

/** A saved hunger that cannot be, or null. */
export function hungerInvalid(world) {
  for (const person of Object.values(world.entities || {})) {
    const hunger = person.hunger;
    if (hunger !== undefined && (!hunger || typeof hunger !== 'object' || !Number.isFinite(hunger.want) || hunger.want < 0 || !STAGES.includes(hunger.stage))) return 'Invalid hunger';
    if (person.health?.starved !== undefined && (person.health.starved !== true || person.health.condition !== 'dead')) return 'Invalid hunger';
  }
  for (const household of Object.values(world.households || {})) {
    const told = household.hungerTold;
    if (told !== undefined && (!told || typeof told !== 'object' || Object.values(told).some(stage => !STAGES.slice(1).includes(stage)))) return 'Invalid hunger';
    if (household.handoverFed !== undefined && !Number.isInteger(household.handoverFed)) return 'Invalid hunger';
  }
  return null;
}
