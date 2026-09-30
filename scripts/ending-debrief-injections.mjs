// The regressions the ending's debrief and plain sums guard (docs/audits/2026-09-29-triage.md 2.8, 2.9, 2.10, 2.11, 3.7;
// tests/ending-debrief.test.mjs), injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each
// replaces one exact piece of a file with the mistake a test is written against, runs the test file, records which tests
// failed, checks that the test written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:ending-debrief-injections  → writes docs/evidence/ending-debrief-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/ending-debrief.test.mjs'];
const T = { east: 'a family still going east', debrief: 'the Host\'s debrief carries the spring', sum: 'each award is a sum a student can follow', went: 'nobody under 18 who died of a sickness', formula: 'the final number is written one way' };
const INJECTIONS = [
  { name: '2.9 every family not home is "on the road home" again', file: 'sim/ending-story.mjs', from: "    : flight.status === 'returning' ? ' When the class ended they were on the road home.'\n    : flight.status === 'refuged' ? ` When the class ended they were camped at ${refuge || 'a refuge to the east'}.`\n    : ' When the class ended they were still on the road east.';", to: "    : ' When the class ended they were on the road home.';", expect: T.east },
  { name: '2.9 a family camped at its refuge is said to be on the road home', file: 'sim/ending-story.mjs', from: "    : flight.status === 'refuged' ? ` When the class ended they were camped at ${refuge || 'a refuge to the east'}.`\n", to: "    : flight.status === 'refuged' ? ' When the class ended they were on the road home.'\n", expect: T.east },
  { name: '2.8 the question about the scoring is back', file: 'sim/ending.mjs', from: "  'What did a family give up at home when somebody went, and what did staying home cost?',\n]);", to: "  'What did a family give up at home when somebody went, and what did staying home cost?',\n  'Why do the families with the most coin and the families with the most glory not always match?',\n]);", expect: T.debrief },
  { name: '2.8 the Host is sent no spring', file: 'sim/ending.mjs', from: '      spring: springWords(world, household)?.spring ?? null,', to: '      spring: null,', expect: T.debrief },
  { name: '2.8 every farm is standing', file: 'sim/ending-story.mjs', from: "  return { spring, farm: Number.isFinite(flight.burned) ? `Burned ${day(world, flight.burned)}` : 'Standing' };", to: "  return { spring, farm: 'Standing' };", expect: T.debrief },
  { name: '2.8 the Alamo\'s news never heard', file: 'sim/ending.mjs', from: "  if (report) return day(world, report.receivedMinute);\n  return world.truth?.['alamo-fall'] ? 'never' : null;", to: "  return world.truth?.['alamo-fall'] ? 'never' : null;", expect: T.debrief },
  { name: '2.8 the standing questions before the class\'s own', file: 'sim/ending.mjs', from: 'discussion: [...classHooks(world), ...DISCUSSION]', to: 'discussion: [...DISCUSSION, ...classHooks(world)]', expect: T.debrief },
  { name: '2.8 a hook begins "the Springwright family" on the projector', file: 'sim/ending-story.mjs', from: '  return hooks.map(hook => hook.charAt(0).toUpperCase() + hook.slice(1));', to: '  return hooks;', expect: T.debrief },
  { name: '2.10 the product rounded, not the coin counted', file: 'sim/ending.mjs', from: 'export const finalNumber = (money, glory, land = 0, kept = 1) => coinCounted(money, kept) * (1 + Math.max(0, glory)) + land;', to: 'export const finalNumber = (money, glory, land = 0, kept = 1) => Math.round(countedCoin(money) * kept * (1 + Math.max(0, glory))) + land;', expect: T.sum },
  { name: '2.10 the coin counted shown to a hundredth again', file: 'sim/ending.mjs', from: '  const counted = coinCounted(money, kept);', to: '  const counted = Math.round(countedCoin(money) * kept * 100) / 100;', expect: T.sum },
  { name: '2.10 an award as a bare number', file: 'sim/ending.mjs', from: '  if (award.points === earned) return `${sum} glory.`;', to: '  if (award.points === earned) return `(${award.points})`;', expect: T.sum },
  { name: '2.10 the multiplier read back from the rounded miles', file: 'sim/ending.mjs', from: '  const times = award.times ?? distanceMultiplier(award.miles);', to: '  const times = distanceMultiplier(award.miles);', expect: T.sum },
  { name: '2.10 an award saved before `times` counted once', file: 'sim/ending.mjs', from: '  const times = award.times ?? distanceMultiplier(award.miles);', to: '  const times = award.times ?? 1;', expect: T.sum },
  { name: '2.10 the prisoners\' step left out of the sentences', file: 'sim/ending.mjs', from: '  if (taken) said.push(', to: '  if (false) said.push(', expect: T.sum },
  { name: '2.11 everybody with a part named', file: 'sim/ending.mjs', from: '  const named = ids.filter(id => !unnamedOnProjector(world.entities[id]));', to: '  const named = ids;', expect: T.went },
  { name: '2.11 only under sixteen left out, as the class panel', file: 'sim/ending.mjs', from: 'export const UNNAMED_UNDER = 18;', to: 'export const UNNAMED_UNDER = 16;', expect: T.went },
  { name: '2.11 the child left out and not counted', file: 'sim/ending.mjs', from: "  return unnamed ? [...names, unnamed === 1 ? 'a child of the family' : `${unnamed} children of the family`] : names;", to: '  return names;', expect: T.went },
  { name: '2.11 a death of wounds left out too', file: 'sim/ending.mjs', from: "const unnamedOnProjector = person => person?.health?.condition === 'dead' && Boolean(person.health.disease) && ", to: "const unnamedOnProjector = person => person?.health?.condition === 'dead' && ", expect: T.went },
  { name: '3.7 the Host\'s footer leaves out the prisoners\' share again', file: 'sim/ending.mjs', from: ', less ${PRISONER_WEIGHT} parts for each person taken prisoner in the spring out of one part for each of the family\'s living people, rounded to a whole real.`,', to: '.`,', expect: T.formula },
  { name: '3.7 the formula written without the floor on glory', file: 'sim/ending.mjs', from: ')) × (1 + max(glory, 0)) + land`;', to: ')) × (1 + glory) + land`;', expect: T.formula },
  { name: '3.7 VISION.md back to the formula of 2026-09-16', file: 'VISION.md', from: '`final = round(max(coin, 1) × max(0, 1 − 1.5 × prisoners ÷ living people)) × (1 + max(glory, 0)) + land`', to: '`final = max(money, 1) × (1 + glory) + land`', expect: T.formula },
  // Every copy in the document: it carries the formula in §5 and again in §7.1.
  { name: '3.7 MONEY_AND_GLORY.md without the prisoners\' weight', file: 'docs/MONEY_AND_GLORY.md', from: '1 − 1.5 × prisoners ÷ living people', to: '1 − prisoners ÷ living people', all: true, expect: T.formula },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8').replace(/\r\n/g, '\n');
  const at = original.indexOf(injection.from);
  if (at < 0) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
  // The documents carry the formula in more than one place: the one replaced must be the one meant.
  if (injection.file.endsWith('.mjs') && original.indexOf(injection.from, at + 1) >= 0) throw new Error(`Injection pattern found twice in ${injection.file}: ${injection.name}`);
}
const clean = run();
if (clean.length) throw new Error(`The tests fail before anything is injected: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = original.replace(/\r\n/g, '\n')[injection.all ? 'replaceAll' : 'replace'](injection.from, injection.to);
  writeFileSync(injection.file, crlf ? text.replace(/\n/g, '\r\n') : text);
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  const caught = failed.some(name => name.includes(injection.expect));
  const only = caught && failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, only, failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !only ? ' (with others)' : ''} ${injection.name}${caught && only ? '' : ` (failed: ${failed.join('; ') || 'nothing'})`}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/ending-debrief-injections.json', `${JSON.stringify({ record: 'ending-debrief-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/ending-debrief-injections.json`);
