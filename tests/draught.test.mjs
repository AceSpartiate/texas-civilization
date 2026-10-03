// What draws a vehicle, and how fast (owner, 2026-10-03, asked whether a mule should pull: "yes, but speed should adjust if it's too
// heavy. mules would be perfect for the carreta right though?"; sim/draught.mjs, docs/TOWNS.md §4h, `FIC-GONZ-1111`).
//
// Held here: the pull against the weight - the ox draws every vehicle at the pace it always had, laden or not; one mule draws the
// carreta quicker than the ox and a laden wagon slower; a pair of mules draws the laden wagon well; a family with a mule and no ox
// takes its wagon behind the mule at the mule's pace for the weight, slower home laden than out; the carreta goes behind the mule
// when the ox is home too, and the wagon behind the ox; the way's card names the team and gives both paces; on the family's journey
// together a mule in harness carries nobody and the train keeps the team's pace; and the page yokes the mule the server harnessed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, keepFoundingFamilies, modestMeans, taught } from './support/settled.mjs';
import { applyAction, goingFor, stepWorld, validateWorld } from '../sim/world.mjs';
import { addBeast, yardSpot } from '../sim/beasts.mjs';
import { userOf } from '../sim/keeping.mjs';
import { DRAUGHT, VEHICLES, drawPace, mph, vehicleTeams } from '../sim/draught.mjs';
import { setOut } from '../sim/company.mjs';
import { WAGON_SPEED } from '../sim/travel.mjs';
import { drawWays } from '../public/going.js';
import { carriedWithRider, wagonTeams } from '../public/motion.js';

function running(seed) {
  const world = modestMeans(taught(keepFoundingFamilies(createSettledWorld(seed, 5))));
  world.status = 'running';
  const family = world.households['hh-1'];
  family.played = true;
  family.resources = { ...family.resources, money: 60, food: 120 };
  return world;
}
const at = (world, beast) => { const site = world.map.sites[world.households['hh-1'].homeSiteId]; beast.location = { ...yardSpot(site, beast), siteId: site.id }; return beast; };
const muleAtHome = world => at(world, addBeast(world, world.households['hh-1'], 'mule', null));
const wagonWay = (world, who = 'hh-1-mateo') => goingFor(world, 'hh-1', who, { action: 'chore', chore: 'hunt-timber' }).ways.find(way => way.id === 'wagon');
const seed = { id: 'store:seed', n: 1, pay: 'coin' };

test('the pull against the weight: the ox as it always was, a mule quick with the carreta and slow with a laden wagon, a pair of mules well', () => {
  const kinds = { wagon: {}, cart: { cart: true }, carreta: { carreta: true } };
  // The ox draws every vehicle at its two miles an hour, laden or empty: the pace the game always had.
  for (const vehicle of Object.values(kinds)) for (const laden of [false, true]) assert.equal(drawPace(['ox'], { ...vehicle, laden }), WAGON_SPEED);
  // One mule: the carreta laden at two and a half (quicker than the ox), the wagon empty as quick, the laden wagon at one and a half.
  assert.equal(mph(drawPace(['mule'], { carreta: true, laden: true })), 2.5);
  assert.ok(drawPace(['mule'], { carreta: true, laden: true }) > WAGON_SPEED, 'the mule is not perfect for the carreta');
  assert.equal(mph(drawPace(['mule'], { laden: false })), 2.5);
  assert.equal(mph(drawPace(['mule'], { laden: true })), 1.5);
  assert.ok(drawPace(['mule'], { laden: true }) < WAGON_SPEED, 'one mule draws a laden wagon as well as an ox');
  assert.ok(drawPace(['mule'], { cart: true, laden: true }) < drawPace(['mule'], { carreta: true, laden: true }));
  // A pair of mules draws the laden wagon at their own walk, better than the one ox.
  assert.equal(mph(drawPace(['mule', 'mule'], { laden: true })), 2.5);
  // The three draught beasts are measured alike, and the vehicles too.
  assert.deepEqual(Object.keys(DRAUGHT), ['ox', 'mule', 'horse']);
  assert.ok(VEHICLES.wagon.weight > VEHICLES.cart.weight && VEHICLES.cart.weight > VEHICLES.carreta.weight);
});

test('a family with a mule and no ox takes its wagon behind the mule, quick out empty and slow home laden, and the card shows both', () => {
  const world = running('draught-mule-wagon');
  const mule = muleAtHome(world);
  world.entities['hh-1-animal'].condition = 'lost';
  const way = wagonWay(world);
  assert.equal(way.can, true, way.why);
  assert.equal(way.name, 'With the mule and wagon');
  assert.equal(way.mph, 2.5);
  assert.equal(way.ladenMph, 1.5);
  assert.equal(way.heavy, 'laden, 1.5 mph');
  // The card draws both paces as bars, laden the shorter.
  const fake = (tag, text = '', className = '') => ({ tag, textContent: text, className, dataset: {}, attributes: {}, children: [], style: { values: {}, setProperty(k, v) { this.values[k] = v; } }, append(...kids) { this.children.push(...kids); }, replaceChildren(...kids) { this.children = kids; }, setAttribute(k, v) { this.attributes[k] = v; } });
  const host = fake('div');
  drawWays(host, { ways: [way], quickest: null, chosen: 'wagon' }, fake);
  const bars = host.children[0].children[0].children.find(one => one.className === 'going-way-speed').children;
  assert.deepEqual(bars.map(bar => [bar.textContent, bar.style.values['--w']]), [['2.5 mph', '50%'], ['laden 1.5', '30%']]);
  const driver = world.entities['hh-1-thomas'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: driver.id, chore: 'visit-shop', errand: [seed], mode: 'wagon' });
  for (let t = 0; t < 30 && !driver.travel; t++) stepWorld(world);
  assert.equal(driver.travel?.mode, 'wagon');
  assert.equal(driver.travel.speed, drawPace(['mule'], {}), 'the mule did not draw the wagon out at its own pace');
  assert.equal(mule.travel?.draws, 'hh-1-wagon');
  assert.equal(mule.borrowedBy, driver.id);
  // Laden for home: the same mule, slower.
  for (let t = 0; t < 900 && !(driver.travel && world.entities['hh-1-wagon'].laden); t++) stepWorld(world);
  assert.ok(world.entities['hh-1-wagon'].laden, 'nothing came home in the wagon, so this proves nothing about the laden pace');
  assert.equal(driver.travel.speed, drawPace(['mule'], { laden: true }), 'the laden wagon came home at the empty pace');
  validateWorld(world);
});

test('the carreta goes behind the mule, the wagon behind the ox, and a pair of mules draws the wagon together', () => {
  const world = running('draught-carreta');
  const family = world.households['hh-1'];
  const mule = muleAtHome(world);
  // An ox and a mule at home: the wagon behind the ox, exactly as before, and the mule free to ride.
  const withOx = wagonWay(world);
  assert.equal(withOx.name, 'With the ox and wagon');
  assert.equal(withOx.ladenMph, undefined, 'the ox was slowed by the load');
  const driver = world.entities['hh-1-thomas'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: driver.id, chore: 'visit-shop', errand: [seed], mode: 'wagon' });
  for (let t = 0; t < 30 && !driver.travel; t++) stepWorld(world);
  assert.equal(driver.travel.speed, WAGON_SPEED);
  assert.equal(world.entities['hh-1-animal'].borrowedBy, driver.id);
  assert.equal(mule.borrowedBy, null, 'the mule went with the ox');
  // The carreta: the mule, and the ox stays home free.
  const other = running('draught-carreta-2');
  const mule2 = muleAtHome(other);
  other.entities['hh-1-wagon'].carreta = true;
  assert.equal(wagonWay(other).name, 'With the mule and carreta');
  const carter = other.entities['hh-1-thomas'];
  applyAction(other, 'hh-1', { action: 'chore', entityId: carter.id, chore: 'visit-shop', errand: [seed], mode: 'wagon' });
  for (let t = 0; t < 30 && !carter.travel; t++) stepWorld(other);
  assert.equal(mule2.borrowedBy, carter.id);
  assert.equal(userOf(other, other.households['hh-1'], 'ox', other.entities['hh-1-elena']), null, 'the ox was taken with the carreta');
  assert.ok(carter.travel.speed > WAGON_SPEED);
  // Two mules and no ox: both in harness to the wagon.
  const third = running('draught-pair');
  muleAtHome(third); muleAtHome(third);
  third.entities['hh-1-animal'].condition = 'lost';
  const pair = wagonWay(third);
  assert.equal(pair.name, 'With two mules and wagon');
  assert.equal(pair.ladenMph, undefined, 'a pair of mules was slowed by the laden wagon');
  validateWorld(world); validateWorld(other); validateWorld(third);
  void family;
});

test('on the family\'s journey together a mule in harness carries nobody, and the train keeps the team\'s pace', () => {
  const world = running('draught-company');
  world.meansRoll = 2;
  const mule = muleAtHome(world);
  const carreta = world.entities['hh-1-wagon'];
  carreta.carreta = true;
  const ox = world.entities['hh-1-animal'];
  const grown = world.households['hh-1'].members.map(id => world.entities[id]).filter(one => !Number.isFinite(one.age) || one.age >= 10);
  // The carreta and both beasts: the mule draws it, the ox walks along.
  const teams = vehicleTeams(world, [carreta, ox, mule], { laden: true });
  assert.deepEqual(teams.map(team => team.team.map(beast => beast.id)), [[mule.id]]);
  const base = () => ({ from: 'a', to: 'b', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], progress: 0, distance: 1, mode: 'wagon' });
  const speed = setOut([...grown, carreta, ox, mule], [carreta], base, [mule], world);
  assert.equal(speed, Math.min(drawPace(['mule'], { carreta: true, laden: true }), 1));
  assert.equal(mule.travel.draws, carreta.id);
  assert.ok(!grown.some(one => one.travel.rides === mule.id), 'somebody rode the mule in harness');
  // The page yokes the mule the server harnessed, and does not draw it again by itself.
  const driverId = grown.find(one => one.travel.drives === carreta.id)?.id;
  const seen = [...grown, carreta, ox, mule].map(one => ({ ...one, travel: { ...one.travel } }));
  const team = wagonTeams('hh-1', seen).find(one => one.wagon.id === carreta.id);
  assert.equal(team.ox?.id, mule.id, 'the page yoked the ox walking along, not the mule in harness');
  assert.equal(team.driverId, driverId);
  assert.equal(carriedWithRider(seen.find(one => one.id === mule.id), seen), true, 'the mule in harness is drawn a second time');
});
