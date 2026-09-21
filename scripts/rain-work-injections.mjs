// The regressions tests/rain-work.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until
// it has failed"). Each injection replaces one exact piece of sim/weather.mjs, sim/houseplot.mjs or sim/houses.mjs with
// the mistake a test is written against, runs the test file, records which tests failed, and puts the file back byte for
// byte. It stops if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// **Line endings.** This working copy is CRLF and three harnesses here have been found silently matching nothing for
// exactly that reason - an injection whose `from` spans two lines never matches, the script throws, and a tired reader
// calls it a stale injection. `ends` rewrites each pattern to whatever the file on disk actually uses, so the same
// injection works in either.
//
// Run: node scripts/rain-work-injections.mjs  → writes docs/evidence/rain-work-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/rain-work.test.mjs'];
const WEATHER = 'sim/weather.mjs', PLOT = 'sim/houseplot.mjs', HOUSES = 'sim/houses.mjs';
const INJECTIONS = [
  // 1. The rule itself: what counts as rain, and what rain holds.
  {
    name: 'a storm is not counted as rain, so the one day a family should not be roofing is the one day it may',
    file: WEATHER,
    from: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && Boolean(here.wet)));",
    to: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || (here.kind === 'norther' && Boolean(here.wet)));",
  },
  {
    name: 'a norther that brought its rain is read as a dry one, and the roof goes on under it',
    file: WEATHER,
    from: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && Boolean(here.wet)));",
    to: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm');",
  },
  {
    name: 'a dry norther counts as rain, and half the winter stops the house for weather that is not falling',
    file: WEATHER,
    from: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && Boolean(here.wet)));",
    to: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || here.kind === 'norther');",
  },
  {
    name: 'a fog counts as rain, though a fog is the one wet morning nothing is falling out of',
    file: WEATHER,
    from: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && Boolean(here.wet)));",
    to: "export const rainingOn = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || here.kind === 'fog' || (here.kind === 'norther' && Boolean(here.wet)));",
  },
  {
    name: 'no sky read is taken for a wet sky, so a caller with no world holds everything',
    file: WEATHER,
    from: 'export const rainingOn = here => Boolean(here) && (',
    to: 'export const rainingOn = here => !here || (',
  },
  {
    name: 'the rain holds every kind of work there is, which is the whole-house stop this rule was written not to be',
    file: WEATHER,
    from: "export const rainHold = (here, work) => (work && RAIN_HOLDS[work] && rainingOn(here) ? RAIN_HOLDS[work] : null);",
    to: "export const rainHold = (here, work) => (rainingOn(here) ? (RAIN_HOLDS[work] || RAIN_HOLDS.roof) : null);",
  },
  {
    name: 'the rain holds nothing at all: the rule is there and is never true',
    file: WEATHER,
    from: "export const rainHold = (here, work) => (work && RAIN_HOLDS[work] && rainingOn(here) ? RAIN_HOLDS[work] : null);",
    to: "export const rainHold = () => null;",
  },
  {
    name: 'the roof is held and the daubing is not, so half the rule quietly goes missing',
    file: WEATHER,
    from: "export const rainHold = (here, work) => (work && RAIN_HOLDS[work] && rainingOn(here) ? RAIN_HOLDS[work] : null);",
    to: "export const rainHold = (here, work) => (work === 'roof' && rainingOn(here) ? RAIN_HOLDS.roof : null);",
  },
  {
    name: 'the sky is not read at all and the work alone decides, so a roof never goes on in any weather',
    file: WEATHER,
    from: "export const rainHold = (here, work) => (work && RAIN_HOLDS[work] && rainingOn(here) ? RAIN_HOLDS[work] : null);",
    to: "export const rainHold = (here, work) => (work && RAIN_HOLDS[work] ? RAIN_HOLDS[work] : null);",
  },
  {
    name: 'both faults are given the same words, so a family cannot tell the mud from the roof',
    file: WEATHER,
    from: "  daub: 'the mud would wash out of it before it set',",
    to: "  daub: 'the roof would go on wet',",
  },
  // 2. Which stages carry the tag: the half of the rule that is easiest to get wrong.
  {
    name: 'the chinking is not tagged, so the one stage with the word daub in its name is the one the rain misses',
    file: PLOT,
    from: "  { id: 'chink', doing: 'chinking and daubing the walls', work: 2, wet: 'daub' },",
    to: "  { id: 'chink', doing: 'chinking and daubing the walls', work: 2 },",
  },
  {
    name: 'the pen\'s roof is not tagged, so the stage this whole rule was built for goes on in the rain',
    file: PLOT,
    from: "  { id: 'roof', doing: 'putting on the rafters and riving the clapboards', work: 6, logs: { wall: 6 }, wet: 'roof' },",
    to: "  { id: 'roof', doing: 'putting on the rafters and riving the clapboards', work: 6, logs: { wall: 6 } },",
  },
  {
    name: 'a jacal\'s thatch and its daubed wall are untagged, so the one house a family with no axe can build ignores the sky',
    file: PLOT,
    from: "      { id: 'wattle', doing: 'weaving the walls and daubing them with mud', work: 6, wet: 'daub' },\n      { id: 'thatch', doing: 'thatching the roof', work: 5, wet: 'roof' },",
    to: "      { id: 'wattle', doing: 'weaving the walls and daubing them with mud', work: 6 },\n      { id: 'thatch', doing: 'thatching the roof', work: 5 },",
  },
  {
    name: 'the stick-and-mud chimney is untagged, though clay laid up in the open is exactly what the rule is about',
    file: PLOT,
    from: "    stages: [{ id: 'build', doing: 'laying up the chimney in sticks and clay', work: 4, wet: 'daub' }],",
    to: "    stages: [{ id: 'build', doing: 'laying up the chimney in sticks and clay', work: 4 }],",
  },
  {
    name: 'the shed room\'s roof is untagged while the pen\'s is not, so the rule stops at the pens',
    file: PLOT,
    from: "      { id: 'roof', doing: 'roofing the shed room', work: 3, logs: { any: 4 }, wet: 'roof' },",
    to: "      { id: 'roof', doing: 'roofing the shed room', work: 3, logs: { any: 4 } },",
  },
  {
    name: 'the porch roof is untagged, and the one piece nobody notices is the one that drifts',
    file: PLOT,
    from: "    stages: [{ id: 'roof', doing: 'setting the porch posts and roof', work: 4, logs: { any: 4 }, wet: 'roof' }],",
    to: "    stages: [{ id: 'roof', doing: 'setting the porch posts and roof', work: 4, logs: { any: 4 } }],",
  },
  {
    name: 'the passage roof is untagged, so a dog-run is roofed over in the rain between two pens that were not',
    file: PLOT,
    from: "    stages: [{ id: 'roof', doing: 'roofing over the passage', work: 4, logs: { wall: 4 }, wet: 'roof' }],",
    to: "    stages: [{ id: 'roof', doing: 'roofing over the passage', work: 4, logs: { wall: 4 } }],",
  },
  {
    name: 'a tag is misspelt, which holds nothing and says nothing: the silent failure this tagging invites',
    file: PLOT,
    from: "  { id: 'chink', doing: 'chinking and daubing the walls', work: 2, wet: 'daub' },",
    to: "  { id: 'chink', doing: 'chinking and daubing the walls', work: 2, wet: 'daubing' },",
  },
  {
    name: 'the sills are tagged as roofing, so rain stops a house before its walls are up',
    file: PLOT,
    from: "  { id: 'sills', doing: 'laying the sills', work: 2, logs: { sill: 4 } },",
    to: "  { id: 'sills', doing: 'laying the sills', work: 2, logs: { sill: 4 }, wet: 'roof' },",
  },
  {
    name: 'every course of the walls is held by rain, which is the felling-and-walls half the record says is unaffected',
    file: PLOT,
    from: "const course = (n, work) => ({ id: `course-${n}`, doing: `raising the walls, course ${n} of 10`, work, logs: { wall: 4 }, ...(n > TWO_HANDED_ABOVE && { hands: 2 }) });",
    to: "const course = (n, work) => ({ id: `course-${n}`, doing: `raising the walls, course ${n} of 10`, work, logs: { wall: 4 }, wet: 'roof', ...(n > TWO_HANDED_ABOVE && { hands: 2 }) });",
  },
  {
    name: 'the stone chimney is held by rain as the stick-and-mud one is, though stone is the choice that is not mud',
    file: PLOT,
    from: "    stages: [{ id: 'build', doing: 'laying up the stone chimney', work: 10 }],",
    to: "    stages: [{ id: 'build', doing: 'laying up the stone chimney', work: 10, wet: 'daub' }],",
  },
  // 3. Held, not stopped.
  {
    name: 'a held stage stops the house instead of being passed over, so one wet roof idles every other piece',
    file: PLOT,
    from: '  for (const next of startable(pieces)) if (!rainHold(here, next.stage.wet)) return next;\n  return null;',
    to: '  for (const next of startable(pieces)) return rainHold(here, next.stage.wet) ? null : next;\n  return null;',
  },
  {
    name: 'the sky is dropped on the way in, so everything reads as a fair day and nothing is ever held',
    file: PLOT,
    from: 'export function nextStage(pieces, here = null) {',
    to: 'export function nextStage(pieces, here = null) {\n  here = null;',
  },
  {
    name: 'nothing names what the sky is holding, so a house stands still and the family is told only that it cannot build',
    file: PLOT,
    from: '  for (const next of startable(pieces)) {\n    const why = rainHold(here, next.stage.wet);\n    if (why) return { ...next, why };\n  }\n  return null;',
    to: '  return null;',
  },
  {
    name: 'the refusal says it is raining but not which stage of which piece is waiting on it',
    file: PLOT,
    from: '  return `It is raining: ${held.why} — ${held.stage.doing} on ${pieceWords(pieces, held.piece)} waits for a dry day.`;',
    to: '  return `It is raining, and the house must wait.`;',
  },
  {
    name: 'the spell is stopped by the rain and the family is never told why the house stopped',
    file: PLOT,
    from: "      record(world, 'consequence', { actorId: entity?.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-290', text: `Work on the house stopped. ${rainWords(pieces, held)}` });",
    to: '      void held;',
  },
  {
    name: 'a spell in the rain goes in anyway and the stage takes its logs, which is the hold doing nothing at all',
    file: PLOT,
    from: '  const pieces = household.house.pieces;\n  const next = nextStage(pieces, here);',
    to: '  const pieces = household.house.pieces;\n  const next = nextStage(pieces) || nextStage(pieces, here);',
  },
  // 4. Where the sky is read, and by whom.
  {
    name: 'the sky is read on the map\'s own origin rather than over the family\'s land, so every family gets one weather',
    file: HOUSES,
    from: '  const home = world?.map?.sites?.[household?.homeSiteId];\n  return home ? weatherAt(world, home) : null;',
    to: '  const home = world?.map?.sites?.[household?.homeSiteId];\n  return home ? weatherAt(world, { x: 0, y: 0 }) : null;',
  },
  {
    name: 'a family with no place yet reads as standing in the rain, which refuses a house nobody has sited',
    file: HOUSES,
    from: '  return home ? weatherAt(world, home) : null;',
    to: "  return home ? weatherAt(world, home) : { kind: 'rain' };",
  },
  {
    name: 'the chore is refused for rain but the work control never says the sky, so the student is refused without a reason',
    file: HOUSES,
    from: '    return weatherHold(plan.pieces, here) ? \'waiting for the rain to stop\' : \'waiting on the pens\';',
    to: "    return 'waiting on the pens';",
  },
  {
    name: 'the chore reads no sky at all, so a family is sent to a roof the spell will then stop them on',
    file: 'sim/chores.mjs',
    from: '  if (chore.house) { const why = buildRefusal(household, world); if (why) return { can: false, why }; }',
    to: '  if (chore.house) { const why = buildRefusal(household); if (why) return { can: false, why }; }',
  },
  {
    name: 'the land line reads no sky, so the panel says the family may build on a day the server will refuse',
    file: HOUSES,
    from: 'wants: stageWants(pieces, skyAtHome(world, household)), why: buildRefusal(household, world)',
    to: 'wants: stageWants(pieces), why: buildRefusal(household)',
  },
  {
    name: 'a house chosen whole is held by the rain too, which stops the felling the record says it does not',
    file: HOUSES,
    from: '  if (pieced(household)) return plotBuildRefusal(household, skyAtHome(world, household));',
    to: "  if (pieced(household)) return plotBuildRefusal(household, skyAtHome(world, household));\n  if (skyAtHome(world, household)?.kind === 'rain') return 'It is raining.';",
  },
];

const CR = '\r', LF = '\n';
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  // The working copy is CRLF; the injections above are written in LF because that is what is readable. Rewrite both
  // sides to whatever this file actually uses, or a two-line `from` matches nothing and the run throws on a good test.
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/rain-work-injections.json', `${JSON.stringify({ record: 'rain-work-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/rain-work-injections.json`);
