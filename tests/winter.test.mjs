// The winter's choices: docs/COLONIES.md §7e and build step 8(b), decided by the owner by multiple choice (2026-09-16).
//
// In the second class period a grown member of a family can enlist for land at San Felipe (the regular army, bound; or the
// auxiliary volunteers, who can be sent for and lose the land), ride to Béxar to join the garrison, go south to join the
// Matamoros men, or - a man of twenty-one or more - vote in the family's town on February 1. Each person is in one place.
// Enlisting earns glory now and the land at the end, a real for twenty acres added after glory multiplies the coin, if the
// person is alive and still serving or released with the promise kept. A regular sent for has deserted. None of it exists in 1835.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { ACRES_PER_REAL, SERVICE, VOTING_AGE, landPromised, mayVote, winterRefusal } from '../sim/winter.mjs';
import { canAnswerCalls } from '../sim/family.mjs';
import { hostEnding, familyEnding, finalNumber } from '../sim/ending.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 8000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const offered = (world, household, person) => (view(world, household.id).work[person.id] || []).map(entry => entry.id);
const WINTER = ['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'go-vote'];

let firstShared = null, winterShared = null;
const firstPeriod = () => structuredClone(firstShared ??= (() => {
  const world = createGonzalesWorld('winter-class', 5, { map: 'colonies' });
  // Rolled families, as every family somebody plays is: people with ages and sexes, so there are voters and non-voters.
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  return world;
})());
/** The same class continued into the winter, run to the morning the winter's news comes. */
const winter = () => structuredClone(winterShared ??= (() => {
  const world = firstPeriod();
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
/** A grown person of the family at home, by a test of their own. */
const somebody = (world, test = () => true) => {
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const person = world.entities[id];
      if (person.health.condition === 'well' && (person.age ?? 30) >= 16 && person.location.siteId === household.homeSiteId && test(person)) return { household, person };
    }
  }
  return null;
};
const send = (world, household, person, chore, extra = {}) => applyAction(world, household.id, { action: 'chore', entityId: person.id, chore, mode: 'horse', ...extra });

test('nothing of the winter is offered in 1835; the winter offers its choices once its news has come', () => {
  const autumn = createGonzalesWorld('winter-autumn', 5, { map: 'colonies' });
  autumn.status = 'running';
  for (let t = 0; t < 40; t++) stepWorld(autumn);
  const early = somebody(autumn) || { household: Object.values(autumn.households)[0], person: autumn.entities[Object.values(autumn.households)[0].members[0]] };
  assert.deepEqual(offered(autumn, early.household, early.person).filter(id => WINTER.includes(id)), [], 'a winter choice was offered in 1835');

  const world = winter();
  const { household, person } = somebody(world);
  const open = offered(world, household, person);
  for (const id of ['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros']) assert.ok(open.includes(id), `${id} was not offered in the winter`);
  assert.ok(!open.includes('go-vote'), 'a vote was offered before the polls opened');
  // The news came to every family.
  for (const topic of ['winter-terms', 'winter-bexar', 'winter-council']) assert.ok(world.knowledge.households[household.id][topic], `${topic} did not reach the family`);
});

test('a regular enlists at San Felipe for 800 acres and glory, is in one place, and deserts if sent for', () => {
  const world = winter();
  const { household, person } = somebody(world);
  send(world, household, person, 'enlist-regular');
  until(world, () => person.service);
  assert.equal(person.location.siteId, 'san-felipe', 'they enlisted somewhere other than San Felipe');
  assert.deepEqual({ kind: person.service.kind, status: person.service.status, acres: person.service.acres }, { kind: 'regular', status: 'serving', acres: 800 });
  const award = world.glory[household.id].awards[`enlistment:${person.id}`];
  assert.ok(award?.points > 0, 'enlisting earned no glory');
  assert.equal(view(world, household.id).entities.find(e => e.id === person.id).service.kind, 'regular', 'the family was not told who enlisted');
  assert.equal(landPromised(world, household).acres, 800);

  // One person, one place: nothing else, and no other service.
  assert.throws(() => send(world, household, person, 'join-garrison'), /is with the regular army at San Felipe( de Austin)?/);
  assert.throws(() => applyAction(world, household.id, { action: 'rest', entityId: person.id }), /can only be sent for/);
  const work = view(world, household.id).work[person.id] || [];
  // Refused because they are serving, not by the accident of standing somewhere other than home. (The land hunt shares its refusal with the timber hunt, sent once.)
  assert.ok(work.length > 0 && work.every(entry => entry.can === false && (/can only be sent for/.test(entry.why) || (entry.id === "hunt-land" && entry.why === undefined))), `a serving person was not refused for serving: ${work.filter(entry => !/can only be sent for/.test(entry.why || "")).map(entry => `${entry.id}: ${entry.why}`)}`);
  validateWorld(world);

  const before = world.glory[household.id].total;
  applyAction(world, household.id, { action: 'winter-recall', entityId: person.id });
  assert.equal(person.service.status, 'deserted');
  assert.equal(person.deserted, true);
  assert.equal(world.glory[household.id].total, before - 2 * award.points, 'desertion did not take the glory back twice over');
  assert.equal(person.travel?.to, household.homeSiteId, 'a deserter did not start home');
  assert.equal(landPromised(world, household).acres, 0, 'a deserter kept the land');
  until(world, () => !person.travel);
  assert.match(offered(world, household, person).includes('enlist-regular') ? view(world, household.id).work[person.id].find(e => e.id === 'enlist-regular').why : '', /deserted/, 'a deserter could enlist again');
  validateWorld(world);
});

test('an auxiliary chooses the war or a year, and when sent for comes home without the land and without deserting', () => {
  const world = winter();
  const { household, person } = somebody(world);
  send(world, household, person, 'enlist-auxiliary');
  until(world, () => person.chore?.ask);
  applyAction(world, household.id, { action: 'answer-chore', entityId: person.id, option: 'war' });
  until(world, () => person.service);
  assert.equal(person.service.kind, 'auxiliary-war');
  assert.equal(person.service.acres, 640);
  applyAction(world, household.id, { action: 'winter-recall', entityId: person.id });
  assert.equal(person.service.status, 'released');
  assert.equal(person.deserted, undefined, 'an auxiliary sent for was called a deserter');
  assert.ok(world.glory[household.id].total > 0, 'an auxiliary sent for lost the glory of enlisting');
  assert.equal(landPromised(world, household).acres, 0, 'an auxiliary sent for kept the land');
});

test('the garrison is joined at Béxar and the expedition at Refugio, and either can be sent for', () => {
  const world = winter();
  const one = somebody(world);
  const two = somebody(world, person => person.householdId !== one.household.id);
  send(world, one.household, one.person, 'join-garrison');
  send(world, two.household, two.person, 'join-matamoros');
  until(world, () => one.person.service && two.person.service);
  assert.equal(one.person.location.siteId, SERVICE.garrison.siteId);
  assert.equal(two.person.location.siteId, SERVICE.matamoros.siteId);
  assert.equal(landPromised(world, one.household).acres, 0, 'the garrison was promised land');
  applyAction(world, two.household.id, { action: 'winter-recall', entityId: two.person.id });
  assert.equal(two.person.service.status, 'released');
  assert.equal(two.person.travel?.to, two.household.homeSiteId);

  // Who may go is who may answer a call: a child of ten to fifteen may not, and a father of no stated age may vote.
  const child = Object.values(world.entities).find(person => person.householdId && Number.isFinite(person.age) && person.age >= 10 && person.age < 16 && person.health.condition === 'well');
  assert.ok(child, 'the class has no child of ten to fifteen');
  assert.match(winterRefusal(world, world.households[child.householdId], child, 'join-garrison'), /too young to answer/);
  assert.equal(mayVote({ kind: 'person', kin: { role: 'father' } }), true, 'a father of no stated age may not vote');
  assert.equal(mayVote({ kind: 'person', kin: { role: 'son' } }), false, 'a son of no stated age may vote');
});

test('a man of twenty-one or more votes in his own town on February 1; nobody else, and not before or after', () => {
  const world = winter();
  const man = somebody(world, person => person.sex === 'male' && (person.age ?? 0) >= VOTING_AGE);
  const woman = somebody(world, person => person.sex === 'female');
  assert.ok(man && woman, 'the class has no grown man or woman to test with');
  assert.ok(!offered(world, man.household, man.person).includes('go-vote'), 'the vote was offered before the polls opened');
  until(world, () => world.director.milestones['election-opens']);
  assert.equal(world.director.phase, 'news', 'the polls did not slow the calendar');
  assert.ok(offered(world, man.household, man.person).includes('go-vote'), 'a man of twenty-one was not offered the vote');
  assert.ok(!offered(world, woman.household, woman.person).includes('go-vote'), 'a woman was offered the vote');
  assert.throws(() => send(world, woman.household, woman.person, 'go-vote'), /Only men of 21/);
  send(world, man.household, man.person, 'go-vote');
  until(world, () => man.person.voted || world.director.milestones['election-close']);
  assert.equal(man.person.voted, true, 'the man did not vote while the polls were open');
  assert.ok(world.glory[man.household.id].awards[`election:${man.person.id}`]?.points > 0, 'voting earned no glory');
  until(world, () => world.director.milestones['election-close']);
  assert.equal(world.director.phase, 'campaign');
  assert.ok(!offered(world, man.household, man.person).includes('go-vote'), 'the vote was offered after the polls closed');
});

test('land counts at the end at a real for twenty acres, added after glory, only for the living still serving or released with the promise kept', () => {
  assert.equal(finalNumber(5, 10, 40), 5 * 11 + 40);
  assert.equal(finalNumber(0, 70, 40), 1 * 71 + 40, 'land was multiplied by glory, or coin not floored');
  const world = winter();
  const { household, person } = somebody(world);
  send(world, household, person, 'enlist-regular');
  until(world, () => person.service);
  const own = familyEnding(world, household.id);
  assert.equal(own.land, 800 / ACRES_PER_REAL);
  assert.equal(own.final, finalNumber(household.resources.money, world.glory[household.id].total, 40));
  assert.match(own.sum, /\+ 40 reales of land \(800 acres promised\)/);
  // Enlisting is a part taken: the story does not say the family stayed home, and the Host's table names who went (found by
  // the whole-game browser run, 2026-09-16, when a man who fought at San Jacinto was shown as nobody having gone).
  assert.ok(!own.story.some(line => /Nobody from the family went/.test(line)), 'the story says nobody went');
  assert.ok(hostEnding(world).families.find(family => family.householdId === household.id).went.includes(person.name), 'the Host\'s table does not name who enlisted');
  person.health = { condition: 'dead' };
  assert.equal(familyEnding(world, household.id).land, 0, 'the dead were counted for land');
});

test('a saved service that cannot be is refused', () => {
  const world = winter();
  const { person } = somebody(world);
  person.service = { kind: 'navy', status: 'serving', siteId: 'velasco' };
  assert.throws(() => validateWorld(world), /Invalid service/);
  person.service = { kind: 'regular', status: 'serving', siteId: 'san-felipe', acres: -5 };
  assert.throws(() => validateWorld(world), /acres/);
});

test('families nobody plays take the winter choices rarely, as the record shows, and nearly every man of them votes', async () => {
  const { WINTER_SHARES, shareOf } = await import('../sim/neighbours.mjs');
  const world = createGonzalesWorld('winter-neighbours', 15, { map: 'colonies', neighbours: true });
  world.status = 'running';
  until(world, () => world.director.complete, 9000);
  beginSecondPeriod(world);
  world.status = 'running';
  // Past the polls, and a few days on, so a family busy at the field when the winter's news came has had its chance to go.
  until(world, () => world.minute > momentOf(world, 'election-close') + 4 * 1440, 9000);
  const adults = Object.values(world.entities).filter(person => person.kind === 'person' && person.householdId && canAnswerCalls(person) && person.health.condition !== 'dead');
  const served = adults.filter(person => person.service);
  const expected = person => {
    const share = shareOf(world, person.id, 'winter');
    return share < WINTER_SHARES.regular ? 'regular' : share < WINTER_SHARES.enlist ? 'auxiliary' : share < WINTER_SHARES.enlist + WINTER_SHARES.garrison ? 'garrison' : share < WINTER_SHARES.enlist + WINTER_SHARES.garrison + WINTER_SHARES.matamoros ? 'matamoros' : null;
  };
  for (const person of served) {
    const want = expected(person);
    assert.ok(want && person.service.kind.startsWith(want), `${person.name} took ${person.service.kind}, which their share (${want}) did not choose`);
  }
  assert.ok(served.length > 0, 'no family nobody plays took any winter choice');
  assert.ok(served.length <= Math.ceil(adults.length * 0.4), `too many went: ${served.length} of ${adults.length}`);
  const men = adults.filter(person => mayVote(person) && !person.service);
  assert.ok(men.length > 0, 'the class has no man who may vote');
  const voters = men.filter(person => person.voted);
  assert.ok(voters.every(person => shareOf(world, person.id, 'vote') < WINTER_SHARES.vote), 'a man whose share stays home voted');
  assert.ok(voters.length >= Math.floor(men.length * 0.5), `too few voted: ${voters.length} of ${men.length}`);
  assert.ok(Object.values(world.entities).every(person => !person.voted || mayVote(person)), 'somebody voted who may not');
  // Travis's letter (sim/alamo.mjs): about one grown hand in ten of those who heard it rides to Gonzales to go in, if they are free
  // in the day or two before the men ride; nobody else does.
  until(world, () => world.director.milestones['relief-enters'], 9000);
  const relief = Object.values(world.entities).filter(person => person.service?.kind === 'relief' || person.service?.relief);
  for (const person of relief) assert.ok(shareOf(world, person.id, 'relief') < WINTER_SHARES.relief, `${person.name} rode with the relief though their share stays home`);
  validateWorld(world);
});
