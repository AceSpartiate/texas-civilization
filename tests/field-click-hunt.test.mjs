// A field clicked for its crop, and every gettable lack kept on the bar (owner, 2026-09-30, after playing the release v2026.09.29.3:
// "let me click on the fields so i can select what is grown there. i never saw where i could hunt to get leather to make the little
// carts"; and the owner's four answers the same day: "Every gettable lack", "Tanner sells", "Refuse it", "Add 'Fence it'";
// docs/FAMILY_PANEL.md §23, docs/LAND_GRANTS.md §5.3, docs/WOODS_AND_BUILDING.md §6.9-6.10, docs/TOWNS.md §4g).
//
// Held here, headlessly: work refused for want of a thing the family could get - the carreta's axe, logs and hide, the hunt's rifle,
// powder, seed, a hoe, a felling axe, coin - is flagged `short` and its counts lifted once onto the household (`wants`, by work), with
// `buy` naming what the family's own town sells; work refused for anything else (busy, too young) is not; a hunt with no powder is
// refused before anybody goes; the tanner sells a rawhide for 2 reales or 4 food; the page keeps such work greyed, as many as the bar
// has room for, with every way to get the first thing missing (a hide by a hunt and from the tanner); a plot tapped on the map is read
// for what it is and given to the right person; and the carreta's tip comes when the wagon is busy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { CHORES, choreAvailability, choreCatalogue, choresFor } from '../sim/chores.mjs';
import { beastsOf } from '../sim/beasts.mjs';
import { TRADES, RAWHIDE_COIN, RAWHIDE_FOOD, counterRefusal, tradesAt } from '../sim/shops.mjs';
import { errandOffers } from '../sim/errands.mjs';
import { settle, taught } from './support/settled.mjs';
import { barIcons, goalRoom, needsFor, nextStep, nextSteps, panelActions, plotHand, plotHands, plotJobFor, plotStage, plotWorkFor, WANT_FROM } from '../public/family-panel.js';
import { tipsPresent } from '../public/tips.js';

/** A class on the real land under way, hh-1 home with its site chosen, played by a student. */
function home(seed = 'field-click') {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  rollFamily(world, household);
  taught(settle(world));
  world.status = 'running';
  household.played = true;
  delete household.choosingSite;
  return { world, household };
}
const grown = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.age >= 16);
const entry = (world, household, entity, id) => choresFor(world, household, entity).find(one => one.id === id);
const wantsOf = world => projectWorld(world, 'hh-1').household.wants || {};

test('a carreta short of its logs or its hide is flagged short and counted on the household; one refused for anything else is not', () => {
  const { world, household } = home();
  const [hand, other] = grown(world, household);
  household.tools.axe = 0; household.logs = { wall: 0, sill: 1, poor: 1 }; household.resources.hides = 0;
  const refused = entry(world, household, hand, 'make-carreta');
  assert.equal(refused.can, false);
  assert.match(refused.why, /wants 3 logs/);
  assert.equal(refused.short, 1, 'a carreta short of logs is not flagged, and the bar would hide it');
  assert.deepEqual(wantsOf(world)['make-carreta'], { axe: [1, 1], logs: [2, 3], hide: [0, 1] });
  const view = projectWorld(world, 'hh-1');
  assert.ok(Object.values(view.work).flat().every(one => one.lack === undefined), 'the counts rode on every person\'s entry');
  // The logs in, the hide still wanting: the refusal is the hide's, still short.
  household.logs = { wall: 1, sill: 1, poor: 1 };
  const hide = entry(world, household, hand, 'make-carreta');
  assert.match(hide.why, /no hide in the house\. A hunt brings one home\./);
  assert.equal(hide.short, 1);
  assert.deepEqual(wantsOf(world)['make-carreta'], { axe: [1, 1], logs: [3, 3], hide: [0, 1] });
  // The carreta's own refusal for something no family can get today - the house site not chosen - is not short.
  household.choosingSite = true;
  const siting = entry(world, household, hand, 'make-carreta');
  assert.equal(siting.why, 'Choose where the house will stand first.');
  assert.equal(siting.short, undefined, 'the carreta was kept as a goal while the house site is not chosen');
  delete household.choosingSite;
  // Somebody already at work is refused for that, not for the hide: not short.
  applyAction(world, 'hh-1', { action: 'chore', entityId: other.id, chore: 'fell-trees' });
  const busy = entry(world, household, other, 'make-carreta');
  assert.equal(busy.can, false);
  assert.equal(busy.short, undefined, `a busy person's refusal was flagged short: ${busy.why}`);
  // With the hide (the felling called off, so the one felling axe is home): open, and nothing wanted for it.
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: other.id });
  household.resources.hides = 1;
  { const open = entry(world, household, hand, 'make-carreta'); assert.equal(open.can, true, open.why); }
  assert.equal(wantsOf(world)['make-carreta'], undefined, 'a family with all a carreta takes is still sent its wants');
});

test('a hunt whose rifle is at the war is short of the rifle; with no powder it is refused before anybody goes, short of powder', () => {
  const { world, household } = home('field-click-hunt');
  const [man, woman] = grown(world, household);
  assert.equal(entry(world, household, woman, 'hunt-land').can, true);
  assert.equal(wantsOf(world)['hunt-land'], undefined, 'a family with its rifle and powder is sent hunt wants');
  man.carries = { items: ['rifle'], doing: 'gone with the volunteers to Gonzales' };
  man.travel = { to: 'gonzales', purpose: 'call' };
  const hunt = entry(world, household, woman, 'hunt-land');
  assert.match(hunt.why, /has the rifle, gone with the volunteers to Gonzales\./);
  assert.equal(hunt.short, 1, 'a hunt refused for the rifle is not flagged, and the bar would hide where hunting is');
  assert.deepEqual(wantsOf(world)['hunt-land'], { rifle: [0, 1] });
  // The rifle home and the powder gone (owner, 2026-09-30, "Refuse it"): refused in words, before anybody goes.
  delete man.carries; man.travel = null;
  household.resources.powder = 0.5;
  const dry = entry(world, household, woman, 'hunt-land');
  assert.equal(dry.can, false, 'a hunt with no powder can still be sent');
  assert.equal(dry.why, 'There is no powder in the house to hunt with.');
  assert.equal(dry.short, 1);
  assert.deepEqual(wantsOf(world)['hunt-land'], { powder: [0, 1] });
  assert.throws(() => applyAction(world, 'hh-1', { action: 'hunt-land', entityId: woman.id, x: woman.location.x, y: woman.location.y }), /no powder/);
  assert.equal(choreAvailability(world, household, woman, 'hunt-timber').can, false, 'the timber hunt is still sent with no powder');
  // A child too young is refused for that, never flagged.
  const little = household.members.map(id => world.entities[id]).find(one => one.age < 10 && one.age >= 2);
  if (little) assert.equal(entry(world, household, little, 'hunt-land')?.short, undefined);
});

test('every gettable lack is short and counted - seed, a hoe, the felling axe, powder - and what the family\'s town sells is named', () => {
  const { world, household } = home('field-click-lacks');
  const [hand] = grown(world, household);
  household.plots = [{ id: 'plot-1', x: 1, y: 1, ground: 'prairie', state: 'cleared' }];
  household.resources.seed = 1;
  const seed = entry(world, household, hand, 'plant-field');
  assert.equal(seed.why, 'Not enough seed.');
  assert.equal(seed.short, 1);
  assert.deepEqual(wantsOf(world)['plant-field'], { seed: [1, 2] });
  household.resources.seed = 10; delete household.tools.hoe;
  assert.match(entry(world, household, hand, 'plant-field').why, /no hoe/);
  assert.deepEqual(wantsOf(world)['plant-field'], { hoe: [0, 1] });
  household.tools.hoe = 0; delete household.tools.axe;
  household.furniture = undefined;
  const felling = entry(world, household, hand, 'fell-trees');
  if (felling) { assert.equal(felling.short, 1, felling.why); assert.deepEqual(wantsOf(world)['fell-trees'], { axe: [0, 1] }); }
  household.tools.axe = 0; household.resources.powder = 1; hand.skills = { ...hand.skills, hunting: 1 };
  const mark = entry(world, household, hand, 'practise-shooting');
  assert.equal(mark.why, 'Not enough powder.');
  assert.deepEqual(wantsOf(world)['practise-shooting'], { powder: [1, 2] });
  // Which of those things the family's own town sells: powder at the store wherever there is one.
  const town = household.settlementId || 'gonzales';
  const buy = projectWorld(world, 'hh-1').household.buy || [];
  if (tradesAt(world, town).includes('store')) assert.ok(buy.includes('powder'), `powder is not named as bought in ${town}: ${buy}`);
  // Not gettable: a lobby, too young. Nothing short.
  const little = household.members.map(id => world.entities[id]).find(one => one.age < 10);
  if (little) assert.ok(choresFor(world, household, little).every(one => !one.short), 'a child too young was given a gettable lack');
});

test('the tanner sells a rawhide for 2 reales or 4 food, shown in the town errand and named as bought where there is a tanner', () => {
  const offer = TRADES.tanner.offers.find(one => one.id === 'rawhide');
  assert.ok(offer, 'the tanner sells no rawhide');
  assert.equal(offer.kind, 'sell');
  assert.deepEqual([offer.coin, offer.food, RAWHIDE_COIN, RAWHIDE_FOOD], [2, 4, 2, 4]);
  assert.deepEqual(offer.brings, { hides: 1 });
  const { world, household } = home('field-click-tanner');
  const [hand] = grown(world, household);
  const tanned = Object.keys(world.map.sites).find(id => tradesAt(world, id).includes('tanner'));
  assert.ok(tanned, 'no town of the class has a tanner');
  household.settlementId = tanned;
  const line = errandOffers(world, household, hand, tanned).lines.find(one => one.id === 'tanner:rawhide');
  assert.ok(line, 'the errand does not list the rawhide');
  assert.equal(line.price, '2 reales or 4 food for 1 hide');
  household.resources.money = 1;
  assert.match(counterRefusal(world, household, hand, 'tanner:rawhide:coin'), /costs 2 reales/);
  household.resources.money = 5; const before = household.resources.hides ?? 0;
  assert.match(offer.give(world, household, hand), /bought a rawhide from the tanner/);
  assert.equal(household.resources.hides, before + 1);
  // The carreta short of its hide: `buy` names the hide in a town with a tanner, and not in one without.
  household.tools.axe = 0; household.logs = { wall: 3, sill: 0, poor: 0 }; household.resources.hides = 0;
  assert.ok((projectWorld(world, 'hh-1').household.buy || []).includes('hide'), 'a town with a tanner does not offer the hide');
  const bare = Object.keys(world.map.sites).find(id => world.map.sites[id].kind === 'town' && tradesAt(world, id).length && !tradesAt(world, id).includes('tanner'));
  if (bare) { household.settlementId = bare; assert.ok(!(projectWorld(world, 'hh-1').household.buy || []).includes('hide'), `${bare} has no tanner and offers the hide`); }
});

test('the chore catalogue carries the seed a plot of each crop takes, for the plot chooser\'s buttons', () => {
  const plant = choreCatalogue().find(one => one.id === 'plant-field');
  assert.deepEqual(plant.seeds, { corn: 2, cotton: 3 });
  assert.equal(choreCatalogue().find(one => one.id === 'harvest-field').seeds, undefined);
  assert.equal(CHORES['hunt-land'].hunts, true);
});

test('the page keeps a short goal on the bar greyed, with what it wants, and offers every way to the first thing missing', () => {
  const wants = { 'make-carreta': { axe: [1, 1], logs: [3, 3], hide: [0, 1] }, 'hunt-land': { rifle: [0, 1] } };
  const entity = { id: 'p', name: 'Ysabel', health: { condition: 'well' }, location: { siteId: 'home-1' } };
  const offered = [
    { id: 'fell-trees', can: true },
    { id: 'visit-shop', can: true },
    { id: 'hunt-land', can: false, why: 'Jethro has the rifle, gone with the volunteers to Gonzales.', short: 1 },
    { id: 'make-carreta', can: false, why: 'A carreta is lashed together with rawhide, and there is no hide in the house. A hunt brings one home.', short: 1 },
    { id: 'dig-well', can: false, why: 'Choose where the house will stand first.' },
  ];
  const icons = panelActions({ entity, offered, wants });
  const carreta = icons.find(icon => icon.key === 'make-carreta');
  assert.equal(carreta.goal, true);
  assert.deepEqual(carreta.needs.map(need => [need.want, need.met]), [['axe', true], ['logs', true], ['hide', false]]);
  assert.equal(icons.find(icon => icon.key === 'dig-well').goal, undefined, 'a refusal the server did not flag became a goal');
  const bar = barIcons(icons).map(icon => icon.key);
  assert.deepEqual(bar, ['fell-trees', 'visit-shop', 'hunt-land', 'make-carreta']);
  assert.deepEqual(barIcons(icons.filter(icon => !['fell-trees', 'visit-shop'].includes(icon.key))), [], 'goals stood in place of a row\'s reason');
  // Room for goals: two rows of 80 px columns, at most six.
  assert.deepEqual(barIcons(icons, undefined, 1).map(icon => icon.key), ['fell-trees', 'visit-shop', 'hunt-land']);
  assert.equal(goalRoom(18, 804), 2);
  assert.equal(goalRoom(4, 1146), 6);
  assert.equal(goalRoom(30, 804), 0);
  // A hide: by a hunt, and from the tanner where the town has one (owner, 2026-09-30, "Tanner sells": both offered).
  const withHunt = [...bar, 'hunt-timber'];
  assert.deepEqual(nextSteps(carreta.needs, withHunt, ['hide']).map(way => [way.key, way.label, way.line || null]),
    [['hunt-land', 'Go hunting', null], ['visit-shop', 'Buy one from the tanner', 'tanner:rawhide']]);
  assert.deepEqual(nextSteps(carreta.needs, withHunt, []).map(way => way.label), ['Go hunting'], 'the tanner offered in a town with none');
  assert.equal(nextStep(carreta.needs, ['fell-trees'], ['hide']), null, 'pointed at work the bar does not have');
  assert.equal(nextStep(needsFor('make-carreta', { 'make-carreta': { axe: [1, 1], logs: [1, 3], hide: [0, 1] } }), bar).key, 'fell-trees');
  assert.deepEqual(nextStep(icons.find(icon => icon.key === 'hunt-land').needs, ['visit-shop'], ['rifle']), { want: 'rifle', key: 'visit-shop', label: 'Buy a rifle in town', line: 'gunsmith:buy-rifle' });
  assert.equal(nextStep(needsFor('plant-field', { 'plant-field': { seed: [1, 2] } }), ['visit-shop'], ['seed']).line, 'store:seed');
  assert.equal(needsFor('make-carreta', { 'make-carreta': { axe: [1, 1], logs: [3, 3], hide: [1, 1] } }), null);
  assert.deepEqual(WANT_FROM.hide.map(way => way.key), ['hunt-land', 'hunt-timber', 'visit-shop']);
});

test('a plot tapped on the map is read for what it is, and given to the person whose bar is shown when the server would send them', () => {
  assert.equal(plotStage({ state: 'staked' }), 'staked');
  assert.equal(plotStage({ state: 'cleared' }), 'bare');
  assert.equal(plotStage({ state: 'cleared', sown: true, crop: 'cotton' }), 'growing');
  assert.equal(plotStage({ state: 'cleared', sown: true, crop: 'corn', ripe: true }), 'ripe');
  assert.equal(plotStage(null), null);
  assert.deepEqual(['staked', 'bare', 'growing', 'ripe'].map(stage => plotJobFor({ staked: { state: 'staked' }, bare: { state: 'cleared' }, growing: { state: 'cleared', sown: true }, ripe: { state: 'cleared', sown: true, ripe: true } }[stage])),
    ['clear-plot', 'plant-field', 'plant-field', 'plant-field']);
  assert.equal(plotWorkFor({ state: 'cleared', sown: true }), null, 'a growing plot offered work');
  assert.equal(plotWorkFor({ state: 'cleared', sown: true, ripe: true }), 'harvest-field');
  const work = { pa: [{ id: 'plant-field', can: false, why: 'Pa is already felling.' }], ma: [{ id: 'plant-field', can: true }], kid: [{ id: 'plant-field', can: true }] };
  assert.equal(plotHand({ job: 'plant-field', work, barId: 'kid', mainId: 'pa', order: ['pa', 'ma', 'kid'] }), 'kid', 'the person whose bar is shown is passed over');
  assert.equal(plotHand({ job: 'plant-field', work, barId: 'pa', mainId: 'pa', order: ['pa', 'ma', 'kid'] }), 'ma', 'a busy main person was given the plot');
  assert.equal(plotHand({ job: 'harvest-field', work, barId: 'pa', mainId: 'pa', order: ['pa', 'ma', 'kid'] }), 'pa', 'nobody may: the bar\'s person, so the server says why in their name');
  assert.deepEqual(plotHands({ job: 'plant-field', work, order: ['pa', 'ma', 'kid'] }), ['ma', 'kid']);
});

test('the carreta\'s tip comes when the family could make one but for what it has not got, and its wagon is busy', () => {
  const { world, household } = home('field-click-tip');
  household.tools.axe = 0; household.logs = { wall: 3, sill: 0, poor: 0 }; household.resources.hides = 0;
  const view = () => projectWorld(world, 'hh-1');
  assert.equal(tipsPresent(view()).includes('cart'), false, 'the carreta\'s tip came with the wagon standing free at home');
  const wagon = beastsOf(world, household, 'wagon')[0];
  wagon.location = { x: wagon.location.x + 1, y: wagon.location.y, siteId: 'gonzales' };
  assert.equal(tipsPresent(view()).includes('cart'), true, 'no carreta tip with the wagon away and a hide short');
  household.resources.hides = 1;
  assert.equal(tipsPresent(view()).includes('cart'), false);
  stepWorld(world);
  assert.equal(household.wants, undefined, 'the wants were written into the save');
});
