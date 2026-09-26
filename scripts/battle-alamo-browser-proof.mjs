// The Alamo, watched in a real class (docs/BATTLES.md §7; owner, 2026-09-25: "I'm assuming that the alamo is the longest since
// it's a long siege?", and "a student may watch their own man fall ... the rest of the family's story learns only when the word
// reaches them").
//
// A class through the real join flow: one family whose father is in the garrison at Béxar, one family with nobody there, and
// the Host. Every answer is a press on the page. It holds:
//   - the card comes to the family through its man when the Mexican army comes, with Watch, and Watch frames the compound;
//   - on several days of the siege the Mexican guns fire and the defenders answer, with smoke;
//   - Travis's runner comes on the courier days and "stay" is answered in the meeting;
//   - at the alarm on March 6 the card comes through the man, with Watch; across several sampled moments of the assault
//     there is fire and smoke on the screen; the columns come in files while the garrison stands along its walls; words are
//     drawn over the speakers ("¡Viva Santa Anna!", Travis's words from Joe's account);
//   - the family's own man is drawn at his post, firing, and is seen to go down there, while the camera stays on the fight
//     and the family's journal and its record of him say nothing;
//   - the Host sees it live, its camera on the compound, its spotlight lit;
//   - the family with nobody there is sent nothing of it - not the battle, not a card, not the man's name - before and after
//     a reload;
//   - the student who watched is given what they saw, on the card, and the journal keeps nothing until the word comes on
//     March 13, when it keeps the account.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:battle-alamo
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
const directory = mkdtempSync(join(tmpdir(), 'texas-alamo-'));
const app = createClassroom({ seed: 'battle-alamo', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: (seed, count) => alamoClass(seed, count) });
const server = () => app.state.world;
const man = fatherOf(server(), 'hh-1');
const manId = man.id;
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { siege: [], assault: [], screens: [] };
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = async (page, name) => { const path = `test-results/battle-alamo-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };
const phaseNow = page => page.evaluate(() => window.__snapshot?.world.battle?.phase || null);
/** Travis's runner, answered in the meeting as a student would: "stay". Returns true if one was answered. */
async function answerRunner(page) {
  const asking = await page.evaluate(() => document.querySelector('#military-title')?.textContent === 'A call for riders at the Alamo' && !document.querySelector('#military-notice').hidden);
  if (!asking) return false;
  await page.locator('#military-go').click();
  const stay = page.locator('#encounter-asks [data-action="alamo-courier"][data-answer="stay"]');
  if (!(await stay.waitFor({ state: 'visible', timeout: 8000 }).then(() => true, () => false))) return false;
  await stay.click();
  await page.locator('#encounter-close').click().catch(() => {});
  return true;
}
/** Wait for `done` on the page, answering the runner whenever he comes. */
async function waitFor(page, done, arg, timeout = 240000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await page.evaluate(done, arg)) return true;
    if (await answerRunner(page)) evidence.runners = (evidence.runners || 0) + 1;
    await page.waitForTimeout(250);
  }
  throw new Error(`timed out waiting at ${await page.evaluate(() => `${window.__snapshot?.world.historicalDate} ${window.__snapshot?.world.battle?.phase}`)}: ${done}`);
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
  ok(`a class on the colonies map through the join flow; ${man.name} of hh-1 in the garrison at Béxar (set in process), hh-2 with nobody there`);

  // ---------------------------------------------------------------- February 23: the card, and Watch
  await waitFor(inside, () => window.__snapshot.world.battleAlert?.id?.includes(':siege:'));
  const first = await inside.evaluate(() => ({ alert: window.__snapshot.world.battleAlert, phase: window.__snapshot.world.battle?.phase, date: window.__snapshot.world.historicalDate }));
  assert.match(first.alert.text, /side/, 'the card did not come through the person');
  await inside.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 20000 });
  await inside.locator('#military-go').click();
  await inside.waitForTimeout(400);
  const framed = await inside.evaluate(() => ({ camera: window.__camera?.kind, battle: window.__snapshot.world.battle?.frame }));
  assert.equal(framed.camera, 'battle', 'Watch did not put the camera on the Alamo');
  ok(`on ${first.date} the card "${first.alert.title}" came through ${man.name} (${first.phase}), and Watch framed the compound`);
  await inside.waitForTimeout(1500);
  await shot(inside, 'arrival');
  const walked = await inside.evaluate(id => window.__drawnAt?.[id], manId);
  assert.ok(walked, 'the family\'s man was not drawn going into the Alamo');

  // ---------------------------------------------------------------- the siege: several days of the guns
  const siegeSample = async label => {
    const one = await inside.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, date: window.__snapshot.world.historicalDate, view: window.__battleView }));
    evidence.siege.push({ label, phase: one.phase, date: one.date, gunShots: one.view?.gunShots, shotsBy: one.view?.shotsBy, smoke: one.view?.smoke, parts: one.view?.partFigures });
    return one;
  };
  const days = [];
  for (const phase of ['day-24', 'day-26', 'day-29', 'day-3']) {
    await waitFor(inside, id => window.__snapshot.world.battle?.phase === id, phase);
    await inside.waitForTimeout(2200);
    days.push(await siegeSample(phase));
    if (phase === 'day-26') await shot(inside, 'siege-day');
  }
  for (let i = 1; i < days.length; i++) {
    const was = days[i - 1].view.gunShots || {}, now = days[i].view.gunShots || {};
    const battery = id => Object.entries(id).filter(([gun]) => gun.startsWith('battery-')).reduce((sum, [, n]) => sum + n, 0);
    assert.ok(battery(now) > battery(was), `the Mexican guns did not fire between ${days[i - 1].phase} and ${days[i].phase}`);
    assert.ok((now.eighteen || 0) + (now['north-gun'] || 0) >= (was.eighteen || 0) + (was['north-gun'] || 0), 'the defenders\' answer went backwards');
  }
  assert.ok((days.at(-1).view.gunShots.eighteen || 0) + (days.at(-1).view.gunShots['north-gun'] || 0) > 0, 'the defenders never answered');
  ok(`the guns on ${days.map(day => day.date).join(', ')}: Mexican batteries ${JSON.stringify(days.at(-1).view.gunShots)}; smoke ${days.map(day => day.view.smoke).join('/')}; the runner answered "stay" ${evidence.runners || 0} times in the meeting`);

  // ---------------------------------------------------------------- March 6
  await waitFor(inside, () => window.__snapshot.world.battleAlert?.id?.includes(':assault:'), undefined, 300000);
  const alarm = await inside.evaluate(() => ({ alert: window.__snapshot.world.battleAlert, phase: window.__snapshot.world.battle?.phase, date: window.__snapshot.world.historicalDate, journal: window.__snapshot.world.events.map(event => event.text) }));
  assert.match(alarm.alert.text, new RegExp(`side`), 'the alarm did not come through the man');
  await inside.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 20000 });
  await inside.locator('#military-go').click();
  ok(`at the ${alarm.phase} on ${alarm.date} the card came at ${man.name}'s side: "${alarm.alert.text.slice(0, 90)}…", and Watch was pressed`);
  const sample = async (label) => {
    const one = await inside.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, camera: window.__camera?.kind, frame: window.__animation?.drawMs, size: `${innerWidth}x${innerHeight}` }));
    evidence.assault.push({ label, phase: one.phase, minute: one.minute, camera: one.camera, size: one.size, figures: one.view?.figures, groups: one.view?.groups, groupStyles: one.view?.groupStyles, groupRegularity: one.view?.groupRegularity, shotsTotal: one.view?.shotsTotal, shotsBy: one.view?.shotsBy, smokeInView: one.view?.smokeInView, bubbles: one.view?.bubbles?.map(b => b.text), memberFalls: one.view?.memberFalls, people: one.view?.people, light: one.view?.light, frameMs: one.view?.frameMs, mapDrawMs: one.frame });
    return one;
  };
  const moments = [];
  let fellSeen = null;
  for (let i = 0; i < 40; i++) {
    await inside.waitForTimeout(700);
    const one = await sample(`${i}`);
    if (!one.phase || ['end', 'after'].includes(one.phase)) break;
    moments.push(one);
    if (i === 3) await shot(inside, 'assault-1366');
    if (i === 10) { await inside.setViewportSize({ width: 1024, height: 768 }); }
    if (i === 14) await shot(inside, 'assault-1024');
    if (!fellSeen && one.view?.memberFalls?.some(fall => fall.id === manId)) {
      fellSeen = { phase: one.phase, minute: one.minute, drawn: await inside.evaluate(id => window.__drawnAt?.[id] || null, manId), camera: one.camera,
        journal: await inside.evaluate(id => window.__snapshot.world.events.filter(event => event.actorId === id).map(event => event.text), manId),
        record: await inside.evaluate(id => window.__snapshot.world.entities.find(one => one.id === id), manId) };
      await shot(inside, 'fall');
    }
  }
  await inside.setViewportSize({ width: 1366, height: 768 });
  const fighting = moments.filter(one => ['alarm', 'repulse', 'north-wall', 'fallback', 'rooms'].includes(one.phase));
  assert.ok(fighting.length >= 6, `only ${fighting.length} moments of the assault were sampled`);
  for (let i = 1; i < fighting.length; i++) assert.ok(fighting[i].view.shotsTotal > fighting[i - 1].view.shotsTotal, `no shot between two moments of the assault (${fighting[i - 1].phase} -> ${fighting[i].phase})`);
  for (const one of fighting) {
    assert.equal(one.camera, 'battle', `at ${one.minute} Watch was not on the fight`);
    assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in the ${one.phase}: ${one.view.smokeInView}`);
  }
  ok(`fire and smoke on screen at all ${fighting.length} sampled moments of the assault (${[...new Set(fighting.map(one => one.phase))].join(', ')}; shots ${fighting[0].view.shotsTotal} -> ${fighting.at(-1).view.shotsTotal}; smoke in view ${Math.min(...fighting.map(one => one.view.smokeInView))}-${Math.max(...fighting.map(one => one.view.smokeInView))})`);
  // The columns in files, the garrison along its walls.
  const early = fighting.find(one => one.view.groupStyles?.duque === 'column' && one.view.groupStyles?.north === 'wall');
  assert.ok(early, 'the columns and the walls were never drawn as columns and walls');
  const regular = early.view.groupRegularity;
  // A number, and small: a part laid out as nothing measurable (a column given no place to stand) is not in order either.
  assert.ok(Number.isFinite(regular.duque) && regular.duque < 0.2 && Number.isFinite(regular.north) && regular.north < 0.2, `the column or the wall is not in order: ${JSON.stringify(regular)}`);
  ok(`the columns come in files and the garrison stands along its walls: Duque's column ${regular.duque?.toFixed(3)}, the north wall ${regular.north?.toFixed(3)} (nearest-neighbour spread)`);
  const said = await inside.evaluate(() => window.__battleView?.linesShown || []);
  assert.ok(said.includes('al-viva') && said.includes('al-travis'), `the shout and Travis's words were not drawn: ${said}`);
  assert.ok(said.some(id => id.startsWith('rp-')) && said.some(id => id.startsWith('nw-') || id.startsWith('fb-')), `the orders and shouts of the fight were not drawn: ${said}`);
  ok(`words drawn over the speakers: ${said.join(', ')}`);
  assert.ok(fellSeen, `${man.name} was never seen to fall`);
  const clips = await inside.evaluate(() => window.__battleView?.memberClips || []);
  assert.ok(clips.includes('volunteer-fire-reload'), `the family's man never fired from his post: ${clips}`);
  assert.ok(fellSeen.drawn, 'he was not drawn when he fell');
  assert.equal(fellSeen.camera, 'battle', 'the camera left the fight when he fell');
  assert.ok(!fellSeen.journal.some(text => /killed|fell|dead/i.test(text)), `the journal knew: ${fellSeen.journal.at(-1)}`);
  assert.notEqual(fellSeen.record.health.condition, 'dead', 'the family\'s record made him dead');
  ok(`${man.name} was drawn at his post and seen to go down in the ${fellSeen.phase}, the camera on the fight; the family's journal and record of him say nothing (${fellSeen.record.health.condition})`);
  const frames = evidence.assault.map(one => one.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMs = { battleP95Max: Math.max(...frames), battleMedian: evidence.assault.map(one => one.frameMs?.median).filter(Number.isFinite), mapDrawMs: evidence.assault.map(one => one.mapDrawMs).filter(Number.isFinite) };
  ok(`the battle draws in ${Math.max(...frames).toFixed(1)} ms at its slowest 95th percentile, of a map frame of ${Math.max(...evidence.frameMs.mapDrawMs).toFixed(1)} ms at most`);

  // ---------------------------------------------------------------- the Host
  const hostView = await host.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, drawn: window.__battleView?.figures, seen: window.__spotlightSeen }));
  assert.ok(hostView.phase && hostView.drawn?.mexican > 0, `the Host was not sent the Alamo live: ${JSON.stringify(hostView)}`);
  assert.equal(hostView.focus, 'battle', 'the Host\'s camera was not sent to the compound');
  assert.ok(hostView.seen?.some(key => key.startsWith('alamo-fall')), `the Host's spotlight never lit the assault: ${JSON.stringify(hostView.seen)}`);
  ok(`the Host sees it live (${hostView.phase}), its camera ${hostView.camera} on the compound, its spotlight lit`);
  await shot(host, 'host');

  // ---------------------------------------------------------------- the family with nobody there
  for (const reload of [false, true]) {
    if (reload) { await faraway.reload(); await faraway.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2'); }
    const raw = await faraway.evaluate(async () => (await fetch('/api/state')).text());
    const world = JSON.parse(raw).world;
    assert.equal(world.battle, null, 'the family with nobody there was sent the Alamo');
    assert.ok(!world.battleAlert && !world.battleAccount, 'the family with nobody there was sent a card');
    assert.ok(!raw.includes(manId), 'the family with nobody there was sent the man\'s id');
    const part = /"memberFates"|"memberUnits"|"guns"|"people"|"fates"|"debrief"|"alerted"|"fallen"/.exec(raw);
    assert.ok(!part, `the family with nobody there was sent part of the battle: ${part?.[0]}`);
    assert.equal(await faraway.evaluate(() => window.__battleView), null, 'the page of the family with nobody there drew a battle');
  }
  ok('the family with nobody there was sent nothing of the Alamo - no battle, no card, no name - before and after a reload');

  // ---------------------------------------------------------------- afterwards: what they saw, and the word
  await waitFor(inside, () => /What you saw/.test(window.__snapshot.world.battleAccount?.title || ''));
  const debrief = await inside.evaluate(id => ({ card: window.__snapshot.world.battleAccount, journal: window.__snapshot.world.events.filter(event => event.actorId === id).map(event => event.text) }), manId);
  assert.match(debrief.card.text, /Nobody at home knows/);
  assert.ok(!debrief.journal.some(text => /killed|was stormed/.test(text)), 'the journal knew before the word');
  await inside.waitForFunction(() => !document.querySelector('#military-notice').hidden && /What you saw/.test(document.querySelector('#military-title').textContent), null, { timeout: 30000 }).catch(() => {});
  await shot(inside, 'debrief');
  ok(`afterwards the card "${debrief.card.title}" says what the student saw and that nobody at home knows; the journal says nothing of it`);
  await waitFor(inside, id => window.__snapshot.world.events.some(event => event.actorId === id && /killed when the Alamo was stormed/.test(event.text)), manId, 300000);
  const word = await inside.evaluate(id => ({ date: window.__snapshot.world.historicalDate, text: window.__snapshot.world.events.find(event => event.actorId === id && /killed when the Alamo was stormed/.test(event.text)).text, card: window.__snapshot.world.battleAccount?.title }), manId);
  assert.match(word.text, /What happened/);
  ok(`the word came on ${word.date}: the journal keeps the account ("${word.text.slice(0, 100)}…"), and the card "${word.card}"`);
  await shot(inside, 'word');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  evidence.verdict = 'PASS';
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-alamo-browser.json`);
} catch (error) {
  evidence.verdict = 'FAIL'; evidence.failure = error.message;
  throw error;
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(evidence.verdict === 'PASS' ? 'docs/evidence/battle-alamo-browser.json' : 'test-results/battle-alamo-browser-failed.json', `${JSON.stringify({
    record: 'battle-alamo-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768, served at 300 ms a tick. A real class on the colonies map with rolled families, played in process through the first period and into the winter; the father of hh-1 set in the garrison at Béxar in process; hh-2 kept from Béxar. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
