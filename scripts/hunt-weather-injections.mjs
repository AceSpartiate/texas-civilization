// The regressions tests/hunt-weather.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). Each injection replaces one exact piece of sim/hunting.mjs or sim/chores.mjs with the mistake a
// test is written against, runs the test file, records which tests failed, and puts the file back byte for byte.
//
// Run: node scripts/hunt-weather-injections.mjs  → writes docs/evidence/hunt-weather-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/hunt-weather.test.mjs'];
const FILE = 'sim/hunting.mjs';
const INJECTIONS = [
  // 1. The wait.
  {
    name: 'the sky does nothing to the wait downwind, as it did until today',
    from: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 0.6, rain: 1.5, storm: 1.8, norther: 1.4 });',
    to: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 1, rain: 1, storm: 1, norther: 1 });',
  },
  {
    name: 'rain is good hunting weather and a fog is bad, which is backwards',
    from: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 0.6, rain: 1.5, storm: 1.8, norther: 1.4 });',
    to: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 1.5, rain: 0.6, storm: 0.6, norther: 0.8 });',
  },
  {
    name: 'a storm is kinder to a hunter than ordinary rain',
    from: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 0.6, rain: 1.5, storm: 1.8, norther: 1.4 });',
    to: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 0.6, rain: 1.8, storm: 1.2, norther: 1.4 });',
  },
  {
    name: 'a fair day is weighted like any other, so the plain day is not the baseline',
    from: 'export const HUNT_WAIT = Object.freeze({ fair: 1, fog: 0.6, rain: 1.5, storm: 1.8, norther: 1.4 });',
    to: 'export const HUNT_WAIT = Object.freeze({ fair: 1.2, fog: 0.6, rain: 1.5, storm: 1.8, norther: 1.4 });',
  },
  {
    name: 'a sky nobody has a number for lengthens the wait rather than leaving it alone',
    from: 'export const huntWait = kind => HUNT_WAIT[kind] ?? 1;',
    to: 'export const huntWait = kind => HUNT_WAIT[kind] ?? 2;',
  },
  {
    name: 'the weather is applied and the ground is not, so every country hunts alike',
    from: 'export const stillTicks = (game, base = 1, weather = 1) =>\n  Math.max(1, Math.round(Math.min(5 * base, Math.ceil(base / Math.max(0.2, game))) * weather));',
    to: 'export const stillTicks = (game, base = 1, weather = 1) =>\n  Math.max(1, Math.round(base * weather));',
  },
  {
    name: 'the wait can come out at no ticks at all in a fog on the best ground',
    from: '  Math.max(1, Math.round(Math.min(5 * base, Math.ceil(base / Math.max(0.2, game))) * weather));',
    to: '  Math.round(Math.min(5 * base, Math.ceil(base / Math.max(0.2, game))) * weather);',
  },
  {
    name: 'the hunt is never told what the sky is, so the multiplier is computed and thrown away',
    file: 'sim/chores.mjs',
    from: '      const sky = step.stalk === \'still\' && state.ground ? huntWait(weatherAt(world, huntPoint(entity)).kind) : 1;',
    to: '      const sky = 1;',
  },
  // 2. The powder.
  {
    name: 'the powder stays dry in the rain, and waiting is a certainty whatever the sky',
    file: 'sim/chores.mjs',
    from: "      const close = (state.flags || []).includes('wait') && !damp;",
    to: "      const close = (state.flags || []).includes('wait');",
  },
  {
    name: 'the powder is damp on every day of the year, fair ones included',
    from: 'export const powderDamp = (world, point, day) => Boolean(point) && rainingAt(world, point, day);',
    to: 'export const powderDamp = (world, point) => Boolean(point);',
  },
  {
    name: 'a norther that carried no rain is counted as wet, because the kind is read instead of the rain',
    from: 'export const powderDamp = (world, point, day) => Boolean(point) && rainingAt(world, point, day);',
    to: "export const powderDamp = (world, point, day) => Boolean(point) && weatherAt(world, point, day).kind !== 'fair';",
  },
  {
    name: 'a steady hand is beaten by the rain like anybody else, so the knack stops meaning anything',
    file: 'sim/chores.mjs',
    from: '      if (!close && !steadyHand(entity) && !trueRifle) {',
    to: '      if (!close && (damp || (!steadyHand(entity) && !trueRifle))) {',
  },
  {
    name: 'a damp charge is reported as a miss, so the family never learns what went wrong',
    file: 'sim/chores.mjs',
    from: '          text: damp\n            ? `${entity.name}\'s powder had taken the wet and the rifle would not fire. The afternoon is gone.`\n            : `${entity.name} fired and missed \\u2014 ${unsteadyBecause(entity)}. The afternoon is gone.`,',
    to: '          text: `${entity.name} fired and missed \\u2014 ${unsteadyBecause(entity)}. The afternoon is gone.`,',
  },
  // 3. What the family is told before it chooses.
  {
    name: 'the sky is never mentioned on the control, so the rain is a surprise',
    from: '  if (!named) return \'\';',
    to: '  return \'\';\n  if (!named) return \'\';', // eslint-disable-line no-unreachable
  },
  {
    name: 'a fair day is remarked on like weather, so every day reads as an event',
    from: "  const named = { rain: 'It is raining', storm: 'A storm is over it', norther: 'A norther is blowing', fog: 'A fog lies on it' }[here.kind];",
    to: "  const named = { fair: 'It is fair', rain: 'It is raining', storm: 'A storm is over it', norther: 'A norther is blowing', fog: 'A fog lies on it' }[here.kind];",
  },
  {
    name: 'the words are written beside the numbers instead of read off them, and drift from what the hunt does',
    from: "  const going = wait > 1 ? 'the game lies up and the wait is longer' : wait < 1 ? 'the approach is hidden and the wait is short' : null;",
    to: "  const going = 'the game lies up and the wait is longer';",
  },
  {
    name: 'the powder clause is said on every weather day, wet or not',
    from: "  const powder = rainingAt(world, point, day ?? dayOfWorld(world)) ? 'the powder will not stay dry, and even a close shot may not fire' : null;",
    to: "  const powder = 'the powder will not stay dry, and even a close shot may not fire';",
  },
  {
    name: 'the place says nothing of the sky, though the hunt reads it',
    from: '  const words = [where, flocking ? \'Ducks and geese sit on the water in numbers: the wait is short.\' : GAME_WORDS.find(([least]) => place.game >= least)[1], quarryWords(place.quarry, monthOf(world)), comes, skyWords(world, point)].filter(Boolean).join(\' \');',
    to: '  const words = [where, flocking ? \'Ducks and geese sit on the water in numbers: the wait is short.\' : GAME_WORDS.find(([least]) => place.game >= least)[1], quarryWords(place.quarry, monthOf(world)), comes].filter(Boolean).join(\' \');',
  },
  {
    name: 'the shot still promises a certainty in the rain, and the student finds out afterwards',
    file: 'sim/chores.mjs',
    from: "      { id: 'wait', label: 'Wait for it to come closer', note: powderDamp(world, huntPoint(entity)) ? `One powder, three more hours, and the rain is on the powder: ${(rifleTrue(household) && entity.health?.condition !== 'tired') || steadyHand(entity) ? 'a steady hand can still be sure of it' : 'even close it may not fire'}` : 'One powder, three more hours, and then the shot is a certainty' },",
    to: "      { id: 'wait', label: 'Wait for it to come closer', note: 'One powder, three more hours, and then the shot is a certainty' },",
  },
  {
    name: 'the question itself never says the rain is on the powder',
    file: 'sim/chores.mjs',
    from: "It is not a close one.${world && powderDamp(world, huntPoint(entity)) ? ' The rain is on the powder.' : ''}`,",
    to: 'It is not a close one.`,',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed, ...(injection.expect && { expect: injection.expect }) });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/hunt-weather-injections.json', `${JSON.stringify({ record: 'hunt-weather-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/hunt-weather-injections.json`);
