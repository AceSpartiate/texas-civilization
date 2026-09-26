// The renderer's pieces San Jacinto brought to the engine (public/battle-view.js; docs/BATTLES.md §8), on a canvas that
// records what is drawn: a camp at rest, a formed line firing on its own officers' English words, the rout with men giving
// themselves up where they stand, the dead lying where they fell while their side runs on, a group of horse drawn apart from
// its side as riders, and the breastwork and the marsh. (Guns on their ground and a family's man falling at his minute are the
// engine's own since the storming of Béxar, and tested there: tests/battle-bexar-view.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity } from '../public/battle-view.js';

function fakeContext() {
  const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
  return ctx;
}
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
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 60, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'san-jacinto', phase: 'x', minute, caption: 'x', live: true, over: false, lines: [], fallen: [], members: [], formations: [],
  sides: [side('texian', 'ranks', 'none', -0.3), side('mexican', 'camp', 'none', 0.3)], ...over,
});
function run(view, make, { seconds, from = 0, tickMs = 1000, art = null } = {}) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(fakeContext(), make(Math.floor(t / tickMs), t), { camera, time: t, now: t, tickMs, wind: { x: 0.3, y: 0 }, bounds: { width: 1366, height: 768 } });
  return last;
}

test('a camp at rest is scattered and unformed, some standing and some sitting, and fires nothing; the formed line against it stands in even ranks', () => {
  const art = fakeArt(), view = createBattleView(art);
  const shown = run(view, minute => battle(minute), { seconds: 3 });
  assert.equal(shown.shotsTotal, 0, 'a camp at rest fired');
  assert.ok(shown.regularity.mexican > 0.2, `the camp stands too evenly: ${shown.regularity.mexican}`);
  assert.ok(shown.regularity.texian < 0.08, `the formed line is not even: ${shown.regularity.texian}`);
  const camp = layoutSide(side('mexican', 'camp', 'none', 0));
  const sitting = camp.filter(slot => slot.rest === 'sit').length;
  assert.ok(sitting > 8 && sitting < 40, `${sitting} of 60 sitting`);
  assert.ok(art.drawn.some(one => one.clip === 'regular-injured-rest') && art.drawn.some(one => /^regular-idle-/.test(one.clip || '')), 'the camp is not drawn at rest');
  assert.equal(shown.styles.mexican, 'camp');
});

test('the Texian line fires its volley on its own officers\' words in English; the Mexican ranks on theirs in Spanish', () => {
  const commands = { volley: [{ text: '¡Preparen las armas!', gloss: 'Make ready!' }, { text: '¡Apunten!', gloss: 'Take aim!' }, { text: '¡Fuego!', gloss: 'Fire!' }], bySide: { texian: { volley: [{ text: 'Make ready!' }, { text: 'Aim low!' }, { text: 'Fire!' }] } } };
  const all = [];
  const v2 = createBattleView(fakeArt());
  for (let t = 0; t < 24000; t += 1000 / 30) { const e = v2.draw(fakeContext(), battle(Math.floor(t / 1000), { commands, sides: [side('texian', 'ranks', 'volley', -0.3), side('mexican', 'ranks', 'volley', 0.3)] }), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } }); for (const b of e.bubbles) all.push(b); }
  assert.ok(all.some(b => b.side === 'texian' && b.text === 'Aim low!'), 'the Texian officers gave no words');
  assert.ok(!all.some(b => b.side === 'texian' && /¡/.test(b.text)), 'the Texian officers spoke Spanish');
  assert.ok(all.some(b => b.side === 'mexican' && b.text === '¡Apunten!'));
  assert.ok(v2.evidence.shotsBy.texian > 0 && v2.evidence.shotsBy.mexican > 0);
});

test('in the rout a share of the broken side gives itself up where it stands, and the dead lie where they fell while the side runs on past them', () => {
  const view = createBattleView(fakeArt());
  const make = (minute, t) => battle(minute, {
    sides: [side('texian', 'rout', 'scattered', -0.3 + t / 40000, { action: 'advance', moving: true }), side('mexican', 'rout', 'none', 0.1 + t / 20000, { action: 'withdraw', moving: true, surrendering: 0.25, facing: { x: 1, y: 0 } })],
    fallen: [{ side: 'mexican', count: 6, minute: 2, claimId: 'X' }],
  });
  run(view, make, { seconds: 4 });
  const first = view.evidence;
  assert.ok(first.surrendering >= 8 && first.surrendering <= 25, `${first.surrendering} with their hands up`);
  assert.equal(first.fallenBy.mexican, 6);
  // Where the fallen are drawn now, and a few seconds later with the side gone on.
  const art = fakeArt(), view2 = createBattleView(art);
  run(view2, make, { seconds: 4 });
  const reclining = () => art.drawn.filter(one => one.sprite === 'regular-reclining').slice(-6).map(one => Math.round(one.x));
  const before = reclining();
  art.drawn.length = 0;
  run(view2, make, { seconds: 3, from: 4000 });
  const after = reclining();
  assert.equal(before.length, 6);
  assert.deepEqual(after.sort(), before.sort(), 'the dead slid along with the side running past them');
  // A later fall never lands on a man already down: counts add up.
  const view3 = createBattleView(fakeArt());
  // Five falls of ten out of sixty: laid over each other by chance, some would land on men already down.
  run(view3, (minute, t) => ({ ...make(minute, t), fallen: [1, 2, 3, 4, 5].map(at => ({ side: 'mexican', count: 10, minute: at, claimId: 'X' })) }), { seconds: 7 });
  assert.equal(view3.evidence.fallenBy.mexican, 50, 'a later fall landed on a man already down');
});

test('a group of horse is drawn apart from its side, as riders, with its own fall; the breastwork, the fires and the marsh stand on the ground', () => {
  const art = fakeArt(), view = createBattleView(art);
  const works = [
    { id: 'breastwork', kind: 'breastwork', x: 0.2, y: 0, width: 0.3, across: { x: 0, y: 1 } },
    { id: 'fires', kind: 'fires', x: 0.3, y: 0, width: 0.2, across: { x: 0, y: 1 } },
    { id: 'marsh', kind: 'marsh', x: 0.1, y: 0.1, width: 0.3, across: { x: 0, y: 1 } },
  ];
  const groups = [{ id: 'sherman', side: 'texian', name: 'Sherman’s horsemen', drawn: 6, style: 'mounted', mounted: true, fire: 'scattered', action: 'advance', moving: false, x: 0, y: -0.1, facing: { x: 1, y: 0 } }];
  run(view, minute => battle(minute, { works, groups, fallen: [{ side: 'texian', unit: 'sherman', count: 1, minute: 1, wounded: true, claimId: 'X' }] }), { seconds: 12 });
  const e = view.evidence;
  assert.deepEqual(Object.keys(e.groups), ['sherman']);
  assert.equal(e.figures.texian, 60, 'the group was counted in the side');
  assert.equal(e.fallenBy['g:sherman'], 1);
  assert.equal(e.fallenBy.texian, undefined);
  assert.ok(art.drawn.some(one => /^mounted-courier/.test(one.clip || '')), 'the Texian horsemen are not drawn riding');
  assert.ok(e.shotsBy.texian > 0, 'the horsemen did not fire');
  assert.ok(e.works > 20, `only ${e.works} pieces of works drawn`);
  for (const piece of ['crate', 'sacks', 'barrel']) assert.ok(art.drawn.some(one => one.sprite === piece), `no ${piece} in the breastwork`);
  assert.ok(art.drawn.some(one => one.clip === 'reeds-wind') && art.drawn.some(one => one.clip === 'fire-flicker'));
  // The opening in the middle of the breastwork where the gun stood (`HIST-TEX-522`).
  const pieces = art.drawn.filter(one => ['crate', 'sacks', 'barrel', 'packed-belongings'].includes(one.sprite)).map(one => one.y);
  assert.ok(!pieces.some(y => Math.abs(y - 384) < 0.015 * 1800), 'the breastwork has no opening for the gun');
});
