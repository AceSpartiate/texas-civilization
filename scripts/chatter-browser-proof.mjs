// Ambient life and chatter, in a real browser (owner, 2026-09-28: "i don't want to see npc just standing around when they're
// idle. they should participate in various things to make them appear active. they should talk to each other too via chat
// bubbles over their heads, very short, easy to read sentences."; sim/ambient.mjs, public/ambient.js, docs/AMBIENT.md).
//
// tests/ambient.test.mjs proves the rules. This proves what a class sees, through the join flow, at three places and several
// moments of each:
//
//   - a farm (the student's own family at home, the student's page): the family's idle people drawn at things, not standing;
//   - a town (San Felipe, the Host's page): the keepers at their doors at things, one walked to a neighbour to talk;
//   - a camp (the 1835 force halted on the Cibolo, the student's page following the student's own man in it): the camp's men
//     at the fire, the cards, a rifle, and the other families' men with them;
//
// and at each: bubbles are drawn, over somebody drawn, short (eight words, 48 characters), never more than three at once,
// never over one another, and the whole map draws inside the page's gate (95th percentile under 50 ms a frame, the gate
// scripts/famous-people-browser-proof.mjs holds the map to).
//
// Every check is run and reported before the proof fails, so scripts/chatter-injections.mjs can see that a regression is
// caught by the check written for it and by no other.
//
// Same computer only: headless Chrome at 1366x768. Run: npm run test:chatter
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { sexOf } from '../sim/family.mjs';
import { dateOf } from '../sim/clock.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const results = [], shots = [], errors = [];
const check = (label, pass, detail = '') => { results.push({ label, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${label}${detail ? ` - ${detail}` : ''}`); };
const MAX_BUBBLES = 3, GATE_MS = 50;
mkdirSync('test-results', { recursive: true });
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `test-results/chatter-${name}.png`; await page.screenshot({ path }); shots.push(path); };

/** Every family rolled and home off the road: a class on its first afternoon. */
function home(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.members.some(id => world.entities[id].travel)) && guard++ < 600) stepWorld(world);
  return world;
}
/** Home, then a man of every family volunteered, stood in Gonzales, and the class played until the 1835 force halts on the Cibolo. */
function inCamp(seed, playerCount) {
  const world = home(seed, playerCount);
  const town = world.map.sites.gonzales;
  const men = [];
  for (const household of Object.values(world.households)) {
    const people = household.members.map(id => world.entities[id]);
    // The first family's own person, so the student's page follows him to the camp; everybody else's first grown man.
    const man = household.id === 'hh-1' ? people.find(one => one.principal) : people.find(one => sexOf(one) === 'male' && (one.age ?? 30) >= 18);
    if (!man) continue;
    (man.commitments ??= []).push({ id: 'volunteer', status: 'active' });
    men.push(man);
  }
  let guard = 0;
  // The siege camp before Béxar (Mission Concepción, then the old mill): weeks in one place, where a camp's life is seen.
  while (!(world.army?.camp && dateOf(world, world.minute).getUTCMonth() >= 10) && guard++ < 3000) {
    for (const man of men) if (!world.army && !man.travel) { man.chore = null; man.task = 'work'; man.location = { x: town.x, y: town.y, siteId: 'gonzales' }; }
    stepWorld(world);
  }
  assert.ok(world.army?.camp, 'the force never halted in a camp');
  return world;
}
const lobby = factory => (seed, playerCount) => { const world = factory(seed, playerCount); world.status = 'lobby'; return world; };

/** A class served live, the student joined as hh-1 through the join flow and its family met, the others by key, and Start. */
async function classroom(seed, factory) {
  const app = createClassroom({ seed, playerCount: 5, tickMs: 1500, worldFactory: lobby(factory) });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' })).newPage();
  page.on('pageerror', error => errors.push(`${seed} student: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill('Chatter reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page, 'Listener', { timeout: 4000 });
  for (let i = 2; i <= 5; i++) await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`${seed} host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  for (const one of [page, host]) await one.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  if (await page.locator('#lesson-stop').isVisible()) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => !window.__snapshot.world.lesson, null, { timeout: 15000 });
  }
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  return { app, page, host };
}

/**
 * Watch the map for `ms`: every frame's draw time, the ambient bubbles on screen at each look (never more than three), and
 * each person with an activity as the page drew them (the clip, from `__clipsDrawn`, not the pose the server asked for).
 */
const watch = (page, ms, { ids = null } = {}) => page.evaluate(async ([ms, ids]) => {
  const frames = [], bubbles = [], drawn = {}, most = { count: 0 }, overlaps = [], outside = [], walking = new Set(), camps = new Set();
  let last = window.__animation;
  const end = performance.now() + ms;
  const canvas = document.querySelector('#world-map');
  while (performance.now() < end) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (window.__animation && window.__animation !== last) { last = window.__animation; frames.push(last.drawMs); }
    const said = window.__ambientSaid || [];
    most.count = Math.max(most.count, said.length);
    for (const line of said) bubbles.push({ id: line.id, text: line.text, speakerId: line.speakerId, kind: line.kind });
    for (let i = 0; i < said.length; i++) {
      const a = said[i].box;
      if (a.x < 0 || a.y < 0 || a.x + a.w > canvas.width || a.y + a.h > canvas.height) outside.push(said[i].text);
      for (let j = i + 1; j < said.length; j++) { const b = said[j].box; if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps.push([said[i].text, said[j].text]); }
    }
    const world = window.__snapshot.world;
    for (const one of [...(world.entities || []), ...(world.others || [])]) {
      if (!one.amb || (ids && !ids.includes(one.id))) continue;
      const clip = window.__clipsDrawn?.[one.id];
      if (clip && window.__drawnAt?.[one.id]) (drawn[one.id] ??= new Set()).add(`${one.amb.a}:${clip}`);
    }
    for (const one of window.__townWalkers || []) if (one.visit && one.stepping) walking.add(one.id);
    // Only a camp drawn on the screen: its men are counted where a student could see them.
    for (const army of window.__armiesDrawn || []) if (army.x >= 0 && army.y >= 0 && army.x <= canvas.width && army.y <= canvas.height) for (const clip of army.men || []) camps.add(`${army.id}:${clip}`);
  }
  frames.sort((a, b) => a - b);
  const at = q => (frames.length ? +frames[Math.min(frames.length - 1, Math.floor(q * frames.length))].toFixed(2) : null);
  return { frames: { count: frames.length, median: at(0.5), p95: at(0.95), max: frames.length ? +frames.at(-1).toFixed(2) : null },
    bubbles: [...new Map(bubbles.map(one => [one.id, one])).values()], most: most.count, overlaps, outside,
    drawn: Object.fromEntries(Object.entries(drawn).map(([id, set]) => [id, [...set]])), walking: [...walking], camps: [...camps] };
}, [ms, ids]);

const standingIdle = clip => /-idle-[nsew]$/.test(clip);
const evidence = {};
/** The checks every place shares: people at things, bubbles short and few and apart, and the frame inside the gate. */
function judge(place, seen, { people = 3, lines = 1 } = {}) {
  const pairs = Object.entries(seen.drawn).flatMap(([id, list]) => list.map(entry => [id, ...entry.split(':')]));
  const idle = pairs.filter(([, , clip]) => standingIdle(clip));
  const poses = new Set(pairs.map(([, , clip]) => clip.replace(/^(rust-woman|blue-girl|rust|teal|indigo|elder|ochre|blue|girl|boy|smallchild)-/, '')));
  // The camp's men are not people of the world, and are held by their own check; `people: 0` asks only that nobody stands.
  if (people || pairs.length) check(`${place}: people at activities, none drawn standing idle`, Object.keys(seen.drawn).length >= people && !idle.length && (!people || poses.size >= 2),
    `${Object.keys(seen.drawn).length} people, poses ${[...poses].join(', ')}${idle.length ? `; standing: ${idle.map(one => one.join(' ')).join('; ')}` : ''}`);
  const long = seen.bubbles.filter(one => one.text.length > 48 || one.text.split(/\s+/).length > 8);
  check(`${place}: bubbles drawn, short, reconstructed`, seen.bubbles.length >= lines && !long.length && seen.bubbles.every(one => one.kind === 'reconstructed'),
    `${seen.bubbles.length} lines: ${seen.bubbles.slice(0, 6).map(one => `"${one.text}"`).join(' ')}${long.length ? `; too long: ${long.map(one => one.text).join(' / ')}` : ''}`);
  check(`${place}: at most ${MAX_BUBBLES} bubbles at once, never over each other, on the screen`, seen.most <= MAX_BUBBLES && !seen.overlaps.length && !seen.outside.length,
    `most ${seen.most}${seen.overlaps.length ? `, overlapping ${JSON.stringify(seen.overlaps[0])}` : ''}${seen.outside.length ? `, off screen ${seen.outside[0]}` : ''}`);
  check(`${place}: the map draws inside the gate`, seen.frames.count >= 10 && seen.frames.p95 < GATE_MS, JSON.stringify(seen.frames));
  evidence[place] = { ...seen, bubbles: seen.bubbles.map(one => `${one.speakerId}: ${one.text}`) };
}

try {
  // ------------------------------------------------------------------------------------------------ a farm and a town
  const only = process.env.CHATTER_ONLY || '';
  const early = only && only !== 'early' ? null : await classroom('chatter-proof', home);
  if (early) {
    const { page, host } = early;
    await page.locator('#map-nav [data-view=home]').click();
    await page.waitForTimeout(800);
    const own = await page.evaluate(() => window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => one.id));
    const farm = await watch(page, 45000, { ids: own });
    await shot(page, 'farm');
    judge('farm', farm, { people: 3, lines: 1 });
    // The Host at San Felipe's street: the keepers at their doors.
    await host.selectOption('#host-goto', 'san-felipe');
    await host.waitForTimeout(800);
    await host.locator('#map-nav [data-view=in]').click();
    await host.waitForTimeout(600);
    const town = await watch(host, 45000);
    await shot(host, 'town');
    judge('town', town, { people: 5, lines: 2 });
    check('town: a keeper walked to a neighbour\'s door to talk', town.walking.length >= 1, `walking: ${town.walking.join(', ')}`);
    await early.app.close();
  }
  // ------------------------------------------------------------------------------------------------ the camp
  const late = only && only !== 'camp' ? null : await classroom('chatter-camp', inCamp);
  if (late) {
    const { page } = late;
    // To the family's own man in the camp by his portrait (the camera goes to him), and whatever that opened put away, as a
    // student would, so the camp is seen.
    const principal = await page.evaluate(() => window.__snapshot.world.household.principalId || window.__snapshot.world.entities.find(one => one.principal)?.id);
    await page.locator(`[data-portrait="${principal}"]`).click({ force: true });
    await page.waitForTimeout(1000);
    for (const selector of ['#selection-close', '#town-scene .town-scene-close']) if (await page.locator(selector).isVisible()) await page.locator(selector).click();
    const keep = page.getByRole('button', { name: /^Keep playing/ });
    if (await keep.isVisible().catch(() => false)) await keep.click();
    await page.waitForTimeout(800);
    // In to the camp's own scale, where its men are drawn (public/army-view.js `CAMP_SCALE`).
    for (let i = 0; i < 6 && !(await page.evaluate(() => (window.__armiesDrawn || []).some(army => army.how === 'camp'))); i++) { await page.locator('#map-nav [data-view=in]').click(); await page.waitForTimeout(400); }
    // The other families' men in the force are on its halted road, not at a place, and a family sees them as the camp's body of
    // men (sim/town.mjs `observedBy`): the camp's men are what this page draws of them.
    const camp = await watch(page, 45000);
    await shot(page, 'camp');
    camp.armies = await page.evaluate(() => ({ drawn: window.__armiesDrawn, figure: window.__camera?.figure, scale: window.__camera?.scale, principal: window.__drawnAt?.[window.__snapshot.world.household.principalId] }));
    // What the camp's men were drawn in, read off the clips the page drew: never all standing, and several things over the watch.
    const clips = new Set(camp.camps.filter(one => one.startsWith('force:')).map(one => one.split(':')[1]));
    const poses = new Set([...clips].filter(clip => !/-idle-[nsew]$/.test(clip)).map(clip => clip.replace(/^(volunteer|elder|ochre|blue)-/, '')));
    check('camp: the force\'s men at the fire, the cards, a rifle - not a body of men standing', poses.size >= 3, `clips: ${[...clips].join(', ')}`);
    check('camp: the men talk among themselves', camp.bubbles.some(one => one.speakerId.startsWith('camp:force:')), camp.bubbles.map(one => one.speakerId).join(', '));
    judge('camp', camp, { people: 0, lines: 1 });
    await late.app.close();
  }
  check('no page error', !errors.length, errors.slice(0, 3).join(' | '));
} catch (error) {
  errors.push(error.stack || error.message);
  check('the proof ran to its end', false, error.message);
} finally {
  await browser.close();
}
writeFileSync('docs/evidence/chatter-browser.json', `${JSON.stringify({
  record: 'chatter-browser', date: new Date().toISOString().slice(0, 10),
  note: 'Same computer only: headless Chrome at 1366x768. A farm (the student\'s family at home), a town (San Felipe on the Host\'s page) and the 1835 force halted on the Cibolo (the student following their own man), each watched for 45 seconds at a tick of 1.5 s. No LAN, Chromebook or district claim.',
  results, shots, evidence, errors,
}, null, 2)}\n`);
const failed = results.filter(one => !one.pass);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed${failed.length ? `; FAILED: ${failed.map(one => one.label).join(' | ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
