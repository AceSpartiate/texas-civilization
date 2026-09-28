// A save Windows refuses for a moment (owner, 2026-09-27, by multiple choice: "Retry briefly"; docs/DEPLOYMENT.md §Solo Mode,
// *Closing the game*). Windows refuses to write or rename over a file another program holds open for a moment - an antivirus
// scanning it, a backup copying it - with EPERM, EBUSY or EACCES. Until then the first refusal was the class's `SAVE_FAILED`:
// paused, put back to its last save. Now every class's save (server/storage.mjs `writeSave`) tries again for about a third of
// a second before it calls it a failure, and a file held for longer than that fails as before.
//
// The refusals are made here by standing in for node:fs's own `renameSync` and `writeFileSync` (and `syncBuiltinESMExports`,
// so the storage module's named imports see the stand-in), because nothing in Node itself holds a file the way those programs do.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAVE_RETRY_MS, writeSave } from '../server/storage.mjs';

const refusal = code => Object.assign(new Error(`${code}: resource busy or locked`), { code });
/** Runs `fn` with node:fs's `name` refusing with `code` for the first `forMs` milliseconds of the call, and says how often. */
function held(name, code, forMs, fn) {
  const real = fs[name];
  let refused = 0, started = null;
  fs[name] = (...args) => {
    // Inside `fn` only writeSave calls it: the temp file's write, or the rename onto the save.
    started ??= Date.now();
    if (Date.now() - started < forMs) { refused++; throw refusal(code); }
    return real(...args);
  };
  syncBuiltinESMExports();
  try { return { result: fn(), refused }; }
  catch (error) { return { error, refused }; }
  finally { fs[name] = real; syncBuiltinESMExports(); }
}

test('a save Windows refuses for a moment is tried again for about a third of a second, and then written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'save-retry-'));
  try {
    const path = join(dir, 'classroom.json');
    writeSave(path, { saveVersion: 3, n: 1 });
    assert.ok(SAVE_RETRY_MS >= 250 && SAVE_RETRY_MS <= 500, `the retry lasts ${SAVE_RETRY_MS} ms, not about a third of a second`);
    // The rename onto the save refused (EPERM: what the solo builder saw when another program read the save), then let through.
    const renamed = held('renameSync', 'EPERM', 120, () => writeSave(path, { saveVersion: 3, n: 2 }));
    assert.equal(renamed.error, undefined, `the save failed at the first refusal: ${renamed.error?.message}`);
    assert.ok(renamed.refused >= 2, `refused only ${renamed.refused} times: the retry was never exercised`);
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).n, 2, 'the save was not written after the refusal passed');
    // The write refused (EBUSY), then let through.
    const written = held('writeFileSync', 'EBUSY', 120, () => writeSave(path, { saveVersion: 3, n: 3 }));
    assert.equal(written.error, undefined, `the save failed at the first refusal: ${written.error?.message}`);
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).n, 3);
    // Held for longer than the retry: a failure, as before, soon after the third of a second, and the save left as it was.
    const began = Date.now();
    const kept = held('renameSync', 'EPERM', 5000, () => writeSave(path, { saveVersion: 3, n: 4 }));
    const took = Date.now() - began;
    assert.equal(kept.error?.code, 'EPERM', 'a file held for seconds did not fail');
    assert.ok(took >= SAVE_RETRY_MS - 20 && took < SAVE_RETRY_MS + 400, `gave up after ${took} ms`);
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).n, 3, 'a failed save changed the save');
    // Any other error is not retried: a missing folder or a full disk is not a program holding the file.
    const other = Date.now();
    const full = held('renameSync', 'ENOSPC', 5000, () => writeSave(path, { saveVersion: 3, n: 5 }));
    assert.equal(full.error?.code, 'ENOSPC');
    assert.equal(full.refused, 1, 'an error that is not a held file was tried again');
    assert.ok(Date.now() - other < 200);
    assert.ok(existsSync(path));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
