import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, projectWorld } from '../sim/world.mjs';

// Why this file exists.
//
// The formations were once written into `initializeDirectors` as literal coordinates -
// (141, 65) and (162, 75) - taken from the grid map that preceded researched geography.
// When the map was rebuilt on real distances the whole world moved inside x -2..6.5,
// y -25..24, and nobody moved the battle with it. It kept resolving correctly, the
// captions kept arriving, every test kept passing, and the fighting was drawn 153 map
// miles east of Gonzales where no camera could ever reach it.
//
// `tests/aggregate-identity.test.mjs` already guards that a formation names nobody and
// that a person who joins one stays a person. Nothing guarded that the battle happens
// near the battle. VISION.md §16 says major battles should visibly occur; that promise
// has no meaning if the only thing checked is that the phases advance.
//
// So: the engagement must stand on the ground HIST-GONZ-008 documents - Ezekiel
// Williams's land, about seven miles upriver of the contested ford - and must stay
// inside the mapped country at every phase.

const PHASES = ['approach', 'exchange', 'withdrawal', 'resolved'];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Run to a phase and hand back a snapshot of where everyone stood while it held.
function observe(seed = 'battle-ground') {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  const seen = new Map();
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
    stepWorld(world);
    const phase = world.director.battle.phase;
    if (!seen.has(phase)) seen.set(phase, []);
    seen.get(phase).push(world.director.battle.formations.map(f => ({ id: f.id, side: f.side, x: f.x, y: f.y })));
  }
  return { world, seen };
}

test('the battle stands on the ground the history gives it, not on coordinates from a map that no longer exists', () => {
  const { world, seen } = observe();
  const camp = world.map.sites['williams-camp'], ford = world.map.sites.ford;
  assert.ok(camp && ford, 'the documented battle site and the ford must exist on the map');

  let checked = 0;
  for (const phase of PHASES) {
    const frames = seen.get(phase);
    assert.ok(frames?.length, `the battle never reached ${phase}`);
    for (const formations of frames) {
      for (const formation of formations) {
        // HIST-GONZ-008: the clash was on Williams's land. Three miles is generous for
        // an approach and a withdrawal and still nowhere near the next settlement.
        assert.ok(distance(formation, camp) <= 3,
          `${formation.id} stood ${distance(formation, camp).toFixed(1)} miles from Ezekiel Williams's land during ${phase}; the clash happened there`);
        checked++;
      }
    }
  }
  assert.ok(checked >= 8, 'every phase should have been sampled');
});

test('a formation is never drawn outside the country the map models', () => {
  const { world, seen } = observe();
  // `map.bounds` is the province outline drawn for context and spans -340..400; almost
  // any wrong coordinate falls inside it, so it proves nothing. `homeBounds` is the
  // ground the households, sites and roads actually occupy, and is the frame a camera
  // can reach. Checking the wrong one is how the original bug survived.
  const bounds = world.map.homeBounds;
  assert.ok(bounds, 'the map must declare the bounds of the modelled home country');
  for (const [phase, frames] of seen) {
    for (const formations of frames) {
      for (const formation of formations) {
        assert.ok(formation.x >= bounds.minX && formation.x <= bounds.maxX && formation.y >= bounds.minY && formation.y <= bounds.maxY,
          `${formation.id} was at (${formation.x.toFixed(1)}, ${formation.y.toFixed(1)}) during ${phase}, outside the mapped country x[${bounds.minX}..${bounds.maxX}] y[${bounds.minY}..${bounds.maxY}]`);
      }
    }
  }
});

// This one deliberately does NOT fail against the original hardcoded coordinates -
// those happened to be far from town and happened to retreat the right way. It guards a
// different thing: that the geometry stays historical if anyone re-stages the scene.
test('the fighting is upriver of the town, and Castañeda withdraws away from it', () => {
  const { world, seen } = observe();
  const town = world.map.sites.gonzales, ford = world.map.sites.ford;

  // HIST-GONZ-008 puts the clash upriver of the contested ford, not in the settlement.
  for (const formations of seen.get('exchange')) {
    for (const formation of formations) {
      assert.ok(distance(formation, town) > 3,
        `${formation.id} exchanged fire ${distance(formation, town).toFixed(1)} miles from Gonzales; the battle did not happen in the town`);
    }
  }

  // HIST-GONZ-004: the detachment withdrew toward Béxar. Whatever the map's shape, that
  // means further from the crossing it came over, never back toward Gonzales.
  const held = seen.get('exchange').at(-1).find(f => f.side === 'mexican');
  const gone = seen.get('resolved').at(-1).find(f => f.side === 'mexican');
  assert.ok(distance(gone, ford) > distance(held, ford) + 1,
    `the Mexican detachment ended ${distance(gone, ford).toFixed(1)} miles from the ford having held at ${distance(held, ford).toFixed(1)}; a withdrawal toward Béxar moves away from the crossing`);
});

test('a household standing at Gonzales is actually sent the battle it is entitled to see', () => {
  const { world } = observe();
  // The projection is the only thing a client can draw. If the formations are not in
  // it, or carry no usable position, no camera can frame them however correct the
  // simulation is.
  const anyone = Object.keys(world.households)[0];
  const projection = projectWorld(world, anyone, 'student', { includeMap: false });
  assert.ok('battle' in projection, 'a student projection must carry the battle field');

  // The Host watches it live, framed on the field (docs/BATTLES.md §2.1): sent while it is fought, at drawable places on
  // Williams's land, with its camera told to go there.
  const live = createGonzalesWorld('battle-ground-host', 5);
  live.status = 'running';
  for (let tick = 0; tick < 600 && live.director.battle.phase !== 'exchange'; tick++) stepWorld(live);
  const hostView = projectWorld(live, null, 'host', { includeMap: false });
  assert.ok(hostView.battle, 'the Host was not sent the fight while it was fought');
  assert.equal(hostView.host.focus, 'battle', 'the Host\'s camera was not sent to the field');
  const camp = live.map.sites['williams-camp'];
  for (const side of hostView.battle.sides) {
    assert.ok(Number.isFinite(side.x) && Number.isFinite(side.y), `${side.side} reached the Host without a drawable position`);
    assert.ok(Math.hypot(side.x - camp.x, side.y - camp.y) < 3, `${side.side} reached the Host ${Math.hypot(side.x - camp.x, side.y - camp.y).toFixed(1)} miles from Williams's land`);
  }
});

test('a class saved against a different map re-anchors instead of drawing the old coordinates', () => {
  // No save version moves for this fix, so the guarantee has to be that a stale stored
  // position is corrected rather than trusted. This is that guarantee, and it is scoped
  // to a class still being played: a finished director stops advancing on purpose, and
  // what the Host replays afterwards is the frames it recorded while it ran.
  const world = createGonzalesWorld('stale-save', 5);
  world.status = 'running';
  for (let tick = 0; tick < 400 && world.director.battle.phase === 'waiting'; tick++) stepWorld(world);
  assert.equal(world.director.complete, false, 'this must be a class that is still running');
  for (const formation of world.director.battle.formations) { formation.x = 141; formation.y = 65; }
  stepWorld(world);
  for (const formation of world.director.battle.formations) {
    assert.notEqual(formation.x, 141, `${formation.id} kept a coordinate from a map this world does not use`);
    assert.ok(Math.hypot(formation.x - world.map.sites['williams-camp'].x, formation.y - world.map.sites['williams-camp'].y) <= 3,
      `${formation.id} was not re-anchored to the battle site after a stale position was loaded`);
  }
});
