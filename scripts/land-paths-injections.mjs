// Injections for the way round the trees, paths and the fenced yard (owner, 2026-10-02; sim/land-paths.mjs). CLAUDE.md: "a new test
// is not evidence until it has failed". Each injection puts back one exact mistake, tests/land-paths.test.mjs is run, and every
// file is restored. An injection is caught when every test it names fails; the record keeps whatever else failed with it.
// Run: node scripts/land-paths-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/land-paths.test.mjs'];
const T = {
  round: 'a way across the family\'s land goes round the standing trees, and the person walks it, drawn along the points walked',
  path: 'walking a path is quicker than the country it crosses, and the way found keeps to it',
  trodden: 'once the house stands the family treads a way to its water and its plots; a class saved with none opens with none and validates',
  cut: 'Cut a path: the trees in its way come down onto the pile, it wants an axe, it is held back in the lesson, and it is walked',
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
  { name: 'no way is trodden when the house stands', expect: [T.trodden],
    file: 'sim/land-paths.mjs', from: '  let laid = 0;\n', to: '  let laid = 0;\n  return;\n' },
  { name: 'a trodden way is laid straight over the trees', expect: [T.trodden],
    file: 'sim/land-paths.mjs', from: '      const points = landRoute(world, household, door, at).map(p => ({ x: r4(p.x), y: r4(p.y) }));', to: '      const points = [door, at];' },
  { name: 'cutting a path walks past the trees in its way and fells none', expect: [T.cut],
    file: 'sim/land-paths.mjs', from: '  if (tree) return { tree, at: { x: tree.x, y: tree.y } };', to: '' },
  { name: 'a path through the timber is cut without an axe', expect: [T.cut],
    file: 'sim/chores.mjs', from: '    if (cutPathWork(world, household, plan, fellAndCarryTicks).wantsAxe && household.tools?.axe === undefined) throw new Error(PATH_AXE_WHY);', to: '' },
  { name: 'the lesson does not hold back paths and the yard', expect: [T.cut],
    file: 'sim/lesson.mjs', from: "export const LATER_WORK = Object.freeze(['cut-path', 'chore:cut-path', 'chore:fence-yard']);", to: 'export const LATER_WORK = Object.freeze([]);' },
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
