// The fight seen (owner, 2026-10-27: "it was kind of hard to see the battles"; docs/BATTLES.md §17.2). Presentation only: what the
// camera frames and how the men read through their own smoke. The panels stepping out of the way while the film has the camera
// are held by the browser proof (scripts/battle-cinema-browser-proof.mjs), which needs a page. Each test here was seen failing
// under the regression it guards (scripts/battle-see-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';
import { fieldFrame, fightingPoints } from '../public/battle-frame.js';

const side = (name, x, y, extra = {}) => ({ side: name, name, count: 100, drawn: 12, style: 'ranks', fire: 'none', action: 'stand', moving: false, x, y, facing: { x: 1, y: 0 }, ...extra });
const span = points => { const framed = fieldFrame(points), xs = framed.map(p => p.x), ys = framed.map(p => p.y); return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };

test('the camera frames where the fighting is: a body standing silent far off is left out, the men being fired at are kept', () => {
  // Coleto at dawn (sim/battles/coleto.mjs): the square, the Mexican guns firing from the timber a quarter mile in front, a company
  // standing with them, and the cavalry and two more companies ringing the square a third of a mile out and more, silent.
  const square = side('texian', 0, 0, { style: 'square', fire: 'volley' });
  const fight = {
    minute: 600, sides: [square, side('mexican', 0.34, 0)],
    groups: [{ ...side('mexican', 0.02, 0.36), id: 'left' }, { ...side('mexican', -0.02, -0.36), id: 'right' }, { ...side('mexican', -0.42, 0, { style: 'mounted' }), id: 'rear' }],
    // The battery firing on it, and the square's own corner guns a tenth of a mile out from its middle, one of them lately.
    guns: [{ id: 'battery-1', side: 'mexican', x: 0.26, y: 0.02, shots: [592, 597] }, { id: 'corner-fl', side: 'texian', x: 0.11, y: 0.11, shots: [595] }, { id: 'corner-bl', side: 'texian', x: -0.11, y: 0.11, shots: [] }],
  };
  const points = fightingPoints(fight);
  const has = (x, y) => points.some(point => Math.abs(point.x - x) < 1e-9 && Math.abs(point.y - y) < 1e-9);
  assert.ok(has(0, 0) && has(0.26, 0.02) && has(0.34, 0), `the square, the guns firing on it and the company beside them are not all framed: ${JSON.stringify(points)}`);
  assert.ok(!has(0.02, 0.36) && !has(-0.42, 0), `the silent ring a third of a mile out is framed with them: ${JSON.stringify(points)}`);
  const all = span([square, ...fight.sides.slice(1), ...fight.groups, ...fight.guns]), now = span(points);
  assert.ok(now.w * now.h < all.w * all.h * 0.6, `the frame is hardly closer: ${now.w.toFixed(2)}x${now.h.toFixed(2)} against ${all.w.toFixed(2)}x${all.h.toFixed(2)} miles`);
  // Gonzales: the Texians firing, the dragoons they fire on standing a fifth of a mile off - both framed.
  const gonzales = fightingPoints({ minute: 10, sides: [side('texian', 0, 0, { style: 'loose', fire: 'scattered' }), side('mexican', 0.2, -0.05, { style: 'mounted' })] });
  assert.equal(gonzales.length, 2, 'the men being fired on are left out of the frame');
  // In a lull - nobody firing, nobody moving, no gun lately - everybody, as before.
  assert.equal(fightingPoints({ ...fight, minute: 900, sides: [{ ...square, fire: 'none' }, fight.sides[1]] }).length, 8, 'a lull is not framed whole');
  // A frame the engagement names is taken as it is.
  assert.deepEqual(fightingPoints({ ...fight, frame: [{ x: 1, y: 2 }] }), [{ x: 1, y: 2 }]);
});

/** A canvas the battle can draw its smoke layer into, recording what is stamped out of it. */
function fakeDocument() {
  const stamps = [];
  const context = () => new Proxy({ globalAlpha: 1, globalCompositeOperation: 'source-over' }, {
    get(target, key) {
      if (key === 'drawImage') return (image, x, y, w, h) => { if (target.globalCompositeOperation === 'destination-out' && image?.isHole) stamps.push({ x: x + w / 2, y: y + h / 2, alpha: target.globalAlpha }); };
      if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
      return key in target ? target[key] : () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  let made = 0;
  return { stamps, document: { createElement: () => { const canvas = { width: 0, height: 0, isHole: made++ > 0, ctx: null, getContext() { return this.ctx ||= context(); } }; return canvas; } } };
}
function recorder() {
  const log = [];
  const ctx = new Proxy({ globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
  const art = { animated: (c, clip, x, y, size) => { log.push(['figure', clip, x, y, size]); return 30; }, drawSprite: (c, sprite, x, y, size, options) => { log.push([/^smoke-/.test(sprite) ? 'puff' : 'figure', sprite, x, y, size, options?.alpha ?? 1]); return size; }, miniPerson: () => {} };
  return { log, ctx, art };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
const fightOf = minute => ({ id: 'seen', phase: 'fight', minute, caption: 'x', live: true, over: false, lines: [], fallen: [], members: [], commands: null, formations: [],
  sides: [side('texian', -0.08, 0, { style: 'loose', fire: 'scattered', drawn: 20, spread: { width: 0.2, depth: 0.08 } }), side('mexican', 0.1, 0, { fire: 'volley', drawn: 20, facing: { x: -1, y: 0 } })] });

test('every man in the fight is seen through its smoke: the banks thinned round each of them, a fresh plume over a man drawn thinner', () => {
  const { stamps, document } = fakeDocument();
  globalThis.document = document;
  try {
    const { log, ctx, art } = recorder(), view = createBattleView(art);
    let shown = null;
    for (let t = 0; t < 40000; t += 1000 / 30) { log.length = 0; stamps.length = 0; shown = view.draw(ctx, fightOf(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds }); }
    const men = log.filter(entry => entry[0] === 'figure' && /^(volunteer|regular)/.test(entry[1]));
    assert.ok(shown.banksInView > 5 && shown.cover >= 0.85, `the fight did not build its smoke: ${shown.banksInView} banks, cover ${shown.cover}`);
    assert.ok(men.length >= 30, `only ${men.length} men drawn`);
    // Every man drawn has the smoke thinned at him: a stamp at his middle, at the layer's third of the screen.
    assert.equal(shown.menThinned, men.length, `the smoke was thinned round ${shown.menThinned} of the ${men.length} men drawn`);
    const ratio = Math.ceil(bounds.width / 3) / bounds.width;
    const unmatched = men.filter(man => !stamps.some(stamp => Math.abs(stamp.x / ratio - man[2]) < 2 / ratio && Math.abs(stamp.y / ratio - (man[3] - man[4] * 0.5)) < man[4] * 0.6));
    assert.equal(unmatched.length, 0, `${unmatched.length} men with no clearing at them`);
    assert.ok(stamps.every(stamp => stamp.alpha > 0.4 && stamp.alpha < 0.8), 'the smoke is taken away wholly, or hardly at all, at a man');
    // A plume drawn over a man is thinner than one over open ground.
    assert.ok(shown.puffsThinned > 0, 'no plume over a man was drawn thinner');
  } finally { delete globalThis.document; }
});
