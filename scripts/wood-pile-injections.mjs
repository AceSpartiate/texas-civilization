// Injections for the one wood pile, felling and building on auto, and more hands faster (owner, 2026-09-28;
// docs/WOODS_AND_BUILDING.md §6.7, docs/FAMILY_PANEL.md §21). CLAUDE.md: "a new test is not evidence until it has failed". Each
// injection puts back one exact mistake, the new test files are run, the failing tests are recorded against the test the injection
// was written for, and every file is restored.
// Run: node scripts/wood-pile-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/auto-house.test.mjs', 'tests/hands.test.mjs'];
const T = {
  house: 'one person felling on auto and one building on auto, left alone, raise the house with no further clicks',
  press: 'felling is one press: the nearest timber on the family\'s land, the logs onto the pile, and nothing to haul or fetch on the panel',
  enough: 'a feller on auto calls it enough when the house has its logs and a margin, and takes the axe up again when the pile falls',
  old: 'an old save with logs lying out and a hauler on auto opens with the logs on the pile and the hauler felling',
  clear: 'clearing on auto: the plot given, then the next staked plot nearest the house, until none is left',
  curve: 'more hands on the house go faster, each a little less than the last: 1, 1.8, 2.4 and 2.8 of one',
  join: 'a second pair of hands at the planting works alongside the first: the field is planted once, sooner, and the seed spent once',
  crowd: 'a fifth of the family is refused a work four are at, in words; the hands alongside take the job up if its lead is called away',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'enough counts every log alike: a pile of poor logs stops the feller while the walls want sound ones', expect: T.house,
    edits: [one('sim/woodpile.mjs', 'if (logsShort(household.logs, needs) || have < house + WOOD_MARGIN) return null;', 'if (have < house + WOOD_MARGIN) return null;')] },
  { name: 'the builder waiting on the pile is not told it is waiting for logs', expect: T.house,
    edits: [one('sim/houses.mjs', '  return Boolean(next && next.piece.progress === 0 && logsShort(household.logs, next.stage.logs));', '  return false;')] },
  { name: 'building is not repeated on auto', expect: T.house,
    edits: [one('sim/auto.mjs', "  'build-house', 'cut-lane', 'dig-well', 'fell-trees',", "  'cut-lane', 'dig-well', 'fell-trees',")] },
  { name: 'the logs lie where the tree fell, not on the pile', expect: T.press,
    edits: [one('sim/felling.mjs', "logs: tree.logs, left: 0 };\n  world.woods.revision += 1;\n  stackLogs(household, { [tree.use]: tree.logs });", "logs: tree.logs, left: tree.logs };\n  world.woods.revision += 1;")] },
  { name: 'felling still wants a place tapped on the map', expect: T.press,
    edits: [one('sim/chores.mjs', '  if (chore.fells && !Number.isFinite(extra.ground?.x)) {\n    const ground = fellingGround(world, household);', '  if (false) {\n    const ground = fellingGround(world, household);')] },
  { name: 'no cap: a feller on auto fells for ever', expect: T.enough,
    edits: [one('sim/auto.mjs', "  'fell-trees': (world, household) => pileFull(world, household),", "  'fell-trees': () => null,")] },
  { name: 'an old save opens with its logs still lying out', expect: T.old,
    edits: [one('server/storage.mjs', '  if (save.world?.households) foldLyingLogs(save.world);', '')] },
  { name: 'a clearer on auto stops after the plot given', expect: T.clear,
    edits: [one('sim/auto.mjs', '  if (given) return given;\n  const home', '  return given || null;\n  const home')] },
  { name: 'every hand a whole hand: no diminishing return', expect: T.curve,
    edits: [one('sim/hands.mjs', 'export const HAND_SHARES = Object.freeze([1, 0.8, 0.6, 0.4]);', 'export const HAND_SHARES = Object.freeze([1, 1, 1, 1]);')] },
  { name: 'more hands go no faster on work into one thing', expect: T.curve,
    edits: [one('sim/chores.mjs', "  if (chore.house) return handShare(handsOn(world, household));", "  if (chore.house) return 1;")] },
  { name: 'a second planter plants again rather than working alongside', expect: T.join,
    edits: [one('sim/chores.mjs', '    if (lead) return joinAlongside(world, household, entity, chore, choreId, lead, extra);', '')] },
  { name: 'the lead goes no faster for the hands alongside', expect: T.join,
    edits: [one('sim/chores.mjs', "  if (chore.crew === 'join') return crewPace(1 + household.members.filter(id => world.entities[id]?.chore?.alongside === entity.id).length);", "  if (chore.crew === 'join') return 1;")] },
  { name: 'no cap: a fifth of the family is given the work', expect: T.crowd,
    edits: [one('sim/chores.mjs', '    if (on.length >= MOST_HANDS) return { can: false, why: crowdedWhy(on.map(other => other.name)) };', '')] },
  { name: 'the lead called away, the hand alongside stops', expect: T.crowd,
    edits: [one('sim/chores.mjs', '    beginChore(world, household, entity, state.id, deps, DEFAULT_MODE, plotId ? { plotId } : {});\n  } catch {', '    throw new Error(\'stop\');\n  } catch {')] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const results = [];
const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
for (const injection of INJECTIONS) {
  const saved = new Map();
  try {
    for (const { file, from, to } of injection.edits) {
      const text = saved.get(file) ?? readFileSync(file, 'utf8');
      if (!saved.has(file)) saved.set(file, text);
      // Matched with the file's own line endings, whichever a checkout gave it.
      const current = readFileSync(file, 'utf8'), crlf = current.includes('\r\n');
      const plain = crlf ? current.replace(/\r\n/g, '\n') : current;
      if (!plain.includes(from)) throw new Error(`${injection.name}: not found in ${file}`);
      const changed = plain.replace(from, to);
      writeFileSync(file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    }
    const failed = run();
    const caught = failed.includes(injection.expect);
    results.push({ injection: injection.name, expect: injection.expect, caught, alone: caught && failed.length === 1, failed });
    console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && failed.length === 1 ? ' (alone)' : ''}: ${injection.name}${failed.length ? ` -> ${failed.join(' | ')}` : ''}`);
  } finally {
    for (const [file, text] of saved) writeFileSync(file, text);
  }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/wood-pile-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught; wrote docs/evidence/wood-pile-injections.json`);
