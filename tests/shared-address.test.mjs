// Behind a district's shared address (triage 2.15, classroom audit M8, 2026-09-29): every device in the room reaches the teacher's
// laptop from one address, so a count of wrong tries per address meant five wrong codes from anybody locked the whole room out of
// the three doors back in (the family key, the away list, the claim) for 30 s. The count is now each browser's own, by a cookie
// it is given with its first wrong try, and brute force stays expensive: a script that drops or invents the cookie meets a count
// per address that a right answer never clears. Every request here comes from 127.0.0.1, which is the shared address.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';

async function room(run) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-shared-address-'));
  const app = createClassroom({ seed: 'shared-address', savePath: join(dir, 'save.json'), tickMs: 10000 });
  const port = await app.listen(0, '127.0.0.1');
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(data) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    for (let i = 0; i < 5; i++) await call('/api/join', { name: `Student ${i}`, code: app.state.sessionCode });
    await run({ app, call });
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
}
/** A browser: keeps the door's cookie once it is given one, as a real one does. */
const browser = call => {
  let door = null;
  return async (path, data) => { const answer = await call(path, data, door); if (answer.cookie?.startsWith('tr_door=')) door = answer.cookie; return answer; };
};

test('one student mistyping five times waits; the rest of the room behind the same address comes back at once', async () => {
  await room(async ({ app, call }) => {
    const mistyper = browser(call), classmate = browser(call);
    for (let tries = 0; tries < 5; tries++) assert.equal((await mistyper('/api/away', { code: 'WRONG1' })).status, 403);
    const shut = await mistyper('/api/away', { code: app.state.sessionCode });
    assert.equal(shut.status, 429, 'the student who mistyped waits, even with the right code now');
    assert.match(shut.body.error, /Too many tries\. Wait \d+ seconds/);
    const back = await classmate('/api/away', { code: app.state.sessionCode });
    assert.equal(back.status, 200, 'a classmate on another Chromebook, same address, is not locked out');
    assert.equal(back.body.families.length, 5);
    // The classmate's own count is theirs: a wrong try of their own is a plain refusal, not the mistyper's wait.
    assert.equal((await classmate('/api/claim', { code: 'WRONG1', householdId: 'hh-1' })).status, 403);
    assert.equal((await classmate('/api/rejoin', { key: '22222222' })).status, 403, 'and the family key door the same');
  });
});

test('a right answer clears only its own device, and a malformed cookie is a new device, not a way round the count', async () => {
  await room(async ({ app, call }) => {
    const one = browser(call);
    for (let tries = 0; tries < 4; tries++) assert.equal((await one('/api/away', { code: 'WRONG2' })).status, 403);
    assert.equal((await one('/api/away', { code: app.state.sessionCode })).status, 200, 'the fifth try right');
    for (let tries = 0; tries < 5; tries++) assert.equal((await one('/api/away', { code: 'WRONG2' })).status, 403, 'counted again from nothing');
    assert.equal((await one('/api/away', { code: 'WRONG2' })).status, 429);
    const forged = await call('/api/away', { code: 'WRONG2' }, 'tr_door=not-a-door');
    assert.equal(forged.status, 403, 'a cookie the server never gave is ignored');
    assert.match(forged.cookie || '', /^tr_door=[0-9a-f]{32}$/, 'and a real one is given in its place');
  });
});

test('brute force stays expensive: a script that drops its cookie meets the address\'s count, which a right code never clears', async () => {
  await room(async ({ app, call }) => {
    // Every try without a cookie is a new device, so only the address counts it.
    let first429 = null;
    for (let tries = 1; tries <= 101 && !first429; tries++) {
      const answer = await call('/api/rejoin', { key: `${String(tries).padStart(8, '2').replace(/[^2-9]/g, '3')}` });
      if (answer.status === 429) first429 = tries;
      else if (tries % 10 === 0 && tries < 100) assert.equal((await call('/api/away', { code: app.state.sessionCode })).status, 200, 'the right class code, from the same address, between guesses');
    }
    assert.equal(first429, 101, 'the hundred-and-first wrong try from one address in half a minute is refused');
    const fresh = await call('/api/away', { code: app.state.sessionCode });
    assert.equal(fresh.status, 429, 'and while it lasts the doors are shut to that address: knowing the class code reset nothing');
    assert.match(fresh.body.error, /Too many tries/);
  });
});
