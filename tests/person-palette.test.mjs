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

test('child skin and hair receive inherited pigments while the infant basket stays painted', () => {
  for (const name of ['girl-idle-s', 'boy-idle-s', 'smallchild-idle-s', 'youth-boy-idle-s', 'youth-girl-idle-s']) {
    const [face, hair] = sample([[50, 27, [222, 151, 96]], [50, 7, [67, 46, 35]]], name);
    assert.notDeepEqual(face, [222, 151, 96], name);
    assert.notDeepEqual(hair, [67, 46, 35], name);
  }
  const basket = [130, 89, 54];
  assert.deepEqual(sample([[50, 73, basket]], 'infant-idle-s')[0], basket);
  assert.deepEqual(sample([[10, 73, basket]], 'infant-idle-s')[0], basket);
});

test('a father’s beard is hair pigment rather than a second patch of skin', () => {
  const original = [64, 45, 32];
  const [beard, cheek] = sample([[50, 30, original], [50, 21, [218, 157, 96]]], 'father-beard-idle-s');
  assert.notDeepEqual(beard, cheek);
  assert.notDeepEqual(beard, original);
});

test('rust sleeves are clothing, even in the hand area of a parent figure', () => {
  const [sleeve, body] = sample([[20, 43, [151, 76, 48]], [50, 50, [151, 76, 48]]], 'mother-scarf-idle-s');
  assert.deepEqual(sleeve, body);
  assert.ok(sleeve[1] > sleeve[0] * .75 && sleeve[2] > sleeve[0] * .7);
});
