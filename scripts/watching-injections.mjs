// The regressions tests/watching.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"): a student with no family left follows and watches another (owner, 2026-09-29, "Follow and watch"; sim/watching.mjs),
// the straggler at the refuge when the family turns home, and the little ones with nobody near to take them in (triage D3).
// Each injection replaces one exact piece of code with the mistake, runs the test file, records which of its tests failed, and
// puts the file back byte for byte. **Caught** means the test named for the rule failed; **alone** means nothing else in the file
// did. It stops if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// Run: npm run test:watching-injections  → writes docs/evidence/watching-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const WATCHING = 'sim/watching.mjs', WORLD = 'sim/world.mjs', ACTING = 'sim/acting.mjs', TEST = 'tests/watching.test.mjs';
const GONE = /^the rule: a student whose whole family is gone/, TAKEN = /^the rule: a student whose little ones were taken in/;
const INJECTIONS = [
  // Follow and watch.
  { name: 'a gone family’s student is sent their own empty page', file: WATCHING, from: '  if (!familyGone(world, household)) return null;', to: '  return null;', expect: GONE },
  { name: 'the student follows the furthest family, not the nearest', file: WATCHING, from: 'far(home, siteOf(world, a.homeSiteId)) - far(home, siteOf(world, b.homeSiteId))', to: 'far(home, siteOf(world, b.homeSiteId)) - far(home, siteOf(world, a.homeSiteId))', expect: GONE },
  { name: 'the watching page is sent the Host’s knowledge', file: WATCHING, from: "  const view = project(world, watch.householdId || household.id, 'student', options);", to: "  const view = project(world, watch.householdId || household.id, 'host', options);", expect: GONE },
  { name: 'the watching page keeps the watched family’s work to give', file: WATCHING, from: '  view.work = {}; view.travelModes = {}; view.offers = [];', to: '', expect: GONE },
  { name: 'the watching page takes the watched family for its own', file: WATCHING, from: '  view.householdId = household.id;', to: '', expect: GONE },
  { name: 'the ending shown is the watched family’s', file: WATCHING, from: "  Object.assign(view, ending(world, household.id, 'student'));", to: '', expect: GONE },
  { name: 'a watching student’s orders are taken', file: WORLD, from: '  if (watching) throw new Error(watching);', to: '', expect: GONE },
  { name: 'the line does not say what happened', file: WATCHING, from: "  const what = dead ? `Everybody of ${own} has died.` : `Everybody of ${own} has died or been taken prisoner.`;", to: "  const what = '';", expect: GONE },
  { name: 'the server sends the page no line at all', file: WORLD, from: '  return projectWatching(world, household, watch, { project: projectWorld, ending: endingProjection, options });', to: '  return projectWorld(world, householdId, role, options);', expect: GONE },
  { name: 'the student whose little ones were taken in watches nobody', file: WATCHING, from: "    ? null : { householdId: host.id, why: 'taken-in' };", to: '    ? null : null;', expect: TAKEN },
  { name: 'a student whose father serves with the army is made to watch', file: WATCHING, from: '  if (host) return peopleOf(world, household).some(', to: '  if (host) return false && peopleOf(world, household).some(', expect: TAKEN },
  { name: 'a prisoner of war counts as somebody left to play', file: WATCHING, from: " && person.service?.status !== 'prisoner')\n    ? null", to: ')\n    ? null', expect: TAKEN },
  // The straggler and the lone toddlers (triage D3).
  { name: 'a straggler at the refuge is left there when the family has gone home', file: ACTING, from: "  if (['returning', 'home'].includes(flight?.status) && flight.refuge && person?.location?.siteId === flight.refuge) return household.homeSiteId;", to: '', expect: /^the rule: somebody who reaches the refuge after the family has turned for home/ },
  { name: 'little ones with nobody near are left without a word', file: ACTING, from: '        else nobodyNear(world, household);', to: '', expect: /^the rule: little ones at home with no neighbour family near/ },
  { name: 'the family is told the little ones are alone every tick', file: ACTING, from: '  if (household.leftAlone === day) return;', to: '', expect: /^the rule: little ones at home with no neighbour family near/ },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const chosen = INJECTIONS.filter(injection => !only || only.test(injection.name));
const clean = run();
if (clean.length) throw new Error(`${TEST} fails before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of chosen) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  const caught = failed.some(name => injection.expect.test(name));
  const alone = caught && failed.length === 1;
  record.push({ name: injection.name, file, caught, alone, failed });
  console.log(`${caught ? (alone ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error(`${TEST} fails after every file was put back`);
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/watching-injections.json', `${JSON.stringify({
    record: 'watching-injections',
    date: new Date().toISOString().slice(0, 10),
    note: 'Follow and watch (owner, 2026-09-29; sim/watching.mjs), the straggler at the refuge and the little ones with nobody near (triage D3). Each injection is run against tests/watching.test.mjs; "alone" means the test named for the rule was the only one to fail.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone${only ? '' : '; wrote docs/evidence/watching-injections.json'}`);
process.exit(record.every(r => r.caught) ? 0 : 1);
