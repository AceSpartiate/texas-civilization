// The surprise at Béxar: what the families hear before Santa Anna reaches the town, the alarm there on February 23, 1836,
// and the true story - the Mexican army's snow march - told at the ending (docs/battle-research/surprise-at-bexar.md).
//
// Owner, 2026-09-26: "i thought that part of the reason the texians were so unprepared was they knew about the snows and
// presumed that Santa Anna wouldn't march until after they broke. if that's true, then news appropriate to that, but not that
// he's marching. players should be shocked and scared when he's spotted, close to Bexar and texas is unprepared." And, by
// multiple choice: the true story of the snow march goes to the teacher "At the ending".
//
// The research (surprise-at-bexar.md §1) found the premise not so: no Texian is recorded as knowing of the snow, and the snow
// never reached Texas (`HIST-TEX-612`). What they did believe was that no army could come before the spring grass - Travis not
// before March 15 (`HIST-TEX-610`). So:
//
// - **Before February 23** every family hears what Béxar believed (`SPRING_WORD`): no army before the grass, and a garrison
//   short of everything. Nobody is told that Santa Anna is marching or has crossed the Rio Grande (owner: "not that he's
//   marching"), though an express did bring that word to San Felipe on the night of February 18 (`HIST-TEX-615`,
//   `FIC-GONZ-620`). The one warning at Béxar, Blas Herrera's on the 20th, is heard only by a family with somebody in or near
//   Béxar, and only as what it was: a report most of the officers did not believe (`tellHerrera`, `HIST-TEX-614`).
// - **February 23**: the bell of San Fernando, drawn on the engine (sim/battles/alamo.mjs `arrival`, `HIST-TEX-613`); a family
//   with somebody in or near Béxar hears it through that person on the day (`hearTheBell`); everybody else only when a rider
//   brings it - Gonzales on the afternoon of the 24th, the other settlements on the 26th (`HIST-TEX-616`).
// - **At the ending**: the snow march, what the Texians believed and why they were caught unprepared (`surpriseReveal`).
import { record } from './events.mjs';
import { establishTruth, learn } from './knowledge.mjs';

const GONE = ['dead', 'captured'];
const BEXAR = 'bexar';

/**
 * How far from Béxar somebody may be and still hear the bell and see the town empty on February 23 (`FIC-GONZ-622`).
 * ceiling: a flat three miles by the map, whatever lies between - the army halted on the Alazán heights half a league out
 * (`HIST-TEX-613`); sight and sound over the ground (sim/sight.mjs) is the way out if a family ever stands behind a hill.
 */
export const NEAR_BEXAR_MILES = 3;

/** Everybody of a family in Béxar or within reach of its bell now, alive and free. */
export function atOrNearBexar(world) {
  const site = world.map?.sites?.[BEXAR];
  if (!site) return [];
  return Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && !GONE.includes(person.health?.condition)
    && (person.location?.siteId === BEXAR || Math.hypot((person.location?.x ?? Infinity) - site.x, (person.location?.y ?? Infinity) - site.y) <= NEAR_BEXAR_MILES));
}
/** One person for each family with somebody in or near Béxar: its first such person, in the class's own order. */
function onePerFamily(people) {
  const chosen = new Map();
  for (const person of people) if (!chosen.has(person.householdId)) chosen.set(person.householdId, person);
  return [...chosen.values()];
}

/**
 * What every family hears about the middle of February, in place of the old rumour that Santa Anna had crossed the Rio Grande
 * "through snow" (removed 2026-09-26). It is what Béxar believed (`HIST-TEX-610`, `-611`): Travis looked for no army before
 * the middle of March, when the grass would feed its animals; the garrison was small and short of everything; its two
 * commanders shared the command. It says nothing of snow: no Texian is recorded as having heard of it (`HIST-TEX-612`).
 */
export const SPRING_WORD = 'Word from Béxar: Colonel Travis does not look for the Mexican army before the middle of March, when the grass is up and its horses and oxen can feed on the prairie. The men holding Béxar are few and short of everything - money, clothes, horses, food - and they have two commanders, Travis for the regulars and Bowie for the volunteers, who do not always agree.';

/**
 * Blas Herrera's warning, as the officers at Béxar took it (`HIST-TEX-614`): heard only by a family with somebody there, and
 * told as what it was - a report most of them did not believe, and a council that decided nothing. `rumor`, and never the
 * public's, so no tavern repeats it. It says soldiers are on the Rio Grande, not that they are coming (owner: "not that he's
 * marching").
 */
export const HERRERA_WORD = 'At dark a Tejano rider, Blas Herrera, came in to Béxar saying there are Mexican soldiers on the Rio Grande. The officers talked it over in Colonel Travis\'s room until late. Most of them do not believe it - no army can come before the grass, they say - and they broke up without deciding anything.';

/** The evening of February 20 (`herrera`): the warning heard by whoever of a family is in or near Béxar, and the way out. */
export function tellHerrera(world) {
  if (!world.truth['herrera-report']) establishTruth(world, { id: 'herrera-report', text: HERRERA_WORD, siteId: BEXAR, classification: 'STRONGLY SUPPORTED', claimId: 'HIST-TEX-614' });
  for (const person of onePerFamily(atOrNearBexar(world))) {
    learn(world, person.householdId, 'herrera-report', { status: 'rumor', source: `${person.name}, at Béxar`, text: HERRERA_WORD });
    // The way out (`FIC-GONZ-383`), said to a family with somebody in the garrison while it is still open. Since 2026-09-26 it
    // rides with the warning the officers did not believe, not with a rumour that the army is marching. It still promises
    // nothing about what any army will do.
    if (person.service?.kind === 'garrison' && person.service.status === 'serving' && !person.service.besieged) {
      record(world, 'pressure', { actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-383',
        text: `${person.name} is with the garrison at Béxar and can still be sent for. If a Mexican army ever did reach the town, the garrison would be shut in, and nobody could be sent for then.` });
    }
  }
}

/** What the arrival was, for the world's record: the truth of `bexar-arrival`. */
export const ARRIVAL_TRUTH = 'In the early afternoon of February 23 the sentry in the bell tower of San Fernando rang the bell: the Mexican army was in sight on the heights west of Béxar. Scouts rode out and came back; about three o\'clock the garrison went into the Alamo with a few families, and Santa Anna\'s army marched into the town.';
/**
 * The arrival as it is heard (`HIST-TEX-613`, `-616`): at Béxar, through the family's own person, on the day; at Gonzales, from
 * Travis's note to Judge Ponton of three that afternoon; in the other settlements, from the riders carrying it on. Travis's
 * words are his own (the transcriptions differ in small words; surprise-at-bexar.md §5).
 */
export const ARRIVAL_WORD = Object.freeze({
  bexar: person => `The bell of San Fernando rang this afternoon. The sentry in the tower shouted "The enemy are in view!" and men in the street called it a false alarm, until two riders went out on the Laredo road and came back at a gallop: the Mexican army, weeks before anybody looked for it. ${person.name} ran with the garrison across the river into the Alamo, with what cattle and corn could be found in the empty houses. Travis wrote that when the enemy appeared "we had not three bushels of corn". Santa Anna's army has marched into the town.`,
  near: person => `${person.name}, near Béxar, heard the bell of San Fernando ring this afternoon and saw the town empty: the sentry in the tower had seen the Mexican army on the heights to the west - weeks before anybody looked for it. The garrison ran for the Alamo, and Santa Anna's army marched into the town.`,
  gonzales: 'A rider has come in from Béxar with a note from Colonel Travis to Judge Ponton, written at three o\'clock yesterday afternoon: "The enemy in large force is in sight. We want men and provisions. Send them to us. We have 150 men and are determined to defend the Alamo to the last. Give us assistance."',
  colonies: 'Riders from Gonzales say Santa Anna\'s army is at Béxar. It came into the town on the afternoon of the 23rd, weeks before anybody looked for it, and Travis has gone into the Alamo with about a hundred and fifty men. He writes: "The enemy in large force is in sight. We want men and provisions. Send them to us."',
});

/**
 * February 23, when the bell rings (the director's `alamo-siege`): each family with somebody in or near Béxar hears it through
 * that person, on the day, in its journal and in what it knows. Nobody else is told anything; the riders carry it on.
 */
export function hearTheBell(world) {
  const truth = world.truth['bexar-arrival'] || establishTruth(world, { id: 'bexar-arrival', text: ARRIVAL_TRUTH, siteId: BEXAR, classification: 'DOCUMENTED', claimId: 'HIST-TEX-613' });
  for (const person of onePerFamily(atOrNearBexar(world))) {
    const text = person.location?.siteId === BEXAR ? ARRIVAL_WORD.bexar(person) : ARRIVAL_WORD.near(person);
    learn(world, person.householdId, 'bexar-arrival', { status: 'confirmed', source: `${person.name}, at Béxar`, text, causes: [truth.eventId] });
  }
}

/** The riders' word of the arrival, to these families (`arrival-gonzales`, `travis-colonies`), and the public's with the last. */
export function arrivalWord(world, households, { source, text, public: toPublic = false }) {
  const truth = world.truth['bexar-arrival'] || establishTruth(world, { id: 'bexar-arrival', text: ARRIVAL_TRUTH, siteId: BEXAR, classification: 'DOCUMENTED', claimId: 'HIST-TEX-613' });
  for (const household of households) learn(world, household.id, 'bexar-arrival', { status: 'confirmed', source, text, causes: [truth.eventId] });
  if (toPublic) learn(world, 'public', 'bexar-arrival', { status: 'confirmed', source, text });
}

/**
 * The true story, at the ending (owner, 2026-09-26: "At the ending"): what the Texians believed and why they were caught
 * unprepared (`HIST-TEX-610` to `-616`); what the other side went through - the snow of February 13-14 on the Mexican army in
 * Coahuila (`HIST-TEX-600` to `-602`); and the Yucatán dead of Urrea's norther (`HIST-TEX-603`). Plain words for a class;
 * no virtue named (tests/ending.test.mjs, tests/surprise.test.mjs).
 */
export const REVEAL = Object.freeze({
  title: 'What nobody in Texas knew: the snow, and the surprise at Béxar',
  believed: 'What the Texians believed. All that winter the Texians expected no Mexican army before the spring grass, because an army\'s horses, mules and oxen had to eat on the march. General Houston wrote in December that "by the rise of grass" his own army would march; Travis did not think Santa Anna could reach Béxar before March 15. The garrison was small, unpaid and short of food, clothes and horses. Santa Anna did not wait for the grass: the people of Coahuila and Nuevo León gave food for his army, it was carried on mule back, and he marched in the middle of winter.',
  warned: 'The warnings. Word did come. An express reached San Felipe on the night of February 18 that a thousand men had crossed the Rio Grande. At Béxar, on the evening of the 20th, Blas Herrera rode in with the same news; the officers talked it over in Travis\'s room, most of them did not believe it, and they broke up without deciding anything. Tejano families were packing up and leaving the town. On the night of the 22nd most of the garrison was at a fandango for Washington\'s birthday, and only rain that swelled the Medina River had kept Santa Anna\'s cavalry from falling on the town by surprise.',
  bell: 'The surprise. On February 23 the sentry in the bell tower of San Fernando rang the bell and shouted "The enemy are in view!" Men in the street called it a false alarm. Dr. John Sutherland and John W. Smith rode out on the Laredo road, came on the Mexican cavalry, and galloped back - Sutherland\'s horse fell on him in the mud. About three o\'clock the garrison crowded into the Alamo, driving in what cattle it could find; Travis wrote that "we had not three bushels of corn". He sent word to Gonzales: "The enemy in large force is in sight. We want men and provisions. Send them to us." The families in the colonies heard it one to four days later.',
  snow: 'What the Mexican army went through. On the evening of February 13, 1836 a norther turned to snow over Santa Anna\'s army, strung out for more than two hundred miles across Coahuila, south of the Rio Grande. It snowed until the afternoon of the 14th - about sixteen inches, knee-deep in the cavalry\'s camp in a mesquite thicket north of Monclova. Pack mules smothered under their loads, horses died, more than fifty yoke of oxen died with one brigade, muleteers ran off in the dark, and every column lost men, though no officer who was there wrote down how many. Three Mexican officers - Filisola, de la Peña and Sánchez Navarro - each described it.',
  santaAnna: 'Santa Anna was not in the snow. He had ridden ahead and was at Guerrero, on the Rio Grande, from February 12 to 16. The storm cost the brigades behind him days and animals; it did not stop the vanguard, and Santa Anna was with it when it marched into Béxar on the 23rd - three weeks before Travis thought any army could come. The snow never reached Béxar or the colonies, where the days were warm - on February 25 a traveller near the Brazos rode in his shirt sleeves - and nobody in Texas is recorded as having heard of it that winter.',
  // Never a sentence with the Yucatán dead and the snow in it together (tests/surprise.test.mjs): they died in another storm.
  yucatan: 'The soldiers from Yucatán who died of the cold died in a different storm, in another column. Six of them, marching with General Urrea up the coast road, died in a norther on the night of February 25, south of the Nueces.',
  ask: 'For the class: the Texians were sure no army could come before the grass. What did they know, what did they not believe, and how would your family have heard?',
});

/**
 * The reveal for an ended class that has lived February 23 (the second period's close and the third's): the belief, the
 * warnings, the bell, the snow, in the order a teacher would tell them. Nothing before the class has ended, and nothing for a
 * class that never reached the siege: there is nothing yet to reveal (sim/ending.mjs `endingProjection` is the one gate).
 */
export function surpriseReveal(world) {
  if (world.status !== 'ended' || !world.director?.milestones?.['alamo-siege']) return null;
  return {
    title: REVEAL.title,
    paragraphs: [REVEAL.believed, REVEAL.warned, REVEAL.bell, REVEAL.snow, REVEAL.santaAnna, REVEAL.yucatan],
    ask: REVEAL.ask,
    claims: ['HIST-TEX-600', 'HIST-TEX-601', 'HIST-TEX-602', 'HIST-TEX-603', 'HIST-TEX-610', 'HIST-TEX-611', 'HIST-TEX-612', 'HIST-TEX-613', 'HIST-TEX-614', 'HIST-TEX-615', 'HIST-TEX-616'],
  };
}
