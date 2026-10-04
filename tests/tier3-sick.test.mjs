// Tier 3 of the 2026-09-29 triage, the sickness and wound rows (docs/audits/2026-09-29-triage.md 3.8, 3.9, 3.13-3.16; the owner,
// "yes, start them"). Each test was seen failing on `integration-2026-09-28` (4c38be85) before its fix, and each is caught by
// the injection `scripts/tier3-sick-injections.mjs` names for it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { counterRefusal, takeCounter } from '../sim/shops.mjs';
import { dieOfWounds, fightStorming, openQuestion, resolveConcepcionFighter, tellStorming } from '../sim/army.mjs';
import { advanceDisease, fallSick } from '../sim/disease.mjs';
import { talkTarget } from '../sim/childhood.mjs';
import { answerCampQuestion, openCampQuestion } from '../sim/camp.mjs';
import { houstonCamp } from '../sim/houston.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { flashbackScript } from '../sim/flashback.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
// Rolled as a student's family is in the lobby, so there are babies and small children in it (sim/family.mjs `rollFamily`).
const landed = (seed, count = 8) => {
  const world = settle(createGonzalesWorld(seed, count, { map: 'colonies' }));
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  return world;
};
const people = (world, household) => household.members.map(id => world.entities[id]);
const grownAtHome = (world, household) => people(world, household).filter(one => (one.age ?? 30) >= 16 && one.health.condition === 'well' && !one.travel && one.location.siteId === household.homeSiteId);
/** The first family with two grown people well at home. */
const twoGrown = world => Object.values(world.households).find(household => grownAtHome(world, household).length >= 2);
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
/** Lying wounded at home, as a man carried home or hurt about the place would be. */
const lyingWounded = (world, person, days = 21) => { person.health = { condition: 'wounded', grade: 'severe', recoversAt: world.minute + days * DAY }; person.task = 'rest'; person.chore = null; return person; };

// ------------------------------------------------------------------------------------------------ 3.8 the wounded at home

test('3.8: the doctor can be brought to somebody lying wounded at home, and the wound mends in half the time left', () => {
  const world = landed('t3-doctor');
  const household = twoGrown(world);
  const [patient, runner] = grownAtHome(world, household);
  household.resources.money = 10;
  assert.match(counterRefusal(world, household, runner, 'doctor:call:coin') || '', /Nobody/, 'the doctor is called out with nobody wounded');
  lyingWounded(world, patient);
  assert.equal(counterRefusal(world, household, runner, 'doctor:call:coin'), null, 'the doctor cannot be brought to a man lying wounded at home');
  takeCounter(world, household, runner, 'doctor:call:coin');
  assert.equal(patient.health.condition, 'wounded');
  assert.equal(patient.health.recoversAt, world.minute + Math.round(21 * DAY / 2), 'the doctor did not halve the wound');
  assert.equal(household.resources.money, 10 - 3, 'the doctor came out for nothing');
  assert.ok(world.events.some(event => event.householdId === household.id && /doctor/.test(event.text) && event.text.includes(patient.name)), 'the family was not told');
  validateWorld(world);
});

test('3.8: somebody lying wounded at home can be nursed, and is a day nearer mending for it', () => {
  const world = landed('t3-nurse-wound');
  const household = twoGrown(world);
  household.played = true;
  const [patient, nurse] = grownAtHome(world, household);
  lyingWounded(world, patient);
  const before = patient.health.recoversAt;
  assert.equal(choreAvailability(world, household, nurse, 'nurse-home').can, true, `nursing refused: ${choreAvailability(world, household, nurse, 'nurse-home').why}`);
  applyAction(world, household.id, { action: 'chore', entityId: nurse.id, chore: 'nurse-home' });
  until(world, () => nurse.chore?.id !== 'nurse-home', 200);
  assert.equal(nurse.chore?.id, undefined, 'the nursing never finished');
  assert.equal(patient.health.condition, 'wounded');
  assert.equal(patient.health.recoversAt, before - DAY, 'nursing did not bring the wound a day nearer mending');
  assert.ok(world.events.some(event => event.householdId === household.id && event.text.includes(`nursed ${patient.name}`)));
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ 3.9 a death from wounds

/** A storming in which somebody's dangerous wound will kill later: the storming tests' crowd, on the first seed that has one. */
let crowd = null;
function laterDeath() {
  crowd ??= (() => { const base = createGonzalesWorld('storming-crowd', 30, { map: 'colonies' }); base.status = 'running'; until(base, () => base.minute >= momentOf(base, 'organised') + 1); return base; })();
  for (let n = 0; n < 60; n++) {
    const world = structuredClone(crowd);
    world.seed = `t3-later-${n}`;
    const men = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
    world.army.members = men.map(p => p.id);
    openQuestion(world, 'milam', null);
    for (const man of men) world.army.questions.milam.asks[man.id] = 'yes';
    fightStorming(world, null);
    if (world.army.storming.later.length) return world;
  }
  throw new Error('no later death in sixty storming classes');
}

test('3.9: a death from wounds comes to the family with the word, as an account on its card as well as in the journal - never before', () => {
  const world = laterDeath();
  const [id] = world.army.storming.later;
  const person = world.entities[id], household = world.households[person.householdId];
  const died = dieOfWounds(world);
  assert.ok(died.includes(id));
  assert.equal(world.army.storming.outcomes.find(one => one.id === id).fate, 'died-of-wounds');
  // The world knows; the family's screen does not until the word reaches it (docs/ALAMO_FATES.md "no fate before the word").
  assert.notEqual(view(world, household.id).entities.find(one => one.id === id).health.condition, 'dead', 'the family saw the death before the word came');
  assert.ok(!world.events.some(event => event.householdId === household.id && /died of the wound/.test(event.text || '')), 'the family was told before the word came');
  assert.ok(!view(world, household.id).battleAccount, 'the account came before the word');
  tellStorming(world, null, new Set([household.id]));
  assert.equal(person.health.condition, 'dead', 'the word came, and the man is still alive');
  const line = world.events.find(event => event.householdId === household.id && event.actorId === id && /died of the wound/.test(event.text || ''));
  assert.ok(line, 'the death is not in the journal');
  const card = view(world, household.id).battleAccount;
  assert.ok(card && card.entityId === id && /died of the wound/.test(card.text), `no account on the family's card: ${JSON.stringify(card)}`);
  // Only that family's.
  const other = Object.values(world.households).find(one => one.id !== household.id);
  assert.notEqual(view(world, other.id).battleAccount?.entityId, id, 'another family was shown the account');
  // For a day, as the other accounts are.
  world.minute += DAY + 1;
  assert.notEqual(view(world, household.id).battleAccount?.entityId, id, 'the account stayed on the card past a day');
  validateWorld(world);
});

test('3.9: the flashback tells a death from wounds as one: hurt in the storming, and died of it - not "lived", and not a sickness', () => {
  const world = laterDeath();
  const [id] = world.army.storming.later;
  const person = world.entities[id], household = world.households[person.householdId];
  dieOfWounds(world);
  tellStorming(world, null);
  world.period = 3; world.status = 'ended';
  const script = flashbackScript(world, household.id);
  assert.ok(script, 'no flashback');
  const captions = script.beats.map(beat => beat.caption || '').join(' ');
  assert.doesNotMatch(captions, new RegExp(`${person.given || person.name.split(' ')[0]} was badly hurt, and lived`), 'the flashback says he lived');
  assert.match(captions, /died of it/, `the flashback does not tell the death from wounds: ${captions}`);
  assert.doesNotMatch(captions, /to sickness|died of a sickness/, 'the flashback counts a death from wounds as a sickness');
});

test('3.9: a family that heard of the storming before the wound killed is told of the death when it comes, with its card', () => {
  const world = laterDeath();
  const [id] = world.army.storming.later;
  const person = world.entities[id], household = world.households[person.householdId];
  tellStorming(world, null, new Set([household.id]));
  dieOfWounds(world);
  assert.equal(person.health.condition, 'dead');
  assert.ok(world.events.some(event => event.householdId === household.id && event.actorId === id && /died of the wound/.test(event.text || '')), 'the death was never told');
  assert.equal(view(world, household.id).battleAccount?.entityId, id, 'no account on the card');
});

test('3.9: a family the word never reached in the autumn is told of a death from wounds over the winter, and he is not "still lying wounded"', () => {
  const world = laterDeath();
  const [id] = world.army.storming.later;
  const person = world.entities[id], household = world.households[person.householdId];
  dieOfWounds(world);
  // Still mending when the winter opens, as a dangerous wound of December is (two months): the case that was told "still lying".
  person.health.recoversAt = world.minute + 120 * DAY;
  world.status = 'ended'; world.director.complete = true; world.director.milestones['bexar-end'] = true;
  beginSecondPeriod(world);
  assert.equal(person.health.condition, 'dead', 'a man who died of his wound came into the winter alive');
  const mine = world.events.filter(event => event.householdId === household.id && event.actorId === id);
  assert.ok(mine.some(event => /died of the wound/.test(event.text || '')), 'the death was never told');
  assert.ok(!mine.some(event => /still lying wounded/.test(event.text || '')), 'the family was told he is still lying wounded');
});

// ------------------------------------------------------------------------------------------------ 3.13 the nursing parent

test('3.13: a child with nothing to do does not call a nursing parent aside', () => {
  const world = landed('t3-child-nurse');
  const household = Object.values(world.households).find(one => people(world, one).some(p => (p.age ?? 30) < 10 && p.age >= 2) && grownAtHome(world, one).length >= 2);
  assert.ok(household, 'no family with a small child and two grown at home');
  const child = people(world, household).find(p => (p.age ?? 30) < 10 && p.age >= 2);
  const [nurse, sick, ...rest] = grownAtHome(world, household);
  // Everybody else old enough is away, so the nurse is the only one the child could go to.
  for (const other of [...rest, ...people(world, household).filter(p => p !== nurse && p !== sick && p !== child && (p.age ?? 30) >= 10)]) other.location = { ...other.location, siteId: 'gonzales' };
  sick.health = { condition: 'sick', recoversAt: world.minute + 4 * DAY };
  sick.location = { ...sick.location, siteId: 'gonzales' };
  assert.equal(talkTarget(world, household, child)?.id, nurse.id, 'the fixture is wrong: the child would not go to the nurse anyway');
  sick.location = { ...nurse.location };
  household.played = true;
  applyAction(world, household.id, { action: 'chore', entityId: nurse.id, chore: 'nurse-home' });
  assert.equal(nurse.chore?.id, 'nurse-home');
  assert.notEqual(talkTarget(world, household, child)?.id, nurse.id, 'a child with nothing to do goes to stop the nursing');
});

test('3.13: a child already on the way to a parent who is sent to nurse lets them go, and the nursing is never stood still', () => {
  const world = landed('t3-child-going');
  const household = Object.values(world.households).find(one => people(world, one).some(p => (p.age ?? 30) < 10 && p.age >= 2) && grownAtHome(world, one).length >= 2);
  const child = people(world, household).find(p => (p.age ?? 30) < 10 && p.age >= 2);
  // A woman nurses: nursing is the women's work while a woman is at home (owner, 2026-10-03; sim/custom.mjs).
  const grownHere = grownAtHome(world, household), nurse = grownHere.find(one => one.sex === 'female') || grownHere[0], sick = grownHere.find(one => one !== nurse);
  household.played = true;
  sick.health = { condition: 'sick', recoversAt: world.minute + 4 * DAY };
  for (const p of people(world, household)) if (p !== child) p.chore = p === sick ? null : p.chore;
  child.chore = null; child.auto = false; child.task = 'rest';
  // On the way to her (`going`), as a child is for one tick before they talk.
  child.talk = { withId: nurse.id, phase: 'going', since: world.tick };
  applyAction(world, household.id, { action: 'chore', entityId: nurse.id, chore: 'nurse-home' });
  assert.equal(nurse.chore?.id, 'nurse-home');
  const step = nurse.chore.step, progress = JSON.stringify(nurse.chore);
  stepWorld(world);
  assert.equal(child.talk, undefined, 'the child kept on to the nursing parent');
  assert.notEqual(nurse.aside?.kind, 'talk', 'the nursing parent was called aside');
  assert.ok(nurse.chore?.id !== 'nurse-home' || JSON.stringify(nurse.chore) !== progress || nurse.chore.step !== step, 'the nursing stood still');
});

// ------------------------------------------------------------------------------------------------ 3.14 Houston's camp

test('3.14: a very sick or wounded man in Houston\'s camp is not asked whether to go home, and the family is told why', () => {
  const world = landed('t3-camp', 8);
  world.period = 3;
  const men = Object.values(world.households).map(household => grownAtHome(world, household).find(p => p.sex === 'male')).filter(Boolean).slice(0, 3);
  assert.equal(men.length, 3);
  const siteId = houstonCamp(world) || 'san-felipe', site = world.map.sites[siteId];
  for (const man of men) {
    man.location = { x: site.x, y: site.y, siteId };
    man.service = { kind: 'houston', status: 'serving', since: world.minute, siteId };
    world.households[man.householdId].played = true;
  }
  const [verySick, wounded, well] = men;
  verySick.health = { condition: 'sick', disease: 'measles', recoversAt: world.minute + 5 * DAY, grave: true, graveDay: Math.floor(world.minute / DAY) };
  lyingWounded(world, wounded);
  openCampQuestion(world, 'leave', null, { beginTravel });
  assert.equal(well.service.leave, 'open', 'the well man was not asked');
  for (const man of [verySick, wounded]) {
    assert.notEqual(man.service.leave, 'open', `${man.health.condition} and asked whether to go home`);
    assert.ok(!world.events.some(event => event.actorId === man.id && /could not leave/.test(event.text || '')), 'asked, and then refused');
    assert.ok(world.events.some(event => event.actorId === man.id && /too sick to get up|lying wounded/.test(event.text || '')), 'the family was not told why');
  }
  // Somebody asked while well who turns very sick before answering: "go" is refused before anything is done, in words.
  well.health = { condition: 'sick', disease: 'flux', recoversAt: world.minute + 3 * DAY, grave: true, graveDay: Math.floor(world.minute / DAY) };
  assert.throws(() => answerCampQuestion(world, world.households[well.householdId], well, 'leave', 'yes', { beginTravel }), /too sick/);
  assert.equal(well.service.leave, 'open', 'the refused answer was settled anyway');
  answerCampQuestion(world, world.households[well.householdId], well, 'leave', 'no', { beginTravel });
  assert.equal(well.service.leave, 'no');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ 3.15 a wound on the sick

test('3.15: a slight hurt does not wipe a sickness: the sickness, the worse, is kept, for at least as long as the hurt', () => {
  const world = landed('t3-hurt-sick');
  const household = twoGrown(world);
  const [man] = grownAtHome(world, household);
  man.health = { condition: 'sick', disease: 'flux', recoversAt: world.minute + DAY, since: world.minute, day: Math.floor(world.minute / DAY) };
  resolveConcepcionFighter(world, man, 'wounded');
  assert.equal(man.health.condition, 'sick', 'a hurt at Concepción wiped the flux');
  assert.equal(man.health.disease, 'flux');
  assert.ok(man.health.recoversAt >= world.minute + 3 * DAY, 'kept sick for less time than the hurt would have kept him down');
  assert.ok(world.events.some(event => event.actorId === man.id && /still sick with the flux/.test(event.text || '')), 'not said');
  validateWorld(world);
});

test('3.15: in the storming a wound that lays a man down is kept over his sickness, and that is said; a slight hurt keeps the sickness', () => {
  laterDeath();
  let slight = 0, lying = 0;
  for (let n = 0; n < 60 && !(slight && lying); n++) {
    const world = structuredClone(crowd);
    world.seed = `t3-sick-stormers-${n}`;
    const men = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
    world.army.members = men.map(p => p.id);
    openQuestion(world, 'milam', null);
    // Everybody sick of the siege's flux, as many in the camp before Béxar were (`HIST-TEX-029`).
    for (const man of men) { world.army.questions.milam.asks[man.id] = 'yes'; man.health = { condition: 'sick', disease: 'flux', recoversAt: world.minute + 4 * DAY, since: world.minute, day: Math.floor(world.minute / DAY) }; }
    const { wounded } = fightStorming(world, null);
    for (const id of wounded) {
      const man = world.entities[id], { grade } = world.army.storming.outcomes.find(one => one.id === id);
      if (grade === 'slight') {
        slight++;
        assert.equal(man.health.condition, 'sick', 'a slight hurt wiped the flux');
        assert.equal(man.health.disease, 'flux');
      } else {
        lying++;
        assert.equal(man.health.condition, 'wounded', `a ${grade} wound did not lay him down`);
        assert.ok(world.events.some(event => event.actorId === id && /the flux/.test(event.text || '')), 'the sickness went without a word');
      }
    }
    validateWorld(world);
  }
  assert.ok(slight && lying, `slight ${slight}, lying ${lying}: nothing is being tested`);
});

test('3.15: every wound in the game - a chase, every battle, the scouts - is given through the one rule that keeps the worse', () => {
  // Read off the source, since a chase's ball or Coleto's square cannot be set up in a moment: no module sets a wound on a person
  // by assignment. The one exception is a march's weariness turning to a slight hurt (sim/directors.mjs `MARCH_COST`), which comes
  // only from well or tired, so there is no sickness for it to wipe.
  const offenders = [];
  for (const file of readdirSync(new URL('../sim/', import.meta.url), { recursive: true }).filter(name => String(name).endsWith('.mjs'))) {
    const text = readFileSync(new URL(`../sim/${String(file).replace(/\\/g, '/')}`, import.meta.url), 'utf8');
    text.split('\n').forEach((line, at) => {
      if (/\.health = \{ condition: ('wounded'|'minor-injury'|WOUND_GRADES\.|spec\.condition)/.test(line) && !/MARCH_COST|after === 'minor-injury'/.test(line)) offenders.push(`${file}:${at + 1}`);
    });
  }
  assert.deepEqual(offenders, [], 'a wound is set outright, wiping any sickness');
});

test('3.15: a sickness coming out never wipes a wound: it waits until the wound has mended', () => {
  const world = landed('t3-wound-sick');
  world.period = 3;
  const household = twoGrown(world);
  const [other] = grownAtHome(world, household);
  // Through the real path: a man lying wounded whose measles comes out keeps his wound, and takes it after.
  lyingWounded(world, other, 21);
  other.exposed = { measles: world.minute - 1 };
  other.had = [];
  advanceDisease(world);
  assert.equal(other.health.condition, 'wounded', 'the measles came out and wiped a wound');
  assert.ok(other.exposed?.measles > world.minute, 'the measles is not waiting for the wound');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ 3.16 the carried baby

function babyOnTheRoad(seed) {
  for (let n = 0; n < 40; n++) {
    const world = landed(`${seed}-${n}`, 8);
    world.period = 3;
    for (const household of Object.values(world.households)) {
      const baby = people(world, household).find(p => (p.age ?? 30) < 1);
      if (!baby) continue;
      household.flight = { status: 'ordered', orderedMinute: world.minute };
      const refuge = flightProjection(world, household).refuges.sort((a, b) => a.miles - b.miles)[0]?.id;
      if (!refuge) continue;
      flee(world, household, { take: {}, refuge });
      if (!baby.travel?.carried) continue;
      return { world, household, baby };
    }
  }
  throw new Error('no baby carried on the road');
}

test('3.16: a sick baby carried on the road while the family goes on is not nursed by being carried', () => {
  const { world, baby } = babyOnTheRoad('t3-baby');
  baby.health = { condition: 'sick', disease: 'whooping-cough', recoversAt: world.minute + 10 * DAY, since: world.minute, day: Math.floor(world.minute / DAY) };
  // A whole day of it, the family going on all the while.
  for (let step = 0; step <= 4; step++) {
    delete baby.travel.halted;
    delete baby.travel.waitUntil;
    advanceDisease(world);
    world.minute += DAY / 4;
  }
  assert.equal(baby.health.nursed, undefined, 'carried along the road for a day counted as a day\'s nursing');
});

test('3.16: a sick baby held through a whole day at rest - the family halted - is nursed for it, and not before the day is out', () => {
  const { world, household, baby } = babyOnTheRoad('t3-baby-held');
  baby.health = { condition: 'sick', disease: 'whooping-cough', recoversAt: world.minute + 10 * DAY, since: world.minute, day: Math.floor(world.minute / DAY) };
  const halt = () => { for (const one of people(world, household)) if (one.travel) one.travel.halted = true; };
  halt();
  advanceDisease(world);
  assert.equal(baby.health.nursed, undefined, 'a moment held counted as a whole day\'s nursing');
  world.minute += DAY / 2;
  halt();
  advanceDisease(world);
  assert.equal(baby.health.nursed, undefined, 'half a day held counted as a whole day\'s nursing');
  world.minute += DAY / 2;
  halt();
  advanceDisease(world);
  assert.equal(baby.health.nursed, Math.floor(world.minute / DAY), 'a whole day held at rest is not nursing');
  validateWorld(world);
});
