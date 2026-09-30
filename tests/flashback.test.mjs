// The end-of-game flashback's story (sim/flashback.mjs) and the trip home it ends on (sim/homecoming.mjs): docs/FLASHBACK.md.
//
// One whole class on the real land is played headless to its end once (tests/support/ended-class.mjs) and every test reads a
// copy of it. What is held:
//   - every family gets a story of ten to fifteen beats sharing out exactly one minute, in the order it happened;
//   - a death is told in plain words, with no gore, and a death of sickness never names who died;
//   - glory is never in the story, so no beat can show a death rewarded; no virtue word is anywhere in it;
//   - every "meanwhile" is a true happening of the world (`world.truth`), dated as it really happened, and one the family had
//     not heard of at that moment;
//   - nothing exists until the class has ended for good (not at the interim standings, never while it runs);
//   - the trip home is the game's own road home, deterministic, leaves the saved class untouched, and comes home to the house
//     as it truly stands: ashes where it burned, standing where it did not.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { endedClass } from './support/ended-class.mjs';
import { EPILOGUE_MS, FLASHBACK_MS, FEWEST_BEATS, GORE_WORDS, MOST_BEATS, VIRTUE_WORDS, flashbackReady, flashbackScript, flashbackScripts, happenings } from '../sim/flashback.mjs';
import { homecomings } from '../sim/homecoming.mjs';
import { record } from '../sim/events.mjs';

// FLASHBACK_FIXTURE: the same class saved to a file (scripts or a previous run), to try an injected regression in seconds.
const ENDED = process.env.FLASHBACK_FIXTURE ? JSON.parse(readFileSync(process.env.FLASHBACK_FIXTURE, 'utf8')) : endedClass('flashback-test', 5, { played: 2 });
const fresh = () => structuredClone(ENDED);
const SCRIPTS = flashbackScripts(fresh());
const words = script => script.beats.flatMap(beat => [beat.caption, beat.meanwhile?.text, beat.meanwhile?.heard]).filter(Boolean);
const hasWord = (text, word) => new RegExp(`\\b${word}\\b`, 'i').test(text);

test('every family gets a story of ten to fifteen beats that share out exactly one minute, in the order it happened, and the homecoming after it', () => {
  assert.equal(Object.keys(SCRIPTS).length, Object.keys(ENDED.households).length);
  for (const [id, script] of Object.entries(SCRIPTS)) {
    // The story's minute (owner, 2026-09-28), then the homecoming's scenes each at its own length (owner, 2026-09-29, D10).
    const story = script.beats.filter(beat => !beat.epilogue), after = script.beats.filter(beat => beat.epilogue);
    assert.ok(story.length >= FEWEST_BEATS && story.length <= MOST_BEATS, `${id} has ${story.length} beats`);
    assert.equal(script.beats[0].kind, 'title');
    assert.equal(script.beats.at(-1).kind, 'closing');
    assert.equal(story.reduce((sum, beat) => sum + beat.durationMs, 0), FLASHBACK_MS, `${id}'s story is not a minute`);
    assert.equal(script.durationMs, FLASHBACK_MS + after.reduce((sum, beat) => sum + EPILOGUE_MS[beat.kind], 0), `${id}'s homecoming is not its scenes' lengths`);
    assert.equal(script.beats.reduce((sum, beat) => sum + beat.durationMs, 0), script.durationMs, `${id}'s beats do not add up to its length`);
    let at = 0;
    for (const beat of script.beats) { assert.equal(beat.startMs, at, `${id}: beat ${beat.index} does not follow the last`); at += beat.durationMs; assert.ok(beat.durationMs >= 2500, `${id}: a beat of ${beat.durationMs} ms cannot be read`); }
    const minutes = script.beats.slice(1, -1).map(beat => beat.minute);
    assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b), `${id}'s beats are out of order`);
    for (const beat of script.beats) assert.ok(beat.caption && beat.caption.length < 260, `${id}: a caption too long to read: ${beat.caption}`);
    assert.equal(script.transcript.length, script.beats.length, 'the captions as words, one a beat');
  }
  // What the owner asked for is in it: the arrival, the flight, and the trip home as the last beats.
  const first = SCRIPTS['hh-1'];
  assert.ok(first.beats.some(beat => beat.kind === 'arrival'), 'no arrival');
  assert.ok(first.beats.some(beat => ['flight', 'stayed'].includes(beat.kind)), 'no flight');
  assert.ok(first.beats.at(-2).homecoming, 'the trip home is not the last beat before the close');
});

test('no word in any family\'s flashback is a virtue or gore, and glory is never in it', () => {
  for (const [id, script] of Object.entries(SCRIPTS)) {
    for (const text of words(script)) {
      for (const word of VIRTUE_WORDS) assert.ok(!hasWord(text, word), `${id}: "${word}" in "${text}"`);
      for (const word of GORE_WORDS) assert.ok(!hasWord(text, word), `${id}: "${word}" in "${text}"`);
      assert.ok(!/\bglory\b|\bpoints?\b/i.test(text), `${id}: glory in "${text}"`);
    }
  }
});

test('a death in battle is one plain sentence, and nothing about it is a reward', () => {
  const world = fresh();
  const household = world.households['hh-2'];
  const man = world.entities[household.members.find(id => world.entities[id].kin?.role === 'father')];
  man.health = { condition: 'dead' };
  man.service = { ...(man.service || {}), status: 'fell' };
  record(world, 'consequence', { householdId: household.id, actorId: man.id, importance: 3, claimId: 'HIST-TEX-058', text: `${man.name} was killed when the Alamo was stormed at dawn on March 6, on the north battery with the garrison. The garrison was overwhelmed.` });
  // As the game awards it: glory for having been there, never for the death (docs/MONEY_AND_GLORY.md §4).
  world.glory ||= {}; world.glory[household.id] ||= { total: 0, awards: {} };
  world.glory[household.id].awards[`alamo:${man.id}`] = { event: 'alamo', personId: man.id, role: 'fought', miles: 80, points: 30, minute: world.minute - 70 * 1440 };
  const script = flashbackScript(world, household.id);
  const death = script.beats.find(beat => beat.death);
  assert.ok(death, 'the death is not in the story');
  assert.match(death.caption, new RegExp(`${man.name.split(' ')[0]} was killed`));
  for (const text of words(script)) {
    // The award's 30, not the family's own 30 food on the wagon east (found 2026-09-28 on the merge with more hands at the field,
    // when this family happened to load exactly 30 food).
    assert.ok(!/\bglory\b|\bpoints?\b|\b30\b(?! (food|powder|seed|cotton|reales?|loads?)\b)/.test(text), `a number or glory beside a death: "${text}"`);
    for (const word of GORE_WORDS) assert.ok(!hasWord(text, word), `"${word}" in "${text}"`);
  }
  assert.match(script.beats.at(-1).caption, /did not come home/);
});

test('a death in battle is told once, in its fight\'s own beat, never again as the day the family heard', () => {
  // Found by the end sequence's proof (2026-09-29): a man killed at the Alamo was told in the fight's beat, and again ten days later -
  // the day his family heard - as "killed at Travis drew a line in the sand", a phrase of the history after the record's first sentence.
  let fallen = 0;
  for (const [id, script] of Object.entries(SCRIPTS)) {
    for (const person of ENDED.households[id].members.map(pid => ENDED.entities[pid]).filter(one => one.health?.condition === 'dead' && !one.health.disease)) {
      const first = person.name.split(' ')[0];
      const told = script.beats.filter(beat => !beat.epilogue && beat.kind !== 'closing' && new RegExp(`\\b${first} was killed\\b`).test(beat.caption));
      if (!told.length) continue;
      fallen++;
      assert.equal(told.length, 1, `${id}: ${first}'s death told ${told.length} times: ${told.map(beat => beat.caption).join(' | ')}`);
      for (const beat of told) assert.doesNotMatch(beat.caption, /killed at [A-Z][a-z]+ [a-z]/, `${id}: ${beat.caption}`);
    }
  }
  assert.ok(fallen >= 1, 'nobody in this class fell in a fight: the test tries nothing');
});

test('a death of sickness is told without the name of who died', () => {
  const world = fresh();
  const household = world.households['hh-3'];
  const child = world.entities[household.members.find(id => ['son', 'daughter'].includes(world.entities[id].kin?.role))];
  child.health = { condition: 'dead', disease: 'measles' };
  child.location = { ...child.location, siteId: 'liberty' };
  // The record's own sentence (sim/disease.mjs `die`), which names them in the family's own record.
  record(world, 'consequence', { householdId: household.id, actorId: child.id, importance: 3, claimId: 'HIST-TEX-065', sickness: 'died', disease: 'measles', text: `${child.name} died of the measles at Liberty, and was buried there.` });
  const script = flashbackScript(world, household.id);
  const loss = script.beats.find(beat => beat.kind === 'loss');
  assert.ok(loss, 'the death is not in the story');
  assert.match(loss.caption, /died of the measles/);
  for (const text of words(script)) assert.ok(!text.includes(child.name), `the child who died of sickness is named: "${text}"`);
  assert.ok(script.transcript.every(line => !line.includes(child.name)));
});

test('every "meanwhile" is a true happening, dated as it happened, that the family had not yet heard of', () => {
  let shown = 0;
  for (const [id, script] of Object.entries(SCRIPTS)) {
    const heard = ENDED.knowledge.households[id] || {};
    const truths = new Map(happenings(ENDED, id).map(one => [one.topicId, one]));
    for (const beat of script.beats.filter(one => one.meanwhile)) {
      shown++;
      const meanwhile = beat.meanwhile;
      assert.ok(ENDED.truth[meanwhile.topicId], `${id}: "${meanwhile.text}" is not a truth of the world`);
      assert.equal(meanwhile.minute, truths.get(meanwhile.topicId).minute, `${id}: "${meanwhile.text}" is not dated as it happened`);
      // Not known to the family at that moment: never heard, or heard after the beat.
      const when = heard[meanwhile.topicId]?.receivedMinute;
      assert.ok(when === undefined || when > beat.minute, `${id}: the family already knew "${meanwhile.text}" at beat ${beat.index}`);
      assert.equal(meanwhile.heardMinute ?? undefined, when, `${id}: when the family heard is not its own record's`);
      assert.ok(meanwhile.minute <= beat.minute + 720, `${id}: "${meanwhile.text}" is after the beat it is shown with`);
    }
  }
  assert.ok(shown >= 10, `only ${shown} "meanwhile" in the class`);
});

test('the flashback exists only once the class has ended for good', () => {
  const running = fresh();
  running.status = 'running';
  assert.equal(flashbackReady(running), false);
  assert.equal(flashbackScript(running, 'hh-1'), null);
  assert.deepEqual(flashbackScripts(running), {});
  // The interim standings of the first period are not the end.
  const interim = fresh();
  interim.period = 1; interim.director.milestones['bexar-end'] = true;
  assert.equal(flashbackReady(interim), false);
  assert.equal(flashbackReady(fresh()), true);
});

test('the trip home is deterministic and leaves the saved class as it was', () => {
  const world = fresh();
  const before = JSON.stringify(world);
  const once = homecomings(world), again = homecomings(world);
  assert.equal(JSON.stringify(world), before, 'the homecoming changed the saved class');
  assert.deepEqual(once, again);
  assert.deepEqual(once, homecomings(fresh()), 'a copy of the same class came home differently');
});

test('every family on the road comes home, to the house as it truly stands', () => {
  const world = fresh();
  const { trips, endMinute } = homecomings(world);
  let travelled = 0, burned = 0, standing = 0;
  for (const household of Object.values(world.households)) {
    const trip = trips[household.id];
    if (['fled', 'refuged', 'returning'].includes(household.flight?.status)) {
      travelled++;
      assert.equal(trip.status, 'trip', `${household.id} did not set out`);
      assert.ok(trip.arrivedMinute > endMinute, `${household.id} never got home`);
      assert.ok(trip.miles > 0 && trip.route.length >= 2, `${household.id} has no road home`);
    }
    // The house as it truly is: ashes where the class burned it, standing where it did not.
    const cabin = household.improvements?.cabin;
    if (household.flight?.burned) { burned++; assert.equal(trip.house, 'burned', `${household.id} burned and came home to a standing house`); }
    else if (cabin === 'sound' || household.house) { standing++; assert.equal(trip.house, 'standing', `${household.id} came home to ${trip.house}`); }
    if (Number.isFinite(trip.arrivedMinute)) assert.ok(trip.texts.some(line => /^The family is home/.test(line.text)), `${household.id}'s homecoming wrote nothing`);
  }
  assert.ok(travelled >= 2 && burned >= 1 && standing >= 1, `the class did not try it: ${travelled} travelled, ${burned} burned, ${standing} standing`);
  // And the story says it as it is.
  for (const household of Object.values(world.households)) {
    const home = SCRIPTS[household.id].beats.find(beat => beat.kind === 'home');
    if (!home) continue;
    assert.match(home.caption, household.flight?.burned ? /ashes/ : /still standing|no house/, `${household.id}: ${home.caption}`);
  }
});
