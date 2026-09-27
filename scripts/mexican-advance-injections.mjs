// The regressions the Mexican advance's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the code with the mistake - found exactly once, CRLF or not - runs
// the check written for it, records what stopped it, and puts the file back byte for byte.
//
// Unit injections run their test file (tests/mexican-advance.test.mjs, or tests/scrape.test.mjs for the two rules the scrape's
// own tests hold) and require the named test, and no other in the file, to fail. Browser injections run
// scripts/mexican-advance-browser-proof.mjs and require its failure to be the message written for that check. Each gate is run
// clean first and again at the end.
//
// Run: node scripts/mexican-advance-injections.mjs [unit|browser]  -> writes docs/evidence/mexican-advance-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const T = 'tests/mexican-advance.test.mjs', S = 'tests/scrape.test.mjs', P = 'tests/advance-places.test.mjs';
const NAMES = {
  dated: 'each column is where the record puts it on the record\'s dates, and never where the record says no Mexican came',
  march: 'the columns march on the roads at an army\'s pace, and never jump',
  towns: 'the towns burn on their dates by the record\'s hand, and no town the record does not name burns',
  half: 'exactly half of every class\'s land is inside the burn zone, family by family as students join, the odd one over inside',
  old: 'an old save keeps its land: nothing is dealt again, and its farms burn or stand by where they are',
  word: 'a family learns its farm burned only by its own people seeing it or by the word, and its page shows the farm as it left it until then',
  sight: 'the smoke is seen only near and only while it stands, the word comes no faster than people carry it, and nothing else tells a family',
  home: 'the burned farm is burned when the family comes home; a farm outside the zone stands, with what was left in it',
  seen: 'a family sees a column only where its own people are; the Host sees every one, and where each party is riding',
  stock: 'the foragers drive off the stock left on the range: a quarter of the cattle is found again, not half',
  watch: 'a column on the march in front of a played family is watched at two hours a tick; one in camp, or far off, holds nothing',
  go: 'a family can go to each of them, on foot and by wagon, over the ferries and fords',
  through: 'the columns pass through them, and Stafford\'s, New Washington and Mrs. Powell\'s burn there on their dates',
  door: 'an old save is given them at its door, nothing it had moved; and only once',
  emily: 'Emily West is at New Washington itself until the army takes her',
  leaving: 'the family loads what fits and sets out together for the east, leaving the farm standing with what did not fit; the rivers hold it; it camps at the refuge and comes home with the victory',
  stays: 'a family that stays is burned out when a column\'s foragers reach the farm, and whoever is at home may be taken',
};
const UNIT = [
  { name: 'Urrea at Matagorda a day after the record\'s April 13', file: 'sim/advance.mjs',
    from: "at('matagorda', on(1836, 4, 13, 10), {", to: "at('matagorda', on(1836, 4, 14, 10), {", test: T, expect: NAMES.dated },
  { name: 'Santa Anna\'s column marching on past San Jacinto', file: 'sim/advance.mjs',
    from: "      pt('sanJacinto', on(1836, 4, 20, 13), { claimId: 'HIST-TEX-588' }),\n    ],\n    until: on(1836, 4, 21, 16),", to: "      pt('sanJacinto', on(1836, 4, 20, 13), { claimId: 'HIST-TEX-588' }),\n    ],", test: T, expect: NAMES.dated },
  { name: 'Santa Anna at Thompson\'s four hours after leaving San Felipe', file: 'sim/advance.mjs',
    from: "      at('thompsons', on(1836, 4, 12, 8), { claimId: 'HIST-TEX-586' }),", to: "      at('thompsons', on(1836, 4, 9, 12), { claimId: 'HIST-TEX-586' }),", test: T, expect: NAMES.march },
  { name: 'every column across country, never on the roads', file: 'sim/advance.mjs',
    from: '  const roadTo = b.point ? b.via : b.siteId;', to: '  const roadTo = null;', test: T, expect: NAMES.march },
  { name: 'San Felipe burned by the Mexicans', file: 'sim/advance.mjs',
    from: "  { id: 'san-felipe', siteId: 'san-felipe', name: 'San Felipe', minute: on(1836, 3, 30, 10), hand: 'texian',", to: "  { id: 'san-felipe', siteId: 'san-felipe', name: 'San Felipe', minute: on(1836, 3, 30, 10), hand: 'mexican',", test: T, expect: NAMES.towns },
  { name: 'Victoria burned, which no record says', file: 'sim/advance.mjs',
    from: "  { id: 'bastrop', siteId: 'mina', name: 'Bastrop',", to: "  { id: 'bastrop', siteId: 'victoria', name: 'Bastrop',", test: T, expect: NAMES.towns },
  { name: 'the first half of the class inside, not every other family', file: 'sim/colonies-region.mjs',
    from: '  const inside = index => index % 2 === 0;', to: '  const inside = index => index < playerCount / 2;', test: T, expect: NAMES.half },
  { name: 'the odd family over dealt outside the zone', file: 'sim/colonies-region.mjs',
    from: '  const inside = index => index % 2 === 0;', to: '  const inside = index => index % 2 === 1;', test: T, expect: NAMES.half },
  { name: 'a farm\'s fate by the deal\'s rule rather than its own land', file: 'sim/advance.mjs',
    from: '  if (!memo.has(home.id)) memo.set(home.id, reachOf(map, home));', to: "  if (!memo.has(home.id)) memo.set(home.id, Number(household.id.slice(3)) % 2 === 1 ? reachOf(map, home) || { minute: 0, left: 0, columnId: 'sesma', from: { x: home.x, y: home.y }, miles: 0 } : null);", test: T, expect: NAMES.old },
  { name: 'the page shown the farm burned the moment it burns', file: 'sim/scrape.mjs',
    from: '  if (!flight?.unseen) return household;', to: '  if (flight || !flight) return household;', test: T, expect: NAMES.word },
  { name: 'the family told of the burning as it happens, wherever it is', file: 'sim/scrape.mjs',
    from: "  if (there.length) learnOwnBurning(world, household, 'there');", to: "  learnOwnBurning(world, household, 'there');", test: T, expect: NAMES.word },
  { name: 'the word ten times faster than people carry it', file: 'sim/advance.mjs',
    from: 'export const WORD_MILES_A_DAY = 40;', to: 'export const WORD_MILES_A_DAY = 400;', test: T, expect: NAMES.sight },
  { name: 'the smoke seen long after it has gone', file: 'sim/advance-word.mjs',
    from: '      if (home && world.minute - flight.burned < SMOKE_HOURS.farm * 60 && nearest(eyes, home) <= SMOKE_SIGHT_MILES) learnOwnBurning(world, household, \'sight\');',
    to: '      if (home && nearest(eyes, home) <= SMOKE_SIGHT_MILES) learnOwnBurning(world, household, \'sight\');', test: T, expect: NAMES.sight },
  { name: 'a burned family comes home to be told its house stands', file: 'sim/scrape.mjs',
    from: '      if (flight.burned || !advanceModelled(world)) {', to: '      if (!advanceModelled(world)) {', test: T, expect: NAMES.home },
  { name: 'a family shown a column from the land it has left', file: 'sim/armies.mjs',
    from: '  const near = (army, reach) => [army, ...(army.foragers || [])].some(one => eyes.some(point => Math.hypot(point.x - one.x, point.y - one.y) <= reach));',
    to: '  const near = (army, reach) => [army, ...(army.foragers || [])].some(one => points.some(point => Math.hypot(point.x - one.x, point.y - one.y) <= reach));', test: T, expect: NAMES.seen },
  { name: 'the farm a party rides for sent to a student', file: 'sim/armies.mjs',
    from: '.map(({ to, ...party }) => party);', to: '.map(party => party);', test: T, expect: NAMES.seen },
  { name: 'the foragers leave the cattle as the range does', file: 'sim/stock.mjs',
    from: 'export const FOUND_AFTER_FORAGERS = Object.freeze({ cattle: 0.25, hogs: 0.25 });', to: 'export const FOUND_AFTER_FORAGERS = Object.freeze({ cattle: 0.5, hogs: 0.25 });', test: T, expect: NAMES.stock },
  { name: 'a column in camp holds the class', file: 'sim/military-pacing.mjs',
    from: '  const heads = columnsNow(world).filter(({ head }) => !head.retreat && head.moving);', to: '  const heads = columnsNow(world).filter(({ head }) => !head.retreat);', test: T, expect: NAMES.watch },
  { name: 'a column never watched', file: 'sim/military-pacing.mjs',
    from: '  if (proposed > MILITARY_TRAVEL_MINUTES && columnWatched(world)) proposed = MILITARY_TRAVEL_MINUTES;', to: '', test: T, expect: NAMES.watch },
  // The advance's places (2026-09-26, docs/MAP_ACCURACY.md §14); the map's own are scripts/advance-places-map-injections.mjs.
  { name: 'the advance\'s places drawn and never walked', file: 'sim/colonies-map.mjs',
    from: "export const walked = route => route?.kind !== 'outside';", to: "export const walked = route => route?.kind !== 'outside' && ![route?.from, route?.to].some(id => ['thompsons', 'old-fort', 'staffords', 'new-washington', 'powells'].includes(id));", test: P, expect: NAMES.go },
  { name: 'Santa Anna across country from Thompson\'s to Stafford\'s, not over the ferry', file: 'sim/advance.mjs',
    from: "      at('staffords', on(1836, 4, 15, 6), { claimId: 'HIST-TEX-587' }),", to: "      { point: { x: 114, y: -8 }, name: 'Stafford’s plantation', minute: on(1836, 4, 15, 6), claimId: 'HIST-TEX-587' },", test: P, expect: NAMES.through },
  { name: 'Mrs. Powell\'s burned at the research\'s estimate, not the place', file: 'sim/advance.mjs',
    from: "  { id: 'powells', siteId: 'powells',", to: "  { id: 'powells', point: { x: 88, y: 5 },", test: P, expect: NAMES.through },
  { name: 'an old save opened without the places', file: 'server/storage.mjs',
    from: '  if (save.world) openAdvancePlaces(save.world);', to: '', test: P, expect: NAMES.door },
  { name: 'the door gives the places and not the fords on their roads', file: 'sim/advance-places.mjs',
    from: '    if (!roads.some(road => onRoad(road, place))) continue;', to: '    continue;', test: P, expect: NAMES.door },
  { name: 'Emily West at the old point near Lynchburg', file: 'sim/people.mjs',
    from: "site: 'new-washington', place: 'New Washington', doing: 'stand', claimId: 'HIST-TEX-569' },", to: "point: { lon: -94.9953, lat: 29.6780, near: 'lynchburg' }, place: 'New Washington', doing: 'stand', claimId: 'HIST-TEX-569' },", test: P, expect: NAMES.emily },
  { name: 'the Texas army burns the farm as the family leaves, as before', file: 'sim/scrape.mjs',
    from: '  } else burnFarm(world, household, { watching: true });', to: '  }\n  burnFarm(world, household, { watching: true });', test: S, expect: NAMES.leaving },
  { name: 'no day\'s grace: a family caught leaving through its own town', file: 'sim/advance.mjs',
    from: 'export const ORDER_GRACE_MINUTES = 1440;', to: 'export const ORDER_GRACE_MINUTES = 0;', test: S, expect: NAMES.leaving },
  { name: 'the foragers come a day early', file: 'sim/scrape.mjs',
    from: '      if (at === null || world.minute < at) continue;', to: '      if (at === null || world.minute < at - 1440) continue;', test: S, expect: NAMES.stays },
];
const BROWSER = [
  { name: 'the page shown the farm burned the moment it burns', file: 'sim/scrape.mjs',
    from: '  if (!flight?.unseen) return household;', to: '  if (flight || !flight) return household;',
    expect: 'the family\'s page drew its farm burned before anybody could have told it' },
  { name: 'the Host not shown the smoke', file: 'sim/advance.mjs',
    from: "  if (role === 'host') return fires;", to: "  if (role === 'host') return [];",
    expect: 'the Host was not shown the farm\'s smoke' },
  { name: 'the Mexican columns never drawn on the Host\'s map', file: 'sim/armies.mjs',
    from: "  if (role === 'host') return armies;", to: "  if (role === 'host') return armies.filter(army => army.side !== 'mexican');",
    expect: 'the Host was shown no Mexican column' },
];

const CR = '\r', LF = '\n';
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
  const result = spawnSync(process.execPath, ['scripts/mexican-advance-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: ([^\n]+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/mexican-advance-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }
if (which === 'all' || which === 'unit') {
  for (const file of [T, S, P]) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of UNIT) {
    const seen = inject(injection, () => runUnit(injection.test));
    const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
    record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  for (const file of [T, S, P]) { const after = runUnit(file); if (!after.passed) throw new Error(`${file} fails after every file was put back: ${after.failed.join('; ')}`); }
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'mexican-advance-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${T} (and ${S} for the scrape's own rules, ${P} for the advance's places), the named test and no other in its file`, browser: 'scripts/mexican-advance-browser-proof.mjs', ...(previous.gates?.map && { map: previous.gates.map }) },
  unit: record.unit.length ? record.unit : previous.unit || [],
  ...(previous.map && { map: previous.map }),
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser, ...(merged.map || [])];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
