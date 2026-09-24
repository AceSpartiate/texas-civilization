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
import { entityClip, inTheSaddle, underARider, mounted, MOUNTED_HEIGHT, travelHeading, visualVariant, PRINCIPAL_VARIANT, HURT_CONDITIONS, STILL_CONDITIONS, ORDINARY_CONDITIONS } from '../public/motion.js';
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

test('somebody sent on the family horse is drawn riding it, and the horse is not drawn again beside them', () => {
  // Found in play 2026-09-14: a person sent "on the horse" walked, with the horse walking along next to them.
  const south = road([{ x: 0, y: 0 }, { x: 0, y: 9 }]), east = road([{ x: 0, y: 0 }, { x: 9, y: 0 }]);
  const riding = person({ task: 'travel', travel: { ...south, mode: 'horse' } });
  assert.equal(inTheSaddle(riding), true);
  // Their own figure sitting up, which the page puts on the horse (tests/riding.test.mjs); no longer the courier (owner, 2026-09-16).
  const variant = visualVariant('hh-1-rosa');
  assert.equal(entityClip(riding).id, `${variant}-idle-s`);
  assert.equal(entityClip(person({ task: 'travel', travel: { ...east, mode: 'horse' } })).id, `${variant}-idle-e`);
  assert.equal(entityClip(person({ task: 'travel', band: 'child', sex: 'female', age: 12, travel: { ...east, mode: 'horse' } })).id, 'girl-idle-e', 'a girl riding is drawn sitting up in her own figure, not walking');
  for (const mode of ['foot', 'wagon', undefined]) {
    assert.ok(!/idle/.test(entityClip(person({ task: 'travel', travel: { ...south, mode } })).id), `on ${mode} nobody is in the saddle`);
  }
  const horse = extra => ({ id: 'hh-1-horse', kind: 'animal', species: 'horse', ...extra });
  assert.equal(underARider(horse({ travel: { ...south, mode: 'horse' } })), true);
  assert.equal(underARider(horse({ travel: null })), false, 'a horse in the yard is drawn');
  assert.equal(underARider({ id: 'hh-1-animal', kind: 'animal', travel: { ...south, mode: 'wagon' } }), false, 'the ox is drawn pulling');
  // Drawn the size of a horse with somebody on it, never a person's height: that made the horse a toy (found in play).
  assert.ok(MOUNTED_HEIGHT >= 1.5, 'a rider is at least as tall as the family horse standing');
  assert.equal(mounted(riding), true);
  assert.equal(mounted({ id: 'courier-1', kind: 'person', carrier: true }), true, 'and so is every courier');
  assert.equal(mounted(person({ task: 'travel', travel: { ...south, mode: 'foot' } })), false);
  // Somebody hurt on the way is drawn hurt, as anywhere.
  assert.ok(entityClip(person({ health: { condition: 'wounded' }, travel: { ...south, mode: 'horse' } })).id.endsWith('injured-rest'));
});

test('somebody a rider has stopped is drawn talking with him, in the delivered speaking and listening poses', async () => {
  // Astra delivered these for the first cast on 2026-09-14 and the second on 2026-09-21, and until today nothing drew
  // one: the server told the page which way the RIDER was turned and said nothing about the person he had reined in for,
  // so they stood in their idle pose. `listeningOf` in sim/encounters.mjs is the other half of `facingOf`.
  const { castVariant } = await import('../public/motion.js');
  const variant = visualVariant('hh-1-rosa');
  assert.equal(entityClip(person({ speaking: true, facing: 'e' })).id, `${variant}-speak`, 'saying something is the speaking cycle');
  assert.equal(entityClip(person({ facing: 'n' })).id, `${variant}-listen-n`, 'a rider above them is listened to with the back view');
  for (const facing of ['s', 'e', 'w']) {
    assert.equal(entityClip(person({ facing })).id, `${variant}-listen-s`, 'and every other way with the front view: no sheet has an east-facing listener');
  }
  // A back view is never mirrored, and a listening pose is not frozen - the renderer's breathing is what keeps it alive,
  // which is what docs/ART_DELIVERY_2026-09-21-CAST2-DIALOGUE.md asked for.
  assert.equal(entityClip(person({ facing: 'n' })).upright, true);
  assert.equal(entityClip(person({ facing: 'n' })).frozen, undefined);
  // A conversation outranks what they were doing, and is refused for somebody else's family: an observed person's pose
  // is never read off a meeting this student is not in.
  assert.equal(entityClip(person({ facing: 'e', chore: { doing: 'breaking the rows' } })).id, `${variant}-listen-s`);
  assert.ok(!entityClip(person({ speaking: true, facing: 'e', observed: true }), true).id.endsWith('-speak'));
  // Being hurt still outranks a conversation: a hurt person is drawn hurt whatever else is going on.
  assert.equal(entityClip(person({ speaking: true, facing: 'e', health: { condition: 'minor-injury' } })).id, `${variant}-injured-rest`);
  // Every figure a family can be drawn as has all three poses in the library.
  for (const sex of ['male', 'female']) for (const band of ['adult', 'youth']) for (const principal of [false, true]) {
    const who = castVariant(person({ sex, band, principal }));
    for (const pose of ['speak', 'listen-s', 'listen-n']) assert.ok(clips[`${who}-${pose}`], `${who}-${pose} is not in the library`);
  }
});

test('the second cast is drawn: a family of distinct people, a mother who is principal in her own rust, and a child smaller', async () => {
  // Astra's second cast was completed on 2026-09-21 (north/south walking and dialogue), so this is no longer the
  // stand-in's rule but the delivered one. What it guards is unchanged: the principal keeps the mark, nobody else may
  // wear it, a child is drawn smaller, and every binding names a clip the library holds.
  const { castVariant, figureScale, FIGURE_SCALE, WOMEN, MEN } = await import('../public/motion.js');
  const someone = (id, extra = {}) => ({ id, kind: 'person', health: { condition: 'well' }, task: 'rest', ...extra });
  const woman = { sex: 'female', band: 'adult' }, man = { sex: 'male', band: 'adult' };
  // The principal's own colour, and a mother who is the principal is drawn as a woman wearing it.
  assert.equal(castVariant(someone('hh-1-parent-1', { principal: true, ...man })), PRINCIPAL_VARIANT);
  assert.equal(castVariant(someone('hh-1-parent-2', { principal: true, ...woman })), 'rust-woman', 'a mother who is the principal is a woman in the principal\u2019s rust');
  assert.ok(castVariant(someone('hh-1-parent-2', { principal: true, ...woman })).startsWith(PRINCIPAL_VARIANT), 'and it is still the mark');
  // Nobody else may be dealt either of the principal's two figures.
  for (const pool of [WOMEN, MEN]) for (const figure of pool) assert.ok(!figure.startsWith(PRINCIPAL_VARIANT), `${figure} is in a pool and wears the mark`);
  assert.equal(castVariant(someone('hh-1-parent-2', { principal: true, ...woman }), true), castVariant(someone('hh-1-parent-2', woman)), 'another family\u2019s principal is drawn as anybody else');
  // Two women and two men, so a family is not four copies of two figures; and the choice is who they are, not chance.
  assert.deepEqual([...WOMEN].sort(), ['indigo', 'teal']);
  assert.deepEqual([...MEN].sort(), ['elder', 'ochre']);
  const women = new Set(), men = new Set();
  for (let i = 0; i < 40; i++) { women.add(castVariant(someone(`hh-${i}-mother`, woman))); men.add(castVariant(someone(`hh-${i}-father`, man))); }
  assert.deepEqual([...women].sort(), ['indigo', 'teal'], 'both women are dealt');
  assert.deepEqual([...men].sort(), ['elder', 'ochre'], 'both men are dealt');
  assert.equal(castVariant(someone('hh-1-rosa', woman)), castVariant(someone('hh-1-rosa', woman)), 'and the same person is the same figure every tick');
  // An adolescent has her own figure now, where she used to be drawn as a grown woman.
  assert.equal(castVariant(someone('hh-1-daughter', { sex: 'female', band: 'youth' })), 'blue-girl');
  assert.equal(castVariant(someone('hh-1-son', { sex: 'male', band: 'youth' })), 'blue');
  // Something sent with no sex at all keeps the id's figure. No person is any more: the founding four and the townspeople are
  // sent with theirs (sim/town.mjs `seenAs`, tests/figures-match-people.test.mjs).
  assert.equal(castVariant(someone('hh-1-elena')), visualVariant('hh-1-elena'));

  const order = ['adult', 'youth', 'child', 'small', 'infant'].map(band => figureScale({ band }));
  for (let i = 1; i < order.length; i++) assert.ok(order[i] < order[i - 1], `a younger band is not drawn smaller: ${order}`);
  assert.equal(figureScale({ band: 'adult' }), 1);
  assert.equal(figureScale({}), 1, 'somebody with no age is drawn full size');
  assert.ok(FIGURE_SCALE.infant < 0.5 && FIGURE_SCALE.youth < 1);

  // Every clip a rolled family can produce is one the library holds.
  for (const sex of ['male', 'female']) for (const band of ['adult', 'youth', 'child', 'small', 'infant']) for (const principal of [false, true]) {
    for (const extra of [{}, { travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) }, { health: { condition: 'minor-injury' } }]) {
      const id = entityClip(someone({ sex, band, principal, ...extra })).id;
      assert.ok(clips[id], `${sex}/${band}${principal ? '/principal' : ''} draws ${id}, which the library does not hold`);
    }
  }
});

test("Astra's second delivery is drawn: children in their own figures where the pose exists, riders turned north or south, houses by stage", async () => {
  const { CHILD_POSES, childFigure } = await import('../public/motion.js');
  const { HOUSE_IDS } = await import('../sim/houses.mjs');
  const atlas = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url)), 'utf8'));
  const frames = atlas.frames || atlas.sprites;
  const child = extra => person({ id: 'hh-1-child-3', task: 'rest', ...extra });
  assert.equal(entityClip(child({ sex: 'female', band: 'child' })).id, 'girl-rest', 'a girl resting is the girl');
  assert.equal(entityClip(child({ sex: 'male', band: 'child', task: 'work' })).id, 'boy-idle-s', 'a boy standing about is the boy');
  assert.equal(entityClip(child({ sex: 'female', band: 'small', health: { condition: 'minor-injury' } })).id, 'smallchild-injured-rest');
  assert.equal(entityClip(child({ sex: 'male', band: 'infant' })).id, 'infant-rest');
  assert.equal(entityClip(child({ sex: 'female', band: 'child', travel: road([{ x: 0, y: 0 }, { x: 9, y: 0 }]) })).id, 'girl-walk', 'walking east is her own walk');
  assert.equal(entityClip(child({ sex: 'female', band: 'child', travel: road([{ x: 0, y: 0 }, { x: 0, y: 9 }]) })).id, 'girl-walk-s', 'walking south uses her delivered child walk');
  assert.equal(entityClip(child({ sex: 'male', band: 'small', travel: road([{ x: 0, y: 0 }, { x: 0, y: -9 }]) })).id, 'smallchild-walk-n', 'a small child walking north keeps their own figure');
  assert.equal(childFigure({ band: 'youth', sex: 'female' }), null, 'an adolescent is not drawn as a child');
  for (const [figure, poses] of Object.entries(CHILD_POSES)) for (const pose of poses) assert.ok(clips[`${figure}-${pose}`], `${figure}-${pose} is in the library`);

  const rider = extra => ({ id: 'courier-1', kind: 'person', carrier: true, health: { condition: 'well' }, task: 'rest', ...extra });
  for (const facing of ['n', 's']) {
    assert.deepEqual(entityClip(rider({ facing })), { id: `mounted-courier-listen-${facing}`, upright: true }, `listening to somebody to the ${facing}`);
    assert.deepEqual(entityClip(rider({ facing, speaking: true })), { id: `mounted-courier-speak-${facing}`, upright: true });
    assert.ok(clips[`mounted-courier-listen-${facing}`] && clips[`mounted-courier-speak-${facing}`]);
  }
  for (const layout of HOUSE_IDS) for (const stage of ['', '-site', '-walls', '-roofing']) assert.ok(frames[`house-${layout}${stage}`], `house-${layout}${stage} is on the atlas`);
});
