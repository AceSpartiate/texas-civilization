// Injections for "Builders fell their own" (owner, 2026-10-09; docs/WOODS_AND_BUILDING.md §6.14). CLAUDE.md: "a new test is not
// evidence until it has failed". Each injection puts back one exact mistake, tests/house-logs.test.mjs is run, and the file is restored.
// Run from the repository root: node scripts/house-logs-injections.mjs   (ONLY=I3 runs the injections whose id starts so)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const INJECTIONS = [
  { id: 'I1 the house hidden from the work list while the pile is short', guards: 'Work on the house is on the bar',
    file: 'sim/chores.mjs', find: '  const settled = houseSettled(household);', put: '  const settled = houseSettled(household) || houseWaitsForLogs(household, world);' },
  { id: 'I1b the old tip back', guards: 'Work on the house is on the bar',
    file: 'public/tips.js', find: 'they fell the logs it needs and raise it.', put: 'where it needs logs, put one on “Fell trees” and turn on auto.' },
  { id: 'I2 a free log for every tick of felling for the house', guards: 'nothing comes free',
    file: 'sim/chores.mjs', find: '  if (state.felling) { fellTree(world, household, entity, state.felling); delete state.felling; }\n  // Helping across the custom (owner, 2026-10-04): the tree in hand down',
    put: '  if (state.forLogs === \'fell\') household.logs = { ...household.logs, wall: (household.logs?.wall || 0) + 1 };\n  if (state.felling) { fellTree(world, household, entity, state.felling); delete state.felling; }\n  // Helping across the custom (owner, 2026-10-04): the tree in hand down' },
  { id: 'I2b the felling for the house never ends at what the house wants', guards: 'nothing comes free',
    file: 'sim/chores.mjs', find: '    if (logsShort(household.logs, houseNeeds(world, household)) && fellForHouse(', put: '    if (fellForHouse(' },
  { id: 'I3 the walls and a feller no longer share the axe at home', guards: 'one felling axe locks no builder out',
    file: 'sim/keeping.mjs', find: "    if (item === 'axe' && !away(world, household, person) && houseAndFelling(work, shares, person.chore)) continue;", put: '' },
  { id: 'I3b the house refused for the axe in a feller\'s hands', guards: 'one felling axe locks no builder out',
    file: 'sim/chores.mjs', find: "  const axe = choreId === 'build-house' ? null : axeFor(world, household, choreId, extra);", put: '  const axe = axeFor(world, household, choreId, extra);' },
  { id: 'I3c a hauler holds the axe while dragging logs in', guards: 'one felling axe locks no builder out',
    file: 'sim/chores.mjs', find: "state.forLogs = 'haul'; state.hauls = feller.id; holdAxe(household, state, 'none'); }", put: "state.forLogs = 'haul'; state.hauls = feller.id; }" },
  { id: 'I4 haulers add nothing to the felling', guards: 'fells faster',
    file: 'sim/chores.mjs', find: '  const haulers = haulersOf(world, household, entity);\n  for (let extra = 0;', put: '  const haulers = 0;\n  for (let extra = 0;' },
  { id: 'I5 auto holds the house while the pile is short', guards: 'auto does the same',
    file: 'sim/auto.mjs', find: "  'fell-trees': (world, household) => pileFull(world, household),", put: "  'fell-trees': (world, household) => pileFull(world, household),\n  'build-house': (world, household) => (houseWaitsForLogs(household, world) ? 'Waiting for logs. The log pile has not got them.' : null)," },
  { id: 'I6 the house shared work, no custom', guards: 'the custom holds',
    file: 'sim/custom.mjs', find: "  'build-house': ['men', 'Work on the house', 'went to work on the house {self}'],", put: '' },
  { id: 'I6b a boy under sixteen never fells for the house', guards: 'the custom holds',
    file: 'sim/chores.mjs', find: "  const axeFree = household.tools?.axe !== undefined && !userOf(", put: "  const axeFree = (entity.age ?? 99) >= 16 && household.tools?.axe !== undefined && !userOf(" },
  { id: 'I7 a builder saved waiting for logs stays held', guards: 'an old save opens',
    file: 'sim/auto.mjs', find: '      if (!person.order || !homeAndFree(household, person)) continue;', put: '      if (!person.order || !homeAndFree(household, person)) continue;\n      if (/Waiting for logs/.test(person.order.held || \'\')) continue;' },
];

const results = [];
for (const injection of INJECTIONS.filter(one => !process.env.ONLY || one.id.startsWith(process.env.ONLY))) {
  const raw = fs.readFileSync(injection.file, 'utf8');
  const crlf = raw.includes('\r\n');
  const text = raw.replace(/\r\n/g, '\n');
  if (text.split(injection.find).length !== 2) { results.push({ id: injection.id, error: 'injection does not match exactly once' }); continue; }
  const injected = text.replace(injection.find, () => injection.put);
  fs.writeFileSync(injection.file, crlf ? injected.replace(/\n/g, '\r\n') : injected);
  let out = '';
  try { out = execFileSync(process.execPath, ['--test', 'tests/house-logs.test.mjs'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 }); } catch (error) { out = `${error.stdout || ''}${error.stderr || ''}`; }
  fs.writeFileSync(injection.file, raw);
  const failed = [...new Set([...out.matchAll(/^✖ (.+?) \(\d/gm)].map(m => m[1]))];
  const caught = failed.some(name => name.includes(injection.guards));
  results.push({ id: injection.id, guards: injection.guards, caught, failed });
  console.log(caught ? 'CAUGHT' : 'MISSED', injection.id, '->', failed.map(name => name.slice(0, 60)).join(' | ') || 'nothing failed');
}
if (!process.env.ONLY) fs.writeFileSync('docs/evidence/house-logs-injections.json', `${JSON.stringify({ run: new Date().toISOString().slice(0, 10), results }, null, 2)}\n`);
