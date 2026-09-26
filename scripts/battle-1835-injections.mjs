// The regressions Concepción's and the Grass Fight's checks guard, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). The same harness as scripts/battle-injections.mjs (Gonzales), kept apart from it so the
// builders of the other engagements can extend theirs without touching this one: each injection replaces one exact piece of
// the code with the mistake - found exactly once, CRLF or not - runs the check written for it, records what stopped it, and
// puts the file back byte for byte.
//
// A unit injection runs its whole test file and requires the named test, and no other in the file, to fail. A browser
// injection runs scripts/battle-1835-browser-proof.mjs for its fight and requires its failure to be the message written for
// that check. Each gate is run clean first, and again at the end with every file put back.
//
// Slow: the browser gate plays a class to the eve of a fight for each of its injections. Same computer.
// Run: node scripts/battle-1835-injections.mjs [unit|browser]  -> writes docs/evidence/battle-1835-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const C = 'tests/battle-concepcion.test.mjs', G = 'tests/battle-grass.test.mjs', V = 'tests/battle-view-groups.test.mjs';
const T = {
  clock: 'Concepción is on the engine and on the director\'s clock: the division leaves Espada at two on the 27th, the fog lifts at eight, and nothing moves the day',
  leaves: 'the division leaves Espada with every family\'s person who went, and each is under the bank, in the line, before the horsemen come out of the fog',
  held: 'nobody in the division can be sent anywhere else until it rejoins the army, and a Host\'s time jump stops at the fight',
  fate: 'a family\'s person\'s fate falls at a discharge of the gun, visible to those watching and never before: crossing the open, down where he fell, or hurt and helped back under the bank',
  viewers: 'the Host, the families with somebody there, and the main army\'s from when the firing is heard are sent the fight; a family with nobody there gets nothing',
  after: 'afterwards the division rejoins the army at Concepción, each family is told through its own person what happened, and the country hears of it',
  pace: 'the fighting plays three to six real minutes at the Study pace, held to each phase\'s step, landing on every phase\'s start, and the night in camp is not watched',
  saved: 'a class saved in the fight reopens in it with the same fates, and a class that fought Concepción before the engine keeps what it had',
  follow: 'a volunteer who turns out after the army has marched follows it and falls in, the coast\'s volunteers march on from Victoria, and the card says when he would catch it',
  gClock: 'the Grass Fight is on the engine: the alarm at ten, Bowie\'s charge at eleven, the ditch, the sortie and the grass by half past twelve',
  gOut: 'a yes is a departure: a rider goes with Bowie\'s horsemen and a man on foot with Jack\'s infantry, and the question shuts when they ride out',
  gFate: 'a fate falls at its moment and never before: a man with Jack hurt at the ditch\'s first volley, a rider who runs at Bowie\'s first exchange, on the road home',
  gViewers: 'the Host and the family with somebody out watch it; the camp\'s families from when the firing starts; a family with nobody there gets nothing',
  gPace: 'the fighting plays three to six real minutes at Study, held to each phase\'s step and landing on every phase\'s start',
  gWord: 'back in camp the army keeps the record, and when the fuller word rides home each family is told in plain words through its person',
  vGroups: 'a group of a side is drawn apart from it, keyed by its own name: its own count, its own place, and its words from among its own men',
  vBank: 'men under a bank drop below the lip to load and climb to fire; fog lies over the field at the phase\'s density and is gone when it lifts',
  vFallen: 'a man who fell lies where he fell while his side moves off, and one who fell in a group that has left the field is still there',
  vFate: 'a family\'s person is drawn at their own fate: hit, then lying still, or sitting hurt and helped back, or running from the field',
  vGun: 'the pack train is drawn as horses under packs, a Mexican gun is served by regulars where it stands, and the ground the map lacks is drawn',
  vFits: 'every body of men at Concepción and the Grass Fight is laid out whole: no sample is drawn short because its ground is too small for it',
};

const UNIT = [
  { name: 'the director\'s moment of Concepción left at an hour the fight does not keep', file: 'sim/directors.mjs',
    from: "concepcion: CONCEPCION_START + phaseOffset(CONCEPCION, 'fog-lifts'),", to: 'concepcion: 42240 + 60,', test: C, expect: T.clock },
  { name: 'a group of a side drawn with any sample, unchecked', file: 'sim/battle-stage.mjs',
    from: '|| !(group.drawn > 0) || group.drawn > 40) fail(`group ${group?.id} in ${phase.id} is malformed`);', to: ') fail(`group ${group?.id} in ${phase.id} is malformed`);', test: C, expect: T.clock },
  { name: 'the division\'s question shut when the army moves to Espada, as it was', file: 'sim/directors.mjs',
    from: "  once(world, 'to-espada', () => {", to: "  once(world, 'to-espada', () => { if (world.army?.detachment) world.army.detachment.closed = true;", test: C, expect: T.leaves },
  { name: 'a man in the division can be sent for before it rejoins the army', file: 'sim/world.mjs',
    from: "  if (held && input.action !== 'rename') throw new Error(held);", to: '', test: C, expect: T.held },
  { name: 'a hit falls when the charges begin, not at a discharge of the gun', file: 'sim/concepcion-grass.mjs',
    from: '  return charges.from + shots[Math.floor(hashOf(`${world.seed}:${personId}:discharge`) * shots.length)];', to: '  return charges.from;', test: C, expect: T.fate },
  { name: 'the main army\'s families sent the fight before any firing can be heard', file: 'sim/concepcion-grass.mjs',
    from: '    const heard = state?.live && world.minute >= phaseOf(state, HEARD_FROM[id]).from;', to: '    const heard = state?.live;', test: C, expect: T.viewers },
  { name: 'the account does not say why it ended so', file: 'sim/concepcion-grass.mjs',
    from: "    'Why it ended so: the bank sheltered the Texians", to: "    'the bank sheltered the Texians", test: C, expect: T.after },
  { name: 'the charges played at twenty minutes a tick, over in seconds', file: 'sim/battles/concepcion.mjs',
    from: "id: 'charges', minutes: 20, title: 'Three charges', step: 2,", to: "id: 'charges', minutes: 20, title: 'Three charges', step: 20,", test: C, expect: T.pace },
  { name: 'a class that fought Concepción before the engine is made to fight it again', file: 'sim/concepcion-grass.mjs',
    from: 'const foughtBeforeTheEngine = (world, id, milestone) => !world.battles?.[id] && Boolean(world.director?.milestones?.[milestone]);', to: 'const foughtBeforeTheEngine = () => false;', test: C, expect: T.saved },
  { name: 'a volunteer who turns out after the army has marched waits at the rendezvous for ever', file: 'sim/army.mjs',
    from: "  if (beginTravel && army.phase === 'marching') followTheArmy(world, { beginTravel });", to: '', test: C, expect: T.follow },
  { name: 'the director\'s Grass Fight left at four in the afternoon, as it was', file: 'sim/directors.mjs',
    from: "'grass-fight': GRASS_START + phaseOffset(GRASS_ENGAGEMENT, 'bowie'),", to: "'grass-fight': 84420,", test: G, expect: T.gClock },
  { name: 'the Grass Fight\'s question left open an hour after the men have ridden out', file: 'sim/concepcion-grass.mjs',
    from: '  if (world.minute >= rideOut && !battle.done.closed) {', to: '  if (world.minute >= rideOut + 60 && !battle.done.closed) {', test: G, expect: T.gOut },
  { name: 'every fate at the Grass Fight falls as Bowie charges', file: 'sim/concepcion-grass.mjs',
    from: "  return entry.group === 'texian' ? bowie.from + 6 : ambush.from + 2;", to: '  return bowie.from;', test: G, expect: T.gFate },
  { name: 'the Host\'s camera never sent to the field', file: 'sim/concepcion-grass.mjs',
    from: "        out.host = { focus: FIELD[id].includes(state.phase.id) ? 'battle' : 'regional',", to: "        out.host = { focus: 'regional',", test: G, expect: T.gViewers },
  { name: 'Bowie\'s charge played at twenty minutes a tick', file: 'sim/battles/grass-fight.mjs',
    from: "id: 'bowie', minutes: 20, title: 'Bowie charges the train', step: 2,", to: "id: 'bowie', minutes: 20, title: 'Bowie charges the train', step: 20,", test: G, expect: T.gPace },
  { name: 'no account when the word of the Grass Fight rides home', file: 'sim/directors.mjs',
    from: '    grassAccounts(world, eventId);', to: '', test: G, expect: T.gWord },
  { name: 'a group\'s men counted with their side, not apart', file: 'public/battle-view.js',
    from: '        if (side.key === side.side || side.part) drawn[side.side].push(point);', to: '        drawn[side.side].push(point);', test: V, expect: T.vGroups },
  { name: 'men under a bank drawn loading at the lip, never dropping below it', file: 'public/battle-view.js',
    from: "            if (side.style === 'bank') { sprite = `${kind}-load`; flip = !right; dy = figurePx * 0.32; }", to: "            if (side.style === 'bank') { sprite = `${kind}-load`; flip = !right; }", test: V, expect: T.vBank },
  { name: 'the fallen carried along with their side as it moves', file: 'public/battle-view.js',
    from: '        const ground = down ? view.fallenSpots.get(seedKey) : at;', to: '        const ground = at;', test: V, expect: T.vFallen },
  { name: 'a family\'s person hit goes on firing', file: 'public/battle-view.js',
    from: "    if (fell && since >= 0 && fell.fate !== 'escaped') {", to: '    if (false) {', test: V, expect: T.vFate },
  { name: 'every gun served by volunteers, whoever\'s it is', file: 'public/battle-view.js',
    from: "    const who = gun.side === 'mexican' ? 'regular' : 'volunteer', back = right ? -1 : 1;", to: "    const who = 'volunteer', back = right ? -1 : 1;", test: V, expect: T.vGun },
  { name: 'Bowie\'s companies given ground too small for them', file: 'sim/battles/concepcion.mjs',
    from: "count: 41, drawn: 20, style, spread: { width: 0.2, depth: 0.06 }", to: "count: 41, drawn: 20, style, spread: { width: 0.05, depth: 0.02 }", test: V, expect: T.vFits },
];

const BROWSER = [
  { name: 'no fog on the morning at Concepción', fight: 'concepcion', file: 'public/battle-view.js',
    from: '    const fogShown = battle.fog > 0 ? drawFog(ctx, battle, camera, bounds) : 0;', to: '    const fogShown = 0;', expect: 'no fog over the field' },
  { name: 'the Mexican infantry drawn loose, like the volunteers', fight: 'concepcion', file: 'sim/battles/concepcion.mjs',
    from: "      mexican: { style: 'ranks', keys: [[0, 'line'], [3, 'charge']", to: "      mexican: { style: 'rout', spread: { width: 0.36, depth: 0.26 }, keys: [[0, 'line'], [3, 'charge']", expect: 'not looser than the Mexican ranks' },
  { name: 'nobody in the division is ever hit where the seed hits them', fight: 'concepcion', file: 'sim/concepcion-grass.mjs',
    from: "      if (fate !== 'unhurt') stageFate(world, 'concepcion', personId, { fate, minute: concepcionMoment(world, state, personId, fate) });", to: '', expect: 'was not drawn killed at the staged moment' },
  { name: 'a family\'s person hit drawn going on firing', fight: 'concepcion', file: 'public/battle-view.js',
    from: "    if (fell && since >= 0 && fell.fate !== 'escaped') {", to: '    if (false) {', expect: 'the fate was not drawn in its pose' },
  { name: 'the family with its man at Espada never hears the firing', fight: 'concepcion', file: 'sim/concepcion-grass.mjs',
    from: '        else if (withArmy && heard) out.battle =', to: '        else if (false) out.battle =', expect: 'the family nearby was not sent the firing' },
  { name: 'no account afterwards', fight: 'concepcion', file: 'sim/concepcion-grass.mjs',
    from: '      if (showing && world.entities[told.entityId] && !out.battleAccount) {', to: '      if (false) {', expect: 'the account never came' },
  { name: 'no alert through the person', fight: 'grass', file: 'sim/concepcion-grass.mjs',
    from: '      if (alerted && person && !GONE.includes(person.health?.condition) && !done && !out.battleAlert) {', to: '      if (false) {', expect: 'no alert with Watch came' },
  { name: 'Jack\'s infantry drawn scattered on its way out, not in double file', fight: 'grass', file: 'sim/battles/grass-fight.mjs',
    from: "      groups: [jack('column', { from: 'jackOut', to: 'jackApproach'", to: "      groups: [jack('loose', { spread: { width: 0.3, depth: 0.14 }, from: 'jackOut', to: 'jackApproach'", expect: 'not in double file' },
  { name: 'the Host\'s camera kept off the field', fight: 'grass', file: 'sim/concepcion-grass.mjs',
    from: "        out.host = { focus: FIELD[id].includes(state.phase.id) ? 'battle' : 'regional',", to: "        out.host = { focus: 'regional',", expect: 'the Host\'s camera was not sent to the field' },
  { name: 'a family with nobody there sent the fight', fight: 'grass', file: 'sim/concepcion-grass.mjs',
    from: '        if (own.length) out.battle =', to: '        if (true) out.battle =', expect: 'the family nearby was not sent the firing it could hear' },
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
function runBrowser(fight) {
  const result = spawnSync(process.execPath, ['scripts/battle-1835-browser-proof.mjs', fight], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 40 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
// `check`: only that every injection's text is found exactly once, so a stale pattern is caught before a long run.
if (which === 'check') {
  const stale = [];
  for (const injection of [...UNIT, ...BROWSER]) { try { inject(injection, () => null); } catch (error) { stale.push(error.message); } }
  console.log(stale.length ? `STALE:\n${stale.join('\n')}` : `${UNIT.length + BROWSER.length} injections each found exactly once.`);
  process.exit(stale.length ? 1 : 0);
}
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-1835-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }
// The browser proof rewrites its own evidence on every run; the clean run's record is kept, not an injected run's.
const proofPath = 'docs/evidence/battle-1835-browser.json';
let proofRecord = null;
try { proofRecord = readFileSync(proofPath, 'utf8'); } catch { /* none yet */ }

if (which === 'all' || which === 'unit') {
  const files = [...new Set(UNIT.map(one => one.test))];
  for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of UNIT) {
    const seen = inject(injection, () => runUnit(injection.test));
    const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
    record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  for (const file of files) { const after = runUnit(file); if (!after.passed) throw new Error(`${file} fails after every file was put back: ${after.failed.join('; ')}`); }
}
if (which === 'all' || which === 'browser') {
  record.cleanBrowserChecks = {};
  for (const fight of ['concepcion', 'grass']) {
    const clean = runBrowser(fight);
    if (!clean.passed) throw new Error(`The ${fight} browser gate fails before any injection: ${clean.failure}`);
    record.cleanBrowserChecks[fight] = clean.checks;
  }
  proofRecord = readFileSync(proofPath, 'utf8');
  for (const injection of BROWSER) {
    const seen = inject(injection, () => runBrowser(injection.fight));
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, fight: injection.fight, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  for (const fight of ['concepcion', 'grass']) { const after = runBrowser(fight); if (!after.passed) throw new Error(`The ${fight} browser gate fails after every file was put back: ${after.failure}`); }
}
if (proofRecord) writeFileSync(proofPath, proofRecord);
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'battle-1835-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${C} ${G} ${V}, the named test and no other`, browser: 'scripts/battle-1835-browser-proof.mjs concepcion | grass' },
  unit: record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
