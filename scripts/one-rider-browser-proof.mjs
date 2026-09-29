// One rider, one visit: the opening riders proved in a real browser (owner, 2026-09-29, verbatim: "At the start of the game,
// there's multiple riders that arrive at the same time. If they're all carrying similar news, why does the family receive
// multiples? Why don't we integrate and simplify things?", refined the same day: "players shouldn't see riders merge, they
// should have a seamless experience. it should be an off screen thing. ... Players shouldn't miss anything, but also
// shouldn't be quickly overwhelmed with a lot of stuff."; docs/COLONIES.md §5.4b, `FIC-GONZ-909`).
//
// A Play Solo game on the real land, fifteen families, the player's family a Matagorda family whose word comes by express
// (seed `q2`): its rider reins in beside two more riders carrying the same word to its neighbours and home, and its
// settlement's call is put to it on the very tick he speaks. Mid-conversation a second rider brings the same news, firmer.
// Proved here:
//
//   1. the family sees one rider bring the word, not a pack of them;
//   2. while he talks, the call waits: no second "!", a calm line saying one more thing waits, and the call's five minutes
//      do not run;
//   3. the same news, firmer, arriving mid-conversation is taken off screen: the family knows it from the minute that rider
//      came, with his name as the source, and there is never a second meeting about it;
//   4. the conversation ends with one clear control, and closing it moves straight on to the call;
//   5. Escape ends the next conversation (the fight's outcome) the same way.
//
// `ONE_RIDER_MODE=before` runs the same scene and only measures and photographs it, for the before/after in docs/evidence.
// Same computer only: headless Chrome. Run: npm run test:one-rider
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { relayReport, rollFamily, stepWorld } from '../sim/world.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const MODE = process.env.ONE_RIDER_MODE === 'before' ? 'before' : 'after';
const after = MODE === 'after';
const TOPIC = 'cannon-request';
const TICK_MS = 100;
// sim/encounters.mjs `VISIT_MINUTES`, written out so the before run can be made on code that has no such thing.
const VISIT = 360;
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = { mode: MODE };
const shots = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/one-rider-${MODE}-${name}.png`; await page.screenshot({ path }); shots.push(path); };

// The seed is the proof's, whatever the solo server deals: q2's first family lives at Matagorda and meets its rider with more
// riders in sight (measured 2026-09-29; see HANDOFF). Stepped in process to a few ticks before its rider reaches it, and a
// second rider with the same word, firmer, sent after him down the same road from where he set out.
let secondId = null;
function beforeTheRider(_seed, count) {
  const world = createGonzalesWorld('q2', count, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  world.households['hh-1'].played = true;
  const coming = () => Object.values(world.entities).find(one => one.report?.inPerson && one.report.audience === 'hh-1' && one.report.destination === one.report.homeSiteId && one.travel);
  for (let t = 0; t < 2000; t++) {
    const rider = coming();
    if (rider && rider.travel.distance - rider.travel.progress < rider.travel.speed * 3) break;
    stepWorld(world);
  }
  const rider = coming();
  if (!rider) throw new Error('q2: no rider on his last leg to the first family');
  const second = relayReport(world, { topicId: TOPIC, householdId: 'hh-1', fromSiteId: rider.base, originSiteId: 'gonzales', status: 'confirmed', provenance: [], causeId: world.truth[TOPIC].eventId });
  secondId = second.id;
  delete world.households['hh-1'].played;
  return world;
}
const app = createClassroom({ seed: 'one-rider', playerCount: 15, tickMs: TICK_MS, solo: true, worldFactory: beforeTheRider });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const world = () => app.state.world;
const visits = () => Object.values(world().encounters || {}).filter(one => one.householdId === 'hh-1' && !one.kind);
const until = async (label, check, ms = 60000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 400)); }
  throw new Error(`timed out: ${label}`);
};

try {
  const game = app.newSoloGame('One rider');
  const student = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url + game.path);
  await student.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 30000 });
  await meetFamily(student);
  if (await student.locator('#journal-close').isVisible()) await student.locator('#journal-close').click();
  await student.locator('#wagon-done').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  await student.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  // Tips at first meeting are put away as they come: they are another proof's business.
  const tips = setInterval(() => { student.locator('#tip:not([hidden]) .tip-close').click({ timeout: 200 }).catch(() => {}); }, 400);
  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host', null, { timeout: 15000 });
  measured.settlement = world().households['hh-1'].settlementId;
  ok(`a solo game on the real land, fifteen families, the player's family at ${measured.settlement}`);

  // ------------------------------------------------------------------ 1. the rider reins in: one rider, one thing waiting
  await until('the rider reaching the family', () => visits().length > 0, 120000);
  // `app.state` is a copy: read afresh each time.
  const firstId = visits()[0].id;
  const firstNow = () => world().encounters[firstId];
  const first = firstNow();
  const second = world().entities[secondId];
  measured.firstRider = { name: first.carrierName, status: first.reportStatus, openedMinute: first.openedMinute, callPutMinute: world().calls?.['hh-1']?.offeredMinute ?? null };
  measured.secondRider = { id: second.id, name: second.name };
  await student.waitForFunction(() => window.__snapshot?.world?.encounter?.status === 'open', null, { timeout: 15000 });
  await student.waitForTimeout(600);
  const arrival = await student.evaluate(() => {
    const w = window.__snapshot.world;
    const notice = document.querySelector('#military-notice');
    return {
      ridersDrawn: (w.others || []).filter(other => other.carrier).map(other => other.name),
      needs: (window.__familyPanel || []).filter(row => row.needs?.length).map(row => ({ name: row.name, needs: row.needs })),
      request: w.request ? { kind: w.request.kind, status: w.request.status } : null,
      waiting: w.encounter?.waiting || null,
      notice: notice && !notice.hidden ? document.querySelector('#military-title')?.textContent : null,
    };
  });
  measured.arrival = arrival;
  measured.arrival.callClockMs = world().decisionClock?.['call:hh-1']?.spent ?? 0;
  await shot(student, 'arrival');
  await shot(host, 'host-arrival');
  const marks = arrival.needs.reduce((sum, row) => sum + row.needs.length, 0);
  console.log('arrival', JSON.stringify(arrival));
  if (after) {
    assert.deepEqual(arrival.ridersDrawn, [first.carrierName], `the family sees ${arrival.ridersDrawn.length} riders bring one word: ${arrival.ridersDrawn.join(', ')}`);
    assert.equal(arrival.request, null, 'the call is shown over the rider who is still talking');
    assert.equal(marks, 1, `${marks} "!" marks while one rider talks: ${JSON.stringify(arrival.needs)}`);
    assert.equal(arrival.waiting?.count, 1, 'nothing says one more thing is waiting');
    ok(`the rider reins in alone (${arrival.ridersDrawn[0]}), with one "!" on the family and the call waiting behind him ("${arrival.waiting.words}")`);
  }

  // ------------------------------------------------------------------ 2. the conversation, its end control, the call's clock held
  const listener = first.listenerId;
  await student.locator(`.panel-row[data-entity-id="${listener}"] .panel-attention`).click();
  await student.waitForFunction(() => !document.querySelector('#encounter').hidden, null, { timeout: 5000 });
  await student.waitForTimeout(400);
  const talk = await student.evaluate(() => ({
    end: [...document.querySelectorAll('#encounter .ask-leave')].map(one => one.textContent),
    note: document.querySelector('#encounter-note')?.textContent,
    close: document.querySelector('#encounter-close')?.getAttribute('aria-label'),
  }));
  measured.conversation = talk;
  await shot(student, 'conversation');
  if (after) {
    assert.equal(talk.end.length, 1, 'one control ends the conversation');
    assert.match(talk.end[0], /^Done/, `the end control does not say Done: ${talk.end[0]}`);
    assert.match(talk.note, /waiting/i, `the conversation does not say something waits after it: ${talk.note}`);
    ok(`the conversation ends with one clear control ("${talk.end[0]}"), and says "${talk.note}"`);
  }

  // ------------------------------------------------------------------ 3. the same news, firmer, mid-conversation
  // Watched on the page, not by copying the server's whole state over and over: a copy of a class on the real land takes long
  // enough that the conversation could time out while the proof looked.
  if (after) await student.waitForFunction(() => window.__snapshot?.world?.reports?.find(one => one.topicId === 'cannon-request')?.status === 'confirmed', null, { timeout: 60000 });
  else await until('the second rider reaching the family', () => { const w = world(); return !w.entities[second.id].report || w.entities[second.id].location.siteId === w.households['hh-1'].homeSiteId; }, 60000);
  // Paused while the server's state is copied and read, as a student may pause Play Solo: a copy of the real land is slow, and
  // under load the class ran on far enough behind it for the fight's outcome to come before Done could be pressed.
  await student.locator('[data-solo="solo-pause"]').click();
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'paused', null, { timeout: 10000 });
  const w3 = world();
  const known = w3.knowledge.households['hh-1'][TOPIC];
  const visits3 = Object.values(w3.encounters).filter(one => one.householdId === 'hh-1' && !one.kind);
  measured.duplicate = { knownStatus: known.status, knownSource: known.source, receivedMinute: known.receivedMinute, firstStillOpen: w3.encounters[firstId].status === 'open', visits: visits3.length, secondStillCarrying: Boolean(w3.entities[second.id].report), joined: w3.encounters[firstId].joined || null };
  measured.duplicate.drawn = await student.evaluate(id => (window.__snapshot.world.others || []).some(other => other.id === id), second.id);
  if (after) {
    assert.equal(measured.duplicate.firstStillOpen, true, 'the first conversation ended before the second rider came');
    assert.equal(known.status, 'confirmed', `the firmer account was not taken when it came (${known.status})`);
    assert.ok(known.source.startsWith(second.name), `the firmer account does not name the rider who brought it: ${known.source}`);
    assert.equal(visits3.length, 1, 'a second meeting about the same news');
    assert.equal(known.receivedMinute, measured.duplicate.joined?.[0]?.minute, 'the firmer account is not dated the minute its rider came');
    assert.equal(measured.duplicate.drawn, false, 'the second rider is drawn coming up to a family already being told');
    assert.equal(w3.decisionClock?.['call:hh-1']?.spent ?? 0, 0, 'the call\'s minutes ran while it waited behind the rider');
    ok(`the same word, firmer, from ${second.name} mid-conversation is known at once (${known.status}, "${known.source}") and never becomes a second meeting; the call's clock has not started`);
  }

  // ------------------------------------------------------------------ 4. Done, and straight on to the call
  await student.locator('[data-solo="solo-resume"]').click();
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'running', null, { timeout: 10000 });
  await student.locator('#encounter .ask-leave').click();
  const doneAt = Date.now();
  await until('the conversation closing', () => firstNow().status === 'closed', 10000);
  if (after) {
    await student.waitForFunction(() => !document.querySelector('#call-menu').hidden, null, { timeout: 8000 }).catch(async error => {
      const state = await student.evaluate(() => ({ encounter: window.__snapshot.world.encounter && { id: window.__snapshot.world.encounter.id, status: window.__snapshot.world.encounter.status }, request: window.__snapshot.world.request && { kind: window.__snapshot.world.request.kind, status: window.__snapshot.world.request.status, answerers: Object.keys(window.__snapshot.world.request.answerers || {}) }, panel: (window.__familyPanel || []).map(row => row.needs), opened: window.__needOpened || null, encounterHidden: document.querySelector('#encounter').hidden }));
      throw new Error(`the call did not come up after Done: ${JSON.stringify(state)} visits ${JSON.stringify(visits().map(one => ({ id: one.id, carrier: one.carrierName, carrierId: one.carrierId, topic: one.topicId, status: one.reportStatus, opened: one.openedMinute, closed: one.closedMinute, reason: one.reason, joined: one.joined })))} (${error.message})`);
    });
    measured.next = { msAfterDone: Date.now() - doneAt, encounterHidden: await student.locator('#encounter').isHidden(), text: await student.locator('#call-menu-text').textContent() };
    await shot(student, 'next');
    assert.equal(measured.next.encounterHidden, true, 'the finished conversation is still on the screen');
    ok(`Done closed the conversation and the call came up next, ${measured.next.msAfterDone} ms later: "${measured.next.text.slice(0, 70)}..."`);
    await until('the call\'s clock running once it is shown', () => (world().decisionClock?.['call:hh-1']?.spent ?? 0) > 0, 10000);
    ok('the call\'s five minutes began when it was shown, not while it waited');
    await student.locator('#call-menu-close').click().catch(() => {});
  } else {
    await student.waitForTimeout(1500);
    measured.next = { encounterHidden: await student.locator('#encounter').isHidden(), callMenuShown: await student.locator('#call-menu').isVisible() };
    await shot(student, 'next');
  }
  // The duplicate, a little later: before this change the second rider opened a second meeting about the same news.
  await until('the window for a second meeting', () => { const w = world(); return Object.values(w.encounters).filter(one => one.householdId === 'hh-1' && one.topicId === TOPIC).length > 1 || w.minute > (w.encounters[firstId].closedMinute ?? w.minute) + VISIT; }, 60000).catch(() => {});
  measured.visitsAfterWindow = visits().map(one => ({ carrier: one.carrierName, topic: one.topicId, status: one.reportStatus, opened: one.openedMinute }));
  if (visits().length > 1) {
    await student.waitForFunction(() => window.__snapshot?.world?.encounter?.status === 'open', null, { timeout: 5000 }).catch(() => {});
    await shot(student, 'duplicate');
  }
  if (after) {
    assert.equal(visits().filter(one => one.topicId === TOPIC).length, 1, `the same news was told twice: ${JSON.stringify(measured.visitsAfterWindow)}`);
    ok('the same news is never a second meeting');
  }

  // ------------------------------------------------------------------ 5. Escape ends the next conversation
  if (after) {
    await until('the fight\'s outcome reaching the family', () => visits().some(one => one.topicId === 'gonzales-outcome' && one.status === 'open'), 240000);
    const outcome = visits().find(one => one.topicId === 'gonzales-outcome');
    await student.waitForFunction(() => window.__snapshot?.world?.encounter?.topicId === 'gonzales-outcome' && window.__snapshot.world.encounter.status === 'open', null, { timeout: 10000 });
    await student.locator(`.panel-row[data-entity-id="${outcome.listenerId}"] .panel-attention`).click();
    await student.waitForFunction(() => !document.querySelector('#encounter').hidden, null, { timeout: 5000 });
    await student.keyboard.press('Escape');
    await until('Escape sending the rider on', () => world().encounters[outcome.id].status === 'closed', 10000);
    assert.equal(world().encounters[outcome.id].reason, 'farewell');
    assert.equal(await student.locator('#encounter').isHidden(), true, 'Escape left the conversation on the screen');
    ok(`Escape ended the next conversation (${outcome.carrierName}, the fight's outcome) and put it away`);
  }
  clearInterval(tips);
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync(`docs/evidence/one-rider-${MODE}.json`, `${JSON.stringify({
    record: `one-rider-browser-${MODE}`,
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    environment: `Same computer: an in-process Play Solo classroom at ${TICK_MS} ms a tick, fifteen families on the real land (seed q2), headless Chrome at 1440x900. Not a Chromebook, not a LAN.`,
    checks: pass,
    measured,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed (${MODE}); wrote docs/evidence/one-rider-${MODE}.json`);
} finally {
  await browser.close();
  await app.close();
}
