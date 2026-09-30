// Tips at first meeting, in a real browser (owner, 2026-09-28: "Short tips at first meeting" - the first time each new thing
// appears, a one-line tip shows what to do and what it costs; nothing blocks play; each tip shown once). The same day the
// owner switched the guided start off ("The starting tutorial needs to be removed for now"; sim/lesson.mjs `LESSON_ENABLED`),
// so these tips are the only guidance a new student is given.
//
// tests/tips.test.mjs, tests/need-ranking.test.mjs and tests/lesson-off.test.mjs prove the rules. What only a browser shows is here:
//
// 1. **The first period, at 1366x768.** No guided start and no old walk-through: on the road in, the arrival's tip; on the land,
//    how to give an order. The settlement's call reaches the family: the call's tip is on the screen, above the action bar and
//    clear of the family's column, its words letting a click through to the map, and on the Host's page nothing. The student
//    puts it away with the keyboard (Tab to "Got it", Escape); the server keeps it; a reload with the call still open does not
//    show it again. In the first hour nothing says "Not yet": the sick are nursed, food got, enlisting and the well answered by
//    their own rules.
// 2. **The spring, at 1024x768 on a touch screen.** The family is told to leave: the flight's tip, and the "!" on the main
//    person ranked first with the time it has left; put away with a tap. On the road, the route's tip. Then Santa Anna's
//    dragoons: "¡Alto!" and its tip, tapped away; a reload while the soldiers are still waiting shows none of the three again.
//
// Same computer only: headless Chrome. Run: npm run test:tips
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld } from '../sim/world.mjs';
import { orderOut } from '../sim/scrape.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { spring, SPRING_SEED } from '../tests/support/scrape-spring.mjs';
import { sceneFor } from '../tests/support/scrape-scene.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { heardOut } from '../tests/support/heard-out.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/tips-${name}.png`; await page.screenshot({ path }); shots.push(path); };

/** Wait as a page waits, and fail in words a check can be recognised by (scripts/tips-injections.mjs). */
async function until(page, message, fn, arg, options = { timeout: 30000 }) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}
/** The tip on the screen, as drawn: which, its words, where, and what a press at the middle of its words reaches. */
const tipNow = page => page.evaluate(() => {
  const inline = document.querySelector('#errand-tip');
  const tip = inline && !inline.hidden ? inline : document.querySelector('#tip');
  if (!tip || tip.hidden) return { id: window.__tip ?? null, shown: false };
  const box = one => { const r = one?.getBoundingClientRect(); return r && r.width ? { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) } : null; };
  const words = tip.querySelector('.tip-words'), at = box(tip), wordsAt = box(words);
  const hit = document.elementFromPoint((wordsAt.left + wordsAt.right) / 2, (wordsAt.top + wordsAt.bottom) / 2);
  const over = (a, b) => Boolean(a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
  const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons');
  const column = document.querySelector('#family-panel');
  const style = getComputedStyle(words);
  return {
    id: window.__tip, shown: true, text: words.textContent, box: at,
    fontPx: parseFloat(style.fontSize), onScreen: at.left >= 0 && at.top >= 0 && at.right <= innerWidth && at.bottom <= innerHeight,
    wordsPassThrough: hit?.id === 'world-map', reachedWords: hit ? `${hit.closest('[id]') ? `#${hit.closest('[id]').id} ` : ''}${hit.className || hit.tagName}` : null,
    overBar: over(at, box(bar)), overColumn: innerWidth > 760 && over(at, box(column)), overStrip: over(at, box(document.querySelector('#lesson:not([hidden])'))),
    closeReached: (() => { const close = tip.querySelector('.tip-close'), r = close.getBoundingClientRect(); const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return on === close || close.contains(on); })(),
  };
});
/** Put away every tip that is not the one this check is waiting for, until that one is on the screen. */
async function waitForTip(page, id, message) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const now = await page.evaluate(() => window.__tip ?? null);
    if (now === id) return tipNow(page);
    if (now) { await page.locator('#tip:not([hidden]) .tip-close, #errand-tip:not([hidden]) .tip-close').first().click(); observed.putAwayOnTheWay = [...(observed.putAwayOnTheWay || []), now]; }
    await page.waitForTimeout(400);
  }
  throw new assert.AssertionError({ message: `${message}: the tip on the screen is ${await page.evaluate(() => window.__tip ?? null)}` });
}
const seenOnServer = (world, id) => world.households['hh-1'].tipsSeen || [];
const command = (page, input) => page.evaluate(async body => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}${Date.now()}`, ...body }) });
  return { status: response.status, error: (await response.json()).error || '' };
}, input);
const noSideways = async (page, where) => { const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over <= 1, `${where}: the page scrolls sideways by ${over}px`); };
/** Every placement check a tip over the map must pass: on the screen, readable, on nothing it could hide, and letting clicks through. */
function placed(where, tip) {
  assert.equal(tip.onScreen, true, `${where}: the tip hangs off the screen at ${JSON.stringify(tip.box)}`);
  assert.ok(tip.fontPx >= 13, `${where}: the tip is ${tip.fontPx}px, too small to read on a Chromebook`);
  assert.equal(tip.overBar, false, `${where}: the tip is drawn on the action bar`);
  assert.equal(tip.overColumn, false, `${where}: the tip is drawn on the family's column`);
  assert.equal(tip.overStrip, false, `${where}: the tip is drawn on the guided start`);
  assert.equal(tip.wordsPassThrough, true, `${where}: a click on the tip's words reaches ${tip.reachedWords}, not the map - the tip blocks play`);
  assert.equal(tip.closeReached, true, `${where}: something is drawn over "Got it"`);
}

// =============================================================================================== 1. the first period
let first = null;
/**
 * The Tips button and its list (owner, 2026-09-29, triage D16): reached with the keyboard or a finger, it lists every tip put
 * away, the latest first, never the guided start's; it stands clear of the bar, the column and the map's buttons; reading it
 * sends nothing and shows no tip again; Escape (or its ×) closes it and gives the keyboard back to the button.
 */
async function tipsList(page, how, { expectFirst, expect = [] }) {
  const sent = [];
  const onRequest = request => { if (request.method() === 'POST' && request.url().includes('/api/command')) sent.push(request.postData()); };
  const shownBefore = await page.evaluate(() => (window.__tipsShown || []).length);
  await until(page, 'the Tips button never showed after a tip was put away', () => { const button = document.querySelector('#tips-toggle'); return button && !button.hidden && button.getBoundingClientRect().width > 0; });
  page.on('request', onRequest);
  if (how === 'keyboard') {
    await page.locator('#tips-toggle').focus();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'tips-toggle', 'the keyboard cannot reach the Tips button');
    await page.keyboard.press('Enter');
  } else await page.locator('#tips-toggle').tap();
  await until(page, `the tips list did not open (${how})`, () => !document.querySelector('#tips-list').hidden);
  await page.waitForTimeout(400);
  const list = await page.evaluate(() => {
    const box = one => { const r = one?.getBoundingClientRect(); return r && r.width > 1 ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null; };
    const over = (a, b) => Boolean(a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
    const at = box(document.querySelector('#tips-list'));
    const others = { bar: '.panel-row[data-focused=true] .panel-icons', column: '#family-panel', 'map buttons': '#map-nav', journal: '#journal-toggle', 'sound button': '#sound-toggle', tip: '#tip', 'person card': '#selection', messages: '#military-notice', 'call menu': '#call-menu' };
    return {
      ids: [...document.querySelectorAll('#tips-list-items li')].map(item => item.dataset.tip),
      words: [...document.querySelectorAll('#tips-list-items li')].map(item => item.textContent),
      covers: Object.entries(others).filter(([, selector]) => { const one = document.querySelector(selector); return one && !one.hidden && getComputedStyle(one).display !== 'none' && over(at, box(one)); }).map(([name]) => name),
      inView: Boolean(at && at.top >= 0 && at.left >= 0 && at.right <= innerWidth && at.bottom <= innerHeight),
      focus: document.activeElement?.id, expanded: document.querySelector('#tips-toggle').getAttribute('aria-expanded'),
    };
  });
  await shot(page, `list-${how}`);
  assert.equal(list.ids[0], expectFirst, `the latest tip put away is not first: ${list.ids.join(', ')}`);
  for (const id of expect) assert.ok(list.ids.includes(id), `the tips list has no ${id}: ${list.ids.join(', ')}`);
  assert.ok(!list.ids.includes('resume') && list.words.every(words => !/tutorial/i.test(words)), 'the tips list brings back the guided start');
  assert.deepEqual(list.covers, [], `the tips list stands on ${list.covers.join(', ')}`);
  assert.ok(list.inView, 'the tips list runs off the screen');
  assert.equal(list.expanded, 'true');
  if (how === 'keyboard') {
    assert.equal(list.focus, 'tips-list-close', 'opened from the keyboard, the list does not take the focus');
    await page.keyboard.press('Escape');
    await until(page, 'Escape did not close the tips list', () => document.querySelector('#tips-list').hidden);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'tips-toggle', 'Escape did not give the keyboard back to the Tips button');
  } else {
    await page.locator('#tips-list-close').tap();
    await until(page, 'a tap on × did not close the tips list', () => document.querySelector('#tips-list').hidden);
  }
  page.off('request', onRequest);
  assert.deepEqual(sent, [], `opening and closing the tips list sent ${sent.join('; ')}`);
  assert.equal(await page.evaluate(() => (window.__tipsShown || []).length), shownBefore, 'reading the tips list put a tip up again');
  observed[`tipsList-${how}`] = list;
  ok(`the Tips button by ${how}: ${list.ids.length} tips put away, "${list.ids[0]}" first, none of the guided start's; clear of the bar, the column and the map's buttons; nothing sent, no tip shown again; closed by ${how === 'keyboard' ? 'Escape, the keyboard back on the button' : 'a tap on ×'}`);
}

async function firstPeriod() {
  const app = createClassroom({ seed: 'tips-first', playerCount: 5, tickMs: 4000, worldFactory: seed => (first = createGonzalesWorld(seed, 5, { map: 'colonies' })) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const world = () => first;
  const household = () => world().households['hh-1'];
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const student = await context.newPage();
    student.on('pageerror', error => errors.push(`first student: ${error.message}`));
    await student.goto(url);
    await student.locator('[name=name]').fill('Tip reader');
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(student);
    if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
    for (let i = 2; i <= 5; i++) {
      const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
      assert.equal(response.status, 200);
    }
    const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    host.on('pageerror', error => errors.push(`first host: ${error.message}`));
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
    await host.getByRole('button', { name: 'Start' }).click();
    await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
    // ------------------------------------------------------------------------ the start of the game, with no guided start
    // The guided start is switched off (owner, 2026-09-28: "The starting tutorial needs to be removed for now"): on the road in,
    // the first tip, and nothing else - no strip, no old walk-through.
    const arrive = await waitForTip(student, 'arrive', 'the family is on the road in and no tip said so');
    placed('1366, on the road in', arrive);
    observed.start = await student.evaluate(() => ({ lesson: 'lesson' in window.__snapshot.world, strip: !document.querySelector('#lesson').hidden, walkThrough: !document.querySelector('#tutorial').hidden, resume: !document.querySelector('#lesson-resume').hidden }));
    assert.deepEqual(observed.start, { lesson: false, strip: false, walkThrough: false, resume: false }, 'a tutorial is still on the screen');
    await student.locator('#tip .tip-close').click();
    ok(`no guided start and no walk-through: the first thing said is the arrival's tip ("${arrive.text}")`);
    // In to the land and the house site chosen where the family's mark stands, as a student would.
    for (let t = 0; t < 4000 && household().arriving; t++) stepWorld(world());
    if (household().choosingSite) { const mark = world().map.sites[household().homeSiteId]; chooseSite(world(), household(), { x: mark.x, y: mark.y }); }
    const order = await waitForTip(student, 'order', 'the family reached its land and no tip said how to give an order');
    placed('1366, on the land', order);
    assert.match(order.text, /job along the bottom/);
    await student.locator('#tip .tip-close').click();
    ok(`on the land, how to give an order: "${order.text}"`);

    // ------------------------------------------------------------- the house, the field and going to town (owner, 2026-09-28)
    // Each the first time the family can do it, one after another, over the map; and none over a popup the student opened.
    const house = await waitForTip(student, 'house', 'the family is camped on its land and no tip said how to get a house up');
    placed('1366, the house', house);
    await shot(student, 'house');
    // "Choose a house" pressed while the house's tip stands: the plan opens and the tip waits behind it, not over it.
    const opener = student.locator('#house-open');
    await opener.waitFor({ state: 'visible', timeout: 15000 });
    await opener.click();
    await until(student, 'the house plan did not open', () => ['#house-plan', '#house-plot'].some(one => document.querySelector(one) && !document.querySelector(one).hidden));
    await student.waitForTimeout(1300);
    observed.houseHeld = await student.evaluate(() => ({ tipHidden: document.querySelector('#tip').hidden, standing: window.__tip, seen: (window.__snapshot.world.household.tipsSeen || []).includes('house') }));
    observed.houseHeld.over = await student.evaluate(() => { const t = document.querySelector('#tip'); if (t.hidden) return false; const a = t.getBoundingClientRect(); return ['#house-plan', '#house-plot'].map(s => document.querySelector(s)).filter(p => p && !p.hidden).some(p => { const b = p.getBoundingClientRect(); return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; }); });
    assert.equal(observed.houseHeld.over, false, 'a tip stands over the open house plan');
    assert.equal(observed.houseHeld.seen, false, 'opening the plan put the house tip away unread');
    await student.locator('#house-close:visible, #plot-close:visible').first().click();
    await until(student, 'the house tip did not come back when the plan closed', () => window.__tip === 'house' && !document.querySelector('#tip').hidden);
    await student.locator('#tip .tip-close').click();
    ok(`the house: "${house.text}" - and with the plan open, the tip waited behind it and came back when it closed`);
    const field = await waitForTip(student, 'field', 'the family can plant and no tip said how to farm');
    placed('1366, the field', field);
    await student.locator('#tip .tip-close').click();
    const town = await waitForTip(student, 'town', 'the family can go to town and no tip said what it costs');
    placed('1366, going to town', town);
    await student.locator('#tip .tip-close').click();
    observed.farm = { house: house.text, field: field.text, town: town.text };
    ok(`the field: "${field.text}"; going to town: "${town.text}"`);

    // ------------------------------------------------------------------------------------------- the call's tip
    for (let t = 0; t < 9000 && !(world().calls?.['hh-1']?.status === 'open'); t++) stepWorld(world());
    assert.equal(world().calls?.['hh-1']?.status, 'open', 'no settlement call ever reached the family, so this proves nothing');
    // The call waits behind the rider who brought the word (owner, 2026-09-29, docs/COLONIES.md §5.4b): he is heard out first.
    heardOut(world(), 'hh-1');
    const call = await waitForTip(student, 'call', 'the call reached the family and no tip said what to do');
    placed('1366, the call', call);
    assert.match(call.text, /tick who goes/);
    assert.match(call.text, /5 minutes/);
    observed.call = call;
    await until(student, 'the call has no "!"', () => [...document.querySelectorAll('.panel-attention')].some(one => !one.hidden));
    await shot(student, 'call');
    ok(`the call's tip is on the screen: "${call.text}" - above the bar, clear of the column and the guided start, ${call.fontPx}px, and a click on its words reaches the map`);
    assert.equal(await host.evaluate(() => Boolean(document.querySelector('#tip') && !document.querySelector('#tip').hidden) || Boolean(window.__tip)), false, 'the Host\'s page - the projector - shows a tip');
    ok('the Host\'s page shows no tip');

    // Put away with the keyboard: Tab reaches "Got it", and Escape puts the tip away.
    await student.locator('#tip .tip-close').focus();
    assert.equal(await student.evaluate(() => document.activeElement?.classList.contains('tip-close')), true, 'the keyboard cannot reach "Got it"');
    await student.keyboard.press('Escape');
    await until(student, 'Escape did not put the tip away', () => window.__tip !== 'call' && !(window.__tipsShown || []).slice(-1).includes('call'));
    for (let i = 0; i < 40 && !seenOnServer(world()).includes('call'); i++) await student.waitForTimeout(100);
    assert.ok(seenOnServer(world()).includes('call'), `the server did not keep the call's tip as seen: ${JSON.stringify(seenOnServer(world()))}`);
    ok('Escape put the tip away, and the server keeps it as seen');
    await student.reload();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await student.waitForTimeout(2500);
    assert.equal(world().calls['hh-1'].status, 'open', 'the call closed before the reload, so this proves nothing');
    assert.ok(!(await student.evaluate(() => window.__tipsShown || [])).includes('call'), 'the reload showed the call\'s tip again');
    ok('after a reload, with the call still open, its tip is not shown again');

    // --------------------------------------------------------------- the Tips button (owner, 2026-09-29, triage D16), keyboard
    await tipsList(student, 'keyboard', { expectFirst: 'call' });
    assert.equal(await host.locator('#tips-toggle').isVisible(), false, 'the Host\'s page has a Tips button');
    ok('the Host\'s page has no Tips button');

    // ------------------------------------------------------------------------------- nothing refuses a new family anything
    // With the guided start off, a family in its first hour is refused nothing by it: the sick nursed, food got, the enlisting
    // answered by its own rule, and the farm's later work (the well) open as well.
    // Grown people not called aside by a child with nothing to do (sim/aside.mjs: that has its own refusal, and its own tip).
    const people = household().members.map(id => world().entities[id]).filter(one => one.kind === 'person' && (one.age ?? 30) >= 16 && one.health.condition !== 'dead')
      .sort((a, b) => Number(Boolean(a.aside)) - Number(Boolean(b.aside)));
    // The children given something to do, as the "child" tip says, so nobody is called aside while this is asked.
    for (const child of household().members.map(id => world().entities[id]).filter(one => one.kind === 'person' && one.talk)) {
      await command(student, { action: 'chore', chore: 'child-play', entityId: child.id });
    }
    const [sick, nurse, hunter] = people;
    sick.health = { condition: 'sick', recoversAt: world().minute + 2 * 1440 };
    for (const one of [nurse, hunter]) if (one?.chore) await command(student, { action: 'stop-chore', entityId: one.id });
    const nursed = await command(student, { action: 'chore', chore: 'nurse-home', entityId: nurse.id });
    assert.equal(nursed.status, 200, `nursing the sick was refused: ${nursed.error}`);
    const fed = hunter ? await command(student, { action: 'chore', chore: 'take-small-game', entityId: hunter.id }) : { status: 200 };
    assert.doesNotMatch(fed.error || '', /Not yet/, `going out for food was refused by a guided start: ${fed.error}`);
    // Called off the pot first, so what answers the enlisting is the enlisting's own rule and not a busy man.
    if (hunter) await command(student, { action: 'stop-chore', entityId: hunter.id });
    const enlisted = await command(student, { action: 'chore', chore: 'enlist-regular', entityId: (hunter || nurse).id });
    assert.doesNotMatch(enlisted.error || '', /Not yet/, `enlisting was refused by a guided start: ${enlisted.error}`);
    const well = await command(student, { action: 'chore', chore: 'dig-well', entityId: (hunter || nurse).id });
    assert.doesNotMatch(well.error || '', /Not yet/, `the farm's later work was refused by a guided start: ${well.error}`);
    observed.gate = { stored: world().households['hh-1'].lesson ?? null, nursed, fed, enlisted, well };
    assert.equal(observed.gate.stored, null, 'a lesson was stored for the family');
    ok(`in the first hour, nothing says "Not yet": nursing the sick goes through, food ${fed.status === 200 ? 'goes through' : `is refused only for its own reason ("${fed.error}")`}, enlisting ${enlisted.status === 200 ? 'goes through' : `only for its own reason ("${enlisted.error}")`}, the well ${well.status === 200 ? 'goes through' : `only for its own reason ("${well.error}")`}`);
    await until(student, 'the sickness has no tip', () => window.__tip === 'sick' || (window.__tipsShown || []).includes('sick'));
    observed.sick = await tipNow(student);
    await noSideways(student, 'the first period');
    await host.close();
  } finally {
    await app.close?.();
  }
}

// ======================================================================================================= 2. the spring
let live = null;
function spring14() {
  const world = live = spring();
  const household = world.households['hh-1'];
  // At home, and not told to leave yet: the order is given in the proof, where the student can see it arrive.
  delete household.flight;
  const home = world.map.sites[household.homeSiteId];
  for (const id of [...household.members, ...(household.property || [])]) {
    const one = world.entities[id];
    if (!one || one.service?.status === 'serving' || ['dead', 'captured'].includes(one.health?.condition)) continue;
    one.travel = null; one.chore = null; if (one.kind === 'person') { one.task = 'rest'; one.health = { condition: 'well' }; }
    one.location = { x: home.x, y: home.y, siteId: home.id };
  }
  household.mainId = household.members.find(id => world.entities[id].principal);
  if (household.choosingSite) chooseSite(world, household, { x: home.x, y: home.y });
  world.status = 'lobby';
  return world;
}
async function theSpring() {
  const app = createClassroom({ seed: SPRING_SEED, playerCount: 8, tickMs: 10000, worldFactory: spring14 });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const world = () => live;
  const household = () => world().households['hh-1'];
  try {
    // A Chromebook with a touch screen at the narrower supported size: every tip here is put away with a tap.
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    const student = await context.newPage();
    student.on('pageerror', error => errors.push(`spring student: ${error.message}`));
    await student.goto(url);
    await student.locator('[name=name]').fill('Spring reader');
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(student);
    for (let i = 2; i <= 8; i++) {
      const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
      assert.equal(response.status, 200);
    }
    const host = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
    host.on('pageerror', error => errors.push(`spring host: ${error.message}`));
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
    await host.getByRole('button', { name: 'Start' }).click();
    await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
    // The old skippable walk-through is offered to a family that joins a class already under way with no guided start;
    // turned down, as a student who knows the game would (scripts/scrape-pursuit-browser-proof.mjs does the same).
    if (await student.locator('#tutorial-skip').isVisible().catch(() => false)) await student.locator('#tutorial-skip').tap();
    app.setPace(2000);

    // ------------------------------------------------------------------------------------- the order to leave
    orderOut(world(), household());
    const flight = await waitForTip(student, 'flight', 'the family was told to leave and no tip said what to do');
    placed('1024 touch, the order to leave', flight);
    assert.match(flight.text, /No answer in time/);
    const main = household().actingId || household().mainId || household().principalId;
    await until(student, 'the order to leave has no "!" ranked first with its time left', id => {
      const mark = document.querySelector(`[data-attention="${id}"]`);
      return mark && !mark.hidden && /\d+ (min|h)|\d+s/.test(mark.querySelector('.panel-attention-badge')?.textContent || '');
    }, main);
    observed.flight = { tip: flight, badge: await student.evaluate(id => document.querySelector(`[data-attention="${id}"] .panel-attention-badge`)?.textContent, main), label: await student.evaluate(id => document.querySelector(`[data-attention="${id}"]`)?.getAttribute('aria-label'), main) };
    assert.match(observed.flight.label, /left/, 'the "!" does not say the time left to a screen reader');
    await shot(student, 'flight');
    await student.locator('#tip .tip-close').tap();
    await until(student, 'a tap did not put the flight\'s tip away', () => window.__tip !== 'flight');
    ok(`the order to leave: its tip ("${flight.text}"), put away with a tap, and the "!" on the main person with "${observed.flight.badge}" left on it`);

    // ---------------------------------------------------------------------------------------- the road, and its tip
    const refuge = await student.evaluate(() => window.__snapshot.world.flight?.refuges?.[0]?.id);
    assert.ok(refuge, 'the family was offered nowhere to make for');
    const left = await command(student, { action: 'flee', entityId: main, take: {}, refuge });
    assert.equal(left.status, 200, `the family could not leave: ${left.error}`);
    const route = await waitForTip(student, 'route', 'the family set out and no tip said how the way east is chosen');
    placed('1024 touch, on the road', route);
    await student.locator('#tip .tip-close').tap();
    await until(student, 'a tap did not put the route\'s tip away', () => window.__tip !== 'route');
    observed.route = route;
    ok(`on the road: the route's tip ("${route.text}"), put away with a tap`);

    // --------------------------------------------------------------------------------------------- the chase
    // Stepped in process to the morning of April 15 and put on the road from Stafford's in front of Santa Anna's dragoons, as
    // scripts/scrape-pursuit-browser-proof.mjs does. Slow while the student reads: the soldiers wait three ticks.
    app.setPace(10000);
    sceneFor(world(), { kind: 'cavalry', how: 'wagon' });
    assert.ok(household().flight.chase, 'the dragoons did not see the family, so this proves nothing');
    const alto = await waitForTip(student, 'alto', 'the soldiers called ¡Alto! and no tip said what to do');
    placed('1024 touch, ¡Alto!', alto);
    assert.match(alto.text, /Halt/);
    const altoMain = household().actingId || household().mainId || household().principalId;
    await until(student, '¡Alto! is not the first "!" with its seconds on it', id => {
      const mark = document.querySelector(`[data-attention="${id}"]`);
      return mark && !mark.hidden && /\d+s|\d+ min/.test(mark.querySelector('.panel-attention-badge')?.textContent || '') && (window.__familyPanel || []).find(row => row.id === id)?.need === 'alto';
    }, altoMain);
    observed.alto = { tip: alto, badge: await student.evaluate(id => document.querySelector(`[data-attention="${id}"] .panel-attention-badge`)?.textContent, altoMain) };
    await shot(student, 'alto');
    await student.locator('#tip .tip-close').tap();
    await until(student, 'a tap did not put ¡Alto!\'s tip away', () => window.__tip !== 'alto');
    ok(`¡Alto!: its tip ("${alto.text}"), the "!" with "${observed.alto.badge}" on it, put away with a tap`);
    for (let i = 0; i < 40 && !['flight', 'route', 'alto'].every(id => (household().tipsSeen || []).includes(id)); i++) await student.waitForTimeout(100);
    assert.deepEqual(['flight', 'route', 'alto'].filter(id => !(household().tipsSeen || []).includes(id)), [], `the server did not keep every tip put away: ${JSON.stringify(household().tipsSeen)}`);

    // A reload while the soldiers are still waiting on the answer: none of the three again.
    const shownBefore = await student.evaluate(() => window.__tipsShown || []);
    const duplicates = shownBefore.filter((id, at) => shownBefore.indexOf(id) !== at);
    assert.deepEqual(duplicates, [], `a tip was shown twice on one page: ${shownBefore.join(', ')}`);
    await student.reload();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await student.waitForTimeout(2500);
    const stillAsked = household().flight?.ask?.id === 'alto';
    const shownAfter = await student.evaluate(() => window.__tipsShown || []);
    assert.deepEqual(shownAfter.filter(id => ['flight', 'route', 'alto', 'call'].includes(id)), [], `the reload showed a tip already seen: ${shownAfter.join(', ')}`);
    observed.reload = { stillAsked, shownBefore, shownAfter };
    ok(`after a reload${stillAsked ? ' with the soldiers still waiting' : ''}, none of the flight, the route or ¡Alto! is shown again (this page showed: ${shownBefore.join(', ')})`);
    assert.equal(await host.evaluate(() => Boolean(window.__tip)), false, 'the Host\'s page showed a tip');
    // The Tips button with a finger: the three put away with a tap, the latest first.
    await tipsList(student, 'touch', { expectFirst: 'alto', expect: ['flight', 'route', 'alto'] });
    await noSideways(student, 'the spring');
    await host.close();
  } finally {
    await app.close?.();
  }
}

try {
  await firstPeriod();
  await theSpring();
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
writeFileSync('docs/evidence/tips-browser.json', `${JSON.stringify({ record: 'tips-browser', date: new Date().toISOString().slice(0, 10), environment: 'Same computer: a local classroom server and headless Chrome, 1366x768 with a keyboard and 1024x768 with a touch screen.', pass, observed, shots }, null, 2)}\n`);
console.log(`\n${pass.length} checks passed. Wrote docs/evidence/tips-browser.json`);
