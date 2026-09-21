// The regressions the travel-sight tests guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the shipped code with the mistake a test is written against,
// runs the test files, records which tests failed, and puts the file back byte for byte. It stops if a replacement does
// not match exactly once, so a stale injection is never passed off as a proof.
//
// The rule under test: somebody the class's clock is carrying faster than a student can follow is projected away - no
// place, no road, no progress, no pace - with where they went, how far is left and roughly when they are back
// (sim/sight.mjs, `FIC-GONZ-230`, `FIC-GONZ-231`; docs/MAP_ACCURACY.md §12).
//
// Run: node scripts/travel-sight-injections.mjs  → writes docs/evidence/travel-sight-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/travel-sight.test.mjs', 'tests/map-base.test.mjs', 'tests/travel-speed.test.mjs'];
const FILE = 'sim/sight.mjs';
const INJECTIONS = [
  // ---------------------------------------------------------------------------------- the rule and where the line falls
  {
    name: 'the line is back where the 2026-09-17 rule had it, and a walk in the news hour is hidden',
    from: 'export const WATCHABLE_MILES_A_TICK = 3;',
    to: 'export const WATCHABLE_MILES_A_TICK = 2;',
  },
  {
    name: 'the line is read as "at it and over", so a walk of exactly an hour goes out of sight',
    from: '  return milesATick > WATCHABLE_MILES_A_TICK;',
    to: '  return milesATick >= WATCHABLE_MILES_A_TICK;',
  },
  {
    name: 'the rule asks what phase the class is in instead of how far the figure would jump',
    from: '  return milesATick > WATCHABLE_MILES_A_TICK;',
    to: "  return ['gathering', 'campaign'].includes(travel.phase);",
  },
  {
    name: 'somebody held on a bank while the water is up is hidden, though they have not moved for days',
    from: '  if (travel.waitUntil && minute < travel.waitUntil) return false;\n',
    to: '',
  },
  {
    name: 'a rider reined in to speak with somebody vanishes in the middle of the sentence',
    from: '  if (travel.halted) return false;\n',
    to: '',
  },
  // ------------------------------------------------------------------------- what a family is told about somebody away
  {
    name: 'the family is not told how far is left',
    from: '    miles: Math.max(1, Math.round(left)),',
    to: '    miles: 0,',
  },
  {
    name: 'the arrival is rounded down instead of counted in whole ticks, so they are due before they can be there',
    from: '  const ticks = milesATick > 0 ? Math.ceil(left / milesATick) : 0;',
    to: '  const ticks = milesATick > 0 ? Math.floor(left / milesATick) : 0;',
  },
  {
    name: 'somebody an hour off is given a date instead of an hour',
    from: "  if (hours <= 1) return 'there within the hour';\n",
    to: '',
  },
  {
    name: 'an hour and a quarter is said as "about an hours"',
    from: "  if (hours < 1.5) return 'there in about an hour';\n",
    to: '',
  },
  {
    name: 'somebody back this afternoon is given a date, which a student cannot use',
    from: '  if (hours < 12) {',
    to: '  if (hours < 0) {',
  },
  {
    name: 'working out what to say writes it into the world, so a save carries a projection',
    from: '  return {\n    away: true,',
    to: '  travel.away = true;\n  return {\n    away: true,',
  },
  // ------------------------------------------------------------------------------------------------- the projection
  {
    file: 'sim/world.mjs',
    name: 'somebody away is still handed their place on the map',
    from: '      location: null,\n      travel: { from: travel.from, to: travel.to, distance: travel.distance, mode: travel.mode,',
    to: '      location: entity.location,\n      travel: { from: travel.from, to: travel.to, distance: travel.distance, mode: travel.mode,',
  },
  {
    file: 'sim/world.mjs',
    name: 'somebody away is still handed the road and how far along it they are',
    from: '      travel: { from: travel.from, to: travel.to, distance: travel.distance, mode: travel.mode, ...awayProjection(',
    to: '      travel: { from: travel.from, to: travel.to, distance: travel.distance, mode: travel.mode, points: travel.points, progress: travel.progress, ...awayProjection(',
  },
  {
    file: 'sim/world.mjs',
    name: 'only the long middle of a journey is hidden, as it was before: the ends are still drawn, one jump each',
    from: '  if (tooFastToFollow(travel, step, world.minute)) {',
    to: '  if (tooFastToFollow(travel, step, world.minute) && Math.min(travel.progress, travel.distance - travel.progress) > 2.5) {',
  },
  {
    file: 'sim/overview.mjs',
    name: 'the teacher is filtered like a family, and loses the travellers on the class view',
    from: '    location: { x: round(entity.location.x), y: round(entity.location.y), siteId: entity.location.siteId },',
    to: '    location: entity.travel ? null : { x: round(entity.location.x), y: round(entity.location.y), siteId: entity.location.siteId },',
  },
  {
    file: 'sim/chores.mjs',
    name: 'the family panel says only "is on the road" for somebody who is no longer anywhere on the map',
    from: '    if (!tooFastToFollow(entity.travel, milesATick(world, entity), world.minute)) return { can: false, why:',
    to: '    if (true) return { can: false, why:',
  },
  // ------------------------------------------------------------------------------------------------------- the page
  {
    file: 'public/map-base.js',
    name: 'the page cannot tell who the server sent away',
    from: 'export const away = entity => Boolean(entity?.travel?.away);',
    to: 'export const away = () => false;',
  },
  {
    file: 'public/app.js',
    name: 'the page works out for itself who may be watched, from what it was sent',
    from: '  const entities = entitiesOf(world).filter(entity => entity.location);',
    to: '  const entities = entitiesOf(world).filter(entity => entity.location && !(entity.travel && entity.travel.progress > 2.5));',
  },
  {
    file: 'public/app.js',
    name: 'a neighbour the server sent no place for is drawn anyway, at wherever the page last had them',
    from: '  const observed = observedOf(world).filter(entity => entity.location);',
    to: '  const observed = observedOf(world).filter(entity => entity.location || entity.travel);',
  },
  {
    file: 'public/app.js',
    name: 'the camera goes on following somebody away, with no place left to frame them at',
    from: '  const watched = watchedId ? entitiesOf(world).find(entity => entity.id === watchedId && entity.location) : null;',
    to: '  const watched = watchedId ? entitiesOf(world).find(entity => entity.id === watchedId) : null;',
  },
  {
    file: 'public/app.js',
    name: 'the card says nothing of somebody away, so a student is left with a person who has simply gone',
    from: '        ? `Away on the road to ${placeName(world, chosen.travel.to)} · about ${chosen.travel.miles} miles off · should be ${chosen.travel.back}`',
    to: '        ? `On the road to ${placeName(world, chosen.travel.to)}`',
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
  // The repository holds some files with CRLF line endings and some with LF, so the text to replace is written here with
  // LF and matched against whichever the file actually uses. Still exactly once, or the injection is refused.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ending = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ending(injection.from), to = ending(injection.to);
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
writeFileSync('docs/evidence/travel-sight-injections.json', `${JSON.stringify({ record: 'travel-sight-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/travel-sight-injections.json`);
