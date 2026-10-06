// The muster: when the volunteers at Gonzales are made into an army, each played family is asked whether its man joins it, stays
// in Gonzales as a volunteer, or comes home (owner, 2026-10-06, verbatim: "Volunteers should be given a chance to legitimately
// join the army, or stay in gonzales as a volunteer, or go home."; docs/MILITARY_EXPERIENCE.md, "The muster"; `FIC-GONZ-1185`).
//
// Until then sim/army.mjs `formArmy` took everybody standing in Gonzales with a promise to serve, unasked. Now, the afternoon the
// army is made (`organised`, October 11), and while it stands in the town until it marches on the 13th, a family a student plays and
// is at the screen of is asked for each of its volunteers standing there, on the family's request card ("asked of the family", each
// volunteer's own three answers, the call's five real minutes, sim/decision-budget.mjs):
//
// - **Join the army**: mustered into it (sim/army.mjs `fallIn`): he marches with it, is fed by its commissary, does the camp's work
//   with it and takes his part in its fights - the army as it has always been in this game.
// - **Stay in Gonzales**: still a volunteer, in the town, with the militia's bar (sim/militia.mjs): his pack, town work, a shelter,
//   buying and hunting. When the army marches the town's issue goes with it: from then he eats what he carries, buys, hunts or earns.
//   He may still go after the army from his bar while it is in the field (`joinRefusal`), and come home whenever he likes.
// - **Come home**: he leaves the volunteers and walks home (sim/militia.mjs `walkHome`).
//
// Nobody answering in time, or the army marching first, is **joining**: what most of the men at Gonzales did, and what this game
// did for everybody until now. A family nobody plays, or whose student has gone, is not asked: its men join, as before. A class
// saved before has no `world.muster`, which is nobody asked: its army is as it was.
//
//   world.muster?: { [householdId]: { id, text, status: 'open' | 'answered', offeredMinute, asks: { [personId]: 'open' | 'join' | 'stay' | 'home' } } }
import { record } from './events.mjs';
import { walkHome } from './militia.mjs';

/** The three answers, in the order the card shows them. */
export const MUSTER_ANSWERS = Object.freeze(['muster-join', 'muster-stay', 'muster-home']);
const ANSWER = Object.freeze({ 'muster-join': 'join', 'muster-stay': 'stay', 'muster-home': 'home' });
const GONE = Object.freeze(['dead', 'captured']);
/** Where the volunteers were made into an army (sim/army.mjs `RENDEZVOUS`), restated so this file reads nothing of it. */
const RENDEZVOUS = 'gonzales';
const TEXT = 'The volunteers here have been made into an army, with Stephen F. Austin to command it. It marches for Béxar. Does your man go with it?';

const played = household => Boolean(household?.played && !household.absent);
const promised = person => Boolean(person?.commitments?.some(one => one.id === 'volunteer' && one.status === 'active'));
/** A volunteer standing in Gonzales, not yet in the army: the man the muster asks about. */
const standingThere = (world, person) => person?.kind === 'person' && !GONE.includes(person.health?.condition) && promised(person) && !person.service
  && !person.travel && person.location?.siteId === RENDEZVOUS && !world.army?.members?.includes(person.id);

/** The muster's question open to this family now, or null. */
export function musterAskFor(world, householdId) {
  const ask = world.muster?.[householdId];
  return ask?.status === 'open' ? ask : null;
}

/**
 * Put the question to each played family with a volunteer standing in Gonzales while the army is made and has not marched: on the
 * day it is made, and to a man who comes in after that and before it goes. Called before the army takes its men (sim/directors.mjs).
 */
export function offerMuster(world, { forming = false, causeId = null } = {}) {
  // `forming`: the moment the army is made, just before it takes its men (sim/directors.mjs, `organised`).
  if (!forming && (!world.army || world.army.phase !== 'organised')) return;
  for (const household of Object.values(world.households || {})) {
    if (!played(household)) continue;
    const men = household.members.map(id => world.entities[id]).filter(person => standingThere(world, person));
    const fresh = men.filter(person => !world.muster?.[household.id]?.asks?.[person.id]);
    if (!fresh.length) continue;
    world.muster ??= {};
    const ask = world.muster[household.id] ??= { id: record(world, 'pressure', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-1185', causes: [causeId || world.army?.causeId].filter(Boolean), text: TEXT }), text: TEXT, status: 'open', offeredMinute: world.minute, asks: {} };
    for (const person of fresh) ask.asks[person.id] = 'open';
    ask.status = 'open';
  }
}

/** Whether this man is kept out of the army's ranks: his family not yet answered for him, or he stays in Gonzales. */
export const heldFromArmy = (world, person) => {
  const answer = world.muster?.[person?.householdId]?.asks?.[person.id];
  return answer === 'open' || answer === 'stay' || Boolean(person?.militia?.stays);
};

/** Why this man cannot be answered for this way, or null. */
export function musterRefusal(world, householdId, entity, action) {
  const ask = musterAskFor(world, householdId);
  if (!ask || ask.asks[entity?.id] !== 'open') return 'Nobody is asking that.';
  if (!ANSWER[action]) return 'That is not an answer to this.';
  if (!standingThere(world, entity)) return `${entity.name} is not with the volunteers in Gonzales.`;
  if (action === 'muster-home' && (entity.health?.grave || entity.health?.condition === 'wounded')) return entity.health?.grave ? `${entity.name} is too sick to get up.` : `${entity.name} is lying wounded.`;
  return null;
}

/** His three answers, each with what it does said on it: the shape of every question a family is asked. */
export function musterOptions(world, householdId, entity) {
  const offer = (id, label, note) => { const why = musterRefusal(world, householdId, entity, id); return { id, label, note, can: !why, why: why || '' }; };
  return [
    offer('muster-join', 'Join the army', `${entity.name} is mustered in and marches with it for Béxar. The army feeds him.`),
    offer('muster-stay', 'Stay in Gonzales', `${entity.name} stays a volunteer in the town, on his own food once the army has gone. He can follow it later.`),
    offer('muster-home', 'Come home', `${entity.name} leaves the volunteers and walks home.`),
  ];
}

/** The family's answer for one of its men. */
export function answerMuster(world, householdId, entity, action, { beginTravel } = {}) {
  const why = musterRefusal(world, householdId, entity, action);
  if (why) throw new Error(why);
  settle(world, householdId, entity, ANSWER[action], 'choice', { beginTravel });
}

function settle(world, householdId, entity, answer, how, { beginTravel } = {}) {
  const ask = world.muster[householdId];
  ask.asks[entity.id] = answer;
  const said = {
    join: `${entity.name} joined the army at Gonzales, to march with it for Béxar.`,
    stay: `${entity.name} stayed in Gonzales as a volunteer when the army was made.`,
    home: `${entity.name} left the volunteers when the army was made, and started home.`,
  }[answer];
  const causeId = record(world, how === 'choice' ? 'choice' : 'army', { actorId: entity.id, householdId, importance: 2, claimId: 'FIC-GONZ-1185', causes: [ask.id],
    ...(how === 'choice' ? { decision: `muster-${answer}` } : { classification: 'FICTIONAL FOR GAMEPLAY' }),
    text: how === 'lapse' ? `Nobody answered for ${entity.name} in time, and he joined the army, as most of the men did.` : said });
  if (answer === 'stay') { entity.militia ??= {}; entity.militia.stays = true; }
  if (answer === 'join' && entity.militia) delete entity.militia.stays;
  if (answer === 'home' && beginTravel) walkHome(world, world.households[householdId], entity, { beginTravel, why: said });
  if (!Object.values(ask.asks).includes('open')) ask.status = 'answered';
  return causeId;
}

/**
 * Nobody answered in time (the call's five real minutes, sim/decision-budget.mjs), or the army marches with the question still
 * open: every man not answered for joins it (`FIC-GONZ-1185`). The army's own `fallIn` then takes him.
 */
export function lapseMuster(world, householdId) {
  const ask = musterAskFor(world, householdId);
  if (!ask) return;
  for (const [id, answer] of Object.entries(ask.asks)) if (answer === 'open' && world.entities[id]) settle(world, householdId, world.entities[id], 'join', 'lapse');
  ask.status = 'answered';
}
/** The army marches: every question still open is answered for it, as joining. */
export function closeMuster(world) {
  for (const householdId of Object.keys(world.muster || {})) lapseMuster(world, householdId);
}

/**
 * Whether a volunteer who stayed in Gonzales may go after the army from his bar now, and if not why (owner, 2026-10-06; `FIC-GONZ-1186`):
 * while it is in the field, until it breaks up after Béxar.
 */
export function joinRefusal(world, person) {
  if (!world.army) return 'There is no army to join yet.';
  if ((world.period ?? 1) !== 1 || world.director?.milestones?.['cos-marches']) return 'The army has broken up, and the men are going home.';
  if (!person?.militia?.stays) return `${person?.name || 'He'} has not stayed behind: he is with the volunteers.`;
  if (person.travel) return `${person.name} is on the road.`;
  if (person.location?.siteId !== RENDEZVOUS) return `${person.name} goes after the army from Gonzales.`;
  return null;
}
/** He goes after the army: no longer staying behind. The army's own road takes him (sim/army.mjs `followTheArmy`, `fallIn`). */
export function joinArmyLater(world, household, person) {
  const why = joinRefusal(world, person);
  if (why) throw new Error(why);
  delete person.militia.stays;
  const ask = world.muster?.[household.id];
  if (ask?.asks?.[person.id]) ask.asks[person.id] = 'join';
  record(world, 'choice', { actorId: person.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-1186', decision: 'join-army',
    text: world.army.phase === 'organised' ? `${person.name} went to join the army at Gonzales.` : `${person.name} set out from Gonzales to join the army before Béxar.` });
}

/** The question as the family's request (sim/directors.mjs `directorProjection`): its words, and each man asked with his answers. */
export function musterProjection(world, householdId) {
  const ask = musterAskFor(world, householdId);
  if (!ask) return null;
  return { id: ask.id, text: ask.text, status: 'open', offeredMinute: ask.offeredMinute, people: Object.entries(ask.asks).filter(([, answer]) => answer === 'open').map(([id]) => id) };
}

/** A saved muster that cannot be, or null. Absent on every class saved before 2026-10-06. */
export function musterInvalid(world) {
  if (world.muster === undefined) return null;
  if (!world.muster || typeof world.muster !== 'object') return 'Invalid muster';
  for (const [householdId, ask] of Object.entries(world.muster)) {
    if (!world.households?.[householdId] || !ask || !['open', 'answered'].includes(ask.status) || !ask.asks || typeof ask.asks !== 'object') return 'Invalid muster';
    if (Object.entries(ask.asks).some(([id, answer]) => !world.entities[id] || !['open', 'join', 'stay', 'home'].includes(answer))) return 'Invalid muster';
  }
  return null;
}
