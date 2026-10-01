// The fight at the speed men fight it (owner, 2026-09-30, at Study: "it was too fast"; told the whole fight already ran five minutes
// at Study and the speed was likely the action inside it, "i think you're correct about speed"; docs/BATTLES.md §16.1).
//
// On a canvas that records what is drawn, in real time, whatever the class's pace: a man aims, fires and is seen loading over
// seconds, and fires about three times a minute; the officer's three words are each long enough to read and a rank's turn comes
// round every twenty seconds; a man hit staggers and goes down over seconds, and the men of one fall go down a moment apart; a
// gun's crew stands ready before a shot the page knows is coming, and the gun recoils over more than a second and a half.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, musketClip } from '../public/battle-view.js';

function fakeContext() {
  const noop = () => () => {};
  return new Proxy({ globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
}
function fakeArt() {
  const drawn = [];
  return { drawn, animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, seed, ...options }); return size; }, drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, x, y, ...options }); return size; }, miniPerson: () => {} };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 40, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'pace', phase: 'fight', minute, caption: 'x', live: true, over: false,
  sides: [side('texian', 'loose', 'scattered', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'none', 0.12)],
  lines: [], fallen: [], members: [], commands: { volley: [{ text: '¡Preparen!', gloss: 'Make ready!' }, { text: '¡Apunten!', gloss: 'Take aim!' }, { text: '¡Fuego!', gloss: 'Fire!' }] }, formations: [], ...over,
});
const frame = (view, b, t, ctx = fakeContext()) => view.draw(ctx, b, { camera, time: t, now: t, tickMs: 1000, bounds });

test('a man aims, fires and is seen loading over seconds, and fires about three times a minute', () => {
  // The clip held at a man's pace: the aim a second and a half, the load and the ramrod over nearly ten seconds.
  assert.equal(musketClip(0), 0);
  assert.ok(Math.abs(musketClip(1500) - 700) < 1, 'the shot is not at the end of the aim');
  for (let t = 0; t < 12000; t += 100) assert.ok(musketClip(t + 100) >= musketClip(t), 'the cycle runs backward');
  assert.ok(musketClip(1700 + 4000) < 1570 && musketClip(1700 + 4300) >= 1570, 'the load is not held four seconds');
  const art = fakeArt(), view = createBattleView(art);
  let last = null;
  for (let t = 0; t < 60000; t += 1000 / 30) last = frame(view, battle(Math.floor(t / 1000)), t);
  const shots = last.shotsBy.texian, men = 40;
  assert.ok(shots >= men * 2 && shots <= men * 4.5, `${men} men fired ${shots} times in a minute (about three each is a man's pace)`);
  // Loading is seen: most of the time a man is in his firing cycle, he is drawn biting, pouring and ramming.
  const cycle = art.drawn.filter(one => one.clip === 'volunteer-fire-reload');
  const loading = cycle.filter(one => one.timeMs >= 820).length / cycle.length;
  assert.ok(loading > 0.75, `a man was drawn loading in only ${(loading * 100).toFixed(0)}% of his firing cycle`);
});

test('the officer\'s three words are each long enough to read, and a rank\'s turn comes round every twenty seconds', () => {
  const view = createBattleView(fakeArt());
  const volley = minute => battle(minute, { sides: [side('texian', 'loose', 'none', -0.1), side('mexican', 'ranks', 'volley', 0.12)] });
  const seen = {}, shotsAt = [];
  let before = 0;
  for (let t = 0; t < 45000; t += 50) {
    const shown = frame(view, volley(Math.floor(t / 1000)), t);
    for (const bubble of shown.bubbles) (seen[bubble.text] ||= []).push(t);
    if ((shown.shotsBy.mexican || 0) > before) { shotsAt.push(t); before = shown.shotsBy.mexican; }
  }
  // One whole order, from the first "¡Preparen!": the next "¡Apunten!" after it, and the next "¡Fuego!" after that.
  const p = seen['¡Preparen!']?.[0], a = seen['¡Apunten!']?.find(t => t > p), f = seen['¡Fuego!']?.find(t => t > a);
  assert.ok(a - p >= 2000 && f - a >= 2000, `the words came too close: ${JSON.stringify({ p, a, f })}`);
  const span = (word, from) => seen[word].filter(t => t >= from && t - from < 6000).length * 50;
  for (const [word, from] of [['¡Preparen!', p], ['¡Apunten!', a], ['¡Fuego!', f]]) assert.ok(span(word, from) >= 1800, `${word} was on the screen ${span(word, from)} ms`);
  // A volley is a rank firing together: its shots fall in one moment, and the next rank's twenty seconds after the last's.
  const volleys = shotsAt.reduce((out, t) => (out.length && t - out.at(-1).at(-1) < 1000 ? out.at(-1).push(t) : out.push([t]), out), []);
  assert.ok(volleys.length >= 2, `only ${volleys.length} volleys in forty-five seconds`);
  for (let i = 1; i < volleys.length; i++) assert.ok(volleys[i][0] - volleys[i - 1][0] >= 19000, `two volleys ${volleys[i][0] - volleys[i - 1][0]} ms apart`);
});

test('a man hit staggers and goes down over seconds, and the men of one fall go down a moment apart', () => {
  // A family's man killed at the third minute (one tick a second here).
  const man = { id: 'm-1' }, view = createBattleView(fakeArt());
  const poses = [];
  for (let t = 0; t < 12000; t += 1000 / 30) {
    const minute = Math.floor(t / 1000);
    frame(view, battle(minute, { members: [man.id], memberFates: minute >= 3 ? { [man.id]: { fate: 'killed', minute: 3 } } : undefined }), t);
    view.memberDrawn(man.id, { x: -0.1, y: 0 }, 30);
    poses.push({ t, pose: view.memberPose(man, t) });
  }
  const hit = poses.find(one => one.pose.sprite === 'volunteer-injured')?.t, down = poses.find(one => one.pose.sprite === 'volunteer-reclining')?.t;
  assert.ok(hit !== undefined && down !== undefined && down - hit >= 2000, `he went from hit to lying still in ${down - hit} ms`);
  // Five of the line fall at one minute: they go down over seconds, not all in one frame.
  const art = fakeArt(), line = createBattleView(art);
  const fallen = [{ side: 'mexican', count: 5, minute: 2 }];
  const lying = [];
  for (let t = 0; t < 12000; t += 1000 / 30) {
    art.drawn.length = 0;
    frame(line, battle(Math.floor(t / 1000), { fallen: Math.floor(t / 1000) >= 2 ? fallen : [] }), t);
    lying.push({ t, n: art.drawn.filter(one => one.sprite === 'regular-reclining').length });
  }
  const firstDown = lying.find(one => one.n > 0)?.t, allDown = lying.find(one => one.n >= 5)?.t;
  assert.ok(firstDown && allDown && allDown - firstDown >= 1000, `five men went down together (${firstDown} -> ${allDown})`);
  assert.ok(firstDown - 2000 >= 2000, `the first of them lay still ${firstDown - 2000} ms after he was hit`);
});

test('a gun\'s crew stands ready before a shot the page knows is coming, and the gun recoils over more than a second and a half', () => {
  const art = fakeArt(), view = createBattleView(art);
  // The tick that brings minute 1 dates the shot at minute 2's end of it: drawn most of the way through the tick that follows.
  const cannon = minute => ({ side: 'texian', x: -0.08, y: 0, shots: minute >= 2 ? [2] : [], crew: 3, metal: 'iron', claimId: 'HIST-TEX-475' });
  const at = [];
  for (let t = 0; t < 9000; t += 1000 / 30) {
    art.drawn.length = 0;
    const minute = t < 4000 ? 1 : 3;
    const shown = frame(view, battle(minute, { cannon: cannon(minute) }), t);
    at.push({ t, firing: shown.cannon.firing, ready: shown.cannon.ready, crewReady: art.drawn.some(one => one.clip === 'volunteer-gun-fire' && one.timeMs === 0) });
  }
  const fired = at.find(one => one.firing)?.t, lastRecoil = at.filter(one => one.firing).at(-1)?.t;
  assert.ok(fired !== undefined, 'the gun never fired');
  assert.ok(lastRecoil - fired >= 1500, `the gun recoiled for ${lastRecoil - fired} ms`);
  assert.ok(at.some(one => one.t < fired && one.ready && one.crewReady), 'nobody stood ready at the gun before its shot');
});
