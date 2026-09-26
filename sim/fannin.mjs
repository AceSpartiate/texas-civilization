// Fannin's command on the battle engine: Coleto (March 19-20, 1836) and the Goliad massacre (Palm Sunday, March 27).
// docs/BATTLES.md §2 and §6, docs/battle-research/staging.md §6, §7 and §10; the engagements are sim/battles/coleto.mjs and
// sim/battles/goliad-massacre.mjs, and the director (sim/directors.mjs `advanceScrape`) calls this every tick of the spring.
//
// What this does, every tick:
// - **The march out** (staging.md §6.6, fix 1): every family's man serving with Fannin marches out of Goliad with the column at
//   nine on March 19, walks with it to the Coleto ground, and is in the square when it forms - drawn in its files and then in a
//   face of the square (`coletoSlot`). Nobody new joins Fannin (owner's K1; `FIC-GONZ-046`): only the men already with him.
// - **Horton's horsemen** (owner's K2): a man with his own horse at Goliad is among Horton's scouts at the record's share, 30 in
//   360; he rides ahead of the column, is cut off in the timber when it is caught, and rides away home.
// - **A fate at a staged moment** (docs/BATTLES.md §2.6; `FIC-GONZ-439`): each man's fate is the roll the code always made
//   (`rollFates` at Coleto's rates, the massacre's `share`), but it falls at a moment inside the fighting - a killed or wounded
//   man in one of the three assaults, a few wounded in the night; on Palm Sunday at the volleys, inside the presidio, or kept
//   back at the muster - where his own family, watching, sees it. The household's reports, the journal and his health on the
//   family's screen still wait for the word (`HIST-TEX-439`'s rule; owner, docs/BATTLES.md §2b.1 for the Alamo).
// - **A man still wounded on Palm Sunday cannot run** (owner's G2): he is killed inside with the wounded, or spared.
// - **Alerts** through the person at his side (Follow on the march and at the muster, Watch when the column is caught and
//   when the guns open), **the Host** live with its spotlight on the field, and **the accounts**: the man who got away tells
//   his own at once; everybody else's family is told at the word of the massacre (April 1), through whoever hears it at home.
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { spotlight } from './host.mjs';
import { WOUND_GRADES, rollFates } from './army.mjs';
import { share } from './shares.mjs';
import { calendarMinutes } from './clock.mjs';
import { modeWith } from './keeping.mjs';
import { armBattle, battleState, partPlace, placeFrom, projectBattle, sidePlace } from './battle-stage.mjs';
import { COLETO, coletoSlot } from './battles/coleto.mjs';
import { GOLIAD_MASSACRE, massacrePlace } from './battles/goliad-massacre.mjs';
import { COLETO as COLETO_RATES, MASSACRE } from './houston.mjs';

const GONE = ['dead', 'captured'];
/** Horton's thirty of about 360 in the column (`HIST-TEX-063`; `FIC-GONZ-437`). */
export const HORTON_SHARE = 30 / 360;
const phaseOf = (state, id) => state.phases.find(phase => phase.id === id);
const indexOf = (def, id) => def.phases.findIndex(phase => phase.id === id);
const tell = (world, person, text, { claimId, importance = 3, type = 'consequence', householdId = person.householdId, actorId = person.id } = {}) =>
  record(world, type, { actorId, householdId, importance, classification: claimId?.startsWith('FIC') ? 'FICTIONAL FOR GAMEPLAY' : 'DOCUMENTED', claimId, text });
const unit = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, span = Math.hypot(dx, dy); return span > 1e-9 ? { x: dx / span, y: dy / span } : { x: 1, y: 0 }; };
/** Walk a person toward a point at a walker's pace - a mile in twenty minutes of the calendar - so nobody is drawn jumping. */
function walkToward(world, person, target, siteId) {
  const reach = Math.max(0.05, calendarMinutes(world) / 20);
  const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y);
  const part = gap <= reach ? 1 : reach / gap;
  person.location = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part, siteId };
}
/** The families' men serving with Fannin now (sim/winter.mjs `SERVICE.fannin`): only those already with him (K1). */
const withFannin = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person'
  && person.service?.kind === 'fannin' && person.service.status === 'serving' && !GONE.includes(person.health?.condition));
/** Whoever of a family hears the word at home: the principal if he is at home and living, else the first who is. */
function hearer(world, householdId, not) {
  const household = world.households[householdId];
  const living = household.members.map(id => world.entities[id]).filter(one => one?.kind === 'person' && one.id !== not && !GONE.includes(one.health?.condition) && one.service?.kind !== 'fannin');
  return living.find(one => one.id === household.principalId) || living.find(one => !(one.age < 10)) || living[0] || null;
}

// ------------------------------------------------------------------------------------------------ Coleto

/**
 * When a family's man is hit at Coleto (staging.md §6.5): a killed man, and four in five of the wounded, in one of the three
 * assaults, weighted to the first, when the square was forming; the rest of the wounded in the night, by the marksmen in the
 * grass. Seeded by who he is, so a reload never moves it (`FIC-GONZ-439`).
 */
function coletoMoment(world, state, id, fate) {
  const pick = share(world, id, 'coleto-when'), inside = share(world, id, 'coleto-minute');
  let phaseId;
  if (fate === 'wounded' && pick < 0.2) phaseId = 'small-hours';
  else { const p = fate === 'wounded' ? (pick - 0.2) / 0.8 : pick; phaseId = p < 0.6 ? 'assault-1' : p < 0.85 ? 'assault-2' : 'assault-3'; }
  const phase = phaseOf(state, phaseId);
  return { phase: phaseId, minute: phase.from + 10 + Math.floor(inside * (phase.minutes - 20)) };
}

/** Everybody of the families on the prairie with Fannin and not yet let go: who a watching page draws in the force. */
export function coletoMembers(world) {
  const battle = world.battles?.coleto;
  if (!battle) return [];
  return Object.entries(battle.participants).filter(([id, entry]) => !entry.released && world.entities[id]).map(([id]) => world.entities[id]).sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function advanceColeto(world, { start, beginTravel }) {
  if (!world.map?.sites?.goliad || !Number.isFinite(start)) return;
  const battle = armBattle(world, 'coleto', start);
  const state = battleState(world, 'coleto');
  if (!state || state.before) return;
  const phase = state.phase, index = phase.index, ground = COLETO.ground(world);
  // Enlisted while the column is on the road and until the square is formed: the men with Fannin march out with him. A class
  // saved after the old one-tick Coleto has its men prisoners already, and enlists nobody.
  if (!state.over && index <= indexOf(COLETO, 'square')) {
    for (const person of withFannin(world)) {
      if (battle.participants[person.id]) continue;
      const [{ fate }] = rollFates(world, [person.id], { event: 'coleto', ...COLETO_RATES });
      const horton = modeWith(world, person) === 'horse' && share(world, person.id, 'horton') < HORTON_SHARE;
      const entry = battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, fate: horton ? 'unhurt' : fate, ...(horton && { horton: true }) };
      // A man still hurt from the south rides in a cart with the column's baggage (staging.md §6.6).
      if (person.health?.condition === 'wounded') entry.cart = true;
      if (!horton && fate !== 'unhurt') entry.at = coletoMoment(world, state, person.id, fate);
      // Whatever road he was on, the column takes him now: he walks to it from where he stands.
      person.travel = null; person.chore = null;
      if (!person.location.siteId) person.location = { ...person.location, siteId: 'goliad' };
    }
  }
  const members = Object.entries(battle.participants).map(([id, entry]) => ({ person: world.entities[id], entry })).filter(one => one.person && !one.entry.released);
  // Contact: everybody in the column is in it, and fought (glory, `HIST-TEX-063`); Horton's men were there and rode.
  if (state.contact <= world.minute) {
    for (const { person, entry } of members) {
      if (entry.fought || entry.gloried) continue;
      entry.gloried = world.minute;
      if (!entry.horton) entry.fought = world.minute;
      awardGlory(world, { event: 'coleto', claimId: 'HIST-TEX-063', personId: person.id, householdId: person.householdId, role: entry.horton ? 'present' : 'fought', fromSiteId: 'goliad' });
    }
  }
  // Each man's fate at its moment: down in the square (killed, drawn lying where he fell) or hit (wounded, drawn among the carts).
  for (const { person, entry } of members) {
    if (!entry.at || entry.down || world.minute < entry.at.minute) continue;
    entry.down = { kind: entry.fate === 'killed' ? 'killed' : 'wounded', minute: entry.at.minute, phase: entry.at.phase };
    person.service = { ...person.service, coleto: entry.fate };
    if (entry.fate === 'wounded') person.health = { condition: WOUND_GRADES.severe.condition, grade: 'severe', recoversAt: world.minute + WOUND_GRADES.severe.minutes };
  }
  // Horton's horsemen, cut off in the timber when the column is caught, ride away (owner's K2).
  if (index > indexOf(COLETO, 'caught') || state.over) {
    for (const { person, entry } of members) {
      if (!entry.horton) continue;
      entry.released = world.minute; entry.escaped = 'horton';
      person.service = { ...person.service, status: 'released', until: world.minute, coleto: 'horton' };
      const text = hortonAccount(world, person);
      const eventId = tell(world, person, text, { claimId: 'HIST-TEX-515' });
      battle.told[person.householdId] = { eventId, minute: world.minute, entityId: person.id, text, title: `What ${person.name} saw at Coleto` };
      const home = world.households[person.householdId]?.homeSiteId;
      person.location = { ...person.location, siteId: world.map.sites.coleto ? 'coleto' : 'goliad' };
      if (home && beginTravel) {
        try { beginTravel(world, person, home, eventId, 'home', 'horse'); } catch { try { beginTravel(world, person, home, eventId, 'home'); } catch { /* ceiling: he stands where he got away */ } }
      }
    }
  }
  // The surrender: everybody left alive in the square is a prisoner (`HIST-TEX-515`); a man not hit came through unhurt.
  if (index >= indexOf(COLETO, 'surrender') || state.over) {
    for (const { person, entry } of members) {
      if (entry.horton || entry.surrendered) continue;
      entry.surrendered = world.minute;
      if (!entry.down) person.service = { ...person.service, coleto: entry.fate === 'wounded' || entry.fate === 'killed' ? entry.fate : 'unhurt' };
      person.service = { ...person.service, status: 'prisoner', prisonerSince: world.minute };
    }
  }
  // Where each of them stands this tick.
  for (const { person, entry } of members) {
    if (entry.horton && entry.released) continue;
    // A man killed lies where he fell (`lyingOnField`); he does not march back.
    if (entry.down?.kind === 'killed') continue;
    if (state.over) {
      // Shut in the presidio at Goliad, a prisoner, and let go from the battle's hold.
      const goliad = world.map.sites.goliad;
      walkToward(world, person, { x: goliad.x + (share(world, person.id, 'cell-x') - 0.5) * 0.08, y: goliad.y + (share(world, person.id, 'cell-y') - 0.5) * 0.06 }, 'goliad');
      person.service = { ...person.service, siteId: 'goliad' };
      entry.released = world.minute;
      continue;
    }
    const at = placeInColeto(world, state, ground, person, entry);
    // A map saved before Coleto was a place (2026-09-25) keeps them at Goliad by name while they stand on its ground.
    const siteId = index === 0 || !world.map.sites.coleto ? 'goliad' : 'coleto';
    walkToward(world, person, at, siteId);
    person.service = { ...person.service, siteId };
  }
  // Horton's horse goes with him (it is what makes him one of Horton's men).
  for (const { person, entry } of members) {
    if (!entry.horton || entry.released) continue;
    for (const beast of Object.values(world.entities)) if (beast.borrowedBy === person.id && !beast.travel) beast.location = { ...person.location };
  }
  coletoWatchers(world, state, battle, ground);
}

/** Where a family's man stands in the phase the fight is in (sim/battles/coleto.mjs `coletoSlot`). */
function placeInColeto(world, state, ground, person, entry) {
  const phase = state.phase, into = Math.min(state.into, phase.minutes);
  const index = Object.keys(state.battle.participants).sort().indexOf(person.id);
  const slot = coletoSlot(person.id, index, { horton: entry.horton, phase: phase.id });
  if (slot.part !== undefined && slot.part !== null) {
    const centre = partPlace(ground, phase, 'texian', slot.part, into);
    const facing = unit(centre, ground.square);
    return placeFrom(centre, Math.hypot(ground.square.x - centre.x, ground.square.y - centre.y) > 0.05 ? facing : ground.toward, slot);
  }
  const centre = sidePlace(ground, phase, 'texian', into);
  if (phase.id === 'march-back') return placeFrom(centre, unit(centre, ground.goliad), slot);
  // In the square: his face, his front rank; hit, he is among the carts in the middle.
  if (entry.down?.kind === 'wounded') return placeFrom(centre, unit(centre, ground.timber), { along: (share(world, person.id, 'cart-a') - 0.5) * 0.04, across: (share(world, person.id, 'cart-b') - 0.5) * 0.04 });
  return placeFrom(centre, unit(centre, ground.timber), slot);
}

/** The alert through the man, the Host's spotlight on the field. */
function coletoWatchers(world, state, battle, ground) {
  const phaseId = state.phase.id;
  const stage = state.over ? null : ['march-out', 'road'].includes(phaseId) ? 'march' : ['caught', 'square', 'assault-1', 'lull-1', 'assault-2', 'lull-2', 'assault-3', 'dusk', 'night', 'small-hours', 'before-dawn'].includes(phaseId) ? 'caught' : phaseId === 'guns' ? 'guns' : null;
  if (stage) {
    for (const household of Object.values(world.households)) {
      const person = coletoMembers(world).find(one => one.householdId === household.id && !battle.participants[one.id].horton && battle.participants[one.id].down?.kind !== 'killed')
        || coletoMembers(world).find(one => one.householdId === household.id && battle.participants[one.id].horton);
      if (!person || battle.alerted[household.id]?.stage === stage) continue;
      if (stage !== 'march' && battle.participants[person.id].horton) continue;
      const text = {
        march: `At ${person.name}'s side, a sergeant of the company: "We're marching out for Victoria this morning, with the guns and the carts. Fog on the river."`,
        caught: `At ${person.name}'s side, a man on the column's flank: "Mexican horsemen behind us! They're forming square!"`,
        guns: `At ${person.name}'s side: "Their cannon have come up in the night, and they are firing on the square."`,
      }[stage];
      battle.alerted[household.id] = { stage, eventId: record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-437', text }), minute: world.minute, entityId: person.id, text };
    }
  }
  const field = fieldOf(world, 'coleto');
  if (phaseId === 'caught' && !battle.spotlit?.caught) {
    spotlight(world, { key: 'coleto', text: 'Coleto, March 19: Fannin’s column is caught on the open prairie by Urrea’s cavalry, short of the Coleto timber, and forms a square.', ...field, claimId: 'HIST-TEX-515' });
    battle.spotlit = { ...(battle.spotlit || {}), caught: world.minute };
  }
  if (phaseId === 'guns' && !battle.spotlit?.guns) {
    spotlight(world, { key: 'coleto-guns', text: 'Coleto, dawn on March 20: the Mexican cannon open on Fannin’s square. He surrenders within the hour.', ...field, claimId: 'HIST-TEX-515' });
    battle.spotlit = { ...(battle.spotlit || {}), guns: world.minute };
  }
}

/** The middle of a fight's ground, where the Host's camera and a student's Watch go. */
export function fieldOf(world, id) {
  if (id === 'coleto') { const g = COLETO.ground(world); return { x: g.square.x, y: g.square.y }; }
  const g = GOLIAD_MASSACRE.ground(world);
  return { x: g.presidio.x, y: g.presidio.y };
}

// ------------------------------------------------------------------------------------------------ Palm Sunday

/** Everybody of the families among the prisoners on Palm Sunday and not yet let go. */
export function massacreMembers(world) {
  const battle = world.battles?.['goliad-massacre'];
  if (!battle) return [];
  return Object.entries(battle.participants).filter(([id, entry]) => !entry.released && world.entities[id]).map(([id]) => world.entities[id]).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * What a prisoner meets on Palm Sunday, from the one seeded roll the game has always made (`share(... 'goliad')`, sim/houston.mjs
 * `MASSACRE`): 89 in 100 shot, 7 escaped, the rest spared - and a man still wounded from Coleto cannot run (owner's G2): he is
 * killed inside with the wounded, or spared at the spared share.
 */
export function massacreFate(world, person) {
  const roll = share(world, person.id, 'goliad');
  const fate = roll < MASSACRE.executed ? 'executed' : roll < MASSACRE.executed + MASSACRE.escaped ? 'escaped' : 'spared';
  return person.health?.condition === 'wounded' && fate === 'escaped' ? 'executed' : fate;
}

export function advanceMassacre(world, { start, beginTravel }) {
  if (!world.map?.sites?.goliad || !Number.isFinite(start)) return;
  const battle = armBattle(world, 'goliad-massacre', start);
  const state = battleState(world, 'goliad-massacre');
  if (!state || state.before) return;
  const def = GOLIAD_MASSACRE, phase = state.phase, index = phase.index, ground = def.ground(world);
  // The prisoners, from the evening before until they are formed at sunrise. A man killed at Coleto is not among them.
  if (!state.over && index <= indexOf(def, 'muster')) {
    for (const person of Object.values(world.entities)) {
      const service = person.service;
      if (!person.householdId || battle.participants[person.id] || service?.kind !== 'fannin' || service.status !== 'prisoner' || GONE.includes(person.health?.condition) || service.coleto === 'killed' || service.fate) continue;
      const wounded = person.health?.condition === 'wounded';
      const fate = massacreFate(world, person);
      const place = massacrePlace(fate, { wounded, road: share(world, person.id, 'goliad-road') });
      const entry = battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, fate, part: place.part, ...(place.runs && { runs: true }), ...(wounded && { wounded: true }) };
      // The moment: kept back at the muster; shot at one of the three volleys; killed inside; away into the timber.
      const volleys = phaseOf(state, 'volleys'), inside = phaseOf(state, 'inside'), muster = phaseOf(state, 'muster'), escapes = phaseOf(state, 'escapes');
      entry.at = fate === 'spared' ? muster.from
        : fate === 'escaped' ? escapes.to
        : wounded ? inside.from + 6
        : volleys.from + [1, 3, 7][Math.min(2, Math.floor(share(world, person.id, 'goliad-volley') * 3))];
      person.travel = null; person.chore = null;
    }
  }
  const members = Object.entries(battle.participants).map(([id, entry]) => ({ person: world.entities[id], entry })).filter(one => one.person && !one.entry.released);
  for (const { person, entry } of members) {
    if (entry.done || world.minute < entry.at) continue;
    entry.done = world.minute;
    person.service = { ...person.service, fate: entry.fate, ...(entry.wounded && entry.fate === 'executed' && { woundedAtGoliad: true }) };
    if (entry.fate === 'executed') entry.down = { kind: 'killed', minute: entry.at };
    awardGlory(world, { event: 'goliad', claimId: 'HIST-TEX-064', personId: person.id, householdId: person.householdId, role: 'present', fromSiteId: 'goliad' });
    // The man who got away tells his own story, and starts home at once (staging.md §7.6, fix 4): it reaches his family when he does.
    if (entry.fate === 'escaped') {
      entry.released = world.minute;
      person.service = { ...person.service, status: 'released', until: world.minute, told: true };
      const text = escapedAccount(world, person);
      const eventId = tell(world, person, text, { claimId: 'HIST-TEX-518' });
      battle.told[person.householdId] = { eventId, minute: world.minute, entityId: person.id, text, title: `How ${person.name} got away at Goliad` };
      const home = world.households[person.householdId]?.homeSiteId;
      person.location = { ...person.location, siteId: 'goliad' };
      if (home && beginTravel) { try { beginTravel(world, person, home, eventId, 'home'); } catch { /* ceiling: he stands by the river */ } }
    }
  }
  // Where each of them stands this tick.
  for (const { person, entry } of members) {
    if (entry.released || entry.down) continue;
    walkToward(world, person, placeInMassacre(world, state, ground, person, entry), 'goliad');
  }
  massacreWatchers(world, state, battle);
}

function placeInMassacre(world, state, ground, person, entry) {
  const phase = state.phase, into = Math.min(state.into, phase.minutes);
  const a = share(world, person.id, 'massacre-a'), b = share(world, person.id, 'massacre-b');
  const parts = phase.texian.parts?.map(part => part.id) || [];
  const running = entry.runs && ((phase.id === 'volleys' && into >= 4) || phase.id === 'escapes');
  const partId = running ? 'runners' : parts.includes(entry.part) ? entry.part : null;
  const centre = partId ? partPlace(ground, phase, 'texian', partId, into) : sidePlace(ground, phase, 'texian', into);
  // In a column: in its files, somewhere along it; loose (the parade ground, the chapel, the rooms): anywhere in it.
  const column = partId && ['bexar', 'victoria', 'patricio'].includes(partId) && !running;
  const facing = column ? unit(ground.presidio, ground[`halt-${partId}`]) : { x: 1, y: 0 };
  return placeFrom(centre, facing, column ? { along: -0.02 - 0.16 * a, across: (b - 0.5) * 0.05 } : { along: (a - 0.5) * 0.08, across: (b - 0.5) * 0.08 });
}

function massacreWatchers(world, state, battle) {
  const phaseId = state.phase.id;
  if (phaseId === 'muster' && !state.over) {
    for (const household of Object.values(world.households)) {
      const person = massacreMembers(world).find(one => one.householdId === household.id);
      if (!person || battle.alerted[household.id]) continue;
      const text = `At ${person.name}'s side, the man next to him in the line: "They have formed the prisoners in three companies. They say we are going out for wood, or to the ships at Copano."`;
      battle.alerted[household.id] = { stage: 'muster', eventId: record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-438', text }), minute: world.minute, entityId: person.id, text };
    }
  }
  if (phaseId === 'volleys' && !battle.spotlit?.volleys) {
    spotlight(world, { key: 'goliad-massacre', text: 'Fannin’s men, prisoners at Goliad, are marched out and shot. A few escape. No family knows yet.', ...fieldOf(world, 'goliad-massacre'), claimId: 'HIST-TEX-517' });
    battle.spotlit = { ...(battle.spotlit || {}), volleys: world.minute };
  }
}

// ------------------------------------------------------------------------------------------------ what a page is sent

const WATCHED = { coleto: 'Follow', 'goliad-massacre': 'Follow' };
/**
 * The fight for this viewer (docs/BATTLES.md §2.1, `FIC-GONZ-447`), or null: the Host always while it runs, framed on the field
 * while it is fought; a family only while one of its own people is in it, with the families' men it stands beside named for
 * the drawing - and for the massacre, also while one of its people stands in Goliad, where it is seen and heard. Nobody else.
 */
export function fanninView(world, householdId, role) {
  for (const id of ['coleto', 'goliad-massacre']) {
    const state = world.battles?.[id] ? battleState(world, id) : null;
    if (!state?.live) continue;
    const all = id === 'coleto' ? coletoMembers(world) : massacreMembers(world);
    if (role === 'host') {
      const battle = { ...projectBattle(world, id, { members: all.map(person => person.id) }), reconstruction: false };
      return { battle, host: { focus: state.fighting ? 'battle' : 'regional', caption: `${ENGAGEMENT_NAMES[id]}, live. Families with somebody there see it too; the rest have not heard yet.`, ...fieldOf(world, id) } };
    }
    if (role !== 'student' || !householdId) continue;
    const own = world.households[householdId].members.map(one => world.entities[one]).filter(one => one?.kind === 'person' && one.location?.siteId && !one.travel);
    const inIt = all.some(person => person.householdId === householdId);
    const inTown = id === 'goliad-massacre' && own.some(person => person.location.siteId === 'goliad' && !GONE.includes(person.health?.condition));
    if (!inIt && !inTown) continue;
    // Only the families' men this family stands beside, and so already sees (sim/town.mjs `observedBy`).
    const places = new Set(own.map(person => person.location.siteId));
    const members = all.filter(person => person.householdId === householdId || places.has(person.location?.siteId)).map(person => person.id);
    return { battle: { ...projectBattle(world, id, { members }), reconstruction: false } };
  }
  return null;
}
const ENGAGEMENT_NAMES = { coleto: 'Coleto', 'goliad-massacre': 'Goliad, Palm Sunday' };

/** The card through the family's man while the fight is coming or being fought: Follow on the march and the muster, Watch in the fighting. */
export function fanninAlert(world, householdId, watching) {
  for (const id of ['coleto', 'goliad-massacre']) {
    const battle = world.battles?.[id], alerted = battle?.alerted?.[householdId];
    if (!alerted) continue;
    const state = battleState(world, id);
    if (!state?.live) continue;
    const person = world.entities[alerted.entityId], entry = battle.participants[alerted.entityId];
    if (!person || GONE.includes(person.health?.condition) || entry?.released) continue;
    // The card goes when its moment has passed: on Palm Sunday once the columns are gone from the gate.
    if (id === 'goliad-massacre' && state.phase.index > indexOf(GOLIAD_MASSACRE, 'marched')) continue;
    if (id === 'coleto' && ['surrender', 'march-back'].includes(state.phase.id)) continue;
    const title = id === 'coleto'
      ? { march: 'Fannin marches out', caught: 'Caught on the prairie', guns: 'The guns at dawn' }[alerted.stage]
      : 'The prisoners are formed';
    // Where Follow or Watch frames: the column where it is on the road, or the field.
    const field = id === 'coleto' && ['march-out', 'road'].includes(state.phase.id) ? sidePlace(COLETO.ground(world), state.phase, 'texian', state.into) : fieldOf(world, id);
    return { id: `battle:${id}:${alerted.stage}:${householdId}`, entityId: person.id, title, text: alerted.text, field: { x: field.x, y: field.y }, watching, action: alerted.stage === 'march' || id === 'goliad-massacre' ? WATCHED[id] : 'Watch' };
  }
  return null;
}

/** The account card, for a day after it is given. */
export function fanninAccount(world, householdId) {
  let best = null;
  for (const id of ['coleto', 'goliad-massacre']) {
    const told = world.battles?.[id]?.told?.[householdId];
    if (!told || world.minute - told.minute > 1440 || (best && best.minute > told.minute)) continue;
    best = { ...told, id };
  }
  if (!best || !world.entities[best.entityId]) return null;
  return { id: `account:${best.id}:${householdId}`, entityId: best.entityId, title: best.title, text: best.text };
}

// ------------------------------------------------------------------------------------------------ the words

const COLETO_STORY = 'On March 19 Colonel Fannin at last marched his men out of Goliad toward Victoria, with heavy cannon, carts and slow, hungry oxen. Mexican cavalry caught up with them on the open prairie near Coleto Creek, a few hundred yards short of the trees. The Texians formed a square three ranks deep with cannon at the corners and beat back three attacks until dark. That night they had little water and no fires, and Mexican marksmen fired on them from the tall grass. In the morning more Mexican soldiers and cannon had come up, and Fannin surrendered, believing his men would be treated as prisoners of war. They were marched back to Goliad.';
const GOLIAD_STORY = 'After Fannin\'s men surrendered at Coleto, they were held at Goliad as prisoners for a week, many of them believing they would be sent home to the United States. On the morning of March 27, Palm Sunday, the Mexican commander at Goliad, Colonel Portilla, carried out Santa Anna\'s order that they be killed; General Urrea, who had taken their surrender, had asked that they be spared. The men who could walk were marched out in three groups on three roads, told they were going to gather wood or to the ships, and were shot a short way from the fort. Colonel Fannin and the wounded were killed inside. About 340 men died. Twenty-eight escaped by running for the river, and about twenty - doctors, orderlies and men with useful trades - were spared, several of them saved by a Mexican woman, Francita Alavez, who became known as "the Angel of Goliad". The bodies were burned. The killing turned Texians\' grief into anger, and three weeks later at San Jacinto they shouted "Remember Goliad!"';
const WHY_COLETO = 'Fannin had waited at Goliad too long, and marched slowly across open prairie with heavy guns and hungry oxen. Caught in the open short of the timber, the square could beat off attacks but could not get to water or get away, and by the morning Urrea had more than a thousand men and cannon around it. What the surrender promised is disputed: Fannin\'s officers asked for the wounded to be cared for and the men held as prisoners of war, but Urrea could not promise that Santa Anna would agree.';

function hortonAccount(world, person) {
  const name = person.name;
  return [
    'What happened: On March 19 Colonel Fannin at last marched his men out of Goliad toward Victoria, with heavy cannon, carts and slow, hungry oxen. Captain Horton\'s horsemen rode ahead to scout the Coleto crossing. On the open prairie, short of the Coleto timber, Mexican cavalry came up behind the column and cut it off, and the men formed a square.',
    `What ${name} did: ${name} rode ahead with Horton's horsemen, about thirty men on their own horses. When the Mexican cavalry came between them and the column, they could not get back to the square, and rode away.`,
    'Why it ended so: The column was caught in the open, far from water and timber, by a stronger force that kept growing. Horton\'s men were too few to break through to it.',
    `What comes next: ${name} is riding home. What became of Fannin's men will be known when the word comes.`,
  ].join('\n\n');
}
function escapedAccount(world, person) {
  const name = person.name, coleto = person.service?.coleto;
  return [
    `What happened: ${COLETO_STORY} They were held there for a week, told they would be sent to New Orleans. At sunrise on Palm Sunday, March 27, the prisoners who could walk were marched out in three groups on three roads, halted half a mile or more from the fort, and shot.`,
    `What ${name} did: ${name} ${coleto === 'unhurt' || !coleto ? 'fought in the square at Coleto and came through unhurt' : 'fought in the square at Coleto'}. On Palm Sunday ${name} was in the group marched out on the Victoria road. When the guards fired, ${name} broke and ran for the trees along the river, and got away.`,
    'Why it ended so: Santa Anna had ordered that the prisoners be killed, and the commander at Goliad carried out the order. Twenty-eight men got away that morning, most of them by running for the river timber.',
    `What comes next: ${name} is making the way home on foot. The rest of what happened at Goliad will be known when the word comes.`,
  ].join('\n\n');
}
/** What one man of the family did, at Coleto and on Palm Sunday, in a sentence or two. */
function whatHeDid(person) {
  const name = person.name, service = person.service || {};
  const coleto = service.coleto, fate = service.fate;
  const atColeto = coleto === 'killed' ? `${name} was killed in the fight on the prairie at Coleto.`
    : coleto === 'wounded' ? `${name} was wounded in the square at Coleto and carried back to Goliad a prisoner.`
    : coleto === 'unhurt' ? `${name} fought in the square at Coleto and came through unhurt.` : `${name} was with Fannin's men at Coleto.`;
  const atGoliad = coleto === 'killed' ? '' : fate === 'executed' ? (service.woundedAtGoliad ? ` On Palm Sunday ${name}, still wounded, was among those killed inside the fort.` : ` On Palm Sunday ${name} was among the prisoners marched out and killed.`)
    : fate === 'spared' ? ` On Palm Sunday ${name} was kept back with the doctors and the workmen and spared, and has been taken south a prisoner.`
    : fate === 'escaped' ? ` On Palm Sunday ${name} ran for the river when the firing began, got away, and is making the way home.` : '';
  return `What ${name} did: ${atColeto}${atGoliad}`;
}
/** Said with the word of the massacre, through whoever hears it at home: Coleto and Goliad together (staging.md §6.8, §7.8). */
export function wordAccount(world, people) {
  return [
    `What happened: ${COLETO_STORY} ${GOLIAD_STORY}`,
    ...people.map(whatHeDid),
    `Why it ended so: ${WHY_COLETO} The killing at Goliad was Santa Anna's order, carried out against Urrea's wish. It was said afterward that Fannin asked to be shot in the heart and not the face, and to be buried; he was shot in the face and his body burned with the rest.`,
  ].join('\n\n');
}

/**
 * The word of the massacre reaches the families (sim/directors.mjs `massacre-word`, April 1): each family that had a man with
 * Fannin is given the account through whoever hears it at home - unless he told his own, having got away.
 */
export function tellFannin(world) {
  // Armed every tick of the spring by `advanceMassacre`; a class that never reached it has nobody to tell.
  const battle = world.battles?.['goliad-massacre'];
  if (!battle) return;
  // Each family's men with Fannin who have not come home to tell it themselves: all of them, in one account.
  const byFamily = new Map();
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId || service?.kind !== 'fannin' || service.coleto === 'horton' || service.status === 'released' || battle.told[person.householdId]) continue;
    if (!service.fate && !service.coleto) continue;
    byFamily.set(person.householdId, [...(byFamily.get(person.householdId) || []), person]);
  }
  for (const [householdId, people] of byFamily) {
    const who = hearer(world, householdId, people[0].id);
    if (!who || people.some(one => one.id === who.id)) continue;
    const text = wordAccount(world, people);
    const eventId = tell(world, who, text, { claimId: 'HIST-TEX-517' });
    const names = people.map(one => one.name);
    battle.told[householdId] = { eventId, minute: world.minute, entityId: who.id, text, title: `What became of ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}` };
  }
}
