import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { HISTORICAL_OUTCOME } from '../sim/directors.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const physical = Object.entries(networkInterfaces()).filter(([name]) => !/vpn|nord|vethernet|virtual|wsl/i.test(name)).flatMap(([, entries]) => entries).find(e => e.family === 'IPv4' && !e.internal)?.address;
const address = process.env.TEST_ADDRESS || physical || '127.0.0.1';
const directory = mkdtempSync(join(tmpdir(), 'texas-slice-'));
const savePath = join(directory, 'class.json');
// Four exchange ticks must leave time for a real accessible Pause click.
let app = createClassroom({ seed: 'browser-gonzales', playerCount: 5, tickMs: 200, savePath, worldFactory: createGonzalesWorld });
const port = await app.listen(), url = `http://${address}:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [], externalRequests = [];
async function pageFor(context) {
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(url)) externalRequests.push(request.url()); });
  return page;
}
try {
  const host = await pageFor(await browser.newContext({ viewport: { width: 1365, height: 900 } }));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const clients = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await pageFor(context); await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${i + 1}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, `hh-${i + 1}`);
    clients.push({ context, page });
  }
  await host.waitForFunction(() => window.__snapshot.connected === 5);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  const participant = clients[0].page, refuser = clients[1].page;
  await participant.waitForFunction(() => window.__snapshot.world.request?.status === 'open');
  // The call as a student meets it: a question, and answers that each carry their price.
  // Kept as evidence because this is the control the hunt rehearses.
  await participant.screenshot({ path: 'test-results/call-from-gonzales.png' });
  await participant.locator('#selection-call button[data-action=help]').click();
  await participant.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.travel?.progress > 0);
  // A traveller holds no site and is drawn on the road; the camera follows him there.
  assert.equal(await participant.evaluate(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas').location.siteId), null);
  assert.ok((await participant.evaluate(() => window.__viewEntities)).includes('hh-1-thomas'));
  assert.equal(await participant.evaluate(() => window.__camera.kind), 'journey');
  mkdirSync('test-results', { recursive: true });
  await participant.screenshot({ path: 'test-results/gonzales-travel.png', fullPage: true });
  await refuser.waitForFunction(() => window.__snapshot.world.request?.status === 'open');
  await refuser.locator('#selection-call button[data-action=stay]').click();
  await refuser.waitForFunction(() => window.__snapshot.world.request?.status === 'refused');
  await participant.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.location.siteId === 'gonzales');
  await participant.waitForFunction(() => window.__snapshot.world.battle?.phase === 'gathering', null, { timeout: 60000 });
  await participant.waitForFunction(() => window.__viewFormations.length === 2);
  assert.equal(await participant.evaluate(() => window.__viewFormations.length), 2);
  await participant.waitForFunction(() => window.__snapshot.world.battle?.phase === 'exchange', null, { timeout: 60000 });
  await host.getByRole('button', { name: 'Pause', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const paused = structuredClone(app.state.world);
  assert.equal(paused.director.battle.phase, 'exchange');
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.deepEqual(app.state.world, paused);
  assert.equal(await host.evaluate(() => window.__snapshot.world.battle), null);
  assert.equal(await refuser.evaluate(() => window.__snapshot.world.battle), null);
  await participant.screenshot({ path: 'test-results/gonzales-battle.png', fullPage: true });
  await clients[0].context.setOffline(true);
  await new Promise(resolve => setTimeout(resolve, 200));
  await clients[0].context.setOffline(false);
  await host.getByRole('button', { name: 'Resume', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.battle?.reconstruction === true);
  await host.screenshot({ path: 'test-results/gonzales-host-reconstruction.png', fullPage: true });
  await participant.waitForFunction(() => window.__snapshot.world.slice?.complete === true, null, { timeout: 20000 });
  assert.equal(app.state.world.truth['gonzales-outcome'].text, HISTORICAL_OUTCOME);
  const savedWorld = app.state.world;
  assert.equal(savedWorld.entities['hh-1-thomas'].location.siteId, 'gonzales');
  assert.equal(savedWorld.entities['hh-2-thomas'].location.siteId, 'home-2');
  assert.equal(savedWorld.households['hh-1'].memories.length, 1);
  assert.equal(savedWorld.households['hh-2'].memories.length, 1);
  assert.deepEqual(JSON.parse(readFileSync(savePath, 'utf8')).world, savedWorld);
  await app.close();
  app = createClassroom({ savePath, worldFactory: () => { throw new Error('Restart must load the saved world'); } });
  await app.listen(port);
  await participant.reload();
  await participant.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1' && window.__snapshot.world.household.memories.length === 1);
  assert.deepEqual(app.state.world, savedWorld);
  await host.reload();
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.slice.complete);
  await participant.screenshot({ path: 'test-results/gonzales-preserved.png', fullPage: true });
  // Responsive smoke check on the real UI, retaining the same household and server state.
  await participant.setViewportSize({ width: 390, height: 844 });
  // ResizeObserver and the contextual card settle on the next rendered frame.
  await participant.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await participant.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await participant.screenshot({ path: 'test-results/gonzales-narrow.png', fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  const evidence = { gate: 'D', result: 'PASS', date: new Date().toISOString(), browser: await browser.version(), address, clients: 5, sameMachine: true, causalLoop: 'PASS', validRefusal: 'PASS', sameEntityTravel: 'hh-1-thomas', automatedBattle: 'PASS', historicalOutcome: HISTORICAL_OUTCOME, hostPublicIsolation: 'PASS', hostDelayedReconstruction: 'PASS', pauseDuringBattle: 'PASS', offlineReconnect: 'PASS', saveRestartConsequence: 'PASS', hostReload: 'PASS', noExternalAssets: 'PASS', narrowLayout: 'PASS', worldTicks: savedWorld.tick, eventCount: savedWorld.events.length, errors };
  mkdirSync('docs/evidence', { recursive: true }); writeFileSync('docs/evidence/gate-d-browser.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally { await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true }); }
