// The regressions the travel-drawn tests guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the shipped code with the mistake a test is written against,
// runs the tests, records which of them failed, and puts the file back byte for byte. It stops if a replacement does not
// match exactly once, so a stale injection is never passed off as a proof.
//
// The rule under test: a figure is never drawn crossing more ground than its own gait can carry it; past that it walks a
// hundred yards, fades out, crosses the middle unseen and fades back in for the last hundred yards, arriving on the
// server's own minute; and the family's own land is never sped up and never faded (public/motion.js `travelSight`,
// public/app.js `sightOf`; docs/MAP_ACCURACY.md §12a; owner 2026-09-22).
//
// Run: node scripts/travel-drawn-injections.mjs                      → the unit tests, about a minute
//      PROOF_BROWSER=1 node scripts/travel-drawn-injections.mjs      → and the browser proof, about twenty
// The browser run needs PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as the other proofs do.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/travel-drawn.test.mjs', 'tests/family-panel.test.mjs'];
const FILE = 'public/motion.js';
const INJECTIONS = [
  // ------------------------------------------------------------------------------------------------------ the pace cap
  {
    name: 'the gait is twice what the library\'s cycles actually cover, so a figure may skate at twice a walk',
    from: 'export const GAIT_CEILING = 1.2;',
    to: 'export const GAIT_CEILING = 2.4;',
  },
  {
    name: 'the gait is measured against a fixed height, so a rider is held to a walker\'s ground and not the horse\'s',
    from: '  return !(scale > 0) || !(heightPx > 0) ? 0 : ceiling * heightPx / scale;',
    to: '  return !(scale > 0) || !(heightPx > 0) ? 0 : ceiling * 49.5 / scale;',
  },
  {
    name: 'the cap is not applied at all while the figure is in view: the schedule fades, but the walk still zips',
    from: '  const rate = gait / milesASecond;',
    to: '  const rate = 1;',
  },
  // -------------------------------------------------------------------------------------------- walk, fade, cross, walk
  {
    name: 'the walked stretch at each end is three hundred yards instead of the hundred the owner chose',
    from: 'export const SEEN_YARDS = 100, YARDS_A_MILE = 1760, SEEN_MILES = SEEN_YARDS / YARDS_A_MILE;',
    to: 'export const SEEN_YARDS = 300, YARDS_A_MILE = 1760, SEEN_MILES = SEEN_YARDS / YARDS_A_MILE;',
  },
  {
    name: 'the figure blinks out and back instead of fading: no frame is ever part drawn',
    from: '  const alpha = Math.max(0, Math.min(1, Math.max((out + fade - at) / fade, (at - back) / fade)));',
    to: '  const alpha = at <= out || at >= back ? 1 : 0;',
  },
  {
    name: 'a journey too short for the walked ends fades anyway, so a short errand is a blink',
    from: '  if (!(lead >= seen / 2) || !(tail >= seen / 2)) return whole;',
    to: '  if (!(lead > 0) || !(tail > 0)) return whole;',
  },
  {
    name: 'the drawn place creeps a fraction ahead of the road, so somebody reaches the far end before the server does',
    from: '  return { miles: Math.min(far, Math.max(0, drawn)), alpha, rate, lead, tail, faded: true };',
    to: '  return { miles: Math.min(far, Math.max(0, drawn * 1.002)), alpha, rate, lead, tail, faded: true };',
  },
  // ------------------------------------------------------------------------------------------ the family's own land
  {
    name: 'the family\'s own land is treated like any other road, so somebody fades while still on their own farm',
    from: '  const onLead = Math.min(Math.max(0, leaves), far);',
    to: '  const onLead = 0;',
  },
  {
    name: 'the fade-in is allowed to finish on the line rather than before it, so a figure comes back inside its own land',
    from: '  return { leaves: leaves === null ? far : leaves, enters: lastOnFrom === null ? far : Math.max(0, lastOnFrom - step) };',
    to: '  return { leaves: leaves === null ? far : leaves, enters: lastOnFrom === null ? far : lastOnFrom };',
  },
  {
    // The ordering this work shipped with first, and which the owner overruled the same day: the hundred yards paid for
    // before the land, and the land given only what was left. On a hurried short errand it starts the fade a long way
    // inside the family's own farm, which is the one thing the correction says may never happen.
    name: 'the hundred yards are paid for before the land, so a figure begins to fade while still on its own farm',
    from: '  if (!(room >= land)) return whole;',
    to: '  if (!(room >= 0)) return whole;',
  },
  {
    // …and the land capped at the hundred yards rather than paid in full, which puts the fade inside any farm wider
    // than a hundred yards - which every league-and-labor grant is.
    name: 'the land is capped at the hundred yards instead of paid in full, so the fade begins inside the farm',
    from: '  const lead = onLead + give, tail = onTail + give;',
    to: '  const lead = Math.min(onLead, seen) + give, tail = Math.min(onTail, seen) + give;',
  },
  {
    name: 'one end is given its own land and the other is not',
    from: '  const lead = onLead + give, tail = onTail + give;',
    to: '  const lead = onLead + give, tail = give;',
  },
  {
    name: 'a caller with no land to test - the Host, somebody else\'s family - is treated as being on its own land all the way',
    from: "  if (typeof inside !== 'function' || !Array.isArray(points) || points.length < 2 || !far) return { leaves: 0, enters: far };",
    to: "  if (typeof inside !== 'function' || !Array.isArray(points) || points.length < 2 || !far) return { leaves: far, enters: 0 };",
  },
  // -------------------------------------------------------------------------------------------------- the pop guard
  {
    name: 'the ease is fast enough to be a pop: a zoom wheel can take a figure from whole to gone in one frame',
    from: 'export const FADE_RATE = 2, FADE_STALE_MS = 250;',
    to: 'export const FADE_RATE = 100, FADE_STALE_MS = 250;',
  },
  // ------------------------------------------------------------------------------------------ Travelling on the panel
  {
    file: 'public/family-panel.js',
    name: 'the row says something else, not the word the owner asked for',
    from: "export const TRAVELLING_WORD = 'Travelling';",
    to: "export const TRAVELLING_WORD = 'On the road';",
  },
  {
    file: 'public/family-panel.js',
    name: 'somebody carried away out of sight is given the short word too, and loses how far off they are and when they are back',
    from: 'export const travellingLine = entity => (entity?.travel && !entity.travel.away ? TRAVELLING_WORD : null);',
    to: 'export const travellingLine = entity => (entity?.travel ? TRAVELLING_WORD : null);',
  },
  // -------------------------------------------------------------------------------------------------- the marker
  {
    file: 'public/app.js',
    name: 'the marker\'s hook is put back in the page, and with it the thing the owner asked to be rid of',
    from: 'window.__travelSight = travelSeen;',
    to: 'window.__travelSight = travelSeen;\nwindow.__travelMarkers = travelSeen;',
  },
];

// The six the browser proof alone can answer: whether the page really draws it that way. Each costs a whole run.
const BROWSER = [
  {
    file: 'public/app.js',
    name: 'nothing is ever faded away on the page: the figure is drawn whole through the middle of the road',
    from: '  const figure = marks.sight ? marks.sight.alpha : 1;',
    to: '  const figure = 1;',
  },
  {
    file: 'public/app.js',
    name: 'the road is not drawn, so a traveller away in the middle leaves the map saying nothing at all',
    from: '    if (sight && sight.alpha < 1) roads.push({ entity, seen: sight });\n    const ground = sight?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);\n    // The place the figure was really put',
    to: '    const ground = sight?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);\n    // The place the figure was really put',
  },
  {
    file: 'public/motion.js',
    name: 'the cap is not applied, and the figure is drawn crossing the screen at the server\'s own pace',
    from: '  const rate = gait / milesASecond;',
    to: '  const rate = 1;',
  },
  {
    file: 'public/app.js',
    name: 'the figure is drawn where the server has them rather than where the schedule walks them',
    from: '    const ground = sight?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);\n    // The place the figure was really put',
    to: '    const ground = motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);\n    // The place the figure was really put',
  },
  {
    file: 'public/family-panel.js',
    name: 'the row says nothing while somebody is on a journey',
    from: 'export const travellingLine = entity => (entity?.travel && !entity.travel.away ? TRAVELLING_WORD : null);',
    to: 'export const travellingLine = () => null;',
  },
  {
    // The bug this proof actually found, kept as the injection that guards it: the grant the server sends is
    // `{ kind, acres, bounds }`, and read a level too high it is never a rectangle, so no road is ever on the family's own
    // land and the fade begins a hundred yards from the house. Nothing throws and every unit test passes.
    file: 'public/app.js',
    name: 'the grant is read a level too high, so no road is ever on the family\'s own land',
    from: '  const bounds = host ? null : world.land?.grant?.bounds;',
    to: '  const bounds = host ? null : world.land?.grant;',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const unit = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
/** The browser proof's own failure, which is one assertion with a sentence on it rather than a list of tests. */
const proof = () => {
  const result = spawnSync(process.execPath, ['scripts/travel-drawn-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PROOF_NO_WRITE: '1' } });
  if (result.status === 0) return [];
  const said = `${result.stdout}${result.stderr}`.match(/AssertionError \[ERR_ASSERTION\]: (.+)/);
  return [said ? said[1].trim() : `the proof failed: ${`${result.stderr}`.slice(0, 200)}`];
};

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
/** One injection put in, the tests run, and the file put back byte for byte whatever happened. */
function inject(injection, run) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  // Some files in this repository are CRLF and some LF, so the text to replace is written here with LF and matched
  // against whichever the file actually uses. Still exactly once, or the injection is refused.
  const ending = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ending(injection.from), to = ending(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.split(from).join(to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  return { name: injection.name, file, failed };
}

if (unit().length) throw new Error('The tests fail before any injection');
const record = INJECTIONS.map(injection => inject(injection, unit));
if (unit().length) throw new Error('The tests fail after every file was put back');

const browser = [];
if (process.env.PROOF_BROWSER) {
  const before = proof();
  if (before.length) throw new Error(`The browser proof fails before any injection: ${before.join(' | ')}`);
  for (const injection of BROWSER) browser.push(inject(injection, proof));
  if (proof().length) throw new Error('The browser proof fails after every file was put back');
}

mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/travel-drawn-injections.json', `${JSON.stringify({
  record: 'travel-drawn-injections',
  date: new Date().toISOString().slice(0, 10),
  files: FILES,
  injections: record,
  ...(process.env.PROOF_BROWSER ? { browserProof: 'scripts/travel-drawn-proof.mjs', browserInjections: browser } : {}),
}, null, 2)}\n`);
const all = [...record, ...browser];
console.log(`\n${all.filter(one => one.failed.length).length} of ${all.length} caught; wrote docs/evidence/travel-drawn-injections.json`);
