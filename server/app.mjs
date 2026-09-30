import { markPlayed } from '../sim/neighbours.mjs';
import { record } from '../sim/events.mjs';
import http from 'node:http';
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { etagFor, fileFacts, notModified, pictureFor, PIN_LENGTH, PINNED_CACHE, REVALIDATE_CACHE, sendBody } from './delivery.mjs';
import { setAbsent } from '../sim/absence.mjs';
import { CALL_BUDGET_MS, DECISION_BUDGET_MS, QUESTION_BUDGETS, realTimeMeter } from '../sim/decision-budget.mjs';
import { createWorld, stepWorld, projectPage, projectMap, applyAction, validateWorld, projectFamily, rollFamily, errandFor, goingFor } from '../sim/world.mjs';
import { familyMaking, householdName, rollRefusal } from '../sim/family.mjs';
import { beginNextPeriod, continueEnded, endedEarly, periodOf } from '../sim/periods.mjs';
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
// The end-of-game flashback's videos, kept beside the save (docs/FLASHBACK.md): the routes are `/api/flashback/...` below.
import { bodyBytes, createFlashbackStore, flashbackPayload, scriptCache } from './flashback.mjs';
import { flashbackReady } from '../sim/flashback.mjs';
import { classSchedule } from './class-days.mjs';

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
  ['/work-art.js', ['../public/work-art.js', 'text/javascript']],
  ['/alamo-layout.js', ['../public/alamo-layout.js', 'text/javascript']],
  ['/alamo-faces.js', ['../public/alamo-faces.js', 'text/javascript']],
  ['/alamo-collapse.js', ['../public/alamo-collapse.js', 'text/javascript']],
  ['/bexar-layout.js', ['../public/bexar-layout.js', 'text/javascript']],
  ['/bexar-art.js', ['../public/bexar-art.js', 'text/javascript']],
  // The towns' layouts are the server's own data (sim/town-layouts.mjs): the page draws exactly the buildings the keepers stand in.
  ['/town-layouts.js', ['../sim/town-layouts.mjs', 'text/javascript']],
  ['/town-art.js', ['../public/town-art.js', 'text/javascript']],
  ['/place-art.js', ['../public/place-art.js', 'text/javascript']],
  // The interiors' spots and art (sim/interior-data.mjs): the page offers exactly the spots the server accepts.
  ['/interior-data.js', ['../sim/interior-data.mjs', 'text/javascript']],
  ['/interior.js', ['../public/interior.js', 'text/javascript']],
  ['/curve.js', ['../public/curve.js', 'text/javascript']],
  ['/map-base.js', ['../public/map-base.js', 'text/javascript']],
  ['/land-worker.js', ['../public/land-worker.js', 'text/javascript']],
  ['/smooth-worker.js', ['../public/smooth-worker.js', 'text/javascript']],
  ['/army-view.js', ['../public/army-view.js', 'text/javascript']],
  // The famous people on the map between their battles, named (docs/BATTLES.md §2c, sim/famous.mjs).
  ['/famous-view.js', ['../public/famous-view.js', 'text/javascript']],
  // The one battle renderer and the one speech bubble (docs/BATTLES.md §3): every fight drawn, every line said over its speaker.
  ['/battle-view.js', ['../public/battle-view.js', 'text/javascript']],
  // The famous people's poses on Claude's temporary sheets, behind Astra's (public/claude-person-art.js).
  ['/claude-person-art.js', ['../public/claude-person-art.js', 'text/javascript']],
  ['/chase-view.js', ['../public/chase-view.js', 'text/javascript']],
  // The game's sound, made by the page (docs/AUDIO.md): the mixer, the events heard, the effects and the music.
  ['/audio.js', ['../public/audio.js', 'text/javascript']], ['/audio-mix.js', ['../public/audio-mix.js', 'text/javascript']],
  ['/audio-cues.js', ['../public/audio-cues.js', 'text/javascript']], ['/audio-synth.js', ['../public/audio-synth.js', 'text/javascript']],
  ['/audio-music.js', ['../public/audio-music.js', 'text/javascript']],
  ['/speech.js', ['../public/speech.js', 'text/javascript']],
  ['/creation.js', ['../public/creation.js', 'text/javascript']],
  ['/ground-classes.js', ['../public/ground-classes.js', 'text/javascript']],
  ['/land-levels.js', ['../public/land-levels.js', 'text/javascript']],
  ['/ending.js', ['../public/ending.js', 'text/javascript']],
  // The end-of-game flashback, drawn and recorded on the Host's page and played on every page (docs/FLASHBACK.md).
  ['/flashback.js', ['../public/flashback.js', 'text/javascript']],
  ['/webm-writer.js', ['../public/webm-writer.js', 'text/javascript']],
  // The family's neighbours and help offered back between families (sim/neighbourly.mjs, owner 2026-09-28).
  ['/neighbours.js', ['../public/neighbours.js', 'text/javascript']],
  // The lone parent's path, as scenes over the whole screen (sim/courtship.mjs, owner 2026-09-29).
  ['/courtship.js', ['../public/courtship.js', 'text/javascript']],
  ['/appearance.js', ['../public/appearance.js', 'text/javascript']],
  ['/looks-art.js', ['../public/looks-art.js', 'text/javascript']],
  ['/avatar-art.js', ['../public/avatar-art.js', 'text/javascript']],
  ['/person-palette.js', ['../public/person-palette.js', 'text/javascript']],
  // What each of Claude's temporary frames shows, so art.js draws none of a subject Astra has drawn (owner, 2026-09-29).
  ['/art-subjects.js', ['../public/art-subjects.js', 'text/javascript']],
  ['/look-vocabulary.js', ['../sim/look-vocabulary.mjs', 'text/javascript']],
  ['/field-art.js', ['../public/field-art.js', 'text/javascript']],
  ['/field-surface.js', ['../public/field-surface.js', 'text/javascript']],
  ['/gonzales-art.js', ['../public/gonzales-art.js', 'text/javascript']],
  // Gonzales before the fight (sim/town-scenes.mjs) and the one speech bubble every scene that talks uses.
  ['/town-scenes.js', ['../public/town-scenes.js', 'text/javascript']],
  ['/speech.js', ['../public/speech.js', 'text/javascript']],
  // Ambient life (sim/ambient.mjs, docs/AMBIENT.md): the activities of the idle, the camps' men, a refuge's crowd and their talk.
  ['/ambient.js', ['../public/ambient.js', 'text/javascript']],
  ['/landscape-art.js', ['../public/landscape-art.js', 'text/javascript']],
  // The weather, drawn: rain, a norther, a storm, fog and high water (docs/WEATHER.md, public/weather-art.js).
  ['/weather-art.js', ['../public/weather-art.js', 'text/javascript']],
  ['/woods-view.js', ['../public/woods-view.js', 'text/javascript']],
  ['/house-plot.js', ['../public/house-plot.js', 'text/javascript']],
  // A house on the ground, as drawn and as checked (sim/house-footprint.mjs): the page draws the footprint the server refuses.
  // At its own path, so public/house-plot.js reaches it as `../sim/house-footprint.mjs` from the page and from node alike.
  ['/sim/house-footprint.mjs', ['../sim/house-footprint.mjs', 'text/javascript']],
  ['/family-panel.js', ['../public/family-panel.js', 'text/javascript']],
  ['/military-attention.js', ['../public/military-attention.js', 'text/javascript']],
  // The guided start, on the screen (docs/FAMILY_PANEL.md §12, public/lesson.js): what the server's `world.lesson` shuts,
  // points at and says. It decides nothing; the lesson itself is the world's.
  ['/lesson.js', ['../public/lesson.js', 'text/javascript']],
  // Tips at first meeting (owner, 2026-09-28; public/tips.js): the words, and when each thing has first appeared. Decides nothing.
  ['/tips.js', ['../public/tips.js', 'text/javascript']],
  // The errand to town, on the screen (docs/TOWNS.md §4b, public/errand.js): it draws the server's list and sends one order.
  ['/errand.js', ['../public/errand.js', 'text/javascript']],
  // How they will go, asked before anybody leaves (docs/FAMILY_PANEL.md §15, public/going.js): it draws the server's ways and
  // sends the one order with the way chosen.
  ['/going.js', ['../public/going.js', 'text/javascript']],
  // How the map answers a hand: pan, zoom, pinch, tap (docs/PERFORMANCE_NAVIGATION.md).
  ['/map-camera.js', ['../public/map-camera.js', 'text/javascript']],
  // The Host's live page in words (docs/HOST_PAGE.md); named off the /host prefix, which is the Host page itself.
  ['/live-page.js', ['../public/live-page.js', 'text/javascript']],
  // Coming back after the server was out of reach, and the teacher's class controls (2026-09-28).
  ['/reconnect.js', ['../public/reconnect.js', 'text/javascript']],
  ['/class-panel.js', ['../public/class-panel.js', 'text/javascript']],
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
    // Resolve links as well as the lexical path so a link cannot expose a save.
    const find = name => {
      try {
        const path = realpathSync(resolve(root, ...name.split('/')));
        return inside(root, path) && !relative(root, path).split(sep).some(part => part.startsWith('.')) && statSync(path).isFile() ? path : null;
      } catch (error) { if (['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP'].includes(error.code)) return null; throw error; }
    };
    const rel = rawPath.slice('/assets/'.length);
    // A picture may be answered by its WebP or its PNG (triage D14, server/delivery.mjs `pictureFor`); a manifest is itself.
    const manifest = rel.endsWith('.json') ? find(rel) : null;
    const picked = rel.endsWith('.json') ? manifest && { path: manifest, extension: 'json', pins: [] } : pictureFor(rel, find);
    if (!picked) return json(res, 404, { error: 'Not found' });
    const { path, extension, pins } = picked;
    const info = statSync(path);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) return json(res, 404, { error: 'Not found' });
    // The file's hash is remembered by size and time, so a 304 reads nothing off disk. Manifests are kept and gzipped once;
    // pictures are already compressed and are read per 200. A URL whose `v` is the start of the file's own SHA-256 (what
    // public/art.js asks for) names bytes that can never change, and the browser keeps it for a year without asking - and so
    // does one whose `v` is the start of the PNG a current WebP was made from.
    const compressible = extension === 'json';
    const facts = fileFacts(path, { keep: compressible, info });
    const version = new URL(req.url, 'http://asset').searchParams.get('v') || '';
    const etag = etagFor(req, facts, compressible);
    const pinned = version.length >= PIN_LENGTH && pins !== null && [facts.sha256, ...pins].some(sha => typeof sha === 'string' && sha.startsWith(version));
    res.setHeader('Cache-Control', pinned ? PINNED_CACHE : REVALIDATE_CACHE);
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
/** Whether `name` is one of the offered paces - its own key, never something every object has (`toString`). */
const paceNamed = name => typeof name === 'string' && Object.hasOwn(PACES, name);
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
/**
 * A page's event stream, and when it is let go (classroom audit M4, 2026-09-29).
 *
 * - `perFamily`: the streams one family (or the Host) may hold, one per tab or device. A page opened beyond it is never
 *   refused: the **oldest** of that family's streams is told `replaced` and closed, and that page says it is open somewhere
 *   else and stops asking, with a button to take it back. Until then the newest was refused (429), which the page read as a
 *   lost connection, so a fourth tab said *Reconnecting…* for ever and never why.
 * - `pingMs`: how often the server writes a `ping` naming the stream; the page answers each one (`POST /api/here`). The first
 *   is written as the stream opens.
 * - `staleMs`: a stream whose page has answered before and has not answered for this long is closed, in a class (never in
 *   Play Solo, whose page is on the same computer). A Chromebook put to sleep with its lid shut leaves its socket open on the
 *   server for many minutes - nothing fails until TCP gives up - so its family was missing from the away list and its claim
 *   refused (*"Someone is already playing that family"*) while its student stood at another device. Three missed answers is
 *   the gap: a page's answer is driven by the ping arriving, not by a timer the browser slows in a background tab.
 *
 * ceiling: a stream that has never answered is never judged, so a page from an older build, a test's bare stream or a
 * measuring script keeps its stream as before; a page that goes to sleep before its first answer (well under a second) is
 * let go when TCP gives up, as every page was until now.
 * ceiling: a tab whose script the browser really stops (a tab discarded or frozen to save energy, if its network callbacks
 * stop with it) is let go too, and its family shows away until it is looked at again, when it takes its stream back. A page
 * that cannot run is not being played. (Chrome's "frozen" page lifecycle, set by CDP in headless Chrome, still answered.)
 */
export const STREAMS = Object.freeze({ perFamily: 3, pingMs: 10000, staleMs: 30000 });
const SAVE_EVERY_TICKS = 3;
/** The solo player's own controls, sent from their page as orders (`/api/command`). */
const SOLO_CONTROLS = new Set(['solo-pause', 'solo-resume', 'solo-save']);
/** What every page is told when the teacher stops the class for today (Host's *Stop for today*, docs/HOST_PAGE.md §2.8). */
export const STOPPED_FOR_TODAY = 'Your teacher stopped the class for today. It was saved and paused just as it stands, and it goes on from here next class.';
/**
 * Play Solo looks after itself when its player goes (owner, 2026-09-27: "i shouldn't need to open the class view to pause,
 * save or shut down the server. i should be able to just X off the window and it'll automatically save, pause, and shut
 * down"). The player's page holds an event stream open for as long as it is open; when the last one closes - the window's
 * X, the launcher closed, the window or its browser killed, Windows logging off - the game is paused and written at once,
 * and if no page of the player's has come back `leaveMs` later the server stops itself as the Host's Stop does.
 *
 * - `leaveMs`: after the player's page closes. Long enough for a reload or the window going to a new game, which close the
 *   stream and open it again within a second or two; the game is paused and on the disk for all of it, and runs again the
 *   moment the page is back.
 * - `enterMs`: after a game is dealt or continued (`POST /api/solo`) and no page has opened it - its one-use ticket's life.
 * - `chooseMs`: after the launcher asked for the list of saved games, which it does before asking New game or Continue. A
 *   player reading that list is not a player who has gone.
 *
 * Only the real solo server watches (server/main.mjs passes `soloWatch`); a class never does, and a class's student closing
 * a window changes nothing but their presence (docs/HOST_PAGE.md).
 * ceiling: a player whose page stays open but who has walked away is still here; the Pause on their page is for that.
 */
export const SOLO_WATCH = Object.freeze({ leaveMs: 30000, enterMs: 120000, chooseMs: 600000 });
/**
 * A class left running with nobody in it pauses itself (owner, 2026-09-29, by multiple choice: **"Pause after 3 min"**;
 * triage 1.1, classroom audit S1, design audit S1). A teacher who leaves at the bell without Pause or *Stop for today* left a
 * class that played itself: every family went to the director and people died with no student watching. Now, once no
 * student's page has been open for three real minutes while the class runs, it is paused, the Host's record says so, and
 * the Host's page says why (`emptyPaused`) until the teacher's own Resume. A class in its lobby is not running and never
 * pauses; a running class that no student has opened yet does, three minutes after it began running. The teacher's Host
 * page does not count: it is a projector as often as it is a teacher.
 *
 * Only the real classroom server watches (server/main.mjs passes `emptyPauseMs`), as only the real solo server watches its
 * player: the in-process classes of the tests and browser proofs are never paused from under them. Play Solo has its own
 * watch and never this one. ceiling: presence is the page's stream alone (docs/HOST_PAGE.md §4), so a room of open
 * Chromebooks whose students have gone keeps a class running; the "!" counts on the class panel are what tell a teacher that.
 */
export const EMPTY_PAUSE_MS = 180000;

/** The most woods tiles one request may ask for. */
export const WOODS_BATCH_MAX = 64;
/**
 * `now` is the server's real clock and `lessonResumeMs` the window after the X on the guided start (sim/lesson.mjs
 * `LESSON_RESUME_MS`, five minutes when not given). Both are options only so a test or a browser proof can hold the clock,
 * jump it, or shorten the window; a real class passes neither.
 */
export function createClassroom({ seed = 'gonzales-1835', playerCount = 15, tickMs = 200, savePath, joinUrls = [], worldFactory = createWorld, onStopRequested = null, stopDelayMs = 250, solo = false, absentMs = ABSENT_MS, soloGamesDir = null, timings = null, saveWithinMs = SAVE_WITHIN_MS, decisionBudgetMs = DECISION_BUDGET_MS, callBudgetMs = CALL_BUDGET_MS, questionBudgets = null, now = Date.now, lessonResumeMs, soloWatch = null, flashbackDir, streamTimings = STREAMS, emptyPauseMs = null } = {}) {
  const { perFamily: streamsPerFamily, pingMs: streamPingMs, staleMs: streamStaleMs } = { ...STREAMS, ...streamTimings };
  if (!Number.isInteger(streamsPerFamily) || streamsPerFamily < 1 || !(streamPingMs > 0) || !(streamStaleMs > streamPingMs)) throw new Error('Stream timings must be a positive count, a ping and a longer stale time');
  if (!Number.isInteger(playerCount) || playerCount < 5 || playerCount > 30) throw new Error('Class size must be 5–30');
  if (!Number.isFinite(decisionBudgetMs) || decisionBudgetMs <= 0) throw new Error('A decision budget must be a positive number of milliseconds');
  if (!Number.isFinite(callBudgetMs) || callBudgetMs <= 0) throw new Error('A call budget must be a positive number of milliseconds');
  // The real-time limits of a student's rider, order to leave, road question, ¡Alto! and work question (owner, 2026-09-29;
  // sim/decision-budget.mjs `QUESTION_BUDGETS`): any of them may be shortened, for a browser proof that cannot wait minutes.
  for (const [kind, ms] of Object.entries(questionBudgets || {})) {
    if (!(kind in QUESTION_BUDGETS) || !Number.isFinite(ms) || ms <= 0) throw new Error(`A question budget must be a positive number of milliseconds for one of ${Object.keys(QUESTION_BUDGETS).join(', ')}`);
  }
  // The real seconds between running ticks, for the budget of an unanswered military question (sim/decision-budget.mjs).
  // Forgotten whenever a tick does not run, so a Host's pause is never counted against anybody's answer.
  const realTime = realTimeMeter({ now });
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
  // A lock left by a server that certainly stopped was taken over and the save backed up (server/storage.mjs); said here so
  // the log and the Host's page can tell the teacher the class opened after an unclean stop.
  const recoveredLock = lease.recovered || null;
  let state;
  try {
    state = readSave(savePath) || { saveVersion: 3, revision: 0, hostKey: token(), sessionId: token().slice(0, 12), sessionCode: randomBytes(3).toString('hex').toUpperCase(), clients: {}, hostCommands: [], world: worldFactory(seed, playerCount) };
    validateWorld(state.world);
  } catch (error) { lease.release(); throw error; }
  // The pace the teacher chose is the class's own and comes back with it (classroom audit M1 / design audit M1, 2026-09-29): a
  // class set to Brisk yesterday is Brisk today. `state.pace` is the name ('study', 'brisk', 'quick'); a class that never chose
  // one, and every save written before this, has none and opens at the server's own pace, which the launcher sets to Study
  // (server/main.mjs). No `saveVersion` move: nothing is reinterpreted, and the missing field's value is the right one.
  if (paceNamed(state.pace)) pace = PACES[state.pace];
  /**
   * Which map a page holds. The session's id, as it always was, and a count after it once the class size has been changed
   * in the lobby (`class-size`), which deals a new world with the same session - so a page drops the map it fetched.
   * `state.deal` is absent on every class never resized, whose map id is exactly what it was.
   */
  const mapKey = () => state.deal ? `${state.sessionId}.${state.deal}` : state.sessionId;
  // The last committed class as its save text, and the last one written (`commit`).
  let committed;
  try {
    committed = JSON.stringify(state);
    writeSave(savePath, committed);
  } catch (error) { lease.release(); throw error; }
  let durable = committed, unsavedTicks = 0, saveTimer = null;
  // The flashback videos (server/flashback.mjs): in `flashbacks/` beside the save, a folder a class. A server with no save keeps
  // none unless it is given a folder, and its pages are told so.
  const flashbacks = createFlashbackStore(flashbackDir !== undefined ? flashbackDir : savePath ? join(dirname(savePath), 'flashbacks') : null);
  const flashbackScriptsOf = scriptCache();
  // Cookies are host/path scoped, not port scoped; separate class namespaces prevent
  // collisions. A new class rotates the session ID, so the names are read per request.
  const hostCookie = () => `tr_host_${state.sessionId}`, studentCookie = () => `tr_student_${state.sessionId}`;
  const setCookie = (name, value, maxAge) => `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
  // Faults and lifecycle notices are transient runtime overlays, explicitly separate from durable state.
  let runtimeFault = null;
  let lifecycle = null;
  let closing = false;
  const streams = new Set();
  /**
   * A page let go because the same family opened another beyond `STREAMS.perFamily`: told `replaced`, so it says it is open
   * somewhere else and stops asking (public/app.js), rather than reconnecting and letting the next one go in its turn. Ending
   * the response runs its 'close' (the presence and the heartbeat), as a page closing its tab does.
   */
  function replaceStream(old) {
    streams.delete(old);
    try { old.res.write('event: replaced\ndata: {}\n\n'); old.res.end(); } catch { old.res.destroy(); }
  }
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
  // A class left running with nobody in it (`pauseIfEmpty`, below): since when, and why it paused itself.
  let emptySince = null, emptyPaused = null;
  /**
   * Presence begins again with every launch, and a family's absence must not be forgotten with it (classroom audit
   * 2026-09-28, with *Stop for today*, docs/HOST_PAGE.md §2.8): with nothing seen, `markAbsences` counted every joined family
   * present - a family saved absent was handed back to a student who is not there, and the director stopped running it while
   * its questions held the class. So each joined family is counted as last seen at launch, and one saved absent as gone for the
   * whole grace already: it stays absent until its page opens, and a family whose student does not come back is absent the
   * grace after the class resumes, as it would have been had the server never stopped.
   */
  function seedPresence() {
    lastSeen.clear();
    const launched = Date.now();
    for (const client of Object.values(state.clients)) {
      if (client.householdId) lastSeen.set(client.householdId, state.world.households[client.householdId]?.absent ? launched - absentMs : launched);
    }
  }
  seedPresence();
  const streaming = () => new Set([...streams].filter(s => s.identity.role === 'student').map(s => s.identity.householdId));
  const connected = () => streaming().size;
  function presence() {
    const here = streaming(), now = Date.now();
    let away = 0;
    const households = {}, students = {};
    for (const client of Object.values(state.clients)) {
      const id = client.householdId;
      if (!id) continue;
      // The student's own name on the family's row (owner, 2026-09-29: "Show name + ready"). The Host alone is sent presence.
      students[id] = client.name;
      const at = lastSeen.get(id);
      // 'absent' is the world's word (sim/absence.mjs): the family is being run for. It outranks the grace.
      households[id] = here.has(id) ? 'here' : state.world.households[id]?.absent ? 'absent' : at !== undefined && now - at < AWAY_GRACE_MS ? 'away' : 'gone';
      if (households[id] === 'away') away++;
    }
    return { here: here.size, away, joined: Object.keys(state.clients).length, households, students };
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
  /**
   * The class code as a student types it (classroom audit M2, 2026-09-29). Codes are six hex symbols (`sessionCode`), so a
   * letter O can only be a zero and an I or an L only a one; they are read as those, with the case and any spaces forgiven,
   * at every door that asks for the code (the join, the away list and the claim). A code dealt before this reads exactly as
   * it did: hex has no O, I, L or space in it.
   */
  const readCode = value => String(value ?? '').replace(/\s+/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  const codeMatches = value => readCode(value) === readCode(state.sessionCode);
  /** Two display names that a class would take for the same student: the same letters, in any case, however spaced. */
  const sameName = (a, b) => String(a ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase() === String(b ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  /** One line on the class's own public record, which is what the Host page reads (`projectWorld`, role 'host'). */
  const tellClass = (world, text) => record(world, 'presence', { visibility: 'public', importance: 2, claimId: 'FIC-GONZ-186', text });
  /**
   * Who may take which family (2026-09-28, docs/audits/2026-09-28-classroom.md B1 and B2). A class has `playerCount` families
   * and a student plays one; the rest are the neighbours' director's (sim/neighbours.mjs). A student who joins in the lobby
   * takes the first family nobody holds. **A student who joins after Start** - late, or absent on the first day of a game
   * that takes several class days - takes the family the teacher named on the Host's page (`lateSeat`: a family nobody
   * plays, or one whose student is not here), or else the first family nobody plays. Either way the family is theirs from
   * then on (`markPlayed`), exactly as if they had joined in the lobby, and the class is told on its public record.
   *
   * A family with nobody left alive or free in it is not offered: there is nothing in it to play.
   * ceiling: a latecomer is never given the guided start once their family has arrived (docs/LESSON.md §6's own ceiling);
   * a family taken while still on the road is walked through it as any family is.
   */
  const householdNumber = id => Number(String(id).split('-').at(-1)) || 0;
  const livingIn = household => household.members.some(id => {
    const person = state.world.entities[id];
    return person && !['dead', 'captured'].includes(person.health?.condition);
  });
  const heldBy = () => new Map(Object.entries(state.clients).map(([credentialHash, client]) => [client.householdId, { ...client, credentialHash }]));
  const familyWords = household => { const name = householdName(state.world, household); return name[0].toUpperCase() + name.slice(1); };
  /** Families a student joining now could be given, for the Host's choice: nobody's (`free`) and those whose student is not here. */
  function seats() {
    const held = heldBy(), here = streaming(), marks = presence().households;
    const open = [];
    for (const household of Object.values(state.world.households).sort((a, b) => householdNumber(a.id) - householdNumber(b.id))) {
      if (!livingIn(household)) continue;
      const client = held.get(household.id);
      if (!client && !household.played) open.push({ householdId: household.id, family: familyWords(household), kind: 'free' });
      else if (client && !here.has(household.id)) open.push({ householdId: household.id, family: familyWords(household), kind: 'student-away', student: client.name, presence: marks[household.id] || 'gone' });
    }
    return open;
  }
  /** The family a student joining now is given, and the credential it takes over (a student who is not here), or null. */
  function seatFor(late) {
    const held = heldBy(), here = streaming();
    if (late && state.lateSeat) {
      const household = state.world.households[state.lateSeat], client = held.get(state.lateSeat);
      if (household && livingIn(household) && (client ? !here.has(household.id) : !household.played)) return { householdId: household.id, previous: client || null };
    }
    const free = Object.values(state.world.households).sort((a, b) => householdNumber(a.id) - householdNumber(b.id))
      .find(household => !held.has(household.id) && !household.played && livingIn(household));
    return free ? { householdId: free.id, previous: null } : null;
  }
  /**
   * **The classes kept on this computer** (2026-09-28, the classroom audit's B6: a teacher with several sections). The class
   * being played is the save (`classroom.json`, which the launcher reads and the lock guards), exactly as before. Every other
   * class is kept in `classes/<session>.json` beside it: written when **New Class** or **Open** puts another class in its
   * place, and read back when the teacher opens it again from the Host's page. A class opened again is the same class - its
   * code, its families, its students' credentials and family keys (derived from this computer's Host key and the class's own
   * session, so they are the same keys) - paused where it was left.
   *
   * Only the server holding the save's lock writes here, so the one lock guards the shelf as well. A class that is open is
   * listed from memory; its own file on the shelf, if it has one, is the copy from when it was last put away, and is written
   * over the next time it is. A class nobody joined and nobody named is not kept: it is what a New Class leaves behind.
   * Play Solo never keeps classes (it has its own saved games).
   * ceiling: nothing is ever removed from the shelf by the game; a class no longer wanted is deleted by hand, with the
   * server stopped. A Delete beside each class is the way out if a teacher's list grows long.
   */
  const shelfDir = !solo && savePath ? join(dirname(savePath), 'classes') : null;
  const CLASS_ID = /^[\w-]{6,40}$/;
  const className = value => typeof value === 'string' && value.trim() ? value.trim().replace(/\s+/g, ' ').slice(0, 40) : null;
  function shelve(s) {
    if (!shelfDir || (!Object.keys(s.clients).length && !s.className)) return null;
    const path = join(shelfDir, `${s.sessionId}.json`);
    writeSave(path, { ...s, shelvedAt: new Date().toISOString() });
    return path;
  }
  /**
   * Take a kept class off the list: its save moved (not copied) to `archive/classes-<session>-deleted-<time>.json` and its
   * flashbacks, if any, to `archive/classes-<session>-deleted-<time>-flashbacks/`. The session id stays in the name, which is
   * what putting it back needs (docs/RECOVERY.md). Returns where each went, relative to the class data folder.
   */
  function deleteKept(classId) {
    const from = join(shelfDir, `${classId}.json`);
    if (!existsSync(from)) throw new Error('That saved class is not there.');
    const home = dirname(savePath), folder = join(home, 'archive');
    mkdirSync(folder, { recursive: true });
    const base = `classes-${classId}-deleted-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const save = join(folder, `${base}.json`);
    renameSync(from, save);
    shelfSummaries.delete(`${classId}.json`);
    const videos = flashbacks.moveTo(classId, join(folder, `${base}-flashbacks`));
    return { save: relative(home, save).split(sep).join('/'), ...(videos && { flashbacks: relative(home, videos).split(sep).join('/') }) };
  }
  /** One line of the Host's list of classes: its name, code, size, and where in 1835-36 it was left. */
  function classSummary(saved, savedAt, open) {
    const world = saved.world;
    const at = world.status === 'lobby' ? null : dateOf(world, world.minute);
    return {
      id: saved.sessionId, name: saved.className || null, code: saved.sessionCode, open,
      families: world.playerCount, joined: Object.keys(saved.clients || {}).length, status: world.status, period: periodOf(world), continuable: endedEarly(world),
      date: at && `${MONTH_NAMES[at.getUTCMonth()]} ${at.getUTCDate()}, ${at.getUTCFullYear()}`, savedAt,
    };
  }
  // A shelved class can be ten megabytes; each is read once and remembered by its size and time.
  const shelfSummaries = new Map();
  function classList() {
    const listed = new Map();
    let files = [];
    try { files = readdirSync(shelfDir).filter(file => file.endsWith('.json')); } catch { /* nothing kept yet */ }
    for (const file of files) {
      const path = join(shelfDir, file);
      try {
        const info = statSync(path);
        let known = shelfSummaries.get(file);
        if (!known || known.mtimeMs !== info.mtimeMs || known.size !== info.size) {
          const saved = JSON.parse(readFileSync(path, 'utf8'));
          const summary = saved?.world && CLASS_ID.test(saved.sessionId || '') && `${saved.sessionId}.json` === file ? classSummary(saved, saved.shelvedAt || info.mtime.toISOString(), false) : null;
          known = { mtimeMs: info.mtimeMs, size: info.size, summary };
          shelfSummaries.set(file, known);
        }
        if (known.summary) listed.set(known.summary.id, known.summary);
      } catch { /* a file that cannot be read is not offered */ }
    }
    listed.set(state.sessionId, classSummary(state, new Date().toISOString(), true));
    return [...listed.values()].sort((a, b) => Number(b.open) - Number(a.open) || b.savedAt.localeCompare(a.savedAt));
  }
  /** Size of a class the teacher asked for, or the refusal in words. */
  function classSize(value) {
    const size = Number(value);
    if (!Number.isInteger(size) || size < 5 || size > 30) throw new Error('A class has 5 to 30 families.');
    return size;
  }
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
    const payload = { sessionId: state.sessionId, connected: connected(), tickMs: pace, fault: runtimeFault && structuredClone(runtimeFault), lifecycle: lifecycle && structuredClone(lifecycle), world: projectPage(state.world, identity.householdId, identity.role, { includeMap: false, copy, now: now() }), mapId: mapKey(), ...(state.world.map.revision && { mapRevision: state.world.map.revision }), ...(state.world.woods?.revision && { woodsRevision: state.world.woods.revision }) };
    // A page has to know it is a solo game: there is no teacher on it, so its own "Done packing" is the Start
    // (owner, 2026-09-21). One boolean rather than a role of its own - a solo player is a student in every other way.
    if (solo) payload.solo = true;
    // The end-of-game flashbacks: which are made, for the Host every family's and for a student their own (server/flashback.mjs).
    Object.assign(payload, flashbackPayload(flashbacks, state.sessionId, state.world, identity));
    // The class's size, name, the families a late student could take and how many class days the game takes (2026-09-28).
    if (identity.role === 'host') Object.assign(payload, {
      sessionCode: state.sessionCode, joinUrls, canStop: Boolean(onStopRequested), presence: presence(),
      classSize: state.world.playerCount, className: state.className || null, keepsClasses: Boolean(shelfDir),
      lateSeat: state.lateSeat || null, seats: seats(), schedule: classSchedule(state.world, PACES),
      ...(recoveredLock && { recoveredLock: { reason: recoveredLock.reason, backup: recoveredLock.backup && basename(recoveredLock.backup) } }),
      // Why the class is paused, when it paused itself with nobody in it (`pauseIfEmpty`, owner 2026-09-29).
      ...(emptyPaused?.sessionId === state.sessionId && state.world.status === 'paused' && { emptyPaused: { at: emptyPaused.at, ms: emptyPaused.ms } }),
    });
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
  function requestStop(message = null) {
    if (lifecycle) return false;
    clearTimeout(soloTimer); soloTimer = null;
    lifecycle = { state: 'stopping', message: message || (solo
      ? 'Play Solo stopped. Your game was saved and paused: press Play Solo on the launcher and choose Continue to go on.'
      : 'Your teacher stopped the classroom server. The class was saved and paused; it continues when the server is opened again.') };
    broadcast();
    setTimeout(() => { try { onStopRequested?.(); } catch (error) { console.error('Stop request failed:', error.message); } }, stopDelayMs).unref();
    return true;
  }
  /**
   * The solo server's watch on its player (`SOLO_WATCH`). Off unless this is a solo server that can stop itself and was
   * given a watch: the in-process classrooms of the tests and browser proofs are never stopped from under them.
   */
  const watch = solo && soloWatch && onStopRequested ? { ...SOLO_WATCH, ...soloWatch } : null;
  let soloTimer = null, soloAwayPaused = false;
  const playerHere = () => [...streams].some(stream => stream.identity.role === 'student');
  /** Stop in `ms` unless the player's page has opened by then. */
  function soloExpect(ms) {
    if (!watch || lifecycle || closing) return;
    clearTimeout(soloTimer);
    soloTimer = setTimeout(soloGone, ms);
    soloTimer.unref();
  }
  /** Nobody came back: saved and paused, then the same graceful stop as the Host's. */
  function soloGone() {
    soloTimer = null;
    if (playerHere() || lifecycle || closing) return;
    // The stop writes the game (`close`), paused, as every stop of a solo server does.
    console.log('Play Solo: the player\'s page has gone. Saving the game paused and stopping.');
    requestStop();
  }
  /** The player's last page has closed: pause and write at once, then wait `leaveMs` for it to come back. */
  function soloLeft() {
    if (!watch || lifecycle || closing || playerHere()) return;
    try {
      if (state.world.status === 'running') { commit(s => { s.world.status = 'paused'; }); soloAwayPaused = true; }
      else flush();
      // Said once it is on the disk, with the time, which is what the proofs read rather than racing the save file for it.
      console.log(`Play Solo: the player's page closed; the game is saved (${state.world.status}, revision ${state.revision}) at ${new Date().toISOString()}.`);
    } catch (error) { console.error('Play Solo could not save when its page closed:', error.cause?.message || error.message); }
    soloExpect(watch.leaveMs);
  }
  /** A page of the player's has opened: nothing is stopping, and a game paused only because the page went goes on. */
  function soloCame() {
    if (!watch) return;
    clearTimeout(soloTimer); soloTimer = null;
    if (!soloAwayPaused || lifecycle || closing) return;
    soloAwayPaused = false;
    try { if (state.world.status === 'paused' && !runtimeFault) commit(s => { s.world.status = 'running'; }); }
    catch (error) { console.error('Play Solo could not go on when its page came back:', error.cause?.message || error.message); }
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
    soloAwayPaused = false;
    if (id === state.sessionId && Object.keys(state.clients).length) {
      identity = { ...Object.values(state.clients)[0], commands: [] };
      commit(s => { s.clients = { [hash(credential)]: identity }; if (s.world.status === 'running') s.world.status = 'paused'; });
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
        // A continued game opens paused, where it was left, and goes on when the player presses Resume on their own page
        // (2026-09-27; until then it opened running, because only the class view could resume it). A game saved running -
        // kept when another took its place, or left by a server that was killed - opens paused too. An ended one is shown as
        // it ended, and one still in its lobby waits for Done packing as it did.
        if (s.world.status === 'running') s.world.status = 'paused';
      });
    }
    return soloEntry(credential, identity.householdId);
  }
  function newSoloGame(name = 'Solo player') {
    if (!solo) throw new Error('This is not a Play Solo server.');
    if (lifecycle) throw new Error('This server is stopping.');
    const credential = token(), identity = { name, householdId: 'hh-1', commands: [] };
    soloAwayPaused = false;
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
      // A family's flashback, sent by the page that recorded it (docs/FLASHBACK.md §5): a WebM body rather than JSON, so it is
      // taken before the JSON rule below and held to the same origin rule itself.
      if (req.method === 'POST' && url.pathname === '/api/flashback/video') {
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res, 403, { error: 'Same-origin requests only' });
        if (!req.headers['content-type']?.startsWith('video/webm')) return json(res, 415, { error: 'A WebM video is required.' });
        const identity = identify(req);
        if (!identity) return json(res, 401, { error: 'Join this class first.' });
        const householdId = url.searchParams.get('household') || '';
        if (!state.world.households[householdId]) return json(res, 404, { error: 'No such family.' });
        // The teacher's computer makes them; on Play Solo the player's computer is the teacher's, and makes its own.
        if (identity.role !== 'host' && !(solo && identity.householdId === householdId)) return json(res, 403, { error: 'Only the teacher’s computer makes the flashbacks.' });
        if (!flashbackReady(state.world)) return json(res, 409, { error: 'The class has not ended.' });
        const bytes = await bodyBytes(req);
        const version = Number(url.searchParams.get('version')), madeMs = Number(url.searchParams.get('madeMs'));
        const note = flashbacks.save(state.sessionId, householdId, bytes, { ...(Number.isInteger(version) && version > 0 && { scriptVersion: version }), ...(Number.isFinite(madeMs) && { madeMs }) });
        broadcast();
        return json(res, 200, { ok: true, ...note });
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
        // The launcher is about to ask New game or Continue: the player is choosing, not gone (`SOLO_WATCH`).
        if (watch && !playerHere()) soloExpect(watch.chooseMs);
        return json(res, 200, { games: soloGames() });
      }
      // One saved solo game set aside, from the trash can beside it in the Play Solo menu (owner, 2026-09-21).
      if (solo && req.method === 'POST' && url.pathname === '/api/solo/games/delete') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        if (watch && !playerHere()) soloExpect(watch.chooseMs);
        return json(res, 200, deleteSoloGame(input.id));
      }
      // A new solo game, or a saved one continued, asked for with the Host key the solo server wrote to its own data folder.
      if (solo && req.method === 'POST' && url.pathname === '/api/solo') {
        const input = await body(req);
        if (!equal(input.key, state.hostKey)) return json(res, 403, { error: 'Host key required.' });
        const game = input.continue !== undefined
          ? continueSoloGame(input.continue)
          : newSoloGame(typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 40) : undefined);
        // Its page is on its way (the one-use ticket); if it never opens, nobody is playing (`SOLO_WATCH`).
        if (watch && !playerHere()) soloExpect(watch.enterMs);
        return json(res, 200, { playUrl: `http://127.0.0.1:${server.address().port}${game.path}`, householdId: game.householdId, sessionId: game.sessionId });
      }
      if (req.method === 'POST' && url.pathname === '/api/join') {
        const input = await body(req);
        const existing = identify(req);
        if (existing?.role === 'student') return json(res, 200, snapshot(existing));
        if (state.world.status === 'ended') return json(res, 409, { error: 'This class has ended. Ask your teacher which class to join.' });
        if (!codeMatches(input.code)) return json(res, 403, { error: 'Check the class code on the Host screen.' });
        const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
        if (!name) return json(res, 400, { error: 'Choose a display name.' });
        // After Start a student still joins (2026-09-28, the classroom audit's B2): into the family the teacher chose, or the
        // first one nobody plays (`seatFor`). Until then a latecomer, or anybody absent on the first day, was refused for good.
        const late = state.world.status !== 'lobby';
        const seat = seatFor(late);
        if (!seat) return json(res, 409, { error: late
          ? `Every family in this class already has a student. Ask your teacher to choose a family for you on the Host's page.`
          : `This class is full: all ${state.world.playerCount} families have a student. Ask your teacher to make the class bigger.` });
        // One name, one student (classroom audit M3, 2026-09-29). The name is how a student finds their own family again on
        // the away list (`/api/away`), so two called "Sam" meant either could take the other's. Refused here, at the join, in
        // any letter case and spacing. A student coming back is never refused: one with their cookie was answered above, one
        // without it comes back through the away list or the family key, which never pass this way; and the one student whose
        // family this seat takes over - the teacher giving a returning latecomer their own family back - is signed out by it.
        const taken = Object.entries(state.clients).find(([credentialHash, client]) => credentialHash !== seat.previous?.credentialHash && sameName(client.name, name));
        if (taken) return json(res, 409, { error: `${taken[1].name} is taken — add your last initial. If you were already in this class, choose “I was already in this class” and tap your name.` });
        const credential = token();
        const identity = { name, householdId: seat.householdId, commands: [] };
        // A family a student joins is theirs for good: the neighbour director never runs it again (sim/neighbours.mjs).
        commit(s => {
          // Taking over a family whose student is not here signs that student's old device out, as a family key does.
          if (seat.previous) delete s.clients[seat.previous.credentialHash];
          s.clients[hash(credential)] = identity;
          markPlayed(s.world, identity.householdId);
          if (s.lateSeat === identity.householdId) s.lateSeat = null;
          if (late) {
            const household = s.world.households[identity.householdId];
            setAbsent(s.world, household, false);
            tellClass(s.world, seat.previous
              ? `${name} joined the class and is playing ${householdName(s.world, household)}, which was ${seat.previous.name}'s.`
              : `${name} joined the class late and is playing ${householdName(s.world, household)}.`);
          }
        });
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
        if (!codeMatches(asked.code)) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }
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
        if (!codeMatches(asked.code)) { countRejoinTry(address); return json(res, 403, { error: 'Check the class code on the Host screen.' }); }
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
      // The flashback (docs/FLASHBACK.md): a family's script, which the page that makes the video draws, and the video itself. The
      // Host any family's; a student their own and no other. Nothing before the class has ended for good.
      if (req.method === 'GET' && (url.pathname === '/api/flashback/script' || url.pathname === '/api/flashback/video')) {
        const householdId = url.searchParams.get('household') || identity.householdId || '';
        if (identity.role !== 'host' && householdId !== identity.householdId) return json(res, 403, { error: 'Only your own family’s flashback.' });
        if (!state.world.households[householdId]) return json(res, 404, { error: 'No such family.' });
        if (!flashbackReady(state.world)) return json(res, 409, { error: 'The class has not ended.' });
        if (url.pathname === '/api/flashback/video') return flashbacks.serve(req, res, state.sessionId, householdId);
        const script = flashbackScriptsOf(state.world)[householdId];
        if (url.searchParams.get('part') === 'transcript') return json(res, 200, { householdId, name: script.name, beats: script.beats.map(beat => ({ date: beat.date, caption: beat.caption, ...(beat.meanwhile && { meanwhile: `${beat.meanwhile.text} ${beat.meanwhile.heard}` }) })) });
        return json(res, 200, { mapId: state.sessionId, script });
      }
      // Who is in this class, by the name they chose. No keys: this is the list a teacher
      // reads to find the student in front of them, and it is safe to leave on screen.
      if (req.method === 'GET' && url.pathname === '/api/families') {
        if (identity.role !== 'host') return json(res, 403, { error: 'Teacher access required.' });
        return json(res, 200, { families: Object.values(state.clients).map(client => ({ householdId: client.householdId, name: client.name })).sort((a, b) => a.householdId.localeCompare(b.householdId, 'en', { numeric: true })) });
      }
      // The classes kept on this computer, for the Host's list (`classList`): the open one first, then the latest put away.
      if (req.method === 'GET' && url.pathname === '/api/classes') {
        if (identity.role !== 'host') return json(res, 403, { error: 'Teacher access required.' });
        return json(res, 200, { classes: shelfDir ? classList() : [] });
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
      if (req.method === 'GET' && url.pathname === '/api/map') return json(res, 200, { mapId: mapKey(), map: projectMap(state.world) });
      // The part of the map a family choosing its house site changes (sim/homesite.mjs): the homesteads, the lanes in to
      // them and their fields. A few kilobytes, fetched when `mapRevision` moves, instead of the whole map again.
      if (req.method === 'GET' && url.pathname === '/api/map/homes') {
        const map = state.world.map;
        const sites = Object.fromEntries(Object.entries(map.sites).filter(([, site]) => site.kind === 'homestead' || site.hunting));
        const routes = Object.fromEntries(Object.entries(map.routes).filter(([, route]) => sites[route.to]));
        return json(res, 200, { mapId: mapKey(), revision: map.revision || 0, sites: structuredClone(sites), routes: structuredClone(routes), fields: structuredClone(map.terrain.filter(feature => feature.kind === 'field')) });
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
        return json(res, 200, { mapId: mapKey(), facts: job === 'hunt-land' ? huntFacts(state.world, household, point) : job === 'fell-trees' ? fellFacts(state.world, household, point) : plotFacts(state.world, household, point, job) });
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
          return json(res, 200, { mapId: mapKey(), tiles });
        }
        const tile = woodsTile(state.world, url.searchParams.get('level'), Number(url.searchParams.get('tx')), Number(url.searchParams.get('ty')));
        if (!tile) return json(res, 404, { error: 'This class has no woods to show there.' });
        return json(res, 200, { mapId: mapKey(), tile });
      }
      if (req.method === 'GET' && url.pathname === '/api/site') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family chooses where its house stands.' });
        const household = state.world.households[identity.householdId];
        const facts = siteFactsFor(state.world, household, { x: Number(url.searchParams.get('x')), y: Number(url.searchParams.get('y')) });
        return json(res, 200, { mapId: mapKey(), facts });
      }
      // The errand to town, before it is sent (sim/errands.mjs, docs/TOWNS.md §4b): what the family's own town deals in, the
      // family's stock and, for a list, whether it can go and how the person would go. The family's own people only, read
      // from the identity on the cookie; nothing is changed by asking.
      if (req.method === 'GET' && url.pathname === '/api/errand') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family sends anybody to town.' });
        let list = null;
        if (url.searchParams.has('list')) {
          const text = url.searchParams.get('list');
          if (text.length > 2000) return json(res, 400, { error: 'That list is too long.' });
          try { list = JSON.parse(text); } catch { return json(res, 400, { error: 'That list could not be read.' }); }
        }
        return json(res, 200, { mapId: mapKey(), errand: errandFor(state.world, identity.householdId, url.searchParams.get('entityId'), list, url.searchParams.get('mode') || null) });
      }
      // How they will go (docs/FAMILY_PANEL.md §15, owner 2026-09-24): every way of going for the journey an order would start,
      // with the server's facts and reasons, and the quickest marked. The order is the page's own, as it would send it.
      if (req.method === 'GET' && url.pathname === '/api/ways') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family sends anybody anywhere.' });
        const text = url.searchParams.get('order') || '';
        if (text.length > 1000) return json(res, 400, { error: 'That order is too long.' });
        let order;
        try { order = JSON.parse(text); } catch { return json(res, 400, { error: 'That order could not be read.' }); }
        if (!order || typeof order !== 'object' || Array.isArray(order)) return json(res, 400, { error: 'That order could not be read.' });
        return json(res, 200, { mapId: mapKey(), going: goingFor(state.world, identity.householdId, url.searchParams.get('entityId'), order) });
      }
      // The list of work that exists never changes during a class; only who may do it
      // does, and that rides on the tick. Same reason the map is fetched once.
      if (req.method === 'GET' && url.pathname === '/api/chores') return json(res, 200, { mapId: mapKey(), chores: choreCatalogue(), modes: modeCatalogue(), goods: GOODS, wagon: wagonCatalogue(), houses: houseCatalogue(), plot: plotCatalogue(), woods: woodsCatalogue() });
      // Who this family is. Theirs and nobody else's, so it is read from the identity on
      // the cookie rather than from anything the request could ask for.
      if (req.method === 'GET' && url.pathname === '/api/family') {
        if (!identity.householdId) return json(res, 403, { error: 'Only a family has a family.' });
        return json(res, 200, { mapId: mapKey(), family: projectFamily(state.world, identity.householdId) });
      }
      if (req.method === 'GET' && url.pathname === '/api/events') {
        // A page opened beyond `perFamily` lets the oldest of the family's go, telling it why, rather than being refused (`STREAMS`).
        const same = [...streams].filter(s => s.identity.role === identity.role && s.identity.householdId === identity.householdId);
        for (const old of same.slice(0, Math.max(0, same.length - streamsPerFamily + 1))) replaceStream(old);
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        const stream = { res, identity, id: token().slice(0, 16), answeredAt: null, stale: false };
        streams.add(stream);
        if (identity.role === 'student') { lastSeen.set(identity.householdId, Date.now()); soloCame(); }
        // The ping names the stream, and the page answers it (`POST /api/here`); the first goes out at once.
        const ping = () => res.write(`event: ping\ndata: ${stream.id}\n\n`);
        ping();
        // The page that opened is shown the class at once; the others hear the count change with the next broadcast.
        if (!closing) send(stream);
        broadcastSoon();
        const heartbeat = setInterval(() => {
          // A page that has answered and then stopped - a Chromebook asleep - is let go, so its family is away and can be
          // claimed at another device (`STREAMS`). Closing the socket is what runs the 'close' below.
          if (!solo && stream.answeredAt !== null && Date.now() - stream.answeredAt >= streamStaleMs) {
            stream.stale = true; clearInterval(heartbeat); streams.delete(stream); res.destroy();
            return;
          }
          ping();
        }, streamPingMs);
        req.on('close', () => {
          clearInterval(heartbeat); streams.delete(stream);
          // A page let go for not answering was last seen when it last answered, so its grace and its absence count from then.
          if (identity.role === 'student') { lastSeen.set(identity.householdId, stream.stale ? stream.answeredAt : Date.now()); soloLeft(); }
          broadcastSoon();
        });
        return;
      }
      // A page answering its stream's ping (`STREAMS`): only its own stream, found by the id the ping carried and this cookie.
      if (req.method === 'POST' && url.pathname === '/api/here') {
        const asked = await body(req);
        const stream = [...streams].find(s => s.id === asked.stream && s.identity.role === identity.role && s.identity.householdId === identity.householdId);
        if (!stream) return json(res, 404, { error: 'That page is no longer connected.' });
        stream.answeredAt = Date.now();
        return json(res, 200, { ok: true });
      }
      if (req.method === 'POST' && url.pathname === '/api/command') {
        const input = await body(req);
        if (typeof input.id !== 'string' || !/^[\w-]{8,80}$/.test(input.id)) return json(res, 400, { error: 'Command ID required' });
        const commands = identity.role === 'host' ? state.hostCommands : state.clients[identity.credentialHash].commands;
        if (commands.includes(input.id)) return json(res, 200, { ok: true, duplicate: true });
        let archived = null, rotatedSession = null, stopping = false, wantedPace = null, forToday = false, continued = null, deleted = null;
        const priorSession = state.sessionId;
        // The solo player's own Pause, Resume and Save (owner, 2026-09-27: "i shouldn't need to open the class view to pause,
        // save or shut down the server"). Written at once, as the Host's commands are, rather than within SAVE_WITHIN_MS.
        const soloControl = identity.role === 'student' && SOLO_CONTROLS.has(input.action);
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
              // Not a world change: the pace is how fast the class watches, not what it watches, so it is outside the world.
              // It is kept with the class, beside its name (`state.pace`), so a class reopened tomorrow opens at it.
              if (!paceNamed(input.pace)) throw new Error('Unknown pace');
              wantedPace = PACES[input.pace];
              s.pace = input.pace;
            } else if (input.action === 'pause' && s.world.status === 'running') s.world.status = 'paused';
            else if (input.action === 'resume' && s.world.status === 'paused') s.world.status = runtimeFault?.resumeStatus || 'running';
            else if (input.action === 'end') s.world.status = 'ended';
            // The second class period (sim/periods.mjs): the same class carried on into the winter, never a new one.
            else if (input.action === 'next-period') beginNextPeriod(s.world);
            // A class ended by mistake, part-way through a period, taken up again where it was, paused (owner, 2026-09-28: "Yes,
            // allow Continue"; docs/HOST_PAGE.md §2.8). Its flashbacks go after the commit (`continued`).
            else if (input.action === 'continue-class') { continueEnded(s.world); continued = s.sessionId; }
            else if (input.action === 'new-class') {
              // Never put away a class while it is being played: the teacher pauses it first (2026-09-28). A paused class is
              // no longer lost by this - it is kept on the shelf (`shelve`) and opened again from the Host's list of classes.
              if (s.world.status === 'running') throw new Error('Pause this class first. It is kept, and can be opened again from Classes.');
              // The size the teacher asked for (5-30), or this class's; the name the teacher gave it ("Period 4"), if any.
              const size = input.size === undefined || input.size === null || input.size === '' ? s.world.playerCount : classSize(input.size);
              // The archive copies the save on disk, which a class that ended on its own tick can trail by a few seconds.
              flush();
              archived = archiveSave(savePath, s.sessionId);
              shelve(s);
              s.sessionId = token().slice(0, 12);
              s.sessionCode = randomBytes(3).toString('hex').toUpperCase();
              s.clients = {}; s.hostCommands = [];
              s.className = className(input.name);
              delete s.deal; delete s.lateSeat;
              // `s.pace` is left as it is: the new class goes on at the pace the teacher is using, and keeps it (`state.pace`).
              // The seed is new so the next class is its own world.
              s.world = worldFactory(token().slice(0, 16), size);
              rotatedSession = s.sessionId;
            } else if (input.action === 'delete-class') {
              // A kept class taken off the Host's list (owner, 2026-09-28: "Yes, with a confirm"; docs/HOST_PAGE.md §2.9). Never
              // destroyed: its save and its flashbacks are moved into `archive/` beside the other backups, and put back by hand
              // (docs/RECOVERY.md *A deleted class*). Never the class that is open - the one being played or waiting to be.
              if (!shelfDir) throw new Error('This server keeps no other classes.');
              if (typeof input.classId !== 'string' || !CLASS_ID.test(input.classId)) throw new Error('That is not a saved class.');
              if (input.classId === s.sessionId) throw new Error('That class is open. Open another class first, then delete this one.');
              deleted = deleteKept(input.classId);
            } else if (input.action === 'open-class') {
              // Another section's class, put away by New Class or by opening this one (`shelve`), opened again where it was.
              if (!shelfDir) throw new Error('This server keeps no other classes.');
              if (typeof input.classId !== 'string' || !CLASS_ID.test(input.classId)) throw new Error('That is not a saved class.');
              if (input.classId === s.sessionId) throw new Error('That class is already open.');
              if (s.world.status === 'running') throw new Error('Pause this class first. It is kept, and can be opened again from Classes.');
              let saved = null;
              try { saved = readSave(join(shelfDir, `${input.classId}.json`)); } catch (error) { throw new Error(`That class cannot be opened: ${error.message}`); }
              if (!saved?.world || saved.sessionId !== input.classId) throw new Error('That saved class is not there.');
              flush();
              shelve(s);
              s.sessionId = saved.sessionId;
              s.sessionCode = saved.sessionCode;
              s.clients = saved.clients || {};
              s.hostCommands = saved.hostCommands || [];
              s.world = saved.world;
              s.className = saved.className || null;
              if (saved.deal) s.deal = saved.deal; else delete s.deal;
              if (saved.lateSeat) s.lateSeat = saved.lateSeat; else delete s.lateSeat;
              // At its own pace, or the server's if it never chose one (`state.pace`).
              if (paceNamed(saved.pace)) s.pace = saved.pace; else delete s.pace;
              wantedPace = paceNamed(s.pace) ? PACES[s.pace] : tickMs;
              // A class opened again waits for the teacher's Resume, whatever it was doing when it was put away.
              if (s.world.status === 'running') s.world.status = 'paused';
              rotatedSession = s.sessionId;
            } else if (input.action === 'class-size') {
              // How many families the class has (2026-09-28, the classroom audit's B1): 5 to 30, chosen in the lobby. The world
              // is dealt again for the new number with the same seed, and a student who has joined keeps their place and
              // makes their family again: a family is where it is in the colonies because of how many families there are.
              if (s.world.status !== 'lobby') throw new Error('The class size is chosen in the lobby, before Start.');
              const size = classSize(input.size);
              const joined = Object.keys(s.clients).length;
              if (size < joined) throw new Error(`${joined} students have joined, so the class cannot have fewer families than that.`);
              if (size !== s.world.playerCount) {
                s.world = worldFactory(s.world.seed, size);
                for (const client of Object.values(s.clients)) markPlayed(s.world, client.householdId);
                s.deal = (s.deal || 0) + 1;
                delete s.lateSeat;
              }
            } else if (input.action === 'late-seat') {
              // Which family the next student to join after Start is given: one nobody plays, or one whose student is not
              // here (`seats`). Nothing chosen is the first family nobody plays.
              if (!input.householdId) delete s.lateSeat;
              else {
                if (!seats().some(seat => seat.householdId === input.householdId)) throw new Error('That family cannot be given to a late student: somebody is playing it now.');
                s.lateSeat = input.householdId;
              }
            } else if (input.action === 'stop-server') {
              if (!onStopRequested) throw new Error('This build cannot stop the server from the Host page. Stop it in the developer terminal.');
              // Checkpoint a real Pause first: a saved running class starts advancing on restart.
              if (s.world.status === 'running') s.world.status = 'paused';
              stopping = true;
            } else if (input.action === 'stop-for-today') {
              // The bell (docs/HOST_PAGE.md §2.8, design audit 2026-09-28 B2): the class is paused and written now, never ended,
              // so the next class opens it paused where it stopped and Resume carries on. A server that can close itself does;
              // one that cannot (a developer's terminal) is left running with the class saved and paused, and the page says so.
              if (!['running', 'paused'].includes(s.world.status)) throw new Error('There is no class under way to stop for today.');
              if (s.world.status === 'running') s.world.status = 'paused';
              forToday = true;
              stopping = Boolean(onStopRequested);
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
          } else if (soloControl) {
            // Solo only: in a class the teacher pauses, and a student's page has no say over the whole class's clock.
            if (!solo) throw new Error('Only the teacher pauses or resumes a class.');
            if (input.action === 'solo-pause') {
              if (s.world.status !== 'running') throw new Error('The game is not running.');
              s.world.status = 'paused';
            } else if (input.action === 'solo-resume') {
              if (s.world.status !== 'paused') throw new Error('The game is not paused.');
              s.world.status = runtimeFault?.resumeStatus || 'running';
            }
            // 'solo-save' changes nothing: this commit is written and fsynced before it is answered, and with it everything
            // shown and not yet written.
          } else {
            // The lobby is not dead time. A family may set its own people to work while
            // the class fills up, and none of it moves until the teacher starts; which
            // actions that means is `LOBBY_ACTIONS`, beside the actions themselves.
            if (!['running', 'lobby'].includes(s.world.status)) throw new Error('Wait until the class is running.');
            applyAction(s.world, identity.householdId, input, { now: now(), ...(lessonResumeMs !== undefined && { resumeWindowMs: lessonResumeMs }) });
          }
          const ledger = identity.role === 'host' ? s.hostCommands : s.clients[identity.credentialHash].commands;
          ledger.push(input.id); if (ledger.length > 256) ledger.shift();
        }, { actor: identity, when: identity.role === 'host' || soloControl ? 'now' : 'order' });
        // Pressed by the player, the pause is theirs: a page that closes and comes back does not undo it (`soloCame`).
        if (soloControl && input.action !== 'solo-save') soloAwayPaused = false;
        if (rotatedSession) {
          res.setHeader('Set-Cookie', [setCookie(`tr_host_${rotatedSession}`, state.hostKey, 604800), setCookie(`tr_host_${priorSession}`, '', 0)]);
          // Credentials belong to the archived class. End those streams so a previous
          // student cannot silently inherit a household in the new one.
          for (const stream of [...streams]) if (stream.identity.role === 'student') { streams.delete(stream); stream.res.end(); }
          // Presence belongs to the class that was open. A class opened again starts every student's absence clock now,
          // so a student who does not come back to it is handed to the director after the usual grace (`markAbsences`); a
          // family it was left with absent stays absent until its page opens (`seedPresence`, as at a launch).
          seedPresence();
        }
        // The flashbacks told the class as it was ended; continued, they are thrown away and made again at its next end.
        if (continued) flashbacks.discard(continued);
        if (wantedPace) setPace(wantedPace);
        // Resumed, or ended: the Host's page no longer says why the class paused itself (`pauseIfEmpty`).
        if (state.world.status !== 'paused') emptyPaused = null;
        if (stopping) requestStop(forToday ? STOPPED_FOR_TODAY : null);
        return json(res, 200, { ok: true, ...(archived && { archived: basename(archived) }), ...(deleted && { deleted }), ...(stopping && { stopping: true }), ...(forToday && { stoppedForToday: true }), ...(soloControl && { saved: state.revision }) });
      }
      json(res, 404, { error: 'Not found' });
    } catch (error) { if (!res.headersSent) json(res, error.status || 400, { error: error.message }); else res.destroy(); }
  });
  /**
   * A class left running with nobody in it (`EMPTY_PAUSE_MS`, owner 2026-09-29): `emptySince` is when the running class was
   * first seen with no student's page open, forgotten whenever one is open or the class is not running, so the teacher's
   * Resume always gives a class its full three minutes again. `emptyPaused` is why it paused, for the Host's page, until the
   * class runs again or another class is opened. Declared with presence (above), which the Host's view reads it beside.
   */
  function pauseIfEmpty() {
    emptyPaused = null;
    if (!emptyPauseMs || solo) return false;
    if (playerHere()) { emptySince = null; return false; }
    const at = Date.now();
    emptySince ??= at;
    // A page that opened and closed again between two ticks was a student here: its closing is the last time one was seen.
    if (at - Math.max(emptySince, ...lastSeen.values()) < emptyPauseMs) return false;
    const span = emptyPauseMs >= 60000 ? `${Math.round(emptyPauseMs / 60000)} minutes` : `${Math.round(emptyPauseMs / 1000)} seconds`;
    // Set before the commit, whose broadcast is the Host's only word of it: a paused class sends nothing more until it changes.
    emptyPaused = { at: new Date(at).toISOString(), ms: emptyPauseMs, sessionId: state.sessionId };
    try {
      commit(s => {
        s.world.status = 'paused';
        record(s.world, 'lifecycle', { visibility: 'host', importance: 2, text: `The class paused itself: no student had the game open for ${span}.` });
      });
    } catch (error) { emptyPaused = null; throw error; }
    emptySince = null;
    console.log(`No student's page has been open for ${span}: the class is paused and saved (revision ${state.revision}). Resume carries it on.`);
    return true;
  }
  function tick() {
    // Play Solo's clock waits while the player's family is being made (sim/family.mjs `familyMaking`): the whole world, the
    // neighbours too, as a class waits in its lobby. Still 'running', so the die, the name and the looks are taken.
    const running = state.world.status === 'running'
      && !(solo && Object.values(state.clients).some(client => familyMaking(state.world, state.world.households[client.householdId])));
    // Measured before anything else, so a paused or waiting class is always a lap not run (`realTimeMeter`).
    const realMs = realTime.lap(running, Math.max(3 * pace, 2000));
    if (!running) { emptySince = null; return; }
    try { if (pauseIfEmpty()) return; } catch (error) { console.error('The class could not pause itself:', error.cause?.message || error.message); }
    try { commit(s => { markAbsences(s.world); stepWorld(s.world, { realMs, decisionBudgetMs, callBudgetMs, ...(questionBudgets && { questionBudgets }) }); }, { when: 'tick' }); }
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
    recoveredLock,
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
      // A solo game is never left running on the disk, whatever stopped its server: Ctrl+C, the launcher, the watch. After a
      // save that failed (`SAVE_FAILED`: the file held open a moment by something else) this is also the retry: the class in
      // memory has been put back to what the disk holds, so there would otherwise be nothing left to write.
      if (solo && !closing && (state.world.status === 'running' || runtimeFault)) {
        try { commit(s => { if (s.world.status === 'running') s.world.status = 'paused'; }); } catch (error) { console.error('The solo game could not be saved paused:', error.message); }
      }
      closing = true; clearInterval(timer); clearTimeout(broadcastTimer); clearTimeout(soloTimer);
      // Whatever was shown and not yet written is written before the save is let go (`commit`).
      try { flush(); } catch (error) { console.error('The last changes could not be saved:', error.cause?.message || error.message); }
      for (const s of streams) s.res.destroy(); streams.clear();
      try { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
      finally { lease.release(); }
    },
  };
}
