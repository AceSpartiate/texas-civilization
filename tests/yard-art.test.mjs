// The camp's goods at a person's size (owner, 2026-10-13: "fix the giant bedroll too"; public/yard-art.js `CAMP_GOODS`, public/app.js
// `homesteadCamp`). The bedroll was drawn as a share of a house's height - 1.1 people tall and 1.9 wide, wider than the wagon beside it.
// Measured on the very frames the page draws (public/assets/frontier-v1/atlas.json). Every test here was watched failing against the
// exact mistake it guards (scripts/yard-layout-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAMP_GOODS } from '../public/yard-art.js';
import { YARD_PICTURES } from '../sim/house-footprint.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const frames = atlas.frames || atlas;
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
/** A sprite's drawn box, in people, standing at (dx, dy) `height` people tall: as public/art.js `drawSprite` lays it down. */
function drawn(sprite, dx, dy, height) {
  const f = frames[sprite];
  assert.ok(f, `no frame ${sprite}`);
  const tall = height * (f.h / (f.logicalHeight || f.h)), wide = tall * f.w / f.h;
  return { width: wide, height: tall, left: dx - f.anchorX * wide, right: dx + (1 - f.anchorX) * wide, top: dy - f.anchorY * tall, bottom: dy + (1 - f.anchorY) * tall };
}
// The wagon as the map draws it standing: `SIZE.wagon` people tall (public/app.js), its covered frame.
const wagonHeight = Number(app.match(/\bwagon: ([\d.]+)\s*,?\s*\n?\s*\/\/|ox: [\d.]+, horse: [\d.]+, wagon: ([\d.]+)/)?.slice(1).find(Boolean));

test('the bedroll and the goods at the camp are drawn the size they are beside a person and the wagon, not a house\'s', () => {
  assert.ok(wagonHeight > 1 && wagonHeight < 2, `the wagon's drawn height was not read (${wagonHeight})`);
  const wagon = drawn('wagon-covered', 0, 0, wagonHeight);
  const bed = CAMP_GOODS.find(one => one.sprite === 'bedroll'), goods = CAMP_GOODS.find(one => one.sprite === 'packed-belongings');
  const bedroll = drawn('bedroll', bed.dx, bed.dy, bed.height), pack = drawn('packed-belongings', goods.dx, goods.dy, goods.height);
  // A rolled blanket lies about a third of a person high and is shorter than a person is tall; a fraction of the wagon's length.
  assert.ok(bedroll.height <= 0.35 && bedroll.width <= 0.6, `the bedroll is drawn ${bedroll.height.toFixed(2)} people high and ${bedroll.width.toFixed(2)} wide`);
  assert.ok(bedroll.width <= wagon.width * 0.35, `the bedroll is ${(bedroll.width / wagon.width).toFixed(2)} of the wagon's length`);
  // The trunk and its bundles: about half a person high, under half the wagon's length.
  assert.ok(pack.height <= 0.5 && pack.width <= wagon.width * 0.5, `the goods are drawn ${pack.height.toFixed(2)} people high, ${(pack.width / wagon.width).toFixed(2)} of the wagon`);
  // Nothing at the camp as tall as a person.
  for (const one of CAMP_GOODS) assert.ok(drawn(one.sprite, one.dx, one.dy, one.height).height < 0.6, `${one.sprite} is drawn as tall as a person`);
  // And every piece inside the camp's footprint, which the yard is laid out by (sim/yard-layout.mjs).
  const room = YARD_PICTURES.camp;
  for (const one of CAMP_GOODS) {
    const box = drawn(one.sprite, one.dx, one.dy, one.height);
    assert.ok(box.left >= -room.left && box.right <= room.right && box.top >= -room.up && box.bottom <= room.down, `${one.sprite} reaches outside the camp's footprint: ${JSON.stringify(box)}`);
  }
  // The page draws the camp a person's size wherever it draws it - never as a share of the house's size it is handed.
  assert.match(app, /homesteadCamp\(ctx, x, y, size \/ CABIN_PEOPLE, id\)/, 'the camp drawn as the house is, at a house\'s size');
  assert.doesNotMatch(app, /homesteadCamp\([^)]*yard \* \.7/, 'the camp drawn at seven tenths of a house\'s size');
});
