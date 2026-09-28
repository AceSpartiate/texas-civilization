// The flashback videos on the Host's computer (docs/FLASHBACK.md §5; owner, 2026-09-28: "recorded and saved on the host
// computer and played back for the student").
//
// The Host's page makes each family's video (public/flashback.js) and sends it here; this keeps it in the class's own data
// folder - `flashbacks/<session>/<household>.webm` beside the save, one folder a class, so a new class never overwrites the
// last one's - and serves it back: to the Host, any family's; to a student, their own family's and nobody else's. Nothing
// here is part of the world: the save never holds a video, and a class reopened finds its videos on the disk.
//
// What is refused, and why:
// - anything before the class has ended for good (sim/flashback.mjs `flashbackReady`);
// - a file over `FLASHBACK_LIMITS.maxBytes`, one that is not WebM with a video track (server/webm.mjs), or one whose length is
//   not about a minute (`minMs`..`maxMs`);
// - a video of a family the class does not have, or of another family than a student's own. Only the Host makes them; a Play
//   Solo player's page makes its own, because on Play Solo the player's computer is the Host's (owner's "on the host computer").
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { readWebmFacts } from './webm.mjs';
import { flashbackReady, flashbackScripts, SCRIPT_VERSION } from '../sim/flashback.mjs';

export const FLASHBACK_LIMITS = Object.freeze({ maxBytes: 40 * 1024 * 1024, minMs: 20000, maxMs: 120000 });
const HOUSEHOLD = /^hh-\d{1,3}$/;
const SESSION = /^[\w-]{4,64}$/;

/** The class's store of videos under `dir` (null: this server keeps none, and says so). */
export function createFlashbackStore(dir) {
  const facts = new Map();
  const folder = sessionId => {
    if (!dir || !SESSION.test(sessionId)) throw Object.assign(new Error('This server keeps no flashbacks.'), { status: 503 });
    return join(dir, sessionId);
  };
  const file = (sessionId, householdId) => {
    if (!HOUSEHOLD.test(householdId)) throw Object.assign(new Error('No such family.'), { status: 404 });
    return join(folder(sessionId), `${householdId}.webm`);
  };
  /** What is kept for one class: each family's video and what it is, read from the disk once and remembered. */
  function list(sessionId) {
    if (!dir || !SESSION.test(sessionId)) return {};
    if (facts.has(sessionId)) return facts.get(sessionId);
    const found = {};
    const at = join(dir, sessionId);
    if (existsSync(at)) {
      for (const name of readdirSync(at)) {
        const match = /^(hh-\d{1,3})\.json$/.exec(name);
        if (!match || !existsSync(join(at, `${match[1]}.webm`))) continue;
        try { found[match[1]] = JSON.parse(readFileSync(join(at, name), 'utf8')); } catch { /* a half-written note: the video is made again */ }
      }
    }
    facts.set(sessionId, found);
    return found;
  }
  /** Keep one family's video, after checking it is what it says. Returns what it is. */
  function save(sessionId, householdId, bytes, { scriptVersion = SCRIPT_VERSION, madeMs = null } = {}) {
    const path = file(sessionId, householdId);
    if (bytes.length > FLASHBACK_LIMITS.maxBytes) throw Object.assign(new Error(`A flashback may be at most ${FLASHBACK_LIMITS.maxBytes / 1048576} MB.`), { status: 413 });
    const read = readWebmFacts(bytes);
    if (read.error) throw Object.assign(new Error(read.error), { status: 415 });
    if (!(read.durationMs >= FLASHBACK_LIMITS.minMs && read.durationMs <= FLASHBACK_LIMITS.maxMs)) throw Object.assign(new Error(`A flashback is about a minute long; this one is ${Math.round((read.durationMs || 0) / 1000)} seconds.`), { status: 422 });
    mkdirSync(folder(sessionId), { recursive: true });
    const note = { householdId, bytes: bytes.length, durationMs: read.durationMs, codec: read.codec, width: read.width, height: read.height, blocks: read.blocks, keyframes: read.keyframes, scriptVersion, madeAt: new Date().toISOString(), ...(Number.isFinite(madeMs) && { madeMs: Math.round(madeMs) }) };
    // Written whole and then put in place, so a page asking for the video mid-write never gets half of one.
    const temp = `${path}.tmp`;
    writeFileSync(temp, bytes);
    const fd = openSync(temp, 'r+'); try { fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temp, path);
    writeFileSync(join(folder(sessionId), `${householdId}.json`), JSON.stringify(note, null, 1));
    list(sessionId)[householdId] = note;
    return note;
  }
  /** Send one family's video, a range of it when the player asks for one (a replay, or a seek). */
  function serve(req, res, sessionId, householdId) {
    const path = file(sessionId, householdId);
    if (!list(sessionId)[householdId] || !existsSync(path)) { res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ error: 'This family’s flashback has not been made yet.' })); }
    const size = statSync(path).size;
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    const headers = { 'Content-Type': 'video/webm', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      let end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start >= size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      return createReadStream(path, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': size });
    return createReadStream(path).pipe(res);
  }
  return { dir, list, save, serve, file };
}

/** The request's body, whole, refusing past `limit` bytes. */
export async function bodyBytes(req, limit = FLASHBACK_LIMITS.maxBytes) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw Object.assign(new Error(`A flashback may be at most ${limit / 1048576} MB.`), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Every family's script for this class, made once a revision of it: the homecoming and the beats of thirty families are a
 * second or two of the server's one thread, not something to do again for each page that asks.
 */
export function scriptCache() {
  let kept = { key: null, scripts: null };
  return world => {
    const key = `${world.tick}:${world.minute}:${world.status}:${world.events.length}`;
    if (kept.key !== key) kept = { key, scripts: flashbackScripts(world) };
    return kept.scripts;
  };
}

/**
 * What a page is told of the flashbacks with each snapshot: nothing before the end; then, for the Host, every family's - made or
 * not, and who a student played - and for a student, their own family's alone.
 */
export function flashbackPayload(store, sessionId, world, identity) {
  if (!flashbackReady(world)) return {};
  const made = store?.dir ? store.list(sessionId) : {};
  const brief = note => note && { bytes: note.bytes, durationMs: note.durationMs, stale: note.scriptVersion !== SCRIPT_VERSION };
  if (identity.role === 'host') {
    return { flashback: { ready: true, keeps: Boolean(store?.dir), families: Object.values(world.households).map(household => ({ householdId: household.id, played: Boolean(household.played), made: brief(made[household.id]) || null })) } };
  }
  if (!identity.householdId) return {};
  return { flashback: { ready: true, keeps: Boolean(store?.dir), householdId: identity.householdId, made: brief(made[identity.householdId]) || null } };
}
