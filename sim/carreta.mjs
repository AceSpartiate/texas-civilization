// The carreta: an ox cart a family makes at home, from its own logs and a rawhide (owner, 2026-09-25, the second amendment of that
// day: "what was the cart thing that tejanos used? maybe we could use that? have it be something families can make at home? could
// work the same, just with reduced carrying capacity?"; docs/WOODS_AND_BUILDING.md §6.6, docs/SETTLING_IN.md §4b).
//
// **The record** (`HIST-TEX-443`). The vehicle of Mexican Texas was the ox cart on solid wooden wheels: in the Mexican towns up
// the Rio Grande "Carts with great, clumsy, solid wooden wheels were the only vehicles they had", and there "Rawhide entered into
// the construction of pretty much everything they used" (Smithwick, *The Evolution of a State*, p. 47); in Austin's colony a boy
// made "a miniature Mexican cart" by punching holes through the centre of two biscuits and putting in an axle (p. 18). Woodman's
// guide of 1835 has "the plank-wheeled vehicles now in use" in Texas (p. 44) and "the unhewn sticks which squeak in the holes of
// the plank wheels in common use" (p. 48) - an axle of wood, and the creak the carreta was known by. Harris, of the Brazos in 1834:
// "There was no one that made wagons or carts ... Some of the men sawed wheels from logs and made vehicles called trucks" (*QTSHA*
// 4:2, p. 114). And after the game's years, "Using oxcarts, Mexicans moved freight more rapidly and cheaply than their Anglo
// competitors" (TSHA, *Cart War*, of 1857). **Not found**: the word "carreta" in these sources, what one held, how long one took
// to make, or whether any iron went into it; so the recipe, its time and what it carries are the game's own (`FIC-GONZ-398`).
//
// **The rule** (`FIC-GONZ-398`): at home, with the felling axe, **three logs** from the family's pile - two wheels cut as rounds
// from one, the axle and the frame from the others, the poorest logs first - and **one hide** for the rawhide lashings, a person
// makes a carreta in `CARRETA_TICKS` of work. It is a vehicle like the wagon (`kind: 'wagon'`, `carreta: true`): an ox draws it,
// `userOf` holds it one person a use (sim/keeping.mjs), a harvest that wants the wagon takes it, the errand can go by it, the
// flight east loads it. It is smaller: **ten spaces** in the flight to a cart's twelve and a wagon's sixteen (sim/wagon.mjs
// `CARRETA_SPACE`), **twelve loads** on a trip to a wagon's twenty (sim/travel.mjs `CARRETA_CARRY`), and **two riders** beside its
// driver, as a cart (sim/company.mjs). It is drawn with the wagon's art (`stand-in:` in public/app.js, docs/ART_REQUESTS.md).
//
// **Every family may make one**, whatever its means - most of all a family that came with none. The game does not tell a Tejano
// family from an Anglo one (sim/family.mjs: every pool mixes the names), so the poor band's cart stays one kind of cart, and the
// carreta is a thing any family can make. The logs and the hide are taken when it is done, not when the work begins: called off,
// nothing is spent and nothing is made. One carreta at a time a family.
//
// Only a class on the second table of means (sim/means.mjs `secondTable`) is offered it, and only where the trees are counted and
// so logs lie in a pile (sim/woods.mjs `countsTrees`): every class of the real land.
// ceiling: on the invented country, which has no log pile, the carreta is not offered; a family there with no vehicle carries its
// crop in by hand (sim/chores.mjs `byHand`). The way out is the furniture chore's trip to the timber for a tree.
// ceiling: one person makes it, and a second is refused while it is being made; a house-raising's many hands are not modelled here.
import { registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { addBeast, beastsOf, yardSpot, BEASTS_MOST } from './beasts.mjs';
import { secondTable } from './means.mjs';
import { choosing } from './homesite.mjs';
import { countsTrees, woodsRule } from './woods.mjs';
import { CARRETA_CARRY, MODES, propertyId } from './travel.mjs';
import { CARRETA_SPACE, CART_SPACE, WAGON_SPACE } from './wagon.mjs';

/** Logs a carreta takes from the pile: two wheels from one, the axle and the frame from two more (`FIC-GONZ-398`). */
export const CARRETA_LOGS = 3;
/** Hides it takes, for the rawhide lashings (`FIC-GONZ-398`; Smithwick p. 47: "Rawhide entered into the construction of pretty much everything"). */
export const CARRETA_HIDES = 1;
/** Ticks of an ordinary hand's work to make one: four hours of 1835, a little more than a piece of furniture's (`FIC-GONZ-398`). */
export const CARRETA_TICKS = 12;
/** The logs it takes, poorest first: a wheel and an axle do not want wall timber. */
const LOG_ORDER = Object.freeze(['poor', 'sill', 'wall']);

const logsIn = household => LOG_ORDER.reduce((sum, use) => sum + (household.logs?.[use] ?? 0), 0);
const maker = (world, household) => household.members.map(id => world.entities[id]).find(person => person?.chore?.id === 'make-carreta') || null;

/** Whether this class offers the carreta at all: the second table, and a log pile to make it from. */
export const carretaOffered = world => secondTable(world) && countsTrees(woodsRule(world));

/** Why this family cannot make a carreta now, or null. Said in the plain words the refusal shows. */
export function carretaRefusal(world, household, entity = null) {
  if (world.status === 'lobby') return 'The family makes a carreta once the class has begun.';
  if (choosing(household)) return 'Choose where the house will stand first.';
  const already = maker(world, household);
  if (already && already !== entity) return `${already.name} is already making a carreta.`;
  if (beastsOf(world, household, 'wagon').length >= BEASTS_MOST) return 'The family has as many carts and wagons as it can keep.';
  if (household.tools?.axe === undefined) return 'A carreta wants the felling axe, and there is none in the house.';
  const logs = logsIn(household);
  if (logs < CARRETA_LOGS) return `A carreta wants ${CARRETA_LOGS} logs from the pile at the house: two wheels cut from one, the axle and the frame from the others. There ${logs === 1 ? 'is 1' : `are ${logs}`}. Fell and haul some first.`;
  if ((household.resources?.hides ?? 0) < CARRETA_HIDES) return 'A carreta is lashed together with rawhide, and there is no hide in the house. A hunt brings one home.';
  return null;
}

/**
 * The carreta made: the logs and the hide taken, and a new vehicle standing in the yard. Its id is the family wagon's when the
 * family has none (a family that came on foot, sim/means.mjs), so everything that reads the family's first vehicle by its id finds
 * it; else the next free one (sim/beasts.mjs `addBeast`). Returns it, or null when the logs or the hide went elsewhere meanwhile.
 */
export function makeCarreta(world, household, entity) {
  const why = carretaRefusal(world, household, entity);
  if (why) {
    record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-398', text: `${entity.name} could not finish the carreta: ${why}` });
    return null;
  }
  let left = CARRETA_LOGS;
  for (const use of LOG_ORDER) {
    const taken = Math.min(left, household.logs[use] ?? 0);
    household.logs[use] -= taken; left -= taken;
  }
  household.resources.hides -= CARRETA_HIDES;
  const site = world.map.sites[household.homeSiteId];
  const first = propertyId(household.id, 'wagon');
  let carreta;
  if (!world.entities[first]) {
    carreta = { id: first, kind: 'wagon', householdId: household.id, depth: 'aggregate', location: { x: site.x, y: site.y, siteId: site.id }, travel: null, condition: 'sound', borrowedBy: null };
    world.entities[first] = carreta;
    household.property = [...household.property, first];
  } else carreta = addBeast(world, household, 'wagon', null, { at: { x: site.x, y: site.y, siteId: site.id } });
  const made = beastsOf(world, household, 'wagon').filter(one => one.carreta).length;
  Object.assign(carreta, { carreta: true, name: made ? 'Second carreta' : 'Carreta' });
  carreta.location = { ...yardSpot(site, carreta), siteId: site.id };
  record(world, 'improvement', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-398',
    text: `${entity.name} made a carreta: two solid wheels cut from a log, an axle and a frame of wood, lashed with rawhide. An ox draws it, and it carries ${CARRETA_CARRY} loads, where a wagon carries ${MODES.wagon.carry}.`,
  });
  return carreta;
}

registerChores({
  'make-carreta': {
    name: 'Make a carreta', skill: 'hands', where: 'home', heavy: true, carreta: true,
    offered: world => carretaOffered(world),
    refusal: (world, household, entity) => carretaRefusal(world, household, entity),
    describe: `Make an ox cart at home: two solid wheels cut from a log, an axle and a frame from two more, lashed with rawhide. It wants the felling axe, ${CARRETA_LOGS} logs from the pile and a hide, and takes about ${Math.round(CARRETA_TICKS / 3)} hours. An ox draws it; it carries ${CARRETA_CARRY} loads to a wagon's ${MODES.wagon.carry}, holds ${CARRETA_SPACE} to a cart's ${CART_SPACE} and a wagon's ${WAGON_SPACE} when the family has to leave, and seats two beside its driver.`,
    steps: [
      { walk: 'yard', doing: 'laying out the logs for a carreta' },
      { work: CARRETA_TICKS, doing: 'cutting wheels from a log and shaping the axle' },
      { run: (world, household, entity) => { makeCarreta(world, household, entity); } },
    ],
  },
});
