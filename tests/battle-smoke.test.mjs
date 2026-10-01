// Black-powder smoke (owner, 2026-09-30, after watching the Battle of Gonzales in a real class: "i don't think there was enough
// smoke for black powder weapons"; docs/BATTLES.md §15.2, public/battle-view.js `feedBank`, `drawSmoke`).
//
// Each shot is a billow out of the muzzle and feeds a bank lying where it was fired. These hold, on a canvas that records what is
// drawn, frame by frame: the banks build up under repeated fire until the line is hidden in them; they drift on the wind; they
// are drawn over the figures; they linger tens of seconds after the firing stops and thin slowly; a gun's shot makes a bigger bank
// that outlasts a musket's; the cost stays bounded however long the firing; and for less motion a still haze stands instead.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';

/** A context and art that write into one log, so what was drawn over what can be read off its order. */
function recorder() {
  const log = [];
  const noop = name => (...args) => { log.push([name, ...args]); };
  const ctx = new Proxy({ log, globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: (...args) => { log.push(['gradient', ...args]); return { addColorStop() {} }; } }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
  const art = {
    animated: (c, clip, x, y, size) => { log.push(['figure', clip, x, y]); return size; },
    drawSprite: (c, sprite, x, y, size) => { log.push([/^smoke-/.test(sprite) ? 'puff' : 'figure', sprite, x, y]); return size; },
    miniPerson: () => {},
  };
  return { log, ctx, art };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 40, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'smoke', phase: 'fight', minute, caption: 'x', live: true, over: false,
  sides: [side('texian', 'loose', 'scattered', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'volley', 0.12)],
  lines: [], fallen: [], members: [], commands: { volley: [{ text: '¡Preparen!' }, { text: '¡Apunten!' }, { text: '¡Fuego!' }] }, formations: [], ...over,
});
const quiet = minute => battle(minute, { sides: [side('texian', 'loose', 'none', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'none', 0.12)] });
/** Frames at 30 a second for `seconds`, a tick each second; the last frame's evidence. */
function run(view, make, { seconds, from = 0, wind = { x: 0, y: 0 }, ctx = null, reducedMotion = false }) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 30) last = view.draw(ctx || recorder().ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, wind, bounds, reducedMotion });
  return last;
}

test('the smoke builds up under repeated fire until the firing line stands hidden in it, and is drawn over the men', () => {
  const view = createBattleView(recorder().art);
  const early = run(view, battle, { seconds: 2 });
  const later = run(view, battle, { seconds: 28, from: 2000 });
  assert.ok(early.banks > 0, 'a shot left no bank on the field');
  assert.ok(later.bankDensity > early.bankDensity * 2, `the smoke did not build up: ${early.bankDensity} -> ${later.bankDensity}`);
  // Thick enough to hide most of what is behind it (0.82 is a bank at its thickest).
  assert.ok(later.cover >= 0.6, `the line is not hidden in its own smoke after half a minute of fire: cover ${later.cover}`);
  assert.ok(later.banksInView >= 4, `the smoke lies in ${later.banksInView} banks, not along the lines`);
  // Over the figures: in one frame of a field full of smoke, every bank's gradient comes after the last man drawn.
  const { log, ctx, art } = recorder(), drawn = createBattleView(art);
  run(drawn, battle, { seconds: 10, ctx });
  log.length = 0;
  drawn.draw(ctx, battle(10), { camera, time: 10000, now: 10000, tickMs: 1000, bounds });
  const lastFigure = log.findLastIndex(entry => entry[0] === 'figure'), firstBank = log.findIndex(entry => entry[0] === 'gradient');
  assert.ok(lastFigure > 0 && firstBank > lastFigure, `the smoke was not drawn over the men (last man at ${lastFigure}, first bank at ${firstBank})`);
});

test('the smoke drifts with the wind, lingers tens of seconds after the fire stops, and thins slowly away', () => {
  // The drift read once the firing has stopped, so no new shot pulls a bank back to the line (each plume is thrown out a random
  // way since §16.3, and a bank fed by a shot leans toward it): how far the smoke moves in the ten seconds after.
  const drift = wind => {
    const view = createBattleView(recorder().art);
    run(view, battle, { seconds: 10, wind });
    const from = run(view, quiet, { seconds: 2, from: 10000, wind }).bankCentre, to = run(view, quiet, { seconds: 10, from: 12000, wind }).bankCentre;
    return to.x - from.x;
  };
  const still = drift({ x: 0, y: 0 }), westerly = drift({ x: 1, y: 0 });
  assert.ok(westerly - still > 0.006, `the banks did not drift east on a westerly: ${(westerly - still).toFixed(4)} miles`);
  const view = createBattleView(recorder().art);
  const firing = run(view, battle, { seconds: 20 });
  const at20 = run(view, quiet, { seconds: 20, from: 20000 });
  assert.equal(at20.shotsTotal, firing.shotsTotal, 'men went on firing after the fire stopped');
  assert.ok(at20.banks > 0 && at20.lingerMs >= 19000, `the smoke did not linger twenty seconds: ${at20.banks} banks, ${at20.lingerMs} ms`);
  assert.ok(at20.cover >= 0.15, `twenty seconds after the last shot the smoke is already too thin to see: ${at20.cover}`);
  assert.ok(at20.bankDensity < firing.bankDensity, 'the smoke did not thin');
  const at50 = run(view, quiet, { seconds: 30, from: 40000 });
  assert.ok(at50.bankDensity < at20.bankDensity / 3, `the smoke thinned too little: ${at20.bankDensity} -> ${at50.bankDensity}`);
  const cleared = run(view, quiet, { seconds: 60, from: 70000 });
  assert.equal(cleared.banks, 0, `two minutes after the last shot the field has not cleared: ${cleared.banks} banks`);
});

test('a gun makes a bank of its own that outlasts a musket\'s', () => {
  const cannon = { side: 'texian', x: -0.08, y: 0, shots: [0], crew: 3, metal: 'bronze', claimId: 'HIST-TEX-475' };
  const view = createBattleView(recorder().art);
  const quietWithGun = minute => ({ ...quiet(minute), cannon });
  const fired = run(view, quietWithGun, { seconds: 1 });
  assert.ok(fired.cannonShots === 1 && fired.bankDensity >= 3.5, `one shot of the gun made a bank of ${fired.bankDensity}`);
  const later = run(view, quietWithGun, { seconds: 44, from: 1000 });
  assert.ok(later.banks >= 1 && later.cover >= 0.15, `the gun's smoke was gone in three quarters of a minute: ${later.banks} banks, cover ${later.cover}`);
});

test('however long the firing, the smoke on the field stays bounded', () => {
  const view = createBattleView(recorder().art);
  // A field as busy as any the war has: both lines and four companies more firing across a mile, on a strong wind that carries each
  // bank off and makes room for the next.
  const company = (id, x, y) => ({ id, side: 'texian', name: id, drawn: 40, style: 'loose', fire: 'scattered', action: 'stand', moving: false, x, y, facing: { x: 1, y: 0 }, spread: { width: 0.5, depth: 0.3 } });
  const heavy = minute => battle(minute, { sides: [side('texian', 'loose', 'scattered', -0.1, { drawn: 60, spread: { width: 0.9, depth: 0.4 } }), side('mexican', 'ranks', 'volley', 0.12, { drawn: 60 })],
    groups: [company('a', -0.1, -0.35), company('b', -0.1, 0.35), company('c', 0.4, -0.35), company('d', 0.4, 0.35)] });
  const last = run(view, heavy, { seconds: 90, wind: { x: 1.6, y: 0.3 } });
  assert.ok(last.banks >= 80, `only ${last.banks} banks on a field that busy: the cap was never near`);
  // The caps since 2026-09-30 (§16.3), raised with the frame time measured at 1366x768 and 1024x600: 96 banks, 160 plumes.
  assert.ok(last.banks <= 96, `${last.banks} banks`);
  assert.ok(last.smoke - last.banks <= 160, `${last.smoke - last.banks} puffs`);
  assert.ok(last.shotsTotal > 200, `only ${last.shotsTotal} shots in ninety seconds`);
});

test('for less motion nothing grows or drifts: a still haze stands over the lines that are firing', () => {
  const frame = (t, make = battle) => { const { log, ctx, art } = recorder(); const shown = createBattleView(art).draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds, reducedMotion: true }); return { shown, haze: log.filter(entry => entry[0] === 'gradient').map(entry => entry.slice(1).map(n => Math.round(n))) }; };
  const a = frame(1000), b = frame(9000);
  assert.ok(a.shown.haze >= 2, `no haze over the two lines firing: ${a.shown.haze}`);
  assert.equal(a.shown.shotsTotal, 0, 'a shot was fired with less motion asked for');
  assert.equal(a.shown.smoke, 0, 'a puff or a bank was made with less motion asked for');
  assert.deepEqual(b.haze, a.haze, 'the haze moved between two frames');
  assert.equal(frame(1000, quiet).shown.haze, 0, 'a haze stood over men not firing');
});
