// The ending's words about a family's own spring, and the class's own debrief (docs/FLASHBACK.md §8; the design audit of
// 2026-09-28, docs/audits/2026-09-28-design.md S24, S25, S27). Kept apart from sim/ending.mjs, which reads these through three
// small calls, so the numbers there and the story here can each change without the other.
//
// - **S25, the flight said as it was.** Until now any family whose flight had ended at home read "They fled east in the spring,
//   and came home to a burned farm" - whether the farm burned or not - and every other read "They were told to leave". Now:
//   stayed or went, burned or standing, by whose hand, and home or still on the road when the class ended.
// - **S27, the war's prisoners named.** Somebody taken at San Patricio, Agua Dulce or Goliad was never named at the ending (the
//   Scrape's prisoners were). They are named now, with what the record says became of the men taken with them (`HIST-TEX-059`:
//   the San Patricio and Agua Dulce prisoners went to Matamoros). They are not weighed: a casualty of the war never changes the
//   number (sim/ending.mjs `PRISONER_WEIGHT`).
// - **S24, a debrief from this class's own story.** The four fixed questions were all about October 1835. The class's own hooks
//   come first now: the widest gap between two families in hearing the same news, two neighbours who chose differently when
//   told to leave, and a family that sent somebody to the war beside one that sent nobody - named, and asked *why*, never who
//   was right.
import { householdName } from './family.mjs';
import { dateOf } from './clock.mjs';
import { happenings } from './flashback.mjs';

const DAY = 1440;
const day = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const people = (world, household) => household.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person');

/** The spring, in one or two plain sentences: stayed or went, what became of the farm, and where the family was at the end. */
export function flightLine(world, household) {
  const flight = household.flight;
  if (!flight) return null;
  const burnedBy = flight.burnedBy?.hand === 'mexican' ? `foragers of ${flight.burnedBy.name}` : 'the Texas army';
  const burned = Number.isFinite(flight.burned);
  const refuge = flight.refuge ? world.map.sites[flight.refuge]?.name : null;
  if (flight.status === 'ordered') return 'They were told to leave in the spring, and the class ended before they had decided.';
  if (flight.status === 'stayed') {
    return burned
      ? `They were told to leave in the spring and stayed on the farm. On ${day(world, flight.burned)} ${burnedBy} burned it.`
      : 'They were told to leave in the spring and stayed on the farm. The Mexican army never came that way, and the house stands.';
  }
  const went = `They fled east in the spring${refuge ? `, to ${refuge}` : ''}.`;
  // Nobody answered the order in time, and the house burned as they went (sim/scrape.mjs `burnForSilence`, `FIC-GONZ-907`).
  const farm = burned && flight.burnedBy?.lapsed
    ? ` Nobody answered the order in time, and they left in a rush: ${burnedBy} burned the farm behind them, on ${day(world, flight.burned)}.`
    : burned
    ? ` While they were gone, ${burnedBy} burned the farm, on ${day(world, flight.burned)}.`
    : ' The farm they left was never burned.';
  const end = flight.status === 'home'
    ? burned ? ' They came home to the ashes.' : ' They came home to the house standing.'
    : ' When the class ended they were on the road home.';
  return `${went}${farm}${end}`;
}

/** The line for a family that sent nobody: it stayed with the land, or - in the spring - did not. */
export function nobodyWentLine(household) {
  return ['fled', 'refuged', 'returning', 'home'].includes(household.flight?.status)
    ? 'Nobody from the family went to Gonzales or to the army.'
    : 'Nobody from the family went to Gonzales or to the army. They stayed with the land.';
}

/** Where the record puts the war's prisoners, by the fight they were taken in. `HIST-TEX-059`; `HIST-TEX-064` for Goliad. */
const TAKEN_AT = Object.freeze([
  { match: /San Patricio/, where: 'San Patricio', after: 'The men taken there were marched to Matamoros.' },
  { match: /Agua Dulce/, where: 'Agua Dulce Creek', after: 'The men taken there were marched to Matamoros.' },
  { match: /Goliad|Coleto|Fannin/, where: 'Goliad', after: 'A few of Fannin\'s men were kept alive as workmen and marched to Matamoros.' },
]);
/**
 * The family's people held by the Mexican army as prisoners of the war (the army's `service.status` 'captured'), each named
 * with where and what the record says of the men taken with them. The Scrape's prisoners are sim/ending.mjs `scrapePrisoners`.
 */
export function warPrisoners(world, household) {
  return people(world, household).filter(person => person.health?.condition === 'captured' && person.service?.status === 'captured').map(person => {
    const said = [...world.events].reverse().find(event => event.actorId === person.id && /prisoner/i.test(event.text || ''));
    const place = TAKEN_AT.find(one => one.match.test(said?.text || ''));
    return { personId: person.id, name: person.name, where: place?.where || null, text: `${person.name} was taken prisoner by the Mexican army${place ? ` at ${place.where}` : ''}${said ? ` on ${day(world, said.minute)}` : ''}, and was still a prisoner when the class ended.${place ? ` ${place.after}` : ''}` };
  });
}

/** Two questions for the family itself, from its own story: when the news came, and what the spring cost. */
export function familyQuestions(world, household) {
  const questions = [];
  // The news the class waited longest on, dated as it really happened (sim/flashback.mjs `happenings`, the fog lifted).
  const fall = happenings(world, household.id).find(one => one.topicId === 'alamo-fall');
  if (fall && Number.isFinite(fall.heardMinute)) {
    const late = Math.round((fall.heardMinute - fall.minute) / DAY);
    if (late > 1) questions.push(`Your family heard that the Alamo had fallen ${late} days after it happened. What would you have done differently if you had known sooner?`);
  }
  if (household.flight?.status === 'stayed') questions.push('Your family stayed when it was told to leave. What made staying seem like the better choice at the time?');
  else if (household.flight?.leftMinute) questions.push('What did your family leave behind when it fled, and why those things?');
  if (!questions.length) questions.push('Which moment in your family\'s story would you change, and what do you think would have happened instead?');
  return questions;
}

/**
 * A played family, by its name, for the class's own hooks: a family nobody played is not named on the projector. A played family
 * whose student was away at the end is still theirs and still in the story (owner, 2026-09-29: "Any played family"; triage 1.4).
 */
const namedFamilies = world => Object.values(world.households).filter(household => household.played);

/** Questions for the class from what happened in it, named, each asking why. At most three; none when nothing fits. */
export function classHooks(world) {
  const families = namedFamilies(world);
  const hooks = [];
  // The widest gap in hearing the same news.
  let widest = null;
  for (const topic of ['cannon-request', 'alamo-fall', 'goliad-massacre', 'san-jacinto']) {
    const when = families.map(household => ({ household, minute: world.knowledge?.households?.[household.id]?.[topic]?.receivedMinute })).filter(one => Number.isFinite(one.minute)).sort((a, b) => a.minute - b.minute);
    if (when.length < 2) continue;
    const gap = when.at(-1).minute - when[0].minute;
    if (!widest || gap > widest.gap) widest = { topic, gap, first: when[0], last: when.at(-1) };
  }
  const NEWS = { 'cannon-request': 'that soldiers had come for the cannon at Gonzales', 'alamo-fall': 'that the Alamo had fallen', 'goliad-massacre': 'what had happened to Fannin\'s men at Goliad', 'san-jacinto': 'of San Jacinto' };
  if (widest && widest.gap >= DAY) hooks.push(`${householdName(world, widest.first.household)} heard ${NEWS[widest.topic]} on ${day(world, widest.first.minute)}; ${householdName(world, widest.last.household)} not until ${day(world, widest.last.minute)}. Why did the same news reach them so far apart, and what did each do in between?`);
  // Two neighbours who chose differently when told to leave.
  const went = families.filter(household => household.flight?.leftMinute), stayed = families.filter(household => household.flight?.status === 'stayed');
  const pair = stayed.map(one => [one, went.find(other => other.settlementId === one.settlementId) || went[0]]).find(([, other]) => other);
  if (pair) hooks.push(`${householdName(world, pair[1])} fled east when told to leave; ${householdName(world, pair[0])} stayed. What did each know, and what did each risk?`);
  // A family that sent somebody to the war beside one that sent nobody.
  const sent = families.filter(household => Object.keys(world.glory?.[household.id]?.awards || {}).some(key => /^(gonzales|gathering|concepcion|grass-fight|bexar-storming|enlistment|alamo|san-patricio|agua-dulce|coleto|goliad|san-jacinto|houston-camp):/.test(key)));
  const none = families.filter(household => !sent.includes(household));
  if (sent.length && none.length) hooks.push(`${householdName(world, sent[0])} sent somebody to the war; ${householdName(world, none[0])} sent nobody. How did that choice change what happened at home?`);
  return hooks;
}
