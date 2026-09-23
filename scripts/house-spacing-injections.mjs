// Each rule of house spacing (tests/house-spacing.test.mjs, docs/WOODS_AND_BUILDING.md §6.5) put back the way it was, or
// taken out, one at a time, and the tests run against it: each must fail the tests written for it and no others. The
// source is changed as it is loaded (node load hooks, and a read of public/app.js for the tests that read the page), so no
// file is edited and nothing needs restoring.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const TEST = 'tests/house-spacing.test.mjs';
// WIDE=1 runs every injection against the whole suite instead, and reports what else fails with it.
const WIDE = Boolean(process.env.WIDE);
const T = {
  footprint: 'the ground the server checks is the footprint the page draws, every plan at every quarter turn',
  pictures: 'every picture of a house stands on the ground it claims, every plan at every quarter turn',
  over: 'a house whose drawn footprint lies over another house is refused, and one just clear of it is not',
  pictureOver: "a house whose picture would stand over another house's ground is refused, beside it or behind it",
  preview: 'the preview is refused for spacing exactly where the server refuses it',
  water: 'a house whose drawn footprint lies over the water is refused, though every point it is read at is dry',
  field: "a house is not set on the family's field, and the field is not staked over a house",
  oldSave: 'a class saved with two houses now drawn over one another opens with both where they stood',
};
const cases = [
  {
    name: 'the server reads the house in true feet again (an eight-foot cell eight feet of the map)',
    file: 'sim/house-footprint.mjs', swaps: [['export const CELL_MILES = PERSON_MILES * CABIN_PEOPLE * CELL_SHARE;', 'export const CELL_MILES = 8 / 5280;']],
    // Everything the drawn size decides: the footprint, the pictures on it, the neighbour, the water and the field under it.
    fails: [T.footprint, T.pictures, T.over, T.pictureOver, T.water, T.field],
  },
  {
    name: 'no spacing between houses',
    file: 'sim/house-placement.mjs', swaps: [['const why = spacingRefusal(house, housesOnLand(world, household, household.completedHouses || []));', 'const why = null;']],
    fails: [T.over, T.pictureOver],
  },
  {
    name: 'spacing on the ground footprint alone, the pictures not counted',
    file: 'sim/house-footprint.mjs', swaps: [['export const PICTURE_REACH = Object.freeze({ up: 1, side: 0.9, down: 0.2 });', 'export const PICTURE_REACH = Object.freeze({ up: 0, side: 0, down: 0 });']],
    fails: [T.pictures, T.pictureOver],
  },
  {
    name: 'water read at nine points of the footprint only',
    file: 'sim/house-placement.mjs', swaps: [["if (onRealLand(world) && landAround(house.footprint).waterNear(house.footprint, IN_THE_WATER)) throw", 'if (false) throw']],
    fails: [T.water],
  },
  {
    name: 'a house may be set on the field',
    file: 'sim/house-placement.mjs', swaps: [['if (plotsOf(world, household).some(plot => overlaps(squareOf(plot), house.footprint)))', 'if (false)']],
    fails: [T.field],
  },
  {
    name: 'the field may be staked over a house placed away from the site',
    file: 'sim/survey.mjs', swaps: [['if (housesOnLand(world, household).some(house => overlaps(house.footprint, square)))', 'if (false)']],
    fails: [T.field],
  },
  {
    name: 'a saved class with houses drawn over one another is refused as invalid',
    file: 'sim/houses.mjs', swaps: [
      ["import { checkHousePlacement } from './house-placement.mjs';", "import { checkHousePlacement, housesOnLand } from './house-placement.mjs';"],
      ['return "Invalid house placement";', 'return "Invalid house placement"; if (p && household.completedHouses?.length) { const all = housesOnLand(world, household); if (all.some((a, i) => all.some((b, k) => k !== i && a.footprint.minX < b.footprint.maxX && b.footprint.minX < a.footprint.maxX && a.footprint.minY < b.footprint.maxY && b.footprint.minY < a.footprint.maxY))) return "Invalid house placement"; }'],
    ],
    fails: [T.oldSave],
  },
  {
    name: 'the preview predicts nothing',
    read: 'public/app.js', swaps: [['  return spacingRefusal(houseOnGround({ plan: housePlacement.command.layout }, plotCatalogue, placement), standing);', '  return null;']],
    fails: [T.preview],
  },
];

const hookFor = ({ file, read, swaps }) => file
  ? `import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) { const out = next(url, context); if (!url.endsWith(${JSON.stringify('/' + file)})) return out;
  let source = String(out.source); for (const [from, to] of ${JSON.stringify(swaps)}) { if (source.split(from).length !== 2) throw new Error('injection target not found once: ' + from); source = source.replace(from, to); }
  return { ...out, source }; } });`
  : `import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
const read = fs.readFileSync; fs.readFileSync = function (path, ...rest) { const out = read.call(this, path, ...rest);
  if (!String(path?.pathname ?? path).replace(/\\\\/g, '/').endsWith(${JSON.stringify(read)})) return out;
  let source = String(out).replace(/\\r\\n/g, '\\n'); for (const [from, to] of ${JSON.stringify(swaps)}) { if (source.split(from).length !== 2) throw new Error('injection target not found once: ' + from); source = source.replace(from, to); }
  return source; }; syncBuiltinESMExports();`;

const result = [];
for (const injection of cases) {
  const run = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(hookFor(injection))}`, '--test', '--test-reporter=tap', ...(WIDE ? [] : [TEST])], { encoding: 'utf8' });
  const output = run.stdout + run.stderr;
  const failed = [...output.matchAll(/^not ok \d+ - (.*)$/gm)].map(match => match[1].replace(/\\'/g, "'").trim());
  const passed = [...output.matchAll(/^ok \d+ - (.*)$/gm)].length;
  assert.ok(failed.length + passed > 0, `${injection.name}: the tests did not run\n${output.slice(0, 2000)}`);
  if (WIDE) { const extra = failed.filter(name => !injection.fails.includes(name)); assert.ok(injection.fails.every(name => failed.includes(name)), `${injection.name}: ${JSON.stringify(failed)}`); result.push({ injection: injection.name, failed: failed.length, alsoFailed: extra, passed }); console.log(`wide: ${injection.name} - ${failed.length} failed, also: ${JSON.stringify(extra)}`); continue; }
  assert.deepEqual(failed.sort(), [...injection.fails].sort(), `${injection.name}: failed ${JSON.stringify(failed)}, expected ${JSON.stringify(injection.fails)}\n${output.slice(-3000)}`);
  result.push({ injection: injection.name, in: injection.file || injection.read, failed, passed });
  console.log(`caught: ${injection.name} - ${failed.length} failed (${failed.join('; ')}), ${passed} passed`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(WIDE ? 'docs/evidence/house-spacing-injections-wide.json' : 'docs/evidence/house-spacing-injections.json', JSON.stringify({ date: new Date().toISOString(), isolation: 'node load hooks and a patched read of public/app.js; no file edited', test: TEST, result }, null, 2));
console.log(`PASS: ${result.length} of ${cases.length} injections each failed exactly the tests written for them.`);
