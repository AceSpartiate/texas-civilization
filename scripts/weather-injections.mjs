// The regressions the weather-art tests guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of public/weather-art.js with the mistake a test is written
// against, runs the test file, records which tests failed, and puts the file back byte for byte. It stops if a
// replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// Run: node scripts/weather-injections.mjs  → writes docs/evidence/weather-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/weather-art.test.mjs'];
const FILE = 'public/weather-art.js';
const INJECTIONS = [
  // The owner's own rule for the regions: "three different weathers on one map must not look like three rectangles."
  {
    name: 'the regions are three rectangles with hard edges',
    from: 'const west = 1 - smoothStep(westOf - half, westOf + half, x);\n  const east = smoothStep(eastOf - half, eastOf + half, x);',
    to: 'const west = x < westOf ? 1 : 0;\n  const east = x > eastOf ? 1 : 0;',
  },
  {
    name: 'the blend is a straight ramp, and creases at each end of the band',
    from: '  return t * t * (3 - 2 * t);',
    to: '  return t;',
  },
  // docs/WEATHER.md §3.3: the Alamo siege was cold and CLEAR. A norther drawn wet is the popular image, not the record.
  {
    name: 'a norther brings rain and a flat grey sky, as the popular image has it',
    from: '      mix.norther += up; mix.cold += up;',
    to: '      mix.norther += up; mix.cold += up; mix.rain += up; mix.flat += up;',
  },
  {
    name: 'the wind blows the way it came from, so a norther drives things back up to the north',
    from: '  return { x: -Math.sin(from), y: Math.cos(from) };',
    to: '  return { x: Math.sin(from), y: -Math.cos(from) };',
  },
  {
    name: 'a day flicks on at its first minute instead of coming up over an hour and a half',
    from: '  return clamp01((minute - region.since) / FADE_MINUTES);',
    to: '  return 1;',
  },
  {
    name: 'the fog hangs about all afternoon instead of burning off by nine',
    from: 'export const FOG_HOLDS = 7, FOG_GONE = 9.5;',
    to: 'export const FOG_HOLDS = 7, FOG_GONE = 18;',
  },
  {
    name: 'the clock past midnight is read as a running total, so the thirtieth morning is an afternoon',
    from: '  const hour = ((minute % 1440) + 1440) % 1440 / 60;',
    to: '  const hour = minute / 60;',
  },
  {
    name: 'the fog can be drawn to opacity, and hides what a student is entitled to see',
    from: 'export const FOG_CEILING = 0.55;',
    to: 'export const FOG_CEILING = 1;',
  },
  {
    name: 'a tree in a light air leans as hard as one in a gale',
    from: '  return clamp01(force) * MAX_LEAN * Math.max(-1, Math.min(1, across));',
    to: '  return MAX_LEAN * Math.max(-1, Math.min(1, across));',
  },
  // The whole cost of the weather in the kept ground (docs/PERFORMANCE_RENDER.md).
  {
    name: 'the ground is drawn again for a river falling a thousandth',
    from: '  const step = value => Math.round(clamp01(value || 0) * 10);',
    to: '  const step = value => clamp01(value || 0);',
  },
  {
    name: "the day's own fade is in the ground's key, so the whole country is redrawn twelve times a second",
    from: "return `${region.kind || 'fair'}:${step(region.water)}:${step(region.wind?.force)}:${Math.round((region.wind?.from ?? 0) * 8)}`;",
    to: "return `${region.kind || 'fair'}:${step(region.water)}:${step(region.wind?.force)}:${region.since ?? 0}`;",
  },
  {
    name: 'a fair, dry, still day is drawn anyway',
    from: "return region && (region.kind !== 'fair' || (region.water || 0) > WATER_HIGH * 0.75 || (region.wind?.force || 0) > 0.2);",
    to: 'return Boolean(region);',
  },
  {
    name: 'a river still in flood on a fair day is not drawn',
    from: "return region && (region.kind !== 'fair' || (region.water || 0) > WATER_HIGH * 0.75 || (region.wind?.force || 0) > 0.2);",
    to: "return region && region.kind !== 'fair';",
  },
  // Every student's view is inside one region; cutting it up anyway is the cost this test exists to stop.
  {
    name: 'every view is cut into a dozen spans, even a family standing on its own land',
    from: '  if (same) return [{ x: 0, width, mix: left }];',
    to: '',
  },
  {
    name: 'the spans stop short of the right-hand edge of the view',
    from: '    spans.push({ x: width * i / most, width: width / most + 1, mix: weatherMix(weather, at, minute, options) });',
    to: '    spans.push({ x: width * i / most, width: width / most - 2, mix: weatherMix(weather, at, minute, options) });',
  },
  {
    name: 'the tile is drawn for a wind a quarter of the compass off the one blowing',
    from: '  return ((Math.round(angle / (Math.PI * 2) * WIND_STEPS) % WIND_STEPS) + WIND_STEPS) % WIND_STEPS;',
    to: '  return ((Math.round(angle / (Math.PI * 2) * WIND_STEPS) + 4) % WIND_STEPS + WIND_STEPS) % WIND_STEPS;',
  },
  {
    name: 'a norther that brought its rain is drawn dry, like every other day of one',
    from: '      if (region.wet) { mix.rain += up * 0.8; mix.flat += up * 0.55; }',
    to: '',
  },
  {
    name: 'the page shuts a ford at a level the simulation does not',
    from: 'export const WATER_HIGH = 0.3, WATER_SHUT = 0.85;',
    to: 'export const WATER_HIGH = 0.3, WATER_SHUT = 0.7;',
  },
  {
    name: 'the page draws one of the three countries under another name',
    from: "export const REGIONS = Object.freeze(['west', 'centre', 'east']);",
    to: "export const REGIONS = Object.freeze(['west', 'middle', 'east']);",
  },
  {
    name: 'the wind step can run off the end of the compass, or go negative, as a cache key',
    from: '  return ((Math.round(angle / (Math.PI * 2) * WIND_STEPS) % WIND_STEPS) + WIND_STEPS) % WIND_STEPS;',
    to: '  return Math.round(angle / (Math.PI * 2) * WIND_STEPS);',
  },
  {
    name: 'the kept ground is drawn from a weather that fades, so it stands stale all day',
    from: '    const up = weight * (fade ? sinceFade(region, minute) : 1);',
    to: '    const up = weight * sinceFade(region, minute);',
  },
  {
    name: 'the rain is drawn at one size however close the camera is',
    from: 'export function zoomBand(scale) { return scale >= 160 ? 2 : scale >= 12 ? 1 : 0; }',
    to: 'export function zoomBand() { return 1; }',
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
  const count = original.split(injection.from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/weather-injections.json', `${JSON.stringify({ record: 'weather-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/weather-injections.json`);
