// The panel's painted marks (2026-10-26, the local pipeline's; public/painted-marks.js): the style sheet drew them as masks, so
// each one, once its sheet has come, is handed to it as a picture and named on the root, and public/style.css shows the picture
// for every name it is given. Here: every mark is in the library, every one has its rule, and the hand-over takes only what is
// ready and drawn, once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUE_MARKS, PAINTED_MARKS, paintMarks } from '../public/painted-marks.js';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');

test('every painted mark is in the library and the style sheet shows each by its name', () => {
  for (const name of PAINTED_MARKS) {
    assert.ok(atlas.frames[name], `${name} is not in the library`);
    const rule = new RegExp(`:root\\[data-painted-marks~="${name}"\\][^{]*\\{[^}]*var\\(--${name}\\)`);
    assert.match(css, rule, `public/style.css has no rule showing ${name}`);
  }
  for (const mark of Object.values(CUE_MARKS)) assert.ok(atlas.frames[mark], `the cue's ${mark} is not in the library`);
});

test('a mark is handed over once its sheet has come and it drew, and never twice', () => {
  const props = {}, root = { dataset: {}, style: { setProperty: (key, value) => { props[key] = value; } } };
  let drawnCount = 0;
  const make = () => ({ width: 0, height: 0, toDataURL: () => 'data:image/png;base64,AAAA' });
  const ready = new Set(['mark-hunger', 'mark-help']);
  const art = { spriteReady: name => ready.has(name), drawSprite: () => 1, spriteFrame: () => ({}) };
  let helpDraws = false;
  const drawMark = (canvas, name) => { drawnCount++; return name !== 'mark-help' || helpDraws; };
  let done = paintMarks(art, drawMark, { root, make });
  assert.deepEqual([...done], ['mark-hunger'], 'a mark that did not draw, or whose sheet has not come, was handed over');
  assert.equal(root.dataset.paintedMarks, 'mark-hunger');
  assert.equal(props['--mark-hunger'], 'url("data:image/png;base64,AAAA")');
  assert.ok(!('--mark-help' in props));
  helpDraws = true;
  const before = drawnCount;
  done = paintMarks(art, drawMark, { root, make });
  assert.deepEqual([...done].sort(), ['mark-help', 'mark-hunger']);
  assert.equal(drawnCount - before, 1, 'a mark already handed over was drawn again (only the help, undrawn before, is)');
});

test('the marks that did not read at their size stay drawn: the food sack keeps its colour by level, the shelter and the cues their pictures', () => {
  // Looked at in the game on 2026-10-26 at 18-20 CSS px: the painted food sack would hide the gauge's colour by level, and the shelter
  // roof and the cues' pot are too small inside their rims to read. Their paintings stay in the library, unused.
  for (const name of ['mark-food', 'mark-shelter-house', 'mark-shelter-tent', 'mark-cue-house', 'mark-cue-wash']) {
    assert.ok(!PAINTED_MARKS.includes(name), `${name} is handed to the style sheet`);
    assert.ok(!Object.values(CUE_MARKS).includes(name), `${name} is drawn as the cue`);
    assert.ok(!css.includes(`var(--${name})`), `public/style.css shows ${name}`);
  }
  assert.match(css, /\.food-icon\{[^}]*background:var\(--food-tone\)/, 'the food sack is no longer drawn in the gauge\'s colour');
});
