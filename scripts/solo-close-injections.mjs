// The regressions the closing-the-game tests guard (tests/solo.test.mjs, owner 2026-09-27: "i should be able to just X off
// the window and it'll automatically save, pause, and shut down"), injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each replaces one exact piece of server/app.mjs with the mistake a test is written
// against, runs the solo tests, records which failed, and puts the file back byte for byte.
//
// Run: node scripts/solo-close-injections.mjs  → writes docs/evidence/solo-close-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/solo.test.mjs'];
const FILE = 'server/app.mjs';
const INJECTIONS = [
  {
    name: 'the page closing writes nothing and pauses nothing; only the stop, thirty seconds on, does',
    from: "      if (state.world.status === 'running') { commit(s => { s.world.status = 'paused'; }); soloAwayPaused = true; }\n      else flush();",
    to: '      flush();',
    guards: 'closing the solo game\'s page pauses and saves it at once',
  },
  {
    name: 'the watch never stops the server: the player gone, it runs on hidden',
    from: "    console.log('Play Solo: the player\\'s page has gone. Saving the game paused and stopping.');\n    requestStop();",
    to: "    console.log('Play Solo: the player\\'s page has gone. Saving the game paused and stopping.');",
    guards: 'closing the solo game\'s page pauses and saves it at once',
  },
  {
    name: 'the server stops the moment the page closes, so a reload finds it gone',
    from: '    soloExpect(watch.leaveMs);',
    to: '    soloExpect(0);',
    guards: 'closing the solo game\'s page pauses and saves it at once',
  },
  {
    name: 'a page that comes back finds its game still paused by its own leaving',
    from: "    try { if (state.world.status === 'paused' && !runtimeFault) commit(s => { s.world.status = 'running'; }); }",
    to: '    try { /* not resumed */ }',
    guards: 'a solo page that comes back in time finds its game going on',
  },
  {
    name: 'a pause the player pressed while the page was away is undone when it comes back',
    from: "        if (soloControl && input.action !== 'solo-save') soloAwayPaused = false;\n",
    to: '',
    guards: 'a solo page that comes back in time finds its game going on',
  },
  {
    name: 'a continued game opens running, before the player is looking (the old rule)',
    from: "        if (s.world.status === 'running') s.world.status = 'paused';\n      });",
    to: "        if (s.world.status === 'paused') s.world.status = 'running';\n      });",
    guards: 'a continued solo game opens paused even when it was kept running',
  },
  {
    name: 'a class watches too, and one student closing a window pauses and stops everybody\'s class',
    from: '  const watch = solo && soloWatch && onStopRequested ?',
    to: '  const watch = soloWatch && onStopRequested ?',
    guards: 'a class never pauses or stops when a student\'s page closes',
  },
  {
    name: 'the launcher listing the saved games does not hold the stop off, so a player choosing loses the server',
    from: "        // The launcher is about to ask New game or Continue: the player is choosing, not gone (`SOLO_WATCH`).\n        if (watch && !playerHere()) soloExpect(watch.chooseMs);\n",
    to: "        // The launcher is about to ask New game or Continue: the player is choosing, not gone (`SOLO_WATCH`).\n",
    guards: 'the launcher asking for the saved games holds the stop off',
  },
  {
    name: 'a game dealt that no page ever opens keeps its server running hidden',
    from: '        if (watch && !playerHere()) soloExpect(watch.enterMs);\n',
    to: '',
    guards: 'the launcher asking for the saved games holds the stop off',
  },
  {
    name: 'the player\'s Save and Pause are written only within SAVE_WITHIN_MS, like any order',
    from: "when: identity.role === 'host' || soloControl ? 'now' : 'order' });",
    to: "when: identity.role === 'host' ? 'now' : 'order' });",
    guards: 'the solo player\'s own Pause, Resume and Save',
  },
  {
    name: 'a student in a class can pause the whole class',
    from: "            if (!solo) throw new Error('Only the teacher pauses or resumes a class.');\n",
    to: '',
    guards: 'the solo player\'s own Pause, Resume and Save',
  },
  {
    name: 'a solo server stopped leaves its game running on the disk',
    from: "      if (solo && !closing && (state.world.status === 'running' || runtimeFault)) {",
    to: '      if (false) {',
    guards: 'stopping a solo server writes everything it showed, paused, whole',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(FILE, 'utf8');
  // Written with plain newlines; a CRLF working copy gets them back as CRLF, so a pattern never silently fails to match.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${FILE} ${count} times`);
  writeFileSync(FILE, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(FILE, original); }
  const caught = failed.some(name => name.startsWith(injection.guards));
  record.push({ name: injection.name, guards: injection.guards, caught, alone: caught && failed.length === 1, failed });
  console.log(`${caught ? (failed.length === 1 ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after the file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/solo-close-injections.json', `${JSON.stringify({ record: 'solo-close-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught, ${record.filter(one => one.alone).length} alone. Wrote docs/evidence/solo-close-injections.json`);
