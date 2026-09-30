// The tests and proofs for branch tier2-classroom (2026-09-29: the triage's 1.6 orders pressed together, 1.8 the join address
// and its QR code, 2.13 suggested places and Enter on the map, 2.15 wrong tries counted per device) proved by injection: each
// regression is put into the tree, the tests are run, and exactly the tests that guard it must fail - at least one, and none
// that do not guard it; then the tree is put back. Never run it beside `npm test` or a browser proof: it edits files.
// Run: node scripts/tier2-classroom-injections.mjs [--no-browser]
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = ['tests/order-batch.test.mjs', 'tests/shared-address.test.mjs', 'tests/rejoin.test.mjs', 'tests/suggest.test.mjs', 'tests/qr.test.mjs'];
const BATCH = 'thirty orders pressed together', REFUSED = 'an order refused in the middle of a batch', TIMER = 'orders are shown by a timer';
const ROOM = 'one student mistyping five times waits', OWN = 'a right answer clears only its own device', FORCE = 'brute force stays expensive';
const SITES = 'house sites: up to three', ACRES = 'ten acres to survey', PLOTS = 'plots to clear and to fence', ROUTE = 'the server offers them to the family';
const BITS = 'every reference code is made bit for bit', MASK = 'the mask chosen by itself';
const injections = [
  // 1.6
  { name: 'orders made one at a time, not gathered', file: 'server/app.mjs', from: '    orderQueue.push({ identity, input, res });\n    orderDrain ??= setImmediate(drainOrders);', to: '    makeOrders([{ identity, input, res }], now());', expect: [BATCH] },
  { name: 'one refused order refuses its whole batch', file: 'server/app.mjs', from: "      if (list.length === 1) { answerOrder(list[0], error.status || 400, { error: error.message }); return; }", to: "      for (const order of list) answerOrder(order, error.status || 400, { error: error.message }); return;", expect: [BATCH], allow: [REFUSED] },
  { name: 'a refused batch not put back before it is made again', file: 'server/app.mjs', from: '    catch (error) { restore(committed); throw error; }', to: '    catch (error) { throw error; }', expect: [BATCH], allow: [REFUSED] },
  { name: 'an order shown from inside its own commit', file: 'server/app.mjs', from: "    if (when === 'order') broadcastSoon(actors); else broadcast(actor);", to: '    broadcast(actor);', expect: [BATCH] },
  { name: 'the gap counted from the start of the last broadcast', file: 'server/app.mjs', from: 'Math.max(0, lastEnded + Math.max(gap, lastTookMs) - now)', to: 'Math.max(0, lastEnded - lastTookMs + gap - now)', expect: [TIMER] },
  // 2.15
  { name: 'wrong tries counted per address again', file: 'server/app.mjs', from: "    if (sent && /^[0-9a-f]{32}$/.test(sent)) return { id: sent, fresh: false, address: req.socket.remoteAddress || 'unknown' };\n    return { id: randomBytes(16).toString('hex'), fresh: true,", to: "    return { id: req.socket.remoteAddress || 'unknown', fresh: false,", expect: [ROOM], allow: [OWN, FORCE, 'guessing keys becomes expensive'] },
  { name: 'no count behind the cookie: a script that drops it guesses freely', file: 'server/app.mjs', from: '    if (room && room.count >= ADDRESS_TRIES) return wait(REJOIN_COOLDOWN_MS - (now - room.since));', to: '', expect: [FORCE] },
  { name: "a right answer clears the address's count too", file: 'server/app.mjs', from: '  const clearRejoinTries = door => rejoinTries.delete(door.id);', to: '  const clearRejoinTries = door => { rejoinTries.delete(door.id); addressTries.delete(door.address); };', expect: [FORCE] },
  // 2.13
  { name: 'nothing suggested to survey', file: 'sim/suggest.mjs', from: "  if (job === 'survey-plot') return surveySuggestions(world, household);", to: "  if (job === 'survey-plot') return [];", expect: [ACRES, PLOTS] },
  { name: 'a site suggested without laying its lane', file: 'sim/suggest.mjs', from: '    const facts = siteFactsFor(world, household, spot);', to: '    const facts = { ...spot.facts, words: undefined };', expect: [SITES] },
  { name: 'a plot offered whatever the work says of it', file: 'sim/suggest.mjs', from: '    .filter(one => one.facts.can)\n', to: '\n', expect: [PLOTS] },
  { name: "the route answers without a family's land", file: 'server/app.mjs', from: "        if (!identity.householdId) return json(res, 403, { error: 'Only a family chooses places on its land.' });", to: '', expect: [ROUTE] },
  // 1.8
  { name: "the QR code's blocks not interleaved", file: 'public/qr.js', from: '    blocks.forEach((block, j) => { if (i !== shortLength - eccLength || j >= shortBlocks) sequence.push(block[i]); });', to: '    blocks.forEach(block => { if (block[i] !== undefined) sequence.push(block[i]); });', expect: [BITS], allow: [MASK] },
  { name: "the QR code's format written without its mask", file: 'public/qr.js', from: '  applyMask(chosen); drawFormat(chosen);\n  return modules;', to: '  applyMask(chosen); drawFormat(0);\n  return modules;', expect: [BITS, MASK] },
];
const browser = [
  { name: 'the join card shut in the lobby', file: 'public/app.js', from: "  const open = joinCardOpen ?? snapshot.world.status === 'lobby';", to: '  const open = joinCardOpen ?? false;', script: 'test:join-card' },
  // Since 2026-09-30 the class code is inside the address (`/<code>`), and the QR code is that same address.
  { name: 'the QR code without the class code', file: 'public/app.js', from: '  try { $(\'#join-qr\').innerHTML = qrSvg(plain, { label: `QR code for ${plain}` }); }', to: '  try { $(\'#join-qr\').innerHTML = qrSvg(address, { label: `QR code for ${plain}` }); }', script: 'test:join-card' },
  { name: 'the join address without the class code', file: 'public/app.js', from: "  const coded = url => `${url.replace(/\\/$/, '')}${code ? `/${code}` : ''}`;", to: "  const coded = url => url.replace(/\\/$/, '');", script: 'test:join-card' },
  { name: 'no suggested places on the page', file: 'public/app.js', from: "  if (!SUGGESTED_JOBS.has(job)) { root.hidden = true; suggestedFocus = false; return; }", to: '  { root.hidden = true; suggestedFocus = false; return; }', script: 'test:keyboard-farm' },
  { name: 'Enter on the map does nothing', file: 'public/app.js', from: "    if ((event.key === 'Enter' || event.key === ' ') && (siteLooking() || surveyLooking() || housePlacement)) {", to: '    if (false) {', script: 'test:keyboard-farm' },
];

/** Put `from` in place of `to` in `file`, whatever the checkout's line endings, run `run`, and put the file back. */
function injected(injection, run) {
  const path = join(root, injection.file), original = readFileSync(path, 'utf8');
  const crlf = original.includes('\r\n');
  const from = crlf ? injection.from.replaceAll('\n', '\r\n') : injection.from, to = crlf ? injection.to.replaceAll('\n', '\r\n') : injection.to;
  if (!original.includes(from)) return { name: injection.name, caught: false, why: 'the anchor is not in the tree' };
  writeFileSync(path, original.replace(from, to));
  try { return run(); } finally { writeFileSync(path, original); }
}

const results = [];
// --only <words>: just the injections whose names include them (to see one again after a change).
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
for (const injection of injections.filter(one => !only || one.name.includes(only))) {
  const result = injected(injection, () => {
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { cwd: root, encoding: 'utf8', timeout: 900000 });
    const failed = [...new Set([...(run.stdout || '').matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]))];
    const guards = [...injection.expect, ...(injection.allow || [])];
    const caught = injection.expect.every(name => failed.some(one => one.startsWith(name))) && failed.every(one => guards.some(name => one.startsWith(name)));
    return { name: injection.name, caught, failed };
  });
  results.push(result);
  console.log(`${result.caught ? 'CAUGHT' : 'NOT AS EXPECTED'}: ${injection.name} -> ${JSON.stringify(result.failed || result.why)}`);
}
if (!process.argv.includes('--no-browser')) {
  for (const injection of browser.filter(one => !only || one.name.includes(only))) {
    const result = injected(injection, () => {
      const run = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', injection.script], { cwd: root, encoding: 'utf8', timeout: 900000, shell: process.platform === 'win32' });
      const caught = run.status !== 0;
      const said = `${run.stdout || ''}${run.stderr || ''}`.split(/\r?\n/).filter(line => /Error|Timeout|assert/i.test(line)).slice(0, 2).join(' | ').slice(0, 300);
      return { name: injection.name, caught, proof: injection.script, failed: said };
    });
    results.push(result);
    console.log(`${result.caught ? 'CAUGHT' : 'NOT AS EXPECTED'}: ${injection.name} (${injection.script}) -> ${result.failed || result.why}`);
  }
}
const verdict = results.every(result => result.caught) ? 'PASS' : 'FAIL';
writeFileSync(join(root, 'docs/evidence/tier2-classroom-injections.json'), `${JSON.stringify({ record: 'tier2-classroom-injections', date: new Date().toISOString().slice(0, 10), verdict, tests: files, results }, null, 2)}\n`);
console.log(`${results.filter(result => result.caught).length} of ${results.length} injections caught by the tests that guard them; ${verdict}`);
process.exitCode = verdict === 'PASS' ? 0 : 1;
