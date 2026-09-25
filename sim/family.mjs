// Who these people are to each other, and what a student may call them.
//
// The first person who played this asked who the mother and the father were, and the game
// had no answer - four names in a list, a `relationships: {}` that nothing ever wrote to,
// and every household in the class a copy of the same four names. VISION.md opens on
// "This is my family", and a family the game cannot describe is a roster.
//
// Two things live here. **Kin** is authored and fixed: a household is two parents and two
// children, and who is whose is a fact about these fictional people rather than anything
// inferred from a name. **Names** belong to the student. The two are kept apart on purpose:
//
//   - An entity's **id never changes.** `hh-1-thomas` is `hh-1-thomas` for the life of the
//     class however often somebody renames him, which is what CLAUDE.md means by stable
//     person IDs. Skills (`skillsFor`) and appearance (`visualVariant`) are derived from
//     the id, so renaming a person cannot change their face, their hands, or what they are
//     good at - and it should not.
//   - Which means the id keeps the founding name whatever the person is called now. A
//     student's Bartolo may be `hh-3-thomas` underneath. That is a little odd to read in a
//     log and it is the price of ids that never lie about identity.
//
// `FIC-GONZ-017` registers the kin structure and the name pools. Both are invented, both
// are personal-scale, and neither is offered as a demographic sample of anybody.
import { record } from './events.mjs';
import { appearanceOf, choicesFor, isParent, lookChosen, looksWords } from './appearance.mjs';
import { share } from './shares.mjs';
import { dateOf } from './clock.mjs';

/**
 * The household, as authored.
 *
 * Four people, in the order they have always been built. `role` is the word the family
 * uses for them, and it is stated by the world rather than guessed from a name - this
 * project does not infer anything about a person from what they are called.
 *
 * This is the household nobody rolled: every household before a student joins, every
 * household nobody joins, and every class saved before rolling existed. A family a student
 * plays is rolled (`rolledPeople`, below) and is as many people as the die shows: one to twenty since 2026-09-22.
 */
export const HOUSEHOLD_SHAPE = Object.freeze([
  { key: 'thomas', role: 'father' },
  { key: 'elena', role: 'mother' },
  { key: 'rosa', role: 'daughter' },
  { key: 'mateo', role: 'son' },
]);

export const ROLES = HOUSEHOLD_SHAPE.map(person => person.role);

/**
 * The pools every default name is dealt from.
 *
 * Invented placeholders. Each pool mixes Anglo and Tejano names, so a family comes out
 * mixed the way DeWitt's colony was - it was in Mexican Texas and a household there was
 * not uniformly Anglo, which is the same reason `sim/town.mjs` mixes the town's residents.
 * Nothing about a family's names can correlate with anything about its land, its skills or
 * its luck, because the draw knows about none of them.
 *
 * There is a pool per role, and that is a choice about **defaults reading naturally** and
 * nothing more. This project never infers anything about a person from their name - the
 * role is authored by the world, and a student may rename anybody to anything, which does
 * not change who they are to the rest of the family. A default that read "Mateo, daughter
 * of Asa and Nicolás" would be taken for a bug by a room of twelve-year-olds, and the game
 * would be spending their attention on its own plumbing.
 *
 * These are **not** the names of real colonists and no attempt is made to match any
 * register of them. `FIC-GONZ-001` has always said so of Thomas, Elena, Rosa and Mateo,
 * and it says so of these.
 */
export const NAME_POOLS = Object.freeze({
  father: Object.freeze(['Thomas', 'Asa', 'Ezra', 'Ignacio', 'Caleb', 'Amos', 'Nicolás', 'Bartolo', 'Feliciano', 'Ramón',
    'Elias', 'Vicente', 'Jethro', 'Anselmo', 'Hollis', 'Cipriano', 'Barnabas', 'Gregorio', 'Alvin', 'Trinidad']),
  mother: Object.freeze(['Elena', 'Manuela', 'Sarah', 'Refugia', 'Josefa', 'Antonia', 'Patience', 'Lucinda', 'Mahala', 'Rhoda',
    'Dorotea', 'Keziah', 'Ysabel', 'Temperance', 'Bernarda', 'Charity', 'Serafina', 'Almira', 'Paz', 'Drusilla']),
  daughter: Object.freeze(['Rosa', 'Delia', 'Paulita', 'Chana', 'Effie', 'Winnie', 'Loreta', 'Marcela', 'Petra', 'Soledad',
    'Adela', 'Minerva', 'Tomasa', 'Lavinia', 'Nieves', 'Orpha', 'Benita', 'Prudence', 'Ramona', 'Docia']),
  son: Object.freeze(['Mateo', 'Simeon', 'Jonas', 'Teodoro', 'Andrés', 'Basilio', 'Eli', 'Hiram', 'Obed', 'Pablo',
    'Marcos', 'Levi', 'Cayetano', 'Zadok', 'Rufino', 'Silvano', 'Jasper', 'Emeterio', 'Enos', 'Ruperto']),
});

/** The same avalanched hash `skillsFor` uses, so two draws never run in lockstep. */
function hashOf(text) {
  let hash = 2166136261;
  for (const character of String(text)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  hash ^= hash >>> 15; hash = Math.imul(hash, 2246822507); hash ^= hash >>> 13;
  return hash >>> 0;
}

/**
 * Names for a whole class, dealt rather than drawn.
 *
 * The first version hashed each household's id into a pool and took the remainder, which
 * is the obvious thing and was measurably bad: fifteen households produced seven distinct
 * mothers and a run of four consecutive fathers called Feliciano. A remainder of a hash is
 * not a shuffle, and a class of families sitting next to each other notices.
 *
 * So the pools are shuffled once per class - deterministically, from the world's own seed,
 * so the same seed always builds the same class - and then dealt in order. Fifteen
 * households get fifteen different fathers. Thirty get each name twice, which is not a
 * flaw: two families in one settlement sharing a given name is what places are like.
 */
export function nameDealer(seed) {
  const decks = Object.fromEntries(Object.entries(NAME_POOLS).map(([role, pool]) => [
    role,
    [...pool].sort((a, b) => hashOf(`${seed}:${role}:${a}`) - hashOf(`${seed}:${role}:${b}`)),
  ]));
  return (index, role) => decks[role][index % decks[role].length];
}

/**
 * What one household's four people are called when nobody has renamed them.
 *
 * `index` is the household's place in the class, counted from zero, and it is what makes
 * the deal a deal. Every household used to get the identical four names, which made a
 * class of fifteen families fifteen copies of one family and forced every message between
 * them to name the *household* so that "Thomas traded with Thomas" was not the whole
 * sentence.
 */
export function defaultNames(seed, index) {
  const deal = nameDealer(seed);
  return HOUSEHOLD_SHAPE.map(person => deal(index, person.role));
}

/** The kin of a household, keyed by entity id: who each person is, and to whom. */
export function kinFor(householdId) {
  const id = key => `${householdId}-${key}`;
  const [father, mother, daughter, son] = HOUSEHOLD_SHAPE.map(person => id(person.key));
  return {
    [father]: { role: 'father', spouse: mother, parents: [], children: [daughter, son] },
    [mother]: { role: 'mother', spouse: father, parents: [], children: [daughter, son] },
    [daughter]: { role: 'daughter', spouse: null, parents: [father, mother], children: [] },
    [son]: { role: 'son', spouse: null, parents: [father, mother], children: [] },
  };
}

// ---------------------------------------------------------------- the rolled family
//
// Owner direction, 2026-09-12, specified in docs/FAMILY_CREATION.md: a student rolls one
// die when joining, and the face decides the family (a twenty-sided die since 2026-09-14; since 2026-09-22 the number is
// the family's size again, as it was on six sides). Everything below is invented and
// registered as `FIC-GONZ-021`. It is all derived from the world's seed and the household,
// so a saved class reloads to the same family and a replay is exact, and nothing a student
// can see predicts it.

const unit = text => hashOf(text) / 4294967296;
/** A roughly normal draw from three uniform ones: mean 0, spread about 1, never past 3. */
const bell = text => (unit(`${text}:a`) + unit(`${text}:b`) + unit(`${text}:c`) - 1.5) / 0.5;

/** The die: twenty-sided since 2026-09-14 (owner). A class rolled before on a six-sided die keeps `household.die` absent. */
export const FAMILY_DIE = 20;
/**
 * Which table a roll is read on. Three have been used, and a saved class keeps its own, so a family is never re-read into a
 * different shape (no save version moved for any of them):
 *   - `d6`, 2026-09-12 to -14: one six-sided die, the number the family's size. `household.die` absent.
 *   - `d20-faces`, 2026-09-14 to -22: twenty sides, each face a set family (`FAMILY_FACES`). `household.die` 20, no table.
 *   - `d20-size`, since 2026-09-22 (owner: "if i roll a 20, there should be 18 kids. if i roll a 4 it's two parents and 2
 *     kids. each number over 4 is another kid"; and by multiple choice, "The roll is the family"): twenty sides, the number
 *     the family's size again. `household.die` 20 and `household.rollTable` 'd20-size'.
 */
export const FAMILY_TABLE = 'd20-size';
export const FAMILY_TABLES = Object.freeze(['d6', 'd20-faces', 'd20-size']);
/** The table this household's roll is read on: its own mark, or what the die it was rolled on says. */
export const tableOf = household => household?.rollTable ?? (household?.die === 20 ? 'd20-faces' : 'd6');
/** A roll as it is said: "a 6", but "an 8", "an 11", "an 18". */
/** Names in a sentence: "Marcos", "Marcos and Levi", "Marcos, Levi and Delia" - a family of eight children read "and" seven times. */
export const listWords = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
export const rolledWords = roll => `${[8, 11, 18].includes(roll) ? 'an' : 'a'} ${roll}`;
export const familyRoll = (seed, householdId) => 1 + (hashOf(`${seed}:${householdId}:family-roll`) % FAMILY_DIE);
/**
 * The second die, thrown with the first: what the family has to start with (owner, 2026-09-25: "introduce rolling for starting
 * wealth"; sim/means.mjs, docs/FAMILY_CREATION.md's amendment of that day). The same twenty sides, hashed from the class and the
 * household like the family's own roll and on a question of its own, so the two never run together.
 */
export const meansRoll = (seed, householdId) => 1 + (hashOf(`${seed}:${householdId}:means-roll`) % FAMILY_DIE);

/**
 * What each face made on the 2026-09-14 table, `d20-faces`, kept for classes rolled then, as [parents, children] (owner, 2026-09-14: bigger frontier families, and
 * fewer lone parents). One to five a lone parent with none to four children; six to twenty both parents with none to
 * eight, three to five most often. Set against the record that a white American woman bore about 6.5 children in 1830 and
 * 6.1 in 1840, a fifth of them dying in their first year, so a family still growing has three to five living and a large one
 * seven or eight (Haines, EH.net). The table itself is `FIC-GONZ-021`.
 */
export const FAMILY_FACES = Object.freeze([
  [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
  [2, 0], [2, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5], [2, 6], [2, 7], [2, 8],
]);

/**
 * What a roll makes, on the table named (`tableOf` a household). **Never explained in the game** - the owner's direction is
 * that a student sees the dice and then the family, and works out the rest or does not.
 *
 * On `d20-size` (now) and `d6` (the first) the number is the family: three or less one parent and the rest children, four
 * or more both parents and the rest children - the owner's own words of 2026-09-12, "three or less leaves the family with
 * one parent and the associated number of kids", carried up a twenty-sided die. A 20 is two parents and eighteen children.
 */
export function compositionFor(roll, table = FAMILY_TABLE) {
  if (!FAMILY_TABLES.includes(table)) throw new Error(`No family table ${table}.`);
  const most = table === 'd6' ? 6 : FAMILY_DIE;
  if (!Number.isInteger(roll) || roll < 1 || roll > most) throw new Error(`A die shows one to ${most === 6 ? 'six' : 'twenty'}.`);
  if (table === 'd20-faces') {
    const [parents, children] = FAMILY_FACES[roll - 1];
    return { parents, children };
  }
  return roll <= 3 ? { parents: 1, children: roll - 1 } : { parents: 2, children: roll - 2 };
}

/**
 * The hidden stats. Means differ by sex and every person is dealt their own, with a spread
 * wide enough that the ranges overlap - the owner's decision, and closer to the frontier
 * record than a fixed bonus would be. None of these numbers is a claim about men and women;
 * they are tuned for play, and nothing may present them otherwise.
 */
export const TRAIT_MEANS = Object.freeze({
  male: Object.freeze({ strength: 7, health: 12, housework: 4 }),
  female: Object.freeze({ strength: 5, health: 9, housework: 7 }),
});
export const TRAIT_SPREAD = Object.freeze({ strength: 1.8, health: 2.5, housework: 1.8 });
export const TRAIT_RANGE = Object.freeze({ strength: [1, 10], health: [2, 18], housework: [1, 10] });
/** Strength and health reach adult values at sixteen; keeping a house comes later. */
export const ADULT_AT = 16;
const clamp = (value, [low, high]) => Math.max(low, Math.min(high, value));
export function dealTraits(seed, id, sex, age) {
  const traits = {};
  for (const trait of Object.keys(TRAIT_SPREAD)) {
    const adult = TRAIT_MEANS[sex][trait] + TRAIT_SPREAD[trait] * bell(`${seed}:${id}:${trait}`);
    const grown = trait === 'housework' ? Math.min(1, age / 18) : Math.min(1, age / ADULT_AT);
    const floor = trait === 'health' ? 0.3 : 0.1;
    traits[trait] = clamp(Math.round(adult * Math.max(floor, grown)), TRAIT_RANGE[trait]);
  }
  return traits;
}

/**
 * How old everybody is, and never a family that could not exist.
 *
 * A parent is 20 to 45, a second parent within eight years of the first and never under 18. A child was born when the mother
 * was 17 to 42 - for a lone father, a mother two years younger than him - and when the father was at least 18 (2026-09-22).
 * A child is 0 to 17, except in a family too large for that (below): its eldest may be grown and still at home, to 22.
 *
 * **Since 2026-09-22 everybody has a birth date, and children are born at natural intervals rather than one a year**
 * (owner, by Astra's handoff: "Remove artificial one-child-per-year spacing in generated histories without requiring
 * twins"). Until then a child's age was dealt as a whole number and no two children could share one, which made every large
 * family a birth exactly every twelve months. Now each birth follows the one before by 1.4 to 3 years, the eldest first; two
 * births of one mother are never closer than about ten months (`SHORTEST_GAP`), and only a family too large for anything else
 * comes near that. About one birth in a hundred is twins (`TWIN_SHARE`): two children, each their own
 * person with their own name, born the same day. Whether a child is the twin of the one before is `share` of the seed, that
 * child's id and 'twin' (`FIC-GONZ-008`: nothing hidden and nothing punitive is drawn from a stream).
 *
 * Fitting the births to the parents, in this order, least surprising first:
 *   1. **Older parents.** If the mother (or the father) is too young for the births at their natural spacing, both parents
 *      are made older - or the father alone, while he stays within eight years of her - up to 45.
 *   2. **Younger parents** if the mother is so old that her youngest could not be under eighteen.
 *   3. **Grown children still at home.** If eighteen years of childhood cannot hold the births at their natural spacing,
 *      the eldest may be 18 to 22, unmarried and at home (`GROWN_AT_HOME`), and 1 and 2 are tried again for that.
 *   4. **Closer births.** If that still cannot hold them, every gap is drawn in towards ten months by the same share.
 *   5. And only if even ten-month gaps do not fit, the parents are made older past 45, as they always were.
 * Measured over 40,000 rolls (2026-09-22): every family of seven children or fewer is under eighteen, as before; one family
 * of eight in a hundred has a grown eldest, a third of families of nine, most of ten and nearly every larger one. A roll of
 * 20 is eighteen children born over about twenty years, fourteen to sixteen months apart on average but never evenly - a
 * year of age missed here and there, twins in about one family in six - the eldest 18 to 22, to a mother of 37 to 42 and
 * a father of 41 to 45 (docs/FAMILY_CREATION.md §3).
 */
export const PARENT_AGES = Object.freeze([20, 45]);
export const MOTHER_AT_BIRTH = Object.freeze([17, 42]);
export const CHILD_MAX_AGE = 17;
/**
 * The oldest a son or daughter is, still at home and unmarried, in a family whose births will not fit in eighteen years at
 * their natural spacing (2026-09-22, `FIC-GONZ-363`). Every family of seven children or fewer is under eighteen as before.
 * A grown son or daughter is a person like any other of sixteen or more: eats a full share, may answer a call, and a son may
 * be sent to the fighting.
 */
export const GROWN_AT_HOME = 22;
/** The youngest a father is at a child's birth (2026-09-22). A lone father is always old enough: his children's mother is two years younger. */
export const FATHER_AT_BIRTH = 18;
/** Years from one birth to the next, when nothing crowds them: `FIC-GONZ-361`. */
export const BIRTH_GAP = Object.freeze([1.4, 3]);
/** The closest two births of one mother ever come, in years: about ten months (`FIC-GONZ-361`). */
export const SHORTEST_GAP = 0.85;
/** The share of births that are twins: one in a hundred, the owner's proposed figure of 2026-09-22 (`FIC-GONZ-362`). */
export const TWIN_SHARE = 0.01;
/** The day a family is rolled against when no other is given: the dawn of September 28, 1835, when the first class begins. */
export const ROLL_DAY = Date.UTC(1835, 8, 28);
const DAY_MS = 86400000, YEAR_DAYS = 365.2425;
/** How far inside every limit a birth is kept, in years, so turning years into whole days can never step over one. */
const EDGE = 0.03;
const midnight = when => { const on = new Date(when); return Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), on.getUTCDate()); };
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);
/** A birth date `years` before `day`, as 'YYYY-MM-DD'. */
const bornBefore = (day, years) => isoDay(day - Math.round(years * YEAR_DAYS) * DAY_MS);
/** How old somebody born on `born` ('YYYY-MM-DD') is on `when`, in whole years: one more on each birthday. */
export function ageOnDay(born, when) {
  const [year, month, date] = String(born).split('-').map(Number);
  const on = new Date(when);
  const passed = on.getUTCMonth() + 1 > month || (on.getUTCMonth() + 1 === month && on.getUTCDate() >= date);
  return on.getUTCFullYear() - year - (passed ? 0 : 1);
}

function birthsFor(seed, householdId, parents, loneSex, children, on) {
  const key = `${seed}:${householdId}`;
  let first = PARENT_AGES[0] + (hashOf(`${key}:age-1`) % (PARENT_AGES[1] - PARENT_AGES[0] + 1));
  let second = parents === 2 ? clamp(first + (hashOf(`${key}:age-2`) % 17) - 8, [18, PARENT_AGES[1]]) : null;
  // The part of a year past each parent's last birthday, so a birthday falls on a day of its own.
  const firstPart = 0.05 + 0.9 * unit(`${key}:born-part-1`), secondPart = 0.05 + 0.9 * unit(`${key}:born-part-2`);
  // Eldest first. `twin[k]`: child k was born the same day as child k - 1. Never three at once.
  const twin = Array.from({ length: children }, () => false);
  // A family of n children has n - 1 chances for a child to be the twin of the one before; each is taken a little more
  // often than one in a hundred, n / (n - 1) times, so that one *birth* in a hundred is twins whatever the family's size.
  const chance = children > 1 ? TWIN_SHARE * children / (children - 1) : 0;
  for (let k = 1; k < children; k++) twin[k] = !twin[k - 1] && share({ seed }, `${householdId}-child-${k + 1}`, 'twin') < chance;
  const drawn = twin.map((same, k) => (k === 0 || same ? 0 : BIRTH_GAP[0] + (BIRTH_GAP[1] - BIRTH_GAP[0]) * unit(`${key}:birth-gap-${k}`)));
  const natural = drawn.reduce((sum, gap) => sum + gap, 0);
  const shortest = twin.filter((same, k) => k > 0 && !same).length * SHORTEST_GAP;
  // The years in which this family's children could have been born, counted back from today: `low` to `high` years ago.
  let eldest = CHILD_MAX_AGE;
  const window = () => {
    const firstAge = first + firstPart, secondAge = second === null ? null : second + secondPart;
    const mother = parents === 2 ? secondAge : loneSex === 'female' ? firstAge : firstAge - 2;
    const father = parents === 2 ? firstAge : null;
    const limits = { childhood: eldest + 1 - EDGE, mother: mother - MOTHER_AT_BIRTH[0] - EDGE, father: father === null ? Infinity : father - FATHER_AT_BIRTH - EDGE };
    const high = Math.min(limits.childhood, limits.mother, limits.father);
    return { low: Math.max(0, mother - MOTHER_AT_BIRTH[1] - 1 + EDGE), high, bound: Object.keys(limits).find(name => limits[name] === high) };
  };
  const fit = (span, capped) => {
    for (let step = 0; step < 100; step++) {
      const { low, high, bound } = window();
      if (high - low >= span) return true;
      if (bound === 'childhood') {
        // All of childhood is open already; only a younger mother, whose youngest could then be younger, gives more.
        if (low <= 0) return false;
        first -= 1; if (second !== null) second -= 1;
      } else if (bound === 'father' && first < second + 8 && (!capped || first < PARENT_AGES[1])) first += 1;
      else if (!capped || Math.max(first, second ?? 0) < PARENT_AGES[1]) { first += 1; if (second !== null) second += 1; }
      else return false;
    }
    return false;
  };
  // Children under eighteen at their natural spacing; if they will not fit, the eldest grown and still at home, up to
  // `GROWN_AT_HOME`; and only then closer births, and parents past 45.
  if (!fit(natural, true)) {
    eldest = GROWN_AT_HOME;
    if (!fit(natural, true)) fit(shortest, false);
  }
  const { low, high } = window();
  if (high - low < shortest - 1e-9) throw new Error(`No parents fit ${children} children.`);
  // Every gap drawn in by the same share when natural spacing will not fit in the years there are - to fill 60 to 95 in 100
  // of the room past the closest spacing, not all of it, so a large family's eldest is not always just short of eighteen
  // and its youngest born the day the die is rolled.
  const room = high - low - shortest;
  const squeeze = natural > high - low ? room * (0.6 + 0.35 * unit(`${key}:squeeze`)) / (natural - shortest) : 1;
  const gaps = drawn.map((gap, k) => (gap ? SHORTEST_GAP + (gap - SHORTEST_GAP) * squeeze : 0));
  const span = gaps.reduce((sum, gap) => sum + gap, 0);
  const years = [];
  if (children) years[children - 1] = Math.max(low, low + (high - low - span) * unit(`${key}:youngest`));
  for (let k = children - 1; k > 0; k--) years[k - 1] = years[k] + gaps[k];
  const day = midnight(on);
  const person = exact => { const born = bornBefore(day, exact); return { born, age: ageOnDay(born, day) }; };
  return {
    parents: (second === null ? [first + firstPart] : [first + firstPart, second + secondPart]).map(person),
    children: years.map(person),
  };
}

/**
 * Everybody a roll makes, in order: parents first, eldest child first.
 *
 * Ids are positional - `hh-3-parent-1`, `hh-3-child-2` - and, as with the founding four,
 * never change afterwards. The principal is the father when there is one and the lone parent
 * otherwise, because the historical calls are put to the principal and a lone mother is the
 * person the neighbour would ask. A lone parent is a man or a woman with equal chance.
 */
export function rolledPeople(seed, householdId, index, roll, table = FAMILY_TABLE, on = ROLL_DAY) {
  const { parents, children } = compositionFor(roll, table);
  const loneSex = parents === 1 ? (hashOf(`${seed}:${householdId}:lone-parent`) % 2 ? 'female' : 'male') : null;
  const ages = birthsFor(seed, householdId, parents, loneSex, children, on);
  const deal = nameDealer(seed);
  const people = [];
  const parentSexes = parents === 2 ? ['male', 'female'] : [loneSex];
  parentSexes.forEach((sex, n) => {
    const role = sex === 'male' ? 'father' : 'mother';
    const id = `${householdId}-parent-${n + 1}`;
    const { age, born } = ages.parents[n];
    people.push({ id, role, sex, age, born, name: deal(index, role), traits: dealTraits(seed, id, sex, age) });
  });
  const sons = { son: 0, daughter: 0 };
  ages.children.forEach(({ age, born }, n) => {
    const sex = hashOf(`${seed}:${householdId}:child-sex:${n}`) % 2 ? 'female' : 'male';
    const role = sex === 'male' ? 'son' : 'daughter';
    const id = `${householdId}-child-${n + 1}`;
    // A second son is not dealt the first son's name: each child takes the next card, a twin as much as any other, so no two
    // of one family share a first name (twenty cards a pool, and eighteen children at most).
    const name = deal(index * 4 + sons[role]++, role);
    people.push({ id, role, sex, age, born, name, traits: dealTraits(seed, id, sex, age) });
  });
  const parentIds = people.filter(person => person.role === 'father' || person.role === 'mother').map(person => person.id);
  const childIds = people.filter(person => person.role === 'son' || person.role === 'daughter').map(person => person.id);
  for (const person of people) {
    const isParent = parentIds.includes(person.id);
    person.kin = isParent
      ? { role: person.role, spouse: parentIds.find(other => other !== person.id) || null, parents: [], children: childIds }
      : { role: person.role, spouse: null, parents: parentIds, children: [] };
  }
  return people;
}

/**
 * Why this family may not roll now, or null if it may.
 *
 * Once, and first. Rolling replaces the household's people, so it is refused after anything
 * has happened to them - a name given, work set, a road taken - because those things are
 * about people who would no longer exist.
 */
export function rollRefusal(world, household) {
  if (household.roll) return 'Your family has already rolled.';
  // Before the class begins - or, for a family somebody plays that has never rolled, whenever they come to it: Play Solo deals a
  // game already running and leaves the die to the player (owner, 2026-09-17: "when did i roll for family size?"). What a class
  // does is unchanged: Start rolls every joined family that never rolled, so nobody meets this later.
  if (world.status !== 'lobby' && !household.played) return 'A family is rolled before the class begins.';
  // Everything that can happen to a person - a name, work, a road, a word with a rider - is
  // written into the family's record, so a record holding nothing but its founding is a
  // family nothing has happened to. A family renamed as a whole writes a memory too, and is
  // checked directly because it is the one change a student makes to the household itself.
  const untouched = !household.name
    && !world.events.some(event => event.householdId === household.id && event.type !== 'household-founded');
  return untouched ? null : 'A family is rolled before anybody in it is named or set to work.';
}

/**
 * Whether this family is still being made and may yet be: rolled, given its last name, and each parent's looks chosen - what
 * the curtain in public/creation.js asks, the names card aside, which keeps what the game dealt if nothing is changed.
 *
 * Play Solo holds its clock while this is true (server/app.mjs `tick`; owner, 2026-09-18, by multiple choice: "hold"). The
 * world writes the family's arrival on its second tick, which closes the die (`rollRefusal`), so a page slower than that to
 * open was never offered it. A family that has not rolled and may not - a game kept from before the hold - is not held: it
 * could never be made, and the world would never move.
 */
export function familyMaking(world, household) {
  if (!household) return false;
  if (!household.roll) return rollRefusal(world, household) === null;
  if (!household.name && !household.surname) return true;
  return household.members.some(id => isParent(world.entities[id]) && !lookChosen(world.entities[id]));
}

/**
 * How old somebody looks, in the bands a glance can tell apart. Sent to a client instead of an
 * exact age for anybody outside the family - standing near a neighbour's child tells you it is
 * a small child, not that it is three. Absent for somebody with no stated age.
 */
export function ageBand(age) {
  if (!Number.isFinite(age)) return null;
  return age < 2 ? 'infant' : age < 5 ? 'small' : age < 10 ? 'child' : age < 18 ? 'youth' : 'adult';
}

/**
 * A man or a woman, as the world has said it: a rolled person's own `sex`, or else what their place in the family says.
 *
 * The founding four (`HOUSEHOLD_SHAPE`: every household nobody joins, and every class saved before rolling) have no `sex`
 * field, but the world states each one's role, and a father or a son is a man and a mother or a daughter a woman. That is
 * read from the role the world authored, never from a name (the rule at the top of `NAME_POOLS`); sim/appearance.mjs,
 * sim/alamo.mjs and sim/winter.mjs already read it this way. Until 2026-09-24 the projections sent only the stated field, so
 * the page drew the founding four by a hash of their id and a far family's mother, Antonia (`hh-9-elena`), was an old man.
 * Null for somebody the world says nothing of here (a townsperson: sim/town.mjs `seenAs` answers for them).
 */
const SEX_OF_ROLE = Object.freeze({ father: 'male', son: 'male', mother: 'female', daughter: 'female' });
export const sexOf = entity => entity?.sex || SEX_OF_ROLE[entity?.kin?.role] || null;
/**
 * Roughly how old somebody looks (`ageBand`), or for the founding four, who have no age, what their role makes them: a
 * parent is grown, and a son or daughter is drawn as an adolescent.
 * ceiling: the founding four's children have no stated age, so 'youth' is the game's choice for them, not a fact - it is the
 * band whose rules they already follow (old enough to be given work, `tooYoung` false; too young to answer a call,
 * `canAnswerCalls`). Giving the founding four ages would settle it, and would change who may be sent in every such class.
 */
export function bandOf(entity) {
  if (Number.isFinite(entity?.age)) return ageBand(entity.age);
  const role = entity?.kin?.role;
  return role === 'father' || role === 'mother' ? 'adult' : role === 'son' || role === 'daughter' ? 'youth' : null;
}

/** Old enough to be sent anywhere at all: given work, sent on a road, or asked a call. */
export const SENT_FROM_AGE = 10;
/** Old enough to be sent to fight. Boys of sixteen and seventeen did serve in 1835. */
export const FIGHTS_FROM_AGE = 16;
export const tooYoung = entity => Number.isFinite(entity?.age) && entity.age < SENT_FROM_AGE;
/**
 * Who may answer a call for the family - carry its food, go and see, go upriver.
 *
 * Owner direction, 2026-09-12: any parent, and any child of sixteen or over. A household the
 * game knows no ages for is the founding four, whose children have no stated age; only its
 * parents answer. A person the game cannot describe at all answers only if they are the
 * principal, which is what every call used to be.
 */
export function canAnswerCalls(entity) {
  if (!entity || entity.kind !== 'person') return false;
  const role = entity.kin?.role;
  if (role === 'father' || role === 'mother') return true;
  if (Number.isFinite(entity.age)) return entity.age >= FIGHTS_FROM_AGE;
  return Boolean(entity.principal);
}
export const cannotAnswerWhy = entity => `${entity.name} is too young to answer for the family.`;

/**
 * Who may be sent to the fighting: whoever may answer a call, and not a woman (owner, 2026-09-16: "Women did not participate
 * in battle. Actual combat shouldn't be a presented option for them"). This replaces the earlier rule that a woman could be
 * sent at a cost to the family's glory (docs/MONEY_AND_GLORY.md §4): the option is not offered. It gates turning out for a
 * force, riding upriver to Gonzales, the winter's enlistments, the garrison, the expedition, the relief and Houston's army.
 * Going to see, helping, the vote's own rule, the road east and every chore are untouched.
 */
export const canFight = entity => canAnswerCalls(entity) && entity.sex !== 'female';
export const cannotFightWhy = entity => entity.sex === 'female' ? `${entity.name} does not go to the fighting; in 1835 that was the men's.` : cannotAnswerWhy(entity);

/**
 * How much longer the family's food lasts for the best housekeeper at home.
 *
 * Step 3 of docs/FAMILY_CREATION.md. Nothing for a housekeeping of three or less, rising to
 * a quarter at ten. Only somebody actually at home keeps the house, so a family that sends
 * its housekeeper to Gonzales eats through its store faster while they are gone - which is
 * the whole of what "less likely to be sent to battle" means in play: nobody is stopped from
 * going, and the family feels it. Invented (`FIC-GONZ-021`), and hidden: no control states it.
 */
export const HOUSEKEEPING_FLOOR = 3, HOUSEKEEPING_STEP = 0.035, HOUSEKEEPING_MOST = 0.25;
export function housekeepingSaving(people) {
  const best = Math.max(0, ...people.map(person => person.traits?.housework ?? 0));
  return Math.min(HOUSEKEEPING_MOST, Math.max(0, (best - HOUSEKEEPING_FLOOR) * HOUSEKEEPING_STEP));
}

// ---------------------------------------------------------------- what a family eats
//
// Owner, 2026-09-22: "Children's food consumption: ages 0–2 use 25% of an adult portion, 3–9 use 50%, 10–15 use 75%, and
// 16+ use 100%. Preserve fractional totals." And by Astra's handoff the same day: "Food is game balance in adult-equivalent
// units ... aggregate before rounding, preferably using fixed-point quarters. These are tuning values, not nutritional
// advice." Until then everybody ate the same 0.35 a day, a newborn as much as the father.
//
// **Every place a family eats reads these and nothing else**: the day's eating at home (sim/routines.mjs), the winter
// nobody plays (sim/periods.mjs), the road east (sim/scrape.mjs), and the neighbours' director deciding it is short
// (sim/neighbours.mjs). A household's quarters are summed as whole numbers first and turned into food once, so four babies
// eat exactly one grown person's share and nothing is ever rounded away. `FIC-GONZ-360`.

/** What one grown person eats in a day, in the game's units of food (`FIC-GONZ-008`): the figure since 2026-09-09. */
export const ADULT_RATION = 0.35;
/** Quarters of a grown person's share, by age: [the oldest age in the band, quarters]. Sixteen and over eats four. */
export const RATION_BANDS = Object.freeze([Object.freeze([2, 1]), Object.freeze([9, 2]), Object.freeze([15, 3])]);
export const FULL_QUARTERS = 4;
/** Quarters of a share for somebody of this age. No stated age - the founding four, a townsman - eats a grown share. */
export function quartersFor(age) {
  if (!Number.isFinite(age)) return FULL_QUARTERS;
  return RATION_BANDS.find(([oldest]) => age <= oldest)?.[1] ?? FULL_QUARTERS;
}

/**
 * When somebody was born, as 'YYYY-MM-DD'. Stored on everybody rolled since 2026-09-22.
 *
 * A person rolled before has an `age` and no date, and is given one here - never written back, so nothing in an old save
 * changes: the same age on the day the class began (`dateOf` minute 0), and a birthday on a day of the year hashed from the
 * seed and their id. Nobody is re-dealt. Absent for somebody with no stated age.
 *
 * ceiling: a family rolled in Play Solo after the class began had its ages dealt on that day, not minute 0, so its first
 * birthday may come a few weeks early or late. Only its eating reads a birthday, and only by a quarter of a share for a child
 * crossing a band. Worth undoing only if old saves ever show a person's birthday.
 */
export function bornOf(world, entity) {
  if (typeof entity?.born === 'string') return entity.born;
  if (!Number.isFinite(entity?.age)) return null;
  const start = new Date(dateOf(world, 0));
  const before = 1 + Math.floor(unit(`${world.seed}:${entity.id}:birthday`) * 364);
  return isoDay(Date.UTC(start.getUTCFullYear() - entity.age, start.getUTCMonth(), start.getUTCDate()) - before * DAY_MS);
}
/** How old somebody is on the world's date now - one more on each birthday - or null for somebody with no stated age. */
export function ageNow(world, entity, minute = world.minute) {
  const born = bornOf(world, entity);
  return born === null ? null : ageOnDay(born, dateOf(world, minute));
}
/** Quarters of a grown share these people eat today, summed as whole numbers. */
export const quartersEaten = (world, people) => people.reduce((sum, person) => sum + quartersFor(ageNow(world, person)), 0);
/** How many grown people these eat as, today: four babies are one. Exact: a count of quarters over four is never rounded. */
export const mouthsOf = (world, people) => quartersEaten(world, people) / FULL_QUARTERS;
/** What these people eat in a day, before housekeeping and furniture. */
export const eatenADay = (world, people) => mouthsOf(world, people) * ADULT_RATION;
/**
 * How long heavy work takes this person, as a multiple of what it would otherwise take.
 *
 * Breaking ground, cutting a crop and splitting rails. A strength of about five is the old
 * pace; the strongest take three quarters as long and the weakest a quarter as long again.
 * Somebody with no hidden strength - the founding four - works at exactly the old pace.
 * Invented (`FIC-GONZ-021`), and hidden.
 */
export function heavyWorkPace(entity) {
  const strength = entity?.traits?.strength;
  if (!Number.isFinite(strength)) return 1;
  return Math.min(1.25, Math.max(0.75, 1.25 - (strength - 1) * 0.055));
}
export const tooYoungWhy = entity => `${entity.name} is too young to be sent.`;

/**
 * The family's main person: the one the student directs on the roads, about the place and in the house
 * (docs/FAMILY_PANEL.md §11.3, owner 2026-09-16: "If any character (that's old enough) is selected as the main person
 * (only one at a time) then they can be sent on travelling").
 *
 * `household.mainId` is the student's choice, set by `set-main`; absent on every class saved before there was one, which
 * reads as the principal, so no save version moved. Resolved on every read rather than rewritten on a death: a chosen
 * person who has died or been captured gives way to the principal if they can act, otherwise to the oldest living member
 * old enough to be sent, so a family with anybody left is never without one. Somebody in the army or on a road is still
 * the main person: their army questions are the detailed work the owner chose them for.
 */
export function mainPersonId(world, household) {
  const usable = id => {
    const entity = id && world.entities?.[id];
    return Boolean(entity) && entity.kind === 'person' && household.members.includes(id)
      && !['dead', 'captured'].includes(entity.health?.condition) && !tooYoung(entity);
  };
  if (usable(household.mainId)) return household.mainId;
  if (usable(household.principalId)) return household.principalId;
  // Oldest first; a founding family has no ages and keeps the household's own order.
  const left = household.members.filter(usable);
  return left.sort((a, b) => (world.entities[b].age ?? -1) - (world.entities[a].age ?? -1))[0] ?? null;
}

/** What a household is called. Absent means nobody has named it, so it is named for its own. */
export function householdName(world, household) {
  if (household.surname) return `the ${household.surname} family`;
  if (household.name) return household.name;
  const principal = world.entities?.[household.principalId];
  return principal?.name ? `${principal.name}'s family` : 'Your family';
}

/** How long a name may be, and what may be in one. */
export const NAME_LIMIT = 24;

/**
 * A name a student typed, made safe to show to the rest of the class.
 *
 * This is text one child types and another child reads, which is a thing worth being
 * deliberate about. Nothing here judges what a name means - that is a teacher's job and
 * no code can do it - but the shape is held: letters, marks, spaces and the punctuation
 * names actually contain, one line, and short. Every rename is written into the family's
 * own record as well, so a teacher who needs to see what was changed can.
 */
export function sanitiseName(raw) {
  const text = String(raw ?? '')
    .normalize('NFC')
    // Whitespace first, and every kind of it. A newline between two names is a space
    // between two names; striking it out before collapsing glued them into one word,
    // which is a different person.
    .replace(/\s+/gu, ' ')
    // Then anything that is not a letter, a combining mark, a space or the punctuation
    // names actually contain. This takes out control characters, direction overrides and
    // emoji together, and it is a shape rule rather than a judgement about meaning.
    .replace(/[^\p{L}\p{M} '\-.]/gu, '')
    .replace(/ +/g, ' ')
    .trim()
    .slice(0, NAME_LIMIT)
    .trim();
  if (!text || !/\p{L}/u.test(text)) throw new Error('A name needs at least one letter.');
  return text;
}

/**
 * One of this family renamed, or the family itself.
 *
 * Only ever this household's own people. A student renaming a neighbour would be writing
 * in somebody else's book, and the same rule that keeps one family from commanding
 * another keeps it from naming them.
 */
export function rename(world, household, input) {
  if (input.surname !== undefined && !input.entityId) return nameFamily(world, household, input.surname);
  if (input.entityId) {
    const entity = world.entities[input.entityId];
    if (!entity || entity.householdId !== household.id || entity.kind !== 'person') throw new Error('Choose one of your family.');
    const was = entity.name;
    // A family with a last name: the box is the first name, and the last name stays the family's.
    if (household.surname) { entity.given = sanitiseName(input.name); entity.name = `${entity.given} ${household.surname}`; }
    else entity.name = sanitiseName(input.name);
    if (entity.name === was) return entity.name;
    record(world, 'memory', {
      actorId: entity.id, householdId: household.id, importance: 1,
      text: `${was} is called ${entity.name} now.`,
    });
    return entity.name;
  }
  const was = householdName(world, household);
  household.name = sanitiseName(input.name);
  if (household.name === was) return household.name;
  record(world, 'memory', {
    householdId: household.id, importance: 1,
    text: `The family is called ${household.name} now, not ${was}.`,
  });
  return household.name;
}

/**
 * The family's last name (owner, 2026-09-17: "It shouldn't say 'Our family is called' it should say 'Family Last Name' and
 * that last name should be added to the members of the family as such").
 *
 * Kept apart from each person's first name (`given`), so renaming Thomas never touches it and renaming the family renames
 * everybody in it: every person's `name` is their first name and the family's last name, which is what every sentence in
 * the game already says. The family is "the García family" to the rest of the class (`householdName`). A family's first
 * naming is asked for by a box the page will not close until it is answered, once the die is rolled.
 */
export function nameFamily(world, household, raw) {
  if (!household.roll && household.played) throw new Error('Roll the die to find out who your family is before naming it.');
  const surname = sanitiseName(raw);
  const was = household.surname;
  if (surname === was) return surname;
  // Set once (owner, 2026-09-17: "The last name and looks are set once, in the pop-ups").
  if (was) throw new Error(`The family's last name is ${was}, and it is kept.`);
  household.surname = surname;
  delete household.name;
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || person.kind !== 'person') continue;
    person.given ??= person.name;
    person.name = `${person.given} ${surname}`;
  }
  record(world, 'memory', {
    householdId: household.id, importance: 1,
    text: `The family took the last name ${surname}.`,
  });
  return surname;
}

/**
 * Who this family is, for the family's own book.
 *
 * The answer to the question that started this: who is the mother, who is the father, and
 * whose children are these. Said in the household's own names, which are the student's.
 */
export function familyProjection(world, household) {
  const nameOf = id => world.entities[id]?.name || 'somebody';
  return {
    name: householdName(world, household),
    named: Boolean(household.name || household.surname),
    ...(household.surname && { surname: household.surname }),
    // The number on the die, once there is one. Whether a family may still roll is the
    // server's to say, like every other control.
    roll: household.roll ?? null,
    canRoll: !household.roll && rollRefusal(world, household) === null,
    people: household.members.map(id => {
      const entity = world.entities[id];
      const kin = entity?.kin || {};
      const parents = (kin.parents || []).map(nameOf);
      const children = (kin.children || []).map(nameOf);
      // Said in sentences rather than left to be worked out from a graph. Somebody asked
      // who the mother and the father were; they did not ask for a family tree to read.
      const Role = kin.role ? kin.role[0].toUpperCase() + kin.role.slice(1) : null;
      const parent = kin.role === 'father' || kin.role === 'mother';
      // A lone parent in a rolled family is widowed, and the book says so rather than leaving
      // a student to wonder where the other one went.
      const widowed = parent && !kin.spouse && Number.isFinite(entity?.age) ? 'Widowed. ' : '';
      const of = !kin.role ? null
        : children.length
          ? `${kin.spouse ? `Married to ${nameOf(kin.spouse)}. ` : widowed}${Role} to ${listWords(children)}.`
          : parents.length ? `${Role} of ${parents.join(' and ')}.`
          : widowed ? 'Widowed, with no children.' : null;
      // Age is visible; the hidden stats are not, and are deliberately not read here at all.
      // How they look, in words and as the choices behind them (sim/appearance.mjs). Only a parent's can be chosen.
      const looks = appearanceOf(world, entity);
      return { id, name: entity?.name || id, ...(entity?.given && { given: entity.given }), role: kin.role || null, of, ...(Number.isFinite(entity?.age) && { age: entity.age }),
        ...(looks && { appearance: looks, looks: looksWords(looks), ...(isParent(entity) && { choices: choicesFor(entity), chosen: lookChosen(entity), sex: sexOf(entity) }) }) };
    }),
  };
}
