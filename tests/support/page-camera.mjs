// A camera as public/app.js `cameraFor` makes one, for the tests that run the page's own drawing out of its source: how tall
// a person is drawn (`figure`, floored at seven pixels) and how a family's houses are (`house`, the page's own `houseScale`,
// read out of public/app.js so a test cannot hold the drawing to a size the page no longer draws).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CABIN_PEOPLE, PERSON_MILES } from '../../sim/house-footprint.mjs';

const page = readFileSync(new URL('../../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** One top-level declaration of the page, by its first line, up to the first `end` after it. */
export function declaration(start, end) {
  const from = page.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in public/app.js, so this test checks nothing`);
  const to = page.indexOf(end, from);
  assert.ok(to > from, `the end of ${start} was not found`);
  return page.slice(from, to + end.length);
}
/** The page's `HOUSE_LEGIBLE` and `houseScale`. */
export const { HOUSE_LEGIBLE, houseScale } = new Function('PERSON_MILES', 'CABIN_PEOPLE',
  `${declaration('const HOUSE_LEGIBLE = ', ';\n')}\n${declaration('const houseScale = ', ';\n')}\nreturn { HOUSE_LEGIBLE, houseScale };`,
)(PERSON_MILES, CABIN_PEOPLE);
/** The camera at `scale` pixels a mile, drawing the map's point `p` at `toScreen(p)`. */
export const pageCamera = (scale, toScreen) => ({ scale, figure: Math.max(7, Math.min(150, scale * PERSON_MILES)), house: houseScale(scale), toScreen });
