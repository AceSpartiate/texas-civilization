// Elevation and ground cover.
//
// Land without relief reads as a flat diagram. This gives the world a height at every
// point, so valleys, uplands and the fall of the ground toward water are visible and can
// later matter to travel, sight and work.
//
// The surface is INVENTED (FIC-GONZ-002). What it is shaped to respect is documented:
// the Guadalupe's valley and the ground falling toward it, and the post oak savannah and
// river timber of HIST-GONZ-012. It is not a survey, a DEM, or a source of real elevations.
// Never print a height in feet to a student as though it were measured.

// Deterministic value noise. A seeded hash keeps the same seed producing the same country
// on every machine and after every reload, which the save format depends on.
function hash2(seed, ix, iy) {
  let value = Math.imul(ix ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(iy ^ 0xc2b2ae35, 0x27d4eb2f) ^ seed;
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
const smooth = t => t * t * (3 - 2 * t);
function noise2(seed, x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = hash2(seed, ix, iy), b = hash2(seed, ix + 1, iy), c = hash2(seed, ix, iy + 1), d = hash2(seed, ix + 1, iy + 1);
  const u = smooth(fx), v = smooth(fy);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function ridged(seed, x, y, octaves = 4) {
  let sum = 0, amplitude = 1, frequency = 1, total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum += noise2(seed + octave * 7919, x * frequency, y * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5; frequency *= 2.07;
  }
  return sum / total;
}

const distanceToSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};
export const distanceToPolyline = (point, points) =>
  points.length < 2 ? Infinity : Math.min(...points.slice(1).map((p, i) => distanceToSegment(point, points[i], p)));

/**
 * Builds an elevation sampler over the region. Heights are in feet above the river,
 * which is a relative gameplay surface, not a measured datum.
 */
export function createRelief({ seed = 'gonzales', watercourses = [], base = 60, relief = 190 } = {}) {
  let numeric = 0;
  for (const character of String(seed)) numeric = (Math.imul(numeric, 31) + character.charCodeAt(0)) | 0;

  function heightAt(x, y) {
    // Rolling country: broad swells with finer texture on top.
    const broad = ridged(numeric, x / 26, y / 26, 4);
    const fine = ridged(numeric + 104729, x / 6.5, y / 6.5, 3);
    let height = base + (broad * 0.78 + fine * 0.22) * relief;
    // Ground falls toward water. Each watercourse cuts a valley whose depth and width
    // follow its size, so the river reads as the lowest line in the country.
    for (const course of watercourses) {
      const distance = distanceToPolyline({ x, y }, course.points);
      const width = course.valleyWidth ?? 2.4;
      if (distance < width) {
        const fall = 1 - smooth(Math.min(1, distance / width));
        height -= (course.incision ?? 70) * fall;
      }
    }
    return height;
  }
  return {
    heightAt,
    // Slope in feet per mile, used for shading and later for travel and sight.
    slopeAt(x, y, step = 0.35) {
      const dzdx = (heightAt(x + step, y) - heightAt(x - step, y)) / (2 * step);
      const dzdy = (heightAt(x, y + step) - heightAt(x, y - step)) / (2 * step);
      return { dzdx, dzdy, grade: Math.hypot(dzdx, dzdy) };
    },
  };
}

/**
 * Samples the relief onto a coarse grid the client can render without recomputing noise.
 * Kept small on purpose: this travels in every snapshot as public geography.
 */
const noNegativeZero = value => value === 0 ? 0 : value;
export function sampleReliefGrid(relief, bounds, columns = 64) {
  const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
  const rows = Math.max(8, Math.round(columns * height / width));
  const cellX = width / (columns - 1), cellY = height / (rows - 1);
  const values = [];
  let low = Infinity, high = -Infinity;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const value = relief.heightAt(bounds.minX + column * cellX, bounds.minY + row * cellY);
      values.push(noNegativeZero(Math.round(value)));
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }
  return { columns, rows, minX: noNegativeZero(bounds.minX), minY: noNegativeZero(bounds.minY), cellX: noNegativeZero(+cellX.toFixed(4)), cellY: noNegativeZero(+cellY.toFixed(4)), low: noNegativeZero(Math.round(low)), high: noNegativeZero(Math.round(high)), values };
}

/**
 * Ground cover follows height above the water and distance from it, per HIST-GONZ-012:
 * timber along the watercourses, open post oak savannah on the rolling ground between.
 */
export function coverAt(relief, watercourses, x, y) {
  const nearest = Math.min(...watercourses.map(course => distanceToPolyline({ x, y }, course.points)), Infinity);
  if (nearest < 0.28) return 'water';
  if (nearest < 1.15) return 'timber';
  if (nearest < 2.3) return 'savannah';
  return relief.slopeAt(x, y).grade > 55 ? 'brush' : 'prairie';
}
