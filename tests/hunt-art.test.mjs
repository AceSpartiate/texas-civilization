// The hunter's painted field and rifle (request 2026-10-02, painted with the local pipeline 2026-10-26; public/hunt-art.js, drawn by
// public/hunt-aim.js): every sighting is shown in a painting that is in the library, its winter one December to February, and the
// rifle's muzzle and butt, by which the page turns it onto the sights, are where the sheet's own pixels put them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIELD_COVERS, RIFLE, fieldSprite, seasonOf } from '../public/hunt-art.js';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));

test('each cover and season has its painting in the library; winter is December to February; anything else is timber', () => {
  for (const cover of FIELD_COVERS) for (let month = 0; month < 12; month++) {
    const name = fieldSprite({ cover, month });
    assert.ok(atlas.frames[name], `${cover} in month ${month}: ${name} is not in the library`);
    assert.equal(name.endsWith('-winter'), [11, 0, 1].includes(month), `${cover} in month ${month} is ${name}`);
    assert.equal(seasonOf({ month }) === 'winter', name.endsWith('-winter'));
  }
  assert.equal(fieldSprite({ cover: 'swamp', month: 6 }), 'hunt-field-timber');
  assert.equal(fieldSprite({}), 'hunt-field-timber', 'a sighting with no month is summer (September), as the strokes were');
  for (const cover of FIELD_COVERS) assert.equal(atlas.frames[fieldSprite({ cover })].backdrop, true, 'the field is not framed as a whole painting');
});

test("the rifle's muzzle and butt are on the painted rifle, and the corners beyond them are clear", () => {
  const frame = atlas.frames['hunt-rifle'];
  assert.ok(frame, 'hunt-rifle is not in the library');
  const sheet = decodeRgba(readFileSync(new URL(`../public/assets/frontier-v1/${atlas.sheets[frame.sheet].image}`, import.meta.url)));
  const alpha = ([fx, fy]) => sheet.data[((frame.y + Math.round(fy * (frame.h - 1))) * sheet.width + frame.x + Math.round(fx * (frame.w - 1))) * 4 + 3];
  const near = point => Math.max(...[-2, -1, 0, 1, 2].flatMap(dx => [-2, -1, 0, 1, 2].map(dy => alpha([point[0] + dx / frame.w, point[1] + dy / frame.h]))));
  assert.ok(near(RIFLE.muzzle) > 128, 'no rifle at the muzzle point');
  assert.ok(near(RIFLE.butt) > 128, 'no rifle at the butt point');
  assert.ok(alpha([0, 0]) < 24 && alpha([1, 1]) < 24, 'the frame\'s corners are not clear: the muzzle and butt are not its ends');
  // The muzzle is the rifle's top-left end and the butt its bottom-right one: nothing opaque further out along the diagonal.
  const beyond = (point, dir) => alpha([point[0] + dir * 0.02, point[1] + dir * 0.02]);
  assert.ok(beyond(RIFLE.muzzle, -1) === undefined || beyond(RIFLE.muzzle, -1) < 24);
  assert.ok(beyond(RIFLE.butt, 1) === undefined || beyond(RIFLE.butt, 1) < 24);
});
