// A student with no family left to play follows another family and watches it (owner, 2026-09-29, "Follow and watch";
// sim/watching.mjs, docs/FAMILY_PANEL.md §20a), and the two edges the triage found where the family's people were stranded
// (docs/audits/2026-09-29-triage.md D3): the straggler at the refuge when the family turns home, and little ones at home with every
// neighbour gone.
//
// Every test here was seen failing alone against the regression it guards (`node scripts/watching-injections.mjs`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectPage, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { turnHome } from '../sim/scrape.mjs';
import { TIP_IDS } from '../sim/tips.mjs';
import { watchOf } from '../sim/watching.mjs';
import { armBattle } from '../sim/battle-stage.mjs';
import { tellFannin } from '../sim/fannin.mjs';
import { spring, until } from './support/scrape-spring.mjs';
import { taught } from './support/settled.mjs';
import { ageNow } from '../sim/family.mjs';

const page = (world, householdId) => projectPage(world, householdId, 'student', { includeMap: false });
const own = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const person = (world, household, test) => household.members.map(id => world.entities[id]).find(test);
function serve(world, man) {
  const siteId = houstonCamp(world), site = world.map.sites[siteId];
  Object.assign(man, { travel: null, chore: null, task: 'rest', service: { kind: 'houston', status: 'serving', since: world.minute, siteId }, location: { x: site.x, y: site.y, siteId } });
}
function played(householdId) {
  const world = taught(spring());
  const household = world.households[householdId];
  household.played = true; delete household.absent;
  return { world, household };
}
/**
 * The lone father of little ones, as tests/acting.test.mjs makes him. Since the owner's rule of 2026-10-04 (sim/family.mjs
 * `youngAllowed`: a family of fewer than six has at most one child under ten, one of six to nine at most two) no family is rolled
 * as a father with only small children, so the scene is made from the first large family with a father, a mother, a baby and two or
 * more children under seven: its mother dies and everybody else of seven or more is taken prisoner.
 */
function littleOnesPlayed() {
  const world = taught(spring());
  const household = Object.values(world.households).find(one => {
    const people = one.members.map(id => world.entities[id]).filter(entity => entity.kind === 'person');
    return people.some(entity => entity.id === one.principalId) && people.some(entity => entity.kin?.role === 'mother')
      && people.some(entity => entity.age < 2) && people.filter(entity => entity.age >= 2 && entity.age < 7).length >= 2;
  });
  assert.ok(household, 'no family of the shape this test needs was rolled, so this proves nothing');
  household.played = true; delete household.absent;
  for (const one of household.members.map(id => world.entities[id]).filter(entity => entity.kind === 'person')) {
    if (one.kin?.role === 'mother') one.health = { condition: 'dead' };
    else if (one.id !== household.principalId && one.age >= 7) one.health = { condition: 'captured' };
  }
  return { world, household };
}
/** What only a watching page carries, and what it has taken off: the rest must be the watched family's own page, byte for byte. */
const STRIPPED = ['householdId', 'work', 'travelModes', 'offers', 'lesson', 'lessonResume', 'request', 'encounter', 'neighbourly', 'watching', 'ending'];
const without = view => Object.fromEntries(Object.entries(view).filter(([key]) => !STRIPPED.includes(key)));

test('the rule: a student whose whole family is gone follows the nearest neighbour family and sees exactly its page, read-only, with a line that says what happened', () => {
  const { world, household } = played('hh-7');
  // One living: their own page, as always.
  const people = household.members.map(id => world.entities[id]).filter(entity => entity.kind === 'person');
  for (const one of people.slice(1)) one.health = { condition: 'dead' };
  assert.equal(page(world, household.id).watching, undefined, 'a family with somebody left was made to watch');
  assert.equal(JSON.stringify(page(world, household.id)), JSON.stringify(own(world, household.id)), 'a family with somebody left was not sent its own page');
  // The last taken prisoner: gone - dead or a prisoner is the one meaning (sim/ending.mjs `nobodyLeft`).
  people[0].health = { condition: 'captured' };
  const home = world.map.sites[household.homeSiteId];
  const nearest = Object.values(world.households).filter(other => other.id !== household.id)
    .sort((a, b) => Math.hypot(world.map.sites[a.homeSiteId].x - home.x, world.map.sites[a.homeSiteId].y - home.y) - Math.hypot(world.map.sites[b.homeSiteId].x - home.x, world.map.sites[b.homeSiteId].y - home.y))[0];
  const view = page(world, household.id);
  assert.ok(view.watching, 'a student with nobody left is sent nothing to say so');
  assert.equal(view.watching.why, 'gone');
  assert.equal(view.watching.of, nearest.id, 'the student does not follow the nearest neighbour family');
  assert.match(view.watching.line, /Everybody of .* has died or been taken prisoner\. You are following .*, your nearest neighbours/);
  // Server-filtered: exactly what that family's own student is sent, less its controls - nothing of the Host's, nothing of another's.
  assert.deepEqual(without(view), without(own(world, nearest.id)), 'the watching page is not the watched family\'s own page');
  assert.ok(!('overview' in view) && !('live' in view) && !('chases' in view), 'the Host\'s knowledge reached a student');
  assert.deepEqual(view.work, {}, 'a watching page carries work to give');
  assert.equal(view.householdId, household.id, 'the page is no longer this student’s own: its making, tips and key would be another family’s');
  assert.ok(view.entities.every(entity => entity.householdId === nearest.id), 'somebody not of the watched family is on its rows');
  assert.deepEqual(view.watching.people.map(one => one.id), nearest.members.filter(id => world.entities[id].kind === 'person'));
  // No orders: refused in words, but a tip may still be put away.
  const theirs = nearest.members.find(id => world.entities[id].kind === 'person');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: theirs, chore: 'rest' }), /Nobody of your family is left to give an order to/);
  assert.throws(() => applyAction(world, household.id, { action: 'set-auto', entityId: people[0].id, auto: true }), /Nobody of your family is left/);
  applyAction(world, household.id, { action: 'seen-tip', tip: TIP_IDS[0] });
  // All dead: said so.
  people[0].health = { condition: 'dead' };
  assert.match(page(world, household.id).watching.line, /^Everybody of .* has died\. You are following/);
  // The families nobody plays think from their own page, never this one (sim/neighbours.mjs).
  assert.equal(own(world, household.id).watching, undefined);
  // And at the class's end their own family's story is theirs, not the family they followed.
  world.status = 'ended';
  const ended = page(world, household.id);
  assert.equal(ended.ending?.family?.householdId, household.id, 'the ending shown is the watched family\'s');
});

test('the rule: a student whose little ones were taken in, with nobody else of the family left to play, watches the family that took them in, until somebody grown comes for them', () => {
  const { world, household } = littleOnesPlayed();
  const father = world.entities[household.principalId];
  serve(world, father);
  stepWorld(world);
  assert.ok(household.takenIn, 'nobody took the little ones in, so this proves nothing');
  const host = world.households[household.takenIn.by];
  // The father serving with the army is still theirs to answer for: their own page, as before.
  assert.equal(page(world, household.id).watching, undefined, 'the student watches another family with the father still theirs at the war');
  // Taken prisoner: nobody else of the family is left to play.
  father.service = { ...father.service, status: 'prisoner', prisonerSince: world.minute };
  const view = page(world, household.id);
  assert.equal(view.watching?.why, 'taken-in', 'the student is not watching the family that took them in');
  assert.equal(view.watching.of, host.id);
  assert.match(view.watching.line, /took them in\. You are watching .*, who have them now/);
  // Their own little ones are there with them, seen as that family sees them.
  const girls = household.takenIn.ids;
  assert.ok(girls.every(id => view.others.some(other => other.id === id)), 'the little ones are not on the watched family\'s page');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: girls[0], chore: 'child-play' }), /goes where they go/);
  // The father home: the family is theirs again, the same tick, and he goes to fetch the little ones.
  const home = world.map.sites[household.homeSiteId];
  delete father.service; father.location = { x: home.x, y: home.y, siteId: home.id };
  assert.equal(page(world, household.id).watching, undefined, 'the student still watches with the father home');
  for (let t = 0; t < 200 && household.takenIn; t++) stepWorld(world);
  assert.equal(household.takenIn, undefined);
  assert.equal(watchOf(world, household), null);
  assert.equal(page(world, household.id).watching, undefined, 'the student still watches with the father home');
  validateWorld(world);
});

test('the rule: a student watching the family that took their little ones in is still sent their own man\'s fight, its card through him, and the account of what became of him, with its line in the journal', async () => {
  // test:battle-south and test:battle-coleto (2026-09-29): a lone father at the war, his little ones taken in; the page turned to the
  // neighbours' the moment he fell or was taken, and lost the rest of his fight and the word of what became of him.
  const { world, household } = littleOnesPlayed();
  const father = world.entities[household.principalId];
  serve(world, father);
  stepWorld(world);
  assert.ok(household.takenIn, 'nobody took the little ones in, so this proves nothing');
  // A prisoner of Coleto, formed with the others at Goliad on Palm Sunday: the card through him, Follow.
  const goliad = world.map.sites.goliad;
  Object.assign(father, { location: { x: goliad.x, y: goliad.y, siteId: 'goliad' }, service: { kind: 'fannin', status: 'prisoner', since: world.minute, prisonerSince: world.minute, siteId: 'goliad', coleto: 'unhurt' } });
  const massacre = armBattle(world, 'goliad-massacre', world.minute - 1);
  massacre.participants[father.id] = { householdId: household.id, joined: world.minute - 1 };
  massacre.alerted[household.id] = { entityId: father.id, stage: 'muster', minute: world.minute, text: `At ${father.name}'s side: the prisoners are formed.` };
  let view = page(world, household.id);
  assert.equal(view.watching?.why, 'taken-in', 'the student is not watching, so this proves nothing');
  assert.equal(view.battle?.id, 'goliad-massacre', 'the fight their own man is in was not sent to the watching page');
  assert.equal(view.battleAlert?.title, 'The prisoners are formed', 'the card through their own man was not sent');
  assert.equal(view.battleAlert.householdId, household.id);
  // On the page: the card is put up, though he is not on the watched family's rows.
  const { militaryNotices } = await import('../public/military-attention.js');
  assert.ok(militaryNotices(view).some(notice => notice.kind === 'battle' && notice.entityId === father.id), 'the page does not put up the card through him');
  // Nor is it held back by the watched family's own road, which is not this student's to answer.
  assert.ok(militaryNotices({ ...view, flight: { status: 'ordered' } }).some(notice => notice.kind === 'battle'), 'the watched family\'s order to leave held back the card through their own man');
  // Killed on Palm Sunday; the word comes; the family is told through whoever hears it - a little one, with the neighbours.
  massacre.start = world.minute - 100000;
  Object.assign(father.service, { fate: 'executed' });
  father.health = { condition: 'dead' };
  tellFannin(world);
  assert.ok(massacre.told[household.id], 'nobody of the family was told, so this proves nothing');
  view = page(world, household.id);
  assert.equal(view.watching?.why, 'taken-in');
  assert.match(view.battleAccount?.title || '', new RegExp(`What became of ${father.name}`), 'the account of what became of him was not sent to the watching page');
  assert.ok(view.events.some(event => event.householdId === household.id && event.text === view.battleAccount.text), 'the journal does not keep it');
  // Nothing of theirs is sent to the family they follow, and the rest of the page is still exactly that family's own.
  const host = household.takenIn.by;
  assert.ok(!JSON.stringify(own(world, host)).includes(view.battleAccount.text), 'the account reached the neighbours\' page');
  const withoutWar = value => Object.fromEntries(Object.entries(without(value)).filter(([key]) => !['battle', 'battleAlert', 'battleAccount', 'events'].includes(key)));
  assert.deepEqual(withoutWar(view), withoutWar(own(world, host)));
  validateWorld(world);
});

test('the rule: somebody who reaches the refuge after the family has turned for home follows it home', () => {
  const { world, household } = played('hh-1');
  const father = world.entities[household.principalId];
  // The son rolled at fifteen: the spring class's people have had their birthdays since (owner, 2026-09-29, D11; sim/ages.mjs).
  const son = person(world, household, one => ageNow(world, one, 0) === 15);
  until(world, () => household.flight?.status === 'ordered', 400);
  applyAction(world, household.id, { action: 'set-main', entityId: son.id });
  applyAction(world, household.id, { action: 'travel', entityId: son.id, destination: 'gonzales', mode: 'foot' });
  applyAction(world, household.id, { action: 'flee', entityId: father.id, refuge: 'washington', take: {} });
  for (let t = 0; t < 1500 && household.flight.status !== 'refuged'; t++) stepWorld(world);
  assert.equal(household.flight.status, 'refuged', 'the family never reached its refuge');
  // The son is still on his way when the word of San Jacinto turns the family home.
  if (!son.travel) { const town = world.map.sites.gonzales; Object.assign(son, { chore: null, task: 'rest', location: { x: town.x, y: town.y, siteId: 'gonzales' } }); stepWorld(world); }
  assert.equal(son.travel?.to, 'washington', 'the son is not on his way to the refuge');
  turnHome(world);
  assert.equal(household.flight.status, 'returning');
  for (let t = 0; t < 1500 && son.travel?.to !== household.homeSiteId; t++) stepWorld(world);
  assert.equal(son.travel?.to, household.homeSiteId, 'the son was left at the refuge the family had gone home from');
  assert.ok(world.events.some(event => event.actorId === son.id && /to find the family gone home/.test(event.text)), 'nobody told him');
});

test('the rule: little ones at home with no neighbour family near to take them in are not left without a word', () => {
  const { world, household } = littleOnesPlayed();
  serve(world, world.entities[household.principalId]);
  // Every neighbour family's grown people are away with the army: nobody at home to take anybody in.
  for (const other of Object.values(world.households)) {
    if (other.id === household.id) continue;
    for (const one of other.members.map(id => world.entities[id])) if (one.kind === 'person' && one.age >= 10) serve(world, one);
  }
  stepWorld(world);
  assert.equal(household.takenIn, undefined, 'somebody took them in with nobody at home');
  const said = () => world.events.filter(event => event.householdId === household.id && /no neighbour family near to take them in/.test(event.text)).length;
  assert.equal(said(), 1, 'the family was not told the little ones are alone');
  stepWorld(world); stepWorld(world);
  assert.equal(said(), 1, 'the family was told again the same day');
  assert.ok(page(world, household.id).events.some(event => /no neighbour family near/.test(event.text)), 'the page is not told');
  assert.equal(page(world, household.id).watching, undefined, 'the student watches another family with their own little ones at home');
  validateWorld(world);
});
