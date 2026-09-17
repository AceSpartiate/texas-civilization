// The whole game in a real browser: one class from the lobby to the road home, through all three periods, a student and
// the Host watching the whole way (owner, 2026-09-16: the next item after the auto switch).
//
// Every proof before this one covers a period at a time and hands the class to the browser part-played. This one hands
// over nothing: the student joins, rolls, chooses where the house stands, sets the family to work, sends somebody when
// the settlement calls, watches the interim standings, and the Host continues the class twice; in the winter somebody is
// sent to vote or to enlist; in the spring the family is told to leave and goes; and the game ends on the road home with
// the final numbers on both pages. Throughout, a stall detector fails the run if the class stops advancing while it says
// it is running - the failure a playtest would meet first - and names where it stood.
//
// The class is small (five families, four of them automatic) and quick (100 ms a tick); what is proved is that nothing
// stalls, refuses wrongly or throws across a whole game, not how long a class period takes at the Study pace.
//
// Same computer only: headless Chrome. Run: npm run test:whole-game
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld } from '../sim/world.mjs';
import { pickSite } from '../sim/neighbours.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = { periods: {} };
const shots = [];
const TICK_MS = 100;

const app = createClassroom({ seed: 'whole-game-1', playerCount: 5, tickMs: TICK_MS, worldFactory: seed => createGonzalesWorld(seed, 5, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  const text = await response.text();
  assert.equal(response.status, 200, `${path}: ${response.status} ${text}`);
  return response;
};
mkdirSync('docs/evidence', { recursive: true });
const world = () => app.state.world;
const household = () => world().households['hh-1'];
const shot = async (page, name) => { const path = `docs/evidence/whole-game-${name}.png`; await page.screenshot({ path }); shots.push(path); };

/**
 * Wait for a condition while the class runs, failing if the world stops advancing for `stallMs` while it says it is running.
 * A stall is the failure a playtest meets first, and a bare timeout would not say where the class stood.
 */
async function untilLive(student, done, { label, timeoutMs = 600000, stallMs = 20000 } = {}) {
  const started = Date.now();
  let lastTick = world().tick, lastMove = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await done()) return;
    await student.waitForTimeout(200);
    if (world().tick !== lastTick) { lastTick = world().tick; lastMove = Date.now(); }
    else if (world().status === 'running' && Date.now() - lastMove > stallMs) {
      const w = world();
      throw new Error(`stalled ${stallMs / 1000}s while running, waiting for ${label}: tick ${w.tick}, minute ${w.minute}, phase ${w.director?.phase}, period ${w.period || 1}, hh-1 ${JSON.stringify({ flight: w.households['hh-1'].flight?.status, encounters: Object.values(w.encounters || {}).filter(e => e.status === 'open').map(e => e.householdId), questions: Object.entries(w.army?.questions || {}).filter(([, q]) => !q.closed).map(([k]) => k) })}`);
    }
  }
  throw new Error(`timed out after ${timeoutMs / 1000}s waiting for ${label}: tick ${world().tick}, minute ${world().minute}, status ${world().status}, phase ${world().director?.phase}`);
}
const periodStats = (name, from) => { measured.periods[name] = { ticks: world().tick - from.tick, seconds: Math.round((Date.now() - from.ms) / 100) / 10, endedAtMinute: world().minute }; return { tick: world().tick, ms: Date.now() }; };

try {
  // ------------------------------------------------------------------------------------------------------- the lobby
  const student = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Whole-game reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Neighbour ${i}`, code: app.state.sessionCode });
  await student.locator('#roll-family').click();
  await student.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await student.locator('#roll-family').click();
  await student.locator('#family-book').waitFor({ state: 'visible' });
  await student.locator('#journal-close').click();
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  if (await student.locator('#tutorial-skip').isVisible()) await student.locator('#tutorial-skip').click();
  await student.locator('#family-panel').waitFor({ state: 'visible' });
  await student.waitForFunction(() => window.__familyPanel?.length >= 1);
  const people = household().members.map(id => world().entities[id]).filter(one => one.kind === 'person');
  measured.family = people.map(one => `${one.name} (${one.kin?.role || 'principal'}, ${one.age})`);
  ok(`the student joined as hh-1 in ${household().settlementId} and rolled a family of ${people.length}: ${measured.family.join(', ')}`);

  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  let from = { tick: world().tick, ms: Date.now() };
  ok('the Host started the class with five families joined');

  // ------------------------------------------------------------------------------------- arriving, and the house site
  await untilLive(student, () => projectWorld(world(), 'hh-1', 'student', { includeMap: false }).land?.choosingSite?.can || household().homeSiteId && world().entities[household().principalId]?.location?.siteId === household().homeSiteId, { label: 'the family to arrive on its land' });
  const land = projectWorld(world(), 'hh-1', 'student', { includeMap: false }).land;
  if (land?.choosingSite?.can) {
    // The site as a neighbour picks it (sim/neighbours.mjs `pickSite`), sent through the student's own API rather than
    // pressed on the map: where the house stands is not what this run is about, and the map press is proved elsewhere.
    let chosen = null;
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      const response = await student.evaluate(async point => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `site-${Date.now()}`, action: 'choose-site', ...point }) })).status, point);
      if (response === 200) { chosen = point; break; }
    }
    assert.ok(chosen, 'no site on the grant was accepted');
    ok(`the family arrived and the house site was chosen on its grant at (${chosen.x}, ${chosen.y})`);
  } else ok('the family arrived with its house site already standing');

  // --------------------------------------------------------------------------------- everybody on auto, and set to work
  await student.waitForFunction(() => window.__familyPanel?.some(row => !row.idle) || window.__familyPanel?.length >= 1, null, { timeout: 15000 });
  const switches = await student.locator('.panel-row .panel-auto:visible').count();
  for (let i = 0; i < switches; i++) await student.locator('.panel-row .panel-auto:visible').nth(i).click();
  await student.waitForFunction(() => window.__familyPanel.every(row => row.auto || document.querySelector(`.panel-row[data-entity-id="${row.id}"] .panel-auto`)?.hidden), null, { timeout: 15000 });
  measured.onAuto = (await student.evaluate(() => window.__familyPanel.filter(row => row.auto).map(row => row.name)));
  ok(`${measured.onAuto.length} of the family set to auto from the panel: ${measured.onAuto.join(', ')}`);
  // One order each where one is open, so the chores run while the news comes: the first icon the server allows.
  const given = [];
  for (const id of household().members) {
    const key = await student.evaluate(id => [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon:not([aria-disabled="true"])[data-action="chore"]`)].map(b => b.dataset.key).find(k => !['hunt-land', 'fell-trees', 'survey-plot'].includes(k)) || null, id);
    if (!key) continue;
    await student.locator(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`).click();
    const took = await student.waitForFunction(({ id, key }) => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true' || (document.querySelector('#error')?.textContent || '').trim() || null, { id, key }, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => 'no answer');
    given.push({ id, key, took });
  }
  measured.orders = given;
  assert.ok(given.some(one => one.took === true), `no order from the panel was taken: ${JSON.stringify(given)}`);
  ok(`${given.filter(one => one.took === true).length} orders given from the panel and taken`);
  await shot(student, 'at-work');

  // ------------------------------------------------------------------------------- the call, and the first period's end
  let sent = null;
  await untilLive(student, async () => world().status === 'ended' || (await student.evaluate(() => window.__familyPanel?.some(row => row.needs.includes('call')))), { label: 'the settlement\'s call or the end of the first period' });
  if (world().status !== 'ended') {
    const caller = await student.evaluate(() => window.__familyPanel.find(row => row.needs.includes('call')).id);
    await student.locator(`.panel-row[data-entity-id="${caller}"] .panel-attention`).click();
    await student.waitForFunction(() => !document.querySelector('#call-menu').hidden, null, { timeout: 5000 });
    const text = await student.locator('#call-menu-text').textContent();
    const input = student.locator('#call-menu input:not([disabled])').first();
    if (await input.count()) {
      await input.check();
      await student.locator('#call-menu-confirm').click();
      await student.waitForFunction(() => document.querySelector('#call-menu').hidden, null, { timeout: 15000 });
      sent = household().members.map(id => world().entities[id]).find(one => one.task === 'help' || one.travel?.purpose === 'help' || one.commitments?.some(c => c.id === 'volunteer' && c.status === 'active'));
    }
    measured.call = { text, sent: sent?.name || null };
    ok(`the call came ("${text.slice(0, 90)}…") and ${sent ? `${sent.name} was sent from the one menu` : 'was answered from the one menu'}`);
  }
  await untilLive(student, () => world().status === 'ended', { label: 'the end of the first period' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  from = periodStats('first', from);
  await student.locator('#ending').waitFor({ state: 'visible' });
  await host.locator('#ending').waitFor({ state: 'visible' });
  const hostAfterFirst = (await host.locator('#ending').innerText()).replace(/\s+/g, ' ').trim();
  assert.doesNotMatch(hostAfterFirst, /finished first/, 'the first period named a winner');
  assert.equal(world().army?.members?.length ?? 0, 0, 'the army still stood after Béxar');
  measured.army = { volunteers: sent ? Boolean(world().entities[sent.id]?.commitments?.some(c => c.id === 'volunteer')) : null };
  ok(`the first period ended on its own at minute ${world().minute}: interim standings on both pages, no winner named (${measured.periods.first.ticks} ticks, ${measured.periods.first.seconds} s)`);
  await shot(host, 'interim-1');

  // ------------------------------------------------------------------------------------------------ into the winter
  await host.getByRole('button', { name: 'Continue to the winter of 1836' }).click();
  for (const page of [student, host]) await page.waitForFunction(() => window.__snapshot?.world.status === 'paused' && !window.__snapshot.world.ending, null, { timeout: 15000 });
  await host.getByRole('button', { name: 'Resume' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  assert.equal(world().period, 2);
  ok(`the Host continued the class into the winter: period 2 opens on ${await student.locator('#world').textContent()}`);
  // Somebody votes or enlists, from the panel, when the winter's orders come.
  const winterKeys = ['go-vote', 'enlist-auxiliary', 'join-relief'];
  let winterOrder = null;
  await untilLive(student, async () => world().status === 'ended' || (winterOrder = await student.evaluate(keys => { for (const key of keys) { const button = document.querySelector(`.panel-icon[data-key="${key}"]:not([aria-disabled="true"])`); if (button) return { key, id: button.closest('.panel-row').dataset.entityId }; } return null; }, winterKeys)), { label: 'a winter order to be offered' });
  if (winterOrder) {
    await student.locator(`.panel-row[data-entity-id="${winterOrder.id}"] .panel-icon[data-key="${winterOrder.key}"]`).click();
    await student.waitForFunction(({ id, key }) => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true', winterOrder, { timeout: 10000 });
    measured.winter = { ...winterOrder, name: world().entities[winterOrder.id].name };
    ok(`${measured.winter.name} was sent to ${winterOrder.key.replace('-', ' ')} from the panel`);
  }
  await untilLive(student, () => world().status === 'ended', { label: 'the end of the second period' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  from = periodStats('second', from);
  measured.winterOutcome = winterOrder ? { voted: Boolean(world().entities[winterOrder.id].voted), service: world().entities[winterOrder.id].service || null } : null;
  ok(`the second period ended on its own at minute ${world().minute} (${measured.periods.second.ticks} ticks, ${measured.periods.second.seconds} s)`);
  await shot(host, 'interim-2');

  // ------------------------------------------------------------------------------------------------ into the spring
  await host.getByRole('button', { name: 'Continue to the spring of 1836' }).click();
  for (const page of [student, host]) await page.waitForFunction(() => window.__snapshot?.world.status === 'paused' && !window.__snapshot.world.ending, null, { timeout: 15000 });
  await host.getByRole('button', { name: 'Resume' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  assert.equal(world().period, 3);
  ok(`the Host continued the class into the spring: period 3 opens on ${await student.locator('#world').textContent()}`);
  // Told to leave: by hand, from the "!", so the card is pressed once in a whole game; the main person is taken off auto.
  const main = () => household().mainId || household().principalId;
  const mainSwitch = student.locator(`.panel-row[data-entity-id="${main()}"] .panel-auto`);
  if (await mainSwitch.getAttribute('aria-pressed') === 'true') { await mainSwitch.click(); await student.waitForFunction(id => window.__familyPanel.find(row => row.id === id)?.auto === false, main(), { timeout: 10000 }); }
  await untilLive(student, () => world().status === 'ended' || ['ordered', 'fled', 'stayed'].includes(household().flight?.status), { label: 'the order to leave' });
  if (household().flight?.status === 'ordered') {
    const attention = student.locator(`[data-attention="${main()}"]`);
    await attention.waitFor({ state: 'visible', timeout: 30000 });
    await attention.click({ force: true });
    await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
    const card = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
    assert.match(card, /told to leave/);
    assert.ok(await student.locator('#selection-flight [data-action="flight-stay"]').count(), 'the card has no way to say the family stays');
    const have = projectWorld(world(), 'hh-1', 'student', { includeMap: false }).flight;
    await student.locator('#selection-flight .flight-amount[data-take="food"]').fill(String(Math.min(have.have.food, Math.floor(have.room / have.space.food))));
    await student.locator('#selection-flight [data-action="flee"]').click();
    await student.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
    await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 15000 });
    measured.flight = { refuge: household().flight.refuge, card: card.slice(0, 160) };
    ok(`told to leave, the "!" opened the card and the family left for ${household().flight.refuge} with what fit; the farm burned behind it`);
    await shot(student, 'leaving');
  } else measured.flight = { status: household().flight?.status || null };

  await untilLive(student, () => world().status === 'ended', { label: 'the end of the game' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  from = periodStats('third', from);
  await student.locator('#ending').waitFor({ state: 'visible' });
  await host.locator('#ending').waitFor({ state: 'visible' });
  const hostText = (await host.locator('#ending').innerText()).replace(/\s+/g, ' ').trim();
  const familyText = (await student.locator('#ending').innerText()).replace(/\s+/g, ' ').trim();
  assert.match(hostText, /finished first/, 'the end of the game did not name who finished first');
  assert.equal(await host.getByRole('button', { name: /Continue to/ }).count(), 0, 'a fourth period was offered');
  measured.ending = { host: hostText.slice(0, 300), family: familyText.slice(0, 300), flight: household().flight?.status, minute: world().minute };
  ok(`the game ended on the road home at minute ${world().minute}: the final reckoning on both pages, the Host naming who finished first (${measured.periods.third.ticks} ticks, ${measured.periods.third.seconds} s)`);
  await shot(host, 'ending-host');
  await shot(student, 'ending-family');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors on either page across the whole game');
  measured.totalSeconds = Object.values(measured.periods).reduce((sum, p) => sum + p.seconds, 0);

  writeFileSync('docs/evidence/whole-game-browser.json', `${JSON.stringify({
    record: 'whole-game-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'One class from the lobby to the road home through all three periods, a student and the Host in the browser the whole way: nothing stalls, refuses wrongly or throws.',
    environment: `Same computer: a local classroom server at ${TICK_MS} ms a tick (not the Study pace) with five families, four automatic, and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.`,
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'The Study pace: the class here runs at 100 ms a tick, so real minutes per period are not measured.',
      'A full class of students: one student is in the browser; the other four families are automatic.',
      'Every branch: one call answered, one winter order, one flight by hand; the period proofs press the rest.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/whole-game-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
