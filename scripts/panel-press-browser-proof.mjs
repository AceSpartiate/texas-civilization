// Presses at the snapshot boundary: triage 2.14 (2026-10-03), docs/FAMILY_PANEL.md §11.4.
//
// A browser sends no click when the element a press went down on leaves the page before the press comes up, and the family
// panel took icons and rows out from under presses whenever a snapshot changed the bar between pointerdown and click: the tap
// did nothing, and `test:solo-game` passed only on a rerun. tests/panel-press.test.mjs holds the rules (`arrangeChildren`,
// `keepList`, `pressHold`); this is the page, under real snapshots from a real server, pressed the way the failures were.
//
// - **A quiet stretch** first: 20 snapshots with nothing pressed, the elements the page makes counted list by list
//   (docs/PERFORMANCE_RENDER.md, "The household rows kept in place").
// - **The icon taken off the bar under the press, and put back**: the press goes down on the main person's Rest or Work (whichever
//   he is not at); the Host pauses the class, so the server's next snapshot takes that icon off his bar (it is open only while the
//   class runs); the Host resumes and a snapshot puts it back; the press comes up. Every press must reach the icon it went down on
//   and send its order. It is the shape of the solo game's failures - a little one calling the parent aside at the moment of the
//   press empties the bar the same way - made to happen on purpose through the Host's own Pause and Resume.
// - **Held across a tick, with nothing made to happen**: icons and the auto switches pressed down just before a snapshot and let
//   up after it, many times; every one must land.
// - **A tap, then Send, on a touch screen** (triage D17), each tap held across the same pause and resume: the first tap arms
//   the popup and sends nothing, the popup stays through further snapshots, and the second tap sends.
//
// Run: npm run test:panel-press
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const PAUSED_PRESSES = Number(process.env.PANEL_PRESS_PAUSED || 12), TICK_PRESSES = Number(process.env.PANEL_PRESS_TICKS || 24), TAPS = Number(process.env.PANEL_PRESS_TAPS || 3);

// The family-panel proof's class (seed panel-3: both parents and four children), at a quick tick so snapshots stream.
const app = createClassroom({ seed: 'panel-3', playerCount: 5, tickMs: 250, worldFactory: (seed, count) => { const world = createGonzalesWorld(seed, count); world.households['hh-1'].resources.powder += 4; return world; } });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status} ${await response.text().catch(() => '')}`);
  return response;
};
const world = () => app.state.world;
mkdirSync('test-results', { recursive: true });

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  // A touch screen that also has a mouse, as a touch Chromebook is: the mouse presses send at once, the taps arm first.
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const commands = [];
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/api/command')) { try { commands.push(JSON.parse(request.postData())); } catch { /* not JSON */ } }
  });

  await page.goto(url);
  await page.locator('[name=name]').fill('Press reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await page.waitForFunction(() => window.__snapshot.world.entities.filter(e => e.kind === 'person').every(e => !e.travel), null, { timeout: 30000 });
  // The guided start shuts all but its one step; this is about presses, so it is stopped as a student may stop it.
  if (await page.evaluate(() => 'lesson' in window.__snapshot.world && !document.querySelector('#lesson-stop')?.hidden)) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  }
  const studentCookie = (await context.cookies()).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

  // ---------------------------------------------------------------------------------- a quiet stretch, nothing pressed
  // The elements the page makes while nothing is pressed, list by list (docs/PERFORMANCE_RENDER.md, "DOM rebuilds"): the journal's
  // roster, who is here, the family's goods and the story were made afresh on every snapshot.
  const QUIET = 20;
  const quiet = await page.evaluate(async ticks => {
    const lists = ['#family', '#others', '#property', '#event-log', '#family-rows', '#call-menu-rows'];
    const made = Object.fromEntries([...lists, 'page'].map(name => [name, 0]));
    // Made: an element the page had never had (a new one); put back: one it had, taken off and put in again, counted apart.
    const known = new WeakSet(document.querySelectorAll('*'));
    let putBack = 0;
    const watcher = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        const fresh = [node, ...node.querySelectorAll('*')].filter(one => !known.has(one));
        for (const one of fresh) known.add(one);
        if (!fresh.length) { putBack++; continue; }
        made.page += fresh.length;
        const list = lists.find(selector => node.parentElement?.closest(selector));
        if (!list) continue;
        made[list] += fresh.length;
        const what = `${node.tagName.toLowerCase()}.${node.className}`;
        (made.what ??= {})[what] = (made.what[what] || 0) + 1;
      }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
    const from = window.__snapshot.world.tick, began = performance.now();
    await new Promise(resolve => { const look = () => (window.__snapshot.world.tick - from >= ticks ? resolve() : setTimeout(look, 50)); look(); });
    watcher.disconnect();
    return { snapshots: window.__snapshot.world.tick - from, seconds: Math.round((performance.now() - began) / 100) / 10, made, putBack };
  }, QUIET);
  measured.quiet = quiet;
  console.log('quiet stretch:', JSON.stringify(quiet));
  assert.equal(quiet.made['#family'], 0, `the journal's roster made ${quiet.made['#family']} elements in ${quiet.snapshots} quiet snapshots`);
  assert.equal(quiet.made['#property'], 0, `the family's goods made ${quiet.made['#property']} elements in ${quiet.snapshots} quiet snapshots`);
  ok(`${quiet.snapshots} quiet snapshots (${quiet.seconds} s): the journal's roster and the family's goods made no elements; the whole page made ${quiet.made.page} and put back ${quiet.putBack} it had (${Object.entries(quiet.made).filter(([name, count]) => name !== 'page' && name !== 'what' && count).map(([name, count]) => `${name} ${count}`).join(', ') || 'none in the lists'}${quiet.made.what ? `: ${Object.entries(quiet.made.what).map(([what, count]) => `${count} ${what}`).join(', ')}` : ''})`);

  // Every click the browser delivers to an icon, a switch or a star, as it arrives: what "the press landed" means here.
  // And every snapshot the panel draws, counted, so a press can be held across one.
  await page.evaluate(() => {
    window.__landed = [];
    addEventListener('click', event => {
      const hit = event.target.closest?.('.panel-icon, .panel-auto');
      if (hit) window.__landed.push({ key: hit.dataset.key || 'auto', entityId: hit.dataset.entityId || hit.dataset.auto, connected: hit.isConnected });
    }, true);
    // What each press went down on, and whether it was still on the page and under the pointer when it came up: said on a failure.
    addEventListener('pointerdown', event => { const hit = event.target.closest?.('.panel-icon, .panel-auto'); window.__downOn = { node: event.target, on: `${event.target.tagName}.${event.target.className}`, hit: hit ? hit.dataset.key || `auto:${hit.dataset.auto}` : null }; }, true);
    addEventListener('pointerup', event => { const down = window.__downOn; if (down?.node) window.__downOn = { on: down.on, hit: down.hit, up: `${event.target.tagName}.${event.target.className}`, connected: down.node.isConnected, same: down.node === event.target || down.node.contains(event.target) || event.target.contains(down.node) }; }, true);
    // Counted as the page takes each one in (`render` sets it, then draws everything from it in the same task).
    let shown = window.__snapshot;
    window.__panelDrawn = 0;
    Object.defineProperty(window, '__snapshot', { configurable: true, get: () => shown, set: value => { shown = value; window.__panelDrawn++; } });
  });
  const landed = () => page.evaluate(() => window.__landed.length);
  // The orders the page sent since `from`, waited for until one is `key` (a tip being marked seen may go first), at most 2 s.
  const orderOf = one => (one.action === 'chore' ? one.chore : one.action);
  const sentSince = async (from, key) => {
    for (let i = 0; i < 40 && !commands.slice(from).some(one => orderOf(one) === key); i++) await page.waitForTimeout(50);
    return commands.slice(from).map(orderOf);
  };
  /** Wait until the page has drawn, after `since` snapshots, a snapshot in which the class is paused or running, or the father free. */
  const drawnWhen = (state, label, since = 0) => page.waitForFunction(([want, at]) => {
    if (!(window.__panelDrawn > at)) return false;
    const world = window.__snapshot.world, one = world.entities.find(e => e.id === world.household.principalId);
    return want === 'paused' || want === 'running' ? world.status === want : Boolean(one && !one.chore && !one.travel && world.status === 'running');
  }, [state, since], { timeout: 15000 }).catch(error => { throw new Error(`${label}: ${error.message.split('\n')[0]}`); });

  // The father, main.
  const father = world().households['hh-1'].principalId;
  await asMain(page, father);
  // An icon that sends at once and is not what he is at now: Rest or Work about the place, whichever is not glowing. One that is
  // not glowing is open only while the class runs, so a paused snapshot takes it off his bar (`panelActions`, `barIcons`).
  const pickIcon = () => page.evaluate(id => {
    const open = key => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]:not([aria-disabled="true"]):not([data-active="true"])`);
    return ['rest', 'work'].find(open) || null;
  }, father);
  const doingNow = () => page.evaluate(id => { const one = window.__snapshot.world.entities.find(e => e.id === id); return `${one?.task}:${one?.chore?.id || ''}`; }, father);
  const settle = async () => {
    // Back to nothing, so the next press finds the same bar: whatever the last press set him to is stopped, as a student would.
    if (world().entities[father].chore) await post('/api/command', { id: `proof-stop-${crypto.randomUUID()}`, action: 'stop-chore', entityId: father }, studentCookie).catch(() => {});
    await drawnWhen('free', 'the father free again', await page.evaluate(() => window.__panelDrawn));
  };
  const iconBox = async key => {
    const box = await page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="${key}"]`).boundingBox();
    assert.ok(box, `the father's ${key} is not on the screen`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  /** The Host pauses the class under the press and resumes it: two snapshots drawn, the first with nothing on his bar to press. */
  const pauseAndBack = async task => {
    const at = await page.evaluate(() => window.__panelDrawn);
    await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
    await drawnWhen('paused', 'the snapshot of the class paused', at);
    // What that snapshot made of the icon under the finger: not open (the class is paused), and he is at what he was at when it was
    // chosen for not glowing - so it is not on the server's bar. Only the press kept it on the screen.
    const gone = await page.evaluate(([id, was]) => { const world = window.__snapshot.world, one = world.entities.find(e => e.id === id); return world.status === 'paused' && `${one?.task}:${one?.chore?.id || ''}` === was; }, [father, task]);
    const back = await page.evaluate(() => window.__panelDrawn);
    await post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, hostCookie);
    await drawnWhen('running', 'the snapshot of the class resumed', back);
    return { gone };
  };

  // --------------------------------------------------------------------- the bar emptied and filled again under the press
  await settle();
  const pausedRuns = [];
  // Until that many presses had their icon taken off the bar under them: one whose person took it up on his own a moment before
  // the pause (Rest, as the evening comes) kept it, and is pressed and counted but does not count toward them.
  for (let press = 0; pausedRuns.filter(run => run.offTheBar).length < PAUSED_PRESSES; press++) {
    assert.ok(press < PAUSED_PRESSES * 3, `only ${pausedRuns.filter(run => run.offTheBar).length} of ${press} paused snapshots took the pressed icon off the bar`);
    const key = await pickIcon();
    assert.ok(key, 'the father has nothing on his bar that sends at once');
    const task = await doingNow();
    const node = await page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="${key}"]`).elementHandle();
    const point = await iconBox(key);
    const before = { landed: await landed(), commands: commands.length };
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    const paused = await pauseAndBack(task);
    // The node pressed is still on the page, the same node, after both snapshots: nothing took it from under the finger.
    const same = await node.evaluate(button => button.isConnected);
    await page.mouse.up();
    const got = await page.waitForFunction(n => window.__landed.length > n, before.landed, { timeout: 3000 }).then(() => true, () => false);
    const sent = await sentSince(before.commands, key);
    pausedRuns.push({ key, landed: got, sameNode: same, offTheBar: paused.gone, sent });
    assert.ok(got, `press ${press + 1} on ${key}, held while the class was paused and resumed: the click never reached the icon (${JSON.stringify(pausedRuns.at(-1))})`);
    assert.ok(sent.includes(key), `press ${press + 1} on ${key} landed but sent no order: ${JSON.stringify(sent)}`);
    await settle();
  }
  measured.emptiedAndFilled = pausedRuns;
  ok(`${pausedRuns.length} presses (${PAUSED_PRESSES} of them on an icon the paused snapshot took off the bar) on the father's ${[...new Set(pausedRuns.map(run => run.key))].join(', ')} held across the snapshot that took it off his bar (the class paused) and the one that gave it back (resumed): every click reached the same icon, and every order was sent`);

  // ---------------------------------------------------------------------- held across a tick, nothing made to happen
  const autoIds = await page.evaluate(() => [...document.querySelectorAll('.panel-row .panel-auto')].filter(button => !button.hidden && button.getBoundingClientRect().width > 0).map(button => button.dataset.auto));
  const tickRuns = [];
  let missed = 0;
  for (let press = 0; press < TICK_PRESSES; press++) {
    const onSwitch = press % 2 === 1 && autoIds.length;
    const target = onSwitch ? page.locator(`.panel-auto[data-auto="${autoIds[press % autoIds.length]}"]`) : page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="${await pickIcon()}"]`);
    await target.scrollIntoViewIfNeeded().catch(() => {});
    const before = await landed();
    // Down just after a snapshot is drawn (measured then, where it stands), and up after the next is drawn.
    const at = await page.evaluate(() => window.__panelDrawn);
    await page.waitForFunction(n => window.__panelDrawn > n, at, { timeout: 5000 });
    const box = await target.boundingBox();
    assert.ok(box, `press ${press + 1}: nothing to press`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const held = await page.evaluate(() => window.__panelDrawn);
    await page.waitForFunction(n => window.__panelDrawn > n, held, { timeout: 5000 });
    await page.mouse.up();
    const got = await page.waitForFunction(n => window.__landed.length > n, before, { timeout: 3000 }).then(() => true, () => false);
    // A press that went down on something else - the row moved between its measure and the press, a tick of 250 ms - is aimed again,
    // and not counted: it says nothing of a press kept under the finger.
    if (!got && !(await page.evaluate(() => window.__downOn?.hit))) { missed++; press--; assert.ok(missed < 8, 'eight presses in a row went down beside what they aimed at'); continue; }
    tickRuns.push({ on: onSwitch ? 'auto' : 'icon', landed: got });
    const down = got ? null : await page.evaluate(() => window.__downOn);
    assert.ok(got, `press ${press + 1} (${onSwitch ? 'an auto switch' : 'an icon'}) held across a snapshot never reached what was pressed: ${JSON.stringify(down)}`);
    if (!onSwitch) await settle();
  }
  // Every switch back as it was found.
  for (const id of autoIds) if (world().entities[id]?.auto) await post('/api/command', { id: `proof-auto-${crypto.randomUUID()}`, action: 'set-auto', entityId: id, on: false }, studentCookie).catch(() => {});
  measured.heldAcrossATick = { missedAndAimedAgain: missed, presses: tickRuns.length, landed: tickRuns.filter(run => run.landed).length, switches: tickRuns.filter(run => run.on === 'auto').length };
  ok(`${TICK_PRESSES} presses each held across a snapshot (icons and the rows' auto switches): all ${tickRuns.length} landed`);
  await settle();

  // ---------------------------------------------------------------------------------- a tap, then Send, under the same
  const cdp = await context.newCDPSession(page);
  // A touch held down longer than a tap is not a tap, and makes no click - on a real screen as here: Chrome sends none for a touch
  // down more than 800 ms, and turns a longer one into a long press. The pause and resume under the finger can take that long on
  // a loaded computer, so a tap held more than 600 ms (or that became a long press) and did nothing is made again, and counted
  // apart: it says nothing of a press kept under the finger.
  await page.evaluate(() => { window.__longPresses = 0; addEventListener('contextmenu', () => { window.__longPresses++; }, true); });
  let longPresses = 0;
  const tapAcross = async point => {
    const was = await page.evaluate(() => window.__longPresses);
    const began = Date.now();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
    await pauseAndBack(await doingNow());
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const held = Date.now() - began;
    await page.waitForTimeout(150);
    return { held, long: (await page.evaluate(() => window.__longPresses)) > was };
  };
  /** Tap until a tap is not a long press and `done()` says it did its work, at most four times; the last tap's account. */
  const tapUntil = async (point, done, label) => {
    for (let tries = 0; ; tries++) {
      const tap = await tapAcross(point);
      if (await done()) return tap;
      if (!(tap.long || tap.held > 600) || tries >= 3) {
        // Where the tap went and what the page made of it, for the reader of a failure.
        const page_ = await page.evaluate(() => ({ landed: window.__landed.slice(-3), down: window.__downOn && { on: window.__downOn.on, hit: window.__downOn.hit, up: window.__downOn.up, connected: window.__downOn.connected }, armed: window.__panelArmed || 0,
          tip: { shown: !document.querySelector('#panel-tip').hidden, armed: document.querySelector('#panel-tip').dataset.armed, name: document.querySelector('#panel-tip-name').textContent }, status: window.__snapshot.world.status, error: document.querySelector('#error')?.textContent || '' }));
        throw new Error(`${label} (held ${tap.held} ms, ${tap.long ? 'a long press' : 'no long press'}; ${JSON.stringify(page_)})`);
      }
      longPresses++;
    }
  };
  const tapRuns = [];
  for (let tap = 0; tap < TAPS; tap++) {
    const key = await pickIcon();
    const point = await iconBox(key);
    const before = { commands: commands.length, armed: await page.evaluate(() => window.__panelArmed || 0) };
    const first = await tapUntil(point, () => page.waitForFunction(n => (window.__panelArmed || 0) > n, before.armed, { timeout: 2000 }).then(() => true, () => false),
      `tap ${tap + 1} on ${key}, held while the class was paused and resumed: the popup was not armed`);
    assert.ok(!commands.slice(before.commands).some(one => orderOf(one) === key), `the first tap on ${key} sent its order`);
    // The popup stays armed through more snapshots: a tick does not close it.
    const at = await page.evaluate(() => window.__panelDrawn);
    await page.waitForFunction(n => window.__panelDrawn > n + 2, at, { timeout: 5000 });
    const tip = await page.evaluate(() => ({ shown: !document.querySelector('#panel-tip').hidden, armed: document.querySelector('#panel-tip').dataset.armed, name: document.querySelector('#panel-tip-name').textContent }));
    assert.ok(tip.shown && tip.armed === 'true', `the armed popup for ${key} did not stay through three snapshots: ${JSON.stringify(tip)}`);
    // Where the icon stands now, as a student looks again before the second tap: the bar is centred, and moves when it gains or
    // loses an icon (seen: the second tap landing on the map beside where Rest had been).
    const second = await tapUntil(await iconBox(key), async () => (await sentSince(before.commands, key)).includes(key),
      `the second tap on ${key}, held across the same snapshots, sent nothing: ${JSON.stringify(commands.slice(before.commands).map(orderOf))}`);
    const sent = commands.slice(before.commands).map(orderOf);
    tapRuns.push({ key, popup: tip.name, sent, heldMs: [first.held, second.held] });
    await settle();
  }
  measured.tapThenSend = { taps: tapRuns, tooLongTappedAgain: longPresses };
  ok(`on a touch screen, ${TAPS} times: a first tap on ${tapRuns.map(run => `"${run.popup}"`).join(', ')} held across a pause and resume armed its popup and sent nothing, the popup stayed armed through three more, and a second tap held the same way sent it`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/panel-press-browser.json', `${JSON.stringify({
    record: 'panel-press-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'Triage 2.14: presses on the family panel held across snapshots that change it - the bar emptied (the class paused) and filled again (resumed) under the press, plain ticks, and tap-then-send on a touch screen - each must reach what was pressed.',
    environment: 'Same computer: an in-process classroom at 250 ms a tick with five families, headless Chrome at 1366x768 with touch emulated (CDP touch events) and a mouse. The bar is emptied and filled by the Host’s Pause and Resume, sent between the press going down and coming up.',
    checks: pass,
    measured,
    notProved: [
      'A real touch Chromebook, its tap timing and a classroom network: the touch here is emulated.',
      'Presses on other pages and popups than the family panel, its call menu and the journal lists.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/panel-press-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
