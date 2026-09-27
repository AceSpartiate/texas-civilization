// The bell at Béxar on February 23, 1836, in a real class (owner, 2026-09-26: "players should be shocked and scared when he's
// spotted, close to Bexar and texas is unprepared"; docs/battle-research/surprise-at-bexar.md, sim/surprise.mjs).
//
// A class through the real join flow: hh-1 of Gonzales, whose father is in the garrison at Béxar, on a Chromebook's 1366x768;
// hh-2 of Columbia, with nobody near Béxar, on 1024x768; and the Host. It holds:
//   - before the bell, neither family's reports or journal say Santa Anna is marching or has crossed the Rio Grande; both have
//     heard what Béxar believed (no army before the grass); hh-1 has Herrera's warning as disbelieved, hh-2 has not;
//   - at the bell the card comes to hh-1 through its man, with Watch; Watch frames the town; the caption tells the bell, the
//     sentry's "The enemy are in view!" is sent, the scouts ride out; the family knows it on the day, in its reports;
//   - the Host's banner lights on the bell;
//   - hh-2 is sent nothing of it - no card, no battle, no report, nothing in its journal - until the riders come on the 26th,
//     and then its reports have it with Travis's words;
//   - at both sizes the page does not scroll sideways and the card is on the screen.
// Same computer, headless Chrome. Run: npm run test:bexar-alarm
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { alamoClass, fatherOf } from './support/alamo-class.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const directory = mkdtempSync(join(tmpdir(), 'texas-bell-'));
// Four days before the bell, so the class plays the 20th (Herrera) with the students on the page.
const app = createClassroom({ seed: 'bexar-alarm', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: (seed, count) => alamoClass(seed, count, { stopBefore: 4 * 1440 }) });
const server = () => app.state.world;
const man = fatherOf(server(), 'hh-1');
assert.equal(server().households['hh-1'].settlementId || 'gonzales', 'gonzales');
assert.notEqual(server().households['hh-2'].settlementId || 'gonzales', 'gonzales', 'hh-2 is not a family of the colonies beyond Gonzales');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { screens: [] };
/** Says, in any words, that Santa Anna or his army is on the march, coming, or over the river (as tests/surprise.test.mjs). */
const marching = text => (text || '').split(/(?<=[.!?])\s+/).some(sentence => /Santa Anna|Mexican (?:army|soldiers|troops|cavalry)|the enemy|a great army/i.test(sentence)
  && /\b(?:is|are|was|were) marching\b|\bmarching on\b|\bhas crossed\b|\bhave crossed\b|\bcrossed the Rio Grande\b|\bover the Rio Grande\b|\bon the march\b|\b(?:is|are) coming\b|\bon (?:his|its|their) way\b/i.test(sentence));
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = async (page, name) => { const path = `test-results/bexar-alarm-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };
const known = page => page.evaluate(() => ({ date: window.__snapshot.world.historicalDate, minute: window.__snapshot.world.minute, said: window.__snapshot.world.events.map(event => ({ minute: event.minute, text: event.text })), reports: (window.__snapshot.world.reports || []).map(report => ({ topicId: report.topicId, text: report.text, source: report.source, received: report.receivedMinute })), events: window.__snapshot.world.events.map(event => event.text), alert: window.__snapshot.world.battleAlert || null, battle: Boolean(window.__snapshot.world.battle) }));
async function fits(page, width) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at ${width}x768 by ${overflow}px`);
}

try {
  mkdirSync('test-results', { recursive: true });
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Garrison', 'hh-2': 'Faraway' }[householdId]);
    students[householdId] = page;
  }
  const { 'hh-1': inside, 'hh-2': faraway } = students;
  await host.waitForFunction(() => window.__snapshot.connected === 2);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => window.__snapshot.world.status === 'running');
  }
  ok(`a class on the colonies map through the join flow: ${man.name} of hh-1 (Gonzales) in the garrison at Béxar, set in process; hh-2 (${server().households['hh-2'].settlementId}) kept at home`);

  // ---------------------------------------------------------------- the evening of the 20th: Herrera, in Béxar only
  await inside.waitForFunction(() => (window.__snapshot.world.reports || []).some(report => report.topicId === 'herrera-report'), null, { timeout: 180000 });
  const herrera = await known(inside);
  const heard = herrera.reports.find(report => report.topicId === 'herrera-report');
  assert.match(heard.text, /do not believe/, 'Herrera\'s warning was not told as disbelieved');
  assert.ok((await known(faraway)).reports.every(report => report.topicId !== 'herrera-report'), 'the family with nobody in Béxar heard Herrera');
  ok(`on ${herrera.date} hh-1 heard, through ${man.name}: "${heard.text.slice(0, 120)}…"; hh-2 did not`);

  // ---------------------------------------------------------------- the bell
  let last = null;
  const before = { inside: null, faraway: null };
  while (true) {
    const now = await known(inside);
    if (now.alert?.id?.includes(':siege:')) { last = now; break; }
    before.inside = now; before.faraway = await known(faraway);
    await inside.waitForTimeout(200);
  }
  for (const [who, seen] of Object.entries(before)) {
    for (const report of seen.reports) if (report.topicId !== 'herrera-report') assert.ok(!marching(report.text), `${who} knew before the bell: "${report.text}"`);
    for (const text of seen.events) assert.ok(!marching(text), `${who}'s journal said before the bell: "${text}"`);
    assert.ok(seen.reports.some(report => report.topicId === 'winter-grass' && /grass/.test(report.text)), `${who} never heard what Béxar believed`);
  }
  ok(`before the bell (${before.inside.date}) neither family knew or was told that Santa Anna was marching; both had heard "${before.faraway.reports.find(report => report.topicId === 'winter-grass').text.slice(0, 90)}…"`);
  // The Host pauses on it, as a teacher would to let the class look: the bell's phase is four ticks long at this proof's pace.
  await host.locator('#host-controls [data-action="pause"]').click();
  await inside.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 10000 });

  assert.equal(last.alert.entityId, man.id, 'the card did not come through the family\'s man');
  assert.match(last.alert.text, /side/);
  assert.match(last.alert.text, /bell/, 'the card does not tell the bell');
  await inside.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 20000 });
  const card = await inside.evaluate(() => ({ title: document.querySelector('#military-title')?.textContent, text: document.querySelector('#military-words')?.textContent }));
  const box = await inside.locator('#military-notice').boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= 1366 && box.y >= 0 && box.y + box.height <= 768, 'the card is not on a Chromebook\'s screen');
  await fits(inside, 1366);
  await shot(inside, 'card-1366');
  assert.match(card.text || '', /bell/, 'the card on the screen does not tell the bell');
  ok(`on ${last.date} the card "${card.title}" came through ${man.name}: "${last.alert.text.slice(0, 140)}…" - on the screen at 1366x768`);
  await inside.locator('#military-go').click();
  await inside.waitForTimeout(500);
  const watched = await inside.evaluate(() => ({ camera: window.__camera?.kind, phase: window.__snapshot.world.battle?.phase, caption: document.querySelector('#battle-caption')?.textContent || '', lines: (window.__snapshot.world.battle?.lines || []).map(line => line.text) }));
  assert.equal(watched.camera, 'battle', 'Watch did not put the camera on Béxar');
  assert.equal(watched.phase, 'arrival');
  assert.match(watched.caption, /bell of San Fernando/, 'the caption does not tell the bell');
  assert.ok(watched.lines.includes('The enemy are in view!'), `the sentry's cry was not sent: ${watched.lines.join(' | ')}`);
  await inside.waitForTimeout(1200);
  await shot(inside, 'bell-1366');
  const reportsNow = await known(inside);
  const arrival = reportsNow.reports.find(report => report.topicId === 'bexar-arrival');
  assert.ok(arrival && new RegExp(man.name).test(arrival.source), 'the family does not know it on the day, through its man');
  assert.match(arrival.text, /The enemy are in view/);
  ok(`Watch framed Béxar in the "${watched.phase}" phase: "${watched.caption.slice(0, 120)}…", with "${watched.lines[0]}"; hh-1's reports have it from "${arrival.source}"`);

  // The Host's banner.
  await host.waitForFunction(() => /bell of San Fernando/.test(document.querySelector('#host-spotlight-text')?.textContent || '') && !document.querySelector('#host-spotlight').hidden, null, { timeout: 30000 });
  ok(`the Host's banner: "${await host.locator('#host-spotlight-text').innerText()}"`);
  await shot(host, 'host');

  // The family in the colonies: nothing, now.
  const far = await known(faraway);
  assert.ok(!far.alert && !far.battle, 'the family with nobody near Béxar was sent the bell');
  assert.ok(far.reports.every(report => report.topicId !== 'bexar-arrival'), 'the family in the colonies knew on the day');
  assert.ok(!far.said.some(event => event.minute >= last.minute && /bell|Alamo|Béxar/.test(event.text)), 'the family in the colonies was told on the day');
  await fits(faraway, 1024);
  await shot(faraway, 'colonies-1024');
  ok(`on ${far.date} hh-2 in the colonies has no card, no battle, no report and nothing in its journal of it; nothing sideways at 1024x768`);
  await host.locator('#host-controls [data-action="resume"]').click();
  await inside.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 10000 });

  // ---------------------------------------------------------------- the rider
  await faraway.waitForFunction(() => (window.__snapshot.world.reports || []).some(report => report.topicId === 'bexar-arrival'), null, { timeout: 600000 });
  const told = await known(faraway);
  const word = told.reports.find(report => report.topicId === 'bexar-arrival');
  assert.match(word.text, /enemy in large force is in sight/);
  assert.match(told.date, /1836-02-2[5-6]/, `the colonies heard on ${told.date}`);
  await faraway.locator('#reports').waitFor({ state: 'attached' });
  await fits(faraway, 1024);
  await shot(faraway, 'rider-1024');
  ok(`hh-2 heard only when the riders came, on ${told.date}, from "${word.source}": "${word.text.slice(0, 120)}…"`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  evidence.verdict = 'PASS';
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/bexar-alarm-browser.json`);
} catch (error) {
  evidence.verdict = 'FAIL'; evidence.failure = error.message;
  throw error;
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(evidence.verdict === 'PASS' ? 'docs/evidence/bexar-alarm-browser.json' : 'test-results/bexar-alarm-browser-failed.json', `${JSON.stringify({
    record: 'bexar-alarm-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 (hh-1) and 1024x768 (hh-2), 300 ms a tick. A real class on the colonies map with rolled families, played in process through the first period and into the winter; the father of hh-1 set in the garrison at Béxar in process; hh-2 kept at home. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
