import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { PLACE_SPRITES, placeSprite } from '../public/place-art.js';

test('the outside places use registered art for their actual map sites', () => {
  const world = createGonzalesWorld('outside-place-art', 5, { map: 'colonies' });
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(PLACE_SPRITES).sort(), ['gaines-ferry', 'laredo', 'matamoros', 'presidio-rio-grande', 'san-patricio']);
  for (const [id, sprite] of Object.entries(PLACE_SPRITES)) {
    assert.ok(world.map.sites[id], `${id} is not on the live colonies map`);
    assert.equal(placeSprite(world.map.sites[id]), sprite);
    assert.ok(manifest.sheets[sprite], `${sprite} has no production atlas sheet`);
    assert.ok(manifest.assets[sprite], `${sprite} has no drawable asset`);
  }
  assert.equal(placeSprite(world.map.sites.gonzales), null);
});
