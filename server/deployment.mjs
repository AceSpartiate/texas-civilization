import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

export const appRoot = () => resolve(dirname(fileURLToPath(import.meta.url)), '..');

function writableDir(path) {
  const probe = join(path, `.write-probe-${randomBytes(6).toString('hex')}`);
  try { mkdirSync(path, { recursive: true }); writeFileSync(probe, ''); unlinkSync(probe); return true; }
  catch { return false; }
}

// A distributable install directory may be read-only, so the class data cannot
// live beside the program unconditionally. Development keeps the repository
// folder whenever it is writable, so existing saves and evidence do not move.
export function resolveDataDir({ env = process.env, root = appRoot() } = {}) {
  if (env.TEXAS_DATA_DIR) {
    const requested = resolve(env.TEXAS_DATA_DIR);
    if (!writableDir(requested)) throw new Error(`TEXAS_DATA_DIR is not writable: ${requested}`);
    return { dir: requested, origin: 'environment' };
  }
  const beside = join(root, 'data');
  if (writableDir(beside)) return { dir: beside, origin: 'application' };
  const base = env.LOCALAPPDATA || env.XDG_DATA_HOME || join(env.HOME || env.USERPROFILE || root, '.local', 'share');
  const fallback = join(resolve(base), 'TexasRevolution', 'data');
  if (!writableDir(fallback)) throw new Error(`No writable class data folder. Tried ${beside} and ${fallback}.`);
  return { dir: fallback, origin: 'user-profile' };
}

// SAVE_PATH stays an absolute developer override; it does not move the rest of the data folder.
export const resolveSavePath = (dataDir, env = process.env) => env.SAVE_PATH ? resolve(env.SAVE_PATH) : join(dataDir, 'classroom.json');

/**
 * Where Solo Mode keeps its class, and which port it answers on.
 *
 * A folder of its own inside the class data folder, so a playtest has its own save, save
 * lock, Host key file and launcher record and can run beside a real class without either
 * touching the other. The port is its own for the same reason: of the two choices, leaving a
 * running class alone is less disruptive than asking a teacher to stop it first.
 *
 * `SAVE_PATH` and `PORT` are deliberately not read. Both are overrides for the real class,
 * and a solo game honouring them would be a solo game written over a teacher's save.
 */
export const SOLO_PORT = 1836;
export function soloPaths({ env = process.env, root = appRoot() } = {}) {
  const dir = join(resolveDataDir({ env, root }).dir, 'solo');
  if (!writableDir(dir)) throw new Error(`The Play Solo folder is not writable: ${dir}`);
  const port = Number(env.SOLO_PORT || SOLO_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SOLO_PORT must be a port number.');
  return { dir, savePath: join(dir, 'classroom.json'), port };
}

// Interface enumeration only ranks candidates. It cannot establish that another
// device can reach any of them; that is the physical-device deployment check.
export function joinCandidates(port) {
  const secondary = /vpn|nord|virtual|vethernet|wsl|hyper-v|loopback|bluetooth|tailscale|zerotier|docker/i;
  return Object.entries(networkInterfaces())
    .flatMap(([label, entries]) => (entries || []).filter(e => e.family === 'IPv4' && !e.internal).map(e => ({ label, address: e.address })))
    .sort((a, b) => Number(secondary.test(a.label)) - Number(secondary.test(b.label)))
    .map(candidate => ({ label: candidate.label, address: candidate.address, url: `http://${candidate.address}:${port}/` }));
}
