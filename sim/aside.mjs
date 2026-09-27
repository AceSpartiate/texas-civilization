// A grown-up called aside from their work by the family's little ones (docs/CHILDREN.md §3 and §5).
//
// Two things stop a person's work without ending it, and both are the family's children: a child with nothing to do who has
// come to talk (sim/childhood.mjs, owner 2026-09-26: "this conversation stops the parent from doing their task until the kid
// is given a new task"), and a baby who has cried and is being held (sim/babies.mjs, owner the same day: "the nearest female
// character that's of age will stop their task and hold the baby for a while ... then they return to their previous task and
// state"). While either lasts the person's `aside` says so, and three places read it: their work does not go on
// (sim/chores.mjs `advanceChore`), auto takes nothing up for them (sim/auto.mjs), and working about the place brings in nothing
// for them (sim/routines.mjs). **Nothing of their work is changed**: the chore, its step, its wait, its answers and their auto
// are exactly as they were, and the moment `aside` goes they go on from there.
//
// This file imports nothing, on purpose: sim/chores.mjs and sim/routines.mjs read it, and both are below the modules that set it.

/** Whether this person's work is stopped because the family's little ones have called them aside. */
export const calledAside = entity => Boolean(entity?.aside);

/**
 * Why this person cannot be given work right now, in the words their row and every refused icon show; or null.
 * `nameOf` turns an id into a name (the world's `entities`), so a child renamed is named as they are now.
 */
export function asideWhy(entity, nameOf = id => id) {
  const aside = entity?.aside;
  if (!aside) return null;
  if (aside.kind === 'talk') {
    const child = nameOf(aside.childIds?.[0]);
    return `${entity.name} has stopped to talk with ${child}, who has nothing to do. Give ${child} something to do and ${entity.name} goes back to work.`;
  }
  if (aside.kind === 'baby') return `${entity.name} is seeing to the baby, and will be back at it in a moment.`;
  return null;
}
