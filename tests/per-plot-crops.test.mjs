// Each cleared plot its own crop (owner, 2026-09-30: "players can still plow new and extra fields right? so i as a player could
// have corn growing for food as well as cotton to sell?"; docs/LAND_GRANTS.md §5.2, sim/crops.mjs).
//
// A plot is bare, or sown with corn or with cotton, and stands its own real minutes from the tick it went in; the harvest brings in
// the ripe plots, each at its own crop's yield and its own fence. The student picks one plot or every bare plot and corn or cotton;
// seed is spent a plot at a time, nearest the house first, and a planting short of seed plants what it can and says so. A person on
// auto brings in what is ripe first and then plants each bare plot with the crop it last grew; the neighbours' director keeps a plot
// in corn. A class saved with one crop for the whole field reads it for every sown plot and writes each down as its own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { plotsOf, cropState } from '../sim/fields.mjs';
import { COTTON_SEED_BALES, STUDY_TICK_MS, growCrop, growMs, keepCrops } from '../sim/crops.mjs';
import { CORN_YIELD_PER_PLOT, COTTON_SEED_PER_PLOT, SEED_PER_PLOT, UNFENCED_LOSS, YIELD_PER_PLOT, needsWagonToHarvest } from '../sim/improvements.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { directorCrops } from '../sim/neighbours.mjs';
import { plotFacts } from '../sim/survey.mjs';
import { panelActions } from '../public/family-panel.js';

const MINUTE = 60000;
const running = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const until = (world, done, most = 600, realMs = undefined) => { let ticks = 0; while (!done() && ticks < most) { stepWorld(world, realMs === undefined ? {} : { realMs }); ticks++; } return ticks; };
const story = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);
const grownUps = (world, household) => household.members.map(id => world.entities[id]).filter(person => !Number.isFinite(person.age) || person.age >= 16);
/** The family's first patch and more cleared plots set down north of it a fifth of a mile apart, nearest the house first. */
function field(world, householdId, more = 1) {
  const household = world.households[householdId];
  const [patch] = plotsOf(world, household);
  const home = world.map.sites[household.homeSiteId];
  household.plots = [{ ...patch }, ...Array.from({ length: more }, (_, index) => ({ id: `plot-${index + 2}`, x: patch.x, y: +(patch.y + (patch.y >= home.y ? 0.2 : -0.2) * (index + 1)).toFixed(3), ground: 'prairie', state: 'cleared' }))];
  household.resources.seed = 30;
  household.tools.hoe = 0;
  return household.plots;
}
const plant = (world, householdId, person, crop, plot = null) => applyAction(world, householdId, { action: 'plant-field', entityId: person.id, crop, ...(plot && { x: plot.x, y: plot.y }) });
const skillOf = person => person.skills?.farming ?? 1;
const yieldFor = (amount, skill) => Math.round(amount * (skill === 3 ? 1.4 : skill === 2 ? 1.15 : 1) * 10000) / 10000;

test('corn on one plot and cotton on another: each its own crop, its own minutes and its own harvest', () => {
  const world = running('mixed');
  const household = world.households['hh-1'];
  const [near, far] = field(world, 'hh-1', 1);
  const thomas = world.entities['hh-1-thomas'];
  plant(world, 'hh-1', thomas, 'corn', near);
  until(world, () => !thomas.chore);
  plant(world, 'hh-1', thomas, 'cotton', far);
  until(world, () => !thomas.chore);
  assert.deepEqual([near.crop, far.crop], ['corn', 'cotton']);
  assert.deepEqual([cropState(household, near), cropState(household, far)], ['planted', 'planted']);
  assert.equal(household.resources.seed, 30 - SEED_PER_PLOT - COTTON_SEED_PER_PLOT, 'each plot took its own crop\'s seed');
  assert.ok(near.grownMs > far.grownMs, 'the corn went in first and has stood longer');
  // A real minute a tick: the corn comes on at its four minutes, the cotton not until its six.
  until(world, () => cropState(household, near) === 'ripe', 10, MINUTE);
  assert.equal(cropState(household, far), 'planted', 'the cotton came on with the corn');
  assert.equal(household.field.state, 'ripe', 'the family\'s field reads ripe while any plot is');
  assert.ok(story(world, 'hh-1').includes('The corn is ready to bring in.'));
  // The harvest brings in the corn alone; the cotton stands.
  const food = household.resources.food, cotton = household.resources.cotton ?? 0;
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'harvest-field' });
  assert.deepEqual(thomas.chore.plots, [near.id], 'the harvest went out for the ripe plot only');
  until(world, () => !thomas.chore);
  assert.equal(cropState(household, near), 'bare');
  assert.equal(near.crop, 'corn', 'a plot brought in remembers what it grew');
  assert.equal(cropState(household, far), 'planted', 'the cotton was cut green');
  assert.equal(household.resources.cotton ?? 0, cotton, 'cotton came in off a corn plot');
  assert.ok(household.resources.food > food, 'the corn came in as nothing');
  assert.equal(household.field.state, 'planted');
  until(world, () => cropState(household, far) === 'ripe', 10, MINUTE);
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'harvest-field' });
  until(world, () => !thomas.chore);
  // Less the bale kept back unginned for the plot's seed (owner, 2026-10-02; sim/crops.mjs `seedKept`).
  assert.equal(household.resources.cotton - cotton, Math.round((Math.round(yieldFor(YIELD_PER_PLOT, skillOf(thomas)) * (1 - UNFENCED_LOSS) * 10000) / 10000 - COTTON_SEED_BALES) * 10000) / 10000, 'one unfenced plot of cotton');
  assert.equal(household.field.state, 'bare');
  validateWorld(world);
});

test('a harvest of both crops: each plot its own yield and its own fence, food and bales', () => {
  const world = running('mixed-harvest');
  const household = world.households['hh-1'];
  const [corn, cotton] = field(world, 'hh-1', 1);
  corn.fence = 'sound';
  Object.assign(corn, { sown: true, crop: 'corn', grownMs: growMs('corn'), ripe: true });
  Object.assign(cotton, { sown: true, crop: 'cotton', grownMs: growMs('cotton'), ripe: true });
  validateWorld(world);
  const thomas = world.entities['hh-1-thomas'];
  const skill = skillOf(thomas);
  const shown = projectWorld(world, 'hh-1', 'student', { includeMap: false }).work[thomas.id].find(entry => entry.id === 'harvest-field');
  assert.equal(shown.crop.food, yieldFor(CORN_YIELD_PER_PLOT, skill), 'the control does not say the corn it would bring in beside the cotton');
  assert.equal(shown.crop.cotton, Math.round(yieldFor(YIELD_PER_PLOT * (1 - UNFENCED_LOSS), skill) * 10000) / 10000);
  applyAction(world, 'hh-1', { action: 'chore', entityId: thomas.id, chore: 'harvest-field' });
  until(world, () => !thomas.chore);
  // Each plot keeps back its seed (owner, 2026-10-02; sim/crops.mjs `seedKept`): the corn two, the cotton a bale for three.
  const r4 = value => Math.round(value * 10000) / 10000;
  const food = r4(yieldFor(CORN_YIELD_PER_PLOT, skill) - SEED_PER_PLOT), bales = r4(Math.round(yieldFor(YIELD_PER_PLOT * (1 - UNFENCED_LOSS), skill) * 10000) / 10000 - COTTON_SEED_BALES);
  assert.ok(story(world, 'hh-1').includes(`${thomas.name} brought in ${food} food and ${bales} cotton. ${SEED_PER_PLOT + COTTON_SEED_PER_PLOT} seed kept back for the next planting: ${SEED_PER_PLOT} of the corn, and ${COTTON_SEED_BALES} bale of the cotton left unginned for it. The rest had gone to stock in an unfenced field. The cotton nobody can eat; it has to go to the store.`),
    story(world, 'hh-1').slice(-5).join(' | '));
  assert.deepEqual([cropState(household, corn), cropState(household, cotton)], ['bare', 'bare']);
});

test('every bare plot, or the one tapped; seed a plot, and a planting short of seed plants the nearest and says so', () => {
  const world = running('all-bare');
  const household = world.households['hh-1'];
  const plots = field(world, 'hh-1', 2);
  const thomas = world.entities['hh-1-thomas'];
  // Seed for two plots of corn and not three: the nearest two go in, the third waits, and the family is told.
  household.resources.seed = SEED_PER_PLOT * 2 + 1;
  plant(world, 'hh-1', thomas, 'corn');
  assert.deepEqual(thomas.chore.plots, plots.map(plot => plot.id), 'every bare plot, nearest first');
  until(world, () => !thomas.chore);
  assert.deepEqual(plots.map(plot => cropState(household, plot)), ['planted', 'planted', 'bare']);
  assert.equal(household.resources.seed, 1, 'the seed was spent a plot at a time');
  assert.ok(story(world, 'hh-1').includes(`There was seed for 2 plots of the 3: ${thomas.name} planted the nearest, and one plot waits for seed.`), story(world, 'hh-1').slice(-5).join(' | '));
  assert.ok(story(world, 'hh-1').includes(`${thomas.name} put in corn on 2 plots.`));
  // The one left, tapped, in cotton: and a plot already in crop, or not cleared, is refused in its own words.
  household.resources.seed = 10;
  assert.throws(() => plant(world, 'hh-1', thomas, 'cotton', plots[0]), /That plot is already in corn, ready (within the minute|in about \d minutes)\./);
  assert.throws(() => plant(world, 'hh-1', thomas, 'wheat'), /Choose corn or cotton\./);
  assert.throws(() => plant(world, 'hh-1', thomas, 'toString'), /Choose corn or cotton\./);
  assert.match(plotFacts(world, household, plots[2], 'plant-field').words, /cleared, with no fence .*\. Bare\.$/);
  plant(world, 'hh-1', thomas, 'cotton', plots[2]);
  assert.deepEqual(thomas.chore.plots, [plots[2].id]);
  until(world, () => !thomas.chore);
  assert.deepEqual(plots.map(plot => plot.crop), ['corn', 'corn', 'cotton']);
  assert.equal(household.resources.seed, 10 - COTTON_SEED_PER_PLOT);
  household.plots.push({ id: 'plot-9', x: plots[0].x + 0.4, y: plots[0].y, ground: 'prairie', state: 'staked' });
  assert.throws(() => plant(world, 'hh-1', thomas, 'corn', household.plots.at(-1)), /Clear that ground before it is planted\./);
  // Without seed for one plot, nothing begins.
  const poor = running('all-bare-poor');
  field(poor, 'hh-1', 1);
  poor.households['hh-1'].resources.seed = SEED_PER_PLOT;
  assert.throws(() => plant(poor, 'hh-1', poor.entities['hh-1-thomas'], 'cotton'), /Cotton wants 3 seed a plot, and there is not that much in the house\./);
  validateWorld(world);
});

test('two sent to plant: the second plants what the first is not planting, and joins the first on the first\'s plots', () => {
  const world = running('two-planters');
  const household = world.households['hh-1'];
  const [near, far] = field(world, 'hh-1', 1);
  const [one, two] = grownUps(world, household);
  plant(world, 'hh-1', one, 'corn', near);
  plant(world, 'hh-1', two, 'cotton');
  assert.equal(two.chore.alongside, undefined, 'the second was set alongside a planting of other ground');
  assert.deepEqual(two.chore.plots, [far.id], 'every bare plot, less the one already being planted');
  until(world, () => !one.chore && !two.chore);
  assert.deepEqual([near.crop, far.crop], ['corn', 'cotton']);
  // Sent to a plot somebody is already planting: alongside them, their crop.
  const other = running('two-planters-alongside');
  const [plot] = field(other, 'hh-1', 0);
  const [a, b] = grownUps(other, other.households['hh-1']);
  plant(other, 'hh-1', a, 'cotton', plot);
  plant(other, 'hh-1', b, 'corn', plot);
  assert.equal(b.chore.alongside, a.id);
  until(other, () => !a.chore && !b.chore);
  assert.equal(plot.crop, 'cotton');
});

test('the wagon from three plots brought in at once, counted by what is ripe', () => {
  const world = running('wagon-ripe');
  const household = world.households['hh-1'];
  const plots = field(world, 'hh-1', 2);
  for (const plot of plots) Object.assign(plot, { sown: true, crop: 'corn', grownMs: 0 });
  assert.equal(needsWagonToHarvest(household), true, 'three plots in crop do not want the wagon');
  Object.assign(plots[0], { grownMs: growMs('corn'), ripe: true });
  Object.assign(plots[1], { crop: 'cotton', grownMs: growMs('cotton'), ripe: true });
  assert.equal(needsWagonToHarvest(household), false, 'two ripe plots want the wagon');
  Object.assign(plots[2], { grownMs: growMs('corn'), ripe: true });
  assert.equal(needsWagonToHarvest(household), true);
  validateWorld(world);
});

test('on auto, the field: ripe plots first, then each bare plot with the crop it last grew', () => {
  const world = running('auto-field');
  const household = world.households['hh-1'];
  const [corn, cotton, last] = field(world, 'hh-1', 2);
  household.field = { ...household.field, crop: 'corn' };
  // The near plot is ripe corn; the far ones last grew cotton and are bare.
  Object.assign(corn, { sown: true, crop: 'corn', grownMs: growMs('corn'), ripe: true });
  cotton.crop = 'cotton';
  last.crop = 'cotton';
  const thomas = world.entities['hh-1-thomas'];
  // The student plants the middle plot in corn by hand, and then puts him on auto: planting is his task.
  applyAction(world, 'hh-1', { action: 'plant-field', entityId: thomas.id, crop: 'corn', x: cotton.x, y: cotton.y });
  until(world, () => !thomas.chore);
  assert.equal(cotton.crop, 'corn', 'the student chose corn for the middle plot');
  assert.equal(thomas.order?.chore, 'plant-field');
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: thomas.id, auto: true });
  // A plot ripe and a plot bare: he brings in the ripe corn first, though his task is planting.
  until(world, () => Boolean(thomas.chore), 5);
  assert.equal(thomas.chore?.id, 'harvest-field', 'auto planted before bringing in the ripe plot');
  until(world, () => thomas.chore?.id === 'plant-field', 60);
  assert.deepEqual(thomas.chore?.sow, { [corn.id]: 'corn', [last.id]: 'cotton' }, 'the plots were not given back the crops they last grew');
  until(world, () => cropState(household, corn) === 'planted', 60);
  assert.deepEqual([corn.crop, cotton.crop, last.crop], ['corn', 'corn', 'cotton']);
  // A plot that last grew cotton gets cotton back, one never sown the family's own crop.
  const other = running('auto-field-own');
  const family = other.households['hh-1'];
  const [a, b] = field(other, 'hh-1', 1);
  family.field = { ...family.field, crop: 'corn' };
  a.crop = 'cotton';
  const man = other.entities['hh-1-thomas'];
  applyAction(other, 'hh-1', { action: 'set-auto', entityId: man.id, auto: true });
  applyAction(other, 'hh-1', { action: 'chore', entityId: man.id, chore: 'harvest-field' });
  until(other, () => man.chore?.id === 'plant-field', 20);
  assert.deepEqual(man.chore.sow, { [a.id]: 'cotton', [b.id]: 'corn' });
  validateWorld(other);
});

test('the families nobody plays keep a plot in corn to eat, and the rest in their own crop', () => {
  const world = running('director');
  const household = world.households['hh-2'];
  const [near, far] = field(world, 'hh-2', 1);
  household.field = { ...household.field, crop: 'cotton' };
  household.resources.food = 100;
  assert.deepEqual(directorCrops(world, household), { [near.id]: 'corn', [far.id]: 'cotton' });
  // A corn family: all corn; a plot that last grew cotton, cotton again.
  household.field = { ...household.field, crop: 'corn' };
  assert.deepEqual(directorCrops(world, household), { [near.id]: 'corn', [far.id]: 'corn' });
  far.crop = 'cotton';
  assert.deepEqual(directorCrops(world, household), { [near.id]: 'corn', [far.id]: 'cotton' });
  household.field = { ...household.field, crop: 'cotton' };
  // Corn already standing: all cotton.
  Object.assign(near, { sown: true, crop: 'corn', grownMs: 0 });
  assert.deepEqual(directorCrops(world, household), { [far.id]: 'cotton' });
  // One plot: cotton while the larder is full, corn when it is not.
  const one = running('director-one');
  const family = one.households['hh-2'];
  const [only] = field(one, 'hh-2', 0);
  family.field = { ...family.field, crop: 'cotton' };
  family.resources.food = 1000;
  assert.deepEqual(directorCrops(one, family), { [only.id]: 'cotton' });
  family.resources.food = 0;
  assert.deepEqual(directorCrops(one, family), { [only.id]: 'corn' });
  // And the director's own order plants it so.
  world.neighbours = true;
  const person = world.entities[household.members[0]];
  applyAction(world, 'hh-2', { action: 'plant-field', entityId: person.id, crops: directorCrops(world, household) });
  assert.deepEqual(person.chore.sow, { [far.id]: 'cotton' });
});

test('a class saved with one crop for the whole field: every sown plot reads it, and is written down as its own when it grows', () => {
  const world = running('old-field');
  const household = world.households['hh-1'];
  const plots = field(world, 'hh-1', 2);
  // Saved before 2026-09-30: two plots sown, one cleared after, and the family's one field state.
  plots[0].sown = true; plots[1].sown = true;
  household.field = { ...household.field, crop: 'cotton', state: 'planted', changedTick: world.tick, grownMs: 2 * MINUTE };
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  const old = saved.households['hh-1'];
  assert.deepEqual(old.plots.map(plot => cropState(old, plot)), ['planted', 'planted', 'bare']);
  const view = projectWorld(saved, 'hh-1', 'student', { includeMap: false }).land;
  assert.deepEqual(view.plots.map(plot => [plot.sown ?? false, plot.crop ?? null]), [[true, 'cotton'], [true, 'cotton'], [false, null]]);
  assert.deepEqual(view.crops.cotton, { growing: 2 });
  growCrop(saved, old, MINUTE);
  assert.deepEqual(old.plots.map(plot => [plot.crop ?? null, plot.grownMs ?? null]), [['cotton', 3 * MINUTE], ['cotton', 3 * MINUTE], [null, null]]);
  validateWorld(saved);
  // Ripe in the old way: each plot is ripe when written down.
  const ripe = JSON.parse(JSON.stringify(world));
  ripe.households['hh-1'].field = { ...ripe.households['hh-1'].field, state: 'ripe' };
  keepCrops(ripe, ripe.households['hh-1']);
  assert.deepEqual(ripe.households['hh-1'].plots.map(plot => cropState(ripe.households['hh-1'], plot)), ['ripe', 'ripe', 'bare']);
  validateWorld(ripe);
});

test('what cannot have been sown does not open, and the page is told each plot\'s crop but never its milliseconds', () => {
  const world = running('invalid-crops');
  const household = world.households['hh-1'];
  const plots = field(world, 'hh-1', 1);
  plots[1].state = 'staked';
  for (const bad of [{ crop: 'cotton' }, { crop: 'wheat', state: 'cleared' }, { grownMs: 5, state: 'cleared' }, { state: 'cleared', sown: true, crop: 'corn', ripe: true }, { state: 'cleared', sown: true, crop: 'corn', grownMs: -1 }]) {
    const copy = JSON.parse(JSON.stringify(world));
    Object.assign(copy.households['hh-1'].plots[1], bad);
    assert.throws(() => validateWorld(copy), /Invalid plot crop/, JSON.stringify(bad));
  }
  Object.assign(plots[0], { sown: true, crop: 'corn', grownMs: 12345 });
  validateWorld(world);
  const land = projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  assert.deepEqual(land.plots[0].sown, true);
  assert.equal(land.plots[0].crop, 'corn');
  assert.equal('grownMs' in land.plots[0], false, 'the milliseconds went to the page');
  assert.equal(land.crops.corn.growing, 1);
  assert.match(land.crops.next.words, /in about \d minutes/);
  assert.equal(STUDY_TICK_MS > 0, true);
  assert.equal(choreAvailability(world, household, world.entities['hh-1-thomas'], 'harvest-field').why, `The corn is not ready: it will be ${land.crops.next.words}.`);
});

test('the harvest icon says each crop it would bring in, and a field of corn alone is read as food as it always was', () => {
  const entity = { id: 'p', name: 'Ann', health: { condition: 'well' } };
  const note = crop => panelActions({ entity, offered: [{ id: 'harvest-field', can: true, crop }] }).find(icon => icon.key === 'harvest-field').note;
  assert.equal(note({ grown: 15, share: 5 / 6, food: 10, cotton: 3.3333 }), 'About 10 food and 3 cotton standing; the stock have had a third of each unfenced plot.');
  assert.equal(note({ grown: 5, share: 1, food: 0, cotton: 5 }), 'About 5 cotton standing.');
  assert.equal(note({ grown: 20, share: 1 }), 'About 20 food standing.');
});
