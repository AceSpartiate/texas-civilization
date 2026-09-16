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
// an "!" that takes the camera to that person and opens what waits on them, and each "!" going once it is answered; the main
// person chosen, remembered through a reload, their card the one that opens, and their House button opening the rooms; and
// at 400 px nothing scrolls sideways.
//
// The class is the invented Gonzales country with every family's cabin standing (set in process, as
// scripts/interior-browser-proof.mjs does, because raising a house takes an afternoon); that is the only thing set in process.
// The next family's student is played through the API: its principal is sent to Gonzales and makes the offer there.
//
// Same computer only: headless Chrome. Run: npm run test:family-commands
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const shot = async (page, name) => { const path = `docs/evidence/family-commands-${name}.png`; await page.screenshot({ path }); shots.push(path); };

function housedClass(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount);
  for (const household of Object.values(world.households)) household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  return world;
}

const app = createClassroom({ seed: 'commands-2', playerCount: 5, tickMs: 250, worldFactory: housedClass });
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
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  await page.locator('#family-book').waitFor({ state: 'visible' });
  await page.locator('#journal-close').click();
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  const principalId = world().households['hh-1'].principalId;
  await page.waitForFunction(() => window.__familyPanel?.length >= 3);

  // ------------------------------------------------------------------------------------------------ the main person, first
  const firstPanel = await page.evaluate(() => window.__familyPanel);
  assert.equal(firstPanel.find(row => row.focused)?.id, principalId, 'before anybody is chosen, the main person is not the principal');
  assert.equal(await page.locator(`.panel-row[data-entity-id="${principalId}"] .panel-focus`).getAttribute('aria-pressed'), 'true');
  ok(`before anybody is chosen the main person is the principal (${principalId}), starred on the panel`);

  // ------------------------------------------------------------------------------------------------------------ the rider
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  const listener = await page.waitForFunction(() => {
    const encounter = window.__snapshot?.world.encounter;
    return encounter?.status === 'open' ? encounter.listenerId : null;
  }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
  await page.waitForFunction(id => {
    const row = document.querySelector(`.panel-row[data-entity-id="${id}"]`);
    return row?.dataset.waiting === 'true' && !row.querySelector('.panel-attention').hidden && row.querySelector('.panel-attention').dataset.need === 'rider';
  }, listener, { timeout: 15000 });
  const others = await page.evaluate(id => [...document.querySelectorAll('.panel-row')].filter(row => row.dataset.entityId !== id && row.querySelector('.panel-attention')?.dataset.need === 'rider' && !row.querySelector('.panel-attention').hidden).length, listener);
  assert.equal(others, 0, 'a rider who stopped for one person marks somebody else');
  await page.locator('#map-nav [data-view=gonzales]').click();
  await page.waitForTimeout(300);
  await shot(page, 'rider-mark');
  const riderLabel = await page.locator(`.panel-row[data-entity-id="${listener}"] .panel-attention`).getAttribute('aria-label');
  await page.locator(`.panel-row[data-entity-id="${listener}"] .panel-attention`).click();
  await page.locator('#encounter').waitFor({ state: 'visible' });
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
  await page.locator(`.panel-row[data-entity-id="${principalId}"] .panel-attention`).click();
  await page.waitForFunction(() => document.activeElement?.closest?.('#selection-call') && document.activeElement.matches('button'), null, { timeout: 5000 });
  const called = await page.evaluate(() => ({ text: document.querySelector('#selection-call .ask-text')?.textContent, focused: document.activeElement.querySelector('.work-name')?.textContent, card: document.querySelector('#selection').dataset.entityId }));
  assert.equal(called.card, principalId);
  measured.call = { callers, ...called };
  await shot(page, 'call-opened');
  ok(`a call to the family marks the ${callers.length} people the server lets answer it; the principal's "!" opened it on their card ("${called.text}"), the keyboard on "${called.focused}"`);
  const stay = page.locator('#selection-call button[data-action="stay"]:not([disabled])');
  await ((await stay.count()) ? stay : page.locator('#selection-call button:not([disabled])').last()).click();
  await page.waitForFunction(() => window.__familyPanel.every(row => !row.needs.includes('call')), null, { timeout: 15000 });
  ok('answering it clears the "!" from everybody who could have');

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
  assert.equal(await page.locator('.panel-row[data-idle=true] .panel-idle:not([hidden])').count(), idleLeft.length, 'a row the panel calls idle does not say so');
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
  await page.locator(`.panel-row[data-entity-id="${asker}"] .panel-attention`).click();
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
  await page.locator(`.panel-row[data-entity-id="${tradedWith}"] .panel-attention`).click();
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
  const mother = book.find(person => person.role === 'mother')?.id || book.find(person => person.id !== principalId).id;
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-focus`).click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', mother);
  const stored = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith('tr_focus_')));
  assert.deepEqual(stored.map(([, value]) => value), [mother]);
  assert.equal(await page.locator('.panel-row[data-focused=true]').count(), 1);
  // The rooms are opened from the main person's row.
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-house`).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.panel-house:not([hidden])').count(), 1, 'a House button on more than the main person');
  await page.locator(`.panel-row[data-entity-id="${mother}"] .panel-house`).click();
  await page.locator('#interior').waitFor({ state: 'visible' });
  await shot(page, 'main-person-house');
  await page.locator('#interior-close').click();
  ok(`the star makes ${mother} the main person, remembered in this browser; their row alone has House, which opens the rooms`);
  // Remembered through a reload, and the card that opens with nobody chosen is theirs.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', mother, { timeout: 15000 });
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
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
  await small.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small.locator('#family-panel').waitFor({ state: 'visible' });
  if (await small.locator('#tutorial-skip').isVisible()) await small.locator('#tutorial-skip').click();
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
  await small.locator(`.panel-row[data-entity-id="${tradedWith}"] .panel-attention`).tap();
  await small.waitForFunction(id => document.querySelector('#selection')?.dataset.entityId === id && Boolean(document.querySelector('#selection-trade .trade-pending')), tradedWith, { timeout: 5000 });
  const phoneAfter = await small.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(phoneAfter, false, 'the page scrolls sideways once the offer is open on a phone');
  await shot(small, 'phone-offer');
  ok('at 400 px the page does not scroll sideways, the "!" is on screen and big enough to press, and pressing it opens the offer on the docked card');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  writeFileSync('docs/evidence/family-commands-browser.json', `${JSON.stringify({
    record: 'family-commands-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/FAMILY_PANEL.md §11: orders from the panel in a press each, idle shown, an "!" for every person something waits on that takes the camera there and opens it, and a main person remembered in the browser.',
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.',
    setUpInProcess: ['Every family’s cabin set standing when the class is made, so the House button has rooms to open. Nothing else: the next family (hh-2) is played through /api/command, its principal sent to Gonzales and making the offer there.'],
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'An army question or a settlement call raising an "!" in a browser: both are proved against the simulation in tests/family-commands.test.mjs, and open the same card sections scripts/army-browser-proof.mjs and the call proofs already press.',
      'A weak computer: the DOM churn is measured here on a fast one; frame time on the owner\'s machine is not.',
      'A real phone or touch screen: the phone here is Chrome at 400 by 800.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/family-commands-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
