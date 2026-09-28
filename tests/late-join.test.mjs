// A class the teacher sizes, and a student who joins after Start (2026-09-28, docs/audits/2026-09-28-classroom.md B1 and
// B2). Until then a class held fifteen families and nobody could change it, and a student late on the first day - or absent
// on it, in a game that takes several class days - was refused for good: "This class has started."
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

function client(port) {
  const jar = new Map();
  const header = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return {
    jar,
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
function openStream(port, cookie) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`stream returned ${response.statusCode}`)); return; }
      response.resume();
      resolve({ close: () => new Promise(done => { request.on('close', () => done()); request.destroy(); }) });
    });
    request.on('error', reject);
  });
}
async function classroom(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-late-'));
  const app = createClassroom({ seed: 'late-join', savePath: join(dir, 'class.json'), tickMs: 40, ...options });
  const port = await app.listen(0, '127.0.0.1');
  const host = client(port);
  await host.call('/api/host', { key: app.state.hostKey });
  const join_ = async name => { const student = client(port); const answer = await student.call('/api/join', { name, code: app.state.sessionCode }); return { student, answer }; };
  return { app, port, host, join: join_, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('the teacher sets the class size in the lobby, up to thirty, and the Host is told how many families there are', async () => {
  const { app, host, join: joinAs, dispose } = await classroom({ playerCount: 5 });
  try {
    assert.equal((await host.call('/api/state')).body.classSize, 5, 'the Host is told the class size');
    for (let i = 0; i < 5; i++) assert.equal((await joinAs(`Student ${i}`)).answer.status, 200);
    const sixth = await joinAs('Student 5');
    assert.equal(sixth.answer.status, 409);
    assert.match(sixth.answer.body.error, /all 5 families have a student.*make the class bigger/);
    // Smaller than the students already joined is refused in words; thirty is allowed; thirty-one is not.
    assert.match((await command(host, 'class-size', { size: 4 })).body.error, /5 to 30/);
    assert.equal((await command(host, 'class-size', { size: 31 })).status, 400);
    const before = app.state.clients;
    assert.equal((await command(host, 'class-size', { size: 30 })).status, 200);
    const state = app.state;
    assert.equal(state.world.playerCount, 30);
    assert.equal(Object.keys(state.world.households).length, 30);
    assert.deepEqual(state.clients, before, 'every student who joined keeps their place');
    for (const client of Object.values(state.clients)) assert.equal(state.world.households[client.householdId].played, true);
    const snap = (await host.call('/api/state')).body;
    assert.equal(snap.classSize, 30);
    assert.notEqual(snap.mapId, snap.sessionId, 'a page drops the map of the families dealt before');
    for (let i = 5; i < 30; i++) assert.equal((await joinAs(`Student ${i}`)).answer.status, 200, `student ${i + 1} of 30 joins`);
    assert.equal(Object.keys(app.state.clients).length, 30);
    assert.equal(new Set(Object.values(app.state.clients).map(client => client.householdId)).size, 30, 'thirty students, thirty families');
    assert.match((await command(host, 'class-size', { size: 29 })).body.error, /30 students have joined/);
    await command(host, 'start');
    assert.match((await command(host, 'class-size', { size: 30 })).body.error, /in the lobby/);
  } finally { await dispose(); }
});

test('a student who joins after Start is given the first family nobody plays, and it is theirs from then on', async () => {
  const { app, host, join: joinAs, dispose } = await classroom({ playerCount: 8 });
  try {
    for (let i = 0; i < 5; i++) await joinAs(`Student ${i}`);
    await command(host, 'start');
    await delay(120);
    assert.equal(app.state.world.status, 'running');
    assert.equal(app.state.world.households['hh-6'].played, undefined, 'hh-6 is the director\'s');
    const late = await joinAs('Latecomer');
    assert.equal(late.answer.status, 200, late.answer.body.error);
    assert.equal(late.answer.body.world.householdId, 'hh-6', 'the first family nobody plays');
    assert.ok(late.answer.body.world.tick > 0, 'into the class already going');
    assert.equal(app.state.world.households['hh-6'].played, true, 'the director never runs it again');
    assert.ok(app.state.world.events.some(event => event.type === 'presence' && /Latecomer joined the class late/.test(event.text)), 'the class is told');
    // Their credential is a student's like any other.
    assert.equal((await late.student.call('/api/state')).body.world.householdId, 'hh-6');
    // While paused as well: day 2 of a class is opened paused.
    await command(host, 'pause');
    assert.equal((await joinAs('Second day')).answer.body.world.householdId, 'hh-7');
    assert.equal((await joinAs('Third')).answer.body.world.householdId, 'hh-8');
    const refused = await joinAs('Nobody left');
    assert.equal(refused.answer.status, 409);
    assert.match(refused.answer.body.error, /Every family in this class already has a student/);
    const stranger = client(app.server.address().port);
    assert.equal((await stranger.call('/api/join', { name: 'Wrong code', code: 'ZZZZZZ' })).status, 403, 'the class code still guards the door');
    await command(host, 'end');
    assert.match((await joinAs('After the end')).answer.body.error, /has ended/);
  } finally { await dispose(); }
});

test('the teacher chooses which family a late student takes: one nobody plays, or one whose student is not here', async () => {
  const { app, port, host, join: joinAs, dispose } = await classroom({ playerCount: 7 });
  const streams = [];
  try {
    const joined = [];
    for (let i = 0; i < 5; i++) joined.push(await joinAs(`Student ${i}`));
    for (const one of joined.slice(0, 4)) streams.push(await openStream(port, one.student.cookie()));
    await command(host, 'start');
    await delay(60);
    const seats = (await host.call('/api/state')).body.seats;
    assert.deepEqual(seats.map(seat => `${seat.householdId}:${seat.kind}`), ['hh-5:student-away', 'hh-6:free', 'hh-7:free'], 'the free families and the one whose student is not here');
    assert.equal(seats[0].student, 'Student 4');
    // A family whose student is here cannot be given away.
    assert.match((await command(host, 'late-seat', { householdId: 'hh-1' })).body.error, /somebody is playing it now/);
    assert.equal((await command(host, 'late-seat', { householdId: 'hh-7' })).status, 200);
    assert.equal((await host.call('/api/state')).body.lateSeat, 'hh-7');
    assert.equal((await joinAs('Chosen')).answer.body.world.householdId, 'hh-7', 'the family the teacher chose');
    assert.equal((await host.call('/api/state')).body.lateSeat, null, 'a choice is used once');
    // Student 4 has not come back on day 2: the teacher gives their family to the student in front of them.
    assert.equal((await command(host, 'late-seat', { householdId: 'hh-5' })).status, 200);
    const taker = await joinAs('New student');
    assert.equal(taker.answer.body.world.householdId, 'hh-5');
    assert.equal((await joined[4].student.call('/api/state')).status, 401, 'the old device is signed out, as a family key does');
    assert.deepEqual(Object.values(app.state.clients).filter(client => client.householdId === 'hh-5').map(client => client.name), ['New student'], 'one student a family');
    assert.ok(app.state.world.events.some(event => event.type === 'presence' && /New student joined the class and is playing .+, which was Student 4's/.test(event.text)));
    // Nothing chosen: the next is the first free family.
    assert.equal((await joinAs('Next')).answer.body.world.householdId, 'hh-6');
  } finally { for (const stream of streams) await stream.close(); await dispose(); }
});
