// The page's start-up draws the first snapshot from inside the module's top level (`connect(await api('/api/state'))` in
// public/app.js) for every page that opens already signed in: the Host page, and a student who reloads. Anything the draw
// reaches that is declared *below* that line is still in its temporal dead zone, and the draw throws a ReferenceError.
// The start-up's own try/catch then reads the throw as "not signed in", so nothing is reported: the Host's page is drawn
// once and never updated again, and a reloading student is sent back to the join form. It happened on 2026-09-22 with
// `let housePlacement`, and only the Alamo siege proof - the one gate that opens a Host page that way and then presses one
// of its buttons - noticed. This holds the rule for the whole file rather than for that one name.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('nothing at the top level of the page is declared after the start-up that draws the first snapshot', () => {
  const lines = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').split(/\r?\n/);
  const startup = lines.findIndex(line => /^\s*connect\(await api\('\/api\/state'\)\);/.test(line));
  assert.ok(startup > 0, 'the start-up line was not found, so this test checks nothing');
  const late = lines.slice(startup + 1).map((line, i) => [startup + 2 + i, line]).filter(([, line]) => /^(let|const|class) /.test(line));
  assert.deepEqual(late.map(([at, line]) => `${at}: ${line.trim()}`), [], 'declared after the start-up draws, so a page that opens signed in throws before it can connect');
});
