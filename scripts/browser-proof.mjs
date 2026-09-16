import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { throw new Error('Browser proof needs Playwright. Install it in your developer environment or set PLAYWRIGHT_MODULE to its absolute directory. No runtime game dependency.'); }
const physical = Object.entries(networkInterfaces()).filter(([name]) => !/vpn|nord|vethernet|virtual|wsl/i.test(name)).flatMap(([, list]) => list).find(a => a.family === 'IPv4' && !a.internal)?.address;
const address = process.env.TEST_ADDRESS || physical || '127.0.0.1';
const dir = mkdtempSync(join(tmpdir(), 'texas-browser-'));
// Leave real browser frames between snapshots so ordinary controls can settle.
const app = createClassroom({ savePath: join(dir, 'class.json'), tickMs: 150, playerCount: 5 });
const port = await app.listen();
const url = `http://${address}:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
try {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  host.on('pageerror', e => errors.push(e.message));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const clients = await Promise.all(Array.from({ length: 5 }, async (_, i) => {
    const context = await browser.newContext(); const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('input[name=name]').fill(`Student ${i + 1}`);
    await page.locator('input[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId);
    return { context, page, householdId: await page.evaluate(() => window.__snapshot.world.householdId) };
  }));
  await host.waitForFunction(() => window.__snapshot.connected === 5);
  for (const client of clients) await client.page.evaluate(() => { window.__received = []; });
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  await Promise.all(clients.map(c => c.page.waitForFunction(() => window.__snapshot.world.tick >= 110)));
  const updateCounts = [];
  for (const client of clients) {
    const ticks = await client.page.evaluate(() => [...new Set(window.__received.map(s => s.tick))]);
    for (let tick = 1; tick <= 100; tick++) assert.ok(ticks.includes(tick), `${client.householdId} missed tick ${tick}`);
    updateCounts.push(ticks.length);
  }
  await host.getByRole('button', { name: 'Pause', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const frozenTick = app.state.world.tick;
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(app.state.world.tick, frozenTick);
  await clients[0].page.reload();
  await clients[0].page.waitForFunction(id => window.__snapshot?.world.householdId === id, clients[0].householdId);
  await clients[1].context.setOffline(true);
  await new Promise(resolve => setTimeout(resolve, 200));
  await clients[1].context.setOffline(false);
  await host.getByRole('button', { name: 'Resume', exact: true }).click();
  await clients[1].page.waitForFunction(t => window.__snapshot?.world.tick > t + 3, frozenTick, { timeout: 15000 });
  assert.equal(await clients[1].page.evaluate(() => window.__snapshot.world.householdId), clients[1].householdId);
  assert.equal(Object.keys(app.state.clients).length, 5);
  if (process.env.PROVE_WORLD === '1') {
    const page = clients[0].page;
    const principalId = await page.evaluate(() => window.__snapshot.world.household.principalId);
    await page.locator('#journal-toggle').click();
    await page.locator(`#family-journal [data-select="${principalId}"]`).click();
    await page.locator('#journal-close').click();
    // The principal's "Travel to Gonzales" icon on the family panel (docs/FAMILY_PANEL.md).
    const toTown = `.panel-row[data-entity-id="${principalId}"] .panel-icon[data-key="travel-gonzales"]`;
    await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-disabled') === null, toTown, { timeout: 30000 });
    await page.locator(toTown).click();
    // Read in the same moment the trip is seen under way: at a quick tick the traveller could reach Gonzales between two reads.
    const underWay = await (await page.waitForFunction(id => { const person = window.__snapshot.world.entities.find(e => e.id === id), trip = person?.travel; return trip && trip.progress > 0 && trip.progress < trip.distance && { siteId: person.location.siteId }; }, principalId)).jsonValue();
    assert.equal(underWay.siteId, null);
    // Travelling widens the one map to follow the journey instead of hiding the traveller.
    assert.equal(await page.evaluate(() => window.__camera.kind), 'journey');
    assert.ok((await page.evaluate(() => window.__viewEntities)).includes(principalId));
    assert.match(await page.locator('#world-description').textContent(), /on the road/i);
    mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/travel.png', fullPage: true });
    await page.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.location.siteId === 'gonzales', principalId);
    // The page's own principal, whoever they are: five students join at once, so the first page is not always hh-1, and a
    // family is rolled at Start. The description is redrawn as the traveller arrives, so it is waited for, not read once.
    const principal = app.state.world.entities[principalId].name;
    await page.waitForFunction(name => document.querySelector('#world-description')?.textContent.includes(name), principal, { timeout: 15000 });
    await page.reload();
    await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.location.siteId === 'gonzales', principalId);
    assert.equal(await page.evaluate(id => window.__snapshot.world.entities.filter(e => e.id === id).length, principalId), 1);
    await page.screenshot({ path: 'test-results/arrival.png', fullPage: true });
    const worldProof = { gate: 'B', result: 'PASS', date: new Date().toISOString(), principalId, browserViews: 'one map: home → following the journey → Gonzales', refreshAtDestination: 'PASS', entityCount: Object.keys(app.state.world.entities).length, browserErrors: errors };
    writeFileSync('test-results/gate-b-browser.json', JSON.stringify(worldProof, null, 2));
    console.log(JSON.stringify(worldProof, null, 2));
  }
  assert.deepEqual(errors, []);
  mkdirSync('test-results', { recursive: true });
  const evidence = { gate: 'A', result: 'PASS', date: new Date().toISOString(), browser: await browser.version(), address, clients: 5, updatesPerClient: updateCounts, sameMachine: true, independentPhysicalDevices: 'NOT YET TESTED', districtNetwork: 'NOT YET TESTED', refresh: 'PASS', reconnect: 'PASS', pauseResume: 'PASS', errors };
  writeFileSync('test-results/gate-a-browser.json', JSON.stringify(evidence, null, 2));
  await clients[0].page.screenshot({ path: 'test-results/student.png', fullPage: true });
  console.log(JSON.stringify(evidence, null, 2));
} finally { await browser.close(); await app.close(); rmSync(dir, { recursive: true, force: true }); }
