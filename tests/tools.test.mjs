// Tools counted, and bought in town (owner, 2026-09-24: "players should be able to send someone to buy more rifles, hoes,
// tools in general"; docs/TOWNS.md §4c).
//
// Held here: a family owns a count of each tool and a class saved before opens with one of each it had; the shops sell every
// tool, the gunsmith a rifle, the store a hoe beside a worn one, all paid only from what the family has; each person holds one
// copy, so two rifles are two hunters or a man at the war and a hunter at home, and a refusal comes only when every copy is out
// and names them all; a second felling axe goes off the land while the first fells at home; the rifle is lost with a man killed
// or taken; and tools weigh on the errand's load.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld, taught } from './support/settled.mjs';
import { applyAction, errandFor, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { takeToWar, userOf } from '../sim/keeping.mjs';
import { TOWN_TRADES, RIFLE_COIN, RIFLE_FOOD } from '../sim/shops.mjs';
import { TOOL_LIFE, addTool, toolCount, wearsOf } from '../sim/tools.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

function running(seed) {
  const world = taught(createSettledWorld(seed, 5));
  world.status = 'running';
  world.households['hh-1'].played = true;
  return world;
}
const person = (world, name) => world.entities[`hh-1-${name}`];
const send = (world, who, errand, extra = {}) => applyAction(world, 'hh-1', { action: 'chore', entityId: who.id, chore: 'visit-shop', errand, ...extra });
const finish = (world, who, cap = 900) => { for (let t = 0; t < cap && who.chore; t++) stepWorld(world); assert.equal(who.chore, null, `${who.name} never finished`); };
/** Both holders named, in the family's own order: "A and B have both rifles." */
const both = (world, names, plural) => `${world.households['hh-1'].members.map(id => world.entities[id]).filter(one => names.includes(one)).map(one => one.name).join(' and ')} have both ${plural}.`;
const quote = (world, who, errand, mode) => errandFor(world, 'hh-1', who.id, errand, mode).quote;

test('a family counts its tools, and a class saved before opens with one of each it had and its one rifle', () => {
  const world = running('tools-old');
  const family = world.households['hh-1'];
  assert.equal(family.spares, undefined);
  assert.equal(family.rifles, undefined);
  assert.equal(toolCount(family, 'rifle'), 1, 'every family has always had its rifle');
  for (const tool of Object.keys(family.tools)) assert.equal(toolCount(family, tool), 1, `one ${tool}`);
  const dir = mkdtempSync(join(tmpdir(), 'texas-tools-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json'));
    assert.equal(opened.saveVersion, 3);
    assert.deepEqual(opened.world.households['hh-1'].tools, family.tools, 'an old save\'s tools were read another way');
    validateWorld(opened.world);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // And what could not have been bought is refused.
  family.spares = { cannon: [0] };
  assert.throws(() => validateWorld(world), /Invalid spare tools/);
  family.spares = { hoe: [-1] };
  assert.throws(() => validateWorld(world), /Invalid spare tools/);
  delete family.spares; family.rifles = 1.5;
  assert.throws(() => validateWorld(world), /Invalid rifle count/);
});

test('the shops sell another of every tool - a second axe, a rifle at the gunsmith - paid only from what the family has', () => {
  const world = running('tools-buy');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  family.resources = { ...family.resources, money: 10, food: 40 };
  const lines = errandFor(world, 'hh-1', buyer.id).lines;
  for (const id of ['blacksmith:tool-axe', 'blacksmith:tool-auger', 'blacksmith:tool-broadaxe', 'blacksmith:tool-froe', 'store:hoe', 'gunsmith:buy-rifle']) {
    const line = lines.find(one => one.id === id);
    assert.ok(line, `${id} is not sold`);
    assert.equal(line.why, undefined, `${id} was refused to a family that already has one: ${line.why}`);
  }
  assert.equal(lines.find(one => one.id === 'gunsmith:buy-rifle').price, `${RIFLE_COIN} reales or ${RIFLE_FOOD} food`);
  // Nothing on credit: ten reales will not buy a rifle and an axe for coin.
  assert.match(quote(world, buyer, [{ id: 'gunsmith:buy-rifle', n: 1, pay: 'coin' }, { id: 'blacksmith:tool-axe', n: 1, pay: 'coin' }]).why, /costs 3 reales, and there will not be that much coin/);
  send(world, buyer, [{ id: 'gunsmith:buy-rifle', n: 1, pay: 'coin' }, { id: 'blacksmith:tool-axe', n: 1, pay: 'food' }]);
  finish(world, buyer);
  assert.equal(toolCount(family, 'rifle'), 2);
  assert.equal(toolCount(family, 'axe'), 2);
  assert.equal(family.resources.money, 2);
  assert.ok(world.events.some(e => /bought a rifle from the gunsmith; the family has 2 rifles now/.test(e.text)));
  // A town with no gunsmith sells no rifle.
  for (const [town, trades] of Object.entries(TOWN_TRADES)) if (!trades.includes('gunsmith')) assert.ok(!trades.includes('gunsmith'), town);
  validateWorld(world);
});

test('a sound hoe bought beside a worn one goes into use, and the worn one waits to be mended', () => {
  const world = running('tools-hoe');
  const family = world.households['hh-1'], buyer = person(world, 'rosa'), mender = person(world, 'mateo');
  family.resources.money = 4;
  family.tools.hoe = TOOL_LIFE;
  assert.match(choreAvailability(world, family, mender, 'plant-field').why || '', /worn out/);
  send(world, buyer, [{ id: 'store:hoe', n: 1, pay: 'coin' }]);
  finish(world, buyer);
  assert.deepEqual(wearsOf(family, 'hoe'), [0, TOOL_LIFE], 'the new hoe is not the one in hand');
  assert.equal(family.resources.money, 2, 'a hoe is two reales, as it always was');
  assert.doesNotMatch(choreAvailability(world, family, mender, 'plant-field').why || '', /worn out/, 'planting waits although a sound hoe is in the house');
  assert.equal(choreAvailability(world, family, mender, 'mend-hoe').can, true, 'the worn hoe cannot be mended');
  applyAction(world, 'hh-1', { action: 'chore', entityId: mender.id, chore: 'mend-hoe' });
  finish(world, mender);
  assert.deepEqual(wearsOf(family, 'hoe'), [0, 0]);
  assert.equal(choreAvailability(world, family, mender, 'mend-hoe').why, 'Every hoe in the house is sound.');
  validateWorld(world);
});

test('each person holds one copy: two rifles are two hunters, and a third is told both are out', () => {
  const world = running('tools-two-rifles');
  const family = world.households['hh-1'], [a, b, c] = ['mateo', 'rosa', 'elena'].map(name => person(world, name));
  family.resources.powder = 10;
  addTool(family, 'rifle');
  applyAction(world, 'hh-1', { action: 'chore', entityId: a.id, chore: 'hunt-timber' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: b.id, chore: 'hunt-timber' });
  assert.equal(b.chore?.id, 'hunt-timber', 'a second rifle did not let a second hunter out');
  const why = both(world, [a, b], 'rifles');
  assert.equal(choreAvailability(world, family, c, 'hunt-timber').why, why);
  c.skills = { ...c.skills, hunting: 1 };
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: c.id, chore: 'practise-shooting' }), new RegExp(why.replace('.', '\\.')));
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: a.id });
  assert.equal(userOf(world, family, 'rifle', c), null, 'a rifle came home and was not free');
  validateWorld(world);
});

test('with two rifles a man can go to the war with one while another hunts at home; with one, the hunter keeps it', () => {
  const world = running('tools-war');
  const family = world.households['hh-1'], soldier = person(world, 'thomas'), hunter = person(world, 'mateo');
  family.resources.powder = 10;
  addTool(family, 'rifle');
  applyAction(world, 'hh-1', { action: 'chore', entityId: hunter.id, chore: 'hunt-timber' });
  soldier.location = { ...world.map.sites.gonzales, siteId: 'gonzales' }; // gone to the gathering
  assert.equal(takeToWar(world, family, soldier, 'gone with the volunteers to Gonzales'), null, 'the second rifle was not his to take');
  assert.deepEqual(soldier.carries.items, ['rifle']);
  assert.equal(choreAvailability(world, family, person(world, 'rosa'), 'practise-shooting').why, both(world, [hunter, soldier], 'rifles'));
  validateWorld(world);
});

test('a man killed or taken at the war loses the rifle he carried; with none left nobody hunts until another is bought', () => {
  const world = running('tools-death');
  const family = world.households['hh-1'], soldier = person(world, 'thomas'), hunter = person(world, 'mateo');
  family.resources = { ...family.resources, powder: 10, money: RIFLE_COIN };
  soldier.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  takeToWar(world, family, soldier, 'gone with the volunteers to Gonzales');
  soldier.health = { condition: 'dead' };
  stepWorld(world);
  assert.equal(toolCount(family, 'rifle'), 0, 'the rifle came home without the man who carried it');
  assert.ok(world.events.some(e => e.householdId === 'hh-1' && /The family's rifle was lost with .*There is no rifle in the house now/.test(e.text)), 'the loss is not said');
  assert.equal(choreAvailability(world, family, hunter, 'hunt-timber').why, 'There is no rifle in the house. The gunsmith sells them.');
  // And the next man to go goes without one.
  const next = person(world, 'rosa');
  next.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  assert.equal(takeToWar(world, family, next, 'gone with the volunteers to Gonzales'), 'none');
  // Bought again, and the family hunts.
  const buyer = person(world, 'elena');
  send(world, buyer, [{ id: 'gunsmith:buy-rifle', n: 1, pay: 'coin' }]);
  finish(world, buyer);
  assert.equal(toolCount(family, 'rifle'), 1);
  assert.equal(choreAvailability(world, family, hunter, 'hunt-timber').can, true);
  // A man who comes home brings his rifle home: nothing is lost.
  validateWorld(world);
});

test('a second felling axe goes off the land while the first fells at home', () => {
  const world = running('tools-axes');
  const family = world.households['hh-1'], feller = person(world, 'mateo'), carrier = person(world, 'rosa');
  const home = world.map.sites[family.homeSiteId];
  family.stock = true; // the whole grant is the land; drawn tight so the timber is off it
  family.grant = { minX: home.x - 0.02, minY: home.y - 0.02, maxX: home.x + 0.02, maxY: home.y + 0.02 };
  feller.chore = { id: 'fell-trees', step: 1, wait: 2, doing: 'felling a post oak', ground: { x: home.x, y: home.y }, with: ['axe'], shares: ['axe'] };
  feller.task = 'work';
  assert.equal(choreAvailability(world, family, carrier, 'make-furniture').why, `${feller.name} has the felling axe, felling a post oak.`);
  addTool(family, 'axe');
  applyAction(world, 'hh-1', { action: 'chore', entityId: carrier.id, chore: 'make-furniture', mode: 'foot' });
  assert.deepEqual(carrier.chore.with, ['axe'], 'the second axe did not go off the land');
  // Both out now: the third is told so.
  assert.equal(choreAvailability(world, family, person(world, 'thomas'), 'make-furniture').why, both(world, [carrier, feller], 'felling axes'));
});

test('tools weigh on the load, and the way of going still carries it', () => {
  const world = running('tools-load');
  const family = world.households['hh-1'], buyer = person(world, 'rosa');
  family.resources = { ...family.resources, money: 40, food: 60 };
  const list = [{ id: 'gunsmith:buy-rifle', n: 2, pay: 'coin' }, { id: 'blacksmith:tool-axe', n: 4, pay: 'coin' }];
  const q = quote(world, buyer, list);
  assert.deepEqual([q.load, q.mode], [6, 'horse']);
  assert.equal(quote(world, buyer, list, 'foot').why, 'On foot a person carries 5, and this is 6 loads.');
  assert.equal(quote(world, buyer, list, 'wagon').can, true);
});
