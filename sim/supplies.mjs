// What the army before Béxar asks of the families at home (owner, 2026-09-29, by multiple choice on the triage's D5: "Supply
// request"; docs/audits/2026-09-29-triage.md D5, the design audit's S9; docs/COLONIES.md §6k-a; `FIC-GONZ-962`, `HIST-TEX-960`).
//
// A family that sent nobody to the army had no war decision from October 13 to December 15 - forty-five to sixty real minutes at
// the Study pace. The record has the army asking the settlements for what it lacked all through the siege (`HIST-TEX-960`): bread
// short by October 22, and the committee at San Felipe gathering blankets, shoes, powder and lead for it through the last week of
// October; on November 22 "the army is now out of Flour and the corn is exhausted", and Austin wrote for flour, beans and hard
// biscuit. So the army asks, twice, through the committee:
//
// - **The last week of October** (`supply-autumn`), of every family that has sent nobody: the council is gathering what the
//   settlements can send. Open from nine in the morning of October 26 to the day both councils of war voted not to storm (`siege`).
// - **After the flour ran out** (`supply-flour`), of every family with somebody at home: Austin's letter of the 22nd come to the
//   settlements. Open from nine in the morning of November 26 to the morning the army was ordered into winter quarters.
//
// Each is **one decision with a cost**: six food out of the store, two powder out of the house, or the family's horse - or nothing,
// which is a whole answer. Whatever is sent earns `supplied` (sim/glory.mjs, the support weight: one, counted once and not
// times the miles, since nobody of the family went with it: owner, 2026-09-30, "Flat"), once for each ask, and is gone for good: it goes west with
// the committee's wagons and nobody of the family goes with it. The first two are the record's; a horse is this game's own - the
// army needed horses for its scouts and horsemen, and took and appraised them, but no letter read asks a family for one.
//
// **One conversation at a time** (docs/COLONIES.md §5.4b, `FIC-GONZ-909`). The ask is word from the committee, not a rider at the
// gate, so it brings no rider of its own to pile up; put while a rider is talking with the family it waits until he has gone
// (sim/encounters.mjs `questionWaits`), unseen, with its minutes held. Shown, it is the family's request - the story card, the "!"
// on whoever may answer, the card's own options - on the settlement call's clock: five real minutes to answer (sim/decision-budget.mjs
// `CALL_BUDGET_MS`), and on lapse nothing is sent (sim/lapse.mjs). A family nobody plays, or whose student has gone, is answered by
// the neighbours' director as soon as it is asked: about half give, what they can best spare.
//
// Glory is written here and read nowhere else (sim/glory.mjs): nothing about who is asked, or what the director gives, reads it.
import { record } from './events.mjs';
import { recordLapse } from './lapse.mjs';
import { awardGlory } from './glory.mjs';
import { share } from './shares.mjs';
import { canAnswerCalls } from './family.mjs';
import { volunteersOf } from './army.mjs';
import { momentOf } from './directors.mjs';

/** What is sent when the family sends food or powder: six food is about three weeks of one grown person's eating. */
export const SUPPLY_FOOD = 6, SUPPLY_POWDER = 2;
/** The share of the families nobody plays that give when asked (`FIC-GONZ-962`): invented, like every director's share. */
export const DIRECTOR_GIVES = 0.5;
const GONE = Object.freeze(['dead', 'captured']);
const r4 = value => Math.round(value * 10000) / 10000;
/** A minute of this class's clock on a day and hour of 1835 (month from 1), as sim/disease.mjs `minuteOn` counts. */
const minuteAt = (world, month, day, hour) => (Date.UTC(1835, month - 1, day, hour) - (world.director?.arrival ? Date.UTC(1835, 8, 28, 6) : Date.UTC(1835, 8, 29))) / 60000;

/** The two asks, in order. `who` is which families are asked; `opens` and `closes` are minutes of the class's clock. */
export const SUPPLY_ASKS = Object.freeze({
  'supply-autumn': {
    who: 'sent-nobody', opens: world => minuteAt(world, 10, 26, 9), closes: world => momentOf(world, 'siege'),
    text: 'Word has come from the committee at San Felipe: the army before Béxar is short of bread, and the council is gathering what the settlements can send it - corn and beef, powder and lead, horses for the men who ride out scouting. Your family has nobody with the army. Can it send something?',
  },
  'supply-flour': {
    who: 'at-home', opens: world => minuteAt(world, 11, 26, 9), closes: world => momentOf(world, 'winter-quarters'),
    text: 'Word has come from the army before Béxar, sent on by the committee: the camp is out of flour and the corn is gone, and General Austin has written for flour, beans and biscuit. The committee asks every family that can spare anything to send it west with the wagons. What can your family send?',
  },
});
export const SUPPLY_ASK_IDS = Object.freeze(Object.keys(SUPPLY_ASKS));
/** The answers, in the order the card shows them. */
export const SUPPLY_ANSWERS = Object.freeze(['supply-food', 'supply-powder', 'supply-horse', 'supply-none']);
const SENT = Object.freeze({ 'supply-food': 'food', 'supply-powder': 'powder', 'supply-horse': 'horse' });

const people = (world, household) => household.members.map(id => world.entities[id]).filter(Boolean);
const atHome = (household, person) => person.location?.siteId === household.homeSiteId && !person.travel;
/** Somebody who may answer for the family, and is at home to hand it over. */
const mayAnswer = (world, household, person) => person?.kind === 'person' && !GONE.includes(person.health?.condition) && canAnswerCalls(person) && atHome(household, person);
/** The family's horse, at home and free, that could go: nobody riding it, using it or away on it. */
export function spareHorse(world, household) {
  const ids = new Set(household.property || []);
  const horses = Object.values(world.entities).filter(beast => beast?.kind === 'animal' && beast.species === 'horse' && (ids.has(beast.id) || beast.householdId === household.id));
  const users = Object.values(world.entities).filter(one => one?.kind === 'person' && (one.travel || one.chore));
  return horses.find(horse => !horse.travel && !horse.borrowedBy && (!horse.condition || horse.condition === 'sound') && !horse.hurt
    && horse.location?.siteId === household.homeSiteId
    && !users.some(one => JSON.stringify([one.travel, one.chore]).includes(`"${horse.id}"`))) || null;
}

/** The ask open to this family now, or null. */
export function supplyAskFor(world, householdId) {
  const asks = world.supplies?.[householdId];
  if (!asks) return null;
  for (const askId of SUPPLY_ASK_IDS) if (asks[askId]?.status === 'open') return { askId, ...asks[askId] };
  return null;
}

/** Put each ask to every family it is for, once, while it is open; close it when its day is past. Every tick. */
export function advanceSupplies(world) {
  if (!world.map?.sites?.bexar || !world.director || world.status !== 'running') return;
  for (const [askId, ask] of Object.entries(SUPPLY_ASKS)) {
    const opens = ask.opens(world), closes = ask.closes(world);
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || world.minute < opens) continue;
    for (const household of Object.values(world.households)) {
      const asked = world.supplies?.[household.id]?.[askId];
      if (asked) { if (asked.status === 'open' && world.minute >= closes) closeAsk(world, household, askId); continue; }
      if (world.minute >= closes) continue;
      // An earlier ask still open waits for its answer before the next is put (one question of this kind at a time).
      if (supplyAskFor(world, household.id)) continue;
      if (ask.who === 'sent-nobody' && volunteersOf(world, household.id).length) continue;
      if (!people(world, household).some(person => mayAnswer(world, household, person))) continue;
      const id = record(world, 'pressure', { householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-962', causes: [], text: ask.text });
      world.supplies ??= {};
      world.supplies[household.id] ??= {};
      world.supplies[household.id][askId] = { id, text: ask.text, status: 'open', offeredMinute: world.minute, closes };
      // A family nobody plays, or whose student has gone, is answered by the neighbours' director at once.
      if (!household.played || household.absent) directorAnswers(world, household, askId);
    }
  }
}

/** Whether this person can answer the ask this way, and if not, why, in the words on the control. */
export function supplyAvailability(world, householdId, entity, action) {
  const household = world.households[householdId];
  if (!SUPPLY_ANSWERS.includes(action)) return { can: false, why: 'That is not an answer to this.' };
  if (!entity || entity.householdId !== householdId || GONE.includes(entity.health?.condition)) return { can: false, why: `${entity?.name || 'They'} cannot answer.` };
  if (!canAnswerCalls(entity)) return { can: false, why: `${entity.name} is too young to answer for the family.` };
  if (!atHome(household, entity)) return { can: false, why: `${entity.name} is away from home: whoever answers has to be there to hand it over.` };
  if (action === 'supply-food' && !((household.resources.food ?? 0) >= SUPPLY_FOOD)) return { can: false, why: `The family has less than ${SUPPLY_FOOD} food to send.` };
  if (action === 'supply-powder' && !((household.resources.powder ?? 0) >= SUPPLY_POWDER)) return { can: false, why: `The family has less than ${SUPPLY_POWDER} powder to send.` };
  if (action === 'supply-horse' && !spareHorse(world, household)) return { can: false, why: 'The family has no horse at home that is free to go.' };
  return { can: true, why: '' };
}

/** The four answers, each with its price said before it is chosen: the same shape as every call. */
export function supplyOptions(world, householdId, entity) {
  const offer = (id, label, note) => ({ id, label, note, ...supplyAvailability(world, householdId, entity, id) });
  return [
    offer('supply-food', `Send ${SUPPLY_FOOD} food`, `${SUPPLY_FOOD} food out of the family's store goes west with the committee's wagons, for good.`),
    offer('supply-powder', `Send ${SUPPLY_POWDER} powder`, `${SUPPLY_POWDER} powder out of the house goes to the army: less for hunting until more is bought.`),
    offer('supply-horse', 'Send the horse', 'The family\'s horse goes west for the men who ride out scouting, and does not come back.'),
    offer('supply-none', 'Keep what the family has', 'Nothing is sent. The family keeps its food, its powder and its horse.'),
  ];
}

/** The family's answer, given by one of it at home. Sending is the whole answer; so is keeping everything. */
export function answerSupply(world, householdId, entity, action) {
  const household = world.households[householdId];
  const open = supplyAskFor(world, householdId);
  if (!household || !open) throw new Error('Nobody is asking that.');
  const allowed = supplyAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  settle(world, household, open.askId, action, entity, 'choice');
}

/** What the neighbours' director sends for a family nobody is answering for: about half give, what they can best spare. */
function directorAnswers(world, household, askId) {
  const answerer = people(world, household).find(person => mayAnswer(world, household, person));
  if (!answerer) return;
  const gives = share(world, household.id, `supply:${askId}`) < DIRECTOR_GIVES;
  const food = household.resources.food ?? 0, powder = household.resources.powder ?? 0;
  const action = !gives ? 'supply-none' : food >= SUPPLY_FOOD * 3 ? 'supply-food' : powder >= SUPPLY_POWDER * 2 ? 'supply-powder' : 'supply-none';
  settle(world, household, askId, action, answerer, 'director');
}

function settle(world, household, askId, action, entity, how) {
  const ask = world.supplies[household.id][askId];
  const what = SENT[action];
  const said = { food: `${SUPPLY_FOOD} food`, powder: `${SUPPLY_POWDER} powder`, horse: 'the family\'s horse' }[what];
  const text = what ? `${entity.name} sent ${said} west to the army before Béxar with the committee's wagons.` : `${entity.name} kept what the family has: nothing was sent to the army.`;
  const choiceId = record(world, how === 'choice' ? 'choice' : 'army', { actorId: entity.id, householdId: household.id, importance: 2, causes: [ask.id], claimId: 'FIC-GONZ-962', ...(how === 'choice' ? { decision: action } : { classification: 'FICTIONAL FOR GAMEPLAY' }), text });
  ask.status = what ? 'sent' : 'kept';
  ask.actorId = entity.id; ask.sent = what || null; ask.choiceId = choiceId;
  if (!what) return;
  if (what === 'food') household.resources.food = r4((household.resources.food ?? 0) - SUPPLY_FOOD);
  if (what === 'powder') household.resources.powder = r4((household.resources.powder ?? 0) - SUPPLY_POWDER);
  if (what === 'horse') {
    const horse = spareHorse(world, household);
    household.property = (household.property || []).filter(id => id !== horse.id);
    delete world.entities[horse.id];
  }
  // The family's part in the siege (`HIST-TEX-960`), at the support weight, once for each ask (sim/glory.mjs) - and **flat** (owner,
  // 2026-09-30, "Flat"): counted once, not times the miles from Béxar, because nobody of the family travelled with it.
  awardGlory(world, { event: askId, claimId: 'HIST-TEX-960', personId: entity.id, householdId: household.id, role: 'supplied', fromSiteId: 'bexar', causes: [choiceId], flat: true });
}

/** An ask nobody answered in time: closed, and nothing sent. On its real-time budget (sim/decision-budget.mjs) or on its day. */
export function lapseSupply(world, householdId) {
  const open = supplyAskFor(world, householdId);
  if (!open) return;
  closeAsk(world, world.households[householdId], open.askId);
}
function closeAsk(world, household, askId) {
  const ask = world.supplies?.[household.id]?.[askId];
  if (!ask || ask.status !== 'open') return;
  ask.status = 'expired'; ask.lapsed = true;
  recordLapse(world, { householdId: household.id, causes: [ask.id], text: 'Nobody from this family answered the army\'s request in time, and it lapsed. Nothing was sent.' });
}

/** The ask as the family's request (sim/directors.mjs `directorProjection`): its words, and each who may answer with their prices. */
export function supplyProjection(world, householdId) {
  const open = supplyAskFor(world, householdId);
  if (!open) return null;
  return { id: open.id, text: open.text, status: 'open', askId: open.askId, offeredMinute: open.offeredMinute };
}

/** A saved ask that cannot be, or null. Absent on every class saved before 2026-09-29, which is nobody asked yet. */
export function suppliesInvalid(world) {
  if (world.supplies === undefined) return null;
  if (!world.supplies || typeof world.supplies !== 'object') return 'Invalid supplies';
  for (const [householdId, asks] of Object.entries(world.supplies)) {
    if (!world.households[householdId] || !asks || typeof asks !== 'object') return 'Supplies asked of a family that is not there';
    for (const [askId, ask] of Object.entries(asks)) {
      if (!SUPPLY_ASKS[askId] || !['open', 'sent', 'kept', 'expired'].includes(ask?.status) || !Number.isFinite(ask.offeredMinute)) return 'Invalid supply request';
      if (ask.status === 'sent' && !['food', 'powder', 'horse'].includes(ask.sent)) return 'Invalid supply request';
      if (['sent', 'kept'].includes(ask.status) && !world.entities[ask.actorId]) return 'A supply request answered by nobody';
    }
  }
  return null;
}
