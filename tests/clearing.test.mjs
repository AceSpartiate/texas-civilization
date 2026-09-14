// Clearing, and the field: docs/LAND_GRANTS.md §5, build step 3.
//
// A staked plot is cleared a spell at a time by whoever the family sends, prairie ten spells, brush twenty and timber
// thirty with the felling axe; the work stays on the plot when they are called home, and everybody on it stops when it is
// cleared. The field is the cleared plots: planting sows each of them and walks out to each, a plot cleared while the
// crop grows is not in it, and the stock take their share only of what grows on an unfenced plot. Ruin returns every plot
// to staked. A class saved before plots reads its old field as plots and opens as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, createWorld, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CLEARING_SPELLS, plotsOf } from '../sim/fields.mjs';
import { UNFENCED_LOSS, YIELD_PER_PLOT, clearedOf } from '../sim/improvements.mjs';
import { plotFacts } from '../sim/survey.mjs';
import { createClassroom } from '../server/app.mjs';

const running = seed => {
  const world = createSettledWorld(seed, 5);
  world.status = 'running';
  return world;
};
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);
/** The family's first patch, and plots of the given ground set down beside it a fifth of a mile apart, staked. */
function withPlots(world, householdId, grounds) {
  const household = world.households[householdId];
  const [patch] = plotsOf(world, household);
  household.plots = [{ ...patch }, ...grounds.map((ground, index) => ({ id: `plot-${index + 2}`, x: patch.x, y: +(patch.y + 0.2 * (index + 1)).toFixed(3), ground, state: 'staked' }))];
  return household.plots;
}
const send = (world, householdId, entityId, action, plot) => applyAction(world, householdId, { action, entityId, x: plot.x, y: plot.y });
const until = (world, done, most = 600) => { let ticks = 0; while (!done() && ticks < most) { stepWorld(world); ticks++; } return ticks; };

test('a staked plot is cleared a spell at a time, and the work stays on it when the family calls the person home', () => {
  const world = running('clear-spells');
  const household = world.households['hh-1'];
  const [, prairie] = withPlots(world, 'hh-1', ['prairie']);
  const thomas = world.entities['hh-1-thomas'];
  send(world, 'hh-1', thomas.id, 'clear-plot', prairie);
  assert.equal(thomas.chore.plotId, prairie.id, 'the plot chosen goes with the work');
  until(world, () => (prairie.work || 0) >= 3);
  assert.equal(prairie.state, 'staked');
  assert.ok(Math.hypot(thomas.location.x - prairie.x, thomas.location.y - prairie.y) < 0.01, 'and the person is out on it');
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: thomas.id });
  for (let tick = 0; tick < 10; tick++) stepWorld(world);
  assert.equal(prairie.work, 3, 'called home, and the three spells put in are still on the plot');
  validateWorld(world);
  // Sent back, they carry on from there: the rest of the ten spells, not ten more.
  send(world, 'hh-1', thomas.id, 'clear-plot', prairie);
  const spellsBefore = prairie.work;
  until(world, () => !thomas.chore);
  assert.equal(prairie.state, 'cleared');
  assert.equal(prairie.work, undefined, 'finished work is not counted on cleared ground');
  assert.equal(CLEARING_SPELLS.prairie - spellsBefore, 7);
  assert.equal(clearedOf(household), 2);
  assert.ok(storyOf(world, 'hh-1').some(text => text.startsWith(`${thomas.name} finished clearing ten acres of prairie `) && text.endsWith('The field is 20 acres now.')), storyOf(world, 'hh-1').slice(-6).join(' | '));
  assert.ok(Math.hypot(thomas.location.x - prairie.x, thomas.location.y - prairie.y) > 0.1, 'and they walked back in');
  validateWorld(world);
});

test('timber is three times the work of prairie and wants the felling axe; many hands finish it sooner, and stop together', () => {
  assert.deepEqual(CLEARING_SPELLS, { prairie: 10, brush: 20, timber: 30 });
  const alone = running('clear-timber'), together = running('clear-timber');
  for (const world of [alone, together]) withPlots(world, 'hh-1', ['timber']);
  const [, timberAlone] = alone.households['hh-1'].plots, [, timberTogether] = together.households['hh-1'].plots;
  // No axe, no clearing timber - and the hoe will not do.
  const axe = alone.households['hh-1'].tools.axe;
  delete alone.households['hh-1'].tools.axe;
  assert.throws(() => send(alone, 'hh-1', 'hh-1-thomas', 'clear-plot', timberAlone), /Ten acres of timber want a felling axe/);
  for (const world of [alone, together]) world.households['hh-1'].tools.axe = axe ?? 0;
  const hoeWear = alone.households['hh-1'].tools.hoe;
  send(alone, 'hh-1', 'hh-1-thomas', 'clear-plot', timberAlone);
  const lone = until(alone, () => !alone.entities['hh-1-thomas'].chore, 2000);
  assert.equal(timberAlone.state, 'cleared');
  assert.ok(lone >= CLEARING_SPELLS.timber * 3, `thirty spells of three ticks took ${lone} ticks`);
  assert.equal(alone.households['hh-1'].tools.hoe, hoeWear, 'felling timber does not wear the hoe');
  const hands = together.households['hh-1'].members.filter(id => !together.entities[id].age || together.entities[id].age >= 10).slice(0, 2);
  for (const id of hands) send(together, 'hh-1', id, 'clear-plot', timberTogether);
  const shared = until(together, () => timberTogether.state === 'cleared', 2000);
  assert.ok(shared < lone * 0.75, `two hands took ${shared} ticks against one's ${lone}`);
  stepWorld(together);
  for (const id of hands) {
    const chore = together.entities[id].chore;
    assert.ok(!chore || chore.doing === 'coming in from the clearing', `${id} went on ${chore?.doing} on cleared ground`);
  }
});

test('clearing and fencing are sent to a plot the family has, and refused in a sentence otherwise', () => {
  const world = running('clear-refuse');
  const household = world.households['hh-1'];
  const [patch, brush] = withPlots(world, 'hh-1', ['brush']);
  const facts = (job, point) => plotFacts(world, household, point, job);
  assert.equal(facts('clear-plot', { x: patch.x + 3, y: patch.y }).why, 'Choose one of your staked plots.');
  assert.equal(facts('clear-plot', patch).why, 'That ground is already cleared.');
  assert.equal(facts('fence-plot', brush).why, 'Clear that ground before it is fenced.');
  assert.equal(facts('clear-plot', brush).can, true);
  assert.equal(facts('clear-plot', brush).plotId, brush.id);
  assert.match(facts('clear-plot', brush).words, /^Ten acres of brush .* of the house, staked\. 20 spells of clearing, with the hoe\.$/);
  household.tools.hoe = 5;
  assert.equal(facts('clear-plot', brush).why, 'The hoe is worn out and wants mending.');
  household.tools.hoe = 0;
  send(world, 'hh-1', 'hh-1-thomas', 'fence-plot', patch);
  assert.throws(() => send(world, 'hh-1', 'hh-1-mateo', 'fence-plot', patch), /Thomas is already fencing that plot/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-mateo', chore: 'clear-plot' }), /Choose one of your staked plots/, 'never sent without a plot');
  const lobby = createSettledWorld('clear-lobby', 5);
  const [lobbyPatch] = plotsOf(lobby, lobby.households['hh-1']);
  assert.throws(() => send(lobby, 'hh-1', 'hh-1-thomas', 'fence-plot', lobbyPatch), /once the class has begun/);
  // On the real land, not before the family says where the house stands.
  const real = createGonzalesWorld('clear-choosing', 5, { map: 'colonies' });
  real.status = 'running';
  until(real, () => !real.households['hh-1'].arriving, 300);
  const principal = real.households['hh-1'].principalId;
  assert.throws(() => send(real, 'hh-1', principal, 'fence-plot', { x: 0, y: 0 }), /Choose where the house will stand first/);
});

test('the field is the cleared plots: each is sown and walked to, and a plot cleared while the crop grows is not in it', () => {
  const near = running('field-walk'), far = running('field-walk');
  for (const world of [near, far]) world.households['hh-1'].resources.seed = 20;
  withPlots(near, 'hh-1', []);
  // The same ten acres, a mile and a half out.
  const [, distant] = withPlots(far, 'hh-1', ['prairie']);
  distant.y = +(distant.y + 1.3).toFixed(3); distant.state = 'cleared';
  far.households['hh-1'].plots = [far.households['hh-1'].plots[1]];
  validateWorld(far);
  const plantTicks = world => { applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-thomas', chore: 'plant-field' }); return until(world, () => !world.entities['hh-1-thomas'].chore); };
  const nearTicks = plantTicks(near), farTicks = plantTicks(far);
  assert.ok(farTicks >= nearTicks + 2, `ten acres a mile and a half out took ${farTicks} ticks to plant against ${nearTicks} by the house`);
  assert.equal(far.households['hh-1'].plots[0].sown, true);

  // Two cleared plots, one fenced; a third cleared after planting. The harvest is two plots, and only the unfenced one loses.
  const world = running('field-sown');
  const household = world.households['hh-1'];
  household.resources.seed = 20;
  const [patch, second, third] = withPlots(world, 'hh-1', ['prairie', 'prairie']);
  second.state = 'cleared';
  household.tools.hoe = 0;
  send(world, 'hh-1', 'hh-1-thomas', 'fence-plot', patch);
  until(world, () => !world.entities['hh-1-thomas'].chore);
  applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-thomas', chore: 'plant-field' });
  until(world, () => !world.entities['hh-1-thomas'].chore);
  assert.deepEqual(household.plots.map(plot => Boolean(plot.sown)), [true, true, false]);
  household.tools.hoe = 0;
  send(world, 'hh-1', 'hh-1-thomas', 'clear-plot', third);
  until(world, () => !world.entities['hh-1-thomas'].chore);
  assert.equal(third.state, 'cleared');
  assert.equal(third.sown, undefined, 'cleared after the seed went in, and nothing growing on it');
  // Cotton, so nothing is eaten out of what is counted while the harvest goes on.
  household.field = { ...household.field, state: 'ripe', crop: 'cotton' };
  household.tools.hoe = 0;
  const crop = 'cotton';
  const before = household.resources[crop] ?? 0;
  const farmer = world.entities['hh-1-thomas'];
  const skill = farmer.skills.farming, yieldFor = amount => Math.round(amount * (skill === 3 ? 1.4 : skill === 2 ? 1.15 : 1) * 10000) / 10000;
  applyAction(world, 'hh-1', { action: 'chore', entityId: farmer.id, chore: 'harvest-field' });
  until(world, () => !farmer.chore);
  const grown = yieldFor(YIELD_PER_PLOT * 2);
  assert.equal(household.resources[crop] - before, Math.round(grown * (1 - UNFENCED_LOSS / 2) * 10000) / 10000, 'two plots came in, and the stock had a third of the unfenced one');
  assert.deepEqual(household.plots.map(plot => plot.sown), [undefined, undefined, undefined], 'and nothing is standing now');
  validateWorld(world);
});

test('ruin takes every plot back to staked, and a class saved before plots opens with its old field as plots', () => {
  const old = createWorld('clear-old', 5);
  const household = old.households['hh-1'];
  household.field = { ...household.field, cleared: 3, state: 'planted', changedTick: 0 };
  household.improvements = { cabin: 'sound', fence: 'sound' };
  // Somebody was breaking new ground when the class was saved, under the work that no longer exists.
  const thomas = old.entities['hh-1-thomas'];
  thomas.chore = { id: 'clear-ground', step: 1, wait: 3, doing: 'breaking new ground' };
  thomas.task = 'work';
  validateWorld(old);
  const plots = projectWorld(old, 'hh-1', 'student').land.plots;
  assert.deepEqual(plots.map(plot => [plot.id, plot.state, plot.fence, plot.sown]), [['plot-1', 'cleared', 'sound', true], ['plot-2', 'cleared', 'sound', true], ['plot-3', 'cleared', 'sound', true]], 'three patches, fenced and in crop, as three plots');
  assert.equal(new Set(plots.map(plot => `${plot.x},${plot.y}`)).size, 3, 'side by side, not one on another');
  assert.equal(household.plots, undefined, 'and nothing written');
  old.status = 'running';
  stepWorld(old);
  assert.equal(thomas.chore, null, 'the retired work is left off');
  assert.ok(storyOf(old, 'hh-1').includes(`${thomas.name} left off the work unfinished.`));
  validateWorld(old);

  // A world cannot claim clearing, rails or seed that make no sense.
  const bad = running('clear-invalid');
  const [patch, staked] = withPlots(bad, 'hh-1', ['brush']);
  for (const [plot, change, message] of [[staked, { work: 20 }, /Invalid clearing/], [patch, { work: 2 }, /Invalid clearing/], [staked, { fence: 'sound' }, /Invalid plot fence/], [staked, { sown: true }, /Invalid sowing/]]) {
    Object.assign(plot, change);
    assert.throws(() => validateWorld(bad), message);
    for (const key of Object.keys(change)) delete plot[key];
  }
  validateWorld(bad);
});

test('families nobody plays survey ground near the house and clear it', () => {
  const world = createGonzalesWorld('clear-neighbours', 5, { neighbours: true });
  world.status = 'running';
  for (let tick = 0; tick < 700; tick++) stepWorld(world);
  validateWorld(world);
  const worked = Object.values(world.households).filter(household => (household.plots || []).some(plot => plot.state === 'cleared' && plot.id !== 'plot-1'));
  const staked = Object.values(world.households).filter(household => (household.plots || []).length > 1);
  assert.ok(staked.length >= 3, `only ${staked.length} families staked any ground`);
  assert.ok(worked.length >= 1, 'and none of them cleared any');
  for (const household of Object.values(world.households)) assert.ok((household.plots || []).length <= 3, `${household.id} staked more than it keeps`);
});

test('a family asks the server about clearing or fencing its own plots only', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-clearing-'));
  const app = createClassroom({ seed: 'clearing-http', savePath: join(dir, 'save.json'), tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count) });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Clearer', code: app.state.sessionCode }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const facts = await (await fetch(`${base}/api/plot?x=0&y=0&job=clear-plot`, { headers: { cookie } })).json();
    assert.equal(facts.facts.why, 'The family works its land once the class has begun.');
    assert.equal((await fetch(`${base}/api/plot?x=0&y=0&job=fence-plot`)).status, 401);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
