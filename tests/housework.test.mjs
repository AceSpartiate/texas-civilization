// The women's own work: keeping house, the kitchen garden and the wash (owner, 2026-10-03; sim/housework.mjs,
// docs/CUSTOMARY_WORK.md §4-6).
//
// > "keep house, garden, wash clothes. if a family member goes to town/war/away then other npc's should have negative comments
// > about their smell, higher than normal prices, etc unless a woman has been washing clothes."
//
// Each test here was proved by injecting the regression it guards (scripts/custom-work-injections.mjs,
// docs/evidence/custom-work-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginChore, choreAvailability } from '../sim/chores.mjs';
import { errandOffers } from '../sim/errands.mjs';
import { CLEAN_DAYS, GARDEN_FOOD, REMARKS, WASH_AGAIN_DAYS, advanceWash, dirty, houseSaving, remarkLines } from '../sim/housework.mjs';
import { createSettledWorld, modestMeans, taught } from './support/settled.mjs';
import { housekeepingSaving } from '../sim/family.mjs';
import { panelActions } from '../public/family-panel.js';

const DAY = 1440;
const deps = { beginTravel: () => { throw new Error('no journeys in this test'); }, modeAvailability: () => ({ can: true }) };
const washDue = (world, household, person) => !/once a week/.test(choreAvailability(world, household, person, 'wash-clothes').why || '');
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const dayOf = world => Math.floor(world.minute / DAY);
function running(seed) {
  const world = modestMeans(taught(createSettledWorld(seed, 5)));
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = true;
  const [thomas, elena, rosa, mateo] = ['thomas', 'elena', 'rosa', 'mateo'].map(key => world.entities[`hh-1-${key}`]);
  return { world, household, thomas, elena, rosa, mateo };
}
/** Work this person until it is done, ticking the world. */
const finish = (world, person, cap = 400) => { for (let t = 0; t < cap && person.chore; t++) stepWorld(world); assert.equal(person.chore, null, `${person.name} never finished ${person.chore?.id}`); };
const story = (world, from = 0) => world.events.slice(from).filter(event => event.householdId === 'hh-1').map(event => event.text);
/** Move the class's clock on by whole days, nothing else: only for what reads the day and does not step the world. */
const daysOn = (world, days) => { world.minute += days * DAY; };
/** Everybody's clothes as if the class had been read as washed `days` ago: the clock is not moved, so the world still steps. */
const washedAgo = (world, days) => { world.washBase = dayOf(world) - days; };

test('keeping house: the hidden saving comes from whoever kept house today or yesterday, once a day, and from nobody else', () => {
  const { world, household, elena, thomas } = running('house-kept');
  for (const person of [elena, thomas]) person.traits = { strength: 5, health: 9, housework: person === elena ? 10 : 1 };
  assert.equal(houseSaving(world, household), 0, 'the house was kept with nobody keeping it');
  beginChore(world, household, elena, 'keep-house', deps);
  finish(world, elena);
  assert.ok(houseSaving(world, household) > 0.2, 'keeping house saved nothing');
  assert.ok(story(world).some(text => /kept house/.test(text)));
  // Once a day: refused in words, to her and to anybody.
  assert.match(choreAvailability(world, household, elena, 'keep-house').why, /The house has been kept today/);
  // Tomorrow it still counts; the day after, it does not.
  daysOn(world, 1);
  assert.ok(houseSaving(world, household) > 0.2, 'a house kept yesterday stopped counting');
  daysOn(world, 1);
  assert.equal(houseSaving(world, household), 0, 'a house kept two days ago still counted');
  validateWorld(world);
});

test('the kitchen garden: laid out the first day beside the house, then food every day it is worked, once a day', () => {
  const { world, household, elena } = running('garden');
  const brought = from => story(world, from).filter(text => /worked the garden and brought in/.test(text));
  beginChore(world, household, elena, 'work-garden', deps);
  finish(world, elena);
  assert.ok(household.garden, 'no garden was laid out');
  assert.ok(story(world).some(text => /laid out a kitchen garden beside the house/.test(text)));
  assert.deepEqual(brought(0), [], 'the garden gave food the day it was dug');
  const land = view(world, 'hh-1').land;
  assert.deepEqual([land.garden.x, land.garden.y], [household.garden.x, household.garden.y], 'the page is not sent the garden');
  const home = world.map.sites[household.homeSiteId];
  assert.ok(Math.hypot(land.garden.x - home.x, land.garden.y - home.y) < 0.1, 'the garden is not beside the house');
  // The next day (the garden laid out and worked yesterday): food, said in the story, and exactly that much more in the house than
  // an identical family whose mother rested instead.
  household.garden.laid -= 1; household.garden.worked -= 1;
  household.resources.food = 50;
  const twin = structuredClone(world);
  const from = world.events.length;
  beginChore(world, household, elena, 'work-garden', deps);
  const sister = twin.entities[elena.id];
  sister.task = 'rest';
  let ticks = 0;
  for (; ticks < 400 && elena.chore; ticks++) { stepWorld(world); stepWorld(twin); }
  assert.equal(elena.chore, null);
  assert.deepEqual(brought(from).map(text => text.match(/: ([\d.]+) food\.$/)?.[1]), [String(GARDEN_FOOD)], 'a day in the garden did not say its food');
  const gained = Math.round((household.resources.food - twin.households['hh-1'].resources.food) * 1000) / 1000;
  assert.equal(gained, GARDEN_FOOD, `a day in the garden put ${gained} food in the house`);
  assert.match(choreAvailability(world, household, elena, 'work-garden').why, /worked today/);
  validateWorld(world);
});

test('the wash: everybody at home is clean for seven days, and nobody away is washed; washed again after seven', () => {
  // The days themselves, written out (docs/CUSTOMARY_WORK.md §6, `FIC-GONZ-1157`), so a change to the module is caught here.
  // Weekly wash day (owner, 2026-10-04): clean seven days, and washed again after seven.
  assert.deepEqual([CLEAN_DAYS, WASH_AGAIN_DAYS], [7, 7]);
  const { world, household, elena, thomas, rosa } = running('wash');
  stepWorld(world);
  assert.equal(world.washBase, dayOf(world), 'the day a class is first read as washed was not written');
  washedAgo(world, CLEAN_DAYS);
  assert.ok([elena, thomas, rosa].every(person => dirty(world, person)), 'clothes did not want washing after eight days');
  // Thomas is in town while she washes.
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  beginChore(world, household, elena, 'wash-clothes', deps);
  finish(world, elena);
  assert.equal(dirty(world, elena), false);
  assert.equal(dirty(world, rosa), false);
  assert.equal(dirty(world, thomas), true, 'the clothes of a man away in town were washed at home');
  assert.ok(story(world).some(text => /did the wash/.test(text)));
  daysOn(world, WASH_AGAIN_DAYS - 1);
  assert.match(choreAvailability(world, household, elena, 'wash-clothes').why, /once a week/);
  assert.equal(dirty(world, rosa), false, 'clothes washed six days ago want washing');
  daysOn(world, 1);
  assert.equal(washDue(world, household, elena), true, 'the wash was not open on the seventh day');
  assert.equal(dirty(world, rosa), true, 'clothes washed seven days ago are still clean');
  // The page draws flies over a dirty person, and over nobody clean.
  const people = view(world, 'hh-1').entities;
  assert.equal(people.find(one => one.id === rosa.id).dirty, true);
  rosa.washed = dayOf(world);
  assert.equal(view(world, 'hh-1').entities.find(one => one.id === rosa.id).dirty, undefined);
});

test('dirty in town: somebody there says so, once, in the story and over their own head; clean, nobody says anything', () => {
  for (const clean of [false, true]) {
    const { world, rosa } = running(`remark-${clean}`);
    stepWorld(world);
    washedAgo(world, CLEAN_DAYS + 1);
    if (clean) rosa.washed = dayOf(world);
    rosa.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
    const from = world.events.length;
    advanceWash(world);
    const said = story(world, from).filter(text => /wrinkled/.test(text));
    if (clean) { assert.deepEqual(said, [], 'a clean customer was told she smelt'); continue; }
    assert.equal(said.length, 1, 'nothing was said of her clothes in town');
    const line = REMARKS.town.find(words => said[0].includes(words));
    assert.ok(line, `the town's words were not a town line: ${said[0]}`);
    const bubble = remarkLines(world, world.households['hh-1']);
    assert.equal(bubble.length, 1);
    assert.equal(bubble[0].text, line);
    assert.ok(world.entities[bubble[0].speakerId].location.siteId === 'gonzales' && !world.entities[bubble[0].speakerId].householdId, 'the speaker is not a townsman of Gonzales');
    assert.ok(view(world, 'hh-1').familyTalk.lines.some(one => one.text === line), 'the page is not sent the words over the speaker');
    // Not again, however long she stands there; and the words leave the speaker's head after a few ticks.
    for (let tick = 0; tick < 5; tick++) advanceWash(world), world.tick++;
    assert.equal(story(world, from).filter(text => /wrinkled/.test(text)).length, 1, 'she was told it again in the same town');
    assert.equal(remarkLines(world, world.households['hh-1']).length, 0, 'the words stayed over the speaker');
    validateWorld(world);
  }
});

test('dirty at the war: the other volunteers say so in their own words', () => {
  const { world, thomas } = running('remark-war');
  stepWorld(world);
  washedAgo(world, CLEAN_DAYS + 2);
  const camp = 'gonzales';
  const other = world.entities['hh-2-thomas'];
  for (const man of [thomas, other]) {
    man.service = { kind: 'regular', status: 'serving', since: 0, siteId: camp };
    man.location = { ...world.map.sites[camp], siteId: camp };
  }
  // Nobody of the town is there: the camp is the volunteers'.
  for (const one of Object.values(world.entities)) if (!one.householdId && one.location?.siteId === camp) one.location = { ...one.location, siteId: 'elsewhere' };
  const from = world.events.length;
  advanceWash(world);
  const said = story(world, from).filter(text => /wrinkled/.test(text));
  assert.equal(said.length, 1);
  assert.ok(REMARKS.army.some(words => said[0].includes(words)), `not a volunteer's words: ${said[0]}`);
});

test('the shops ask a quarter more and pay a fifth less of a customer in dirty clothes, say why on the list, and charge it', () => {
  const prices = {};
  for (const clean of [true, false]) {
    const { world, household, rosa } = running(`prices-${clean}`);
    stepWorld(world);
    washedAgo(world, CLEAN_DAYS + 1);
    if (clean) rosa.washed = dayOf(world);
    household.resources = { ...household.resources, seed: 2, food: 30, money: 10 };
    const offers = errandOffers(world, household, rosa);
    const seed = offers.lines.find(line => line.id === 'store:seed');
    prices[clean] = { seed: seed.price, dear: Boolean(seed.dear), dearer: offers.dearer || null };
    const from = world.events.length;
    applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'visit-shop', errand: [{ id: 'store:seed', n: 2, pay: 'food' }, { id: 'store:food', n: 3, pay: 'coin' }] });
    for (let t = 0; t < 900 && rosa.chore; t++) stepWorld(world);
    prices[clean].story = story(world, from).filter(text => /seed|food to/.test(text));
    prices[clean].seedPaid = 30 - household.resources.food;
  }
  assert.equal(prices.true.seed, '1 real or 3 food for 2 seed');
  assert.equal(prices.true.dear, false);
  assert.equal(prices.true.dearer, null);
  assert.equal(prices.false.seed, '2 reales or 3.75 food for 2 seed (1 real or 3 food to a clean customer)');
  assert.equal(prices.false.dear, true);
  assert.match(prices.false.dearer, /clothes want washing: the shops ask a quarter more and pay a fifth less/);
  assert.ok(prices.true.story.some(text => /bought 4 seed at the store for 6 food\.$/.test(text)), prices.true.story.join(' | '));
  assert.ok(prices.false.story.some(text => /bought 4 seed at the store for 7\.5 food - 6 food to a clean customer, but .* asked more\.$/.test(text)), prices.false.story.join(' | '));
  // The store's three lots of food: three reales clean, a real less in dirty clothes.
  assert.ok(prices.true.story.some(text => /sold 9 food to .* for 3 reales\.$/.test(text)), prices.true.story.join(' | '));
  assert.ok(prices.false.story.some(text => /sold 9 food to .* for 2 reales - 3 reales to a clean customer/.test(text)), prices.false.story.join(' | '));
});

test('a class saved before the wash opens with everybody clean, and nothing saved before is refused', () => {
  const { world } = running('wash-old-save');
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  // What a save of 2026-10-02 holds: none of it.
  const old = JSON.parse(JSON.stringify(world));
  delete old.washBase;
  for (const entity of Object.values(old.entities)) { delete entity.washed; delete entity.remark; delete entity.necessity; }
  for (const household of Object.values(old.households)) { delete household.washDay; delete household.housekept; delete household.garden; }
  old.minute += 30 * DAY;
  validateWorld(old);
  const people = Object.values(old.entities).filter(one => one.kind === 'person' && one.householdId);
  assert.ok(people.every(person => !dirty(old, person)), 'an old class opened with dirty clothes');
  stepWorld(old);
  assert.equal(old.washBase, Math.floor(old.minute / DAY), 'the old class is not read as washed the day it opened');
  assert.ok(people.every(person => !dirty(old, person)));
  validateWorld(JSON.parse(JSON.stringify(old)));
  // And a world holding nonsense is refused.
  const bad = JSON.parse(JSON.stringify(old));
  bad.entities['hh-1-rosa'].washed = 'monday';
  assert.throws(() => validateWorld(bad), /wash/i);
});

// ------------------------------------------------------------------------------------------------ the owner's answers of 2026-10-04
// Children keep house (issue 2), prompt the student (issue 3), wash whoever's dirty (issue 4): docs/BALANCE.md §23,
// docs/CUSTOMARY_WORK.md §1c.

/** The founding family with ages: Rosa a girl of 8, Mateo a boy of 7. */
/** Two little ones, two and three, so the family is six and keeps the custom (sim/custom.mjs `smallFamily`); under seven, neither keeps house. */
function littleOnes(world, household) {
  const site = world.map.sites[household.homeSiteId];
  for (const [n, age] of [[1, 2], [2, 3]]) {
    const id = `${household.id}-little-${n}`;
    world.entities[id] = { id, name: `Little ${n}`, kind: 'person', householdId: household.id, depth: 'moderate', principal: false, location: { x: site.x, y: site.y, siteId: site.id },
      travel: null, health: { condition: 'well' }, task: 'rest', skills: {}, chore: null, kin: { role: 'son', spouse: null, parents: [], children: [] },
      relationships: {}, propertyRefs: [], commitments: [], sex: 'male', age };
    household.members.push(id);
  }
}
function withChildren(seed) {
  const family = running(seed);
  Object.assign(family.rosa, { age: 8, sex: 'female' });
  Object.assign(family.mateo, { age: 7, sex: 'male' });
  return family;
}
const canDo = (world, household, person, id) => choreAvailability(world, household, person, id).can;
const send = (world, entityId, chore) => applyAction(world, 'hh-1', { action: 'chore', entityId, chore });

test('children keep house: a child of seven keeps house and does the wash for a lone father, and not with a grown woman at home; on auto they take it up', () => {
  const { world, household, thomas, elena, rosa, mateo } = withChildren('children-keep');
  washedAgo(world, CLEAN_DAYS);
  // Both at home: the children's own works, not the house.
  for (const child of [rosa, mateo]) for (const id of ['keep-house', 'wash-clothes']) {
    assert.equal(canDo(world, household, child, id), false, `${child.name} may ${id} with both parents at home`);
    assert.equal(view(world, 'hh-1').work[child.id].find(entry => entry.id === id), undefined, `${id} is on ${child.name}'s bar with both parents home`);
  }
  // The father gone: a lone mother keeps the house herself (owner, 2026-10-05: "Children keep house only when no grown woman is
  // home"; until then her children of seven kept it for her).
  thomas.health = { condition: 'dead' };
  for (const child of [rosa, mateo]) for (const id of ['keep-house', 'wash-clothes']) {
    assert.equal(canDo(world, household, child, id), false, `${child.name} may ${id} beside a lone mother`);
  }
  // The mother gone instead, the father home: a lone father's children of seven or more keep house and wash, girl and boy alike,
  // on their own bars.
  thomas.health = { condition: 'well' };
  elena.health = { condition: 'dead' };
  for (const child of [rosa, mateo]) for (const id of ['keep-house', 'wash-clothes']) {
    assert.equal(canDo(world, household, child, id), true, `${child.name} may not ${id} for a lone father: ${choreAvailability(world, household, child, id).why}`);
    assert.ok(view(world, 'hh-1').work[child.id].find(entry => entry.id === id)?.can, `${id} is not on ${child.name}'s bar`);
  }
  // Not the garden, and not a child of six.
  assert.equal(canDo(world, household, rosa, 'work-garden'), false, 'a child of eight was given the garden');
  mateo.age = 6;
  assert.equal(canDo(world, household, mateo, 'keep-house'), false, 'a child of six may keep house');
  mateo.age = 7;
  // A child on their own automation keeps house first, and the house is kept by her.
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: rosa.id, auto: true });
  for (let tick = 0; tick < 3 && rosa.chore?.id !== 'keep-house'; tick++) stepWorld(world);
  assert.equal(rosa.chore?.id, 'keep-house', `a child on auto did not keep house for a lone father: ${rosa.chore?.id}`);
  for (let tick = 0; tick < 60 && !household.housekept; tick++) stepWorld(world);
  assert.equal(household.housekept?.by, rosa.id, 'the house was not kept by the child');
  validateWorld(world);
});

test('a child keeps house as the lone parent\'s would: the parent\'s housework is read, not the child\'s; with no lone parent, the child\'s own', () => {
  // Owner, 2026-10-04, "As the parent's would": the child does the chores the parent directs.
  // Kept to the end: a child may wander off a job (sim/obedience.mjs), and is set to it again.
  const keep = (family, child) => {
    family.household.housekept = undefined;
    for (let tries = 0; tries < 8 && family.household.housekept?.by !== child.id; tries++) {
      child.chore = null;
      beginChore(family.world, family.household, child, 'keep-house', deps);
      finish(family.world, child);
    }
    assert.equal(family.household.housekept?.by, child.id, `${child.name} never kept the house`);
    return { saving: houseSaving(family.world, family.household), kept: { ...family.household.housekept } };
  };
  const traits = (person, housework) => { person.traits = { strength: 5, health: 9, housework }; };
  // A lone father, a good housekeeper, and a daughter of eight who is not yet. (A lone mother keeps the house herself since
  // 2026-10-05, owner: "Children keep house only when no grown woman is home".)
  const father = withChildren('child-keeps-father');
  traits(father.thomas, 10); traits(father.rosa, 1); traits(father.elena, 1);
  father.elena.health = { condition: 'dead' };
  const asHis = keep(father, father.rosa);
  assert.equal(asHis.kept.by, father.rosa.id);
  assert.equal(asHis.kept.for, father.thomas.id, 'the house the child kept is not recorded kept for her father');
  assert.equal(asHis.saving, housekeepingSaving([father.thomas]), `the child's keeping saved ${asHis.saving}, not her father's`);
  assert.ok(asHis.saving > 0.2);
  // No lone parent - the father and a grown son of seventeen, the mother dead: nobody directs the child as one parent, and the
  // child's own housework is read.
  const two = withChildren('child-keeps-two');
  traits(two.thomas, 10); traits(two.rosa, 1);
  Object.assign(two.mateo, { age: 17, sex: 'male' }); traits(two.mateo, 10);
  two.elena.health = { condition: 'dead' };
  const asOwn = keep(two, two.rosa);
  assert.equal(asOwn.kept.for, undefined);
  assert.equal(asOwn.saving, housekeepingSaving([two.rosa]));
  // A grown person keeping house keeps it as themself; and a saved `for` that cannot be is refused.
  delete father.thomas.aside; // a child may have stopped him to talk meanwhile (sim/aside.mjs)
  const own = keep(father, father.thomas);
  assert.equal(own.kept.for, undefined);
  const bad = structuredClone(father.world);
  bad.households['hh-1'].housekept = { day: 0, by: father.rosa.id, for: 7 };
  assert.throws(() => validateWorld(bad), /housekeeping/i);
});

test('prompt the student: the idle woman is pointed at keeping house, then at the wash; never while she is busy, on auto, or it is done', () => {
  const { world, household, thomas, elena, rosa, mateo } = withChildren('house-cue');
  // Six, so the family keeps the custom (a family of fewer keeps none: the test after this one).
  littleOnes(world, household);
  const cues = () => Object.fromEntries(view(world, 'hh-1').entities.filter(one => one.cue).map(one => [one.id, one.cue]));
  // Short of food the ways to food glow instead, and the house's cue is quiet.
  household.resources.food = 2;
  assert.deepEqual(cues(), {}, 'the house\'s cue with the food low');
  household.resources.food = 200;
  // The house not kept today, everybody idle: the mother - not the father, whose work it is not, nor the children.
  assert.deepEqual(cues(), { [elena.id]: 'keep-house' });
  const icon = panelActions({ entity: view(world, 'hh-1').entities.find(one => one.id === elena.id), offered: view(world, 'hh-1').work[elena.id], catalogue: new Map(), settable: true })
    .find(one => one.key === 'keep-house');
  assert.equal(icon?.cue, true, 'the icon on her bar does not glow with the cue');
  // On auto she keeps house by herself: no cue. Busy at other work: no cue.
  elena.auto = true;
  assert.deepEqual(cues(), {}, 'a woman on auto was pointed at the house');
  delete elena.auto;
  send(world, elena.id, 'work-garden');
  assert.deepEqual(cues(), {}, 'a busy woman was pointed at the house');
  finish(world, elena);
  // Kept, and the wash not due: nothing.
  send(world, elena.id, 'keep-house');
  finish(world, elena);
  assert.deepEqual(cues(), {}, 'the cue stayed with the house kept');
  // The wash wanted: the wash.
  washedAgo(world, CLEAN_DAYS);
  assert.deepEqual(cues(), { [elena.id]: 'wash-clothes' });
  // With the father gone she is the only grown hand at home, with all the family's work: never pointed at the house, and a daughter
  // of ten, whose work it is by custom, is pointed at the wash instead.
  thomas.health = { condition: 'dead' };
  rosa.age = 11;
  assert.deepEqual(cues(), { [rosa.id]: 'wash-clothes' }, 'the lone mother, not the eldest idle daughter, was pointed at the wash');
  // Children under ten do not keep house beside a grown woman (owner, 2026-10-05): with no daughter of ten, nobody.
  rosa.age = 8;
  assert.deepEqual(cues(), {}, 'the lone mother, or a child under ten beside her, was pointed at the house');
  // Somebody at the wash already: nobody is pointed at it.
  send(world, elena.id, 'wash-clothes');
  assert.deepEqual(cues(), {});
  assert.equal(mateo.cue, undefined);
});

test('wash whoever\'s dirty: a man who missed wash day is washed for before the week is out, alone, and clean for town; the week stays', () => {
  const { world, household, thomas, elena, rosa } = running('wash-for');
  stepWorld(world);
  washedAgo(world, CLEAN_DAYS);
  // He is in town on wash day.
  const home = { ...thomas.location };
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  send(world, elena.id, 'wash-clothes');
  finish(world, elena);
  const washDay = household.washDay;
  assert.equal(dirty(world, thomas), true);
  // While he is away nobody at home wants it: the week holds.
  assert.match(choreAvailability(world, household, elena, 'wash-clothes').why, /once a week/);
  // Home, dirty: the wash may be done for him at once, and cleans him and nobody else; the family's wash day does not move.
  thomas.location = home;
  daysOn(world, 1);
  assert.equal(canDo(world, household, elena, 'wash-clothes'), true, choreAvailability(world, household, elena, 'wash-clothes').why);
  const rosaWashed = rosa.washed;
  send(world, elena.id, 'wash-clothes');
  finish(world, elena);
  assert.equal(dirty(world, thomas), false, 'the man who missed wash day was not washed for');
  assert.equal(thomas.washed, dayOf(world));
  assert.equal(rosa.washed, rosaWashed, 'the wash for one washed everybody again');
  assert.equal(household.washDay, washDay, 'a wash for one moved the family\'s wash day');
  assert.ok(story(world).some(text => text.includes(`did a wash for ${thomas.given || thomas.name}`)), 'the wash for him is not said');
  assert.match(choreAvailability(world, household, elena, 'wash-clothes').why, /once a week/, 'the wash stayed open with nobody wanting it');
  // So he goes to town clean: the plain price.
  household.resources = { ...household.resources, seed: 2, food: 30, money: 10 };
  assert.equal(errandOffers(world, household, thomas).dearer || null, null, 'washed for, he is still asked more in town');
  // Somebody who missed wash day is washed for even while their clothes are still clean: Rosa washed the day before it, away on it.
  rosa.washed = household.washDay - 1;
  assert.equal(dirty(world, rosa), false);
  assert.equal(canDo(world, household, elena, 'wash-clothes'), true, `nobody may wash for a girl who missed wash day: ${choreAvailability(world, household, elena, 'wash-clothes').why}`);
});

test('a small family\'s house cue: the mother while she is idle, and the father when she is not, since a family of four keeps no custom', () => {
  const { world, household, thomas, elena } = withChildren('house-cue-small');
  const cues = () => Object.fromEntries(view(world, 'hh-1').entities.filter(one => one.cue).map(one => [one.id, one.cue]));
  household.resources.food = 200;
  assert.deepEqual(cues(), { [elena.id]: 'keep-house' }, 'the mother is not pointed at the house first, idle beside the father');
  elena.auto = true;
  assert.deepEqual(cues(), { [thomas.id]: 'keep-house' }, 'the father of a family of four was not pointed at the house with the mother on auto');
  littleOnes(world, household);
  assert.deepEqual(cues(), {}, 'the father of a family of six was pointed at the women\'s work');
});
