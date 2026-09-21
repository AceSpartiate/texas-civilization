// The guided start, on the screen (owner, 2026-09-21: "we need to have the tutorial be an integrated forced part of the
// game ... one task at a time, guided by the ui and unavoidable").
//
// **Nothing here decides that a step is done.** The lesson is the server's: it arrives on the projection as `world.lesson`
// and is replaced whole on every snapshot, and when the lesson is over the field is absent. This module only reads it - it
// has no memory, no timers and no "next" - so the one thing a page must never do (tell a student they have finished
// something the world has not seen) it cannot do.
//
//     world.lesson = {
//       step: 'arrive' | 'order' | 'house' | ... | 'done',
//       index: 3, of: 10,
//       title: 'Put somebody to work',
//       says: 'One sentence telling the student what to do next.',
//       did: 'What just happened, or null',
//       allow: ['chore:build-house'],   // every action id the student may take now
//       done: false,                    // when the lesson is over, `world.lesson` is absent entirely
//     }
//
// It imports nothing, so every rule it holds is tested headlessly (tests/lesson-screen.test.mjs) against the same shapes
// the server sends. What only a browser can show - the strip over the map, the ring round the one open icon, the rest of
// the bar plainly shut - is scripts/lesson-browser-proof.mjs.

/**
 * The lesson to draw, or null. A lesson that says it is done is no lesson, and neither is a missing one: the contract
 * says the field goes away at the end, and `done: true` is the same fact arriving a tick earlier.
 */
export function lessonShowing(world) {
  const lesson = world?.lesson;
  if (!lesson || lesson.done) return null;
  // The Host has no family and is given no lesson; a class where one is sent anyway is still not led by the hand.
  return world.role === 'host' ? null : lesson;
}

/**
 * Whether this lesson shuts anything at all.
 *
 * `allow` is "every action id the student may take now", so an **empty** list shuts everything - that is the step where
 * the only thing to do is wait for the wagon. A lesson with no `allow` **field** shuts nothing: that is a server older
 * than the contract, or one that has not decided, and a page that locks a student out on a guess is worse than a page
 * that lets them meet the server's own refusal.
 */
export const lessonLocks = lesson => Boolean(lesson) && Array.isArray(lesson.allow);

/** An icon's action in the lesson's own words: a chore is `chore:<id>`, everything else is the order it sends. */
export const actionIdOf = icon => (icon?.kind === 'chore' ? `chore:${icon.key}` : `order:${icon.key}`);

/**
 * Whether the lesson lets this icon be pressed now.
 *
 * The contract writes an id as `chore:build-house`; the orders that are not chores have no worked example in it, so all
 * three spellings a reasonable server would use are accepted - `order:rest`, `chore:rest` and the bare `rest`. Accepting
 * more than the server sends cannot open anything the server refuses: the server is the one that enforces `allow`, and
 * this only decides what the screen dims.
 */
export function allowsIcon(lesson, icon) {
  if (!lessonLocks(lesson) || !icon) return true;
  const key = icon.key;
  return lesson.allow.some(entry => entry === actionIdOf(icon) || entry === key || entry === `chore:${key}` || entry === `order:${key}`);
}

/** What a shut icon says when it is hovered, focused or pressed: never a scolding, always the one thing to do instead. */
export function lockedNote(lesson) {
  const says = String(lesson?.says || '').trim();
  return says ? `Not this yet. ${says}` : 'Not this yet.';
}

/**
 * The one icon the screen points at: the first of this person's icons that is open and that the lesson allows.
 *
 * Null when the lesson shuts nothing, and null when nothing on this row is both open and allowed - which is the step
 * whose work is somewhere else (a house plan, a place tapped on the map) or the step that is only waiting. The page never
 * invents a pointer at an icon the server has refused.
 */
export function pointedKey(lesson, icons = []) {
  if (!lessonLocks(lesson)) return null;
  return icons.find(icon => icon.can && allowsIcon(lesson, icon))?.key || null;
}

/**
 * The words of the strip over the map: where the student is, what the step is called, the one sentence of what to do, and
 * what just happened.
 *
 * `index` is written straight out rather than counted here, because counting it would be the page deciding how far along
 * a student is. ceiling: a server that numbers its steps from zero would say "step 0 of 10", which reads as broken to a
 * child, so a zero is shown as one; if the contract ever settles on zero-based, drop the clamp and add one instead.
 */
export function lessonWords(lesson) {
  if (!lesson) return null;
  const of = Number.isFinite(lesson.of) && lesson.of > 0 ? Math.round(lesson.of) : null;
  const at = Number.isFinite(lesson.index) ? Math.min(of ?? Infinity, Math.max(1, Math.round(lesson.index))) : null;
  return {
    step: lesson.step || '',
    eyebrow: at && of ? `STEP ${at} OF ${of}` : 'WHAT TO DO NEXT',
    title: String(lesson.title || '').trim(),
    says: String(lesson.says || '').trim(),
    did: String(lesson.did || '').trim(),
    at, of,
    // How far along, for the run of pips under the words. Nothing is decided by it; it is the two numbers the server sent.
    done: at && of ? Math.max(0, at - 1) : 0,
  };
}

/**
 * What the strip reads out to a screen reader, in one line, so somebody who cannot see the ring round the icon is told
 * the same thing in the same order: where they are, what to do, and what just happened.
 */
export function lessonAnnouncement(words) {
  if (!words) return '';
  return [words.eyebrow ? `${words.eyebrow}.` : '', words.title ? `${words.title}.` : '', words.says, words.did].filter(Boolean).join(' ');
}
