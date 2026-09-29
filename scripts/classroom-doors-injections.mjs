// The tests for the triage's Tier 1 classroom items (2026-09-29: the pace kept, the class code's look-alikes, one name one
// student, a fourth tab and a page asleep) proved by injection: each regression is put into the tree, the tests are run, and
// exactly the one test that guards it must fail; then the tree is put back. Never run it beside `npm test`: it edits files.
// Run: node scripts/classroom-doors-injections.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = ['tests/classroom-doors.test.mjs', 'tests/pace.test.mjs', 'tests/rejoin.test.mjs', 'tests/late-join.test.mjs', 'tests/reconnect.test.mjs', 'tests/classes.test.mjs'];
const injections = [
  { name: 'the pace is not read back when a class is opened', file: 'server/app.mjs', from: '  if (paceNamed(state.pace)) pace = PACES[state.pace];', to: '', expect: 'the pace the teacher chose comes back' },
  { name: 'Open in Classes ignores the class\'s own pace', file: 'server/app.mjs', from: '              wantedPace = paceNamed(s.pace) ? PACES[s.pace] : tickMs;', to: '', expect: 'each class kept on the computer opens at its own pace' },
  { name: 'the class code compared letter for letter', file: 'server/app.mjs', from: 'const codeMatches = value => readCode(value) === readCode(state.sessionCode);', to: "const codeMatches = value => String(value ?? '').trim().toUpperCase() === state.sessionCode;", expect: 'a class code typed with O for 0' },
  { name: 'a second Sam let in', file: 'server/app.mjs', from: '        if (taken) return json(res, 409,', to: '        if (false) return json(res, 409,', expect: 'a name already in the class is refused' },
  { name: 'a fourth tab refused (429), as before', file: 'server/app.mjs', from: '        for (const old of same.slice(0, Math.max(0, same.length - streamsPerFamily + 1))) replaceStream(old);', to: "        if (same.length >= streamsPerFamily) return json(res, 429, { error: 'Too many open tabs for this household.' });", expect: 'a fourth tab of one family lets the oldest go' },
  { name: 'the oldest tab let go without being told', file: 'server/app.mjs', from: "    try { old.res.write('event: replaced\\ndata: {}\\n\\n'); old.res.end(); }", to: '    try { old.res.end(); }', expect: 'a fourth tab of one family lets the oldest go' },
  { name: 'a page asleep never let go', file: 'server/app.mjs', from: '          if (!solo && stream.answeredAt !== null && Date.now()', to: '          if (false && !solo && stream.answeredAt !== null && Date.now()', expect: 'a page that stops answering its pings is let go' },
  { name: 'the page let go reconnects and takes a stream back', file: 'public/app.js', from: "    events?.close(); events = null;\r\n    reconnect.stop();\r\n    showReconnecting('');", to: "    events?.close(); events = null;\r\n    reconnect.start();\r\n    showReconnecting('');", expect: 'the page answers the ping and, let go for another tab' },
];
const results = [];
for (const injection of injections) {
  const path = join(root, injection.file), original = readFileSync(path, 'utf8');
  // The page's line endings are the checkout's; the anchor is tried as written and with LF.
  const from = original.includes(injection.from) ? injection.from : injection.from.replaceAll('\r\n', '\n');
  const to = from === injection.from ? injection.to : injection.to.replaceAll('\r\n', '\n');
  if (!original.includes(from)) { results.push({ name: injection.name, caught: false, why: 'the anchor is not in the tree' }); continue; }
  writeFileSync(path, original.replace(from, to));
  try {
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: root, encoding: 'utf8', timeout: 600000 });
    const failed = [...new Set([...(run.stdout || '').matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]))];
    const caught = failed.length === 1 && failed[0].startsWith(injection.expect);
    results.push({ name: injection.name, caught, failed });
    console.log(`${caught ? 'CAUGHT' : 'NOT AS EXPECTED'}: ${injection.name} -> ${JSON.stringify(failed)}`);
  } finally { writeFileSync(path, original); }
}
const verdict = results.every(result => result.caught) ? 'PASS' : 'FAIL';
writeFileSync(join(root, 'docs/evidence/classroom-doors-injections.json'), `${JSON.stringify({ record: 'classroom-doors-injections', date: new Date().toISOString().slice(0, 10), verdict, tests: files, results }, null, 2)}\n`.replace(/\n/g, '\r\n'));
console.log(`${results.filter(result => result.caught).length} of ${results.length} injections caught by exactly their own test; ${verdict}`);
process.exitCode = verdict === 'PASS' ? 0 : 1;
