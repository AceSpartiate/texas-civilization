// Which way the smoke goes (owner, 2026-10-27: "smoke plumes from gunfire: do they go in the right direction? always?";
// docs/BATTLES.md §17.1, public/battle-view.js `aimOf`, `puff`, `feedBank`, `drawBank`).
//
// Until 2026-10-27 every plume was thrown east or west by the sign of the facing's x alone, so a man or a gun firing north or
// south threw its smoke sideways; a volley's wall was always laid east to west, across a rank that faced east instead of along it;
// the smoke's rising was counted as ground travelled north, so on a light wind from the north the banks crept north against it;
// and a named man drawn firing (Travis at the north battery) made no smoke at all. On a canvas that records what is drawn, each
// of those is held here. Each test was seen failing under the regression it guards (scripts/battle-smoke-direction-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { aimOf, createBattleView, squareAim } from '../public/battle-view.js';

function recorder() {
  const log = [];
  const ctx = new Proxy({ globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: (x0, y0, r0, x1, y1, r1) => { log.push(['gradient', x1, y1, r1]); return { addColorStop() {} }; } }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
  const art = { animated: (c, clip, x, y, size) => { log.push(['figure', clip, x, y, size]); return 30; }, drawSprite: (c, sprite, x, y, size, options) => { log.push([/^smoke-/.test(sprite) ? 'puff' : 'figure', sprite, x, y, size, options?.alpha]); return size; }, miniPerson: () => {} };
  return { log, ctx, art };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
const mean = (entries, i) => entries.reduce((sum, entry) => sum + entry[i], 0) / entries.length;
/** One man (or `drawn`) at the middle of the field, firing at will, facing `facing`; the other side far off and silent. */
const firingLine = (facing, extra = {}) => minute => ({
  id: 'direction', phase: 'fight', minute, caption: 'x', live: true, over: false, lines: [], fallen: [], members: [], commands: null, formations: [],
  sides: [
    { side: 'texian', name: 'texian', count: 60, drawn: extra.drawn ?? 1, style: 'loose', fire: 'scattered', action: 'stand', moving: false, x: 0, y: 0, facing, spread: { width: 0.3, depth: 0.1 } },
    { side: 'mexican', name: 'mexican', count: 60, drawn: 4, style: 'ranks', fire: 'none', action: 'stand', moving: false, x: 2, y: 2, facing: { x: -1, y: 0 } },
  ],
});
function run(view, make, seconds, ctx, { from = 0, wind = null } = {}) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 30) last = view.draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds, wind });
  return last;
}
/** The plumes and the man of the first frame, after `seconds` of firing, with a plume in it at least two seconds old. */
function frame(make, seconds = 20) {
  const { log, ctx, art } = recorder(), view = createBattleView(art);
  run(view, make, seconds, ctx);
  let lastShot = -Infinity, shots = 0;
  for (let t = seconds * 1000; t < 120000; t += 1000 / 30) {
    log.length = 0;
    const shown = view.draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds });
    if (shown.shotsTotal > shots) { shots = shown.shotsTotal; lastShot = t; }
    const smoke = log.filter(entry => entry[0] === 'puff');
    if (smoke.length && t - lastShot > 2000) return { men: log.filter(entry => entry[0] === 'figure' && /^volunteer/.test(entry[1])), smoke };
  }
  return { men: [], smoke: [] };
}

test('a line firing north throws its smoke north, and one firing south throws it south - not east or west', () => {
  const north = frame(firingLine({ x: 0, y: -1 })), south = frame(firingLine({ x: 0, y: 1 })), east = frame(firingLine({ x: 1, y: 0 }));
  for (const one of [north, south, east]) assert.ok(one.men.length && one.smoke.length, 'nothing to compare');
  // East: thrown out in front of the men (the case that was always right).
  const eastward = mean(east.smoke, 2) - mean(east.men, 2);
  assert.ok(eastward > camera.figure * 1.2, `a line firing east threw its smoke ${eastward.toFixed(0)} px east of the men`);
  // North and south: the plumes no further east of the men than the musket held at the side of a figure drawn side-on (0.012
  // miles, 22 px here) and a little - where an eastward throw puts them twice that and more.
  for (const [name, one] of [['north', north], ['south', south]]) {
    const sideways = Math.abs(mean(one.smoke, 2) - mean(one.men, 2));
    assert.ok(sideways < camera.figure * 0.95, `a line firing ${name} threw its smoke ${sideways.toFixed(0)} px sideways (east ${eastward.toFixed(0)})`);
  }
  // And up or down the page the way they fire: against the men, the north line's plumes stand well above the south line's.
  const lift = one => mean(one.smoke, 3) - mean(one.men, 3);
  assert.ok(lift(south) - lift(north) > camera.figure * 1.5, `the plumes of a line firing north (${lift(north).toFixed(0)} px) and south (${lift(south).toFixed(0)} px) lie the same way`);
});

test('a gun laid north throws its four puffs north, and a man in a square fires out of his own face', () => {
  // The server sends a gun's shots as they are fired: the shot at the first minute, from then on.
  const gun = { id: 'corner', side: 'texian', x: 0, y: 0, facing: { x: 0, y: -1 }, metal: 'iron', crew: 3 };
  const make = minute => ({ ...firingLine({ x: 1, y: 0 })(minute), sides: firingLine({ x: 1, y: 0 })(minute).sides.map(side => ({ ...side, fire: 'none' })), guns: [{ ...gun, shots: minute >= 1 ? [1] : [] }] });
  const { log, ctx, art } = recorder(), view = createBattleView(art);
  run(view, make, 3, ctx);
  log.length = 0;
  view.draw(ctx, make(3), { camera, time: 3000, now: 3000, tickMs: 1000, bounds });
  const smoke = log.filter(entry => entry[0] === 'puff');
  assert.ok(smoke.length >= 4, `the gun's shot made ${smoke.length} puffs`);
  const at = camera.toScreen(gun);
  assert.ok(Math.abs(mean(smoke, 2) - at.x) < camera.figure * 0.8, `a gun laid north threw its smoke ${(mean(smoke, 2) - at.x).toFixed(0)} px sideways`);
  assert.ok(mean(smoke, 3) < at.y - camera.figure * 2.5, `a gun laid north threw its smoke only ${(at.y - mean(smoke, 3)).toFixed(0)} px up the page`);
  // The square's four faces, in the side's own frame (`slot.out`): facing east, the face to its left is north.
  const close = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-9;
  assert.ok(close(aimOf({ x: 1, y: 0 }, { out: { along: 0, across: -1 } }), { x: 0, y: -1 }) && close(aimOf({ x: 1, y: 0 }, { out: { along: 0, across: 1 } }), { x: 0, y: 1 }) && close(aimOf({ x: 1, y: 0 }, { out: { along: -1, across: 0 } }), { x: -1, y: 0 }), 'a square\'s faces do not fire out of themselves');
  // A family's man standing north of the square's middle fires north, whichever side of the middle he is drawn.
  assert.ok(close(squareAim({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0.02, y: -0.09 }), { x: 0, y: -1 }) && close(squareAim({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: -0.02, y: -0.09 }), { x: 0, y: -1 }), 'a man on the north face of a square fires east or west');
});

test('a named man drawn firing north - Travis at the north battery - makes smoke, and it goes north', () => {
  const travis = { id: 'travis', name: 'William Barret Travis', side: 'texian', art: 'travis', pose: 'fire', x: 0, y: 0, right: true, aimHeading: 'north' };
  const make = minute => ({ ...firingLine({ x: 1, y: 0 })(minute), sides: firingLine({ x: 1, y: 0 })(minute).sides.map(side => ({ ...side, fire: 'none' })), people: [travis] });
  const { log, ctx, art } = recorder(), view = createBattleView(art);
  const shown = run(view, make, 12, ctx);
  assert.ok(shown.smoke > 0, 'a named man drawn firing made no smoke');
  log.length = 0;
  view.draw(ctx, make(12), { camera, time: 12000, now: 12000, tickMs: 1000, bounds });
  const smoke = log.filter(entry => entry[0] === 'puff'), at = camera.toScreen(travis);
  assert.ok(smoke.length, 'no plume in the frame');
  assert.ok(Math.abs(mean(smoke, 2) - at.x) < camera.figure * 0.8, `his smoke went ${(mean(smoke, 2) - at.x).toFixed(0)} px sideways`);
  assert.ok(mean(smoke, 3) < at.y - camera.figure * 1.5, 'his smoke did not go north of him');
});

test('the smoke drifts with the wind and never against it, however light: rising is height, not ground', () => {
  // A breath of wind from the north (blowing south, a fiftieth of a norther): the smoke lying on the field after the firing stops
  // goes south with it. Before, its rising was counted as ground going north, which outran a wind this light.
  const quiet = minute => ({ ...firingLine({ x: 1, y: 0 })(minute), sides: firingLine({ x: 1, y: 0 })(minute).sides.map(side => ({ ...side, fire: 'none' })) });
  const wind = { x: 0, y: 0.02 };
  const { ctx, art } = recorder(), view = createBattleView(art);
  run(view, firingLine({ x: 1, y: 0 }, { drawn: 24 }), 10, ctx, { wind });
  const from = run(view, quiet, 1, ctx, { from: 10000, wind }), to = run(view, quiet, 20, ctx, { from: 11000, wind });
  assert.ok(from.bankCentre && to.bankCentre, 'no smoke lying on the field');
  assert.ok(to.bankCentre.y > from.bankCentre.y, `on a wind blowing south the banks went ${((to.bankCentre.y - from.bankCentre.y) * 5280).toFixed(1)} ft north`);
});

test('a volley\'s wall of smoke lies along the rank, whichever way the rank faces', () => {
  // One man in a rank facing east: his volley's wall is five lobes strung north to south, along the rank, not east to west.
  const lobes = facing => {
    const make = minute => ({ ...firingLine(facing)(minute), sides: [{ side: 'mexican', name: 'mexican', count: 100, drawn: 1, style: 'ranks', fire: 'volley', action: 'stand', moving: false, x: 0, y: 0, facing }, { side: 'texian', name: 'texian', count: 10, drawn: 1, style: 'loose', fire: 'none', action: 'stand', moving: false, x: 3, y: 3, facing: { x: -1, y: 0 } }] });
    const { log, ctx, art } = recorder(), view = createBattleView(art);
    let shown = null;
    for (let t = 0; t < 30000 && !(shown?.smokeWalls >= 1); t += 1000 / 30) { log.length = 0; shown = view.draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds }); }
    assert.ok(shown?.smokeWalls >= 1, 'the rank never laid a wall of smoke');
    const centres = log.filter(entry => entry[0] === 'gradient');
    const spread = i => Math.max(...centres.map(entry => entry[i])) - Math.min(...centres.map(entry => entry[i]));
    return { across: spread(1), down: spread(2) };
  };
  const east = lobes({ x: 1, y: 0 }), north = lobes({ x: 0, y: -1 });
  assert.ok(east.down > east.across * 2, `a rank facing east laid its wall ${east.across.toFixed(0)} px across the page and ${east.down.toFixed(0)} px down it`);
  assert.ok(north.across > north.down * 2, `a rank facing north laid its wall ${north.across.toFixed(0)} px across the page and ${north.down.toFixed(0)} px down it`);
});
