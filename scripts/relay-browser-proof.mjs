// News that changed hands, proved in real browsers.
//
// `docs/LIVING_INFORMATION.md` build-order step 2. Step 1 proved that a report is said to
// a person; this proves that when the word has to cross a county it arrives through other
// people, older and worse, and that a student can see that it did. Two households in one
// class at one moment: the near one meets the rider who saw it, the far one meets somebody
// who was told by somebody who was told.
//
// The same shape as the other proofs here: an in-process constructor seam for the fixture,
// real browsers over real HTTP, no debug API, and an isolated temporary save.
import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';
import { createWorld, dispatchReport } from '../sim/world.mjs';
import { establishTruth } from '../sim/knowledge.mjs';
import { CONVERSATIONS } from '../sim/encounters.mjs';
import { findPath } from '../sim/geography.mjs';

const TOPIC = 'cannon-request';
const TRUTH = 'A Mexican detachment has reached the Guadalupe opposite Gonzales to reclaim the cannon. Local settlers have refused to return it.';
let near = null, far = null;
// No director: this proof is about the road and the riders on it, and a scenario
// dispatching its own couriers on its own schedule would only add noise.
function fixture(seed, count) {
  const world = createWorld(seed, count);
  establishTruth(world, { id: TOPIC, text: TRUTH, siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-002' });
  const byRoad = Object.values(world.households)
    .map(household => ({ id: household.id, miles: findPath(world.map, 'gonzales', household.homeSiteId).distance }))
    .sort((a, b) => a.miles - b.miles);
  near = byRoad[0]; far = byRoad.at(-1);
  for (const household of [near, far]) dispatchReport(world, TOPIC, household.id);
  return world;
}

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { throw new Error('Relay browser proof needs Playwright. Set PLAYWRIGHT_MODULE to an installed development dependency.'); }
const physical = Object.entries(networkInterfaces()).filter(([name]) => !/vpn|nord|vethernet|virtual|wsl/i.test(name)).flatMap(([, list]) => list).find(a => a.family === 'IPv4' && !a.internal)?.address;
const address = process.env.TEST_ADDRESS || physical || '127.0.0.1';
const dir = mkdtempSync(join(tmpdir(), 'texas-relay-browser-'));
const savePath = join(dir, 'class.json');
const app = createClassroom({ seed: process.env.SEED || 'gonzales-relay', playerCount: 5, tickMs: 150, savePath, worldFactory: fixture });
let browser;
const errors = [];
const snapshot = page => page.evaluate(() => structuredClone(window.__snapshot));

async function newPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  // Every projection as it came off the wire, before any UI code could touch it.
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

const record = { record: 'rider-relay', date: new Date().toISOString().slice(0, 10), address, sameMachine: true };
try {
  const port = await app.listen();
  const url = `http://${address}:${port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const host = await newPage(await browser.newContext());
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const pages = {};
  for (let i = 1; i <= 5; i++) {
    const page = await newPage(await browser.newContext());
    await page.goto(url);
    await page.locator('input[name=name]').fill(`Relay proof ${i}`);
    await page.locator('input[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId);
    pages[(await snapshot(page)).world.householdId] = page;
  }
  await host.waitForFunction(() => window.__snapshot.connected === 5);
  record.near = { ...near, miles: +near.miles.toFixed(2) };
  record.far = { ...far, miles: +far.miles.toFixed(2) };
  assert.ok(far.miles > near.miles * 2, 'the class must contain a family near the town and one out at the edge of the county');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'running');

  // --- both families are told, each by whoever actually reached them -------------------
  const meetingOf = page => page.waitForFunction(() => window.__snapshot?.world.encounter?.said?.length)
    .then(() => snapshot(page)).then(payload => payload.world.encounter);
  const nearMet = await meetingOf(pages[near.id]);
  const farMet = await meetingOf(pages[far.id]);
  assert.equal(nearMet.firsthand, true, 'the family beside the town met the rider who saw it');
  assert.equal(nearMet.hands, 0);
  assert.ok(farMet.hands >= 1, `the family ${far.miles.toFixed(1)} miles out met somebody who was told (${farMet.hands} hands)`);
  assert.equal(farMet.firsthand, false);
  assert.match(nearMet.said[0].text, /I.ve come up from Gonzales/);
  assert.match(farMet.said[0].text, /I did not see any of this myself/);
  assert.ok(farMet.said[0].text.includes('Gonzales'), 'and still says where it began');
  assert.equal(farMet.origin, 'Gonzales', 'the source survived every hand it passed through');
  assert.ok(farMet.observedAgoMinutes > nearMet.observedAgoMinutes, 'and the account is genuinely older by the time it arrives');
  record.near.opening = nearMet.said[0].text;
  record.far.opening = farMet.said[0].text;
  record.far.toldBy = farMet.toldBy;
  record.far.toldAt = farMet.toldAt;
  record.far.hands = farMet.hands;
  record.far.observedAgoMinutes = farMet.observedAgoMinutes;
  record.near.observedAgoMinutes = nearMet.observedAgoMinutes;

  // --- nothing about the chain reached anybody before they were told --------------------
  const answers = CONVERSATIONS[TOPIC].lines.flatMap(line => [
    line.answer({ firsthand: true, origin: 'Gonzales', departedAgo: 'an hour', observedAgo: 'an hour' }),
    line.answer({ firsthand: false, hands: 2, origin: 'Gonzales', toldBy: 'Ada Swinney', toldAt: 'the fork of the road', departedAgo: 'an hour', observedAgo: 'a day' }),
  ]);
  let checked = 0;
  for (const [householdId, page] of Object.entries(pages)) {
    const wire = await page.evaluate(() => structuredClone(window.__wireSnapshots));
    for (const payload of wire) {
      const heard = payload.world?.reports?.some(report => report.topicId === TOPIC);
      const text = JSON.stringify(payload);
      assert.ok(!text.includes('gave the word'), `${householdId} was shown a hand-off`);
      if (heard) continue;
      checked++;
      assert.ok(!text.includes(TRUTH), `${householdId} was shown news it had not heard`);
      for (const answer of answers) assert.ok(!text.includes(answer.slice(0, 40)), `${householdId} was shipped an answer nobody had given`);
    }
  }
  const hostWire = await host.evaluate(() => structuredClone(window.__wireSnapshots));
  for (const payload of hostWire) assert.ok(!JSON.stringify(payload).includes('gave the word'), 'the Host was shown a hand-off');
  record.preContactSnapshotsChecked = checked;
  record.payloadIsolation = 'PASS';

  // --- what the student actually reads --------------------------------------------------
  const page = pages[far.id];
  await page.locator('#rider-open').click();
  await page.waitForSelector('#encounter:not([hidden])');
  record.far.header = (await page.locator('#encounter-origin').textContent()).trim();
  assert.ok(record.far.header.includes(`Had it from ${farMet.toldBy}`), 'the header names who told them');
  assert.ok(record.far.header.includes(farMet.toldAt), 'and where');
  assert.match(record.far.header, /second-hand|third-hand|through \d+ hands/);
  // The same panel for the family beside the town, so the record holds the two headers
  // side by side. Through the journal rather than the prompt, because by now their rider
  // may well have ridden on - and a conversation that has ended is still readable, which
  // is the other half of what this proves.
  const nearPage = pages[near.id];
  await nearPage.locator('#news-toggle').click();
  await nearPage.getByRole('button', { name: /^Read what / }).click();
  await nearPage.waitForSelector('#encounter:not([hidden])');
  record.near.header = (await nearPage.locator('#encounter-origin').textContent()).trim();
  assert.match(record.near.header, /^Rode from Gonzales/, 'the family who met the witness is told plainly where they rode from');
  assert.ok(!/second-hand|third-hand|hands/.test(record.near.header), 'and nothing about hands, because there were none');

  // Asking is what draws out what a second-hand rider cannot answer.
  await page.getByRole('button', { name: 'Did you see them yourself?' }).click();
  await page.waitForFunction(() => window.__snapshot.world.encounter.said.length >= 3);
  const sawIt = (await snapshot(page)).world.encounter.said.at(-1).text;
  assert.match(sawIt, /^No\./, 'a rider who was told says so when asked');
  assert.ok(sawIt.includes(farMet.toldBy), 'and names who did tell them');
  record.far.sawIt = sawIt;

  const journal = await page.locator(`#reports [data-topic-id="${TOPIC}"]`).textContent();
  assert.match(journal, /second-hand|third-hand|through \d+ hands/, 'the record itself says how far the word came');
  assert.match(journal, /rumor|unconfirmed/, 'and that it is worth less for it');
  record.far.journal = journal.trim().replace(/\s+/g, ' ');
  const nearJournal = (await pages[near.id].locator(`#reports [data-topic-id="${TOPIC}"]`).textContent()).trim().replace(/\s+/g, ' ');
  assert.match(nearJournal, /confirmed/, 'while the family who met the witness has a confirmed report');
  assert.ok(!/second-hand|third-hand|through \d+ hands/.test(nearJournal), 'and nothing about hands, because there were none');
  record.near.journal = nearJournal;

  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/relay-secondhand.png', fullPage: true });
  await pages[near.id].screenshot({ path: 'test-results/relay-firsthand.png', fullPage: true });

  // --- and it is still readable after the rider has gone and the page has reloaded ------
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId);
  // The news line on the map opens into the family's own record, and the record is where
  // a rider who has gone is still readable.
  await page.locator('#news-toggle').click();
  await page.getByRole('button', { name: /^Read what / }).click();
  await page.waitForSelector('#encounter:not([hidden])');
  const afterReload = (await page.locator('#encounter-origin').textContent()).trim();
  assert.equal(afterReload, record.far.header, 'the provenance is the same after a reload as it was when it was said');
  const lines = await page.locator('#encounter-said li').count();
  assert.ok(lines >= 3, `the whole conversation is still there (${lines} lines)`);
  record.reconnect = 'PASS';
  record.transcriptLinesAfterReload = lines;

  assert.deepEqual(errors, [], 'no browser errors');
  record.browserErrors = errors;
  record.screenshots = ['test-results/relay-secondhand.png', 'test-results/relay-firsthand.png'];
  record.notProved = [
    'Anything about independent physical devices, district Wi-Fi or a full 45-minute session.',
    'That twelve miles is the right leg length, or that the wording of a second-hand account reads well to a student. Neither has been played with a class.',
  ];
  // The live record only. The design record next to it - scope, rules, the regressions
  // injected and what they caught - is written by hand and is not a test output.
  writeFileSync('docs/evidence/rider-relay-browser.json', `${JSON.stringify(record, null, 2)}\n`);
  console.log(JSON.stringify(record, null, 2));
} finally {
  await browser?.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
