// Houston's army, Goliad and San Jacinto: docs/COLONIES.md §7g and build step 10(c)–(e), decided by the owner by multiple
// choice (2026-09-16). Researched in docs/battle-research/goliad-scrape-san-jacinto.md (`HIST-TEX-062` to `-067`).
//
// - **Houston's army** is a service (`sim/winter.mjs`, kind `houston`) joined at the army's camp on its dates - Gonzales,
//   then the Colorado at Beeson's, San Felipe (and Groce's above it: `ceiling:` one place), Harrisburg, and the San Jacinto
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
import { rollFates, WOUND_GRADES } from './army.mjs';
import { share } from './scrape.mjs';

const GONE = ['dead', 'captured'];
const MARCH_1 = 221760, APRIL_1 = 266400, DAY = 1440;
const march = (day, hour = 6) => MARCH_1 + (day - 1) * DAY + hour * 60;
const april = (day, hour = 6) => APRIL_1 + (day - 1) * DAY + hour * 60;

/** Where Houston's army was camped, and from when (`HIST-TEX-066`). */
export const HOUSTON_CAMPS = Object.freeze([
  { from: march(11), siteId: 'gonzales' },
  { from: march(17), siteId: 'columbus-crossing' },
  { from: march(28, 12), siteId: 'san-felipe' },
  { from: april(18, 12), siteId: 'harrisburg' },
  { from: april(20, 12), siteId: 'lynchburg' },
]);
/** The army's camp now. */
export const houstonCamp = world => [...HOUSTON_CAMPS].reverse().find(camp => world.minute >= camp.from)?.siteId || 'gonzales';
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
    try { beginTravel(world, person, camp, null, 'march'); } catch { /* ceiling: somebody with no road to the camp stands where they are */ }
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
  for (const { person, fate } of rollFates(world, inService(world, 'houston').map(person => person.id), { event: 'san-jacinto', ...SAN_JACINTO })) {
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
    if (service.fate === 'killed') { service.status = 'fell'; person.health = { condition: 'dead' }; person.task = 'rest'; tell(world, person, `${person.name} was killed in the charge at San Jacinto.`, { claimId: 'HIST-TEX-067' }); continue; }
    if (service.fate === 'wounded') { person.health = { condition: WOUND_GRADES.slight.condition, grade: 'slight', recoversAt: world.minute + WOUND_GRADES.slight.minutes }; tell(world, person, `${person.name} was slightly hurt at San Jacinto, and is on their feet.`, { claimId: 'HIST-TEX-067' }); }
    else tell(world, person, `${person.name} came through the fight at San Jacinto unhurt.`, { claimId: 'HIST-TEX-067' });
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
  santaAnnaBrazos: 'Santa Anna has crossed the Brazos at Fort Bend with about seven hundred men and is making for Harrisburg and the government.',
  victory: 'On the afternoon of April 21 General Houston attacked Santa Anna\'s camp on the San Jacinto and destroyed his army in eighteen minutes. Santa Anna himself was taken the next day. The war is won; the families can go home.',
});
