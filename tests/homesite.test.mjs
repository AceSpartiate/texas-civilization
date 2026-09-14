// Where the house stands, and the water: docs/LAND_GRANTS.md §8.2 and §8.3 step 4, docs/COLONIES.md §6 item 3.
//
// On the real land the wagon comes in to the surveyor's mark, and nothing is built until the family says where the house
// goes. The server refuses what is not the family's land, its line, the water and steep ground. Choosing moves the home,
// lays the lane from the road, puts the field beside the house and brings the wagon over. A house set back is further for
// everyone coming. Water carried from far off slows the heavy work until a well is dug. The invented country is untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, progressTravel, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { houseBuilt } from '../sim/houses.mjs';
import { siteFacts } from '../sim/ground.mjs';
import { chooseRefusal, LANE_TICKS_PER_MILE, laneRefusal, laneState, siteFactsFor, waterBurden, wellTicks } from '../sim/homesite.mjs';
import { findPath } from '../sim/geography.mjs';
import { paceOf } from '../sim/ground.mjs';
import { groundLeft } from '../sim/travel.mjs';
import { realTerrain } from '../sim/terrain-data.mjs';
import { createClassroom } from '../server/app.mjs';

const arrived = (seed, players = 5, options = {}) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies', ...options });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
};
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);
/** Every place on the holding a house may go, a grid of them, with what the ground says. */
const placesOn = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) };
    const facts = siteFacts(point, bounds);
    if (facts.can) places.push({ point, facts });
  }
  return places;
};

test("on the real land the wagon stops at the surveyor's mark, and nothing is built until the family says where the house stands", () => {
  const lobby = createGonzalesWorld('site-wait', 5, { map: 'colonies' });
  assert.equal(lobby.households['hh-1'].choosingSite, true, 'every family on the real land has a site to choose');
  assert.throws(() => applyAction(lobby, 'hh-1', { action: 'choose-site', x: 0, y: 0 }), /when it reaches its land/, 'not from the lobby');
  lobby.status = 'running';
  stepWorld(lobby);
  assert.throws(() => applyAction(lobby, 'hh-1', { action: 'choose-site', x: 0, y: 0 }), /has not reached the land yet/, 'nor from the road');

  const world = arrived('site-wait', 5);
  const household = world.households['hh-1'];
  assert.match(storyOf(world, 'hh-1').join(' '), /The wagon stands at the surveyor's mark\. Choose where the house will stand\./);
  const land = projectWorld(world, 'hh-1', 'student').land;
  assert.equal(land.choosingSite.can, true, 'the family is told it can choose');
  const principal = world.entities[household.principalId];
  for (const chore of ['plant-field', 'build-fence', 'clear-ground']) {
    assert.deepEqual(choreAvailability(world, household, principal, chore), { can: false, why: 'Choose where the house will stand first.' }, `${chore} waits`);
  }
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  assert.equal(choreAvailability(world, household, principal, 'build-house').why, 'Choose where the house will stand first.', 'and so does the house');
  validateWorld(world);
});

test("the server refuses a house site off the family's land, on its line, in the water or on steep ground, and says why", () => {
  const world = arrived('site-refuse', 5);
  const household = world.households['hh-1'];
  const { bounds } = holdingOf(world, household);
  assert.equal(siteFactsFor(world, household, { x: bounds.maxX + 1, y: bounds.minY }).why, 'That is not your land.');
  assert.equal(siteFactsFor(world, household, { x: bounds.minX + 0.01, y: (bounds.minY + bounds.maxY) / 2 }).why, 'That is on the line of your land. Set the house back from it.');
  assert.equal(siteFactsFor(world, household, { x: 'north', y: 2 }).why, 'Choose a place on the map.');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'choose-site', x: bounds.maxX + 1, y: bounds.minY }), /not your land/);
  // On the Guadalupe itself, and on a bluff measured steeper than a house is set on.
  const river = realTerrain().courses.find(course => course.name === 'Guadalupe River');
  const onRiver = river.points[Math.floor(river.points.length / 2)];
  assert.equal(siteFacts(onRiver, { minX: onRiver.x - 1, minY: onRiver.y - 1, maxX: onRiver.x + 1, maxY: onRiver.y + 1 }).why, 'That is in the water.');
  const bluff = { x: 8.3, y: 8.25 };
  assert.equal(siteFacts(bluff, { minX: 7, minY: 7, maxX: 9, maxY: 9 }).why, 'The ground there is too steep to set a house on.');
  assert.equal(household.choosingSite, true, 'and nothing refused changed anything');
  validateWorld(world);
});

test('choosing moves the house, lays the lane from the road over the ground, puts the field beside it and brings the wagon over', () => {
  const world = arrived('site-choose', 5);
  const household = world.households['hh-1'];
  const holding = holdingOf(world, household);
  const home = world.map.sites[household.homeSiteId];
  const mark = { x: home.x, y: home.y };
  const lane = Object.values(world.map.routes).find(route => route.to === household.homeSiteId);
  const road = lane.from;
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === 'hh-1');
  const fieldBefore = structuredClone(field.points);
  const place = placesOn(holding.bounds).map(entry => entry.point).sort((a, b) => Math.hypot(b.x - mark.x, b.y - mark.y) - Math.hypot(a.x - mark.x, a.y - mark.y))
    .find(point => siteFactsFor(world, household, point).can);
  assert.ok(place, 'there is somewhere on the land a house can go');
  const facts = siteFactsFor(world, household, place);
  applyAction(world, 'hh-1', { action: 'choose-site', x: place.x, y: place.y });

  assert.deepEqual({ x: home.x, y: home.y }, place, 'the home is where the family said');
  assert.deepEqual(household.mark, mark, "the surveyor's mark is remembered");
  assert.deepEqual(holdingOf(world, household).bounds, holding.bounds, 'and the land held does not move with the house');
  assert.equal(lane.from, road, 'the lane still leaves the same road');
  assert.deepEqual(lane.points.at(-1), place, 'and ends at the house');
  assert.equal(lane.ground.length, lane.points.length - 1, 'with its going');
  assert.ok(Math.abs(lane.points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - lane.points[i].x, p.y - lane.points[i].y), 0) - facts.laneMiles) < 0.01, 'as long as the family was told');
  field.points.forEach((point, i) => {
    assert.ok(Math.abs(point.x - (fieldBefore[i].x + place.x - mark.x)) < 0.011 && Math.abs(point.y - (fieldBefore[i].y + place.y - mark.y)) < 0.011, 'the field is beside the house');
  });
  assert.equal(world.map.revision, 1, 'every client is told the homesteads changed');
  assert.equal(household.site.laneMiles, facts.laneMiles);
  assert.equal(household.choosingSite, undefined);
  assert.match(storyOf(world, 'hh-1').at(-1), /^The family has chosen where the house will stand\. The house will stand /);
  assert.equal(household.arriving, true, 'the family is bringing the wagon over');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'choose-site', x: mark.x, y: mark.y }), /The house site is chosen\./, 'once');
  validateWorld(world);
  for (let tick = 0; tick < 100 && household.arriving; tick++) stepWorld(world);
  assert.equal(household.arriving, undefined);
  for (const id of [...household.members, ...household.property]) {
    const entity = world.entities[id];
    assert.equal(entity.location.siteId, household.homeSiteId);
    assert.ok(Math.hypot(entity.location.x - place.x, entity.location.y - place.y) < 0.5, `${id} is at the new site`);
  }
  assert.match(storyOf(world, 'hh-1').join(' '), /The wagon is drawn up where the house will stand/);
  assert.equal(storyOf(world, 'hh-1').filter(text => /has reached its own land/.test(text)).length, 1, 'said as one arrival, not two');
  const principal = world.entities[household.principalId];
  assert.equal(choreAvailability(world, household, principal, 'plant-field').can, true, 'the field can go in now');
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  assert.deepEqual(saved, world, 'and it all saves');
});

test('somebody already on the way home when the site is chosen goes on to where home is now', () => {
  const world = arrived('site-homeward', 5);
  const household = world.households['hh-1'];
  const walker = world.entities[household.principalId];
  beginTravel(world, walker, household.settlementId, null, 'visit');
  for (let tick = 0; tick < 300 && walker.travel; tick++) stepWorld(world);
  beginTravel(world, walker, household.homeSiteId, null, 'visit');
  stepWorld(world);
  assert.ok(walker.travel, 'on the road home');
  const mark = { ...world.map.sites[household.homeSiteId] };
  const place = placesOn(holdingOf(world, household).bounds).map(entry => entry.point).sort((a, b) => Math.hypot(b.x - mark.x, b.y - mark.y) - Math.hypot(a.x - mark.x, a.y - mark.y))
    .find(point => siteFactsFor(world, household, point).can);
  const before = walker.travel.distance;
  applyAction(world, 'hh-1', { action: 'choose-site', x: place.x, y: place.y });
  validateWorld(world);
  assert.deepEqual(walker.travel.points.at(-1), place, 'the road home now ends at the new site');
  assert.ok(walker.travel.distance > before, 'and is longer by the way from the mark');
  let last = { ...walker.location }, jump = 0;
  for (let tick = 0; tick < 300 && walker.travel; tick++) { stepWorld(world); jump = Math.max(jump, Math.hypot(walker.location.x - last.x, walker.location.y - last.y)); last = { ...walker.location }; }
  assert.equal(walker.location.siteId, household.homeSiteId);
  assert.deepEqual({ x: walker.location.x, y: walker.location.y }, place);
  assert.ok(jump <= 1.01, `and walked the rest of the way rather than appearing there (${jump.toFixed(2)} miles in a tick at most)`);
  assert.ok(Math.hypot(place.x - mark.x, place.y - mark.y) > 0.1, 'which is somewhere else than the mark');
});

test('a house set back from the road is further for anybody coming to it, by the lane and by its going', () => {
  const base = createGonzalesWorld('site-back', 5, { map: 'colonies' });
  applyAction(base, 'hh-1', { action: 'bring-stock', stock: true });
  base.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(base.households).some(household => household.arriving); tick++) stepWorld(base);
  const household = base.households['hh-1'];
  const lane = Object.values(base.map.routes).find(route => route.to === household.homeSiteId);
  const road = base.map.sites[lane.from];
  const places = placesOn(holdingOf(base, household).bounds, 9).map(entry => entry.point).sort((a, b) => Math.hypot(a.x - road.x, a.y - road.y) - Math.hypot(b.x - road.x, b.y - road.y));
  const near = places.find(point => siteFactsFor(base, household, point).can);
  const far = [...places].reverse().find(point => siteFactsFor(base, household, point).can);
  const ride = point => {
    const world = structuredClone(base);
    applyAction(world, 'hh-1', { action: 'choose-site', x: point.x, y: point.y });
    const town = world.map.sites[household.settlementId];
    const rider = { id: 'rider-test', name: 'Rider', kind: 'person', householdId: null, report: {}, location: { x: town.x, y: town.y, siteId: town.id }, travel: null, health: { condition: 'well' } };
    world.entities[rider.id] = rider;
    beginTravel(world, rider, household.homeSiteId, null, 'report');
    const miles = rider.travel.distance;
    let ticks = 0;
    while (rider.travel && ticks < 1000) { progressTravel(world, rider); ticks++; }
    return { miles, ticks, lane: world.households['hh-1'].site.laneMiles };
  };
  const close = ride(near), back = ride(far);
  assert.ok(back.lane > close.lane + 1, `the lane to the far site is longer (${close.lane} and ${back.lane} miles)`);
  assert.ok(back.miles > close.miles, 'so a rider from town has further to go');
  assert.ok(back.ticks > close.ticks, `and gets there later (${close.ticks} and ${back.ticks} ticks)`);
});

test('water carried from far off slows the heavy work until a well is dug, and a well is offered only where one is wanted', () => {
  const world = arrived('site-water', 5);
  const household = world.households['hh-1'];
  const places = placesOn(holdingOf(world, household).bounds);
  const dry = places.filter(entry => entry.facts.needsWell).sort((a, b) => (b.facts.waterMiles ?? 3) - (a.facts.waterMiles ?? 3)).map(entry => entry.point).find(point => siteFactsFor(world, household, point).can);
  assert.ok(dry, 'this family has somewhere on its land too far from running water');
  applyAction(world, 'hh-1', { action: 'choose-site', x: dry.x, y: dry.y });
  for (let tick = 0; tick < 100 && household.arriving; tick++) stepWorld(world);
  assert.ok(waterBurden(household) > 1, 'carrying water slows the heavy work');
  assert.equal(projectWorld(world, 'hh-1', 'student').land.site.burden, waterBurden(household), 'the family can see what the water costs it');
  const principal = world.entities[household.principalId];
  assert.ok(choresFor(world, household, principal).some(chore => chore.id === 'dig-well' && chore.can), 'a well is offered');

  // The same planting, with and without water to carry.
  const plantTicks = withWell => {
    const copy = structuredClone(world);
    if (withWell) copy.households['hh-1'].well = true;
    applyAction(copy, 'hh-1', { action: 'chore', entityId: principal.id, chore: 'plant-field' });
    let ticks = 0;
    while (copy.entities[principal.id].chore && ticks < 200) { stepWorld(copy); ticks++; }
    return ticks;
  };
  assert.ok(plantTicks(false) > plantTicks(true), 'planting takes longer while water is carried');

  const digging = structuredClone(world);
  const digger = digging.entities[principal.id];
  applyAction(digging, 'hh-1', { action: 'chore', entityId: digger.id, chore: 'dig-well' });
  let ticks = 0;
  while (digger.chore && ticks < 400) { stepWorld(digging); ticks++; }
  const dug = digging.households['hh-1'];
  assert.equal(dug.well, true, 'the well is dug');
  assert.ok(ticks >= wellTicks(dug) * 0.7, 'and it was a long piece of work');
  assert.match(storyOf(digging, 'hh-1').join(' '), /struck water/);
  assert.equal(waterBurden(dug), 1, 'nobody carries water now');
  assert.ok(!choresFor(digging, dug, digger).some(chore => chore.id === 'dig-well'), 'and no second well is offered');
  validateWorld(digging);

  // Some family in the class has land by running water; a house there carries nothing far.
  const wet = arrived('site-water', 5);
  const [wetHousehold, near] = Object.values(wet.households).map(each => [each, placesOn(holdingOf(wet, each).bounds).filter(entry => !entry.facts.needsWell).map(entry => entry.point).find(point => siteFactsFor(wet, each, point).can)]).find(([, point]) => point) || [];
  assert.ok(near, 'somewhere in the class is close enough to running water to carry it');
  applyAction(wet, wetHousehold.id, { action: 'choose-site', x: near.x, y: near.y });
  assert.equal(waterBurden(wetHousehold), 1, 'a house by running water carries nothing far');
  assert.ok(!choresFor(wet, wetHousehold, wet.entities[wetHousehold.principalId]).some(chore => chore.id === 'dig-well'), 'and is offered no well');
  const deeper = { site: { needsWell: true, aboveFeet: 40, waterMiles: 1 } }, shallower = { site: { needsWell: true, aboveFeet: 5, waterMiles: 1 } };
  assert.ok(wellTicks(deeper) > wellTicks(shallower), 'a house higher above the water digs deeper');
});

test('the lane is marked, not cut: the family cuts it from the house outward, and a cut lane is quicker going for the wagon', () => {
  const world = arrived('site-lane', 5);
  // A family whose chosen lane runs through some timber, so the cutting has something to take out.
  let household = null;
  for (const each of Object.values(world.households)) {
    const places = placesOn(holdingOf(world, each).bounds).map(entry => entry.point);
    for (const point of places) {
      const trial = structuredClone(world);
      try { applyAction(trial, each.id, { action: 'choose-site', x: point.x, y: point.y }); } catch { continue; }
      const lane = laneState(trial, trial.households[each.id]);
      if (lane.route.ground.some(([, timber]) => timber > 0.3) && lane.miles > 1) { applyAction(world, each.id, { action: 'choose-site', x: point.x, y: point.y }); household = world.households[each.id]; break; }
    }
    if (household) break;
  }
  assert.ok(household, 'some family can set its house where the lane crosses timber');
  for (let tick = 0; tick < 100 && household.arriving; tick++) stepWorld(world);
  const lane = laneState(world, household);
  assert.equal(lane.cut, 0, 'marked, not cut');
  assert.deepEqual(projectWorld(world, household.id, 'student').land.lane, { miles: lane.miles, cut: 0 }, 'and the family is told so');
  const going = () => { const path = findPath(world.map, lane.route.from, household.homeSiteId); return groundLeft({ points: path.points, pace: paceOf(path.points, path.ground, 'wagon'), distance: path.distance, progress: 0 }); };
  const uncut = going();

  const axe = household.tools.axe;
  delete household.tools.axe;
  assert.equal(laneRefusal(world, household), 'The lane runs through timber, and there is no felling axe in the house.');
  household.tools.axe = axe ?? 0;
  const [first, second] = household.members.map(id => world.entities[id]).filter(person => choresFor(world, household, person).some(chore => chore.id === 'cut-lane' && chore.can));
  assert.ok(first && second, 'two of the family can be set to it');
  applyAction(world, household.id, { action: 'chore', entityId: first.id, chore: 'cut-lane' });
  // A tick apart, so when the lane reaches the road one of them is in the middle of a spell.
  stepWorld(world);
  applyAction(world, household.id, { action: 'chore', entityId: second.id, chore: 'cut-lane' });
  for (let tick = 0; tick < 12; tick++) stepWorld(world);
  const part = laneState(world, household).cut;
  assert.ok(part > 0 && part < lane.miles, `a stretch is cut and not the whole (${part} of ${lane.miles} miles)`);
  assert.ok(going() < uncut, 'and the wagon already goes quicker over what is cut');
  let ticks = 12;
  while (laneState(world, household).left > 0 && ticks < 3000) { stepWorld(world); ticks++; }
  assert.equal(laneState(world, household).cut, lane.miles, 'the lane reaches the road');
  const fastest = lane.miles * LANE_TICKS_PER_MILE.open / 2 / 3;
  assert.ok(ticks > fastest, `and it was long work through timber (${ticks} ticks)`);
  assert.ok(going() < uncut * 0.97, `the whole lane is quicker going (${uncut.toFixed(2)} to ${going().toFixed(2)} miles of open road)`);
  assert.ok(going() >= lane.miles * 0.99, 'though a cut lane still has its climbs and creeks');
  assert.match(storyOf(world, household.id).join(' '), /The lane is cut all the way to the road/);
  const cutters = household.members.filter(id => world.entities[id].chore?.id === 'cut-lane');
  assert.equal(cutters.length, 2, 'both were still on it when it reached the road');
  assert.ok(cutters.every(id => /coming back up the lane/.test(world.entities[id].chore.doing)), 'and both leave off at once');
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  assert.ok(!household.members.some(id => world.entities[id].chore?.id === 'cut-lane'), 'and is done');
  const home = world.map.sites[household.homeSiteId];
  assert.ok([first, second].every(person => Math.hypot(person.location.x - home.x, person.location.y - home.y) < 0.1), 'back in the yard, not standing out on the lane');
  assert.ok(!choresFor(world, household, first).some(chore => chore.id === 'cut-lane'), 'and it is not offered again');
  validateWorld(world);
});

test("a new family's yard is a few rods across and its first field is ten acres beside the house, on either map", () => {
  for (const map of ['gonzales', 'colonies']) {
    const world = createGonzalesWorld(`yard-${map}`, 5, { map });
    for (const household of Object.values(world.households)) {
      const home = world.map.sites[household.homeSiteId];
      for (const id of [...household.members, ...household.property]) {
        const entity = world.entities[id], at = entity.travel?.settle || entity.location;
        assert.ok(Math.hypot(at.x - home.x, at.y - home.y) < 0.1, `${id} stands within a few rods of the house on the ${map} map`);
      }
      const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);
      const xs = field.points.map(point => point.x), ys = field.points.map(point => point.y);
      const acres = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) * 640;
      assert.ok(Math.abs(acres / 4 - 10) < 1, `the first patch is ten acres (${(acres / 4).toFixed(1)}) on the ${map} map`);
      assert.ok(Math.min(...xs) - home.x < 0.1 && Math.min(...ys) - home.y < 0.1, 'and it lies beside the house');
    }
  }
});

test('families nobody plays choose a site out of the bottom and near water, and build on it', () => {
  const world = arrived('site-neighbours', 5, { neighbours: true });
  for (let tick = 0; tick < 400; tick++) stepWorld(world);
  validateWorld(world);
  for (const household of Object.values(world.households)) {
    assert.ok(household.site, `${household.id} chose a site`);
    assert.ok(houseBuilt(household), `${household.id} built on it`);
    assert.equal(chooseRefusal(world, household), 'The house site is chosen.');
  }
});

test('a family asks the server about its own land only, and every browser is told when a homestead moves', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-site-'));
  const app = createClassroom({ seed: 'site-http', savePath: join(dir, 'save.json'), tickMs: 10, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Chooser', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const householdId = (await joined.json()).world.householdId;
    const ask = async (x, y) => (await (await fetch(`${base}/api/site?x=${x}&y=${y}`, { headers: { cookie } })).json()).facts;
    assert.equal((await ask(0, 0)).why, 'The family chooses where its house stands when it reaches its land.', 'not from the lobby');
    assert.equal((await fetch(`${base}/api/site?x=0&y=0`)).status, 401, 'and not for somebody who has not joined');
    // The teacher starts the class and it runs on the server's own clock; `app.state` is a copy, so it is read afresh each time.
    const hosted = await fetch(`${base}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) });
    const hostCookie = hosted.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(`${base}/api/command`, { method: 'POST', headers: { cookie: hostCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'site-host-start', action: 'start', anyway: true }) })).status, 200);
    for (let wait = 0; wait < 500 && app.state.world.households[householdId].arriving; wait++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(app.state.world.households[householdId].arriving, undefined, `the wagon came in (tick ${app.state.world.tick}, ${app.state.world.status})`);
    const world = app.state.world, household = world.households[householdId];
    const point = placesOn(holdingOf(world, household).bounds).map(entry => entry.point).find(each => siteFactsFor(world, household, each).can);
    const facts = await ask(point.x, point.y);
    assert.equal(facts.can, true, JSON.stringify(facts));
    assert.match(facts.words, /The lane to the road will be/);
    const sent = await fetch(`${base}/api/command`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'choose-site-0001', action: 'choose-site', x: point.x, y: point.y }) });
    assert.equal(sent.status, 200, 'the family sets its house there');
    const state = await (await fetch(`${base}/api/state`, { headers: { cookie } })).json();
    assert.equal(state.mapRevision, 1, 'every browser is told the homesteads changed');
    const homes = await (await fetch(`${base}/api/map/homes`, { headers: { cookie } })).json();
    assert.equal(homes.revision, 1);
    assert.deepEqual({ x: homes.sites[household.homeSiteId].x, y: homes.sites[household.homeSiteId].y }, point, 'the moved homestead is in the homes');
    assert.ok(Object.values(homes.routes).some(route => route.to === household.homeSiteId && route.points.length >= 2), 'with its lane');
    assert.ok(homes.fields.some(field => field.ownerHouseholdId === householdId), 'and its field');
    assert.equal((await ask(point.x, point.y)).why, 'The house site is chosen.');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
