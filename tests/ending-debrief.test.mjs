// The ending read as the whole war and in sums a student can follow (docs/audits/2026-09-29-triage.md 2.8, 2.9, 2.10, 2.11,
// 3.7; sim/ending.mjs, sim/ending-story.mjs). The page's half - the Host's columns and footer, each award's line, "No award was
// earned." (3.6) - is npm run test:ending-spring's, in a browser on a class played to April.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { flightLine, springWords } from '../sim/ending-story.mjs';
import { DISCUSSION, FORMULA, FORMULA_WORDS, PRISONER_WEIGHT, familyEnding, finalNumber, hostEnding, worthLine } from '../sim/ending.mjs';

const world = () => createGonzalesWorld('ending-debrief', 5);
const siteName = (w, id) => w.map.sites[id].name;

test('a family still going east is on the road east at the end, one camped at its refuge is camped there, and only one turned for home is on the road home (2.9)', () => {
  const w = world(), household = w.households['hh-1'];
  const flight = extra => { household.flight = { orderedMinute: 100, leftMinute: 200, refuge: 'gonzales', ...extra }; return flightLine(w, household); };
  const east = flight({ status: 'fled' });
  assert.match(east, /When the class ended they were still on the road east\.$/, east);
  assert.match(east, new RegExp(`making for ${siteName(w, 'gonzales')}`), east);
  const camped = flight({ status: 'refuged' });
  assert.match(camped, new RegExp(`When the class ended they were camped at ${siteName(w, 'gonzales')}\\.$`), camped);
  assert.match(flight({ status: 'returning' }), /When the class ended they were on the road home\.$/);
  for (const status of ['fled', 'refuged']) assert.doesNotMatch(flight({ status }), /road home/, `a family ${status} was told it was on the road home`);
  // The Host's column says the same.
  assert.deepEqual(['fled', 'refuged', 'returning', 'home', 'stayed'].map(status => { household.flight = { status, refuge: 'gonzales' }; return springWords(w, household).spring; }),
    ['Fled; still on the road east', `Fled; camped at ${siteName(w, 'gonzales')}`, 'Fled; on the road home', 'Fled; home again', 'Stayed']);
});

test('the Host\'s debrief carries the spring beside October, the class\'s own hooks first, and no question about the scoring (2.8)', () => {
  const w = world();
  const [a, b, c] = ['hh-1', 'hh-2', 'hh-3'].map(id => w.households[id]);
  a.played = true; b.played = true;
  a.flight = { status: 'fled', orderedMinute: 100, leftMinute: 200, refuge: 'gonzales' };
  b.flight = { status: 'stayed', orderedMinute: 100, burned: 3000, burnedBy: { hand: 'mexican', name: 'Sesma’s column' } };
  c.flight = { status: 'home', orderedMinute: 100, leftMinute: 200, homeMinute: 5000 };
  establishTruth(w, { id: 'alamo-fall', text: 'The Alamo has fallen.' });
  w.minute = 2000; learn(w, 'hh-1', 'alamo-fall', { source: 'test' });
  const closing = hostEnding(w);
  const row = id => closing.families.find(family => family.householdId === id);
  assert.equal(row('hh-1').spring, 'Fled; still on the road east');
  assert.equal(row('hh-1').farm, 'Standing');
  assert.equal(row('hh-2').spring, 'Stayed');
  assert.match(row('hh-2').farm, /^Burned [A-Z][a-z]+ \d+$/);
  assert.equal(row('hh-3').spring, 'Fled; home again');
  assert.equal(row('hh-4').spring, 'Not told to leave', 'a family the order never reached is not said to have been told');
  assert.match(row('hh-1').heardAlamo, /^[A-Z][a-z]+ \d+$/);
  assert.equal(row('hh-2').heardAlamo, 'never');
  // A class that never reached the spring shows nothing of it.
  const october = hostEnding(world());
  assert.ok(october.families.every(family => family.spring === null && family.farm === null && family.heardAlamo === null), 'an October ending spoke of the spring');
  // The standing questions are the whole war's, and none is about the scoring; the class's own hooks come first.
  assert.equal(DISCUSSION.length, 3);
  for (const question of DISCUSSION) assert.doesNotMatch(question, /coin|glory|number|scor|points/i, question);
  assert.ok(DISCUSSION.some(question => /spring/.test(question)), 'no standing question is about the spring');
  assert.deepEqual(closing.discussion.slice(-DISCUSSION.length), [...DISCUSSION]);
  assert.ok(closing.discussion.length > DISCUSSION.length, 'the class\'s own hooks are not first');
  // A family named "the Springwright family" begins a question on the projector with a capital (found by test:ending-spring).
  a.surname = 'Springwright';
  for (const question of hostEnding(w).discussion) assert.match(question, /^[A-Z]/, question);
});

test('each award is a sum a student can follow, and the coin is counted in whole reales (2.10)', () => {
  assert.equal(worthLine({ role: 'fought', miles: 23.4, times: 2, points: 6 }), 'Fighting counts 3 × 2 (23 road miles from home) = 6 glory.');
  // The multiplier the award was given with, not one read back from its miles rounded to a tenth (29.96 is kept as 30.0).
  assert.equal(worthLine({ role: 'fought', miles: 30, times: 1, points: 3 }), 'Fighting counts 3 × 1 (30 road miles from home) = 3 glory.');
  assert.equal(worthLine({ role: 'present', miles: 31, points: 6 }),'Being there counts 2 × 3 (31 road miles from home) = 6 glory.', 'an award saved before `times` is not read from its miles');
  assert.equal(worthLine({ role: 'voted', miles: 0, times: 1, points: 1 }), 'Voting counts 1 × 1 (close to home) = 1 glory.');
  assert.equal(worthLine({ role: 'fought', miles: 5, times: 1, points: -6 }), 'Fighting counts 3 × 1 (5 road miles from home) = 3, taken away twice over: -6 glory.');
  assert.equal(worthLine({ role: 'fought', miles: 5, times: 1, points: -3 }), 'Fighting counts 3 × 1 (5 road miles from home) = 3, taken away: -3 glory.');
  const w = world(), household = w.households['hh-1'];
  household.resources.money = 21;
  const [man, other] = household.members;
  w.glory = { 'hh-1': { total: 5, awards: {
    [`concepcion:${man}`]: { event: 'concepcion', personId: man, role: 'fought', miles: 12, times: 1, points: 3, minute: 10 },
    [`gonzales:${man}`]: { event: 'gonzales', personId: man, role: 'supplied', miles: 16, times: 2, points: 2, minute: 5 },
  } } };
  // One of the family taken prisoner in the spring: 21 reales less 1.5 of the family's parts is never a whole number here.
  w.entities[other].health = { condition: 'captured' };
  const own = familyEnding(w, 'hh-1');
  assert.deepEqual(own.awards.map(award => award.worth), ['Carrying supplies counts 1 × 2 (16 road miles from home) = 2 glory.', 'Fighting counts 3 × 1 (12 road miles from home) = 3 glory.']);
  assert.match(own.gloryRule, /fighting 3/);
  assert.match(own.gloryRule, /Every 15 road miles/);
  const living = household.members.length;
  assert.ok(!Number.isInteger(21 * (1 - PRISONER_WEIGHT / living)), 'the fixture no longer has a fraction to round');
  assert.ok(Number.isInteger(own.counted), `the coin counted is ${own.counted}`);
  assert.equal(own.counted, Math.round(21 * (1 - PRISONER_WEIGHT / living)));
  assert.doesNotMatch(own.sum, /\d\.\d+ reales?/, own.sum);
  // The number is the sum shown: the whole reales counted, times 1 + glory.
  assert.equal(own.final, own.counted * (1 + own.glory), `${own.sum}`);
  assert.equal(own.sumSaid, `The family had 21 reales. The one person taken prisoner takes ${PRISONER_WEIGHT} of the family's ${living} parts, so ${own.counted} reales are counted. 5 glory multiplies it by 6 (1 + 5): ${own.counted} × 6 = ${own.final}.`);
  // No coin, no glory, land: each step said.
  household.resources.money = 0;
  w.entities[other].health = { condition: 'well' };
  delete w.glory;
  assert.equal(familyEnding(w, 'hh-1').sumSaid, 'The family had no coin, so it is counted as having 1 real. With no glory, the coin counts once: 1.');
});

test('nobody under 18 who died of a sickness is named under "Who went" on the projector, and is counted instead (2.11)', () => {
  const w = world(), household = w.households['hh-1'];
  const [father, , elder, younger] = household.members.map(id => w.entities[id]);
  Object.assign(elder, { age: 17, health: { condition: 'dead', disease: 'measles' } });
  Object.assign(younger, { age: 15, health: { condition: 'dead' } });
  w.participation = { 'bexar-storming': Object.fromEntries([father, elder, younger].map((person, i) => [person.id, { householdId: 'hh-1', role: 'fought', minute: 10 + i }])) };
  const went = hostEnding(w).families.find(family => family.householdId === 'hh-1').went;
  assert.ok(!went.includes(elder.name), `a seventeen-year-old who died of a sickness is named on the projector: ${went.join(', ')}`);
  assert.ok(went.includes(father.name) && went.includes(younger.name), `somebody who did not die of a sickness is left out: ${went.join(', ')}`);
  assert.ok(went.includes('a child of the family'), `the child is not counted: ${went.join(', ')}`);
  // Grown, the same death is named, as every other death is.
  elder.age = 18;
  assert.ok(hostEnding(w).families.find(family => family.householdId === 'hh-1').went.includes(elder.name));
});

test('the final number is written one way: the code, VISION.md, docs/MONEY_AND_GLORY.md and the Host\'s footer (3.7)', () => {
  // The written formula, read as arithmetic, is the code's number for every case tried.
  const js = FORMULA.replace(/^final = /, '').replace(/round\(/g, 'Math.round(').replace(/max\(/g, 'Math.max(')
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/living people/g, 'living');
  const written = new Function('coin', 'glory', 'land', 'prisoners', 'living', `return ${js};`);
  for (const [coin, glory, land, prisoners, living] of [[0, 0, 0, 0, 4], [21, 5, 0, 1, 5], [7, 16, 40, 2, 6], [3, -4, 0, 0, 3], [50, 9, 10, 3, 4], [13, 2, 0, 1, 7]]) {
    const kept = prisoners ? Math.max(0, 1 - (PRISONER_WEIGHT * prisoners) / living) : 1;
    assert.equal(written(coin, glory, land, prisoners, living), finalNumber(coin, glory, land, kept), `the written formula and the code differ at ${[coin, glory, land, prisoners, living]}`);
  }
  const flat = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\s+/g, ' ');
  for (const path of ['VISION.md', 'docs/MONEY_AND_GLORY.md']) assert.ok(flat(path).includes(FORMULA), `${path} does not carry the formula as the code counts it: ${FORMULA}`);
  const closing = hostEnding(world());
  assert.equal(closing.formula, FORMULA);
  assert.equal(closing.formulaWords, FORMULA_WORDS);
  assert.match(FORMULA_WORDS, new RegExp(`${PRISONER_WEIGHT} parts for each person taken prisoner`), 'the Host\'s footer leaves out the prisoners\' share');
  assert.match(FORMULA_WORDS, /rounded to a whole real/);
});
