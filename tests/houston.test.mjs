// Houston's army, Goliad and San Jacinto: docs/COLONIES.md §7g, decided by the owner by multiple choice (2026-09-16).
//
// In the spring any grown member can join Houston's army at whichever camp it is in and follows it as it moves; anyone can
// be sent for to help the family, and the regulars taken into it at San Felipe are regulars still. Those with Fannin can be
// sent for until the morning of March 19; then Coleto, the surrender, and on Palm Sunday the massacre - executed, escaped or
// spared at the record's shares, and told to the family when the word comes. San Jacinto is 1 in 100 killed and 3 wounded,
// told with the victory, after which the army goes home and the game ends on the road home.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { rollFates } from '../sim/army.mjs';
import { COLETO, MASSACRE, SAN_JACINTO, houstonCamp } from '../sim/houston.mjs';
import { landPromised } from '../sim/winter.mjs';
import { share } from '../sim/scrape.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);

let shared = null;
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('houston-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  return world;
})());
const grownMen = world => Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && one.health.condition === 'well' && one.sex === 'male' && (one.age ?? 0) >= 16 && one.location.siteId === world.households[one.householdId].homeSiteId);
const serve = (world, person, kind, siteId, extra = {}) => {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind, status: 'serving', since: world.minute, siteId, ...extra };
};
const offered = (world, person, chore) => (view(world, person.householdId).work[person.id] || []).find(entry => entry.id === chore);

test('a grown member joins Houston at his camp, follows it when it moves, and can be sent for; nobody joins after the battle', () => {
  const world = spring();
  const [first, second] = grownMen(world);
  assert.ok(offered(world, first, 'join-houston')?.can, 'joining Houston was not offered in the spring');
  assert.ok(!offered(world, first, 'join-garrison') && !offered(world, first, 'enlist-regular'), 'a winter choice was offered in the spring');
  assert.equal(houstonCamp(world), 'gonzales');
  applyAction(world, first.householdId, { action: 'chore', entityId: first.id, chore: 'join-houston', mode: 'horse' });
  until(world, () => first.service);
  assert.equal(first.service.kind, 'houston');
  // The camp moves over the Colorado, and the army with it; somebody set out for the old camp follows.
  serve(world, second, 'houston', 'gonzales');
  untilMoment(world, 'houston-colorado');
  assert.equal(houstonCamp(world), 'columbus-crossing');
  until(world, () => [first, second].every(one => one.location.siteId === 'columbus-crossing'), 400);
  for (const one of [first, second]) assert.equal(one.location.siteId, 'columbus-crossing', `${one.name} did not follow the camp`);
  applyAction(world, first.householdId, { action: 'winter-recall', entityId: first.id });
  assert.equal(first.service.status, 'released');
  assert.equal(first.deserted, undefined, 'a volunteer sent for was called a deserter');
  untilMoment(world, 'san-jacinto');
  const home = grownMen(world).find(one => !one.service);
  assert.ok(home, 'nobody is left at home');
  assert.ok(!offered(world, home, 'join-houston') || !offered(world, home, 'join-houston').can, 'joining Houston was offered after the battle');
  validateWorld(world);
});

test('the regulars at San Felipe are taken into the army as regulars still, with their land, and desert if sent for', () => {
  const world = spring();
  const [regular, auxiliary] = grownMen(world);
  serve(world, regular, 'regular', 'san-felipe', { acres: 800 });
  serve(world, auxiliary, 'auxiliary-war', 'san-felipe', { acres: 640 });
  untilMoment(world, 'houston-san-felipe');
  for (const one of [regular, auxiliary]) assert.equal(one.service.kind, 'houston', `${one.name} was not taken into the army`);
  assert.equal(regular.service.bound, true);
  assert.equal(landPromised(world, world.households[regular.householdId]).acres, 800, 'the regular lost the land promised');
  applyAction(world, regular.householdId, { action: 'winter-recall', entityId: regular.id });
  assert.equal(regular.service.status, 'deserted', 'a regular taken into Houston\'s army left without deserting');
  applyAction(world, auxiliary.householdId, { action: 'winter-recall', entityId: auxiliary.id });
  assert.equal(auxiliary.service.status, 'released');
});

test('with Fannin: sent for until March 19, then Coleto, prison, and Palm Sunday at the record\'s shares, told when the word comes', () => {
  const world = spring();
  const men = grownMen(world).slice(0, 10);
  for (const one of men) serve(world, one, 'fannin', 'goliad');
  const [early, ...rest] = men;
  applyAction(world, early.householdId, { action: 'winter-recall', entityId: early.id });
  assert.equal(early.service.status, 'released');
  untilMoment(world, 'coleto');
  assert.throws(() => applyAction(world, rest[0].householdId, { action: 'winter-recall', entityId: rest[0].id }), /marched out of Goliad/);
  const fates = Object.fromEntries(rollFates(world, rest.map(one => one.id), { event: 'coleto', ...COLETO }).map(({ id, fate }) => [id, fate]));
  for (const one of rest) {
    assert.equal(one.service.coleto, fates[one.id], `${one.name}'s fate at Coleto did not follow the roll`);
    assert.equal(one.service.status, 'prisoner');
    assert.equal(one.health.condition, fates[one.id] === 'wounded' ? 'wounded' : 'well', 'a death was on the screen before the word');
  }
  untilMoment(world, 'goliad-massacre');
  for (const one of rest) {
    const roll = share(world, one.id, 'goliad');
    const want = fates[one.id] === 'killed' ? 'killed' : roll < MASSACRE.executed ? 'executed' : roll < MASSACRE.executed + MASSACRE.escaped ? 'escaped' : 'spared';
    assert.equal(one.service.fate, want, `${one.name}'s fate on Palm Sunday did not follow the share`);
    assert.ok(one.health.condition !== 'dead', 'a death was on the screen before the word');
  }
  assert.doesNotMatch(JSON.stringify(view(world, rest[0].householdId)), /"fate"/, 'a fate rode the wire');
  untilMoment(world, 'massacre-word');
  for (const one of rest) {
    const fate = one.service.fate;
    if (['killed', 'executed'].includes(fate)) assert.equal(one.health.condition, 'dead', `${one.name} was ${fate} and is not dead once the word came`);
    else if (fate === 'spared') assert.equal(one.health.condition, 'captured');
    else { assert.equal(one.service.status, 'released'); assert.ok(one.travel?.to === world.households[one.householdId].homeSiteId || one.location.siteId === world.households[one.householdId].homeSiteId, `${one.name} escaped and did not start home`); }
  }
  assert.ok(world.events.some(event => /shot at Goliad on Palm Sunday|broke and ran|spared at Goliad|killed in the fight on the prairie/.test(event.text)));
  validateWorld(world);
});

test('San Jacinto: 1 in 100 killed and 3 wounded, told with the victory; the army goes home and the game ends on the road home', () => {
  const world = spring();
  const men = grownMen(world).slice(0, 12);
  for (const one of men) serve(world, one, 'houston', 'gonzales');
  untilMoment(world, 'san-jacinto');
  const fates = Object.fromEntries(rollFates(world, men.map(one => one.id), { event: 'san-jacinto', ...SAN_JACINTO }).map(({ id, fate }) => [id, fate]));
  for (const one of men) {
    assert.equal(one.service.fate, fates[one.id], `${one.name}'s fate did not follow the roll`);
    assert.equal(one.health.condition, 'well', 'a fate was on the screen before the word');
    assert.equal(world.glory[one.householdId].awards[`san-jacinto:${one.id}`]?.role, 'fought');
  }
  untilMoment(world, 'victory-word');
  for (const one of men) {
    if (fates[one.id] === 'killed') { assert.equal(one.health.condition, 'dead'); continue; }
    assert.equal(one.service.status, 'released', `${one.name} did not go home after the victory`);
    if (fates[one.id] === 'wounded') assert.equal(one.health.condition, 'minor-injury');
  }
  until(world, () => world.director.complete);
  assert.equal(world.status, 'ended');
  assert.ok(world.minute >= momentOf(world, 'scrape-end'));
  const host = view(world, undefined, 'host').ending.host;
  assert.equal(host.interim, false, 'the end of the third period was only interim');
  assert.equal(host.canContinue, false, 'a fourth period was offered');
  validateWorld(world);
});
