// A rider's visit as a scene, proved in a real browser (owner, 2026-10-05, verbatim: "I want to radically redesign the whole
// rider and or news person shows up. The conversation is boring. Let's redo each of them as a cutscene sort of like with the
// wedding. The environment should change in the cutscene based on where they are and who's around them."; chosen the same day:
// "Every rider who reaches you"; docs/COLONIES.md §5.4e, `FIC-GONZ-1195` to `-1199`).
//
// Two Play Solo games on the real land:
//
//   A. At home. The family's rider with the cannon news reaches it at its own house. Opening the "!" plays the scene: the yard is
//      the map's own ground at the family's land (stand-in for the backdrops), the family's own people who are near stand in it
//      in their own looks, the rider rides in and gets down by his horse, and says his word. A question is asked by one of the
//      people standing there (named on its button), the answer comes, the journal keeps it. Done: he gets up, rides on, the
//      family says its last words, and the scene goes; the journal has the meeting.
//   B. In town. One of the family stands in Gonzales's street when a rider sets out from it with the word: the scene is the
//      town's street, with the town's own people in it beside the family's.
//
// Same computer only: headless Chrome with motion on, so the riding in and out is drawn. Run: npm run test:rider-scene
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { dispatchReport, rollFamily, stepWorld } from '../sim/world.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const TOPIC = 'cannon-request';
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => page.screenshot({ path: `docs/evidence/rider-scene-${name}.png` });
const until = async (label, check, ms = 60000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  throw new Error(`timed out: ${label}`);
};

/** A class stepped in process to a few ticks before the first family's rider reaches its house. */
function atHome(_seed, count) {
  const world = createGonzalesWorld('q2', count, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  // Stepped as the student's family, not on auto: a family nobody plays goes about its errands, and is met wherever it went.
  world.households['hh-1'].played = true;
  const coming = () => Object.values(world.entities).find(one => one.report?.inPerson && one.report.audience === 'hh-1' && one.report.destination === one.report.homeSiteId && one.travel);
  for (let t = 0; t < 3000; t++) {
    const rider = coming();
    if (rider && rider.travel.distance - rider.travel.progress < rider.travel.speed * 4) break;
    stepWorld(world);
  }
  if (!coming()) throw new Error('q2: no rider on his last leg to the first family');
  delete world.households['hh-1'].played;
  return world;
}
/** A class where the first family's father stands in Gonzales's street on the morning the town's riders set out. */
function inTown(_seed, count) {
  const world = createGonzalesWorld('q2', count, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let t = 0; t < 3000 && !world.truth[TOPIC]; t++) stepWorld(world);
  const household = world.households['hh-1'];
  const father = household.members.map(id => world.entities[id]).find(person => person.kin?.role === 'father') || world.entities[household.members[0]];
  const town = world.map.sites.gonzales;
  Object.assign(father, { travel: null, task: 'rest', chore: null, location: { x: town.x, y: town.y, siteId: 'gonzales' } });
  for (const rider of Object.values(world.entities)) if (rider.report?.audience === 'hh-1') delete rider.report;
  delete world.knowledge.households['hh-1'][TOPIC];
  world.director.dispatches['hh-1'] = true;
  dispatchReport(world, TOPIC, 'hh-1');
  return world;
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

async function student(app, name) {
  const game = app.newSoloGame(name);
  const page = await (await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  await page.goto(`http://127.0.0.1:${app.port}${game.path}`);
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 30000 });
  await meetFamily(page);
  if (await page.locator('#journal-close').isVisible()) await page.locator('#journal-close').click();
  await page.locator('#wagon-done').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  await page.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  // Tips are another proof's business.
  page.__tips = setInterval(() => { page.locator('#tip:not([hidden]) .tip-close').click({ timeout: 200 }).catch(() => {}); }, 400);
  return page;
}
/** The family's own open meeting on the server, and its "!" pressed as a student presses it. */
async function openScene(app, page) {
  await until('the rider reaching the family', () => Object.values(app.state.world.encounters || {}).some(one => one.householdId === 'hh-1' && one.status === 'open'), 120000);
  const encounter = Object.values(app.state.world.encounters).find(one => one.householdId === 'hh-1' && one.status === 'open');
  await page.waitForFunction(() => window.__snapshot?.world?.encounter?.status === 'open', null, { timeout: 15000 });
  await page.locator(`.panel-row[data-entity-id="${encounter.listenerId}"] .panel-attention`).click({ force: true });
  await page.waitForFunction(() => !document.querySelector('#encounter').hidden, null, { timeout: 8000 });
  return encounter;
}

try {
  // ------------------------------------------------------------------ A. at home
  {
    const app = createClassroom({ seed: 'rider-scene-home', playerCount: 15, tickMs: 400, solo: true, worldFactory: atHome });
    app.port = await app.listen(0, '127.0.0.1');
    const page = await student(app, 'Rider scene at home');
    const encounter = await openScene(app, page);
    const server = app.state.world.encounters[encounter.id];
    measured.home = { setting: server.scene.setting, cast: server.scene.cast };
    assert.equal(server.scene.setting.kind, 'home', `the family was met at home, but the scene is ${server.scene.setting.kind}`);
    // The riding in, caught as it is drawn.
    // What the page drew at the moment he was seen riding in, then its picture.
    const arriving = await (await page.waitForFunction(() => window.__riderScene?.rider?.state === 'riding-in' && { ...window.__riderScene, timeline: undefined }, null, { timeout: 8000 })).jsonValue();
    await shot(page, 'home-arriving');
    assert.equal(arriving.backdrop, 'map-ground', `the yard was not laid from the map's own ground (${arriving.backdrop})`);
    ok(`the rider rides into the family's own yard (${arriving.rider.state}, ${arriving.rider.sprite}); the ground is the map's at the family's land`);
    // Got down, and his word said: the strip names him and the scene has him by his horse.
    await page.waitForFunction(() => window.__riderScene?.phase === 'talk' && document.querySelectorAll('#encounter-said li:not([data-pending])').length >= 1, null, { timeout: 12000 });
    await page.waitForTimeout(1500);
    const talking = await page.evaluate(() => ({ scene: { ...window.__riderScene, timeline: undefined }, place: document.querySelector('#encounter-where').textContent, said: [...document.querySelectorAll('#encounter-said li')].map(li => li.textContent) }));
    await shot(page, 'home-talking');
    measured.home.drawn = talking.scene.drawn; measured.home.pieces = talking.scene.pieces; measured.home.rider = talking.scene.rider; measured.home.place = talking.place;
    assert.match(talking.place, /^At home · /, `the scene is not headed as home: ${talking.place}`);
    const castIds = server.scene.cast.map(one => one.id).sort();
    assert.deepEqual(talking.scene.drawn.map(one => one.id).sort(), castIds, 'the people drawn are not the people the server put in the scene');
    assert.ok(talking.scene.drawn.every(one => one.drawn), `somebody of the scene was not drawn: ${JSON.stringify(talking.scene.drawn)}`);
    assert.ok(talking.scene.pieces.some(name => /^house-|^tent$|^cabin-ruin$/.test(name)), `the family's house or camp is not in its yard: ${talking.scene.pieces}`);
    assert.match(talking.scene.rider.sprite || '', /^courier-onfoot-|^courier-dismount-/, `the rider is not standing by his horse: ${talking.scene.rider.sprite}`);
    // Everybody of the family standing near is in it, and nobody who is not.
    const world = app.state.world;
    const listener = world.entities[server.listenerId];
    const near = world.households['hh-1'].members.filter(id => { const one = world.entities[id]; return one && Math.hypot(one.location.x - listener.location.x, one.location.y - listener.location.y) <= 0.3; });
    assert.ok(near.every(id => castIds.includes(id) || castIds.length >= 8), 'somebody of the family standing near is missing from the scene');
    ok(`"${talking.place}": ${castIds.length} of the family in their own looks (${talking.scene.drawn.map(one => one.clip).join(', ')}), the ${talking.scene.pieces.join(', ')} behind them, the rider by his horse`);

    // A question, asked by one of the people standing there.
    await page.waitForFunction(() => !document.querySelector('#encounter-asks').hidden && document.querySelectorAll('#encounter-asks .ask-option').length > 0, null, { timeout: 30000 });
    const button = page.locator('#encounter-asks .ask-option').first();
    const choice = await button.evaluate(node => ({ by: node.dataset.by || null, asker: node.querySelector('.ask-by')?.textContent || null, ask: node.lastChild.textContent, line: node.dataset.lineId }));
    assert.ok(choice.by && choice.asker, `the question does not say who of the scene asks it: ${JSON.stringify(choice)}`);
    const before = JSON.stringify(app.state.world.encounters[encounter.id].said);
    await button.click();
    await until('the question answered', () => app.state.world.encounters[encounter.id].asked.includes(choice.line), 15000);
    const after = app.state.world.encounters[encounter.id];
    const asked = after.said.find(line => line.speaker === 'listener' && line.text === choice.ask);
    assert.equal(asked.speakerId || after.listenerId, choice.by, 'the question was asked by somebody other than the one its button named');
    assert.ok(!before.includes(after.said.at(-1).text), 'the answer was in the meeting before it was asked');
    const details = app.state.world.knowledge.households['hh-1'][TOPIC].details || [];
    assert.ok(details.some(one => one.ask === choice.ask), 'the family\'s record does not keep what was asked and answered');
    await page.waitForFunction(by => window.__riderScene?.speaker === by || document.querySelectorAll('#encounter-said li').length > 2, choice.by, { timeout: 10000 });
    await page.waitForTimeout(3500);
    await shot(page, 'home-asked');
    measured.home.asked = { ...choice, answer: after.said.at(-1).text };
    ok(`${choice.asker} asks "${choice.ask}", and the rider answers; the family's record keeps it`);

    // Done: he mounts and rides on, the family's last words, and the scene goes.
    await page.waitForFunction(() => !document.querySelector('#encounter-asks').hidden, null, { timeout: 30000 });
    await page.locator('#encounter .ask-leave:not(.ask-done)').click();
    await page.waitForFunction(() => window.__riderScene?.rider?.state === 'mounting', null, { timeout: 8000 });
    await page.waitForTimeout(900);
    await shot(page, 'home-leaving');
    await page.waitForFunction(() => window.__riderScene?.rider?.state === 'riding-on' || document.querySelector('#encounter').hidden, null, { timeout: 8000 });
    await until('the meeting closing on the server', () => app.state.world.encounters[encounter.id].status === 'closed', 10000);
    const closing = app.state.world.encounters[encounter.id].talk.filter(line => line.farewell || line.closing).map(line => line.text);
    assert.ok(closing.length >= 2, `nobody said goodbye: ${JSON.stringify(closing)}`);
    await page.waitForFunction(() => document.querySelector('#encounter').hidden, null, { timeout: 15000 });
    measured.home.closing = closing;
    ok(`Done: he gets up and rides on, "${closing.join(' / ')}", and the scene goes`);
    clearInterval(page.__tips);
    await page.context().close();
    await app.close?.();
  }

  // ------------------------------------------------------------------ B. in town
  {
    const app = createClassroom({ seed: 'rider-scene-town', playerCount: 15, tickMs: 400, solo: true, worldFactory: inTown });
    app.port = await app.listen(0, '127.0.0.1');
    const page = await student(app, 'Rider scene in town');
    const encounter = await openScene(app, page);
    const server = app.state.world.encounters[encounter.id];
    measured.town = { setting: server.scene.setting, cast: server.scene.cast };
    assert.equal(server.scene.setting.kind, 'town', `the father was met in Gonzales, but the scene is ${server.scene.setting.kind}`);
    assert.equal(server.scene.setting.siteId, 'gonzales');
    assert.ok(server.scene.cast.some(one => one.role === 'town'), `nobody of the town is in the scene: ${JSON.stringify(server.scene.cast)}`);
    await page.waitForFunction(() => window.__riderScene?.phase === 'talk', null, { timeout: 15000 });
    await page.waitForTimeout(2500);
    const scene = await page.evaluate(() => ({ ...window.__riderScene, timeline: undefined, place: document.querySelector('#encounter-where').textContent }));
    await shot(page, 'town');
    measured.town.drawn = scene.drawn; measured.town.pieces = scene.pieces; measured.town.place = scene.place;
    assert.match(scene.place, /^Gonzales · /);
    assert.ok(scene.pieces.some(name => /^shop-|^storehouse$|^cabin-wide$/.test(name)), `the town's street has none of its buildings: ${scene.pieces}`);
    assert.ok(scene.drawn.some(one => one.role === 'town' && one.drawn), 'the town\'s people are not drawn');
    ok(`"${scene.place}": the street (${scene.pieces.join(', ')}), the family's ${scene.drawn.filter(one => one.role !== 'town').length} and the town's ${scene.drawn.filter(one => one.role === 'town').length} (${server.scene.cast.filter(one => one.role === 'town').map(one => app.state.world.entities[one.id]?.name).join(', ')})`);
    // Escape puts it away at once, and he is let go.
    await page.keyboard.press('Escape');
    await until('Escape letting him go', () => app.state.world.encounters[encounter.id].status === 'closed', 10000);
    assert.equal(await page.locator('#encounter').isHidden(), true, 'Escape left the scene on the screen');
    ok('Escape puts the scene away at once and lets him go');
    clearInterval(page.__tips);
    await page.context().close();
    await app.close?.();
  }
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/rider-scene.json', JSON.stringify({ proved: '2026-10-05', pass, measured }, null, 2) + '\n');
  console.log(`\n${pass.length} checks passed`);
} catch (error) {
  console.error('FAIL', error.message, errors.length ? `\npage errors: ${errors.join(' | ')}` : '');
  writeFileSync('docs/evidence/rider-scene-failed.json', JSON.stringify({ error: error.message, pass, measured, errors }, null, 2) + '\n');
  process.exitCode = 1;
} finally {
  await browser.close();
  process.exit(process.exitCode || 0);
}
