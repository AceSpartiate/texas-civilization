import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createWorld, stepWorld, applyAction, projectWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, RIPEN_TICKS, TOOL_LIFE, choreCatalogue, skillsFor, toolState } from '../sim/chores.mjs';
import { callAvailability } from '../sim/directors.mjs';

const running = (seed = 'chores', count = 5) => { const world = createWorld(seed, count); world.status = 'running'; return world; };
const send = (world, householdId, who, chore) => applyAction(world, householdId, { action: 'chore', entityId: `${householdId}-${who}`, chore });
function runUntil(world, done, limit = 400) {
  for (let tick = 0; tick < limit; tick++) { stepWorld(world); if (done()) return tick + 1; }
  throw new Error('chore never finished');
}

test('a chore is a program: it walks out, works, spends and yields, and comes home', () => {
  const world = running();
  const household = world.households['hh-1'], rosa = world.entities['hh-1-rosa'];
  const seedBefore = household.resources.seed;
  const yard = { ...rosa.location };
  send(world, 'hh-1', 'rosa', 'plant-field');
  assert.equal(rosa.chore.id, 'plant-field');
  // She goes out to the field, and her canonical site is still home while she is in it.
  runUntil(world, () => rosa.location.x !== yard.x || rosa.location.y !== yard.y);
  assert.equal(rosa.location.siteId, household.homeSiteId, 'working the field does not move her off her own land');
  const ticks = runUntil(world, () => !rosa.chore);
  assert.equal(household.field.state, 'planted');
  assert.equal(household.resources.seed, seedBefore - 2, 'planting spent exactly the seed it said it would');
  assert.equal(household.tools.hoe, 1, 'one use of the hoe');
  assert.ok(ticks > 4 && ticks < 40, `planting took a believable ${ticks} ticks`);
  validateWorld(world);
});

test('the field ripens on its own and the crop can then be brought in', () => {
  const world = running();
  const household = world.households['hh-1'];
  send(world, 'hh-1', 'rosa', 'plant-field');
  runUntil(world, () => household.field.state === 'planted');
  const plantedAt = world.tick;
  // Growth is time passing, not labour: nobody is working and it still comes on.
  runUntil(world, () => household.field.state === 'ripe');
  assert.ok(world.tick - plantedAt >= RIPEN_TICKS, 'the crop is not ready early');
  const foodBefore = household.resources.food;
  send(world, 'hh-1', 'rosa', 'harvest-field');
  runUntil(world, () => household.field.state === 'bare');
  assert.ok(household.resources.food > foodBefore, 'the harvest fed the family');
  validateWorld(world);
});

test('a worn tool is a visible schedule, never a hidden roll (FIC-GONZ-008)', () => {
  const source = readFileSync(fileURLToPath(new URL('../sim/chores.mjs', import.meta.url)), 'utf8');
  assert.doesNotMatch(source, /Math\.random/, 'chores must contain no randomness at all');
  const world = running();
  const household = world.households['hh-1'];
  // Wear is fixed per use, so the student can count the uses left before committing.
  household.tools.hoe = TOOL_LIFE - 1;
  assert.equal(toolState(household.tools.hoe), 'sound');
  household.tools.hoe = TOOL_LIFE;
  assert.equal(toolState(household.tools.hoe), 'worn');
  // A worn hoe blocks field work, and says so rather than failing silently.
  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const plant = projected.work['hh-1-rosa'].find(entry => entry.id === 'plant-field');
  assert.equal(plant.can, false);
  assert.match(plant.why, /worn/);
  assert.equal(projected.toolCondition.hoe.state, 'worn');
  // Mending restores it, and is open to whoever in the family is handiest.
  send(world, 'hh-1', 'rosa', 'mend-hoe');
  runUntil(world, () => household.tools.hoe === 0);
  assert.equal(toolState(household.tools.hoe), 'sound');
});

test('the whole family can be sent to work; only a parent or a grown child answers the historical call', () => {
  const world = running();
  // Rosa is not the principal and was previously offered nothing at all.
  send(world, 'hh-1', 'rosa', 'plant-field');
  assert.ok(world.entities['hh-1-rosa'].chore);
  // A call is answered by a parent or a child of sixteen or more (docs/FAMILY_CREATION.md
  // step 4). The founding four state no ages, so their children never answer - and their
  // mother now may, where once only the father could.
  assert.match(callAvailability(world, 'hh-1', world.entities['hh-1-mateo'], 'help').why, /too young to answer/);
  assert.equal(callAvailability(world, 'hh-1', world.entities['hh-1-elena'], 'help').can, true);
  // And nobody may reach into another family. The entity id has to be spelled out here:
  // asking household hh-2 to command "its own rosa" is a legitimate order, not a breach.
  assert.throws(() => applyAction(world, 'hh-2', { action: 'chore', entityId: 'hh-1-rosa', chore: 'plant-field' }), /your family/);
  assert.throws(() => applyAction(world, 'hh-2', { action: 'chore', entityId: 'hh-1-elena', chore: 'hunt-timber' }), /your family/);
  assert.equal(world.entities['hh-1-elena'].chore, null, 'and the refused order changed nothing');
});

test('skills differ within a family and are fixed for the life of the person', () => {
  const world = running();
  const family = world.households['hh-1'].members.map(id => world.entities[id]);
  assert.ok(family.every(person => person.skills.farming >= 1 && person.skills.hands <= 3));
  const signatures = new Set(family.map(person => JSON.stringify(person.skills)));
  assert.ok(signatures.size > 1, 'a family is not four identical workers');
  assert.deepEqual(skillsFor('hh-1-rosa'), skillsFor('hh-1-rosa'), 'skills are a pure function of identity');
  const before = { ...world.entities['hh-1-rosa'].skills };
  send(world, 'hh-1', 'rosa', 'plant-field');
  runUntil(world, () => !world.entities['hh-1-rosa'].chore);
  assert.deepEqual(world.entities['hh-1-rosa'].skills, before, 'working does not change who someone is');
});

test('distance to town is the household\'s own distance, so geography costs something', () => {
  const world = running('spread', 15);
  const timed = ['hh-1', 'hh-2', 'hh-3'].map(id => {
    const copy = running('spread', 15);
    copy.households[id].resources.food = 20;
    applyAction(copy, id, { action: 'chore', entityId: `${id}-thomas`, chore: 'fetch-seed' });
    const person = copy.entities[`${id}-thomas`];
    let ticks = 0;
    while (person.chore && ticks < 600) { stepWorld(copy); ticks++; }
    return ticks;
  });
  assert.ok(timed.every(ticks => ticks > 0 && ticks < 600), 'every household can reach town');
  assert.ok(new Set(timed).size > 1, 'families at different distances do not take the same time');
});

test('chores survive save and reload, and a person who cannot work stops working', () => {
  const world = running();
  send(world, 'hh-1', 'rosa', 'plant-field');
  send(world, 'hh-1', 'elena', 'hunt-timber');
  for (let tick = 0; tick < 6; tick++) stepWorld(world);
  const reloaded = JSON.parse(JSON.stringify(world));
  assert.deepEqual(reloaded, JSON.parse(JSON.stringify(world)), 'the world round-trips through JSON unchanged');
  stepWorld(world); stepWorld(reloaded);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(world)), 'a reloaded world steps identically');
  // Injury or capture stops the work without routine time resolving the condition.
  world.entities['hh-1-rosa'].health = { condition: 'captured' };
  stepWorld(world);
  assert.equal(world.entities['hh-1-rosa'].chore, null, 'a captured person is not still hoeing');
  assert.equal(world.entities['hh-1-rosa'].health.condition, 'captured', 'and the condition is preserved');
  validateWorld(world);
});

test('what a person may be asked to do is decided on the server, with a reason', () => {
  const world = running();
  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const offered = projected.work['hh-1-thomas'];
  // Every chore is on the list, refused or not - except house work for a family that already has a
  // roof, and helping raise a neighbour's walls for somebody not on a neighbour's land, which are not
  // refused but simply not there (sim/houses.mjs, `houseSettled` and `hostOf`) - and a well, for a family whose water is close
  // or that has one, and a lane for a family with none to cut (sim/homesite.mjs); this family is on the invented map, where
  // nobody needs either; and clearing, for a family with nothing staked to clear (sim/fields.mjs); and felling, where the
  // trees are not counted one by one, as they are not here, and hauling, with no logs lying out (sim/felling.mjs).
  assert.equal(offered.length, Object.keys(CHORES).filter(id => !CHORES[id].house && !CHORES[id].helps && !CHORES[id].well && !CHORES[id].lane && !CHORES[id].fells && !CHORES[id].hauling && id !== 'clear-plot').length, 'every chore is accounted for, refused or not');
  for (const entry of offered) {
    assert.ok(typeof entry.can === 'boolean');
    if (!entry.can) assert.ok(entry.why.length > 0, `${entry.id} says why it is refused`);
  }
  assert.ok(offered.find(entry => entry.id === 'harvest-field').why.match(/not ready/), 'a bare field cannot be harvested');
  // No other household's work is ever in this payload.
  const wire = JSON.stringify(projected);
  assert.doesNotMatch(wire, /hh-2/, 'one household never sees another household in its projection');
});

test('the chore catalogue is static and stays off the per-tick channel', () => {
  const world = running();
  const catalogue = choreCatalogue();
  assert.equal(catalogue.length, Object.keys(CHORES).length);
  for (const entry of catalogue) assert.ok(entry.name && entry.describe, `${entry.id} carries its own words`);

  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const wire = JSON.stringify(projected.work);
  // The per-tick half is a permission, not a description. Sending the descriptions to
  // every student every tick made them two thirds of the payload.
  for (const entry of catalogue) {
    assert.ok(!wire.includes(entry.describe.slice(0, 24)), `${entry.id}'s description does not ride on the tick`);
  }
  for (const offered of Object.values(projected.work)) {
    for (const entry of offered) {
      assert.equal(entry.name, undefined, 'no name on the tick channel');
      assert.equal(entry.describe, undefined, 'no description on the tick channel');
      assert.ok(typeof entry.can === 'boolean' && entry.id);
    }
  }
  // Exactly these keys and no others.
  //
  // The size bound below is a ceiling and catches gross growth; it cannot see creep. A
  // field worth about ninety bytes went back onto this channel during the powder work and
  // nothing noticed, which is how a per-tick payload grows: not in one careless step but
  // in a dozen small ones nobody had a reason to refuse. So the shape is an allow-list.
  // Adding a key here is a decision, and the client must actually read it.
  const allowed = new Set(['id', 'can', 'why', 'cost', 'haul', 'crop']);
  const haulKeys = new Set(['resource', 'got']);
  for (const offered of Object.values(projected.work)) {
    for (const entry of offered) {
      for (const key of Object.keys(entry)) {
        assert.ok(allowed.has(key), `"${key}" rides on every work entry every tick; does anything read it?`);
      }
      for (const key of Object.keys(entry.haul || {})) {
        assert.ok(haulKeys.has(key), `haul.${key} rides on the tick channel; the control works it out from got and carry`);
      }
    }
  }
  // And the whole projection stays small - measured on the worst case rather than the
  // best one. A fresh world is not what a class sends; a family that has worked all
  // afternoon is, and its remembered story is the part that grows.
  const busy = running();
  for (let tick = 0; tick < 284; tick++) {
    const worker = busy.entities['hh-1-rosa'];
    if (!worker.chore) { try { applyAction(busy, 'hh-1', { action: 'chore', entityId: worker.id, chore: 'hunt-timber' }); } catch { /* nothing to do today */ } }
    if (worker.chore?.ask) { try { applyAction(busy, 'hh-1', { action: 'answer-chore', entityId: worker.id, option: 'leave' }); } catch { /* already answered */ } }
    stepWorld(busy);
  }
  const worked = JSON.stringify(projectWorld(busy, 'hh-1', 'student', { includeMap: false })).length;
  // The old bound was 6000 and it was calibrated when a tick was one real second: thirty
  // students at 6 KB a second is 190 KB/s, which genuinely mattered. A tick is 9.5 seconds
  // now (docs/evidence/pace.json), so the same payload costs a twentieth of that. This
  // number is what a full afternoon of work actually weighs, with room, and the guard that
  // matters for waste is the allow-list above - it catches a dead field at any size.
  assert.ok(worked < 14000, `a working family's per-tick payload is ${worked} bytes by the end of a class`);
  assert.ok(JSON.stringify(projectWorld(busy, 'hh-1', 'student', { includeMap: false }).events).length < 5000,
    'a family’s remembered story is unbounded on the tick channel again');
  const size = JSON.stringify(projected).length;
  // 7000 until Survey (2026-09-14) put one more chore, a real control, on every person's list: 7108 measured then.
  assert.ok(size < 7500, `a fresh student's per-tick payload is ${size} bytes, which is too large`);
});
