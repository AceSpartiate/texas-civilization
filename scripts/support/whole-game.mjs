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
import { tooYoung } from '../../sim/family.mjs';
import { actingId } from '../../sim/acting.mjs';
import { sendTheWay } from './going.mjs';

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

/** The works that bring food in (sim/gathering.mjs), one of which a grown person is set to (owner, 2026-09-30: a family can starve). */
// The ones that spend no powder first: small game stops when the family's last shot is fired, and a family on auto then starves.
const FOOD_WORK = Object.freeze(['fish-the-water', 'gather-oysters', 'cut-bee-tree', 'take-small-game']);

export async function playWholeGame(ctx) {
  const { app, student, host, ok, measured, shot } = ctx;
  const world = () => app.state.world;
  const household = () => world().households['hh-1'];
  measured.periods ??= {};
  let from = { tick: world().tick, ms: Date.now() };
  const periodStats = name => { measured.periods[name] = { ticks: world().tick - from.tick, seconds: Math.round((Date.now() - from.ms) / 100) / 10, endedAtMinute: world().minute }; from = { tick: world().tick, ms: Date.now() }; };
  // Where the server and the page stood when a step did not come, so a failure reads as the game's state and not a bare timeout.
  const stateOf = async id => {
    const person = world().entities[id], flight = household().flight;
    return {
      tick: world().tick, status: world().status,
      person: person && { chore: person.chore?.id || null, task: person.task, travel: person.travel?.purpose || Boolean(person.travel), aside: person.aside?.kind || null, auto: Boolean(person.auto), service: person.service?.status || null, health: person.health?.condition },
      flight: flight && { status: flight.status, burned: Boolean(flight.burned) }, acting: actingId(world(), household()),
      page: await student.evaluate(id => ({ error: (document.querySelector('#error')?.textContent || '').trim(), going: Boolean(window.__goingPending), needOpened: window.__needOpened || null,
        row: window.__familyPanel?.find(row => row.id === id) && (row => ({ needs: row.needs, auto: row.auto, reason: row.reason, active: row.active }))(window.__familyPanel.find(row => row.id === id)),
        open: ['#selection', '#selection-flight', '#going', '#encounter', '#military-notice', '#call-menu'].filter(s => document.querySelector(s) && !document.querySelector(s).hidden) }), id).catch(() => null),
    };
  };
  // The student's own moments - giving orders, answering the call, the winter's order, the order to leave - are played at the
  // Quick pace, a second a tick, the fastest a class is run at; the stretches between, where the proof only waits for the
  // periods to end, keep the proof's own pace. At a tenth of a second a tick the world moves on under every press: a parent is
  // called aside by a little one, a menu is drawn again, an order is done and gone, the order to leave's day of grace (72 ticks)
  // is 7.2 seconds - and a page slowed by load missed each of them in turn (2026-09-29: a different late step on each run).
  // Nothing checked is changed; the student is given a class's time to do what a student does. Returns the way back.
  const CLASS_PACE_MS = 1000;
  const atClassPace = () => { const was = app.pace; app.setPace(Math.max(was, CLASS_PACE_MS)); return () => app.setPace(was); };
  // A chooser of how they go left open by a refusal is closed, as a student closes it, so it stands over nothing pressed next.
  const closeTheWay = async () => { if (await student.locator('#going').isVisible().catch(() => false)) await student.locator('#going-cancel').click({ timeout: 5000 }).catch(() => {}); };
  // A grown-up the family's little ones have called aside (sim/aside.mjs, docs/CHILDREN.md §3) is refused new work and every
  // journey until the child has something to do, and the row says so: "Give X something to do and Y goes back to work." Every
  // small child here was put on auto at the start, and a child's auto goes off by design (at the day's end since 2026-09-29,
  // sim/child-day.mjs), so at this pace a parent is called aside every few seconds. The proof does what the row says - that
  // child's Auto on again - and waits on the server until the grown-up is free; a baby being held is waited out.
  const freeOfLittleOnes = async id => {
    const pressed = new Set();
    await untilLive(ctx, async () => {
      const w = world(), aside = w.entities[id]?.aside;
      if (!aside || w.status === 'ended') return true;
      for (const child of aside.kind === 'talk' ? aside.childIds || [] : []) {
        if (pressed.has(child) || w.entities[child]?.auto) continue;
        pressed.add(child);
        const toggle = student.locator(`.panel-row[data-entity-id="${child}"] .panel-auto`);
        await toggle.scrollIntoViewIfNeeded().catch(() => {});
        await toggle.click({ timeout: 5000 }).catch(() => pressed.delete(child));
      }
      return false;
    }, { label: `${id} to be free of the little ones`, timeoutMs: 60000 });
  };
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
  // Person by person, each switch pressed once and waited on until the server has them on auto. This pressed the n-th
  // visible switch n times over a list that redraws as each one takes, so a switch could be pressed twice (on, then off) or
  // not at all, and the wait below ran out (seen 2026-09-26).
  // Read by the same rule the check below reads (the switch not hidden), not by what Playwright calls visible - a row scrolled
  // down the column was passed over and left off - and gone over again until nobody who has a switch is left off.
  // A child under ten on auto goes off it by themself after a while - 18 to 56 ticks by their obedience, or sooner when they tire of
  // it (sim/childhood.mjs, FIC-GONZ-479/480) - which on a solo game's fast calendar can be before the check below. So a small child
  // counts once the server has had them on auto, and is not pressed again (seen 2026-09-28: six children "left off").
  const tookSmall = new Set();
  const leftOff = () => student.evaluate(took => window.__familyPanel.filter(row => !row.auto && !took.includes(row.id) && !document.querySelector(`.panel-row[data-entity-id="${row.id}"] .panel-auto`)?.hidden).map(row => row.id), [...tookSmall]);
  for (let pass = 0; pass < 3; pass++) {
    const todo = await leftOff();
    if (!todo.length) break;
    for (const row of todo) {
      const toggle = student.locator(`.panel-row[data-entity-id="${row}"] .panel-auto`);
      await toggle.scrollIntoViewIfNeeded().catch(() => {});
      await toggle.click();
      const took = await student.waitForFunction(id => window.__familyPanel.find(one => one.id === id)?.auto, row, { timeout: 15000 }).then(() => true, () => false);
      if (took && await student.evaluate(id => window.__familyPanel.find(one => one.id === id)?.age < 10, row)) tookSmall.add(row);
    }
  }
  await student.waitForFunction(took => window.__familyPanel.every(row => row.auto || took.includes(row.id) || document.querySelector(`.panel-row[data-entity-id="${row.id}"] .panel-auto`)?.hidden), [...tookSmall], { timeout: 15000 })
    .catch(async error => { throw new Error(`not everybody with a switch is on auto: ${JSON.stringify(await leftOff())}; the page says "${await student.evaluate(() => document.querySelector('#error')?.textContent || '')}" (${error.message.split('\n')[0]})`); });
  measured.onAuto = await student.evaluate(() => window.__familyPanel.filter(row => row.auto).map(row => row.name));
  ok(`${measured.onAuto.length} of the family set to auto from the panel: ${measured.onAuto.join(', ')}`);
  // One order each where one is open, so the chores run while the news comes: the first icon the server allows.
  const given = [], ordersDone = atClassPace();
  // Each person chosen first, as a student does, and their order read off their own bar once they are the main person: the bar
  // draws only what the server and the step allow for the person it belongs to (docs/FAMILY_PANEL.md §12; 8e6ecd5), which is
  // not what a row that is not the main person's holds. Until 2026-09-26 this read the key first, off rows that are never drawn,
  // and chose a child under ten - who can be given the children's works but never be made the main person - and waited out
  // the star, or pressed a key the bar then did not draw.
  for (const id of household().members) {
    const person = world().entities[id];
    if (person?.kind !== 'person' || tooYoung(person) || ['dead', 'captured'].includes(person.health?.condition)) continue;
    await asMain(student, id);
    const keys = await student.evaluate(id => [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon:not([aria-disabled="true"])[data-action="chore"]`)].map(b => b.dataset.key).filter(k => !['hunt-land', 'fell-trees', 'survey-plot'].includes(k)), id);
    // A family can starve since 2026-09-30 (owner; sim/hunger.mjs): one grown person who is not the one the call will take is set
    // to bring food in - fishing, small game, oysters or a bee tree - and keeps at it on auto, as a student who has watched the
    // food gauge would. Until then the first icon of each was pressed, and the family starved by the spring.
    const food = !measured.fisher && id !== household().principalId ? FOOD_WORK.find(k => keys.includes(k)) : null;
    const key = food || keys[0] || null;
    if (!key) continue;
    // The food work is tried again if the press is lost (under load the bar redraws under it, seen 2026-09-30), since the family
    // starves without it; any other order is given once.
    let took = null;
    for (let tries = food ? 3 : 1; tries > 0 && took !== true; tries--) {
      // The icon can go from the bar between reading it and pressing it - the person called aside by a little one, their work
      // changed - and a bar redrawn at every tick of this pace takes it away under the press (seen 2026-09-29 under load: a
      // 30-second wait on a button no longer there). That order is not given; the next person's is.
      if (took !== null) await asMain(student, id);
      const pressed = await student.locator(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`).click({ timeout: 5000 }).then(() => true, () => false);
      if (!pressed) { took = 'gone from the bar before it was pressed'; continue; }
      // A work that is a journey asks how they go first (owner, 2026-09-24): the server's suggestion, as a student most often takes.
      await sendTheWay(student);
      took = await student.waitForFunction(({ id, key }) => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true' || (document.querySelector('#error')?.textContent || '').trim() || null, { id, key }, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => 'no answer');
      await closeTheWay();
    }
    if (food && took === true) measured.fisher = { id, key: food };
    given.push({ id, key, took });
  }
  // The one bringing food in keeps at it on auto (the switch was pressed above for everybody who has one).
  if (measured.fisher && !world().entities[measured.fisher.id]?.auto) {
    const toggle = student.locator(`.panel-row[data-entity-id="${measured.fisher.id}"] .panel-auto`);
    await toggle.scrollIntoViewIfNeeded().catch(() => {});
    await toggle.click({ timeout: 5000 }).catch(() => {});
    await student.waitForFunction(id => window.__familyPanel.find(one => one.id === id)?.auto, measured.fisher.id, { timeout: 15000 }).catch(() => {});
  }
  if (measured.fisher) measured.fisher.auto = Boolean(world().entities[measured.fisher.id]?.auto);
  ordersDone();
  measured.orders = given;
  assert.ok(given.some(one => one.took === true), `no order from the panel was taken: ${JSON.stringify(given)}`);
  ok(`${given.filter(one => one.took === true).length} orders given from the panel and taken`);
  await shot(student, 'at-work');

  // ------------------------------------------------------------------------------- the call, and the first period's end
  let sent = null;
  await untilLive(ctx, async () => world().status === 'ended' || (await student.evaluate(() => window.__familyPanel?.some(row => row.needs.includes('call')))), { label: 'the settlement\'s call or the end of the first period' });
  if (world().status !== 'ended') {
    const callDone = atClassPace();
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
    await student.waitForFunction(() => !document.querySelector('#call-menu').hidden, null, { timeout: 15000 })
      // Said with what the "!" opened and where the call stood, so a failure here reads as the page's state, not a bare timeout.
      .catch(async error => { throw new Error(`the call's menu never opened: ${JSON.stringify(await student.evaluate(id => ({ opened: window.__needOpened || null, request: window.__snapshot.world.request && { id: window.__snapshot.world.request.id, kind: window.__snapshot.world.request.kind }, needs: window.__familyPanel.find(row => row.id === id)?.needs, encounter: !document.querySelector('#encounter')?.hidden, error: document.querySelector('#error')?.textContent || '' }), caller))} (${error.message.split('\n')[0]})`); });
    const text = await student.locator('#call-menu-text').textContent();
    const input = student.locator('#call-menu input:not([disabled])').first();
    if (await input.count()) {
      const goes = await input.getAttribute('data-call-menu-person');
      await input.check();
      // Confirmed once the one who goes is free of the little ones; refused because a child called them aside in between (the
      // menu stays open with the server's words and the tick kept), they are freed again and it is confirmed again.
      let closed = false;
      for (let attempt = 0; attempt < 3 && !closed; attempt++) {
        if (goes) await freeOfLittleOnes(goes);
        await student.locator('#call-menu-confirm').click();
        // Whoever the call sends goes on a road, and since 2026-09-24 that asks how they go first (public/going.js).
        await sendTheWay(student);
        closed = await student.waitForFunction(() => document.querySelector('#call-menu').hidden, null, { timeout: 15000 }).then(() => true, () => false);
        if (!closed) await closeTheWay();
      }
      if (!closed) throw new Error(`the call's menu did not close once confirmed: ${JSON.stringify({ said: await student.locator('#call-menu-said').textContent(), menu: await student.evaluate(() => window.__callMenu), goes: goes && await stateOf(goes) })}`);
      sent = household().members.map(id => world().entities[id]).find(one => one.task === 'help' || one.travel?.purpose === 'help' || one.commitments?.some(c => c.id === 'volunteer' && c.status === 'active'));
    }
    callDone();
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
    const winterDone = atClassPace();
    const { id, key } = winterOrder, before = world().entities[id];
    const was = { chore: before.chore?.id || null, service: before.service?.status || null, voted: Boolean(before.voted) };
    // Taken: its icon glows, or the server already has the person at it or has done it. At this pace enlisting where the
    // committee sits can be over in a tick or two, so the glow alone was a moment a page slowed by load could miss (seen
    // 2026-09-29: the man already serving, the proof still waiting for his icon to light).
    const taken = async () => {
      if (await student.evaluate(({ id, key }) => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true', winterOrder)) return true;
      const now = world().entities[id];
      return (now.chore?.id === key && was.chore !== key) || (key === 'go-vote' ? Boolean(now.voted) && !was.voted : Boolean(now.service?.status) && now.service.status !== was.service);
    };
    let took = false;
    for (let attempt = 0; attempt < 4 && !took && world().status !== 'ended'; attempt++) {
      await freeOfLittleOnes(id);
      await asMain(student, id);
      if (await student.locator(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`).click({ timeout: 5000 }).then(() => true, () => false)) await sendTheWay(student);
      for (const until = Date.now() + 10000; Date.now() < until && !(took = await taken());) await student.waitForTimeout(200);
      if (!took) await closeTheWay();
    }
    if (!took) throw new Error(`the winter order ${JSON.stringify(winterOrder)} was not taken: ${JSON.stringify(await stateOf(id))}`);
    winterDone();
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
  // Nobody of the family starved through the autumn and the winter: one of them was set to bring food in (above).
  const starved = household().members.map(id => world().entities[id]).filter(one => one?.health?.starved).map(one => one.name);
  measured.starved = starved;
  assert.deepEqual(starved, [], `the family starved with ${measured.fisher ? `${world().entities[measured.fisher.id]?.name} on ${measured.fisher.key}` : 'nobody set to bring food in'}`);
  ok(`nobody of the family starved by the spring${measured.fisher ? `, ${world().entities[measured.fisher.id]?.name} bringing food in on ${measured.fisher.key}` : ''}`);
  // Told to leave: by hand, from the "!", so the card is pressed once in a whole game. Whoever answers for the family is taken off
  // auto first, or auto answers the order the tick it comes: since 2026-09-28 that is the one with the family (sim/acting.mjs) -
  // the main person when they are at home, and not a father away with the army, whose "!" carries no order to leave (interactions
  // B1). Until 2026-09-29 this took the main person off auto and pressed his "!", so when the winter's order had sent him to the
  // army the one who answered stayed on auto and the order was answered unseen, or his "!" opened something else and the card
  // never came (seen under load). Who answers can change as people come and go, so it is read again all the while it waits.
  const offAuto = new Set();
  await untilLive(ctx, async () => {
    if (world().status === 'ended' || ['ordered', 'fled', 'stayed'].includes(household().flight?.status)) return true;
    const id = actingId(world(), household());
    if (id && !offAuto.has(id) && world().entities[id]?.auto) {
      const toggle = student.locator(`.panel-row[data-entity-id="${id}"] .panel-auto`);
      await toggle.scrollIntoViewIfNeeded().catch(() => {});
      if (await toggle.getAttribute('aria-pressed').catch(() => null) === 'true' && await toggle.click({ timeout: 5000 }).then(() => true, () => false)) offAuto.add(id);
    }
    return false;
  }, { label: 'the order to leave' });
  if (household().flight?.status === 'ordered') {
    // Read and answered at the class's pace (`atClassPace`): the order's day of grace is 72 ticks (sim/advance.mjs
    // `ORDER_GRACE_MINUTES`), 72 seconds for a student at Quick and 7.2 at this proof's own pace.
    const flightDone = atClassPace();
    try {
      const answering = await student.waitForFunction(() => window.__familyPanel?.find(row => row.need === 'flight')?.id || null, null, { timeout: 30000 }).then(handle => handle.jsonValue())
        .catch(async error => { throw new Error(`no "!" for the order to leave on any row: ${JSON.stringify(await stateOf(actingId(world(), household())))} (${error.message.split('\n')[0]})`); });
      const attention = student.locator(`[data-attention="${answering}"]`);
      await attention.waitFor({ state: 'visible', timeout: 30000 });
      await attention.click({ force: true });
      await student.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 })
        .catch(async error => { throw new Error(`the order to leave's card did not open from ${answering}'s "!": ${JSON.stringify(await stateOf(answering))} (${error.message.split('\n')[0]})`); });
      const card = (await student.locator('#selection-flight').innerText()).replace(/\s+/g, ' ').trim();
      assert.match(card, /told to leave/);
      assert.ok(await student.locator('#selection-flight [data-action="flight-stay"]').count(), 'the card has no way to say the family stays');
      const have = projectWorld(world(), 'hh-1', 'student', { includeMap: false }).flight;
      await student.locator('#selection-flight .flight-amount[data-take="food"]').fill(String(Math.min(have.have.food, Math.floor(have.room / have.space.food))));
      await student.locator('#selection-flight [data-action="flee"]').click();
      await student.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
      await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 15000 })
        .catch(async error => { throw new Error(`the family did not leave: ${JSON.stringify({ flight: household().flight?.status, food: household().resources?.food, said: await student.locator('#error').innerText().catch(() => ''), people: household().members.map(id => { const one = world().entities[id]; return `${one.name}:${one.health?.condition}${one.hunger ? `:${one.hunger.stage}` : ''}`; }) })} (${error.message.split('\n')[0]})`); });
      measured.flight = { answeredBy: answering, refuge: household().flight.refuge, card: card.slice(0, 160) };
      ok(`told to leave, the "!" opened the card and the family left for ${household().flight.refuge} with what fit; the farm burned behind it`);
      await shot(student, 'leaving');
    } finally { flightDone(); }
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
