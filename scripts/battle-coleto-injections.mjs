// The regressions Coleto's and Palm Sunday's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). The same harness as scripts/battle-injections.mjs: each injection replaces one exact piece of the code
// with the mistake - found exactly once, CRLF or not - runs the check written for it, and puts the file back byte for byte.
// A unit injection requires the named test, and no other in its file, to fail; a browser injection runs
// scripts/battle-coleto-browser-proof.mjs and requires its failure to be the message written for that check.
//
// Slow: the browser gate plays a class into the spring and watches Coleto and Palm Sunday for each of its injections.
// Same computer. Run: node scripts/battle-coleto-injections.mjs [unit|browser]  -> docs/evidence/battle-coleto-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const COLETO = 'tests/battle-coleto.test.mjs', VIEW = 'tests/battle-coleto-view.test.mjs';
const UNIT = [
  { name: 'the column never leaves Goliad: the men stand at the presidio while the fight is fought nine miles off', file: 'sim/fannin.mjs',
    from: '    walkToward(world, person, at, siteId);', to: "    walkToward(world, person, world.map.sites.goliad, 'goliad');",
    test: COLETO, expect: 'Fannin\'s men march out of Goliad with the column at nine, walk with it to Coleto and stand in the square when it forms; nobody new joins him' },
  { name: 'recall read off the class\'s own minute: shut eighteen hours before anybody marched', file: 'sim/winter.mjs',
    from: 'world.minute >= FANNIN_MARCHES + campClock(world))', to: 'world.minute >= FANNIN_MARCHES)',
    test: COLETO, expect: 'recall shuts when the column marches, on the director\'s clock - not eighteen hours before' },
  { name: 'a death on the family\'s screen the moment he falls, before the word', file: 'sim/fannin.mjs',
    from: '    person.service = { ...person.service, coleto: entry.fate };', to: "    person.service = { ...person.service, coleto: entry.fate }; if (entry.fate === 'killed') person.health = { condition: 'dead' };",
    test: COLETO, expect: 'each man\'s fate falls at its moment inside the fighting, from the roll the game always made; a wound shows at once, a death waits for the word, and the dead man lies where he fell' },
  { name: 'the dead man is marched back to Goliad with the prisoners', file: 'sim/fannin.mjs',
    from: "    if (entry.down?.kind === 'killed') continue;", to: '',
    test: COLETO, expect: 'each man\'s fate falls at its moment inside the fighting, from the roll the game always made; a wound shows at once, a death waits for the word, and the dead man lies where he fell' },
  { name: 'nobody rides with Horton', file: 'sim/fannin.mjs',
    from: "      const horton = modeWith(world, person) === 'horse' && share(world, person.id, 'horton') < HORTON_SHARE;", to: '      const horton = false;',
    test: COLETO, expect: 'a man with his own horse may ride with Horton\'s scouts, is cut off in the timber when the column is caught, and rides home; nobody without one does' },
  { name: 'a man still wounded runs for the river (G2 undone)', file: 'sim/fannin.mjs',
    from: "  return person.health?.condition === 'wounded' && fate === 'escaped' ? 'executed' : fate;", to: '  return fate;',
    test: COLETO, expect: 'Palm Sunday: each prisoner meets the record\'s share at its own moment; a man still wounded cannot run; the man who gets away starts home at once and tells it himself' },
  { name: 'the man who got away waits at the river for the word before he starts home', file: 'sim/fannin.mjs',
    from: "      if (home && beginTravel) { try { beginTravel(world, person, home, eventId, 'home'); } catch { /* ceiling: he stands by the river */ } }", to: '',
    test: COLETO, expect: 'Palm Sunday: each prisoner meets the record\'s share at its own moment; a man still wounded cannot run; the man who gets away starts home at once and tells it himself' },
  { name: 'the account at the word tells Coleto and leaves Palm Sunday out', file: 'sim/fannin.mjs',
    from: '    `What happened: ${COLETO_STORY} ${GOLIAD_STORY}`,', to: '    `What happened: ${COLETO_STORY}`,',
    test: COLETO, expect: 'afterwards every other family with a man there is told through whoever hears it at home - Coleto and Goliad together, the escapes, those spared, and "Remember Goliad"' },
  { name: 'every family is sent the fight, wherever its people are', file: 'sim/fannin.mjs',
    from: '    if (!inIt && !inTown) continue;', to: '',
    test: COLETO, expect: 'who is sent what: the Host always, framed on the field while it is fought; a family only while its man is there; nobody else, not a fate before it falls' },
  { name: 'the march and the muster offered as Watch', file: 'sim/fannin.mjs',
    from: "action: alerted.stage === 'march' || id === 'goliad-massacre' ? WATCHED[id] : 'Watch' };", to: "action: 'Watch' };",
    test: COLETO, expect: 'the alerts come through the man: Follow on the march, Watch when the column is caught and when the guns open, Follow at the muster; never to a family with nobody there' },
  { name: 'a class saved before the engine is never given Coleto', file: 'sim/fannin.mjs',
    from: "  if (!world.map?.sites?.goliad || !Number.isFinite(start)) return;\n  const battle = armBattle(world, 'coleto', start);", to: "  if (!world.map?.sites?.goliad || !Number.isFinite(start) || !world.battles) return;\n  const battle = armBattle(world, 'coleto', start);",
    test: COLETO, expect: 'a class saved in the middle of Coleto reopens in the middle of it, and one saved before the engine gains it from the clock, with no save version moved' },
  { name: 'the night at Coleto watched twenty minutes a tick: the fight runs past the lesson', file: 'sim/battles/coleto.mjs',
    from: "      id: 'night', minutes: 480, step: 240, light: 'night',", to: "      id: 'night', minutes: 480, step: 20, light: 'night',",
    test: COLETO, expect: 'the clock is held for Coleto: the fighting about ten real minutes at the Study pace, the whole of it under fifteen, never faster than it was going' },
  { name: 'the square\'s men face in', file: 'public/battle-view.js',
    from: '      out.push({ along: out1.along ? out1.along * reach : t, across: out1.across ? out1.across * reach : t,', to: '      out.push({ along: out1.along ? -out1.along * reach : t, across: out1.across ? -out1.across * reach : t,',
    test: VIEW, expect: 'the square is four faces of three ranks, each man facing out of his own face, drawn evenly; the marksmen in the grass are loose' },
  { name: 'the square\'s faces run past its inner rank, and meet at the corners', file: 'public/battle-view.js',
    from: 'const SQUARE = Object.freeze({ outer: 0.09,', to: 'const SQUARE = Object.freeze({ outer: 0.06,',
    test: VIEW, expect: 'the square is four faces of three ranks, each man facing out of his own face, drawn evenly; the marksmen in the grass are loose' },
  { name: 'a fallen man moves with his company', file: 'public/battle-view.js',
    from: '        const ground = down && view.lying.has(lyingKey) ? view.lying.get(lyingKey) : onGround(centre, facing, slot);', to: '        const ground = onGround(centre, facing, slot);',
    test: VIEW, expect: 'a man who falls lies where he fell while his company falls back; a family\'s man hit is drawn down, never before; in the square he faces out of his own face' },
  { name: 'the night is drawn as day', file: 'public/battle-view.js',
    from: '    if (battle.light && LIGHT[battle.light] && bounds) {', to: '    if (false) {',
    test: VIEW, expect: 'several guns fire, each shot once, served by men of their own side; the night darkens the field under the flashes' },
  { name: 'a Mexican gun served by Texian volunteers', file: 'public/battle-view.js',
    from: "crewKind = gun.side === 'mexican' ? 'regular' : 'volunteer';", to: "crewKind = 'volunteer';",
    test: VIEW, expect: 'several guns fire, each shot once, served by men of their own side; the night darkens the field under the flashes' },
  { name: 'an order given at the killing on Palm Sunday', file: 'public/battle-view.js',
    from: '      const words = battle.commands?.[unit.side]?.volley || battle.commands?.volley;', to: "      const words = battle.commands?.[unit.side]?.volley || battle.commands?.volley || [{ text: '¡Fuego!', gloss: 'Fire!' }];",
    test: VIEW, expect: 'the surrender is drawn with hands raised and a white flag at a corner; Palm Sunday\'s named woman is drawn in her own figure and named, and its guard counts nobody' },
  { name: 'Francita Alavez drawn as a soldier', file: 'public/battle-view.js',
    from: '        else if (side.figure) {', to: '        else if (false) {',
    test: VIEW, expect: 'the surrender is drawn with hands raised and a white flag at a corner; Palm Sunday\'s named woman is drawn in her own figure and named, and its guard counts nobody' },
  { name: 'Follow put on the card as Watch', file: 'public/military-attention.js',
    from: "action: alert.action || 'Watch', field: alert.field });", to: "action: 'Watch', field: alert.field });",
    test: VIEW, expect: 'the card: Follow on a march or a muster, Watch in a fight, through the family\'s own man' },
];

const BROWSER = [
  { name: 'no smoke: a shot leaves nothing behind', file: 'public/battle-view.js',
    from: '    const w = wind || { x: 0, y: 0 };', to: '    return;', expect: 'no smoke on screen' },
  { name: 'the square drawn loose, like the marksmen', file: 'public/battle-view.js',
    from: "  if (style === 'square') {", to: '  if (false) {', expect: 'the square is not more even than the marksmen' },
  { name: 'the family\'s man stays at Goliad', file: 'sim/fannin.mjs',
    from: '    walkToward(world, person, at, siteId);', to: "    walkToward(world, person, world.map.sites.goliad, 'goliad');", expect: 'is not in the square at Coleto' },
  { name: 'no card when the column marches out', file: 'sim/fannin.mjs',
    from: "    if (id === 'coleto' && ['surrender', 'march-back'].includes(state.phase.id)) continue;", to: "    if (id === 'coleto' && ['march-out', 'road', 'surrender', 'march-back'].includes(state.phase.id)) continue;", expect: 'no Follow card came through the man when the column marched out' },
  { name: 'the family with nobody there is sent the fight', file: 'sim/fannin.mjs',
    from: '    if (!inIt && !inTown) continue;', to: '', expect: 'the family with nobody there was sent the battle' },
  { name: 'nobody falls', file: 'public/battle-view.js',
    from: '      if (battle.noFalling?.includes(fall.side)) continue;', to: '      continue;', expect: 'the prisoners were not drawn falling' },
  { name: 'no account at the word', file: 'sim/directors.mjs',
    from: 'tellGoliad(world, go); tellFannin(world); });', to: 'tellGoliad(world, go); });', expect: 'no account came through the family at the word' },
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
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/battle-coleto-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 40 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-coleto-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

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
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'battle-coleto-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: 'node --test tests/battle-coleto*.test.mjs, the named test and no other', browser: 'scripts/battle-coleto-browser-proof.mjs' },
  unit: record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
