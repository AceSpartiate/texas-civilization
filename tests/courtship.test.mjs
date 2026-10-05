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
import { canAnswerCalls, canFight, compositionFor, dealTraits, familyProjection, familyRoll, householdName, mainPersonId, tableOf } from '../sim/family.mjs';
import { actingFor } from '../sim/acting.mjs';
import { lookChosen } from '../sim/appearance.mjs';
import { buildRefusal, houseBuilt, houseSettled, shelterOf } from '../sim/houses.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { observedBy } from '../sim/town.mjs';
import { released } from '../sim/childhood.mjs';
import { AWAY_MINUTES, RAISED_PLAN, STEPCHILDREN, STEPCHILD_FROM, courtshipInvalid, courtshipScript, pathRefusal, youngestWithTwo } from '../sim/courtship.mjs';
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

test('a lone mother\'s family takes the new husband\'s name, and keeps the name it had in the book; every id stays', () => {
  const { world, household } = onTheLand({ sex: 'female' });
  applyAction(world, 'hh-1', { action: 'rename', surname: 'Hollister' });
  const ids = [...household.members];
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const his = household.courtship.neighbours[1].surname;
  home(world, household);
  assert.equal(household.surname, his, 'the family did not take the new husband\'s name');
  assert.equal(householdName(world, household), `the ${his} family`);
  for (const id of household.members) assert.ok(world.entities[id].name.endsWith(` ${his}`), `${world.entities[id].name} is not called by the family's new name`);
  assert.deepEqual(household.members.filter(id => ids.includes(id)), ids, 'an id changed with the name');
  assert.equal(household.id, 'hh-1');
  const book = familyProjection(world, household);
  assert.equal(book.name, `the ${his} family`); assert.equal(book.formerly, 'the Hollister family');
  assert.match(book.people.find(one => one.id === household.courtship.parentId).of, /Until the wedding, the Hollister family\.$/);
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && event.text.includes(`name, ${his}. Until the wedding it was the Hollister family.`)));
  // The Host's rows and the ending read the family's name as it is now.
  assert.ok(JSON.stringify(view(world, null, 'host')).includes(`the ${his} family`), 'the Host still reads the old name');
  validateWorld(world);
});

test('a new husband leads the family: its principal and main person, whom the calls and the family\'s decisions go to', () => {
  const { world, household } = onTheLand({ sex: 'female' });
  const mother = parentsOf(world, household)[0];
  household.mainId = mother.id;
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  const husband = world.entities[household.courtship.spouse.id];
  assert.equal(household.principalId, husband.id, 'the new husband is not the family\'s principal');
  assert.equal(husband.principal, true); assert.equal(mother.principal, false);
  assert.equal(mainPersonId(world, household), husband.id, 'the new husband is not the main person');
  assert.equal(actingFor(world, household)?.id, husband.id, 'the family\'s decisions do not go to the new husband');
  const page = view(world);
  assert.equal(page.household.principalId, husband.id);
  assert.equal(page.household.mainId, undefined, 'the page is told somebody other than the principal is the main person');
  validateWorld(world);
});

test('a lone father who marries keeps his name and stays the principal', () => {
  const { world, household } = onTheLand({ sex: 'male' });
  applyAction(world, 'hh-1', { action: 'rename', surname: 'Hollister' });
  const father = parentsOf(world, household)[0];
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  home(world, household);
  const wife = world.entities[household.courtship.spouse.id];
  assert.equal(household.surname, 'Hollister');
  assert.ok(wife.name.endsWith(' Hollister'), 'the new wife did not take his name');
  assert.equal(household.principalId, father.id); assert.equal(wife.principal, false);
  assert.equal(familyProjection(world, household).formerly, undefined);
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

test('the one who marries in is widowed and brings two children of ten or more, at the second farm and into the family at the wedding', () => {
  // The owner, 2026-10-04: "the person they're marrying should enter the family with two children that are at least 10 years old or
  // older"; and "you'll likely need to adjust the marriage cutscene stuff so that it takes this stuff into account".
  const { world, household } = onTheLand({ stem: 'stepkids' });
  const parent = parentsOf(world, household)[0];
  applyAction(world, 'hh-1', { action: 'rename', surname: 'Hollister' });
  const before = household.members.length;
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const path = household.courtship, spouse = path.spouse;
  assert.equal(spouse.children.length, STEPCHILDREN);
  for (const child of spouse.children) {
    assert.ok(child.age >= STEPCHILD_FROM && child.age <= 17, `a child of the spouse aged ${child.age}`);
    assert.ok(Number.isFinite(child.traits.strength) && Number.isFinite(child.traits.obedience), 'a child of the spouse was not dealt the hidden stats');
    assert.equal(world.entities[child.id], undefined, 'a child of the spouse joined before the wedding');
  }
  assert.ok(spouse.children[0].age > spouse.children[1].age, 'eldest first');
  assert.ok(spouse.age >= youngestWithTwo(spouse.sex), `a spouse of ${spouse.age} with children of ${spouse.children.map(child => child.age)}`);
  assert.ok(spouse.age - spouse.children[0].age >= (spouse.sex === 'female' ? 17 : 18), 'the spouse was too young at the elder child\'s birth');
  // The second farm: they are there, said once to be widowed, and one of them speaks; the wedding and afterwards have them too.
  const script = courtshipScript(world, household);
  const [, second, wedding, after] = script.scenes;
  for (const scene of [second, wedding, after]) for (const child of spouse.children) assert.ok(scene.cast.includes(child.id), `${child.given} is not in the ${scene.id} scene`);
  assert.ok(!script.scenes[0].cast.some(id => spouse.children.some(child => child.id === id)), 'the spouse\'s children were at the first farm');
  assert.ok(second.lines.some(line => new RegExp(`came home to us with ${spouse.children[0].given} and ${spouse.children[1].given} when (his|her) (wife|husband) died`).test(line.text)), 'the second farm does not say the spouse is widowed, with the children');
  assert.ok(second.lines.some(line => line.speaker === spouse.children[0].id), 'the spouse\'s eldest does not speak at the second farm');
  assert.ok(wedding.lines.some(line => line.speaker === parent.id && /this is your home now too/.test(line.text)), 'the wedding does not welcome them');
  assert.match(after.closing, new RegExp(`${spouse.children[0].given} and ${spouse.children[1].given} are one of the family now`));
  // At the wedding they stand at the spouse's side, as the family's own children stand at the parent's.
  const layout = sceneLayout(wedding, script.cast, 1366, 768);
  const x = id => layout.places.find(place => place.id === id)?.x;
  for (const child of spouse.children) assert.ok(x(child.id) > x(spouse.id), `${child.given} is not on the spouse's side at the wedding`);
  // Home: the family is the lone parent's, the new parent and the two, children eldest first, all called by the family's name.
  home(world, household);
  assert.equal(household.members.length, before + 1 + STEPCHILDREN);
  const kids = household.members.map(id => world.entities[id]).filter(one => ['son', 'daughter'].includes(one.kin.role));
  assert.deepEqual(kids.map(one => one.age), [...kids.map(one => one.age)].sort((a, b) => b - a), 'the children are not eldest first');
  for (const child of spouse.children) {
    const one = world.entities[child.id];
    assert.ok(one && household.members.includes(child.id), `${child.given} did not join the family`);
    assert.deepEqual(one.kin.parents, [spouse.id]);
    assert.ok(one.name.endsWith(` ${household.surname}`), `${one.name} is not called by the family's name`);
    const work = choreAvailability(world, household, one, one.sex === 'male' ? 'clear-plot' : 'keep-house');
    assert.ok(work.can || !/too young|custom|men's work|women's work/.test(work.why), `${one.name} cannot be given the family's work: ${work.why}`);
  }
  assert.deepEqual(world.entities[spouse.id].kin.children, spouse.children.map(child => child.id));
  assert.ok(parent.kin.stepchildren.length === STEPCHILDREN, 'the lone parent has no stepchildren');
  assert.ok(world.events.some(event => event.type === 'courtship' && /married by/.test(event.text) && event.text.includes(`${spouse.children[0].given} and ${spouse.children[1].given} came with`)), 'the story does not say they came');
  // The book: both parents have children and stepchildren.
  const book = familyProjection(world, household);
  assert.match(book.people.find(one => one.id === spouse.id).of, new RegExp(`(Father|Mother) to ${world.entities[spouse.children[0].id].name} and ${world.entities[spouse.children[1].id].name}\. Step(father|mother) to `));
  assert.match(book.people.find(one => one.id === parent.id).of, /Step(father|mother) to /);
  validateWorld(world);
  // A save keeps them, and one missing is caught.
  const directory = mkdtempSync(join(tmpdir(), 'stepkids-'));
  try {
    const file = join(directory, 'class.json');
    writeSave(file, { saveVersion: 3, revision: 1, world });
    const back = readSave(file).world;
    assert.ok(spouse.children.every(child => back.entities[child.id]), 'the spouse\'s children were lost in a save');
    delete back.entities[spouse.children[1].id];
    assert.throws(() => validateWorld(back));
    assert.equal(courtshipInvalid(back, back.households['hh-1']), "A married family is missing the new parent's children");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('a lone parent too young to marry a widow or widower with two children of ten marries one a few years older', () => {
  const { world, household } = onTheLand({ stem: 'stepkids-young' });
  const parent = parentsOf(world, household)[0];
  // Twenty-two today, and a child or two of their own of whatever ages they were dealt.
  parent.age = 22; parent.born = `${new Date(world.calendar?.start || Date.UTC(1835, 9, 1)).getUTCFullYear() - 23}-01-01`;
  applyAction(world, 'hh-1', { action: 'ask-neighbours' });
  const spouse = household.courtship.spouse;
  assert.equal(spouse.age, youngestWithTwo(spouse.sex), 'the spouse is not the youngest age with two children of ten');
  assert.ok(spouse.children.every(child => child.age >= STEPCHILD_FROM));
  for (let tick = 0; tick < 200 && !household.courtship.seen.includes('second'); tick++) stepWorld(world);
  assert.ok(world.events.some(event => new RegExp(`${spouse.given}, a few years older than`).test(event.text)), 'the story still says the spouse is the parent\'s own age');
});
