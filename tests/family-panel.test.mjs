// The family panel: docs/FAMILY_PANEL.md (owner, 2026-09-15).
//
// The panel is page code, but the rules it holds are not a matter of layout, and each is one gate from that document: the
// order of the rows is the family's (father, mother, children oldest first), every action has an icon and one sentence,
// an icon glows exactly while the server's projection says the person is doing it, and the panel sends nothing the
// server does not already accept. public/family-panel.js imports nothing, so all of it is checked here against the real
// simulation. What only a browser can show - the hover, the camera, names saving themselves - is
// scripts/family-panel-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { CHORES, choreCatalogue } from '../sim/chores.mjs';
import {
  ORDER_NAMES, PANEL_ICONS, PANEL_SUMMARIES, activeKey, nameToSave, panelActions, panelOrder, rowReason,
} from '../public/family-panel.js';

const atlas = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url)), 'utf8'));
const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));
const person = (id, role, age) => ({ id, role, ...(age !== undefined && { age }) });

test('the rows are the family: father, mother, then the children oldest first, whatever order the household holds them in', () => {
  const people = [person('d9', 'daughter', 9), person('m', 'mother', 38), person('s15', 'son', 15), person('f', 'father', 41), person('s3', 'son', 3)];
  assert.deepEqual(panelOrder(['d9', 'm', 's15', 'f', 's3'], people), ['f', 'm', 's15', 'd9', 's3']);
  // A lone mother is first; there is no empty father row.
  assert.deepEqual(panelOrder(['c1', 'm', 'c2'], [person('c1', 'son', 4), person('m', 'mother', 30), person('c2', 'daughter', 11)]), ['m', 'c2', 'c1']);
  // A lone father, and a couple with no children.
  assert.deepEqual(panelOrder(['c', 'f'], [person('c', 'daughter', 2), person('f', 'father', 25)]), ['f', 'c']);
  assert.deepEqual(panelOrder(['m', 'f'], [person('m', 'mother', 44), person('f', 'father', 45)]), ['f', 'm']);
  // No ages (the founding four, a class saved before rolling): parents first, then the household's own order.
  assert.deepEqual(panelOrder(['hh-1-mateo', 'hh-1-rosa', 'hh-1-elena', 'hh-1-thomas'],
    [person('hh-1-mateo', 'son'), person('hh-1-rosa', 'daughter'), person('hh-1-elena', 'mother'), person('hh-1-thomas', 'father')]),
  ['hh-1-thomas', 'hh-1-elena', 'hh-1-mateo', 'hh-1-rosa']);
  // Nobody with a role is put below somebody without one.
  assert.deepEqual(panelOrder(['x', 's', 'f'], [person('x', null), person('s', 'son', 6), person('f', 'father', 30)]), ['f', 's', 'x']);
});

test('every rolled family, on every seed a test can afford, is ordered father, mother, children oldest first', () => {
  const shapes = new Set();
  for (let n = 0; n < 40; n++) {
    const world = createGonzalesWorld(`panel-order-${n}`, 6);
    for (const household of Object.values(world.households)) {
      rollFamily(world, household);
      const family = projectFamily(world, household.id);
      // The household's own order reversed, so the test proves the sort and not the order the roll happened to make.
      const order = panelOrder([...household.members].reverse(), family.people);
      const book = new Map(family.people.map(one => [one.id, one]));
      const roles = order.map(id => book.get(id).role);
      shapes.add(roles.filter(role => role === 'father' || role === 'mother').join('+'));
      const parents = roles.filter(role => role === 'father' || role === 'mother');
      assert.deepEqual(roles.slice(0, parents.length), parents.includes('father') && parents.includes('mother') ? ['father', 'mother'] : parents);
      const ages = order.slice(parents.length).map(id => book.get(id).age);
      assert.deepEqual(ages, [...ages].sort((a, b) => b - a), `children not oldest first: ${ages}`);
    }
  }
  // The seeds reach both parents, a lone father and a lone mother, or this test is proving less than it says.
  assert.ok(shapes.has('father+mother') && shapes.has('father') && shapes.has('mother'), `shapes seen: ${[...shapes]}`);
});

test('every chore and every order has an icon from the library and exactly one sentence', () => {
  const keys = [...Object.keys(CHORES), ...Object.keys(ORDER_NAMES)];
  for (const key of keys) {
    const sentence = PANEL_SUMMARIES[key];
    assert.ok(sentence, `${key} has no summary`);
    assert.match(sentence, /^[A-Z][^.!?]*[.!?]$/, `${key}'s summary is not one sentence: "${sentence}"`);
    const icon = PANEL_ICONS[key];
    assert.ok(icon && (icon.sprite || icon.glyph), `${key} has no icon`);
    if (icon.sprite) assert.ok(atlas.frames[icon.sprite], `${key}'s icon ${icon.sprite} is not in the atlas`);
  }
});

test('the glow is the projection: a chore glows from the order until the server says it is done, and then the principal rests', () => {
  const world = createSettledWorld('panel-glow', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.powder = 6;
  // Somebody the server will let practise: a steady shot already is refused it.
  const offered = projectWorld(world, 'hh-1', 'student').work;
  const worker = household.members.find(id => id !== household.principalId && offered[id].some(entry => entry.id === 'practise-shooting' && entry.can));
  assert.ok(worker, 'nobody in this family may practise, so this test would prove nothing');
  const seen = () => {
    const view = projectWorld(world, 'hh-1', 'student');
    const home = view.household.homeSiteId;
    const glowing = id => {
      const entity = view.entities.find(one => one.id === id);
      return panelActions({ entity, offered: view.work[id], catalogue, main: id === household.principalId, homeId: home, atHome: entity.location?.siteId === home })
        .filter(icon => icon.active).map(icon => icon.key);
    };
    return { worker: glowing(worker), principal: glowing(household.principalId) };
  };
  assert.deepEqual(seen().worker, [], 'something glows before anybody was set to anything');
  applyAction(world, 'hh-1', { action: 'chore', entityId: worker, chore: 'practise-shooting' });
  assert.deepEqual(seen().worker, ['practise-shooting'], 'the chore does not glow once it is ordered');
  let ticks = 0;
  while (world.entities[worker].chore && ticks++ < 200) {
    stepWorld(world);
    if (world.entities[worker].chore) assert.deepEqual(seen().worker, ['practise-shooting'], `the glow went out at tick ${world.tick}, before the practice was done`);
  }
  assert.ok(ticks < 200, 'the practice never finished');
  assert.deepEqual(seen().worker, [], 'still glowing after the server says the practice is done');
  // The principal's standing order is what the principal is doing; sent to town, the journey glows instead.
  applyAction(world, 'hh-1', { action: 'rest', entityId: household.principalId });
  assert.deepEqual(seen().principal, ['rest']);
  applyAction(world, 'hh-1', { action: 'travel', entityId: household.principalId, destination: 'gonzales' });
  assert.deepEqual(seen().principal, ['travel-gonzales']);
});

test('activeKey reads only what the server sent', () => {
  const homesteads = ['home-2'];
  assert.equal(activeKey({ chore: { id: 'fell-trees' }, travel: { to: 'home-1' } }, { homeId: 'home-1', main: true, homesteads }), 'fell-trees', 'a chore that walks out is the chore, not a journey');
  assert.equal(activeKey({ travel: { to: 'home-1' } }, { homeId: 'home-1', main: true, homesteads }), 'travel-home');
  assert.equal(activeKey({ travel: { to: 'home-2' } }, { homeId: 'home-1', main: true, homesteads }), 'visit');
  assert.equal(activeKey({ travel: { to: 'williams-camp' } }, { homeId: 'home-1', main: true, homesteads }), null, 'a march is no icon');
  assert.equal(activeKey({ task: 'work' }, { main: true }), 'work');
  assert.equal(activeKey({ task: 'work' }, { main: false }), null, 'only the main person has work and rest icons to glow');
  assert.equal(activeKey({ chore: { id: 'plant-field' }, health: { condition: 'dead' } }, { main: true }), null);
});

test('the panel sends only what the server already accepts, and only the principal is offered the principal’s orders', () => {
  const world = createSettledWorld('panel-orders', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  const view = projectWorld(world, 'hh-1', 'student');
  const home = view.household.homeSiteId;
  const iconsOf = id => {
    const entity = view.entities.find(one => one.id === id);
    return panelActions({ entity, offered: view.work[id], catalogue, main: id === household.principalId, homeId: home, homesteads: ['home-2'], atHome: entity.location?.siteId === home });
  };
  const principal = iconsOf(household.principalId).map(icon => icon.key);
  for (const key of ['travel-gonzales', 'travel-home', 'visit', 'work', 'rest']) assert.ok(principal.includes(key), `the principal has no ${key}`);
  assert.equal(iconsOf(household.principalId).find(icon => icon.key === 'travel-home').can, false, 'offered to go home while at home');
  const other = household.members.find(id => id !== household.principalId && !world.entities[id].age);
  assert.deepEqual(iconsOf(other).filter(icon => icon.kind === 'order').map(icon => icon.key), [], 'a non-principal is offered the principal’s orders');
  // Every icon that is open is an order the world takes, sent exactly as the page sends it.
  for (const id of [household.principalId, other]) {
    for (const icon of iconsOf(id).filter(one => one.can && !one.onMap && !one.visit)) {
      const trial = createSettledWorld('panel-orders', 5);
      trial.status = 'running';
      const input = icon.kind === 'chore' ? { action: 'chore', chore: icon.key }
        : icon.destination ? { action: 'travel', destination: icon.destination === 'home' ? home : icon.destination }
          : { action: icon.key };
      assert.doesNotThrow(() => applyAction(trial, 'hh-1', { ...input, entityId: id }), `${icon.key} for ${id} is refused by the server`);
    }
  }
  // A dimmed icon carries the server's reason, word for word.
  const refused = iconsOf(other).find(icon => !icon.can && icon.why);
  if (refused) assert.equal(refused.why, view.work[other].find(entry => entry.id === refused.key).why);
});

test('a row of one refusal says it once; a busy row keeps its glowing icon and its way to call off the work', () => {
  const young = panelActions({ entity: { id: 'c', age: 4 }, offered: [{ id: 'plant-field', can: false, why: 'Too young.' }, { id: 'hunt-timber', can: false, why: 'Too young.' }], catalogue });
  assert.equal(rowReason(young), 'Too young.');
  const busy = panelActions({ entity: { id: 'w', chore: { id: 'hunt-timber' } }, offered: [{ id: 'plant-field', can: false, why: 'W is already out.' }, { id: 'hunt-timber', can: false, why: 'W is already out.' }], catalogue });
  assert.equal(rowReason(busy), null);
  assert.deepEqual(busy.filter(icon => icon.active).map(icon => icon.key), ['hunt-timber']);
  assert.equal(busy.at(-1).key, 'stop-chore');
  // A chore the server has stopped listing is still shown while somebody is doing it.
  const gone = panelActions({ entity: { id: 'w', chore: { id: 'build-house' } }, offered: [], catalogue });
  assert.deepEqual(gone.map(icon => [icon.key, icon.active]), [['build-house', true], ['stop-chore', false]]);
  // A sound hoe is not a choice to show.
  assert.deepEqual(panelActions({ entity: { id: 'w' }, offered: [{ id: 'mend-hoe', can: false, why: 'The hoe is sound.' }], catalogue }), []);
});

test('a name is saved only when it changes and is not blank', () => {
  assert.equal(nameToSave('  Winnie  ', 'Rosa'), 'Winnie');
  assert.equal(nameToSave('Rosa', 'Rosa'), null);
  assert.equal(nameToSave(' Rosa ', 'Rosa'), null);
  assert.equal(nameToSave('   ', 'Rosa'), null);
  assert.equal(nameToSave('Mary  Ann', 'Rosa'), 'Mary Ann');
});
