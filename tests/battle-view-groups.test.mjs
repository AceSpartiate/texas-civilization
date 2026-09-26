// What the renderer (public/battle-view.js) gained for Concepción and the Grass Fight, on a canvas that records what is drawn:
// a group of a side drawn apart from it (Bowie's companies, Coleman's men, Jack's infantry, the sortie); men under a bank
// dropping to load and climbing to fire; fog over the field; the fallen lying where they fell while their side moves off; a
// family's person drawn at their own fate - hit, lying still, carried, or running; the pack train; the gun served by its own
// side and left where it was taken; the ground the map does not draw. scripts/battle-1835-browser-proof.mjs holds the same on
// a real page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity } from '../public/battle-view.js';
import { ENGAGEMENTS } from '../sim/battle-stage.mjs';

function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  return new Proxy({ calls, globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: (...args) => { calls.push(['createRadialGradient', ...args]); return { addColorStop() {} }; } }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
}
function fakeArt() {
  const drawn = [];
  return {
    drawn,
    animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, size, seed, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, x, y, size, ...options }); return size; },
    miniPerson: () => {},
  };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 60, drawn: 40, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'groups', phase: 'fight', minute, caption: 'x', live: true, over: false,
  sides: [side('texian', 'bank', 'scattered', -0.1, { drawn: 26, spread: { width: 0.22, depth: 0.06 } }), side('mexican', 'ranks', 'volley', 0.12),
    side('texian', 'loose', 'scattered', -0.1, { group: 'coleman', drawn: 5, y: -0.12, spread: { width: 0.09, depth: 0.05 } }),
    side('mexican', 'mounted', 'none', 0.2, { group: 'cavalry', drawn: 20, y: -0.1 })],
  lines: [], fallen: [], members: [], commands: null, formations: [], ...over,
});
const frame = (view, b, t) => view.draw(fakeContext(), b, { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
function run(view, make, seconds, from = 0) { let last = null; for (let t = from; t < from + seconds * 1000; t += 1000 / 30) last = frame(view, make(Math.floor(t / 1000)), t); return last; }

test('a group of a side is drawn apart from it, keyed by its own name: its own count, its own place, and its words from among its own men', () => {
  const art = fakeArt(), view = createBattleView(art);
  const line = { id: 'g1', text: 'Charge!', side: 'texian', group: 'coleman', role: 'volunteer', kind: 'reconstructed', minute: 0 };
  const shown = run(view, minute => battle(minute, { lines: [line] }), 3);
  assert.deepEqual(shown.groups, { texian: 26, mexican: 40, coleman: 5, cavalry: 20 });
  assert.equal(shown.figures.texian, 31, 'the group was not counted with its side');
  // Coleman's ten stand round their own place, a twelfth of a mile north of Fannin's.
  const colemanSeeds = art.drawn.filter(one => String(one.seed || '').startsWith('texian:coleman:'));
  assert.ok(colemanSeeds.length > 0 && colemanSeeds.every(one => one.y < 384 - 0.12 * 1800 + 60), 'the group is not drawn at its own place');
  assert.ok(shown.linesShown.includes('g1'));
  // The cavalry are horsemen, the main Mexican body foot soldiers in ranks.
  assert.ok(art.drawn.some(one => /^dragoon/.test(one.clip || one.sprite || '')), 'the cavalry were not drawn mounted');
  assert.ok(shown.regularityBy.mexican < 0.08, `the infantry do not stand in ranks: ${shown.regularityBy.mexican}`);
});

test('men under a bank drop below the lip to load and climb to fire; fog lies over the field at the phase\'s density and is gone when it lifts', () => {
  const art = fakeArt(), view = createBattleView(art);
  run(view, minute => battle(minute, { fog: 0.8 }), 12);
  const loading = art.drawn.filter(one => one.sprite === 'volunteer-load'), firing = art.drawn.filter(one => one.clip === 'volunteer-fire-reload');
  assert.ok(loading.length && firing.length, 'nobody under the bank was drawn loading and firing');
  const meanY = list => list.reduce((s, one) => s + one.y, 0) / list.length;
  assert.ok(meanY(loading) - meanY(firing) > 5, `the loading men are not drawn below the firing men: ${meanY(loading).toFixed(1)} against ${meanY(firing).toFixed(1)}`);
  const foggy = frame(createBattleView(fakeArt()), battle(0, { fog: 0.8 }), 0);
  assert.equal(foggy.fog, 0.8);
  const clear = frame(createBattleView(fakeArt()), battle(0), 0);
  assert.equal(clear.fog, 0, 'fog drawn on a clear morning');
});

test('a man who fell lies where he fell while his side moves off, and one who fell in a group that has left the field is still there', () => {
  const view = createBattleView(fakeArt());
  const fallen = [{ side: 'mexican', count: 3, minute: 2, carried: false }, { side: 'texian', group: 'coleman', count: 1, minute: 2, carried: true }];
  // The Mexican line falls back a tenth of a mile from minute 6; Coleman's men leave the field at minute 7.
  const make = minute => battle(minute, {
    fallen: minute >= 2 ? fallen : [],
    sides: [side('texian', 'bank', 'scattered', -0.1, { drawn: 26, spread: { width: 0.22, depth: 0.06 } }), side('mexican', 'ranks', 'volley', minute >= 6 ? 0.22 : 0.12),
      ...(minute < 7 ? [side('texian', 'loose', 'scattered', -0.1, { group: 'coleman', drawn: 5, y: -0.12, spread: { width: 0.09, depth: 0.05 } })] : [])],
  });
  const art = fakeArt(), again = createBattleView(art);
  run(again, make, 5.5);
  const before = art.drawn.filter(one => one.sprite === 'regular-reclining').slice(-3).map(one => one.x);
  art.drawn.length = 0;
  const later = run(again, make, 6, 5500);
  const after = art.drawn.filter(one => one.sprite === 'regular-reclining').slice(-3).map(one => one.x);
  assert.equal(later.fallen, 4, `the four who fell are not all drawn: ${later.fallen}`);
  assert.deepEqual(after.map(Math.round), before.map(Math.round), 'the fallen moved with their side');
  assert.ok(art.drawn.some(one => one.sprite === 'volunteer-reclining'), 'the man who fell with Coleman\'s men vanished when they left');
  void view;
});

test('a family\'s person is drawn at their own fate: hit, then lying still and carried, or sitting hurt, or running from the field', () => {
  const art = fakeArt(), view = createBattleView(art);
  const make = (minute, fates) => battle(minute, { members: ['p-killed', 'p-hurt', 'p-ran', 'p-well'], memberFates: fates, memberGroups: { 'p-ran': 'coleman' } });
  const fates = [{ id: 'p-killed', fate: 'killed', minute: 3, carried: true }, { id: 'p-hurt', fate: 'wounded', minute: 3 }, { id: 'p-ran', fate: 'ran', minute: 3 }];
  let seen = null;
  for (let t = 0; t < 8000; t += 1000 / 30) {
    const minute = Math.floor(t / 1000);
    for (const id of ['p-killed', 'p-hurt', 'p-ran', 'p-well']) view.memberDrawn(id, { x: -0.1, y: 0.01 }, 30);
    seen = frame(view, make(minute, minute >= 3 ? fates : []), t);
  }
  const pose = id => { const one = view.memberPose({ id }, 8000); return one.sprite || one.clip; };
  assert.equal(pose('p-killed'), 'volunteer-reclining');
  assert.equal(pose('p-hurt'), 'volunteer-injured');
  assert.equal(pose('p-ran'), 'volunteer-march');
  assert.notEqual(pose('p-well'), 'volunteer-reclining');
  assert.deepEqual(seen.memberFates.map(one => one.fate).sort(), ['killed', 'ran', 'wounded']);
  assert.ok(art.drawn.some(one => String(one.seed || '').startsWith('carry:p-killed')), 'nobody carried the man who was killed');
  // Before the fate falls, nothing of it: the same person fires with the men.
  const early = createBattleView(fakeArt());
  const poses = new Set();
  for (let t = 0; t < 12000; t += 1000 / 30) { early.memberDrawn('p-killed', { x: -0.1, y: 0 }, 30); frame(early, make(0, []), t); const one = early.memberPose({ id: 'p-killed' }, t); poses.add(one.clip || one.sprite); }
  assert.ok(poses.has('volunteer-fire-reload') && !poses.has('volunteer-reclining'), `before his fate he was drawn ${[...poses]}`);
});

test('the pack train is drawn as horses under packs, the gun is served by its own side and stays where it was taken, and the ground the map lacks is drawn', () => {
  const art = fakeArt(), view = createBattleView(art);
  const train = side('mexican', 'column', 'none', 0.3, { group: 'train', figure: 'packhorse', drawn: 8, moving: true, action: 'advance' });
  const scenery = [{ water: [{ x: -0.2, y: -0.1 }, { x: -0.22, y: 0 }, { x: -0.2, y: 0.1 }], width: 0.03 }, { sprite: 'earth-rampart', x: -0.08, y: 0, size: 1.3 }, { clip: 'pecan-large-wind', x: -0.25, y: 0, size: 3 }];
  const cannon = { side: 'mexican', x: 0.08, y: 0.02, shots: [1], crew: 3, metal: 'bronze' };
  const shown = run(view, minute => battle(minute, { sides: [...battle(minute).sides, train], cannon, scenery }), 4);
  assert.ok(art.drawn.some(one => one.clip === 'horse-walk') && art.drawn.some(one => one.sprite === 'packed-belongings'), 'the pack train is not horses under packs');
  assert.ok(art.drawn.some(one => /^regular-gun-/.test(one.clip || '')), 'the Mexican gun was served by volunteers');
  assert.equal(shown.scenery, 3);
  assert.ok(art.drawn.some(one => one.sprite === 'earth-rampart') && art.drawn.some(one => one.clip === 'pecan-large-wind'), 'the bank and the trees were not drawn');
  // Taken and turned: a fixed gun does not follow its takers as they move.
  const fixedArt = fakeArt(), fixedView = createBattleView(fixedArt);
  const turned = minute => battle(minute, { sides: [side('texian', 'loose', 'scattered', minute >= 2 ? 0.05 : -0.1), side('mexican', 'rout', 'none', 0.4)], cannon: { side: 'texian', x: 0.05, y: 0.04, shots: [], crew: 3, metal: 'bronze', fixed: true } });
  const at = [];
  for (let t = 0; t < 4000; t += 1000 / 30) at.push(frame(fixedView, turned(Math.floor(t / 1000)), t).cannon.x);
  assert.equal(Math.min(...at), Math.max(...at), 'the gun taken at Concepción moved with the men who took it');
  assert.ok(fixedArt.drawn.some(one => /^volunteer-gun-/.test(one.clip || '')), 'the taken gun is not served by its takers');
  assert.ok(regularity([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]) === 0);
});

test('every body of men at Concepción and the Grass Fight is laid out whole: no sample is drawn short because its ground is too small for it', () => {
  const short = [];
  for (const id of ['concepcion', 'grass-fight']) {
    const def = ENGAGEMENTS[id];
    for (const phase of def.phases) {
      for (const name of ['texian', 'mexican']) {
        const at = phase[name], info = def.sides[name];
        if (at.action === 'gone') continue;
        const laid = layoutSide({ side: name, drawn: info.drawn, style: at.style, spread: at.spread || info.spread }).length;
        if (laid < info.drawn) short.push(`${id} ${phase.id} ${name}: ${laid} of ${info.drawn}`);
      }
      for (const group of phase.groups || []) {
        const laid = layoutSide({ side: group.side, group: group.key, drawn: group.drawn, style: group.style, spread: group.spread }).length;
        if (laid < group.drawn) short.push(`${id} ${phase.id} ${group.key}: ${laid} of ${group.drawn}`);
      }
    }
  }
  assert.deepEqual(short, []);
});
