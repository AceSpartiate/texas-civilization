// Pixel helpers for area F's stand-ins (docs/CLAUDE_ART_PLAN.md, area F): reading one of Astra's frames out of her sheet,
// sampling and writing premultiplied RGBA, and encoding a PNG, with no image dependency (node's zlib and the atlas
// builder's own decoder). Her files are only ever read.
//
// Used where a Claude stand-in is a *bend* of her own painting rather than a drawing of Claude's: the gale poses of her
// upright trees (scripts/claude-art/areas/land-gale.mjs). The bent painting is embedded in the frame's SVG as a PNG, so the
// frame's source on disk is the whole of what is rasterised.
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { decodeRgba } from '../../build-atlas-manifest.mjs';

const ASTRA = new URL('../../../public/assets/frontier-v1/', import.meta.url);
export const ASTRA_ATLAS = JSON.parse(readFileSync(new URL('atlas.json', ASTRA), 'utf8'));
const decoded = new Map();

/** An image: w by h, premultiplied RGBA floats 0..1 in `d`. */
export function blank(w, h) { return { w, h, d: new Float32Array(w * h * 4) }; }

/** One of Astra's frames, cut out of her sheet: { name, w, h, anchorX, anchorY, img, sha }. */
export function astraFrame(name) {
  const f = ASTRA_ATLAS.frames[name];
  if (!f) throw new Error(`Astra's atlas has no frame ${name}`);
  let sheet = decoded.get(f.sheet);
  if (!sheet) { sheet = decodeRgba(readFileSync(new URL(ASTRA_ATLAS.sheets[f.sheet].image, ASTRA))); decoded.set(f.sheet, sheet); }
  const img = blank(f.w, f.h), hash = createHash('sha256');
  for (let y = 0; y < f.h; y++) {
    const row = sheet.data.subarray(((f.y + y) * sheet.width + f.x) * 4, ((f.y + y) * sheet.width + f.x + f.w) * 4);
    hash.update(row);
    for (let x = 0; x < f.w; x++) {
      const a = row[x * 4 + 3] / 255, o = (y * f.w + x) * 4;
      img.d[o] = row[x * 4] / 255 * a; img.d[o + 1] = row[x * 4 + 1] / 255 * a; img.d[o + 2] = row[x * 4 + 2] / 255 * a; img.d[o + 3] = a;
    }
  }
  return { name, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY, img, sha: hash.digest('hex').slice(0, 16) };
}

/** Bilinear sample of a premultiplied image; outside it is transparent. Writes into `out` (4 floats). */
export function sample(img, x, y, out) {
  const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5), fx = x - 0.5 - x0, fy = y - 0.5 - y0;
  out[0] = out[1] = out[2] = out[3] = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const px = x0 + i, py = y0 + j;
    if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
    const wgt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy), o = (py * img.w + px) * 4;
    out[0] += img.d[o] * wgt; out[1] += img.d[o + 1] * wgt; out[2] += img.d[o + 2] * wgt; out[3] += img.d[o + 3] * wgt;
  }
  return out;
}

/** The first and last rows and columns with alpha over `min`. */
export function bounds(img, min = 0.1) {
  let top = img.h, bottom = -1, left = img.w, right = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.d[(y * img.w + x) * 4 + 3] > min) {
    if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x;
  }
  return { top, bottom, left, right };
}

/** Repeatable value noise in 0..1 at a scale of `cell` pixels. */
export function noise(x, y, cell = 6, seed = 1) {
  const h = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return s - Math.floor(s); };
  const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j;
  const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  return (h(i, j) * (1 - su) + h(i + 1, j) * su) * (1 - sv) + (h(i, j + 1) * (1 - su) + h(i + 1, j + 1) * su) * sv;
}
export const smooth = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); out.write(type, 4, 'ascii'); data.copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
/** An 8-bit RGBA PNG of a premultiplied image (un-premultiplied, each row Paeth-filtered, zlib level 9). */
export function encodePng(img) {
  const { w, h, d } = img, stride = w * 4, raw = Buffer.alloc((stride + 1) * h), rows = Buffer.alloc(stride * h);
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3], k = a > 1e-4 ? 1 / a : 0;
    for (let c = 0; c < 3; c++) rows[i * 4 + c] = Math.max(0, Math.min(255, Math.round(d[i * 4 + c] * k * 255)));
    rows[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
    if (rows[i * 4 + 3] === 0) rows[i * 4] = rows[i * 4 + 1] = rows[i * 4 + 2] = 0;
  }
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 4;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? rows[y * stride + i - 4] : 0, b = y ? rows[(y - 1) * stride + i] : 0, c = y && i >= 4 ? rows[(y - 1) * stride + i - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      raw[y * (stride + 1) + 1 + i] = (rows[y * stride + i] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
