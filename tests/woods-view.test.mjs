// The woods on the family's map: docs/WOODS_AND_BUILDING.md §4.3, build step 2.
//
// The server hands the woods over a tile at a time - a shade of timber by the mile, the patches by the mile, every tree
// by the quarter mile - worked out from the same woods the simulation walks and clears in, and only for a class that
// reads its woods from the land. The page's woods module (public/woods-view.js) asks for what its view needs, and reads
// timber and trees back out of exactly what it was sent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { landAround } from '../sim/ground.mjs';
import { KINDS, patchAt, patchCover, treesIn } from '../sim/woods.mjs';
import { WOODS_TILE_MILES, landTilesKept, woodsCatalogue, woodsTile, woodsTiles } from '../sim/woods-view.mjs';
import { WOODS_BATCH_MAX, createClassroom } from '../server/app.mjs';
import { BATCH, ensureWoods, timberAt, treesInView, treesVisible, woodsShown } from '../public/woods-view.js';

const land = landAround();
const woods = { rule: 'biomes', nearCreek: land.nearCreek };
const colonies = createGonzalesWorld('woods-view', 5, { map: 'colonies' });
const home = colonies.map.sites[colonies.households['hh-1'].homeSiteId];

test('each tile is the woods themselves: the trees in it, its patches and its shade of timber', () => {
  const size = WOODS_TILE_MILES.trees, tx = Math.floor(home.x / size), ty = Math.floor(home.y / size);
  const trees = woodsTile(colonies, 'trees', tx, ty);
  const expected = treesIn({ minX: tx * size, minY: ty * size, maxX: tx * size + size, maxY: ty * size + size }, woods);
  const kinds = woodsCatalogue().kinds.map(kind => kind.id);
  assert.deepEqual(trees.trees, expected.map(tree => [tree.x, tree.y, kinds.indexOf(tree.kind), ['pole', 'log', 'large'].indexOf(tree.size)]));
  // A tree on the shared edge of two tiles is in one of them, never both.
  const right = woodsTile(colonies, 'trees', tx + 1, ty).trees.map(([x, y]) => `${x},${y}`);
  assert.ok(!trees.trees.some(([x, y]) => right.includes(`${x},${y}`)));

  const patches = woodsTile(colonies, 'patches', Math.floor(home.x), Math.floor(home.y));
  assert.equal(patches.cells.length, 256);
  for (let i = 0; i < 256; i += 7) {
    const point = { x: Math.floor(home.x) + ((i % 16) + 0.5) / 16, y: Math.floor(home.y) + (Math.floor(i / 16) + 0.5) / 16 };
    assert.equal(patches.cells[i], patchCover(patchAt(point, woods))[0], `patch ${i}`);
  }
  const shade = woodsTile(colonies, 'shade', Math.floor(home.x / 8), Math.floor(home.y / 8));
  assert.match(shade.cells, /^[0-9]{64}$/);
  // A mile the patches call all timber is shaded 9, and one with none 0.
  const tile = { tx: Math.floor(home.x / 8), ty: Math.floor(home.y / 8) };
  for (let cell = 0; cell < 64; cell += 9) {
    const x = tile.tx * 8 + (cell % 8), y = tile.ty * 8 + Math.floor(cell / 8);
    let timber = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (patchCover(patchAt({ x: x + (i + 0.5) / 4, y: y + (j + 0.5) / 4 }, woods)) === 'timber') timber++;
    assert.equal(Number(shade.cells[cell]), Math.round(9 * timber / 16), `mile ${cell}`);
  }
  // Nothing for a class that does not read its woods from the land, nor for a tile that is not one.
  assert.equal(woodsTile(createGonzalesWorld('woods-view-invented', 5), 'trees', tx, ty), null);
  const saved = structuredClone(colonies); delete saved.map.woods;
  assert.equal(woodsTile(saved, 'patches', 0, 0), null);
  assert.equal(woodsTile(colonies, 'forest', 0, 0), null);
  assert.equal(woodsTile(colonies, 'trees', 0.5, 0), null);
  // Every kind names a picture the art library has.
  const frames = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8')).frames;
  const names = new Set(Array.isArray(frames) ? frames.map(frame => frame.id || frame.name) : Object.keys(frames));
  assert.deepEqual(Object.fromEntries(['loblolly','shortleaf','cedar','mesquite','live-oak','elm'].map(id => [id,KINDS[id].picture])), {
    loblolly:'pine-loblolly', shortleaf:'pine-loblolly', cedar:'cedar', mesquite:'mesquite', 'live-oak':'live-oak', elm:'elm',
  }, 'delivered tree kinds stay bound to their species-specific art');
  for (const [id, kind] of Object.entries(KINDS)) {
    const deliveredSizes = ['pine-loblolly', 'cedar', 'mesquite', 'live-oak', 'elm'].includes(kind.picture);
    if (deliveredSizes) for (const sizeName of ['pole','log','large']) assert.ok(names.has(`${kind.picture}-${sizeName}`), `${id} has ${sizeName} art`);
    else assert.ok(names.has(kind.picture), `${id} is drawn as ${kind.picture}, which the library has`);
  }
});

test("the page asks for its view's tiles and reads timber and trees out of what it was sent", async () => {
  const requests = [];
  let calls = 0;
  const realFetch = globalThis.fetch;
  // Answered as the server answers `/api/woods?level=&tiles=tx,ty;...`: one entry in `requests` per tile, one call per request.
  globalThis.fetch = async path => {
    const url = new URL(path, 'http://page');
    calls++;
    const pairs = url.searchParams.get('tiles').split(';').map(pair => pair.split(',').map(Number));
    for (const _ of pairs) requests.push(url.searchParams.get('level'));
    const tiles = woodsTiles(colonies, url.searchParams.get('level'), pairs);
    return { ok: tiles.some(Boolean), json: async () => ({ tiles }) };
  };
  // Put back however the test ends, or a failure here would leave every later test fetching from this stand-in.
  try {
  const catalogue = woodsCatalogue();
  const canvas = { width: 1000, height: 600 };
  const cameraAt = scale => ({ scale, toWorld: s => ({ x: home.x + (s.x - canvas.width / 2) / scale, y: home.y + (s.y - canvas.height / 2) / scale }), toScreen: p => ({ x: canvas.width / 2 + (p.x - home.x) * scale, y: canvas.height / 2 + (p.y - home.y) * scale }) });
  const settle = () => new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(woodsShown(colonies), true);
  assert.equal(woodsShown(createGonzalesWorld('woods-view-page', 5)), false);

  // Middle distance, a few miles across: the patches, and timber read out of them exactly as the server has it.
  const middle = cameraAt(300);
  assert.equal(treesInView(middle, canvas), false);
  for (let round = 0; round < 6; round++) { ensureWoods(colonies, middle, canvas, 'class-1', catalogue, () => {}); await settle(); }
  assert.ok(requests.length > 0 && requests.every(level => level === 'patches'), requests.join());
  // Asked for in batches (2026-09-17): a view's tiles in a request or two, not a request each.
  // At least sixteen tiles a request: counted against a number, not `BATCH`, so shrinking the batch fails here.
  assert.ok(calls <= Math.ceil(requests.length / 16), `${requests.length} tiles took ${calls} requests (batches of ${BATCH})`);
  assert.ok(requests.length > 6, 'the view needed too few tiles to show batching');
  for (let i = 0; i < 40; i++) {
    const point = { x: home.x - 1.5 + (i % 8) * 0.37, y: home.y - 0.9 + Math.floor(i / 8) * 0.37 };
    assert.equal(timberAt(point.x, point.y, catalogue.tiles.patches), patchCover(patchAt(point, woods)) === 'timber', `timber at ${point.x},${point.y}`);
  }
  // Close up: every tree the server has in view, back to front, with its kind.
  requests.length = 0;
  const close = cameraAt(2200);
  assert.equal(treesInView(close, canvas), true);
  for (let round = 0; round < 4; round++) { ensureWoods(colonies, close, canvas, 'class-1', catalogue, () => {}); await settle(); }
  assert.ok(requests.length > 0 && requests.every(level => level === 'trees'));
  const seen = treesVisible(close, canvas, catalogue);
  const a = close.toWorld({ x: 0, y: 0 }), b = close.toWorld({ x: canvas.width, y: canvas.height }), pad = (b.x - a.x) * 0.05;
  const server = treesIn({ minX: a.x - pad, minY: a.y - pad, maxX: b.x + pad, maxY: b.y + pad }, woods);
  assert.equal(seen.length, server.length);
  assert.deepEqual(seen.map(tree => tree.y), [...seen.map(tree => tree.y)].sort((p, q) => p - q), 'back to front');
  assert.ok(seen.every(tree => KINDS[tree.kind.id] && tree.kind.picture === KINDS[tree.kind.id].picture));
  // A tile already fetched is never fetched again, and a new class starts afresh.
  requests.length = 0;
  ensureWoods(colonies, close, canvas, 'class-1', catalogue, () => {}); await settle();
  assert.equal(requests.length, 0);
  // A tree felled somewhere moves the woods' revision and the trees in view are asked for again; tiles that come back as they
  // were do not draw the ground again, and one that changed does (2026-09-18).
  let redrawn = 0;
  ensureWoods(colonies, close, canvas, 'class-1', catalogue, () => { redrawn++; }, 1); await settle();
  assert.ok(requests.length > 0, 'a new revision did not ask for the trees in view again');
  assert.equal(redrawn, 0, 'tiles that came back unchanged drew the ground again');
  const answer = globalThis.fetch;
  globalThis.fetch = async path => { const response = await answer(path); const { tiles } = await response.json(); return { ok: true, json: async () => ({ tiles: tiles.map((tile, i) => i === 0 && tile ? { ...tile, trees: (tile.trees || []).slice(1) } : tile) }) }; };
  ensureWoods(colonies, close, canvas, 'class-1', catalogue, () => { redrawn++; }, 2); await settle();
  globalThis.fetch = answer;
  assert.ok(redrawn >= 1, 'a tile with a tree gone did not draw the ground again');
  requests.length = 0;
  ensureWoods(colonies, close, canvas, 'class-2', catalogue, () => {}); await settle();
  assert.ok(requests.length > 0);
  // A class that does not read its woods asks for nothing.
  requests.length = 0;
  ensureWoods(createGonzalesWorld('woods-view-none', 5), close, canvas, 'class-3', catalogue, () => {}); await settle();
  assert.equal(requests.length, 0);
  } finally { globalThis.fetch = realFetch; }
});

test('the server answers many tiles in one request, the same as one at a time, remembers the land\'s tiles, and holds the request to a size', async () => {
  const pairs = [[Math.floor(home.x) - 1, Math.floor(home.y)], [Math.floor(home.x), Math.floor(home.y)], [Math.floor(home.x) + 1, Math.floor(home.y) - 1]];
  const batch = woodsTiles(colonies, 'patches', pairs);
  assert.deepEqual(batch, pairs.map(([tx, ty]) => woodsTile(colonies, 'patches', tx, ty)));
  // Remembered: the second asking hands back the same tile rather than working it out again.
  assert.equal(woodsTile(colonies, 'patches', pairs[0][0], pairs[0][1]), batch[0], 'a land tile was worked out again');
  assert.ok(landTilesKept() >= pairs.length);
  // Trees are never remembered: a felled tree changes its tile.
  const trees = woodsTile(colonies, 'trees', Math.floor(home.x * 4), Math.floor(home.y * 4));
  assert.notEqual(woodsTile(colonies, 'trees', Math.floor(home.x * 4), Math.floor(home.y * 4)), trees, 'a trees tile was remembered');
  const dir = mkdtempSync(join(tmpdir(), 'texas-woods-batch-'));
  const app = createClassroom({ seed: 'woods-batch', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
  try {
    const port = await app.listen(0, '127.0.0.1'), base = `http://127.0.0.1:${port}`;
    const join_ = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Batcher', code: app.state.sessionCode }) });
    const cookie = join_.headers.get('set-cookie').split(';')[0];
    const asked = await fetch(`${base}/api/woods?level=patches&tiles=${pairs.map(pair => pair.join(',')).join(';')}`, { headers: { cookie } });
    assert.equal(asked.status, 200);
    const body = await asked.json();
    assert.deepEqual(body.tiles, JSON.parse(JSON.stringify(batch)));
    const tooMany = Array.from({ length: WOODS_BATCH_MAX + 1 }, (_, i) => `${i},0`).join(';');
    assert.equal((await fetch(`${base}/api/woods?level=patches&tiles=${tooMany}`, { headers: { cookie } })).status, 400);
    assert.equal((await fetch(`${base}/api/woods?level=patches&tiles=1.5,2`, { headers: { cookie } })).status, 400);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the server serves woods tiles to anybody in the class, and says so when a class has none', async () => {
  for (const [map, status] of [['colonies', 200], ['gonzales', 404]]) {
    const dir = mkdtempSync(join(tmpdir(), 'texas-woods-'));
    const app = createClassroom({ seed: `woods-http-${map}`, savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map }) });
    const base = `http://127.0.0.1:${await app.listen()}`;
    try {
      const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Looker', code: app.state.sessionCode }) });
      const cookie = joined.headers.get('set-cookie').split(';')[0];
      const response = await fetch(`${base}/api/woods?level=patches&tx=0&ty=0`, { headers: { cookie } });
      assert.equal(response.status, status, map);
      if (status === 200) assert.deepEqual((await response.json()).tile, woodsTile(app.state.world, 'patches', 0, 0));
      const catalogue = await (await fetch(`${base}/api/chores`, { headers: { cookie } })).json();
      assert.deepEqual(catalogue.woods, woodsCatalogue());
      assert.equal((await fetch(`${base}/woods-view.js`)).status, 200, 'the page can load the woods module');
    } finally {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
