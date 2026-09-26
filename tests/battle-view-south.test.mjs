// The renderer's additions for the south's fights (public/battle-view.js, docs/BATTLES.md §6.13): a side drawn in parts, men
// asleep, shut in houses and firing from them, giving up; a night with lit windows; houses, groves and a herd; a fallen man who
// stays where he fell while his part moves on; a family's man drawn in his part and, once it has come, in his fate; riders.
// On a canvas that records what is drawn, as tests/battle-view.test.mjs does for Gonzales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';

function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  return new Proxy({ calls, globalAlpha: 1, fillStyle: '', globalCompositeOperation: 'source-over', measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; if (key === 'fillStyle' || key === 'globalCompositeOperation') target.calls.push([`set:${key}`, value]); return true; },
  });
}
function fakeArt() {
  const drawn = [];
  return {
    drawn,
    animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, size, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, x, y, size, ...options }); return size; },
    miniPerson: () => {},
  };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const part = (id, drawn, x, extra = {}) => ({ id, drawn, x, y: 0, style: 'loose', fire: 'none', action: 'stand', moving: false, pose: 'stand', facing: { x: 1, y: 0 }, spread: { width: 0.04, depth: 0.03 }, ...extra });
const night = (minute, texParts, over = {}) => ({
  id: 'san-patricio', phase: 'surprise', minute, caption: 'x', live: true, over: false, light: 'night',
  sides: [
    { side: 'texian', name: 'Johnson’s men', count: 34, drawn: 34, style: 'camp', fire: 'none', action: 'stand', moving: false, x: 0, y: 0, facing: { x: 1, y: 0 }, parts: texParts },
    { side: 'mexican', name: 'Urrea’s men', count: 100, drawn: 48, style: 'street', fire: 'scattered', action: 'advance', moving: false, x: 0.2, y: 0, facing: { x: -1, y: 0 }, parts: [part('at-square', 20, 0.2, { facing: { x: -1, y: 0 }, fire: 'scattered', style: 'street' })] },
  ],
  scenery: [{ id: 'house-a', kind: 'house', sprite: 'house-jacal', x: 0.05, y: 0.02, lit: false }, { id: 'lamp-1', kind: 'house', sprite: 'jacal-poor', x: -0.07, y: -0.03, lit: true }, { id: 'fire', kind: 'campfire', x: 0, y: 0.008, lit: true }],
  lines: [], fallen: [], members: [], commands: null, formations: [], ...over,
});
function run(view, make, { seconds, from = 0, tickMs = 1000, art = null, ctx = null }) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(ctx || fakeContext(), make(Math.floor(t / tickMs), t), { camera, time: t, now: t, tickMs, wind: { x: 0.3, y: 0 }, bounds: { width: 1366, height: 768 } });
  return last;
}

test('a side in parts is drawn part by part: men asleep lying down, men in a house unseen but firing from it, men giving up with their hands up', () => {
  const art = fakeArt(), view = createBattleView(art);
  const texParts = [
    part('square', 8, -0.02, { pose: 'asleep', style: 'camp' }),
    part('house-b', 9, 0.03, { pose: 'hidden', fire: 'scattered' }),
    part('house-a', 9, 0.06, { pose: 'surrender' }),
  ];
  const evidence = run(view, minute => night(minute, texParts), { seconds: 12, art });
  assert.deepEqual(evidence.parts, { texian: 3, mexican: 1 });
  assert.equal(evidence.poses.asleep, 8, 'the eight on the square are not drawn asleep');
  assert.equal(evidence.poses.hidden, 9, 'the men in the house are drawn');
  assert.equal(evidence.poses.surrender, 9);
  assert.equal(evidence.figures.texian, 17, 'the hidden men were counted as drawn');
  assert.ok(art.drawn.some(one => one.sprite === 'volunteer-reclining'), 'nobody was drawn lying asleep');
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-surrender'), 'nobody was drawn with their hands up');
  // The house fires: Texian shots with nobody of the house drawn, each flash at the house.
  assert.ok((evidence.shotsBy.texian || 0) >= 5, `the house fired ${evidence.shotsBy.texian || 0} shots in twelve seconds`);
});

test('a night fight is dark but for the lit windows, the fire and the flashes', () => {
  const art = fakeArt(), view = createBattleView(art), ctx = fakeContext();
  const evidence = run(view, minute => night(minute, [part('square', 8, 0, { pose: 'stand', fire: 'scattered' })]), { seconds: 4, art, ctx });
  assert.equal(evidence.night, true);
  assert.equal(evidence.lit, 2, 'the lantern and the fire are not lit');
  assert.ok(ctx.calls.some(call => call[0] === 'set:fillStyle' && /rgba\(8,12,30/.test(call[1])), 'no dark was laid over the field');
  assert.ok(ctx.calls.some(call => call[0] === 'set:globalCompositeOperation' && call[1] === 'lighter'), 'nothing glows through the dark');
  // By day, none of it.
  const day = createBattleView(fakeArt()).draw(fakeContext(), { ...night(1, [part('square', 8, 0)]), light: undefined }, { camera, time: 0, now: 0, tickMs: 1000, bounds: { width: 1366, height: 768 } });
  assert.equal(day.night, false);
  assert.equal(evidence.scenery, 3, 'the houses and the fire are not drawn');
});

test('a man who falls lies where he fell while the rest of his part is marched off', () => {
  const art = fakeArt(), view = createBattleView(art);
  const make = minute => night(minute, [part('square', 8, minute < 5 ? 0 : 0.1, { moving: minute >= 5, pose: minute >= 5 ? 'surrender' : 'stand' })], {
    fallen: minute >= 2 ? [{ side: 'texian', part: 'square', count: 3, minute: 2, claimId: 'HIST-TEX-510' }] : [],
  });
  run(view, make, { seconds: 4, art });
  const lying = () => art.drawn.filter(one => one.sprite === 'volunteer-reclining').map(one => Math.round(one.x));
  const before = new Set(lying());
  art.drawn.length = 0;
  run(view, make, { seconds: 8, from: 4000, art });
  const after = new Set(lying());
  assert.ok(before.size >= 1, 'nobody was drawn lying');
  assert.deepEqual([...after].sort(), [...before].sort(), 'the fallen moved with their part');
});

test('the groves hide the dragoons, and a herd is driven and scattered; Grant\'s men ride', () => {
  const art = fakeArt(), view = createBattleView(art);
  const battle = minute => ({
    id: 'agua-dulce', phase: 'ambush', minute, caption: 'x', live: true, over: false,
    sides: [
      { side: 'texian', name: 'Grant’s party', count: 26, drawn: 26, style: 'loose', fire: 'none', action: 'advance', moving: true, mounted: true, x: 0, y: 0, facing: { x: 1, y: 0 }, parts: [part('lead', 6, 0, { moving: true, style: 'rout' }), part('middle', 14, -0.1, { moving: true, style: 'rout' })] },
      { side: 'mexican', name: 'Urrea’s dragoons', count: 80, drawn: 48, style: 'mounted', fire: 'picket', action: 'advance', moving: true, mounted: true, x: 0.3, y: 0, facing: { x: -1, y: 0 }, parts: [part('east-grove', 24, 0.3, { style: 'mounted', facing: { x: -1, y: 0 }, moving: true })] },
    ],
    scenery: [{ id: 'grove-east', kind: 'grove', x: 0.32, y: 0.1, trees: 7, spread: 0.1 }],
    herd: { x: 0.1 + minute * 0.01, y: 0, count: 300, moving: true, scatter: minute > 3 },
    lines: [], fallen: [], members: [], commands: null, formations: [],
  });
  const evidence = run(view, battle, { seconds: 6, art });
  assert.ok(evidence.herd >= 20, `the herd is ${evidence.herd} horses`);
  assert.ok(art.drawn.some(one => one.clip === 'mustang-gallop'), 'the herd is not galloping');
  assert.ok(art.drawn.filter(one => one.sprite === 'live-oak-large' || one.sprite === 'mesquite-large').length >= 7, 'the grove is not drawn');
  assert.equal(evidence.poses.rider, 20, 'Grant\'s men are not drawn riding');
  assert.ok(art.drawn.some(one => one.clip === 'mounted-courier-e'));
});

test('a family\'s man is drawn in his part - asleep, in the house, giving up - and once his fate has come, in it', () => {
  const view = createBattleView(fakeArt());
  const texParts = [part('square', 8, 0, { pose: 'asleep', style: 'camp' }), part('house-b', 9, 0.03, { pose: 'hidden', fire: 'scattered' })];
  const draw = (minute, fates = {}, now = minute * 1000) => view.draw(fakeContext(), night(minute, texParts, { members: ['a', 'b'], memberParts: { a: 'square', b: 'house-b' }, memberFates: fates }), { camera, time: now, now, tickMs: 1000, bounds: { width: 1366, height: 768 } });
  draw(1);
  assert.equal(view.memberPose({ id: 'a' }, 1000).sprite, 'volunteer-reclining', 'a man asleep on the square is not drawn asleep');
  const inHouse = view.memberPose({ id: 'b' }, 1000);
  assert.ok(inHouse.clip === 'volunteer-fire-reload' || /^volunteer-(e|w|load)$/.test(inHouse.sprite), 'a man in the house that fires is not firing');
  // His fate, once the server sends it: hit, then lying still; the other taken, hands up.
  draw(3, { a: { fate: 'killed', minute: 3 }, b: { fate: 'captured', minute: 3 } }, 3000);
  draw(4, { a: { fate: 'killed', minute: 3 }, b: { fate: 'captured', minute: 3 } }, 4500);
  const killed = view.memberPose({ id: 'a' }, 4500);
  assert.ok(killed.sprite === 'volunteer-reclining' || killed.clip === 'volunteer-injured-rest');
  assert.equal(view.memberPose({ id: 'b' }, 4500).clip, 'volunteer-surrender');
  assert.deepEqual(view.evidence.memberFates, { a: 'killed', b: 'captured' });
});
