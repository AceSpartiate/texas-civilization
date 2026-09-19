// A family whose student has gone (owner, 2026-09-16, docs/HOST_PAGE.md): "Absent families automatically become npc, but
// may be played again by the player if they return later."
//
// sim/absence.mjs marks the family; the neighbours' director then gives its orders, every question is answered the tick it
// is asked as a family nobody plays answers, nothing of the family's holds the class's calendar, and the moment the student
// is back the family is theirs again with nothing recalled. server/app.mjs decides absence from presence: a stream closed
// for `absentMs` while the class runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ASK_PATIENCE } from '../sim/chores.mjs';
import { closeQuestion, openQuestion, questionOpen } from '../sim/army.mjs';
import { automatic } from '../sim/neighbours.mjs';
import { isAbsent, setAbsent } from '../sim/absence.mjs';
import { createClassroom } from '../server/app.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMinute = (world, minute) => until(world, () => world.minute >= minute);

test('absent is true or absent, only for a played family, written down both ways, and shown to the family and the Host', () => {
  const world = createSettledWorld('absent-mark'); world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  assert.equal(setAbsent(world, household, false), false, 'unmarking a present family changed something');
  assert.equal(setAbsent(world, household, true), true);
  assert.equal(household.absent, true);
  assert.ok(world.events.some(e => e.householdId === 'hh-1' && /goes on by itself/.test(e.text)));
  assert.equal(view(world, 'hh-1').household.absent, true, 'the family is not told it is being run for');
  assert.equal(view(world, undefined, 'host').live.families.find(f => f.id === 'hh-1').absent, true, 'the Host is not told');
  validateWorld(world);
  assert.equal(setAbsent(world, household, false), true);
  assert.equal(household.absent, undefined, 'off is not absent');
  assert.ok(world.events.some(e => e.householdId === 'hh-1' && /back at the screen/.test(e.text)));
  assert.equal(isAbsent(household), false);
  household.absent = false;
  assert.throws(() => validateWorld(world), /absent/);
  household.absent = true; household.played = undefined;
  assert.throws(() => validateWorld(world), /absent/);
});

test('while absent the family is the director\'s, its questions are answered at once and it holds nothing; back, it is the student\'s again', () => {
  const world = createGonzalesWorld('absent-class', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  assert.equal(automatic(world, household), false, 'a played family is automatic');
  setAbsent(world, household, true);
  assert.equal(automatic(world, household), true, 'an absent family is not the director\'s');
  // A hunt that stops to ask is answered the tick it asks, as auto answers.
  until(world, () => household.homeSiteId && household.members.map(id => world.entities[id]).every(p => !p.travel), 600);
  const hunter = household.members.map(id => world.entities[id]).find(p => p.kind === 'person' && (p.age ?? 30) >= 16);
  household.resources.powder = 4;
  try { applyAction(world, 'hh-1', { action: 'chore', entityId: hunter.id, chore: 'hunt-timber' }); } catch { /* the land hunts its own ground on the real land */ }
  if (!hunter.chore) {
    const hunt = (view(world, 'hh-1').work[hunter.id] || []).find(w => w.id === 'hunt-land' && w.can);
    if (hunt) applyAction(world, 'hh-1', { action: 'hunt-land', entityId: hunter.id, x: world.map.sites[household.homeSiteId].x + 0.3, y: world.map.sites[household.homeSiteId].y + 0.3 });
  }
  let asked = 0;
  for (let t = 0; t < 400 && hunter.chore; t++) { stepWorld(world); if (hunter.chore?.ask) asked++; }
  assert.equal(asked, 0, `an absent family's hunt stood asking for ${asked} ticks`);
  // The army's questions are answered the moment they are asked, and never hold the calendar.
  world.army = { members: [hunter.id], questions: {}, phase: 'camped', progress: 0, x: 0, y: 0, camp: 'test' };
  openQuestion(world, 'storm', null);
  assert.ok(['yes', 'no'].includes(world.army.questions.storm.asks[hunter.id]), 'an absent family\'s volunteer was left open');
  assert.equal(questionOpen(world), false);
  closeQuestion(world, 'storm');
  delete world.army;
  // Back: the family is the student's the same tick, nothing recalled.
  setAbsent(world, household, false);
  assert.equal(automatic(world, household), false);
  assert.equal(household.absent, undefined);
  validateWorld(world);
});

test('an absent family does not hold the calendar for a rider, and its hunt by hand is not waited for', () => {
  const world = createGonzalesWorld('absent-hold', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  untilMinute(world, momentOf(world, 'notice') + 1);
  world.director.phase = 'news';
  // Read, not stepped: the clock's own rule (sim/clock.mjs `deciding`) against a conversation standing open.
  world.encounters = { ...(world.encounters || {}), 'enc-test': { id: 'enc-test', status: 'open', householdId: 'hh-1', listenerId: household.members[0], carrierId: 'nobody', lastSpokenMinute: world.minute, said: [] } };
  assert.equal(calendarMinutes(world), 20, 'a present family\'s open conversation did not hold the calendar');
  setAbsent(world, household, true);
  assert.equal(calendarMinutes(world), 60, 'an absent family\'s open conversation held the calendar');
  delete world.encounters['enc-test'];
});

// ---- the server's half
const caller = port => async (path, data, cookie) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};
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

// Waits for something the server does in its own time (a tick, a closed stream noticed) instead of sleeping a guess at how
// long it takes. The limit only turns a hang into the assertion that follows; nothing passes because of it.
async function settle(done, limitMs = 30000) {
  const end = performance.now() + limitMs;
  while (!(await done()) && performance.now() < end) await delay(5);
}

// The grace is measured on the server's clock (`Date.now` in `markAbsences`), and this test holds that clock still and moves
// it by hand, so "inside the grace" and "past it" are exact. It once slept 80 ms against a 150 ms grace and failed under a
// loaded machine (2026-09-18) because the sleep overran. The ticks, the stream and its close stay real and are waited for.
test('the server marks a family absent when its page has been closed for the grace, and present the tick after it opens again', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-absent-'));
  const absentMs = 150;
  const app = createClassroom({ seed: 'absent-server', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 20, absentMs });
  // A whole tick has run since this was called: a commit is a tick here (no order is sent meanwhile), and the revision it
  // raises was read after whatever came before.
  const nextTick = async () => { const from = app.state.revision; await settle(() => app.state.revision > from); };
  const absent = () => app.state.world.households[id].absent;
  let id;
  try {
    const port = await app.listen(0, '127.0.0.1'), call = caller(port);
    const families = await Promise.all(Array.from({ length: 5 }, (_, i) => call('/api/join', { name: `Family ${i}`, code: app.state.sessionCode })));
    const host = await call('/api/host', { key: app.state.hostKey });
    assert.equal((await call('/api/command', { id: 'absent-host-start', action: 'start' }, host.cookie)).status, 200, 'the class did not start');
    const first = families[0];
    id = first.body.world.householdId;
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    const stream = await openStream(port, first.cookie);
    // Open for longer than the grace is still present.
    t.mock.timers.tick(absentMs * 2);
    await nextTick();
    assert.equal(absent(), undefined, 'a family with its page open was marked absent');
    await stream.close();
    let presence;
    await settle(async () => (presence = (await call('/api/state', null, host.cookie)).body.presence?.households?.[id]) === 'away');
    assert.equal(presence, 'away', 'the server never noticed the page close');
    t.mock.timers.tick(absentMs - 1);
    await nextTick();
    assert.equal(absent(), undefined, 'a family was marked absent inside the grace');
    t.mock.timers.tick(1);
    await nextTick();
    assert.equal(absent(), true, 'a family gone past the grace was not marked absent');
    const hostView = await call('/api/state', null, host.cookie);
    assert.equal(hostView.body.presence?.households?.[id], 'absent', 'the Host was not told the family is absent');
    assert.equal(hostView.body.world.live.families.find(f => f.id === id).absent, true);
    // A family that never joined is nobody's and never absent.
    for (const household of Object.values(app.state.world.households)) if (!household.played) assert.equal(household.absent, undefined);
    const again = await openStream(port, first.cookie);
    await nextTick();
    assert.equal(absent(), undefined, 'a family whose page opened again was still absent');
    assert.equal((await call('/api/state', null, host.cookie)).body.presence.households[id], 'here');
    await again.close();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
