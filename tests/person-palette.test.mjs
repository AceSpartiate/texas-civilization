import test from 'node:test';
import assert from 'node:assert/strict';
import { recolourPersonFrame } from '../public/person-palette.js';

const look = { skin: 'deep brown', hair: 'brown', clothing: 'teal', head: 'bonnet' };
const sample = (points, name = 'rust-woman-idle-s') => {
  const width = 100, height = 100, data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y, colour] of points) {
    const i = (y * width + x) * 4;
    data.set([...colour, 255], i);
  }
  recolourPersonFrame({ data, width, height }, name, look);
  return points.map(([x, y]) => [...data.slice((y * width + x) * 4, (y * width + x) * 4 + 3)]);
};

test('painted skin is one tone across the forehead and cheek, while the bonnet keeps its pigment', () => {
  const skin = [211, 133, 77], bonnet = [196, 164, 120];
  const [forehead, cheek, hat] = sample([[50, 17, skin], [50, 30, skin], [50, 6, bonnet]]);
  assert.deepEqual(forehead, cheek);
  assert.notDeepEqual(forehead, skin);
  assert.deepEqual(hat, bonnet);
});

test('blouse and skirt share the chosen hue without washing their original texture flat', () => {
  const [blouse, skirt] = sample([[50, 43, [156, 75, 51]], [50, 68, [188, 128, 76]]]);
  assert.ok(blouse[1] > blouse[0] * .75 && blouse[2] > blouse[0] * .7, 'blouse should read as teal');
  assert.ok(skirt[1] > skirt[0] * .75 && skirt[2] > skirt[0] * .7, 'skirt should read as teal');
  assert.notDeepEqual(blouse, skirt, 'painted light and shade should remain');
});
