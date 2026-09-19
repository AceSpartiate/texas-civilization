// The Alamo compound at its historical dimensions, measured as the map draws it (2026-09-18, docs/ALAMO_LAYOUT.md "On the
// map"; HISTORY.md HIST-TEX-090 to HIST-TEX-092). Every length is taken from what public/bexar-art.js draws -
// `alamoMassing` - laid on the map by `alamoOnMap` and read back in feet, so a wrong plan and a wrong transform both fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALAMO_LAYOUT, alamoMassing } from '../public/alamo-layout.js';
import { ALAMO_FRONT, alamoOnMap } from '../public/bexar-layout.js';

const drawn = alamoMassing();
// A point of the plan where the map puts it, in feet east and south of the church's front.
const onMap = point => { const p = alamoOnMap(point), o = alamoOnMap(ALAMO_FRONT); return { x: (p.x - o.x) * 5280, y: (p.y - o.y) * 5280 }; };
const near = (actual, expected, tolerance, what) => assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: drawn ${actual.toFixed(2)} ft, the record ${expected.toFixed(2)} ft (±${tolerance})`);
// The outer faces of walls drawn along centre lines: each end pushed out half the thickness across the wall.
const faces = walls => walls.flatMap(w => {
  const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, l = Math.hypot(dx, dy), nx = -dy / l * w.thickness / 2, ny = dx / l * w.thickness / 2;
  return [w.a, w.b].flatMap(p => [{ x: p.x + nx, y: p.y + ny }, { x: p.x - nx, y: p.y - ny }]);
}).map(onMap);
const extent = points => ({ eastWest: Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)), northSouth: Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y)), west: Math.min(...points.map(p => p.x)), north: Math.min(...points.map(p => p.y)) });
const blockFaces = block => [{ x: block.x0, y: block.y0 }, { x: block.x1, y: block.y1 }].map(onMap);
const block = id => drawn.blocks.find(b => b.id === id);

test('the church is drawn 105 ft 8¼ in by 62 ft 11⅜ in to its outer faces, its walls 4 ft thick and 22½ ft high (HIST-TEX-090)', () => {
  const shell = drawn.walls.filter(w => /^(church-|confessional|baptistry)/.test(w.id));
  assert.ok(shell.length >= 8, 'the church is drawn as its walls');
  const church = extent([...faces(shell), ...blockFaces(block('sacristy'))]);
  // Within a foot: the record's inches are a survey of the standing walls, the plan's rooms inside them are reconstruction.
  near(church.eastWest, 105 + 8.25 / 12, 1, 'the church east to west');
  near(church.northSouth, 62 + 11.375 / 12, 1, 'the church north to south');
  near(church.west, 0, .01, 'the church front on the church\'s point on the map');
  for (const wall of shell) { near(wall.thickness, 4, .25, `${wall.id} thickness`); near(wall.height, wall.id.startsWith('church-') && !wall.id.startsWith('church-side') ? 22.5 : 12, .5, `${wall.id} height`); }
  // Roofless: nothing of the church is drawn with a roof but the sacristy.
  assert.deepEqual(drawn.blocks.filter(b => b.rooms.some(id => /^(church-|confessional|baptistry)/.test(id))), []);
});

test('the west side: a 16 ft 9 in range against 33-inch walls, 12½ ft high by the rooms, 290 ft from the church front (HIST-TEX-092)', () => {
  const west = drawn.walls.filter(w => w.id.startsWith('west-perimeter'));
  const outer = extent(faces(west)), range = blockFaces(block('west-range'));
  near(range[1].x - outer.west, 16.75, .5, 'the west range from the wall\'s outer face to its inner wall\'s east face');
  for (const wall of west) near(wall.thickness, 2.75, .1, `${wall.id} thickness`);
  near(west.find(w => w.id === 'west-perimeter').height, 12.5, .1, 'the west wall along the rooms');
  near(west.find(w => w.id === 'west-perimeter-south').height, 7, .1, 'the west wall south of the rooms');
  // "about 290' from the front of the church": the wall's centre line, due west of the front.
  near(-onMap({ x: 0, y: ALAMO_FRONT.y }).x, 290, 10, 'the west wall from the church front');
  // The compound's plan (the Alamo's scale model): the north wall's span and the west wall's length.
  near(outer.northSouth, ALAMO_LAYOUT.dimensions.westWallFeet, 1, 'the west wall');
  const north = drawn.walls.filter(w => /^north-\d+$/.test(w.id)), span = extent(north.flatMap(w => [w.a, w.b]).map(onMap));
  near(span.eastWest, 243.75, 1, 'the north wall east to west');
  const plaza = drawn.floors.find(f => f.id === 'plaza'), open = extent(plaza.points.map(onMap));
  near(open.northSouth, 537 + 5 / 12, 1, 'the main plaza north to south');
});

// Each to its outer faces, as the church: the published lengths are of the buildings, not of the rooms inside them.
test('the barracks: the long barrack 191 ft by 20, two storeys; the low barrack 114 ft by 17 on the south wall, the gate through it (HIST-TEX-091)', () => {
  const [lnw, lse] = blockFaces(block('long-barrack'));
  near(lse.y - lnw.y, 191 + 1.375 / 12, 1, 'the long barrack north to south');
  near(lse.x - lnw.x, 19 + 11 / 12, .5, 'the long barrack east to west');
  near(block('long-barrack').height, 18, .5, 'the long barrack\'s two storeys');
  const [nw, se] = blockFaces(block('low-barrack'));
  near(se.x - nw.x, 114, 1, 'the low barrack east to west');
  near(se.y - nw.y, 17, .5, 'the low barrack north to south');
  const south = drawn.walls.find(w => w.id === 'south-perimeter');
  near(se.y, onMap(south.a).y + south.thickness / 2, .01, 'the low barrack\'s south face on the compound\'s');
  const gate = block('low-barrack').openings.find(o => o.id === 'south-gate');
  assert.ok(gate && gate.x0 > block('low-barrack').x0 && gate.x1 < block('low-barrack').x1, 'the south gate is through the low barrack');
});
