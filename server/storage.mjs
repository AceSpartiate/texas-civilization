import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, openSync, fsyncSync, closeSync, unlinkSync, realpathSync } from 'node:fs';
import { STARTING_POWDER } from '../sim/world.mjs';
import { widenPassages } from '../sim/houseplot.mjs';
import { deriveUses } from '../sim/chores.mjs';
import { dirname, basename, join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { openSouth } from '../sim/south.mjs';

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
  }
  if (save.world?.households && save.world.entities) deriveUses(save.world);
  // A class on the real land saved before the map went south to the Nueces (2026-09-25, docs/MAP_ACCURACY.md §13) gains San
  // Patricio, the Agua Dulce ground and the roads to them from the built map - added, nothing it had moved - so its Matamoros men
  // are where the record puts them and fight where the fights were (sim/south.mjs `openSouth`). No version moved: the places
  // are added, every existing place, road and home is what it was, and a class that already has them is untouched.
  if (save.world) openSouth(save.world);
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

// `save` is the class, or its save text already written out: the classroom serialises each commit once and both keeps that
// text (what a failed change goes back to) and writes it here (server/app.mjs `commit`).
export function writeSave(path, save) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, typeof save === 'string' ? save : JSON.stringify(save));
  const fd = openSync(temp, 'r+');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, path);
}
