// The one battle renderer (public/battle-view.js) and the fight's card (public/military-attention.js), on a canvas that
// records what is drawn. The browser proof (scripts/battle-gonzales-browser-proof.mjs) holds the same things on a real
// page; these hold the rules underneath, frame by frame, where a frame can be asked about exactly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity } from '../public/battle-view.js';
import { militaryNotices } from '../public/military-attention.js';

/** A 2D context that draws nothing and remembers what was asked of it. */
function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  const ctx = new Proxy({ calls, globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
  return ctx;
}
/** The page's art, as far as the renderer asks: every clip and sprite "drawn", and each remembered. */
function fakeArt() {
  const drawn = [];
  return {
    drawn,
    animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, x, y, ...options }); return size; },
    miniPerson: () => {},
  };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 48, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'test', phase: 'fight', minute, caption: 'x', live: true, over: false, sides: [side('texian', 'loose', 'scattered', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'volley', 0.12)],
  lines: [], fallen: [], members: [], commands: { volley: [{ text: '¡Preparen!', gloss: 'Make ready!' }, { text: '¡Apunten!', gloss: 'Take aim!' }, { text: '¡Fuego!', gloss: 'Fire!' }] }, formations: [], ...over,
});

test('the Gonzales gun and completed flag select their delivered animated art', () => {
  const art = fakeArt(), view = createBattleView(art);
  const cannon = { side: 'texian', x: -0.08, y: 0, shots: [0], crew: 3, metal: 'bronze', claimId: 'HIST-TEX-475' };
  const flag = { side: 'texian', x: -0.12, y: 0, words: 'COME AND TAKE IT' };
  view.draw(fakeContext(), battle(0, { cannon, flag }), { camera, time: 0, now: 0, tickMs: 1000, bounds: { width: 1366, height: 768 } });
  assert.ok(art.drawn.some(one => one.clip === 'cannon-cartwheels-e-recoil'), 'Gonzales shot used the old carriage gun');
  assert.ok(art.drawn.some(one => one.clip === 'flag-come-and-take-it-wind'), 'the completed flag stayed canvas art');
});
/** Run the renderer for `seconds` of frames at 60 a second, a new tick every `tickMs`. */
function run(view, make, { seconds, from = 0, tickMs = 1000, wind = { x: 0, y: 0 } }) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(fakeContext(), make(Math.floor(t / tickMs)), { camera, time: t, now: t, tickMs, wind, bounds: { width: 1366, height: 768 } });
  return last;
}

test('volunteers are laid out loose and regulars in ranks, and no two loose men stand on one spot', () => {
  const loose = layoutSide(side('texian', 'loose', 'none', 0, { drawn: 56, spread: { width: 0.46, depth: 0.2 } }));
  const ranks = layoutSide(side('mexican', 'ranks', 'none', 0));
  const mounted = layoutSide(side('mexican', 'mounted', 'none', 0));
  const points = slots => slots.map(slot => ({ x: slot.across, y: slot.along }));
  assert.equal(loose.length, 56); assert.equal(ranks.length, 48);
  assert.ok(regularity(points(loose)) > 0.2, `loose men stand too evenly: ${regularity(points(loose))}`);
  assert.ok(regularity(points(ranks)) < 0.08 && regularity(points(mounted)) < 0.08, 'ranks are not even');
  for (let i = 0; i < loose.length; i++) for (let j = i + 1; j < loose.length; j++) assert.ok(Math.hypot(loose[i].along - loose[j].along, loose[i].across - loose[j].across) >= 0.0199, 'two loose men on one spot');
  // Stable: the same side is always laid out the same way, so a camera move never reshuffles a line.
  assert.deepEqual(layoutSide(side('texian', 'loose', 'none', 0, { drawn: 56, spread: { width: 0.46, depth: 0.2 } })), loose);
});

test('every man fires on his own cycle, again and again, and the smoke gathers, lingers, drifts with the wind and thins when the firing stops', () => {
  const view = createBattleView(fakeArt());
  const firing = run(view, minute => battle(minute), { seconds: 20, wind: { x: 0.6, y: 0 } });
  assert.ok(firing.shotsTotal >= 40, `only ${firing.shotsTotal} shots in twenty seconds of a scattered and a volley fire`);
  assert.ok(firing.smoke >= 30, `the smoke did not gather: ${firing.smoke} puffs`);
  // Nobody is frozen in one pose: across the frames the Texians are drawn aiming, firing, loading and waiting.
  const art = fakeArt(), again = createBattleView(art);
  run(again, minute => battle(minute), { seconds: 12 });
  const clips = new Set(art.drawn.filter(one => one.clip === 'volunteer-fire-reload').map(one => Math.floor((one.timeMs || 0) / 400)));
  assert.ok(clips.size >= 5, `the fire-and-load cycle is not being played through: ${[...clips]}`);
  // The wind carries it: after the same time, smoke on a westerly lies further east than on a still day.
  const still = run(createBattleView(fakeArt()), minute => battle(minute), { seconds: 10 }).smokeCentre;
  const windy = run(createBattleView(fakeArt()), minute => battle(minute), { seconds: 10, wind: { x: 1, y: 0 } }).smokeCentre;
  const southerly = run(createBattleView(fakeArt()), minute => battle(minute), { seconds: 10, wind: { x: 0, y: -1 } }).smokeCentre;
  assert.ok(windy.x - still.x > 0.004, `the smoke did not drift east on a westerly: ${(windy.x - still.x).toFixed(4)} miles`);
  assert.ok(still.y - southerly.y > 0.004, `the smoke did not drift north on a southerly: ${(still.y - southerly.y).toFixed(4)} miles`);
  // The firing stops: no new shot, and in under a minute the field clears.
  const quiet = minute => battle(minute, { sides: [side('texian', 'loose', 'none', -0.1), side('mexican', 'ranks', 'none', 0.12)] });
  const after = run(view, quiet, { seconds: 10, from: 20000 });
  assert.equal(after.shotsTotal, firing.shotsTotal, 'men went on firing after the fire stopped');
  assert.ok(after.smoke > 0, 'the smoke vanished at once instead of lingering');
  const cleared = run(view, quiet, { seconds: 50, from: 30000 });
  assert.ok(cleared.smoke < after.smoke / 4, `the smoke never thinned: ${after.smoke} -> ${cleared.smoke}`);
});

test('the officer gives the words of each volley, and every line is drawn over whoever said it at the moment the tick dated it', () => {
  const view = createBattleView(fakeArt());
  const said = run(view, minute => battle(minute), { seconds: 12 });
  const words = new Set();
  const collect = createBattleView(fakeArt());
  for (let t = 0; t < 12000; t += 50) for (const bubble of collect.draw(fakeContext(), battle(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } }).bubbles) words.add(bubble.text);
  assert.ok(['¡Preparen!', '¡Apunten!', '¡Fuego!'].every(word => words.has(word)), `the volley's words were not given: ${[...words]}`);
  assert.ok(said);
  // A line dated at the fourth minute of a five-minute tick shows about four fifths of the way through it.
  const talk = createBattleView(fakeArt());
  const line = { id: 'l1', text: 'Here they come!', side: 'texian', role: 'volunteer', kind: 'reconstructed', minute: 104 };
  talk.draw(fakeContext(), battle(100), { camera, time: 0, now: 0, tickMs: 1000, bounds: { width: 1366, height: 768 } });
  const shownAt = [];
  for (let t = 0; t <= 1000; t += 20) if (talk.draw(fakeContext(), battle(105, { lines: [line] }), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } }).bubbles.some(b => b.id === 'l1')) shownAt.push(t);
  assert.ok(shownAt.length && shownAt[0] >= 600 && shownAt[0] <= 800, `the line dated four fifths of the way through the tick was shown at ${shownAt[0]} ms`);
});

test('a fall is drawn where the record puts one, carried off after; a side that may not fall never does; a family\'s man fires with the force', () => {
  const view = createBattleView(fakeArt());
  const fallen = [{ side: 'mexican', count: 2, minute: 3, carried: false }, { side: 'texian', count: 1, minute: 3 }];
  const shown = run(view, minute => battle(minute, { fallen: minute >= 3 ? fallen : [], noFalling: ['texian'] }), { seconds: 8 });
  assert.equal(shown.fallen, 2, `the record's two falls were not drawn, or the Texian was: ${shown.fallen}`);
  // The family's person: named in `members`, posed by the force's own cycle through app.js, firing among the rest.
  const poses = new Set();
  const withMember = createBattleView(fakeArt());
  for (let t = 0; t < 15000; t += 1000 / 30) {
    withMember.draw(fakeContext(), battle(Math.floor(t / 1000), { members: ['hh-1-thomas'] }), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    const pose = withMember.memberPose({ id: 'hh-1-thomas' }, t);
    poses.add(pose.clip || pose.sprite);
    withMember.memberDrawn('hh-1-thomas', { x: -0.1, y: 0 }, 30);
  }
  assert.ok(poses.has('volunteer-fire-reload'), `the family's man never fired: ${[...poses]}`);
  assert.equal(withMember.memberPose({ id: 'somebody-else' }, 0), null, 'a person not in the force was given its pose');
});

test('the card: Watch through the family\'s own person before the fighting, never over an open decision, and the account after', () => {
  const person = { id: 'p', householdId: 'h', name: 'Elena' };
  const world = { role: 'student', householdId: 'h', entities: [person], battleAlert: { id: 'battle:gonzales:h', entityId: 'p', title: 'The fight is coming', text: "At Elena's side: ...", field: { x: 1, y: 2 } } };
  const [alert] = militaryNotices(world);
  assert.equal(alert.kind, 'battle'); assert.equal(alert.action, 'Watch'); assert.deepEqual(alert.field, { x: 1, y: 2 });
  assert.deepEqual(militaryNotices({ ...world, request: { status: 'open', kind: 'march' } }).filter(one => one.kind === 'battle'), [], 'the alert stacked on the family\'s open call');
  assert.deepEqual(militaryNotices({ ...world, encounter: { status: 'open', listenerId: 'p' } }).filter(one => one.kind === 'battle'), [], 'the alert stacked on a rider');
  assert.deepEqual(militaryNotices({ ...world, role: 'host' }), [], 'the Host was given a family\'s alert');
  assert.deepEqual(militaryNotices({ ...world, entities: [{ ...person, householdId: 'other' }] }), [], 'an alert for somebody not of this family');
  const after = militaryNotices({ ...world, battleAlert: undefined, battleAccount: { id: 'account:gonzales:h', entityId: 'p', title: 'What Elena saw', text: 'What happened: ...' } });
  assert.equal(after[0].kind, 'account'); assert.match(after[0].action, /Elena/);
});
