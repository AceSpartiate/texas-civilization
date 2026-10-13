// The painted road, street and path tiles (owner, 2026-10-13: "use our new image generation setup to improve roads";
// public/ground-texture.js, sheet `ground-roads`).
//
// What is held here: while the sheet is missing nothing is laid and every caller draws its old flat colours; once it is here a
// way is laid in its tiles, the flat ones pinned to the world's origin, the rutted road turned to run along each piece of the
// way and carried on from piece to piece; each size of a tile is made once. A recording canvas stands in for the browser's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALONG_TILE, LAYERS, TEXTURES, groundPattern, levelsMade, paveWay, useCanvasMaker, useTextureSource, wayLayers } from '../public/ground-texture.js';

function recorder() {
  const strokes = [], fills = [];
  let path = [];
  const ctx = {
    globalAlpha: 1, strokeStyle: '#000', fillStyle: '#000', lineWidth: 1,
    beginPath() { path = []; }, moveTo(x, y) { path.push(['M', x, y]); }, lineTo(x, y) { path.push(['L', x, y]); },
    bezierCurveTo(...a) { path.push(['C', ...a.slice(-2)]); },
    stroke() { const style = this.strokeStyle; strokes.push({ style, pattern: typeof style === 'object', transform: style?.transform && { ...style.transform }, width: this.lineWidth, alpha: this.globalAlpha, path: [...path] }); },
    fill() { fills.push(this.fillStyle); },
    createPattern(canvas) { return { canvas, transform: null, setTransform(m) { this.transform = { ...m }; } }; },
  };
  return { ctx, strokes, fills };
}
const loaded = () => {
  useCanvasMaker((width, height) => ({ width, height, getContext: () => ({ drawImage() {}, imageSmoothingEnabled: false }) }));
  useTextureSource(name => Object.values(TEXTURES).includes(name) ? { image: { name }, frame: { x: 0, y: 0, w: 512, h: 512 } } : null);
};

test('while the sheet is missing nothing is laid in tiles, and the caller draws its flat colours', () => {
  useTextureSource(() => null);
  const { ctx, strokes } = recorder();
  for (const kind of Object.keys(LAYERS)) {
    assert.equal(wayLayers(ctx, kind, 64, { x: 0, y: 0 }), null, `${kind} has layers without its tiles`);
    assert.equal(paveWay(ctx, kind, [{ x: 0, y: 0 }, { x: 100, y: 0 }], 20), false, `${kind} says it was laid without its tiles`);
  }
  assert.equal(groundPattern(ctx, 'street', 64), null);
  assert.equal(strokes.length, 0, 'something was drawn without the tiles');
});

test('a road is laid in its tiles once they are here: the flat verge and the rutted dirt, widest first', () => {
  loaded();
  const { ctx, strokes } = recorder();
  const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }];
  assert.equal(paveWay(ctx, 'road', points, 20, { tile: 64, anchor: { x: 0, y: 0 } }), true);
  const flat = strokes.filter(s => !s.pattern || s.transform?.b === 0);
  assert.ok(strokes.some(s => s.pattern), 'no tile was laid');
  // The flat layers in their order, then a piece of rutted dirt for each piece of the road.
  const layers = LAYERS.road.filter(([what]) => what !== 'road');
  assert.deepEqual(strokes.slice(0, layers.length).map(s => s.width), layers.map(([, share]) => 20 * share));
  const along = strokes.slice(layers.length);
  assert.equal(along.length, points.length - 1, 'the rutted dirt is not laid piece by piece');
  assert.ok(along.every(s => s.alpha === 1 && s.width === 20 * LAYERS.road.at(-1)[1]), 'a piece of the road is see-through or the wrong width');
  assert.ok(flat.length >= layers.length);
});

test('the rutted dirt runs along each piece, centred on it, and carries on from one piece into the next', () => {
  loaded();
  const { ctx, strokes } = recorder();
  const width = 20, across = width * ALONG_TILE, points = [{ x: 10, y: 10 }, { x: 117, y: 10 }, { x: 117, y: 90 }];
  paveWay(ctx, 'road', points, width, { tile: 64 });
  const pieces = strokes.slice(-2).map(s => s.transform);
  // Where a point of the tile (u across, v along, in the tile's own pixels) is drawn on the screen.
  const at = (m, u, v) => ({ x: m.a * u + m.c * v + m.e, y: m.b * u + m.d * v + m.f });
  const scale = Math.hypot(pieces[0].a, pieces[0].b), mid = across / 2 / scale;
  for (const [i, m] of pieces.entries()) {
    const a = points[i], b = points[i + 1], length = Math.hypot(b.x - a.x, b.y - a.y), dx = (b.x - a.x) / length, dy = (b.y - a.y) / length;
    // Down the tile is along the piece, and across the tile is across it.
    assert.ok(Math.abs(m.c / scale - dx) < 1e-9 && Math.abs(m.d / scale - dy) < 1e-9, `piece ${i} is not turned along the way`);
    assert.ok(Math.abs(m.a * dx + m.b * dy) < 1e-9, `piece ${i}'s tile is not square to the way`);
    // The middle of the tile lies on the middle of the way.
    const middle = at(m, mid, 0), off = (middle.x - a.x) * -dy + (middle.y - a.y) * dx;
    assert.ok(Math.abs(off) < 1e-9, `piece ${i}'s tile is ${off}px off the middle of the way`);
  }
  // The second piece starts as far down the tile as the first one ended: 107px of road, so 107 / across tiles on.
  const along = m => { const u = mid; // solve for v where the tile's middle line meets the piece's start
    const a = points[1], dx = 0, dy = 1; return ((a.x - (m.a * u + m.e)) * dx + (a.y - (m.b * u + m.f)) * dy) / scale; };
  const expected = (107 % across) / scale;
  assert.ok(Math.abs(along(pieces[1]) - expected) < 1e-6, `the second piece starts ${along(pieces[1])} down the tile, not ${expected}: the ruts break at the bend`);
});

test('a flat tile is pinned to the world origin on the screen, so the ground stays put as the map is dragged', () => {
  loaded();
  const { ctx } = recorder();
  const one = groundPattern(ctx, 'street', 100, { x: 1234.4, y: -77 });
  assert.deepEqual([one.transform.e, one.transform.f], [34, 23]);
  const dragged = groundPattern(ctx, 'street', 100, { x: 1234.4 + 40, y: -77 + 15 });
  assert.deepEqual([dragged.transform.e, dragged.transform.f], [74, 38]);
  // On whole pixels: a pattern at a fraction of a pixel is filtered at every pixel it fills (scripts/road-tiles-cost.mjs).
  assert.ok(Number.isInteger(groundPattern(ctx, 'verge', 64, { x: 10.37, y: -3.61 }).transform.e), 'the verge is laid at a fraction of a pixel');
  assert.equal(one.transform.a, 100 / 128, 'a 100px tile is drawn from the 128px level');
});

test('each size of a tile is made once, halving down from the painted 512', () => {
  loaded();
  const { ctx } = recorder();
  for (let i = 0; i < 5; i++) groundPattern(ctx, 'verge', 40, { x: i, y: i });
  const made = levelsMade().filter(key => key.startsWith(TEXTURES.verge));
  assert.deepEqual(made.sort(), ['512', '256', '128', '64'].map(size => `${TEXTURES.verge}@${size}`).sort());
});

// public/landscape-art.js imports the browser's `/art.js` and cannot be loaded here (tests/ferry-art.test.mjs): its callers
// are read instead, for the one thing that matters - each lays the tiles and falls back to its old flat strokes without them.
test('the road, the streets and a family\'s paths are laid in the tiles, and drawn as before without them', () => {
  const art = readFileSync(new URL('../public/landscape-art.js', import.meta.url), 'utf8');
  const road = art.slice(art.indexOf('export function drawRoad'), art.indexOf('export function drawStreets'));
  assert.match(road, /const painted=paveWay\(ctx,'road',/);
  assert.match(road, /if\(!painted\)\{stroke\(ctx,points,'#ac9f71'/, 'drawRoad does not fall back to its flat strokes');
  const streets = art.slice(art.indexOf('export function drawStreets'), art.indexOf('export function crossingAngle'));
  assert.match(streets, /wayLayers\(ctx,'street',tile,anchor\)/);
  assert.match(streets, /else for\(const layer of \[\['#ac9f71',1\.55\],\['#c2ac7d',1\.2\],\['#d1bc8f',1\]\]/, 'drawStreets does not fall back to its flat colours');
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const paths = app.slice(app.indexOf('function drawLandPaths('), app.indexOf('function drawYardFence('));
  assert.match(paths, /textured = paveWay\(ctx, 'path', line, width, \{ tile, anchor \}\);\s*if \(!textured\) \{/, 'drawLandPaths does not fall back to its flat strokes');
  assert.match(app, /drawRoad\(ctx,worn,width,\{tile:roadTile,anchor:worldOrigin\}\)/, 'the map\'s roads are not pinned to the world');
});

test('every tile the roads ask for is a measured, whole, square frame of the delivered sheet', () => {
  const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
  for (const name of Object.values(TEXTURES)) {
    const frame = atlas.frames[name];
    assert.ok(frame, `${name} is not in the art library`);
    assert.equal(frame.sheet, 'ground-roads', `${name} is not on the road tiles' sheet`);
    // The painted pixels with no clear padding (public/art.js `spriteImage` reads these): a padded tile draws a seam round every repeat.
    const [, , w, h] = frame.audit.sourceBounds;
    assert.deepEqual([w, h], [512, 512], `${name} is not a whole 512 tile`);
    assert.equal(frame.audit.visiblePixels, w * h, `${name} has clear pixels inside it`);
  }
});
