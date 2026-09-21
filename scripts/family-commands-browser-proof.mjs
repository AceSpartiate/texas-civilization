// Commands from the family panel, in a real browser: docs/FAMILY_PANEL.md §11 (owner, 2026-09-16).
//
// "I should be able to use the Family icons and action bars on the left to quickly give characters commands ... If they
// need my attention (for example a rider is trying to talk to them) then there should be an exclamation point there for me
// to click on ... I should also be able to select one character to be focused on."
//
// tests/family-commands.test.mjs proves the rules against the simulation: which needs raise an "!", on whom, that it goes
// when answered, that no family is shown another's, what idle is, and who the main person is. This proves what a student
// does: every person set to work from the panel in a press each, and the panel showing they are busy; a stale order refused
// in the server's words; somebody left idle shown idle; a rider, work that stops to ask, and a neighbour's offer each raising
// an "!" that takes the camera to that person and opens what waits on them, and each "!" going once it is answered; a call's
// "!" opening the one menu with a row per person who may answer (docs/FAMILY_PANEL.md §11.2); the main person chosen with the
// star and held by the server (`set-main`, §11.3) - the journeys, the yard and rest moving to their row and the principal
// refused in the server's words - kept through a reload, their card the one that opens, their House button opening the rooms;
// at 400 px nothing scrolls sideways; and, in a second class on the real land, two of the family ticked in the menu and both
// sent to the settlement's call.
//
// The first class is the invented Gonzales country with every family's cabin standing (set in process, as
// scripts/interior-browser-proof.mjs does, because raising a house takes an afternoon). The next family's student is played
// through the API: its principal is sent to Gonzales and makes the offer there. The second class is played in process to the
// morning San Felipe's call reaches hh-1 and handed over in the lobby, as scripts/army-browser-proof.mjs hands over a class.
//
// Same computer only: headless Chrome. Run: npm run test:family-commands
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { pickSite } from '../sim/neighbours.mjs';
import { meetFamily } from './support/meet-family.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
/** Press somebody's "!", waiting for it: a question answered or withdrawn between the reading and the pressing is not a failure. */
async function pressMark(page, id, how = 'click') {
  const mark = page.locator(`.panel-row[data-entity-id="${id}"] .panel-attention`);
  await mark.waitFor({ state: 'visible', timeout: 20000 });
  await mark[how]();
}
const shot = async (page, name) => { const path = `docs/evidence/family-commands-${name}.png`; await page.screenshot({ path }); shots.push(path); };

function housedClass(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount);
  for (const household of Object.values(world.households)) household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  return world;
}
/**
 * A class on the real land, played in process to the morning its settlement's call reaches hh-1 - the one call a family may
 * send more than one person to (sim/calls.mjs) - and handed to the browser in the lobby, as scripts/army-browser-proof.mjs
 * hands over a class played to the muster. hh-1 is the family the browser joins.
 */
function playedToTheCall(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  for (let i = 0; i < 1500 && !world.calls?.['hh-1'] && !world.director.complete; i++) stepWorld(world);
  // The house site chosen as a neighbour chooses it (sim/neighbours.mjs `pickSite`), so the site chooser is not over the
  // panel on a phone; nothing else is decided for the family.
  const land = projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  if (land?.choosingSite?.can) {
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      try { applyAction(world, 'hh-1', { action: 'choose-site', x: point.x, y: point.y }); break; } catch { /* the next point */ }
    }
  }
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'commands-2', playerCount: 5, tickMs: 250, worldFactory: housedClass });
let app2 = null;
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

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Commander');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  let neighbourCookie = null;
  for (let i = 2; i <= 5; i++) {
    const joined = await post('/api/join', { name: `Neighbour ${i}`, code: app.state.sessionCode });
    if (i === 2) neighbourCookie = joined.headers.get('set-cookie').split(';')[0];
  }
  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  // The family's last name and how the parents look, asked for after the roll (owner, 2026-09-17).
  await meetFamily(page);
  // Put away if they are there; a card that goes by itself between the asking and the pressing is not a failure.
  for (const button of ['#wagon-done', '#tutorial-skip']) {
    if (await page.locator(button).isVisible()) await page.locator(button).click({ timeout: 5000 }).catch(() => {});
  }
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  const principalId = world().households['hh-1'].principalId;
  await page.waitForFunction(() => window.__familyPanel?.length >= 3);

  // ------------------------------------------------------------------------------------------------ the main person, first
  const firstPanel = await page.evaluate(() => window.__familyPanel);
  assert.equal(firstPanel.find(row => row.focused)?.id, principalId, 'before anybody is chosen, the main person is not the principal');
  assert.equal(await page.locator(`.panel-row[data-entity-id="${principalId}"] .panel-focus`).getAttribute('aria-pressed'), 'true');
  // And the household holds nothing: a class that has chosen nobody sends nothing new on the tick (§11.3). Asked here, at
  // the top, rather than beside the star below, because since §12 this proof chooses people as it goes to reach their work.
  assert.equal(world().households['hh-1'].mainId, undefined, 'the server holds a main person before anybody chose one');
  ok(`before anybody is chosen the main person is the principal (${principalId}), starred on the panel, and the household holds nobody`);

  // ------------------------------------------------------------------------------------------------------------ the rider
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // The rider and the mark over the person he stopped, read together: a rider who has been and gone by the time the page is
  // asked again names somebody whose mark is rightly no longer there (found 2026-09-17).
  const listener = await page.waitForFunction(() => {
    const encounter = window.__snapshot?.world.encounter;
    if (encounter?.status !== 'open') return null;
    const row = document.querySelector(`.panel-row[data-entity-id="${encounter.listenerId}"]`);
    const mark = row?.querySelector('.panel-attention');
    return row?.dataset.waiting === 'true' && mark && !mark.hidden && mark.dataset.need === 'rider' ? encounter.listenerId : null;
  }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
  const others = await page.evaluate(id => [...document.querySelectorAll('.panel-row')].filter(row => row.dataset.entityId !== id && row.querySelector('.panel-attention')?.dataset.need === 'rider' && !row.querySelector('.panel-attention').hidden).length, listener);
  assert.equal(others, 0, 'a rider who stopped for one person marks somebody else');
  await page.locator('#map-nav [data-view=gonzales]').click();
  // The mark is waited for again here: the camera and the screenshot above take a moment, and this proof is about pressing it.
  const mark = page.locator(`.panel-row[data-entity-id="${listener}"] .panel-attention`);
  await mark.waitFor({ state: 'visible', timeout: 20000 });
  const riderLabel = await mark.getAttribute('aria-label');
  await mark.click();
  await page.locator('#encounter').waitFor({ state: 'visible' });
  // The mark is pressed before the picture is taken: a rider does not wait for a screenshot.
  await shot(page, 'rider-mark');
  await page.waitForFunction(id => document.querySelector('#map-nav [data-view=follow]')?.textContent.startsWith('Watching'), listener);
  await page.waitForTimeout(400);
  const riderOpened = await page.evaluate(id => {
    const entity = window.__snapshot.world.entities.find(e => e.id === id);
    const camera = window.__camera;
    return { opened: window.__needOpened, miles: Math.hypot(camera.cx - entity.location.x, camera.cy - entity.location.y), card: document.querySelector('#selection').dataset.entityId,
      focusInEncounter: Boolean(document.activeElement?.closest('#encounter')), focused: document.activeElement?.id || document.activeElement?.getAttribute('aria-label') };
  }, listener);
  assert.equal(riderOpened.opened.kind, 'rider');
  assert.ok(riderOpened.miles < 0.05, `the camera is ${riderOpened.miles} miles from ${listener}`);
  assert.equal(riderOpened.card, listener);
  assert.ok(riderOpened.focusInEncounter, 'the keyboard was not put in the conversation');
  measured.rider = { listener, label: riderLabel, ...riderOpened };
  await shot(page, 'rider-opened');
  ok(`a rider stopped for ${listener}: an "!" on that row alone ("${riderLabel}"); pressing it took the camera to them (${riderOpened.miles.toFixed(3)} mi) and opened the conversation, the keyboard on "${riderOpened.focused}"`);
  await page.locator('#encounter .ask-leave').click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden || document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.dataset.need !== 'rider', listener, { timeout: 15000 });
  if (await page.locator('#encounter-close').isVisible()) await page.locator('#encounter-close').click();
  ok('letting the rider ride on clears the "!"');

  // -------------------------------------------------------------------------------------------------------------- a call
  // What the rider brought is followed by the neighbours asking the family for help: every grown person who may answer it
  // has an "!", and any one of them answering clears them all.
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.need === 'call', principalId, { timeout: 90000, polling: 200 });
  const callers = (await page.evaluate(() => window.__familyPanel)).filter(row => row.needs.includes('call')).map(row => row.id);
  const answerers = await page.evaluate(() => Object.keys(window.__snapshot.world.request?.answerers || {}));
  assert.deepEqual([...callers].sort(), [...answerers].sort(), 'the "!" for the call is not on exactly the people the server says may answer it');
  // Any "!" for the call opens the one menu (docs/FAMILY_PANEL.md §11.2): a row per person who may answer, the keyboard on
  // the first. The food call is put to one person, so the rows are a single choice; keeping everybody home is its own button.
  await pressMark(page, callers.at(-1), 'click');
  await page.waitForFunction(() => !document.querySelector('#call-menu').hidden && document.activeElement?.closest?.('#call-menu') && document.activeElement.matches('input'), null, { timeout: 5000 });
  const called = await page.evaluate(() => ({ text: document.querySelector('#call-menu-text')?.textContent, kind: window.__snapshot.world.request.kind, menu: window.__callMenu,
    inputs: [...document.querySelectorAll('#call-menu input')].map(input => input.type), focused: document.activeElement.dataset.callMenuPerson, card: document.querySelector('#selection').dataset.entityId, opened: window.__needOpened }));
  assert.equal(called.card, callers.at(-1), 'the camera and card did not go to the person whose "!" was pressed');
  assert.deepEqual(called.menu.rows.map(row => row.id).sort(), [...answerers].sort(), 'the menu does not list exactly the people the server lets answer');
  assert.equal(called.menu.several, false); assert.ok(called.inputs.every(type => type === 'radio'), `a one-person call offers ${called.inputs}`);
  measured.call = { callers, ...called };
  await shot(page, 'call-opened');
  ok(`a call to the family marks the ${callers.length} people the server lets answer it; pressing ${callers.at(-1)}'s "!" opened the one menu for it ("${called.text}") with a row each, the keyboard on ${called.focused}'s`);
  // Keep everybody home; if nobody is home to say so (the server's rule), send the one the server allows instead.
  const stay = page.locator('#call-menu-stay:not([disabled])');
  if (await stay.count()) { await stay.click(); measured.call.answered = 'nobody goes'; }
  else { await page.locator('#call-menu input:not([disabled])').first().check(); await page.locator('#call-menu-confirm').click(); measured.call.answered = 'one sent'; }
  await page.waitForFunction(() => window.__familyPanel.every(row => !row.needs.includes('call')) && document.querySelector('#call-menu').hidden, null, { timeout: 15000 });
  ok(`answering from the menu (${measured.call.answered}) clears the "!" from everybody who could have answered, and the menu goes`);

  // ----------------------------------------------------------------------------------------- the whole family, set to work
  await page.waitForFunction(() => window.__snapshot.world.entities.filter(e => e.kind === 'person').every(e => !e.travel), null, { timeout: 60000 });
  await page.waitForTimeout(600);
  // Who the panel shows idle before anybody is given anything.
  measured.idleBeforeOrders = (await page.evaluate(() => window.__familyPanel)).filter(row => row.idle).map(row => row.id);
  // One press a person, top to bottom. The principal goes to work about the place; the next grown person to town for seed,
  // which stops at the counter to ask (the "!" below); everybody else to the first chore still open to them that needs no
  // place on the map. Each row is read again after the one before it was ordered, because one person taking the gun or the
  // wagon shuts it to the next.
  const errands = ['fetch-seed', 'fetch-powder', 'visit-shop', 'sell-food'];
  const preferred = ['make-furniture', 'cut-lane', 'dig-well', 'build-house', 'plant-field', 'mend-hoe', 'practise-shooting', 'buy-furniture', ...errands, 'hunt-timber'];
  const rowIds = await page.evaluate(() => [...document.querySelectorAll('.panel-row')].map(row => row.dataset.entityId));
  const plan = [];
  let presses = 0;
  const refusals = [];
  for (const id of rowIds) {
    const tried = new Set();
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.waitForTimeout(300);
      const wantErrand = !plan.some(entry => errands.includes(entry.key));
      const key = await page.evaluate(({ id, preferred, errands, wantErrand, principalId, tried }) => {
        const row = document.querySelector(`.panel-row[data-entity-id="${id}"]`);
        const open = k => !tried.includes(k) && row.querySelector(`.panel-icon[data-key="${k}"]:not([aria-disabled="true"])`);
        if (id === principalId) return open('work') ? 'work' : null;
        return (wantErrand && errands.find(open)) || preferred.find(open) || null;
      }, { id, preferred, errands, wantErrand, principalId, tried: [...tried] });
      if (!key) break;
      tried.add(key);
      await asMain(page, id);
      await page.locator(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`).click();
      presses++;
      // The server's answer: the order taken (the icon glows) or refused (its sentence on the error line).
      const answer = await page.waitForFunction(({ id, key }) => {
        const error = (document.querySelector('#error')?.textContent || '').trim();
        if (error) return { error };
        return document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true' ? { glowed: true } : null;
      }, { id, key }, { timeout: 8000, polling: 50 }).then(handle => handle.jsonValue()).catch(() => ({}));
      if (answer.error) { refusals.push({ id, key, error: answer.error }); continue; }
      plan.push({ id, key, glowed: Boolean(answer.glowed) });
      break;
    }
  }
  // Back to the principal. Working about the place and resting are the main person's alone (§11.3), so their icons are on
  // whoever is main - and since §12 that is the only bar drawn. Ordering somebody else after the principal was set to work
  // takes the principal's *work* icon off the screen, and with it the glow that says what they are doing.
  await asMain(page, principalId);
  const orderable = plan.map(entry => entry.id);
  const notGlowing = plan.filter(entry => !entry.glowed);
  assert.deepEqual(notGlowing, [], `pressed and never glowed: ${JSON.stringify(notGlowing)} (server: ${JSON.stringify(notGlowing.map(({ id }) => world().entities[id].chore))})`);
  assert.ok(orderable.length >= 4, `only ${orderable.length} people could be given work; this seed was chosen for a large family`);
  // Everybody given work, still at it, is not idle; the panel says so of every row at once.
  await page.waitForTimeout(600);
  const busyPanel = await page.evaluate(() => window.__familyPanel);
  const stillAtIt = plan.filter(({ id, key }) => key === 'work' ? world().entities[id].task === 'work' : world().entities[id].chore).map(entry => entry.id);
  measured.commands = { plan, presses, refusals, stillAtIt, rows: busyPanel.map(({ id, role, active, idle, need }) => ({ id, role, active, idle, need })) };
  const idleLeft = busyPanel.filter(row => row.idle).map(row => row.id);
  assert.deepEqual(idleLeft.filter(id => stillAtIt.includes(id)), [], `shown idle while at work: ${idleLeft}`);
  for (const id of stillAtIt) assert.ok(busyPanel.find(row => row.id === id).active.length, `${id} is at work and nothing glows`);
  // Read in one go, in the page: somebody finishing their work between two reads would be a difference that says nothing.
  // Every row the panel calls idle says 'Idle' on it, and no row says it that the panel does not.
  const idleRows = await page.evaluate(() => [...document.querySelectorAll('.panel-row')].map(row => ({
    id: row.dataset.entityId, idle: row.dataset.idle === 'true', says: !row.querySelector('.panel-idle')?.hidden })));
  assert.deepEqual(idleRows.filter(row => row.idle !== row.says), [], 'a row the panel calls idle does not say so');
  await shot(page, 'everyone-busy');
  ok(`${presses} presses (${refusals.length} refused in the server's words and another tried) set ${orderable.length} of ${busyPanel.length} people to work without finding anybody on the map; each icon glowed when the server took it, and the ${stillAtIt.length} still at it are not idle (${plan.map(e => `${e.id.split('-').pop()}: ${e.key}`).join(', ')})`);
  const unorderable = busyPanel.filter(row => !orderable.includes(row.id));
  if (unorderable.length) ok(`of the ${unorderable.length} not given work, ${unorderable.filter(row => row.idle).length} are shown idle (something is open to them) and ${unorderable.filter(row => !row.idle).length} are not (too young to be sent)`);

  // --------------------------------------------------------------------------------------- a refusal, in the server's words
  // A stale icon: one the page shows shut, opened by hand as if the tick had not caught up, and pressed. The server decides.
  const stale = await page.evaluate(() => {
    const icon = [...document.querySelectorAll('.panel-icon[aria-disabled="true"][data-action="chore"]')].find(button => button.dataset.note);
    if (!icon) return null;
    icon.removeAttribute('aria-disabled');
    return { id: icon.dataset.entityId, key: icon.dataset.key, shown: icon.dataset.note };
  });
  assert.ok(stale, 'no refused icon on the panel to press');
  await asMain(page, stale.id);
  await page.locator(`.panel-row[data-entity-id="${stale.id}"] .panel-icon[data-key="${stale.key}"]`).click();
  await page.waitForFunction(() => (document.querySelector('#error')?.textContent || '').trim().length > 0, null, { timeout: 10000 });
  stale.server = (await page.locator('#error').textContent()).trim();
  measured.refusal = stale;
  ok(`a stale "${stale.key}" pressed for ${stale.id} is refused by the server, in its words: "${stale.server}"`);

  // ------------------------------------------------------------------------------------------------------------- idle
  const asker = plan.find(entry => errands.includes(entry.key))?.id;
  // Work runs out: somebody whose chore the server says is done (or, if everyone is still at it, somebody called off from the
  // panel) is left standing about, and their row says so.
  const finished = orderable.filter(id => id !== principalId && id !== asker);
  let toStop = await page.waitForFunction(ids => ids.find(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.idle === 'true') || null,
    finished, { timeout: 20000, polling: 100 }).then(handle => handle.jsonValue()).catch(() => null);
  measured.idleHow = toStop ? 'their work finished' : 'called off from the panel';
  if (!toStop) {
    toStop = await page.evaluate(ids => ids.find(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="stop-chore"]`)), finished);
    assert.ok(toStop, 'nobody at work to call off and nobody finished');
    await asMain(page, toStop);
    await page.locator(`.panel-row[data-entity-id="${toStop}"] .panel-icon[data-key="stop-chore"]`).click();
    await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.idle === 'true', toStop, { timeout: 15000 });
  }
  const idleShown = await page.evaluate(id => {
    const row = document.querySelector(`.panel-row[data-entity-id="${id}"]`);
    return { tag: !row.querySelector('.panel-idle').hidden && getComputedStyle(row.querySelector('.panel-idle')).display !== 'none', mark: getComputedStyle(row.querySelector('.panel-idle-mark')).display };
  }, toStop);
  assert.ok(idleShown.tag && idleShown.mark !== 'none', `idle is not visible: ${JSON.stringify(idleShown)}`);
  measured.idle = { calledOff: toStop, ...idleShown };
  await shot(page, 'idle');
  ok(`${toStop} is left standing about (${measured.idleHow}), and the row says "Idle" and marks the portrait`);

  // -------------------------------------------------------------------------------------------- work that stops to ask
  assert.ok(asker, 'nobody could be sent on an errand to town, so nothing will stop to ask');
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.need === 'asking', asker, { timeout: 240000, polling: 200 })
    .catch(error => { throw new Error(`${asker} never stopped to ask: chore ${JSON.stringify(world().entities[asker].chore)}; ${error.message}`); });
  await page.locator('#map-nav [data-view=home]').click();
  await page.waitForTimeout(300);
  await pressMark(page, asker, 'click');
  await page.waitForFunction(() => document.activeElement?.dataset?.action === 'answer-chore', null, { timeout: 5000 });
  const asked = await page.evaluate(id => ({ card: document.querySelector('#selection').dataset.entityId, question: document.querySelector('#selection-work .ask-text')?.textContent,
    focused: document.activeElement.querySelector('.work-name')?.textContent || document.activeElement.textContent, watching: document.querySelector('#map-nav [data-view=follow]').textContent }), asker);
  assert.equal(asked.card, asker);
  assert.ok(asked.watching.startsWith('Watching'), asked.watching);
  measured.asking = { asker, chore: plan.find(entry => entry.id === asker).key, ...asked };
  await shot(page, 'asking-opened');
  ok(`${asker}'s errand stopped to ask ("${asked.question}"): the "!" took the camera to them and opened the question on their card, the keyboard on "${asked.focused}"`);
  // The last answer is the one that walks away without buying: it ends the question whatever the family can afford.
  await page.locator('#selection-work button[data-action="answer-chore"]:not([disabled])').last().click();
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.need !== 'asking', asker, { timeout: 15000 });
  ok('answering it clears the "!"');

  // ------------------------------------------------------------------------------------------------ a neighbour's offer
  // The principal is sent into Gonzales from the panel, and the next family's principal through the API as its student would
  // send them; standing together there, that family makes an offer.
  const book = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family.people);
  const tradedWith = principalId;
  const neighbour = app.state.world.households['hh-2'].principalId;
  await asMain(page, principalId);
  await page.locator(`.panel-row[data-entity-id="${principalId}"] .panel-icon[data-key="travel-gonzales"]`).click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="travel-gonzales"]`)?.dataset.active === 'true'
    || window.__snapshot.world.entities.find(e => e.id === id)?.location?.siteId === 'gonzales', principalId, { timeout: 15000 });
  await post('/api/command', { id: `proof-travel-${crypto.randomUUID()}`, action: 'travel', entityId: neighbour, destination: 'gonzales' }, neighbourCookie);
  const inTown = id => { const e = app.state.world.entities[id]; return !e.travel && e.location?.siteId === 'gonzales'; };
  for (let i = 0; i < 600 && !(inTown(tradedWith) && inTown(neighbour)); i++) await page.waitForTimeout(200);
  assert.ok(inTown(tradedWith) && inTown(neighbour), 'the two never stood together in Gonzales');
  const offerFromNeighbour = (give, ask) => post('/api/command', { id: `proof-offer-${crypto.randomUUID()}`, action: 'offer', entityId: neighbour, toEntityId: tradedWith, give, ask }, neighbourCookie);
  await offerFromNeighbour({ food: 1 }, { seed: 1 });
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.dataset.need === 'offer'
    && !document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`).hidden, tradedWith, { timeout: 15000 });
  await page.locator('#map-nav [data-view=home]').click();
  await page.waitForTimeout(300);
  await shot(page, 'offer-mark');
  await pressMark(page, tradedWith, 'click');
  await page.waitForFunction(() => document.activeElement?.dataset?.action === 'accept-offer', null, { timeout: 5000 });
  const offered = await page.evaluate(() => ({ card: document.querySelector('#selection').dataset.entityId, said: document.querySelector('#selection-trade .trade-note')?.textContent, watching: document.querySelector('#map-nav [data-view=follow]').textContent }));
  assert.equal(offered.card, tradedWith);
  assert.ok(offered.watching.startsWith('Watching'));
  measured.offer = { tradedWith, neighbour, ...offered };
  await shot(page, 'offer-opened');
  ok(`an offer from the next family marks ${tradedWith}; the "!" took the camera to them and opened the offer ("${offered.said}"), the keyboard on Accept`);
  await page.locator('#selection-trade button[data-action="decline-offer"]').click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden, tradedWith, { timeout: 15000 });
  ok('declining it clears the "!"');

  // -------------------------------------------------------------------------------------------- choosing the main person
  // The main person is the server's (docs/FAMILY_PANEL.md §11.3): the star sends `set-main`, the household holds it, and the
  // journeys, the yard and rest move to that row - the principal's row loses them, and the server refuses him in words.
  const mother = book.find(person => person.role === 'mother')?.id || book.find(person => person.id !== principalId).id;
  // The household has been sent a main person by now, because since §12 the work above is reached by choosing whoever is to
  // do it; that the household holds nobody until somebody chooses is asked at the top of this run instead. Back to the
  // principal, so what the star proves below is that choosing the mother *moves* the journeys, the yard and rest to her row.
  await asMain(page, principalId);
  assert.ok(await page.locator(`.panel-row[data-entity-id="${principalId}"] .panel-icon[data-key="travel-gonzales"]`).count(), 'the principal, main until somebody is chosen, has no journey icon');
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-focus`).click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', mother);
  assert.equal(world().households['hh-1'].mainId, mother, 'the star did not reach the server');
  assert.equal(await page.evaluate(() => window.__snapshot.world.household.mainId), mother, 'the projection does not carry the main person');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('tr_focus_'))), [], 'the browser still keeps a main person of its own');
  assert.equal(await page.locator('.panel-row[data-focused=true]').count(), 1);
  await page.waitForFunction(({ mother, principalId }) => document.querySelector(`.panel-row[data-entity-id="${mother}"] .panel-icon[data-key="rest"]`) && !document.querySelector(`.panel-row[data-entity-id="${principalId}"] .panel-icon[data-key="rest"]`), { mother, principalId }, { timeout: 10000 });
  const rowsNow = await page.evaluate(({ mother, principalId }) => Object.fromEntries([mother, principalId].map(id => [id, [...document.querySelectorAll(`.panel-row[data-entity-id="${id}"] .panel-icon`)].map(icon => icon.dataset.key)])), { mother, principalId });
  assert.ok(['travel-gonzales', 'travel-home', 'work', 'rest'].every(key => rowsNow[mother].includes(key)), `the main person's row lacks the journeys: ${rowsNow[mother]}`);
  assert.ok(!['travel-gonzales', 'travel-home', 'work', 'rest'].some(key => rowsNow[principalId].includes(key)), `the principal's row keeps the journeys: ${rowsNow[principalId]}`);
  // The server's refusal, in its words, for an order the page no longer offers: the principal sent to town as this student.
  const studentCookie = (await context.cookies()).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  const refusedTravel = await fetch(url + '/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: studentCookie }, body: JSON.stringify({ id: `proof-refused-${crypto.randomUUID()}`, action: 'travel', entityId: principalId, destination: 'gonzales' }) });
  const refusedWords = (await refusedTravel.json()).error;
  assert.notEqual(refusedTravel.status, 200, 'the principal was sent to town while somebody else is the main person');
  assert.match(refusedWords, /Only your main person/, refusedWords);
  measured.mainPerson = { mother, rows: rowsNow, refused: refusedWords };
  ok(`the star makes ${mother} the main person on the server (household.mainId), the journeys, the yard and rest move to her row and off the principal's, and the principal sent to town is refused: "${refusedWords}"`);
  // The rooms are opened from the main person's row.
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-house`).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.panel-house:not([hidden])').count(), 1, 'a House button on more than the main person');
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-house`).click();
  await page.locator('#interior').waitFor({ state: 'visible' });
  await shot(page, 'main-person-house');
  await page.locator('#interior-close').click();
  ok(`${mother}'s row alone has House, which opens the rooms`);
  // Kept by the server through a reload, and the card that opens with nobody chosen is theirs.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', mother, { timeout: 15000 });
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click({ timeout: 5000 }).catch(() => {});
  await page.waitForFunction(id => document.querySelector('#selection')?.dataset.entityId === id, mother, { timeout: 10000 });
  ok('after a reload the same person is starred, and the card that opens with nobody chosen is theirs');
  // Away and back: the star on the main person returns the camera to them.
  await page.locator('#map-nav [data-view=gonzales]').click();
  await page.waitForTimeout(300);
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-focus`).click();
  await page.waitForFunction(() => document.querySelector('#map-nav [data-view=follow]')?.textContent.startsWith('Watching'));
  await page.waitForTimeout(400);
  const back = await page.evaluate(id => { const e = window.__snapshot.world.entities.find(one => one.id === id); return Math.hypot(window.__camera.cx - e.location.x, window.__camera.cy - e.location.y); }, mother);
  assert.ok(back < 0.05, `the camera is ${back} miles from the main person`);
  // Double-clicking a portrait also chooses the main person.
  await page.locator(`.panel-portrait[data-portrait="${principalId}"]`).dblclick();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', principalId);
  await shot(page, 'main-person');
  ok(`pressing the main person's star from Gonzales brings the camera back to them (${back.toFixed(3)} mi); a double-click on a portrait chooses another`);

  // ----------------------------------------------------------------------------------------- cheap on a slow computer
  // A quiet stretch of ticks: how much of the panel's DOM is rebuilt. Rows and icons are kept and changed in place.
  const churn = await page.evaluate(async () => {
    const rows = document.querySelector('#family-rows');
    let added = 0, attributes = 0;
    const observer = new MutationObserver(list => { for (const m of list) { if (m.type === 'childList') added += m.addedNodes.length; else attributes++; } });
    observer.observe(rows, { subtree: true, childList: true, attributes: true, characterData: true });
    const start = window.__snapshot.world.tick;
    await new Promise(resolve => setTimeout(resolve, 4000));
    observer.disconnect();
    return { ticks: window.__snapshot.world.tick - start, nodesAdded: added, attributeChanges: attributes, rows: rows.children.length };
  });
  measured.churn = churn;
  assert.ok(churn.ticks >= 8, `only ${churn.ticks} ticks in four seconds`);
  assert.ok(churn.nodesAdded <= churn.ticks, `the panel added ${churn.nodesAdded} nodes in ${churn.ticks} ticks`);
  ok(`over ${churn.ticks} ticks the panel added ${churn.nodesAdded} nodes and changed ${churn.attributeChanges} attributes across ${churn.rows} rows: kept, not rebuilt`);

  // ---------------------------------------------------------------------------------------------------------- a phone
  const phone = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 400, height: 800 }, isMobile: true, hasTouch: true });
  await phone.addCookies(await context.cookies());
  const small = await phone.newPage();
  small.on('pageerror', error => errors.push(`phone: ${error.message}`));
  await small.goto(url);
  // A page opened afresh sees the title screen again (public/creation.js); until it is answered the curtain takes every tap.
  await meetFamily(small);
  await small.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small.locator('#family-panel').waitFor({ state: 'visible' });
  if (await small.locator('#tutorial-skip').isVisible()) await small.locator('#tutorial-skip').click({ timeout: 5000 }).catch(() => {});
  // An offer waiting, so the "!" is on the phone too.
  await offerFromNeighbour({ food: 1 }, { seed: 1 });
  await small.waitForFunction(id => !document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden, tradedWith, { timeout: 15000 });
  await small.waitForTimeout(500);
  const layout = await small.evaluate(id => {
    const mark = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`).getBoundingClientRect();
    const open = document.querySelector('.panel-row[data-expanded=true]');
    const tools = open?.querySelector('.panel-tools')?.getBoundingClientRect();
    return { pageScrolls: document.documentElement.scrollWidth > window.innerWidth, overflow: document.documentElement.scrollWidth - window.innerWidth,
      mark: { x: Math.round(mark.x), y: Math.round(mark.y), width: Math.round(mark.width) }, markOnScreen: mark.right <= window.innerWidth && mark.width >= 20,
      toolsOnScreen: tools ? tools.right <= window.innerWidth : null, expanded: open?.dataset.entityId, focusedStarred: open?.dataset.focused };
  }, tradedWith);
  measured.phone = layout;
  assert.equal(layout.pageScrolls, false, `the page scrolls sideways at 400 px by ${layout.overflow}px`);
  assert.ok(layout.markOnScreen, 'the "!" is off the screen or too small to press on a phone');
  assert.ok(layout.toolsOnScreen !== false, 'the star and House are off the side of a phone');
  await shot(small, 'phone');
  // An offer stands until it is taken or withdrawn; if it went while the picture was taken, another is made.
  if (await small.locator(`.panel-row[data-entity-id="${tradedWith}"] .panel-attention`).isHidden()) {
    await offerFromNeighbour({ food: 1 }, { seed: 1 });
    await small.waitForFunction(id => !document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden, tradedWith, { timeout: 15000 });
  }
  await pressMark(small, tradedWith, 'tap');
  await small.waitForFunction(id => document.querySelector('#selection')?.dataset.entityId === id && Boolean(document.querySelector('#selection-trade .trade-pending')), tradedWith, { timeout: 5000 });
  const phoneAfter = await small.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(phoneAfter, false, 'the page scrolls sideways once the offer is open on a phone');
  await shot(small, 'phone-offer');
  ok('at 400 px the page does not scroll sideways, the "!" is on screen and big enough to press, and pressing it opens the offer on the docked card');

  // ------------------------------------------------------------------------------------- a call two may answer: the one menu
  // A class on the real land, played to the morning San Felipe's call reaches hh-1 (set in process, as the army proof is
  // played to the muster): the father and the mother may both turn out. Pressing either "!" opens the one menu for the call;
  // with both ticked and confirmed both are sent - the server takes the second because a settlement's call stands for the
  // rest of the family once somebody has gone (sim/calls.mjs) - the camera goes to the first, and the "!" goes from everybody.
  app2 = createClassroom({ seed: 'commands-call-2', playerCount: 5, tickMs: 250, worldFactory: playedToTheCall });
  assert.equal(app2.state.world.calls?.['hh-1']?.status, 'open', 'the class never reached hh-1’s call');
  const port2 = await app2.listen(0, '127.0.0.1'), url2 = `http://127.0.0.1:${port2}`;
  const post2 = async (path, body, cookie) => {
    const response = await fetch(url2 + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    assert.equal(response.status, 200, `${path}: ${response.status} ${await response.text()}`);
    return response;
  };
  const host2 = await post2('/api/host', { key: app2.state.hostKey });
  const hostCookie2 = host2.headers.get('set-cookie').split(';')[0];
  const far = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
  const page2 = await far.newPage();
  page2.on('pageerror', error => errors.push(`call menu: ${error.message}`));
  await page2.goto(url2);
  await page2.locator('[name=name]').fill('Volunteer');
  await page2.locator('[name=code]').fill(app2.state.sessionCode);
  await page2.getByRole('button', { name: 'Join', exact: true }).click();
  await page2.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post2('/api/join', { name: `Settler ${i}`, code: app2.state.sessionCode });
  await post2('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie2);
  await page2.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await meetFamily(page2);
  if (await page2.locator('#wagon-done').isVisible()) await page2.locator('#wagon-done').click({ timeout: 5000 }).catch(() => {});
  if (await page2.locator('#tutorial-skip').isVisible()) await page2.locator('#tutorial-skip').click({ timeout: 5000 }).catch(() => {});
  await page2.locator('#family-panel').waitFor({ state: 'visible' });
  await page2.waitForFunction(() => (window.__familyPanel || []).filter(row => row.needs.includes('call')).length >= 2, null, { timeout: 30000, polling: 100 });
  // The call can open while the family is still on the road in, when nobody may go yet ("Wait until this person arrives"); the
  // menu is proved once two of them have arrived and may.
  await page2.waitForFunction(() => Object.values(window.__snapshot?.world.request?.answerers || {}).filter(options => options.find(option => option.id === 'turn-out')?.can).length >= 2, null, { timeout: 60000, polling: 200 });
  const answerers2 = await page2.evaluate(() => Object.keys(window.__snapshot.world.request?.answerers || {}));
  const canGo = await page2.evaluate(() => Object.entries(window.__snapshot.world.request.answerers).filter(([, options]) => options.find(option => option.id === 'turn-out')?.can).map(([id]) => id));
  assert.ok(canGo.length >= 2, `only ${canGo.length} may turn out: ${JSON.stringify(await page2.evaluate(() => window.__snapshot.world.request.answerers))}`);
  const marked2 = (await page2.evaluate(() => window.__familyPanel)).filter(row => row.needs.includes('call')).map(row => row.id);
  assert.deepEqual([...marked2].sort(), [...answerers2].sort(), 'the "!" is not on exactly the people the server lets answer the settlement’s call');
  ok(`the settlement's call marks ${marked2.length} people (${marked2.join(', ')}), and ${canGo.length} of them may turn out`);
  // A rider standing with somebody is the more pressing need and their "!" opens the conversation instead; the riders are let
  // go (as the student would, from the conversation) until a row's first need is the call, and that "!" is the one pressed.
  const studentCookie2 = (await far.cookies()).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  for (let i = 0; i < 20; i++) {
    const rows = await page2.evaluate(() => window.__familyPanel);
    if (rows.some(row => row.need === 'call')) break;
    const listener = Object.values(app2.state.world.encounters || {}).find(e => e.householdId === 'hh-1' && e.status === 'open')?.listenerId;
    if (listener) await post2('/api/command', { id: `proof-leave-${crypto.randomUUID()}`, action: 'leave-rider', entityId: listener }, studentCookie2);
    await page2.waitForTimeout(400);
  }
  const opener = (await page2.evaluate(() => window.__familyPanel)).find(row => row.need === 'call')?.id;
  assert.ok(opener, 'nobody whose first need is the call');
  // On a phone first: the menu opened from an "!", on screen with nothing scrolling sideways, then closed.
  const phone2 = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 400, height: 800 }, isMobile: true, hasTouch: true });
  await phone2.addCookies(await far.cookies());
  const small2 = await phone2.newPage();
  small2.on('pageerror', error => errors.push(`phone call menu: ${error.message}`));
  await small2.goto(url2);
  // A page opened afresh sees the title screen again (public/creation.js); until it is answered the curtain takes every tap.
  await meetFamily(small2);
  await small2.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small2.locator('#family-panel').waitFor({ state: 'visible' });
  if (await small2.locator('#tutorial-skip').isVisible()) await small2.locator('#tutorial-skip').click({ timeout: 5000 }).catch(() => {});
  await small2.waitForFunction(id => !document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden, opener, { timeout: 15000 });
  await pressMark(small2, opener, 'tap');
  await small2.waitForFunction(() => !document.querySelector('#call-menu').hidden, null, { timeout: 5000 });
  await small2.waitForTimeout(300);
  const phoneMenu = await small2.evaluate(() => {
    const menu = document.querySelector('#call-menu').getBoundingClientRect(), confirm = document.querySelector('#call-menu-confirm').getBoundingClientRect();
    return { pageScrolls: document.documentElement.scrollWidth > window.innerWidth, menuOnScreen: menu.left >= 0 && menu.right <= window.innerWidth, confirmOnScreen: confirm.right <= window.innerWidth && confirm.bottom <= window.innerHeight && confirm.height >= 36,
      rows: document.querySelectorAll('#call-menu input').length, types: [...document.querySelectorAll('#call-menu input')].map(input => input.type) };
  });
  assert.equal(phoneMenu.pageScrolls, false, 'the page scrolls sideways at 400 px with the menu open');
  assert.ok(phoneMenu.menuOnScreen && phoneMenu.confirmOnScreen, `the menu or its confirm is off a phone's screen: ${JSON.stringify(phoneMenu)}`);
  await shot(small2, 'phone-call-menu');
  await small2.locator('#call-menu-close').tap();
  await small2.waitForFunction(() => document.querySelector('#call-menu').hidden);
  measured.phoneCallMenu = phoneMenu;
  ok(`at 400 px the call's menu opens from an "!" on screen with ${phoneMenu.rows} rows and its confirm within reach, and closes`);
  await phone2.close();
  // Then on the desk: opened from the second person's "!", both ticked, confirmed; both sent, the camera on the first.
  await pressMark(page2, opener, 'click');
  await page2.waitForFunction(() => !document.querySelector('#call-menu').hidden && document.activeElement?.closest?.('#call-menu'), null, { timeout: 5000 });
  const menu2 = await page2.evaluate(() => ({ ...window.__callMenu, text: document.querySelector('#call-menu-text').textContent, types: [...document.querySelectorAll('#call-menu input')].map(input => input.type), card: document.querySelector('#selection').dataset.entityId }));
  assert.equal(menu2.several, true, 'a settlement’s call is offered as a single choice');
  assert.ok(menu2.types.every(type => type === 'checkbox'), `the rows are ${menu2.types}`);
  assert.deepEqual(menu2.rows.map(row => row.id).sort(), [...answerers2].sort());
  assert.equal(menu2.card, opener, 'the camera and card did not go to the person whose "!" was pressed');
  await shot(page2, 'call-menu');
  for (const id of canGo.slice(0, 2)) await page2.locator(`#call-menu input[data-call-menu-person="${id}"]`).check();
  assert.deepEqual((await page2.evaluate(() => window.__callMenu.rows.filter(row => row.checked).map(row => row.id))).sort(), canGo.slice(0, 2).sort(), 'the ticks were not kept');
  await page2.locator('#call-menu-confirm').click();
  await page2.waitForFunction(() => document.querySelector('#call-menu').hidden && (window.__familyPanel || []).every(row => !row.needs.includes('call')), null, { timeout: 15000 });
  const call2 = app2.state.world.calls['hh-1'];
  assert.equal(call2.status, 'accepted');
  assert.deepEqual(call2.actorIds, canGo.slice(0, 2), `the server sent ${JSON.stringify(call2.actorIds)}`);
  for (const id of canGo.slice(0, 2)) {
    const person = app2.state.world.entities[id];
    assert.ok(person.travel?.to === 'gonzales' || person.location.siteId === 'gonzales', `${id} is not on the road to Gonzales`);
    assert.ok(person.commitments.some(c => c.id === 'volunteer' && c.status === 'active'), `${id} made no promise`);
  }
  const afterSend = await page2.evaluate(() => ({ card: document.querySelector('#selection').dataset.entityId, error: (document.querySelector('#error')?.textContent || '').trim(), watching: document.querySelector('#map-nav [data-view=follow]')?.textContent }));
  assert.equal(afterSend.card, canGo[0], 'the camera did not go to the first person sent');
  assert.equal(afterSend.error, '', `a refusal was said: ${afterSend.error}`);
  await page2.waitForTimeout(400);
  await shot(page2, 'call-menu-sent');
  measured.callMenu = { answerers: answerers2, sent: canGo.slice(0, 2), text: menu2.text, actorIds: call2.actorIds, ...afterSend };
  ok(`pressing ${opener}'s "!" opened the one menu ("${menu2.text}") with a tick per person; ${canGo[0]} and ${canGo[1]} ticked and confirmed were both sent (server: ${call2.actorIds.join(', ')} on the road with a volunteer's promise), the camera went to ${canGo[0]}, and the "!" went from everybody`);
  await far.close();

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  writeFileSync('docs/evidence/family-commands-browser.json', `${JSON.stringify({
    record: 'family-commands-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/FAMILY_PANEL.md §11: orders from the panel in a press each, idle shown, an "!" for every person something waits on that takes the camera there and opens it, a main person held by the server (set-main) whose row alone has the journeys, and one menu for a call with a tick per person who may answer.',
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.',
    setUpInProcess: [
      'Every family’s cabin set standing when the first class is made, so the House button has rooms to open. The next family (hh-2) is played through /api/command, its principal sent to Gonzales and making the offer there.',
      'A second class on the real land is played in process to the morning San Felipe’s call reaches hh-1 and handed to the browser in the lobby (as scripts/army-browser-proof.mjs hands over a class played to the muster); the browser then starts it and answers the call.',
    ],
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'An army question raising an "!" in a browser: proved against the simulation in tests/family-commands.test.mjs, and it opens the card section scripts/army-browser-proof.mjs presses.',
      'A refusal from the menu leaving it open with the rest still to send: the server refused nothing in this run; the menu’s plan is tested in tests/family-commands.test.mjs and the refusals are the server’s existing sentences.',
      'A main person dying or captured in a browser: the fallback to the principal and then the oldest living member old enough is tested against the simulation in tests/family-commands.test.mjs.',
      'A weak computer: the DOM churn is measured here on a fast one; frame time on the owner\'s machine is not.',
      'A real phone or touch screen: the phone here is Chrome at 400 by 800.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/family-commands-browser.json`);
} finally {
  await browser.close();
  await app.close();
  if (app2) await app2.close();
}
