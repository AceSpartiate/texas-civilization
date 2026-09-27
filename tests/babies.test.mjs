// The family's babies (sim/babies.mjs; owner 2026-09-26, docs/CHILDREN.md §6): a baby crawls about where it was set down, naps,
// and now and then cries; the nearest woman of age comes, holds it and sings to it, puts it down for a nap and goes back to exactly
// what she was at; the only woman of age at home takes the baby with her rather than leave it; and none of it is allowed to become
// a time sink - a cap on a day's holding, nothing on a calendar too fast to stop for, and never a stall with a child who has come
// to talk.
//
// Every test was seen failing alone against the regression it guards - `node scripts/childhood-injections.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { COMFORT_CAP_TICKS, COMFORT_TICKS, CRAWL_REACH, HIP_PACE, NAP_TICKS, whoComes } from '../sim/babies.mjs';
import { WALK_SPEED } from '../sim/travel.mjs';
import { IDLE_TICKS } from '../sim/childhood.mjs';
import { settle, taught } from './support/settled.mjs';

/** A played family on its land with a mother, a father, and one baby; every other child grown and on the land. */
function family(seed) {
  const world = taught(settle(createGonzalesWorld(seed, 8, { map: 'colonies' })));
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const people = household => household.members.map(id => world.entities[id]);
  const household = Object.values(world.households).find(h => people(h).some(p => p.kin?.role === 'father') && people(h).some(p => p.kin?.role === 'mother')
    && people(h).filter(p => ['son', 'daughter'].includes(p.kin?.role)).length >= 2);
  assert.ok(household, `no family in ${seed} with both parents and two children`);
  household.played = true;
  world.status = 'running';
  const kids = people(household).filter(p => ['son', 'daughter'].includes(p.kin?.role));
  const baby = kids[kids.length - 1];
  baby.age = 1; baby.task = 'rest'; baby.health = { condition: 'well' };
  const grown = kids.slice(0, -1);
  for (const [at, kid] of grown.entries()) { kid.age = 16 + (at % 3); kid.task = 'work'; kid.sex = 'male'; }
  const father = people(household).find(p => p.kin?.role === 'father'), mother = people(household).find(p => p.kin?.role === 'mother');
  return { world, household, baby, father, mother, grown };
}
const view = (world, household) => projectWorld(world, household.id, 'student', { includeMap: false });
const row = (world, household, id) => view(world, household).entities.find(entity => entity.id === id);
const step = (world, n = 1) => { for (let t = 0; t < n; t++) { stepWorld(world); validateWorld(world); } };
/** The baby cries now: what the hashed share would have done on some tick, made to happen on this one. */
const cry = (world, baby) => { baby.baby = { state: 'cry', cried: world.tick, spot: baby.baby?.spot || { x: baby.location.x, y: baby.location.y } }; };
const near = (entity, to, dx) => { entity.location = { x: to.location.x + dx, y: to.location.y, siteId: to.location.siteId }; };

test('the rule: a baby crawls about where it was set down, naps, sleeps at night, and its row says which', () => {
  const { world, household, baby } = family('babies-crawl');
  const start = { ...baby.location };
  const seen = new Set();
  for (let t = 0; t < 12; t++) {
    step(world);
    if (baby.baby?.state === 'awake') seen.add(`${baby.location.x},${baby.location.y}`);
    assert.ok(Math.hypot(baby.location.x - start.x, baby.location.y - start.y) <= CRAWL_REACH + 1e-6 || baby.baby?.state === 'held', 'the baby crawled off the yard');
    assert.equal(baby.location.siteId, household.homeSiteId);
  }
  assert.ok(seen.size >= 3, `the baby never moved: ${seen.size} places in twelve ticks`);
  assert.match(row(world, household, baby.id).life, /^(Crawling about the yard|Napping|Crying|Held by)/);
  assert.equal(row(world, household, baby.id).baby?.state !== undefined, true, 'the page is not told what the baby is doing');
  world.minute += (22 - 6) * 60 - (world.minute % 1440);
  step(world);
  assert.equal(baby.baby.state, 'night');
  assert.equal(row(world, household, baby.id).life, 'Asleep for the night.');
});

test('the rule: a crying baby is held by the nearest woman of age, who sings to it, puts it down to nap and goes back to exactly her task and state', () => {
  const { world, household, baby, father, mother } = family('babies-held');
  household.resources.powder = 6;
  mother.skills = { ...mother.skills, hunting: 1 };
  mother.auto = true;
  applyAction(world, household.id, { action: 'chore', entityId: mother.id, chore: 'practise-shooting' });
  assert.ok(mother.chore, 'the mother could not be set to work');
  // The father is nearer, and a man: the mother is the one who comes.
  near(father, baby, 0.002); near(mother, baby, 0.02);
  step(world);
  const was = { location: { ...mother.location }, task: mother.task, auto: mother.auto };
  cry(world, baby);
  assert.equal(row(world, household, baby.id).life, 'Crying for somebody.');
  assert.ok(view(world, household).familyTalk.lines.some(line => line.speakerId === baby.id && line.text === '(crying)'), 'the baby’s cry is not heard on the page');
  step(world);
  assert.equal(mother.aside?.kind, 'baby', 'the nearest woman of age did not come');
  // Her work stands from the moment she goes to the baby (the tick's own work was done before the cry was answered).
  was.chore = structuredClone(mother.chore);
  assert.equal(father.aside, undefined, 'the father was stopped with the mother there');
  assert.equal(baby.baby.state, 'held');
  assert.match(row(world, household, mother.id).life, /^Seeing to/);
  assert.match(row(world, household, baby.id).life, new RegExp(`Held by ${mother.name}`));
  // Held, and sung to: a hush, then the lullaby hummed - its name, never its words.
  step(world);
  const sung = view(world, household).familyTalk.lines.find(line => line.speakerId === mother.id);
  assert.ok(sung && sung.text === '(humming)' && /^singing /.test(sung.manner), `nobody sang to the baby: ${JSON.stringify(sung)}`);
  assert.deepEqual(mother.chore, was.chore, 'her work went on while she held the baby');
  step(world);
  // Put down to nap, and back at exactly what she was at: the same work at the same step, where she stood, as she was.
  assert.equal(mother.aside, undefined, 'she never put the baby down');
  assert.equal(baby.baby.state, 'nap');
  assert.ok(baby.baby.until - world.tick <= NAP_TICKS && baby.baby.until > world.tick);
  assert.deepEqual(mother.chore, was.chore, 'she did not come back to the same work at the same step');
  assert.deepEqual(mother.location, was.location, 'she did not come back to where she was');
  assert.equal(mother.task, was.task); assert.equal(mother.auto, was.auto);
  assert.ok(world.events.some(event => event.actorId === mother.id && /sang .* to sleep/.test(event.text)), 'the family was not told');
  step(world);
  assert.notDeepEqual(mother.chore, was.chore, 'her work did not go on after the baby was down');
});

test('the rule: a well baby takes no more than the cap of one person’s day; past it the next comes, and with nobody near it settles', () => {
  const { world, household, baby, mother, father, grown } = family('babies-cap');
  near(mother, baby, 0.002); near(father, baby, 0.01);
  for (const one of grown) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  let held = 0;
  for (let n = 0; n < 6; n++) {
    cry(world, baby);
    step(world);
    if (mother.aside?.kind === 'baby') { held++; step(world, COMFORT_TICKS); } else break;
  }
  assert.equal(held * COMFORT_TICKS, COMFORT_CAP_TICKS, `the mother held the baby ${held} times in a day`);
  assert.equal(father.aside?.kind, 'baby', 'past her cap nobody else came');
  step(world, COMFORT_TICKS);
  father.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  mother.comforted = { day: Math.floor(world.minute / 1440), ticks: COMFORT_CAP_TICKS };
  cry(world, baby);
  step(world);
  assert.notEqual(baby.baby.state, 'held');
  assert.ok(world.events.some(event => /cried a while with nobody near, and settled/.test(event.text)), 'a baby with nobody near was not said to settle');
  // A sick baby is not capped: it needs more holding.
  baby.health = { condition: 'sick', recoversAt: world.minute + 9999 };
  father.location = { ...mother.location };
  cry(world, baby);
  step(world);
  assert.equal(mother.aside?.kind, 'baby', 'a sick baby was left because the day’s holding was spent');
});

test('the rule: who comes - a child minding the little ones stops nobody, a woman holding one baby takes the twin too, and with no woman of age the father comes', () => {
  const { world, household, baby, mother, father, grown } = family('babies-who');
  const minder = grown[0];
  minder.age = 8; minder.task = 'rest';
  applyAction(world, household.id, { action: 'chore', entityId: minder.id, chore: 'child-mind' });
  cry(world, baby);
  step(world);
  assert.equal(mother.aside, undefined, 'the mother was stopped with a child minding the baby');
  assert.ok(world.events.some(event => event.actorId === minder.id && /who has the little ones/.test(event.text)));
  // Twins: one woman holds both.
  minder.chore = null; minder.age = 17; minder.task = 'work';
  const twin = grown[1] || minder;
  twin.age = 1; twin.task = 'rest';
  near(twin, baby, 0.001);
  cry(world, baby); step(world);
  const holder = world.entities[baby.baby.by];
  assert.ok(holder, 'nobody came to the first baby');
  cry(world, twin); step(world);
  assert.equal(twin.baby.by, holder.id, 'a second woman was stopped for the twin');
  assert.deepEqual(holder.aside.babyIds.sort(), [baby.id, twin.id].sort());
  // With no woman of age at home, the nearest of age comes: the father.
  step(world, COMFORT_TICKS + 1);
  mother.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  for (const one of grown) if (one.age >= 10) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  assert.equal(whoComes(world, household, baby, household.homeSiteId).carer?.id, father.id);
});

test('the rule: the only woman of age at home takes the baby with her rather than leave it, and with another she leaves it with her', () => {
  const { world, household, baby, mother, grown } = family('babies-leave');
  for (const one of grown) one.sex = 'male';
  household.mainId = mother.id;
  applyAction(world, household.id, { action: 'travel', entityId: mother.id, destination: 'gonzales' });
  assert.ok(mother.travel, 'the mother was not sent');
  assert.equal(baby.carriedBy, mother.id, 'the only woman of age left the baby behind');
  assert.match(row(world, household, baby.id).life, new RegExp(`Carried by ${mother.name}`));
  assert.ok(world.events.some(event => event.actorId === mother.id && /on her hip/.test(event.text)), 'the family was not told she took the baby');
  step(world, 3);
  assert.deepEqual({ x: baby.location.x, y: baby.location.y }, { x: mother.location.x, y: mother.location.y }, 'the baby was not where she was');
  // Home again, the baby is set down to nap.
  for (let t = 0; t < 400 && !(mother.location.siteId === household.homeSiteId && !mother.travel); t++) {
    if (!mother.travel && mother.location.siteId === 'gonzales') applyAction(world, household.id, { action: 'travel', entityId: mother.id, destination: household.homeSiteId });
    stepWorld(world);
  }
  step(world);
  assert.equal(baby.carriedBy, undefined, 'the baby was never set down at home');
  assert.equal(baby.location.siteId, household.homeSiteId);
  // With an elder daughter of age at home, the mother leaves the baby with her.
  const again = family('babies-leave');
  const daughter = again.grown[0];
  daughter.sex = 'female';
  again.household.mainId = again.mother.id;
  applyAction(again.world, again.household.id, { action: 'travel', entityId: again.mother.id, destination: 'gonzales' });
  assert.equal(again.baby.carriedBy, undefined, 'the mother took the baby with another woman of age at home');
  assert.ok(again.world.events.some(event => new RegExp(`left ${again.baby.name} with ${daughter.name}`).test(event.text)));
});

test('the rule: with the baby on her hip she walks a quarter slower on foot, there and back, and her row says why; on the horse or with the wagon the baby changes nothing', () => {
  // On foot (owner, 2026-09-27: "goes a quarter slower on foot").
  const { world, household, baby, mother, grown } = family('babies-hip');
  for (const one of grown) one.sex = 'male';
  household.mainId = mother.id;
  applyAction(world, household.id, { action: 'travel', entityId: mother.id, destination: 'gonzales', mode: 'foot' });
  assert.equal(baby.carriedBy, mother.id);
  assert.equal(mother.travel.speed, WALK_SPEED * HIP_PACE, `she walks at ${mother.travel.speed} a tick with the baby on her hip`);
  assert.match(row(world, household, mother.id).life, new RegExp(`^On foot with ${baby.given || baby.name} on her hip: walking a quarter slower`), 'her row does not say why she is slower');
  // Walked there at that pace: the baby comes home on the same hip, and slower home too.
  for (let t = 0; t < 400 && mother.travel; t++) stepWorld(world);
  assert.equal(mother.location.siteId, 'gonzales');
  applyAction(world, household.id, { action: 'travel', entityId: mother.id, destination: household.homeSiteId, mode: 'foot' });
  assert.equal(mother.travel.speed, WALK_SPEED * HIP_PACE, 'she walks home at her own pace with the baby still on her hip');
  // Without the baby - another woman of age at home to leave it with - her pace is her own.
  const alone = family('babies-hip');
  alone.grown[0].sex = 'female';
  alone.household.mainId = alone.mother.id;
  applyAction(alone.world, alone.household.id, { action: 'travel', entityId: alone.mother.id, destination: 'gonzales', mode: 'foot' });
  assert.equal(alone.baby.carriedBy, undefined);
  assert.equal(alone.mother.travel.speed, WALK_SPEED, 'a woman with no baby on her hip was slowed');
  // Riding, and with the wagon: "they would go the logical speed of that method of transportation".
  // Her pace each way is compared with the same journey made with no baby to take (a daughter of age left at home with it).
  for (const mode of ['horse', 'wagon']) {
    const riding = family('babies-hip'), without = family('babies-hip');
    for (const one of riding.grown) one.sex = 'male';
    without.grown[0].sex = 'female';
    for (const { household, mother, world } of [riding, without]) {
      household.mainId = mother.id;
      applyAction(world, household.id, { action: 'travel', entityId: mother.id, destination: 'gonzales', mode });
    }
    assert.equal(riding.baby.carriedBy, riding.mother.id, `the baby was not taken ${mode}`);
    assert.equal(without.baby.carriedBy, undefined);
    assert.equal(riding.mother.travel.mode, mode);
    assert.equal(riding.mother.travel.speed, without.mother.travel.speed, `with the ${mode} the baby changed her pace: ${riding.mother.travel.speed} against ${without.mother.travel.speed}`);
    assert.notEqual(riding.mother.travel.hip, true, `the ${mode} journey is marked slowed by the baby`);
    assert.match(row(riding.world, riding.household, riding.mother.id).life || '', /no slower for it/, `her row with the ${mode} does not say the baby changes nothing`);
  }
});

test('the rule: the baby and a child who has come to talk never hold each other up', () => {
  const { world, household, baby, mother, father, grown } = family('babies-stall');
  const kid = grown[0];
  kid.age = 6; kid.task = 'rest';
  for (const one of grown.slice(1)) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  father.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  near(mother, kid, 0.004); near(baby, mother, 0.004);
  step(world, IDLE_TICKS + 2);
  assert.equal(mother.aside?.kind, 'talk', 'the child never came to talk');
  // The baby cries: she goes to it; the child is let go, not left holding her; the baby is never kept waiting.
  for (let round = 0; round < 3; round++) {
    // The day's cap is its own rule (above); here she has holding left in her day every round.
    mother.comforted = undefined;
    cry(world, baby);
    step(world);
    assert.equal(baby.baby.state, 'held', 'a child talking kept the mother from the baby');
    assert.equal(mother.aside.kind, 'baby');
    assert.equal(kid.talk, undefined, 'the child’s talk and the baby both held her');
    step(world, COMFORT_TICKS + IDLE_TICKS + 2);
    assert.ok(!mother.aside || mother.aside.kind === 'talk', 'she was left holding the baby');
  }
});

test('the rule: nobody is stopped by a baby on a calendar too fast to stop for, or in a family nobody plays', () => {
  const fast = family('babies-fast');
  fast.world.director.phase = 'gathering';
  cry(fast.world, fast.baby);
  step(fast.world);
  assert.equal(fast.mother.aside, undefined, 'a four-hour tick was stopped for a baby');
  const unplayed = family('babies-fast');
  unplayed.household.played = false;
  for (let t = 0; t < 60; t++) stepWorld(unplayed.world);
  assert.ok(!Object.values(unplayed.world.entities).some(entity => entity.aside), 'a family nobody plays was stopped by its baby');
  assert.equal(unplayed.baby.baby, undefined, 'a baby of a family nobody plays was moved');
});
