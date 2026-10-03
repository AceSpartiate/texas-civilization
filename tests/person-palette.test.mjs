import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recolourPersonFrame, framePartsOf } from '../public/person-palette.js';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';
import { avatarVariant } from '../public/avatar-identity.js';

// On Astra's own frames, not on made-up pixels: the recolouring finds its parts by painted region and by where the figure's
// face is (2026-09-28), so a handful of scattered pixels has no face and no regions to judge. The owner's report: "the dad's
// hair covers his face in the preview". scripts/looks-face-proof.mjs proves the same through the browser's drawing code.
const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const sheets = new Map();
function frame(name) {
  const f = atlas.frames[name];
  const path = new URL(`../public/assets/frontier-v1/${atlas.sheets[f.sheet].image}`, import.meta.url);
  if (!sheets.has(f.sheet)) sheets.set(f.sheet, decodeRgba(readFileSync(path)));
  const sheet = sheets.get(f.sheet), data = new Uint8ClampedArray(f.w * f.h * 4);
  for (let y = 0; y < f.h; y++) data.set(sheet.data.subarray(((f.y + y) * sheet.width + f.x) * 4, ((f.y + y) * sheet.width + f.x + f.w) * 4), y * f.w * 4);
  return { data, width: f.w, height: f.h };
}
const at = ({ data, width, height }, fx, fy) => { const i = (Math.round(fy * height) * width + Math.round(fx * width)) * 4; return [...data.slice(i, i + 3)]; };
const dyed = (name, look) => { const image = frame(name); recolourPersonFrame(image, name, look); return image; };
const look = { skin: 'deep brown', hair: 'fair', clothing: 'teal', head: 'hat' };

test("the father's hat brim beside his face keeps the hat's colour whatever the hair (the release drew hair-coloured blocks there)", () => {
  const painted = frame('rust-idle-s'), fair = dyed('rust-idle-s', look), black = dyed('rust-idle-s', { ...look, hair: 'black' });
  // The brim's underside either side of the face, at 18-24% down: hat, not hair.
  for (const [x, y] of [[.25, .2], [.75, .2], [.2, .22], [.8, .22]]) {
    assert.deepEqual(at(fair, x, y), at(black, x, y), `the hair choice changes the brim at ${x},${y}`);
    assert.deepEqual(at(fair, x, y), at(painted, x, y), `the brim at ${x},${y} is not as painted`);
  }
});

test("a bareheaded father's whole forehead takes the skin choice (the release left a band of the old skin across it)", () => {
  const painted = frame('ochre-idle-s'), deep = dyed('ochre-idle-s', look);
  for (const y of [.11, .13, .2]) assert.notDeepEqual(at(deep, .5, y), at(painted, .5, y), `the forehead at ${y} keeps its painted skin`);
  const forehead = at(deep, .5, .11), cheek = at(deep, .45, .22);
  assert.ok(Math.abs(forehead[0] - cheek[0]) < 40, `forehead ${forehead} and cheek ${cheek} are two tones`);
});

test("a mother's face takes no hair colour and her curls do", () => {
  for (const name of ['teal-idle-s', 'indigo-idle-s', 'rust-woman-idle-s']) {
    const image = frame(name), parts = framePartsOf(image, name), { width, height, data } = image;
    let face = 0, hairOnFace = 0;
    // Below the brows, and only the face's own light paint: a lash at the eye's edge is the hair's brown, and may be dyed.
    for (let y = Math.round(height * .19); y < height * .26; y++) for (let x = Math.round(width * .4); x < width * .6; x++) {
      const p = y * width + x, light = .299 * data[p * 4] + .587 * data[p * 4 + 1] + .114 * data[p * 4 + 2];
      if (parts[p] === 1) face++;
      if (parts[p] === 2 && light > 90) hairOnFace++;
    }
    assert.ok(face > 60, `${name}: the middle of the face is not skin (${face} pixels)`);
    assert.equal(hairOnFace, 0, `${name}: ${hairOnFace} pixels in the middle of the face are taken for hair`);
    assert.ok([...parts].filter(part => part === 2).length > 400, `${name}: her hair is not found`);
  }
});

test('the dress takes the clothes choice and keeps its painted light and shade', () => {
  const blouse = at(dyed('rust-woman-idle-s', look), .35, .42), shade = at(dyed('rust-woman-idle-s', look), .5, .45);
  assert.ok(blouse[1] > blouse[0] * .75 && blouse[2] > blouse[0] * .7, `the blouse ${blouse} does not read as teal`);
  assert.notDeepEqual(blouse, shade, 'painted light and shade should remain');
});

test('a frame of no cast figure is left alone', () => {
  const image = frame('rust-idle-s'), before = [...image.data];
  recolourPersonFrame(image, 'volunteer-idle-e', look);
  assert.deepEqual([...image.data], before);
});

test('a father who chooses a moustache is Astra\'s moustached father, and nothing is painted on the bareheaded man any more', () => {
  // Until 2026-10-02 the choice was a moustache Claude painted on her bareheaded ochre man (stand-in, A18's `--moustache`); her
  // `father-moustache` figure retires it.
  assert.equal(avatarVariant({ head: 'moustache' }, 'male'), 'father-moustache');
  const bare = dyed('ochre-idle-s', { ...look, head: 'bareheaded' }), moustache = dyed('ochre-idle-s', { ...look, head: 'moustache' });
  assert.deepEqual([...moustache.data], [...bare.data]);
});

// Astra's 2026-10-02 family figures and her children, on her own frames (her write-up: docs/FAMILY_ART_2026-10-02.md).
const count = (parts, part) => [...parts].filter(one => one === part).length;
test('child skin and hair receive inherited pigments while the infant basket stays painted', () => {
  for (const name of ['girl-idle-s', 'boy-idle-s', 'smallchild-idle-s', 'youth-boy-idle-s', 'youth-girl-idle-s']) {
    const image = frame(name), parts = framePartsOf(image, name);
    assert.ok(count(parts, 1) > 400, `${name}: the face is not found (${count(parts, 1)} skin pixels)`);
    assert.ok(count(parts, 2) > 200, `${name}: the hair is not found (${count(parts, 2)} hair pixels)`);
    const deep = dyed(name, look), black = dyed(name, { ...look, hair: 'black' });
    let skin = 0, hair = 0;
    for (let p = 0; p < parts.length; p++) {
      const i = p * 4;
      if (parts[p] === 1 && deep.data[i] !== image.data[i]) skin++;
      if (parts[p] === 2 && deep.data[i] !== black.data[i]) hair++;
    }
    assert.ok(skin > .95 * count(parts, 1), `${name}: the skin choice leaves the face as painted`);
    assert.ok(hair > .95 * count(parts, 2), `${name}: the hair choice leaves the hair as painted`);
  }
  for (const name of ['infant-awake', 'infant-asleep', 'infant-idle-e']) {
    const image = frame(name), parts = framePartsOf(image, name);
    assert.ok(count(parts, 1) > 300, `${name}: the baby's face is not found`);
    assert.equal(count(parts, 3), 0, `${name}: the wrapping or the basket is dyed as clothes`);
  }
  // The basket's weave and the wrapping, below the face: as painted whatever the looks.
  const painted = frame('infant-awake'), deep = dyed('infant-awake', look);
  for (const [x, y] of [[.5, .6], [.3, .5], [.5, .85], [.15, .64], [.85, .63]]) assert.deepEqual(at(deep, x, y), at(painted, x, y), `the basket or wrapping at ${x},${y} is recoloured`);
  assert.notDeepEqual(at(deep, .5, .33), at(painted, .5, .33), 'the baby\'s face does not take the skin choice');
});

test('a father’s beard is hair pigment rather than a second patch of skin', () => {
  const name = 'father-beard-idle-s', image = frame(name), parts = framePartsOf(image, name), { width, height } = image;
  const part = (x, y) => parts[Math.round(y * height) * width + Math.round(x * width)];
  assert.equal(part(.5, .3), 2, 'the beard under the mouth is not hair');
  assert.equal(part(.5, .22), 1, 'the cheek is not skin');
  const deep = dyed(name, look);
  assert.notDeepEqual(at(deep, .5, .3), at(deep, .5, .22), 'the beard is drawn in the skin\'s colour');
  assert.notDeepEqual(at(deep, .5, .3), at(image, .5, .3), 'the beard keeps its painted brown under fair hair');
});

test('rust sleeves are clothing, even in the hand area of a parent figure', () => {
  const name = 'mother-scarf-idle-s', image = frame(name), parts = framePartsOf(image, name), { width, height } = image;
  const part = (x, y) => parts[Math.round(y * height) * width + Math.round(x * width)];
  // Her sleeve cuff beside the hands, and the bodice.
  assert.equal(part(.24, .48), 3, 'the sleeve beside the hands is not clothing');
  assert.equal(part(.33, .41), 3, 'the bodice is not clothing');
  const sleeve = at(dyed(name, look), .24, .48);
  assert.ok(sleeve[1] > sleeve[0] * .75 && sleeve[2] > sleeve[0] * .7, `the sleeve ${sleeve} does not read as teal`);
});

test('the hats and the scarf of Astra\'s new parents stay as painted, and the hair beneath them is dyed', () => {
  for (const name of ['father-hat-idle-s', 'father-straw-idle-s', 'mother-scarf-idle-s', 'mother-straw-idle-s']) {
    const painted = frame(name), fair = dyed(name, look), black = dyed(name, { ...look, hair: 'black' });
    // The crown of the hat or the scarf, above the face.
    assert.deepEqual(at(fair, .5, .04), at(painted, .5, .04), `${name}: the crown is recoloured`);
    assert.deepEqual(at(fair, .5, .04), at(black, .5, .04), `${name}: the hair choice changes the crown`);
    assert.ok(count(framePartsOf(painted, name), 2) > 150, `${name}: no hair is found under the hat`);
  }
});
