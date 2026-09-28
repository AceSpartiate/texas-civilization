// Tips at first meeting: which of them a family's student has already seen (owner, 2026-09-28, by multiple choice on how
// the systems after the guided start are taught: "Short tips at first meeting" - the first time each new thing appears, a
// one-line tip shows what to do and what it costs; nothing blocks play; each tip shown once).
//
// The words, and when each thing has "appeared", are the page's (public/tips.js): a tip is presentation, read from the same
// family-filtered projection the student's screen is drawn from, and it decides nothing - it opens no control and refuses
// none. What the server holds is the one fact a page cannot keep honestly: **which tips this family has seen**, so a reload,
// a second Chromebook or a rejoin with the family key never shows one again. `household.tipsSeen` is a list of tip ids,
// absent on every class saved before today - the correct empty value ("seen none"), so **no save version moved**.
//
// Invented entire: a tip makes no historical claim, and none is registered.

/**
 * Every tip there is, by id. The page's `TIPS` (public/tips.js) must name exactly these - tests/tips.test.mjs fails if the
 * two ever part - and a `seen-tip` naming anything else is refused, so a save can never carry a word nobody wrote.
 */
export const TIP_IDS = Object.freeze([
  'alto', 'road', 'flight', 'route', 'sick', 'rest', 'call', 'army', 'watch', 'resume',
  'cow', 'milk', 'baby', 'child', 'enlist', 'trade', 'store', 'star',
]);

/** The tips this family's student has seen, in the order they were put away. */
export const tipsSeenOf = household => (Array.isArray(household?.tipsSeen) ? household.tipsSeen : []);

/**
 * The student has put a tip away - pressed "Got it", pressed Escape on it, or the thing it was about went before they did
 * (public/app.js). Only a family's own student: `applyAction` is handed the household the sender's cookie names, so a
 * student can only ever mark their own family's; the Host has no household, and a family whose student has gone is run by
 * the director, which reads no tips and marks none. Marking one already seen changes nothing.
 */
export function markTipSeen(world, household, tip) {
  if (!household || household.absent || !household.played) throw new Error('Only a family’s own student can put away its tips.');
  const id = String(tip ?? '');
  if (!TIP_IDS.includes(id)) throw new Error('There is no such tip.');
  const seen = tipsSeenOf(household);
  if (seen.includes(id)) return;
  household.tipsSeen = [...seen, id];
}

/** A stored list that cannot be: not a list, a tip nobody wrote, or one tip twice. */
export function tipsInvalid(household) {
  const seen = household.tipsSeen;
  if (seen === undefined) return null;
  if (!Array.isArray(seen) || seen.some(id => !TIP_IDS.includes(id)) || new Set(seen).size !== seen.length) return 'Invalid tips seen';
  return null;
}
