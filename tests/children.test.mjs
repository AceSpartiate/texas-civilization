// What a family's children can be set to (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21).
//
// Each test is named for a **rule**, not for an event: the age ladder, the bar that switches without stopping anybody else,
// the two works that produce and the four that do not, and the line an infant's row still has. Every one of them was proved
// by injection - `node scripts/children-injections.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { choresFor } from '../sim/chores.mjs';
import { lessonRefusal } from '../sim/lesson.mjs';
import { mindingBaby } from '../sim/furniture.mjs';
import { CHILD_WORKS, CHILD_WORK_FROM, PLAYS, childWorks, childrenInvalid, eggsFor } from '../sim/children.mjs';
import { SENT_FROM_AGE } from '../sim/family.mjs';
import { settle, taught } from './support/settled.mjs';

/** A class already on its land, one family played, and that family's people to hand. */
function family(seed, { children = 1 } = {}) {
  const world = taught(settle(createGonzalesWorld(seed, 8, { map: 'colonies' })));
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const people = household => household.members.map(id => world.entities[id]);
  const household = Object.values(world.households).find(h => people(h).filter(p => ['son', 'daughter'].includes(p.kin?.role)).length >= children
    && people(h).some(p => p.kin?.role === 'father') && people(h).some(p => p.kin?.role === 'mother'));
  assert.ok(household, `no family in ${seed} with ${children} children and both parents`);
  household.played = true;
  world.status = 'running';
  return { world, household, people: () => people(household) };
}
/** The family's children, oldest first, with their ages set to exactly what this test is about. */
function aged(world, household, ...ages) {
  const kids = household.members.map(id => world.entities[id]).filter(p => ['son', 'daughter'].includes(p.kin?.role));
  ages.forEach((age, at) => { if (kids[at]) kids[at].age = age; });
  return kids;
}
const of = (world, household, entity) => choresFor(world, household, entity);
const can = list => list.filter(entry => entry.can).map(entry => entry.id);
const run = (world, entity, limit = 80) => { for (let t = 0; t < limit && entity.chore; t++) stepWorld(world); };
/** A crop standing in the field, which is what the bird-scaring wants to exist before it is offered. */
const planted = (world, household) => { household.field = { ...household.field, state: 'planted', changedTick: world.tick }; };

/**
 * What one of the children's works actually adds to the family's store.
 *
 * The family's resources when the work is done, less the same family's resources after exactly as many ticks with the child
 * idle. A household eats while the clock runs (sim/routines.mjs), so a bare before-and-after measures the family's dinner as
 * well as the child's morning - which is how the first draft of this test read a quarter of a food of supper as the eggs.
 */
function adds(seed, choreId, age) {
  const build = () => {
    const made = family(seed, { children: 2 });
    const [kid] = aged(made.world, made.household, age, 1);
    planted(made.world, made.household);
    return { ...made, kid };
  };
  const doing = build();
  applyAction(doing.world, doing.household.id, { action: 'chore', entityId: doing.kid.id, chore: choreId });
  let ticks = 0;
  for (; ticks < 80 && doing.kid.chore; ticks++) stepWorld(doing.world);
  assert.equal(doing.kid.chore ?? null, null, `${choreId} never finished`);
  const idle = build();
  // The child stands idle rather than working. `aged` rewrites the family's *oldest* child to this age, and in both seeds
  // used here that child was founded sixteen or seventeen - a grown hand, on 'work' (sim/world.mjs `addPerson`). Left so,
  // the control family is fed by a "nine-year-old" who was founded an adult, and the difference lands on the children's
  // works as though they had cost the family its supper. A child founded under ten starts at rest and cannot be set to
  // work, so in a real class this line is what is true already (`FIC-GONZ-313`, measured 2026-09-21).
  idle.kid.task = 'rest';
  for (let t = 0; t < ticks; t++) stepWorld(idle.world);
  const delta = {};
  for (const key of new Set([...Object.keys(doing.household.resources), ...Object.keys(idle.household.resources)])) {
    const moved = Math.round(((doing.household.resources[key] ?? 0) - (idle.household.resources[key] ?? 0)) * 10000) / 10000;
    if (moved !== 0) delta[key] = moved;
  }
  return { delta, ticks, ...doing };
}

test('the rule: the age ladder decides which of the children’s works a person has, and nobody else has any', () => {
  // Nothing at all under two, play from two, the three that want only hands and eyes from five, the pail and the baby from
  // seven, and the whole band closed at ten, where the family's own work begins (`SENT_FROM_AGE`).
  const at = age => childWorks({ kind: 'person', age });
  assert.deepEqual(at(0), []);
  assert.deepEqual(at(1), []);
  assert.deepEqual(at(2), ['child-play']);
  assert.deepEqual(at(4), ['child-play']);
  assert.deepEqual(at(5), ['child-play', 'child-kindling', 'child-birds', 'child-eggs']);
  assert.deepEqual(at(6), ['child-play', 'child-kindling', 'child-birds', 'child-eggs']);
  assert.deepEqual(at(7), [...CHILD_WORKS]);
  assert.deepEqual(at(9), [...CHILD_WORKS]);
  assert.deepEqual(at(SENT_FROM_AGE), [], 'a person of ten still has the children’s works');
  assert.deepEqual(at(17), []);
  assert.deepEqual(at(40), []);
  // Somebody the game knows no age for - the founding four's children - is passed over here exactly as `tooYoung` passes
  // over them, so no class saved before ages existed gains or loses a thing.
  assert.deepEqual(childWorks({ kind: 'person' }), []);
  assert.deepEqual(childWorks({ kind: 'animal', age: 5 }), []);
  // The ladder has exactly two thresholds above play, and every work is on it.
  assert.deepEqual(Object.keys(CHILD_WORK_FROM).sort(), [...CHILD_WORKS].sort());
  assert.deepEqual([...new Set(Object.values(CHILD_WORK_FROM))].sort((a, b) => a - b), [2, 5, 7]);
});

test('the rule: a child of eight has a bar of their own and no adult work on it; an infant has none and keeps the one reason that says why', () => {
  const { world, household } = family('children-bar', { children: 2 });
  const [kid, baby] = aged(world, household, 8, 1);
  const kidList = of(world, household, kid);
  // Only the children's works are even offered, so the row is not thirty dimmed pictures saying "too young".
  assert.ok(kidList.length > 0 && kidList.every(entry => entry.id.startsWith('child-')), `an adult work reached an eight-year-old: ${kidList.map(e => e.id).join(',')}`);
  // Play, kindling, the eggs and the pail are hers now; minding is offered because there is a smaller one at home.
  assert.ok(can(kidList).includes('child-play'), 'play was refused an eight-year-old at home');
  assert.ok(can(kidList).includes('child-eggs'));
  assert.ok(can(kidList).includes('child-mind'), 'minding was not offered with a baby in the house');
  // The infant's row is unchanged from before this existed: adult works, every one refused for the same reason, which is
  // what `rowReason` collapses into the one line a separate hand is wording (public/family-panel.js).
  const babyList = of(world, household, baby);
  assert.ok(babyList.length > 5, 'an infant’s row went empty, and an empty row has no reason to show');
  assert.ok(babyList.every(entry => !entry.can), 'an infant could be set to work');
  assert.deepEqual([...new Set(babyList.map(entry => entry.why))].length, 1, 'an infant’s refusals no longer agree, so the row cannot say one reason');
  assert.match(babyList[0].why, /too young to be sent/);
});

test('the rule: the server holds the age gate, not the page - an order for a work above a child’s age is refused in words', () => {
  // The client greys what the server did not offer, but the refusal is the server's, as every other rule in this codebase
  // is. So the order is sent for works that are not on the row at all, and each is refused by name and by reason.
  const { world, household } = family('children-gate', { children: 2 });
  const [kid, baby] = aged(world, household, 5, 1);
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-water' }), /only 5/, 'a five-year-old was given the pail');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-mind' }), /only 5/, 'a five-year-old was given the baby');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: baby.id, chore: 'child-play' }), /only 1/, 'a one-year-old was set to play');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'hunt-timber' }), /too young to be sent/, 'a five-year-old was sent to the timber with a rifle');
  // And nothing a child cannot use is on their row at all: no crop in the ground, no bird-scaring offered.
  assert.equal((household.field?.state ?? 'bare'), 'bare');
  assert.ok(!of(world, household, kid).some(entry => entry.id === 'child-birds'), 'bird-scaring was offered over a bare field');
  assert.ok(!of(world, household, baby).some(entry => entry.id.startsWith('child-')), 'an infant was offered a child’s work');
  // Grown out of it: at ten the family's own work begins and the children's works are gone from the row.
  kid.age = SENT_FROM_AGE;
  assert.ok(!of(world, household, kid).some(entry => entry.id.startsWith('child-')), 'a ten-year-old still has the children’s works');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-play' }), /has the family/, 'a ten-year-old was set to play');
});

test('the rule: setting a child to their own work stops nobody else in the family doing theirs', () => {
  // The owner's philosophy, 2026-09-21: "It shouldn't (unless there's a good reason) stop another character from doing
  // their action." So the father's list is the same list before and after the child is set to play, and he can still be
  // set to work while she is at it.
  const { world, household, people } = family('children-parallel');
  const [kid] = aged(world, household, 8);
  const father = people().find(p => p.kin?.role === 'father');
  const before = can(of(world, household, father));
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-play' });
  assert.ok(kid.chore, 'the child was not set to play');
  assert.deepEqual(can(of(world, household, father)), before, 'a child at play changed what the father could be set to');
  const work = before.find(id => !id.startsWith('child-'));
  assert.ok(work, 'the father had no work to be given');
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: work });
  assert.ok(father.chore, 'the father could not be set to work while a child played');
  assert.ok(kid.chore, 'the father’s work called the child off her play');
});

test('the rule: no work of a child’s leaves the family’s own land, and none of them touches an axe or a gun', () => {
  // The two thirds of the 2026-09-12 rule the owner did not amend: not on a road, and nothing an eight-year-old should not
  // be holding. Asked of the chore table itself, so a work added later cannot quietly break it.
  const { world, household } = family('children-land', { children: 2 });
  const [kid] = aged(world, household, 9, 1);
  household.field = { ...household.field, state: 'planted', changedTick: world.tick };
  for (const id of CHILD_WORKS) {
    const entry = of(world, household, kid).find(candidate => candidate.id === id);
    assert.ok(entry, `${id} is not offered to a nine-year-old at home`);
    assert.ok(!entry.cost, `${id} costs ${entry.cost}: a child’s work spends nothing of the family’s`);
  }
  // Begun at home and finished at home: the child never has a travel or a walk step, so no tick of it is spent off the place.
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-water' });
  const home = kid.location.siteId;
  for (let t = 0; t < 40 && kid.chore; t++) { stepWorld(world); assert.equal(kid.location.siteId, home, 'a child left the family’s land at their work'); assert.equal(kid.travel ?? null, null); }
});

test('the rule: the eggs are the one thing a child adds to the family’s store, once a day, and an older child finds more', () => {
  assert.ok(eggsFor({ age: 9 }) > eggsFor({ age: 5 }), 'a nine-year-old brings no more than a five-year-old');
  assert.deepEqual(adds('children-eggs', 'child-eggs', 5).delta, { food: eggsFor({ age: 5 }) });
  const { delta, world, household, kid } = adds('children-eggs', 'child-eggs', 9);
  assert.deepEqual(delta, { food: eggsFor({ age: 9 }) }, 'the eggs did not reach the house, or something else came with them');
  assert.ok(world.events.some(event => event.actorId === kid.id && /nests/.test(event.text)), 'the eggs reached the house without a word in the family’s record');
  // And the hens lay once a day: refused in words until tomorrow, not silently worth nothing.
  const again = of(world, household, kid).find(entry => entry.id === 'child-eggs');
  assert.equal(again.can, false, 'the nests could be gone round twice in one day');
  assert.match(again.why, /once a day/);
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-eggs' }), /once a day/);
  // Tomorrow they lay again.
  world.minute += 1440;
  assert.equal(of(world, household, kid).find(entry => entry.id === 'child-eggs').can, true, 'the hens never lay again');
});

test('the rule: a child minding the younger ones lifts the baby off the parents, exactly as a cradle does', () => {
  const { world, household, people } = family('children-mind', { children: 2 });
  const [kid] = aged(world, household, 8, 1);
  const mother = people().find(p => p.kin?.role === 'mother');
  assert.equal(mindingBaby(world, household, mother), true, 'a mother with a baby and no cradle was not carrying it');
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-mind' });
  assert.equal(mindingBaby(world, household, mother), false, 'the mother still had the baby while a child was minding it');
  // And only while the child is actually at it: the relief ends with the work, as the cradle's does not.
  applyAction(world, household.id, { action: 'stop-chore', entityId: kid.id });
  assert.equal(kid.chore ?? null, null, 'a child could not call off their own work');
  assert.equal(mindingBaby(world, household, mother), true, 'the relief outlived the minding');
});

test('the rule: the four works that say they add nothing to the family’s store add nothing, and play writes the child’s hour into the record', () => {
  for (const id of ['child-play', 'child-kindling', 'child-birds', 'child-water']) {
    const { delta, world, kid } = adds('children-nothing', id, 9);
    assert.deepEqual(delta, {}, `${id} put something in the family’s store`);
    // A memory of their own, and not the bare "finished:" line every chore writes (`finishChore`, which records a
    // `consequence`). Without that distinction a work that told the family nothing at all would still look told.
    const mine = world.events.filter(event => event.actorId === kid.id && event.type === 'memory');
    assert.equal(mine.length, 1, `${id} left the child’s own hour out of the family’s record`);
    assert.ok(!/finished/.test(mine[0].text));
  }
  // Play's own line, which is one of six and is chosen by a hashed share of the class, the child and the hour (`share`,
  // sim/shares.mjs), so the same class replayed tells the same hours. **Four hours, not one**: with six lines, one hour
  // of a stream coincides with one hour of the hash a sixth of the time, which is a test that passes five times in six
  // against `Math.random()`. Four hours in order is one chance in 1,296, which is the honest limit of this shape of
  // check - it is a replay test, not a proof that no stream was used.
  const hours = seed => {
    const { world, household } = family(seed, { children: 2 });
    const [kid] = aged(world, household, 9, 1);
    const said = [];
    for (let n = 0; n < 4; n++) {
      applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-play' });
      const before = world.events.length;
      run(world, kid);
      said.push(world.events.slice(before).map(event => event.text).find(text => PLAYS.some(line => line(kid.name) === text)));
    }
    return said;
  };
  const said = hours('children-play');
  assert.equal(said.filter(Boolean).length, 4, `play wrote no line of its own in some hour, or one that is not in PLAYS: ${said.join(' / ')}`);
  assert.deepEqual(hours('children-play'), said, 'the same class did not replay the same hours');
});

test('the rule: the lesson never refuses a child their own work, and a saved class with one holds together', () => {
  const world = settle(createGonzalesWorld('children-lesson', 8, { map: 'colonies' }));
  const household = Object.values(world.households)[0];
  rollFamily(world, household);
  household.played = true;
  delete household.lesson;
  world.status = 'running';
  const kid = household.members.map(id => world.entities[id]).find(p => ['son', 'daughter'].includes(p.kin?.role));
  assert.ok(kid, 'no child in the family');
  kid.age = 8;
  stepWorld(world);
  assert.ok(household.lesson && household.lesson.step !== 'done', 'the family is not on the lesson, so this proves nothing');
  // An adult work not on this step is refused, which is the lesson doing its job; the child's is not.
  assert.match(lessonRefusal(world, household, { action: 'chore', entityId: kid.id, chore: 'harvest-field' }) || '', /Not yet/);
  for (const id of CHILD_WORKS) assert.equal(lessonRefusal(world, household, { action: 'chore', entityId: kid.id, chore: id }), null, `the lesson refused ${id}`);
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-play' });
  validateWorld(world);
  const reloaded = JSON.parse(JSON.stringify(world));
  validateWorld(reloaded);
  // A saved world that says a one-year-old was at play is a world that cannot be, and is refused on load.
  kid.age = 1;
  assert.match(childrenInvalid(world) || '', /child/i);
});

test('the rule: nothing hidden about a child reaches the class, and the panel has a picture for every work', async () => {
  const { world, household } = family('children-projection');
  const [kid] = aged(world, household, 8);
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  const offered = view.work?.[kid.id] || [];
  assert.ok(offered.length && offered.every(entry => entry.id.startsWith('child-')), 'the projection sent an eight-year-old something that is not theirs');
  // The life-stage rule is readable from the projection alone: the ages are in the family book, the works in `world.work`.
  assert.ok(JSON.stringify(view).includes('child-play'), 'the child’s works never reach the page');
  assert.ok(!JSON.stringify(view).includes('"housework"'), 'a hidden stat rode along with the children’s works');
  const { PANEL_ICONS } = await import('../public/family-panel.js');
  for (const id of CHILD_WORKS) assert.ok(PANEL_ICONS[id], `${id} has no icon on the family panel`);
});
