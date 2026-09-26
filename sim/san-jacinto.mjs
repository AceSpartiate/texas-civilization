// San Jacinto's director: the battle on the engine (sim/battles/san-jacinto.mjs, docs/BATTLES.md §6, §7), every tick of the
// third period on the real land. Kept out of sim/directors.mjs, which only calls it, so the fight's rules are in one file.
//
// Owner, 2026-09-25: "players that have a character there should get an alert to watch. if they sent a character, it needs
// to happen in such a way that their character arrives in time to participate and does participate. after each battle
// different things will happen for each battle. ... players should walk away understanding what happened."
//
// What it does, all of it dated by the engagement's own phases so nothing here moves a date:
//   - **Who is there** (`FIC-GONZ-442`): every man with Houston standing at the Lynchburg camp is drawn in the Texian camp
//     from the moment the armies meet; from the parade (half past three on the 21st) until the first shot every such man on
//     his feet is **in the line** (`participants`), held there, placed in the ranks and drawn doing what the line does.
//     Presence is by place, never by a service record (sim/houston.mjs `inTheLine`).
//   - **His fate** (`FIC-GONZ-443`): the same seeded roll as always (sim/houston.mjs `fightSanJacinto`), made at half past
//     four; a man killed or hurt goes down at a staged minute inside the charge, which his own family's page and the Host's
//     draw, and nobody else's. His family's journal and his panel learn it only with the word, on the 23rd.
//   - **The alert** (docs/BATTLES.md §2.7, `FIC-GONZ-444`): through him, when the armies meet and again at the parade, with
//     Watch; nobody else is told. A family camped at Lynchburg hears the guns, in words.
//   - **The Host**: live, the camera on the field while a watched phase runs, and the spotlight on the field, the bridge and
//     the capture.
//   - **Afterwards**: the account in plain words through him (or, if he fell, through the family's main person), when the
//     word reaches the family, in the journal and on the card for a day.
import { record } from './events.mjs';
import { spotlight } from './host.mjs';
import { armBattle, battleState, looseSlot, phaseOffset, placeFrom, projectBattle, rankSlot, sidePlace, startsAt } from './battle-stage.mjs';
import { SAN_JACINTO_BATTLE as DEF, sanJacintoGround } from './battles/san-jacinto.mjs';
import { calendarMinutes } from './clock.mjs';
import { drilledSteady, fightSanJacinto, inTheLine } from './houston.mjs';
import { mainPersonId } from './family.mjs';
import { share } from './alamo.mjs';
import { momentOf } from './directors.mjs';

const ID = DEF.id;
const GONE = ['dead', 'captured'];
const index = phaseId => DEF.phases.findIndex(phase => phase.id === phaseId);
/** The minute of this class's clock one of the engagement's phases starts at. */
export const sanJacintoAt = (world, phaseId) => momentOf(world, DEF.startKey) + phaseOffset(DEF, phaseId);
// The clock holds to the fight from its first tick even in a class saved before this engagement was on the engine.
startsAt(ID, world => world.period === 3 && world.director && sanJacintoGround(world) ? momentOf(world, DEF.startKey) : null);

/** The men with Houston standing at the Lynchburg camp now: drawn in the Texian camp while the armies face each other. */
const inCamp = world => Object.values(world.entities).filter(person => person.householdId && person.service?.kind === 'houston'
  && person.service.status === 'serving' && !person.travel && person.location?.siteId === 'lynchburg' && !GONE.includes(person.health?.condition))
  .sort((a, b) => (a.id < b.id ? -1 : 1));
/** Everybody of the families drawn with the Texian force: the men in camp, and the men in the line (who stay drawn where they fell). */
export function sanJacintoMembers(world) {
  const battle = world.battles?.[ID];
  const line = Object.keys(battle?.participants || {}).map(id => world.entities[id]).filter(person => person && !battle.participants[person.id].released && person.health?.condition !== 'captured');
  const ids = new Set([...inCamp(world), ...line].map(person => person.id));
  return [...ids].sort().map(id => world.entities[id]);
}
/** A family's own people drawn with the force. */
const ownThere = (world, householdId) => sanJacintoMembers(world).filter(person => person.householdId === householdId);
/** The middle of the field: between Houston's camp and the breastwork, where Watch and the Host's camera go. */
export function sanJacintoField(world) {
  const ground = sanJacintoGround(world);
  return ground && { x: (ground.texianCamp.x + ground.breastwork.x) / 2, y: (ground.texianCamp.y + ground.breastwork.y) / 2 };
}

/** Every tick of the third period: arm the fight, put the men in camp and in the line, alert, the guns heard, the Host's camera. */
export function advanceSanJacinto(world) {
  const ground = sanJacintoGround(world);
  if (!ground || !world.director) return;
  const battle = armBattle(world, ID, momentOf(world, DEF.startKey));
  const state = battleState(world, ID);
  if (!state || state.before || state.over) return;
  const phase = state.phase, at = phase.index;
  // The line: from the parade until the guns open, every man with the army at the camp and on his feet falls in (`inTheLine`).
  // Whatever camp work he was at is put down; nothing can send him anywhere else until the word (sim/battle-stage.mjs `heldByBattle`).
  if (at >= index('parade') && at < index('guns')) {
    for (const person of inCamp(world)) {
      if (!inTheLine(world, person) || battle.participants[person.id]) continue;
      person.chore = null; person.task = 'rest';
      battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, drilled: drilledSteady(person) };
    }
  }
  placeMen(world, state, ground);
  alertFamilies(world, state);
  heardAtLynchburg(world, state);
  lightTheField(world, state);
}

/**
 * Each man walks to his own place and keeps it as the force moves: scattered through the camp while the armies face each
 * other; in the ranks from the parade (a man who has not drilled a little behind his rank as the line walks, `rankSlot`);
 * loose once the line comes apart at the breastwork. A man hit stays where he went down. They walk there at a walker's pace -
 * a mile in twenty minutes of the calendar - rather than being set down on it, so nobody is drawn jumping.
 */
function placeMen(world, state, ground) {
  const phase = state.phase, battle = state.battle;
  const centre = sidePlace(ground, phase, 'texian', Math.min(state.into, phase.minutes));
  const enemy = sidePlace(ground, phase, 'mexican', Math.min(state.into, phase.minutes));
  const dx = enemy.x - centre.x, dy = enemy.y - centre.y, span = Math.hypot(dx, dy);
  const facing = span > 1e-6 ? { x: dx / span, y: dy / span } : ground.toward;
  const style = phase.texian.style;
  const spread = phase.texian.spread || DEF.sides.texian.spread;
  const reach = Math.max(0.05, calendarMinutes(world) / 20);
  const walking = style === 'ranks' && phase.texian.action === 'advance';
  sanJacintoMembers(world).forEach((person, order) => {
    const entry = battle.participants[person.id];
    // Down where he fell, from the minute he fell, until the word (`FIC-GONZ-443`).
    if (entry?.fallsAt && world.minute >= entry.fallsAt && (entry.fate === 'killed' || state.phase.index < index('prisoners'))) return;
    const slot = style === 'ranks' && entry ? rankSlot(person.id, { drift: walking && !entry.drilled ? 1 : 0 }) : looseSlot(person.id, order, spread);
    const target = placeFrom(centre, facing, slot);
    const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y);
    const part = gap <= reach ? 1 : reach / gap;
    person.location = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part, siteId: 'lynchburg' };
    if (entry && (phase.texian.fire || 'none') !== 'none' && !Number.isFinite(entry.fought)) entry.fought = world.minute;
  });
}

/**
 * Half past four (`san-jacinto` on the director's clock): the men in the line are rolled as they always were, and each man
 * killed or hurt is given the minute he goes down, inside the charge, seeded by who he is so a reload never moves it.
 */
export function strikeSanJacinto(world, causeId) {
  const ground = sanJacintoGround(world);
  if (!ground) { fightSanJacinto(world, causeId); return; }
  const battle = armBattle(world, ID, momentOf(world, DEF.startKey));
  // Presence by place at the first shot: whoever of the line is still on his feet there, and anybody standing there who was
  // missed (a class saved in the middle of the parade by an older build).
  for (const person of inCamp(world)) if (inTheLine(world, person) && !battle.participants[person.id]) battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, drilled: drilledSteady(person) };
  const inLine = Object.keys(battle.participants).filter(id => inTheLine(world, world.entities[id]));
  fightSanJacinto(world, causeId, { inLine });
  const charge = sanJacintoAt(world, 'charge');
  for (const id of inLine) {
    const entry = battle.participants[id], fate = world.entities[id].service.fate;
    entry.fate = fate;
    // In the few minutes at the breastwork, when the Mexican gun and the hasty volleys fired (staging.md §8.5).
    if (fate === 'killed' || fate === 'wounded') entry.fallsAt = charge + 1 + Math.floor(share(world, id, 'san-jacinto-falls') * 4);
  }
}

/** Who of the families is down, and from when: sent to the Host and to each man's own family, never to anybody else. */
function memberStates(world, householdId) {
  const participants = world.battles?.[ID]?.participants || {};
  const states = {};
  for (const [id, entry] of Object.entries(participants)) {
    if (!entry.fallsAt || (householdId && entry.householdId !== householdId)) continue;
    states[id] = { down: entry.fate === 'killed' ? 'killed' : 'wounded', at: entry.fallsAt };
  }
  return states;
}

/** The card through the man, when the armies meet and at the parade (docs/BATTLES.md §2.7). Once each; never to anybody else. */
function alertFamilies(world, state) {
  const battle = state.battle, at = state.phase.index;
  if (at >= index('guns')) return;
  const stage = at >= index('parade') ? 'attack' : 'camp';
  for (const household of Object.values(world.households)) {
    const people = stage === 'attack' ? ownThere(world, household.id).filter(person => battle.participants[person.id]) : ownThere(world, household.id);
    const person = people[0];
    if (!person || battle.alerted[household.id]?.stage === stage || (stage === 'camp' && battle.alerted[household.id])) continue;
    const text = stage === 'camp'
      ? `At ${person.name}'s side: Santa Anna's army has come up and made its camp across the prairie, under a mile off. The men say there will be a fight.`
      : `At ${person.name}'s side: the captain passes the word down the company - "Parade under arms. We're going at them this afternoon." ${person.name} is in the line.`;
    battle.alerted[household.id] = { eventId: record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-444', text }), minute: world.minute, entityId: person.id, text, stage };
  }
}

/**
 * A family camped at Lynchburg with nobody in the fight hears it (`FIC-GONZ-444`): the guns, the musketry, and the firing
 * going on toward the marsh. In words, once each, like the gun heard in Gonzales - never the fight itself.
 */
function heardAtLynchburg(world, state) {
  const battle = state.battle, phaseId = state.phase.id;
  const heard = { guns: 'hears cannon to the south-west, toward the Mexican camp, and then a long roll of musketry. Nobody at the ferry can say yet what it means.', killing: 'hears the firing going on and on toward the marsh by the San Jacinto, until near dark.' }[phaseId];
  if (!heard) return;
  for (const household of Object.values(world.households)) {
    if (ownThere(world, household.id).length) continue;
    const listener = household.members.map(id => world.entities[id]).find(one => one?.kind === 'person' && !one.travel && one.location?.siteId === 'lynchburg' && !GONE.includes(one.health?.condition) && one.service?.status !== 'serving');
    if (!listener) continue;
    const got = battle.heard[household.id] ||= {};
    if (got[phaseId]) continue;
    got[phaseId] = record(world, 'consequence', { householdId: household.id, actorId: listener.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-444', text: `At Lynchburg, ${listener.name} ${heard}` });
  }
}

/** The Host's spotlight on the field, the bridge and the capture, once each. */
function lightTheField(world, state) {
  const battle = state.battle, lit = battle.spotlit ||= {}, field = sanJacintoField(world);
  const once = (key, make) => { if (lit[key]) return; lit[key] = world.minute; make(); };
  const id = state.phase.id;
  if (id === 'arrive') once('arrive', () => spotlight(world, { key: 'sj-arrive', text: 'April 20: Santa Anna’s army comes up at San Jacinto and camps under a mile from Houston’s.', ...field, claimId: 'HIST-TEX-523' }));
  if (id === 'skirmish') once('skirmish', () => spotlight(world, { key: 'sj-skirmish', text: 'Sherman’s horsemen skirmish with the Mexican infantry on the prairie at San Jacinto.', ...field, claimId: 'HIST-TEX-523' }));
  if (id === 'morning' && state.into >= 60) once('bridge', () => spotlight(world, { key: 'sj-bridge', text: 'Houston sends Deaf Smith to destroy Vince’s bridge, the road Cos’s reinforcements came in by.', siteId: 'vinces-bridge', claimId: 'HIST-TEX-153' }));
  if (id === 'parade') once('parade', () => spotlight(world, { key: 'sj-parade', text: 'Half past three, April 21: Houston parades the army at San Jacinto.', ...field, claimId: 'HIST-TEX-522' }));
}

/** The Host's projection and a family's, while the fight is live (docs/BATTLES.md §2.1). Null when there is nothing of it to send. */
export function sanJacintoProjection(world, householdId, role) {
  if (!world.battles?.[ID]) return null;
  const state = battleState(world, ID);
  if (!state?.live) return accountOnly(world, householdId, role);
  const members = sanJacintoMembers(world).map(person => person.id);
  const out = {};
  if (role === 'host') {
    out.battle = { ...projectBattle(world, ID, { members, memberStates: memberStates(world, null) }), reconstruction: false };
    out.host = { focus: state.phase.step ? 'battle' : 'regional', caption: 'San Jacinto, live. Families with somebody in Houston’s army see it too; the rest have not heard yet.', ...sanJacintoField(world) };
  } else if (role === 'student' && householdId && ownThere(world, householdId).length) {
    out.battle = { ...projectBattle(world, ID, { members, memberStates: memberStates(world, householdId) }), reconstruction: false };
  }
  if (role === 'student' && householdId) {
    const alert = alertFor(world, householdId, state, Boolean(out.battle));
    if (alert) out.battleAlert = alert;
  }
  return out;
}
function accountOnly(world, householdId, role) {
  const account = role === 'student' && householdId ? accountFor(world, householdId) : null;
  return account ? { battleAccount: account } : null;
}
function alertFor(world, householdId, state, watching) {
  const alerted = world.battles[ID].alerted?.[householdId];
  if (!alerted || state.phase.index >= index('search')) return null;
  const person = world.entities[alerted.entityId];
  if (!person || GONE.includes(person.health.condition)) return null;
  return { id: `battle:${ID}:${householdId}:${alerted.stage}`, entityId: person.id, title: alerted.stage === 'attack' ? 'The attack at San Jacinto' : 'The armies face each other', text: alerted.text, field: sanJacintoField(world), watching };
}
function accountFor(world, householdId) {
  const told = world.battles?.[ID]?.told?.[householdId];
  if (!told || world.minute - told.minute > 1440) return null;
  const person = world.entities[told.entityId];
  if (!person) return null;
  return { id: `account:${ID}:${householdId}`, entityId: person.id, title: told.title, text: told.text };
}

/**
 * The word of the victory reaches the families (`victory-word`): each family with a man with the army is told, through him
 * - or, if he fell, through the family's main person - what happened, what he did, and why it ended as it did (docs/BATTLES.md
 * §2.8; staging.md §8.8's account). Called before sim/houston.mjs `tellSanJacinto`, which releases the men and sends them home.
 */
export function tellSanJacintoAccounts(world, causeId) {
  const battle = world.battles?.[ID];
  const byFamily = new Map();
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.kind !== 'houston' || !(service.fate || service.absent) || service.told) continue;
    if (!byFamily.has(person.householdId)) byFamily.set(person.householdId, []);
    byFamily.get(person.householdId).push(person);
  }
  for (const [householdId, men] of byFamily) {
    const household = world.households[householdId];
    const text = sanJacintoAccount(world, men);
    const alive = men.find(one => one.service.fate !== 'killed');
    // Through him if he lived; if he fell, through whoever of the family can hear it - its main person, or the next of them.
    const fell = one => men.includes(one) && one.service.fate === 'killed';
    const hearer = [world.entities[mainPersonId(world, household)], ...household.members.map(id => world.entities[id])].find(one => one?.kind === 'person' && !GONE.includes(one.health?.condition) && !fell(one));
    const through = alive || hearer || men[0];
    const title = alive ? `What ${alive.name} saw at San Jacinto` : `What became of ${men[0].name} at San Jacinto`;
    const eventId = record(world, 'consequence', { householdId, actorId: through.id, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-522', causes: causeId ? [causeId] : [], text });
    if (battle) {
      battle.told[householdId] = { eventId, minute: world.minute, entityId: through.id, title, text };
      for (const one of men) if (battle.participants[one.id]) battle.participants[one.id].released = world.minute;
    }
  }
}

/** What happened, in plain words (staging.md §8.8, the owner's "players should walk away understanding what happened"). */
export function sanJacintoAccount(world, men) {
  const said = men.map(person => {
    const service = person.service, name = person.name;
    const drilled = drilledSteady(person) ? ', steady from the drill at the camp,' : '';
    if (service.absent === 'baggage') return `${name} was left sick with the baggage at Harrisburg when the army marched, with some two hundred and fifty others, mostly sick, and was not in the battle.`;
    if (service.absent === 'camp') return `${name} was in the camp, too sick or hurt to stand in the line, and saw the army go out.`;
    if (service.absent === 'road') return `${name} had not reached the army when it attacked, and was not in the battle.`;
    if (service.fate === 'killed') return `${name}${drilled} was in the line, and was killed in the charge at the breastwork.`;
    if (service.fate === 'wounded') return `${name}${drilled} was in the line, went over the breastwork with the rest, and was slightly hurt. ${name} is on their feet.`;
    return `${name}${drilled} was in the line, went over the breastwork with the rest, and came through unhurt.`;
  });
  const going = men.filter(person => person.service.fate !== 'killed').map(person => person.name);
  const home = going.length ? ` Many men stayed on with the army through the summer; ${going.join(' and ')} ${going.length > 1 ? 'are' : 'is'} let go, and starting home.` : '';
  const did = `What your family's own did: ${said.join(' ')}${home}`;
  return [
    'What happened: for five weeks General Houston had led the army east, away from Santa Anna, while the families fled ahead of both armies. On April 20 Santa Anna\'s army camped on the plain by the San Jacinto, under a mile from Houston\'s camp in the timber along Buffalo Bayou. In the night the Mexicans threw up a low wall of packs and saddles, and on the morning of the 21st General Cos came in with about 540 more men who had marched all night; Houston sent Deaf Smith to destroy Vince\'s bridge behind them. The afternoon was quiet in the Mexican camp and many of the soldiers were resting. At half past three Houston formed his 910 men in one long line, and they walked across the open prairie behind a low rise until they were close. The two cannon fired, the men fired, and then they ran at the Mexican camp shouting "Remember the Alamo! Remember Goliad!"',
    did,
    `Why it ended so: the Mexican army was caught unready, resting and not formed, and it broke in about eighteen minutes and ran toward the marsh and the lake behind its camp. Many Mexican soldiers were killed as they ran or tried to surrender, and the Texian officers could not stop it: about 630 were killed and about 730 taken prisoner, while nine Texians were killed or mortally wounded and about thirty wounded. The next day Santa Anna was found hiding in the grass in a common soldier\'s clothes, and was known when the prisoners called him "el presidente". He was brought before Houston, who lay wounded, and as a prisoner he ordered his troops to fall back. His capture ended the fighting of the war.`,
  ].join('\n\n');
}
