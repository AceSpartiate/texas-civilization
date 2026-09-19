// A traveller drawn as a marker on the road once they would cross the screen faster than a walk can be drawn.
//
// Owner, 2026-09-18, playtesting Solo: "when i sent my main character to gonzales on foot he ran inhumanly fast". The pace
// and the clock are right and stay; with the portrait pressed a walker covered 4.3 of their own heights a real second
// (docs/evidence/travel-speed-screen.json). The owner chose, by multiple choice, "Marker when fast". The drawing is in
// public/app.js (`travelMarker`, `drawTravelMarkers`); what decides it is here, in public/motion.js, and the browser proof
// is scripts/travel-marker-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ProjectionMotion, MarkerFade, MARKER_ABOVE, MARKER_BELOW, MARKER_FADE_MS, MARKER_STALE_MS, STRIDE, entityClip, travellerSpeed,
  drawnHeightsPerSecond, fadeToward, routeIndexAfter, travelMilesATick, wantsMarker,
} from '../public/motion.js';

test('a walker watched close up in the farming day is drawn as a marker, and in the family view stays a figure', () => {
  // The numbers measured on screen (docs/evidence/travel-speed-screen.json): a mile a twenty-minute tick at the Study pace.
  const portrait = drawnHeightsPerSecond({ milesATick: 1, tickMs: 9500, scale: 2605.3, heightPx: 49.5 });
  const follow = drawnHeightsPerSecond({ milesATick: 1, tickMs: 9500, scale: 8.4, heightPx: 7 });
  assert.ok(Math.abs(portrait - 5.54) < 0.01, `pressed close in a walker is drawn at ${portrait} heights a second`);
  assert.ok(Math.abs(follow - 0.126) < 0.001, `in the family's own view at ${follow}`);
  assert.equal(wantsMarker(portrait), true, 'close in, a marker');
  assert.equal(wantsMarker(follow), false, 'in the family view, the figure');
  // The horse: five miles an hour is 1.67 miles a tick, and a rider and horse stand 1.8 of a person.
  const rider = drawnHeightsPerSecond({ milesATick: 5 / 3, tickMs: 9500, scale: 2605.3, heightPx: 49.5 * 1.8 });
  assert.ok(Math.abs(rider - 5.13) < 0.01 && wantsMarker(rider), `a rider close in at ${rider}`);
  // A long tick's share of a day on the road (sim/travel.mjs `roadTicks`) in the family view: past a walk.
  assert.equal(wantsMarker(drawnHeightsPerSecond({ milesATick: 10.5, tickMs: 9500, scale: 8.4, heightPx: 7 })), true);
  // Nothing to draw nothing from.
  for (const bad of [{ milesATick: 0 }, { tickMs: 0 }, { scale: NaN }, { heightPx: 0 }]) {
    assert.equal(drawnHeightsPerSecond({ milesATick: 1, tickMs: 9500, scale: 100, heightPx: 20, ...bad }), 0);
  }
});

test('a marker comes past MARKER_ABOVE and goes only below MARKER_BELOW, so the zoom wheel never makes it flicker', () => {
  assert.ok(MARKER_BELOW < MARKER_ABOVE);
  const between = (MARKER_ABOVE + MARKER_BELOW) / 2;
  assert.equal(wantsMarker(MARKER_ABOVE + 0.01, false), true, 'past the threshold a figure becomes a marker');
  assert.equal(wantsMarker(MARKER_ABOVE, false), false, 'at it, still a figure');
  assert.equal(wantsMarker(between, false), false, 'between the two a figure stays a figure');
  assert.equal(wantsMarker(between, true), true, 'and a marker stays a marker');
  assert.equal(wantsMarker(MARKER_BELOW - 0.01, true), false, 'below MARKER_BELOW a marker is a figure again');
});

test('the threshold is the ground the library\'s walking cycles cover at the rate they were drawn', () => {
  // Above it `gaitStep` cannot play a cycle fast enough for its feet to keep up with the ground: the figure skates.
  const clips = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json', import.meta.url), 'utf8'));
  const all = clips.clips || clips;
  const loop = id => all[id].frames.reduce((total, frame) => total + frame.duration, 0) / 1000;
  const rates = {
    walk: STRIDE.foot / loop('rust-walk'), childWalk: STRIDE.foot / loop('girl-walk'),
    horse: STRIDE.hoof / loop('horse-walk'), ox: STRIDE.hoof / loop('ox-walk'),
  };
  for (const [cycle, rate] of Object.entries(rates)) {
    assert.ok(Math.abs(rate - MARKER_ABOVE) <= 0.1, `${cycle} covers ${rate.toFixed(2)} heights a second at its own rate, not about ${MARKER_ABOVE}`);
  }
  assert.ok(MARKER_ABOVE >= 1 && MARKER_ABOVE <= 1.5, 'and inside the 1 to 1.5 a second a walk looks natural at');
});

test('the miles a tick carries a journey are the server\'s step, and a speed only where no step was sent', () => {
  assert.equal(travelMilesATick({ step: 0.875, speed: 1 }, 720), 0.875);
  assert.equal(travelMilesATick({ speed: 1 }, 60), 3, 'a class saved before step: a farming tick\'s speed three times over');
  assert.equal(travelMilesATick({ speed: 1 }), 1);
  assert.equal(travelMilesATick(null), 0);
});

test('between the figure and the marker the traveller fades, and never pops', () => {
  const fade = new MarkerFade();
  // First seen already fast on a page that has just opened (the page asks for `instant`): a marker at once.
  assert.equal(fade.weight('a', { heightsPerSecond: 5, now: 0, instant: true }), 1);
  // Slowing (they arrive), frame by frame at twelve a second: never more than a frame's share of the fade at a time.
  let weight = 1, frames = 0, now = 0;
  while (weight > 0) {
    now += 83; frames++;
    const next = fade.weight('a', { heightsPerSecond: 0, now });
    assert.ok(weight - next <= 83 / MARKER_FADE_MS + 1e-9, `the marker went from ${weight} to ${next} in one frame`);
    weight = next;
  }
  assert.equal(frames, Math.ceil(MARKER_FADE_MS / 83), `the fade took ${frames} frames`);
  assert.equal(fade.fading('a'), false, 'and once a figure it is done');
  // And back: a zoom in on somebody walking.
  const back = [1, 2, 3].map(step => fade.weight('a', { heightsPerSecond: 5, now: now + step * 100 }));
  assert.ok(back.every((w, i) => w > 0 && w < 1 && (i === 0 || w > back[i - 1])), `coming back in, ${back}`);
  // Reduced motion: no animation, so the change is made at once.
  assert.equal(fade.weight('a', { heightsPerSecond: 0, now: now + 400, instant: true }), 0);
  assert.equal(fadeToward(0.5, 1, 100, 400), 0.75);
  assert.equal(fadeToward(0.5, 0, 1000, 400), 0);
});

test('somebody who has arrived is drawn at what they went to do, not as a marker walking in', () => {
  // Found 2026-09-19 by `npm run test:hunt`: a hunter's first stage in the timber, reading the ground, lasts one tick - the
  // tick he arrives, while he is still drawn walking the last of the road in. Measured along that journey he stayed a marker
  // for the whole of it and was never drawn reading the ground.
  const road = { from: 'home-1', to: 'hunt-hh-1', points: [{ x: 0, y: 0 }, { x: 3, y: 0 }], distance: 3 };
  const onRoad = progress => ({ id: 'hunter', kind: 'person', location: { x: progress, y: 0, siteId: null }, travel: { ...road, progress, step: 1 }, chore: { doing: 'on the road to the timber' } });
  const there = { id: 'hunter', kind: 'person', location: { x: 3, y: 0, siteId: 'hunt-hh-1' }, travel: null, chore: { doing: 'reading the ground at the edge of the timber' } };
  const snap = (tick, entity) => ({ sessionId: 's', revision: tick, tickMs: 4000, world: { tick, minute: tick * 20, status: 'running', entities: [entity], others: [] } });
  const motion = new ProjectionMotion(), fade = new MarkerFade();
  const view = { tickMs: 4000, scale: 288, heightPx: 7 };
  motion.accept(snap(1, onRoad(1.5)), 0);
  motion.accept(snap(2, onRoad(2.5)), 4000);
  const speed = travellerSpeed(onRoad(2.5), motion, view);
  assert.ok(wantsMarker(speed), `on the road at ${speed} heights a second he is a marker`);
  for (let now = 4000; now < 8000; now += 83) fade.weight('hunter', { heightsPerSecond: travellerSpeed(onRoad(2.5), motion, view), now });
  assert.equal(fade.weight('hunter', { heightsPerSecond: speed, now: 8000 }), 1);
  // The tick he arrives: still drawn walking the last half mile in, and the server has him at the timber, reading.
  motion.accept(snap(3, there), 8000);
  assert.ok(motion.journey(there), 'he is still drawn along the road he came by');
  assert.equal(travellerSpeed(there, motion, view), 0, 'but he is not on the road, so he is not measured as going anywhere');
  let weight = 1, now = 8000;
  while (now < 8000 + MARKER_FADE_MS + 200) { now += 83; weight = fade.weight('hunter', { heightsPerSecond: travellerSpeed(there, motion, view), now }); }
  assert.equal(weight, 0, `a fade's length into the tick he arrived he is the figure again (weight ${weight}), not a marker until the next tick`);
  assert.equal(entityClip(there).id.endsWith('-search'), true, 'and the figure is reading the ground');
  // Nor is anybody paused, or reined in to talk.
  assert.equal(travellerSpeed(onRoad(2.5), motion, { ...view, running: false }), 0);
  assert.equal(travellerSpeed({ ...onRoad(2.5), facing: 'e' }, motion, view), 0);
});

test('a traveller setting out again fades into the marker, and only a page just opened puts it there at once', () => {
  // Nobody standing is weighed, so a person's entry is left as their last journey left it. Counting all that time into the
  // fade made every departure after a person's first jump from figure to marker in one frame.
  const fade = new MarkerFade();
  fade.weight('p', { heightsPerSecond: 5, now: 0, instant: true });
  let now = 0;
  while (fade.fading('p')) { now += 83; fade.weight('p', { heightsPerSecond: 0, now }); }
  // A minute at home, and off again.
  now += 60000;
  const first = fade.weight('p', { heightsPerSecond: 5, now });
  const second = fade.weight('p', { heightsPerSecond: 5, now: now + 83 });
  assert.ok(first < 0.2 && second > first && second < 1, `setting out the marker came in at ${first}, then ${second}`);
  assert.ok(MARKER_STALE_MS < MARKER_FADE_MS);
});

test('the marker is never drawn further along the road than the server has them, arriving included', () => {
  // The marker stands where the figure would (`drawnMiles` is `position`'s own distance), and the road still ahead is drawn
  // from there. Ticks arrive on time, early, twice, and the journey ends; every frame between is sampled.
  const road = { from: 'home-1', to: 'gonzales', points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }], distance: 7 };
  const at = progress => progress === null
    ? { id: 'w', location: { x: 3, y: 4, siteId: 'gonzales' }, travel: null }
    : { id: 'w', location: { x: Math.min(progress, 3), y: Math.max(0, progress - 3), siteId: null }, travel: { ...road, progress, step: 1 } };
  const snap = (tick, progress, revision = tick) => ({ sessionId: 's', revision, tickMs: 9500, world: { tick, minute: tick * 20, status: 'running', entities: [at(progress)], others: [] } });
  const motion = new ProjectionMotion();
  const arrivals = [[0, 1, 0], [9500, 2, 1], [16000, 3, 2], [16500, 3, 2, 'again'], [30000, 5, 3], [39500, 6.5, 4], [49000, null, 5]];
  let frames = 0;
  for (let i = 0; i < arrivals.length; i++) {
    const [time, progress, tick, again] = arrivals[i];
    motion.accept(snap(tick + 1, progress, again ? 99 : tick + 1), time);
    const server = progress ?? road.distance, entity = at(progress);
    for (let now = time; now < (arrivals[i + 1]?.[0] ?? time + 20000); now += 16, frames++) {
      const miles = motion.drawnMiles(entity, now);
      assert.ok(miles <= server + 1e-9, `at ${now} ms the marker was drawn at ${miles.toFixed(3)} miles, ahead of the server's ${server}`);
      const journey = motion.journey(entity);
      if (!journey) continue;
      // The figure and the marker are one place.
      const drawn = motion.position(entity, now), index = routeIndexAfter(journey.points, miles);
      const along = index >= journey.points.length ? journey.points.at(-1) : null;
      if (along) assert.deepEqual(drawn, along);
      else {
        const a = journey.points[index - 1], b = journey.points[index];
        const cross = (b.x - a.x) * (drawn.y - a.y) - (b.y - a.y) * (drawn.x - a.x);
        assert.ok(Math.abs(cross) < 1e-9, `at ${now} ms the marker's road began on a leg the figure is not on`);
      }
    }
  }
  assert.ok(frames > 3000);
  // The route ahead starts at the first point past them.
  assert.equal(routeIndexAfter(road.points, 0), 1);
  assert.equal(routeIndexAfter(road.points, 3.5), 2);
  assert.equal(routeIndexAfter(road.points, 7), 3);
});
