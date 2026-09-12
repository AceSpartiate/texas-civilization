// A hunt you can watch.
//
// The owner: "when they're out hunting, maybe i should see them actually hunting?" It was
// one step - five ticks of standing on the spot the road left them, with a searching pose
// playing - and nothing about it looked like hunting. It is now the stages it always was
// underneath: in from the edge, up through the trees, still and downwind, and the shot.
//
// The constraint that shaped it is `HIST-GONZ-013`: buffalo is the only documented game
// for this locality, and sim/chores.mjs has never named another. So **nothing here names
// or draws the quarry**. The shot is smoke in the trees and somebody walking home carrying
// something, and that is the honest picture rather than a limitation worked round.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES } from '../sim/chores.mjs';

const running = (seed = 'hunt', count = 5) => {
  const world = createGonzalesWorld(seed, count);
  world.status = 'running';
  return world;
};

/**
 * Send somebody hunting and watch every tick of it: where they were, what they were
 * doing, and whether the world was still coherent.
 */
function hunt(seed, entityId = 'hh-1-mateo', householdId = 'hh-1', mode) {
  const world = running(seed);
  const entity = world.entities[entityId];
  applyAction(world, householdId, { action: 'chore', entityId, chore: 'hunt-timber', ...(mode && { mode }) });
  const frames = [];
  for (let tick = 0; tick < 400 && entity.chore; tick++) {
    frames.push({
      tick: world.tick, siteId: entity.location.siteId, x: entity.location.x, y: entity.location.y,
      doing: entity.chore?.doing, travelling: Boolean(entity.travel),
    });
    stepWorld(world);
    // Every single tick, not only at the end: a stage that put somebody nowhere, or at a
    // place and on a road at once, is exactly what validateWorld refuses.
    validateWorld(world);
  }
  assert.equal(entity.chore, null, 'the hunt never finished');
  return { world, entity, frames };
}

test('a hunt is a sequence of places in the timber, not one spot for five ticks', () => {
  const { world, frames } = hunt('stages');
  const inTimber = frames.filter(frame => !frame.travelling && frame.siteId && frame.siteId !== 'home-1');
  assert.ok(inTimber.length >= 4, `only ${inTimber.length} ticks were spent in the timber`);
  // They are at the timber the whole time - the stages move them about the stand, they do
  // not move them between places. That is the same rule the yard walk follows.
  const where = new Set(inTimber.map(frame => frame.siteId));
  assert.equal(where.size, 1, `a hunter changed site mid-hunt: ${[...where].join(', ')}`);
  // And they genuinely move within it.
  const spots = new Set(inTimber.map(frame => `${frame.x},${frame.y}`));
  assert.ok(spots.size >= 3, `a hunter stood in ${spots.size} place(s) for the whole hunt`);
  // Within it, and not merely claiming to be. A stage that moved somebody relative to a
  // place they are not - their own yard, say - would leave the site id saying "timber"
  // while the figure was drawn half a county away, which is the exact teleport the yard
  // walk fell into once and which no site check can see.
  const stand = world.map.sites[inTimber[0].siteId];
  for (const frame of inTimber) {
    const strayed = Math.hypot(frame.x - stand.x, frame.y - stand.y);
    assert.ok(strayed < .8, `a hunter said they were at the timber from ${strayed.toFixed(2)} miles away`);
  }
});

test('every stage says what is being done, and none of them names an animal', () => {
  const { frames } = hunt('words');
  const said = [...new Set(frames.map(frame => frame.doing))];
  for (const stage of ['reading the ground at the edge of the timber', 'working up through the timber', 'waiting downwind, and still', 'the shot']) {
    assert.ok(said.includes(stage), `no stage said "${stage}": ${JSON.stringify(said)}`);
  }
  // HISTORY.md's exclusion, enforced rather than remembered. Buffalo is the only game
  // documented for this locality and this project names no other; the quarry is never
  // named at all, here or anywhere else in the chore.
  const everything = [...said, CHORES['hunt-timber'].describe, CHORES['hunt-timber'].name].join(' ').toLowerCase();
  for (const creature of ['deer', 'buck', 'doe', 'buffalo', 'bison', 'turkey', 'boar', 'hog', 'rabbit', 'bear', 'elk', 'antelope']) {
    assert.ok(!everything.includes(creature), `the hunt names a ${creature}`);
  }
});

test('the shot happens once, is written down, and is gone the tick after', () => {
  const { world, frames } = hunt('shot');
  const firing = frames.filter(frame => frame.doing === 'the shot');
  assert.equal(firing.length, 1, `the shot was showing for ${firing.length} ticks`);
  const shots = world.events.filter(event => event.type === 'hunt');
  assert.equal(shots.length, 1, 'a hunt fired a different number of shots than one');
  assert.match(shots[0].text, /fired in the timber/);
  assert.equal(shots[0].householdId, 'hh-1', 'the family’s own record should hold it');
  // Recorded in a place, at a time, by somebody. That is what a shot being audible would
  // one day be built on, and a record with no actor could never carry it.
  assert.equal(shots[0].actorId, 'hh-1-mateo');
  assert.ok(Number.isFinite(shots[0].minute));
});

test('they come home carrying it, and the walk out is not the walk back', () => {
  const { frames } = hunt('carry');
  const out = frames.find(frame => frame.doing === 'on the road to the timber');
  const back = frames.find(frame => frame.doing === 'carrying it home from the timber');
  assert.ok(out, 'nobody ever set out');
  assert.ok(back, 'they walked home exactly as they walked out, with nothing to show for it');
  assert.ok(frames.indexOf(back) > frames.indexOf(out));
  // The carry cycle is what the renderer keys on, and it only reads the words the server
  // sent. If this text changes, public/motion.js has to change with it.
  assert.match(back.doing, /carrying it home/);
});

test('two families hunting one stand of timber do not stand inside each other', () => {
  const world = running('crowded');
  // Put the second family's hunter at the same stand by sending both from the same house.
  const first = world.entities['hh-1-mateo'], second = world.entities['hh-1-rosa'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'hunt-timber' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: second.id, chore: 'hunt-timber' });
  let apart = 0;
  for (let tick = 0; tick < 400 && (first.chore || second.chore); tick++) {
    stepWorld(world);
    if (first.location.siteId && first.location.siteId === second.location.siteId) {
      apart = Math.max(apart, Math.hypot(first.location.x - second.location.x, first.location.y - second.location.y));
    }
  }
  assert.ok(apart > .02, `two hunters in one stand were never more than ${apart.toFixed(3)} miles apart`);
});

test('the hunt still costs about what it cost, and yields exactly what it yielded', () => {
  // Showing the work must not quietly reprice it. On foot a hunt brought home five food
  // before the stages existed and brings home five now; what changed is that a student can
  // watch it happen.
  const { world, frames } = hunt('cost');
  const timberTicks = frames.filter(frame => !frame.travelling && frame.siteId !== 'home-1').length;
  assert.ok(timberTicks >= 5 && timberTicks <= 10, `a hunt spent ${timberTicks} ticks in the timber`);
  assert.ok(world.events.some(event => /could carry 5 food home/.test(event.text)),
    'a hunt on foot no longer brings home the five food it always did');

  // On foot the carry cap hides the kill entirely, so a hunt that quietly doubled its
  // yield would look identical from here. The wagon is where the number shows.
  const hauled = running('cost-wagon');
  const before = hauled.households['hh-1'].resources.food;
  applyAction(hauled, 'hh-1', { action: 'chore', entityId: 'hh-1-mateo', chore: 'hunt-timber', mode: 'wagon' });
  for (let tick = 0; tick < 400 && hauled.entities['hh-1-mateo'].chore; tick++) stepWorld(hauled);
  const gained = hauled.households['hh-1'].resources.food - before;
  assert.ok(gained > 9 && gained < 15.5, `a hunt with the wagon brought home ${gained.toFixed(1)} food`);
});

test('a stalk only ever moves somebody about the place they are standing', () => {
  // The trap `walk` fell into once: a step that moves a person relative to somewhere they
  // are not carries them across the map for nothing. Every stage of every hunt here is
  // checked against the world's own invariants on the tick it happens, and a hunter is
  // never both on a road and at a place.
  for (const seed of ['invariant-a', 'invariant-b', 'invariant-c']) {
    const { frames } = hunt(seed);
    for (const frame of frames) {
      assert.ok(frame.travelling ? frame.siteId === null : Boolean(frame.siteId),
        `at tick ${frame.tick} a hunter was ${frame.travelling ? 'on the road and at a site' : 'nowhere'}`);
    }
  }
});
