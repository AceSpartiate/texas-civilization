// Houston's camp: docs/HOUSTON_CAMP.md, owner (2026-09-16): "Soldiers in Houston's Army should have things to do too.
// Drilling, etc." The camp's work - drill, forage, guard, the scouts - on a serving man's row in the shape every chore has,
// each with a consequence the family reads; drilling counting at San Jacinto through the battle's own roll; the army's two
// questions (leaving with the word of Goliad, the fork of the road) as a "!" for a played family and answered at once for
// one that does not choose; the director, auto and absence keeping a man from sitting idle; the Host's words. Nothing of it
// exists for a man not with Houston, and no saved class carries anything new.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { ARRIVAL_MINUTES, TIMELINE, momentOf } from '../sim/directors.mjs';
import { frailty, rollFates } from '../sim/army.mjs';
import { DRILLED_STEADINESS, DRILL_TO_STEADY, GROCES_FROM, HOUSTON_CAMPS, HOUSTON_WORD, MARCH_CAMPS, SAN_JACINTO, campClock, drilledSteady, houstonCamp } from '../sim/houston.mjs';
import { CAMP_CHORES, CAMP_QUESTIONS, CAMP_SHARES, SCOUT_HURT, campChoice, campInvalid, campQuestionOpen, campRefusal, scoutHurt } from '../sim/camp.mjs';
import { CHORES } from '../sim/chores.mjs';
import { GLORY_WEIGHT } from '../sim/glory.mjs';
import { calendarMinutes, TICK_MINUTES } from '../sim/clock.mjs';
import { setAbsent } from '../sim/absence.mjs';
import { whereWords, waitingOn } from '../sim/host.mjs';
import { share } from '../sim/scrape.mjs';
import { FORCED_MARCH_HOURS, WALK_SPEED, groundLeft, milesADay, propertyId } from '../sim/travel.mjs';
import { findPath } from '../sim/geography.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { isIdle, needsOf, panelActions } from '../public/family-panel.js';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);

// `camp-class-7` deals a father (hh-6) whose San Jacinto roll falls between the drilled and the undrilled line: wounded as he
// is, unhurt drilled (found by scanning seeds; the roll reads only the seed and the id, the weight only his dealt traits).
let shared = null;
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('camp-class-7', 8, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  return world;
})());
const grownMen = world => Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && one.health.condition === 'well' && one.sex === 'male' && (one.age ?? 0) >= 16 && !one.service && !one.travel && one.location.siteId === world.households[one.householdId].homeSiteId);
// A man at work at home may still be sent: `serve` puts down whatever he was doing, as an order does. Since clearing timber
// leaves logs lying (sim/improvements.mjs, 2026-09-17) more of the neighbours are busy hauling, and a test that wanted six
// idle men found four.
/** Put somebody with Houston at his camp, as if they had ridden there; a family somebody plays unless said otherwise. */
const serve = (world, person, { played = true, ...extra } = {}) => {
  const siteId = houstonCamp(world), site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind: 'houston', status: 'serving', since: world.minute, siteId, ...extra };
  if (played) world.households[person.householdId].played = true; else delete world.households[person.householdId].played;
  return person;
};
const work = (world, person) => view(world, person.householdId).work[person.id] || [];
const order = (world, person, chore) => applyAction(world, person.householdId, { action: 'chore', entityId: person.id, chore });
const finish = (world, person) => until(world, () => !person.chore, 60);
const awards = (world, person) => Object.values(world.glory?.[person.householdId]?.awards || {}).filter(award => award.personId === person.id);

test('the camp\'s work is on a serving man\'s row and nobody else\'s; three days\' drill make him steady and a fourth is refused; the camp\'s work counts once', () => {
  const world = spring();
  const [man, home] = grownMen(world);
  serve(world, man);
  world.households[home.householdId].played = true;
  // Only the camp's four, all open, and nothing else on the channel for him; nothing of the camp for somebody at home.
  assert.deepEqual(work(world, man).map(entry => entry.id), [...CAMP_CHORES]);
  assert.deepEqual(work(world, man).filter(entry => entry.id !== 'camp-scout').map(entry => entry.can), [true, true, true], JSON.stringify(work(world, man)));
  assert.ok(!work(world, home).some(entry => entry.id.startsWith('camp-')), 'the camp\'s work was offered at home');
  assert.throws(() => order(world, home, 'camp-drill'), /not with General Houston's army/);
  assert.doesNotMatch(JSON.stringify(view(world, home.householdId)), /camp-/, 'the camp rode a family\'s wire with nobody serving');
  // A day's drill, said and counted: the first of the camp's work is the one supporting award.
  order(world, man, 'camp-drill');
  assert.equal(man.chore.id, 'camp-drill');
  assert.ok(work(world, man).find(entry => entry.id === 'camp-forage').why.length > 0, 'a busy man was offered more work without a reason');
  finish(world, man);
  assert.equal(man.service.drilled, 1);
  assert.ok(world.events.some(event => event.actorId === man.id && /drilled a day with the company .* \(1 of 3 days/.test(event.text)), 'the drill was not said');
  const served = awards(world, man).filter(award => award.event === 'houston-camp');
  assert.equal(served.length, 1); assert.equal(served[0].role, 'served'); assert.equal(GLORY_WEIGHT.served, 1);
  assert.ok(GLORY_WEIGHT.served < GLORY_WEIGHT.fought, 'the camp\'s work rivals the fight');
  const total = world.glory[man.householdId].total;
  for (let day = 2; day <= DRILL_TO_STEADY; day++) { order(world, man, 'camp-drill'); finish(world, man); }
  assert.equal(man.service.drilled, DRILL_TO_STEADY);
  assert.ok(drilledSteady(man));
  assert.ok(world.events.some(event => event.actorId === man.id && /steady in the line now/.test(event.text)), 'standing steady was not said');
  assert.equal(world.glory[man.householdId].total, total, 'the camp\'s work was counted again');
  assert.match(work(world, man).find(entry => entry.id === 'camp-drill').why, /drilled 3 days and stands steady/);
  assert.throws(() => order(world, man, 'camp-drill'), /stands steady in the line/);
  // The card reads it, never a fate; the order is refused for a man at home in the words every order gets.
  const shown = view(world, man.householdId).entities.find(one => one.id === man.id).service;
  assert.equal(shown.drilled, DRILL_TO_STEADY);
  assert.equal(shown.fate, undefined);
  validateWorld(world);
  // A saved camp that cannot be.
  man.service.leave = 'maybe';
  assert.match(campInvalid(world), /camp answer/);
  man.service.leave = 'no'; man.service.drilled = -1;
  assert.match(campInvalid(world), /camp count/);
  man.service.drilled = 3;
  assert.equal(campInvalid(world), null);
});

test('drilling counts at San Jacinto: a drilled man\'s weight in the battle\'s roll is three quarters of his frailty, and the word says so', () => {
  // The rule itself, over a crowd: nobody is hurt drilled who would not have been, and fewer are hurt.
  const crowd = { seed: 'drill-crowd', entities: {} };
  for (let n = 0; n < 3000; n++) crowd.entities[`p${n}`] = { id: `p${n}`, traits: { strength: 1 + (n % 10), health: 2 + (n % 17) } };
  const ids = Object.keys(crowd.entities);
  const plain = rollFates(crowd, ids, { event: 'san-jacinto', ...SAN_JACINTO });
  const drilled = rollFates(crowd, ids, { event: 'san-jacinto', ...SAN_JACINTO, weightOf: person => frailty(person) * DRILLED_STEADINESS });
  const hurt = fates => fates.filter(one => one.fate !== 'unhurt').length;
  assert.ok(hurt(drilled) < hurt(plain), `drilling did not steady the crowd: ${hurt(drilled)} hurt against ${hurt(plain)}`);
  assert.ok(hurt(drilled) > hurt(plain) * 0.6, 'drilling took away more than a quarter of the risk');
  for (let i = 0; i < ids.length; i++) assert.ok(plain[i].fate !== 'unhurt' || drilled[i].fate === 'unhurt', 'a drilled man was hurt where an undrilled one was not');
  // In the class: one man drilled and one not, and the drill shows in what the battle deals him.
  //
  // Until 2026-09-17 this named hh-6 of this seed, whose dealt traits put his roll between the drilled and the undrilled line.
  // Which men are still free to serve moves with everything else the neighbours do - the store's counter and the logs left by
  // clearing both shifted it - and that seed now sends him to Béxar to die. So the man is found instead of named, and the
  // constitution that puts his roll in the band is dealt to him here. The roll itself is untouched: it reads only the class's
  // seed and his id (sim/army.mjs `rollFates`), and it is the same roll the battle makes.
  const world = spring();
  const fateOf = (one, weightOf) => rollFates(world, [one.id], { event: 'san-jacinto', ...SAN_JACINTO, ...(weightOf ? { weightOf } : {}) })[0].fate;
  const worse = ['unhurt', 'wounded', 'killed'];
  let father = null;
  for (const one of grownMen(world)) {
    const dealt = { ...one.traits };
    for (let strength = 1; strength <= 10 && !father; strength++) {
      for (let health = 2; health <= 18 && !father; health++) {
        one.traits = { ...dealt, strength, health };
        if (worse.indexOf(fateOf(one)) > worse.indexOf(fateOf(one, person => frailty(person) * DRILLED_STEADINESS))) father = one;
      }
    }
    if (father) break;
    one.traits = dealt;
  }
  assert.ok(father, 'no man in this class has a San Jacinto roll the drill can improve, so the drill cannot be shown to count');
  const asHeIs = fateOf(father), asDrilled = fateOf(father, person => frailty(person) * DRILLED_STEADINESS);
  const other = grownMen(world).find(one => one.id !== father.id);
  serve(world, father, { drilled: DRILL_TO_STEADY, leave: 'no', road: 'no' });
  serve(world, other, { leave: 'no', road: 'no' });
  untilMoment(world, 'san-jacinto');
  assert.equal(father.service.fate, asDrilled, 'drilling did not count at San Jacinto');
  assert.notEqual(asDrilled, asHeIs, 'the man this test turns on is dealt the same fate drilled or not');
  assert.equal(other.service.fate, fateOf(other), 'an undrilled man\'s roll moved');
  assert.equal(world.glory[father.householdId].awards[`san-jacinto:${father.id}`].role, 'fought');
  untilMoment(world, 'victory-word');
  // The family is told he was drilled whichever way the battle went for him (sim/houston.mjs `tellSanJacinto`).
  const said = asDrilled === 'unhurt' ? /steady in the line from the drill at the camp, came through the fight at San Jacinto unhurt/
    : /steady in the line from the drill at the camp, was slightly hurt at San Jacinto/;
  assert.ok(world.events.some(event => event.actorId === father.id && said.test(event.text)), 'the word did not say the drill counted');
  validateWorld(world);
});

test('foraging, the guard and the scouts are each said; the scouts ride only with a horse, and come back hurt at the documented share', () => {
  const world = spring();
  const [man] = grownMen(world);
  serve(world, man);
  order(world, man, 'camp-forage'); finish(world, man);
  assert.ok(world.events.some(event => event.actorId === man.id && /went out for the mess and came back with a beef/.test(event.text)), 'foraging was not said');
  order(world, man, 'camp-guard'); finish(world, man);
  assert.ok(world.events.some(event => event.actorId === man.id && /stood a night on the camp guard/.test(event.text)), 'the guard was not said');
  assert.equal(awards(world, man).filter(award => award.event === 'houston-camp').length, 1, 'the camp\'s work was counted more than once');
  // The scouts ride: refused without a horse, in words, and open with the family's horse at the camp.
  assert.match(work(world, man).find(entry => entry.id === 'camp-scout').why, /no horse at the camp/);
  assert.throws(() => order(world, man, 'camp-scout'), /no horse/);
  const horse = world.entities[propertyId(man.householdId, 'horse')];
  assert.ok(horse, 'this family has no horse to lend the test');
  horse.travel = null; horse.borrowedBy = man.id; horse.location = { ...man.location };
  assert.equal(work(world, man).find(entry => entry.id === 'camp-scout').can, true);
  // Outing by outing, hurt exactly when the share says, and said either way.
  assert.equal(SCOUT_HURT, 0.02);
  let outings = 0, hurtAt = null;
  while (outings < 120 && man.health.condition === 'well') {
    order(world, man, 'camp-scout'); finish(world, man);
    outings++;
    assert.equal(man.service.scouted, outings);
    const hurt = scoutHurt(world, man, outings);
    assert.equal(man.health.condition !== 'well', hurt, `outing ${outings}: hurt ${man.health.condition} against the share`);
    if (hurt) hurtAt = outings;
  }
  const said = world.events.filter(event => event.actorId === man.id && /rode out with the scouts/.test(event.text));
  assert.equal(said.length, outings, 'an outing went unsaid');
  if (hurtAt) {
    assert.equal(man.health.condition, 'minor-injury');
    assert.match(said.at(-1).text, /ran into a Mexican patrol; they came back slightly hurt/);
  } else assert.ok(said.every(event => /word of where the enemy is/.test(event.text)));
  validateWorld(world);
});

test('with the word of Goliad the army asks whether he goes home: a "!" for a played family, at once for one that does not choose; leaving releases, a regular deserts; the calendar holds only while a played family decides', () => {
  const world = spring();
  // The four played by hand or on auto may share a family; the family nobody plays and the absent family are each their own,
  // since a family is played, absent or nobody's as a whole.
  const all = grownMen(world);
  const [byHand, onAuto, regular, silent] = all;
  const apart = used => all.find(one => !used.includes(one) && !used.some(other => other.householdId === one.householdId));
  const unplayed = apart([byHand, onAuto, regular, silent]);
  const absent = apart([byHand, onAuto, regular, silent, unplayed]);
  assert.ok(silent && unplayed && absent, `not enough men in enough families to serve: ${all.length}`);
  serve(world, byHand); serve(world, onAuto); onAuto.auto = true;
  serve(world, unplayed, { played: false });
  serve(world, absent); setAbsent(world, world.households[absent.householdId], true);
  serve(world, regular, { bound: true, enlisted: 'regular', acres: 800 });
  serve(world, silent);
  // Nothing before the word.
  until(world, () => world.minute >= momentOf(world, 'goliad-word') - 1440);
  for (const one of [byHand, onAuto, unplayed, absent, regular, silent]) assert.equal(one.service.leave, undefined, `${one.name} was asked before the word`);
  untilMoment(world, 'goliad-word');
  // A played family by hand: open, said as a pressure with the record's claim, on the wire as a "!", holding the calendar.
  for (const one of [byHand, regular, silent]) assert.equal(one.service.leave, 'open', `${one.name} was not asked`);
  assert.ok(world.events.some(event => event.type === 'pressure' && event.actorId === byHand.id && event.claimId === 'HIST-TEX-076' && /Does .* go home\?/.test(event.text)), 'the question was not put in the record');
  const shown = view(world, byHand.householdId);
  assert.equal(shown.entities.find(one => one.id === byHand.id).service.leave, 'open');
  assert.deepEqual(needsOf(shown, byHand.id).map(need => need.kind), ['camp']);
  assert.equal(calendarMinutes(world), TICK_MINUTES, 'the calendar did not hold for a family deciding');
  // A man on auto, a family nobody plays and a family whose student has gone: answered the tick it was asked, at the share.
  for (const one of [onAuto, unplayed, absent]) {
    const want = share(world, one.id, 'camp-leave') < CAMP_QUESTIONS.leave.unplayed ? 'yes' : 'no';
    assert.equal(one.service.leave, want, `${one.name} did not answer at once at the share`);
    if (want === 'yes') { assert.equal(one.service.status, 'released'); assert.ok(one.travel?.to === world.households[one.householdId].homeSiteId, `${one.name} left and did not start home`); }
    else assert.equal(one.service.status, 'serving');
  }
  // Answered by hand: leaving releases an ordinary man and deserts a regular, each said; a second answer is refused.
  applyAction(world, byHand.householdId, { action: 'houston-answer', entityId: byHand.id, question: 'leave', answer: 'yes' });
  assert.equal(byHand.service.status, 'released');
  assert.equal(byHand.deserted, undefined);
  assert.ok(byHand.travel?.to === world.households[byHand.householdId].homeSiteId, 'he did not start home');
  assert.throws(() => applyAction(world, byHand.householdId, { action: 'houston-answer', entityId: byHand.id, question: 'leave', answer: 'no' }), /not with General Houston's army|already been answered/);
  applyAction(world, regular.householdId, { action: 'houston-answer', entityId: regular.id, question: 'leave', answer: 'yes' });
  assert.equal(regular.service.status, 'deserted');
  assert.equal(regular.deserted, true);
  assert.ok(world.events.some(event => event.actorId === regular.id && /deserted/.test(event.text)));
  // Still open for the one family that has not answered; the calendar holds for it alone, and lets go when it is decided.
  assert.equal(calendarMinutes(world), TICK_MINUTES);
  untilMoment(world, 'goliad-leave-close');
  assert.notEqual(silent.service.leave, 'open', 'the question did not close');
  assert.equal(silent.service.leave, share(world, silent.id, 'camp-leave') < CAMP_QUESTIONS.leave.unplayed ? 'yes' : 'no');
  assert.ok(world.events.some(event => event.actorId === silent.id && /Nobody answered for .* in time/.test(event.text)));
  // Nothing of the camp holds the calendar now (a family told to leave that morning may, which is the flight's own rule).
  assert.equal(campQuestionOpen(world), false, 'a camp question was still open');
  validateWorld(world);
});

test('the fork of the road, April 16: asked of every man with Houston, closed the next day; calling for the enemy\'s road is a part in the record', () => {
  const world = spring();
  const [right, left, silent] = grownMen(world);
  for (const one of [right, left, silent]) serve(world, one, { leave: 'no' });
  untilMoment(world, 'which-road');
  for (const one of [right, left, silent]) assert.equal(one.service.road, 'open', `${one.name} was not asked which road`);
  // At Roberts', beyond Spring Creek, where the road forked for the Trinity and for Harrisburg (`HIST-TEX-082`, `HIST-TEX-088`).
  assert.ok(world.events.some(event => event.type === 'milestone' && /fork of the road at Roberts', beyond Spring Creek: the left-hand road goes to the Trinity and Nacogdoches/.test(event.text)));
  assert.deepEqual(needsOf(view(world, right.householdId), right.id).map(need => need.kind), ['camp']);
  applyAction(world, right.householdId, { action: 'houston-answer', entityId: right.id, question: 'road', answer: 'yes' });
  applyAction(world, left.householdId, { action: 'houston-answer', entityId: left.id, question: 'road', answer: 'no' });
  const forward = world.glory[right.householdId].awards[`which-road:${right.id}`];
  assert.ok(forward, 'calling for the right-hand road earned nothing');
  assert.equal(forward.role, 'forward'); assert.equal(GLORY_WEIGHT.forward, 2);
  assert.equal(world.glory[left.householdId]?.awards?.[`which-road:${left.id}`], undefined, 'the left-hand road earned a part');
  for (const one of [right, left]) assert.equal(one.service.status, 'serving', 'the fork sent somebody home');
  untilMoment(world, 'which-road-close');
  assert.notEqual(silent.service.road, 'open');
  untilMoment(world, 'houston-harrisburg');
  for (const one of [right, left, silent]) assert.equal(one.service.status, 'serving');
  validateWorld(world);
});

test('a man whose family does nothing is never idle: the director sets him to the camp\'s work, so does auto and an absent family, and the army marching breaks it off', () => {
  const world = spring();
  // Three men of three families, since a family is the director's, the student's or absent as a whole.
  const [director, auto, absent] = grownMen(world).filter((one, index, all) => all.findIndex(other => other.householdId === one.householdId) === index);
  // Kept in explicitly through the word of Goliad, which would answer for each of them at the share.
  serve(world, director, { played: false, leave: 'no' });
  serve(world, auto, { leave: 'no' }); auto.auto = true;
  serve(world, absent, { leave: 'no' }); setAbsent(world, world.households[absent.householdId], true);
  // The day's choice follows the share: mostly drill, foraging and the guard about a day in six each, the scouts rarely (and
  // never without a horse, which none of these has); a man who has drilled his three days is given the next thing.
  const expectedChore = (one, day) => {
    const roll = share(world, one.id, `camp:${day}`);
    const first = roll < CAMP_SHARES.forage ? 'camp-forage' : roll < CAMP_SHARES.forage + CAMP_SHARES.guard ? 'camp-guard' : roll < CAMP_SHARES.forage + CAMP_SHARES.guard + CAMP_SHARES.scout ? 'camp-scout' : 'camp-drill';
    if (first === 'camp-scout') return 'camp-drill';
    if (first === 'camp-drill' && (one.service.drilled || 0) >= DRILL_TO_STEADY) return 'camp-forage';
    return first;
  };
  assert.equal(campChoice(world, director, work(world, director)), expectedChore(director, Math.floor(world.minute / 1440)));
  // Over a dozen ticks each is set to the day's work, and set again when it is done: never a whole think without a chore.
  const busy = { [director.id]: 0, [auto.id]: 0, [absent.id]: 0 };
  for (let t = 0; t < 12; t++) {
    stepWorld(world);
    for (const one of [director, auto, absent]) if (one.chore && CHORES[one.chore.id].camp) {
      busy[one.id]++;
      const begun = world.events.filter(event => event.actorId === one.id && event.type === 'assignment' && /set out/.test(event.text)).at(-1);
      assert.equal(one.chore.id, expectedChore(one, Math.floor(begun.minute / 1440)), `${one.name} was not set to the day's work`);
    }
  }
  // A day's work at the camp is two ticks and a family thinks every third (THINK_EVERY): a man set to work at every think is
  // at work at least 7 of 12, when his family's turn falls last (idle the first two ticks, then one in three). It read 8 until
  // 2026-09-19, when the class's history changed which men this picks and one's family thought on that last tick.
  for (const one of [director, auto, absent]) assert.ok(busy[one.id] >= 7, `${one.name} sat idle at the camp: at work ${busy[one.id]} ticks of 12`);
  // The army marches for the Colorado: the work in hand is left off and said, and taken up again at the new camp.
  until(world, () => world.minute >= momentOf(world, 'houston-colorado') - 1440);
  for (const one of [director, auto, absent]) if (!one.chore) order(world, one, (one.service.drilled || 0) >= DRILL_TO_STEADY ? 'camp-forage' : 'camp-drill');
  untilMoment(world, 'houston-colorado');
  until(world, () => [director, auto, absent].every(one => one.travel || one.location.siteId === 'columbus-crossing'), 3);
  for (const one of [director, auto, absent]) assert.ok(!one.chore || one.location.siteId === 'columbus-crossing', `${one.name} kept ${one.chore?.id} while the army marched`);
  assert.ok(world.events.some(event => [director.id, auto.id, absent.id].includes(event.actorId) && event.minute >= momentOf(world, 'houston-colorado') && /left off .* unfinished/.test(event.text)), 'the broken-off work was not said');
  until(world, () => [director, auto, absent].every(one => one.location.siteId === 'columbus-crossing' && !one.travel), 400);
  const again = { [director.id]: 0, [auto.id]: 0, [absent.id]: 0 };
  for (let t = 0; t < 12; t++) { stepWorld(world); for (const one of [director, auto, absent]) if (one.chore && CHORES[one.chore.id].camp) again[one.id]++; }
  for (const one of [director, auto, absent]) assert.ok(again[one.id] >= 8, `${one.name} sat idle at the new camp: at work ${again[one.id]} ticks of 12`);
  validateWorld(world);
});

test('the Host reads what he is at and what waits: "with Houston\'s army at Gonzales: drilling with the company", and Groce\'s by its own name', () => {
  const world = spring();
  const [man] = grownMen(world);
  const household = world.households[man.householdId];
  serve(world, man);
  assert.match(whereWords(world, man, household), /^with Houston's army at Gonzales$/);
  order(world, man, 'camp-drill');
  assert.match(whereWords(world, man, household), /^with Houston's army at Gonzales: drilling with the company$/);
  assert.equal(waitingOn(world, household), 0);
  man.service.leave = 'open';
  assert.equal(waitingOn(world, household), 1);
  delete man.service.leave;
  // Groce's, from the evening of March 30: a place of its own on the map since 2026-09-17 (`HIST-TEX-086`), where the camp stands.
  world.minute = GROCES_FROM + campClock(world); man.chore = null;
  assert.equal(houstonCamp(world), 'groces', 'the army is not camped at Groce\'s');
  man.service.siteId = houstonCamp(world);
  assert.match(whereWords(world, man, household), /^with Houston's army at Groce's$/);
  assert.ok(view(world, undefined, 'host').live.families.some(family => family.people.some(person => /Groce's/.test(person.where))));
  // Over the river from April 12 (`HIST-TEX-089`): Bernardo, said as Groce's plantation, since its name alone tells a class nothing.
  world.minute = HOUSTON_CAMPS.find(camp => camp.siteId === 'bernardo').from + campClock(world);
  assert.equal(houstonCamp(world), 'bernardo', 'the army is not camped at Bernardo');
  man.service.siteId = houstonCamp(world);
  assert.match(whereWords(world, man, household), /^with Houston's army at Bernardo, Groce's plantation$/);
  assert.ok(view(world, undefined, 'host').live.families.some(family => family.people.some(person => /Bernardo, Groce's plantation/.test(person.where))));
  world.minute = GROCES_FROM + campClock(world); man.service.siteId = 'groces';
  // A class saved on a map without Groce's keeps the army at San Felipe for the fortnight, and still says Groce's.
  delete world.map.sites.groces;
  assert.equal(houstonCamp(world), 'san-felipe', 'a class with no Groce\'s on its map lost its camp');
  man.service.siteId = 'san-felipe';
  assert.match(whereWords(world, man, household), /^with Houston's army at Groce's, above San Felipe de Austin$/);
});

test('Groce\'s is a place of its own: west of the Brazos, some fifteen miles above San Felipe by the road up the river, and the army marches there on March 30', () => {
  // HIST-TEX-086: the army "camped on the west side of the river" opposite Bernardo, after six miles to Mill Creek and nine
  // more; the 1990 THC marker "Sam Houston's Camp West of the Brazos" is in Austin County, west of the river.
  const world = spring();
  const groces = world.map.sites.groces, sanFelipe = world.map.sites['san-felipe'];
  assert.ok(groces, 'Groce\'s is not on the map');
  assert.equal(groces.name, "Groce's");
  const road = findPath(world.map, 'san-felipe', 'groces');
  assert.ok(road, 'there is no road to Groce\'s');
  const miles = road.points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - road.points[i].x, p.y - road.points[i].y), 0);
  assert.ok(miles > 12 && miles < 22, `Groce's is ${miles.toFixed(1)} road miles from San Felipe, not about fifteen`);
  assert.ok(groces.y < sanFelipe.y - 10, 'Groce\'s is not up the river from San Felipe');
  // West of the Brazos as the map draws it: the river crossed once going east from the camp, at the camp's own latitude.
  const brazos = coloniesMap().watercourses.filter(course => course.name === 'Brazos River');
  const eastward = brazos.flatMap(course => course.points.slice(1).map((b, i) => [course.points[i], b]))
    .filter(([a, b]) => (a.y - groces.y) * (b.y - groces.y) <= 0 && Math.min(a.x, b.x) > groces.x - 0.01 && Math.max(a.x, b.x) < groces.x + 5);
  assert.ok(eastward.length % 2 === 1, 'Groce\'s camp is not on the west bank of the Brazos the map draws');
  // The army marches there on its date: a man with it at San Felipe, after the word of Goliad has sent home those who went.
  untilMoment(world, 'houston-san-felipe');
  const [man] = grownMen(world);
  assert.equal(houstonCamp(world), 'san-felipe');
  serve(world, man, { leave: 'no' });
  until(world, () => world.minute >= GROCES_FROM + campClock(world) + 60);
  assert.ok(man.travel?.to === 'groces' || man.location.siteId === 'groces', 'the man with the army was not marched to Groce\'s');
  until(world, () => !man.travel, 400);
  assert.equal(man.location.siteId, 'groces');
  validateWorld(world);
});

// Over the Brazos at Groce's on the steamboat Yellow Stone, April 12-13, 1836 (`HIST-TEX-089`; owner 2026-09-18): the crossing
// "began on the 12th and was completed at 1 p.m. on the 13th" (Kemp & Kilman), and the army camped "a few hundred yards east of
// Groce's residence" (Kuykendall, in Barker 1901) - Bernardo, over Groce's ferry (`HIST-TEX-088`).
const BERNARDO_FROM = () => HOUSTON_CAMPS.find(camp => camp.siteId === 'bernardo')?.from;

test('the crossing of the Brazos and the camp at Bernardo are the same moment: dawn on April 12, between Groce\'s and Harrisburg', () => {
  // Two tables written apart (the director's milestones and the army's camps) must agree, or for the hours between them a
  // man at the old camp has not reached the new one - the eighteen-hour fault of 2026-09-17 over again.
  assert.equal(BERNARDO_FROM(), 266400 + 11 * 1440 + 6 * 60, 'the Bernardo camp is not dated dawn on April 12');
  assert.equal(TIMELINE['houston-brazos'] - ARRIVAL_MINUTES, BERNARDO_FROM(), 'the crossing\'s milestone and the Bernardo camp are at different moments');
  const camps = HOUSTON_CAMPS.map(camp => camp.siteId);
  assert.deepEqual(camps.slice(camps.indexOf('groces'), camps.indexOf('harrisburg') + 1), ['groces', 'bernardo', 'donohos', 'mccarleys', 'roberts', 'burnetts', 'harrisburg']);
  assert.match(HOUSTON_WORD.brazos, /^The army is crossing the Brazos on the steamboat Yellow Stone\. /);
});

test('April 12: the story says the army is crossing on the Yellow Stone, and a man with it at Groce\'s crosses to Bernardo, where the camp\'s work goes on with Groce\'s herd and cribs', () => {
  const world = spring();
  untilMoment(world, 'houston-groces');
  const [man] = grownMen(world);
  serve(world, man, { leave: 'no' });
  assert.equal(man.location.siteId, 'groces');
  // Nothing moves before the day.
  until(world, () => world.minute >= momentOf(world, 'houston-brazos') - 1440);
  assert.ok(world.minute < momentOf(world, 'houston-brazos'), 'the calendar stepped past the crossing');
  assert.equal(houstonCamp(world), 'groces');
  assert.ok(!world.events.some(event => event.claimId === 'HIST-TEX-089'), 'the crossing was said before April 12');
  untilMoment(world, 'houston-brazos');
  assert.equal(houstonCamp(world), 'bernardo', 'the army\'s camp did not move over the river');
  const said = world.events.filter(event => event.type === 'milestone' && event.claimId === 'HIST-TEX-089');
  assert.equal(said.length, 1, 'the crossing was not said, or said twice');
  assert.equal(said[0].text, HOUSTON_WORD.brazos);
  assert.equal(said[0].visibility, 'public');
  assert.ok(man.travel?.to === 'bernardo' || man.location.siteId === 'bernardo', 'the man with the army was not taken over the river');
  until(world, () => !man.travel, 60);
  assert.equal(man.location.siteId, 'bernardo');
  assert.ok(world.minute < momentOf(world, 'houston-brazos') + 1440, 'the crossing took him more than a day');
  // At the new camp the day's work is open, and a day out for the mess comes back from Groce's, whose house the camp is by.
  assert.equal(work(world, man).find(entry => entry.id === 'camp-drill').can, true, 'the camp\'s work was not open at Bernardo');
  order(world, man, 'camp-forage'); finish(world, man);
  assert.ok(world.events.some(event => event.actorId === man.id && /beef from Groce's herd and corn from his cribs/.test(event.text)), 'foraging at Bernardo did not come from Groce\'s');
  validateWorld(world);
});

// The march east, April 14-18, 1836 (`HIST-TEX-088`): a night at each house on the road to Harrisburg, and the fork's question
// asked at the fork (owner, 2026-09-18: the army's march east stops made places).
const MARCH = [['houston-donohos', 'donohos'], ['houston-mccarleys', 'mccarleys'], ['houston-roberts', 'roberts'], ['houston-burnetts', 'burnetts'], ['houston-harrisburg', 'harrisburg'], ['houston-lynchburg', 'lynchburg']];
const APRIL = (day, hour = 0) => 266400 + (day - 1) * 1440 + hour * 60;
test('the march east\'s camps and the director\'s milestones are the same moments, each the moment the army sets out', () => {
  for (const [key, siteId] of MARCH) {
    assert.equal(TIMELINE[key] - ARRIVAL_MINUTES, HOUSTON_CAMPS.find(camp => camp.siteId === siteId)?.from, `${key} and the camp at ${siteId} are at different moments`);
  }
  // For Donoho's the afternoon of the 14th (Barker); McCarley's and Roberts' at dawn; Burnett's in the afternoon of the 16th,
  // after the army has come to the fork; Harrisburg at noon on the 17th, Lynchburg at noon on the 19th.
  assert.deepEqual(MARCH.map(([key]) => TIMELINE[key] - ARRIVAL_MINUTES), [APRIL(14, 15), APRIL(15, 6), APRIL(16, 6), APRIL(16, 14), APRIL(17, 12), APRIL(19, 12)]);
  // The men are asked which road at noon on the 16th, after the army has set out for the fork and before it goes on.
  assert.ok(TIMELINE['which-road'] > TIMELINE['houston-roberts'] && TIMELINE['which-road'] < TIMELINE['houston-burnetts']);
});

test('the army marches east from Bernardo on April 14 a night at each house on the road - Donoho\'s, McCarley\'s, the fork at Roberts\', Burnett\'s - and arrives on the days the record gives, opposite Harrisburg the evening of the 18th and at Lynch\'s ferry the morning of the 20th, never back by San Felipe', () => {
  const world = spring();
  untilMoment(world, 'houston-brazos');
  const [man] = grownMen(world);
  // A family nobody plays: a played family with a question open holds the calendar at twenty minutes a tick (sim/clock.mjs
  // `deciding`), where everybody moves at the hour's pace and the army's day on the road never comes into it.
  serve(world, man, { played: false, leave: 'no', road: 'no' });
  assert.equal(man.location.siteId, 'bernardo');
  // The class's clock against the timeline's (sim/houston.mjs `campClock`).
  const dated = minute => minute - (momentOf(world, 'houston-brazos') - (TIMELINE['houston-brazos'] - ARRIVAL_MINUTES));
  until(world, () => world.minute >= momentOf(world, 'houston-donohos') - 60);
  assert.equal(houstonCamp(world), 'bernardo', 'the army left Bernardo before the afternoon of April 14');
  const sanFelipe = world.map.sites['san-felipe'];
  // Arrived by: the night of the 14th, the evening of the 15th, before the question at noon on the 16th, the night of the 16th,
  // the evening of the 18th (and not before the 18th: Santa Anna held Harrisburg April 15-18), the morning of the 20th.
  const BY = { donohos: [0, APRIL(15, 6)], mccarleys: [0, APRIL(16)], roberts: [0, APRIL(16, 12)], burnetts: [0, APRIL(17, 6)], harrisburg: [APRIL(18), APRIL(18, 22)], lynchburg: [0, APRIL(20, 6)] };
  let from = 'bernardo';
  for (const [key, siteId] of MARCH) {
    untilMoment(world, key);
    assert.equal(houstonCamp(world), siteId, `at ${key} the army's camp is not ${siteId}`);
    assert.ok(man.travel?.to === siteId, `at ${key} the man with the army did not march for ${siteId}`);
    assert.equal(man.travel.from, from, `the march to ${siteId} did not start from ${from}`);
    const nearest = Math.min(...man.travel.points.map(p => Math.hypot(p.x - sanFelipe.x, p.y - sanFelipe.y)));
    assert.ok(nearest > 10, `the march to ${siteId} went within ${nearest.toFixed(1)} miles of San Felipe`);
    until(world, () => !man.travel, 400);
    assert.equal(man.location.siteId, siteId, `the man did not reach ${siteId}`);
    const [after, by] = BY[siteId], at = dated(world.minute);
    assert.ok(at >= after && at <= by, `the army reached ${siteId} at ${((at - APRIL(1)) / 1440 + 1).toFixed(2)} April, not in its window`);
    from = siteId;
    if (!MARCH_CAMPS.includes(siteId)) continue;
    // A night on the road: the guard stood and the scouts out, and no day to drill (Houston: "a forced march").
    // Asked of the rule itself: a family nobody plays is offered its work without the words.
    const household = world.households[man.householdId];
    assert.match(campRefusal(world, household, man, 'camp-drill') || '', /on the march to Harrisburg/, `the army drilled on the march, at ${siteId}`);
    assert.equal(campRefusal(world, household, man, 'camp-guard'), null, `there was no guard to stand at ${siteId}`);
  }
  assert.ok(world.minute < momentOf(world, 'san-jacinto'), 'the army reached Lynch\'s ferry after the battle');
  assert.equal(world.events.filter(event => event.type === 'milestone' && event.text === HOUSTON_WORD.marchEast).length, 1, 'the march east was not said, or said twice');
  validateWorld(world);
});

test('a man who reaches the camp the army sent him to after it has marched on follows it; one his family sent for is left to go', () => {
  const world = spring();
  untilMoment(world, 'houston-lynchburg');
  assert.equal(houstonCamp(world), 'lynchburg');
  // Any two grown men not yet serving: `serve` puts down whatever they were doing, as an order does.
  const [late, fetched] = Object.values(world.entities).filter(one => one.householdId && one.kind === 'person' && one.health.condition === 'well' && one.sex === 'male' && (one.age ?? 0) >= 16 && !one.service && one.householdId !== undefined);
  // One still arriving at Harrisburg, where the army last sent him; one sent for, gone home from it.
  serve(world, late, { leave: 'no', road: 'no' });
  const harrisburg = world.map.sites.harrisburg;
  late.location = { x: harrisburg.x, y: harrisburg.y, siteId: 'harrisburg' }; late.service.siteId = 'harrisburg';
  serve(world, fetched, { leave: 'no', road: 'no' });
  fetched.service.siteId = 'harrisburg';
  const home = world.map.sites[world.households[fetched.householdId].homeSiteId];
  fetched.location = { x: home.x, y: home.y, siteId: home.id };
  stepWorld(world);
  assert.equal(late.travel?.to, 'lynchburg', 'the man who came late to Harrisburg stood there after the army had gone on');
  assert.equal(late.travel.forced, true, 'he did not follow at the army\'s forced march');
  assert.equal(fetched.travel?.to === 'lynchburg', false, 'the man his family sent for was dragged back to the army');
  validateWorld(world);
});

/** A class saved before the march's houses were places (before 2026-09-18): one road from Bernardo to Harrisburg. */
function oldEastRoad(world) {
  const legs = ['bernardo', 'donohos', 'mccarleys', 'roberts', 'burnetts', 'harrisburg'].slice(1).map((to, i, all) => Object.values(world.map.routes).find(route => route.from === (i ? all[i - 1] : 'bernardo') && route.to === to));
  const points = legs.flatMap((leg, i) => i ? leg.points.slice(1) : leg.points);
  for (const leg of legs) delete world.map.routes[leg.id];
  for (const id of ['donohos', 'mccarleys', 'roberts', 'burnetts']) delete world.map.sites[id];
  world.map.routes['route-bernardo-harrisburg'] = { ...legs[0], id: 'route-bernardo-harrisburg', to: 'harrisburg', points };
}

test('a class saved before the march\'s houses were places keeps the army at Bernardo until it sets out for Harrisburg, marches it straight there, and the man still reaches Lynch\'s ferry before the battle', () => {
  const world = spring();
  oldEastRoad(world);
  untilMoment(world, 'houston-brazos');
  const [man] = grownMen(world);
  serve(world, man, { leave: 'no', road: 'no' });
  until(world, () => world.minute >= momentOf(world, 'houston-harrisburg') - 1440);
  assert.ok(world.minute < momentOf(world, 'houston-harrisburg'), 'the calendar stepped past the march');
  assert.equal(houstonCamp(world), 'bernardo', 'the army\'s camp moved on from Bernardo on a map with nowhere to camp');
  assert.equal(man.location.siteId, 'bernardo', 'the army left Bernardo before it set out for Harrisburg');
  assert.equal(man.travel, null, 'the army was on the march before it set out for Harrisburg');
  assert.ok(world.events.some(event => event.text === HOUSTON_WORD.marchEast), 'the march east went unsaid on the old map');
  untilMoment(world, 'houston-harrisburg');
  assert.equal(man.travel?.from, 'bernardo'); assert.equal(man.travel?.to, 'harrisburg');
  const road = groundLeft(man.travel), setOut = world.minute;
  // Timed from the arrival itself, not from standing still at Harrisburg: a man who gets there in the hour the army marches on
  // follows it the same tick (`catchUpCamp`) and is never seen idle there. Which man this class deals, and so whether he is an
  // hour early or an hour late, moved with the map on 2026-09-19.
  const reached = () => world.events.find(event => event.actorId === man.id && event.type === 'arrival' && /Harrisburg/.test(event.text));
  until(world, () => reached(), 400);
  assert.ok(reached(), 'the man never reached Harrisburg');
  // Changed 2026-09-18 with the day on the road (sim/travel.mjs `roadTicks`). This said the army was at Harrisburg before
  // it marched for Lynchburg: sixty-three miles in forty-two hours, thirty-six miles a day, which no forced march made
  // (Houston's fifty-five took four days, `HIST-TEX-088`, `HIST-TEX-093`) and which held only while a walker went
  // seventy-two miles a day in the long ticks. At a day's march it is three days, and there before the battle.
  // 2026-09-19: the army's days are a forced march's (`FORCED_MARCH_HOURS`, owner by multiple choice).
  const days = (reached().minute - setOut) / 1440, allowed = road / milesADay(WALK_SPEED, false, FORCED_MARCH_HOURS) + calendarMinutes(world) / 1440;
  assert.ok(days <= allowed + 1e-9, `the march of ${road.toFixed(1)} miles took ${days.toFixed(2)} days, more than a forced march allows (${allowed.toFixed(2)})`);
  untilMoment(world, 'houston-lynchburg');
  until(world, () => man.location.siteId === 'lynchburg' && !man.travel, 400);
  assert.equal(man.location.siteId, 'lynchburg', 'the man stood at Harrisburg after the army had marched on');
  assert.ok(world.minute < momentOf(world, 'san-jacinto'), 'the man reached Lynch\'s ferry after the battle');
  validateWorld(world);
});

test('a class saved on a map without Bernardo keeps the army at Groce\'s until April 18, as it always did, and the story still says it crossed', () => {
  const world = spring();
  // The map as it was before 2026-09-18: no Bernardo, no ferry, no road east from it, and none of the march's houses.
  oldEastRoad(world);
  delete world.map.sites.bernardo;
  for (const [id, route] of Object.entries(world.map.routes)) if (route.from === 'bernardo' || route.to === 'bernardo') delete world.map.routes[id];
  untilMoment(world, 'houston-groces');
  const [man] = grownMen(world);
  serve(world, man, { leave: 'no', road: 'no' });
  untilMoment(world, 'houston-brazos');
  assert.equal(houstonCamp(world), 'groces', 'a class with no Bernardo on its map lost its camp');
  assert.ok(world.events.some(event => event.claimId === 'HIST-TEX-089' && event.text === HOUSTON_WORD.brazos), 'the crossing went unsaid on the old map');
  until(world, () => world.minute >= momentOf(world, 'houston-harrisburg') - 1440);
  assert.ok(world.minute < momentOf(world, 'houston-harrisburg'), 'the calendar stepped past the march');
  assert.equal(man.location.siteId, 'groces', 'the man left Groce\'s with nowhere to go');
  assert.equal(man.travel, null);
  assert.deepEqual(work(world, man).filter(entry => entry.id !== 'camp-scout').map(entry => entry.can), [true, true, true], 'the camp\'s work closed at Groce\'s');
  untilMoment(world, 'houston-harrisburg');
  assert.equal(man.travel?.to, 'harrisburg', 'the army did not march for Harrisburg from Groce\'s');
  validateWorld(world);
});

test('the panel: a man with Houston has the camp\'s work on his row and sending for him after it, is idle with it open, and a "!" for the army\'s question', () => {
  const entity = { id: 'p', name: 'Amos', kind: 'person', health: { condition: 'well' }, task: 'rest', location: { siteId: 'gonzales' }, service: { kind: 'houston', status: 'serving', siteId: 'gonzales' } };
  const offered = [{ id: 'camp-drill', can: true }, { id: 'camp-forage', can: true }, { id: 'camp-guard', can: true }, { id: 'camp-scout', can: false, why: 'The scouts ride, and Amos has no horse at the camp.' }];
  const icons = panelActions({ entity, offered, main: true, homeId: 'home-1', settable: true });
  assert.deepEqual(icons.map(icon => icon.key), ['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout', 'winter-recall']);
  assert.deepEqual(icons.map(icon => icon.can), [true, true, true, false, true]);
  assert.match(icons[3].why, /no horse/);
  assert.equal(isIdle(entity, icons), true, 'a man at the camp with the day\'s work open is not idle');
  const busy = { ...entity, chore: { id: 'camp-drill', doing: 'drilling with the company' } };
  const busyIcons = panelActions({ entity: busy, offered: offered.map(entry => ({ ...entry, can: false, why: 'Amos is already drilling with the company.' })), main: true, settable: true });
  assert.deepEqual(busyIcons.map(icon => icon.key), ['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout', 'winter-recall', 'stop-chore']);
  assert.equal(busyIcons[0].active, true);
  assert.equal(isIdle(busy, busyIcons), false);
  // A garrison man with only "send for them" is not idle: he is where the family put him.
  const garrison = { ...entity, service: { kind: 'garrison', status: 'serving', siteId: 'bexar' } };
  assert.equal(isIdle(garrison, panelActions({ entity: garrison, offered: [], main: true, settable: true })), false);
  const asked = { ...entity, service: { ...entity.service, leave: 'open' } };
  assert.deepEqual(needsOf({ entities: [asked] }, 'p').map(need => `${need.kind}: ${need.text}`), ['camp: The army is asking whether Amos goes home to the family.']);
  assert.deepEqual(needsOf({ entities: [{ ...entity, service: { ...entity.service, road: 'open' } }] }, 'p').map(need => need.kind), ['camp']);
  assert.deepEqual(needsOf({ entities: [entity] }, 'p'), []);
});
