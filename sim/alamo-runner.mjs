// Travis's runner: the local Alamo courier encounter (owner, 2026-09-22: "Military: build the real local Alamo runner
// encounter next"; docs/MILITARY_EXPERIENCE.md step 1; docs/ALAMO_FATES.md).
//
// On a day Travis sent riders out (`HIST-TEX-055`, `-431`), a man of the garrison walks from the colonel's quarters in the
// west range, across the compound's plaza, to each played person inside who could carry a letter. He is a person in the
// world, not a line of text: he stands at the door, walks at a steady pace, stops beside the person and says what the
// colonel wants. Only then is the question open (`service.courier === 'open'`), and only that family hears what he says.
// Everybody else standing in the Alamo sees one of the garrison cross the plaza, which is all standing there would show.
//
// Once answered - or once nobody has answered in time (sim/decision-budget.mjs, sim/alamo.mjs `settleUnanswered`) - he
// says so, and walks back to the door, where he waits for the next time the colonel sends him.
//
// Invented (`FIC-GONZ-380`): the runner, his name, his words, his pace, and where each person stands inside the walls.
// The compound's plan is the one the map draws (public/alamo-layout.js, public/bexar-layout.js `alamoOnMap`).
import { record } from './events.mjs';
import { establishTruth } from './knowledge.mjs';
import { share } from './alamo.mjs';

/**
 * Where the compound's plan lies on the map: its origin (the north-west corner of the plan, public/alamo-layout.js) in miles
 * east and south of Béxar's site point. The plan is laid north-up at its true feet (public/bexar-layout.js `alamoOnMap`), so a
 * foot of the plan is a foot of the map. Copied as numbers because nothing under sim/ reads the renderer
 * (tests/movement.test.mjs); tests/alamo-runner.test.mjs fails if this and `alamoOnMap` ever part.
 */
export const ALAMO_ORIGIN = Object.freeze({ x: 0.28673085317694386, y: -0.1601460310951376 });
const alamoOnMap = feet => ({ x: ALAMO_ORIGIN.x + feet.x / 5280, y: ALAMO_ORIGIN.y + feet.y / 5280 });

/** The east door of the first west-range room, labelled "Travis / Joe quarters · reconstructed" on the plan, in its feet. */
export const TRAVIS_DOOR = Object.freeze({ x: 18, y: 64 });
/**
 * How far the runner goes in a tick, in the compound's feet.
 *
 * ceiling: a steady pace in real seconds, not in minutes of 1836. At the Study pace (9.5 s a tick) ninety feet is a man
 * jogging, which is what the continuity contract asks of local motion (docs/MILITARY_EXPERIENCE.md: "Local motion has a
 * stable rhythm"); the same crossing measured in the calendar a tick stands for would be a stroll of twenty minutes. The
 * crossing takes one to five ticks, so the approach is seen. Quick pace shortens it with everything else; undo when local
 * motion has its own clock.
 */
export const RUNNER_FEET_PER_TICK = 90;
/** How near he stands to the person he speaks to. */
export const BESIDE_FEET = 6;
export const RUNNER_TOPIC = 'alamo-couriers';
// Invented men of the garrison, like the riders of `FIC-GONZ-013`: not names from the roll of the Alamo's defenders.
const RUNNER_NAMES = ['Asa Linthicum', 'Jonas Pettibone', 'Hiram Quayle', 'Levi Tuttlebee', 'Micah Osterhout', 'Ezra Vanlandt'];
const FEET_PER_MILE = 5280;
const GONE = ['dead', 'captured'];

const bexar = world => world.map?.sites?.bexar;
/** A point of the compound's plan, in feet, as a point on the map. */
export function onMap(world, feet) {
  const site = bexar(world), offset = alamoOnMap(feet);
  return { x: site.x + offset.x, y: site.y + offset.y, siteId: 'bexar' };
}
/** Where this person stands inside the walls: somewhere on the main plaza, always the same place for the same person. */
export const postOf = (world, person) => ({ x: 40 + 140 * share(world, person.id, 'alamo-post-x'), y: 130 + 280 * share(world, person.id, 'alamo-post-y') });
/** Put somebody shut in the Alamo at their place inside it. The town's point on the map is the Main Plaza, not the fort. */
export function takePost(world, person) {
  if (!bexar(world)) return;
  person.location = onMap(world, postOf(world, person));
}

const runnerId = person => `alamo-runner-${person.id}`;
export const runnerOf = (world, person) => world.entities[runnerId(person)] || null;
/** The runner who comes to this person: made the first time, and the same man every time after. */
function runnerFor(world, person) {
  const id = runnerId(person);
  if (!world.entities[id]) {
    const count = Object.values(world.entities).filter(entity => entity.runner).length;
    world.entities[id] = {
      id, name: RUNNER_NAMES[count % RUNNER_NAMES.length], kind: 'person', householdId: null, depth: 'moderate', principal: false,
      sex: 'male', age: 24, location: onMap(world, TRAVIS_DOOR), task: 'rest', health: { condition: 'well' }, travel: null,
      runner: { forId: person.id, phase: 'waiting' },
    };
  }
  return world.entities[id];
}

/** Send the runner to this person with the colonel's call for riders. The question opens when he reaches them. */
export function sendRunner(world, person, day) {
  if (!bexar(world)) { person.service.courier = 'open'; return null; }
  if (!world.truth[RUNNER_TOPIC]) establishTruth(world, { id: RUNNER_TOPIC, text: 'Travis sent riders out of the Alamo through the Mexican lines with his letters during the siege.', siteId: 'bexar', classification: 'DOCUMENTED', claimId: 'HIST-TEX-431' });
  const runner = runnerFor(world, person);
  runner.runner = { forId: person.id, day, phase: 'going' };
  runner.task = 'travel';
  person.service.courier = 'coming';
  return runner;
}

const feetBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * FEET_PER_MILE;
/** One tick's walk toward a point, stopping `short` feet from it. True when there. */
function walk(runner, target, short) {
  const apart = feetBetween(runner.location, target);
  const left = Math.max(0, apart - short);
  const step = Math.min(RUNNER_FEET_PER_TICK, left);
  const part = apart ? step / apart : 0;
  runner.location = { x: runner.location.x + (target.x - runner.location.x) * part, y: runner.location.y + (target.y - runner.location.y) * part, siteId: 'bexar' };
  return left - step < 1e-6;
}

/** What the runner says, by the night it is (`HIST-TEX-431`) and whether this person offered before and was not sent. */
export function runnerOpening(day, offeredBefore) {
  const night = {
    'courier-1': 'Colonel Travis is sending a letter out tonight to the people of Texas, and he wants riders who will carry it through the Mexican lines.',
    'courier-2': 'Captain Seguín is going out tonight to bring help, and the colonel wants other riders to go out with letters too.',
    'courier-3': 'The colonel has written to the convention, and he wants his letters carried out tonight. The Mexican lines are closer every night.',
    'courier-4': 'The colonel wants riders out tonight with letters for Colonel Fannin at Goliad. The Mexican lines are close around the walls now, and there may not be many more chances to get a man through.',
  }[day] || 'The colonel wants riders to carry his letters out through the Mexican lines tonight.';
  const before = offeredBefore ? 'You offered before and he sent other men. ' : '';
  return `${before}${night} He asks whether you will offer to go. He chooses his riders from the men who offer, and not every man who offers is sent. A man who is sent leaves the fort tonight and rides for help. A man who stays keeps his post inside the walls.`;
}
/** What becomes of this person if nobody answers the runner: the documented fallback, said before it happens. */
export const ifUnanswered = person => `If nobody answers in time, it will be decided for ${person.name}, as a person on auto decides.`;

function say(world, encounter, speaker, text, causes = []) {
  const who = speaker === 'rider' ? encounter.carrierName : world.entities[encounter.listenerId].name;
  const eventId = record(world, 'spoken', {
    householdId: encounter.householdId, importance: 2, actorId: speaker === 'rider' ? encounter.carrierId : encounter.listenerId,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-380', causes, text: `${who}: “${text}”`,
  });
  encounter.said.push({ speaker, text, minute: world.minute, eventId });
  encounter.lastSpokenMinute = world.minute;
  return eventId;
}

/** He has reached them: the meeting opens, he says his piece, and the question is in front of the family. */
function openRunner(world, runner, person) {
  world.encounters ??= {};
  world.nextEncounterId ??= 1;
  const id = `enc-${world.nextEncounterId++}`;
  const job = runner.runner;
  job.phase = 'speaking';
  runner.task = 'rest';
  person.service.courier = 'open';
  const encounter = world.encounters[id] = {
    id, kind: 'alamo-runner', carrierId: runner.id, carrierName: runner.name, householdId: person.householdId, listenerId: person.id,
    topicId: RUNNER_TOPIC, day: job.day, status: 'open', openedMinute: world.minute, lastSpokenMinute: world.minute,
    place: { x: runner.location.x, y: runner.location.y, siteId: 'bexar' }, said: [], asked: [],
  };
  encounter.metEventId = record(world, 'encounter', {
    householdId: person.householdId, actorId: person.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-380',
    causes: world.truth[RUNNER_TOPIC]?.eventId ? [world.truth[RUNNER_TOPIC].eventId] : [],
    text: `${runner.name} came across the plaza from Colonel Travis's quarters to speak with ${person.name}.`,
  });
  const spoken = say(world, encounter, 'rider', runnerOpening(job.day, person.service.courierOffer), [encounter.metEventId]);
  record(world, 'pressure', {
    actorId: person.id, householdId: person.householdId, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-055', causes: [spoken],
    text: `Travis wants riders to carry letters out through the Mexican lines. ${person.name} can offer to go. ${ifUnanswered(person)}`,
  });
  return encounter;
}

export const openRunnerFor = (world, person) => Object.values(world.encounters || {}).find(one => one.kind === 'alamo-runner' && one.status === 'open' && one.listenerId === person.id) || null;

/**
 * The meeting ends: what was answered is said aloud, and the runner turns back for the colonel's door. `how` is 'volunteer'
 * or 'stay' for an answer, or 'unanswered' with `offers` saying what was decided for them.
 */
export function closeRunner(world, person, how, offers) {
  const runner = runnerOf(world, person);
  const encounter = openRunnerFor(world, person);
  if (encounter) {
    if (how === 'volunteer') { say(world, encounter, 'listener', 'I will go, if he will send me.'); say(world, encounter, 'rider', 'I will tell the colonel. He chooses his riders before dark.'); }
    else if (how === 'stay') { say(world, encounter, 'listener', 'I will stay at my post.'); say(world, encounter, 'rider', 'I will tell the colonel you are staying.'); }
    else say(world, encounter, 'rider', offers ? 'I cannot wait any longer on an answer. I will tell the colonel you will go if he sends you.' : 'I cannot wait any longer on an answer. I will tell the colonel you are staying at your post.');
    Object.assign(encounter, { status: 'closed', closedMinute: world.minute, reason: how === 'unanswered' ? 'unanswered' : 'answered' });
  }
  if (runner?.runner && runner.runner.forId === person.id && runner.runner.phase !== 'waiting') { runner.runner.phase = 'returning'; runner.task = 'travel'; }
}

/** Each tick, before the director: runners walk to the people they were sent to, or back to the colonel's door. */
export function advanceRunners(world) {
  if (!bexar(world)) return;
  for (const runner of Object.values(world.entities)) {
    const job = runner.runner;
    if (!job || job.phase === 'waiting' || job.phase === 'speaking') continue;
    const person = world.entities[job.forId];
    if (job.phase === 'going') {
      // Whoever he was sent to is no longer there to be asked: he goes back.
      if (!person || GONE.includes(person.health?.condition) || !person.service?.besieged || person.service.courier !== 'coming') { job.phase = 'returning'; continue; }
      if (walk(runner, person.location, BESIDE_FEET)) openRunner(world, runner, person);
    } else if (job.phase === 'returning' && walk(runner, onMap(world, TRAVIS_DOOR), 0)) {
      job.phase = 'waiting'; runner.task = 'rest';
    }
  }
}

/** A saved runner that cannot be, or null. */
export function runnerInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    if (!entity.runner) continue;
    if (entity.householdId) return 'A runner belongs to no family';
    if (!['waiting', 'going', 'speaking', 'returning'].includes(entity.runner.phase)) return 'Invalid runner phase';
    if (!world.entities[entity.runner.forId]) return 'A runner sent to nobody';
  }
  for (const encounter of Object.values(world.encounters || {})) {
    if (encounter.kind !== undefined && encounter.kind !== 'alamo-runner') return 'Invalid encounter kind';
  }
  return null;
}
