// The family's last name (owner, 2026-09-17): "After rolling for a family, the player should see an interface pop up and ask
// them to name their family. It shouldn't say 'Our family is called' it should say 'Family Last Name' and that last name
// should be added to the members of the family as such." By multiple choice: a separate last name, so renaming a person
// never touches it; the popup required; the class sees "the García family".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, validateWorld } from '../sim/world.mjs';
import { familyProjection, householdName } from '../sim/family.mjs';

const rolled = () => {
  const world = createGonzalesWorld('surname', 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  household.played = true;
  rollFamily(world, household);
  world.status = 'running';
  return { world, household };
};
const people = (world, household) => household.members.map(id => world.entities[id]);

test('naming the family gives every member the last name, and the class calls it "the ... family"', () => {
  const { world, household } = rolled();
  const firsts = people(world, household).map(person => person.name);
  assert.equal(familyProjection(world, household).named, false, 'a rolled family was named before anybody named it');
  applyAction(world, household.id, { action: 'rename', surname: '  García ' });
  assert.equal(household.surname, 'García');
  assert.deepEqual(people(world, household).map(person => person.name), firsts.map(first => `${first} García`));
  assert.deepEqual(people(world, household).map(person => person.given), firsts);
  assert.equal(householdName(world, household), 'the García family');
  const book = familyProjection(world, household);
  assert.equal(book.named, true);
  assert.equal(book.surname, 'García');
  assert.deepEqual(book.people.map(person => person.given), firsts);
  const own = projectWorld(world, household.id, 'student', { includeMap: false }).entities.filter(entity => entity.kind === 'person');
  assert.ok(own.every(entity => entity.given && entity.name === `${entity.given} García`), 'the page is not told the first names apart');
  assert.ok(world.events.some(event => event.householdId === household.id && event.text === 'The family took the last name García.'));
  validateWorld(world);
});

test('renaming a person changes only the first name; the last name is set once', () => {
  const { world, household } = rolled();
  applyAction(world, household.id, { action: 'rename', surname: 'García' });
  const [first] = people(world, household);
  applyAction(world, household.id, { action: 'rename', entityId: first.id, name: 'Tomás' });
  assert.equal(first.given, 'Tomás');
  assert.equal(first.name, 'Tomás García', 'a person renamed lost the family\'s last name');
  // Set once (owner, 2026-09-17: "The last name and looks are set once, in the pop-ups").
  assert.throws(() => applyAction(world, household.id, { action: 'rename', surname: 'Navarro' }), /is García, and it is kept/);
  assert.ok(people(world, household).every(person => person.name === `${person.given} García`));
  validateWorld(world);
});

test('a last name is refused before the die is rolled, and a bad one in words', () => {
  const world = createGonzalesWorld('surname-early', 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  household.played = true;
  assert.throws(() => applyAction(world, household.id, { action: 'rename', surname: 'García' }), /Roll the die/);
  rollFamily(world, household);
  assert.throws(() => applyAction(world, household.id, { action: 'rename', surname: '1234' }), /at least one letter/);
  assert.equal(household.surname, undefined);
  household.surname = 'x'.repeat(25);
  assert.throws(() => validateWorld(world), /Invalid family last name/);
});

test('the page asks for the last name in a box that says "Family Last Name", then for the looks, and the journal no longer edits either', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /Our family is called/);
  assert.match(html, /<section id="surname"[^>]*role="dialog"/);
  assert.match(html, /<label for="surname-input">Family Last Name<\/label>/);
  // Names and looks are no longer edited in the journal (owner, 2026-09-17: names on the panel only).
  assert.doesNotMatch(html, /family-name-input|family-looks/);
  assert.match(html, /<section id="looks"[^>]*role="dialog"/);
  assert.match(html, /<span>Journal<\/span>/);
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  // Required: nothing on the page closes it but naming the family.
  assert.doesNotMatch(app, /surname-close/);
});
