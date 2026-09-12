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
 * ceiling: every household is this same shape. VISION.md §12 asks that different families
 * be genuinely different and §7 allows four to seven people, so a widowed parent with
 * three children, or two siblings farming together, are the obvious next variations. They
 * are not here because `principalId`, the id scheme and a great many tests all assume four
 * people in this order, and changing the shape is a larger piece of work than naming them.
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
    people: household.members.map(id => {
      const entity = world.entities[id];
      const kin = entity?.kin || {};
      const parents = (kin.parents || []).map(nameOf);
      const children = (kin.children || []).map(nameOf);
      // Said in sentences rather than left to be worked out from a graph. Somebody asked
      // who the mother and the father were; they did not ask for a family tree to read.
      const Role = kin.role ? kin.role[0].toUpperCase() + kin.role.slice(1) : null;
      const of = !kin.role ? null
        : children.length
          ? `${kin.spouse ? `Married to ${nameOf(kin.spouse)}. ` : ''}${Role} to ${children.join(' and ')}.`
          : parents.length ? `${Role} of ${parents.join(' and ')}.` : null;
      return { id, name: entity?.name || id, role: kin.role || null, of };
    }),
  };
}
