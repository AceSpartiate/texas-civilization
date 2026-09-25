// Renderers consume the server's permitted projection. They never advance simulation state.
import { drawSprite, drawClip, clipInfo, clipReady, hasSprite, loadArt, onArtReady, pickSprite, spriteFrame } from '/art.js';
import { drawArmy } from '/army-view.js';
import { ProjectionMotion, GaitClock, clipGait, STRIDE, entityClip, travelHeading, travelDirection, figureScale, carriedWithRider, seatOf, teamDrivenBy, wagonTeams, seatedClip, seatLayout, passengersOf, bedLayout, walksBeside, mounted, MOUNTED_HEIGHT, figureOf, alongRoute, drawnHeightsPerSecond, drawnMilesASecond, fadeToward, FADE_STALE_MS, GAIT_CEILING, gaitMilesASecond, landRuns, travelMilesATick, travelSight, routeIndexAfter, sameJourney } from '/motion.js';
import { familyRows, PRESENCE_LABELS, storyView, spotlightBanner } from '/live-page.js';
import { autoLabel, autoLine, callMenu, callPlan, drawIcon, drawMark, drawPortrait, focusFor, isIdle, meetingFor, nameToSave, needsOf, panelActions, panelOrder, requestFor, rowReason, standing, travellingLine, RENAME_PAUSE_MS } from '/family-panel.js';
import { allowsIcon, lessonAnnouncement, lessonLocks, lessonShowing, lessonWords, lockedNote, pointedKey } from '/lesson.js';
import { mountErrand } from '/errand.js';
import { asksTheWay, mountGoing } from '/going.js';
import {drawBexarGround,bexarDrawables} from '/bexar-art.js';
import {alamoOnMap,bexarToSite} from '/bexar-layout.js';
import {plotArt} from '/field-art.js';
import { drawFieldSurface } from '/field-surface.js';
import {drawGonzalesGround,gonzalesDrawables,GONZALES_ART_BOUNDS} from '/gonzales-art.js';
import { drawTownGround, townDrawables } from '/town-art.js';
import { renderInterior, clearInteriorChoice } from '/interior.js';
import { TOWN_LAYOUTS, townPoint } from '/town-layouts.js';
import {drawWater,drawRoad,drawCrossing,drawFerry,crossingAngle} from '/landscape-art.js';
import { GALE_POSES, GALE_SMOKE, drawFogShape, drawHighWater, drawWeatherAir, drawWeatherVeil, drawWetGround, farEmphasis, inGale, weatherGroundKey, weatherMix, weatherShown, weatherSpans, windLean } from '/weather-art.js';
/** The weather with the day fully up, for everything drawn into the kept ground (public/weather-art.js `weatherMix`). */
const STEADY = Object.freeze({ fade: false });
import { drawHousePlot, houseFootprint, plotCell, plotted, renderHousePlot } from '/house-plot.js';
import { CABIN_PEOPLE, PERSON_MILES, houseOnGround, spacingRefusal, standingAt } from '/sim/house-footprint.mjs';
import { drawWoodsCover, ensureWoods, stumpsVisible, timberAt, treesVisible, woodsLayersFor, woodsShown } from '/woods-view.js';
import { bindEnding, renderEnding } from '/ending.js';
import { bindLooks, renderLooks } from '/appearance.js';
import { bindCreation, creationStep, renderCreation, showTitle } from '/creation.js';
import { aroundHole, groundInputs, applyDrawState, canvasRatio, creekOpacity, distanceToSegments, ramp, readDrawState, sameLayerKey, scatterItem, scatterLevels, segmentsNear, setText, smoothCover, WATER, waterWidth, landPictureData, landUpscale, away, wadesOf } from '/map-base.js';
import { canSmoothOffThread, smoothOffThread, toBitmap } from '/smooth-worker.js';
import { DEFAULT_GROUND, groundClass, groundClassAt, markFor } from '/ground-classes.js';
import { decodeLand, decodeOutside, decodeProvince, emptyMiddle, landWeights, lineBand, tileGrid, withoutClaims } from '/land-levels.js';
import { frameTransform, gestureView, isTap, keyView, nearestSpot, reproject, tapSlop, wheelZoomFactor, worldAt, zoomAbout } from '/map-camera.js';
const $ = selector => document.querySelector(selector);
import { militaryNotices } from '/military-attention.js';
const say = message => { for (const id of ['#error', '#join-error', '#rejoin-error']) { const el = $(id); if (el) el.textContent = message; } };
const hostPage = location.pathname === '/host';
let events;
let joinPending = false;
window.__received = [];
window.__viewEntities = [];
window.__viewFormations = [];
window.__camera = null;
const motionProjection = new ProjectionMotion();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let animationTime = 0, previousFrame = 0, paintedFrame = 0, animationDrawMs = 0;
// A traveller's cycle is played from their own place in their stride rather than the shared clock (public/motion.js `GaitClock`).
const gaitClock = new GaitClock(), gaits = new Map();
/**
 * What was drawn of each traveller this frame (public/motion.js `travelSight`): how much of them was drawn (1 in view, 0
 * away), where along the road they were drawn, how fast they were drawn going in their own heights a second and what the
 * gait allows. It replaced the marker's weights on 2026-09-22.
 *
 * Presentation evidence, read by proofs as `window.__travelSight` and **by nothing in the application** - the same contract
 * as `__viewEntities` and `__drawnAt`. "Is the figure actually invisible in the middle, and is it actually walking at the
 * ends" is not a question a projection can answer.
 * ceiling: one entry per traveller ever drawn in this page, never pruned, as `GaitClock` keeps; prune by age if a class ever
 * draws thousands.
 */
const travelSeen = new Map();
window.__travelSight = travelSeen;
// The family's own land, read once a frame: the road inside it is never sped up and never faded (owner, 2026-09-22).
let ownGrant = null;
// Where each journey leaves that land and comes back onto it, worked out once a journey rather than once a frame.
const landRunCache = new Map();
function gaitTime(clip, gait) {
  const key = `${clip}|${gait.stride}`;
  if (!gaits.has(key)) { const found = clipGait(clipInfo(clip), gait.stride); if (!found) return undefined; gaits.set(key, found); }
  return gaitClock.time(gait.id, { clockMs: animationTime, at: gait.at, bodyMiles: gait.bodyMiles, gait: gaits.get(key) });
}
function animated(ctx, clip, x, y, size, seed = 0, { gait, ...options } = {}) {
  const own = gait && !options.paused && !('timeMs' in options) ? gaitTime(clip, gait) : undefined;
  const width = drawClip(ctx, clip, x, y, size, { timeMs: own ?? animationTime, seed, reducedMotion: reducedMotion.matches, ...options });
  if (width) window.__animationClips?.add(clip);
  return width;
}
async function api(path, input) {
  const response = await fetch(path, input ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
const sitesOf = world => Object.values(world.map?.sites || {});
const entitiesOf = world => world.entities || [];
// People who are not yours, seen because one of your family is standing where they are.
// The server decided this list; the client never widens it. They are kept apart from
// `entities` deliberately - merging them would make it possible to command one by
// accident, and the whole point is that they are somebody else's.
const observedOf = world => world.others || [];
// The Host has no fog (owner, 2026-09-16): its `others` is everybody in the class and `overview.lands` every family's land as it
// truly stands (sim/overview.mjs). A student's map draws its own land and a neighbour's as last seen; the Host's draws them all.
const hostView = world => world?.role === 'host';
const landsOf = world => Object.entries(world.overview?.lands || {}).map(([householdId, land]) => ({ householdId, ...land }));
/** Each piece of land the map draws as known: the family's own for a student, every family's for the Host. */
const knownLands = world => hostView(world)
  ? landsOf(world).map(land => ({ ...land, field: land.field || null }))
  : world.land ? [{ householdId: world.householdId, homeSiteId: world.household?.homeSiteId, plots: world.land.plots, field: world.household?.field || null }] : [];
const homeOf = world => sitesOf(world).find(site => site.id === world.household?.homeSiteId)?.id || `home-${String(world.householdId || '').split('-').at(-1)}`;
const placeName = (world, id) => world.map?.sites?.[id]?.name || id || 'On the road';
const timeLabel = minutes => minutes < 60 ? `${Math.floor(minutes)} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} hours` : `${(minutes / 1440).toFixed(1)} days`;
function element(tag, content, className) { const el = document.createElement(tag); el.textContent = content; if (className) el.className = className; return el; }
// Teacher actions that discard a class or close the server ask twice, in the page
// itself, so a browser dialog never blocks the projected Host.
// Sending for somebody is asked twice, like the other two that cannot be taken back: they lose
// their place in the ranks and whatever the army does next happens without them.
const confirmLabel = { 'new-class': 'Confirm new class', 'stop-server': 'Confirm stop', 'send-for': 'Confirm: bring them home', 'winter-recall': 'Confirm: send for them', flee: 'Confirm: leave, and let it burn', 'flight-stay': 'Confirm: stay, and take the risk', 'road-abandon': 'Confirm: leave the wagon behind' };
/** Which confirmation an action wants: leaving the wagon in the mud is the one road answer asked twice (sim/road.mjs). */
const confirmKeyOf = button => button.dataset.action === 'road-answer' ? (button.dataset.option === 'abandon' ? 'road-abandon' : null) : button.dataset.action;
let confirming = null, confirmTimer = null, authRecheck = false, startAnyway = false;
// The map is public geography that never changes during a class, so it is fetched once
// and re-attached to each snapshot. A new class rotates the session id and invalidates it.
let mapCache = null, mapCacheId = null, mapPending = null;
// Which change to the homesteads the cached map has (sim/homesite.mjs): a family choosing its house site moves its home and lane.
let mapRevision = 0, homesPending = null;
// The map is the interface: a person is chosen by clicking them, and their instructions
// appear beside them. Nobody selected falls back to the person this household directs.
let selectedId = null, selectionDismissed = false;
// The student's main person (docs/FAMILY_PANEL.md §11.3): the household's `mainId` as the server sent it this tick, chosen
// with the star (`set-main`) and the principal until one is chosen. The server's, not this browser's: the main person is
// the one the server lets travel, work about the place and rest, and it falls back for a death before the page hears.
let focusedId = null;
// The call's one menu (docs/FAMILY_PANEL.md §11.2): which "!" opened it, and the ticked rows, kept across ticks.
let callMenuFor = null;
// The errand popup (public/errand.js). Its one order goes through here so the id is made the way every command's is, after
// anything the order carries.
const errandPopup = mountErrand({
  $, element, api, say,
  send: input => api('/api/command', { ...input, id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}` }),
  onSent: () => { if (window.__snapshot) render(window.__snapshot); },
});
// How they will go (public/going.js, docs/FAMILY_PANEL.md §15, owner 2026-09-24): every order that puts somebody on a road is
// sent through it, and it sends the one order with the way chosen. Its id is made here, as every command's is.
const goingPopup = mountGoing({
  $, element, api, say,
  send: input => api('/api/command', { ...input, id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}` }),
});
const EMPTY_MAP = { sites: {}, routes: {}, terrain: [] };
// The catalogue of work is fixed for a class, so it is fetched once alongside the map.
// Only whether a given person may do a given chore rides on the tick.
let choreCache = null, choreCacheId = null, chorePending = null, modeCache = null;
// What a family can pack, and the wagon's space: fixed for a class, so it comes with the chores.
let wagonCatalogue = null;
// The houses a family can choose, and what each needs and does: fixed too, and fetched the same way.
let houseCatalogue = null;
// The kinds of tree and the woods' tile sizes (sim/woods-view.mjs): fixed too.
let woodsCatalogue = null;
// The house plot's pieces and plans (sim/houseplot.mjs): fixed too.
let plotCatalogue = null;
// A woods tile or a sheet of art arriving redraws the map's ground once, a moment later, however many arrive together. They
// arrive in bursts - six tiles at a time, a sheet at a time - and each redraw of the ground is the most a frame can cost; on
// the next frame it came to four redraws a second while a view's tiles loaded on a throttled laptop (docs/PERFORMANCE_RENDER.md).
const ARRIVAL_REDRAW_MS = 200;
let arrivalRedraw = null;
const redrawForArrival = () => {
  invalidateMapBase();
  if (arrivalRedraw) return;
  // Not while a hand is on the map, whose pans are what fetch the tiles: then the map is drawn with them when the hand stops.
  arrivalRedraw = setTimeout(() => { arrivalRedraw = null; if (!window.__snapshot) return; if (performance.now() < handOnMapUntil) requestMapDraw(); else drawWorld(window.__snapshot.world); }, ARRIVAL_REDRAW_MS);
};
const redrawForWoods = redrawForArrival;
function ensureChores(snapshot) {
  if (!snapshot.mapId || (choreCache && choreCacheId === snapshot.mapId) || chorePending === snapshot.mapId) return;
  chorePending = snapshot.mapId;
  api('/api/chores').then(result => {
    chorePending = null;
    if (!result?.chores) return;
    choreCache = new Map(result.chores.map(chore => [chore.id, chore]));
    modeCache = new Map((result.modes || []).map(mode => [mode.id, mode]));
    if (result.goods?.length) TRADE_GOODS = result.goods;
    wagonCatalogue = result.wagon || null;
    houseCatalogue = result.houses ? new Map(result.houses.map(house => [house.id, house])) : null;
    woodsCatalogue = result.woods || null;
    plotCatalogue = result.plot || null;
    choreCacheId = result.mapId;
    if (window.__snapshot) render(window.__snapshot);
  }).catch(() => { chorePending = null; });
}
// Who this family is. Fetched once and re-fetched when somebody in it is renamed, on the
// same contract as the map and the chore catalogue: it changes rarely, so it has no
// business on a channel that fires every tick. That lesson has now been learned here three
// times, most recently at about four hundred and fifty bytes a tick.
// And re-fetched when who is in the household changes. A family that has not rolled when the host presses Start is rolled
// by the server (docs/FAMILY_CREATION.md); the page kept the unrolled family it fetched in the lobby, so it went on asking
// for a roll and never opened anybody's work panel until it was reloaded (found by scripts/farm-browser-proof.mjs, 2026-09-14).
let familyCache = null, familyCacheId = null, familyPending = null, familyMembers = null;
function ensureFamily(snapshot) {
  if (!snapshot.mapId || snapshot.world?.role === 'host' || !snapshot.world?.householdId) return;
  const members = (snapshot.world.household?.members || []).join(',');
  if (familyCache && familyMembers !== members) familyCacheId = null;
  if ((familyCache && familyCacheId === snapshot.mapId) || familyPending === snapshot.mapId) return;
  familyPending = snapshot.mapId; familyMembers = members;
  api('/api/family').then(result => {
    familyPending = null;
    if (!result?.family) return;
    familyCache = result.family; familyCacheId = result.mapId;
    if (window.__snapshot) render(window.__snapshot);
  }).catch(() => { familyPending = null; });
}
/** After this family renames one of its own, what was fetched is out of date. */
const forgetFamily = () => { familyCacheId = null; familyCache = familyCache && { ...familyCache }; };
function ensureMap(snapshot) {
  if (!snapshot.mapId || (mapCache && mapCacheId === snapshot.mapId)) return;
  if (mapPending === snapshot.mapId) return;
  mapPending = snapshot.mapId;
  api('/api/map').then(result => {
    mapPending = null;
    if (!result?.map) return;
    mapCache = result.map; mapCacheId = result.mapId; mapRevision = result.map.revision || 0; reliefCaches.clear(); invalidateMapBase();
    if (window.__snapshot) render(window.__snapshot);
  }).catch(() => { mapPending = null; });
}
/** A family has set its house somewhere new: fetch just the homesteads, their lanes and fields, not the whole map. */
function ensureHomes(snapshot) {
  const wanted = snapshot.mapRevision || 0;
  if (!mapCache || mapCacheId !== snapshot.mapId || wanted <= mapRevision || homesPending === wanted) return;
  homesPending = wanted;
  api('/api/map/homes').then(result => {
    homesPending = null;
    if (!result || result.mapId !== mapCacheId || result.revision <= mapRevision) return;
    Object.assign(mapCache.sites, result.sites);
    Object.assign(mapCache.routes, result.routes);
    const fields = new Map(result.fields.map(field => [field.id, field]));
    mapCache.terrain = mapCache.terrain.map(feature => fields.get(feature.id) || feature);
    mapCache.revision = mapRevision = result.revision;
    if (window.__snapshot) render(window.__snapshot);
  }).catch(() => { homesPending = null; });
}
function resetConfirm(button) {
  if (!button?.dataset.confirming) return;
  button.textContent = button.dataset.label || button.textContent;
  delete button.dataset.confirming;
  if (confirming === button) { clearTimeout(confirmTimer); confirming = null; }
}
function stableOffset(id) {
  let n = 0; for (const c of id) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return { x: (n % 7 - 3) * 12, y: (Math.floor(n / 7) % 4 - 1) * 12 };
}
const hashOf = value => { let n = 0; for (const c of String(value)) n = (Math.imul(n, 31) + c.charCodeAt(0)) | 0; return (n >>> 0); };
// The soft shadow every atlas sprite carries, so a procedurally drawn person stands on
// the same ground as the illustrated ox beside them instead of floating over it.
function groundShadow(ctx, x, y, radius) {
  ctx.fillStyle = 'rgba(52,45,30,.20)';
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * .34, 0, 0, Math.PI * 2); ctx.fill();
}
// Authored people use a stable cast variant through work, travel and care. The shapes
// below remain the local fallback while an atlas loads or if it fails.
//
// Skin and clothing vary by a hash of the person's own id, never by side, nationality or
// name. Guessing either from a name would be a claim the simulation never made.
const SKIN = ['#e0b48c', '#c9915f', '#a76c41', '#7d4d2c', '#f0cba6'];
const CLOTH = ['#7d6a4c', '#5d6b52', '#8a6a4a', '#6d5a68', '#4f6570'];
function miniPerson(ctx, x, y, size, entity) {
  // A child is drawn smaller than a grown person, in their own figure or a grown one (public/motion.js `entityClip`).
  if (!entity.side) size *= figureScale(entity);
  const binding = entity.side ? { id: `${entity.side === 'mexican' ? 'regular' : 'volunteer'}-idle-e` } : entityClip(entity, entity.observed);
  // A north or south cycle is drawn facing that way already; mirroring it would turn a
  // person walking away into a person walking away backwards.
  if (animated(ctx, binding.id, x, y, size, entity.id || entity.side, { paused: binding.frozen, flip: binding.upright ? false : entity.flip, gait: entity.gait })) return;
  const tint = hashOf(entity.id || entity.name || 'person');
  const coat = entity.side === 'mexican' ? '#4a6079' : entity.side === 'texian' ? '#7d5f45'
    // The principal's rust coat marks the one person a student directs, and nobody who is
    // not theirs ever wears it. This runs only when a sprite was unavailable; the
    // illustrated path reserves the same colour in visualVariant(), so the mark means the
    // same thing whether or not the atlases loaded. Keep the two in step.
    : entity.principal && !entity.observed ? '#a9512d' : CLOTH[tint % CLOTH.length];
  const skin = SKIN[(tint >> 3) % SKIN.length], hatted = ((tint >> 6) & 3) !== 0;
  const ink = '#392e20', line = Math.max(.9, size * .045);
  groundShadow(ctx, x, y, size * .25);
  ctx.lineWidth = line; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const shape = (path, fill) => { ctx.beginPath(); path(); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  // Legs, then the coat over them, then arms and head: back to front, so the outlines
  // never cross each other.
  ctx.fillStyle = '#4b3d2a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect?.(x + side * size * .13 - size * .06, y - size * .30, size * .12, size * .30, size * .04);
    if (!ctx.roundRect) ctx.rect(x + side * size * .13 - size * .06, y - size * .30, size * .12, size * .30);
    ctx.fill(); ctx.stroke();
  }
  shape(() => {
    ctx.moveTo(x - size * .20, y - size * .28); ctx.lineTo(x + size * .20, y - size * .28);
    ctx.lineTo(x + size * .17, y - size * .66); ctx.lineTo(x - size * .17, y - size * .66);
  }, coat);
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.4, size * .085);
  ctx.beginPath();
  ctx.moveTo(x - size * .18, y - size * .60); ctx.lineTo(x - size * .27, y - size * .34);
  ctx.moveTo(x + size * .18, y - size * .60); ctx.lineTo(x + size * .27, y - size * .34);
  ctx.stroke();
  ctx.strokeStyle = coat; ctx.lineWidth = Math.max(.8, size * .055); ctx.stroke();
  ctx.strokeStyle = ink; ctx.lineWidth = line;
  shape(() => ctx.arc(x, y - size * .78, size * .125, 0, Math.PI * 2), skin);
  if (hatted) {
    shape(() => ctx.ellipse(x, y - size * .845, size * .21, size * .062, 0, 0, Math.PI * 2), '#8a7047');
    shape(() => ctx.ellipse(x, y - size * .90, size * .105, size * .055, 0, 0, Math.PI * 2), '#9c8154');
  }
}
// Juniper is an ox and must stay one; the sprite chosen is stable per animal so the same
// beast is recognisable from one lesson to the next.
function miniAnimal(ctx, x, y, size, entity = {}, flip = false) {
  const beast = entity.species === 'horse' ? 'horse' : 'ox';
  const heading = entity.travel ? travelHeading(entity) : null;
  if (entity.travel && animated(ctx, heading ? `${beast}-walk-${heading}` : `${beast}-walk`, x, y, size, entity.id, { flip: heading ? false : flip, gait: entity.gait })) return;
  if (!entity.travel && animated(ctx, beast === 'horse' ? 'horse-chestnut-idle' : 'ox-brown-idle', x, y, size, entity.id, { flip })) return;
  if (drawSprite(ctx, beast === 'horse' ? 'horse-chestnut' : 'ox-brown', x, y, size, { flip })) return;
  groundShadow(ctx, x, y, size * .42);
  ctx.fillStyle = '#815f3e'; ctx.fillRect(x - size * .5, y - size * .62, size, size * .45); ctx.fillRect(x + size * .34, y - size * .88, size * .3, size * .38);
  ctx.fillStyle = '#534830'; for (const leg of [-.36, .28]) ctx.fillRect(x + size * leg, y - size * .22, size * .13, size * .22);
}
function deerFallback(ctx, x, y, size, flip = false) {
  ctx.save();
  ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  groundShadow(ctx, 0, 0, size * .38);
  ctx.fillStyle = '#9a6b3f'; ctx.strokeStyle = '#3d2c1c'; ctx.lineWidth = Math.max(.8, size * .03);
  for (const leg of [-.26, -.16, .18, .27]) { ctx.beginPath(); ctx.moveTo(size * leg, -size * .42); ctx.lineTo(size * leg, 0); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -size * .5, size * .34, size * .13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(size * .24, -size * .56); ctx.lineTo(size * .36, -size * .84); ctx.lineTo(size * .44, -size * .8); ctx.lineTo(size * .34, -size * .52); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(size * .44, -size * .86, size * .1, size * .06, -.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(-size * .34, -size * .56, size * .05, size * .04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(size * .38, -size * .92); ctx.lineTo(size * .34, -size * 1.02); ctx.moveTo(size * .44, -size * .92); ctx.lineTo(size * .46, -size * 1.02); ctx.stroke();
  ctx.restore();
}
function turkeyFallback(ctx, x, y, size, flip = false) {
  ctx.save();
  ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  groundShadow(ctx, 0, 0, size * .34);
  ctx.fillStyle = '#4a3a28'; ctx.strokeStyle = '#2a2117'; ctx.lineWidth = Math.max(.7, size * .04);
  for (const leg of [-.08, .1]) { ctx.beginPath(); ctx.moveTo(size * leg, -size * .3); ctx.lineTo(size * leg, 0); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -size * .48, size * .34, size * .22, .12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-size * .3, -size * .5); ctx.lineTo(-size * .58, -size * .84); ctx.lineTo(-size * .5, -size * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(size * .24, -size * .6); ctx.quadraticCurveTo(size * .44, -size * .82, size * .36, -size * .94); ctx.lineWidth = Math.max(1, size * .08); ctx.stroke();
  ctx.fillStyle = '#9e5a4e'; ctx.beginPath(); ctx.ellipse(size * .36, -size * .98, size * .08, size * .06, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/**
 * The quarry a hunter is waiting on, drawn as the species the SERVER named (`chore.quarry.kind`, sim/chores.mjs
 * `quarryPoint`). The page never chooses what animal is there and never puts one anywhere: a quarry with no picture is
 * sent no place at all (`DRAWN_GAME` in sim/hunting.mjs), so there is nothing here to draw and nothing is drawn.
 */
// A mustang stands taller than a deer: it is a horse, drawn near the family's own horse's height (`SIZE.horse`).
const QUARRY_SIZE = Object.freeze({ deer: 1.1, turkey: .63, mustang: 1.45 });
function miniQuarry(ctx, x, y, size, { kind = 'deer', flip = false, alert = false, seed = 0 } = {}) {
  if (kind === 'mustang') {
    // Astra's `wildlife-mustang` (2026-09-21): grazing while the hunter is still coming, head up the moment the family is
    // asked whether to take the shot - the deer's contract exactly. The eight gallop beats have no state to be drawn in.
    if (animated(ctx, alert ? 'mustang-alert' : 'mustang-graze', x, y, size, seed, { flip })) return;
    // ceiling: the fallback is the library's own saddle horse, and then the procedural horse shape under it - the right
    // animal in the wrong coat, which is what every fallback in this file is. A dun mustang shape of its own is nobody's
    // request; it is only ever seen if the wildlife sheet fails to load at all.
    miniAnimal(ctx, x, y, size, { id: `quarry-${seed}`, kind: 'animal', species: 'horse' }, flip);
    return;
  }
  if (kind === 'turkey') {
    // Foraging while the hunter is still coming; head up the moment the family is asked whether to take the shot, which
    // is the turkey's own tell and the same contract the deer's alert pose has.
    if (animated(ctx, alert ? 'turkey-alert' : 'turkey-forage', x, y, size, seed, { flip })) return;
    turkeyFallback(ctx, x, y, size, flip);
    return;
  }
  if (animated(ctx, alert ? 'deer-alert' : 'deer-idle', x, y, size, seed, { flip })) return;
  deerFallback(ctx, x, y, size, flip);
}
function miniWagon(ctx, x, y, size, entity = {}, flip = false) {
  const rolling = entity.travel ? (entity.laden ? 'wagon-loaded-travel' : 'wagon-travel') : 'wagon-idle';
  if (entity.condition === 'sound' && animated(ctx, rolling, x, y, size, entity.id, { flip: !flip, gait: entity.gait })) return;
  // A wagon that has come to harm shows it. Nothing here invents that state: it is drawn
  // only when the projection this student is allowed to see already says so.
  const sound = !entity.condition || entity.condition === 'sound';
  if (drawSprite(ctx, !sound ? 'wagon-broken' : entity.laden ? 'wagon-loaded' : 'wagon-covered', x, y, size, { flip })) return;
  groundShadow(ctx, x, y, size * .55);
  ctx.fillStyle = '#786446'; ctx.fillRect(x - size * .7, y - size * .62, size * 1.4, size * .55);
  ctx.fillStyle = '#f7edcf'; ctx.beginPath(); ctx.ellipse(x, y - size * .57, size * .65, size * .6, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4b4435'; for (const wheel of [-.47, .47]) { ctx.beginPath(); ctx.arc(x + size * wheel, y - size * .18, size * .22, 0, Math.PI * 2); ctx.fill(); }
}
// A DeWitt colony cabin: squared logs, a steep shake roof, a stick-and-mud chimney.
// No barns, no windmills - those belong to a later century and another country.
function logCabin(ctx, x, y, size, wide = false) {
  const w = size * (wide ? 1.35 : 1), body = size * 1.02;
  ctx.fillStyle = '#8d6a49';
  ctx.fillRect(x - w, y - body * .68, w * 2, body * .72);
  // Log courses.
  ctx.strokeStyle = '#7a5a3e'; ctx.lineWidth = Math.max(.6, size * .055);
  for (let course = 1; course < 4; course++) {
    const ly = y - body * .68 + (body * .72 / 4) * course;
    ctx.beginPath(); ctx.moveTo(x - w, ly); ctx.lineTo(x + w, ly); ctx.stroke();
  }
  // Roof.
  ctx.fillStyle = '#6b5340';
  ctx.beginPath();
  ctx.moveTo(x - w * 1.22, y - body * .62); ctx.lineTo(x, y - body * 1.5); ctx.lineTo(x + w * 1.22, y - body * .62);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#59452f'; ctx.lineWidth = Math.max(.5, size * .05); ctx.stroke();
  // Door and chimney.
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - size * .17, y - body * .2, size * .34, body * .24);
  ctx.fillStyle = '#8f8578'; ctx.fillRect(x + w * .78, y - body * 1.18, size * .26, body * .58);
}
// A homestead is one cabin. Which cabin is fixed by the site's own id, so a family
// always comes home to the same house.
const HOMESTEAD_CABINS = ['cabin-small', 'cabin-wide', 'storehouse', 'cabin-weathered'];
function miniBuilding(ctx, x, y, size, settlement = false, id = '', ruined = false) {
  if (!settlement) {
    // Nothing in the Gonzales afternoon burns a homestead, and this project invents no
    // such event. The state exists because the chapter it belongs to is documented, and
    // a family coming back to this ought to see it rather than read about it.
    if (ruined && drawSprite(ctx, 'cabin-ruin', x, y, size)) return;
    if (drawSprite(ctx, pickSprite(HOMESTEAD_CABINS, id), x, y, size)) return;
    return logCabin(ctx, x, y, size * .62);
  }
  // A settlement is a cluster of small buildings, not one large one. Gonzales held about
  // thirty-two structures in 1836 (HIST-GONZ-011); this is a handful standing for them,
  // and deliberately never a single oversized "town" building. Drawn back to front so a
  // near cabin overlaps a far one instead of cutting into it.
  const spots = [
    [-.86, -.62, .70, 'shed-open'], [.94, -.56, .72, 'cabin-small'],
    [-1.95, -.06, .80, 'cabin-wide'], [0, 0, .88, 'trading-house'],
    [1.88, .04, .78, 'cabin-small'], [-.98, .60, .74, 'storehouse'], [1.04, .66, .76, 'cabin-weathered'],
  ];
  for (const [dx, dy, weight, sprite] of spots) {
    const bx = x + dx * size, by = y + dy * size, scale = size * weight;
    if (!drawSprite(ctx, sprite, bx, by, scale)) logCabin(ctx, bx, by, scale * .62);
  }
}
// A family camped on its land by the wagon, before there is a house (docs/SETTLING_IN.md step 2).
// Not a stand-in: the library's road-camp kit - the fire, the pot, a bedroll and the bundles
// taken off the wagon - is exactly this. The wagon itself is drawn where it actually is, as
// property, so it is never painted in here: a family that took it to the timber has no wagon
// in its camp.
/**
 * A house on a homestead, by what kind it is and how far up it is (docs/SETTLING_IN.md step 4).
 *
 * Astra's houses-settling sheet (delivered 2026-09-14): each of the four houses finished, and going up as its site, its
 * walls and its roof. While a house is going up the family still camps beside it. The old cabins are kept only as what
 * is drawn if the sheet has not loaded.
 */
const HOUSE_FALLBACK = { 'round-log': 'cabin-weathered', 'hewn-log': 'cabin-small', 'dog-run': 'cabin-wide', jacal: 'shed-open' };
function homesteadHouse(ctx, x, y, size, id, view) {
  if (view.shelter === 'camp') return homesteadCamp(ctx, x, y, size, id);
  if (view.shelter === 'building') {
    homesteadCamp(ctx, x - size * .55, y + size * .18, size * .7, id);
    if (view.layout && drawSprite(ctx, `house-${view.layout}-${view.phase || 'site'}`, x + size * .12, y, size)) return;
    drawSprite(ctx, 'log-fallen', x + size * .38, y - size * .08, size * .5);
    drawSprite(ctx, 'log-fallen', x + size * .46, y + size * .08, size * .46);
    return;
  }
  if (view.shelter === 'house' && view.layout && (drawSprite(ctx, `house-${view.layout}`, x, y, size) || drawSprite(ctx, HOUSE_FALLBACK[view.layout], x, y, size * (view.layout === 'jacal' ? .8 : 1)))) return;
  return miniBuilding(ctx, x, y, size, false, id, view.shelter === 'ruined');
}
function homesteadCamp(ctx, x, y, size, id = '') {
  const seed = seedOf(id);
  if (!animated(ctx, 'fire-flicker', x + size * .12, y + size * .08, size * .34, seed)) drawSprite(ctx, 'campfire', x + size * .12, y + size * .08, size * .34);
  drawSprite(ctx, 'cooking-pot', x + size * .34, y + size * .12, size * .2);
  drawSprite(ctx, 'bedroll', x - size * .28, y + size * .2, size * .34);
  drawSprite(ctx, 'packed-belongings', x - size * .06, y - size * .12, size * .36);
}
// Open-grown post oak: a broad canopy on a short trunk (HIST-GONZ-012). Kept as the
// fallback for when the nature sheet has not loaded, or has failed to.
const TIMBER_TREES = ['oak-broad', 'oak-spreading', 'pecan'];
/** How many painted gale poses have been laid down, ever: `drawGroundDetail` reports the difference over its own pass. */
let galeDrawn = 0;
function postOak(ctx, x, y, size, tint = 0, lean = 0, gale = false) {
  // A whole number: a woods site passes a fractional tint, which indexed no tree and no green, and its stand was drawn as
  // three brown discs (found 2026-09-14).
  tint = Math.round(tint);
  const tree = TIMBER_TREES[((tint % 3) + 3) % 3];
  // A hard norther is the painted gale pose, and no shear over it: the frame is already bent, and shearing it again
  // would lay it on the ground (public/weather-art.js `galePose`). The sway clip of the same name is the upright tree
  // and is what every lesser wind still gets.
  if (gale && GALE_POSES[tree] && drawSprite(ctx, GALE_POSES[tree], x, y, size)) { galeDrawn++; return; }
  if (animated(ctx, `${tree}-wind`, x, y, size, tint, { lean })) return;
  if (drawSprite(ctx, tree, x, y, size, { lean })) return;
  ctx.fillStyle = '#6a4a33';
  ctx.fillRect(x - size * .09, y - size * .5, size * .18, size * .5);
  const greens = ['#5f8a48', '#6d9a52', '#57803f'];
  // A negative tint must not index off the end: an undefined fill silently keeps the trunk colour.
  ctx.fillStyle = greens[((tint % greens.length) + greens.length) % greens.length];
  // The shapeless fallback tree leans by carrying its crown over, which is all a stack of discs can do.
  for (const [dx, dy, r] of [[-.42, -1.12, .46], [.4, -1.10, .44], [0, -1.36, .54], [0, -1.0, .48]]) {
    ctx.beginPath(); ctx.arc(x + (dx + lean * -dy) * size, y + dy * size, r * size, 0, Math.PI * 2); ctx.fill();
  }
}
// Worm-rail fence: the frontier fence, split rails stacked in a zigzag. `fence-rail` was
// delivered on the equipment sheet and is used whenever a rail would be big enough to read;
// below that the procedural zigzag draws it, because a sprite scaled to four pixels is a
// smear. The procedural weight is capped because `size` grows with the zoom, and an
// uncapped rail becomes a wall across the field.
function railFence(ctx, points, size, broken = false) {
  if (broken && hasSprite('fence-broken') && size > 20) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y), count = Math.max(1, Math.ceil(length / (size * 1.4)));
      for (let n = 0; n < count; n++) {
        const t = (n + .5) / count;
        ctx.save(); ctx.translate(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        drawSprite(ctx, 'fence-broken', 0, 0, size * .28); ctx.restore();
      }
    }
    return;
  }
  if (hasSprite('fence-rail') && size > 20) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y), count = Math.max(1, Math.ceil(length / (size * .7)));
      for (let n = 0; n < count; n++) {
        const t = (n + .5) / count;
        ctx.save(); ctx.translate(a.x + (b.x-a.x)*t, a.y + (b.y-a.y)*t); ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
        drawSprite(ctx,'fence-rail',0,0,size*.28);ctx.restore();
      }
    }
    return;
  }
  ctx.strokeStyle = '#8a6c46'; ctx.lineWidth = Math.max(1.2, Math.min(9, size * .09)); ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = '#b7955f'; ctx.lineWidth = Math.max(.7, Math.min(5, size * .05));
  ctx.stroke();
}
// Where an entity was actually drawn, so a click can find it again.
const drawnAt = new Map();
// When each shot was first seen by this browser. Display state and nothing else: the
// server says a shot is happening this tick, and this remembers when the puff started so
// it plays from its own beginning.
const shotSince = new Map();
// Who was drawn sitting on what this frame, and where each part of them went, for the proofs (docs/evidence/riding-browser.json).
const seatedDrawn = new Map();
/**
 * Somebody on the horse, or driving the ox and wagon, drawn as one. The ox and wagon and the ridden horse are not drawn
 * again by themselves (public/motion.js `seatLayout`).
 *
 * Since Astra's mounted family and wagon drivers landed (2026-09-21) there are two ways this is done, and `seatedClip`
 * chooses between them:
 * - **The delivered art.** A rider and the chestnut horse under them are one painted frame, four beats of a walk, drawn
 *   at the height a rider and horse have always been drawn at. A driver is a whole seated figure with reins and a goad,
 *   standing on the footboard, composited over the wagon and team the renderer still draws itself.
 * - **The composite stand-in**, which is what it was before: the top of a standing figure laid over a separately drawn
 *   mount and cut below the hip. It is still what a child on the horse gets, and a second-cast driver, because neither
 *   is in the delivery - and what anybody gets while the sheet is still on its way (`clipReady`).
 * stand-in: docs/ART_REQUESTS.md, requests 2026-09-14 (family members on horseback) and 2026-09-16 (driving the ox wagon):
 * narrowed, not retired, to the children on the horse and the second cast driving.
 */
function drawSeated(ctx, x, y, size, entity, seat, entities, flip, gait) {
  const direction = travelDirection(entity) || 'e';
  const vertical = direction === 'n' || direction === 's';
  const along = vertical ? 1 : flip ? -1 : 1;
  const own = entities.filter(other => other.householdId === entity.householdId);
  // The wagon they drive and the ox before it, of however many the family has on the road (public/motion.js `wagonTeams`).
  const team = seat === 'wagon' ? teamDrivenBy(entity, entities) : null;
  const mount = {
    // The horse they are on: the one the server has them holding (a family may own more than one, sim/beasts.mjs), else the first.
    horse: own.find(other => other.kind === 'animal' && other.species === 'horse' && other.borrowedBy === entity.id && other.travel?.mode === 'horse') || own.find(other => other.kind === 'animal' && other.species === 'horse'),
    ox: team?.ox || own.find(other => other.kind === 'animal' && other.species !== 'horse'),
    wagon: team?.wagon || own.find(other => other.kind === 'wagon'),
  };
  // Asked before anything is drawn, because the whole layout depends on the answer: one painted rig has no horse under it
  // and nothing to clip. A sheet still on its way answers no and is asked for, so the next frame can answer yes.
  const delivered = seatedClip(entity, direction, seat);
  const ready = Boolean(delivered.whole || delivered.seated) && clipReady(delivered.id);
  const drawn = [];
  // Whoever rides in this wagon behind its driver (sim/company.mjs; owner, 2026-09-25), sat in it after the wagon and before the
  // driver, so the driver is drawn in front of them. They are not drawn again beside it (public/motion.js `carriedWithRider`).
  const layout = seatLayout(seat, direction, SIZE, figureScale(entity), ready ? (seat === 'horse' ? MOUNTED_HEIGHT : 1) : 0);
  const riders = passengersOf(team, entities).map((rider, i) => ({ ...bedLayout(direction, i, SIZE, figureScale(rider)), rider }));
  // Going north they sit nearer the camera than the driver (`front`), so they are drawn after the driver instead.
  const driverAt = layout.findIndex(part => part.part === 'rider');
  if (riders.length) layout.splice(riders[0].front ? driverAt + 1 : driverAt, 0, ...riders.reverse());
  for (const part of layout) {
    const px = x + part.dx * size * along, py = y + part.dy * size, height = part.height * size;
    if (part.part === 'passenger') {
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - riders in the wagon. Their own idle figure, cut below the waist.
      ctx.save();
      ctx.beginPath(); ctx.rect(px - height * 2, py - height * 1.5, height * 4, height * (.5 + part.shown)); ctx.clip();
      const clip = seatedClip(part.rider, direction, null);
      if (!animated(ctx, clip.id, px, py, height, part.rider.id, { paused: true })) miniPerson(ctx, px, py, size, { ...part.rider, travel: null, flip });
      ctx.restore();
      drawnAt.set(part.rider.id, { x: px, y: py - height * .45, size: height });
      drawn.push({ part: 'passenger', id: part.rider.id, x: Math.round(px), y: Math.round(py), height: Math.round(height) });
      continue;
    }
    if (part.part === 'rider' && (part.whole || part.seated)) {
      // Drawn entire and standing on its own ground line: the painted rig already has its legs, or the driver their boots.
      // A ridden east cycle is mirrored for west as every other east cycle is; a painted north or south one never is.
      animated(ctx, delivered.id, px, py, height, entity.id, { flip: delivered.upright ? false : flip, gait: part.whole ? gait : undefined });
    } else if (part.part === 'rider') {
      // Their own figure from the head down to just below the waist; the rest would be inside the saddle or the box.
      ctx.save();
      ctx.beginPath(); ctx.rect(px - height * 2, py - height * 1.5, height * 4, height * (.5 + part.shown)); ctx.clip();
      const clip = seatedClip(entity, direction, null);
      if (!animated(ctx, clip.id, px, py, height, entity.id, { paused: true })) miniPerson(ctx, px, py, size, { ...entity, travel: null, flip });
      ctx.restore();
    } else {
      // The family's own beast, as the server has it on the road with them; a stand-in of the right kind if it is not in view.
      const beast = mount[part.part] || { id: `${entity.id}-${part.part}`, kind: part.part === 'wagon' ? 'wagon' : 'animal', species: part.part, condition: 'sound' };
      const moving = { ...beast, travel: entity.travel };
      if (part.part === 'wagon') miniWagon(ctx, px, py, height, moving, flip);
      else miniAnimal(ctx, px, py, height, moving, flip);
    }
    drawn.push({ part: part.part, x: Math.round(px), y: Math.round(py), height: Math.round(height), ...(part.shown && { shown: part.shown }),
      ...(part.whole && { whole: true }), ...(part.seated && { seated: true }) });
  }
  // `art` is the delivered clip if one was drawn, and null while the composite stand-in stands in for it: the one fact a
  // proof needs to tell "Astra's painted rider" from "a cropped figure over a horse" without reading pixels.
  seatedDrawn.set(entity.id, { seat, direction, art: ready ? delivered.id : null, parts: drawn });
}
/**
 * How tall somebody is drawn, in pixels, from the camera's figure size: everything is drawn standing on its point, so this
 * is a height and not a radius. Somebody on a horse is drawn the height of a horse with a rider on it - at a person's height
 * the horse under them was a toy, smaller than the family's own horse standing in the yard (found in play 2026-09-14).
 * Read by `drawEntity` and, a frame earlier, by `sightOf`, which needs it to know what pace this figure may be drawn at.
 */
function drawnHeightOf(entity, size, seat) {
  if (entity.kind === 'animal') return size * (entity.species === 'horse' ? SIZE.horse : SIZE.ox);
  if (entity.kind === 'wagon' || seat === 'wagon') return size * SIZE.wagon;
  return size * (mounted(entity) ? MOUNTED_HEIGHT : 1);
}
function drawEntity(ctx, entity, point, named, size = 20, marks = {}) {
  // The horse is under its rider, and the ox and wagon under their driver, drawn with them (public/motion.js `seatOf`).
  if (!marks.observed && carriedWithRider(entity, marks.entities || [])) return;
  const seat = marks.observed ? null : seatOf(entity, marks.entities || []);
  // Cosmetic separation only. Overlapping drawings must never imply different true positions.
  const spread = size / 26;
  // On the road a person is drawn exactly where the server says they are. Their ox and
  // their wagon are at the same point on the same road, so without this they would be
  // drawn standing inside each other; a hand's width apart reads as a family travelling
  // together and still never claims a different true position.
  // An animal walking on its own feet beside the family - a horse or an ox bought in town and led home on a halter (sim/beasts.mjs),
  // or the beasts walking east in the flight - is drawn a length behind, on its lead, so it is not hidden under the one leading it.
  const behind = { e: { x: -1, y: 0 }, w: { x: 1, y: 0 }, n: { x: 0, y: 1 }, s: { x: 0, y: -1 } }[travelDirection(entity) || 'e'] || { x: -1, y: 0 };
  // A family with more than one wagon on the road (sim/beasts.mjs, 2026-09-25) is at one point on it: each wagon after the first,
  // with its driver on it, is drawn a whole rig's length - its ox and its wagon - behind the one before, in line, so two wagons read
  // as two and the ox of one does not stand over the driver and the riders of the one ahead (widened from a wagon's length when
  // riders came into the wagons, 2026-09-25).
  const train = seat === 'wagon' ? wagonTeams(entity.householdId, marks.entities || []).findIndex(team => team.driverId === entity.id) : 0;
  // Those the server said walk beside the wagons (sim/company.mjs, 2026-09-25) are drawn in a file along the near side of the
  // train, each a stride behind the one before, so a family of ten walking reads as ten people and not one figure.
  const walker = walksBeside(entity) ? (marks.entities || []).filter(other => other.householdId === entity.householdId && walksBeside(other)).findIndex(other => other.id === entity.id) : -1;
  const vertical = behind.x === 0;
  const offset = entity.travel
    ? (entity.kind === 'wagon' ? { x: -2.4, y: .5 } : entity.kind === 'animal' && entity.travel.mode === 'foot' ? { x: behind.x * 26, y: behind.y * 36 + 2 } : entity.kind === 'animal' ? { x: -1.1, y: .2 }
      : train > 0 ? { x: behind.x * 82 * train, y: behind.y * 60 * train + 3 * train }
      : walker >= 0 ? (vertical ? { x: 30 + (walker % 2) * 12, y: behind.y * (8 + 20 * walker) } : { x: behind.x * (-10 + 17 * walker), y: 14 + (walker % 2) * 5 })
      : { x: 0, y: 0 })
    : stableOffset(entity.id);
  const x = point.x + offset.x * spread, y = point.y + offset.y * spread * .8;
  // Everything is drawn standing on (x, y), so `size` is a height and the click target
  // is the body above that point, not a circle centred on the feet.
  const height = drawnHeightOf(entity, size, seat);
  // How much of this figure is drawn at all: 1 in view, 0 while the middle of a long journey is being crossed with nobody
  // watching (public/motion.js `travelSight`, worked out for the frame in `sightOf`). Nothing stands in for them - the road
  // they are on is all that is drawn, by `drawTravelRoads`.
  const figure = marks.sight ? marks.sight.alpha : 1;
  if (figure > 0) {
    drawnAt.set(entity.id, { x, y: y - height * .45, size: height });
    drawFigure(ctx, entity, x, y, size, height, seat, figure, marks);
  }
  // Something is being asked of this person. The mark is the invitation; clicking is the
  // answer, so it is collected and drawn last: a cabin roof standing between the camera
  // and a person must never hide the one thing on screen asking to be pressed. Nobody away on the road is asked anything.
  if (marks.mark && figure > 0) marks.mark.list.push({ id: entity.id, kind: marks.mark.kind || 'task', x, y: y - height, size, glyph: marks.mark.glyph, tone: marks.mark.tone });
  // The label sits just under the feet whatever the zoom - scaling the offset with the
  // sprite would fling a name a screen's width below a close-up figure - and it is
  // handed back rather than drawn, because the ox drawn after this person would
  // otherwise stand on their name.
  if ((named || entity.principal) && figure > 0) {
    marks.labels?.push({
      name: entity.name || entity.id, x, y: y + Math.max(13, Math.min(26, size * .22)),
      font: `${Math.round(Math.max(11, Math.min(16, size * .26)))}px system-ui`,
    });
  }
}
/**
 * Where a traveller is drawn along their road this frame and how much of them is drawn, or null for anybody standing still.
 *
 * Owner, 2026-09-22: "i want to see them walk at a normal pace, then when they've walked a ways... they should fade out...
 * then after they travel extra fast, they fade back in... that way they arrive at the correct time, but no one sees them
 * move unnaturally", and "everyone should move at normal speed at all times (unless on horseback or wagon) on their land."
 * The schedule is public/motion.js `travelSight`; this is the frame it is asked about.
 *
 * The gait it is held to is measured in this figure's own drawn height - a person's, a rider's with the horse
 * (`MOUNTED_HEIGHT`), a driver's with the wagon, a beast's or a wagon's own - so the pace it is capped at is the pace of
 * whatever they are on. `ownGrant` is the family's own land, and the road inside it is walked in view whatever it costs.
 *
 * Beasts and a wagon going with their family are drawn with the person on them (`carriedWithRider`), so they are asked
 * about anyway and answer the same, and only their road is drawn once (`drawTravelRoads`).
 * ceiling: the Host is sent only the three miles of road round each traveller (sim/overview.mjs `roadWindow`), and the
 * schedule walks a figure well behind where the server has them. Where that falls outside the window, `alongRoute` clamps
 * it to the window's end, so on the teacher's page a figure fading out can sit a moment at the edge of its own stretch of
 * road rather than on it. It lasts one fade and only on the Host page; the way out is a window round the drawn place
 * rather than the true one, which is a server change.
 * ceiling: a person's pace is measured against a grown figure's height, so a child walking beside a parent fades with them;
 * measured against the child's own smaller height the child would fade first and the family would split on the road.
 */
function sightOf(entity, height, marks) {
  const seen = travelSeen.get(entity.id) || { alpha: 1 };
  const since = marks.now - (seen.shownAt ?? marks.now), wasAt = seen.miles;
  seen.heightsPerSecond = 0; seen.journey = null; seen.drawn = false; seen.shownAt = marks.now;
  travelSeen.set(entity.id, seen);
  // Only somebody the server has on the road now is scheduled. On the tick they arrive they are still drawn walking the last
  // of the road in, at the pace the schedule left them at, and whole - which is how a hunter is drawn reading the ground.
  const journey = entity.facing || entity.speaking ? null : motionProjection.journey(entity, marks.frozen);
  if (!journey?.points?.length || !marks.running || reducedMotion.matches) { seen.alpha = 1; return null; }
  const miles = motionProjection.drawnMiles(entity, marks.now, marks.frozen);
  const milesATick = travelMilesATick(journey, minutesATick);
  const gait = gaitMilesASecond({ scale: marks.scale, heightPx: height });
  // The family's own land under this road, once a journey rather than once a frame: a road is a few hundred points and this
  // is asked of every traveller on every painted frame.
  const key = `${entity.id}|${journey.from}|${journey.to}|${journey.points.length}|${journey.base || 0}|${Boolean(ownGrant)}`;
  let runs = landRunCache.get(key);
  if (!runs) {
    if (landRunCache.size > 200) landRunCache.clear();
    runs = landRuns(journey.points, marks.observed ? null : ownGrant, journey.distance, journey.base || 0);
    landRunCache.set(key, runs);
  }
  const sight = travelSight({ distance: journey.distance, miles, milesASecond: drawnMilesASecond({ milesATick, tickMs: marks.tickMs }), gait, ...runs });
  // Eased toward what the schedule asks for rather than taken from it, so the schedule changing under a student's hand -
  // rolling the zoom wheel in on somebody halfway across the country moves the gait past the server's pace in one frame -
  // is a short fade and not a figure vanishing between two frames (public/motion.js `fadeToward`). At once for a page with
  // no earlier tick of them: it has just opened, or the Host jumped time, and a fade is for a change a student watches.
  //
  // **And never eased across a leap.** Between two frames the figure must actually have walked, or the ease would keep a
  // half-drawn figure on screen while the schedule carries it across the country - which is the one thing this whole
  // schedule exists to prevent. A leap happens whenever the schedule itself moves: the teacher changes the class pace, the
  // calendar turns over to longer ticks, or the camera zooms while somebody is out in the middle. Then the figure takes the
  // schedule's answer at once, which is nothing at all, and only the road is left.
  const leapt = !Number.isFinite(wasAt) || !(since > 0)
    || Math.abs(sight.miles - wasAt) * marks.scale / height / (since / 1000) > GAIT_CEILING * 1.05;
  const instant = leapt || since > FADE_STALE_MS || !motionProjection.records.get(entity.id)?.previous;
  // Presentation evidence: the frames on which the schedule itself moved, which a proof measuring a drawn speed has to
  // leave out - the ground between two such frames is the schedule, not a walk.
  seen.leapt = leapt;
  seen.alpha = instant ? sight.alpha : fadeToward(seen.alpha ?? 1, sight.alpha, since);
  seen.wanted = sight.alpha; seen.miles = sight.miles; seen.serverMiles = miles; seen.journey = journey;
  // How fast the server is carrying them across this screen, in their own drawn heights a second, and how fast they are
  // actually drawn going while any of them is in view: the second is what `GAIT_CEILING` is a ceiling on, and what a proof
  // measures frame by frame.
  seen.heightsPerSecond = drawnHeightsPerSecond({ milesATick, tickMs: marks.tickMs, scale: marks.scale, heightPx: height });
  seen.shownHeightsPerSecond = sight.rate * seen.heightsPerSecond;
  seen.faded = sight.faded; seen.lead = sight.lead; seen.tail = sight.tail;
  seen.at = alongRoute(journey.points, sight.miles - (journey.base || 0)) || null;
  return seen;
}
/** The figure itself, at `alpha` of itself: the whole of it, or fading out of view and back on a long journey (`sightOf`). */
function drawFigure(ctx, entity, x, y, size, height, seat, alpha, marks) {
  const alphaWas = ctx.globalAlpha;
  // A figure fading out keeps walking while it fades: it is going somewhere, and a figure that freezes and then dissolves
  // reads as a bug. Only how much of it is drawn changes.
  if (alpha < 1) ctx.globalAlpha = alphaWas * alpha;
  if (marks.selected) {
    ctx.strokeStyle = marks.observed ? '#cfd6c2' : '#f0d38a';
    ctx.lineWidth = Math.max(2, size * .11);
    if (marks.observed) ctx.setLineDash([Math.max(3, size * .18), Math.max(3, size * .18)]);
    ctx.beginPath(); ctx.ellipse(x, y, height * .42, height * .16, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // The sheets all face right, so anyone walking west is mirrored. A rider who has
  // reined in is turned toward the person they are speaking to instead, which the server
  // works out from where the two of them actually are.
  const flip = entity.facing ? entity.facing === 'w' : travelDirection(entity) === 'w';
  // Somebody on the road steps at the rate the ground drawn under them goes past (public/motion.js `gaitStep`),
  // measured in their own drawn height: a child's shorter stride, a horse's longer one.
  const onFoot = entity.kind === 'person' && !mounted(entity);
  const gait = entity.travel && !entity.travel.halted && !entity.facing && marks.ground && marks.scale > 0
    ? { id: entity.id, at: marks.ground, bodyMiles: height * (onFoot ? figureScale(entity) : 1) / marks.scale, stride: onFoot ? STRIDE.foot : STRIDE.hoof }
    : null;
  if (seat) drawSeated(ctx, x, y, size, entity, seat, marks.entities || [], flip, gait);
  else if (entity.kind === 'person') miniPerson(ctx, x, y, mounted(entity) ? height : size, { ...entity, observed: marks.observed, flip, gait });
  else if (entity.kind === 'animal') miniAnimal(ctx, x, y, height, { ...entity, gait }, flip);
  else if (entity.kind === 'wagon') miniWagon(ctx, x, y, height, { ...entity, gait }, flip);
  // The one moment of a hunt that can be shown. `musket-smoke` runs once - small, growing,
  // dispersing, just over a second - so it is sampled from when this client first saw the
  // shot rather than from the shared animation clock, which would catch it already gone.
  // Nothing else changes: there is no civilian firing pose in the library, and borrowing
  // the militia one would put a soldier in the timber.
  if (entity.chore?.doing === 'the shot') {
    if (!shotSince.has(entity.id)) shotSince.set(entity.id, performance.now());
    animated(ctx, 'musket-smoke', x + size * .38 * (flip ? -1 : 1), y - size * .56, size * .85, 0,
      { timeMs: performance.now() - shotSince.get(entity.id) });
  } else if (shotSince.has(entity.id)) shotSince.delete(entity.id);
  ctx.globalAlpha = alphaWas;
}
// Names are read against an illustration now, not a flat wash: dark green on a dark
// tree canopy is unreadable. A pale halo carries the text over whatever is behind it
// without putting a box on the map.
function caption(ctx, text, x, y) {
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.lineWidth = 3.5;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#26382e'; ctx.fillText(text, x, y);
}
/**
 * The names on the map, laid out so they do not pile on each other.
 *
 * A family standing together - the four of them round the wagon on their own land - drew four names in the same few
 * pixels, and a Chromebook screenshot of it is a smear of text over the one thing the student was meant to be looking at
 * (found 2026-09-21). Each name is placed where it asks to be; one that would land on a name already placed steps down a
 * line at a time, and is left undrawn if it still has nowhere to sit. Nothing is lost by dropping it: the person is still
 * there to press, still marked, and still named on the family panel. Earlier names win, which is the order the drawing
 * already sorted people into - nearest the front first.
 *
 * Returns what was drawn and what was dropped, on the same contract as `__viewEntities`: read by proofs and by nothing in
 * the application.
 */
const LABEL_STEPS = 3;
function layOutCaptions(ctx, labels, placeFont) {
  const placed = [];
  const drawn = [], dropped = [];
  for (const label of labels) {
    ctx.font = label.font || placeFont;
    const line = Math.max(11, Number.parseInt(ctx.font, 10) || 13);
    const half = ctx.measureText(label.name).width / 2 + 3;
    let box = null;
    for (let step = 0; step <= LABEL_STEPS && !box; step++) {
      const y = label.y + step * (line + 2);
      const want = { left: label.x - half, right: label.x + half, top: y - line, bottom: y + 4, y };
      if (!placed.some(one => want.left < one.right && one.left < want.right && want.top < one.bottom && one.top < want.bottom)) box = want;
    }
    if (!box) { dropped.push(label.name); continue; }
    placed.push(box);
    caption(ctx, label.name, label.x, box.y);
    drawn.push({ name: label.name, x: Math.round(label.x), y: Math.round(box.y), steppedDown: Math.round(box.y - label.y) });
  }
  return { drawn, dropped };
}
function drawTaskMark(ctx, { x, y, size, glyph = '!', tone = '#c2582c' }) {
  const mark = Math.max(9, Math.min(26, size * .34));
  const top = y - mark * 1.1, bob = reducedMotion.matches ? 0 : Math.sin(animationTime / 260) * mark * .25;
  ctx.fillStyle = tone; ctx.strokeStyle = '#fff8e6'; ctx.lineWidth = Math.max(1.5, mark * .22);
  ctx.beginPath(); ctx.arc(x, top + bob, mark, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e6'; ctx.font = `bold ${Math.round(mark * (glyph.length > 1 ? 1.05 : 1.5))}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x, top + bob + mark * .06);
  ctx.textBaseline = 'alphabetic';
}
/**
 * The road each fading or invisible traveller is on, and nothing else.
 *
 * Owner, 2026-09-22, by multiple choice - what a student sees of somebody crossing the country out of view: **"The road
 * only"**, no figure and no marker, but a faint line showing the road they are on. So this draws the road still ahead of
 * them as the same dotted line the marker's road was, coming up as the figure fades out and going as it fades back in, and
 * draws nothing else at all: no disc, no pin, no portrait, no destination ring. Those were the marker
 * (docs/ART_REQUESTS.md, request 2026-09-19, withdrawn 2026-09-22 with its stand-in), and the owner's words for them were
 * "i don't want to see icons."
 *
 * Drawn over everybody standing, so a road crossing a settlement is not lost under its roofs. A family going together is
 * one journey and its road is drawn once.
 *
 * The road *behind* them is not drawn: the road itself is on the ground, and a line behind as well as ahead was two lines
 * to read on a small screen. That rule the marker proved, and it is kept.
 * Nothing here allocates per traveller: the route is walked in place (`routeIndexAfter`) and projected by hand rather than
 * through `camera.toScreen`.
 */
const ROUTE_DASH = [0, 0], NO_DASH = [];
// Faint, because it is scenery for an absence and not a thing to press: a traveller's road never asks to be tapped.
const ROAD_INK = 'rgba(59,50,33,.55)', ROAD_HALO = 'rgba(252,249,238,.65)';
function drawTravelRoads(ctx, list, camera, canvas) {
  if (!list.length) return;
  const alphaWas = ctx.globalAlpha, halfW = canvas.width / 2, halfH = canvas.height / 2, { cx, cy, scale } = camera;
  const dot = Math.max(2.5, Math.min(5, camera.figure * .09));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < list.length; i++) {
    const seen = list[i].seen, travel = seen.journey, points = travel?.points;
    if (!points?.length) continue;
    let already = false;
    for (let j = 0; j < i && !already; j++) {
      already = list[j].seen.journey === travel || (sameJourney(list[j].seen.journey, travel) && Math.abs(list[j].seen.miles - seen.miles) < .05);
    }
    if (already) continue;
    const start = routeIndexAfter(points, seen.miles - (travel.base || 0));
    if (start >= points.length) continue;
    // The road comes up as the figure goes and goes as the figure comes back: the two always add to one.
    ctx.globalAlpha = alphaWas * (1 - seen.alpha);
    const at = camera.toScreen(seen.at || points[0]);
    ctx.beginPath(); ctx.moveTo(at.x, at.y);
    for (let k = start; k < points.length; k++) ctx.lineTo(halfW + (points[k].x - cx) * scale, halfH + (points[k].y - cy) * scale);
    ROUTE_DASH[1] = dot * 2.6; ctx.setLineDash(ROUTE_DASH);
    ctx.strokeStyle = ROAD_HALO; ctx.lineWidth = dot + 2.5; ctx.stroke();
    ctx.strokeStyle = ROAD_INK; ctx.lineWidth = dot; ctx.stroke();
    ctx.setLineDash(NO_DASH);
    seen.drawn = true;
  }
  ctx.globalAlpha = alphaWas;
}
// Which person, if any, has something waiting for them (`requestFor`), and who is standing with a rider (`meetingFor`):
// both in public/family-panel.js, so the mark over a person on the map and the "!" on their panel row read one rule.
const taskFor = requestFor;
// How far word has travelled from the person who saw it, said the way a person would say
// it. Beyond the third hand nobody counts, they just know it has been about.
const handLabel = hands => hands === 1 ? 'second-hand' : hands === 2 ? 'third-hand' : `through ${hands} hands`;
export function selectedEntity(world) {
  const own = entitiesOf(world);
  // With nobody chosen, the card is the student's main person's (docs/FAMILY_PANEL.md §11), and the principal's until one is.
  return own.find(entity => entity.id === selectedId)
    || observedOf(world).find(entity => entity.id === selectedId)
    || own.find(entity => entity.id === focusedId)
    || own.find(entity => entity.id === world.household?.principalId) || null;
}
/**
 * Houses drawn this frame: where a tap opens the interior (public/interior.js). A house drawn at its site is keyed by the
 * site and reached `.7` and `.6` of its size either side of its middle; a house placed on the land (`drawPlacedHouse`) is
 * wherever it was drawn, keyed `<site>:placed:<n>` with its `siteId`, reached over the box its pictures cover. Until
 * 2026-09-23 a placed house was only reachable at the site point, where nothing of it was drawn (`notePlacedHouse`).
 */
const housesDrawn = new Map();
let interiorSiteId = null;
function houseAt(point) {
  for (const [key, spot] of drawnNow(housesDrawn)) if (Math.abs(point.x - spot.x) < Math.max(18, spot.size * (spot.reachX ?? .7)) && Math.abs(point.y - spot.y) < Math.max(18, spot.size * (spot.reachY ?? .6))) return spot.siteId || key;
  return null;
}
/**
 * The houses of one family's land: the one being raised and those it has finished, each at its own placement or, placed
 * nowhere (an old save, a house planned before placement), at the site `q`. Returns how many pieces of the one being
 * raised were drawn at the site. Where a tap opens the rooms follows what was drawn: each placed house where it stands
 * (`notePlacedHouse`), and the site only while a house stands at it - on the family's own map and the Host's, the lands
 * whose site `drawWorld` noted in `housesDrawn`.
 * Zoomed out past `HOUSE_LEGIBLE` (`camera.house.one`) only the family's home is drawn (`landHome`), and only it is tapped.
 * ceiling: every house of the land is drawn as one standing item at the site's y (drawWorld), so a person just behind a
 * placed house can be drawn over its near side; a standing item per placed house, at its own y, is the way out.
 */
function drawLandHouses(ctx, camera, siteId, q, size, current, completed = []) {
  const tappable = housesDrawn.has(siteId), placed = Boolean(current?.placement), home = landHome(current, completed);
  const shown = house => !camera.house.one || house === home;
  const pieces = shown(current) && !placed ? drawHousePlot(ctx, q.x, q.y, size, { house: current }, plotCatalogue, drawSprite, spriteFrame) : 0;
  let atSite = shown(current) && !placed;
  for (const house of [...(completed || []), ...(placed ? [current] : [])]) {
    if (!shown(house)) continue;
    if (house.placement) { const box = drawPlacedHouse(ctx, camera, house); if (tappable) notePlacedHouse(siteId, box, size); }
    else { drawHousePlot(ctx, q.x, q.y, size, { house }, plotCatalogue, drawSprite, spriteFrame); atSite = true; }
  }
  if (tappable && !atSite) housesDrawn.delete(siteId);
  return pieces;
}
/**
 * Two families' houses are never drawn over one another: of `houses` (`{ own, siteId, box, item }`, one a family, as
 * drawWorld collects them), the ones to draw and the ones left out. Close in none is left out, and none could be drawn over
 * another: a family's houses stand inside its own land (sim/house-placement.mjs), a neighbour's house as this family last
 * saw it is drawn at its site, which is `HOUSE_CLEARANCE` (0.35 miles) or more off anybody else's grant (sim/grants.mjs),
 * and a house is drawn no bigger than its ground. Zoomed out (`one`), each family's one house is `HOUSE_LEGIBLE` high
 * whatever the ground under it: two families' leagues can lie a tenth of a mile apart, so two houses built by the line
 * between them, or the family's house built near the site of the neighbour it borders, would be drawn into each other
 * below about 255 pixels a mile. So the family's own house is kept first, and each other family's only where it would not
 * be drawn over one already kept (measured by `box`, as it will be drawn); the name over it is still drawn.
 * ceiling: first kept, first drawn, in the order of the map's sites, so on the Host's map the earlier family of two keeps
 * its house zoomed out. The sites of the classes laid out so far stand 2.8 miles or more apart (ten seeds of both maps,
 * 2026-09-23), so only houses built far off their sites can meet; shrinking both into their own land is the way out if a
 * class shows the Host an empty place where a family lives.
 */
function keptApart(houses, one) {
  if (!one) return { kept: houses, hidden: [] };
  const boxes = [], kept = [], hidden = [];
  for (const each of [...houses].sort((a, b) => Number(b.own) - Number(a.own))) {
    const box = each.box();
    if (box && boxes.some(other => box.left < other.right && other.left < box.right && box.top < other.bottom && other.top < box.bottom)) { hidden.push(each); continue; }
    if (box) boxes.push(box);
    kept.push(each);
  }
  return { kept, hidden };
}
/** A family's home: the first house it finished (sim/interior.mjs opens its rooms), or the one it is raising. */
const landHome = (current, completed) => completed?.[0] || current;
/**
 * Where the one house `drawLandHouses` draws zoomed out (`camera.house.one`) covers the screen, measured by drawing it
 * (`drawnBox`) as it will be drawn: at its placement as `drawPlacedHouse` draws it, or at the site.
 */
function landHomeBox(camera, q, current, completed) {
  const home = landHome(current, completed), size = cabinSize(camera), cell = plotCell(size), rotation = home?.placement?.rotation || 0;
  const at = home?.placement ? camera.toScreen(home.placement) : null;
  return home && drawnBox(c => drawHousePlot(c, at ? at.x : q.x, at ? at.y + cell : q.y, size, { house: home }, plotCatalogue, drawSprite, spriteFrame, { rotation }));
}
/**
 * The box on the screen, `{ left, top, right, bottom }`, that the pictures a drawing lays down cover, or null for none: the
 * drawing is made into a context that only follows the transform and notes where each picture lands, so nothing is drawn.
 * Shapes drawn without a picture (the fallbacks while a sheet loads) are not counted.
 */
function drawnBox(draw) {
  let m = [1, 0, 0, 1, 0, 0], box = null;
  const stack = [], times = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  const followed = {
    globalAlpha: 1,
    save() { stack.push(m); }, restore() { m = stack.pop() || m; },
    translate(x, y) { m = times(m, [1, 0, 0, 1, x, y]); }, scale(x, y) { m = times(m, [x, 0, 0, y, 0, 0]); },
    rotate(t) { m = times(m, [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0]); },
    transform(...by) { m = times(m, by); }, setTransform(...to) { m = to; },
    drawImage(image, ...args) {
      const [x, y, w, h] = args.length >= 8 ? args.slice(4, 8) : args.length >= 4 ? args : [args[0], args[1], image?.width || 0, image?.height || 0];
      for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
        const sx = m[0] * px + m[2] * py + m[4], sy = m[1] * px + m[3] * py + m[5];
        box = box ? { left: Math.min(box.left, sx), top: Math.min(box.top, sy), right: Math.max(box.right, sx), bottom: Math.max(box.bottom, sy) } : { left: sx, top: sy, right: sx, bottom: sy };
      }
    },
  };
  try { draw(new Proxy(followed, { get: (to, key) => key in to ? to[key] : () => {}, set: (to, key, value) => { to[key] = value; return true; } })); } catch { /* a shape this context cannot follow: its pictures so far */ }
  return box;
}
/** A placed house drawn in `box` (screen pixels) opens its site's rooms, kept in sizes so a moved camera carries it. */
function notePlacedHouse(siteId, box, size) {
  if (!box || !(size > 0)) return;
  housesDrawn.set(`${siteId}:placed:${housesDrawn.size}`, { siteId, x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2, size, reachX: (box.right - box.left) / 2 / size, reachY: (box.bottom - box.top) / 2 / size });
}
/** The view the figures in `drawnAt` and the houses in `housesDrawn` were last drawn under (set in drawWorld). */
let drawnCamera = null;
/**
 * Drawn spots moved to where the camera now puts them. A tap is tested against what was drawn, but on a slow computer it can
 * arrive after a drag or a wheel has moved the camera and before the next frame has been drawn (public/map-camera.js).
 */
function drawnNow(spots) {
  const canvas = $('#world-map'), world = window.__snapshot?.world;
  if (!world || !drawnCamera || drawnCamera.width !== canvas.width || drawnCamera.height !== canvas.height) return spots;
  const now = cameraFor(world, canvas), size = { width: canvas.width, height: canvas.height };
  if (now.cx === drawnCamera.cx && now.cy === drawnCamera.cy && now.scale === drawnCamera.scale) return spots;
  // Except the person being watched: the camera moved because they walked on, and they with it. Moved as ground would be,
  // somebody watched pressed close in - 270 pixels a second at the Study pace before the gait was capped - would be carried
  // off their own spot by however long ago the last frame was drawn, a fingertip after about a tenth of a second (reasoned
  // 2026-09-19 with the travel marker, not seen to fail). They stay where they stood on the screen, scaled about its middle.
  const ratio = now.scale / drawnCamera.scale, half = { x: size.width / 2, y: size.height / 2 };
  return new Map([...spots].map(([id, spot]) => [id, id === watchedId && !now.following
    ? { ...spot, x: half.x + (spot.x - half.x) * ratio, y: half.y + (spot.y - half.y) * ratio, size: spot.size * ratio }
    : reproject(spot, drawnCamera, now, size)]));
}
/** The interior panel for the house at this site: the family's own, or on the Host's map any family's, read only. */
function renderInteriorPanel(world) {
  const panel = $('#interior');
  if (!panel) return;
  if (!interiorSiteId) { panel.hidden = true; return; }
  const host = hostView(world);
  const land = host ? Object.values(world.overview?.lands || {}).find(entry => entry.homeSiteId === interiorSiteId) : world.land;
  if (!land) { interiorSiteId = null; panel.hidden = true; return; }
  panel.hidden = false;
  const shown = JSON.stringify([interiorSiteId, land.interior, panel.clientWidth]);
  if (panel.dataset.shown === shown && !panel.dataset.dirty) return;
  panel.dataset.shown = shown; delete panel.dataset.dirty;
  window.__interiorShown = renderInterior(panel, land.interior, {
    title: host ? `INSIDE · ${land.name || 'a family'}`.toUpperCase() : 'INSIDE THE HOUSE', readOnly: host,
    say,
    send: async (item, spot) => {
      say('');
      try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'place-item', item, spot }); }
      catch (error) { say(error.message); panel.dataset.dirty = '1'; if (window.__snapshot) renderInteriorPanel(window.__snapshot.world); }
    },
  });
}
$('#interior-close')?.addEventListener('click', () => { interiorSiteId = null; clearInteriorChoice(); if (window.__snapshot) renderInteriorPanel(window.__snapshot.world); });
// The nearest figure within a fingertip (`nearestSpot`: reach neither grows with a zoomed-in ox nor shrinks below a finger),
// where the camera now puts it.
function entityAt(point) { return nearestSpot(drawnNow(drawnAt), point); }
// Formation soldiers are visual samples of aggregate state, never duplicate person entities.
let visibleBattlePhase = null, battleAnimationStart = 0;
function drawFormations(ctx, battle, project, named, tick, figure = 16) {
  const formations = battle?.formations || [];
  const phaseKey = battle ? `${battle.phase}:${Boolean(battle.reconstruction)}` : null;
  if (phaseKey !== visibleBattlePhase) { visibleBattlePhase = phaseKey; battleAnimationStart = animationTime; }
  const phaseTime = Math.max(0, animationTime - battleAnimationStart);
  for (const formation of formations) {
    const center = project(formation), count = Math.min(24, Math.max(0, formation.count || 0));
    // Capped: `figure` now grows with the zoom, and sampled formation members are a
    // visual summary of a count, not individuals to be examined close up.
    const size = Math.max(6, Math.min(30, figure * .8)), spacing = size * 1.35;
    const identityOffset = stableOffset(formation.id);
    for (let index = 0; index < count; index++) {
      const column = index % 6, row = Math.floor(index / 6);
      const x = center.x + (column - 2.5) * spacing + identityOffset.x * .08;
      const y = center.y + row * spacing + identityOffset.y * .08;
      const direction = formation.side === 'texian' ? 1 : -1;
      const role = formation.side === 'texian' ? 'volunteer' : 'regular';
      const marching = (battle.phase === 'approach' && formation.side === 'texian') || (battle.phase === 'withdrawal' && formation.side === 'mexican');
      const clip = battle.phase === 'exchange' ? `${role}-fire-reload` : marching ? `${role}-march` : `${role}-idle-e`;
      const shotTime = Math.max(0, phaseTime - (index % 6) * 110);
      const drawn = animated(ctx, clip, x, y, size, `${formation.id}:${index}`, { flip: marching ? false : direction < 0, timeMs: battle.phase === 'exchange' ? shotTime : animationTime });
      if (!drawn) miniPerson(ctx, x, y, size, { side: formation.side, flip: direction < 0 });
      // One illustrative discharge per phase, never a frame callback or combat result.
      if (battle.phase === 'exchange' && shotTime >= 700 && shotTime < 1840) {
        const smokeTime = shotTime - 700;
        if (smokeTime < 120) drawSprite(ctx, direction > 0 ? 'muzzle-flash-e' : 'muzzle-flash-w', x + direction * size * .7, y - size * .52, size * .3);
        animated(ctx,'musket-smoke',x + direction * size*.8,y-size*.5,size*.6,0,{timeMs:smokeTime,alpha:1-smokeTime/1140});
      }
    }
    if (formation.side === 'texian' && count) {
      const gunX = center.x + spacing * 3.8, gunY = center.y + spacing;
      const shotTime = phaseTime - 650, firing = battle.phase === 'exchange' && shotTime >= 0;
      const gunSize = size * 1.65;
      if (firing && shotTime < 900) animated(ctx,'cannon-iron-e-recoil',gunX,gunY,gunSize,0,{timeMs:shotTime});
      else drawSprite(ctx,'cannon-iron-e',gunX,gunY,gunSize);
      if (firing && shotTime < 1300) animated(ctx,'cannon-smoke',gunX+gunSize*.65,gunY-gunSize*.35,gunSize*.9,0,{timeMs:shotTime,alpha:1-shotTime/1300});
    }
    if (named) { ctx.fillStyle = '#405543'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(formation.side === 'mexican' ? 'Mexican troops' : 'Texian volunteers', center.x, center.y + Math.ceil(count / 6) * spacing + 12); }
  }
  return formations.map(formation => formation.id);
}
export function visibleEntityIds(world, siteId = null) {
  return entitiesOf(world).filter(entity => !siteId || entity.location?.siteId === siteId).map(entity => entity.id);
}
// One map, one camera. The view follows the student's own household and widens when
// somebody travels; the regional and public picture is the Host's projected screen, not a
// second panel here. A student may also pan, zoom, or pick one of their own people to
// watch, and Follow gives the family frame back. What none of that does is change what
// they are allowed to see: the camera moves over a projection the server already decided,
// so looking somewhere is never a way of learning something.
const MIN_EXTENT = 3.4;
// `PERSON_MILES`, the symbolic size of a person in miles of ground (see `figure` in cameraFor), is imported from
// sim/house-footprint.mjs, where the server works out from it the ground a house is drawn over.
// How tall a person may be drawn at the closest zoom, in screen pixels: the camera must be able to get this close.
const CLOSEST_FIGURE = 90;
// Below this many screen pixels per world mile, a neighbour's homestead is smaller than
// the label that would sit on it. Fords and other minor names thin out at the same point.
const HOMESTEAD_LEGIBLE = 11;
/** Pixels a mile from which a landing is named: its name clears the one across the river (Groce's and Bernardo, 1.6 miles). */
const LANDING_LEGIBLE = 45;
/** Named only from LANDING_LEGIBLE: the landings, and the farmsteads of the march east, McCarley's and Roberts' 2.8 miles apart. */
const NAMED_CLOSE = ['landing', 'farmstead'];
/** How a road gets over water (sim/colonies-map.mjs `CROSSING_KINDS`, docs/MAP_ACCURACY.md §10). */
const CROSSING_KINDS = ['ford', 'ferry', 'bridge'];
/** Pixels a mile from which a ford the record does not name (`FIC-GONZ-090`) is named: they lie every few miles on some roads. */
const FORD_LEGIBLE = 150;
/**
 * The water a lane can wade, as it is drawn (`wadesOf`, public/map-base.js): the class's creeks, and the rivers - the land's
 * own at their finest level on the real land, the class's terrain on the invented country. Kept while neither changes.
 */
const wadeWater = { terrain: null, levels: null, list: [] };
function wadeWaterOf(world) {
  const terrain = world.map?.terrain || [], levels = levelsOf(world);
  if (wadeWater.terrain === terrain && wadeWater.levels === levels) return wadeWater.list;
  const rivers = levels ? [...levels.province.rivers, ...(levels.outside?.province.rivers || [])].map(river => ({ points: river.levels[0], kind: 'river', name: river.name })) : [];
  const list = [...terrain.filter(f => f.kind === 'creek' || (f.kind === 'river' && !levels)).map(f => ({ points: f.points, kind: f.kind, name: f.name })), ...rivers]
    .filter(course => course.points?.length > 1);
  Object.assign(wadeWater, { terrain, levels, list });
  return list;
}
/** Each lane's wades, kept by the lane's own points: a lane laid again (sim/homesite.mjs) is a new line. */
const lanesWaded = new WeakMap();
function lanesWades(world, route) {
  const water = wadeWaterOf(world), kept = lanesWaded.get(route.points);
  if (kept?.water === water) return kept.wades;
  const crossings = sitesOf(world).filter(site => CROSSING_KINDS.includes(site.kind) || site.kind === 'crossing').map(site => site.over || site);
  const wades = wadesOf(route.points, water, crossings);
  lanesWaded.set(route.points, { water, wades });
  return wades;
}
// Every drawn object as a multiple of a person, so the whole scene grows together and
// an ox never ends up smaller than the family leading it.
/** A pole, a log tree and a large tree, as shares of a timber tree's drawn height (sim/woods.mjs `SIZES`). */
const TREE_SIZES = [0.55, 0.7, 0.85];
const SIZE = {
  // A house: sim/house-footprint.mjs, where the server works out the ground it is drawn over from this number.
  cabin: CABIN_PEOPLE, settlementCabin: 2.5, camp: 2.1,
  timberTree: 1.95, loneTree: 2.05, sapling: 1.15, scrub: 1.0, stump: 1.0, logPile: 1.2,
  tuft: .6, rock: .5, crop: .95,
  ox: 1.45, horse: 1.5, wagon: 1.55,
  // The Yellow Stone: a hundred and thirty feet of steamboat, drawn taller than the cabins on the bank she lies against.
  steamboat: 4.2,
  // The quarry's own sizes are `QUARRY_SIZE`, which is by species: a turkey is not a deer's height.
};
/**
 * How big a house is drawn on the map, in the same yardstick as the people beside it (TECH.md: "the same yardstick every
 * tree, cabin and ox is drawn in"). One number for a house at its site, a house placed on the land and the translucent
 * house a student is still placing, so the preview is the house they get. The placed house and its preview were drawn
 * in true feet - eight-foot cells, a pen seventeen feet high - beside people drawn a hundred feet tall, so a student saw
 * a house a sixth of a person's height and said the preview was too small (2026-09-23; tests/house-preview.test.mjs).
 * The server checks where a house may stand at this same size (sim/house-footprint.mjs `CELL_MILES`, from `CABIN_PEOPLE`
 * and `PERSON_MILES`): until 2026-09-23 it checked an 80 by 64 foot envelope, so two houses it let stand a hundred feet
 * apart were drawn one over the other, and a house on dry ground beside a creek was drawn over the water.
 *
 * A family's house is `camera.house.size` (`houseScale`): never floored with the people, so never drawn past the ground
 * the server holds for it. A town's cabins are drawn with the people, floored and all: nothing is placed beside them.
 */
const cabinSize = (camera, settlement = false) => settlement ? Math.max(5, camera.figure * SIZE.settlementCabin) : camera.house.size;
/**
 * The smallest height, in pixels, a house is drawn at: the smallest at which the cabin's pen, its roof and its chimney
 * still read as a cabin. Looked at on the house sheets at 8 to 23 pixels (2026-09-23): at 12 and under a finished round-log
 * cabin is a brown blot and a dog-run two; at 14 the chimney stands off the pen; at 16 the roof's ridge reads.
 */
const HOUSE_LEGIBLE = 16;
/**
 * How a family's houses are drawn at `scale` pixels a mile: `{ size, one }`, `size` the height of a house in pixels.
 *
 * Close in, a house is drawn `CABIN_PEOPLE` people of `PERSON_MILES` high, with no floor: exactly the ground the server
 * spaces houses by (sim/house-footprint.mjs `CELL_MILES`), so two houses the server keeps apart are drawn apart. People
 * and everything else keep their seven-pixel floor (`figure`); until 2026-09-23 the house kept it too, and from about 370
 * pixels a mile out every house grew past its ground and two as close as allowed were drawn into each other (owner: "fix
 * the zoom issue"). Held to its ground a house shrinks with the land, so from where it would be drawn under
 * `HOUSE_LEGIBLE` (about 255 pixels a mile) out, a family's houses are drawn as one house (`one`) - its home, the first it
 * finished (sim/interior.mjs), or the one it is raising - `HOUSE_LEGIBLE` high, where that house stands. One house cannot be
 * drawn over another of its own family; two families' are kept apart by `drawWorld` (`familyHouses`). The ceiling the
 * people have (150 pixels) holds for the house too, so it is never larger than its ground at any zoom.
 */
const houseScale = scale => { const size = Math.min(150, scale * PERSON_MILES) * CABIN_PEOPLE; return size < HOUSE_LEGIBLE ? { size: HOUSE_LEGIBLE, one: true } : { size, one: false }; };
// null means the camera follows the family. Dragging or zooming takes manual control
// until the player presses Follow, so the view is never yanked away mid-gesture.
let manualView = null;
/**
 * One of your own people, kept in the middle of the view.
 *
 * The camera otherwise frames the whole household, which is right until the household is
 * not in one place: once travel takes real time, somebody is in the timber and somebody
 * is in town and the frame that holds both is a frame in which neither is legible. So a
 * name in the roster is a place to look. It follows them as they walk, it is cleared by
 * panning, zooming or pressing Follow, and it is never set by the server - what a student
 * looks at is theirs, and nothing in the world moves the camera for them.
 */
let watchedId = null;
const stopWatching = () => { watchedId = null; };
// How each person goes is asked of every journey as it is sent (public/going.js, owner 2026-09-24), not remembered here: the
// card's "Going by" that was pressed once and carried by the next order is gone, so one question has one place.
// Which pieces of news this browser has already put in front of this student. Per viewer
// and deliberately not on the server: it describes a person looking at a screen, not
// anything a household knows. Cleared by opening the book, which is where it is read.
const readReports = new Set(), unreadReports = new Set();
function markReportsRead(reports) {
  for (const report of reports) { readReports.add(report.topicId); unreadReports.delete(report.topicId); }
  const mark = $('#journal-unread');
  if (mark) mark.hidden = true;
}
// Zoom limits come from the map itself rather than fixed numbers, so they stay sensible
// when the world's real extent changes. Zooming out reaches the whole known map; zooming
// in reaches one homestead.
function worldBounds(world) {
  if (world.map?.bounds) return world.map.bounds;
  const sites = sitesOf(world);
  if (!sites.length) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  return {
    minX: Math.min(...sites.map(s => s.x)) - 3, maxX: Math.max(...sites.map(s => s.x)) + 3,
    minY: Math.min(...sites.map(s => s.y)) - 3, maxY: Math.max(...sites.map(s => s.y)) + 3,
  };
}
function scaleLimits(world, canvas) {
  const bounds = worldBounds(world);
  const width = Math.max(MIN_EXTENT, bounds.maxX - bounds.minX);
  const height = Math.max(MIN_EXTENT * .56, bounds.maxY - bounds.minY);
  // Zoomed out reaches the whole mapped country; zoomed in reaches one farm.
  const cover = Math.max(canvas.width / width, canvas.height / height);
  return { min: cover, max: Math.max(cover * 30, canvas.width / 1.6, CLOSEST_FIGURE / PERSON_MILES) };
}
// Keep the visible rectangle inside the mapped country rather than letting a student pan
// off into ground the world does not model.
function clampCentre(cx, cy, scale, world, canvas) {
  const bounds = worldBounds(world);
  const halfWidth = canvas.width / (2 * scale), halfHeight = canvas.height / (2 * scale);
  const spanX = bounds.maxX - bounds.minX, spanY = bounds.maxY - bounds.minY;
  return {
    cx: spanX <= halfWidth * 2 ? (bounds.minX + bounds.maxX) / 2 : Math.min(bounds.maxX - halfWidth, Math.max(bounds.minX + halfWidth, cx)),
    cy: spanY <= halfHeight * 2 ? (bounds.minY + bounds.maxY) / 2 : Math.min(bounds.maxY - halfHeight, Math.max(bounds.minY + halfHeight, cy)),
  };
}
const clampTo = (value, limits) => Math.max(limits.min, Math.min(limits.max, value));
// A battle nobody's camera contains is a battle nobody sees. The server only sends
// `world.battle` to an audience entitled to it - a household standing at Gonzales, or
// the Host once the news is public - so wherever it arrives, it belongs in the frame.
// The fighting stood about seven miles upriver of the ford (HIST-GONZ-008), so framing
// it alongside the viewer's own people is what pulls the camera out far enough to hold
// both. Without this the formations are drawn correctly and off-screen.
const battlePoints = world => (world.battle?.formations || []).map(formation => ({ x: formation.x, y: formation.y }));
function framingFor(world) {
  // The country outside the box (docs/MAP_ACCURACY.md §11) is drawn where it is, but it never frames a view: framing the
  // region on Matamoros, 250 miles south of the colonies, would shrink the settlements to nothing. The map still zooms out
  // to the whole drawn country by hand.
  const sites = sitesOf(world).filter(site => !site.outside), home = world.map?.sites?.[homeOf(world)];
  const fighting = battlePoints(world);
  if (world.role === 'host') {
    const focus = world.host?.focus;
    if (['gonzales', 'reconstruction'].includes(focus)) {
      const town = world.map?.sites?.gonzales;
      const points = [...(town ? [town] : sites), ...fighting];
      return { kind: focus, title: 'Gonzales', points: points.length ? points : sites };
    }
    return { kind: 'region', title: 'The region', points: sites };
  }
  const own = entitiesOf(world).filter(entity => entity.location);
  const points = own.map(entity => entity.location);
  points.push(...fighting);
  if (home) points.push(home);
  // Somebody has reined in to speak with one of this family. He is not one of theirs, so
  // nothing else would put him in the frame - and the whole replacement for the old news
  // bar is that a student sees the arrival rather than reads a headline about it.
  const meeting = world.encounter?.status === 'open'
    && (world.others || []).find(other => other.id === world.encounter.carrierId);
  if (meeting?.location) points.push(meeting.location);
  const travelling = own.filter(entity => entity.travel);
  for (const entity of travelling) {
    const destination = world.map?.sites?.[entity.travel.to];
    if (destination) points.push(destination);
    for (const point of world.map?.routes?.[entity.travel.routeId]?.points || []) points.push(point);
  }
  if (!points.length) return { kind: 'region', title: 'The region', points: sites };
  return travelling.length
    ? { kind: 'journey', title: `${travelling[0].name} is travelling`, points }
    : { kind: 'home', title: familyCache?.name ? `${familyCache.name} land` : 'Your land', points };
}
function autoView(world, canvas) {
  const framing = framingFor(world);
  const points = framing.points.length ? framing.points : [{ x: 0, y: 0 }];
  let minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  // A lone homestead must still show the ground around it rather than zooming forever.
  const padX = Math.max((MIN_EXTENT - (maxX - minX)) / 2, (maxX - minX) * .18, .25);
  const padY = Math.max((MIN_EXTENT * .56 - (maxY - minY)) / 2, (maxY - minY) * .18, .18);
  minX -= padX; maxX += padX; minY -= padY; maxY += padY;
  return {
    ...framing,
    cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
    scale: clampTo(Math.min(canvas.width / (maxX - minX), canvas.height / (maxY - minY)), scaleLimits(world, canvas)),
  };
}
function cameraFor(world, canvas, now = performance.now()) {
  const auto = autoView(world, canvas), limits = scaleLimits(world, canvas);
  // Watching somebody beats both the automatic frame and a remembered pan, and it reads
  // their drawn position rather than their last reported one, so the view walks with them
  // instead of jumping once a tick. At the frame's own moment (`drawWorld`), the moment they are drawn at, so the person
  // watched stands still in the middle rather than a few pixels ahead of it by however long the ground took to draw.
  // Somebody away on the road has no place to be watched at (sim/sight.mjs): the camera gives the family frame back rather
  // than holding on a person who is not on the map. Without the `location` test `raw` below was null and the frame threw,
  // once a student pressed the portrait of somebody the class's clock had carried out of sight (found 2026-09-21 by
  // scripts/travel-sight-proof.mjs).
  const watched = watchedId ? entitiesOf(world).find(entity => entity.id === watchedId && entity.location) : null;
  const at = watched?.location
    ? motionProjection.position(watched, now, reducedMotion.matches || world.status !== 'running')
    : null;
  const following = !manualView && !watched;
  const raw = at
    ? { cx: at.x, cy: at.y, scale: clampTo(Math.max(auto.scale, limits.max * .55), limits) }
    : following ? auto : manualView;
  const scale = clampTo(raw.scale, limits);
  const { cx, cy } = clampCentre(raw.cx, raw.cy, scale, world, canvas);
  return {
    ...auto, cx, cy, scale, following, limits,
    toScreen: p => ({ x: canvas.width / 2 + (p.x - cx) * scale, y: canvas.height / 2 + (p.y - cy) * scale }),
    toWorld: s => ({ x: cx + (s.x - canvas.width / 2) / scale, y: cy + (s.y - canvas.height / 2) / scale }),
    // Detail follows the camera instead of a mode switch, so one view serves both scales.
    // `figure` is how tall a person stands on screen, and every other object is a
    // multiple of it. It is tied to the world - PERSON_MILES of ground per person - so
    // that zooming in genuinely enlarges the farm instead of holding every object at a
    // fixed pin size. The floor keeps people findable at province scale; the ceiling
    // stops one cabin filling the screen at maximum zoom.
    //
    // PERSON_MILES is a symbol size, not a claim about anyone's height. Drawn to scale
    // a person would be a fraction of a pixel across a homestead, and the cabin would be
    // smaller still: this map is legible, not measured. Distance, travel time and
    // adjacency come from the simulation and are never inferred from how big art is.
    figure: Math.max(7, Math.min(150, scale * PERSON_MILES)),
    // A family's house, which is not floored with the people (`houseScale`).
    house: houseScale(scale),
    named: scale > 3.2,
  };
}
// Pointer events cover mouse, touch and stylus with one path, so a Chromebook trackpad
// and a phone get the same panning without a separate touch implementation.
/**
 * The map's size on the page, measured when it changes rather than asked for on every frame: asking forced the page to be laid
 * out again whenever anything on it had changed since the last frame (about 85 ms of a nine-second load on a Chromebook-slow
 * CPU, 2026-09-17, docs/PERFORMANCE_LOAD.md). Null until first measured, and again after a resize.
 */
let canvasBox = null, canvasObserver = null;
function fitCanvas() {
  const canvas = $('#world-map');
  if (!canvasObserver && typeof ResizeObserver === 'function') {
    canvasObserver = new ResizeObserver(() => { canvasBox = null; });
    canvasObserver.observe(canvas);
  }
  if (!canvasBox || !canvasObserver || canvasBox.viewport !== `${innerWidth}x${innerHeight}`) { const measured = canvas.getBoundingClientRect(); canvasBox = { width: measured.width, height: measured.height, viewport: `${innerWidth}x${innerHeight}` }; }
  const rect = canvasBox;
  if (!rect.width || !rect.height) { canvasBox = null; return false; }
  // Sharp on a high-density screen, but never more pixels than a 1080p frame (public/map-base.js `canvasRatio`).
  const ratio = canvasRatio(rect.width, rect.height, window.devicePixelRatio || 1);
  const width = Math.round(Math.min(2200, rect.width * ratio)), height = Math.round(Math.min(2200, rect.height * ratio));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width; canvas.height = height;
  return true;
}
/**
 * One map draw at the next frame, however many inputs ask for it before then (docs/PERFORMANCE_NAVIGATION.md).
 *
 * Every pointer move and wheel event used to draw the whole map there and then, and the twelve-a-second animation drew it
 * again in the same frame. On a slow computer a draw is most of a frame's budget, so a touchpad swipe queued a draw per event
 * and the map fell further behind the hand the longer it moved (measured 2026-09-17, CPU throttled six times). Inputs now
 * only move the camera, which is arithmetic, and ask for this; the draw reads the camera as it is when the frame comes, and
 * counts as the animation's frame too (`lastMapDraw` in animateMap).
 */
let mapDrawWanted = false, lastMapDraw = 0;
function requestMapDraw() {
  if (mapDrawWanted) return;
  mapDrawWanted = true;
  requestAnimationFrame(() => {
    if (!mapDrawWanted) return; // a snapshot or the animation drew it first
    const world = window.__snapshot?.world;
    if (!world) { mapDrawWanted = false; return; }
    if (performance.now() < handOnMapUntil && quickFrame(world)) { mapDrawWanted = false; return; }
    drawWorld(world); positionSelection(world);
  });
}
/**
 * While a hand is on the map, the last whole drawing of it moved and scaled to the camera instead of a new one
 * (`frameTransform` in public/map-camera.js), and the whole map drawn again the moment the hand stops.
 *
 * The hand has stopped when the last pointer lifts, or when a pointer held down has not moved for HELD_STILL_MS; a wheel or
 * touchpad has no lifting, so it has stopped when WHEEL_SETTLE_MS pass without a wheel event. Not a short timer for all of
 * them: on a loaded page the gaps between the moves a browser delivers grow past any short timer, and a whole draw on every
 * gap made each gap longer (measured 2026-09-17: a finger pan fell to five frames a second).
 *
 * ceiling: for the length of a gesture the figures stand still and ground panned in from beyond the old picture is plain
 * grass, until the map is drawn properly when the hand stops, or sooner once the picture would cover under half the view
 * (`QUICK_FRAME`). A draw cheap enough to run every frame on a Chromebook would make this unnecessary; so would drawing the
 * ground to a cached layer, which is the drawing's own work, not the camera's.
 */
const HELD_STILL_MS = 500, WHEEL_SETTLE_MS = 250;
let handOnMapUntil = 0, settleTimer = 0, gesturePicture = null;
function handOnMap(settleMs) {
  const canvas = $('#world-map');
  // The canvas holds a whole drawing whenever there is no picture: a quick frame is only ever shown from a picture, and every
  // whole drawing throws the picture away (drawWorld).
  if (!gesturePicture && drawnCamera && drawnCamera.width === canvas.width && drawnCamera.height === canvas.height) {
    const image = handOnMap.image || (handOnMap.image = document.createElement('canvas'));
    if (image.width !== canvas.width || image.height !== canvas.height) { image.width = canvas.width; image.height = canvas.height; }
    image.getContext('2d').drawImage(canvas, 0, 0);
    gesturePicture = { image, camera: drawnCamera };
  }
  handOnMapUntil = performance.now() + settleMs;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(handOffMap, settleMs);
}
/** The hand has stopped: draw the whole map, now. */
function handOffMap() {
  clearTimeout(settleTimer);
  if (!handOnMapUntil) return;
  handOnMapUntil = 0;
  requestMapDraw();
}
function quickFrame(world) {
  const canvas = $('#world-map');
  if (!gesturePicture || gesturePicture.camera.width !== canvas.width || gesturePicture.camera.height !== canvas.height) return false;
  const camera = cameraFor(world, canvas);
  const move = frameTransform(gesturePicture.camera, camera, { width: canvas.width, height: canvas.height });
  if (!move.usable) return false;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#9fbe73'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(gesturePicture.image, move.x, move.y, canvas.width * move.ratio, canvas.height * move.ratio);
  ctx.restore();
  // Presentation evidence on the contract drawWorld keeps: the camera this frame shows, marked as a moved picture.
  window.__camera = { ...window.__camera, cx: camera.cx, cy: camera.cy, scale: camera.scale, following: camera.following, quick: true };
  return true;
}
function installMapNavigation() {
  const canvas = $('#world-map');
  fitCanvas();
  // Where the canvas sits, read at the start of a gesture rather than on every move: reading layout just after a snapshot
  // has rewritten the panels makes the browser lay the whole page out again, once a move.
  let rect = canvas.getBoundingClientRect(), measuredAt = performance.now();
  const measure = () => { rect = canvas.getBoundingClientRect(); measuredAt = performance.now(); };
  window.addEventListener('resize', () => { measure(); if (fitCanvas() && window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); } });
  const size = () => ({ width: canvas.width, height: canvas.height });
  const localPoint = event => ({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height });
  const cssDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * rect.width / canvas.width;
  const currentView = () => {
    const snapshot = window.__snapshot; if (!snapshot) return null;
    const camera = cameraFor(snapshot.world, canvas);
    return { cx: camera.cx, cy: camera.cy, scale: camera.scale, limits: camera.limits };
  };
  const active = new Map();
  // The press under way: where it began, how far (CSS pixels) its one pointer has wandered, the most pointers it has had
  // down, and whether it has become a drag or a pinch. Until it has, it moves nothing: a tap that jittered a pixel used to
  // pan the map and switch Follow off.
  let press = null, anchor = null;
  const centre = () => {
    const points = [...active.values()];
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  };
  const spread = () => {
    const points = [...active.values()];
    return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  const beginGesture = () => {
    const view = currentView();
    anchor = view && { view, centre: centre(), spread: spread() };
  };
  const tapAt = point => {
    if (housePlacement) { const view = currentView(); if (view) { housePlacement.point = worldAt(view, point, size()); housePlacement.locked = true; requestMapDraw(); } return; }
    if (siteLooking() || surveyLooking()) {
      // Looking over the family's own land for a house site or ten acres to survey: a tap is a place, not a person.
      const view = currentView();
      if (view) (siteLooking() ? lookAtSite : lookAtPlot)(worldAt(view, point, size()));
      return;
    }
    const hit = entityAt(point);
    // Nobody under the tap, but the family's own house is: open the rooms inside (docs/SETTLING_IN.md step 7).
    const house = !hit && houseAt(point);
    if (house) { interiorSiteId = house; clearInteriorChoice(); const panel = $('#interior'); if (panel) delete panel.dataset.shown; if (window.__snapshot) renderInteriorPanel(window.__snapshot.world); }
    selectedId = hit;
    selectionDismissed = !hit;
    if (window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); renderTutorial(window.__snapshot.world); }
  };
  const release = (event, mayTap) => {
    if (!active.has(event.pointerId)) return;
    const tap = mayTap && press && !press.moving && active.size === 1 && isTap(press);
    active.delete(event.pointerId);
    // Where the press began, not where it lifted: that is what the student aimed at.
    if (tap) tapAt(press.at);
    if (active.size) beginGesture(); else { press = null; anchor = null; handOffMap(); }
  };
  canvas.addEventListener('pointerdown', event => {
    // A right or middle button is not a hand on the map.
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try { canvas.setPointerCapture(event.pointerId); } catch { /* the pointer has already gone */ }
    if (!active.size) measure();
    const at = localPoint(event);
    active.set(event.pointerId, at);
    if (active.size === 1) press = { at, pointerType: event.pointerType, travelled: 0, pointers: 1, moving: false };
    else if (press) { press.pointers = Math.max(press.pointers, active.size); press.moving = true; }
    beginGesture();
  });
  canvas.addEventListener('pointermove', event => {
    // Measured here too, as a wheel is: a pointer that has only hovered since the page opened is read against the canvas as
    // it was at start-up, hidden behind the title screen with no size, and put the preview at no number at all - nothing was
    // drawn until the first press on the map (2026-09-23, scripts/house-plot-browser-proof.mjs).
    if (housePlacement && !housePlacement.locked) { if (performance.now() - measuredAt > 500) measure(); const view = currentView(); if (view) housePlacement.point = worldAt(view, localPoint(event), size()); requestMapDraw(); }
    if (!active.has(event.pointerId)) return;
    // A mouse let go somewhere this page never heard about.
    if (event.pointerType === 'mouse' && event.buttons === 0) { release(event, false); return; }
    const at = localPoint(event);
    active.set(event.pointerId, at);
    if (!press || !anchor) return;
    if (active.size === 1) press.travelled = Math.max(press.travelled, cssDistance(at, press.at));
    if (!press.moving && press.travelled > tapSlop(press.pointerType)) press.moving = true;
    if (!press.moving) return;
    // Taking hold of the map is taking the camera back.
    stopWatching();
    manualView = gestureView(anchor, centre(), spread(), size(), anchor.view.limits);
    handOnMap(HELD_STILL_MS); requestMapDraw();
  });
  canvas.addEventListener('pointerup', event => release(event, true));
  // Cancelled (the browser took the touch) or capture lost: the pointer is gone, and it chose nothing.
  canvas.addEventListener('pointercancel', event => release(event, false));
  canvas.addEventListener('lostpointercapture', event => release(event, false));
  canvas.addEventListener('wheel', event => {
    // Always ours, so a touchpad pinch (a ctrlKey wheel) never zooms the whole page instead.
    event.preventDefault();
    const view = currentView(); if (!view) return;
    const factor = wheelZoomFactor(event);
    if (factor === 1) return;
    if (performance.now() - measuredAt > 500) measure();
    // Keep the point under the cursor still, so zooming feels like a map and not a slideshow.
    stopWatching();
    manualView = zoomAbout(view, factor, localPoint(event), size(), view.limits);
    handOnMap(WHEEL_SETTLE_MS); requestMapDraw();
  }, { passive: false });
  // The map focused: arrows pan and + and - zoom, for a student whose pointer is not helping.
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const view = currentView(); if (!view) return;
    const next = keyView(view, event.key, size(), view.limits);
    if (!next) return;
    event.preventDefault();
    stopWatching();
    manualView = next;
    requestMapDraw();
  });
}
function applyMapView(action, { street = false, at = null } = {}) {
  const snapshot = window.__snapshot; if (!snapshot) return;
  const world = snapshot.world, canvas = $('#world-map');
  if (action === 'follow') { manualView = null; stopWatching(); drawWorld(world); return; }
  const view = cameraFor(world, canvas);
  // Zooming or going somewhere leaves off watching, as the wheel and a drag do: watching beats a manual view in
  // `cameraFor`, so while somebody was watched these buttons changed nothing at all (found 2026-09-14).
  stopWatching();
  if (action === 'in' || action === 'out') {
    manualView = { cx: view.cx, cy: view.cy, scale: clampTo(view.scale * (action === 'in' ? 1.4 : 1 / 1.4), view.limits) };
  } else {
    const site = world.map?.sites?.[action === 'home' ? homeOf(world) : action];
    if (!site) return;
    // A town the Host goes to is framed to its street of shops, about six tenths of a mile across (sim/shops.mjs).
    if (street && action !== 'gonzales') { manualView = { cx: (at || site).x, cy: (at || site).y, scale: clampTo(Math.min(canvas.width / .75, canvas.height / .7), view.limits) }; drawWorld(world); return; }
    manualView = { cx: (at || site).x, cy: (at || site).y, scale: clampTo(action==='gonzales'?Math.min(canvas.width/.86,canvas.height/.80):Math.max(view.scale, view.limits.max * .45), view.limits) };
  }
  drawWorld(world);
}
// Shaded relief. The land has a height at every point, so valleys and rises read as
// ground rather than as a flat diagram. Heights are a relative gameplay surface invented
// for the world; they are not survey elevations and are never shown to a student in feet.
const reliefCaches = new Map();
function reliefImage(grid, key) {
  const signature = `${grid.columns}x${grid.rows}:${grid.minX},${grid.minY}:${grid.low},${grid.high}`;
  const cached = reliefCaches.get(key);
  if (cached?.signature === signature) return cached.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = grid.columns; canvas.height = grid.rows;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(grid.columns, grid.rows);
  const span = Math.max(1, grid.high - grid.low);
  const at = (column, row) => grid.values[Math.min(grid.rows - 1, Math.max(0, row)) * grid.columns + Math.min(grid.columns - 1, Math.max(0, column))];
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      const lift = (at(column, row) - grid.low) / span;
      // Lit from the north-west, the usual convention for reading relief on a map.
      const slopeX = (at(column + 1, row) - at(column - 1, row)) / (2 * grid.cellX);
      const slopeY = (at(column, row + 1) - at(column, row - 1)) / (2 * grid.cellY);
      const shade = Math.max(0, Math.min(1, 0.5 + (slopeX * 0.7 + slopeY * 0.7) / 260));
      // Bottomland greener, higher ground drier: a hypsometric tint, not a claim about soil.
      const tone = 0.62 + shade * 0.5;
      const index = (row * grid.columns + column) * 4;
      image.data[index] = Math.round((172 - lift * 26) * tone);
      image.data[index + 1] = Math.round((204 - lift * 30) * tone);
      image.data[index + 2] = Math.round((118 - lift * 22) * tone);
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  reliefCaches.set(key, { signature, canvas });
  return canvas;
}
function paintRelief(ctx, grid, camera, key, hole = null) {
  if (!grid?.values?.length) return false;
  const topLeft = camera.toScreen({ x: grid.minX, y: grid.minY });
  const bottomRight = camera.toScreen({ x: grid.minX + grid.cellX * (grid.columns - 1), y: grid.minY + grid.cellY * (grid.rows - 1) });
  ctx.imageSmoothingEnabled = true;
  const image = reliefImage(grid, key);
  if (!hole) { ctx.drawImage(image, topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y); return true; }
  // Only the parts of the view outside the hole, where nothing opaque is drawn over it: the outside's relief is under the box's.
  // The picture is opaque, so the parts overlap by a pixel and leave no hairline between them.
  const x0 = grid.minX, x1 = grid.minX + grid.cellX * (grid.columns - 1), y0 = grid.minY, y1 = grid.minY + grid.cellY * (grid.rows - 1);
  const a = camera.toWorld({ x: 0, y: 0 }), b = camera.toWorld({ x: ctx.canvas.width, y: ctx.canvas.height });
  const view = { minX: Math.max(x0, a.x), minY: Math.max(y0, a.y), maxX: Math.min(x1, b.x), maxY: Math.min(y1, b.y) };
  if (view.maxX <= view.minX || view.maxY <= view.minY) return true;
  const px = x => (x - x0) / (x1 - x0) * image.width, py = y => (y - y0) / (y1 - y0) * image.height;
  for (const rect of aroundHole(view, hole)) {
    const sx0 = Math.max(0, px(rect.minX) - 1), sx1 = Math.min(image.width, px(rect.maxX) + 1), sy0 = Math.max(0, py(rect.minY) - 1), sy1 = Math.min(image.height, py(rect.maxY) + 1);
    const p = { x: topLeft.x + sx0 / image.width * (bottomRight.x - topLeft.x), y: topLeft.y + sy0 / image.height * (bottomRight.y - topLeft.y) };
    const q = { x: topLeft.x + sx1 / image.width * (bottomRight.x - topLeft.x), y: topLeft.y + sy1 / image.height * (bottomRight.y - topLeft.y) };
    ctx.drawImage(image, sx0, sy0, sx1 - sx0, sy1 - sy0, p.x, p.y, q.x - p.x, q.y - p.y);
  }
  return true;
}
// The province underneath, the home country painted over it. One world, one camera; only
// the density of what is drawn changes with distance.
const PROVINCE_COVER = {
  forest: '#7f9166', savannah: '#a9b681', prairie: '#c0c68f', marsh: '#9fb195',
  brush: '#b4ac81', plateau: '#c2b891',
};
/** The box the colonies' own rivers and creeks cover, in miles, grown by a mile; null for a map without them. */
const waterCovers = new WeakMap();
function waterCover(map) {
  if (!map?.terrain) return null;
  if (waterCovers.has(map)) return waterCovers.get(map);
  const courses = map.terrain.filter(feature => feature.kind === 'river' || feature.kind === 'creek');
  let cover = null;
  if (courses.length) {
    cover = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const course of courses) { const box = courseBox(course); cover.minX = Math.min(cover.minX, box.minX - 1); cover.minY = Math.min(cover.minY, box.minY - 1); cover.maxX = Math.max(cover.maxX, box.maxX + 1); cover.maxY = Math.max(cover.maxY, box.maxY + 1); }
  }
  waterCovers.set(map, cover);
  return cover;
}
/**
 * The real land's detail levels (docs/MAP_ACCURACY.md §6, public/land-levels.js): every river, the sea and the escarpment at
 * four nested bands, and the land's classes and hillshade on grids of 8, 2 and half a mile. The land is the same for every
 * class on the real land, so they are fetched once for the page, and the ground is redrawn when they land.
 */
let landLevels = { key: null, province: null, land: null, outside: null, pending: false, failed: false };
/**
 * The country outside the colonies' box (docs/MAP_ACCURACY.md §8, public/land-levels.js): its lines, its land grids cut into
 * pieces the page can smooth, its woods, and the box's own grids without the edge cells it draws instead. Null for a map
 * without it, or when it did not come: then the box is drawn alone, as it was.
 */
function outsideLevels(province, land, boxGrids) {
  if (!province?.rivers || !land?.bands) return null;
  const box = province.box;
  // Each grid's middle is empty, where the box draws its own (`emptyMiddle`): it is laid down around it.
  const grids = decodeLand(land).map(grid => ({ ...grid, hole: emptyMiddle(grid, box) }));
  const relief = province.relief;
  return {
    province: decodeOutside(province),
    reliefHole: relief && { minX: box.minX + relief.cellX, maxX: box.maxX - relief.cellX, minY: box.minY + relief.cellY, maxY: box.maxY - relief.cellY },
    grids,
    tiles: grids.map(grid => tileGrid(grid)),
    box: province.box,
    boxGrids: (boxGrids || []).map(grid => withoutClaims(grid, grids.find(other => other.cellMiles === grid.cellMiles))),
  };
}
function ensureLandLevels(map) {
  const levels = map?.province?.levels;
  if (!levels?.href || !levels.land) return;
  const key = `${levels.href}|${levels.land}|${levels.outside || ''}|${levels.outsideLand || ''}`;
  if (landLevels.key === key) return;
  const mine = landLevels = { key, province: null, land: null, outside: null, pending: true, failed: false };
  const load = href => fetch(href).then(response => response.ok ? response.json() : null);
  // The country outside the box is a picture round the box and nothing else: if it does not come, the box is drawn alone.
  const maybe = href => href ? load(href).catch(() => null) : Promise.resolve(null);
  Promise.all([load(levels.href), load(levels.land), maybe(levels.outside), maybe(levels.outsideLand)]).then(([province, land, outside, outsideLand]) => {
    if (landLevels !== mine) return;
    mine.pending = false;
    mine.province = province?.rivers ? decodeProvince(province) : null;
    mine.land = land?.bands ? decodeLand(land) : null;
    mine.outside = outsideLevels(outside, outsideLand, mine.land);
    // Presentation evidence for proofs: what of the country outside the box the page holds.
    window.__outsideLoaded = mine.outside ? { rivers: mine.outside.province.rivers.map(river => river.name), pieces: mine.outside.tiles.map(list => list.length), bounds: mine.outside.province.bounds, box: mine.outside.box } : null;
    redrawForArrival();
  }).catch(() => { if (landLevels === mine) { mine.pending = false; mine.failed = true; } });
}
/** The levels this world is drawn from, once they have arrived; null for the invented country or while they load. */
const levelsOf = world => world.map?.province?.levels && landLevels.province ? landLevels : null;
function drawProvince(ctx, world, camera) {
  const province = world.map?.province;
  if (!province) return false;
  // The country outside the box first, on the same lattice and tint, and the box's own over it.
  const outside = levelsOf(world)?.outside;
  if (outside?.province.relief) paintRelief(ctx, outside.province.relief, camera, 'outside', outside.reliefHole);
  const painted = paintRelief(ctx, province.relief, camera, 'province');
  // On the real land the land's own classes are the cover (`drawLand`): the cover belts are a band-3 sketch of the same.
  if (levelsOf(world)?.land) return painted;
  ctx.globalAlpha = .5;
  for (const belt of province.belts) {
    const points = belt.points.map(camera.toScreen);
    ctx.fillStyle = PROVINCE_COVER[belt.cover] || '#b0bb8c';
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return painted;
}
/**
 * The province's lines over its ground: the Gulf, the escarpment, the old roads, the sketched rivers and, pulled right back,
 * the settlements' names. Drawn after the land's own layers (`drawRelief`), under the colony's relief where that is drawn.
 */
/** The width floor for a river of the real land, in pixels: a little wider for a wider channel. */
const riverFloor = miles => 1.5 + Math.min(2, miles * 20);
/** A line's box in miles, worked out once a line. */
const lineBoxes = new WeakMap();
function lineBox(points) {
  let box = lineBoxes.get(points);
  if (!box) { box = courseBox({ points }); lineBoxes.set(points, box); }
  return box;
}
/** The real land's rivers at the band this zoom draws, in miles: `{ points, miles, floor }`. */
function levelRivers(levels, camera) {
  const band = lineBand(levels.province.bands, camera.scale);
  // The rivers outside the box carry on the box's (the Colorado, the Guadalupe, the Medina, the Neches) and add the Rio Grande,
  // the Nueces, the Frio and the Sabine, drawn exactly as the box's are.
  const rivers = levels.outside ? [...levels.province.rivers, ...levels.outside.province.rivers] : levels.province.rivers;
  return rivers.map(river => ({ points: river.levels[band], miles: river.miles, floor: riverFloor(river.miles) })).filter(river => river.points?.length > 1);
}
/**
 * The real land's lines from its levels: the sea, the escarpment and every river, each at the band this zoom draws. A band
 * only drops points less than a pixel off the line, so zooming never moves or reshapes one (docs/MAP_ACCURACY.md §6).
 */
function drawLevelLines(ctx, levels, camera) {
  const band = lineBand(levels.province.bands, camera.scale);
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: ctx.canvas.width, y: ctx.canvas.height });
  const inView = (points, pad) => { const box = lineBox(points); return !(box.maxX < topLeft.x - pad || box.minX > bottomRight.x + pad || box.maxY < topLeft.y - pad || box.minY > bottomRight.y + pad); };
  // The sea outside the box is filled on its own, under the box's: it runs a little under the box's edge so no hairline of
  // land shows between them, and filled in one even-odd path with the box's the overlap would cancel out.
  const seas = [...(levels.outside ? [levels.outside.province.sea[band] || []] : []), levels.province.sea[band] || []];
  for (const sea of seas) {
    const rings = sea.filter(ring => ring.length > 2 && inView(ring, 0));
    if (!rings.length) continue;
    ctx.beginPath();
    for (const ring of rings) { ring.forEach((p, i) => { const q = camera.toScreen(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); }
    ctx.fillStyle = '#8fb0bd'; ctx.fill('evenodd');
  }
  const escarpments = [levels.province.escarpment[band], ...(levels.outside?.province.escarpment[band] || [])];
  for (const escarpment of escarpments) {
    if (!(escarpment?.length > 1) || !inView(escarpment, 1)) continue;
    ctx.save();
    ctx.strokeStyle = '#9a9070'; ctx.lineWidth = Math.min(4, Math.max(1, camera.scale * .6)); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([9, 7]);
    ctx.beginPath(); escarpment.forEach((p, i) => { const q = camera.toScreen(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke();
    ctx.restore();
  }
  for (const river of levelRivers(levels, camera)) {
    const width = waterWidth(river.miles, camera.scale, river.floor);
    if (!inView(river.points, (width + 60) / camera.scale)) continue;
    drawWater(ctx, river.points.map(camera.toScreen), width);
  }
}
function drawProvinceLines(ctx, world, camera) {
  const province = world.map?.province;
  if (!province) return;
  // The Gulf: everything seaward of the shore line.
  const shore = province.coast.map(camera.toScreen);
  ctx.fillStyle = '#8fb0bd';
  ctx.beginPath(); shore.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.lineTo(shore.at(-1).x, ctx.canvas.height + 40); ctx.lineTo(shore[0].x + 4000, ctx.canvas.height + 40); ctx.closePath(); ctx.fill();
  const stroke = (points, colour, width, dash = []) => {
    const screen = points.map(camera.toScreen);
    ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
    ctx.beginPath(); screen.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
  };
  // Line widths held to a few pixels: `scale × .6` was a band two thousand pixels wide at the closest zoom.
  stroke(province.escarpment, '#9a9070', Math.min(4, Math.max(1, camera.scale * .6)), [9, 7]);
  for (const road of province.roads) stroke(road.points, '#b9a97f', Math.min(3, Math.max(1, camera.scale * .5)), [8, 6]);
  // The province's rivers are a sketch of a few points each, for the country beyond the colonies' own water. Drawn as water,
  // at the same widths as the colonies' rivers (`waterWidth`, their sketch width as the floor), and not over the ground the
  // colonies' water covers: they were straight bands `width × scale / 2` wide, a mile and more across close in, drawn
  // under the real rivers in other places, so a river changed shape and place as the student zoomed (2026-09-17).
  // ceiling: a sketched river stops at the edge of the colonies' water; carrying each on as the real course is the way out.
  const covered = waterCover(world.map);
  ctx.save();
  if (covered) {
    const a = camera.toScreen({ x: covered.minX, y: covered.minY }), b = camera.toScreen({ x: covered.maxX, y: covered.maxY });
    ctx.beginPath(); ctx.rect(-10, -10, ctx.canvas.width + 20, ctx.canvas.height + 20); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.clip('evenodd');
  }
  for (const river of province.rivers) drawWater(ctx, river.points.map(camera.toScreen), waterWidth(WATER.river.miles, camera.scale, river.width));
  ctx.restore();
  // Settlements are named only when the camera is wide enough for them to mean anything.
  if (camera.scale < 3.2) {
    for (const place of province.settlements) {
      const q = camera.toScreen(place);
      const size = place.weight === 'major' ? 5 : 3.5;
      ctx.fillStyle = '#6b4a33'; ctx.beginPath(); ctx.arc(q.x, q.y, size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3d4a37'; ctx.font = `${place.weight === 'major' ? 13 : 11}px system-ui`; ctx.textAlign = 'center';
      ctx.fillText(place.name, q.x, q.y - size - 4);
    }
  }
}
// The colony's own shaded relief is a small rectangle laid over the province's. Its edges
// are square, so once the camera pulls back it stops reading as ground and starts reading
// as a block of the wrong colour floating in open prairie. Fade it with distance: by the
// time the whole country is on screen, the province's continuous relief is all that is
// left, and there is no seam to see.
export const HOME_RELIEF_GONE = 7, HOME_RELIEF_FULL = 18;
export const homeReliefOpacity = scale =>
  Math.max(0, Math.min(1, (scale - HOME_RELIEF_GONE) / (HOME_RELIEF_FULL - HOME_RELIEF_GONE)));
/**
 * The land under everything else, in its order: the province's relief and cover belts; the colony's own relief; the classes
 * of ground (`drawLand`); then the province's lines. Every one is drawn from a picture or a shape fixed to the map, so none
 * moves or reshapes as the camera zooms, and all of it is the kept ground (`mapBase`), costing nothing on a frame that only
 * moves people.
 */
function drawRelief(ctx, world, camera) {
  drawProvince(ctx, world, camera);
  const opacity = homeReliefOpacity(camera.scale);
  let painted = false;
  if (opacity > 0) {
    ctx.save();
    ctx.globalAlpha *= opacity;
    painted = paintRelief(ctx, world.map?.relief, camera, 'home');
    ctx.restore();
  }
  // The land's classes and its hillshade - hills, bluffs, the Balcones escarpment - over the relief's tint (`drawLand`).
  drawLand(ctx, world, camera);
  // On the real land its own lines go over everything, at the band the zoom draws. The invented province's sketch lines
  // were painted under the colony's relief and showed through it only as it faded: kept so for that country.
  const landHere = levelsOf(world);
  if (landHere) { drawLevelLines(ctx, landHere, camera); return painted; }
  const home = painted && world.map?.relief;
  if (!home || opacity <= 0) { drawProvinceLines(ctx, world, camera); return painted; }
  const a = camera.toScreen({ x: home.minX, y: home.minY });
  const b = camera.toScreen({ x: home.minX + home.cellX * (home.columns - 1), y: home.minY + home.cellY * (home.rows - 1) });
  ctx.save();
  ctx.beginPath(); ctx.rect(-10, -10, ctx.canvas.width + 20, ctx.canvas.height + 20); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.clip('evenodd');
  drawProvinceLines(ctx, world, camera);
  ctx.restore();
  if (opacity < 1) {
    ctx.save();
    ctx.beginPath(); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.clip();
    ctx.globalAlpha *= 1 - opacity;
    drawProvinceLines(ctx, world, camera);
    ctx.restore();
  }
  return painted;
}
/**
 * The classes of ground the land says stand where - prairie, savanna, bottomland, pine, live oak, brush, hill country, marsh,
 * sand - each as its table entry's wash (public/ground-classes.js), and the land's hillshade over them: pictures of the land's
 * grids of 8, 2 and half a mile, smoothed, made once a grid, and handed over from one grid to the next across a band of zoom
 * (`landWeights`) so the land never changes at one wheel step. Only the part in view is laid down.
 */
const landPictures = new WeakMap();
/** A grid's pictures are being made (`landPicture`): the ground is laid down without them until they come. */
const LAND_MAKING = Symbol('making');
/** Each class's wash colour, in the grid's class order: `[r, g, b, alpha]` or null (public/ground-classes.js). */
const landPalette = grid => grid.classes.map(id => { if (!id || id === 'none') return null; const kind = groundClass(id); return kind.alpha > 0 ? [...kind.colour, kind.alpha] : null; });
/**
 * A grid's pictures, or null while they are being made. Made off the main thread (public/land-worker.js) when the browser has
 * workers: on a Chromebook-slow CPU making them here was one two-second task with the page frozen just after the map first
 * appeared (docs/PERFORMANCE_LOAD.md). They are handed over as bitmaps and the ground is drawn again when they land.
 */
function landPicture(grid) {
  const known = landPictures.get(grid);
  if (known) return known === LAND_MAKING ? null : known;
  const upscale = landUpscale(grid), palette = landPalette(grid);
  const toCanvas = picture => {
    if (!picture) return null;
    const canvas = document.createElement('canvas');
    canvas.width = picture.width; canvas.height = picture.height;
    canvas.getContext('2d').putImageData(new ImageData(picture.data, picture.width, picture.height), 0, 0);
    return canvas;
  };
  if (!canSmoothOffThread()) {
    const data = landPictureData(grid, palette, upscale);
    const pictures = { upscale, wash: toCanvas(data.wash), shade: toCanvas(data.shade) };
    landPictures.set(grid, pictures);
    return pictures;
  }
  landPictures.set(grid, LAND_MAKING);
  smoothOffThread({ kind: 'land', grid: { columns: grid.columns, rows: grid.rows, cells: grid.cells, shade: grid.shade }, palette, upscale })
    .then(async ({ pictures: data }) => {
      const [wash, shade] = await Promise.all([toBitmap(data.wash), toBitmap(data.shade)]);
      landPictures.set(grid, { upscale, wash, shade });
      redrawForArrival();
    });
  return null;
}
function layLandPicture(ctx, camera, grid, canvas, upscale, alpha) {
  const perMile = upscale / grid.cellMiles;
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: ctx.canvas.width, y: ctx.canvas.height });
  // A piece of a larger grid (public/land-levels.js `tileGrid`) lays down only its core; the margin round it is its neighbours'.
  // A grid with an empty middle (the outside's, round the box) lays down only what is around it (`aroundHole`): the parts meet
  // on whole cells, and never overlap, so a half-clear picture is never laid twice anywhere.
  const clamp = (value, least, most) => Math.max(least, Math.min(most, value));
  const core = grid.core;
  const cx0 = core ? clamp(Math.round((core.minX - grid.minX) * perMile), 0, canvas.width) : 0, cx1 = core ? clamp(Math.round((core.maxX - grid.minX) * perMile), 0, canvas.width) : canvas.width;
  const cy0 = core ? clamp(Math.round((core.minY - grid.minY) * perMile), 0, canvas.height) : 0, cy1 = core ? clamp(Math.round((core.maxY - grid.minY) * perMile), 0, canvas.height) : canvas.height;
  const view = { minX: Math.floor((topLeft.x - grid.minX) * perMile) - 2, maxX: Math.ceil((bottomRight.x - grid.minX) * perMile) + 2, minY: Math.floor((topLeft.y - grid.minY) * perMile) - 2, maxY: Math.ceil((bottomRight.y - grid.minY) * perMile) + 2 };
  const hole = grid.hole && { minX: Math.round((grid.hole.minX - grid.minX) * perMile), maxX: Math.round((grid.hole.maxX - grid.minX) * perMile), minY: Math.round((grid.hole.minY - grid.minY) * perMile), maxY: Math.round((grid.hole.maxY - grid.minY) * perMile) };
  const was = ctx.globalAlpha, smoothing = ctx.imageSmoothingEnabled;
  ctx.globalAlpha = was * alpha; ctx.imageSmoothingEnabled = true;
  let laid = 0;
  for (const part of aroundHole(view, hole)) {
    const sx0 = clamp(part.minX, cx0, cx1), sx1 = clamp(part.maxX, cx0, cx1), sy0 = clamp(part.minY, cy0, cy1), sy1 = clamp(part.maxY, cy0, cy1);
    if (sx1 <= sx0 || sy1 <= sy0) continue;
    const a = camera.toScreen({ x: grid.minX + sx0 / perMile, y: grid.minY + sy0 / perMile }), b = camera.toScreen({ x: grid.minX + sx1 / perMile, y: grid.minY + sy1 / perMile });
    ctx.drawImage(canvas, sx0, sy0, sx1 - sx0, sy1 - sy0, a.x, a.y, b.x - a.x, b.y - a.y);
    laid++;
  }
  ctx.globalAlpha = was; ctx.imageSmoothingEnabled = smoothing;
  return laid;
}
function drawLand(ctx, world, camera) {
  const levels = levelsOf(world), outside = levels?.outside;
  // With the country outside the box, the box's grids lose their edge cells to it (`withoutClaims`): each cell is drawn once.
  const grids = outside ? outside.boxGrids : levels?.land;
  if (!grids?.length) return;
  const weights = landWeights(camera.scale, grids.map(grid => grid.cellMiles));
  window.__landDrawn = Object.fromEntries(grids.map((grid, i) => [grid.cellMiles, Math.round(weights[i] * 100) / 100]));
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: ctx.canvas.width, y: ctx.canvas.height });
  const seen = core => !(core.maxX < topLeft.x || core.minX > bottomRight.x || core.maxY < topLeft.y || core.minY > bottomRight.y);
  // Only the pieces of the outside in view are smoothed and laid down, at the weight of the box's grid of the same cell.
  const pieces = cell => (outside?.tiles[outside.grids.findIndex(grid => grid.cellMiles === cell)] || []).filter(tile => seen(tile.core));
  let outsidePieces = 0;
  for (const layer of ['wash', 'shade']) {
    grids.forEach((grid, i) => {
      if (weights[i] <= 0.01) return;
      for (const tile of pieces(grid.cellMiles)) {
        const pictures = landPicture(tile);
        if (pictures?.[layer]) outsidePieces += layLandPicture(ctx, camera, tile, pictures[layer], pictures.upscale, weights[i]);
      }
      const pictures = landPicture(grid);
      if (pictures?.[layer]) layLandPicture(ctx, camera, grid, pictures[layer], pictures.upscale, weights[i]);
    });
  }
  window.__outsidePiecesDrawn = outsidePieces;
}
// Terrain is map data, not decoration invented by the renderer. An empty terrain list
// draws nothing; it must never imply ground that the world does not actually model.
const TERRAIN_STYLE = {
  river: { stroke: '#8fb0bd', width: 3.2 }, creek: { stroke: '#9dbcc4', width: 1.4 },
  road: { stroke: '#c3b189', width: 1.8 }, woods: { fill: '#9fb083' }, field: { fill: '#cbcf94' },
  prairie: { fill: '#d9dcb2' }, town: { fill: '#d3c7a6' },
};
// Deterministic scatter inside a polygon, so timber and stubble stay put between frames.
function scatterInside(points, seed, count) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if ((points[i].y > y) !== (points[j].y > y) &&
        x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x) hit = !hit;
    }
    return hit;
  };
  const out = [];
  let value = seed >>> 0;
  const next = () => { value = (Math.imul(value ^ (value >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return value / 4294967296; };
  for (let attempt = 0; attempt < count * 9 && out.length < count; attempt++) {
    const x = minX + next() * (maxX - minX), y = minY + next() * (maxY - minY);
    if (inside(x, y)) out.push({ x, y, tint: out.length });
  }
  return out;
}
const seedOf = id => { let n = 0; for (const c of String(id)) n = (Math.imul(n, 31) + c.charCodeAt(0)) | 0; return n; };
/** sim/fields.mjs `groundAt` on the invented map: timber stands this far from its water. Keep the two in step. */
const INVENTED_TIMBER_MILES = 1.15;
/** Whether a point lies inside a polygon (ray casting). */
function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
/**
 * The scattered ground (`drawGroundDetail`): about this many of the finest drawn cells across the view, a thing in this
 * share of cells, and fading in between these scales. Tuned so a view draws about as many things as the old scatter did.
 */
const SCATTER_ACROSS = 48, SCATTER_CHANCE = .105;
const groundDetailOpacity = scale => ramp(scale, 28, 40);
function drawGroundDetail(ctx, world, camera) {
  // Fades in as the camera comes down to a few miles across, rather than appearing whole at one scale.
  const detail = groundDetailOpacity(camera.scale);
  if (detail <= 0) { window.__galeDrawn = null; return; }
  const galeWas = galeDrawn;
  const canvas = ctx.canvas;
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: canvas.width, y: canvas.height });
  const viewMiles = Math.max(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  // A tuft or a tree every few rods close up, and sparser as the view widens, so a frame never has more cells to roll than
  // it can afford - as levels of a doubling grid (public/map-base.js `scatterLevels`): whatever is on screen stays where it
  // is while the camera comes in, and the next level down fades in between. It was one grid re-rolled at every doubling,
  // thinned by a density that changed with every wheel step, and the prairie reshuffled as a student zoomed (2026-09-17).
  const levels = scatterLevels(viewMiles, { finest: 0.01, across: SCATTER_ACROSS });
  const figure = camera.figure;
  const scattered = [];
  // A norther is a wind before it is a temperature, and this is where it shows: the grass and the trees lean with it.
  // Read at each thing's own place, so the lean thins out across a region boundary instead of stopping at a line. Only
  // when there is a wind to read, so a fair day pays nothing for it (public/weather-art.js `windLean`).
  // ceiling: the lean is fixed while the ground is kept, so the trees hold a steady bend rather than working in the gusts;
  // it turns when the day does. Trees swayed on each frame over the kept ground is the way out, and is the same ceiling
  // the kept ground already carries for the oaks' own wind.
  const wind = world.weather && weatherShown(world.weather) ? world.weather : null;
  // Fade-free (`STEADY`): this is drawn into the kept ground, which is redrawn only when the day turns, so a lean that
  // came up over an hour and a half would be frozen at whatever it was in the one frame that drew it.
  //
  // One mix a thing, and both answers read off it: how far it leans, and whether the wind here is the hard norther
  // Astra painted poses for (public/weather-art.js `inGale`). A second `weatherMix` for the second answer would have
  // doubled the cost of the whole scatter.
  const windAt = wind ? x => weatherMix(wind, x, world.minute, STEADY) : null;
  // Nothing wild stands in ground the family has cleared (sim/fields.mjs): no oak in the corn, no scrub in the rows.
  // Only plots near the view are checked, so the Host's thirty families cost no more per tree than one family's land does.
  const near = PLOT_SIDE * 2;
  const cleared = knownLands(world).flatMap(land => land.plots || []).filter(plot => plot.state === 'cleared'
    && (!hostView(world) || (plot.x > topLeft.x - near && plot.x < bottomRight.x + near && plot.y > topLeft.y - near && plot.y < bottomRight.y + near)));
  const inCleared = (x, y) => cleared.some(plot => Math.abs(x - plot.x) < PLOT_SIDE / 2 && Math.abs(y - plot.y) < PLOT_SIDE / 2);
  const bexarSite=world.map?.sites?.bexar;
  const gonzalesSite=world.map?.sites?.gonzales;
  // Timber stands where the map says the woods are (sim/geography.mjs, sim/colonies-region.mjs), and close up it is the trees
  // that say so: the woods tint is gone at this zoom, and a hunter sent into the timber was drawn out on open grass (found in
  // play 2026-09-14). ceiling: the real land's timber along the smaller creeks (sim/ground.mjs `coverAt`) has no polygon
  // and is drawn as prairie; drawing cover from the land itself is the way out.
  const woods = (world.map?.terrain || []).filter(feature => feature.kind === 'woods').map(feature => {
    const xs = feature.points.map(p => p.x), ys = feature.points.map(p => p.y);
    return { points: feature.points, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  });
  // On the invented map the simulation's own rule (sim/fields.mjs `groundAt`): within 1.15 miles of a river or creek, so the
  // hunter who goes into the timber is drawn among trees. The real land draws its woods polygons.
  const water = world.map?.source ? [] : (world.map?.terrain || []).filter(feature => feature.kind === 'river' || feature.kind === 'creek');
  // A class whose woods come from the land (public/woods-view.js): timber is its patches, and close up every tree is drawn
  // where it stands instead of scattered ones, so no lone oak stands in open prairie the simulation has none in. Between the
  // two the real trees fade in over their band as the scattered timber oaks fade out, so a hunter in the timber stands among
  // trees at every zoom (`woodsLayers`).
  const landWoods = woodsShown(world) && woodsCatalogue;
  const treesShown = landWoods ? woodsLayersFor(camera, canvas).trees : 0;
  // Nothing stands in the river. The vegetation layers - the scatter here, and the real trees the
  // land itself puts on the bank - know nothing about water, so cottonwoods were drawn standing in
  // the middle of the channel. A tree within the water as it is actually drawn is dropped, at the
  // same width `drawTerrain` paints (`waterWidth`), so the rule matches the picture at every zoom.
  // ceiling: the channel only. Timber crowding right up to the bank is correct and stays.
  // A thing just outside the view can still reach into it: the finest cell, or three figures, whichever is further.
  // Zoomed far enough out no level of the scatter is drawn at all (`scatterLevels` gives none), and nothing reaches in.
  const reach = Math.max(levels[0]?.cell ?? 0, figure * 3 / camera.scale), margin = figure * 3;
  const viewBox = { minX: topLeft.x, minY: topLeft.y, maxX: bottomRight.x, maxY: bottomRight.y };
  const landHere = levelsOf(world);
  const courses = [
    ...(world.map?.terrain || []).filter(feature => (feature.kind === 'creek' || (feature.kind === 'river' && !landHere)) && feature.points?.length > 1)
      .map(feature => ({ points: feature.points, ...WATER[feature.kind] })),
    ...(landHere ? levelRivers(landHere, camera) : []),
  ];
  const channels = courses
    .map(course => {
      const box = lineBox(course.points);
      const half = waterWidth(course.miles, camera.scale, course.floor) / 2 / camera.scale;
      return { points: course.points, half, minX: box.minX - half, maxX: box.maxX + half, minY: box.minY - half, maxY: box.maxY + half };
    })
    .filter(course => course.maxX >= topLeft.x - reach && course.minX <= bottomRight.x + reach && course.maxY >= topLeft.y - reach && course.minY <= bottomRight.y + reach)
    // Only the stretch of each course near the view is measured (public/map-base.js `segmentsNear`): a scattered cell can lie
    // a cell beyond the view's edge, so the view is grown by a cell. A river across the colonies is thousands of points.
    .map(course => ({ ...course, near: segmentsNear(course.points, viewBox, course.half + reach) }))
    .filter(course => course.near.length);
  const inWater = (x, y) => channels.some(course =>
    x >= course.minX && x <= course.maxX && y >= course.minY && y <= course.maxY && distanceToSegments({ x, y }, course.points, course.near) < course.half);
  const timberWater = water.map(course => ({ points: course.points, near: segmentsNear(course.points, viewBox, INVENTED_TIMBER_MILES + reach) }));
  const inWoods = landWoods
    ? (x, y) => timberAt(x, y, woodsCatalogue.tiles.patches) === true
    : water.length
    ? (x, y) => timberWater.some(course => distanceToSegments({ x, y }, course.points, course.near) < INVENTED_TIMBER_MILES)
    : (x, y) => woods.some(w => x >= w.minX && x <= w.maxX && y >= w.minY && y <= w.maxY && insidePolygon(x, y, w.points));
  const hasWoods = landWoods || water.length > 0 || woods.length > 0;
  const landGrid = (landHere?.outside ? landHere.outside.boxGrids[0] : landHere?.land?.[0]) || null;
  const outsideGrid = landHere?.outside?.grids[0] || null;
  for (const { level, cell, alpha } of levels) {
    const startX = Math.floor(topLeft.x / cell), endX = Math.floor(bottomRight.x / cell);
    const startY = Math.floor(topLeft.y / cell), endY = Math.floor(bottomRight.y / cell);
    for (let cy = startY; cy <= endY; cy++) {
      for (let cx = startX; cx <= endX; cx++) {
        const item = scatterItem(level, cx, cy);
        if (item.roll > SCATTER_CHANCE) continue;
        const wx = (cx + item.jx) * cell, wy = (cy + item.jy) * cell;
        const sx = (wx - topLeft.x) * camera.scale, sy = (wy - topLeft.y) * camera.scale;
        if (sx < -margin || sy < -margin || sx > canvas.width + margin || sy > canvas.height + margin * 2) continue;
        if (cleared.length && inCleared(wx, wy)) continue;
        if (channels.length && inWater(wx, wy)) continue;
        if(bexarSite&&camera.scale>=200){const x=(wx-bexarSite.x)*5280+1200,y=(wy-bexarSite.y)*5280+2050;if(x>=0&&x<=4000&&y>=0&&y<=3400)continue;}
        if(gonzalesSite&&camera.scale>=200){const x=wx-gonzalesSite.x,y=wy-gonzalesSite.y,b=GONZALES_ART_BOUNDS;if(x>b.left&&x<b.right&&y>b.top&&y<b.bottom)continue;}
        const point = camera.toScreen({ x: wx, y: wy });
        // Kind is fixed by the cell: panning or zooming cannot turn a tuft into a tree.
        // The mark is the class of ground's (public/ground-classes.js). Timber on a map with the land's woods is the woods'
        // patches alone, so no oak stands where the simulation has none; elsewhere a timber class counts too.
        // The box's class; where it falls back to the default (the box's edge, and the country outside it) the outside layer's,
        // which is none - the default again - wherever the box has its own.
        const own = groundClassAt(landGrid, wx, wy);
        const ground = outsideGrid && own === DEFAULT_GROUND ? groundClassAt(outsideGrid, wx, wy) : own;
        const timber = (hasWoods && inWoods(wx, wy)) || (!landWoods && groundClass(ground).timber === true);
        const mix = windAt ? windAt(wx) : null;
        scattered.push({ share: item.share, seed: cx + cy, alpha: alpha * detail, timber, ground, point, lean: mix ? windLean(mix) : 0, gale: mix ? inGale(mix) : false });
      }
    }
  }
  if (treesShown > 0) {
    for (const tree of treesVisible(camera, canvas, woodsCatalogue)) {
      if (cleared.length && inCleared(tree.x, tree.y)) continue;
      if (channels.length && inWater(tree.x, tree.y)) continue;
      // The kind's picture, optional per-size pictures, and physical height come from the woods catalogue (sim/woods.mjs `KINDS`).
      const point = camera.toScreen(tree), height = figure * SIZE.timberTree * TREE_SIZES[tree.size] * (tree.kind.scale || 1);
      const sizeName = ['pole', 'log', 'large'][tree.size];
      const sizedTree = `${tree.kind.picture}-${sizeName}`;
      const deliveredSizes = tree.kind.sized ?? ['pine-loblolly', 'cedar', 'mesquite', 'live-oak', 'elm', 'post-oak', 'blackjack', 'pecan', 'hackberry', 'sweetgum'].includes(tree.kind.picture);
      const mix = windAt ? windAt(tree.x) : null;
      scattered.push({ tree: tree.kind.pictures?.[tree.size] || (deliveredSizes ? sizedTree : tree.kind.picture), height, point, seed: Math.round(tree.x * 1e5), alpha: treesShown, lean: mix ? windLean(mix) : 0, gale: mix ? inGale(mix) : false });
    }
    // What the family has felled: a stump, and a log lying beside it while any are left to haul (sim/felling.mjs). The
    // trunk is `log-fallen-hardwood` (trees-colonies-2, 2026-09-21) where a hardwood was cut and the softer `log-fallen`
    // where a pine or a cottonwood was.
    // stand-in: hardwood stumps still use the nearest post-oak or cottonwood stump. Pine has its delivered stump.
    // Request 2026-09-15 - the trees of the colonies.
    const stumps = stumpsVisible(camera, canvas, woodsCatalogue);
    for (const stump of stumps) {
      const point = camera.toScreen(stump), pine = ['loblolly', 'shortleaf', 'longleaf'].includes(stump.kind.id), soft = ['cottonwood', 'sycamore', 'willow'].includes(stump.kind.id);
      scattered.push({ tree: stump.kind.stump || (pine ? 'stump-pine-loblolly' : soft ? 'stump-cottonwood' : 'stump-post-oak'), height: figure * SIZE.stump, point, seed: 0, alpha: treesShown });
      if (stump.left > 0) scattered.push({ tree: pine || soft ? 'log-fallen' : 'log-fallen-hardwood', height: figure * SIZE.stump * .8, point: { x: point.x + figure * .35, y: point.y + figure * .08 }, seed: 0, alpha: treesShown });
    }
    window.__stumpsDrawn = stumps.length;
  } else if (landWoods) window.__stumpsDrawn = 0;
  // Painted back to front, so a tuft in front of a rock overlaps it rather than being cut in half by it.
  scattered.sort((a, b) => a.point.y - b.point.y);
  // A lone open-grown oak takes the place of a rock as the camera comes close enough to see one (invented map only).
  const loneOaks = landWoods ? 0 : ramp(camera.scale, 70, 110);
  const faded = (alpha, draw) => {
    if (alpha <= 0.02) return;
    if (alpha >= 0.98) { draw(); return; }
    // Not save and restore: a few hundred of each a redraw were a fifth of its time. Every draw here keeps its own state.
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * alpha; draw(); ctx.globalAlpha = was;
  };
  // One mark of the ground, from its class's table entry, or the entry's shape while the art has not loaded.
  const plain = (share, point, ground, lean = 0, gale = false) => {
    const mark = markFor(ground, share);
    // The painted gale pose where the wind is a hard norther and the library has one for this mark - the grass tuft, so
    // far - drawn straight, because the pose is already flattened (public/weather-art.js `GALE_POSES`).
    if (gale && GALE_POSES[mark.sprite] && drawSprite(ctx, GALE_POSES[mark.sprite], point.x, point.y, figure * mark.size)) { galeDrawn++; return; }
    if (mark.sprite && drawSprite(ctx, mark.sprite, point.x, point.y, figure * mark.size, { lean })) return;
    if (mark.fallback === 'rock') {
      ctx.fillStyle = '#b9b7a4';
      ctx.beginPath(); ctx.ellipse(point.x, point.y, figure * .17, figure * .12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (mark.fallback === 'bush') {
      ctx.fillStyle = '#7c8f5c';
      ctx.beginPath(); ctx.ellipse(point.x, point.y - figure * .12, figure * .26, figure * .2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (mark.fallback === 'tuft') {
      // A tuft of bunch grass (HIST-GONZ-017). In a wind the whole tuft goes over with it: the blades already fan, and
      // the wind bends the fan, which is what a norther does to a prairie and costs nothing to draw.
      ctx.strokeStyle = share < .5 ? '#93a066' : '#87975d';
      ctx.lineWidth = Math.max(.7, figure * .07); ctx.lineCap = 'round';
      ctx.beginPath();
      for (const fan of [-.22, 0, .22]) {
        ctx.moveTo(point.x + fan * figure * .3, point.y);
        ctx.lineTo(point.x + fan * figure * .9 + lean * figure * .26, point.y - figure * .26);
      }
      ctx.stroke();
    }
  };
  for (const { share, seed, timber, point, tree, height, alpha, ground, lean = 0, gale = false } of scattered) {
    if (tree) {
      faded(alpha, () => {
        if (gale && GALE_POSES[tree] && drawSprite(ctx, GALE_POSES[tree], point.x, point.y, height)) { galeDrawn++; return; }
        if (!drawSprite(ctx, tree, point.x, point.y, height, { lean })) postOak(ctx, point.x, point.y, height, seed, lean, gale);
      });
    } else if (timber && share < .5) {
      // A scattered oak in the timber, handing over to the real trees where the land's trees are drawn.
      faded(alpha * (1 - treesShown), () => postOak(ctx, point.x, point.y, figure * SIZE.timberTree, seed, lean, gale));
      faded(alpha * treesShown, () => plain(share, point, ground, lean, gale));
    } else if (share < .055 && loneOaks > 0) {
      faded(alpha * loneOaks, () => postOak(ctx, point.x, point.y, figure * SIZE.loneTree, seed, lean, gale));
      faded(alpha * (1 - loneOaks), () => plain(share, point, ground, lean, gale));
    } else faded(alpha, () => plain(share, point, ground, lean, gale));
  }
  // What the last ground drawn did with the wind: how many things took a painted gale pose and how many were sheared
  // upright sprites. Read by scripts/weather-browser-proof.mjs, which photographs the same ground.
  window.__galeDrawn = { poses: galeDrawn - galeWas, scattered: scattered.length, gale: scattered.some(item => item.gale) };
}
/** A course's box in miles, worked out once a course: most of the colonies' water is off screen at any zoom that shows it. */
const courseBoxes = new WeakMap();
function courseBox(feature) {
  let box = courseBoxes.get(feature);
  if (!box) {
    box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const p of feature.points || []) { box.minX = Math.min(box.minX, p.x); box.maxX = Math.max(box.maxX, p.x); box.minY = Math.min(box.minY, p.y); box.maxY = Math.max(box.maxY, p.y); }
    courseBoxes.set(feature, box);
  }
  return box;
}
function drawTerrain(ctx, world, camera) {
  const figure = camera.figure;
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: ctx.canvas.width, y: ctx.canvas.height });
  for (const feature of world.map?.terrain || []) {
    if(feature.id==='town-commons'&&camera.scale>=200)continue; // Detailed Gonzales yards replace the old rectangular wash.
    const style = TERRAIN_STYLE[feature.kind]; if (!style) continue;
    // The family's own field is the plots it has cleared, drawn where they are (drawPlots), not the block on the map.
    if (feature.kind === 'field' && world.land?.plots && feature.ownerHouseholdId === world.household?.id) continue;
    // And on the Host's map every family's field is its plots.
    if (feature.kind === 'field' && world.overview?.lands?.[feature.ownerHouseholdId]?.plots) continue;
    // On the real land a river is drawn from the land's levels (`drawLevelLines`), which hold the same courses at every band.
    if (feature.kind === 'river' && levelsOf(world)) continue;
    const water = !style.fill && WATER[feature.kind];
    const width = water ? waterWidth(water.miles, camera.scale, water.floor) : 0;
    // Creeks fade in as the camera comes down to a colony (`creekOpacity`); rivers are always the map.
    const shown = feature.kind === 'creek' ? creekOpacity(camera.scale) : 1;
    if (water) {
      if (shown <= 0.02) continue;
      const box = courseBox(feature), pad = (width + 60) / camera.scale;
      if (box.maxX < topLeft.x - pad || box.minX > bottomRight.x + pad || box.maxY < topLeft.y - pad || box.minY > bottomRight.y + pad) continue;
    }
    let points = (feature.points || []).map(camera.toScreen); if (points.length < 2) continue;
    if (!style.fill) {
      // Water is drawn at its true width - about eighty metres for a river, a dozen for a creek -
      // measured in the same exaggerated yardstick as everything else on this map. `figure` is
      // PERSON_MILES of ground, and every tree, cabin and ox is a multiple of it; drawing water in
      // plain pixels instead was why a river read as a blue thread between trees twice its width.
      // Now a river is the 2.6 person-symbols across that it really is, at every zoom, and it
      // grows and shrinks with the trees on its bank instead of against them.
      //
      // The invented country used to be worse still: a width capped at twenty-six pixels, so the
      // Guadalupe was the same twenty-six pixels whether the whole county was on screen or one
      // yard of bank. The land grew as you zoomed and the water did not.
      //
      // Pulled back, the width was held at the figure's floor instead - eighteen pixels for every river below a county's
      // zoom - so a river swelled into a lake and its bends into a tangle as the map widened around it (2026-09-17). The
      // true width now meets a floor of a few pixels smoothly (public/map-base.js `waterWidth`).
      if (shown < 0.98) { ctx.save(); ctx.globalAlpha *= shown; drawWater(ctx, points, width); ctx.restore(); }
      else drawWater(ctx, points, width);
      continue;
    }
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.save();
    // Timber has no edge you could walk up to and touch. Drawn at full strength its
    // polygon reads as a ruled wedge of darker paint across the prairie, so the fill is
    // only a tint and the trees standing in it do the work of saying where the wood is.
    // It hands over to the stand of trees across a band of zoom rather than at one scale (`inventedWoods`).
    if (feature.kind === 'woods') ctx.globalAlpha *= woodsShown(world) ? 0 : .4 * (1 - inventedWoods(camera.scale));
    // The commons is trodden ground, not a paved square. Same reason, same treatment.
    else if (feature.kind === 'town') ctx.globalAlpha *= .5;
    ctx.fillStyle = style.fill; ctx.fill();
    ctx.restore();
    if (feature.kind === 'field') {
      // A neighbour's field, as a family passing sees one: the first ten acres of the block beside the house, fenced.
      // The family's own field is its plots, drawn plot by plot in `drawPlots` (docs/LAND_GRANTS.md §5), and skipped above.
      // ceiling: what a neighbour has cleared is not known to anybody who has not been to look (`seenLand`), so every
      // neighbour's field reads as its first patch; drawing seen plots is the way out.
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const left = Math.min(...xs), top = Math.min(...ys);
      const right = left + (Math.max(...xs) - left) * .5, bottom = top + (Math.max(...ys) - top) * .5;
      fieldPatch(ctx, camera, { left, top, right, bottom }, null, 'sound', feature.id);
    } else if (feature.kind === 'woods' && inventedWoods(camera.scale) > 0.02 && !woodsShown(world)) {
      // Close in, timber resolves into individual trees rather than a green wash. Timber
      // follows the water here, so a share of it is drawn as river-bottom cottonwood
      // rather than making every stand the same upland oak (HIST-GONZ-012).
      const area = Math.abs(points.reduce((sum, p, i) => sum + (p.x * points[(i + 1) % points.length].y - points[(i + 1) % points.length].x * p.y), 0) / 2);
      const count = Math.min(64, Math.round(area / Math.max(900, figure * figure * 9)));
      const stand = scatterInside(points, seedOf(feature.id), count).sort((a, b) => a.y - b.y);
      ctx.save(); ctx.globalAlpha *= inventedWoods(camera.scale);
      for (const spot of stand) {
        if (spot.tint % 5 === 3) { if (drawSprite(ctx, 'cottonwood', spot.x, spot.y, figure * SIZE.timberTree * 1.12)) continue; }
        else if (spot.tint % 7 === 5) { if (drawSprite(ctx, 'sapling', spot.x, spot.y, figure * SIZE.sapling)) continue; }
        postOak(ctx, spot.x, spot.y, figure * SIZE.timberTree, spot.tint);
      }
      ctx.restore();
    }
  }
}
/** On the invented map, how far a wood's polygon tint has handed over to its stand of trees: over scales 20 to 34. */
const inventedWoods = scale => ramp(scale, 20, 34);
/**
 * The land the family holds, as a boundary on its own map (docs/LAND_GRANTS.md). Only its own: a
 * neighbour's grant is theirs to know. Marked with a dashed line of survey-chain brown, because no
 * fence or marker stands on it yet.
 */
/** Ten acres, a side in miles (sim/fields.mjs `PLOT_SIDE`). */
const PLOT_SIDE = Math.sqrt(10 / 640);
/**
 * Broken ground on the screen: turned earth when nothing grows, corn or cotton in rows when something does, and the rail
 * fence that kept stock out of it when there is one (HIST-GONZ-013, HIST-GONZ-018). `growing` is the household's field
 * ({ crop, state }) when a crop stands on this ground, or null.
 */
function fieldPatch(ctx, camera, { left, top, right, bottom }, growing, fence, identity = 'field') {
  const figure = camera.figure;
  const points = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
  drawFieldSurface(ctx, { left, top, right, bottom }, { identity, growing, figure, drawSprite });
  // A family starts without a fence, splits rails to raise one round a plot, and until they do the stock are in its crop.
  if (camera.scale > 40 && fence && fence !== 'none') railFence(ctx, points, figure, fence === 'ruined');
  return points;
}
/**
 * The family's plots on its own map (docs/LAND_GRANTS.md §4-5): cleared ones as field, with the crop on those that were
 * sown and rails round those that are fenced; staked ones as a square with posts, the clearing done so far turned earth
 * in its middle; the ground somebody is on the way to survey; and the place being looked at.
 *
 * Delivered clearing art reads only the family's projected plots. Smoke is not
 * inferred from work progress; its animation is reserved for a known burning state.
 */
function drawPlots(ctx, world, camera) {
  const rectOf = point => {
    const a = camera.toScreen({ x: point.x - PLOT_SIDE / 2, y: point.y - PLOT_SIDE / 2 }), b = camera.toScreen({ x: point.x + PLOT_SIDE / 2, y: point.y + PLOT_SIDE / 2 });
    return { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) };
  };
  const square = (point, style) => {
    const { left, top, right, bottom } = rectOf(point);
    const corners = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
    ctx.save();
    ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (style.fill) { ctx.fillStyle = style.fill; ctx.fill(); }
    ctx.setLineDash(style.dash || []);
    ctx.lineWidth = Math.max(1.2, Math.min(3, camera.figure * .05)); ctx.strokeStyle = style.stroke; ctx.stroke();
    if (style.posts) {
      const post = Math.max(2, Math.min(9, camera.figure * .22));
      ctx.setLineDash([]); ctx.fillStyle = '#5a3f22';
      for (const [i,p] of corners.entries())drawSprite(ctx,i===0?'survey-stone-corner':'survey-stake',p.x,p.y,Math.max(6,post*1.8));
    }
    ctx.restore();
    return corners;
  };
  const drawn = [];
  // A student's own plots; on the Host's map, every family's (`knownLands`). Tagged with the family only for the Host.
  const host = hostView(world);
  const onScreen = ({ left, top, right, bottom }) => right >= 0 && bottom >= 0 && left <= ctx.canvas.width && top <= ctx.canvas.height;
  for (const { householdId, plots, field } of knownLands(world)) for (const plot of plots || []) {
    if (host && !onScreen(rectOf(plot))) continue;
    const whose = host ? { householdId } : {};
    if (plot.state === 'cleared') {
      const growing = plot.sown && field && field.state !== 'bare' ? field : null;
      const corners = fieldPatch(ctx, camera, rectOf(plot), growing, plot.fence, `${householdId}:${plot.id}`);
      drawn.push({ id: plot.id, ...whose, state: plot.state, ground: plot.ground, sown: Boolean(growing), fence: plot.fence || 'none', corners });
      continue;
    }
    // Staked: the clearing done so far, as a square of turned earth growing from the middle.
    const share = plot.work && plot.spells ? Math.min(1, plot.work / plot.spells) : 0;
    const corners = square(plot, { stroke: '#77684788', dash: [3, 7], posts: true });
    if (share > 0) {
      const inner = Math.sqrt(share) * PLOT_SIDE / 2;
      const a = camera.toScreen({ x: plot.x - inner, y: plot.y - inner }), b = camera.toScreen({ x: plot.x + inner, y: plot.y + inner });
      drawFieldSurface(ctx, { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) }, { identity: `${householdId}:${plot.id}`, figure: camera.figure, clearing: true });
    }
    drawn.push({ id: plot.id, ...whose, state: plot.state, ground: plot.ground, work: plot.work || 0, spells: plot.spells, cleared: share, corners });
  }
  for (const person of host ? observedOf(world) : entitiesOf(world)) if (person.chore?.id === 'survey-plot' && person.chore.plot) square(person.chore.plot, { stroke: 'rgba(107,79,42,.7)', dash: [5, 4] });
  if (plotPick && surveyLooking()) {
    // Surveying looks at new ground; clearing and fencing at the plot under the tap, outlined where the server found it.
    const target = plotJob === 'survey-plot' ? plotPick.point : (world.land?.plots || []).find(plot => plot.id === plotPick.facts?.plotId);
    // A hunt is a place, not ten acres: a ring where the hunter will go.
    if (plotJob === 'hunt-land' || plotJob === 'fell-trees') {
      // Felling takes the trees within a few rods of the place (sim/felling.mjs `FELL_REACH`), and the ring is that far.
      const at = camera.toScreen(plotPick.point), radius = plotJob === 'fell-trees' ? Math.max(6, camera.scale * 0.05) : Math.max(6, Math.min(40, camera.scale * 0.03));
      ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeStyle = plotPick.facts?.can ? '#b5452f' : '#8a8171';
      ctx.beginPath(); ctx.arc(at.x, at.y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (target) square(target, { stroke: plotPick.facts?.can ? '#b5452f' : '#8a8171', fill: plotPick.facts?.can ? 'rgba(181,69,47,.12)' : 'rgba(138,129,113,.12)', dash: [6, 4] });
  }
  window.__plotsDrawn = drawn;
  const decorations=[];
  for(const plot of knownLands(world).flatMap(land=>land.plots||[])){const r=rectOf(plot),size=Math.min(camera.figure*.25,(r.right-r.left)*.1);if(size<3||(host&&!onScreen(r)))continue;
    for(const piece of plotArt(plot)){const x=r.left+(r.right-r.left)*piece.x,y=r.top+(r.bottom-r.top)*piece.y;drawSprite(ctx,piece.sprite,x,y,size);decorations.push({plotId:plot.id,sprite:piece.sprite,x,y});}
  }
  window.__plotArtDrawn=decorations;
}
/** A polyline cut in two at a distance along it, in world miles: the part before and the part after. */
function splitAlong(points, miles) {
  const before = [{ ...points[0] }];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (miles <= length) {
      const f = length ? miles / length : 0, at = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      before.push(at);
      return [before, [at, ...points.slice(i).map(p => ({ ...p }))]];
    }
    miles -= length; before.push({ ...b });
  }
  return [before, []];
}
/**
 * Whether the house being placed would stand too close to one of the family's own, as the server judges it: the same
 * rule on the same ground (sim/house-footprint.mjs `spacingRefusal`, sim/house-placement.mjs), so the preview is refused
 * where "Build here" would be. A second house is judged against every house of the land, a first house changed before
 * work against the finished ones. The ground itself - water, the land's line, the slope, the field - is the server's to
 * read, and its refusal is said in `#house-placement-note` when "Build here" is pressed.
 */
function placementRefusal(world, placement) {
  const land = world.land, site = sitesOf(world).find(each => each.id === world.household?.homeSiteId);
  if (!land || !plotCatalogue) return null;
  const standing = [...(housePlacement.command.additional ? [land.house] : []), ...(land.completedHouses || [])].filter(Boolean)
    .map(house => ({ house, at: standingAt(house, site) })).filter(each => each.at).map(({ house, at }) => houseOnGround(house, plotCatalogue, at));
  return spacingRefusal(houseOnGround({ plan: housePlacement.command.layout }, plotCatalogue, placement), standing);
}
/** Said in the placement panel while the preview is where the student may build. */
const PLACING_NOTE = 'Move over your land; click to hold the preview in place.';
/** The place the family is looking over for its house, as a stake on its own land. */
function drawSitePick(ctx, world, camera) {
  if (housePlacement?.point && plotCatalogue) {
    const plan = plotCatalogue.plans.find(p => p.id === housePlacement.command.layout);
    const placement = { ...housePlacement.point, rotation: housePlacement.rotation }, refused = placementRefusal(world, placement);
    // The server's words for the spot while the preview is over it, tinting the preview; the placing words once it is clear.
    const note = document.querySelector('#house-placement-note');
    if (refused) { note.textContent = refused; housePlacement.refused = refused; }
    else if (housePlacement.refused) { if (note.textContent === housePlacement.refused) note.textContent = PLACING_NOTE; housePlacement.refused = null; }
    if (plan) drawPlacedHouse(ctx, camera, { placement, pieces: plan.pieces.map(([type,x,y]) => [type,x,y,plotCatalogue.pieces.find(p => p.id === type).stageCount,0]) }, .5, refused);
  }
  if (!world.land?.choosingSite || !sitePick) { window.__sitePick = null; return; }
  const at = camera.toScreen(sitePick.point), size = Math.max(8, Math.min(22, camera.figure * .45));
  ctx.save();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,248,226,.9)';
  ctx.beginPath(); ctx.moveTo(at.x, at.y); ctx.lineTo(at.x, at.y - size * 1.6); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = '#4b3e28'; ctx.stroke();
  ctx.fillStyle = sitePick.facts?.can ? '#b5452f' : '#8a8171';
  ctx.beginPath(); ctx.moveTo(at.x, at.y - size * 1.6); ctx.lineTo(at.x + size, at.y - size * 1.3); ctx.lineTo(at.x, at.y - size); ctx.closePath(); ctx.fill();
  ctx.restore();
  window.__sitePick = { x: at.x, y: at.y, can: Boolean(sitePick.facts?.can) };
}
function drawHolding(ctx, world, camera) {
  // The Host sees every family's line, thinner, and names none of them here: the family's name is over its house.
  if (hostView(world)) {
    let drawn = 0;
    for (const land of landsOf(world)) {
      if (!land.grant) continue;
      const { minX, minY, maxX, maxY } = land.grant;
      const corners = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }].map(camera.toScreen);
      if (corners[1].x < 0 || corners[2].y < 0 || corners[0].x > ctx.canvas.width || corners[0].y > ctx.canvas.height) continue;
      ctx.save();
      ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      const dash = Math.max(4, Math.min(16, camera.figure * .35));
      ctx.setLineDash([dash, dash * .7]); ctx.lineWidth = Math.max(1, Math.min(3, camera.figure * .045)); ctx.strokeStyle = 'rgba(107,79,42,.8)'; ctx.stroke();
      ctx.restore();
      drawn++;
    }
    window.__holdingRect = null; window.__holdingsDrawn = drawn;
    return;
  }
  const holding = world.land?.grant;
  if (!holding) { window.__holdingRect = null; return; }
  const { minX, minY, maxX, maxY } = holding.bounds;
  const corners = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }].map(camera.toScreen);
  ctx.save();
  ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
  const dash = Math.max(4, Math.min(16, camera.figure * .35));
  ctx.setLineDash([dash, dash * .7]);
  ctx.lineWidth = Math.max(1.5, Math.min(4, camera.figure * .06));
  ctx.strokeStyle = 'rgba(255,248,226,.75)'; ctx.lineWidth += 2; ctx.stroke();
  ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth -= 2; ctx.stroke();
  ctx.restore();
  // Presentation evidence for proofs, on the same contract as `window.__plotsDrawn`.
  window.__holdingRect = { kind: holding.kind, acres: holding.acres, corners };
}
/**
 * The ground under everybody, drawn once and laid down each frame (public/map-base.js, docs/PERFORMANCE_RENDER.md): relief,
 * woods, scattered ground, water, fields, roads and a town's ground. Drawn again when the key changes - a snapshot, the
 * camera, the canvas's size - or when something it drew from lands without a snapshot (`invalidateMapBase`: art, a woods
 * tile, the map fetched). Twelve frames a second of people walking no longer repaint the country under them.
 */
const mapBase = { canvas: null, key: null, state: null, time: 0, audited: null };
const GROUND_KEY_PARTS = ['art or tiles', 'land', 'pick', 'weather', 'map', 'width', 'height', 'camera', 'camera', 'zoom'];
/** The ground audit's comparison: how much of the ground drawn afresh differs from the kept one (`window.__groundAudit`). */
function auditGround(fresh, kept, world) {
  const a = fresh.getContext('2d').getImageData(0, 0, fresh.width, fresh.height).data, b = kept.getContext('2d').getImageData(0, 0, kept.width, kept.height).data;
  let differ = 0, minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) {
    differ++; const p = i / 4, x = p % fresh.width, y = Math.floor(p / fresh.width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const share = differ / (a.length / 4);
  window.__groundAudits = (window.__groundAudits || 0) + 1;
  if (share > 0.001) (window.__groundAuditMisses ||= []).push({ tick: world.tick, minute: world.minute, share: +share.toFixed(4), box: [minX, minY, maxX, maxY] });
}
let mapBaseEpoch = 0;
function invalidateMapBase() { mapBaseEpoch++; }
/**
 * The water courses in view as screen polylines, for the weather to lay high water and fog along (public/weather-art.js).
 * The same courses the map already draws - the real land's rivers at this zoom's band, and the invented map's creeks and
 * rivers - and no others, so the flood is on the water the student can see and nowhere else.
 *
 * Cut to the view and thinned as it goes: a river across the colonies is thousands of points, and what is laid along it
 * here is a soft stroke tens of pixels wide, which cannot show a point closer than a few pixels to the last one. Whole
 * runs off the screen are dropped rather than converted. This runs when the ground is drawn, never on a frame that only
 * moves people.
 */
const COURSE_STEP = 6;
function weatherCourses(world, camera, canvas) {
  const landHere = levelsOf(world);
  const courses = [
    ...(world.map?.terrain || []).filter(feature => (feature.kind === 'creek' || (feature.kind === 'river' && !landHere)) && feature.points?.length > 1)
      .map(feature => ({ points: feature.points, ...WATER[feature.kind] })),
    ...(landHere ? levelRivers(landHere, camera) : []),
  ];
  const out = [];
  for (const course of courses) {
    const width = Math.max(2, waterWidth(course.miles, camera.scale, course.floor));
    // How far off the screen a point may lie and still matter: the widest wash laid along it (the fog's nine times the
    // channel) reaches back in from that far.
    const pad = width * 10 + 60;
    const box = lineBox(course.points), miles = pad / camera.scale;
    const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: canvas.width, y: canvas.height });
    if (box.maxX < topLeft.x - miles || box.minX > bottomRight.x + miles || box.maxY < topLeft.y - miles || box.minY > bottomRight.y + miles) continue;
    let piece = [], last = null;
    const close = () => { if (piece.length > 1) out.push({ points: piece, width }); piece = []; };
    for (const point of course.points) {
      const q = camera.toScreen(point);
      if (q.x < -pad || q.y < -pad || q.x > canvas.width + pad || q.y > canvas.height + pad) { close(); last = null; continue; }
      if (last && Math.abs(q.x - last.x) + Math.abs(q.y - last.y) < COURSE_STEP) continue;
      piece.push(q); last = q;
    }
    close();
  }
  return out;
}
/** The fog's shape, drawn with the ground and laid down each frame at the strength the hour leaves it. */
const fogBase = { canvas: null, shapes: 0 };
/**
 * How many minutes of 1835 the last tick stood for, read from two snapshots in a row (sim/clock.mjs runs two clocks on the
 * real land). It scales a traveller's drawn speed (public/motion.js `travelMilesATick`) for a class saved and
 * served before the server sent `step`. Whether a journey may be watched at all is no longer asked here: the server sends
 * somebody away on the road with no position (sim/sight.mjs).
 */
let minutesATick = 0, lastTickSeen = null;
function noteTick(world) {
  if (!world || world.tick === lastTickSeen?.tick) return;
  if (lastTickSeen && world.tick === lastTickSeen.tick + 1 && world.minute > lastTickSeen.minute) minutesATick = world.minute - lastTickSeen.minute;
  lastTickSeen = { tick: world.tick, minute: world.minute };
}
export function drawWorld(world) {
  noteTick(world);
  window.__animationClips = new Set();
  const canvas = $('#world-map'), main = canvas.getContext('2d');
  fitCanvas();
  // One moment for the frame: the camera and everybody drawn in it (`sightOf` too).
  const frameNow = performance.now();
  const camera = cameraFor(world, canvas, frameNow);
  drawnCamera = { cx: camera.cx, cy: camera.cy, scale: camera.scale, width: canvas.width, height: canvas.height };
  mapDrawWanted = false; lastMapDraw = performance.now(); gesturePicture = null;
  window.__camera = { kind: camera.kind, scale: camera.scale, named: camera.named, cx: camera.cx, cy: camera.cy, following: camera.following, figure: camera.figure, house: camera.house };
  // The ground is drawn again only when something it is drawn from changed (`groundInputs`, public/map-base.js): not for a
  // snapshot in which only people moved, nor for a click that renders one. The pick being made on the land is drawn into it.
  const pick = surveyLooking() && plotPick ? JSON.stringify([plotJob, plotPick.point, plotPick.facts?.can ?? null, plotPick.facts?.plotId ?? null]) : null;
  // The woods' revision is not in it: a tree felled anywhere in the class moves it, and what changes on the ground is the tile
  // that comes after, whose arrival draws the ground again (`redrawForArrival`).
  // The weather in the ground is the high water on the rivers, the wet earth and the lean the wind puts on the trees
  // (public/weather-art.js). It is quantised, so a day that holds costs nothing and a water level falling a thousandth an
  // hour does not redraw the country; a day that turns redraws it once, which is what `since` then fades in over.
  const weather = world.weather && weatherShown(world.weather) ? world.weather : null;
  // The view cut into spans of one weather each - one span for a student, who is inside a single region, and a dozen for
  // the Host looking at four hundred miles across all three. Worked out once and used by all three passes.
  const weatherNow = weather
    ? weatherSpans(weather, world.minute, camera.toWorld({ x: 0, y: 0 }).x, camera.toWorld({ x: canvas.width, y: 0 }).x, canvas.width)
    : null;
  // The same spans with the day fully up, for what is drawn into the kept ground: see the ground pass below.
  const weatherSteady = weather
    ? weatherSpans(weather, world.minute, camera.toWorld({ x: 0, y: 0 }).x, camera.toWorld({ x: canvas.width, y: 0 }).x, canvas.width, 12, STEADY)
    : null;
  const baseKey =[mapBaseEpoch, groundInputs(world), pick, weather ? weatherGroundKey(weather) : '', world.map, canvas.width, canvas.height, camera.cx, camera.cy, camera.scale];
  // `ground` is the context the ground is drawn into this frame, or null when the kept ground is still right.
  let ground = null, audit = null;
  if (!sameLayerKey(mapBase.key, baseKey)) {
    mapBase.canvas ??= document.createElement('canvas');
    if (mapBase.canvas.width !== canvas.width || mapBase.canvas.height !== canvas.height) { mapBase.canvas.width = canvas.width; mapBase.canvas.height = canvas.height; }
    ground = mapBase.canvas.getContext('2d');
    // Presentation evidence, like `__groundDrawn`: what made the ground be drawn again, by the first part of the key that moved.
    const why = mapBase.key ? GROUND_KEY_PARTS[baseKey.findIndex((part, i) => !Object.is(part, mapBase.key[i]))] || 'first' : 'first';
    (window.__groundWhy ||= {})[why] = (window.__groundWhy[why] || 0) + 1;
    mapBase.key = baseKey; mapBase.time = animationTime; mapBase.audited = world; mapBase.startState = readDrawState(ground);
    // Presentation evidence, read by scripts/perf-render-measure.mjs and by nothing in the application: how often the ground is drawn.
    window.__groundDrawn = (window.__groundDrawn || 0) + 1;
  } else if (window.__groundAudit && mapBase.audited !== world) {
    // The ground audit, for proofs only: on each snapshot the kept ground was not redrawn for, draw it afresh aside, at the
    // moment the kept one was drawn, and compare. A difference is something drawn into the ground that `groundInputs` does
    // not know of, and would have stood stale on a student's map.
    mapBase.audited = world;
    audit = document.createElement('canvas'); audit.width = canvas.width; audit.height = canvas.height;
    ground = audit.getContext('2d');
    // From the drawing state the kept ground began in: it is drawn into a canvas that keeps its state from one drawing to the next.
    if (mapBase.startState) applyDrawState(ground, mapBase.startState);
  }
  // The woods are asked for what the view needs whenever the ground is drawn, and whenever their revision moves - a tree
  // felled somewhere - which no longer draws the ground by itself: the tiles that come back do (`redrawForWoods`).
  const woodsRevision = window.__snapshot?.woodsRevision || 0;
  if ((ground && !audit) || woodsRevision !== mapBase.woodsRevision) {
    mapBase.woodsRevision = woodsRevision;
    ensureWoods(world, camera, canvas, window.__snapshot?.mapId, woodsCatalogue, redrawForWoods, woodsRevision);
  }
  if (ground) {
    const frameTime = animationTime;
    if (audit) animationTime = mapBase.time;
    ground.clearRect(0, 0, canvas.width, canvas.height);
    ground.fillStyle = '#9fbe73'; ground.fillRect(0, 0, canvas.width, canvas.height);
    window.__relief = drawRelief(ground, world, camera);
    if (woodsShown(world) && woodsCatalogue) drawWoodsCover(ground, camera, canvas, woodsCatalogue);
    drawGroundDetail(ground, world, camera);
    drawTerrain(ground, world, camera);
    drawHolding(ground, world, camera);
    drawPlots(ground, world, camera);
    // The ground's own clips (the oaks' wind) are kept with it, and still named on the frames that only lay it down.
    // ceiling: the trees in the kept ground stand still between redraws of it; a few swaying trees drawn on each frame over
    // the kept ground is the way out, if the stillness is missed.
    animationTime = frameTime;
    if (!audit) mapBase.clips = new Set(window.__animationClips);
  } else for (const clip of mapBase.clips || []) window.__animationClips.add(clip);
  // What is drawn from here on goes on the page's own canvas; the ground's own draws in the loops below go to `ground`.
  const ctx = main;
  const host = hostView(world);
  // Every family's land by its house, for the Host's map (empty for a student).
  const landBySite = new Map(landsOf(world).map(land => [land.homeSiteId, land]));
  // Presentation evidence for proofs: each wade drawn on a family's lane when the ground was last drawn (`wadesOf`).
  if (ground && !audit) window.__wadesDrawn = [];
  // Worn dirt, not a drafting line: a soft verge with a packed track down the middle.
  if (ground) for (const route of Object.values(world.map?.routes || {})) {
    const ctx = ground;
    const points = (route.points || []).filter(Boolean).map(camera.toScreen); if (points.length < 2) continue;
    const track = route.kind === 'track' ? .55 : 1;
    // A cart road is a few rods wide; drawn at a sixteenth of a mile it was wider than the house beside it.
    const width = Math.max(2, Math.min(46, camera.scale * .012 * track + camera.figure * .22));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // The family's own lane, marked but not all cut (sim/homesite.mjs): the uncut stretch is a line of stakes through the
    // grass, and the cut stretch from the house outward is track. Only its own: how far a neighbour has cut is theirs.
    const lane = hostView(world) ? landBySite.get(route.to)?.lane : route.to === world.household?.homeSiteId && world.land?.lane;
    const uncutMiles = lane ? Math.max(0, lane.miles - lane.cut) : 0;
    const [marked, worn] = uncutMiles > 0 ? splitAlong(route.points, uncutMiles).map(part => part.map(camera.toScreen)) : [[], points];
    if (marked.length > 1) {
      ctx.save(); ctx.setLineDash([Math.max(3, width * .5), Math.max(4, width * .9)]);
      ctx.beginPath(); marked.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(107,79,42,.7)'; ctx.lineWidth = Math.max(1.5, width * .3); ctx.stroke();
      ctx.restore();
    }
    if (worn.length > 1) {
      drawRoad(ctx,worn,width);
    }
    // A family's lane wades the smaller water between its house and the road (sim/colonies-region.mjs), as the roads do;
    // a road's wade is a ford of the map's, and a lane's is drawn as the same ford, where the lane meets the water as it
    // is drawn (`wadesOf`), from the zoom a road's ford is (docs/MAP_ACCURACY.md §10.8). Without it the lane was a brown
    // track laid straight over the creek or the river (owner, 2026-09-24).
    // ceiling: drawn, not walked. The simulation lets a lane's wade cost nothing (a road's ford is `fordMinutes`); a wade as a
    // place of the map, dealt with the lane, is the way out if the lane's water should ever slow the family.
    // ceiling: lanes only. The timber tracks and Gonzales's bank path are the built map's, and where they go over a big
    // river they do it beside that river's documented crossing (docs/MAP_ACCURACY.md §10.8): a ford drawn there would be
    // an invented crossing next to a real one. Laying those tracks again over the crossings is the way out.
    if (world.map.sites?.[route.to]?.kind === 'homestead') {
      for (const wade of lanesWades(world, route)) {
        const creek = wade.kind === 'creek';
        if (camera.scale < LANDING_LEGIBLE || (creek && creekOpacity(camera.scale) <= .5)) continue;
        const at = camera.toScreen(wade), a = camera.toScreen(wade.a), b = camera.toScreen(wade.b);
        if (at.x < -60 || at.y < -60 || at.x > ctx.canvas.width + 60 || at.y > ctx.canvas.height + 60) continue;
        const across = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        const water = creek ? waterWidth(WATER.creek.miles, camera.scale, WATER.creek.floor) : waterWidth(WATER.river.miles, camera.scale, WATER.river.floor);
        const length = world.map?.source ? Math.max(creek ? 8 : 12, creek ? water * 2.2 : camera.scale * .065) : Math.max(12, camera.figure * 1.8);
        drawCrossing(ctx, at.x, at.y, length, across);
        if (!audit) (window.__wadesDrawn ||= []).push({ routeId: route.id, water: wade.name, kind: wade.kind, x: Math.round(at.x), y: Math.round(at.y) });
      }
    }
  }
  window.__laneDrawn = world.land?.lane ? { miles: world.land.lane.miles, cut: world.land.lane.cut } : null;
  const homeId = homeOf(world);
  // Buildings and people share one back-to-front order, so a family standing south of
  // their cabin is in front of it and one standing north is behind it. Sorting the two
  // separately would put every person on top of every roof in the county.
  const labels = [];
  const standing = [];
  // Presentation evidence for proofs, on the same contract as `__plotsDrawn`: each family's land the Host's map drew, as drawn.
  const hostLandsDrawn = {};
  window.__hostLandsDrawn = hostLandsDrawn;
  housesDrawn.clear();
  // Presentation evidence for proofs: each placed house and each placement preview drawn this frame, where and how big.
  window.__placedHousesDrawn = [];
  // Presentation evidence for proofs: where each house a tap can open was drawn this frame.
  window.__housesDrawn = housesDrawn;
  // Presentation evidence for proofs: each crossing drawn into the ground when it was last drawn, its kind and where
  // (docs/MAP_ACCURACY.md §10).
  if (ground && !audit) window.__crossingsDrawn = {};
  // Each family's house, or houses, as one standing item, kept apart from the others' after this loop.
  const familyHouses = [];
  for (const site of sitesOf(world)) {
    // A road junction is a shape in the network, not a place: it must never draw a building.
    if (site.kind === 'junction') continue;
    const q = camera.toScreen(site), settlement = site.kind === 'town' || site.id === 'gonzales';
    // A place of the country outside the box (docs/MAP_ACCURACY.md §11): Matamoros, Laredo, San Patricio, the presidio.
    // Its name is drawn and nothing else - the map has no art for a Mexican town, and a settler's cabin would be a lie.
    const distant = site.kind === 'distant';
    // A colony fifteen miles across is fifty pixels wide at province scale, and sixteen
    // holdings drawn inside it are one brown smudge with the labels piled on top. Another
    // family's homestead is drawn only once it would be legible on its own; the student's
    // own land and the town are always drawn, because those are the two places that mean
    // anything at that distance. Nothing is hidden that the student could act on: a
    // neighbour's cabin is scenery, and their people are reached by standing with them.
    const ownLand = site.id === homeId;
    if (site.kind === 'homestead' && !ownLand && camera.scale < HOMESTEAD_LEGIBLE) continue;
    if (settlement || site.kind === 'homestead' || !site.kind) {
      const size = cabinSize(camera, settlement);
      // What stands round a family's house - its camp, its log pile, its stock - is set out and drawn with the people,
      // floored as they are: only the house is held to its ground (`houseScale`).
      const yard = settlement ? size : Math.max(5, camera.figure * SIZE.cabin);
      // Where the family's own house is drawn, and on the Host's map every family's, so a tap on it can open the rooms inside.
      if (!settlement && (ownLand || host)) housesDrawn.set(site.id, { x: q.x, y: q.y - size * .35, size });
      // What is on this land, as this family knows it: its own as it is, a neighbour's as it was
      // last seen, and one nobody has been to see as it was at dawn on the 28th - a camp, in a class
      // that began with the families arriving (sim/houses.mjs, `noteLandSeen`).
      // On the Host's map, every family's land as it truly stands (sim/overview.mjs), nothing remembered or assumed.
      const theirs = host && !settlement ? landBySite.get(site.id) : null;
      const view = settlement ? null : theirs ? theirs.view : ownLand && world.land ? ownLandView(world.land) : (world.household?.seenLand?.[site.id] || (world.arrivalClass ? { shelter: 'camp' } : { shelter: 'house' }));
      if (theirs) hostLandsDrawn[site.id] = { householdId: theirs.householdId, ...view };
      if(site.id==='gonzales'&&camera.scale>=200){
        const project=p=>camera.toScreen({x:site.x+p.x,y:site.y+p.y});if(ground)drawGonzalesGround(ground,project,camera.scale);standing.push(...gonzalesDrawables(ctx,project,camera.scale,Object.fromEntries((world.map?.shops?.gonzales||[]).filter(shop=>shop.building).map(shop=>[shop.building,shop.label]))));
        window.__shopsDrawn={gonzales:(world.map?.shops?.gonzales||[]).length};
      }else if(TOWN_LAYOUTS[site.id]&&camera.scale>=200){
        // A town of the colonies from its research sketch (sim/town-layouts.mjs, docs/TOWNS.md §5b), its keepers' buildings named.
        const layout=TOWN_LAYOUTS[site.id],project=p=>camera.toScreen({x:site.x+p.x,y:site.y+p.y});
        if(ground)drawTownGround(ground,layout,project,camera.scale);
        standing.push(...townDrawables(ctx,layout,project,camera.scale,Object.fromEntries((world.map?.shops?.[site.id]||[]).filter(shop=>shop.building).map(shop=>[shop.building,shop.label]))));
        window.__townsDrawn={...(window.__townsDrawn||{}),[site.id]:layout.buildings.length};
      }else if(site.id==='bexar'&&camera.scale>=200){
        // Scenic local feet around the existing, server-projected town. No new entities or travel shortcuts. Laid by the
        // reconstruction's own frame (public/bexar-layout.js `BEXAR_FRAME`); the map's river through the town is the
        // reconstruction's 1836 river (scripts/build-colonies-map.mjs), so it is not drawn twice and its bank trees stand on it.
        const project=p=>{const o=bexarToSite(p);return camera.toScreen({x:site.x+o.x,y:site.y+o.y});};
        if(ground)drawBexarGround(ground,project,camera.scale/5280,{river:false});
        standing.push(...bexarDrawables(ctx,project,camera.scale/5280,{alamoProject:p=>{const o=alamoOnMap(p);return camera.toScreen({x:site.x+o.x,y:site.y+o.y});}}));
      }else if (ownLand && world.land?.house?.pieces && plotCatalogue) {
        // The family's house plot, piece by piece at its stage (public/house-plot.js); the camp beside it until a pen stands.
        familyHouses.push({ own: true, siteId: site.id, box: () => landHomeBox(camera, q, world.land.house, world.land.completedHouses),
          item: { y: q.y, draw: () => { if (world.land.shelter === 'camp') homesteadCamp(ctx, q.x - yard * .9, q.y + yard * .35, yard * .7, site.id); window.__plotPiecesDrawn = drawLandHouses(ctx, camera, site.id, q, size, world.land.house, world.land.completedHouses); } } });
      }else if (theirs?.pieces && plotCatalogue) {
        // The same house plot, for any family, on the Host's map.
        const current = { pieces: theirs.pieces, placement: theirs.housePlacement };
        familyHouses.push({ own: false, siteId: site.id, box: () => landHomeBox(camera, q, current, theirs.completedHouses),
          item: { y: q.y, draw: () => { if (theirs.view.shelter !== 'house') homesteadCamp(ctx, q.x - yard * .9, q.y + yard * .35, yard * .7, site.id); hostLandsDrawn[site.id].pieces = theirs.pieces.length; drawLandHouses(ctx, camera, site.id, q, size, current, theirs.completedHouses); } } });
      }else if (view && site.kind === 'homestead') {
        // A family's land as this family knows it, or as it last saw a neighbour's: a house the size a house is drawn, a
        // camp the size a camp is.
        const drawn = c => homesteadHouse(c, q.x, q.y, view.shelter === 'camp' ? yard : size, site.id, view);
        familyHouses.push({ own: ownLand, siteId: site.id, box: () => drawnBox(drawn), item: { y: q.y, draw: () => drawn(ctx) } });
      }else standing.push({ y: q.y, draw: () => view ? homesteadHouse(ctx, q.x, q.y, view.shelter === 'camp' ? yard : size, site.id, view) : miniBuilding(ctx, q.x, q.y, size, true, site.id) });
      // A new town's shops, each keeper's own building at its place (sim/shops.mjs, docs/TOWNS.md). Drawn for anybody, as
      // a town's buildings are; who is standing in them is still only seen by somebody who is there.
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the shops of the towns. Each trade is the nearest building the library has.
      if (settlement && site.id !== 'gonzales' && camera.scale >= 200 && world.map?.shops?.[site.id]) {
        for (const shop of world.map.shops[site.id]) {
          // A keeper in one of the town's own drawn buildings is drawn with the town (public/town-art.js).
          if (shop.building) continue;
          const p = camera.toScreen({ x: site.x + shop.x, y: site.y + shop.y }), height = 0.024 * camera.scale;
          standing.push({ y: p.y, draw: () => {
            drawSprite(ctx, shop.sprite, p.x, p.y, height);
            if (camera.scale > 1000) { ctx.save(); ctx.font = '12px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#f2e6c9'; ctx.strokeText(shop.label, p.x, p.y + 16); ctx.fillStyle = '#4c422e'; ctx.fillText(shop.label, p.x, p.y + 16); ctx.restore(); }
          } });
        }
        window.__shopsDrawn = { ...(window.__shopsDrawn || {}), [site.id]: world.map.shops[site.id].length };
      }
      // The family's log pile beside the house, a log drawn for every ten or part of ten, up to four (sim/felling.mjs).
      // stand-in: a pile is `log-fallen` laid side by side until a log pile is drawn. Request 2026-09-15 - the trees of the colonies.
      const piled = theirs ? theirs.logs || 0 : ownLand && world.land?.logs ? world.land.logs.wall + world.land.logs.sill + world.land.logs.poor : 0;
      for (let i = 0; i < Math.min(4, Math.ceil(piled / 10)); i++) {
        const x = q.x - yard * (.9 + i * .06), y = q.y + yard * (.28 + i * .07);
        standing.push({ y, draw: () => drawSprite(ctx, 'log-fallen', x, y, camera.figure * SIZE.logPile) });
      }
      if (ownLand) window.__logPileDrawn = Math.min(4, Math.ceil(piled / 10));
      // Own land only: these grazing animals illustrate the projected stock choice; the herd is not an entity yet.
      if (theirs ? theirs.stock && !theirs.arriving : ownLand && world.household?.stock && world.land && !world.land.arriving) {
        const coat = ['red', 'pied', 'dun'][Array.from(site.id).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 3];
        for (const [dx, dy, flip, clip, scale] of [[1.25, .35, false, `cattle-longhorn-${coat}-graze`, .55], [1.7, .55, true, 'hog-root', .3]]) {
          const x = q.x + yard * dx, y = q.y + yard * dy;
          standing.push({ y, draw: () => animated(ctx, clip, x, y, yard * scale, `${site.id}:${clip}`, { flip }) });
        }
      }
    } else if (CROSSING_KINDS.includes(site.kind)) {
      // A ford, a ferry or a bridge where a road meets the water (docs/MAP_ACCURACY.md §10): drawn where its road meets the
      // water (`over`, for a place that stands off it), lying across the water (`across`, the build's; else read off the drawn
      // water, as Gonzales's ford of an older class is). Gonzales's own ford is drawn at every zoom as it always was; the rest
      // come in with the county, a creek's with its creek.
      const creek = site.waterKind === 'creek', shown = site.id === 'ford' || (camera.scale >= LANDING_LEGIBLE && (!creek || creekOpacity(camera.scale) > .5));
      if (ground && shown) {
        const at = site.over ? camera.toScreen(site.over) : q, angle = Number.isFinite(site.across) ? site.across : crossingAngle(site, world.map?.terrain || [], camera.toScreen);
        const width = creek ? waterWidth(WATER.creek.miles, camera.scale, WATER.creek.floor) : waterWidth(WATER.river.miles, camera.scale, WATER.river.floor);
        // Open water drawn as the sea's, not as a line (Lynch's ferry): the build measured it bank to bank (`span`).
        const length = world.map?.source ? Math.max(creek ? 8 : 12, creek ? width * 2.2 : camera.scale * .065, (site.span || 0) * camera.scale * 1.1) : Math.max(12, camera.figure * 1.8);
        // The road's width as the roads above are drawn, so the river can be laid back over it between the landings.
        if (site.kind === 'ferry') drawFerry(ground, at.x, at.y, Math.max(length, width * 1.8 * (site.oblique || 1)), angle, camera.figure, Math.max(2, Math.min(46, camera.scale * .012 + camera.figure * .22)));
        else drawCrossing(ground, at.x, at.y, length, angle, site.kind === 'bridge');
        if (!audit) (window.__crossingsDrawn ||= {})[site.id] = { kind: site.kind, x: Math.round(at.x), y: Math.round(at.y) };
      }
    } else if (site.kind === 'camp') {
      // A camp is shelter, not a house: canvas and brush, nothing that implies a holding.
      standing.push({ y: q.y, draw: () => {
        const size = Math.max(5, camera.figure * SIZE.camp);
        drawSprite(ctx, 'tent', q.x - size * .42, q.y, size * .9);
        drawSprite(ctx, 'lean-to', q.x + size * .5, q.y + size * .06, size * .78);
      } });
    } else if (site.kind === 'woods') {
      standing.push({ y: q.y, draw: () => {
        const size = Math.max(4, camera.figure * SIZE.timberTree);
        if (hasSprite('oak-broad')) {
          for (const [dx, dy, weight] of [[-.9, -.16, .82], [.85, -.1, .8], [0, .1, 1]]) postOak(ctx, q.x + dx * size, q.y + dy * size, size * weight, seedOf(site.id) + dx * 3);
          return;
        }
        ctx.fillStyle = '#6f8657';
        for (const spot of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(q.x + spot * size * .5, q.y - size * .3, size * .28, 0, Math.PI * 2); ctx.fill(); }
      } });
    }
    // A landing is named only once it stands clear of its neighbour: Groce's camp and Bernardo across the Brazos are a mile
    // and a half apart, and their names lay over each other further out (2026-09-18).
    // A crossing is named as a landing is, the three named crossings of the big rivers (`stage`) as they always were, and a ford
    // the record does not name only close in.
    const crossing = CROSSING_KINDS.includes(site.kind) && site.id !== 'ford' && !site.stage;
    const worthNaming = settlement || distant || ownLand || (camera.scale >= HOMESTEAD_LEGIBLE && (site.id === 'ford' || (crossing ? camera.scale >= (site.claimId?.startsWith('FIC') ? FORD_LEGIBLE : LANDING_LEGIBLE) : camera.named && site.kind !== 'camp' && (!NAMED_CLOSE.includes(site.kind) || camera.scale >= LANDING_LEGIBLE))));
    // A place name goes above its buildings. Below is where the family stands, and a
    // homestead's own name landing on top of four people and an ox is unreadable.
    if (worthNaming) {
      const roof = distant ? 0 : site.id === 'ford' || crossing ? (site.kind === 'ferry' ? camera.figure * 1.6 + 6 : -10) : camera.figure * (settlement ? SIZE.settlementCabin * 1.5 : SIZE.cabin) + 6;
      // A family's own place is "Home". The map was generated when every household was
      // called Family N and it is fetched once a class, so it cannot follow a rename -
      // but nobody calls their own house by its number, and this is the one label that
      // was reading as a leftover once families started having names.
      labels.push({ name: ownLand ? 'Home' : (host && landBySite.get(site.id)?.name) || site.name, x: q.x, y: q.y - Math.max(12, roof) });
    }
  }
  const apart = keptApart(familyHouses, camera.house.one);
  for (const each of apart.kept) standing.push(each.item);
  for (const each of apart.hidden) housesDrawn.delete(each.siteId);
  // Presentation evidence for proofs: the families whose house was left out this frame, being over another's (`keptApart`).
  window.__familyHousesHidden = apart.hidden.map(each => each.siteId);
  // Somebody away on the road is sent no `location` at all (sim/world.mjs `seenTravel`): there is nothing here to draw
  // them at, and nothing to decide - the server already decided.
  const entities = entitiesOf(world).filter(entity => entity.location);
  // Everyone else standing where your family is standing. Drawn plainly, never with a
  // request mark and never with a selection ring that implies you can order them.
  const observed = observedOf(world).filter(entity => entity.location);
  drawnAt.clear();
  seatedDrawn.clear();
  const chosen = selectedEntity(world);
  const pending = [];
  // Six names around one cabin is a smear, not information. Below this size - which a
  // phone at the default framing is - only the principal is named; the rest are reached
  // by clicking them, and the hidden roster still lists every one of them by name.
  const roomForNames = camera.named && camera.figure > 34;
  // What a traveller's schedule needs to know of the frame (`sightOf`).
  const running = world.status === 'running', frozen = reducedMotion.matches || !running;
  const tickMs = window.__snapshot?.tickMs ?? 1000, roads = [];
  // The family's own land, for the stretch of every road that is never sped up and never faded (owner, 2026-09-22). The
  // rectangle the server already sends as the grant's bounds (sim/grants.mjs `landProjection`); the Host and an observed
  // person have none and get none, and a class still on its way in simply has no land to be on yet.
  const bounds = host ? null : world.land?.grant?.bounds;
  ownGrant = bounds && Number.isFinite(bounds.minX)
    ? at => at.x >= bounds.minX && at.x <= bounds.maxX && at.y >= bounds.minY && at.y <= bounds.maxY
    : null;
  const travelMarks = { frozen, running, tickMs, scale: camera.scale, now: frameNow };
  for (const entity of entities) {
    // Where along the road this traveller is *drawn*, which is not where the server has them while the middle of a long
    // journey is being crossed out of sight (`sightOf`). Worked out before the point, because it is the point.
    const sight = sightOf(entity, drawnHeightOf(entity, camera.figure, seatOf(entity, entities)), travelMarks);
    if (sight && sight.alpha < 1) roads.push({ entity, seen: sight });
    const ground = sight?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);
    // The place the figure was really put, beside the place the schedule asked for. Presentation evidence, read by
    // proofs and by nothing in the application: "the schedule says the right thing" and "the page drew the right thing"
    // are two questions, and a proof reading only the first passes a page that draws the figure somewhere else.
    if (sight) sight.painted = ground;
    // Which way someone is facing comes from where they are actually going, so a mirrored
    // ox is reporting the journey the server gave it rather than decorating the scene.
    const destination = entity.travel && world.map?.sites?.[entity.travel.to];
    // Two different invitations, and they must not look like each other: an orange !
    // is something being asked of this family, and a quieter ink mark is somebody
    // standing in front of one of them waiting to be spoken to.
    // Three invitations and they must not look alike: an orange ! is something being
    // asked of this family by somebody outside it, a quiet ink mark is a person standing
    // in front of one of them, and a ? is one of their own waiting on an answer.
    const mark = taskFor(world, entity) ? { list: pending, kind: 'task' }
      : meetingFor(world, entity) ? { list: pending, kind: 'meeting', glyph: '…', tone: '#41556b' }
      : entity.chore?.ask ? { list: pending, kind: 'asking', glyph: '?', tone: '#7a4726' }
      : null;
    // The quarry this person is hunting, where the server put it (sim/chores.mjs `quarryPoint`) and the species it said,
    // facing the way it stands. A class saved before the quarry carried a kind has none, and is a deer as it always was.
    const quarry = entity.chore?.quarry;
    if (quarry) {
      const kind = quarry.kind || 'deer';
      const spot = camera.toScreen(quarry);
      standing.push({ y: spot.y, draw: () => miniQuarry(ctx, spot.x, spot.y, camera.figure * (QUARRY_SIZE[kind] || QUARRY_SIZE.deer), {
        kind, flip: spot.x < point.x, alert: Boolean(entity.chore.ask), seed: entity.id,
      }) });
      window.__quarryDrawn = { id: entity.id, kind, x: spot.x, y: spot.y };
    }
    standing.push({ y: point.y, draw: () => drawEntity(ctx, entity, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark, entities,
      labels, heading: destination ? destination.x - entity.location.x : 0, ground, scale: camera.scale,
      now: frameNow, frozen, running, tickMs, sight,
    }) });
  }
  const margin = camera.figure * 4, shownObserved = [];
  for (const entity of observed) {
    // Everyone on the map, not only the student's own family (owner, 2026-09-22, by multiple choice: "Everyone on the
    // map"): other families' people, riders, couriers and armies' men alike. Somebody else's land is not this family's, so
    // an observed person is scheduled with no land under them (`sightOf` passes none).
    const sight = sightOf(entity, drawnHeightOf(entity, camera.figure, host ? seatOf(entity, []) : null), { ...travelMarks, observed: !host });
    if (sight && sight.alpha < 1) roads.push({ entity, seen: sight });
    const ground = sight?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);
    if (sight) sight.painted = ground;
    // The Host's whole class: only who is on screen is drawn, and each as they truly are - at their own work, the principal
    // in their own coat, the deer they are hunting beside them - because the teacher is not somebody glimpsing a stranger.
    if (host && (point.x < -margin || point.y < -margin || point.x > canvas.width + margin || point.y > canvas.height + margin)) continue;
    if (host && entity.chore?.quarry) {
      const kind = entity.chore.quarry.kind || 'deer';
      const spot = camera.toScreen(entity.chore.quarry);
      standing.push({ y: spot.y, draw: () => miniQuarry(ctx, spot.x, spot.y, camera.figure * (QUARRY_SIZE[kind] || QUARRY_SIZE.deer), { kind, flip: spot.x < point.x, seed: entity.id }) });
    }
    standing.push({ y: point.y, draw: () => drawEntity(ctx, { ...entity, health: { condition: entity.condition } }, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark: null, labels, observed: !host, ground, scale: camera.scale,
      now: frameNow, frozen, running, tickMs, sight,
    }) });
    shownObserved.push(entity.id);
  }
  // The weather in the kept ground, last of everything under the people: the rivers run full and brown over the roads and
  // over the fords they have shut, and the fog's shape is banked along the water in a layer of its own. Both are the kept
  // ground's, so a day that holds costs nothing (public/weather-art.js).
  //
  // Both are drawn from the FADE-FREE weather (`weatherSteady`), which is what `weatherGroundKey` keys on. Anything here
  // that changed with the clock would be drawn once, at the strength of the frame that drew it, and stand stale until the
  // camera moved. That is exactly what the ground audit found (`window.__groundAudit`) when the wet earth was drawn here:
  // a whole-screen difference falling tick by tick as the day came up. The wet earth is now drawn with the veil, on the
  // page's own canvas, every frame.
  if (ground && weather) {
    const courses = weatherCourses(world, camera, canvas);
    const drawn = drawHighWater(ground, courses, course => {
      // The level where this course runs, read at its own middle: a river crossing a region boundary takes what it meets.
      const middle = course.points[Math.floor(course.points.length / 2)];
      return weatherMix(weather, camera.toWorld(middle).x, world.minute, STEADY).water;
    });
    if (!audit) {
      // The fog's shape into a layer of its own, so the veil is one drawImage a frame at the morning's own strength and
      // the ground beneath it is not redrawn every time the hour moves.
      fogBase.canvas ??= document.createElement('canvas');
      if (fogBase.canvas.width !== canvas.width || fogBase.canvas.height !== canvas.height) { fogBase.canvas.width = canvas.width; fogBase.canvas.height = canvas.height; }
      fogBase.shapes = drawFogShape(fogBase.canvas.getContext('2d'), fogBase.canvas, weatherSteady, courses);
      window.__weatherGround = { courses: courses.length, flooded: drawn.drawn, over: drawn.shut, fog: fogBase.shapes, key: weatherGroundKey(weather) };
    }
  } else if (ground && !audit) { fogBase.shapes = 0; window.__weatherGround = null; }
  // The ground goes down whole, and the drawing state it ended in is carried over, as when it was drawn on this canvas.
  if (ground && !audit) mapBase.state = readDrawState(ground);
  if (audit) auditGround(audit, mapBase.canvas, world);
  main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.globalCompositeOperation = 'source-over';
  main.drawImage(mapBase.canvas, 0, 0);
  // The veil: the fog on the bottoms at the strength the hour leaves it, and the shadow a rain cloud lays on the country.
  // Here, and not at the end, on purpose. Everything a student is entitled to see - a person, a house, a marker, a name -
  // is drawn after this line and at full strength, so the fog can never hide a fact. What a family knows is the server's
  // (VISION.md), and fog is scenery.
  if (weatherNow) {
    // The wet, darkened earth belongs here rather than in the kept ground: it comes up with the day, and the ground is
    // drawn only when the day turns. A multiply, so the grass, the track and the field darken together and keep their own
    // colours instead of being greyed out under a flat sheet, and it is over the ground image and under every figure.
    drawWetGround(main, weatherNow, farEmphasis(camera.scale));
    drawWeatherVeil(main, weatherNow, fogBase.shapes ? fogBase.canvas : null, world.minute, farEmphasis(camera.scale));
  }
  applyDrawState(main, mapBase.state);
  standing.sort((a, b) => a.y - b.y);
  for (const item of standing) item.draw();
  drawTravelRoads(ctx, roads, camera, canvas);
  const placeFont = `${Math.round(Math.max(11, Math.min(16, camera.scale * 1.1)))}px system-ui`;
  window.__labelsDrawn = layOutCaptions(ctx, labels, placeFont);
  for (const mark of pending) drawTaskMark(ctx, mark);
  // Who was marked as having somebody waiting on them, and why. Presentation evidence on
  // the same contract as `__viewEntities` and `__drawnAt`: read by proofs and by nothing
  // in the application. It exists because the invitation to listen to a rider is now a
  // mark over a person in the world rather than a card in the corner of the screen, and
  // "is the invitation actually there" is not a question a projection can answer.
  window.__viewMarks = pending.map(mark => ({ id: mark.id, kind: mark.kind }));
  // The armies standing in the country (sim/armies.mjs, public/army-view.js): a camp with its men close up, a marker far
  // off, so a man who joined an army is drawn among an army (owner, 2026-09-17).
  window.__armiesDrawn = (world.armies || []).map(army => {
    const at = camera.toScreen(army);
    // A camp fire in a hard norther: the smoke does not rise, it lies over and streams away, which is Astra's
    // `smoke-streaming` (public/weather-art.js `GALE_SMOKE`). Read at the camp's own place, so a camp in a country the
    // norther has not reached keeps its rising puffs. The camp is drawn on the page's canvas every frame, not into the
    // kept ground, so this one reads the weather with its fade (no `STEADY`) and the smoke goes over as the day comes up.
    const campMix = weather ? weatherMix(weather, army.x, world.minute) : null;
    const how = drawArmy(ctx, army, at, {
      scale: camera.scale, figure: camera.figure, time: animationTime,
      draw: (clip, x, y, size, key, options) => animated(ctx, clip, x, y, size, key, options), mini: miniPerson,
      smoke: campMix && inGale(campMix) ? (x, y, size) => drawSprite(ctx, GALE_SMOKE, x, y, size) : null,
    });
    // The steamboat Yellow Stone on the Brazos at Groce's, in the fortnight of the record's own (sim/houston.mjs
    // `yellowStone`, `HIST-TEX-089`): loading cotton for Captain Ross until the army takes her on April 12, then under way
    // in the middle of the flood with the men, the horses and the wagons on her deck. Where she is and what she is doing
    // are the server's; the page chooses only which delivered pose says it.
    // Under way from 2026-09-21: `steamboat-laden` (docs/ART_DELIVERY_2026-09-21-MUSTANG-YELLOW-STONE.md) is the army
    // crossing - militia with their rifles, a few horses and one wagon on the deck, the paddle turning and a bow wave -
    // and `crossing` is the only thing the server ever says about her beyond `cotton`. The place it gives her is the
    // middle of the water between Groce's and Bernardo, so the pose that matches it is the one under way, not the plank
    // out at a bank: `steamboat-gangplank` is off the map from today and is written down in tests/art-library.test.mjs
    // with that reason. `steamboat-steam`, the empty-deck loop, is written down there too - nothing projects her steaming
    // light, and a return trip invented to have something to draw is not in the record at this hour.
    // ceiling: her drawn height is one number (`SIZE.steamboat`) and each frame is normalised to it, so the hull breathes
    // about a tenth as her smoke column grows - which the moored clip has always done. A `logicalHeight` for the boat
    // sheets in scripts/build-atlas-manifest.mjs is the way out, and would re-measure the accepted moored art with it.
    let boat = null;
    if (army.boat && how === 'camp') {
      const bank = camera.toScreen(army.boat);
      boat = army.boat.state === 'crossing' ? 'steamboat-laden' : 'steamboat-cotton-moored';
      if (!animated(ctx, boat, bank.x, bank.y, camera.figure * SIZE.steamboat, army.id)) boat = null;
    }
    return { id: army.id, side: army.side, ours: army.ours, strength: army.strength, how, boat, x: Math.round(at.x), y: Math.round(at.y) };
  });
  window.__viewFormations = drawFormations(ctx, world.battle, camera.toScreen, camera.named, world.tick, camera.figure);
  canvas.dataset.formationIds = window.__viewFormations.join(' ');
  window.__viewEntities = entities.map(entity => entity.id);
  // Where each figure was actually drawn this frame, and how tall it was drawn, in screen
  // pixels. The same contract as `__viewEntities` and `__animationClips`: presentation
  // evidence, read by proofs and by nothing in the application. It exists because the one
  // question worth asking about motion - how fast does a person cross the screen relative
  // to their own size - cannot be answered from the projection, which only moves once a
  // tick while the figure is drawn every frame between.
  window.__seatedDrawn = Object.fromEntries(seatedDrawn);
  window.__drawnAt = Object.fromEntries([...drawnAt].map(([id, spot]) => [id, { x: spot.x, y: spot.y, size: spot.size }]));
  // Presentation evidence, same contract as __viewEntities: who was drawn because they
  // were seen, kept as a separate list so a proof can tell the two apart.
  // On the Host's map, the ones inside the view.
  window.__viewObserved = shownObserved;
  // The stake goes in over everything else on the ground, so the place being looked at is never hidden under a road or a cow.
  drawSitePick(ctx, world, camera);
  // The air, over everything: the rain actually falling in front of the reader, the dust and leaves a norther drives north
  // to south, a distant storm's lightning, and the colour the light has gone. Thin enough to see the whole country
  // through - it says what the day is, it never hides what is in it (public/weather-art.js).
  if (weatherNow) {
    const layers = drawWeatherAir(ctx, weatherNow, { time: animationTime, scale: camera.scale, still: reducedMotion.matches });
    main.globalAlpha = 1; main.globalCompositeOperation = 'source-over';
    // Presentation evidence, on the same contract as `__viewEntities`: what the weather drew this frame, read by proofs
    // and by nothing in the application. There is no weather text anywhere, so this is the only way to ask.
    window.__weatherDrawn = { spans: weatherNow.length, layers, fog: fogBase.shapes, minute: world.minute, mix: weatherNow.map(span => ({
      x: Math.round(span.x), rain: +span.mix.rain.toFixed(2), storm: +span.mix.storm.toFixed(2), norther: +span.mix.norther.toFixed(2),
      fog: +span.mix.fog.toFixed(2), water: +span.mix.water.toFixed(2), wind: [+span.mix.wind.x.toFixed(2), +span.mix.wind.y.toFixed(2)],
    })) };
  } else window.__weatherDrawn = null;
  const travellers = entities.filter(entity => entity.travel);
  const here = entities.filter(entity => entity.location.siteId).map(entity => `${entity.name} (${entity.task || entity.kind})`);
  // Somebody away on the road is not in `entities` at all - the server sent no position for them (sim/sight.mjs) - so the
  // spoken description reads them off the whole roster, and says they are gone rather than dropping them out of the world.
  const gone = entitiesOf(world).filter(entity => away(entity))
    .map(entity => `${entity.name} is away on the road to ${placeName(world, entity.travel.to)}, about ${entity.travel.miles} miles off, and should be ${entity.travel.back}.`).join(' ');
  const journey = `${travellers.map(entity => `${entity.name} is on the road to ${placeName(world, entity.travel.to)}, about ${Math.round((entity.travel.progress || 0) / (entity.travel.distance || 1) * 100)}% of the way.`).join(' ')}${gone ? ` ${gone}` : ''}`.trim();
  const settled = here.length ? `At ${placeName(world, entities.find(e => e.location.siteId)?.location.siteId)}: ${here.join(', ')}.` : '';
  const met = observed.length
    ? ` Also here: ${observed.map(e => `${e.name}${e.resident ? ` of ${placeName(world, e.location?.siteId)}` : ''}`).join(', ')}.`
    : '';
  const battleText = window.__viewFormations.length ? ` ${world.battle.caption} Miniature groups show the opposing formations.` : '';
  const meeting = world.encounter?.status === 'open'
    ? ` ${entities.find(e => e.id === world.encounter.listenerId)?.name || 'Someone'} has met a rider, who has stopped to speak with them.`
    : '';
  // The Host's whole class is hundreds of names; what is on the screen is said as a count instead.
  const hostText = host ? `The whole class: ${observed.filter(e => e.kind === 'person').length} people, ${shownObserved.length} figures in view, ${observed.filter(e => e.kind === 'person' && e.travel).length} people on the road.` : '';
  // Each only when it changed: this runs on every animation frame (public/map-base.js `setText`).
  const described = host ? `${hostText}${battleText}` : `${settled}${met} ${journey}${meeting}${battleText}`.trim() || 'The world will appear when the class begins.';
  setText($('#world-description'), described);
  const follow = $('#map-nav [data-view=follow]');
  const bexarButton = $('#map-nav [data-view=bexar]'), noBexar = !world.map?.sites?.bexar;
  if (bexarButton.hidden !== noBexar) bexarButton.hidden = noBexar;
  if (follow) {
    setData(follow, 'active', String(camera.following));
    // Naming who is being watched, because a camera that has stopped following the family
    // should say why rather than leaving a student to wonder where everyone went.
    const watched = watchedId ? entities.find(entity => entity.id === watchedId) : null;
    setText(follow, host ? (camera.following ? 'Whole class' : 'Show whole class') : camera.following ? 'Following' : watched ? `Watching ${watched.name}` : 'Follow');
  }
  renderHostGoto(world, landBySite);
  setText($('#map-title'), camera.title);
  setText($('#map-framing'), 'Prototype · fictional families');
  if (canvas.getAttribute('aria-label') !== described) canvas.setAttribute('aria-label', described);
}
/**
 * Where the teacher can go: every family's land and every town, from one list on the Host's map. A student has Land and
 * Gonzales for the two places that are theirs; the Host has no land and the whole class to look at (owner, 2026-09-16).
 */
function renderHostGoto(world, landBySite) {
  const select = $('#host-goto'), land = $('#map-nav [data-view=home]');
  if (!select) return;
  const host = hostView(world);
  select.hidden = !host;
  if (land) land.hidden = host;
  if (!host) return;
  const number = id => Number(String(id).split('-').at(-1)) || 0;
  const families = [...landBySite.values()].sort((a, b) => number(a.householdId) - number(b.householdId))
    .map(land => ({ value: land.homeSiteId, label: land.name }));
  const towns = sitesOf(world).filter(site => site.kind === 'town' || site.id === 'gonzales').sort((a, b) => a.name.localeCompare(b.name))
    .map(site => ({ value: site.id, label: site.name }));
  const shape = JSON.stringify([families, towns]);
  if (select.dataset.shape === shape) return;
  select.dataset.shape = shape;
  const group = (label, entries) => {
    const node = document.createElement('optgroup'); node.label = label;
    node.append(...entries.map(entry => { const option = element('option', entry.label); option.value = entry.value; return option; }));
    return node;
  };
  const prompt = element('option', 'Go to…'); prompt.value = '';
  select.replaceChildren(prompt, group('Families', families), group('Towns', towns));
}
$('#host-goto')?.addEventListener('change', event => {
  const siteId = event.target.value;
  event.target.value = '';
  const site = window.__snapshot?.world.map?.sites?.[siteId];
  // A family's land is framed on where its people stand at home, which is where its house is raised: the land's own
  // point can be a quarter mile off it, out of frame at a student's closest zoom (found merging the map rebuild, 2026-09-16).
  const home = (window.__snapshot.world.others || []).filter(entity => entity.kind === 'person' && entity.location?.siteId === siteId);
  const at = home.length ? { x: home.reduce((sum, e) => sum + e.location.x, 0) / home.length, y: home.reduce((sum, e) => sum + e.location.y, 0) / home.length } : null;
  // A drawn town is framed on the middle of its buildings (the median, so a mission across the river does not pull it off):
  // Anahuac's 1835 town stands half a mile from the map's point (sim/town-layouts.mjs).
  const layout = TOWN_LAYOUTS[siteId], median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const drawnAt = layout && layout.buildings.map(building => townPoint(layout, building));
  const townAt = drawnAt ? { x: site.x + median(drawnAt.map(p => p.x)), y: site.y + median(drawnAt.map(p => p.y)) } : null;
  if (site) applyMapView(siteId, { street: site.kind === 'town', at: site.kind === 'town' ? townAt : at });
});
function renderHousehold(world) {
  const household = world.household;
  if (!household) {
    // The Host's look at somebody stays open and follows them tick by tick (read only, `renderSelection`).
    if (hostView(world)) renderSelection(world); else $('#selection').hidden = true;
    $('#family-panel').hidden = true; hidePanelTip(); $('#food').textContent = ''; $('#supplies').textContent = ''; return;
  }
  $('#family-title').textContent = headingCase(familyCache?.name || 'Your family');
  renderFamilyBook();
  renderSurname();
  $('#food').textContent = `Food ${Number(household.resources?.food || 0).toFixed(1)}`;
  // Seed, the field and the hoe are the three things that run out. They sit on the map
  // as one quiet line, because a student needs to notice them without being told to.
  const field = household.field, hoe = world.toolCondition?.hoe;
  const supplies = [`Seed ${Number(household.resources?.seed || 0).toFixed(0)}`];
  // Powder and cotton are shown only when a family has some. Powder because a house that
  // has run out needs to know before it sends somebody hunting; cotton because a corn
  // family never has any and a line reading "Cotton 0" all afternoon is furniture.
  const powder = Number(household.resources?.powder || 0);
  supplies.push(`Powder ${powder.toFixed(0)}`);
  const cotton = Number(household.resources?.cotton || 0);
  if (cotton > 0) supplies.push(`Cotton ${cotton.toFixed(0)}`);
  // Coin is always shown, including none: it is scarce, and it is half of how a family ends.
  const coin = Number(household.resources?.money || 0);
  supplies.push(coin === 1 ? '1 real' : `${coin} reales`);
  if (field) supplies.push(field.state === 'ripe' ? `${field.crop} ready` : field.state === 'planted' ? `${field.crop} growing` : 'field bare');
  if (hoe?.state === 'worn') supplies.push('hoe worn out');
  if (household.load && household.tools?.hoe === undefined) supplies.push('no hoe');
  // Water, where it is carried from far off (sim/homesite.mjs): said while it slows the family, and gone once there is a well.
  const site = world.land?.site;
  if (site?.needsWell && !site.well) supplies.push(site.water ? `water carried ${site.waterMiles} mi` : 'no running water near');
  if (site?.well) supplies.push('well');
  // Logs: at the house, and still lying where they were felled (sim/felling.mjs). Said once there are any.
  const logs = world.land?.logs;
  if (logs) {
    const piled = logs.wall + logs.sill + logs.poor;
    supplies.push(`logs ${piled} at the house${logs.lying ? `, ${logs.lying} lying out` : ''}`);
  }
  $('#supplies').textContent = supplies.join(' · ');
  $('#supplies').dataset.urgent = String(field?.state === 'ripe' || hoe?.state === 'worn');
  const people = entitiesOf(world).filter(entity => entity.kind === 'person' && (household.members || []).includes(entity.id))
    .sort((a, b) => Number(b.id === household.principalId) - Number(a.id === household.principalId));
  // The roster is a text equivalent and a second way in: the canvas is never the only channel.
  $('#family').replaceChildren(...people.map(entity => {
    const li = element('li', ''); li.dataset.entityId = entity.id;
    if (entity.id === household.principalId) li.dataset.principal = 'true';
    if (taskFor(world, entity)) li.dataset.task = 'available';
    // The second way in to a conversation, and the one that works without the canvas.
    const meeting = meetingFor(world, entity);
    if (meeting) li.dataset.task = 'meeting';
    const button = element('button', `${entity.name}: ${entity.task || 'resting'}, ${entity.travel ? `${away(entity) ? 'away ' : ''}on the road to ${placeName(world, entity.travel.to)}` : placeName(world, entity.location?.siteId)}, ${entity.health?.condition || 'well'}${taskFor(world, entity) ? '. Someone is asking for help.' : ''}${meeting ? '. A rider has stopped to speak with them.' : ''}${entity.chore?.ask ? '. Waiting on your word.' : ''}`);
    button.dataset.select = entity.id;
    li.append(button); return li;
  }));
  // Anyone standing with one of this family. This list is not decoration: selecting a
  // neighbour is how a trade is offered, and until it existed the only way to reach one
  // was to click them on the canvas - which broke the rule that the map is never the sole
  // channel for an action. The server decided who is on it; the client never widens it.
  const others = observedOf(world);
  $('#others').replaceChildren(...others.map(entity => {
    const li = element('li', ''); li.dataset.entityId = entity.id;
    const who = entity.resident ? `of ${placeName(world, entity.location?.siteId)}${entity.about ? `, who ${entity.about}` : ''}` : entity.household ? `of ${entity.household}` : 'passing through';
    const button = element('button', `${entity.name}, ${who}: ${entity.task || 'here'} at ${placeName(world, entity.location?.siteId)}, ${entity.condition || 'well'}`);
    button.dataset.select = entity.id;
    li.append(button); return li;
  }));
  $('#others-empty').hidden = others.length > 0;
  $('#others-empty').textContent = 'Nobody outside your family is standing with them.';
  const property = entitiesOf(world).filter(entity => entity.kind !== 'person' && (entity.householdId === household.id || (household.property || []).includes(entity.id)));
  // The land is the first thing on the list of what this family has, because it is the
  // thing they can change and the thing they would have to leave.
  const land = world.land;
  const houseName = id => (houseCatalogue?.get(id)?.name || 'house').toLowerCase();
  const inHundred = share => partsIn100(share);
  // The house, in the server's numbers (sim/houses.mjs, FIC-GONZ-008): going up, or lived in and what it does.
  const houseWords = !land ? '' : land.home
    ? ` They live in a ${houseName(land.house.layout)}: rest there mends ${inHundred(land.home.restShare)} in 100 of the usual, and ${inHundred(land.home.spoilagePerDay)} in 100 of the food spoil each day.${land.home.crowded ? ' It is crowded: more of the family sleep in it than it holds, and they rest the worse for it.' : ''}`
    : land.house
    ? land.house.work > 0
      ? ` They are building a ${houseName(land.house.layout)}: ${land.house.stage}, ${land.house.work} of ${land.house.total} hours of work done.`
      : ` They mean to build a ${houseName(land.house.layout)}, and nobody has started on it.`
    : '';
  const ground = land ? [(() => {
    // What the camp costs is said in numbers, from the server's own (FIC-GONZ-008).
    const camp = (land.camp ? ` There is no house yet, so they camp by the wagon: rest there mends ${Math.round(land.camp.restShare * 100)} parts in 100 of what it would under a roof, and ${Math.round(land.camp.spoilagePerDay * 100)} parts in 100 of the food spoil each day.` : '') + houseWords;
    // The field in plots, from the server's own count (sim/fields.mjs): cleared, fenced, and staked waiting to be cleared.
    const plots = land.plots || [], staked = plots.filter(plot => plot.state === 'staked').length;
    const fieldWords = `${land.cleared ? `${land.cleared * 10} acres cleared in ${land.cleared === 1 ? 'one plot' : `${land.cleared} plots`}, ${land.fenced === land.cleared ? (land.cleared === 1 ? 'fenced' : 'all fenced') : land.fenced ? `${land.fenced} fenced` : 'no fence round any of it'}` : 'no ground cleared'}${staked ? `; ${staked === 1 ? 'one more plot' : `${staked} more plots`} staked out to clear` : ''}.`;
    const li = element('li', land.arriving
      ? `Their land: they are still on the road in with the wagon.${camp}`
      : land.cabin === 'ruined'
      ? `Their land: the cabin is gone. ${fieldWords}`
      : `Their land: ${fieldWords}${camp}`);
    li.dataset.land = 'true';
    li.dataset.cleared = String(land.cleared);
    li.dataset.fenced = String(land.fenced ?? 0);
    li.dataset.shelter = land.shelter || 'house';
    return li;
  })()] : [];
  // The land marked out for them, in the same words the story used when they reached it.
  if (land?.grant) {
    const holding = land.grant;
    const li = element('li', holding.kind === 'labor'
      ? `A labor of land, ${holding.acres} acres, is marked out for the family. No title has been issued.`
      : `A league and a labor of land, ${holding.acres.toLocaleString('en-US')} acres, is marked out for the family. No title has been issued.`);
    li.dataset.grant = holding.kind;
    ground.push(li);
  }
  // What the wagon brought that is not a store: the tools and the belongings, named from the
  // catalogue. The stores are on the supplies line already.
  const names = new Map((wagonCatalogue?.items || []).map(item => [item.id, item.name.toLowerCase()]));
  const brought = household.load ? [...Object.keys(household.tools || {}), ...(household.belongings || [])].map(id => names.get(id) || id) : [];
  const cargo = household.load ? [element('li', brought.length ? `Brought in the wagon: ${brought.join(', ')}.` : 'Brought in the wagon: no tools and no belongings, only stores.')] : [];
  if (cargo[0]) cargo[0].dataset.brought = 'true';
  // The family's furniture (sim/furniture.mjs), made or bought. Drawn in the house once the interior view exists (SETTLING_IN step 7).
  const pieces = Object.entries(household.furniture || {});
  const furnished = pieces.length ? [element('li', `Furniture: ${pieces.map(([piece, how]) => `${piece} (${how})`).join(', ')}.`)] : [];
  if (furnished[0]) furnished[0].dataset.furniture = 'true';
  $('#property').replaceChildren(...ground, ...cargo, ...furnished, ...property.map(entity => { const li = element('li', `${entity.name}: ${entity.kind} at ${placeName(world, entity.location?.siteId)}`); li.dataset.entityId = entity.id; return li; }));
  const memory = world.events || [];
  $('#event-log').replaceChildren(...memory.slice(-12).reverse().map(event => { const li = element('li', `${event.text || event.type} (${timeLabel(event.minute ?? 0)} into the story)`); li.dataset.eventId = event.id; return li; }));
  renderFamilyPanel(world);
  renderCallMenu(world);
  errandPopup.render(world);
  goingPopup.render(world);
  renderSelection(world);
}
// Instructions live beside the person they concern, anchored to where they stand.
// The farm work this person can be sent on. The list, what each costs, and the reason
// for anything refused all come from the server: the client renders that answer and
// never works out for itself what is possible.
// A trade is face to face, so its controls exist only where the two people are: select
// the neighbour standing beside your family and the offer is there. Nothing here decides
// what is allowed - an impossible offer is refused by the server, in its own words, and
// those words are what the student reads.
// What can be traded, taken from the catalogue the server sends rather than written out
// again here. It was written out again here, and the two were already different orders of
// the same two words - a drift that would have quietly hidden a third good the day one
// was added. The literal is a fallback for a page that has not fetched the catalogue yet.
let TRADE_GOODS = ['seed', 'food'];
function goodSelect(id, initial) {
  const select = element('select');
  select.id = id;
  select.append(...TRADE_GOODS.map(good => {
    const option = element('option', good === 'money' ? 'reales' : good); option.value = good;
    if (good === initial) option.selected = true;
    return option;
  }));
  return select;
}
function amountInput(id, initial) {
  const input = document.createElement('input');
  input.id = id; input.type = 'number'; input.min = '1'; input.max = '20'; input.step = '1'; input.value = String(initial);
  input.setAttribute('aria-label', id === 'trade-give-amount' ? 'How much to give' : 'How much to ask for');
  return input;
}
function describeGoods(amounts) {
  return TRADE_GOODS.filter(good => amounts?.[good]).map(good => `${amounts[good]} ${good === 'money' ? (amounts[good] === 1 ? 'real' : 'reales') : good}`).join(' and ');
}
// Authoritative updates can change which controls are available while someone is typing.
// Keep an unfinished offer and its focus when the same neighbour remains selected.
function rememberControls(panel) {
  const values = new Map([...panel.querySelectorAll('input[id],select[id],textarea[id]')].map(control => [control.id, control.value]));
  const active = document.activeElement;
  const focus = panel.contains(active) ? { id: active.id, tag: active.tagName, data: { ...active.dataset }, start: active.selectionStart, end: active.selectionEnd } : null;
  return () => {
    for (const control of panel.querySelectorAll('input[id],select[id],textarea[id]')) {
      const value = values.get(control.id);
      if (value !== undefined && (control.tagName !== 'SELECT' || [...control.options].some(option => option.value === value))) control.value = value;
    }
    if (!focus) return;
    const control = [...panel.querySelectorAll('input,select,textarea,button')].find(candidate => focus.id
      ? candidate.id === focus.id
      : candidate.tagName === focus.tag && JSON.stringify({ ...candidate.dataset }) === JSON.stringify(focus.data));
    if (!control || control.disabled) return;
    control.focus({ preventScroll: true });
    if (Number.isInteger(focus.start) && typeof control.setSelectionRange === 'function') control.setSelectionRange(focus.start, focus.end);
  };
}
let renderedTrade = null, renderedWork = null;
function renderTrade(world, chosen, running) {
  const panel = $('#selection-trade');
  const key = JSON.stringify([world.role, world.householdId, running,
    [chosen.id, chosen.name, chosen.householdId, chosen.household, chosen.observed, chosen.resident, chosen.location?.siteId],
    (world.offers || []).filter(offer => offer.ourEntityId === chosen.id || offer.theirEntityId === chosen.id),
    (world.entities || []).filter(entity => entity.kind === 'person').map(entity => [entity.id, entity.name, entity.principal, entity.location?.siteId, Boolean(entity.travel), entity.health?.condition])]);
  if (renderedTrade?.key === key) return;
  const restore = renderedTrade?.chosenId === chosen.id ? rememberControls(panel) : () => {};
  populateTrade(world, chosen, running);
  restore();
  renderedTrade = { key, chosenId: chosen.id };
}
function populateTrade(world, chosen, running) {
  const panel = $('#selection-trade');
  panel.replaceChildren();
  if (world.role === 'host' || !world.household) return;
  const offers = world.offers || [];
  const involved = offers.filter(offer => offer.ourEntityId === chosen.id || offer.theirEntityId === chosen.id);

  for (const offer of involved) {
    const card = element('div', null, 'trade-pending');
    const received = offer.direction === 'received';
    const them = offer.theirHousehold ? `${offer.theirName} of ${offer.theirHousehold}` : offer.theirName;
    card.append(element('p', received
      ? `${them} offers ${describeGoods(offer.weGet)} for ${describeGoods(offer.weGive)}.`
      : `${offer.ourName} has offered ${describeGoods(offer.weGive)} to ${them} for ${describeGoods(offer.weGet)}.`, 'trade-note'));
    const answer = element('div', null, 'trade-answer');
    for (const [action, label] of received ? [['accept-offer', 'Accept'], ['decline-offer', 'No thank you']] : [['withdraw-offer', 'Take the offer back']]) {
      const button = element('button', label);
      button.dataset.action = action;
      button.dataset.offerId = offer.id;
      button.dataset.entityId = offer.ourEntityId;
      button.disabled = !running;
      answer.append(button);
    }
    card.append(answer);
    panel.append(card);
  }

  // Somebody else's person. A resident of Gonzales trades at the counter instead, and a
  // rider carrying a message is not trading at all.
  if (!chosen.observed || !chosen.householdId || chosen.resident) return;
  if (involved.length) return;
  const here = (world.entities || []).filter(entity => entity.kind === 'person' && !entity.travel
    && entity.location?.siteId && entity.location.siteId === chosen.location?.siteId
    && !['dead', 'captured'].includes(entity.health?.condition));
  if (!here.length) return;
  const themNamed = chosen.household ? `${chosen.name} of ${chosen.household}` : chosen.name;
  panel.append(element('p', `Offer ${themNamed} a trade.`, 'trade-note'));
  const who = element('select'); who.id = 'trade-from'; who.setAttribute('aria-label', 'Which of your family makes the offer');
  who.append(...here.map(entity => {
    const option = element('option', entity.name); option.value = entity.id;
    if (entity.principal) option.selected = true;
    return option;
  }));
  const give = element('div', null, 'trade-line');
  give.append(element('span', 'We give'), amountInput('trade-give-amount', 2), goodSelect('trade-give-good', 'seed'));
  const ask = element('div', null, 'trade-line');
  ask.append(element('span', 'for'), amountInput('trade-ask-amount', 3), goodSelect('trade-ask-good', 'food'));
  const send = element('button', `Offer it to ${themNamed}`);
  send.dataset.action = 'offer';
  send.dataset.toEntityId = chosen.id;
  send.className = 'trade-offer';
  send.disabled = !running;
  const line = element('div', null, 'trade-line');
  line.append(element('span', 'Asked by'), who);
  panel.append(line, give, ask, send);
}
/**
 * Three stamps saying how this person would set out, and the plain reason for any that
 * are shut - "Mateo has the ox", "The ford is no place for a wagon".
 *
 * A way that has become impossible since it was last pressed falls back to going on foot
 * rather than sitting selected and refusing: walking is always possible, so the control
 * can never be left in a state that cannot be acted on.
 */
/**
 * A call put to one of your family by somebody outside it.
 *
 * The same control a chore's question uses, and that is the point of it. These used to be
 * four hard-coded buttons whose prices were assembled here - "Go upriver to the camp" with
 * the risk glued on with a dot - which taught a student nothing they could carry to the
 * next decision. Now both kinds of decision are a line of text and answers that each say
 * what they would cost, so the small one rehearses the large one without ever saying so.
 */
/**
 * The family's flight east (sim/scrape.mjs, docs/COLONIES.md §7g): told to leave, the main person's card takes the decision -
 * what goes in the wagon, within the room it has, and where the family makes for. Leaving is asked twice, because the farm
 * burns behind them. Once gone, the card says where the family is on the road.
 */
let flightFormKey = '';
function renderFlight(world, chosen, running) {
  const wrap = $('#selection-flight');
  const flight = world.flight;
  const main = world.household?.mainId || world.household?.principalId;
  if (!flight || world.role === 'host' || chosen.id !== main) { wrap.hidden = true; wrap.replaceChildren(); flightFormKey = ''; return; }
  wrap.hidden = false;
  if (!['ordered', 'stayed'].includes(flight.status)) {
    // On the road (sim/road.mjs, docs/ROAD_EAST.md): where the family is, the weather, the mud, the camp, the danger - and
    // the road's question with its answers and their prices, in the shape every question here takes.
    const where = { fled: `The family is on the road east for ${flight.refugeName}${flight.mode === 'foot' ? ', on foot' : ''}${flight.waitingAt ? `, waiting to get over at ${flight.waitingAt}` : ''}.`, refuged: `The family is camped at ${flight.refugeName} with the other families from the west.`, returning: 'The family is on the road home.', home: 'The family is home, to what is left.' }[flight.status] || '';
    const road = [
      flight.weather === 'rain' && ['fled', 'refuged'].includes(flight.status) ? 'It is raining.' : '',
      flight.bogged ? (flight.bogged.freeing ? 'The wagon is being dug out of the mud.' : flight.bogged.waiting ? 'The wagon is fast in the mud; the family waits for the ground to dry.' : 'The wagon is fast in the mud.') : '',
      flight.oxSpent ? 'The ox is spent and goes at half pace.' : '',
      flight.camp ? `The family has halted: ${flight.camp.toLowerCase()}.` : '',
      // Said once: while the warning is the open question, its own words carry the miles.
      flight.danger && flight.ask?.id !== 'danger' ? `${flight.danger.name} is about ${flight.danger.miles} miles off, making for ${flight.danger.towardName}.` : '',
      flight.overtaken ? 'The Mexican army has come up with the family and taken what it had.' : '',
    ].filter(Boolean).join(' ');
    const said = JSON.stringify([where, road, flight.ask?.openedMinute ?? null, (flight.ask?.options || []).map(option => [option.id, option.can]), running]);
    if (wrap.dataset.said !== said) {
      wrap.replaceChildren(element('p', where, 'ask-text'));
      if (road) wrap.append(element('p', road, 'work-note'));
      if (flight.ask) {
        wrap.append(element('p', flight.ask.text, 'ask-text'));
        for (const option of flight.ask.options) {
          const button = element('button', '', 'work-option ask-option-work');
          button.dataset.action = 'road-answer'; button.dataset.option = option.id; button.dataset.entityId = chosen.id;
          const open = option.can !== false;
          button.disabled = !running || !open;
          if (!open) button.title = option.why;
          button.append(element('span', option.label, 'work-name'), element('span', open ? option.note : option.why, 'work-note'));
          wrap.append(button);
        }
      }
      wrap.dataset.said = said;
    }
    flightFormKey = '';
    return;
  }
  const key = JSON.stringify([flight.room, flight.mode, flight.have, flight.refuges, flight.burned, flight.decidedToStay, running]);
  if (flightFormKey === key) return;
  flightFormKey = key;
  wrap.replaceChildren();
  wrap.append(element('p', flight.burned ? 'The army has passed and burned the farm. The family can still go east with what it can carry.'
    : flight.decidedToStay ? 'The family is staying, and takes what comes. The road east is still open if it changes its mind.'
    : 'The family has been told to leave for the east. Load what the wagon will carry and go; what is left will be burned. Answer within the day, or the family packs what it can and goes by itself.', 'ask-text'));
  const carrier = flight.vehicle === 'cart' ? ' in the cart' : flight.wagons ? ` in the ${flight.wagons} wagons` : ' in the wagon';
  wrap.append(element('p', `Room for ${flight.room}${flight.mode === 'wagon' ? carrier : ', carried on foot'}. Food takes ${flight.space.food} each, seed ${flight.space.seed}, cotton ${flight.space.cotton}, powder ${flight.space.powder}.`, 'work-note'));
  const form = element('div', '', 'flight-form');
  for (const good of Object.keys(flight.space)) {
    const label = element('label', '', 'flight-take');
    label.append(element('span', `${good} (${flight.have[good]} in the house)`));
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = String(flight.have[good]); input.step = '1'; input.value = '0';
    input.dataset.take = good; input.className = 'flight-amount';
    label.append(input);
    form.append(label);
  }
  const room = element('p', '', 'work-note'); room.id = 'flight-room';
  const refuge = document.createElement('select'); refuge.id = 'flight-refuge';
  for (const option of flight.refuges) { const choice = element('option', `${option.name} · about ${option.miles} miles`); choice.value = option.id; refuge.append(choice); }
  const go = element('button', 'Leave for the east', 'work-stop');
  go.dataset.action = 'flee'; go.dataset.entityId = chosen.id; go.disabled = !running;
  const tally = () => {
    const used = [...form.querySelectorAll('.flight-amount')].reduce((sum, input) => sum + (Number(input.value) || 0) * flight.space[input.dataset.take], 0);
    room.textContent = `Loaded ${Math.round(used * 100) / 100} of ${flight.room}.`;
    room.dataset.over = String(used > flight.room + 1e-9);
  };
  form.addEventListener('input', tally); tally();
  wrap.append(form, room, element('label', 'Make for', 'flight-where'), refuge, go);
  // Refusing to go is an answer of its own (sim/scrape.mjs `stayHome`), offered only while the order stands unanswered.
  if (flight.status === 'ordered') {
    const stay = element('button', 'Stay, and take the risk', 'work-stop');
    stay.dataset.action = 'flight-stay'; stay.dataset.entityId = chosen.id; stay.disabled = !running;
    wrap.append(stay);
  }
}
function renderCall(world, chosen, running) {
  const wrap = $('#selection-call');
  const request = taskFor(world, chosen);
  const options = request?.status === 'open' ? request.options : null;
  if (!options?.length || chosen.observed || world.role === 'host') { wrap.hidden = true; wrap.replaceChildren(); return; }
  wrap.hidden = false;
  wrap.replaceChildren(element('p', request.text, 'ask-text'), ...options.map(option => {
    const button = element('button', '', 'work-option ask-option-work');
    button.dataset.action = option.id;
    // Whether this answer is open, and the reason it is not, are the server's to say.
    button.disabled = !running || !option.can;
    if (!option.can) button.title = option.why;
    button.append(element('span', option.label, 'work-name'));
    button.append(element('span', option.can ? option.note : option.why, 'work-note'));
    return button;
  }));
}
/**
 * The one thing a family can do about somebody who is away with the army (sim/army.mjs).
 *
 * Shown against the person themselves, where everything else about them is shown, rather than in
 * a panel of its own: they are still one of this family's people, and what is offered is the same
 * shape as every other thing a student may tell somebody to do.
 */
function renderArmyControl(world, chosen, running) {
  const wrap = $('#selection-army');
  const ours = world.army?.ours?.find(one => one.id === chosen.id);
  if (!ours || world.role === 'host') { wrap.hidden = true; wrap.replaceChildren(); return; }
  wrap.hidden = false;
  const where = world.army.at === 'on the road' ? 'on the road for Béxar' : `with the army at ${world.army.at}`;
  const option = (action, name, note) => {
    const button = element('button', '', 'work-option ask-option-work');
    button.dataset.action = action;
    button.dataset.entityId = chosen.id;
    button.disabled = !running;
    button.append(element('span', name, 'work-name'), element('span', note, 'work-note'));
    return button;
  };
  const said = [element('p', `${ours.name} is ${where}, ${world.army.miles} miles from your land.`, 'ask-text')];
  // Bowie and Fannin's division, October 22 (sim/army.mjs). The question is the army's, in the family's hands, and it says
  // nothing about what either answer risks: the risk is hidden, as the owner decided (docs/COLONIES.md §7a).
  if (ours.detachment === 'open') {
    said.push(element('p', `Bowie and Fannin are taking a division ahead to the missions. Does ${ours.name} go with them?`, 'ask-text'),
      option('detachment-go', `${ours.name} goes ahead with Bowie and Fannin`, 'With the division, ahead of the army.'),
      option('detachment-stay', `${ours.name} stays with the main army`, 'With the main body, under Austin.'));
  } else if (ours.detachment === 'go') said.push(element('p', `${ours.name} is with Bowie and Fannin's division.`, 'ask-text'));
  // The army's November questions: the storm order, the pledge, the Grass Fight (sim/army.mjs `ARMY_QUESTIONS`). The
  // words are the server's; asked of this person alone, and nothing on the card says what an answer risks.
  for (const question of ours.questions || []) {
    if (question.answer !== 'open') { said.push(element('p', question.said, 'ask-text')); continue; }
    const yes = option('army-answer', question.yes, ''), no = option('army-answer', question.no, '');
    yes.dataset.question = no.dataset.question = question.key;
    yes.dataset.answer = 'yes'; no.dataset.answer = 'no';
    said.push(element('p', question.ask, 'ask-text'), yes, no);
  }
  said.push(option('send-for', `Send for ${ours.name}`, 'They leave the ranks and start home. Whatever the army does next happens without them.'));
  wrap.replaceChildren(...said);
}
function renderWork(world, chosen, running) {
  const panel = $('#selection-work');
  const key = JSON.stringify([chosen.id, running, chosen.service?.status ?? null, chosen.service?.besieged ?? null, chosen.service?.riding ?? null, chosen.service?.courier ?? null, chosen.service?.leave ?? null, chosen.service?.road ?? null, chosen.service?.drilled ?? null, Boolean(chosen.travel), world.land, chosen.health?.condition, Boolean(chosen.chore), chosen.chore?.ask?.openedMinute ?? null,
    (world.work?.[chosen.id] || []).map(entry => ({ ...choreCache?.get(entry.id), ...entry }))]);
  if (renderedWork?.key === key) return;
  const restore = renderedWork?.chosenId === chosen.id ? rememberControls(panel) : () => {};
  populateWork(world, chosen, running);
  restore();
  renderedWork = { key, chosenId: chosen.id };
}
function populateWork(world, chosen, running) {
  const host = $('#selection-work');
  host.replaceChildren();
  // Work that has stopped to ask something. It takes the whole panel, because a question
  // put to somebody standing in a wood is the only thing worth saying about them while
  // they are standing there - and because the list of other jobs is not an answer to it.
  if (chosen.chore?.ask) {
    const ask = chosen.chore.ask;
    host.append(element('p', ask.text, 'ask-text'));
    for (const option of ask.options) {
      const button = element('button', '', 'work-option ask-option-work');
      button.dataset.action = 'answer-chore';
      button.dataset.option = option.id;
      // `can` is false when the world would refuse this answer now - there is no powder in
      // the house, say. The price beside it was quoted when the question was asked and does
      // not move; whether the answer is open is live. Both come from the server.
      const open = option.can !== false;
      button.disabled = !running || !open;
      if (!open) button.title = option.why;
      button.append(element('span', option.label, 'work-name'));
      // What this answer costs, in the person's own terms, before it is pressed. The same
      // rule the march upriver follows: a control that does not say what it will do is
      // worse than no control.
      button.append(element('span', open ? option.note : option.why, 'work-note'));
      host.append(button);
    }
    const stop = element('button', 'Call off the work');
    stop.dataset.action = 'stop-chore';
    stop.className = 'work-stop';
    stop.disabled = !running;
    host.append(stop);
    return;
  }
  // Somebody with the army, the garrison or the expedition (sim/winter.mjs): where they are, what it promised, and sending for
  // them, asked twice because a regular who leaves has deserted and an auxiliary loses the land.
  if (chosen.service?.status === 'serving') {
    const where = world.map?.sites?.[chosen.service.siteId]?.name || chosen.service.siteId;
    const what = { regular: 'the regular army', 'auxiliary-war': 'the auxiliary volunteers, for the war', 'auxiliary-year': 'the auxiliary volunteers, for a year', garrison: 'the garrison', matamoros: 'the Matamoros expedition', relief: 'the men going in to the Alamo', fannin: 'Fannin\'s command', houston: 'General Houston\'s army' }[chosen.service.kind];
    // A man with Houston (sim/camp.mjs): how many days he has drilled is on the card, since it counts when the army fights.
    const drilled = chosen.service.kind === 'houston' ? chosen.service.drilled ? `, drilled ${chosen.service.drilled} ${chosen.service.drilled === 1 ? 'day' : 'days'}${chosen.service.drilled >= 3 ? ' and steady in the line' : ''}` : ', not yet drilled' : '';
    host.append(element('p', chosen.service.besieged ? `${chosen.name} is shut in the Alamo with the garrison.` : chosen.service.riding ? `${chosen.name} has ridden for the Alamo with the Gonzales men.` : `${chosen.name} is with ${what} at ${where}${chosen.service.acres ? `, on the promise of ${chosen.service.acres} acres` : ''}${drilled}.`, 'ask-text'));
    // The army's questions to a man with Houston (sim/camp.mjs `CAMP_QUESTIONS`): the words are the server's own, from the
    // record; the card says what leaving costs the family and nothing of what staying risks (docs/COLONIES.md §7a).
    for (const [question, ask, yes, no, note] of [
      ['leave', `Word has come that Fannin's whole command is taken on the prairie. Many of the men are leaving the army to see to their families. Does ${chosen.name} go home?`, `${chosen.name} leaves for home`, `${chosen.name} stays with the army`,
        chosen.service.bound ? 'A regular who leaves has deserted: the family loses the glory of enlisting twice over, and they will not be taken again.' : chosen.service.acres ? 'They start home at once, and the promise of land goes with it.' : 'They start home at once. Whatever the army does next happens without them.'],
      ['road', `The army has come to a fork of the road: the left-hand road goes to Nacogdoches and safety, the right to Harrisburg and the enemy. The men are shouting which. What does ${chosen.name} call for?`, `${chosen.name} calls for the right-hand road, to Harrisburg`, `${chosen.name} would take the left-hand road, for Nacogdoches`, 'The army takes the road the most of the men shout for.'],
    ]) {
      if (chosen.service[question] !== 'open') continue;
      host.append(element('p', ask, 'ask-text'));
      for (const [answer, label, words] of [['yes', yes, note], ['no', no, '']]) {
        const button = element('button', '', 'work-option ask-option-work');
        button.dataset.action = 'houston-answer'; button.dataset.question = question; button.dataset.answer = answer; button.dataset.entityId = chosen.id;
        button.disabled = !running;
        button.append(element('span', label, 'work-name'), element('span', words, 'work-note'));
        host.append(button);
      }
    }
    // Travis's runner still crossing the plaza to them (sim/alamo-runner.mjs): the question is his to bring.
    if (chosen.service.courier === 'coming') host.append(element('p', `One of the garrison is coming across the plaza from Colonel Travis's quarters to speak with ${chosen.name}.`, 'work-note'));
    // Travis asking for riders (sim/alamo.mjs): volunteering is no promise of being chosen.
    if (chosen.service.courier === 'open') {
      host.append(element('p', 'Travis wants riders to carry his letters out through the Mexican lines. He will choose among those who offer.', 'work-note'));
      for (const [answer, label] of [['volunteer', 'Offer to ride out with the letters'], ['stay', 'Stay inside the walls']]) {
        const button = element('button', '', 'work-option ask-option-work');
        button.dataset.action = 'alamo-courier'; button.dataset.question = 'courier'; button.dataset.answer = answer; button.dataset.entityId = chosen.id;
        button.disabled = !running;
        button.append(element('span', label, 'work-name'));
        host.append(button);
      }
    }
    if (chosen.service.besieged || chosen.service.riding) return;
    const recall = element('button', 'Send for them to come home', 'work-stop');
    recall.dataset.action = 'winter-recall';
    recall.dataset.entityId = chosen.id;
    recall.disabled = !running || Boolean(chosen.travel);
    host.append(recall);
    host.append(element('p', chosen.service.kind === 'regular' ? 'A regular who leaves has deserted: the family loses glory, and they will not be taken again.' : chosen.service.acres ? 'The promise of land is lost.' : 'They start home at once.', 'work-note'));
    // The chance to leave Béxar, said before it closes (sim/alamo.mjs `warnGarrison`, docs/ALAMO_FATES.md).
    if (chosen.service.kind === 'garrison') host.append(element('p', 'If the Mexican army comes to Béxar, the garrison will be shut in, and nobody can be sent for then.', 'work-note'));
  }
  // Everything else a person can be set to - the work, the principal's journeys, work and rest, calling off - is an icon on
  // their row of the family panel (docs/FAMILY_PANEL.md), not a list on this card.
}
/**
 * The family panel (docs/FAMILY_PANEL.md, owner 2026-09-15): a row per person down the left of the map.
 *
 * Rows are kept per person and changed in place, never rebuilt on a tick: a name being typed is never replaced under the
 * student's fingers, and an icon being hovered or focused stays the same button, keeping its focus and its popup, while what
 * it says changes. Every rule here is the projection's; public/family-panel.js orders, words and draws it.
 */
const panelRows = new Map();
let panelExpanded = null, panelTipFor = null;
function renderFamilyPanel(world) {
  const panel = $('#family-panel'), list = $('#family-rows');
  const household = world.household;
  // No rows before the die is rolled, for the reason the card waits too: setting one of the founding four to work would use
  // up the family's roll on people it is about to replace. Nor before the family's book has arrived, which is what says
  // whether it has been rolled and who is father, mother and child - a panel drawn before it showed the founding four for a
  // moment (found by scripts/family-panel-browser-proof.mjs). And the Host has no family.
  if (!household || world.role === 'host' || !familyCache || familyCache.canRoll || rollState === 'rolling') { panel.hidden = true; hidePanelTip(); return; }
  panel.hidden = false;
  const people = entitiesOf(world).filter(entity => entity.kind === 'person' && (household.members || []).includes(entity.id));
  const byId = new Map(people.map(entity => [entity.id, entity]));
  const book = new Map((familyCache?.people || []).map(person => [person.id, person]));
  const order = panelOrder(household.members.filter(id => byId.has(id)), familyCache.people);
  const settable = world.status === 'running' || world.status === 'lobby';
  const homeId = homeOf(world);
  const homesteads = sitesOf(world).filter(site => site.kind === 'homestead' && site.id !== homeId).map(site => site.id);
  // The main person: the server's `mainId` (the principal until one is chosen), checked against the rows (docs/FAMILY_PANEL.md §11.3).
  focusedId = focusFor(household.mainId, { order, principalId: household.principalId, entities: people });
  if (!panelExpanded || !byId.has(panelExpanded)) panelExpanded = focusedId || order[0] || null;
  const land = world.land;
  const house = Boolean(land?.interior?.kind);
  const army = new Set((world.army?.ours || []).map(one => one.id));
  // The guided start, as the server sent it this tick (public/lesson.js). Absent when there is no lesson, and then nothing
  // below shuts anything: the panel is exactly what it was.
  const lesson = lessonShowing(world), lessonNote = lockedNote(lesson);
  for (const [id, row] of panelRows) if (!byId.has(id)) { row.item.remove(); panelRows.delete(id); }
  const seen = [];
  order.forEach((id, at) => {
    const entity = byId.get(id), person = book.get(id);
    const row = panelRows.get(id) || panelRow(id);
    if (list.children[at] !== row.item) list.insertBefore(row.item, list.children[at] || null);
    const principal = id === household.principalId && entity.principal;
    const age = !Number.isFinite(person?.age ?? entity.age) ? '' : (person?.age ?? entity.age) === 0 ? ', under a year' : `, ${person?.age ?? entity.age}`;
    const role = person?.role || (principal ? 'principal' : 'of this family');
    const focused = id === focusedId;
    setData(row.item, 'role', person?.role || '');
    setData(row.item, 'principal', String(principal));
    setData(row.item, 'expanded', String(id === panelExpanded));
    setData(row.item, 'focused', String(focused));
    // Somebody is waiting on this person - a rider, the army, a call, work that has stopped to ask, an offer - and the "!"
    // takes the student to them and to the thing waiting (docs/FAMILY_PANEL.md §11). Read from the projection every tick, so
    // it goes the tick the answer is given.
    const needs = needsOf(world, id);
    const need = needs[0] || null;
    setData(row.item, 'waiting', String(Boolean(need)));
    if (row.attention.hidden !== !need) row.attention.hidden = !need;
    const needLabel = need ? `${need.text}${needs.length > 1 ? ` And ${needs.length - 1} more.` : ''} Go to ${entity.name} and answer.` : '';
    if (need && row.attention.dataset.need !== need.kind) { row.attention.dataset.need = need.kind; paintMark(row.attention, need.kind === 'rider' ? 'mark-need-rider' : 'mark-need'); }
    if (row.attention.getAttribute('aria-label') !== needLabel) { row.attention.setAttribute('aria-label', needLabel); row.attention.title = needLabel; }
    const canLead = !(entity.age < 10) && !['dead', 'captured'].includes(entity.health?.condition);
    const portraitLabel = `${entity.name}, ${role}${age}${focused ? ', selected' : ''}. ${canLead ? 'Select and follow' : 'View'} ${entity.name}${canLead ? '; show their actions' : ''}${need ? '; somebody is waiting on them' : ''}.`;
    if (row.portrait.getAttribute('aria-label') !== portraitLabel) row.portrait.setAttribute('aria-label', portraitLabel);
    row.portrait.setAttribute('aria-pressed', String(focused));
    const focusLabel = focused ? `Go back to ${entity.name}, your main person` : `Make ${entity.name} your main person`;
    if (row.focus.getAttribute('aria-label') !== focusLabel) { row.focus.setAttribute('aria-label', focusLabel); row.focus.title = focusLabel; row.focus.querySelector('.panel-mark-text').textContent = focused ? '★' : '☆'; row.focus.setAttribute('aria-pressed', String(focused)); }
    // The auto switch, read from the server's `auto` on the person every tick (docs/FAMILY_PANEL.md §11.7).
    const onAuto = Boolean(entity.auto);
    // 'onAuto', not 'auto': the switch button carries data-auto, and a row attribute of the same name would catch its presses.
    setData(row.item, 'onAuto', String(onAuto));
    if (row.auto.getAttribute('aria-pressed') !== String(onAuto)) {
      row.auto.setAttribute('aria-pressed', String(onAuto)); paintMark(row.auto, onAuto ? 'mark-auto-on' : 'mark-auto-off');
      // The word is always shown beside the key (owner, 2026-09-25: "isn't quite visible enough"), so on and off are told
      // apart by what it says and not by its colour alone.
      row.auto.querySelector('.panel-auto-word').textContent = onAuto ? 'Auto ✓' : 'Auto';
    }
    const autoWords = autoLabel(entity, onAuto);
    if (row.auto.getAttribute('aria-label') !== autoWords) { row.auto.setAttribute('aria-label', autoWords); row.auto.title = autoWords; }
    const autoSays = autoLine(entity);
    if (row.autoSays.textContent !== autoSays) row.autoSays.textContent = autoSays;
    if (row.autoSays.hidden !== !autoSays) row.autoSays.hidden = !autoSays;
    setData(row.autoSays, 'waiting', String(Boolean(onAuto && entity.autoTask?.waiting)));
    // The rooms of the house are set out from the main person's row: one place for the family's own detailed work.
    const houseShown = focused && house;
    if (row.house.hidden !== !houseShown) row.house.hidden = !houseShown;
    // What the person has become goes on the row after what they are: the mark and the camp drill (docs/FAMILY_PANEL.md).
    if (row.label.textContent !== `${role}${age}`) row.label.textContent = `${role}${age}`;
    // What they have become goes under the name: the mark and the camp drill (docs/FAMILY_PANEL.md §11).
    const become = standing(entity);
    if (row.note.textContent !== become) row.note.textContent = become;
    if (row.note.hidden !== !become) row.note.hidden = !become;
    const firstName = entity.given || entity.name;
    if (mayOverwriteName(row.input, firstName)) row.input.value = firstName;
    setData(row.input, 'current', firstName);
    // The portrait: the person's own figure, redrawn only when who they are drawn as changes.
    const figure = figureOf(entity), clip = `${figure}-idle-s`;
    const face = `${clip}:${entity.band || ''}:${principal}`;
    if (row.face !== face) {
      row.face = face;
      drawPortrait(row.canvas, { clip, figure, band: entity.band, principal, tint: hashOf(id) }, { drawClip, drawSprite, spriteFrame });
    }
    // The icons, from the server's own lists. The journeys, the yard and rest are on the main person's row: the server's rule.
    // What a trip brings home depends on how they go, which is asked when it is sent (public/going.js): the icon says what a
    // good trip gives, and the chooser what each way brings home of it.
    const carry = null;
    const offered = world.work?.[id] || [];
    const icons = panelActions({ entity, offered, catalogue: choreCache || new Map(), main: focused, homeId, homesteads,
      atHome: entity.location?.siteId === homeId, settable, carry });
    // The guided start shuts everything the step does not allow, and rings the one it asks for (public/lesson.js). It is
    // read here rather than decided here: `allow` is the server's list and the server refuses anything else in words.
    const shutting = lessonLocks(lesson);
    const pointed = focused ? pointedKey(lesson, icons) : null;
    const lessonFor = key => (shutting ? { shut: !allowsIcon(lesson, icons.find(one => one.key === key)), note: lessonNote, pointed: key === pointed } : null);
    // Why this person can do nothing at all, in the server's own words (docs/FAMILY_PANEL.md §14, owner 2026-09-21).
    // `offered` and `entity` are read for the row `panelActions` empties outright - somebody dead or captured - which has
    // no icon left to carry a reason. A bar the guided start has shut is not this: those icons are still `can`.
    const reason = rowReason(icons, { offered, entity });
    // On a journey the row says Travelling (owner, 2026-09-22: "their icon should say 'Travelling' next to it"). It goes
    // where a reason goes, by §14.1's rule, and it outranks the server's "... is on the road." because it is the same fact
    // in the owner's own word. Somebody carried away out of sight keeps the server's fuller sentence (`travellingLine`).
    const travelling = travellingLine(entity);
    // The main person's icon group *is* the bar at the bottom of the screen, and it shows the line there. Everybody else's
    // group is not drawn at all (public/style.css), so their line goes on the row, which is where a student looks for them.
    // This is the way out the stylesheet's ceiling named, asked for by a class on 2026-09-21.
    const silence = focused ? '' : travelling || reason || '';
    if (row.why.textContent !== silence) row.why.textContent = silence;
    if (row.why.hidden !== !silence) row.why.hidden = !silence;
    // No switch on a child too young to be sent, who has nothing for auto to repeat or answer. Only that case: somebody on
    // the road or in the ranks has a reason on their row too, and theirs is the switch auto-fight is for.
    // A child under ten with works of their own has no "too young" reason on the row (sim/children.mjs), and still showed the
    // switch - which the server refuses them (`tooYoung`, sim/world.mjs) - until 2026-09-25: the age is the server's, and the
    // same line of ten `canLead` reads above.
    const noSwitch = Boolean((reason && /too young/.test(reason)) || entity.age < 10);
    if (row.auto.hidden !== noSwitch) row.auto.hidden = noSwitch;
    // Idle: nothing to do and something could be given them. Everybody else on the panel is visibly at something (a glow).
    const idle = isIdle(entity, icons, { withArmy: army.has(id) });
    setData(row.item, 'idle', String(idle));
    if (row.idle.hidden !== !idle) row.idle.hidden = !idle;
    seen.push({ id, need: need?.kind || null, needs: needs.map(one => one.kind), idle, focused, auto: onAuto, autoSays: autoSays || null, autoWaiting: Boolean(onAuto && entity.autoTask?.waiting), reason: reason || null, why: silence || null, travelling: travelling || null });
    const visibleIcons = icons.filter(icon => icon.active || (icon.can && (!shutting || allowsIcon(lesson, icon))));
    const visibleReason = visibleIcons.length ? null : travelling || reason || 'No actions available right now.';
    const key = JSON.stringify([visibleReason, travelling, visibleIcons, shutting ? [lesson.step, lesson.allow, pointed] : null]);
    if (row.iconsKey !== key) {
      row.iconsKey = key;
      row.icons.setAttribute('aria-label', `What ${entity.name} can do`);
      // Changed in place, icon by icon: the button a student has focused or is pointing at stays the same button while what
      // it says changes around it, so keyboard focus and the popup survive every tick.
      const kept = new Map([...row.icons.querySelectorAll('.panel-icon')].map(button => [button.dataset.key, button]));
      row.icons.style.setProperty('--action-columns', Math.max(1, Math.ceil(visibleIcons.length / 2)));
      const wanted = visibleIcons.length ? visibleIcons.map(icon => {
        const button = kept.get(icon.key) || panelIcon(id, icon);
        kept.delete(icon.key);
        describeIcon(button, icon, lessonFor(icon.key));
        return button;
      }) : [];
      if (!visibleIcons.length) {
        const word = row.icons.querySelector('.panel-reason:not(.panel-travelling)') || element('span', '', 'panel-reason');
        word.textContent = visibleReason;
        wanted.push(word);
      } else if (travelling) {
        const word = row.icons.querySelector('.panel-travelling') || element('span', '', 'panel-reason panel-travelling');
        word.textContent = travelling;
        wanted.push(word);
      }
      for (const leftover of [...kept.values(), ...[...row.icons.querySelectorAll('.panel-reason')].filter(node => !wanted.includes(node))]) leftover.remove();
      wanted.forEach((node, at) => { if (row.icons.children[at] !== node) row.icons.insertBefore(node, row.icons.children[at] || null); });
      if (panelTipFor?.entityId === id) showPanelTip(row.icons.querySelector(`[data-key="${panelTipFor.key}"]`));
    }
  });
  window.__familyPanel = order.map((id, at) => {
    const row = panelRows.get(id);
    return { id, role: row.item.dataset.role, name: byId.get(id).name, active: [...row.icons.querySelectorAll('[data-active=true]')].map(icon => icon.dataset.key), ...seen[at] };
  });
}
/**
 * The Host's live page (docs/HOST_PAGE.md, owner 2026-09-16): the class family by family in words, the Rumor Mill, and the
 * spotlight. Rewritten only when what it says changes, as the family panel is, because the Host page redraws every tick.
 * The spotlight moves the camera once, the tick it is lit; the teacher can pan away or press Whole class and it stays away.
 */
let hostLiveKeys = { families: null, rumours: null, spotlight: null };
function renderHostLive(snapshot, host) {
  const panel = $('#host-live'), banner = $('#host-spotlight');
  if (!panel) return;
  const live = host ? snapshot.world.live : null;
  if (!live) { panel.hidden = true; if (banner) banner.hidden = true; hostLiveKeys = { families: null, rumours: null, spotlight: null }; return; }
  panel.hidden = false;
  const rows = familyRows(live, snapshot.presence);
  const familiesKey = JSON.stringify(rows);
  if (hostLiveKeys.families !== familiesKey) {
    hostLiveKeys.families = familiesKey;
    $('#host-families').replaceChildren(...rows.map(row => {
      const item = element('li', '', 'host-family');
      item.dataset.householdId = row.id; item.dataset.presence = row.presence;
      const head = element('div', '', 'host-family-head');
      head.append(element('span', row.name), element('span', row.settlement, 'host-family-settlement'));
      const presence = element('span', PRESENCE_LABELS[row.presence] || row.presence, 'host-presence'); presence.dataset.presence = row.presence;
      head.append(presence);
      if (row.waiting) { const waiting = element('span', `${row.waiting} waiting`, 'host-waiting'); waiting.title = `${row.waiting} thing${row.waiting === 1 ? '' : 's'} wait${row.waiting === 1 ? 's' : ''} unanswered on this family`; head.append(waiting); }
      const people = element('ul', '', 'host-people');
      people.append(...row.people.map(person => { const line = element('li', ''); line.append(element('span', `${person.name} `), element('span', person.where)); return line; }));
      // The guided start, only when the student stopped it or took it back up (owner, 2026-09-22): a line of words, never
      // a banner, a sound or an alert, and not a live region either - the teacher reads it when they look.
      item.append(head, ...(row.guided ? [element('p', row.guided, 'host-guided')] : []), people);
      return item;
    }));
  }
  // The Rumor Mill: one running story, rewritten only when it changes (sim/rumour-story.mjs, docs/HOST_PAGE.md §2.2).
  const story = storyView(live.story);
  if (hostLiveKeys.rumours !== story.key) {
    hostLiveKeys.rumours = story.key;
    $('#rumor-story').replaceChildren(...story.paragraphs.map(text => element('p', text, 'rumor-paragraph')), ...(story.latest ? [element('p', story.latest, 'rumor-latest')] : []));
  }
  const shown = spotlightBanner(live.spotlight);
  if (banner) {
    banner.hidden = !shown;
    if (shown && hostLiveKeys.spotlight !== shown.key) {
      hostLiveKeys.spotlight = shown.key;
      $('#host-spotlight-date').textContent = shown.date;
      $('#host-spotlight-text').textContent = shown.text;
      // The camera goes there once, zoomed in as a family's land is framed; anything the teacher does after wins.
      const canvas = $('#world-map'), view = cameraFor(snapshot.world, canvas);
      stopWatching();
      manualView = { cx: shown.x, cy: shown.y, scale: clampTo(Math.max(view.scale, view.limits.max * .45), view.limits) };
      window.__spotlightSeen = (window.__spotlightSeen || []).concat(shown.key);
    }
    if (!shown) hostLiveKeys.spotlight = null;
  }
  window.__hostLive = { families: rows, story: { paragraphs: story.paragraphs.length, topics: live.story?.topics || [], latest: story.latest }, spotlight: shown?.key || null };
}
$('#host-spotlight-back')?.addEventListener('click', () => applyMapView('follow'));
/** A data- attribute written only when it changes: the panel is redrawn every tick on a slow computer. */
function setData(element, key, value) { if (element.dataset[key] !== value) element.dataset[key] = value; }
/**
 * Choose the student's main person: `set-main`, which the server keeps on the household and refuses in words for anybody
 * too young or gone. The star fills on the next snapshot, which is what says the server took it; nothing is remembered here.
 */
/** The auto switch: `set-auto`, the server's; the button shows pressed on the next snapshot, which is what says it took. */
async function setAutoFor(id, on) {
  say('');
  try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'set-auto', entityId: id, auto: on }); }
  catch (error) { say(error.message); }
}
async function chooseFocus(id) {
  say('');
  try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'set-main', entityId: id }); }
  catch (error) { say(error.message); }
}
/**
 * Take the camera to one of the family and open their card: the same watch a portrait starts (`cameraFor` centres on where
 * they are drawn and zooms in), which walks with them until the student pans, zooms or presses Follow.
 */
function goToPerson(id) {
  const world = window.__snapshot?.world;
  selectedId = id; selectionDismissed = false;
  watchedId = id; manualView = null; panelExpanded = id;
  if (world) { drawWorld(world); renderFamilyPanel(world); renderSelection(world); renderTutorial(world); }
}
/** Where on the card each need is answered. A rider has a panel of their own. */
const NEED_SECTIONS = { army: '#selection-army', camp: '#selection-work', courier: '#selection-work', flight: '#selection-flight', road: '#selection-flight', call: '#selection-call', asking: '#selection-work', offer: '#selection-trade' };
/**
 * The "!" on a row: go to the person and open what is waiting on them - the rider's conversation, or their card at the
 * question with its answers - and put the keyboard on the first answer. Nothing is decided here: the answers are the card's
 * buttons, sent as they always were, and the "!" goes when the projection stops saying anything is waiting.
 */
function openNeed(id) {
  const world = window.__snapshot?.world;
  if (!world) return;
  const need = needsOf(world, id)[0];
  goToPerson(id);
  if (!need) return;
  let target = null;
  if (need.kind === 'rider') {
    encounterOpen = true;
    renderEncounter(world);
    // The conversation itself, not its first question: the questions are drawn again every tick, and a focused one would be
    // replaced under the keyboard.
    target = $('#encounter');
  } else if (need.kind === 'call') {
    // One menu for the whole family's call, whichever "!" was pressed (docs/FAMILY_PANEL.md §11.2).
    callMenuFor = { id, requestId: world.request?.id, checked: new Set(), key: null };
    renderCallMenu(world);
    target = $('#call-menu input:not([disabled])') || $('#call-menu-confirm');
  } else {
    const section = $(NEED_SECTIONS[need.kind]);
    target = section && !section.hidden ? section.querySelector('button:not([disabled])') || section : null;
  }
  window.__needOpened = { id, kind: need.kind, target: target?.id || target?.dataset?.action || target?.name || null };
  if (target) {
    if (!target.matches('button, input, select')) target.setAttribute('tabindex', '-1');
    target.scrollIntoView?.({ block: 'nearest' });
    target.focus?.({ preventScroll: true });
  }
}
/**
 * The call's one menu (docs/FAMILY_PANEL.md §11.2, owner 2026-09-16): every person who may answer, each with a tick, and one
 * confirm. Built from the server's `request.answerers` by `callMenu`, so who is listed, what sending each costs and why any
 * is refused are the server's words; `callPlan` turns the ticks into the same per-person commands the card's buttons send.
 * Rows are rebuilt only when what they say changes; ticks are kept in `callMenuFor` across ticks.
 */
function renderCallMenu(world) {
  const menuEl = $('#call-menu');
  if (!menuEl) return;
  if (!callMenuFor || world.role === 'host') { callMenuFor = null; menuEl.hidden = true; return; }
  const live = callMenu(world.request, { people: familyCache?.people || [], entities: entitiesOf(world) });
  // The menu as last built stays while an answer is being sent, or after a refusal, so the rest can still be sent; a call
  // answered from the card, or closed by the class, takes it away.
  if (live && live.id === callMenuFor.requestId) callMenuFor.menu = live;
  else if (!callMenuFor.busy && !callMenuFor.said) { callMenuFor = null; menuEl.hidden = true; return; }
  const menu = callMenuFor.menu;
  if (!menu) { callMenuFor = null; menuEl.hidden = true; return; }
  menuEl.hidden = false;
  const sent = callMenuFor.sent || new Set();
  const key = JSON.stringify([menu, [...sent], callMenuFor.said || '', callMenuFor.busy || false]);
  if (callMenuFor.key === key) return;
  callMenuFor.key = key;
  const stayLabel = menu.stay ? `Nobody goes: ${menu.stay.label.toLowerCase()}` : null;
  $('#call-menu-title').textContent = menu.several ? 'Who goes?' : 'Who answers?';
  $('#call-menu-text').textContent = menu.text;
  $('#call-menu-how').textContent = menu.several ? 'Tick everybody who goes; each takes what the call says.' : 'One of the family answers this. Choose who.';
  $('#call-menu-rows').replaceChildren(...menu.rows.map(row => {
    const item = element('li', '', 'call-menu-row');
    const label = element('label', '', 'call-menu-label');
    const input = document.createElement('input');
    input.type = menu.several ? 'checkbox' : 'radio';
    input.name = menu.several ? `call-menu-${row.id}` : 'call-menu-one';
    input.value = row.id;
    input.dataset.callMenuPerson = row.id;
    input.checked = callMenuFor.checked.has(row.id);
    input.disabled = !row.go.can || sent.has(row.id) || Boolean(callMenuFor.busy);
    item.dataset.person = row.id;
    item.dataset.sent = String(sent.has(row.id));
    label.append(input, element('span', row.name, 'call-menu-name'), element('span', row.who, 'call-menu-who'),
      element('span', sent.has(row.id) ? 'Sent.' : row.go.can ? row.go.note : row.go.why, 'call-menu-note'));
    if (!row.go.can) label.title = row.go.why;
    item.append(label);
    return item;
  }));
  const confirm = $('#call-menu-confirm'), stay = $('#call-menu-stay');
  confirm.disabled = Boolean(callMenuFor.busy);
  stay.hidden = !stayLabel;
  if (stayLabel) { stay.textContent = stayLabel; stay.title = menu.stay.note || ''; stay.disabled = Boolean(callMenuFor.busy) || !menu.stay.can || sent.size > 0; }
  $('#call-menu-said').textContent = callMenuFor.said || '';
  window.__callMenu = { requestId: menu.id, several: menu.several, rows: menu.rows.map(row => ({ id: row.id, can: row.go.can, checked: callMenuFor.checked.has(row.id), sent: sent.has(row.id) })), said: callMenuFor.said || '' };
}
/**
 * Confirm: send the plan the ticks make, one command each, in order, and say any refusal in the server's words. The camera
 * goes to the first person sent. Everybody sent stays sent; a refusal leaves the menu open with the rest still to tick.
 */
async function confirmCallMenu(stayOnly = false) {
  const world = window.__snapshot?.world;
  if (!callMenuFor?.menu || callMenuFor.busy || !world) return;
  const menu = callMenuFor.menu;
  const ticked = stayOnly ? [] : menu.rows.filter(row => callMenuFor.checked.has(row.id)).map(row => row.id);
  const plan = callPlan(menu, ticked, callMenuFor.id);
  if (!plan.length) { say('Tick who goes, or choose to keep everybody home.'); return; }
  callMenuFor.busy = true; callMenuFor.said = ''; callMenuFor.sent = callMenuFor.sent || new Set();
  renderCallMenu(world);
  goToPerson(plan[0].entityId);
  const refused = [];
  for (const step of plan) {
    const input = { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: step.action, entityId: step.entityId };
    // An answer that puts somebody on a road asks how they go first (public/going.js, owner 2026-09-24), one person at a time,
    // and the chooser sends it. Cancelled, nobody further is sent; those already sent stay sent.
    if (asksTheWay(input, choreCache)) {
      const { sent, error } = await goingPopup.open(input);
      if (sent) { callMenuFor?.sent.add(step.entityId); callMenuFor?.checked.delete(step.entityId); continue; }
      if (error) { refused.push(`${menu.rows.find(row => row.id === step.entityId)?.name || step.entityId}: ${error}`); continue; }
      break;
    }
    try {
      await api('/api/command', input);
      callMenuFor.sent.add(step.entityId); callMenuFor.checked.delete(step.entityId);
    } catch (error) {
      const name = menu.rows.find(row => row.id === step.entityId)?.name || step.entityId;
      refused.push(`${name}: ${error.message}`);
    }
  }
  callMenuFor.busy = false;
  callMenuFor.said = refused.join(' ');
  if (!refused.length) { callMenuFor = null; $('#call-menu').hidden = true; return; }
  say(callMenuFor.said);
  renderCallMenu(window.__snapshot?.world || world);
}
$('#call-menu')?.addEventListener('change', event => {
  const input = event.target.closest('[data-call-menu-person]');
  if (!input || !callMenuFor) return;
  if (input.type === 'radio') callMenuFor.checked.clear();
  if (input.checked) callMenuFor.checked.add(input.dataset.callMenuPerson); else callMenuFor.checked.delete(input.dataset.callMenuPerson);
  callMenuFor.key = null;
  if (window.__snapshot) renderCallMenu(window.__snapshot.world);
});
$('#call-menu')?.addEventListener('click', event => {
  if (event.target.closest('#call-menu-confirm')) confirmCallMenu(false);
  else if (event.target.closest('#call-menu-stay')) confirmCallMenu(true);
  else if (event.target.closest('#call-menu-close')) { callMenuFor = null; $('#call-menu').hidden = true; }
});
function panelRow(id) {
  const item = element('li', '', 'panel-row');
  item.dataset.entityId = id;
  const portrait = element('button', '', 'panel-portrait');
  portrait.type = 'button';
  portrait.dataset.portrait = id;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  canvas.setAttribute('aria-hidden', 'true');
  // The marks (docs/FAMILY_PANEL.md §11): each a small canvas drawn from the `mark-*` frames, with the type it replaced kept
  // under it for a page the art never reaches (`data-drawn` says which is showing).
  // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the marks drawn are Claude-drawn; Astra's
  // mark-need, mark-need-rider, mark-main, mark-idle and mark-auto of the same names replace them when registered.
  const star = panelMark('span', '★', 'panel-star', 'mark-main'), idleMark = panelMark('span', 'idle', 'panel-idle-mark', 'mark-idle');
  portrait.append(canvas, star, idleMark);
  // The "!": its own button beside the portrait (a button cannot hold a button), shown only while somebody waits on them.
  const attention = panelMark('button', '!', 'panel-attention', 'mark-need');
  attention.type = 'button';
  attention.dataset.attention = id;
  attention.hidden = true;
  const body = element('div', '', 'panel-body');
  const label = element('label', '', 'panel-label');
  const input = document.createElement('input');
  input.id = `panel-name-${id}`;
  input.className = 'panel-name';
  input.maxLength = 24; input.autocomplete = 'off'; input.spellcheck = false;
  input.dataset.rename = id;
  label.htmlFor = input.id;
  const tools = element('span', '', 'panel-tools');
  const idle = element('span', 'Idle', 'panel-idle');
  idle.hidden = true;
  const house = element('button', 'House', 'panel-house');
  house.type = 'button';
  house.dataset.house = id;
  house.hidden = true;
  house.setAttribute('aria-label', 'Go inside the house to set out the furniture and the goods');
  house.title = 'Go inside the house to set out the furniture and the goods';
  const focus = panelMark('button', '☆', 'panel-focus', 'mark-main');
  focus.type = 'button';
  focus.dataset.focus = id;
  // The auto switch (docs/FAMILY_PANEL.md §11.7, §16): the key and the word, green and glowing while the server says they are on it.
  // The word beside the key is its own, not the type the key replaced (owner, 2026-09-25): it is always shown, drawn key or not.
  const auto = panelMark('button', '', 'panel-auto', 'mark-auto-off');
  auto.append(element('span', 'Auto', 'panel-auto-word'));
  auto.type = 'button';
  auto.dataset.auto = id;
  auto.setAttribute('aria-pressed', 'false');
  tools.append(idle, house, auto, focus);
  // The ability bar (owner, 2026-09-21): the icons are a child of the row, not of the row's body, so the names can be
  // folded away without folding away the work, and so a row whose person is not the main one can hide them on their own.
  // Where they are *drawn* is the stylesheet's: the main person's group is taken to the bottom middle of the screen.
  const icons = element('div', '', 'panel-icons');
  icons.setAttribute('role', 'group');
  // What the person has become, under their name: its own line so it wraps on a phone instead of pushing the star off the row.
  const note = element('span', '', 'panel-standing');
  note.hidden = true;
  // Why this person can do nothing at all, under that (docs/FAMILY_PANEL.md §14, owner 2026-09-21): a line of its own in
  // the body, so a child under ten shows a face, a name and the server's reason rather than a face, a name and nothing.
  const why = element('span', '', 'panel-why');
  why.hidden = true;
  // What somebody on auto is auto-doing and, while they wait, why (owner, 2026-09-25, docs/FAMILY_PANEL.md §16): the server's
  // sentence on a line of its own, on every row - the main person's too, since it says what the bar at the bottom cannot.
  const autoSays = element('span', '', 'panel-auto-line');
  autoSays.hidden = true;
  body.append(label, input, tools, note, why, autoSays);
  item.append(portrait, attention, body, icons);
  const row = { item, portrait, canvas, label, input, icons, attention, idle, house, focus, auto, autoSays, note, why, face: null, iconsKey: null };
  panelRows.set(id, row);
  return row;
}
/** A mark: a small canvas for its `mark-*` frame over the character or word it replaced, drawn now and again when art arrives. */
function panelMark(tag, text, className, mark) {
  const node = element(tag, '', className);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  canvas.setAttribute('aria-hidden', 'true');
  node.append(canvas, element('span', text, 'panel-mark-text'));
  paintMark(node, mark);
  return node;
}
function paintMark(node, mark) {
  node.dataset.mark = mark;
  setData(node, 'drawn', String(drawMark(node.querySelector('canvas'), mark, { drawSprite, spriteFrame })));
}
function panelIcon(entityId, icon) {
  const button = element('button', '', 'panel-icon');
  button.type = 'button';
  button.dataset.key = icon.key;
  button.dataset.entityId = entityId;
  // What pressing it sends, in the same attributes the card's buttons carried, so the one dispatcher sends it.
  if (icon.kind === 'chore') { button.dataset.action = icon.onMap ? 'survey-start' : 'chore'; button.dataset.chore = icon.key; }
  else if (icon.visit) button.dataset.visit = 'true';
  else if (icon.destination) { button.dataset.action = 'travel'; button.dataset.destination = icon.destination; }
  else button.dataset.action = icon.key;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 72;
  canvas.setAttribute('aria-hidden', 'true');
  drawIcon(canvas, icon.key, { drawSprite, spriteFrame });
  button.append(canvas, element('span', '', 'panel-action-name'));
  return button;
}
/**
 * What an icon says this tick: its name, sentence and note, whether it is open, and whether it glows.
 *
 * `lesson` is how the guided start sees this icon (public/lesson.js): `shut` while the step does not allow it, `pointed`
 * on the one the step is asking for. A shut icon is shut the way a refused one is - dimmed, still focusable, still able
 * to say why - because the student is meant to read it, and because the server refuses it in words either way.
 */
function describeIcon(button, icon, lesson = null) {
  button.dataset.name = icon.name;
  const label = button.querySelector('.panel-action-name');
  const words = `${icon.active ? 'Now: ' : ''}${icon.name}`;
  if (label.textContent !== words) label.textContent = words;
  button.dataset.summary = icon.summary;
  const shut = Boolean(lesson?.shut);
  // Somebody at this already is not refused it: they are doing it, and the popup says so rather than giving the busy reason.
  const note = icon.active ? 'Doing this now.' : shut ? lesson.note : icon.can ? icon.note : icon.why;
  button.dataset.note = note;
  // Refused, but still focusable and hoverable so its reason can be read: `aria-disabled`, not `disabled`.
  if (icon.can && !shut) button.removeAttribute('aria-disabled'); else button.setAttribute('aria-disabled', 'true');
  setData(button, 'shut', shut ? 'true' : '');
  setData(button, 'pointed', lesson?.pointed ? 'true' : '');
  // Work somebody on auto is given to wait for (sim/auto.mjs `waitingWork`): sent as it is, the way chosen when it goes.
  setData(button, 'waits', icon.waits ? 'true' : '');
  button.dataset.active = String(icon.active);
  if (icon.active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
  button.setAttribute('aria-label', [`${icon.name}.`, icon.summary, note, lesson?.pointed ? 'This is the step to do now.' : ''].filter(Boolean).join(' '));
}
/** The small popup over an icon: what it is, its one sentence, and the server's price or reason. */
function showPanelTip(button) {
  const tip = $('#panel-tip');
  if (!button) { hidePanelTip(); return; }
  panelTipFor = { entityId: button.dataset.entityId, key: button.dataset.key };
  $('#panel-tip-name').textContent = button.dataset.name;
  $('#panel-tip-summary').textContent = button.dataset.summary;
  $('#panel-tip-note').textContent = button.dataset.note || '';
  tip.dataset.refused = String(button.getAttribute('aria-disabled') === 'true' && button.dataset.active !== 'true');
  tip.hidden = false;
  const box = button.getBoundingClientRect(), stage = $('.map-stage').getBoundingClientRect();
  const left = Math.max(8, Math.min(stage.width - tip.offsetWidth - 8, box.left - stage.left + box.width / 2 - tip.offsetWidth / 2));
  const below = box.bottom - stage.top + 8, above = box.top - stage.top - tip.offsetHeight - 8;
  tip.style.left = `${left}px`;
  tip.style.top = `${below + tip.offsetHeight < stage.height - 8 ? below : Math.max(8, above)}px`;
}
function hidePanelTip() { panelTipFor = null; const tip = $('#panel-tip'); if (tip) tip.hidden = true; }
/**
 * Folding the panel down to a column of faces (owner, 2026-09-21: the interface covered too much of a Chromebook screen).
 *
 * This is the way out the ceiling in docs/FAMILY_PANEL.md §7 named, now that the ground it covered has turned out to
 * matter in play. It folds the names, roles and tools away and leaves the portraits, which are what a glance down the
 * column is for - who is idle, who has an "!" - and the main person's work stays where it is, at the bottom middle of
 * the screen, because that is the one thing a folded panel must not take away. Remembered per browser; a browser that
 * refuses storage simply opens unfolded, which is the smaller harm.
 */
const COLLAPSE_KEY = 'tr_family_panel_folded';
function panelFolded() { try { return localStorage.getItem(COLLAPSE_KEY) === 'yes'; } catch { return false; } }
function setPanelFolded(folded) {
  const panel = $('#family-panel'), button = $('#family-collapse');
  if (!panel || !button) return;
  setData(panel, 'collapsed', String(folded));
  button.setAttribute('aria-expanded', String(!folded));
  button.textContent = folded ? 'Show names' : 'Hide names';
  const words = folded ? 'Show each person’s name and tools beside their face' : 'Fold the family down to a column of faces, to see more of the map';
  button.setAttribute('aria-label', words);
  button.title = words;
  // The card beside a person is placed among the panel's box, which has just changed size.
  placement.boxes = null;
}
$('#family-collapse')?.addEventListener('click', () => {
  const folded = $('#family-panel')?.dataset.collapsed !== 'true';
  try { localStorage.setItem(COLLAPSE_KEY, folded ? 'yes' : 'no'); } catch { /* a private window is allowed to forget */ }
  setPanelFolded(folded);
});
// After the module body, so the placement boxes this clears already exist.
queueMicrotask(() => setPanelFolded(panelFolded()));
$('#family-panel')?.addEventListener('pointerover', event => { const icon = event.target.closest('.panel-icon'); if (icon) showPanelTip(icon); });
$('#family-panel')?.addEventListener('pointerout', event => { const icon = event.target.closest('.panel-icon'); if (icon && !icon.contains(event.relatedTarget)) hidePanelTip(); });
$('#family-panel')?.addEventListener('focusin', event => { const icon = event.target.closest('.panel-icon'); if (icon) showPanelTip(icon); else hidePanelTip(); });
$('#family-panel')?.addEventListener('focusout', event => { if (!event.relatedTarget?.closest?.('.panel-icon')) hidePanelTip(); });
// A row or the panel scrolled under the popup: it follows its icon rather than floating where the icon was.
$('#family-panel')?.addEventListener('scroll', () => {
  if (!panelTipFor) return;
  showPanelTip(panelRows.get(panelTipFor.entityId)?.icons.querySelector(`[data-key="${panelTipFor.key}"]`));
}, true);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && panelTipFor) hidePanelTip(); });
// Portrait selection is a single-click operation, including keyboard activation and touch.
/** Art arrives after the page: portraits and icons drawn with a fallback are drawn again with it. */
function repaintFamilyPanel() {
  for (const row of panelRows.values()) {
    row.face = null;
    for (const node of row.item.querySelectorAll('[data-mark]')) paintMark(node, node.dataset.mark);
    for (const icon of row.icons.querySelectorAll('.panel-icon')) drawIcon(icon.querySelector('canvas'), icon.dataset.key, { drawSprite, spriteFrame });
  }
  if (window.__snapshot) renderFamilyPanel(window.__snapshot.world);
}
/**
 * The neighbours' homesteads this person could set out for, nearest to where they stand first.
 *
 * Named as the map names them. ceiling: that is the name the map was generated with ("Family 2 home"),
 * not the family's own name, which only a meeting tells you (`observedBy`); a list of every family's
 * chosen name sent to everybody would be knowing who lives where without ever having been.
 */
function renderVisits(world, chosen, commands) {
  const select = $('#visit-select'), go = $('#visit-go');
  if (!select || !go) return;
  const row = $('#visit-row');
  const from = chosen.location?.siteId ? world.map?.sites?.[chosen.location.siteId] : chosen.location;
  const homes = sitesOf(world).filter(site => site.kind === 'homestead' && site.id !== homeOf(world));
  row.hidden = !commands || !homes.length || !from || chosen.service?.status === 'serving';
  if (row.hidden) return;
  const miles = site => Math.hypot(site.x - from.x, site.y - from.y);
  const ordered = homes.sort((a, b) => miles(a) - miles(b));
  const shape = ordered.map(site => `${site.id}:${miles(site).toFixed(1)}`).join('|');
  if (select.dataset.shape !== shape) {
    const kept = select.value;
    select.replaceChildren(...ordered.map(site => { const option = element('option', `${site.name} · ${miles(site).toFixed(1)} miles`); option.value = site.id; return option; }));
    if (ordered.some(site => site.id === kept)) select.value = kept;
    select.dataset.shape = shape;
  }
  go.dataset.destination = select.value;
}
$('#visit-select')?.addEventListener('change', () => { if (window.__snapshot) renderSelection(window.__snapshot.world); });
function renderSelection(world) {
  const panel = $('#selection'), chosen = selectedEntity(world);
  const household = world.household;
  // Nobody to give orders to until the die is rolled: setting one of the founding four to
  // work would use up the family's roll on people it is about to replace.
  // The Host may look at anybody in the class, read only: every person on its map is `observed`, so no control below is offered.
  if (!chosen || (world.role === 'host' && !chosen.observed) || selectionDismissed || familyCache?.canRoll || rollState === 'rolling') { panel.hidden = true; return; }
  panel.hidden = false;
  panel.dataset.entityId = chosen.id;
  // The detailed controls - Going by, a neighbour's homestead - are the main person's (docs/FAMILY_PANEL.md §11.3), as the server holds it.
  const commands = chosen.id === (household?.mainId || household?.principalId) && !chosen.observed;
  const task = taskFor(world, chosen);
  $('#selection-name').textContent = chosen.name;
  // What someone is doing is the chore's own words when they are on one - "breaking the
  // rows" says more than "work", and it is the step the server is actually running.
  if (hostView(world)) {
    // The teacher's look at anybody: whose they are, what they are doing in the chore's own words, where, and how they are.
    const lands = world.overview?.lands || {}, family = lands[chosen.householdId]?.name;
    const doing = chosen.chore?.doing || (chosen.travel ? `on the road to ${placeName(world, chosen.travel.to)}` : chosen.task || 'here');
    // A homestead is named for the family on it, not for the row it was made as ("Family 9 home").
    const siteId = chosen.location?.siteId, owner = siteId && Object.values(lands).find(land => land.homeSiteId === siteId);
    const where = !siteId ? null : owner ? (owner.name === family ? 'at home' : `on the land of ${owner.name}`) : `at ${placeName(world, siteId)}`;
    $('#selection-state').textContent = [chosen.resident ? chosen.about : family && `of ${family}`, chosen.carrier && 'a rider', doing, chosen.withArmy && 'with the army',
      where, chosen.condition || 'well'].filter(Boolean).join(' · ');
  } else if (chosen.observed) {
    // Somebody else's person, or one of the town's. A student can look at them and learn
    // who they are; there is nothing here to order, and no control pretends otherwise.
    // Their own description, sent with them. This used to be three strings written out
    // here and keyed off what they trade in, which meant the town could change its mind
    // about somebody and the page would go on saying the old thing.
    $('#selection-state').textContent = chosen.resident
      ? `of Gonzales · ${chosen.about || 'about the commons'}`
      // Every family is a copy of the same four names, so a neighbour is named with theirs.
      : `${chosen.household ? `of ${chosen.household} · ` : ''}${chosen.task || 'here'} · ${placeName(world, chosen.location?.siteId)} · ${chosen.condition || 'well'}`;
  } else $('#selection-state').textContent = chosen.chore
    ? `${chosen.chore.doing} · ${chosen.health?.condition || 'well'}`
    : chosen.travel
      // Away on the road, too fast to follow (sim/sight.mjs): the card is where a student is told so, and it says the same
      // three things their row on the panel does - where they went, how far is left, and roughly when they get there.
      ? away(chosen)
        ? `Away on the road to ${placeName(world, chosen.travel.to)} · about ${chosen.travel.miles} miles off · should be ${chosen.travel.back}`
        : `On the road to ${placeName(world, chosen.travel.to)} · ${Math.round((chosen.travel.progress || 0) / (chosen.travel.distance || 1) * 100)}%`
      : `${chosen.task || 'resting'} · ${placeName(world, chosen.location?.siteId)} · ${chosen.health?.condition === 'wounded' ? `${chosen.health.grade || 'badly'} wounded` : chosen.health?.condition || 'well'}`;
  // A lasting mark from a wound (sim/army.mjs `WOUND_GRADES`): part of who this person is now, so it stays on their card.
  if (chosen.marks?.length && world.role !== 'host') $('#selection-state').textContent += ` · ${chosen.marks.join(', ')}`;
  // The call panel below carries the question itself. This line is what is left for a
  // person who has been asked something that is not open to them to answer any more.
  const calling = task?.status === 'open' && task.options?.length && !chosen.observed && world.role !== 'host';
  $('#selection-task').hidden = !task || calling;
  $('#selection-task').textContent = task && !calling ? task.text : '';
  $('#action-subject').textContent = commands ? `Ask ${chosen.name} to…`
    : hostView(world) ? 'The teacher watches; only the family gives orders.'
    : chosen.observed ? `${chosen.name} is not one of your family.`
    : `${chosen.name} follows the household's work.`;
  const running = world.status === 'running';
  // Work can be set out before the teacher begins. Nothing advances until then - the
  // server does not tick a lobby - so this is a family getting ready rather than a family
  // getting ahead, and every plan in the class starts on the same minute.
  const settable = running || world.status === 'lobby';
  renderVisits(world, chosen, commands);
  for (const button of $('#selection-actions').querySelectorAll('button')) {
    const action = button.dataset.action;
    if (button.id === 'listen-rider') continue;
    const destination = button.dataset.destination === 'home' ? homeOf(world) : button.dataset.destination;
    button.hidden = !commands;
    // The card's own journey ("Go there", to a neighbour's homestead) is the `visit` icon by another route, so the guided
    // start shuts it with the same rule (public/lesson.js): a student led to one step must not find a second way round it.
    button.disabled = !settable || Boolean(chosen.travel) || (action === 'travel' && (!destination || chosen.location?.siteId === destination || shutByLesson(world, 'visit')));
  }
  // Somebody is standing in front of this person waiting to be spoken to. The button is
  // theirs and nobody else's: a rider stopped one named person, and that is who can listen.
  const waiting = world.encounter?.status === 'open' && world.encounter.listenerId === chosen.id;
  const listen = $('#listen-rider');
  listen.hidden = !waiting || world.role === 'host';
  listen.textContent = waiting ? `Listen to ${world.encounter.carrierName}` : 'Listen';
  renderCall(world, chosen, running); renderFlight(world, chosen, running);
  renderArmyControl(world, chosen, running);
  renderWork(world, chosen, settable);
  // Trading stays shut until the class is running, because the neighbour it is addressed
  // to may not have joined yet. An offer to an empty chair is not a trade.
  renderTrade(world, chosen, running);
  renderCardFold(world, chosen);
  positionSelection(world, chosen);
}
/**
 * The card folded while a step of the guided start is running (owner's coordinator, 2026-09-21: "during a lesson the step
 * card is the one thing that must be readable").
 *
 * *Going by* and the list of neighbours are the card's two tallest blocks - three stamps, a paragraph and a dropdown,
 * about 250 px of the right of a Chromebook screen. **Nothing is shut:** the server allows `travel` on every step of the
 * lesson on purpose (`ALWAYS` in sim/lesson.mjs), so a page that put them out of reach would be stopping what the world
 * permits. They are folded, with a press to open them, and they are simply open when no step is running.
 */
let cardUnfolded = null;
function renderCardFold(world, chosen) {
  const panel = $('#selection'), more = $('#selection-more');
  if (!panel || !more) return;
  const stepRunning = Boolean(lessonShowing(world));
  const foldable = stepRunning && [$('#visit-row')].some(part => part && !part.hidden);
  if (cardUnfolded && cardUnfolded !== chosen.id) cardUnfolded = null;
  const folded = foldable && cardUnfolded !== chosen.id;
  setData(panel, 'detail', folded ? 'folded' : 'open');
  if (more.hidden !== !foldable) more.hidden = !foldable;
  if (!foldable) return;
  more.setAttribute('aria-expanded', String(!folded));
  const words = folded ? 'The neighbours' : 'Put that away';
  if (more.textContent !== words) { more.textContent = words; more.setAttribute('aria-label', words); }
}
$('#selection-more')?.addEventListener('click', () => {
  const world = window.__snapshot?.world;
  const chosen = world && selectedEntity(world);
  if (!chosen) return;
  cardUnfolded = cardUnfolded === chosen.id ? null : chosen.id;
  renderSelection(world);
});
/**
 * The boxes the card is placed among, measured once and again only when something about them changes size - never on every
 * frame. Placing the card read five boxes and wrote its position on every animation frame, which forced the browser to lay
 * the page out twelve times a second (about 150 ms a nine-second load on a Chromebook-slow CPU, docs/PERFORMANCE_LOAD.md).
 * ceiling: the family panel and the buttons along the bottom are measured when they resize, not when they move without
 * resizing; nothing moves them today.
 */
const placement = { boxes: null, observer: null, left: null, top: null, docked: null };
// The window's own size is checked too, and costs nothing: a resize is seen by the observer only after the next layout, and a
// card placed in between used the wide screen's boxes on a phone (found by the art proof, 2026-09-17).
function placementBoxes() {
  if (placement.boxes && placement.boxes.viewport === `${innerWidth}x${innerHeight}`) return placement.boxes;
  const canvas = $('#world-map'), panel = $('#selection'), family = $('#family-panel');
  const rect = canvas.getBoundingClientRect();
  placement.boxes = {
    viewport: `${innerWidth}x${innerHeight}`, rect, panelWidth: panel.offsetWidth, panelHeight: panel.offsetHeight,
    family: family && !family.hidden ? family.getBoundingClientRect() : null,
    // The ability bar (owner, 2026-09-21) stands across the bottom middle; the card beside a person is kept off it, as it
    // is kept off the map's own buttons.
    controls: ['#journal-toggle', '#map-nav', '.panel-row[data-focused=true] .panel-icons'].map(selector => document.querySelector(selector)?.getBoundingClientRect()).filter(box => box?.height),
    // The guided start's strip is **overhead**, not underfoot: it stands across the top middle, so the card is kept
    // *below* it rather than above it. Counting it among the controls pushed the card up to the top of the screen and
    // straight under the strip, which is the one thing that has to stay readable while a step is running (2026-09-21).
    overhead: ['#lesson', '#military-notice'].map(selector => document.querySelector(selector)?.getBoundingClientRect()).filter(box => box?.height),
  };
  if (!placement.observer && typeof ResizeObserver === 'function') {
    placement.observer = new ResizeObserver(() => { placement.boxes = null; });
    for (const element of [canvas, panel, family, $('#journal-toggle'), $('#map-nav'), $('#lesson'), $('#military-notice'), ...document.querySelectorAll('.panel-icons')]) if (element) placement.observer.observe(element);
    window.addEventListener('resize', () => { placement.boxes = null; });
  }
  return placement.boxes;
}
function positionSelection(world, chosen = selectedEntity(world)) {
  const panel = $('#selection');
  if (panel.hidden || !chosen) return;
  // Beside the person on a wide screen; docked on a phone, where a floating card would
  // simply cover the family it is describing.
  const canvas = $('#world-map'), spot = drawnAt.get(chosen.id);
  const { rect, panelWidth, panelHeight, family: familyBox, controls, overhead } = placementBoxes();
  const docked = rect.width < 760 || !spot;
  if (docked !== placement.docked) {
    placement.docked = docked; placement.left = null; placement.top = null;
    if (docked) { panel.dataset.docked = 'true'; panel.style.left = ''; panel.style.top = ''; } else { delete panel.dataset.docked; panel.style.bottom = ''; }
    placement.boxes = null;
  }
  if (docked) {
    // The labeled action bar can grow with long names: reserve its measured space,
    // rather than covering the last answer with a fixed-height phone dock.
    const top = Math.min(window.innerHeight, ...controls.map(box => box.top));
    const bottom = `${Math.max(64, window.innerHeight - top + 8)}px`;
    if (panel.style.bottom !== bottom) panel.style.bottom = bottom;
    return;
  }
  const scaleX = rect.width / canvas.width, scaleY = rect.height / canvas.height;
  const right = spot.x * scaleX + 26, flip = right + panelWidth > rect.width - 8;
  // And never over the family panel down the left, when there is room beside it (docs/FAMILY_PANEL.md §7).
  const margin = familyBox?.width && familyBox.right - rect.left + panelWidth + 16 < rect.width ? familyBox.right - rect.left + 8 : 8;
  const left = `${Math.round(Math.max(margin, flip ? spot.x * scaleX - panelWidth - 26 : right))}px`;
  // Never down over the row of buttons along the bottom: clamped to the canvas alone, a person standing low on a wide
  // screen put this card over Family, Follow and Land, and the journal could not be opened (found 2026-09-14).
  const floor = Math.min(rect.height, ...controls.map(box => box.top - rect.top));
  // And never up under the guided start's strip: only the part of it the card would actually stand in front of counts, so
  // a card out at the right edge is not pushed down for a strip that ends in the middle.
  const at = Number.parseInt(left, 10);
  const roof = Math.max(8, ...overhead
    .filter(box => at < box.right - rect.left && box.left - rect.left < at + panelWidth)
    .map(box => box.bottom - rect.top + 8));
  const top = `${Math.round(Math.max(roof, Math.min(floor - panelHeight - 8, spot.y * scaleY - panelHeight / 2)))}px`;
  // Written only when it changes: a style written every frame is a layout every frame.
  if (left !== placement.left) { panel.style.left = left; placement.left = left; }
  if (top !== placement.top) { panel.style.top = top; placement.top = top; }
}
/**
 * Naming the family (owner, 2026-09-17): once the die is rolled, a student's family with no last name is asked for one in a
 * box that does not close until it is answered. What the family is called before that is the game's (`householdName`).
 */
let surnameSaving = false;
function renderSurname() {
  const box = $('#surname'), family = familyCache;
  // After the die has been seen: not while it tumbles or while 'Meet your family' is still on the screen.
  const show = creationStep(window.__snapshot?.world, family) === 'surname' && rollState !== 'rolling' && rollState !== 'rolled';
  if (box.hidden === show) {
    box.hidden = !show;
    if (show) setTimeout(() => $('#surname-input')?.focus(), 0);
  }
  if (!show) return;
  const first = family.people.map(person => person.given || person.name);
  const typed = $('#surname-input').value.trim();
  $('#surname-people').textContent = typed ? first.map(name => `${name} ${typed}`).join(', ') : first.join(', ');
}
$('#surname-input')?.addEventListener('input', () => { $('#surname-error').textContent = ''; renderSurname(); });
$('#surname-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const surname = $('#surname-input').value.trim();
  if (!surname || surnameSaving) return;
  surnameSaving = true; $('#surname-save').disabled = true;
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'rename', surname });
    $('#surname-error').textContent = '';
    familyCache = familyCache && { ...familyCache, named: true };
    renderSurname();
    forgetFamily();
    if (window.__snapshot) render(window.__snapshot);
  } catch (error) {
    $('#surname-error').textContent = error.message;
  } finally {
    surnameSaving = false; $('#surname-save').disabled = false;
  }
});

/**
 * Who we are: every person, what they are to the rest, and a box to rename them in.
 *
 * The roles are the world's and do not move - a student renaming somebody does not change
 * whose child they are - and the names are entirely the student's. Ids never change at all,
 * which is what lets skills and faces stay put through a rename.
 */
/** "the García family" as a heading: "The García family". */
const headingCase = text => text ? text[0].toUpperCase() + text.slice(1) : text;
function renderFamilyBook() {
  const host = $('#family-kin');
  const family = familyCache;
  if (!family || family.canRoll) { host.replaceChildren(); delete host.dataset.shape; $('#family-book-note').textContent = family ? 'Roll the die to find out who your family is.' : ''; return; }
  $('#family-book-note').textContent = 'First names are changed on the family panel. The last name and how the parents look were chosen when the family was named.';
  const shape = JSON.stringify(family.people.map(person => [person.id, person.name, person.role, person.age, person.of]));
  if (host.dataset.shape === shape) return;
  host.dataset.shape = shape;
  host.replaceChildren(...family.people.map(person => {
    const item = element('li', '', 'kin-row');
    item.dataset.entityId = person.id;
    item.dataset.role = person.role || '';
    const age = !Number.isFinite(person.age) ? '' : person.age === 0 ? ', under a year' : `, ${person.age}`;
    item.append(element('strong', person.name), element('span', ` - ${person.role || 'of this family'}${age}. `));
    if (person.of) item.append(element('span', person.of, 'kin-of'));
    return item;
  }));
}
function renderKnowledge(world) {
  const host = world.role === 'host';
  $('#knowledge-title').textContent = host ? 'News the community knows' : 'What your family has heard';
  $('#knowledge-context').textContent = host ? 'These public reports may arrive after nearby families have heard news.' : 'Word can be old, uncertain, or wrong. Other families have heard other things.';
  const reports = [...(world.reports || [])].reverse();
  const describe = report => {
    const receivedAge = Math.max(0, report.ageMinutes ?? (world.minute - report.receivedMinute));
    const received = receivedAge === 0 ? 'Received just now' : `Received ${timeLabel(receivedAge)} ago`;
    // How many people carried it. A family that met the man who saw it is told nothing
    // extra; a family at the end of a chain has that on the face of its own record.
    const through = report.hands ? ` · ${handLabel(report.hands)}` : '';
    return `${report.source || 'Unknown source'}${through} · ${received} · describes ${timeLabel(Math.max(0, report.observationAgeMinutes ?? (world.minute - report.observedMinute)))} earlier`;
  };
  // Anything a family drew out of a rider by asking is part of what it knows, so it is
  // kept here rather than disappearing with the rider. This is the journal keeping the
  // record, which is what the presentation change was allowed to leave alone.
  const heard = report => (report.details || []).map(detail => element('span', `“${detail.ask}” — “${detail.answer}”`, 'report-detail'));
  renderReportList(world, reports, describe, heard);
  // A quiet mark on the book rather than a card over the world. Which reports this
  // browser has already shown is a per-viewer convenience and belongs nowhere near the
  // server: another student at another desk has their own family and their own book.
  for (const report of reports) if (!readReports.has(report.topicId)) unreadReports.add(report.topicId);
  if ($('#family-journal')?.dataset.open === 'true') markReportsRead(reports);
  $('#journal-unread').hidden = unreadReports.size === 0;
}
/**
 * What a family has been told, written into the book the family keeps.
 *
 * This used to be a bar across the bottom of the map carrying the latest headline, and it
 * was the wrong shape twice over. It made news a notification - a thing the interface
 * announces - when VISION.md's whole claim is that information arrives through people and
 * is incomplete; and it duplicated the rider who was already standing at the gate saying
 * the same thing. What is left is the two honest halves: the arrival is a person, drawn in
 * the world with a mark over whoever he stopped, and the record is this.
 */
function renderReportList(world, reports, describe, heard) {
  const host = world.role === 'host';
  $('#reports-empty').hidden = reports.length > 0;
  $('#reports-empty').textContent = host ? 'No public reports have arrived yet.' : 'No word has reached your family yet.';
  $('#reports').replaceChildren(...reports.map(report => {
    const item = element('li', `${report.text} — ${report.status}, ${describe(report)}`);
    item.dataset.topicId = report.topicId; item.dataset.status = report.status;
    if (unreadReports.has(report.topicId)) item.dataset.unread = 'true';
    item.append(...heard(report));
    // A rider who has ridden on can still be read back. Deferred reading is a requirement,
    // and the family's own record is the right place to keep the conversation that brought
    // it: the meeting is what happened, the report is what is remembered.
    const encounter = world.encounter;
    if (encounter && encounter.topicId === report.topicId) {
      const open = element('button', `Read what ${encounter.carrierName} said`, 'report-transcript');
      open.dataset.openEncounter = encounter.id;
      item.append(open);
    }
    return item;
  }));
}
/**
 * The first five minutes, before the teacher has begun.
 *
 * A student who joins early used to be able to do nothing whatever, which taught them that
 * the game is something that happens to them. Now the lobby is where a family gets ready,
 * and this walks a student through doing it: pick somebody, give them a job, understand
 * what the job costs. Every step is a real assignment on their own real family, so a
 * student who finishes the walk-through has not practised - they have started.
 *
 * It cannot show a crop growing, because no clock runs until the teacher begins, and it
 * says so rather than pretending. Skipping is one press and is never asked about again.
 */
const TUTORIAL = [
  {
    id: 'family',
    // Somebody is always selected - the panel opens on the principal - so a step that
    // waited for a selection was a step that had already finished before it was read.
    // It says what is true instead: this is the panel, and it follows whoever you click.
    title: 'This is your family',
    text: 'Your family is down the left of the map: father and mother first, then the children, oldest first. Press a face to go to that person on the map; the card beside them follows whoever you choose. The ox and the wagon are yours too.',
    arriving: 'Your family is on the road in with the wagon, the ox and the horse. When your teacher begins they drive onto their own land, where there is no house yet, and camp by the wagon. Press a face on the left to go to that person.',
    next: 'Go on',
  },
  {
    id: 'work',
    title: 'Give them something to do',
    text: 'The pictures beside each face are what that person can do today: hold the pointer over one to read what it is, and press it to set them to it. It glows while they are at it. Plant the field turns the rows and puts in seed, and it is where a year on this land starts.',
    doing: 'Waiting for somebody to be set to work.',
    done: world => entitiesOf(world).some(person => person.chore),
    // Nobody can start work on the road, so a family still coming in is told what to do once it
    // is there instead of being left waiting on a step it cannot finish.
    arriving: 'The pictures beside each face are what that person can do: hold the pointer over one to read what it is. None of it can start on the road: once they are on their land, press one to set somebody to it. Plant the field turns the rows and puts in seed, and it is where a year on this land starts.',
  },
  {
    id: 'cost',
    title: 'Everything costs something',
    text: 'Planting spends two of your seed and wears the hoe a little. A worn hoe can be mended; seed that has run out has to be fetched from Gonzales, and that is a long walk from some homesteads. Nothing here is free, and nothing is hidden from you.',
    next: 'I see',
  },
  {
    id: 'year',
    title: 'What the land does',
    text: 'A planted field ripens on its own, and then somebody has to bring the crop in before it is food. Food feeds the family; seed plants the next field. Hunting in the timber brings food without spending seed, and takes most of a day.',
    next: 'I see',
  },
  {
    id: 'start',
    title: 'Nothing moves until your teacher begins',
    text: 'No time is passing yet. Everything you have set out here starts the moment your teacher presses Start — and so does everybody else\u2019s, at the same minute. You can keep changing your mind until then.',
    arriving: 'No time is passing yet. The moment your teacher presses Start, every family\u2019s wagon starts in along its own track, all at the same minute, and nothing but the farm and the neighbours will need you for the first day.',
    next: 'Ready',
  },
];
// Remembered per family and per browser, so a reload does not ask again and a student who
// said no is not asked twice. It is a convenience and nothing depends on it: a browser that
// refuses storage simply gets the offer again, which is a much smaller harm than nagging.
const tutorialKey = world => `tr_tutorial_${world?.householdId || 'none'}`;
function tutorialSeen(world) {
  try { return localStorage.getItem(tutorialKey(world)) === 'done'; } catch { return false; }
}
function rememberTutorial(world) {
  try { localStorage.setItem(tutorialKey(world), 'done'); } catch { /* a private window is allowed to forget */ }
}
let tutorialStep = null;
/**
 * Rolling for a family. The number comes from the server; the tumbling is only the dice
 * being thrown, and it stops on whatever the server says. The rule turning the number into
 * people is the server's and is not explained here or anywhere a student reads.
 */
// A twenty-sided die (owner, 2026-09-14): drawn as its outline with the face's number, since no font has twenty faces.
const DIE_SIDES = 20;
let rollState = 'idle', tumble = null, rollStarted = 0;
function stopTumble() { clearInterval(tumble); tumble = null; $('#family-die')?.classList.remove('rolling'); $('#means-die')?.classList.remove('rolling'); }
/**
 * The second die (owner, 2026-09-25: "introduce rolling for starting wealth"; sim/means.mjs): thrown by the same press in a class
 * made since, and stopped on the server's number, with what it gave in the server's own words - the band, what the family comes
 * with, and who of them rides and walks. A class made before has one die, as it always had.
 */
function renderMeansDie(family) {
  const shown = Boolean(family?.meansDie || family?.means);
  $('#means-die').hidden = !shown;
  $('#means-roll-text').hidden = !shown;
  const means = rollState === 'rolled' ? family.means : null;
  $('#means-result').hidden = !means;
  if (!means) return;
  $('#means-die').textContent = String(means.roll);
  $('#means-name').textContent = `${means.name}.`;
  $('#means-words').textContent = means.words;
  $('#means-seats').textContent = means.seats || '';
}
function renderFamilyRoll(world) {
  const panel = $('#family-roll');
  if (!panel) return;
  const family = familyCache;
  if (world.role === 'host' || !world.householdId || !family) { panel.hidden = true; return; }
  if (rollState === 'rolling' && family.roll && Date.now() - rollStarted >= 900) {
    stopTumble();
    rollState = 'rolled';
  }
  if ((rollState === 'idle' && !family.canRoll) || rollState === 'done') { panel.hidden = true; return; }
  // Not before the title screen has been answered (public/creation.js); once the die is in the air it stays until the family
  // has been met, which is what carries the page from the roll to the last name.
  if (rollState === 'idle' && creationStep(world, family) !== 'roll') { panel.hidden = true; return; }
  panel.hidden = false;
  const die = $('#family-die'), button = $('#roll-family');
  renderMeansDie(family);
  if (rollState === 'rolled') {
    die.textContent = String(family.roll);
    // "an 8", "an 11", "an 18": said as they sound, since a twenty-sided die reaches them (sim/family.mjs `rolledWords`).
    const said = roll => `${[8, 11, 18].includes(roll) ? 'an' : 'a'} ${roll}`;
    $('#family-roll-result').textContent = family.means ? `You rolled ${said(family.roll)} for your family and ${said(family.means.roll)} for what it has.` : `You rolled ${said(family.roll)}.`;
    button.textContent = 'Meet your family';
    button.disabled = false;
  } else {
    $('#family-roll-result').textContent = rollState === 'rolling' ? 'Rolling\u2026' : '';
    button.textContent = 'Roll the die';
    button.disabled = rollState === 'rolling';
  }
}
$('#roll-family')?.addEventListener('click', async () => {
  if (rollState === 'rolled') {
    rollState = 'done';
    $('#family-roll').hidden = true;
    // The family is met in the pop-ups that follow (the last name, then how the parents look), not in the journal.
    if (window.__snapshot) render(window.__snapshot);
    return;
  }
  if (rollState !== 'idle') return;
  rollState = 'rolling'; rollStarted = Date.now();
  const die = $('#family-die'), second = $('#means-die');
  const both = [die, ...(second && !second.hidden ? [second] : [])];
  if (!reducedMotion.matches) {
    for (const one of both) one.classList.add('rolling');
    tumble = setInterval(() => { for (const one of both) one.textContent = String(1 + Math.floor(Math.random() * DIE_SIDES)); }, 90);
  } else for (const one of both) one.textContent = '?';
  if (window.__snapshot) renderFamilyRoll(window.__snapshot.world);
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'roll-family' });
    forgetFamily();
    // Let the dice tumble for a moment even when the server answers at once.
    setTimeout(() => { if (window.__snapshot) render(window.__snapshot); }, 950);
    if (window.__snapshot) render(window.__snapshot);
  } catch (error) {
    stopTumble(); rollState = 'idle';
    say(error.message);
    if (window.__snapshot) renderFamilyRoll(window.__snapshot.world);
  }
});
/**
 * Packing the wagon (docs/SETTLING_IN.md step 3).
 *
 * Comes after the die and before the walk-through: who the family is decides what it needs, and
 * the walk-through sets people to work with what was packed. Everything on it is the server's -
 * the list and each thing's space and words from the catalogue, what is loaded from the family's
 * own household, whether it can still be changed from `world.wagon` - and a change the server
 * refuses is shown in the server's own sentence. The panel is rebuilt only when what it shows has
 * changed, so a tick arriving does not take the keyboard focus off the button a student is on.
 */
let wagonPacking = true, wagonOpen = false, wagonPending = false, wagonShown = '';
function renderWagonLoad(world) {
  const panel = $('#wagon-load'), reopen = $('#wagon-open');
  if (!panel) return;
  const wagon = world.wagon, household = world.household, catalogue = wagonCatalogue;
  const available = Boolean(wagon && catalogue && household?.load && world.role !== 'host' && !familyCache?.canRoll && !['rolling', 'rolled'].includes(rollState));
  wagonOpen = available && wagonPacking;
  panel.hidden = !wagonOpen;
  reopen.hidden = !available || wagonPacking;
  if (!available) return;
  const space = wagon.space ?? catalogue.space;
  // A family of the poorest means packs a cart (sim/means.mjs), and the server says so (`wagon.vehicle`).
  const vehicle = wagon.vehicle === 'cart' ? 'cart' : wagon.wagons ? 'wagons' : 'wagon';
  reopen.textContent = `Repack the ${vehicle} (${wagon.used} of ${space})`;
  if (!wagonPacking) return;
  const choice = world.land?.stockChoice;
  const shape = JSON.stringify([household.load, wagon, choice, household.stock]);
  if (shape === wagonShown) return;
  wagonShown = shape;
  // A family fitted out with more than one wagon packs them together, and the server says how many (sim/wagon.mjs).
  $('#wagon-room').textContent = `${wagon.wagons ? `${wagon.wagons} wagons: ` : vehicle === 'cart' ? 'The cart: ' : ''}${wagon.used} of ${space} space filled, ${space - wagon.used} left.`;
  $('#wagon-load-title').textContent = vehicle === 'cart' ? 'Pack the cart' : 'Pack the wagon';
  // What the family carries on foot besides (sim/means.mjs `ARRIVAL_DAYS`), in the server's number: it is not the load's to change.
  $('#wagon-packs').hidden = !wagon.packs;
  $('#wagon-packs').textContent = wagon.packs ? `Besides the ${vehicle}, the family carries ${wagon.packs} food on foot, in sacks and bundles.` : '';
  // Driving stock in: what each answer brings, in acres, animals and wagon space, before it is chosen (FIC-GONZ-008).
  // The herd itself was built on 2026-09-20 (docs/STOCK.md) and this panel went on offering only the acres and the wagon
  // cost, so the largest thing the choice did was never said where the choice was made. The numbers are the server's
  // (`stockChoice.herd`), never written here.
  $('#wagon-stock').hidden = !choice;
  if (choice) {
    $('#stock-no-text').textContent = `No stock. The family holds a labor of land, ${choice.laborAcres} acres, and brings no animals.`;
    const herd = choice.herd ? ` The family arrives with ${choice.herd.cattle} cattle and ${choice.herd.hogs} hogs, which feed themselves on the range and feed the family.` : '';
    $('#stock-yes-text').textContent = `Drive cattle and hogs in. The family holds a league and a labor, ${choice.stockAcres.toLocaleString('en-US')} acres - about ${Math.round(choice.stockAcres / choice.laborAcres)} times as much land - and the herd's keep takes ${choice.space} spaces of the wagon.${herd}`;
    // The server's own sentence when the choice is shut, rather than two controls greyed for no stated reason.
    // ceiling: `stockRefusal` asked without an answer cannot refuse while the panel is up, so this is unreachable today;
    // it is wired because a silently dead control is how the next refusal would arrive invisible.
    $('#wagon-stock-why').textContent = choice.can ? '' : choice.why || '';
    for (const radio of document.querySelectorAll('#wagon-stock input')) {
      radio.checked = (radio.value === 'yes') === Boolean(household.stock);
      radio.disabled = !choice.can;
    }
  }
  if (!wagon.can) $('#wagon-note').textContent = wagon.why;
  const focused = document.activeElement?.closest?.('#wagon-items button')?.dataset.focusKey;
  const loaded = new Map(household.load.map(entry => [entry.id, entry.amount]));
  // Not shut while a change is on its way: a disabled button cannot keep the keyboard focus, and
  // the click handler already ignores a second press until the first is answered.
  const shut = !wagon.can;
  const control = (label, item, amount, key, extra = {}) => {
    const button = element('button', label);
    button.type = 'button';
    Object.assign(button.dataset, { item, amount: String(amount), focusKey: key });
    for (const [name, value] of Object.entries(extra)) button.setAttribute(name, value);
    button.disabled = shut || extra.disabled === 'true';
    return button;
  };
  $('#wagon-items').replaceChildren(...catalogue.items.map(item => {
    const count = loaded.get(item.id) || 0;
    // The most of a store the family's wagons take together, the server's; one wagon's is the catalogue's.
    const most = wagon.most?.[item.id] ?? item.most;
    const li = element('li', ''); li.dataset.item = item.id; li.dataset.loaded = String(count > 0);
    const space = item.space === 1 ? '1 space' : `${item.space} space`;
    li.append(element('span', `${item.name} · ${space}${item.most > 1 ? ' each' : ''}`, 'wagon-name'));
    const controls = element('span', '', 'wagon-controls');
    if (item.most > 1) {
      controls.append(
        control('−', item.id, count - 1, `${item.id}-less`, { 'aria-label': `One less: ${item.name}`, ...(count === 0 && { disabled: 'true' }) }),
        element('span', String(count), 'wagon-count'),
        control('+', item.id, count + 1, `${item.id}-more`, { 'aria-label': `One more: ${item.name}`, ...(count >= most && { disabled: 'true' }) }),
      );
    } else {
      // The label says what pressing does, not what the thing is. "Loaded" named a state, and pressing it took the thing
      // out - the same hidden second interaction the map click was in the tutorial (2026-09-21).
      controls.append(control(count ? 'Take out' : 'Load', item.id, count ? 0 : 1, `${item.id}-toggle`, { 'aria-pressed': String(Boolean(count)), 'aria-label': `${item.name}: ${count ? 'loaded, press to take it out' : 'not loaded, press to load it'}` }));
    }
    li.append(controls, element('span', item.describe, 'wagon-describe'));
    return li;
  }));
  if (focused) $(`#wagon-items button[data-focus-key="${focused}"]`)?.focus();
}
$('#wagon-items')?.addEventListener('click', async event => {
  const button = event.target.closest('button[data-item]');
  if (!button || button.disabled || wagonPending) return;
  wagonPending = true; $('#wagon-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'load-wagon', item: button.dataset.item, amount: Number(button.dataset.amount) });
  } catch (error) {
    $('#wagon-note').textContent = error.message;
  } finally {
    wagonPending = false;
    if (window.__snapshot) render(window.__snapshot);
  }
});
$('#wagon-stock')?.addEventListener('change', async event => {
  const radio = event.target.closest('input[name="wagon-stock"]');
  if (!radio || wagonPending) return;
  wagonPending = true; $('#wagon-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'bring-stock', stock: radio.value === 'yes' });
  } catch (error) {
    $('#wagon-note').textContent = error.message;
  } finally {
    wagonPending = false; wagonShown = '';
    if (window.__snapshot) render(window.__snapshot);
  }
});
// Play Solo has no teacher to press Start, so this button is the Start (owner, 2026-09-21). In a class it only puts the
// panel away, exactly as before: the teacher decides when the class begins.
$('#wagon-done')?.addEventListener('click', async () => {
  wagonPacking = false;
  const solo = window.__snapshot?.solo, lobby = window.__snapshot?.world?.status === 'lobby';
  if (solo && lobby) await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'begin-solo' });
  if (window.__snapshot) render(window.__snapshot);
  $('#wagon-open')?.focus();
});
$('#wagon-open')?.addEventListener('click', () => { wagonPacking = true; wagonShown = ''; if (window.__snapshot) render(window.__snapshot); $('#wagon-done')?.focus(); });
/**
 * Choosing the house (docs/SETTLING_IN.md step 4).
 *
 * Opened by the family, never pushed at them: a button beside the wagon's, for as long as the house
 * can still be chosen. Each house shows what it needs, how much work it is, what it holds, and its
 * two numbers and its good and bad - all from the catalogue - and whether the family can choose it
 * now, from the server. Rebuilt only when what it shows has changed, so the focus stays put.
 */
let housePlanOpen = false, housePending = false, houseShown = '';
const ownLandView = land => land.cabin === 'ruined' ? { shelter: 'ruined' }
  : land.shelter === 'camp' ? (land.house?.work > 0 ? { shelter: 'building', layout: land.house.layout, phase: land.house.phase } : { shelter: 'camp' })
  : { shelter: 'house', ...(land.house && { layout: land.house.layout }) };
const TOOL_WORDS = { axe: 'a felling axe', broadaxe: 'a broadaxe' };
/** A share as a student reads it: "1 part", "1.5 parts", "115 parts". */
function partsIn100(share) {
  const parts = Math.round(share * 1000) / 10;
  return `${Number.isInteger(parts) ? parts : parts.toFixed(1)} ${parts === 1 ? 'part' : 'parts'}`;
}
function renderHousePlan(world) {
  const panel = $('#house-plan'), open = $('#house-open');
  if (!panel) return;
  // A family that plans its house piece by piece has the house plot instead (public/house-plot.js), open while it builds.
  if (plotted(world, plotCatalogue)) {
    panel.hidden = true;
    const available = !familyCache?.canRoll && !['rolling', 'rolled'].includes(rollState) && !wagonOpen;
    open.hidden = !available || housePlanOpen;
    open.textContent = world.land.house ? 'Your house' : 'Choose a house';
    renderHousePlot(world, plotCatalogue, { open: available && housePlanOpen, drawSprite, spriteFrame, place: beginHousePlacement, send: command => api('/api/command', { ...command, id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}` }), rerender: () => window.__snapshot && render(window.__snapshot) });
    return;
  }
  renderHousePlot(world, plotCatalogue || { pieces: [], plans: [] }, { open: false });
  const choices = world.land?.choices;
  const available = Boolean(choices && houseCatalogue && world.role !== 'host' && !familyCache?.canRoll && !['rolling', 'rolled'].includes(rollState) && !wagonOpen);
  panel.hidden = !(available && housePlanOpen);
  open.hidden = !available || housePlanOpen;
  if (!available) return;
  const chosen = world.land.house?.layout;
  open.textContent = chosen ? `House: ${houseCatalogue.get(chosen)?.name || chosen}` : 'Choose a house';
  if (!housePlanOpen) return;
  const shape = JSON.stringify([choices, chosen]);
  if (shape === houseShown) return;
  houseShown = shape;
  const focused = document.activeElement?.closest?.('#house-options button')?.dataset.layout;
  $('#house-options').replaceChildren(...choices.map(choice => {
    const house = houseCatalogue.get(choice.id);
    const li = element('li', ''); li.dataset.layout = choice.id; li.dataset.chosen = String(chosen === choice.id);
    li.append(element('p', house.name, 'house-name'), element('p', house.describe, 'house-line'));
    li.append(element('p', `Needs ${house.needs.length ? house.needs.map(tool => TOOL_WORDS[tool] || tool).join(' and ') : 'no axe at all'}. About ${house.hours} hours of one person's work, and fewer with more hands. Holds ${house.room} before it is crowded.`, 'house-line'));
    li.append(element('p', `Rest in it mends ${partsIn100(house.restShare)} in 100 of the usual; ${house.spoilagePerDay ? `${partsIn100(house.spoilagePerDay)} in 100 of the food spoil a day` : 'the food keeps'}.`, 'house-line'));
    li.append(element('p', house.good, 'house-line house-good'), element('p', house.bad, 'house-line house-bad'));
    const button = element('button', chosen === choice.id ? 'Chosen' : 'Build this');
    button.type = 'button'; button.dataset.layout = choice.id;
    button.setAttribute('aria-pressed', String(chosen === choice.id));
    button.disabled = !choice.can;
    li.append(button);
    if (!choice.can) li.append(element('p', choice.why, 'house-line house-bad'));
    return li;
  }));
  if (focused) $(`#house-options button[data-layout="${focused}"]`)?.focus();
}
$('#house-options')?.addEventListener('click', async event => {
  const button = event.target.closest('button[data-layout]');
  if (!button || button.disabled || housePending) return;
  housePending = true; $('#house-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'plan-house', layout: button.dataset.layout });
  } catch (error) {
    $('#house-note').textContent = error.message;
  } finally {
    housePending = false;
    if (window.__snapshot) render(window.__snapshot);
  }
});
// Where the house stands (sim/homesite.mjs). The family taps its own land, the server says what the place is like and
// lays the lane it would have, and the family sets the house there or looks somewhere else. The server decides.
let sitePick = null, siteLookPending = false, siteSetPending = false;
const siteLooking = () => Boolean(window.__snapshot?.world?.land?.choosingSite?.can);
async function lookAtSite(point) {
  if (siteLookPending) return;
  siteLookPending = true; sitePick = { point, facts: null }; $('#site-note').textContent = '';
  if (window.__snapshot) render(window.__snapshot);
  try {
    const result = await api(`/api/site?x=${point.x.toFixed(3)}&y=${point.y.toFixed(3)}`);
    if (sitePick?.point === point) sitePick.facts = result.facts;
  } catch (error) { $('#site-note').textContent = error.message; }
  finally { siteLookPending = false; if (window.__snapshot) render(window.__snapshot); }
}
// Survey, clearing and fencing (sim/survey.mjs, docs/LAND_GRANTS.md §4-5): the student picks one of the family and the
// work, taps a place on the family's land - new ground to survey, or one of its plots to clear or fence - is told what it
// is, and sends them. The server decides, both when looking and when sent.
let surveyFor = null, plotJob = 'survey-plot', plotPick = null, plotLookPending = false, plotSendPending = false;
const PLOT_JOB_WORDS = {
  'survey-plot': { title: name => `Where ${name} surveys`, hint: 'Tap a place on your land, inside the dashed line, to look at ten acres there.', send: 'Survey it' },
  'clear-plot': { title: name => `Which plot ${name} clears`, hint: 'Tap one of your staked plots to look at the clearing it wants.', send: 'Clear it' },
  'fence-plot': { title: name => `Which plot ${name} fences`, hint: 'Tap one of your cleared plots to rail it in.', send: 'Fence it' },
  'fell-trees': { title: name => `Where ${name} fells`, hint: 'Tap timber on your land, inside the dashed line, to see what stands there to fell.', send: 'Fell there' },
  'hunt-land': { title: name => `Where ${name} hunts`, hint: 'Tap a place on your land, inside the dashed line, to see what game there is there.', send: 'Hunt there' },
};
const surveyLooking = () => Boolean(surveyFor && window.__snapshot?.world?.entities?.some(entity => entity.id === surveyFor));
async function lookAtPlot(point) {
  if (plotLookPending) return;
  plotLookPending = true; plotPick = { point, facts: null }; $('#survey-note').textContent = '';
  if (window.__snapshot) render(window.__snapshot);
  try {
    const job = plotJob === 'survey-plot' ? '' : `&job=${plotJob}`;
    const result = await api(`/api/plot?x=${point.x.toFixed(3)}&y=${point.y.toFixed(3)}${job}`);
    if (plotPick?.point === point) plotPick.facts = result.facts;
  } catch (error) { $('#survey-note').textContent = error.message; }
  finally { plotLookPending = false; if (window.__snapshot) render(window.__snapshot); }
}
function renderSurvey(world) {
  const panel = $('#survey-choose');
  if (!panel) return;
  const person = surveyLooking() && world.entities.find(entity => entity.id === surveyFor);
  panel.hidden = !person || world.role === 'host';
  if (panel.hidden) { if (!person) { surveyFor = null; plotPick = null; } return; }
  const facts = plotPick?.facts, words = PLOT_JOB_WORDS[plotJob];
  $('#survey-eyebrow').textContent = plotJob === 'survey-plot' ? 'SURVEY' : plotJob === 'clear-plot' ? 'CLEARING' : plotJob === 'hunt-land' ? 'HUNTING' : plotJob === 'fell-trees' ? 'FELLING' : 'FENCING';
  $('#survey-title').textContent = words.title(person.name);
  // Survey's facts say what the clearing would be; a plot's words already carry it. A refusal still names the plot.
  const surveyWork = plotJob === 'survey-plot' && facts?.spells ? ` Clearing it would be ${facts.spells} spells of work.` : '';
  $('#survey-text').textContent = !plotPick ? words.hint
    : !facts ? 'Looking the ground over…' : facts.can ? `${facts.words}${surveyWork}` : [facts.words, facts.why].filter(Boolean).join(' ');
  $('#survey-send').textContent = words.send;
  $('#survey-send').hidden = !facts?.can;
  $('#survey-send').disabled = plotSendPending;
}
$('#survey-send')?.addEventListener('click', async () => {
  if (!plotPick?.facts?.can || plotSendPending) return;
  plotSendPending = true; $('#survey-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: plotJob, entityId: surveyFor, x: +plotPick.point.x.toFixed(3), y: +plotPick.point.y.toFixed(3) });
    surveyFor = null; plotPick = null;
  } catch (error) { $('#survey-note').textContent = error.message; }
  finally { plotSendPending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#survey-cancel')?.addEventListener('click', () => { surveyFor = null; plotPick = null; if (window.__snapshot) render(window.__snapshot); });
function renderSite(world) {
  const panel = $('#site-choose');
  if (!panel) return;
  const choosing = world.land?.choosingSite;
  panel.hidden = !choosing || world.role === 'host';
  if (panel.hidden) { sitePick = null; return; }
  $('#house-open').hidden = true;
  const facts = sitePick?.facts;
  $('#site-text').textContent = !choosing.can ? choosing.why
    : !sitePick ? 'Tap a place on your land, inside the dashed line, to look it over.'
    : !facts ? 'Looking the place over…'
    : facts.can ? facts.words : facts.why;
  $('#site-build').hidden = !facts?.can;
  $('#site-build').disabled = siteSetPending;
}
$('#site-build')?.addEventListener('click', async () => {
  if (!sitePick?.facts?.can || siteSetPending) return;
  siteSetPending = true; $('#site-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'choose-site', x: +sitePick.point.x.toFixed(3), y: +sitePick.point.y.toFixed(3) });
    sitePick = null;
  } catch (error) { $('#site-note').textContent = error.message; }
  finally { siteSetPending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#house-open')?.addEventListener('click', () => { housePlanOpen = true; houseShown = ''; if (window.__snapshot) render(window.__snapshot); $('#house-close')?.focus(); });
$('#plot-close')?.addEventListener('click', () => { housePlanOpen = false; if (window.__snapshot) render(window.__snapshot); $('#house-open')?.focus(); });
$('#house-close')?.addEventListener('click', () => { housePlanOpen = false; if (window.__snapshot) render(window.__snapshot); $('#house-open')?.focus(); });
/**
 * The guided start over the map (public/lesson.js, owner 2026-09-21): one task at a time, said in the server's words,
 * with no control of its own.
 *
 * The guide button locates an existing control; it never advances a lesson. The world
 * is what says a step is finished. The strip is rewritten
 * only when its words change, because it is redrawn on every tick like everything else on this page.
 */
let lessonKey = null;
let lessonTarget = null;
/**
 * How much room the strip is taking, for the one screen where nothing can be put beside it. On a phone the family is a
 * band across the top rather than a column down the side, so the strip and the family want the same place; the column
 * starts below the strip instead, by this much. Zero - the property removed - the moment there is no lesson, so a class
 * that has finished the ten gets its whole screen back.
 */
const lessonRoom = () => {
  const panel = $('#lesson');
  if (!panel || panel.hidden) { document.body.style.removeProperty('--lesson-room'); return; }
  document.body.style.setProperty('--lesson-room', `${Math.round(panel.getBoundingClientRect().height)}px`);
};
addEventListener('resize', lessonRoom);
function guideLesson(world) {
  const lesson = lessonShowing(world), help = $('#lesson-help'), action = $('#lesson-action');
  lessonTarget = null;
  action.hidden = true;
  help.textContent = '';
  if (!lesson) return;
  const reveal = (target, label, text) => {
    lessonTarget = target; action.textContent = label; action.hidden = false; help.textContent = text;
  };
  if (world.status === 'paused') { help.textContent = 'The class is paused. Work continues when the teacher resumes.'; return; }
  // A map placement or a question already in progress takes precedence over starting more work.
  for (const [selector, text] of [
    ['#site-choose', 'Click a spot inside your land on the map, review the site, then press “Set the house here”.'],
    ['#survey-choose', 'Click the ground on the map. Review the highlighted place, then confirm it in the placement panel.'],
    ['#house-plot', 'Choose a house plan here first. Then close the plan and assign someone to gather logs or build.'],
    ['#house-plan', 'Choose a house here first. Then assign a family member to build it.'],
  ]) {
    const panel = $(selector);
    if (panel && !panel.hidden) {
      reveal(panel, 'Show placement controls', text); return;
    }
  }
  const asking = world.entities?.find(person => world.household?.members?.includes(person.id) && person.chore?.ask);
  if (asking) {
    reveal({ person: asking.id, question: true }, `Answer ${asking.given || asking.name}`, 'Work is waiting for your answer. Open the question to continue.'); return;
  }
  if (['order', 'house'].includes(lesson.step) && !world.land?.house && lesson.allow?.includes('plan-house') && !$('#house-open')?.hidden) {
    reveal({ open: '#house-open' }, 'Choose your house plan', 'Before anyone can build, choose a plan. Then assign an adult to gather materials and build it.'); return;
  }
  const rows = [...panelRows.values()].sort((a, b) => Number(b.item.dataset.focused === 'true') - Number(a.item.dataset.focused === 'true'));
  for (const row of rows) {
    const buttons = [...row.icons.querySelectorAll('.panel-icon')];
    const icons = buttons.map(button => ({ key: button.dataset.key, kind: button.dataset.chore ? 'chore' : 'order', can: button.getAttribute('aria-disabled') !== 'true', active: button.dataset.active === 'true' }));
    const key = pointedKey(lesson, icons);
    const button = buttons.find(one => one.dataset.key === key);
    if (button) {
      const person = world.entities.find(one => one.id === button.dataset.entityId);
      reveal({ person: button.dataset.entityId, key }, `Show ${button.dataset.name}`, `Select ${person?.given || person?.name || 'your family member'}, then press “${button.dataset.name}” in the bottom bar. This button finds it for you.`);
      return;
    }
  }
  const busy = world.entities?.find(person => world.household?.members?.includes(person.id) && person.chore);
  help.textContent = world.status === 'paused' ? 'The class is paused. Work continues when the teacher resumes.'
    : world.land?.arriving ? 'Your wagon is travelling to your land. The next instruction appears when it arrives.'
    : busy ? `${busy.given || busy.name} is working. Watch their progress, or select another adult to help. A ! beside a portrait means they need an answer.`
    : 'Select an adult’s portrait, then read the named actions at the bottom. Unavailable actions explain what is missing when selected.';
}
$('#lesson-action')?.addEventListener('click', async () => {
  const target = lessonTarget;
  if (!target) return;
  if (target.open) { $(target.open)?.click(); return; }
  if (target.person) {
    if (target.question) { openNeed(target.person); return; }
    await chooseFocus(target.person);
    goToPerson(target.person);
    const button = panelRows.get(target.person)?.icons.querySelector(`[data-key="${target.key}"]`);
    button?.scrollIntoView({ block: 'nearest', inline: 'center' });
    button?.focus();
    if (button) showPanelTip(button);
  } else {
    target.scrollIntoView({ block: 'nearest' });
    const control = target.querySelector('button:not([hidden]):not(:disabled)');
    control?.focus();
  }
});
/**
 * The X on the strip (owner, 2026-09-22: "i should be able to X off the tutorial to stop it and just do what i want";
 * asked who gets it, "Everyone, always"). It asks once, in the strip and in plain words, because the server keeps the
 * stop for good (sim/lesson.mjs `stopLesson`). The page decides nothing: it sends `stop-lesson`, and the strip goes when
 * the next snapshot arrives without a lesson, exactly as it does for a family that finished the ten.
 */
let lessonStopping = false;
function askStopLesson(asking) {
  const ask = $('#lesson-stop-ask');
  if (!ask || ask.hidden === !asking) return;
  ask.hidden = !asking;
  $('#lesson-stop').setAttribute('aria-expanded', String(asking));
  if (!asking) $('#lesson-stop-words').textContent = 'Stop the guided start? You won’t be walked through the rest. For five minutes, a “Resume tutorial” button can bring it back.';
  lessonRoom();
}
$('#lesson-stop')?.addEventListener('click', () => {
  const asking = $('#lesson-stop-ask').hidden;
  askStopLesson(asking);
  (asking ? $('#lesson-stop-no') : $('#lesson-stop'))?.focus();
});
$('#lesson-stop-no')?.addEventListener('click', () => { askStopLesson(false); $('#lesson-stop')?.focus(); });
$('#lesson-stop-yes')?.addEventListener('click', async () => {
  if (lessonStopping) return;
  lessonStopping = true; $('#lesson-stop-yes').disabled = true;
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'stop-lesson' });
    // The old walk-through is kept for a family with no lesson; one that has just said "let me do what I want" is not
    // offered it in the lesson's place.
    if (window.__snapshot) { rememberTutorial(window.__snapshot.world); tutorialStep = 'gone'; }
    askStopLesson(false);
  } catch (error) {
    $('#lesson-stop-words').textContent = error.message;
  } finally {
    lessonStopping = false; $('#lesson-stop-yes').disabled = false;
  }
});
/**
 * "Resume tutorial" (owner, 2026-09-22: "show a small 'Resume tutorial' button for five real minutes from the original
 * dismissal, including across reloads"). The server says whether there is an offer and how many milliseconds are left of
 * it (`world.lessonResume`, sim/lesson.mjs `lessonResumeOffer`); the page counts that down on its own clock from the
 * moment it heard it, so the button goes when the window does even while the class is paused and no snapshot comes, and a
 * Chromebook whose clock is wrong makes no difference. The earliest deadline heard for one window is kept: a page drawn
 * again from an older snapshot cannot stretch it. The press only asks; the strip comes back when the server's next
 * snapshot carries the lesson.
 */
let resumeUntil = null, resumeDeadline = Infinity, resumeTimer = null, lessonResuming = false;
function renderLessonResume(world) {
  const button = $('#lesson-resume');
  if (!button) return;
  const offer = world?.role !== 'host' && !lessonShowing(world) ? world?.lessonResume : null;
  clearTimeout(resumeTimer); resumeTimer = null;
  if (!offer || !(offer.ms > 0)) { button.hidden = true; resumeUntil = null; resumeDeadline = Infinity; return; }
  if (offer.until !== resumeUntil) { resumeUntil = offer.until; resumeDeadline = Infinity; }
  resumeDeadline = Math.min(resumeDeadline, performance.now() + offer.ms);
  const left = resumeDeadline - performance.now();
  button.hidden = left <= 0;
  if (left > 0) resumeTimer = setTimeout(() => { button.hidden = true; }, left);
}
$('#lesson-resume')?.addEventListener('click', async () => {
  if (lessonResuming) return;
  lessonResuming = true; $('#lesson-resume').disabled = true;
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'resume-lesson' });
  } catch (error) {
    say(error.message);
  } finally {
    lessonResuming = false; $('#lesson-resume').disabled = false;
  }
});
function renderLesson(world) {
  renderLessonResume(world);
  const panel = $('#lesson');
  if (!panel) return;
  const words = lessonWords(lessonShowing(world) || (world.role !== 'host' && world.lesson?.done ? world.lesson : null));
  document.body.dataset.lesson = String(Boolean(words));
  // The X is on a running step only: the closing card goes away by itself, and there is nothing left to stop.
  const stoppable = Boolean(lessonShowing(world));
  $('#lesson-stop').hidden = !stoppable;
  if (!stoppable) askStopLesson(false);
  if (!words) { panel.hidden = true; lessonKey = null; lessonRoom(); return; }
  panel.hidden = false;
  guideLesson(world);
  const key = JSON.stringify(words);
  if (lessonKey === key) { lessonRoom(); return; }
  lessonKey = key;
  $('#lesson-step').textContent = words.eyebrow;
  $('#lesson-title').textContent = words.title;
  $('#lesson-says').textContent = words.says;
  $('#lesson-did').textContent = words.did;
  $('#lesson-did').hidden = !words.did;
  // One pip a step, filled up to where the world says the student is. Type only: it repeats the numbers already said.
  const pips = $('#lesson-pips');
  if (words.of && pips.children.length !== words.of) pips.replaceChildren(...Array.from({ length: words.of }, () => element('span', '', 'lesson-pip')));
  if (!words.of) pips.replaceChildren();
  [...pips.children].forEach((pip, at) => setData(pip, 'done', String(at < words.done)));
  // Said once, as a status, for somebody who cannot see the ring round the icon.
  $('#lesson-read').textContent = lessonAnnouncement(words);
  lessonRoom();
}
/**
 * Whether the guided start shuts one action now, for a control that is not an icon on the ability bar (public/lesson.js).
 * The same reading as the bar's, so the two cannot disagree; the server refuses either of them in words regardless.
 */
function shutByLesson(world, key, kind = 'order') {
  const lesson = lessonShowing(world);
  return lessonLocks(lesson) && !allowsIcon(lesson, { key, kind });
}
function renderTutorial(world) {
  const panel = $('#tutorial');
  // A rider standing in the yard outranks a lesson in how to hold a hoe, and the two use
  // the same corner of the screen.
  // The die comes first: the walk-through sets people to work, and a family that has been
  // set to work can no longer be rolled.
  // The offered walk-through is the old, skippable one. Where the server is leading the class itself (`world.lesson`),
  // it is not offered at all: two lessons at once is worse than either.
  const busy = world.role === 'host' || !world.householdId || world.encounter?.status === 'open' || familyCache?.canRoll || ['rolling', 'rolled'].includes(rollState) || wagonOpen || housePlanOpen
    || Boolean(lessonShowing(world))
    // The house site comes before the walk-through's work: it waits until the family has said where the house stands.
    || Boolean(world.land?.choosingSite);
  if (busy || tutorialStep === 'gone' || (tutorialStep === null && tutorialSeen(world))) { panel.hidden = true; return; }
  panel.hidden = false;
  if (tutorialStep === null) {
    $('#tutorial-step').textContent = world.status === 'lobby' ? 'BEFORE THE CLASS BEGINS' : 'ANY TIME';
    $('#tutorial-title').textContent = 'New to this?';
    $('#tutorial-text').textContent = world.land?.arriving
      ? 'A short walk-through shows you your family and what they can do once they are on their land. It takes about a minute.'
      : 'A short walk-through sets your family up for the day. It takes about a minute, and what you do in it is real: your family will be at work when the class starts.';
    $('#tutorial-doing').hidden = true;
    $('#tutorial-next').textContent = 'Show me how';
    $('#tutorial-skip').textContent = 'No thanks, let me get on with it';
    return;
  }
  const step = TUTORIAL[tutorialStep];
  if (!step) { panel.hidden = true; return; }
  const onTheRoad = Boolean(world.land?.arriving && step.arriving);
  const satisfied = onTheRoad || !step.done || step.done(world);
  $('#tutorial-step').textContent = `STEP ${tutorialStep + 1} OF ${TUTORIAL.length}`;
  $('#tutorial-title').textContent = step.title;
  $('#tutorial-text').textContent = onTheRoad ? step.arriving : step.text;
  // What the step is waiting for, in the step's own words, and only while it is waiting.
  $('#tutorial-doing').hidden = satisfied || !step.doing;
  $('#tutorial-doing').textContent = step.doing || '';
  $('#tutorial-next').textContent = tutorialStep === TUTORIAL.length - 1 ? 'Finish' : step.next || 'Next';
  $('#tutorial-next').disabled = !satisfied;
  $('#tutorial-skip').textContent = 'Skip the rest';
}
$('#tutorial-next')?.addEventListener('click', () => {
  tutorialStep = tutorialStep === null ? 0 : tutorialStep + 1;
  if (tutorialStep >= TUTORIAL.length) {
    tutorialStep = 'gone';
    if (window.__snapshot) rememberTutorial(window.__snapshot.world);
  }
  if (window.__snapshot) renderTutorial(window.__snapshot.world);
});
$('#tutorial-skip')?.addEventListener('click', () => {
  tutorialStep = 'gone';
  if (window.__snapshot) { rememberTutorial(window.__snapshot.world); renderTutorial(window.__snapshot.world); }
});

// The meeting. Opened by hand and never by the renderer: taking the screen away from a
// student who is in the middle of giving somebody an order is the one thing
// LIVING_INFORMATION.md's attention gate forbids outright. So the world puts up an
// invitation - a mark over the person, a line in the roster, a prompt on the map - and
// the student decides when to go and listen.
let militarySession = null, militarySeen = new Set(), militaryCollapsed = false, militarySelected = null;
function renderMilitaryNotice(world) {
  const panel = $('#military-notice');
  const notices = militaryNotices(world);
  panel.hidden = !notices.length;
  if (!notices.length) return;
  const session = `${window.__snapshot?.sessionId}:${world.householdId}:military-notices`;
  if (session !== militarySession) {
    militarySession = session;
    try { militarySeen = new Set(JSON.parse(sessionStorage.getItem(session) || '[]')); } catch { militarySeen = new Set(); }
    militaryCollapsed = militarySeen.size > 0;
  }
  const fresh = notices.find(notice => !militarySeen.has(notice.id));
  if (fresh) { militaryCollapsed = false; militarySelected = fresh.id; }
  for (const notice of notices) militarySeen.add(notice.id);
  try { sessionStorage.setItem(session, JSON.stringify([...militarySeen])); } catch { /* private browsers still work */ }
  const notice = notices.find(one => one.id === militarySelected) || notices[0];
  militarySelected = notice.id;
  const write = (id, text) => { if ($(id).textContent !== text) $(id).textContent = text; };
  write('#military-toggle', `${militaryCollapsed ? 'Open messages' : 'Keep playing'} · ${notices.length}`);
  $('#military-toggle').setAttribute('aria-expanded', String(!militaryCollapsed));
  $('#military-message').hidden = militaryCollapsed;
  write('#military-title', notice.title);
  write('#military-words', notice.text);
  write('#military-go', notice.action);
  $('#military-next').hidden = notices.length < 2;
  // Below the guided start and below an open land chooser, never over either one's words or buttons (panels proof, 390px).
  const above = ['#lesson', '#lesson-resume', '#site-choose', '#survey-choose'].map(selector => $(selector)).filter(one => one && !one.hidden);
  const top = Math.max(44, ...above.map(one => one.getBoundingClientRect().bottom + 8));
  panel.style.top = `${top}px`;
  // On a phone the card is as wide as the screen, so it starts right of the family's faces and their "!": it must never
  // cover the other way to the same question (panels proof, 390px).
  const faces = innerWidth < 760 ? [...document.querySelectorAll('#family-panel .panel-portrait, #family-panel .panel-attention:not([hidden])')]
    .map(one => one.getBoundingClientRect()).filter(box => box.width && box.right < innerWidth / 2).map(box => box.right + 8) : [];
  const left = faces.length ? `${Math.round(Math.max(...faces))}px` : '';
  if (panel.style.left !== left) panel.style.left = left;
}
$('#military-toggle')?.addEventListener('click', () => {
  militaryCollapsed = !militaryCollapsed;
  renderMilitaryNotice(window.__snapshot?.world);
});
$('#military-next')?.addEventListener('click', () => {
  const notices = militaryNotices(window.__snapshot?.world);
  militarySelected = notices[(notices.findIndex(one => one.id === militarySelected) + 1) % notices.length]?.id;
  renderMilitaryNotice(window.__snapshot?.world);
});
$('#military-go')?.addEventListener('click', async () => {
  const world = window.__snapshot?.world;
  const notice = militaryNotices(world).find(one => one.id === militarySelected);
  if (!notice) return;
  militaryCollapsed = true;
  renderMilitaryNotice(world);
  const person = entitiesOf(world).find(one => one.id === notice.entityId);
  if (notice.entityId !== focusedId && person && !(person.age < 10) && !['dead', 'captured'].includes(person.health?.condition)) await chooseFocus(notice.entityId);
  goToPerson(notice.entityId);
  if (notice.kind === 'siege') $('#selection-close')?.focus();
  else openNeed(notice.entityId);
});
let encounterOpen = false, lastEncounterId = null;
/**
 * A conversation happens a line at a time.
 *
 * Every word here is the server's - this only decides *when* each line appears, which is
 * presentation and nothing else. Handing a student the whole exchange at once made a
 * meeting read as a document that had already happened; taking turns makes it read as two
 * people talking, which is what it is, and it gives the rider on the map time to be drawn
 * speaking (`speaking` is already a short window after each line, in sim/encounters.mjs).
 *
 * Three rules keep it honest. Nothing is ever withheld that the family has not heard - the
 * lines are already theirs the moment the server wrote them, and the journal has all of
 * them whatever this is doing. A conversation is paced once and never replayed: closing
 * the panel and opening it again shows what was already read, not the scene over. And
 * `prefers-reduced-motion` turns the whole thing off, because a line that arrives on its
 * own schedule is motion.
 */
let sayFor = null, sayCount = 0, sayAt = 0, sayTimer = null;
// Long enough to read the line before the next one lands, short enough that nobody waits
// on the interface. Measured from the line just shown, not from a fixed beat: a one-word
// answer should not sit for as long as a paragraph.
const speakingBeat = line => Math.max(450, Math.min(2200, 260 + (line?.text?.length || 0) * 11));
function renderEncounter(world) {
  const encounter = world.encounter;
  const live = encounter?.status === 'open';
  if (encounter && encounter.id !== lastEncounterId) { lastEncounterId = encounter.id; encounterOpen = false; }
  const listener = entitiesOf(world).find(person => person.id === encounter?.listenerId);
  const name = listener?.name || 'Someone';
  // The arrival is a rider drawn at the gate with a mark over the person he stopped, and
  // a Listen button on that person's own panel. Nothing floats over the map about it.
  // This line is the same thing said for a screen reader, which cannot see either - and,
  // like the mark, it names who met whom and nothing at all about the news: finding that
  // out is what listening is for.
  // Travis's runner inside the Alamo (sim/alamo-runner.mjs) is a man of the garrison on foot, waiting for an answer.
  const runner = encounter?.kind === 'alamo-runner';
  $('#arrival').textContent = live && world.role !== 'host' ? (runner ? `${encounter.carrierName} has come from Colonel Travis to speak with ${name}. Choose ${name} and listen.` : `${name} has met a rider. Choose ${name} and listen.`) : '';
  const panel = $('#encounter');
  panel.hidden = !encounter || !encounterOpen || world.role === 'host';
  // Every way in - the panel's "!", Listen, the mark on the map - comes through here, so the bar is told here.
  renderScreenMoments();
  if (panel.hidden) return;
  panel.dataset.encounterId = encounter.id;
  panel.dataset.status = encounter.status;
  $('#encounter-title').textContent = `${name} and ${encounter.carrierName}`;
  // Where it came from and how old it is, which is the part a report line could never
  // carry: this rider left somewhere, at a time, and the thing itself is older still.
  // Where this came from, and through how many people. The first-hand line is short
  // because there is nothing between the family and the thing itself; the second-hand one
  // is longer because that is the point, and a student far from Gonzales should be able to
  // see at a glance that the person at their gate was told this by somebody else.
  if (runner) $('#encounter-origin').textContent = encounter.origin;
  else {
    const chain = encounter.firsthand
      ? `Rode from ${encounter.origin}`
      : `Had it from ${encounter.toldBy} at ${encounter.toldAt} · ${handLabel(encounter.hands)} out of ${encounter.origin}`;
    $('#encounter-origin').textContent = `${chain} · ${timeLabel(encounter.rodeForMinutes)} on the road · already ${timeLabel(encounter.observedAgoMinutes)} old when they set out`;
  }
  // How much of the conversation has been said out loud so far.
  const lines = encounter.said;
  if (sayFor !== encounter.id) { sayFor = encounter.id; sayCount = 0; sayAt = 0; }
  const now = performance.now();
  if (reducedMotion.matches) { sayCount = lines.length; sayAt = 0; }
  else {
    // The first line is there the moment the panel opens - the rider has already spoken,
    // and making a student wait to be greeted is the interface talking about itself.
    if (sayCount === 0 && lines.length) { sayCount = 1; sayAt = 0; }
    while (sayCount < lines.length && sayAt && now >= sayAt) { sayCount++; sayAt = 0; }
    if (sayCount < lines.length && !sayAt) sayAt = now + speakingBeat(lines[sayCount - 1]);
  }
  const shown = lines.slice(0, sayCount);
  const speakingNow = sayCount < lines.length ? lines[sayCount] : null;
  const who = line => line.speaker === 'rider' ? encounter.carrierName : name;
  $('#encounter-said').replaceChildren(...shown.map(line => {
    const item = element('li', line.text);
    item.dataset.speaker = line.speaker;
    item.prepend(element('span', who(line), 'said-who'));
    return item;
  }), ...(speakingNow ? [(() => {
    // Somebody is about to say something. Named, so it is plainly a person taking their
    // turn rather than the interface loading.
    const item = element('li', '');
    item.dataset.speaker = speakingNow.speaker;
    item.dataset.pending = 'true';
    item.prepend(element('span', who(speakingNow), 'said-who'));
    item.append(element('span', '', 'said-pending'));
    return item;
  })()] : []));
  clearTimeout(sayTimer);
  if (speakingNow) sayTimer = setTimeout(() => { if (window.__snapshot) renderEncounter(window.__snapshot.world); }, Math.max(30, sayAt - now));
  // Presentation evidence, same contract as `__viewEntities`: how much of the exchange is
  // on screen against how much the family has been told. A proof needs to be able to see
  // that those converge, and that nothing is held back for ever.
  window.__conversation = { id: encounter.id, revealed: shown.length, total: lines.length };
  $('#encounter-asks').hidden = Boolean(speakingNow);
  $('#encounter-asks').replaceChildren(...encounter.questions.map(question => {
    const button = element('button', question.ask, 'ask-option');
    button.dataset.action = 'ask-rider';
    button.dataset.lineId = question.id;
    button.dataset.entityId = encounter.listenerId;
    button.disabled = world.status !== 'running';
    return button;
  }));
  // The runner's two answers are the courier question's own (sim/alamo.mjs `answerCourier`), sent as the card sends them.
  for (const choice of runner ? encounter.choices || [] : []) {
    const button = element('button', choice.label, 'ask-option');
    button.dataset.action = 'alamo-courier'; button.dataset.question = 'courier'; button.dataset.answer = choice.answer;
    button.dataset.entityId = encounter.listenerId;
    button.disabled = world.status !== 'running';
    $('#encounter-asks').append(button);
  }
  if (live && !runner) {
    const leave = element('button', `Let ${encounter.carrierName} ride on`, 'ask-leave');
    leave.dataset.action = 'leave-rider';
    leave.dataset.entityId = encounter.listenerId;
    leave.disabled = world.status !== 'running';
    $('#encounter-asks').append(leave);
  }
  $('#encounter-note').textContent = runner
    ? live ? `${encounter.pressing ? `${encounter.carrierName} cannot wait much longer.` : `${encounter.carrierName} is waiting for an answer to take back.`} ${encounter.ifUnanswered || ''}`.trim()
      : encounter.reason === 'unanswered' ? `Nobody answered ${encounter.carrierName} in time, and it was decided for ${name}. The journal says what.` : `${name} gave ${encounter.carrierName} an answer, and he has gone back to Colonel Travis.`
    : live
      ? 'They will not wait for ever. Closing this does not unhear anything already said.'
      : encounter.reason === 'unanswered' ? `${encounter.carrierName} would wait no longer and rode on.`
        : encounter.reason === 'parted' ? `${name} and ${encounter.carrierName} were separated.`
          : `${name} let ${encounter.carrierName} ride on.`;
}
document.addEventListener('click', event => {
  if (!event.target.closest('[data-open-encounter]')) return;
  encounterOpen = true;
  if (window.__snapshot) renderEncounter(window.__snapshot.world);
});
bindEnding();
bindCreation({
  command: order => api('/api/command', { ...order, id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}` }),
  refresh: () => { forgetFamily(); if (window.__snapshot) render(window.__snapshot); },
  family: () => familyCache,
});
bindLooks({
  command: order => api('/api/command', { ...order, id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}` }),
  refresh: () => { forgetFamily(); if (window.__snapshot) render(window.__snapshot); },
  family: () => familyCache,
});
$('#encounter-close')?.addEventListener('click', () => {
  encounterOpen = false;
  $('#encounter').hidden = true;
  renderScreenMoments();
  // Back to the control that opened it, which is on the person who was spoken to.
  const listen = $('#listen-rider');
  (listen && !listen.hidden ? listen : $('#journal-toggle'))?.focus();
});
function renderSlice(world) {
  const request = world.request;
  $('#request').hidden = !request || world.role === 'host';
  if (request) {
    $('#request').dataset.requestId = request.id;
    $('#request').dataset.status = request.status;
    $('#request-text').textContent = request.text;
    const said = request.kind === 'march'
      ? { open: 'Your family can choose how to respond.', accepted: 'Your family went upriver with them.', refused: 'Your family stayed in Gonzales.', expired: 'They crossed without an answer.' }
      : request.kind === 'call'
      ? { open: 'Your family can choose how to respond.', accepted: 'Somebody from your family went with the volunteers.', refused: 'Your family stayed home.', expired: 'Nobody from your family answered.' }
      : request.kind === 'rumor'
      ? { open: 'Your family can choose how to respond.', accepted: 'Your family went to see for itself.', refused: 'Your family stayed home.', expired: 'Nobody went to find out.' }
      : { open: 'Your family can choose how to respond.', accepted: 'Your family chose to help.', refused: 'Your family chose to stay home.', expired: 'This request has passed.' };
    $('#request-status').textContent = said[request.status] || '';
  }
  // The army, once the volunteers have been made into one (sim/army.mjs, docs/COLONIES.md §5.5).
  // Where it is and how many went are public; which of them are this family's, and the control
  // for sending for one, come from the server's own projection and are never worked out here.
  const army = world.army;
  $('#army').hidden = !army || world.role === 'host';
  if (army && world.role !== 'host') {
    const phase = army.camp ? `The army is camped at ${army.camp}` : {
      organised: `The volunteers have been made into an army at ${army.at}`,
      marching: 'The army is on the road for Béxar',
      arrived: 'The army has reached Béxar',
    }[army.phase] || `The volunteers are gathering at ${army.at}`;
    $('#army-where').textContent = `${phase}, ${army.miles} miles from your land. ${army.strength} went from the settlements.`;
    $('#army-ours').replaceChildren(...army.ours.map(one => {
      const line = element('div', `${one.name} is with it. `);
      const control = (action, words) => { const button = element('button', words); button.dataset.action = action; button.dataset.entityId = one.id; line.append(button); };
      // The same question the card asks, for a screen reader (sim/army.mjs, Bowie and Fannin's division).
      if (one.detachment === 'open') {
        line.append(`Bowie and Fannin are taking a division ahead to the missions. `);
        control('detachment-go', `${one.name} goes ahead with them`);
        control('detachment-stay', `${one.name} stays with the main army`);
      }
      for (const question of one.questions || []) {
        if (question.answer !== 'open') continue;
        line.append(`${question.ask} `);
        for (const [answer, words] of [['yes', question.yes], ['no', question.no]]) {
          const button = element('button', words); button.dataset.action = 'army-answer'; button.dataset.entityId = one.id;
          button.dataset.question = question.key; button.dataset.answer = answer; line.append(button);
        }
      }
      control('send-for', `Send for ${one.name}`);
      return line;
    }));
  }
  const battle = world.battle;
  $('#battle-info').hidden = !battle;
  $('#battle-info').dataset.phase = battle?.phase || '';
  $('#battle-caption').textContent = battle?.caption || '';
  $('#reconstruction-banner').hidden = !battle?.reconstruction;
  $('#battle-phase').textContent = battle ? { gathering: 'People gather near Gonzales.', approach: 'The formations move into view.', exchange: 'An exchange of fire.', withdrawal: 'The formations move apart.', resolved: 'The encounter has ended.' }[battle.phase] || '' : '';
  $('#host-caption').textContent = world.host?.caption || '';
}
// The teacher's last resort, and the only place a family key leaves its own household.
// It is closed by default, shows one key, and clears itself, because a Host page is
// sometimes projected in front of the whole class.
let revealTimer = null;
function clearRevealedKey() {
  clearTimeout(revealTimer); revealTimer = null;
  $('#recover-key').textContent = '';
  $('#recover-note').textContent = 'Shown for thirty seconds, one family at a time.';
}
$('#recover-toggle')?.addEventListener('click', async () => {
  const panel = $('#recover-panel'), open = panel.hidden;
  panel.hidden = !open;
  $('#recover-toggle').setAttribute('aria-expanded', String(open));
  clearRevealedKey();
  if (!open) return;
  try {
    const { families } = await api('/api/families');
    $('#recover-family').replaceChildren(...families.map(family => {
      const option = element('option', `${family.name} (${family.householdId})`);
      option.value = family.householdId; return option;
    }));
    if (!families.length) $('#recover-note').textContent = 'Nobody has joined this class yet.';
  } catch (error) { $('#recover-note').textContent = error.message; }
});
$('#recover-show')?.addEventListener('click', async () => {
  const householdId = $('#recover-family').value;
  if (!householdId) return;
  try {
    const family = await api(`/api/family-key?household=${encodeURIComponent(householdId)}`);
    $('#recover-key').textContent = `${family.familyKey.slice(0, 4)} ${family.familyKey.slice(4)}`;
    $('#recover-note').textContent = `Read this to ${family.name} only. It clears in thirty seconds.`;
    clearTimeout(revealTimer);
    revealTimer = setTimeout(clearRevealedKey, 30000);
  } catch (error) { $('#recover-key').textContent = ''; $('#recover-note').textContent = error.message; }
});
function renderJoinLinks(snapshot) {
  const host = snapshot.world.role === 'host'; $('#join-links').hidden = !host;
  if (!host) return;
  const urls = snapshot.joinUrls || [];
  $('#join-links').replaceChildren(...urls.map((entry, index) => {
    const p = element('p', `${index === 0 ? 'Preferred student URL' : 'Alternative'}${entry.label ? ` (${entry.label})` : ''}: `);
    const a = element('a', entry.url); a.href = entry.url; p.append(a); return p;
  }));
}
function render(snapshot) {
  if (motionProjection.session !== snapshot.sessionId) { animationTime = 0; visibleBattlePhase = null; battleAnimationStart = 0; }
  // The kept ground is not thrown away here: it is drawn again when what it is drawn from changed (`groundInputs`), which a
  // render that only moved people did not.
  motionProjection.accept(snapshot, performance.now());
  // Everybody on the Host's map is somebody the teacher looks at and never orders: marked here rather than sent on every one.
  if (snapshot.world?.role === 'host') for (const entity of snapshot.world.others || []) entity.observed = true;
  ensureMap(snapshot); ensureHomes(snapshot); ensureChores(snapshot); ensureFamily(snapshot); ensureLandLevels(mapCache);
  snapshot.world.map = mapCacheId === snapshot.mapId ? mapCache : (snapshot.world.map || EMPTY_MAP);
  $('#save-fault').hidden = !snapshot.fault;
  $('#save-fault').textContent = snapshot.fault?.message || '';
  $('#lifecycle').hidden = !snapshot.lifecycle;
  $('#lifecycle').textContent = snapshot.lifecycle?.message || '';
  window.__snapshot = snapshot;
  // For a proof that changes the snapshot in the page's hand and needs it drawn without waiting for a tick - a lobby does
  // not tick at all (scripts/support/lesson-stub.mjs). Nothing in the page ever calls it.
  window.__render = render;
  window.__received.push({ revision: snapshot.revision, tick: snapshot.world.tick });
  if (window.__received.length > 2000) window.__received.shift();
  $('#join').hidden = true; $('#rejoin').hidden = true; $('#game').hidden = false;
  const world = snapshot.world, host = world.role === 'host';
  // "Connected" alone made a locked phone look like a student who had left. Away is a
  // household whose stream has closed within the grace window; it is not a count of who
  // is paying attention, and the Host line says so by naming the two separately.
  const presence = snapshot.presence;
  $('#connection').textContent = host
    ? (presence ? `${presence.here} here${presence.away ? ` · ${presence.away} away` : ''} of ${presence.joined}` : `${snapshot.connected} connected`)
    : '';
  // The family's own name, not the row number it used to carry and not the raw id it fell
  // back to the moment households stopped being called "Family N".
  $('#session').textContent = host ? `Class code ${snapshot.sessionCode}` : headingCase(familyCache?.name || world.household?.name || '');
  // The key is shown to its own household only, and in the journal rather than on the
  // map: it is identity, not news. It is what gets this family back on a borrowed laptop
  // or a phone that lost its cookie, and it lasts as long as the class does.
  const key = snapshot.familyKey;
  $('#family-key').textContent = key ? `${key.slice(0, 4)} ${key.slice(4)}` : '';
  $('#family-key-note').textContent = key
    ? 'Write this down. On any device, choose “I already have a family key” and type it to come back to this family.'
    : '';
  $('#host-controls').hidden = !host;
  $('#host-pace').hidden = !host;
  renderHostLive(snapshot, host);
  // Named paces rather than a number, because milliseconds a tick is not a thing a teacher
  // should have to hold in their head.
  const paces = { study: 9500, brisk: 4000, quick: 1000 };
  for (const button of $('#host-pace').querySelectorAll('button')) {
    button.dataset.active = String(paces[button.dataset.pace] === snapshot.tickMs);
  }
  // The Host's button names the period that follows (sim/periods.mjs `nextPeriodLabel`).
  const next = $('#host-controls [data-action="next-period"]');
  if (next && world.ending?.host?.nextLabel && next.textContent !== world.ending.host.nextLabel && !next.dataset.confirming) next.textContent = world.ending.host.nextLabel;
  const statusLabel = world.slice?.complete ? 'story preserved' : { lobby: 'waiting to begin', running: '', paused: 'paused', ended: 'session ended' }[world.status] ?? world.status;
  $('#world').textContent = [world.historicalDate || timeLabel(world.minute ?? 0), statusLabel].filter(Boolean).join(' · ');
  const whenAvailable = { start: ['lobby'], pause: ['running'], resume: ['paused'], end: ['running', 'paused'], 'new-class': ['lobby', 'ended'], 'stop-server': ['lobby', 'running', 'paused', 'ended'] };
  for (const button of $('#host-controls').querySelectorAll('button')) {
    // Continuing to the winter is offered only where the server says this class can go on (sim/periods.mjs).
    const allowed = button.dataset.action === 'next-period' ? Boolean(world.ending?.host?.canContinue) : (whenAvailable[button.dataset.action] || []).includes(world.status);
    // A stop control is only offered when this process can actually stop itself.
    button.hidden = !allowed || Boolean(snapshot.lifecycle) || (button.dataset.action === 'stop-server' && !snapshot.canStop);
    if (button.hidden) resetConfirm(button);
  }
  if ($('#recover').hidden === host) {
    $('#recover').hidden = !host;
    if (!host) { $('#recover-panel').hidden = true; clearRevealedKey(); }
  }
  renderJoinLinks(snapshot);
  renderSlice(world);
  renderEnding(world);
  // Making the family comes before the world is seen (public/creation.js): the curtain, and no map drawn behind it.
  const creating = renderCreation(world, familyCache);
  renderLooks(familyCache, { blocked: creating !== 'looks' });
  // A snapshot that lands while a hand is on the map is drawn when the hand stops (`handOnMap`), not in the middle of the
  // gesture: a whole draw there is the stall a student feels as the map sticking under their finger.
  if (creating) { /* the curtain is up: nothing of the world is drawn */ } else if (performance.now() < handOnMapUntil) requestMapDraw(); else drawWorld(world);
  renderInteriorPanel(world); renderHousehold(world); renderKnowledge(world); renderEncounter(world); renderFamilyRoll(world); renderWagonLoad(world); renderHousePlan(world); renderSite(world); renderSurvey(world); renderLesson(world); renderMilitaryNotice(world); renderTutorial(world);
  renderPanelBackdrop();
}
/**
 * The dim behind a panel that stands where the family's own column is (owner, 2026-09-21). It is read off the panels
 * themselves rather than kept as a flag, so a panel that opens some other way cannot forget to dim behind it - and a
 * panel that is only hidden, as these are, cannot leave the screen dimmed with nothing on it.
 *
 * Only the two house panels. The panels that ask for a place on the map (`#site-choose`, `#survey-choose`) must never be
 * given this, because dimming the map means covering the very thing the student has been told to tap.
 *
 * `#wagon-load` was here for a few hours on 2026-09-21 and was taken out again. It stands in the same corner and covers
 * the same column, but it is a **lobby** step: the class has not started, no order can be given to anybody, so the dim
 * has nothing to explain - and it cost the Journal, which the looks proof caught by trying to press it while the wagon
 * was open. The owner's decision was about a panel that covers the family *while the family can be worked*; this is not
 * one, and a dim that only takes things away is not worth having.
 */
const COVERING = ['#house-plan', '#house-plot'];
function renderPanelBackdrop() {
  const covering = COVERING.some(one => $(one) && !$(one).hidden);
  const backdrop = $('#panel-backdrop');
  if (backdrop) backdrop.hidden = !covering;
  document.body.dataset.panel = String(covering);
  renderScreenMoments();
}
/**
 * Two moments that take the screen from the family's own furniture (owner, 2026-09-22, both chosen by multiple choice
 * over numbers `npm run test:panels` measured). Read off the panels, like the dim above, so neither can be left behind.
 *
 * **The bar steps aside while a rider talks.** "Answering the rider is the whole of what that moment is for, and the bar
 * comes back the instant the meeting closes." The meeting and the ability bar both want the bottom middle: 520x48px of
 * it at 1366, 520x42 at 1024. The bar is not drawn (`body[data-meeting=true]` in style.css); nothing it holds is lost,
 * because every work on it is the server's and is offered again the moment the meeting shuts.
 *
 * **The column folds to faces while a place is chosen.** "While you are choosing a place, the family column collapses
 * to its narrow strip of portraits - a state that already exists as 'Hide names' - and opens again afterwards." The
 * panels that ask for a place on the map stood over 304px of the column's width at every size. The fold is the very
 * same one the Hide names button makes, so the button says Show names while it lasts and pressing it is honoured. It is
 * made on the change only, never on every draw - a student who opens the names mid-placement is not folded again at the
 * next tick - and what is restored afterwards is the student's own remembered choice, not "open".
 */
let placingWas = false;
function renderScreenMoments() {
  const shown = one => Boolean($(one) && !$(one).hidden);
  document.body.dataset.meeting = String(shown('#encounter'));
  const placing = shown('#site-choose') || shown('#survey-choose');
  document.body.dataset.placing = String(placing);
  if (placing !== placingWas) { placingWas = placing; setPanelFolded(placing || panelFolded()); }
  if (!placing) return;
  // The folded strip's corner, measured every draw because a row's height moves with the family. Measured from the Hide
  // names button and the faces rather than the column: the column is as wide as its widest status line, 248px at 1366,
  // and standing clear of that would push the panel halfway across the map for the sake of a date.
  const faces = ['#family-collapse', '#family-rows'].map(one => $(one)).filter(one => one && one.offsetParent).map(one => one.getBoundingClientRect()).filter(box => box.width > 1);
  const game = $('#game')?.getBoundingClientRect();
  if (!faces.length || !game) return;
  document.body.style.setProperty('--place-left', `${Math.round(Math.max(...faces.map(box => box.right)) - game.left + 8)}px`);
  // And never under the guided start's strip, which at 1024 wraps deep enough to reach the faces' own top: the first
  // turn of this stood the site panel 51px inside the strip there, and `npm run test:panels` refused it.
  const strip = $('#lesson') && !$('#lesson').hidden ? $('#lesson').getBoundingClientRect() : null;
  const top = Math.max(Math.min(...faces.map(box => box.top)), strip && strip.height > 1 ? strip.bottom + 8 : 0);
  document.body.style.setProperty('--place-top', `${Math.round(top - game.top)}px`);
}
// The dim is pressed to close, which is what a student tries first. The wagon is not closed this way: what it packs is
// the family's whole outfit, and "Done packing" is the answer it is waiting for.
$('#panel-backdrop')?.addEventListener('click', () => {
  if ($('#wagon-load') && !$('#wagon-load').hidden) return;
  housePlanOpen = false;
  if (window.__snapshot) render(window.__snapshot);
  $('#house-open')?.focus();
});
function showJoin(message) {
  events?.close(); events = null;
  $('#game').hidden = true; $('#rejoin').hidden = true; $('#join').hidden = hostPage;
  // The title screen is the join form's own backdrop (public/creation.js): the game's name is the first thing a student sees.
  if (!hostPage) showTitle();
  $('#connection').textContent = hostPage ? 'Host access required' : 'Ready to join';
  say(message);
}
function connect(snapshot) {
  if (snapshot) render(snapshot);
  events?.close(); events = new EventSource('/api/events');
  events.onmessage = event => { render(JSON.parse(event.data)); };
  events.onerror = () => {
    $('#connection').textContent = 'Connection interrupted. Reconnecting…';
    // A new class or a stopped server ends this stream permanently. Ask once, then
    // say which happened instead of leaving a stale page claiming to be connected.
    if (authRecheck) return;
    authRecheck = true;
    setTimeout(async () => {
      authRecheck = false;
      try { connect(await api('/api/state')); }
      catch {
        const stopped = window.__snapshot?.lifecycle?.state === 'stopping';
        showJoin(hostPage ? 'This Host session ended. Reopen the Host page from the launcher.'
          : stopped ? 'Your teacher stopped the classroom server. Your family\'s story was saved.'
            : 'You are no longer joined to this class. Use your family key to come back, or ask your teacher for the current class code.');
      }
    }, 1500);
  };
}
// Two doors, one at a time. The toggle is a plain button so the pages stay usable with
// the strict content security policy and without any inline script.
function showDoor(which) {
  say('');
  $('#join').hidden = which !== 'join';
  $('#rejoin').hidden = which !== 'rejoin';
  $(which === 'join' ? '#join input[name="name"]' : '#rejoin input[name="key"]')?.focus();
}
$('#rejoin-toggle').addEventListener('click', () => showDoor('rejoin'));
$('#join-toggle').addEventListener('click', () => showDoor('join'));
$('#rejoin').addEventListener('submit', async event => {
  event.preventDefault(); if (joinPending) return;
  joinPending = true; const form = new FormData(event.target), button = event.target.querySelector('button');
  button.disabled = true; say('');
  try { connect(await api('/api/rejoin', { key: form.get('key') })); } catch (error) { say(error.message); }
  finally { joinPending = false; button.disabled = false; }
});
$('#join').addEventListener('submit', async event => {
  event.preventDefault(); if (joinPending) return;
  joinPending = true; const form = new FormData(event.target), button = event.target.querySelector('button');
  button.disabled = true; say('');
  try { connect(await api('/api/join', { name: form.get('name'), code: form.get('code').trim().toUpperCase() })); } catch (error) { say(error.message); }
  finally { joinPending = false; button.disabled = false; }
});
document.addEventListener('click', async event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { applyMapView(viewButton.dataset.view); return; }
  // How fast the class watches. Sent like any other Host command, and deliberately not a
  // world change: a class reopened tomorrow opens at the pace the build ships with.
  const paceButton = event.target.closest('[data-pace]');
  if (paceButton) {
    say('');
    try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}`, action: 'pace', pace: paceButton.dataset.pace }); }
    catch (error) { say(error.message); }
    return;
  }
  const pick = event.target.closest('[data-select]');
  if (pick) {
    selectedId = pick.dataset.select; selectionDismissed = false;
    // Chosen from the roster rather than off the map, so go and look at them. Somebody
    // picked off the map is already on screen and moving the camera would only be rude.
    const world = window.__snapshot?.world;
    const mine = world && entitiesOf(world).some(entity => entity.id === selectedId);
    if (mine) { watchedId = selectedId; manualView = null; }
    if (world) { drawWorld(world); renderSelection(world); renderTutorial(world); }
    return;
  }
  // A portrait on the family panel: choose the person, and the camera goes to them and zooms in (docs/FAMILY_PANEL.md §3).
  // The same watch the roster starts - `cameraFor` centres on where they are drawn and zooms to at least 55 in 100 of the
  // closest zoom - so it walks with them until the student pans, zooms or presses Follow.
  const portrait = event.target.closest('[data-portrait]');
  if (portrait) {
    const id = portrait.dataset.portrait;
    const person = entitiesOf(window.__snapshot?.world).find(one => one.id === id);
    if (id !== focusedId && person && !(person.age < 10) && !['dead', 'captured'].includes(person.health?.condition)) await chooseFocus(id);
    goToPerson(id);
    return;
  }
  // The "!" on a row: to the person, and open what is waiting on them (docs/FAMILY_PANEL.md §11).
  const attention = event.target.closest('[data-attention]');
  if (attention) { openNeed(attention.dataset.attention); return; }
  // The auto switch on a row: on if it is off, off if it is on (docs/FAMILY_PANEL.md §11.7).
  const sw = event.target.closest('[data-auto]');
  if (sw) { setAutoFor(sw.dataset.auto, sw.getAttribute('aria-pressed') !== 'true'); return; }
  // The star: make this person the main one; on the main person already, go back to them.
  const star = event.target.closest('[data-focus]');
  if (star) {
    if (star.dataset.focus !== focusedId) chooseFocus(star.dataset.focus);
    goToPerson(star.dataset.focus);
    return;
  }
  // The main person's House: the rooms inside, as tapping the house on the map opens them.
  const indoors = event.target.closest('[data-house]');
  if (indoors) {
    const world = window.__snapshot?.world;
    interiorSiteId = world?.land?.homeSiteId || homeOf(world); clearInteriorChoice();
    const panel = $('#interior'); if (panel) delete panel.dataset.shown;
    if (world) renderInteriorPanel(world);
    return;
  }
  // An icon on the family panel. A refused one does nothing but say why; "Go to a neighbour's homestead" needs a choice of
  // which, so it opens the person's card at the list of homesteads, as a chore sent to a place starts choosing the place.
  const panelButton = event.target.closest('.panel-icon');
  if (panelButton) {
    if (panelButton.getAttribute('aria-disabled') === 'true') { showPanelTip(panelButton); return; }
    // Sending for somebody who serves is asked twice, on their card, where there is room to say what it costs.
    // Going to town to trade asks first what to buy and sell (docs/TOWNS.md §4b, owner 2026-09-24): the popup sends the order.
    if (panelButton.dataset.chore === 'visit-shop') { hidePanelTip(); errandPopup.open(panelButton.dataset.entityId); return; }
    if (panelButton.dataset.visit || panelButton.dataset.key === 'winter-recall') {
      selectedId = panelButton.dataset.entityId; selectionDismissed = false;
      const world = window.__snapshot?.world;
      if (world) { renderSelection(world); (panelButton.dataset.visit ? $('#visit-select') : document.querySelector('#selection-work [data-action="winter-recall"]'))?.focus(); }
      return;
    }
    hidePanelTip();
  }
  if (event.target.closest('#selection-close')) {
    selectedId = null; selectionDismissed = true;
    if (window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); }
    return;
  }
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  say('');
  const action = button.dataset.action;
  // The person's panel is put away so the land is there to tap; the survey panel names who is going.
  if (action === 'survey-start') { surveyFor = button.dataset.entityId; plotJob = button.dataset.chore; plotPick = null; selectedId = null; selectionDismissed = true; if (window.__snapshot) render(window.__snapshot); return; }
  if (action !== 'start') startAnyway = false;
  if (confirmLabel[confirmKeyOf(button)] && button.dataset.confirming !== 'true') {
    resetConfirm(confirming);
    button.dataset.label = button.dataset.label || button.textContent;
    button.textContent = confirmLabel[confirmKeyOf(button)];
    button.dataset.confirming = 'true';
    confirming = button;
    confirmTimer = setTimeout(() => resetConfirm(button), 6000);
    return;
  }
  resetConfirm(button);
  const world = window.__snapshot?.world;
  const input = { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action };
  // The five-household rule is a guard, not a wall: the server says so once and means it,
  // and a second press goes ahead. That is what makes a class of one testable on one
  // machine without a developer setting nobody in a classroom would ever find.
  if (action === 'start' && startAnyway) input.anyway = true;
  if (world?.role !== 'host') {
    // A trade names its own actor: the person making the offer is one of mine, while the
    // person selected on the map is the neighbour it is being made to.
    input.entityId = button.dataset.entityId || (action === 'offer' ? $('#trade-from')?.value : null) || selectedEntity(world)?.id || world?.household?.mainId || world?.household?.principalId;
    if (button.dataset.offerId) input.offerId = button.dataset.offerId;
    if (action === 'offer') {
      input.toEntityId = button.dataset.toEntityId;
      input.give = { [$('#trade-give-good').value]: Number($('#trade-give-amount').value) };
      input.ask = { [$('#trade-ask-good').value]: Number($('#trade-ask-amount').value) };
    }
    if (button.dataset.destination) input.destination = button.dataset.destination === 'home' ? homeOf(world) : button.dataset.destination;
    if (button.dataset.chore) input.chore = button.dataset.chore;
    // The flight's load and refuge come from the card's own form (sim/scrape.mjs).
    if (action === 'flee') { input.refuge = $('#flight-refuge')?.value; input.take = Object.fromEntries([...document.querySelectorAll('#selection-flight .flight-amount')].map(one => [one.dataset.take, Number(one.value) || 0])); }
    if (button.dataset.option) input.option = button.dataset.option;
    if (button.dataset.question) { input.question = button.dataset.question; input.answer = button.dataset.answer; }
    if (button.dataset.lineId) input.lineId = button.dataset.lineId;
    // Every order that puts somebody on a road asks first how they will go (owner, 2026-09-24: "when sending someone to travel,
    // the game should ask how they'll travel"; docs/FAMILY_PANEL.md §15). The chooser sends the one order with the way chosen,
    // and says any refusal in the server's words; an order that turns out to make no journey from here is sent as it is.
    // Work given to somebody on auto to wait for is not asked: the way is chosen by the one rule when it can go (sim/auto.mjs).
    if (asksTheWay(input, choreCache) && button.dataset.waits !== 'true') { hidePanelTip(); goingPopup.open(input); return; }
  }
  try {
    const result = await api('/api/command', input);
    $('#host-notice').hidden = !(result.archived || result.stopping);
    if (result.archived) $('#host-notice').textContent = `New class ready. The previous class was archived as ${result.archived}. Share the new class code; students join again.`;
    if (result.stopping) $('#host-notice').textContent = 'Stopping the classroom server. The class was saved and paused.';
  } catch (error) {
    if (action === 'start' && /Press Start again/.test(error.message)) startAnyway = true;
    say(error.message);
  }
});
// Choosing how somebody goes changes nothing in the world by itself; it is remembered
// here and sent with the next order that actually starts a journey.
/**
 * A rename, sent on its own.
 *
 * Not through the action dispatcher: that reads its whole order off `data-` attributes on
 * a button, and this one carries a line of text somebody typed. The server sanitises and
 * has the last word on it; nothing here decides what a name may be.
 */
/**
 * Names save themselves (docs/FAMILY_PANEL.md §5): every box carrying `data-rename` - a person's id, or `family` - on the
 * family panel and in the family book. Saved when the box is left, on Enter, or after a pause in typing; never by a button.
 * Only a changed, non-blank name is sent, and the server cleans it and has the last word: a refusal is its sentence, on the
 * page's error line and on the box, and the box goes back to the world's name once it is left.
 * ceiling: every save writes a line into the family's story ("Rosa is called Winnie now"), so a name typed with long pauses
 * between letters writes half-names; save only on leaving the box if a class's story fills with them.
 */
const renameTimers = new Map();
/** How long a saved name is left alone in its box while the world catches up with it, in milliseconds. */
const NAME_HOLD_MS = 4000;
/**
 * Whether a tick may put the world's name into a box. Never while it is being typed in or saved; and for a moment after a
 * save, not with the old name, so a box does not flick back to the name it just replaced before the new one arrives. After
 * that moment the world's name wins, which is how a name the server cleaned ("<b>Bad</b>" became "bBadb") shows as cleaned.
 */
function mayOverwriteName(input, name) {
  if (document.activeElement === input || input.dataset.saving === 'true' || renameTimers.has(input)) return false;
  const held = Number(input.dataset.heldUntil || 0);
  if (held && name !== input.value && Date.now() < held) return false;
  delete input.dataset.heldUntil;
  if (input.value !== name) input.removeAttribute('aria-invalid');
  return true;
}
async function saveName(input) {
  clearTimeout(renameTimers.get(input)); renameTimers.delete(input);
  const name = nameToSave(input.value, input.dataset.current);
  if (!name || input.dataset.sent === name) return;
  const order = { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'rename', name };
  if (input.dataset.rename !== 'family') order.entityId = input.dataset.rename;
  input.dataset.sent = name; input.dataset.saving = 'true';
  try {
    await api('/api/command', order);
    input.removeAttribute('aria-invalid'); input.title = ''; input.dataset.heldUntil = String(Date.now() + NAME_HOLD_MS);
    forgetFamily();
  } catch (error) {
    input.setAttribute('aria-invalid', 'true'); input.title = error.message;
    say(error.message);
  } finally {
    delete input.dataset.saving; delete input.dataset.sent;
    if (window.__snapshot) render(window.__snapshot);
  }
}
document.addEventListener('input', event => {
  const input = event.target.closest?.('input[data-rename]');
  if (!input) return;
  clearTimeout(renameTimers.get(input));
  renameTimers.set(input, setTimeout(() => saveName(input), RENAME_PAUSE_MS));
});
document.addEventListener('change', event => { const input = event.target.closest?.('input[data-rename]'); if (input) saveName(input); });
document.addEventListener('focusout', event => {
  const input = event.target.closest?.('input[data-rename]');
  if (!input) return;
  saveName(input);
  // Left without saving anything new: the box shows the world's name again, whatever was refused in it.
  if (input.dataset.saving !== 'true' && window.__snapshot) render(window.__snapshot);
});
document.addEventListener('keydown', event => {
  const input = event.target.closest?.('input[data-rename]');
  if (input && event.key === 'Enter') { event.preventDefault(); input.blur(); }
});
$('#family-book')?.addEventListener('submit', event => event.preventDefault());
installMapNavigation();
// The family journal is a secondary keyboard route into the same permitted entities.
function showJournal(open) {
  const journal = $('#family-journal');
  if (!journal) return;
  journal.dataset.open = String(open);
  $('#journal-toggle').setAttribute('aria-expanded', String(open));
  $('#journal-close').hidden = !open; $('#journal-backdrop').hidden = !open;
  if (open) $('#journal-close').focus(); else $('#journal-toggle').focus();
}
$('#journal-toggle')?.addEventListener('click', () => {
  const opening = $('#family-journal').dataset.open !== 'true';
  if (opening) markReportsRead(window.__snapshot?.world.reports || []);
  showJournal(opening);
});
$('#journal-close')?.addEventListener('click', () => showJournal(false));
$('#journal-backdrop')?.addEventListener('click', () => showJournal(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#family-journal')?.dataset.open === 'true') showJournal(false); });
// Twelve display frames per second are enough for the 4–6 frame pose cycles. The
// authoritative clock remains on the server. Pausing freezes this clock exactly;
// returning from a hidden tab never catches up unseen animation or simulation work.
function animateMap(now) {
  const elapsed = previousFrame ? Math.min(100, now - previousFrame) : 0;
  previousFrame = now;
  const world = window.__snapshot?.world;
  const active = world?.status === 'running' && !document.hidden && !reducedMotion.matches && !$('#game').hidden;
  if (active) animationTime += elapsed;
  // A draw a gesture asked for this frame is the animation's frame too: never two whole-map draws in one frame.
  // Nor while a hand is on the map: the gesture's moved picture stands for the frame until it stops (`handOnMap`).
  // And never more than half the page's time: on a computer where a whole draw takes longer than a twelfth of a second, the
  // animation drew frame after frame with no gap, and a touch or a click waited behind as many as five draws before the page
  // heard it (measured 2026-09-17, CPU throttled six times: 840 ms from a finger landing to its pointerdown).
  // ceiling: the animation runs slower than twelve frames a second wherever a draw costs more than 42 ms; cheaper drawing
  // raises it again by itself.
  if (active && now - lastMapDraw >= Math.max(1000 / 12, animationDrawMs * 2) && now >= handOnMapUntil) {
    paintedFrame = now;
    const began = performance.now(); drawWorld(world); positionSelection(world);
    animationDrawMs = performance.now() - began;
    window.__animation = { timeMs: animationTime, clips: [...window.__animationClips], drawMs: animationDrawMs };
  }
  requestAnimationFrame(animateMap);
}
requestAnimationFrame(animateMap);
reducedMotion.addEventListener('change', () => { if (window.__snapshot) drawWorld(window.__snapshot.world); });
// The map draws immediately with its own shapes, and repaints once when the sprite
// sheets arrive. Nothing waits on the art: a stalled or missing download costs detail,
// never a working class.
// Placement is a local draft until the player confirms one authoritative command. Declared above the start-up below, not
// beside the functions that use it: a page that opens already signed in draws its first snapshot there, before the rest
// of this file has run, and a `let` it reaches first is a ReferenceError. That froze the Host page and sent a reloading
// student back to the join form (2026-09-22; tests/page-startup.test.mjs).
let housePlacement = null;
onArtReady(() => { redrawForArrival(); repaintFamilyPanel(); });
loadArt();
try {
  if (hostPage && location.hash) { await api('/api/host', { key: location.hash.slice(1) }); history.replaceState(null, '', '/host'); }
  connect(await api('/api/state'));
} catch (error) { $('#join').hidden = hostPage; $('#connection').textContent = hostPage ? 'Host access required' : 'Ready to join'; if (hostPage) say(error.message); }


function beginHousePlacement(command) {
  housePlacement = { command, point: null, rotation: 0, locked: false };
  housePlanOpen = false;
  document.querySelector('#house-placement').hidden = false;
  document.querySelector('#house-placement-note').textContent = PLACING_NOTE;
  if (window.__snapshot) render(window.__snapshot);
}
/**
 * A house at its own placement, turned by its quarter turn. The built house (alpha 1) and the translucent one a student is
 * placing (alpha under 1) are this one draw at `cabinSize`, so the preview is the house that will stand. The preview also
 * outlines on the ground the footprint its pieces make (`houseFootprint`), in the same cells the pieces are drawn in.
 * The turn turns the house on the ground - its footprint, which way its long side runs, the order its pieces stand in -
 * and never its pictures, which stand upright like everything else on the map (2026-09-23: turned by the canvas, a house
 * at 90 degrees lay on its side and one at 180 stood on its roof; `drawHousePlot` in public/house-plot.js). Returns the
 * screen box its pictures cover, or null when nothing was drawn: where a tap opens its rooms (`houseAt`).
 */
function drawPlacedHouse(ctx, camera, house, alpha = 1, refused = null) {
  const at = camera.toScreen(house.placement), rotation = house.placement.rotation || 0;
  const size = cabinSize(camera), cell = plotCell(size), preview = alpha < 1, foot = houseFootprint(house, plotCatalogue, rotation);
  const was = ctx.globalAlpha, drawn = [];
  ctx.globalAlpha = was * alpha;
  if (preview && foot) { ctx.save(); ctx.fillStyle = refused ? '#e0735a' : '#65e3dc'; ctx.strokeStyle = refused ? '#ffb4a2' : '#8ffff4'; ctx.lineWidth = 2; ctx.fillRect(at.x + foot.x * cell, at.y + foot.y * cell, foot.w * cell, foot.h * cell); ctx.strokeRect(at.x + foot.x * cell, at.y + foot.y * cell, foot.w * cell, foot.h * cell); ctx.restore(); }
  const pieces = drawHousePlot(ctx, at.x, at.y + cell, size, { house }, plotCatalogue, drawSprite, spriteFrame, { rotation, drawn });
  ctx.globalAlpha = was;
  const box = drawn.length ? { left: Math.min(...drawn.map(b => b.left)), top: Math.min(...drawn.map(b => b.top)), right: Math.max(...drawn.map(b => b.right)), bottom: Math.max(...drawn.map(b => b.bottom)) } : null;
  window.__placedHousesDrawn?.push({ preview, refused, x: at.x, y: at.y, rotation, size, cell, footprint: foot && { x: foot.x * cell, y: foot.y * cell, w: foot.w * cell, h: foot.h * cell }, pieces, box });
  return box;
}
document.querySelector('#house-rotate').addEventListener('click', () => { if (housePlacement) { housePlacement.rotation = (housePlacement.rotation + 90) % 360; document.querySelector('#house-rotate').textContent = `Rotate: ${housePlacement.rotation}°`; requestMapDraw(); } });
document.querySelector('#house-move').addEventListener('click', () => { if (housePlacement) housePlacement.locked = false; });
document.querySelector('#house-placement-cancel').addEventListener('click', () => { housePlacement = null; document.querySelector('#house-placement').hidden = true; housePlanOpen = true; if (window.__snapshot) render(window.__snapshot); });
document.querySelector('#house-placement-confirm').addEventListener('click', async event => {
  if (!housePlacement?.point) { document.querySelector('#house-placement-note').textContent = 'Move onto your land and choose a spot first.'; return; }
  const draft = housePlacement;
  event.currentTarget.disabled = true;
  try {
    await api('/api/command', { ...draft.command, placement: { ...draft.point, rotation: draft.rotation }, id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    housePlacement = null; document.querySelector('#house-placement').hidden = true;
  } catch (error) { document.querySelector('#house-placement-note').textContent = error.message; }
  finally { document.querySelector('#house-placement-confirm').disabled = false; if (window.__snapshot) render(window.__snapshot); }
});

document.addEventListener('keydown', event => {
  if (!housePlacement || event.target.closest('input,textarea,select,[contenteditable=true]')) return;
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); document.querySelector('#house-rotate').click(); }
  if (event.key === 'Escape') { event.preventDefault(); document.querySelector('#house-placement-cancel').click(); }
});
