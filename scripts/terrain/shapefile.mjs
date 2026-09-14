// Reads ESRI shapefiles (.shp with its .dbf) for scripts/build-terrain.mjs, at build time only.
//
// Only what the USGS National Hydrography Dataset uses: points and polylines (with or without Z
// and M, whose extra values are skipped), and a dBASE table of character and numeric fields.
import { readFileSync } from 'node:fs';

/** Every record of a .dbf as an object of trimmed strings, lower-cased field names. */
export function readDbf(path) {
  const buffer = readFileSync(path);
  const records = buffer.readUInt32LE(4), headerSize = buffer.readUInt16LE(8), recordSize = buffer.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; buffer[offset] !== 0x0d; offset += 32) {
    fields.push({ name: buffer.toString('latin1', offset, offset + 11).replace(/\0.*$/, '').toLowerCase(), length: buffer[offset + 16] });
  }
  const rows = new Array(records);
  for (let record = 0; record < records; record++) {
    let offset = headerSize + record * recordSize + 1;
    const row = {};
    for (const field of fields) { row[field.name] = buffer.toString('latin1', offset, offset + field.length).trim(); offset += field.length; }
    rows[record] = row;
  }
  return rows;
}

/**
 * Every shape of a .shp, in record order: `null` for a null shape, `{ x, y }` for a point, and
 * `{ box, parts }` for a polyline or polygon, where each part is a flat array [x0, y0, x1, y1, ...].
 */
export function readShapes(path) {
  const buffer = readFileSync(path);
  const shapes = [];
  let offset = 100;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset + 4) * 2;
    const at = offset + 8;
    const type = buffer.readInt32LE(at);
    if (type === 0) shapes.push(null);
    else if (type === 1 || type === 11 || type === 21) shapes.push({ x: buffer.readDoubleLE(at + 4), y: buffer.readDoubleLE(at + 12) });
    else if ([3, 5, 13, 15, 23, 25].includes(type)) {
      const box = { minX: buffer.readDoubleLE(at + 4), minY: buffer.readDoubleLE(at + 12), maxX: buffer.readDoubleLE(at + 20), maxY: buffer.readDoubleLE(at + 28) };
      const partCount = buffer.readInt32LE(at + 36), pointCount = buffer.readInt32LE(at + 40);
      const starts = Array.from({ length: partCount }, (_, i) => buffer.readInt32LE(at + 44 + i * 4));
      const pointsAt = at + 44 + partCount * 4;
      const parts = starts.map((start, i) => {
        const end = i + 1 < partCount ? starts[i + 1] : pointCount;
        const flat = new Float64Array((end - start) * 2);
        for (let p = start; p < end; p++) {
          flat[(p - start) * 2] = buffer.readDoubleLE(pointsAt + p * 16);
          flat[(p - start) * 2 + 1] = buffer.readDoubleLE(pointsAt + p * 16 + 8);
        }
        return flat;
      });
      shapes.push({ box, parts });
    } else throw new Error(`${path}: shape type ${type} is not read here`);
    offset = at + length;
  }
  return shapes;
}
