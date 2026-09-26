// The storming of Béxar on the engine: the director's part (docs/BATTLES.md §6.2 steps 3-5; docs/battle-research/staging.md
// §3). sim/battles/bexar-storming.mjs is the fight as data; this puts the families' people in it and takes them out again.
//
// Owner, 2026-09-25: "if they sent a character, it needs to happen in such a way that their character arrives in time to
// participate and does participate. after each battle different things will happen for each battle. sometimes it might be
// appropriate for them to come home. other times, not. ... players should walk away understanding what happened."
//
// What it does, every tick of the siege from Milam's call (sim/directors.mjs `advanceStorming` calls it):
//   - **Arrival** (staging.md §3.6, `FIC-GONZ-428`). At three in the morning of December 5 everybody who said yes to Milam
//     leaves the ranks at the mill and walks into the town with a division - Milam's or Johnson's, by a seeded even share -
//     and on December 8 anybody who said yes to Burleson's call walks in with the companies from the camp. Nobody is set
//     down: they walk, a mile in twenty minutes of the calendar, and are in the houses before the fighting reaches them.
//   - **Taking part.** In the town they stand in their unit (a side or a group of the engagement) at their own place, and the
//     page draws them doing what it does. Who was in the line while it fired is written down (`fought`).
//   - **Their fate at a moment inside the fighting** (`HIST-TEX-490`, `FIC-GONZ-427`). The roll the storming has always made
//     (sim/army.mjs `stormingFate`) is read when they go in; a man who is hit is hit on a day weighted by Johnson's own daily
//     losses, at a roof, a crossing, a yard, a loophole or the Greys' door, and falls there - seen by his family if it is
//     watching, told to it only when the word comes (sim/army.mjs `tellStorming`). The wounded are carried to the house used
//     as a hospital. Those who come through are resolved at the white flag, as before.
//   - **The alert, through the person** (`FIC-GONZ-428`), before each held episode, with Watch; and the reserve at the mill is
//     told what it hears. **The Host's spotlight** on the town at each episode.
//   - **Afterwards** the account, in plain words, through the family's own person (or, for the reserve, its man at the mill),
//     at the capitulation; the army breaks up on the 14th as it always has (sim/army.mjs `disbandArmy`), the wounded staying.
//
// Nothing here moves a date or a count of the fight: those are the engagement's, fixed by the record.
import { record } from './events.mjs';
import { spotlight } from './host.mjs';
import { calendarMinutes, dateOf } from './clock.mjs';
import { BEXAR_STORMING, bexarGround } from './battles/bexar-storming.mjs';
import { armBattle, battleState, fatesDue, looseSlot, phaseOffset, placeFrom, projectBattle, stageFate, unitPlace } from './battle-stage.mjs';
import { resolveStormer, stormingFate } from './army.mjs';

export const BEXAR_ID = BEXAR_STORMING.id;
const DEF = BEXAR_STORMING;
const phaseAt = id => phaseOffset(DEF, id);

const unit = text => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const alive = person => person && !['dead', 'captured'].includes(person.health?.condition);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayWords = (world, minute) => { const date = dateOf(world, minute); return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`; };

/**
 * When a family's man who is hit is hit (`HIST-TEX-490`: Johnson's losses by day). December 5 carried one killed and 15 of
 * 26 wounded, about 58 in 100; the 6th five, about 19; the 7th Milam and two, about 12; the 8th three and Belden, about 11.
 * Within a day, the phase and the minutes of it a hit may land in, with the share of that day's hits it takes, and what the
 * family is told he was doing - "exposure, not constitution" (bexar-storming.md §8.2): roofs, crossings, yards, the guns.
 */
export const FATE_DAYS = Object.freeze([
  { day: 5, share: 0.58, moments: [
    { phase: 'entry', from: 12, to: 84, share: 0.6, where: 'going into the houses on Soledad Street before daylight' },
    { phase: 'cannonade', from: 4, to: 56, share: 0.25, where: 'under the cannonade from the town and the Alamo' },
    { phase: 'pinned-5', from: 60, to: 600, share: 0.15, where: 'at a loophole in the house they held' },
  ] },
  { day: 6, share: 0.19, moments: [{ phase: 'pinned-6', from: 60, to: 840, share: 1, where: 'at a loophole in the house they held' }] },
  { day: 7, share: 0.12, moments: [
    { phase: 'karnes', from: 8, to: 36, share: 0.4, where: 'at the door Karnes broke in', unit: 'york' },
    { phase: 'yard', from: 5, to: 45, share: 0.3, where: 'crossing a yard between the houses', unit: 'johnson' },
    { phase: 'milam', from: 6, to: 28, share: 0.3, where: 'in the Veramendi yard, the afternoon Milam fell', unit: 'johnson' },
  ] },
  { day: 8, share: 0.11, moments: [
    { phase: 'row', from: 200, to: 760, share: 0.45, where: 'in Zambrano Row, going room to room', unit: 'navarro' },
    { phase: 'priests-house', from: 32, to: 70, share: 0.55, where: 'with the Greys at the priest’s house on the plaza', unit: 'greys' },
  ] },
]);
/** Groups a man who went with the Greys to the Priest's House stays with afterwards, where the phase has them. */
const WITH_THE_GREYS = new Set(['priests-house', 'night-8', 'flag']);

/** Pick, by a seeded share, the moment a man's hit falls: a day, a phase, a minute inside it. Reinforcements only on the 8th. */
export function fateMoment(world, personId, state, { via }) {
  const days = via === 'reinforce' ? FATE_DAYS.filter(day => day.day === 8) : FATE_DAYS;
  const total = days.reduce((sum, day) => sum + day.share, 0);
  let roll = unit(`${world.seed}:${personId}:storming-day`) * total, day = days.at(-1);
  for (const one of days) { if (roll < one.share) { day = one; break; } roll -= one.share; }
  let pick = unit(`${world.seed}:${personId}:storming-moment`), moment = day.moments.at(-1);
  for (const one of day.moments) { if (pick < one.share) { moment = one; break; } pick -= one.share; }
  const phase = state.phases.find(one => one.id === moment.phase);
  // A man coming in with the companies from the camp is hit only once he is in the town (after half past eight).
  const from = via === 'reinforce' && moment.phase === 'row' ? Math.max(moment.from, 180) : moment.from;
  const into = Math.round(from + unit(`${world.seed}:${personId}:storming-minute`) * (moment.to - from));
  return { minute: phase.from + into, phase: moment.phase, where: moment.where, ...(moment.unit && { unit: moment.unit }) };
}

/** Everybody who went into the town, as the engine keeps them. */
const participants = world => world.battles?.[BEXAR_ID]?.participants || {};
/** The army's answer for this person to one of the storming's questions. */
const answered = (world, key, id) => world.army?.questions?.[key]?.asks?.[id];

/**
 * Somebody goes in: taken out of the ranks at the mill (they are no longer on the army's halted journey but standing at
 * Béxar), given a division, and their fate read and staged. Once.
 */
function goIn(world, battle, state, person, via) {
  if (battle.participants[person.id]) return battle.participants[person.id];
  const division = via === 'reinforce' ? 'reinforce' : unit(`${world.seed}:${person.id}:division`) < 0.5 ? 'texian' : 'johnson';
  const entry = battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, via, division, placed: true };
  if (person.travel?.purpose === 'march') person.travel = null;
  person.location = { x: person.location.x, y: person.location.y, siteId: 'bexar' };
  // Where the family sent them, and staying there (sim/neighbours.mjs leaves a person on 'help' where they are).
  person.task = 'help';
  const { fate, grade } = stormingFate(world, person.id);
  if (fate !== 'unhurt') {
    const moment = fateMoment(world, person.id, state, { via });
    // A moment already past when somebody arrives (a class saved before this, reopened in the middle) lands on the next tick.
    stageFate(world, BEXAR_ID, person.id, { fate, ...(grade && { grade }), ...moment, minute: Math.max(moment.minute, world.minute + 1) });
    if (moment.unit) entry.fateUnit = { phase: moment.phase, unit: moment.unit };
  }
  record(world, 'army', {
    actorId: person.id, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-428',
    text: via === 'reinforce'
      ? `${person.name} went into the town with the companies Burleson sent from the camp.`
      : `${person.name} left the mill with ${division === 'texian' ? 'Milam’s' : 'Johnson’s'} division in the dark, to go into San Antonio.`,
  });
  return entry;
}

/** Which unit of the phase this person stands in: their division, the Greys' file, the company at a door. */
export function unitFor(entry, phase) {
  const has = id => id === 'texian' || (phase.groups || []).some(group => group.id === id);
  if (entry.fateUnit && (entry.fateUnit.phase === phase.id || (entry.fateUnit.unit === 'greys' && WITH_THE_GREYS.has(phase.id))) && has(entry.fateUnit.unit)) return entry.fateUnit.unit;
  return has(entry.division) ? entry.division : 'texian';
}

/**
 * The storming, every tick from Milam's call. `moments` are the director's dated moments it needs (`capitulation`), and
 * `remember` the director's own journal of memories.
 */
export function advanceBexarFight(world, start, { moments = {}, remember = null, causeId = null } = {}) {
  if (!world.map?.sites?.bexar || !world.army) return;
  const battle = armBattle(world, BEXAR_ID, start);
  const state = battleState(world, BEXAR_ID);
  if (!state || state.before) return;
  const phaseId = state.phase?.id;
  const index = state.phase?.index ?? state.phases.length;
  const flagDone = world.director?.milestones?.['white-flag'];
  const outIndex = state.phases.find(phase => phase.id === 'out').index;
  const releaseIndex = state.phases.find(phase => phase.id === 'parley').index;

  // Arrival (staging.md §3.6 fixes 1 and 3). A class that had already fought the storming before this build keeps it.
  if (!state.over && !flagDone && index >= outIndex && index < releaseIndex) {
    for (const id of [...(world.army.members || [])]) {
      const person = world.entities[id];
      if (!alive(person) || battle.participants[id]) continue;
      if (person.travel && person.travel.purpose !== 'march') continue;
      if (answered(world, 'milam', id) === 'yes') goIn(world, battle, state, person, 'milam');
      else if (answered(world, 'reinforce', id) === 'yes') goIn(world, battle, state, person, 'reinforce');
    }
  }
  // Each fate at its moment, where the man stands.
  for (const due of fatesDue(world, BEXAR_ID)) {
    const person = world.entities[due.personId], entry = battle.participants[due.personId];
    const fate = battle.fates[due.personId];
    fate.applied = world.minute;
    if (!person || !entry || !alive(person) || flagDone) continue;
    const outcome = resolveStormer(world, person.id, causeId, { at: { x: person.location.x, y: person.location.y }, when: dayWords(world, due.minute), where: due.where });
    entry.fought ??= due.minute;
    if (outcome?.fate === 'killed') entry.fell = due.minute;
    if (outcome?.fate === 'wounded') entry.hurt = due.minute;
  }
  placeInTheTown(world, battle, state);
  // Released once the flag has been met: the fighting is over and they may be sent for, from the town (`heldByBattle`).
  if (index >= releaseIndex || state.over) for (const entry of Object.values(battle.participants)) entry.released ??= world.minute;

  alertFamilies(world, battle, state);
  spotlightTheTown(world, battle, state, phaseId);
  if (Number.isFinite(moments.capitulation) && world.minute >= moments.capitulation) tellTheAccounts(world, battle, remember);
}

/**
 * Everybody in the town at their place in their unit, walked there at a walker's pace; a man down stays down; a wounded man
 * is carried to the hospital house (`FIC-GONZ-427`). Who was in a line while it fired is written down.
 */
function placeInTheTown(world, battle, state) {
  if (!state.phase) return;
  const ground = bexarGround(world), phase = state.phase, into = Math.min(state.into ?? phase.minutes, phase.minutes);
  const reach = Math.max(0.05, calendarMinutes(world) / 20);
  const walk = (person, target, pace = 1) => {
    const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y), step = reach * pace;
    const part = gap <= step ? 1 : step / gap;
    person.location = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part, siteId: 'bexar' };
  };
  const ids = Object.keys(battle.participants).sort();
  ids.forEach((id, index) => {
    const person = world.entities[id], entry = battle.participants[id];
    if (!person || !entry.placed || person.health?.condition === 'dead' || person.travel) return;
    if (person.health?.condition === 'wounded') { walk(person, ground.hospital, 0.5); return; }
    // Once the army breaks up (sim/army.mjs `disbandArmy`) they are on the road home and no longer ours to place.
    if (!world.army?.members?.includes(id)) return;
    const unitId = unitFor(entry, phase);
    const centre = unitPlace(ground, phase, unitId, into);
    if (!centre) return;
    const spec = unitId === 'texian' ? phase.texian : (phase.groups || []).find(group => group.id === unitId);
    const enemy = unitPlace(ground, phase, 'mexican', into);
    const dx = enemy.x - centre.x, dy = enemy.y - centre.y, span = Math.hypot(dx, dy) || 1;
    const spread = spec?.style === 'column' ? { width: 0.02, depth: 0.08 } : spec?.spread || DEF.sides.texian.spread;
    walk(person, placeFrom(centre, { x: dx / span, y: dy / span }, looseSlot(id, index, spread)));
    if (phase.contact && (spec?.fire || 'none') !== 'none' && !Number.isFinite(entry.fought)) entry.fought = world.minute;
  });
}

/** The alert cards: which episode, when it is put, until when it stands, and the words at the person's side. */
const EPISODES = [
  { id: 'entry', from: 'out', until: 'pinned-5', who: 'in', text: name => `At ${name}'s side, a sergeant of the division: "We go in now, down the two streets, keeping to the walls. At five Neill's gun fires on the Alamo to draw them off." They are leaving the mill in the dark.` },
  { id: 'heard', from: 'feint', until: 'pinned-5', who: 'mill', text: name => `At ${name}'s side, at the mill: cannon fire from the Alamo and the town. The men who went in with Milam are in the streets.` },
  { id: 'reinforce', from: 'row', until: 'priests-house', who: 'reinforce', text: name => `At ${name}'s side: the companies from the camp are going into the town, down the trench and through the houses.` },
  { id: 'karnes', from: 'karnes', until: 'night-7', who: 'in', text: name => `At ${name}'s side: "Karnes has a crowbar and is going for the door ahead."` },
  { id: 'priests', from: 'priests-house', until: 'night-8', who: 'in', text: name => `At ${name}'s side: "The Greys are going for the priest's house on the plaza tonight."` },
  { id: 'flag', from: 'flag', until: 'parley', who: 'all', text: name => `At ${name}'s side: the firing has stopped. A white flag is coming to the plaza.` },
];
const TITLES = { entry: 'Into San Antonio', heard: 'The storming has begun', reinforce: 'Into the town from the camp', karnes: 'Karnes and the crowbar', priests: 'The Priest’s House', flag: 'The white flag' };

/** The person of this family who is in the town, alive (and not yet let go), or at the mill with the army. */
function familyPerson(world, battle, householdId, who) {
  const household = world.households[householdId];
  const people = household.members.map(id => world.entities[id]).filter(alive);
  const inTown = people.find(person => battle.participants[person.id] && !battle.participants[person.id].released && (who !== 'reinforce' || battle.participants[person.id].via === 'reinforce'));
  if (who === 'in' || who === 'reinforce') return inTown || null;
  const atMill = people.find(person => world.army?.members?.includes(person.id) && !battle.participants[person.id] && (!person.travel || person.travel.purpose === 'march'));
  if (who === 'mill') return inTown ? null : atMill || null;
  return inTown || atMill || null;
}
function alertFamilies(world, battle, state) {
  if (!state.phase || state.over) return;
  for (const episode of EPISODES) {
    const from = state.phases.find(one => one.id === episode.from), until = state.phases.find(one => one.id === episode.until);
    if (world.minute < from.from || world.minute >= until.from) continue;
    for (const household of Object.values(world.households)) {
      const done = battle.alerted[household.id];
      if (done?.episodes?.[episode.id]) continue;
      const person = familyPerson(world, battle, household.id, episode.who);
      if (!person) continue;
      const text = episode.text(person.name);
      const eventId = record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-428', text });
      battle.alerted[household.id] = { episodes: { ...(done?.episodes || {}), [episode.id]: world.minute }, episode: episode.id, eventId, minute: world.minute, until: until.from, entityId: person.id, text, title: TITLES[episode.id] };
    }
  }
}

/** The Host's spotlight on the town for each episode (docs/BATTLES.md §2.1): the field, not Béxar's name on the map. */
const SPOTS = {
  feint: { key: 'bexar-entry', claimId: 'HIST-TEX-037', text: 'Béxar, before daylight on December 5: Neill’s gun fires on the Alamo, and Milam’s and Johnson’s divisions go down two streets into the town.' },
  karnes: { key: 'bexar-karnes', claimId: 'HIST-TEX-038', text: 'Béxar, noon on December 7: Henry Karnes forces a door with a crowbar and York’s company follows him in.' },
  milam: { key: 'bexar-milam', claimId: 'HIST-TEX-039', text: 'Béxar, half past three on December 7: Ben Milam is shot dead in the yard of the Veramendi house.' },
  'priests-house': { key: 'bexar-priests', claimId: 'HIST-TEX-495', text: 'Béxar, the night of December 8: the Greys and Patton’s company creep under the loopholes into the priest’s house on the plaza.' },
  flag: { key: 'bexar-flag', claimId: 'HIST-TEX-491', text: 'Béxar, dawn on December 9: the guns stop, a bugle sounds, and a white flag comes to the plaza.' },
  'marching-out': { key: 'bexar-cos', claimId: 'HIST-TEX-496', text: 'December 14: Cos’s army marches out of Béxar on parole, for the Rio Grande.' },
};
/** The middle of the town's fighting: where the Host's spotlight and a student's Watch go. */
export function townCentre(world) {
  const ground = bexarGround(world), points = ['garza', 'plaza', 'alamoWest'].map(name => ground[name]);
  return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
}
function spotlightTheTown(world, battle, state, phaseId) {
  const spot = SPOTS[phaseId];
  if (!spot || battle.spotlit?.[phaseId]) return;
  battle.spotlit = { ...(battle.spotlit || {}), [phaseId]: world.minute };
  spotlight(world, { key: spot.key, text: spot.text, ...townCentre(world), claimId: spot.claimId });
}

/**
 * What a family is told through its own person when the capitulation is signed (docs/BATTLES.md §2.8; staging.md §3.8): what
 * happened, what their person did, why it ended as it did, and what comes next. A man killed tells nothing: his family learns
 * it when the word comes (`tellStorming`, and `docs/ALAMO_FATES.md`'s rule, "no fate before the word").
 */
export function bexarAccount(world, person, entry, outcome) {
  const name = person.name;
  const happened = 'What happened: on December 4 most of the army was packing up for winter quarters, and many men had already started home. Then a Mexican officer came over and said the town was weak, and Ben Milam asked who would go in with him. Two or three hundred men said yes. Before daylight on the 5th they crept into Béxar in two divisions and broke into two stone houses north of the plaza. For four days and nights they fought from house to house: cutting holes in the thick walls to shoot through, digging trenches across the streets, breaking through walls with crowbars, while cannon fired on them from the town and from the Alamo. Milam was shot and killed on the third day. On the fourth night they took the priest’s house on the plaza itself. That night General Cos drew his men back into the Alamo, some of his cavalry rode away, and in the morning a white flag came out. The people of Béxar had been shut in their houses through all of it; a woman of the town was shot carrying water.';
  let did;
  if (!entry) did = `${name} held the camp at the old mill with Burleson’s reserve while the others fought in the town, and heard the guns and saw the smoke over the roofs. The reserve lost nobody.`;
  else {
    const went = entry.via === 'reinforce' ? `went in with the companies sent from the camp on the 8th` : `went in with ${entry.division === 'johnson' ? 'Johnson’s division to a stone house on the river side of Soledad Street' : 'Milam’s division to a stone house on the west side of the street'} before daylight on the 5th`;
    const fired = Number.isFinite(entry.fought) ? ', and fired through the loopholes with the rest' : '';
    const hurt = outcome?.fate === 'wounded'
      ? outcome.grade === 'slight' ? ` ${name} was slightly hurt ${outcome.day ? `on ${outcome.day}, ` : ''}${outcome.where || ''}, and was soon on their feet again.` : ` ${name} was ${outcome.grade === 'dangerous' ? 'dangerously' : 'badly'} wounded${outcome.day ? ` on ${outcome.day}` : ''}${outcome.where ? `, ${outcome.where}` : ''}, and is lying in the house the surgeons use as a hospital. The wound will keep ${name} in Béxar for weeks.`
      : ` ${name} came through unhurt.`;
    did = `${name} ${went}${fired}.${hurt}`;
  }
  const why = 'Why it ended so: the volunteers held the houses and kept pushing toward the plaza, and the Mexican garrison was worn out, short of food and water, and crowded with new recruits who could not fight. When the priest’s house fell, Cos drew back into the Alamo and asked for terms. By the capitulation he and his officers go into the interior on their word not to oppose the Constitution of 1824; his soldiers keep their muskets and ten rounds; the people of Béxar and their property are protected. Between four and six Texians were killed and about thirty wounded. How many Mexican soldiers fell the reports do not agree: about a hundred and fifty, or about three hundred.';
  const next = outcome?.fate === 'wounded' && outcome.grade !== 'slight'
    ? `What comes next: Cos will march out for the Rio Grande in a few days. Most of the colonists will start home when the army breaks up; ${name} stays in Béxar under the surgeons until the wound mends.`
    : `What comes next: Cos will march out for the Rio Grande in a few days, and then the army breaks up and ${name} starts home with the other colonists. The volunteers from the United States are staying to hold Béxar and the Alamo; in the new year a family may send somebody to join that garrison.`;
  return [happened, `What ${name} did: ${did}`, why, next].join('\n\n');
}
function tellTheAccounts(world, battle, remember) {
  const outcomes = world.army?.storming?.outcomes || [];
  for (const household of Object.values(world.households)) {
    if (battle.told[household.id]) continue;
    const people = household.members.map(id => world.entities[id]).filter(alive);
    // Somebody who went in, alive (wounded or not), or failing that somebody who held the camp at the mill.
    const inTown = people.find(person => battle.participants[person.id]);
    const atMill = people.find(person => world.participation?.['bexar-storming']?.[person.id]?.role === 'present');
    const person = inTown || atMill;
    if (!person) continue;
    const entry = inTown ? battle.participants[person.id] : null;
    const outcome = outcomes.find(one => one.id === person.id);
    const text = bexarAccount(world, person, entry, outcome);
    const eventId = record(world, 'consequence', { householdId: household.id, actorId: person.id, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-041', text });
    remember?.(world, household, person, eventId, entry ? `${person.name} was in San Antonio when Béxar was taken.` : `${person.name} was at the mill above Béxar when the town was taken.`);
    battle.told[household.id] = { eventId, minute: world.minute, entityId: person.id, text };
  }
}

/**
 * What a page is sent of the storming (docs/BATTLES.md §2.1, `FIC-GONZ-428`): the Host always while it is fought, its camera
 * on the town for the held episodes; a family while one of its people is in the town, or at the mill it is fought beside, or
 * fell in this phase (their family watched it); nobody else, and nothing of it. `seen` is who this page already sees, so a
 * family is told only of the people in the force it can see there. Returns null when the storming is not being fought.
 */
export function bexarProjection(world, householdId, role, { seen = [] } = {}) {
  const battle = world.battles?.[BEXAR_ID];
  const state = battle ? battleState(world, BEXAR_ID) : null;
  if (!state?.live) return null;
  const phase = state.phase;
  const inForce = Object.entries(battle.participants).filter(([id, entry]) => {
    const person = world.entities[id];
    if (!person || !entry.placed || person.travel) return false;
    return alive(person) || (entry.fell >= phase.from);
  }).map(([id]) => id);
  const units = Object.fromEntries(inForce.map(id => [id, unitFor(battle.participants[id], phase)]));
  const fates = Object.fromEntries(Object.entries(battle.fates || {}).filter(([, fate]) => fate.applied));
  const project = members => ({ ...projectBattle(world, BEXAR_ID, { members, units, fates }), reconstruction: false });
  if (role === 'host') {
    const held = Boolean(phase.step && phase.contact);
    return { battle: project(inForce), host: { focus: held ? 'battle' : 'regional', caption: 'The storming of Béxar, live. Families with somebody in the town or at the mill see it too; the rest have not heard yet.', ...townCentre(world) } };
  }
  if (role !== 'student' || !householdId) return null;
  const household = world.households[householdId];
  const mine = household.members.map(id => world.entities[id]);
  const watching = mine.some(person => inForce.includes(person?.id))
    || mine.some(person => alive(person) && world.army?.members?.includes(person.id) && !battle.participants[person.id] && (!person.travel || person.travel.purpose === 'march'));
  const alert = alertCard(world, battle, state, householdId);
  const account = accountCard(world, battle, householdId);
  if (!watching) return { battle: null, ...(alert && { battleAlert: alert }), ...(account && { battleAccount: account }) };
  const visible = new Set([...household.members, ...seen]);
  return { battle: project(inForce.filter(id => visible.has(id))), ...(alert && { battleAlert: { ...alert, watching: true } }), ...(account && { battleAccount: account }) };
}
function alertCard(world, battle, state, householdId) {
  const alerted = battle.alerted?.[householdId];
  if (!alerted?.episode || world.minute >= alerted.until) return null;
  const person = world.entities[alerted.entityId];
  if (!alive(person)) return null;
  return { id: `battle:${BEXAR_ID}:${householdId}:${alerted.episode}`, entityId: person.id, title: alerted.title, text: alerted.text, field: townCentre(world), watching: false };
}
/** The account card, for a day after the capitulation. */
export function accountCard(world, battle, householdId) {
  const told = battle?.told?.[householdId];
  if (!told || world.minute - told.minute > 1440) return null;
  const person = world.entities[told.entityId];
  if (!person) return null;
  return { id: `account:${BEXAR_ID}:${householdId}`, entityId: person.id, title: `What ${person.name} saw at Béxar`, text: told.text };
}
/** The account card after the storming is over (the projection above is only for the live fight). */
export function bexarAccountOnly(world, householdId) {
  const card = accountCard(world, world.battles?.[BEXAR_ID], householdId);
  return card ? { battleAccount: card } : null;
}
export { phaseAt as bexarPhaseAt };
