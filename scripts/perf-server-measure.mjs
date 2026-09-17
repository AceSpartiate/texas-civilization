// What the classroom server costs per tick, and what it sends (docs/PERFORMANCE_SERVER.md).
//
// Owner, 2026-09-17: "exceptionally laggy ... There's no way it'll work on the student chromebooks right? Or is the server
// doing some of the heavy work for that?" This answers the server's half with numbers from a real `createClassroom`.
//
// Two classes on the real land of the colonies, each played forward by the simulation alone to four points in the game:
//   solo  - 15 families (the launcher's default), one student page and the Host page open, as Play Solo is played;
//   class - 30 families (the largest class), 30 student pages and the Host page open.
// Every family is run by the neighbours' director, as if every student had put their whole family on auto: it keeps the
// world growing as a played one does (houses, events, the army) and makes the step an upper bound, because a family a
// student plays thinks nothing on the server. At each point the world is written as a save with its students already
// joined, a real classroom opens it, real event streams connect from a worker thread (so their parsing is not the
// server's time), and the server's own `timings` record splits each tick into step / clone / validate / save /
// project / stringify. Event-loop delay and utilisation are the main thread's own.
//
// Run: node scripts/perf-server-measure.mjs [--label before] [--ticks 12] [--only solo|class] [--busy 1]
//   --busy N   N extra threads spinning in this process while it measures - a stand-in for the browser sharing a weak
//              laptop with the Play Solo server. Hold the whole process to two logical processors from PowerShell:
//                $p = Start-Process node -ArgumentList 'scripts/perf-server-measure.mjs','--busy','1' -PassThru -NoNewWindow
//                $p.ProcessorAffinity = [IntPtr]3; $p.WaitForExit()
//              (set PERF_AFFINITY to a note of what was done; it is recorded with the results).
// Writes docs/evidence/perf-server-<label>.json. Same computer only: no classroom Wi-Fi, no Chromebook.
import { isMainThread, Worker, workerData, parentPort } from 'node:worker_threads';
import http from 'node:http';

if (!isMainThread && workerData.role === 'busy') { for (;;) Math.sqrt(Math.random()); }
if (!isMainThread && workerData.role === 'clients') {
  // One event stream per page. Counts the bytes of each `data:` line and how many arrived, per role.
  const stats = {};
  const requests = [];
  for (const client of workerData.clients) {
    const role = client.role;
    stats[role] ??= { messages: 0, bytes: 0, max: 0 };
    let buffer = '';
    const req = http.get({ host: '127.0.0.1', port: workerData.port, path: '/api/events', headers: { Cookie: client.cookie } }, res => {
      res.setEncoding('utf8');
      res.on('data', chunk => {
        buffer += chunk;
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const message = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          const data = message.split('\n').find(line => line.startsWith('data: '));
          if (!data) continue;
          JSON.parse(data.slice(6));
          stats[role].messages++; stats[role].bytes += data.length - 6; stats[role].max = Math.max(stats[role].max, data.length - 6);
        }
      });
    });
    req.on('error', () => {});
    requests.push(req);
  }
  parentPort.on('message', message => {
    // Every student sends one order at the same moment, as a class does when the teacher says "go".
    if (message?.burst) {
      const started = performance.now();
      Promise.all(message.burst.map(({ cookie, body }) => new Promise(resolve => {
        const data = JSON.stringify(body);
        const req = http.request({ host: '127.0.0.1', port: workerData.port, path: '/api/command', method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
          res.resume(); res.on('end', () => resolve({ status: res.statusCode, ms: performance.now() - started }));
        });
        req.on('error', () => resolve({ status: 0, ms: performance.now() - started }));
        req.end(data);
      }))).then(answers => parentPort.postMessage({ answers }));
      return;
    }
    if (message === 'reset') { for (const one of Object.values(stats)) Object.assign(one, { messages: 0, bytes: 0, max: 0 }); parentPort.postMessage('reset'); }
    if (message === 'stats') parentPort.postMessage(structuredClone(stats));
    if (message === 'close') { for (const req of requests) req.destroy(); parentPort.postMessage('closed'); }
  });
  parentPort.postMessage('ready');
}

if (isMainThread) {
  const { createHash, randomBytes } = await import('node:crypto');
  const { mkdtempSync, rmSync, statSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { tmpdir, cpus } = await import('node:os');
  const { join } = await import('node:path');
  const { monitorEventLoopDelay, performance } = await import('node:perf_hooks');
  const { createClassroom } = await import('../server/app.mjs');
  const { writeSave } = await import('../server/storage.mjs');
  const { createGonzalesWorld } = await import('../sim/gonzales.mjs');
  const { stepWorld } = await import('../sim/world.mjs');
  const { beginNextPeriod, periodOf } = await import('../sim/periods.mjs');

  const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
  const label = arg('label', 'measure');
  const TICKS = Number(arg('ticks', 12));
  const only = arg('only', null);
  const busy = Number(arg('busy', 0));
  const round = value => Math.round(value * 100) / 100;
  const mean = list => list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  const hash = value => createHash('sha256').update(value).digest('hex');
  const partsOf = record => ['clone', 'mutate', 'validate', 'serialise', 'save', 'broadcast'].map(key => record[key] || 0);
  const spinners = Array.from({ length: busy }, () => new Worker(new URL(import.meta.url), { workerData: { role: 'busy' } }));

  /** One world, played forward by the simulation alone, captured at four points in the game. */
  function checkpoints(families) {
    const world = createGonzalesWorld(`perf-${families}`, families, { map: 'colonies', neighbours: true });
    world.status = 'running';
    const taken = [];
    const take = name => taken.push({ name, tick: world.tick, period: periodOf(world), world: structuredClone(world) });
    // Into the next period when this one has ended; false when the game has.
    const onward = () => { if (world.status !== 'ended' || periodOf(world) >= 3) return false; beginNextPeriod(world); world.status = 'running'; return true; };
    const run = ticks => { for (let t = 0; t < ticks && world.status === 'running'; t++) stepWorld(world); };
    run(20); take('arriving (period 1, tick 20)');
    run(230); take(`late period 1`);
    run(100000); onward(); run(120); take('period 2 (winter)');
    run(100000); onward(); run(80); take('period 3 (spring)');
    return taken;
  }

  async function measure({ scenario, families, students, host, point, tickMs }) {
    const dir = mkdtempSync(join(tmpdir(), 'texas-perf-'));
    const savePath = join(dir, 'classroom.json');
    const sessionId = randomBytes(6).toString('hex');
    const hostKey = randomBytes(24).toString('hex');
    const clients = {}, pages = [];
    for (let i = 1; i <= students; i++) {
      const credential = randomBytes(24).toString('hex');
      clients[hash(credential)] = { name: `Student ${i}`, householdId: `hh-${i}`, commands: [] };
      pages.push({ role: 'student', cookie: `tr_student_${sessionId}=${credential}` });
    }
    if (host) pages.push({ role: 'host', cookie: `tr_host_${sessionId}=${hostKey}` });
    const world = structuredClone(point.world);
    world.status = 'running';
    writeSave(savePath, { saveVersion: 3, revision: 0, hostKey, sessionId, sessionCode: 'PERF01', clients, hostCommands: [], world });
    const saveBytes = statSync(savePath).size;
    const records = [];
    const app = createClassroom({ savePath, tickMs, playerCount: families, timings: record => records.push(record) });
    const port = await app.listen(0, '127.0.0.1');
    const worker = new Worker(new URL(import.meta.url), { workerData: { role: 'clients', port, clients: pages } });
    const ask = message => new Promise(resolve => { const answer = value => { worker.off('message', answer); resolve(value); }; worker.on('message', answer); worker.postMessage(message); });
    await new Promise(resolve => worker.once('message', resolve));
    // Every page connected, and one tick gone by so nothing is still arriving, before counting.
    while (app.snapshot({ role: 'host' }).connected < students) await new Promise(r => setTimeout(r, 50));
    const firstRevision = records.length;
    while (records.length < firstRevision + 1) await new Promise(r => setTimeout(r, 20));
    await ask('reset');
    const from = records.length;
    const delay = monitorEventLoopDelay({ resolution: 5 });
    delay.enable();
    const elu = performance.eventLoopUtilization();
    const started = performance.now();
    while (records.length < from + TICKS) await new Promise(r => setTimeout(r, 20));
    // Let the last tick's messages land.
    await new Promise(r => setTimeout(r, Math.min(400, tickMs / 2)));
    const used = performance.eventLoopUtilization(elu);
    const wall = performance.now() - started;
    delay.disable();
    const received = await ask('stats');
    // The order burst: straight after a tick, so no tick lands inside it.
    let burst = null;
    if (students > 1) {
      const last = records.length;
      while (records.length === last) await new Promise(r => setTimeout(r, 5));
      await ask('reset');
      const before = records.length;
      const burstElu = performance.eventLoopUtilization();
      const orders = pages.filter(page => page.role === 'student').map((page, index) => {
        const household = world.households[`hh-${index + 1}`];
        const principal = world.entities[household.principalId];
        return { cookie: page.cookie, body: { id: `perf-burst-${index + 1}-${Date.now()}`, action: 'set-auto', entityId: principal.id, auto: !principal.auto } };
      });
      const { answers } = await ask({ burst: orders });
      await new Promise(r => setTimeout(r, 300));
      const burstUsed = performance.eventLoopUtilization(burstElu);
      const commits = records.slice(before);
      const got = await ask('stats');
      burst = {
        orders: orders.length, accepted: answers.filter(a => a.status === 200).length, refused: answers.filter(a => a.status !== 200).length,
        slowestAnswerMs: round(Math.max(...answers.map(a => a.ms))), medianAnswerMs: round(answers.map(a => a.ms).sort((a, b) => a - b)[Math.floor(answers.length / 2)]),
        commits: commits.length, serverBusyMs: round(burstUsed.active),
        commitMs: round(mean(commits.map(r => partsOf(r).reduce((a, b) => a + b, 0)))),
        snapshotsSentToStudentPages: got.student?.messages || 0, snapshotsSentToHost: got.host?.messages || 0,
      };
      console.log(JSON.stringify({ burst }));
    }
    await ask('close');
    await worker.terminate();
    const finalSaveBytes = statSync(savePath).size;
    await app.close();
    rmSync(dir, { recursive: true, force: true });
    const ticks = records.slice(from, from + TICKS);
    const part = key => round(mean(ticks.map(r => r[key] || 0)));
    const total = ticks.map(r => partsOf(r).reduce((a, b) => a + b, 0));
    const result = {
      scenario, point: point.name, worldTick: point.tick, families, students, host,
      tickMs, ticks: ticks.length,
      // Before 2026-09-17's change a commit cloned the class (`clone`) and `save` serialised and wrote it; after, it is
      // serialised once (`serialise`) and `save` is the write and fsync alone.
      msPerTick: { total: round(mean(total)), max: round(Math.max(...total)), step: part('mutate'), clone: part('clone'), validate: part('validate'), serialise: part('serialise'), save: part('save'), broadcast: part('broadcast'), project: part('project'), stringify: part('stringify') },
      skippedSendsPerTick: part('skipped'),
      burst,
      mainThread: { busyMsPerTick: round(used.active / ticks.length), utilisation: round(used.utilization), eventLoopDelayMs: { p50: round(delay.percentile(50) / 1e6), p99: round(delay.percentile(99) / 1e6), max: round(delay.max / 1e6) } },
      saveBytes: Math.max(saveBytes, finalSaveBytes),
      serverBytesPerTick: { student: round(mean(ticks.map(r => (r.bytes.student || 0) / (r.count.student || 1)))), host: round(mean(ticks.map(r => r.bytes.host || 0))) },
      received: Object.fromEntries(Object.entries(received).map(([role, s]) => [role, { messagesPerPagePerTick: round(s.messages / (role === 'host' ? 1 : students) / ticks.length), meanBytes: Math.round(s.bytes / Math.max(1, s.messages)), maxBytes: s.max, bytesPerSecondAllPages: Math.round(s.bytes / (wall / 1000)) }])),
    };
    console.log(JSON.stringify(result));
    return result;
  }

  const machine = { cpu: cpus()[0].model, logicalProcessors: cpus().length, node: process.version, busyThreads: busy, affinityNote: process.env.PERF_AFFINITY || null };
  console.log(JSON.stringify(machine));
  const results = [];
  for (const [scenario, families, students, host, tickMs] of [['solo', 15, 1, true, 1000], ['class', 30, 30, true, 1500]]) {
    if (only && only !== scenario) continue;
    const built = performance.now();
    const points = checkpoints(families);
    console.log(`${scenario}: ${points.length} points played forward in ${Math.round((performance.now() - built) / 1000)} s`);
    for (const point of points) results.push(await measure({ scenario, families, students, host, point, tickMs }));
  }
  for (const spinner of spinners) await spinner.terminate();
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(`docs/evidence/perf-server-${label}.json`, JSON.stringify({ label, measuredAt: new Date().toISOString(), machine, results }, null, 2) + '\n');
  console.log(`wrote docs/evidence/perf-server-${label}.json`);
  process.exit(0);
}
