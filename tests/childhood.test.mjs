// A child's day when nobody is telling them what to do (sim/childhood.mjs, sim/obedience.mjs; owner 2026-09-26, docs/CHILDREN.md
// §3 to §5): the idle child who goes to the nearest parent and stops them, a child's own automation that does not go on for
// ever, and the hidden d20 of obedience that decides how often a child dawdles, wanders off and switches their automation off.
//
// Each test is named for a rule. Every one was seen failing alone against the regression it guards -
// `node scripts/childhood-injections.mjs`.
import test from 'node:test';
import { LESSON_ENABLED } from '../sim/lesson.mjs';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { projectFamily } from '../sim/world.mjs';
import { OBEDIENCE_DIE, obedienceOf, obedienceRoll, rolledPeople } from '../sim/family.mjs';
import { IDLE_TICKS, NOTICE_TICKS, talkTarget } from '../sim/childhood.mjs';
import { DAY_FLOOR_TICKS, DAY_MINUTES, dayOf } from '../sim/child-day.mjs';
import { needsOf } from '../public/family-panel.js';
import { OBEDIENCE_RATES, autoOffChance, dawdleChance, wanderChance, wandersOff, tiresOfAuto } from '../sim/obedience.mjs';
import { stirredShare } from '../sim/shares.mjs';
import { settle, taught } from './support/settled.mjs';

/** A class already on its land, one family played, with both parents and a child of `age` to hand. */
function family(seed, age = 6) {
  const world = taught(settle(createGonzalesWorld(seed, 8, { map: 'colonies' })));
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const people = household => household.members.map(id => world.entities[id]);
  const household = Object.values(world.households).find(h => people(h).some(p => p.kin?.role === 'father') && people(h).some(p => p.kin?.role === 'mother')
    && people(h).some(p => ['son', 'daughter'].includes(p.kin?.role)));
  assert.ok(household, `no family in ${seed} with both parents and a child`);
  household.played = true;
  world.status = 'running';
  // One child of the age this test is about; every other child grown, so nobody else's day gets in the way.
  const kids = people(household).filter(p => ['son', 'daughter'].includes(p.kin?.role));
  kids.forEach((kid, at) => { kid.age = at === 0 ? age : 16 + (at % 4); if (kid.age >= 16) kid.task = 'work'; });
  const kid = kids[0];
  kid.task = 'rest';
  const father = people(household).find(p => p.kin?.role === 'father'), mother = people(household).find(p => p.kin?.role === 'mother');
  return { world, household, kid, father, mother, others: kids.slice(1) };
}
const view = (world, household) => projectWorld(world, household.id, 'student', { includeMap: false });
const row = (world, household, id) => view(world, household).entities.find(entity => entity.id === id);
const step = (world, n = 1) => { for (let t = 0; t < n; t++) stepWorld(world); };
/** Put somebody where they stand in the yard, a given distance from the child. */
const place = (entity, from, dx) => { entity.location = { x: from.location.x + dx, y: from.location.y, siteId: from.location.siteId }; };

test('the rule: a child with nothing to do goes to the nearest parent, whose work stands still until the child is given something to do', () => {
  const { world, household, kid, father, mother, others } = family('childhood-talk');
  // The grown children are away, so the nearest grown-up is a parent; the father is nearer than the mother.
  for (const one of others) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  household.resources.powder = 6;
  father.skills = { ...father.skills, hunting: 1 };
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'practise-shooting' });
  assert.ok(father.chore, 'the father could not be set to practise');
  // At the mark a few yards off; the mother further, at the house.
  place(father, kid, 0.006); place(mother, kid, 0.02);
  assert.equal(talkTarget(world, household, kid)?.id, father.id, 'the nearest parent is not the one the child would go to');
  // An hour's grace, then over to him (one tick, drawn walking), then talking - and his work stops the tick the child arrives.
  step(world, IDLE_TICKS + 1);
  assert.equal(kid.talk?.withId, father.id, 'the idle child never went to the nearest parent');
  step(world, 1);
  assert.equal(kid.talk.phase, 'talking');
  assert.equal(father.aside?.kind, 'talk', 'the father kept working with a child at his elbow');
  const held = structuredClone(father.chore), where = { ...father.location };
  step(world, 6);
  assert.deepEqual(father.chore, held, 'the father’s work went on while the child talked');
  assert.deepEqual(father.location, where);
  // His row says why, in words that name the child and what to do; so does the child's; and the page is sent their words.
  assert.match(row(world, household, father.id).life, new RegExp(`talk with ${kid.name}.*Give ${kid.name} something to do`));
  assert.match(row(world, household, kid.id).life, /Nothing to do: talking with/);
  const lines = view(world, household).familyTalk?.lines || [];
  assert.ok(lines.some(line => line.speakerId === kid.id) && lines.some(line => line.speakerId === father.id), 'nobody is heard saying anything');
  assert.ok(lines.every(line => line.kind === 'reconstructed'), 'a line of the talk is dressed as documented');
  // He is not given new work or sent anywhere meanwhile, and is told why.
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'hunt-timber' }), /talk with/);
  assert.throws(() => applyAction(world, household.id, { action: 'travel', entityId: father.id, destination: 'gonzales' }), /talk with/, 'the father was sent off with a child at his elbow');
  // Given something to do, the child goes to it; he goes back to exactly where his work was, and it goes on.
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-tag' });
  step(world, 1);
  assert.equal(kid.talk, undefined, 'the child was given something to do and kept talking');
  assert.equal(father.aside, undefined, 'the father was not let go when the child had something to do');
  const before = structuredClone(father.chore);
  step(world, 1);
  assert.notDeepEqual(father.chore, before, 'the father’s work did not go on once the child was busy');
  validateWorld(world);
});

test('the rule: a child at play is seen at it - moved about the yard by the kind of play, or settled in one place - and never off the land', () => {
  const { world, household, kid } = family('childhood-play', 6);
  const home = world.map.sites[household.homeSiteId];
  const watch = (chore, ticks) => {
    applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore });
    const places = new Set(), doing = new Set();
    for (let t = 0; t < ticks && kid.chore?.id === chore; t++) {
      stepWorld(world);
      if (kid.chore?.id !== chore) break;
      places.add(`${kid.location.x},${kid.location.y}`); doing.add(kid.chore.doing);
      assert.equal(kid.location.siteId, household.homeSiteId, `${chore} took the child off the land`);
      assert.ok(Math.hypot(kid.location.x - home.x, kid.location.y - home.y) < 0.08, `${chore} took the child out of the yard`);
    }
    // Play lasts until the day ends (owner, 2026-09-29): called off, rather than waited out.
    if (kid.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: kid.id });
    return { places: places.size, doing: [...doing] };
  };
  const tag = watch('child-tag', 4);
  assert.ok(tag.places >= 3, `a child at tag was in ${tag.places} places in four ticks`);
  assert.match(tag.doing[0], /running at tag/);
  const hide = watch('child-hide', 4);
  assert.ok(hide.doing.some(words => /hiding behind the house/.test(words)) && hide.doing.some(words => /running off to hide/.test(words)), `hide-and-seek was not played: ${hide.doing}`);
  const doll = watch('child-doll', 4);
  assert.equal(doll.places, 1, 'a child with a doll ran about');
  assert.match(doll.doing[0], /playing house/);
});

test('the rule: the family’s record hears of a child’s talk once a day, however often it happens - the rows and the bubbles say it every time', () => {
  const { world, household, kid, others } = family('childhood-told');
  for (const one of others) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  const seen = new Set();
  for (let round = 0; round < 4; round++) {
    for (let t = 0; t < IDLE_TICKS + 3 && kid.talk?.phase !== 'talking'; t++) stepWorld(world);
    if (kid.talk?.phase === 'talking') seen.add(kid.talk.since);
    applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-hens' });
    for (let t = 0; t < 6 && kid.chore; t++) stepWorld(world);
  }
  assert.ok(seen.size >= 3, `the child came to talk only ${seen.size} times, so this proves nothing`);
  const said = pattern => world.events.filter(event => event.householdId === household.id && pattern.test(event.text)).length;
  assert.equal(said(/gone to find/), 1, 'the journal was told every time the child went to a parent');
  assert.equal(said(/has stopped .* to talk with/), 1, 'the journal was told every time the parent was stopped');
  // And not in the page's short window of the family's news, which a busy afternoon of children would push the news out of.
  assert.ok(!view(world, household).events.some(event => /gone to find|to talk with/.test(event.text)), 'a child going to a parent took a place in the page’s news');
});

test('the rule: with no parent at home a child goes to the nearest of age, and with nobody at home plays by themself', () => {
  const { world, household, kid, father, mother, others } = family('childhood-nobody');
  father.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  mother.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  // An elder brother or sister at home is the one the child goes to.
  for (const one of others.slice(1)) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  step(world, IDLE_TICKS + 2);
  assert.equal(kid.talk?.withId, others[0].id, 'with no parent at home the child did not go to the grown brother or sister');
  assert.equal(others[0].aside?.kind, 'talk');
  // And with nobody of age at home at all, the child finds their own play, and stops nobody.
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-doll' });
  others[0].location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  // Play lasts the day now (owner, 2026-09-29): the doll put down, rather than waited out.
  step(world, 2);
  applyAction(world, household.id, { action: 'stop-chore', entityId: kid.id });
  step(world, IDLE_TICKS + 1);
  assert.ok(kid.chore && /child-/.test(kid.chore.id), 'a child alone at home was left standing with nothing');
  assert.equal(kid.talk, undefined);
  assert.ok(world.events.some(event => event.actorId === kid.id && /went off to play by themself/.test(event.text)), 'the family was not told');
});

test('the rule: nobody is stopped by a child in the guided start, at night, on a calendar too fast to stop for, or in a family nobody plays', () => {
  // The guided start's part only while there is one (switched off by the owner, 2026-09-28; sim/lesson.mjs LESSON_ENABLED).
  if (LESSON_ENABLED) {
    const lesson = family('childhood-quiet');
    lesson.household.lesson = { step: 'survey' };
    step(lesson.world, IDLE_TICKS + 3);
    assert.equal(lesson.kid.talk, undefined, 'a child stopped a parent in the middle of the guided start');
  }
  const unplayed = family('childhood-quiet');
  unplayed.household.played = false;
  step(unplayed.world, IDLE_TICKS + 3);
  assert.equal(unplayed.kid.talk, undefined, 'a child stopped a parent in a family nobody plays');
  const night = family('childhood-quiet');
  night.world.minute = 16 * 60; // ten at night, from a dawn start
  step(night.world, IDLE_TICKS + 3);
  assert.equal(night.kid.talk, undefined, 'a child went looking for a parent in the dark');
  const fast = family('childhood-quiet');
  fast.world.director.phase = 'gathering';
  // Four hours a tick from dawn: the child would be on the way over at six in the evening, before the dark.
  step(fast.world, IDLE_TICKS + 1);
  assert.equal(fast.kid.talk, undefined, 'a child stopped a parent for four hours a tick');
});

test('the rule: a child’s own automation finds them things to do, lasts until the day ends whatever their roll, and goes off with a notice and an "!" that stays until they are given something to do', () => {
  const lasting = roll => {
    const { world, household, kid } = family('childhood-auto', 7);
    kid.traits = { ...kid.traits, obedience: roll };
    // Mid-morning of the first day: the day ends at the next turn of `DAY_MINUTES`, well past the floor.
    world.minute = 4 * 60;
    applyAction(world, household.id, { action: 'set-auto', entityId: kid.id, auto: true });
    assert.equal(kid.auto, true, 'a child of seven could not be put on automation');
    const day = dayOf(world), on = world.tick;
    let busy = 0, tired = false;
    for (let t = 0; t < 300 && kid.auto; t++) {
      stepWorld(world);
      if (kid.chore) busy++;
      if (kid.auto && dayOf(world) > day && world.tick - on >= DAY_FLOOR_TICKS) assert.fail(`the automation outlasted the day: still on at tick ${world.tick - on}`);
      if (!kid.auto && world.events.some(event => event.actorId === kid.id && /decided they have done enough/.test(event.text))) tired = true;
    }
    assert.equal(kid.auto, undefined, `a child of roll ${roll} was on automation for ever`);
    // It went off with the day, not before - unless the child tired of it by their roll, which is the one way it goes sooner.
    if (!tired) assert.ok(dayOf(world) > day, `a child of roll ${roll} was taken off automation before the day was out, at tick ${world.tick - on}`);
    assert.ok(busy > 0, 'a child on automation found nothing to do');
    // The notice: in the family's record for good, and on the child's row for a while - never how long it had lasted.
    assert.ok(world.events.some(event => event.actorId === kid.id && /automation is off/.test(event.text)), 'the automation went off without a word');
    assert.match(row(world, household, kid.id).life || '', /^Auto went off/);
    // And the "!": on the child's row, ranked with the family's other needs, until they are given something to do.
    const asks = () => needsOf(view(world, household), kid.id).find(need => need.kind === 'child') || null;
    assert.ok(asks(), 'no "!" when the child’s auto went off');
    step(world, NOTICE_TICKS);
    assert.doesNotMatch(row(world, household, kid.id).life || '', /^Auto went off/, 'the notice never left the row');
    assert.ok(asks(), 'the "!" left the row before the child was given anything');
    // Called off what the automation had begun is not something to do; given a work is.
    if (kid.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: kid.id });
    assert.ok(asks(), 'the "!" left the row when the child was only called off');
    applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-tag' });
    assert.equal(asks(), null, 'the "!" stayed on a child given something to do');
    step(world, 1);
    assert.equal(kid.autoNotice, undefined, 'the notice was kept on a child busy again');
    validateWorld(world);
    return { tired, ticks: world.tick - on };
  };
  // Neither a hard child nor an easy one is trusted with longer: both go off with the day (the roll only lets a child tire of it).
  const low = lasting(1), high = lasting(20);
  assert.ok(!high.tired, 'a child of roll 20 tired of it in this class: the test proves nothing of the day');
  // An infant has nothing it could choose, and is refused in words.
  const { world, household } = family('childhood-auto', 7);
  const baby = household.members.map(id => world.entities[id]).find(p => ['son', 'daughter'].includes(p.kin?.role) && p.age >= 16);
  baby.age = 1; baby.task = 'rest';
  assert.throws(() => applyAction(world, household.id, { action: 'set-auto', entityId: baby.id, auto: true }), /too small/);
  assert.ok(low.ticks > 0);
});

test('the rule: a child’s play lasts until the day ends - a spell of it between jobs on auto does not - and never sooner than the floor on a fast calendar', () => {
  const { world, household, kid } = family('childhood-day', 6);
  world.minute = 3 * 60;
  const day = dayOf(world), on = world.tick;
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'child-doll' });
  let t = 0;
  for (; t < 200 && kid.chore?.id === 'child-doll'; t++) stepWorld(world);
  assert.ok(dayOf(world) > day, `the doll was put down before the day was out, after ${world.tick - on} ticks`);
  assert.ok(world.minute - (day + 1) * DAY_MINUTES <= 20 * 2, `the doll was kept long past the day's end: minute ${world.minute}`);
  // The play's own line, once, when it is over.
  assert.ok(world.events.some(event => event.actorId === kid.id && /corn-husk doll/.test(event.text)), 'the day of play told the family nothing');
  // On auto, play between jobs is a spell of the old couple of hours: the automation is what lasts the day.
  const auto = family('childhood-day-auto', 6);
  auto.world.minute = 3 * 60;
  applyAction(auto.world, auto.household.id, { action: 'set-auto', entityId: auto.kid.id, auto: true });
  const picks = new Set();
  for (let n = 0; n < 40 && auto.kid.auto; n++) { stepWorld(auto.world); if (auto.kid.chore) picks.add(`${auto.kid.chore.id}:${auto.kid.chore.began ?? ''}`); }
  assert.ok(picks.size >= 3, `a child on auto took up only ${picks.size} things in forty ticks: its play ran the day`);
  // Four hours a tick: a day is six ticks, and the play lasts the floor at least.
  const fast = family('childhood-day-fast', 6);
  fast.world.director.phase = 'gathering';
  const began = fast.world.tick;
  applyAction(fast.world, fast.household.id, { action: 'chore', entityId: fast.kid.id, chore: 'child-tag' });
  for (let n = 0; n < 100 && fast.kid.chore?.id === 'child-tag'; n++) stepWorld(fast.world);
  assert.ok(fast.world.tick - began >= DAY_FLOOR_TICKS, `on a four-hour tick the play lasted ${fast.world.tick - began} ticks`);
  validateWorld(world);
});

test('the rule: a child’s play is written into the family’s record as set out at most once a day', () => {
  const { world, household, kid, father, mother, others } = family('childhood-set-out', 6);
  // Nobody at home: the child goes off to play by themself whenever the play ends, and on auto takes up spell after spell.
  for (const one of [father, mother, ...others]) one.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  applyAction(world, household.id, { action: 'set-auto', entityId: kid.id, auto: true });
  const day = dayOf(world), plays = new Set();
  for (let t = 0; t < 60 && dayOf(world) === day; t++) {
    if (!kid.auto) applyAction(world, household.id, { action: 'set-auto', entityId: kid.id, auto: true });
    stepWorld(world);
    if (kid.chore && /^child-(play|stick-horse|doll|tag|hide|cart|hoop|marbles)$/.test(kid.chore.id)) plays.add(`${kid.chore.id}:${kid.chore.began}`);
  }
  assert.ok(plays.size >= 3, `the child took up play only ${plays.size} times, so this proves nothing`);
  const said = world.events.filter(event => event.actorId === kid.id && event.type === 'assignment' && /set out: (play|ride a stick horse|make a toy|roll a hoop|marbles)/i.test(event.text) && Math.floor(event.minute / DAY_MINUTES) === day);
  assert.ok(said.length <= 1, `the record was told a child set out to play ${said.length} times in one day`);
});

test('the rule: obedience decides how often a child dawdles, wanders off and switches their automation off - a lower roll always more, measured over many ticks', () => {
  // The rates themselves run steadily down the die.
  for (const chance of [dawdleChance, wanderChance, autoOffChance]) {
    for (let roll = 2; roll <= OBEDIENCE_DIE; roll++) assert.ok(chance(roll) < chance(roll - 1), `${chance.name} is not lower at ${roll} than at ${roll - 1}`);
  }
  assert.deepEqual(OBEDIENCE_RATES.wander, [0.06, 0.002]);
  // And what a class actually sees: over many ticks, how often a child of each roll wanders and tires of their automation.
  const world = { seed: 'obedience-measure', tick: 0 };
  const measured = roll => {
    const kid = { id: `child-${roll}`, traits: { obedience: roll } };
    let wander = 0, off = 0;
    for (let tick = 0; tick < 6000; tick++) { world.tick = tick; if (wandersOff(world, kid)) wander++; if (tiresOfAuto(world, kid)) off++; }
    return { wander: wander / 6000, off: off / 6000 };
  };
  const rolls = [1, 5, 10, 15, 20].map(measured);
  for (let at = 1; at < rolls.length; at++) {
    assert.ok(rolls[at].wander < rolls[at - 1].wander, `a child of a higher roll wandered off as often: ${JSON.stringify(rolls)}`);
    assert.ok(rolls[at].off < rolls[at - 1].off, `a child of a higher roll tired of automation as often: ${JSON.stringify(rolls)}`);
  }
  assert.ok(rolls[0].wander > 0.04 && rolls[4].wander < 0.006, `the ends are not a hard child and an easy one: ${JSON.stringify(rolls)}`);
  // In a real class: a low-rolled child sent to a long job leaves it for play far more often than a high-rolled one, and is
  // seen doing it with a plain line.
  const leaves = roll => {
    let left = 0;
    for (let n = 0; n < 12; n++) {
      const { world: w, household, kid } = family('childhood-wander', 8);
      kid.traits = { ...kid.traits, obedience: roll };
      w.tick += n * 37;
      household.field = { ...household.field, state: 'planted', changedTick: w.tick };
      applyAction(w, household.id, { action: 'chore', entityId: kid.id, chore: 'child-birds' });
      for (let t = 0; t < 14 && kid.chore?.id === 'child-birds'; t++) stepWorld(w);
      if (w.events.some(event => event.actorId === kid.id && /wandered off .* instead of/.test(event.text))) left++;
    }
    return left;
  };
  const low = leaves(1), high = leaves(20);
  assert.ok(low > high, `a child of roll 1 left the corn ${low} times in 12 and one of roll 20 ${high}`);
});

test('the rule: obedience is rolled for each child when the family is made, the same every time, and never reaches any page', () => {
  const one = rolledPeople('obedience-roll', 'hh-1', 0, 20), two = rolledPeople('obedience-roll', 'hh-1', 0, 20);
  const children = one.filter(person => ['son', 'daughter'].includes(person.role));
  assert.equal(children.length, 18);
  for (const child of children) {
    assert.ok(Number.isInteger(child.traits.obedience) && child.traits.obedience >= 1 && child.traits.obedience <= OBEDIENCE_DIE, `${child.id} has no d20`);
    assert.equal(child.traits.obedience, obedienceRoll('obedience-roll', child.id));
  }
  assert.deepEqual(two.map(person => person.traits), one.map(person => person.traits), 'the same class rolled different children');
  assert.ok(one.filter(person => ['father', 'mother'].includes(person.role)).every(person => person.traits.obedience === undefined), 'a parent was rolled for obedience');
  assert.ok(new Set(children.map(child => child.traits.obedience)).size > 5, 'eighteen children rolled nearly the same');
  // Hidden: two worlds the same in every way but their children's obedience send every page exactly the same bytes.
  const pages = roll => {
    const { world, household } = family('obedience-hidden', 6);
    for (const entity of Object.values(world.entities)) if (entity.traits?.obedience) entity.traits.obedience = roll;
    const kid = household.members.map(id => world.entities[id]).find(p => p.age === 6);
    applyAction(world, household.id, { action: 'set-auto', entityId: kid.id, auto: true });
    const sent = [JSON.stringify(projectWorld(world, undefined, 'host', { includeMap: false })), JSON.stringify(projectFamily(world, household.id))];
    for (const other of Object.values(world.households)) sent.push(JSON.stringify(projectWorld(world, other.id, 'student', { includeMap: false })));
    return sent;
  };
  const low = pages(1), high = pages(20);
  assert.deepEqual(high, low, 'a child’s obedience changed what a page is sent');
  for (const text of low) assert.doesNotMatch(text, /obedience|"childAuto"|"until"|"traits"/, 'the roll, or how long a child’s automation lasts, reached a page');
});

test('the rule: a child saved before there was a roll is given one from the class and their id, and the save opens unchanged', () => {
  const { world, household, kid } = family('obedience-old', 6);
  delete kid.traits.obedience;
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  const child = saved.entities[kid.id];
  assert.equal(obedienceOf(saved, child), obedienceRoll(saved.seed, child.id), 'an old child was not given the roll their seed and id make');
  assert.equal(obedienceOf(saved, child), obedienceOf(JSON.parse(JSON.stringify(saved)), child), 'an old child’s roll changed on reload');
  applyAction(saved, household.id, { action: 'set-auto', entityId: child.id, auto: true });
  step(saved, 5);
  assert.equal(saved.entities[kid.id].traits.obedience, undefined, 'the derived roll was written back into the save');
  validateWorld(saved);
  // The roll is a real d20: every face turns up, none much more than another.
  const faces = new Map();
  for (let n = 0; n < 4000; n++) { const face = obedienceRoll('faces', `hh-${n}-child-1`); faces.set(face, (faces.get(face) || 0) + 1); }
  assert.equal(faces.size, OBEDIENCE_DIE);
  assert.ok(Math.max(...faces.values()) < 2.2 * Math.min(...faces.values()), `the die is loaded: ${JSON.stringify([...faces])}`);
  assert.ok(stirredShare({ seed: 's' }, 'a', 'x:1') !== stirredShare({ seed: 's' }, 'a', 'x:2'));
});
