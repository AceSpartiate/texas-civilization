// Men's work and women's work: "Custom, necessity opens" (owner, 2026-10-03; sim/custom.mjs, docs/CUSTOMARY_WORK.md).
//
// Each work is men's, women's or shared. The other sex's work is refused - greyed on the bar, in words - while somebody of its custom,
// sixteen or over, is at home and able, and it opens by itself when every one of them is away, sick or dead, with one line in the
// family's story ("With James gone to the army, Martha took up the axe."). Cattle on horseback are the men's, a woman's only when no
// man is at home; the hogs and the milking are everybody's.
//
// Each test here was proved by injecting the regression it guards (scripts/custom-work-injections.mjs,
// docs/evidence/custom-work-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, beginChore, choreAvailability, homeWork } from '../sim/chores.mjs';
import { BOY_KEEPS_FROM, CUSTOM, GIRL_KEEPS_FROM, customOf, customRefusal } from '../sim/custom.mjs';
import { houseCue } from '../sim/housework.mjs';
import { herdWorkHere } from '../sim/chores.mjs';
import { STEPS } from '../sim/lesson.mjs';
import { advanceAuto } from '../sim/auto.mjs';
import { createSettledWorld, settle } from './support/settled.mjs';
import { houseBuilt } from '../sim/houses.mjs';
import { barIcons, panelActions } from '../public/family-panel.js';
import { choreCatalogue } from '../sim/chores.mjs';

/** The chore catalogue as the page holds it, by id (public/app.js `choreCache`). */
const catalogue = () => new Map(choreCatalogue().map(chore => [chore.id, chore]));

const deps = { beginTravel: () => { throw new Error('no journeys in this test'); }, modeAvailability: () => ({ can: true }) };
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const send = (world, householdId, entityId, chore) => applyAction(world, householdId, { action: 'chore', entityId, chore });
/** The founding family of hh-1 at home: Thomas the father, Elena the mother, Rosa and Mateo with no stated age. */
function founding(seed = 'custom') {
  const world = createSettledWorld(seed, 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.powder = 6;
  // Nobody here already shoots as well as anyone on the land, so practice at the mark is never refused for that.
  for (const key of ['thomas', 'elena', 'rosa', 'mateo']) world.entities[`hh-1-${key}`].skills = { ...world.entities[`hh-1-${key}`].skills, hunting: 1 };
  const [thomas, elena, rosa, mateo] = ['thomas', 'elena', 'rosa', 'mateo'].map(key => world.entities[`hh-1-${key}`]);
  littleOnes(world, household);
  return { world, household, thomas, elena, rosa, mateo };
}
/**
 * Two little ones, two and four, added to a family so that it is six people and keeps the custom: a family of fewer than six keeps
 * none (owner, 2026-10-04, "Fewer than 6"; sim/custom.mjs `smallFamily`, the test of its own below). Under seven, neither keeps
 * house, helps or keeps the custom for anybody, so nothing else this file holds moves.
 */
function littleOnes(world, household) {
  const site = world.map.sites[household.homeSiteId];
  for (const [n, age, sex] of [[1, 2, 'female'], [2, 4, 'male']]) {
    const id = `${household.id}-little-${n}`;
    world.entities[id] = { id, name: `Little ${n}`, kind: 'person', householdId: household.id, depth: 'moderate', principal: false, location: { x: site.x, y: site.y, siteId: site.id },
      travel: null, health: { condition: 'well' }, task: 'rest', skills: {}, chore: null, kin: { role: sex === 'male' ? 'son' : 'daughter', spouse: null, parents: [], children: [] },
      relationships: {}, propertyRefs: [], commitments: [], sex, age };
    household.members.push(id);
  }
}
/** A rolled family of this shape, home on its land: 'both', 'mother' (no father) or 'father' (no mother). */
function rolled(shape, { seed = 'custom-shape', want = () => true } = {}) {
  for (let n = 0; n < 200; n++) {
    const world = createGonzalesWorld(`${seed}-${n}`, 6);
    for (const household of Object.values(world.households)) {
      rollFamily(world, household);
      const people = household.members.map(id => world.entities[id]);
      const roles = people.map(person => person.kin?.role);
      const has = { father: roles.includes('father'), mother: roles.includes('mother') };
      // Both parents in a family of six or more, which keeps the custom (a smaller one keeps none: `smallFamily`).
      const fits = shape === 'both' ? has.father && has.mother && people.length >= 6 : shape === 'mother' ? has.mother && !has.father : has.father && !has.mother;
      // No grown child of the other sex: a lone mother's family has no man of sixteen or over at all, and no boy of twelve to
      // fifteen, who keeps the men's work from her (owner, 2026-10-05, "Boys 12+ carry it"); a lone father's no woman, and no girl of
      // twelve to fifteen, who keeps the women's work from him (the same day, "Let a daughter of 12-15 keep the women's work too").
      const grownOther = people.some(person => person.age >= 12 && !['father', 'mother'].includes(person.kin?.role) && person.sex === (shape === 'mother' ? 'male' : 'female'));
      if (!fits || (shape !== 'both' && grownOther) || !want(world, household)) continue;
      settle(world);
      world.status = 'running';
      household.resources.powder = 6;
      return { world, household, people };
    }
  }
  throw new Error(`no ${shape} family in 200 seeds`);
}
const roleOf = (world, household, role) => household.members.map(id => world.entities[id]).find(person => person.kin?.role === role);

test('the rule: men\'s work is refused a mother while the father is at home, in words, and is not on her list; shared work is', () => {
  const { world, household, thomas, elena } = founding();
  const refused = choreAvailability(world, household, elena, 'hunt-timber');
  assert.equal(refused.can, false);
  assert.match(refused.why, new RegExp(`^Hunting is men's work, and ${thomas.name} is at home\\.$`));
  assert.equal(refused.custom, 'men');
  // Not on her list at all, not greyed (owner, 2026-10-04: "none, they only appear if the correct gender isn't around to do it");
  // nothing of the custom rides on the tick.
  const seen = view(world, household.id);
  assert.equal(seen.work[elena.id].find(one => one.id === 'hunt-timber'), undefined, 'the men\'s work rides on her list');
  assert.ok(seen.work[thomas.id].some(one => one.id === 'hunt-timber'), 'the father\'s hunt is not on his list');
  assert.ok(!JSON.stringify(seen.work).includes('"custom"') && seen.household.customSays === undefined, 'the custom rides on the tick');
  // The server holds the gate, whoever sends it.
  assert.throws(() => send(world, household.id, elena.id, 'hunt-timber'), /men's work/);
  // His own work, and the shared work, are hers and his as they always were.
  assert.equal(choreAvailability(world, household, thomas, 'hunt-timber').can, true);
  for (const id of ['plant-field', 'milk-cow', 'fish-the-water', 'butcher-hog', 'visit-shop']) assert.equal(customOf(id), 'shared', `${id} has a custom`);
  assert.equal(customRefusal(world, household, elena, 'fish-the-water'), null);
  // And the mirror: the women's work is refused him while she is at home.
  assert.match(choreAvailability(world, household, thomas, 'wash-clothes').why, new RegExp(`^The wash is women's work, and ${elena.name} is at home\\.$`));
  assert.equal(choreAvailability(world, household, elena, 'wash-clothes').can, true);
  assert.equal(seen.work[thomas.id].find(one => one.id === 'wash-clothes'), undefined, 'the women\'s work rides on his list');
});

test("another's work is not on the bar while one of its custom is home, and appears, lit, the tick it opens", () => {
  const { world, household, thomas, elena } = founding('custom-bar');
  const iconsOf = () => panelActions({ entity: elena, offered: view(world, household.id).work[elena.id], catalogue: catalogue(), settable: true });
  const barOf = () => barIcons(iconsOf(), icon => icon.active || icon.can, 6).map(icon => icon.key);
  for (const key of ['hunt-timber', 'practise-shooting']) {
    assert.equal(iconsOf().find(icon => icon.key === key), undefined, `${key} is on her icons with her husband at home`);
    assert.ok(!barOf().includes(key), `${key} is on her bar with her husband at home`);
  }
  // Her own work is there.
  assert.ok(barOf().includes('keep-house'), 'keeping house is not on her bar');
  thomas.health = { condition: 'dead' };
  const lit = iconsOf().find(icon => icon.key === 'hunt-timber');
  assert.ok(lit && lit.can, 'the work did not appear lit when nobody of its custom was at home');
  assert.ok(barOf().includes('hunt-timber'), 'the opened work is not on her bar');
});

test('it opens when every man is away: gone to town, at the war, sick, dead or taken; and only then', () => {
  const cases = {
    town: thomas => { thomas.location = { ...thomas.location, siteId: 'gonzales' }; },
    // Serving, whatever his place says: enlisted is away from the family's work.
    war: thomas => { thomas.service = { kind: 'regular', status: 'serving', since: 0, siteId: 'gonzales' }; },
    sick: thomas => { thomas.health = { condition: 'sick' }; },
    grave: thomas => { thomas.health = { condition: 'sick', grave: true }; },
    wounded: thomas => { thomas.health = { condition: 'wounded' }; },
    dead: thomas => { thomas.health = { condition: 'dead' }; },
    taken: thomas => { thomas.health = { condition: 'captured' }; },
    visiting: thomas => { thomas.visiting = true; },
    helping: thomas => { thomas.task = 'help'; },
  };
  for (const [name, away] of Object.entries(cases)) {
    const { world, household, thomas, elena } = founding(`custom-${name}`);
    assert.equal(choreAvailability(world, household, elena, 'hunt-timber').can, false, `${name}: refused before he went`);
    away(thomas);
    assert.equal(customRefusal(world, household, elena, 'hunt-timber'), null, `${name}: the custom still holds with him ${name}`);
    assert.equal(choreAvailability(world, household, elena, 'hunt-timber').can, true, `${name}: ${choreAvailability(world, household, elena, 'hunt-timber').why}`);
  }
  // Out on a work of the place - the creek, the timber - he is still at home: the axe is not hers.
  const { world, household, thomas, elena } = founding('custom-creek');
  send(world, household.id, thomas.id, 'hunt-timber');
  for (let tick = 0; tick < 6 && thomas.location.siteId === household.homeSiteId; tick++) stepWorld(world);
  assert.notEqual(thomas.location.siteId, household.homeSiteId, 'the hunt never left the house, so this proves nothing');
  assert.match(customRefusal(world, household, elena, 'practise-shooting', homeWork) || '', /men's work/, 'a man out in the timber left the rifle to his wife');
  // Tired, he still keeps it.
  thomas.health = { condition: 'tired' };
  assert.match(customRefusal(world, household, elena, 'practise-shooting', homeWork) || '', /men's work/);
});

test('a boy under sixteen follows the men\'s work; with no grown man home a boy of twelve keeps it, a boy of ten or eleven from nobody; a grown son keeps it', () => {
  const { world, household, people } = rolled('both', { want: (w, h) => h.members.some(id => w.entities[id].sex === 'male' && w.entities[id].age >= 10 && w.entities[id].age < 16) });
  const father = roleOf(world, household, 'father'), mother = roleOf(world, household, 'mother');
  const boy = people.find(person => person.sex === 'male' && person.age >= 10 && person.age < 16);
  // Only this boy of ten or more: the others too young to keep or help anything.
  for (const other of people) if (other !== boy && !['father', 'mother'].includes(other.kin?.role)) other.age = Math.min(other.age, 6);
  assert.equal(customRefusal(world, household, boy, 'hunt-timber'), null, 'a boy was refused the men\'s work');
  father.health = { condition: 'dead' };
  // A boy of ten or eleven keeps nothing from his mother: she may take up the rifle beside him.
  boy.age = 11;
  assert.equal(customRefusal(world, household, mother, 'hunt-timber'), null, 'a boy of eleven kept the men\'s work from his mother');
  // A boy of twelve to fifteen does (owner, 2026-10-05, "Boys 12+ carry it"), named as the one at home.
  for (const age of [12, 15]) {
    boy.age = age;
    assert.equal(customRefusal(world, household, mother, 'hunt-timber'), `Hunting is men's work, and ${boy.given || boy.name} is at home.`, `a boy of ${age} kept nothing from his mother`);
  }
  // A grown son does keep it.
  boy.age = 17;
  assert.match(customRefusal(world, household, mother, 'hunt-timber') || '', new RegExp(`${boy.given || boy.name} is at home`));
});

test('the journal says it once for each reason it opened: "With Thomas gone to the army, Elena took up the rifle."', () => {
  const { world, household, thomas, elena } = founding('custom-line');
  const lines = () => world.events.filter(event => event.claimId === 'FIC-GONZ-1151').map(event => event.text);
  thomas.service = { kind: 'regular', status: 'serving', since: 0, siteId: 'gonzales' };
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  beginChore(world, household, elena, 'practise-shooting', deps);
  assert.deepEqual(lines(), [`With ${thomas.name} gone to the army, ${elena.name} took up the rifle.`]);
  // Again, for the same reason: nothing more is said, every tick or every work.
  elena.chore = null;
  beginChore(world, household, elena, 'practise-shooting', deps);
  for (let tick = 0; tick < 4; tick++) stepWorld(world);
  assert.equal(lines().length, 1, 'the line was said again for the same reason');
  // He dies at the war: a new reason, a new line.
  thomas.health = { condition: 'dead' };
  elena.chore = null;
  beginChore(world, household, elena, 'practise-shooting', deps);
  assert.equal(lines().length, 2);
  assert.equal(lines()[1], `With ${thomas.name} dead, ${elena.name} took up the rifle.`);
  // Her own work and shared work never say it.
  elena.chore = null;
  beginChore(world, household, elena, 'keep-house', deps);
  assert.equal(lines().length, 2);
  validateWorld(world);
});

test('a lone mother may do every work the family lives by; a lone father may milk, nurse, keep house, wash and garden', () => {
  const lone = rolled('mother');
  const mother = roleOf(lone.world, lone.household, 'mother');
  for (const id of Object.keys(CUSTOM)) assert.equal(customRefusal(lone.world, lone.household, mother, id), null, `${id} is refused a lone mother by custom`);
  // Her line says there is no grown man in the family at all.
  beginChore(lone.world, lone.household, mother, 'practise-shooting', deps);
  assert.ok(lone.world.events.some(event => event.text === `With no grown man in the family, ${mother.name} took up the rifle.`));

  const alone = rolled('father');
  const father = roleOf(alone.world, alone.household, 'father');
  for (const id of ['keep-house', 'work-garden', 'wash-clothes', 'nurse-home', 'milk-cow']) {
    assert.equal(customRefusal(alone.world, alone.household, father, id), null, `${id} is refused a lone father by custom`);
  }
  assert.equal(choreAvailability(alone.world, alone.household, father, 'wash-clothes').can, true, choreAvailability(alone.world, alone.household, father, 'wash-clothes').why);
  beginChore(alone.world, alone.household, father, 'wash-clothes', deps);
  assert.ok(alone.world.events.some(event => event.text === `With no grown woman in the family, ${father.name} did the wash himself.`));
});

test('the guided start\'s every step has somebody who may do it, in a two-parent family, a lone mother\'s and a lone father\'s', () => {
  for (const shape of ['both', 'mother', 'father']) {
    const { world, household } = rolled(shape, { seed: `custom-lesson-${shape}` });
    const grown = household.members.map(id => world.entities[id]).filter(person => person.age >= 16);
    for (const step of STEPS) {
      const works = step.allow(world, household).filter(id => id.startsWith('chore:')).map(id => id.slice(6)).concat(step.allow(world, household).filter(id => CHORES[id]));
      if (!works.length) continue;
      // Somebody grown the custom allows to each of the step's works - not the work's other wants (a plot, a ripe crop), which
      // the step itself is about.
      for (const work of works) {
        assert.ok(grown.some(person => !customRefusal(world, household, person, work)), `${shape}: nobody may do ${work} on the step ${step.id}`);
      }
    }
  }
});

test('the guided start\'s work, played through by whoever the custom allows, in all three shapes: a house, a field, a crop, a hunt', () => {
  for (const shape of ['both', 'mother', 'father']) {
    const { world, household } = rolled(shape, { seed: `custom-play-${shape}` });
    household.resources.seed = 12;
    const grown = () => household.members.map(id => world.entities[id]).filter(person => person.age >= 16 && !person.chore && !person.travel && person.location.siteId === household.homeSiteId);
    const sendAny = (chore, extra = {}) => {
      const hand = grown().find(person => choreAvailability(world, household, person, chore).can);
      assert.ok(hand, `${shape}: nobody can ${chore}: ${grown().map(person => choreAvailability(world, household, person, chore).why).join(' / ')}`);
      applyAction(world, household.id, { action: 'chore', entityId: hand.id, chore, ...extra });
      return hand;
    };
    const until = (holds, cap, what) => { for (let tick = 0; tick < cap && !holds(); tick++) stepWorld(world); assert.ok(holds(), `${shape}: ${what}`); };
    household.improvements = { ...household.improvements, cabin: undefined };
    applyAction(world, household.id, { action: 'plan-house', layout: 'jacal' });
    if (!household.house) continue;
    sendAny('build-house');
    until(() => !household.members.some(id => world.entities[id].chore?.id === 'build-house'), 3000, 'the house was never raised');
    const planter = sendAny('plant-field');
    until(() => !planter.chore || planter.chore.ask, 400, 'the planting never asked');
    if (planter.chore?.ask) applyAction(world, household.id, { action: 'answer-chore', entityId: planter.id, option: planter.chore.ask.options?.[0]?.id || 'corn' });
    until(() => !planter.chore, 400, 'the planting never finished');
    const hunter = sendAny('hunt-timber');
    until(() => !hunter.chore || hunter.chore.ask, 600, 'the hunt never came to a shot');
    if (hunter.chore?.ask) applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'take' });
    until(() => !hunter.chore, 600, 'the hunter never came home');
    validateWorld(world);
  }
});

test('auto keeps the custom: a mother on auto at the hunt keeps house while her husband is home, and hunts when he is gone', () => {
  const { world, household, thomas, elena } = founding('custom-auto');
  elena.auto = true;
  elena.order = { chore: 'hunt-timber', mode: 'foot' };
  advanceAuto(world, deps);
  assert.notEqual(elena.chore?.id, 'hunt-timber', 'auto sent her hunting with him at home');
  assert.equal(elena.chore?.id, 'keep-house', 'a woman on auto at home did not keep house meanwhile');
  assert.match(elena.order.held, /men's work/);
  // He goes to the war; once the house is kept she takes the rifle.
  thomas.service = { kind: 'regular', status: 'serving', since: 0, siteId: 'gonzales' };
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  for (let tick = 0; tick < 30 && elena.chore?.id !== 'hunt-timber'; tick++) stepWorld(world);
  assert.equal(elena.chore?.id, 'hunt-timber', `she never took up the hunt: ${elena.order?.held}`);
});

test('a man coming home in the middle of her work lets it finish; her next is refused', () => {
  const { world, household, thomas, elena } = founding('custom-home');
  const home = { ...thomas.location };
  thomas.location = { ...thomas.location, siteId: 'gonzales' };
  send(world, household.id, elena.id, 'practise-shooting');
  assert.equal(elena.chore.id, 'practise-shooting');
  thomas.location = home;
  for (let tick = 0; tick < 40 && elena.chore; tick++) stepWorld(world);
  assert.equal(elena.chore, null, 'her work was stopped when he came home');
  assert.ok(world.events.some(event => event.actorId === elena.id && event.text === `${elena.name} finished: practise at the mark.`), 'the practice was never finished');
  assert.match(choreAvailability(world, household, elena, 'practise-shooting').why, /men's work/);
});

test('cattle on the range are the men\'s: a woman minds the hogs while a man is home, works the cattle when none is, and the hogs are everybody\'s', () => {
  const { world, household, thomas, elena } = founding('custom-stock');
  household.herd = { cattle: 6, hogs: 4 };
  // A man home: she may go, and minds the hogs only, on foot.
  send(world, household.id, elena.id, 'look-to-stock');
  assert.equal(elena.chore.hogsOnly, true);
  assert.ok(!(elena.chore.with || []).includes('horse'), 'she took the horse to the cattle');
  for (let tick = 0; tick < 40 && elena.chore; tick++) stepWorld(world);
  assert.ok(world.events.some(event => event.actorId === elena.id && /minded the hogs/.test(event.text)), 'she worked the cattle with him at home');
  // No hogs to mind: refused, in the custom's words.
  household.herd = { cattle: 6, hogs: 0 };
  const day = Math.floor(world.minute / 1440);
  elena.herding = { days: 1, last: day - 1 };
  assert.match(choreAvailability(world, household, elena, 'look-to-stock').why, new RegExp(`^Working the cattle is men's work, and ${thomas.name} is at home\\.$`));
  // He is gone: the cattle are hers, by necessity, and said so once.
  thomas.health = { condition: 'dead' };
  assert.equal(choreAvailability(world, household, elena, 'look-to-stock').can, true);
  send(world, household.id, elena.id, 'look-to-stock');
  assert.equal(elena.chore.hogsOnly, undefined);
  assert.ok(world.events.some(event => event.text === `With ${thomas.name} dead, ${elena.name} rode out after the cattle herself.`));
});

test('the families nobody plays keep the custom too: no woman of them begins men\'s work while a man of hers is home', () => {
  const world = createGonzalesWorld('custom-director', 8, { neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  const seen = new Map();
  let begun = 0, women = 0, helping = 0;
  for (let tick = 0; tick < 700; tick++) {
    const before = new Map(Object.values(world.entities).filter(one => one.kind === 'person' && one.householdId).map(one => [one.id, one.chore?.id || null]));
    // What the custom says the moment before the tick, for each woman.
    const refusedBefore = new Map();
    for (const household of Object.values(world.households)) {
      for (const id of household.members) {
        const person = world.entities[id];
        if (person.sex !== 'female' || person.chore) continue;
        refusedBefore.set(id, Object.fromEntries(Object.keys(CUSTOM).filter(chore => CUSTOM[chore][0] === 'men').map(chore => [chore, customRefusal(world, household, person, chore, null)])));
      }
    }
    stepWorld(world);
    for (const [id, was] of before) {
      const person = world.entities[id];
      const now = person.chore?.id;
      if (!now || now === was) continue;
      begun++;
      if (person.sex === 'female') women++;
      // Joining a man of hers at it is help, not lead (owner, 2026-10-04): allowed, and marked with whom.
      const helped = world.entities[person.chore.helping];
      if (helped?.sex === 'male' && helped.householdId === person.householdId) { helping++; continue; }
      if (person.sex === 'female' && CUSTOM[now]?.[0] === 'men' && refusedBefore.get(id)?.[now]) seen.set(id, `${now}: ${refusedBefore.get(id)[now]}`);
    }
  }
  assert.ok(begun > 20 && women > 3, `the families did too little to prove anything: ${begun} works begun, ${women} by women`);
  assert.deepEqual([...seen.values()], [], 'a woman of a family nobody plays took up men\'s work with a man at home');
  // And they do help (owner, 2026-10-04, "Help, not lead"): the director's women join the men at the house and the clearing.
  assert.ok(helping > 0, 'no woman of a family nobody plays ever helped a man of hers');
});

// ------------------------------------------------------------------------------------------------ the owner's answers of 2026-10-04
// Help, not lead (issues 1 and 5), and only while serving (issue 6): docs/BALANCE.md §23, docs/CUSTOMARY_WORK.md §1c.

/** Tick until this holds, or fail saying what never happened. */
const until = (world, holds, cap, what) => { for (let tick = 0; tick < cap && !holds(); tick++) stepWorld(world); assert.ok(holds(), what); };
/** How many ticks this person takes to finish the work in hand. */
const ticksToFinish = (world, person, cap = 600) => { let tick = 0; for (; tick < cap && person.chore; tick++) stepWorld(world); assert.equal(person.chore, null, `${person.name} never finished`); return tick; };

test('help, not lead: a woman or girl of ten joins the men\'s work a man is at - drawn as help, the work faster - and never begins it', () => {
  const { world, household, thomas, elena, rosa } = founding('custom-help');
  household.tools = { ...household.tools, axe: 0 };
  rosa.age = 12; rosa.sex = 'female';
  const listed = (person, id) => view(world, household.id).work[person.id].find(entry => entry.id === id);
  // Nobody of the men's custom at it: not hers to begin, not on her bar, refused in the custom's words.
  assert.equal(listed(elena, 'fence-yard'), undefined, 'the yard is on her bar with nobody at it');
  assert.throws(() => send(world, household.id, elena.id, 'fence-yard'), /men's work/);
  send(world, household.id, thomas.id, 'fence-yard');
  // He is at it: on her bar and her daughter's, open, as help - whose it is said, no place asked on the map.
  for (const person of [elena, rosa]) {
    const entry = listed(person, 'fence-yard');
    assert.ok(entry?.can, `${person.name} may not help him: ${choreAvailability(world, household, person, 'fence-yard').why}`);
    assert.equal(entry.help, thomas.id, 'the work is not marked as help with him');
  }
  const icon = panelActions({ entity: elena, offered: view(world, household.id).work[elena.id], catalogue: catalogue(), settable: true, nameOf: id => world.entities[id]?.given || world.entities[id]?.name })
    .find(one => one.key === 'fence-yard');
  assert.ok(icon?.help && icon.can && !icon.onMap, 'the help is not drawn as help on her bar');
  assert.match(icon.note, new RegExp(`^Helps ${thomas.given || thomas.name}`));
  // A girl under ten does not help.
  rosa.age = 9;
  assert.equal(listed(rosa, 'fence-yard'), undefined, 'a girl of nine was offered the men\'s work');
  rosa.age = 12;
  // She joins him: alongside, marked as helping him, and the yard goes up sooner than his alone.
  const twin = structuredClone(world);
  send(world, household.id, elena.id, 'fence-yard');
  assert.equal(elena.chore.alongside, thomas.id);
  assert.equal(elena.chore.helping, thomas.id);
  const together = ticksToFinish(world, thomas), alone = ticksToFinish(twin, twin.entities[thomas.id]);
  assert.ok(together < alone, `her hands did not speed the yard: ${together} ticks with her, ${alone} alone`);
  assert.equal(elena.chore, null, 'she went on after the yard was up');
  validateWorld(world);
});

test('help, not lead, the other way: a man or boy of ten joins the women\'s work a woman is at, and never begins it', () => {
  const { world, household, thomas, elena, mateo } = founding('custom-help-house');
  mateo.age = 12; mateo.sex = 'male';
  for (const person of [thomas, mateo]) assert.match(choreAvailability(world, household, person, 'keep-house').why, /women's work/, `${person.name} may begin keeping house with her at home`);
  send(world, household.id, elena.id, 'keep-house');
  for (const person of [thomas, mateo]) {
    const said = choreAvailability(world, household, person, 'keep-house');
    assert.ok(said.can && said.help === elena.id, `${person.name} may not help her keep house: ${said.why}`);
  }
  // A boy of eight does not help (keeping house is a child's work for a lone parent, so his age is the help's own to refuse).
  mateo.age = 8;
  assert.equal(choreAvailability(world, household, mateo, 'keep-house').can, false, 'a boy of eight helps his mother keep house');
  mateo.age = 12;
  send(world, household.id, thomas.id, 'keep-house');
  assert.equal(thomas.chore.alongside, elena.id);
  assert.equal(thomas.chore.helping, elena.id);
  ticksToFinish(world, elena);
  // Kept once, by her: and nobody begins it again today.
  assert.equal(household.housekept.by, elena.id);
  assert.equal(thomas.chore, null);
  // The wash, whose steps are long enough for more hands to shorten (ceiling: the house's and the garden's steps are a tick each).
  world.washBase = Math.floor(world.minute / 1440) - 7;
  send(world, household.id, elena.id, 'wash-clothes');
  const twin = structuredClone(world);
  send(world, household.id, mateo.id, 'wash-clothes');
  assert.equal(mateo.chore.helping, elena.id);
  const together = ticksToFinish(world, elena), alone = ticksToFinish(twin, twin.entities[elena.id]);
  assert.ok(together < alone, `his hands did not speed the wash: ${together} ticks with him, ${alone} alone`);
});

test('help at work each puts their own hands into: she helps raise the house while he is at it, and leaves off when he does', () => {
  // No son of twelve or more: the father is the only keeper of the men's custom (a boy of twelve keeps it with him gone, owner 2026-10-05).
  const { world, household } = rolled('both', { seed: 'custom-help-raise', want: (w, h) => !h.members.some(id => w.entities[id].sex === 'male' && w.entities[id].kin?.role !== 'father' && w.entities[id].age >= BOY_KEEPS_FROM) });
  const father = roleOf(world, household, 'father'), mother = roleOf(world, household, 'mother');
  household.improvements = { ...household.improvements, cabin: undefined };
  applyAction(world, household.id, { action: 'plan-house', layout: 'jacal' });
  assert.ok(household.house, 'no house planned');
  assert.throws(() => send(world, household.id, mother.id, 'build-house'), /men's work/);
  send(world, household.id, father.id, 'build-house');
  send(world, household.id, mother.id, 'build-house');
  assert.equal(mother.chore.helping, father.id, 'she is not marked as helping him');
  assert.ok(world.events.some(event => event.text === `${mother.name} went to help ${father.given || father.name}: work on the house.`), 'the help is not said');
  until(world, () => mother.chore?.step >= 1 && mother.chore.wait > 0, 200, 'she never got to work on the house');
  // He leaves off: she finishes the spell in hand and leaves off too - a helper never leads.
  applyAction(world, household.id, { action: 'stop-chore', entityId: father.id });
  until(world, () => !mother.chore, 200, 'she went on building with him gone from it');
  assert.ok(world.events.some(event => event.text === `${mother.name} left off work on the house: ${father.given || father.name} is no longer at it.`), 'her leaving off is not said');
  // With him gone from home the house is hers by necessity, and she keeps at it.
  send(world, household.id, father.id, 'build-house');
  send(world, household.id, mother.id, 'build-house');
  father.health = { condition: 'dead' };
  father.chore = null;
  const from = world.events.length;
  let hers = false;
  for (let tick = 0; tick < 600 && mother.chore; tick++) { stepWorld(world); if (mother.chore?.id === 'build-house' && mother.chore.helping === undefined) hers = true; }
  assert.ok(hers, 'still marked as help when the work is hers by necessity');
  assert.ok(!world.events.slice(from).some(event => event.actorId === mother.id && /left off/.test(event.text)), 'she left off with nobody of the men\'s custom at home');
  assert.ok(houseBuilt(household), 'she never finished the house by necessity');
  validateWorld(world);
});

test('only while serving: a man sent for or deserted and home again keeps the custom; serving or a prisoner, he is away', () => {
  for (const status of ['released', 'deserted', 'serving', 'prisoner']) {
    const { world, household, thomas, elena } = founding(`custom-service-${status}`);
    thomas.service = { kind: 'regular', status, since: 0, until: 10, siteId: 'san-felipe', acres: 0 };
    const away = ['serving', 'prisoner'].includes(status);
    const said = choreAvailability(world, household, elena, 'hunt-timber');
    assert.equal(said.can, away, `${status}: ${said.why}`);
    if (!away) assert.match(said.why, new RegExp(`${thomas.name} is at home`));
  }
});

test('a small family keeps no custom: fewer than six living, every work is anybody\'s, said once; six or more keep it', () => {
  // The owner, 2026-10-04, by multiple choice: "Fewer than 6". The founding four with their two little ones are six (`founding`).
  const { world, household, thomas, elena } = founding('custom-small');
  assert.equal(choreAvailability(world, household, elena, 'hunt-timber').can, false, 'a family of six did not keep the custom');
  // One little one dies: five living, and the custom is gone, with Thomas at home.
  world.entities[`${household.id}-little-1`].health = { condition: 'dead' };
  assert.equal(household.members.length, 6, 'the dead are still the family\'s members');
  const open = choreAvailability(world, household, elena, 'hunt-timber');
  assert.equal(open.can, true, `a family of five living kept the custom: ${open.why}`);
  assert.equal(choreAvailability(world, household, thomas, 'keep-house').can, true, 'the women\'s work was not open to the father of a small family');
  assert.equal(customRefusal(world, household, elena, 'fell-trees', homeWork), null);
  // Said once in the family's story, for the family's size, not for anybody away.
  const from = world.events.length;
  send(world, household.id, elena.id, 'hunt-timber');
  const said = world.events.slice(from).filter(event => event.actorId === elena.id && /took up the rifle/.test(event.text));
  assert.deepEqual(said.map(event => event.text), [`With so few hands in the family, ${elena.given || elena.name} took up the rifle.`]);
  validateWorld(world);
  // The two little ones away in town are still the family's: six, and the custom kept. Only the dead are not counted.
  world.entities[`${household.id}-little-1`].health = { condition: 'well' };
  world.entities[`${household.id}-little-1`].travel = { to: 'gonzales' };
  assert.equal(choreAvailability(world, household, elena, 'fell-trees').can, false, 'somebody away was not counted in the family');
});

// ------------------------------------------------------------------------------------------------ the owner's answer of 2026-10-05
// "Boys 12+ carry it" (docs/CUSTOMARY_WORK.md §1f): the owner played a family of nine whose father was away with the volunteers at
// Gonzales and said "The gendered work seems to have disappeared" - his daughter of ten could fell trees, and the children kept house
// beside their mother. Verbatim: "With no grown man home, a son of 12–15 keeps the men's work and the others may only help him. Only if
// no such boy is home does it open, and then to the mother or grown women only, never girls. Children keep house only when no grown
// woman is home."

/**
 * The owner's family as he played it: Jesse 34 and Elizabeth 32; Hiram 15, Sally 13, Joseph 11, Peter 10, Lydia 10, Adela 7 and
 * Harriet 6 - the founding four of hh-1 made into them, and five more. `away` sends Jesse off: 'help' (gone with the volunteers, the
 * family's own call), 'serving' (enlisted).
 */
function ownersFamily(seed, away = 'help') {
  const world = createSettledWorld(seed, 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.resources.powder = 6;
  household.tools = { ...household.tools, axe: 0 };
  const site = world.map.sites[household.homeSiteId];
  const shape = { jesse: ['thomas', 34, 'male', 'father'], elizabeth: ['elena', 32, 'female', 'mother'], hiram: ['rosa', 15, 'male', 'son'], sally: ['mateo', 13, 'female', 'daughter'],
    joseph: [null, 11, 'male', 'son'], peter: [null, 10, 'male', 'son'], lydia: [null, 10, 'female', 'daughter'], adela: [null, 7, 'female', 'daughter'], harriet: [null, 6, 'female', 'daughter'] };
  const family = {};
  for (const [given, [was, age, sex, role]] of Object.entries(shape)) {
    const name = given[0].toUpperCase() + given.slice(1);
    let person = was && world.entities[`hh-1-${was}`];
    if (!person) {
      const id = `hh-1-${given}`;
      person = world.entities[id] = { id, kind: 'person', householdId: household.id, depth: 'moderate', principal: false, location: { x: site.x, y: site.y, siteId: site.id },
        travel: null, health: { condition: 'well' }, task: 'rest', skills: {}, chore: null, kin: { role, spouse: null, parents: [], children: [] },
        relationships: {}, propertyRefs: [], commitments: [] };
      household.members.push(id);
    }
    Object.assign(person, { name, given: name, age, sex, kin: { ...person.kin, role }, skills: { ...person.skills, hunting: 1 } });
    family[given] = person;
  }
  assert.equal(household.members.length, 9);
  const { jesse } = family;
  if (away === 'help') { jesse.task = 'help'; jesse.location = { ...jesse.location, siteId: 'gonzales' }; }
  if (away === 'serving') { jesse.service = { kind: 'auxiliary-war', status: 'serving', since: 0, siteId: 'gonzales' }; jesse.location = { ...jesse.location, siteId: 'gonzales' }; }
  return { world, household, ...family };
}
const opened = world => world.events.filter(event => event.claimId === 'FIC-GONZ-1151').map(event => event.text);

test('boys 12+ carry it: with the father away, the son of fifteen keeps the men\'s work; his mother and sisters may only help him, and nothing opens', () => {
  for (const away of ['help', 'serving']) {
    const { world, household, hiram, elizabeth, sally, joseph, peter, lydia, adela } = ownersFamily(`custom-boys-${away}`, away);
    // Hiram keeps it: his mother and his sisters are refused it in words that name him, and it is not on their bars.
    for (const person of [elizabeth, sally, lydia]) {
      for (const work of ['fell-trees', 'fence-yard', 'hunt-timber', 'cut-lane']) {
        const said = choreAvailability(world, household, person, work);
        assert.equal(said.can, false, `${away}: ${person.name} may ${work} with Hiram at home`);
        assert.equal(customRefusal(world, household, person, work), `${CUSTOM[work][1]} is men's work, and Hiram is at home.`, `${away}: ${person.name}`);
      }
      assert.equal(view(world, household.id).work[person.id].find(entry => entry.id === 'fell-trees'), undefined, `${away}: felling is on ${person.name}'s bar`);
    }
    // The boys follow it as their own: Hiram, and Joseph and Peter, who keep it from nobody.
    for (const boy of [hiram, joseph, peter]) assert.equal(customRefusal(world, household, boy, 'fence-yard'), null, `${away}: ${boy.name} was refused the men's work`);
    // Hiram at the yard: his mother and sisters of ten or more may join him as help, never lead; a girl of seven may not.
    send(world, household.id, hiram.id, 'fence-yard');
    for (const person of [elizabeth, sally, lydia]) {
      const said = choreAvailability(world, household, person, 'fence-yard');
      assert.ok(said.can && said.help === hiram.id, `${away}: ${person.name} may not help Hiram: ${said.why}`);
    }
    assert.equal(choreAvailability(world, household, adela, 'fence-yard').can, false, `${away}: a girl of seven helps at the yard`);
    send(world, household.id, elizabeth.id, 'fence-yard');
    assert.equal(elizabeth.chore.helping, hiram.id);
    // The boy leads: nothing opened, so the story says nothing of necessity.
    assert.deepEqual(opened(world), [], `${away}: a line of necessity with the boy keeping it`);
    validateWorld(world);
  }
});

test('boys 12+ carry it: with no son of twelve home it opens to the mother only, never the girls, who may help her; and the line says why', () => {
  const { world, household, hiram, elizabeth, sally, joseph, lydia } = ownersFamily('custom-boys-open');
  // Hiram gone to town: Joseph is eleven and Peter ten, and nobody keeps it. Elizabeth may take it up, by necessity, as her own.
  hiram.location = { ...hiram.location, siteId: 'gonzales' };
  const hers = choreAvailability(world, household, elizabeth, 'fence-yard');
  assert.ok(hers.can && !hers.help, `the mother may not take up the yard with no son of twelve home: ${hers.why}`);
  // The girls may not, in words that say whose it is now.
  for (const girl of [sally, lydia]) {
    assert.equal(choreAvailability(world, household, girl, 'fence-yard').can, false, `${girl.name}, ${girl.age}, took up the men's work by necessity`);
    assert.equal(customRefusal(world, household, girl, 'fell-trees'), 'Felling is men\'s work; with no man at home it falls to Elizabeth.');
  }
  // The younger boys follow it as their own, as with their father home.
  assert.equal(customRefusal(world, household, joseph, 'fell-trees'), null);
  send(world, household.id, elizabeth.id, 'fence-yard');
  assert.equal(elizabeth.chore.helping, undefined, 'the mother is marked as helping at work that is hers by necessity');
  assert.deepEqual(opened(world), ['With Jesse away with the volunteers and Hiram gone to town, Elizabeth split the rails herself.']);
  // A girl may help her mother at it, and only help.
  const help = choreAvailability(world, household, sally, 'fence-yard');
  assert.ok(help.can && help.help === elizabeth.id, `a girl may not help her mother at the men's work: ${help.why}`);
  send(world, household.id, sally.id, 'fence-yard');
  assert.equal(sally.chore.helping, elizabeth.id);
  assert.equal(opened(world).length, 1, 'a girl helping was said to take it up by necessity');
  // The cattle on horseback likewise: the mother's now, the girl's never - she minds the hogs.
  household.herd = { cattle: 6, hogs: 4 };
  assert.equal(herdWorkHere(world, household, elizabeth), 'all');
  assert.equal(herdWorkHere(world, household, sally), 'hogs', 'a girl of thirteen worked the cattle by necessity');
  // With the mother gone to town too, nobody grown is home: it waits for her, and the boy of eleven may still do it as his own.
  elizabeth.chore = null; sally.chore = null;
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  assert.equal(customRefusal(world, household, sally, 'fell-trees'), 'Felling is men\'s work; with no man at home it waits for a grown woman.');
  assert.equal(choreAvailability(world, household, joseph, 'practise-shooting').can, true, choreAvailability(world, household, joseph, 'practise-shooting').why);
  validateWorld(world);
});

test('boys 12+ carry it: "With Jesse away with the volunteers and no son old enough, Elizabeth took up the axe."', () => {
  const { world, household, hiram, sally, elizabeth } = ownersFamily('custom-boys-line');
  // No son of twelve to fifteen at all: Hiram and Sally made younger, so the sons of ten or more are eleven and ten.
  hiram.age = 9; sally.age = 8;
  beginChore(world, household, elizabeth, 'cut-bee-tree', deps);
  assert.deepEqual(opened(world), ['With Jesse away with the volunteers and no son old enough, Elizabeth took up the axe.']);
});

test('children keep house only when no grown woman is home: not beside their mother with the father away, even at the men\'s work; with no woman home, yes', () => {
  const { world, household, hiram, elizabeth, sally, joseph, adela, harriet } = ownersFamily('custom-children-house');
  // The father away with the volunteers and the mother home: the children of seven to nine keep their own works, not the house.
  for (const id of ['keep-house', 'wash-clothes']) {
    assert.equal(choreAvailability(world, household, adela, id).can, false, `a girl of seven may ${id} beside her mother`);
    assert.equal(view(world, household.id).work[adela.id].find(entry => entry.id === id), undefined, `${id} is on Adela's bar with her mother home`);
    // A boy of eleven may help his mother at it, not begin it.
    assert.match(choreAvailability(world, household, joseph, id).why, /women's work, and Elizabeth is at home/);
  }
  // The mother at the men's work by necessity (Hiram away), still home: the children still do not keep house (the owner's words,
  // taken literally; a question put to him, docs/CUSTOMARY_WORK.md §1f).
  hiram.location = { ...hiram.location, siteId: 'gonzales' };
  send(world, household.id, elizabeth.id, 'fence-yard');
  assert.equal(choreAvailability(world, household, adela, 'keep-house').can, false, 'a child kept house with her mother at the men\'s work at home');
  // The mother gone to town too: no grown woman at home - and Sally, thirteen, keeps the women's work (owner, 2026-10-05, "Let a
  // daughter of 12-15 keep the women's work too"), so the little ones still do not keep house.
  elizabeth.chore = null;
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  assert.equal(choreAvailability(world, household, adela, 'keep-house').why, 'Adela is too young to keep house while Sally is at home.');
  // Sally gone with her: nobody keeps it, and the children of seven keep house and wash.
  sally.location = { ...sally.location, siteId: 'gonzales' };
  for (const id of ['keep-house', 'wash-clothes']) assert.equal(choreAvailability(world, household, adela, id).can, true, `${id}: ${choreAvailability(world, household, adela, id).why}`);
  assert.equal(choreAvailability(world, household, harriet, 'keep-house').can, false, 'a child of six keeps house');
});

test('boys 12+ carry it on auto: the son takes up the men\'s work he is set to, and the mother on auto at it keeps house while he is home', () => {
  const { world, household, hiram, elizabeth } = ownersFamily('custom-boys-auto');
  for (const person of [hiram, elizabeth]) { person.auto = true; person.order = { chore: 'practise-shooting', mode: 'foot' }; }
  advanceAuto(world, deps);
  assert.equal(hiram.chore?.id, 'practise-shooting', `the boy on auto did not take up the men's work: ${hiram.order?.held}`);
  assert.notEqual(elizabeth.chore?.id, 'practise-shooting', 'the mother on auto took up the men\'s work with her son of fifteen home');
  assert.equal(elizabeth.chore?.id, 'keep-house', 'the mother on auto did not keep house meanwhile');
  assert.match(elizabeth.order.held, /Hiram is at home/);
});

test('boys 12+ carry it in the families nobody plays: with the father away, the son of twelve does the men\'s work and no woman or girl begins it', () => {
  const world = createGonzalesWorld('custom-director-boys', 8, { neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  // Every family of six or more with a son of twelve to fifteen and no grown son: its father away with the volunteers, serving (a
  // father given `task: 'help'` by hand here is set back to work at the first tick, which would prove nothing).
  const boys = new Set();
  const sentAway = [];
  for (const household of Object.values(world.households)) {
    const people = household.members.map(id => world.entities[id]);
    const father = people.find(person => person.kin?.role === 'father');
    const boy = people.filter(person => person.sex === 'male' && person.age >= BOY_KEEPS_FROM && person.age < 16);
    if (!father || people.length < 6 || !boy.length || people.some(person => person !== father && person.sex === 'male' && person.age >= 16)) continue;
    father.service = { kind: 'auxiliary-war', status: 'serving', since: 0, siteId: 'gonzales' };
    father.location = { ...father.location, siteId: 'gonzales' };
    sentAway.push(father);
    for (const one of boy) boys.add(one.id);
  }
  assert.ok(sentAway.length >= 2, `too few families of that shape to prove anything: ${sentAway.length}`);
  const wrong = [];
  let boysAtIt = 0;
  for (let tick = 0; tick < 500; tick++) {
    const before = new Map([...boys, ...sentAway.flatMap(father => world.households[father.householdId].members)].map(id => [id, world.entities[id].chore?.id || null]));
    stepWorld(world);
    for (const [id, was] of before) {
      const person = world.entities[id];
      const now = person.chore?.id;
      if (!now || now === was || CUSTOM[now]?.[0] !== 'men') continue;
      if (boys.has(id)) boysAtIt++;
      else if (person.sex === 'female' && !person.chore.helping) wrong.push(`${person.name}, ${person.age}: ${now}`);
    }
    for (const father of sentAway) assert.equal(father.service?.status, 'serving', 'the father came home, so this proves nothing');
  }
  assert.deepEqual(wrong, [], 'a woman or girl of a family nobody plays began men\'s work with a son of twelve at home');
  assert.ok(boysAtIt > 0, 'no son of twelve to fifteen was ever set to the men\'s work with his father away');
});

// ------------------------------------------------------------------------------------------------ the owner's answer of 2026-10-05, again
// "Let a daughter of 12–15 keep the women's work too" (docs/CUSTOMARY_WORK.md §1f): the mirror of "Boys 12+ carry it". With no grown
// woman home and able, a daughter of twelve to fifteen keeps the women's work and the others - her father and brothers too - may only
// help her; with no such girl it opens to the grown men only, never boys; children keep house only with no keeper of it home.

test('a daughter of twelve keeps the women\'s work: with the mother in town, Sally keeps house and her father and brother may only help her', () => {
  const { world, household, jesse, elizabeth, hiram, sally, joseph, lydia, adela } = ownersFamily('custom-girls', 'home');
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  household.resources.food = 200;
  // Sally keeps it: her father and her brothers are refused it in words that name her, and it is not on their bars.
  for (const person of [jesse, hiram, joseph]) {
    for (const work of ['keep-house', 'work-garden', 'wash-clothes', 'nurse-home']) {
      assert.equal(customRefusal(world, household, person, work), `${CUSTOM[work][1]} is women's work, and Sally is at home.`, `${person.name}, ${work}`);
    }
    assert.equal(view(world, household.id).work[person.id].find(entry => entry.id === 'keep-house'), undefined, `keeping house is on ${person.name}'s bar`);
  }
  // The girls follow it as their own: Sally, and Lydia, ten, who keeps it from nobody; Adela, seven, keeps no house while Sally is home.
  for (const girl of [sally, lydia]) assert.equal(customRefusal(world, household, girl, 'work-garden'), null, `${girl.name} was refused the women's work`);
  assert.equal(choreAvailability(world, household, adela, 'keep-house').can, false, 'a girl of seven kept house with her sister of thirteen home');
  // The house's cue points at her, not at her father.
  assert.deepEqual(houseCue(world, household), { personId: sally.id, work: 'keep-house' });
  // Sally at the house: her father and her brothers of ten or more may join her as help, never lead.
  send(world, household.id, sally.id, 'keep-house');
  for (const person of [jesse, hiram, joseph]) {
    const said = choreAvailability(world, household, person, 'keep-house');
    assert.ok(said.can && said.help === sally.id, `${person.name} may not help Sally: ${said.why}`);
  }
  send(world, household.id, jesse.id, 'keep-house');
  assert.equal(jesse.chore.helping, sally.id);
  assert.deepEqual(opened(world), [], 'a line of necessity with the girl keeping it');
  validateWorld(world);
});

test('a daughter of twelve keeps the women\'s work: with no such girl home it opens to the father only, never the boys, who may help him; and the line says why', () => {
  const { world, household, jesse, elizabeth, hiram, sally, lydia, adela } = ownersFamily('custom-girls-open', 'home');
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  sally.location = { ...sally.location, siteId: 'gonzales' };
  // Nobody keeps it: Jesse may take up the garden, by necessity, as his own; Hiram, fifteen, may not.
  const his = choreAvailability(world, household, jesse, 'work-garden');
  assert.ok(his.can && !his.help, `the father may not take up the garden with no daughter of twelve home: ${his.why}`);
  assert.equal(customRefusal(world, household, hiram, 'work-garden'), 'The kitchen garden is women\'s work; with no woman at home it falls to Jesse.');
  // Lydia, ten, follows it as her own.
  assert.equal(customRefusal(world, household, lydia, 'work-garden'), null);
  send(world, household.id, jesse.id, 'work-garden');
  assert.equal(jesse.chore.helping, undefined, 'the father is marked as helping at work that is his by necessity');
  assert.deepEqual(opened(world), ['With Elizabeth and Sally gone to town, Jesse worked the garden himself.']);
  // A boy may help his father at it, and only help.
  const help = choreAvailability(world, household, hiram, 'work-garden');
  assert.ok(help.can && help.help === jesse.id, `a boy may not help his father at the women's work: ${help.why}`);
  // The children keep house and wash now - Adela of seven, and Hiram too (the children's own rule, `childKeeps`).
  for (const child of [adela, hiram]) assert.equal(choreAvailability(world, household, child, 'keep-house').can, true, `${child.name}: ${choreAvailability(world, household, child, 'keep-house').why}`);
  // With the father away too, nobody grown is home: the garden waits for him.
  jesse.chore = null;
  jesse.location = { ...jesse.location, siteId: 'gonzales' };
  assert.equal(customRefusal(world, household, hiram, 'work-garden'), 'The kitchen garden is women\'s work; with no woman at home it waits for a grown man.');
  validateWorld(world);
});

test('a daughter of twelve keeps the women\'s work: "With Elizabeth gone to town and no daughter old enough, Jesse worked the garden himself."', () => {
  const { world, household, jesse, elizabeth, sally } = ownersFamily('custom-girls-line', 'home');
  // No daughter of twelve to fifteen at all: Sally made younger, so the daughters of ten or more are Lydia, ten.
  sally.age = 9;
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  beginChore(world, household, jesse, 'work-garden', deps);
  assert.deepEqual(opened(world), ['With Elizabeth gone to town and no daughter old enough, Jesse worked the garden himself.']);
});

test('a daughter of twelve keeps the women\'s work on auto: the father on auto whose task waits does not keep house while she is home', () => {
  const { world, household, jesse, elizabeth, sally } = ownersFamily('custom-girls-auto', 'home');
  elizabeth.location = { ...elizabeth.location, siteId: 'gonzales' };
  for (const person of [jesse, sally]) { person.auto = true; person.order = { chore: 'work-garden', mode: 'foot' }; }
  advanceAuto(world, deps);
  assert.equal(sally.chore?.id, 'work-garden', `the girl on auto did not take up the women's work: ${sally.order?.held}`);
  assert.notEqual(jesse.chore?.id, 'work-garden', 'the father on auto took up the women\'s work with his daughter of thirteen home');
  assert.match(jesse.order.held || '', /Sally is at home/);
});

test('a daughter of twelve keeps the women\'s work in the families nobody plays: with the mother gone, no man or boy begins it while she is home', () => {
  const world = createGonzalesWorld('custom-director-girls', 8, { neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  // Every family of seven or more with a daughter of eight to fifteen and no grown daughter: its mother dead, so six or more live,
  // and its eldest such daughter made thirteen if she is younger (a family with one of twelve already is rare on any seed).
  const girls = new Set();
  const families = [];
  for (const household of Object.values(world.households)) {
    const people = household.members.map(id => world.entities[id]);
    const mother = people.find(person => person.kin?.role === 'mother');
    const daughters = people.filter(person => person.sex === 'female' && person !== mother && person.age >= 8 && person.age < 16).sort((x, y) => y.age - x.age);
    if (!mother || people.length < 7 || !daughters.length || people.some(person => person !== mother && person.sex === 'female' && person.age >= 16)) continue;
    if (daughters[0].age < GIRL_KEEPS_FROM) daughters[0].age = 13;
    const girl = daughters.filter(person => person.age >= GIRL_KEEPS_FROM);
    mother.health = { condition: 'dead' };
    families.push(household);
    for (const one of girl) girls.add(one.id);
  }
  assert.ok(families.length >= 2, `too few families of that shape to prove anything: ${families.length}`);
  const wrong = [];
  let girlsAtIt = 0;
  for (let tick = 0; tick < 200; tick++) {
    const before = new Map(families.flatMap(household => household.members).map(id => [id, world.entities[id].chore?.id || null]));
    // Whether a daughter of twelve is at home and able the moment before, read from the world and not from the rule under test: a man
    // or boy beginning women's work then, not helping, is the fault.
    const keeping = new Map(families.map(household => [household.id, household.members.some(id => girls.has(id) && !world.entities[id].travel
      && world.entities[id].location?.siteId === household.homeSiteId && !['dead', 'captured', 'sick', 'wounded'].includes(world.entities[id].health?.condition))]));
    stepWorld(world);
    for (const [id, was] of before) {
      const person = world.entities[id];
      const now = person.chore?.id;
      if (!now || now === was || CUSTOM[now]?.[0] !== 'women') continue;
      if (girls.has(id)) girlsAtIt++;
      else if (person.sex === 'male' && !person.chore.helping && keeping.get(person.householdId)) wrong.push(`${person.name}, ${person.age}: ${now}`);
    }
  }
  assert.deepEqual(wrong, [], 'a man or boy of a family nobody plays began women\'s work with a daughter of twelve at home');
  assert.ok(girlsAtIt > 0, 'no daughter of twelve to fifteen was ever set to the women\'s work with her mother gone');
});
