// The province, at one mile per unit, in the same coordinate space as the home country.
//
// This is the "vague generalities" layer: it exists so a student can zoom out and see
// where their family sits in Texas, and so later arcs already have their places on the
// map. Detail thins with distance from Gonzales.
//
// WHAT IS ANCHORED is the arrangement — which river each settlement stood on, which
// rivers join before the coast, the order of the ecoregion belts, and the line of the
// Balcones Escarpment. Every COORDINATE is invented (FIC-GONZ-002). No distance drawn
// here is a measurement, and the shapes are not survey courses. See HISTORY.md
// HIST-TEX-001 through HIST-TEX-005.
//
// Positive x is east, positive y is south. The origin is the Gonzales confluence, so the
// home country sits at (0,0) and the province is laid out around it.

const P = (x, y) => ({ x, y });

// Rivers, west to east, all running broadly north-west to south-east to the Gulf.
// Lengths in the sources are along the real channel, not these generalized lines.
export const RIVERS = [
  { id: 'rio-grande', name: 'Rio Grande', width: 3.4, points: [P(-330, -150), P(-300, -70), P(-262, 10), P(-215, 78), P(-166, 130), P(-120, 168)] },
  { id: 'nueces', name: 'Nueces River', width: 2.2, points: [P(-215, -95), P(-196, -40), P(-171, 18), P(-140, 66), P(-104, 104)] },
  // The San Antonio rises at Bexar and empties into the Guadalupe, not the Gulf.
  { id: 'san-antonio', name: 'San Antonio River', width: 2.0, points: [P(-74, -33), P(-60, 6), P(-42, 44), P(-22, 74), P(-4, 96)] },
  { id: 'guadalupe-lower', name: 'Guadalupe River', width: 2.6, points: [P(-2.7, 25), P(-6, 44), P(-8, 66), P(-4, 96), P(6, 122)] },
  { id: 'guadalupe-upper', name: 'Guadalupe River', width: 2.4, points: [P(-96, -128), P(-70, -104), P(-44, -78), P(-22, -52), P(2.1, -26)] },
  { id: 'san-marcos-upper', name: 'San Marcos River', width: 1.8, points: [P(-56, -74), P(-42, -56), P(-28, -38), P(-13.5, -14)] },
  { id: 'lavaca', name: 'Lavaca River', width: 1.7, points: [P(38, -18), P(44, 14), P(48, 48), P(46, 84), P(40, 108)] },
  { id: 'colorado', name: 'Colorado River', width: 2.8, points: [P(-58, -230), P(-24, -178), P(6, -124), P(40, -68), P(72, -12), P(94, 48), P(104, 96)] },
  { id: 'brazos', name: 'Brazos River', width: 3.0, points: [P(28, -300), P(60, -238), P(88, -180), P(114, -122), P(140, -62), P(158, -2), P(166, 56)] },
  { id: 'san-jacinto', name: 'San Jacinto River', width: 1.6, points: [P(206, -74), P(214, -44), P(220, -16), P(224, 8)] },
  { id: 'trinity', name: 'Trinity River', width: 2.6, points: [P(212, -262), P(230, -196), P(246, -132), P(258, -70), P(262, -14), P(258, 22)] },
  { id: 'neches', name: 'Neches River', width: 2.2, points: [P(300, -216), P(312, -156), P(320, -96), P(326, -38), P(330, 6) ] },
  { id: 'sabine', name: 'Sabine River', width: 2.2, points: [P(374, -246), P(374, -178), P(368, -114), P(354, -52), P(340, 0), P(332, 12)] },
];

// The Gulf shore, running north-east to south-west. Bays are where the rivers arrive.
export const COAST = [P(360, 34), P(300, 46), P(238, 40), P(180, 74), P(122, 108), P(60, 136), P(0, 152), P(-60, 172), P(-120, 176)];

// Belts of country, in their documented east-to-west order. These are broad washes of
// ground cover, not surveyed boundaries.
export const BELTS = [
  { id: 'piney-woods', name: 'Piney Woods', cover: 'forest', points: [P(250, -280), P(400, -280), P(400, -10), P(300, 20), P(258, -40)] },
  { id: 'coast-prairie', name: 'Gulf Coast Prairies and Marshes', cover: 'marsh', points: [P(-130, 190), P(370, 46), P(320, 12), P(180, 46), P(60, 108), P(-60, 146), P(-130, 152)] },
  { id: 'post-oak', name: 'Post Oak Savannah', cover: 'savannah', points: [P(96, -270), P(250, -270), P(258, -40), P(190, 6), P(96, -20), P(60, -140)] },
  { id: 'blackland', name: 'Blackland Prairie', cover: 'prairie', points: [P(30, -300), P(96, -270), P(60, -140), P(96, -20), P(20, 30), P(-30, -60), P(-20, -190)] },
  { id: 'south-texas', name: 'South Texas Plains', cover: 'brush', points: [P(-330, -60), P(-120, 40), P(-60, 130), P(-130, 176), P(-330, 120)] },
  { id: 'edwards-plateau', name: 'Edwards Plateau', cover: 'plateau', points: [P(-330, -300), P(-30, -300), P(-20, -190), P(-96, -128), P(-190, -96), P(-330, -110)] },
];

// The Balcones Escarpment separates the Edwards Plateau from the coastal plain. It runs
// from Del Rio east and then north-east past Bexar toward the Red River.
export const ESCARPMENT = [P(-330, -104), P(-232, -92), P(-150, -104), P(-96, -128), P(-52, -178), P(-20, -238), P(-4, -300)];

// Settlements as they stood in 1835-36, each placed on the water the sources put it on.
// A settlement carries no detail until an arc needs it.
export const SETTLEMENTS = [
  { id: 'bexar', name: 'San Antonio de Béxar', on: 'the head of the San Antonio River', x: -74, y: -33, weight: 'major' },
  { id: 'goliad', name: 'Goliad', on: 'the San Antonio River', x: -22, y: 74, weight: 'major' },
  { id: 'victoria', name: 'Victoria', on: 'the Guadalupe River', x: -8, y: 66, weight: 'minor' },
  { id: 'refugio', name: 'Refugio', on: 'the Mission River', x: -62, y: 118, weight: 'minor' },
  { id: 'copano', name: 'Copano', on: 'Copano Bay', x: -74, y: 140, weight: 'port' },
  { id: 'san-patricio', name: 'San Patricio', on: 'the Nueces River', x: -104, y: 104, weight: 'minor' },
  { id: 'san-felipe', name: 'San Felipe de Austin', on: 'the west bank of the Brazos', x: 140, y: -62, weight: 'major' },
  { id: 'washington', name: 'Washington-on-the-Brazos', on: 'the Brazos near the Navasota', x: 114, y: -122, weight: 'minor' },
  { id: 'bastrop', name: 'Mina (Bastrop)', on: 'the Colorado River', x: 40, y: -68, weight: 'minor' },
  { id: 'columbia', name: 'Columbia', on: 'between the Brazos and the San Bernard', x: 158, y: 8, weight: 'minor' },
  { id: 'brazoria', name: 'Brazoria', on: 'the Brazos River', x: 164, y: 30, weight: 'minor' },
  { id: 'velasco', name: 'Velasco', on: 'the Brazos near its mouth', x: 166, y: 56, weight: 'port' },
  { id: 'matagorda', name: 'Matagorda', on: 'near the mouth of the Colorado', x: 104, y: 96, weight: 'port' },
  { id: 'harrisburg', name: 'Harrisburg', on: 'Buffalo Bayou', x: 214, y: -16, weight: 'minor' },
  { id: 'anahuac', name: 'Anahuac', on: 'the north-east bank of Trinity Bay', x: 258, y: 8, weight: 'minor' },
  { id: 'liberty', name: 'Liberty', on: 'the head of navigation on the Trinity', x: 258, y: -34, weight: 'minor' },
  { id: 'nacogdoches', name: 'Nacogdoches', on: 'west of the Sabine', x: 312, y: -178, weight: 'major' },
];

// Byrd Lockhart's road linking Bexar, Gonzales and San Felipe. Drawn for context only:
// it is deliberately NOT part of the travel graph, because nothing is built at either end
// and a student must not be able to walk to a place that does not yet exist.
export const PROVINCE_ROADS = [
  { id: 'bexar-gonzales-san-felipe', name: 'The Gonzales road', points: [P(-74, -33), P(-46, -18), P(-18, -6), P(2.1, 0.5), P(34, -14), P(78, -36), P(118, -54), P(140, -62)] },
];

/**
 * Province-scale ground, sampled coarsely. Height rises inland and westward toward the
 * Edwards Plateau and falls to the coast, which is the documented pattern; the numbers
 * are a relative surface for shading, not measured elevations.
 */
const noNegativeZero = value => value === 0 ? 0 : value;
export function provinceRelief(columns = 92) {
  const bounds = { minX: -340, maxX: 400, minY: -310, maxY: 200 };
  const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
  const rows = Math.max(8, Math.round(columns * height / width));
  const cellX = width / (columns - 1), cellY = height / (rows - 1);
  const shoreAt = x => {
    const points = COAST;
    let nearest = points[0];
    for (const point of points) if (Math.abs(point.x - x) < Math.abs(nearest.x - x)) nearest = point;
    return nearest.y;
  };
  const values = [];
  let low = Infinity, high = -Infinity;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = bounds.minX + column * cellX, y = bounds.minY + row * cellY;
      // Distance inland from the shore, and a rise toward the plateau in the west.
      const inland = Math.max(0, shoreAt(x) - y);
      const plateau = Math.max(0, (-x - 40) / 300) * Math.max(0, (-y - 60) / 260);
      const value = 8 + inland * 1.5 + plateau * 1650 + Math.sin(x / 47) * 26 + Math.cos(y / 39) * 20;
      values.push(noNegativeZero(Math.round(value)));
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }
  return { columns, rows, minX: bounds.minX, minY: bounds.minY, cellX: noNegativeZero(+cellX.toFixed(3)), cellY: noNegativeZero(+cellY.toFixed(3)), low: noNegativeZero(Math.round(low)), high: noNegativeZero(Math.round(high)), values };
}

export function buildProvince() {
  return {
    rivers: RIVERS, coast: COAST, belts: BELTS, escarpment: ESCARPMENT,
    settlements: SETTLEMENTS, roads: PROVINCE_ROADS, relief: provinceRelief(),
    bounds: { minX: -340, maxX: 400, minY: -310, maxY: 200 },
  };
}
