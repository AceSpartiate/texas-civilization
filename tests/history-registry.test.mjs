// Every claim and fiction ID in HISTORY.md is registered once. Two branches built on the same day each took the next free
// block of HIST-TEX numbers (the surprise at Béxar and the children both registered HIST-TEX-610 to -616, 2026-09-27), and
// nothing noticed: a code comment citing `HIST-TEX-613` then meant two different claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const history = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');

/**
 * A registry row is a table row whose first cell is only the ID in bold: `| **HIST-TEX-053** | ...`. A row that adds to an
 * earlier entry carries more than the ID in that cell (`| **FIC-GONZ-025 (Survey, as built 2026-09-14)** |`) and is not a
 * second registration.
 */
function registeredIds(text) {
  return [...text.matchAll(/^\| \*\*([A-Z]+-[A-Z]+-\d+)\*\* \|/gm)].map(match => match[1]);
}

test('no claim or fiction ID is registered twice in HISTORY.md', () => {
  const ids = registeredIds(history);
  assert.ok(ids.length > 500, `only ${ids.length} registry rows were read; the row format may have changed`);
  const seen = new Map();
  for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
  const twice = [...seen].filter(([, count]) => count > 1).map(([id, count]) => `${id} ×${count}`);
  assert.deepEqual(twice, [], `registered more than once: ${twice.join(', ')}`);
});

test('the registry check reads a second registration as one, and an amendment row as none', () => {
  const rows = ['| **HIST-TEX-610** | a |', '| **HIST-TEX-610** | b |', '| **FIC-GONZ-025 (Survey, as built 2026-09-14)** | c |'].join('\n');
  assert.deepEqual(registeredIds(rows), ['HIST-TEX-610', 'HIST-TEX-610']);
});
