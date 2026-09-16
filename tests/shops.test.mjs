// The shops of the towns: docs/TOWNS.md, owner-decided 2026-09-16.
//
// Every settlement has its store, smith and carpenter; the larger towns and Gonzales have a street of
// trades. A family goes to town, chooses a shop, and at its counter buys or sells for coin or food.
// Proved here: the right keepers stand in the right towns; each trade does the one thing it says,
// through the hooks the game already reads; every refusal is said; and a class saved before any of
// this opens with none of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { advanceRoutine } from '../sim/routines.mjs';
import { KEEPERS, TOWN_TRADES, counterRefusal, TUNED_SHOTS, WAGON_SPEED_SHARE, keeperId } from '../sim/shops.mjs';
import { TOWN_LAYOUTS, townPoint } from '../sim/town-layouts.mjs';

const running = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const askOf = (world, household, person) => view(world, household.id).entities.find(e => e.id === person.id).chore?.ask;
const toAsk = (world, person) => { for (let t = 0; t < 400 && person.chore && !person.chore.ask; t++) stepWorld(world); };
const finish = (world, person) => { for (let t = 0; t < 600 && person.chore; t++) stepWorld(world); };
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);

/** Send a person to a shop and take one counter option; returns the counter as it was offered. */
function shop(world, household, person, trade, option, { stopAtCounter = false } = {}) {
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'visit-shop' });
  toAsk(world, person);
  const street = askOf(world, household, person);
  assert.ok(street.options.some(o => o.id === trade), `${trade} is not on the street: ${street.options.map(o => o.id)}`);
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: trade });
  toAsk(world, person);
  const counter = askOf(world, household, person);
  if (stopAtCounter) return counter;
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option });
  finish(world, person);
  return counter;
}

test('the right keepers stand in the right towns: a full street in Gonzales, a smith and no more at Victoria', () => {
  const invented = createGonzalesWorld('shops-keepers', 5);
  for (const trade of TOWN_TRADES.gonzales) {
    const keeper = trade === 'blacksmith' ? invented.entities['town-pike'] : invented.entities[keeperId('gonzales', trade)];
    assert.ok(keeper?.deals.includes(trade), `Gonzales has no ${trade}`);
    assert.equal(keeper.location.siteId, 'gonzales');
    if (trade !== 'blacksmith') assert.equal(keeper.name, KEEPERS.gonzales[trade]);
  }
  const colonies = createGonzalesWorld('shops-colonies', 30, { map: 'colonies' });
  const settled = new Set(Object.values(colonies.map.sites).filter(site => site.kind === 'homestead').map(site => site.settlementId));
  for (const [settlementId, trades] of Object.entries(TOWN_TRADES)) {
    if (settlementId === 'gonzales' || !settled.has(settlementId)) continue;
    for (const trade of trades) assert.ok(colonies.entities[keeperId(settlementId, trade)], `${settlementId} has no ${trade}`);
  }
  if (settled.has('victoria')) assert.equal(colonies.entities[keeperId('victoria', 'gunsmith')], undefined, 'Victoria was given a gunsmith it never had');
  validateWorld(invented); validateWorld(colonies);
  // They keep to their doors.
  for (let t = 0; t < 10; t++) stepWorld(invented);
  const smith = invented.entities[keeperId('gonzales', 'gunsmith')];
  assert.equal(smith.location.siteId, 'gonzales');
});

test('the blacksmith sells the tools a family left behind, once each, and says what each is for', () => {
  const world = running('shops-smith');
  const household = world.households['hh-1'];
  delete household.tools.auger;
  household.resources.money = 5;
  const person = world.entities[household.members[0]];
  const counter = shop(world, household, person, 'blacksmith', 'blacksmith:tool-auger:coin');
  assert.match(counter.options.find(o => o.id === 'blacksmith:tool-auger:coin').note, /bedstead/);
  assert.equal(household.tools.auger, 0);
  assert.equal(household.resources.money, 3);
  assert.ok(world.events.some(e => e.householdId === household.id && e.coin === -2), 'the coin is not in the account');
  const again = shop(world, household, person, 'blacksmith', 'leave', { stopAtCounter: true });
  assert.equal(again.options.find(o => o.id === 'blacksmith:tool-auger:coin').can, false);
  assert.match(again.options.find(o => o.id === 'blacksmith:tool-auger:coin').why, /already has an auger/);
  validateWorld(world);
});

test('the gunsmith puts the rifle in order: a hand without the knack makes the long shot, and it wears off', () => {
  const world = running('shops-gun');
  const household = world.households['hh-1'];
  household.resources.money = 4; household.resources.powder = 20;
  const hunter = world.entities[household.members[3]];
  hunter.skills = { ...hunter.skills, hunting: 1 };
  shop(world, household, world.entities[household.members[0]], 'gunsmith', 'gunsmith:rifle:coin');
  assert.equal(household.rifle.shots, TUNED_SHOTS);
  applyAction(world, household.id, { action: 'chore', entityId: hunter.id, chore: 'hunt-timber' });
  toAsk(world, hunter);
  assert.match(askOf(world, household, hunter).options.find(o => o.id === 'take').note, /rifle put in order/, 'the shot does not say the rifle is why it will connect');
  const hides = household.resources.hides ?? 0;
  applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'take' });
  finish(world, hunter);
  assert.ok(!storyOf(world, household.id).some(text => /missed/.test(text)), 'the long shot missed with the rifle in order');
  assert.equal(household.resources.hides, hides + 1, 'no hide came home from the deer');
  assert.equal(household.rifle.shots, TUNED_SHOTS - 1, 'the shot did not count against the rifle');
  household.rifle = { shots: 0 };
  validateWorld(world);
});

test('the doctor sets a tired person right, and has nothing to do for a well one', () => {
  const world = running('shops-doctor');
  const household = world.households['hh-1'];
  household.resources.money = 4;
  const person = world.entities[household.members[0]];
  person.health = { condition: 'tired' }; person.exertion = 40;
  // Seen at the counter; the walk home may tire them again, which is the road and not the doctor.
  const counter = shop(world, household, person, 'doctor', 'doctor:see:coin');
  assert.ok(storyOf(world, household.id).some(text => /rested and well again/.test(text)), 'the doctor did nothing for a tired person');
  person.health = { condition: 'well' }; person.exertion = 0;
  assert.ok(counter.options.find(o => o.id === 'doctor:see:coin').can);
  // A walk to town can tire anybody again, so the well case is asked of the counter's own rule.
  assert.match(counterRefusal(world, household, person, 'doctor:see:coin'), /is well/);
});

test('the tavern feeds somebody and the family hears what the town has heard', () => {
  const world = running('shops-tavern');
  const household = world.households['hh-1'];
  // News only the town has: public, and never carried to this family.
  establishTruth(world, { id: 'tavern-news', text: 'A schooner is in at Velasco with powder.', siteId: 'gonzales' });
  learn(world, 'public', 'tavern-news', { status: 'rumor', source: 'Town talk' });
  household.resources.money = 2;
  const person = world.entities[household.members[0]];
  person.exertion = 10;
  shop(world, household, person, 'tavern', 'tavern:meal:coin');
  assert.ok(world.knowledge.households[household.id]['tavern-news'], 'the family heard nothing at the tavern');
  assert.equal(world.knowledge.households[household.id]['tavern-news'].source, 'Talk at the tavern');
  assert.ok(storyOf(world, household.id).some(text => /heard the talk/.test(text)));
});

test('the tanner buys hides and sells shoes and a saddle, and shoes take weariness off the road', () => {
  const world = running('shops-tanner');
  const household = world.households['hh-1'];
  household.resources.hides = 3; household.resources.money = 0; household.resources.food = 30;
  const person = world.entities[household.members[0]];
  shop(world, household, person, 'tanner', 'tanner:hides:coin');
  assert.equal(household.resources.hides, 0);
  assert.equal(household.resources.money, 3);
  shop(world, household, person, 'tanner', 'tanner:shoes:food');
  assert.equal(household.gear.shoes, true);
  const walk = shod => {
    const w = running('shops-shoes');
    if (shod) w.households['hh-1'].gear = { shoes: true };
    const p = w.entities[w.households['hh-1'].members[0]];
    beginTravel(w, p, 'gonzales', null, 'visit', 'foot');
    for (let t = 0; t < 200 && p.travel; t++) stepWorld(w);
    return p.exertion;
  };
  assert.ok(walk(true) < walk(false), 'shoes changed nothing on the road');
  // No horse, no saddle.
  delete household.gear;
  household.property = household.property.filter(id => !id.endsWith('-horse'));
  const counter = shop(world, household, person, 'tanner', 'leave', { stopAtCounter: true });
  assert.match(counter.options.find(o => o.id === 'tanner:saddle:food').why, /no horse/);
});

test('the wheelwright, the mill and the weaver each do their one thing', () => {
  const speed = inOrder => {
    const world = running('shops-wagon');
    if (inOrder) world.households['hh-1'].gear = { wagon: true };
    const p = world.entities[world.households['hh-1'].members[0]];
    beginTravel(world, p, 'gonzales', null, 'visit', 'wagon');
    return p.travel.speed;
  };
  assert.ok(Math.abs(speed(true) - speed(false) * WAGON_SPEED_SHARE) < 1e-9, 'a wagon in order is no faster');

  // The same trip twice, once grinding and once not: the family eats the same on the road either way.
  const milled = grind => {
    const w = running('shops-mill');
    const h = w.households['hh-1'];
    h.resources.food = 20;
    shop(w, h, w.entities[h.members[0]], 'mill', grind ? 'mill:grind' : 'leave');
    return { food: h.resources.food, story: storyOf(w, h.id) };
  };
  const ground = milled(true), plain = milled(false);
  assert.ok(ground.food > plain.food + 0.5, `the meal did not go further: ${ground.food} against ${plain.food}`);
  assert.ok(ground.story.some(text => /ground at the mill/.test(text)));
  const world = running('shops-weave');
  const household = world.households['hh-1'];
  const person = world.entities[household.members[0]];

  household.resources.cotton = 2; household.resources.food = 10;
  shop(world, household, person, 'weaver', 'weaver:cotton:food');
  assert.equal(household.resources.cotton, 0);
  shop(world, household, person, 'weaver', 'weaver:blankets:food');
  assert.equal(household.gear.blankets, true);
  const rest = blankets => {
    const w = running('shops-blankets');
    const h = w.households['hh-1'];
    h.improvements = { ...h.improvements, cabin: 'none' };
    if (blankets) h.gear = { blankets: true };
    const p = w.entities[h.members[0]]; p.task = 'rest'; p.exertion = 30;
    advanceRoutine(w, 120);
    return p.exertion;
  };
  assert.ok(rest(true) < rest(false), 'blankets mended nothing by the wagon');
});

test('a class saved before the shops opens with none of it, and bought things that could not be are refused', () => {
  const world = running('shops-valid');
  for (const household of Object.values(world.households)) assert.equal(household.gear, undefined);
  validateWorld(world);
  world.households['hh-1'].gear = { cannon: true };
  assert.throws(() => validateWorld(world), /Invalid gear/);
  world.households['hh-1'].gear = { shoes: true };
  world.households['hh-1'].rifle = { shots: 99 };
  assert.throws(() => validateWorld(world), /Invalid rifle/);
  delete world.households['hh-1'].rifle;
  world.households['hh-1'].resources.hides = 1.5;
  assert.throws(() => validateWorld(world), /Invalid hides/);
  // A class with no keepers says so rather than sending anybody to an empty street.
  const old = running('shops-old');
  for (const entity of Object.values(old.entities)) if (entity.shopSpot || entity.deals?.includes('blacksmith')) delete old.entities[entity.id];
  const person = old.entities[old.households['hh-1'].members[0]];
  assert.throws(() => applyAction(old, 'hh-1', { action: 'chore', entityId: person.id, chore: 'visit-shop' }), /no shops/);
});

test('in Gonzales every keeper keeps one of the buildings already drawn, at its door, and no two share one', () => {
  // The drawing is the authority for where Gonzales's buildings stand: read it, not a copy of it.
  const art = readFileSync(new URL('../public/gonzales-art.js', import.meta.url), 'utf8');
  const homes = JSON.parse(art.match(/const homes=(\[[\s\S]*?\]\]);/)[1].replace(/(^|[^\d])\./g, '$10.'));
  const drawn = {
    'gonzales-store-art': art.match(/id:'gonzales-store-art'[^}]*x:(-?[.\d]+),y:(-?[.\d]+)/).slice(1).map(Number),
    'gonzales-iron-art': art.match(/id:'gonzales-iron-art'[^}]*x:(-?[.\d]+),y:(-?[.\d]+)/).slice(1).map(Number),
    ...Object.fromEntries(homes.map(([x, y], i) => [`gonzales-house-art-${i}`, [x, y]])),
  };
  const world = createGonzalesWorld('shops-places', 5);
  world.status = 'running';
  const town = world.map.sites.gonzales;
  const shops = world.map.shops.gonzales;
  assert.equal(shops.length, 2 + TOWN_TRADES.gonzales.length, 'a Gonzales shop has no building');
  assert.equal(new Set(shops.map(shop => shop.building)).size, shops.length, 'two keepers share a building');
  for (const shop of shops) {
    assert.ok(drawn[shop.building], `${shop.trade} keeps ${shop.building}, which Gonzales does not draw`);
    assert.deepEqual([shop.x, shop.y], drawn[shop.building], `${shop.trade} is not where ${shop.building} is drawn`);
    const keeper = world.entities[shop.keeperId];
    const off = Math.hypot(keeper.location.x - (town.x + shop.x), keeper.location.y - (town.y + shop.y));
    assert.ok(off < 0.02, `${keeper.name} stands ${off.toFixed(3)} miles from ${shop.label}`);
  }
  assert.equal(shops.find(shop => shop.trade === 'store').keeperId, 'town-ibarra');
  assert.equal(shops.find(shop => shop.trade === 'blacksmith').keeperId, 'town-pike');
  // They step out and back, never away from the door.
  for (let t = 0; t < 30; t++) {
    stepWorld(world);
    for (const shop of shops) {
      const keeper = world.entities[shop.keeperId];
      assert.ok(Math.hypot(keeper.location.x - (town.x + shop.x), keeper.location.y - (town.y + shop.y)) < 0.03, `${keeper.name} wandered from the door`);
    }
  }
});

test('in every new town each keeper has a building of their own, drawn from the map', () => {
  const world = createGonzalesWorld('shops-new-places', 30, { map: 'colonies' });
  let towns = 0;
  for (const [settlementId, shops] of Object.entries(world.map.shops)) {
    if (settlementId === 'gonzales') continue;
    towns++;
    const site = world.map.sites[settlementId];
    assert.equal(new Set(shops.map(shop => `${shop.x},${shop.y}`)).size, shops.length, `${settlementId} has two shops in one place`);
    if (TOWN_LAYOUTS[settlementId]) assert.equal(new Set(shops.map(shop => shop.building)).size, shops.length, `two keepers share a building in ${settlementId}`);
    assert.ok(shops.some(shop => shop.trade === 'store') && shops.some(shop => shop.trade === 'carpenter'), `${settlementId} lacks its store or carpenter`);
    for (const shop of shops) {
      // A town with a layout (sim/town-layouts.mjs) gives each keeper one of its drawn buildings; any other gets a sprite of its own.
      assert.ok((shop.building || shop.sprite) && shop.label, `${settlementId}'s ${shop.trade} has nothing to be drawn as`);
      if (TOWN_LAYOUTS[settlementId]) {
        const building = TOWN_LAYOUTS[settlementId].buildings.find(b => b.id === shop.building);
        assert.ok(building, `${settlementId}'s ${shop.trade} keeps no building the town draws`);
        assert.deepEqual([shop.x, shop.y], [townPoint(TOWN_LAYOUTS[settlementId], building).x, townPoint(TOWN_LAYOUTS[settlementId], building).y], `${settlementId}'s ${shop.trade} is not where its building is drawn`);
      }
      const keeper = world.entities[shop.keeperId];
      assert.ok(Math.hypot(keeper.location.x - (site.x + shop.x), keeper.location.y - (site.y + shop.y)) < 0.02, `${keeper.name} is not at their door`);
    }
  }
  assert.ok(towns >= 3, `only ${towns} new towns had shops`);
  validateWorld(world);
});
