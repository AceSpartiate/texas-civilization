// The Alamo on the battle engine, the director's part (docs/BATTLES.md §7; the engagement is sim/battles/alamo.mjs).
//
// What the clock cannot give back is kept in `world.battles.alamo` (sim/battle-stage.mjs `armBattle`) and on each person's
// `service`: their post on the walls, the walk they are on, and - once the assault reaches their post - when they fell. The
// rest is read off the minute.
//
// Every tick of the second period, from the Mexican army's arrival to the evening of March 6:
//   - whoever is inside walks to their post, the garrison in from the town on February 23, the Gonzales men in from the gate
//     on March 1, and a woman or child to the sacristy at the alarm and out to Músquiz's house afterwards (sim/alamo-posts.mjs);
//   - the Gonzales men ride with their company from the place they waited in the dark, and are through the gate by four;
//   - at the assault each fighter falls at the moment the storming reaches his post (`fallMinute`), and each woman and child
//     is spared when the firing stops; nothing of it reaches the family's journal before the word (sim/alamo.mjs `tellFall`);
//   - the family with somebody there is told through that person when the army comes, when the relief goes in and when the
//     walls are stormed, with Watch; afterwards the student who watched is given what they saw, in words, on the card alone.
//
// Owner, 2026-09-25 (docs/BATTLES.md §2b.1): "a student may watch their own man fall ... the rest of the family's story ...
// learns only when the word reaches them."
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { spotlight } from './host.mjs';
import { calendarMinutes } from './clock.mjs';
import { ALAMO } from './battles/alamo.mjs';
import { armBattle, battleState, placeOf, projectBattle, stepOf } from './battle-stage.mjs';
import { alamoRole, share, stormAlamo } from './alamo.mjs';
import { OUT_OF_THE_CHURCH, POSTS, SACRISTY, TO_SACRISTY, advanceWalks, inFeet, onMap, postFor, postLabel, setWalk, spotOf, wallOf, walkToPost } from './alamo-posts.mjs';

const GONE = ['dead', 'captured'];
const alive = person => !GONE.includes(person?.health?.condition);
/** Everybody of a family inside the walls now. */
export const insideNow = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.service?.kind === 'garrison' && person.service.besieged && alive(person));
/** Everybody of a family riding in with the Gonzales men, from Gonzales to the gate. */
const withTheRelief = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.service?.kind === 'relief' && person.service.riding && alive(person));

/**
 * The phases of the storming that reach each wall, in order (docs/battle-research/staging.md §5.5): the north wall is
 * reached first and its men fall under the canister or when it is carried; the west and the south when the defenders leave
 * the walls; the long barrack and the church last, room by room. Travis fell on the north battery among the first
 * (`HIST-TEX-501`); Bowie in his bed in the rooms.
 */
export const FALL_PHASES = Object.freeze({ north: ['repulse', 'north-wall'], west: ['north-wall'], south: ['north-wall'], barrack: ['rooms'], church: ['rooms'] });
/**
 * The minute a fighter inside falls: somewhere in the phases the storming reaches his wall, by a share that is always the
 * same for this class and this man (`FIC-GONZ-432`), on the phase's own tick so it is a moment the page is sent. Never
 * stored: read off his post and the clock, so a save opens with it where it was.
 */
export function fallMinute(world, person) {
  const state = battleState(world, 'alamo');
  if (!state || alamoRole(person) !== 'fighter') return null;
  const ids = FALL_PHASES[wallOf(person.service?.post)] || FALL_PHASES.north;
  const phases = state.phases.filter(phase => ids.includes(phase.id));
  const step = phases[0].step || 2, from = phases[0].from + step, to = phases.at(-1).to - step;
  return from + step * Math.floor(share(world, person.id, 'alamo-fall') * ((to - from) / step + 1));
}
const phaseStart = (state, id) => state.phases.find(phase => phase.id === id).from;

/** Whether the siege and the assault are on this class's calendar at all: the real land's second period (sim/periods.mjs). */
const onCalendar = world => world.period === 2 && Boolean(world.map?.sites?.bexar);

/**
 * Every tick of the second period: the engagement armed, everybody inside walking, the relief riding in, the fates at their
 * moments, the cards, and the Host's camera. `momentOf` is the director's, passed in so this module needs nothing of it.
 */
export function advanceAlamoBattle(world, { momentOf, beginTravel } = {}) {
  if (!onCalendar(world)) return;
  armBattle(world, 'alamo', momentOf(world, ALAMO.startKey));
  const state = battleState(world, 'alamo');
  if (!state || state.before) return;
  const battle = state.battle, phaseId = state.phase?.id;
  // A class saved in the siege before posts existed: whoever stands inside at a plaza spot is given a post and walks to it.
  for (const person of insideNow(world)) if (!person.service.post && !state.over) walkToPost(world, person, postFor(world, person, alamoRole(person)));
  if (!state.over) followTheRelief(world, state);
  // A woman or a child goes into the sacristy when the shouting starts, and is brought out when it stops.
  if (!state.over && world.minute >= phaseStart(state, 'alarm')) {
    for (const person of insideNow(world)) {
      if (alamoRole(person) === 'fighter' || person.service.sheltered) continue;
      person.service.sheltered = world.minute;
      const post = person.service.post || postFor(world, person, 'noncombatant');
      setWalk(world, person, [...(TO_SACRISTY[post.spot] || []), SACRISTY]);
    }
  }
  // The walk, a leg at a time; nobody the runner is speaking to moves, and nobody who has fallen.
  advanceWalks(world, { moving: person => !['coming', 'open'].includes(person.service?.courier) && !Number.isFinite(person.service?.fellAt) });
  for (const person of Object.values(world.entities)) if (person.service?.walked !== undefined && !person.service.walk && person.task === 'travel' && !person.travel) { person.task = 'rest'; delete person.service.walked; }
  for (const person of Object.values(world.entities)) if (person.service?.walk && !person.travel) { person.task = 'travel'; person.service.walked = true; }
  if (!state.over) stageFates(world, state);
  // Who of the families is in it, from when: what the debrief is written from. Never sent. Kept apart from the engine's
  // `participants`, which hold a person from every order (`heldByBattle`): somebody inside already can be given none, and
  // must still be able to answer Travis's runner.
  battle.inside ||= {};
  for (const person of insideNow(world)) {
    const entry = battle.inside[person.id] ||= { householdId: person.householdId, joined: world.minute, post: person.service.post?.id };
    if (!Number.isFinite(entry.fought) && state.fighting && alamoRole(person) === 'fighter') entry.fought = world.minute;
  }
  sendCards(world, state);
  lightTheHost(world, state);
  // March 6, the firing over: the spared go into the town to Músquiz's house (`HIST-TEX-432`).
  if (phaseId === 'after' || state.over) {
    for (const person of insideNow(world)) {
      if (person.service.fate !== 'spared' || person.service.ledOut) continue;
      person.service.ledOut = world.minute;
      setWalk(world, person, [...OUT_OF_THE_CHURCH, { x: -1440, y: 830 }]);
    }
  }
  leftBehind(world, beginTravel);
  // The end of the day: anybody the staging did not reach is given the fate the record gives their role (the backstop).
  if (state.over && !battle.stormed) { battle.stormed = world.minute; stormAlamo(world); }
}

/**
 * The Gonzales men from where they waited in the dark (`FIC-GONZ-433`): while the relief phase runs, each family's man with
 * them rides with the company, a few feet from its middle, from the Gonzales road to the gate; at four the director's
 * `relief-enters` has them inside (sim/alamo.mjs `reliefEnters`). One who is still on the road is left behind.
 */
function followTheRelief(world, state) {
  const phase = state.phase;
  if (phase?.id !== 'relief') return;
  const part = phase.texian.groups.find(one => one.id === 'relief');
  const ground = ALAMO.ground(world);
  const into = world.minute - phase.from;
  const at = placeOf(ground, part, phase.minutes, into);
  withTheRelief(world).forEach((person, index) => {
    if (person.travel) { person.service.late = true; return; }
    if (person.service.late) return;
    const offset = { x: ((index % 3) - 1) * 12 / 5280, y: (Math.floor(index / 3) * 10 - 6) / 5280 };
    person.location = { x: at.x + offset.x, y: at.y + offset.y, siteId: 'bexar' };
    person.task = 'travel';
    person.service.withCompany = world.minute;
  });
}

/** The Gonzales man who did not reach the lines in time: told, and turned for home once he is off the road. */
function leftBehind(world, beginTravel) {
  for (const person of withTheRelief(world)) {
    if (!person.service.late || person.travel) continue;
    Object.assign(person.service, { status: 'released', riding: false, until: world.minute });
    record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 2, claimId: 'FIC-GONZ-433',
      text: `${person.name} did not reach the Gonzales men before they went in through the Mexican lines in the dark, and could not get in alone. ${person.name} turns for home.` });
    try { beginTravel?.(world, person, world.households[person.householdId].homeSiteId, null, 'home'); } catch { /* ceiling: stands where the road ended */ }
  }
}

/**
 * The storming reaches each fighter's post at its moment, and he falls there (`FIC-GONZ-432`); a woman or child is spared when
 * the firing stops. The fate is the one sim/alamo.mjs `stormAlamo` gives by role and place (`FIC-GONZ-386`) - only its moment
 * is new. Nothing is told to anybody: `fellAt` is the world's; the family learns at the word (`tellFall`).
 */
function stageFates(world, state) {
  const endFrom = phaseStart(state, 'end');
  for (const person of insideNow(world)) {
    const service = person.service;
    if (service.fate) continue;
    if (alamoRole(person) === 'fighter') {
      const minute = fallMinute(world, person);
      if (minute === null || world.minute < minute) continue;
      Object.assign(service, { fate: 'fell', fellAt: minute });
      delete service.walk;
      person.task = 'rest';
      awardGlory(world, { event: 'alamo', claimId: 'HIST-TEX-058', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'bexar' });
    } else if (world.minute >= endFrom) {
      service.fate = 'spared';
      awardGlory(world, { event: 'alamo', claimId: 'HIST-TEX-058', personId: person.id, householdId: person.householdId, role: 'present', fromSiteId: 'bexar' });
    }
  }
}

/** The households a live view of the Alamo is sent to: one of theirs inside, or with the Gonzales men near the walls. */
export function watchersOf(world) {
  const near = person => { const feet = inFeet(world, person.location); return Math.hypot(feet.x - 200, feet.y - 300) < 4000; };
  const ids = new Set();
  for (const person of insideNow(world)) ids.add(person.householdId);
  for (const person of withTheRelief(world)) if (!person.travel && person.location?.siteId === 'bexar' && near(person)) ids.add(person.householdId);
  return ids;
}

/**
 * The cards (docs/BATTLES.md §2.7, staging.md §5.7): at the person's side, never a claim that a rider reached home, with
 * Watch. When the army comes; when the relief goes in; when the walls are stormed - and none before the assault, since
 * nobody inside knew the hour. Card only: nothing goes in the journal (the family at home knows none of it).
 */
function sendCards(world, state) {
  const battle = state.battle, phaseId = state.phase?.id;
  const card = (householdId, key, person, text) => {
    const was = battle.alerted[householdId];
    if (was?.key === key) return;
    battle.alerted[householdId] = { key, minute: world.minute, entityId: person.id, text };
  };
  if (['arrival', 'red-flag'].includes(phaseId)) {
    for (const person of insideNow(world)) card(person.householdId, 'siege', person, `At ${person.name}'s side: the Mexican army is marching into Béxar and the garrison is going into the Alamo. ${person.name} is going in with them.`);
  }
  if (phaseId === 'relief') {
    for (const person of withTheRelief(world)) if (!person.service.late) card(person.householdId, 'relief', person, `At ${person.name}'s side: the Gonzales men are going in through the Mexican lines tonight, in the dark, to the Alamo's gate. ${person.name} rides with them.`);
  }
  if (['alarm', 'repulse', 'north-wall', 'fallback', 'rooms'].includes(phaseId)) {
    for (const person of insideNow(world)) {
      const text = alamoRole(person) === 'fighter'
        ? `At ${person.name}'s side, on ${postLabel(person.service.post)}: “They're coming - they're at the walls!” Shouting and bugles in the dark, and the guns.`
        : `At ${person.name}'s side: shouting and firing at the walls in the dark. ${person.name} is with the women and children in the church.`;
      card(person.householdId, 'assault', person, text);
    }
  }
  // Afterwards: what the student watched, for the one who watched it - the card, and never the journal (the word is still
  // days off, sim/alamo.mjs `tellFall`).
  if ((phaseId === 'end' || phaseId === 'after') && !state.over) {
    for (const [personId, entry] of Object.entries(battle.inside || {})) {
      const person = world.entities[personId];
      if (!person || battle.debrief?.[entry.householdId]) continue;
      battle.debrief ||= {};
      battle.debrief[entry.householdId] = { minute: world.minute, entityId: person.id, text: debriefText(world, person) };
    }
  }
}

/** What the student saw, in plain words: what happened, what their own person was doing, and that nobody at home knows. */
export function debriefText(world, person) {
  const name = person.name, where = postLabel(person.service?.post);
  const theirs = person.service?.fate === 'fell'
    ? `You saw ${name} at ${where} when the columns came, loading and firing with the men round him, and go down there when the storming reached it.`
    : person.service?.fate === 'spared'
      ? `${name} was in the church with the women and children, in the sacristy while it was fought, and was brought out alive when it was over. The Mexican soldiers are taking them into Béxar.`
      : `${name} was inside when the walls were stormed.`;
  return [
    'What happened: before dawn the Mexican columns came at the walls from every side with ladders. The defenders’ cannon drove them back at first, but they came on again, crowded against the north wall and climbed over it. The defenders fell back into the long barrack and the church and fought room by room; men who ran out over the walls were caught by the lancers waiting outside. About sunrise it was over.',
    theirs,
    'Nobody at home knows any of this yet. The word will reach them in days, not hours, and until it does they can only wait.',
  ].join('\n\n');
}

/** The Host's spotlight on the compound itself, not Béxar's plaza (docs/BATTLES.md §2.1): the siege, the relief, the assault. */
function lightTheHost(world, state) {
  const battle = state.battle, phaseId = state.phase?.id, at = onMap(world, { x: 180, y: 280 });
  const light = (key, text, claimId) => {
    battle.spotlit ||= {};
    if (battle.spotlit[key]) return;
    battle.spotlit[key] = world.minute;
    spotlight(world, { key, text, x: at.x, y: at.y, claimId });
  };
  if (phaseId === 'arrival') light('alamo-siege', 'Béxar, February 23: Santa Anna’s army marches into the town and the garrison goes into the Alamo. A red flag flies from San Fernando.', 'HIST-TEX-054');
  if (phaseId === 'huts') light('alamo-huts', 'The Alamo, February 25: Mexican soldiers in the huts by the walls are fired on and burned out.', 'HIST-TEX-505');
  if (phaseId === 'relief') light('alamo-relief', 'The Alamo, before dawn on March 1: thirty-two Gonzales men come through the Mexican lines and are let in.', 'HIST-TEX-057');
  if (phaseId === 'alarm') light('alamo-fall', 'The Alamo, before dawn on March 6: the Mexican columns storm the walls. Distant families have not yet received any news.', 'HIST-TEX-058');
}

/**
 * What a page is sent of the Alamo (docs/BATTLES.md §2.1, `FIC-GONZ-447`): the Host always, live, its camera on the compound
 * while a watched phase runs; a family only while one of its own is inside or riding in with the Gonzales men near the walls.
 * Nobody else is sent anything - not the phase, not a count, not whose people are there. A family's own people are its
 * `members`; the moment one of them fell only once it has come, and only to that family and the Host.
 */
export function alamoProjection(world, householdId, role) {
  const state = world.battles?.alamo ? battleState(world, 'alamo') : null;
  if (!state || state.before || !onCalendar(world)) return null;
  // Over: nothing more to watch, and only this family's own cards - what it watched, and the account when the word comes.
  if (!state.live) return role === 'student' && householdId ? cardsFor(world, householdId, state, false) : null;
  const inside = insideNow(world);
  const falls = people => Object.fromEntries(people.filter(person => Number.isFinite(person.service.fellAt)).map(person => [person.id, person.service.fellAt]));
  const facing = people => Object.fromEntries(people.map(person => [person.id, facingOut(world, person)]));
  if (role === 'host') {
    const battle = { ...projectBattle(world, 'alamo', { members: inside.map(person => person.id), memberFalls: falls(inside), memberFacing: facing(inside) }), reconstruction: false };
    const held = Boolean(stepOf(world, state.def, state.phase)) || state.fighting;
    return { battle, host: { focus: held ? 'battle' : 'regional', caption: 'The Alamo, live. Families with somebody there see it too; the rest have not heard.', ...onMap(world, { x: 180, y: 280 }) } };
  }
  if (role !== 'student' || !householdId || !watchersOf(world).has(householdId)) return { battle: null, ...cardsFor(world, householdId, state, false) };
  const own = inside.filter(person => person.householdId === householdId);
  const battle = { ...projectBattle(world, 'alamo', { members: own.map(person => person.id), memberFalls: falls(own), memberFacing: facing(own) }), reconstruction: false };
  return { battle, ...cardsFor(world, householdId, state, true) };
}
/** Which way somebody at a post faces: out over their wall. */
function facingOut(world, person) {
  const post = person.service?.post;
  const out = { north: { x: 0, y: -1 }, west: { x: -1, y: 0 }, south: { x: 0, y: 1 }, church: { x: 1, y: 0 }, barrack: { x: -1, y: 0 } }[wallOf(post)] || { x: 0, y: -1 };
  return post?.id === 'southwest' ? { x: -0.9, y: 0.4 } : out;
}
/** This family's card, and the debrief afterwards: only its own, never another's. */
function cardsFor(world, householdId, state, watching) {
  const out = {};
  const alerted = state.battle.alerted?.[householdId];
  const phaseId = state.phase?.id;
  const relevant = alerted && ((alerted.key === 'siege' && ['arrival', 'red-flag'].includes(phaseId)) || (alerted.key === 'relief' && phaseId === 'relief')
    || (alerted.key === 'assault' && ['alarm', 'repulse', 'north-wall', 'fallback', 'rooms'].includes(phaseId)));
  const person = alerted && world.entities[alerted.entityId];
  if (relevant && person && alive(person)) {
    const titles = { siege: 'The Mexican army has come', relief: 'Into the Alamo with the Gonzales men', assault: 'The walls are stormed' };
    out.battleAlert = { id: `battle:alamo:${alerted.key}:${householdId}`, entityId: person.id, title: titles[alerted.key], text: alerted.text, field: onMap(world, { x: 180, y: 280 }), watching };
  }
  const debrief = state.battle.debrief?.[householdId];
  if (debrief && world.minute - debrief.minute <= 1440 && world.entities[debrief.entityId]) {
    out.battleAccount = { id: `debrief:alamo:${householdId}`, entityId: debrief.entityId, title: 'What you saw from the walls', text: debrief.text };
  }
  // The word, when it comes (sim/alamo.mjs `tellFall`): the family's account, for a day, on the card as in the journal.
  const told = state.battle.told?.[householdId];
  if (told && world.minute - told.minute <= 1440 && world.entities[told.entityId]) {
    out.battleAccount = { id: `account:alamo:${householdId}`, entityId: told.entityId, title: 'The word from the Alamo', text: told.text };
  }
  return out;
}
export { POSTS, spotOf, calendarMinutes };
