// Houston's army, Goliad and San Jacinto: docs/COLONIES.md §7g and build step 10(c)–(e), decided by the owner by multiple
// choice (2026-09-16). Researched in docs/battle-research/goliad-scrape-san-jacinto.md (`HIST-TEX-062` to `-067`).
//
// - **Houston's army** is a service (`sim/winter.mjs`, kind `houston`) joined at the army's camp on its dates - Gonzales,
//   then the Colorado at Beeson's, San Felipe, Groce's above it, Bernardo over the Brazos from it, Harrisburg, and the San Jacinto
//   at Lynchburg. Anybody grown may go; anybody may be sent for to help their family, as many men were after word of Goliad
//   (a regular who leaves has deserted). The regulars and auxiliaries at San Felipe are taken into it when it reaches them.
// - **Goliad**: those with Fannin (who got away from the south, `sim/alamo.mjs`) can be sent for until March 18. On the 19th
//   Fannin is caught on the prairie at Coleto - about 3 in 100 killed and 20 wounded - and surrenders on the 20th; on Palm
//   Sunday, March 27, about 89 in 100 of the prisoners are shot, 7 in 100 get away, and 5 in 100 are spared as physicians
//   or workmen and marched to Matamoros. Nobody new joins Fannin.
// - **San Jacinto** (April 21): 1 in 100 killed and 3 in 100 wounded, weighted by hidden strength and health.
// - **The word**: Fannin's defeat is known on March 25, the massacre about April 1, the victory on April 23; a family's dead
//   are dead on its screen when the word comes, as at the Alamo.
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { frailty, rollFates, WOUND_GRADES } from './army.mjs';
import { share } from './scrape.mjs';

const GONE = ['dead', 'captured'];
const MARCH_1 = 221760, APRIL_1 = 266400, DAY = 1440;
const march = (day, hour = 6) => MARCH_1 + (day - 1) * DAY + hour * 60;
const april = (day, hour = 6) => APRIL_1 + (day - 1) * DAY + hour * 60;

/**
 * The class's clock against the timeline's: a class that arrives at dawn on September 28 runs eighteen hours ahead of a
 * timeline counted from midnight on the 29th (sim/directors.mjs `ARRIVAL_MINUTES`, `momentOf`), and a class saved before
 * arrivals began does not. The dates below are timeline dates, so they are read against the clock the director reads.
 * They used to be read off the minute alone, eighteen hours ahead of the director's milestones: for those hours a man at the
 * old camp "had not reached the camp" and could do nothing (found by tests/camp.test.mjs, 2026-09-17).
 */
export const campClock = world => world.director?.arrival ? 1080 : 0;
/** Where Houston's army was camped, and from when (`HIST-TEX-066`): the milestone of the same date moves the army (`followCamp`). */
export const HOUSTON_CAMPS = Object.freeze([
  { from: march(11), siteId: 'gonzales' },
  // Beeson's, March 19-26 1836: the place stands at the marker on the east bank, where the army camped and the Mexicans were
  // two miles west of the river (`HIST-TEX-157`, 2026-09-19).
  { from: march(17), siteId: 'columbus-crossing' },
  { from: march(28, 12), siteId: 'san-felipe' },
  // Groce's, on the west bank opposite Bernardo, from the evening of March 30 (`HIST-TEX-075`, `HIST-TEX-086`).
  { from: march(30, 12), siteId: 'groces' },
  // Over the Brazos on the steamboat Yellow Stone from April 12, to the camp by Groce's house at Bernardo (`HIST-TEX-089`).
  { from: april(12), siteId: 'bernardo' },
  // The march east (`HIST-TEX-088`), a forced march (`FORCED_MARCH_HOURS`) with a night at each house on the road, dated by
  // the markers. Each `from` is when the army sets out, so that it arrives on the day: Donoho's the afternoon of the 14th
  // (Barker; its marker has the army there the 14th-15th); McCarley's, set out at dawn on the 15th and there that evening (its
  // marker); Roberts', at dawn on the 16th, there by the noon the men are asked which road (sim/camp.mjs, `which-road`);
  // Burnett's that afternoon, there the evening of the 16th (its marker) while the question is still open - the army took the
  // right-hand road whatever was said; and at noon on the 17th for Harrisburg, "arrived opposite" on the evening of the 18th
  // (Houston). Lynchburg: over Buffalo Bayou on the 19th and at Lynch's ferry the morning of the 20th (`HIST-TEX-067`).
  { from: april(14, 15), siteId: 'donohos' },
  { from: april(15, 6), siteId: 'mccarleys' },
  { from: april(16, 6), siteId: 'roberts' },
  { from: april(16, 14), siteId: 'burnetts' },
  { from: april(17, 12), siteId: 'harrisburg' },
  { from: april(19, 12), siteId: 'lynchburg' },
]);
/**
 * Camps that became places after classes were saved: Groce's (2026-09-17, `HIST-TEX-086`), Bernardo (2026-09-18,
 * `HIST-TEX-088`), and the four houses of the march east (2026-09-18, `HIST-TEX-088`).
 */
const LATER_CAMPS = Object.freeze(['groces', 'bernardo', 'donohos', 'mccarleys', 'roberts', 'burnetts']);
/** The march east's nights (`HIST-TEX-088`): a camp on the road, where the army does not drill. */
export const MARCH_CAMPS = Object.freeze(['donohos', 'mccarleys', 'roberts', 'burnetts']);
/**
 * The army's camp now. A camp whose place this class's map does not have is passed over: a class saved before Groce's was a
 * place (2026-09-17) keeps the army at San Felipe for that fortnight, as it always did, and only its words say Groce's; a class
 * saved before Bernardo was (2026-09-18) keeps it at Groce's until it marches for Harrisburg on the 18th, by San Felipe as it
 * always did, and only the story says it crossed (ceiling: its map has no ferry to cross by); and a class saved before the
 * march's houses were places keeps it at Bernardo until the 18th, and marches it straight to Harrisburg, as it always did.
 */
export const houstonCamp = world => [...HOUSTON_CAMPS].reverse().find(camp => world.minute >= camp.from + campClock(world)
  && (!LATER_CAMPS.includes(camp.siteId) || world.map?.sites?.[camp.siteId]))?.siteId || 'gonzales';
/**
 * Groce's, on the Brazos about fifteen miles above San Felipe, from March 30 (`HIST-TEX-075`): the camp where the army drilled
 * for a fortnight, a place of its own on the map since 2026-09-17 (`HIST-TEX-086`); and from April 12 the camp over the river
 * by his house at Bernardo (`HIST-TEX-089`), where his herd and cribs were as near.
 */
export const GROCES_FROM = march(30, 12);
export const atGroces = world => world.minute >= GROCES_FROM + campClock(world) && ['groces', 'bernardo', 'san-felipe'].includes(houstonCamp(world));
/**
 * The steamboat *Yellow Stone*, drawn since 2026-09-21 (`steamboat-moored`, docs/ART_DELIVERY_2026-09-21-RIVER-TRANSPORT.md).
 *
 * She is a real vessel and this is her own dated fortnight, so she is put where the record puts her and nowhere else. She
 * "came up the river for cotton under Captain John E. Ross" (the army's own word in `HOUSTON_WORD.brazos`) and lay at
 * Groce's landing; from April 12 Houston took her, and she carried the men, the horses and the wagons over the flooded
 * Brazos on the 12th and 13th (`HIST-TEX-089`). She is therefore drawn only while the army is at Groce's or Bernardo, and
 * she is gone from the map when the army marches east on the 14th.
 *
 * Her place is the middle of the water between the two camps - Groce's on the west bank and Bernardo on the east - which
 * is the crossing itself. A class whose map has neither place (saved before they were places, 2026-09-17 and -18) has no
 * crossing to draw and gets no boat, exactly as `houstonCamp` gives it no camp there.
 *
 * Where the picture goes and for how long is the game's own: `FIC-GONZ-200`.
 */
export const YELLOW_STONE_TAKEN = april(12), YELLOW_STONE_GONE = april(14);
export function yellowStone(world) {
  const clock = campClock(world);
  if (world.minute < GROCES_FROM + clock || world.minute >= YELLOW_STONE_GONE + clock) return null;
  const west = world.map?.sites?.groces, east = world.map?.sites?.bernardo;
  if (!west || !east) return null;
  const round = value => Math.round(value * 1e4) / 1e4;
  return {
    x: round((west.x + east.x) / 2), y: round((west.y + east.y) / 2),
    // What she is doing, which is the only thing the page is told and the only thing it may draw.
    state: world.minute >= YELLOW_STONE_TAKEN + clock ? 'crossing' : 'cotton',
  };
}
/**
 * The camp's name in words: the place; Groce's above San Felipe on a map saved before Groce's was a place; and Bernardo said as
 * Groce's plantation, since the name alone tells a class nothing (the army's camp there was by Groce's house, `HIST-TEX-089`).
 */
export function campName(world, siteId = houstonCamp(world)) {
  const name = world.map?.sites?.[siteId]?.name || siteId;
  if (siteId === 'bernardo') return `${name}, Groce's plantation`;
  return siteId === 'san-felipe' && atGroces(world) ? `Groce's, above ${name}` : name;
}
/**
 * Drilling counts at San Jacinto (docs/HOUSTON_CAMP.md, `FIC-GONZ-053`): three days' drill at the camp make a man steady in
 * the line, and a steady man's weight in the battle's roll is three quarters of his frailty. The record says the fortnight's
 * drill "had a good effect in disciplining us" (`HIST-TEX-075`); the number is this game's own, and it is said on the drill
 * control and in the record when the word of the battle comes. No new die: the roll is the same seeded one.
 */
export const DRILL_TO_STEADY = 3;
export const DRILLED_STEADINESS = 0.75;
export const drilledSteady = person => (person?.service?.drilled || 0) >= DRILL_TO_STEADY;
const steadiness = person => frailty(person) * (drilledSteady(person) ? DRILLED_STEADINESS : 1);
/** After the battle nobody new joins. */
export const houstonOpen = world => world.period === 3 && !world.director?.milestones?.['san-jacinto'];

/** The rates: Coleto's ten killed and sixty wounded of about 330; the massacre's 342 shot of about 430 with 28 escaped and 20 spared; San Jacinto's 9 of 910 and 30 wounded. */
export const COLETO = Object.freeze({ death: 0.03, wound: 0.2 });
export const MASSACRE = Object.freeze({ executed: 0.89, escaped: 0.07 });
export const SAN_JACINTO = Object.freeze({ death: 0.01, wound: 0.03 });

const inService = (world, kind) => Object.values(world.entities).filter(person => person.householdId && person.service?.status === 'serving' && person.service.kind === kind && !GONE.includes(person.health?.condition));
const tell = (world, person, text, { claimId = 'FIC-GONZ-046', importance = 3, type = 'consequence', causes = [] } = {}) => record(world, type, {
  actorId: person.id, householdId: person.householdId, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text, causes,
});

/** When the army reaches San Felipe, the regulars and auxiliaries enlisted there are taken into it. */
export function takeInEnlisted(world) {
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.status !== 'serving' || !['regular', 'auxiliary-war', 'auxiliary-year'].includes(service.kind)) continue;
    person.service = { ...service, kind: 'houston', enlisted: service.kind, bound: service.kind === 'regular', siteId: 'san-felipe' };
    tell(world, person, `${person.name} marched with the rest of the men at San Felipe into General Houston's army.`, { claimId: 'HIST-TEX-066', importance: 2, type: 'army' });
  }
}

/** The camp moves: everybody in the army who is standing still marches to the new one; late-comers follow it. */
export function followCamp(world, { beginTravel }) {
  const camp = houstonCamp(world);
  for (const person of inService(world, 'houston')) {
    if (person.travel || person.location?.siteId === camp) continue;
    person.service.siteId = camp;
    // The army's own days on the road are a forced march's (`FORCED_MARCH_HOURS`), not a family's.
    try { beginTravel(world, person, camp, null, 'march'); person.travel.forced = true; } catch { /* ceiling: somebody with no road to the camp stands where they are */ }
  }
}

/**
 * Every tick of the third period: a man who has reached the camp the army sent him to after the army has marched on from it
 * follows it. At a day's march a leg can outlast the camp - a class saved before the march's houses were places marches
 * Bernardo to Harrisburg in one leg of two days, and was still on it when the army left for Lynchburg - and without this
 * he stood at Harrisburg through the battle. Only a man standing where the army last sent him (`service.siteId`): one his
 * family has sent for is somewhere else, and is left to go.
 */
export function catchUpCamp(world, { beginTravel }) {
  const camp = houstonCamp(world);
  for (const person of inService(world, 'houston')) {
    if (person.travel || !person.location?.siteId || person.location.siteId !== person.service.siteId || person.service.siteId === camp) continue;
    person.service.siteId = camp;
    try { beginTravel(world, person, camp, null, 'march'); person.travel.forced = true; } catch { /* ceiling: somebody with no road to the camp stands where they are */ }
  }
}

/** Coleto: Fannin's command caught on the prairie. Each is rolled; then all are prisoners. */
export function fightColeto(world, causeId) {
  for (const { person, fate } of rollFates(world, inService(world, 'fannin').map(person => person.id), { event: 'coleto', ...COLETO })) {
    awardGlory(world, { event: 'coleto', claimId: 'HIST-TEX-063', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'goliad', causes: causeId ? [causeId] : [] });
    person.service = { ...person.service, coleto: fate, status: 'prisoner', prisonerSince: world.minute };
    if (fate === 'wounded') person.health = { condition: WOUND_GRADES.severe.condition, grade: 'severe', recoversAt: world.minute + WOUND_GRADES.severe.minutes };
  }
}

/** Palm Sunday: the prisoners at Goliad. Nobody's family knows yet. */
export function goliadMassacre(world) {
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.kind !== 'fannin' || service.status !== 'prisoner' || GONE.includes(person.health?.condition)) continue;
    const roll = share(world, person.id, 'goliad');
    const fate = service.coleto === 'killed' ? 'killed' : roll < MASSACRE.executed ? 'executed' : roll < MASSACRE.executed + MASSACRE.escaped ? 'escaped' : 'spared';
    service.fate = fate;
    awardGlory(world, { event: 'goliad', claimId: 'HIST-TEX-064', personId: person.id, householdId: person.householdId, role: 'present', fromSiteId: 'goliad' });
  }
}

/** Word of the massacre: the family learns what became of its own. */
export function tellGoliad(world, { beginTravel }) {
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.kind !== 'fannin' || !service.fate || service.told) continue;
    service.told = true;
    const home = world.households[person.householdId]?.homeSiteId;
    if (service.fate === 'killed') { service.status = 'fell'; person.health = { condition: 'dead' }; person.task = 'rest'; tell(world, person, `${person.name} was killed in the fight on the prairie at Coleto, before Fannin surrendered.`, { claimId: 'HIST-TEX-063' }); }
    else if (service.fate === 'executed') { service.status = 'fell'; person.health = { condition: 'dead' }; person.task = 'rest'; tell(world, person, `${person.name} was among the prisoners shot at Goliad on Palm Sunday.`, { claimId: 'HIST-TEX-064' }); }
    else if (service.fate === 'spared') { service.status = 'captured'; person.health = { condition: 'captured' }; person.task = 'rest'; tell(world, person, `${person.name} was spared at Goliad, as one of the workmen the Mexicans kept, and has been marched to Matamoros a prisoner.`, { claimId: 'HIST-TEX-064' }); }
    else {
      person.service = { ...service, status: 'released', until: world.minute };
      if (person.health.condition === 'wounded') person.health = { condition: 'well' };
      tell(world, person, `${person.name} broke and ran when the firing began at Goliad, got to the river, and is making their way home.`, { claimId: 'HIST-TEX-064' });
      if (home && person.location?.siteId && !person.travel) { try { beginTravel(world, person, home, null, 'home'); } catch { /* ceiling: they stand at Goliad */ } }
    }
  }
}

/** San Jacinto: everybody with Houston fights. Nobody's family knows yet. */
export function fightSanJacinto(world, causeId) {
  for (const { person, fate } of rollFates(world, inService(world, 'houston').map(person => person.id), { event: 'san-jacinto', ...SAN_JACINTO, weightOf: steadiness })) {
    awardGlory(world, { event: 'san-jacinto', claimId: 'HIST-TEX-067', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'lynchburg', causes: causeId ? [causeId] : [] });
    person.service = { ...person.service, fate };
  }
}

/** Word of the victory: each family learns what became of its own; the army goes home. */
export function tellSanJacinto(world, { beginTravel }) {
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.kind !== 'houston' || !service.fate || service.told) continue;
    service.told = true;
    // A drilled man is said to be one (sim/camp.mjs): the family reads what the camp's work came to.
    const drilled = drilledSteady(person) ? ', steady in the line from the drill at the camp,' : '';
    if (service.fate === 'killed') { service.status = 'fell'; person.health = { condition: 'dead' }; person.task = 'rest'; tell(world, person, `${person.name}${drilled} was killed in the charge at San Jacinto.`, { claimId: 'HIST-TEX-067' }); continue; }
    if (service.fate === 'wounded') { person.health = { condition: WOUND_GRADES.slight.condition, grade: 'slight', recoversAt: world.minute + WOUND_GRADES.slight.minutes }; tell(world, person, `${person.name}${drilled} was slightly hurt at San Jacinto, and is on their feet.`, { claimId: 'HIST-TEX-067' }); }
    else tell(world, person, `${person.name}${drilled} came through the fight at San Jacinto unhurt.`, { claimId: 'HIST-TEX-067' });
    person.service = { ...person.service, status: 'released', until: world.minute };
    const home = world.households[person.householdId]?.homeSiteId;
    if (home && person.location?.siteId && !person.travel && person.health.condition !== 'wounded') { try { beginTravel(world, person, home, null, 'home'); } catch { /* ceiling: they stand where they are */ } }
  }
}

export const HOUSTON_WORD = Object.freeze({
  colorado: 'General Houston has fallen back over the Colorado with about twelve hundred men and is camped near Beeson\'s crossing. Men are joining him there.',
  goliadDefeat: 'Word has come that Fannin was caught on the open prairie near Goliad and has surrendered his whole command to Urrea. Many of the men are leaving the army to see to their families.',
  sanFelipe: 'The army has fallen back to the Brazos. San Felipe is burned, and Houston is camped above it at Groce\'s, drilling the men.',
  massacre: 'It is said the prisoners taken with Fannin were marched out of Goliad on Palm Sunday and shot, some four hundred of them. A few got away.',
  // April 12 (`HIST-TEX-089`). The boat herself is drawn at the crossing from 2026-09-21 (`yellowStone`).
  marchEast: 'The army has left Groce\'s and is marching east on the road to Harrisburg. Tonight it is camped at Donoho\'s, a few miles on.',
  brazos: 'The army is crossing the Brazos on the steamboat Yellow Stone. She came up the river for cotton under Captain John E. Ross, and General Houston has taken her to carry the men, the horses and the wagons over the flood.',
  santaAnnaBrazos:'Santa Anna has crossed the Brazos at Fort Bend with about seven hundred men and is making for Harrisburg and the government.',
  victory: 'On the afternoon of April 21 General Houston attacked Santa Anna\'s camp on the San Jacinto and destroyed his army in eighteen minutes. Santa Anna himself was taken the next day. The war is won; the families can go home.',
});
