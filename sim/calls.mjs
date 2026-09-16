// What a family far from Gonzales is asked when the word reaches it: its own settlement's call (docs/COLONIES.md §5.4a,
// build step 4, part 2).
//
// The letters of September 25 to October 11, 1835 (`HIST-TEX-014`) show the settlements did not all ask the same thing.
// San Felipe and Washington turned out and marched for Gonzales; the Colorado mustered; Matagorda told its volunteers to
// gather at James Kerr's on the Lavaca, and the Brazos coast was told the same and then wondered whether any more men
// should leave it; the Trinity and Mina were sent the general word. Everywhere there were "more men than guns", so a
// volunteer takes the family's own powder.
//
// A family is asked once, by its settlement, when the express has brought the call for help to its door
// (sim/expresses.mjs). Somebody who turns out rides to the gathering place and waits there: the gathering and the march
// (§5.5, step 5) are not built, so what they find is said in words. Staying home is a whole answer, and on the coast the
// letters themselves give it. The Gonzales calls - carrying food in, going upriver - are the Gonzales families' own and
// are untouched (sim/directors.mjs).
//
// Every sentence a family reads here is the game's wording (`FIC-GONZ-031`); what each settlement asked is `HIST-TEX-014`.
import { record } from './events.mjs';
import { canAnswerCalls, cannotAnswerWhy, tooYoung, tooYoungWhy } from './family.mjs';

/** What a volunteer takes of the family's powder: the settlers brought their own arms (`HIST-GONZ-020`), and powder was short. */
export const VOLUNTEER_POWDER = 2;
const COAST = Object.freeze(['matagorda', 'columbia']);

/**
 * Each settlement's call. `gather` is the place on the map a volunteer rides to.
 * ceiling: James Kerr's on the Lavaca is not a place on the real map, so the coast's volunteers ride for Victoria, where
 * the companies from Matagorda and the Lavaca went on October 8-11 (`HIST-TEX-014`, pp. 164, 169, 174); putting Kerr's on
 * the map, with a documented place, is the way out.
 */
export const SETTLEMENT_CALLS = Object.freeze({
  'san-felipe': {
    gather: 'gonzales',
    text: 'An express has brought word to San Felipe that the Mexican troops are at Gonzales. The committee asks the men to turn out, and the District of Washington is already turning out to march to Gonzales as fast as it can. Does somebody from your family go?',
    there: name => `${name} reached Gonzales, where volunteers from the settlements are gathering and waiting to be made into an army.`,
  },
  mina: {
    gather: 'gonzales',
    text: 'Word has come up the Colorado that the Mexican troops are at Gonzales, and the settlements below are mustering as fast as they can. Does somebody from your family ride to Gonzales to join them?',
    there: name => `${name} reached Gonzales, where volunteers from the settlements are gathering and waiting to be made into an army.`,
  },
  matagorda: {
    gather: 'victoria',
    text: "The committee at Matagorda asks the volunteers of the town and the country east of it to gather at James Kerr's on the Lavaca as speedily as they can. The town is badly armed and its men are few. Does somebody from your family go?",
    there: name => `${name} reached Victoria, on the road the volunteers from Matagorda and the Lavaca are gathering on.`,
  },
  columbia: {
    gather: 'victoria',
    text: "Volunteers from Columbia and the lower Brazos are to gather at James Kerr's on the Lavaca and go on from there. Does somebody from your family go?",
    there: name => `${name} reached Victoria, on the road the volunteers from Matagorda and the Lavaca are gathering on.`,
  },
  liberty: {
    gather: 'gonzales',
    text: 'An express from San Felipe has reached the Trinity with word that the Mexican troops are at Gonzales and the settlements are turning out. Does somebody from your family ride west to join them?',
    there: name => `${name} reached Gonzales after the long ride from the Trinity. Volunteers from the settlements are gathering there and waiting to be made into an army.`,
  },
  victoria: {
    gather: 'gonzales',
    text: 'Word has come to Victoria that the Mexican troops are at Gonzales and the colonists are gathering there. Does somebody from your family ride to join them?',
    there: name => `${name} reached Gonzales, where volunteers from the settlements are gathering and waiting to be made into an army.`,
  },
  // Gonzales's own, and the one call that is not asked on the strength of an express: the town is
  // where the volunteers are coming to, and its families are asked once the gathering has begun
  // (docs/COLONIES.md §5.5, build step 5). A family that carried food to town or went upriver in
  // the first days is asked this as well - that week is exactly when men went home and came back.
  gonzales: {
    gather: 'gonzales',
    gathering: true,
    text: 'Volunteers are coming into Gonzales from every settlement, and there is talk of making them into an army and marching on Béxar. Does somebody from your family join them?',
    there: name => `${name} joined the volunteers gathering in Gonzales, waiting to be made into an army.`,
  },
});

/**
 * The call a household's settlement makes, or null for every family on the invented map.
 *
 * A family of Gonzales has none until the gathering opens, and then has the town's own
 * (build step 5); a far family's is the one its settlement made when the express reached it.
 */
export const callFor = (household, gathering = false) => {
  if (!household.settlementId) return null;
  if (household.settlementId === 'gonzales') return gathering ? SETTLEMENT_CALLS.gonzales : null;
  return SETTLEMENT_CALLS[household.settlementId] || null;
};

/** Put each family's call to it: a far family's once the express has brought the word, Gonzales's own once the gathering has begun. */
export function offerCalls(world) {
  if (world.director?.complete) return;
  const gathering = Boolean(world.director?.milestones?.['gathering-opens']);
  for (const household of Object.values(world.households)) {
    const call = callFor(household, gathering);
    if (!call || world.calls?.[household.id]) continue;
    // The town's own call is asked on the gathering itself, which its families can see happening
    // around them; every other call waits on a rider (`FIC-GONZ-031`).
    const report = call.gathering ? { eventId: world.truth['gonzales-outcome']?.eventId } : world.knowledge.households[household.id]?.['cannon-request'];
    if (!report) continue;
    if (!world.calls) world.calls = {};
    const id = record(world, 'pressure', { householdId: household.id, text: call.text, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-031', causes: report.eventId ? [report.eventId] : [], importance: 2 });
    world.calls[household.id] = { id, text: call.text, status: 'open', settlementId: household.settlementId, gather: call.gather, offeredMinute: world.minute };
  }
}

/** Whether this person can answer the settlement's call this way, and if not, why, in the words on the control. */
export function callAvailability(world, householdId, entity, action) {
  if (['dead', 'captured'].includes(entity.health.condition)) return { can: false, why: `${entity.name} cannot answer.` };
  if (tooYoung(entity)) return { can: false, why: tooYoungWhy(entity) };
  if (!canAnswerCalls(entity)) return { can: false, why: cannotAnswerWhy(entity) };
  if (action === 'turn-out' && entity.travel) return { can: false, why: 'Wait until this person arrives.' };
  return { can: true, why: '' };
}

/** The two answers, each with its price said before it is chosen: the same shape as every other call. */
export function callOptions(world, householdId, call, entity) {
  const place = world.map.sites[call.gather]?.name || 'the gathering';
  const offer = (id, label, note) => ({ id, label, note, ...callAvailability(world, householdId, entity, id) });
  const tired = entity.health.condition === 'tired' ? ` ${entity.name} is already tired.` : '';
  return [
    offer('turn-out', COAST.includes(call.settlementId) ? `Go: ride west to join them, toward ${place}` : `Go: ride for ${place}`, `${entity.name} takes the family's rifle and up to ${VOLUNTEER_POWDER} powder, and is away from the farm until called home.${tired}`),
    COAST.includes(call.settlementId)
      ? offer('stay-put', 'Stay and keep the coast', `The coast has few men left on it. ${entity.name} stays, and the farm keeps its hands.`)
      : offer('stay-put', 'Stay home', `${entity.name} stays, and the farm keeps its hands.`),
  ];
}

export function handleCall(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const call = world.calls?.[householdId];
  if (!call || call.status !== 'open') throw new Error('Nobody is asking that.');
  if (world.director?.complete) throw new Error('The class has ended.');
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  const household = world.households[householdId];
  const going = action === 'turn-out';
  const place = world.map.sites[call.gather];
  // Refused before anything is written down or spent, so an impossible journey never leaves a promise with nobody on the road.
  if (going && entity.location.siteId !== call.gather) {
    const why = travelRefusal?.(world, entity, call.gather, mode);
    if (why) throw new Error(why);
  }
  call.status = going ? 'accepted' : 'refused';
  call.actorId = entity.id;
  call.choiceId = record(world, 'choice', {
    actorId: entity.id, householdId, decision: action, causes: [call.id], importance: 2, claimId: 'FIC-GONZ-031',
    text: going ? `${entity.name} will ride for ${place.name} with the volunteers.` : `${entity.name} will stay home.`,
  });
  if (!going) {
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, importance: 2, causes: [call.choiceId], text: COAST.includes(call.settlementId) ? `${entity.name} stayed to keep the coast, and the farm kept its hands.` : `${entity.name} stayed home when the settlement turned out.` });
    remember(world, household, entity, consequence, `When the call came, your family kept ${entity.name} home.`);
    return;
  }
  entity.commitments.push({ id: 'volunteer', type: 'service', status: 'active', choiceId: call.choiceId, gather: call.gather });
  const carried = Math.min(VOLUNTEER_POWDER, household.resources.powder ?? 0);
  if (carried > 0) {
    household.resources.powder = Math.round((household.resources.powder - carried) * 10000) / 10000;
    record(world, 'property', { actorId: entity.id, householdId, importance: 2, causes: [call.choiceId], text: `${entity.name} took the rifle and ${carried} powder. There is ${household.resources.powder} left in the house.` });
  }
  if (entity.location.siteId === call.gather) { call.arrivedMinute = world.minute; entity.task = 'help'; return; }
  beginTravel(world, entity, call.gather, call.choiceId, 'volunteer', mode);
}

/** Somebody who turned out and has reached the gathering place: said once, in words, and remembered. */
export function settleCalls(world) {
  for (const [householdId, call] of Object.entries(world.calls || {})) {
    if (call.status !== 'accepted' || call.arrivedMinute !== undefined) continue;
    const entity = world.entities[call.actorId];
    if (!entity || entity.location.siteId !== call.gather || entity.travel) continue;
    call.arrivedMinute = world.minute;
    entity.task = 'help';
    const text = SETTLEMENT_CALLS[call.settlementId]?.there(entity.name) || `${entity.name} reached ${world.map.sites[call.gather].name}.`;
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, importance: 2, causes: [call.choiceId], claimId: 'FIC-GONZ-031', text });
    remember(world, world.households[householdId], entity, consequence, `${entity.name} went with the volunteers.`);
  }
}

/** A call nobody answered, closed when the class ends and written down: silence is an answer too. */
export function expireCalls(world) {
  for (const [householdId, call] of Object.entries(world.calls || {})) {
    if (call.status !== 'open') continue;
    call.status = 'expired';
    record(world, 'consequence', { householdId, importance: 2, causes: [call.id], text: 'Nobody from this family answered when the settlement turned out.' });
  }
}

function remember(world, household, entity, cause, text) {
  household.memories.push(record(world, 'memory', { actorId: entity.id, householdId: household.id, text, causes: [cause], importance: 3 }));
}

export function callsInvalid(world) {
  if (world.calls === undefined) return null;
  if (!world.calls || typeof world.calls !== 'object') return 'Invalid calls';
  for (const [householdId, call] of Object.entries(world.calls)) {
    const household = world.households[householdId];
    if (!household) return 'A call for a household that is not there';
    if (!['open', 'accepted', 'refused', 'expired'].includes(call.status)) return 'Invalid call status';
    if (!world.map.sites[call.gather] || call.settlementId !== household.settlementId) return 'A call to a gathering that is not there';
    if (call.status === 'accepted' || call.status === 'refused') { if (!world.entities[call.actorId]) return 'A call answered by nobody'; }
  }
  return null;
}
