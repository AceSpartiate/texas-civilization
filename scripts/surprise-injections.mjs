// The regressions the surprise at Béxar's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until
// it has failed"), as scripts/battle-alamo-injections.mjs does: each injection replaces one exact piece of a file - found
// exactly once, CRLF or not - runs the check written for it, records what stopped it, and puts the file back byte for byte.
// A unit injection runs tests/surprise.test.mjs and requires the named test, and no other, to fail; a browser injection runs
// scripts/bexar-alarm-browser-proof.mjs and requires its failure to be the message written for it. Each gate is run clean
// first and again at the end with every file put back.
//
// Same computer. Run: node scripts/surprise-injections.mjs [unit|browser|dry] [name-part]
//   -> writes docs/evidence/surprise-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TEST = 'tests/surprise.test.mjs';
const BEFORE = 'before February 23 nobody hears that Santa Anna is marching; Herrera\'s warning is heard only in Béxar, disbelieved';
const BELL = 'on February 23 a family with somebody in or near Béxar hears the bell through them; everybody else only when a rider comes';
const REVEALED = 'the ending reveals the snow march and why Béxar was caught unprepared, once the class has lived February 23';
const ROWS = 'the Yucatán dead are Urrea\'s, in the norther of February 25: the rows corrected and no game text puts them in the snow';

const OLD_RUMOUR = "  once(world, 'spring-grass', () => sendWord(world, 'winter-santa-anna', { truth: 'It is said Santa Anna himself has crossed the Rio Grande with a great army, through snow, and is marching on Béxar.', status: 'rumor', claimId: 'HIST-TEX-053', source: 'A rumour from the west' }));";
const EVERYBODY_ON_THE_DAY = "\n  for (const one of Object.keys(world.households)) learn(world, one, 'bexar-arrival', { status: 'confirmed', source: 'Word', text: 'The Mexican army is in Béxar.' });";
const BELL_LEARNED = "    learn(world, person.householdId, 'bexar-arrival', { status: 'confirmed', source: `${person.name}, at Béxar`, text, causes: [truth.eventId] });\n  }\n}";
const OLD_CARD = "`At ${person.name}'s side: the Mexican army is marching into Béxar and the garrison is going into the Alamo. ${person.name} is going in with them.`";
const NEW_CARD = "`At ${person.name}'s side: the bell of San Fernando is ringing. The sentry on the church has seen the Mexican army on the heights to the west - the army nobody here looked for before March. The garrison is running for the Alamo, and ${person.name} with them.`";

const UNIT = [
  { name: 'the old rumour that Santa Anna has crossed, back', file: 'sim/directors.mjs',
    from: "  once(world, 'spring-grass', () => sendWord(world, 'winter-grass', { truth: SPRING_WORD, claimId: 'HIST-TEX-611', source: 'Word from Béxar' }));", to: OLD_RUMOUR, expect: BEFORE },
  { name: 'Herrera\'s warning told to every family', file: 'sim/surprise.mjs',
    from: "    learn(world, person.householdId, 'herrera-report', { status: 'rumor',", to: "    for (const one of Object.keys(world.households)) learn(world, one, 'herrera-report', { status: 'rumor', source: 'Word', text: HERRERA_WORD });\n    learn(world, person.householdId, 'herrera-report', { status: 'rumor',", expect: BEFORE },
  { name: 'Herrera\'s warning told as believed', file: 'sim/surprise.mjs',
    from: 'Most of them do not believe it - no army can come before the grass, they say - and they broke up without deciding anything.', to: 'They believe him, and send for help.', expect: BEFORE },
  { name: 'every family hears the bell on the day', file: 'sim/surprise.mjs', from: BELL_LEARNED, to: `${BELL_LEARNED.slice(0, -2)}${EVERYBODY_ON_THE_DAY}
}`, expect: BELL },
  { name: 'no card for a family near Béxar', file: 'sim/alamo-battle.mjs',
    from: '    for (const person of atOrNearBexar(world)) if (!battle.alerted[person.householdId]) card(', to: '    for (const person of []) if (!battle.alerted[person.householdId]) card(', expect: BELL },
  { name: 'Gonzales hears with the colonies', file: 'sim/directors.mjs',
    from: "'arrival-gonzales': 211680 + 1440 + 960,", to: "'arrival-gonzales': 216720,", expect: BELL },
  { name: 'the Host\'s camera not on the bell', file: 'sim/alamo-battle.mjs',
    from: "  if (phaseId === 'arrival') light('alamo-siege', 'Béxar, February 23, about half past two: the bell of San Fernando rings", to: "  if (phaseId === 'arrival') light('alamo-siege', 'Béxar, February 23, about half past two: the church of San Fernando", expect: BELL },
  { name: 'the reveal without the snow', file: 'sim/surprise.mjs',
    from: 'paragraphs: [REVEAL.believed, REVEAL.warned, REVEAL.bell, REVEAL.snow, REVEAL.santaAnna, REVEAL.yucatan],', to: 'paragraphs: [REVEAL.believed, REVEAL.warned, REVEAL.bell, REVEAL.yucatan],', expect: REVEALED },
  { name: 'a game string puts the Yucatán dead in the snow', file: 'sim/surprise.mjs',
    from: 'export const REVEAL = Object.freeze({', to: "export const OLD_WORDS = 'Some recruits from Yucatán died of exposure in the snow.';\nexport const REVEAL = Object.freeze({", expect: ROWS },
  { name: 'HIST-TEX-053 back to the snow by February 13', file: 'HISTORY.md',
    from: '**Santa Anna\'s march.** About 6,000 men marched north from late December 1835; they crossed', to: '**Santa Anna\'s march.** About 6,000 men marched north from late December 1835; 15–16 inches of snow had fallen on them by February 13; they crossed', expect: ROWS },
];

const BROWSER = [
  { name: 'the old rumour that Santa Anna has crossed, back', file: 'sim/directors.mjs',
    from: UNIT[0].from, to: OLD_RUMOUR, expect: 'knew before the bell' },
  { name: 'every family hears the bell on the day', file: 'sim/surprise.mjs', from: BELL_LEARNED, to: `${BELL_LEARNED.slice(0, -2)}${EVERYBODY_ON_THE_DAY}
}`, expect: 'the family in the colonies knew on the day' },
  { name: 'the card without the bell', file: 'sim/alamo-battle.mjs', from: NEW_CARD, to: OLD_CARD, expect: 'the card does not tell the bell' },
  { name: 'the arrival drawn without the bell', file: 'sim/battles/alamo.mjs',
    from: "      caption: 'Early in the afternoon the bell of San Fernando rings.", to: "      caption: 'Early in the afternoon the Mexican army comes.", expect: 'the caption does not tell the bell' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, () => to));
  try { return check(); } finally { writeFileSync(injection.file, original); }
}
function runUnit(file) {
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/bexar-alarm-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
if (which === 'dry') {
  for (const injection of [...UNIT, ...BROWSER]) {
    const original = readFileSync(injection.file, 'utf8');
    const from = original.includes(CR + LF) ? injection.from.split(LF).join(CR + LF) : injection.from;
    const count = original.split(from).length - 1;
    console.log(`${count === 1 ? 'found' : `FOUND ${count} TIMES`}: ${injection.name} (${injection.file})`);
  }
  process.exit(0);
}
const only = process.argv[3] || null;
const chosen = list => list.filter(one => !only || one.name.includes(only));
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/surprise-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

if (which === 'all' || which === 'unit') {
  const clean = runUnit(TEST);
  if (!clean.passed) throw new Error(`${TEST} fails before any injection: ${clean.failed.join('; ')}`);
  for (const injection of chosen(UNIT)) {
    const seen = inject(injection, () => runUnit(TEST));
    const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
    record.unit.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  const after = runUnit(TEST);
  if (!after.passed) throw new Error(`${TEST} fails after every file was put back: ${after.failed.join('; ')}`);
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of chosen(BROWSER)) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
const keep = (was = [], now) => [...was.filter(one => !now.some(run => run.name === one.name)), ...now].filter(one => [...UNIT, ...BROWSER].some(defined => defined.name === one.name));
const merged = {
  record: 'surprise-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${TEST}, the named test and no other`, browser: 'scripts/bexar-alarm-browser-proof.mjs, its failure the message written for it' },
  unit: keep(previous.unit, record.unit),
  browser: keep(previous.browser, record.browser),
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
