// Making a family, before the world is seen (owner, 2026-09-17): "the rolling for a family, naming them, choosing the looks,
// should all happen before the world renders. the experience in solo vs live class should be the same. before we see the
// character creation interface experience, we need an intro screen. Name it 'Family: Texas 1835/36'."
//
// The order of the steps is `creationStep` (public/creation.js) and is proved here; that a student can walk it in a browser
// is scripts/creation-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The module reads `document` and `sessionStorage` only inside its functions, so a page-less import is enough for the order.
globalThis.document = { querySelector: () => null, body: { dataset: {} } };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
const { creationStep } = await import('../public/creation.js');

const student = { role: 'student', householdId: 'hh-1' };
const book = (extra = {}) => ({ name: 'the García family', named: true, surname: 'García', roll: 7, canRoll: false, people: [
  { id: 'hh-1-a', role: 'father', given: 'Tomás', choices: { skin: [] }, chosen: true },
  { id: 'hh-1-b', role: 'mother', given: 'Ana', choices: { skin: [] }, chosen: true },
  { id: 'hh-1-c', role: 'son', given: 'Luis' },
], ...extra });

test('the steps come in one order, the same in a class and in Play Solo, and the world is last', () => {
  assert.equal(creationStep(null, null), null, 'a page with no world is in the middle of something');
  assert.equal(creationStep({ role: 'host' }, book()), null, 'the teacher is asked to make a family');
  // A class: the title screen holds the join form until the student is in. Then Begin, the same as Play Solo, which arrives
  // joined (owner, 2026-09-17: the experience in both is the same).
  assert.equal(creationStep({ role: 'student' }, null), 'join');
  assert.equal(creationStep(student, null), 'begin');
  assert.equal(creationStep(student, book({ canRoll: true, roll: null, named: false, surname: undefined })), 'begin', 'the die came before the title screen');
  globalThis.sessionStorage = { getItem: key => (/begun/.test(key) ? '1' : null), setItem: () => {} };
  // `recall` reads the storage once for a family, so a fresh household id is used for each stage below.
  const at = (id, family) => creationStep({ role: 'student', householdId: id }, family);
  assert.equal(at('hh-2', book({ canRoll: true, roll: null, named: false, surname: undefined })), 'roll');
  assert.equal(at('hh-3', book({ named: false, surname: undefined })), 'surname');
  // Asked while the family is being made: a parent still to be chosen for.
  const making = book({ people: [{ id: 'p', role: 'father', given: 'Tomás', choices: { skin: [] }, chosen: false }] });
  assert.equal(at('hh-4', making), 'names', 'the looks came before the names');
  globalThis.sessionStorage = { getItem: () => '1', setItem: () => {} };
  assert.equal(at('hh-5', book({ people: [{ id: 'p', role: 'father', choices: { skin: [] }, chosen: false }] })), 'looks');
  assert.equal(at('hh-6', book()), null, 'the world is still behind the curtain once the family is made');
  assert.equal(at('hh-8', book()), null, 'a page opened later is asked for the names again');
  // A child is never asked for: only a parent has choices to make.
  assert.equal(at('hh-7', book({ people: [{ id: 'k', role: 'son', given: 'Luis' }] })), null, 'a child was asked how they look');
});

test('the title screen names the game, the curtain covers the map, and the map is not drawn behind it', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /<h1 id="creation-name">Family: Texas <span>1835\/36<\/span><\/h1>/);
  assert.match(html, /id="creation-begin-button">Make my family/, 'the title has no clear next action');
  assert.match(html, /<section id="names"[^>]*role="dialog"/);
  const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');
  assert.match(css, /#creation\{position:fixed;inset:0/, 'the curtain does not cover the page');
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /if \(creating\) \{ \/\* the curtain is up: nothing of the world is drawn \*\/ \}/, 'the map is drawn behind the curtain');
  assert.match(css, /creation-title-landscape\.png/, 'the title screen has no painted scene');
  const art = readFileSync(new URL('../public/assets/creation-title-landscape.png', import.meta.url));
  assert.ok(art.length > 100_000, 'the painted title scene was not shipped');
  const server = readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8');
  assert.ok(server.includes(`['/creation.js', ['../public/creation.js', 'text/javascript']]`));
});
