// A child's day when nobody is telling them what to do (owner, 2026-09-26; docs/CHILDREN.md §3 to §5).
//
// "if they're idle they should find the nearest 0arent and engage them in an automated conversation. this conversation stops the
// parent from doing their task until the kid is given a new task. yes, kids should be able to be automated. no, it shouldn't go
// forever. kids disobey sometimes. sometimes they should randomly turn off their automation feature."
//
// Four things live here, run once a tick after the chores (sim/world.mjs `stepWorld`):
//
//   1. **Play is drawn** - every child at play is moved about the yard by the kind of play it is (sim/children.mjs `playStep`).
//   2. **Obedience at work** - a child at a job may wander off to play instead, every tick they are at it (sim/obedience.mjs).
//   3. **A child's own automation**, which does not go on for ever - it lasts until the day ends (owner, 2026-09-29;
//      sim/child-day.mjs) - and which the child may switch off themself (`tiresOfAuto`). Either way the family is told, in the
//      record and on the child's row, and an "!" stands on the child's row until they are given something to do.
//   4. **The idle child** - a child of two to nine at home with nothing to do goes to the nearest parent and talks, and that
//      parent's work stands still (sim/aside.mjs) until the child is given something to do (`advanceTalks`).
//
// Everything here is the game's own (`FIC-GONZ-476` to `-481`) and every line a child or a parent says is RECONSTRUCTED: childlike,
// of the period, never a word put in a historical person's mouth. Nothing is stored that an old save lacks a correct empty value
// for - no talk, no automation, not idle - so **no save version moved**.
import { CHORES, beginChore, choresFor } from './chores.mjs';
import { record } from './events.mjs';
import { SENT_FROM_AGE, listWords, sexOf, tooYoung } from './family.mjs';
import { calendarMinutes, dateOf } from './clock.mjs';
import { BABY_UNDER } from './furniture.mjs';
import { stirredShare } from './shares.mjs';
import { PLAY_KINDS, childWorks, isPlay, playStep } from './children.mjs';
import { inLesson } from './lesson.mjs';
import { isJob, jobWords, tiresOfAuto, wandersOff } from './obedience.mjs';
import { dayBegun, dayInvalid, dayOver } from './child-day.mjs';

const GONE = Object.freeze(['dead', 'captured']);
const r4 = value => Math.round(value * 10000) / 10000;
const tell = (world, household, entity, text, extra = {}) => record(world, 'consequence', {
  actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-476', text, ...extra,
});

/** A child the talk and the automation are about: two to nine, with works of their own (sim/children.mjs). */
export const isSmallChild = entity => entity?.kind === 'person' && Number.isFinite(entity.age) && entity.age >= BABY_UNDER && entity.age < SENT_FROM_AGE;
/** The waking day, in hours of the clock: nobody goes looking for a parent in the dark (`FIC-GONZ-476`). */
export const WAKING_HOURS = Object.freeze([6, 21]);
export const awake = world => { const hour = dateOf(world, world.minute).getUTCHours(); return hour >= WAKING_HOURS[0] && hour < WAKING_HOURS[1]; };

// ------------------------------------------------------------------------------------------------ a child's own automation

/*
 * How long a child's automation lasts before it goes off by itself (`FIC-GONZ-480`): **until the day ends** (owner, 2026-09-29, by
 * multiple choice on the triage's D2, "Until the day ends"; sim/child-day.mjs `dayOver`, never sooner than `DAY_FLOOR_TICKS`). The
 * owner's "no, it shouldn't go forever" stands: it ends with the day, and the child may still switch it off themself before
 * (`tiresOfAuto`, their hidden roll). Until 2026-09-29 it lasted eighteen ticks at a roll of 1 to fifty-six at a 20 - three to
 * nine minutes of a lesson - which with a family of children was an order every minute or so (playthrough audit #9).
 */
/**
 * How long the notice that a child's automation went off stays on their row, in ticks. The record keeps it for good, and the "!"
 * stays on the row until the child is given something to do (`autoOffAsking`).
 */
export const NOTICE_TICKS = 6;
/**
 * Whether this child's automation has gone off and they have been given nothing since: the "!" on their row (owner, 2026-09-29:
 * "an '!' appears on the family panel when a child's auto goes off"; public/family-panel.js `needsOf`, kind `child`). It goes the
 * moment they are given something to do - a work, play, or their automation again (`released`, `setChildAuto`) - and never says
 * how long it had lasted. A job or a spell of play the automation had begun is finished all the same; the "!" is up meanwhile,
 * because nothing will follow it, and play the child takes up alone for want of anybody at home does not put it away.
 */
export const autoOffAsking = entity => Boolean(entity?.autoNotice) && isSmallChild(entity) && !entity.auto && !GONE.includes(entity.health?.condition);

/**
 * A child put on their own automation, or taken off it (sim/world.mjs routes `set-auto` for somebody under ten here). What a child
 * on auto does is find themself things to do - the jobs they are old enough for when there are any, play between - and it lasts
 * until the day ends (owner, 2026-09-29). The child may tire of it sooner by their hidden roll (`tiresOfAuto`), which is never
 * shown: a child's row says what they are doing, never how long they will keep at it.
 */
export function setChildAuto(world, household, entity, on) {
  if (!isSmallChild(entity)) throw new Error(`${entity.name} is too small to decide anything for themself.`);
  const wanted = Boolean(on);
  if (Boolean(entity.auto) === wanted) return;
  delete entity.autoNotice;
  if (wanted) {
    entity.auto = true;
    entity.childAuto = { ...dayBegun(world), picks: 0 };
    // Given something to do, as the idle rule is written: a child who was talking goes off to it, and the grown-up back to theirs.
    released(world, entity);
  } else { delete entity.auto; delete entity.childAuto; }
  record(world, 'choice', {
    actorId: entity.id, householdId: household.id, importance: 1, decision: wanted ? 'auto-on' : 'auto-off', claimId: 'FIC-GONZ-480',
    text: wanted ? `${entity.name} will find themself things to do for a while: the jobs they are big enough for, and play between.` : `${entity.name} will be told what to do again.`,
  });
}

/** The automation goes off by itself: its time is up, or the child has switched it off. Said in the record and on the row. */
function autoOff(world, household, entity, why) {
  delete entity.auto; delete entity.childAuto;
  entity.autoNotice = { tick: world.tick, why };
  tell(world, household, entity, why === 'time'
    ? `${entity.name} has been good for as long as a child can be, and has stopped finding themself things to do: their automation is off.`
    : `${entity.name} has decided they have done enough, and gone their own way: their automation is off.`, { claimId: why === 'time' ? 'FIC-GONZ-480' : 'FIC-GONZ-479' });
}

/** The jobs a child on auto takes up first, most useful first; play goes between them. */
// Milking the cow after the eggs (owner, 2026-10-02: "make it a chore that kids can do"; sim/milking.mjs).
// Minding the hogs after the milking (owner, 2026-10-03; sim/stock.mjs `HOGS_FROM_AGE`): a child of seven on auto minds them once a day.
// Keeping house and the wash first, where they are the child's to do (owner, 2026-10-04, "Children keep house"; sim/custom.mjs
// `childKeeps`): a child of seven on auto keeps house with no grown woman at home (owner, 2026-10-05), and does the wash when it is wanted.
const JOBS_FIRST = Object.freeze(['keep-house', 'wash-clothes', 'child-eggs', 'milk-cow', 'look-to-stock', 'child-water', 'child-mind', 'child-kindling', 'child-birds', 'child-hens']);

/** What a child on auto takes up now: every other time a job they can do, and play between; play if there is no job. */
function autoPick(world, household, entity) {
  const open = new Set(choresFor(world, household, entity).filter(entry => entry.can).map(entry => entry.id));
  const plan = entity.childAuto;
  const job = JOBS_FIRST.find(id => open.has(id));
  const playNext = plan.picks % 2 === 1 || !job;
  plan.picks++;
  if (!playNext) return job;
  const plays = Object.keys(PLAY_KINDS).filter(id => open.has(id));
  if (!plays.length) return open.has('child-play') ? 'child-play' : null;
  return plays[Math.floor(stirredShare(world, entity.id, `auto-play:${world.tick}`) * plays.length) % plays.length];
}

/** Every tick for a child on auto: off when its time is up or the child tires of it, and otherwise something to do when free. */
function advanceChildAuto(world, household, entity, travel) {
  if (!entity.auto || !isSmallChild(entity)) return;
  if (GONE.includes(entity.health?.condition)) { delete entity.auto; delete entity.childAuto; return; }
  // A child's automation from a save made before it had a length, or before it lasted the day (a tick count, `until`), is timed
  // from the tick it is first seen: until that day ends.
  if (!Number.isInteger(entity.childAuto?.day)) entity.childAuto = { ...dayBegun(world), picks: entity.childAuto?.picks ?? 0 };
  if (dayOver(world, entity.childAuto)) return autoOff(world, household, entity, 'time');
  if (tiresOfAuto(world, entity)) return autoOff(world, household, entity, 'child');
  if (entity.chore || entity.travel || entity.location?.siteId !== household.homeSiteId || household.flight && household.flight.status !== 'home' && household.flight.status !== 'ordered' && household.flight.status !== 'stayed') return;
  const id = autoPick(world, household, entity);
  if (!id) return;
  // Play between jobs is a spell of its old couple of hours (`spell`, sim/chores.mjs): the automation is what lasts the day.
  try { beginChore(world, household, entity, id, travel, undefined, { spell: true }); } catch { /* refused this tick: asked again the next */ }
}

// ------------------------------------------------------------------------------------------------ wandering off from a job

/** Every tick for a child at a job: whether they wander off, and what they are then seen doing instead. */
function wanderFromJob(world, household, entity, travel) {
  const chore = CHORES[entity.chore?.id];
  if (!isJob(chore) || entity.chore.dawdle || !isSmallChild(entity) || !wandersOff(world, entity)) return;
  const was = jobWords(chore, entity.chore);
  // On the road east there is nowhere to go off to: the job is left off, and the child is back with the family.
  if (chore.road || entity.travel || entity.location?.siteId !== household.homeSiteId) {
    entity.chore = null;
    if (entity.task === 'work') entity.task = entity.travel ? 'travel' : 'rest';
    tell(world, household, entity, `${entity.name} ran off after something along the road instead of ${was}, and is back with the family now.`, { claimId: 'FIC-GONZ-479' });
    return;
  }
  const plays = Object.keys(PLAY_KINDS).filter(id => childWorks(entity).includes(id));
  const kind = plays[Math.floor(stirredShare(world, entity.id, `wander-to:${world.tick}`) * plays.length) % plays.length] || 'child-play';
  entity.chore = null;
  entity.task = 'rest';
  // A spell of play, not the rest of the day: the child ran off from a job, and is to be found at it and set to it again.
  try { beginChore(world, household, entity, kind, travel, undefined, { spell: true }); } catch { /* nothing to go off to: they simply stop */ }
  tell(world, household, entity, `${entity.name} has wandered off ${PLAY_KINDS[kind]?.away || 'to play'} instead of ${was}.`, { claimId: 'FIC-GONZ-479' });
}

// ------------------------------------------------------------------------------------------------ the idle child

/** An hour's grace: how many ticks a child stands with nothing to do before going to find somebody (`FIC-GONZ-476`). */
export const IDLE_TICKS = 2;
/**
 * The slowest calendar a child stops a parent on: an hour a tick, as for a crying baby (sim/babies.mjs `COMFORT_SCALE`). On the
 * real land's faster phases a tick is four or twelve hours of 1835, and a child at the elbow would stop a parent for half a day at a
 * time - a time sink the owner ruled out - and fill the family's journal besides.
 */
export const TALK_SCALE = 60;
/**
 * Whether this is the first time today this person's `kind` of news goes into the family's record, and marks it so. What the
 * little ones do is on the rows and over their heads every tick; the journal hears of each thing once a day (`told`).
 */
export function firstToday(world, entity, kind) {
  const day = Math.floor(world.minute / 1440);
  if (entity.told?.[kind] === day) return false;
  entity.told = { ...(entity.told || {}), [kind]: day };
  return true;
}
/** How far from the grown-up the child stands to talk: a few feet, on the side they came from. */
const BESIDE = 0.004;

const present = (household, person) => person && !GONE.includes(person.health?.condition) && !person.travel && person.location?.siteId === household.homeSiteId
  && person.service?.status !== 'serving';
/** Whether this child is somebody the talk is about right now: small, at home, awake to it, and with nothing whatever to do. */
function idleChild(world, household, child) {
  return isSmallChild(child) && present(household, child) && !child.chore && !child.auto && !child.carriedBy && !child.shelter;
}
/**
 * Somebody nursing the sick (sim/disease.mjs `nurse-home`, sim/road.mjs `tend-sick`): a child with nothing to do does not call them
 * aside, nor keeps them once they have begun (triage 2026-09-29, 3.13; design audit M31). The "!" that sent them asks for exactly
 * that nursing, and a child at the elbow stood its days still with nothing on the row to say why.
 */
const nursing = person => Boolean(person.chore && CHORES[person.chore.id]?.nurses);
/** Who a child with nothing to do goes to: the nearest parent at home, else the nearest of the family old enough to work. */
export function talkTarget(world, household, child) {
  const here = child.location;
  const candidates = household.members.map(id => world.entities[id])
    // Not somebody too sick to get up or lying wounded (interactions S6, 2026-09-28): a child with nothing to do does not come to stop
    // their rest, and goes to the next nearest, or plays by themself.
    .filter(person => person && person.id !== child.id && present(household, person) && !tooYoung(person) && person.aside?.kind !== 'baby'
      && !person.health?.grave && person.health?.condition !== 'wounded' && !nursing(person));
  const dist = person => Math.hypot(person.location.x - here.x, person.location.y - here.y);
  const nearest = list => list.sort((a, b) => dist(a) - dist(b) || a.id.localeCompare(b.id))[0] || null;
  return nearest(candidates.filter(person => (child.kin?.parents || []).includes(person.id))) || nearest(candidates);
}

/** A conversation ends: the child goes, and when no child is left talking with them the grown-up goes back to exactly what they were at. */
export function endTalk(world, child, words = null) {
  const talk = child.talk;
  if (!talk) return;
  delete child.talk;
  const grown = world.entities[talk.withId];
  if (grown?.aside?.kind === 'talk') {
    grown.aside.childIds = (grown.aside.childIds || []).filter(id => id !== child.id);
    if (!grown.aside.childIds.length) delete grown.aside;
  }
  const household = world.households[child.householdId];
  if (words && household) tell(world, household, child, words, { importance: 1, ambient: true });
}

/**
 * The child has been given something to do: the talk ends there and then, and the grown-up goes back to exactly what they were at.
 * Called the moment the order is given (sim/world.mjs, `setChildAuto`) as well as on the tick, because a job of one tick - the
 * hens - can be begun and finished between two ticks, and a parent must not be left standing by a child who is already busy.
 */
export function released(world, child) {
  // Given something to do: the "!" of an automation gone off goes with it (owner, 2026-09-29; `autoOffAsking`).
  if (child?.autoNotice) delete child.autoNotice;
  if (!child?.talk) return;
  const grown = world.entities[child.talk.withId];
  endTalk(world, child, firstToday(world, child, 'free') ? `${child.name} has something to do now, and ${grown?.name || 'the family'} goes back to ${grown ? workOf(grown) : 'work'}.` : null);
  delete child.idleSince;
}
/** The grown-up's work, in a few words, for a line: "planting", "the work about the place", "resting". */
const workOf = grown => (grown.chore ? (CHORES[grown.chore.id]?.name || 'the work').toLowerCase() : grown.task === 'work' ? 'the work about the place' : 'resting');

/**
 * Every tick, for a family somebody plays: children with nothing to do go to the nearest parent and talk, and the parent stops;
 * a child given something to do goes to it and the parent goes back to theirs. The rule, in the order it is applied:
 *
 *   - **Who.** A child of two to nine, alive and at home, with no work, not on their own automation and not carried. Never an
 *     infant (sim/babies.mjs has them), never a child away from home - the road east has work of its own for them.
 *   - **When.** After `IDLE_TICKS` of nothing, in the waking day, and not while the family is being walked through its guided
 *     start (sim/lesson.mjs `inLesson`), nor in a family nobody plays or whose student has gone: nobody could give that child
 *     anything, and the parent would stand for the rest of the class.
 *   - **To whom.** The nearest parent at home; with no parent at home, the nearest of the family old enough for its work (ten or
 *     more: an elder brother or sister, a grown son). With nobody at home at all, the child goes off and plays by themself.
 *   - **What happens.** The child walks over (one tick, drawn walking) and talks (drawn talking, with words over both); from the
 *     tick they arrive the grown-up's work stands exactly where it is (sim/aside.mjs) and their row says why.
 *   - **How it ends.** Only when the child is given something to do - by the student, or by the child's own automation - or when
 *     something the world does takes one of them away: a journey, the army, a death, the family's flight, or a baby who needs
 *     holding (sim/babies.mjs). The child then goes back to waiting, and may come again.
 */
export function advanceTalks(world, household, travel) {
  const members = household.members.map(id => world.entities[id]).filter(Boolean);
  const going = {}, arrived = {};
  const quiet = !household.played || household.absent || world.status !== 'running' || inLesson(world, household) || !awake(world) || calendarMinutes(world) > TALK_SCALE
    || (household.flight && !['ordered', 'stayed', 'home'].includes(household.flight.status)) || household.arriving;
  for (const child of members) {
    if (child.talk) {
      const grown = world.entities[child.talk.withId];
      // Given something to do: they go to it, and the grown-up goes back to theirs.
      if (child.chore || child.auto) { released(world, child); continue; }
      if (!idleChild(world, household, child) || !present(household, grown) || grown.aside?.kind === 'baby' || nursing(grown) || quiet) {
        endTalk(world, child, grown && !present(household, grown) && firstToday(world, child, 'free') ? `${grown.name} had to go, and ${child.name} is left with nothing to do.` : null);
        child.idleSince = world.tick;
        continue;
      }
      if (child.talk.phase === 'going') {
        child.talk.phase = 'talking';
        child.talk.from = world.tick;
        const first = grown.aside?.kind !== 'talk';
        grown.aside = first ? { kind: 'talk', childIds: [child.id] } : { ...grown.aside, childIds: [...new Set([...grown.aside.childIds, child.id])] };
        (arrived[grown.id] ??= { grown, first, children: [] }).children.push(child);
      }
      stand(child, grown);
      continue;
    }
    if (quiet || !idleChild(world, household, child)) { delete child.idleSince; continue; }
    if (!Number.isInteger(child.idleSince)) { child.idleSince = world.tick; continue; }
    if (world.tick - child.idleSince < IDLE_TICKS) continue;
    const grown = talkTarget(world, household, child);
    delete child.idleSince;
    if (!grown) {
      // Nobody at home old enough to go to: the child finds their own play, and says nothing of it to anybody.
      try { beginChore(world, household, child, 'child-play', travel); } catch { continue; }
      if (firstToday(world, child, 'alone')) tell(world, household, child, `With nobody at home to go to, ${child.name} went off to play by themself.`, { importance: 1, ambient: true });
      continue;
    }
    child.talk = { withId: grown.id, phase: 'going', since: world.tick };
    stand(child, grown);
    (going[grown.id] ??= { grown, children: [] }).children.push(child);
  }
  // Said once for everybody who went or arrived this tick, not once a child: four children at the mother's skirts are one line.
  // And said in the family's record once a day for each child and each grown-up (`firstToday`): the row and the bubbles say it
  // every time, and a journal of the same child going to the same parent all afternoon would push out what the family must read.
  for (const { grown, children: all } of Object.values(going)) {
    const children = all.filter(child => firstToday(world, child, 'talk'));
    if (!children.length) continue;
    tell(world, household, children[0], `${listWords(children.map(one => one.name))} ${children.length > 1 ? 'have' : 'has'} nothing to do, and ${children.length > 1 ? 'have' : 'has'} gone to find ${grown.name}.`, { importance: 1, ambient: true });
  }
  for (const { grown, first, children } of Object.values(arrived)) {
    if (!firstToday(world, grown, 'stop')) continue;
    const names = listWords(children.map(one => one.name)), many = children.length > 1;
    tell(world, household, grown, first
      ? `${grown.name} has stopped ${workOf(grown)} to talk with ${names}, who ${many ? 'have' : 'has'} nothing to do. Give ${many ? 'them' : names} something to do and ${grown.name} goes back to it.`
      : `${names} ${many ? 'have' : 'has'} come to talk with ${grown.name} as well.`, { claimId: 'FIC-GONZ-477', ambient: true });
  }
}

/** The child stands beside the grown-up, on the side they came from, so the two are drawn face to face. */
function stand(child, grown) {
  const dx = child.location.x - grown.location.x, dy = child.location.y - grown.location.y, far = Math.hypot(dx, dy);
  const ux = far > 1e-6 ? dx / far : 1, uy = far > 1e-6 ? dy / far : 0;
  child.location = { x: r4(grown.location.x + ux * BESIDE), y: r4(grown.location.y + uy * BESIDE), siteId: grown.location.siteId };
}

// ------------------------------------------------------------------------------------------------ what is said

/**
 * What a child with nothing to do says, and what the grown-up says back: RECONSTRUCTED (`FIC-GONZ-481`). Childlike and of the
 * frontier - the hens, the creek, a snake at the woodpile, supper, the country they came from - and never a word from any
 * historical person. `{p}` is what the child calls the one they are talking to.
 */
export const CHILD_SAYS = Object.freeze([
  '{p}, there is nothing to do.', '{p}, can I help? I can carry things.', 'I saw a snake by the woodpile. A big one.',
  'When are we going to town?', 'Tell me about where we lived before.', 'Is it supper yet? I am hungry.',
  'Watch me, {p}! Watch this!', 'The red hen will not let me catch her.', 'Can I go down to the creek?',
  'What is that bird? The one that sings all the songs.', 'I found a pretty rock. You can have it.', 'Why is the grass so tall here?',
  'Are there bears in the timber?', 'My feet are cold.', 'Can I have the ox for my own?', 'Sing the one about the river, {p}.',
  'I counted the chickens. There are eleven. Or twelve.', 'Where does the wind come from?', 'I am not tired. I am not.',
  'When will the corn be as tall as me?',
]);
export const GROWN_SAYS = Object.freeze([
  'Then find yourself something useful, child.', 'Hush now, I am working.', 'Go and see if the hens have laid.',
  'Later, when the work is done.', 'Stay away from that creek, you hear?', 'That is a mockingbird.', 'Stay clear of that woodpile.',
  'Supper when the sun is down, and not before.', 'I am watching. Now let me be.', 'Leave that hen alone.',
  'Go and play, and keep where I can see you.', 'Ask me again when this is done.', 'The wind comes from the Gulf, I expect.',
  'Put your feet by the fire, then.', 'Not the ox. The ox is working.', 'You will be taller than the corn by harvest.',
]);
/** What a child calls a parent: Ma or Mama or Mamá, Pa or Papa or Papá, one of the three a child's own, kept. */
const CALLS = Object.freeze({ female: Object.freeze(['Ma', 'Mama', 'Mamá']), male: Object.freeze(['Pa', 'Papa', 'Papá']) });
function calledBy(world, child, grown) {
  if (!(child.kin?.parents || []).includes(grown.id)) return grown.given || String(grown.name || '').split(' ')[0] || 'you';
  const words = CALLS[sexOf(grown) || 'male'];
  return words[Math.floor(stirredShare(world, child.id, 'calls') * words.length) % words.length];
}
const pick = (world, id, key, list) => list[Math.floor(stirredShare(world, id, key) * list.length) % list.length];

/**
 * The words over the family's talkers this tick, for its own page only (the Host and the neighbours see two people standing
 * together, and no words): one line from the child and one from the grown-up, changing each tick, in the shape the page's
 * bubbles take (public/speech.js). RECONSTRUCTED, so the bubble's edge is dashed.
 */
export function talkLines(world, household) {
  const lines = [];
  // Two children at most speak to one grown-up on a tick, in turn, so four at the mother's skirts are not eight bubbles at once.
  const turns = {};
  for (const id of household.members) { const child = world.entities[id]; if (child?.talk?.phase === 'talking') (turns[child.talk.withId] ??= []).push(child.id); }
  const speaking = new Set(Object.values(turns).flatMap(ids => (ids.length <= 2 ? ids : [0, 1].map(k => ids[(world.tick + k) % ids.length]))));
  for (const id of household.members) {
    const child = world.entities[id];
    if (child?.talk?.phase !== 'talking' || !speaking.has(child.id)) continue;
    const grown = world.entities[child.talk.withId];
    // Nobody gone says anything (interactions M1): a grown-up who died or was taken this tick has let the child go already.
    if (!grown || GONE.includes(grown.health?.condition) || GONE.includes(child.health?.condition)) continue;
    const n = world.tick - (child.talk.from ?? child.talk.since);
    const said = pick(world, child.id, `say:${n}`, CHILD_SAYS).replace('{p}', calledBy(world, child, grown));
    lines.push({ id: `${child.id}:talk:${world.tick}`, sceneId: `talk:${child.id}`, speakerId: child.id, text: said, kind: 'reconstructed', claimId: 'FIC-GONZ-481' });
    lines.push({ id: `${child.id}:reply:${world.tick}`, sceneId: `talk:${child.id}`, speakerId: grown.id, text: pick(world, grown.id, `reply:${child.id}:${n}`, GROWN_SAYS), kind: 'reconstructed', claimId: 'FIC-GONZ-481' });
  }
  return lines;
}

// ------------------------------------------------------------------------------------------------ the tick, and what is shown

/** Every tick, after the chores: play drawn, a job wandered from, a child's automation, and the idle child. */
export function advanceChildhood(world, travel) {
  for (const household of Object.values(world.households)) {
    // A lone parent's family away at the neighbours' farms (sim/courtship.mjs): the children are with the grown-ups, not idle at home.
    if (household.courtship?.stage === 'away') continue;
    for (const id of household.members) {
      const entity = world.entities[id];
      if (!entity || entity.kind !== 'person') continue;
      // The notice leaves the row after `NOTICE_TICKS`, and is kept while the child has been given nothing since: that is the "!".
      if (entity.autoNotice && world.tick - entity.autoNotice.tick >= NOTICE_TICKS && !autoOffAsking(entity)) delete entity.autoNotice;
      if (!isSmallChild(entity) || GONE.includes(entity.health?.condition)) continue;
      // In out of the weather (sim/shelter.mjs, owner 2026-10-02): no play about the yard, no wandering off from a job, and their
      // own automation takes nothing up - the children are inside with somebody, until it clears.
      if (entity.shelter) continue;
      if (entity.chore && isPlay(entity.chore.id)) playStep(world, household, entity);
      else if (entity.chore && household.played && !household.absent) wanderFromJob(world, household, entity, travel);
      advanceChildAuto(world, household, entity, travel);
    }
    advanceTalks(world, household, travel);
  }
}

/**
 * What a person's row says about the family's little ones, in the server's words, or null: a grown-up stopped to talk, a child
 * talking or on their way, dawdling, or whose automation has just gone off. Never how long a child's automation has left, and
 * never their obedience - only what they are doing.
 */
export function childLine(world, entity) {
  const nameOf = id => world.entities[id]?.given || world.entities[id]?.name || 'somebody';
  if (entity.aside?.kind === 'talk') {
    const many = entity.aside.childIds.length > 1;
    const names = listWords(entity.aside.childIds.map(nameOf));
    return `Stopped to talk with ${names}, who ${many ? 'have' : 'has'} nothing to do. Give ${many ? 'them' : names} something to do and ${entity.given || entity.name} goes back to ${workOf(entity)}.`;
  }
  if (entity.talk) return entity.talk.phase === 'going' ? `Nothing to do: going to find ${nameOf(entity.talk.withId)}.` : `Nothing to do: talking with ${nameOf(entity.talk.withId)}, who has stopped work for it.`;
  if (entity.chore?.dawdle) return 'Dawdling instead of starting.';
  if (entity.autoNotice && world.tick - entity.autoNotice.tick < NOTICE_TICKS) return entity.autoNotice.why === 'time' ? `Auto went off: ${entity.given || entity.name} has been good as long as a child can be.` : `Auto went off: ${entity.given || entity.name} decided that was enough.`;
  return null;
}

/** What the row says of a child on their own automation: never how long it has left (that is their roll). */
export const childAutoShown = entity => ({ chore: entity.chore?.id || null, says: entity.chore ? `Auto: finding themself things to do, for a while. Now ${entity.chore.doing}.` : 'Auto: finding themself things to do, for a while.' });

/** A saved child's state that cannot be, or null. */
export function childhoodInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    if (entity.kind !== 'person') continue;
    if (entity.talk !== undefined && (!entity.talk || !world.entities[entity.talk.withId] || !['going', 'talking'].includes(entity.talk.phase) || !Number.isInteger(entity.talk.since))) return 'Invalid talk';
    // Timed by the day since 2026-09-29 (`day`, `since`); a save from before carries a tick (`until`), timed afresh when first seen.
    if (entity.childAuto !== undefined && (!entity.auto || !Number.isInteger(entity.childAuto?.picks)
      || (entity.childAuto.day === undefined ? !Number.isInteger(entity.childAuto.until) : dayInvalid(world, entity.childAuto)))) return 'Invalid child automation';
    if (entity.idleSince !== undefined && !Number.isInteger(entity.idleSince)) return 'Invalid idle time';
    if (entity.told !== undefined && (!entity.told || typeof entity.told !== 'object' || Object.values(entity.told).some(day => !Number.isInteger(day)))) return 'Invalid record of what was told';
    if (entity.autoNotice !== undefined && (!Number.isInteger(entity.autoNotice?.tick) || !['time', 'child'].includes(entity.autoNotice.why))) return 'Invalid automation notice';
    if (entity.aside?.kind === 'talk' && (!Array.isArray(entity.aside.childIds) || entity.aside.childIds.some(id => world.entities[id]?.talk?.withId !== entity.id))) return 'Invalid talk aside';
  }
  return null;
}

