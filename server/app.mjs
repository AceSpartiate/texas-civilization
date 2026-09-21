import { markPlayed } from '../sim/neighbours.mjs';
import { record } from '../sim/events.mjs';
import http from 'node:http';
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { etagFor, fileFacts, notModified, PIN_LENGTH, PINNED_CACHE, REVALIDATE_CACHE, sendBody } from './delivery.mjs';
import { setAbsent } from '../sim/absence.mjs';
import { createWorld, stepWorld, projectWorld, projectMap, applyAction, validateWorld, projectFamily, rollFamily } from '../sim/world.mjs';
import { familyMaking, householdName, rollRefusal } from '../sim/family.mjs';
import { beginNextPeriod, periodOf } from '../sim/periods.mjs';
import { dateOf } from '../sim/directors.mjs';
import { choreCatalogue, modeCatalogue } from '../sim/chores.mjs';
import { GOODS } from '../sim/trade.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { plotFacts } from '../sim/survey.mjs';
import { wagonCatalogue } from '../sim/wagon.mjs';
import { houseCatalogue } from '../sim/houses.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { woodsCatalogue, woodsTile, woodsTiles } from '../sim/woods-view.mjs';
import { huntFacts } from '../sim/hunting.mjs';
import { fellFacts } from '../sim/felling.mjs';
import { TERRAIN_FILES } from '../sim/province.mjs';
import { gunzipSync } from 'node:zlib';
import { readSave, writeSave, acquireSaveLock, archiveSave } from './storage.mjs';

const token = () => randomBytes(24).toString('hex');
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
// Crockford base32. I, L, O and U are absent, so a family key can be read off one screen
// and typed on another without the 0/O and 1/I confusions, and cannot accidentally spell.
const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const KEY_LENGTH = 8;
const readKey = value => String(value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
const cookie = (req, key) => (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${key}=`))?.slice(key.length + 1);
// Gzipped when large and accepted (server/delivery.mjs): the map alone is a third of a megabyte of JSON.
const json = (res, status, value) => sendBody(res.req, res, status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, Buffer.from(JSON.stringify(value)), { compressible: true });
const files = new Map([
  ['/', ['../public/index.html', 'text/html']], ['/host', ['../public/index.html', 'text/html']],
  ['/app.js', ['../public/app.js', 'text/javascript']], ['/style.css', ['../public/style.css', 'text/css']],
  ['/art.js', ['../public/art.js', 'text/javascript']], ['/interface.js', ['../public/interface.js', 'text/javascript']],
  ['/motion.js', ['../public/motion.js', 'text/javascript']],
  ['/alamo-layout.js', ['../public/alamo-layout.js', 'text/javascript']],
  ['/alamo-collapse.js', ['../public/alamo-collapse.js', 'text/javascript']],
  ['/bexar-layout.js', ['../public/bexar-layout.js', 'text/javascript']],
  ['/bexar-art.js', ['../public/bexar-art.js', 'text/javascript']],
  // The towns' layouts are the server's own data (sim/town-layouts.mjs): the page draws exactly the buildings the keepers stand in.
  ['/town-layouts.js', ['../sim/town-layouts.mjs', 'text/javascript']],
  ['/town-art.js', ['../public/town-art.js', 'text/javascript']],
  // The interiors' spots and art (sim/interior-data.mjs): the page offers exactly the spots the server accepts.
  ['/interior-data.js', ['../sim/interior-data.mjs', 'text/javascript']],
  ['/interior.js', ['../public/interior.js', 'text/javascript']],
  ['/curve.js', ['../public/curve.js', 'text/javascript']],
  ['/map-base.js', ['../public/map-base.js', 'text/javascript']],
  ['/land-worker.js', ['../public/land-worker.js', 'text/javascript']],
  ['/smooth-worker.js', ['../public/smooth-worker.js', 'text/javascript']],
  ['/army-view.js', ['../public/army-view.js', 'text/javascript']],
  ['/creation.js', ['../public/creation.js', 'text/javascript']],
  ['/intro-art.js', ['../public/intro-art.js', 'text/javascript']],
  ['/ground-classes.js', ['../public/ground-classes.js', 'text/javascript']],
  ['/land-levels.js', ['../public/land-levels.js', 'text/javascript']],
  ['/ending.js', ['../public/ending.js', 'text/javascript']],
  ['/appearance.js', ['../public/appearance.js', 'text/javascript']],
  ['/looks-art.js', ['../public/looks-art.js', 'text/javascript']],
  ['/field-art.js', ['../public/field-art.js', 'text/javascript']],
  ['/gonzales-art.js', ['../public/gonzales-art.js', 'text/javascript']],
  ['/landscape-art.js', ['../public/landscape-art.js', 'text/javascript']],
  // The weather, drawn: rain, a norther, a storm, fog and high water (docs/WEATHER.md, public/weather-art.js).
  ['/weather-art.js', ['../public/weather-art.js', 'text/javascript']],
  ['/woods-view.js', ['../public/woods-view.js', 'text/javascript']],
  ['/house-plot.js', ['../public/house-plot.js', 'text/javascript']],
  ['/family-panel.js', ['../public/family-panel.js', 'text/javascript']],
  // The guided start, on the screen (docs/FAMILY_PANEL.md §12, public/lesson.js): what the server's `world.lesson` shuts,
  // points at and says. It decides nothing; the lesson itself is the world's.
  ['/lesson.js', ['../public/lesson.js', 'text/javascript']],
  // How the map answers a hand: pan, zoom, pinch, tap (docs/PERFORMANCE_NAVIGATION.md).
  ['/map-camera.js', ['../public/map-camera.js', 'text/javascript']],
  // The Host's live page in words (docs/HOST_PAGE.md); named off the /host prefix, which is the Host page itself.
  ['/live-page.js', ['../public/live-page.js', 'text/javascript']],
  ['/alamo-workshop.html', ['../public/alamo-workshop.html', 'text/html']],
  ['/alamo-workshop.js', ['../public/alamo-workshop.js', 'text/javascript']],
  ['/alamo-workshop.css', ['../public/alamo-workshop.css', 'text/css']],
  ['/art-catalog.html', ['../public/art-catalog.html', 'text/html']], ['/art-catalog.js', ['../public/art-catalog.js', 'text/javascript']],
  ['/art-catalog.css', ['../public/art-catalog.css', 'text/css']],
]);
const assetsRoot = fileURLToPath(new URL('../public/assets/', import.meta.url));
const assetTypes = { png: 'image/png', webp: 'image/webp', json: 'application/json; charset=utf-8' };
const inside = (root, path) => { const child = relative(root, path); return child !== '' && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child); };
function serveAsset(req, res, rawPath) {
  // Atlas names are deliberately ASCII. Reject encoded separators, Windows paths,
  // dot segments, hidden files, and unsupported types before resolving any file.
  if (!/^\/assets\/(?:[A-Za-z0-9][A-Za-z0-9_-]*\/)*[A-Za-z0-9][A-Za-z0-9_.-]*\.(png|webp|json)$/.test(rawPath)) return json(res, 404, { error: 'Not found' });
  try {
    const root = realpathSync(assetsRoot);
    const path = realpathSync(resolve(root, ...rawPath.slice('/assets/'.length).split('/')));
    // Resolve links as well as the lexical path so a link cannot expose a save.
    if (!inside(root, path) || relative(root, path).split(sep).some(part => part.startsWith('.'))) return json(res, 404, { error: 'Not found' });
    const info = statSync(path);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) return json(res, 404, { error: 'Not found' });
    // The file's hash is remembered by size and time, so a 304 reads nothing off disk. Manifests are kept and gzipped once;
    // pictures are already compressed and are read per 200. A URL whose `v` is the start of the file's own SHA-256 (what
    // public/art.js asks for) names bytes that can never change, and the browser keeps it for a year without asking.
    const extension = rawPath.slice(rawPath.lastIndexOf('.') + 1), compressible = extension === 'json';
    const facts = fileFacts(path, { keep: compressible, info });
    const version = new URL(req.url, 'http://asset').searchParams.get('v') || '';
    const etag = etagFor(req, facts, compressible);
    res.setHeader('Cache-Control', version.length >= PIN_LENGTH && facts.sha256.startsWith(version) ? PINNED_CACHE : REVALIDATE_CACHE);
    res.setHeader('ETag', etag);
    if (notModified(req, etag)) { res.writeHead(304); return res.end(); }
    return sendBody(req, res, 200, { 'Content-Type': assetTypes[extension] }, facts.content || readFileSync(path), { compressible, zipped: facts.zipped });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP'].includes(error.code)) return json(res, 404, { error: 'Not found' });
    throw error;
  }
}
async function body(req) {
  let value = '';
  for await (const chunk of req) { value += chunk; if (value.length > 8192) throw new Error('Request too large'); }
  return JSON.parse(value || '{}');
}

/**
 * How fast a class watches its own afternoon.
 *
 * Three named paces rather than a number, because "milliseconds per tick" is not a thing a
 * teacher should have to think about. The fictional clock is identical in all three - the
 * same day, the same distances, the same arrivals - and only the number of real minutes
 * spent watching it changes.
 *
 * `study` is the default and is the honest one: at 9.5 seconds a tick a walking figure
 * covers about nine tenths of its own body length each second, which is what walking looks
 * like, and the Gonzales slice fills a 45-minute period. `brisk` and `quick` exist for a
 * teacher who is behind, and `quick` is the old pace, kept because it is what every
 * measurement before today was taken at.
 */
export const PACES = Object.freeze({ study: 9500, brisk: 4000, quick: 1000 });
/**
 * How long a student's page can be closed before their family goes on by itself (owner, 2026-09-16: "Absent families
 * automatically become npc, but may be played again by the player if they return later"; sim/absence.mjs). Two minutes:
 * longer than the away grace, so a locked phone or a tab in the background is never called absent, and shorter than the
 * time a question would otherwise hold the whole class for a student who has left the room.
 */
export const ABSENT_MS = 120000;
/**
 * How long a tick or a student's order can be shown before it is written (`commit` below): the most a crash can lose. Five
 * seconds is under one tick at the study pace, and at a quicker pace the third unsaved tick is written sooner.
 */
export const SAVE_WITHIN_MS = 5000;
const SAVE_EVERY_TICKS = 3;

/** The most woods tiles one request may ask for. */
export const WOODS_BATCH_MAX = 64;
export function createClassroom({ seed = 'gonzales-1835', playerCount = 15, tickMs = 200, savePath, joinUrls = [], worldFactory = createWorld, onStopRequested = null, stopDelayMs = 250, solo = false, absentMs = ABSENT_MS, soloGamesDir = null, timings = null, saveWithinMs = SAVE_WITHIN_MS } = {}) {
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 30) throw new Error('Class size must be 5–30');
  if (!Number.isInteger(tickMs) || tickMs < 10 || tickMs > 10000) throw new Error('Tick interval must be 10–10000 milliseconds');
  /**
   * How many real milliseconds one tick takes.
   *
   * This is the only lever on how fast the world *looks*, and it is separate from how fast
   * the world *is*: a tick is always twenty fictional minutes and a person always walks
   * three miles an hour, whatever this is set to. Nothing under `sim/` reads it. Changing
   * it changes no outcome, no arrival, no distance and no decision - only the number of
   * real seconds a student spends watching the same fictional hour.
   *
   * At 1000 ms a walking figure crossed 8.7 of its own body lengths every second, against
   * 0.78 for a person walking at three miles an hour. The legs were stepping at life speed
   * while the body took a nineteen-hundred-foot stride, which is what "moving too fast"
   * actually was. Zoom could never have fixed it: screen speed is scale times miles per
   * second, so the scale cancels.
   */
  let pace = tickMs;
  const lease = acquireSaveLock(savePath);
  savePath = lease.path;
  let state;
  try {
    state = readSave(savePath) || { saveVersion: 3, revision: 0, hostKey: token(), sessionId: token().slice(0, 12), sessionCode: randomBytes(3).toString('hex').toUpperCase(), clients: {}, hostCommands: [], world: worldFactory(seed, playerCount) };
    validateWorld(state.world);
  } catch (error) { lease.release(); throw error; }
  // The last committed class as its save text, and the last one written (`commit`).
  let committed;
  try {
    committed = JSON.stringify(state);
    writeSave(savePath, committed);
  } catch (error) { lease.release(); throw error; }
  let durable = committed, unsavedTicks = 0, saveTimer = null;
  // Cookies are host/path scoped, not port scoped; separate class namespaces prevent
  // collisions. A new class rotates the session ID, so the names are read per request.
  const hostCookie = () => `tr_host_${state.sessionId}`, studentCookie = () => `tr_student_${state.sessionId}`;
  const setCookie = (name, value, maxAge) => `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
  // Faults and lifecycle notices are transient runtime overlays, explicitly separate from durable state.
  let runtimeFault = null;
  let lifecycle = null;
  let closing = false;
  const streams = new Set();
  // A family key is derived, never stored. The same class secret, session and household
  // always produce the same eight symbols, so recovering a family needs no extra saved
  // state, and a key from an archived class opens nothing in the next one, because New
  // Class rotates the session. Forty bits, taken five at a time from an HMAC so that every
  // symbol is uniform rather than skewed by a modulo.
  const familyKey = householdId => {
    const digest = createHmac('sha256', state.hostKey).update(state.sessionId + ':' + householdId).digest();
    let key = '';
    for (let index = 0; index < KEY_LENGTH; index++) key += KEY_ALPHABET[digest[index] & 31];
    return key;
  };
  // Presence is about this moment and is deliberately never saved. A phone that locks its
  // screen drops the stream within seconds, and a teacher must not read that as a student
  // who left; a household whose stream has closed is *away* until the grace window passes.
  const AWAY_GRACE_MS = 90000;
  const lastSeen = new Map();
  const streaming = () => new Set([...streams].filter(s => s.identity.role === 'student').map(s => s.identity.householdId));
  const connected = () => streaming().size;
  function presence() {
    const here = streaming(), now = Date.now();
    let away = 0;
    const households = {};
    for (const client of Object.values(state.clients)) {
      const id = client.householdId;
      if (!id) continue;
      const at = lastSeen.get(id);
      // 'absent' is the world's word (sim/absence.mjs): the family is being run for. It outranks the grace.
      households[id] = here.has(id) ? 'here' : state.world.households[id]?.absent ? 'absent' : at !== undefined && now - at < AWAY_GRACE_MS ? 'away' : 'gone';
      if (households[id] === 'away') away++;
    }
    return { here: here.size, away, joined: Object.keys(state.clients).length, households };
  }
  /**
   * Absent families go on by themselves (sim/absence.mjs): a joined household whose stream has been closed for `absentMs`
   * while the class runs is marked absent, and unmarked the tick after its page opens again. Decided here, where presence
   * is known, and told to the world in the same commit as the tick, so a save carries it.
   */
  function markAbsences(world) {
    const here = streaming(), now = Date.now();
    for (const client of Object.values(state.clients)) {
      const household = client.householdId && world.households[client.householdId];
      if (!household?.played) continue;
      const at = lastSeen.get(client.householdId);
      const gone = !here.has(client.householdId) && at !== undefined && now - at >= absentMs;
      setAbsent(world, household, gone);
    }
  }
  // Guessing a key is cheap to attempt, so attempting it becomes expensive. Per address,
  // in memory, and bounded by the number of devices that can reach a classroom LAN.
  // ceiling: one counter per remote address, so devices sharing one address share a
  // cooldown. True on a LAN where each device has its own; per-key counters if a class
  // ever arrives through a proxy.
  const REJOIN_TRIES = 5, REJOIN_COOLDOWN_MS = 30000;
  const rejoinTries = new Map();
  /** How long this address must wait, as the refusal a page shows, or null when it may try. */
  function rejoinCooldown(address) {
    const now = Date.now();
    for (const [seen, tries] of rejoinTries) if (now - tries.at >= REJOIN_COOLDOWN_MS) rejoinTries.delete(seen);
    const attempt = rejoinTries.get(address);
    if (!attempt || attempt.count < REJOIN_TRIES) return null;
    return { error: `Too many tries. Wait ${Math.ceil((REJOIN_COOLDOWN_MS - (now - attempt.at)) / 1000)} seconds and try again.` };
  }
  const countRejoinTry = address => rejoinTries.set(address, { count: (rejoinTries.get(address)?.count || 0) + 1, at: Date.now() });
  const clearRejoinTries = address => rejoinTries.delete(address);
  /** One line on the class's own public record, which is what the Host page reads (`projectWorld`, role 'host'). */
  const tellClass = (world, text) => record(world, 'presence', { visibility: 'public', importance: 2, claimId: 'FIC-GONZ-186', text });
  function identify(req) {
    const host = cookie(req, hostCookie());
    if (equal(host, state.hostKey)) return { role: 'host' };
    const credential = cookie(req, studentCookie());
    const client = credential && state.clients[hash(credential)];
    return client ? { role: 'student', ...client, credentialHash: hash(credential) } : null;
  }
  function snapshot(identity) {
    return { revision: state.revision, ...view(identity) };
  }
  /**
   * A snapshot without its revision: what a page sees, which is the same text for as long as nothing it sees changes.
   * `copy: false` when it is serialised at once and never kept (`send`); anything handed out keeps its own copy.
   */
  function view(identity, copy = true) {
    // `tickMs` rides along because the renderer has to know how long a tick lasts to
    // spread one tick's movement across it. Without it the client guesses one second and a
    // slower class walks for a second and then stands still for the rest of the tick.
    const payload = { sessionId: state.sessionId, connected: connected(), tickMs: pace, fault: runtimeFault && structuredClone(runtimeFault), lifecycle: lifecycle && structuredClone(lifecycle), world: projectWorld(state.world, identity.householdId, identity.role, { includeMap: false, copy }), mapId: state.sessionId, ...(state.world.map.revision && { mapRevision: state.world.map.revision }), ...(state.world.woods?.revision && { woodsRevision: state.world.woods.revision }) };
    // A page has to know it is a solo game: there is no teacher on it, so its own "Done packing" is the Start
    // (owner, 2026-09-21). One boolean rather than a role of its own - a solo player is a student in every other way.
    if (solo) payload.solo = true;
    if (identity.role === 'host') Object.assign(payload, { sessionCode: state.sessionCode, joinUrls, canStop: Boolean(onStopRequested), presence: presence() });
    // A household is told its own key and no other. The Host page deliberately carries
    // none of them, because a teacher's screen is sometimes a projector.
    // A teacher can look one up from the Host page, one family at a time, through
    // /api/families and /api/family-key. That is deliberately not this payload.
    else if (identity.householdId) payload.familyKey = familyKey(identity.householdId);
    return payload;
  }
  // Measurement only (`timings`, scripts/perf-server-measure.mjs): where one commit's milliseconds and bytes go. Null on
  // every real server, where none of this is counted.
  let sent = null;
  /**
   * One snapshot to one page, from the views already made for this broadcast.
   *
   * Pages that see the same thing - the Host's tabs, one family's tabs - share one projection and one serialisation per
   * broadcast (`made`, keyed by role and family), and a page whose view has not changed since the last snapshot it was sent
   * is sent nothing: another family's order, a page opening or closing elsewhere. A snapshot is the whole of what a page
   * sees, so a page that is sent nothing is exactly as current as one that is sent the same view again, and it is spared
   * parsing and drawing it (docs/PERFORMANCE_SERVER.md). `force` is the page of whoever made the change, which always hears
   * back that it went through.
   */
  function send(stream, made = new Map(), force = null) {
    // Disconnect a slow receiver instead of retaining an unbounded snapshot queue.
    if (stream.res.writableLength > 1024 * 1024) { stream.res.destroy(); streams.delete(stream); return; }
    const { role, householdId } = stream.identity;
    const key = `${role}:${householdId || ''}`;
    let body = made.get(key);
    if (body === undefined) {
      const started = sent && performance.now();
      const payload = view(stream.identity, false);
      const projected = sent && performance.now();
      body = JSON.stringify(payload);
      made.set(key, body);
      if (sent) { sent.project += projected - started; sent.stringify += performance.now() - projected; }
    }
    const mine = force?.some(actor => actor.role === role && (actor.householdId || '') === (householdId || ''));
    if (body === stream.body && !mine) { if (sent) sent.skipped = (sent.skipped || 0) + 1; return; }
    stream.body = body;
    const text = `{"revision":${state.revision},${body.slice(1)}`;
    if (sent) { sent.bytes[role] = (sent.bytes[role] || 0) + text.length; sent.count[role] = (sent.count[role] || 0) + 1; }
    stream.res.write(`id: ${state.revision}\ndata: ${text}\n\n`);
  }
  /**
   * Snapshots to every page, now. Ticks, the Host's commands and faults go at once; a student's order, and a page opening or
   * closing, go through `broadcastSoon`, so that thirty orders pressed in the same second are shown in a handful of
   * broadcasts rather than thirty, each of which projected the class for every page (docs/PERFORMANCE_SERVER.md). Whoever
   * sent an order still waiting to be shown is always sent a snapshot (`send`'s `force`).
   */
  const BROADCAST_GAP_MS = 200;
  let lastBroadcast = 0, broadcastTimer = null, waiting = [];
  function broadcast(force = null) {
    clearTimeout(broadcastTimer); broadcastTimer = null;
    const actors = force ? [...waiting, force] : waiting;
    waiting = [];
    if (closing) return;
    lastBroadcast = Date.now();
    const made = new Map();
    for (const stream of streams) send(stream, made, actors);
  }
  // ceiling: an order is shown up to BROADCAST_GAP_MS after another page's order was; ticks are never held. A per-family
  // record of what changed, so only the pages it touched are projected, is the way out if a class's orders outrun this.
  function broadcastSoon(actor = null) {
    if (actor) waiting.push(actor);
    if (broadcastTimer) return;
    const wait = lastBroadcast + BROADCAST_GAP_MS - Date.now();
    if (wait <= 0) broadcast();
    else broadcastTimer = setTimeout(() => broadcast(), wait);
  }
  function suspend(code) {
    const resumeStatus = runtimeFault?.resumeStatus || (state.world.status === 'paused' ? 'running' : state.world.status);
    state.world.status = 'paused';
    runtimeFault = {
      code, unsaved: true, lastSavedRevision: savePath ? state.revision : null, resumeStatus,
      message: code === 'SAVE_FAILED'
        ? 'Saving failed. The class is paused in memory; the last successful save is retained. Restore save access, then choose Resume to retry.'
        : 'The simulation encountered a fault and paused in memory. The last successful save is retained. Ask the developer to inspect the server log before retrying Resume.',
    };
    broadcast();
  }
  /**
   * Put the class back to a committed text. A fault's pause is an overlay on the committed class, not part of it, so it
   * survives being put back: an order refused while the class is paused by a fault must not un-pause it.
   */
  function restore(text) {
    state = JSON.parse(text);
    if (runtimeFault) state.world.status = 'paused';
  }
  /**
   * Write whatever has been committed since the last save. A write that fails puts the class back to its last save,
   * pauses it and says so (`SAVE_FAILED`), and throws a 503 to whoever asked, if anybody did.
   */
  function flush() {
    clearTimeout(saveTimer); saveTimer = null;
    if (committed === durable) return;
    try { writeSave(savePath, committed); }
    catch (error) {
      committed = durable; unsavedTicks = 0;
      restore(durable);
      suspend('SAVE_FAILED');
      const unavailable = new Error(runtimeFault.message, { cause: error }); unavailable.status = 503; throw unavailable;
    }
    durable = committed; unsavedTicks = 0;
  }
  /**
   * Every change to the class: made, checked, serialised, and then saved and shown.
   *
   * A change that throws or leaves an invalid world is undone. What it is undone to is the last committed class read back
   * from its own save text (`committed`), serialised once per commit - which is also the text written to disk, so the copy
   * a rollback needs costs one serialisation, where a `structuredClone` of the whole class on every commit was the largest
   * single cost of a late-game tick (docs/PERFORMANCE_SERVER.md). A class is plain JSON by construction, because it has to
   * reopen from its save identically (sim/events.mjs `record`; tests/save-text.test.mjs), so its save text is an exact copy.
   *
   * `when`, what a change is:
   * - 'now' (the default): joining, a family key, the Host's commands, Play Solo. Written and fsynced before it is shown or
   *   answered, and a failed write refuses it with a 503, as every commit used to be.
   * - 'tick': shown at once, written with the third unsaved tick or SAVE_WITHIN_MS after the first, whichever is sooner.
   * - 'order': a student's order. Written like a tick, and shown with the orders around it (`broadcastSoon`).
   *
   * ceiling: a crash - the laptop's battery, the process killed - loses at most SAVE_WITHIN_MS of ticks and students' orders,
   * or three ticks at a quick pace. Stopping the server, from the Host page, the launcher or Ctrl+C, writes everything first
   * (`close`), and so does every Host command. Writing every commit is the way back if a class ever cannot afford five
   * seconds, and it costs a write and an fsync of the whole class per order: with each order also broadcast at once, the
   * last of 30 orders pressed together was answered after 2.5 s on a fast desktop, against under 1 s now
   * (docs/PERFORMANCE_SERVER.md).
   */
  function commit(mutate, { actor = null, when = 'now' } = {}) {
    const at = timings ? [performance.now()] : null;
    let text;
    try { mutate(state); at?.push(performance.now()); validateWorld(state.world); at?.push(performance.now()); state.revision++; text = JSON.stringify(state); at?.push(performance.now()); }
    catch (error) { restore(committed); throw error; }
    committed = text;
    if (when === 'tick') unsavedTicks++;
    if (when === 'now' || unsavedTicks >= SAVE_EVERY_TICKS) { flush(); runtimeFault = null; }
    else saveTimer ??= setTimeout(() => { try { flush(); } catch (error) { console.error('Saving failed:', error.cause?.message || error.message); } }, saveWithinMs);
    at?.push(performance.now());
    if (at) sent = { project: 0, stringify: 0, bytes: {}, count: {} };
    if (when === 'order') broadcastSoon(actor); else broadcast(actor);
    if (at) { timings({ revision: state.revision, when, mutate: at[1] - at[0], validate: at[2] - at[1], serialise: at[3] - at[2], save: at[4] - at[3], broadcast: performance.now() - at[4], ...sent }); sent = null; }
  }
  // A graceful stop tells the class before the streams end, so a closed browser is
  // never the only evidence that the teacher stopped the server deliberately.
  function requestStop() {
    if (lifecycle) return false;
    lifecycle = { state: 'stopping', message: 'Your teacher stopped the classroom server. The class was saved and paused; it continues when the server is opened again.' };
    broadcast();
    setTimeout(() => { try { onStopRequested?.(); } catch (error) { console.error('Stop request failed:', error.message); } }, stopDelayMs).unref();
    return true;
  }
  /**
   * Solo Mode: a class of one, for the owner to playtest without running a lesson.
   *
   * One call throws away whatever solo game there was, deals a new world, joins one player,
   * rolls that family and starts the class - the join form, the class code and the Host's
   * Start press all skipped. Every other household is an automatic neighbour, exactly as in a
   * class where nobody joined them. The player is handed over through a one-use ticket rather
   * than a credential in a URL, because a browser only takes a cookie from a response.
   *
   * It exists only on a classroom created with `solo: true`, which `server/main.mjs --solo`
   * binds to loopback and keeps in its own save (`soloPaths` in server/deployment.mjs), so a
   * teacher's real class is never the one discarded here.
   *
   * Saved games (owner, 2026-09-17: "a popup should ask if the player wants to start a new game, or continue an old one.
   * they can't continue a multiplayer game from there"; by multiple choice, a list of saved games). Every solo game is kept
   * in its own file in `soloGamesDir` (`data/solo/games/<session>.json`), written when another game takes its place and
   * when the server starts over a game left in the live save (server/main.mjs). Only solo games are ever in that folder,
   * so a class's save cannot be listed or continued from here.
   *
   * **Deleting one (owner, 2026-09-21: "I need a way to delete solo games", by multiple choice a trash can beside each
   * save in the Play Solo menu, asked about once, and *set aside* rather than destroyed).** The file moves to
   * `games/deleted/`, which the listing never reads - it takes only `*.json` from `gamesDir` itself, so a folder inside
   * it is invisible to it without a rule of its own. Nothing is thrown away: a game deleted by a mis-click is still on
   * the disk and can be put back by hand.
   *
   * The game the server is *holding* is not a special case, by the owner's decision: deleting it sets its file aside
   * and the server goes on holding the world until something replaces it. What the listing does is drop any id that has
   * a file in `deleted/`, so the live game leaves the list when it is deleted, as a student would expect, without the
   * server having to be interrupted. That also survives a restart, which a note kept in memory would not.
   */
  const SOLO_TICKET_MS = 120000;
  const soloTickets = new Map();
  const gamesDir = solo ? (soloGamesDir || (savePath ? join(dirname(savePath), 'games') : null)) : null;
  const SOLO_GAME_ID = /^[\w-]{6,40}$/;
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  /** What the launcher's list says about one game: whose, when in 1835-36, and how far along. */
  function soloSummary(saved, savedAt) {
    const identity = Object.values(saved.clients || {})[0];
    const household = identity && saved.world?.households?.[identity.householdId];
    if (!household) return null;
    const at = dateOf(saved.world, saved.world.minute);
    const name = householdName(saved.world, household);
    return {
      id: saved.sessionId,
      family: name[0].toUpperCase() + name.slice(1),
      date: `${MONTH_NAMES[at.getUTCMonth()]} ${at.getUTCDate()}, ${at.getUTCFullYear()}`,
      period: periodOf(saved.world),
      status: saved.world.status,
      savedAt,
    };
  }
  /** Keep the game being played in its own file, before another takes its place. */
  function keepSoloGame() {
    if (!gamesDir || !Object.keys(state.clients).length) return;
    writeSave(join(gamesDir, `${state.sessionId}.json`), { ...state, soloSavedAt: new Date().toISOString() });
  }
  /** Where a deleted game is set aside. Inside `gamesDir`, and so never read by the listing, which takes only `*.json`. */
  const deletedDir = gamesDir ? join(gamesDir, 'deleted') : null;
  const wasDeleted = id => Boolean(deletedDir) && existsSync(join(deletedDir, `${id}.json`));
  function soloGames() {
    if (!solo) throw new Error('This is not a Play Solo server.');
    const games = new Map();
    let files = [];
    try { files = readdirSync(gamesDir).filter(file => file.endsWith('.json')); } catch { /* no games kept yet */ }
    for (const file of files) {
      try {
        const saved = readSave(join(gamesDir, file));
        const summary = saved && soloSummary(saved, saved.soloSavedAt || statSync(join(gamesDir, file)).mtime.toISOString());
        if (summary && SOLO_GAME_ID.test(summary.id)) games.set(summary.id, summary);
      } catch { /* a game an older build cannot open is not offered */ }
    }
    const live = Object.keys(state.clients).length && soloSummary(state, new Date().toISOString());
    if (live) games.set(live.id, live);
    // The game being held is listed from memory, not from a file, so deleting it has to be remembered somewhere the
    // listing looks: the game set aside is that record.
    for (const id of [...games.keys()]) if (wasDeleted(id)) games.delete(id);
    return [...games.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
  /**
   * Set one saved solo game aside. Refuses anything that is not a solo server or not an id, so a path can never be
   * built out of what a caller sent; the id is matched against `SOLO_GAME_ID` before it is ever joined to a folder.
   *
   * A game that is only being held - never yet written to its own file - has nothing to move, and is recorded as
   * deleted by writing the game itself aside. Either way the answer is the same and the listing drops it.
   */
  function deleteSoloGame(id) {
    if (!solo) throw new Error('This is not a Play Solo server.');
    if (typeof id !== 'string' || !SOLO_GAME_ID.test(id)) throw new Error('That is not a saved solo game.');
    if (!gamesDir) throw new Error('This solo server keeps no games.');
    if (wasDeleted(id)) return { deleted: id, already: true };
    const kept = join(gamesDir, `${id}.json`);
    mkdirSync(deletedDir, { recursive: true });
    // ceiling: a deleted game that is still the one being held is written to `games/` again the next time another game
    // takes its place (`keepSoloGame`). The file set aside keeps it out of the list, so nothing is offered that was
    // deleted; what is left behind is one file's worth of disk. Emptying `deleted/` on a timer would be the way out if
    // a folder of playtests ever grows enough to matter.
    if (existsSync(kept)) renameSync(kept, join(deletedDir, `${id}.json`));
    else if (id === state.sessionId && Object.keys(state.clients).length) writeSave(join(deletedDir, `${id}.json`), { ...state, soloSavedAt: new Date().toISOString() });
    else throw new Error('That saved solo game is not there.');
    return { deleted: id, already: false };
  }
  /** Hand the player a one-use link into whatever game is now live; the last game's pages belong to a session that is gone. */
  function soloEntry(credential, householdId) {
    for (const stream of [...streams]) { streams.delete(stream); stream.res.end(); }
    // ceiling: one outstanding ticket at a time - a second game voids the first's link.
    soloTickets.clear();
    const ticket = token();
    soloTickets.set(ticket, { credential, at: Date.now() });
    return { ticket, path: `/solo/enter?ticket=${ticket}`, householdId, sessionId: state.sessionId };
  }
  function continueSoloGame(id) {
    if (!solo) throw new Error('This is not a Play Solo server.');
    if (lifecycle) throw new Error('This server is stopping.');
    if (typeof id !== 'string' || !SOLO_GAME_ID.test(id)) throw new Error('That is not a saved solo game.');
    const credential = token();
    let identity;
    if (id === state.sessionId && Object.keys(state.clients).length) {
      identity = { ...Object.values(state.clients)[0], commands: [] };
      commit(s => { s.clients = { [hash(credential)]: identity }; });
    } else {
      let saved = null;
      try { saved = gamesDir && readSave(join(gamesDir, `${id}.json`)); } catch (error) { throw new Error(`That saved game cannot be opened: ${error.message}`); }
      if (!saved || saved.sessionId !== id) throw new Error('That saved solo game is not there.');
      identity = { ...Object.values(saved.clients || {})[0], commands: [] };
      if (!identity.householdId || !saved.world?.households?.[identity.householdId]) throw new Error('That saved solo game has no player in it.');
      keepSoloGame();
      commit(s => {
        s.sessionId = saved.sessionId;
        s.sessionCode = saved.sessionCode;
        s.hostCommands = saved.hostCommands || [];
        s.world = saved.world;
        s.clients = { [hash(credential)]: identity };
        // A game left paused by a stop goes on when it is continued; an ended one is shown as it ended.
        if (s.world.status === 'paused') s.world.status = 'running';
      });
    }
    return soloEntry(credential, identity.householdId);
  }
  function newSoloGame(name = 'Solo player') {
    if (!solo) throw new Error('This is not a Play Solo server.');
    if (lifecycle) throw new Error('This server is stopping.');
    const credential = token(), identity = { name, householdId: 'hh-1', commands: [] };
    keepSoloGame();
    commit(s => {
      s.sessionId = token().slice(0, 12);
      s.sessionCode = randomBytes(3).toString('hex').toUpperCase();
      s.hostCommands = [];
      s.world = worldFactory(token().slice(0, 16), s.world.playerCount);
      s.clients = { [hash(credential)]: identity };
      markPlayed(s.world, identity.householdId);
      // Not rolled: the player rolls their own family, as a student does (owner, 2026-09-17: "when did i roll for family
      // size?"). A family somebody plays may roll while the class runs (sim/family.mjs `rollRefusal`), which is what lets Play
      // Solo deal a game that is already going and still leave the die to the player.
      //
      // **In the lobby, not running (owner, 2026-09-21).** A solo game opened `running` until then, and the wagon and the
      // stock choice are sent only in the lobby - so the solo player never saw either, and always held a labor of land
      // where a student who drives stock in holds a league and a labor. The owner had been playtesting a grant nobody
      // chose. Play Solo asks the same questions a class does now; the player's own "Done packing" is the Start
      // (`begin-solo`), because there is no teacher to press it.
      s.world.status = 'lobby';
    });
    return soloEntry(credential, identity.householdId);
  }
  const loopback = address => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
  const server = http.createServer(async (req, res) => {
    try {
      // A solo server is bound to loopback; this is the second lock on the same door.
      if (solo && !loopback(req.socket.remoteAddress)) return json(res, 403, { error: 'A Play Solo server answers only this computer.' });
      const url = new URL(req.url, `http://${req.headers.host}`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'");
      // Inspect the original request path: URL parsing normalizes ../ and backslashes.
      const rawPath = req.url.split('?')[0];
      const assetRequest = rawPath === '/assets' || rawPath.startsWith('/assets/') || rawPath.startsWith('/assets\\') || url.pathname.startsWith('/assets/');
      if (assetRequest) {
        if (req.method !== 'GET') return json(res, 404, { error: 'Not found' });
        return serveAsset(req, res, rawPath);
      }
      // The real land drawn zoomed out, every band of it, and its land classes (docs/MAP_ACCURACY.md): built files, the
      // same for every class, stored gzipped and sent as they are to a browser that takes gzip.
      // The country outside the box (2026-09-18) is two more of them.
      if (req.method === 'GET' && Object.hasOwn(TERRAIN_FILES, url.pathname)) {
        // Kept in memory with a validator (server/delivery.mjs): a reload that already holds them is answered 304 with no body,
        // rather than 350 KB sent again on every load (measured 2026-09-17, docs/PERFORMANCE_LOAD.md).
        const file = TERRAIN_FILES[url.pathname];
        const facts = fileFacts(file instanceof URL ? fileURLToPath(file) : file, { keep: true });
        const zipped = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
        const etag = `${facts.etag.slice(0, -1)}${zipped ? '-gz' : ''}"`;
        res.setHeader('Vary', 'Accept-Encoding');
        if (notModified(req, etag)) { res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' }); return res.end(); }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache', ETag: etag, ...(zipped && { 'Content-Encoding': 'gzip' }) });
        return res.end(zipped ? facts.content : gunzipSync(facts.content));
      }
      if (req.method === 'GET' && files.has(url.pathname)) {
        const [path, mime] = files.get(url.pathname);
        let facts;
        try { facts = fileFacts(fileURLToPath(new URL(path, import.meta.url)), { keep: true }); }
        catch (error) { if (error.code === 'ENOENT') return json(res, 404, { error: 'Not found' }); throw error; }
        // Asked about on every load (no-cache), so an updated game never runs from an old copy; a 304 carries no body.
        const etag = etagFor(req, facts, true);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('ETag', etag);
        if (notModified(req, etag)) { res.writeHead(304); return res.end(); }
        return sendBody(req, res, 200, { 'Content-Type': `${mime}; charset=utf-8` }, facts.content, { compressible: true, zipped: facts.zipped });
      }
      // `joinUrls` is here because the launcher needs it and because it is not a secret:
      // it is the address a student types, and anybody asking this question has already
      // reached the server to ask it. The alternative was a second copy of the interface
      // filtering in the launcher, drifting away from `joinCandidates` over time.
      if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, application: 'texas-revolution-foundation', pid: process.pid, launchId: process.env.TEXAS_LAUNCH_ID || null, maturity: 'PROTOTYPE', stopping: Boolean(lifecycle), canStop: Boolean(onStopRequested), solo: Boolean(solo), joinUrls });
      // The ticket from `newSoloGame` becomes the player's cookie, once, and the page opens joined.
      if (solo && req.method === 'GET' && url.pathname === '/solo/enter') {
        const ticket = url.searchParams.get('ticket') || '';
        const entry = soloTickets.get(ticket);
        soloTickets.delete(ticket);
        if (!entry || Date.now() - entry.at > SOLO_TICKET_MS) return json(res, 403, { error: 'That solo link has been used or has expired. Press Play Solo again.' });
        res.writeHead(303, { 'Set-Cookie': setCookie(studentCookie(), entry.credential, 604800), Location: '/', 'Cache-Control': 'no-store' });
        return res.end();
      }
      if (req.method === 'POST') {
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res, 403, { error: 'Same-origin requests only' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON required' });
      }
      if (req.method === 'POST' && url.pathname === '/api/host') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required. Open Host using the launcher.' });
        res.setHeader('Set-Cookie', setCookie(hostCookie(), state.hostKey, 604800));
        return json(res, 200, { ok: true });
      }
      // The saved solo games, for the launcher's choice between a new game and continuing one.
      if (solo && req.method === 'POST' && url.pathname === '/api/solo/games') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        return json(res, 200, { games: soloGames() });
      }
      // One saved solo game set aside, from the trash can beside it in the Play Solo menu (owner, 2026-09-21).
      if (solo && req.method === 'POST' && url.pathname === '/api/solo/games/delete') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        return json(res, 200, deleteSoloGame(input.id));
      }
      // A new solo game, or a saved one continued, asked for with the Host key the solo server wrote to its own data folder.
      if (solo && req.method === 'POST' && url.pathname === '/api/solo') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        const game = input.continue !== undefined
          ? continueSoloGame(input.continue)
          : newSoloGame(typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 40) : undefined);
        return json(res, 200, { playUrl: `http://127.0.0.1:${server.address().port}${game.path}`, householdId: game.householdId, sessionId: game.sessionId });
      }
      if (req.method === 'POST' && url.pathname === '/api/join') {
        const input = await body(req);
        const existing = identify(req);
        if (existing?.role === 'student') return json(res, 200, snapshot(existing));
        if (state.world.status !== 'lobby') return json(res, 409, { error: 'This class has started. Existing players can reconnect.' });
        if (input.code !== state.sessionCode) return json(res, 403, { error: 'Check the class code on the Host screen.' });
        const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
        if (!name) return json(res, 400, { error: 'Choose a display name.' });
        const count = Object.keys(state.clients).length;
        if (count >= state.world.playerCount) return json(res, 409, { error: 'Class is full.' });
        const credential = token();
        const identity = { name, householdId: `hh-${count + 1}`, commands: [] };
        // A family a student joins is theirs for good: the neighbour director never runs it again (sim/neighbours.mjs).
        commit(s => { s.clients[hash(credential)] = identity; markPlayed(s.world, identity.householdId); });
        res.setHeader('Set-Cookie', setCookie(studentCookie(), credential, 604800));
        return json(res, 200, snapshot({ role: 'student', ...identity }));
      }
      // Recovering a family is deliberately not a join. It needs no class code, it works
      // after Start, and it never creates a household — it moves an existing one to
      // whichever device is holding that family's key.
      if (req.method === 'POST' && url.pathname === '/api/rejoin') {
        const supplied = readKey((await body(req)).key);
        const address = req.socket.remoteAddress || 'unknown';
        // The same cooldown the away list and the claim meet, kept in one place since 2026-09-21 so the three doors
        // into a class cannot drift apart.
        const cooling = rejoinCooldown(address);
        if (cooling) return json(res, 429, cooling);
        const found = supplied.length === KEY_LENGTH && Object.entries(state.clients).find(([, client]) => equal(familyKey(client.householdId), supplied));
        if (!found) {
          countRejoinTry(address);
          return json(res, 403, { error: 'That family key does not match any family in this class. Check the letters and try again.' });
        }
        clearRejoinTries(address);
        const [previousHash, client] = found;
        // A family being played right now is not a family that got locked out. Refusing
        // here is what stops a key read off a neighbour's screen from evicting them.
        if (streaming().has(client.householdId)) return json(res, 409, { error: 'Someone is already playing that family. If that is you on another device, close it there first.' });
        // One credential per household at a time, so the command ledger stays single and
        // the old device is signed out rather than quietly sharing an identity.
        const credential = token();
        commit(s => { const record = s.clients[previousHash]; delete s.clients[previousHash]; s.clients[hash(credential)] = record; });
        res.setHeader('Set-Cookie', setCookie(studentCookie(), credential, 604800));
        return json(res, 200, snapshot({ role: 'student', ...state.clients[hash(credential)] }));
      }
      /**
       * Coming back without knowing anything: the families whose student is away, by the name that student chose.
       *
       * **Why this exists.** A class of real students ran on 2026-09-21 and one of them was disconnected and could not
       * get back in, because getting back in wanted the family key off a screen they no longer had. A twelve-year-old
       * on a school Chromebook - which is often a guest session that keeps no cookie - has no id, no key and no way to
       * know either. So: they read their own name off a list and tap it (`FIC-GONZ-186`).
       *
       * **What guards it.** The class code, which is the same door a join goes through and is on the Host's screen; the
       * same per-address cooldown a guessed key meets; and **only families nobody is playing are listed at all**, so a
       * family in front of its own student can never be taken from them. The Host is told publicly when a family moves
       * device (`/api/claim`).
       *
       * ceiling: a student in the room can pick up a classmate's family while that classmate is away, and the guard
       * against it is the teacher seeing it happen rather than the server refusing it. Naming each family's own student
       * is what makes the list usable by a child, and it is the same information the teacher already reads aloud.
       */
      if (req.method === 'POST' && url.pathname === '/api/away') {
        const asked = await body(req);
        const address = req.socket.remoteAddress || 'unknown';
        const cooling = rejoinCooldown(address);
        if (cooling) return json(res, 429, cooling);
        if (asked.code !== state.sessionCode) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }
        clearRejoinTries(address);
        const here = streaming();
        const families = Object.values(state.clients)
          .filter(client => client.householdId && !here.has(client.householdId))
          .map(client => ({ householdId: client.householdId, name: client.name, family: householdName(state.world, state.world.households[client.householdId]) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return json(res, 200, { families });
      }
      /** That one is me: the family is moved to this device, as a rejoin does, without anybody having to know a key. */
      if (req.method === 'POST' && url.pathname === '/api/claim') {
        const asked = await body(req);
        const address = req.socket.remoteAddress || 'unknown';
        const cooling = rejoinCooldown(address);
        if (cooling) return json(res, 429, cooling);
        if (asked.code !== state.sessionCode) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }
        const found = Object.entries(state.clients).find(([, client]) => client.householdId === asked.householdId);
        if (!found) { countRejoinTry(address); return json(res, 404, { error: 'No family in this class is waiting for that name.' }); }
        clearRejoinTries(address);
        const [previousHash, client] = found;
        // The same refusal the key path gives, and for the same reason: a family being played is not a family that got
        // locked out, and this must never take one out from under the student holding it.
        if (streaming().has(client.householdId)) return json(res, 409, { error: 'Someone is already playing that family. If that is you on another device, close it there first.' });
        const credential = token();
        commit(s => {
          const record = s.clients[previousHash];
          delete s.clients[previousHash];
          s.clients[hash(credential)] = record;
          // The teacher is told, on the class's own public record, because the one thing this design trades away is
          // that a classmate could pick up an away family, and the answer to that is that it is never quiet.
          tellClass(s.world, `${client.name} came back to the class on another device.`);
        });
        res.setHeader('Set-Cookie', setCookie(studentCookie(), credential, 604800));
        return json(res, 200, snapshot({ role: 'student', ...state.clients[hash(credential)] }));
      }
      const identity = identify(req);
      if (!identity) return json(res, 401, { error: 'Join this class first.' });
      if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, snapshot(identity));
      // Who is in this class, by the name they chose. No keys: this is the list a teacher
      // reads to find the student in front of them, and it is safe to leave on screen.
      if (req.method === 'GET' && url.pathname === '/api/families') {
        if (identity.role !== 'host') return json(res, 403, { error: 'Teacher access required.' });
        return json(res, 200, { families: Object.values(state.clients).map(client => ({ householdId: client.householdId, name: client.name })).sort((a, b) => a.householdId.localeCompare(b.householdId, 'en', { numeric: true })) });
      }
      // One family's key, asked for by name, one request at a time. A student who has lost
      // both their browser and their key is recovered here and nowhere else. It is a
      // separate request from the list precisely so that reading the list reveals nothing.
      if (req.method === 'GET' && url.pathname === '/api/family-key') {
        if (identity.role !== 'host') return json(res, 403, { error: 'Teacher access required.' });
        const wanted = url.searchParams.get('household');
        const client = Object.values(state.clients).find(entry => entry.householdId === wanted);
        if (!client) return json(res, 404, { error: 'No family in this class has that name.' });
        // ceiling: revealing a key is not recorded anywhere. An audit line belongs here if
        // a class ever needs to answer who was shown what.
        return json(res, 200, { householdId: client.householdId, name: client.name, familyKey: familyKey(client.householdId) });
      }
      // Static public geography, fetched once per class rather than per tick.
      if (req.method === 'GET' && url.pathname === '/api/map') return json(res, 200, { mapId: state.sessionId, map: projectMap(state.world) });
      // The part of the map a family choosing its house site changes (sim/homesite.mjs): the homesteads, the lanes in to
      // them and their fields. A few kilobytes, fetched when `mapRevision` moves, instead of the whole map again.
      if (req.method === 'GET' && url.pathname === '/api/map/homes') {
        const map = state.world.map;
        const sites = Object.fromEntries(Object.entries(map.sites).filter(([, site]) => site.kind === 'homestead' || site.hunting));
        const routes = Object.fromEntries(Object.entries(map.routes).filter(([, route]) => sites[route.to]));
        return json(res, 200, { mapId: state.sessionId, revision: map.revision || 0, sites: structuredClone(sites), routes: structuredClone(routes), fields: structuredClone(map.terrain.filter(feature => feature.kind === 'field')) });
      }
      // What a spot on the family's own land is like to set the house on, and the lane it would have. Only the family's
      // own holding, only while it is choosing: the refusal says so otherwise.
      // ceiling: laying the lane runs on the server's one thread, a tenth of a second or so for a long one. A class of
      // thirty choosing at once is a few seconds of it spread over the first minutes; a worker is the way out if that shows.
      // What ten acres surveyed here would be, or the plot here to clear or fence (`job`), on the family's own land only
      // (sim/survey.mjs).
      if (req.method === 'GET' && url.pathname === '/api/plot') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family surveys its land.' });
        const household = state.world.households[identity.householdId];
        const point = { x: Number(url.searchParams.get('x')), y: Number(url.searchParams.get('y')) }, job = url.searchParams.get('job');
        // Or what a hunt there would find (sim/hunting.mjs).
        return json(res, 200, { mapId: state.sessionId, facts: job === 'hunt-land' ? huntFacts(state.world, household, point) : job === 'fell-trees' ? fellFacts(state.world, household, point) : plotFacts(state.world, household, point, job) });
      }
      // One tile of the woods (sim/woods-view.mjs): the land itself, the same for everybody, so no family is needed to ask.
      if (req.method === 'GET' && url.pathname === '/api/woods') {
        // Many tiles of one level in one request (`tiles=tx,ty;tx,ty;...`): a view at middle distance needs dozens, and one
        // request each was 120-180 requests on every load of a class (docs/PERFORMANCE_LOAD.md).
        if (url.searchParams.has('tiles')) {
          const pairs = url.searchParams.get('tiles').split(';').filter(Boolean).map(pair => pair.split(',').map(Number));
          if (!pairs.length || pairs.length > WOODS_BATCH_MAX || pairs.some(pair => pair.length !== 2 || !pair.every(Number.isInteger))) return json(res, 400, { error: `Ask for 1 to ${WOODS_BATCH_MAX} whole-numbered tiles.` });
          const tiles = woodsTiles(state.world, url.searchParams.get('level'), pairs);
          if (tiles.every(tile => !tile)) return json(res, 404, { error: 'This class has no woods to show there.' });
          return json(res, 200, { mapId: state.sessionId, tiles });
        }
        const tile = woodsTile(state.world, url.searchParams.get('level'), Number(url.searchParams.get('tx')), Number(url.searchParams.get('ty')));
        if (!tile) return json(res, 404, { error: 'This class has no woods to show there.' });
        return json(res, 200, { mapId: state.sessionId, tile });
      }
      if (req.method === 'GET' && url.pathname === '/api/site') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family chooses where its house stands.' });
        const household = state.world.households[identity.householdId];
        const facts = siteFactsFor(state.world, household, { x: Number(url.searchParams.get('x')), y: Number(url.searchParams.get('y')) });
        return json(res, 200, { mapId: state.sessionId, facts });
      }
      // The list of work that exists never changes during a class; only who may do it
      // does, and that rides on the tick. Same reason the map is fetched once.
      if (req.method === 'GET' && url.pathname === '/api/chores') return json(res, 200, { mapId: state.sessionId, chores: choreCatalogue(), modes: modeCatalogue(), goods: GOODS, wagon: wagonCatalogue(), houses: houseCatalogue(), plot: plotCatalogue(), woods: woodsCatalogue() });
      // Who this family is. Theirs and nobody else's, so it is read from the identity on
      // the cookie rather than from anything the request could ask for.
      if (req.method === 'GET' && url.pathname === '/api/family') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family has a family.' });
        return json(res, 200, { mapId: state.sessionId, family: projectFamily(state.world, identity.householdId) });
      }
      if (req.method === 'GET' && url.pathname === '/api/events') {
        if ([...streams].filter(s => s.identity.role === identity.role && s.identity.householdId === identity.householdId).length >= 3) return json(res, 429, { error: 'Too many open tabs for this household.' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        const stream = { res, identity };
        streams.add(stream);
        if (identity.role === 'student') lastSeen.set(identity.householdId, Date.now());
        // The page that opened is shown the class at once; the others hear the count change with the next broadcast.
        if (!closing) send(stream);
        broadcastSoon();
        const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 15000);
        req.on('close', () => {
          clearInterval(heartbeat); streams.delete(stream);
          if (identity.role === 'student') lastSeen.set(identity.householdId, Date.now());
          broadcastSoon();
        });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/command') {
        const input = await body(req);
        if (typeof input.id !== 'string' || !/^[\w-]{8,80}$/.test(input.id)) return json(res, 400, { error: 'Command ID required' });
        const commands = identity.role === 'host' ? state.hostCommands : state.clients[identity.credentialHash].commands;
        if (commands.includes(input.id)) return json(res, 200, { ok: true, duplicate: true });
        let archived = null, rotatedSession = null, stopping = false, wantedPace = null;
        const priorSession = state.sessionId;
        commit(s => {
          if (identity.role === 'host') {
            if (input.action === 'start' && s.world.status === 'lobby') {
              // Five is the class this scenario is written for, and beginning with fewer is
              // usually a mistake - a teacher who has not noticed that half the room never
              // joined. It is not a technical requirement: the world always holds
              // `playerCount` households and the ones nobody joined simply take no orders.
              // So this is a guard with a way through rather than a wall, which is also what
              // makes it possible to try the thing out on one machine.
              const joined = Object.keys(s.clients).length;
              if (joined < 5 && !input.anyway) throw new Error(`Only ${joined} household${joined === 1 ? ' has' : 's have'} joined, and this class is built for five or more. Press Start again to begin anyway.`);
              // A student who joined and never rolled is rolled for, so every family somebody
              // is actually playing is a rolled one (docs/FAMILY_CREATION.md). One that has
              // already been named or set to work keeps the family it was working with.
              for (const client of Object.values(s.clients)) {
                const household = s.world.households[client.householdId];
                if (household && rollRefusal(s.world, household) === null) rollFamily(s.world, household);
              }
              s.world.status = 'running';
            } else if (input.action === 'pace') {
              // Not a world change: the pace is how fast the class watches, not what it
              // watches, so it is deliberately outside `commit`'s world and outside the save.
              // A class reopened tomorrow opens at the pace the build ships with.
              wantedPace = PACES[input.pace] || null;
              if (!wantedPace) throw new Error('Unknown pace');
            } else if (input.action === 'pause' && s.world.status === 'running') s.world.status = 'paused';
            else if (input.action === 'resume' && s.world.status === 'paused') s.world.status = runtimeFault?.resumeStatus || 'running';
            else if (input.action === 'end') s.world.status = 'ended';
            // The second class period (sim/periods.mjs): the same class carried on into the winter, never a new one.
            else if (input.action === 'next-period') beginNextPeriod(s.world);
            else if (input.action === 'new-class') {
              // Never discard a class that is still being played.
              if (!['lobby', 'ended'].includes(s.world.status)) throw new Error('End the current class before starting a new one.');
              // The archive copies the save on disk, which a class that ended on its own tick can trail by a few seconds.
              flush();
              archived = archiveSave(savePath, s.sessionId);
              s.sessionId = token().slice(0, 12);
              s.sessionCode = randomBytes(3).toString('hex').toUpperCase();
              s.clients = {}; s.hostCommands = [];
              // Class size is a kept setting; the seed is new so the next class is its own world.
              s.world = worldFactory(token().slice(0, 16), s.world.playerCount);
              rotatedSession = s.sessionId;
            } else if (input.action === 'stop-server') {
              if (!onStopRequested) throw new Error('This build cannot stop the server from the Host page. Stop it in the developer terminal.');
              // Checkpoint a real Pause first: a saved running class starts advancing on restart.
              if (s.world.status === 'running') s.world.status = 'paused';
              stopping = true;
            } else throw new Error('Host action unavailable');
          } else if (input.action === 'begin-solo') {
            // Play Solo has no teacher to press Start, so the player's own "Done packing" is the Start (owner,
            // 2026-09-21). Until then a solo game opened `running`, which meant the wagon and the stock choice - both
            // sent only in the lobby - never appeared at all, and a solo family silently held a labor of land where a
            // student in a class who drives stock in holds a league and a labor. The owner was playtesting a grant
            // nobody had chosen.
            //
            // Solo only, and lobby only. A class has a teacher and this is not another way to start one.
            if (!solo) throw new Error('Only the teacher starts a class.');
            if (s.world.status !== 'lobby') throw new Error('This game has already begun.');
            // The same courtesy the teacher's Start does: a family that never rolled is rolled for, so the family that
            // plays is a rolled one. There is no "five have joined" guard here - one player is the whole class.
            for (const client of Object.values(s.clients)) {
              const household = s.world.households[client.householdId];
              if (household && rollRefusal(s.world, household) === null) rollFamily(s.world, household);
            }
            s.world.status = 'running';
          } else {
            // The lobby is not dead time. A family may set its own people to work while
            // the class fills up, and none of it moves until the teacher starts; which
            // actions that means is `LOBBY_ACTIONS`, beside the actions themselves.
            if (!['running', 'lobby'].includes(s.world.status)) throw new Error('Wait until the class is running.');
            applyAction(s.world, identity.householdId, input);
          }
          const ledger = identity.role === 'host' ? s.hostCommands : s.clients[identity.credentialHash].commands;
          ledger.push(input.id); if (ledger.length > 256) ledger.shift();
        }, { actor: identity, when: identity.role === 'host' ? 'now' : 'order' });
        if (rotatedSession) {
          res.setHeader('Set-Cookie', [setCookie(`tr_host_${rotatedSession}`, state.hostKey, 604800), setCookie(`tr_host_${priorSession}`, '', 0)]);
          // Credentials belong to the archived class. End those streams so a previous
          // student cannot silently inherit a household in the new one.
          for (const stream of [...streams]) if (stream.identity.role === 'student') { streams.delete(stream); stream.res.end(); }
        }
        if (wantedPace) setPace(wantedPace);
        if (stopping) requestStop();
        return json(res, 200, { ok: true, ...(archived && { archived: basename(archived) }), ...(stopping && { stopping: true }) });
      }
      json(res, 404, { error: 'Not found' });
    } catch (error) { if (!res.headersSent) json(res, error.status || 400, { error: error.message }); else res.destroy(); }
  });
  function tick() {
    if (state.world.status !== 'running') return;
    // Play Solo's clock waits while the player's family is being made (sim/family.mjs `familyMaking`): the whole world, the
    // neighbours too, as a class waits in its lobby. Still 'running', so the die, the name and the looks are taken.
    if (solo && Object.values(state.clients).some(client => familyMaking(state.world, state.world.households[client.householdId]))) return;
    try { commit(s => { markAbsences(s.world); stepWorld(s.world); }, { when: 'tick' }); }
    catch (error) { if (!runtimeFault) suspend('SIMULATION_FAILED'); console.error('Simulation paused:', error.cause?.message || error.message); }
  }
  let timer = setInterval(tick, pace);
  /**
   * Change the pace of a running class.
   *
   * A teacher who is behind can speed the afternoon up and one who wants the class to watch
   * somebody walk can slow it down, and neither changes what happens. The interval is
   * rebuilt rather than adjusted because `setInterval` has no way to change its own period.
   */
  function setPace(milliseconds) {
    if (!Number.isInteger(milliseconds) || milliseconds < 10 || milliseconds > 10000) throw new Error('Pace must be 10–10000 milliseconds');
    pace = milliseconds;
    clearInterval(timer);
    timer = setInterval(tick, pace);
  }
  return {
    server,
    get state() { return structuredClone(state); },
    get savePath() { return savePath; },
    snapshot,
    requestStop,
    setPace,
    get pace() { return pace; },
    newSoloGame,
    async listen(port = 0, bind = '0.0.0.0') {
      // Whatever it is asked for, a solo server never listens beyond this computer.
      if (solo) bind = '127.0.0.1';
      try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, bind, resolve); }); return server.address().port; }
      catch (error) { clearInterval(timer); lease.release(); throw error; }
    },
    async close() {
      closing = true; clearInterval(timer); clearTimeout(broadcastTimer);
      // Whatever was shown and not yet written is written before the save is let go (`commit`).
      try { flush(); } catch (error) { console.error('The last changes could not be saved:', error.cause?.message || error.message); }
      for (const s of streams) s.res.destroy(); streams.clear();
      try { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
      finally { lease.release(); }
    },
  };
}
