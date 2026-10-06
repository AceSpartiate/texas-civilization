import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, openSync, fsyncSync, closeSync, unlinkSync, realpathSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { uptime } from 'node:os';
import { STARTING_POWDER } from '../sim/world.mjs';
import { widenPassages } from '../sim/houseplot.mjs';
import { deriveUses } from '../sim/chores.mjs';
import { foldLyingLogs } from '../sim/felling.mjs';
import { settleStartingPlots } from '../sim/starting-plot.mjs';
import { dirname, basename, join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { openSouth } from '../sim/south.mjs';
import { openAdvancePlaces } from '../sim/advance-places.mjs';

/**
 * When process `pid` began, in milliseconds since 1970: a number; `undefined` when there is no such process; null when it
 * cannot be told. Asked only when a save lock names a process that is still running (`ownerGone`), never on a normal start.
 *
 * Windows asks WMI through PowerShell (about a second, once); Linux reads /proc. Anything else, or any failure, is null -
 * "cannot be told" - and the lock is then left alone, as it always was.
 */
export function processStartedAt(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return null;
  try {
    if (process.platform === 'win32') {
      const text = execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
        `$p = Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if ($p) { ([DateTimeOffset]$p.CreationDate).ToUnixTimeMilliseconds() } else { 'none' }`],
      { encoding: 'utf8', timeout: 20000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (text === 'none') return undefined;
      return /^\d{10,}$/.test(text) ? Number(text) : null;
    }
    if (process.platform === 'linux') {
      if (!existsSync(`/proc/${pid}`)) return undefined;
      // Field 22 of /proc/<pid>/stat is the start in clock ticks after boot; the name (field 2) may hold spaces, so count
      // from its closing bracket. ceiling: assumes the usual 100 ticks a second.
      const fields = readFileSync(`/proc/${pid}/stat`, 'utf8').split(')').at(-1).trim().split(' ');
      const bootAt = Date.now() - uptime() * 1000;
      return bootAt + Number(fields[19]) * 10;
    }
  } catch { /* cannot be told */ }
  return null;
}
/** A process that began this long after its lock was written did not write it (clock resolution and WMI's rounding). */
const START_SLACK_MS = 2000;
/**
 * Whether the server that wrote this lock has certainly gone (2026-09-28, docs/audits/2026-09-28-classroom.md B5): its
 * process has ended, or a process now carries its number that began after the lock was written - so it is not the one that
 * wrote it, which is what a Windows restart or a long day of other programs does to a number. Anything less certain is not
 * gone: a malformed lock, a process that began before the lock, a start time that cannot be read.
 */
export function ownerGone(existing, { startedAt = processStartedAt } = {}) {
  const pid = existing?.processId;
  if (!Number.isSafeInteger(pid) || pid <= 0 || typeof existing.token !== 'string') return null;
  try { process.kill(pid, 0); } catch (probe) { if (probe.code === 'ESRCH') return `process ${pid} has ended`; }
  const written = Date.parse(existing.createdAt);
  if (!Number.isFinite(written)) return null;
  const started = startedAt(pid);
  if (started === undefined) return `process ${pid} has ended`;
  if (Number.isFinite(started) && started > written + START_SLACK_MS) return `process ${pid} began after the lock was written, so it is another program`;
  return null;
}

// A save has one server owner for its entire lifetime, independently of HTTP port.
//
// **A lock whose owner has certainly gone is taken over (2026-09-28).** Until then every leftover lock refused to start,
// and the only way on was a developer following docs/RECOVERY.md - so a laptop shut with the class up, a Windows Update
// restart overnight or an End Task left the next day's class unable to open. Now, when `ownerGone` is certain, the save is
// backed up into `archive/`, and the old lock is removed only by the start holding the recovery latch (`<lock>.recover`,
// made with `wx`, so of any number of starts racing to recover exactly one holds it), and only while the lock's words are
// still the very ones judged gone; the new lock is then made with `wx` as any start makes it. A start that finds the latch
// held refuses, as does one that finds the lock changed under it. Every doubt still refuses, as before.
// (Amended 2026-09-28: the first version moved the lock aside by rename and put back a lock it moved by mistake; with three
// or more starts racing, one could make a new lock in the instant another's was aside, and two starts both owned the class.
// tests/stale-lock.test.mjs races six.)
// ceiling: a start killed while holding the latch leaves it behind; a latch older than `LATCH_STALE_MS` is taken as that
// leftover and cleared. Two starts both clearing one leftover latch in the same instant, a minute after a third died holding
// it, is the case left open.
/** How old a recovery latch must be before it is taken as left behind by a start that died holding it. Recovery takes milliseconds. */
const LATCH_STALE_MS = 60_000;

export function acquireSaveLock(path, { startedAt = processStartedAt, judged = null } = {}) {
  if (!path) return { path, release() {} };
  const requested = resolve(path);
  mkdirSync(dirname(requested), { recursive: true });
  const canonical = existsSync(requested) ? realpathSync(requested) : join(realpathSync(dirname(requested)), basename(requested));
  const lockPath = `${canonical}.lock`;
  const owner = { version: 1, processId: process.pid, token: randomBytes(24).toString('hex'), createdAt: new Date().toISOString() };
  let fd, recovered = null;
  for (let attempt = 0; fd === undefined; attempt++) {
    try { fd = openSync(lockPath, 'wx'); break; }
    catch (error) {
      if (error.code !== 'EEXIST' || attempt >= 2) throw error;
      let text = null, existing;
      try { text = readFileSync(lockPath, 'utf8'); existing = JSON.parse(text); } catch (read) { if (read.code === 'ENOENT') continue; }
      const gone = existing && ownerGone(existing, { startedAt });
      if (!gone) {
        throw new Error(`Save already owned, or ownership cannot be verified: ${lockPath}. Another classroom server may still be using this class. Close it, or restart the computer, and start again: a class whose server has certainly gone opens by itself.`, { cause: error });
      }
      // Only a test uses this: another start doing its whole recovery in the instant between this judgement and the latch.
      judged?.();
      const latchPath = `${lockPath}.recover`;
      let latch;
      try { latch = openSync(latchPath, 'wx'); }
      catch (taken) {
        if (taken.code !== 'EEXIST') throw taken;
        let age = 0;
        try { age = Date.now() - statSync(latchPath).mtimeMs; } catch { /* released as it was looked at */ }
        if (age > LATCH_STALE_MS) { try { unlinkSync(latchPath); } catch { /* another start cleared it */ } continue; }
        throw new Error(`Save ownership is being recovered by another start: ${lockPath}. Another classroom server is starting on this class.`, { cause: error });
      }
      try {
        let now = null;
        try { now = readFileSync(lockPath, 'utf8'); } catch (read) { if (read.code !== 'ENOENT') throw read; }
        if (now !== null && now !== text) {
          throw new Error(`Save ownership changed while it was being recovered: ${lockPath}. Another classroom server is starting on this class.`, { cause: error });
        }
        const backup = archiveSave(canonical, 'before-lock-recovery');
        if (now !== null) unlinkSync(lockPath);
        fd = openSync(lockPath, 'wx');
        recovered = { reason: gone, processId: existing.processId, backup };
      } finally { closeSync(latch); unlinkSync(latchPath); }
    }
  }
  try { writeFileSync(fd, JSON.stringify(owner)); fsyncSync(fd); }
  catch (error) { closeSync(fd); unlinkSync(lockPath); throw error; }
  closeSync(fd);
  let released = false;
  return {
    path: canonical,
    recovered,
    release() {
      if (released) return;
      const current = JSON.parse(readFileSync(lockPath, 'utf8'));
      if (current.token !== owner.token || current.processId !== owner.processId) throw new Error('Save lock ownership changed; refusing to remove another owner\'s lock.');
      unlinkSync(lockPath); released = true;
    },
  };
}

export function readSave(path) {
  if (!path || !existsSync(path)) return null;
  const save = JSON.parse(readFileSync(path, 'utf8'));
  if (save.saveVersion !== 3) throw new Error(`Unsupported save version ${save.saveVersion}; refusing to reset the class. This class was made by an older build.`);
  // A class saved before a shot cost anything has no powder on its households, and the
  // empty value that keeps what was true of them is not "none": those families could
  // hunt. Filled once here rather than defaulted at every reader, because one absent
  // number must not mean three in the house to a chore and nothing at all to a trade -
  // and this is the single door every save comes through. No version moved: the field is
  // added, nothing is reinterpreted, and a save written back is simply complete.
  for (const household of Object.values(save.world?.households || {})) {
    if (household?.resources && household.resources.powder === undefined) household.resources.powder = STARTING_POWDER;
    // A dog-run planned or raised while its passage was one eight-foot cell is laid out with the passage twelve feet wide
    // (2026-09-24, `HIST-GONZ-025`; sim/houseplot.mjs `widenPassages`): its east pen and chimney half a cell further east,
    // every piece at the stage it had reached. Here and not at every reader for the same reason as the powder: this is the
    // one door, and a plot with a passage one cell wide is no longer a plot. No version moved: no field is added and no
    // field is read another way; the one layout the new width refuses is laid out again before anything reads it, and the
    // class opens with the house it had, at the width a passage has now.
    for (const house of [household?.house, ...(Array.isArray(household?.completedHouses) ? household.completedHouses : [])]) widenPassages(house);
  }
  // Somebody in the middle of the old walk to the shops - asked in town which shop, then what at its counter - goes on with
  // it exactly as it was (2026-09-24, docs/TOWNS.md §4b): the errand is chosen before anybody leaves now and is still called
  // `visit-shop`, so the old walk's steps are kept under `visit-shop-street`, offered to nobody. And every piece of work in
  // hand is given what it holds (sim/keeping.mjs, sim/chores.mjs `deriveUses`): the rifle for a hunt, the ox for a load
  // behind it, the beasts of a road still to come. No version moved: an old save gains a name and a list it did not have,
  // and reads nothing another way.
  for (const entity of Object.values(save.world?.entities || {})) {
    if (entity?.chore?.id === 'visit-shop' && entity.chore.errand === undefined) entity.chore.id = 'visit-shop-street';
    // Hauling logs is part of felling since 2026-09-28 (owner: "That should be consolidated and an automatic part of felling
    // trees"): somebody on auto who remembered hauling as their task remembers felling, the work it became.
    if (entity?.order?.chore === 'haul-logs') { entity.order = { chore: 'fell-trees', mode: entity.order.mode }; }
  }
  // And logs lying where their trees fell, waiting to be hauled, go onto their family's one pile (sim/felling.mjs
  // `foldLyingLogs`, docs/WOODS_AND_BUILDING.md §6.7). No version moved: the pile is the field those classes already had, and a
  // log lying out and a log on the pile are the same log to every work that uses it now.
  if (save.world?.households) foldLyingLogs(save.world);
  // The first ten acres of a family that cannot be worked where they lie - off the land, over the yard, in a river - and that nobody
  // has worked are laid again round the house, and no tree stands in cleared ground (owner, 2026-10-05; sim/starting-plot.mjs
  // `settleStartingPlots`, docs/LAND_GRANTS.md §5.4). No version moved: ten acres sown, fenced or being worked stay where they are.
  if (save.world?.households) settleStartingPlots(save.world);
  if (save.world?.households && save.world.entities) deriveUses(save.world);
  // A class on the real land saved before the map went south to the Nueces (2026-09-25, docs/MAP_ACCURACY.md §13) gains San
  // Patricio, the Agua Dulce ground and the roads to them from the built map - added, nothing it had moved - so its Matamoros men
  // are where the record puts them and fight where the fights were (sim/south.mjs `openSouth`). No version moved: the places
  // are added, every existing place, road and home is what it was, and a class that already has them is untouched but for the
  // Agua Dulce ground, moved to the Handbook's twenty-six miles (owner, 2026-09-26) while Grant's drive has not begun.
  if (save.world) openSouth(save.world);
  // And, saved before 2026-09-26, the Mexican advance's places - Thompson's and its ferry, the Old Fort, Stafford's, New
  // Washington, Mrs. Powell's - and the roads the columns went by (sim/advance-places.mjs `openAdvancePlaces`, docs/SCRAPE.md
  // §10 (c)). No version moved: added, nothing it had moved.
  if (save.world) openAdvancePlaces(save.world);
  return save;
}
// Keep the previous class before a deliberate reset. This is an explicit teacher
// action, not a rotating backup of every checkpoint.
export function archiveSave(path, label) {
  if (!path || !existsSync(path)) return null;
  const folder = join(dirname(path), 'archive');
  mkdirSync(folder, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeLabel = String(label || 'class').replace(/[^\w-]/g, '').slice(0, 40) || 'class';
  const target = join(folder, `${basename(path, '.json')}-${safeLabel}-${stamp}.json`);
  writeFileSync(target, readFileSync(path));
  const fd = openSync(target, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  return target;
}

/**
 * How long a save Windows refuses is tried again before it is a failure (owner, 2026-09-27, by multiple choice: "Retry
 * briefly"; docs/DEPLOYMENT.md §Solo Mode, *Closing the game*). Another program holding the file for a moment - an antivirus
 * scanning it, a backup copying it, anything reading it - makes Windows refuse the write or the rename with one of `HELD`.
 * Until then the first refusal paused the class (`SAVE_FAILED`, server/app.mjs `flush`). Longer than this is a failure, as
 * before; the class waits at most this long, once, on a save that will fail anyway.
 */
export const SAVE_RETRY_MS = 333;
const HELD = new Set(['EPERM', 'EBUSY', 'EACCES']);
const pause = new Int32Array(new SharedArrayBuffer(4));
/** `step`, tried again while Windows says the file is held, for up to `SAVE_RETRY_MS`: 10 ms, then 20, 40, 80, ... */
function whileHeld(step) {
  const until = Date.now() + SAVE_RETRY_MS;
  for (let wait = 10; ; wait *= 2) {
    try { return step(); }
    catch (error) {
      const left = until - Date.now();
      if (!HELD.has(error?.code) || left <= 0) throw error;
      Atomics.wait(pause, 0, 0, Math.min(wait, left));
    }
  }
}
// `save` is the class, or its save text already written out: the classroom serialises each commit once and both keeps that
// text (what a failed change goes back to) and writes it here (server/app.mjs `commit`).
export function writeSave(path, save) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  const text = typeof save === 'string' ? save : JSON.stringify(save);
  whileHeld(() => writeFileSync(temp, text));
  const fd = openSync(temp, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  whileHeld(() => renameSync(temp, path));
}
