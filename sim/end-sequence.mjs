// The end of the game as a sequence the whole class goes through together (owner, 2026-09-29, the triage's D10):
//
//   "a flashback video plays from on the classview (unless solo play) showing key highlights from the adventure from the various
//    players points of view. once that's finished players see their own personalized video play on their screens. they see their
//    family return home, see what's left, begin to rebuild if necessary, ceremonially bury lost family members, and then the head
//    of household sits down to count up what they have left. once the last video finishes, the classview reveals the final
//    rankings and the players get to see on their screens a full breakdown of their scores."
//
// And, 2026-09-30, of the families' videos: "there shouldn't be a wait. the videos are supposed to autoplay."
//
// Three stages, and the server holds which one the class is at (`world.endSequence`); every page only follows it:
//
//   class   the class's own highlights video plays on the Host's screen (sim/class-flashback.mjs), made on the Host's computer
//           as the families' are; the students' screens say to watch the class screen. Not in Play Solo, which begins at
//           `family`. Over when the Host's page says the video has played to its end, when the teacher skips ahead, or - the
//           Host's page closed, the video never made - `CLASS_GRACE_MS` after it could have played through, or `CLASS_WAIT_MS`
//           after the stage began with no video made at all.
//   family  every family's own video starts by itself on its student's page **at the same moment** (`playAt`), and the stage
//           lasts as long as the longest of them and a little more (`endsAt`). Nothing waits for a page to say it has watched,
//           and a page that is closed holds nothing. `playAt` is set once the video of every family whose student's page is
//           open has been made - the Host's page makes them, two at a time, while the class video plays - never before the class
//           video has finished (the stage begins then) and never sooner than `START_MS` after the last was made, so each page has
//           its file loading before it plays (owner, 2026-09-30); or, a video never made, `MAKE_WAIT_MS` after the stage began,
//           with those made.
//   reveal  the Host's screen shows the final table and the winner, and each student's screen the full breakdown of the score
//           (sim/ending.mjs). Nothing of the final numbers is sent to any page before it (`endingProjection`).
//
// **Never while a class runs, and never between periods**: the sequence begins when the class ends for good (`flashbackReady`),
// in the same commit that ends it, whatever ends it - the last period's own end, whenever that falls (news-by-rider holds it until
// every family has heard of San Jacinto), or the teacher's End Game. A class taken up again (Continue) drops its sequence with its
// flashbacks. A server that keeps no videos (started without a save folder) goes straight to `reveal`.
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
/**
 * From every family's video being made to all of them starting together: time for the page of the family made last to fetch the
 * start of its file. A family's video is 4.3-4.6 MB for about 85 s (docs/FLASHBACK.md §7); a page plays once it has its first
 * keyframe cluster, well under half a megabyte, and the pages of families made earlier have been loading theirs since they were
 * made, so only the last few fetch at this moment. Eight seconds is that half megabyte for five pages at once at 2 Mbit/s each - a
 * busy school access point's share - with room over. ceiling: a class on a slow network can start a page late; it seeks to where
 * the class is, and the teacher can still skip ahead.
 */
export const START_MS = 8000;
/** After the longest video has played through, before the reveal: a video that stalled for loading ends in it. */
export const END_MS = 10000;
/** The longest the families' stage waits for videos still being made (a Host page closed, a video that failed). */
export const MAKE_WAIT_MS = 10 * 60000;

/** The class's sequence, or null. A class that ended before there was one is at the reveal (it was revealed when it ended). */
export function endSequenceOf(world) {
  if (!flashbackReady(world)) return null;
  return world.endSequence || { stage: 'reveal', since: 0, began: 0, before: true };
}
/** Whether the final numbers may be shown: no sequence, or a sequence at its reveal. */
export const revealed = world => !world?.endSequence || world.endSequence.stage === 'reveal';

/**
 * Begin the sequence as the class ends for good. `keeps`: whether this server keeps videos (without, there is none to play).
 * Returns whether it began. Idempotent: a class with a sequence keeps it.
 */
export function beginEndSequence(world, { now, solo = false, keeps = true }) {
  if (!flashbackReady(world) || world.endSequence) return false;
  world.endSequence = { stage: !keeps ? 'reveal' : solo ? 'family' : 'class', since: now, began: now, ...(solo && { solo: true }), ...(!keeps && { noVideos: true }) };
  return true;
}
/** Dropped with the ending it belonged to: a class taken up again (sim/periods.mjs `continueEnded`). */
export function dropEndSequence(world) { delete world.endSequence; }

const next = stage => STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(stage) + 1)];
function moveTo(sequence, stage, now) {
  sequence.stage = stage; sequence.since = now;
  delete sequence.classPlaying; delete sequence.playAt; delete sequence.endsAt; delete sequence.watched;
}

/**
 * Where each family a student plays stands in the families' stage: `away` (no page of it open: nothing waits for it), `making`
 * (its video is not made yet), `ready` (made, the stage not started), `playing` or `played`.
 * `facts.families`: `{ [householdId]: { here, made: { madeAt, durationMs } | null } }` for every family a student plays.
 */
export function familyStates(sequence, facts, now) {
  const out = {};
  for (const [id, fact] of Object.entries(facts.families || {})) {
    if (!fact.here) out[id] = 'away';
    else if (!fact.made) out[id] = 'making';
    else if (!Number.isFinite(sequence.playAt) || now < sequence.playAt) out[id] = 'ready';
    else out[id] = now >= sequence.playAt + fact.made.durationMs ? 'played' : 'playing';
  }
  return out;
}

/**
 * What the families' stage should become now: `{ playAt, endsAt }` once every family whose page is open has its video made (or
 * `MAKE_WAIT_MS` has gone by), null while it waits for them, or `{ reveal: true }` when it has run its length.
 */
function familyClock(sequence, facts, now) {
  if (Number.isFinite(sequence.endsAt)) return now >= sequence.endsAt ? { reveal: true } : null;
  const open = Object.values(facts.families || {}).filter(fact => fact.here);
  const made = open.filter(fact => fact.made);
  // No student's page open at all - a Play Solo player's page not yet come, every Chromebook between two connections - is not a
  // class to reveal to at once: it waits for a page as it waits for a video, `MAKE_WAIT_MS` at most (and the teacher can skip).
  if ((!open.length || made.length < open.length) && now < sequence.since + MAKE_WAIT_MS) return null;
  // Nothing made to play by then: nothing to wait for.
  if (!made.length) return { reveal: true };
  // The start (owner, 2026-09-30: "student videos don't start playing until after the class video finishes playing"): this stage
  // begins only when the class video has ended (the Host's page said so), run out its time, or been skipped by the teacher, so the
  // start is never before that; and never sooner than START_MS after the last of these videos was made, so its page has its first
  // seconds loaded. Videos made while the class video played have had their START_MS already: they start as it ends.
  const lastMade = Math.max(...made.map(fact => fact.made.madeAt || 0));
  const playAt = Math.max(now, lastMade + START_MS);
  return { playAt, endsAt: playAt + Math.max(...made.map(fact => fact.made.durationMs)) + END_MS };
}

/**
 * The change the class is due now, if any: `{ stage }` to move on, `{ playAt, endsAt }` to start the families' videos; null if it
 * stays. `facts`: `{ classVideo: { madeAt, durationMs } | null, families }` (above).
 */
export function dueChange(world, facts, now) {
  const sequence = world.endSequence;
  if (!sequence || !flashbackReady(world)) return null;
  if (sequence.stage === 'class') {
    const video = facts.classVideo;
    const from = Math.max(sequence.since, sequence.classPlaying || 0, video?.madeAt || 0);
    if (video && now >= from + video.durationMs + CLASS_GRACE_MS) return { stage: 'family' };
    if (!video && now >= sequence.since + CLASS_WAIT_MS) return { stage: 'family' };
    return null;
  }
  if (sequence.stage === 'family') {
    const clock = familyClock(sequence, facts, now);
    return clock?.reveal ? { stage: 'reveal' } : clock;
  }
  return null;
}
/** The stage the class should move on to now, or null (the families' clock starting is not a move). */
export const dueStage = (world, facts, now) => dueChange(world, facts, now)?.stage || null;
/** Make the change the class is due, if any. Returns it, or null. */
export function advanceEndSequence(world, facts, now) {
  const change = dueChange(world, facts, now);
  if (!change) return null;
  if (change.stage) moveTo(world.endSequence, change.stage, now);
  else Object.assign(world.endSequence, { playAt: change.playAt, endsAt: change.endsAt });
  // The families' stage may be due to start its clock the moment it begins (every video already made).
  if (change.stage === 'family') { const again = dueChange(world, facts, now); if (again && !again.stage) Object.assign(world.endSequence, again); }
  return change;
}

/**
 * What a page asks of the sequence (`POST /api/end-sequence`), checked and done, or refused with the reason:
 *   the Host: `skip` (on to the next stage now), `restart` (from the class video again; in Play Solo, from the family's own),
 *             `class-playing` (its page has begun playing the class video), `class-watched` (and played it to its end).
 *   In Play Solo the player is the class's Host as well (there is no teacher), so `skip` and `restart` are theirs too.
 * A student's page says nothing: the families' videos run on the server's clock (owner, 2026-09-30: "there shouldn't be a wait").
 */
export function endSequenceStep(world, { role, solo = false }, step, now) {
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
  } else throw new Error('Unknown step.');
  return sequence.stage;
}

/** The sequence is well formed, where present. */
export function endSequenceInvalid(world) {
  const sequence = world.endSequence;
  if (sequence === undefined) return null;
  if (!sequence || typeof sequence !== 'object' || !STAGES.includes(sequence.stage) || !Number.isFinite(sequence.since) || !Number.isFinite(sequence.began)) return 'Invalid end sequence';
  for (const key of ['classPlaying', 'playAt', 'endsAt']) if (sequence[key] !== undefined && !Number.isFinite(sequence[key])) return 'Invalid end sequence';
  if (Number.isFinite(sequence.playAt) !== Number.isFinite(sequence.endsAt) || sequence.endsAt < sequence.playAt) return 'Invalid end sequence';
  return null;
}

/**
 * What a page is told of the sequence: its stage and when it began; in the families' stage, when every video starts and when the
 * stage ends, as milliseconds from `now` (`playIn`, `endsIn`), so a page's own clock needs no agreement with the server's; and the
 * Host, where each family a student plays stands.
 */
export function endSequenceView(world, { role }, facts = null, now = 0) {
  const sequence = endSequenceOf(world);
  if (!sequence) return null;
  const base = { stage: sequence.stage, since: sequence.since, ...(sequence.noVideos && { noVideos: true }), ...(sequence.solo && { solo: true }),
    ...(Number.isFinite(sequence.playAt) && { playAt: sequence.playAt, playIn: sequence.playAt - now, endsIn: sequence.endsAt - now }) };
  if (role === 'host') {
    const states = facts && sequence.stage === 'family' ? familyStates(sequence, facts, now) : {};
    return { ...base, ...(sequence.classPlaying && { classPlaying: true }), families: Object.entries(states).map(([id, state]) => ({ householdId: id, state })) };
  }
  return base;
}
