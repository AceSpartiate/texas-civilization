// The words and the choices of the family-creation wizard (2026-09-21), held to the rule the tutorial pass proved out
// (docs/TUTORIAL_USABILITY_HANDOFF.md, docs/FAMILY_PANEL.md §12.11):
//
//   The screen may not name a thing it cannot point at, may not rely on a prerequisite it has not said out loud, and may
//   not say anything the simulation does not actually do.
//
// Every assertion here is checked against the code that implements the sentence, not against a copy of the sentence: the
// herd numbers come from `OPENING_HERD`, the acres from `grantProjection`, the refusal from `lessonRefusal`, and what a
// town sells from `sim/shops.mjs`. Claims `FIC-GONZ-240` and `-241`. No historical claim is made or moved: every number
// here is one the simulation already held.
//
// Proven by injection: docs/evidence/creation-words-injections.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld } from '../sim/world.mjs';
import { advanceLessons, lessonRefusal } from '../sim/lesson.mjs';
import { OPENING_HERD } from '../sim/stock.mjs';
import { wagonCatalogue } from '../sim/wagon.mjs';
import { TOWN_TRADES, TRADES } from '../sim/shops.mjs';

const read = name => readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8');
const html = read('index.html');
const app = read('app.js');
const appearance = read('appearance.js');
const creation = read('creation.js');

/** The text of one panel of the page, tags stripped and whitespace collapsed - what a student actually reads. */
function panel(id) {
  const open = html.indexOf(`id="${id}"`);
  assert.notEqual(open, -1, `there is no #${id} on the page`);
  const start = html.lastIndexOf('<', open);
  // To the end of that element: these are all `<section>`s or `<div>`s with no nested one of the same tag.
  const tag = html.slice(start + 1).match(/^[a-z]+/)[0];
  const end = html.indexOf(`</${tag}>`, open);
  assert.notEqual(end, -1, `#${id} is never closed`);
  return html.slice(start, end)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('the title card does not promise the freedom the guided beginning refuses', () => {
  // What the lesson actually does to a family that has just been made: every order that is not the step it is on comes
  // back refused, in words (docs/LESSON.md, sim/lesson.mjs).
  const world = createGonzalesWorld('creation-words', 5);
  world.households['hh-1'].played = true;
  world.status = 'running';
  const household = world.households['hh-1'];
  advanceLessons(world);
  for (const chore of ['hunt-timber', 'build-house', 'plant-field']) {
    const refused = lessonRefusal(world, household, { action: 'chore', entityId: household.members[0], chore });
    assert.match(String(refused), /^Not yet - first,/, `the lesson lets a fresh family ${chore} at once, so this card has nothing to warn about`);
  }

  const card = panel('creation-begin');
  // The card may still end on the country being the student's - that is true, once the lesson is done. What it may not do
  // is say so without first saying there is a guided beginning in the way.
  assert.match(card, /one task at a time/, 'the title card does not say the game walks the student through the farm');
  const walks = card.indexOf('one task at a time');
  const free = card.indexOf('yours to work');
  assert.ok(free === -1 || walks < free, 'the title card promises the country is yours to work before it says the lesson holds the gate');
  // And it may not offer the town or the timber as things to do now: the lesson refuses both until its eighth and third steps.
  assert.doesNotMatch(card, /yours to work: the field, the timber, the town/, 'the old unqualified promise is back on the title card');
});

test('the stock choice says the land and the herd it brings, in the server’s own numbers', () => {
  const world = createGonzalesWorld('creation-words', 5);
  const land = projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  const choice = land.stockChoice;
  assert.ok(choice, 'the lobby offers no stock choice at all');
  // Both halves of what the choice does. The acres were always there; the herd is what the choice has brought since
  // docs/STOCK.md was built on 2026-09-20, and the panel offered only the acres and the wagon cost until today.
  assert.deepEqual(choice.herd, { ...OPENING_HERD }, 'the stock choice does not carry the herd it brings');
  assert.ok(choice.stockAcres > choice.laborAcres * 10, 'the two answers no longer differ enough in land for the panel to be worth stating');

  // The page states both, and takes every number from the projection: a number written into the page is a number that
  // goes wrong silently the next time the simulation moves.
  assert.match(app, /choice\.herd\.cattle/, 'the wagon panel never names the cattle the choice brings');
  assert.match(app, /choice\.herd\.hogs/, 'the wagon panel never names the hogs the choice brings');
  assert.match(app, /choice\.laborAcres/);
  assert.match(app, /choice\.stockAcres/);
  const stockLines = app.slice(app.indexOf('#stock-no-text'), app.indexOf('#wagon-stock-why'));
  assert.doesNotMatch(stockLines, /\b(6 cattle|12 hogs|177|4,?606)\b/, 'the wagon panel writes the herd or the acres itself instead of reading the server’s');
});

test('the wagon panel does not say a thing left out can never be had, because the towns sell some of it', () => {
  // What a town actually sells, against what the wagon offers to leave behind. Every town in the game keeps a blacksmith
  // (`TOWN_TRADES`), and the store is everywhere, so this is not a claim about one lucky settlement.
  const world = createGonzalesWorld('creation-words', 5);
  assert.ok(Object.values(TOWN_TRADES).every(trades => trades.includes('blacksmith')), 'not every town has a blacksmith any more');
  const everywhere = ['store', 'blacksmith'];
  const forSale = new Set(everywhere.flatMap(trade => TRADES[trade].offers.filter(offer => offer.kind === 'sell').map(offer => offer.id.replace(/^tool-/, ''))));
  const packable = wagonCatalogue().items.map(item => item.id);
  const buyable = packable.filter(id => forSale.has(id));
  assert.ok(buyable.length >= 2, `nothing a family can pack is for sale in a town, so the old sentence would be true: ${[...forSale].join(', ')}`);

  const card = panel('wagon-load');
  assert.doesNotMatch(card, /Anything left out is not coming/, 'the wagon panel is back to saying nothing left out is coming, which the blacksmith and the store contradict');
  assert.match(card, /can be bought in a town later/, 'the wagon panel does not say what can be bought later');
  // The deadline: the choice is gone the moment the class runs (`wagonProjection` sends nothing), and the panel says so.
  assert.equal(projectWorld({ ...world, status: 'running' }, 'hh-1', 'student', { includeMap: false }).wagon, null, 'the wagon can still be packed once the class runs');
  assert.match(card, /until your teacher presses Start/, 'the wagon panel never says when the choice closes');
});

test('the die says it is thrown once, and still does not say what the number means', () => {
  const card = panel('family-roll');
  assert.match(card, /thrown once/, 'the die panel does not say the roll is taken once');
  assert.match(card, /no\s+second roll/i, 'the die panel does not say there is no second roll');
  // docs/FAMILY_CREATION.md §2: "The rule is never explained in the game... The number rolled is not a secret, the
  // mapping is." Saying more about the die must not become saying what it maps to.
  assert.doesNotMatch(card, /\b(parent|parents|children|child|lone|widowed)\b/i, 'the die panel gives away the mapping the owner keeps hidden');
  // Nor may the page carry the table anywhere else a student could read it.
  for (const [name, source] of [['index.html', html], ['app.js', app], ['creation.js', creation]]) {
    assert.doesNotMatch(source, /roll(ed)?\s+(of\s+)?\d+\s*(-|to|or more)?\s*\d*\s*(gives?|means?)\s/i, `${name} spells out what a roll gives`);
  }
});

test('every step of the wizard says which step it is, in the order creationStep walks', () => {
  assert.match(panel('family-roll'), /STEP 1 OF 4/);
  assert.match(panel('surname'), /STEP 2 OF 4/);
  assert.match(panel('names'), /Step 3 of 4/);
  assert.match(appearance, /Step 4 of 4/, 'the looks pop-up does not say which step it is');
  // The looks pop-up counts over every parent of the family, not over the ones still waiting, or the total would shrink
  // to "Parent 1 of 1" the moment the first was answered.
  assert.match(appearance, /const parentsOf = family =>[^\n]*person\.choices\)/, 'the looks counter no longer has a fixed total');
  assert.match(appearance, /brings up the next parent/, 'the looks pop-up does not say a second parent is coming');
});

test('what is set once says so where it is chosen, and what is not says that too', () => {
  const name = panel('surname');
  assert.match(name, /cannot be changed afterwards/, 'the last name box does not say it is set once');
  assert.match(name, /first\s+names can be changed/i, 'the last name box does not say first names can still be changed');
  const looks = panel('looks');
  assert.match(looks, /changes nothing in the game/, 'the looks pop-up no longer says appearance decides nothing');
  assert.match(looks, /Chosen once/, 'the looks pop-up does not say the looks are set once');
  assert.match(looks, /children are not asked for/i, 'the looks pop-up does not say the children take after their parents');
  const names = panel('names');
  assert.match(names, /already named/, 'the names card does not say every box is already filled in');
});

test('an emptied name box is put back to the name the world holds, so no box shows a name nobody has', () => {
  // The server refuses a blank name ("A name needs at least one letter"), and the card skipped an empty box silently, so
  // Continue left the student looking at an empty box for a person who still had their dealt name.
  assert.match(creation, /if \(!typed\) \{ if \(input\) input\.value = person\.given \|\| person\.name; continue; \}/,
    'an emptied name box is left empty while the world keeps the dealt name');
});
