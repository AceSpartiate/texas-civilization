// The regressions the saved-solo-game tests guard (tests/solo.test.mjs), injected one at a time (CLAUDE.md: "A new test
// is not evidence until it has failed"). Each injection replaces one exact piece of server/app.mjs with the mistake a
// test is written against, runs the test file, records which tests failed, and puts the file back byte for byte.
//
// docs/DEPLOYMENT.md has claimed "four injections" for this file since 2026-09-17 with no record on the disk to show
// for it. These are written down.
//
// Run: node scripts/solo-games-injections.mjs  → writes docs/evidence/solo-games-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/solo.test.mjs'];
const FILE = 'server/app.mjs';
const INJECTIONS = [
  // Deleting a game (owner, 2026-09-21).
  {
    name: 'a class can delete a solo game, so a teacher\'s save is reachable from the playtest door',
    from: "  function deleteSoloGame(id) {\n    if (!solo) throw new Error('This is not a Play Solo server.');",
    to: '  function deleteSoloGame(id) {',
    expect: 'may pass: the route itself is gated by `solo` before this function can be reached, so nothing sent over HTTP can tell this second lock from the first. It is kept as defence in depth, and this line records that it is not independently provable.',
  },
  {
    name: 'the id a caller sends is joined to a folder without being checked, so "../save" names a file outside the games',
    from: "    if (typeof id !== 'string' || !SOLO_GAME_ID.test(id)) throw new Error('That is not a saved solo game.');\n    if (!gamesDir) throw new Error('This solo server keeps no games.');",
    to: "    if (!gamesDir) throw new Error('This solo server keeps no games.');",
  },
  {
    name: 'anybody on this computer may delete a game, because the Host key is not asked for',
    from: "      if (solo && req.method === 'POST' && url.pathname === '/api/solo/games/delete') {\n        const input = await body(req);\n        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });",
    to: "      if (solo && req.method === 'POST' && url.pathname === '/api/solo/games/delete') {\n        const input = await body(req);",
  },
  {
    name: 'the game the server is holding stays in the list after it is deleted, because the listing never asks what was set aside',
    from: '    for (const id of [...games.keys()]) if (wasDeleted(id)) games.delete(id);\n',
    to: '',
  },
  {
    name: 'the game is left where the listing reads from, so deleting shows in nothing',
    from: '    if (existsSync(kept)) renameSync(kept, join(deletedDir, `${id}.json`));',
    to: '    if (existsSync(kept)) { /* left where it is */ }',
  },
  {
    name: 'a game that has never been written to a file cannot be deleted at all, which is every game being played',
    from: '    else if (id === state.sessionId && Object.keys(state.clients).length) writeSave(join(deletedDir, `${id}.json`), { ...state, soloSavedAt: new Date().toISOString() });\n',
    to: '',
  },
  {
    name: 'a second press on the same trash can is an error rather than the same answer',
    from: "    if (wasDeleted(id)) return { deleted: id, already: true };\n",
    to: '',
  },
  // The list and the continuing it was built for (owner, 2026-09-17), which had no record of its own until now.
  {
    name: 'a class lists solo games',
    from: "  function soloGames() {\n    if (!solo) throw new Error('This is not a Play Solo server.');",
    to: '  function soloGames() {',
    expect: 'may pass: the route itself is gated by `solo` before this function can be reached, so nothing sent over HTTP can tell this second lock from the first. It is kept as defence in depth, and this line records that it is not independently provable.',
  },
  {
    name: 'the game being played is not kept when another takes its place, so a new game throws the last one away',
    from: '  function keepSoloGame() {\n    if (!gamesDir || !Object.keys(state.clients).length) return;',
    to: '  function keepSoloGame() {\n    return;\n    // eslint-disable-next-line no-unreachable\n    if (!gamesDir || !Object.keys(state.clients).length) return;',
  },
  {
    name: 'continuing a game deals it again instead of opening the one that was saved',
    from: "      if (!saved || saved.sessionId !== id) throw new Error('That saved solo game is not there.');",
    to: "      if (!saved || saved.sessionId !== id) throw new Error('That saved solo game is not there.');\n      saved = { ...saved, world: { ...saved.world, seed: `${saved.world.seed}-again` } };",
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
  // The patterns above are written with plain newlines and this working copy is CRLF; a pattern that cannot match is a
  // harness that quietly proves nothing, which has happened twice in this repository.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed, ...(injection.expect && { expect: injection.expect }) });
  console.log(`${failed.length ? 'caught' : injection.expect ? 'not provable here' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/solo-games-injections.json', `${JSON.stringify({ record: 'solo-games-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
const provable = record.filter(one => !one.expect);
console.log(`\n${provable.filter(one => one.failed.length).length} of ${provable.length} caught; ${record.length - provable.length} are second locks on a door the route already bolts, and say so. Wrote docs/evidence/solo-games-injections.json`);
