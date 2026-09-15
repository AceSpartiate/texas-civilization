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
export const SIGHT_MILES = 5;
// How long a rider will wait once they have said their piece. They have already been
// heard by the time this matters, so what runs out is the chance to ask anything further,
// and every question asked resets it.
//
// Sixty ticks - a minute of a real classroom at the shipped tick rate. It is a number
// about a student noticing a prompt and reading five lines, not about how long a rider
// would really sit on a horse, and at twenty fictional minutes a tick the two cannot both
// be right. `FIC-GONZ-003` already owns that whole disagreement. Untuned: it was half
// this, and half this was not long enough to notice a conversation and open it.
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
  learn(world, encounter.householdId, encounter.topicId, {
    status: report.status, hands: said.hands,
    source: said.firsthand
      ? `${carrier.name}, who rode from ${said.origin}`
      : `${carrier.name}, who had it from ${said.toldBy} at ${said.toldAt}${said.tellerSaw ? '' : ', and it had passed through other hands before that'}`,
    causes: [spokenId],
  });
  return encounter;
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
    if (carrier.travel) { delete carrier.travel.halted; carrier.travel.scannedProgress = carrier.travel.progress; }
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
    const carrier = world.entities[encounter.carrierId], listener = world.entities[encounter.listenerId];
    if (!carrier || !listener || !canSpeak(listener)) { finish(world, encounter, 'parted'); continue; }
    // A little hysteresis, so a listener shifting about their own yard does not end a
    // conversation. Walking away from it does.
    const apart = between(carrier.location, listener.location);
    const together = (carrier.location.siteId && carrier.location.siteId === listener.location.siteId)
      || (apart <= EARSHOT_MILES * 2 && !blockedByWater(world, carrier.location, listener.location));
    if (!together) { finish(world, encounter, 'parted'); continue; }
    // Somebody met on the way gets a short stop; the family the word is for gets as long
    // as it takes, because by then the rider has nowhere else to be.
    const errand = carrier.report && carrier.report.audience !== encounter.householdId;
    if (world.minute - encounter.lastSpokenMinute >= (errand ? PASSING_MINUTES : PATIENCE_MINUTES)) finish(world, encounter, 'unanswered');
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
      // One family listens to one person at a time.
      if (openFor(world, household.id)) continue;
      if (!wouldLearn(world, household.id, report.topicId, report.status)) continue;
      for (const id of household.members) {
        const person = world.entities[id];
        if (!canSpeak(person)) continue;
        // Cheap reject before measuring the ride: nothing on the stretch just covered can
        // have come within earshot of somebody further off than that stretch plus earshot.
        if (stretch && between(carrier.location, person.location) > stretch + EARSHOT_MILES) continue;
        const near = approachTo(world, carrier, person);
        if (!near) continue;
        // Nearest first, then by id, so the same class always meets the same person.
        if (!best || near.distance < best.near.distance || (near.distance === best.near.distance && id < best.person.id)) best = { near, person, householdId: household.id };
      }
    }
    // The stretch is only marked as looked at once both passes have looked at it.
    if (!best) {
      if (!ownOnly && carrier.travel) carrier.travel.scannedProgress = carrier.travel.progress;
      if (!ownOnly) delete report.lastLeg;
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
  const said = accountOf(world, encounter);
  return {
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
  const inSight = carrier => family.some(person => between(carrier.location, person.location) <= SIGHT_MILES && !blockedByWater(world, carrier.location, person.location));
  const seen = [];
  // Whoever this family is standing with right now. A meeting is a modelled fact rather
  // than a distance query, and a rider who reined in out on the road holds no site - so
  // without this they vanished from the family's own view one tick into the conversation.
  const mine = Object.values(world.encounters || {}).filter(e => e.householdId === householdId);
  const met = mine.find(e => e.status === 'open') || mine.at(-1);
  const spokenWith = met && world.entities[met.carrierId];
  // Standing with them, or riding away and still in sight. Watching somebody go is the
  // other half of watching them come, and it is how a student sees that the rider they
  // were talking to has now gone on to tell somebody else.
  if (spokenWith && (met.status === 'open' || inSight(spokenWith))) seen.push(spokenWith);
  for (const carrier of Object.values(world.entities)) {
    if (seen.includes(carrier)) continue;
    if (!carrier.report?.inPerson) continue;
    if (inSight(carrier)) seen.push(carrier);
  }
  return seen;
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
  const said = encounter.said.at(-1);
  return {
    // Turned toward the listener: north or south when they are mostly above or below, since there is art for it.
    facing: Math.abs(listener.location.y - carrier.location.y) > Math.abs(listener.location.x - carrier.location.x) * 1.2
      ? (listener.location.y < carrier.location.y ? 'n' : 's')
      : listener.location.x < carrier.location.x ? 'w' : 'e',
    speaking: said?.speaker === 'rider' && world.minute - said.minute < SPEAKING_MINUTES,
  };
}
