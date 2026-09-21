/**
 * Astra's five south-facing Alamo elevations, laid on the compound the plan really builds (2026-09-21,
 * docs/ART_DELIVERY_2026-09-21-ALAMO-FACE-STRIPS.md).
 *
 * The choice - which strip goes on what - is a pure function of the massing (`public/alamo-faces.js`), so it can be asked
 * here with the real compound rather than a made-up one. public/bexar-art.js can only be read in a browser (it loads its
 * neighbours by the page's own absolute paths), so what this file cannot see is the laying itself: that is
 * `window.__alamoDrawn.faces`, asserted in scripts/alamo-style-shots.mjs.
 *
 * The delivery's own condition was that it changes nothing but the picture. The second test holds that: the footprint,
 * every height, the openings, the destructible north wall and every wall's own state are exactly what they were.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALAMO_LAYOUT, alamoMassing, createDamageState } from '../public/alamo-layout.js';
import { ALAMO_FACES, STOREYS, blockFace, openingFace, wallFace } from '../public/alamo-faces.js';

const atlas = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url)), 'utf8'));

test('every one of the five delivered elevations is worn by something the compound actually has, and every surface wears one', () => {
  const massing = alamoMassing();
  for (const sprite of Object.values(ALAMO_FACES)) assert.ok(atlas.frames[sprite], `${sprite} is not a frame the library has`);

  const worn = new Set();
  for (const block of massing.blocks) worn.add(blockFace(block));
  for (const wall of massing.walls) worn.add(wallFace(wall));
  for (const block of massing.blocks) for (const opening of block.openings) { void opening; worn.add(openingFace()); }
  // All five strips, and the palisade that was already there. A strip nothing wears is a frame drawn by nothing; a strip
  // everything wears is the repeated wall module this delivery replaced.
  assert.deepEqual([...worn].sort(), [...new Set(Object.values(ALAMO_FACES))].sort());

  // The two-storey convento end is the long barrack's, and nothing else in this plan is two storeys.
  const twoStorey = massing.blocks.filter(block => blockFace(block) === ALAMO_FACES.convento).map(block => block.id);
  assert.deepEqual(twoStorey, ['long-barrack'], `the convento end is worn by ${twoStorey.join(', ') || 'nothing'}`);
  assert.ok(massing.blocks.find(block => block.id === 'long-barrack').height >= STOREYS);
  // The one-storey ranges - the west range, the low barrack with its gate, the quarters, the store, the hospital, the
  // kitchen, the sacristy and the powder store - wear the room front.
  assert.ok(massing.blocks.filter(block => blockFace(block) === ALAMO_FACES.rooms).length >= 8);

  // The roofless church's own shell is marked as the massing cuts it out of the nave's walls, and only it wears its wall.
  const church = massing.walls.filter(wall => wallFace(wall) === ALAMO_FACES.church);
  assert.ok(church.length > 0, 'no run of wall is the roofless church, so its own elevation is worn by nothing');
  assert.ok(church.every(wall => wall.kind === 'church'));
  assert.ok(massing.walls.some(wall => wallFace(wall) === ALAMO_FACES.limestone), 'no plain stone run is left');
  // The palisade is not of this delivery and keeps its stakes.
  assert.ok(massing.walls.filter(wall => wall.material === 'timber').every(wall => wallFace(wall) === ALAMO_FACES.palisade));
  // The gate goes over an opening the layout really carries, and the compound has one.
  assert.equal(massing.blocks.reduce((count, block) => count + block.openings.length, 0), 1);
});

test('the elevations change the picture and nothing else: the measured footprint, the openings and the destructible wall are untouched', () => {
  // The claimed dimensions (HIST-TEX-090 to -092) and the compound's own bounds.
  assert.deepEqual(ALAMO_LAYOUT.dimensions.claims, ['HIST-TEX-090', 'HIST-TEX-091', 'HIST-TEX-092']);
  assert.deepEqual(ALAMO_LAYOUT.bounds, { x: -32, y: -32, width: 464, height: 605 });
  assert.equal(ALAMO_LAYOUT.dimensions.northWallFeet, 243.75);
  assert.equal(ALAMO_LAYOUT.dimensions.lowBarrackLengthFeet, 114);
  // The massing's geometry is the plan's, and choosing a picture reads it without writing to it.
  const before = JSON.stringify(alamoMassing());
  for (const block of alamoMassing().blocks) blockFace(block);
  for (const wall of alamoMassing().walls) wallFace(wall);
  assert.equal(JSON.stringify(alamoMassing()), before, 'choosing a face changed the compound');
  // The destructible wall state is the world's and still starts whole.
  const damage = createDamageState();
  assert.ok(Object.keys(damage.walls).length > 0, 'nothing is destructible any more');
  assert.ok(Object.values(damage.walls).every(health => health === 100));
});

/**
 * That the renderer asks these questions at all.
 *
 * public/bexar-art.js cannot be imported into node - it loads its neighbours by the page's own absolute paths - so this
 * reads it. A text check is weak evidence and is here for one reason: without it, deleting the line that lays the gate
 * passage over the south gate breaks nothing in `npm test`, and the frame goes back to being registered and drawn by
 * nothing, which is the exact defect this whole day existed to fix. The real proof is the browser's
 * `window.__alamoDrawn.faces` (scripts/alamo-style-shots.mjs).
 */
test('the compound renderer asks which face each part wears, and lays the gate over the opening', () => {
  const bexar = readFileSync(fileURLToPath(new URL('../public/bexar-art.js', import.meta.url)), 'utf8');
  const strip = text => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const source = strip(bexar);
  assert.match(source, /faceArt\(ctx,face\(blockFace\(block\)\)/, 'a roofed range is no longer asked which front it wears');
  assert.match(source, /faceArt\(ctx,face\(wallFace\(wall\)\)/, 'a run of wall is no longer asked which face it wears');
  assert.match(source, /for\(const o of block\.openings\)[\s\S]{0,600}?gateArt\(ctx,/, 'the gate passage is no longer laid over the opening');
  assert.match(source, /spriteFrame\(openingFace\(\)\)/, 'the gate strip is no longer measured at its own proportion');
  // And what it laid is recorded for the browser proof, only when the sprite really drew.
  assert.match(source, /if\(drawSprite\(ctx,art\.sprite[^\n]*\)\)facesDrawn\.add\(art\.sprite\)/, 'what was laid is no longer recorded');
  assert.match(source, /get faces\(\)\{return \[\.\.\.facesDrawn\]\.sort\(\);\}/, '__alamoDrawn no longer carries the faces');
});
