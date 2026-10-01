// More and more dramatic smoke (owner, 2026-09-30, verbatim: "more and more dramatic smoke plumes for weapons fire";
// docs/BATTLES.md §16.3, public/battle-view.js `puff`, `feedBank`, `drawBank`).
//
// On a canvas that records what is drawn: a shot throws a plume bigger than the man who fired it, out of the muzzle the way his
// piece points and up; a volley rolls out a wall of smoke along the rank; a gun blasts a column that climbs and spreads; and a long
// fight ends half-shrouded. Readability through it is held by the browser proof (the clearings round the class's own men, the names
// over the smoke), which needs a real canvas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';

function recorder() {
  const log = [];
  const ctx = new Proxy({ globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: (x0, y0, r0, x1, y1, r1) => { log.push(['gradient', x1, y1, r1]); return { addColorStop() {} }; } }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
  const art = { animated: () => 30, drawSprite: (c, sprite, x, y, size, options) => { log.push([/^smoke-/.test(sprite) ? 'puff' : 'figure', sprite, x, y, size, options?.alpha]); return size; }, miniPerson: () => {} };
  return { log, ctx, art };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 40, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({ id: 'plumes', phase: 'fight', minute, caption: 'x', live: true, over: false, sides: [side('texian', 'loose', 'scattered', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'volley', 0.12)], lines: [], fallen: [], members: [], commands: null, formations: [], ...over });
function run(view, make, seconds, ctx, from = 0) { let last = null; for (let t = from; t < from + seconds * 1000; t += 1000 / 30) last = view.draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds }); return last; }

test('a shot throws a plume bigger than the man who fired it, out of the muzzle the way he faces, and up', () => {
  const { log, ctx, art } = recorder(), view = createBattleView(art);
  // The Texians alone firing, facing east.
  const make = minute => battle(minute, { sides: [side('texian', 'loose', 'scattered', -0.1, { spread: { width: 0.4, depth: 0.2 } }), side('mexican', 'ranks', 'none', 0.12)] });
  run(view, make, 20, ctx);
  const puffs = log.filter(entry => entry[0] === 'puff');
  assert.ok(puffs.length > 100, 'no plumes were drawn');
  assert.ok(Math.max(...puffs.map(entry => entry[4])) > camera.figure * 3, `the biggest plume was ${Math.max(...puffs.map(entry => entry[4]))} px against a man of ${camera.figure}`);
  // Out the way they face: in one frame the plumes lie east of the men who fired them, and above them.
  log.length = 0;
  view.draw(ctx, make(20), { camera, time: 20000, now: 20000, tickMs: 1000, bounds });
  const mean = (entries, i) => entries.reduce((sum, entry) => sum + entry[i], 0) / entries.length;
  const men = log.filter(entry => entry[0] === 'figure' && /^volunteer/.test(entry[1])), smoke = log.filter(entry => entry[0] === 'puff');
  assert.ok(men.length && smoke.length, 'nothing to compare');
  assert.ok(mean(smoke, 2) > mean(men, 2) + camera.figure * 0.6, `the plumes lie at x ${mean(smoke, 2).toFixed(0)}, not thrown out in front of the men at ${mean(men, 2).toFixed(0)}`);
  assert.ok(mean(smoke, 3) < mean(men, 3) - camera.figure * 0.5, 'the plumes did not rise above the men');
});

test('a volley rolls out a wall of smoke along the rank', () => {
  const { ctx, art } = recorder(), view = createBattleView(art);
  const make = minute => battle(minute, { sides: [side('texian', 'loose', 'none', -0.1), side('mexican', 'ranks', 'volley', 0.12)] });
  const shown = run(view, make, 25, ctx);
  assert.ok(shown.shotsBy.mexican > 0, 'the rank never fired');
  assert.ok(shown.smokeWalls >= 1, `no wall of smoke along the rank: ${shown.smokeWalls}`);
});

test('a gun blasts a column of smoke that climbs and spreads', () => {
  const { log, ctx, art } = recorder(), view = createBattleView(art);
  const cannon = { side: 'texian', x: -0.08, y: 0, shots: [0], crew: 3, metal: 'iron', claimId: 'HIST-TEX-475' };
  const make = minute => battle(minute, { sides: [side('texian', 'loose', 'none', -0.1), side('mexican', 'ranks', 'none', 0.12)], cannon });
  run(view, make, 1, ctx);
  const at = (from, seconds) => { log.length = 0; const shown = run(view, make, seconds, ctx, from); const top = Math.min(...log.filter(e => e[0] === 'gradient').map(e => e[2] - e[3])); const widest = Math.max(...log.filter(e => e[0] === 'gradient').map(e => e[3])); return { shown, top, widest }; };
  const early = at(1000, 0.1), later = at(12000, 0.1);
  assert.ok(early.shown.smokePlumes >= 1 && later.shown.smokePlumes >= 1, 'the gun\'s smoke did not go up as a plume');
  assert.ok(later.top < early.top - camera.figure * 2, `the plume did not climb: its top at ${early.top.toFixed(0)} then ${later.top.toFixed(0)}`);
  assert.ok(later.widest > early.widest * 1.3, 'the plume did not spread as it climbed');
  assert.ok(later.widest > camera.figure * 4, `the gun's plume is ${later.widest.toFixed(0)} px across, against a man of ${camera.figure}`);
});

test('a long fight ends half-shrouded in its own smoke', () => {
  const { ctx, art } = recorder(), view = createBattleView(art);
  const early = run(view, battle, 10, ctx), long = run(view, battle, 80, ctx, 10000);
  assert.ok(long.cover >= 0.85, `after a minute and a half of fire the thickest smoke hides ${long.cover} of what is behind it`);
  assert.ok(long.bankDensity > early.bankDensity * 1.5, `the smoke stopped building: ${early.bankDensity} -> ${long.bankDensity}`);
  assert.ok(long.banksInView >= 10, `the field is shrouded by only ${long.banksInView} banks`);
});
