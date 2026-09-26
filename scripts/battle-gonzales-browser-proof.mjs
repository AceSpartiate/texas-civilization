// The fight at Gonzales, watched in a real class (docs/BATTLES.md; owner, 2026-09-25: "when i try to watch a battle ... i see
// npc's just standing around ... there's no smoke from the gunfire").
//
// A class through the real join flow: one family sends its man with the food and then up the river with the men; one sends
// its man to town and keeps him there; one stays home. Every order is a press on the page. It holds:
//   - the alert comes to the family through its person before the fighting, with Watch, and Watch frames the field;
//   - across several sampled moments of the fighting (not one) there is fire and smoke on the screen;
//   - the Texians are drawn measurably looser than the Mexican ranks;
//   - words are drawn over the speakers: a Spanish order with its English under it, and the Texians' own shouts;
//   - the family's own person is drawn in the Texian force, in its firing poses;
//   - the Host sees it live and its camera is on the field;
//   - the family in town and the family at home are sent nothing of it - not the battle, not an alert, not anybody's name -
//     and a reload does not change that; the family in town hears the gun, in words;
//   - afterwards the family that was there is given the account, through its person, and the journal keeps it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:battle-gonzales
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { sendTheWay } from './support/going.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const directory = mkdtempSync(join(tmpdir(), 'texas-battle-'));
let app = createClassroom({ seed: 'battle-gonzales', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
const port = await app.listen(), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { samples: [], screens: {} };
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const snapshotOf = page => page.evaluate(() => window.__snapshot);
const shot = (page, name) => page.screenshot({ path: `test-results/battle-gonzales-${name}.png` });

try {
  mkdirSync('test-results', { recursive: true });
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const sizes = { 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 }, 'hh-3': { width: 1024, height: 768 } };
  const students = {};
  for (const [householdId, viewport] of Object.entries(sizes)) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    // The family is made the way a student makes it: the die, the name, the looks (scripts/support/meet-family.mjs).
    await meetFamily(page, { 'hh-1': 'Upriver', 'hh-2': 'Towne', 'hh-3': 'Homestead' }[householdId]);
    students[householdId] = page;
  }
  const { 'hh-1': fighter, 'hh-2': townsman, 'hh-3': stayer } = students;
  await host.waitForFunction(() => window.__snapshot.connected === 3);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  // Three households of five: the Host is asked to press Start again to begin with fewer (server/app.mjs).
  if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => window.__snapshot.world.status === 'running');
  }

  // ------------------------------------------------------------------ the calls, answered by pressing them
  for (const [page, action] of [[fighter, 'help'], [townsman, 'help'], [stayer, 'stay']]) {
    try {
      await page.waitForFunction(() => window.__snapshot.world.request?.status === 'open' && ['supplies', 'rumor'].includes(window.__snapshot.world.request.kind), null, { timeout: 150000 });
    } catch (error) { throw new Error(`no call reached ${await page.evaluate(() => `${window.__snapshot.world.householdId} by minute ${window.__snapshot.world.minute} (${window.__snapshot.world.status}): ${JSON.stringify(window.__snapshot.world.request)}`)}`); }
    // Word that came third-hand is a rumor: the family goes to Gonzales to see, and is asked there.
    if (await page.evaluate(() => window.__snapshot.world.request.kind === 'rumor')) {
      await page.locator(`#selection-call button[data-action=${action === 'help' ? 'go-see' : 'stay-home'}]`).click();
      if (action !== 'help') continue;
      await sendTheWay(page, { way: 'foot' });
      await page.waitForFunction(() => window.__snapshot.world.request?.status === 'open' && window.__snapshot.world.request.kind === 'supplies', null, { timeout: 150000 });
    }
    await page.locator(`#selection-call button[data-action=${action}]`).click();
    if (action === 'help') await sendTheWay(page, { way: 'foot' });
  }
  const personId = await fighter.evaluate(() => window.__snapshot.world.entities.find(one => one.principal)?.id);
  const townId = await townsman.evaluate(() => window.__snapshot.world.entities.find(one => one.principal)?.id);
  await fighter.waitForFunction(() => window.__snapshot.world.request?.kind === 'march' && window.__snapshot.world.request.status === 'open', null, { timeout: 180000 });
  await fighter.locator('#selection-call button[data-action=go-upriver]').click();
  await sendTheWay(fighter, { way: 'foot' });
  await townsman.waitForFunction(() => window.__snapshot.world.request?.kind === 'march' && window.__snapshot.world.request.status === 'open', null, { timeout: 60000 });
  await townsman.locator('#selection-call button[data-action=stay-in-town]').click();
  try {
    await fighter.waitForFunction(id => window.__snapshot.world.entities.some(one => one.id === id && (one.travel?.to === 'williams-camp' || one.location?.siteId === 'williams-camp')), personId);
  } catch { throw new Error(`the fighter never set out: ${await fighter.evaluate(id => JSON.stringify({ minute: window.__snapshot.world.minute, request: window.__snapshot.world.request, person: window.__snapshot.world.entities.find(one => one.id === id), error: document.querySelector('#error')?.textContent }), personId)}`); }
  ok('the fighter pressed "Go upriver" and the man in town pressed "Stay in town", each on the page');
  // The fighting is watched a second a tick, so a page can be sampled through it (the Host's own Quick).
  await host.getByRole('button', { name: 'Quick', exact: true }).click();

  // ------------------------------------------------------------------ the alert, through the person, before contact, and Watch
  const alerted = await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 60000 }).then(() => true, () => false);
  assert.ok(alerted, 'no alert with Watch came through the person before the fighting');
  const alert = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, minute: window.__snapshot.world.minute, field: window.__snapshot.world.battleAlert?.field, fighting: window.__snapshot.world.battle?.contact || false }));
  assert.ok(alert.field && /side/.test(alert.words), `the alert did not come through the person: ${JSON.stringify(alert)}`);
  assert.equal(alert.fighting, false, 'no alert before contact: it came only once the fighting had begun');
  await fighter.locator('#military-go').click();
  await fighter.waitForTimeout(300);
  const watched = await fighter.evaluate(() => ({ camera: window.__camera, field: window.__snapshot.world.battleAlert?.field }));
  const off = Math.hypot(watched.camera.cx - alert.field.x, watched.camera.cy - alert.field.y);
  assert.ok(off < 0.5 && watched.camera.following === false, `Watch did not frame the field: the camera is ${off.toFixed(2)} miles from it`);
  evidence.alert = { ...alert, cameraMilesFromField: +off.toFixed(3), scale: Math.round(watched.camera.scale) };
  ok(`the alert "${alert.title}" came at ${alert.minute} before contact, through the person, and Watch put the camera ${off.toFixed(2)} miles from the field`);
  await shot(fighter, 'alert');

  // ------------------------------------------------------------------ the fighting, sampled at several moments
  await fighter.waitForFunction(() => window.__snapshot.world.battle?.phase === 'dawn-skirmish', null, { timeout: 180000 });
  await fighter.locator('#military-go').isVisible().then(visible => visible && fighter.locator('#military-go').click()).catch(() => {});
  const sample = async (page, label) => {
    const one = await page.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, frame: window.__animation?.drawMs, size: `${innerWidth}x${innerHeight}`, camera: window.__camera?.kind }));
    // Watch keeps the fight framed as it moves, both sides in view, until the student moves the camera themselves.
    assert.equal(one.camera, 'battle', `at ${one.minute} the camera Watch set was not on the fight: ${one.camera}`);
    evidence.samples.push({ label, ...one, view: one.view && { figures: one.view.figures, regularity: one.view.regularity, shotsTotal: one.view.shotsTotal, shotsBy: one.view.shotsBy, smoke: one.view.smoke, smokeInView: one.view.smokeInView, bubbles: one.view.bubbles.map(b => b.text), members: one.view.members, memberClips: one.view.memberClips, frameMs: one.view.frameMs, cannonShots: one.view.cannonShots } });
    return one;
  };
  const moments = [];
  for (let i = 0; i < 6; i++) { await fighter.waitForTimeout(2600); moments.push(await sample(fighter, `1366 skirmish ${i}`)); if (i === 2) await shot(fighter, 'skirmish'); }
  // And at the narrower desktop, through the parley and the cannon and the advance.
  await fighter.setViewportSize({ width: 1024, height: 768 });
  await fighter.waitForFunction(() => window.__snapshot.world.battle?.phase === 'parley', null, { timeout: 120000 });
  for (let i = 0; i < 3; i++) { await fighter.waitForTimeout(2600); moments.push(await sample(fighter, `1024 parley ${i}`)); }
  await shot(fighter, 'parley-1024');
  await fighter.waitForFunction(() => window.__snapshot.world.battle?.phase === 'fight', null, { timeout: 120000 });
  for (let i = 0; i < 4; i++) { await fighter.waitForTimeout(2200); moments.push(await sample(fighter, `1024 fight ${i}`)); if (i === 1) await shot(fighter, 'fight-1024'); }
  const firing = moments.filter(one => ['dawn-skirmish', 'fight'].includes(one.phase));
  assert.ok(firing.length >= 6, `only ${firing.length} moments of the fighting were sampled`);
  // The Texian volunteers themselves go on firing: every pair of moments of the same phase has shots of theirs between them
  // (the owner's finding was a line that fired once and froze on the ramrod).
  for (let i = 1; i < firing.length; i++) {
    if (firing[i].phase !== firing[i - 1].phase) continue;
    const was = firing[i - 1].view.shotsBy?.texian || 0, now = firing[i].view.shotsBy?.texian || 0;
    assert.ok(now > was, `no shot was fired between two moments of the ${firing[i].phase} by the Texians (${was} -> ${now})`);
  }
  for (const one of firing) assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in the ${one.phase}: ${one.view.smokeInView}`);
  ok(`fire and smoke on the screen at every one of ${firing.length} sampled moments of the fighting (shots ${firing[0].view.shotsTotal} -> ${firing.at(-1).view.shotsTotal}; smoke in view ${Math.min(...firing.map(one => one.view.smokeInView))}-${Math.max(...firing.map(one => one.view.smokeInView))} puffs)`);
  // Loose against ranks: how unevenly the figures of each side stand from their nearest neighbour.
  const spread = moments.find(one => one.view?.regularity?.texian && one.view.regularity.mexican);
  assert.ok(spread && spread.view.regularity.texian > 4 * spread.view.regularity.mexican, `the Texian spread is not looser than the Mexican ranks: ${JSON.stringify(spread?.view.regularity)}`);
  ok(`the Texians stand loose and the dragoons in ranks: nearest-neighbour spread ${spread.view.regularity.texian.toFixed(3)} against ${spread.view.regularity.mexican.toFixed(3)}`);
  const said = [...new Set(moments.flatMap(one => one.view?.bubbles || []))];
  const allSaid = await fighter.evaluate(() => window.__battleView.linesShown);
  assert.ok(allSaid.length >= 4 && said.length >= 2, `too few words were drawn over the speakers: ${JSON.stringify(allSaid)}`);
  assert.ok(allSaid.includes('g-carga') && allSaid.some(id => ['g-here', 'g-trees', 'g-boys', 'g-fire'].includes(id)), `no words were drawn for one side or the other: ${JSON.stringify(allSaid)}`);
  assert.ok(allSaid.some(id => ['g-why', 'g-republican', 'g-instantly'].includes(id)), `the parley's documented words were not drawn: ${JSON.stringify(allSaid)}`);
  ok(`words drawn over the speakers: ${allSaid.join(', ')}`);
  // The owner, 2026-09-25: "have the flag be drawn, and have the men say it as a taunt of sorts." The flag on the screen over
  // the Texians at every sampled moment of the fighting, and the taunt drawn over a volunteer.
  for (const one of firing) {
    const flag = one.view.flag;
    const [w, h] = one.size.split('x').map(Number);
    assert.ok(flag && flag.x > 0 && flag.x < w && flag.y > 0 && flag.y < h && flag.w >= 6, `the flag is not on the screen at ${one.minute} in the ${one.phase}: ${JSON.stringify(flag)}`);
  }
  assert.ok(allSaid.some(id => id.startsWith('g-taunt')), `nobody shouted the flag's words at the dragoons: ${JSON.stringify(allSaid)}`);
  ok(`the Come and Take It flag is on the screen at all ${firing.length} moments of the fighting, and the men shout its words`);
  const inForce = await fighter.evaluate(id => ({ members: window.__battleView?.members, clips: window.__battleView?.memberClips, drawn: window.__drawnAt?.[id], texian: window.__snapshot.world.battle?.sides.find(side => side.side === 'texian') }), personId);
  assert.ok(inForce.members?.includes(personId) && inForce.drawn, `the family's person was not drawn in the force: ${JSON.stringify(inForce)}`);
  assert.ok(inForce.clips.includes('volunteer-fire-reload'), `the family's person never fired: ${JSON.stringify(inForce.clips)}`);
  ok(`the family's own person ${personId} is drawn in the Texian force in its poses: ${inForce.clips.join(', ')}`);
  const frames = moments.map(one => one.view?.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMs = { battleP95Max: Math.max(...frames), mapDrawMs: moments.map(one => one.frame).filter(Number.isFinite) };
  ok(`the battle draws in ${Math.max(...frames).toFixed(1)} ms at its slowest 95th percentile, of a map frame of ${Math.max(...evidence.frameMs.mapDrawMs).toFixed(1)} ms at most`);

  // ------------------------------------------------------------------ the Host, live, on the field
  const hostView = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, drawn: window.__battleView?.figures, seen: window.__spotlightSeen }));
  assert.ok(hostView.battle && hostView.drawn?.texian > 0, `the Host was not sent the fight live: ${JSON.stringify(hostView)}`);
  assert.equal(hostView.focus, 'battle', 'the Host\'s camera was not sent to the field');
  assert.ok(hostView.seen?.some(key => key.startsWith('gonzales-dawn')), `the Host's spotlight never lit the field: ${JSON.stringify(hostView.seen)}`);
  ok(`the Host sees it live (${hostView.battle}), its camera ${hostView.camera} on the field`);
  await shot(host, 'host');

  // ------------------------------------------------------------------ nobody else is sent any of it
  for (const [name, page] of [['the family in town', townsman], ['the family at home', stayer]]) {
    const raw = await page.evaluate(async () => (await fetch('/api/state')).text());
    const world = JSON.parse(raw).world;
    assert.equal(world.battle, null, `${name} was sent the battle`);
    assert.ok(!world.battleAlert && !world.battleAccount, `${name} was sent an alert or an account`);
    assert.ok(!raw.includes(personId), `${name} was sent the fighter's id`);
    // Keys only a battle carries (sim/battle-stage.mjs `projectBattle`) and the engine's own record.
    const part = /"legacyPhase"|"formations"|"noFalling"|"participants"|"alerted"|"fallen"/.exec(raw);
    assert.ok(!part, `${name} was sent part of the battle: ${part?.[0]}`);
    const drawn = await page.evaluate(() => window.__battleView);
    assert.equal(drawn, null, `${name}'s page drew a battle`);
  }
  await stayer.reload();
  await stayer.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-3');
  assert.equal(await stayer.evaluate(() => window.__snapshot.world.battle), null, 'the family at home was sent the battle when it reconnected');
  ok('the family in town and the family at home were sent nothing of the fight - no battle, no alert, no name - before and after a reload');
  const heard = await townsman.evaluate(id => window.__snapshot.world.events.filter(event => event.actorId === id && /hears/.test(event.text)).map(event => event.text), townId);
  assert.ok(heard.length >= 1, 'the family in town did not hear the gun');
  ok(`the family in town heard it, in words: "${heard[0]}"`);

  // ------------------------------------------------------------------ afterwards: the account, through the person
  const accounted = await fighter.waitForFunction(() => window.__snapshot.world.battleAccount, null, { timeout: 120000 }).then(() => true, () => false);
  assert.ok(accounted, 'the account never appeared after the men left the field');
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && /saw at Williams/.test(document.querySelector('#military-title').textContent), null, { timeout: 30000 });
  const account = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text)) }));
  assert.match(account.words, /What happened/); assert.match(account.words, /Why it ended so/);
  assert.ok(account.journal, 'the journal did not keep the account');
  ok(`the account came through the person ("${account.title}") and the journal keeps it`);
  await shot(fighter, 'account');
  evidence.account = account.title;

  assert.deepEqual(errors, []);
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/battle-gonzales-browser.json', `${JSON.stringify({
    record: 'battle-gonzales-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-gonzales-browser.json`);
} finally {
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
