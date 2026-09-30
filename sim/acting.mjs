// Who acts for a family: its own decisions, whoever of it is where the family is, and a family left with nobody who can act.
//
// Owner, 2026-09-28: "fix the blockers" (docs/audits/2026-09-28-interactions.md B1, S1, S3, S4; docs/audits/2026-09-28-design.md
// B10, S14, S19, S22; docs/audits/2026-09-28-playthrough.md 7, 8), and by multiple choice for a family left with nobody who can
// act: **"The oldest child steps up"** - a child of about seven or older can act for the family in an emergency (flee, fetch
// water, mind the little ones, go for help), as frontier children really did; with none, the student follows a neighbour family
// that takes them in. `FIC-GONZ-730` to `-734` (HISTORY.md); docs/FAMILY_PANEL.md §20.
//
// **Who decides for the family** (`actingFor`). The family's own decisions - the order to leave, where it goes and by which way,
// staying, the road's questions and the soldiers' "¡Alto!" - are made by somebody who is **with the family**: at home before it
// leaves, travelling with it on the road east, camped with it at its refuge. In this order:
//
//   1. the student's main person (sim/family.mjs `mainPersonId`: their choice, the principal until one is made), if they are with
//      the family and able - not very sick and not lying wounded;
//   2. else the next able grown person with the family (ten or more, `SENT_FROM_AGE`), the principal first, then oldest first;
//   3. else anybody grown with the family, able or not - a very sick mother still says "go";
//   4. else **the oldest child of seven or more** with the family (`STEPS_UP_FROM`): the owner's "The oldest child steps up";
//   5. else, with nobody of the family where the family is, whoever grown is free and away (in town, on an errand) - their card
//      carries the question until they are home, as it always did.
//
// Nobody serving with the army, the garrison or the Matamoros men, nobody a prisoner, and nobody marching or gone to a call
// (`awayWithTheArmy`) decides for the family: they can only be sent for (sim/winter.mjs). Until this, `mainPersonId` kept the
// father serving with Houston as the family's main person, the page put the whole flight card on him, and every answer was refused
// ("can only be sent for") - "¡Alto!" lapsed and the family was caught (interactions B1). The chosen main person is otherwise
// untouched: the camera, the star and the army's own questions stay theirs.
//
// **A family with nobody who can act** (`nobodyToAct`, `advanceTakenIn`): no grown person free anywhere, and no child of seven or
// more with the family. The nearest neighbour family with a grown person at home **takes them in**: the little ones go to live
// with that family and go where it goes - east with it on the flight, camped with it at its refuge, home with it - until somebody
// grown of their own comes for them. The student follows them there. A child of seven or more who is the oldest at home may **go
// for help** (`child-help`) to the nearest neighbour, and the same happens.
//
// **Left behind** (`advanceStragglers`, interactions S1, design S19): anybody of the family away when it left - in town, sent for
// from the army, coming home - is told the family has gone and where, and follows it to its refuge by their own road.
//
// Nothing is stored that an old save lacks a correct empty value for: a family nobody took in has no `takenIn`, and nobody is
// following. **No save version moved.**
import { record } from './events.mjs';
import { householdName, mainPersonId, tooYoung } from './family.mjs';

/** The age a child is old enough to act for the family when nobody grown is with it (owner, 2026-09-28; `FIC-GONZ-730`). */
export const STEPS_UP_FROM = 7;
/** The chores that take a man to the army, the garrison or the expedition (sim/winter.mjs `WINTER_CHORES`, less the vote). */
export const WAR_CHORES = Object.freeze(['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'join-relief', 'join-houston', 'join-seguin']);
const WAR_PURPOSES = Object.freeze(['march', 'volunteer', 'follow']);
const GONE = Object.freeze(['dead', 'captured']);

const living = person => person?.kind === 'person' && !GONE.includes(person.health?.condition);
const peopleOf = (world, household) => household.members.map(id => world.entities[id]).filter(living);
/** Somebody grown enough, or old enough and well enough, to be of use: not very sick and not lying wounded. */
const able = person => person.health?.condition !== 'wounded' && !person.health?.grave;
/** A person the game gives no age sorts as their place says: a parent grown, a founding son or daughter an adolescent. */
const ageOf = person => (Number.isFinite(person.age) ? person.age : person.kin?.role === 'father' || person.kin?.role === 'mother' ? 30 : 12);
const firstName = person => person?.given || person?.name || 'Somebody';

/**
 * Whether this person is away with the war and can only be sent for: serving (sim/winter.mjs), a prisoner (sim/fannin.mjs), marching
 * with the army (sim/army.mjs), on the road to a call or the army, or standing with the men where a call gathered them
 * (`task: 'help'` away from home, sim/calls.mjs and sim/directors.mjs). Not a promise to serve alone: the men home for winter
 * clothing keep theirs (sim/army.mjs `leaveArmy`) and are at home.
 */
export function awayWithTheArmy(world, person) {
  if (['serving', 'prisoner'].includes(person?.service?.status)) return true;
  if (world?.army?.members?.includes(person?.id)) return true;
  if (WAR_PURPOSES.includes(person?.travel?.purpose)) return true;
  if (person?.task === 'help' && !person.travel && person.location?.siteId !== world?.households?.[person.householdId]?.homeSiteId) return true;
  return WAR_CHORES.includes(person?.chore?.id);
}
/** The camp the men went up the river to in October (sim/directors.mjs `CAMP_SITE`), restated so this file imports nothing of it. */
const MARCH_CAMP = 'williams-camp';
/** Whether the journey just begun takes the person to the war (the baby is never taken on it, interactions S4). */
export const goingToWar = (world, person) => awayWithTheArmy(world, person) || (person?.travel?.purpose === 'help' && person.travel.to === MARCH_CAMP);

/** The site the family is at right now, when it is standing somewhere: its home, its refuge, or its neighbours' where it was taken in. */
export function familySite(world, household) {
  if (household.takenIn) {
    const anchor = household.takenIn.ids.map(id => world.entities[id]).find(living);
    return anchor && !anchor.travel ? anchor.location?.siteId ?? null : null;
  }
  const status = household.flight?.status;
  if (status === 'refuged') return household.flight.refuge;
  if (['fled', 'returning'].includes(status)) return null;
  return household.homeSiteId;
}

/**
 * Whether this person is with the family where its decisions are made: at home before it leaves, on the road east with it, at its
 * refuge, on the road home with it - or, taken in by a neighbour, with the little ones there.
 */
export function withTheFamily(world, household, person) {
  if (!living(person)) return false;
  if (household.takenIn) {
    if (household.takenIn.ids.includes(person.id)) return true;
    const site = familySite(world, household);
    return Boolean(site) && !person.travel && person.location?.siteId === site;
  }
  const flight = household.flight, status = flight?.status;
  if (status === 'fled') return person.travel?.purpose === 'flee';
  if (status === 'refuged') return person.travel?.purpose === 'flee' || (!person.travel && person.location?.siteId === flight.refuge);
  if (status === 'returning') return person.travel?.purpose === 'return';
  return !person.travel && person.location?.siteId === household.homeSiteId;
}

/**
 * Who acts for the family in its own decisions, and how: `{ id, how }` with `how` one of 'main' (the student's main person),
 * 'grown' (the next grown person with the family), 'child' (the oldest child of seven or more: the owner's "steps up") and 'away'
 * (nobody is with the family; a grown person free elsewhere carries the question until home). Null when nobody can: every grown
 * person away with the war or gone, and no child old enough.
 */
export function actingFor(world, household) {
  if (!household) return null;
  const free = peopleOf(world, household).filter(person => !awayWithTheArmy(world, person));
  const main = mainPersonId(world, household);
  const chosen = [main, household.mainId, household.principalId];
  const rank = person => { const at = chosen.indexOf(person.id); return at === -1 ? chosen.length : at; };
  const order = (a, b) => (able(b) - able(a)) || (rank(a) - rank(b)) || (ageOf(b) - ageOf(a)) || a.id.localeCompare(b.id);
  const here = free.filter(person => withTheFamily(world, household, person));
  const grown = here.filter(person => !tooYoung(person)).sort(order);
  if (grown.length) return { id: grown[0].id, how: grown[0].id === main ? 'main' : 'grown' };
  const child = here.filter(person => tooYoung(person) && person.age >= STEPS_UP_FROM && able(person)).sort(order)[0];
  if (child) return { id: child.id, how: 'child' };
  // Nobody of the family where the family is: taken in, the family goes where its neighbours go, and nobody of it decides that.
  if (household.takenIn) return null;
  const away = free.filter(person => !tooYoung(person)).sort(order)[0];
  return away ? { id: away.id, how: 'away' } : null;
}
export const actingId = (world, household) => actingFor(world, household)?.id ?? null;
/** The family's decisions: refused to everybody else of it under ten, allowed to the child who steps up (sim/world.mjs). */
export const FAMILY_DECISIONS = Object.freeze(['flee', 'flight-route', 'flight-timber', 'flight-stay', 'road-answer']);

/** Why this family cannot make its own decisions now: it has been taken in, and goes where its neighbours go. Or null. */
export function takenInRefusal(world, household) {
  if (!household.takenIn) return null;
  const host = world.households[household.takenIn.by];
  return `The family is with ${host ? householdName(world, host) : 'a neighbour family'} now, and goes where they go, until somebody grown of the family comes for them.`;
}

/**
 * Nobody of this family can act (design B10): somebody is living and free to be seen to, but no grown person is free anywhere - every
 * one is away with the war, a prisoner, taken or dead - and no child of seven or more is with the family.
 */
export function nobodyToAct(world, household) {
  const free = peopleOf(world, household).filter(person => !awayWithTheArmy(world, person));
  if (!free.length) return false;
  if (free.some(person => !tooYoung(person))) return false;
  return !free.some(person => person.age >= STEPS_UP_FROM && able(person) && withTheFamily(world, household, person));
}

/**
 * The warning on a control that sends somebody to the war (design S14): who is left at home if they go, when nobody of ten or more
 * would be. Null when somebody grown stays. Said before, never refused (the owner's rule for the war is who may go, not who must stay).
 */
export function leavesLittleOnes(world, household, entity) {
  if (!household || !entity || tooYoung(entity)) return null;
  const home = peopleOf(world, household).filter(person => person.id !== entity.id && !awayWithTheArmy(world, person) && !person.travel && person.location?.siteId === household.homeSiteId);
  if (!home.length || home.some(person => !tooYoung(person))) return null;
  const names = [...home].sort((a, b) => ageOf(b) - ageOf(a)).map(person => `${firstName(person)}, ${person.age}`);
  const list = names.length > 1 ? `${names.slice(0, -1).join('; ')} and ${names.at(-1)}` : names[0];
  const oldest = home.filter(person => person.age >= STEPS_UP_FROM && able(person)).sort((a, b) => ageOf(b) - ageOf(a))[0];
  return `If ${firstName(entity)} goes, nobody older than nine is left at home: ${list}. ${oldest
    ? `${firstName(oldest)} would be the oldest there, and would have to act for the family.`
    : 'With nobody of seven or more, the nearest neighbour family would take them in.'}`;
}

// ------------------------------------------------------------------------------------------------ taken in

const siteOf = (world, id) => world.map.sites[id];
const miles = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity);

/**
 * The neighbours' ledger (sim/neighbourly.mjs), registered by sim/world.mjs rather than imported, since that module reaches this
 * one through sim/chores.mjs: how much one family owes another, and the deed written when children are taken in.
 */
const ledger = { owes: null, recorded: null };
export function registerTakenInLedger({ owes, recorded }) { ledger.owes = owes; ledger.recorded = recorded; }

/**
 * A family that could take these children in at this place: somebody grown and free with it, and not itself taken in. The family
 * that owes this one most comes first (owner, 2026-09-28: neighbours remember and repay), and then the nearest.
 */
function hostsFor(world, household) {
  const place = familySite(world, household);
  if (!place) return [];
  const refuged = household.flight?.status === 'refuged';
  const here = siteOf(world, place);
  return Object.values(world.households).filter(other => other.id !== household.id && !other.takenIn
    && (refuged ? other.flight?.status === 'refuged' && other.flight.refuge === place : !['fled', 'refuged', 'returning'].includes(other.flight?.status))
    && ['main', 'grown'].includes(actingFor(world, other)?.how))
    .map(other => ({ other, owe: ledger.owes ? ledger.owes(world, other.id, household.id) : 0, far: miles(here, siteOf(world, familySite(world, other))) }))
    .sort((a, b) => b.owe - a.owe || a.far - b.far || a.other.id.localeCompare(b.other.id))
    .map(one => one.other);
}
/** The nearest neighbour family that could take this family in, or null. */
export const nearestNeighbour = (world, household) => hostsFor(world, household)[0] || null;

const tell = (world, household, text, extra = {}) => record(world, 'consequence', { householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-731', text, ...extra });

/**
 * The neighbours take the family in: everybody of it free and with it goes to them, and lives with them now. `by` is the child who
 * went for help, already there. `ceiling:` the little ones are set down at the neighbours' at once - the neighbours came for them -
 * rather than walked there; a journey for a child of two across a mile of prairie is the way out if it is ever wanted.
 */
export function takeIn(world, household, host, { by = null } = {}) {
  const site = familySite(world, host);
  const place = siteOf(world, site);
  if (!place) return false;
  const going = peopleOf(world, household).filter(person => !awayWithTheArmy(world, person) && (person.id === by?.id || withTheFamily(world, household, person)));
  if (!going.length) return false;
  going.forEach((person, i) => {
    if (person.id !== by?.id) { person.travel = null; person.chore = null; person.task = 'rest'; }
    delete person.carriedBy; delete person.talk; delete person.aside;
    if (person.baby) person.baby = { state: 'awake' };
    person.location = { x: Math.round((place.x + 0.006 + (i % 4) * 0.003) * 10000) / 10000, y: Math.round((place.y + 0.01 + Math.floor(i / 4) * 0.003) * 10000) / 10000, siteId: site };
  });
  household.takenIn = { by: host.id, ids: going.map(person => person.id), since: world.minute };
  ledger.recorded?.(world, host.id, household.id, household.takenIn.ids);
  const names = going.map(person => firstName(person));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  const hostName = householdName(world, host);
  tell(world, household, by
    ? `${firstName(by)} ran to ${hostName} for help, and they took the family in: ${list} live with them now, and go where they go, until somebody grown of the family comes for them.`
    : `With nobody at home old enough to see to them, ${hostName} took ${list} in. They live with them now, and go where they go, until somebody grown of the family comes for them.`);
  tell(world, host, `${hostName.replace(/^./, c => c.toUpperCase())} took in ${list} of ${householdName(world, household)}, with nobody of their own left at home old enough to see to them.`, { importance: 2 });
  return true;
}

/** Somebody grown of the family has come for the children: they are the family's again, where they stand. */
function release(world, household, host, grown, { beginTravel } = {}) {
  const ids = household.takenIn.ids;
  delete household.takenIn;
  const site = grown.location.siteId;
  tell(world, household, `${firstName(grown)} came for the children at ${householdName(world, host)}'s, and the family is together again.`, { actorId: grown.id });
  const ours = ids.map(id => world.entities[id]).filter(living);
  if (host.flight?.status === 'refuged' && site === host.flight.refuge) {
    // At a refuge: the family is camped there now, as its own, and goes home from there with the word of San Jacinto.
    household.flight = { ...(household.flight || {}), status: 'refuged', refuge: site, arrivedMinute: world.minute, leftMinute: household.flight?.leftMinute ?? world.minute, mode: household.flight?.mode || 'foot', crossed: household.flight?.crossed || [] };
    delete household.flight.route;
    return;
  }
  if (site === household.homeSiteId || !beginTravel) return;
  // At the neighbours' own place: home together, the babies on the hip of whoever came for them and the rest walking beside them
  // by the same road at the same pace - a child under ten is sent on no road of their own (sim/world.mjs `modeAvailability`).
  try { beginTravel(world, grown, household.homeSiteId, null, 'home'); } catch { return; }
  for (const person of ours) {
    if (person.id === grown.id || person.travel) continue;
    if (Number.isFinite(person.age) && person.age < 2) { person.carriedBy = grown.id; person.baby = { state: 'carried' }; continue; }
    const { fords, loggedProgress, progressEventId, causeId, ...journey } = grown.travel;
    person.travel = { ...journey, silent: true };
    person.location = { ...grown.location };
    person.task = 'travel';
  }
}

/** The taken-in go where their neighbours go: on the road with them, or standing where they stand. */
function goWith(world, host, ours) {
  const leader = peopleOf(world, host).find(person => ['flee', 'return'].includes(person.travel?.purpose));
  if (leader) {
    for (const person of ours) {
      const { fords, loggedProgress, progressEventId, rides, drives, saddle, afoot, carried, ...journey } = leader.travel;
      person.travel = { ...journey, purpose: 'taken-in', silent: true, rides: leader.id };
      person.location = { x: leader.location.x, y: leader.location.y, siteId: null };
      person.task = 'travel'; person.chore = null;
    }
    return;
  }
  const site = familySite(world, host);
  const place = siteOf(world, site);
  if (!place) return;
  ours.forEach((person, i) => {
    if (!person.travel && person.location?.siteId === site) return;
    person.travel = null; person.task = 'rest';
    person.location = { x: Math.round((place.x + 0.006 + (i % 4) * 0.003) * 10000) / 10000, y: Math.round((place.y + 0.01 + Math.floor(i / 4) * 0.003) * 10000) / 10000, siteId: site };
  });
}

/**
 * Every tick, after the flight: a family with nobody who can act is taken in by its nearest neighbours; a family taken in goes where
 * they go; and when somebody grown of its own is where the little ones are, the family is its own again.
 */
export function advanceTakenIn(world, { beginTravel } = {}) {
  if (world.status !== 'running') return;
  for (const household of Object.values(world.households)) {
    if (!household.takenIn) {
      if (!['fled', 'returning'].includes(household.flight?.status) && nobodyToAct(world, household)) {
        const host = nearestNeighbour(world, household);
        if (host) takeIn(world, household, host);
        else nobodyNear(world, household);
      }
      continue;
    }
    const host = world.households[household.takenIn.by];
    const ours = household.takenIn.ids.map(id => world.entities[id]).filter(living);
    if (!host || !ours.length) { delete household.takenIn; continue; }
    const anchor = ours[0];
    const grown = !anchor.travel && peopleOf(world, household).find(person => !tooYoung(person) && !awayWithTheArmy(world, person) && !person.travel && person.location?.siteId === anchor.location?.siteId);
    if (grown) { release(world, household, host, grown, { beginTravel }); continue; }
    goWith(world, host, ours);
  }
}

/**
 * The little ones with nobody to take them in (triage D3, 2026-09-29): nobody grown of the family free, no child of seven or more,
 * and no neighbour family near with somebody grown - every one has gone east, or is itself taken in. Said in the family's record
 * the day it is so, and again each day it stays so, so they are never left in the yard without a word; the page says it too.
 *
 * ceiling: **they wait at home.** Nobody comes back for them, and nobody takes them east: a family already on the road is not
 * turned back for a neighbour's children, and a child of six is sent on no road of their own. Their family's own order to leave
 * goes by itself after its day (sim/auto.mjs `FLIGHT_PATIENCE`) and takes them east with it, and at the refuge the families camped
 * there take them in (`hostsFor`, refuged). A neighbour's wagon that turns in for them on its way east is the way out, if a class
 * shows little ones left more than a day.
 */
function nobodyNear(world, household) {
  const day = Math.floor(world.minute / 1440);
  if (household.leftAlone === day) return;
  household.leftAlone = day;
  const little = peopleOf(world, household).filter(person => !awayWithTheArmy(world, person) && withTheFamily(world, household, person));
  if (!little.length) return;
  const names = little.map(person => firstName(person));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  tell(world, household, `Nobody grown is left at home with ${list}, and there is no neighbour family near to take them in: every one has gone. ${little.length > 1 ? 'They wait' : `${names[0]} waits`} at home.`, { importance: 3 });
}

// ------------------------------------------------------------------------------------------------ left behind

/**
 * Where somebody left behind goes to find the family: its refuge (or where it makes for), or where the little ones were taken in -
 * or, once the family has turned for home (`returning`, and `home` after it), home, for somebody still standing at the refuge it
 * left (triage D3, 2026-09-29: a straggler walking to the refuge when the word of San Jacinto came was left there).
 */
export function followTo(world, household, person = null) {
  if (household.takenIn) {
    const anchor = household.takenIn.ids.map(id => world.entities[id]).find(living);
    return anchor ? (anchor.travel ? anchor.travel.to : anchor.location?.siteId) ?? null : null;
  }
  const flight = household.flight;
  if (['returning', 'home'].includes(flight?.status) && flight.refuge && person?.location?.siteId === flight.refuge) return household.homeSiteId;
  return ['fled', 'refuged'].includes(flight?.status) ? flight.refuge : null;
}

/**
 * Every tick, after the flight: anybody of the family left behind when it went - in town, sent home from the army, back from an
 * errand - and standing idle away from it is told where the family has gone, and follows it there by their own road (interactions
 * S1, design S19). Only somebody free and old enough to be sent (a child under ten is sent on no road, and is with the family
 * anyway, since the children's works never leave its land); the wounded and the very sick are refused the road and wait.
 * Somebody still at work, on a road, with the army or a prisoner is left to it.
 *
 * ceiling: anybody standing idle away from a family on the road east is sent after it, so somebody a student sends elsewhere on
 * purpose while the family is fled goes on to its refuge when they get there. Nothing in the game sends a family's person anywhere
 * but home or after the family then; a "stay where you are" order is the way out if one ever does. The same holds once the family
 * has turned for home (2026-09-29): anybody of it standing idle at the refuge it left is sent home, so somebody a student sent back
 * there on purpose would be walked home again.
 */
export function advanceStragglers(world, { beginTravel, modeWith } = {}) {
  if (world.status !== 'running' || !beginTravel) return;
  for (const household of Object.values(world.households)) {
    const turned = ['returning', 'home'].includes(household.flight?.status) && !household.takenIn;
    const family = followTo(world, household);
    if (!turned && (!family || !world.map.sites[family])) continue;
    for (const person of peopleOf(world, household)) {
      // Once the family has turned for home, only somebody standing at the refuge it left is sent after it (`followTo`).
      const to = turned ? followTo(world, household, person) : family;
      if (!to || !world.map.sites[to]) continue;
      if (person.travel || person.chore || person.aside || person.carriedBy || person.task === 'help' || awayWithTheArmy(world, person)) continue;
      if (tooYoung(person)) continue;
      if (!able(person) || !person.location?.siteId || person.location.siteId === to || withTheFamily(world, household, person)) continue;
      const where = world.map.sites[to].name;
      const text = household.takenIn
        ? `${firstName(person)} learned the little ones had been taken in at ${where}, and went to fetch them.`
        : turned
          ? `${firstName(person)} came to ${world.map.sites[person.location.siteId]?.name || 'the camp'} to find the family gone home. ${firstName(person)} follows it home.`
        : person.location.siteId === household.homeSiteId
          ? `${firstName(person)} came home to find the house empty: the family has gone east for ${where}. ${firstName(person)} follows.`
          : `Word reached ${firstName(person)} that the family has gone east for ${where}. ${firstName(person)} follows by the road.`;
      // On the horse they have with them, standing where they are; otherwise on foot. Never the wagon or a beast that is on the
      // family's own road: a man left at home whose name was on the ox as it went must not take it off the flight (found by the
      // chase's "women and children alone" test, 2026-09-28).
      const withThem = modeWith?.(world, person);
      const mine = withThem === 'horse' && (household.property || []).map(id => world.entities[id]).some(beast => beast?.species === 'horse' && beast.borrowedBy === person.id && !beast.travel && beast.location?.siteId === person.location.siteId);
      try { beginTravel(world, person, to, null, 'visit', mine ? 'horse' : 'foot'); } catch { try { beginTravel(world, person, to, null, 'visit'); } catch { continue; } }
      record(world, 'consequence', { actorId: person.id, householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-732', text });
    }
  }
}

// ------------------------------------------------------------------------------------------------ going for help

/** The child who may go for help: the oldest child of seven or more acting for a family at home, with a neighbour to go to. */
function helpRefusal(world, household, entity) {
  if (household.takenIn) return takenInRefusal(world, household);
  if (actingFor(world, household)?.how !== 'child' || actingId(world, household) !== entity.id) return 'Only the oldest child at home goes for help, when nobody grown is there.';
  if (['fled', 'refuged', 'returning'].includes(household.flight?.status)) return 'The family is on the road east.';
  if (!nearestNeighbour(world, household)) return 'There is no neighbour family at home to go to.';
  return null;
}
/** The one chore the owner's "go for help" adds (sim/chores.mjs table): a child's, so a child under ten may be given it. */
// `registerChores` is handed in by sim/world.mjs: sim/chores.mjs imports this file (for the war's warning), and an arrow back would
// make a cycle that leaves the chore table half made when another module is loaded first (found by tests/house-*.test.mjs).
export function registerActingChores(registerChores) {
  if (registerActingChores.done) return;
  registerActingChores.done = true;
  registerChores({
    'child-help': {
      name: 'Go for help', skill: 'hands', where: 'home', child: true,
      describe: 'Run to the nearest neighbour family and ask them to take the family in. The little ones go to live with them and go where they go - east with them if they leave - until somebody grown of the family comes for them.',
      offered: (world, household, entity) => entity.age >= STEPS_UP_FROM && actingFor(world, household)?.how === 'child' && actingId(world, household) === entity.id && !household.takenIn,
      refusal: helpRefusal,
      begin: (world, household, entity) => {
        const host = nearestNeighbour(world, household);
        entity.chore.neighbour = host?.homeSiteId; entity.chore.hostId = host?.id;
        entity.chore.doing = `running to ${host ? householdName(world, host) : 'the neighbours'} for help`;
      },
      steps: [
        { travel: 'neighbour', doing: 'running to the neighbours for help' },
        { run: (world, household, entity) => { const host = world.households[entity.chore?.hostId]; if (host && !household.takenIn) takeIn(world, household, host, { by: entity }); } },
      ],
    },
  });
}

/** A family's being taken in that cannot be, or null. */
export function actingInvalid(world) {
  for (const household of Object.values(world.households)) {
    const taken = household.takenIn;
    if (taken === undefined) continue;
    if (!taken || !world.households[taken.by] || taken.by === household.id || !Array.isArray(taken.ids) || !taken.ids.every(id => household.members.includes(id)) || !Number.isFinite(taken.since)) return 'Invalid taking in';
  }
  for (const household of Object.values(world.households)) {
    if (household.leftAlone !== undefined && (!Number.isInteger(household.leftAlone) || household.leftAlone < 0)) return 'Invalid day left alone';
  }
  return null;
}
