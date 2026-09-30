// The end of the game as a sequence the whole class goes through together (owner, 2026-09-29, the triage's D10):
//
//   "a flashback video plays from on the classview (unless solo play) showing key highlights from the adventure from the various
//    players points of view. once that's finished players see their own personalized video play on their screens. they see their
//    family return home, see what's left, begin to rebuild if necessary, ceremonially bury lost family members, and then the head
//    of household sits down to count up what they have left. once the last video finishes, the classview reveals the final
//    rankings and the players get to see on their screens a full breakdown of their scores."
//
// Three stages, and the server holds which one the class is at (`world.endSequence`); every page only follows it:
//
//   class   the class's own highlights video plays on the Host's screen (sim/class-flashback.mjs), made on the Host's computer
//           as the families' are; the students' screens say to watch the class screen. Not in Play Solo, which begins at
//           `family`. Over when the Host's page says the video has played to its end, when the teacher skips ahead, or - the
//           Host's page closed, the video never made - `CLASS_GRACE_MS` after it could have played through, or `CLASS_WAIT_MS`
//           after the stage began with no video made at all.
//   family  each student's own video plays on their own screen (sim/flashback.mjs, with the homecoming epilogue). Over when every
//           family a student is playing is done: its page said its video played to its end, or no page of it is open (a student
//           absent or gone), or its video has had its length and `FAMILY_GRACE_MS` more since it could first play; and at the
//           latest `FAMILY_STAGE_MS` after the stage began, or when the teacher skips ahead.
//   reveal  the Host's screen shows the final table and the winner, and each student's screen the full breakdown of the score
//           (sim/ending.mjs). Nothing of the final numbers is sent to any page before it (`endingProjection`).
//
// **Never while a class runs, and never between periods**: the sequence begins when the class ends for good (`flashbackReady`),
// in the same commit that ends it, whatever ends it - the last period's own end, whenever that falls (a later change may hold
// the end until every family has heard of San Jacinto), or the teacher's End Game. A class taken up again (Continue) drops its
// sequence with its flashbacks. A server that keeps no videos (started without a save folder) goes straight to `reveal`.
//
// Times here are the server's wall clock in milliseconds (`now`), as the tutorial's resume window is: the sequence is watched
// in real time, while the world's own clock stands still at the end. A class saved before this, already ended, opens at
// `reveal` - it was revealed when it ended - and no save version moves (`endSequenceOf`).
import { flashbackReady } from './flashback.mjs';

export const STAGES = Object.freeze(['class', 'family', 'reveal']);
/** How long past the class video's own length the class waits for the Host's page to say it has finished. */
export const CLASS_GRACE_MS = 60000;
/** How long the class waits for a class video that is never made: no Host page open to make it. */
export const CLASS_WAIT_MS = 10 * 60000;
/** How long past a family's video's own length the class waits for that student's page to say it has finished. */
export const FAMILY_GRACE_MS = 60000;
/** The longest the families' stage lasts, whatever is still being made or watched. */
export const FAMILY_STAGE_MS = 20 * 60000;

/** The class's sequence, or null. A class that ended before there was one is at the reveal (it was revealed when it ended). */
export function endSequenceOf(world) {
  if (!flashbackReady(world)) return null;
  return world.endSequence || { stage: 'reveal', since: 0, began: 0, watched: {}, before: true };
}
/** Whether the final numbers may be shown: no sequence, or a sequence at its reveal. */
export const revealed = world => !world?.endSequence || world.endSequence.stage === 'reveal';

/**
 * Begin the sequence as the class ends for good. `keeps`: whether this server keeps videos (without, there is none to play).
 * Returns whether it began. Idempotent: a class with a sequence keeps it.
 */
export function beginEndSequence(world, { now, solo = false, keeps = true }) {
  if (!flashbackReady(world) || world.endSequence) return false;
  world.endSequence = { stage: !keeps ? 'reveal' : solo ? 'family' : 'class', since: now, began: now, watched: {}, ...(solo && { solo: true }), ...(!keeps && { noVideos: true }) };
  return true;
}
/** Dropped with the ending it belonged to: a class taken up again (sim/periods.mjs `continueEnded`). */
export function dropEndSequence(world) { delete world.endSequence; }

const next = stage => STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(stage) + 1)];
function moveTo(sequence, stage, now) {
  sequence.stage = stage; sequence.since = now;
  if (stage !== 'class') delete sequence.classPlaying;
  if (stage === 'class') { sequence.watched = {}; }
  if (stage === 'family') sequence.watched = {};
}

/**
 * Where each family a student plays stands in the families' stage: `watched`, `away` (no page of it open), `timed` (its video
 * has had its length and the grace), `waiting` (its video is not made yet) or `watching`.
 * `facts.families`: `{ [householdId]: { here, made: { madeAt, durationMs } | null } }` for every family a student plays.
 */
export function familyStates(sequence, facts, now) {
  const out = {};
  for (const [id, fact] of Object.entries(facts.families || {})) {
    if (sequence.watched?.[id]) out[id] = 'watched';
    else if (!fact.here) out[id] = 'away';
    else if (fact.made && now >= Math.max(fact.made.madeAt || 0, sequence.since) + (fact.made.durationMs || 0) + FAMILY_GRACE_MS) out[id] = 'timed';
    else out[id] = fact.made ? 'watching' : 'waiting';
  }
  return out;
}
const DONE = new Set(['watched', 'away', 'timed']);

/**
 * The stage the class should be at now, if it should move on; null if it stays. `facts`: `{ classVideo: { madeAt, durationMs } |
 * null, families }` (above).
 */
export function dueStage(world, facts, now) {
  const sequence = world.endSequence;
  if (!sequence || !flashbackReady(world)) return null;
  if (sequence.stage === 'class') {
    const video = facts.classVideo;
    const from = Math.max(sequence.since, sequence.classPlaying || 0, video?.madeAt || 0);
    if (video && now >= from + video.durationMs + CLASS_GRACE_MS) return 'family';
    if (!video && now >= sequence.since + CLASS_WAIT_MS) return 'family';
    return null;
  }
  if (sequence.stage === 'family') {
    if (now >= sequence.since + FAMILY_STAGE_MS) return 'reveal';
    const states = Object.values(familyStates(sequence, facts, now));
    return states.every(state => DONE.has(state)) ? 'reveal' : null;
  }
  return null;
}
/** Move the class on if it is due. Returns the stage it moved to, or null. */
export function advanceEndSequence(world, facts, now) {
  const to = dueStage(world, facts, now);
  if (to) moveTo(world.endSequence, to, now);
  return to;
}

/**
 * What a page asks of the sequence (`POST /api/end-sequence`), checked and done, or refused with the reason:
 *   the Host: `skip` (on to the next stage now), `restart` (from the class video again; in Play Solo, from the family's own),
 *             `class-playing` (its page has begun playing the class video), `class-watched` (and played it to its end);
 *   a family: `watched` (its page has played the family's own video to its end). In Play Solo the player is the class's Host
 *             as well (there is no teacher), so `skip` and `restart` are theirs too.
 */
export function endSequenceStep(world, { role, householdId = null, solo = false }, step, now) {
  const sequence = world.endSequence;
  if (!sequence || !flashbackReady(world)) throw new Error('The class has not ended.');
  const host = role === 'host' || solo;
  if (step === 'skip') {
    if (!host) throw new Error('Only the teacher moves the class on.');
    if (sequence.stage === 'reveal') return sequence.stage;
    moveTo(sequence, next(sequence.stage), now);
  } else if (step === 'restart') {
    if (!host) throw new Error('Only the teacher starts the ending again.');
    if (sequence.noVideos) throw new Error('This server keeps no videos to play again.');
    moveTo(sequence, sequence.solo ? 'family' : 'class', now);
  } else if (step === 'class-playing') {
    if (role !== 'host') throw new Error('Only the teacher\'s screen plays the class video.');
    if (sequence.stage === 'class') sequence.classPlaying = now;
  } else if (step === 'class-watched') {
    if (role !== 'host') throw new Error('Only the teacher\'s screen plays the class video.');
    if (sequence.stage === 'class') moveTo(sequence, 'family', now);
  } else if (step === 'watched') {
    if (!householdId || !world.households[householdId]) throw new Error('Only a family watches its own video.');
    if (sequence.stage === 'family') sequence.watched = { ...(sequence.watched || {}), [householdId]: now };
  } else throw new Error('Unknown step.');
  return sequence.stage;
}

/** The sequence is well formed, where present. */
export function endSequenceInvalid(world) {
  const sequence = world.endSequence;
  if (sequence === undefined) return null;
  if (!sequence || typeof sequence !== 'object' || !STAGES.includes(sequence.stage) || !Number.isFinite(sequence.since) || !Number.isFinite(sequence.began)) return 'Invalid end sequence';
  if (!sequence.watched || typeof sequence.watched !== 'object' || Object.entries(sequence.watched).some(([id, at]) => !world.households[id] || !Number.isFinite(at))) return 'Invalid end sequence';
  if (sequence.classPlaying !== undefined && !Number.isFinite(sequence.classPlaying)) return 'Invalid end sequence';
  return null;
}

/**
 * What a page is told of the sequence: its stage, and when it began (for the page to say how long it has been), and - the Host
 * - where each family a student plays stands; a family, whether it has said its own video has played.
 */
export function endSequenceView(world, { role, householdId = null }, facts = null, now = 0) {
  const sequence = endSequenceOf(world);
  if (!sequence) return null;
  // `since`: when this stage began, so a page tells a stage played again from the last time it was here.
  const base = { stage: sequence.stage, since: sequence.since, ...(sequence.noVideos && { noVideos: true }), ...(sequence.solo && { solo: true }) };
  if (role === 'host') {
    const states = facts && sequence.stage === 'family' ? familyStates(sequence, facts, now) : {};
    return { ...base, ...(sequence.classPlaying && { classPlaying: true }), families: Object.entries(states).map(([id, state]) => ({ householdId: id, state })) };
  }
  return { ...base, ...(householdId && sequence.watched?.[householdId] && { watched: true }) };
}
