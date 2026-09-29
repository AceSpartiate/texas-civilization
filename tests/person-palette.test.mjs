import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recolourPersonFrame, framePartsOf } from '../public/person-palette.js';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';

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

test('a father who chooses a moustache is drawn with one, on his face only, in his hair colour (stand-in until A18)', () => {
  // Found 2026-09-29: "Moustache" was drawn as the same clean-shaven bareheaded man as "Bareheaded".
  const name = 'ochre-idle-s', parts = framePartsOf(frame(name), name);
  const bare = dyed(name, { ...look, head: 'bareheaded' }), fair = dyed(name, { ...look, head: 'moustache' });
  const black = dyed(name, { ...look, hair: 'black', head: 'moustache' });
  const { width, height } = bare;
  let changed = 0, offFace = 0, lowest = 0, highest = height, followsHair = 0;
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (bare.data[i] === fair.data[i] && bare.data[i + 1] === fair.data[i + 1] && bare.data[i + 2] === fair.data[i + 2]) continue;
    changed++;
    if (parts[p] !== 1) offFace++;
    const y = Math.floor(p / width);
    lowest = Math.max(lowest, y); highest = Math.min(highest, y);
    if (fair.data[i] !== black.data[i]) followsHair++;
  }
  assert.ok(changed >= 40, `the moustache choice changes only ${changed} pixels of the bareheaded man`);
  assert.equal(offFace, 0, `${offFace} moustache pixels are off the face's own skin`);
  // Below the eyes and above the chin: the face is 10-28% down the frame (measured on the art).
  assert.ok(highest > height * .18 && lowest < height * .29, `the moustache is drawn from ${(highest / height).toFixed(3)} to ${(lowest / height).toFixed(3)} down the frame, not over the mouth`);
  assert.equal(followsHair, changed, 'the moustache does not take the hair choice');
  // In profile no band is painted across the face.
  const side = 'ochre-idle-e', sideBare = dyed(side, { ...look, head: 'bareheaded' }), sideMoustache = dyed(side, { ...look, head: 'moustache' });
  assert.deepEqual([...sideMoustache.data], [...sideBare.data], 'a moustache is painted on a face in profile');
});
