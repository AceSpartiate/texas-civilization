// The teacher's view of the whole class, watched in the browser (owner, 2026-09-16: "the teacher should be able to see
// everything and everyone").
//
// tests/host-view.test.mjs proves the projection: the Host is sent everybody where they truly are and every family's land,
// and a student is sent nothing new. This proves what a teacher can actually do with it on the Host page: go to a family
// far from the one a student is playing, zoom in on its farm and see its house, its plots, its line and its people at work;
// look at one of them, read only; go to a town and see its shops and the people keeping them - while the student's page,
// open at the same moment, still shows none of that family.
//
// The class is a real-land class of twelve families run by the neighbours for a while in process, so there are houses,
// cleared ground and people about; nothing of it is placed by hand.
//
// Same computer only: headless Chrome at 1440x950. Not a physical LAN, not a classroom.
// Run: npm run test:host-view
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld } from '../sim/world.mjs';
import { landView } from '../sim/houses.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const PLAYERS = 12, AFTERNOON = 150;

function afternoonClass(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies', neighbours: true });
  world.status = 'running';
  for (let i = 0; i < AFTERNOON; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'host-view-proof', playerCount: PLAYERS, tickMs: 4000, worldFactory: afternoonClass });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('docs/evidence', { recursive: true });

/** Wait for the map to have been drawn with the camera settled where it was sent. */
const settle = page => page.waitForTimeout(1500);

try {
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Fog reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');

  const host = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host' && window.__snapshot.world.overview);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // The map, the catalogue (plots, woods) and the art, before anything is looked at.
  await host.waitForFunction(() => window.__snapshot?.world.map?.sites && Object.keys(window.__snapshot.world.map.sites).length > 10, null, { timeout: 30000 });
  await host.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  await settle(host);

  // The family to look at: the furthest from the student's own, with a house begun or standing and somebody at home.
  const world = app.state.world;
  const mine = world.map.sites[world.households['hh-1'].homeSiteId];
  const candidates = Object.values(world.households).filter(household => household.id !== 'hh-1')
    .map(household => ({ household, site: world.map.sites[household.homeSiteId], home: household.members.filter(id => world.entities[id]?.location?.siteId === household.homeSiteId) }))
    .filter(entry => entry.home.length && landView(entry.household).shelter !== 'camp')
    .sort((a, b) => Math.hypot(b.site.x - mine.x, b.site.y - mine.y) - Math.hypot(a.site.x - mine.x, a.site.y - mine.y));
  assert.ok(candidates.length, 'no family had anybody at home to look at');
  const far = candidates[0];
  observed.farFamily = { householdId: far.household.id, homeSiteId: far.household.homeSiteId, milesFromStudent: Math.round(Math.hypot(far.site.x - mine.x, far.site.y - mine.y) * 10) / 10, atHome: far.home };

  // The student's page, at the same moment, has none of that family.
  const studentWire = await student.evaluate(() => JSON.stringify(window.__snapshot.world));
  for (const id of far.household.members) assert.ok(!studentWire.includes(`"${id}"`), `the student was sent ${id}`);
  assert.ok(!studentWire.includes('"overview"'), 'the student was sent the class overview');
  observed.studentOthers = await student.evaluate(() => window.__snapshot.world.others.length);
  ok(`the student's page, ${observed.farFamily.milesFromStudent} miles away, has none of ${far.household.id}'s people and no overview`);

  // The Host goes to that family's land from the list.
  const options = await host.locator('#host-goto option').allTextContents();
  assert.ok(options.length >= PLAYERS + 2, `the Host's list holds ${options.length} places`);
  await host.locator('#host-goto').selectOption(far.household.homeSiteId);
  await settle(host);
  const farm = await host.evaluate(({ householdId, members }) => {
    const canvas = document.querySelector('#world-map'), land = window.__snapshot.world.overview.lands[householdId];
    const inside = spot => spot && spot.x >= 0 && spot.y >= 0 && spot.x <= canvas.width && spot.y <= canvas.height;
    return {
      camera: window.__camera, land: { name: land.name, view: land.view, plots: land.plots.length, logs: land.logs || 0 },
      drawnPeople: members.filter(id => inside(window.__drawnAt[id])),
      houseDrawn: window.__hostLandsDrawn?.[land.homeSiteId] || null,
      plotsDrawn: (window.__plotsDrawn || []).filter(plot => plot.householdId === householdId).length,
      // The snapshot as it came over the wire: the page hangs the map (fetched once) on it after it arrives.
      holdings: window.__holdingsDrawn, snapshotBytes: JSON.stringify({ ...window.__snapshot, world: { ...window.__snapshot.world, map: undefined } }).length,
      description: document.querySelector('#world-description').textContent,
    };
  }, { householdId: far.household.id, members: far.household.members });
  observed.farm = farm;
  assert.ok(farm.drawnPeople.length >= 1, `none of ${far.household.id}'s people were drawn on the Host's map: ${JSON.stringify(farm)}`);
  assert.ok(farm.holdings >= 1, 'no land line was drawn');
  // The house as it truly stands, not a camp assumed from the arrival or a house last seen.
  assert.ok(farm.houseDrawn, `${far.household.id}'s land was not drawn as the Host's`);
  assert.deepEqual({ shelter: farm.houseDrawn.shelter, layout: farm.houseDrawn.layout }, { shelter: landView(far.household).shelter, layout: landView(far.household).layout });
  assert.notEqual(farm.houseDrawn.shelter, 'camp', 'the family chosen has no house to prove anything with');
  if (far.household.house?.pieces) assert.ok(farm.houseDrawn.pieces >= 1, 'the house plot pieces were not drawn');
  if (farm.land.plots) assert.ok(farm.plotsDrawn >= 1, `${far.household.id}'s plots were not drawn`);
  await host.screenshot({ path: 'docs/evidence/host-view-farm.png' });
  ok(`the Host zoomed to ${farm.land.name}'s farm (${farm.land.view.shelter}${farm.land.view.layout ? `, ${farm.land.view.layout}` : ''}) and drew ${farm.drawnPeople.length} of its people, ${farm.plotsDrawn} plot(s) and its line`);

  // As close as a student can come to their own land: the same closest zoom.
  for (let i = 0; i < 12; i++) await host.locator('#map-nav [data-view=in]').click();
  for (let i = 0; i < 12; i++) await student.locator('#map-nav [data-view=in]').click();
  const closest = { host: await host.evaluate(() => window.__camera.scale), student: await student.evaluate(() => window.__camera.scale) };
  observed.closestScale = closest;
  assert.ok(Math.abs(closest.host - closest.student) < 1, `the Host's closest zoom ${closest.host} is not a student's ${closest.student}`);
  ok(`the Host zooms in as far as a student does (${Math.round(closest.host)} pixels a mile)`);
  await host.locator('#host-goto').selectOption(far.household.homeSiteId);
  await settle(host);

  // Look at one of them, read only.
  // One who is on the screen at this zoom: since 2026-09-17 a figure off the screen is not drawn at all (public/map-base.js), and at the
  // closest zoom somebody working at the edge of the field can be.
  const onScreen = await host.evaluate(() => Object.keys(window.__drawnAt || {}));
  const person = far.home.find(id => world.entities[id].kind === 'person' && onScreen.includes(id)) || far.home.find(id => onScreen.includes(id)) || far.home[0];
  const spot = await host.evaluate(id => {
    const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), at = window.__drawnAt[id];
    return at && { x: rect.left + at.x * rect.width / canvas.width, y: rect.top + at.y * rect.height / canvas.height };
  }, person);
  assert.ok(spot, `${person} was not drawn to be clicked`);
  await host.mouse.click(spot.x, spot.y);
  await host.locator('#selection').waitFor({ state: 'visible' });
  const card = await host.evaluate(() => ({
    id: document.querySelector('#selection').dataset.entityId,
    name: document.querySelector('#selection-name').textContent,
    state: document.querySelector('#selection-state').textContent,
    subject: document.querySelector('#action-subject').textContent,
    orders: [...document.querySelectorAll('#selection button')].filter(button => button.id !== 'selection-close' && button.offsetParent !== null).map(button => button.textContent),
  }));
  observed.card = card;
  assert.ok(far.household.members.includes(card.id), `the card is about ${card.id}, not one of ${far.household.id}`);
  assert.ok(card.state.includes(farm.land.name), `the card does not say whose they are: ${card.state}`);
  assert.deepEqual(card.orders, [], `the Host was offered orders: ${card.orders.join(', ')}`);
  await host.screenshot({ path: 'docs/evidence/host-view-person.png' });
  ok(`the Host looks at ${card.name}: "${card.state}", with no order offered`);
  await host.locator('#selection-close').click();

  // A town that is not Gonzales, with its shops and the people keeping them.
  const towns = Object.values(world.map.sites).filter(site => site.kind === 'town' && site.id !== 'gonzales' && world.map.shops?.[site.id]?.length);
  const town = towns.find(site => Object.values(world.entities).some(e => e.resident && e.location?.siteId === site.id)) || towns[0];
  assert.ok(town, 'no town with shops');
  await host.locator('#host-goto').selectOption(town.id);
  await settle(host);
  const street = await host.evaluate(siteId => {
    const canvas = document.querySelector('#world-map');
    const inside = spot => spot && spot.x >= 0 && spot.y >= 0 && spot.x <= canvas.width && spot.y <= canvas.height;
    const here = window.__snapshot.world.others.filter(e => e.location?.siteId === siteId);
    return { camera: window.__camera, shops: window.__shopsDrawn?.[siteId] || 0, people: here.map(e => e.id), drawn: here.filter(e => inside(window.__drawnAt[e.id])).map(e => ({ id: e.id, name: e.name, keeper: Boolean(e.resident) })) };
  }, town.id);
  observed.town = { id: town.id, name: town.name, ...street };
  assert.ok(street.shops >= 1, `${town.name}'s shops were not drawn`);
  assert.ok(street.drawn.some(entry => entry.keeper), `nobody keeping a shop in ${town.name} was drawn: ${JSON.stringify(street)}`);
  await host.screenshot({ path: 'docs/evidence/host-view-town.png' });
  ok(`the Host went to ${town.name}: ${street.shops} shops and ${street.drawn.length} people drawn, keepers among them`);
  const studentTown = await student.evaluate(siteId => window.__snapshot.world.others.filter(e => e.location?.siteId === siteId).length, town.id);
  observed.studentSeesInTown = studentTown;

  // And back out to the whole class.
  await host.locator('#map-nav [data-view=follow]').click();
  await settle(host);
  observed.wholeClass = await host.evaluate(() => ({ camera: window.__camera, follow: document.querySelector('#map-nav [data-view=follow]').textContent, description: document.querySelector('#world-description').textContent, land: document.querySelector('#map-nav [data-view=home]').hidden }));
  assert.equal(observed.wholeClass.land, true, 'the Host was offered a Land button');
  await host.screenshot({ path: 'docs/evidence/host-view-class.png' });
  ok(`Whole class: ${observed.wholeClass.description}`);

  // At phone width the list of places fits and the page does not scroll sideways.
  await host.setViewportSize({ width: 400, height: 860 });
  await settle(host);
  const phone = await host.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, goto: document.querySelector('#host-goto').getBoundingClientRect().toJSON() }));
  observed.phone = phone;
  assert.ok(phone.overflow <= 1 && phone.goto.right <= 401 && phone.goto.width > 0, `at phone width: ${JSON.stringify(phone)}`);
  await host.screenshot({ path: 'docs/evidence/host-view-phone.png' });
  ok('at 400 pixels wide the list of places is on screen and the page does not scroll sideways');

  assert.deepEqual(errors, [], errors.join(' | '));
  ok('no page error on either page');
} finally {
  writeFileSync('docs/evidence/host-view-browser.json', `${JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    command: 'npm run test:host-view',
    scope: 'Same computer only: headless Chrome 1440x950, a server on 127.0.0.1. Not a physical LAN, a phone or a classroom.',
    class: { map: 'colonies', families: PLAYERS, ticksPlayedInProcess: AFTERNOON, joined: 1 },
    pass, errors, observed,
    screenshots: ['docs/evidence/host-view-farm.png', 'docs/evidence/host-view-person.png', 'docs/evidence/host-view-town.png', 'docs/evidence/host-view-class.png', 'docs/evidence/host-view-phone.png'],
  }, null, 2)}\n`);
  await browser.close();
  await app.close();
}
