// News carried by people.
//
// Owner direction, `docs/LIVING_INFORMATION.md`: a report must stop being a line of text
// that appears in a panel and become a person who rode from where it happened, met one
// named member of one family, and said it out loud. This file is build-order steps 1 and 2
// of that document - **one** report converted, proved, with the journal still keeping the
// record afterwards. Every other topic still arrives the old way, and deliberately so:
// a topic is converted by authoring a conversation for it below, and by nothing else.
//
// Step 2 is what happens when the word has to cross a county. A rider carries it as far
// as they are going and hands it to somebody going further (`advanceRelays`, in
// `sim/world.mjs`), so a far family does not meet an eyewitness who took longer - they
// meet somebody who was told, by somebody who was told. Everything that makes that
// truthful lives here: what a second-hand rider will and will not claim, how old the
// account already was when it reached their hands, and the rule that a rider tells
// anybody they come alongside who does not already know.
//
// Four things are kept separate here, because the document requires it and because
// collapsing them is how this kind of system usually goes wrong:
//
//   1. the encounter being available  - `status === 'open'`
//   2. words actually spoken and heard - `encounter.said`
//   3. what the household now knows    - `world.knowledge.households[...]`
//   4. whether a player has read any of it - client only, and it changes nothing
//
// So a student who never opens the panel still hears the opening line, because it was
// spoken to their family in the world. Failing to click cannot unhear it.
import { record } from './events.mjs';
import { learn, wouldLearn } from './knowledge.mjs';
import { TICK_MINUTES, calendarAhead, calendarMinutes } from './clock.mjs';
import { courierIfUnanswered } from './lapse.mjs';
import { QUEUED_QUESTION_MS, limitLeft, limitOut, riderLimitKey, riderOnLimit } from './decision-budget.mjs';
import { STUDY_TICK_MS } from './crops.mjs';
import { RIDER_SPEED } from './travel.mjs';

/**
 * How far the calendar has been stretched, as a multiplier (sim/clock.mjs, docs/COLONIES.md §5.7).
 *
 * One while a class farms and on every class on the invented map, and more in the phases whose
 * calendar runs fast. Two things in this file are counted in ticks rather than in minutes of
 * 1835 and so have to be stretched with it: how far off a rider is *seen*, which was always a
 * count of ticks of approach, and how long a student is given to answer one, which was always a
 * count of seconds in a real classroom. Left alone, both would shrink to a third of themselves
 * the moment the calendar sped up - the rider appearing and reining in on the same tick, and the
 * prompt closing before it could be read.
 */
const stretch = world => calendarMinutes(world) / TICK_MINUTES;
/**
 * A span tuned to a student's attention, in the minutes of 1835 that hold that many ticks of it.
 *
 * Stretched only where somebody is actually reading it. At a family nobody plays there is no
 * attention to protect, and stretching it there was measured doing harm: sixty ticks of a
 * four-hour tick left a rider at an empty gate for ten days of 1835 with the next rider queued
 * behind him, and a Liberty family never heard how the fight ended. Unplayed, a rider simply
 * waits the twenty fictional hours the number always meant and then rides on.
 */
const attention = (world, minutes, householdId) => minutes * (world.households?.[householdId]?.played && !world.households[householdId].absent ? stretch(world) : 1);

// How close two people must be before one can say something to the other. Invented, like
// every distance in this project (`FIC-GONZ-002`); a rider reining in beside somebody.
export const EARSHOT_MILES = 0.45;
// How far off a rider can be seen coming. Open post oak savannah is documented for this
// country (`HIST-GONZ-012`); the number is not, and it is not really about eyesight. A
// rider covers 2.6 miles a tick, so this is calibrated in **ticks of approach** - about
// two of them. It was 1.2 miles first, and measuring a live class showed why that was
// wrong: the rider became visible and reined in on the same tick, so there was no
// approach at all, only an appearance. Twenty fictional minutes a second is what makes
// this hard, and no number here fixes that - the honest ceiling is a second or two of
// somebody coming up the road.
// ceiling: general open-country sight does not exist - a household still sees other
// people only where one of its own is standing. Widening that is its own decision about
// payload and about what a student is allowed to watch, and it is not this change.
//
// Because it is ticks of approach and not eyesight, it stretches with the calendar: in a
// phase where a tick carries an hour the rider also covers three times the ground in it, so
// five miles would put him in view and at the door in the same tick - the appearance this
// number exists to prevent. `seenComing` is the one the simulation asks.
export const SIGHT_MILES = 5;
/** How far off a rider is seen coming, in this phase: always about two ticks of road. */
export const seenComing = world => SIGHT_MILES * stretch(world);
// How long a rider will wait once they have said their piece. They have already been
// heard by the time this matters, so what runs out is the chance to ask anything further,
// and every question asked resets it.
//
// Sixty ticks - a minute of a real classroom at the shipped tick rate. It is a number
// about a student noticing a prompt and reading five lines, not about how long a rider
// would really sit on a horse, and at twenty fictional minutes a tick the two cannot both
// be right. `FIC-GONZ-003` already owns that whole disagreement. Untuned: it was half
// this, and half this was not long enough to notice a conversation and open it.
//
// **Since 2026-09-29 only for a family nobody is reading** (owner, "Real-time limits": a rider gets 90 real seconds). At a
// played family whose student is at the screen the rider waits **ninety real seconds** from the last thing said, the same at
// every pace (sim/decision-budget.mjs `QUESTION_BUDGETS.rider`, `riderOnLimit`), the errand rider on his short stop the same:
// sixty ticks stretched with the calendar was 9.5 real minutes at Study, with the whole class's calendar held for it
// (docs/audits/2026-09-29-triage.md 1.2). This and `PASSING_MINUTES` are what a rider does at a gate nobody is watching.
export const PATIENCE_MINUTES = 1200;
// How long a rider who still has somewhere to be will stand about.
//
// Found by measuring, and it is a defect this constant exists to fix: once a rider stops
// for anybody they come alongside, a family who never opens the panel held the rider on
// the road for the full twenty fictional hours - and everybody further down that road
// waited too, for a reason no student could see, because the reason was a classroom
// attention span wearing fictional clothes. A rider carrying an undelivered errand now
// gives it a short pause and rides on. Every question still resets it, so a student who
// is actually talking to them keeps them; a student who is not does not hold up the county.
// Untuned like its larger cousin, and for the same reason: no class has played it.
export const PASSING_MINUTES = 200;
/**
 * One rider, one visit (owner, 2026-09-29, verbatim: "At the start of the game, there's multiple riders that arrive at the
 * same time. If they're all carrying similar news, why does the family receive multiples? Why don't we integrate and simplify
 * things?", and the same day: "players shouldn't see riders merge, they should have a seamless experience. it should be an off
 * screen thing."; docs/COLONIES.md §5.4b, `FIC-GONZ-909`).
 *
 * A second rider bringing a family a word it is being told right now, or was told by a rider less than this long ago, is part
 * of that same visit: what he adds - a firmer account, told by somebody nearer to it - is taken into the family's knowledge
 * the minute he comes (`joinVisit`), with his own name as its source, and he never opens a second conversation about the same
 * thing. Six hours of 1835, and not a number of ticks, because it is about the word and not about a student: it is the time the
 * word is held at a settlement while the letter is read and copied (sim/expresses.mjs `RELAY_MINUTES`), so every rider of one
 * wave of the same letters falls inside it, while an account of the same thing arriving the next day is a new round of word
 * and gets its own visit, as any firmer account always did. A rider with a different word is never folded: he waits his turn
 * at the gate (one family listens to one person at a time) and his ninety seconds start when he speaks.
 */
export const VISIT_MINUTES = 360;

// Riders are invented people, in exactly the way the households of `FIC-GONZ-001` and the
// three residents of `FIC-GONZ-009` are invented. They are not identified couriers, and
// no real person who carried word in 1835 is named here. Deterministic by dispatch order,
// so a reloaded class puts the same rider back on the same road.
const RIDER_NAMES = ['Silas Roe', 'Concepción Mora', 'Abner Teel', 'Perla Zamarripa', 'Willa Hines', 'Tobias Crow', 'Ada Swinney', 'Ned Falk'];
export const riderName = number => RIDER_NAMES[(number - 1) % RIDER_NAMES.length];

const hours = minutes => {
  const whole = Math.max(0, Math.round(minutes / 60));
  if (whole < 1) return 'less than an hour';
  if (whole < 36) return whole === 1 ? 'an hour' : `${whole} hours`;
  const days = Math.round(whole / 24);
  return days === 1 ? 'a day' : `${days} days`;
};

/**
 * What a rider carrying this report can say.
 *
 * All of it is fictional dialogue spoken by an invented person, registered as
 * `FIC-GONZ-013`. None of it is a recovered quotation and none of it may assert
 * something `HISTORY.md` excludes. The first question is the clearest case: the
 * exclusions forbid stating a troop total, so the rider does not know one and says so.
 * That is not a dodge - not knowing is the point of the whole system.
 *
 * `opening` is the receipt point. It is spoken the moment the two are in earshot and it
 * carries the core fact; the questions add qualified detail and are optional. Nothing
 * here is scored, nothing is a right answer, and asking nothing is a complete way to
 * play.
 *
 * Every line is written twice, because a rider who saw it and a rider who was told it are
 * not the same witness and must not sound like one. The second-hand version never claims
 * the first-hand version's knowledge, says who it came from and where, and keeps the age
 * the account already had when it reached their hands. A student far from Gonzales is
 * meant to notice that the person at their gate is telling them what somebody told them.
 */
export const CONVERSATIONS = {
  'cannon-request': {
    // Kernel: HIST-GONZ-002, in a rider's own words rather than a report's.
    opening: ({ origin, firsthand, toldBy, toldAt, tellerSaw }) => firsthand
      ? `I've come up from ${origin}. There are Mexican soldiers on the far bank of the Guadalupe, across from the town. They have come for the cannon, and the town has told them no.`
      : `I've come from ${toldAt}, and I did not see any of this myself. ${toldBy} put it in my hands there${tellerSaw ? `, straight out of ${origin}` : `, and had it from another rider before that, out of ${origin}`}. There are Mexican soldiers on the far bank of the Guadalupe, across from the town. They came for the cannon, and the town has told them no.`,
    lines: [
      {
        id: 'how-many', ask: 'How many of them are there?',
        // HISTORY.md: "Do not add exact troop totals". So nobody in the chain has one.
        answer: ({ firsthand, toldBy }) => firsthand
          ? 'I did not count them, and I will not guess for you. More than a handful. I was not going to ride down and ask.'
          : `I would not guess at it if I had seen them, and I did not see them. ${toldBy} said more than a handful and would put no number to it either.`,
      },
      {
        id: 'when-left', ask: 'When did you leave?',
        answer: ({ departedAgo, observedAgo, firsthand, toldBy, toldAt }) => firsthand
          ? `${departedAgo} on the road to get here, and what I am telling you was already ${observedAgo} old when I set out. Reckon on it being older still by now.`
          : `${departedAgo} since ${toldBy} gave me the word at ${toldAt}, and it was already ${observedAgo} old when it came into my hands. Reckon on it being older still by now.`,
      },
      {
        id: 'saw-it', ask: 'Did you see them yourself?',
        answer: ({ firsthand, toldBy, hands, origin }) => firsthand
          ? 'I saw the camp across the water with my own eyes. What the town means to do about it, I only heard said.'
          : `No. ${toldBy} did${hands === 1 ? ', and told me so - the camp across the water, seen from the near bank' : ` not either. It was through ${hands} hands before mine, and I never met whoever it was that saw it`}. I am telling you what I was told, out of ${origin}.`,
      },
      {
        id: 'crossing', ask: 'Are they crossing?',
        answer: ({ firsthand, observedAgo, origin }) => firsthand
          ? 'The river was between them and the town when I turned my horse. I cannot tell you where they are now.'
          : `The river was between them when the word started out of ${origin}, and that was ${observedAgo} before ever I heard it. Where they are now, nobody on this road can tell you.`,
      },
      {
        id: 'what-wanted', ask: 'What does the town want from us?',
        // The one place this could turn into recruitment, so it is the one place the
        // rider is made to disclaim. VISION.md 11: pressure, never a demand with a
        // meter behind it.
        answer: ({ firsthand }) => firsthand
          ? 'Men, and food for the men. Nobody sent me to ask you for either one. I carry the word; what your family does with it is your own business.'
          : 'Men, and food for the men - that is what came down the road with it. Nobody sent me to ask you for either one, and I am not even the one who was asked to carry it first.',
      },
    ],
  },
};

/**
 * How the fight at the camp ended, carried the same way. Converted 2026-09-12.
 *
 * Kernel: `HIST-GONZ-004` - a brief engagement, and Castañeda's force withdrew toward Béxar
 * without the cannon - and `HIST-GONZ-008` for where it happened. S1 describes an ordered
 * withdrawal, so the riders say "in good order" and never "ran" or "routed". Every exclusion
 * in HISTORY.md shapes an answer here: nobody in the chain gives a count of men or of the
 * dead, names a wound, says how many times the cannon was fired, or repeats what was said
 * between the two sides. The cannon "did not go with them" rather than "is ours": riders are
 * not a unified bloc (`HIST-GONZ-006`), and the fact is the same either way.
 */
CONVERSATIONS['gonzales-outcome'] = {
  opening: ({ origin, firsthand, toldBy, toldAt, tellerSaw }) => firsthand
    ? `I've come down from ${origin}. There was a fight at the Mexican camp, and it was short. The soldiers have gone back up the road toward Béxar, and the cannon did not go with them.`
    : `I've come from ${toldAt}, and I did not see any of this myself. ${toldBy} put it in my hands there${tellerSaw ? `, straight from ${origin}` : `, and had it from another rider before that, out of ${origin}`}. There was a fight at the Mexican camp, and it was short. The soldiers have gone back toward Béxar, and the cannon did not go with them.`,
  lines: [
    {
      id: 'anyone-killed', ask: 'Was anybody killed?',
      // HISTORY.md: no casualty counts and no individual wounds. So nobody has one - and
      // nobody says "nobody was killed" either, because omitting casualties is not a claim
      // that nobody was harmed.
      answer: ({ firsthand, toldBy }) => firsthand
        ? 'I could not tell you. I was not near enough to count anybody, and I will not repeat what men say over a fire.'
        : `${toldBy} would not say, and I will not guess. People on this road tell it every way.`,
    },
    {
      id: 'where-gone', ask: 'Where did the soldiers go?',
      answer: ({ firsthand }) => firsthand
        ? 'Back up the road toward Béxar. They went in good order, not running.'
        : 'Back toward Béxar, is what I was told. Whether anybody watched them all the way out, I cannot say.',
    },
    {
      id: 'when-left', ask: 'When did you leave?',
      answer: ({ departedAgo, observedAgo, firsthand, toldBy, toldAt }) => firsthand
        ? `${departedAgo} on the road to get here, and it was ${observedAgo} over when I set out.`
        : `${departedAgo} since ${toldBy} gave me the word at ${toldAt}, and it was already ${observedAgo} old then.`,
    },
    {
      id: 'saw-it', ask: 'Did you see it yourself?',
      answer: ({ firsthand, toldBy, hands, origin }) => firsthand
        ? 'I was with the men at the camp. I heard the cannon and I saw the soldiers go. What passed between the two sides before it, I did not hear.'
        : `No. ${toldBy} did${hands === 1 ? ', and told me so' : ` not either. It came through ${hands} hands before mine`}. I am telling you what I was told, out of ${origin}.`,
    },
    {
      id: 'over', ask: 'Is it over, then?',
      answer: ({ firsthand }) => firsthand
        ? 'That fight is. Nobody I stood with thought the matter was settled for good.'
        : 'That fight is. What comes of it, nobody on this road can tell you.',
    },
  ],
};

export const carriedInPerson = topicId => Boolean(CONVERSATIONS[topicId]);

const isPerson = entity => entity.kind === 'person';
const canSpeak = entity => isPerson(entity) && !['dead', 'captured'].includes(entity.health?.condition);

function between(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Standard segment-intersection test, used for one thing only: the river.
function segmentsCross(a, b, c, d) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const d1 = side(c, d, a), d2 = side(c, d, b), d3 = side(a, b, c), d4 = side(a, b, d);
  return d1 !== d2 && d3 !== d4;
}

/**
 * Whether the river stands between two people.
 *
 * `HIST-GONZ-007` makes the Guadalupe a barrier crossed at one contested ford, and the
 * road graph already honours that - `findPath` will not walk anybody over the water. This
 * applies the same rule to a voice. Two people three hundred yards apart on opposite
 * banks are not in earshot of each other in any sense that matters: one of them cannot
 * reach the other without riding to the crossing.
 *
 * Only rivers block. A creek is a step across and the terrain list marks it as one.
 */
export function blockedByWater(world, a, b) {
  for (const course of world.map.terrain || []) {
    if (course.kind !== 'river') continue;
    for (let i = 1; i < course.points.length; i++) {
      if (segmentsCross(a, b, course.points[i - 1], course.points[i])) return true;
    }
  }
  return false;
}

function pointOnSegment(target, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, square = dx * dx + dy * dy;
  const t = square ? Math.max(0, Math.min(1, ((target.x - a.x) * dx + (target.y - a.y) * dy) / square)) : 0;
  const point = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, point, distance: between(target, point) };
}

/**
 * The closest a traveller came to somebody over a stretch of their route.
 *
 * This exists because a rider covers 2.6 miles in a tick and earshot is under half a
 * mile: testing only where the rider ended up would let them jump clean over a family
 * without ever meeting them. So the stretch of road actually covered since the last look
 * is what gets tested, and the meeting happens at the point of nearest approach - which
 * is also where the rider is then put, so they are drawn slowing to a halt beside the
 * person rather than doubling back from somewhere up the road.
 */
export function nearestAlong(points, from, to, target) {
  let travelled = 0, best = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const start = travelled, end = travelled + length;
    travelled = end;
    if (end < from || start > to) continue;
    const low = Math.max(from, start), high = Math.min(to, end);
    if (high < low) continue;
    const at = along => ({ x: a.x + (b.x - a.x) * ((along - start) / (length || 1)), y: a.y + (b.y - a.y) * ((along - start) / (length || 1)) });
    const near = pointOnSegment(target, at(low), at(high));
    if (!best || near.distance < best.distance) best = { distance: near.distance, point: near.point, progress: low + (high - low) * near.t };
  }
  return best;
}

/** Where, if anywhere, this carrier came within speaking distance of this person. */
function approachTo(world, carrier, person) {
  const here = carrier.location;
  // Come to the end of the leg this tick: the family standing at the place is met there, and anybody on the stretch just
  // ridden is looked for along it, as for a rider still on the road.
  if (!carrier.travel && here.siteId && here.siteId === person.location.siteId) return { distance: 0, point: { x: here.x, y: here.y } };
  const travel = carrier.travel || carrier.report?.lastLeg;
  if (travel && !travel.halted) {
    const from = Math.min(travel.scannedProgress || 0, travel.progress);
    const near = nearestAlong(travel.points, from, travel.progress, person.location);
    if (!near || near.distance > EARSHOT_MILES) return null;
    if (blockedByWater(world, near.point, person.location)) return null;
    return near;
  }
  // Standing still: at the cabin door, or already halted at somebody's shoulder.
  if (here.siteId && here.siteId === person.location.siteId) return { distance: 0, point: { x: here.x, y: here.y } };
  const distance = between(here, person.location);
  if (distance > EARSHOT_MILES || blockedByWater(world, here, person.location)) return null;
  return { distance, point: { x: here.x, y: here.y } };
}

const openFor = (world, householdId) => Object.values(world.encounters || {}).find(e => e.householdId === householdId && e.status === 'open');
/**
 * Whether one of the family's questions - the neighbour at the door, the rumor, the settlement's call, the march upriver - waits
 * behind a rider who is talking with the family (owner, 2026-09-29: "One conversation at a time, the rest queued";
 * `FIC-GONZ-909`). A question put to the family while a rider it raises from is still standing there, or on the very tick he
 * speaks, waits until he has gone: the word first, then what the word asks. One already in front of the family when a rider comes
 * stays where it is, so nothing is taken off the screen from under a student. Only what is shown waits: the question is put, and
 * written in the family's record, at the time it truly came, and while it waits its real minutes do not run
 * (sim/decision-budget.mjs `openDecisions`), so it is never short of time for having queued.
 */
export function questionWaits(world, householdId, question) {
  if (!question || question.status !== 'open' || !Number.isFinite(question.offeredMinute)) return false;
  const visit = openFor(world, householdId);
  return Boolean(visit && !visit.kind && question.offeredMinute >= visit.openedMinute);
}
/**
 * Whether the rider talking with this family must ride on now, so that a question waiting behind him that the calendar closes
 * (the neighbour at the door, the rumor, the march upriver: each carries `closes`) is still shown with its full real-time window
 * (`QUEUED_QUESTION_MS`) before it does (owner, 2026-09-29, choosing "Rider leaves at dawn": at the Quick pace a rumor that came
 * late in the days before the fight waited behind its rider's ninety seconds past the dawn that closes it, and the family was never
 * asked; docs/COLONIES.md §5.4b, `FIC-GONZ-909`).
 *
 * Counted in real time from the calendar: the minutes left before it closes, over the minutes a tick will carry once he has gone
 * (sim/clock.mjs `calendarAhead`), times the real length of a tick (the last one the rider's clock measured; a tick stepped in
 * process is one at the Study pace). He goes while that is still the window and two ticks more - one for the tick he goes in, one
 * for the rounding - so the question comes up with at least its window. A calendar that cannot give that much sends him on at
 * once, and the question is shown at once. Nothing of what he said is lost: he spoke his word as he reined in, and the journal
 * has it.
 * ceiling: a request or rumor of a class saved before 2026-09-29 carries no `closes` and waits behind him as it did; the call,
 * which the calendar never closes, waits as before with its minutes held (sim/decision-budget.mjs).
 */
export function riderMustGo(world, encounter) {
  if (encounter.status !== 'open' || encounter.kind) return false;
  const householdId = encounter.householdId;
  const closes = [world.marches, world.calls, world.requests, world.rumors].map(table => table?.[householdId])
    .filter(question => questionWaits(world, householdId, question) && Number.isFinite(question.closes)).map(question => question.closes);
  if (!closes.length) return false;
  const clock = world.decisionClock || {};
  const tickMs = clock[riderLimitKey(encounter)]?.tickMs || Object.values(clock).find(entry => entry?.tickMs > 0)?.tickMs || STUDY_TICK_MS;
  const leftMs = (Math.min(...closes) - world.minute) / Math.max(1, calendarAhead(world)) * tickMs;
  return leftMs <= QUEUED_QUESTION_MS + 2 * tickMs;
}
/** Everything waiting on the family behind the rider it is talking with: a question, and riders with other word at the gate. */
function waitingBehind(world, encounter) {
  const householdId = encounter.householdId;
  const questions = [world.marches, world.calls, world.requests, world.rumors].map(table => table?.[householdId]).filter(question => questionWaits(world, householdId, question));
  const home = world.households[householdId]?.homeSiteId;
  const riders = Object.values(world.entities).filter(one => one.id !== encounter.carrierId && one.report?.inPerson && one.report.audience === householdId
    && !one.travel && one.location?.siteId === home && wouldLearn(world, householdId, one.report.topicId, one.report.status));
  return { questions: questions.length ? 1 : 0, riders: riders.length };
}
const placeName = (world, siteId) => world.map.sites[siteId]?.name || 'elsewhere';
/**
 * A place as somebody standing in it would say it, rather than as the map labels it.
 *
 * Every junction on the spine road is a site called "The road", which is right on a map
 * and wrong in a sentence - "I had it from Abner Teel at The road". Word changes hands at
 * these junctions more than anywhere else, so what a rider calls the spot is not a detail.
 */
export const spotName = (world, siteId) => {
  const site = world.map.sites[siteId];
  if (!site) return 'elsewhere';
  if (site.kind === 'junction') return 'the fork of the road';
  return site.name.startsWith('The ') ? `the ${site.name.slice(4)}` : site.name;
};

function say(world, encounter, speaker, text, causes = []) {
  const who = speaker === 'rider' ? encounter.carrierName : world.entities[encounter.listenerId].name;
  const eventId = record(world, 'spoken', {
    householdId: encounter.householdId, importance: 2,
    actorId: speaker === 'rider' ? encounter.carrierId : encounter.listenerId,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-013',
    causes, text: `${who}: “${text}”`,
  });
  encounter.said.push({ speaker, text, minute: world.minute, eventId });
  encounter.lastSpokenMinute = world.minute;
  return eventId;
}

/**
 * The provenance of what this rider is saying, frozen at the moment they reined in.
 *
 * Measured from `openedMinute` and not from now, which is a correction: reading it live
 * made the ride grow while the two of them were standing there talking, so a rider who
 * had been on the road three hours announced twenty-two the longer a student read. What
 * somebody says when they arrive does not change afterwards. The two numbers are also
 * genuinely different things and both matter - how long this rider was riding, and how
 * old the news already was when they set out - and it is the second that carries the
 * weight once a report has been through a relay, because it is the only one that keeps
 * growing down the chain.
 *
 * `provenance` is everybody who carried this before the rider saying it, oldest first. It
 * is what a hand-off preserves, and it is the difference between a distant family's news
 * being late and a distant family's news being second-hand.
 */
export function accountOf(world, encounter) {
  const chain = encounter.provenance || [];
  const told = chain.at(-1) || null;
  return {
    origin: placeName(world, encounter.originSiteId),
    departedAgo: hours(encounter.openedMinute - encounter.departedMinute),
    observedAgo: hours(encounter.departedMinute - encounter.observedMinute),
    // Whether this rider is the one who saw it, and if not, who handed it to them where.
    firsthand: chain.length === 0,
    hands: chain.length,
    toldBy: told?.name || null,
    toldAt: told ? spotName(world, told.atSiteId) : null,
    tellerSaw: chain.length === 1,
  };
}

function begin(world, carrier, person, point, householdId) {
  const report = carrier.report, script = CONVERSATIONS[report.topicId];
  const truth = world.truth[report.topicId];
  const id = `enc-${world.nextEncounterId++}`;
  const encounter = world.encounters[id] = {
    id, carrierId: carrier.id, carrierName: carrier.name,
    householdId, listenerId: person.id, topicId: report.topicId,
    status: 'open', originSiteId: report.originSiteId, departedMinute: report.departedMinute,
    observedMinute: truth.minute, openedMinute: world.minute, lastSpokenMinute: world.minute,
    // Copied rather than referenced, because the rider rides on and the family's record of
    // who told them what must not change afterwards.
    provenance: (report.provenance || []).map(hop => ({ ...hop })), reportStatus: report.status,
    place: { x: point.x, y: point.y, siteId: carrier.location.siteId || null },
    said: [], asked: [],
  };
  const said = accountOf(world, encounter);
  const where = carrier.location.siteId ? `at ${spotName(world, carrier.location.siteId)}` : 'on the road';
  encounter.metEventId = record(world, 'encounter', {
    householdId: encounter.householdId, actorId: person.id, importance: 2,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-013', causes: [truth.eventId],
    text: `${carrier.name} reined in ${where} and spoke with ${person.name}.`,
  });
  const spokenId = say(world, encounter, 'rider', script.opening(said), [encounter.metEventId]);
  // The receipt point, and the whole reason the rest of this exists: the family knows
  // now, because a person told them, and not because a courier touched a map pin. How
  // they know is part of what they know: the journal names the rider, and when the word
  // came through other people it says so and how many.
  learn(world, encounter.householdId, encounter.topicId, { status: report.status, hands: said.hands, source: sourceOf(carrier, said), causes: [spokenId] });
  return encounter;
}
/** How the journal names the person a word came from: who rode, and through whose hands. */
const sourceOf = (carrier, said) => said.firsthand
  ? `${carrier.name}, who rode from ${said.origin}`
  : `${carrier.name}, who had it from ${said.toldBy} at ${said.toldAt}${said.tellerSaw ? '' : ', and it had passed through other hands before that'}`;

/**
 * The rider visit this family is having, or had a moment ago, about this word (`VISIT_MINUTES`): open, or closed less than
 * that long ago. Never Travis's runner, who is a question and not a word.
 */
export function visitAbout(world, householdId, topicId) {
  return Object.values(world.encounters || {}).find(one => one.householdId === householdId && !one.kind && one.topicId === topicId
    && (one.status === 'open' || world.minute - (one.closedMinute ?? one.openedMinute) < VISIT_MINUTES)) || null;
}
/**
 * A second rider's account of a word the family is already being told, taken into that visit off the screen (`VISIT_MINUTES`).
 *
 * Nothing is lost and nothing is late: the family knows what he brought the minute he came, as firm as he had it and in his
 * name (`learn`, which writes the journal's line), and the causal record says whose visit it joined. Nobody is shown a second
 * rider or a second conversation: he does not rein in, and if the family was his errand it is done and he turns for home
 * (`advanceDepartures`) like any rider whose word is delivered; if not, he rides on with it. `joined` on the visit keeps who
 * came, for the record and for the Host; it never goes to the family's page.
 */
function joinVisit(world, carrier, { person, householdId, joining }) {
  const report = carrier.report;
  const truth = world.truth[report.topicId];
  const said = accountOf(world, { provenance: report.provenance || [], originSiteId: report.originSiteId, departedMinute: report.departedMinute, observedMinute: truth.minute, openedMinute: world.minute });
  const eventId = record(world, 'encounter-joined', {
    // The causal record only, like a hand-off (sim/world.mjs `advanceRelays`): the family's own line is the journal's.
    actorId: carrier.id, topicId: report.topicId, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-909', causes: [joining.metEventId],
    text: `${carrier.name} brought the same word to ${person.name}'s family while ${joining.carrierName}'s visit stood, and it was taken with that visit.`,
  });
  learn(world, householdId, report.topicId, { status: report.status, hands: said.hands, source: sourceOf(carrier, said), causes: [eventId] });
  (joining.joined ||= []).push({ carrierId: carrier.id, name: carrier.name, status: report.status, minute: world.minute, eventId });
  // Kept on the rider, so the family is never drawn him riding away from a visit it never saw him join (`ridersInSight`).
  carrier.foldedInto = householdId;
  if (householdId === report.audience) delete carrier.report;
}

function finish(world, encounter, reason) {
  encounter.status = 'closed';
  encounter.closedMinute = world.minute;
  encounter.reason = reason;
  const carrier = world.entities[encounter.carrierId];
  if (carrier) {
    // The errand is discharged whether or not anything further was asked: it was
    // delivered by being said. Only to the family it was for, though - somebody told on
    // the way is told and the rider goes on, still carrying it to the people it is for.
    if (encounter.householdId === carrier.report?.audience) delete carrier.report;
    // Still carrying it: back on the road he was on. Discharged: he stays where he reined in until he turns for home
    // (`advanceDepartures`), rather than riding on up to a gate he no longer has any business at.
    if (carrier.travel && carrier.report) { delete carrier.travel.halted; carrier.travel.scannedProgress = carrier.travel.progress; }
  }
  const listener = world.entities[encounter.listenerId]?.name || 'The family';
  const count = encounter.asked.length;
  const put = count === 0 ? 'Nothing further was asked.' : count === 1 ? 'One question was put to them first.' : `${count} questions were put to them first.`;
  const text = reason === 'parted'
    ? `${listener} and ${encounter.carrierName} were separated before anything more could be said. ${put}`
    : reason === 'unanswered'
      ? `${encounter.carrierName} would wait no longer and rode on. ${put}`
      : `${listener} let ${encounter.carrierName} ride on. ${put}`;
  record(world, 'encounter-ended', {
    householdId: encounter.householdId, actorId: encounter.listenerId, importance: 2,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-013',
    causes: [encounter.metEventId], text,
  });
}

/**
 * Riders ride, meet whoever is actually there, and wait a while to be asked things.
 *
 * Returns the encounters that opened on this call, so compressed time can stop at one -
 * meeting somebody is exactly the kind of contact `LIVING_INFORMATION.md` says a time
 * jump may not skate over.
 */
export function advanceEncounters(world) {
  if (!world.encounters) { world.encounters = {}; world.nextEncounterId = world.nextEncounterId || 1; }
  for (const encounter of Object.values(world.encounters)) {
    if (encounter.status !== 'open') continue;
    // Travis's runner in the Alamo is not a rider with word: he waits for an answer and is closed by it, or by its budget
    // (sim/alamo-runner.mjs, sim/decision-budget.mjs), never by a rider's patience.
    if (encounter.kind) continue;
    const carrier = world.entities[encounter.carrierId], listener = world.entities[encounter.listenerId];
    if (!carrier || !listener || !canSpeak(listener)) { finish(world, encounter, 'parted'); continue; }
    // A little hysteresis, so a listener shifting about their own yard does not end a
    // conversation. Walking away from it does.
    const apart = between(carrier.location, listener.location);
    const together = (carrier.location.siteId && carrier.location.siteId === listener.location.siteId)
      || (apart <= EARSHOT_MILES * 2 && !blockedByWater(world, carrier.location, listener.location));
    if (!together) { finish(world, encounter, 'parted'); continue; }
    // Somebody met on the way gets a short stop; the family the word is for gets as long
    // as it takes, because by then the rider has nowhere else to be. A student reading him has ninety real seconds from the
    // last thing said, either way (owner, 2026-09-29; sim/decision-budget.mjs).
    const errand = carrier.report && carrier.report.audience !== encounter.householdId;
    // And a rider a student has not yet sent on rides on in time for the question waiting behind him (`riderMustGo`).
    const waited = riderOnLimit(world, encounter) ? limitOut(world, riderLimitKey(encounter)) || riderMustGo(world, encounter)
      : world.minute - encounter.lastSpokenMinute >= attention(world, errand ? PASSING_MINUTES : PATIENCE_MINUTES, encounter.householdId);
    if (waited) finish(world, encounter, 'unanswered');
  }
  const opened = [];
  // Two passes. On the first a rider may only stop for the family they were sent to; on the
  // second, for anybody. When two riders come alongside one family in the same tick, the one
  // sent to them is the one who speaks, and the other rides on past a family that now knows.
  //
  // Found by measuring, once every family's rider left Gonzales at the same minute: the
  // rider carrying a far family's word was simply earlier in the entity list, took the
  // conversation with a nearer family whose own rider was arriving that very tick, and then
  // stood waiting to be asked something while the far family's news sat on the road.
  for (const ownOnly of [true, false]) for (const carrier of Object.values(world.entities)) {
    const report = carrier.report;
    if (!report?.inPerson || !world.households[report.audience]) continue;
    // A rider in the middle of saying something is not also starting somewhere else, and
    // this check has to come first: the opening line makes a household know, so
    // discharging "somebody who already knows" before this would end the errand of the
    // very rider who is still standing there in the middle of saying it.
    if (Object.values(world.encounters).some(e => e.carrierId === carrier.id && e.status === 'open')) continue;
    // The people it was for already have it - from their own eyes, from a neighbour, from
    // a rider who got there first. The errand simply ends.
    if (!wouldLearn(world, report.audience, report.topicId, report.status)) { delete carrier.report; continue; }
    // Anybody at all who would learn something by it, and not only the family it is for:
    // `LIVING_INFORMATION.md` asks that one rider be able to inform successive eligible
    // listeners. A household that already knows is ridden past without a word, and that
    // is the same rule that ended the errand above - one rule, in `sim/knowledge.mjs`, so
    // a rider deciding whether to speak and the journal deciding whether to write it down
    // can never disagree.
    const moving = carrier.travel || report.lastLeg;
    const stretch = moving && !moving.halted ? moving.progress - Math.min(moving.scannedProgress || 0, moving.progress) : 0;
    let best = null;
    for (const household of Object.values(world.households)) {
      if (ownOnly && household.id !== report.audience) continue;
      if (!wouldLearn(world, household.id, report.topicId, report.status)) continue;
      // The same word the family is being told, or was told a moment ago, joins that visit (`VISIT_MINUTES`), even while it is
      // still open: what he adds is known the minute he comes. Any other word waits: one family listens to one person at a time.
      const joining = visitAbout(world, household.id, report.topicId);
      const open = openFor(world, household.id);
      if (open && open !== joining) continue;
      for (const id of household.members) {
        const person = world.entities[id];
        if (!canSpeak(person)) continue;
        // Cheap reject before measuring the ride: nothing on the stretch just covered can
        // have come within earshot of somebody further off than that stretch plus earshot.
        if (stretch && between(carrier.location, person.location) > stretch + EARSHOT_MILES) continue;
        const near = approachTo(world, carrier, person);
        if (!near) continue;
        // Nearest first, then by id, so the same class always meets the same person.
        if (!best || near.distance < best.near.distance || (near.distance === best.near.distance && id < best.person.id)) best = { near, person, householdId: household.id, joining };
      }
    }
    // The stretch is only marked as looked at once both passes have looked at it.
    if (!best) {
      if (!ownOnly && carrier.travel) carrier.travel.scannedProgress = carrier.travel.progress;
      if (!ownOnly) delete report.lastLeg;
      continue;
    }
    // More of a word the family is already being told: taken into that visit, off the screen, and he does not rein in.
    if (best.joining) {
      joinVisit(world, carrier, best);
      if (carrier.travel) carrier.travel.scannedProgress = carrier.travel.progress;
      delete report.lastLeg;
      continue;
    }
    // Met short of the place the leg ended at: back on that road where they came alongside, halted, to finish the ride
    // after. Met at the place itself, they are simply there.
    const leg = report.lastLeg;
    delete report.lastLeg;
    if (!carrier.travel && leg && Number.isFinite(best.near.progress) && best.near.progress < leg.distance - 1e-9) {
      carrier.travel = { ...leg };
      carrier.task = 'travel';
    }
    if (carrier.travel && Number.isFinite(best.near.progress)) {
      // Stop where they actually came alongside, not where the tick would have carried
      // them. Never past what was already scanned, so a rider only ever slows down.
      carrier.travel.progress = best.near.progress;
      carrier.travel.scannedProgress = best.near.progress;
      carrier.travel.halted = true;
      carrier.location = { x: best.near.point.x, y: best.near.point.y, siteId: null };
    }
    opened.push(begin(world, carrier, best.person, best.near.point, best.householdId));
  }
  // A leg nobody was looked for along (a rider mid-conversation, or carrying word for a family gone from the class) is not
  // kept for a later tick to search with people who have moved since.
  for (const entity of Object.values(world.entities)) if (entity.report?.lastLeg) delete entity.report.lastLeg;
  return opened;
}

/**
 * Riders whose errand is done leave (owner, 2026-09-27, verbatim: "riders delivering messages should leave after their
 * interactions are complete."; `FIC-GONZ-634`).
 *
 * Until this a rider who had said his piece - to the family the word was for, answered or let go or given up waiting on - had
 * nothing left to carry and simply stood where he was, at the family's gate, for the rest of the class; so did a rider who
 * handed the word on at a fork (`advanceRelays`, sim/world.mjs) and an express rider who brought it to a settlement
 * (sim/expresses.mjs). Now each rides back the way he came, on the road and in sight while he is (`ridersInSight`), to where he
 * set out from (`base`), and is gone: nobody sees him standing about there either.
 *
 * - With the family met on the road, short of where he was riding: he turns round where he reined in and rides back along
 *   the road he came by (`turnBack`).
 * - Standing at a place - the family's gate, the fork, the settlement - he takes the road home from there.
 * - A rider still carrying word for somebody further on is still on his errand and rides on, as before; one still in a
 *   conversation waits for it to end.
 *
 * Every tick, after the tick's meetings are settled, so a rider who has finished speaking goes the tick after he finished and
 * a word said is never ridden away from in the same update. ceiling: a rider ridden home is kept in the world (`gone`),
 * because the family's record and its meetings name him; he is not drawn, sent, or met again. A rider of a class saved before
 * this, with nowhere recorded to ride home to (`base`), rides for Gonzales, where the word began, or is simply gone if he
 * stands there already. The road back is the road he came by, at his pace, without its fords' waits.
 */
export function advanceDepartures(world, { beginTravel }) {
  for (const carrier of Object.values(world.entities)) {
    if (!carrier.courier || carrier.gone || carrier.report || carrier.express) continue;
    if (carrier.leaving) {
      if (!carrier.travel) goneHome(carrier);
      continue;
    }
    if (Object.values(world.encounters || {}).some(e => e.carrierId === carrier.id && e.status === 'open')) continue;
    if (carrier.travel) { turnBack(world, carrier); continue; }
    const here = carrier.location.siteId;
    const base = world.map.sites[carrier.base] ? carrier.base : world.map.sites.gonzales ? 'gonzales' : null;
    if (!base || !here || base === here) { goneHome(carrier); continue; }
    carrier.leaving = { to: base };
    try { beginTravel(world, carrier, base, null, 'leave'); } catch { goneHome(carrier); continue; }
    carrier.travel.silent = true;
  }
}
/**
 * A messenger whose errand is done and who has left: a rider ridden home (`gone`), or Travis's runner back inside the colonel's
 * quarters waiting to be sent (sim/alamo-runner.mjs, phase `waiting`). Seen by nobody - no family and not the Host.
 */
export const goneFromSight = entity => Boolean(entity?.gone) || entity?.runner?.phase === 'waiting';
function goneHome(carrier) {
  delete carrier.leaving;
  carrier.gone = true;
  carrier.task = 'rest';
}
/** Back along the road just ridden, from where he stands to where the leg began. */
function turnBack(world, carrier) {
  const travel = carrier.travel, points = travel.points;
  const here = { x: carrier.location.x, y: carrier.location.y };
  let index = 0, ridden = 0;
  for (; index < points.length - 1; index++) {
    const length = between(points[index], points[index + 1]);
    if (ridden + length >= travel.progress) break;
    ridden += length;
  }
  const back = [here];
  for (let k = index; k >= 0; k--) if (between(back.at(-1), points[k]) > 1e-9) back.push({ x: points[k].x, y: points[k].y });
  const from = world.map.sites[travel.from];
  carrier.leaving = { to: travel.from };
  if (back.length < 2 || !from) {
    carrier.travel = null;
    if (from) carrier.location = { x: from.x, y: from.y, siteId: from.id };
    goneHome(carrier);
    return;
  }
  const distance = back.slice(1).reduce((sum, point, i) => sum + between(back[i], point), 0);
  carrier.travel = { from: travel.to, to: travel.from, points: back, progress: 0, distance, speed: RIDER_SPEED, mode: 'horse', purpose: 'leave', causeId: travel.causeId || null, silent: true };
  carrier.task = 'travel';
}

/**
 * A rider still standing with this family when the question he brought lapses (sim/calls.mjs `lapseCall`): the meeting ends
 * as a rider who will wait no longer ends it, and he turns for home (`advanceDepartures`). Nothing a rider carries decides it.
 */
export function sendOnFrom(world, householdId) {
  const encounter = openFor(world, householdId);
  if (encounter && !encounter.kind) finish(world, encounter, 'unanswered');
}

/** Everything the listener could still ask, and nothing they could not. */
export function questionsFor(encounter) {
  return (CONVERSATIONS[encounter.topicId]?.lines || []).filter(line => !encounter.asked.includes(line.id));
}

export function askRider(world, householdId, entity, lineId) {
  const encounter = openFor(world, householdId);
  if (!encounter) throw new Error('Nobody is standing with your family to be asked.');
  if (encounter.listenerId !== entity.id) throw new Error(`${world.entities[encounter.listenerId].name} is the one standing with the rider.`);
  const line = questionsFor(encounter).find(candidate => candidate.id === lineId);
  if (!line) throw new Error('That has already been asked.');
  const asked = say(world, encounter, 'listener', line.ask, [encounter.metEventId]);
  const answer = line.answer(accountOf(world, encounter));
  say(world, encounter, 'rider', answer, [asked]);
  encounter.asked.push(line.id);
  // What the family understands really changed, and it outlives the conversation: the
  // report in the journal now carries what was asked and what came back.
  const report = world.knowledge.households[householdId]?.[encounter.topicId];
  if (report) report.details = [...(report.details || []), { ask: line.ask, answer }];
  return encounter;
}

export function leaveRider(world, householdId, entity) {
  const encounter = openFor(world, householdId);
  if (!encounter) throw new Error('Nobody is standing with your family to be sent on.');
  if (encounter.listenerId !== entity.id) throw new Error(`${world.entities[encounter.listenerId].name} is the one standing with the rider.`);
  if (encounter.kind === 'alamo-runner') throw new Error(`${encounter.carrierName} is waiting for an answer to take back to Colonel Travis.`);
  finish(world, encounter, 'farewell');
  return encounter;
}

/**
 * What a household may see of its own conversation.
 *
 * The answers are not here. A question that has not been put has its prompt on the wire -
 * those are the listener's own words - and its answer nowhere, so no snapshot ever holds
 * a reply the rider has not given. The most recent encounter keeps projecting after it
 * closes, because deferred reading is a requirement: a rider who has gone should still
 * be re-readable.
 */
export function encounterProjection(world, householdId, role) {
  if (role === 'host' || !householdId) return null;
  const mine = Object.values(world.encounters || {}).filter(e => e.householdId === householdId);
  const encounter = mine.find(e => e.status === 'open') || mine.at(-1);
  if (!encounter) return null;
  const open = encounter.status === 'open';
  // Travis's runner (sim/alamo-runner.mjs): what he said, the two answers while he waits, and what happens if nobody gives
  // one - the question lapses and nothing is chosen (sim/lapse.mjs), in words, before it happens. `pressing` once most of the real-time budget is gone
  // (sim/decision-budget.mjs). Nothing of any other family's runner, and nothing of what Travis will choose.
  if (encounter.kind === 'alamo-runner') {
    const listener = world.entities[encounter.listenerId];
    const clock = world.decisionClock?.[`courier:${encounter.listenerId}`];
    return {
      id: encounter.id, kind: encounter.kind, status: encounter.status, reason: encounter.reason || null, topicId: encounter.topicId,
      carrierId: encounter.carrierId, carrierName: encounter.carrierName, listenerId: encounter.listenerId,
      origin: 'From Colonel Travis’s quarters, inside the Alamo',
      said: encounter.said.map(({ speaker, text, minute }) => ({ speaker, text, minute })), questions: [],
      choices: open ? [{ answer: 'volunteer', label: `${listener?.name || 'They'} offers to ride out with the letters` }, { answer: 'stay', label: `${listener?.name || 'They'} stays inside the walls` }] : [],
      ifUnanswered: open && listener ? courierIfUnanswered(listener) : null,
      pressing: Boolean(open && clock && clock.spent >= clock.of * (2 / 3)),
    };
  }
  const said = accountOf(world, encounter);
  // What waits behind him, said calmly and only as a count (owner, 2026-09-29: "Players shouldn't miss anything, but also
  // shouldn't be quickly overwhelmed"): never what it is, which the family will see when he has gone.
  const behind = open ? waitingBehind(world, encounter) : { questions: 0, riders: 0 };
  const count = behind.questions + behind.riders;
  return {
    ...(count && { waiting: { count, words: count === 1 ? (behind.riders ? 'Another rider is waiting to speak with your family after this.' : 'One more thing is waiting for your family after this.') : `${count} more things are waiting for your family after this.` } }),
    id: encounter.id, status: encounter.status, reason: encounter.reason || null, topicId: encounter.topicId,
    carrierId: encounter.carrierId, carrierName: encounter.carrierName, listenerId: encounter.listenerId,
    origin: placeName(world, encounter.originSiteId),
    rodeForMinutes: encounter.openedMinute - encounter.departedMinute,
    observedAgoMinutes: encounter.departedMinute - encounter.observedMinute,
    // Who this came through, which is the family's own business: it is the provenance of
    // what was said to them, not a window into anybody else's errand. The people named
    // are the ones this rider named out loud in the opening line.
    firsthand: said.firsthand, hands: said.hands, toldBy: said.toldBy, toldAt: said.toldAt,
    reportStatus: encounter.reportStatus || 'confirmed',
    said: encounter.said.map(({ speaker, text, minute }) => ({ speaker, text, minute })),
    questions: open ? questionsFor(encounter).map(({ id, ask }) => ({ id, ask })) : [],
    // The real milliseconds he will wait yet, for the countdown on the "!" (owner, 2026-09-29, "Real-time limits").
    ...(riderOnLimit(world, encounter) && { leftMs: limitLeft(world, riderLimitKey(encounter), 'rider') }),
  };
}

/**
 * A rider this household can see, before a word is said.
 *
 * Anybody carrying news within sight of one of this family's own people - not only the
 * rider coming to them. Once a rider can stop for whoever they come alongside, watching
 * one pass your field and not rein in is a real and ordinary thing to see, and watching
 * the one who just spoke to you ride on towards a neighbour is how a student learns that
 * this is a chain. Seeing a rider on the road tells you a rider is on the road: `observedBy`
 * reduces them the same way it reduces everybody else, and what they carry never leaves
 * the server.
 */
export function ridersInSight(world, householdId) {
  // `observedBy` is called with whatever it is given, including a household that is not
  // one, and answering "nobody" is the safe answer rather than throwing at a caller.
  const household = world.households[householdId];
  if (!household) return [];
  const family = household.members.map(id => world.entities[id]);
  const sight = seenComing(world);
  const inSight = carrier => family.some(person => between(carrier.location, person.location) <= sight && !blockedByWater(world, carrier.location, person.location));
  const seen = [];
  // Whoever this family is standing with right now. A meeting is a modelled fact rather
  // than a distance query, and a rider who reined in out on the road holds no site - so
  // without this they vanished from the family's own view one tick into the conversation.
  const mine = Object.values(world.encounters || {}).filter(e => e.householdId === householdId);
  const met = mine.find(e => e.status === 'open') || mine.at(-1);
  const spokenWith = met && world.entities[met.carrierId];
  // Standing with them, or riding away and still in sight. Watching somebody go is the
  // other half of watching them come.
  if (spokenWith && !goneFromSight(spokenWith) && (met.status === 'open' || inSight(spokenWith))) seen.push(spokenWith);
  // **Every rider in sight** (owner, 2026-09-29, answering whether riders with nothing for the family are drawn: "Show all, but
  // show them riding at a normal looking speed, after they pass by have them fade away and speed up to make up for lost time.";
  // `FIC-GONZ-909`, docs/COLONIES.md §5.4b). Carrying word, or riding home with his errand done (`advanceDepartures`): a rider
  // on the road is seen going by either way, and the page draws one who is only passing at a riding pace near the family and
  // fades him out once he is by (`passingOf`, public/motion.js `passingSight`). Only a rider whose word was taken into this
  // family's own visit off the screen (`joinVisit`), or is about to be, is not drawn to it: that is the merging the owner asked
  // never to be seen. The Host sees every rider where he truly is (sim/overview.mjs).
  for (const carrier of Object.values(world.entities)) {
    if (seen.includes(carrier)) continue;
    if (!carrier.report?.inPerson && !carrier.leaving) continue;
    if (carrier.foldedInto === householdId || joiningHere(world, householdId, carrier, met)) continue;
    if (inSight(carrier)) seen.push(carrier);
  }
  return seen;
}
/** A rider bringing this family more of the word its visit is about: his word will be taken into it off the screen. */
function joiningHere(world, householdId, carrier, met) {
  const report = carrier.report;
  if (!report?.inPerson || report.audience !== householdId || !met || met.carrierId === carrier.id) return false;
  return Boolean(visitAbout(world, householdId, report.topicId));
}
/**
 * How far along his road a rider who is only passing this family comes nearest its home, for the page to draw him passing
 * at a riding pace (public/motion.js `passingSight`); or null for a rider who is not passing - the one bringing the family
 * word, the one talking with it or riding away from it - and for one with no road. In the miles his road's progress counts.
 * ceiling: measured to the family's home, not to wherever its people are; a family out on the road is passed by riders drawn
 * as if it were at home, which the fade hides unless a class notices it.
 */
export function passingOf(world, householdId, carrier) {
  const household = world.households[householdId], travel = carrier.travel;
  if (!household || !travel?.points?.length || travel.halted) return null;
  if (carrier.report?.audience === householdId && wouldLearn(world, householdId, carrier.report.topicId, carrier.report.status)) return null;
  if (Object.values(world.encounters || {}).some(one => one.householdId === householdId && one.carrierId === carrier.id)) return null;
  const home = world.map.sites[household.homeSiteId] || world.entities[household.members[0]]?.location;
  if (!home) return null;
  const near = nearestAlong(travel.points, 0, travel.distance, home);
  return near && Number.isFinite(near.progress) ? Math.round(near.progress * 1e6) / 1e6 : null;
}

// How long a line takes to say. Two ticks: long enough to read as speech, short enough
// that a rider is not still mouthing the same sentence a quarter of an hour later.
const SPEAKING_MINUTES = 40;
/**
 * Which way a halted rider is turned, and whether they are saying something.
 *
 * Both only exist while a meeting is open, and neither says anything about what is being
 * carried. `speaking` is deliberately a short window after a line rather than "the rider
 * spoke last": measured live, the rider always speaks last - they answer - so they held
 * the speaking loop for thirty solid ticks while nothing was being said, and the
 * delivered listening frames could not occur at all. Waiting to be asked something is
 * listening, which is also the truthful pose.
 */
export function facingOf(world, carrier) {
  const encounter = Object.values(world.encounters || {}).find(e => e.carrierId === carrier.id && e.status === 'open');
  if (!encounter) return null;
  const listener = world.entities[encounter.listenerId];
  if (!listener) return null;
  return turnedToward(world, encounter, carrier, listener, 'rider');
}
/**
 * The same two facts for the person the rider stopped, so that a conversation looks like a conversation from both sides.
 *
 * Astra delivered speaking and listening poses for the first cast on 2026-09-14 and for the second on 2026-09-21, and
 * until now nothing on either sheet was ever drawn: only the rider had a `facing` and a `speaking`, so the settler he had
 * reined in for stood in their idle pose with their back to him as often as not. The rule is exactly the rider's, and
 * reversed: `speaking` is the short window after a line THIS person said, so waiting to be answered reads as listening,
 * which is also the truthful pose.
 *
 * Both exist only while a meeting is open, and neither says a word about what is being carried: `said.speaker` is read
 * for who spoke, never for what was spoken.
 */
export function listeningOf(world, person) {
  const encounter = Object.values(world.encounters || {}).find(e => e.listenerId === person.id && e.status === 'open');
  if (!encounter) return null;
  const carrier = world.entities[encounter.carrierId];
  if (!carrier) return null;
  return turnedToward(world, encounter, person, carrier, 'listener');
}
/**
 * Which way `person` is turned to face `other`, and whether they have said something lately.
 *
 * The line read is the last one THIS speaker said, not the last line of all. For the rider that is the same line and the
 * same answer it always was, because a question and its answer are one action and the rider's answer is always last. For
 * the person asking it, "the last line of all" would have been the rider's answer a moment later and they would never
 * have been drawn speaking at all - the delivered speaking frames would have stayed unused for the same reason the
 * listening ones did. A question and an answer share a minute in this game, so for that window both figures are drawn
 * talking, which is what a conversation looks like from across a field.
 */
function turnedToward(world, encounter, person, other, speaker) {
  const said = [...encounter.said].reverse().find(line => line.speaker === speaker);
  return {
    // Turned toward the other: north or south when they are mostly above or below, since there is art for it.
    facing: Math.abs(other.location.y - person.location.y) > Math.abs(other.location.x - person.location.x) * 1.2
      ? (other.location.y < person.location.y ? 'n' : 's')
      : other.location.x < person.location.x ? 'w' : 'e',
    speaking: Boolean(said) && world.minute - said.minute < attention(world, SPEAKING_MINUTES, encounter.householdId),
  };
}
