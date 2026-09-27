// The ferry at a crossing is Astra's plank flatboat (delivered 2026-09-21, public/landscape-art.js `drawFerry`), and the
// round-log raft only while that sheet has not arrived.
//
// Written 2026-09-26 because the guard it replaces had gone quiet: `scripts/art-wiring-injections.mjs` put the raft back in
// `drawFerry` and required tests/art-library.test.mjs to notice, which it did only while `drawFerry` was the one place that
// named the flatboat. The Gonzales town scenes (public/town-scenes.js) name it too since 2026-09-25, so the library test
// counted the sheet as drawn whatever the crossing drew, and the injection was missed. This reads the crossing's own drawer.
// ceiling: it reads the source, because public/landscape-art.js imports the browser's `/art.js` and cannot be loaded here;
// a recording canvas for the landscape drawers is the way out if more than which sprite is asked for ever needs holding.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/landscape-art.js', import.meta.url), 'utf8');
const body = name => {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `public/landscape-art.js has no ${name}`);
  const next = source.indexOf('\nexport function ', start + 1);
  return source.slice(start, next < 0 ? source.length : next);
};

test('the ferry at a crossing is the plank flatboat, and the log raft only if the flatboat cannot be drawn', () => {
  const ferry = body('drawFerry');
  const boat = ferry.indexOf("'ferry-flatboat'"), raft = ferry.indexOf("'ferry-raft'");
  assert.ok(boat >= 0, 'the crossing draws no flatboat');
  // The raft is the fallback: asked for only when drawing the flatboat has failed, on the same line.
  assert.ok(raft < 0 || (raft > boat && /if\s*\(\s*!\s*drawSprite\(\s*ctx\s*,\s*'ferry-flatboat'/.test(ferry)), 'the raft is drawn in the flatboat\'s place, not as its fallback');
});
