// Area D's Claude-drawn stand-ins (docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)"), as the battle view
// draws them: each is drawn only once `clipReady` says its sheet can be (the one gate every Claude clip goes through, as
// public/app.js `drawnClipOf` and `drawSeated` use it), and the older stand-in is drawn until then. On a canvas that records
// what is drawn, like tests/battle-view-groups.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBattleView } from '../public/battle-view.js';

const claude = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/claude-standins/atlas.json', import.meta.url)), 'utf8')).clips;
function fakeContext() {
  const noop = () => () => {};
  return new Proxy({ globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
}
/** `ready`: whether Claude's sheets have arrived. The library's own clips are always drawable here. */
function fakeArt(ready) {
  const drawn = [];
  return {
    drawn,
    clipReady: name => ready && claude[name]?.madeBy === 'claude',
    animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, size, seed, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, size, ...options }); return size; },
    miniPerson: () => {},
  };
}
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 30, drawn: 10, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const group = (id, name, style, fire, x, extra = {}) => ({ id, ...side(name, style, fire, x, extra) });
const battle = groups => ({ id: 'transport', phase: 'fight', minute: 0, caption: 'x', live: true, over: false,
  sides: [side('texian', 'loose', 'none', -0.2), side('mexican', 'ranks', 'none', 0.2)], groups, lines: [], fallen: [], members: [], commands: null, formations: [] });
function run(art, groups) {
  const view = createBattleView(art);
  for (let t = 0; t < 3000; t += 1000 / 30) view.draw(fakeContext(), battle(groups), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
  return art.drawn;
}
const GROUPS = [
  group('train', 'mexican', 'column', 'none', 0.3, { figure: 'packhorse', drawn: 4, moving: true, action: 'advance', y: 0.1 }),
  group('lancers-east', 'mexican', 'mounted', 'none', 0.25, { name: 'Ramírez y Sesma’s lancers', mounted: true, drawn: 4, y: -0.1 }),
  group('horse', 'texian', 'mounted', 'none', -0.25, { mounted: true, drawn: 4, y: -0.1, moving: true, action: 'advance' }),
];

// The Grass Fight's pack mules and the lancers' charge are Astra's since 2026-10-03 (Claude's of the same names deleted when they
// were merged); a Texian horseman is still Claude's.
test('with Claude\'s sheets loaded: a Texian horseman is the volunteer mounted', () => {
  const drawn = run(fakeArt(true), GROUPS);
  const clips = new Set(drawn.map(one => one.clip).filter(Boolean));
  assert.ok(clips.has('volunteer-mounted'), `the Texian horsemen: ${[...clips].join(', ')}`);
  assert.equal(claude['volunteer-mounted']?.madeBy, 'claude', 'volunteer-mounted is not Claude\'s');
  assert.ok(!claude['mule-packed-grass-walk-e'] && !claude['lancer-charge'], 'a Claude frame of Astra\'s mules or lancers is still in the library');
});

test('until they are loaded, the older stand-ins: horses under packs, the dragoons without lances, the mounted courier', () => {
  const drawn = run(fakeArt(false), GROUPS);
  const clips = new Set(drawn.map(one => one.clip).filter(Boolean));
  assert.ok(clips.has('horse-walk') && drawn.some(one => one.sprite === 'packed-belongings'), 'the pack train is not horses under packs');
  assert.ok(![...clips].some(clip => claude[clip]), `a Claude clip was drawn before its sheet could be: ${[...clips].filter(clip => claude[clip]).join(', ')}`);
  assert.ok(clips.has('mounted-courier-e'), 'the Texian horsemen are not the mounted courier');
});
