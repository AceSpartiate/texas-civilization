// Who acts for a family (owner, 2026-09-28: "fix the blockers", and by multiple choice "The oldest child steps up"; sim/acting.mjs,
// docs/FAMILY_PANEL.md §20). The family's own decisions go to whoever is with it - the main person if they are, else the next grown
// person there, else the oldest child of seven or more - and never to a man away with the army; a family with nobody who can act
// is taken in by its nearest neighbours; anybody left behind follows; a baby never marches; very sick is in bed; a family with
// nobody living holds no clock and wins nothing; and the dead never speak.
//
// Every test here was seen failing alone against the regression it guards (HANDOFF.md, "Who acts for a family").
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { calendarMinutes, TICK_MINUTES } from '../sim/clock.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { hostEnding } from '../sim/ending.mjs';
import { orderOut } from '../sim/scrape.mjs';
import { whoComes } from '../sim/babies.mjs';
import { talkTarget } from '../sim/childhood.mjs';
import { nearestNeighbour } from '../sim/acting.mjs';
import { ageNow } from '../sim/family.mjs';
import { deedsOf, noteDeed } from '../sim/neighbourly.mjs';
import { needsOf } from '../public/family-panel.js';
import { spring, until } from './support/scrape-spring.mjs';
import { sceneFor } from './support/scrape-scene.mjs';
import { taught } from './support/settled.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const person = (world, household, test) => household.members.map(id => world.entities[id]).find(test);
/**
 * The spring class's people have had their birthdays since the autumn (owner, 2026-09-29, D11: ages advance with the calendar;
 * sim/ages.mjs), so a child is found by what the test needs of them, not by the age they were rolled at: the oldest child left
 * under ten, and a child too young to step up. `rolled` is the age somebody had on the class's first day.
 */
const children = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.age >= 2 && one.age < 10 && one.health?.condition !== 'captured').sort((a, b) => b.age - a.age);
const oldestChild = (world, household) => { const one = children(world, household)[0]; assert.ok(one?.age >= 7, `no child of seven to nine is left in ${household.id}`); return one; };
const tooSmall = (world, household) => { const one = children(world, household).find(child => child.age < 7); assert.ok(one, `no child under seven in ${household.id}`); return one; };
const rolled = (world, one) => ageNow(world, one, 0);
const kinds = (world, householdId, id) => needsOf(view(world, householdId), id).map(need => need.kind);
/** With General Houston's army, where the army is: the spring's defining act (interactions audit B1). */
function serve(world, man) {
  const siteId = houstonCamp(world), site = world.map.sites[siteId];
  Object.assign(man, { travel: null, chore: null, task: 'rest', service: { kind: 'houston', status: 'serving', since: world.minute, siteId }, location: { x: site.x, y: site.y, siteId } });
}
/** The spring class with this family played and past its guided start. */
function played(householdId) {
  const world = taught(spring());
  const household = world.households[householdId];
  household.played = true; delete household.absent;
  return { world, household };
}
const orderedOut = (world, household) => until(world, () => household.flight?.status === 'ordered', 400);

test('B1: the father serving with Houston, the order to leave goes to the mother at home - her "!", her answer - and his is refused in words that name her', () => {
  const { world, household } = played('hh-1');
  const father = world.entities[household.principalId];
  const mother = person(world, household, one => one.kin?.role === 'mother');
  serve(world, father);
  // The student starred the father in October, as the page does by default.
  household.mainId = father.id;
  orderedOut(world, household);
  assert.equal(household.flight?.status, 'ordered', 'the family was never told to leave');
  const shown = view(world, household.id).household;
  assert.equal(shown.mainId ?? shown.principalId, father.id, 'the main person moved: only the family decisions should');
  assert.equal(shown.actingId, mother.id, 'the family decisions are not the mother\'s, at home');
  assert.deepEqual(kinds(world, household.id, mother.id).filter(kind => kind === 'flight'), ['flight'], 'no "!" for the order on the mother');
  assert.ok(!kinds(world, household.id, father.id).includes('flight'), 'the "!" for the order is still on the man with the army');
  assert.throws(() => applyAction(world, household.id, { action: 'flee', entityId: father.id, refuge: 'san-felipe', take: {} }), new RegExp(`${mother.name} is with the family, and answers for it`));
  applyAction(world, household.id, { action: 'flee', entityId: mother.id, refuge: 'san-felipe', take: {} });
  assert.equal(household.flight.status, 'fled');
  assert.equal(father.travel?.purpose, undefined, 'the man with the army was put on the family\'s road');
  validateWorld(world);
});

test('B1: soldiers call "¡Alto!" on a family whose father is serving and on auto; the question is the mother\'s, her "run" is taken, and it does not lapse into capture', () => {
  const world = spring();
  const household = world.households['hh-1'];
  const father = world.entities[household.principalId];
  serve(world, father);
  sceneFor(world, { kind: 'cavalry', how: 'wagon', ahead: 1.2, householdId: 'hh-1' });
  household.mainId = father.id;
  // A man with the army on auto-fight (sim/auto.mjs): his switch is his, not his family's on the road.
  father.auto = true;
  const mother = person(world, household, one => one.kin?.role === 'mother');
  for (let t = 0; t < 60 && household.flight.ask?.id !== 'alto' && household.flight.chase?.phase !== 'caught'; t++) stepWorld(world);
  assert.equal(household.flight.ask?.id, 'alto', `the family was never asked to halt (${household.flight.chase?.phase || 'no chase'})`);
  // ¡Alto! is its own kind of "!" since the ranking of 2026-09-28 (public/family-panel.js `NEED_KINDS`), before every other.
  assert.ok(kinds(world, household.id, mother.id).includes('alto'), 'the "¡Alto!" is not on the mother\'s row');
  assert.ok(!kinds(world, household.id, father.id).some(kind => ['road', 'alto'].includes(kind)), 'the "¡Alto!" is on the father with the army');
  assert.throws(() => applyAction(world, household.id, { action: 'road-answer', entityId: father.id, option: 'run' }), /answers for it/);
  applyAction(world, household.id, { action: 'road-answer', entityId: mother.id, option: 'run' });
  assert.equal(household.flight.ask, undefined);
  assert.equal(household.flight.chase?.answer, 'run');
  assert.ok(!world.events.some(event => event.householdId === household.id && event.lapsed && /soldiers/.test(event.text)), 'the soldiers\' question lapsed');
});

test('the oldest child steps up: with everybody of ten or more taken, the order, the road and "¡Alto!" are the seven-year-old\'s; a five-year-old is refused and told who answers', () => {
  const { world, household } = played('hh-3');
  for (const one of household.members.map(id => world.entities[id])) if (one.age >= 10) one.health = { condition: 'captured' };
  const rufino = oldestChild(world, household), small = tooSmall(world, household);
  orderedOut(world, household);
  assert.equal(household.flight?.status, 'ordered');
  const shown = view(world, household.id).household;
  assert.equal(shown.actingId ?? shown.mainId, rufino.id, 'the oldest child does not answer for the family');
  assert.equal(shown.steppedUp, true);
  assert.ok(kinds(world, household.id, rufino.id).includes('flight'), 'the "!" for the order is not on the oldest child');
  assert.throws(() => applyAction(world, household.id, { action: 'flee', entityId: small.id, refuge: 'san-felipe', take: {} }), new RegExp(`too young to answer for the family. ${rufino.name} is the oldest`));
  applyAction(world, household.id, { action: 'flee', entityId: rufino.id, refuge: 'washington', take: {} });
  assert.equal(household.flight.status, 'fled');
  const left = household.members.map(id => world.entities[id]).filter(one => one.health.condition !== 'captured');
  assert.ok(left.every(one => one.travel?.purpose === 'flee' || one.carriedBy || one.travel?.carried), 'a child was left at home');
  validateWorld(world);
});

test('the oldest child answers "¡Alto!" on the road for a family of children', () => {
  const world = spring();
  const household = world.households['hh-3'];
  for (const one of household.members.map(id => world.entities[id])) if (one.age >= 10) one.health = { condition: 'captured' };
  sceneFor(world, { kind: 'cavalry', how: 'wagon', ahead: 1.2, householdId: 'hh-3' });
  const rufino = oldestChild(world, household), small = tooSmall(world, household);
  for (let t = 0; t < 60 && household.flight.ask?.id !== 'alto' && household.flight.chase?.phase !== 'caught'; t++) stepWorld(world);
  assert.equal(household.flight.ask?.id, 'alto', 'the children were never asked to halt');
  assert.throws(() => applyAction(world, household.id, { action: 'road-answer', entityId: small.id, option: 'halt' }), /too young to answer for the family/);
  applyAction(world, household.id, { action: 'road-answer', entityId: rufino.id, option: 'halt' });
  assert.equal(household.flight.ask, undefined);
});

test('with nobody of seven or more, the nearest neighbours take the little ones in; they go where that family goes; and the father home from the army fetches them', () => {
  const { world, household } = played('hh-4');
  const father = world.entities[household.principalId];
  person(world, household, one => one.kin?.role === 'mother').health = { condition: 'dead' };
  serve(world, father);
  stepWorld(world);
  assert.ok(household.takenIn, 'nobody took the girls of 4, 3 and 1 in');
  const host = world.households[household.takenIn.by];
  const girls = household.takenIn.ids.map(id => world.entities[id]);
  assert.equal(girls.length, 3);
  assert.ok(girls.every(one => one.location.siteId === host.homeSiteId), 'the little ones are not at the neighbours\'');
  assert.match(view(world, household.id).household.takenIn.name, /family|’s|'s/);
  assert.throws(() => applyAction(world, household.id, { action: 'flee', entityId: girls[0].id, refuge: 'washington', take: {} }), /goes where they go/);
  // The neighbours are ordered out and go: the girls go with them.
  orderOut(world, host);
  const hostView = view(world, host.id), hostActor = hostView.household;
  applyAction(world, host.id, { action: 'flee', entityId: hostActor.actingId || hostActor.mainId || hostActor.principalId, refuge: hostView.flight.refuges.at(-1).id, take: {} });
  stepWorld(world);
  const leader = host.members.map(id => world.entities[id]).find(one => one.travel?.purpose === 'flee');
  assert.ok(leader, 'the neighbours never set out');
  for (const girl of girls) {
    assert.equal(girl.travel?.to, leader.travel.to, `${girl.name} did not go with the neighbours`);
    assert.ok(Math.hypot(girl.location.x - leader.location.x, girl.location.y - leader.location.y) < 1e-6, `${girl.name} is not with the neighbours on the road`);
  }
  validateWorld(world);
});

test('the family that owes this one most takes the little ones in before a nearer one, and it is written as a deed', () => {
  const { world, household } = played('hh-4');
  person(world, household, one => one.kin?.role === 'mother').health = { condition: 'dead' };
  const nearest = nearestNeighbour(world, household);
  assert.ok(nearest, 'no neighbour family could take anybody in');
  // This family raised walls for every family but the nearest: they all owe it, the nearest owes it nothing.
  for (const other of Object.values(world.households)) if (other.id !== household.id && other.id !== nearest.id) noteDeed(world, { kind: 'raising', fromId: household.id, toId: other.id, hours: 4 });
  const owed = nearestNeighbour(world, household);
  assert.notEqual(owed.id, nearest.id, 'the nearest family came first although it owed nothing');
  serve(world, world.entities[household.principalId]);
  stepWorld(world);
  assert.equal(household.takenIn?.by, owed.id, 'the family that owes most did not take them in');
  assert.ok(deedsOf(world).some(deed => deed.kind === 'shelter' && deed.fromId === owed.id && deed.toId === household.id), 'no deed was written');
  validateWorld(world);
});

test('taken in at the neighbours\' own place, the father sent home from the army comes for the girls and they go home together', () => {
  const { world, household } = played('hh-4');
  const father = world.entities[household.principalId];
  person(world, household, one => one.kin?.role === 'mother').health = { condition: 'dead' };
  serve(world, father);
  stepWorld(world);
  assert.ok(household.takenIn);
  // Home from the army to the empty house (sim/winter.mjs sends a man for whom the family sent to its home).
  const home = world.map.sites[household.homeSiteId];
  delete father.service; father.location = { x: home.x, y: home.y, siteId: home.id };
  for (let t = 0; t < 200 && household.takenIn; t++) stepWorld(world);
  assert.equal(household.takenIn, undefined, 'the father never came for the girls');
  assert.ok(world.events.some(event => event.householdId === household.id && /came for the children/.test(event.text)));
  for (let t = 0; t < 200 && household.members.some(id => world.entities[id].travel); t++) stepWorld(world);
  for (const one of household.members.map(id => world.entities[id]).filter(one => one.health.condition !== 'dead')) assert.equal(one.location.siteId, household.homeSiteId, `${one.name} is not home`);
  validateWorld(world);
});

test('the oldest child at home may go for help: the neighbours take the family in', () => {
  const { world, household } = played('hh-5');
  for (const one of household.members.map(id => world.entities[id])) if (one.age >= 10) one.health = { condition: 'captured' };
  const zadok = oldestChild(world, household);
  const offered = view(world, household.id).work[zadok.id].find(entry => entry.id === 'child-help');
  assert.ok(offered?.can, `going for help is not offered the oldest child: ${offered?.why || 'not listed'}`);
  // A younger child, where the birthdays since the autumn have left one under ten (sim/ages.mjs): not offered it.
  const younger = children(world, household).find(one => one.id !== zadok.id);
  if (younger) assert.ok(!view(world, household.id).work[younger.id].some(entry => entry.id === 'child-help'), 'a younger child is offered it too');
  applyAction(world, household.id, { action: 'chore', entityId: zadok.id, chore: 'child-help' });
  for (let t = 0; t < 200 && !household.takenIn; t++) stepWorld(world);
  assert.ok(household.takenIn, 'nobody took the family in');
  assert.ok(world.events.some(event => event.householdId === household.id && /ran to .* for help/.test(event.text)));
  validateWorld(world);
});

test('left behind: a son in town when the family goes is told where it went, and follows it there', () => {
  const { world, household } = played('hh-1');
  const father = world.entities[household.principalId];
  const son = person(world, household, one => rolled(world, one) === 15);
  orderedOut(world, household);
  applyAction(world, household.id, { action: 'set-main', entityId: son.id });
  applyAction(world, household.id, { action: 'travel', entityId: son.id, destination: 'gonzales', mode: 'foot' });
  applyAction(world, household.id, { action: 'flee', entityId: father.id, refuge: 'washington', take: {} });
  for (let t = 0; t < 300 && son.travel?.to !== 'washington'; t++) stepWorld(world);
  assert.equal(son.travel?.to, 'washington', 'the son was left standing in town');
  assert.ok(world.events.some(event => event.actorId === son.id && /Word reached .* the family has gone east for Washington/.test(event.text)), 'nobody told him');
});

test('the wounded go with the family, in the wagon', () => {
  const { world, household } = played('hh-1');
  const father = world.entities[household.principalId];
  const hurt = person(world, household, one => rolled(world, one) === 12);
  orderedOut(world, household);
  hurt.health = { condition: 'wounded', until: world.minute + 10 * 1440 };
  applyAction(world, household.id, { action: 'flee', entityId: father.id, refuge: 'washington', take: {} });
  assert.equal(hurt.travel?.purpose, 'flee', 'the wounded girl was left at home');
  if (world.meansRoll && household.flight.mode === 'wagon') assert.ok(hurt.travel.rides, 'the wounded girl walks beside an empty seat');
});

test('a baby never marches with the army: the lone father goes to Houston, the baby stays with the girls, and he is warned before he goes', () => {
  const { world, household } = played('hh-4');
  const father = world.entities[household.principalId];
  person(world, household, one => one.kin?.role === 'mother').health = { condition: 'dead' };
  const baby = person(world, household, one => one.age === 1);
  const join = view(world, household.id).work[father.id].find(entry => entry.id === 'join-houston');
  assert.ok(join?.can, `joining Houston is not open to the father: ${join?.why}`);
  assert.match(join.leaves || '', /nobody older than nine is left at home/, 'no warning that only small children are left');
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'join-houston' });
  for (let t = 0; t < 4; t++) stepWorld(world);
  assert.equal(baby.carriedBy, undefined, 'the baby was carried into the army');
  assert.ok(world.events.some(event => event.actorId === father.id && /left Rosa at home|left .* at home/.test(event.text) && /does not go with the army/.test(event.text)));
});

test('very sick is in bed: the work in hand stops at once, a crying baby is not brought to her, and the card offers nursing by somebody else', () => {
  const { world, household } = played('hh-1');
  const father = world.entities[household.principalId];
  const mother = person(world, household, one => one.kin?.role === 'mother');
  household.resources.powder = 6;
  father.skills = { ...father.skills, hunting: 1 };
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'practise-shooting' });
  assert.ok(father.chore, 'the father could not be set to shoot');
  father.health = { condition: 'sick', disease: 'measles', recoversAt: world.minute + 7 * 1440, grave: true, graveDay: Math.floor(world.minute / 1440) };
  stepWorld(world);
  assert.equal(father.chore, null, 'a man too sick to get up is still at the mark');
  assert.notEqual(father.task, 'work');
  assert.ok(world.events.some(event => event.actorId === father.id && /too sick to go on/.test(event.text)));
  // The nursing on his card: his wife, sent from there.
  const shown = view(world, household.id).entities.find(one => one.id === father.id);
  assert.ok(shown.nurses?.some(nurse => nurse.id === mother.id && nurse.chore === 'nurse-home'), 'nobody is offered to nurse him on his card');
  // A crying baby is not brought to somebody very sick; a child with nothing to do does not go to stop their rest.
  // Everybody else of the family in town: at home only the very sick father, the mother, and a child of five.
  const child = person(world, household, one => one.age === 5);
  for (const one of household.members.map(id => world.entities[id])) if (![father.id, mother.id, child.id].includes(one.id)) { one.travel = null; one.location = { x: 0, y: 0, siteId: 'gonzales' }; }
  const baby = { id: 'baby', kind: 'person', age: 0, location: { ...mother.location }, health: { condition: 'well' } };
  assert.equal(whoComes(world, household, baby, household.homeSiteId).carer?.id, mother.id, 'the scene proves nothing: the mother would not have come to the baby well');
  assert.equal(talkTarget(world, household, child)?.id, mother.id, 'the scene proves nothing: the child would not have gone to the mother well');
  mother.health = { ...father.health };
  const comes = whoComes(world, household, baby, household.homeSiteId);
  assert.notEqual(comes.carer?.id ?? comes.holder?.id, mother.id, 'the very sick mother was sent to the baby');
  assert.equal(talkTarget(world, household, child), null, 'the idle child went to stop a very sick parent\'s rest');
});

test('a family with nobody living is not told to leave, holds nobody\'s clock, and is never named the winner', () => {
  const { world, household } = played('hh-7');
  for (const id of household.members) world.entities[id].health = { condition: 'dead' };
  orderOut(world, household);
  assert.equal(household.flight, undefined, 'a dead family was told to leave');
  // And one told to leave before it died holds nothing either.
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  assert.notEqual(calendarMinutes(world), TICK_MINUTES, 'a dead family holds the class at the farming scale');
  household.resources.money = 100000;
  const alive = world.households['hh-1']; alive.played = true;
  world.status = 'ended';
  const ending = hostEnding(world);
  assert.ok(!ending.winners.includes(household.id), 'the family where everybody died was named the winner');
  assert.ok(ending.winners.length, 'nobody won');
});

test('the dead never speak: a mother who dies of a sickness in the tick is not heard replying to her children, and has let them go', () => {
  const { world, household } = played('hh-3');
  orderedOut(world, household);
  const mother = person(world, household, one => one.kin?.role === 'mother');
  const children = household.members.map(id => world.entities[id]).filter(one => one.age >= 2 && one.age < 10).slice(0, 3);
  const day = Math.floor(world.minute / 1440);
  mother.traits = { ...(mother.traits || {}), strength: 1, health: 2 };
  mother.health = { condition: 'sick', disease: 'measles', recoversAt: world.minute + 7 * 1440, since: world.minute - 3 * 1440, grave: true, graveDay: day - 1, day: day - 1 };
  mother.task = 'work';
  // Past the minute in which a played family's very sick cannot die (owner, 2026-09-29, C4; sim/decision-budget.mjs `graveHeld`).
  world.decisionClock = { ...(world.decisionClock || {}), [`grave:${mother.id}`]: { personId: mother.id, spent: 60_000, of: 60_000, limit: 'grave' } };
  world.diseaseDay = day - 1;
  // Round to the next day, so the day's sickness is rolled this tick.
  world.minute = (day + 1) * 1440 - calendarMinutes(world) + 7 * 60;
  for (const child of children) { child.chore = null; child.auto = false; delete child.auto; child.travel = null; child.location = { ...mother.location }; child.talk = { withId: mother.id, phase: 'talking', since: world.tick, from: world.tick }; }
  mother.aside = { kind: 'talk', childIds: children.map(one => one.id) };
  stepWorld(world);
  assert.equal(mother.health.condition, 'dead', 'the scene did not come about: the mother lived');
  const lines = view(world, household.id).familyTalk?.lines || [];
  assert.ok(!lines.some(line => line.speakerId === mother.id), `the dead mother spoke: ${lines.filter(line => line.speakerId === mother.id).map(line => line.text).join(' / ')}`);
  assert.equal(mother.aside, undefined, 'the dead mother is still called aside');
  assert.ok(children.every(child => child.talk?.withId !== mother.id), 'a child is still talking with the dead');
  validateWorld(world);
});
