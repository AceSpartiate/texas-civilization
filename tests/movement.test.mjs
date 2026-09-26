// How movement is drawn, and that drawing it differently moved nobody.
//
// The owner (2026-09-16): "It still looks too fast. I don't want to change the rate at which
// players actually cover ground." Everything changed for that lives in public/motion.js and
// public/app.js. These tests hold both halves: the drawn walk is even across the whole tick and
// its feet keep pace with the ground drawn under it, and the simulation's own paces - the ground
// a tick covers, the calendar it carries, the real time it takes - are exactly what they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ProjectionMotion, CALENDAR_STEPS, drawnProgress, gaitStep, clipGait, GaitClock, STRIDE, GAIT_FLOOR } from '../public/motion.js';
import { CALENDAR_SCALE, TICK_MINUTES } from '../sim/clock.mjs';
import { BATTLE_STEPS } from '../sim/battle-stage.mjs';
import { WALK_SPEED, HORSE_SPEED, RIDER_SPEED, WAGON_SPEED } from '../sim/travel.mjs';
import { ARMY_MILES_PER_DAY } from '../sim/army.mjs';
import { PACES } from '../server/app.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { createSettledWorld } from './support/settled.mjs';

const road = { from: 'home-1', to: 'gonzales', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], distance: 10 };
const walker = progress => ({ id: 'walker', location: { x: progress, y: 0, siteId: null }, travel: { ...road, progress } });
const snap = (tick, progress, { revision = tick, minute = tick * 20, tickMs = 9500 } = {}) =>
  ({ sessionId: 's', revision, tickMs, world: { tick, minute, status: 'running', entities: [walker(progress)], others: [] } });

test('a command somewhere else in the class mid-tick neither snaps a walker forward nor squeezes the next tick into a burst', () => {
  const motion = new ProjectionMotion();
  motion.accept(snap(1, 0), 0);
  motion.accept(snap(2, 1), 9500);
  // Another family renames itself 40% of the way through the tick: same tick, new revision.
  motion.accept(snap(2, 1, { revision: 3 }), 9500 + 3800);
  const at = (progress, now) => motion.position(walker(progress), now).x;
  assert.ok(Math.abs(at(1, 9500 + 4750) - 0.5) < 1e-9, `halfway through the tick the walker was drawn at ${at(1, 9500 + 4750)}, not halfway`);
  // The next tick then plays across a whole tick, not the 5.7 seconds left after the command.
  motion.accept(snap(3, 2, { revision: 4 }), 19000);
  const share = (at(2, 19000 + 9500 / 4) - 1) / 1;
  assert.ok(Math.abs(share - 0.25) < 1e-9, `${share} of the next tick's walk was drawn in its first quarter`);
});

test('a tick on a compressed calendar is drawn as a walk, and a time jump is still snapped', () => {
  for (const step of Object.values(CALENDAR_SCALE)) {
    const motion = new ProjectionMotion();
    motion.accept(snap(1, 0, { minute: 1000 }), 0);
    motion.accept(snap(2, 3, { minute: 1000 + step }), 9500);
    assert.equal(motion.position(walker(3), 9500 + 4750).x, 1.5, `a ${step}-minute tick was not interpolated`);
  }
  const jumped = new ProjectionMotion();
  jumped.accept(snap(1, 0, { minute: 20 }), 0);
  jumped.accept(snap(2, 3, { minute: 20 + 14400 }), 9500);
  assert.equal(jumped.records.get('walker').previous, null, 'ten days in one tick was drawn as a walk');
  // A jump arrives as the same tick with the minute moved: that is not a mid-tick command.
  const same = new ProjectionMotion();
  same.accept(snap(1, 0), 0); same.accept(snap(2, 1), 9500);
  same.accept(snap(2, 6, { revision: 9, minute: 40 + 600 }), 12000);
  assert.equal(same.position(walker(6), 12000).x, 6, 'a time jump inside a tick was glided across');
});

test('a tick that arrives early carries on from where the walker is drawn, with no jump', () => {
  const motion = new ProjectionMotion();
  motion.accept(snap(1, 0, { tickMs: 1000 }), 0);
  motion.accept(snap(2, 1, { tickMs: 1000 }), 1000);
  const before = motion.position(walker(1), 1800).x;
  motion.accept(snap(3, 2, { tickMs: 1000 }), 1800);
  const after = motion.position(walker(2), 1800).x;
  assert.ok(Math.abs(before - after) < 1e-9, `drawn at ${before} before the tick and ${after} the frame after it arrived`);
  assert.equal(motion.position(walker(2), 2800).x, 2, 'and still reaches where the server put them by the end of the tick');
  assert.equal(drawnProgress(1, 2, 1.7), 2, 'the drawn walk never overshoots the reported position');
});

test('the drawn walker is never ahead of where the server has put them, however the ticks arrive', () => {
  // Owner, 2026-09-18: "he ran inhumanly fast". Speed is the server's and the page only draws it: a figure drawn further along
  // the road than the last snapshot says would be the page inventing ground. Ticks here arrive on time, early, late, twice
  // (another family's command), and on every calendar a class runs, and the drawn walker is sampled every frame between.
  const motion = new ProjectionMotion();
  const arrivals = [[0, 0, 20], [9500, 1, 20], [17000, 2, 20], [30000, 3, 20], [31000, 3, 20], [39500, 6, 60], [52000, 9.5, 240], [57000, 20, 720], [70000, 30.5, 720]];
  let latest = null, tick = 0, minute = 0, frames = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const [at, progress, step] = arrivals[i];
    const again = i > 0 && arrivals[i - 1][1] === progress;
    if (!again) { tick++; minute += step; }
    motion.accept(snap(tick, progress, { revision: 100 + i, minute }), at);
    latest = progress;
    const until = arrivals[i + 1]?.[0] ?? at + 20000;
    for (let now = at; now < until; now += 16, frames++) {
      const drawn = motion.position(walker(latest), now).x;
      assert.ok(drawn <= latest + 1e-9, `at ${now} ms the walker was drawn at ${drawn.toFixed(3)} miles, ahead of the server's ${latest}`);
    }
  }
  assert.ok(frames > 4000);
});

test('the walk cycle plays at the rate the drawn ground demands, never faster than authored', () => {
  // A 720ms stride over 0.86 of a body: covering 0.43 bodies in a second is half a stride.
  assert.equal(gaitStep({ elapsedMs: 1000, movedBodies: 0.43, cycleMs: 720, strideBodies: STRIDE.foot }), 360);
  // Ground going past faster than the art steps: the art's own rate, no flailing.
  assert.equal(gaitStep({ elapsedMs: 1000, movedBodies: 5, cycleMs: 720, strideBodies: STRIDE.foot }), 1000);
  // Barely moving: slow, not frozen.
  assert.equal(gaitStep({ elapsedMs: 1000, movedBodies: 0, cycleMs: 720, strideBodies: STRIDE.foot }), 1000 * GAIT_FLOOR);
  assert.equal(gaitStep({ elapsedMs: 0, movedBodies: 3, cycleMs: 720, strideBodies: STRIDE.foot }), 0, 'a paused clock steps nobody');

  const clips = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json', import.meta.url), 'utf8')).clips;
  assert.deepEqual(clipGait(clips['rust-walk']), { cycleMs: 720, strideBodies: STRIDE.foot });
  const wheel = clips['wagon-loaded-travel'].parts.find(part => part.turnsPerSecond > 0);
  assert.deepEqual(clipGait(clips['wagon-loaded-travel']), { cycleMs: 1000 / wheel.turnsPerSecond, strideBodies: Math.PI * wheel.height }, 'a wagon rolls its wheels over the ground');

  // At the study pace a person drawn seven pixels tall and covering 0.9 of a body a second - what a
  // default view measured (docs/evidence/movement-browser.json) - steps at three quarters of the art's rate.
  const clock = new GaitClock(), gait = clipGait(clips['rust-walk']);
  let played = 0;
  for (let frame = 1; frame <= 12; frame++) played = clock.time('walker', { clockMs: frame * 1000 / 12, at: { x: frame * 0.9 / 12, y: 0 }, bodyMiles: 1, gait });
  const rate = played / (11 * 1000 / 12);
  assert.ok(Math.abs(rate - 0.9 / 0.86 * 0.72) < 1e-9, `the cycle played at ${rate.toFixed(3)} of its authored speed`);
  // Turning from an east cycle (720ms) to a south one (440ms) keeps the foot where it was in the stride.
  const loops = played / 720, south = clipGait(clips['rust-walk-s']);
  const turned = clock.time('walker', { clockMs: 1000, at: { x: 0.9, y: 0 }, bodyMiles: 1, gait: south });
  assert.ok(Math.abs(turned / south.cycleMs - loops) < 1e-9, 'turning a corner jumped the stride');
});

test('the simulation covers exactly the ground it did: every pace constant, and a real walk tick by tick', () => {
  // And the steps a battle is watched at (sim/battle-stage.mjs, docs/BATTLES.md §2.2): an ordinary tick while a fight is fought.
  assert.deepEqual([...new Set([...Object.values(CALENDAR_SCALE), ...BATTLE_STEPS])].sort((a, b) => a - b), [...CALENDAR_STEPS], 'the drawing and the clock disagree about what one tick of calendar is');
  assert.equal(TICK_MINUTES, 20);
  assert.deepEqual({ ...CALENDAR_SCALE }, { home: 20, news: 60, gathering: 240, campaign: 720, preserved: 20 });
  // The family horse is five miles an hour since 2026-09-18 (sim/travel.mjs, `FIC-GONZ-059`); it went at the courier's 2.6 before.
  assert.deepEqual([WALK_SPEED, HORSE_SPEED, RIDER_SPEED, WAGON_SPEED, ARMY_MILES_PER_DAY], [1, 5 / 3, 2.6, 0.65, 14]);
  assert.deepEqual({ ...PACES }, { study: 9500, brisk: 4000, quick: 1000 });
  // Nothing under sim/ or server/ reads the renderer, so no drawing choice can reach the world.
  for (const dir of ['sim', 'server']) {
    for (const file of readdirSync(new URL(`../${dir}/`, import.meta.url)).filter(name => name.endsWith('.mjs'))) {
      assert.ok(!/from ['"][./]*public\//.test(readFileSync(new URL(`../${dir}/${file}`, import.meta.url), 'utf8')), `${dir}/${file} imports from public/`);
    }
  }
  // Thomas walking to Gonzales: where he is after each of eight ticks, as it was before this change.
  const world = createSettledWorld('movement-ground', 5);
  world.status = 'running';
  applyAction(world, 'hh-1', { action: 'travel', entityId: 'hh-1-thomas', destination: 'gonzales', mode: 'foot' });
  const walked = [];
  for (let tick = 0; tick < 8; tick++) { stepWorld(world); walked.push(+(world.entities['hh-1-thomas'].travel?.progress ?? -1).toFixed(6)); }
  assert.deepEqual(walked, GROUND);
});
// Recorded from sim/ at commit ee0beef, before any of the drawing changed: a mile a tick on foot.
const GROUND = [1, 2, 3, 4, 5, 6, 7, 8];
