// A person who can do nothing says why, in one line (docs/FAMILY_PANEL.md §14, owner 2026-09-21).
//
// The owner, after playing: "When I switch characters, the action bar at the bottom should switch to that person's bar.
// It shouldn't (unless there's a good reason) stop another character from doing their action... This philosophy should be
// followed logically and dynamically throughout the experience of the game." Asked what an empty bar should show, they
// chose one line saying why, in the person's own terms, over a row of greyed icons and over leaving it blank.
//
// Everything held down here is about which sentence is shown and where it comes from. The one rule the whole thing rests
// on is that **the page writes none of them**: every line is the server's own refusal, word for word, and each test below
// checks the line it expects against the simulation that produced it rather than against a string typed here. The two
// situations the page must tell apart - a bar the server has refused, and a bar the guided start has shut - look the same
// on a screen and are proved apart in `a bar the guided start has shut is not a person with nothing to do`.
//
// What only a browser can show - the line really drawn on the row, the main person's line in the bar at the bottom of
// the screen instead - is scripts/panel-silence-browser-proof.mjs. The regressions are injected by
// scripts/panel-silence-injections.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld, taught } from './support/settled.mjs';
import { applyAction, projectWorld, projectFamily, rollFamily, stepWorld } from '../sim/world.mjs';
import { choreAvailability, choreCatalogue } from '../sim/chores.mjs';
import { tooYoung, tooYoungWhy } from '../sim/family.mjs';
import { servingWhy } from '../sim/winter.mjs';
import { panelActions, rowReason } from '../public/family-panel.js';
import { allowsIcon, lessonLocks } from '../public/lesson.js';

const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));

/** A real class, one family rolled, the guided start behind it, running: the world every test below measures. */
function classroom(seed = 'panel-silence') {
  const world = createSettledWorld(seed, 5);
  const household = world.households['hh-1'];
  rollFamily(world, household);
  taught(world);
  world.status = 'running';
  return { world, household };
}

/** One person's row exactly as public/app.js builds it, from the projection and nothing else. */
function row(world, household, id, { main = false } = {}) {
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  const entity = view.entities.find(one => one.id === id);
  const offered = view.work?.[id] || [];
  const homeId = view.household?.homeSiteId ?? null;
  const icons = panelActions({ entity, offered, catalogue, main, homeId, homesteads: [],
    atHome: entity?.location?.siteId === homeId, settable: true });
  return { view, entity, offered, icons, reason: rowReason(icons, { offered, entity }) };
}

/** Somebody of this family the server refuses everything to; the test says which one it wanted. */
const nobodyCanDoAnything = row => assert.equal(row.icons.some(icon => icon.can), false,
  `this row still has ${row.icons.filter(icon => icon.can).length} things open, so the fault being measured cannot appear`);

test('a child under ten shows the server’s own sentence, and it is the sentence the server sent', () => {
  const { world, household } = classroom();
  const book = projectFamily(world, household.id);
  const young = book.people.filter(person => tooYoung(world.entities[person.id]));
  assert.ok(young.length, 'this seed deals no child under ten, so nothing here is being measured');
  for (const person of young) {
    const measured = row(world, household, person.id);
    nobodyCanDoAnything(measured);
    // The line is not written here and not written in the page: it is `tooYoungWhy` (sim/family.mjs), which is what the
    // server put on every piece of work it listed for this child.
    assert.equal(measured.reason, tooYoungWhy(world.entities[person.id]));
    assert.ok(measured.offered.length, 'the server listed no work at all for this child');
    for (const icon of measured.icons) assert.equal(icon.why, measured.reason, `${icon.key} carried a different reason`);
    assert.match(measured.reason, new RegExp(`^${world.entities[person.id].name}\\b`), 'the line does not name the child it is about');
  }
  // And an infant is one of them: the youngest of all is not a separate case with a separate sentence.
  const infant = book.people.find(person => person.age === 0);
  if (infant) assert.equal(row(world, household, infant.id).reason, tooYoungWhy(world.entities[infant.id]));
});

test('somebody old enough, with work open, shows no line at all', () => {
  const { world, household } = classroom();
  const measured = row(world, household, household.principalId, { main: true });
  assert.ok(measured.icons.some(icon => icon.can), 'the principal of a settled family has nothing to do, so this proves nothing');
  assert.equal(measured.reason, null, 'a row with work open collapsed to one line');
});

test('somebody at work is not somebody with nothing to do: the glow and the way to call it off stay', () => {
  // `choreAvailability` refuses every other chore to somebody already at one, in the same sentence every time
  // (sim/chores.mjs), so a busy row is the one place a whole bar of work really does share one reason - and collapsing
  // it would take away the glowing icon and the only way to stop the work. What keeps it is that something is open.
  const { world, household } = classroom();
  const id = household.principalId;
  // Whatever this family may really be set to now, taken from the same list the bar is drawn from.
  const work = row(world, household, id, { main: true }).icons.find(icon => icon.can && icon.kind === 'chore' && !icon.onMap);
  assert.ok(work, 'the server offers this family no work at all, so nobody can be busy');
  applyAction(world, household.id, { action: 'chore', entityId: id, chore: work.key });
  assert.ok(world.entities[id].chore, 'the work was refused, so nobody is busy');
  const measured = row(world, household, id, { main: true });
  const chores = measured.icons.filter(icon => icon.kind === 'chore' && !icon.active);
  assert.ok(chores.length > 3, 'too little work on this row to stand for a whole bar of one reason');
  assert.equal(new Set(chores.map(icon => icon.why)).size, 1, 'the busy row no longer shares one reason, so this proves nothing');
  assert.equal(measured.reason, null, 'a busy row collapsed to one line and lost its glow and its call-off');
  assert.deepEqual(measured.icons.filter(icon => icon.active).map(icon => icon.key), [work.key]);
  assert.ok(measured.icons.some(icon => icon.key === 'stop-chore' && icon.can));
});

test('somebody dead or captured has no icons at all, and their row still says why', () => {
  for (const condition of ['dead', 'captured']) {
    const { world, household } = classroom();
    const id = household.principalId;
    world.entities[id].health = { condition };
    const measured = row(world, household, id, { main: false });
    // `panelActions` empties this row outright, so there is no icon left to carry a reason: this is the one case the line
    // is read from `world.work` itself.
    assert.deepEqual(measured.icons, [], `a ${condition} person was given icons`);
    const server = choreAvailability(world, household, world.entities[id], 'build-house');
    assert.equal(server.can, false);
    assert.equal(measured.reason, server.why, `a ${condition} person's line is not the server's own refusal`);
    assert.ok(measured.reason, `a ${condition} person's row is silent`);
  }
});

test('somebody away on the road shows the road, in the server’s words', () => {
  const { world, household } = classroom();
  const id = household.principalId;
  applyAction(world, household.id, { action: 'travel', entityId: id, destination: 'gonzales' });
  assert.ok(world.entities[id].travel, 'the travel was refused, so nobody is on the road');
  for (const main of [false, true]) {
    const measured = row(world, household, id, { main });
    nobodyCanDoAnything(measured);
    const server = choreAvailability(world, household, world.entities[id], 'build-house');
    assert.equal(measured.reason, server.why);
    assert.match(measured.reason, /on the road/);
  }
  // The main person's row carries the four orders as well, each refused with no reason of its own. They must not be what
  // decides the line: the work is what carries the reason about the person.
  const main = row(world, household, id, { main: true });
  assert.ok(main.icons.some(icon => icon.kind === 'order' && !icon.why), 'the orders now carry reasons, so this no longer measures anything');
  assert.equal(main.reason, row(world, household, id).reason, 'the main person’s row said something different from everybody else’s');
});

test('somebody serving says what the server says, and a man with work at the camp says nothing', () => {
  const { world, household } = classroom();
  const id = household.principalId;
  const entity = world.entities[id];
  entity.service = { kind: 'garrison', status: 'serving', siteId: 'bexar', since: world.minute };
  // A garrison man who can still be sent for has one thing open, so no line: the bar is not empty.
  const open = row(world, household, id);
  assert.deepEqual(open.icons.map(icon => icon.key), ['winter-recall']);
  assert.equal(open.reason, null, 'a row with one open icon collapsed to a line');
  // Shut in the Alamo, that one is refused too, and the row says which.
  entity.service.besieged = true;
  const shut = row(world, household, id);
  nobodyCanDoAnything(shut);
  assert.ok(shut.reason, 'a man shut in the Alamo has a row that says nothing');
  assert.match(shut.reason, /shut in the Alamo/);
  assert.match(shut.reason, new RegExp(`^${entity.name}\\b`));
  // ceiling: the row's own sentence, not `servingWhy`'s. A serving man is offered no work at all (sim/chores.mjs
  // `choresFor`), so the server's sentence never reaches this row; the way out is the projection carrying it.
  assert.match(servingWhy(world, entity), /shut in the Alamo/);
});

test('a bar the guided start has shut is not a person with nothing to do', () => {
  // The fault this guards cost a wrong answer on 2026-09-21: the lesson *shuts* icons on the page and the server
  // *refuses* them, and on a screen those look the same. They must not get the same sentence.
  const { world, household } = classroom();
  const id = household.principalId;
  const open = row(world, household, id, { main: true });
  const asked = open.icons.find(icon => icon.can && icon.kind === 'chore');
  assert.ok(asked, 'the server offers this family no work, so no step can shut a bar here');
  const step = { step: 'order', index: 2, of: 10, allow: [`chore:${asked.key}`], done: false };
  assert.equal(lessonLocks(step), true);
  // Everything but the one thing the step asks for is shut on the page...
  const shut = open.icons.filter(icon => !allowsIcon(step, icon));
  assert.ok(shut.length > 3, 'this step shuts almost nothing, so it cannot stand for a shut bar');
  // ...and a step that asks for nothing at all shuts the whole bar.
  const waiting = { ...step, step: 'arrive', allow: [] };
  assert.deepEqual(open.icons.filter(icon => allowsIcon(waiting, icon)), []);
  // The server has refused none of it, so the row is not silent and says nothing about having nothing to do.
  assert.equal(open.reason, null, 'a bar the guided start shut was called a person with nothing to do');
  assert.ok(open.icons.some(icon => icon.can), 'the lesson reached into `can`, which is the server’s');
  // And in the very same tick, under the very same step, a child the server really did refuse still gets their own line.
  const child = projectFamily(world, household.id).people.find(person => tooYoung(world.entities[person.id]));
  assert.ok(child, 'this seed deals no child under ten, so the two cases cannot be told apart here');
  assert.equal(row(world, household, child.id).reason, tooYoungWhy(world.entities[child.id]));
});

test('a row refused for several different reasons keeps its icons, each with its own', () => {
  // ceiling, held here so it is a decision and not an accident: one line cannot say two things. A family halted on the
  // road east is the case that deals it - the work at home is refused because the person is on the road, the work on the
  // road because the wagon is fast in the mud - and that row keeps the dimmed pictures it always had.
  const icons = panelActions({
    entity: { id: 'p', kind: 'person', health: { condition: 'well' } },
    offered: [
      { id: 'build-house', can: false, why: 'Bernarda is on the road.' },
      { id: 'plant-field', can: false, why: 'Bernarda is on the road.' },
      { id: 'hunt-road', can: false, why: 'The wagon is fast in the mud; free it first.' },
    ],
    catalogue,
  });
  assert.equal(icons.length, 3);
  assert.equal(rowReason(icons), null, 'two different reasons were collapsed into one line');
  // With the one odd reason gone, the row says the other once.
  assert.equal(rowReason(icons.slice(0, 2)), 'Bernarda is on the road.');
});

test('a class that is not running is not a fact about the person, and shows no line', () => {
  const { world, household } = classroom();
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  const id = household.principalId;
  const entity = view.entities.find(one => one.id === id);
  const offered = view.work[id];
  const icons = panelActions({ entity, offered, catalogue, main: true, homeId: view.household.homeSiteId, settable: false });
  assert.equal(icons.some(icon => icon.can), false, 'orders were settable in a class that is not running');
  assert.equal(rowReason(icons, { offered, entity }), null, 'a stopped class was reported as a person who can do nothing');
  // And a refusal with no words in it is not a line. An empty string drawn on a row is a row that says nothing while
  // looking as though it had: `null` is the only way to say "show the icons".
  const wordless = panelActions({ entity: { id: 'p', kind: 'person' }, catalogue, settable: true,
    offered: [{ id: 'plant-field', can: false, why: '' }, { id: 'build-house', can: false, why: '' }] });
  assert.equal(wordless.length, 2);
  assert.equal(rowReason(wordless), null, 'a refusal with no words in it was drawn as the row’s one line');
});

test('every line the panel shows is a sentence the server sent, over a whole family and a played day', () => {
  // The standing rule, swept rather than argued: for every person on every row for a day of ticks, any line shown is
  // found word for word among the refusals the server put on that person's own work.
  const { world, household } = classroom();
  assert.ok(projectFamily(world, household.id).people.some(person => tooYoung(world.entities[person.id])),
    'this seed deals no child under ten, so a day of ticks would sweep nothing');
  let lines = 0;
  for (let tick = 0; tick < 300; tick++) {
    stepWorld(world);
    if (tick % 17) continue;
    const view = projectWorld(world, household.id, 'student', { includeMap: false });
    for (const entity of view.entities.filter(one => one.kind === 'person' && household.members.includes(one.id))) {
      const offered = view.work?.[entity.id] || [];
      const main = entity.id === (view.household.mainId || view.household.principalId);
      const icons = panelActions({ entity, offered, catalogue, main, homeId: view.household.homeSiteId, settable: true });
      const reason = rowReason(icons, { offered, entity });
      if (!reason) continue;
      lines++;
      const sent = [...offered.map(entry => entry.why), ...icons.map(icon => icon.why)].filter(Boolean);
      assert.ok(sent.includes(reason), `"${reason}" is a sentence nothing sent: the page invented it`);
      assert.equal(icons.some(icon => icon.can), false, 'a line was shown on a row that still had something open');
    }
  }
  assert.ok(lines > 20, `only ${lines} lines were shown over a played day, which is too few to be a sweep`);
});
