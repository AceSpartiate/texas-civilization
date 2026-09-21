// The guided start, on the screen: public/lesson.js (owner, 2026-09-21 - "we need to have the tutorial be an integrated
// forced part of the game ... one task at a time, guided by the ui and unavoidable").
//
// The lesson itself is the server's, and arrives on the projection as `world.lesson`. What is held down here is the half
// the page owns and can get wrong: that the page never decides a step is finished, that a step shuts everything it does
// not allow and *only* what it does not allow, that an empty `allow` shuts everything while a missing `allow` shuts
// nothing, and that the one icon pointed at is one the server is already offering. public/lesson.js imports nothing, so
// all of it is checked here; what only a browser can show - the strip over the map, the ring round the icon, the rest of
// the bar plainly shut at 1366x768 - is scripts/lesson-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSettledWorld } from './support/settled.mjs';
import { projectWorld } from '../sim/world.mjs';
import { choreCatalogue } from '../sim/chores.mjs';
import { panelActions } from '../public/family-panel.js';
import { actionIdOf, allowsIcon, lessonAnnouncement, lessonLocks, lessonShowing, lessonWords, lockedNote, pointedKey } from '../public/lesson.js';

const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));
const lesson = (extra = {}) => ({ step: 'order', index: 2, of: 10, title: 'Put somebody to work', says: 'Press the axe.', did: null, allow: ['chore:build-house'], done: false, ...extra });

test('a lesson is drawn only while the world says there is one, and never on the Host', () => {
  assert.equal(lessonShowing({ lesson: lesson() })?.step, 'order');
  // "when the lesson is over, `view.lesson` is absent entirely" - and `done: true` is the same fact a tick earlier.
  assert.equal(lessonShowing({}), null);
  assert.equal(lessonShowing({ lesson: undefined }), null);
  assert.equal(lessonShowing({ lesson: lesson({ done: true }) }), null);
  assert.equal(lessonShowing({ role: 'host', lesson: lesson() }), null, 'the teacher was led by the hand through a lesson for a student');
  assert.equal(lessonShowing(null), null);
});

test('an empty allow shuts everything; a missing allow shuts nothing', () => {
  // "allow: every action id the student may take now". The step where the only thing to do is watch the wagon come in
  // sends none, and the screen must shut everything rather than letting a student walk into a refusal.
  const waiting = lesson({ step: 'arrive', allow: [] });
  assert.equal(lessonLocks(waiting), true);
  assert.equal(allowsIcon(waiting, { key: 'build-house', kind: 'chore' }), false);
  // A server older than the contract, or one that has not decided, must not lock a student out on the page's guess.
  const noField = lesson(); delete noField.allow;
  assert.equal(lessonLocks(noField), false);
  assert.equal(allowsIcon(noField, { key: 'build-house', kind: 'chore' }), true);
  assert.equal(lessonLocks(null), false);
  assert.equal(allowsIcon(null, { key: 'anything', kind: 'chore' }), true, 'a class with no lesson had its work shut');
});

test('a step allows exactly what it names, in any of the spellings a server would write', () => {
  const step = lesson({ allow: ['chore:build-house', 'order:rest', 'travel-gonzales'] });
  assert.equal(actionIdOf({ key: 'build-house', kind: 'chore' }), 'chore:build-house');
  assert.equal(actionIdOf({ key: 'rest', kind: 'order' }), 'order:rest');
  assert.equal(allowsIcon(step, { key: 'build-house', kind: 'chore' }), true);
  assert.equal(allowsIcon(step, { key: 'rest', kind: 'order' }), true, 'an order written the way the contract writes a chore');
  assert.equal(allowsIcon(step, { key: 'travel-gonzales', kind: 'order' }), true, 'a bare id');
  // And nothing else. A step that let one more thing through is a step that lets a student meet a refusal.
  for (const key of ['plant-field', 'hunt-timber', 'dig-well', 'stop-chore', 'travel-home', 'work']) {
    assert.equal(allowsIcon(step, { key, kind: key === 'plant-field' || key === 'hunt-timber' || key === 'dig-well' ? 'chore' : 'order' }), false, `${key} was let through`);
  }
  // A name that merely contains an allowed one is not that one.
  assert.equal(allowsIcon(lesson({ allow: ['chore:hunt-land'] }), { key: 'hunt', kind: 'chore' }), false);
  assert.equal(allowsIcon(lesson({ allow: ['chore:hunt'] }), { key: 'hunt-land', kind: 'chore' }), false);
});

test('the icon pointed at is one the server is already offering, and there is at most one', () => {
  const icons = [
    { key: 'plant-field', kind: 'chore', can: true }, { key: 'build-house', kind: 'chore', can: true },
    { key: 'dig-well', kind: 'chore', can: true }, { key: 'rest', kind: 'order', can: true },
  ];
  assert.equal(pointedKey(lesson(), icons), 'build-house');
  // Refused by the server: the page does not point at something that would say no.
  assert.equal(pointedKey(lesson(), icons.map(icon => (icon.key === 'build-house' ? { ...icon, can: false } : icon))), null);
  // Nothing allowed on this row - the step's work is a house plan, a place tapped on the map, or only waiting.
  assert.equal(pointedKey(lesson({ allow: [] }), icons), null);
  // No lesson: nothing is pointed at, and nothing is shut.
  assert.equal(pointedKey(null, icons), null);
});

test('the words are the server’s, and the page counts nothing', () => {
  const words = lessonWords(lesson({ index: 3, of: 10, did: 'The wagon reached your land.' }));
  assert.equal(words.eyebrow, 'STEP 3 OF 10');
  assert.equal(words.title, 'Put somebody to work');
  assert.equal(words.says, 'Press the axe.');
  assert.equal(words.did, 'The wagon reached your land.');
  assert.equal(words.done, 2, 'the pips filled are the steps behind the one the server says we are on');
  // `did` is null on a step where nothing has just happened, and the line is then empty rather than the word "null".
  assert.equal(lessonWords(lesson()).did, '');
  // Numbers the contract does not promise: a step with no count still says what to do.
  assert.equal(lessonWords({ step: 'order', title: 'x', says: 'y' }).eyebrow, 'WHAT TO DO NEXT');
  // ceiling: a server numbering from zero would say "step 0 of 10", which reads as broken to a child.
  assert.equal(lessonWords(lesson({ index: 0 })).eyebrow, 'STEP 1 OF 10');
  assert.equal(lessonWords(lesson({ index: 14, of: 10 })).eyebrow, 'STEP 10 OF 10', 'the page counted past the end of the lesson');
  assert.equal(lessonWords(null), null);
  // Everything the strip shows is said in one line to somebody who cannot see the ring round the icon.
  assert.match(lessonAnnouncement(words), /STEP 3 OF 10\. Put somebody to work\. Press the axe\. The wagon reached your land\./);
  assert.equal(lessonAnnouncement(null), '');
});

test('a shut icon says the one thing to do instead, and never scolds', () => {
  assert.equal(lockedNote(lesson()), 'Not this yet. Press the axe.');
  assert.equal(lockedNote(lesson({ says: '' })), 'Not this yet.');
});

test('nothing in the lesson module can say a step is finished', () => {
  // The rule this whole module exists to keep (the task, 2026-09-21): "never let the page decide that a step is complete".
  // A page that could would have had to remember something between snapshots, so the guard is that it remembers nothing:
  // the same lesson twice gives the same answer, and there is no export that advances anything.
  const source = readFileSync(fileURLToPath(new URL('../public/lesson.js', import.meta.url)), 'utf8');
  assert.equal(/\b(setTimeout|setInterval|localStorage|sessionStorage)\b/.test(source), false, 'the lesson module remembers something between snapshots');
  const module = { actionIdOf, allowsIcon, lessonAnnouncement, lessonLocks, lessonShowing, lessonWords, lockedNote, pointedKey };
  for (const [name, fn] of Object.entries(module)) assert.equal(typeof fn, 'function', `${name} is not a function`);
  const one = lesson();
  assert.deepEqual(lessonWords(one), lessonWords(one), 'the same step read twice gave two answers');
  assert.deepEqual(lessonWords(one), lessonWords({ ...one }), 'the words depend on which object the step arrived in');
});

test('against the real simulation: a step shuts the family’s whole bar but the work it asks for', () => {
  const world = createSettledWorld('lesson-screen', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const view = projectWorld(world, household.id, 'student');
  const home = view.household.homeSiteId;
  const id = household.principalId;
  const entity = view.entities.find(one => one.id === id);
  const icons = panelActions({ entity, offered: view.work[id], catalogue, main: true, homeId: home, atHome: entity.location?.siteId === home });
  assert.ok(icons.length > 4, `this seed offers too little to prove anything: ${icons.length}`);
  const open = icons.find(icon => icon.can && icon.kind === 'chore');
  assert.ok(open, 'the server offers this family no work at all on this seed');
  const step = lesson({ allow: [`chore:${open.key}`] });
  const shut = icons.filter(icon => !allowsIcon(step, icon));
  assert.equal(shut.length, icons.length - 1, 'more or fewer than one icon was left open');
  assert.equal(shut.some(icon => icon.key === open.key), false);
  assert.equal(pointedKey(step, icons), open.key);
  // And with no lesson the same bar is untouched, which is what every class before today gets.
  assert.deepEqual(icons.filter(icon => !allowsIcon(null, icon)), []);
});
