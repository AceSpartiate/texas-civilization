// San Patricio and Agua Dulce Creek, watched in a real class (docs/BATTLES.md §2b.4, §6.14; owner, 2026-09-25: "if they sent
// a character, it needs to happen in such a way that their character arrives in time to participate and does participate").
//
// A class on the colonies map with rolled families, played in process through the first period and continued into the winter
// to the morning its news comes (as scripts/alamo-siege-browser-proof.mjs does); then served live. Through the real join flow
// three students make their families on the page; two press "Go south to join the Matamoros men" for their fathers on the
// family panel and send them the way the chooser offers; the third sends nobody. The seed puts one father in Johnson's party
// and the other with Grant. It holds:
//   - each man walks south and is at San Patricio, on the map, before the raid; Grant's rides for the end of the road south;
//   - at San Patricio the alert comes through the man's side with Watch, and Watch frames the square; at several sampled
//     moments of the fight it is night, there is fire and smoke on the screen, words are drawn over the speakers, the man is
//     drawn in his part of the force, and his fate is drawn at the moment the server gives it and not before;
//   - at Agua Dulce Creek, at 1024x768, the same for Grant's man: the herd, the riders, the groves, the charge;
//   - the Host sees each fight live with its camera on the field, and its spotlight lit it;
//   - the family that sent nobody is sent nothing of either fight - not the battle, not an alert, not a name - before or after
//     a reload;
//   - when the word comes, each family that had a man there is told in plain words, on its card and in its journal.
// Same computer only, headless Chrome. Run: npm run test:battle-south
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { battleState } from '../sim/battle-stage.mjs';
import { sendTheWay } from './support/going.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const evidence = { samples: [] };
const SEED = 'battle-south-33';

function inTheWinter(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world);
  world.status = 'running';
  for (let i = 0; i < 400 && !world.director.milestones['winter-news']; i++) stepWorld(world);
  // Every family finished its guided start in the first period, as a real class's have by the winter (sim/lesson.mjs): a family
  // whose house site the first period's automation never chose would otherwise be walked back to the wagon, every order but
  // the lesson's shut (found 2026-09-25: the winter proof had failed on this since the guided start of 2026-09-21).
  for (const household of Object.values(world.households)) household.lesson = { step: 'done', at: 0 };
  world.status = 'lobby';
  return world;
}

// Three seconds a tick until the men have joined (the winter's calendar is twelve hours a tick, so a fast clock would carry the
// class to March before a student could press anything); then the Host's own Quick, a second a tick, for the fighting.
const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 3000, worldFactory: inTheWinter });
const server = () => app.state.world;
assert.equal(server().period, 2, 'the class did not reach the winter');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence/battle-south', { recursive: true });
mkdirSync('test-results', { recursive: true });
async function pageFor(viewport, who) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(`${who}: ${error.message}`));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `docs/evidence/battle-south/${name}.png` });
const waitServer = async (done, what, ms = 240000) => {
  const until = Date.now() + ms;
  while (!done()) { if (Date.now() > until) throw new Error(`timed out waiting for ${what}`); await new Promise(resolve => setTimeout(resolve, 100)); }
};
const phaseOf = id => { const world = server(); return world.battles?.[id] ? battleState(world, id)?.phase?.id : null; };

try {
  const host = await pageFor({ width: 1366, height: 768 }, 'host');
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const sizes = { 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 }, 'hh-3': { width: 1024, height: 768 } };
  const students = {};
  for (const [householdId, viewport] of Object.entries(sizes)) {
    const page = await pageFor(viewport, householdId);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page);
    students[householdId] = page;
  }
  for (let i = 4; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const { 'hh-1': johnson, 'hh-2': grant, 'hh-3': stayer } = students;
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  await johnson.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // ------------------------------------------------------------------ going south, pressed on the family panel
  const fathers = {};
  for (const [householdId, page] of [['hh-1', johnson], ['hh-2', grant]]) {
    const father = server().households[householdId].members.map(id => server().entities[id]).find(one => one.kin?.role === 'father');
    fathers[householdId] = father.id;
    const icon = page.locator(`.panel-icon[data-entity-id="${father.id}"][data-key="join-matamoros"]`);
    const shown = await icon.waitFor({ state: 'visible', timeout: 60000 }).then(() => true, () => false);
    if (!shown) {
      const found = await page.evaluate(id => ({ icons: [...document.querySelectorAll(`.panel-icon[data-entity-id="${id}"]`)].map(b => `${b.dataset.key}${b.offsetParent ? '' : '(hidden)'}`), rows: [...document.querySelectorAll('.panel-icon')].slice(0, 12).map(b => `${b.dataset.entityId}:${b.dataset.key}`), status: window.__snapshot?.world.status, minute: window.__snapshot?.world.minute, work: Object.keys(window.__snapshot?.world.work || {}), mine: (window.__snapshot?.world.work?.[id] || []).filter(w => /join|enlist/.test(w.id)).map(w => `${w.id}:${w.can}:${w.why}`), person: window.__snapshot?.world.entities.find(e => e.id === id) }), father.id);
      throw new Error(`no "Go south" on ${father.id}'s row: ${JSON.stringify(found)}`);
    }
    await icon.click();
    await sendTheWay(page);
    await waitServer(() => server().entities[father.id].travel?.to === 'san-patricio' || server().entities[father.id].chore?.id === 'join-matamoros', `${householdId}'s father to set out`, 30000);
  }
  ok(`two families pressed "Go south to join the Matamoros men" on the panel: ${Object.values(fathers).join(', ')}`);
  await waitServer(() => Object.values(fathers).every(id => server().entities[id].service?.kind === 'matamoros' && server().entities[id].location.siteId === 'san-patricio'), 'both men to reach San Patricio');
  const joinedAt = Object.fromEntries(Object.values(fathers).map(id => [id, server().minute]));
  // The rest of February and the fighting watched a second a tick (the Host's own Quick), so a page can be sampled through it.
  await host.getByRole('button', { name: 'Quick', exact: true }).click();
  ok(`both men are at San Patricio and have joined the volunteers there, by ${new Date(Date.UTC(1835, 8, 28, 6) + server().minute * 60000).toISOString().slice(0, 10)}`);
  await waitServer(() => server().director.milestones['grant-rides'], 'Grant to ride south');
  const party = id => server().entities[id].service.party;
  assert.equal(party(fathers['hh-1']), 'san-patricio', 'the seed no longer puts hh-1\'s man with Johnson');
  assert.equal(party(fathers['hh-2']), 'agua-dulce', 'the seed no longer puts hh-2\'s man with Grant');
  ok(`at Grant's ride the men were split as the record's shares have it: ${fathers['hh-1']} with Johnson, ${fathers['hh-2']} with Grant`);

  // ------------------------------------------------------------------ San Patricio: the alert, Watch, the night fight
  const spMan = fathers['hh-1'];
  await waitServer(() => server().battles?.['san-patricio']?.participants?.[spMan], 'hh-1\'s man to be in the force at San Patricio');
  const inForceAt = server().battles['san-patricio'].participants[spMan].joined;
  assert.ok(inForceAt < battleState(server(), 'san-patricio').phases.find(phase => phase.contact).from, 'he joined the force after the first shot');
  ok(`${spMan} was in the force at San Patricio from minute ${inForceAt}, before the first shot`);
  const alerted = await johnson.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 120000 }).then(() => true, () => false);
  assert.ok(alerted, 'no alert with Watch came through the man');
  const alert = await johnson.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, field: window.__snapshot.world.battleAlert?.field, phase: window.__snapshot.world.battle?.phase }));
  assert.match(alert.words, /side/);
  await johnson.locator('#military-go').click();
  await johnson.waitForTimeout(400);
  const watched = await johnson.evaluate(() => ({ camera: window.__camera }));
  const off = Math.hypot(watched.camera.cx - alert.field.x, watched.camera.cy - alert.field.y);
  assert.ok(off < 0.5 && watched.camera.following === false, `Watch did not frame the square: ${off.toFixed(2)} miles off`);
  evidence.spAlert = { ...alert, cameraMilesFromField: +off.toFixed(3) };
  ok(`the alert "${alert.title}" came through the man's side ("${alert.words}") in the ${alert.phase}, and Watch put the camera ${off.toFixed(2)} miles from the square`);

  const sample = async (page, label) => {
    const one = await page.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, size: `${innerWidth}x${innerHeight}`, camera: window.__camera?.kind, caption: window.__battleCaption }));
    evidence.samples.push({ label, phase: one.phase, minute: one.minute, size: one.size, camera: one.camera, view: one.view && { figures: one.view.figures, shotsTotal: one.view.shotsTotal, shotsBy: one.view.shotsBy, smokeInView: one.view.smokeInView, night: one.view.night, lit: one.view.lit, poses: one.view.poses, herd: one.view.herd, scenery: one.view.scenery, bubbles: one.view.bubbles.map(b => b.text), members: one.view.members, memberClips: one.view.memberClips, memberFates: one.view.memberFates, frameMs: one.view.frameMs } });
    return one;
  };
  const sp = [];
  for (let i = 0; i < 9; i++) {
    await johnson.waitForTimeout(2500);
    sp.push(await sample(johnson, `1366 San Patricio ${i}`));
    if (i === 2) await shot(johnson, 'san-patricio-houses-1366');
    if (i === 7) await shot(johnson, 'san-patricio-after-1366');
  }
  const fighting = sp.filter(one => ['surprise', 'houses', 'yield'].includes(one.phase));
  assert.ok(fighting.length >= 4, `only ${fighting.length} moments of San Patricio's fighting were sampled: ${sp.map(one => one.phase).join(' ')}`);
  for (const one of sp.filter(s => s.view)) assert.equal(one.view.night, true, `San Patricio was drawn by day at ${one.minute}`);
  for (let i = 1; i < fighting.length; i++) assert.ok(fighting[i].view.shotsTotal > fighting[i - 1].view.shotsTotal, `no shot between two moments of San Patricio (${fighting[i - 1].minute} -> ${fighting[i].minute})`);
  assert.ok(fighting.every(one => one.view.smokeInView >= 3), `no smoke on screen at some moment: ${fighting.map(one => one.view.smokeInView).join(',')}`);
  // The house that fought back: shots from inside it, nobody of it drawn (`shotsBy.houses`), not only the men on the square.
  assert.ok(fighting.some(one => (one.view.shotsBy.houses || 0) > 0), 'the Texians never fired back from the houses');
  ok(`at San Patricio it is night at every sampled moment, with fire and smoke on the screen at each of ${fighting.length} moments of the fighting (shots ${fighting[0].view.shotsTotal} -> ${fighting.at(-1).view.shotsTotal}, Texian ${fighting.at(-1).view.shotsBy.texian || 0}, from the houses ${fighting.at(-1).view.shotsBy.houses || 0})`);
  const spSaid = await johnson.evaluate(() => window.__battleView?.linesShown || []);
  assert.ok(spSaid.some(id => ['sp-quien', 'sp-rindanse', 'sp-fuego', 'sp-arriba'].includes(id)) && spSaid.some(id => ['sp-square', 'sp-back', 'sp-done'].includes(id)), `no words drawn for one side or the other: ${spSaid.join(', ')}`);
  ok(`words drawn over the speakers at San Patricio: ${spSaid.join(', ')}`);
  const spFate = server().battles['san-patricio'].fates[spMan];
  const spDrawn = await johnson.evaluate(id => ({ members: window.__battleView?.members || [], clips: window.__battleView?.memberClips || [], fates: window.__battleView?.memberFates || {}, drawn: window.__drawnAt?.[id] }), spMan);
  assert.ok(spDrawn.members.includes(spMan), `${spMan} was not drawn in the force: ${JSON.stringify(spDrawn)}`);
  // His fate is drawn only from its moment: every sample before it has none, every sample from it has his.
  for (const one of sp.filter(s => s.view)) {
    if (one.minute < spFate.at) assert.equal(one.view.memberFates?.[spMan], undefined, `his fate was drawn at ${one.minute}, before its moment ${spFate.at}`);
  }
  const lateSp = sp.filter(s => s.view && s.minute >= spFate.at + 1);
  assert.ok(lateSp.length >= 1 && lateSp.every(s => s.view.memberFates?.[spMan] === spFate.fate), `his fate (${spFate.fate} at ${spFate.at}) was not drawn: ${JSON.stringify(lateSp.map(s => [s.minute, s.view.memberFates]))}`);
  ok(`${spMan} was drawn in the force (${spDrawn.clips.join(', ')}), and his fate - ${spFate.fate} - was drawn from its moment at minute ${spFate.at} and not before`);
  const hostSp = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.id, seen: window.__spotlightSeen }));
  evidence.hostSanPatricio = hostSp;

  // ------------------------------------------------------------------ nobody else is sent any of it
  const nothing = async label => {
    const raw = await stayer.evaluate(async () => (await fetch('/api/state')).text());
    const world = JSON.parse(raw).world;
    assert.equal(world.battle, null, `the family with nobody there was sent the battle (${label})`);
    assert.ok(!world.battleAlert && !world.battleAccount, `the family with nobody there was sent an alert or an account (${label})`);
    for (const id of Object.values(fathers)) assert.ok(!raw.includes(id), `the family with nobody there was sent ${id} (${label})`);
    assert.ok(!/"memberFates"|"memberParts"|"participants"|"fates"/.exec(raw), `the family with nobody there was sent part of the fight (${label})`);
    assert.equal(await stayer.evaluate(() => window.__battleView), null, `its page drew a battle (${label})`);
  };
  await nothing('San Patricio');

  // ------------------------------------------------------------------ Agua Dulce Creek, at 1024x768
  const adMan = fathers['hh-2'];
  await waitServer(() => server().battles?.['agua-dulce']?.participants?.[adMan], 'hh-2\'s man to be with Grant\'s party on the drive');
  const onDrive = await grant.evaluate(() => window.__snapshot.world.battle?.phase);
  const adAlerted = await grant.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 240000 }).then(() => true, () => false);
  assert.ok(adAlerted, 'no alert with Watch came through Grant\'s man');
  const adAlert = await grant.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, field: window.__snapshot.world.battleAlert?.field }));
  await grant.locator('#military-go').click();
  await grant.waitForTimeout(400);
  const adCamera = await grant.evaluate(() => window.__camera);
  const adOff = Math.hypot(adCamera.cx - adAlert.field.x, adCamera.cy - adAlert.field.y);
  assert.ok(adOff < 1, `Watch did not frame the creek: ${adOff.toFixed(2)} miles off`);
  evidence.adAlert = { ...adAlert, onDrive, cameraMilesFromField: +adOff.toFixed(3) };
  ok(`on the drive north he was drawn with the party (${onDrive}); the alert "${adAlert.title}" came through him ("${adAlert.words}"), and Watch put the camera ${adOff.toFixed(2)} miles from the creek`);
  const ad = [];
  for (let i = 0; i < 8; i++) {
    await grant.waitForTimeout(2400);
    ad.push(await sample(grant, `1024 Agua Dulce ${i}`));
    if (i === 1) await shot(grant, 'agua-dulce-charge-1024');
    if (i === 6) await shot(grant, 'agua-dulce-after-1024');
  }
  const charge = ad.filter(one => one.phase === 'ambush');
  assert.ok(charge.length >= 4, `only ${charge.length} moments of the charge were sampled: ${ad.map(one => one.phase).join(' ')}`);
  for (let i = 1; i < charge.length; i++) assert.ok(charge[i].view.shotsTotal > charge[i - 1].view.shotsTotal, 'no shot between two moments of the charge');
  assert.ok(charge.every(one => one.view.smokeInView >= 2), `no smoke on screen in the charge: ${charge.map(one => one.view.smokeInView).join(',')}`);
  assert.ok(charge.some(one => one.view.herd >= 10) && charge.some(one => one.view.poses.rider > 0) && charge.every(one => one.view.scenery >= 2), `the herd, the riders or the groves are missing: ${JSON.stringify(charge.map(one => [one.view.herd, one.view.poses, one.view.scenery]))}`);
  assert.ok(charge.every(one => !one.view.night), 'Agua Dulce was drawn at night');
  const adSaid = await grant.evaluate(() => window.__battleView?.linesShown || []);
  assert.ok(adSaid.includes('ad-carga') || adSaid.includes('ad-rindanse'), `the dragoons' words were not drawn: ${adSaid.join(', ')}`);
  const adFate = server().battles['agua-dulce'].fates[adMan];
  for (const one of ad.filter(s => s.view)) if (one.minute < adFate.at) assert.equal(one.view.memberFates?.[adMan], undefined, 'his fate was drawn before its moment');
  const lateAd = ad.filter(s => s.view && s.minute >= adFate.at + 1);
  assert.ok(lateAd.length >= 1 && lateAd.every(s => s.view.memberFates?.[adMan] === adFate.fate), `his fate (${adFate.fate}) was not drawn from its moment`);
  ok(`at Agua Dulce, by day at 1024x768: the herd (${Math.max(...charge.map(one => one.view.herd))} horses), Grant's men riding, the two groves, fire and smoke at ${charge.length} moments; words ${adSaid.join(', ')}; ${adMan}'s fate - ${adFate.fate} - drawn from its moment`);
  const hostView = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.id, focus: window.__snapshot.world.host?.focus, seen: window.__spotlightSeen, drawn: window.__battleView?.figures }));
  assert.equal(hostSp.battle, 'san-patricio', 'the Host was not sent San Patricio live');
  assert.ok(hostView.battle === 'agua-dulce' && hostView.drawn?.texian >= 0, `the Host was not sent Agua Dulce live: ${JSON.stringify(hostView)}`);
  assert.ok(hostView.seen?.some(key => key.startsWith('san-patricio')) && hostView.seen?.some(key => key.startsWith('agua-dulce')), `the Host's spotlight did not light both fields: ${JSON.stringify(hostView.seen)}`);
  ok(`the Host saw both fights live (San Patricio, then Agua Dulce, focus ${hostView.focus}) and its spotlight lit both fields`);
  await shot(host, 'host-agua-dulce');
  await nothing('Agua Dulce');
  await stayer.reload();
  await stayer.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-3');
  await nothing('after a reload');
  ok('the family that sent nobody was sent nothing of either fight - no battle, no alert, no name - before and after a reload');

  // ------------------------------------------------------------------ the word, and the account in plain words
  for (const [page, id, place] of [[johnson, 'san-patricio', 'San Patricio'], [grant, 'agua-dulce', 'Agua Dulce Creek']]) {
    const told = await page.waitForFunction(title => !document.querySelector('#military-notice').hidden && document.querySelector('#military-title').textContent.includes(title), `What happened at ${place}`, { timeout: 240000 }).then(() => true, () => false);
    assert.ok(told, `no account of ${place} came`);
    const account = await page.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text)) }));
    assert.match(account.words, /What happened/); assert.match(account.words, /Why it ended so/); assert.match(account.words, /do not agree/);
    assert.ok(account.journal, `the journal did not keep the account of ${place}`);
    evidence[`${id}Account`] = account.title;
    ok(`when the word came the family was told "${account.title}" in plain words - what happened, what their man did, why it ended so, and where the accounts disagree - and the journal keeps it`);
    await shot(page, `${id}-account`);
  }
  const sizesSeen = [...new Set(evidence.samples.map(one => one.size))];
  assert.ok(sizesSeen.includes('1366x768') && sizesSeen.includes('1024x768'), `not watched at both sizes: ${sizesSeen}`);
  const frames = evidence.samples.map(one => one.view?.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMsP95Max = Math.max(...frames);
  ok(`watched at ${sizesSeen.join(' and ')}; the battle's own drawing at its slowest 95th percentile ${evidence.frameMsP95Max.toFixed(1)} ms`);
  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  writeFileSync('docs/evidence/battle-south-browser.json', `${JSON.stringify({
    record: 'battle-south-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(), seed: SEED,
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not physical LAN or district acceptance.',
    checks: pass, joinedAt, screenshots: ['san-patricio-houses-1366', 'san-patricio-after-1366', 'agua-dulce-charge-1024', 'agua-dulce-after-1024', 'host-agua-dulce', 'san-patricio-account', 'agua-dulce-account'].map(name => `docs/evidence/battle-south/${name}.png`), ...evidence,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-south-browser.json`);
} finally {
  await browser.close(); await app.close();
}
