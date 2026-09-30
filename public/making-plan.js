// Which flashback videos the Host's computer starts making next (public/flashback.js `makeMissing`; docs/FLASHBACK.md §11b).
//
// Owner, 2026-09-30: "make two at once". The class's own video is made first and alone - it plays first, on the class screen, and
// the class waits for it - and then the families' videos **two at a time** (`MAKE_AT_ONCE`), the families students played first.
// Two, because each is one VP8 encoder and one canvas drawn on the page's one thread between awaits: the proof measured the class
// video playing on while two were made (docs/FLASHBACK.md §11b). ceiling: two, not the teacher computer's cores; a third is the
// way out if a class of thirty still waits too long and the class video still plays smoothly beside it.
//
// Pure, and apart from the page, so tests/end-sequence.test.mjs can hold it.

/** How many families' videos are made at once. */
export const MAKE_AT_ONCE = 2;
/** The class's own video's id among the families' (sim/class-flashback.mjs `CLASS_VIDEO_ID`). */
export const CLASS_ID = 'class';

/**
 * The videos to start now: `wanted` in the order they are wanted (the class's first, then the families), `busy` the ids being
 * made. The class's video alone, and nothing beside it; then families, up to `atOnce` in all.
 */
export function toStart(wanted, busy, atOnce = MAKE_AT_ONCE) {
  const making = new Set(busy);
  if (making.has(CLASS_ID)) return [];
  if (wanted.includes(CLASS_ID)) return making.size ? [] : [CLASS_ID];
  return wanted.filter(id => !making.has(id)).slice(0, Math.max(0, atOnce - making.size));
}
