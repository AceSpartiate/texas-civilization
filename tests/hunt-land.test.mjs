// Hunting on the family's own land: docs/WOODS_AND_BUILDING.md §5, build step 3.
//
// A student taps a place inside the family's line, is told what the ground is and how good it is for game, and sends one
// of the family. They walk out over their own land, never onto a road, work in close round the place, wait still - long on
// poor ground, short on good - and the hunt goes on as every hunt does. The ground decides the wait, never whether a deer
// comes: there is no chance in this work. Families nobody plays hunt the best ground within a mile of the house, on a
// class whose woods come from the land.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, choresFor } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { EDGE_GAME, huntFacts, huntingPlace, huntRefusal, stillTicks } from '../sim/hunting.mjs';
import { huntPlaces } from '../sim/neighbours.mjs';
import { STANDS } from '../sim/woods.mjs';
import { createClassroom } from '../server/app.mjs';

/** Every place on the holding worth trying, on a grid. */
const placesOn = (bounds, side = 9) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class with the families on their land and hh-1's house set, ready to hunt. */
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const bounds = holdingOf(world, household).bounds;
  // The house goes on the first place, nearest the middle of the holding, the server would let it stand.
  const site = placesOn(bounds, 7).sort((p, q) => Math.hypot(p.x - (bounds.minX + bounds.maxX) / 2, p.y - (bounds.minY + bounds.maxY) / 2) - Math.hypot(q.x - (bounds.minX + bounds.maxX) / 2, q.y - (bounds.minY + bounds.maxY) / 2)).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, 'hh-1', { action: 'choose-site', x: site.x, y: site.y });
  // And everybody brought over to it.
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  return { world, household, home: world.map.sites[household.homeSiteId], bounds: holdingOf(world, household).bounds };
}
/** Send somebody to hunt a place and follow it to the end, answering the shot by waiting. */
function huntAt(world, household, point) {
  const hunter = world.entities[household.principalId];
  const powder = household.resources.powder;
  applyAction(world, household.id, { action: 'hunt-land', entityId: hunter.id, x: point.x, y: point.y });
  const frames = [];
  for (let tick = 0; tick < 200 && hunter.chore; tick++) {
    if (hunter.chore.ask) applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'wait' });
    frames.push({ siteId: hunter.location.siteId, x: hunter.location.x, y: hunter.location.y, travel: Boolean(hunter.travel), doing: hunter.chore.doing, quarry: hunter.chore.quarry, still: hunter.chore.doing === 'waiting downwind, and still' });
    stepWorld(world);
    validateWorld(world);
  }
  assert.equal(hunter.chore, null, 'the hunt finished');
  return { hunter, frames, powder };
}

test('the family is told what the ground is and how good it is for game, and cannot hunt what is not its own', () => {
  const { world, household, home, bounds } = onTheLand('hunt-land-facts');
  const facts = placesOn(bounds).map(point => ({ point, facts: huntFacts(world, household, point) })).filter(entry => entry.facts.can);
  assert.ok(facts.length > 40);
  for (const { point, facts: f } of facts) {
    const place = huntingPlace(world, point);
    assert.equal(f.game, place.game);
    assert.equal(f.game, Math.min(1, Math.round(((STANDS[place.stand].game) + (place.edge ? EDGE_GAME : 0)) * 100) / 100));
    assert.match(f.words, new RegExp(`^${STANDS[place.stand].name}`, 'i'));
    assert.match(f.words, /of the house\.|beside the house\./);
    assert.match(f.words, /wait|Fair ground/);
  }
  // Timber at the edge is the best there is, open prairie the poorest.
  const best = facts.reduce((a, b) => b.facts.game > a.facts.game ? b : a), worst = facts.reduce((a, b) => b.facts.game < a.facts.game ? b : a);
  assert.ok(best.facts.game > worst.facts.game, `${best.facts.words} / ${worst.facts.words}`);
  assert.equal(huntRefusal(world, household, { x: bounds.maxX + 0.1, y: home.y }), 'That is not your land.');
  assert.equal(huntRefusal(world, household, { x: NaN, y: 0 }), 'Choose a place on your land to hunt.');
  const lobby = createGonzalesWorld('hunt-land-lobby', 5, { map: 'colonies' });
  assert.equal(huntRefusal(lobby, lobby.households['hh-1'], home), 'The family hunts its land once the class has begun.');
  // Not offered in the lobby, where every person would carry a refusal on every tick.
  assert.ok(!choresFor(lobby, lobby.households['hh-1'], lobby.entities[lobby.households['hh-1'].principalId]).some(chore => chore.id === 'hunt-land'));
  assert.throws(() => applyAction(world, 'hh-1', { action: 'hunt-land', entityId: household.principalId, x: bounds.maxX + 0.1, y: home.y }), /not your land/);
  assert.equal(world.entities[household.principalId].chore, null, 'a refused hunt writes nothing down');
});

test('a hunter walks out over the family land, works in close round the place, and waits longer on poor ground than on good', () => {
  const setup = onTheLand('hunt-land-walk');
  const places = placesOn(setup.bounds).map(point => ({ point, facts: huntFacts(setup.world, setup.household, point) })).filter(entry => entry.facts.can);
  const good = places.reduce((a, b) => b.facts.game > a.facts.game ? b : a), poor = places.reduce((a, b) => b.facts.game < a.facts.game ? b : a);
  assert.ok(good.facts.game >= 2 * poor.facts.game, `good ${good.facts.game}, poor ${poor.facts.game}`);
  const waits = {};
  for (const [label, place] of [['good', good], ['poor', poor]]) {
    const { world, household } = onTheLand('hunt-land-walk');
    const food = household.resources.food;
    const { frames, powder } = huntAt(world, household, place.point);
    // Never a journey: always at home, on the family's own land, and close round the place once there.
    assert.ok(frames.every(frame => frame.siteId === household.homeSiteId && !frame.travel), `${label}: the hunter took the road`);
    const out = frames.filter(frame => frame.still);
    assert.ok(out.length > 0, `${label}: the hunter never waited`);
    for (const frame of out) assert.ok(Math.hypot(frame.x - place.point.x, frame.y - place.point.y) < 0.06, `${label}: stalked ${Math.hypot(frame.x - place.point.x, frame.y - place.point.y)} miles off the place`);
    assert.ok(frames.some(frame => frame.quarry?.kind === 'deer'), `${label}: no deer`);
    assert.match(frames.find(frame => /working up through/.test(frame.doing)).doing, new RegExp(STANDS[place.facts.stand].name));
    assert.equal(household.resources.powder, powder - 1, 'one shot');
    assert.ok(household.resources.food > food, 'meat came home');
    assert.ok(world.events.some(event => event.householdId === household.id && event.text.includes(`fired in the ${STANDS[place.facts.stand].name}`)));
    waits[label] = out.length;
  }
  assert.ok(waits.poor > waits.good, `poor ground ${waits.poor} ticks still, good ${waits.good}`);
  assert.equal(stillTicks(1), 1);
  assert.equal(stillTicks(0.2), 5);
  assert.equal(stillTicks(0.01), 5, 'never longer than five times the wait');
});

test('a hunt on the land goes on foot whatever is asked, and a world cannot claim a hunt that is nowhere', () => {
  const { world, household, bounds } = onTheLand('hunt-land-foot');
  const point = placesOn(bounds).find(each => huntFacts(world, household, each).can);
  applyAction(world, 'hh-1', { action: 'hunt-land', entityId: household.principalId, x: point.x, y: point.y, mode: 'wagon' });
  const chore = world.entities[household.principalId].chore;
  assert.equal(chore.mode, undefined, 'on foot');
  assert.equal(chore.ground.game, huntingPlace(world, point).game);
  assert.equal(CHORES['hunt-land'].steps, CHORES['hunt-timber'].steps, 'the same stages as any hunt');
  // On the tick it costs as little as it can: no carry number (it goes on foot), and a refusal it shares with the hunt in
  // the timber said once.
  const listed = choresFor(world, household, world.entities[household.principalId]);
  const land = listed.find(entry => entry.id === 'hunt-land');
  assert.equal(land.haul, undefined);
  // One hunt on the panel, not two (owner, 2026-09-17): where the trees are counted one by one a family hunts a place of its
  // own choosing, and the hunt to the nearest timber is not offered at all.
  assert.equal(listed.find(entry => entry.id === 'hunt-timber'), undefined, 'both hunts are offered on the real land');
  validateWorld(world);
  for (const corrupt of [c => { c.ground.x = 'far'; }, c => { c.ground.game = 2; }, c => { delete c.ground.toward; }, c => { c.ground.cover = 7; }]) {
    const copy = structuredClone(world);
    corrupt(copy.entities[household.principalId].chore);
    assert.throws(() => validateWorld(copy), /Invalid hunting place/);
  }
});

test('families nobody plays hunt the best ground near the house on a class whose woods come from the land, and the timber elsewhere', () => {
  const { world, household, home, bounds } = onTheLand('hunt-land-foot');
  const places = huntPlaces(world, home, bounds);
  assert.ok(places.length > 0);
  const games = places.map(point => huntingPlace(world, point).game);
  assert.deepEqual(games, [...games].sort((a, b) => b - a), 'best ground first');
  assert.ok(places.every(point => Math.hypot(point.x - home.x, point.y - home.y) <= 1.001 && point.x >= bounds.minX && point.x <= bounds.maxX));
  // A class of neighbours, short of food: somebody goes out on the family's own land.
  const run = (options, seed) => {
    const class_ = createGonzalesWorld(seed, 5, { neighbours: true, ...options });
    class_.status = 'running';
    const seen = new Set();
    for (let tick = 0; tick < 250; tick++) {
      for (const each of Object.values(class_.households)) if (each.resources.food > 2) each.resources.food = 2;
      stepWorld(class_);
      for (const entity of Object.values(class_.entities)) if (entity.chore) seen.add(entity.chore.id);
    }
    validateWorld(class_);
    return seen;
  };
  const colonies = run({ map: 'colonies' }, 'hunt-land-class');
  assert.ok(colonies.has('hunt-land') && !colonies.has('hunt-timber'), [...colonies].join());
  const invented = run({}, 'hunt-timber-class');
  assert.ok(invented.has('hunt-timber') && !invented.has('hunt-land'), [...invented].join());
});

test('the family asks the server what a hunt on its land would find', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-hunt-land-'));
  const app = createClassroom({ seed: 'hunt-land-http', savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createSettledWorld(seed, count) });
  const base = `http://127.0.0.1:${await app.listen()}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Hunter', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const householdId = (await joined.json()).world.householdId;
    const home = app.state.world.map.sites[app.state.world.households[householdId].homeSiteId];
    const facts = (await (await fetch(`${base}/api/plot?x=${home.x + 0.1}&y=${home.y}&job=hunt-land`, { headers: { cookie } })).json()).facts;
    assert.deepEqual(facts, huntFacts(app.state.world, app.state.world.households[householdId], { x: home.x + 0.1, y: home.y }));
    assert.match(facts.why || facts.words, /class has begun|house/);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
