// A dragoon's shot in the chase (sim/pursuit.mjs `chaseProjection`; public/chase-view.js), wired 2026-10-25 (batch W of
// docs/ART_PLAN_LOCAL_2026-10-25.md): Astra's carbine fired from the saddle (`dragoon-fire`, 2026-10-03; north and south her
// `dragoon-mounted-fire-*`, 2026-10-12) on the shot's own moment - shouldered just before it, the recoil on it, lowered after -
// the clock the battles fire it on. Before, he rode on in `dragoon-march` with a flash at his hands. The flash and smoke stay the
// page's: her frames carry none.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createChaseView, FIRE_LEAD_MS, FIRE_AFTER_MS } from '../public/chase-view.js';

const animation = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json', import.meta.url), 'utf8'));
const clips = animation.clips || animation;

function fakeArt() {
  const drawn = [];
  return { drawn, clipReady: () => true, animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, size, seed, ...options }); return size; }, miniPerson() {} };
}
const ctx = new Proxy({ globalAlpha: 1, createRadialGradient: () => ({ addColorStop() {} }), measureText: text => ({ width: String(text).length * 6 }) }, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const camera = { toScreen: p => ({ x: 600 + p.x * 4000, y: 400 + p.y * 4000 }), figure: 40, scale: 4000 };
/** Two ticks of a cavalry chase coming from `dir`, the second with one shot by man 1 halfway through the tick. */
function chase(dir, shots = []) {
  const base = { id: 'chase-1', kind: 'cavalry', men: 2, phase: 'seen', x: 0, y: 0, dir, soldiers: [{ g: 300 }, { g: 300 }], lines: [] };
  return [{ ...base, minute: 10, shots: [] }, { ...base, minute: 12, soldiers: [{ g: 250 }, { g: 250 }], shots }];
}
function play(dir) {
  const art = fakeArt(), view = createChaseView(art), [first, second] = chase(dir, [{ n: 1, man: 1, minute: 11, hit: false, yards: 250 }]);
  view.draw(ctx, [first], { camera, now: 0, time: 0, tickMs: 1000 });
  const frames = [];
  for (let now = 1000; now <= 3000; now += 20) {
    art.drawn.length = 0;
    const seen = view.draw(ctx, [second], { camera, now, time: now, tickMs: 1000 });
    frames.push({ now, drawn: [...art.drawn], seen });
  }
  return frames;
}

test('a dragoon fires his carbine from the saddle on the shot\'s own moment, and rides on in his march around it', () => {
  // Coming from the east (dir +x): he faces west, toward the family - her east clip mirrored.
  const frames = play({ x: 1, y: 0 });
  const shotAt = 1000 + 0.5 * 1000 * 0.9;
  const firing = frames.flatMap(f => f.drawn.filter(d => d.seed === 'chase-1:1:fire').map(d => ({ ...d, now: f.now })));
  assert.ok(firing.length, 'the dragoon who fired is never drawn firing');
  assert.ok(firing.every(d => d.clip === 'dragoon-fire' && d.flip === true), `drawn as ${[...new Set(firing.map(d => `${d.clip}/${d.flip}`))]}`);
  assert.ok(clips['dragoon-fire'], 'her clip');
  const from = Math.min(...firing.map(d => d.now)), to = Math.max(...firing.map(d => d.now));
  assert.ok(Math.abs(from - (shotAt - FIRE_LEAD_MS)) <= 20 && Math.abs(to - (shotAt + FIRE_AFTER_MS)) <= 20, `fired from ${from} to ${to} around a shot at ${shotAt}`);
  // The recoil frame of her clip (360-480 ms) is drawn at the shot, when the page's flash goes off.
  const atShot = firing.find(d => d.now >= shotAt);
  assert.ok(atShot && atShot.timeMs >= 360 && atShot.timeMs < 480, `at the shot he is ${atShot?.timeMs} ms into the clip, not the recoil`);
  // The other dragoon, and this one before and after, ride in the march.
  assert.ok(frames.every(f => f.drawn.filter(d => d.seed === 'chase-1:0').every(d => /^dragoon-(march|idle)/.test(d.clip))));
  assert.ok(frames.at(-1).drawn.some(d => d.seed === 'chase-1:1' && /^dragoon-(march|idle)/.test(d.clip)), 'he does not ride on after the shot');
  assert.deepEqual(frames.at(-1).seen.fireClips, ['dragoon-fire']);
});

test('coming up from the south or down from the north he fires in her own end-on frames, never mirrored', () => {
  for (const [dir, clip] of [[{ x: 0, y: 1 }, 'dragoon-mounted-fire-n'], [{ x: 0, y: -1 }, 'dragoon-mounted-fire-s']]) {
    const firing = play(dir).flatMap(f => f.drawn.filter(d => d.seed === 'chase-1:1:fire'));
    assert.ok(firing.length && firing.every(d => d.clip === clip && d.flip === false), `${JSON.stringify(dir)}: ${[...new Set(firing.map(d => d.clip))]}`);
    assert.ok(clips[clip], `${clip} is her clip`);
  }
});
