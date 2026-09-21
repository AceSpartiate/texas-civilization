// The regressions the come-back-by-name tests guard (tests/rejoin.test.mjs, the last two), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection replaces one exact piece of
// server/app.mjs with the mistake a test is written against, runs the test file, records which tests failed, and puts
// the file back byte for byte.
//
// Run: node scripts/comeback-injections.mjs  → writes docs/evidence/comeback-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/rejoin.test.mjs'];
const FILE = 'server/app.mjs';
const INJECTIONS = [
  {
    name: 'the away list names families a student is sitting in front of, so a classmate can take one',
    from: '          .filter(client => client.householdId && !here.has(client.householdId))',
    to: '          .filter(client => client.householdId)',
  },
  {
    name: 'a family being played can be claimed out from under the student holding it',
    from: "        if (streaming().has(client.householdId)) return json(res, 409, { error: 'Someone is already playing that family. If that is you on another device, close it there first.' });\n        const credential = token();\n        commit(s => {",
    to: '        const credential = token();\n        commit(s => {',
  },
  {
    name: 'anybody on the network may read the class\'s away list without the class code',
    from: "        if (asked.code !== state.sessionCode) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }\n        clearRejoinTries(address);\n        const here = streaming();",
    to: '        const here = streaming();',
  },
  {
    name: 'anybody on the network may claim a family without the class code',
    from: "        if (asked.code !== state.sessionCode) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }\n        const found = Object.entries(state.clients).find(([, client]) => client.householdId === asked.householdId);",
    to: '        const found = Object.entries(state.clients).find(([, client]) => client.householdId === asked.householdId);',
  },
  {
    name: 'the away list hands out family keys as well as names',
    from: '          .map(client => ({ householdId: client.householdId, name: client.name, family: householdName(state.world, state.world.households[client.householdId]) }))',
    to: '          .map(client => ({ householdId: client.householdId, name: client.name, familyKey: familyKey(client.householdId), family: householdName(state.world, state.world.households[client.householdId]) }))',
  },
  {
    name: 'the list gives ids and not the name the student typed, which is the one thing they know',
    from: '          .map(client => ({ householdId: client.householdId, name: client.name, family: householdName(state.world, state.world.households[client.householdId]) }))',
    to: '          .map(client => ({ householdId: client.householdId, name: client.householdId, family: householdName(state.world, state.world.households[client.householdId]) }))',
  },
  {
    name: 'coming back sets no cookie, so the very next request is a stranger again',
    from: "        res.setHeader('Set-Cookie', setCookie(studentCookie(), credential, 604800));\n        return json(res, 200, snapshot({ role: 'student', ...state.clients[hash(credential)] }));\n      }\n      const identity = identify(req);",
    to: "        return json(res, 200, snapshot({ role: 'student', ...state.clients[hash(credential)] }));\n      }\n      const identity = identify(req);",
  },
  {
    name: 'the old device keeps the family too, so two students hold one ledger',
    from: '          const record = s.clients[previousHash];\n          delete s.clients[previousHash];\n          s.clients[hash(credential)] = record;',
    to: '          s.clients[hash(credential)] = s.clients[previousHash];',
  },
  {
    name: 'the teacher is never told that a family moved to another device',
    from: '          tellClass(s.world, `${client.name} came back to the class on another device.`);',
    to: '',
  },
  {
    name: 'the teacher is told privately, where the Host page cannot see it',
    from: "  const tellClass = (world, text) => record(world, 'presence', { visibility: 'public', importance: 2, claimId: 'FIC-GONZ-186', text });",
    to: "  const tellClass = (world, text) => record(world, 'presence', { importance: 2, claimId: 'FIC-GONZ-186', text });",
  },
  {
    name: 'a wrong class code costs nothing, so the away list can be scraped by trying codes',
    from: "        if (asked.code !== state.sessionCode) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }\n        clearRejoinTries(address);\n        const here = streaming();",
    to: "        if (asked.code !== state.sessionCode) return json(res, 403, { error: 'Check the class code on the Host screen.' });\n        const here = streaming();",
    expect: 'may pass: these tests try a wrong code once, and the cooldown bites at five',
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
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed, ...(injection.expect && { expect: injection.expect }) });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/comeback-injections.json', `${JSON.stringify({ record: 'comeback-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/comeback-injections.json`);
