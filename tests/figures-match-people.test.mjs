// Everybody is drawn as who they are: a man as a man, a woman as a woman, a child as a child.
//
// Found 2026-09-24 on the Host's map: a far family nobody had joined, whose mother Antonia (`hh-9-elena`) was drawn as an old
// man and whose son Jonas as a woman - and a 2026-09-17 photograph showed the same. Households nobody joins keep the founding
// four (docs/FAMILY_CREATION.md §2), who have a role and no `sex` or `age`; the projections sent only the stated fields, and
// the page chose a figure for anybody without them by a hash of the id, from a pool of a woman, a man and a boy. Every town's
// keeper had no `sex` either, and fell to the same hash. Now the server sends what a glance tells (sim/town.mjs `seenAs`) and
// the page has one chooser (public/motion.js `figureOf`).
//
// The truth here is written out by hand rather than read from the code under test: what each figure is, from the art's own
// delivery notes; who each townsperson is, from the names as authored; how old each band is, from docs/FAMILY_CREATION.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, validateWorld } from '../sim/world.mjs';
import { familyRoll } from '../sim/family.mjs';
import { observedBy, seenAs } from '../sim/town.mjs';
import { figureOf, entityClip, seatFigure } from '../public/motion.js';

/** Every figure the page can draw a person on foot as: [sex, band]. A small child and an infant are one figure for both. */
const FIGURES = {
  rust: ['male', 'adult'], 'rust-woman': ['female', 'adult'], teal: ['female', 'adult'], indigo: ['female', 'adult'],
  elder: ['male', 'adult'], ochre: ['male', 'adult'], blue: ['male', 'youth'], 'blue-girl': ['female', 'youth'],
  girl: ['female', 'child'], boy: ['male', 'child'], smallchild: [null, 'small'], infant: [null, 'infant'],
};
/** The figure a clip is of: the longest figure name it begins with. */
const figureOfClip = id => Object.keys(FIGURES).filter(name => id.startsWith(`${name}-`)).sort((a, b) => b.length - a.length)[0];
/** The women among the townspeople, as their names were authored (sim/town.mjs, sim/shops.mjs). Everybody else is a man. */
const TOWNSWOMEN = new Set(['Marta Ibarra', 'Ruth Crandall', 'Adelaide Vance', 'Tomasa Villegas', 'Inés Cárdenas', 'Hannah Deering',
  'Lucía Benavides', 'Martha Cudworth', 'Prudence Lamb', 'Rebecca Tolliver', 'Charity Pruett', 'Nancy Blevins', 'Dolores Ybarbo', 'Eliza Crump']);
const ROLE = { father: ['male', 'adult'], mother: ['female', 'adult'], son: ['male', 'youth'], daughter: ['female', 'youth'] };
const bandOfAge = age => age < 2 ? 'infant' : age < 5 ? 'small' : age < 10 ? 'child' : age < 18 ? 'youth' : 'adult';

/** Who somebody truly is, from the world itself. */
function truth(entity) {
  if (entity.resident) return [TOWNSWOMEN.has(entity.name) ? 'female' : 'male', 'adult'];
  if (entity.sex) return [entity.sex, bandOfAge(entity.age)];
  return ROLE[entity.kin?.role] || [null, null];
}

/** Check one drawn person against who they are; returns the figure, for counting. */
function check(world, drawn, observed, where) {
  const entity = world.entities[drawn.id];
  const [sex, band] = truth(entity);
  assert.ok(sex && band, `${where}: ${entity.name} (${entity.id}) is somebody this test knows nothing of`);
  const figure = figureOf(drawn, observed);
  const [drawnSex, drawnBand] = FIGURES[figure] || [];
  assert.ok(drawnBand, `${where}: ${entity.name} (${entity.id}) is drawn as ${figure}, which is no person's figure`);
  const who = `${where}: ${entity.name} (${entity.id}, ${sex} ${band}${Number.isFinite(entity.age) ? `, ${entity.age}` : ''}${entity.kin?.role ? `, ${entity.kin.role}` : ''})`;
  if (drawnSex) assert.equal(drawnSex, sex, `${who} is drawn as ${figure}`);
  assert.equal(drawnBand, band, `${who} is drawn as ${figure}`);
  // The map draws the clip, not the name: whatever pose they are in, it is a figure of the right sex.
  const clip = entityClip(drawn, observed).id, clipFigure = figureOfClip(clip);
  assert.ok(clipFigure, `${who} is drawn with ${clip}, no person's clip`);
  if (FIGURES[clipFigure][0]) assert.equal(FIGURES[clipFigure][0], sex, `${who} is drawn on the map with ${clip}`);
  if (!observed) assert.equal(seatFigure(drawn), figure, `${who} is a different figure on a horse or the wagon`);
  // A glance, and nothing more: no hidden stat rides with it.
  assert.deepEqual(Object.keys(seenAs(entity)).filter(key => !['sex', 'band'].includes(key)), [], `${who}: seenAs says more than a glance`);
  return figure;
}

/** Everybody of every household at home, so that a person standing in a yard sees that household (`observedBy`). */
function everybodyHome(world) {
  for (const household of Object.values(world.households)) {
    const site = world.map.sites[household.homeSiteId];
    for (const id of household.members) Object.assign(world.entities[id], { location: { x: site.x, y: site.y, siteId: site.id }, travel: null });
  }
}

/** Every person each viewer draws: a student's own family, the people in every other yard and town, and the Host's map. */
function checkEveryView(world, seen) {
  everybodyHome(world);
  for (const household of Object.values(world.households)) {
    const own = projectWorld(world, household.id, undefined, { includeMap: false });
    for (const drawn of own.entities.filter(e => e.kind === 'person')) seen.add(check(world, drawn, false, `${household.id}'s own map`));
  }
  // One student walking into every other family's yard and every town.
  const walker = world.entities[world.households['hh-1'].members[0]], home = { ...walker.location };
  const places = [...Object.values(world.households).map(h => h.homeSiteId), ...new Set(Object.values(world.entities).filter(e => e.resident).map(e => e.location?.siteId))];
  for (const siteId of places.filter(Boolean)) {
    walker.location = { ...world.map.sites[siteId], siteId };
    for (const drawn of observedBy(world, 'hh-1').filter(e => !e.carrier)) seen.add(check(world, drawn, true, `hh-1 at ${siteId}`));
  }
  walker.location = home;
  // The Host: everybody, read only; the page marks every one of them observed (public/app.js `applySnapshot`).
  const host = projectWorld(world, null, 'host', { includeMap: false });
  const people = host.others.filter(e => e.kind === 'person' && !e.carrier);
  assert.ok(people.length > 0);
  for (const drawn of people) seen.add(check(world, { ...drawn, observed: true }, true, 'the Host’s map'));
  return people;
}

test('every person is drawn as their own sex and age, on a student’s map and the Host’s, for every family the die can make', () => {
  const seen = new Set(), rolls = new Set(), lone = new Set();
  let founding = 0;
  for (let n = 0; n < 40 && (rolls.size < 20 || lone.size < 2 || n < 6); n++) {
    const world = createGonzalesWorld(`figures-${n}`, 12);
    // Eight rolled, four left as the founding four: households nobody joins keep that shape.
    for (let i = 1; i <= 8; i++) {
      const household = world.households[`hh-${i}`];
      rolls.add(familyRoll(world.seed, household.id));
      rollFamily(world, household);
      if (household.members.length <= 3) lone.add(world.entities[household.members[0]].sex);
    }
    // A family of two parents and no children, which the 2026-09-14 table made on a six (docs/FAMILY_CREATION.md §2).
    if (n === 0) {
      const pair = Object.values(world.households).find(h => h.members.length >= 4 && h.id !== 'hh-1');
      for (const id of pair.members.slice(2)) delete world.entities[id];
      pair.members = pair.members.slice(0, 2);
      for (const id of pair.members) world.entities[id].kin.children = [];
    }
    founding += Object.values(world.entities).filter(e => e.kind === 'person' && e.kin && !e.sex).length;
    checkEveryView(world, seen);
  }
  assert.equal(rolls.size, 20, `every face of the die was rolled: ${[...rolls].sort((a, b) => a - b)}`);
  assert.deepEqual([...lone].sort(), ['female', 'male'], 'a lone father and a lone mother were both rolled');
  assert.ok(founding >= 16, 'families nobody joined kept the founding four');
  for (const figure of Object.keys(FIGURES)) assert.ok(seen.has(figure), `nobody was drawn as ${figure}: ${[...seen].sort()}`);
});

test('the founding four and every town’s keepers on the real land are drawn as who they are, and a class saved before still is', () => {
  const world = createGonzalesWorld('figures-colonies', 12, { map: 'colonies', neighbours: true });
  // The far family of the photograph: the class the Host's proof builds, where hh-9 is nobody's and kept the founding four.
  const proof = createGonzalesWorld('host-view-proof', 12, { map: 'colonies', neighbours: true });
  const overview = projectWorld(proof, null, 'host', { includeMap: false }).others;
  const figure = id => figureOf({ ...overview.find(e => e.id === id), observed: true }, true);
  assert.equal(proof.entities['hh-9-elena'].name, 'Antonia');
  assert.equal(FIGURES[figure('hh-9-elena')][0], 'female', `Antonia, the mother, is drawn as ${figure('hh-9-elena')}`);
  assert.equal(proof.entities['hh-9-mateo'].name, 'Jonas');
  assert.deepEqual(FIGURES[figure('hh-9-mateo')], ['male', 'youth'], `Jonas, the son, is drawn as ${figure('hh-9-mateo')}`);

  const keepers = Object.values(world.entities).filter(e => e.resident);
  assert.ok(keepers.length >= 40, `the towns have their keepers (${keepers.length})`);
  const drawn = checkEveryView(world, new Set());
  for (const keeper of keepers) assert.ok(drawn.some(e => e.id === keeper.id), `${keeper.name} is on the Host's map`);

  // A class saved before 2026-09-24: no townsperson had a sex, and nobody unrolled ever did. It opens as it is and draws the same.
  const before = new Map(projectWorld(world, null, 'host', { includeMap: false }).others.map(e => [e.id, figureOf({ ...e, observed: true }, true)]));
  const saved = JSON.parse(JSON.stringify(world));
  for (const entity of Object.values(saved.entities)) if (entity.resident) delete entity.sex;
  validateWorld(saved);
  for (const other of projectWorld(saved, null, 'host', { includeMap: false }).others.filter(e => e.kind === 'person' && !e.carrier)) {
    assert.equal(figureOf({ ...other, observed: true }, true), before.get(other.id), `${other.name} is drawn differently in a class saved before`);
  }
  checkEveryView(saved, new Set());
});

test('one chooser: every place the page draws a person asks figureOf, and nothing else picks a figure', () => {
  // The map (entityClip), a seat (seatedClip via seatFigure) and the family panel's portrait all go through public/motion.js
  // `figureOf`. A second composition of castVariant and childFigure is where a person could be one figure on the map and
  // another in their portrait.
  for (const file of ['app.js', 'family-panel.js', 'creation.js', 'interior.js', 'army-view.js', 'appearance.js']) {
    // Its code, not its comments: a comment may name the old chooser.
    const source = readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/\b(castVariant|childFigure|visualVariant)\(/.test(source), `public/${file} chooses a figure itself`);
  }
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /const figure = figureOf\(entity\), clip = `\$\{figure\}-idle-s`;/, 'the portrait is the figure the map draws');
});
