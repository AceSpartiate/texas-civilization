// Each test of the per-plot crops watched failing (CLAUDE.md: "A new test is not evidence until it has failed"; owner, 2026-09-30,
// docs/LAND_GRANTS.md §5.2). Every injection below is the exact regression a test guards, put into the code; the test file is run;
// the test named must fail, and every other test in the file must still pass (or those `also` names); then the code is put back.
//
// Run: node scripts/per-plot-crops-injections.mjs  → docs/evidence/per-plot-crops-injections.json
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const CROPS = 'tests/per-plot-crops.test.mjs', IMPROVEMENTS = 'tests/improvements.test.mjs';
const INJECTIONS = [
  // Each plot its own minutes, and the harvest brings in the ripe plots alone.
  { file: 'sim/crops.mjs', test: CROPS, fails: 'corn on one plot and cotton on another', from: '    if (plot.grownMs >= growMs(plot.crop)) { plot.ripe = true; came.push(plot); }', to: "    if (plot.grownMs >= growMs('corn')) { plot.ripe = true; came.push(plot); }" },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'corn on one plot and cotton on another', from: '      const plots = ripePlots(household).filter(plot => !state.plots || state.plots.includes(plot.id));', to: '      const plots = sownPlots(household);' },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'corn on one plot and cotton on another', from: "  if (chore.reaps) extra = { ...extra, plots: ripePlots(household).map(plot => plot.id) };", to: "  if (chore.reaps) extra = { ...extra, plots: sownPlots(household).map(plot => plot.id) };" },
  // Each plot its own yield and fence.
  { file: 'sim/improvements.mjs', test: CROPS, fails: 'a harvest of both crops', also: ['corn on one plot'], from: "    yields[crop === 'cotton' ? 'cotton' : 'food'] += yieldPerPlot(crop) * (kept && plot.fence !== 'sound' ? 1 - UNFENCED_LOSS : 1);", to: "    yields[crop === 'cotton' ? 'cotton' : 'food'] += yieldPerPlot(crop) * (kept ? harvestShare(household, plots) : 1);" },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'a harvest of both crops', from: "    ...(kept.cotton && { cotton: round(yieldFor(kept.cotton, skill)), food: round(yieldFor(kept.food, skill)) }) };", to: "    ...(kept.cotton && { cotton: round(yieldFor(kept.cotton, skill)) }) };" },
  // Every bare plot or the one tapped; seed a plot, nearest first; refusals in the plot's own words.
  { file: 'sim/chores.mjs', test: CROPS, fails: 'every bare plot, or the one tapped', from: '  const plots = byNearness(world, household, barePlots(household).filter(plot => plan[plot.id]));', to: '  const plots = byNearness(world, household, barePlots(household).filter(plot => plan[plot.id])).reverse();' },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'every bare plot, or the one tapped', also: ['two sent to plant'], from: '    if (seed < need) continue;', to: '    if (seed < need) return false;' },
  { file: 'sim/survey.mjs', test: CROPS, fails: 'every bare plot, or the one tapped', from: "    if (state === 'planted') return `That plot is already in ${crop}, ready ${plotReadyWords(world, household, plot)}.`;\n", to: '' },
  { file: 'sim/world.mjs', test: CROPS, fails: 'every bare plot, or the one tapped', from: "    if (!crops && !Object.hasOwn(CROPS, String(input.crop))) throw new Error('Choose corn or cotton.');", to: "    if (!crops && !CROPS[input.crop]) throw new Error('Choose corn or cotton.');" },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'every bare plot, or the one tapped', from: "    if (toBegin) return { ...chore.needs, seed: bare.length ? Math.min(...Object.keys(CROPS).map(seedFor)) : 0 };", to: "    if (toBegin) return { ...chore.needs, seed: bare.reduce((sum, plot) => sum + seedFor(cropOf(household, plot)), 0) };", also: ['two sent to plant'] },
  // Two planters.
  { file: 'sim/chores.mjs', test: CROPS, fails: 'two sent to plant', from: '    if (person === entity || person.chore.alongside || person.chore.step >= sownAt) continue;', to: '    continue;' },
  // The wagon by what is ripe.
  { file: 'sim/improvements.mjs', test: CROPS, fails: 'the wagon from three plots', from: 'export const needsWagonToHarvest = (household, plots = cropPlots(household)) => plots.length >= WAGON_HARVEST_PLOTS;', to: 'export const needsWagonToHarvest = (household, plots = sownPlots(household)) => plots.length >= WAGON_HARVEST_PLOTS;' },
  // Auto: ripe first, then each plot its own crop.
  { file: 'sim/auto.mjs', test: CROPS, fails: 'on auto, the field', from: "  if (ripePlots(household).length && choreAvailability(world, household, person, 'harvest-field').can) return { chore: 'harvest-field', extra: {} };\n  if (barePlots(household).length && choreAvailability(world, household, person, 'plant-field').can) return { chore: 'plant-field', extra: { sow: 'own' } };", to: "  if (barePlots(household).length && choreAvailability(world, household, person, 'plant-field').can) return { chore: 'plant-field', extra: { sow: 'own' } };\n  if (ripePlots(household).length && choreAvailability(world, household, person, 'harvest-field').can) return { chore: 'harvest-field', extra: {} };" },
  { file: 'sim/chores.mjs', test: CROPS, fails: 'on auto, the field', from: "(extra.sow === 'own' ? cropOf(household, plot) : extra.sow)", to: "(extra.sow === 'own' ? (household.field?.crop === 'cotton' ? 'cotton' : 'corn') : extra.sow)" },
  { file: 'sim/crops.mjs', test: CROPS, fails: 'the families nobody plays keep a plot in corn', from: 'export const ownCrops = (household, plots) => Object.fromEntries(plots.map(plot => [plot.id, cropOf(household, plot)]));', to: "export const ownCrops = (household, plots) => Object.fromEntries(plots.map(plot => [plot.id, 'cotton']));" },
  // The director keeps a plot in corn.
  { file: 'sim/neighbours.mjs', test: CROPS, fails: 'the families nobody plays keep a plot in corn', from: "  if (bare.length && !corn && (clearedPlots(household).length >= 2 || short)) plan[bare[0].id] = 'corn';", to: '' },
  { file: 'sim/neighbours.mjs', test: CROPS, fails: 'the families nobody plays keep a plot in corn', from: "  const short = (household.resources?.food || 0) < mouths * FOOD_KEPT_PER_PERSON;", to: '  const short = false;' },
  // An old save's one field, plot by plot.
  { file: 'sim/crops.mjs', test: CROPS, fails: 'a class saved with one crop for the whole field', from: '    plot.grownMs = grownOf(world, field);', to: '    plot.grownMs = 0;' },
  { file: 'sim/crops.mjs', test: CROPS, fails: 'a class saved with one crop for the whole field', from: "    if (field.state === 'ripe') plot.ripe = true;\n", to: '' },
  { file: 'sim/fields.mjs', test: CROPS, fails: 'a class saved with one crop for the whole field', from: "  if (oneField(plot)) return ['planted', 'ripe'].includes(household.field?.state) ? household.field.state : 'bare';", to: "  if (oneField(plot)) return 'bare';" },
  // What cannot have been sown, and what the page is told.
  { file: 'sim/crops.mjs', test: CROPS, fails: 'what cannot have been sown does not open', from: "  if (plot.crop !== undefined && (plot.state !== 'cleared' || !CROPS[plot.crop])) return 'Invalid plot crop';", to: "  if (plot.crop !== undefined && !CROPS[plot.crop]) return 'Invalid plot crop';" },
  { file: 'sim/crops.mjs', test: CROPS, fails: 'what cannot have been sown does not open', from: "  if (plot.ripe !== undefined && (plot.ripe !== true || !Number.isFinite(plot.grownMs))) return 'Invalid plot crop';", to: '' },
  { file: 'sim/survey.mjs', test: CROPS, fails: 'what cannot have been sown does not open', also: ['a class saved'], from: '  const { grownMs: _grown, ripe: _ripe, crop: _crop, sown: _sown, ...kept } = plot;', to: '  const { ripe: _ripe, crop: _crop, sown: _sown, ...kept } = plot;' },
  { file: 'sim/crops.mjs', test: CROPS, fails: 'what cannot have been sown does not open', from: '  return { ...summary, ...(next && { next: { crop: next.crop, words: next.words } }) };', to: '  return summary;' },
  // The harvest icon's words.
  { file: 'public/family-panel.js', test: CROPS, fails: 'the harvest icon says each crop', from: '    const brings = entry.crop?.cotton', to: '    const brings = false' },
  // The field line on the land, and planting begun with seed for one plot.
  { file: 'sim/world.mjs', test: IMPROVEMENTS, fails: 'the class is told what is standing on its land', from: '...plotProjection(world, known), crops: cropSummary(world, known), ', to: '...plotProjection(world, known), ' },
  { file: 'sim/chores.mjs', test: IMPROVEMENTS, fails: 'a bigger field swallows more seed', from: "    if (toBegin) return { ...chore.needs, seed: bare.length ? Math.min(...Object.keys(CROPS).map(seedFor)) : 0 };", to: "    if (toBegin) return { ...chore.needs, seed: bare.reduce((sum, plot) => sum + seedFor(cropOf(household, plot)), 0) };" },
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
if (only) INJECTIONS.splice(0, INJECTIONS.length, ...INJECTIONS.filter(one => one.fails.includes(only)));
const results = [];
function run(test) {
  try { return { code: 0, out: execFileSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) }; }
  catch (error) { return { code: error.status, out: String(error.stdout || '') }; }
}
const failedNames = out => [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map(match => match[1]);
const files = [...new Set(INJECTIONS.map(one => one.test))];
const baseline = Object.fromEntries(files.map(file => [file, failedNames(run(file).out)]));
if (Object.values(baseline).some(list => list.length)) throw new Error(`the tests fail before any injection: ${JSON.stringify(baseline)}`);
let bad = 0;
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = crlf ? original.replace(/\r\n/g, '\n') : original;
  if (!text.includes(injection.from)) { results.push({ file: injection.file, expected: injection.fails, ok: false, why: 'the code to inject into was not found' }); bad++; console.log('NOT FOUND', injection.file, injection.from.slice(0, 80)); continue; }
  const changed = text.replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
  try {
    const failed = failedNames(run(injection.test).out);
    const ok = failed.some(name => name.includes(injection.fails)) && failed.every(name => name.includes(injection.fails) || (injection.also || []).some(other => other === '*' || name.includes(other)));
    if (!ok) bad++;
    results.push({ file: injection.file, test: injection.test, expected: injection.fails, failed, ok });
    console.log(ok ? 'CAUGHT' : 'MISSED', injection.file, '→', failed.join(' | ') || 'nothing failed');
  } finally { writeFileSync(injection.file, original); }
}
writeFileSync('docs/evidence/per-plot-crops-injections.json', JSON.stringify({ at: new Date().toISOString(), caught: INJECTIONS.length - bad, of: INJECTIONS.length, results }, null, 1));
console.log(`\n${INJECTIONS.length - bad} of ${INJECTIONS.length} injected regressions caught by their own test.`);
if (bad) process.exit(1);
