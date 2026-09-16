import { markPlayed } from '../sim/neighbours.mjs';
import http from 'node:http';
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld, stepWorld, projectWorld, projectMap, applyAction, validateWorld, projectFamily, rollFamily } from '../sim/world.mjs';
import { rollRefusal } from '../sim/family.mjs';
import { choreCatalogue, modeCatalogue } from '../sim/chores.mjs';
import { GOODS } from '../sim/trade.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { plotFacts } from '../sim/survey.mjs';
import { wagonCatalogue } from '../sim/wagon.mjs';
import { houseCatalogue } from '../sim/houses.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';
import { woodsCatalogue, woodsTile } from '../sim/woods-view.mjs';
import { huntFacts } from '../sim/hunting.mjs';
import { fellFacts } from '../sim/felling.mjs';
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
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
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
  ['/ending.js', ['../public/ending.js', 'text/javascript']],
  ['/appearance.js', ['../public/appearance.js', 'text/javascript']],
  ['/field-art.js', ['../public/field-art.js', 'text/javascript']],
  ['/gonzales-art.js', ['../public/gonzales-art.js', 'text/javascript']],
  ['/landscape-art.js', ['../public/landscape-art.js', 'text/javascript']],
  ['/woods-view.js', ['../public/woods-view.js', 'text/javascript']],
  ['/house-plot.js', ['../public/house-plot.js', 'text/javascript']],
  ['/family-panel.js', ['../public/family-panel.js', 'text/javascript']],
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
    const content = readFileSync(path), etag = `"${hash(content)}"`;
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
    const extension = rawPath.slice(rawPath.lastIndexOf('.') + 1);
    res.writeHead(200, { 'Content-Type': assetTypes[extension], 'Content-Length': content.length });
    return res.end(content);
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

export function createClassroom({ seed = 'gonzales-1835', playerCount = 15, tickMs = 200, savePath, joinUrls = [], worldFactory = createWorld, onStopRequested = null, stopDelayMs = 250, solo = false } = {}) {
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
    writeSave(savePath, state);
  } catch (error) { lease.release(); throw error; }
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
    for (const [householdId, at] of lastSeen) if (!here.has(householdId) && now - at < AWAY_GRACE_MS) away++;
    return { here: here.size, away, joined: Object.keys(state.clients).length };
  }
  // Guessing a key is cheap to attempt, so attempting it becomes expensive. Per address,
  // in memory, and bounded by the number of devices that can reach a classroom LAN.
  // ceiling: one counter per remote address, so devices sharing one address share a
  // cooldown. True on a LAN where each device has its own; per-key counters if a class
  // ever arrives through a proxy.
  const REJOIN_TRIES = 5, REJOIN_COOLDOWN_MS = 30000;
  const rejoinTries = new Map();
  function identify(req) {
    const host = cookie(req, hostCookie());
    if (equal(host, state.hostKey)) return { role: 'host' };
    const credential = cookie(req, studentCookie());
    const client = credential && state.clients[hash(credential)];
    return client ? { role: 'student', ...client, credentialHash: hash(credential) } : null;
  }
  function snapshot(identity) {
    // `tickMs` rides along because the renderer has to know how long a tick lasts to
    // spread one tick's movement across it. Without it the client guesses one second and a
    // slower class walks for a second and then stands still for the rest of the tick.
    const payload = { revision: state.revision, sessionId: state.sessionId, connected: connected(), tickMs: pace, fault: runtimeFault && structuredClone(runtimeFault), lifecycle: lifecycle && structuredClone(lifecycle), world: projectWorld(state.world, identity.householdId, identity.role, { includeMap: false }), mapId: state.sessionId, ...(state.world.map.revision && { mapRevision: state.world.map.revision }), ...(state.world.woods?.revision && { woodsRevision: state.world.woods.revision }) };
    if (identity.role === 'host') Object.assign(payload, { sessionCode: state.sessionCode, joinUrls, canStop: Boolean(onStopRequested), presence: presence() });
    // A household is told its own key and no other. The Host page deliberately carries
    // none of them, because a teacher's screen is sometimes a projector.
    // A teacher can look one up from the Host page, one family at a time, through
    // /api/families and /api/family-key. That is deliberately not this payload.
    else if (identity.householdId) payload.familyKey = familyKey(identity.householdId);
    return payload;
  }
  function send(stream) {
    // Disconnect a slow receiver instead of retaining an unbounded snapshot queue.
    if (stream.res.writableLength > 1024 * 1024) { stream.res.destroy(); streams.delete(stream); return; }
    stream.res.write(`id: ${state.revision}\ndata: ${JSON.stringify(snapshot(stream.identity))}\n\n`);
  }
  const broadcast = () => { if (!closing) for (const stream of streams) send(stream); };
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
  function commit(mutate) {
    const previous = structuredClone(state);
    let persisting = false;
    try { mutate(state); validateWorld(state.world); state.revision++; persisting = true; writeSave(savePath, state); }
    catch (error) {
      state = previous;
      if (persisting) { suspend('SAVE_FAILED'); const unavailable = new Error(runtimeFault.message, { cause: error }); unavailable.status = 503; throw unavailable; }
      throw error;
    }
    runtimeFault = null;
    broadcast();
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
   * ceiling: a fresh game on every call and no archive of the last one; a solo save is a
   * scratch pad. "Continue the last solo game" is a reopen of the same save if it is ever wanted.
   */
  const SOLO_TICKET_MS = 120000;
  const soloTickets = new Map();
  function newSoloGame(name = 'Solo player') {
    if (!solo) throw new Error('This is not a solo playtest server.');
    if (lifecycle) throw new Error('This server is stopping.');
    const credential = token(), identity = { name, householdId: 'hh-1', commands: [] };
    commit(s => {
      s.sessionId = token().slice(0, 12);
      s.sessionCode = randomBytes(3).toString('hex').toUpperCase();
      s.hostCommands = [];
      s.world = worldFactory(token().slice(0, 16), s.world.playerCount);
      s.clients = { [hash(credential)]: identity };
      markPlayed(s.world, identity.householdId);
      // Rolled as Start rolls a joined family that never rolled (docs/FAMILY_CREATION.md).
      const household = s.world.households[identity.householdId];
      if (household && rollRefusal(s.world, household) === null) rollFamily(s.world, household);
      s.world.status = 'running';
    });
    // The last game's pages belong to a session that no longer exists.
    for (const stream of [...streams]) { streams.delete(stream); stream.res.end(); }
    // ceiling: one outstanding ticket at a time - a second new game voids the first's link.
    soloTickets.clear();
    const ticket = token();
    soloTickets.set(ticket, { credential, at: Date.now() });
    return { ticket, path: `/solo/enter?ticket=${ticket}`, householdId: identity.householdId, sessionId: state.sessionId };
  }
  const loopback = address => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
  const server = http.createServer(async (req, res) => {
    try {
      // A solo server is bound to loopback; this is the second lock on the same door.
      if (solo && !loopback(req.socket.remoteAddress)) return json(res, 403, { error: 'A solo playtest server answers only this computer.' });
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
      if (req.method === 'GET' && files.has(url.pathname)) {
        const [path, mime] = files.get(url.pathname);
        let content;
        try { content = readFileSync(fileURLToPath(new URL(path, import.meta.url))); }
        catch (error) { if (error.code === 'ENOENT') return json(res, 404, { error: 'Not found' }); throw error; }
        res.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8`, 'Cache-Control': 'no-store' });
        return res.end(content);
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
        if (!entry || Date.now() - entry.at > SOLO_TICKET_MS) return json(res, 403, { error: 'That solo link has been used or has expired. Press Play solo again.' });
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
      // A new solo game, asked for with the Host key the solo server wrote to its own data folder.
      if (solo && req.method === 'POST' && url.pathname === '/api/solo') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        const game = newSoloGame(typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 40) : undefined);
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
        const now = Date.now();
        for (const [seen, tries] of rejoinTries) if (now - tries.at >= REJOIN_COOLDOWN_MS) rejoinTries.delete(seen);
        const attempt = rejoinTries.get(address);
        if (attempt && attempt.count >= REJOIN_TRIES) return json(res, 429, { error: 'Too many tries. Wait ' + Math.ceil((REJOIN_COOLDOWN_MS - (now - attempt.at)) / 1000) + ' seconds, then try again.' });
        const found = supplied.length === KEY_LENGTH && Object.entries(state.clients).find(([, client]) => equal(familyKey(client.householdId), supplied));
        if (!found) {
          rejoinTries.set(address, { count: (attempt?.count || 0) + 1, at: now });
          return json(res, 403, { error: 'That family key does not match any family in this class. Check the letters and try again.' });
        }
        rejoinTries.delete(address);
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
        broadcast();
        const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 15000);
        req.on('close', () => {
          clearInterval(heartbeat); streams.delete(stream);
          if (identity.role === 'student') lastSeen.set(identity.householdId, Date.now());
          broadcast();
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
            else if (input.action === 'new-class') {
              // Never discard a class that is still being played.
              if (!['lobby', 'ended'].includes(s.world.status)) throw new Error('End the current class before starting a new one.');
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
          } else {
            // The lobby is not dead time. A family may set its own people to work while
            // the class fills up, and none of it moves until the teacher starts; which
            // actions that means is `LOBBY_ACTIONS`, beside the actions themselves.
            if (!['running', 'lobby'].includes(s.world.status)) throw new Error('Wait until the class is running.');
            applyAction(s.world, identity.householdId, input);
          }
          const ledger = identity.role === 'host' ? s.hostCommands : s.clients[identity.credentialHash].commands;
          ledger.push(input.id); if (ledger.length > 256) ledger.shift();
        });
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
    try { commit(s => stepWorld(s.world)); }
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
      closing = true; clearInterval(timer);
      for (const s of streams) s.res.destroy(); streams.clear();
      try { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
      finally { lease.release(); }
    },
  };
}
