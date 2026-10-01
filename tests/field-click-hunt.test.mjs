// A field clicked for its crop, and the carreta and the hunt found (owner, 2026-09-30, after playing the release v2026.09.29.3:
// "when i was playing earlier, there was no mechanism for choosing what crop is planted on each field. let me click on the fields so
// i can select what is grown there. i never saw where i could hunt to get leather to make the little carts, and i really wanted one
// since i was using me wagon for something else."; docs/FAMILY_PANEL.md §23, docs/LAND_GRANTS.md §5.2, docs/WOODS_AND_BUILDING.md §6.6).
//
// Held here, headlessly: a carreta refused only for the axe, the logs or a hide is flagged `short` on the refusal and its counts ride
// once on the household (`wants`); a carreta refused for anything else is not; a hunt whose rifle is at the war is flagged and the
// rifle and the powder counted; the chore catalogue carries each crop's seed for the plot chooser; the page keeps such a goal on the
// bar greyed, with what it wants and the work that brings the first thing missing (a hide at the hunt); a plot tapped on the map is
// read for what it is and given to the right person; and the carreta's tip comes when the wagon is busy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { CHORES, choreCatalogue, choresFor } from '../sim/chores.mjs';
import { beastsOf } from '../sim/beasts.mjs';
import { settle, taught } from './support/settled.mjs';
import { barIcons, needsFor, nextStep, panelActions, plotHand, plotHands, plotJobFor, plotStage, plotWorkFor, WANT_FROM } from '../public/family-panel.js';
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

test('a carreta short of its logs or its hide is flagged short and counted on the household; one refused for anything else is not', () => {
  const { world, household } = home();
  const [hand, other] = grown(world, household);
  household.tools.axe = 0; household.logs = { wall: 0, sill: 1, poor: 1 }; household.resources.hides = 0;
  const refused = entry(world, household, hand, 'make-carreta');
  assert.equal(refused.can, false);
  assert.match(refused.why, /wants 3 logs/);
  assert.equal(refused.short, 1, 'a carreta short of logs is not flagged, and the bar would hide it');
  assert.deepEqual(projectWorld(world, 'hh-1').household.wants.carreta, { axe: [1, 1], logs: [2, 3], hide: [0, 1] });
  // The logs in, the hide still wanting: the refusal is the hide's, still short.
  household.logs = { wall: 1, sill: 1, poor: 1 };
  const hide = entry(world, household, hand, 'make-carreta');
  assert.match(hide.why, /no hide in the house\. A hunt brings one home\./);
  assert.equal(hide.short, 1);
  assert.deepEqual(projectWorld(world, 'hh-1').household.wants.carreta, { axe: [1, 1], logs: [3, 3], hide: [0, 1] });
  // Somebody already at work is refused for that, not for the hide: not short, so their bar draws no greyed carreta.
  applyAction(world, 'hh-1', { action: 'chore', entityId: other.id, chore: 'fell-trees' });
  const busy = entry(world, household, other, 'make-carreta');
  assert.equal(busy.can, false);
  assert.equal(busy.short, undefined, `a busy person's refusal was flagged short: ${busy.why}`);
  // With the hide (and the felling called off, so the one felling axe is home): open to make, and nothing wanted, so nothing is sent.
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: other.id });
  household.resources.hides = 1;
  { const open = entry(world, household, hand, 'make-carreta'); assert.equal(open.can, true, open.why); }
  assert.equal(projectWorld(world, 'hh-1').household.wants?.carreta, undefined, 'a family with all it needs is still sent its wants');
});

test('a hunt whose rifle is at the war is flagged short, and the rifle and the powder are counted until both are back', () => {
  const { world, household } = home('field-click-hunt');
  const [man, woman] = grown(world, household);
  assert.equal(entry(world, household, woman, 'hunt-land').can, true);
  assert.equal(projectWorld(world, 'hh-1').household.wants?.hunt, undefined, 'a family with its rifle and powder is sent hunt wants');
  // He goes to the war with the family's one rifle (sim/keeping.mjs `takeToWar`).
  man.carries = { items: ['rifle'], doing: 'gone with the volunteers to Gonzales' };
  man.travel = { to: 'gonzales', purpose: 'call' };
  const hunt = entry(world, household, woman, 'hunt-land');
  assert.equal(hunt.can, false);
  assert.match(hunt.why, /has the rifle, gone with the volunteers to Gonzales\./);
  assert.equal(hunt.short, 1, 'a hunt refused for the rifle is not flagged, and the bar would hide where hunting is');
  assert.deepEqual(projectWorld(world, 'hh-1').household.wants.hunt.rifle, [0, 1]);
  // And the powder gone: counted, with the rifle back.
  delete man.carries; man.travel = null;
  household.resources.powder = 0;
  assert.deepEqual(projectWorld(world, 'hh-1').household.wants.hunt, { rifle: [1, 1], powder: [0, 1] });
  // A child too young is refused for that, never flagged.
  const little = household.members.map(id => world.entities[id]).find(one => one.age < 10 && one.age >= 2);
  if (little) assert.equal(entry(world, household, little, 'hunt-land')?.short, undefined);
  assert.equal(typeof CHORES['hunt-timber'].short, 'function', 'the timber hunt of the invented country is not flagged the same way');
});

test('the chore catalogue carries the seed a plot of each crop takes, for the plot chooser\'s buttons', () => {
  const plant = choreCatalogue().find(one => one.id === 'plant-field');
  assert.deepEqual(plant.seeds, { corn: 2, cotton: 3 });
  assert.equal(choreCatalogue().find(one => one.id === 'harvest-field').seeds, undefined);
});

test('the page keeps a short goal on the bar greyed, with what it wants, and points a missing hide at the hunt', () => {
  const wants = { carreta: { axe: [1, 1], logs: [3, 3], hide: [0, 1] }, hunt: { rifle: [0, 1], powder: [2, 1] } };
  const entity = { id: 'p', name: 'Ysabel', health: { condition: 'well' }, location: { siteId: 'home-1' } };
  const offered = [
    { id: 'fell-trees', can: true },
    { id: 'hunt-land', can: false, why: 'Jethro has the rifle, gone with the volunteers to Gonzales.', short: 1 },
    { id: 'make-carreta', can: false, why: 'A carreta is lashed together with rawhide, and there is no hide in the house. A hunt brings one home.', short: 1 },
    { id: 'dig-well', can: false, why: 'There is no hoe in the house.' },
  ];
  const icons = panelActions({ entity, offered, wants });
  const carreta = icons.find(icon => icon.key === 'make-carreta');
  assert.equal(carreta.goal, true);
  assert.equal(carreta.can, false);
  assert.deepEqual(carreta.needs.map(need => [need.want, need.met]), [['axe', true], ['logs', true], ['hide', false]]);
  assert.equal(icons.find(icon => icon.key === 'dig-well').goal, undefined, 'a refusal the server did not flag became a goal');
  // The bar: what can be pressed, and the goals beside it; never the plain refusal.
  const bar = barIcons(icons).map(icon => icon.key);
  assert.deepEqual(bar, ['fell-trees', 'hunt-land', 'make-carreta']);
  // Nothing to press: the row's reason stands alone, without a greyed carreta in place of why.
  assert.deepEqual(barIcons(icons.filter(icon => icon.key !== 'fell-trees')), []);
  // The way on: a hide is got by hunting, when the hunt is on the bar; logs by felling.
  assert.deepEqual(nextStep(carreta.needs, bar), { want: 'hide', key: 'hunt-land', label: 'Go hunting' });
  assert.equal(nextStep(carreta.needs, ['fell-trees']), null, 'pointed at a hunt the bar does not have');
  assert.deepEqual(nextStep(needsFor('make-carreta', { carreta: { axe: [1, 1], logs: [1, 3], hide: [0, 1] } }), bar).key, 'fell-trees');
  // The hunt with the rifle away points to town for another; with nothing short there are no needs at all.
  assert.deepEqual(nextStep(icons.find(icon => icon.key === 'hunt-land').needs, ['visit-shop']), { want: 'rifle', key: 'visit-shop', label: 'Buy a rifle in town' });
  assert.equal(needsFor('make-carreta', { carreta: { axe: [1, 1], logs: [3, 3], hide: [1, 1] } }), null);
  assert.deepEqual(WANT_FROM.hide.keys, ['hunt-land', 'hunt-timber']);
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
  // The wagon away on the road (sim/keeping.mjs `holderOf`): the tip is due.
  const wagon = beastsOf(world, household, 'wagon')[0];
  wagon.location = { x: wagon.location.x + 1, y: wagon.location.y, siteId: 'gonzales' };
  assert.equal(tipsPresent(view()).includes('cart'), true, 'no carreta tip with the wagon away and a hide short');
  // With everything a carreta takes there is nothing to point at: no tip.
  household.resources.hides = 1;
  assert.equal(tipsPresent(view()).includes('cart'), false);
  // Stepping on stays sound with the wants on the household (no stored field: nothing to validate, no save version).
  stepWorld(world);
  assert.equal(household.wants, undefined, 'the wants were written into the save');
});
