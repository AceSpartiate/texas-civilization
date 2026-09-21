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
import { ALWAYS, STEPS, actionId } from '../sim/lesson.mjs';

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

test('an icon carries the id the server matches on, and the three journeys are one action', () => {
  // `actionId` in sim/lesson.mjs is the authority: a chore is `chore:<id>`, everything else is the action's own name, and
  // Travel to Gonzales, Return home and Go to a neighbour's homestead all send `travel`.
  assert.equal(actionIdOf({ key: 'build-house', kind: 'chore' }), 'chore:build-house');
  assert.equal(actionIdOf({ key: 'rest', kind: 'order' }), 'rest');
  assert.equal(actionIdOf({ key: 'work', kind: 'order' }), 'work');
  assert.equal(actionIdOf({ key: 'stop-chore', kind: 'order' }), 'stop-chore');
  for (const key of ['travel-gonzales', 'travel-home', 'visit']) assert.equal(actionIdOf({ key, kind: 'order' }), 'travel', `${key} is not sent as travel`);
  assert.equal(actionIdOf({ key: 'visit', kind: 'order', visit: true }), 'travel');
  assert.equal(actionIdOf({ key: 'travel-gonzales', kind: 'order', destination: 'gonzales' }), 'travel');
  assert.equal(actionIdOf(null), '');
});

test('what the lesson always allows is never dimmed: the journeys, the yard and rest', () => {
  // `ALWAYS` in sim/lesson.mjs is carried in every step's `allow`, and the page read `order:<key>`, which matches nothing
  // the server sends - so every journey, Work about the place and Rest were dimmed on every step (found 2026-09-21).
  const always = ['rename', 'set-main', 'work', 'rest', 'travel', 'stop-chore', 'answer-chore', 'flee'];
  const step = lesson({ allow: [...always, 'chore:build-house'] });
  for (const key of ['travel-gonzales', 'travel-home', 'visit']) {
    assert.equal(allowsIcon(step, { key, kind: 'order' }), true, `${key} was dimmed although the lesson always allows travel`);
  }
  for (const key of ['work', 'rest', 'stop-chore']) assert.equal(allowsIcon(step, { key, kind: 'order' }), true, `${key} was dimmed`);
  assert.equal(allowsIcon(step, { key: 'build-house', kind: 'chore' }), true);
  // And the work the step does not name is still shut.
  for (const key of ['plant-field', 'hunt-timber', 'dig-well']) assert.equal(allowsIcon(step, { key, kind: 'chore' }), false, `${key} was let through`);
});

test('a step allows exactly what it names, in either spelling the server writes', () => {
  // sim/lesson.mjs writes some of its own work bare - `['survey-plot']`, `['clear-plot', 'fence-plot']`, `['hunt-land',
  // 'chore:hunt-timber']` - so both are read, or the page would dim the very work the step is asking for.
  const step = lesson({ allow: ['chore:build-house', 'survey-plot'] });
  assert.equal(allowsIcon(step, { key: 'build-house', kind: 'chore' }), true);
  assert.equal(allowsIcon(step, { key: 'survey-plot', kind: 'chore' }), true, 'work the step names bare was dimmed');
  for (const key of ['plant-field', 'hunt-timber', 'dig-well', 'clear-plot']) {
    assert.equal(allowsIcon(step, { key, kind: 'chore' }), false, `${key} was let through`);
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

test('the id an icon carries is the id the server matches on, for every icon the bar can hold', () => {
  // The one way a student meets a refusal the screen did not show them is the screen and the gate spelling an action
  // differently. `actionId` in sim/lesson.mjs is what `lessonRefusal` looks up; `actionIdOf` here is what the page dims
  // by. This walks every shape `panelIcon` in public/app.js builds and holds the two to the same answer.
  const sent = [
    [{ key: 'plant-field', kind: 'chore' }, { action: 'chore', chore: 'plant-field' }],
    [{ key: 'survey-plot', kind: 'chore', onMap: true }, { action: 'chore', chore: 'survey-plot' }],
    [{ key: 'travel-gonzales', kind: 'order', destination: 'gonzales' }, { action: 'travel', destination: 'gonzales' }],
    [{ key: 'travel-home', kind: 'order', destination: 'home' }, { action: 'travel', destination: 'home-1' }],
    [{ key: 'visit', kind: 'order', visit: true }, { action: 'travel', destination: 'home-2' }],
    [{ key: 'work', kind: 'order' }, { action: 'work' }],
    [{ key: 'rest', kind: 'order' }, { action: 'rest' }],
    [{ key: 'stop-chore', kind: 'order' }, { action: 'stop-chore' }],
    [{ key: 'winter-recall', kind: 'order' }, { action: 'winter-recall' }],
  ];
  for (const [icon, input] of sent) assert.equal(actionIdOf(icon), actionId(input), `the page and the server spell ${icon.key} differently`);
  // And everything the lesson always allows really is read as allowed on every one of its steps.
  const everyStep = STEPS.map(step => ({ step: step.id, index: 1, of: STEPS.length, title: 'x', says: 'y', allow: [...ALWAYS, ...step.allow()] }));
  for (const step of everyStep) {
    for (const [icon] of sent.filter(([one]) => one.kind === 'order')) {
      assert.equal(allowsIcon(step, icon), ALWAYS.includes(actionIdOf(icon)) || step.allow.includes(actionIdOf(icon)),
        `${icon.key} is read wrongly on the ${step.step} step`);
    }
  }
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
