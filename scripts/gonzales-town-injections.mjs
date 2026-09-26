// The regressions the Gonzales town scenes are guarded against, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each injection replaces one exact piece of the code with the mistake, runs the gate that
// is meant to catch it, records what stopped it, and puts the file back byte for byte.
//
// Two gates: `tests/town-scenes.test.mjs` (a unit injection is caught when that one test, and no other in the file, fails)
// and `scripts/gonzales-town-browser-proof.mjs` (caught when the proof stops on the assertion written for it). Both are run
// clean first and again after, so a gate that was already failing, or a file not put back, cannot read as a catch.
//
// Slow - the browser gate walks four days of a class for each of its injections. Same computer, headless Chrome.
// Run: node scripts/gonzales-town-injections.mjs  → writes docs/evidence/gonzales-town-injections.json
// `ONLY=unit` or `ONLY=browser` runs one gate's injections.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const UNIT = 'tests/town-scenes.test.mjs', BROWSER = 'scripts/gonzales-town-browser-proof.mjs';
const INJECTIONS = [
  // ------------------------------------------------------------------------------------------------ the unit tests
  {
    gate: 'unit', name: 'the town counts its days from a different morning than the director',
    file: 'sim/town-scenes.mjs', from: 'export const SCENE_ARRIVAL = 1080;', to: 'export const SCENE_ARRIVAL = 1020;',
    expect: "the town keeps the director's clock",
  },
  {
    gate: 'unit', name: 'a woman of the street is also at the flag table at the same hour',
    file: 'sim/town-scenes.mjs', from: "at('gz-townswoman-6', 'flagHouse', 0.004, 0.02, 'speak', 'n')", to: "at('gz-townswoman-2', 'flagHouse', 0.004, 0.02, 'speak', 'n')",
    expect: 'nobody of the town is in two places at once',
  },
  {
    gate: 'unit', name: "Clements's letter drawn as reconstructed, so a named man is given words the page cannot tell from invention",
    file: 'sim/town-scenes.mjs', from: "['gz-clements', 'I cannot now will not deliver to you the cannon', { kind: 'documented', claimId: 'HIST-TEX-462' }]", to: "['gz-clements', 'I cannot now will not deliver to you the cannon', said('HIST-TEX-462')]",
    expect: 'only the record puts words in a named mouth',
  },
  {
    gate: 'unit', name: 'a flag-maker given a name from the tradition',
    file: 'sim/town-scenes.mjs', from: "'gz-townswoman-3': { label: 'a young woman of the town', figure: 'blue-girl' },", to: "'gz-townswoman-3': { label: 'a young woman of the town', name: 'Naomi DeWitt', figure: 'blue-girl' },",
    expect: 'only the record puts words in a named mouth',
  },
  {
    gate: 'unit', name: 'every family is sent the town, wherever its people are',
    file: 'sim/town-scenes.mjs', from: "const seen = host ? beats : beats.filter(beat => (beat.seenFrom || ['gonzales']).some(siteId => places.has(siteId)));", to: 'const seen = beats;',
    expect: 'a family sees the town only while one of its own is standing there',
  },
  {
    gate: 'unit', name: 'words put over whoever the line names, whether or not they are there',
    file: 'sim/town-scenes.mjs', from: '      if (!drawn.has(speakerId)) return;\n', to: '',
    expect: 'every word is put over somebody who is there to say it',
  },
  {
    // The day it is made is also what the help test leans on (nobody asks for help with a flag not yet begun), so moving it
    // is caught by two tests; the browser gate holds the day alone, below. Here, the flag left behind on the night.
    gate: 'unit', name: 'the men go over the river without the flag',
    file: 'sim/town-scenes.mjs', from: "...(n === 1 && { carries: 'flag' })", to: "...(n === 0 && { carries: 'flag' })",
    expect: 'the women make the flag on September 30 and October 1',
  },
  {
    gate: 'unit', name: 'Ruth Crandall kept on her round while the town gathers in the street',
    file: 'sim/town.mjs', from: "    if (scene) { entity.location = { ...scene, siteId: 'gonzales' }; continue; }\n", to: '',
    expect: "the town's invented people go where the town is gathering",
  },
  {
    gate: 'unit', name: 'anybody may help at the blacksmith\'s, a woman included',
    file: 'sim/town-scenes.mjs', from: "    may: entity => canAnswerCalls(entity) && sexOf(entity) === 'male',", to: '    may: entity => canAnswerCalls(entity),',
    expect: "a family's own person may lend a hand",
  },
  {
    gate: 'unit', name: 'a helper sent home is still helping on the road',
    file: 'sim/town-scenes.mjs', from: '    delete entity.townHelp;\n', to: '',
    expect: "a family's own person may lend a hand",
  },
  {
    gate: 'unit', name: 'the Gonzales scenes played again in the winter',
    file: 'sim/town-scenes.mjs', from: 'const inPlay = world => Boolean(world.director && (world.period ?? 1) === 1 && world.map?.sites?.gonzales);', to: 'const inPlay = world => Boolean(world.director && world.map?.sites?.gonzales);',
    expect: 'a class saved before the town had scenes',
  },
  // ------------------------------------------------------------------------------------------------ the browser proof
  {
    gate: 'browser', name: 'nobody in the town is walked: the residents slide between their places in a tick, as before',
    file: 'public/app.js', from: "  if (entity.travel || entity.kind !== 'person' || entity.location?.siteId !== 'gonzales' || !Number.isFinite(entity.location.x)) return null;", to: '  return null;',
    expect: 'no resident of the town was drawn walking',
  },
  {
    gate: 'browser', name: 'walked, but six heights a second: running, not walking',
    file: 'public/town-scenes.js', from: 'export const TOWN_WALK = 0.9;', to: 'export const TOWN_WALK = 6;',
    expect: 'sliding, not walking',
  },
  {
    gate: 'browser', name: "everybody set down at once where the server puts them: the scenes' people never walk",
    file: 'public/town-scenes.js', from: '  step(id, target, now, milesPerSecond, { jumpMiles = 0.6, present = true } = {}) {', to: '  step(id, target, now, milesPerSecond, { jumpMiles = 0, present = true } = {}) {',
    expect: 'nobody in the scenes was drawn walking',
  },
  {
    gate: 'browser', name: 'the words are never drawn',
    file: 'public/app.js', from: '    drawTownSpeech(ctx, world.townScenes, headOf, {', to: '    (() => [])(ctx, world.townScenes, headOf, {',
    expect: 'reconstructed lines were drawn over anybody',
  },
  {
    gate: 'browser', name: 'everybody drawn standing, whatever the server has them doing',
    file: 'public/town-scenes.js', from: "  const face = person.face || 's', pose = person.pose || 'idle';", to: "  const face = person.face || 's', pose = 'idle';",
    expect: "every one of the town's people drawn was standing idle",
  },
  {
    gate: 'browser', name: 'a click on a scene opens nothing',
    file: 'public/app.js', from: '    if (townScene && !entityAt(point)) { townSceneOpen = townScene;', to: '    if (townScene && !entityAt(point) && false) { townSceneOpen = townScene;',
    expect: 'did not open its card',
  },
  {
    gate: 'browser', name: "the help button carries `data-action`, so the page also sends it as a bare order without the scene (the fault first found)",
    file: 'public/town-scenes.js', from: '      button.dataset.townHelp = person.id;', to: "      button.dataset.townHelp = person.id; button.dataset.action = 'town-help'; button.dataset.entityId = person.id;",
    expect: 'the server refused an order the page sent',
  },
  {
    gate: 'browser', name: 'the flag made from the morning of the thirtieth',
    file: 'sim/town-scenes.mjs', from: "{ id: 'flag-cloth', scene: 'flag', from: on(1, 14), to: on(2, 12)", to: "{ id: 'flag-cloth', scene: 'flag', from: on(1, 9), to: on(2, 12)",
    expect: 'the flag was being made outside its days',
  },
  {
    gate: 'browser', name: 'every family is sent the town, the one on its land included',
    file: 'sim/town-scenes.mjs', from: "const seen = host ? beats : beats.filter(beat => (beat.seenFrom || ['gonzales']).some(siteId => places.has(siteId)));", to: 'const seen = beats;',
    expect: "a family out on its land was sent the town's scenes",
  },
  {
    gate: 'browser', name: 'the Host is sent none of it',
    file: 'sim/town-scenes.mjs', from: "  const host = role === 'host';\n  const household", to: "  const host = role === 'host';\n  if (host) return null;\n  const household",
    expect: "the Host's page drew none of the town",
  },
];

const failingTests = output => [...new Set([...output.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)$/gm)].map(match => match[1]))];
const run = gate => {
  if (gate === 'unit') {
    const result = spawnSync(process.execPath, ['--test', UNIT], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 });
    const output = `${result.stdout}${result.stderr}`;
    const failing = failingTests(output);
    return { passed: result.status === 0, failing, failure: failing.join(' | ') || (result.status === 0 ? null : output.slice(-300)), checks: (output.match(/^✔ /gm) || []).length };
  }
  const result = spawnSync(process.execPath, [BROWSER], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 25 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
};

const gates = [...new Set(INJECTIONS.map(one => one.gate))].filter(gate => !process.env.ONLY || process.env.ONLY === gate);
const clean = {};
for (const gate of gates) {
  clean[gate] = run(gate);
  if (!clean[gate].passed) throw new Error(`The ${gate} gate fails before any injection: ${clean[gate].failure}`);
  console.log(`clean ${gate}: ${clean[gate].checks} checks pass`);
}
const record = [];
for (const injection of INJECTIONS.filter(one => gates.includes(one.gate))) {
  const original = readFileSync(injection.file, 'utf8');
  // Written with plain newlines; this working copy may be CRLF. A pattern that cannot match is a harness that quietly
  // proves nothing, which five harnesses in this repository were found doing.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let seen;
  try { seen = run(injection.gate); } finally { writeFileSync(injection.file, original); }
  if (readFileSync(injection.file, 'utf8') !== original) throw new Error(`${injection.file} was not put back byte for byte`);
  // A unit injection is caught by its own test alone; a browser one by the assertion written for it.
  const caught = injection.gate === 'unit'
    ? seen.failing.length === 1 && seen.failing[0].includes(injection.expect)
    : !seen.passed && Boolean(seen.failure?.includes(injection.expect));
  record.push({ gate: injection.gate, name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, ...(seen.failing && { failingTests: seen.failing }) });
  console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'} [${injection.gate}]: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
}
const after = {};
for (const gate of gates) {
  after[gate] = run(gate);
  if (!after[gate].passed) throw new Error(`The ${gate} gate fails after every file was put back: ${after[gate].failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
const path = process.env.ONLY ? `docs/evidence/gonzales-town-injections-${process.env.ONLY}.json` : 'docs/evidence/gonzales-town-injections.json';
writeFileSync(path, `${JSON.stringify({
  record: 'gonzales-town-injections', date: new Date().toISOString().slice(0, 10), gates: { unit: UNIT, browser: BROWSER },
  clean: Object.fromEntries(Object.entries(clean).map(([gate, one]) => [gate, one.checks])),
  after: Object.fromEntries(Object.entries(after).map(([gate, one]) => [gate, one.checks])),
  injections: record,
  environment: 'Same computer: node --test for the unit gate; a local classroom server and headless Chrome at 1366x768 and 1024x768 for the browser gate.',
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the check written for them, alone. Wrote ${path}`);
