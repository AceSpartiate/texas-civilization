// The famous people, watched in a real class (owner, 2026-09-26: "they should be labelled, saying and doing the things that
// they likely would have, dying the way they should (Travis, Bowie, Crocett come to mind as an example)"; docs/BATTLES.md §2c,
// §14; sim/people.mjs).
//
// Two classes, each through the real join flow and the Host's Start:
//   1. The Alamo. A class at the edge of the siege (scripts/support/alamo-class.mjs), one family's father in the garrison. On
//      the map before the siege Travis, Bowie and Crockett are at Béxar with their names, seen by the family whose man is
//      there and by nobody else. Through the siege and the assault, on the student's page (Watch pressed) and the Host's: the
//      line in the sand spoken by Travis as tradition; Travis, Bowie, Crockett and Joe drawn with their names at their places;
//      Travis falling at the north battery at his moment; Bowie lying still on his cot in his room; Crockett taken and brought
//      before Santa Anna after the fighting, tagged as one account, with both accounts in the caption, then killed; Joe firing
//      from the house, coming out, hurt and spared, and brought to Santa Anna. Frame time measured.
//   2. San Jacinto. A spring class from noon on April 19, watched by the Host: the Twin Sisters named and firing on the 20th
//      and the 21st, Neill hurt at them; Houston named with the line; Emily West and Santa Anna at the picnic with the dashed
//      "later story" label and her words with their stage direction; Castrillón falling; the Napoleon of the West spoken as
//      tradition at the capture. A family far off is sent nothing of it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:famous-people
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { alamoClass, fatherOf } from './support/alamo-class.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { grownMen, serve } from '../tests/support/san-jacinto.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const errors = [];
const evidence = { alamo: {}, sanJacinto: {}, screens: [] };
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const directories = [];
const apps = [];
async function pageFor(viewport, name) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  return page;
}
const shot = async (page, name) => { const path = `test-results/famous-${name}.png`; await page.screenshot({ path }); evidence.screens.push(path); };
async function classroom(seed, factory, tickMs = 300) {
  const directory = mkdtempSync(join(tmpdir(), 'texas-famous-')); directories.push(directory);
  const app = createClassroom({ seed, playerCount: 5, tickMs, savePath: join(directory, 'class.json'), worldFactory: factory }); apps.push(app);
  const port = await app.listen(0, '127.0.0.1');
  return { app, url: `http://127.0.0.1:${port}` };
}
async function joinClass(url, app, householdId, viewport, surname) {
  const page = await pageFor(viewport, householdId);
  await page.goto(url);
  await page.locator('[name=name]').fill(`Student ${householdId}`);
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
  await meetFamily(page, surname);
  return page;
}
async function hostOf(url, app, viewport) {
  const host = await pageFor(viewport, 'host');
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  return host;
}
async function start(host) {
  // As scripts/battle-alamo-browser-proof.mjs starts its class: the Start button, and the other one named Start if that did not.
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 15000 });
  }
}
/** Answer Travis's runner "stay" if he is asking (scripts/battle-alamo-browser-proof.mjs). */
async function answerRunner(page) {
  const asking = await page.evaluate(() => document.querySelector('#military-title')?.textContent === 'A call for riders at the Alamo' && !document.querySelector('#military-notice').hidden);
  if (!asking) return;
  await page.locator('#military-go').click();
  const stay = page.locator('#encounter-asks [data-action="alamo-courier"][data-answer="stay"]');
  if (await stay.waitFor({ state: 'visible', timeout: 8000 }).then(() => true, () => false)) { await stay.click(); await page.locator('#encounter-close').click().catch(() => {}); }
}
/** Press Watch whenever a battle card is up, so the camera is on the field. */
async function watch(page) {
  // A card put away behind "Open messages" is opened first, as a student would.
  const away = await page.evaluate(() => /^Open messages/.test(document.querySelector('#military-toggle')?.textContent || '') && !document.querySelector('#military-toggle').hidden);
  if (away) await page.locator('#military-toggle').click({ timeout: 2000 }).catch(() => {});
  const up = await page.evaluate(() => !document.querySelector('#military-notice')?.hidden && document.querySelector('#military-go')?.textContent === 'Watch');
  if (up) await page.locator('#military-go').click({ timeout: 2000 }).catch(() => {});
}
// Only what the checks read, so a sample is quick enough to catch every phase of the assault.
const read = page => page.evaluate(() => {
  const view = window.__battleView;
  return {
    phase: window.__snapshot?.world.battle?.phase || null, minute: window.__snapshot?.world.minute, date: window.__snapshot?.world.historicalDate,
    caption: document.querySelector('#battle-caption')?.textContent || '', famous: window.__famousDrawn || [],
    sent: window.__snapshot?.world.famous || [], camera: window.__camera?.kind, size: `${innerWidth}x${innerHeight}`,
    view: view && { people: view.people, bubbles: view.bubbles, frameMs: view.frameMs, legendScene: view.legendScene, guns: view.guns },
  };
});
/** Everything seen of each famous person across the samples: phase -> id -> the states drawn. */
function note(seen, one) {
  for (const person of one.view?.people || []) {
    const at = (seen[one.phase] ||= {}), was = (at[person.id] ||= { name: person.name, poses: new Set(), drawnAs: new Set(), fell: false, hurt: false, onScreen: false, tag: null });
    was.poses.add(person.pose); if (person.drawnAs) was.drawnAs.add(person.drawnAs); if (person.labelled) was.labelled = true; if (person.fell) was.fell = true; if (person.hurt) was.hurt = true; if (person.onScreen) was.onScreen = true; if (person.tag) was.tag = person.tag;
  }
}
const plain = seen => Object.fromEntries(Object.entries(seen).map(([phase, people]) => [phase, Object.fromEntries(Object.entries(people).map(([id, one]) => [id, { ...one, poses: [...one.poses], drawnAs: [...one.drawnAs] }]))]));

try {
  mkdirSync('test-results', { recursive: true });
  // ================================================================ 1. the Alamo (FAMOUS_PART=san-jacinto runs the second class alone, for debugging)
  if (process.env.FAMOUS_PART !== 'san-jacinto') {
  const alamo = await classroom('famous-alamo', (seed, count) => alamoClass(seed, count, { stopBefore: 1500 }), 500);
  const man = fatherOf(alamo.app.state.world, 'hh-1');
  const inside = await joinClass(alamo.url, alamo.app, 'hh-1', { width: 1366, height: 768 }, 'Garrison');
  const faraway = await joinClass(alamo.url, alamo.app, 'hh-2', { width: 1024, height: 768 }, 'Faraway');
  const host = await hostOf(alamo.url, alamo.app, { width: 1366, height: 768 });
  await host.waitForFunction(() => window.__snapshot.connected === 2);
  await start(host);
  ok(`the Alamo class through the join flow: ${man.name} of hh-1 in the garrison at Béxar (set in process), hh-2 far off`);

  // On the map before the siege: Travis, Bowie and Crockett at Béxar, named, seen by the family with a man there only.
  await inside.waitForFunction(() => (window.__snapshot.world.famous || []).length >= 3, null, { timeout: 30000 });
  const before = await read(inside);
  const far = await read(faraway);
  assert.deepEqual(before.sent.map(one => one.id).sort(), ['bowie', 'crockett', 'travis'], `the family at Béxar was not sent Travis, Bowie and Crockett: ${before.sent.map(one => one.id)}`);
  assert.deepEqual(far.sent, [], 'the family far from Béxar was sent the famous people there');
  const hostMap = await read(host);
  assert.ok(['travis', 'bowie', 'crockett'].every(id => hostMap.sent.some(one => one.id === id)), 'the Host was not sent the famous at Béxar');
  evidence.alamo.mapBefore = { student: before.sent, drawn: before.famous, hostDrawn: hostMap.famous, far: far.sent };
  ok(`on the map before the siege (${before.date}): ${before.sent.map(one => one.name).join(', ')} at Béxar, sent to the family with a man there (${before.famous.length} drawn on its screen) and the Host, and to nobody far off`);
  await shot(inside, 'map-bexar');

  // The siege and the assault on the student's page, Watch pressed, and the Host's.
  const seen = {}, seenHost = {}, lines = new Map(), captions = {};
  let frames = [], resized = false, tick = 0;
  const until = Date.now() + 15 * 60 * 1000;
  for (;;) {
    if (Date.now() > until) throw new assert.AssertionError({ message: 'the Alamo did not reach the afternoon of March 6' });
    // The runner and the Watch card are answered every few samples, so the samples come quickly through the assault.
    if (tick % 4 === 0) { await answerRunner(inside); await watch(inside); }
    const one = await read(inside), h = (tick++ % 3 === 0) ? await read(host) : {};
    note(seen, one); note(seenHost, h); (evidence.alamo.samples ||= []).push([Date.now() % 1e7, one.phase, one.minute, h.phase || null, one.camera]);
    for (const bubble of [...(one.view?.bubbles || []), ...(h.view?.bubbles || [])]) if (bubble.person) lines.set(bubble.id, bubble);
    if (one.phase && one.caption) captions[one.phase] = one.caption;
    if (one.view?.frameMs && ['alarm', 'repulse', 'north-wall', 'fallback', 'rooms', 'end'].includes(one.phase)) frames.push({ phase: one.phase, size: one.size, ...one.view.frameMs });
    if (one.phase === 'repulse' && !evidence.alamo.shotRepulse) { evidence.alamo.shotRepulse = true; await shot(inside, 'alamo-repulse-1366'); }
    if (one.phase === 'fallback' && !resized) { resized = true; await inside.setViewportSize({ width: 1024, height: 768 }); }
    if (one.phase === 'end' && seen.end?.crockett?.poses.has('captive') && !evidence.alamo.shotEnd) { evidence.alamo.shotEnd = true; await shot(inside, 'alamo-crockett-1024'); await shot(host, 'alamo-crockett-host'); }
    if (one.phase === 'the-line' && lines.has('line-sand') && !evidence.alamo.shotLine) { evidence.alamo.shotLine = true; await shot(inside, 'alamo-line'); }
    if (one.phase === 'after' && seen.after?.joe) break;
    await inside.waitForTimeout(150);
  }
  evidence.alamo.seen = plain(seen); evidence.alamo.seenHost = plain(seenHost); evidence.alamo.lines = [...lines.values()];
  const inPhase = (phase, id) => seen[phase]?.[id] || seenHost[phase]?.[id];
  // The line in the sand, as tradition, out of Travis.
  const sand = lines.get('line-sand');
  assert.ok(sand, 'the line in the sand was never drawn');
  assert.equal(sand.kind, 'tradition'); assert.equal(sand.name, 'Travis'); assert.match(sand.gloss, /told later/);
  ok(`the line in the sand spoken by Travis as tradition, from his own figure, glossed "${sand.gloss.slice(0, 60)}…"`);
  // At the alarm, the four the owner named and Joe, drawn and named on the screen.
  for (const id of ['travis', 'bowie', 'crockett', 'joe']) assert.ok((inPhase('alarm', id)?.onScreen || inPhase('repulse', id)?.onScreen) && (inPhase('alarm', id)?.labelled || inPhase('repulse', id)?.labelled), `${id} was not drawn with his name on the screen at the assault`);
  const travisLine = lines.get('al-travis');
  assert.ok(travisLine && travisLine.name === 'Travis' && travisLine.named && travisLine.kind === 'documented', 'Travis\'s words were not drawn from him under his name');
  ok('at the alarm Travis, Bowie, Crockett and Joe are drawn with their names; Travis\'s documented words come out of his own figure');
  // Travis falls at the north battery in the repulse, and not before.
  assert.ok(!inPhase('alarm', 'travis')?.fell, 'Travis fell before the repulse');
  assert.ok(inPhase('repulse', 'travis')?.fell, 'Travis was not seen to fall in the repulse');
  assert.ok(inPhase('north-wall', 'travis')?.fell, 'Travis does not lie where he fell');
  assert.ok(inPhase('repulse', 'travis')?.drawnAs.has('travis-still-ramp') || inPhase('north-wall', 'travis')?.drawnAs.has('travis-still-ramp'), 'Travis dedicated still pose was not drawn');
  ok('Travis falls in the repulse at the north battery, not before, and lies there');
  // Bowie on his cot, then still on it when the low barrack is carried.
  assert.ok(inPhase('alarm', 'bowie')?.poses.has('sick'), 'Bowie was not on his cot at the alarm');
  assert.ok(inPhase('fallback', 'bowie')?.fell && (inPhase('fallback', 'bowie').poses.has('still-bed') || inPhase('rooms', 'bowie')?.poses.has('still-bed')), 'Bowie did not lie still on his cot');
  ok('Bowie lies ill on his cot in his room on the south side, and lies still on it when that barrack is carried');
  for (const id of ['bonham', 'almeron-dickinson', 'esparza']) {
    const room = inPhase('rooms', id);
    assert.ok(room?.onScreen && [...room.drawnAs].some(how => how.startsWith(`${id}-`)), `${id} did not render from his own atlas in the church-gun scene`);
  }
  ok('Bonham, Dickinson and Esparza render from their own atlases at the Alamo guns');
  // Crockett fights, is taken, is tagged as one account, and both accounts are in the caption; then he falls.
  for (const phase of ['alarm', 'repulse', 'north-wall']) assert.ok(inPhase(phase, 'crockett')?.poses.has('fire'), `Crockett was not fighting in ${phase}`);
  assert.ok(inPhase('end', 'crockett')?.poses.has('captive'), 'Crockett was not drawn taken');
  assert.match(inPhase('end', 'crockett').tag || '', /One account \(de la Peña\)/);
  assert.ok(inPhase('end', 'crockett').fell, 'Crockett was not drawn killed after the fighting');
  assert.ok(inPhase('end', 'crockett').drawnAs.has('crockett-captive') && inPhase('end', 'crockett').drawnAs.has('crockett-still-side'),
    'Crockett did not display both the unarmed captive animation and non-graphic still art');
  assert.ok(inPhase('end', 'santa-anna') && inPhase('end', 'castrillon'), 'Santa Anna and Castrillón were not there');
  for (const words of [/de la Peña/, /Joe said/, /Susanna Dickinson/, /1955/, /not known for certain/]) assert.match(captions.end || '', words);
  ok(`Crockett fights through the assault; after it he is taken, tagged "${inPhase('end', 'crockett').tag}", brought before Santa Anna with Castrillón there, and killed; the caption gives both accounts and the dispute`);
  // Joe: firing from the house, coming out, hurt, never down, and brought to Santa Anna in Béxar.
  assert.ok(inPhase('repulse', 'joe')?.poses.has('fire-hidden') || inPhase('rooms', 'joe')?.poses.has('fire-hidden'), 'Joe was not drawn firing from the house');
  assert.ok(inPhase('repulse', 'joe')?.drawnAs.has('joe-fire-door') || inPhase('rooms', 'joe')?.drawnAs.has('joe-fire-door'), 'Joe doorway firing art was not drawn');
  assert.ok(inPhase('end', 'joe')?.poses.has('emerge') && inPhase('end', 'joe').hurt, 'Joe was not drawn coming out and hurt');
  assert.ok(inPhase('end', 'joe')?.drawnAs.has('joe-hurt-e'), 'Joe wounded pose was not drawn');
  assert.ok(lines.get('e-joe')?.name === 'Joe', 'Joe\'s own words were not drawn from him');
  assert.ok(Object.values(seen).every(phase => !phase.joe?.fell), 'Joe was drawn fallen');
  assert.ok(inPhase('after', 'joe') && inPhase('after', 'santa-anna'), 'Joe was not brought to Santa Anna');
  ok('Joe fires from the house, comes out when the officers call ("Yes, here is one."), is hurt and spared, and is brought to Santa Anna in Béxar');
  const framed = evidence.alamo.samples.filter(one => ['alarm', 'repulse', 'north-wall', 'fallback', 'rooms', 'end'].includes(one[1]));
  assert.ok(framed.length && framed.filter(one => one[4] === 'battle').length >= framed.length / 2, `Watch did not keep the student's camera on the assault: ${framed.map(one => one[4]).join(',')}`);
  ok(`the student watched the assault with the camera on the compound (${framed.filter(one => one[4] === 'battle').length} of ${framed.length} samples)`);
  const alamoFrames = frames.map(one => one.p95).filter(Number.isFinite);
  evidence.alamo.frameMs = { p95Max: Math.max(...alamoFrames), medians: frames.map(one => one.median) };
  assert.ok(Math.max(...alamoFrames) < 50, `the assault draws too slowly: ${Math.max(...alamoFrames)} ms`);
  ok(`the assault with its famous people draws in ${Math.max(...alamoFrames).toFixed(1)} ms at its slowest 95th percentile (1366x768 and 1024x768)`);
  const farAfter = await faraway.evaluate(async () => JSON.parse(await (await fetch('/api/state')).text()).world);
  assert.equal(farAfter.battle, null); assert.equal(farAfter.famous, undefined, 'the family far off was sent the famous');
  ok('the family far off was sent no battle and no famous person');
  }

  // ================================================================ 2. San Jacinto
  const toLynchburg = (seed, count) => {
    const world = createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true });
    for (const household of Object.values(world.households)) rollFamily(world, household);
    world.status = 'running';
    for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
    beginSecondPeriod(world); world.status = 'running';
    for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
    beginThirdPeriod(world); world.status = 'running';
    for (let i = 0; i < 3000 && world.minute < momentOf(world, 'san-jacinto-field') - 60; i++) stepWorld(world);
    // A played family's man with Houston at Lynchburg, put there in process (tests/support/san-jacinto.mjs `serve`): the first
    // day's skirmish and the capture are quiet phases, held only while a played family is there (docs/BATTLES.md §13), and the
    // Twin Sisters' April 20 and the Napoleon of the West are in them. The lesson is past for both families the proof plays.
    const man = grownMen(world).find(one => one.householdId === 'hh-1');
    serve(world, man, 'lynchburg');
    for (const id of ['hh-1', 'hh-2']) world.households[id].lesson = { ...world.households[id].lesson, step: 'done', stopped: true, at: world.minute };
    // The family kept far off has nobody with the army: any man of it serving is back with his family (in process, said here).
    const home = world.households['hh-2'].members.map(id => world.entities[id]).find(one => !one.service && one.location)?.location;
    for (const id of world.households['hh-2'].members) {
      const one = world.entities[id];
      if (one.service?.kind === 'houston') { delete one.service; one.travel = null; one.chore = null; if (home) one.location = { ...home }; }
    }
    world.status = 'lobby';
    return world;
  };
  const sj = await classroom('famous-sj', toLynchburg, 450);
  const soldier = await joinClass(sj.url, sj.app, 'hh-1', { width: 1024, height: 768 }, 'Lineman');
  const refugee = await joinClass(sj.url, sj.app, 'hh-2', { width: 1024, height: 768 }, 'Ferryside');
  const sjHost = await hostOf(sj.url, sj.app, { width: 1366, height: 768 });
  await sjHost.waitForFunction(() => window.__snapshot.connected === 2);
  await start(sjHost);
  evidence.sanJacinto.soldierFamily = await soldier.evaluate(() => window.__snapshot?.world.householdId);
  const sjSeen = {}, sjLines = new Map(), guns = {}, legend = [], sjCaptions = {};
  let sjFrames = [], sjResized = false, sawTaken = false;
  const sjUntil = Date.now() + 10 * 60 * 1000;
  for (;;) {
    if (Date.now() > sjUntil) throw new assert.AssertionError({ message: 'San Jacinto did not reach the capture' });
    const one = await read(sjHost);
    note(sjSeen, one); (evidence.sanJacinto.samples ||= []).push([Date.now() % 1e7, one.date, one.minute, one.phase, one.camera]); if (evidence.sanJacinto.samples.length % 20 === 1) console.log("sample", one.date, one.minute, one.phase, one.camera, (one.view?.people || []).length);
    for (const bubble of one.view?.bubbles || []) if (bubble.person) sjLines.set(bubble.id, bubble);
    for (const gun of one.view?.guns || []) guns[gun.id] = { ...(guns[gun.id] || {}), name: gun.name || guns[gun.id]?.name, shots: Math.max(gun.shots || 0, guns[gun.id]?.shots || 0), onScreen: gun.onScreen || guns[gun.id]?.onScreen };
    if (one.view?.legendScene) legend.push({ phase: one.phase, ...one.view.legendScene });
    if (one.phase && one.caption) sjCaptions[one.phase] = one.caption;
    if (one.view?.frameMs && one.phase) sjFrames.push({ phase: one.phase, size: one.size, ...one.view.frameMs });
    if (one.phase === 'advance' && !evidence.sanJacinto.shotPicnic) { evidence.sanJacinto.shotPicnic = true; await shot(sjHost, 'sj-picnic-1366'); }
    if (one.phase === 'guns' && !sjResized) { sjResized = true; await sjHost.setViewportSize({ width: 1024, height: 768 }); }
    if (one.phase === 'charge' && !evidence.sanJacinto.shotCharge) { evidence.sanJacinto.shotCharge = true; await shot(sjHost, 'sj-charge-1024'); }
    // The capture's words are said in its last tick and stay up into the next phase, where the page still draws them.
    if (['taken', 'held'].includes(one.phase) && sjLines.has('sj-remember')) { await shot(sjHost, 'sj-taken'); break; }
    if (one.phase === 'taken') sawTaken = true;
    if (sawTaken && !['taken', 'held'].includes(one.phase)) break;
    await sjHost.waitForTimeout(150);
  }
  evidence.sanJacinto.seen = plain(sjSeen); evidence.sanJacinto.lines = [...sjLines.values()]; evidence.sanJacinto.guns = guns; evidence.sanJacinto.legend = legend.slice(0, 3);
  const sjIn = (phase, id) => sjSeen[phase]?.[id];
  // The Twin Sisters, named and firing on both days; Neill hurt at them.
  assert.equal(guns['twins-20-1']?.name, 'Twin Sisters', 'the Twin Sisters were not named on the 20th');
  assert.ok((guns['twins-20-1']?.shots || 0) + (guns['twins-20-2']?.shots || 0) >= 2, 'the Twin Sisters did not fire on the 20th');
  assert.equal(guns['twin-sister-1']?.name, 'Twin Sisters', 'the Twin Sisters were not named on the 21st');
  assert.ok((guns['twin-sister-1']?.shots || 0) + (guns['twin-sister-2']?.shots || 0) >= 2, 'the Twin Sisters did not fire on the 21st');
  assert.ok(sjIn('skirmish', 'neill')?.hurt, 'Neill was not drawn hurt at the guns');
  assert.ok(sjIn('guns', 'hockley'), 'Hockley was not at the guns');
  ok(`the Twin Sisters named and firing before the camp on April 20 (Neill hurt at them) and within two hundred yards on the 21st under Hockley: ${JSON.stringify(guns)}`);
  // Houston with the line, hurt in the charge.
  assert.ok(sjIn('advance', 'houston')?.onScreen, 'Houston was not drawn with the line');
  assert.ok(['parade', 'guns', 'volley', 'killing'].some(phase => sjIn(phase, 'houston')?.drawnAs.has('houston-mounted-walk-e')), 'Houston did not render from his own mounted walking art');
  assert.ok(sjIn('charge', 'houston')?.hurt || sjIn('rout', 'houston'), 'Houston was not drawn in the charge');
  const stop = sjLines.get('sj-stop-firing');
  assert.ok(stop && stop.kind === 'tradition' && stop.name === 'Houston', 'Houston\'s "stop that firing" was not spoken as tradition');
  ok(`Houston named with his army and riding with the line; "${stop.text}" out of him, as tradition`);
  // The picnic: the dashed label, her words with their stage direction, nothing more.
  assert.ok(legend.some(one => one.id === 'emily-west-picnic' && one.kind === 'tradition'), 'the picnic was not drawn');
  const emily = [...sjLines.values()].filter(line => line.person === 'emily-west');
  assert.ok(emily.length >= 2, `Emily West's words were not drawn: ${emily.length}`);
  assert.ok(emily.every(line => line.kind === 'tradition' && line.manner && /told later/.test(line.gloss)), 'her words lost their stage direction or their tradition label');
  assert.match(sjCaptions.waiting || sjCaptions.parade || sjCaptions.advance || '', /./);
  ok(`Emily West and Santa Anna at the picnic under the dashed "later story" label; her words drawn with their stage direction: ${emily.map(line => `(${line.manner}) ${line.text}`).join(' / ')}`);
  // Castrillón on his crate, walking away, falling; the capture's words as tradition.
  assert.ok(sjIn('charge', 'castrillon') && ['charge', 'rout', 'killing'].some(phase => sjIn(phase, 'castrillon')?.fell), 'Castrillón was not seen to fall');
  const napoleon = sjLines.get('sj-napoleon'), remember = sjLines.get('sj-remember');
  assert.ok(napoleon?.name === 'Santa Anna' && napoleon.kind === 'tradition', 'the Napoleon of the West was not spoken by Santa Anna as tradition');
  assert.ok(remember?.name === 'Houston' && remember.kind === 'tradition');
  ok('Castrillón falls walking away in the charge; at the capture Santa Anna\'s "Napoleon of the West" and Houston\'s answer are spoken as tradition, from their own figures');
  const sjF = sjFrames.map(one => one.p95).filter(Number.isFinite);
  evidence.sanJacinto.frameMs = { p95Max: Math.max(...sjF), byPhase: Object.fromEntries([...new Set(sjFrames.map(one => one.phase))].map(phase => [phase, Math.max(...sjFrames.filter(one => one.phase === phase).map(one => one.p95))])) };
  assert.ok(Math.max(...sjF) < 50, `San Jacinto draws too slowly: ${Math.max(...sjF)} ms`);
  ok(`San Jacinto with its famous people draws in ${Math.max(...sjF).toFixed(1)} ms at its slowest 95th percentile`);
  const refugeeWorld = await refugee.evaluate(async () => JSON.parse(await (await fetch('/api/state')).text()).world);
  assert.equal(refugeeWorld.battle, null, 'a family far off was sent San Jacinto');
  ok('a family far off was sent nothing of San Jacinto');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  evidence.verdict = 'PASS';
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/famous-people-browser.json`);
} catch (error) {
  evidence.verdict = 'FAIL'; evidence.failure = error.message;
  throw error;
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(evidence.verdict === 'PASS' ? 'docs/evidence/famous-people-browser.json' : 'test-results/famous-people-browser-failed.json', `${JSON.stringify({
    record: 'famous-people-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: local classroom servers and headless Chrome at 1366x768 and 1024x768, served at 500 ms (the Alamo) and 450 ms (San Jacinto) a tick. Two real classes on the colonies map with rolled families played in process: one to the edge of the Alamo siege with hh-1\'s father set in the garrison (in process), one to noon on April 19, 1836. Not physical LAN or district acceptance.',
    checks: pass, ...evidence, errors,
  }, null, 2)}\n`);
  await browser.close();
  for (const app of apps) await app.close();
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
}
