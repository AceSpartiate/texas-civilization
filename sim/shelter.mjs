// Out of the weather: the tent until the house stands, and who goes in when it rains (owner, 2026-10-02; docs/SETTLING_IN.md §4c,
// docs/CHILDREN.md §13, `FIC-GONZ-1091` to `-1093`, `HIST-TEX-1090`).
//
// The owner, verbatim: "families should put up tents to get out of the rain if their house isn't finished. when there's inclement
// weather, families that have members that aren't on a specific task that needs them outdoors, those characters should seek shelter.
// kids should always seek shelter, and a 10+yo character should have to accompany them and play with them since they can't play
// outdoors."
//
// Three things live here, run once a tick after the children and the babies and before auto (sim/world.mjs `stepWorld`):
//
//   1. **The tent** (`pitch-tent`, *Put up the tent*): a family whose house has no roof can put up its tent - the wagon sheet, or the
//      sail cloth the emigrants' guides told a family to bring "until the house is built" (`HIST-GONZ-027`, `HIST-TEX-1090`). A quick
//      work on the bar of anybody of ten or more; and the first time the weather turns with no roof and no tent, whoever of ten or more
//      is standing free puts it up by themself. It comes down the day a pen is roofed: the canvas goes back on the wagon.
//   2. **Who goes in** (`INCLEMENT`: a rain day, a storm, a norther wet or dry): everybody at home with **no task** - nothing to do,
//      working about the place, resting - and **every child under ten, always**, whatever they were set to. Somebody at a task goes on
//      with it: every family work is out of doors, and the rain holds only what it held before (the roof and the daubing,
//      `FIC-GONZ-290`). Where they go: the house once a pen is roofed; else the tent; else under the wagon; else they huddle at the camp.
//   3. **Somebody of ten or more with the children** (`companion`): any child sheltering has a person of ten or more with them, who
//      plays with them. The nearest of the family already in out of the weather; else the nearest at work about the house or the field,
//      called in from it - their work stands exactly where it is (sim/aside.mjs, as for a child who has come to talk) and they go back
//      to it when the weather clears. Unlike a child's talk, it refuses the student nothing: an order sends them, and somebody else
//      comes in to the children (`shelterExcused`, for the rest of the day). **Never** somebody out on the land after game, fish, timber or the stock, nursing the sick, or on
//      a road (`CANNOT_LEAVE`): their work is out there, and calling them home would be the time sink the owner ruled out for the
//      children's talk. With nobody to come, the children shelter by themselves, said once a day in the family's record.
//
// When the weather clears everybody goes back to where they were and to what they were at; auto takes up its own as it always does.
// Nothing is stored that an old save lacks a correct empty value for - no tent, nobody sheltering - so **no save version moved**.
import { CHORES, beginChore, registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { ADULT_AT, listWords, tooYoung } from './family.mjs';
import { housed } from './settling.mjs';
import { wagonsOf } from './wagon.mjs';
import { skyAtHome } from './houses.mjs';
import { houseFront } from './house-placement.mjs';
import { CABIN_PEOPLE, PERSON_MILES } from './house-footprint.mjs';
import { calendarMinutes } from './clock.mjs';
import { TALK_SCALE, awake, endTalk } from './childhood.mjs';
import { inLesson } from './lesson.mjs';

/** The kinds of day that send people in (sim/weather.mjs): rain, a storm, and a norther whether it carried rain or not. Not fog. */
export const INCLEMENT = Object.freeze(['rain', 'storm', 'norther']);
/** Whether this day's weather sends people in. `here` is a day's weather in one country (`weatherAt`). */
export const inclement = here => Boolean(here) && INCLEMENT.includes(here.kind);
/** Ticks of an ordinary hand's work to put the tent up, before the family's pace halves it (sim/work-pace.mjs): about half an hour. */
export const TENT_TICKS = 3;
/** The youngest who puts the tent up, or sits with the children: ten, the age the family sends anybody (sim/family.mjs). */
export const COMPANION_FROM = 10;
/**
 * Work that cannot be left for the children (`companion`): out on the land after something - game, fish, oysters, honey, timber, the
 * stock - nursing the sick, and anything on a road. Read off the chore's own flags, so a new work of these kinds is covered without a
 * list to keep. Everything else at home - the house, clearing, fencing, the lane, the well, planting and the harvest, furniture, the
 * carreta, the hoe, the mark, milking, the tent - is near the house and may be left a while.
 */
export const CANNOT_LEAVE = Object.freeze(['hunts', 'huntLand', 'forage', 'fells', 'fetchesLogs', 'stock', 'nurses', 'road', 'flight', 'war', 'winter', 'camp']);
const CLAIM = 'FIC-GONZ-1092', TENT_CLAIM = 'FIC-GONZ-1091', CHILD_CLAIM = 'FIC-GONZ-1093';
const GONE = Object.freeze(['dead', 'captured']);
const r4 = value => Math.round(value * 10000) / 10000;
const dayOf = world => Math.floor((world.minute || 0) / 1440);
const tell = (world, household, entity, text, claimId = CLAIM, extra = {}) => record(world, 'consequence', {
  actorId: entity?.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text, ...extra,
});

/**
 * Whether the family is living at home: not arriving, not away at the neighbours', and not on the road east - home again, or stayed.
 * **Not a family told to leave** (`ordered`): it is packing to go whatever the sky, and the children's work for the road - a bundle,
 * the milk cow, hiding the goods (sim/flight-work.mjs) - does not wait for the rain. The Scrape went in the rain.
 */
const familyHome = household => !household.arriving && household.courtship?.stage !== 'away'
  && (!household.flight || ['home', 'stayed'].includes(household.flight.status));
/** Somebody standing on the family's own land, alive, not on a road, not serving, not away visiting. */
const here = (household, person) => person && person.kind === 'person' && !GONE.includes(person.health?.condition) && !person.travel
  && person.location?.siteId === household.homeSiteId && person.service?.status !== 'serving' && !person.visiting && person.task !== 'help';
/** A child the weather always sends in: under ten, babies too, unless in somebody's arms (they go where they are carried). */
const child = person => tooYoung(person) && !person.carriedBy && person.baby?.state !== 'held';
/** Somebody of ten or more with no task: nothing to do, working about the place, resting. */
const free = person => !tooYoung(person) && !person.chore && !person.aside && !person.talk;
/** Whether this person's work could be left a while for the children: near the house, not out on the land. */
export const leavable = person => {
  const chore = CHORES[person?.chore?.id];
  return Boolean(chore) && !CANNOT_LEAVE.some(flag => chore[flag]) && chore.where === 'home';
};

/**
 * Where the family's tent stands: beside the camp, a few yards off the surveyor's mark the camp is drawn at (public/app.js
 * `homesteadCamp`, a camp the size of a house to its left). Fixed for the land, so the tent never moves and is never a new place.
 * ceiling: the tent stands at the camp whatever the house's placement; a house placed hard against the mark is drawn over it.
 */
export function tentPoint(world, household) {
  const site = world.map.sites[household.homeSiteId];
  if (!site) return null;
  return { x: r4(site.x - 1.4 * CABIN_PEOPLE * PERSON_MILES), y: r4(site.y + 0.3 * CABIN_PEOPLE * PERSON_MILES) };
}

/** The house the family lives in: its first finished house, else the one standing, else (an older class) the cabin at the mark. */
function houseDoor(world, household) {
  const lived = household.completedHouses?.[0] || household.house;
  const front = lived ? houseFront(world, { ...household, house: lived }) : null;
  const site = world.map.sites[household.homeSiteId];
  return front || (site ? { x: r4(site.x), y: r4(site.y) } : null);
}

/**
 * Where the family goes in out of the weather: `{ at, x, y }`. The house once a pen is roofed (`housed`); else the tent; else under
 * a wagon standing at home; else the camp, where there is nothing over them (`open`).
 */
export function shelterPlace(world, household) {
  if (housed(household)) { const door = houseDoor(world, household); if (door) return { at: 'house', ...door }; }
  if (household.tent) return { at: 'tent', x: household.tent.x, y: household.tent.y };
  const wagon = wagonsOf(world, household).find(one => !one.travel && one.location?.siteId === household.homeSiteId && !one.borrowedBy);
  if (wagon) return { at: 'wagon', x: r4(wagon.location.x), y: r4(wagon.location.y) };
  const camp = tentPoint(world, household);
  return camp ? { at: 'open', ...camp } : null;
}

/** In: moved to the place, the place and where they were remembered. On the way the first tick; in after it. */
function goIn(world, person, place) {
  const was = person.shelter;
  if (was && was.at === place.at && Math.abs(person.location.x - place.x) < 1e-9 && Math.abs(person.location.y - place.y) < 1e-9) {
    if (was.phase === 'going' && world.tick > was.since) was.phase = 'in';
    return false;
  }
  person.shelter = { at: place.at, phase: 'going', since: world.tick, back: was?.back || { x: person.location.x, y: person.location.y } };
  person.location = { x: place.x, y: place.y, siteId: person.location.siteId };
  return !was;
}

/** Whether this person is still standing on the family's own land, where going back to a place in the yard means anything. */
const onTheLand = (person, homeSiteId) => !person.travel && person.location?.siteId === homeSiteId;

/** Out again: back to where they were when the weather turned, unless their own work, or anything else, has taken them off since. */
function comeOut(person, homeSiteId, { stay = false } = {}) {
  const back = person.shelter?.back;
  delete person.shelter;
  if (!stay && back && onTheLand(person, homeSiteId)) person.location = { x: back.x, y: back.y, siteId: homeSiteId };
}

/** The companion let go: back to exactly where and what they were at (or, sent to new work, off to it from where they are). */
function letCompanionGo(person, homeSiteId, { stay = false } = {}) {
  const was = person.aside?.kind === 'shelter' ? person.aside.was : null;
  delete person.aside;
  comeOut(person, homeSiteId, { stay: true });
  if (was && onTheLand(person, homeSiteId) && !stay) {
    person.location = { x: was.x, y: was.y, siteId: homeSiteId };
    if (was.task) person.task = was.task;
  }
}

/**
 * Who sits with the children: the nearest of ten or more already in out of the weather; else the nearest older brother or sister of
 * ten to fifteen at work that can be left (`leavable`) - the elder child who minded the little ones (`HIST-TEX-645`) - and only then
 * the nearest grown person at such work. Nobody sent to other work by the student today (`shelterExcused`). Null for nobody.
 */
export function companionFor(world, household, place, { callIn = true } = {}) {
  const people = household.members.map(id => world.entities[id]).filter(person => here(household, person) && !tooYoung(person)
    && !person.health?.grave && person.health?.condition !== 'wounded' && person.aside?.kind !== 'baby' && !person.carriedBy
    && person.shelterExcused !== dayOf(world));
  const far = person => Math.hypot(person.location.x - place.x, person.location.y - place.y);
  const nearest = list => [...list].sort((a, b) => far(a) - far(b) || a.id.localeCompare(b.id))[0] || null;
  const inside = nearest(people.filter(person => free(person) || (person.shelter && !person.chore && !person.talk && person.aside?.kind !== 'talk')));
  if (inside || !callIn) return inside;
  const working = people.filter(person => person.chore && !person.aside && leavable(person));
  return nearest(working.filter(person => person.age < ADULT_AT)) || nearest(working);
}

/** The family's record hears once a day of each thing, as the children's talk is told (sim/childhood.mjs `firstToday`). */
function onceToday(household, key, world) {
  const day = dayOf(world);
  if (household.shelterTold?.[key] === day) return false;
  household.shelterTold = { ...(household.shelterTold || {}), [key]: day };
  return true;
}

/** The tent is put up by whoever stands free, the first time the weather turns on a family with no roof and no tent. */
function tentByItself(world, household, travel) {
  if (housed(household) || household.tent || !travel) return;
  const people = household.members.map(id => world.entities[id]).filter(person => here(household, person));
  if (people.some(person => person.chore?.id === 'pitch-tent')) return;
  const site = world.map.sites[household.homeSiteId];
  const far = person => Math.hypot(person.location.x - site.x, person.location.y - site.y);
  const who = people.filter(person => free(person) && !person.health?.grave && person.health?.condition !== 'wounded').sort((a, b) => far(a) - far(b) || a.id.localeCompare(b.id))[0];
  if (!who) return;
  try { beginChore(world, household, who, 'pitch-tent', travel); } catch { return; }
  if (onceToday(household, 'tent', world)) tell(world, household, who, `The weather turned, and ${who.name} went to put up the tent.`, TENT_CLAIM, { ambient: true });
}

/**
 * Every tick, for every family at home: the tent struck once there is a roof; in a turn of the weather the tent put up, everybody with
 * no task and every child sent in, and somebody of ten or more with the children; when it clears, everybody back out to what they were
 * at. `travel` is what `beginChore` needs to begin the tent.
 */
export function advanceShelter(world, travel = null) {
  for (const household of Object.values(world.households)) {
    const people = household.members.map(id => world.entities[id]).filter(Boolean);
    // The canvas goes back on the wagon the day a pen is roofed: the family sleeps under its own roof.
    if (household.tent && housed(household)) delete household.tent;
    const foul = world.status === 'running' && familyHome(household) && inclement(skyAtHome(world, household));
    if (!foul) {
      for (const person of people) {
        if (person.aside?.kind === 'shelter') letCompanionGo(person, household.homeSiteId);
        if (person.shelter) comeOut(person, household.homeSiteId);
      }
      continue;
    }
    tentByItself(world, household, travel);
    const place = shelterPlace(world, household);
    if (!place) continue;
    let went = 0;
    // Who goes in, and who comes out: a person with a task goes out to it; somebody gone from the land is no longer sheltering here.
    for (const person of people) {
      if (person.aside?.kind === 'shelter') continue;
      const wants = here(household, person) && (child(person) || free(person));
      if (!wants) { if (person.shelter) comeOut(person, household.homeSiteId, { stay: true }); continue; }
      // A child who had gone to talk to somebody comes in instead: the grown-up goes back to what they were at.
      if (person.talk) { endTalk(world, person); delete person.idleSince; }
      if (goIn(world, person, place)) went++;
    }
    if (went && onceToday(household, `in:${place.at}`, world)) {
      const words = { house: 'went into the house', tent: 'went in under the tent', wagon: 'got in under the wagon', open: 'huddled at the camp with nothing over them' }[place.at];
      tell(world, household, people.find(person => person.shelter), `The weather turned, and the family ${words}.`, CLAIM, { ambient: true });
    }
    // The children's companion.
    const children = people.filter(person => person.shelter && child(person));
    // Only in a family somebody plays, awake, on a calendar slow enough to stop for, and not in a guided start - the children's talk and
    // the crying baby's own terms (sim/childhood.mjs, sim/babies.mjs): a family nobody plays is run by its director, and a pause nobody
    // can see is a cost nobody chose. Its children still go in; they keep each other company.
    const quiet = !household.played || household.absent || inLesson(world, household) || !awake(world) || calendarMinutes(world) > TALK_SCALE;
    let companion = people.find(person => person.aside?.kind === 'shelter');
    if (companion && (quiet || !here(household, companion) || !children.length || companion.health?.grave || companion.health?.condition === 'wounded')) { letCompanionGo(companion, household.homeSiteId); companion = null; }
    // A student's order wins: somebody sent to new work goes to it, and is not called in again today; somebody else comes in.
    if (companion && companion.chore && companion.chore.id !== companion.aside.held) {
      companion.shelterExcused = dayOf(world);
      letCompanionGo(companion, household.homeSiteId, { stay: true });
      companion = null;
    } else if (companion && !companion.chore && companion.aside.held) companion.aside.held = null;
    // Somebody already in out of the weather takes over from a worker called in, who goes back to their work.
    if (companion && companion.chore) {
      const better = companionFor(world, household, place, { callIn: false });
      if (better && better !== companion) { letCompanionGo(companion, household.homeSiteId); companion = null; }
    }
    if (!companion && children.length && !quiet) {
      const chosen = companionFor(world, household, place);
      if (chosen) {
        // Where they go back to when it clears: where they were at work, or - somebody already in - where they stood before they went in.
        const from = chosen.shelter?.back || chosen.location;
        chosen.aside = { kind: 'shelter', childIds: children.map(one => one.id), was: { x: from.x, y: from.y, task: chosen.task }, held: chosen.chore?.id || null };
        if (!chosen.shelter) chosen.shelter = { at: place.at, phase: 'going', since: world.tick, back: { x: chosen.location.x, y: chosen.location.y } };
        chosen.location = { x: place.x, y: place.y, siteId: chosen.location.siteId };
        companion = chosen;
        if (onceToday(household, `with:${chosen.id}`, world)) {
          const names = listWords(children.map(one => one.given || one.name));
          tell(world, household, chosen, chosen.chore
            ? `${chosen.name} left ${(CHORES[chosen.chore.id]?.name || 'the work').toLowerCase()} and came in to keep ${names} company out of the weather.`
            : `${chosen.name} is keeping ${names} company out of the weather.`, CHILD_CLAIM, { ambient: true });
        }
      } else if (onceToday(household, 'alone', world)) {
        tell(world, household, children[0], `Nobody of ten or more is free to sit with ${listWords(children.map(one => one.given || one.name))}, so the children keep each other company out of the weather.`, CHILD_CLAIM, { ambient: true });
      }
    }
    if (companion) {
      companion.aside.childIds = children.map(one => one.id);
      if (companion.shelter.at !== place.at) companion.shelter = { ...companion.shelter, at: place.at, phase: 'going', since: world.tick };
      else if (companion.shelter.phase === 'going' && world.tick > companion.shelter.since) companion.shelter.phase = 'in';
      companion.location = { x: place.x, y: place.y, siteId: companion.location.siteId };
    }
  }
}

/** What the page is told of somebody in out of the weather: where, and whether they are in yet. Absent for everybody else. */
export const shelterShown = entity => (entity?.shelter ? { shelter: { at: entity.shelter.at, phase: entity.shelter.phase, ...(entity.aside?.kind === 'shelter' && { minding: true }) } } : {});

/** The companion's row line, the one line a sheltering row says (the rest is the picture). */
export const shelterLine = (world, entity) => (entity?.aside?.kind === 'shelter'
  ? `Inside with ${listWords(entity.aside.childIds.map(id => world.entities[id]?.given || world.entities[id]?.name || 'the children'))}, out of the weather.` : null);

// ------------------------------------------------------------------------------------------------ the tent, a work on the bar

/** Whether the tent is offered: somebody of ten or more, the family at home on its land, and no roof and no tent. */
const tentOffered = (world, household, entity) => !tooYoung(entity) && familyHome(household) && !housed(household) && !household.tent;
function tentRefusal(world, household, entity) {
  const at = household.members.map(id => world.entities[id]).find(person => person?.chore?.id === 'pitch-tent' && person !== entity);
  if (at) return `${at.name} is putting up the tent.`;
  return null;
}
function pitch(world, household, entity) {
  if (household.tent || housed(household)) return;
  const at = tentPoint(world, household);
  if (!at) return;
  household.tent = { x: at.x, y: at.y, minute: world.minute };
  tell(world, household, entity, `${entity.name} put up the tent by the wagon: somewhere dry to go until the house stands.`, TENT_CLAIM, { importance: 2 });
}
/** The person walks over to where the tent goes, in the same tick the work begins: drawn walking there over it. */
function toTheTent(world, household, entity) {
  const at = tentPoint(world, household);
  if (at && entity.location?.siteId === household.homeSiteId) entity.location = { x: at.x + 0.004, y: at.y + 0.002, siteId: household.homeSiteId };
}

let registered = false;
/** The tent joins the one chore table here, called from sim/world.mjs, as milking does. */
export function registerShelter() {
  if (registered) return;
  registered = true;
  registerChores({
    'pitch-tent': {
      name: 'Put up the tent', skill: 'hands', where: 'home', tent: true,
      describe: 'Stretch the wagon sheet over a ridge pole by the camp and peg it down: somewhere dry for the family to go in out of the rain until the house has a roof. About half an hour. When the weather turns with no tent up, whoever is free puts it up by themself.',
      offered: tentOffered,
      refusal: tentRefusal,
      steps: [{ run: toTheTent }, { work: TENT_TICKS, doing: 'putting up the tent' }, { run: pitch }],
    },
  });
}

/** A saved tent or shelter that cannot be, or null. Absent on every class saved before, which reads as no tent and nobody in. */
export function shelterInvalid(world) {
  for (const household of Object.values(world.households || {})) {
    const tent = household.tent;
    if (tent !== undefined && (!tent || !Number.isFinite(tent.x) || !Number.isFinite(tent.y) || !Number.isFinite(tent.minute))) return 'Invalid tent';
    if (household.shelterTold !== undefined && (!household.shelterTold || typeof household.shelterTold !== 'object' || Object.values(household.shelterTold).some(day => !Number.isInteger(day)))) return 'Invalid shelter record';
  }
  for (const entity of Object.values(world.entities)) {
    const shelter = entity.shelter;
    if (shelter !== undefined && (!shelter || !['house', 'tent', 'wagon', 'open'].includes(shelter.at) || !['going', 'in'].includes(shelter.phase) || !Number.isInteger(shelter.since)
      || !Number.isFinite(shelter.back?.x) || !Number.isFinite(shelter.back?.y))) return 'Invalid shelter';
    if (entity.aside?.kind === 'shelter' && (!Array.isArray(entity.aside.childIds) || !Number.isFinite(entity.aside.was?.x) || !entity.shelter)) return 'Invalid shelter aside';
    if (entity.shelterExcused !== undefined && !Number.isInteger(entity.shelterExcused)) return 'Invalid shelter excuse';
  }
  return null;
}
