// Sitting on the horse, and on the wagon (owner's playtest, 2026-09-16): "A character should actually sit on the horse when
// using it. Same thing for the Ox and Wagon." Who sits on what, and where each part is drawn, are pure readings of the
// projection in public/motion.js; the page draws what these say (scripts/riding-browser-proof.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carriedWithRider, seatLayout, seatOf, seatedClip, wagonDriverId } from '../public/motion.js';

const clips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/animation.json', import.meta.url)), 'utf8')).clips;
const east = mode => ({ from: 'a', to: 'b', points: [{ x: 0, y: 0 }, { x: 9, y: 0 }], distance: 9, speed: 1, progress: 1, mode });
const person = (id, extra = {}) => ({ id, kind: 'person', householdId: 'hh-1', health: { condition: 'well' }, task: 'travel', ...extra });
const horse = extra => ({ id: 'hh-1-horse', kind: 'animal', species: 'horse', householdId: 'hh-1', ...extra });
const ox = extra => ({ id: 'hh-1-animal', kind: 'animal', species: 'ox', householdId: 'hh-1', ...extra });
const wagon = extra => ({ id: 'hh-1-wagon', kind: 'wagon', householdId: 'hh-1', condition: 'sound', ...extra });

test('whoever has the wagon drives it, sitting on it, and everybody else going its way walks beside it', () => {
  const mateo = person('hh-1-mateo', { travel: east('wagon') }), rosa = person('hh-1-rosa', { travel: east('wagon') });
  const team = [ox({ travel: east('wagon'), borrowedBy: mateo.id }), wagon({ travel: east('wagon'), borrowedBy: mateo.id })];
  const everybody = [mateo, rosa, ...team];
  assert.equal(wagonDriverId('hh-1', everybody), mateo.id);
  assert.equal(seatOf(mateo, everybody), 'wagon');
  assert.equal(seatOf(rosa, everybody), null, 'two people drawn driving one wagon');
  // The ox and wagon are drawn with their driver, not a second time behind him.
  for (const beast of team) assert.equal(carriedWithRider(beast, everybody), true, `${beast.id} drawn again beside its driver`);
  // On the family's arrival nobody took the wagon: the principal drives it in.
  const arriving = [person('hh-1-thomas', { principal: true, travel: east('wagon') }), rosa, ox({ travel: east('wagon') }), wagon({ travel: east('wagon') })];
  assert.equal(wagonDriverId('hh-1', arriving), 'hh-1-thomas');
  // A wagon standing in the yard has no driver, and is drawn by itself.
  const parked = [mateo, ox({ travel: null }), wagon({ travel: null })];
  assert.equal(wagonDriverId('hh-1', parked), null);
  assert.equal(carriedWithRider(parked[2], parked), false);
});

test('somebody on the horse sits on it; the horse, a walker, somebody hurt and a neighbour do not', () => {
  const rider = person('hh-1-thomas', { principal: true, travel: east('horse') });
  const everybody = [rider, horse({ travel: east('horse'), borrowedBy: rider.id })];
  assert.equal(seatOf(rider, everybody), 'horse');
  assert.equal(carriedWithRider(everybody[1], everybody), true);
  assert.equal(seatOf(person('hh-1-rosa', { travel: east('foot') }), everybody), null);
  assert.equal(seatOf(person('hh-1-rosa', { travel: east('horse'), health: { condition: 'wounded' } }), everybody), null, 'somebody hurt is drawn hurt');
  assert.equal(seatOf({ ...rider, observed: true }, everybody), null);
  assert.equal(seatOf({ id: 'courier-1', kind: 'person', carrier: true, travel: east('horse') }, everybody), null, 'a courier keeps the courier sheet');
  assert.equal(carriedWithRider(horse({ travel: null }), everybody), false, 'a horse in the yard is drawn');
});

test('the rider is drawn as themselves, sitting up, facing the way they go, in a pose the library holds', () => {
  const principal = person('hh-1-thomas', { principal: true });
  for (const direction of ['n', 's', 'e', 'w']) {
    const clip = seatedClip(principal, direction);
    assert.equal(clip.id, `rust-idle-${direction}`, 'the principal keeps the rust coat on the horse');
    assert.ok(clips[clip.id], `${clip.id} is not in the library`);
    for (const child of [{ band: 'child', sex: 'female' }, { band: 'child', sex: 'male' }, { band: 'small' }, { band: 'infant' }, { sex: 'female', band: 'adult' }]) {
      const id = seatedClip(person('hh-1-x', child), direction).id;
      assert.ok(clips[id], `${id} is not in the library`);
    }
  }
});

test('the rider sits on the mount: up on its back or the wagon seat, cut below the waist, the mount drawn first or in front', () => {
  for (const direction of ['e', 'w', 'n', 's']) {
    const onHorse = seatLayout('horse', direction), onWagon = seatLayout('wagon', direction);
    const riderOnHorse = onHorse.find(part => part.part === 'rider'), mount = onHorse.find(part => part.part === 'horse');
    // Their feet line is well above the ground the horse stands on, and their hip is on its back.
    assert.ok(riderOnHorse.dy < mount.dy - 0.2 * mount.height, `${direction}: the rider stands on the road beside the horse`);
    const hip = riderOnHorse.dy - riderOnHorse.height * (1 - riderOnHorse.shown);
    assert.ok(hip < mount.dy - 0.45 * mount.height && hip > mount.dy - 0.75 * mount.height, `${direction}: the rider's waist is not on the horse's back (${hip})`);
    assert.ok(riderOnHorse.shown > 0.4 && riderOnHorse.shown < 0.8, 'the legs of a standing figure would stick out under the horse');
    assert.ok(Math.abs(riderOnHorse.dx) < 0.3 * mount.height, `${direction}: the rider is not over the saddle`);
    // Coming toward the camera the horse is in front of the rider; otherwise the rider is on top.
    assert.equal(onHorse.at(-1).part, direction === 's' ? 'horse' : 'rider');

    const driver = onWagon.find(part => part.part === 'rider'), box = onWagon.find(part => part.part === 'wagon'), team = onWagon.find(part => part.part === 'ox');
    assert.ok(driver.dy < box.dy - 0.15 && driver.shown < 1, `${direction}: the driver walks on the road`);
    // The ox is ahead of the wagon, the way they are going, and the driver sits at the front of the box, nearer the ox.
    if (direction === 'e' || direction === 'w') {
      assert.ok(team.dx > box.dx && driver.dx > box.dx && driver.dx < team.dx, `${direction}: the ox is not in front of the wagon, or the driver not between`);
    } else {
      assert.equal(Math.sign(team.dy), direction === 'n' ? -1 : 1, `${direction}: the ox is not ahead`);
    }
    assert.ok(onWagon.indexOf(driver) > onWagon.indexOf(box), 'the driver is drawn behind the wagon box and cannot be seen');
  }
  assert.deepEqual(seatLayout(null), []);
});
