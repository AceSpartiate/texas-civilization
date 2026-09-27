// The famous people on the campaign map are drawn from their own art (owner, 2026-09-27: "Fix it and re-measure"). Until then
// public/app.js handed `drawFamous` wrappers that took the clip first while public/famous-view.js calls them canvas first, so
// every one of them fell through to the generic mini figure. app.js cannot be loaded outside a browser, so the options it passes
// are read out of its source and built here with the page's own signatures standing behind them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawFamous, famousArt } from '../public/famous-view.js';

const APP = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

/** A 2D context that draws nothing. */
function fakeContext() {
  return new Proxy({ measureText: text => ({ width: String(text).length * 6 }) }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
}

/** The options object app.js passes `drawFamous`, built over stand-ins for the page's functions with the page's signatures. */
function pageOptions(ctx) {
  const call = APP.match(/drawFamous\(ctx, world\.famous, camera, (\{[\s\S]*?\n {2}\})\);/);
  assert.ok(call, 'public/app.js no longer calls drawFamous(ctx, world.famous, camera, {...}) where this test looks for it');
  const drawn = [];
  // The page's own: app.js `animated(ctx, clip, x, y, size, seed, options)`, public/art.js `drawSprite(ctx, name, x, y, height,
  // options)` and app.js `miniPerson(ctx, x, y, size, entity)`. Each draws only for a canvas and a name.
  const animated = (c, clip, x, y, size) => (c === ctx && typeof clip === 'string' && Number.isFinite(x) ? (drawn.push({ clip }), size) : 0);
  const drawSprite = (c, name, x, y, size) => (c === ctx && typeof name === 'string' && Number.isFinite(x) ? (drawn.push({ sprite: name }), size) : 0);
  const miniPerson = () => { drawn.push({ mini: true }); };
  const build = new Function('ctx', 'animated', 'drawSprite', 'miniPerson', 'animationTime', 'canvas', `return (${call[1]});`);
  return { options: build(ctx, animated, drawSprite, miniPerson, 0, { width: 1366, height: 768 }), drawn };
}

const camera = { figure: 24, toScreen: one => ({ x: one.x, y: one.y }) };
const TRAVIS = { id: 'travis', name: 'Travis', side: 'texian', art: 'travis', x: 400, y: 300, doing: 'stand', moving: false, right: true };

test('app.js hands drawFamous the page\'s own drawing functions, so a famous person on the map is drawn from their own art', () => {
  const ctx = fakeContext();
  const { options, drawn } = pageOptions(ctx);
  const standing = drawFamous(ctx, [TRAVIS], camera, options);
  assert.equal(standing[0].how, 'travis-idle', `Travis standing on the map was drawn as ${standing[0].how}`);
  const walking = drawFamous(ctx, [{ ...TRAVIS, moving: true }], camera, options);
  assert.equal(walking[0].how, 'travis-walk-e', `Travis walking on the map was drawn as ${walking[0].how}`);
  const riding = drawFamous(ctx, [{ id: 'houston', name: 'Houston', side: 'texian', art: 'houston', x: 200, y: 200, doing: 'ride', moving: false, right: true }], camera, options);
  assert.equal(riding[0].how, 'houston-mounted-idle-e');
  assert.ok(!drawn.some(one => one.mini), 'a famous person fell through to the mini figure');
});

test('what the page asks for when a famous person is sent is what drawFamous will draw them with', () => {
  assert.deepEqual(famousArt(TRAVIS), { sprites: ['travis-idle'], clips: ['travis-walk-e', 'volunteer-march', 'volunteer-idle-e', 'volunteer-idle-w'] });
  const houston = famousArt({ art: 'houston', side: 'texian', doing: 'ride' });
  assert.deepEqual(houston, { sprites: ['houston-mounted-idle-e'], clips: ['houston-mounted-walk-e', 'mounted-courier-e'] });
  assert.deepEqual(famousArt({ thing: true }), { sprites: ['cannon-iron-e'], clips: [] });
  // A stand-in with no sheet of its own asks only for the clips it is drawn with.
  assert.deepEqual(famousArt({ art: 'woman', side: 'texian', doing: 'stand' }).clips.slice(0, 2), ['indigo-walk', 'indigo-idle-e']);
});
