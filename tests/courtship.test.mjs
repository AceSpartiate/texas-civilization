// The lone parent's path (owner, 2026-09-29; sim/courtship.mjs; docs/FAMILY_CREATION.md, *The lone parent's path*).
//
// "if a player is unlucky enough to have a lone parent, the following path is made available. a special ability appears when
// they reach their land ... it will send them, with their children to visit other nearby farms to ask neighbors for help in
// raising their house ... on the 2nd family they meet a family that has a son of eligible marriage age. the age will be the
// same as our lone parent ... afterwards we find our new family with two parents. a basic house is also prebuilt."
//
// Every test here was proved by injecting the regression it guards (scripts/lone-parent-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { canAnswerCalls, canFight, compositionFor, dealTraits, familyProjection, familyRoll, tableOf } from '../sim/family.mjs';
import { lookChosen } from '../sim/appearance.mjs';
import { buildRefusal, houseBuilt, houseSettled, shelterOf } from '../sim/houses.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { observedBy } from '../sim/town.mjs';
import { released } from '../sim/childhood.mjs';
import { AWAY_MINUTES, RAISED_PLAN, courtshipScript, pathRefusal } from '../sim/courtship.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
import { flashbackScript } from '../sim/flashback.mjs';
import { clipFor, sceneLayout, stepsOf } from '../public/courtship.js';

/** A seed whose first family rolls `size` people (3: a lone parent and two children), and whose lone parent is of `sex`. */
function seedFor(size, sex = null, stem = 'lone') {
  for (let n = 0; n < 200000; n++) {
    const seed = `${stem}-${n}`;
    if (familyRoll(seed, 'hh-1') !== size) continue;
    if (!sex) return seed;
    const world = createGonzalesWorld(seed, 5);
    rollFamily(world, world.households['hh-1']);
    const parent = world.households['hh-1'].members.map(id => world.entities[id]).find(one => ['father', 'mother'].includes(one.kin.role));
    if (parent.sex === sex) return seed;
  }
  throw new Error('no seed');
}
/** A class whose first family is a student's, rolled, on its land (its house site chosen on the real land), running. */
function onTheLand({ size = 3, sex = null, map = 'gonzales', stem = 'lone' } = {}) {
  const world = createGonzalesWorld(seedFor(size, sex, `${stem}-${map}`), 5, map === 'colonies' ? { map: 'colonies' } : {});
  for (const id of ['hh-1', 'hh-2']) { const household = world.households[id]; rollFamily(world, household); household.played = true; }
  world.status = 'running';
  for (let tick = 0; tick < 400 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  if (household.choosingSite) {
    const home = world.map.sites[household.homeSiteId];
    applyAction(world, 'hh-1', { action: 'choose-site', x: home.x, y: home.y });
    for (let tick = 0; tick < 60 && household.arriving; tick++) stepWorld(world);
  }
  return { world, household };
}
const people = (world, household) => household.members.map(id => world.entities[id]);
const parentsOf = (world, household) => people(world, household).filter(one => ['father', 'mother'].includes(one.kin?.role));
const view = (world, id = 'hh-1', role = 'student') => projectWorld(world, id, role, { includeMap: false });
function home(world, household) {
  for (let tick = 0; tick < 200 && household.courtship?.stage === 'away'; tick++) stepWorld(world);
}

test('the ability is offered to a student\'s family rolled with one parent, once it is on its land, and to nobody else', () => {
  const { world, household } = onTheLand();
  assert.equal(parentsOf(world, household).length, 1);
  const offer = view(world).courtship?.offer;
  assert.ok(offer, 'the family rolled with one parent is not offered the path');
  assert.equal(offer.can, true, offer.why);
  assert.match(offer.says, /neighbours/);
  assert.match(offer.note, new RegExp(`${AWAY_MINUTES / 60} hours`));
  // A family with two parents never is.
  const two = createGonzalesWorld(seedFor(6, null, 'two'), 5);
  rollFamily(two, two.households['hh-1']); two.households['hh-1'].played = true; two.status = 'running';
  for (let tick = 0; tick < 400 && two.households['hh-1'].arriving; tick++) stepWorld(two);
  assert.equal(compositionFor(two.households['hh-1'].roll, tableOf(two.households['hh-1'])).parents, 2);
  assert.equal(view(two).courtship, undefined, 'a family with two parents was offered the path');
  // The computer never takes it: a family nobody plays, and one whose student has gone, are refused and not offered.
  household.absent = true;
  assert.equal(view(world).courtship, undefined, 'a family whose student has gone was offered the path');
  assert.match(pathRefusal(world, household), /own student/);
  delete household.absent; household.played = undefined; delete household.played;
  assert.match(pathRefusal(world, household), /own student/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'ask-neighbours' }), /own student/);
});

test('not on the road in, not in the lobby, and on the real land not before the house site is chosen', () => {
  const world = createGonzalesWorld(seedFor(3, null, 'lone-road-colonies'), 5, { map: 'colonies' });
  const household = world.households['hh-1'];
  rollFamily(world, household); household.played = true;
  assert.equal(view(world).courtship, undefined, 'the lobby was offered the path');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'ask-neighbours' }), /once the class has begun/);
  world.status = 'running';
  assert.ok(household.arriving);
  assert.equal(view(world).courtship, undefined, 'the family on the road in was offered the path');
  for (let tick = 0; tick < 400 && household.arriving; tick++) stepWorld(world);
  assert.ok(household.choosingSite, 'the real land did not ask for a house site');
  const offer = view(world).courtship.offer;
  assert.equal(offer.can, false);
  assert.match(offer.why, /Choose where your house will stand first/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'ask-neighbours' }), /Choose where your house will stand first/);
});

test('pressed, the family is away for the day: its people refused work and roads, and seen by nobody', () => {
  const { world, household } = onTheLand();
  const [parent, eldest] = people(world, household);
  // Whatever the parent was at is left where it was: the family goes together. (The children let the parent go first.)
  for (const one of people(world, household)) released(world, one);
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: parent.id, chore: 'build-house' });
  assert.ok(parent.chore, 'the parent was given nothing to leave');
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  assert.equal(household.courtship.stage, 'away');
  assert.deepEqual(household.courtship.party, household.members);
  assert.equal(household.courtship.until - household.courtship.began, AWAY_MINUTES);
  for (const one of people(world, household)) { assert.equal(one.visiting, true); assert.equal(one.chore, null); }
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: eldest.id, chore: 'fell-trees' }), /away with the family at the neighbours' farms/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: parent.id, destination: 'gonzales' }), /away with the family/);
  assert.equal(choreAvailability(world, household, parent, 'build-house').can, false);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' }), /house waits until they are home/);
  // The family's own page draws them nowhere; a neighbour standing on the land sees nobody.
  assert.ok(view(world).entities.filter(one => household.members.includes(one.id)).every(one => one.visiting && one.location === null));
  const other = world.households['hh-2'];
  const visitor = world.entities[other.members[0]];
  visitor.location = { ...parent.location };
  assert.equal(observedBy(world, 'hh-2').some(one => household.members.includes(one.id)), false, 'another family saw the family that is away');
  // The children are with the family, not idle at home stopping a parent to talk (sim/childhood.mjs skips a family away).
  for (let tick = 0; tick < 6; tick++) stepWorld(world);
  assert.equal(household.courtship.stage, 'away');
  assert.ok(people(world, household).every(one => !one.aside && !one.talk), 'a child stopped a parent to talk while the family was away');
  // Pressed once: again is refused.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'ask-neighbours' }), /already been to the neighbours/);
  validateWorld(world);
});

test('home again, the family has two parents: the new one rolled like a parent, the lone parent\'s own age, with a stable id', () => {
  const { world, household } = onTheLand({ sex: 'female' });
  const parent = parentsOf(world, household)[0];
  const children = people(world, household).filter(one => one !== parent).map(one => one.id);
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const id = household.courtship.spouse.id;
  assert.equal(id, 'hh-1-spouse');
  assert.equal(world.entities[id], undefined, 'the new parent joined before the wedding');
  home(world, household);
  assert.equal(household.courtship.stage, 'home');
  assert.ok(world.minute >= household.courtship.until);
  const spouse = world.entities[id];
  assert.ok(spouse, 'nobody joined the family');
  assert.equal(household.members[1], id, 'the new parent is not second in the family, after the parent they married');
  assert.equal(spouse.kin.role, 'father');
  assert.equal(spouse.sex, 'male');
  assert.equal(spouse.age, parent.age, 'the new parent is not the lone parent\'s own age');
  assert.deepEqual(spouse.traits, dealTraits(world.seed, id, 'male', spouse.age), 'the new parent was not rolled on a parent\'s dice');
  assert.equal(lookChosen(spouse), true, 'the new parent\'s looks were left for the student to choose');
  assert.equal(spouse.kin.spouse, parent.id); assert.equal(parent.kin.spouse, id);
  assert.deepEqual(spouse.kin.stepchildren, children);
  for (const child of children) assert.deepEqual(world.entities[child].kin.parents, [parent.id], 'a child\'s own parents changed, and with them how they look');
  // Everything that reads "parents" sees them: calls, the fighting, the family book.
  assert.equal(canAnswerCalls(spouse), true); assert.equal(canFight(spouse), true);
  const book = familyProjection(world, household);
  assert.match(book.people.find(one => one.id === id).of, /^Married to .+\. Stepfather to .+\. Born a .+, of the farm .+\.$/);
  assert.match(book.people.find(one => one.id === parent.id).of, /^Married to /);
  for (const one of people(world, household)) assert.equal(one.visiting, undefined, 'somebody is still away visiting');
  validateWorld(world);
});

test('a lone father meets a daughter his own age', () => {
  const { world, household } = onTheLand({ sex: 'male' });
  const parent = parentsOf(world, household)[0];
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  const spouse = world.entities[household.courtship.spouse.id];
  assert.equal(spouse.sex, 'female'); assert.equal(spouse.kin.role, 'mother'); assert.equal(spouse.age, parent.age);
  assert.equal(canFight(spouse), false);
  const script = courtshipScript(world, household);
  assert.ok(script.scenes[1].lines.some(line => /hasn't taken her eyes off you/.test(line.text)));
});

test('a basic house is raised and lived in: built, the family under its roof, and the house work sees it as built', () => {
  const { world, household } = onTheLand({ map: 'colonies' });
  assert.equal(houseSettled(household), false);
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  assert.equal(household.house.plan, RAISED_PLAN);
  assert.equal(houseBuilt(household), true);
  assert.equal(houseSettled(household), true);
  assert.equal(household.improvements.cabin, 'sound');
  assert.equal(shelterOf(world, household).kind, 'house');
  assert.ok(household.house.placement, 'the raised house was set down nowhere on the real land');
  assert.match(buildRefusal(household, world) || '', /built/, 'the work on the house does not see it as built');
  assert.equal(view(world).land.shelter, 'house');
  assert.equal(view(world).courtship?.offer, undefined, 'the ability is still offered to a family with a house');
  validateWorld(world);
});

test('a house the family had begun is finished for it, not thrown away for another', () => {
  const { world, household } = onTheLand();
  applyAction(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  household.house.work = 3;
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  assert.equal(household.house.layout, 'jacal');
  assert.equal(houseBuilt(household), true);
  assert.equal(household.courtship.house, 'finished');
});

test('the family that raised its own house is not offered the path', () => {
  const { world, household } = onTheLand();
  household.house = { layout: 'jacal', work: 24 };
  household.improvements = { ...household.improvements, cabin: 'sound' };
  assert.equal(view(world).courtship, undefined);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'ask-neighbours' }), /roof of its own/);
});

test('nobody else is sent any of it: not another family, not the Host; the neighbours are no households and hide nothing', () => {
  const { world, household } = onTheLand();
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  assert.equal(view(world, 'hh-2').courtship, undefined, 'another family was sent the path');
  assert.equal(view(world, null, 'host').courtship, undefined, 'the Host was sent the path');
  const households = Object.keys(world.households);
  for (const family of household.courtship.neighbours) {
    assert.equal(households.includes(family.id), false, 'an invented neighbour family became a household');
    for (const one of family.people) assert.equal(world.entities[one.id], undefined, 'an invented neighbour became somebody in the world');
  }
  // The hidden stats of the new parent never reach a page, in the scenes or after.
  const planted = 9.123456;
  household.courtship.spouse.traits.strength = planted;
  assert.equal(JSON.stringify(view(world)).includes(String(planted)), false, 'the new parent\'s hidden strength was sent in the scenes');
  home(world, household);
  world.entities[household.courtship.spouse.id].traits.health = planted;
  assert.equal(JSON.stringify(view(world)).includes(String(planted)), false, 'the new parent\'s hidden health was sent');
  assert.equal(JSON.stringify(view(world, null, 'host')).includes(String(planted)), false, 'the Host was sent a hidden stat');
});

test('the scenes: four, in order, gentle, with the wedding by bond and its one line of history, until the student has walked them', () => {
  const { world, household } = onTheLand();
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const { script } = view(world).courtship;
  assert.deepEqual(script.scenes.map(scene => scene.id), ['first', 'second', 'wedding', 'after']);
  for (const scene of script.scenes) for (const line of scene.lines) assert.ok(script.cast[line.speaker], `${scene.id}: "${line.text}" is said by nobody in the cast`);
  const words = script.scenes.flatMap(scene => [...scene.lines.map(line => line.text), scene.caption, scene.closing, scene.between]).filter(Boolean).join(' ');
  assert.match(words, /married by bond/); assert.match(words, /priest/);
  assert.doesNotMatch(words, /kiss|love you|darling|sweetheart|beautiful body|marry me tonight/i, 'the words go past what a middle-school class is shown');
  assert.equal(script.scenes[2].history.kind, 'documented'); assert.equal(script.scenes[2].history.claimId, 'HIST-TEX-740');
  assert.ok(script.scenes.flatMap(scene => scene.lines).every(line => line.kind === 'reconstructed' && line.claimId === 'FIC-GONZ-950'));
  // Walked to the end, the scenes are not sent again, on this page or any other.
  applyAction(world, 'hh-1', { action: 'courtship-watched' });
  assert.equal(view(world).courtship, undefined);
  assert.throws(() => applyAction(world, 'hh-2', { action: 'courtship-watched' }), /has not been to the neighbours/);
});

test('the family\'s flashback remembers the wedding, and does not put the new parent on the road in', () => {
  const { world, household } = onTheLand();
  const parent = parentsOf(world, household)[0];
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  const spouse = world.entities[household.courtship.spouse.id];
  world.status = 'ended'; world.period = 3;
  const beats = flashbackScript(world, 'hh-1').beats;
  const wedding = beats.find(beat => beat.kind === 'wedding');
  assert.ok(wedding, 'the flashback has no wedding');
  assert.match(wedding.caption, /married by bond/);
  const first = name => String(name).split(' ')[0];
  const arrival = beats.find(beat => beat.kind === 'arrival');
  assert.match(arrival.caption, new RegExp(`^${first(parent.name)} came to new land`));
  assert.doesNotMatch(arrival.caption, new RegExp(first(spouse.name)), 'the new parent came in on the road, by the flashback');
});

test('a class saved with the family away opens away, and comes home; a save from before opens as it was', () => {
  const directory = mkdtempSync(join(tmpdir(), 'courtship-'));
  try {
    const { world, household } = onTheLand();
    applyAction(world, 'hh-1', { action: 'ask-neighbours' });
    const path = join(directory, 'save.json');
    writeSave(path, { saveVersion: 3, revision: 1, world });
    const opened = readSave(path).world;
    validateWorld(opened);
    assert.equal(opened.households['hh-1'].courtship.stage, 'away');
    home(opened, opened.households['hh-1']);
    assert.equal(parentsOf(opened, opened.households['hh-1']).length, 2);
    validateWorld(opened);
    // A family that never took the path has nothing stored, which is the correct empty value: no save version moved.
    assert.equal(opened.households['hh-2'].courtship, undefined);
    // A stored path that cannot be right is refused.
    opened.households['hh-1'].courtship.rite = 'elopement';
    assert.throws(() => validateWorld(opened), /lone parent's path/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('the page: everybody in a scene stands on it, the couple face each other close enough to hold hands, and a missing pose falls back', () => {
  const { world, household } = onTheLand();
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const { script } = view(world).courtship;
  for (const [width, height] of [[1366, 768], [1024, 600], [400, 760]]) {
    for (const scene of script.scenes) {
      const { places, h } = sceneLayout(scene, script.cast, width, height);
      assert.equal(places.length, scene.cast.length, `${scene.id} at ${width}: somebody in the scene was not placed`);
      for (const place of places) assert.ok(place.x > 0 && place.x < width, `${scene.id} at ${width}: ${place.id} stands off the scene`);
      if (scene.id === 'wedding') {
        const parent = places.find(place => script.cast[place.id].lone), spouse = places.find(place => script.cast[place.id].spouse);
        assert.equal(parent.face, 'e'); assert.equal(spouse.face, 'w');
        assert.ok(spouse.x - parent.x > 0 && spouse.x - parent.x < h * 0.7, 'the couple stand too far apart to hold hands');
      }
    }
    assert.ok(stepsOf(script.scenes[2]).some(step => step.type === 'history'));
  }
  const grown = Object.values(script.cast).find(one => one.band === 'adult' && !one.official);
  assert.equal(clipFor(grown, 'vow', 'w', () => false).id.endsWith('-idle-w'), true, 'a missing vow pose did not fall back to standing');
  assert.equal(clipFor(grown, 'laugh', 'w', () => false).id.endsWith('-speak'), true);
  assert.deepEqual(clipFor(grown, 'laugh', 'w', () => true).flip, true);
});
