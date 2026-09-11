import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createWorld, dispatchReport } from '../sim/world.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';

// This fixture enters through an in-process constructor seam. There is no HTTP debug API.
const TOPIC = 'fixture-crossing-news';
const TRUTH = 'The crossing storehouse holds four sacks of grain.';
const RUMOR = 'A traveler thinks there may be supplies at the crossing.';
function fixture(seed, count) {
  const world = createWorld(seed, count);
  establishTruth(world, { id: TOPIC, text: TRUTH, siteId: 'gonzales' });
  learn(world, 'hh-1', TOPIC, { status: 'rumor', source: 'A passing neighbor', text: RUMOR });
  const courierId = dispatchReport(world, TOPIC, 'hh-2');
  // Miles replaced the old arbitrary map units. Preserve an observable 30-tick trip.
  world.entities[courierId].travel.speed = world.entities[courierId].travel.distance / 30;
  return world;
}
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { throw new Error('Information browser proof needs Playwright. Set PLAYWRIGHT_MODULE to an installed development dependency.'); }
const physical = Object.entries(networkInterfaces()).filter(([name]) => !/vpn|nord|vethernet|virtual|wsl/i.test(name)).flatMap(([, list]) => list).find(a => a.family === 'IPv4' && !a.internal)?.address;
const address = process.env.TEST_ADDRESS || physical || '127.0.0.1';
const dir = mkdtempSync(join(tmpdir(), 'texas-information-browser-'));
const savePath = join(dir, 'class.json');
let app = createClassroom({ seed: 'gate-c-browser', playerCount: 5, tickMs: 150, savePath, worldFactory: fixture });
let browser;
const errors = [];
const reportFor = (snapshot, topic = TOPIC) => snapshot.world.reports.find(report => report.topicId === topic);
const snapshot = page => page.evaluate(() => structuredClone(window.__snapshot));
async function withDeadline(promise, message, milliseconds = 15000) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
async function newPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  // Keep copies of every received projection before UI code or this test can mutate it.
  await page.addInitScript(() => {
    let latest;
    window.__wireSnapshots = [];
    Object.defineProperty(window, '__snapshot', {
      configurable: true,
      get() { return latest; },
      set(value) { latest = value; window.__wireSnapshots.push(structuredClone(value)); },
    });
  });
  return page;
}
function assertUninformed(payload, audience) {
  const text = JSON.stringify(payload);
  assert.ok(!text.includes(TOPIC), `${audience} received a secret topic identifier`);
  assert.ok(!text.includes(TRUTH), `${audience} received objective truth early`);
  assert.ok(!text.includes(RUMOR), `${audience} received another family's rumor`);
}
try {
  const port = await app.listen();
  const url = `http://${address}:${port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const host = await newPage(await browser.newContext());
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const clients = [];
  for (let i = 1; i <= 5; i++) {
    const context = await browser.newContext();
    const page = await newPage(context);
    await page.goto(url);
    await page.locator('input[name=name]').fill(`Information proof ${i}`);
    await page.locator('input[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId);
    assert.equal((await snapshot(page)).world.householdId, `hh-${i}`, 'Sequential joins must have stable household assignment');
    clients.push({ context, page });
  }
  await host.waitForFunction(() => window.__snapshot.connected === 5);
  const first = clients[0].page, second = clients[1].page;
  const before = await snapshot(first);
  assert.equal(reportFor(before).status, 'rumor');
  assert.equal(reportFor(before).text, RUMOR);
  assert.equal(reportFor(before).ageMinutes, 0);
  assert.ok(!JSON.stringify(before).includes(TRUTH), 'The rumor recipient received the hidden true description');
  assert.match(await first.locator('#reports').textContent(), /A traveler thinks.*rumor/is);
  assert.equal(await first.locator(`#reports [data-topic-id="${TOPIC}"][data-status="rumor"]`).count(), 1);
  for (const [index, client] of clients.entries()) if (index > 0) assertUninformed(await snapshot(client.page), `Household ${index + 1}`);
  assertUninformed(await snapshot(host), 'Host');
  assert.equal(await second.locator('#reports li').count(), 0);
  assert.equal(await host.locator('#reports li').count(), 0);
  mkdirSync('test-results', { recursive: true });
  await first.screenshot({ path: 'test-results/information-rumor.png', fullPage: true });
  await second.screenshot({ path: 'test-results/information-uninformed.png', fullPage: true });

  // Client presentation is disposable. Editing its copy must never affect authority.
  await first.evaluate(topic => {
    const report = window.__snapshot.world.reports.find(value => value.topicId === topic);
    report.status = 'confirmed'; report.text = 'A client invented this statement.';
    document.querySelector('#reports').textContent = 'A client invented this statement.';
  }, TOPIC);
  assert.equal(app.state.world.truth[TOPIC].text, TRUTH);
  assert.equal(app.state.world.knowledge.households['hh-1'][TOPIC].status, 'rumor');
  assert.equal(app.state.world.knowledge.households['hh-1'][TOPIC].text, RUMOR);
  const courierId = Object.values(app.state.world.entities).find(entity => entity.report?.topicId === TOPIC).id;
  const courierStart = structuredClone(app.state.world.entities[courierId]);
  assert.ok(courierStart.travel && courierStart.location.siteId === null);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  await first.waitForFunction(topic => window.__snapshot.world.tick >= 3 && window.__snapshot.world.reports.find(value => value.topicId === topic)?.status === 'rumor', TOPIC);
  assert.match(await first.locator('#reports').textContent(), /A traveler thinks/);
  const courierMoving = app.state.world.entities[courierId];
  assert.ok(courierMoving.travel?.progress > courierStart.travel.progress, 'Courier must physically advance before delivery');
  assert.notDeepEqual(courierMoving.location, courierStart.location);
  assertUninformed(await snapshot(second), 'Recipient while courier remains on the road');
  await second.waitForFunction(topic => window.__snapshot?.world.reports.some(report => report.topicId === topic && report.status === 'confirmed'), TOPIC);
  await host.getByRole('button', { name: 'Pause', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await Promise.all(clients.map(client => client.page.waitForFunction(() => window.__snapshot.world.status === 'paused')));
  const firstAfter = await snapshot(first), secondAfter = await snapshot(second), hostAfter = await snapshot(host);
  const delivered = reportFor(secondAfter);
  assert.equal(delivered.text, TRUTH);
  assert.match(delivered.source, /^Courier /);
  assert.equal(delivered.ageMinutes, secondAfter.world.minute - delivered.receivedMinute);
  assert.equal(delivered.observationAgeMinutes, secondAfter.world.minute - delivered.observedMinute);
  assert.ok(delivered.observationAgeMinutes > delivered.ageMinutes, 'Old news must retain observation age after delivery');
  assert.equal(reportFor(firstAfter).status, 'rumor', 'Delivery to another household cannot upgrade a private rumor');
  assert.equal(reportFor(firstAfter).ageMinutes, firstAfter.world.minute);
  assertUninformed(hostAfter, 'Host after private delivery');
  const courierEnd = app.state.world.entities[courierId];
  assert.equal(courierEnd.location.siteId, 'home-2');
  assert.equal(courierEnd.travel, null);
  assert.ok(!courierEnd.report, 'Delivered courier payload should be consumed');
  assert.equal(await second.locator(`#reports [data-topic-id="${TOPIC}"][data-status="confirmed"]`).count(), 1);
  assert.match(await second.locator('#reports').textContent(), /Received .*ago|Received just now/);
  await second.screenshot({ path: 'test-results/information-delivered.png', fullPage: true });
  await host.screenshot({ path: 'test-results/information-host-public.png', fullPage: true });

  // Inspect captured response projections, including every SSE tick, for accidental leaks.
  const hostWire = await host.evaluate(() => window.__wireSnapshots);
  for (const payload of hostWire) assertUninformed(payload, 'Host wire history');
  const recipientWire = await second.evaluate(() => window.__wireSnapshots);
  const beforeDelivery = recipientWire.filter(payload => !payload.world.reports.some(report => report.topicId === TOPIC));
  assert.ok(beforeDelivery.length >= 3);
  for (const payload of beforeDelivery) assertUninformed(payload, 'Recipient wire before delivery');
  for (const payload of await first.evaluate(() => window.__wireSnapshots)) assert.ok(!JSON.stringify(payload).includes(TRUTH), 'Rumor recipient wire leaked truth');
  for (const client of clients.slice(2)) for (const payload of await client.page.evaluate(() => window.__wireSnapshots)) assertUninformed(payload, 'Uninformed household wire history');

  // Full server restart on the same saved session: cookies and private knowledge survive.
  const savedMinute = secondAfter.world.minute;
  await withDeadline(app.close(), 'Server shutdown did not finish with live browser connections');
  app = createClassroom({ playerCount: 5, tickMs: 75, savePath });
  await app.listen(port);
  await Promise.all([host, first, second].map(page => page.reload()));
  await Promise.all([host, first, second].map(page => page.waitForFunction(() => window.__snapshot?.world.status === 'paused')));
  assert.equal((await snapshot(first)).world.householdId, 'hh-1');
  assert.equal((await snapshot(second)).world.householdId, 'hh-2');
  assert.equal(reportFor(await snapshot(first)).status, 'rumor');
  assert.deepEqual(reportFor(await snapshot(second)), delivered);
  assert.equal((await snapshot(second)).world.minute, savedMinute);
  assertUninformed(await snapshot(host), 'Restored Host');
  assert.equal(app.state.world.entities[courierId].location.siteId, 'home-2');
  assert.equal(app.state.world.truth[TOPIC].text, TRUTH);
  assert.deepEqual(errors, []);
  const evidence = {
    gate: 'C', area: 'Information browser acceptance', result: 'PASS', date: new Date().toISOString(), browser: await browser.version(), address,
    clients: 5, sameMachine: true, independentPhysicalDevices: 'NOT YET TESTED', districtNetwork: 'NOT YET TESTED',
    rumorIsolation: 'PASS', preDeliveryWireIsolation: 'PASS', privateCourierDelivery: 'PASS', physicalCourierMovement: 'PASS',
    courierId, courierArrivalSite: courierEnd.location.siteId, deliveryMinute: delivered.receivedMinute,
    rumorAgeMinutes: reportFor(firstAfter).ageMinutes, receivedAgeMinutes: delivered.ageMinutes, observationAgeMinutes: delivered.observationAgeMinutes,
    hostPublicIsolation: 'PASS', clientMutationIsolation: 'PASS', knowledgeAging: 'PASS', serverRestartAndIdentity: 'PASS', liveBrowserShutdown: 'PASS',
    hostSnapshotsChecked: hostWire.length, recipientPreDeliverySnapshotsChecked: beforeDelivery.length, browserErrors: errors,
    screenshots: ['test-results/information-rumor.png', 'test-results/information-uninformed.png', 'test-results/information-delivered.png', 'test-results/information-host-public.png'],
  };
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/gate-c-browser.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser?.close();
  await app.close();
  // Only remove the explicitly created, verified temporary fixture directory.
  const cleanupPath = resolve(dir), tempRoot = `${resolve(tmpdir())}${sep}`;
  if (!cleanupPath.startsWith(tempRoot) || !cleanupPath.split(sep).at(-1).startsWith('texas-information-browser-')) throw new Error('Unsafe temporary cleanup path');
  rmSync(cleanupPath, { recursive: true, force: true });
}
