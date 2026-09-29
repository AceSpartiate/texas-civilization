// Every module the page imports is one the server serves. The server hands out public/ files from a fixed list (server/app.mjs
// `files`), so a new module imported by a served one and not added there is a 404 in the browser: the importing module fails,
// and with it the whole page - the join form never shows (found 2026-09-29, when public/art-subjects.js was new). Node's own
// tests import the files from disk and never notice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';

test('every relative import of every module the page loads is served', async () => {
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1'), base = `http://127.0.0.1:${port}`;
  try {
    const seen = new Set(), missing = [];
    const queue = ['/app.js', '/art-catalog.js', '/alamo-workshop.js'];
    while (queue.length) {
      const path = queue.shift();
      if (seen.has(path)) continue;
      seen.add(path);
      const response = await fetch(base + path);
      if (!response.ok) { missing.push(`${path} (${response.status})`); continue; }
      const text = await response.text();
      for (const [, spec] of text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+\.m?js)['"]/g)) {
        if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
        queue.push(new URL(spec, base + path).pathname);
      }
      for (const [, spec] of text.matchAll(/import\(\s*['"]([./][^'"]+\.m?js)['"]\s*\)/g)) queue.push(new URL(spec, base + path).pathname);
    }
    assert.ok(seen.size > 40, `only ${seen.size} modules were walked from the page`);
    assert.deepEqual(missing, [], 'imported by a served module, but not in server/app.mjs `files`');
  } finally { await app.close(); }
});
