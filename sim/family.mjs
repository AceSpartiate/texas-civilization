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

/**
 * The household, as authored.
 *
 * Four people, in the order they have always been built. `role` is the word the family
 * uses for them, and it is stated by the world rather than guessed from a name - this
 * project does not infer anything about a person from what they are called.
 *
 * This is the household nobody rolled: every household before a student joins, every
 * household nobody joins, and every class saved before rolling existed. A family a student
 * plays is rolled (`rolledPeople`, below) and may be one to six people.
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
// die when joining and the number is the family's size. Everything below is invented and
// registered as `FIC-GONZ-021`. It is all derived from the world's seed and the household,
// so a saved class reloads to the same family and a replay is exact, and nothing a student
// can see predicts it.

const unit = text => hashOf(text) / 4294967296;
/** A roughly normal draw from three uniform ones: mean 0, spread about 1, never past 3. */
const bell = text => (unit(`${text}:a`) + unit(`${text}:b`) + unit(`${text}:c`) - 1.5) / 0.5;

/** The die. One to six. */
export const familyRoll = (seed, householdId) => 1 + (hashOf(`${seed}:${householdId}:family-roll`) % 6);

/**
 * What a roll makes. **Never explained in the game** - the owner's direction is that a
 * student sees the dice and then the family, and works out the rest or does not.
 */
export function compositionFor(roll) {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new Error('A die shows one to six.');
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
 * A parent is 20 to 45, a second parent within eight years of the first and never under
 * 18. A child was born when the mother was 17 to 42 - for a lone father, a mother two years
 * younger than him - and no two children share an age. If the parents are too young for
 * that many children, the parents are older.
 */
export const PARENT_AGES = Object.freeze([20, 45]);
export const MOTHER_AT_BIRTH = Object.freeze([17, 42]);
export const CHILD_MAX_AGE = 17;
function agesFor(seed, householdId, parents, loneSex, children) {
  let first = PARENT_AGES[0] + (hashOf(`${seed}:${householdId}:age-1`) % (PARENT_AGES[1] - PARENT_AGES[0] + 1));
  let second = parents === 2 ? clamp(first + (hashOf(`${seed}:${householdId}:age-2`) % 17) - 8, [18, PARENT_AGES[1]]) : null;
  // The mother's age decides which children could be hers.
  const motherOf = () => parents === 2 ? second : loneSex === 'female' ? first : first - 2;
  const needed = MOTHER_AT_BIRTH[0] + Math.max(0, children - 1);
  if (motherOf() < needed) {
    const raise = needed - motherOf();
    first += raise;
    if (second !== null) second += raise;
  }
  const mother = motherOf();
  const low = Math.max(0, mother - MOTHER_AT_BIRTH[1]), high = Math.min(CHILD_MAX_AGE, mother - MOTHER_AT_BIRTH[0]);
  const possible = [];
  for (let age = low; age <= high; age++) possible.push(age);
  const kids = possible
    .sort((a, b) => hashOf(`${seed}:${householdId}:child-age:${a}`) - hashOf(`${seed}:${householdId}:child-age:${b}`))
    .slice(0, children)
    .sort((a, b) => b - a);
  return { parents: second === null ? [first] : [first, second], children: kids };
}

/**
 * Everybody a roll makes, in order: parents first, eldest child first.
 *
 * Ids are positional - `hh-3-parent-1`, `hh-3-child-2` - and, as with the founding four,
 * never change afterwards. The principal is the father when there is one and the lone parent
 * otherwise, because the historical calls are put to the principal and a lone mother is the
 * person the neighbour would ask. A lone parent is a man or a woman with equal chance.
 */
export function rolledPeople(seed, householdId, index, roll) {
  const { parents, children } = compositionFor(roll);
  const loneSex = parents === 1 ? (hashOf(`${seed}:${householdId}:lone-parent`) % 2 ? 'female' : 'male') : null;
  const ages = agesFor(seed, householdId, parents, loneSex, children);
  const deal = nameDealer(seed);
  const people = [];
  const parentSexes = parents === 2 ? ['male', 'female'] : [loneSex];
  parentSexes.forEach((sex, n) => {
    const role = sex === 'male' ? 'father' : 'mother';
    const id = `${householdId}-parent-${n + 1}`;
    people.push({ id, role, sex, age: ages.parents[n], name: deal(index, role), traits: dealTraits(seed, id, sex, ages.parents[n]) });
  });
  const sons = { son: 0, daughter: 0 };
  ages.children.forEach((age, n) => {
    const sex = hashOf(`${seed}:${householdId}:child-sex:${n}`) % 2 ? 'female' : 'male';
    const role = sex === 'male' ? 'son' : 'daughter';
    const id = `${householdId}-child-${n + 1}`;
    // A second son is not dealt the first son's name: each child takes the next card.
    const name = deal(index * 4 + sons[role]++, role);
    people.push({ id, role, sex, age, name, traits: dealTraits(seed, id, sex, age) });
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
  if (world.status !== 'lobby') return 'A family is rolled before the class begins.';
  // Everything that can happen to a person - a name, work, a road, a word with a rider - is
  // written into the family's record, so a record holding nothing but its founding is a
  // family nothing has happened to. A family renamed as a whole writes a memory too, and is
  // checked directly because it is the one change a student makes to the household itself.
  const untouched = !household.name
    && !world.events.some(event => event.householdId === household.id && event.type !== 'household-founded');
  return untouched ? null : 'A family is rolled before anybody in it is named or set to work.';
}

/** Old enough to be sent anywhere at all: given work, sent on a road, or asked a call. */
export const SENT_FROM_AGE = 10;
/** Old enough to be sent to fight. Boys of sixteen and seventeen did serve in 1835. */
export const FIGHTS_FROM_AGE = 16;
export const tooYoung = entity => Number.isFinite(entity?.age) && entity.age < SENT_FROM_AGE;
export const tooYoungWhy = entity => `${entity.name} is too young to be sent.`;

/** What a household is called. Absent means nobody has named it, so it is named for its own. */
export function householdName(world, household) {
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
  if (input.entityId) {
    const entity = world.entities[input.entityId];
    if (!entity || entity.householdId !== household.id || entity.kind !== 'person') throw new Error('Choose one of your family.');
    const was = entity.name;
    entity.name = sanitiseName(input.name);
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
 * Who this family is, for the family's own book.
 *
 * The answer to the question that started this: who is the mother, who is the father, and
 * whose children are these. Said in the household's own names, which are the student's.
 */
export function familyProjection(world, household) {
  const nameOf = id => world.entities[id]?.name || 'somebody';
  return {
    name: householdName(world, household),
    named: Boolean(household.name),
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
          ? `${kin.spouse ? `Married to ${nameOf(kin.spouse)}. ` : widowed}${Role} to ${children.join(' and ')}.`
          : parents.length ? `${Role} of ${parents.join(' and ')}.`
          : widowed ? 'Widowed, with no children.' : null;
      // Age is visible; the hidden stats are not, and are deliberately not read here at all.
      return { id, name: entity?.name || id, role: kin.role || null, of, ...(Number.isFinite(entity?.age) && { age: entity.age }) };
    }),
  };
}
