// The farm at the end of the game (owner, 2026-09-29, answering the triage's D8; sim/farm-sale.mjs, docs/MONEY_AND_GLORY.md §5a):
// "if their house and farm wasn't burned and is intact then make selling it part of the end of the game cutscene. if there farm
// was burned then there's nothing to sell, but they get glory to compensate."
//
// Proved here: an intact farm sells for its land, its house, its cleared and fenced acres and its well at the stated prices, and
// the price is coin in the ending's sum, multiplied by glory like any real; a burned farm - by either army - sells for nothing and
// counts `BURNED_FARM_GLORY` glory, said as its own line of what earned glory; nothing is counted between periods, on the invented
// Gonzales country, or for a family nobody is left of; and the goods still in the house are not priced (only the farm was asked for).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { BURNED_FARM_GLORY, CLEARED_PLOT_REALES, FARM_ACRES_PER_REAL, FENCED_PLOT_REALES, GRAZING_ACRES_PER_REAL, HOUSE_REALES, WELL_REALES, farmAtEnd } from '../sim/farm-sale.mjs';
import { familyEnding, finalNumber, hostEnding } from '../sim/ending.mjs';
import { LABOR_ACRES } from '../sim/grants.mjs';

/** A class on the real land, ended, and one family with a house, a field of two plots (one fenced) and a well. */
function farm(seed = 'farm-sale') {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  world.status = 'ended';
  const household = world.households['hh-1'];
  const home = world.map.sites[household.homeSiteId];
  household.improvements = { ...household.improvements, cabin: 'sound' };
  household.house = { layout: 'round-log', work: 40 };
  household.plots = [
    { id: 'plot-1', x: home.x + 0.2, y: home.y, ground: 'prairie', state: 'cleared', fence: 'sound' },
    { id: 'plot-2', x: home.x - 0.2, y: home.y, ground: 'prairie', state: 'cleared' },
    { id: 'plot-3', x: home.x, y: home.y + 0.2, ground: 'prairie', state: 'staked' },
  ];
  household.well = true;
  household.resources.money = 12;
  world.glory = { 'hh-1': { total: 5, awards: { 'gonzales:x': { event: 'gonzales', personId: household.principalId, role: 'present', miles: 12, times: 1, points: 5, minute: 10 } } } };
  return { world, household };
}

test('an intact farm sells for its land, its house, its cleared and fenced acres and its well, and the price is coin glory multiplies', () => {
  const { world, household } = farm();
  const sale = farmAtEnd(world, household);
  assert.equal(sale.kind, 'sale');
  const land = Math.round(Math.round(LABOR_ACRES) / FARM_ACRES_PER_REAL);
  assert.deepEqual(sale.items.map(item => item.reales), [land, HOUSE_REALES['round-log'], 2 * CLEARED_PLOT_REALES + FENCED_PLOT_REALES, WELL_REALES]);
  assert.equal(sale.total, land + 16 + 25 + 5);
  assert.equal(HOUSE_REALES['round-log'], 16, 'a round-log cabin is not a real for every two and a half spells of its work');
  assert.match(sale.items[2].what, /^20 acres of cleared field, 10 of them fenced$/);
  // In the ending: coin in the house and the farm's price, multiplied by glory, and said as a sum a student can follow.
  const own = familyEnding(world, 'hh-1');
  assert.equal(own.money, 12, 'the coin in the house was changed by the sale');
  assert.equal(own.sale, sale.total);
  assert.equal(own.final, finalNumber(12 + sale.total, 5));
  assert.equal(own.final, (12 + sale.total) * 6);
  assert.match(own.sumSaid, new RegExp(`^The family had 12 reales, and sold the farm for ${sale.total} reales: 12 \\+ ${sale.total} = ${12 + sale.total} reales\\.`));
  assert.ok(own.sum.startsWith(`12 reales + ${sale.total} reales for the farm × (1 + 5 glory)`), own.sum);
  const row = hostEnding(world).families.find(one => one.householdId === 'hh-1');
  assert.equal(row.sale, sale.total);
  assert.equal(row.final, own.final);
  // A house raised part way counts the part raised; a league of grazing land at half the farm land's price.
  household.house = { layout: 'dog-run', work: 60 };
  assert.equal(farmAtEnd(world, household).items.find(item => /dog-run/.test(item.what)).reales, Math.floor(HOUSE_REALES['dog-run'] / 2));
  household.stock = true;
  const league = farmAtEnd(world, household).items[0];
  assert.match(league.what, /league and a labor/);
  const acres = Number(league.what.match(/([\d,]+) acres/)[1].replace(/,/g, ''));
  assert.equal(league.reales, Math.round(Math.round(LABOR_ACRES) / FARM_ACRES_PER_REAL + (acres - Math.round(LABOR_ACRES)) / GRAZING_ACRES_PER_REAL));
});

test('a burned farm has nothing to sell and counts glory instead, by whichever army burned it', () => {
  const { world, household } = farm('farm-sale-burned');
  for (const hand of ['mexican', 'texian']) {
    household.flight = { status: 'returning', orderedMinute: 100, burned: 400, ...(hand === 'mexican' && { burnedBy: { hand, name: 'Urrea\'s division' } }) };
    household.improvements = { ...household.improvements, cabin: 'ruined' };
    const reckoning = farmAtEnd(world, household);
    assert.equal(reckoning.kind, 'burned', `a farm burned by the ${hand} army was sold`);
    assert.equal(reckoning.glory, BURNED_FARM_GLORY);
    const own = familyEnding(world, 'hh-1');
    assert.equal(own.sale, 0);
    assert.equal(own.glory, 5 + BURNED_FARM_GLORY);
    assert.equal(own.final, finalNumber(12, 5 + BURNED_FARM_GLORY));
    const line = own.awards.at(-1);
    assert.equal(line.role, 'farm-burned');
    assert.equal(line.points, BURNED_FARM_GLORY);
    assert.match(line.text, /nothing left to sell/);
    assert.equal(line.worth, `A burned farm counts ${BURNED_FARM_GLORY} glory.`);
    assert.match(own.sumSaid, /The farm was burned, so there was nothing to sell/);
  }
  // Burned, whatever the house: a farm burned before any house stood is still a burned farm.
  household.improvements = { ...household.improvements, cabin: 'none' };
  assert.equal(farmAtEnd(world, household).kind, 'burned');
});

test('nothing is counted while the class runs, between periods, on the invented Gonzales country, or for a family nobody is left of; and no goods are priced', () => {
  const { world, household } = farm('farm-sale-none');
  // Goods and crops in the house are not the farm: the owner asked only for the farm to be sold.
  const before = farmAtEnd(world, household).total;
  household.resources.food = 90; household.resources.cotton = 12; household.resources.powder = 4;
  assert.equal(farmAtEnd(world, household).total, before, 'goods held at the end were priced');
  // Not while the class runs: the farm is sold at the end.
  world.status = 'running';
  assert.equal(farmAtEnd(world, household).kind, 'none', 'a farm was sold while the class ran');
  world.status = 'ended';
  // Between periods: coin and land only (owner, 2026-09-28).
  world.director.milestones = { ...(world.director.milestones || {}), 'bexar-end': world.minute + 1 };
  assert.equal(farmAtEnd(world, household).kind, 'none');
  delete world.director.milestones['bexar-end'];
  // Nobody left free to sell it.
  for (const id of household.members) world.entities[id].health = { condition: 'captured' };
  assert.equal(farmAtEnd(world, household).kind, 'none');
  assert.equal(familyEnding(world, 'hh-1').sale, 0);
  // The invented country ends at the fight of October 2, every farm as it was.
  const invented = createGonzalesWorld('farm-sale-invented', 5);
  invented.status = 'ended';
  assert.equal(farmAtEnd(invented, invented.households['hh-1']).kind, 'none');
  assert.equal(familyEnding(invented, 'hh-1').final, finalNumber(invented.households['hh-1'].resources.money, 0));
});
