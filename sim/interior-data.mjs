// The interiors' spots and art: docs/SETTLING_IN.md step 7. Pure data with no imports, so the page loads this same file
// (served as /interior-data.js) and the server reads it (sim/interior.mjs): the spots a student sees are the spots the
// server accepts.

/**
 * The spots in each interior, as fractions of the interior picture (sim is art-free, so these are the picture's own box: x
 * left to right, y top to bottom, at the item's feet). Read off the delivered `home-interiors` sheet. A saddlebag house has
 * no interior picture of its own and uses the dog-run's two pens. ceiling: every spot takes any item; a bedstead under the
 * window and a pot in the passage are the student's own choice.
 */
export const INTERIORS = Object.freeze({
  'round-log': { sprite: 'interior-round-log', spots: [
    ['hearth', 'By the hearth', 0.69, 0.51],
    ['back-wall', 'Against the back wall', 0.47, 0.46],
    ['back-corner', 'In the back corner', 0.85, 0.45],
    ['window', 'Under the window', 0.24, 0.54],
    ['middle', 'In the middle of the room', 0.47, 0.66],
    ['side-wall', 'Against the side wall', 0.74, 0.63],
    ['door', 'By the door', 0.42, 0.72],
    ['front-corner', 'In the front corner', 0.62, 0.76],
  ] },
  'hewn-log': { sprite: 'interior-hewn-log', spots: [
    ['hearth', 'By the hearth', 0.72, 0.57],
    ['back-wall', 'Against the back wall', 0.43, 0.56],
    ['back-corner', 'In the back corner', 0.85, 0.58],
    ['window', 'Under the window', 0.25, 0.68],
    ['middle', 'In the middle of the room', 0.56, 0.71],
    ['side-wall', 'Against the side wall', 0.8, 0.72],
    ['door', 'By the door', 0.47, 0.8],
    ['front-corner', 'In the front corner', 0.62, 0.79],
  ] },
  jacal: { sprite: 'interior-jacal', spots: [
    ['far-end', 'At the far end', 0.55, 0.38],
    ['far-corner', 'In the far corner', 0.66, 0.4],
    ['window', 'Under the window', 0.45, 0.53],
    ['middle', 'In the middle of the room', 0.57, 0.55],
    ['side-wall', 'Against the side wall', 0.63, 0.5],
    ['near-wall', 'Against the near wall', 0.4, 0.62],
    ['near-side', 'On the near side', 0.53, 0.63],
    ['door', 'By the door', 0.36, 0.73],
  ] },
  'dog-run': { sprite: 'interior-dog-run', spots: [
    ['west-hearth', 'By the west hearth', 0.17, 0.66],
    ['west-back', "Against the west pen's back wall", 0.28, 0.58],
    ['west-middle', 'In the west pen', 0.23, 0.76],
    ['west-front', 'At the front of the west pen', 0.33, 0.78],
    ['passage', 'In the passage', 0.5, 0.7],
    ['passage-front', 'At the mouth of the passage', 0.5, 0.88],
    ['east-hearth', 'By the east hearth', 0.83, 0.66],
    ['east-back', "Against the east pen's back wall", 0.72, 0.58],
    ['east-middle', 'In the east pen', 0.77, 0.76],
    ['east-front', 'At the front of the east pen', 0.66, 0.78],
  ] },
});
export const INTERIOR_OF = { saddlebag: 'dog-run' };

/**
 * What each thing is drawn as inside, and how tall, as a share of the interior picture's height. Furniture from
 * `home-furnishings`; stores from the equipment sheet.
 * ceiling: the tools that came in the wagon have no interior art and cannot be set out; they stay in the house unseen.
 */
export const INTERIOR_ART = Object.freeze({
  'furniture:bedstead': ['home-bedstead', 0.2, 'Bedstead'], 'furniture:table': ['home-table', 0.15, 'Table'], 'furniture:benches': ['home-bench', 0.1, 'Benches'],
  'furniture:shelves': ['home-shelves', 0.24, 'Shelves'], 'furniture:cradle': ['home-cradle', 0.11, 'Cradle'],
  'good:bedding': ['home-bedding', 0.08, 'Bedding'], 'good:pot': ['home-iron-pot', 0.08, 'Iron pot'], 'good:chest': ['home-chest', 0.12, 'Chest'], 'good:spinning-wheel': ['home-spinning-wheel', 0.2, 'Spinning wheel'],
  'good:books': ['home-books', 0.06, 'A few books'], 'good:mosquito-bars': ['home-mosquito-bars', 0.22, 'Mosquito bars'], 'good:tinware': ['home-tinware', 0.07, 'Tinware'], 'good:chairs': ['home-chair', 0.14, 'Chairs'],
  'stores:provisions': ['barrel', 0.13, 'Barrels of meal and salt meat'], 'stores:seed': ['sacks', 0.11, 'Sacks of seed'],
});

