// What the country of 1836 changes in play, in a real browser: docs/BIOME_GAMEPLAY.md §6.
//
// tests/biome-game.test.mjs proves the rules. What only a page can show: that the family asking about a place on its land
// is told what would come there and what it brings home, through the same request the map's tap makes; that the hunt, sent
// the way the page sends it, asks the family about that quarry on the person's card, and draws no deer where the words say a
// turkey; that the new order to fetch logs is on the family panel with its glyph and its cost in hours and miles; and that a
// plot out on the prairie says how its fence would go up.
//
// Same computer only (headless Chrome), not LAN or district acceptance.
// Run: node scripts/biome-game-browser-proof.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { huntFacts } from '../sim/hunting.mjs';
import { fenceWork } from '../sim/fields.mjs';
import { plotFacts } from '../sim/survey.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const grid = (bounds, side) => {
  const points = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) points.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return points;
};

const app = createClassroom({ seed: 'biome-game-proof', playerCount: 5, tickMs: 600, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};
const until = async (test, what, ms = 60000) => { const end = Date.now() + ms; while (!test()) { if (Date.now() > end) throw new Error(`timed out: ${what}`); await new Promise(resolve => setTimeout(resolve, 100)); } };

let record = {};
try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Biome reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // The family drives onto its land and the house is set - what a student does on the map, done here on the server because
  // choosing the site is proved in its own right (tests/homesite.test.mjs).
  const world = () => app.state.world, household = () => world().households['hh-1'];
  await until(() => !household().arriving, 'the family reaching its land');
  const bounds = holdingOf(world(), household()).bounds;
  const middle = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const site = grid(bounds, 7).sort((p, q) => Math.hypot(p.x - middle.x, p.y - middle.y) - Math.hypot(q.x - middle.x, q.y - middle.y)).find(point => siteFactsFor(world(), household(), point).can);
  const chose = await page.evaluate(async body => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, { id: `proof-${crypto.randomUUID()}`, action: 'choose-site', x: site.x, y: site.y });
  assert.equal(chose, 200);
  await until(() => household().homeSiteId && !household().site?.choosing && huntFacts(world(), household(), site).why !== 'Choose where the house will stand first.', 'the house site chosen');
  await until(() => household().members.concat(household().property).every(id => !world().entities[id].travel), 'everybody at the house site');
  const principal = household().principalId;

  // ------------------------------------------------------------------ the place says what would come
  const ask = (x, y, job) => page.evaluate(async ([x, y, job]) => (await (await fetch(`/api/plot?x=${x}&y=${y}&job=${job}`)).json()).facts, [x, y, job]);
  const places = grid(bounds, 9).map(point => ({ point, facts: huntFacts(world(), household(), point) })).filter(entry => entry.facts.can);
  const pick = places.find(entry => entry.facts.comes && entry.facts.comes !== 'deer') || places.find(entry => entry.facts.comes);
  assert.ok(pick, `nowhere on the land to hunt: ${huntFacts(world(), household(), site).why}`);
  const facts = await ask(pick.point.x, pick.point.y, 'hunt-land');
  assert.equal(facts.comes, pick.facts.comes);
  assert.match(facts.words, /Waiting here, (a|an|ducks) [a-z ]+: [a-z]+ food/);
  ok(`the page asking about a place on the land is told what would come: "${facts.words}"`);

  // The map taken in to the family's own yard before the hunt is ordered, so the quarry is a picture rather than four
  // pixels of a county when it is photographed. The cards are put away for the same reason.
  for (const id of ['#tutorial-skip', '#journal-close', '#wagon-done']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  }
  await page.locator('#map-nav [data-view="home"]').click().catch(() => {});
  const map = await page.locator('#world-map').boundingBox();
  await page.mouse.move(map.x + map.width / 2, map.y + map.height / 2);
  for (let i = 0; i < 22; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(20); }
  await page.waitForTimeout(400);

  // ------------------------------------------------------------------ the hunt asks about that quarry
  const command = input => page.evaluate(async body => { const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: response.status, body: await response.json() }; }, { id: `proof-${crypto.randomUUID()}`, ...input });
  const sent = await command({ action: 'hunt-land', entityId: principal, x: pick.point.x, y: pick.point.y });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  await page.waitForFunction(id => window.__snapshot?.world.entities?.find(e => e.id === id)?.chore?.ask, principal, { timeout: 120000 });
  const asked = await page.evaluate(id => window.__snapshot.world.entities.find(e => e.id === id).chore.ask.text, principal);
  const quarryName = { deer: 'a deer', turkey: 'a turkey', bear: 'a bear', bison: 'a buffalo', pronghorn: 'an antelope', mustang: 'a mustang', cattle: 'a wild cow', javelina: 'a javelina', waterfowl: 'ducks and geese' }[facts.comes];
  assert.ok(asked.includes(`downwind of ${quarryName},`), asked);
  await page.screenshot({ path: 'docs/evidence/biome-game/hunt-asked.png' });
  // Answered at once, before the family's patience runs out: wait for it to come closer, which makes the kill certain.
  const answer = await command({ action: 'answer-chore', entityId: principal, option: 'wait' });
  assert.equal(answer.status, 200, JSON.stringify(answer.body));
  // Watched on the page while it comes closer. Each quarry is drawn as ITSELF or not at all: the deer since 2026-09-15
  // and the turkey since Astra's sheet of 2026-09-21; anything else is words only and is given no place to stand.
  await page.waitForTimeout(1500);
  const drawn = await page.evaluate(() => window.__quarryDrawn || null);
  const hasArt = ['deer', 'turkey'].includes(facts.comes);
  if (hasArt) {
    assert.ok(drawn, `${quarryName} was not drawn`);
    assert.equal(drawn.kind, facts.comes, `${quarryName} was drawn as a ${drawn.kind}`);
    // The picture itself, so somebody can look at it: the hunter, and the quarry the words name, in one frame. The
    // person's own card is put away first, or it stands between the reader and the thing being photographed; and the map
    // is dragged so that the place the quarry was drawn at (`__quarryDrawn`, in screen pixels) is in the middle of it -
    // a hunter goes out to the edge of the cover and is off the screen the family's own yard fills.
    // The class is held while the picture is taken: panning takes a second of real time and the hunt is over in a tick
    // or two, so without this the quarry has been shot and carried home before the camera reaches it.
    await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot?.world.status === 'paused');
    if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click().catch(() => {});
    const canvas = await page.locator('#world-map').boundingBox();
    const centre = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x - (drawn.x - canvas.width / 2), centre.y - (drawn.y - canvas.height / 2), { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/evidence/biome-game/quarry-${facts.comes}.png` });
    await post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  } else assert.equal(drawn, null, `a picture was drawn for ${quarryName}`);
  ok(`the shot is asked about the place's quarry, "${asked}", and ${hasArt ? `the ${facts.comes} is drawn as a ${drawn.kind}` : 'nothing is drawn for it'}`);
  await until(() => world().events.some(event => event.householdId === 'hh-1' && event.type === 'hunt-kill'), 'the kill', 120000);
  const kill = world().events.find(event => event.householdId === 'hh-1' && event.type === 'hunt-kill');
  assert.equal(kill.quarry, facts.comes);
  ok(`the family is told what was brought down: "${kill.text}"`);

  // ------------------------------------------------------------------ fetching logs, on the panel
  await until(() => !world().entities[principal].chore, 'the hunter home', 120000);
  const icon = `.panel-row[data-entity-id="${principal}"] .panel-icon[data-key="fetch-logs"]`;
  await page.waitForSelector(icon, { timeout: 30000 });
  const fetchLogs = await page.locator(icon).evaluate(button => ({ name: button.dataset.name, note: button.dataset.note, summary: button.dataset.summary, why: button.dataset.why, painted: [...button.querySelectorAll('canvas')].some(canvas => { const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true; return false; }) }));
  assert.equal(fetchLogs.name, 'Fetch logs from the timber');
  assert.match(fetchLogs.note || fetchLogs.why || '', /Costs the ox and wagon for about \d+ hours?, to the timber|ox and wagon at home|no timber within reach|axe/);
  assert.ok(fetchLogs.painted, 'the fetch-logs glyph was not painted');
  ok(`the family panel offers "${fetchLogs.name}": "${fetchLogs.note || fetchLogs.why}", its glyph painted`);

  // ------------------------------------------------------------------ a plot says how its fence goes up
  const spots = grid(bounds, 6).filter(point => plotFacts(world(), household(), point).can).map(point => ({ point, work: fenceWork(world(), household(), point) }));
  const spot = spots.sort((a, b) => b.work.ticks - a.work.ticks)[0];
  // Surveyed as a student surveys it, and then counted as cleared: clearing is proved in its own right (test:farm).
  const surveyed = await command({ action: 'survey-plot', entityId: principal, x: spot.point.x, y: spot.point.y });
  assert.equal(surveyed.status, 200, JSON.stringify(surveyed.body));
  const staked = () => (household().plots || []).find(plot => Math.hypot(plot.x - spot.point.x, plot.y - spot.point.y) < 0.01);
  await until(() => staked(), 'the plot staked', 120000);
  await until(() => !world().entities[principal].chore, 'the surveyor home', 120000);
  // And cleared, as a family clears it: everybody old enough sent to it (the server's world is its own; `app.state` is a copy).
  const at = staked();
  for (const id of household().members) await command({ action: 'clear-plot', entityId: id, x: at.x, y: at.y });
  await until(() => staked()?.state === 'cleared', 'the plot cleared', 300000);
  const fence = await ask(at.x, at.y, 'fence-plot');
  assert.match(fence.words || JSON.stringify(fence), /with no fence\. (Rails carried from the timber [\d.]+ miles off|Rails split from the timber at hand|Mesquite posts and brush from where it stands|No timber within 3 miles: the rails come from far off)(: |, )about \d+ hours\./);
  ok(`a cleared plot says how its fence would go up: "${fence.words}"`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');
  record = { record: 'The biome game in a browser: docs/BIOME_GAMEPLAY.md §6', date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, pass, hunt: { words: facts.words, asked, quarry: facts.comes, drawn, kill: kill.text }, fetchLogs, fence: fence.words };
} finally {
  await browser.close();
  await app.close?.();
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/biome-game-browser.json', `${JSON.stringify(record, null, 2)}\n`);
console.log(`\n${pass.length} checks passed; wrote docs/evidence/biome-game-browser.json`);
process.exit(0);
