// Injections for the owner's three map bugs of 2026-10-05: the first ten acres laid where they can be worked, the trees drawn again
// over somebody walking among them, and walking about the homestead (sim/starting-plot.mjs, public/trees-front.js, public/app.js
// `treesInFront`, sim/land-paths.mjs, public/motion.js). CLAUDE.md: "a new test is not evidence until it has failed". Each injection
// puts back one exact mistake, the four test files are run, and every file is restored. An injection is caught when every test it
// names fails; the record keeps whatever else failed with it.
// Run: node scripts/map-fixes-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/starting-plot.test.mjs', 'tests/trees-front.test.mjs', 'tests/land-ways.test.mjs', 'tests/shelter.test.mjs'];
const T = {
  laid: 'wherever the house is set, the first ten acres are laid inside the line, off the yard and the house, out of the water, with no tree standing in them and none on the pile',
  house: 'the first house may be set on ten acres nobody has worked: they are laid again round it, their trees standing again where they were; worked ten acres refuse it',
  saved: 'a class saved with its first ten acres off its land opens with them laid again; ten acres worked stay where they are; no tree stands in cleared ground',
  field: 'a person sent out to the field goes to the field, at the edge of the cleared ground nearest the door',
  drawn: 'a tree the ground drew in front of somebody is drawn again over them, as the ground drew it, and kept to the figure',
  left: 'a tree the ground left out - in cleared ground, in a river - is never drawn round somebody walking there',
  fade: 'while the trees fade in with the zoom, none is drawn again: one over itself would read darker and walk with them',
  feet: 'the trees are picked by where the figure is drawn, not by the server\'s point it is drawn off',
  round: 'a way round the house goes round it - into a place under it by its front - and never through it, however long the house',
  keep: 'people keep to the family\'s trodden ways, and walk home along them to the door',
  crop: 'a way goes round the field, not across the crop, and into the plot it goes to',
  beside: 'somebody working beside another walks the way they walk; going in out of the weather is walked, not slid',
  page: 'the page draws a way with its corners rounded, within a step of the server\'s line, and a walk about the land at a walking pace',
  rain: 'rain: everybody with no task and every child goes in under the tent; somebody at a task keeps at it; out again when it clears',
};
const INJECTIONS = [
  // A. The first ten acres.
  { name: 'choosing the site carries the field over with the house and looks at nothing (the bug)', expect: [T.laid],
    file: 'sim/homesite.mjs', from: '  layStartingPlot(world, household, { tell: false });', to: '' },
  { name: 'the first ten acres may lie in a river or creek the map draws', expect: [T.laid],
    file: 'sim/starting-plot.mjs', from: "  if (plotWater(world, point, courses)) return 'the water';", to: '' },
  { name: 'the trees in the first ten acres are left standing, unseen, for walkers to go round', expect: [T.laid, T.saved],
    file: 'sim/starting-plot.mjs', from: '  if (!countsTrees(woodsRule(world))) return 0;\n  const square = squareOf(plot);', to: '  return 0;\n  const square = squareOf(plot);' },
  { name: 'the chooser is not told where the ten acres would go', expect: [T.laid],
    file: 'sim/homesite.mjs', from: '  const field = startingPlotIfSite(world, household, point);', to: '  const field = null;' },
  { name: 'placing the first house leaves the ten acres where they lay, under it', expect: [T.house],
    file: 'sim/houses.mjs', from: '  if (position) { household.house.placement = position; layStartingPlot(world, household); }\n  return household.house;\n}', to: '  if (position) { household.house.placement = position; }\n  return household.house;\n}' },
  { name: 'a house is refused over ten acres nobody has worked', expect: [T.house],
    file: 'sim/house-placement.mjs', from: "  if (under.length && !(under.every(plot => plot.id === FIRST_PLOT) && startingPlotMovesFor(world, household, [house, ...standing])))", to: '  if (under.length)' },
  { name: 'the trees taken off where the ten acres were stay down when they move', expect: [T.house],
    file: 'sim/starting-plot.mjs', from: '  regrowStartingTrees(world, household);\n  clearStartingTrees(world, household, point);', to: '  clearStartingTrees(world, household, point);' },
  { name: 'ten acres already sown are moved too', expect: [T.house, T.saved],
    file: 'sim/starting-plot.mjs', from: "  if (!plot || plot.state !== 'cleared' || plot.sown || plot.fence", to: "  if (!plot || plot.state !== 'cleared' || plot.fence" },
  { name: 'a class saved before opens with its ten acres off its land', expect: [T.saved],
    file: 'server/storage.mjs', from: '  if (save.world?.households) settleStartingPlots(save.world);', to: '' },
  { name: 'a person sent out to the field goes to the middle of the old block', expect: [T.field],
    file: 'sim/chores.mjs', from: '  if (door && plots.length) {', to: '  if (false) {' },
  // B. The trees drawn again over somebody.
  { name: 'every tree in the tiles is drawn again, the ground\'s or not (the bug)', expect: [T.left],
    file: 'public/app.js', from: '      const item = redrawn(groundTrees, tree);', to: '      const item = redrawn(groundTrees, tree) || { alpha: 1, lean: 0, gale: false, seed: 0 };' },
  { name: 'a tree is drawn again at its fading strength over itself (the bug)', expect: [T.fade],
    file: 'public/trees-front.js', from: 'export const FULL_STRENGTH = 0.98;', to: 'export const FULL_STRENGTH = 0.02;' },
  { name: 'a tree is drawn again upright over the tree the wind leans (the bug)', expect: [T.drawn],
    file: 'public/app.js', from: 'seed: item.seed, lean: item.lean, gale: item.gale });', to: 'seed: item.seed, lean: 0, gale: false });' },
  { name: 'the trees are picked round the server\'s point, not the figure (the bug)', expect: [T.feet],
    file: 'public/app.js', from: '        const feet = { x: spot.x, y: spot.y + spot.size * 0.45 };', to: '        const feet = person.point;' },
  { name: 'a tree drawn again is not kept to the figure', expect: [T.drawn],
    file: 'public/app.js', from: '        ctx.beginPath(); ctx.rect(box.left, box.top, box.width, box.height); ctx.clip();', to: '' },
  // C. Walking about the homestead.
  { name: 'the way-finding\'s box has no room to go round a long house: the way goes through it (found 2026-10-05)', expect: [T.round],
    file: 'sim/land-paths.mjs', from: '  for (const box of ground.houses) {\n    if (box.maxX < minX', to: '  for (const box of []) {\n    if (box.maxX < minX' },
  { name: 'a place under a house is no way anybody can find, and the way is laid straight through the house', expect: [T.round],
    file: 'sim/land-paths.mjs', from: '  const leave = !fronted && frontOf(ground, from), enter = !fronted && frontOf(ground, to);', to: '  const leave = null, enter = null;' },
  { name: 'nobody keeps to a way: the search cuts across the grass at the place (found 2026-10-05)', expect: [T.keep],
    file: 'sim/land-paths.mjs', from: '  const via = joined ? null : viaWay(world, household, ground, from, to, treeCost);', to: '  const via = null;' },
  { name: 'home is the yard spot beside the house, not its door', expect: [T.keep],
    file: 'sim/survey.mjs', from: '  if (household.house) return doorOf(world, household);', to: '' },
  { name: 'a way runs straight across the crop', expect: [T.crop],
    file: 'sim/land-paths.mjs', from: 'export const FIELD_ROUTE = 3;', to: 'export const FIELD_ROUTE = 1;' },
  { name: 'somebody working beside another is put beside them however they walked', expect: [T.beside],
    file: 'sim/land-paths.mjs', from: '  if (along && entity.location.siteId === household.homeSiteId', to: '  if (false && along && entity.location.siteId === household.homeSiteId' },
  { name: 'a short step is taken straight whatever stands on its line', expect: [T.beside],
    file: 'sim/land-paths.mjs', from: '    if (!(cellCost(ground, cx, cy, 1, pathCells) <= 1)) return false;', to: '' },
  { name: 'going in out of the weather is a slide, as it was (the bug)', expect: [T.rain],
    file: 'sim/shelter.mjs', from: '  if (household && !person.travel && person.location?.siteId === household.homeSiteId && siteId === household.homeSiteId) stepTo(world, household, person, point);\n  else', to: '  if (false) stepTo(world, household, person, point);\n  else' },
  { name: 'the page draws the server\'s corners as they are', expect: [T.page],
    file: 'public/motion.js', from: '  if (!Array.isArray(points) || points.length < 3 || !(cut > 0)) return points;', to: '  return points;' },
  { name: 'every walk about the land takes the whole tick, however short (the bug)', expect: [T.page],
    file: 'public/motion.js', from: '    const ms = landWalkMs(walked.wayMiles, record.duration);', to: '    const ms = record.duration;' },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const only = process.argv[2] ? INJECTIONS.filter(injection => injection.name.includes(process.argv[2])) : INJECTIONS;
const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
const results = [];
for (const injection of only) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = text.replace(/\r\n/g, '\n');
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const failed = run();
    const caught = injection.expect.every(name => failed.includes(name));
    const alone = caught && failed.every(name => injection.expect.includes(name));
    results.push({ injection: injection.name, caught, only: alone, failed });
    console.log(`${caught ? (alone ? 'CAUGHT' : 'CAUGHT (and more)') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ')}`);
  } finally { writeFileSync(injection.file, text); }
}
if (!process.argv[2]) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/map-fixes-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
}
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught`);
