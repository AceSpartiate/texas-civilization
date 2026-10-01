// The family's own way east and Mexican troops on it, in the browser (owner, 2026-09-27; docs/SCRAPE.md §11-§14).
//
// tests/scrape-pursuit.test.mjs proves the rules. This proves what a student and a teacher see, at 1366x768 and at 1024x768:
// camped at Harrisburg, the student opens "Change where we go", adds a stop from the list and another by tapping the map, sets
// the second stretch across country, and sets out; the thin path is drawn on the student's own map, and on nobody else's (a
// second student's page, the Host's); the family is across country and the card says so; the student changes the way on the
// road and the family turns where it stands. Then Santa Anna's dragoons, out ahead of his column on the morning of April 15,
// see the family on the road from Stafford's: the "!" opens the card at "¡Alto!" with the English under it, drawn over the
// lead horseman. At 1366 the student runs, and the shots are seen - flashes and smoke - and the chase ends, taken or away; at
// 1024 the student halts, and the family is taken without a shot. Nothing on either page scrolls sideways.
//
// Same computer only: headless Chrome. Run: npm run test:scrape-pursuit
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { on } from '../sim/advance.mjs';
import { spring, atTimeline, SPRING_SEED } from '../tests/support/scrape-spring.mjs';
import { sceneFor, stowAway } from '../tests/support/scrape-scene.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { dateOf } from '../sim/clock.mjs';
import { sightMiles, watchersNow } from '../sim/pursuit.mjs';
import { familyPoint } from '../sim/road.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];

/** The spring class at noon on April 12, the first family camped at Harrisburg on foot, before any column is near. */
// The class's own world, as the server holds it: `app.state` is a copy, and the dragoons' scene is put into the world itself,
// between two of its ticks, as the tests put it (the server mutates this object in place on every tick and order).
let live = null;
function atHarrisburg() {
  const world = live = spring();
  atTimeline(world, on(1836, 4, 12, 12));
  stowAway(world, world.households['hh-1'], 'harrisburg');
  const household = world.households['hh-1'];
  household.resources = { ...household.resources, food: 40 };
  for (const id of household.members) { const one = world.entities[id]; if (one.kind === 'person' && !['dead'].includes(one.health.condition)) one.health = { condition: 'well' }; }
  household.mainId = household.members.find(id => world.entities[id].principal);
  // The house site chosen where the family's mark stands, as the family would have in the first period (as scripts/road-browser-
  // proof.mjs does): played in process with nobody choosing, the chooser's card would stand over the flight card all spring.
  if (household.choosingSite) { const mark = world.map.sites[household.homeSiteId]; chooseSite(world, household, { x: mark.x, y: mark.y }); }
  // On foot for the choosing of the way, its wagon and oxen at home: a wagon on the road on a wet April day bogs, and the mud is
  // not what this proves (tests/road.test.mjs is). The dragoons meet it with its wagon (`sceneFor` below).
  const home = world.map.sites[household.homeSiteId];
  for (const id of household.property || []) { const beast = world.entities[id]; if (beast) beast.location = { x: home.x, y: home.y, siteId: home.id }; }
  household.flight.mode = 'foot';
  // Nobody's until the student joins: since the classroom blockers (e549ec1) a family already `played` is not given to a student
  // joining, and `stowAway` marks it played. Joining marks it again.
  delete household.played;
  world.status = 'lobby';
  return world;
}

/**
 * Taps a place on the map as a student would: the map zoomed out until the country round it is in view, and dragged so the place
 * stands in the open lower-left of the map, clear of the cards; then tapped where it is drawn.
 */
async function tapPlace(page, siteId) {
  const where = () => page.evaluate(id => {
    const c = window.__camera, canvas = document.querySelector('#world-map'), r = canvas.getBoundingClientRect(), site = window.__snapshot.world.map.sites[id];
    const x = r.left + r.width / 2 + (site.x - c.cx) * c.scale * r.width / canvas.width, y = r.top + r.height / 2 + (site.y - c.cy) * c.scale * r.height / canvas.height;
    const hit = document.elementFromPoint(x, y);
    return { x, y, onMap: hit?.id === 'world-map', over: hit ? `${hit.tagName}#${hit.id}` : null, scale: c.scale, box: { left: r.left, top: r.top, width: r.width, height: r.height } };
  }, siteId);
  let at = await where();
  // The open map, found on the page rather than assumed: the lowest-left spot where the map itself is under the pointer with
  // forty pixels of map all round it. Until v2026.10.01.1 this was a fixed spot at 20% across and 82% down; the action bar has
  // since grown a second row (the greyed things a person wants, docs/FAMILY_PANEL.md §23, and House) and at 1024x768 that spot is
  // under it, where a student could not tap the map either (the release candidate's run, 2026-10-01: "over BUTTON#", the bar's
  // "Go and join General Houston's army").
  const open = await page.evaluate(() => {
    const r = document.querySelector('#world-map').getBoundingClientRect();
    const map = (x, y) => document.elementFromPoint(x, y)?.id === 'world-map';
    const clear = (x, y) => [[0, 0], [-40, 0], [40, 0], [0, -40], [0, 40], [-40, -40], [40, 40], [-40, 40], [40, -40]].every(([dx, dy]) => map(x + dx, y + dy));
    const spots = [];
    for (let fy = 0.92; fy >= 0.3; fy -= 0.04) for (let fx = 0.08; fx <= 0.7; fx += 0.04) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (clear(x, y)) spots.push({ x, y });
    }
    return spots;
  });
  assert.ok(open.length >= 2, 'no open map to tap on, anywhere in its lower left: the cards and the bar cover it');
  const free = open[0], start = open.find(spot => Math.hypot(spot.x - free.x, spot.y - free.y) > 80) || open.at(-1);
  for (let i = 0; i < 12 && at.scale > 40; i++) { await page.mouse.move(free.x, free.y); await page.mouse.wheel(0, 240); await page.waitForTimeout(200); at = await where(); }
  // Drag from a free spot of the map by the distance the place has to come.
  const to = { x: free.x, y: free.y };
  await page.mouse.move(start.x, start.y); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(start.x + (to.x - at.x) * i / 10, start.y + (to.y - at.y) * i / 10);
  await page.mouse.up(); await page.waitForTimeout(400);
  at = await where();
  if (!at.onMap) throw new Error(`${siteId} is not on the map to tap: ${JSON.stringify(at)}`);
  await page.mouse.click(at.x, at.y);
  return at;
}

/** Wait as a page waits, and fail in words a check can be recognised by (scripts/scrape-pursuit-injections.mjs). */
async function until(page, message, fn, arg, options) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
mkdirSync('docs/evidence', { recursive: true });

async function run({ width, height, answer }) {
  const app = createClassroom({ seed: SPRING_SEED, playerCount: 8, tickMs: 1500, worldFactory: atHarrisburg });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const world = () => live;
  const household = () => world().households['hh-1'];
  const tag = `${width}`;
  const shot = async (page, name) => { const path = `docs/evidence/scrape-pursuit-${tag}-${name}.png`; await page.screenshot({ path }); shots.push(path); };
  const noSideways = async (page, where) => { const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over <= 1, `${where} at ${width}: the page scrolls sideways by ${over}px`); };
  try {
    const context = await browser.newContext({ viewport: { width, height } });
    const student = await context.newPage();
    student.on('pageerror', error => errors.push(`${tag} student: ${error.message}`));
    await student.goto(url);
    await student.locator('[name=name]').fill('Route reader');
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(student);
    // A second student, for the family whose map must not show the first family's way.
    const other = await (await browser.newContext({ viewport: { width, height } })).newPage();
    other.on('pageerror', error => errors.push(`${tag} other: ${error.message}`));
    await other.goto(url);
    await other.locator('[name=name]').fill('Other reader');
    await other.locator('[name=code]').fill(app.state.sessionCode);
    await other.getByRole('button', { name: 'Join', exact: true }).click();
    await other.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2');
    await meetFamily(other, 'Otherwright');
    for (let i = 3; i <= 8; i++) {
      const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
      assert.equal(response.status, 200);
    }
    const host = await (await browser.newContext({ viewport: { width, height } })).newPage();
    host.on('pageerror', error => errors.push(`${tag} host: ${error.message}`));
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
    await host.getByRole('button', { name: 'Start' }).click();
    await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
    // Slow while the student chooses, as a reader choosing would have it.
    app.setPace(10000);

    // ---------------------------------------------------------------------------------------------- choosing the way
    const main = household().mainId;
    await student.locator(`[data-portrait="${main}"]`).click();
    await student.locator('#flight-route-open').waitFor({ state: 'visible', timeout: 20000 });
    await student.locator('#flight-route-open').click();
    await student.locator('#flight-route-editor').waitFor({ state: 'visible' });
    // The lesson's own tips put away, as a student who knows the game would.
    if (await student.locator('#tutorial-skip').isVisible().catch(() => false)) await student.locator('#tutorial-skip').click();
    // A stop from the list, for the keyboard and the screen reader.
    await student.locator('#flight-route-place').selectOption('lynchburg');
    await student.locator('#flight-route-add').click();
    // And one by tapping the map: New Washington, brought into view and tapped.
    await student.locator('#flight-route-pick').click();
    await tapPlace(student, 'new-washington');
    await student.waitForFunction(() => document.querySelectorAll('#flight-route-editor .flight-route-stop').length === 2, null, { timeout: 5000 }).catch(async () => {
      throw new Error(`the tap on the map did not add New Washington: ${await student.evaluate(() => [...document.querySelectorAll('#flight-route-editor .flight-route-name')].map(one => one.textContent).join(', '))}`);
    });
    // The first stretch across country.
    await student.locator('#flight-route-editor select[data-route-way="0"]').selectOption('country');
    await shot(student, 'route-editor');
    await noSideways(student, 'the route editor');
    await student.locator('#flight-route-editor [data-action="flight-route"]').click();
    await student.waitForFunction(() => window.__snapshot?.world.flight?.status === 'fled' && window.__snapshot.world.flight.route?.stops?.length === 2, null, { timeout: 20000 });
    await student.waitForFunction(() => window.__routeEditor && !window.__routeEditor.open, null, { timeout: 15000 }).catch(async () => { throw new Error(`the route editor stayed open after setting out: ${JSON.stringify(await student.evaluate(() => window.__routeEditor))}`); });
    assert.deepEqual(household().flight.route.stops, ['lynchburg', 'new-washington']);
    assert.deepEqual(household().flight.route.ways, ['country', 'road']);
    ok(`${tag}: the student chose two stops, one from the list and one by tapping the map, the first across country, and the family set out`);
    // The path on the student's own map, and on nobody else's.
    await until(student, 'the student’s own map drew no path', () => window.__routeDrawn?.legs >= 2, null, { timeout: 15000 });
    observed[`${tag}-route`] = await student.evaluate(() => window.__routeDrawn);
    assert.ok(observed[`${tag}-route`].width <= 2.4, 'the path is not thin');
    await other.waitForFunction(() => window.__snapshot?.world.status === 'running');
    await other.waitForTimeout(1500);
    assert.equal(await other.evaluate(() => window.__routeDrawn), null, 'another family\'s map drew the first family\'s way');
    assert.equal(await other.evaluate(() => JSON.stringify(window.__snapshot.world).includes('"route"') && Boolean(window.__snapshot.world.flight?.route?.stops?.some(stop => stop.id === 'new-washington'))), false, 'another family was sent the first family\'s route');
    assert.equal(await host.evaluate(() => window.__routeDrawn), null, 'the Host\'s map drew a family\'s way');
    ok(`${tag}: the path is drawn thin on the student's own map, and not on another family's nor the Host's`);
    // Across country: the card says so, and how far off it can be seen.
    await student.waitForFunction(() => /across country/.test(document.querySelector('#selection-flight .flight-route-words')?.textContent || '') && /off the road/.test(document.querySelector('#selection-flight .flight-seen')?.textContent || ''), null, { timeout: 20000 });
    observed[`${tag}-card`] = await student.evaluate(() => ({ route: document.querySelector('#selection-flight .flight-route-words')?.textContent, seen: document.querySelector('#selection-flight .flight-seen')?.textContent }));
    // The card put away and the map on the family, to see the path it is on.
    await student.locator('#selection-close').click();
    await student.getByRole('button', { name: 'Follow', exact: true }).click().catch(() => {});
    await student.waitForTimeout(600);
    await shot(student, 'across-country');
    await student.locator(`[data-portrait="${main}"]`).click();
    ok(`${tag}: the family is going across country, and the card says how far off Mexican troops could see it`);

    // ---------------------------------------------------------------------------------------------- changing the way
    // On a little way, as the class goes.
    const going = () => Object.values(world().entities).find(one => one.householdId === 'hh-1' && one.kind === 'person' && one.travel?.purpose === 'flee');
    for (let t = 0; t < 120 && !(going()?.travel.progress > 0.3); t++) await student.waitForTimeout(500);
    assert.ok(going()?.travel.progress > 0.3, `the family never went on: ${JSON.stringify({ flight: { ...household().flight, route: undefined }, travel: going()?.travel && { progress: going().travel.progress, halted: going().travel.halted, speed: going().travel.speed } })}`);
    await student.locator('#flight-route-open').click();
    await student.locator('#flight-route-editor .flight-route-remove').first().click();
    await student.waitForFunction(() => document.querySelectorAll('#flight-route-editor .flight-route-stop').length === 1);
    const before = { ...(Object.values(world().entities).find(one => one.householdId === 'hh-1' && one.travel?.purpose === 'flee')?.location || {}) };
    await student.locator('#flight-route-editor [data-action="flight-route"]').click();
    await student.waitForFunction(() => window.__snapshot?.world.flight?.route?.stops?.length === 1, null, { timeout: 20000 });
    const leader = Object.values(world().entities).find(one => one.householdId === 'hh-1' && one.kind === 'person' && one.travel?.purpose === 'flee');
    assert.equal(leader.travel.to, 'new-washington', 'the family did not turn for New Washington');
    assert.ok(Math.hypot(leader.location.x - before.x, leader.location.y - before.y) < 1.5, 'the family did not turn where it stood');
    ok(`${tag}: changed on the road, the family turned for New Washington from where it was`);
    app.setPace(1500);

    // ---------------------------------------------------------------------------------------------- the dragoons
    // Stepped in process to the morning of April 15 and put on the road from Stafford's a mile and a half in front of Santa Anna's
    // dragoons, as a family could be.
    app.setPace(10000);
    const scene = sceneFor(world(), { kind: 'cavalry', how: 'wagon' });
    assert.ok(household().flight.chase, `the dragoons did not see the family: ${JSON.stringify({ at: dateOf(world(), world().minute).toISOString(), seen: sightMiles(world(), household()), watchers: watchersNow(world()).map(one => [one.id, Math.round(Math.hypot(one.x - familyPoint(world(), household()).x, one.y - familyPoint(world(), household()).y) * 100) / 100]) })}`);
    // Design audit 2026-09-28 B11 put a check here: somebody grown on auto, their portrait pressed in the chase, and the main person
    // unchanged. The owner reversed that on 2026-09-29 (a portrait does what the star does) and then chose "Warn, then allow"
    // (docs/FAMILY_PANEL.md §20c): the person pressed becomes main, and the refusal line says in one plain sentence that on auto they
    // will answer the soldiers themselves. Then the student's own main person is pressed back, and the order to halt below is still
    // the student's to answer. What B11 also fixed, the chase reading one main person (audit M32), is held by tests/scrape-pursuit.test.mjs.
    if (tag === '1366') {
      const son = scene.household.members.map(id => world().entities[id]).find(one => one.id !== scene.main.id && one.kind === 'person' && !(one.age < 16) && one.travel && !['dead', 'captured'].includes(one.health?.condition));
      assert.ok(son, 'the family has nobody grown on the road but its main person');
      // Pressed as the page's own buttons, wherever the column has them (a folded column keeps them in the DOM).
      await student.evaluate(id => document.querySelector(`.panel-row[data-entity-id="${id}"] [data-auto="${id}"]`).click(), son.id);
      await student.waitForFunction(id => window.__snapshot?.world.entities.find(one => one.id === id)?.auto, son.id, { timeout: 15000 });
      await student.evaluate(id => document.querySelector(`[data-portrait="${id}"]`).click(), son.id);
      await student.waitForFunction(() => /is on auto, so (he|she|they) will answer the soldiers (himself|herself|themselves)\./.test(document.querySelector('#error')?.textContent || ''), null, { timeout: 10000 });
      assert.equal(household().mainId, son.id, `pressing ${son.name}'s portrait did not make them the main person`);
      const warned = await student.evaluate(() => { const line = document.querySelector('#error'), box = line.getBoundingClientRect(); return { words: line.textContent, shown: box.width > 0 && box.height > 0 && getComputedStyle(line).visibility !== 'hidden' }; });
      assert.ok(warned.shown, 'the warning is not on the screen');
      // The student's own main person pressed back: no warning for somebody who is not on auto, and the line cleared. The press on a
      // portrait took the camera close in on the running family, and there the page draws nothing of them (public/motion.js
      // `travelSight`), so their rows are greyed and cannot be chosen (owner, 2026-09-29): Follow first, as a student would, until
      // his row is live again.
      await student.locator('#map-nav [data-view=follow]').click();
      await student.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.unseen === 'false', scene.main.id, { timeout: 15000 });
      await student.evaluate(id => document.querySelector(`[data-portrait="${id}"]`).click(), scene.main.id);
      for (const until = Date.now() + 10000; household().mainId !== scene.main.id && Date.now() < until;) await new Promise(resolve => setTimeout(resolve, 100));
      await student.waitForTimeout(300);
      const said = await student.evaluate(() => ({ line: document.querySelector('#error').textContent, unseen: [...(window.__unseenOnRoad || new Map()).keys()], sight: Object.fromEntries([...(window.__travelSight || new Map())].map(([id, one]) => [id, { alpha: one.alpha, journey: Boolean(one.journey) }])) }));
      assert.equal(household().mainId, scene.main.id, `pressing ${scene.main.name}'s portrait back did not make them main again: ${JSON.stringify(said)}`);
      assert.equal(await student.evaluate(() => document.querySelector('#error').textContent), '', 'a warning was said for somebody not on auto');
      observed.warnedAuto = { son: son.id, main: son.id, words: warned.words, backTo: scene.main.id };
      ok(`${tag}: ${son.name} on auto and their portrait pressed in the chase: made main, warned "${warned.words}", and ${scene.main.name} made main again by their portrait`);
    }
    app.setPace(1500);
    await student.waitForFunction(() => window.__snapshot?.world.flight?.chase, null, { timeout: 20000 });
    await student.waitForFunction(() => window.__snapshot?.world.flight?.ask?.id === 'alto', null, { timeout: 60000 });
    await student.locator(`[data-attention="${scene.main.id}"]`).click({ force: true });
    await student.locator('#selection-flight [data-option="halt"]').waitFor({ state: 'visible', timeout: 10000 });
    const card = await student.locator('#selection-flight').textContent();
    assert.match(card, /¡Alto!/);
    assert.match(card, /Halt!/);
    await until(student, '"¡Alto!" was not drawn over the horsemen', () => window.__chaseView?.lines?.includes('alto'), null, { timeout: 15000 });
    observed[`${tag}-alto`] = await student.evaluate(() => ({ view: window.__chaseView, ask: window.__snapshot.world.flight.ask.options.map(option => option.id) }));
    assert.ok(observed[`${tag}-alto`].view.drawn[0]?.soldiers > 0, 'the horsemen were not drawn');
    await shot(student, 'alto');
    await noSideways(student, 'the order to halt');
    ok(`${tag}: the dragoons came on and called "¡Alto!", with the English under it, over the lead horseman and on the card`);
    // The Host sees it.
    await until(host, 'the Host’s map did not draw the chase', () => window.__chaseView?.drawn?.length > 0, null, { timeout: 15000 });
    ok(`${tag}: the Host's map drew the chase`);

    if (answer === 'run') {
      await student.locator('#selection-flight [data-option="run"]').click();
      // The card put away, so the chase is in view: the horsemen, the flashes and the smoke.
      await student.locator('#selection-close').click();
      await student.waitForFunction(() => window.__chaseView?.shotsSeen > 0 || ['caught', 'escaped'].includes(window.__snapshot?.world.flight?.chase?.phase), null, { timeout: 60000 });
      await student.waitForFunction(() => window.__chaseView?.shotsSeen > 0, null, { timeout: 20000 }).catch(() => {});
      observed[`${tag}-run`] = await student.evaluate(() => ({ view: window.__chaseView, chase: window.__snapshot.world.flight.chase && { phase: window.__snapshot.world.flight.chase.phase, shots: window.__snapshot.world.flight.chase.shotCount, hits: window.__snapshot.world.flight.chase.hits } }));
      await shot(student, 'shots');
      assert.ok(observed[`${tag}-run`].view.shotsSeen > 0, `no shot was drawn: ${JSON.stringify(observed[`${tag}-run`])}`);
      assert.ok(observed[`${tag}-run`].view.flashes > 0 && observed[`${tag}-run`].view.drawn.some(one => one.smoke > 0 || one.shotsSent > 0), 'no flash or smoke was drawn');
      await student.waitForFunction(() => !window.__snapshot?.world.flight?.chase || ['caught', 'escaped'].includes(window.__snapshot.world.flight.chase.phase), null, { timeout: 60000 });
      const outcome = household().flight.pursued?.at(-1) || household().flight.chase;
      observed[`${tag}-outcome`] = outcome;
      assert.ok(['caught', 'escaped'].includes(outcome.outcome || outcome.phase));
      ok(`${tag}: the family ran; the horsemen fired - ${household().flight.pursued?.at(-1)?.shots ?? outcome.shotCount} shots, flashes and smoke drawn - and it was ${(outcome.outcome || outcome.phase) === 'caught' ? 'taken' : 'got away'}`);
    } else {
      const had = Object.values(world().entities).filter(one => one.householdId === 'hh-1' && one.kind !== 'person' && one.travel?.purpose === 'flee').map(one => one.id);
      await student.locator('#selection-flight [data-option="halt"]').click();
      await student.waitForFunction(() => ['caught'].includes(window.__snapshot?.world.flight?.chase?.phase) || window.__snapshot?.world.flight?.overtaken, null, { timeout: 20000 });
      assert.equal(household().flight.chase?.shotCount ?? household().flight.pursued?.at(-1)?.shots, 0, 'a family that halted was fired on');
      for (const id of had) assert.equal(world().entities[id].condition, 'taken');
      await shot(student, 'halted');
      ok(`${tag}: the family halted as ordered, and was taken without a shot`);
    }
    await noSideways(student, 'the end of the chase');
  } finally {
    await app.close?.();
  }
}

try {
  await run({ width: 1366, height: 768, answer: 'run' });
  await run({ width: 1024, height: 768, answer: 'halt' });
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}
writeFileSync('docs/evidence/scrape-pursuit-browser.json', `${JSON.stringify({ record: 'scrape-pursuit-browser', date: new Date().toISOString().slice(0, 10), environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768.', pass, observed, shots }, null, 2)}\n`);
console.log(`\n${pass.length} checks passed. Wrote docs/evidence/scrape-pursuit-browser.json`);
process.exit(0);
