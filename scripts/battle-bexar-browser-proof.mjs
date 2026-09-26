// The storming of Béxar, watched in a real class (docs/BATTLES.md §2b.3; docs/battle-research/staging.md §3; owner, 2026-09-25:
// "players that have a character there should get an alert to watch. if they sent a character, it needs to happen in such a
// way that their character arrives in time to participate and does participate").
//
// A class on the colonies map, played in process to December 3 with hh-1's volunteer in the army (the march and the siege
// take about four hundred ticks - scripts/storming-browser-proof.mjs does the same), then served live. hh-1 joins through the
// page and answers the winter-quarters question and Milam's call on its man's own card; hh-2 joins and has nobody in the
// army. The Host watches. It holds:
//   - the alert comes through the man before contact, with Watch, and Watch frames the town;
//   - he walks into the town with a division and is drawn in it, firing with it;
//   - in each of the four held episodes, at several sampled moments, there is fire and smoke on the screen, and it is street
//     fighting: shots through the loopholes of the houses, groups apart from their sides, the guns' dated shots;
//   - words are drawn over the speakers, a Spanish order with its English under it and the Texians' own;
//   - Karnes's door is broken, Milam falls in the yard named, the white flag comes to the plaza;
//   - his own fall, where the storming staged it, is drawn on his family's page at its moment;
//   - the Host sees it live, its camera on the town in the held episodes, its spotlight lit;
//   - the family with nobody there is sent nothing of it - no battle, no alert, no name - before and after a reload;
//   - afterwards the family is given the account through its man, and the journal keeps it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Frame time measured. Run: npm run test:battle-bexar
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { stormingFate } from '../sim/army.mjs';
import { schedule } from '../sim/battle-stage.mjs';
import { BEXAR_STORMING } from '../sim/battles/bexar-storming.mjs';
import { fateMoment } from '../sim/bexar-fight.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const evidence = { samples: [], screens: [] };

let staged = null;
function playedToDecember(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  const before = momentOf(world, 'winter-quarters') - 1440;
  for (let i = 0; i < 4000 && world.minute < before && !world.director.complete; i++) stepWorld(world);
  // The class's own seed decides every roll after this. It is chosen here, in process and said so in the record, so that
  // hh-1's man fights through the entry and is hit - wounded - at Karnes's door on the 7th, which a proof can watch; the rates themselves are tests/battle-bexar.test.mjs's.
  const man = world.army?.members.find(id => world.entities[id].householdId === 'hh-1');
  const phases = { phases: schedule(BEXAR_STORMING, momentOf(world, 'milam')) };
  for (let n = 0; n < 20000 && man; n++) {
    const candidate = `bexar-proof-${n}`, probe = { ...world, seed: candidate };
    const fate = stormingFate(probe, man);
    if (fate.fate !== 'wounded' || fate.grade !== 'severe') continue;
    const moment = fateMoment(probe, man, phases, { via: 'milam' });
    if (moment.phase !== 'karnes') continue;
    world.seed = candidate; staged = { seed: candidate, ...moment, fate: fate.fate, grade: fate.grade };
    break;
  }
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'siege-proof', playerCount: 5, tickMs: 700, worldFactory: playedToDecember });
const volunteer = app.state.world.army?.members.find(id => app.state.world.entities[id].householdId === 'hh-1');
assert.ok(volunteer, 'hh-1 has nobody in the army to watch');
assert.ok(staged, 'no seed put hh-1\'s man down at Karnes\'s door');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = async (page, name) => { const path = `test-results/battle-bexar-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };

try {
  mkdirSync('test-results', { recursive: true });
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const students = {};
  for (const [householdId, viewport] of [['hh-1', { width: 1366, height: 768 }], ['hh-2', { width: 1024, height: 768 }]]) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    // The family is met the way a student meets it: the title, the die, the name, the looks (scripts/support/meet-family.mjs).
    await meetFamily(page, householdId === 'hh-1' ? 'Soledad' : 'Stayhome');
    // A family made in December is offered the first hour's lesson; the student stops it, as a student may (docs/LESSON.md).
    if (await page.locator('#lesson-stop').isVisible().catch(() => false)) { await page.locator('#lesson-stop').click(); await page.locator('#lesson-stop-yes').click().catch(() => {}); }
    students[householdId] = page;
  }
  const { 'hh-1': fighter, 'hh-2': nobody } = students;
  await host.waitForFunction(() => window.__snapshot.connected === 2);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => window.__snapshot.world.status === 'running');
  }
  assert.equal(await nobody.evaluate(() => (window.__snapshot.world.army?.ours || []).length), 0, 'hh-2 has somebody in the army');

  // ------------------------------------------------------------------ December 4, answered on the man's own card
  const answer = async key => {
    await fighter.waitForFunction(([id, key]) => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 180000 });
    await fighter.locator(`.panel-row[data-entity-id="${volunteer}"] .panel-portrait`).click();
    const button = fighter.locator(`#selection-army button[data-action="army-answer"][data-question="${key}"][data-answer="yes"]`);
    await button.waitFor({ state: 'visible' });
    await button.click();
    await fighter.waitForFunction(([id, key]) => !window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 15000 });
  };
  await answer('winter');
  await answer('milam');
  // The card closed and the pointer off the portrait, so nothing of the page's own lies over the town.
  await fighter.locator('#selection-close').click().catch(() => {});
  await fighter.mouse.move(700, 740);
  assert.equal(app.state.world.army.questions.milam.asks[volunteer], 'yes');
  ok('the family answered the winter-quarters question and Milam\'s call "yes" on its man\'s own card, by pressing them');
  // The held episodes are watched a second a tick (the Host's own Quick), so a page can be sampled through them.
  await host.getByRole('button', { name: 'Quick', exact: true }).click();

  // ------------------------------------------------------------------ the alert, through the man, before contact, and Watch
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 240000 });
  const alert = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, minute: window.__snapshot.world.minute, field: window.__snapshot.world.battleAlert?.field, phase: window.__snapshot.world.battle?.phase, contact: window.__snapshot.world.battle?.contact || false }));
  assert.ok(alert.field && /side/.test(alert.words), `the alert did not come through the man: ${JSON.stringify(alert)}`);
  assert.equal(alert.contact, false, 'the alert came only once the fighting had begun');
  await fighter.locator('#military-go').click();
  await fighter.waitForTimeout(400);
  const watched = await fighter.evaluate(() => ({ camera: window.__camera }));
  const off = Math.hypot(watched.camera.cx - alert.field.x, watched.camera.cy - alert.field.y);
  assert.ok(off < 0.35 && watched.camera.following === false, `Watch did not frame the town: the camera is ${off.toFixed(2)} miles from it`);
  evidence.alert = { ...alert, cameraMilesFromTown: +off.toFixed(3), scale: Math.round(watched.camera.scale) };
  ok(`the alert "${alert.title}" came in the ${alert.phase} before contact, through the man ("${alert.words.slice(0, 60)}..."), and Watch put the camera ${off.toFixed(2)} miles from the town`);
  await shot(fighter, 'alert');

  // ------------------------------------------------------------------ sampling
  const watchAgain = async page => { if (await page.locator('#military-go').isVisible().catch(() => false) && (await page.locator('#military-go').textContent()) === 'Watch') await page.locator('#military-go').click(); };
  const sample = async (page, label) => {
    const one = await page.evaluate(id => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, frame: window.__animation?.drawMs, size: `${innerWidth}x${innerHeight}`, camera: window.__camera?.kind, drawnAt: window.__drawnAt?.[id] || null, fates: window.__snapshot.world.battle?.memberFates || null, units: window.__snapshot.world.battle?.memberUnits || null }), volunteer);
    evidence.samples.push({ label, phase: one.phase, minute: one.minute, size: one.size, camera: one.camera, view: one.view && { figures: one.view.figures, groups: one.view.groups, shotsTotal: one.view.shotsTotal, shotsBy: one.view.shotsBy, loopholeShots: one.view.loopholeShots, gunShots: one.view.gunShots, smoke: one.view.smoke, smokeInView: one.view.smokeInView, bubbles: one.view.bubbles.map(b => b.text), members: one.view.members, memberClips: one.view.memberClips, memberFalls: one.view.memberFalls, breachesOpened: one.view.breachesOpened, namedFalls: one.view.namedFalls, whiteFlag: one.view.whiteFlag, civiliansSeen: one.view.civiliansSeen, frameMs: one.view.frameMs } });
    return one;
  };
  const episode = async (page, phases, label, { count = 4, gap = 2200, until = null } = {}) => {
    await page.waitForFunction(ids => ids.includes(window.__snapshot.world.battle?.phase), phases, { timeout: 300000 });
    await watchAgain(page);
    const out = [];
    for (let i = 0; i < count; i++) {
      await page.waitForTimeout(gap);
      const one = await sample(page, `${label} ${i}`);
      if (!phases.includes(one.phase) && until) break;
      out.push(one);
    }
    return out;
  };
  const firing = (moments, what) => {
    const inPhase = moments.filter(one => one.view);
    assert.ok(inPhase.length >= 3, `only ${inPhase.length} moments of ${what} were sampled`);
    for (const one of inPhase) {
      assert.equal(one.camera, 'battle', `at ${one.minute} in ${what} the camera Watch set was not on the fight: ${one.camera}`);
      assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in ${what}: ${one.view.smokeInView}`);
    }
    for (let i = 1; i < inPhase.length; i++) assert.ok(inPhase[i].view.shotsTotal > inPhase[i - 1].view.shotsTotal, `no shot was fired between two moments of ${what} (${inPhase[i - 1].view.shotsTotal} -> ${inPhase[i].view.shotsTotal})`);
    return inPhase;
  };

  // Episode 1: out of the mill, Neill's gun, into the houses, the cannonade. 1366x768.
  const entry = firing(await episode(fighter, ['feint', 'entry', 'cannonade'], '1366 entry', { count: 8, gap: 2400 }), 'the entry');
  await shot(fighter, 'entry');
  const street = entry.at(-1).view;
  assert.ok(street.loopholeShots > 0, 'no shot through a loophole: the houses are not being fought from');
  assert.ok(Object.keys(street.groups || {}).length >= 3, `the fight is drawn as two lines, not groups in their houses: ${JSON.stringify(street.groups)}`);
  assert.ok(street.gunShots > 0, 'no gun fired in the entry');
  ok(`episode 1, the entry: fire and smoke at every one of ${entry.length} sampled moments (shots ${entry[0].view.shotsTotal} -> ${street.shotsTotal}, ${street.loopholeShots} through loopholes, ${street.gunShots} from the guns; smoke in view ${Math.min(...entry.map(one => one.view.smokeInView))}-${Math.max(...entry.map(one => one.view.smokeInView))}); groups ${Object.keys(street.groups).join(', ')}`);
  const inForce = await fighter.evaluate(id => ({ members: window.__battleView?.members, clips: window.__battleView?.memberClips, drawn: window.__drawnAt?.[id], units: window.__snapshot.world.battle?.memberUnits }), volunteer);
  assert.ok(inForce.members?.includes(volunteer) && inForce.drawn, `the family's man was not drawn in the force: ${JSON.stringify(inForce)}`);
  assert.ok(['texian', 'johnson'].includes(inForce.units?.[volunteer]), `he stands in no division: ${JSON.stringify(inForce.units)}`);
  assert.ok(inForce.clips.includes('volunteer-fire-reload'), `the family's man never fired: ${JSON.stringify(inForce.clips)}`);
  const walked = app.state.world.battles['bexar-storming'].participants[volunteer];
  assert.ok(walked?.joined < app.state.world.battles['bexar-storming'].start + 600 + 120 + 1, 'he did not leave the mill with the divisions at three');
  ok(`the family's man ${volunteer} walked in from the mill at three with ${inForce.units[volunteer] === 'johnson' ? 'Johnson’s' : 'Milam’s'} division and is drawn in it, firing: ${inForce.clips.join(', ')}`);
  // The Host, live, on the town, its spotlight lit.
  const hostView = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, drawn: window.__battleView?.figures, seen: window.__spotlightSeen }));
  assert.ok(hostView.battle && hostView.drawn?.mexican > 0, `the Host was not sent the storming live: ${JSON.stringify(hostView)}`);
  assert.ok(hostView.seen?.some(key => key.startsWith('bexar-entry')), `the Host's spotlight never lit the town: ${JSON.stringify(hostView.seen)}`);
  ok(`the Host sees it live (${hostView.battle}), camera ${hostView.camera}, focus ${hostView.focus}, spotlights ${hostView.seen.filter(key => key.startsWith('bexar')).join(', ')}`);
  await shot(host, 'host');

  // The family with nobody there: nothing of it, before and after a reload.
  const nothing = async label => {
    const raw = await nobody.evaluate(async () => (await fetch('/api/state')).text());
    const world = JSON.parse(raw).world;
    assert.equal(world.battle, null, `the family with nobody there was sent the battle (${label})`);
    assert.ok(!world.battleAlert && !world.battleAccount, `the family with nobody there was sent an alert or an account (${label})`);
    assert.ok(!raw.includes(volunteer), `the family with nobody there was sent the fighter's id (${label})`);
    const part = /"legacyPhase"|"memberFates"|"memberUnits"|"participants"|"fates"|"alerted"|"fallen"/.exec(raw);
    assert.ok(!part, `the family with nobody there was sent part of the battle: ${part?.[0]} (${label})`);
    assert.equal(await nobody.evaluate(() => window.__battleView), null, `its page drew a battle (${label})`);
  };
  await nothing('first');
  await nobody.reload();
  await nobody.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2');
  await nothing('after a reload');
  ok('the family with nobody there was sent nothing of the storming - no battle, no alert, no name - before and after a reload');

  // Episode 2: Karnes's door and Milam's fall, at 1024x768.
  await fighter.setViewportSize({ width: 1024, height: 768 });
  const karnes = firing(await episode(fighter, ['karnes'], '1024 karnes', { count: 5, gap: 1500 }), 'Karnes\'s door');
  // The Host during a held episode: its camera on the town itself.
  const hostHeld = await host.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, seen: window.__spotlightSeen }));
  assert.ok(hostHeld.focus === 'battle' && hostHeld.camera === 'battle', `the Host's camera was not on the town in the ${hostHeld.phase}: ${JSON.stringify(hostHeld)}`);
  assert.ok(hostHeld.seen?.some(key => key.startsWith('bexar-karnes')), 'no spotlight on Karnes\'s door');
  ok(`the Host's camera is on the town in the ${hostHeld.phase} (focus ${hostHeld.focus}), spotlit`);
  await shot(host, 'host-karnes');
  await shot(fighter, 'karnes-1024');
  // His own fall, staged at Karnes's door: drawn on his family's page when it comes.
  await fighter.waitForFunction(id => (window.__battleView?.memberFalls || []).some(one => one.id === id) || window.__snapshot.world.battle?.phase === 'afternoon', volunteer, { timeout: 120000 });
  const fell = await fighter.evaluate(id => ({ falls: window.__battleView?.memberFalls, clips: window.__battleView?.memberClips, fate: window.__snapshot.world.battle?.memberFates?.[id], minute: window.__snapshot.world.minute }), volunteer);
  assert.ok(fell.falls?.some(one => one.id === volunteer && one.fate === 'wounded'), `his fall at ${staged.minute} was not drawn: ${JSON.stringify(fell)}`);
  assert.ok(fell.clips.includes('volunteer-injured'), `he was not drawn hurt: ${fell.clips}`);
  evidence.fall = { staged, drawnAt: fell.minute };
  ok(`his own wound, staged for ${staged.phase} minute ${staged.minute} ("${staged.where}"), was drawn on his family's page at its moment: ${fell.clips.filter(clip => /injured/.test(clip)).join(', ')}`);
  await shot(fighter, 'wounded');

  const yard = await episode(fighter, ['milam'], '1024 milam', { count: 3, gap: 1800 });
  const second = [...karnes, ...yard].filter(one => one.view);
  assert.ok(second.some(one => one.view.breachesOpened >= 1), 'Karnes\'s door was never seen broken');
  assert.ok(second.some(one => one.view.namedFalls?.includes('Milam')), 'Milam was not seen to fall in the yard');
  assert.ok(second.some(one => one.view.civiliansSeen > 0), 'the family let out of the house was not seen');
  ok(`episode 2: fire and smoke at ${karnes.length} moments of Karnes's door; the door broken, the family inside let out unhurt, and Milam down in the yard, named`);
  await shot(fighter, 'milam-1024');

  // Episode 3: the Priest's House. His family still watches (he lies in the hospital house, in the town).
  const priests = firing(await episode(fighter, ['priests-house'], '1024 priests', { count: 6, gap: 2500 }), 'the Priest\'s House');
  await shot(fighter, 'priests-1024');
  ok(`episode 3, the Priest's House: fire and smoke at every one of ${priests.length} sampled moments (smoke in view ${Math.min(...priests.map(one => one.view.smokeInView))}-${Math.max(...priests.map(one => one.view.smokeInView))})`);

  // Episode 4: the white flag, back at 1366x768.
  await fighter.setViewportSize({ width: 1366, height: 768 });
  const flag = await episode(fighter, ['flag', 'truce'], '1366 flag', { count: 5, gap: 2000 });
  assert.ok(flag.some(one => one.view?.whiteFlag), 'no white flag was drawn on the plaza');
  await shot(fighter, 'flag');
  ok('episode 4: the guns stop and a white flag comes to the plaza');

  const said = [...new Set(evidence.samples.flatMap(one => one.view?.bubbles || []))];
  const allSaid = await fighter.evaluate(() => window.__battleView?.linesShown || []);
  assert.ok(allSaid.some(id => id.startsWith('command:') || ['b-azoteas', 'b-fuego', 'b-quien', 'b-armas', 'b-vienen', 'b-fuego2', 'b-vengan'].includes(id)), `no Spanish order was drawn: ${allSaid}`);
  assert.ok(allSaid.some(id => ['b-wall', 'b-door', 'b-roof', 'b-knives', 'b-karnes', 'b-family', 'b-whisper', 'b-spike', 'b-block', 'b-white', 'b-call'].includes(id)), `no Texian talk was drawn: ${allSaid}`);
  ok(`words drawn over the speakers: ${allSaid.join(', ')} (${said.slice(0, 8).join(' | ')})`);
  const frames = evidence.samples.map(one => one.view?.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMs = { battleP95Max: Math.max(...frames), battleMedianMax: Math.max(...evidence.samples.map(one => one.view?.frameMs?.median).filter(Number.isFinite)) };
  ok(`the storming draws in ${evidence.frameMs.battleP95Max.toFixed(1)} ms at its slowest 95th percentile (median at most ${evidence.frameMs.battleMedianMax.toFixed(1)} ms)`);

  // ------------------------------------------------------------------ afterwards: the account, through the man
  const accounted = await fighter.waitForFunction(() => window.__snapshot.world.battleAccount, null, { timeout: 300000 }).then(() => true, () => false);
  assert.ok(accounted, 'the account never came after the capitulation');
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && /saw at Béxar/.test(document.querySelector('#military-title').textContent), null, { timeout: 30000 });
  const account = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text)) }));
  for (const part of ['What happened', 'Why it ended so', 'What comes next', 'hospital']) assert.ok(account.words.includes(part), `the account has no "${part}"`);
  assert.ok(account.journal, 'the journal did not keep the account');
  assert.equal(await nobody.evaluate(async () => (await (await fetch('/api/state')).json()).world.battleAccount ?? null), null, 'the family with nobody there was given an account');
  ok(`the account came through the man ("${account.title}"): what happened, what he did, why it ended so, what comes next - and the journal keeps it`);
  await shot(fighter, 'account');
  evidence.account = account;

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/battle-bexar-browser.json', `${JSON.stringify({
    record: 'battle-bexar-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not physical LAN or district acceptance.',
    note: 'The class is played in process to December 3 with hh-1\'s volunteer in the army, and its seed chosen in process so that man fights from the entry and is wounded at Karnes\'s door, which a proof can watch; then served live and answered through the page at the Quick pace.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-bexar-browser.json`);
} finally {
  await browser.close(); await app.close();
}
