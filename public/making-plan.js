// Which flashback videos the Host's computer starts making next (public/flashback.js `makeMissing`; docs/FLASHBACK.md §11a).
//
// The class's own video is made first and alone - it plays first, on the class screen, and the class waits for it. Then the
// families' videos:
//   - **one at a time while the class video plays** (owner, 2026-10-01: "One at a time"): measured alone, two made beside it cost
//     the class video 8.5-10.3% of its frames, one costs it far less, and the class screen is what the whole class is watching;
//   - **two at a time once it has ended** (owner, 2026-09-30: "make two at once"; the builder's choice, 2026-10-01, which the owner
//     left open): nothing is playing on the class screen then but words, and every family's start waits for the last video made, so
//     two at once brings the families' start sooner. A teacher's "Play the class video again" counts as playing.
// ceiling: two, not the computer's cores; one beside the class video, whatever the computer.
//
// Pure, and apart from the page, so tests/end-sequence.test.mjs can hold it.

/** How many families' videos are made at once with nothing playing on the class screen, and while the class video plays. */
export const MAKE_AT_ONCE = 2;
export const MAKE_BESIDE_CLASS_VIDEO = 1;
/** The class's own video's id among the families' (sim/class-flashback.mjs `CLASS_VIDEO_ID`). */
export const CLASS_ID = 'class';

/**
 * The videos to start now: `wanted` in the order they are wanted (the class's first, then the families), `busy` the ids being
 * made, `classPlaying` whether the class video is playing (or about to: its stage). The class's video alone, and nothing beside
 * it; then families, up to one in all while the class video plays and `MAKE_AT_ONCE` after.
 */
export function toStart(wanted, busy, { classPlaying = false } = {}) {
  const making = new Set(busy);
  if (making.has(CLASS_ID)) return [];
  if (wanted.includes(CLASS_ID)) return making.size ? [] : [CLASS_ID];
  const most = classPlaying ? MAKE_BESIDE_CLASS_VIDEO : MAKE_AT_ONCE;
  return wanted.filter(id => !making.has(id)).slice(0, Math.max(0, most - making.size));
}
