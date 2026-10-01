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
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { on, sceneClock } from '../sim/town-scenes.mjs';
import { sexOf } from '../sim/family.mjs';
import { SIEGE_CAMPS } from '../sim/army.mjs';
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
  // The siege camp before Béxar at the old mill, November 15 to the storming (sim/army.mjs `SIEGE_CAMPS`): weeks in one place,
  // where a camp's life is seen. Until 2026-10-01 this stopped at the first camp in November, which is Concepción's last day or
  // two (it is left on November 2, then the camp above the town, Concepción again, and the mill): the class was barely begun
  // before the army marched on, its men faded out on the short road between camps, the camera let the man go, and the camp was
  // never drawn ("clips: " empty, on the release candidate's run and on every commit back to the one this check was last green on).
  while (!(world.army?.camp === SIEGE_CAMPS.mill.name) && guard++ < 3000) {
    for (const man of men) if (!world.army && !man.travel) { man.chore = null; man.task = 'work'; man.location = { x: town.x, y: town.y, siteId: 'gonzales' }; }
    stepWorld(world);
  }
  assert.ok(world.army?.camp, 'the force never halted in a camp');
  return world;
}
const lobby = factory => (seed, playerCount) => { const world = factory(seed, playerCount); world.status = 'lobby'; return world; };

/** A class served live, the student joined as hh-1 through the join flow and its family met, the others by key, and Start. */
async function classroom(seed, factory, { tickMs = 1500 } = {}) {
  const app = createClassroom({ seed, playerCount: 5, tickMs, worldFactory: lobby(factory) });
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
  const frames = [], bubbles = [], drawn = {}, most = { count: 0 }, overlaps = [], outside = [], walking = new Set(), arrived = new Set(), camps = new Set();
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
    for (const one of window.__townWalkers || []) { if (one.visit && one.stepping) walking.add(one.id); if (one.visit && one.arrived && !one.stepping) arrived.add(one.id); }
    // Only a camp drawn on the screen: its men are counted where a student could see them.
    for (const army of window.__armiesDrawn || []) if (army.x >= 0 && army.y >= 0 && army.x <= canvas.width && army.y <= canvas.height) for (const clip of army.men || []) camps.add(`${army.id}:${clip}`);
  }
  frames.sort((a, b) => a - b);
  const at = q => (frames.length ? +frames[Math.min(frames.length - 1, Math.floor(q * frames.length))].toFixed(2) : null);
  return { frames: { count: frames.length, median: at(0.5), p95: at(0.95), max: frames.length ? +frames.at(-1).toFixed(2) : null },
    bubbles: [...new Map(bubbles.map(one => [one.id, one])).values()], most: most.count, overlaps, outside,
    drawn: Object.fromEntries(Object.entries(drawn).map(([id, set]) => [id, [...set]])), walking: [...walking], arrived: [...arrived], camps: [...camps] };
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

/** To the family's own person by their portrait (the camera goes to them), and whatever that opened put away. */
async function toThePrincipal(page) {
  // To the family's own man in the camp by his portrait (the camera goes to him), and whatever that opened put away, as a
  // student would, so the camp is seen.
  const principal = await page.evaluate(() => window.__snapshot.world.household.principalId || window.__snapshot.world.entities.find(one => one.principal)?.id);
  // A man marching with the army can be out of sight - the page draws nothing of him - and then his row is greyed and his portrait
  // refused until he is drawn again (owner, 2026-09-29, docs/FAMILY_PANEL.md §20c): Follow, and wait for him, as a student would.
  if (await page.locator(`.panel-row[data-entity-id="${principal}"]`).getAttribute('data-unseen') === 'true') {
    await page.locator('#map-nav [data-view=follow]').click();
    await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.unseen === 'false', principal, { timeout: 60000 })
      .catch(async () => { throw new Error(`the family's man stayed out of sight for a minute: ${await page.evaluate(id => (window.__unseenOnRoad || new Map()).get(id), principal)}`); });
  }
  await page.locator(`[data-portrait="${principal}"]`).click({ force: true });
  await page.waitForTimeout(1000);
  for (const selector of ['#selection-close', '#town-scene .town-scene-close']) if (await page.locator(selector).isVisible()) await page.locator(selector).click();
  const keep = page.getByRole('button', { name: /^Keep playing/ });
  if (await keep.isVisible().catch(() => false)) await keep.click();
  await page.waitForTimeout(800);
}
/** To the family's own man in the camp by his portrait, and in to the camp's own scale. */
async function toTheCamp(page) {
  await toThePrincipal(page);
  // In to the camp's own scale, where its men are drawn (public/army-view.js `CAMP_SCALE`).
  for (let i = 0; i < 6 && !(await page.evaluate(() => (window.__armiesDrawn || []).some(army => army.how === 'camp'))); i++) { await page.locator('#map-nav [data-view=in]').click(); await page.waitForTimeout(400); }
}

// ------------------------------------------------------------------------------------------------ many talking at once
/** scripts/gonzales-town-browser-proof.mjs's class: the first family's main person in Gonzales on the morning of September 29. */
function inGonzales(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.members.some(id => world.entities[id].travel)) && guard++ < 600) stepWorld(world);
  while (sceneClock(world) < on(0, 5) && guard++ < 2000) stepWorld(world);
  const principal = world.entities[world.households['hh-1'].principalId];
  applyAction(world, 'hh-1', { action: 'travel', entityId: principal.id, destination: 'gonzales' });
  while ((principal.travel || sceneClock(world) < on(0, 11)) && guard++ < 3000) stepWorld(world);
  return world;
}
/** Three families camped together at Liberty on the road east, with the crowd from the west round its fire (sim/ambient.mjs `crowdAt`). */
function atRefuge(seed, playerCount) {
  const world = home(seed, playerCount);
  const site = world.map.sites.liberty;
  ['hh-1', 'hh-2', 'hh-3'].forEach((id, index) => {
    const household = world.households[id];
    household.flight = { status: 'refuged', refuge: 'liberty' };
    household.members.forEach((member, n) => {
      const entity = world.entities[member];
      entity.travel = null; entity.chore = null; entity.task = 'work';
      entity.location = { x: site.x + (index - 1) * 0.004 + (n % 3) * 0.0012, y: site.y + (Math.floor(n / 3) - 1) * 0.0012, siteId: 'liberty' };
    });
  });
  return world;
}
const CROWDS = [['farm', home, 'home'], ['gonzales', inGonzales, 'gonzales'], ['refuge', atRefuge, 'person'], ['camp', inCamp, null]];
const CROWD_SIZES = [{ width: 1366, height: 768 }, { width: 1024, height: 600 }, { width: 1024, height: 768 }];
const CROWD_MS = Number(process.env.CHATTER_CROWD_MS) || 15000;
// How far a bubble may be put from the head it speaks for, along its tail, before it no longer reads as that person's words.
const MAX_TAIL = 170;
const crowd = [];
/**
 * Every frame for `ms`: the bubbles of every kind drawn (`__familySaid`, `__townSaid`, `__ambientSaid`), each against every
 * other, against the names on the map (`__labelsDrawn`, `__famousDrawn`) and against the other bubbles' tails.
 */
const watchCrowd = (page, ms) => page.evaluate(async ms => {
  const canvas = document.querySelector('#world-map');
  const pen = document.createElement('canvas').getContext('2d');
  // Two boxes share more than a pixel's edge.
  const over = (a, b) => a.x + 1 < b.x + b.w && b.x + 1 < a.x + a.w && a.y + 1 < b.y + b.h && b.y + 1 < a.y + a.h;
  // A tail (from under its bubble to the head) through a box's inside (Liang-Barsky).
  const cuts = ([x0, y0, x1, y1], box) => {
    const l = box.x + 1, r = box.x + box.w - 1, t = box.y + 1, b = box.y + box.h - 1, dx = x1 - x0, dy = y1 - y0;
    let lo = 0, hi = 1;
    for (const [p, q] of [[-dx, x0 - l], [dx, r - x0], [-dy, y0 - t], [dy, b - y0]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const k = q / p;
      if (p < 0) { if (k > hi) return false; lo = Math.max(lo, k); } else { if (k < lo) return false; hi = Math.min(hi, k); }
    }
    return lo < hi;
  };
  const faults = { bubbles: [], labels: [], tails: [] }, lines = new Set();
  let frames = 0, crowded = 0, most = 0, longestTail = null, longestWhat = null, tailMissing = 0, last = window.__animation;
  const end = performance.now() + ms;
  while (performance.now() < end) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!window.__animation || window.__animation === last) continue;
    last = window.__animation;
    frames++;
    const said = [...(window.__familySaid || []), ...(window.__townSaid || []), ...(window.__ambientSaid || [])].filter(one => one.box);
    for (const one of said) lines.add(one.id);
    most = Math.max(most, said.length);
    if (said.length >= 2) crowded++;
    // The names on the map as they were laid out: their box, or else measured as `layOutCaptions` draws them.
    const scale = window.__camera?.scale ?? 1;
    pen.font = `${Math.round(Math.max(11, Math.min(16, scale * 1.1)))}px system-ui`;
    const size = Math.max(11, Number.parseInt(pen.font, 10) || 13);
    const names = [
      ...(window.__labelsDrawn?.drawn || []).map(one => ({ ...(one.box || { x: one.x - pen.measureText(one.name).width / 2 - 3, y: one.y - size, w: pen.measureText(one.name).width + 6, h: size + 4 }), name: one.name })),
      ...(window.__famousDrawn || []).filter(one => one.label).map(one => ({ ...one.label, name: one.name })),
    ];
    const text = one => `"${one.text}"`;
    for (let i = 0; i < said.length; i++) {
      const a = said[i];
      for (let j = i + 1; j < said.length; j++) if (over(a.box, said[j].box)) { faults.bubbles.push(`${text(a)} and ${text(said[j])}`); break; }
      const name = names.find(one => over(a.box, one));
      if (name) faults.labels.push(`${text(a)} over "${name.name}"`);
      const tail = said.find(other => other !== a && other.tail && cuts(other.tail, a.box));
      if (tail) faults.tails.push(`${text(a)} over the tail of ${text(tail)}`);
      if (a.tail) {
        const length = Math.round(Math.hypot(a.tail[2] - a.tail[0], a.tail[3] - a.tail[1]));
        if (length > (longestTail ?? -1)) { longestTail = length; longestWhat = `${text(a)} box ${JSON.stringify(a.box)} tail ${JSON.stringify(a.tail)}`; }
      }
      else tailMissing++;
    }
  }
  return { frames, crowded, most, lines: lines.size, faults, longestTail, longestWhat, tailMissing, width: canvas.width, height: canvas.height };
}, ms);

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
    // Seen walking on a visit, and seen standing at the neighbour's door it walked to: the walk went somewhere.
    const visited = town.walking.filter(id => town.arrived.includes(id));
    check('town: a keeper walked to a neighbour\'s door to talk', visited.length >= 1, `walked and arrived: ${visited.join(', ') || 'nobody'} (walking ${town.walking.length}, arrived ${town.arrived.length})`);
    await early.app.close();
  }
  // ------------------------------------------------------------------------------------------------ the camp
  const late = only && only !== 'camp' ? null : await classroom('chatter-camp', inCamp);
  if (late) {
    const { page } = late;
    await toTheCamp(page);
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
  // ------------------------------------------------------------------------------------------------ many talking at once
  // Owner, 2026-09-29: "When playing, text boxes for npc and player characters overlap frequently." Every bubble of a frame -
  // the family's own, the town's scenes, the neighbours' - measured against every other, the names on the map and the other
  // bubbles' tails, where the most people talk: a farm, Gonzales on the morning of September 29, a refuge on the road east and
  // the 1835 force's camp, each at the three sizes a class plays at.
  if (!only || only === 'crowd') {
    for (const [place, factory, view] of CROWDS) {
      if (process.env.CHATTER_CROWD && !process.env.CHATTER_CROWD.split(',').includes(place)) continue;
      // A slower tick than the watches above, so the three sizes are all seen by day (the talk is quiet at night).
      const room = await classroom(`chatter-crowd-${place}`, factory, { tickMs: 3000 });
      try {
        const { page } = room;
        if (place === 'camp') await toTheCamp(page);
        for (const size of CROWD_SIZES) {
          await page.setViewportSize(size);
          await page.waitForTimeout(300);
          if (view === 'person') await toThePrincipal(page);
          else if (view) await page.locator(`#map-nav [data-view=${view}]`).click();
          await page.waitForTimeout(700);
          // Close enough in that people are drawn at a size that talks (app.js: `camera.figure > 14`).
          for (let i = 0; i < 6 && (await page.evaluate(() => window.__camera?.figure ?? 0)) < 22; i++) { await page.locator('#map-nav [data-view=in]').click(); await page.waitForTimeout(350); }
          const seen = await watchCrowd(page, CROWD_MS);
          const at = `${size.width}x${size.height}`;
          crowd.push({ place, at, ...seen });
          console.log(`  crowd ${place} ${at}: ${seen.frames} frames, ${seen.crowded} with two bubbles or more, most ${seen.most}, ${seen.lines} lines; bubble over bubble ${seen.faults.bubbles.length}, over a name ${seen.faults.labels.length}, over a tail ${seen.faults.tails.length}, tail longest ${seen.longestTail ?? '-'}`);
          // The picture at the most crowded moment that comes within a few seconds, for the record.
          await page.waitForFunction(() => [...(window.__familySaid || []), ...(window.__townSaid || []), ...(window.__ambientSaid || [])].filter(one => one.box).length >= 3, null, { timeout: 8000, polling: 50 }).catch(() => {});
          await shot(page, `crowd-${place}-${at}`);
        }
      } finally { await room.app.close(); }
    }
    const all = kind => crowd.flatMap(one => one.faults[kind].map(fault => `${one.place} ${one.at}: ${fault}`));
    const crowded = crowd.reduce((sum, one) => sum + one.crowded, 0), most = Math.max(0, ...crowd.map(one => one.most));
    check('crowd: measured where many talk at once', crowd.length >= CROWD_SIZES.length * 2 && crowded >= 60 && most >= 3,
      `${crowd.length} screens, ${crowded} frames with two bubbles or more, most ${most} at once`);
    check('crowd: no bubble over another bubble', !all('bubbles').length, `${all('bubbles').length} frames${all('bubbles').length ? `, e.g. ${all('bubbles').slice(0, 3).join('; ')}` : ''}`);
    check('crowd: no bubble over a name on the map', !all('labels').length, `${all('labels').length} frames${all('labels').length ? `, e.g. ${all('labels').slice(0, 3).join('; ')}` : ''}`);
    check('crowd: no bubble over another\'s tail', !all('tails').length, `${all('tails').length} frames${all('tails').length ? `, e.g. ${all('tails').slice(0, 3).join('; ')}` : ''}`);
    const longest = Math.max(0, ...crowd.map(one => one.longestTail ?? 0)), untailed = crowd.reduce((sum, one) => sum + one.tailMissing, 0);
    const far = crowd.find(one => one.longestTail === longest);
    check('crowd: every bubble near its speaker, with a tail', longest <= MAX_TAIL && !untailed, `longest tail ${longest}px against ${MAX_TAIL}${far ? ` (${far.place} ${far.at}: ${far.longestWhat})` : ''}${untailed ? `; ${untailed} bubbles drawn with no tail in the evidence` : ''}`);
    evidence.crowd = crowd.map(one => ({ ...one, faults: { bubbles: one.faults.bubbles.slice(0, 8), labels: one.faults.labels.slice(0, 8), tails: one.faults.tails.slice(0, 8) }, counts: { bubbles: one.faults.bubbles.length, labels: one.faults.labels.length, tails: one.faults.tails.length } }));
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
