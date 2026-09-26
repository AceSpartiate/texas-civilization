// San Jacinto, watched in a real class (docs/BATTLES.md §8; owner, 2026-09-25: "players that have a character there should
// get an alert to watch. if they sent a character, it needs to happen in such a way that their character arrives in time to
// participate and does participate ... players should walk away understanding what happened").
//
// A real spring class on the colonies map, played in process to noon on April 17 (the first period alone is some four
// hundred ticks), then joined by two students and the Host. Seed `sj-proof-1` deals the first family camped at its refuge at
// Liberty with its father at hand, and the second family's men dead at the Alamo, its women and children camped at
// Lynchburg - a family with nobody in the army, a mile and a half from the field. It holds:
//   - the first student sends the father to join Houston **from the refuge** (owner's J4) by pressing his icon on the family
//     panel, and the control says when he would be with the army before he goes;
//   - the alert comes through him when the armies meet and again at the parade, before contact, with Watch, and Watch frames
//     the field;
//   - the formed Texian line against the camp at rest (the Texians measurably more regular than the Mexicans), then the line
//     coming apart and both sides a rout;
//   - fire and smoke on the screen at several moments of the fighting; the Twin Sisters fire;
//   - words over the speakers: the documented "Remember the Alamo!" and "Remember Goliad!", a Spanish line with its English;
//   - figures fall and lie still, no gore; men give themselves up with their hands raised;
//   - the family's own man is in the line and drawn doing what it does;
//   - the Host sees it live with its camera on the field;
//   - the second family is sent nothing of it - no battle, no alert, no name - before and after a reload, and hears it in words;
//   - afterwards the account comes through the man, in plain words, and the journal keeps it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:battle-san-jacinto
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { sendTheWay } from './support/going.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

function beforeHarrisburg(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world); world.status = 'running';
  for (let i = 0; i < 2000 && world.minute < momentOf(world, 'houston-harrisburg'); i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const directory = mkdtempSync(join(tmpdir(), 'texas-sj-'));
const app = createClassroom({ seed: 'sj-proof-1', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: beforeHarrisburg });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { samples: [], alerts: [] };
const world = () => app.state.world;
async function pageFor(viewport, name) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `test-results/battle-san-jacinto-${name}.png` });
/** Wait as a page waits, and fail in words a check can be recognised by (scripts/san-jacinto-injections.mjs). */
async function until(page, message, fn, arg, options) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}

try {
  mkdirSync('test-results', { recursive: true });
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport, householdId);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Lineman', 'hh-2': 'Ferryside' }[householdId]);
    students[householdId] = page;
  }
  for (let i = 3; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const { 'hh-1': fighter, 'hh-2': refugee } = students;
  const host = await pageFor({ width: 1366, height: 768 }, 'host');
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await fighter.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // ------------------------------------------------------------------ joining Houston from the refuge, by pressing it
  const household = world().households['hh-1'];
  assert.equal(household.flight?.status, 'refuged', `the first family is not camped at its refuge: ${household.flight?.status}`);
  const person = household.members.map(id => world().entities[id]).find(one => one.kind === 'person' && one.sex === 'male' && (one.age ?? 0) >= 16 && !one.service && one.health.condition === 'well');
  assert.ok(person, 'the first family has no grown man at the refuge to send');
  const personId = person.id;
  await asMain(fighter, personId);
  const offered = await fighter.evaluate(id => window.__snapshot.world.work[id]?.find(entry => entry.id === 'join-houston'), personId);
  assert.ok(offered?.can, `joining Houston from the refuge was refused: ${offered?.why}`);
  assert.match(offered.cost, /would be with the army at .+ about April \d+/);
  evidence.estimate = offered.cost;
  const icon = fighter.locator(`.panel-icon[data-entity-id="${personId}"][data-key="join-houston"]`);
  await icon.waitFor({ state: 'visible', timeout: 30000 });
  await icon.click();
  await sendTheWay(fighter, { way: 'foot' });
  await fighter.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.travel || window.__snapshot.world.entities.find(one => one.id === id)?.service?.kind === 'houston', personId, { timeout: 60000 });
  ok(`the father ${person.name} was pressed to join Houston from the refuge at ${world().map.sites[household.flight.refuge].name}; the control said "${offered.cost}"`);
  await host.getByRole('button', { name: 'Quick', exact: true }).click();
  await until(fighter, 'he never joined the army', id => window.__snapshot.world.entities.find(one => one.id === id)?.service?.kind === 'houston', personId, { timeout: 480000 });
  ok(`he joined the army at ${world().map.sites[world().entities[personId].service.siteId]?.name}`);

  // ------------------------------------------------------------------ the alert when the armies meet, and Watch
  const card = async () => fighter.evaluate(() => ({ shown: !document.querySelector('#military-notice').hidden, go: document.querySelector('#military-go')?.textContent, title: document.querySelector('#military-title')?.textContent, words: document.querySelector('#military-words')?.textContent, minute: window.__snapshot.world.minute, field: window.__snapshot.world.battleAlert?.field, contact: window.__snapshot.world.battle?.contact || false, phase: window.__snapshot.world.battle?.phase }));
  await until(fighter, 'no alert with Watch came through the man when the armies met', () => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 300000 });
  const first = await card();
  assert.ok(first.field && /side/.test(first.words) && /Santa Anna's army has come up/.test(first.words), `the first alert did not come through the man: ${JSON.stringify(first)}`);
  assert.equal(first.contact, false);
  evidence.alerts.push(first);
  await fighter.locator('#military-go').click();
  await fighter.waitForTimeout(400);
  const watched = await fighter.evaluate(() => ({ camera: window.__camera }));
  const off = Math.hypot(watched.camera.cx - first.field.x, watched.camera.cy - first.field.y);
  assert.ok(off < 0.8, `Watch did not frame the field: ${off.toFixed(2)} miles off`);
  ok(`"${first.title}" came through ${person.name} at ${first.minute} (${first.phase}), before contact; Watch put the camera ${off.toFixed(2)} miles from the field`);
  await shot(fighter, 'armies-meet');

  // ------------------------------------------------------------------ the parade: the second alert, and he is in the line
  await until(fighter, 'no alert came through the man at the parade', () => window.__snapshot.world.battleAlert?.title === 'The attack at San Jacinto', null, { timeout: 300000 });
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && /attack at San Jacinto/.test(document.querySelector('#military-title').textContent), null, { timeout: 30000 });
  const second = await card();
  assert.match(second.words, /Parade under arms/);
  assert.equal(second.contact, false, 'the parade alert came after contact');
  evidence.alerts.push(second);
  await fighter.locator('#military-go').click();
  ok(`"${second.title}" came at the parade (${second.phase}), before contact: "${second.words}"`);
  assert.ok(world().battles['san-jacinto'].participants[personId], 'he was not in the line at the parade');

  const sample = async (page, label) => {
    const one = await page.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, frame: window.__animation?.drawMs, camera: window.__camera?.kind, size: `${innerWidth}x${innerHeight}` }));
    evidence.samples.push({ label, phase: one.phase, minute: one.minute, camera: one.camera, size: one.size, view: one.view && { figures: one.view.figures, regularity: one.view.regularity, styles: one.view.styles, shotsTotal: one.view.shotsTotal, shotsBy: one.view.shotsBy, smokeInView: one.view.smokeInView, bubbles: one.view.bubbles.map(b => b.text), fallen: one.view.fallen, surrendering: one.view.surrendering, members: one.view.members, memberClips: one.view.memberClips, gunShots: one.view.gunShots, works: one.view.works, legendScene: one.view.legendScene, frameMs: one.view.frameMs } });
    return one;
  };
  // The advance: the formed line against the camp at rest.
  await until(fighter, 'the fight never reached the advance', () => window.__snapshot.world.battle?.phase === 'advance', null, { timeout: 120000 });
  await fighter.waitForTimeout(1500);
  const advance = await sample(fighter, '1366 advance');
  assert.equal(advance.view.styles.texian, 'ranks'); assert.equal(advance.view.styles.mexican, 'camp');
  assert.ok(advance.view.regularity.texian * 4 < advance.view.regularity.mexican, `the Texian line is not the formed side: ${JSON.stringify(advance.view.regularity)}`);
  assert.equal(advance.camera, 'battle', 'Watch did not hold the camera on the fight');
  assert.equal(advance.view.legendScene?.id, 'emily-west-picnic', 'the named picnic did not draw during the advance');
  assert.equal(advance.view.legendScene?.kind, 'tradition', 'the picnic lost its disputed-story label');
  assert.ok(advance.view.legendScene.x > 250 && advance.view.legendScene.x < 1080, 'the picnic fell under the interface or off screen');
  ok('Emily West and Santa Anna are visible at the picnic as a labelled later story, with animated conversation before the guns');
  ok(`the formed Texian line against the camp at rest: nearest-neighbour spread ${advance.view.regularity.texian.toFixed(3)} against ${advance.view.regularity.mexican.toFixed(3)}; the breastwork and the marsh drawn (${advance.view.works} pieces)`);
  await shot(fighter, 'advance');

  // The fighting, sampled at several moments, at 1366 and then 1024.
  const moments = [];
  await fighter.waitForFunction(() => ['guns', 'volley', 'charge'].includes(window.__snapshot.world.battle?.phase), null, { timeout: 120000 });
  for (let i = 0; i < 5; i++) { await fighter.waitForTimeout(1300); moments.push(await sample(fighter, `1366 fighting ${i}`)); if (i === 3) await shot(fighter, 'charge'); }
  await fighter.setViewportSize({ width: 1024, height: 768 });
  await fighter.waitForFunction(() => window.__snapshot.world.battle?.phase === 'rout', null, { timeout: 120000 });
  for (let i = 0; i < 5; i++) { await fighter.waitForTimeout(1500); moments.push(await sample(fighter, `1024 rout ${i}`)); if (i === 2) await shot(fighter, 'rout-1024'); }
  await fighter.waitForFunction(() => window.__snapshot.world.battle?.phase === 'killing', null, { timeout: 120000 });
  for (let i = 0; i < 3; i++) { await fighter.waitForTimeout(1500); moments.push(await sample(fighter, `1024 killing ${i}`)); }
  await shot(fighter, 'killing-1024');
  const firing = moments.filter(one => ['guns', 'volley', 'charge', 'rout', 'killing'].includes(one.phase));
  assert.ok(firing.length >= 8, `only ${firing.length} moments of the fighting were sampled`);
  for (const one of firing) assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in the ${one.phase}: ${one.view.smokeInView}`);
  assert.ok(firing.at(-1).view.shotsTotal > firing[0].view.shotsTotal + 20, 'the fighting fired too little');
  assert.ok(firing.some(one => one.view.gunShots >= 2), 'the Twin Sisters never fired');
  ok(`fire and smoke on the screen at every one of ${firing.length} sampled moments (shots ${firing[0].view.shotsTotal} -> ${firing.at(-1).view.shotsTotal}; smoke in view ${Math.min(...firing.map(one => one.view.smokeInView))}-${Math.max(...firing.map(one => one.view.smokeInView))}; the guns fired ${Math.max(...firing.map(one => one.view.gunShots))} times)`);
  const rout = moments.find(one => one.phase === 'rout');
  assert.equal(rout.view.styles.texian, 'rout'); assert.equal(rout.view.styles.mexican, 'rout');
  const late = moments.filter(one => ['rout', 'killing'].includes(one.phase));
  assert.ok(late.some(one => one.view.fallen >= 10), `too few fell: ${late.map(one => one.view.fallen)}`);
  assert.ok(late.some(one => one.view.surrendering >= 5), 'nobody gave himself up');
  ok(`the line came apart into a rout on both sides; ${Math.max(...late.map(one => one.view.fallen))} figures down and lying still, ${Math.max(...late.map(one => one.view.surrendering))} with hands raised - no blood, no gore`);
  const allSaid = await fighter.evaluate(() => window.__battleView.linesShown);
  assert.ok(allSaid.some(id => id.startsWith('sj-alamo')), `"Remember the Alamo!" was not drawn: ${allSaid}`);
  assert.ok(allSaid.some(id => id.startsWith('sj-goliad')), `"Remember Goliad!" was not drawn: ${allSaid}`);
  const spanish = moments.flatMap(one => one.view.bubbles).find(text => /[¡¿]/.test(text)) || allSaid.find(id => ['sj-tejanos', 'sj-formar', 'sj-fuego', 'sj-rindo', 'sj-armas'].includes(id));
  assert.ok(spanish, `no Spanish was drawn: ${allSaid}`);
  ok(`words over the speakers: ${allSaid.join(', ')}`);
  const inForce = await fighter.evaluate(id => ({ members: window.__battleView?.members, clips: window.__battleView?.memberClips, drawn: window.__drawnAt?.[id] }), personId);
  assert.ok(inForce.members?.includes(personId) && inForce.drawn, `the family's man was not drawn in the force: ${JSON.stringify(inForce)}`);
  assert.ok(inForce.clips.some(clip => ['volunteer-fire-reload', 'volunteer-reclining', 'volunteer-injured-rest'].includes(clip)), `the family's man never fired: ${JSON.stringify(inForce.clips)}`);
  assert.ok(world().battles['san-jacinto'].participants[personId].fought, 'his part was not recorded as fighting');
  ok(`${person.name} is in the line and drawn doing what it does: ${inForce.clips.join(', ')}`);
  const frames = moments.map(one => one.view?.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMs = { battleP95Max: Math.max(...frames), battleMedianMax: Math.max(...moments.map(one => one.view?.frameMs?.median).filter(Number.isFinite)), mapDrawMs: moments.map(one => one.frame).filter(Number.isFinite) };
  ok(`the battle draws in ${evidence.frameMs.battleP95Max.toFixed(1)} ms at its slowest 95th percentile`);

  // ------------------------------------------------------------------ the Host, live, on the field
  const hostView = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, drawn: window.__battleView?.figures, seen: window.__spotlightSeen }));
  assert.ok(hostView.battle && hostView.drawn?.texian > 0, `the Host was not sent the fight live: ${JSON.stringify(hostView)}`);
  assert.equal(hostView.focus, 'battle');
  assert.equal(hostView.camera, 'battle', 'the Host\'s camera is not on the field');
  ok(`the Host sees it live (${hostView.battle}), its camera on the field; spotlights seen: ${(hostView.seen || []).filter(key => /sj-|san-jacinto/.test(key)).join(', ')}`);
  await shot(host, 'host');

  // ------------------------------------------------------------------ the family with nobody there is sent nothing
  for (const [name, page] of [['the family at Lynchburg with nobody in the army', refugee]]) {
    const raw = await page.evaluate(async () => (await fetch('/api/state')).text());
    const state = JSON.parse(raw).world;
    assert.equal(state.battle, null, `${name} was sent the battle`);
    assert.ok(!state.battleAlert && !state.battleAccount, `${name} was sent an alert or an account`);
    assert.ok(!raw.includes(personId), `${name} was sent the fighter's id`);
    const part = /"participants"|"memberFates"|"fates"|"alerted"|"fallen"|"groups"|"guns"/.exec(raw);
    assert.ok(!part, `${name} was sent part of the battle: ${part?.[0]}`);
    assert.equal(await page.evaluate(() => window.__battleView), null, `${name}'s page drew a battle`);
  }
  await refugee.reload();
  await refugee.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2');
  assert.equal(await refugee.evaluate(() => window.__snapshot.world.battle), null, 'the family at Lynchburg was sent the battle when it reconnected');
  ok('the family with nobody there was sent nothing of the fight - no battle, no alert, no name - before and after a reload');
  const heard = await refugee.evaluate(() => window.__snapshot.world.events.filter(event => /At Lynchburg, .+ hears/.test(event.text)).map(event => event.text));
  if (heard.length) { evidence.heard = heard; ok(`the family camped at Lynchburg heard it, in words: "${heard[0]}"`); }
  else evidence.heard = 'nobody of the family was standing at Lynchburg when the guns opened';

  // ------------------------------------------------------------------ Santa Anna brought in, and the account afterwards
  await until(host, 'Santa Anna was never brought in', () => window.__snapshot.world.battle?.phase === 'taken', null, { timeout: 300000 });
  await until(host, 'the prisoners never called him', () => window.__snapshot.world.battle?.lines?.some(line => line.text === '¡El Presidente!'), null, { timeout: 120000 });
  const taken = await host.evaluate(() => ({ parley: window.__snapshot.world.battle.parley, lines: window.__snapshot.world.battle.lines.map(line => line.text) }));
  assert.deepEqual(taken.parley.people.map(one => one.name), ['Houston', 'Santa Anna']);
  await host.waitForTimeout(1500);
  await shot(host, 'santa-anna');
  const presidente = taken.lines.filter(text => /Presidente/.test(text));
  assert.ok(presidente.length, 'the prisoners’ cry was not sent');
  ok(`Santa Anna brought before the wounded Houston, the prisoners calling ${presidente.join(' ')}`);
  await until(fighter, 'the account never appeared', () => window.__snapshot.world.battleAccount, null, { timeout: 300000 });
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && /San Jacinto/.test(document.querySelector('#military-title').textContent) && /What happened/.test(document.querySelector('#military-words').textContent), null, { timeout: 30000 });
  const account = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text) && /San Jacinto|Santa Anna/.test(event.text)) }));
  for (const part of ['What happened', 'What your family', 'Why it ended so', 'eighteen minutes', 'Remember the Alamo']) assert.ok(account.words.includes(part), `the account does not say "${part}"`);
  assert.ok(account.journal, 'the journal did not keep the account');
  await shot(fighter, 'account');
  evidence.account = { title: account.title, words: account.words };
  ok(`the account came through the person ("${account.title}") and the journal keeps it`);

  assert.deepEqual(errors, []);
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/battle-san-jacinto-browser.json', `${JSON.stringify({
    record: 'battle-san-jacinto-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not physical LAN or district acceptance.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-san-jacinto-browser.json`);
} finally {
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
