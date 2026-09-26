// Gonzales before the fight, in a real class (docs/BATTLES.md §5 step 2; sim/town-scenes.mjs, public/town-scenes.js).
//
// The owner, 2026-09-25: "when i try to watch a battle, or actions that led to a battle, i see npc's just standing around.
// example: there's no one worried at gonzales that the mexicans are coming. there's no group of women making the come and
// take it flag." This walks a class through the real join flow with one of the student's family standing in Gonzales from
// the morning of September 29 to the evening of October 2, and holds the page to what the owner asked for:
//
//   - at every sampled moment the town's people are doing different things, not all standing idle;
//   - the women are making the flag on its days (September 30 - October 1);
//   - words are drawn over the people saying them, and the one line on record (Clements's refusal) is drawn as on record;
//   - people who change place in the town walk there at a person's pace - the residents included, who used to slide;
//   - clicking a scene opens its card, told by a person, with what is known and how well, and the family's own person can
//     lend a hand where the record has people doing that work;
//   - a family out on its land is sent none of it, and the Host sees it all.
//
// Same computer only: headless Chrome at 1366x768 and 1024x768. Run: npm run test:gonzales-town
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { on, sceneClock } from '../sim/town-scenes.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const shots = [];
const TICK_MS = Number(process.env.TOWN_TICK_MS || 1400);

/**
 * A class on the real land, played to the morning of September 29 with the first family's main person walked into Gonzales
 * and the second family at home on its land. Then put back in the lobby, so the students join it as they join any class.
 */
function playedToTheTown(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.members.some(id => world.entities[id].travel)) && guard++ < 600) stepWorld(world);
  while (sceneClock(world) < on(0, 5) && guard++ < 2000) stepWorld(world);
  const principal = world.entities[world.households['hh-1'].principalId];
  applyAction(world, 'hh-1', { action: 'travel', entityId: principal.id, destination: 'gonzales' });
  while ((principal.travel || sceneClock(world) < on(0, 11)) && guard++ < 3000) stepWorld(world);
  assert.equal(principal.location.siteId, 'gonzales', 'the first family\'s person never reached Gonzales');
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'gonzales-town-proof', playerCount: 5, tickMs: TICK_MS, worldFactory: playedToTheTown });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
  return response;
};
const cookieOf = response => response.headers.get('set-cookie').split(';')[0];
mkdirSync('test-results', { recursive: true });
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `test-results/gonzales-town-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const evidence = { samples: [], beats: {}, said: {}, walking: {}, residentSpeeds: [], cards: {}, help: null, host: {}, away: {} };

try {
  const hostCookie = cookieOf(await post('/api/host', { key: app.state.hostKey }));
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  // Every order the page sends that the server refuses, with what it sent: a refused help is a fault this checks.
  const refused = [];
  page.on('response', async response => {
    if (!response.url().endsWith('/api/command') || response.status() === 200) return;
    refused.push({ sent: response.request().postData(), said: await response.text().catch(() => '') });
  });
  await page.goto(url);
  await page.locator('[name=name]').fill('Town watcher');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page, 'Watcher', { timeout: 4000 });
  // The second family: joined as any student is, never opened in a browser, and never leaves its land.
  const awayCookie = cookieOf(await post('/api/join', { name: 'Farm family', code: app.state.sessionCode }));
  for (let i = 3; i <= 5; i++) await post('/api/join', { name: `Student ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `town-start-${crypto.randomUUID()}`, action: 'start', anyway: true }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  // The student stops the guided start, as a student may (its X), so a click on the town is not taken for a house site, and
  // puts away the card of the person they last chose.
  if (await page.locator('#lesson-stop').isVisible()) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => !window.__snapshot.world.lesson, null, { timeout: 15000 });
  }
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  await page.locator('#map-nav [data-view=gonzales]').click();
  await page.waitForFunction(() => window.__camera?.scale >= 200, null, { timeout: 10000 });
  const principalId = await page.evaluate(() => window.__snapshot.world.household.principalId || window.__snapshot.world.household.members[0]);
  const principal = await page.evaluate(id => window.__snapshot.world.entities.find(e => e.id === id), principalId);
  // What the page was sent and drew, kept by the page itself ten times a second, so a beat or a line that comes and goes
  // while this script is busy clicking a card or taking a picture is still counted.
  await page.evaluate(() => {
    window.__townLog = { beats: {}, said: {} };
    setInterval(() => {
      for (const scene of window.__snapshot?.world.townScenes?.scenes || []) window.__townLog.beats[scene.beat] = (window.__townLog.beats[scene.beat] || 0) + 1;
      for (const line of window.__townSaid || []) { const key = `${line.kind}:${line.speakerId}`; window.__townLog.said[key] = (window.__townLog.said[key] || 0) + 1; }
    }, 100);
  });

  // ---------------------------------------------------------------- sample the town as the days go by, from the page
  const clockOf = minute => minute - 1080;
  const sample = () => page.evaluate(() => ({
    minute: window.__snapshot.world.minute, tick: window.__snapshot.world.tick,
    beats: (window.__snapshot.world.townScenes?.scenes || []).map(scene => scene.beat),
    cast: (window.__townCast || []).map(one => ({ id: one.id, pose: one.pose, clip: one.clip, moving: one.moving })),
    said: (window.__townSaid || []).map(line => ({ speakerId: line.speakerId, kind: line.kind, text: line.text })),
    walkers: (window.__townWalkers || []).map(one => ({ id: one.id, stepping: one.stepping, pose: one.pose, x: one.x, y: one.y })),
    camera: { scale: window.__camera.scale, figure: window.__camera.figure },
    at: performance.now(),
  }));
  const residents = new Set(['town-crandall', 'town-ibarra', 'town-pike', 'town-carpenter']);
  let last = null, helped = false;
  const want = { flagCard: false, readingSeen: false };
  const stopAt = on(3, 17);
  for (let guard = 0; guard < 4000; guard++) {
    const now = await sample();
    const clock = clockOf(now.minute);
    for (const one of now.cast) if (one.moving) evidence.walking[one.clip] = (evidence.walking[one.clip] || 0) + 1;
    for (const one of now.walkers) if (residents.has(one.id) && one.stepping) evidence.walking[`resident:${one.id}`] = (evidence.walking[`resident:${one.id}`] || 0) + 1;
    // How fast each resident is drawn crossing the town between two looks, against a walk at the town's pace.
    if (last) {
      const seconds = (now.at - last.at) / 1000;
      for (const one of now.walkers.filter(entry => residents.has(entry.id))) {
        const before = last.walkers.find(entry => entry.id === one.id);
        if (!before || seconds <= 0) continue;
        const miles = Math.hypot(one.x - before.x, one.y - before.y);
        if (miles > 0) evidence.residentSpeeds.push({ id: one.id, heightsASecond: +(miles / seconds / (now.camera.figure / now.camera.scale)).toFixed(3), miles: +miles.toFixed(4) });
      }
    }
    if (now.cast.length) {
      // What each was drawn doing, read off the clip the page drew - not the pose the server asked for, which a page that
      // drew everybody standing would still report.
      const drawnPose = one => one.moving ? 'walking' : one.clip.replace(/^(teal|indigo|elder|ochre|blue-girl|blue|girl|boy|volunteer|dragoon|mounted-courier)-/, '').replace(/-[nesw]$/, '');
      const poses = new Set(now.cast.map(drawnPose));
      evidence.samples.push({ clock, beats: now.beats, people: now.cast.length, poses: [...poses], idle: now.cast.filter(one => drawnPose(one) === 'idle').length });
    }
    // Pictures at the moments worth seeing.
    for (const [name, beat, scene] of [['alarm', 'street-alarm', 'street'], ['camp', 'camp-mound', 'camp'], ['flag', 'flag-cloth', 'flag'], ['shop', 'shop-mount', 'cannon'], ['reading', 'crossing-reading', 'crossing'], ['muster', 'muster-day', 'muster'], ['over', 'crossing-over', 'crossing'], ['return', 'street-return', 'street']]) {
      if (now.beats.includes(beat) && !shots.some(path => path.includes(`-${name}.png`))) { await shot(page, name); await closeShot(page, `${name}-close`, scene); }
    }
    // The flag: click the scene and read its card, at 1024x768 too.
    if (now.beats.includes('flag-cloth') && clock >= on(1, 19) && !want.flagCard) {
      want.flagCard = true;
      evidence.cards.flag = await openCard(page, 'flag');
      await shot(page, 'flag-card-1366');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await page.locator('#map-nav [data-view=gonzales]').click();
      await page.waitForTimeout(400);
      evidence.cards.flag1024 = await openCard(page, 'flag');
      await shot(page, 'flag-card-1024');
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.waitForTimeout(300);
      await page.locator('#map-nav [data-view=gonzales]').click();
      await page.waitForTimeout(300);
    }
    // Lending a hand: with the flag for a woman, with the gun for a man - whichever this family's person is.
    const helpScene = principal.sex === 'female' ? 'flag' : 'cannon';
    if (!helped && (helpScene === 'flag' ? now.beats.includes('flag-cloth') : now.beats.includes('shop-mount'))) {
      helped = true;
      const card = await openCard(page, helpScene);
      assert.ok(card.opened, `clicking the ${helpScene} did not open its card`);
      const button = page.locator(`#town-scene button[data-town-help="${principalId}"]`);
      await button.waitFor({ state: 'visible', timeout: 5000 });
      assert.ok(await button.isEnabled(), `${principal.name} cannot help with the ${helpScene}: ${await page.locator('#town-scene').innerText()}`);
      await button.click();
      await page.waitForFunction(id => window.__snapshot.world.townScenes?.poses?.[id], principalId, { timeout: 15000 });
      await page.waitForTimeout(2500);
      const drawn = await page.evaluate(id => (window.__townWalkers || []).find(one => one.id === id), principalId);
      evidence.help = { scene: helpScene, card: card.title, drawn };
      await shot(page, `help-${helpScene}`);
    }
    if (clock >= stopAt) break;
    last = now;
    await page.waitForTimeout(250);
  }
  // The crossing card, clicked while the town waits for the men to come back is not open; the street card at the return.
  const log = await page.evaluate(() => window.__townLog);
  evidence.beats = log.beats; evidence.said = log.said;
  want.readingSeen = Boolean(log.beats['crossing-reading']);
  evidence.cards.street = await openCard(page, 'street');
  assert.ok(evidence.cards.street.opened && /come back/i.test(evidence.cards.street.title), `the street's card at the return did not open, or is not the return's: ${JSON.stringify(evidence.cards.street)}`);

  // ------------------------------------------------------------------------------------------------ what the page did
  const beatsSeen = Object.keys(evidence.beats);
  for (const beat of ['street-alarm', 'crossing-hold', 'camp-mound', 'flag-cloth', 'flag-painted', 'shop-mount', 'muster-day', 'crossing-over', 'street-return']) {
    assert.ok(beatsSeen.includes(beat), `the page was never sent the town's "${beat}" (saw ${beatsSeen.join(', ')})`);
  }
  ok(`the student in Gonzales was sent the town's days as they came: ${beatsSeen.length} beats, from the alarm to the return`);

  const busy = evidence.samples.filter(one => one.people >= 4);
  assert.ok(busy.length >= 20, `only ${busy.length} samples had four or more of the town's people drawn`);
  const allIdle = busy.filter(one => one.idle === one.people);
  assert.deepEqual(allIdle.map(one => one.clock), [], 'at these moments every one of the town\'s people drawn was standing idle');
  const varied = busy.filter(one => one.poses.length >= 2);
  assert.ok(varied.length >= busy.length * .9, `only ${varied.length} of ${busy.length} samples had people doing two or more different things`);
  ok(`at ${busy.length} sampled moments the town's people were doing different things, never all idle (${[...new Set(busy.flatMap(one => one.poses))].join(', ')})`);

  const flagSamples = evidence.samples.filter(one => one.beats.includes('flag-cloth'));
  assert.ok(flagSamples.length >= 3 && flagSamples.every(one => clockOf(0) <= one.clock), `the flag-making scene was drawn at ${flagSamples.length} samples`);
  assert.ok(flagSamples.every(one => one.clock >= on(1, 14) && one.clock < on(2, 12)), 'the flag was being made outside its days');
  ok(`the women were making the flag on September 30 and October 1 (${flagSamples.length} samples)`);

  const reconstructed = Object.entries(evidence.said).filter(([key]) => key.startsWith('reconstructed:')).reduce((sum, [, n]) => sum + n, 0);
  const documented = Object.entries(evidence.said).filter(([key]) => key.startsWith('documented:'));
  assert.ok(reconstructed >= 30, `only ${reconstructed} reconstructed lines were drawn over anybody`);
  assert.ok(Object.keys(evidence.said).some(key => key.includes(':town-')), 'no resident of the town was drawn saying anything');
  assert.ok(want.readingSeen, 'the page never saw the refusal read across the river');
  assert.deepEqual(documented.map(([key]) => key.split(':')[1]), ['gz-clements'], `the lines drawn as on record were not exactly Clements's: ${JSON.stringify(documented)}`);
  ok(`speech was drawn over the speakers: ${reconstructed} reconstructed lines, and the one line on record, Clements's refusal, drawn as documented`);

  const walkClips = Object.keys(evidence.walking).filter(key => /walk|march|ride|courier/.test(key));
  assert.ok(walkClips.length >= 2, `nobody in the scenes was drawn walking: ${JSON.stringify(evidence.walking)}`);
  assert.ok(Object.keys(evidence.walking).some(key => key.startsWith('resident:')), `no resident of the town was drawn walking between two places: ${JSON.stringify(evidence.walking)}`);
  const fastest = evidence.residentSpeeds.reduce((max, one) => Math.max(max, one.heightsASecond), 0);
  assert.ok(fastest > 0, 'no resident was ever drawn moving, so their pace was never measured');
  assert.ok(fastest <= 1.6, `a resident was drawn crossing the town at ${fastest} of their heights a second: sliding, not walking`);
  ok(`people who changed place walked there (${walkClips.join(', ')}); residents walked, at most ${fastest} heights a second`);

  assert.ok(evidence.cards.flag?.opened && evidence.cards.flag1024?.opened, 'clicking the flag did not open its card');
  assert.equal(evidence.cards.flag.title, 'The flag');
  assert.match(evidence.cards.flag.text, /Sarah Seely DeWitt/, 'the flag card does not say who the traditions name');
  assert.match(evidence.cards.flag.text, /apocryphal/i, 'the flag card does not say the wedding dress is a story told later');
  assert.ok(evidence.cards.flag.labels.includes('DISPUTED') && evidence.cards.flag.labels.includes('TRADITION'), `the flag card does not label what is disputed and what is tradition: ${evidence.cards.flag.labels}`);
  assert.match(evidence.cards.flag.teller, /tells you/, 'the flag card is not told by anybody');
  for (const at of ['flag', 'flag1024']) {
    const card = evidence.cards[at];
    assert.ok(card.box.x >= 0 && card.box.y >= 0 && card.box.x + card.box.w <= card.viewport.width && card.box.y + card.box.h <= card.viewport.height, `${at}: the card hangs off the screen: ${JSON.stringify(card.box)}`);
    assert.ok(!card.overFamily, `${at}: the card is drawn over the family's column: ${JSON.stringify(card)}`);
  }
  ok(`clicking the flag opened its card, told by a person, labelled disputed and tradition, on the screen at 1366 and 1024 and clear of the family (${evidence.cards.flag.box.w}x${evidence.cards.flag.box.h})`);

  assert.ok(evidence.help?.drawn?.pose, `the family's person lent a hand and was not drawn at the work: ${JSON.stringify(evidence.help)}`);
  assert.deepEqual(refused, [], 'the server refused an order the page sent');
  ok(`${principal.name} lent a hand with the ${evidence.help.scene} from its card, and was drawn at it (${evidence.help.drawn.pose})`);

  // ---------------------------------------------------------------------------------- a family on its land sees none of it
  const awayState = await (await fetch(`${url}/api/state`, { headers: { Cookie: awayCookie } })).json();
  const awayText = JSON.stringify(awayState);
  assert.ok(!('townScenes' in awayState.world), 'a family out on its land was sent the town\'s scenes');
  for (const words of ['Come and take it', 'Clements', 'breastwork', 'gz-townswoman']) assert.ok(!awayText.includes(words), `a family on its land was sent "${words}"`);
  evidence.away = { householdId: awayState.world.householdId, townScenes: 'townScenes' in awayState.world, bytes: awayText.length };
  ok(`a family out on its land (${awayState.world.householdId}) was sent nothing of the town's scenes`);

  // ------------------------------------------------------------------------------------------------ the Host sees it all
  const hostPage = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  hostPage.on('pageerror', error => errors.push(`host: ${error.message}`));
  await hostPage.goto(`${url}/host#${app.state.hostKey}`);
  await hostPage.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await hostPage.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  await hostPage.locator('#map-nav [data-view=gonzales]').click();
  await hostPage.waitForFunction(() => (window.__townCast || []).length > 0, null, { timeout: 15000 }).catch(() => {});
  evidence.host = await hostPage.evaluate(() => ({ beats: (window.__snapshot.world.townScenes?.scenes || []).map(scene => scene.beat), cast: (window.__townCast || []).length }));
  assert.ok(evidence.host.beats.length && evidence.host.cast > 0, `the Host's page drew none of the town: ${JSON.stringify(evidence.host)}`);
  await shot(hostPage, 'host');
  ok(`the Host's page drew the town's scenes too (${evidence.host.beats.join(', ')}; ${evidence.host.cast} people)`);

  assert.deepEqual(errors, [], 'the pages threw');
  ok('no page error on either page');

  writeFileSync('docs/evidence/gonzales-town-browser.json', `${JSON.stringify({
    record: 'gonzales-town-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(), tickMs: TICK_MS,
    task: 'docs/BATTLES.md §5 step 2: Gonzales before the fight, September 29 - October 2, 1835, watched by a student whose family has a person in the town, with a family on its land and the Host beside it.',
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not a physical LAN, a Chromebook or a classroom.',
    checks: pass, beats: evidence.beats, said: evidence.said, walking: evidence.walking,
    fastestResident: fastest, samples: evidence.samples.length, cards: evidence.cards, help: evidence.help, away: evidence.away, host: evidence.host, screenshots: shots,
    notProved: [
      'One seed, one family, one person in the town. A family that arrives in the middle of a scene, or leaves in the middle of one, is held by tests/town-scenes.test.mjs, not walked here.',
      'The words are sampled a quarter-second apart at a pace faster than Study; whether a class at Study pace has time to read each line is judged from the slot the page gives a line (2.2 to 4.6 seconds), not measured with readers.',
      'No physical LAN, no Chromebook, no touch screen, no screen reader.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks pass; wrote docs/evidence/gonzales-town-browser.json`);
} finally {
  await browser.close();
  await app.close();
}

/** A closer picture of one scene: the wheel turned over it, as a student zooms, and the town framed again after. */
async function closeShot(page, name, sceneId) {
  const spot = await page.evaluate(id => {
    const at = window.__townSceneSpots?.[id], canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    return at && { x: rect.left + at.x * rect.width / canvas.width, y: rect.top + at.y * rect.height / canvas.height };
  }, sceneId);
  if (!spot) return;
  await page.mouse.move(spot.x, spot.y);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
  await page.waitForTimeout(900);
  await shot(page, name);
  await page.locator('#map-nav [data-view=gonzales]').click();
  await page.waitForTimeout(300);
}
/** Click a scene where the page drew it, and read the card it opens. */
async function openCard(page, sceneId) {
  await page.waitForFunction(id => window.__townSceneSpots?.[id], sceneId, { timeout: 15000 });
  // Where a student would click: on one of the scene's people as drawn, or on the scene's middle - whichever is not under
  // somebody of the world (a click on a resident or on the family's own person selects that person, as it always has).
  const points = await page.evaluate(id => {
    const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    const toPage = (x, y) => ({ x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height });
    const people = (window.__townCast || []).filter(one => one.sceneId === id && Number.isFinite(one.sx)).map(one => toPage(one.sx, one.sy));
    const spot = window.__townSceneSpots[id];
    return [...people, toPage(spot.x, spot.y - (window.__camera.figure || 18) * .4)]
      .filter(p => p.x > 0 && p.y > 0 && p.x < innerWidth && p.y < innerHeight);
  }, sceneId);
  let opened = false;
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    try { await page.waitForFunction(id => !document.querySelector('#town-scene').hidden && document.querySelector('#town-scene').dataset.scene === id, sceneId, { timeout: 1500 }); opened = true; break; } catch { /* the next */ }
  }
  if (!opened) return { opened: false, scene: sceneId, tried: points.length };
  return page.evaluate(() => {
    const root = document.querySelector('#town-scene'), box = root.getBoundingClientRect();
    const family = document.querySelector('#family-panel'), fbox = family && !family.hidden ? family.getBoundingClientRect() : null;
    const overFamily = Boolean(fbox && fbox.width > 0 && box.left < fbox.right && box.right > fbox.left && box.top < fbox.bottom && box.bottom > fbox.top);
    return {
      opened: true, scene: root.dataset.scene, title: root.querySelector('h2')?.textContent || '', teller: root.querySelector('.town-scene-teller')?.textContent || '',
      text: root.innerText, labels: [...root.querySelectorAll('.town-scene-label')].map(label => label.textContent),
      box: { x: Math.round(box.left), y: Math.round(box.top), w: Math.round(box.width), h: Math.round(box.height) },
      viewport: { width: innerWidth, height: innerHeight }, overFamily,
    };
  });
}
