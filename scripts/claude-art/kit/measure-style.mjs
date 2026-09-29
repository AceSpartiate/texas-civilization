// Measure the style Claude's stand-ins must match, from Astra's shipped people atlases - never guessed.
//
// Reads public/assets/frontier-v1/atlas.json and the PNGs of `civilians`, `people-walk` and `people-vertical` (and, for the
// cast's colours, the second cast's and the children's matching sheets) and writes scripts/claude-art/kit/measured.json:
//
// - **geometry**: per sheet, the source cell (sheet / 4), each frame's measured box, the per-row `logicalHeight` the atlas
//   builder normalises a row to, the ground anchor (anchorX/anchorY as fractions of the frame), and where the ground sits as
//   a fraction of the logical height - the numbers a Claude frame has to reproduce so it stands the same size and on the
//   same foot line as hers when `drawSprite` scales it (public/art.js: height / logicalHeight).
// - **line**: the outline colour (the dark ring just inside the alpha edge) and its thickness in source pixels, measured by
//   walking inward from the transparent edge along rows.
// - **palette**: per cast figure, the median colour of fixed sample regions of its south idle (hat, hair, skin, shirt,
//   lower garment, boots...), and a quantised histogram of its most common colours, so the rig can be dressed in her colours.
//
// Run: node scripts/claude-art/kit/measure-style.mjs   (no browser needed; reads PNG bytes with the atlas builder's decoder)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeRgba } from '../../build-atlas-manifest.mjs';

const ASTRA = fileURLToPath(new URL('../../../public/assets/frontier-v1/', import.meta.url));
const atlas = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8'));
const images = new Map();
const imageOf = sheet => {
  if (!images.has(sheet)) images.set(sheet, decodeRgba(readFileSync(ASTRA + atlas.sheets[sheet].image)));
  return images.get(sheet);
};
const px = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]; };
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const median = values => { const s = [...values].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const medianColour = colours => colours.length ? [0, 1, 2].map(c => median(colours.map(v => v[c]))) : null;
const round = (v, n = 4) => +v.toFixed(n);
const stats = values => ({ min: round(Math.min(...values)), median: round(median(values)), max: round(Math.max(...values)) });

const GEOMETRY_SHEETS = ['civilians', 'people-walk', 'people-vertical', 'people-cast2-idle', 'people-cast2-walk', 'people-cast2-vertical',
  'people-children-idle', 'people-children-walk', 'people-children-vertical', 'people-work', 'military', 'military-motion'];
const geometry = {};
for (const sheet of GEOMETRY_SHEETS) {
  const spec = atlas.sheets[sheet];
  if (!spec) continue;
  const frames = Object.entries(atlas.frames).filter(([, f]) => f.sheet === sheet);
  const rows = {};
  for (const [name, f] of frames) {
    const row = f.row ?? 0;
    (rows[row] ??= []).push({ name, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY, logicalHeight: f.logicalHeight ?? null,
      // Ground line below the top of the frame, as a fraction of the logical height (the height `drawSprite` is asked for).
      groundOfLogical: round((f.anchorY * f.h) / (f.logicalHeight ?? f.h)),
      heightOfLogical: round(f.h / (f.logicalHeight ?? f.h)),
      widthOfLogical: round(f.w / (f.logicalHeight ?? f.h)) });
  }
  const all = Object.values(rows).flat();
  geometry[sheet] = {
    sheet: { width: spec.width, height: spec.height, cell: [spec.width / (spec.layout?.columns || 4), spec.height / (spec.layout?.rows || 4)] },
    logicalHeight: stats(all.map(f => f.logicalHeight ?? f.h)),
    frameHeight: stats(all.map(f => f.h)),
    frameWidth: stats(all.map(f => f.w)),
    anchorX: stats(all.map(f => f.anchorX)),
    anchorY: stats(all.map(f => f.anchorY)),
    groundOfLogical: stats(all.map(f => f.groundOfLogical)),
    widthOfLogical: stats(all.map(f => f.widthOfLogical)),
    rows,
  };
}

// The outline: the opaque pixel at the alpha edge, and how many dark pixels run inward from there.
function lineOf(sheet) {
  const img = imageOf(sheet), dark = [], runs = [], ink = [];
  for (const f of Object.values(atlas.frames).filter(frame => frame.sheet === sheet)) {
    for (let y = f.y + 1; y < f.y + f.h - 1; y += 2) {
      for (const dir of [1, -1]) {
        let x = dir > 0 ? f.x : f.x + f.w - 1;
        while (x >= f.x && x < f.x + f.w && px(img, x, y)[3] < 128) x += dir;
        if (x < f.x || x >= f.x + f.w) continue;
        let run = 0;
        while (run < 12 && px(img, x + dir * run, y)[3] >= 128 && lum(px(img, x + dir * run, y)) < 72) run++;
        const edge = px(img, x + dir, y);
        if (edge[3] >= 200) dark.push(edge);
        if (run) runs.push(run);
        for (let k = 1; k < run; k++) ink.push(px(img, x + dir * k, y));
      }
    }
  }
  const darkest = dark.sort((a, b) => lum(a) - lum(b)).slice(0, Math.ceil(dark.length / 2));
  // `edge` is the outermost opaque pixel (nearly black where the antialiasing meets the ink); `ink` the body of the line.
  return { edge: hex(medianColour(darkest)), ink: hex(medianColour(ink)), thickness: stats(runs), samples: runs.length };
}
const line = Object.fromEntries(['civilians', 'people-walk', 'people-vertical', 'people-cast2-idle', 'people-children-idle'].map(sheet => [sheet, lineOf(sheet)]));

// Where to sample each figure's colours on its south idle, as fractions of its frame (x across, y down). Chosen by looking
// at the sheets (civilians.png, people-cast2-idle.png, people-children-idle.png); each is the middle of a flat region.
const CAST_S = { rust: 'rust-idle-s', teal: 'teal-idle-s', elder: 'elder-idle-s', blue: 'blue-idle-s', 'rust-woman': 'rust-woman-idle-s',
  indigo: 'indigo-idle-s', ochre: 'ochre-idle-s', 'blue-girl': 'blue-girl-idle-s', girl: 'girl-idle-s', boy: 'boy-idle-s', smallchild: 'smallchild-idle-s' };
const REGIONS = {
  rust: { hat: [0.5, 0.06], hatBand: [0.5, 0.14], skin: [0.55, 0.19], hair: [0.22, 0.21], beard: [0.5, 0.3], shirt: [0.2, 0.42], kerchief: [0.5, 0.36], braces: [0.31, 0.45], trousers: [0.36, 0.7], boots: [0.3, 0.93] },
  teal: { hair: [0.5, 0.05], skin: [0.34, 0.25], blouse: [0.2, 0.4], apron: [0.5, 0.62], skirt: [0.12, 0.84], shoes: [0.4, 0.98] },
  elder: { hat: [0.5, 0.06], hatBand: [0.5, 0.125], skin: [0.47, 0.21], beard: [0.5, 0.33], shirt: [0.1, 0.45], waistcoat: [0.4, 0.5], trousers: [0.36, 0.72], boots: [0.3, 0.93] },
  blue: { hair: [0.5, 0.06], skin: [0.4, 0.26], shirt: [0.18, 0.44], braces: [0.31, 0.44], trousers: [0.37, 0.68], boots: [0.3, 0.93] },
  'rust-woman': { bonnet: [0.5, 0.035], skin: [0.36, 0.26], hair: [0.24, 0.26], blouse: [0.18, 0.42], bow: [0.5, 0.35], apron: [0.5, 0.62], skirt: [0.1, 0.84], shoes: [0.4, 0.98] },
  indigo: { hair: [0.5, 0.05], skin: [0.33, 0.27], kerchief: [0.5, 0.33], dress: [0.25, 0.72], shoes: [0.4, 0.98] },
  ochre: { hair: [0.5, 0.06], skin: [0.36, 0.27], shirt: [0.1, 0.44], waistcoat: [0.38, 0.47], trousers: [0.36, 0.7], boots: [0.3, 0.93] },
  'blue-girl': { hair: [0.5, 0.06], skin: [0.36, 0.27], dress: [0.18, 0.5], apron: [0.5, 0.74], shoes: [0.4, 0.98] },
  girl: { hair: [0.5, 0.06], skin: [0.36, 0.27], dress: [0.18, 0.48], pinafore: [0.5, 0.64], shoes: [0.4, 0.98] },
  boy: { hair: [0.5, 0.06], skin: [0.36, 0.28], shirt: [0.18, 0.44], braces: [0.4, 0.42], trousers: [0.36, 0.7], feet: [0.35, 0.95] },
  smallchild: { hair: [0.5, 0.07], skin: [0.36, 0.28], gown: [0.4, 0.6], feet: [0.4, 0.96] },
};
function sampleRegion(img, f, [fx, fy]) {
  const cx = Math.round(f.x + fx * f.w), cy = Math.round(f.y + fy * f.h), got = [];
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const p = px(img, cx + dx, cy + dy);
    if (p[3] > 200 && lum(p) > 40) got.push(p);
  }
  return got.length ? hex(medianColour(got)) : null;
}
function histogram(img, f, n = 10) {
  const bins = new Map();
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
    const p = px(img, x, y);
    if (p[3] < 250 || lum(p) < 45) continue;
    const key = (p[0] >> 4) << 8 | (p[1] >> 4) << 4 | (p[2] >> 4);
    const bin = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bin.n++; bin.r += p[0]; bin.g += p[1]; bin.b += p[2];
    bins.set(key, bin);
  }
  const total = [...bins.values()].reduce((s, b) => s + b.n, 0);
  return [...bins.values()].sort((a, b) => b.n - a.n).slice(0, n).map(b => ({ colour: hex([b.r / b.n, b.g / b.n, b.b / b.n]), share: round(b.n / total, 3) }));
}
const palette = {};
for (const [figure, frameName] of Object.entries(CAST_S)) {
  const f = atlas.frames[frameName];
  if (!f) continue;
  const img = imageOf(f.sheet);
  palette[figure] = { frame: frameName, at: REGIONS[figure], regions: Object.fromEntries(Object.entries(REGIONS[figure] || {}).map(([k, at]) => [k, sampleRegion(img, f, at)])), common: histogram(img, f) };
}
const out = {
  measuredFrom: "public/assets/frontier-v1/atlas.json and its atlases (Astra's shipped art); written by scripts/claude-art/kit/measure-style.mjs",
  geometry, line, palette,
};
writeFileSync(fileURLToPath(new URL('./measured.json', import.meta.url)), JSON.stringify(out, null, 1) + '\n');
console.log('outline', JSON.stringify(line));
for (const [sheet, g] of Object.entries(geometry)) console.log(sheet, 'cell', g.sheet.cell, 'L', JSON.stringify(g.logicalHeight), 'aY', JSON.stringify(g.anchorY), 'aX', JSON.stringify(g.anchorX), 'ground/L', JSON.stringify(g.groundOfLogical), 'w/L', JSON.stringify(g.widthOfLogical));
for (const [figure, p] of Object.entries(palette)) console.log(figure, JSON.stringify(p.regions));
