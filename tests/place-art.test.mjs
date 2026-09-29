import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { PLACE_SPRITES, STANDIN_PLACE_SPRITES, placeSprite } from '../public/place-art.js';

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

// The Mexican advance's places (docs/MAP_ACCURACY.md §14) are drawn by Claude's stand-ins until Astra's frames of the same
// names come (docs/ART_REQUESTS.md, request 2026-09-26, item 4).
test('the advance\'s places are drawn with the Claude cutouts of the names the request asks for', () => {
  const world = createGonzalesWorld('outside-place-art', 5, { map: 'colonies' });
  const standins = JSON.parse(readFileSync(new URL('../public/assets/claude-standins/atlas.json', import.meta.url), 'utf8'));
  assert.deepEqual(STANDIN_PLACE_SPRITES, { staffords: 'plantation-sugar', 'old-fort': 'blockhouse-village', 'new-washington': 'townsite-bay', powells: 'tavern-house' });
  for (const [id, sprite] of Object.entries(STANDIN_PLACE_SPRITES)) {
    assert.ok(world.map.sites[id], `${id} is not on the live colonies map`);
    assert.equal(placeSprite(world.map.sites[id]), sprite, `${id} is not drawn as ${sprite}`);
    assert.ok(standins.frames[sprite]?.madeBy === 'claude', `${sprite} is not a Claude-drawn frame in the stand-in library`);
  }
});
