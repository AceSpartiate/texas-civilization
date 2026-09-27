// Gate D: the Gonzales slice, five browsers, end to end (docs/GATES.md §D).
//
// One family answers the call and its man walks to Gonzales on the page, then goes up the river with the men and is in the
// fight; another refuses and stays home. The fight runs on the battle engine by itself, the October 2 outcome is the
// record's, both choices leave a memory, and the class survives a Pause in the fighting, a student dropping off the network,
// a checkpoint to disk, a server restart and a Host reload.
//
// Brought up to the battle rules on 2026-09-26 (docs/BATTLES.md §2.1, §6.7, `FIC-GONZ-447`). Until then this proof asserted
// what the engine deliberately replaced and had failed since 2026-09-25: the Host was sent no battle and was shown a delayed
// "reconstruction" afterwards (now: the Host sees every battle live, its camera on the field); a family with its man in the
// town saw the fight (now: only a family whose person is with the men at the field sees it; the town seven miles off hears
// the gun in words); the fight's phases were the old director's `gathering`/`exchange` and `__viewFormations` (now the
// engine's phases and `__battleView`). It also predated the family-making screen (the `#creation` curtain took the first
// click); every student now makes their family as a student does (scripts/support/meet-family.mjs).
//
// Same computer only: five headless Chrome contexts against this machine's own address. Run: npm run test:slice
import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { createClassroom, SAVE_WITHIN_MS } from '../server/app.mjs';
import { sendTheWay } from './support/going.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
// A settled class: these families are at home under a roof, as every class began before arrivals
// (docs/SETTLING_IN.md step 2). This proves the work, not the arrival - tests/arrival.test.mjs does that.
import { HISTORICAL_OUTCOME } from '../sim/directors.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const physical = Object.entries(networkInterfaces()).filter(([name]) => !/vpn|nord|vethernet|virtual|wsl/i.test(name)).flatMap(([, entries]) => entries).find(e => e.family === 'IPv4' && !e.internal)?.address;
const address = process.env.TEST_ADDRESS || physical || '127.0.0.1';
const directory = mkdtempSync(join(tmpdir(), 'texas-slice-'));
const savePath = join(directory, 'class.json');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
// A tick every 300 ms: the dawn skirmish is twelve ticks at its five-minute step (sim/battles/gonzales.mjs), which leaves a
// real accessible Pause press time to land inside the fighting.
let app = createClassroom({ seed: 'browser-gonzales', playerCount: 5, tickMs: 300, savePath, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
const port = await app.listen(), url = `http://${address}:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [], externalRequests = [];
async function pageFor(context) {
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(url)) externalRequests.push(request.url()); });
  return page;
}
const FIGHTING = ['dawn-skirmish', 'fight'];
try {
  mkdirSync('test-results', { recursive: true });
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
    // The die, the family's name and the parents' looks, as a student makes them (owner, 2026-09-17).
    await meetFamily(page, `Slice${i + 1}`);
    clients.push({ context, page });
  }
  await host.waitForFunction(() => window.__snapshot.connected === 5);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'running');
  ok('five students joined through the lobby and made their families, and the Host started the class');

  const participant = clients[0].page, refuser = clients[1].page;
  const personId = await participant.evaluate(() => window.__snapshot.world.entities.find(one => one.principal)?.id);
  const refuserId = await refuser.evaluate(() => window.__snapshot.world.entities.find(one => one.principal)?.id);
  const refuserHome = app.state.world.entities[refuserId].location.siteId;
  assert.ok(personId && refuserId && refuserHome, 'a family has no principal at home');
  const callFor = page => page.waitForFunction(() => window.__snapshot.world.request?.status === 'open' && ['supplies', 'rumor'].includes(window.__snapshot.world.request.kind), null, { timeout: 150000 });
  await callFor(participant);
  // The call as a student meets it: a question, and answers that each carry their price.
  // Kept as evidence because this is the control the hunt rehearses.
  await participant.screenshot({ path: 'test-results/call-from-gonzales.png' });
  // Word that came third-hand is a rumor: the family goes to Gonzales to see, and is asked there.
  const heardByRumor = await participant.evaluate(() => window.__snapshot.world.request.kind === 'rumor');
  if (heardByRumor) await participant.locator('#selection-call button[data-action=go-see]').click();
  else await participant.locator('#selection-call button[data-action=help]').click();
  // How he goes is asked first (owner, 2026-09-24; public/going.js): on foot, the walk this proof has always followed.
  await sendTheWay(participant, { way: 'foot' });
  await participant.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.travel?.progress > 0, personId);
  // A traveller holds no site and is drawn on the road; the camera follows him there.
  assert.equal(await participant.evaluate(id => window.__snapshot.world.entities.find(e => e.id === id).location.siteId, personId), null);
  assert.ok((await participant.evaluate(() => window.__viewEntities)).includes(personId));
  assert.equal(await participant.evaluate(() => window.__camera.kind), 'journey');
  await participant.screenshot({ path: 'test-results/gonzales-travel.png', fullPage: true });
  ok(`the participant answered the call on the page and ${personId} is on the road, holding no site, drawn, the camera on the journey`);

  await callFor(refuser);
  const refuserRumor = await refuser.evaluate(() => window.__snapshot.world.request.kind === 'rumor');
  await refuser.locator(`#selection-call button[data-action=${refuserRumor ? 'stay-home' : 'stay'}]`).click();
  await refuser.waitForFunction(() => window.__snapshot.world.request?.status === 'refused' || window.__snapshot.world.request === null);
  ok(`the refuser pressed "${refuserRumor ? 'Stay home' : 'Stay'}" and the server took the refusal`);

  await participant.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.location.siteId === 'gonzales', personId, { timeout: 150000 });
  if (heardByRumor) {
    await participant.waitForFunction(() => window.__snapshot.world.request?.status === 'open' && window.__snapshot.world.request.kind === 'supplies', null, { timeout: 150000 });
    await participant.locator('#selection-call button[data-action=help]').click();
    await sendTheWay(participant, { way: 'foot' });
  }
  ok(`${personId} reached Gonzales, the same person who set out`);
  // Only a family whose person is with the men at the field is sent the fight (docs/BATTLES.md §2.1): up the river with them.
  await participant.waitForFunction(() => window.__snapshot.world.request?.kind === 'march' && window.__snapshot.world.request.status === 'open', null, { timeout: 180000 });
  await participant.locator('#selection-call button[data-action=go-upriver]').click();
  await sendTheWay(participant, { way: 'foot' });
  await participant.waitForFunction(id => window.__snapshot.world.entities.some(one => one.id === id && (one.travel?.to === 'williams-camp' || one.location?.siteId === 'williams-camp')), personId);
  ok('the participant pressed "Go upriver" and went with the men');

  // The fight runs by itself on the engine: nobody presses anything to make it happen.
  await participant.waitForFunction(() => window.__snapshot.world.battle?.phase === 'dawn-skirmish', null, { timeout: 180000 });
  await participant.waitForFunction(() => window.__battleView?.figures?.texian > 0 && window.__battleView.figures.mexican > 0);
  // Pause in the fighting: the Host's own button, and the whole world holds still.
  await host.getByRole('button', { name: 'Pause', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const paused = structuredClone(app.state.world);
  // Read off the family's page that is watching it: whether the Host is sent the fight at all is checked on its own below.
  await participant.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const pausedPhase = await participant.evaluate(() => window.__snapshot.world.battle?.phase);
  assert.ok(FIGHTING.includes(pausedPhase), `the Pause did not land in the fighting: ${pausedPhase}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  assert.deepEqual(app.state.world, paused, 'the world moved while the Host had it paused');
  const inForce = await participant.evaluate(id => ({ members: window.__battleView?.members || [], figures: window.__battleView?.figures }), personId);
  assert.ok(inForce.members.includes(personId), `the family's own person is not drawn in the force: ${JSON.stringify(inForce)}`);
  ok(`the fight came on its own (${await participant.evaluate(() => window.__snapshot.world.battle.phase)}), drawn with both sides (${JSON.stringify(inForce.figures)}) and ${personId} in the Texian force; the Host's Pause held the whole world still`);
  // Who sees it (FIC-GONZ-447): the Host live, its camera on the field; the family that stayed home nothing of it at all.
  const hostSees = await host.evaluate(() => ({ battle: window.__snapshot.world.battle, focus: window.__snapshot.world.host?.focus }));
  assert.ok(hostSees.battle && hostSees.battle.reconstruction === false && FIGHTING.includes(hostSees.battle.phase), `the Host was not sent the fight live: ${JSON.stringify(hostSees.battle?.phase)}`);
  assert.equal(hostSees.focus, 'battle', 'the Host\'s camera was not sent to the field');
  const raw = await refuser.evaluate(async () => (await fetch('/api/state')).text());
  assert.equal(JSON.parse(raw).world.battle, null, 'the family at home was sent the battle');
  assert.ok(!raw.includes(personId), 'the family at home was sent the fighter\'s id');
  assert.equal(await refuser.evaluate(() => window.__battleView), null, 'the family at home drew a battle');
  ok('the Host sees the fight live with its camera on the field; the family at home is sent nothing of it, not even the fighter\'s id');
  await participant.screenshot({ path: 'test-results/gonzales-battle.png', fullPage: true });
  await host.screenshot({ path: 'test-results/gonzales-host-live.png', fullPage: true });

  // A student drops off the network in the middle of the fight and comes back.
  await clients[0].context.setOffline(true);
  await new Promise(resolve => setTimeout(resolve, 200));
  await clients[0].context.setOffline(false);
  await host.getByRole('button', { name: 'Resume', exact: true }).click();
  await participant.waitForFunction(() => window.__snapshot.world.status === 'running' && window.__snapshot.world.battle);
  ok('the participant went offline and back mid-fight, and the Host resumed the class');

  await participant.waitForFunction(() => window.__snapshot.world.slice?.complete === true, null, { timeout: 240000 });
  assert.equal(app.state.world.truth['gonzales-outcome'].text, HISTORICAL_OUTCOME);
  const savedWorld = app.state.world;
  const memoryOf = householdId => savedWorld.households[householdId].memories.map(id => savedWorld.events.find(event => event.id === id)?.text || id);
  const helped = memoryOf('hh-1'), stayed = memoryOf('hh-2');
  assert.ok(helped.length >= 1 && stayed.length >= 1, `a choice left no memory: ${JSON.stringify({ helped, stayed })}`);
  assert.notDeepEqual(helped, stayed, 'the two families remember the same thing');
  assert.equal(savedWorld.entities[refuserId].location.siteId, refuserHome, 'the man who stayed home is not at home');
  assert.ok(savedWorld.battles.gonzales.participants?.[personId], `the fight does not remember ${personId} was in it`);
  // The checkpoint on disk: written within SAVE_WITHIN_MS of the last change or on the third unsaved tick (server/app.mjs
  // `commit`), no longer on every tick, so it is waited for within that promise and then must be the world exactly. Until
  // 2026-09-26 this read the file the instant the page saw the slice end, a tick or two before the promise came due.
  let onDisk = null;
  for (const until = Date.now() + SAVE_WITHIN_MS + 2000; Date.now() < until; await new Promise(resolve => setTimeout(resolve, 200))) {
    try { onDisk = JSON.parse(readFileSync(savePath, 'utf8')).world; } catch { onDisk = null; }
    if (isDeepStrictEqual(onDisk, savedWorld)) break;
  }
  assert.deepEqual(onDisk, savedWorld, 'the checkpoint on disk is not the world, within the server\'s promise');
  ok(`the slice ended on the record's outcome ("${HISTORICAL_OUTCOME}"); each family remembers its own choice (${helped.length} and ${stayed.length}); the checkpoint on disk is the world`);
  await app.close();
  app = createClassroom({ savePath, worldFactory: () => { throw new Error('Restart must load the saved world'); } });
  await app.listen(port);
  await participant.reload();
  await participant.waitForFunction(n => window.__snapshot?.world.householdId === 'hh-1' && window.__snapshot.world.household.memories.length === n, helped.length);
  assert.deepEqual(app.state.world, savedWorld);
  await host.reload();
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.slice.complete);
  await participant.screenshot({ path: 'test-results/gonzales-preserved.png', fullPage: true });
  ok('the server restarted from the save: the same world, the family\'s memories back on reload, the Host reloaded to the finished slice');
  // Responsive smoke check on the real UI, retaining the same household and server state.
  await participant.setViewportSize({ width: 390, height: 844 });
  // ResizeObserver and the contextual card settle on the next rendered frame.
  await participant.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await participant.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await participant.screenshot({ path: 'test-results/gonzales-narrow.png', fullPage: true });
  ok('at a narrow width the page does not scroll sideways');
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  ok('no page errors and no request left this server');
  const evidence = { gate: 'D', result: 'PASS', date: new Date().toISOString(), browser: await browser.version(), address, clients: 5, sameMachine: true, causalLoop: 'PASS', validRefusal: 'PASS', sameEntityTravel: personId, automatedBattle: 'PASS', historicalOutcome: HISTORICAL_OUTCOME, hostLive: 'PASS', householdIsolation: 'PASS', pauseDuringBattle: 'PASS', offlineReconnect: 'PASS', saveRestartConsequence: 'PASS', hostReload: 'PASS', noExternalAssets: 'PASS', narrowLayout: 'PASS', rules: 'docs/BATTLES.md §2.1, §6.7 (re-aimed 2026-09-26; hostLive replaces the old hostDelayedReconstruction)', checks: pass, worldTicks: savedWorld.tick, eventCount: savedWorld.events.length, errors };
  mkdirSync('docs/evidence', { recursive: true }); writeFileSync('docs/evidence/gate-d-browser.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  console.log(`\n${pass.length} checks passed.`);
} finally { await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true }); }
