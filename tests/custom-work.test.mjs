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
  // No grown son: the father is the only keeper of the men's custom.
  const { world, household } = rolled('both', { seed: 'custom-help-raise', want: (w, h) => !h.members.some(id => w.entities[id].kin?.role === 'son' && w.entities[id].age >= 16) });
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
