// The four blockers of the design audit of 2026-09-28 (docs/audits/2026-09-28-design.md B2, B4, B7, B11), each regression put
// back one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection replaces one exact piece of
// the fix with the old behaviour or the mistake a check is written against, runs the tests (or, with --browser, the browser
// proof) that guard it, records what failed, and puts the file back byte for byte. A check is caught *alone* when what failed is
// exactly the tests it names.
//
// Run: node scripts/design-blockers-injections.mjs            → the unit tests, writes docs/evidence/design-blockers-injections.json
//      node scripts/design-blockers-injections.mjs --browser  → the browser proofs too (npm run test:host-bell, test:scrape,
//                                                              test:ending, test:family-panel, test:scrape-pursuit), minutes each
//      node scripts/design-blockers-injections.mjs --check    → every pattern found exactly once, nothing run
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/lifecycle.test.mjs', 'tests/absence.test.mjs', 'tests/periods.test.mjs', 'tests/scrape.test.mjs', 'tests/scrape-pursuit.test.mjs',
  'tests/family-commands.test.mjs', 'tests/family-panel.test.mjs', 'tests/ending.test.mjs', 'tests/classes.test.mjs'];
const STOP_TODAY = [
  'Stop for today saves the class paused and stops the server; the next launch opens the same class paused, and Resume goes on',
  'Stop for today on a server that cannot close itself still saves the class paused, and says it is not stopping',
  // It stops the class for today on its way to the relaunch, so it fails with Stop for today too.
  'a class stopped for today and opened again keeps who is absent: a family saved absent stays so, and one whose student does not come back becomes so',
];
const INTERIM = [
  'the first period ends with interim standings and the winter offered to the Host; the invented country has no winter',
  'the second period plays its own moments, none of 1835 again, and ends with interim standings and the spring offered',
];
const PACKED = ['the family\'s card opens on the packing a family deciding alone takes - food first, as much as fits - and a load far under it is told apart'];
const CHOOSING = ['choosing somebody shows their bar and leaves the main person as it was; only a living person chosen takes the bar; a portrait is the star'];
const CONTINUED = ['a class ended part-way through a period is continued from Classes where it was, paused; its ending and flashbacks go'];
const DELETED = ['a kept class is deleted from the list into the archive with its flashbacks, never the open one, and put back by hand'];
const ANSWERS = ['who answers the soldiers is the main person every rule reads: somebody else on auto never answers for a family by hand, and a dead choice gives way'];

const INJECTIONS = [
  // B2: the bell.
  {
    name: 'B2: there is no Stop for today; the Host has only End Game, final, and Stop Server',
    file: 'server/app.mjs',
    from: "            } else if (input.action === 'stop-for-today') {",
    to: "            } else if (input.action === 'stop-for-today-never') {",
    expect: STOP_TODAY,
  },
  {
    name: 'B2: Stop for today ends the class instead of pausing it',
    file: 'server/app.mjs',
    from: "              if (s.world.status === 'running') s.world.status = 'paused';\n              forToday = true;",
    to: "              s.world.status = 'ended';\n              forToday = true;",
    expect: STOP_TODAY,
  },
  {
    name: 'B2: End Game is one press again, with nothing said',
    file: 'public/app.js',
    from: " end: 'Confirm: end the whole game',",
    to: '',
    browser: 'test:host-bell',
  },
  // B4: glory in the interim standings.
  {
    name: 'B4: the interim standings carry every family\'s glory, what earned it and who leads, as before',
    file: 'sim/ending.mjs',
    from: '    return { ending: { host: { ...(interim ? interimHost(host) : host), interim,',
    to: '    return { ending: { host: { ...host, interim,',
    expect: INTERIM,
    browser: 'test:ending',
  },
  {
    name: 'B4: a family\'s interim standing carries its glory and the sum that shows it',
    file: 'sim/ending.mjs',
    from: '  return { ending: { family: { ...(interim ? interimFamily(family) : family), interim } } };',
    to: '  return { ending: { family: { ...family, interim } } };',
    expect: INTERIM,
  },
  {
    name: 'B4: the Host\'s interim standings name the family that leads (coin and land only, owner 2026-09-28)',
    file: 'sim/ending.mjs',
    from: '  return { families: host.families.map(',
    to: '  return { winners: host.winners, families: host.families.map(',
    expect: INTERIM,
  },
  {
    name: 'B4: a family\'s interim standing tells more than its coin and land: the ending\'s story',
    file: 'sim/ending.mjs',
    from: 'money: family.money, land: family.land, acres: family.acres });',
    to: 'money: family.money, land: family.land, acres: family.acres, story: family.story });',
    expect: INTERIM,
  },
  // Stop for today keeps who is absent (classroom audit 2026-09-28, the coordinator's word the same day).
  {
    name: 'B2: a relaunch begins presence afresh, and every joined family counts as present',
    file: 'server/app.mjs',
    from: '  }\n  seedPresence();',
    to: '  }',
    expect: ['a class stopped for today and opened again keeps who is absent: a family saved absent stays so, and one whose student does not come back becomes so'],
  },
  {
    name: 'B2: a family saved absent is counted as seen at the relaunch, and handed back to nobody',
    file: 'server/app.mjs',
    from: '?.absent ? launched - absentMs : launched);',
    to: '?.absent ? launched : launched);',
    expect: ['a class stopped for today and opened again keeps who is absent: a family saved absent stays so, and one whose student does not come back becomes so'],
  },
  // B7: the load for the east.
  {
    name: 'B7: the flight card is sent no load to open with',
    file: 'sim/scrape.mjs',
    from: '  if (deciding.refuges.length) deciding.packed = packFlight(deciding);',
    to: '',
    expect: PACKED,
  },
  {
    name: 'B7: a load of nothing is not told apart from a full one',
    file: 'public/family-panel.js',
    from: "  return used <= 0 ? 'empty' : used < full / 2 ? 'light' : null;",
    to: '  return null;',
    expect: PACKED,
  },
  {
    name: 'B7: every box on the card opens at 0 again',
    file: 'public/app.js',
    from: "input.value = String(flight.packed?.take?.[good] ?? 0);",
    to: "input.value = '0';",
    browser: 'test:scrape',
  },
  {
    name: 'B7: a double press on Leave gets through with nothing loaded',
    file: 'public/app.js',
    from: "const SLOW_CONFIRM = new Set(['flee-light', 'flee-empty']);",
    to: 'const SLOW_CONFIRM = new Set();',
    browser: 'test:scrape',
  },
  // B11: choosing is not making main - except the portrait, which the owner made the star again on 2026-09-29
  // (docs/FAMILY_PANEL.md, amendment 2026-09-29); its injection is now the portrait going back to choosing only.
  {
    name: 'owner 2026-09-29: pressing a portrait only chooses again, and does not do what the star does',
    file: 'public/app.js',
    from: "  if (portrait) { pressStar(portrait.dataset.portrait); return; }",
    to: "  if (portrait) { goToPerson(portrait.dataset.portrait); return; }",
    expect: CHOOSING,
    browser: 'test:family-panel',
  },
  {
    name: 'B11: a grown person chosen does not get their own bar; only a child does, as before',
    file: 'public/family-panel.js',
    from: "  return viewed && !['dead', 'captured'].includes(viewed.health?.condition) ? viewedId : mainId;",
    to: "  return viewed && viewed.age < 10 && !['dead', 'captured'].includes(viewed.health?.condition) ? viewedId : mainId;",
    expect: CHOOSING,
  },
  {
    // Since the merge of "who acts for a family" (origin/main f815d07e) the chase reads `actingId`, which supersedes this branch's
    // `mainPersonId` read and keeps what it fixed.
    name: 'B11 (M32): the chase reads the chosen main person\'s raw id, dead or not',
    file: 'sim/pursuit.mjs',
    from: '  const actor = world.entities[actingId(world, household)];',
    to: '  const actor = world.entities[household.mainId || household.principalId];',
    expect: ANSWERS,
  },
  // Owner 2026-09-29: the card beside a person opens only for a matter it alone holds (docs/FAMILY_PANEL.md, amendment 2026-09-29).
  {
    name: 'owner 2026-09-29: the card beside a person opens on everybody chosen again (family panel)',
    file: 'public/app.js',
    from: "  if (!hostView(world) && !selectionMatter()) { panel.hidden = true; delete panel.dataset.entityId; releaseCrowding(); return; }",
    to: "  if (false) { panel.hidden = true; delete panel.dataset.entityId; releaseCrowding(); return; }",
    browser: 'test:family-panel',
  },
  {
    name: 'owner 2026-09-29: the card beside a person opens on everybody chosen again (overlap)',
    file: 'public/app.js',
    from: "  if (!hostView(world) && !selectionMatter()) { panel.hidden = true; delete panel.dataset.entityId; releaseCrowding(); return; }",
    to: "  if (false) { panel.hidden = true; delete panel.dataset.entityId; releaseCrowding(); return; }",
    browser: 'test:overlap',
  },
  {
    name: 'owner 2026-09-29: the bar\'s way to a neighbour opens the card again, not the Neighbours list',
    file: 'public/app.js',
    from: "    if (panelButton.dataset.visit) { hidePanelTip(); openNeighbours(); return; }",
    to: "    if (panelButton.dataset.visit) { selectedId = panelButton.dataset.entityId; selectionDismissed = false; if (window.__snapshot) renderSelection(window.__snapshot.world); $('#selection').hidden = false; return; }",
    browser: 'test:neighbours',
  },
  // 'B11: a portrait pressed in the chase hands the family to somebody on auto' is gone with the owner's reversal of 2026-09-29:
  // a portrait is the star, and hands the family to whoever is pressed, as the star always has.
  {
    name: 'B11: the "!" makes the person it goes to the main person',
    file: 'public/app.js',
    from: "  if (attention) { openNeed(attention.dataset.attention); return; }",
    to: "  if (attention) { if (attention.dataset.attention !== focusedId) chooseFocus(attention.dataset.attention); openNeed(attention.dataset.attention); return; }",
    expect: CHOOSING,
  },
  // Continue: a class ended by mistake, part-way through a period (owner, 2026-09-28: "Yes, allow Continue"; HOST_PAGE §2.8).
  {
    name: 'Continue: there is no Continue; a class ended by mistake stays ended',
    file: 'server/app.mjs',
    from: "            else if (input.action === 'continue-class') {",
    to: "            else if (input.action === 'continue-class-never') {",
    expect: CONTINUED,
  },
  {
    name: 'Continue: the class is taken up again running, not paused for the teacher',
    file: 'sim/periods.mjs',
    from: "  world.status = 'paused';\n  record(world, 'lifecycle'",
    to: "  world.status = 'running';\n  record(world, 'lifecycle'",
    expect: CONTINUED,
  },
  {
    name: 'Continue: the flashback videos of the mistaken ending are kept',
    file: 'server/app.mjs',
    from: '        if (continued) flashbacks.discard(continued);',
    to: '',
    expect: CONTINUED,
  },
  {
    name: 'Continue: the Classes list does not say which class can be continued',
    file: 'server/app.mjs',
    from: ' continuable: endedEarly(world),',
    to: ' continuable: false,',
    expect: CONTINUED,
  },
  {
    name: 'Continue: a class that came to its own end - the war over - is continued too',
    file: 'sim/periods.mjs',
    from: "  if (world.director?.complete) return canContinue(world)",
    to: "  if (false) return canContinue(world)",
    expect: ['a class that came to its own end is not continued: a period goes on by its own button, the war not at all'],
  },
  {
    name: 'Continue: the Classes panel has no Continue button',
    file: 'public/class-panel.js',
    from: '          if (entry.continuable) {',
    to: '          if (false) {',
    browser: 'test:host-bell',
  },
  // Delete a kept class (owner, 2026-09-28: "Yes, with a confirm"; HOST_PAGE §2.9, RECOVERY "A deleted class").
  {
    name: 'Delete: the open class can be deleted too',
    file: 'server/app.mjs',
    from: "              if (input.classId === s.sessionId) throw new Error('That class is open. Open another class first, then delete this one.');",
    to: '',
    expect: DELETED,
  },
  {
    name: 'Delete: the save is not moved to the archive (put out of the way where nobody will look)',
    file: 'server/app.mjs',
    from: '    renameSync(from, save);\n    shelfSummaries.delete',
    to: '    renameSync(from, `${from}.gone`);\n    shelfSummaries.delete',
    expect: DELETED,
  },
  {
    name: 'Delete: the flashbacks are left behind',
    file: 'server/app.mjs',
    from: "    const videos = flashbacks.moveTo(classId, join(folder, `${base}-flashbacks`));",
    to: '    const videos = null;',
    expect: DELETED,
  },
  {
    name: 'Delete: the archived save loses the session id RECOVERY puts it back by',
    file: 'server/app.mjs',
    from: "    const base = `classes-${classId}-deleted-${new Date().toISOString().replace(/[:.]/g, '-')}`;",
    to: "    const base = `classes-deleted-${new Date().toISOString().replace(/[:.]/g, '-')}`;",
    expect: DELETED,
  },
  {
    name: 'Delete: one press deletes',
    file: 'public/class-panel.js',
    from: "      if (!confirmed(remove, `Confirm: delete ${remove.dataset.name}`)) return;",
    to: '',
    browser: 'test:classes',
  },
  {
    name: 'Delete: the panel does not say where the class went',
    file: 'public/class-panel.js',
    from: '        note(deletedWords(remove.dataset.name, result.deleted));',
    to: '        note(`${remove.dataset.name} was deleted.`);',
    browser: 'test:classes',
  },
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const browser = process.argv.includes('--browser');
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const runProof = script => {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' });
  const out = `${result.stdout}${result.stderr}`;
  const why = out.match(/(AssertionError[^\n]*\n?[^\n]*|TimeoutError[^\n]*|Error: [^\n]*)/)?.[0]?.replace(/\s+/g, ' ').trim() || null;
  return { failed: result.status !== 0, why };
};
const ends = (original, text) => (original.includes('\r\n') ? text.split('\n').join('\r\n') : text);

for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const count = original.split(ends(original, injection.from)).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
}
if (process.argv.includes('--check')) { console.log(`all ${INJECTIONS.length} patterns found once`); process.exit(0); }
const clean = runTests();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  if (only && !injection.name.startsWith(only)) continue;
  if (!injection.expect && !(browser && injection.browser)) continue;
  const original = readFileSync(injection.file, 'utf8');
  writeFileSync(injection.file, original.replace(ends(original, injection.from), ends(original, injection.to)));
  const entry = { name: injection.name, file: injection.file };
  try {
    if (injection.expect) {
      entry.failed = runTests();
      entry.alone = entry.failed.length === injection.expect.length && injection.expect.every(name => entry.failed.includes(name));
    }
    if (browser && injection.browser) entry.proof = { script: injection.browser, ...runProof(injection.browser) };
  } finally { writeFileSync(injection.file, original); }
  record.push(entry);
  const said = [entry.failed && `${entry.alone ? 'caught alone' : entry.failed.length ? 'CAUGHT WITH OTHERS' : 'MISSED'} -> ${entry.failed.join(' | ') || 'nothing failed'}`,
    entry.proof && `${entry.proof.script} ${entry.proof.failed ? `failed: ${entry.proof.why}` : 'PASSED (MISSED)'}`].filter(Boolean).join('; ');
  console.log(`${injection.name}: ${said}`);
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
const missed = record.filter(entry => (entry.failed && !entry.alone) || (entry.proof && !entry.proof.failed));
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(`docs/evidence/design-blockers-injections${only ? `-${only.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}` : ''}${browser ? '-browser' : ''}.json`, `${JSON.stringify({ record: 'design-blockers-injections', date: new Date().toISOString().slice(0, 10), files: FILES, browser, injections: record }, null, 2)}\n`);
console.log(`\n${record.length - missed.length} of ${record.length} caught as they should be; wrote docs/evidence/design-blockers-injections${only ? `-${only.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}` : ''}${browser ? '-browser' : ''}.json`);
if (missed.length) process.exit(1);
