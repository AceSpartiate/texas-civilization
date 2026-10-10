// The short bar and "More" (owner, 2026-10-09, by multiple choice: "Short bar + More" - "Each bar shows the few works that matter now
// (field, house, food, town); butchering, carreta, furniture, range, wash and the like sit behind a 'More' button."). The rule is
// public/short-bar.js; docs/FAMILY_PANEL.md, amendment 2026-10-09. The browser proof is `npm run test:simple-ui`.
//
// Every test here was seen failing under the regression it guards before it was trusted (the injections are listed in HANDOFF.md,
// "The short bar and More").
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { choreCatalogue } from '../sim/chores.mjs';
import { suggestPlaces } from '../sim/suggest.mjs';
import { awake } from '../sim/childhood.mjs';
import { darkAt } from '../sim/directors.mjs';
import { barIcons, goalRoom, panelActions } from '../public/family-panel.js';
import { FIELD_JOBS, MORE_WORKS, fieldJob, moreLabel, moreMemory, namedKeys, shortBar } from '../public/short-bar.js';
import { TIPS } from '../public/tips.js';

const icon = (key, extra = {}) => ({ key, name: key, can: true, active: false, ...extra });
const keys = list => list.map(one => one.key);

test('the owner\'s works and the like wait behind "More"; the field\'s job now, the house, food, the town, the journeys and rest stay', () => {
  const bar = [icon('survey-plot'), icon('cut-lane'), icon('plant-field'), icon('fence-plot'), icon('visit-shop'), icon('make-furniture'), icon('buy-furniture'),
    icon('fell-trees'), icon('hunt-land'), icon('butcher-beef'), icon('butcher-hog'), icon('look-to-stock'), icon('take-small-game'), icon('fish-the-water'),
    icon('make-carreta', { can: false, goal: true }), icon('milk-cow'), icon('keep-house'), icon('work-garden'), icon('wash-clothes'),
    icon('travel-gonzales'), icon('visit'), icon('work'), icon('rest')];
  const { shown, more } = shortBar(bar);
  assert.deepEqual(keys(shown), ['plant-field', 'visit-shop', 'fell-trees', 'hunt-land', 'take-small-game', 'work-garden', 'travel-gonzales', 'rest']);
  for (const key of ['butcher-beef', 'butcher-hog', 'make-carreta', 'make-furniture', 'look-to-stock', 'wash-clothes']) assert.ok(keys(more).includes(key), `${key}, which the owner named, is on the short bar`);
  assert.equal(shown.length + more.length, bar.length, 'a work went missing from both');
  // The bar's own order, on both sides.
  assert.deepEqual(keys(more), keys(bar).filter(key => keys(more).includes(key)));
});

test('the field\'s job now is the one that matters first: a ripe crop, then bare ground, then staked ground, then new ground', () => {
  assert.equal(fieldJob([icon('survey-plot'), icon('plant-field'), icon('harvest-field')]), 'harvest-field');
  assert.equal(fieldJob([icon('survey-plot'), icon('clear-plot'), icon('plant-field')]), 'plant-field');
  assert.equal(fieldJob([icon('survey-plot'), icon('clear-plot')]), 'clear-plot');
  assert.equal(fieldJob([icon('survey-plot', { can: false }), icon('plant-field', { can: false, goal: true })]), 'plant-field', 'planting short of seed is still the field\'s job');
  const { shown, more } = shortBar([icon('survey-plot'), icon('clear-plot'), icon('plant-field'), icon('rest'), icon('cut-lane')]);
  assert.deepEqual(keys(shown), ['plant-field', 'rest']);
  assert.deepEqual(keys(more), ['survey-plot', 'clear-plot', 'cut-lane']);
  assert.deepEqual([...FIELD_JOBS], ['harvest-field', 'plant-field', 'clear-plot', 'survey-plot']);
});

test('a work the person is at, one that glows, and one the guided start points at always stand on the short bar', () => {
  const bar = [icon('rest'), icon('butcher-hog', { active: true }), icon('keep-house', { cue: true }), icon('fish-the-water'), icon('milk-cow'), icon('wash-clothes'), icon('cut-lane')];
  const { shown, more } = shortBar(bar, { glows: one => one.key === 'fish-the-water', pointed: 'milk-cow' });
  assert.deepEqual(keys(shown), ['rest', 'butcher-hog', 'keep-house', 'fish-the-water', 'milk-cow']);
  assert.deepEqual(keys(more), ['wash-clothes', 'cut-lane']);
});

test('a work a tip, a story card or a refusal names is never behind "More"', () => {
  const bar = [icon('rest', { name: 'Rest' }), icon('make-carreta', { name: 'Make a carreta', can: false, goal: true }), icon('butcher-hog', { name: 'Kill a hog' }),
    icon('wash-clothes', { name: 'Wash clothes' }), icon('cut-lane', { name: 'Cut the lane to the road' })];
  // The carreta's tip names "Make a carreta"; a refusal names "Kill a hog" without quotes; "resting" does not name Rest.
  const named = namedKeys(bar, [TIPS.cart, 'Not yet: Kill a hog first, the salt is in.', 'Somebody is resting.']);
  assert.deepEqual([...named].sort(), ['butcher-hog', 'make-carreta']);
  const { shown } = shortBar(bar, { named });
  assert.ok(keys(shown).includes('make-carreta') && keys(shown).includes('butcher-hog'), `named works hidden: ${keys(shown)}`);
  assert.ok(!namedKeys([icon('rest', { name: 'Rest' })], ['The sick are resting.']).has('rest'), '"resting" was read as naming Rest');
  assert.ok(namedKeys([icon('rest', { name: 'Rest' })], ['Press “Rest”.']).has('rest'));
  // Every work a tip names by its button stands on the bar while the tip does.
  const catalogue = choreCatalogue();
  for (const [id, words] of Object.entries(TIPS)) {
    const icons = catalogue.map(spec => icon(spec.id, { name: spec.name }));
    const named = namedKeys(icons, [words]);
    const { more } = shortBar(icons, { named });
    for (const key of named) assert.ok(!keys(more).includes(key), `the ${id} tip names ${key}, and it is behind "More"`);
  }
});

test('a goal greyed for want of a thing waits behind "More" unless it is the house or the field\'s job; the garden only to help waits too', () => {
  const bar = [icon('build-house', { can: false, goal: true }), icon('fell-trees', { can: false, goal: true }), icon('plant-field', { can: false, goal: true }),
    icon('work-garden', { help: true }), icon('rest'), icon('hunt-land')];
  const { shown, more } = shortBar(bar);
  assert.deepEqual(keys(shown), ['build-house', 'plant-field', 'rest', 'hunt-land']);
  assert.deepEqual(keys(more), ['fell-trees', 'work-garden']);
  // Her own garden stays.
  assert.ok(keys(shortBar([icon('work-garden'), icon('wash-clothes'), icon('milk-cow')]).shown).includes('work-garden'));
});

test('a small child keeps her own works and one play; a "More" for a single icon is not drawn', () => {
  const child = ['child-play', 'child-stick-horse', 'child-doll', 'child-cart', 'child-tag', 'child-hide', 'child-hoop', 'child-marbles', 'child-hens', 'child-kindling', 'child-eggs'].map(key => icon(key));
  const { shown, more } = shortBar(child);
  assert.deepEqual(keys(shown), ['child-play', 'child-hens', 'child-kindling', 'child-eggs']);
  assert.equal(more.length, 7);
  const one = shortBar([icon('rest'), icon('wash-clothes')]);
  assert.deepEqual(one.more, [], 'a "More" was made for one icon');
  assert.equal(one.shown.length, 2);
  for (const key of MORE_WORKS) assert.ok(!['child-play', 'child-hens', 'child-kindling', 'child-birds', 'child-eggs', 'child-water', 'child-mind', 'child-help', 'build-house', 'hunt-land', 'hunt-timber', 'visit-shop', 'travel-gonzales', 'travel-home', 'rest', 'stop-chore'].includes(key), `${key} matters now and is in the "More" list`);
});

test('"More" is remembered per person for the session, and a browser that keeps nothing simply forgets', () => {
  const kept = new Map();
  const storage = { getItem: key => kept.get(key) ?? null, setItem: (key, value) => kept.set(key, value), removeItem: key => kept.delete(key) };
  const memory = moreMemory(storage);
  assert.equal(memory.isOpen('a'), false);
  memory.set('a', true);
  assert.equal(memory.isOpen('a'), true);
  assert.equal(memory.isOpen('b'), false, '"More" opened for somebody else too');
  assert.equal(moreMemory(storage).isOpen('a'), true, 'a reload forgot "More" was open');
  memory.set('a', false);
  assert.equal(moreMemory(storage).isOpen('a'), false);
  const refusing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
  const forgetful = moreMemory(refusing);
  forgetful.set('a', true);
  assert.equal(forgetful.isOpen('a'), true, 'a page that cannot store lost its own state');
  assert.equal(moreMemory(null).isOpen('a'), false);
  assert.deepEqual(moreLabel(false, 7, 'Wiley'), { word: 'More', label: 'More works for Wiley: show 7 more on the bar.' });
  assert.equal(moreLabel(true, 7).word, 'Fewer');
});

/** The bar a page draws for one person (public/app.js `renderFamilyPanel`): the icons, what can be pressed and the goals, split. */
function drawnBar(world, view, id, main) {
  const catalogue = new Map(choreCatalogue().map(spec => [spec.id, spec]));
  const entity = view.entities.find(one => one.id === id);
  const homeId = view.household.homeSiteId;
  const homesteads = Object.values(world.map.sites).filter(site => site.kind === 'homestead' && site.id !== homeId).map(site => site.id);
  const icons = panelActions({ entity, offered: view.work?.[id] || [], catalogue, main, homeId, homesteads, atHome: entity.location?.siteId === homeId, settable: true, wants: view.household.wants });
  const pressable = one => one.active || one.can;
  const visible = barIcons(icons, pressable, goalRoom(icons.filter(pressable).length + 1, 1366 - 220));
  const { shown, more } = shortBar(visible);
  const kept = shown.filter(one => one.active || one.cue).length;
  return { all: visible.length, tiles: shown.length + (more.length ? 1 : 0), kept, shown: keys(shown) };
}

test('on the play-through\'s family, every grown person\'s bar is ten tiles or fewer, "More" among them, at arrival and with the site set', () => {
  // The play-through of 2026-10-09: seed playthrough-1, eight families on the colonies map with neighbours; the student's family rolled 5.
  const world = createGonzalesWorld('playthrough-1', 8, { map: 'colonies', neighbours: true });
  world.households['hh-1'].played = true;
  applyAction(world, 'hh-1', { action: 'roll-family' });
  assert.equal(world.households['hh-1'].members.filter(id => world.entities[id].kind === 'person').length, 5, 'the play-through rolled 5');
  world.status = 'running';
  for (let tick = 0; tick < 300 && !world.households['hh-1'].choosingSite; tick++) stepWorld(world);
  for (let tick = 0; tick < 300 && world.households['hh-1'].arriving; tick++) stepWorld(world);
  const measure = () => {
    const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
    const grown = view.entities.filter(one => one.kind === 'person' && view.household.members.includes(one.id) && one.age >= 10);
    assert.ok(grown.length >= 4, 'the play-through\'s family is not the one measured');
    return grown.map(person => ({ name: person.given || person.name, ...drawnBar(world, view, person.id, true) }));
  };
  const arrival = measure();
  const [first] = suggestPlaces(world, world.households['hh-1'], 'site');
  applyAction(world, 'hh-1', { action: 'choose-site', x: first.x, y: first.y });
  for (let tick = 0; tick < 100 && world.households['hh-1'].arriving; tick++) stepWorld(world);
  const settled = measure();
  for (const one of [...arrival, ...settled]) assert.ok(one.tiles - one.kept <= 10, `${one.name}: ${one.tiles} tiles (${one.shown.join(', ')})`);
  // What was there before: the whole bar.
  assert.ok(settled.some(one => one.all >= 18), `the measured bars were never long: ${settled.map(one => one.all).join(', ')}`);
  console.log(`short bar on the play-through's family: arrival ${arrival.map(one => `${one.name} ${one.all}->${one.tiles}`).join(', ')}; site set ${settled.map(one => `${one.name} ${one.all}->${one.tiles}`).join(', ')}`);
});

test('the server\'s hours of dark on the panel are the hours the children sleep (sim/childhood.mjs WAKING_HOURS)', () => {
  const world = createGonzalesWorld('dark-hours', 5);
  for (let minute = 0; minute < 48 * 60; minute += 20) {
    world.minute = minute;
    assert.equal(darkAt(world), !awake(world), `minute ${minute}: the panel's dark and the children's sleep disagree`);
  }
  world.minute = 0;
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.equal(view.dark ?? false, darkAt(world), 'the projection does not say the dark as the server reckons it');
});
