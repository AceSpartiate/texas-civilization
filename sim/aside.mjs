// A grown-up called aside from their work by the family's little ones (docs/CHILDREN.md §3 and §5).
//
// Three things stop a person's work without ending it, and all are the family's children: a child with nothing to do who has
// come to talk (sim/childhood.mjs, owner 2026-09-26: "this conversation stops the parent from doing their task until the kid
// is given a new task"), and a baby who has cried and is being held (sim/babies.mjs, owner the same day: "the nearest female
// character that's of age will stop their task and hold the baby for a while ... then they return to their previous task and
// state"). And since 2026-10-02 the children sheltering from the weather, whom somebody of ten or more sits with (sim/shelter.mjs,
// owner: "a 10+yo character should have to accompany them and play with them since they can't play outdoors"). While any lasts the person's `aside` says so, and three places read it: their work does not go on
// (sim/chores.mjs `advanceChore`), auto takes nothing up for them (sim/auto.mjs), and working about the place brings in nothing
// for them (sim/routines.mjs). **Nothing of their work is changed**: the chore, its step, its wait, its answers and their auto
// are exactly as they were, and the moment `aside` goes they go on from there.
//
// This file imports nothing, on purpose: sim/chores.mjs and sim/routines.mjs read it, and both are below the modules that set it.

/** What a row calls somebody: their first name, the family's last name being on every row already. */
export const first = entity => entity?.given || entity?.name || 'Somebody';

/** Whether this person's work is stopped because the family's little ones have called them aside. */
export const calledAside = entity => Boolean(entity?.aside);
/**
 * Whether being called aside also refuses this person new orders. Talking with a child and holding a baby do, until the child has
 * something to do or the baby is down. Sitting with the children out of the weather does not (sim/shelter.mjs): the weather may hold
 * for days, and a student's order wins - whoever is sent goes, and somebody else comes in to the children.
 */
export const asideRefuses = entity => Boolean(entity?.aside) && entity.aside.kind !== 'shelter';

/**
 * Why this person cannot be given work right now, in the words their row and every refused icon show; or null.
 * `nameOf` turns an id into a name (the world's `entities`), so a child renamed is named as they are now.
 */
export function asideWhy(entity, nameOf = id => id) {
  const aside = entity?.aside;
  if (!aside) return null;
  if (aside.kind === 'talk') {
    const child = nameOf(aside.childIds?.[0]);
    return `${first(entity)} has stopped to talk with ${child}, who has nothing to do. Give ${child} something to do and ${first(entity)} goes back to work.`;
  }
  if (aside.kind === 'baby') return `${first(entity)} is seeing to the baby, and will be back at it in a moment.`;
  return null;
}

/**
 * A child under ten in out of the weather (sim/shelter.mjs, owner 2026-10-02: "kids should always seek shelter"): whatever they were
 * set to stands exactly where it is, as a grown-up's does when called aside, until the weather clears. Read by sim/chores.mjs
 * `advanceChore` and sim/childhood.mjs.
 */
export const heldIndoors = entity => Boolean(entity?.shelter) && Number.isFinite(entity?.age) && entity.age < 10;
