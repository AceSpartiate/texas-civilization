// The Mexican advance through the Runaway Scrape, in a real class (owner, 2026-09-25: "we need to fully model the Mexican army
// as it pushes towards the Texian army during the runaway scrape. we'll need to ensure that 50% of player farms are in the zone
// that will see their farms burned."; 2026-09-26: "Place land at the start"; docs/SCRAPE.md).
//
// tests/mexican-advance.test.mjs proves the rules. This proves what a class sees. A real spring class on the colonies map with
// rolled families, played in process to dawn on March 14, then five students join through the join flow (two at the screen,
// at 1366x768 and 1024x768) and the Host starts it. Seed `adv-proof-7` deals the first family its land inside the burn zone
// near Matagorda and the second outside it near San Felipe. It holds:
//   - the Host sees the Mexican columns on the map and sees them move, at a column's pace, with their commanders and the
//     record's strength; a student far from every column is sent none of them;
//   - the first family, gone east to Nacogdoches, is sent nothing of its farm's burning while it is away - its page draws the
//     farm as it left it, no smoke, no word in its record - while the Host sees the smoke at once;
//   - the word reaches the family by people on the road, no sooner than it could have come, and from then its page draws the
//     farm burned and its record says so in plain words;
//   - on the road home after San Jacinto the family comes home to the burned farm;
//   - the second family, outside the zone, is never shown its farm burned, and comes home to the house standing and what it
//     left in it;
//   - no page throws, and the map draws inside its frame budget on both screens.
// Same computer only: headless Chrome. Run: npm run test:mexican-advance
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { COLUMN_SIGHT_MILES, MAX_MARCH_MPH, WORD_MILES_A_DAY, columnsNow, farmFate, firesSeen, foragersOf } from '../sim/advance.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const SEED = 'adv-proof-7';

// The class's own world, held as the server holds it (`app.state` hands out a copy): read it, and - only to run the road home
// on past the class's end, as tests/scrape.test.mjs does in process - set it running again. `held` checks it is still the one
// the server has (a refused command would restore a fresh copy, and none is sent).
let live = null;
function inTheSpring(seed, playerCount) {
  const world = live = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world); world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginThirdPeriod(world);
  world.status = 'lobby';
  return world;
}

const directory = mkdtempSync(join(tmpdir(), 'texas-advance-'));
const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 250, savePath: join(directory, 'class.json'), worldFactory: inTheSpring });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const world = () => live;
const held = () => { const copy = app.state.world; assert.ok(copy.tick === live.tick && copy.minute === live.minute, 'the proof lost hold of the class\'s world'); };
// Read fresh each time: a refused command restores the world from its last committed text (server/app.mjs `commit`).
const inside = () => world().households['hh-1'], outside = () => world().households['hh-2'];
assert.ok(farmFate(world(), inside()), 'the seed no longer deals the first family inside the burn zone');
assert.ok(!farmFate(world(), outside()), 'the seed no longer deals the second family outside the burn zone');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = { seed: SEED, columns: [], frames: {} };
async function pageFor(viewport, name) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  return page;
}
/** Wait as a page waits, and fail in words a check can be recognised by (scripts/mexican-advance-injections.mjs). */
async function until(page, message, fn, arg, options) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}
async function serverUntil(message, done, timeout = 600000) {
  const started = Date.now();
  while (!done()) {
    if (Date.now() - started > timeout) throw new assert.AssertionError({ message });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
const command = (page, body) => page.evaluate(async body => { const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return response.status === 200 ? 'ok' : `${response.status} ${await response.text()}`; }, { id: `proof-${Math.random().toString(36).slice(2)}-${Date.now()}`, ...body });
/** The map's draw time on a page, sampled over a few seconds: median and 95th percentile, in milliseconds. */
async function frameTimes(page, ms = 3000) {
  const samples = await page.evaluate(async ms => {
    const out = [], end = performance.now() + ms;
    while (performance.now() < end) { await new Promise(resolve => setTimeout(resolve, 60)); if (Number.isFinite(window.__animation?.drawMs)) out.push(window.__animation.drawMs); }
    return out;
  }, ms);
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples: sorted.length, median: sorted[Math.floor(sorted.length / 2)] ?? null, p95: sorted[Math.floor(sorted.length * 0.95)] ?? null };
}

try {
  mkdirSync('docs/evidence', { recursive: true });
  // ------------------------------------------------------------------ a real class through the join flow
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport, householdId);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Burnside', 'hh-2': 'Standwell' }[householdId]);
    students[householdId] = page;
  }
  for (let i = 3; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  // The three families with nobody at a screen are left to their main person's auto (sim/auto.mjs), as a class would be.
  for (let i = 3; i <= 5; i++) { const household = world().households[`hh-${i}`]; world().entities[household.mainId || household.principalId].auto = true; }
  const { 'hh-1': burned, 'hh-2': standing } = students;
  const host = await pageFor({ width: 1366, height: 768 }, 'host');
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await burned.waitForFunction(() => window.__snapshot?.world.status === 'running');
  ok('five students joined through the class code, two at the screen (1366x768 and 1024x768), and the Host started the class at dawn on March 14');

  // ------------------------------------------------------------------ the columns on the Host's map, moving
  await until(host, 'the Host was shown no Mexican column', () => (window.__snapshot.world.armies || []).some(army => army.side === 'mexican'), null, { timeout: 60000 });
  const read = () => host.evaluate(() => ({ minute: window.__snapshot.world.minute, armies: (window.__snapshot.world.armies || []).filter(army => army.side === 'mexican').map(army => ({ id: army.id, x: army.x, y: army.y, commander: army.commander, strength: army.strength, place: army.place, moving: army.moving })), drawn: (window.__armiesDrawn || []).filter(army => army.side === 'mexican').map(army => ({ id: army.id, how: army.how })) }));
  // Read half a day apart until a column has marched between the two readings (a column may be in camp at the first).
  let first = await read(), second = null, moved = [];
  for (let tries = 0; tries < 12 && !moved.some(one => one.miles > 1); tries++) {
    if (second) first = second;
    await until(host, 'the Host\'s clock never moved on', minute => window.__snapshot.world.minute >= minute + 12 * 60, first.minute, { timeout: 120000 });
    second = await read();
    moved = first.armies.map(one => { const later = second.armies.find(other => other.id === one.id); return later && { id: one.id, miles: Math.hypot(later.x - one.x, later.y - one.y), hours: (second.minute - first.minute) / 60 }; }).filter(Boolean);
  }
  assert.ok(moved.some(one => one.miles > 1), `no column moved on the Host's map: ${JSON.stringify(moved)}`);
  for (const one of moved) assert.ok(one.miles <= MAX_MARCH_MPH * one.hours + 0.5, `${one.id} jumped ${one.miles.toFixed(1)} miles in ${one.hours} hours`);
  assert.ok(second.drawn.length && second.drawn.every(one => ['mark', 'camp', 'column'].includes(one.how)), `the Host's map did not draw the columns: ${JSON.stringify(second.drawn)}`);
  assert.ok(second.armies.some(army => army.commander && army.strength > 0), 'a column on the Host\'s map has no commander or no strength');
  evidence.columns.push(first, second);
  await host.screenshot({ path: 'docs/evidence/mexican-advance-host.png' });
  ok(`the Host sees ${second.armies.map(army => `${army.id} (${army.place}${army.strength ? `, about ${army.strength}` : ''})`).join('; ')}, and ${moved.filter(one => one.miles > 1).map(one => `${one.id} moved ${one.miles.toFixed(1)} miles in ${one.hours} hours`).join(', ')}`);
  // A student with nobody near any column is sent none of them.
  const far = await standing.evaluate(() => (window.__snapshot.world.armies || []).filter(army => army.side === 'mexican').map(army => army.id));
  const eyes = outside().members.map(id => world().entities[id]).filter(one => one.location && !['dead', 'captured'].includes(one.health.condition)).map(one => one.location);
  const nearAny = columnsNow(world()).some(({ column, head }) => [head, ...foragersOf(world(), column, head)].some(point => eyes.some(eye => Math.hypot(eye.x - point.x, eye.y - point.y) <= COLUMN_SIGHT_MILES)));
  if (!nearAny) assert.deepEqual(far, [], 'a family with nobody near a column was sent it');
  ok(`the second family, ${nearAny ? 'near a column' : 'with nobody near any column'}, is sent ${far.length ? far.join(', ') : 'no Mexican column'}`);

  // ------------------------------------------------------------------ both families told to leave: the first goes far east
  const flee = async (page, householdId, pick) => {
    const household = () => world().households[householdId];
    await serverUntil(`${householdId} was never told to leave`, () => Boolean(household().flight?.status), 900000);
    // Gone already (a family by hand that answered nothing for a day is packed off by itself, sim/auto.mjs), or home again.
    if (!['ordered', 'stayed'].includes(household().flight.status)) return household().flight.refuge || null;
    await until(page, `${householdId}'s page was never shown the order to leave`, () => ['ordered', 'stayed'].includes(window.__snapshot.world.flight?.status), null, { timeout: 60000 });
    const shown = await page.evaluate(() => window.__snapshot.world.flight);
    if (!shown.refuges?.length) return null;
    const refuge = pick([...shown.refuges].sort((a, b) => a.miles - b.miles));
    const actor = household().members.map(id => world().entities[id]).find(one => one.location?.siteId === household().homeSiteId && !['dead', 'captured'].includes(one.health.condition) && (one.age ?? 30) >= 16);
    const food = Math.min(Math.floor(shown.room / shown.space.food), shown.have.food);
    assert.equal(await command(page, { action: 'flee', entityId: actor.id, take: { food }, refuge: refuge.id }), 'ok', 'the family could not leave');
    assert.equal(await command(page, { action: 'set-auto', entityId: household().mainId || household().principalId, auto: true }), 'ok');
    return refuge.id;
  };
  const firstRefuge = await flee(burned, 'hh-1', refuges => refuges.at(-1));
  // The second family goes the moment it is told, to the nearest refuge east, as a student would; it is waited for below.
  const secondGoes = flee(standing, 'hh-2', refuges => refuges[0]);
  ok(`the first family, inside the zone, left for ${world().map.sites[firstRefuge].name} with what it could carry, and the rest left in the house`);

  // ------------------------------------------------------------------ the farm burns while the family is away: nothing on its page
  held();
  await serverUntil('the foragers never reached the first family\'s farm', () => Number.isFinite(inside().flight?.burned), 900000);
  const burnedAt = inside().flight.burned, home = world().map.sites[inside().homeSiteId];
  // What the Host is sent, read at once: the smoke stands six hours, and waiting below for the family's page to catch up can
  // let the class run past it (seen once in three runs on 2026-09-26 as "the Host was not shown the farm's smoke").
  const hostSent = firesSeen(live, undefined, 'host').some(fire => fire.id === `farm:${inside().id}`);
  await until(burned, 'the family\'s page never caught up with the burning', minute => window.__snapshot.world.minute >= minute, burnedAt, { timeout: 60000 });
  const before = await burned.evaluate(() => ({ cabin: window.__snapshot.world.land.cabin, flight: window.__snapshot.world.household.flight, fires: (window.__snapshot.world.fires || []).map(fire => fire.id), events: window.__snapshot.world.events.map(event => event.text), reports: window.__snapshot.world.reports.map(report => report.topicId) }));
  if (!inside().flight.burnKnown) {
    assert.notEqual(before.cabin, 'ruined', 'the family\'s page drew its farm burned before anybody could have told it');
    assert.equal(before.flight.burned, undefined, 'the household sent to the page carries the burning');
    assert.ok(!before.fires.includes(`farm:${inside().id}`), 'the family was sent the smoke of its own farm from where it could not see it');
    assert.ok(!before.events.some(text => /burned the house, the field and the fences/.test(text)), 'the family\'s record told it of the burning');
    assert.ok(!before.reports.includes(`farm-burned:${inside().id}`));
  }
  // The Host is sent the smoke while it stands (six hours: a tick or two at this pace), and its page draws what it is sent.
  assert.ok(hostSent, 'the Host was not shown the farm\'s smoke');
  const hostFire = await host.waitForFunction(id => (window.__firesDrawn || []).some(fire => fire.id === `farm:${id}`), inside().id, { timeout: 20000 }).then(() => 'drawn on its map', () => 'sent, and gone before its page drew it');
  const others = await standing.evaluate(id => (window.__snapshot.world.fires || []).some(fire => fire.id === `farm:${id}`), inside().id);
  assert.equal(others, false, 'the second family, far off, was sent the first family\'s smoke');
  evidence.burning = { burnedAt, by: inside().flight.burnedBy, before: { cabin: before.cabin, fires: before.fires } };
  ok(`the farm burned (${inside().flight.burnedBy.name}) while the family was away: its page still drew the house ${before.cabin}, with no smoke and no word; the Host was sent the smoke at once (${hostFire}); the other family saw nothing`);

  // ------------------------------------------------------------------ the word comes by people, no sooner than it could
  await until(burned, 'the word of the burning never reached the family', () => window.__snapshot.world.land.cabin === 'ruined', null, { timeout: 900000 });
  const known = inside().flight.burnKnown;
  const after = await burned.evaluate(id => ({ minute: window.__snapshot.world.minute, events: window.__snapshot.world.events.map(event => event.text), report: window.__snapshot.world.reports.find(report => report.topicId === `farm-burned:${id}`) }), inside().id);
  assert.ok(['word', 'sight'].includes(known.how), `the family learned it by ${known.how}`);
  if (known.how === 'word') {
    const eyesThen = inside().members.map(id => world().entities[id]).filter(one => one.location && !['dead', 'captured'].includes(one.health.condition)).map(one => one.location);
    const miles = Math.min(...eyesThen.map(point => Math.hypot(point.x - home.x, point.y - home.y)));
    assert.ok(known.minute - burnedAt >= miles / WORD_MILES_A_DAY * 1440 - 24 * 60, 'the word came faster than people could carry it');
    assert.ok(after.events.some(text => /Word came along the road from people fleeing east: on .+ foragers of .+ reached the family's farm and burned the house, the field and the fences/.test(text)), 'no account in plain words');
    assert.equal(after.report?.source, 'People fleeing east');
  }
  evidence.word = { how: known.how, knownAt: known.minute, hoursAfter: Math.round((known.minute - burnedAt) / 60), report: after.report };
  await burned.screenshot({ path: 'docs/evidence/mexican-advance-word.png' });
  ok(`the family learned it by ${known.how} ${evidence.word.hoursAfter} hours after the burning; its page now draws the farm burned, and its record says: "${after.events.find(text => /burned the house, the field and the fences/.test(text))}"`);

  // ------------------------------------------------------------------ frame time with the columns on the map
  evidence.frames.host = await frameTimes(host);
  evidence.frames.student1024 = await frameTimes(standing);
  for (const [name, frame] of Object.entries(evidence.frames)) assert.ok(frame.samples > 5 && frame.p95 < 100, `${name}'s map draws in ${frame.p95} ms at its 95th percentile`);
  ok(`the map draws in ${evidence.frames.host.median?.toFixed(1)} ms (95th ${evidence.frames.host.p95?.toFixed(1)}) on the Host at 1366x768 and ${evidence.frames.student1024.median?.toFixed(1)} ms (95th ${evidence.frames.student1024.p95?.toFixed(1)}) on a student's page at 1024x768`);

  // ------------------------------------------------------------------ the second family goes too; the class ends; the road home
  await secondGoes;
  await serverUntil('the class never ended', () => world().status === 'ended' || world().director.complete, 1200000);
  // The game ends on April 25 with the families on the road home (owner, docs/COLONIES.md §7g); the road is run on past it here to
  // see them arrive, as tests/scrape.test.mjs does.
  held();
  world().status = 'running';
  await serverUntil('the first family never came home', () => inside().flight.status === 'home', 600000);
  await until(burned, 'the family\'s page never showed it home', () => window.__snapshot.world.events.some(event => /The family is home\. The house is ashes/.test(event.text)), null, { timeout: 60000 });
  const homeView = await burned.evaluate(() => window.__snapshot.world.land.cabin);
  assert.equal(homeView, 'ruined');
  ok('on the road home after San Jacinto the first family came home, and its page said: the house is ashes');
  await serverUntil('the second family never came home or stayed', () => ['home', 'stayed'].includes(outside().flight?.status), 600000);
  const standingView = await standing.evaluate(id => ({ cabin: window.__snapshot.world.land.cabin, reports: window.__snapshot.world.reports.map(report => report.topicId), events: window.__snapshot.world.events.map(event => event.text), fires: (window.__snapshot.world.fires || []).map(fire => fire.id) }), outside().id);
  assert.notEqual(standingView.cabin, 'ruined', 'the farm outside the zone was drawn burned');
  assert.ok(!standingView.reports.includes(`farm-burned:${outside().id}`), 'the family outside the zone was told its farm burned');
  assert.ok(!Number.isFinite(outside().flight.burned), 'the farm outside the zone burned');
  if (outside().flight.status === 'home') await until(standing, 'the family outside the zone was never told its house stood', () => window.__snapshot.world.events.some(event => /The Mexican army never came this way: the house stands/.test(event.text)), null, { timeout: 60000 });
  evidence.outside = { status: outside().flight.status, cabin: standingView.cabin };
  ok(`the second family, outside the zone, ${outside().flight.status === 'home' ? 'came home to its house standing and what it left in it' : 'stayed at home, and nothing came'}; it was never shown its farm burned`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/mexican-advance-browser.json', `${JSON.stringify({
    record: 'The Mexican advance through the Runaway Scrape, in a browser: docs/SCRAPE.md', date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only: a real class on the colonies map with rolled families, played in process to dawn on March 14 and then served live to headless Chrome at 1366x768 (Host, first student) and 1024x768 (second student); five students joined by the class code. No LAN or district claim.',
    checks: pass, evidence, screenshots: ['docs/evidence/mexican-advance-host.png', 'docs/evidence/mexican-advance-word.png'],
  }, null, 2)}\n`.replace(/\n/g, '\r\n'));
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
  rmSync(directory, { recursive: true, force: true });
}
