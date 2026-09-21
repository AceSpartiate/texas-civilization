// The whole game, played from a browser: the part shared by scripts/whole-game-browser-proof.mjs (a class the Host starts)
// and scripts/solo-game-browser-proof.mjs (a solo game dealt already running). From the family's arrival on its land to
// the final reckoning on both pages, through all three periods.
//
// `ctx` is { app, student, host, ok, measured, shot } - the classroom (in process, so the world can be read directly), the
// two pages, and the proof's own recorders. Everything pressed is pressed as a student or the Host presses it.
import assert from 'node:assert/strict';
import { projectWorld } from '../../sim/world.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './main-person.mjs';
import { pickSite } from '../../sim/neighbours.mjs';

/**
 * Wait for a condition while the class runs, failing if the world stops advancing for `stallMs` while it says it is running.
 * A stall is the failure a playtest meets first, and a bare timeout would not say where the class stood.
 */
export async function untilLive(ctx, done, { label, timeoutMs = 600000, stallMs = 20000 } = {}) {
  const world = () => ctx.app.state.world;
  const started = Date.now();
  let lastTick = world().tick, lastMove = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await done()) return;
    await ctx.student.waitForTimeout(200);
    if (world().tick !== lastTick) { lastTick = world().tick; lastMove = Date.now(); }
    else if (world().status === 'running' && Date.now() - lastMove > stallMs) {
      const w = world();
      throw new Error(`stalled ${stallMs / 1000}s while running, waiting for ${label}: tick ${w.tick}, minute ${w.minute}, phase ${w.director?.phase}, period ${w.period || 1}, hh-1 ${JSON.stringify({ flight: w.households['hh-1'].flight?.status, encounters: Object.values(w.encounters || {}).filter(e => e.status === 'open').map(e => e.householdId), questions: Object.entries(w.army?.questions || {}).filter(([, q]) => !q.closed).map(([k]) => k) })}`);
    }
  }
  throw new Error(`timed out after ${timeoutMs / 1000}s waiting for ${label}: tick ${world().tick}, minute ${world().minute}, status ${world().status}, phase ${world().director?.phase}`);
}

export async function playWholeGame(ctx) {
  const { app, student, host, ok, measured, shot } = ctx;
  const world = () => app.state.world;
  const household = () => world().households['hh-1'];
  measured.periods ??= {};
  let from = { tick: world().tick, ms: Date.now() };
  const periodStats = name => { measured.periods[name] = { ticks: world().tick - from.tick, seconds: Math.round((Date.now() - from.ms) / 100) / 10, endedAtMinute: world().minute }; from = { tick: world().tick, ms: Date.now() }; };
  const people = household().members.map(id => world().entities[id]).filter(one => one.kind === 'person');
  measured.family = people.map(one => `${one.name} (${one.kin?.role || 'principal'}, ${one.age})`);

  // ------------------------------------------------------------------------------------- arriving, and the house site
  await untilLive(ctx, () => projectWorld(world(), 'hh-1', 'student', { includeMap: false }).land?.choosingSite?.can || (household().homeSiteId && world().entities[household().principalId]?.location?.siteId === household().homeSiteId), { label: 'the family to arrive on its land' });
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
  await student.locator('#family-panel').waitFor({ state: 'visible' });
  await student.waitForFunction(() => window.__familyPanel?.length >= 1, null, { timeout: 15000 });
  const switches = await student.locator('.panel-row .panel-auto:visible').count();
  for (let i = 0; i < switches; i++) await student.locator('.panel-row .panel-auto:visible').nth(i).click();
  await student.waitForFunction(() => window.__familyPanel.every(row => row.auto || document.querySelector(`.panel-row[data-entity-id="${row.id}"] .panel-auto`)?.hidden), null, { timeout: 15000 });
  measured.onAuto = await student.evaluate(() => window.__familyPanel.filter(row => row.auto).map(row => row.name));
  ok(`${measured.onAuto.length} of the family set to auto from the panel: ${measured.onAuto.join(', ')}`);
  // One order each where one is open, so the chores run while the news comes: the first icon the server allows.
  const given = [];
  for (const id of household().members) {
    const key = await student.evaluate(id => [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon:not([aria-disabled="true"])[data-action="chore"]`)].map(b => b.dataset.key).find(k => !['hunt-land', 'fell-trees', 'survey-plot'].includes(k)) || null, id);
    if (!key) continue;
    await asMain(student, id);
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
  await untilLive(ctx, async () => world().status === 'ended' || (await student.evaluate(() => window.__familyPanel?.some(row => row.needs.includes('call')))), { label: 'the settlement\'s call or the end of the first period' });
  if (world().status !== 'ended') {
    const caller = await student.evaluate(() => window.__familyPanel.find(row => row.needs.includes('call')).id);
    // The "!" opens the first thing waiting on that person (`openNeed`). When the rider who brought the word is still standing
    // with them, that is the conversation, not the call: the student closes it and presses "!" again, so the proof does too.
    // Seen 2026-09-19, when the map's roads moved and the rider was still there as the call opened.
    for (let press = 0; press < 3; press++) {
      await student.locator(`.panel-row[data-entity-id="${caller}"] .panel-attention`).click();
      const opened = await student.evaluate(() => window.__needOpened?.kind);
      if (opened === 'call') break;
      await student.locator('#encounter-close').click({ timeout: 5000 }).catch(() => {});
    }
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
  await untilLive(ctx, () => world().status === 'ended', { label: 'the end of the first period' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  periodStats('first');
  await student.locator('#ending').waitFor({ state: 'visible' });
  await host.locator('#ending').waitFor({ state: 'visible' });
  const hostAfterFirst = (await host.locator('#ending').innerText()).replace(/\s+/g, ' ').trim();
  assert.doesNotMatch(hostAfterFirst, /finished first/, 'the first period named a winner');
  assert.equal(world().army?.members?.length ?? 0, 0, 'the army still stood after Béxar');
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
  await untilLive(ctx, async () => world().status === 'ended' || (winterOrder = await student.evaluate(keys => { for (const key of keys) { const button = document.querySelector(`.panel-icon[data-key="${key}"]:not([aria-disabled="true"])`); if (button) return { key, id: button.closest('.panel-row').dataset.entityId }; } return null; }, winterKeys)), { label: 'a winter order to be offered' });
  if (winterOrder) {
    await asMain(student, winterOrder.id);
    await student.locator(`.panel-row[data-entity-id="${winterOrder.id}"] .panel-icon[data-key="${winterOrder.key}"]`).click();
    await student.waitForFunction(({ id, key }) => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true', winterOrder, { timeout: 10000 });
    measured.winter = { ...winterOrder, name: world().entities[winterOrder.id].name };
    ok(`${measured.winter.name} was sent to ${winterOrder.key.replace('-', ' ')} from the panel`);
  }
  await untilLive(ctx, () => world().status === 'ended', { label: 'the end of the second period' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  periodStats('second');
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
  await untilLive(ctx, () => world().status === 'ended' || ['ordered', 'fled', 'stayed'].includes(household().flight?.status), { label: 'the order to leave' });
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

  await untilLive(ctx, () => world().status === 'ended', { label: 'the end of the game' });
  await student.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  await host.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 30000 });
  periodStats('third');
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
  measured.totalSeconds = Object.values(measured.periods).reduce((sum, p) => sum + p.seconds, 0);
}
