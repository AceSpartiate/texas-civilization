// Tips at first meeting (owner, 2026-09-28, by multiple choice: "Short tips at first meeting" - the first time each new thing
// appears, a one-line tip shows what to do and what it costs; nothing blocks play; each tip shown once). public/tips.js says
// when a thing has appeared and what the tip says; sim/tips.mjs keeps which tips a family has seen, so a reload never repeats
// one. docs/LESSON.md §9.
//
// Each test here was proven by injecting the regression it guards (scripts/tips-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { TIP_IDS } from '../sim/tips.mjs';
import { TIPS, TIP_ORDER, tipToShow, tipsPresent } from '../public/tips.js';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const send = (world, householdId, input) => applyAction(world, householdId, input);
/** A class under way with two families a student plays, both on their land. */
function running(seed) {
  const world = createGonzalesWorld(seed, 5);
  for (const id of ['hh-1', 'hh-2']) world.households[id].played = true;
  world.status = 'running';
  for (let tick = 0; tick < 4000 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
}
/** The family's own view with a thing the tips are about put into it, as the server would send it. */
const withThing = (seen, thing) => ({ ...seen, ...thing });

// ------------------------------------------------------------------------------------------------------------ the words
test('every tip the server can remember has words on the page, and every one is short, plain and says what to do', () => {
  assert.deepEqual(Object.keys(TIPS).sort(), [...TIP_IDS].sort(), 'the page and the server name different tips');
  assert.deepEqual([...TIP_ORDER].sort(), [...TIP_IDS].sort(), 'a tip has no place in the order, so it is never shown');
  for (const [id, words] of Object.entries(TIPS)) {
    // One short line on a Chromebook: at most about two lines of the strip, and at most three sentences.
    assert.ok(words.length <= 190, `${id} is ${words.length} characters, not a short tip`);
    // A sentence ends at a stop after a word (or a closing quote), not at the "!" mark the tips name.
    const sentences = words.split(/(?<=[\w”)][.!?]”?)\s+/).filter(Boolean);
    assert.ok(sentences.length <= 3, `${id} is ${sentences.length} sentences`);
    // A middle-school reading level: short sentences and short words (no sentence over 25 words, few long words).
    for (const sentence of sentences) assert.ok(sentence.split(/\s+/).length <= 25, `${id}: "${sentence}" is too long a sentence`);
    const long = words.split(/[^A-Za-z]+/).filter(word => word.length >= 11);
    assert.ok(long.length <= 1, `${id} leans on long words: ${long.join(', ')}`);
  }
  // What was only in a hover popup is said in a tip (S6: a touch screen has no hover): the cost of resting on the road,
  // what the star is, and what the "!" means.
  assert.match(TIPS.rest, /no miles/);
  assert.match(TIPS.rest, /army keeps coming/);
  assert.match(TIPS.star, /main person/);
  assert.match(TIPS.star, /!” means/);
  // And the call's clock, which is the thing a student missed.
  assert.match(TIPS.call, /5 minutes/);
});

// ------------------------------------------------------------------------------------------- the server remembers them
test('a family\'s seen tips are kept by the server, go to its own page, survive a save, and are the family\'s alone', () => {
  const world = running('tips-remembered');
  assert.equal(view(world, 'hh-1').household.tipsSeen, undefined, 'a family that has seen nothing is sent a list');
  send(world, 'hh-1', { action: 'seen-tip', tip: 'call' });
  send(world, 'hh-1', { action: 'seen-tip', tip: 'flight' });
  // Twice is once: a double click, a second tab, a reload that sends it again.
  send(world, 'hh-1', { action: 'seen-tip', tip: 'call' });
  assert.deepEqual(world.households['hh-1'].tipsSeen, ['call', 'flight']);
  assert.deepEqual(view(world, 'hh-1').household.tipsSeen, ['call', 'flight']);
  // Another family's page is not told, and its own list is its own.
  assert.equal(view(world, 'hh-2').household.tipsSeen, undefined, 'another family was sent this family\'s tips');
  send(world, 'hh-2', { action: 'seen-tip', tip: 'alto' });
  assert.deepEqual(world.households['hh-1'].tipsSeen, ['call', 'flight']);
  // What a student sends is applied to the household their own cookie names (server/app.mjs), whatever the order carries.
  send(world, 'hh-2', { action: 'seen-tip', tip: 'army', householdId: 'hh-1' });
  assert.deepEqual(world.households['hh-1'].tipsSeen, ['call', 'flight']);
  // A tip nobody wrote is refused, and so is a family whose student has gone: the director reads no tips.
  assert.throws(() => send(world, 'hh-1', { action: 'seen-tip', tip: 'no-such-tip' }), /no such tip/);
  world.households['hh-2'].absent = true;
  assert.throws(() => send(world, 'hh-2', { action: 'seen-tip', tip: 'call' }), /own student/);
  delete world.households['hh-2'].absent;
  // Saved and opened again, the list is still there.
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  assert.deepEqual(view(reopened, 'hh-1').household.tipsSeen, ['call', 'flight']);
  // And a save cannot carry a tip nobody wrote, or one tip twice. Absent is "seen none": no save version moved.
  for (const bad of [['call', 'call'], ['nonsense'], 'call']) {
    reopened.households['hh-1'].tipsSeen = bad;
    assert.throws(() => validateWorld(reopened), /Invalid tips seen/, `a save carried ${JSON.stringify(bad)}`);
  }
  delete reopened.households['hh-1'].tipsSeen;
  validateWorld(reopened);
});

test('putting a tip away works in the lobby before the class begins, and in the first minute of a running class', () => {
  const lobby = createGonzalesWorld('tips-lobby', 5);
  lobby.households['hh-1'].played = true;
  send(lobby, 'hh-1', { action: 'seen-tip', tip: 'star' });
  assert.deepEqual(lobby.households['hh-1'].tipsSeen, ['star']);
  // The wagon still on the track in - where the guided start stood until the owner switched it off (2026-09-28), and where
  // `seen-tip` is on its `ALWAYS` should it come back.
  const world = createGonzalesWorld('tips-first-minute', 5);
  world.households['hh-1'].played = true;
  world.status = 'running';
  assert.ok(world.households['hh-1'].arriving, 'the family is not arriving, so this proves nothing');
  send(world, 'hh-1', { action: 'seen-tip', tip: 'sick' });
  assert.deepEqual(world.households['hh-1'].tipsSeen, ['sick']);
});

// ------------------------------------------------------------------------------------------ when each thing has appeared
test('each tip is due when its thing is on the family\'s own screen, and never on the Host\'s', () => {
  const world = running('tips-present');
  const seen = view(world, 'hh-1');
  const [first] = seen.household.members;
  // A quiet farm with the guided start running: nothing is due but what the farm shows.
  assert.deepEqual(tipsPresent({ ...seen, lesson: { step: 'house', done: false } }).filter(id => id !== 'star'), []);
  const cases = {
    alto: { flight: { status: 'fled', ask: { id: 'alto', text: '¡Alto!' } } },
    road: { flight: { status: 'fled', ask: { id: 'bog', text: 'Stuck.' } } },
    flight: { flight: { status: 'ordered' } },
    route: { flight: { status: 'fled' } },
    call: { request: { status: 'open', kind: 'call', answerers: { [first]: [{ id: 'turn-out', can: true }] } } },
    army: { army: { ours: [{ id: first, questions: [{ key: 'storm', answer: 'open' }] }] } },
    watch: { battleAlert: { id: 'b', entityId: first, title: 'Béxar', text: 'The fight is starting.', field: {} } },
    resume: { lessonResume: { until: 1, ms: 60_000 } },
    rest: { work: { [first]: [{ id: 'rest-road', can: true }] } },
    cow: { work: { [first]: [{ id: 'flee-cow', can: true }] } },
    milk: { flight: { status: 'fled', cow: { by: first } } },
    enlist: { work: { [first]: [{ id: 'enlist-regular', can: true }] } },
    trade: { offers: [{ direction: 'received', ourEntityId: first, theirName: 'Cy' }] },
  };
  for (const [id, thing] of Object.entries(cases)) assert.ok(tipsPresent(withThing(seen, thing)).includes(id), `${id} is not due when its thing is there`);
  const person = (change) => ({ ...seen, entities: seen.entities.map(one => (one.id === first ? { ...one, ...change } : one)) });
  assert.ok(tipsPresent(person({ sickness: { line: 'Has the measles.' } })).includes('sick'));
  assert.ok(tipsPresent(person({ baby: { state: 'cry' } })).includes('baby'));
  assert.ok(tipsPresent(person({ talk: { with: 'x', phase: 'talking' } })).includes('child'));
  assert.ok(tipsPresent(seen, { errandOpen: true }).includes('store'));
  // The start of the game - the only guidance a new student has since the guided start was switched off (2026-09-28): on the
  // road in, and then how to give an order, before the star.
  assert.ok(tipsPresent({ ...seen, land: { ...seen.land, arriving: true } }).includes('arrive'));
  assert.ok(!tipsPresent({ ...seen, land: { ...seen.land, arriving: true } }).includes('order'), 'told how to give an order before anybody is there to be given one');
  const start = tipsPresent({ ...seen, lesson: undefined });
  assert.ok(start.indexOf('order') >= 0 && start.indexOf('order') < start.indexOf('star'), `the order comes after the star: ${start.join(', ')}`);
  // The star waits until the farm is the student's: not during the guided start.
  assert.ok(!tipsPresent({ ...seen, lesson: { step: 'house', done: false } }).includes('star'));
  assert.ok(tipsPresent({ ...seen, lesson: undefined }).includes('star'));
  // A call the family's people cannot answer is not the family's first meeting with a call.
  assert.ok(!tipsPresent(withThing(seen, { request: { status: 'open', kind: 'call', answerers: {} } })).includes('call'));
  // The Host has no family: nothing is ever due on the projector, whatever is going on.
  const host = view(world, null, 'host');
  assert.deepEqual(tipsPresent({ ...host, ...cases.alto, ...cases.call }), []);
  assert.deepEqual(tipsPresent({ ...seen, ...cases.alto, role: 'host' }), []);
  // Nor before the teacher begins, nor over the ending.
  for (const status of ['lobby', 'ended']) assert.deepEqual(tipsPresent({ ...seen, ...cases.alto, ...cases.enlist, status }), [], `a tip was due with the class ${status}`);
  // Most urgent first when several are due at once.
  assert.deepEqual(tipsPresent(withThing(seen, { ...cases.call, ...cases.alto, lessonResume: cases.resume.lessonResume })).slice(0, 3), ['alto', 'call', 'resume']);
});

// ------------------------------------------------------------- the house, the field and the town (owner, 2026-09-28: "Yes, add them")
test('the house, the field and going to town each have a tip the first time the family can do them, and not before', () => {
  // Words first: what to do and what it costs, true whichever way the work goes (one wood pile or none, auto or by hand,
  // crops ripening by the calendar or by the minute).
  assert.match(TIPS.house, /Choose a house/);
  assert.match(TIPS.house, /Fell trees/);
  assert.match(TIPS.house, /auto/);
  assert.match(TIPS.house, /camps/, 'the house\'s tip does not say what waiting for it costs');
  assert.match(TIPS.field, /Plant the field/);
  assert.match(TIPS.field, /seed/, 'the field\'s tip does not say planting uses seed');
  assert.match(TIPS.field, /time to ripen/);
  assert.doesNotMatch(TIPS.field, /\d+ (minutes|days|weeks)/, 'the field\'s tip names a ripening time the seasons rework may change');
  assert.match(TIPS.town, /Go to town to trade/);
  assert.match(TIPS.town, /away from the farm/);
  assert.match(TIPS.town, /coin/);

  // On the road in: none of the three, though every work is listed (refused) on the family's bar.
  const road = createGonzalesWorld('tips-farm', 5);
  road.households['hh-1'].played = true;
  road.status = 'running';
  const coming = view(road, 'hh-1');
  assert.ok(coming.land.arriving, 'the family is not on the road in, so this proves nothing');
  for (const id of ['house', 'field', 'town']) assert.ok(!tipsPresent(coming).includes(id), `the ${id} tip is due before the family is on its land`);

  // On its land, camped, with a plan to choose and work open: all three.
  const world = running('tips-farm');
  const seen = view(world, 'hh-1');
  assert.equal(seen.land.shelter, 'camp', 'the family already has a roof, so this proves nothing');
  const due = tipsPresent(seen);
  for (const id of ['house', 'field', 'town']) assert.ok(due.includes(id), `the ${id} tip is not due on the family's land: ${due.join(', ')}`);
  // After how to give an order, and before the star.
  assert.ok(due.indexOf('order') < due.indexOf('house') && due.indexOf('town') < due.indexOf('star'), `out of order: ${due.join(', ')}`);

  // The house: not while a site is still to choose, and not once a roof stands.
  assert.ok(!tipsPresent({ ...seen, land: { ...seen.land, choosingSite: { can: true } } }).includes('house'), 'the house tip came before the house site was chosen');
  assert.ok(!tipsPresent({ ...seen, land: { ...seen.land, shelter: 'cabin' } }).includes('house'), 'the house tip came with a roof already up');
  // The field and the town: only work the server says can be done now.
  const refused = ids => ({ ...seen, work: Object.fromEntries(Object.entries(seen.work).map(([id, list]) => [id, list.map(entry => (ids.includes(entry.id) ? { ...entry, can: false } : entry))])) });
  assert.ok(!tipsPresent(refused(['clear-plot', 'plant-field'])).includes('field'), 'the field tip came when nobody could clear or plant');
  assert.ok(!tipsPresent(refused(['visit-shop'])).includes('town'), 'the town tip came when nobody could go to town');
  // The tent (owner, 2026-10-02; sim/shelter.mjs): due with the house, while somebody could put it up; not once it is up.
  assert.ok(due.includes('tent') && due.indexOf('house') < due.indexOf('tent'), `the tent tip is not due after the house's: ${due.join(', ')}`);
  assert.ok(!tipsPresent(refused(['pitch-tent'])).includes('tent'), 'the tent tip came when nobody could put it up');
  assert.match(TIPS.tent, /Put up the tent/);
  assert.match(TIPS.tent, /children/);
  // Never on the Host's page, and never over the errand: its own tip, or nothing.
  assert.deepEqual(tipsPresent({ ...seen, role: 'host' }), []);
  assert.deepEqual(tipToShow({ ...seen, lesson: undefined }, { seen: ['store'], errandOpen: true }), { show: null, retire: null });
});

// ---------------------------------------------------------------------------------------------- shown once, one at a time
test('a tip is shown once: until it is put away or its thing goes, and never again after, even across a reload', () => {
  const world = running('tips-once');
  const call = { request: { status: 'open', kind: 'call', answerers: { [world.households['hh-1'].members[0]]: [{ id: 'turn-out', can: true }] } } };
  const flight = { flight: { status: 'ordered' } };
  // The start of the game's own tips already put away, as a student in the middle of a class has.
  for (const tip of ['order', 'house', 'tent', 'field', 'town', 'star']) send(world, 'hh-1', { action: 'seen-tip', tip });
  let seen = view(world, 'hh-1');
  // The call appears: its tip is shown.
  let now = tipToShow(withThing(seen, call), { seen: [], showing: null });
  assert.deepEqual(now, { show: 'call', retire: null });
  // The order to leave comes while the call's tip is being read: the call's stays, and is not pulled from under the student.
  now = tipToShow(withThing(seen, { ...call, ...flight }), { seen: [], showing: 'call' });
  assert.deepEqual(now, { show: 'call', retire: null });
  // Put away: the page tells the server, and the next tip due takes its place.
  send(world, 'hh-1', { action: 'seen-tip', tip: 'call' });
  seen = view(world, 'hh-1');
  now = tipToShow(withThing(seen, { ...call, ...flight }), { seen: seen.household.tipsSeen, showing: null });
  assert.deepEqual(now, { show: 'flight', retire: null });
  // The order is answered while its tip stands: it is retired - the student had it in front of them - and nothing is shown.
  now = tipToShow(withThing(seen, call), { seen: seen.household.tipsSeen, showing: 'flight' });
  assert.deepEqual(now, { show: null, retire: 'flight' });
  send(world, 'hh-1', { action: 'seen-tip', tip: now.retire });
  // A reload: a page with nothing in hand but what the server sends. A second call, a second order - no tip for either.
  const reloaded = view(JSON.parse(JSON.stringify(world)), 'hh-1');
  assert.deepEqual(tipToShow(withThing(reloaded, { ...call, ...flight }), { seen: reloaded.household.tipsSeen }), { show: null, retire: null });
  // And another family meeting its first call is shown the tip: the list is one family's.
  const other = view(world, 'hh-2');
  const theirs = { request: { status: 'open', kind: 'call', answerers: { [world.households['hh-2'].members[0]]: [{ id: 'turn-out', can: true }] } } };
  assert.equal(tipToShow(withThing(other, theirs), { seen: other.household.tipsSeen || [] }).show, 'call');
});

// ------------------------------------------------------------------------------ never over the errand popup (2026-09-28)
test('while the town errand is open only its own tip stands, and the one over the map waits for it to close', () => {
  const world = running('tips-errand');
  const seen = view(world, 'hh-1');
  const call = { request: { status: 'open', kind: 'call', answerers: { [world.households['hh-1'].members[0]]: [{ id: 'turn-out', can: true }] } } };
  // The order tip stands over the map, and the student opens the errand: the store's tip, inside the popup, and not the order's.
  assert.deepEqual(tipToShow({ ...seen, lesson: undefined }, { showing: 'order', errandOpen: true }), { show: 'store', retire: null });
  // The store's put away, and something more urgent due: still nothing over the popup, and nothing retired or seen.
  assert.deepEqual(tipToShow(withThing(seen, call), { seen: ['store'], showing: 'call', errandOpen: true }), { show: null, retire: null });
  // The popup closed: the store's is retired, and the order tip, still due and never put away, stands again.
  assert.deepEqual(tipToShow({ ...seen, lesson: undefined }, { showing: 'store' }), { show: 'order', retire: 'store' });
});
