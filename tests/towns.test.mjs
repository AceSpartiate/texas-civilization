// The towns of the colonies, drawn: docs/TOWNS.md §5b, from the layout sketches in docs/town-research/.
//
// Each town is drawn in its research's own frame, turned to its measured bearing and set on its site point. These prove
// the frame arithmetic, that every building uses art the library has, that no building stands in a river the map draws,
// that Liberty's frame lands where its 1968 marker says, and that the keepers stand in buildings the towns draw - the
// documented ones where the research names the trade.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOWN_LAYOUTS, townPoint, DRAWN_HEIGHT } from '../sim/town-layouts.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { milesFrom, realTerrain } from '../sim/terrain-data.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { TOWN_TRADES } from '../sim/shops.mjs';

const map = coloniesMap();
const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const sprites = new Set([...Object.keys(atlas.frames || {}), ...Object.keys(atlas.sprites || {}), ...Object.keys(atlas || {})]);
const segment = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1e-12; const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
const nearest = (p, courses) => Math.min(...courses.flatMap(c => c.points.slice(1).map((q, i) => segment(p, c.points[i], q))));

test('a town frame turns to its bearing: +x along the bearing, +y ninety degrees clockwise of it', () => {
  const north = { bearing: 0, anchor: { x: 0, y: 0 } }, east = { bearing: 90, anchor: { x: 0, y: 0 } };
  assert.deepEqual(townPoint(north, { x: 5280, y: 0 }), { x: 0, y: -1 }, 'bearing 0: +x is not north');
  assert.deepEqual(townPoint(north, { x: 0, y: 5280 }), { x: 1, y: 0 }, 'bearing 0: +y is not east');
  assert.deepEqual(townPoint(east, { x: 5280, y: 5280 }), { x: 1, y: 1 }, 'bearing 90: the frame is not north-up');
  const turned = { bearing: 60.5, anchor: { x: 100, y: 100 } };
  assert.deepEqual(townPoint(turned, { x: 100, y: 100 }), { x: 0, y: 0 }, 'the anchor is not on the site point');
  const along = townPoint(turned, { x: 5380, y: 100 });
  assert.ok(Math.abs(Math.atan2(along.x, -along.y) * 180 / Math.PI - 60.5) < 0.1, 'the frame does not bear N 60.5 E');
});

test('every drawn town uses art the library has, names each building once, and keeps them near its site', () => {
  // Every town and settlement on the map with research, which is all of them but Gonzales and Béxar (drawn by their own art).
  assert.deepEqual(Object.keys(TOWN_LAYOUTS).sort(), ['anahuac', 'brazoria', 'columbia', 'goliad', 'harrisburg', 'liberty', 'matagorda', 'mina', 'nacogdoches', 'refugio', 'san-felipe', 'velasco', 'victoria', 'washington']);
  for (const place of Object.values(map.places).filter(p => p.kind === 'town' && !['gonzales', 'bexar', 'lynchburg'].includes(p.id))) assert.ok(TOWN_LAYOUTS[place.id], `${place.id} is a town on the map with no layout`);
  for (const [id, layout] of Object.entries(TOWN_LAYOUTS)) {
    assert.ok(map.places[id], `${id} is not a place on the map`);
    assert.ok(layout.research && readFileSync(new URL(`../${layout.research}`, import.meta.url)), `${id} names no research`);
    assert.equal(new Set(layout.buildings.map(b => b.id)).size, layout.buildings.length, `${id} names a building twice`);
    for (const building of layout.buildings) {
      assert.ok(sprites.has(building.sprite), `${id}'s ${building.id} is drawn as ${building.sprite}, which the library does not have`);
      assert.ok(Number.isFinite(building.x) && Number.isFinite(building.y) && building.height > 0, `${id}'s ${building.id} stands nowhere`);
      const p = townPoint(layout, building);
      assert.ok(Math.hypot(p.x, p.y) < 1.5, `${id}'s ${building.id} is ${Math.hypot(p.x, p.y).toFixed(2)} miles from the town`);
    }
    assert.ok(layout.buildings.some(b => b.filler), `${id} has no ordinary houses`);
    for (const wall of layout.walls || []) {
      for (const sprite of [wall.sprite, wall.breach].filter(Boolean)) assert.ok(sprites.has(sprite), `${id}'s wall is drawn as ${sprite}, which the library does not have`);
      assert.ok(wall.points.length >= 2 && wall.spacing > 0 && wall.height > 0, `${id} has a wall that cannot be drawn`);
    }
  }
  assert.ok(DRAWN_HEIGHT >= 1 && DRAWN_HEIGHT <= 4);
});

test('no building of any town stands in a river or a creek the map draws', () => {
  const rivers = map.watercourses.filter(c => c.kind === 'river'), creeks = map.watercourses.filter(c => c.kind !== 'river');
  for (const [id, layout] of Object.entries(TOWN_LAYOUTS)) {
    const site = map.places[id];
    // A ferry, a skiff or a wharf stands at the water on purpose (`onWater`); a wall's corners are held clear like a building.
    for (const building of [...layout.buildings.filter(b => !b.onWater), ...(layout.walls || []).flatMap(w => w.points.map((p, i) => ({ ...p, id: `${w.name || 'wall'} point ${i}` })))]) {
      const p = townPoint(layout, building), at = { x: site.x + p.x, y: site.y + p.y };
      const river = nearest(at, rivers) * 5280, creek = nearest(at, creeks) * 5280;
      assert.ok(river > (layout.riverClearance ?? 300), `${id}'s ${building.id} stands ${river.toFixed(0)} ft from a river`);
      assert.ok(creek > 40, `${id}'s ${building.id} stands ${creek.toFixed(0)} ft from a creek`);
    }
  }
});

test('Liberty\'s frame lands where its 1968 Plaza Constitucional marker stands', () => {
  const terrain = realTerrain(), layout = TOWN_LAYOUTS.liberty;
  const marker = milesFrom(terrain, -94.79721, 30.05935), drawn = townPoint(layout, { x: 1539, y: 1314 });
  const off = Math.hypot(map.places.liberty.x + drawn.x - marker.x, map.places.liberty.y + drawn.y - marker.y) * 5280;
  assert.ok(off < 120, `the marker is drawn ${off.toFixed(0)} ft from where it stands`);
});

test('every keeper in a drawn town keeps one of its buildings, the documented one where the research names the trade', () => {
  const world = createGonzalesWorld('towns-keepers', 30, { map: 'colonies' });
  let checked = 0;
  for (const [id, layout] of Object.entries(TOWN_LAYOUTS)) {
    const shops = world.map.shops?.[id];
    if (!shops) continue;
    assert.equal(shops.length, 2 + TOWN_TRADES[id].length, `${id} is missing a shop`);
    assert.equal(new Set(shops.map(s => s.building)).size, shops.length, `two keepers share a building in ${id}`);
    for (const shop of shops) {
      const building = layout.buildings.find(b => b.id === shop.building);
      assert.ok(building, `${id}'s ${shop.trade} keeps no drawn building`);
      const documented = layout.buildings.find(b => b.trade === shop.trade);
      if (documented) assert.equal(shop.building, documented.id, `${id}'s ${shop.trade} is not in ${documented.id}`);
      else assert.ok(building.filler && !building.trade, `${id}'s ${shop.trade} took a documented building that is not its own`);
      checked++;
    }
  }
  assert.ok(checked >= 20, `only ${checked} keepers were checked`);
  assert.equal(world.map.shops['san-felipe'].find(s => s.trade === 'blacksmith').building, 'sf-smithy');
  assert.equal(world.map.shops['san-felipe'].find(s => s.trade === 'tavern').building, 'sf-peyton-tavern');
});
