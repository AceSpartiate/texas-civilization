// Away at the war, in a real browser (owner, 2026-10-05; docs/MILITARY_EXPERIENCE.md, "Away at the war"): "When my character reached
// Gonzales I never received a notification that he was participating in battle. I went to check on him and he was just standing around
// in town doing nothing ... They should have food on them, not be pulling from the home supply."
//
// tests/volunteer-life.test.mjs proves the rules. This proves what a student does and sees, on a real class of the colonies map whose
// first family lives at Mina (seed `volunteer-life-0`), played in process to the morning the Colorado's call reaches it: the student
// answers the call from the father's "!", the going popup asks how many days of food he carries and the student chooses seven, which
// come out of the house; when he reaches Gonzales his bar is the militia's - the camp's work and *Come home*, nothing of the farm - and
// pressing *Cook at the mess fire* sets him cooking at the volunteers' camp on the commons, not on the town's point; when the men go up
// the river the alert card comes through him with Watch, and he is in the line while it fires; afterwards he is back in the volunteers'
// camp, where staying offers a shelter and work for board, and he has eaten from his pack; when the army is made (October 11) the
// family is asked on its card whether he joins it, stays in Gonzales or comes home, and *Stay in Gonzales* is pressed (owner, 2026-10-06);
// the army marches without him and his bar offers *Join the army*; and *Come home* starts him home.
//
// Same computer only: headless Chrome at 1366x768, and at phone width. Run: npm run test:volunteer-life
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { CAMP_CHORES } from '../sim/camp.mjs';
import { marchCloses, momentOf } from '../sim/directors.mjs';
import { eatenADay } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
mkdirSync('docs/evidence', { recursive: true });

/**
 * The class played in process with the neighbours' director, so the first family has chosen its house site and put its cabin up as a
 * neighbour would; it is marked played from the moment it has, so the director never answers its call (and unmarked at the end, so the
 * student's join takes it); and it stops the
 * tick the Colorado's call reaches it, with every rider let go. A class handed over mid-class as the camp proof hands one over.
 */
function toTheCall(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  const mine = world.households['hh-1'];
  for (let i = 0; i < 5000 && !world.calls?.['hh-1']; i++) {
    stepWorld(world);
    if (!mine.played && !mine.choosingSite && world.minute > 1440) mine.played = true;
    for (const one of Object.values(world.encounters || {})) if (one.status === 'open' && !one.kind) { try { applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ } }
  }
  for (const one of Object.values(world.encounters || {})) if (one.status === 'open' && !one.kind) { try { applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ } }
  // Nobody's again until the student joins it: a join takes the first family nobody plays.
  delete mine.played;
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'volunteer-life-0', playerCount: 15, tickMs: 300, worldFactory: toTheCall });
const world = () => app.state.world;
assert.equal(world().households['hh-1'].settlementId, 'mina', 'the first family does not live at Mina');
assert.equal(world().calls?.['hh-1']?.status, 'open', 'the Colorado\'s call has not reached the first family');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/volunteer-life-${name}.png`; await page.screenshot({ path }); shots.push(path); };

try {
  const student = await (await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message} ${(error.stack || '').split(/\r?\n/).slice(1, 4).join(' / ')}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Volunteer reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(student);
  for (let i = 2; i <= 5; i++) await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  if (await student.locator('#tutorial-skip').isVisible()) await student.locator('#tutorial-skip').click().catch(() => {});
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForTimeout(400);
  if (world().status === 'lobby') await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 60000 });
  // Paused while the student reads the call and chooses, as a teacher might: at a tick of 0.3 s the news runs an hour a tick, and a
  // proof that reads slower than a student would send him after the men had gone.
  await host.getByRole('button', { name: 'Pause' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 20000 });

  // ------------------------------------------------------------------ the call, answered from the father's "!", with the food row
  const household = world().households['hh-1'];
  const father = household.members.map(id => world().entities[id]).find(one => one.kin?.role === 'father' || one.id === household.principalId);
  const me = () => world().entities[father.id];
  await student.waitForFunction(id => Boolean(window.__snapshot?.world.request?.answerers?.[id]?.find(option => option.id === 'turn-out')?.can), father.id, { timeout: 60000 });
  const mark = student.locator(`.panel-row[data-entity-id="${father.id}"] .panel-attention`);
  await mark.waitFor({ state: 'visible', timeout: 30000 });
  await mark.click();
  await student.waitForFunction(() => !document.querySelector('#call-menu')?.hidden, null, { timeout: 10000 });
  await student.locator(`#call-menu input[data-call-menu-person="${father.id}"]`).check();
  await student.locator('#call-menu-confirm').click();
  await student.waitForFunction(() => !document.querySelector('#going')?.hidden && window.__going?.rations, null, { timeout: 20000 });
  observed.rations = await student.evaluate(() => ({ options: window.__going.rations.options, chosen: window.__going.days, buttons: [...document.querySelectorAll('#going-rations [data-days]')].map(button => ({ days: Number(button.dataset.days), text: button.textContent, disabled: button.disabled })) }));
  assert.deepEqual(observed.rations.buttons.map(button => button.days), [3, 7, 14], `the food row offers ${JSON.stringify(observed.rations.buttons)}`);
  assert.equal(observed.rations.chosen, 3, 'the smallest is not chosen first');
  await student.locator('#going-rations [data-days="7"]').click();
  await student.waitForFunction(() => window.__going?.days === 7, null, { timeout: 5000 });
  await shot(student, 'food-row');
  const store = household.resources.food, ration = eatenADay(world(), [father]);
  // The class goes on, and the order is sent at once: the server takes no order while the class is paused.
  await host.getByRole('button', { name: 'Resume' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await student.locator('#going-send').click();
  for (let i = 0; i < 100 && !me().militia; i++) await student.waitForTimeout(200);
  if (!me().militia) console.log('debug', JSON.stringify(await student.evaluate(() => ({ going: window.__going, pending: window.__goingPending, why: document.querySelector('#going-why')?.textContent, error: document.querySelector('#error')?.textContent, status: window.__snapshot?.world.status }))), world().calls['hh-1'], me().travel, world().events.slice(-6).map(e => e.text));
  assert.ok(me().militia, `${father.name} did not go`);
  observed.pack = { days: me().militia.days, pack: me().militia.pack, ration, storeBefore: store, storeAfter: household.resources.food };
  assert.equal(me().militia.days, 7);
  // Seven days, less what he has eaten on the road since (a tick or two at most).
  assert.ok(me().militia.pack <= ration * 7 + 1e-6 && me().militia.pack > ration * 6, `he carries ${me().militia.pack}, not seven days of ${ration}`);
  // Out of the house's store, said in the family's story (the store itself moves with the family's own eating and work meanwhile).
  observed.took = world().events.filter(event => event.actorId === father.id && event.claimId === 'FIC-GONZ-1179').map(event => event.text).at(-1) || '';
  assert.match(observed.took, /took 2\.[45] food for the road, about 7 days of his/, `the family's story does not say the seven days came out of the house: "${observed.took}"`);
  ok(`the call answered from ${father.name}'s "!": the going popup asked 3, 7 or 14 days of food, seven were chosen, and ${Math.round(ration * 70) / 10} food went from the house into his pack`);

  // ------------------------------------------------------------------ at Gonzales: the militia's bar, and a duty pressed
  await student.waitForFunction(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one?.location?.siteId === 'gonzales' && !one.travel; }, father.id, { timeout: 180000 });
  observed.arrived = { minute: world().minute, upriverCall: momentOf(world(), 'upriver-call'), closes: marchCloses(world()) };
  assert.ok(world().minute <= observed.arrived.closes, `he reached Gonzales too late to go up the river with the men: ${JSON.stringify(observed.arrived)}`);
  await asMain(student, father.id);
  const icon = key => student.locator(`.panel-icon[data-entity-id="${father.id}"][data-key="${key}"]`);
  await icon('send-for').waitFor({ state: 'visible', timeout: 30000 });
  observed.bar = await student.locator(`.panel-icon[data-entity-id="${father.id}"]`).evaluateAll(buttons => buttons.map(button => button.dataset.key));
  // The page's own House, last on whoever's bar is shown once the family has a house (owner, 2026-09-30), opens the rooms and sends
  // nothing: not the farm's work.
  const strangers = observed.bar.filter(key => !CAMP_CHORES.includes(key) && !['send-for', 'stop-chore', 'go-inside'].includes(key));
  assert.deepEqual(strangers, [], `his bar carries the farm's work or orders: ${strangers.join(', ')}`);
  assert.ok(observed.bar.some(key => CAMP_CHORES.includes(key)), `his bar has none of the camp's work: ${observed.bar}`);
  observed.selfBegun = me().chore?.id || null;
  ok(`at Gonzales his bar is the militia's: ${observed.bar.join(', ')}${observed.selfBegun ? ` - and left alone he had taken up ${observed.selfBegun} himself` : ''}`);
  // A duty chosen from the bar, over the one he took up himself.
  const DUTIES = ['camp-cook', 'camp-wood', 'camp-drill', 'camp-guard'];
  await student.waitForFunction(({ id, keys }) => keys.some(key => document.querySelector(`.panel-icon[data-entity-id="${id}"][data-key="${key}"]:not([aria-disabled=true])`)), { id: father.id, keys: DUTIES }, { timeout: 20000 });
  const duty = await student.evaluate(({ id, keys }) => keys.find(key => document.querySelector(`.panel-icon[data-entity-id="${id}"][data-key="${key}"]:not([aria-disabled=true])`)), { id: father.id, keys: DUTIES });
  const before = world().events.length;
  await icon(duty).click();
  // Set to it by the server - said in the family's story - however soon a short duty is over (the mess's fire is two ticks).
  for (let i = 0; i < 100 && !world().events.slice(before).some(event => event.actorId === father.id && /set out:/.test(event.text)); i++) await student.waitForTimeout(100);
  assert.ok(world().events.slice(before).some(event => event.actorId === father.id && /set out:/.test(event.text)), `pressing ${duty} did not set him to it`);
  await student.waitForTimeout(2500);
  const town = world().map.sites.gonzales;
  observed.atCamp = { duty, from: Math.round(Math.hypot(me().location.x - town.x, me().location.y - town.y) * 1000) / 1000 };
  assert.ok(observed.atCamp.from > 0.02, `he is standing on the town's point (${observed.atCamp.from} mi)`);
  // The town framed (the map's own Gonzales button), so the volunteers' camp on the commons is in the picture.
  await student.getByRole('button', { name: 'Gonzales', exact: true }).click().catch(() => {});
  await student.waitForTimeout(1500);
  await shot(student, 'camp-duty');
  ok(`pressing ${duty} set him at it, ${observed.atCamp.from} miles off the town's point at the volunteers' camp`);

  // ------------------------------------------------------------------ the fight: the card through him, and he is in the line
  await student.waitForFunction(() => window.__snapshot?.world.battleAlert, null, { timeout: 300000 });
  observed.alert = await student.evaluate(() => ({ ...window.__snapshot.world.battleAlert, card: !document.querySelector('#military-notice').hidden, go: document.querySelector('#military-go')?.textContent }));
  assert.equal(observed.alert.entityId, father.id, 'the alert did not come through him');
  assert.ok(observed.alert.card, 'the alert card was not shown');
  assert.match(observed.alert.go || '', /Watch/);
  await shot(student, 'alert');
  ok(`the alert came through ${father.name} before the fight, with ${observed.alert.go}: "${observed.alert.text.slice(0, 120)}"`);
  await student.locator('#military-go').click().catch(() => {});
  // Drawn in the force on his family's page while it fires (public/battle-view.js `window.__battleView.members`).
  observed.drawn = null;
  for (let i = 0; i < 1200 && !observed.drawn; i++) {
    const seen = await student.evaluate(id => ({ member: Boolean(window.__battleView?.members?.includes(id) || window.__snapshot?.world.battle?.members?.includes(id)), shots: window.__battleView?.shotsTotal || 0, minute: window.__snapshot?.world.minute }), father.id);
    if (seen.member && Number.isFinite(world().battles.gonzales?.participants?.[father.id]?.fought)) observed.drawn = seen;
    else await student.waitForTimeout(250);
  }
  assert.ok(observed.drawn, `${father.name} was never drawn in the force on his family's page while it fired`);
  await student.waitForTimeout(1500);
  await shot(student, 'in-the-line');
  await student.waitForFunction(() => window.__snapshot?.world.battleAccount?.id?.startsWith('account:gonzales'), null, { timeout: 600000 });
  const entry = world().battles.gonzales.participants[father.id];
  assert.ok(Number.isFinite(entry?.fought), `${father.name} was never in the line while it fired`);
  observed.account = await student.evaluate(() => window.__snapshot.world.battleAccount);
  assert.match(observed.account.text, /volunteers' camp/);
  ok(`he stood in the line while it fired (minute ${entry.fought}), and the account came through him afterwards`);
  // The muster's question holds the calendar at twenty minutes a tick; between the army made and its march are about 117 of those, which
  // at the Study pace is some eighteen real minutes, but at this proof's 300 ms under forty seconds - gone before the checks below are
  // done. When it is put, the class goes at a slow classroom's pace (2 s a tick) until the family has answered.
  const slowForMuster = setInterval(() => { if (world().muster?.['hh-1']?.status === 'open') { app.setPace(2000); clearInterval(slowForMuster); } }, 25);

  // ------------------------------------------------------------------ staying: back at the camp, shelter and board, the pack eaten from
  await student.waitForFunction(id => { const one = window.__snapshot?.world.entities.find(e => e.id === id); return one?.location?.siteId === 'gonzales' && !one.travel; }, father.id, { timeout: 300000 });
  await student.locator('#military-toggle').click().catch(() => {});
  await asMain(student, father.id);
  await icon('send-for').waitFor({ state: 'visible', timeout: 30000 });
  observed.offeredAfter = await student.evaluate(id => (window.__snapshot.world.work[id] || []).map(entry => ({ id: entry.id, can: entry.can, why: entry.why || '' })), father.id);
  const can = id => observed.offeredAfter.find(entry => entry.id === id)?.can;
  assert.ok(observed.offeredAfter.some(entry => entry.id === 'town-board'), 'staying offers no work for board');
  const stay = can('camp-shelter') ? 'camp-shelter' : can('town-board') ? 'town-board' : null;
  if (stay) {
    // Picked over whatever duty he took up himself on the way back: one press changes it (sim/chores.mjs, a camp duty for another).
    await icon(stay).click();
    await student.waitForFunction(({ id, key }) => document.querySelector(`.panel-icon[data-entity-id="${id}"][data-key="${key}"]`)?.dataset.active === 'true', { id: father.id, key: stay }, { timeout: 20000 });
  }
  await student.waitForTimeout(3000);
  await student.getByRole('button', { name: 'Gonzales', exact: true }).click().catch(() => {});
  await student.waitForTimeout(1500);
  await shot(student, 'staying');
  observed.after = { pack: me().militia.pack, days: me().militia.days, rounds: me().militia.rounds, shelter: me().militia.shelter || 'sky', chore: me().chore?.id || null };
  assert.ok(observed.after.pack < observed.pack.pack, 'he has eaten nothing from his pack');
  const row = await student.evaluate(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-standing`)?.textContent || '', father.id);
  assert.match(row, /food \d/, `his row does not say what he carries: "${row}"`);
  ok(`after the fight he is back in the volunteers' camp${stay ? `, set to ${stay}` : ''}; his pack is down to ${Math.round(observed.after.pack * 100) / 100} food and his row says "${row}"`);

  // ------------------------------------------------------------------ the muster: stay in Gonzales, answered on his card
  // (owner, 2026-10-06: "Volunteers should be given a chance to legitimately join the army, or stay in gonzales as a volunteer,
  // or go home."; sim/muster.mjs). The afternoon of October 11 the family is asked, on its request card, for each man there.
  // A rider talking with the family keeps the question back until he has gone (sim/encounters.mjs `questionWaits`): let go here, as
  // a student would with Done, so the card is in front of the family while the army stands in the town.
  for (let i = 0; i < 2100 && !(await student.evaluate(() => window.__snapshot?.world.request?.kind === 'muster')); i++) {
    for (const one of Object.values(world().encounters || {})) if (one.status === 'open' && !one.kind && one.householdId === 'hh-1') { try { applyAction(world(), 'hh-1', { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ } }
    await student.waitForTimeout(200);
  }
  if (!(await student.evaluate(() => window.__snapshot?.world.request?.kind === 'muster'))) throw new Error(`the muster's card never came: ${JSON.stringify({ minute: world().minute, asks: world().muster?.['hh-1']?.asks, status: world().muster?.['hh-1']?.status, offered: world().muster?.['hh-1']?.offeredMinute, army: world().army?.phase, request: await student.evaluate(() => window.__snapshot?.world.request?.kind || null), said: world().events.filter(event => /FIC-GONZ-118[56]/.test(event.claimId || '') && event.householdId === 'hh-1').map(event => `${event.minute}: ${event.text}`) })}`);
  observed.muster = await student.evaluate(id => ({ text: window.__snapshot.world.request.text, lapses: window.__snapshot.world.request.lapses, options: (window.__snapshot.world.request.answerers?.[id] || []).map(option => option.id) }), father.id);
  assert.deepEqual(observed.muster.options, ['muster-join', 'muster-stay', 'muster-home'], `the card does not offer the three answers: ${JSON.stringify(observed.muster)}`);
  assert.ok(!world().army.members.includes(father.id), 'he was taken into the army before his family answered');
  const asked = student.locator(`.panel-row[data-entity-id="${father.id}"] .panel-attention`);
  await asked.waitFor({ state: 'visible', timeout: 30000 });
  await asked.click();
  const stayButton = student.locator('#selection-call [data-action="muster-stay"]');
  await stayButton.waitFor({ state: 'visible', timeout: 20000 });
  await shot(student, 'muster');
  await stayButton.click();
  await student.waitForFunction(id => !window.__snapshot?.world.request || window.__snapshot.world.request.kind !== 'muster' || !window.__snapshot.world.request.answerers?.[id], father.id, { timeout: 20000 });
  assert.equal(world().muster['hh-1'].asks[father.id], 'stay');
  clearInterval(slowForMuster);
  app.setPace(300);
  ok(`when the army was made the family was asked on its card ("${observed.muster.text.slice(0, 70)}…", "${observed.muster.lapses}"), and *Stay in Gonzales* was pressed`);
  // The army marches without him; he is still in the town with the militia's bar, which now offers going after the army.
  await student.waitForFunction(() => window.__snapshot?.world.army?.phase === 'marching', null, { timeout: 300000 });
  await student.waitForTimeout(1500);
  assert.ok(!world().army.members.includes(father.id) && !me().travel && me().location.siteId === 'gonzales', `he went with the army: ${JSON.stringify(me().location)}`);
  await asMain(student, father.id);
  await icon('join-army').waitFor({ state: 'visible', timeout: 30000 });
  ok(`the army marched without ${father.name}; he stays in Gonzales, and his bar offers *Join the army* while it is in the field`);

  // ------------------------------------------------------------------ Come home
  if (me().chore) await icon('stop-chore').click().catch(() => {});
  await student.waitForTimeout(400);
  await icon('send-for').click();
  await student.waitForTimeout(200);
  if (!me().travel) await icon('send-for').click();
  await student.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.travel, father.id, { timeout: 20000 });
  assert.equal(me().travel.to, household.homeSiteId);
  ok(`*Come home* started ${father.name} home from the volunteers' camp`);

  // ------------------------------------------------------------------ at phone width
  await student.setViewportSize({ width: 400, height: 860 });
  await student.waitForTimeout(600);
  const overflow = await student.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px`);
  await shot(student, 'phone');
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/volunteer-life-browser.json', `${JSON.stringify({
    record: 'Away at the war, in a browser: docs/MILITARY_EXPERIENCE.md, "Away at the war"',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only. A real class on the colonies map (seed volunteer-life-0, the first family at Mina), played in process to the Colorado\'s call and served live at 1366x768: the student answered the call from the father\'s "!", chose seven days of food on the going popup, set him to the camp\'s work at Gonzales from his militia bar, was alerted through him with Watch, saw him in the line, read the account, set him to stay, and sent for him. No LAN, Chromebook or classroom claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  if (errors.length) console.log('page errors:', errors.join(' | '));
  await browser.close();
  await app.close();
}
