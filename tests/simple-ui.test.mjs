// The small defects a play-through as a new student found (2026-10-09; owner: the guided start stays off, "Tips are the only
// guidance; fix their timing and wording"), each held here to the rule that fixes it. docs/FAMILY_PANEL.md, amendment 2026-10-09; the
// browser proof is `npm run test:simple-ui`. Every test here was seen failing under the regression it guards before it was trusted
// (HANDOFF.md, "The short bar and More").
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, stepWorld } from '../sim/world.mjs';
import { choreCatalogue } from '../sim/chores.mjs';
import { ORDER_NAMES, answersRequest, isIdle, needsOf, portraitSetsMain } from '../public/family-panel.js';
import { TIPS, TIP_GAP_MS, tipToShow } from '../public/tips.js';
import { rosterLine } from '../public/roster-line.js';

globalThis.document ??= { querySelector: () => null, body: { dataset: {} } };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
const { creationStep } = await import('../public/creation.js');
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

// ------------------------------------------------------------------------------------------------------- tips: timing
function running(seed) {
  const world = createGonzalesWorld(seed, 5);
  world.households['hh-1'].played = true;
  world.status = 'running';
  for (let tick = 0; tick < 4000 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return projectWorld(world, 'hh-1', 'student', { includeMap: false });
}

test('a tip waits while a card or dialog is open, and for a short gap after one is put away; one at a time', () => {
  const seen = running('simple-ui-tips');
  // Due on the land: the order tip.
  assert.equal(tipToShow(seen).show, 'order');
  // The house site, the house plans, a call's menu: nothing stands, nothing is retired, and the one due waits.
  assert.deepEqual(tipToShow(seen, { held: true }), { show: null, retire: null, waiting: 'order' });
  // One standing when a dialog opens is hidden, not put away; it is the same tip when the dialog closes.
  assert.deepEqual(tipToShow(seen, { showing: 'order', held: true }), { show: null, retire: null, waiting: 'order' });
  assert.deepEqual(tipToShow(seen, { showing: 'order' }), { show: 'order', retire: null });
  // Put away: the next waits the gap, then stands.
  const gap = tipToShow(seen, { seen: ['order'], now: 1000, quietUntil: 1000 + TIP_GAP_MS });
  assert.equal(gap.show, null, 'the next tip came straight after one was put away');
  assert.ok(gap.waiting, 'nothing was waiting: this proves nothing');
  assert.equal(tipToShow(seen, { seen: ['order'], now: 1000 + TIP_GAP_MS, quietUntil: 1000 + TIP_GAP_MS }).show, gap.waiting);
  assert.ok(TIP_GAP_MS >= 10000 && TIP_GAP_MS <= 30000, `a gap of ${TIP_GAP_MS} ms is not short, or not a gap`);
  // The page holds a tip behind every card and dialog the play-through met one over, and asks the rule with them.
  const app = source('../public/app.js');
  const list = app.slice(app.indexOf('const TIP_HELD_BY'), app.indexOf('function tipHeld'));
  assert.ok(list.includes('const TIP_WAITS_FOR = [...TIP_HELD_BY,'), 'the dialogs a tip waits for are not the ones it is placed clear of and more');
  for (const selector of ['#site-choose', '#house-plot', '#house-plan', '#call-menu', '#encounter', '#going']) assert.ok(list.includes(`'${selector}'`), `a tip does not wait for ${selector}`);
  assert.match(app, /tipToShow\(world, \{ seen, showing: tipShowing, errandOpen, held: tipHeld\(\), now: Date\.now\(\), quietUntil: tipQuietUntil \}\)/);
  assert.match(app, /tipQuietUntil = Date\.now\(\) \+ TIP_GAP_MS/);
});

// ------------------------------------------------------------------------------------------------------ tips: wording
test('every tip is one or two short sentences, and every button it names is named as the screen shows it', () => {
  // What the screen calls its controls: every work by its catalogue name, the main person's orders, and the buttons a tip may send a
  // student to by their own words (public/index.html and the cards public/app.js draws).
  const controls = new Set([...choreCatalogue().map(spec => spec.name), ...Object.values(ORDER_NAMES), 'More', 'Auto', 'Choose a house', 'Leave for the east',
    'Change where we go', 'Send them', 'Watch', 'Neighbours', 'Offer a trade', 'Resume tutorial',
    // The errand's button says whom it sends ("Send Ruth"): the tip names its first word.
    'Send']);
  // Quoted words that are not buttons: what the soldiers shout, and the mark itself.
  const said = new Set(['¡Alto!', 'Halt!', '!']);
  const app = source('../public/app.js'), html = source('../public/index.html');
  assert.match(app, /'Leave for the east'/); assert.match(app, /'Change where we go'/); assert.match(html, /id="call-menu-confirm">Send them</);
  assert.match(html, /<span>Neighbours<\/span>/); assert.match(source('../public/neighbours.js'), /'Offer a trade'/); assert.match(html, /id="house-open">Choose a house</);
  for (const [id, words] of Object.entries(TIPS)) {
    const sentences = words.split(/(?<=[\w”)][.!?]”?)\s+/).filter(Boolean);
    assert.ok(sentences.length <= 2, `${id} is ${sentences.length} sentences: ${words}`);
    for (const quoted of words.matchAll(/“([^”]+)”/g)) {
      const name = quoted[1];
      assert.ok(said.has(name) || controls.has(name), `the ${id} tip names “${name}”, which no button on the screen is called`);
    }
  }
  // The play-through's mismatch: the house's tip names the house's work as the bar names it.
  assert.ok(TIPS.house.includes(`“${choreCatalogue().find(spec => spec.id === 'build-house').name}”`), 'the house tip names the house\'s work by another name');
  assert.match(TIPS.order, /“More”/, 'the first tip does not say where the rest of the work is');
});

// ------------------------------------------------------------------------------------------------------ the idle mark
test('the idle mark is for somebody with nothing to do, not somebody resting on purpose: asleep, sick, or a small child at play', () => {
  const open = [{ key: 'rest', can: true, kind: 'order' }];
  assert.equal(isIdle({ id: 'a', task: 'rest', age: 30 }, open), true, 'a grown person resting with work open is not marked');
  assert.equal(isIdle({ id: 'a', task: 'rest', age: 30 }, open, { dark: true }), false, 'somebody asleep in the dark is marked idle');
  assert.equal(isIdle({ id: 'a', task: 'rest', age: 30, sickness: { line: 'Has a chill.' } }, open), false, 'somebody sick and mending is marked idle');
  assert.equal(isIdle({ id: 'a', task: 'rest', age: 6 }, open), false, 'a small child at play is marked idle');
  assert.equal(isIdle({ id: 'a', task: 'rest', age: 10 }, open), true, 'a child of ten, who is given grown work, is not marked');
  // The page reads the server's dark; the server sends it only while it is dark.
  assert.match(source('../public/app.js'), /isIdle\(entity, icons, \{ withArmy: army\.has\(id\), dark: Boolean\(world\.dark\) \}\)/);
  // The mark is drawn as a token over everything else on the face (public/style.css).
  assert.match(source('../public/style.css'), /\.panel-row\[data-idle=true\] \.panel-idle-mark\[data-drawn=true\]\{z-index:4;[^}]*border-radius:50%;[^}]*border:1\.5px solid/);
});

// --------------------------------------------------------------------------------------- the call's "!" and the mother
test('the call to arms\' "!" stands only on somebody who can answer it: who can go, or with nobody able, the one who says nobody goes', () => {
  const go = can => [{ id: 'turn-out', can, why: can ? '' : 'Charity Hill does not go to the fighting; in 1835 that was the men\'s.' }, { id: 'stay-put', can: true }];
  const request = { status: 'open', kind: 'call', answerers: { father: go(true), mother: go(false), son: go(true) } };
  assert.equal(answersRequest(request, 'father'), true);
  assert.equal(answersRequest(request, 'son'), true);
  assert.equal(answersRequest(request, 'mother'), false, 'the "!" is on the mother, who does not go');
  // With nobody able to go the family must still be able to say so: on the first who may.
  const nobody = { status: 'open', kind: 'call', answerers: { mother: go(false), girl: go(false) } };
  assert.deepEqual(['mother', 'girl'].filter(id => answersRequest(nobody, id)), ['mother']);
  // The food call and the rumour are anybody's to carry: everybody who may go.
  const food = { status: 'open', kind: 'supply', answerers: { father: [{ id: 'help', can: true }, { id: 'stay', can: true }], mother: [{ id: 'help', can: true }, { id: 'stay', can: true }] } };
  assert.ok(answersRequest(food, 'father') && answersRequest(food, 'mother'));
  // The army's request for supplies has no sending answer: everybody at home it is put to may hand it over.
  const supply = { status: 'open', kind: 'supply', answerers: { father: [{ id: 'supply-food', can: true }, { id: 'supply-none', can: true }], mother: [{ id: 'supply-food', can: true }, { id: 'supply-none', can: true }] } };
  assert.ok(answersRequest(supply, 'father') && answersRequest(supply, 'mother'), "the army's request for supplies is put to one person only");
  // On the panel: the "!" (`needsOf`) follows it.
  const world = { householdId: 'hh-1', request, entities: [{ id: 'father', name: 'Wiley Hill' }, { id: 'mother', name: 'Charity Hill' }] };
  assert.deepEqual(needsOf(world, 'father').map(need => need.kind), ['call']);
  assert.deepEqual(needsOf(world, 'mother').map(need => need.kind), [], 'the mother carries the call\'s "!"');
});

// -------------------------------------------------------------------------------------------- a small child's portrait
test('a small child\'s portrait chooses her and sends nothing; a grown person\'s still makes them the main person', () => {
  assert.equal(portraitSetsMain({ id: 'a', age: 37 }), true);
  assert.equal(portraitSetsMain({ id: 'a', age: 10 }), true);
  assert.equal(portraitSetsMain({ id: 'a', age: 6 }), false, 'a 6-year-old\'s portrait asks for her to be the main person, and is refused in red');
  assert.equal(portraitSetsMain({ id: 'a', age: 30, health: { condition: 'dead' } }), false);
  assert.equal(portraitSetsMain({ id: 'a' }), true, 'somebody of no stated age (the founding four) cannot be chosen');
  const app = source('../public/app.js');
  assert.match(app, /if \(person && !portraitSetsMain\(person\)\) goToPerson\(id\); else pressStar\(id\);/, 'the portrait does not ask the rule');
});

// ------------------------------------------------------------------------------------------------ making the family
test('an empty last name says what is needed; a family already made is not asked to "Make my family" on another page', () => {
  const app = source('../public/app.js'), html = source('../public/index.html');
  assert.match(html, /<form id="surname-form" novalidate>/, 'the browser\'s own bubble, which a Chromebook may not show, still stands in');
  assert.match(app, /if \(!surname\) \{ \$\('#surname-error'\)\.textContent = SURNAME_EMPTY;/);
  assert.match(app, /const SURNAME_EMPTY = 'Type a last name for your family first\.';/);
  const book = extra => ({ named: true, surname: 'Hill', roll: 5, canRoll: false, people: [{ id: 'p', role: 'father', choices: { skin: [] }, chosen: true }], ...extra });
  // A fresh page - another tab, another Chromebook - remembers nothing of the making.
  globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
  assert.equal(creationStep({ role: 'student', householdId: 'hh-40' }, book()), null, 'a made family was shown "Make my family" again');
  assert.equal(creationStep({ role: 'student', householdId: 'hh-41' }, book({ named: false, surname: undefined })), 'begin', 'a family still to be made lost its title screen');
  assert.equal(creationStep({ role: 'student', householdId: 'hh-42' }, book({ people: [{ id: 'p', role: 'father', choices: { skin: [] }, chosen: false }] })), 'begin', 'a family with looks still to choose skipped its title screen');
});

// --------------------------------------------------------------------------------------------- the journal's roster
test('the journal\'s roster reads in plain sentences, not the server\'s words strung together', () => {
  const place = id => ({ 'hh-1-home': 'Family 1 home', gonzales: 'Gonzales' })[id] || id;
  const at = { place, home: 'hh-1-home', work: id => ({ 'fell-trees': 'Fell trees' })[id] || id };
  const line = rosterLine({ name: 'Charity Hill', task: 'rest', location: { siteId: 'hh-1-home' }, health: { condition: 'well' } }, at);
  assert.equal(line, 'Charity Hill is resting at home.');
  assert.doesNotMatch(line, /Family 1 home|: rest|, well/);
  assert.equal(rosterLine({ name: 'Wiley Hill', given: 'Wiley', chore: { id: 'fell-trees' }, location: { siteId: 'hh-1-home' }, health: { condition: 'tired' } }, at), 'Wiley Hill is at work at home: Fell trees. Wiley is tired.');
  assert.equal(rosterLine({ name: 'Ruth Hill', travel: { to: 'gonzales' }, health: { condition: 'well' } }, at), 'Ruth Hill is on the road to Gonzales.');
  assert.equal(rosterLine({ name: 'Ruth Hill', task: 'work', location: { siteId: 'gonzales' }, health: { condition: 'well' } }, { ...at, also: ['Waiting on your word.'] }), 'Ruth Hill is working about the place at Gonzales. Waiting on your word.');
  assert.equal(rosterLine({ name: 'Wiley Hill', health: { condition: 'dead' } }, at), 'Wiley Hill has died.');
  assert.match(source('../public/app.js'), /setText\(button, rosterLine\(entity, \{ place: id => placeName\(world, id\), home: homeOf\(world\)/);
});
