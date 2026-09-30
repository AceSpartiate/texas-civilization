// Recolour the *authored* character frames. This changes pigments while retaining their
// original ink, brush texture, silhouettes and every frame of their motion sheets.
//
// stand-in: docs/ART_REQUESTS.md A18, "layered people" - Astra's aligned skin, hair and clothes masks. Until they arrive, the
// parts are found in the painted frame itself, and found by *region*, not by where a pixel sits (2026-09-28).
//
// The classifier this replaces decided every pixel on its own, by its colour and by fixed boxes in the frame ("the face is
// between 29% and 72% across"). Her figures do not keep to boxes: the hat brim, the ears, the scarf and the shoulders all
// cross them, so the chooser drew hair-coloured blocks over a father's cheeks and on his hat brim, an un-dyed band across a
// bareheaded forehead, the scarf in the hair colour, the shoulders of a rust shirt in the skin colour and a woman's ears in
// her hair colour (the owner, 2026-09-28: "the dad's hair covers his face in the preview"; scripts/looks-face-proof.mjs).
//
// Her painting is flat colour between ink lines, so the frame is cut into regions of like colour (a region grows while each
// step is small and it stays near its own average, so a gradient cannot carry the face into the beard). Each region takes one
// part from the nearest of the figure's own measured colours (`REFS`, the averages of the regions of its south idle), and a
// region is only ever wholly one part - there are no box edges to show. Where colour alone cannot tell (a scarf, a vest and
// a hat band are the hair's brown), where the region lies relative to the figure's own face decides: hair is on the head,
// clothing below the face. The specks between regions take the part of the like-coloured region beside them.
//
// ceiling: her rust man's curls and beard are painted nearly black, mostly darker than the ink line this keeps, so a fair
// or red hair choice shows on him as a lighter fleck through dark hair, not as fair hair; only a layered hair mask (A18) can
// fix that without dyeing his outline.
// ceiling: the colours are measured from each figure's south idle and hold across its walk, work and battle frames because
// she painted them from one palette. A new cast figure needs its row in REFS (scripts/looks-face-proof.mjs reports a figure
// with none); Astra's layered masks (A18) retire all of this.
import { SKIN_COLOURS, HAIR_COLOURS, CLOTHING_COLOURS } from './looks-art.js';

/** What a part is painted in on the source figure: the dyed pixel keeps its light or shade relative to this. */
const sources = {
  rust: { skin: [218, 157, 96], hair: [64, 45, 32], clothing: [151, 76, 48] },
  teal: { skin: [185, 112, 61], hair: [64, 47, 37], clothing: [78, 126, 123] },
  elder: { skin: [113, 75, 50], hair: [181, 177, 160], clothing: [83, 89, 62] },
  blue: { skin: [224, 155, 98], hair: [67, 45, 32], clothing: [73, 106, 135] },
  'rust-woman': { skin: [211, 133, 77], hair: [61, 44, 35], clothing: [156, 75, 51] },
  indigo: { skin: [210, 137, 81], hair: [65, 47, 39], clothing: [71, 102, 132] },
  // Her children (2026-09-29, the family's start: a child takes the skin tone between the parents, and until now her children's
  // figures were drawn as painted whatever their parents looked like - a free Black or Tejano family's children light-skinned
  // beside their parents). The girl's red dress, the boy's cream shirt and the small child's cream smock are what the clothes
  // choice dyes; the girl's apron and the boy's trousers and braces stay as painted.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-29 "the family's start", item 3 - faces and hair painted for the darker
  // tones; until then every figure, grown or child, is dyed to the tone with its painted light and shade kept.
  girl: { skin: [223, 124, 54], hair: [70, 43, 27], clothing: [180, 81, 55] },
  boy: { skin: [247, 164, 101], hair: [198, 134, 66], clothing: [241, 206, 163] },
  smallchild: { skin: [225, 127, 57], hair: [77, 44, 24], clothing: [244, 210, 168] },
  // Her ochre figure is named for his shirt, and the shirt is what the clothes choice dyes; the brown waistcoat stays.
  ochre: { skin: [224, 151, 90], hair: [73, 51, 36], clothing: [216, 138, 54] },
  'blue-girl': { skin: [222, 151, 96], hair: [67, 46, 35], clothing: [70, 103, 134] },
};

const SKIN = 1, HAIR = 2, CLOTHING = 3;
const PART_NAMES = [null, 'skin', 'hair', 'clothing'];
/**
 * A shade of the same pigment: darker, but not by half (her ochre man's waistcoat is his skin's hue at a third of its
 * light), and its channels in the same order (red over green over blue).
 */
const order = (r, g, b) => (r >= g ? 4 : 0) + (g >= b ? 2 : 0) + (r >= b ? 1 : 0);
const shadeOf = (s, of) => {
  const lum = light(s.r, s.g, s.b), ofLum = light(of.r, of.g, of.b);
  return lum < ofLum && lum >= .5 * ofLum && order(s.r, s.g, s.b) === order(of.r, of.g, of.b);
};
/**
 * Each figure's own colours, measured as region averages of its south idle (2026-09-28), and what each is. `0` is a colour
 * that is kept as painted: a hat, a band, a scarf, braces, an apron, a skirt, trousers, boots. The Claude-drawn frames
 * (public/assets/claude-standins) are painted in the `sources` tokens, which are included by `refsOf`.
 */
const K = 0;
const REFS = {
  // His hair and beard are only specks between ink; (60, 37, 24) is their average, warmer than his cold black scarf.
  rust: [[60, 37, 24, HAIR], [163, 116, 68, K], [66, 48, 34, K], [138, 93, 53, K], [166, 93, 51, SKIN], [214, 140, 81, SKIN], [209, 135, 79, SKIN],
    [182, 133, 79, K], [190, 144, 83, K], [132, 60, 38, CLOTHING], [135, 61, 39, CLOTHING], [49, 44, 41, K], [125, 86, 47, K],
    [78, 48, 28, K], [174, 126, 75, K], [91, 50, 26, K], [188, 141, 80, K], [42, 38, 34, K], [160, 122, 76, K], [75, 49, 26, K]],
  // His grey hair under the brim is in the brim's shade: (108, 91, 79).
  elder: [[159, 114, 68, K], [72, 50, 32, K], [124, 82, 46, K], [105, 62, 37, SKIN], [118, 70, 40, SKIN], [151, 131, 114, HAIR],
    [108, 91, 79, HAIR],
    [81, 69, 37, CLOTHING], [83, 71, 38, CLOTHING], [221, 187, 149, K], [224, 192, 154, K], [89, 60, 38, K], [85, 55, 33, K],
    [169, 123, 74, K], [228, 194, 157, K], [87, 75, 39, CLOTHING], [95, 64, 40, K], [84, 55, 34, K]],
  ochre: [[69, 43, 26, HAIR], [248, 154, 84, SKIN], [241, 139, 69, SKIN], [239, 137, 68, SKIN], [222, 138, 51, CLOTHING],
    [217, 139, 55, CLOTHING], [220, 140, 55, CLOTHING], [79, 48, 26, K], [111, 83, 63, K], [81, 47, 25, K], [76, 48, 26, K],
    [117, 88, 67, K], [87, 51, 27, K], [214, 133, 45, CLOTHING]],
  'rust-woman': [[228, 181, 129, K], [189, 132, 79, K], [183, 125, 71, K], [77, 44, 21, HAIR], [233, 130, 62, SKIN],
    [216, 118, 54, SKIN], [168, 66, 35, CLOTHING], [160, 62, 32, CLOTHING], [157, 62, 30, CLOTHING], [237, 200, 157, K],
    [243, 209, 170, K], [193, 117, 45, K], [84, 46, 22, K], [235, 210, 168, K], [244, 224, 192, K], [199, 121, 48, K],
    [81, 42, 18, K]],
  teal: [[58, 40, 30, HAIR], [173, 92, 45, SKIN], [153, 78, 37, SKIN], [170, 91, 44, SKIN], [78, 96, 87, CLOTHING],
    [83, 103, 95, CLOTHING], [221, 189, 154, K], [228, 195, 159, K], [176, 115, 38, K], [77, 45, 26, K], [232, 200, 165, K],
    [181, 120, 40, K], [74, 48, 27, K]],
  indigo: [[63, 43, 32, HAIR], [203, 107, 49, SKIN], [199, 101, 45, SKIN], [239, 204, 164, K], [61, 80, 102, CLOTHING],
    [65, 83, 104, CLOTHING], [84, 50, 28, K], [240, 220, 188, K], [92, 55, 28, K]],
  blue: [[55, 39, 29, HAIR], [230, 157, 95, SKIN], [216, 138, 77, SKIN], [225, 150, 88, SKIN], [160, 104, 56, K],
    [84, 93, 102, CLOTHING], [89, 98, 107, CLOTHING], [165, 122, 75, K], [172, 130, 82, K], [84, 54, 33, K], [163, 107, 61, K],
    [169, 127, 79, K], [87, 57, 34, K]],
  'blue-girl': [[72, 42, 24, HAIR], [248, 162, 93, SKIN], [238, 141, 69, SKIN], [245, 150, 80, SKIN], [74, 99, 124, CLOTHING],
    [86, 106, 123, CLOTHING], [244, 211, 174, K], [87, 50, 26, K], [246, 214, 179, K], [89, 52, 28, K]],
  // Her children (2026-09-29), and the colours Claude's children are painted in (scripts/claude-art/kit/style.mjs `CAST`).
  girl: [[70, 43, 27, HAIR], [63, 36, 21, HAIR], [223, 124, 54, SKIN], [182, 91, 29, SKIN], [203, 107, 45, SKIN], [213, 118, 48, SKIN],
    [218, 122, 51, SKIN], [164, 80, 29, SKIN], [180, 84, 56, CLOTHING], [165, 75, 50, CLOTHING], [181, 81, 55, CLOTHING],
    [168, 73, 49, CLOTHING], [183, 86, 58, CLOTHING], [142, 60, 41, CLOTHING], [115, 45, 28, CLOTHING], [241, 208, 167, K],
    [245, 212, 172, K], [235, 200, 158, K], [189, 151, 111, K], [199, 158, 114, K], [88, 51, 27, K], [93, 54, 28, K],
    [227, 160, 117, SKIN], [74, 47, 31, HAIR], [194, 88, 60, CLOTHING], [248, 215, 174, K]],
  boy: [[198, 134, 66, HAIR], [90, 53, 25, K], [247, 164, 101, SKIN], [235, 145, 86, SKIN], [238, 154, 94, SKIN], [243, 158, 95, SKIN],
    [247, 160, 98, SKIN], [200, 110, 57, SKIN], [241, 207, 163, CLOTHING], [237, 204, 163, CLOTHING], [238, 202, 155, CLOTHING],
    [244, 212, 173, CLOTHING], [108, 66, 36, K], [110, 69, 39, K], [113, 72, 42, K],
    [250, 169, 112, SKIN], [216, 176, 112, HAIR], [242, 212, 170, CLOTHING], [106, 65, 35, K]],
  smallchild: [[77, 44, 24, HAIR], [225, 127, 57, SKIN], [197, 105, 41, SKIN], [207, 110, 43, SKIN], [213, 118, 48, SKIN],
    [218, 123, 54, SKIN], [216, 119, 50, SKIN], [221, 120, 51, SKIN], [243, 214, 175, CLOTHING], [240, 204, 161, CLOTHING],
    [244, 210, 168, CLOTHING], [194, 156, 111, CLOTHING], [184, 145, 100, CLOTHING],
    [228, 122, 54, SKIN], [69, 41, 22, HAIR], [246, 212, 170, CLOTHING]],
};
/**
 * How the figure is dressed, measured in faces on the south idle: `hatted` - the hair shows only below a hat or bonnet, never
 * above the face, where the hat band is the hair's brown; `beard` - how far below the face hair may hang (a beard, curls to
 * the shoulder, a braid to the waist); `reach` - how far below the face the dyed garment goes (a shirt to the belt, a dress
 * to the hem), so a stool or a sack of the shirt's colour further down is left alone; `hands` - how far below the face a
 * hand hangs (a skirt's shadow further down is the skin's brown). A small face under a wide brim makes the men's numbers
 * larger.
 */
const HEADS = {
  rust: { hatted: true, beard: .5, reach: 3, hands: 3.3 }, elder: { hatted: true, beard: .75, reach: 3.5, hands: 3.1 },
  // Her two women with aprons wear a golden skirt that is kept as painted; only the dress top above it is dyed.
  'rust-woman': { hatted: true, beard: .5, reach: 2.5, hands: 2.3 }, ochre: { hatted: false, beard: .1, reach: 3, hands: 2.4 },
  teal: { hatted: false, beard: .55, reach: 2.2, hands: 2.2 }, indigo: { hatted: false, beard: .6, reach: 6.5, hands: 2.2 },
  // Her girl's braid hangs over her shoulder to the waist, and no further: her boots below are the braid's brown.
  blue: { hatted: false, beard: .1, reach: 3, hands: 2.2 }, 'blue-girl': { hatted: false, beard: 1.8, reach: 6, hands: 2 },
  // Her children, measured on their south idles (2026-09-29): the girl's braid to the waist, her dress to the hem and her legs below it as she walks; the boy's
  // shirt to the waistband, his hands and his bare feet; the small child's smock to the hem and bare feet.
  girl: { hatted: false, beard: .8, reach: 2.5, hands: 2.7 }, boy: { hatted: false, beard: .1, reach: 1.4, hands: 3.2 },
  smallchild: { hatted: false, beard: .3, reach: 2.2, hands: 2.6 },
};
/**
 * A figure's measured colours, and its `sources` tokens, which are what the Claude-drawn frames are painted in
 * (scripts/claude-art/kit/style.mjs `CAST`). The hair token only for a figure with no hair measured: her rust man's token
 * is as cold as his scarf.
 */
const refsOf = variant => {
  const own = REFS[variant] || [];
  const source = sources[variant];
  const tokens = [[SKIN, source.skin], [HAIR, source.hair], [CLOTHING, source.clothing]]
    .filter(([part]) => part !== HAIR || !own.some(ref => ref[3] === HAIR)).map(([part, colour]) => [...colour, part]);
  return [...own, ...tokens];
};

const rgb = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
const light = (r, g, b) => .299 * r + .587 * g + .114 * b;
const clamp = n => Math.max(0, Math.min(255, Math.round(n)));
const VARIANTS = Object.keys(sources).sort((a, b) => b.length - a.length);
export const variantOf = frameName => VARIANTS.find(name => frameName.startsWith(name + '-')) || null;

// Region growing (see the header): a step to a neighbour of at most STEP in every channel, and never further than DRIFT
// from the region's own average. Measured on her eight south idles, 2026-09-28: these keep the elder's face apart from his
// beard and the rust man's forehead apart from his brim, and leave each garment one region.
const STEP = 22, DRIFT = 45, INK = 38;
/** Darker than ink but not black: hair painted in shadow, dyed where hair surrounds it. */
const DARK_HAIR = 18;
/** A region this small is a speck of texture or an edge, and takes its part from what it touches. */
const SPECK = 60;
/** Further than this from every measured colour, a region is kept as painted. */
const FAR = 60 * 60;
/** Clothing is dyed only this close to the garment's colour: a hoe's blade or haft is further off. */
const GARMENT = 42 * 42;
/** Within this of a skin colour, a region may be the face. */
const SKINLIKE = 30 * 30;
/** Ink pixels inside a face's outline - eyes, brows, a mouth - that a skin-coloured hat or fist does not have (it has < 8). */
const FEATURES = 15;
/** Within this of the hair's own colour, a region on the head is hair. */
const HAIRLIKE = 40 * 40;
/** A speck on the figure's outer edge is hair only this close to the hair's own colour. */
const CURL = 22 * 22;

/**
 * How far apart two colours are: the plain distance, plus their difference in hue (each channel's share of the whole), so
 * that her ochre man's sunlit sleeve - as bright as his cheek, but yellower - is nearer his shirt than his skin.
 */
function distance(r, g, b, r2, g2, b2) {
  const sum = r + g + b || 1, sum2 = r2 + g2 + b2 || 1;
  const hue = (r / sum - r2 / sum2) ** 2 + (g / sum - g2 / sum2) ** 2 + (b / sum - b2 / sum2) ** 2;
  return (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2 + HUE * HUE * hue;
}
const HUE = 600;
function nearest(refs, r, g, b, allowed) {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    if (allowed && !allowed(ref[3])) continue;
    const d = distance(ref[0], ref[1], ref[2], r, g, b);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best < 0 ? { part: 0, d: Infinity } : { part: refs[best][3], d: bestD };
}

/**
 * Which part each pixel of this frame is: 0 kept, 1 skin, 2 hair, 3 clothing. Pure; depends only on the pixels and the
 * figure. Exported for the proofs (scripts/looks-face-proof.mjs) and the unit test.
 */
export function framePartsOf(imageData, frameName, debug = null) {
  const variant = variantOf(frameName);
  const { data, width, height } = imageData;
  const n = width * height;
  const parts = new Uint8Array(n);
  if (!variant) return parts;
  const refs = refsOf(variant), head = HEADS[variant];
  const region = new Int32Array(n).fill(-1);
  const ok = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    ok[p] = data[i + 3] >= 32 && light(data[i], data[i + 1], data[i + 2]) >= INK ? 1 : 0;
  }
  // ---- regions
  const stats = []; // per region: count, r, g, b, x, y, minY, maxY, minX, maxX
  const stack = new Int32Array(n);
  for (let seed = 0; seed < n; seed++) {
    if (!ok[seed] || region[seed] >= 0) continue;
    const id = stats.length;
    let top = 0, count = 0, sr = 0, sg = 0, sb = 0, sx = 0, sy = 0, minY = height, maxY = 0, minX = width, maxX = 0;
    stack[top++] = seed; region[seed] = id;
    while (top) {
      const p = stack[--top], i = p * 4, x = p % width, y = (p - x) / width;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      count++; sr += r; sg += g; sb += b; sx += x; sy += y;
      if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x;
      const mr = sr / count, mg = sg / count, mb = sb / count;
      for (let k = 0; k < 4; k++) {
        const q = k === 0 ? (x + 1 < width ? p + 1 : -1) : k === 1 ? (x > 0 ? p - 1 : -1) : k === 2 ? (y + 1 < height ? p + width : -1) : (y > 0 ? p - width : -1);
        if (q < 0 || !ok[q] || region[q] >= 0) continue;
        const j = q * 4, qr = data[j], qg = data[j + 1], qb = data[j + 2];
        if (Math.abs(qr - r) > STEP || Math.abs(qg - g) > STEP || Math.abs(qb - b) > STEP) continue;
        if (Math.abs(qr - mr) > DRIFT || Math.abs(qg - mg) > DRIFT || Math.abs(qb - mb) > DRIFT) continue;
        region[q] = id; stack[top++] = q;
      }
    }
    stats.push({ count, r: sr / count, g: sg / count, b: sb / count, x: sx / count, y: sy / count, minY, maxY, minX, maxX, part: -1 });
  }
  // ---- the regions big enough to judge by their own colour, and the face among them
  const big = stats.filter(s => s.count >= SPECK);
  // The face: a skin-coloured region in the upper half of the figure that is a face's shape - not the thin band of a sunlit
  // brim's underside, which is the skin's colour in her work frames. A pose with no face in view (her back-turned frames)
  // has none: then a hatted figure shows no hair (her hat band is the hair's brown) and a bare head's hair is judged by the
  // upper third of the frame. Skin-coloured is near a skin colour, not nearest one: her elder's face in shadow is the brown
  // of his trousers.
  const skinRefs = refs.filter(ref => ref[3] === SKIN);
  // An ear seen from behind is skin-coloured and the right shape, and far too small to be a face.
  let opaque = 0;
  for (let p = 0; p < n; p++) if (data[p * 4 + 3] >= 32) opaque++;
  const faces = big.filter(s => s.count >= .008 * opaque && nearest(skinRefs, s.r, s.g, s.b).d <= SKINLIKE && s.y < height * .5
    && [SKIN, K].includes(nearest(refs, s.r, s.g, s.b).part)
    && s.maxY - s.minY + 1 >= .45 * (s.maxX - s.minX + 1));
  // What each candidate holds inside its own outline, row by row: ink (eyes, brows, a mouth) and white (the eyes' light).
  for (const s of faces) {
    const id = stats.indexOf(s);
    let holes = 0, whites = 0;
    for (let y = s.minY; y <= s.maxY; y++) {
      let left = -1, right = -1;
      for (let x = s.minX; x <= s.maxX; x++) if (region[y * width + x] === id) { if (left < 0) left = x; right = x; }
      for (let x = left + 1; left >= 0 && x < right; x++) {
        const p = y * width + x;
        if (region[p] === id) continue;
        const i = p * 4;
        if (data[i + 3] < 32) continue;
        if (!ok[p]) holes++;
        else if (Math.min(data[i], data[i + 1], data[i + 2]) > 190) whites++;
      }
    }
    s.holes = holes; s.whites = whites;
  }
  // A face is the one with features in it; a hat's crown, the shadow under a brim or a fist has next to none. A face too
  // small to show its features (her profile at work) is the largest candidate, when no candidate has features.
  const featured = faces.filter(s => s.holes >= FEATURES);
  let face = null;
  for (const s of featured.length ? featured : faces) if (!face || s.count > face.count) face = s;
  const faceH = face ? face.maxY - face.minY + 1 : height * .12, faceW = face ? face.maxX - face.minX + 1 : width * .3;
  const onHead = s => face
    ? s.y >= face.minY - (head.hatted ? .15 : 1.3) * faceH && s.y <= face.maxY + head.beard * faceH
      && s.x >= face.minX - faceW && s.x <= face.maxX + faceW
    : !head.hatted && s.y < height * .33;
  // Clothing is below the face and no further down than the garment reaches; skin is never above the face, where a hat is.
  // (Below the face's chin, not its middle: the shading of a lip or a nostril is the rust shirt's colour.)
  const belowFace = s => face ? s.y > face.maxY + .1 * faceH && s.y <= face.maxY + head.reach * faceH : s.y > height * .3 && s.y < height * .9;
  // Skin is the face and the hands: never above the face (a hat), never bigger than the face (her elder's trousers are his
  // skin's brown, and far bigger than a hand), and never further down than a hand reaches (a stool).
  const skinPlace = s => !face || s === face || (s.y >= face.minY - .1 * faceH && s.count <= 1.2 * face.count
    && s.y <= face.maxY + head.hands * faceH);
  const allowedFor = s => part => (part !== HAIR || onHead(s)) && (part !== CLOTHING || belowFace(s)) && (part !== SKIN || skinPlace(s));
  // On the head, a region in the hair's own colours is hair, though a hat band, a scarf or boots elsewhere share them. Her
  // hair is a warm brown and her scarves a cold one, so the warmth has to match as well as the colour.
  const hairRefs = refs.filter(ref => ref[3] === HAIR);
  const hairLike = s => hairRefs.some(ref => (ref[0] - s.r) ** 2 + (ref[1] - s.g) ** 2 + (ref[2] - s.b) ** 2 <= HAIRLIKE
    && Math.abs((s.r - s.b) - (ref[0] - ref[2])) <= 10);
  // A hat band tipped down with the head (her injured and sitting frames) comes down level with the face; it is still a band -
  // starting above the face and wider than any hair under a brim.
  const band = s => head.hatted && face && s.minY < face.minY && s.maxX - s.minX + 1 > 1.6 * faceW;
  const judge = s => {
    if (onHead(s) && hairLike(s) && !band(s)) return HAIR;
    // Nearest the garment but where no garment can be (a sleeve up by a bowed head): kept as painted, never taken for the
    // next-nearest part - her shirts' sunlit side is next nearest her skin.
    const any = nearest(refs, s.r, s.g, s.b), allowed = allowedFor(s);
    if (!allowed(any.part)) return 0;
    return any.d <= (any.part === CLOTHING ? GARMENT : FAR) ? any.part : 0;
  };
  for (const s of big) s.part = s === face ? SKIN : judge(s);
  // ---- the specks take the part of the like-coloured region they touch, spreading a few steps in from the big regions
  for (let pass = 0; pass < 4; pass++) {
    const touching = new Map();
    for (let p = 0; p < n; p++) {
      const id = region[p];
      if (id < 0 || stats[id].part >= 0) continue;
      const x = p % width;
      for (const q of [x + 1 < width ? p + 1 : -1, x > 0 ? p - 1 : -1, p + width < n ? p + width : -1, p - width]) {
        if (q < 0) continue;
        const other = region[q];
        if (other < 0 || stats[other].part < 0) continue;
        if (!touching.has(id)) touching.set(id, new Set());
        touching.get(id).add(other);
      }
    }
    if (!touching.size) break;
    for (const [id, others] of touching) {
      const s = stats[id];
      // A fleck of the hair's own brown on the head is hair, whatever it touches: her beards are flecks between ink.
      if (onHead(s) && hairLike(s) && !band(s)) { s.part = HAIR; continue; }
      let best = null, bestD = Infinity;
      for (const other of others) {
        const o = stats[other], d = distance(o.r, o.g, o.b, s.r, s.g, s.b);
        if (d < bestD) { bestD = d; best = o; }
      }
      // Like-coloured, or a deeper shade of what it touches: where her skin meets its outline it darkens and warms (a cheek's
      // orange rim), and left as painted that rim rings a dark face in orange.
      s.part = bestD <= 45 * 45 || best.part && shadeOf(s, best) ? best.part : judge(s);
    }
  }
  // A speck that touches nothing judged is left to its own colour - unless it is on the figure's outer edge, where it is
  // mostly the antialiasing of the outline against the ground and stays as painted (a blond fleck on a hat brim otherwise).
  // A curl drawn against the ground is on the edge too; it is hair when it is the hair's own brown, closely.
  const edge = new Uint8Array(stats.length);
  for (let p = 0; p < n; p++) {
    const id = region[p];
    if (id < 0 || stats[id].part >= 0 || edge[id]) continue;
    const x = p % width;
    for (const q of [x + 1 < width ? p + 1 : -1, x > 0 ? p - 1 : -1, p + width < n ? p + width : -1, p - width]) {
      if (q < 0 || data[q * 4 + 3] < 32) { edge[id] = 1; break; }
    }
  }
  const curl = s => onHead(s) && hairLike(s) && nearest(hairRefs, s.r, s.g, s.b).d <= CURL ? HAIR : 0;
  const edgeSpeck = s => { const part = judge(s); return part === HAIR ? curl(s) : part; };
  for (let id = 0; id < stats.length; id++) if (stats[id].part < 0) stats[id].part = edge[id] ? edgeSpeck(stats[id]) : judge(stats[id]);
  for (let p = 0; p < n; p++) if (region[p] >= 0) parts[p] = stats[region[p]].part;
  // Her dark-haired figures' hair is painted nearly as dark as ink (the rust man's curls and beard are mostly below it), so
  // only its flecks were dyed and a fair choice left him dark-haired. A dark pixel among hair, well inside it - most of the
  // 5x5 around it hair and none of it skin - is hair; the outline between hair and face touches skin and stays ink.
  for (let pass = 0; pass < 2; pass++) {
    const grow = [];
    for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
      const p = y * width + x, i = p * 4;
      if (ok[p] || parts[p] || data[i + 3] < 32 || light(data[i], data[i + 1], data[i + 2]) < DARK_HAIR) continue;
      let hair = 0, skin = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const part = parts[p + dy * width + dx];
        if (part === HAIR) hair++; else if (part === SKIN) skin++;
      }
      if (hair >= 6 && !skin) grow.push(p);
    }
    for (const p of grow) parts[p] = HAIR;
  }
  if (debug) Object.assign(debug, { face, stats, faces });
  parts.lip = face ? lipOf(face, stats.indexOf(face), region, data, width, faceW, faceH) : null;
  return parts;
}

/**
 * Where a painted moustache goes: the top of the mouth, which is the lowest feature painted inside the face's own outline -
 * her mouths are a red line, not ink (the eyes and brows are higher; the chin's line is its edge, not inside it). Null when the
 * face shows no mouth, or one off to the side (a profile).
 */
function lipOf(face, id, region, data, width, faceW, faceH) {
  let top = -1, x0 = Infinity, x1 = -1;
  for (let y = face.maxY; y >= face.minY + .5 * faceH; y--) {
    let left = -1, right = -1, inked = 0, ix0 = Infinity, ix1 = -1;
    for (let x = face.minX; x <= face.maxX; x++) if (region[y * width + x] === id) { if (left < 0) left = x; right = x; }
    for (let x = left + 1; left >= 0 && x < right; x++) {
      const p = y * width + x;
      if (region[p] === id || data[p * 4 + 3] < 32) continue;
      inked++; if (x < ix0) ix0 = x; if (x > ix1) ix1 = x;
    }
    if (inked >= 2) { top = y; x0 = Math.min(x0, ix0); x1 = Math.max(x1, ix1); } else if (top >= 0) break;
  }
  // ceiling: a father with a moustache shows it facing the viewer and not in profile (FACING_US); A18's layer draws both.
  if (top < 0 || Math.abs((x0 + x1) / 2 - (face.minX + face.maxX) / 2) > .12 * faceW) return null;
  return { x0, x1, y: top, faceW, faceH };
}

const partsCache = new Map();
const PARTS_LIMIT = 400;
function cachedParts(imageData, frameName) {
  const key = `${frameName}:${imageData.width}x${imageData.height}`;
  let parts = partsCache.get(key);
  if (!parts) {
    parts = framePartsOf(imageData, frameName);
    partsCache.set(key, parts);
    if (partsCache.size > PARTS_LIMIT) partsCache.delete(partsCache.keys().next().value);
  }
  return parts;
}

/** A pure pixel transform, shared by idle, walk, work, care and battle frames. */
export function recolourPersonFrame(imageData, frameName, appearance) {
  const variant = variantOf(frameName);
  if (!variant || !appearance) return imageData;
  const source = sources[variant], target = {
    skin: rgb(SKIN_COLOURS[appearance.skin] || SKIN_COLOURS.olive),
    hair: rgb(HAIR_COLOURS[appearance.hair] || HAIR_COLOURS.brown),
    clothing: rgb(CLOTHING_COLOURS[appearance.clothing] || CLOTHING_COLOURS.rust),
  };
  const { data } = imageData;
  const parts = cachedParts(imageData, frameName);
  const isWoman = ['teal', 'rust-woman', 'indigo', 'blue-girl'].includes(variant);
  for (let p = 0; p < parts.length; p++) {
    const part = PART_NAMES[parts[p]];
    if (!part) continue;
    const index = p * 4, brightness = light(data[index], data[index + 1], data[index + 2]);
    const original = source[part], desired = target[part];
    // Preserve the painted light/dark value and a little of each original brush mark.
    const ratio = Math.max(.44, Math.min(part === 'clothing' ? 1.22 : 1.48, brightness / light(...original)));
    const strength = part === 'clothing' && isWoman ? .96 : .97;
    for (let c = 0; c < 3; c++) data[index + c] = clamp((1 - strength) * data[index + c] + strength * desired[c] * ratio);
  }
  if (appearance.head === 'moustache' && MOUSTACHED.has(variant) && FACING_US.test(frameName) && parts.lip) paintMoustache(data, imageData.width, parts, target.hair);
  return imageData;
}

/**
 * stand-in: docs/ART_REQUESTS.md A18, "layered people" (its `--moustache` layer). No figure of hers has a moustache without
 * a beard, so a father who chooses one is drawn in her bareheaded ochre man - a young, clean-shaven face - and the choice showed nothing of what it
 * named (found 2026-09-29: with Fair hair, the "Moustache" tile was the same beardless blond face as "Bareheaded"). Until her
 * layered moustache arrives, one is painted in the hair colour above the mouth the palette found, on the face's own skin
 * only, so it never lands off the face. Retire it, and this set, when the `--moustache` layer is wired.
 */
const MOUSTACHED = new Set(['ochre']);
/** The frames that face the viewer (-idle-s, -walk-s-1, -ride-s-2): a band across a face in profile reads as a gag. */
const FACING_US = /-s(-\d+)?$/;
function paintMoustache(data, width, parts, hair) {
  const { x0, x1, y, faceW, faceH } = parts.lip;
  const thick = Math.max(2, Math.round(faceH * .09)), centre = (x0 + x1) / 2;
  const half = Math.max((x1 - x0) / 2 + .1 * faceW, .17 * faceW);
  for (let row = -thick - 1; row <= 1; row++) {
    const py = y + row;
    // Fullest just above the lip, narrowing upward; its ends droop a little beside the mouth.
    const reach = row > 0 ? half : half * (1 - .35 * (-row - 1) / thick);
    for (let px = Math.round(centre - reach); px <= Math.round(centre + reach); px++) {
      const p = py * width + px;
      if (p < 0 || p >= parts.length || parts[p] !== SKIN) continue;
      if (row >= 0 && Math.abs(px - centre) < half * .7) continue;
      const shade = row === -thick - 1 || row >= 0 ? .62 : .85, i = p * 4;
      for (let c = 0; c < 3; c++) data[i + c] = clamp(hair[c] * shade);
    }
  }
}

/** What makes a recoloured frame different: the colours, and the one head choice painted on rather than chosen by figure. */
export const paletteKey = appearance => `${appearance.skin}|${appearance.hair}|${appearance.clothing}${appearance.head === 'moustache' ? '|moustache' : ''}`;
