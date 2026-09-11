import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, openSync, fsyncSync, closeSync, unlinkSync, realpathSync } from 'node:fs';
import { dirname, basename, join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

// A save has one server owner for its entire lifetime, independently of HTTP port.
// Refuse ambiguous/stale ownership rather than race another process to reclaim it.
export function acquireSaveLock(path) {
  if (!path) return { path, release() {} };
  const requested = resolve(path);
  mkdirSync(dirname(requested), { recursive: true });
  const canonical = existsSync(requested) ? realpathSync(requested) : join(realpathSync(dirname(requested)), basename(requested));
  const lockPath = `${canonical}.lock`;
  const owner = { version: 1, processId: process.pid, token: randomBytes(24).toString('hex'), createdAt: new Date().toISOString() };
  let fd;
  try { fd = openSync(lockPath, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let existing;
    try { existing = JSON.parse(readFileSync(lockPath, 'utf8')); } catch {}
    let stale = false;
    if (Number.isSafeInteger(existing?.processId) && existing.processId > 0) {
      try { process.kill(existing.processId, 0); } catch (probe) { stale = probe.code === 'ESRCH'; }
    }
    const detail = stale
      ? `Stale save lock: process ${existing.processId} is no longer running. After verifying every classroom server using this save is stopped, remove only ${lockPath} and launch again.`
      : `Save already owned, or ownership cannot be verified: ${lockPath}. Close the owning classroom server before using this save again.`;
    throw new Error(detail, { cause: error });
  }
  try { writeFileSync(fd, JSON.stringify(owner)); fsyncSync(fd); }
  catch (error) { closeSync(fd); unlinkSync(lockPath); throw error; }
  closeSync(fd);
  let released = false;
  return {
    path: canonical,
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

export function writeSave(path, save) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, JSON.stringify(save));
  const fd = openSync(temp, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, path);
}
