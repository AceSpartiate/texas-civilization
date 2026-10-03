// Injections for the way round the trees, the ways trodden to what a family places, and the fenced yard (owner, 2026-10-02 and
// 2026-10-03, "All automatic"; sim/land-paths.mjs). CLAUDE.md: "a new test
// is not evidence until it has failed". Each injection puts back one exact mistake, tests/land-paths.test.mjs is run, and every
// file is restored. An injection is caught when every test it names fails; the record keeps whatever else failed with it.
// Run: node scripts/land-paths-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/land-paths.test.mjs'];
const T = {
  round: 'a way across the family\'s land goes round the standing trees, and the person walks it, drawn along the points walked',
  path: 'walking a path is quicker than the country it crosses, and the way found keeps to it',
  trodden: 'once the house stands the family treads a way from the door to its water, each plot, the woodpile and where its stock comes in at night - round the trees, nobody sent, nothing felled; a class saved with none opens with none',
  follow: 'a new plot gets its way when it is cleared; a fenced yard gets a way to its gate and the ways out go through it; with the rails down, or the stock gone, the ways follow',
  gone: 'Cut a path is gone: not on anybody\'s row, its order and its place on the map refused in words, nowhere in the lesson or the panel',
  old: 'a class saved with somebody part way through cutting a path opens: they leave off, said so; what was cut stays a path, its stakes come up, nothing is felled',
  yard: 'Fence a yard: half a plot\'s rails and the trees inside felled at felling\'s time, refused before the house and without an axe, drawn on the land, pulled down in the Scrape',
  obey: 'a child on auto at home with a fenced yard is disobedient half as often, and only then',
  play: 'the little ones at play keep inside the fenced yard',
};
const INJECTIONS = [
  { name: 'the way-finding does not see the trees (people walk over them, as before)', expect: [T.round],
    file: 'sim/land-paths.mjs', from: '    if (!tree && standing(ground, column, row)) tree = true;', to: '    if (!tree && standing(ground, column, row)) tree = false;' },
  { name: 'the page draws a land walk as the straight line between ticks, not the points walked', expect: [T.round],
    file: 'public/motion.js', from: "  if (!Array.isArray(points) || points.length < 2 || entity.travel", to: "  if (true || !Array.isArray(points) || points.length < 2 || entity.travel" },
  { name: 'the projection does not carry the points walked', expect: [T.round],
    file: 'sim/world.mjs', from: '    ...(() => { const walked = walkedShown(world, e); return walked ? { walked } : {}; })(),', to: '' },
  { name: 'a path is no quicker than the open ground', expect: [T.path],
    file: 'sim/land-paths.mjs', from: 'export const PATH_PACE = 0.8;', to: 'export const PATH_PACE = 1.3;' },
  { name: 'the way-finding does not know where the paths run', expect: [T.path],
    file: 'sim/land-paths.mjs', from: '        cells.add(cellKey(Math.floor(x / size), Math.floor(y / size)));', to: '        void cellKey;' },
  // The ways trodden to what the family places (owner, 2026-10-03, "All automatic").
  { name: 'no way is trodden when the house stands', expect: [T.trodden, T.follow],
    file: 'sim/land-paths.mjs', from: '  let laid = 0;\n', to: '  let laid = 0;\n  return;\n' },
  { name: 'a trodden way is laid straight over the trees', expect: [T.trodden],
    file: 'sim/land-paths.mjs', from: '  return { points: landRoute(world, household, door, at, null, WAY_TREE_COST).map(p => ({ x: r4(p.x), y: r4(p.y) })), found: 1 };', to: '  return { points: [door, at], found: 1 };' },
  { name: 'a trodden way counts a tree as somebody walking does, and is laid through the timber out of a fenced yard (found 2026-10-03)', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: 'export const WAY_TREE_COST = 100;', to: 'export const WAY_TREE_COST = TREE_COST;' },
  { name: 'no way to the woodpile', expect: [T.trodden],
    file: 'sim/land-paths.mjs', from: "  if (countsTrees(woodsRule(world))) { const pile = woodpileAt(world, household); if (pile) wanted.push({ to: 'woodpile', at: pile }); }", to: '' },
  { name: 'no way to where the stock comes in at night', expect: [T.trodden, T.follow],
    file: 'sim/land-paths.mjs', from: "  for (const kind of ['cattle', 'hogs']) if (herd[kind] > 0) wanted.push({ to: `stock-${kind}`, at: stockGround(world, household, kind) });", to: '' },
  { name: 'the stock\'s ground on the server is not where the page draws the herd at night', expect: [T.trodden],
    file: 'sim/land-paths.mjs', from: 'const NIGHT_OUT = 0.05, NIGHT_FLAT = 0.6;', to: 'const NIGHT_OUT = 0.05, NIGHT_FLAT = 0.5;' },
  { name: 'no way to the yard gate', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: "  if (gate) wanted.push({ to: 'yard-gate', at: gate });", to: '' },
  { name: 'the yard\'s rails are no wall: the ways out cross them', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: '  if (ground.rails && onRails(ground.rails, gx * size, gy * size, size)) return Infinity;', to: '' },
  { name: 'the ways laid before the yard went up are not laid again', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: '&& Boolean(path.gate) === railed;', to: '&& true;' },
  { name: 'a way to stock the family no longer has stays', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: "    if (pathsOf(household).some(path => path.kind === 'trodden' && path.to && !places.has(path.to))) household.paths = pathsOf(household).filter(path => path.kind !== 'trodden' || !path.to || places.has(path.to));", to: '' },
  { name: 'a plot cleared later gets no way (the family is not looked at again)', expect: [T.follow],
    file: 'sim/land-paths.mjs', from: "    plotsOf(world, household).filter(plot => plot.state === 'cleared').map(plot => plot.id).join(','), household.site?.needsWell", to: "    '', household.site?.needsWell" },
  // Cut a path gone, and a class saved in the middle of it.
  { name: 'the order to cut a path is taken as it was', expect: [T.gone],
    file: 'sim/land-paths.mjs', from: "export const pathOrderRefusal = input => (input?.action === 'cut-path' || (input?.action === 'chore' && input.chore === 'cut-path') ? PATHS_TRODDEN_WHY : null);", to: 'export const pathOrderRefusal = input => null;' },
  { name: 'the place chooser still asks what a path cut there would be', expect: [T.gone],
    file: 'server/app.mjs', from: ": job === 'cut-path' ? { can: false, why: PATHS_TRODDEN_WHY } :", to: ':' },
  { name: 'Cut a path is still chosen on the map from the bar', expect: [T.gone],
    file: 'public/family-panel.js', from: "export const ON_MAP = Object.freeze(['survey-plot', 'clear-plot', 'fence-plot', 'hunt-land', 'plant-field']);", to: "export const ON_MAP = Object.freeze(['survey-plot', 'clear-plot', 'fence-plot', 'hunt-land', 'plant-field', 'cut-path']);" },
  { name: 'the lesson does not hold back the yard', expect: [T.gone],
    file: 'sim/lesson.mjs', from: "export const LATER_WORK = Object.freeze(['chore:fence-yard']);", to: 'export const LATER_WORK = Object.freeze([]);' },
  { name: 'a class saved in the middle of cutting a path will not open', expect: [T.old],
    file: 'sim/world.mjs', from: '    // A way across the land is points (absent when nobody walks one).', to: "    if (entity.chore?.id === 'cut-path') throw new Error('Invalid path being cut');\n    // A way across the land is points (absent when nobody walks one)." },
  { name: 'whoever was cutting leaves off without saying what', expect: [T.old],
    file: 'sim/chores.mjs', from: 'abandonChore(world, household, entity, RETIRED[entity.chore.id] || null);', to: 'abandonChore(world, household, entity, null);' },
  { name: 'the stakes of a path left part cut stay in the ground', expect: [T.old],
    file: 'sim/land-paths.mjs', from: '  for (const household of Object.values(world.households)) leaveOffCutting(household);\n', to: '' },
  // The yard.
  { name: 'a yard costs a whole plot\'s fence', expect: [T.yard],
    file: 'sim/land-paths.mjs', from: 'export const YARD_SHARE = 0.5;', to: 'export const YARD_SHARE = 1;' },
  { name: 'the trees inside the yard come down with the rails for nothing (the bug of 2026-10-02)', expect: [T.yard],
    file: 'sim/chores.mjs', from: "inside the yard`;\n      workFor(state, paceFor(fellAndCarryTicks(tree), skill, heavyWorkPace(entity) * waterBurden(household)) * workPaceOf(chore) * hungerPace(entity));", to: "inside the yard`;\n      state.wait = 0.0001;" },
  { name: 'fencing the yard leaves the trees inside it standing', expect: [T.yard],
    file: 'sim/chores.mjs', from: '      const tree = treesInBox(world, yardGround(world, household)).find(one => !taken.has(one.id));', to: '      const tree = null;' },
  { name: 'the bar does not say the trees inside the yard', expect: [T.yard],
    file: 'sim/chores.mjs', from: '    says: (world, household) => yardTreesWords(world, household),', to: '' },
  { name: 'the yard is fenced without an axe', expect: [T.yard],
    file: 'sim/chores.mjs', from: "(household.tools?.axe === undefined ? 'Splitting rails for the yard wants an axe, and there is none in the house.' : null)", to: 'null' },
  { name: 'the yard\'s gate is not kept when its rails go up', expect: [T.yard],
    file: 'sim/land-paths.mjs', from: '  household.yard.gate = gateAlong(world, household.yard, doorOf(world, household));', to: '' },
  { name: 'the Scrape\'s burning leaves the yard\'s rails standing', expect: [T.yard],
    file: 'sim/improvements.mjs', from: "      if (yard) household.yard = { ...household.yard, fence: 'ruined' };", to: '' },
  { name: 'a fenced yard does nothing for a child\'s obedience', expect: [T.obey],
    file: 'sim/obedience.mjs', from: 'export const YARD_KEEPS = 0.5;', to: 'export const YARD_KEEPS = 1;' },
  { name: 'the yard keeps a child told what to do as well as one on auto', expect: [T.obey],
    file: 'sim/obedience.mjs', from: "export const keptByYard = (household, entity) => entity?.auto === true && household", to: "export const keptByYard = (household, entity) => household" },
  { name: 'play is not kept inside the yard', expect: [T.play],
    file: 'sim/children.mjs', from: "  if (moves) entity.location = { ...keepInYard(household, { x: r4(state.from.x + dx), y: r4(state.from.y + dy) }), siteId: household.homeSiteId };", to: "  if (moves) entity.location = { x: r4(state.from.x + dx), y: r4(state.from.y + dy), siteId: household.homeSiteId };" },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
const results = [];
for (const injection of INJECTIONS) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = crlf ? text.replace(/\r\n/g, '\n') : text;
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const failed = run();
    const caught = injection.expect.every(name => failed.includes(name));
    const only = caught && failed.every(name => injection.expect.includes(name));
    results.push({ injection: injection.name, caught, only, failed });
    console.log(`${caught ? (only ? 'CAUGHT' : 'CAUGHT (and more)') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ')}`);
  } finally { writeFileSync(injection.file, text); }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/land-paths-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught`);
