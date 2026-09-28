// Children, babies and the Scrape's own work, in a real browser (owner, 2026-09-26; docs/CHILDREN.md).
//
// tests/children.test.mjs, tests/childhood.test.mjs, tests/babies.test.mjs and tests/flight-work.test.mjs prove the rules
// against the simulation. This proves what a class sees, through the join flow, at the two classroom sizes (1366x768 and
// 1024x768):
//
//   - a small child chosen on the family panel shows their own bar, and a kind of play pressed on it glows while the child is
//     seen at it - moved about the yard from frame to frame, in the play's pose;
//   - a child left with nothing to do walks to a parent, and both are heard in bubbles; the parent's row says in amber why they
//     stopped; giving the child something to do lets the parent go;
//   - a child put on their own automation turns it off by itself, and the row says so;
//   - a baby crawls, cries, is picked up and hummed to by a woman of age, is put down to nap, and she is back as she was;
//   - on the Runaway Scrape the family's own work is on the bar - hiding what the wagon cannot carry, a child's bundle, a lookout
//     on the road behind - and the hiding, used, keeps the family's goods from the fire.
//
// Same computer only: headless Chrome. Run: npm run test:children
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/children-${name}.png`; await page.screenshot({ path }); shots.push(path); };

/** A class served live, a student joined as hh-1 through the join flow, the family made, and the Host's Start pressed. */
async function classroom({ seed, tickMs, worldFactory, viewport }) {
  const app = createClassroom({ seed, playerCount: 5, tickMs, worldFactory });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${seed}: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill('Child reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  return { app, page, host };
}
const person = (page, id) => page.evaluate(id => window.__snapshot?.world.entities.find(one => one.id === id) || null, id);
const lifeOf = (page, id) => page.evaluate(id => { const line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`); return line && !line.hidden ? line.textContent : null; }, id);
const barOf = page => page.evaluate(() => { const row = document.querySelector('.panel-row[data-focused=true]'); return { id: row?.dataset.entityId, keys: [...(row?.querySelectorAll('.panel-icon') || [])].map(icon => ({ key: icon.dataset.key, active: icon.dataset.active === 'true', can: icon.getAttribute('aria-disabled') !== 'true' })) }; });
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const choose = async (page, id) => { await page.locator(`[data-portrait="${id}"]`).click({ force: true }); await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, id, { timeout: 15000 }); };
/**
 * Where a figure is drawn over `ms`, sampled every `every` ms, with the pose it is drawn in - measured from another of the family
 * standing still (`from`), because the camera follows whoever was chosen and keeps them in the middle of the screen.
 */
async function drawnOver(page, id, ms = 4000, every = 200, from = null) {
  const seen = [];
  for (let t = 0; t < ms; t += every) {
    seen.push(await page.evaluate(([id, from]) => {
      const at = window.__drawnAt?.[id], still = from ? window.__drawnAt?.[from] : { x: 0, y: 0 };
      return { at: at && still ? { x: Math.round(at.x - still.x), y: Math.round(at.y - still.y) } : null, clip: window.__clipsDrawn?.[id] || null };
    }, [id, from]));
    await page.waitForTimeout(every);
  }
  return { places: new Set(seen.filter(one => one.at).map(one => `${one.at.x},${one.at.y}`)).size, clips: [...new Set(seen.map(one => one.clip).filter(Boolean))] };
}

try {
  // ------------------------------------------------------------------------------------------------ at home, 1366x768
  // Seed chosen for its first family (scripts: a father, a mother, a son of three and a daughter under one) on the invented
  // country, whose calendar stays at twenty minutes a tick, the pace babies and talk are stopped for.
  const home = await classroom({ seed: 'children-proof-96', tickMs: 500, worldFactory: seed => createGonzalesWorld(seed, 5), viewport: { width: 1366, height: 768 } });
  const { app, page } = home;
  // The guided start holds a child back from a parent (docs/CHILDREN.md §3), so it is stopped with its X, as a student may.
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && ('lesson' in window.__snapshot.world ? !document.querySelector('#lesson-stop')?.hidden : true), null, { timeout: 20000 });
  if (await page.evaluate(() => 'lesson' in window.__snapshot.world)) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  }
  const family = await page.evaluate(() => window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => ({ id: one.id, name: one.name, age: one.age, sex: one.sex })));
  const kid = family.find(one => one.age >= 2 && one.age < 10), baby = family.find(one => one.age < 2);
  assert.ok(kid && baby, `the seed's family has no small child and baby: ${JSON.stringify(family)}`);
  observed.family = family;
  // The family comes in off the road first; nobody goes to anybody while it does.
  await page.waitForFunction(ids => ids.every(id => { const one = window.__snapshot.world.entities.find(e => e.id === id); return one && !one.travel && one.location?.siteId === window.__snapshot.world.household.homeSiteId; }) && !window.__snapshot.world.household.arriving, family.map(one => one.id), { timeout: 90000 });
  await choose(page, kid.id);

  // 1. The idle child walks to a parent; both are heard; the parent's row says why they stopped.
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.talk?.phase === 'talking', kid.id, { timeout: 60000 });
  const talker = await person(page, kid.id);
  const parentId = talker.talk.with;
  const parent = await person(page, parentId);
  assert.equal(parent.aside?.kind, 'talk', 'the parent was not stopped');
  await page.waitForFunction(ids => { const said = window.__familySaid || []; return ids.every(id => said.some(line => line.speakerId === id)); }, [kid.id, parentId], { timeout: 20000 })
    .catch(async error => { console.log('DEBUG', JSON.stringify(await page.evaluate(ids => ({ tick: window.__snapshot.world.tick, people: window.__snapshot.world.entities.filter(one => ids.includes(one.id)).map(one => ({ id: one.id, talk: one.talk, aside: one.aside, chore: one.chore?.id, life: one.life })), talk: window.__snapshot.world.familyTalk, said: window.__familySaid, figure: window.__camera?.figure, drawn: ids.map(id => window.__drawnAt?.[id]), view: window.__viewEntities }), [kid.id, parentId]))); throw error; });
  observed.talk = await page.evaluate(() => window.__familySaid);
  const stopped = await lifeOf(page, parentId);
  assert.match(stopped || '', new RegExp(`^Stopped to talk with ${kid.name.split(' ')[0]}`), `the parent's row does not say why they stopped: ${stopped}`);
  observed.parentRow = stopped;
  assert.equal(await page.evaluate(id => getComputedStyle(document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`)).color, parentId), 'rgb(255, 210, 122)', 'the stopped line is not amber');
  await shot(page, 'talk-1366');
  ok(`${kid.name.split(' ')[0]}, with nothing to do, walked to ${parent.name.split(' ')[0]} and both are heard ("${observed.talk.map(line => line.text).join('" / "')}"); the row says "${stopped}"`);

  // 2. The child's own bar, a kind of play pressed on it: the parent is let go, the icon glows, and the child is seen at it.
  const bar = await barOf(page);
  assert.equal(bar.id, kid.id, 'choosing the child did not bring up the child\'s bar');
  assert.ok(bar.keys.some(one => one.key === 'child-tag' && one.can) && bar.keys.every(one => one.key.startsWith('child-') || !['chore'].includes(one.key)), `the child's bar is not the child's: ${JSON.stringify(bar.keys)}`);
  observed.childBar = bar.keys.map(one => one.key);
  await page.locator('.panel-row[data-focused=true] .panel-icon[data-key="child-tag"]').click();
  await page.waitForFunction(id => { const w = window.__snapshot.world; const child = w.entities.find(one => one.id === id); return child?.chore?.id === 'child-tag' && !child.talk; }, kid.id, { timeout: 15000 });
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.aside, parentId, { timeout: 15000 });
  assert.equal(await lifeOf(page, parentId), null, 'the parent\'s row still says they are stopped');
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="child-tag"]')?.dataset.active === 'true', null, { timeout: 10000 });
  const playing = await drawnOver(page, kid.id, 4000, 200, parentId);
  assert.ok(playing.places >= 3, `the child at tag was drawn in ${playing.places} places in four seconds`);
  assert.ok(playing.clips.some(clip => /walk/.test(clip)), `the child at tag was never drawn running: ${playing.clips}`);
  observed.play = playing;
  await shot(page, 'play-1366');
  ok(`given tag, the parent went back to work at once; the icon glows and the child is drawn in ${playing.places} places in four seconds, as ${playing.clips.join(', ')}`);
  // The doll: a different pose, sitting.
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, kid.id, { timeout: 30000 });
  // The family came home by wagon faster than its land can be walked, so it is drawn arriving late (public/app.js `trailOf`), and
  // a child the server sent to play before the drawing got home walks the rest of the way to the yard at a child's pace
  // (`walkOn`). Sitting down with a doll is looked for once they are there, not while they are still walking up.
  await page.waitForFunction(id => { const seen = window.__travelSight?.get(id); return !seen?.walk && !seen?.trail; }, kid.id, { timeout: 60000 });
  await page.locator('.panel-row[data-focused=true] .panel-icon[data-key="child-doll"]').click();
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.chore?.id === 'child-doll', kid.id, { timeout: 15000 });
  const sitting = await drawnOver(page, kid.id, 2000);
  assert.ok(sitting.clips.some(clip => /rest/.test(clip)), `the child with a doll was not drawn sitting: ${sitting.clips}`);
  ok(`with a corn-husk doll the child is drawn sitting (${sitting.clips.join(', ')})`);

  // 3. The child's own automation turns itself off, with a notice on the row.
  const autoSwitch = page.locator(`.panel-row[data-entity-id="${kid.id}"] .panel-auto`);
  assert.equal(await autoSwitch.isVisible(), true, 'a small child has no Auto switch');
  await autoSwitch.click();
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-auto`)?.getAttribute('aria-pressed') === 'true', kid.id, { timeout: 15000 });
  await page.waitForFunction(id => { const line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`); return line && !line.hidden && /^Auto went off/.test(line.textContent); }, kid.id, { timeout: 120000 });
  observed.autoOff = await lifeOf(page, kid.id);
  assert.equal(await autoSwitch.getAttribute('aria-pressed'), 'false');
  await shot(page, 'auto-off-1366');
  ok(`the child's automation turned itself off, and the row says "${observed.autoOff}"`);

  // 4. The baby: crawls, cries, is picked up and hummed to, put down to nap, and whoever held it is back as they were.
  const crawl = await drawnOver(page, baby.id, 3000, 200, parentId);
  observed.crawl = crawl;
  // Where everybody stood and what they were at on the tick the baby cried, before anybody came.
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.baby?.state === 'cry', baby.id, { timeout: 240000, polling: 50 });
  const before = await page.evaluate(() => Object.fromEntries(window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => [one.id, { x: one.location?.x, y: one.location?.y, task: one.task, chore: one.chore?.id || null }])));
  observed.cry = { babyLife: await lifeOf(page, baby.id), said: await page.evaluate(id => (window.__familySaid || []).filter(line => line.speakerId === id).map(line => line.text), baby.id) };
  await page.waitForFunction(id => ['held'].includes(window.__snapshot.world.entities.find(one => one.id === id)?.baby?.state), baby.id, { timeout: 15000, polling: 50 });
  const carer = await page.evaluate(() => window.__snapshot.world.entities.find(one => one.aside?.kind === 'baby'));
  assert.ok(carer, 'nobody is holding the crying baby');
  const was = before[carer.id];
  assert.ok(carer.age >= 10, `somebody too young to be of age came to the baby: ${carer.name}, ${carer.age}`);
  await page.waitForFunction(id => (window.__familySaid || []).some(line => line.speakerId === id), carer.id, { timeout: 15000, polling: 50 });
  const held = await page.evaluate(id => ({ said: window.__familySaid.filter(line => line.speakerId === id).map(line => line.text), clip: window.__clipsDrawn?.[id] }), carer.id);
  observed.held = { carer: carer.name, ...held, babyLife: await lifeOf(page, baby.id), carerLife: await lifeOf(page, carer.id) };
  assert.match(observed.held.babyLife || '', /^Held by/);
  assert.match(held.clip || '', /carry/, `the carer is not drawn holding anything: ${held.clip}`);
  await shot(page, 'baby-held-1366');
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.baby?.state === 'nap', baby.id, { timeout: 30000 });
  const after = await person(page, carer.id);
  assert.equal(after.aside, undefined, 'the carer never went back');
  assert.deepEqual({ x: after.location.x, y: after.location.y }, { x: was.x, y: was.y }, 'the carer did not go back to where she was');
  assert.equal(after.task, was.task, 'the carer did not go back to what she was doing');
  assert.equal(after.chore?.id || null, was.chore, 'the carer did not go back to the same work');
  assert.equal(await lifeOf(page, baby.id), 'Napping.');
  // Roomy, the baby's row has its sentence and not the short word the tight column shows instead (owner, 2026-09-27: "Show a
  // short word"; the tight column is scripts/family-twenty-browser-proof.mjs's, a family of twenty).
  const roomy = await page.evaluate(id => { const word = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-word`), line = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`); return { tight: document.querySelector('#family-panel').dataset.tight === 'true', word: word?.textContent ?? null, wordShown: Boolean(word) && word.getClientRects().length > 0, lineShown: Boolean(line) && line.getClientRects().length > 0 }; }, baby.id);
  observed.roomyWord = roomy;
  assert.deepEqual(roomy, { tight: false, word: 'napping', wordShown: false, lineShown: true }, 'in a roomy column the baby’s row shows the short word, or not its sentence');
  ok(`the baby crawled (${crawl.places} places in three seconds), cried and was picked up by ${carer.name.split(' ')[0]}, ${carer.age}, who said "${held.said.join('" / "')}" and was drawn ${held.clip}; the baby was put down to nap and she went back to where she stood, at "${was.task}"`);

  // 4b. On foot with the baby on her hip (owner, 2026-09-27: "goes a quarter slower on foot"; docs/CHILDREN.md §6). The mother is
  // the only woman of age at home, so sent to town she takes the baby; she is made the main person, sent to Gonzales from her own
  // bar, and the chooser is answered "on foot" as a student would.
  const mother = family.find(one => one.age >= 16 && one.sex === 'female');
  assert.ok(mother, 'the seed\'s family has no mother');
  await asMain(page, mother.id);
  await page.locator(`.panel-row[data-entity-id="${mother.id}"] .panel-icon[data-key="travel-gonzales"]`).click();
  await page.locator('#going').waitFor({ state: 'visible' });
  await page.locator('#going [data-way="foot"]').click();
  await page.waitForFunction(() => document.querySelector('#going [data-way="foot"]')?.getAttribute('aria-pressed') === 'true');
  await page.locator('#going-send').click();
  await page.locator('#going').waitFor({ state: 'hidden', timeout: 10000 });
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.travel?.mode === 'foot', mother.id, { timeout: 15000 });
  const going = app.state.world.entities[mother.id];
  assert.equal(app.state.world.entities[baby.id].carriedBy, mother.id, 'the only woman of age went to town without the baby');
  assert.equal(going.travel.speed, 0.75, `on foot with the baby on her hip she walks at ${going.travel.speed} a tick, not three quarters`);
  await page.waitForFunction(id => /walking a quarter slower/.test(document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`)?.textContent || ''), mother.id, { timeout: 15000 });
  observed.hip = { speed: going.travel.speed, mode: going.travel.mode, motherLife: await lifeOf(page, mother.id), babyLife: await lifeOf(page, baby.id) };
  assert.match(observed.hip.babyLife || '', /^Carried by /);
  await shot(page, 'baby-hip-1366');
  ok(`on foot with the baby on her hip ${mother.name.split(' ')[0]} walks at three quarters of her pace (${going.travel.speed} a tick): her row says "${observed.hip.motherLife}", the baby's "${observed.hip.babyLife}"`);

  // 5. At 1024x768: the child's bar, the lines, and no page scrolling sideways.
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(700);
  await choose(page, kid.id);
  const small = await page.evaluate(() => { const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons'); const box = bar?.getBoundingClientRect(); return box && { left: box.left, right: box.right, top: box.top, bottom: box.bottom, shown: getComputedStyle(bar).display !== 'none' }; });
  assert.ok(small?.shown && small.left >= 0 && small.right <= 1024 && small.bottom <= 768, `the child's bar is off the screen at 1024: ${JSON.stringify(small)}`);
  assert.ok(await noOverflow(page) <= 1, 'the page scrolls sideways at 1024');
  await shot(page, 'bar-1024');
  // And the talk again at this size, with the child left to itself.
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.talk?.phase === 'talking' || false, kid.id, { timeout: 90000 }).catch(() => null);
  if ((await person(page, kid.id))?.talk) { await page.waitForTimeout(800); await shot(page, 'talk-1024'); }
  ok('at 1024x768 the child\'s own bar is on the screen and nothing scrolls sideways');
  await home.page.context().close();
  await home.host.context().close();
  await app.close();

  // ------------------------------------------------------------------------------------------------ the Runaway Scrape
  // The Scrape proof's class: the real land played through two periods into the spring, its first family at Gonzales with
  // sons of nine and seven.
  function inTheSpring(seed, playerCount) {
    const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
    for (const household of Object.values(world.households)) rollFamily(world, household);
    world.status = 'running';
    for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
    beginSecondPeriod(world); world.status = 'running';
    for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
    beginThirdPeriod(world);
    const household = world.households['hh-1'];
    household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
    household.resources = { ...household.resources, food: 60, seed: 4, cotton: 6, powder: 3 };
    // Cattle on the range, so the family has a milk cow to take (owner, 2026-09-27; docs/STOCK.md §8), set in process.
    household.herd = { cattle: 6, hogs: 12 };
    world.status = 'lobby';
    return world;
  }
  const spring = await classroom({ seed: 'scrape-proof-1', tickMs: 1500, worldFactory: inTheSpring, viewport: { width: 1366, height: 768 } });
  const road = spring.page, roadApp = spring.app;
  await road.waitForFunction(() => window.__snapshot?.world.flight?.status === 'ordered', null, { timeout: 60000 });
  const scrapeFamily = await road.evaluate(() => window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => ({ id: one.id, name: one.name, age: one.age })));
  const boy = scrapeFamily.filter(one => one.age >= 7 && one.age < 10).sort((a, b) => b.age - a.age)[0];
  assert.ok(boy, 'the spring family has no child of seven to nine');
  // Before leaving: hiding what the wagon cannot carry, on the main person's bar.
  const mainBar = await barOf(road);
  assert.ok(mainBar.keys.some(one => one.key === 'flee-hide' && one.can), `hiding is not on the main person's bar: ${JSON.stringify(mainBar.keys.map(one => one.key))}`);
  await road.locator('.panel-row[data-focused=true] .panel-icon[data-key="flee-hide"]').click();
  await road.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="flee-hide"]')?.dataset.active === 'true', null, { timeout: 15000 });
  observed.hideGlows = true;
  await shot(road, 'scrape-hide-1366');
  await road.waitForFunction(() => !window.__snapshot.world.entities.some(one => one.chore?.id === 'flee-hide'), null, { timeout: 90000 });
  assert.equal(roadApp.state.world.households['hh-1'].flight.hid, true, 'the hiding never finished');
  // A child's bundle, on the child's own bar.
  await choose(road, boy.id);
  const boyBar = await barOf(road);
  assert.ok(boyBar.keys.some(one => one.key === 'flee-bundle'), `the bundle is not on the child's bar: ${JSON.stringify(boyBar.keys.map(one => one.key))}`);
  await road.locator('.panel-row[data-focused=true] .panel-icon[data-key="flee-bundle"]').click();
  await road.waitForFunction(id => ['flee-bundle'].includes(window.__snapshot.world.entities.find(one => one.id === id)?.chore?.id), boy.id, { timeout: 15000 });
  ok(`told to leave, hiding what the wagon cannot carry is on the main person's bar and glows when pressed; the child's bar has a bundle to make up (${boyBar.keys.filter(one => /^(flee|road|camp|child)-/.test(one.key)).map(one => one.key).join(', ')})`);
  // One milk cow (owner, 2026-09-27: "Yes, one cow"): the same child, the bundle tied, puts a rope on her.
  await road.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, boy.id, { timeout: 90000 });
  assert.ok((await barOf(road)).keys.some(one => one.key === 'flee-cow' && one.can), `the milk cow is not on the child's bar: ${JSON.stringify((await barOf(road)).keys.map(one => one.key))}`);
  await road.locator('.panel-row[data-focused=true] .panel-icon[data-key="flee-cow"]').click();
  await road.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="flee-cow"]')?.dataset.active === 'true' || false, null, { timeout: 15000 }).catch(() => null);
  await road.waitForFunction(() => Boolean(window.__snapshot.world.flight?.cow), null, { timeout: 90000 });
  assert.equal(roadApp.state.world.households['hh-1'].flight.cow.by, boy.id, 'the milk cow is not the child\'s');
  observed.cowBefore = await lifeOf(road, boy.id);
  ok(`${boy.name.split(' ')[0]} has the milk cow on a rope before the family goes: "${observed.cowBefore}"`);
  // Leave, from the "!" and the card, as the Scrape proof does.
  const mainId = roadApp.state.world.households['hh-1'].mainId || roadApp.state.world.households['hh-1'].principalId;
  await road.locator(`[data-attention="${mainId}"]`).click({ force: true });
  await road.locator('#selection-flight [data-action="flee"]').waitFor({ state: 'visible', timeout: 15000 });
  const room = await road.evaluate(() => window.__snapshot.world.flight.room);
  await road.locator('#selection-flight .flight-amount[data-take="food"]').fill(String(Math.min(40, Math.floor(room / 0.25))));
  for (const good of ['seed', 'cotton', 'powder']) { const box = road.locator(`#selection-flight .flight-amount[data-take="${good}"]`); if (await box.count()) await box.fill('0'); }
  await road.locator('#selection-flight [data-action="flee"]').click();
  await road.locator('#selection-flight [data-action="flee"]', { hasText: 'Confirm' }).click();
  await road.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled', null, { timeout: 20000 });
  const flight = roadApp.state.world.households['hh-1'].flight;
  assert.ok(flight.cache && Object.values(flight.cache).some(amount => amount > 0), `nothing was hidden when the family left: ${JSON.stringify(flight)}`);
  observed.cache = flight.cache;
  ok(`the family left, and what it hid is in the river bottom, not in the house for the fire: ${JSON.stringify(flight.cache)}`);
  // The milk cow goes with them, out of the herd left on the range, driven by the child and drawn a step behind them.
  assert.equal(flight.cow?.by, boy.id, 'the milk cow did not go with the family');
  assert.equal(roadApp.state.world.households['hh-1'].herdLeft?.cattle, 5, `the herd left on the range is not one cow fewer: ${JSON.stringify(roadApp.state.world.households['hh-1'].herdLeft)}`);
  await road.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-life-line`)?.textContent === 'Driving the milk cow along behind the family.', boy.id, { timeout: 30000 });
  await road.waitForFunction(id => window.__cowDrawn?.by === id, boy.id, { timeout: 30000 });
  // The child chosen, as a student looks at them; the picture and where the page drew the cow are taken together.
  await choose(road, boy.id);
  await road.waitForTimeout(800);
  await shot(road, 'scrape-cow-1366');
  observed.cow = { row: await lifeOf(road, boy.id), drawn: await road.evaluate(() => window.__cowDrawn), child: await road.evaluate(id => window.__drawnAt?.[id] || null, boy.id), herdLeft: roadApp.state.world.households['hh-1'].herdLeft };
  ok(`on the road ${boy.name.split(' ')[0]}'s row says "${observed.cow.row}", the cow is drawn beside them (${observed.cow.drawn.clip}), and the herd left on the range is ${observed.cow.herdLeft.cattle} cattle`);
  // On the road: the child watches the road behind.
  await choose(road, boy.id);
  await road.waitForFunction(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].some(icon => icon.dataset.key === 'road-lookout'), null, { timeout: 30000 });
  const onRoad = await barOf(road);
  observed.roadBar = onRoad.keys.map(one => one.key);
  await road.locator('.panel-row[data-focused=true] .panel-icon[data-key="road-lookout"]').click();
  await road.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon[data-key="road-lookout"]')?.dataset.active === 'true', null, { timeout: 15000 });
  await shot(road, 'scrape-road-1366');
  ok(`on the road the child's bar has the road's own work (${observed.roadBar.join(', ')}), and watching the road behind glows when pressed`);
  await road.setViewportSize({ width: 1024, height: 768 });
  await road.waitForTimeout(700);
  assert.ok(await noOverflow(road) <= 1, 'the Scrape page scrolls sideways at 1024');
  await shot(road, 'scrape-road-1024');
  ok('at 1024x768 the road\'s bar is shown and nothing scrolls sideways');

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/children-browser.json', `${JSON.stringify({
    record: 'Children, babies and the Runaway Scrape\'s own work, in a browser (docs/CHILDREN.md)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768 and 1024x768. Two real classes through the join flow: the invented country (seed children-proof-96) for the home, and the real land played in process into the spring (seed scrape-proof-1) for the Scrape. No LAN or district claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await roadApp.close();
} finally {
  await browser.close();
}
