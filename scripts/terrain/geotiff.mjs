// A reader for the USGS 3DEP 1 arc-second GeoTIFFs, and nothing more general than that.
//
// Used only by scripts/build-terrain.mjs, at build time, never by the game. Node's standard
// library has no TIFF reader, and this project takes no dependencies, so it reads exactly the
// shape those files have and refuses any other: little- or big-endian classic TIFF, one band of
// 32-bit floats, tiled, LZW-compressed (259 = 5) with no predictor or the floating-point
// predictor (317 = 3), georeferenced by ModelPixelScale and ModelTiepoint.
import { readFileSync } from 'node:fs';

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8, 16: 8 };

function readTags(buffer) {
  const order = buffer.toString('latin1', 0, 2);
  if (order !== 'II' && order !== 'MM') throw new Error('Not a TIFF');
  const le = order === 'II';
  const u16 = offset => le ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  const u32 = offset => le ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
  const f64 = offset => le ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
  if (u16(2) !== 42) throw new Error('Only classic TIFF is read here, not BigTIFF');
  const ifd = u32(4), count = u16(ifd), tags = {};
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    const tag = u16(entry), type = u16(entry + 2), n = u32(entry + 4);
    const size = (TYPE_SIZE[type] || 1) * n;
    const at = size <= 4 ? entry + 8 : u32(entry + 8);
    const read = index => type === 3 ? u16(at + index * 2) : type === 4 ? u32(at + index * 4) : type === 12 ? f64(at + index * 8) : buffer[at + index];
    tags[tag] = type === 2 ? buffer.toString('latin1', at, at + n).replace(/\0+$/, '') : Array.from({ length: n }, (_, index) => read(index));
  }
  return { tags, le };
}

/** TIFF's LZW: MSB-first codes of 9 to 12 bits, 256 clears, 257 ends, and the code width grows one code early. */
function lzwDecode(input, expected) {
  const out = new Uint8Array(expected);
  let written = 0, bitBuffer = 0, bits = 0, position = 0;
  const table = new Array(4096);
  for (let i = 0; i < 256; i++) table[i] = Uint8Array.of(i);
  let next = 258, width = 9, previous = null;
  while (written < expected) {
    while (bits < width) {
      if (position >= input.length) return out;
      bitBuffer = ((bitBuffer << 8) | input[position++]) >>> 0; bits += 8;
    }
    const code = (bitBuffer >>> (bits - width)) & ((1 << width) - 1);
    bits -= width;
    if (code === 257) break;
    if (code === 256) { next = 258; width = 9; previous = null; continue; }
    let entry;
    if (code < next && table[code]) entry = table[code];
    else if (code === next && previous) { entry = new Uint8Array(previous.length + 1); entry.set(previous); entry[previous.length] = previous[0]; }
    else throw new Error(`Bad LZW code ${code}`);
    out.set(entry.subarray(0, Math.min(entry.length, expected - written)), written);
    written += entry.length;
    if (previous) {
      const added = new Uint8Array(previous.length + 1);
      added.set(previous); added[previous.length] = entry[0];
      table[next++] = added;
    }
    previous = entry;
    if (next + 1 >= (1 << width) && width < 12) width++;
  }
  return out;
}

/**
 * Open one elevation tile. Returns its size, its georeferencing, and `tile(index)`, which decodes
 * one tile to a Float32Array of metres (NaN where there is no data).
 */
export function openElevation(path) {
  const buffer = readFileSync(path);
  const { tags, le } = readTags(buffer);
  const width = tags[256][0], height = tags[257][0];
  if (tags[258][0] !== 32 || tags[339]?.[0] !== 3 || (tags[277]?.[0] ?? 1) !== 1) throw new Error(`${path}: expected one band of 32-bit floats`);
  if (tags[259][0] !== 5) throw new Error(`${path}: expected LZW compression`);
  const predictor = tags[317]?.[0] ?? 1;
  if (![1, 3].includes(predictor)) throw new Error(`${path}: unexpected predictor ${predictor}`);
  const tileWidth = tags[322]?.[0], tileHeight = tags[323]?.[0];
  if (!tileWidth || !tileHeight) throw new Error(`${path}: expected a tiled TIFF`);
  const offsets = tags[324], counts = tags[325];
  const [scaleX, scaleY] = tags[33550];
  const [, , , tieLon, tieLat] = tags[33922];
  const noData = tags[42113] !== undefined ? Number(tags[42113]) : null;
  const across = Math.ceil(width / tileWidth);
  const tile = index => {
    const raw = lzwDecode(buffer.subarray(offsets[index], offsets[index] + counts[index]), tileWidth * tileHeight * 4);
    const values = new Float32Array(tileWidth * tileHeight);
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    if (predictor === 3) {
      // The floating-point predictor: each row's bytes were differenced byte by byte, then laid out
      // by byte plane, most significant plane first. Undo the difference, then put the planes back.
      const rowBytes = tileWidth * 4, row = new Uint8Array(rowBytes);
      for (let y = 0; y < tileHeight; y++) {
        const start = y * rowBytes;
        for (let i = 1; i < rowBytes; i++) raw[start + i] = (raw[start + i] + raw[start + i - 1]) & 0xff;
        for (let x = 0; x < tileWidth; x++) {
          row[0] = raw[start + x]; row[1] = raw[start + tileWidth + x]; row[2] = raw[start + 2 * tileWidth + x]; row[3] = raw[start + 3 * tileWidth + x];
          const value = new DataView(row.buffer).getFloat32(0, false);
          values[y * tileWidth + x] = noData !== null && value === noData ? NaN : value;
        }
      }
    } else {
      for (let i = 0; i < values.length; i++) {
        const value = view.getFloat32(i * 4, le);
        values[i] = noData !== null && value === noData ? NaN : value;
      }
    }
    return values;
  };
  return {
    width, height, tileWidth, tileHeight, tiles: offsets.length, across,
    // Pixel-is-area: the tie point is the outer corner of the first pixel.
    lonOf: column => tieLon + (column + 0.5) * scaleX,
    latOf: row => tieLat - (row + 0.5) * scaleY,
    columnOf: lon => Math.floor((lon - tieLon) / scaleX),
    rowOf: lat => Math.floor((tieLat - lat) / scaleY),
    tile,
    /** One point's elevation, for checks. */
    at(lon, lat) {
      const column = Math.floor((lon - tieLon) / scaleX), row = Math.floor((tieLat - lat) / scaleY);
      if (column < 0 || row < 0 || column >= width || row >= height) return NaN;
      const index = Math.floor(row / tileHeight) * across + Math.floor(column / tileWidth);
      return tile(index)[(row % tileHeight) * tileWidth + (column % tileWidth)];
    },
  };
}
