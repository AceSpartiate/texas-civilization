// The family column's foot (docs/FAMILY_PANEL.md §17, owner 2026-09-25: "Fix it").
//
// At 1024x768 a two-row ability bar rose above the column's fixed `bottom:200px` and covered its foot, and the auto lines made
// the column taller. The column is its own scroll region now, and its foot is the bar's measured top (`columnRoom`); the main
// person is scrolled into view in it (`scrollToShow`). Both are pure and tested here against a model of the screen built from
// the stylesheet's own numbers - the bar's tiles, its lift during the guided start, the column's width, the Journal and Land
// buttons - at the two supported sizes, with the bar absent, one row and two, and families of 4, 12 and 20. What only a
// browser can show (the real boxes, the real scroll, the screenshots) is `npm run test:panels`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnRoom, scrollToShow } from '../public/family-panel.js';

const SCREENS = [{ width: 1366, height: 768 }, { width: 1024, height: 768 }];
/** public/style.css: a named tile is 70px high, the grid's gap 4px and its padding 12px above and 4px below; each column 62px. */
const TILE = 70, GAP = 4, PAD = 16, COLUMN_WIDE = 62;
/** The bar stands 64px up, 104px while the guided start names the icons (`body[data-lesson=true]`). */
const LIFT = { plain: 64, lesson: 104 };
/** The column: 12px in, 19rem wide, under four status lines. A row is a 48px portrait and a 5px gap, 70px with an auto line. */
const COLUMN = { left: 12, right: 12 + 304, top: 12 + 4 * 31 + 3 * 6 };
const ROW = 53, AUTO_ROW = 70;

/** The bar as the stylesheet draws it: `rows` of 0 is no bar; 1 is one icon (or a sentence); 2 is `icons` over two rows. */
function barBox({ width, height }, rows, lift, icons = 16) {
  if (!rows) return null;
  const columns = rows === 1 ? 1 : Math.ceil(icons / 2);
  const wide = Math.min(columns * COLUMN_WIDE, width - 220);
  const tall = PAD + rows * TILE + (rows - 1) * GAP;
  const left = (width - wide) / 2;
  return { left, right: left + wide, width: wide, top: height - lift - tall, bottom: height - lift, height: tall };
}
/** The Journal, Land, Gonzales, Béxar, Follow, + and - buttons, bottom right: `#map-tools`, 14px in from both edges. */
const toolsBox = ({ width, height }, wide = 560) => ({ left: width - 14 - wide, right: width - 14, width: wide, top: height - 14 - 34, bottom: height - 14, height: 34 });
/** Each row's top and bottom in the column's content, two of the family on auto (the second and the last). */
function rowsOf(size) {
  const rows = [];
  let at = 0;
  for (let i = 0; i < size; i++) {
    const tall = i === 1 || i === size - 1 ? AUTO_ROW : ROW;
    rows.push({ top: at, bottom: at + tall - 5 });
    at += tall;
  }
  return { rows, content: at };
}

test('the column stops above the ability bar and inside the screen, for no bar, one row and two, and families of 4, 12 and 20', () => {
  for (const screen of SCREENS) for (const lift of Object.keys(LIFT)) for (const barRows of [0, 1, 2]) for (const icons of [4, 16, 26]) for (const size of [4, 12, 20]) {
    const at = `${screen.width}x${screen.height}, ${lift}, a bar of ${barRows} row(s) and ${icons} icons, a family of ${size}`;
    const bar = barBox(screen, barRows, LIFT[lift], icons), tools = toolsBox(screen);
    const room = columnRoom({ height: screen.height, column: COLUMN, bar, others: [tools] });
    const { content } = rowsOf(size);
    const bottom = Math.min(COLUMN.top + content, screen.height - room);
    if (bar) assert.ok(bottom <= bar.top - 8, `${at}: the column ends at ${bottom}px, under the bar whose top is at ${bar.top}px`);
    assert.ok(bottom <= screen.height - 12, `${at}: the column ends at ${bottom}px, off a ${screen.height}px screen`);
    // The Journal and Land buttons stand clear of the column's width at both sizes, so the column goes down past their top.
    assert.ok(tools.left > COLUMN.right, `${at}: the model's buttons stand across the column; the test no longer asks what it says`);
    // And at least three whole rows are always in view: a bounded column that shows nothing is no fix.
    assert.ok(bottom - COLUMN.top >= 3 * AUTO_ROW, `${at}: the column is ${bottom - COLUMN.top}px tall, too short to show three rows`);
  }
});

test('the column stops above the bottom buttons only where they stand across it, and never runs off the screen', () => {
  const screen = { width: 1024, height: 768 };
  // No bar and nothing across the column: 12px from the foot.
  assert.equal(columnRoom({ height: 768, column: COLUMN, bar: null, others: [toolsBox(screen)] }), 12);
  // Buttons that do reach across the column's width (a Host's list, a long Follow name): the column stops 8px above them.
  const wide = toolsBox(screen, 900);
  assert.equal(columnRoom({ height: 768, column: COLUMN, bar: null, others: [wide] }), 768 - (wide.top - 8));
  // A bar drawn anywhere across the screen is stopped above, even where it is not over the column (owner, 2026-09-21).
  const narrow = barBox({ width: 1366, height: 768 }, 1, 64);
  assert.ok(narrow.left > COLUMN.right);
  assert.equal(columnRoom({ height: 768, column: COLUMN, bar: narrow }), Math.ceil(768 - (narrow.top - 8)));
  // A hidden bar has no box (`display:none` measures 0x0), and is nothing to stop above.
  assert.equal(columnRoom({ height: 768, column: COLUMN, bar: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 } }), 12);
  // A bar taller than the screen leaves the column at its edge, never a negative room.
  assert.equal(columnRoom({ height: 100, column: COLUMN, bar: { left: 0, right: 900, top: -50, bottom: 90, width: 900, height: 140 } }), 158);
});

test('the main person is scrolled into view in the column, whoever they are and whatever the family\'s size', () => {
  for (const screen of SCREENS) for (const barRows of [0, 1, 2]) for (const size of [4, 12, 20]) {
    const bar = barBox(screen, barRows, LIFT.lesson);
    const room = columnRoom({ height: screen.height, column: COLUMN, bar, others: [toolsBox(screen)] });
    const { rows, content } = rowsOf(size);
    const view = Math.min(content, screen.height - room - COLUMN.top);
    for (const [label, index] of [['the father', 0], ['the middle child', Math.floor(size / 2)], ['the youngest', size - 1]]) {
      // From the top of the list, and from the bottom, as a student might have left it.
      for (const from of [0, Math.max(0, content - view)]) {
        const row = rows[index];
        const scrollTop = scrollToShow(row, { scrollTop: from, clientHeight: view });
        const at = `${screen.width}x${screen.height}, a bar of ${barRows}, a family of ${size}, ${label} scrolled from ${from}`;
        assert.ok(scrollTop >= 0 && scrollTop <= Math.max(0, content - view), `${at}: scrolled to ${scrollTop}, past the list's end`);
        assert.ok(row.top >= scrollTop && row.bottom <= scrollTop + view, `${at}: the row (${row.top}-${row.bottom}) is not inside the view (${scrollTop}-${scrollTop + view})`);
      }
    }
  }
  // Nearest, like `block: 'nearest'`: a row already in view does not move the list, one below brings its foot to the view's.
  assert.equal(scrollToShow({ top: 100, bottom: 150 }, { scrollTop: 80, clientHeight: 200 }), 80);
  assert.equal(scrollToShow({ top: 400, bottom: 450 }, { scrollTop: 0, clientHeight: 200 }), 250);
  assert.equal(scrollToShow({ top: 20, bottom: 70 }, { scrollTop: 300, clientHeight: 200 }), 20);
  // A row taller than the view shows its top.
  assert.equal(scrollToShow({ top: 500, bottom: 800 }, { scrollTop: 0, clientHeight: 200 }), 500);
});
