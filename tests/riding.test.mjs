// Sitting on the horse, and on the wagon (owner's playtest, 2026-09-16): "A character should actually sit on the horse when
// using it. Same thing for the Ox and Wagon." Who sits on what, and where each part is drawn, are pure readings of the
// projection in public/motion.js; the page draws what these say (scripts/riding-browser-proof.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carriedWithRider, seatLayout, seatOf, seatedClip, wagonDriverId, bedLayout, rigPoint, wagonRigClip, WAGON_RIG, SEAT } from '../public/motion.js';
import { WAGON } from '../scripts/claude-art/kit/vehicles.mjs';
import { RIG_ANCHOR } from '../scripts/claude-art/areas/transport-vehicles.mjs';

const clips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/animation.json', import.meta.url)), 'utf8')).clips;
// Claude's temporary stand-ins (public/assets/claude-standins/, area D 2026-09-28): the children riding and the second cast and
// children driving, asked for by the names Astra's would have.
const claudeClips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/claude-standins/atlas.json', import.meta.url)), 'utf8')).clips;
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
    // `null` asks for the person alone rather than the delivered rig: the figure-only path, which draws a person at a
    // person's height (public/app.js `miniPerson`).
    const clip = seatedClip(principal, direction, null);
    assert.equal(clip.id, `rust-idle-${direction}`, 'the principal keeps the rust coat on the horse');
    assert.ok(clips[clip.id], `${clip.id} is not in the library`);
    for (const child of [{ band: 'child', sex: 'female' }, { band: 'child', sex: 'male' }, { band: 'small' }, { band: 'infant' }, { sex: 'female', band: 'adult' }]) {
      const id = seatedClip(person('hh-1-x', child), direction, null).id;
      assert.ok(clips[id], `${id} is not in the library`);
    }
  }
});

/**
 * Astra's mounted family and seated drivers (2026-09-21), which replaced the composite for everybody they cover.
 *
 * What this holds, and what it cost to learn: for a whole year of this project's life an "it is delivered" test was a
 * test that the *frame existed*, and eight batches sat in `atlas.json` drawn by nothing. So every assertion here is about
 * a choice the drawing code makes - which clip, at what height, with what under it - and not about the library's contents.
 * The photograph that it reaches the screen is scripts/riding-browser-proof.mjs.
 */
test("the eight riders and the four drivers Astra painted are what is drawn, and nobody else's layer is invented", async () => {
  const { RIDING_FIGURES, DRIVING_FIGURES, MOUNTED_HEIGHT, SEAT, seatFigure } = await import('../public/motion.js');
  const SIZES = { horse: 1.5, ox: 1.45, wagon: 1.55 };
  // Every figure a rolled family can actually produce, so a figure added to the cast and forgotten here is caught.
  const cast = new Set();
  for (const sex of ['male', 'female', undefined]) for (const band of ['adult', 'youth', 'child', 'small', 'infant']) for (const principal of [false, true]) {
    for (let n = 0; n < 40; n++) cast.add(seatFigure(person(`hh-${n}-${sex}-${band}`, { sex, band, principal })));
  }
  assert.ok([...RIDING_FIGURES, ...DRIVING_FIGURES].every(figure => cast.has(figure)), 'a delivered figure nobody can be drawn as');

  for (const figure of RIDING_FIGURES) for (const direction of ['e', 'w', 's', 'n']) {
    const clip = seatedClipFor(figure, direction);
    // West is the east cycle mirrored, as every other east cycle in this project is; north and south are painted and are
    // never mirrored, which is what `upright` means everywhere else in public/motion.js.
    assert.equal(clip.id, `${figure}-ride-${direction === 'w' ? 'e' : direction}`, `${figure} riding ${direction}`);
    assert.ok(clips[clip.id], `${clip.id} is not in the library`);
    assert.equal(clip.whole, true, `${clip.id} is drawn as a whole horse-and-rider`);
    assert.equal(clip.upright, direction === 'n' || direction === 's' ? true : undefined, `${direction}: mirrored the wrong way`);
  }
  for (const figure of DRIVING_FIGURES) for (const direction of ['s', 'e', 'w', 'n']) {
    const clip = seatedClipFor(figure, direction, 'wagon');
    assert.equal(clip.id, `${figure}-wagon-driver-${direction}`);
    assert.ok(clips[clip.id], `${clip.id} is not in the library`);
    assert.equal(clip.seated, true, 'a delivered driver is a whole seated figure, not one cut at the hip');
    assert.equal(clip.upright, true, 'every heading is painted, so a driver is never mirrored');
  }
  // Nobody Astra has not painted is given a layer that does not exist: a figure Claude drew is given Claude's (which the page
  // falls back from while it is not loaded), and anybody else the composite.
  const { CLAUDE_RIDING_FIGURES, CLAUDE_DRIVING_FIGURES } = await import('../public/motion.js');
  for (const figure of cast) {
    if (!RIDING_FIGURES.includes(figure)) for (const direction of ['e', 'w', 's', 'n']) {
      const clip = seatedClipFor(figure, direction, 'horse');
      if (CLAUDE_RIDING_FIGURES.includes(figure)) assert.ok(clip.whole && claudeClips[clip.id]?.madeBy === 'claude', `${figure} riding asks for ${clip.id}, which Claude has not drawn`);
      else assert.ok(!clip.whole && clips[clip.id], `${figure} riding draws ${clip.id}, which the library does not hold`);
    }
    if (!DRIVING_FIGURES.includes(figure)) for (const direction of ['e', 'w', 's', 'n']) {
      const clip = seatedClipFor(figure, direction, 'wagon');
      if (CLAUDE_DRIVING_FIGURES.includes(figure)) assert.ok(clip.seated && claudeClips[clip.id]?.madeBy === 'claude', `${figure} driving asks for ${clip.id}, which Claude has not drawn`);
      else assert.ok(!clip.seated && clips[clip.id], `${figure} driving draws ${clip.id}, which the library does not hold`);
    }
  }
  // Every figure a family can put in the bed of a cart has its seated rider, three ways; the baby has none (it is carried).
  const { passengerClip } = await import('../public/motion.js');
  for (const [band, sex] of [['adult', 'male'], ['adult', 'female'], ['youth', 'male'], ['youth', 'female'], ['child', 'male'], ['child', 'female'], ['small', undefined]]) for (let n = 0; n < 30; n++) for (const direction of ['e', 'w', 's', 'n']) {
    const clip = passengerClip(person(`hh-${n}-x`, { band, sex }), direction);
    assert.ok(clip && claudeClips[clip.id], `a ${band} riding in a cart asks for ${clip?.id}, which is not drawn`);
    assert.equal(clip.upright, direction === 'n' || direction === 's', `${clip.id}: mirrored the wrong way`);
  }
  assert.equal(passengerClip(person('hh-1-baby', { band: 'infant' }), 'e'), null, 'a baby is given a seat of its own');
  for (const direction of ['e', 'w', 'n', 's']) {
    // The painted rig: one part, standing on the hooves, at the height a rider and horse have always been drawn - and no
    // horse under it, because the horse is in the picture.
    const rig = seatLayout('horse', direction, SIZES, 1, MOUNTED_HEIGHT);
    assert.deepEqual(rig, [{ part: 'rider', dx: 0, dy: 0, height: MOUNTED_HEIGHT, whole: true }], `${direction}: the painted rig is not drawn as one`);
    assert.equal(rig.some(part => part.part === 'horse'), false, 'a second horse is drawn under the painted one');
    // The seated driver stands on the footboard and none of it is cut away; the wagon and the team are unchanged.
    const drove = seatLayout('wagon', direction, SIZES, 1, 1), driver = drove.find(part => part.part === 'rider');
    assert.equal(driver.seated, true);
    assert.equal(driver.shown, undefined, 'a whole seated driver is clipped at the hip');
    const hip = driver.dy - driver.height * SEAT.driverHip;
    assert.ok(Math.abs(hip - -SIZES.wagon * SEAT.wagonSeat) < 1e-9, `${direction}: the driver's hip is not on the wagon's seat (${hip})`);
    assert.ok(driver.dy < 0, `${direction}: the driver's boots are on the road, not the footboard`);
    assert.deepEqual(drove.map(part => part.part), seatLayout('wagon', direction, SIZES, 1, 0).map(part => part.part), 'the delivered driver changed the depth order');
    assert.deepEqual(drove.filter(part => part.part !== 'rider'), seatLayout('wagon', direction, SIZES, 1, 0).filter(part => part.part !== 'rider'), 'the delivered driver moved the wagon or the team');
  }
});
/**
 * That the page asks for the delivered art at all.
 *
 * Everything above is a pure function, and a pure function can be perfectly right while the renderer never calls it: that
 * is precisely how eight of Astra's batches came to be registered, measured, written up and drawn by nothing. public/app.js
 * cannot be imported into node, so this reads it - weak evidence, kept narrow, and standing in for what only
 * scripts/riding-browser-proof.mjs really proves by photographing the canvas.
 */
test('the page asks the seat for its own art, and gives the delivered rig its own height', () => {
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  assert.match(app, /const delivered = seatedClip\(entity, direction, seat\);/, 'the page no longer asks the seat which art it has');
  // A rider on the mule (2026-10-03) is always the composite: the painted rig is the chestnut horse (tests/mules-drawn.test.mjs).
  assert.match(app, /const ready = !entity\.appearance && !onMule && Boolean\(delivered\.whole \|\| delivered\.seated\) && clipReady\(delivered\.id\);/,
    'the page no longer checks whether the delivered rig is usable or composes an appearance-driven rider');
  assert.match(app, /seatLayout\(seat, direction, SIZE, figureScale\(entity\), ready \? \(seat === 'horse' \? MOUNTED_HEIGHT : 1\) : 0, rig\)/,
    'the delivered rig is no longer given a mount’s height, or the composite is no longer the fallback');
  // The wagon and ox as one drawing only once its sheet can be drawn; the two apart until then.
  assert.match(app, /const rig = Boolean\(rigClip\) && clipReady\(rigClip\.id\);/, 'the one-drawing rig is drawn without asking whether its sheet is here');
  assert.match(app, /if \(part\.part === 'rider' && \(part\.whole \|\| part\.seated\)\)/, 'the whole rig is no longer drawn whole');
  assert.match(app, /const clip = seatedClip\(entity, direction, null\);/, 'the composite no longer asks for the person alone');
});

/**
 * What `seatedClip` gives somebody who is really drawn as `figure`.
 *
 * Nobody chooses their own figure: `castVariant` rolls one out of the person's id, so a test that wants each delivered
 * identity has to find a person the roll actually produces. Rolling until it does is also the check that every delivered
 * identity is one a family can really be dealt - the loop throws if a figure is unreachable, which is what "art for a
 * person the game never makes" would look like.
 */
function seatedClipFor(figure, direction, seat = 'horse') {
  const WHO = {
    rust: { sex: 'male', band: 'adult', principal: true }, 'rust-woman': { sex: 'female', band: 'adult', principal: true },
    teal: { sex: 'female', band: 'adult' }, indigo: { sex: 'female', band: 'adult' },
    elder: { sex: 'male', band: 'adult' }, ochre: { sex: 'male', band: 'adult' },
    blue: { sex: 'male', band: 'youth' }, 'blue-girl': { sex: 'female', band: 'youth' },
    girl: { sex: 'female', band: 'child' }, boy: { sex: 'male', band: 'child' },
    smallchild: { band: 'small' }, infant: { band: 'infant' },
  };
  const who = WHO[figure];
  assert.ok(who, `${figure} is not a figure this test knows how to make a person for`);
  for (let n = 0; n < 500; n++) {
    const clip = seatedClip(person(`hh-${n}-x`, who), direction, seat);
    if (clip.id.startsWith(`${figure}-`)) return clip;
  }
  throw new Error(`no rolled person is ever drawn as ${figure}`);
}

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

/**
 * The wagon and its ox as one drawing (Claude's `wagon-ox-*`, area D; owner 2026-09-29: "wire the wagon-and-ox rig"). Changed on
 * purpose: with the rig there is no separate `wagon` or `ox` part, only `rig` - which is why the depth-order test above is asked
 * of the layout without it. What must not change is the driver: laid over the rig they sit exactly where they sat on the wagon
 * drawn apart, and the rig is put under them so its own seat is under their hip.
 */
test('the wagon and its ox as one drawing: the driver where they were, on the rig’s own seat; riders in its open tail', () => {
  const SIZES = { horse: 1.5, ox: 1.45, wagon: 1.55 };
  // The page's measures of the rig are the kit's (scripts/claude-art/kit/vehicles.mjs, areas/transport-vehicles.mjs).
  assert.equal(WAGON_RIG.units, WAGON.TOP);
  assert.equal(WAGON_RIG.depth, WAGON.DEPTH);
  assert.deepEqual({ ...WAGON_RIG.anchor }, { ...RIG_ANCHOR }, 'the page anchors the rig where the kit did not draw its anchor');
  const [su, sv, sw] = WAGON_RIG.seat;
  assert.ok(su > WAGON.GATHER && su < WAGON.U1 && sv === 0 && sw >= WAGON.W0 && sw <= WAGON.W1 + 4, 'the seat is not on the front of the bed');
  assert.ok(Math.abs(sw / WAGON.TOP - SEAT.wagonSeat) < 0.01, 'the rig’s seat is not at the height the wagon’s seat has always had');
  for (const u of WAGON_RIG.tail) assert.ok(u - WAGON_RIG.stagger > WAGON.U0 && u < WAGON.GATHER && WAGON_RIG.across < WAGON.HV, `a row at ${u} is not in the open tail`);
  for (const direction of ['e', 'w', 'n', 's']) for (const delivered of [0, 1]) {
    const apart = seatLayout('wagon', direction, SIZES, 1, delivered), one = seatLayout('wagon', direction, SIZES, 1, delivered, true);
    const driver = one.find(part => part.part === 'rider'), rig = one.find(part => part.part === 'rig');
    assert.deepEqual(driver, apart.find(part => part.part === 'rider'), `${direction}: the rig moved the driver`);
    assert.ok(!one.some(part => part.part === 'wagon' || part.part === 'ox'), `${direction}: the wagon or the ox is drawn a second time apart`);
    assert.equal(rig.height, SIZES.wagon, 'the rig is not drawn at the wagon’s height');
    // Its seat under the driver's hip.
    const seatAt = rigPoint(direction, WAGON_RIG.seat);
    assert.ok(Math.abs(rig.dx + seatAt.dx * SIZES.wagon - driver.dx) < 1e-9, `${direction}: the rig's seat is not under the driver`);
    assert.ok(Math.abs(rig.dy + seatAt.dy * SIZES.wagon - -SIZES.wagon * SEAT.wagonSeat) < 1e-9, `${direction}: the rig's seat is not at the driver's hip`);
    // The ox ahead of the driver the way they go: side-on further along, coming toward the camera lower down, going away higher.
    // (Where each stands on the ground: the ox's forefeet and the ground under the seat.)
    const oxAt = rigPoint(direction, [226, 0, 0]), under = rigPoint(direction, [su, 0, 0]);
    if (direction === 'e' || direction === 'w') assert.ok(oxAt.dx > under.dx && rig.dx + oxAt.dx * SIZES.wagon > driver.dx, `${direction}: the ox is behind the driver`);
    else assert.equal(Math.sign(oxAt.dy - under.dy), direction === 's' ? 1 : -1, `${direction}: the ox is not ahead`);
    // In the order the eye sees them.
    assert.deepEqual(one.map(part => part.band ? 'ox-again' : part.part), direction === 's' ? ['rig', 'rider', 'ox-again'] : direction === 'n' ? ['rider', 'rig'] : ['rig', 'rider'], `${direction}: drawn in the wrong order`);
    if (direction === 's') assert.ok(one.at(-1).band > 0.5 && one.at(-1).band < 0.9 && one.at(-1).dy === rig.dy, 'the ox is not drawn again in front of the driver');
    // Four riders in the open tail, behind the driver, clear of one another.
    const seats = [0, 1, 2, 3].map(i => bedLayout(direction, i, SIZES, 1, rig));
    assert.equal(new Set(seats.map(one => `${one.dx.toFixed(4)},${one.dy.toFixed(4)}`)).size, 4, `${direction}: two riders on one seat`);
    for (const one of seats) {
      assert.equal(one.rig, true);
      if (direction === 'e' || direction === 'w') assert.ok(one.dx < driver.dx - 0.5 && one.dx > rig.dx + (WAGON.U0 / WAGON.TOP) * SIZES.wagon, `${direction}: a rider is not in the tail (${one.dx})`);
      if (direction === 'n') assert.ok(one.dy > driver.dy && !one.behind, 'going away, a rider in the tail is not nearer the camera than the driver');
      if (direction === 's') assert.ok(one.dy < driver.dy && one.behind, 'coming toward the camera, a rider in the tail is drawn in front of the canvas');
    }
  }
  // Which drawing: laden, the bows bare over the load; somebody aboard, the tail open; else covered - each one Claude has drawn.
  for (const direction of ['e', 'w', 'n', 's']) {
    const facing = direction === 'w' ? 'e' : direction;
    assert.equal(wagonRigClip({}, direction, 0).id, `wagon-ox-${facing}`);
    assert.equal(wagonRigClip({}, direction, 2).id, `wagon-ox-open-${facing}`);
    assert.equal(wagonRigClip({ laden: true }, direction, 2).id, `wagon-ox-open-${facing}`, 'a laden wagon with riders hides them under bare bows');
    assert.equal(wagonRigClip({ laden: true }, direction, 0).id, `wagon-ox-loaded-${facing}`);
    for (const [cargo, riders] of [[{}, 0], [{}, 1], [{ laden: true }, 0]]) {
      const clip = wagonRigClip(cargo, direction, riders);
      assert.ok(claudeClips[clip.id]?.madeBy === 'claude', `${clip.id} is not drawn`);
      assert.equal(clip.upright, direction === 'n' || direction === 's');
    }
  }
});
