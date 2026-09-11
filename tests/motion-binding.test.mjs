// Which drawing a person gets is a reading of the permitted projection, and nothing else.
// Two bindings here were art that had been delivered and was not being used: the north and
// south walk cycles, so everybody walked sideways whichever way they were going, and the
// injured pose, so a hurt person was drawn standing about as though nothing had happened.
// The second was the renderer asserting something the world never said.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entityClip, travelHeading, visualVariant, PRINCIPAL_VARIANT, HURT_CONDITIONS, STILL_CONDITIONS, ORDINARY_CONDITIONS } from '../public/motion.js';
import { marchCost } from '../sim/directors.mjs';

const clips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/animation.json', import.meta.url)), 'utf8')).clips;
const person = (extra = {}) => ({ id: 'hh-1-rosa', kind: 'person', health: { condition: 'well' }, task: 'work', ...extra });
const road = (points, progress = 0) => ({ from: 'a', to: 'b', points, distance: 9, speed: 1, progress });

test('a walking person faces the leg of the road they are actually on', () => {
  const variant = visualVariant('hh-1-rosa');
  const south = person({ travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) });
  const north = person({ travel: road([{ x: 0, y: 9 }, { x: 0, y: 0 }]) });
  const east = person({ travel: road([{ x: 0, y: 0 }, { x: 9, y: 0 }]) });
  assert.equal(entityClip(south).id, `${variant}-walk-s`);
  assert.equal(entityClip(north).id, `${variant}-walk-n`);
  assert.equal(entityClip(east).id, `${variant}-walk`, 'east and west share one cycle and are mirrored');

  // A drawn north or south cycle already faces that way; mirroring it would turn somebody
  // walking away into somebody walking away backwards.
  assert.equal(entityClip(south).upright, true);
  assert.equal(entityClip(east).upright, undefined);

  // The heading comes from the leg under the traveller, not from the whole route: a road
  // that runs east and then turns south changes the drawing when they reach the bend.
  const bend = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }];
  assert.equal(travelHeading(person({ travel: road(bend, 1) })), null, 'still on the eastward leg');
  assert.equal(travelHeading(person({ travel: road(bend, 8) })), 's', 'now on the southward one');

  // An almost level leg is not a vertical walk; a sidestep drawn as walking north is worse
  // than the mirror. And nothing guesses a direction from a person who is not travelling.
  assert.equal(travelHeading(person({ travel: road([{ x: 0, y: 0 }, { x: 9, y: 1 }]) })), null);
  assert.equal(travelHeading(person()), null);
  assert.equal(travelHeading(person({ travel: { points: [] } })), null);
  assert.equal(travelHeading(undefined), null);
});

test('every condition the simulation can produce is classified and draws something', () => {
  // The drift this catches, which actually happened: the binding read
  // `['injured', 'wounded']`, and the simulation has never set either. The one hurt
  // state it does produce is `minor-injury`, so hurt people were drawn resting while the
  // delivered injured pose sat behind a binding that matched nothing. Restating the
  // vocabulary in a second place is what allowed that, so this test refuses to restate
  // it: it reads the conditions out of sim/ and requires each one to be classified.
  const simDir = fileURLToPath(new URL('../sim/', import.meta.url));
  const found = new Set();
  for (const file of readdirSync(simDir).filter(name => name.endsWith('.mjs'))) {
    const source = readFileSync(join(simDir, file), 'utf8');
    for (const [, value] of source.matchAll(/condition:\s*'([\w-]+)'/g)) found.add(value);
    for (const [, value] of source.matchAll(/condition\s*===\s*'([\w-]+)'/g)) found.add(value);
    for (const [, value] of source.matchAll(/\bcondition\b[^\n]*?\.includes\(\s*'([\w-]+)'/g)) found.add(value);
  }
  // Conditions reached through a table rather than a literal assignment.
  for (const start of [...found]) found.add(marchCost(start));
  assert.ok(found.has('minor-injury'), 'the scan missed minor-injury; it is set in sim/directors.mjs');
  assert.ok(found.has('well') && found.has('dead'), 'the scan is not finding the condition vocabulary at all');

  // An ox and a wagon carry a `condition` too, and it is a different vocabulary from a
  // person's health. `entityClip` reads `entity.health?.condition || entity.condition`,
  // so the two share one code path and a collision would be drawn: a wagon whose
  // condition was ever named 'wounded' would be rendered as a hurt person.
  const PROPERTY_CONDITIONS = ['sound', 'lost'];
  for (const condition of PROPERTY_CONDITIONS) {
    assert.ok(!HURT_CONDITIONS.includes(condition) && !STILL_CONDITIONS.includes(condition),
      `'${condition}' is a property condition and also a person's; a wagon would be drawn as a person`);
    for (const kind of ['wagon', 'animal']) {
      const clip = entityClip({ id: `hh-1-${kind}`, kind, condition });
      assert.ok(clips[clip.id], `a ${kind} in condition '${condition}' draws ${clip.id}, which the library does not hold`);
    }
  }

  const classified = new Set([...HURT_CONDITIONS, ...STILL_CONDITIONS, ...ORDINARY_CONDITIONS, ...PROPERTY_CONDITIONS]);
  for (const condition of found) {
    assert.ok(classified.has(condition),
      `sim/ can put something in condition '${condition}' and this test does not classify it. If it is a person's, add it to HURT_CONDITIONS, STILL_CONDITIONS or ORDINARY_CONDITIONS in public/motion.js; if it belongs to an ox or a wagon, add it to PROPERTY_CONDITIONS here.`);
    if (PROPERTY_CONDITIONS.includes(condition)) continue;
    const clip = entityClip(person({ health: { condition } }));
    assert.ok(clips[clip.id], `condition '${condition}' draws ${clip.id}, which the library does not hold`);
  }
});

test('somebody hurt is drawn hurt, and capture and death stay distinct from it', () => {
  const variant = visualVariant('hh-1-rosa');
  for (const condition of HURT_CONDITIONS) {
    const clip = entityClip(person({ health: { condition } }));
    assert.equal(clip.id, `${variant}-injured-rest`, `${condition} uses the delivered injured pose`);
    assert.equal(clip.frozen, true, 'and holds it rather than looping');
  }
  // The one the simulation actually produces, named explicitly so that removing it from
  // the list is a failure rather than a silently shorter loop above.
  assert.equal(entityClip(person({ health: { condition: 'minor-injury' } })).id, `${variant}-injured-rest`,
    'minor-injury is the only hurt state sim/ sets, and it must be the one that is drawn hurt');
  // Resting and hurt are different drawings: a hurt person is put at rest by the
  // director, so if the condition did not outrank the task they would be indistinguishable.
  assert.notEqual(entityClip(person({ health: { condition: 'minor-injury' }, task: 'rest' })).id,
    entityClip(person({ health: { condition: 'well' }, task: 'rest' })).id,
    'a hurt person at rest is drawn the same as an unhurt person at rest');
  // Capture and death are their own server states and this project draws no casualty, so
  // they keep a still upright pose rather than borrowing the injured one.
  for (const condition of ['dead', 'captured']) {
    assert.equal(entityClip(person({ health: { condition } })).id, `${variant}-idle-s`);
    assert.equal(entityClip(person({ health: { condition } })).frozen, true);
  }
  // A condition outranks whatever the person was doing: an injured traveller is not walking.
  assert.equal(entityClip(person({ health: { condition: 'minor-injury' }, travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) })).id, `${variant}-injured-rest`);
});

test('the ox turns with the road as well, and every clip these bindings name exists', () => {
  const ox = extra => ({ id: 'hh-1-animal', kind: 'animal', ...extra });
  assert.equal(entityClip(ox({ travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) })).id, 'ox-walk-s');
  assert.equal(entityClip(ox({ travel: road([{ x: 0, y: 9 }, { x: 0, y: 0 }]) })).id, 'ox-walk-n');
  assert.equal(entityClip(ox({ travel: road([{ x: 0, y: 0 }, { x: 9, y: 0 }]) })).id, 'ox-walk');

  // Every clip any binding can produce is a clip the shipped library actually holds. A
  // name that resolves to nothing draws nothing, and nothing is exactly what a missing
  // pose looks like from the outside.
  const named = new Set();
  for (const health of [{ condition: 'well' }, { condition: 'minor-injury' }, { condition: 'captured' }]) {
    for (const doing of ['', 'walking out to the field', 'breaking the rows', 'putting in seed', 'carrying the crop in', 'mending the hoe']) {
      for (const travel of [null, road([{ x: 0, y: 0 }, { x: 0, y: 9 }]), road([{ x: 0, y: 9 }, { x: 0, y: 0 }]), road([{ x: 0, y: 0 }, { x: 9, y: 0 }])]) {
        for (const principal of [false, true]) {
          named.add(entityClip({ ...person({ health, travel, principal }), chore: doing ? { doing } : null }).id);
        }
      }
    }
  }
  // A rider is a person on a horse, and `mounted-courier-*` is the sheet that says so.
  // It was delivered and unused: a courier fell through to the civilian walk cycles, so
  // for months a message arrived on foot in a coloured coat. The same fault as the
  // injured pose, one sheet along.
  const rider = extra => ({ id: 'courier-1', kind: 'person', carrier: true, health: { condition: 'well' }, task: 'travel', ...extra });
  assert.equal(entityClip(rider({ travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) })).id, 'mounted-courier-s');
  assert.equal(entityClip(rider({ travel: road([{ x: 0, y: 9 }, { x: 0, y: 0 }]) })).id, 'mounted-courier-n');
  assert.equal(entityClip(rider({ travel: road([{ x: 0, y: 0 }, { x: 9, y: 0 }]) })).id, 'mounted-courier-e');
  assert.equal(entityClip(rider({ travel: null, task: 'rest' })).id, 'mounted-courier-graze');
  // Stopped and turned toward somebody: the encounter frames, and the only two that are
  // mirrored on purpose, because a rider must face the person they are speaking to.
  assert.equal(entityClip(rider({ facing: 'w' })).id, 'mounted-courier-listen');
  assert.equal(entityClip(rider({ facing: 'w' })).upright, undefined, 'so a rider facing west is mirrored');
  assert.equal(entityClip(rider({ facing: 'e', speaking: true })).id, 'mounted-courier-speak');
  for (const extra of [{ travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) }, { travel: road([{ x: 0, y: 9 }, { x: 0, y: 0 }]) }, { travel: road([{ x: 0, y: 0 }, { x: 9, y: 0 }]) }, { travel: null }, { facing: 'w' }, { facing: 'e', speaking: true }]) {
    named.add(entityClip(rider(extra)).id);
  }
  // And a rider is never drawn as a settler: the principal's rust coat in particular is
  // reserved for the one person a student directs.
  assert.ok(![...named].some(id => id.startsWith('mounted') && id.includes(PRINCIPAL_VARIANT)));
  assert.ok(named.size > 8, `the bindings produce ${named.size} distinct clips`);
  for (const id of named) assert.ok(clips[id], `${id} is a clip the library actually holds`);
  assert.ok([...named].some(id => id.startsWith(PRINCIPAL_VARIANT)), 'including the principal in every pose');
  assert.ok([...named].some(id => id.endsWith('-walk-n')) && [...named].some(id => id.endsWith('-walk-s')), 'and both vertical cycles');
});
