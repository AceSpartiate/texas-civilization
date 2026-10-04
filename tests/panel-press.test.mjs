// Panel rows kept under the student's tap: triage 2.14 (2026-10-03), docs/FAMILY_PANEL.md §11.4.
//
// A browser sends no click when the element a press went down on leaves the page before the press comes up (moving it with
// `insertBefore` takes it out for that instant), nor to one that moved out from under the pointer: the click goes to whatever
// holds both ends. A snapshot arriving between pointerdown and click did both to the family panel - an icon taken off the bar and
// put back, a row's switch pushed along by a word appearing beside it - so the tap did nothing. Now the panel and the call's menu
// are not drawn at all while a press is down on them (the page's wiring, read from public/app.js below), and the lists still drawn
// under a press are kept item by item around the pressed node. How long a press holds, and how a list is put in order around it,
// are pure (public/family-panel.js) and held here against a DOM that counts every time a node leaves its parent. Under real
// snapshots from a real server: `npm run test:panel-press`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { arrangeChildren, keepList, pressHold } from '../public/family-panel.js';

/** A DOM as small as these need: every time a node leaves its parent - removed, or moved by insertBefore - is written down. */
function dom() {
  const left = [];
  const node = name => {
    const self = { name, parent: null, kids: [], dataset: {} };
    Object.defineProperty(self, 'children', { get: () => self.kids });
    Object.defineProperty(self, 'nextElementSibling', { get: () => self.parent ? self.parent.kids[self.parent.kids.indexOf(self) + 1] || null : null });
    Object.defineProperty(self, 'nextSibling', { get: () => self.nextElementSibling });
    const detach = one => { if (!one.parent) return; left.push(one); one.parent.kids.splice(one.parent.kids.indexOf(one), 1); one.parent = null; };
    self.insertBefore = (one, ref) => {
      detach(one);
      const at = ref ? self.kids.indexOf(ref) : self.kids.length;
      assert.ok(at >= 0, 'insertBefore with a reference that is not a child');
      self.kids.splice(at, 0, one); one.parent = self;
      return one;
    };
    self.append = (...more) => { for (const one of more) self.insertBefore(one, null); };
    self.remove = () => detach(self);
    self.contains = other => { for (let at = other; at; at = at.parent) if (at === self) return true; return false; };
    return self;
  };
  return { node, left };
}
const names = parent => parent.children.map(one => one.name);
/** A bar of icons, each a button holding its picture, as `panelIcon` makes them. */
function bar(d, keys) {
  const icons = d.node('icons'), made = {};
  for (const key of keys) { const button = d.node(key); button.append(d.node(`${key}-canvas`)); icons.append(button); made[key] = button; }
  d.left.length = 0;
  return { icons, made };
}

test('a list redrawn under a press - reordered, added to, taken from - never moves or removes the item being pressed', () => {
  // Every shape of change a tick makes to a list of buttons (the bar's shapes, the hardest), each with the press on each item in
  // turn - on its picture, as a finger lands.
  const cases = [
    { from: ['a', 'b', 'c'], to: ['c', 'b', 'a'] },             // reordered round it
    { from: ['a', 'b', 'c'], to: ['b', 'c', 'a'] },             // the first moved to the end
    { from: ['a', 'b', 'c'], to: ['x', 'b', 'a'] },             // one new ahead, one gone
    { from: ['a', 'b', 'c'], to: ['main', 'a', 'b', 'c', 'why'] }, // the make-main button ahead, the travelling words behind
    { from: ['a', 'b', 'c', 'd'], to: ['d', 'c'] },            // two gone, the rest reversed
  ];
  for (const { from, to } of cases) {
    for (const pressedKey of from) {
      const d = dom(), { icons, made } = bar(d, from);
      const fresh = {};
      const wanted = to.map(key => made[key] || (fresh[key] = d.node(key)));
      const pressed = made[pressedKey].children[0];
      const waits = arrangeChildren(icons, wanted, pressed);
      const label = `${from.join('')} -> ${to.join('')}, pressing ${pressedKey}`;
      assert.deepEqual(d.left.filter(one => one.contains(pressed)).map(one => one.name), [], `${label}: the pressed icon left the page under the press`);
      if (to.includes(pressedKey)) {
        assert.equal(waits, false, `${label}: nothing waits when the pressed icon is still wanted`);
        assert.deepEqual(names(icons), to, `${label}: the bar is not in the server's order`);
      } else {
        // Taken away by this tick, but pressed: it stands where it was until the press is over, the rest in order round it.
        assert.equal(waits, true, `${label}: a pressed icon no longer wanted did not say it waits`);
        assert.deepEqual(names(icons).filter(name => name !== pressedKey), to, `${label}: the others are not in order round it`);
        // And once the press is over, the same tick's order is put in full.
        assert.equal(arrangeChildren(icons, wanted, null), false);
        assert.deepEqual(names(icons), to, `${label}: after the press the bar is not the server's`);
        assert.equal(made[pressedKey].parent, null, `${label}: the icon taken away stayed after the press`);
      }
    }
    // With nothing pressed, exactly the order asked for.
    const d = dom(), { icons, made } = bar(d, from);
    assert.equal(arrangeChildren(icons, to.map(key => made[key] || d.node(key)), null), false);
    assert.deepEqual(names(icons), to);
  }
});

test('a list is put in order round an item pressed deep inside it, and an item no longer wanted waits for the press', () => {
  const d = dom(), list = d.node('rows'), rows = {};
  for (const id of ['father', 'mother', 'son']) { rows[id] = d.node(id); rows[id].append(d.node(`${id}-icons`)); list.append(rows[id]); }
  rows.son.children[0].append(d.node('son-rest'));
  d.left.length = 0;
  const pressed = rows.son.children[0].children[0];
  // The son's row moves up the list (a new oldest child is now below him) while his icon is pressed.
  const daughter = d.node('daughter');
  arrangeChildren(list, [rows.father, rows.mother, rows.son, daughter], pressed);
  arrangeChildren(list, [rows.son, rows.father, rows.mother, daughter], pressed);
  assert.deepEqual(names(list), ['son', 'father', 'mother', 'daughter']);
  assert.deepEqual(d.left.filter(one => one.contains(pressed)).map(one => one.name), []);
});

test('a list is kept item by item: the same element for the same key, changed in place, never made again', () => {
  const d = dom(), list = d.node('family');
  let made = 0;
  const draw = (people, held = null) => keepList(list, people, {
    key: person => person.id,
    make: () => { made++; const li = d.node('li'); li.append(d.node('button')); return li; },
    update: (li, person) => { li.children[0].text = `${person.name}: ${person.task}`; },
    held,
  });
  draw([{ id: 'p1', name: 'Rosa', task: 'resting' }, { id: 'p2', name: 'Eli', task: 'hoeing' }]);
  assert.equal(made, 2);
  const [rosa, eli] = list.children;
  d.left.length = 0;
  // A tick later the words change and the order turns round: the same two elements, changed, and nothing made.
  draw([{ id: 'p2', name: 'Eli', task: 'fishing' }, { id: 'p1', name: 'Rosa', task: 'sewing' }], rosa.children[0]);
  assert.equal(made, 2, 'a row was made again for a person already on the list');
  assert.deepEqual(list.children, [eli, rosa]);
  assert.equal(rosa.children[0].text, 'Rosa: sewing');
  assert.equal(rosa.dataset.keep, 'p1');
  assert.deepEqual(d.left.filter(one => one.contains(rosa.children[0])), [], 'the pressed button left the list');
  // Rosa gone from the list while her button is pressed: kept until the press is over, then gone.
  assert.equal(draw([{ id: 'p2', name: 'Eli', task: 'fishing' }], rosa.children[0]), true);
  assert.deepEqual(list.children, [eli, rosa]);
  assert.equal(draw([{ id: 'p2', name: 'Eli', task: 'fishing' }]), false);
  assert.deepEqual(list.children, [eli]);
});

test('a press holds the panel from going down until its click has run, and no longer', () => {
  // Timers by hand: what is due runs when `run` says so.
  let clock = 0, next = 1;
  const due = new Map();
  const timers = { set: (fn, ms) => { const id = next++; due.set(id, { fn, at: clock + ms }); return id; }, clear: id => due.delete(id) };
  const run = (ms = 0) => { clock += ms; for (const [id, one] of [...due].sort((a, b) => a[1].at - b[1].at)) if (one.at <= clock) { due.delete(id); one.fn(); } };
  let released = 0;
  const press = pressHold({ onRelease: () => released++, tapMs: 600, longestMs: 8000, timers });
  const icon = { name: 'icon' };

  // A mouse: down, up, click in one go. Held through the click's own handlers, let go a task later.
  press.down(icon);
  assert.equal(press.held(), icon);
  assert.equal(press.wait(), true, 'a snapshot during the press is told to wait');
  press.up(); press.click();
  assert.equal(press.held(), icon, 'let go before the click had run');
  assert.equal(released, 0);
  run(0);
  assert.equal(press.held(), null);
  assert.equal(released, 1, 'what waited for the press was not drawn when it ended');

  // A tap: the finger lifts, and the click comes from the tap a little after. Still held in between.
  press.down(icon); press.up();
  run(100);
  assert.equal(press.held(), icon, 'let go between the finger lifting and the tap\'s click');
  press.click(); run(0);
  assert.equal(press.held(), null);
  assert.equal(released, 1, 'nothing waited, so nothing is drawn again');

  // Dragged off the button: no click ever comes, and the press is let go a moment after the lift.
  press.down(icon); press.wait(); press.up();
  run(599); assert.equal(press.held(), icon);
  run(1); assert.equal(press.held(), null); assert.equal(released, 2);

  // Cancelled by the browser (a scroll took the touch): let go at once.
  press.down(icon); press.wait(); press.cancel();
  assert.equal(press.held(), null); assert.equal(released, 3);

  // A lift the page never heard: let go after the longest hold, so the panel is never frozen.
  press.down(icon);
  run(7999); assert.equal(press.held(), icon);
  run(1); assert.equal(press.held(), null);

  // Nothing pressed: nothing waits.
  assert.equal(press.wait(), false);
  press.up(); press.click(); run(1000);
  assert.equal(released, 3);
});

test('the page holds the family panel and the call\'s menu still under a press, and keeps the journal\'s lists item by item', () => {
  // public/app.js is a browser module these tests cannot import; its wiring to the rules above is read from it, and its behaviour
  // under real snapshots is `npm run test:panel-press`.
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  // A function's text, to the brace that closes it at the start of a line (the file may have either line ending).
  const body = name => { const at = app.indexOf(`function ${name}(`); assert.ok(at >= 0, `${name} not found`); const rest = app.slice(at); return rest.slice(0, rest.search(/\r?\n\}\r?\n/)); };
  // The first thing the panel's render does: nothing at all while a press is down on the panel or its popup, and wait for it.
  assert.match(body('renderFamilyPanel').split('\n').slice(1, 4).join('\n'), /if \(panelPress\.held\(\)\?\.closest\?\.\('#family-panel, #panel-tip'\)\) \{ panelPress\.wait\(\); return; \}/,
    'the family panel is drawn under a press');
  assert.match(body('renderCallMenu'), /if \(panelPress\.held\(\)\?\.closest\?\.\('#call-menu'\)\) \{ panelPress\.wait\(\); return; \}/, 'the call\'s menu is drawn under a press');
  // Every press is heard, from going down to its click, before the page's own handlers; what waited is drawn when it ends.
  for (const [event, call] of [['pointerdown', 'event => panelPress.down(event.target)'], ['pointerup', '() => panelPress.up()'], ['pointercancel', '() => panelPress.cancel()'], ['click', '() => panelPress.click()']]) {
    assert.ok(app.includes(`document.addEventListener('${event}', ${call}, true);`), `the press is not told of ${event}`);
  }
  assert.match(app, /const panelPress = pressHold\(\{ onRelease: \(\) => \{ if \(window\.__snapshot\?\.world\) renderHousehold\(window\.__snapshot\.world\); \} \}\);/);
  // The lists a snapshot rebuilt each time are kept item by item, the pressed node standing.
  const household = body('renderHousehold');
  for (const list of ['#family', '#others', '#property', '#event-log']) {
    assert.ok(household.includes(`keepList($('${list}')`), `${list} is not kept item by item`);
    assert.ok(!household.includes(`$('${list}').replaceChildren(`), `${list} is rebuilt on every snapshot`);
  }
  assert.ok(!body('renderCallMenu').includes('replaceChildren('), 'the call\'s menu is rebuilt on every change');
});
