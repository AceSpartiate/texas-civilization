// Walk, fade, cross, fade, walk: how a journey is drawn, so nobody is seen moving faster than they could move.
//
// Owner, 2026-09-22, after the marker built for the same complaint on 2026-09-18: "characters are still seen zipping
// around. i don't want to see icons. i want to see them walk at a normal pace, then when they've walked a ways (say if
// they're going somewhere that isn't their farm) they should fade out. then after they travel extra fast, they fade back in
// after arriving close enough to when normally the rest of the way. that way they arrive at the correct time, but no one
// sees them move unnaturally."
//
// And the correction the same day: "this shouldn't be a thing on their land. everyone should move at normal speed at all
// times (unless on horseback or wagon) on their land."
//
// These are about the *drawing* only. Nothing here is stored, nothing here is sent, and the simulation is untouched: the
// server still owns every journey, every pace and every arrival minute (sim/travel.mjs, sim/world.mjs). The schedule is
// public/motion.js `travelSight`; the drawing is public/app.js (`sightOf`, `drawTravelRoads`); the browser proof that the
// page really does it is scripts/travel-drawn-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ProjectionMotion, FADE_RATE, FADE_STALE_MS, GAIT_CEILING, SEEN_MILES, SEEN_YARDS, STRIDE, TRAVEL_FADE_MS, YARDS_A_MILE,
  drawnHeightsPerSecond, drawnMilesASecond, fadeToward, gaitMilesASecond, landRuns, routeIndexAfter, travelMilesATick, travelSight,
} from '../public/motion.js';
import * as motion from '../public/motion.js';
import { MOUNTED_HEIGHT } from '../public/motion.js';
import { HORSE_SPEED, RIDER_SPEED, WAGON_SPEED, WALK_SPEED } from '../sim/travel.mjs';
import { SMALL_WALK_SPEED } from '../sim/company.mjs';

// The camera the owner was pressed close in at when they saw the zipping (docs/evidence/travel-speed-screen.json), and the
// family's own view of its farming day, where a walker was always a figure and always will be.
const CLOSE = { scale: 2605.3, heightPx: 49.5 }, FOLLOW = { scale: 8.4, heightPx: 7 };
const TICK_MS = 9500;
/** One journey's numbers as the page has them: the ground the server carries a tick, and the ground the gait allows. */
const view = (milesATick, camera) => ({
  milesASecond: drawnMilesASecond({ milesATick, tickMs: TICK_MS }),
  gait: gaitMilesASecond(camera),
});

test('the gait a figure is held to is the ground its own drawn cycle covers, and it is its mount\'s when it has one', () => {
  // Above GAIT_CEILING `gaitStep` cannot play a cycle fast enough for the feet to keep up with the ground: the figure skates.
  const clips = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json', import.meta.url), 'utf8'));
  const all = clips.clips || clips;
  const loop = id => all[id].frames.reduce((total, frame) => total + frame.duration, 0) / 1000;
  const rates = {
    walk: STRIDE.foot / loop('rust-walk'), childWalk: STRIDE.foot / loop('girl-walk'),
    horse: STRIDE.hoof / loop('horse-walk'), ox: STRIDE.hoof / loop('ox-walk'),
  };
  for (const [cycle, rate] of Object.entries(rates)) {
    assert.ok(Math.abs(rate - GAIT_CEILING) <= 0.1, `${cycle} covers ${rate.toFixed(2)} heights a second at its own rate, not about ${GAIT_CEILING}`);
  }
  assert.ok(GAIT_CEILING >= 1 && GAIT_CEILING <= 1.5, 'and inside the 1 to 1.5 a second a walk looks natural at');
  // Owner, 2026-09-22: "unless on horseback or wagon". Counted in the figure's own drawn height, the ceiling is already the
  // pace of what they are on - a rider and horse are drawn 1.8 of a person and may cross 1.8 times the ground.
  const walker = gaitMilesASecond(CLOSE), rider = gaitMilesASecond({ ...CLOSE, heightPx: CLOSE.heightPx * 1.8 });
  assert.ok(Math.abs(rider / walker - 1.8) < 1e-9, `a rider is allowed ${(rider / walker).toFixed(2)} of a walker's ground`);
  for (const bad of [{ scale: 0 }, { heightPx: 0 }, { scale: NaN }]) assert.equal(gaitMilesASecond({ ...CLOSE, ...bad }), 0);
});

test('the numbers the owner saw: close in the server outruns the gait five times over, in the family view it never does', () => {
  const close = drawnHeightsPerSecond({ milesATick: 1, tickMs: TICK_MS, ...CLOSE });
  const follow = drawnHeightsPerSecond({ milesATick: 1, tickMs: TICK_MS, ...FOLLOW });
  assert.ok(Math.abs(close - 5.54) < 0.01, `pressed close in a walker would be drawn at ${close} heights a second`);
  assert.ok(Math.abs(follow - 0.126) < 0.001, `in the family's own view at ${follow}`);
  assert.ok(close > GAIT_CEILING && follow < GAIT_CEILING);
  for (const bad of [{ milesATick: 0 }, { tickMs: 0 }, { scale: NaN }, { heightPx: 0 }]) {
    assert.equal(drawnHeightsPerSecond({ milesATick: 1, tickMs: TICK_MS, scale: 100, heightPx: 20, ...bad }), 0);
  }
  assert.equal(drawnMilesASecond({ milesATick: 0, tickMs: TICK_MS }), 0);
  assert.equal(drawnMilesASecond({ milesATick: 1, tickMs: 0 }), 0);
});

test('the miles a tick carries a journey are the server\'s step, and a speed only where no step was sent', () => {
  assert.equal(travelMilesATick({ step: 0.875, speed: 1 }, 720), 0.875);
  assert.equal(travelMilesATick({ speed: 1 }, 60), 3, 'a class saved before step: a farming tick\'s speed three times over');
  assert.equal(travelMilesATick({ speed: 1 }), 1);
  assert.equal(travelMilesATick(null), 0);
});

test('slow enough to watch, and the journey is drawn exactly where the server has it, whole, all the way', () => {
  // The family's own view of its own farming day: the case the owner never complained about, and it must not change.
  const { milesASecond, gait } = view(1, FOLLOW);
  assert.ok(milesASecond < gait);
  for (const miles of [0, 0.01, 1, 2.5, 3]) {
    const sight = travelSight({ distance: 3, miles, milesASecond, gait });
    assert.equal(sight.miles, miles, `at ${miles} miles along the figure was moved`);
    assert.equal(sight.alpha, 1, `at ${miles} miles along the figure was faded`);
    assert.equal(sight.faded, false);
  }
});

test('walk, fade, cross, fade, walk: a hundred yards in view at each end and the middle crossed with nobody watching', () => {
  // A walk to Gonzales, three miles, pressed close in: the owner's own case.
  const distance = 3, { milesASecond, gait } = view(1, CLOSE);
  const step = distance / 4000;
  let lead = 0, blind = 0, tail = 0, fading = 0, worst = 0, last = -1;
  for (let miles = 0; miles <= distance + 1e-9; miles += step) {
    const now = travelSight({ distance, miles, milesASecond, gait });
    assert.ok(now.miles >= last - 1e-9, `the figure went backwards at ${miles.toFixed(3)} miles`);
    assert.ok(now.miles <= distance + 1e-9 && now.miles >= 0);
    if (now.alpha === 1) { if (now.miles < distance / 2) lead++; else tail++; }
    else if (now.alpha === 0) blind++;
    else fading++;
    // The drawn speed while any of them is in view: a share `rate` of what the server is doing, and never past the gait.
    if (now.alpha > 0) worst = Math.max(worst, now.rate * milesASecond);
    last = now.miles;
  }
  assert.ok(worst <= gait + 1e-12, `in view the figure was drawn at ${worst} miles a second, past the gait's ${gait}`);
  assert.ok(lead > 0 && tail > 0, `walked in view at both ends (${lead} and ${tail} samples)`);
  assert.ok(blind > lead + tail, `the middle (${blind} samples) is not the longest part of the journey`);
  assert.ok(fading > 0, `it fades rather than blinking (${fading} samples part drawn)`);
  // The ends are about a hundred yards of drawn road each, which is what the owner chose.
  const seenLead = travelSight({ distance, miles: 0, milesASecond, gait }).lead;
  assert.ok(Math.abs(seenLead * YARDS_A_MILE - SEEN_YARDS) < 1, `the walked lead is ${Math.round(seenLead * YARDS_A_MILE)} yards, not about ${SEEN_YARDS}`);
  assert.equal(SEEN_MILES, SEEN_YARDS / YARDS_A_MILE);
  assert.ok(TRAVEL_FADE_MS >= 400 && TRAVEL_FADE_MS <= 1200, 'a fade that reads as a fade and not as a blink');
});

test('the zoom wheel cannot make a figure vanish between two frames: the drawn share is eased, never taken', () => {
  // The schedule's own ramp never pops. What pops is the schedule changing under it - the gait is measured in the figure's
  // drawn height, so zooming in moves it past the server's pace in one frame - and that is what `fadeToward` catches.
  // The numbers are held absolutely and not against each other, or the test moves with whatever it is meant to guard.
  assert.ok(FADE_RATE >= 1, 'the ease is slower than the schedule\'s own ramp, and would hold the fade back');
  assert.ok(TRAVEL_FADE_MS / FADE_RATE >= 250, `the worst jump is eased over ${TRAVEL_FADE_MS / FADE_RATE} ms, too fast to read as a fade`);
  assert.ok(FADE_STALE_MS < TRAVEL_FADE_MS);
  // Frame by frame at sixty a second, from whole to gone: no frame may take a big bite, and it may not be over in three.
  let alpha = 1, frames = 0;
  while (alpha > 0 && frames < 500) {
    const next = fadeToward(alpha, 0, 16);
    assert.ok(alpha - next <= 0.08, `the figure went from ${alpha} to ${next} in one painted frame`);
    alpha = next; frames++;
  }
  assert.ok(frames >= 12, `the worst jump took ${frames} painted frames, which is a pop and not a fade`);
  // Never slower than the schedule's own ramp, which is a whole fade of real time: a frame of that ramp passes untouched.
  assert.equal(fadeToward(0.5, 1, TRAVEL_FADE_MS), 1);
  assert.equal(fadeToward(0.5, 0, TRAVEL_FADE_MS), 0);
  assert.equal(fadeToward(0.5, 1, 0), 0.5, 'a frame with no time in it moved the figure');
  assert.equal(fadeToward(0.5, 1, 100, 0), 1, 'with no fade at all it is taken at once');
});

test('the drawn arrival is the server\'s arrival, and nobody is ever drawn at the far end before the server puts them there', () => {
  // This is the whole contract with the simulation: the schedule maps the journey's end to the journey's end.
  for (const [distance, milesATick] of [[3, 1], [40, 10.5], [0.5, 1], [188, 2.6]]) {
    const { milesASecond, gait } = view(milesATick, CLOSE);
    const end = travelSight({ distance, miles: distance, milesASecond, gait });
    assert.equal(end.miles, distance, `a journey of ${distance} miles was not drawn arriving`);
    assert.equal(end.alpha, 1, `a journey of ${distance} miles arrived invisible`);
    for (const share of [0.9, 0.99, 0.999]) {
      const near = travelSight({ distance, miles: distance * share, milesASecond, gait });
      assert.ok(near.miles < distance, `at ${share} of the way the figure was already at the far end`);
    }
    // Past the end, and before the start: clamped, never wilder than the road.
    assert.equal(travelSight({ distance, miles: distance * 2, milesASecond, gait }).miles, distance);
    assert.equal(travelSight({ distance, miles: -5, milesASecond, gait }).miles, 0);
  }
});

test('the family\'s own land is never sped up and never faded, however long the road across it is', () => {
  // Owner, 2026-09-22: "everyone should move at normal speed at all times (unless on horseback or wagon) on their land."
  const distance = 3, { milesASecond, gait } = view(1, CLOSE);
  // Half a mile of the road out is the family's own land: five times the hundred yards, and every foot of it is walked.
  const leaves = 0.5;
  const onLand = travelSight({ distance, miles: leaves - 0.001, milesASecond, gait, leaves, enters: distance });
  assert.equal(onLand.alpha, 1, 'a figure still on its own land was faded');
  assert.ok(onLand.lead > leaves, `the walked lead is ${onLand.lead} miles, inside the ${leaves} of own land`);
  assert.ok(Math.abs(onLand.lead - (leaves + SEEN_MILES)) < 1e-9, 'the walked lead is not the land plus the hundred yards');
  for (let miles = 0; miles <= leaves; miles += leaves / 200) {
    assert.equal(travelSight({ distance, miles, milesASecond, gait, leaves, enters: distance }).alpha, 1, `faded at ${miles} miles, on their own land`);
  }
  // Coming home: the last half mile is their own land, and the fade-in is finished before the line.
  const back = travelSight({ distance, miles: distance - leaves, milesASecond, gait, leaves: 0, enters: distance - leaves });
  assert.equal(back.alpha, 1, 'a figure crossing back onto its own land was still faded');
  // A journey that never leaves their land is walked whole at their own pace (owner, 2026-09-27), however far behind the
  // server that leaves the drawing: it cannot be faded, and it may not be hurried. Until then it was drawn at the server's
  // pace, which is what a `ceiling:` in `travelSight` used to name.
  const home = travelSight({ distance: 0.4, miles: 0.2, milesASecond, gait, leaves: 0.4, enters: 0 });
  assert.equal(home.faded, false);
  assert.equal(home.alpha, 1);
  assert.ok(Math.abs(home.miles - 0.2 * gait / milesASecond) < 1e-12, `a journey wholly on own land was drawn at ${home.miles}, not walked at the pace`);
  assert.ok(Math.abs(home.end - 0.4 * milesASecond / gait) < 1e-9, 'the drawn arrival is not where a walk at the pace puts it');
});

test('not one frame of any journey is faded, or part faded, while the figure is still on its own land', () => {
  // Owner, 2026-09-22, and it is absolute: "everyone should move at normal speed at all times (unless on horseback or
  // wagon) on their land." So the family's own land is paid for first and in full, and the hundred yards off it give way -
  // never the other way round. Where the road cannot pay even for the land, it is paced (owner, 2026-09-27): the land walked
  // at the pace, the fades off it as short as the journey needs, and the drawn arrival late rather than the land hurried.
  //
  // Every combination below is swept frame by frame, and the one thing asserted of every sample is the owner's sentence:
  // while the drawn figure is on its own land, all of it is drawn.
  const hurried = drawnMilesASecond({ milesATick: 1, tickMs: 1000 }), farming = drawnMilesASecond({ milesATick: 1, tickMs: 9500 });
  const long = drawnMilesASecond({ milesATick: 10.5, tickMs: 9500 });
  const gait = gaitMilesASecond(CLOSE);
  let sawFade = false, sawWhole = false, sawPaced = false;
  for (const milesASecond of [farming, hurried, long]) {
    for (const distance of [3, 5, 40, 188]) {
      // Land at the start only (setting out from the house), at the end only (coming home), and at both.
      for (const [leaves, enters] of [[0.5, distance], [0, distance - 0.5], [0.25, distance - 0.25], [0.5, distance - 0.5]]) {
        const where = `${Math.round(milesASecond * 1000) / 1000} mi/s, ${distance} miles, land ${leaves}..${enters}`;
        let least = 1;
        for (let miles = 0; miles <= distance; miles += distance / 800) {
          const sight = travelSight({ distance, miles, milesASecond, gait, leaves, enters });
          if (sight.paced) sawPaced = true; else if (sight.faded) sawFade = true; else sawWhole = true;
          least = Math.min(least, sight.alpha);
          // The figure's *drawn* place is what matters, not the server's: `sight.miles` is where it was put on the road.
          const onOwnLand = sight.miles <= leaves || sight.miles >= enters;
          if (onOwnLand) assert.equal(sight.alpha, 1, `at ${sight.miles.toFixed(3)} miles the figure was ${sight.alpha} drawn while on its own land (${where})`);
        }
        // And a journey that could not pay for its own land is not half-faded, it is not faded at all.
        const sight = travelSight({ distance, miles: 0.01, milesASecond, gait, leaves, enters });
        if (!sight.faded) assert.equal(least, 1, `an unfaded journey faded somewhere (${where})`);
        if (sight.faded) assert.ok(sight.lead >= leaves - 1e-9 && sight.tail >= distance - enters - 1e-9, `the land was not paid for in full (${where}): lead ${sight.lead}, tail ${sight.tail}`);
      }
    }
  }
  assert.ok(sawFade && sawPaced, 'the sweep never reached both sides of the rule, so it is not measuring the squeeze');
  // The squeeze itself, named: a class hurried to a one-second tick, pressed right in, on a five-mile errand that starts at
  // the house. Walking half a mile of farm at the gait costs more real time than the whole journey has. Until 2026-09-27 it
  // was drawn where the server had it, hurried across the farm; now it is paced: walked at the gait, and late.
  const tight = travelSight({ distance: 5, miles: 0.01, milesASecond: hurried, gait, leaves: 0.5, enters: 5 });
  assert.equal(tight.paced, true, 'an errand that could not pay for its own land was not paced');
  assert.equal(tight.alpha, 1);
  assert.ok(Math.abs(tight.miles - 0.01 * gait / hurried) < 1e-12, 'and it is not walked at the gait on its own land');
  assert.ok(tight.end > 5, 'and its drawn arrival is not late');
  // Given room, the land is paid for *and* the hundred yards: the same errand in the farming day.
  const easy = travelSight({ distance: 5, miles: 0.01, milesASecond: farming, gait, leaves: 0.5, enters: 5 });
  assert.equal(easy.faded, true);
  assert.ok(Math.abs(easy.lead - (0.5 + SEEN_MILES)) < 1e-9, `with room the lead is ${easy.lead}, not the land plus the hundred yards`);
  // And the two ends share what is left rather than one end taking it.
  const both = travelSight({ distance: 5, miles: 0.01, milesASecond: farming, gait, leaves: 0.25, enters: 4.75 });
  assert.ok(Math.abs((both.lead - 0.25) - (both.tail - 0.25)) < 1e-9, `the ends were given ${both.lead} and ${both.tail}`);
});

test('a journey too short to hold two walked ends and two fades is simply walked, and never blinks', () => {
  const { milesASecond, gait } = view(1, CLOSE);
  // Two hundred yards, which is the two walked ends and nothing between them.
  for (const distance of [SEEN_MILES, 2 * SEEN_MILES, 0.2]) {
    let least = 1;
    for (let miles = 0; miles <= distance; miles += distance / 100) {
      const sight = travelSight({ distance, miles, milesASecond, gait });
      least = Math.min(least, sight.alpha);
      assert.equal(sight.miles, miles, `a ${Math.round(distance * YARDS_A_MILE)} yard journey was moved at ${miles}`);
    }
    assert.equal(least, 1, `a ${Math.round(distance * YARDS_A_MILE)} yard journey faded`);
  }
  // Nothing to schedule: no journey, no camera, no clock.
  for (const bad of [{ distance: 0 }, { milesASecond: 0 }, { gait: 0 }, { distance: NaN }]) {
    const sight = travelSight({ distance: 3, miles: 1, milesASecond, gait, ...bad });
    assert.equal(sight.alpha, 1);
    assert.equal(sight.faded, false);
  }
});

test('where a road leaves the family\'s land and where it last comes back onto it', () => {
  const grant = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const inside = at => at.x >= grant.minX && at.x <= grant.maxX && at.y >= grant.minY && at.y <= grant.maxY;
  // Out of the grant, across the country, and back in again at the far end.
  const out = landRuns([{ x: .5, y: .5 }, { x: 5, y: .5 }], inside, 4.5);
  assert.ok(out.leaves > 0.4 && out.leaves < 0.6, `the road leaves the land at ${out.leaves} miles, not about half`);
  assert.equal(out.enters, 4.5, 'a road that never comes back was said to come back');
  const home = landRuns([{ x: 5, y: .5 }, { x: .5, y: .5 }], inside, 4.5);
  assert.equal(home.leaves, 0, 'a road that starts off the land was said to start on it');
  // At or before the true crossing, never past it: the fade-in has to be finished *before* the line, not on it.
  assert.ok(home.enters > 3.9 && home.enters <= 4, `the road comes back onto the land at ${home.enters} miles, past the line at 4`);
  // Wholly on it, and wholly off it.
  assert.deepEqual(landRuns([{ x: 0, y: 0 }, { x: 1, y: 1 }], inside, Math.SQRT2), { leaves: Math.SQRT2, enters: 0 });
  assert.deepEqual(landRuns([{ x: 9, y: 9 }, { x: 12, y: 9 }], inside, 3), { leaves: 0, enters: 3 });
  // A caller with no land to test - the Host, somebody else's family - reads as off the land the whole way.
  assert.deepEqual(landRuns([{ x: 0, y: 0 }, { x: 3, y: 0 }], null, 3), { leaves: 0, enters: 3 });
  assert.deepEqual(landRuns([{ x: 0, y: 0 }], inside, 3), { leaves: 0, enters: 3 });
});

test('the schedule rides on the server\'s own progress, so a tick early, a tick twice and the arrival all land right', () => {
  // `ProjectionMotion.drawnMiles` is the clock everything is a function of; this is that clock driving the schedule over a
  // real run of ticks, sampled every frame. Ticks arrive on time, early, twice over, and the journey ends.
  const road = { from: 'home-1', to: 'gonzales', points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }], distance: 7 };
  const at = progress => progress === null
    ? { id: 'w', location: { x: 3, y: 4, siteId: 'gonzales' }, travel: null }
    : { id: 'w', location: { x: Math.min(progress, 3), y: Math.max(0, progress - 3), siteId: null }, travel: { ...road, progress, step: 1 } };
  const snap = (tick, progress, revision = tick) => ({ sessionId: 's', revision, tickMs: TICK_MS, world: { tick, minute: tick * 20, status: 'running', entities: [at(progress)], others: [] } });
  const motion = new ProjectionMotion();
  const { milesASecond, gait } = view(1, CLOSE);
  const arrivals = [[0, 1, 0], [TICK_MS, 2, 1], [16000, 3, 2], [16500, 3, 2, 'again'], [30000, 5, 3], [39500, 6.5, 4], [49000, null, 5]];
  let frames = 0, drawnAtEnd = null, sawBlind = false, worst = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const [time, progress, tick, again] = arrivals[i];
    motion.accept(snap(tick + 1, progress, again ? 99 : tick + 1), time);
    const entity = at(progress);
    for (let now = time; now < (arrivals[i + 1]?.[0] ?? time + 20000); now += 16, frames++) {
      const journey = motion.journey(entity);
      if (!journey) continue;
      const sight = travelSight({ distance: journey.distance, miles: motion.drawnMiles(entity, now), milesASecond, gait });
      assert.ok(sight.miles <= journey.distance + 1e-9, `drawn past the end of the road at ${now} ms`);
      if (sight.alpha === 0) sawBlind = true;
      if (sight.alpha > 0) worst = Math.max(worst, sight.rate * milesASecond);
      if (progress === null) drawnAtEnd = sight;
    }
  }
  assert.ok(frames > 3000);
  assert.equal(sawBlind, true, 'the middle of a seven-mile journey was never crossed out of sight');
  assert.ok(worst <= gait + 1e-12, `drawn at ${worst} miles a second in view, past the gait's ${gait}`);
  assert.equal(drawnAtEnd.miles, road.distance, 'the tick they arrived, the figure was not drawn arriving');
  assert.equal(drawnAtEnd.alpha, 1, 'the tick they arrived, the figure was not back in view');
  // The road ahead of them starts at the first point past where they are drawn.
  assert.equal(routeIndexAfter(road.points, 0), 1);
  assert.equal(routeIndexAfter(road.points, 3.5), 2);
  assert.equal(routeIndexAfter(road.points, 7), 3);
});

// Owner, 2026-09-27, by multiple choice: on the family's own land a person on a horse or driving a wagon travels at "the horse
// or wagon's own speed", never sped up beyond it, and a walker at normal walking speed. Read through the module object, so a
// page without the rule fails these tests and not the whole file.
test('on the family\'s own land a rider goes at the horse\'s own pace, a wagon at the team\'s, and a walker at a walk', () => {
  const { paceMilesASecond, WALK_MILES_A_TICK } = motion;
  assert.equal(typeof paceMilesASecond, 'function', 'there is no pace a figure is drawn at');
  assert.equal(WALK_MILES_A_TICK, WALK_SPEED, 'the page\'s walk is not the server\'s');
  const walker = gaitMilesASecond(CLOSE);
  const at = (speed, heightPx = CLOSE.heightPx) => paceMilesASecond({ ...CLOSE, heightPx, personPx: CLOSE.heightPx, speed });
  assert.ok(Math.abs(at(WALK_SPEED) - walker) < 1e-12, 'a walker is not drawn at a walk');
  // On the horse: the horse's own pace against a walk, five thirds - and not the mounted figure's 1.8.
  assert.ok(Math.abs(at(HORSE_SPEED, CLOSE.heightPx * MOUNTED_HEIGHT) / walker - HORSE_SPEED / WALK_SPEED) < 1e-9, `a rider is drawn at ${(at(HORSE_SPEED, CLOSE.heightPx * MOUNTED_HEIGHT) / walker).toFixed(3)} of a walk, not the horse's ${(HORSE_SPEED / WALK_SPEED).toFixed(3)}`);
  // With the wagon, cart or carreta: the ox's pace, slower than a walk - and not a tall wagon's own 1.55 of a person.
  assert.ok(Math.abs(at(WAGON_SPEED, CLOSE.heightPx * 1.55) / walker - WAGON_SPEED / WALK_SPEED) < 1e-9, `a wagon is drawn at ${(at(WAGON_SPEED, CLOSE.heightPx * 1.55) / walker).toFixed(3)} of a walk, not the team's ${WAGON_SPEED}`);
  // A small child's shorter step, and never faster than the figure's own cycle can cover: a courier's hard trot is still a walk
  // of the horse on the screen.
  assert.ok(Math.abs(at(SMALL_WALK_SPEED) / walker - SMALL_WALK_SPEED) < 1e-9);
  assert.ok(Math.abs(at(RIDER_SPEED, CLOSE.heightPx * MOUNTED_HEIGHT) - gaitMilesASecond({ ...CLOSE, heightPx: CLOSE.heightPx * MOUNTED_HEIGHT })) < 1e-12, 'a pace was drawn faster than the figure\'s own cycle');
  // Nothing from the server (the Host, somebody else's family): the figure's own gait, as before.
  assert.equal(paceMilesASecond({ ...CLOSE }), walker);
  // And the page draws everybody at it.
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /const gait = paceMilesASecond\(\{ scale: marks\.scale, heightPx: height, personPx: marks\.figure, speed: journey\.speed \}\)/, 'the page does not draw a traveller at their own pace');
});

test('on the family\'s own land nobody is drawn faster than their own pace, in any frame, however hurried the class; a journey that cannot walk it in time is drawn arriving late, never early', () => {
  const walker = gaitMilesASecond(CLOSE);
  const hurried = drawnMilesASecond({ milesATick: 1, tickMs: 1000 }), farming = drawnMilesASecond({ milesATick: 1, tickMs: 9500 });
  let paced = 0, late = 0;
  for (const speed of [WALK_SPEED, HORSE_SPEED, WAGON_SPEED]) {
    const gait = walker * speed;
    for (const perTick of [hurried, farming]) {
      const milesASecond = perTick * speed;
      const rate = gait / milesASecond;
      for (const distance of [0.4, 1, 3, 5, 40]) {
        for (const [leaves, enters] of [[0.5, distance], [0, distance - 0.5], [0.25, distance - 0.25], [distance, 0]]) {
          const where = `speed ${speed}, ${perTick.toFixed(3)} mi/s a walk, ${distance} miles, land ${leaves}..${enters}`;
          const end = travelSight({ distance, miles: 0, milesASecond, gait, leaves, enters }).end ?? distance;
          if (end > distance + 1e-9) late++;
          let was = null;
          const steps = 1600;
          for (let i = 0; i <= steps; i++) {
            const v = end * 1.02 * i / steps;
            const sight = travelSight({ distance, miles: v, milesASecond, gait, leaves, enters });
            if (sight.paced) paced++;
            const onLand = sight.miles <= Math.min(leaves, distance) + 1e-12 || sight.miles >= Math.max(0, enters) - 1e-12;
            if (onLand) assert.equal(sight.alpha, 1, `at ${sight.miles.toFixed(4)} miles the figure was faded on its own land (${where})`);
            if (v < distance - 1e-9) assert.ok(sight.miles < distance, `drawn home at ${v.toFixed(4)}, before the server put them there (${where})`);
            if (was && onLand && was.onLand && sight.alpha === 1 && was.alpha === 1) {
              assert.ok(Math.abs(sight.miles - was.miles) <= rate * (v - was.v) * (1 + 1e-9) + 1e-12, `on its own land the figure was drawn at ${((sight.miles - was.miles) / (v - was.v) / rate).toFixed(2)} times its pace (${where})`);
            }
            was = { v, miles: sight.miles, alpha: sight.alpha, onLand };
          }
          assert.equal(was.miles, distance, `the figure never arrived (${where})`);
        }
      }
    }
  }
  assert.ok(paced && late, 'the sweep never reached a journey that had to be paced and drawn late, so it is not measuring the rule');
});

test('the marker is gone: no disc, no pin, no portrait on a road, and nothing left of it in the page', () => {
  // Owner, 2026-09-22: "i don't want to see icons." The stand-in and its row in docs/ART_REQUESTS.md went with it.
  for (const file of ['../public/motion.js', '../public/app.js']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const word of ['MARKER_ABOVE', 'MARKER_BELOW', 'MarkerFade', 'wantsMarker', 'drawTravelMarkers', '__travelMarkers']) {
      assert.ok(!text.includes(word), `${file} still holds ${word}`);
    }
  }
  const requests = readFileSync(new URL('../docs/ART_REQUESTS.md', import.meta.url), 'utf8');
  assert.match(requests, /the traveller's marker . WITHDRAWN 2026-09-22/, 'the marker is still an open request in docs/ART_REQUESTS.md');
  assert.ok(!/marker-pin|marker-dot|marker-end/.test(requests), 'the marker\'s stand-in row is still listed in docs/ART_REQUESTS.md');
  assert.ok(!/^\| A traveller faster than a walk/m.test(requests), 'the marker\'s row is still in the stand-ins table');
});

test('somebody still drawn walking in off their road is let go of it the moment the server moves them about the home, and walked to where it has them at their own pace - a child at play is drawn at the play', () => {
  // Found 2026-09-28 by scripts/children-browser-proof.mjs: a family came home by wagon faster than its land could be walked, so
  // it was drawn arriving late (`trailOf`) - and went on being drawn walking in down the road while the server had the child
  // running at tag in the yard, every frame in one place a fixed step from the parent walking in beside them.
  const { trailHolds, walkToward, figureScale } = motion;
  assert.equal(typeof trailHolds, 'function', 'there is no asking whether a trail still holds');
  assert.equal(typeof walkToward, 'function', 'there is no walk from where a figure is drawn to where the server has it');
  // The places are the proof's: where the wagon put the child, the first spot of tag, and where the child was drawn on the road.
  const arrived = { x: 5.7848, y: -20.6308 }, tag = { x: 5.757, y: -20.6234, siteId: 'home-1' }, road = { x: 5.7199, y: -20.4032 };
  assert.equal(trailHolds(arrived, { ...arrived, siteId: 'home-1' }), true, 'somebody the server left where the road put them was not drawn walking in');
  assert.equal(trailHolds(arrived, tag), false, 'a child the server sent to play in the yard is still drawn walking in down the road');
  assert.equal(trailHolds(arrived, { x: arrived.x + 0.0001, y: arrived.y }), false, 'a step across the yard was taken for standing still');
  assert.equal(trailHolds(null, arrived), false, 'a trail with nowhere it began holds anyway');
  // From the road to the play at a child's pace, a frame at a time: never a step longer than the pace, never past the place,
  // and there in the end, facing the way they walked.
  const child = gaitMilesASecond({ ...CLOSE, heightPx: CLOSE.heightPx * figureScale({ band: 'small' }) });
  assert.ok(child < gaitMilesASecond(CLOSE), 'a small child is not walked at a child\'s pace');
  const frame = child / 60;
  let at = road, frames = 0, arrivedAt = null;
  const faced = new Set();
  for (; frames < 100000 && !arrivedAt; frames++) {
    const step = walkToward(at, tag, frame);
    assert.ok(Math.hypot(step.at.x - at.x, step.at.y - at.y) <= frame * (1 + 1e-9), 'a step was longer than a child\'s pace allows');
    if (step.arrived) arrivedAt = step.at; else { faced.add(step.dir); at = step.at; }
  }
  assert.deepEqual(arrivedAt, { x: tag.x, y: tag.y }, 'the child never reached the play');
  const seconds = frames / 60, far = Math.hypot(tag.x - road.x, tag.y - road.y);
  assert.ok(Math.abs(seconds - far / child) < 0.05, `the walk took ${seconds.toFixed(2)} s, not a child's ${(far / child).toFixed(2)}`);
  assert.deepEqual([...faced], ['n'], 'the child did not face the way they walked');
  // And the page does it: the trail is given up on the server's word, and the walk is at the figure's own height's pace.
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /if \(!trailHolds\(trail\.stood, entity\.location\)\)/, 'the page keeps a trail whatever the server does');
  assert.match(app, /stood: entity\.location \? \{ x: entity\.location\.x, y: entity\.location\.y \} : null/, 'the page does not remember where the road put them');
  assert.match(app, /gaitMilesASecond\(\{ scale: marks\.scale, heightPx: height \* figureScale\(entity\) \}\)/, 'the walk is not at the figure\'s own pace');
  assert.match(app, /walkToward\(seen\.walk\.at, to, pace \* since \/ 1000\)/, 'the page does not walk them to where the server has them');
});
