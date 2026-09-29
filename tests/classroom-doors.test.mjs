// Getting into a class and staying in it, from the classroom audit of 2026-09-28 (M2, M3, M4) as triaged on 2026-09-29
// (docs/audits/2026-09-29-triage.md 1.8 and 1.9):
//
// - a class code typed with O for 0, or I or L for 1, is the class code (hex codes have none of those letters);
// - a name already in the class is refused at the join, so two students called Sam cannot be told apart on the away list,
//   and a student coming back is never refused by it;
// - a fourth tab of one family lets the oldest go and tells it why, instead of being refused and saying "Reconnecting" for
//   ever; and a page that stops answering the server's ping - a Chromebook put to sleep - is let go, so its student can take
//   the family up at another device at once rather than when TCP gives up.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

function client(port) {
  const jar = new Map();
  const header = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return {
    async call(path, data) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: header() }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      for (const raw of response.headers.getSetCookie()) {
        const [pair] = raw.split(';');
        const index = pair.indexOf('=');
        if (/Max-Age=0/i.test(raw)) jar.delete(pair.slice(0, index)); else jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      return { status: response.status, body: await response.json() };
    },
    cookie: () => header(),
  };
}
const command = (caller, action, extra = {}) => caller.call('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra });

/**
 * An event stream read as a page reads it: every event by name, and whether the server has ended it. `answer` makes it answer
 * each ping as the page does (public/app.js), until `sleep()` stops it - the lid shut, the socket left open.
 */
function openStream(port, cookie, { answer = false } = {}) {
  return new Promise((resolve, reject) => {
    const events = [];
    let awake = answer, ended = false, buffer = '';
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) { response.resume(); resolve({ status: response.statusCode }); return; }
      response.setEncoding('utf8');
      response.on('data', chunk => {
        buffer += chunk;
        let cut;
        while ((cut = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, cut); buffer = buffer.slice(cut + 2);
          const name = /^event: (.*)$/m.exec(block)?.[1] || 'message', data = /^data: (.*)$/m.exec(block)?.[1] ?? '';
          events.push({ name, data });
          if (name === 'ping' && awake) fetch(`http://127.0.0.1:${port}/api/here`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ stream: data }) }).catch(() => {});
        }
      });
      response.on('close', () => { ended = true; });
      resolve({
        status: 200, events,
        get ended() { return ended; },
        sleep() { awake = false; },
        close: () => new Promise(done => { if (ended) { done(); return; } request.on('close', () => done()); request.destroy(); }),
      });
    });
    request.on('error', error => { if (!ended) reject(error); });
  });
}
async function until(check, ms = 3000, what = 'the condition') {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) { if (await check()) return; await delay(20); }
  assert.fail(`timed out waiting for ${what}`);
}

async function classroom(options = {}, { code } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-doors-'));
  const savePath = join(dir, 'class.json');
  const make = () => createClassroom({ seed: 'doors', playerCount: 5, savePath, tickMs: 50, ...options });
  let app = make();
  if (code) {
    // A class whose code has the digits a student mistypes. Codes are dealt at random, so this one is written into the save.
    await app.close();
    const save = JSON.parse(readFileSync(savePath, 'utf8'));
    save.sessionCode = code;
    writeFileSync(savePath, JSON.stringify(save));
    app = make();
  }
  const port = await app.listen(0, '127.0.0.1');
  const host = client(port);
  await host.call('/api/host', { key: app.state.hostKey });
  return { app, port, host, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('a class code typed with O for 0 and I or L for 1 is the class code, at the join, the away list and the claim', async () => {
  const { app, port, dispose } = await classroom({}, { code: 'A0B1C0' });
  try {
    assert.equal(app.state.sessionCode, 'A0B1C0');
    const first = client(port), second = client(port);
    const joined = await first.call('/api/join', { name: 'Ana', code: 'AOBICO' });
    assert.equal(joined.status, 200, `O for 0 and I for 1 at the join: ${joined.body.error}`);
    assert.equal((await second.call('/api/join', { name: 'Ben', code: ' aobLco ' })).status, 200, 'lower case, L for 1 and spaces at the join');
    assert.equal((await client(port).call('/api/join', { name: 'Cal', code: 'A0B1C0' })).status, 200, 'and the code as dealt still opens it');
    // A cart Chromebook with no cookie: the away list and the claim, the code mistyped the same way.
    const stranger = client(port);
    const away = await stranger.call('/api/away', { code: 'AOBLCO' });
    assert.equal(away.status, 200, `the away list: ${away.body.error}`);
    const ana = away.body.families.find(family => family.name === 'Ana');
    assert.ok(ana, 'Ana is on the away list');
    const claimed = await stranger.call('/api/claim', { code: 'aobico', householdId: ana.householdId });
    assert.equal(claimed.status, 200, `the claim: ${claimed.body.error}`);
    assert.equal(claimed.body.world.householdId, joined.body.world.householdId, 'and it is Ana\'s own family');
    // Forgiving look-alikes is not forgiving a wrong code.
    const wrong = await client(port).call('/api/join', { name: 'Dee', code: 'AOBIC8' });
    assert.equal(wrong.status, 403);
    assert.match(wrong.body.error, /Check the class code/);
  } finally { await dispose(); }
});

test('a name already in the class is refused, in any case and spacing, and a student coming back is not', async () => {
  const { app, port, host, dispose } = await classroom();
  try {
    const code = app.state.sessionCode;
    const sam = client(port);
    const first = await sam.call('/api/join', { name: 'Sam', code });
    assert.equal(first.status, 200);
    const again = await client(port).call('/api/join', { name: '  sAM ', code });
    assert.equal(again.status, 409, 'a second Sam was let in');
    assert.equal(again.body.error, 'Sam is taken — add your last initial. If you were already in this class, choose “I was already in this class” and tap your name.');
    assert.equal(Object.keys(app.state.clients).length, 1, 'and no family was dealt to them');
    assert.equal((await client(port).call('/api/join', { name: 'Sam T', code })).status, 200, 'Sam T is another student');
    // Sam's own browser, joining again with the cookie, is Sam: the same family, never refused.
    const back = await sam.call('/api/join', { name: 'Sam', code });
    assert.equal(back.status, 200, back.body.error);
    assert.equal(back.body.world.householdId, first.body.world.householdId);
    // Sam on a cart Chromebook, with only the code: the away list has one Sam, and it is Sam's.
    const cart = client(port);
    const sams = (await cart.call('/api/away', { code })).body.families.filter(family => family.name === 'Sam');
    assert.equal(sams.length, 1);
    const claimed = await cart.call('/api/claim', { code, householdId: sams[0].householdId });
    assert.equal(claimed.status, 200);
    assert.equal(claimed.body.world.householdId, first.body.world.householdId);
    // After Start the teacher gives Sam's own family, Sam being away, to the next student to join: Sam, with no cookie. That
    // is Sam taking their family back, and the name is not refused - the old credential is signed out by the join.
    for (const name of ['Ana', 'Ben', 'Cal']) assert.equal((await client(port).call('/api/join', { name, code })).status, 200);
    assert.equal((await command(host, 'start')).status, 200);
    assert.equal((await command(host, 'late-seat', { householdId: first.body.world.householdId })).status, 200);
    const late = await client(port).call('/api/join', { name: 'sam', code });
    assert.equal(late.status, 200, late.body.error);
    assert.equal(late.body.world.householdId, first.body.world.householdId, 'Sam back in Sam\'s family');
    assert.equal(Object.values(app.state.clients).filter(entry => entry.name.toLowerCase() === 'sam').length, 1, 'and one Sam in the class');
  } finally { await dispose(); }
});

test('a fourth tab of one family lets the oldest go and tells it why, and is never refused', async () => {
  const { app, port, dispose } = await classroom();
  const open = [];
  try {
    const sam = client(port);
    assert.equal((await sam.call('/api/join', { name: 'Sam', code: app.state.sessionCode })).status, 200);
    for (let tab = 0; tab < 3; tab++) { open.push(await openStream(port, sam.cookie(), { answer: true })); await delay(20); }
    const fourth = await openStream(port, sam.cookie(), { answer: true });
    open.push(fourth);
    assert.equal(fourth.status, 200, 'the fourth tab was refused');
    await until(() => open[0].ended, 3000, 'the oldest tab to be let go');
    assert.ok(open[0].events.some(event => event.name === 'replaced'), 'the oldest tab was not told why it was let go');
    await until(() => fourth.events.some(event => event.name === 'message'), 3000, 'the fourth tab to be sent the class');
    await delay(100);
    assert.ok(open.slice(1).every(stream => !stream.ended), 'only the oldest was let go');
    assert.ok(open.slice(1).every(stream => !stream.events.some(event => event.name === 'replaced')));
  } finally { for (const stream of open) await stream.close?.(); await dispose(); }
});

test('a page that stops answering its pings is let go, and its student claims the family at another device', async () => {
  const { app, port, dispose } = await classroom({ streamTimings: { pingMs: 40, staleMs: 200 } });
  const open = [];
  try {
    const code = app.state.sessionCode;
    const sam = client(port), ana = client(port);
    const joined = await sam.call('/api/join', { name: 'Sam', code });
    assert.equal((await ana.call('/api/join', { name: 'Ana', code })).status, 200);
    const chromebook = await openStream(port, sam.cookie(), { answer: true });
    // A stream that never answers - a page from an older build, a measuring script - is never judged by it.
    const bare = await openStream(port, ana.cookie());
    open.push(chromebook, bare);
    // Awake and answering, it is kept however long it stays: the family is being played.
    await delay(500);
    assert.ok(!chromebook.ended, 'a page answering its pings was let go');
    const cart = client(port);
    assert.equal((await cart.call('/api/claim', { code, householdId: joined.body.world.householdId })).status, 409, 'a family being played was taken');
    // The lid shut: the socket stays open, nothing answers.
    chromebook.sleep();
    await until(() => chromebook.ended, 3000, 'the sleeping page to be let go');
    const away = await cart.call('/api/away', { code });
    assert.ok(away.body.families.some(family => family.householdId === joined.body.world.householdId), 'the family is not on the away list');
    const claimed = await cart.call('/api/claim', { code, householdId: joined.body.world.householdId });
    assert.equal(claimed.status, 200, claimed.body.error);
    assert.equal(claimed.body.world.householdId, joined.body.world.householdId);
    assert.ok(!bare.ended, 'a stream that never answered was let go');
  } finally { for (const stream of open) await stream.close(); await dispose(); }
});

test('the page answers the ping and, let go for another tab, says so and stops asking', () => {
  const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(page, /addEventListener\('ping', event => \{\s*fetch\('\/api\/here'[^]*?stream: event\.data/, 'the page does not answer the ping');
  assert.match(page, /addEventListener\('replaced', \(\) => \{\s*events\?\.close\(\); events = null;\s*reconnect\.stop\(\);[^]*?showReplaced\(true\)/, 'the page does not stop asking when it is let go');
  assert.match(html, /<p id="replaced" role="status" hidden><span id="replaced-words"><\/span> <button type="button" id="replaced-here">/);
});
