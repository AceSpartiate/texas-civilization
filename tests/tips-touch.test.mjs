// Two decisions of the owner, 2026-09-29 (docs/audits/2026-09-29-triage.md): D16 "Tips button" - the first-meeting tips a
// student has already seen, listed to read again, gating nothing (public/tips.js `tipsToReread`, docs/LESSON.md §9) - and D17
// "Tap, then send" - on a touch screen the first tap on an icon of the bar shows its cost, any warning and Send, and the second
// tap or Send sends; a mouse and the keyboard as before (public/family-panel.js `iconPress`, docs/FAMILY_PANEL.md).
// The page's own wiring is proved in a browser by `npm run test:tips` and `npm run test:family-panel`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TIPS, tipsToReread, NOT_REREAD } from '../public/tips.js';
import { TIP_IDS } from '../sim/tips.mjs';
import { iconPress } from '../public/family-panel.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the Tips list holds every tip put away, latest first, in its words, and never the suspended guided start', () => {
  assert.deepEqual(tipsToReread([]), []);
  assert.deepEqual(tipsToReread(['order', 'star', 'house']).map(tip => tip.id), ['house', 'star', 'order'], 'not the latest first');
  assert.deepEqual(tipsToReread(['order']), [{ id: 'order', words: TIPS.order }]);
  // Once each, however the page and the server both hold it.
  assert.deepEqual(tipsToReread(['order', 'star', 'order']).map(tip => tip.id), ['star', 'order']);
  // "Resume tutorial" is gone with the guided start (owner, 2026-09-28): a list that named it would send a student looking for it.
  assert.deepEqual(NOT_REREAD, ['resume']);
  assert.deepEqual(tipsToReread(['order', 'resume', 'star']).map(tip => tip.id), ['star', 'order'], 'the guided start\'s tip is offered again');
  assert.ok(tipsToReread(TIP_IDS).every(tip => !/tutorial/i.test(tip.words)), 'a tip in the list sends the student to the tutorial');
  // A word nobody wrote is not a tip.
  assert.deepEqual(tipsToReread(['toString', 'nonsense', 'call']).map(tip => tip.id), ['call']);
  assert.equal(tipsToReread(TIP_IDS).length, TIP_IDS.length - 1);
});

test('the Tips list gates nothing: its only control closes it, it sends nothing, and it is never the Host\'s', () => {
  const html = read('public/index.html');
  const list = html.match(/<section id="tips-list"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(list, 'the page has no tips list');
  assert.deepEqual([...list.matchAll(/<button[^>]*id="([^"]+)"/g)].map(match => match[1]), ['tips-list-close'], 'the tips list has a control besides its close');
  assert.match(html, /<button id="tips-toggle"[^>]*hidden/, 'the Tips button shows before any tip has been seen');
  const app = read('public/app.js');
  const block = app.slice(app.indexOf('let tipsListKey'), app.indexOf("// The sound's button opening its sliders folds the list away"));
  assert.ok(block.length > 200, 'the tips list\'s code was not found');
  assert.doesNotMatch(block, /\bapi\(|seen-tip|lesson|resume/i, 'reading the tips list sends something or reaches the guided start');
  assert.match(block, /world\.role !== 'host'/, 'the Host is given the Tips button');
  assert.match(block, /tipsToReread\(/);
  assert.match(block, /setText\(item, tip\.words\)/, 'a tip\'s words are not written through setText');
});

test('on a touch screen the first tap on an icon shows its cost and Send, and only the second tap or Send sends', () => {
  // A tap on an open icon: armed, nothing sent.
  assert.equal(iconPress({ touch: true }), 'arm');
  // The second tap on the same icon, or its Send (a press on the armed icon), sends.
  assert.equal(iconPress({ touch: true, armed: true }), 'send');
  // A mouse or the keyboard sends at once, as before (hover and focus already showed the popup).
  assert.equal(iconPress({ touch: false }), 'send');
  assert.equal(iconPress({}), 'send');
  // Refused: only ever explained, by any hand.
  for (const touch of [true, false]) for (const armed of [true, false]) assert.equal(iconPress({ touch, armed, refused: true }), 'explain');
  // An icon whose own chooser asks before anything is sent is not armed first: the chooser is the second step.
  assert.equal(iconPress({ touch: true, opensChooser: true }), 'send');
});

test('the page asks iconPress for every press on an icon, a tap is told by its pointer, and Send presses the armed icon', () => {
  const app = read('public/app.js');
  const handler = app.slice(app.indexOf("const panelButton = event.target.closest('.panel-icon');"), app.indexOf("if (event.target.closest('#selection-close'))"));
  assert.match(handler, /const step = iconPress\(\{\s*touch: touchPress\(event\)/, 'the press does not ask iconPress whether it was a tap');
  assert.match(handler, /if \(step === 'arm'\) \{ showPanelTip\(panelButton, \{ armed: true \}\)[^}]*return; \}/, 'a first tap goes on and sends');
  // A keyboard press has no pointer and is never a tap; a tap is told by its pointer, or the one that last went down.
  assert.match(app, /if \(!event \|\| event\.detail === 0\) return false;/);
  assert.match(app, /matchMedia\('\(pointer: coarse\)'\)/);
  // The armed popup stays when the finger lifts: a touch's pointerout does not put it away.
  assert.match(app, /!icon\.contains\(event\.relatedTarget\) && !panelTipFor\?\.armed\) hidePanelTip\(\)/);
  assert.match(read('public/index.html'), /<p id="panel-tip"[^>]*>[\s\S]*<button type="button" id="panel-tip-send" hidden>Send<\/button><\/p>/);
});
