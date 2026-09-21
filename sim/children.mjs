// What a child under ten can be set to: docs/FAMILY_CREATION.md §3 and its amendment of 2026-09-21. The history is
// `HIST-TEX-400` to `-403`; every rule the game makes out of it is `FIC-GONZ-300` to `-305`.
//
// Owner (2026-09-21): "Children should have action bars too. They should be able to play, and other things that kids would
// do." And the principle it comes from: "When I switch characters, the action bar at the bottom should switch to that
// person's bar. It shouldn't (unless there's a good reason) stop another character from doing their action."
//
// Before this a person under ten could do **nothing**. `sim/world.mjs` refused every order from them but `rename`, `rest`,
// `ask-rider` and `leave-rider`, and `choreAvailability` refused every chore, so their whole row on the family panel
// collapsed to one line saying they were too young (`rowReason`, public/family-panel.js). That is the rule of 2026-09-12 -
// "not to work, not on a road, not to answer for the family" - working exactly as written, and the owner has amended the
// first third of it: **play, and the small jobs a frontier child really did close to the house.** The other two thirds
// stand. Nothing here takes a child off the family's own land, nothing here puts an axe or a rifle in their hands, and
// nothing here lets a child answer for the family.
//
// Six works, and the ladder is the whole rule (`childWorks`, the one function every test in tests/children.test.mjs is
// about):
//
// | From | Work | What it does |
// | --- | --- | --- |
// | 2 | `child-play` | Nothing at all, on purpose. It is the child's own hour and the record says so. |
// | 5 | `child-kindling` | Nothing the game counts. |
// | 5 | `child-birds` | Nothing the game counts. |
// | 5 | `child-eggs` | **Food**, a little, once a day, and a little more for an older child. |
// | 7 | `child-water` | Nothing the game counts. |
// | 7 | `child-mind` | Lifts `BABY_BURDEN` off the parents while it lasts - the relief a cradle gives (sim/furniture.mjs). |
//
// **Why four of the six produce nothing.** `food`, `seed`, `powder`, `cotton`, `money` and `logs` are the whole ledger. Of
// the six works only the eggs are any of them. Water carried, kindling brought in and blackbirds kept off the corn have no
// column, and inventing `water` and `kindling` so that a child could add to a number would be inventing a resource where
// none is needed - and a number no rule reads is exactly the freight this codebase has been bitten by before (`level`, once
// sent for every chore for every person and read by nothing). So they add nothing, and each one's own words say so, which a
// twelve-year-old can read and check. The two that do produce use machinery that was already here: `food`, and the burden a
// baby with no cradle puts on a parent's heavy work.
//
// **And why the corn is not one of them.** Birds off the standing crop is a real effect and `harvestShare` is where it would
// go. It is deliberately left out (`FIC-GONZ-305`): a harvest that depended on a child at the field edge would make the
// child's work compulsory, and the owner asked for something a child *can* do, not a post the family has to staff.
//
// The works are registered into the one table (`registerChores`) and keep their rules here - `offered`, `refusal` and the
// `run` of the last step - the same three hooks sim/camp.mjs and sim/road.mjs use. Nothing is stored that an old save lacks
// a correct empty value for: `household.eggsDay` is absent until a family's children have gathered eggs, and absent reads as
// "not today". **No save version moves.**
import { registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { SENT_FROM_AGE } from './family.mjs';
import { BABY_UNDER } from './furniture.mjs';
import { share } from './shares.mjs';

const DAY = 1440;

/**
 * The youngest age each of the children's works is offered at, and with `SENT_FROM_AGE` the whole of the ladder.
 *
 * `FIC-GONZ-301`. Set against `HIST-TEX-400`, which has children put to small jobs about the house from about four or five -
 * fetching water, gathering fuel, minding the younger ones, keeping birds and stock off the growing crop - and to more of
 * them from six or seven. Two thresholds rather than five, because a table nobody can hold in their head is not a rule:
 *
 * - **Five** for the three that want nothing but a child's hands and eyes: an armful of chips, a basket under the hens, a
 *   voice at the edge of the corn.
 * - **Seven** for the two that want a child big enough to be trusted with something - a full pail, and a baby. A pail of
 *   water is about sixteen pounds and a five-year-old spills it; a five-year-old is somebody who has to be minded, not
 *   somebody who minds.
 * - **Two** for play, which is the bottom of the band. An infant under two has nothing here, and that is the owner's
 *   decision of 2026-09-21, not an oversight.
 * - **Ten** ends it for all six. At ten a person has the whole country's work (`SENT_FROM_AGE`), and this game does not
 *   pretend a fifteen-year-old on this frontier had an afternoon free. `HIST-TEX-403` is the reason it is not later: Texian
 *   children were trained early, and boys of fourteen and under were sent alone on errands of several days.
 */
export const CHILD_WORK_FROM = Object.freeze({
  'child-play': 2,
  'child-kindling': 5,
  'child-birds': 5,
  'child-eggs': 5,
  'child-water': 7,
  'child-mind': 7,
});
/** The children's works, in the order a row shows them: what is theirs first, then the jobs from youngest up. */
export const CHILD_WORKS = Object.freeze(['child-play', 'child-kindling', 'child-birds', 'child-eggs', 'child-water', 'child-mind']);
/** Whether this is one of the children's works. Read by sim/chores.mjs and sim/world.mjs, which gate on it. */
export const isChildWork = id => Object.hasOwn(CHILD_WORK_FROM, id);

/**
 * **The rule.** Which of the children's works this person's age allows, youngest first; empty for everybody else.
 *
 * Empty for an adult, for a youth of ten or more, for an infant under two, and for anybody the game knows no age for - the
 * founding four's children, who have never had one and whom every other age rule in this codebase also passes over
 * (`tooYoung`, `canAnswerCalls`). Nothing but age is asked here: whether the work can be *begun* is `childRefusal`, and
 * whether it is worth showing is `childOffered`.
 */
export function childWorks(entity) {
  if (!entity || entity.kind !== 'person') return [];
  const age = entity.age;
  if (!Number.isFinite(age) || age >= SENT_FROM_AGE) return [];
  return CHILD_WORKS.filter(id => age >= CHILD_WORK_FROM[id]);
}
/** Whether this person is old enough, and young enough, for this one work. */
export const oldEnoughFor = (entity, choreId) => childWorks(entity).includes(choreId);

/**
 * How much food a child brings in from the hens' nests: `FIC-GONZ-303`.
 *
 * A twentieth of a food more for each year over five, so a nine-year-old brings half a food and a five-year-old three tenths -
 * an older child reaches the nests under the house and in the brush that a small one does not know to look in. It is
 * deliberately small: once a day for the whole family, against a household that eats about three food a person, so no
 * family is ever better off putting its eight-year-old on the eggs than its father in the timber. That poultry is on the
 * place at all is `HIST-TEX-401`.
 *
 * ceiling: the flock itself is not modelled - no hens are counted, none can be bought, sold or lost, and nothing eats them.
 * A dooryard flock is assumed the way a cooking fire is. If hens ever become stock (docs/STOCK.md), this reads the count.
 */
export const EGGS_BASE = 0.3, EGGS_PER_YEAR = 0.05;
export const eggsFor = entity => Math.round((EGGS_BASE + Math.max(0, (entity?.age ?? 0) - CHILD_WORK_FROM['child-eggs']) * EGGS_PER_YEAR) * 10000) / 10000;

/** Which day of the class it is, for the hens, who lay once a day. */
const dayOf = world => Math.floor(world.minute / DAY);
/** Whether the family's nests have been gone round already today. Absent on every save made before this existed, which reads as "not today". */
export const eggsGathered = (world, household) => household?.eggsDay === dayOf(world);

/** Somebody under two at home, which is what a parent's baby burden is about (sim/furniture.mjs `mindingBaby`). */
const babyAtHome = (world, household) => household.members.some(id => {
  const person = world.entities[id];
  return person && Number.isFinite(person.age) && person.age < BABY_UNDER && person.health?.condition !== 'dead' && person.location?.siteId === household.homeSiteId;
});
/** Somebody small enough to be minded, and younger than the child doing the minding. */
const littleOnesAtHome = (world, household, entity) => household.members.some(id => {
  const person = world.entities[id];
  return person && person.id !== entity.id && Number.isFinite(person.age) && person.age < CHILD_WORK_FROM['child-water']
    && person.age < entity.age && person.health?.condition !== 'dead' && person.location?.siteId === household.homeSiteId;
});
/** Corn or cotton standing in the field: what there is for a bird to get at. */
const standing = household => ['planted', 'ripe'].includes(household.field?.state ?? 'bare');

/**
 * Whether this work is shown on this person's row at all.
 *
 * Age first, then the one condition that would otherwise be a dimmed icon on every row on every tick for a family that can
 * never use it - no little ones to mind, no crop in the ground. The rule this file keeps is sim/chores.mjs': a refusal
 * nobody can act on is freight, and a refusal somebody *can* act on is worth its place.
 */
export function childOffered(world, household, entity, choreId) {
  if (!oldEnoughFor(entity, choreId)) return false;
  if (choreId === 'child-mind') return littleOnesAtHome(world, household, entity);
  if (choreId === 'child-birds') return standing(household);
  return true;
}

/** Why this child cannot be set to this work now, in the words the control shows, or null. */
export function childRefusal(world, household, entity, choreId) {
  const age = entity?.age;
  if (!Number.isFinite(age)) return `The game does not know how old ${entity.name} is.`;
  if (age >= SENT_FROM_AGE) return `${entity.name} is ${age} now, and has the family's own work to do.`;
  if (age < CHILD_WORK_FROM[choreId]) return `${entity.name} is only ${age}, and too small for that.`;
  if (household.arriving) return 'The family is still coming in off the road.';
  if (choreId === 'child-mind' && !littleOnesAtHome(world, household, entity)) return `There is nobody smaller than ${entity.name} at home to mind.`;
  if (choreId === 'child-birds' && !standing(household)) return 'There is nothing standing in the field for the birds to get at.';
  if (choreId === 'child-eggs' && eggsGathered(world, household)) return 'The nests have been gone round today. The hens lay once a day.';
  return null;
}

/**
 * What a child at play did with their hour, in the game's own words.
 *
 * The owner asked for play to be *worth something on the screen* even though it produces nothing, so it writes the family's
 * record like any other work. Which of the six lines is written is a hashed share of the class, the child and the hour
 * (`share`, sim/shares.mjs), so a class replays the same and a saved class reloads to the same story. Nothing here can go
 * badly, so `FIC-GONZ-008` has nothing to say about it; the hash is for replay, not for risk.
 */
export const PLAYS = Object.freeze([
  name => `${name} spent the hour down at the water, and came back wet to the knees.`,
  name => `${name} rode a stick horse up and down the yard until it was worn out, or ${name} was.`,
  name => `${name} was off in the brush all morning on business nobody in the family was told about.`,
  name => `${name} built something out of sticks and bark behind the house and called it a fort.`,
  name => `${name} and the other children played at Indians and rangers, and nobody would be the rangers.`,
  name => `${name} lay on their back in the grass most of the hour, which is also what children do.`,
]);

const tell = (world, entity, text, claimId, extra = {}) => record(world, 'memory', {
  actorId: entity.id, householdId: entity.householdId, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text, ...extra,
});

const RUNS = {
  play(world, household, entity) {
    const line = PLAYS[Math.floor(share(world, entity.id, `play:${Math.floor(world.minute / 60)}`) * PLAYS.length) % PLAYS.length];
    tell(world, entity, line(entity.name), 'FIC-GONZ-300');
  },
  kindling(world, household, entity) {
    tell(world, entity, `${entity.name} brought in an armful of chips and bark for the fire.`, 'FIC-GONZ-305');
  },
  birds(world, household, entity) {
    tell(world, entity, `${entity.name} sat the morning at the edge of the corn and kept the blackbirds out of it.`, 'FIC-GONZ-305');
  },
  water(world, household, entity) {
    tell(world, entity, `${entity.name} carried water up to the house, a pail at a time, all morning.`, 'FIC-GONZ-305');
  },
  eggs(world, household, entity) {
    const got = eggsFor(entity);
    household.resources.food = Math.round(((household.resources.food ?? 0) + got) * 10000) / 10000;
    household.eggsDay = dayOf(world);
    tell(world, entity, `${entity.name} went round the hens' nests and brought in the eggs: ${got} food.`, 'FIC-GONZ-303');
  },
  mind(world, household, entity) {
    tell(world, entity, babyAtHome(world, household)
      ? `${entity.name} had the little ones all morning, and nobody else had to carry the baby.`
      : `${entity.name} had the little ones all morning, and they were out from underfoot.`, 'FIC-GONZ-304');
  },
};

/**
 * Whether one of this family's children is minding the little ones right now.
 *
 * Read by sim/furniture.mjs, where it cancels the burden a baby with no cradle puts on a parent's heavy work at home. The id
 * is written out rather than imported: sim/furniture.mjs is imported by sim/chores.mjs, which this file imports, and one
 * restated string is cheaper than making that arrow exist (the same trade `wagonAtHome` in sim/chores.mjs makes, and for the
 * same reason). If the id ever changes, `tests/children.test.mjs` fails on it.
 */
export const someoneMinding = (world, household) => household.members.some(id => world.entities[id]?.chore?.id === 'child-mind');

/** How long each work takes, in ticks of twenty minutes (`TICK_MINUTES`), before the pace a skill of one sets. `FIC-GONZ-302`. */
export const CHILD_WORK_TICKS = Object.freeze({ 'child-play': 3, 'child-kindling': 3, 'child-birds': 6, 'child-eggs': 1, 'child-water': 3, 'child-mind': 6 });

const work = (id, name, describe, doing, run) => ({
  id, name, skill: 'hands', where: 'home', child: true, describe,
  offered: (world, household, entity) => childOffered(world, household, entity, id),
  refusal: (world, household, entity) => childRefusal(world, household, entity, id),
  steps: [{ work: CHILD_WORK_TICKS[id], doing }, { run }],
});
registerChores(Object.fromEntries([
  work('child-play', 'Play',
    `An hour that is theirs: the creek, a stick horse, the other children. It makes nothing, costs nothing and is not a job. A child of this age has no work on this place, and this is what they would be doing with the hour instead.`,
    'playing about the place', RUNS.play),
  work('child-kindling', 'Gather kindling',
    `An hour round the yard and the wood pile with a basket: bark, chips and dead sticks for the fire. No axe — nothing here is cut, only picked up. It puts nothing in the family's store.`,
    'gathering kindling and chips', RUNS.kindling),
  work('child-birds', 'Keep the birds off the corn',
    `Two hours at the edge of the field with a stick and a loud voice, driving the blackbirds off the standing crop. It puts nothing in the family's store — what it saves, this game does not count — but it is a job the field wants and a child can do it.`,
    'keeping the birds off the corn', RUNS.birds),
  work('child-eggs', 'Gather the eggs',
    `A few minutes round the yard and under the house after the hens' nests. Eggs are food and they go in the house — a little, and an older child finds more nests than a small one. The hens lay once a day.`,
    'going round the hens’ nests', RUNS.eggs),
  work('child-water', 'Carry water',
    `An hour with a pail between the water and the house. It puts nothing in the family's store: how far this house stands from water is a fact about the land, and an hour's carrying does not move the creek.`,
    'carrying water to the house', RUNS.water),
  work('child-mind', 'Mind the younger ones',
    `Two hours with the little ones, in the yard and out from underfoot. While one of the children has the baby, a father or a mother does not: their heavy work at home goes at its full pace for as long as it lasts, the same relief a cradle gives.`,
    'minding the younger ones', RUNS.mind),
].map(chore => [chore.id, chore])));

/**
 * Whether this order is one a child under ten may be given (sim/world.mjs `applyAction`, which otherwise refuses everything
 * from them but a name, a rest and a word with a rider). Setting one of the children's works, and calling it off again -
 * a child who cannot stop what they were set to would be the only person in the family who could not.
 */
export const childAction = input => input?.action === 'stop-chore'
  || (input?.action === 'chore' && isChildWork(String(input.chore || '')));

/** A saved family's children's state that cannot be, or null. */
export function childrenInvalid(world) {
  for (const household of Object.values(world.households)) {
    if (household.eggsDay === undefined) continue;
    if (!Number.isInteger(household.eggsDay) || household.eggsDay < 0 || household.eggsDay > dayOf(world)) return 'Invalid egg day';
  }
  for (const entity of Object.values(world.entities)) {
    if (entity.chore && isChildWork(entity.chore.id) && !oldEnoughFor(entity, entity.chore.id)) return 'Child work by somebody it is not for';
  }
  return null;
}
