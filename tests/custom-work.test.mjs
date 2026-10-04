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
import { CUSTOM, customOf, customRefusal } from '../sim/custom.mjs';
import { STEPS } from '../sim/lesson.mjs';
import { advanceAuto } from '../sim/auto.mjs';
import { createSettledWorld, settle } from './support/settled.mjs';
import { barIcons, customWords, panelActions } from '../public/family-panel.js';
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
  return { world, household, thomas, elena, rosa, mateo };
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
      const fits = shape === 'both' ? has.father && has.mother : shape === 'mother' ? has.mother && !has.father : has.father && !has.mother;
      // No grown child of the other sex: a lone mother's family has no man of sixteen or over at all.
      const grownOther = people.some(person => person.age >= 16 && !['father', 'mother'].includes(person.kin?.role) && person.sex === (shape === 'mother' ? 'male' : 'female'));
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

test('the rule: men\'s work is refused a mother while the father is at home, in words, marked on the bar; shared work is not', () => {
  const { world, household, thomas, elena } = founding();
  const refused = choreAvailability(world, household, elena, 'hunt-timber');
  assert.equal(refused.can, false);
  assert.match(refused.why, new RegExp(`^Hunting is men's work, and ${thomas.name} is at home\\.$`));
  assert.equal(refused.custom, 'men');
  // The bar keeps it, greyed with its words and the mark (public/family-panel.js reads `custom`).
  // The tick carries only whose work it is; the words are the catalogue's name and the family's `customSays`, sent once, and say the
  // server's refusal word for word.
  const seen = view(world, household.id);
  const entry = seen.work[elena.id].find(one => one.id === 'hunt-timber');
  assert.deepEqual([entry.can, entry.custom, entry.why], [false, 'men', undefined]);
  assert.equal(customWords(entry, catalogue(), seen.household.customSays), refused.why);
  // The server holds the gate, whoever sends it.
  assert.throws(() => send(world, household.id, elena.id, 'hunt-timber'), /men's work/);
  // His own work, and the shared work, are hers and his as they always were.
  assert.equal(choreAvailability(world, household, thomas, 'hunt-timber').can, true);
  for (const id of ['plant-field', 'milk-cow', 'fish-the-water', 'butcher-hog', 'visit-shop']) assert.equal(customOf(id), 'shared', `${id} has a custom`);
  assert.equal(customRefusal(world, household, elena, 'fish-the-water'), null);
  // And the mirror: the women's work is refused him while she is at home.
  assert.match(choreAvailability(world, household, thomas, 'wash-clothes').why, new RegExp(`^The wash is women's work, and ${elena.name} is at home\\.$`));
  assert.equal(choreAvailability(world, household, elena, 'wash-clothes').can, true);
});

test("the bar keeps another's work greyed with its words, after the goals, and lights it the tick it opens", () => {
  const { world, household, thomas, elena } = founding('custom-bar');
  const iconsOf = () => { const seen = view(world, household.id); return panelActions({ entity: elena, offered: seen.work[elena.id], catalogue: catalogue(), customSays: seen.household.customSays, settable: true }); };
  const hunt = iconsOf().find(icon => icon.key === 'hunt-timber');
  assert.deepEqual([hunt.can, hunt.custom], [false, 'men']);
  assert.match(hunt.why, /men's work/);
  const shown = barIcons(iconsOf(), icon => icon.active || icon.can, 6);
  assert.ok(shown.some(icon => icon.key === 'hunt-timber' && icon.custom === 'men'), "the greyed men's work is not on her bar");
  // A goal (something the family could get) keeps its place first.
  const goal = { key: 'goal-x', can: false, goal: true }, custom = { key: 'custom-x', can: false, custom: 'men' }, open = { key: 'open-x', can: true };
  assert.deepEqual(barIcons([custom, goal, open], icon => icon.can, 1).map(icon => icon.key), ['goal-x', 'open-x']);
  thomas.health = { condition: 'dead' };
  const lit = iconsOf().find(icon => icon.key === 'hunt-timber');
  assert.deepEqual([lit.can, lit.custom], [true, undefined], 'the work did not light when nobody of its custom was at home');
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

test('a boy under sixteen follows the men\'s work and keeps it from nobody; a grown son keeps it', () => {
  const { world, household, people } = rolled('both', { want: (w, h) => h.members.some(id => w.entities[id].sex === 'male' && w.entities[id].age >= 10 && w.entities[id].age < 16) });
  const father = roleOf(world, household, 'father'), mother = roleOf(world, household, 'mother');
  const boy = people.find(person => person.sex === 'male' && person.age >= 10 && person.age < 16);
  assert.equal(customRefusal(world, household, boy, 'hunt-timber'), null, 'a boy was refused the men\'s work');
  father.health = { condition: 'dead' };
  // With the father gone the boy keeps nothing from his mother: she may take up the rifle beside him.
  assert.equal(customRefusal(world, household, mother, 'hunt-timber'), null, `a boy of ${boy.age} kept the men's work from his mother`);
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
  let begun = 0, women = 0;
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
      if (person.sex === 'female' && CUSTOM[now]?.[0] === 'men' && refusedBefore.get(id)?.[now]) seen.set(id, `${now}: ${refusedBefore.get(id)[now]}`);
    }
  }
  assert.ok(begun > 20 && women > 3, `the families did too little to prove anything: ${begun} works begun, ${women} by women`);
  assert.deepEqual([...seen.values()], [], 'a woman of a family nobody plays took up men\'s work with a man at home');
});
