// The passing rider's check in the one-rider browser proof, proved by injection (owner, 2026-09-29: "Show all, but show them
// riding at a normal looking speed, after they pass by have them fade away and speed up to make up for lost time."; CLAUDE.md:
// "A new test is not evidence until it has failed"). Each injection replaces one exact piece of a file with the mistake the
// check is written against, runs scripts/one-rider-browser-proof.mjs, and checks that it failed on the passing rider's own
// assertion - then puts the file back byte for byte.
//
// Run: npm run test:one-rider-browser-injections (with PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE) → docs/evidence/one-rider-browser-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const INJECTIONS = [
  { name: 'another family\'s rider is not drawn at all (the family sees only its own)', file: 'sim/encounters.mjs',
    from: '    if (!carrier.report?.inPerson && !carrier.leaving) continue;', to: '    if (!carrier.report?.inPerson || carrier.report.audience !== householdId) continue;',
    expect: 'another family\'s rider riding past was never drawn in view' },
  { name: 'a passing rider is drawn at six times his pace', file: 'public/app.js',
    from: 'pace: paceMilesASecond({ scale: marks.scale, heightPx: height, personPx: marks.figure }), cap:', to: 'pace: 6 * paceMilesASecond({ scale: marks.scale, heightPx: height, personPx: marks.figure }), cap:',
    expect: 'another family\'s rider was drawn faster than a ride' },
  { name: 'a passing rider never fades out once he is by', file: 'public/motion.js',
    from: "  if (pass.state === 'riding' && (pass.d >= pass.until - 1e-9 || atEnd)) pass.state = 'fading';", to: '',
    expect: 'another family\'s rider did not fade out once he had passed' },
  { name: 'a passing rider is drawn standing at the family\'s gate', file: 'sim/town.mjs',
    from: '      location: { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId },',
    to: '      location: entity.courier && passingOf(world, householdId, entity) !== null ? { x: world.map.sites[world.households[householdId].homeSiteId].x, y: world.map.sites[world.households[householdId].homeSiteId].y, siteId: world.households[householdId].homeSiteId } : { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId },',
    expect: 'a rider not talking with the family was drawn standing at its gate' },
];

const run = () => {
  const result = spawnSync(process.execPath, ['scripts/one-rider-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 1_200_000 });
  const out = `${result.stdout}${result.stderr}`;
  return { status: result.status, error: (out.match(/(?:AssertionError[^:]*|Error): ([^\n]+)/) || [])[1] || null };
};
for (const injection of INJECTIONS) {
  if (!readFileSync(injection.file, 'utf8').replace(/\r\n/g, '\n').includes(injection.from)) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
}
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = original.replace(/\r\n/g, '\n').replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? text.replace(/\n/g, '\r\n') : text);
  let outcome;
  try { outcome = run(); } finally { writeFileSync(injection.file, original); }
  const caught = outcome.status !== 0 && Boolean(outcome.error?.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, failedWith: outcome.error });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'} ${injection.name}${caught ? '' : ` (failed with: ${outcome.error || 'nothing - the proof passed'})`}`);
}
const clean = run();
if (clean.status !== 0) throw new Error(`The proof fails after every file was put back: ${clean.error}`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/one-rider-browser-injections.json', `${JSON.stringify({ record: 'one-rider-browser-injections', date: new Date().toISOString().slice(0, 10), proof: 'scripts/one-rider-browser-proof.mjs', caught: record.filter(one => one.caught).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the passing rider's own check. Wrote docs/evidence/one-rider-browser-injections.json`);
