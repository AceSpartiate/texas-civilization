// People at work are drawn at the work (owner, 2026-09-28: "When someone is working, I should see them actually working, not
// just standing near their task"). public/work-art.js holds the one table; this reads what the server can report out of sim/
// itself - every chore any module registers, every task any module sets - so a new task cannot silently fall back to somebody
// standing beside it, and every pose the table names is one the shipped library actually holds.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STROKES, WORK, WORK_REQUEST, activityOf, drawWorkLayer, strokeClock, strokeOf, workClip, workSlot, onWorkBeat, workBeat } from '../public/work-art.js';
import { entityClip, visualVariant, RIDING_FIGURES } from '../public/motion.js';

const simDir = fileURLToPath(new URL('../sim/', import.meta.url));
const clips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/animation.json', import.meta.url)), 'utf8')).clips;
const requests = readFileSync(fileURLToPath(new URL('../docs/ART_REQUESTS.md', import.meta.url)), 'utf8');
// Every grown cast figure a family's person can be drawn as (children without a pose take a grown figure, drawn smaller).
const CAST = RIDING_FIGURES;

/** Every chore the server can put somebody on: the table in sim/chores.mjs and every module that registers into it. */
async function everyChore() {
  await import('../sim/world.mjs');
  for (const file of readdirSync(simDir).filter(name => name.endsWith('.mjs'))) {
    if (/registerChores\(/.test(readFileSync(join(simDir, file), 'utf8'))) await import(pathToFileURL(join(simDir, file)).href);
  }
  const { CHORES } = await import('../sim/chores.mjs');
  return CHORES;
}
/** Every standing task any module sets or reads (`entity.task`). */
function everyTask() {
  const found = new Set();
  for (const file of readdirSync(simDir).filter(name => name.endsWith('.mjs'))) {
    const source = readFileSync(join(simDir, file), 'utf8');
    for (const [, value] of source.matchAll(/\btask\s*(?:=|:|===)\s*'([a-z-]+)'/g)) found.add(value);
  }
  return found;
}
// The two standing tasks that are not work, and where they are drawn instead.
const NOT_WORK = { rest: 'resting: the rest pose (public/motion.js `grownClip`)', travel: 'on the road: the walk cycle' };

test('every activity the server can report is in the one table', async () => {
  const chores = await everyChore();
  const missing = Object.keys(chores).filter(id => !WORK[id]);
  assert.deepEqual(missing, [], `chores the work table does not draw (add them to WORK in public/work-art.js): ${missing.join(', ')}`);
  assert.ok(Object.keys(chores).length > 60, 'the chore table was not read whole');
  for (const task of everyTask()) {
    assert.ok(WORK[`task:${task}`] || NOT_WORK[task], `the task '${task}' is neither drawn at work nor said to be something else`);
  }
});

test('every stroke is a pose the library holds, moving, and every stand-in names its request and shows the work', () => {
  const used = new Set();
  for (const [activity, entry] of Object.entries(WORK)) {
    assert.ok(STROKES[entry.stroke], `${activity}: no stroke '${entry.stroke}'`);
    used.add(entry.stroke);
    for (const [pattern, stroke] of entry.by || []) {
      assert.ok(pattern instanceof RegExp && STROKES[stroke], `${activity}: its part ${pattern} names no stroke '${stroke}'`);
      used.add(stroke);
    }
  }
  for (const key of used) {
    const stroke = STROKES[key];
    assert.ok(['delivered', 'stand-in', 'journey', 'play', 'still'].includes(stroke.art), `${key}: what art is '${stroke.art}'?`);
    if (stroke.art === 'play') { assert.match(stroke.request || '', /children at play/, 'play is drawn by littleClip, under its own request'); continue; }
    for (const figure of CAST) assert.ok(clips[`${figure}-${stroke.pose}`], `${key}: ${figure}-${stroke.pose} is not in the library`);
    const frames = clips[`${CAST[0]}-${stroke.pose}`].frames.length;
    if (stroke.art === 'still') { assert.ok(stroke.why, `${key} is held still with no reason given`); continue; }
    if (stroke.art === 'delivered') assert.ok(frames > 1, `${key}: a delivered cycle of one frame does not move`);
    if (stroke.art === 'stand-in') {
      // Visibly working: a tool, a motion or an effect drawn with the pose, or a pose that is itself a moving cycle.
      assert.ok(stroke.tool || stroke.motion || stroke.effect || frames > 1, `${key}: a stand-in that neither moves nor shows the work`);
      assert.ok(stroke.request, `${key}: a stand-in names no request`);
      const heading = stroke.request.split(', item')[0];
      assert.ok(requests.includes(`## ${heading}`), `${key}: docs/ART_REQUESTS.md has no "${heading}"`);
      const number = stroke.request.match(/item (\d+)/)?.[1];
      if (heading === WORK_REQUEST) {
        const section = requests.slice(requests.indexOf(`## ${WORK_REQUEST}`)).split('\n## ')[0];
        assert.match(section, new RegExp(`^${number}\\. \\*\\*`, 'm'), `${key}: ${WORK_REQUEST} has no item ${number}`);
      }
    }
  }
});

test('somebody at each piece of work is drawn at it, not standing beside it', async () => {
  const chores = await everyChore();
  for (const id of Object.keys(chores)) {
    const key = strokeOf(id, '');
    const stroke = STROKES[key];
    if (stroke.art === 'play') continue;
    const entity = { id: 'hh-1-ann', kind: 'person', health: { condition: 'well' }, task: 'work', chore: { id, doing: '' } };
    const clip = entityClip(entity);
    const variant = visualVariant(entity.id);
    assert.equal(clip.id, `${variant}-${stroke.pose}`, `${id} is drawn as ${clip.id}`);
    assert.equal(clip.work, stroke, `${id}: the binding does not carry its stroke`);
    if (stroke.art !== 'still') assert.ok(!/-idle-s$/.test(clip.id), `${id} is drawn standing about`);
  }
  // Working about the place, at home only: a grown person hoes; a child is never set to it; away from home it is not drawn.
  const about = { id: 'hh-1-ann', kind: 'person', band: 'adult', health: { condition: 'well' }, task: 'work', atHome: true };
  assert.equal(entityClip(about).id, `${visualVariant(about.id)}-work`);
  assert.equal(entityClip({ ...about, band: 'child', sex: 'male' }).id, 'boy-idle-s', 'a child is not set to work about the place');
  assert.equal(entityClip({ ...about, atHome: false }).id, `${visualVariant(about.id)}-idle-s`);
  assert.equal(activityOf({ ...about, task: 'help', atHome: false }), 'task:help');
});

test('the part of the work is told by its own words, and going to it or carrying from it is walking', () => {
  assert.equal(strokeOf('clear-plot', 'felling timber on the clearing'), 'chop');
  assert.equal(strokeOf('clear-plot', 'grubbing out brush'), 'grub');
  assert.equal(strokeOf('clear-plot', 'breaking prairie sod'), 'hoe');
  assert.equal(strokeOf('fence-plot', 'cutting mesquite posts and brush'), 'chop');
  assert.equal(strokeOf('plant-field', 'putting in seed'), 'sow');
  assert.equal(strokeOf('hunt-land', 'waiting downwind, and still'), 'hold');
  assert.equal(strokeOf('hunt-land', 'the shot'), 'shot');
  // A change in the words leaves the base stroke: never standing.
  assert.equal(strokeOf('fell-trees', 'something new the server says'), 'chop');
  const felling = { id: 'hh-1-ann', kind: 'person', health: { condition: 'well' }, task: 'work', chore: { id: 'fell-trees', doing: 'felling a post oak' } };
  const variant = visualVariant(felling.id);
  assert.equal(workClip(felling, variant).stroke, 'chop');
  assert.equal(workClip({ ...felling, strolling: 'w' }, variant).id, `${variant}-walk`, 'stepped over the land to the next tree: walking');
  assert.equal(workClip({ ...felling, strolling: 's' }, variant).id, `${variant}-walk-s`);
  assert.equal(workClip({ ...felling, strolling: 's' }, variant).upright, true);
  assert.equal(workClip({ ...felling, chore: { id: 'harvest-field', doing: 'carrying the crop in' }, strolling: 'e' }, variant).id, `${variant}-carry`);
  assert.equal(workClip({ ...felling, chore: { id: 'plant-field', doing: 'walking out to the fields' } }, variant).id, `${variant}-walk`);
  assert.equal(workClip({ ...felling, travel: { points: [] } }, variant), null, 'on the road, the journey draws them');
  // The shared bindings are made once.
  assert.equal(workClip(felling, variant), workClip(felling, variant));
});

test('several people at one piece of work stand round it and face it; one alone stands at it', () => {
  const at = { x: 1, y: 1, siteId: 'home-1' };
  const builder = id => ({ id, kind: 'person', task: 'work', location: at, chore: { id: 'build-house', doing: 'raising the walls' } });
  const crew = [builder('hh-1-a'), builder('hh-1-b'), builder('hh-1-c')];
  const out = { x: 0, y: 0, face: null };
  const places = crew.map(person => { workSlot(person, crew, out); return { ...out }; });
  assert.equal(new Set(places.map(place => `${place.x.toFixed(2)},${place.y.toFixed(2)}`)).size, 3, `three builders stand in one spot: ${JSON.stringify(places)}`);
  for (const place of places) {
    assert.ok(Math.hypot(place.x, place.y / 0.45) > 1, 'a builder is not round the house');
    assert.equal(place.face, place.x > 0.01 ? 'w' : 'e', 'a builder does not face the house');
  }
  workSlot(crew[0], [crew[0]], out);
  assert.ok(out.x < 0 && out.face === 'e', 'one builder alone stands to the west of it facing it');
  // Somebody at other work, or at the same work somewhere else, is not in the ring.
  const felling = { ...builder('hh-1-d'), chore: { id: 'fell-trees', doing: 'felling' } }, far = { ...builder('hh-1-e'), location: { x: 1.2, y: 1, siteId: 'home-1' } };
  workSlot(crew[0], [crew[0], felling, far], out);
  assert.ok(out.x < 0 && out.face === 'e');
});

test('the tool and its effect land on the pose’s own strike, and change from frame to frame', () => {
  const work = clips['rust-work'].frames.map(frame => frame.duration);
  const clock = { period: 0, since: 0, count: 0, frame: 0 };
  const strike = work[0] + work[1];
  strokeClock(STROKES.chop, work, strike, clock);
  assert.equal(clock.frame, 2, 'the chips fly from the frame the blade is down');
  assert.equal(clock.since, 0);
  strokeClock(STROKES.chop, work, strike + 100, clock);
  assert.equal(clock.since, 100);
  // A counting canvas: how many marks each call makes, and where.
  const calls = [];
  const ctx = new Proxy({}, { get: (target, name) => name in target ? target[name] : (...args) => { calls.push([name, ...args.map(Math.round)].join(' ')); }, set: (target, name, value) => { target[name] = value; return true; } });
  const at = since => { calls.length = 0; clock.since = since; clock.period = 800; clock.count = 3; return { marks: drawWorkLayer(ctx, STROKES.chop, 100, 200, 40, 1, clock), calls: calls.join('|') }; };
  const early = at(60), later = at(260), gone = at(700);
  assert.ok(early.marks >= 4, `the chips were not drawn: ${early.marks}`);
  assert.notEqual(early.calls, later.calls, 'the chips did not move between two frames');
  assert.equal(gone.marks, 0, 'the chips are still in the air after they have landed');
  // The rifle is drawn whether or not the smoke is; the rod's float bobs.
  clock.period = STROKES.shoot.cycleMs;
  clock.since = 100; assert.ok(drawWorkLayer(ctx, STROKES.shoot, 0, 0, 40, 1, clock) > 1);
  clock.since = 2000; assert.equal(drawWorkLayer(ctx, STROKES.shoot, 0, 0, 40, 1, clock), 1);
  clock.period = STROKES.fish.cycleMs;
  calls.length = 0; clock.since = 100; drawWorkLayer(ctx, STROKES.fish, 0, 0, 40, 1, clock); const one = calls.join('|');
  calls.length = 0; clock.since = 900; drawWorkLayer(ctx, STROKES.fish, 0, 0, 40, 1, clock);
  assert.notEqual(one, calls.join('|'), 'the float does not bob');
  // Under reduced motion nothing flies.
  clock.since = 60; clock.period = 800;
  assert.equal(drawWorkLayer(ctx, STROKES.chop, 0, 0, 40, 1, clock, true), 0);
});

test('each strike is told once to whoever listens (the work sounds)', () => {
  const heard = [];
  const stop = onWorkBeat(beat => heard.push(beat));
  const clock = { count: 7 };
  workBeat('hh-1-a', 'fell-trees', 'chop', clock, 0, 0);
  workBeat('hh-1-a', 'fell-trees', 'chop', clock, 0, 0);
  clock.count = 8;
  workBeat('hh-1-a', 'fell-trees', 'chop', clock, 0, 0);
  stop();
  workBeat('hh-1-a', 'fell-trees', 'chop', { count: 9 }, 0, 0);
  assert.equal(heard.length, 2);
  assert.deepEqual(Object.keys(heard[0]).sort(), ['activity', 'id', 'stroke', 'x', 'y']);
});
