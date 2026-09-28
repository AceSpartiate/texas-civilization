// A page that loses the server keeps trying and comes back by itself (2026-09-28, docs/audits/2026-09-28-classroom.md B3).
// Until then one failed try after 1.5 s put a student on the join screen for good with a false "no longer joined", and the
// projected Host page likewise. The browser proof is scripts/reconnect-browser-proof.mjs; this is the rule itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reconnector, reconnectWords, RETRY_DELAYS_MS, probeState } from '../public/reconnect.js';
import { classDaysWords, seatLabel, classLine } from '../public/class-panel.js';

/** A reconnector whose waits are run by hand, answering from `answers` in turn. */
function harness(answers) {
  const log = [], waits = [];
  let index = 0;
  const machine = reconnector({
    probe: async () => answers[Math.min(index++, answers.length - 1)],
    connected: body => log.push(['connected', body]),
    signedOut: () => log.push(['signedOut']),
    waiting: tries => log.push(['waiting', tries]),
    wait: (ms, next) => { waits.push({ ms, next }); return waits.length; },
    cancel: () => {},
  });
  const step = async () => { const due = waits.shift(); await due.next(); return due.ms; };
  return { machine, log, waits, step };
}

test('no network, a server down or starting: it keeps trying, further apart and never more than five seconds apart', async () => {
  const { machine, log, step } = harness([{ status: 0 }, { status: 0 }, { status: 503 }, { status: 0 }, { status: 0 }, { status: 0 }, { status: 200, body: { world: { householdId: 'hh-3' } } }]);
  machine.start();
  const gaps = [];
  while (machine.running) gaps.push(await step());
  assert.deepEqual(gaps, [1500, 2000, 3000, 5000, 5000, 5000, 5000], 'every failure is tried again');
  assert.deepEqual(log.filter(([what]) => what !== 'waiting'), [['connected', { world: { householdId: 'hh-3' } }]], 'back to its own family, once, and never the join screen');
  assert.deepEqual(log.filter(([what]) => what === 'waiting').map(([, tries]) => tries), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(RETRY_DELAYS_MS.at(-1), 5000);
});

test('only a 401 is a sign-out; a stop while trying ends it; a second start while trying is the same attempt', async () => {
  const out = harness([{ status: 0 }, { status: 401 }, { status: 401 }, { status: 0 }, { status: 200, body: { sessionId: 'mine' } }]);
  out.machine.start(); out.machine.start();
  assert.equal(out.waits.length, 1, 'one attempt at a time');
  await out.step(); await out.step();
  assert.deepEqual(out.log.filter(([what]) => what !== 'waiting'), [['signedOut']]);
  assert.equal(out.machine.running, false);
  // Signed out, it listens quietly every five seconds: the teacher may open this page's class again, and its cookie with it.
  assert.equal(out.machine.listening, true);
  const quiet = [await out.step(), await out.step(), await out.step()];
  assert.deepEqual(quiet, [5000, 5000, 5000]);
  assert.deepEqual(out.log.filter(([what]) => what !== 'waiting'), [['signedOut'], ['connected', { sessionId: 'mine' }]], 'one sign-out said, then back when the class is');
  assert.equal(out.log.filter(([what]) => what === 'waiting').length, 2, 'and nothing said while it listened');
  assert.equal(out.machine.listening, false);
  const stopped = harness([{ status: 200, body: {} }]);
  stopped.machine.start();
  stopped.machine.stop();
  await stopped.step();
  assert.deepEqual(stopped.log.filter(([what]) => what !== 'waiting'), [], 'a page that connected another way is not connected twice');
});

test('the probe reads a thrown fetch as "not reached", and the words say so plainly', async () => {
  assert.deepEqual(await probeState(async () => { throw new TypeError('Failed to fetch'); }), { status: 0, body: null });
  assert.deepEqual(await probeState(async () => ({ status: 401, ok: false })), { status: 401, body: null });
  assert.equal(reconnectWords({}), 'Connection lost. Reconnecting…');
  assert.match(reconnectWords({ seconds: 25 }), /Still reconnecting \(25 seconds\)/);
  assert.match(reconnectWords({ stopped: true }), /stopped the classroom server.*come back by itself/);
  assert.doesNotMatch(reconnectWords({ stopped: true }), /family key/);
});

test('the page wires it: the stream\'s error starts the reconnector, and the join screen is only its sign-out', () => {
  const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const connect = page.slice(page.indexOf('function connect(snapshot)'), page.indexOf('// Two doors, one at a time.'));
  assert.match(connect, /events\.onerror = \(\) => \{\s*events\?\.close\(\); events = null;\s*reconnect\.start\(\);/);
  assert.doesNotMatch(connect, /showJoin/, 'a broken stream never goes to the join screen by itself');
  assert.match(page, /signedOut: \(\) => showJoin\(/);
  assert.match(page, /api\('\/api\/away'/, 'the list of names is on the page');
  assert.match(page, /api\('\/api\/claim'/, 'and the claim');
});

test('the Host is told the class days at each pace, where the class is, and who a late student could be given', () => {
  const pace = days => ({ days, minutes: [0, 0] });
  const schedule = { period: 1, periods: 3, season: 'the autumn of 1835', share: 0.42, playMinutesADay: 40,
    whole: { study: pace([6, 11]), brisk: pace([3, 5]), quick: pace([1, 2]) }, left: { study: pace([5, 9]), brisk: pace([2, 4]), quick: pace([1, 1]) } };
  const lobby = classDaysWords(schedule, { status: 'lobby', tickMs: 9500 });
  assert.equal(lobby.whole, 'A whole game takes about 6–11 class days at Study (now) · 3–5 at Brisk · 1–2 at Quick, counting 40 minutes of play a day.');
  assert.equal(lobby.where, null);
  const running = classDaysWords(schedule, { status: 'running', tickMs: 4000 });
  assert.equal(running.where, 'Now: the autumn of 1835 (period 1 of 3), about 42% of the way through.');
  assert.equal(running.left, 'Left: about 5–9 class days at Study · 2–4 at Brisk (now) · 1 at Quick.');
  assert.equal(seatLabel({ kind: 'free', family: 'The Ortiz family' }), 'The Ortiz family (nobody\'s)');
  assert.equal(seatLabel({ kind: 'student-away', family: 'Thomas\'s family', student: 'Sam', presence: 'absent' }), 'Thomas\'s family (Sam, absent)');
  assert.equal(classLine({ name: 'Period 2', code: 'A1B2C3', joined: 24, families: 30, status: 'paused', date: 'October 14, 1835', period: 1 }), 'Period 2 · code A1B2C3 · 24 of 30 families joined · paused, October 14, 1835 (period 1)');
});
