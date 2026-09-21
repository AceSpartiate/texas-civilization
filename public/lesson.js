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

/**
 * The three icons that are one action to the server: Travel to Gonzales, Return home and Go to a neighbour's homestead all
 * send `travel` (`panelIcon` in public/app.js; `sim/lesson.mjs` `actionId`). They are on the lesson's `ALWAYS`, so a
 * student may wander mid-lesson, and a page that shut them would be stopping something the world permits.
 */
const JOURNEYS = new Set(['visit', 'travel-gonzales', 'travel-home']);

/**
 * An icon's action id, written exactly as the server writes it (`actionId` in sim/lesson.mjs): a chore is `chore:<id>`,
 * a journey is `travel` whichever of the three it is, and everything else is the order's own name.
 *
 * This has to agree with the server or the screen and the gate disagree, which is the one way a student meets a refusal
 * the screen did not show them. It read `order:<key>` until 2026-09-21, which matched nothing the server sends, so every
 * journey, the yard and rest were dimmed on every step although the server allows all of them throughout.
 */
export const actionIdOf = icon => {
  if (!icon) return '';
  if (icon.kind === 'chore') return `chore:${icon.key}`;
  if (icon.destination || icon.visit || JOURNEYS.has(icon.key)) return 'travel';
  return String(icon.key);
};

/**
 * Whether the lesson lets this icon be pressed now.
 *
 * The id the server matches on is `actionIdOf`. The bare key is accepted as well because `sim/lesson.mjs` writes some of
 * its own steps that way - `['survey-plot']`, `['clear-plot', 'fence-plot']`, `['hunt-land', 'chore:hunt-timber']` - and
 * a page that read those strictly would dim the very work the step is asking for. Accepting more than the server sends
 * can never open something the server refuses: the server enforces `allow`, and this only decides what the screen dims.
 */
export function allowsIcon(lesson, icon) {
  if (!lessonLocks(lesson) || !icon) return true;
  const key = icon.key;
  return lesson.allow.some(entry => entry === actionIdOf(icon) || entry === key || entry === `chore:${key}`);
}

/** What a shut icon says when it is hovered, focused or pressed: never a scolding, always the one thing to do instead. */
export function lockedNote(lesson) {
  const says = String(lesson?.says || '').trim();
  return says ? `Not this yet. ${says}` : 'Not this yet.';
}

/**
 * The one icon the screen points at: an available action serving the current objective.
 * Being allowed (for example resting or travelling home) does not make an action the objective.
 *
 * Null when the lesson shuts nothing, and null when nothing on this row is both open and allowed - which is the step
 * whose work is somewhere else (a house plan, a place tapped on the map) or the step that is only waiting. The page never
 * invents a pointer at an icon the server has refused.
 */
export function pointedKey(lesson, icons = []) {
  if (!lessonLocks(lesson)) return null;
  const priorities = {
    arrive: [], order: ['build-house', 'cut-lane', 'fetch-logs', 'fell-trees'],
    house: ['build-house', 'haul-logs', 'fetch-logs', 'fell-trees', 'cut-lane'],
    survey: ['survey-plot'], clear: ['clear-plot', 'fence-plot'],
    plant: ['plant-field', 'visit-shop'], harvest: ['harvest-field', 'fence-plot'],
    sell: ['sell-cotton', 'sell-food', 'visit-shop'], hunt: ['hunt-land', 'hunt-timber', 'visit-shop'],
    well: ['dig-well'],
  };
  const available = icons.filter(icon => icon.can && !icon.active && allowsIcon(lesson, icon));
  for (const key of priorities[lesson.step] || []) if (available.some(icon => icon.key === key)) return key;
  // Nothing on this row is this step's own work. One open action is unambiguous and is pointed at; several are not, and
  // choosing the first of them is exactly the fault this ranking was written to remove. It came back here on 2026-09-21:
  // at `order`, where every chore is allowed and none of the house work can begin until a plan is chosen, the ring sat
  // on the survey stake - step four's job - while the words above it said to choose a house plan. Two instructions at
  // once, and the ring is the one a student follows.
  return available.length === 1 ? available[0].key : null;
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
