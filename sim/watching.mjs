// A student with no family left to play follows another family and watches it (owner, 2026-09-29; docs/FAMILY_PANEL.md §20a).
//
// The owner, by multiple choice on the triage's D3(a) (docs/audits/2026-09-29-triage.md): **"Follow and watch"** - a student
// whose whole family is gone, or whose little ones have all been taken in by a neighbour family, follows the family that took
// them in, or else a neighbour family, and watches it. Until this the game coped - a gone family is never ordered out, holds
// nobody's clock and is never named winner - but nothing on the page said what had happened, possibly for a whole period
// (playthrough audit #7, triage 2.17), and a student whose little ones were taken in watched their own rows standing idle at
// the neighbours'.
//
// **Who watches** (`watchOf`):
//
//   - **Taken in** (sim/acting.mjs `takeIn`): nobody grown of the family free, no child of seven or more with it, and the
//     nearest neighbour family took the little ones in. The student watches **that family**, which is where the little ones are,
//     until somebody grown of their own comes for them (`release`) and the family is theirs again. **Only with nobody else of the
//     family to play**: a father serving with the army is still the student's - the army's questions are his, and his road home
//     is what fetches the little ones back - so while one lives and is not a prisoner the student keeps their own page, the little
//     ones' rows saying where they are (docs/FAMILY_PANEL.md §20). The owner's question was "the student with nobody left".
//   - **Gone**: everybody of the family dead or a prisoner - the one meaning of "wiped" the ending uses (sim/ending.mjs
//     `nobodyLeft`, aligned 2026-09-29: dead or captured). The student watches the **nearest neighbour family** with somebody
//     left, by the distance between their lands; one itself taken in is passed over while another is left.
//
// **What they see** (`projectWatching`): exactly the page that family's own student is sent (sim/world.mjs `projectWorld` for
// that family, role `student`) - its people, its land, its journal, the country as its people see it - and nothing of the Host's
// and nothing of any other family. Its controls are taken off: no work, no ways of going, no offers, no call, no rider's
// conversation, no guided start. A plain line says what happened and whose family they are watching (`watching.line`). At the
// class's end their own family's ending is theirs, not the watched family's; and their own man's fight, its card and the account of
// what became of him stay theirs all along (sim/world.mjs `ownWar`, 2026-09-29).
//
// **They give no orders** (`watchRefusal`, sim/world.mjs `applyAction`): every order is refused in words that say why, except
// putting a tip away and naming the family - neither touches the world.
//
// Nothing is stored: who is watched is worked out from the family as it stands, so a family whose little ones are fetched home,
// or whose prisoner comes back, is its own again the same tick. **No save version moved.**
import { householdName } from './family.mjs';
import { nobodyLeft } from './ending.mjs';
import { takenInRefusal } from './acting.mjs';

const GONE = Object.freeze(['dead', 'captured']);
const siteOf = (world, id) => (id ? world.map?.sites?.[id] : null);
const far = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity);
const peopleOf = (world, household) => household.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person');
/** Everybody of the family dead or a prisoner, with somebody ever in it: the ending's `nobodyLeft`, for people only. */
export const familyGone = (world, household) => peopleOf(world, household).length > 0 && nobodyLeft(world, household);

/**
 * The family this family's student watches, and why: `{ householdId, why }` with `why` 'taken-in' or 'gone', or null when the
 * family is its own to play. `householdId` is null for a gone family with no other family left in the class to watch.
 */
export function watchOf(world, household) {
  if (!household || world.status === 'lobby') return null;
  const host = household.takenIn && world.households[household.takenIn.by];
  // Taken in, and nobody else of the family left to play: a man serving with the army is still theirs - his questions, and the
  // road home that fetches the little ones back - so a family with one keeps its own page (the owner's question was "the student
  // with nobody left"). A prisoner of war can be given nothing, and does not count.
  if (host) return peopleOf(world, household).some(person => !GONE.includes(person.health?.condition) && !household.takenIn.ids.includes(person.id) && person.service?.status !== 'prisoner')
    ? null : { householdId: host.id, why: 'taken-in' };
  if (!familyGone(world, household)) return null;
  const home = siteOf(world, household.homeSiteId);
  const next = Object.values(world.households).filter(other => other.id !== household.id && peopleOf(world, other).length && !nobodyLeft(world, other))
    .sort((a, b) => Number(Boolean(a.takenIn)) - Number(Boolean(b.takenIn)) || far(home, siteOf(world, a.homeSiteId)) - far(home, siteOf(world, b.homeSiteId)) || a.id.localeCompare(b.id))[0];
  return { householdId: next?.id ?? null, why: 'gone' };
}

/** What happened to the family, and whose family the student is watching, in one plain paragraph. */
export function watchLine(world, household, watch) {
  const own = householdName(world, household), host = watch.householdId && world.households[watch.householdId];
  const theirs = host ? householdName(world, host) : null;
  if (watch.why === 'taken-in') {
    return `Nobody grown of ${own} was left to see to the little ones, and ${theirs} took them in. You are watching ${theirs}, who have them now. You cannot give orders until somebody grown of your family comes for them.`;
  }
  const people = peopleOf(world, household);
  const dead = people.every(person => person.health?.condition === 'dead');
  const what = dead ? `Everybody of ${own} has died.` : `Everybody of ${own} has died or been taken prisoner.`;
  return theirs
    ? `${what} You are following ${theirs}, your nearest neighbours, and watching what becomes of them. You cannot give orders.`
    : `${what} There is no family left in the class to follow.`;
}

/**
 * The page's `watching`: whose family this is and whose it follows, the line, and the watched family's people by role and age -
 * the order its column is drawn in (public/family-panel.js `panelOrder`), which a student's page otherwise reads from its own
 * family's book. Never a hidden stat, never anything the watched family's own page is not sent.
 */
export function watchingProjection(world, household, watch) {
  const host = watch.householdId && world.households[watch.householdId];
  return {
    why: watch.why, householdId: household.id, name: householdName(world, household), line: watchLine(world, household, watch),
    ...(host && { of: host.id, ofName: householdName(world, host),
      people: host.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person')
        .map(entity => ({ id: entity.id, role: entity.kin?.role || null, ...(Number.isFinite(entity.age) && { age: entity.age }) })) }),
  };
}

/**
 * The page of a student watching another family: that family's own student page with its controls taken off, their own ending at
 * the class's end, and the line. `project` is sim/world.mjs `projectWorld`, `ending` sim/ending.mjs `endingProjection`, handed in
 * so this file imports neither.
 */
export function projectWatching(world, household, watch, { project, ending, options = {} }) {
  const view = project(world, watch.householdId || household.id, 'student', options);
  // Read-only: nothing on this page can be answered or begun.
  view.work = {}; view.travelModes = {}; view.offers = [];
  for (const key of ['lesson', 'lessonResume', 'request', 'encounter', 'neighbourly']) delete view[key];
  // Their own family's ending, not the family they followed.
  delete view.ending;
  Object.assign(view, ending(world, household.id, 'student'));
  view.watching = watchingProjection(world, household, watch);
  // Still this student's page: the family being made, its tips and its key are theirs (public/creation.js, public/tips.js), and a
  // page that took the watched family's id for its own put the title screen back over the world. `watching.of` is whose it shows.
  view.householdId = household.id;
  return view;
}

/** The orders a watching student may still send: putting a tip away and naming the family, which touch nothing in the world. */
const STILL_OPEN = new Set(['seen-tip']);
/** Why this student's order is refused because they are watching, or null. */
export function watchRefusal(world, household, input) {
  const watch = watchOf(world, household);
  if (!watch || STILL_OPEN.has(input?.action) || (input?.action === 'rename' && !input.entityId)) return null;
  // Taken in: the words every one of the family's own decisions has been refused in since 2026-09-28 (sim/acting.mjs).
  return watch.why === 'taken-in' ? `${takenInRefusal(world, household)} Nobody of the family can be given an order until then.` : 'Nobody of your family is left to give an order to.';
}
