import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

async function eventually(predicate, description, streams = [], timeoutMs = 10000) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    for (const stream of streams) if (stream.failure) throw stream.failure;
    if (predicate()) return;
    await delay(5);
  }
  assert.fail(`Timed out waiting for ${description}`);
}

function openSse(origin, cookie) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let closing = false;
    const stream = { frames: [], jsonBytes: 0, failure: null, close: () => { closing = true; request.destroy(); } };
    const request = http.get(`${origin}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) {
        response.resume(); reject(new Error(`SSE returned HTTP ${response.statusCode}`)); return;
      }
      assert.match(response.headers['content-type'], /text\/event-stream/);
      response.setEncoding('utf8');
      let pending = '';
      response.on('data', chunk => {
        pending += chunk;
        let boundary;
        while ((boundary = pending.indexOf('\n\n')) !== -1) {
          const frame = pending.slice(0, boundary); pending = pending.slice(boundary + 2);
          const data = frame.split('\n').find(line => line.startsWith('data: '));
          if (!data) continue; // Heartbeat comments carry no state.
          try {
            const encoded = data.slice(6);
            const snapshot = JSON.parse(encoded);
            const id = frame.split('\n').find(line => line.startsWith('id: '))?.slice(4);
            assert.equal(Number(id), snapshot.revision, 'SSE ID must name its snapshot revision');
            stream.frames.push({ snapshot, jsonBytes: Buffer.byteLength(encoded) });
            stream.jsonBytes += Buffer.byteLength(encoded);
          } catch (error) { stream.failure = error; }
        }
      });
      response.on('error', error => { if (!closing) stream.failure = error; });
      response.on('end', () => { if (!closing) stream.failure = new Error('SSE closed unexpectedly'); });
      resolved = true; resolve(stream);
    });
    request.on('error', error => {
      if (closing) return;
      if (resolved) stream.failure = error; else reject(error);
    });
  });
}

test('capacity: 30 HTTP households retain isolated identity and receive ordered SSE ticks', { timeout: 30000 }, async t => {
  const directory = mkdtempSync(join(tmpdir(), 'texas-capacity-'));
  const streams = [];
  const playerCount = 30;
  const tickMs = 25;
  let app;
  const startedAt = performance.now();
  try {
    app = createClassroom({ seed: 'capacity-regression', playerCount, tickMs, savePath: join(directory, 'classroom.json') });
    const port = await app.listen(0, '127.0.0.1');
    const origin = `http://127.0.0.1:${port}`;
    const call = async (path, data, cookie) => {
      const response = await fetch(`${origin}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    };
    const host = await call('/api/host', { key: app.state.hostKey });
    assert.equal(host.status, 200);

    // Dispatch every join before awaiting any. Names are labels, never credentials.
    const joinStartedAt = performance.now();
    const clients = await Promise.all(Array.from({ length: playerCount }, () => call('/api/join', {
      name: 'Shared classroom display name', code: app.state.sessionCode,
    })));
    const joinElapsedMs = performance.now() - joinStartedAt;
    assert.ok(clients.every(client => client.status === 200));
    assert.ok(clients.every(client => /^tr_student_[a-f0-9]{12}=[a-f0-9]{48}$/.test(client.cookie)));
    assert.equal(new Set(clients.map(client => client.cookie)).size, playerCount);
    assert.equal(new Set(clients.map(client => client.body.world.householdId)).size, playerCount);
    assert.equal(new Set(clients.map(client => client.body.sessionId)).size, 1);
    assert.equal(Object.keys(app.state.clients).length, playerCount);
    assert.equal(new Set(Object.values(app.state.clients).map(client => client.name)).size, 1);

    const fullState = app.state;
    const overflow = await call('/api/join', { name: 'One extra household', code: fullState.sessionCode });
    assert.equal(overflow.status, 409);
    assert.match(overflow.body.error, /full/i);
    assert.equal(overflow.cookie, undefined);
    assert.deepEqual(app.state, fullState, 'Rejected join must allocate no identity or entity');

    // This is the HTTP refetch a refreshing page performs; it is not a browser test.
    const refreshed = await Promise.all(clients.map(client => call('/api/state', null, client.cookie)));
    refreshed.forEach((result, index) => {
      assert.equal(result.status, 200);
      assert.equal(result.body.sessionId, clients[index].body.sessionId);
      assert.equal(result.body.world.householdId, clients[index].body.world.householdId);
      assert.deepEqual(result.body.world.household.members, clients[index].body.world.household.members);
    });
    const rejoined = await call('/api/join', { name: 'Changed display name', code: fullState.sessionCode }, clients[0].cookie);
    assert.equal(rejoined.status, 200);
    assert.equal(rejoined.body.world.householdId, clients[0].body.world.householdId);
    assert.equal(Object.keys(app.state.clients).length, playerCount);
    assert.equal((await call('/api/state', null, 'tr_student=unissued-credential')).status, 401);

    await Promise.all(clients.map(async client => { streams.push(await openSse(origin, client.cookie)); }));
    await eventually(() => streams.length === playerCount && streams.every(stream => stream.frames.at(-1)?.snapshot.connected === playerCount), '30 simultaneously open SSE clients', streams);
    const streamHouseholds = new Set(streams.map(stream => stream.frames.at(-1).snapshot.world.householdId));
    assert.equal(streamHouseholds.size, playerCount);
    const ticksStartedAt = performance.now();
    assert.equal((await call('/api/command', { id: 'capacity-host-start', action: 'start' }, host.cookie)).status, 200);

    const ownPrincipal = clients[0].body.world.household.principalId;
    const otherPrincipal = clients[1].body.world.household.principalId;
    const spoofTravel = await call('/api/command', {
      id: 'capacity-spoof-travel', action: 'travel', entityId: otherPrincipal, destination: 'gonzales',
      householdId: clients[1].body.world.householdId, role: 'host',
    }, clients[0].cookie);
    assert.equal(spoofTravel.status, 400);
    assert.equal(app.state.world.entities[otherPrincipal].travel, null);
    const spoofControl = await call('/api/command', {
      id: 'capacity-spoof-pause', action: 'pause', entityId: ownPrincipal, role: 'host',
    }, clients[0].cookie);
    assert.equal(spoofControl.status, 400);
    assert.equal(app.state.world.status, 'running');
    assert.equal((await call('/api/command', { id: 'capacity-anonymous-pause', action: 'pause' })).status, 401);
    assert.ok(Object.values(app.state.clients).every(client => !client.commands.includes('capacity-spoof-travel') && !client.commands.includes('capacity-spoof-pause')));

    await eventually(() => streams.every(stream => new Set(stream.frames.map(frame => frame.snapshot.world.tick).filter(tick => tick > 0)).size >= 10), 'at least 10 authoritative ticks on every client', streams);
    const tenTicksElapsedMs = performance.now() - ticksStartedAt;
    for (const stream of streams) {
      const ticks = [...new Set(stream.frames.map(frame => frame.snapshot.world.tick).filter(tick => tick > 0))];
      assert.deepEqual(ticks, Array.from({ length: ticks.at(-1) }, (_, index) => index + 1), 'Each client receives every sequential tick without gaps');
      const revisions = stream.frames.map(frame => frame.snapshot.revision);
      assert.ok(revisions.every((revision, index) => index === 0 || revision >= revisions[index - 1]), 'Snapshot revisions never go backwards');
      const householdId = stream.frames[0].snapshot.world.householdId;
      assert.ok(stream.frames.every(frame => frame.snapshot.world.householdId === householdId), 'A stream must never switch households');
    }

    assert.equal((await call('/api/command', { id: 'capacity-host-pause', action: 'pause' }, host.cookie)).status, 200);
    const pausedTick = app.state.world.tick;
    await eventually(() => streams.every(stream => stream.frames.at(-1)?.snapshot.world.status === 'paused' && stream.frames.at(-1).snapshot.world.tick === pausedTick), 'pause reaches all 30 clients', streams);
    const pausedFrameCounts = streams.map(stream => stream.frames.length);
    const pauseStartedAt = performance.now();
    await delay(tickMs * 6);
    assert.equal(app.state.world.tick, pausedTick, 'Pause freezes authoritative ticks');
    streams.forEach((stream, index) => {
      assert.equal(stream.frames.at(-1).snapshot.world.tick, pausedTick);
      assert.ok(stream.frames.slice(pausedFrameCounts[index]).every(frame => frame.snapshot.world.tick === pausedTick));
    });
    const pausedStates = await Promise.all(clients.map(client => call('/api/state', null, client.cookie)));
    assert.ok(pausedStates.every(result => result.status === 200 && result.body.world.tick === pausedTick && result.body.world.status === 'paused'));
    const pauseObservedMs = performance.now() - pauseStartedAt;
    const pausedRevision = app.state.revision;
    const replay = await call('/api/command', { id: 'capacity-host-pause', action: 'pause' }, host.cookie);
    assert.equal(replay.status, 200);
    assert.equal(replay.body.duplicate, true);
    assert.equal(app.state.revision, pausedRevision, 'Idempotent request replay must not commit again');
    assert.equal((await call('/api/command', { id: 'capacity-host-resume', action: 'resume' }, host.cookie)).status, 200);
    await eventually(() => streams.every(stream => stream.frames.at(-1).snapshot.world.tick >= pausedTick + 2), 'all clients receive resumed ticks', streams);

    const firstRunningBytes = streams.map(stream => stream.frames.find(frame => frame.snapshot.world.tick === 1).jsonBytes);
    const round = value => Math.round(value * 100) / 100;
    const evidence = {
      status: 'PASS',
      recordedAtUtc: new Date().toISOString(),
      command: 'node --test tests/capacity.test.mjs',
      evidenceKind: 'Single-process automated HTTP/SSE transport test on loopback; no browser or independent device involved.',
      limits: ['Does not validate a physical LAN or district Wi-Fi.', 'Observed timing and bytes are measurements of this run, not throughput or classroom-readiness promises.', 'Payload sizes include JSON snapshot bodies only; HTTP/SSE framing and transport overhead are excluded.'],
      environment: { node: process.version, platform: process.platform, architecture: process.arch },
      configuration: { seed: 'capacity-regression', playerCount, requestedTickIntervalMs: tickMs, persistentSave: 'Temporary local file', bind: '127.0.0.1', port: 'OS-assigned ephemeral port' },
      assertions: { simultaneousJoins: playerCount, distinctCredentials: playerCount, distinctHouseholds: playerCount, sameDisplayNameAllowed: true, extraJoinStatus: overflow.status, refreshIdentityContinuity: true, rejoinWithoutAllocation: true, spoofedEntityRejected: true, spoofedHostControlRejected: true, openSseStreams: streams.length, minimumSequentialTicksPerStream: Math.min(...streams.map(stream => new Set(stream.frames.map(frame => frame.snapshot.world.tick).filter(tick => tick > 0)).size)), pausedTick, pauseFrozenForAllClients: true, hostCommandReplayIdempotent: true, resumeReachedAllClients: true },
      observedTimingMs: { joinBatch: round(joinElapsedMs), startToTenTicksOnAllClients: round(tenTicksElapsedMs), pauseObservation: round(pauseObservedMs), fullScenarioBeforeCleanup: round(performance.now() - startedAt) },
      observedSnapshotPayloadBytes: { oneTickAcrossAllClients: firstRunningBytes.reduce((sum, bytes) => sum + bytes, 0), smallestClientAtTickOne: Math.min(...firstRunningBytes), largestClientAtTickOne: Math.max(...firstRunningBytes), totalAcrossReceivedSnapshots: streams.reduce((sum, stream) => sum + stream.jsonBytes, 0), receivedSnapshotCount: streams.reduce((sum, stream) => sum + stream.frames.length, 0) },
    };
    if (process.env.WRITE_CAPACITY_EVIDENCE === '1') {
      const evidencePath = fileURLToPath(new URL('../docs/evidence/capacity.json', import.meta.url));
      mkdirSync(dirname(evidencePath), { recursive: true });
      writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    }
    t.diagnostic(`30 HTTP/SSE clients passed; first-tick payload ${evidence.observedSnapshotPayloadBytes.oneTickAcrossAllClients} JSON bytes total; 10 ticks reached all clients in ${round(tenTicksElapsedMs)} ms (observed only).`);
  } finally {
    for (const stream of streams) stream.close();
    try { if (app) await app.close(); }
    finally {
      const resolvedDirectory = realpathSync(directory);
      assert.equal(dirname(resolvedDirectory), realpathSync(tmpdir()));
      assert.ok(basename(resolvedDirectory).startsWith('texas-capacity-'));
      rmSync(resolvedDirectory, { recursive: true, force: true });
    }
  }
});
