// Renderers consume the server's permitted projection. They never advance simulation state.
import { drawSprite, drawClip, clipInfo, clipReady, hasSprite, loadArt, onArtReady, pickSprite, sheetsFirstDrawn, spriteFrame, spriteReady, watchMissing } from '/art.js';
import { drawArmy } from '/army-view.js';
import { drawFamous, famousArt } from '/famous-view.js';
import { ProjectionMotion, GaitClock, clipGait, STRIDE, entityClip, drawnClipName, travelHeading, travelDirection, figureScale, carriedWithRider, seatOf, teamDrivenBy, wagonTeams, seatedClip, seatLayout, wagonRigClip, rigReach, DrawnHeading, passengersOf, bedLayout, passengerClip, SEAT, walksBeside, mounted, MOUNTED_HEIGHT, figureOf, alongRoute, drawnHeightsPerSecond, drawnMilesASecond, fadeToward, FADE_STALE_MS, GAIT_CEILING, landRuns, paceMilesASecond, travelMilesATick, travelSight, passBegin, passRide, passStep, sameRoad, PASS_BEFORE_MILES, routeIndexAfter, sameJourney, gaitMilesASecond, trailHolds, walkToward } from '/motion.js';
import { emptyPauseWords, familyRows, PRESENCE_LABELS, sicknessView, storyView, spotlightBanner } from '/live-page.js';
import { actingOf, iconPress, takenInWords, autoLabel, autoLine, callMenu, callPlan, columnRoom, drawIcon, drawMark, drawPortrait, focusFor, isIdle, leftWords, lifeLine, lifeWord, meetingFor, nameToSave, needsOf, panelActions, panelOrder, rankNeeds, requestFor, rowReason, scrollToShow, sickLine, standing, travellingLine, awayLine, armyAwayWords, RENAME_PAUSE_MS, barPerson, lightLoad, loadSpace, larderLevel, larderFill, larderLabel, larderWorse, hungerOf, HUNGER_WORDS, feedsNow, barIcons, nextSteps, goalRoom, WANT_NAMES, plotStage, plotJobFor, plotWorkFor, plotHand, plotHands } from '/family-panel.js';
import { allowsIcon, lessonAnnouncement, lessonLocks, lessonShowing, lessonWords, lockedNote, pointedKey } from '/lesson.js';
import { TIPS, tipToShow, tipsToReread } from '/tips.js';
import { mountErrand } from '/errand.js';
import { reconnector, reconnectWords } from '/reconnect.js';
import { mountClassPanel } from '/class-panel.js';
import { qrSvg } from '/qr.js';
import { asksTheWay, mountGoing } from '/going.js';
import {drawBexarGround,bexarDrawables} from '/bexar-art.js';
import {alamoOnMap,bexarToSite} from '/bexar-layout.js';
import {plotArt} from '/field-art.js';
import { drawFieldSurface } from '/field-surface.js';
import {drawGonzalesGround,gonzalesDrawables,GONZALES_ART_BOUNDS} from '/gonzales-art.js';
import { TOWN_WALK, TownWalker, drawTownSpeech, renderSceneCard, townSceneAt, townSceneDrawables } from '/town-scenes.js';
import { drawSpeech, speechLayout } from '/speech.js';
import { ambientGround, campMan, crowdDrawables, drawAmbientSpeech, propItem } from '/ambient.js';
import { drawTownGround, townDrawables, townLabelsDrawn } from '/town-art.js';
import { placeSprite } from '/place-art.js';
import { renderInterior, clearInteriorChoice } from '/interior.js';
import { TOWN_LAYOUTS, townPoint } from '/town-layouts.js';
import {drawWater,drawRoad,drawCrossing,drawFerry,crossingAngle} from '/landscape-art.js';
import { GALE_POSES, GALE_SMOKE, drawFogShape, drawHighWater, drawWeatherAir, drawWeatherVeil, drawWetGround, farEmphasis, inGale, weatherGroundKey, weatherMix, weatherShown, weatherSpans, windLean } from '/weather-art.js';
/** The weather with the day fully up, for everything drawn into the kept ground (public/weather-art.js `weatherMix`). */
const STEADY = Object.freeze({ fade: false });
import { drawHousePlot, houseFootprint, plotCell, plotted, renderHousePlot } from '/house-plot.js';
import { CABIN_PEOPLE, PERSON_MILES, houseOnGround, spacingRefusal, standingAt } from '/sim/house-footprint.mjs';
import { drawWoodsCover, ensureWoods, stumpsVisible, timberAt, treesNear, treesVisible, woodsLayersFor, woodsShown } from '/woods-view.js';
import { bindEnding, renderEnding, setEndingReader } from '/ending.js';
import { bindFlashback, renderFlashback } from '/flashback.js';
import { createCourtship } from '/courtship.js';
import { bindNeighbours, openNeighbours, renderNeighbours } from '/neighbours.js';
import { bindLooks, renderLooks } from '/appearance.js';
import { avatarBinding, avatarVariant, drawAvatar, drawAvatarPortrait } from '/avatar-art.js';
import { decodeAppearance } from '/look-vocabulary.js';
import { bindCreation, creationStep, metFamily, renderCreation, showTitle } from '/creation.js';
import { aroundHole, groundInputs, applyDrawState, canvasRatio, creekOpacity, distanceToSegments, ramp, readDrawState, sameLayerKey, scatterItem, scatterLevels, segmentsNear, setText, smoothCover, WATER, waterWidth, landPictureData, landUpscale, away, wadesOf } from '/map-base.js';
import { canSmoothOffThread, smoothOffThread, toBitmap } from '/smooth-worker.js';
import { DEFAULT_GROUND, groundClass, groundClassAt, markFor } from '/ground-classes.js';
import { decodeLand, decodeOutside, decodeProvince, emptyMiddle, landWeights, lineBand, tileGrid, withoutClaims } from '/land-levels.js';
import { frameTransform, gestureView, isTap, keyView, nearestSpot, reproject, tapSlop, wheelZoomFactor, worldAt, zoomAbout } from '/map-camera.js';
const $ = selector => document.querySelector(selector);
import { EYEBROWS, ICONS, URGENT, militaryNotices } from '/military-attention.js';
import { mountHuntAim } from '/hunt-aim.js';
// Read aloud (owner, 2026-09-30, D15; docs/READ_ALOUD.md): a button on the words, played in a voice made on the teacher's laptop.
import { cardLines, createReadAloud, voiceOfPerson } from '/read-aloud.js';
import { createBattleView, personArt } from '/battle-view.js';
// The class view watching a fight like a film (owner, 2026-09-30; docs/BATTLES.md §15.3, docs/HOST_PAGE.md §2.15).
import { createCinema, familyColour } from '/battle-cinema.js';
import { createChaseView } from '/chase-view.js';
import { activityOf, drawnStroke, drawsAtWork, drawWorkLayer, fetchPose, fetchStep, strokeClock, strokeFace, strokeLean, strokeShift, workBeat, workSlot } from '/work-art.js';
const say = message => { for (const id of ['#error', '#join-error', '#rejoin-error', '#away-error']) { const el = $(id); if (el) el.textContent = message; } };
const hostPage = location.pathname === '/host';
let events;
// A page going away ends its own stream (2026-09-27). Play Solo's server takes the stream closing as its player leaving
// (server/app.mjs `SOLO_WATCH`), and Chrome, with a page closed, was seen holding the stream open for more than five seconds
// (scripts/solo-browser-proof.mjs); the launcher's WebView2 window closed it in under a second either way.
addEventListener('pagehide', () => { events?.close(); events = null; });
// And a page brought back from the browser's back-forward cache opens it again.
addEventListener('pageshow', event => { if (event.persisted && !events && window.__snapshot) connect(); });
let joinPending = false;
window.__received = [];
window.__viewEntities = [];
window.__viewFormations = [];
window.__camera = null;
const motionProjection = new ProjectionMotion();
// Gonzales before the fight (public/town-scenes.js): everybody whose place in the town changes is walked there, the scenes'
// people and each town person's head as drawn this frame (for the words over them), and the scene whose card is open.
const townWalker = new TownWalker(), townHeads = new Map(), townSceneSpots = new Map();
let townSceneOpen = null, townSceneShown = '';
// Ambient life (public/ambient.js, sim/ambient.mjs): the heads of the camps' men and the refuges' crowd as drawn this frame, for
// the words over them, and where each person at an activity was drawn, so two keeping company are turned to each other.
const ambientHeads = new Map(), ambientSpots = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// The one battle renderer (public/battle-view.js, docs/BATTLES.md §3): drawn with the page's own art, and asked by
// `drawFigure` which pose a family's own person in the force is in. Declared up here, above the page's first `connect`, so a
// page opened in the middle of a fight has it (the TDZ guard in tests/app-module.test.mjs).
const battleView = createBattleView({ animated: (...args) => animated(...args), drawSprite: (...args) => drawSprite(...args), miniPerson: (...args) => miniPerson(...args), clipReady: name => clipReady(name) });
/**
 * The film of a fight (public/battle-cinema.js): the Host's starts by itself when the server says a fight is being fought, and a
 * student's only from the Watch card. Each says where the camera looks while it has it; `cameraFor` draws that.
 */
const hostCinema = createCinema({ mode: 'host' }), studentCinema = createCinema({ mode: 'student' });
const cinemaFor = world => world?.role === 'host' ? hostCinema : studentCinema;
// Mexican troops after a family on the Scrape (public/chase-view.js, sim/pursuit.mjs), and the family's own route: the stops it
// is choosing (`routeDraft`), whether a tap on the map adds one (`routePicking`), and the key its editor was last drawn for.
// Up here with the battle's renderer, above the page's first `connect`, for the same TDZ guard.
const chaseView = createChaseView({ animated: (...args) => animated(...args), miniPerson: (...args) => miniPerson(...args), clipReady: name => clipReady(name) });
let routeDraft = null, routePicking = false, routeEditorKey = '';
// The page's sound (public/audio.js, docs/AUDIO.md): told every snapshot and every frame, and given its button beside the
// Journal. Fetched alongside the page rather than before it, so it never delays the first picture; until it has come the
// page is simply silent. Up here with the battle's renderer, above the page's first `connect`, for the same TDZ guard.
let soundscape = null;
import('/audio.js').then(({ createSoundscape }) => {
  soundscape = createSoundscape({ hostPage });
  soundscape.mount($('#map-tools'));
  if (window.__snapshot) soundscape.observe(window.__snapshot);
}).catch(error => console.warn('The page has no sound:', error));
// Read aloud (owner, 2026-09-30, D15; public/read-aloud.js): one button on each thing a student reads - the tip, the call, the
// messages card, each line a rider and the family's person say, the journal's newest line - and one <audio> for all of them.
// Never on the Host's page, which is a projector. As loud as the Sound setting. Up here, above the page's first `connect`, for
// the same TDZ guard.
const readAloud = hostPage ? null : createReadAloud({ ask: (path, input) => api(path, input), settings: () => soundscape?.settings || null, hostPage });
// The buttons on lines that are drawn again and again (a rider's conversation, the tips list), kept by line so the one playing
// is the same button after every render.
const readButtons = new Map();
mountReadAloud();
// The lone parent's path as scenes over the whole screen (public/courtship.js, sim/courtship.mjs): opened by the snapshot that
// carries them, and telling the sound to look again when the wedding's tune should start or stop. Up here, above the page's first
// `connect`, for the TDZ guard.
const courtshipScenes = createCourtship({
  root: $('#courtship'),
  send: input => api('/api/command', { ...input, id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}` }),
  onMood: () => { if (window.__snapshot) soundscape?.observe(window.__snapshot); },
});
let animationTime = 0, previousFrame = 0, paintedFrame = 0, animationDrawMs = 0, drawingAnimation = false;
// The end-of-game flashback's recorder (public/flashback.js): the video's own clock while it draws a frame, which the figures'
// cycles are timed by instead of the page's, and how many pictures of the land are still being made. Up here, above the page's
// first `connect`, for the TDZ guard.
let flashbackClock = null, landMaking = 0;
// A traveller's cycle is played from their own place in their stride rather than the shared clock (public/motion.js `GaitClock`).
const gaitClock = new GaitClock(), gaits = new Map();
// People at their work (public/work-art.js): where each stands round a shared piece of work and where in its stroke they are,
// written into these once a figure rather than made new, and each pose's frame lengths read once from the library.
const workSlotOut = { x: 0, y: 0, face: null }, workClockOut = { period: 0, since: 0, count: 0, frame: 0 }, workFrames = new Map(), workSeeds = new Map();
// The work's effect sheets (`fx-*`), drawn by public/work-art.js `drawWorkLayer` through `workEffect`; one options object each
// way, so a frame makes nothing.
const EFFECT_EAST = Object.freeze({ flip: false }), EFFECT_WEST = Object.freeze({ flip: true });
// A tree felled while the page watches goes over once (`tree-fall`, request 2026-09-28 — people at work, item 15): when the
// felling's own words move on from the felling (as public/audio-cues.js hears the fall), the tree just off the feller's axe
// falls where they stood, the way they faced. By person: the words last drawn, and a fall under way (where, which way, when).
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)", area A - `tree-fall` is Claude-drawn.
// ceiling: every felled tree falls as the one hardwood drawing, pine or oak, beside the stump the server puts down; a fall per
// kind, set on the new stump itself, is the way out if it jars.
const fellingWords = new Map(), treesFalling = new Map(), TREE_FALL_MS = 1240;
function workEffect(ctx, name, x, y, height, flip) { return drawSprite(ctx, name, x, y, height, flip ? EFFECT_WEST : EFFECT_EAST); }
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
/**
 * The family's people the map is not drawing because they are going too fast to be drawn (owner, 2026-09-29: *"if a character is
 * travelling (they're not rendered because they're moving too fast) their character panel should be greyed out and the player
 * shouldn't be able to select them until they're rendered again"*): by id, the words their row says. Two ways a traveller is
 * not drawn, both the page's own rules: the server sends no place for somebody too fast to follow (sim/world.mjs `seenTravel`),
 * and the page draws nothing of a figure whose schedule has faded it right out (public/motion.js `travelSight`, `sightOf`,
 * a figure alpha of 0). Written once a frame by `drawWorld`, so a row greys on the frame the figure goes and comes back on the
 * frame it is drawn again; read by the rows (`markUnseenRows`), the portrait and the star, `goToPerson` and the camera.
 * Never on the Host's page nor a page watching another family.
 */
let unseenOnRoad = new Map();
window.__unseenOnRoad = unseenOnRoad;
// The family's own land, read once a frame: the road inside it is never sped up and never faded (owner, 2026-09-22).
let ownGrant = null;
// Where each journey leaves that land and comes back onto it, worked out once a journey rather than once a frame.
const landRunCache = new Map();
// The grown-ups drawn this frame and last with a baby in their own arms or on their hip (a `holding` pose drawn: public/motion.js
// `drawnClipName`), so the baby they hold is not drawn again beside them. Last frame's, because a carried baby is sorted in front
// of its carrier and drawn first; a single frame after it is picked up it is still drawn beside them.
let babiesHeldNow = new Set(), babiesHeldLast = new Set();
// The children's figures, whose own cycle of a piece of work is theirs (`drawAtWork`).
const CHILD_FIGURES = new Set(['girl', 'boy', 'smallchild']);
function gaitTime(clip, gait) {
  const key = `${clip}|${gait.stride}`;
  if (!gaits.has(key)) { const found = clipGait(clipInfo(clip), gait.stride); if (!found) return undefined; gaits.set(key, found); }
  return gaitClock.time(gait.id, { clockMs: animationTime, at: gait.at, bodyMiles: gait.bodyMiles, gait: gaits.get(key) });
}
function animated(ctx, clip, x, y, size, seed = 0, { gait, ...options } = {}) {
  const own = gait && !options.paused && !('timeMs' in options) ? gaitTime(clip, gait) : undefined;
  const width = drawClip(ctx, clip, x, y, size, { timeMs: own ?? flashbackClock ?? animationTime, seed, reducedMotion: reducedMotion.matches, ...options });
  if (width) window.__animationClips?.add(clip);
  return width;
}
async function api(path, input) {
  const response = await fetch(path, input ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {});
  const result = await response.json();
  // With what else the server said beside its words (`codeRefused`, at the three doors that ask for the class code).
  if (!response.ok) throw Object.assign(new Error(result.error), { status: response.status, codeRefused: Boolean(result.codeRefused) });
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
// End Game is asked twice too, and says what it does (design audit 2026-09-28 B2): it was one press, final, at the moment a
// teacher reaches for a button at the bell. *Stop for today* is the button for the bell (docs/HOST_PAGE.md §2.8).
const confirmLabel = { 'new-class': 'Confirm new class', 'stop-server': 'Confirm stop', end: 'Confirm: end the whole game', 'stop-for-today': 'Confirm: save and stop for today', 'send-for': 'Confirm: bring them home', 'winter-recall': 'Confirm: send for them', flee: 'Confirm: leave, and let it burn', 'flee-early': 'Confirm: leave now, and lose the crop', 'flee-light': 'Confirm: leave most of it behind', 'flee-empty': 'Confirm: leave with nothing', 'flight-stay': 'Confirm: stay, and take the risk', 'road-abandon': 'Confirm: leave the wagon behind' };
/** What an armed Host button does, said on the Host's notice line while it waits for the second press. */
const confirmWords = {
  end: 'This ends the whole game for everyone and shows everybody the ending. If it was a mistake, Classes can take the class up again where it was, but the ending will have been seen. To stop at the bell and carry on next class, use Stop for today instead.',
  'stop-for-today': 'This pauses the class and saves it where it stands, then closes the server. Next class, open the Host as usual: the class is there, paused, and Resume carries on.',
};
/**
 * Confirmations a double press must not get through (design audit 2026-09-28 B7): leaving for the east with almost nothing
 * loaded. The second press counts only once this long has passed since the first armed it.
 */
const SLOW_CONFIRM = new Set(['flee-light', 'flee-empty']);
const SLOW_CONFIRM_MS = 1000;
/**
 * Which confirmation an action wants: leaving the wagon in the mud is the one road answer asked twice (sim/road.mjs); leaving for
 * the east with a load far under what the family could take is asked in its own words (`lightLoad`, public/flight-load.js).
 */
const confirmKeyOf = button => {
  if (button.dataset.action === 'road-answer') return button.dataset.option === 'abandon' ? 'road-abandon' : null;
  if (button.dataset.action === 'flee') {
    const flight = window.__snapshot?.world?.flight || window.__snapshot?.world?.early;
    const light = flight ? lightLoad(flight, Object.fromEntries([...document.querySelectorAll('#selection-flight .flight-amount')].map(one => [one.dataset.take, Number(one.value) || 0]))) : null;
    // Going before the order is asked in its own words (owner, 2026-09-29, D9 (b)): the crop is lost.
    return light ? `flee-${light}` : flight?.status === 'early' ? 'flee-early' : 'flee';
  }
  return button.dataset.action;
};
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
// The shot aimed by the student (owner, 2026-10-02; public/hunt-aim.js, sim/hunt-aim.mjs): opened by the sighting's card, its "!" and
// *Take the shot* on the hunter's card. Its two orders go through here so their ids are made as every command's is.
const huntAim = mountHuntAim({
  send: input => api('/api/command', { ...input, id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}` }),
  sound: id => soundscape?.play(id, { gain: 1 }),
  reducedMotion,
  onClosed: () => { if (window.__snapshot) render(window.__snapshot); },
});
/** Opens the field for this person's sighting, if one is open to them; false when there is none (the press does what it always did). */
const takeTheShot = (world, entityId) => Boolean(world && world.role !== 'host' && huntAim.open(world, entityId));
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
// A sheet of art throws the kept ground away only if the ground was drawn without it (`mapBase.missing`, public/art.js
// `watchMissing`): a famous person's or a soldier's sheet landing is drawn by the arrival's redraw over the ground as it was.
// A woods tile or a picture of the land names no sheet, and always does.
const redrawForArrival = sheet => {
  if (!sheet || !mapBase.missing || mapBase.missing.has(sheet)) invalidateMapBase();
  if (arrivalRedraw) return;
  // Not while a hand is on the map, whose pans are what fetch the tiles: then the map is drawn with them when the hand stops.
  arrivalRedraw = setTimeout(() => { arrivalRedraw = null; if (!window.__snapshot) return; if (performance.now() < handOnMapUntil) requestMapDraw(); else drawWorld(window.__snapshot.world); }, ARRIVAL_REDRAW_MS);
};
const redrawForWoods = () => redrawForArrival();
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
  // With each one's age, so a birthday (sim/ages.mjs) fetches the book again and the family's list says the age today.
  const ages = new Map((snapshot.world.entities || []).map(entity => [entity.id, entity.age]));
  const members = (snapshot.world.household?.members || []).map(id => `${id}:${ages.get(id) ?? ''}`).join(',');
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
  const notice = $('#host-notice');
  if (notice?.dataset.confirmFor && notice.dataset.confirmFor === button.dataset.confirmKey) { notice.hidden = true; notice.textContent = ''; delete notice.dataset.confirmFor; }
  delete button.dataset.confirming; delete button.dataset.confirmKey; delete button.dataset.armedAt;
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
/**
 * Somebody at their work, in the pose the one table chose (public/work-art.js `WORK`), timed so its tool and effect land on the
 * pose's own strike: a cycle of the work where the library has one, and where it has not the nearest pose with the stand-in's
 * tool, lean, pace and chips or earth drawn with it. Walking to the work and carrying from it are the ordinary cycles, stepped
 * at the pace they are moved (`gait`). Returns whether the figure was drawn.
 * stand-in: docs/ART_REQUESTS.md, "Request 2026-09-28 — people at work" - every stroke marked 'stand-in' there.
 */
/**
 * Somebody as the drawing of their work needs them: whether they stand at their own home (working about the place happens nowhere
 * else, sim/routines.mjs) and which way the server is stepping them over their land this frame (`ProjectionMotion.heading`).
 * Only for somebody the work table draws, so nobody else is copied.
 */
function atTheirWork(entity, homeSiteId, now, frozen) {
  if (entity.kind !== 'person' || !(entity.chore || entity.task === 'work' || entity.task === 'help')) return entity;
  const shown = { ...entity, atHome: Boolean(homeSiteId) && entity.location?.siteId === homeSiteId };
  if (drawsAtWork(shown)) shown.strolling = motionProjection.heading(entity, now, frozen);
  return shown;
}
function drawAtWork(ctx, binding, clip, x, y, size, entity) {
  let stroke = binding.work;
  // The felling's words moving on from the felling: the tree goes over (`treesFalling`).
  const felling = entity.chore && (entity.chore.id === 'fell-trees' || entity.chore.id === 'fetch-logs') ? entity.chore.doing : null;
  if (entity.id && felling !== undefined) {
    const was = fellingWords.get(entity.id);
    if (was && felling !== was && /fell/i.test(was) && entity.location) treesFalling.set(entity.id, { at: animationTime, where: entity.location, flip: Boolean(entity.flip) });
    if (felling) fellingWords.set(entity.id, felling); else fellingWords.delete(entity.id);
  }
  const id = entity.id || '';
  let seed = workSeeds.get(id);
  if (seed === undefined) { seed = (hashOf(id) % 997) * 7; workSeeds.set(id, seed); }
  const still = reducedMotion.matches || Boolean(binding.frozen);
  // Walked to and fro at the work (`fetch`: a child carrying water down to the water and up to the house), and turned the way the
  // drawing goes (`fetchHeadings`): north and south in the pails' own frames, east and west the side-on ones (`fetchPose`).
  const fetch = stroke.fetch && !still && !entity.strolling ? fetchStep(stroke.fetch, animationTime + seed, seed) : null;
  const way = fetch ? fetchHeadings.update(id, fetch.dx, fetch.dy) : null;
  const going = way ? fetchPose(stroke, way) : null;
  // The cast figure the pose is drawn in (`rust-work` is rust's), whose hands a drawn axe is put in (public/work-art.js `HAFTS`).
  let worn = clip.slice(0, clip.length - stroke.pose.length - 1);
  // A cycle of the work itself where this figure has one (public/work-art.js `drawnStroke`): `rust-chop` for rust felling.
  if (stroke.drawn && stroke.art !== 'journey' && !entity.strolling) {
    // A child's is their own figure's (`boy-shoo`, the one chooser `figureOf`), whatever grown figure the fallback is drawn in.
    const figure = figureOf(entity, entity.observed);
    const prefix = CHILD_FIGURES.has(figure) ? figure : clip.slice(0, clip.length - stroke.pose.length - 1);
    const own = `${prefix}-${going ? going.drawn : stroke.drawn.pose}`;
    if (clipReady(own)) { clip = own; stroke = drawnStroke(stroke); worn = prefix; }
    // Going north or south before those frames are here: their walk that way, not the side-on carry sliding up the page.
    else if (going?.upright) { clip = `${prefix}-${going.pose}`; worn = prefix; }
  }
  if (stroke.art === 'journey' || entity.strolling) {
    return animated(ctx, clip, x, y, size, entity.id, { paused: binding.frozen, flip: binding.upright ? false : entity.flip, gait: entity.gait, appearance: entity.appearance });
  }
  let frames = workFrames.get(clip);
  if (frames === undefined) { const info = clipInfo(clip); frames = info?.frames ? info.frames.map(frame => frame.duration) : null; if (info) workFrames.set(clip, frames); }
  strokeClock(stroke, frames, animationTime + seed, workClockOut);
  if (fetch) { x += fetch.dx * size; y += fetch.dy * size * .8; }
  const shift = still ? 0 : strokeShift(stroke, workClockOut) * size, face = still ? null : strokeFace(stroke, workClockOut);
  const flip = going ? !going.upright && going.west : face ? face === 'w' : binding.upright ? false : Boolean(entity.flip), dir = flip ? -1 : 1;
  const width = animated(ctx, clip, x + shift, y, size, 0, {
    paused: binding.frozen, flip, appearance: entity.appearance,
    timeMs: animationTime + seed, lean: still ? 0 : -strokeLean(stroke, workClockOut) * dir,
  });
  if (!width) return 0;
  const marks = drawWorkLayer(ctx, stroke, x + shift, y, size, dir, workClockOut, still, worn, workEffect);
  // Presentation evidence for the proofs (npm run test:work), read by nothing in the application: what each of the family at work
  // was last drawn doing, which frame of it, and how many marks of its tool and effect. One record a person, kept and rewritten.
  if (id) {
    const seen = (window.__workDrawn ??= {})[id] ??= {};
    seen.activity = activityOf(entity); seen.stroke = binding.stroke; seen.art = stroke.art; seen.clip = clip;
    seen.frame = workClockOut.frame; seen.since = Math.round(workClockOut.since); seen.count = workClockOut.count; seen.marks = marks;
    seen.shift = Math.round(shift * 10) / 10; seen.flip = flip; seen.request = stroke.request || null; seen.tool = stroke.tool || null; seen.heading = way;
    if (!still) workBeat(id, seen.activity, binding.stroke, workClockOut, x + dir * size * .5, y);
  }
  return width;
}
/**
 * The pose a binding asks for beyond the delivered library (public/motion.js `drawnPose`: a child at play, a baby crawling, a
 * grown-up holding the baby, the sick lying down), as `{ clip, upright }`, once its clip can be drawn for this figure; else null
 * and the binding's own clip is drawn, the older stand-in. A west-facing clip of its own (the baby's crawl) is taken for somebody
 * facing west instead of mirroring. Somebody drawn holding a baby is noted, so the baby is not drawn again beside them.
 * stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - area B's poses are Claude-drawn today.
 */
function drawnClipOf(binding, clip, entity) {
  if (!binding?.drawn) return null;
  const west = Boolean(entity.flip) && Boolean(binding.drawn.west);
  const name = drawnClipName(binding, clip, west);
  if (!name || !clipReady(name)) return null;
  if (binding.drawn.holding && entity.id) babiesHeldNow.add(entity.id);
  return { clip: name, upright: west || Boolean(binding.drawn.upright) };
}
/**
 * Somebody with chosen looks, in Astra's figure for their age and head (public/avatar-identity.js `avatarBinding`, 2026-10-02):
 * the pose `entityClip` asks for, in the family figure her art draws them as. Where her figure has no picture of that pose (her
 * new parents and adolescents have one work cycle, not the old cast's sowing, carrying or mending), the binding is her nearest
 * pose, and the work table's stroke follows the pose she drew, with no Claude cycle in its place.
 */
function familyBinding(entity) {
  const asked = entityClip(entity, entity.observed), binding = avatarBinding(entity, asked);
  if (!binding.work) return binding;
  const variant = avatarVariant(entity.appearance, entity.sex, entity), pose = binding.id.slice(variant.length + 1);
  return asked.id.endsWith(`-${pose}`) ? binding : { ...binding, work: { ...binding.work, pose, drawn: null } };
}
function miniPerson(ctx, x, y, size, entity) {
  // A child is drawn smaller than a grown person, in their own figure or a grown one (public/motion.js `entityClip`).
  if (!entity.side) size *= figureScale(entity);
  if (entity.appearance) {
    const binding = familyBinding(entity);
    const clip = binding.id;
    // The pose each of the family was last drawn in, by id: presentation evidence for the proofs (npm run test:children), read by
    // nothing in the application.
    const own = drawnClipOf(binding, clip, entity);
    const flip = own ? (own.upright ? false : entity.flip) : binding.flip ?? (binding.upright ? false : entity.flip);
    if (entity.id) { (window.__clipsDrawn ??= {})[entity.id] = own?.clip || clip; (window.__flipsDrawn ??= {})[entity.id] = Boolean(flip); }
    if (binding.work) { if (drawAtWork(ctx, binding, own?.clip || clip, x, y, size, entity)) return; }
    else if (animated(ctx, own?.clip || clip, x, y, size, entity.id, {
      paused: own ? false : binding.frozen, flip,
      gait: entity.gait, appearance: entity.appearance,
    })) return;
  }
  const binding = entity.side ? { id: `${entity.side === 'mexican' ? 'regular' : 'volunteer'}-idle-e` } : entityClip(entity, entity.observed);
  const own = entity.side ? null : drawnClipOf(binding, binding.id, entity);
  if (entity.id && !entity.side) { (window.__clipsDrawn ??= {})[entity.id] = own?.clip || binding.id; (window.__flipsDrawn ??= {})[entity.id] = (own ? own.upright : binding.upright) ? false : Boolean(entity.flip); }
  if (binding.work && drawAtWork(ctx, binding, own?.clip || binding.id, x, y, size, entity)) return;
  // A north or south cycle is drawn facing that way already; mirroring it would turn a
  // person walking away into a person walking away backwards.
  if (!binding.work && animated(ctx, own?.clip || binding.id, x, y, size, entity.id || entity.side, { paused: own ? false : binding.frozen, flip: (own ? own.upright : binding.upright) ? false : entity.flip, gait: entity.gait })) return;
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
function recliningAvatar(ctx, x, y, size, entity) {
  ctx.save();
  ctx.translate(x + size * .43, y - size * .14);
  ctx.rotate(Math.PI / 2);
  drawAvatar(ctx, 0, 0, size * .9, entity.appearance, entity.sex, { person: entity });
  ctx.restore();
}
// Juniper is an ox and must stay one; the sprite chosen is stable per animal so the same
// beast is recognisable from one lesson to the next.
function miniAnimal(ctx, x, y, size, entity = {}, flip = false) {
  const beast = entity.species === 'horse' ? 'horse' : 'ox';
  const heading = entity.travel ? travelHeading(entity) : null;
  if (beast === 'ox' && entity.travel?.mode === 'foot' && animated(ctx, `ox-packed-walk-${heading || 'e'}`, x, y, size, entity.id, { flip: heading ? false : flip, gait: entity.gait })) return;
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
// Missed, or let go (owner, 2026-10-02: "if they miss, the animal runs away"; sim/chores.mjs `fireShot`): the server marks the quarry
// `fled`, and it is drawn running, away from the hunter, until the hunter turns for home and it is taken off the map.
const QUARRY_RUN = Object.freeze({ deer: 'deer-bound', turkey: 'turkey-bound', mustang: 'mustang-gallop' });
function miniQuarry(ctx, x, y, size, { kind = 'deer', flip = false, alert = false, fled = false, seed = 0 } = {}) {
  if (fled && QUARRY_RUN[kind] && animated(ctx, QUARRY_RUN[kind], x, y, size, seed, { flip })) return;
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
  // The ox is a separate entity: neither the carreta nor the poor family's cart has one painted into the vehicle.
  if (entity.carreta || entity.cart) size *= 0.8;
  const heading = entity.travel ? travelHeading(entity) : null;
  if (entity.carreta && (!entity.condition || entity.condition === 'sound')) {
    // Laden, Claude's `carreta-loaded-travel-*` (request 2026-09-25 "the carreta") where it is loaded; the delivered cycle otherwise.
    if (entity.travel && entity.laden && clipReady(`carreta-loaded-travel-${heading || 'e'}`) && animated(ctx, `carreta-loaded-travel-${heading || 'e'}`, x, y, size, entity.id, { flip: heading ? false : flip, gait: entity.gait })) return;
    if (entity.travel && animated(ctx, `carreta-travel-${heading || 'e'}`, x, y, size, entity.id, { flip: heading ? false : flip, gait: entity.gait })) return;
    if (drawSprite(ctx, entity.laden ? 'carreta-loaded-e' : `carreta-idle-${heading || 'e'}`, x, y, size, { flip: heading ? false : flip })) return;
  }
  // The cart rolling with its wheels turning, and standing, loaded or empty: Claude's `cart-travel-*` and `cart-idle-*` (request
  // 2026-09-25 "riders, walkers and the cart", item 1) where they are loaded, the delivered static `cart-open` views otherwise.
  if (entity.cart && (!entity.condition || entity.condition === 'sound')) {
    const cart = `cart-${entity.travel ? 'travel' : 'idle'}-${entity.laden ? 'loaded-' : ''}${heading || 'e'}`;
    if (clipReady(cart) && animated(ctx, cart, x, y, size, entity.id, { flip: heading ? false : flip, gait: entity.travel ? entity.gait : undefined })) return;
    if (drawSprite(ctx, `cart-open-${heading || 'e'}`, x, y, size, { flip: heading ? false : flip })) return;
  }
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
  const ready = !entity.appearance && Boolean(delivered.whole || delivered.seated) && clipReady(delivered.id);
  const drawn = [];
  const aboard = passengersOf(team, entities);
  // The wagon and its ox as one drawing (Claude's `wagon-ox-*`, public/motion.js `WAGON_RIG`) once its sheet is here, with the tail
  // open and the cover drawn back when anybody rides in it; the family's wagon and ox drawn apart, as before, until then - and
  // always for a cart or carreta, whose ox is drawn by itself, or a wagon come to harm.
  // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - request 2026-09-16, item 1.
  const box = mount.wagon || {};
  const rigClip = seat === 'wagon' && !box.cart && !box.carreta && (!box.condition || box.condition === 'sound') ? wagonRigClip(box, direction, aboard.length) : null;
  const rig = Boolean(rigClip) && clipReady(rigClip.id);
  // Whoever rides in this wagon behind its driver (sim/company.mjs; owner, 2026-09-25), sat in it after the wagon and before the
  // driver, so the driver is drawn in front of them. They are not drawn again beside it (public/motion.js `carriedWithRider`).
  const layout = seatLayout(seat, direction, SIZE, figureScale(entity), ready ? (seat === 'horse' ? MOUNTED_HEIGHT : 1) : 0, rig);
  const rigPart = rig ? layout.find(part => part.part === 'rig') : null;
  const riders = aboard.map((rider, i) => ({ ...bedLayout(direction, i, SIZE, figureScale(rider), rigPart), rider }));
  if (riders.length && rigPart) {
    // In the rig's open tail: the furthest up the screen first. Coming toward the camera the canvas is in front of them, so before
    // the rig; otherwise straight after it, before a driver on the box side-on (a driver going away is behind the canvas, first).
    riders.sort((a, b) => a.dy - b.dy);
    layout.splice(riders[0].behind ? 0 : layout.indexOf(rigPart) + 1, 0, ...riders);
  } else if (riders.length) {
    // Going north they sit nearer the camera than the driver (`front`), so they are drawn after the driver instead.
    const driverAt = layout.findIndex(part => part.part === 'rider');
    layout.splice(riders[0].front ? driverAt + 1 : driverAt, 0, ...riders.reverse());
  }
  for (const part of layout) {
    const px = x + part.dx * size * along, py = y + part.dy * size, height = part.height * size;
    if (part.part === 'rig') {
      // One drawing, mirrored for west as every east cycle is. Coming toward the camera it is drawn a second time up to the ox's
      // yoke only (`band`), so the ox stands in front of the driver as it does of the wagon; the same key and clock, the same frame.
      const opts = { flip: rigClip.upright ? false : flip, gait };
      if (part.band) {
        ctx.save(); ctx.beginPath(); ctx.rect(px - height * 4, py - height * part.band, height * 8, height * 2); ctx.clip();
        animated(ctx, rigClip.id, px, py, height, box.id || `${entity.id}-wagon`, opts);
        ctx.restore();
        continue;
      }
      animated(ctx, rigClip.id, px, py, height, box.id || `${entity.id}-wagon`, opts);
      drawn.push({ part: 'rig', clip: rigClip.id, x: Math.round(px), y: Math.round(py), height: Math.round(height) });
      continue;
    }
    if (part.part === 'passenger') {
      // In an open cart or carreta, or the rig's open tail, the whole seated rider where Claude's is loaded (`passengerClip`): the
      // hip on the seat the layout gives, the rest of them sitting in the bed. stand-in: docs/ART_REQUESTS.md, "Claude-drawn
      // stand-ins (replace with Astra's)"; in the covered wagon drawn apart, and wherever it is not loaded, the cut figure below.
      const open = mount.wagon?.cart || mount.wagon?.carreta || part.rig, sits = open && !part.rider.appearance && passengerClip(part.rider, direction);
      if (sits && clipReady(sits.id)) {
        const hip = py - height * SEAT.hip, whole = height * SEAT.driverHeight;
        animated(ctx, sits.id, px, hip + whole * SEAT.driverHip, whole, part.rider.id, { flip: sits.upright ? false : flip });
        drawnAt.set(part.rider.id, { x: px, y: hip, size: height });
        drawn.push({ part: 'passenger', id: part.rider.id, x: Math.round(px), y: Math.round(py), height: Math.round(height), seated: true });
        continue;
      }
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - riders in the wagon. Their own idle figure, cut below the waist.
      ctx.save();
      ctx.beginPath(); ctx.rect(px - height * 2, py - height * 1.5, height * 4, height * (.5 + part.shown)); ctx.clip();
      const clip = seatedClip(part.rider, direction, null);
      if (part.rider.appearance || !animated(ctx, clip.id, px, py, height, part.rider.id, { paused: true })) miniPerson(ctx, px, py, size, { ...part.rider, travel: null, flip });
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
      if (entity.appearance || !animated(ctx, clip.id, px, py, height, entity.id, { paused: true })) miniPerson(ctx, px, py, size, { ...entity, travel: null, flip });
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
  seatedDrawn.set(entity.id, { seat, direction, art: ready ? delivered.id : null, rig: rig ? rigClip.id : null, parts: drawn });
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
/**
 * Where somebody standing in Gonzales is drawn, and whether they are walking: walked from where they were drawn to where the
 * server has them at a person's pace (public/town-scenes.js `TownWalker`), never slid there in a tick. The separation
 * `stableOffset` gives everybody is folded into the place walked to, in miles so a zoom walks nobody - except for somebody the
 * town's scenes have put somewhere (sim/town-scenes.mjs), who stands exactly where the scene has them. Null for anybody not
 * standing in the town.
 */
function townGround(world, entity, camera, now, frozen) {
  // Somebody at an ambient activity, anywhere (public/ambient.js): walked to a neighbour's door and home again, a load carried
  // back and forth, turned to whoever they keep company with. Walked by the same walker as Gonzales, so nobody slides.
  if (!entity.travel && entity.kind === 'person' && Number.isFinite(entity.location?.x) && (entity.amb || townWalker.seen(entity.id)?.away)) {
    const offset = stableOffset(entity.id), miles = PERSON_MILES / 26;
    const home = { x: entity.location.x + offset.x * miles, y: entity.location.y + offset.y * miles * .8 };
    const one = ambientGround(entity, home, { walker: townWalker, now, time: animationTime, figure: camera.figure, scale: camera.scale, frozen, reducedMotion: reducedMotion.matches, whereIs: id => ambientSpots.get(id), personMiles: PERSON_MILES });
    if (one) {
      ambientSpots.set(entity.id, one.at);
      window.__townWalkers?.push({ id: entity.id, stepping: one.stepping, pose: one.amb?.p || null, x: one.at.x, y: one.at.y, ambient: one.amb?.a || null, ...(entity.amb?.at && { visit: true, arrived: Math.hypot(one.at.x - entity.amb.at.x, one.at.y - entity.amb.at.y) < 0.004 }) });
      return { at: one.at, stepping: one.stepping, pose: null, amb: one.amb, base: one.base };
    }
  }
  if (entity.travel || entity.kind !== 'person' || entity.location?.siteId !== 'gonzales' || !Number.isFinite(entity.location.x)) return null;
  const posed = world.townScenes?.poses?.[entity.id] || null;
  const offset = posed ? { x: 0, y: 0 } : stableOffset(entity.id), miles = PERSON_MILES / 26;
  const target = { x: entity.location.x + offset.x * miles, y: entity.location.y + offset.y * miles * .8 };
  const one = townWalker.step(entity.id, target, now, frozen ? 1e3 : TOWN_WALK * camera.figure / Math.max(1, camera.scale));
  // Presentation evidence for the proofs, as `__drawnAt` is, read by nothing in the application.
  window.__townWalkers?.push({ id: entity.id, stepping: one.moving ? one.dir : null, pose: posed?.pose || null, x: one.at.x, y: one.at.y });
  return { at: one.at, stepping: one.moving ? one.dir : null, pose: posed };
}
function drawEntity(ctx, entity, point, named, size = 20, marks = {}) {
  // One of the family who fell at the Alamo, which the student watched (docs/BATTLES.md §2b.1): drawn lying where he fell
  // while the fight is drawn, and not after it - he is not seen standing at his post again. The family is told nothing.
  if (entity.service?.seenFall && !battleView.isMember(entity.id)) return;
  // A prisoner walked south out of sight down the road to Matamoros (sim/south.mjs `marchPrisoners`, owner 2026-09-26): seen
  // marched away, then gone from the map - not left standing at the road's end.
  if (entity.service?.offMap) return;
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
  // Somebody the family put on the horse for its journey together (sim/company.mjs, owner 2026-09-25) rides behind the last of its
  // vehicles - or behind the ox under its packs on a family with none - so horse, ox and cart are not drawn one on another.
  // The ox of a family on foot carries its own visible packs a length behind the walkers.
  const saddled = entity.kind === 'person' && entity.travel?.saddle && !entity.travel.carried;
  const atWork = !saddled && !entity.travel && !marks.placed && !marks.observed && drawsAtWork(entity) && workSlot(entity, marks.workmates, workSlotOut);
  const rigs = saddled ? wagonTeams(entity.householdId, marks.entities || []).length : 0;
  // Side-on, the wagon and its ox as one drawing (public/motion.js `WAGON_RIG`, once its sheet is here) reach further than the two
  // drawn apart, so the wagons after the first, and the horse after the last, are drawn that much further back (`rigReach`).
  const rigSpan = (train > 0 || rigs) && !vertical && clipReady(wagonRigClip({}, 'e').id) ? RIG_REACH : null;
  const gap = rigSpan ? (rigSpan.ahead + rigSpan.behind + 0.25) * 26 : 82;
  const offset = saddled ? { x: behind.x * (rigs ? (rigSpan ? gap * (rigs - 1) + (rigSpan.behind + 1.3) * 26 : 82 * rigs) : 64), y: behind.y * (rigs ? 60 * rigs : 56) + 4 }
    : entity.travel
    ? (entity.kind === 'wagon' ? { x: -2.4, y: .5 } : entity.kind === 'animal' && entity.travel.mode === 'foot' ? { x: behind.x * 26, y: behind.y * 36 + 2 } : entity.kind === 'animal' ? { x: -1.1, y: .2 }
      : train > 0 ? { x: behind.x * gap * train, y: behind.y * 60 * train + 3 * train }
      : walker >= 0 ? (vertical ? { x: 30 + (walker % 2) * 12, y: behind.y * (8 + 20 * walker) } : { x: behind.x * (-10 + 17 * walker), y: 14 + (walker % 2) * 5 })
      : { x: 0, y: 0 })
    // Somebody standing in Gonzales has been walked to their spot, the separation included (`townGround`).
    : marks.placed ? { x: 0, y: 0 }
    // Somebody at work stands at it, facing it, and several at one piece of work stand round it (public/work-art.js `workSlot`).
    : atWork ? { x: workSlotOut.x * 26, y: workSlotOut.y * 26 }
    : stableOffset(entity.id);
  // Facing the work: read by `drawFigure` for this figure only (`marks` is made for each).
  marks.workFace = atWork ? workSlotOut.face : null;
  // Walking their way across the land this tick (sim/land-paths.mjs, owner 2026-10-02): drawn on it, the separation and the place at
  // the work eased in over the last quarter of the walk, so they are never drawn beside their way and over a tree they went round.
  const walking = !entity.travel && !marks.observed ? motionProjection.walkingShare(entity, marks.now ?? performance.now(), marks.frozen) : null;
  const onWay = walking === null ? 1 : Math.max(0, Math.min(1, (walking - .75) / .25));
  if (walking !== null) (window.__walking ??= {})[entity.id] = +walking.toFixed(3); else if (window.__walking) delete window.__walking[entity.id];
  let x = point.x + offset.x * spread * onWay, y = point.y + offset.y * spread * .8 * onWay;
  // Somebody the server has inside the family's fenced yard is drawn inside its rails (owner, 2026-10-02): the separation never
  // carries a child at play out over the fence.
  const yard = marks.yard, at = entity.location;
  if (yard && at && !entity.travel && at.x >= yard.box.minX && at.x <= yard.box.maxX && at.y >= yard.box.minY && at.y <= yard.box.maxY) {
    x = Math.min(yard.right - 3, Math.max(yard.left + 3, x)); y = Math.min(yard.bottom - 2, Math.max(yard.top + 3, y));
  }
  // Everything is drawn standing on (x, y), so `size` is a height and the click target
  // is the body above that point, not a circle centred on the feet.
  const height = drawnHeightOf(entity, size, seat);
  // How much of this figure is drawn at all: 1 in view, 0 while the middle of a long journey is being crossed with nobody
  // watching (public/motion.js `travelSight`, worked out for the frame in `sightOf`). Nothing stands in for them - the road
  // they are on is all that is drawn, by `drawTravelRoads`.
  const figure = marks.sight ? marks.sight.alpha : 1;
  if (figure > 0) {
    drawnAt.set(entity.id, { x, y: y - height * .45, size: height });
    if (marks.placed) townHeads.set(entity.id, { x, y: y - height, size: height });
    marks.point = point;
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
  seen.heightsPerSecond = 0; seen.journey = null; seen.drawn = false; seen.trailing = false; seen.stepping = null; seen.shownAt = marks.now;
  travelSeen.set(entity.id, seen);
  // Only somebody the server has on the road now is scheduled. On the tick they arrive they are still drawn walking the last
  // of the road in, at the pace the schedule left them at, and whole - which is how a hunter is drawn reading the ground.
  const journey = entity.facing || entity.speaking ? null : motionProjection.journey(entity, marks.frozen);
  // A rider only passing this family: ridden past at his pace and faded out once by (`passSightOf`, owner 2026-09-29) - held
  // where he is drawn while the class is paused, rather than put back where the server has him.
  if (reducedMotion.matches) delete seen.pass;
  else {
    const passed = passSightOf(entity, height, marks, seen, since, journey);
    if (passed !== undefined) return passed;
  }
  if (!marks.running || reducedMotion.matches) { seen.alpha = 1; delete seen.trail; delete seen.walk; return null; }
  // Home before the drawing is (a journey paced on the family's own land, public/motion.js `pacedSight`): still walking the
  // last of the land in at their own pace, never hurried to where the server already has them.
  if (!journey?.points?.length) return trailOf(entity, height, marks, seen, since);
  delete seen.walk;
  const miles = motionProjection.drawnMiles(entity, marks.now, marks.frozen);
  const milesATick = travelMilesATick(journey, minutesATick);
  // Their own pace, not only what their figure's cycle can cover (owner, 2026-09-27): the horse's on horseback, the team's
  // with the wagon, a walker's on foot, in proportion to a grown person's walk (public/motion.js `paceMilesASecond`).
  const gait = paceMilesASecond({ scale: marks.scale, heightPx: height, personPx: marks.figure, speed: journey.speed });
  // The family's own land under this road, once a journey rather than once a frame: a road is a few hundred points and this
  // is asked of every traveller on every painted frame.
  const key = `${entity.id}|${journey.from}|${journey.to}|${journey.points.length}|${journey.base || 0}|${Boolean(ownGrant)}`;
  let runs = landRunCache.get(key);
  if (!runs) {
    if (landRunCache.size > 200) landRunCache.clear();
    runs = landRuns(journey.points, marks.observed ? null : ownGrant, journey.distance, journey.base || 0);
    landRunCache.set(key, runs);
  }
  const milesASecond = drawnMilesASecond({ milesATick, tickMs: marks.tickMs });
  // Land already walked is behind them: once this journey has been drawn past the line out of the family's land, a schedule
  // that changes under it (the camera pressed closer, the class pace, the calendar) must not walk them back onto it to pay
  // for it again - which a paced schedule would (public/motion.js `pacedSight`).
  const past = seen.journeyKey === key && Number.isFinite(wasAt) && wasAt > runs.leaves + 1e-9;
  seen.journeyKey = key;
  const lands = past ? { leaves: 0, enters: runs.enters } : runs;
  const sight = travelSight({ distance: journey.distance, miles, milesASecond, gait, ...lands });
  // A paced journey whose drawn arrival falls after the server's is carried on past it by `trailOf`.
  // `stood` is where the server has them as the trail is laid, which on the tick they arrive is where the road put them (`trailHolds`).
  if (sight.end > journey.distance + 1e-9) seen.trail = { journey, args: { distance: journey.distance, milesASecond, gait, ...lands }, v: miles, end: sight.end, stood: entity.location ? { x: entity.location.x, y: entity.location.y } : null };
  else delete seen.trail;
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
  // Presentation evidence: where this road leaves the family's own land, as the schedule was given it (`landRuns`), whichever
  // schedule is in force - `lead` is only the walked lead while the road is faded, and nothing of the land once it is behind them.
  seen.ownLand = runs.leaves; seen.paced = Boolean(sight.paced);
  seen.at = alongRoute(journey.points, sight.miles - (journey.base || 0)) || null;
  return seen;
}
/**
 * A rider only passing this family, as its page draws him (owner, 2026-09-29: "Show all, but show them riding at a normal
 * looking speed, after they pass by have them fade away and speed up to make up for lost time."; public/motion.js `passBegin`,
 * `passStep`; sim/encounters.mjs `passingOf`). Undefined for anybody else, and for a rider handed back to where the server has
 * him, who is drawn as any traveller. Kept going for a rider the server has already carried out of sight or home (`passGhosts`)
 * until he has faded, so he never vanishes mid-stride. Nothing here changes where the server has him or when.
 */
const passGhosts = new Map();
function passSightOf(entity, height, marks, seen, since, live) {
  if (!entity.carrier) return undefined;
  const server = live ? motionProjection.drawnMiles(entity, marks.now, marks.frozen) : null;
  // How fast the server is carrying him over this screen, in his drawn heights a second, from his last two ticks on one road:
  // the pace he is not drawn at. Presentation evidence (`window.__travelSight`), read by the one-rider proof.
  const before = motionProjection.records.get(entity.id)?.previous?.travel;
  if (entity.travel && before && sameRoad(before, entity.travel) && entity.travel.progress > before.progress && marks.tickMs > 0) {
    seen.serverHeightsPerSecond = Math.max(seen.serverHeightsPerSecond || 0, (entity.travel.progress - before.progress) / (marks.tickMs / 1000) * marks.scale / height);
  }
  let pass = seen.pass;
  // A fresh approach down a road with the family on it - the first sight of him, or a new road after he had gone by.
  if ((!pass || (pass.state === 'gone' || pass.state === 'handed') && live && !sameRoad(live, pass.road)) && live && Number.isFinite(live.near) && !entity.facing && !entity.speaking) {
    const begun = passBegin({ road: live, serverMiles: server });
    // Gone by already on a road he was never drawn riding: a rider handed back and riding on from where he stood is drawn as
    // any traveller; one first seen past the family has passed it while nobody watched.
    if (!(begun.state === 'gone' && pass?.state === 'handed')) pass = seen.pass = begun;
  }
  if (!pass || pass.state === 'handed') return undefined;
  // Waiting for him to come up the road: once the server has him on the stretch - or has carried him past it, or off this road,
  // between two of its ticks, as a fast class does - he is ridden from the start of it, behind the server (`passRide`).
  if (pass.state === 'waiting') {
    passGhosts.set(entity.id, entity);
    if (live && !entity.ghost && sameRoad(live, pass.road) && server < Math.max(0, pass.road.near - PASS_BEFORE_MILES)) { seen.pass = pass; }
    else passRide(pass);
  }
  // Not drawn, and no road drawn for him either (`drawTravelRoads`): he is somebody else's business once he has gone by.
  const hidden = () => { seen.alpha = 0; seen.wanted = 0; seen.passing = true; seen.journey = null; seen.at = live ? alongRoute(live.points, server - (live.base || 0)) || seen.at : seen.at; seen.leapt = true; return seen; };
  if (pass.state === 'waiting' || pass.state === 'gone') return hidden();
  const same = live && !entity.ghost && sameRoad(live, pass.road);
  // Standing, as the server has him, at the end of the road the page is drawing him riding: handed back there once he gets to it.
  const end = pass.road.points.at(-1);
  const standing = !entity.ghost && !entity.travel && Boolean(entity.location) && Math.hypot(entity.location.x - end.x, entity.location.y - end.y) < 0.02;
  const dt = marks.running && since > 0 && since < 1000 ? since : 0;
  const was = pass.d;
  passStep(pass, { dtMs: dt, pace: paceMilesASecond({ scale: marks.scale, heightPx: height, personPx: marks.figure }), cap: same ? server : pass.road.distance, standing });
  if (pass.state === 'handed') { seen.alpha = 1; return undefined; }
  if (pass.state === 'gone' && seen.passFrames) seen.passFaded = true;
  passGhosts.set(entity.id, entity);
  seen.passing = true; seen.alpha = pass.alpha; seen.wanted = pass.state === 'riding' ? 1 : 0; seen.leapt = false; seen.faded = false;
  seen.miles = pass.d; seen.serverMiles = server; seen.journey = null;
  seen.shownHeightsPerSecond = dt > 0 ? (pass.d - was) / (dt / 1000) * marks.scale / height : 0;
  // Kept over the whole pass, frame by frame, for a proof that cannot look at every frame: how many frames he was drawn whole,
  // the fastest he was drawn going while more than half drawn, and whether he has gone again after being seen.
  if (pass.alpha >= 0.9) seen.passFrames = (seen.passFrames || 0) + 1;
  if (pass.alpha > 0.5 && dt > 0) seen.passFastest = Math.max(seen.passFastest || 0, seen.shownHeightsPerSecond);
  seen.at = alongRoute(pass.road.points, pass.d - (pass.road.base || 0)) || seen.at;
  return seen;
}
/**
 * The last of a paced journey, drawn after the server has put them where it ends (owner, 2026-09-27: on the family's own land
 * nobody is drawn faster than their own pace; public/motion.js `pacedSight`). The server's miles run on from the end of the
 * road at the rate they were carried, the same schedule is asked where that puts them, and the figure walks the rest of its
 * land in at its pace until the drawn arrival. Given up - the figure drawn where the server has it - the moment they set out
 * again, stop to speak, the class is paused, or the page was not painting (a hidden tab), since a trail is for somebody
 * watched walking in. And given up the moment the server has them anywhere else at home (public/motion.js `trailHolds`) - a
 * child sent off to play, or to a parent's elbow - for a walk from where they are drawn to where the server has them, at their
 * own pace (`walkOn`): the end of the road is not where they are going any more.
 * ceiling: a trail is a frame-to-frame walk kept by this page, not a server journey: a student who gives an order to somebody
 * still being drawn walking in sees the new journey start from where the server has them, which is the house. Only a journey
 * that cannot walk its own land in the time the class clock gives it trails at all; the way out is a slower class pace.
 */
function trailOf(entity, height, marks, seen, since) {
  const trail = seen.trail;
  if (!trail) return seen.walk ? walkOn(entity, height, marks, seen, since) : null;
  if (entity.travel || entity.facing || entity.speaking || !(since > 0) || since > 1000) { delete seen.trail; seen.alpha = 1; return null; }
  if (!trailHolds(trail.stood, entity.location)) {
    delete seen.trail;
    // Walked on from where they were drawn last frame, if they were drawn whole there; a figure faded off its land is not walked.
    const from = seen.painted || seen.at;
    if (!(seen.alpha > .99) || !from) { seen.alpha = 1; return null; }
    seen.walk = { at: { x: from.x, y: from.y } };
    return walkOn(entity, height, marks, seen, since);
  }
  trail.v += since / 1000 * trail.args.milesASecond;
  if (!(trail.v < trail.end)) { delete seen.trail; seen.alpha = 1; return null; }
  const sight = travelSight({ ...trail.args, miles: trail.v });
  seen.alpha = fadeToward(seen.alpha ?? 1, sight.alpha, since);
  seen.wanted = sight.alpha; seen.miles = sight.miles; seen.serverMiles = trail.args.distance; seen.journey = trail.journey; seen.leapt = false;
  seen.heightsPerSecond = drawnHeightsPerSecond({ milesATick: trail.args.milesASecond, tickMs: 1000, scale: marks.scale, heightPx: height });
  seen.shownHeightsPerSecond = sight.rate * seen.heightsPerSecond;
  seen.faded = sight.faded; seen.lead = sight.lead; seen.tail = sight.tail; seen.trailing = true;
  seen.at = alongRoute(trail.journey.points, sight.miles - (trail.journey.base || 0)) || null;
  return seen;
}
/**
 * Somebody the server moved about their home while they were still drawn walking in (`trailOf`), walked from where they were
 * drawn to where it has them - and on after it, as it moves them - at their own pace: `GAIT_CEILING` of their own drawn height
 * a second (public/motion.js `gaitMilesASecond`), so a child at a child's. Handed back to `ProjectionMotion` once there. Given
 * up, the figure drawn where the server has it, as a trail is: when they set out, stop to speak, the page was not painting, or
 * the server's place is more than a walk away (a Host's jump in time, `TownWalker`'s same six tenths of a mile).
 */
function walkOn(entity, height, marks, seen, since) {
  const to = motionProjection.position(entity, marks.now, marks.frozen);
  const pace = gaitMilesASecond({ scale: marks.scale, heightPx: height * figureScale(entity) });
  if (entity.travel || entity.facing || entity.speaking || !to || !(since > 0) || since > 1000 || !(pace > 0)
    || Math.hypot(to.x - seen.walk.at.x, to.y - seen.walk.at.y) > 0.6) { delete seen.walk; seen.alpha = 1; return null; }
  const step = walkToward(seen.walk.at, to, pace * since / 1000);
  if (step.arrived) { delete seen.walk; seen.alpha = 1; return null; }
  seen.walk.at = step.at;
  seen.alpha = 1; seen.wanted = 1; seen.leapt = false; seen.faded = false;
  seen.at = step.at; seen.stepping = step.dir;
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
  // A family's own person in a fight, drawn doing what the force round them does - loading and firing at their own pace -
  // at the place the server put them (public/battle-view.js `memberPose`, docs/BATTLES.md §2.6). Their name, their ring and
  // their click are this function's, as for anybody.
  // A family's man killed in a fight his family has not yet had word of lies where he fell, on his own family's map only
  // (sim/battle-stage.mjs `lyingOnField`, `FIC-GONZ-439`): no blood, no gore.
  const pose = entity.kind === 'person' ? battleView.memberPose(entity, animationTime) || (entity.fallen ? { sprite: 'volunteer-reclining', flip: false } : null) : null;
  if (pose) {
    // A rider is drawn a horse's height (docs/BATTLES.md §6.13: Grant's men at Agua Dulce).
    const drawnSize = size * (pose.scale || 1);
    let done;
    // In their own cast figure where it is drawn (public/battle-view.js `poseOf` `cast`: Claude's `<cast>-fire-reload`, `-load`,
    // `-injured`, `-reclining`; stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "battles: the pieces the engine stands in
    // for", item 1); the recoloured idle laid down or the hoeing cycle while it loads. Chosen as every drawn pose is, by a
    // binding's `drawn` through `drawnClipOf` (public/motion.js): the hoeing cycle is its fallback, the battle pose the one drawn.
    const cast = entity.appearance ? pose.cast || (entity.fallen && 'reclining') : null;
    const variant = cast ? avatarVariant(entity.appearance, entity.sex, entity) : null;
    const own = cast ? drawnClipOf({ id: `${variant}-work`, drawn: { from: 'work', pose: cast === 'fire-reload' ? cast : `battle-${cast}` } }, `${variant}-work`, entity) : null;
    if (own && drawAvatar(ctx, x, y, drawnSize, entity.appearance, entity.sex, { phase: (pose.timeMs || 0) / 165, working: true, flip: pose.flip, clip: own.clip, person: entity })) done = true;
    // Presentation evidence for the battle proofs, read by nothing in the application: the cast poses each member was drawn in.
    if (done && entity.id) ((window.__memberCastDrawn ??= {})[entity.id] ??= new Set()).add(own.clip);
    else if (entity.appearance && entity.fallen) { recliningAvatar(ctx, x, y, drawnSize, entity); done = true; }
    else if (entity.appearance) done = drawAvatar(ctx, x, y, drawnSize, entity.appearance, entity.sex, { phase: reducedMotion.matches ? 0 : performance.now() / 165, working: true, flip: pose.flip, person: entity });
    else done = pose.sprite ? drawSprite(ctx, pose.sprite, x, y, drawnSize, { flip: pose.flip }) : animated(ctx, pose.clip, x, y, drawnSize, entity.id, { timeMs: pose.timeMs, flip: pose.flip });
    if (!done) miniPerson(ctx, x, y, size, { ...entity, observed: marks.observed });
    // Where he was drawn, on the ground - his cosmetic step aside included, so his shot's smoke, the clearing in the smoke round him
    // and his name on the class view are all where the figure is (2026-09-30).
    if (marks.ground) battleView.memberDrawn(entity.id, marks.scale > 0 && marks.point ? { x: marks.ground.x + (x - marks.point.x) / marks.scale, y: marks.ground.y + (y - marks.point.y) / marks.scale } : marks.ground, size);
    ctx.globalAlpha = alphaWas;
    return;
  }
  // A family's own man who fell in a fight the family watched lies where he fell (docs/BATTLES.md §2b.1, §6.14): the server
  // sends `down` to his own family only, and the family's reports still wait for the word.
  if (entity.kind === 'person' && entity.service?.down && !entity.travel) {
    if (entity.appearance) recliningAvatar(ctx, x, y, size, entity);
    else if (!drawSprite(ctx, 'volunteer-reclining', x, y, size)) miniPerson(ctx, x, y, size, { ...entity, observed: marks.observed });
    ctx.globalAlpha = alphaWas;
    return;
  }
  // The sheets all face right, so anyone walking west is mirrored. A rider who has
  // reined in is turned toward the person they are speaking to instead, which the server
  // works out from where the two of them actually are.
  // Somebody walking across Gonzales faces the way they are walking, and somebody in one of its scenes the way the scene has
  // them turned (public/town-scenes.js).
  // Somebody at work faces it (`workSlot`), somebody the server is stepping over their own land to it faces the way they go, and
  // somebody at an ambient activity is turned the way the server or their company has them (public/ambient.js), and a little one
  // about the yard the way they were last seen going (`yardHeading`).
  const flip = entity.facing ? entity.facing === 'w' : entity.stepping ? entity.stepping === 'w' : entity.scenePose ? entity.scenePose.face === 'w'
    : entity.strolling ? entity.strolling === 'w' : entity.amb ? entity.amb.f === 'w' : marks.workFace ? marks.workFace === 'w'
    : entity.yardHeading ? entity.yardHeading === 'w' : travelDirection(entity) === 'w';
  // Somebody on the road steps at the rate the ground drawn under them goes past (public/motion.js `gaitStep`),
  // measured in their own drawn height: a child's shorter stride, a horse's longer one.
  const onFoot = entity.kind === 'person' && !mounted(entity);
  // Not somebody halted on the road at an ambient activity: their pose plays by the clock, not by ground that is not going past.
  const gait = (entity.travel && !entity.travel.halted && !entity.facing && !entity.amb || entity.stepping || entity.strolling) && marks.ground && marks.scale > 0
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
    // Its box too, for the speech bubbles' layout, which keeps every bubble off a name (public/speech.js `speechLayout`).
    drawn.push({ name: label.name, x: Math.round(label.x), y: Math.round(box.y), steppedDown: Math.round(box.y - label.y), box: { x: box.left, y: box.top, w: box.right - box.left, h: box.bottom - box.top } });
  }
  return { drawn, dropped };
}
/**
 * The lone parent's path on the map (sim/courtship.mjs, docs/FAMILY_CREATION.md *The lone parent's path*): where the family's
 * own land is on the screen, and how big a person is drawn there, or null when it is off the screen or too far out to matter.
 */
function pathGlowAt(world, camera, canvas) {
  const home = sitesOf(world).find(site => site.id === homeOf(world));
  if (!home) return null;
  const at = camera.toScreen(home);
  const size = Math.max(14, Math.min(90, camera.figure || 24));
  if (at.x < -size * 4 || at.y < -size * 4 || at.x > canvas.width + size * 4 || at.y > canvas.height + size * 4) return null;
  return { x: at.x, y: at.y, size };
}
/** A slow warm glow on the ground of the family's land while the ability waits (still, where less motion is asked for). */
function drawPathGlow(ctx, at, camera) {
  const breath = reducedMotion.matches ? 0.5 : 0.5 + 0.5 * Math.sin(performance.now() / 700);
  const radius = at.size * (2.6 + breath * 0.5);
  ctx.save();
  const glow = ctx.createRadialGradient(at.x, at.y, radius * 0.1, at.x, at.y, radius);
  glow.addColorStop(0, `rgba(255,214,110,${0.42 + breath * 0.18})`); glow.addColorStop(0.55, 'rgba(255,170,90,.18)'); glow.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.ellipse(at.x, at.y, radius, radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,220,130,${0.55 + breath * 0.35})`; ctx.lineWidth = Math.max(1.5, at.size * 0.06);
  ctx.beginPath(); ctx.ellipse(at.x, at.y, radius * 0.72, radius * 0.72 * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
/** Over the land, the ability's own icon in a halo, bobbing a little. Returns where it was drawn, for the proofs. */
function drawPathMarker(ctx, at, camera) {
  const bob = reducedMotion.matches ? 0 : Math.sin(performance.now() / 520) * at.size * 0.08;
  const r = Math.max(12, at.size * 0.55), x = at.x, y = at.y - at.size * 2.7 + bob;
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.9);
  halo.addColorStop(0, 'rgba(255,214,110,.75)'); halo.addColorStop(1, 'rgba(255,214,110,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff4d4'; ctx.strokeStyle = '#d9a441'; ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  drawAskIcon(ctx, x, y, r * 1.7);
  ctx.restore();
  return { x: Math.round(x), y: Math.round(y), r: Math.round(r) };
}
/**
 * The ability's icon: `icon-ask-neighbours` (docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's wedding, item 6), or,
 * until it can be drawn, a cabin with smoke and a heart over it in the panel's stroke. stand-in: that request, item 6.
 */
function drawAskIcon(ctx, x, y, size) {
  if (spriteFrame('icon-ask-neighbours') && drawSprite(ctx, 'icon-ask-neighbours', x, y + size * 0.42, size * 0.84)) return 'drawn';
  const s = size / 2;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.2, s * 0.09); ctx.strokeStyle = '#3d220c';
  ctx.fillStyle = '#9a6a3a';
  ctx.beginPath(); ctx.moveTo(x - s * 0.55, y + s * 0.45); ctx.lineTo(x - s * 0.55, y - s * 0.02); ctx.lineTo(x, y - s * 0.4); ctx.lineTo(x + s * 0.55, y - s * 0.02); ctx.lineTo(x + s * 0.55, y + s * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3d220c'; ctx.fillRect(x - s * 0.12, y + s * 0.12, s * 0.24, s * 0.33);
  ctx.fillStyle = '#c2582c';
  const hx = x + s * 0.02, hy = y - s * 0.62, hr = s * 0.17;
  ctx.beginPath(); ctx.moveTo(hx, hy + hr * 1.6); ctx.bezierCurveTo(hx - hr * 2.2, hy + hr * 0.2, hx - hr * 0.9, hy - hr * 1.4, hx, hy - hr * 0.3); ctx.bezierCurveTo(hx + hr * 0.9, hy - hr * 1.4, hx + hr * 2.2, hy + hr * 0.2, hx, hy + hr * 1.6); ctx.fill();
  ctx.restore();
  return 'stand-in';
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
  // Clear of a question that will not wait before the rooms are drawn at the width that leaves them (triage 2026-09-29, 2.2).
  clearOfNotice();
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
// Formation soldiers are visual samples of aggregate state, never duplicate person entities; they are drawn by
// public/battle-view.js since 2026-09-25, which replaced `drawFormations` here.
/**
 * What is happening in the fight, in words, over the top of the map while it is fought: the phase's name and the server's
 * caption for it (sim/battles/<id>.mjs). Drawn on the canvas, under every panel, so it never covers a control; a student
 * who has only watched still has the sentence that says what they are watching (owner: "players should walk away
 * understanding what happened").
 */
/**
 * Where on the canvas a speech bubble can be read, at a given height: between whatever stands down the left (the status lines,
 * the family's column, a land chooser) and down the right (the teacher's or Play Solo's controls, the guided start, the
 * messages, the meeting, the call's menu, a town scene, packing the wagon). `drawSpeech` slides a bubble into it (the overlap
 * proof, owner 2026-09-28: a line of the town's talk was 89% under the land chooser at 1280x800). Read once per frame, and
 * only when a bubble is actually drawn.
 */
function speechRoom(canvas) {
  let boxes = null;
  const measure = () => {
    const frame = canvas.getBoundingClientRect(), k = canvas.width / (frame.width || 1);
    return [...document.querySelectorAll('#hud-left > *, #site-choose, #survey-choose, #hud-right > *, #lesson, #lesson-resume, #military-notice, #encounter, #call-menu, #town-scene, #wagon-load, #tip, #host-spotlight, #map-tools, #selection, #errand, #going, .panel-row[data-focused=true] .panel-icons')]
      .filter(one => !one.hidden).map(one => one.getBoundingClientRect()).filter(box => box.width && box.height)
      .map(box => ({ left: (box.left - frame.left) * k, right: (box.right - frame.left) * k, top: (box.top - frame.top) * k, bottom: (box.bottom - frame.top) * k }));
  };
  // The stretch clear of every piece at the bubble's height nearest where it wants to stand, wide enough for it (`w`), or null.
  const room = (top, bottom, x = canvas.width / 2, w = 0) => {
    boxes ||= measure();
    let free = [[2, canvas.width - 2]];
    for (const box of boxes) {
      if (box.bottom <= top || box.top >= bottom) continue;
      free = free.flatMap(([a, b]) => [[a, Math.min(b, box.left - 6)], [Math.max(a, box.right + 6), b]]).filter(([a, b]) => b - a > 0);
    }
    const fits = free.filter(([a, b]) => b - a >= w);
    if (!fits.length) return null;
    const away = ([a, b]) => (x - w / 2 < a ? a - (x - w / 2) : x + w / 2 > b ? x + w / 2 - b : 0);
    const [left, right] = fits.reduce((best, span) => (away(span) < away(best) ? span : best));
    return { left, right };
  };
  // How much of a box (canvas pixels) the pieces stand over, 0 to 1: the speech layout holds a bubble it could not fit in the
  // room to a little of it (public/speech.js `UNDER_AT_MOST`; the overlap proof fails half).
  room.under = box => {
    boxes ||= measure();
    const area = box.w * box.h || 1;
    let covered = 0;
    for (const one of boxes) covered += Math.max(0, Math.min(box.x + box.w, one.right) - Math.max(box.x, one.left)) * Math.max(0, Math.min(box.y + box.h, one.bottom) - Math.max(box.y, one.top));
    return Math.min(1, covered / area);
  };
  return room;
}
function drawBattleCaption(ctx, battle, canvas) {
  const text = battle.caption || '', title = battle.title || '';
  if (!text) return;
  ctx.save();
  // Between the two sides of the screen, not under them: the family's column or the Host's class down the left, the
  // teacher's controls and the messages down the right (the overlap proof, owner 2026-09-28: at 1024x768 the Host's class
  // panel stood over 40% of it). Only what stands in the caption's band near the top counts.
  const frame = canvas.getBoundingClientRect(), scale = canvas.height / (frame.height || 1);
  let fromX = frame.left + 12, toX = frame.right - 12;
  for (const one of document.querySelectorAll('#family-panel, #host-live, #hud-left > *, #hud-right > *, #military-notice')) {
    if (one.hidden) continue;
    const at = one.getBoundingClientRect();
    if (!at.width || !at.height || at.top > frame.top + 260 || at.bottom < frame.top + 50) continue;
    if (at.left + at.width / 2 < frame.left + frame.width / 2) fromX = Math.max(fromX, at.right + 12); else toX = Math.min(toX, at.left - 12);
  }
  const between = toX - fromX >= 240;
  const room = between ? (toX - fromX) * scale : canvas.width - 40;
  const width = Math.min(560, canvas.width - 40, room);
  const middle = between ? ((fromX + toX) / 2 - frame.left) * scale : canvas.width / 2;
  ctx.font = '14px Georgia';
  const words = text.split(/\s+/), lines = [];
  let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > width - 24) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line);
  const height = 16 + (title ? 20 : 0) + lines.length * 18;
  // Under whatever the page has at the top middle - the Host's spotlight banner, the guided start - never behind it.
  const box = canvas.getBoundingClientRect(), k = canvas.height / (box.height || 1);
  let top = 58;
  for (const selector of ['#host-spotlight', '#lesson', '#lesson-resume']) {
    const element = $(selector);
    if (!element || element.hidden) continue;
    const at = element.getBoundingClientRect();
    // Only what stands at the top: the Host's banner has stood at the bottom since 2026-09-28.
    if (at.height && at.top < box.top + box.height / 3 && at.left < box.left + (middle + width / 2) / k && at.right > box.left + (middle - width / 2) / k) top = Math.max(top, (at.bottom - box.top) * k + 8);
  }
  const left = middle - width / 2;
  ctx.fillStyle = 'rgba(251,246,234,.9)'; ctx.strokeStyle = '#8a7a58'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(left, top, width, height, 7) : ctx.rect(left, top, width, height); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f2a1f'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  if (title) { ctx.font = 'bold 14px Georgia'; ctx.fillText(title, left + 12, top + 8); }
  ctx.font = '14px Georgia';
  lines.forEach((one, index) => ctx.fillText(one, left + 12, top + 8 + (title ? 20 : 0) + index * 18));
  ctx.restore();
  window.__battleCaption = { title, text, top, height, left, width };
}export function visibleEntityIds(world, siteId = null) {
  return entitiesOf(world).filter(entity => !siteId || entity.location?.siteId === siteId).map(entity => entity.id);
}
// One map, one camera. The view follows the student's own household and widens when
// somebody travels; the regional and public picture is the Host's projected screen, not a
// second panel here. A student may also pan, zoom, or pick one of their own people to
// watch, and Follow gives the family frame back. What none of that does is change what
// they are allowed to see: the camera moves over a projection the server already decided,
// so looking somewhere is never a way of learning something.
const MIN_EXTENT = 3.4;
/** The least ground a fight is framed with, in miles across: both lines and the ground between, men big enough to see. */
const BATTLE_EXTENT = 0.75;
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
// How far the wagon and its ox as one drawing reach ahead of and behind their driver, in persons (public/motion.js `rigReach`).
const RIG_REACH = rigReach(SIZE);
// Which way each of the family's little ones is seen going about the yard, from where they were drawn the frame before (in miles
// of the map): what turns a child running at tag north, south, east or west (public/motion.js `DrawnHeading`, `littleClip`).
const yardHeadings = new DrawnHeading(1e-7);
// And which way somebody the page walks to and fro at their work is going (public/work-art.js `fetchStep`), in figure heights.
const fetchHeadings = new DrawnHeading(1e-4);
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
// The view Watch set on a fight's card, while it is still the view: the camera then frames the fight as it moves (`cameraFor`).
let fieldWatch = null;
// The view a "!" or a story card set on the family's own chase while the one it is about is out of sight (`unseenOnRoad`, owner
// 2026-09-29): the camera frames the soldiers and the family's place as they move, not a figure it does not draw (`cameraFor`).
// A pan, a zoom or Follow ends it, as they end Watch.
// ceiling: framed on the server's point for the family, a tick at a time, not a drawn figure walking; a drawn chase point is the
// way out if the step between ticks is ever noticed.
let chaseWatch = null;
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
/**
 * The ground a fight is framed on: each side and the gun with room round them for their ranks and their smoke, and more
 * above than below, because the top of the page carries the banner and the caption and the figures stand up from their feet.
 */
const fieldFrame = points => points.frame ? points : points.flatMap(point => [{ x: point.x - 0.13, y: point.y - 0.24 }, { x: point.x + 0.13, y: point.y + 0.1 }]);
// Where the engagement names the ground it is fought over (Béxar: the houses north of the plaza and the Alamo's guns at the
// east edge), that ground; otherwise every body of men drawn - each side and each group drawn apart from it (Palm Sunday's
// three roads, the Mexicans round Coleto's square, Concepción's companies) - and the guns. A body gone from the field is not
// framed, unless nothing else is left to frame (the Mexicans gone toward Béxar at Concepción). Nor is a group more than a mile
// from the sides (San Jacinto's Deaf Smith riding for Vince's bridge): the camera stays on the fight. A frame the engagement
// marks tight (`frameTight`, the Alamo's compound, whose frames already hold the room round it) is taken as it is.
const nearTheSides = (sides, body) => !sides.length || Math.hypot(body.x - sides.reduce((s, one) => s + one.x, 0) / sides.length, body.y - sides.reduce((s, one) => s + one.y, 0) / sides.length) < 1;
const battlePoints = world => {
  const fight = world.battle;
  if (fight?.frame?.length) {
    const points = fight.frame.map(point => ({ x: point.x, y: point.y }));
    return fight.frameTight ? Object.assign(points, { frame: true }) : points;
  }
  const sides = fight?.sides || [];
  const bodies = [...sides, ...(fight?.groups || []).filter(group => nearTheSides(sides, group))], here = bodies.filter(body => body.action !== 'gone');
  return [...(here.length ? here : bodies.length ? bodies : fight?.formations || []), ...(fight?.cannon ? [fight.cannon] : []), ...(fight?.guns || [])].map(point => ({ x: point.x, y: point.y }));
};
function framingFor(world) {
  // The country outside the box (docs/MAP_ACCURACY.md §11) is drawn where it is, but it never frames a view: framing the
  // region on Matamoros, 250 miles south of the colonies, would shrink the settlements to nothing. The map still zooms out
  // to the whole drawn country by hand.
  const sites = sitesOf(world).filter(site => !site.outside), home = world.map?.sites?.[homeOf(world)];
  const fighting = battlePoints(world);
  if (world.role === 'host') {
    const focus = world.host?.focus;
    // A fight being fought: the field itself, both sides and the ground between, with room round it for the smoke
    // (docs/BATTLES.md §2.1). The town seven miles off is not in it.
    if (focus === 'battle' && fighting.length) return { kind: 'battle', title: world.battle.name || 'The fight', points: fieldFrame(fighting) };
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
function autoView(world, canvas, framing = framingFor(world)) {
  const points = framing.points.length ? framing.points : [{ x: 0, y: 0 }];
  let minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  // A lone homestead must still show the ground around it rather than zooming forever. A fight is framed close: its two
  // sides a few hundred yards apart are the whole picture, and at a homestead's extent every man in it is a dot.
  const extent = framing.kind === 'battle' ? BATTLE_EXTENT : MIN_EXTENT, least = framing.kind === 'battle' ? .05 : null;
  const padX = Math.max((extent - (maxX - minX)) / 2, (maxX - minX) * .18, least ?? .25);
  const padY = Math.max((extent * .56 - (maxY - minY)) / 2, (maxY - minY) * .18, least ?? .18);
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
  // Never kept on somebody who has fallen (docs/BATTLES.md §2b.1: the camera stays on the wall, not on him).
  if (watchedId && entitiesOf(world).some(entity => entity.id === watchedId && (entity.service?.seenFall || entity.service?.offMap))) watchedId = null;
  // Nor on somebody faded out on the road (`unseenOnRoad`, owner 2026-09-29): the camera does not follow a figure it does not draw.
  if (watchedId && unseenOnRoad.has(watchedId)) watchedId = null;
  const watched = watchedId ? entitiesOf(world).find(entity => entity.id === watchedId && entity.location) : null;
  const at = watched?.location
    ? motionProjection.position(watched, now, reducedMotion.matches || world.status !== 'running')
    : null;
  const following = !manualView && !watched;
  // Watch on a fight's card (docs/BATTLES.md §2.7): the fight framed as it moves - both sides, the gun and their smoke -
  // for as long as the student leaves the view where Watch put it. A pan or a zoom makes a new view, and that wins.
  const fieldView = !watched && fieldWatch && manualView === fieldWatch.view && world.battle?.sides
    ? autoView(world, canvas, { kind: 'battle', title: world.battle.name || 'The fight', points: fieldFrame(battlePoints(world)) }) : null;
  const chase = !watched && !fieldView && chaseWatch && manualView === chaseWatch.view ? world.flight?.chase : null;
  const chaseFrame = chase && Number.isFinite(chase.x) && Number.isFinite(chase.y) ? { cx: chase.x, cy: chase.y, scale: chaseWatch.view.scale } : null;
  // The film of a fight, while it has the camera (public/battle-cinema.js): it beats every other frame until the teacher (or the
  // student who pressed Watch) takes the camera back.
  // Only a view with a centre and a scale: a film that ever hands back less (the fight gone from the map during its establishing
  // shot, fixed 2026-10-01 in public/battle-cinema.js and held by tests/battle-cinema.test.mjs) leaves the page its own camera
  // rather than a class view that throws on every frame.
  const film = cinemaFor(world), filmSaid = film.driving ? film.view(now) : null;
  const filmView = filmSaid && [filmSaid.cx, filmSaid.cy, filmSaid.scale].every(Number.isFinite) ? filmSaid : null;
  // A gun's shot jolts the film's camera a few pixels (public/battle-cinema.js `shake`).
  const jolt = filmView ? film.shake(now) : null;
  const raw = (filmView && jolt && (jolt.x || jolt.y) ? { ...filmView, cx: filmView.cx + jolt.x / filmView.scale, cy: filmView.cy + jolt.y / filmView.scale } : filmView) || (at
    ? { cx: at.x, cy: at.y, scale: clampTo(Math.max(auto.scale, limits.max * .55), limits) }
    : fieldView || chaseFrame || (following ? auto : manualView));
  const scale = clampTo(raw.scale, limits);
  const { cx, cy } = clampCentre(raw.cx, raw.cy, scale, world, canvas);
  const framed = filmView ? { ...auto, kind: 'battle', title: world.battle?.name || 'The fight' } : fieldView || auto;
  return {
    ...framed, cx, cy, scale, following: following && !filmView, limits, watching: watched?.id || null, film: film.driving ? film.state : null,
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
    // One of Gonzales's scenes before the fight under the tap: its card (public/town-scenes.js). Before the family's own
    // land is looked over, because the town is never anybody's land and a tap on it is never a house site.
    const townScene = window.__snapshot && townSceneAt(window.__snapshot.world.townScenes, townSceneSpots, point, window.__camera?.figure || 18, townHeads);
    if (townScene && !entityAt(point)) { townSceneOpen = townScene; townSceneShown = ''; renderTownScene(window.__snapshot.world); return; }
    // Choosing the family's stops on the Scrape (the flight card's "Pick on the map"): a tap adds the nearest place it may make
    // for, within a finger's width. The server says whether the route can be gone; this only fills the list.
    if (routePicking && routeDraft) {
      const view = currentView(), snapshot = window.__snapshot;
      if (view && snapshot) {
        const at = worldAt(view, point, size()), sites = snapshot.world.map?.sites || {};
        const reach = 36 / Math.max(1, view.scale);
        const near = routePlacesOf(snapshot.world).map(id => sites[id]).filter(Boolean).map(site => ({ site, d: Math.hypot(site.x - at.x, site.y - at.y) })).filter(one => one.d <= reach).sort((a, b) => a.d - b.d)[0];
        if (near && routeDraft.stops.at(-1) !== near.site.id && routeDraft.stops.length < 6) { routeDraft.stops.push(near.site.id); routeDraft.ways.push('road'); routeEditorKey = ''; renderSelection(snapshot.world); requestMapDraw(); }
        else say(near ? 'That place is already the last stop, or there are six.' : 'Tap nearer a town, a landing, a ferry or a plantation.');
      }
      return;
    }
    if (siteLooking() || surveyLooking()) {
      // Looking over the family's own land for a house site or ten acres to survey: a tap is a place, not a person.
      const view = currentView();
      if (view) {
        const at = worldAt(view, point, size());
        // The chooser opened by a plot tapped on the map: another plot tapped is looked at for what it is now (owner, 2026-09-30).
        const plot = plotFromMap && surveyLooking() && window.__snapshot && ownPlotAt(window.__snapshot.world, at);
        if (plot) openPlotChooser(window.__snapshot.world, plot);
        else (siteLooking() ? lookAtSite : lookAtPlot)(at);
      }
      return;
    }
    const hit = entityAt(point);
    // Nobody under the tap, but the family's own house is: open the rooms inside (docs/SETTLING_IN.md step 7).
    const house = !hit && houseAt(point);
    if (house) { interiorSiteId = house; clearInteriorChoice(); const panel = $('#interior'); if (panel) delete panel.dataset.shown; if (window.__snapshot) renderInteriorPanel(window.__snapshot.world); }
    // Nobody and no house, but a plot of the family's own field: what grows there, chosen right there (owner, 2026-09-30: "let me
    // click on the fields so i can select what is grown there"; docs/LAND_GRANTS.md §5.2). A person on the plot is still chosen.
    if (!hit && !house && window.__snapshot) {
      const view = currentView();
      const plot = view && ownPlotAt(window.__snapshot.world, worldAt(view, point, size()));
      if (plot && openPlotChooser(window.__snapshot.world, plot)) return;
    }
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
  // A plot of the family's own field under a mouse is lit, and the pointer is a hand (owner, 2026-09-30: visual cues over
  // explanation): it can be clicked for what grows there. Not while a place is being chosen, or a house placed.
  const hoverPlot = event => {
    const snapshot = window.__snapshot;
    let id = null;
    if (snapshot && !housePlacement && !routePicking && !siteLooking() && !(surveyLooking() && !plotFromMap) && event) {
      if (performance.now() - measuredAt > 500) measure();
      const view = currentView(), point = localPoint(event);
      const plot = view && !entityAt(point) && ownPlotAt(snapshot.world, worldAt(view, point, size()));
      id = plot ? plot.id : null;
    }
    if (id === plotHover) return;
    plotHover = id; canvas.style.cursor = id ? 'pointer' : '';
    requestMapDraw();
  };
  canvas.addEventListener('pointerleave', () => hoverPlot(null));
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' && !active.size) hoverPlot(event);
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
    // Taking hold of the map is taking the camera back - from the film of a fight too.
    stopWatching(); takeCamera();
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
    stopWatching(); takeCamera();
    manualView = zoomAbout(view, factor, localPoint(event), size(), view.limits);
    handOnMap(WHEEL_SETTLE_MS); requestMapDraw();
  }, { passive: false });
  // The map focused: arrows pan and + and - zoom, for a student whose pointer is not helping.
  // The ring Enter looks through comes and goes with the map's focus (`drawKeyTarget`).
  canvas.addEventListener('focus', () => requestMapDraw());
  canvas.addEventListener('blur', () => requestMapDraw());
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // Enter (or the space bar) while a place is being chosen - the house site, ten acres, a plot, the house's own place - picks
    // the spot in the map's middle, as a tap there would (triage 2.13): with the arrow keys, the map for a keyboard alone.
    if ((event.key === 'Enter' || event.key === ' ') && (siteLooking() || surveyLooking() || housePlacement)) {
      event.preventDefault();
      tapAt({ x: canvas.width / 2, y: canvas.height / 2 });
      return;
    }
    const view = currentView(); if (!view) return;
    const next = keyView(view, event.key, size(), view.limits);
    if (!next) return;
    event.preventDefault();
    stopWatching(); takeCamera();
    manualView = next;
    requestMapDraw();
  });
}
function applyMapView(action, { street = false, at = null } = {}) {
  const snapshot = window.__snapshot; if (!snapshot) return;
  const world = snapshot.world, canvas = $('#world-map');
  if (action === 'cinema') { toggleCinema(world); return; }
  takeCamera(world);
  if (action === 'follow') { manualView = null; fieldWatch = null; stopWatching(); drawWorld(world); return; }
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
  landMaking++;
  smoothOffThread({ kind: 'land', grid: { columns: grid.columns, rows: grid.rows, cells: grid.cells, shade: grid.shade }, palette, upscale })
    .then(async ({ pictures: data }) => {
      const [wash, shade] = await Promise.all([toBitmap(data.wash), toBitmap(data.shade)]);
      landPictures.set(grid, { upscale, wash, shade });
      redrawForArrival();
    }).finally(() => { landMaking--; });
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
      const point = camera.toScreen(tree), look = treeLook(tree, figure);
      const mix = windAt ? windAt(tree.x) : null;
      scattered.push({ ...look, point, seed: Math.round(tree.x * 1e5), alpha: treesShown, lean: mix ? windLean(mix) : 0, gale: mix ? inGale(mix) : false });
    }
    // What the family has felled: a stump, and a log lying beside it while any are left to haul (sim/felling.mjs). The
    // trunk is `log-fallen-hardwood` (trees-colonies-2, 2026-09-21) where a hardwood was cut and the softer `log-fallen`
    // where a pine or a cottonwood was.
    // stand-in: hardwood stumps use the nearest post-oak or cottonwood stump of Astra's, behind the kind's own (`ownStump`:
    // hickory, walnut, ash, the oaks, the live oak), which is Claude-drawn today. Pine has its delivered stump.
    // Request 2026-09-15 - the trees of the colonies; request 2026-09-19 - the country of 1836, remaining species.
    const stumps = stumpsVisible(camera, canvas, woodsCatalogue);
    for (const stump of stumps) {
      const point = camera.toScreen(stump), pine = ['loblolly', 'shortleaf', 'longleaf'].includes(stump.kind.id), soft = ['cottonwood', 'sycamore', 'willow'].includes(stump.kind.id);
      const borrowed = stump.kind.stump || (pine ? 'stump-pine-loblolly' : soft ? 'stump-cottonwood' : 'stump-post-oak');
      scattered.push({ tree: stump.kind.ownStump || borrowed, standIn: stump.kind.ownStump ? borrowed : null, height: figure * SIZE.stump, point, seed: 0, alpha: treesShown });
      if (stump.left > 0) scattered.push({ tree: pine || soft ? 'log-fallen' : 'log-fallen-hardwood', height: figure * SIZE.stump * .8, point: { x: point.x + figure * .35, y: point.y + figure * .08 }, seed: 0, alpha: treesShown });
    }
    window.__stumpsDrawn = stumps.length;
    for (const [id, fall] of treesFalling) {
      const since = animationTime - fall.at;
      if (since < 0 || since > TREE_FALL_MS) { treesFalling.delete(id); continue; }
      const point = camera.toScreen(fall.where);
      scattered.push({ fall: since, flip: fall.flip, height: figure, point: { x: point.x + (fall.flip ? -1 : 1) * figure * .55, y: point.y }, seed: 0, alpha: treesShown });
      window.__treesFalling = (window.__treesFalling || 0) + 1;
    }
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
  for (const { share, seed, timber, point, tree, standIn = null, height, alpha, ground, lean = 0, gale = false, fall, flip } of scattered) {
    if (fall !== undefined) {
      faded(alpha, () => drawClip(ctx, 'tree-fall', point.x, point.y, height, { timeMs: fall, flip }));
    } else if (tree) {
      faded(alpha, () => {
        if (gale && GALE_POSES[tree] && drawSprite(ctx, GALE_POSES[tree], point.x, point.y, height)) { galeDrawn++; return; }
        if (drawSprite(ctx, tree, point.x, point.y, height, { lean })) return;
        // A kind's own art not loaded (or not there): the picture it borrowed, in its gale pose where it has one.
        if (standIn && gale && GALE_POSES[standIn] && drawSprite(ctx, GALE_POSES[standIn], point.x, point.y, height)) { galeDrawn++; return; }
        if (!(standIn && drawSprite(ctx, standIn, point.x, point.y, height, { lean }))) postOak(ctx, point.x, point.y, height, seed, lean, gale);
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
    ctx.lineWidth = style.width || Math.max(1.2, Math.min(3, camera.figure * .05)); ctx.strokeStyle = style.stroke; ctx.stroke();
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
      // Each plot its own crop and stage (owner, 2026-09-30; sim/crops.mjs): a server of before sends the family's one field state.
      const growing = !plot.sown ? null : plot.crop ? { crop: plot.crop, state: plot.ripe ? 'ripe' : 'planted' } : field && field.state !== 'bare' ? field : null;
      const corners = fieldPatch(ctx, camera, rectOf(plot), growing, plot.fence, `${householdId}:${plot.id}`);
      drawn.push({ id: plot.id, ...whose, state: plot.state, ground: plot.ground, sown: Boolean(growing), ...(growing && { crop: growing.crop, stage: growing.state }), fence: plot.fence || 'none', corners });
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
  // The plot under the mouse, lit, for a click on it (`hoverPlot`): a light edge and a wash, no words.
  const lit = !host && plotHover && (world.land?.plots || []).find(plot => plot.id === plotHover);
  if (lit) square(lit, { stroke: '#ffe27a', fill: 'rgba(255,232,140,.24)', width: 4 });
  window.__plotHover = lit ? lit.id : null;
  if (plotPick && surveyLooking()) {
    // Surveying looks at new ground; clearing and fencing at the plot under the tap, outlined where the server found it.
    const target = plotJob === 'survey-plot' ? plotPick.point : (world.land?.plots || []).find(plot => plot.id === plotPick.facts?.plotId);
    // A hunt is a place, not ten acres: a ring where the hunter will go.
    if (plotJob === 'hunt-land' || plotJob === 'fell-trees') {
      // Felling takes the trees within a few rods of the place (sim/felling.mjs `FELL_REACH`), and the ring is that far.
      const at = camera.toScreen(plotPick.point), radius = plotJob === 'fell-trees' ? Math.max(6, camera.scale * 0.05) : Math.max(6, Math.min(40, camera.scale * 0.03));
      ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeStyle = plotPick.facts?.can ? '#b5452f' : '#8a8171';
      ctx.beginPath(); ctx.arc(at.x, at.y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (plotJob === 'cut-path') {
      // The line the path would follow, from where the server says it begins (sim/land-paths.mjs `pathStart`), and a ring at its end.
      const to = camera.toScreen(plotPick.point), from = plotPick.facts?.from ? camera.toScreen(plotPick.facts.from) : null;
      ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 2.5; ctx.strokeStyle = plotPick.facts?.can ? '#b5452f' : '#8a8171';
      if (from) { ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(to.x, to.y, Math.max(5, camera.figure * .2), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (target) square(target, { stroke: plotPick.facts?.can ? '#b5452f' : '#8a8171', fill: plotPick.facts?.can ? 'rgba(181,69,47,.12)' : 'rgba(138,129,113,.12)', dash: [6, 4] });
  }
  window.__plotsDrawn = drawn;
  const decorations=[];
  for(const plot of knownLands(world).flatMap(land=>land.plots||[])){const r=rectOf(plot),size=Math.min(camera.figure*.25,(r.right-r.left)*.1);if(size<3||(host&&!onScreen(r)))continue;
    for(const piece of plotArt(plot)){const x=r.left+(r.right-r.left)*piece.x,y=r.top+(r.bottom-r.top)*piece.y;drawSprite(ctx,piece.sprite,x,y,size);decorations.push({plotId:plot.id,sprite:piece.sprite,x,y});}
  }
  window.__plotArtDrawn=decorations;
}
/**
 * The family's paths and the ground of its yard, under the woods (owner, 2026-10-02; sim/land-paths.mjs): a trodden-earth way
 * along every path as far as it is made - a soft worn verge with a packed line down the middle, like the lane but narrower -
 * the stakes of the part still to cut as a dashed line, and the yard's swept earth. Only the family's own; its rails are drawn
 * over the woods with the field's (`drawYardFence`).
 * stand-in: docs/ART_REQUESTS.md, request 2026-10-02 "paths and the yard" - drawn procedurally, as the roads are, until a
 * trodden-path tile and a paling are drawn.
 */
function drawLandPaths(ctx, world, camera) {
  const land = !hostView(world) && world.land;
  const drawn = [];
  if (!land) { window.__pathsDrawn = drawn; return; }
  const yard = land.yard;
  if (yard) {
    const a = camera.toScreen({ x: yard.minX, y: yard.minY }), b = camera.toScreen({ x: yard.maxX, y: yard.maxY });
    ctx.save(); ctx.fillStyle = 'rgba(176,146,98,.4)'; ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.restore();
  }
  const width = Math.max(1.5, Math.min(26, camera.scale * .004 + camera.figure * .16));
  for (const path of land.paths || []) {
    const total = path.points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path.points[i].x, p.y - path.points[i].y), 0);
    const made = Number.isFinite(path.cut) ? Math.min(total, path.cut) : total;
    const [worn, staked] = made >= total - 1e-6 ? [path.points, []] : made <= 1e-6 ? [[], path.points] : splitAlong(path.points, made);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (worn.length > 1) {
      const line = worn.map(camera.toScreen);
      ctx.beginPath(); line.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(160,128,86,.42)'; ctx.lineWidth = width; ctx.stroke();
      ctx.strokeStyle = 'rgba(122,94,60,.55)'; ctx.lineWidth = Math.max(1, width * .4); ctx.stroke();
    }
    if (staked.length > 1) {
      const line = staked.map(camera.toScreen);
      ctx.setLineDash([Math.max(3, width * .6), Math.max(4, width)]);
      ctx.beginPath(); line.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(107,79,42,.7)'; ctx.lineWidth = Math.max(1.2, width * .3); ctx.stroke();
    }
    ctx.restore();
    drawn.push({ id: path.id, kind: path.kind, made: +made.toFixed(4), miles: +total.toFixed(4), worn: worn.length > 1 ? worn.map(camera.toScreen).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })) : [] });
  }
  // Presentation evidence for the proofs (scripts/land-paths-browser-proof.mjs), read by nothing in the application.
  window.__pathsDrawn = drawn;
}
/** The yard's rails, drawn with the field's (`railFence`), over the woods; and where they were drawn, for the proofs. */
function drawYardFence(ctx, world, camera) {
  const yard = !hostView(world) && world.land?.yard;
  window.__yardDrawn = null;
  if (!yard) return;
  const a = camera.toScreen({ x: yard.minX, y: yard.minY }), b = camera.toScreen({ x: yard.maxX, y: yard.maxY });
  const corners = [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }, { x: a.x, y: b.y }];
  if (camera.scale > 40) {
    // The top rail as one line under the delivered rail pictures, so the yard reads as one enclosure and not a ring of marks.
    if (yard.fence !== 'ruined') {
      ctx.save(); ctx.lineJoin = 'round';
      ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      ctx.strokeStyle = 'rgba(110,82,50,.85)'; ctx.lineWidth = Math.max(1.5, Math.min(6, camera.figure * .07)); ctx.stroke();
      ctx.restore();
    }
    railFence(ctx, corners, camera.figure, yard.fence === 'ruined');
  }
  window.__yardDrawn = { fence: yard.fence, left: Math.round(a.x), top: Math.round(a.y), right: Math.round(b.x), bottom: Math.round(b.y) };
}
/**
 * A tree of the woods as it is drawn: its picture, the picture it borrows while its own is missing, and its height on the screen.
 * The kind's picture, optional per-size pictures, and physical height come from the woods catalogue (sim/woods.mjs `KINDS`).
 * The kind's own art first where it has some (`own`, sim/woods.mjs): the picture it borrowed is what is drawn while that
 * sheet is missing. stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the country of 1836, remaining species.
 */
function treeLook(tree, figure) {
  const height = figure * SIZE.timberTree * TREE_SIZES[tree.size] * (tree.kind.scale || 1);
  const sizeName = ['pole', 'log', 'large'][tree.size];
  const deliveredSizes = tree.kind.sized ?? ['pine-loblolly', 'cedar', 'mesquite', 'live-oak', 'elm', 'post-oak', 'blackjack', 'pecan', 'hackberry', 'sweetgum'].includes(tree.kind.picture);
  const picture = tree.kind.pictures?.[tree.size] || (deliveredSizes ? `${tree.kind.picture}-${sizeName}` : tree.kind.picture);
  return { tree: tree.kind.own ? `${tree.kind.own}-${sizeName}` : picture, standIn: tree.kind.own ? picture : null, height };
}
/** How wide a tree's crown is drawn, as a share of its height either side of its trunk; a person's figure, of theirs. */
const CROWN_HALF = 0.42, FIGURE_HALF = 0.28;
/**
 * The trees standing in front of somebody on the family's land and over their figure, drawn again after them in the order of the
 * ground (owner, 2026-10-02: "it's weird seeing characters walk over trees"). The woods are drawn into the kept ground, under
 * everybody; a person walking behind a tree was drawn over its crown. Now a tree whose trunk stands nearer the viewer than their
 * feet, and whose crown reaches over them, is drawn again over them, so they are seen among the trees and behind the ones in front.
 * `people` are `{ point, figure }` on the screen. Only while the trees are drawn one by one; cheap, because only the tiles under
 * each person are read.
 */
function treesInFront(ctx, world, camera, canvas, people, standing) {
  const shown = [];
  if (!woodsShown(world) || !woodsCatalogue || !people.length) { window.__treesInFront = shown; return; }
  const strength = woodsLayersFor(camera, canvas).trees;
  if (!(strength > 0.02)) { window.__treesInFront = shown; return; }
  const figure = camera.figure, reach = figure * SIZE.timberTree * 1.2 / camera.scale;
  const seen = new Set();
  for (const person of people) {
    const at = camera.toWorld(person.point);
    for (const tree of treesNear(at, reach, woodsCatalogue)) {
      const key = `${tree.x},${tree.y}`;
      if (seen.has(key)) continue;
      const point = camera.toScreen(tree), look = treeLook(tree, figure);
      // In front (nearer the viewer, lower on the screen), and its crown over the figure's body.
      if (point.y <= person.point.y || point.y - look.height >= person.point.y) continue;
      if (Math.abs(point.x - person.point.x) >= look.height * CROWN_HALF + person.figure * FIGURE_HALF) continue;
      seen.add(key);
      standing.push({ y: point.y, draw: () => {
        const was = ctx.globalAlpha; ctx.globalAlpha = was * strength;
        if (!drawSprite(ctx, look.tree, point.x, point.y, look.height) && !(look.standIn && drawSprite(ctx, look.standIn, point.x, point.y, look.height))) postOak(ctx, point.x, point.y, look.height, Math.round(tree.x * 1e5));
        ctx.globalAlpha = was;
      } });
      shown.push({ x: Math.round(point.x), y: Math.round(point.y), over: person.id });
    }
  }
  // Presentation evidence for the proofs (scripts/land-paths-browser-proof.mjs), read by nothing in the application.
  window.__treesInFront = shown;
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
/**
 * Where Enter would look (triage 2.13): a ring and cross in the map's middle while the map has the keyboard's focus and a place is
 * being chosen, so a student moving the map with the arrow keys can see the spot Enter picks (`tapAt` in the map's keys).
 */
function drawKeyTarget(ctx, camera) {
  const canvas = $('#world-map');
  const aiming = document.activeElement === canvas && (siteLooking() || surveyLooking() || Boolean(housePlacement && !housePlacement.locked));
  window.__keyTarget = aiming;
  if (!aiming) return;
  const at = camera.toScreen({ x: camera.cx, y: camera.cy }), r = 14;
  ctx.save();
  for (const [width, colour] of [[4, 'rgba(255,248,226,.9)'], [2, '#4b3e28']]) {
    ctx.lineWidth = width; ctx.strokeStyle = colour;
    ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
    ctx.moveTo(at.x - r * 1.6, at.y); ctx.lineTo(at.x - r * .5, at.y); ctx.moveTo(at.x + r * .5, at.y); ctx.lineTo(at.x + r * 1.6, at.y);
    ctx.moveTo(at.x, at.y - r * 1.6); ctx.lineTo(at.x, at.y - r * .5); ctx.moveTo(at.x, at.y + r * .5); ctx.lineTo(at.x, at.y + r * 1.6);
    ctx.stroke();
  }
  ctx.restore();
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
// `missing`: the sheets the kept ground was last drawn without (public/art.js `watchMissing`); null when that is not known.
const mapBase = { canvas: null, key: null, state: null, time: 0, audited: null, missing: null };
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
/**
 * A camera for the flashback (public/flashback.js): centred where it is told, at `scale` pixels a mile, on a canvas that is not
 * the map's. The same shape `cameraFor` gives, so the ground, the houses and the figures are drawn at the sizes they always are.
 */
function flashbackCamera(canvas, cx, cy, scale) {
  return {
    cx, cy, scale, following: false, kind: 'flashback',
    toScreen: p => ({ x: canvas.width / 2 + (p.x - cx) * scale, y: canvas.height / 2 + (p.y - cy) * scale }),
    toWorld: s => ({ x: cx + (s.x - canvas.width / 2) / scale, y: cy + (s.y - canvas.height / 2) / scale }),
    figure: Math.max(7, Math.min(150, scale * PERSON_MILES)), house: houseScale(scale), named: scale > 3.2,
  };
}
/** The ground under a flashback's picture: the map's own land, water, scatter, terrain and fields, as the kept ground is drawn. */
function flashbackGround(ctx, world, camera) {
  ctx.fillStyle = '#9fbe73'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawRelief(ctx, world, camera);
  // The scatter and the fields read the page's woods and plots; a flashback drawn before either has loaded is drawn without them.
  try { drawGroundDetail(ctx, world, camera); } catch { /* the ground without its scatter */ }
  drawTerrain(ctx, world, camera);
  try { drawPlots(ctx, world, camera); } catch { /* the ground without the fields */ }
}
/**
 * The whole map drawn once. With `window.__mapDraws` set to an array - by a proof, and by nothing in the application - each draw
 * is recorded there: how long it took, whether the kept ground was drawn again in it, how many sheets it drew for the first
 * time, and the famous people drawn. That tells a proof's steady frames from the first draws after new art or a new view
 * (scripts/famous-people-browser-proof.mjs `mapFrames`), and the snapshot's and the arrival's draws are in it as well as the
 * animation's own.
 */
/**
 * What the film of a fight is told this frame (public/battle-cinema.js `update`): whether a fight is being fought for this page,
 * the view that frames it, and the class's own people in it where they are drawn - the Host's every family's (the server names
 * them in `members`), a student's their own. A man shown hit (`memberDown`, from the minute the server sent it) is not followed.
 */
function cinemaInput(world, canvas) {
  const fight = world.battle?.sides ? world.battle : null, host = world.role === 'host';
  const field = fight ? autoView(world, canvas, { kind: 'battle', title: fight.name || 'The fight', points: fieldFrame(battlePoints(world)) }) : null;
  const liftPx = host ? canvas.height * 0.08 : 0;
  const own = new Set(entitiesOf(world).map(entity => entity.id));
  const people = new Map([...entitiesOf(world), ...observedOf(world)].map(entity => [entity.id, entity]));
  const now = performance.now();
  const members = (fight?.members || []).filter(id => host || own.has(id)).map(id => {
    const spot = battleView.memberSpot(id), entity = people.get(id), at = spot || entity?.location;
    return { id, x: at?.x, y: at?.y, fallen: battleView.memberDown(id, now) || Boolean(entity?.service?.seenFall) };
  }).filter(one => Number.isFinite(one.x));
  return {
    // The Host's: what the server says the class view films (owner, 2026-09-30: "major historical events, and events that would
    // matter to the players"; sim/battle-stage.mjs `filmedAs`). A student's: while Watch is on.
    focus: host ? Boolean(world.host?.film) && Boolean(fight) : Boolean(fight && fieldWatch && manualView === fieldWatch.view),
    // On the Host the fight is framed a little above the middle, clear of the spotlight's banner at the foot of the map.
    battleId: fight?.id || null, field: field && { cx: field.cx, cy: field.cy + liftPx / field.scale, scale: field.scale }, members, live: Boolean(fight?.live && !fight.over), liftPx,
    firing: Boolean(fight && [...fight.sides, ...(fight.groups || [])].some(body => body.fire && body.fire !== 'none' && body.action !== 'gone')),
    running: world.status === 'running', ended: world.status === 'ended' || Boolean(world.endSequence), reduced: reducedMotion.matches,
    current: drawnCamera ? { cx: drawnCamera.cx, cy: drawnCamera.cy, scale: drawnCamera.scale } : null,
    home: manualView ? { cx: manualView.cx, cy: manualView.cy, scale: manualView.scale } : null,
  };
}
/** Once a frame: the film moved on, and the teacher's own view put back when a fight it filmed is over (with the fade). */
function runCinema(world, canvas, now) {
  const film = cinemaFor(world);
  // Only a page that could ever film: a student's waits for the Watch card, and costs nothing until then.
  if (world.role !== 'host' && film.state === 'off') return;
  film.update(cinemaInput(world, canvas), now);
  const back = film.takeRestore();
  if (back) { manualView = back.view ? { ...back.view } : null; fieldWatch = null; stopWatching(); }
}
/**
 * The camera taken from the film by the one watching: it stays where the film had it, and is theirs (Esc, the button, a drag,
 * a zoom, any of the map's buttons). Nothing is put back at the end of that fight.
 */
function takeCamera(world = window.__snapshot?.world) {
  if (!world) return;
  const film = cinemaFor(world);
  if (!film.driving) return;
  const at = film.release(performance.now());
  if (at) manualView = { cx: at.cx, cy: at.cy, scale: at.scale };
  if (world.role !== 'host') fieldWatch = null;
}
/** The film's button: take the camera, or give it back to the film. */
function toggleCinema(world) {
  const film = cinemaFor(world), canvas = $('#world-map');
  if (film.driving) takeCamera(world);
  else film.resume(cinemaInput(world, canvas), performance.now());
  drawWorld(world);
}
// Esc takes the camera back from the film, wherever the focus is - unless something else open on the page takes Esc first.
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  const world = window.__snapshot?.world;
  if (!world || !cinemaFor(world).driving) return;
  event.preventDefault();
  takeCamera(world);
  drawWorld(world);
});
/**
 * Over everything on the map while a fight is drawn: each of the class's own people in it named, with their family's colour -
 * the Host's every family's, a student's own while their film runs - then the film's bars, its title over the establishing shot,
 * and its fade. The names are drawn over the smoke, so a man in the thick of it is still found; one shown hit has his name
 * dimmed, never a word of his fate (the server sends that only from its minute, and the page draws only what it was sent).
 */
function drawCinema(ctx, world, camera, canvas, now) {
  const film = cinemaFor(world), fight = world.battle?.sides ? world.battle : null, host = world.role === 'host';
  const evidence = { state: film.state, followed: film.followed, holding: film.holding, film: world.host?.film || null, battle: fight?.id || null, tags: [], fade: 0, bars: 0, title: 0, log: film.log.slice(-12) };
  const scaleText = Math.max(0.85, Math.min(1.5, canvas.height / 768));
  if (fight && (host || film.driving)) {
    const people = new Map([...entitiesOf(world), ...observedOf(world)].map(entity => [entity.id, entity]));
    const own = new Set(entitiesOf(world).map(entity => entity.id));
    const families = new Map((world.live?.families || []).map(family => [family.id, family.name]));
    const boxes = [], tags = [];
    for (const id of fight.members || []) {
      if (!host && !own.has(id)) continue;
      // Where the figure was drawn this frame (`drawnAt` keeps its middle and height), or where the server has him.
      const entity = people.get(id), drawn = drawnAt.get(id), spot = battleView.memberSpot(id) || entity?.location;
      if (!entity || (!drawn && !spot)) continue;
      const at = drawn ? { x: drawn.x, y: drawn.y + drawn.size * 0.45 } : camera.toScreen(spot);
      if (at.x < -40 || at.y < -40 || at.x > canvas.width + 40 || at.y > canvas.height + 40) continue;
      tags.push({ id, entity, at, down: battleView.memberDown(id, now), followed: film.followed === id,
        family: host ? families.get(entity.householdId) || '' : familyCache?.name || '', colour: familyColour(entity.householdId) });
    }
    // The one followed last, so it is always drawn and on top; the rest step up out of each other's way, or wait their turn.
    tags.sort((a, b) => Number(a.followed) - Number(b.followed) || b.at.y - a.at.y);
    const close = camera.figure >= 16;
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (const tag of tags) {
      const nameFont = `bold ${Math.round(12 * scaleText)}px system-ui`, familyFont = `${Math.round(10.5 * scaleText)}px system-ui`;
      ctx.font = nameFont;
      const nameWidth = ctx.measureText(tag.entity.name).width;
      ctx.font = familyFont;
      const familyWidth = close && tag.family ? ctx.measureText(tag.family).width : 0;
      const width = Math.max(nameWidth, familyWidth) + 20 * scaleText, height = (close && tag.family ? 30 : 18) * scaleText;
      let x = tag.at.x - width / 2, y = tag.at.y - camera.figure * 1.25 - height - (tag.followed ? 14 * scaleText : 0);
      let placed = false;
      for (let tries = 0; tries < 4 && !placed; tries++) {
        if (!boxes.some(b => x < b.x + b.w && b.x < x + width && y < b.y + b.h && b.y < y + height)) placed = true; else y -= height + 3;
      }
      if (!placed && !tag.followed) continue;
      boxes.push({ x, y, w: width, h: height });
      // A ring of the family's colour at his feet, over the smoke, so a man lost in it is still found.
      if (close && !tag.down) {
        ctx.globalAlpha = tag.followed ? 0.95 : 0.7; ctx.strokeStyle = tag.colour; ctx.lineWidth = tag.followed ? 3 : 2;
        ctx.beginPath(); ctx.ellipse(tag.at.x, tag.at.y, camera.figure * 0.5, camera.figure * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = tag.down ? 0.6 : 1;
      ctx.fillStyle = tag.down ? 'rgba(70,66,60,.82)' : 'rgba(30,25,19,.84)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, width, height, 5 * scaleText) : ctx.rect(x, y, width, height); ctx.fill();
      if (tag.followed) { ctx.lineWidth = 2.5; ctx.strokeStyle = tag.colour; ctx.stroke(); }
      // The family's colour down the tag's left edge, and a pointer to the man.
      ctx.fillStyle = tag.colour; ctx.fillRect(x, y + 3 * scaleText, 5 * scaleText, height - 6 * scaleText);
      ctx.beginPath(); ctx.moveTo(tag.at.x - 5, y + height); ctx.lineTo(tag.at.x + 5, y + height); ctx.lineTo(tag.at.x, y + height + 6); ctx.closePath();
      ctx.fillStyle = tag.down ? 'rgba(70,66,60,.82)' : 'rgba(30,25,19,.84)'; ctx.fill();
      ctx.fillStyle = tag.down ? '#cfc8b8' : '#fff6e4'; ctx.font = nameFont;
      ctx.fillText(tag.entity.name, x + 11 * scaleText, y + 13.5 * scaleText);
      if (close && tag.family) { ctx.fillStyle = tag.down ? '#b8b1a2' : '#e9d9b4'; ctx.font = familyFont; ctx.fillText(tag.family, x + 11 * scaleText, y + 26 * scaleText); }
      if (tag.followed) {
        ctx.font = `bold ${Math.round(10 * scaleText)}px system-ui`; ctx.fillStyle = '#fff6e4'; ctx.strokeStyle = 'rgba(30,25,19,.9)'; ctx.lineWidth = 3;
        ctx.strokeText('FOLLOWING', x, y - 4); ctx.fillText('FOLLOWING', x, y - 4);
      }
      ctx.globalAlpha = 1;
      evidence.tags.push({ id: tag.id, name: tag.entity.name, family: tag.family, colour: tag.colour, householdId: tag.entity.householdId, x: Math.round(tag.at.x), y: Math.round(y), down: tag.down, followed: tag.followed });
    }
    ctx.restore();
  }
  // The film itself, on the Host's map: the bars, the title over the establishing shot, and the fade to and from black.
  const bars = film.bars(now), title = film.title(now), fade = film.fade(now);
  evidence.bars = +bars.toFixed(2); evidence.title = +title.toFixed(2); evidence.fade = +fade.toFixed(2);
  ctx.save();
  if (bars > 0) {
    const h = Math.round(canvas.height * 0.045 * bars);
    ctx.fillStyle = '#0b0906'; ctx.fillRect(0, 0, canvas.width, h); ctx.fillRect(0, canvas.height - h, canvas.width, h);
  }
  // The fade first and the title over it, so the title comes up over black and stays as the field fades in behind it.
  if (fade > 0) { ctx.globalAlpha = Math.min(1, fade); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.globalAlpha = 1;
  if (title > 0 && fight) {
    // The fight's name, its day and its hour, and who of the class is in it - the families' colours - to watch for.
    const date = world.historicalDate ? new Date(`${world.historicalDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
    const names = evidence.tags.map(tag => tag);
    ctx.globalAlpha = title;
    // In the room between the class down the left and the teacher's controls down the right, as the fight's caption keeps to.
    const frame = canvas.getBoundingClientRect(), k = canvas.width / (frame.width || 1);
    let fromX = frame.left + 12, toX = frame.right - 12;
    for (const one of document.querySelectorAll('#family-panel, #host-live, #hud-left > *, #hud-right > *')) {
      if (one.hidden) continue;
      const at = one.getBoundingClientRect();
      if (!at.width || at.bottom < frame.top + frame.height * 0.55 || at.top > frame.top + frame.height * 0.75) continue;
      if (at.left + at.width / 2 < frame.left + frame.width / 2) fromX = Math.max(fromX, at.right + 12); else toX = Math.min(toX, at.left - 12);
    }
    const room = toX - fromX >= 320 ? { middle: ((fromX + toX) / 2 - frame.left) * k, width: (toX - fromX) * k } : { middle: canvas.width / 2, width: canvas.width - 40 };
    const w = Math.min(room.width - 40, 640 * scaleText), cx = room.middle, top = canvas.height * 0.58;
    const h = (names.length ? 118 : 86) * scaleText;
    const grad = ctx.createLinearGradient(0, top, 0, top + h);
    grad.addColorStop(0, 'rgba(14,11,8,0)'); grad.addColorStop(0.25, 'rgba(14,11,8,.62)'); grad.addColorStop(0.75, 'rgba(14,11,8,.62)'); grad.addColorStop(1, 'rgba(14,11,8,0)');
    ctx.fillStyle = grad; ctx.fillRect(cx - w / 2 - 20, top, w + 40, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f3e7cc'; ctx.font = `${Math.round(13 * scaleText)}px system-ui`;
    ctx.fillText([date, fight.title].filter(Boolean).join('  ·  ').toUpperCase(), cx, top + 28 * scaleText);
    ctx.font = `${Math.round(34 * scaleText)}px Georgia`; ctx.fillStyle = '#fff8e8';
    ctx.fillText(fight.name || 'The fight', cx, top + 66 * scaleText);
    if (names.length) {
      ctx.font = `${Math.round(13 * scaleText)}px system-ui`;
      const shown = names.slice(0, 6), more = names.length - shown.length;
      const words = shown.map(tag => tag.name), text = `In the fight: ${words.join(', ')}${more > 0 ? `, and ${more} more` : ''}`;
      ctx.fillStyle = '#efe3c6'; ctx.fillText(text, cx, top + 96 * scaleText);
      // A dot of each family's colour under the line.
      const step = 14 * scaleText, from = cx - (shown.length - 1) * step / 2;
      shown.forEach((tag, i) => { ctx.fillStyle = tag.colour; ctx.beginPath(); ctx.arc(from + i * step, top + 107 * scaleText, 4 * scaleText, 0, Math.PI * 2); ctx.fill(); });
    }
  }
  ctx.restore();
  evidence.field = film.field ? { cx: +film.field.cx.toFixed(4), cy: +film.field.cy.toFixed(4), scale: Math.round(film.field.scale) } : null;
  evidence.view = film.driving ? (() => { const v = film.view(now); return v && Number.isFinite(v.cx) ? { cx: +v.cx.toFixed(4), cy: +v.cy.toFixed(4), scale: Math.round(v.scale) } : null; })() : null;
  // Presentation evidence, read by scripts/battle-cinema-browser-proof.mjs and by nothing in the application.
  window.__cinema = evidence;
}
export function drawWorld(world) {
  const log = window.__mapDraws;
  if (!Array.isArray(log)) { drawWorldNow(world); return; }
  const sheets = sheetsFirstDrawn(), grounds = window.__groundDrawn || 0, began = performance.now();
  drawWorldNow(world);
  log.push({
    at: began, ms: performance.now() - began, animation: drawingAnimation, ground: (window.__groundDrawn || 0) !== grounds,
    firstSheets: sheetsFirstDrawn() - sheets, camera: window.__camera?.kind, famous: (window.__famousDrawn || []).map(one => [one.id, one.how]),
  });
  if (log.length > 4000) log.splice(0, log.length - 4000);
}
function drawWorldNow(world) {
  noteTick(world);
  window.__animationClips = new Set();
  const canvas = $('#world-map'), main = canvas.getContext('2d');
  fitCanvas();
  // One moment for the frame: the camera and everybody drawn in it (`sightOf` too).
  const frameNow = performance.now();
  runCinema(world, canvas, frameNow);
  const camera = cameraFor(world, canvas, frameNow);
  drawnCamera = { cx: camera.cx, cy: camera.cy, scale: camera.scale, width: canvas.width, height: canvas.height };
  mapDrawWanted = false; lastMapDraw = performance.now(); gesturePicture = null;
  window.__camera = { kind: camera.kind, scale: camera.scale, named: camera.named, cx: camera.cx, cy: camera.cy, following: camera.following, watching: camera.watching ?? null, figure: camera.figure, house: camera.house };
  foldSiteChooser(world, camera, canvas);
  // The ground is drawn again only when something it is drawn from changed (`groundInputs`, public/map-base.js): not for a
  // snapshot in which only people moved, nor for a click that renders one. The pick being made on the land is drawn into it.
  // The plot lit under the mouse (`hoverPlot`) is drawn into it too: the ground is drawn again as the mouse goes onto a plot and off.
  const picking = surveyLooking() && plotPick ? [plotJob, plotPick.point, plotPick.facts?.can ?? null, plotPick.facts?.plotId ?? null] : null;
  const pick = picking || plotHover ? JSON.stringify([picking, plotHover]) : null;
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
  // The sheets the kept ground is drawn without, from here to where it goes down on the page (`redrawForArrival`). What this
  // span draws straight onto the page's canvas is noted too, and the arrival of one of those draws the ground again as well.
  // ceiling: a few needless ground redraws while the shops', cows' and wood piles' sheets arrive; noting only the ground's own
  // draws would take a second drawing context through every drawing function here.
  const groundMissing = ground && !audit ? watchMissing() : null;
  if (ground) {
    const frameTime = animationTime;
    if (audit) animationTime = mapBase.time;
    ground.clearRect(0, 0, canvas.width, canvas.height);
    ground.fillStyle = '#9fbe73'; ground.fillRect(0, 0, canvas.width, canvas.height);
    window.__relief = drawRelief(ground, world, camera);
    if (woodsShown(world) && woodsCatalogue) drawWoodsCover(ground, camera, canvas, woodsCatalogue);
    // The family's paths and its yard's swept earth, under the trees and the grass (owner, 2026-10-02).
    try { drawLandPaths(ground, world, camera); } catch { /* the ground without its paths */ }
    drawGroundDetail(ground, world, camera);
    drawTerrain(ground, world, camera);
    drawHolding(ground, world, camera);
    drawPlots(ground, world, camera);
    try { drawYardFence(ground, world, camera); } catch { /* the ground without the yard's rails */ }
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
  // The shops' and buildings' names drawn on the map this frame, which no speech bubble may cover (`speechLayout` below).
  const shopNames = [];
  townLabelsDrawn.length = 0;
  const standing = [];
  // Heads in Gonzales this frame, for the words said over them (public/town-scenes.js); filled as the figures are laid out.
  townHeads.clear(); townSceneSpots.clear(); window.__townCast = []; window.__townWalkers = [];
  ambientHeads.clear();
  // A town's dated scenes (sim/town-scenes.mjs), laid out with its own drawing: Gonzales's before the fight, Béxar's before the
  // bell. The server sends the one town whose scenes this page may see (`townScenes.siteId`).
  const drawTownScenes = (world, camera) => {
    const cast = [];
    standing.push(...townSceneDrawables(ctx, world.townScenes, { toScreen: p => camera.toScreen(p), figure: camera.figure, scale: camera.scale, now: frameNow, clock: animationTime, walker: townWalker, reducedMotion: reducedMotion.matches, frozen: world.status !== 'running', drawn: townHeads, evidence: cast }));
    window.__townCast = cast;
    for (const scene of world.townScenes?.scenes || []) townSceneSpots.set(scene.id, camera.toScreen(scene));
    window.__townSceneSpots = Object.fromEntries(townSceneSpots);
  };
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
    // A place of the country outside the box (docs/MAP_ACCURACY.md §11): Matamoros, Laredo and the presidio.
    // These and San Patricio and Gaines's ferry use type-specific map vignettes, not a settler's cabin.
    const distant = site.kind === 'distant';
    const placeArt = placeSprite(site), placeHeight = placeArt ? Math.max(24, Math.min(90, camera.figure * 5)) : 0;
    if (placeArt) standing.push({ y: q.y, draw: () => drawSprite(ctx, placeArt, q.x, q.y, placeHeight) });
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
        // Gonzales before the fight: the town's people at what the days had them doing (sim/town-scenes.mjs), sent only to a
        // page with somebody standing here, and to the Host.
        if((world.townScenes?.siteId||'gonzales')==='gonzales')drawTownScenes(world,camera);
      }else if(TOWN_LAYOUTS[site.id]&&camera.scale>=200){
        // A town of the colonies from its research sketch (sim/town-layouts.mjs, docs/TOWNS.md §5b), its keepers' buildings named.
        const layout=TOWN_LAYOUTS[site.id],project=p=>camera.toScreen({x:site.x+p.x,y:site.y+p.y});
        if(ground)drawTownGround(ground,layout,project,camera.scale);
        standing.push(...townDrawables(ctx,layout,project,camera.scale,Object.fromEntries((world.map?.shops?.[site.id]||[]).filter(shop=>shop.building).map(shop=>[shop.building,{ label: shop.label, sprite: shop.sprite }]))));
        window.__townsDrawn={...(window.__townsDrawn||{}),[site.id]:layout.buildings.length};
      }else if(site.id==='bexar'&&camera.scale>=200){
        // Scenic local feet around the existing, server-projected town. No new entities or travel shortcuts. Laid by the
        // reconstruction's own frame (public/bexar-layout.js `BEXAR_FRAME`); the map's river through the town is the
        // reconstruction's 1836 river (scripts/build-colonies-map.mjs), so it is not drawn twice and its bank trees stand on it.
        const project=p=>{const o=bexarToSite(p);return camera.toScreen({x:site.x+o.x,y:site.y+o.y});};
        if(ground)drawBexarGround(ground,project,camera.scale/5280,{river:false});
        standing.push(...bexarDrawables(ctx,project,camera.scale/5280,{alamoProject:p=>{const o=alamoOnMap(p);return camera.toScreen({x:site.x+o.x,y:site.y+o.y});}}));
        // Béxar in the days before February 23 (sim/town-scenes.mjs `BEXAR_BEATS`): the town's signs, sent only to a page with
        // somebody there, and to the Host.
        if(world.townScenes?.siteId==='bexar')drawTownScenes(world,camera);
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
      // The family's tent until its house has a roof (sim/shelter.mjs, owner 2026-10-02), where the server put it beside the camp:
      // the family's own, and every family's on the Host's map. stand-in: docs/ART_REQUESTS.md, request 2026-10-02 - the wagon sheet
      // stretched over a ridge pole (`homestead-tent`); until it is drawn, the library's canvas tent.
      const tentAt = settlement ? null : ownLand ? world.land?.tent : theirs?.tent;
      if (tentAt) {
        // The canvas tent's anchor is its back corner peg; drawn a third of its height to the east, its open door stands on the
        // place itself, so the family sheltering there is drawn sitting in the doorway (and a little before it) rather than beside it.
        const spot = camera.toScreen(tentAt), tall = Math.max(6, camera.figure * 1.7);
        standing.push({ y: spot.y - 1, draw: () => { if (!drawSprite(ctx, 'homestead-tent', spot.x, spot.y, tall)) drawSprite(ctx, 'tent', spot.x + tall * 0.36, spot.y - tall * 0.04, tall); } });
        (window.__tentsDrawn ??= {})[site.id] = { x: Math.round(spot.x), y: Math.round(spot.y), size: Math.round(tall) };
      } else if (window.__tentsDrawn?.[site.id]) delete window.__tentsDrawn[site.id];
      // A new town's shops, each keeper's own building at its place (sim/shops.mjs, docs/TOWNS.md). Drawn for anybody, as
      // a town's buildings are; who is standing in them is still only seen by somebody who is there.
      // Each trade now has its own art (docs/ART_REQUESTS.md, request 2026-09-16).
      if (settlement && site.id !== 'gonzales' && camera.scale >= 200 && world.map?.shops?.[site.id]) {
        for (const shop of world.map.shops[site.id]) {
          // A keeper in one of the town's own drawn buildings is drawn with the town (public/town-art.js).
          if (shop.building) continue;
          const p = camera.toScreen({ x: site.x + shop.x, y: site.y + shop.y }), height = 0.024 * camera.scale;
          standing.push({ y: p.y, draw: () => {
            drawSprite(ctx, shop.sprite, p.x, p.y, height);
            if (camera.scale > 1000) { ctx.save(); ctx.font = '12px Georgia'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#f2e6c9'; ctx.strokeText(shop.label, p.x, p.y + 16); ctx.fillStyle = '#4c422e'; ctx.fillText(shop.label, p.x, p.y + 16); const w = ctx.measureText(shop.label).width + 6; shopNames.push({ x: p.x - w / 2, y: p.y + 4, w, h: 16, name: shop.label }); ctx.restore(); }
          } });
        }
        window.__shopsDrawn = { ...(window.__shopsDrawn || {}), [site.id]: world.map.shops[site.id].length };
      }
      // The family's wood pile beside the house (sim/felling.mjs), one sprite for its size: about ten, twenty, thirty or forty
      // logs (`wood-pile-1`..`-4`), a pile for every ten or part of ten, up to four.
      // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the wood pile is Claude-drawn (request
      // 2026-09-28 — people at work, item 16); Astra's `wood-pile-*` of the same names replace it. Until its sheet has arrived
      // the pile is the older stand-in, `log-fallen` laid side by side - and while her `log-fallen` is in the library the Claude
      // pile is held back and her logs are drawn (owner, 2026-09-29, public/art-subjects.js: her art wins by subject).
      const piled = theirs ? theirs.logs || 0 : ownLand && world.land?.logs ? world.land.logs.wall + world.land.logs.sill + world.land.logs.poor : 0;
      const pile = Math.min(4, Math.ceil(piled / 10));
      if (pile && spriteReady(`wood-pile-${pile}`)) {
        // The pile's anchor is the front of its base: set where the old row of logs lay, its middle.
        const x = q.x - yard * .95 - camera.figure * SIZE.logPile * .7, y = q.y + yard * .36;
        standing.push({ y, draw: () => {
          const width = drawSprite(ctx, `wood-pile-${pile}`, x, y, camera.figure * SIZE.logPile);
          // Where it was drawn, for the proofs (npm run test:work), read by nothing in the application.
          if (ownLand) window.__woodPileAt = { x, y, width, height: camera.figure * SIZE.logPile };
        } });
      } else for (let i = 0; i < pile; i++) {
        const x = q.x - yard * (.9 + i * .06), y = q.y + yard * (.28 + i * .07);
        standing.push({ y, draw: () => {
          const width = drawSprite(ctx, 'log-fallen', x, y, camera.figure * SIZE.logPile);
          // Where the row was drawn, for the proofs (npm run test:work): the whole row, from its first log.
          if (ownLand && i === 0) window.__woodPileAt = { x, y, width: width * 1.6, height: camera.figure * SIZE.logPile };
        } });
      }
      if (ownLand) { window.__logPileDrawn = pile; window.__woodPileSprite = pile && spriteReady(`wood-pile-${pile}`) ? `wood-pile-${pile}` : null; }
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
    const worthNaming = settlement || distant || placeArt || ownLand || (camera.scale >= HOMESTEAD_LEGIBLE && (site.id === 'ford' || (crossing ? camera.scale >= (site.claimId?.startsWith('FIC') ? FORD_LEGIBLE : LANDING_LEGIBLE) : camera.named && site.kind !== 'camp' && (!NAMED_CLOSE.includes(site.kind) || camera.scale >= LANDING_LEGIBLE))));
    // A place name goes above its buildings. Below is where the family stands, and a
    // homestead's own name landing on top of four people and an ox is unreadable.
    if (worthNaming) {
      const roof = placeArt ? placeHeight * .92 : distant ? 0 : site.id === 'ford' || crossing ? (site.kind === 'ferry' ? camera.figure * 1.6 + 6 : -10) : camera.figure * (settlement ? SIZE.settlementCabin * 1.5 : SIZE.cabin) + 6;
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
  // Nor anybody of the family who died of a sickness, whom the server sends with no place (sim/disease.mjs, owner 2026-09-27).
  const entities = entitiesOf(world).filter(entity => entity.location);
  // Everyone else standing where your family is standing. Drawn plainly, never with a
  // request mark and never with a selection ring that implies you can order them.
  const observed = observedOf(world).filter(entity => entity.location);
  // A passing rider the server has carried out of this family's sight or home before the page has finished drawing him ride by
  // and fade (`passSightOf`): drawn on from where he was, until he has. Never on the Host's page, which sees every rider as he is.
  for (const [id, ghost] of passGhosts) {
    const state = travelSeen.get(id)?.pass?.state;
    if (world.role === 'host' || !['waiting', 'riding', 'fading'].includes(state)) { passGhosts.delete(id); continue; }
    if (!observed.some(one => one.id === id)) observed.push({ ...ghost, travel: null, facing: null, speaking: false, ghost: true });
  }
  drawnAt.clear();
  seatedDrawn.clear();
  // The family's people standing or walking on their own land this frame, for the trees drawn in front of them (`treesInFront`).
  const onLand = [];
  // The family's fenced yard on the screen, which nobody the server has inside it is drawn out of (`drawEntity`).
  const yardBox = !host && world.land?.yard?.fence === 'sound' ? world.land.yard : null;
  const yardRect = yardBox ? (() => { const a = camera.toScreen({ x: yardBox.minX, y: yardBox.minY }), b = camera.toScreen({ x: yardBox.maxX, y: yardBox.maxY }); return { box: yardBox, left: a.x, top: a.y, right: b.x, bottom: b.y }; })() : null;
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
  const travelMarks = { frozen, running, tickMs, scale: camera.scale, figure: camera.figure, now: frameNow };
  // A baby carried on an errand (sim/babies.mjs `takeBabyAlong`) is drawn on its carrier's hip, wherever the carrier is drawn:
  // so the carriers first, and where each was put kept for the babies they carry.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-26 - a woman with a baby on her hip; until then the infant figure beside her.
  const carriedAt = new Map();
  window.__cowDrawn = null;
  // A carrier with the baby drawn on the hip in their own frame (`-carry-baby-walk`), and a grown-up holding one to the shoulder
  // (`-hold-baby`): the baby is drawn in their arms, not again beside them (`babiesHeldLast`, set by `drawnClipOf`).
  babiesHeldLast = babiesHeldNow; babiesHeldNow = new Set();
  const carryingBaby = new Set();
  for (const one of entities) if (one.carriedBy && one.band === 'infant') carryingBaby.add(one.carriedBy);
  window.__babiesInArms = {};
  // Who of the family the map is not drawing this frame (`unseenOnRoad`): first those the server sends with no place at all.
  const unseenNext = new Map();
  for (const entity of entitiesOf(world)) if (entity.kind === 'person' && entity.travel && !entity.location) unseenNext.set(entity.id, awayWords(world, entity));
  // A small child carried on the family's road (owner, 2026-10-02, "Adults carry small kids"; sim/company.mjs step 5): drawn at
  // its carrier's hip, as a carried baby is, never walking beside. stand-in: docs/ART_REQUESTS.md, request 2026-10-02 - a grown
  // person carrying a child of two to five on the road; until then the child's own figure at the carrier's hip.
  const roadCarrier = one => (one.travel?.afoot && one.travel.carried && one.band !== 'infant' ? one.travel.carried : null);
  const carriedOn = one => one.carriedBy || roadCarrier(one);
  // Who has gone into the house out of the weather (sim/shelter.mjs, owner 2026-10-02): seen walking to the door, then not drawn -
  // they are inside. Under the tent or the wagon they are drawn sitting there (public/motion.js). Read by the proofs only.
  window.__inside = [];
  for (const entity of [...entities].sort((a, b) => Boolean(carriedOn(a)) - Boolean(carriedOn(b)))) {
    if (entity.kind === 'person' && entity.shelter?.at === 'house' && entity.shelter.phase === 'in' && !entity.travel) { window.__inside.push(entity.id); continue; }
    const holder = entity.carriedBy || (entity.baby?.state === 'held' ? entity.baby.by : null);
    if (holder && babiesHeldLast.has(holder)) { window.__babiesInArms[entity.id] = holder; continue; }
    const carrier = carriedOn(entity) ? carriedAt.get(carriedOn(entity)) : null;
    // Where along the road this traveller is *drawn*, which is not where the server has them while the middle of a long
    // journey is being crossed out of sight (`sightOf`). Worked out before the point, because it is the point.
    const sight = carrier ? carrier.sight : sightOf(entity, drawnHeightOf(entity, camera.figure, seatOf(entity, entities)), travelMarks);
    if (sight && sight.alpha < 1 && !carrier) roads.push({ entity, seen: sight });
    // Faded right out on the road: nothing of them is drawn this frame (`drawEntity` draws a figure only while its alpha is above 0).
    if (sight && !(sight.alpha > 0) && entity.kind === 'person') unseenNext.set(entity.id, awayWords(world, entity));
    const inTown = carrier ? null : townGround(world, entity, camera, frameNow, frozen);
    const ground = carrier ? carrier.ground : sight?.at || inTown?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);
    carriedAt.set(entity.id, { ground, sight });
    // Walked on about their home from where they were drawn walking in (`walkOn`): drawn stepping the way they are going.
    const stepping = !carrier && sight?.stepping;
    if (carrier) { point.x += camera.figure * .22; point.y -= camera.figure * .3; }
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
        kind, flip: spot.x < point.x, alert: Boolean(entity.chore.ask), fled: Boolean(quarry.fled), seed: entity.id,
      }) });
      window.__quarryDrawn = { id: entity.id, kind, x: spot.x, y: spot.y };
    }
    // The thing beside somebody at an ambient activity - the fire, the pot, the bucket, the hens, the woodpile (public/ambient.js).
    const beside = inTown?.amb && (!inTown.stepping || inTown.amb.pace) && propItem(ctx, inTown.amb, camera.toScreen(inTown.base || inTown.at), camera.figure, { time: animationTime, flip: inTown.amb.f === 'w' });
    if (beside) standing.push(beside);
    const placed = inTown ? { ...entity, stepping: inTown.stepping, scenePose: inTown.pose, ...(inTown.amb && { amb: inTown.amb }) } : stepping ? { ...entity, stepping } : carrier ? entity : atTheirWork(entity, world.household?.homeSiteId, frameNow, frozen);
    const held = carryingBaby.has(entity.id) ? { ...placed, carryingBaby: true } : placed;
    // One of the little ones about the yard, turned the way they are seen going (`yardHeadings`): a child at tag runs north, south,
    // east or west (public/motion.js `littleClip`). Presentation evidence for the proofs in `window.__yardHeading`, read by nothing
    // in the application.
    const little = !carrier && !inTown && !stepping && !entity.travel && entity.kind === 'person' && (entity.band === 'child' || entity.band === 'small');
    const yard = little ? yardHeadings.update(entity.id, ground.x, ground.y) : null;
    if (little) (window.__yardHeading ??= {})[entity.id] = yard; else if (window.__yardHeading) delete window.__yardHeading[entity.id];
    const shown = yard ? { ...held, yardHeading: yard } : held;
    // On the family's own land: the trees in front of them are drawn again over them (`treesInFront`, owner 2026-10-02).
    if (!host && !carrier && !inTown && !entity.travel && entity.kind === 'person' && entity.location?.siteId === world.household?.homeSiteId) onLand.push({ id: entity.id, point, figure: camera.figure * figureScale(entity) });
    standing.push({ y: point.y, draw: () => drawEntity(ctx, shown, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark, entities, workmates: entities, yard: yardRect,
      labels, heading: destination ? destination.x - entity.location.x : 0, ground, scale: camera.scale,
      now: frameNow, frozen, running, tickMs, sight, placed: Boolean(inTown),
    }) });
    // The milk cow a child drives along behind the family on the Scrape (sim/flight-work.mjs, owner 2026-09-27), a step behind
    // them on the road and grazing beside them at the camp. stand-in: docs/ART_REQUESTS.md, request 2026-09-27 - the milk cow on the run, and Béxar before the bell:
    // a range longhorn's standing and grazing frames moved over the ground with the child, until a milk cow on a rope is drawn.
    if ((world.flight || world.early)?.cow?.by === entity.id && !carrier) {
      const west = destination ? destination.x < entity.location.x : false;
      // Claude's milk cow on her rope (`milk-cow-walk-*`, `milk-cow-graze`) where it is loaded - "Claude-drawn stand-ins
      // (replace with Astra's)" - walking the way the child goes; the range longhorn otherwise.
      const heading = entity.travel ? travelDirection(entity) : null;
      const milk = entity.travel ? `milk-cow-walk-${heading === 'n' || heading === 's' ? heading : 'e'}` : 'milk-cow-graze';
      let clip = entity.travel ? 'cattle-longhorn-red-idle' : 'cattle-longhorn-red-graze';
      // Sorted just in front of the child, and drawn from where the child was actually drawn this frame (`drawnAt`: beside a
      // wagon a walker is drawn off the road's point), a body's length behind them.
      standing.push({ y: point.y + camera.figure * .12, draw: () => {
        const child = drawnAt.get(entity.id);
        const feet = child ? { x: child.x, y: child.y + child.size * .45 } : point, size = child?.size || camera.figure;
        const cow = { x: feet.x + size * (west ? .9 : -.9), y: feet.y + size * .06 };
        if (clipReady(milk) && animated(ctx, milk, cow.x, cow.y, size * 1.2, `milk-cow:${entity.id}`, { flip: heading === 'n' || heading === 's' ? false : west })) clip = milk;
        else animated(ctx, clip, cow.x, cow.y, size * 1.2, `milk-cow:${entity.id}`, { flip: west });
        window.__cowDrawn = { by: entity.id, x: Math.round(cow.x), y: Math.round(cow.y), clip, child: child ? { x: Math.round(feet.x), y: Math.round(feet.y) } : null };
      } });
    }
  }
  treesInFront(ctx, world, camera, canvas, onLand, standing);
  // The Host's page and a page watching another family are as they were: nobody's row is greyed there.
  noteUnseen(host || world.watching ? new Map() : unseenNext, world);
  const margin = camera.figure * 4, shownObserved = [];
  for (const entity of observed) {
    // Everyone on the map, not only the student's own family (owner, 2026-09-22, by multiple choice: "Everyone on the
    // map"): other families' people, riders, couriers and armies' men alike. Somebody else's land is not this family's, so
    // an observed person is scheduled with no land under them (`sightOf` passes none).
    const sight = sightOf(entity, drawnHeightOf(entity, camera.figure, host ? seatOf(entity, []) : null), { ...travelMarks, observed: !host });
    if (sight && sight.alpha < 1) roads.push({ entity, seen: sight });
    const inTown = townGround(world, entity, camera, frameNow, frozen);
    const ground = sight?.at || inTown?.at || motionProjection.position(entity, frameNow, frozen), point = camera.toScreen(ground);
    if (sight) sight.painted = ground;
    // The Host's whole class: only who is on screen is drawn, and each as they truly are - at their own work, the principal
    // in their own coat, the deer they are hunting beside them - because the teacher is not somebody glimpsing a stranger.
    if (host && (point.x < -margin || point.y < -margin || point.x > canvas.width + margin || point.y > canvas.height + margin)) continue;
    if (host && entity.chore?.quarry) {
      const kind = entity.chore.quarry.kind || 'deer';
      const spot = camera.toScreen(entity.chore.quarry);
      standing.push({ y: spot.y, draw: () => miniQuarry(ctx, spot.x, spot.y, camera.figure * (QUARRY_SIZE[kind] || QUARRY_SIZE.deer), { kind, flip: spot.x < point.x, seed: entity.id }) });
    }
    const beside = inTown?.amb && (!inTown.stepping || inTown.amb.pace) && propItem(ctx, inTown.amb, camera.toScreen(inTown.base || inTown.at), camera.figure, { time: animationTime, flip: inTown.amb.f === 'w' });
    if (beside) standing.push(beside);
    const seen = { ...entity, health: { condition: entity.condition }, ...(inTown && { stepping: inTown.stepping, scenePose: inTown.pose, ...(inTown.amb && { amb: inTown.amb }) }), ...(!inTown && sight?.stepping && { stepping: sight.stepping }) };
    // The Host sees every family at its work as the family does (public/work-art.js); a student's neighbour is seen at no work.
    const shown = host && !inTown && !seen.stepping ? atTheirWork(seen, world.overview?.lands?.[entity.householdId]?.homeSiteId, frameNow, frozen) : seen;
    standing.push({ y: point.y, draw: () => drawEntity(ctx, shown, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark: null, labels, observed: !host, ground, scale: camera.scale, workmates: host ? observed : null,
      now: frameNow, frozen, running, tickMs, sight, placed: Boolean(inTown),
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
  if (groundMissing) mapBase.missing = groundMissing();
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
  // The family's own route (owner, 2026-09-27: "a thin, subtle line as a path for directions that only the player can see"):
  // from the train through every stop to where it is making for, the road legs along the road and the country legs as the
  // family goes across, thin, dashed and pale, under every figure. Only a student's page is sent one (sim/flight-route.mjs
  // `routeProjection`), and only for its own family; the Host's is sent none, so its map is not thirty lines at once.
  window.__routeDrawn = drawRouteLine(ctx, host ? null : world.flight, camera, canvas);
  // The crowd of families from the west camped round a fire at a refuge (public/ambient.js, sim/ambient.mjs `crowdAt`).
  const crowd = [];
  if (world.ambient?.crowds && camera.figure > 8) standing.push(...crowdDrawables(ctx, world.ambient.crowds, { toScreen: p => camera.toScreen(p), figure: camera.figure, time: animationTime, reducedMotion: reducedMotion.matches, heads: ambientHeads, evidence: crowd }));
  window.__ambientCrowd = crowd;
  // The lone parent's path while it is offered (sim/courtship.mjs): a warm glow on the ground of the family's own land, under
  // everything standing on it, and a marker over it drawn after them (`drawPathMarker`), so the ability is seen on the map too.
  const pathHome = !host && world.courtship?.offer ? pathGlowAt(world, camera, canvas) : null;
  if (pathHome) drawPathGlow(ctx, pathHome, camera);
  standing.sort((a, b) => a.y - b.y);
  for (const item of standing) item.draw();
  window.__pathMarker = pathHome ? drawPathMarker(ctx, pathHome, camera) : null;
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
    // The clip each of the camp's men was drawn in: presentation evidence for the proofs (npm run test:chatter).
    const menDrawn = [];
    const how = drawArmy(ctx, army, at, {
      scale: camera.scale, figure: camera.figure, time: animationTime,
      draw: (clip, x, y, size, key, options) => { if (/^[^:]+:\d+$/.test(String(key))) menDrawn.push(clip); return animated(ctx, clip, x, y, size, key, options); }, mini: miniPerson,
      smoke: campMix && inGale(campMix) ? (x, y, size) => drawSprite(ctx, GALE_SMOKE, x, y, size) : null,
      // What each man is doing and the words over their heads (public/ambient.js, sim/ambient.mjs `campAmbient`).
      ...(world.ambient?.camps?.[army.id] && {
        man: index => campMan(world.ambient.camps[army.id], index, { time: animationTime, reducedMotion: reducedMotion.matches, key: army.id }),
        prop: (index, doing, p, size) => propItem(ctx, { prop: doing.prop }, p, size, { time: animationTime, flip: doing.flip })?.draw(),
        onMan: (index, x, y, size) => ambientHeads.set(`camp:${army.id}:${index}`, { x, y: y - size, size }),
      }),
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
    // A column's foragers ranging out from its line (sim/advance.mjs `foragersOf`): a few horsemen each, as far as this page
    // may see them. stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Mexican advance", item 1 - the dragoons the
    // battles already draw, riding, until a foraging party (horsemen driving cattle, a cart) exists.
    const foragers = (army.foragers || []).map((party, index) => {
      const p = camera.toScreen(party), size = Math.max(9, Math.min(28, camera.figure * .8));
      // Claude's foraging party (`forager-ride`, `forager-drive`: request 2026-09-26 "the Mexican advance", item 1), one sprite
      // for the party, where it is loaded - every other party driving off cattle.
      const drove = index % 2 ? 'forager-drive' : 'forager-ride';
      if (clipReady(drove) && animated(ctx, drove, p.x, p.y, size, `${army.id}:forager:${index}`, { flip: party.right === false })) return { x: Math.round(p.x), y: Math.round(p.y) };
      for (let rider = 0; rider < 3; rider++) {
        const x = p.x + (rider - 1) * size * .7, y = p.y + (rider % 2) * size * .25;
        if (!animated(ctx, 'dragoon-march', x, y, size, `${army.id}:forager:${index}:${rider}`, { flip: party.right === false })) miniPerson(ctx, x, y, size, { side: 'mexican', flip: party.right === false });
      }
      return { x: Math.round(p.x), y: Math.round(p.y) };
    });
    return { id: army.id, side: army.side, ours: army.ours, strength: army.strength, how, boat, x: Math.round(at.x), y: Math.round(at.y), camp: Boolean(army.camp), foragers,
      ...(how === 'camp' && { men: menDrawn }) };
  });
  // Smoke over a burning town or farm, where the server says this page could see it (sim/advance.mjs `firesSeen`): a column
  // of smoke seen from afar, never what is burning (VISION.md §16). stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the
  // Mexican advance", item 2 - Claude's `farm-smoke-rise` and `town-smoke-rise` (a dark column leaning over a low glow,
  // *Claude-drawn stand-ins*, area F) first; without that sheet, the library's rising chimney smoke drawn large.
  window.__firesDrawn = (world.fires || []).map(fire => {
    const p = camera.toScreen(fire), size = Math.max(26, Math.min(160, camera.figure * (fire.kind === 'town' ? 4.4 : 3)));
    const plume = fire.kind === 'town' ? 'town-smoke-rise' : 'farm-smoke-rise';
    const drawnAs = animated(ctx, plume, p.x, p.y, size, `fire:${fire.id}`) ? plume : animated(ctx, 'smoke-rise', p.x, p.y, size, `fire:${fire.id}`) ? 'smoke-rise' : null;
    if (!drawnAs) {
      const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y - size * 1.6);
      g.addColorStop(0, 'rgba(90,86,80,.55)'); g.addColorStop(1, 'rgba(160,156,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y - size * .8, size * .28, size * .8, 0, 0, Math.PI * 2); ctx.fill();
    }
    return { id: fire.id, kind: fire.kind, x: Math.round(p.x), y: Math.round(p.y), art: drawnAs };
  });
  // The famous people on the map between their battles, with their names, where the server says this page could see them
  // (sim/famous.mjs, public/famous-view.js; docs/BATTLES.md §2c).
  // The page's own drawing functions, canvas first, exactly as `drawFamous` calls them and as the battle view is given them:
  // until 2026-09-27 these were wrappers taking the clip first, and every famous person on the map fell through to a mini figure
  // (tests/famous-map-art.test.mjs).
  window.__famousDrawn = drawFamous(ctx, world.famous, camera, {
    animated: (...args) => animated(...args), drawSprite: (...args) => drawSprite(...args), miniPerson: (...args) => miniPerson(...args),
    time: animationTime, bounds: { width: canvas.width, height: canvas.height },
  });
  // Every speech bubble of the frame, laid out together (public/speech.js `speechLayout`), after every figure, name and mark it
  // must keep off. Owner, 2026-09-29: *"When playing, text boxes for npc and player characters overlap frequently."* The
  // family's talk, the town's scenes and the neighbours' were drawn each on its own, over its own speaker, and piled on each
  // other and on the names on the map; now each is placed in turn - the family's own first, then the town's, then the
  // neighbours' - clear of the bubbles before it, their tails, the names (places, shops, buildings, the famous people) and the
  // marks asking the student something, lifted or slid as little as will clear them, its tail still to its speaker. What is
  // said is the server's; only where it stands is the page's.
  const speechBounds = { width: canvas.width, height: canvas.height, room: speechRoom(canvas) };
  const speech = speechLayout({ ...speechBounds, now: frameNow, avoid: [
    ...(window.__labelsDrawn?.drawn || []).map(one => one.box), ...shopNames, ...townLabelsDrawn,
    ...(window.__famousDrawn || []).map(one => one.label),
    ...pending.map(mark => ({ x: mark.x - mark.size * .5, y: mark.y - mark.size * 1.1, w: mark.size, h: mark.size * 1.2 })),
    // The lone parent's path, offered over the family's land (`drawPathMarker`).
    ...(window.__pathMarker ? [{ x: window.__pathMarker.x - window.__pathMarker.r, y: window.__pathMarker.y - window.__pathMarker.r, w: window.__pathMarker.r * 2, h: window.__pathMarker.r * 2 }] : []),
  ] });
  // What the family's own children and babies are saying, over them (sim/childhood.mjs `talkLines`, sim/babies.mjs `babyLines`):
  // a child with nothing to do and the parent they have stopped, a baby crying and the one who holds it humming. The same
  // bubbles as the town's (public/speech.js), dashed, because every word of it is reconstructed.
  // Both halves of an exchange at once, over the two who say them, for the tick it is said: the child's line and the reply are
  // over different heads, and a tick of the class is the nine seconds they are read in (not the town's staggered scene). The
  // two stand a step apart, so the second is lifted above the first or slid beside it by the layout.
  if (world.familyTalk?.lines?.length && camera.figure > 14) {
    const said = [];
    for (const line of world.familyTalk.lines) {
      const head = drawnAt.get(line.speakerId);
      if (!head) continue;
      // The bubble's box goes with it, for the overlap proof: whether a panel stands over words a student has to read.
      const box = drawSpeech(ctx, line, head.x, head.y - head.size * .55, { bounds: speechBounds, layout: speech });
      if (box) said.push({ id: line.id, speakerId: line.speakerId, kind: line.kind, text: line.text, ...(line.manner && { manner: line.manner }), box, tail: box.tail });
    }
    window.__familySaid = said;
  } else window.__familySaid = [];
  // What is being said in Gonzales, over whoever is saying it (public/speech.js), above every figure and building.
  if (world.townScenes && camera.scale >= 200) {
    const said = [];
    // Over the head as walked into the town, or else as the figure was drawn at all (`drawnAt` keeps its middle).
    const headOf = id => townHeads.get(id) || (drawnAt.has(id) ? { x: drawnAt.get(id).x, y: drawnAt.get(id).y - drawnAt.get(id).size * .55 } : null);
    drawTownSpeech(ctx, world.townScenes, headOf, { now: frameNow, tickMs: window.__snapshot?.tickMs ?? 9500, bounds: speechBounds, layout: speech, evidence: said });
    window.__townSaid = said;
  } else window.__townSaid = [];
  // Neighbours talking (public/ambient.js, sim/ambient.mjs `EXCHANGES`): after the camps, whose men's heads are laid out with
  // them, and never over the family's own bubbles, the town's or a mark asking the student something. Quiet in a fight or a chase.
  // Called whether or not this tick brought words, so an exchange begun on the last one is finished.
  if (camera.figure > 14 && !world.battle?.sides && !world.flight?.chase) {
    const said = [];
    // Everybody talks; the bubble slides into the room clear of the panels at its height (`speechRoom`), its tail still to the
    // speaker. Suppressing a line whose bubble touched a panel - or whose speaker stood under one, the card beside a family
    // stands over the rest of it - silenced the farm entirely (test:chatter, 2026-09-28). A line with no room near its
    // speaker waits for some (public/ambient.js).
    const headOf = id => ambientHeads.get(id) || (drawnAt.has(id) ? { x: drawnAt.get(id).x, y: drawnAt.get(id).y - drawnAt.get(id).size * .55 } : null);
    drawAmbientSpeech(ctx, world.ambient?.lines || [], headOf, { now: frameNow, bounds: speechBounds, layout: speech, evidence: said });
    window.__ambientSaid = said;
  } else window.__ambientSaid = [];
  // The fight, if this page may watch one (public/battle-view.js; sim/battle-stage.mjs `projectBattle`): both sides as they
  // fought, the fire, the smoke on the day's wind, the words, the cannon. It replaced `drawFormations` on 2026-09-25.
  const fight = world.battle?.sides ? world.battle : null;
  const fightWind = fight && weather ? weatherMix(weather, fight.sides[0].x, world.minute).wind : null;
  const battleSeen = window.__battleView = battleView.draw(ctx, fight, {
    camera, time: animationTime, now: frameNow, tickMs: window.__snapshot?.tickMs ?? 1000, wind: fightWind,
    reducedMotion: reducedMotion.matches, paused: world.status !== 'running', bounds: { width: canvas.width, height: canvas.height }, named: camera.named,
    // The class's own men in it as drawn this frame: the smoke is thinned round them so they are seen (public/battle-view.js `clearings`).
    clear: (fight?.members || []).map(id => drawnAt.get(id)).filter(Boolean).map(one => ({ x: one.x, y: one.y })),
  });
  if (fight) drawBattleCaption(ctx, fight, canvas);
  // A gun fired on the screen this frame: the film's camera jolts (public/battle-cinema.js `thump`).
  if (battleSeen?.thumps?.length) { const film = cinemaFor(world), last = Math.max(...battleSeen.thumps); if (last > (drawWorldNow.lastThump || 0)) { drawWorldNow.lastThump = last; film.thump(last); } }
  // Mexican troops after a family (public/chase-view.js): the student's own family's, and every one on the Host's map.
  const chases = host ? world.chases || [] : world.flight?.chase ? [world.flight.chase] : [];
  const chaseSeen = window.__chaseView = chaseView.draw(ctx, chases, { camera, now: frameNow, time: animationTime, tickMs: window.__snapshot?.tickMs ?? 1000, bounds: { width: canvas.width, height: canvas.height }, reducedMotion: reducedMotion.matches, paused: world.status !== 'running' });
  window.__viewFormations = fight ? fight.formations.map(formation => formation.id) : [];
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
  soundscape?.frame({ camera, canvas, world, battle: battleSeen, chase: chaseSeen, drawnAt });
  // Presentation evidence, same contract as __viewEntities: who was drawn because they
  // were seen, kept as a separate list so a proof can tell the two apart.
  // On the Host's map, the ones inside the view.
  window.__viewObserved = shownObserved;
  // The stake goes in over everything else on the ground, so the place being looked at is never hidden under a road or a cow.
  drawSitePick(ctx, world, camera);
  drawKeyTarget(ctx, camera);
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
  drawCinema(ctx, world, camera, canvas, frameNow);
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
  // The film's own button on the Host's map while a fight is being fought: take the camera, or give it back to the film.
  const filmButton = $('#map-nav [data-view=cinema]');
  if (filmButton) {
    const film = cinemaFor(world), offered = host && (film.driving || film.released) && film.state !== 'closing';
    if (filmButton.hidden !== !offered) filmButton.hidden = !offered;
    setText(filmButton, film.driving ? 'Take the camera (Esc)' : 'Watch the fight');
    setData(filmButton, 'active', String(film.driving));
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
/**
 * The field crop by crop (owner, 2026-09-30: each plot its own crop; "visual cues over explanation"): a chip for each crop growing,
 * each crop ripe - lit, with a tick - and the bare plots, each a picture from Astra's crop art (`corn-young`, `cotton-mature`, as the
 * map draws the rows) and a count. The words are its label and each chip's title, for a screen reader and a hover. The server's
 * `land.crops` (sim/crops.mjs `cropSummary`); built again only when it changes, and each picture drawn again until its art is in.
 */
/** The first of the family's plots a field-line chip counts (bare, or this crop growing or ripe), opened in the plot chooser. */
function openChipPlot(crop, stage, fromKeyboard) {
  const world = window.__snapshot?.world;
  const plot = world && (world.land?.plots || []).find(one => plotStage(one) === stage && (stage === 'bare' || (one.crop || 'corn') === crop));
  if (!plot) return;
  centreMapOn(plot);
  openPlotChooser(world, plot, { focus: fromKeyboard });
}
function renderFieldSummary(world) {
  const root = $('#field-summary');
  if (!root) return;
  const crops = world.household && world.land?.crops;
  const chips = !crops ? [] : [
    ...['corn', 'cotton'].flatMap(crop => [
      crops[crop]?.growing > 0 && { crop, stage: 'growing', n: crops[crop].growing, words: `${crop === 'corn' ? 'Corn' : 'Cotton'} growing on ${crops[crop].growing} ${crops[crop].growing === 1 ? 'plot' : 'plots'}${crops.next?.crop === crop ? `, the first ready ${crops.next.words}` : ''}` },
      crops[crop]?.ripe > 0 && { crop, stage: 'ripe', n: crops[crop].ripe, words: `${crop === 'corn' ? 'Corn' : 'Cotton'} ripe on ${crops[crop].ripe} ${crops[crop].ripe === 1 ? 'plot' : 'plots'}: bring it in` },
    ]),
    crops.bare > 0 && { crop: 'bare', stage: 'bare', n: crops.bare, words: `${crops.bare} bare ${crops.bare === 1 ? 'plot' : 'plots'} to plant` },
  ].filter(Boolean);
  root.hidden = !chips.length;
  const label = chips.length ? `Field: ${chips.map(chip => chip.words).join('; ')}.` : '';
  const key = JSON.stringify(chips.map(({ crop, stage, n }) => [crop, stage, n]));
  if (root.dataset.key !== key) {
    root.dataset.key = key;
    root.replaceChildren(...chips.map(chip => {
      // A button since 2026-09-30 (owner: "let me click on the fields"): pressed, the plot chooser opens on the first plot of it -
      // the way to a plot without the map, for a keyboard.
      const span = element('button', '', 'crop-chip');
      span.type = 'button';
      span.dataset.crop = chip.crop; span.dataset.stage = chip.stage;
      span.addEventListener('click', event => openChipPlot(chip.crop, chip.stage, event.detail === 0));
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 44; canvas.setAttribute('aria-hidden', 'true');
      span.append(canvas, element('b', String(chip.n)));
      return span;
    }));
  }
  if (root.getAttribute('aria-label') !== label) root.setAttribute('aria-label', label);
  for (const [index, span] of [...root.children].entries()) {
    const chip = chips[index];
    if (span.title !== chip.words) span.title = chip.words;
    const canvas = span.querySelector('canvas');
    if (canvas.dataset.drawn === 'true') continue;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 44, 44);
    if (chip.crop === 'bare') {
      // Turned earth, as the map draws a bare plot: brown with the furrows across it.
      ctx.fillStyle = '#8a6a44'; ctx.fillRect(6, 10, 32, 26);
      ctx.strokeStyle = '#5e4630'; ctx.lineWidth = 2;
      for (let y = 15; y < 36; y += 6) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(36, y); ctx.stroke(); }
      canvas.dataset.drawn = 'true';
      continue;
    }
    // The crop by its ripe plant - the ear of corn, the open boll - which tells the two apart at this size; growing is the same plant
    // faded, ripe it whole on a lit chip with a tick (the stylesheet).
    const drawn = drawSprite(ctx, `${chip.crop}-mature`, 22, 43, 42, { alpha: chip.stage === 'ripe' ? 1 : 0.55 });
    if (drawn) canvas.dataset.drawn = 'true';
    else {
      // Until the crop art is in: a stalk and, ripe, its colour - corn gold, cotton white.
      ctx.strokeStyle = '#4f7a36'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(22, 40); ctx.lineTo(22, 12); ctx.stroke();
      ctx.fillStyle = chip.stage === 'ripe' ? (chip.crop === 'cotton' ? '#f4efe0' : '#d9b243') : '#7fa252';
      ctx.beginPath(); ctx.arc(22, 12, chip.stage === 'ripe' ? 9 : 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}
// The food gauge's last level, for its flash when a worse one is reached (owner, 2026-09-30; docs/HUNGER.md §5), and the timer
// that ends the flash. Up here, above the page's start-up, for the TDZ rule (tests/page-startup.test.mjs).
let larderWas = null, larderFlashTimer = 0;
/** The gauge's parts inside `#food`, made once: a sack, the number, and the bar of days. */
function larderParts(box) {
  if (!box.querySelector('.food-count')) {
    const icon = element('span', '', 'food-icon'), count = element('span', '', 'food-count'), gauge = element('span', '', 'food-gauge');
    icon.setAttribute('aria-hidden', 'true'); gauge.setAttribute('aria-hidden', 'true');
    gauge.append(element('span', '', 'food-gauge-fill'));
    box.replaceChildren(icon, count, gauge);
    box.setAttribute('role', 'meter'); box.setAttribute('aria-valuemin', '0'); box.setAttribute('aria-valuemax', '14');
  }
  return { count: box.querySelector('.food-count'), fill: box.querySelector('.food-gauge-fill') };
}
/**
 * The family's food (sim/hunger.mjs `larderShown`): "Food 15.5" as ever, a bar of the days it lasts at the family's eating, and the
 * box coloured by where that stands - calm, amber, red, then glowing and pulsing as the family is hungry, weak and starving. It
 * flashes once when a worse level is reached. Its words are only the hover and the screen reader's (`larderLabel`).
 */
function paintLarder(household) {
  const box = $('#food');
  if (!household) { if (!box.hidden) box.hidden = true; larderWas = null; return; }
  const { count, fill } = larderParts(box);
  if (box.hidden) box.hidden = false;
  const food = Number(household.resources?.food || 0);
  setText(count, `Food ${food.toFixed(1)}`);
  const larder = household.larder || null;
  const level = larderLevel(larder, food) || '';
  setData(box, 'level', level);
  const share = String(Math.round(larderFill(larder) * 100) / 100);
  if (fill.style.getPropertyValue('--fill') !== share) fill.style.setProperty('--fill', share);
  const label = larderLabel(larder, food, level);
  if (box.getAttribute('aria-valuetext') !== label) { box.setAttribute('aria-valuetext', label); box.setAttribute('aria-label', 'Food'); box.title = label; }
  const now = String(Math.min(14, Math.max(0, Number.isFinite(larder?.days) ? Math.round(larder.days) : 14)));
  if (box.getAttribute('aria-valuenow') !== now) box.setAttribute('aria-valuenow', now);
  if (larderWorse(larderWas, level)) {
    setData(box, 'flash', 'true');
    clearTimeout(larderFlashTimer);
    larderFlashTimer = setTimeout(() => setData(box, 'flash', 'false'), 2600);
  }
  larderWas = level || null;
}
/** The line of seed, powder, coin and the field: each part its own span, highlighted by `level` (out, low, good, ready, idle). */
function paintSupplies(parts) {
  const box = $('#supplies');
  const shape = parts.map(part => part.key).join('|');
  if (box.dataset.parts !== shape) {
    box.replaceChildren(...parts.flatMap((part, at) => {
      const span = element('span', '', 'supply'); span.dataset.supply = part.key;
      return at ? [document.createTextNode(' · '), span] : [span];
    }));
    box.dataset.parts = shape;
  }
  const spans = box.querySelectorAll('.supply');
  parts.forEach((part, at) => { setText(spans[at], part.text); setData(spans[at], 'level', part.level || ''); });
  if (box.hidden !== !parts.length) box.hidden = !parts.length;
}
function renderHousehold(world) {
  const household = world.household;
  if (!household) {
    // The Host's look at somebody stays open and follows them tick by tick (read only, `renderSelection`).
    if (hostView(world)) renderSelection(world); else $('#selection').hidden = true;
    $('#family-panel').hidden = true; hidePanelTip(); paintLarder(null); paintSupplies([]); renderFieldSummary(world); return;
  }
  $('#family-title').textContent = headingCase(familyCache?.name || 'Your family');
  renderFamilyBook();
  renderSurname();
  // The food as a gauge (owner, 2026-09-30; docs/HUNGER.md §5): the number as ever, a bar of the days it lasts, and a colour from
  // calm to red that glows, then pulses, as the family goes hungry, weak and starving. No sentence.
  paintLarder(household);
  // Seed, the field and the hoe are the three things that run out. They sit on the map
  // as one quiet line, because a student needs to notice them without being told to.
  // Each is highlighted by where it stands (owner, 2026-09-30): run out in ember, low in amber, the crop ready in gold.
  const field = household.field, hoe = world.toolCondition?.hoe;
  const seed = Number(household.resources?.seed || 0);
  const supplies = [{ key: 'seed', text: `Seed ${seed.toFixed(0)}`, level: seed <= 0 ? (field?.state === 'bare' || !field ? 'out' : 'low') : seed < 2 ? 'low' : '' }];
  // Powder and cotton are shown only when a family has some. Powder because a house that
  // has run out needs to know before it sends somebody hunting; cotton because a corn
  // family never has any and a line reading "Cotton 0" all afternoon is furniture.
  const powder = Number(household.resources?.powder || 0);
  supplies.push({ key: 'powder', text: `Powder ${powder.toFixed(0)}`, level: powder <= 0 ? 'out' : powder < 2 ? 'low' : '' });
  const cotton = Number(household.resources?.cotton || 0);
  if (cotton > 0) supplies.push({ key: 'cotton', text: `Cotton ${cotton.toFixed(0)}`, level: 'good' });
  // Hides from the hunt, once there are any (owner, 2026-09-30): a carreta is lashed with one, and the tanner buys them.
  const hides = Number(household.resources?.hides || 0);
  if (hides > 0) supplies.push({ key: 'hides', text: `Hides ${hides.toFixed(0)}`, level: 'good' });
  // Coin is always shown, including none: it is scarce, and it is half of how a family ends.
  const coin = Number(household.resources?.money || 0);
  supplies.push({ key: 'coin', text: coin === 1 ? '1 real' : `${coin} reales`, level: coin <= 0 ? 'low' : '' });
  // The field is its own element since 2026-09-30, crop by crop in pictures (`renderFieldSummary`); a server of before sends no
  // summary, and its one field state is said here as it always was.
  if (field && !world.land?.crops) supplies.push({ key: 'field', text: field.state === 'ripe' ? `${field.crop} ready` : field.state === 'planted' ? `${field.crop} growing` : 'field bare', level: field.state === 'ripe' ? 'ready' : field.state === 'planted' ? 'good' : 'idle' });
  renderFieldSummary(world);
  if (hoe?.state === 'worn') supplies.push({ key: 'hoe', text: 'hoe worn out', level: 'out' });
  if (household.load && household.tools?.hoe === undefined) supplies.push({ key: 'hoe', text: 'no hoe', level: 'out' });
  // Water, where it is carried from far off (sim/homesite.mjs): said while it slows the family, and gone once there is a well.
  const site = world.land?.site;
  if (site?.needsWell && !site.well) supplies.push({ key: 'water', text: site.water ? `water carried ${site.waterMiles} mi` : 'no running water near', level: 'low' });
  if (site?.well) supplies.push({ key: 'water', text: 'well', level: '' });
  // Logs: at the house, and still lying where they were felled (sim/felling.mjs). Said once there are any.
  const logs = world.land?.logs;
  if (logs) {
    const piled = logs.wall + logs.sill + logs.poor;
    supplies.push({ key: 'logs', text: `logs ${piled} at the house${logs.lying ? `, ${logs.lying} lying out` : ''}`, level: '' });
  }
  paintSupplies(supplies);
  $('#supplies').dataset.urgent = String((field?.state === 'ripe' && !world.land?.crops) || hoe?.state === 'worn');
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
      // Hours at the family's pace, from the server (sim/houses.mjs; half a spell's old hour since 2026-09-29).
      ? ` They are building a ${houseName(land.house.layout)}: ${land.house.stage}, ${land.house.hours?.[0] ?? land.house.work} of ${land.house.hours?.[1] ?? land.house.total} hours of work done.`
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
/** The places the family may make for (sim/flight-route.mjs `flightPlaces`): on the road, or in the order to leave. */
const routePlacesOf = world => world.flight?.route?.places || world.flight?.places || [];
/** A count of miles in words, "1 mile" and "17 miles" (sim/road.mjs `milesWord`; the card read "1 miles an hour", 2026-09-28). */
function milesWord(miles) { return `${miles} ${miles === 1 ? 'mile' : 'miles'}`; }
/** A distance in words: yards close in, miles further off. */
const farWords = miles => (miles < 0.5 ? `${Math.max(10, Math.round(miles * 1760 / 10) * 10)} yards` : miles < 1.5 ? `${Math.round(miles * 4) / 4} of a mile`.replace('0.25', 'a quarter').replace('0.5', 'half').replace('0.75', 'three quarters').replace(/^1 of a mile$/, 'a mile').replace('1.25 of a mile', 'a mile and a quarter') : `${Math.round(miles)} miles`);
/**
 * The family's route as a line on the map, for its own page: `flight.route.line` is a list of legs, the first from where the
 * train stands. Thin, dashed and pale, a little wider as the map is zoomed in; the stops as small rings. Returns what it drew.
 */
function drawRouteLine(ctx, flight, camera, canvas) {
  const legs = flight?.route?.line;
  if (!legs?.length) return null;
  const width = Math.max(1, Math.min(2.4, camera.figure * 0.05));
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash([width * 3, width * 4]);
  ctx.strokeStyle = 'rgba(96,72,40,0.42)'; ctx.lineWidth = width;
  let points = 0;
  for (const leg of legs) {
    if (leg.length < 2) continue;
    ctx.beginPath();
    leg.forEach((point, i) => { const q = camera.toScreen(point); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.stroke();
    points += leg.length;
  }
  ctx.setLineDash([]);
  const stops = [];
  for (const leg of legs) {
    const end = leg.at(-1); if (!end) continue;
    const q = camera.toScreen(end);
    ctx.fillStyle = 'rgba(250,244,230,0.7)'; ctx.strokeStyle = 'rgba(96,72,40,0.55)'; ctx.lineWidth = Math.max(1, width * 0.8);
    ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2.5, width * 2.2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    stops.push({ x: Math.round(q.x), y: Math.round(q.y) });
  }
  ctx.restore();
  return { legs: legs.length, points, stops, width: Math.round(width * 100) / 100 };
}
/**
 * The route editor under the flight card (sim/flight-route.mjs): the stops in order, each stretch by the road or across
 * country, a place added from the list or by tapping the map, and "Set out this way". Its own element beside the card, so a
 * tick redrawing the card does not close a list a student has open.
 */
function renderRouteEditor(world, chosen, running) {
  const card = $('#selection-flight');
  let editor = $('#flight-route-editor');
  // Presentation evidence, read by scripts/scrape-pursuit-browser-proof.mjs and by nothing in the page.
  window.__routeEditor = { open: Boolean(routeDraft), picking: routePicking, stops: routeDraft ? [...routeDraft.stops] : [] };
  const onRoad = world.flight && ['fled', 'refuged'].includes(world.flight.status) && world.role !== 'host' && chosen?.id === actingOf(world) && !world.household?.takenIn;
  if (!onRoad || !routeDraft) {
    routePicking = false;
    if (editor) { editor.hidden = true; editor.replaceChildren(); }
    routeEditorKey = '';
    return;
  }
  if (!editor) { editor = document.createElement('div'); editor.id = 'flight-route-editor'; editor.className = 'flight-route'; card.after(editor); }
  editor.hidden = false;
  const sites = world.map?.sites || {};
  const places = routePlacesOf(world);
  const key = JSON.stringify([routeDraft, routePicking, places.length, running]);
  if (routeEditorKey === key) return;
  routeEditorKey = key;
  editor.replaceChildren(element('p', 'Where the family goes, stop by stop. Each stretch by the road - quicker, but seen from further off - or across country, slower over the rough ground and seen from half as far; a wagon cannot cross timber.', 'work-note'));
  const list = element('ol', '', 'flight-route-stops');
  routeDraft.stops.forEach((id, i) => {
    const row = element('li', '', 'flight-route-stop');
    row.append(element('span', sites[id]?.name || id, 'flight-route-name'));
    const way = document.createElement('select');
    way.dataset.routeWay = String(i); way.setAttribute('aria-label', `How the family goes to ${sites[id]?.name || id}`);
    for (const [value, label] of [['road', 'By the road'], ['country', 'Across country']]) { const option = element('option', label); option.value = value; option.selected = routeDraft.ways[i] === value; way.append(option); }
    const remove = element('button', '✕', 'flight-route-remove');
    remove.type = 'button'; remove.dataset.routeRemove = String(i); remove.setAttribute('aria-label', `Remove ${sites[id]?.name || id}`);
    row.append(way, remove);
    list.append(row);
  });
  if (!routeDraft.stops.length) list.append(element('li', 'No stops yet.', 'work-note'));
  const add = document.createElement('select'); add.id = 'flight-route-place'; add.setAttribute('aria-label', 'A place to add');
  for (const id of [...places].sort((a, b) => (sites[a]?.name || a).localeCompare(sites[b]?.name || b))) { const option = element('option', sites[id]?.name || id); option.value = id; add.append(option); }
  const addButton = element('button', 'Add this stop', 'work-option'); addButton.type = 'button'; addButton.id = 'flight-route-add';
  const pick = element('button', routePicking ? 'Stop picking on the map' : 'Pick stops on the map', 'work-option'); pick.type = 'button'; pick.id = 'flight-route-pick'; pick.setAttribute('aria-pressed', String(routePicking));
  const go = element('button', 'Set out this way', 'work-stop'); go.dataset.action = 'flight-route'; go.dataset.entityId = chosen.id; go.disabled = !running || !routeDraft.stops.length;
  const cancel = element('button', 'Keep the way we are going', 'work-option'); cancel.type = 'button'; cancel.id = 'flight-route-cancel';
  const adding = element('div', '', 'flight-route-add'); adding.append(add, addButton);
  editor.append(list, adding, pick, ...(routePicking ? [element('p', 'Tap a town, a landing, a ferry or a plantation on the map to add it.', 'work-note')] : []), go, cancel);
}
document.addEventListener('click', event => {
  const editor = event.target.closest?.('#flight-route-editor');
  if (!editor || !routeDraft) return;
  const snapshot = window.__snapshot;
  if (event.target.dataset.routeRemove !== undefined) { const i = Number(event.target.dataset.routeRemove); routeDraft.stops.splice(i, 1); routeDraft.ways.splice(i, 1); }
  else if (event.target.id === 'flight-route-add') { const id = $('#flight-route-place')?.value; if (id && routeDraft.stops.at(-1) !== id && routeDraft.stops.length < 6) { routeDraft.stops.push(id); routeDraft.ways.push('road'); } }
  else if (event.target.id === 'flight-route-pick') routePicking = !routePicking;
  else if (event.target.id === 'flight-route-cancel') { routeDraft = null; routePicking = false; }
  else return;
  routeEditorKey = '';
  if (snapshot) { renderSelection(snapshot.world); requestMapDraw(); }
});
document.addEventListener('click', event => {
  if (event.target.id !== 'flight-route-open') return;
  const flight = window.__snapshot?.world?.flight;
  // On the road the draft begins as the way it is going; camped, it begins empty (the family is at its last stop already).
  const stops = flight?.status === 'fled' ? flight?.route?.stops || [] : [];
  routeDraft = { stops: stops.map(stop => stop.id), ways: stops.map(stop => stop.way) };
  routeEditorKey = '';
  if (window.__snapshot) renderSelection(window.__snapshot.world);
});
document.addEventListener('change', event => {
  if (event.target.dataset?.routeWay === undefined || !routeDraft) return;
  routeDraft.ways[Number(event.target.dataset.routeWay)] = event.target.value;
  routeEditorKey = '';
});
function renderFlight(world, chosen, running) {
  const wrap = $('#selection-flight');
  // Before any order, a family that has heard of the Alamo's fall or the Mexican army's advance may go now, at a cost (owner,
  // 2026-09-29, D9 (b)): the server sends that card as `early`, beside the flight the family has not got (sim/scrape.mjs).
  const flight = world.flight || world.early;
  // On whoever is with the family and answers for it (sim/acting.mjs, `actingOf`): not a father away with the army (interactions B1).
  const main = actingOf(world);
  const taken = world.household?.takenIn;
  if ((!flight && !taken) || world.role === 'host' || chosen.id !== main) { wrap.hidden = true; wrap.replaceChildren(); flightFormKey = ''; return; }
  wrap.hidden = false;
  // Taken in by a neighbour family (sim/acting.mjs): nothing here is the family's to decide; it goes where they go.
  if (taken) {
    const words = `${takenInWords(world)} Whatever they decide, the little ones go with them.`;
    if (wrap.dataset.said !== words) { wrap.replaceChildren(element('p', words, 'ask-text flight-taken-in')); wrap.dataset.said = words; }
    flightFormKey = '';
    renderRouteEditor(world, null, running);
    return;
  }
  // The oldest child answering for the family, with nobody grown with it (owner, 2026-09-28: "The oldest child steps up").
  const stepped = world.household?.steppedUp ? `${chosen.name} is the oldest with the family, with nobody grown here, and answers for it.` : '';
  if (!['ordered', 'stayed', 'early'].includes(flight.status)) {
    // On the road (sim/road.mjs, docs/ROAD_EAST.md): where the family is, the weather, the mud, the camp, the danger - and
    // the road's question with its answers and their prices, in the shape every question here takes.
    const where = { fled: `The family is on the road east for ${flight.refugeName}${flight.mode === 'foot' ? ', on foot' : ''}${flight.waitingAt ? `, waiting to get over at ${flight.waitingAt}` : ''}.`, refuged: `The family is camped at ${flight.refugeName} with the other families from the west.`, returning: 'The family is on the road home.', home: 'The family is home, to what is left.' }[flight.status] || '';
    const road = [
      flight.weather === 'rain' && ['fled', 'refuged'].includes(flight.status) ? 'It is raining.' : '',
      flight.bogged ? (flight.bogged.freeing ? 'The wagon is being dug out of the mud.' : flight.bogged.waiting ? 'The wagon is fast in the mud; the family waits for the ground to dry.' : 'The wagon is fast in the mud.') : '',
      flight.oxSpent ? 'The ox is spent and goes at half pace.' : '',
      // On foot with the milk cow the family goes at her pace (sim/flight-work.mjs `cowPace`, owner 2026-09-27), and says why.
      flight.cowPace ? 'On foot with the milk cow, the family goes no faster than she walks, about two miles an hour.' : '',
      flight.camp ? `The family has halted: ${flight.camp.toLowerCase()}.` : '',
      // Said once: while the warning is the open question, its own words carry the miles.
      flight.danger && flight.ask?.id !== 'danger' ? `${flight.danger.name} is ${flight.danger.miles < 1 ? 'less than a mile' : `about ${milesWord(flight.danger.miles)}`} off, making for ${flight.danger.towardName}.` : '',
      flight.overtaken ? 'The Mexican army has come up with the family and taken what it had.' : '',
    ].filter(Boolean).join(' ');
    // Its own way (sim/flight-route.mjs): where it is making for, the next stop, the pace; and how far off it can be seen.
    const route = flight.route, stops = route?.stops || [];
    const routeWords = flight.status === 'fled' && route?.next ? `Making for ${stops.at(-1)?.name}${stops.length > 1 ? `, by way of ${stops.slice(0, -1).map(stop => stop.name).join(' and ')}` : ''}. Next, ${route.next.name}: ${milesWord(route.next.miles)} ${route.way === 'country' ? 'across country' : 'by the road'}, at about ${milesWord(route.mph)} an hour.` : '';
    const seen = flight.seen;
    const seenWords = seen && ['fled', 'refuged'].includes(flight.status) ? `Mexican troops could see the family from about ${farWords(seen.miles)}: ${seen.what === 'wagon' ? 'the wagon' : seen.what === 'mounted' ? 'riders' : 'people on foot'} ${seen.way === 'country' ? 'off the road' : 'on the road'}${seen.cover === 'timber' ? ', in the timber' : seen.cover === 'brush' ? ', in the brush' : ', in the open'}${['rain', 'storm'].includes(seen.weather) ? ', in the rain' : seen.weather === 'fog' ? ', in the fog' : ''}${seen.night ? ', at night' : ''}.` : '';
    // The soldiers after it (sim/pursuit.mjs), as the family sees them.
    const chase = flight.chase;
    const who = chase ? `${chase.kind === 'cavalry' ? `${chase.men} Mexican horsemen` : 'Mexican soldiers'} of ${chase.name}` : '';
    const hitWords = chase?.hits ? ` ${chase.shots.filter(shot => shot.hit).map(shot => `One hit ${shot.target === 'wagon' ? 'the wagon' : shot.target === 'beast' ? `the ${shot.name}` : shot.name}${shot.fate === 'killed' ? ', killed' : shot.fate === 'wounded' ? ', wounded' : shot.fate === 'lamed' ? ', lamed' : ''}.`).join(' ')}` : '';
    const chaseWords = !chase ? ''
      : chase.phase === 'seen' ? `${who} have seen the family and are coming after it, about ${farWords(chase.lead / 1760)} behind.${chase.timber ? ` There is timber about ${chase.timber.yards} yards off the road.` : ''}`
      : chase.phase === 'hailed' && chase.answer === 'run' ? `Running: ${who} are about ${chase.lead} yards behind. ${chase.shotCount ? `They have fired ${chase.shotCount} ${chase.shotCount === 1 ? 'shot' : 'shots'}; ${chase.hits ? `${chase.hits} hit` : 'none has hit'}.` : ''}${hitWords}`
      : chase.phase === 'caught' ? `${who} have the family.${chase.shotCount ? ` They fired ${chase.shotCount} ${chase.shotCount === 1 ? 'shot' : 'shots'}.` : ''}`
      : chase.phase === 'escaped' ? `The family got away from ${who}.${chase.shotCount ? ` They fired ${chase.shotCount} ${chase.shotCount === 1 ? 'shot' : 'shots'}; ${chase.hits ? `${chase.hits} hit` : 'none hit'}.` : ''}${hitWords}` : '';
    const canTimber = chase?.phase === 'seen' && chase.timber && flight.status === 'fled' && !flight.bog;
    const said = JSON.stringify([where, road, routeWords, seenWords, chaseWords, canTimber, flight.ask?.openedMinute ?? null, (flight.ask?.options || []).map(option => [option.id, option.can]), running, Boolean(routeDraft), stepped]);
    if (wrap.dataset.said !== said) {
      wrap.replaceChildren(element('p', where, 'ask-text'));
      if (stepped) wrap.append(element('p', stepped, 'work-note flight-stepped-up'));
      if (road) wrap.append(element('p', road, 'work-note'));
      if (routeWords) wrap.append(element('p', routeWords, 'work-note flight-route-words'));
      if (seenWords) wrap.append(element('p', seenWords, 'work-note flight-seen'));
      if (chaseWords) wrap.append(element('p', chaseWords, 'ask-text flight-chase'));
      if (canTimber) {
        const timber = element('button', '', 'work-option ask-option-work'); timber.dataset.action = 'flight-timber'; timber.dataset.entityId = chosen.id; timber.disabled = !running;
        timber.append(element('span', `Make for the timber, ${chase.timber.yards} yards off`, 'work-name'), element('span', 'Off the road and into the trees before they come up: horsemen will not follow a family into the timber, and soldiers cannot see far in it.', 'work-note'));
        wrap.append(timber);
      }
      // Not while the soldiers' order is the question in front of the family: that is answered first.
      if (['fled', 'refuged'].includes(flight.status) && !routeDraft && !(chase && ['caught'].includes(chase.phase)) && flight.ask?.id !== 'alto') {
        const change = element('button', 'Change where we go', 'work-option'); change.type = 'button'; change.id = 'flight-route-open'; change.disabled = !running;
        wrap.append(change);
      }
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
    renderRouteEditor(world, chosen, running);
    return;
  }
  renderRouteEditor(world, null, running);
  // Not rebuilt for what is in the house going down as the family eats (2026-09-30): before its order the calendar is not held, and
  // a rebuilt card threw away the student's load and the Leave pressed once. The counts and each box's most are kept current in
  // place instead (`haveWords`).
  const key = JSON.stringify([flight.status, flight.room, flight.mode, Object.keys(flight.have || {}), flight.refuges, flight.burned, flight.decidedToStay, flight.ifUnanswered, flight.heard, flight.crop, running, stepped]);
  const haveWords = good => flight.names?.[good] ? `${flight.names[good]} (${flight.have[good]} in the house, ${flight.space[good]} each)` : `${good} (${flight.have[good]} in the house)`;
  if (flightFormKey === key) {
    for (const input of wrap.querySelectorAll('.flight-amount')) {
      const good = input.dataset.take;
      if (flight.have?.[good] === undefined) continue;
      if (input.max !== String(flight.have[good])) input.max = String(flight.have[good]);
      setText(input.previousElementSibling, haveWords(good));
    }
    return;
  }
  flightFormKey = key;
  wrap.replaceChildren();
  wrap.dataset.said = '';
  if (stepped) wrap.append(element('p', stepped, 'work-note flight-stepped-up'));
  const early = flight.status === 'early';
  wrap.append(element('p', early ? `Nobody has told the family to leave yet, but it has heard: ${flight.heard} It may make ready and go now, before any order comes.`
    : flight.burned ? 'The army has passed and burned the farm. The family can still go east with what it can carry.'
    : flight.decidedToStay ? 'The family is staying, and takes what comes. The road east is still open if it changes its mind.'
    : 'The family has been told to leave for the east. Load what the wagon will carry and go; what is left will be burned. Answer before the time on the “!” runs out, or the family packs what it can and goes by itself.', 'ask-text'));
  // What going before the order costs, said before the button (sim/early-word.mjs `EARLY_COST`): the crop, and the house left empty.
  if (early) wrap.append(element('p', `Going now: ${flight.cost} ${flight.crop ? `There is ${flight.crop} in the field now.` : 'Nothing is growing in the field now.'}`, 'work-note flight-early-cost'));
  // A student at the screen who lets it run out loses the house (owner, 2026-09-29; sim/scrape.mjs `burnForSilence`): said first.
  if (flight.ifUnanswered && !flight.burned && !flight.decidedToStay) wrap.append(element('p', flight.ifUnanswered, 'work-note flight-if-unanswered'));
  const carrier = flight.vehicle === 'cart' ? ' in the cart' : flight.vehicle === 'carreta' ? ' in the carreta' : flight.wagons ? ` in the ${flight.wagons} wagons` : ' in the wagon';
  // The room each thing takes, the household goods too (owner, 2026-09-29, D9 (a); sim/flight-goods.mjs): the tools, the chest and
  // the spinning wheel the family has, by the names the server gives them.
  const named = good => flight.names?.[good] || good;
  const goods = Object.keys(flight.space).filter(good => !['food', 'seed', 'cotton', 'powder'].includes(good));
  // Each tool and good says its own room on its line; the sentence keeps to the stores, so the card stays readable with every good
  // a family with the wagons for it can bring (owner, 2026-09-30).
  wrap.append(element('p', `Room for ${flight.room}${flight.mode === 'wagon' ? carrier : ', carried on foot'}. Food takes ${flight.space.food} each, seed ${flight.space.seed}, cotton ${flight.space.cotton}, powder ${flight.space.powder}.${goods.length ? ' Each tool and thing for the house says its room below. What is not loaded is left in the house.' : ''}`, 'work-note flight-space'));
  const form = element('div', '', 'flight-form');
  for (const good of Object.keys(flight.space)) {
    // The bedding, the pot, the books and the rest, offered only with a wagon (sim/scrape.mjs `loadCard`), under their own line.
    if (good === flight.extras?.[0]) form.append(element('p', 'For the house, only in a wagon, if there is room:', 'work-note flight-extras'));
    const label = element('label', '', 'flight-take');
    label.append(element('span', haveWords(good)));
    const input = document.createElement('input');
    // Opened on the server's own packing (sim/scrape.mjs `packFlight`, design audit 2026-09-28 B7): food first, then seed, cotton
    // and powder, as much as fits. Until then every box opened at 0, and the obvious two presses left all the food behind.
    input.type = 'number'; input.min = '0'; input.max = String(flight.have[good]); input.step = '1'; input.value = String(flight.packed?.take?.[good] ?? 0);
    input.dataset.take = good; input.className = 'flight-amount';
    label.append(input);
    form.append(label);
  }
  const room = element('p', '', 'work-note'); room.id = 'flight-room';
  const refuge = document.createElement('select'); refuge.id = 'flight-refuge';
  for (const option of flight.refuges) { const choice = element('option', `${option.name} · about ${option.miles} miles`); choice.value = option.id; refuge.append(choice); }
  // Or any other place a family could make for (sim/flight-route.mjs), and whether it goes by the road or across country.
  const sites = world.map?.sites || {};
  const others = (flight.places || []).filter(id => !flight.refuges.some(one => one.id === id) && sites[id]).sort((a, b) => sites[a].name.localeCompare(sites[b].name));
  if (others.length) { const group = document.createElement('optgroup'); group.label = 'Other places'; for (const id of others) { const choice = element('option', sites[id].name); choice.value = id; group.append(choice); } refuge.append(group); }
  // The nearest refuge east, as the packing is for (`packFlight`).
  if (flight.packed?.refuge) refuge.value = flight.packed.refuge;
  const way = document.createElement('select'); way.id = 'flight-way';
  for (const [value, label] of [['road', 'By the road (quicker, seen from further off)'], ['country', 'Across country (slower, seen from half as far)']]) { const option = element('option', label); option.value = value; way.append(option); }
  const go = element('button', early ? 'Leave now, before the order' : 'Leave for the east', 'work-stop');
  go.dataset.action = 'flee'; go.dataset.entityId = chosen.id; go.disabled = !running;
  const tally = () => {
    const take = Object.fromEntries([...form.querySelectorAll('.flight-amount')].map(input => [input.dataset.take, Number(input.value) || 0]));
    const used = loadSpace(flight.space, take), light = lightLoad(flight, take);
    // A load far under what the family could take is said so, beside the room (design audit 2026-09-28 B7).
    // Said plainly when there is no room left, or too much is loaded (owner, 2026-09-30: "if they don't, then no").
    const over = used > flight.room + 1e-9, full = !over && flight.room - used < Math.min(...Object.values(flight.space)) - 1e-9;
    const whole = flight.mode === 'wagon' ? `The ${flight.vehicle || (flight.wagons ? 'wagons' : 'wagon')} ${flight.wagons ? 'are' : 'is'} full` : 'Everybody is carrying all they can';
    setText(room, `Loaded ${Math.round(used * 100) / 100} of ${flight.room}.${over ? ' That is more than there is room for: take something out.' : full ? ` ${whole}: there is no room left for anything more.` : ''}${light === 'empty' ? ' Nothing is loaded: everything would be left behind.' : light === 'light' ? ' Most of what the family could carry would be left behind.' : ''}`);
    room.dataset.over = String(used > flight.room + 1e-9);
    room.dataset.light = light || '';
  };
  // A changed load disarms a Leave already pressed once, so the second press always confirms the load it is shown.
  form.addEventListener('input', () => { tally(); resetConfirm(go); }); tally();
  wrap.append(form, room, element('label', 'Make for', 'flight-where'), refuge, element('label', 'How', 'flight-where'), way, go);
  // Refusing to go is an answer of its own (sim/scrape.mjs `stayHome`), offered only while the order stands unanswered.
  if (flight.status === 'ordered') {
    const stay = element('button', 'Stay, and take the risk', 'work-stop');
    stay.dataset.action = 'flight-stay'; stay.dataset.entityId = chosen.id; stay.disabled = !running;
    wrap.append(stay);
  }
}
/**
 * Somebody very sick (sim/disease.mjs): who of the family can nurse them, each a button that sends that person to it (design audit
 * S34, 2026-09-28). The sick person's "!" opens this: their own work is all refused (too sick to get up), and nursing is somebody
 * else's to do. Who can, and why nobody can, are the server's (`nurses` on the sick person, sim/world.mjs).
 */
function renderNurse(world, chosen, running) {
  const wrap = $('#selection-nurse');
  if (!wrap) return;
  const nurses = chosen.observed || world.role === 'host' || !chosen.sickness?.grave || !Array.isArray(chosen.nurses) ? null : chosen.nurses;
  if (!nurses) { wrap.hidden = true; wrap.replaceChildren(); wrap.dataset.said = ''; return; }
  wrap.hidden = false;
  const said = JSON.stringify([chosen.id, nurses, running]);
  if (wrap.dataset.said === said) return;
  wrap.dataset.said = said;
  wrap.replaceChildren(element('p', nurses.length ? `${chosen.name} is too sick to get up. Somebody of the family can nurse them:` : `${chosen.name} is too sick to get up, and nobody of the family can nurse them right now.`, 'ask-text'), ...nurses.map(nurse => {
    const button = element('button', '', 'work-option ask-option-work');
    button.dataset.action = 'chore'; button.dataset.chore = nurse.chore; button.dataset.entityId = nurse.id;
    button.disabled = !running;
    button.append(element('span', `${nurse.name} nurses ${chosen.name}`, 'work-name'),
      element('span', nurse.chore === 'tend-sick' ? 'The family halts a day while they nurse. Nobody in their care dies while they nurse.' : 'Stays by them and nurses them: nobody in their care dies while they nurse.', 'work-note'));
    return button;
  }));
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
  const key = JSON.stringify([chosen.id, running, chosen.service?.status ?? null, chosen.service?.besieged ?? null, chosen.service?.riding ?? null, chosen.service?.courier ?? null, chosen.service?.leave ?? null, chosen.service?.road ?? null, chosen.service?.drilled ?? null, chosen.service?.siteId ?? null, chosen.held ?? null, Boolean(chosen.travel), world.land, chosen.health?.condition, Boolean(chosen.chore), chosen.chore?.ask?.openedMinute ?? null,
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
  // A prisoner of the Mexican army (Fannin's men after Coleto, sim/fannin.mjs): where, and that nothing can be asked of him.
  if (chosen.service?.status === 'prisoner') {
    const where = world.map?.sites?.[chosen.service.siteId]?.name || chosen.service.siteId;
    host.append(element('p', `${chosen.name} is a prisoner of the Mexican army at ${where}, with the rest of Fannin's men. The family can do nothing for them.`, 'ask-text'));
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
        chosen.service.bound ? 'A regular who leaves goes before their time is up and without a discharge: they have deserted, the promise of land goes with it, and they will not be taken again.' : chosen.service.acres ? 'They start home at once, and the promise of land goes with it.' : 'They start home at once. Whatever the army does next happens without them.'],
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
    // In a fight (sim/battle-stage.mjs `heldByBattle`), or in the south after it before the word (sim/winter.mjs
    // `recallRefusal`): nobody can reach them, in the server's words, and no button that the server would refuse.
    if (chosen.service.unreachable || chosen.held) { host.append(element('p', chosen.service.unreachable || chosen.held, 'work-note')); return; }
    const recall = element('button', 'Send for them to come home', 'work-stop');
    recall.dataset.action = 'winter-recall';
    recall.dataset.entityId = chosen.id;
    recall.disabled = !running || Boolean(chosen.travel);
    host.append(recall);
    host.append(element('p', chosen.service.kind === 'regular' ? 'A regular who leaves goes before their time is up and without a discharge: they have deserted, the promise of land goes with it, and they will not be taken again.' : chosen.service.acres ? 'The promise of land is lost.' : 'They start home at once.', 'work-note'));
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
let panelExpanded = null, panelTipFor = null, panelBarId = null, panelOrderIds = [], errandWanted = null;
function renderFamilyPanel(world) {
  const panel = $('#family-panel'), list = $('#family-rows');
  const household = world.household;
  // No rows before the die is rolled, for the reason the card waits too: setting one of the founding four to work would use
  // up the family's roll on people it is about to replace. Nor before the family's book has arrived, which is what says
  // whether it has been rolled and who is father, mother and child - a panel drawn before it showed the founding four for a
  // moment (found by scripts/family-panel-browser-proof.mjs). And the Host has no family.
  if (!household || world.role === 'host' || !familyCache || familyCache.canRoll || rollState === 'rolling') { panel.hidden = true; hidePanelTip(); queueColumnFit(); return; }
  panel.hidden = false;
  queueColumnFit();
  const people = entitiesOf(world).filter(entity => entity.kind === 'person' && (household.members || []).includes(entity.id));
  const byId = new Map(people.map(entity => [entity.id, entity]));
  // Watching another family (sim/watching.mjs): its people by role and age, from the server, in place of this family's own book.
  const bookPeople = world.watching?.people || familyCache?.people || [];
  const book = new Map(bookPeople.map(person => [person.id, person]));
  const order = panelOrder(household.members.filter(id => byId.has(id)), bookPeople);
  const settable = world.status === 'running' || world.status === 'lobby';
  const homeId = homeOf(world);
  const homesteads = sitesOf(world).filter(site => site.kind === 'homestead' && site.id !== homeId).map(site => site.id);
  // The main person: the server's `mainId` (the principal until one is chosen), checked against the rows (docs/FAMILY_PANEL.md §11.3).
  focusedId = focusFor(household.mainId, { order, principalId: household.principalId, entities: people });
  if (!panelExpanded || !byId.has(panelExpanded)) panelExpanded = focusedId || order[0] || null;
  // Whose icons are the bar at the bottom (owner, 2026-09-21: "When I switch characters, the action bar at the bottom should
  // switch to that person's bar"). The main person's, as always - and a child's when the student has chosen that child's portrait
  // (docs/CHILDREN.md §2, 2026-09-26). A child under ten cannot be the main person (the server refuses `set-main`), so until this
  // no page could show a child's own works at all: the row's icons are only ever drawn as the bar. The main person stays main
  // for journeys and the house; the child's bar goes back to theirs the moment their portrait or star is chosen.
  // Since 2026-09-28 (design audit B11) that is anybody's portrait, not only a child's: choosing a person shows their bar and never
  // makes them main (`barPerson`, public/family-panel.js).
  const barId = barPerson({ viewedId: panelExpanded, mainId: focusedId, entities: byId });
  // Who a plot tapped on the map would go to first (`plotHand`): the person whose bar is shown, then the panel's order.
  panelBarId = barId; panelOrderIds = order;
  const land = world.land;
  const house = Boolean(land?.interior?.kind);
  const army = new Set((world.army?.ours || []).map(one => one.id));
  // The guided start, as the server sent it this tick (public/lesson.js). Absent when there is no lesson, and then nothing
  // below shuts anything: the panel is exactly what it was.
  const lesson = lessonShowing(world), lessonNote = lockedNote(lesson);
  for (const [id, row] of panelRows) if (!byId.has(id)) { row.item.remove(); panelRows.delete(id); }
  // Every "!" of the column in one order, the most urgent first, with the time each has left where it will lapse
  // (public/family-panel.js `rankNeeds`, docs/audits/2026-09-28-design.md S33). The rows keep the family's own order.
  const ranked = rankNeeds(world, order);
  const rankOf = new Map(ranked.map(one => [one.id, one]));
  const seen = [];
  order.forEach((id, at) => {
    const entity = byId.get(id), person = book.get(id);
    const row = panelRows.get(id) || panelRow(id);
    if (list.children[at] !== row.item) list.insertBefore(row.item, list.children[at] || null);
    const principal = id === household.principalId && entity.principal;
    // The age today is the tick's (`entity.age`, moved on each birthday: sim/ages.mjs); the family's book is fetched once and may be older.
    const shownAge = entity.age ?? person?.age;
    const age = !Number.isFinite(shownAge) ? '' : shownAge === 0 ? ', under a year' : `, ${shownAge}`;
    const role = person?.role || (principal ? 'principal' : 'of this family');
    const focused = id === focusedId, bar = id === barId;
    setData(row.item, 'role', person?.role || '');
    // Another family's names are theirs to give (sim/watching.mjs): read, never typed in.
    if (row.input.readOnly !== Boolean(world.watching)) row.input.readOnly = Boolean(world.watching);
    setData(row.item, 'principal', String(principal));
    setData(row.item, 'expanded', String(id === panelExpanded));
    // `focused` is the bar's row, which every rule of the bar reads; `main` the main person's gold edge and star.
    setData(row.item, 'focused', String(bar));
    setData(row.item, 'main', String(focused));
    // Somebody is waiting on this person - a rider, the army, a call, work that has stopped to ask, an offer - and the "!"
    // takes the student to them and to the thing waiting (docs/FAMILY_PANEL.md §11). Read from the projection every tick, so
    // it goes the tick the answer is given.
    const needs = needsOf(world, id);
    const need = needs[0] || null;
    setData(row.item, 'waiting', String(Boolean(need)));
    if (row.attention.hidden !== !need) row.attention.hidden = !need;
    // Its place among the family's "!"s and its time left: on the mark itself, so a Chromebook or a touch screen sees it
    // without hovering (S6), and said first in its name for a screen reader.
    const place = rankOf.get(id);
    setData(row.attention, 'urgent', String(Boolean(place && place.rank === 1 && ranked.length > 1)));
    setData(row.attention, 'rank', place ? String(place.rank) : '');
    row.needDeadline = Number.isFinite(need?.leftMs) ? performance.now() + need.leftMs : null;
    row.needRank = place && ranked.length > 1 ? place.rank : null;
    paintNeedBadge(row);
    const ahead = place && ranked.length > 1 ? (place.rank === 1 ? 'Answer this first. ' : `Number ${place.rank} to answer. `) : '';
    const timeLeft = leftWords(need?.leftMs);
    const needLabel = need ? `${ahead}${need.text}${timeLeft ? ` About ${timeLeft} left.` : ''}${needs.length > 1 ? ` And ${needs.length - 1} more.` : ''} Go to ${entity.name} and answer.` : '';
    if (need && row.attention.dataset.need !== need.kind) { row.attention.dataset.need = need.kind; paintMark(row.attention, need.kind === 'rider' ? 'mark-need-rider' : 'mark-need'); }
    if (row.attention.getAttribute('aria-label') !== needLabel) { row.attention.setAttribute('aria-label', needLabel); row.attention.title = needLabel; }
    const canLead = !(entity.age < 10) && !['dead', 'captured'].includes(entity.health?.condition);
    // What pressing it does, which is what the star does (owner, 2026-09-29).
    // Hungry, weak or starving (sim/hunger.mjs): the row's colour, the bowl on the portrait, and a word for the reader and the hover.
    const hunger = hungerOf(entity);
    setData(row.item, 'hunger', hunger);
    if (row.hungerMark.hidden !== (hunger === 'fed')) row.hungerMark.hidden = hunger === 'fed';
    // In out of the weather (sim/shelter.mjs): the roof or the tent on the portrait, and with whom for the reader and the hover.
    const shelterAt = entity.shelter?.at || '';
    if (row.shelterMark.hidden !== !shelterAt) row.shelterMark.hidden = !shelterAt;
    setData(row.shelterMark, 'at', shelterAt);
    setData(row.item, 'sheltering', String(Boolean(shelterAt)));
    const shelterTitle = shelterAt ? `In out of the weather: ${{ house: 'in the house', tent: 'under the tent', wagon: 'under the wagon', open: 'at the camp, with nothing over them' }[shelterAt]}${entity.shelter.minding ? ', with the children' : ''}.` : '';
    if (row.shelterMark.title !== shelterTitle) { row.shelterMark.title = shelterTitle; row.shelterMark.setAttribute('aria-label', shelterTitle); }
    const portraitLabel = `${entity.name}, ${role}${age}${HUNGER_WORDS[hunger] ? `, ${HUNGER_WORDS[hunger]}` : ''}${focused ? ', your main person' : ''}${bar ? ', selected' : ''}. ${focused ? `Go back to ${entity.name}` : `Make ${entity.name} your main person`}, follow them and show their actions${need ? '; somebody is waiting on them' : ''}.`;
    if (row.portrait.getAttribute('aria-label') !== portraitLabel) row.portrait.setAttribute('aria-label', portraitLabel);
    // What only the card said of them (owner 2026-09-29: the card is gone): a lasting wound, and having had the measles.
    // And their role and age, the age no longer on the row (owner, 2026-09-30, "Move age off the row"): "Prudence · daughter, 20".
    const about = [entity.name, `${role}${age}`, HUNGER_WORDS[hunger], ...(entity.marks || []), entity.hadMeasles && 'has had the measles'].filter(Boolean).join(' · ');
    if (row.portrait.title !== about) row.portrait.title = about;
    row.portrait.setAttribute('aria-pressed', String(bar));
    const focusLabel = focused ? `Go back to ${entity.name}, your main person` : `Make ${entity.name} your main person`;
    if (row.focus.getAttribute('aria-label') !== focusLabel) { row.focus.setAttribute('aria-label', focusLabel); row.focus.title = focusLabel; setText(row.focus.querySelector('.panel-mark-text'), focused ? '★' : '☆'); row.focus.setAttribute('aria-pressed', String(focused)); }
    // The auto switch, read from the server's `auto` on the person every tick (docs/FAMILY_PANEL.md §11.7).
    const onAuto = Boolean(entity.auto);
    // 'onAuto', not 'auto': the switch button carries data-auto, and a row attribute of the same name would catch its presses.
    setData(row.item, 'onAuto', String(onAuto));
    if (row.auto.getAttribute('aria-pressed') !== String(onAuto)) {
      row.auto.setAttribute('aria-pressed', String(onAuto)); paintMark(row.auto, onAuto ? 'mark-auto-on' : 'mark-auto-off');
      // The word is always shown beside the key (owner, 2026-09-25: "isn't quite visible enough"), so on and off are told
      // apart by what it says and not by its colour alone.
      setText(row.auto.querySelector('.panel-auto-word'), onAuto ? 'Auto ✓' : 'Auto');
    }
    const autoWords = autoLabel(entity, onAuto);
    if (row.auto.getAttribute('aria-label') !== autoWords) { row.auto.setAttribute('aria-label', autoWords); row.auto.title = autoWords; }
    const autoSays = autoLine(entity);
    setText(row.autoSays, autoSays);
    if (row.autoSays.hidden !== !autoSays) row.autoSays.hidden = !autoSays;
    // What the family's little ones are doing to this person, or this little one is doing (docs/CHILDREN.md): the server's own
    // sentence on a line of its own - a parent stopped to talk with a child who has nothing to do, a child gone to find them, a
    // child's automation just gone off, a baby crawling, crying, held or asleep. On every row, the main person's too.
    const life = lifeLine(entity);
    setText(row.life, life);
    if (row.life.hidden !== !life) row.life.hidden = !life;
    setData(row.life, 'kind', entity.aside ? 'stopped' : entity.baby ? 'baby' : entity.talk ? 'talk' : 'child');
    // A baby's short word, which stands in for its sentence when the column is tight (docs/CHILDREN.md §9); the sentence on hover.
    const shortWord = lifeWord(entity);
    setText(row.word, shortWord);
    if (row.word.hidden !== !shortWord) row.word.hidden = !shortWord;
    if (row.word.title !== life) row.word.title = life;
    setData(row.autoSays, 'waiting', String(Boolean(onAuto && entity.autoTask?.waiting)));
    // The sickness (sim/disease.mjs): the server's line under the rest, and the badge on the portrait; very sick is said in red.
    const sickSays = sickLine(entity);
    setText(row.sick, sickSays);
    if (row.sick.hidden !== !sickSays) row.sick.hidden = !sickSays;
    setData(row.sick, 'grave', String(Boolean(entity.sickness?.grave)));
    setData(row.item, 'sick', String(Boolean(entity.sickness)));
    if (row.sickMark.hidden !== !entity.sickness) {
      row.sickMark.hidden = !entity.sickness;
      if (entity.sickness) paintSickMark(row.sickMark);
    }
    const badgeLabel = entity.sickness ? sickSays : '';
    if (row.sickMark.title !== badgeLabel) row.sickMark.title = badgeLabel;
    // What the person has become goes on the row after what they are: the mark and the camp drill (docs/FAMILY_PANEL.md).
    // The role alone on the row; the age is on the portrait's hover and label and in the family book (owner, 2026-09-30, "Move age
    // off the row"): ", 20" beside "daughter" cut names of more than about five letters in the 19rem column.
    setText(row.label, role);
    // What they have become goes under the name: the mark and the camp drill (docs/FAMILY_PANEL.md §11).
    const become = standing(entity);
    setText(row.note, become);
    if (row.note.hidden !== !become) row.note.hidden = !become;
    const firstName = entity.given || entity.name;
    if (mayOverwriteName(row.input, firstName)) row.input.value = firstName;
    setData(row.input, 'current', firstName);
    // The portrait: the person's own figure, redrawn only when who they are drawn as changes.
    const figure = figureOf(entity), clip = `${figure}-idle-s`;
    const face = `${clip}:${entity.band || ''}:${principal}:${JSON.stringify(entity.appearance || null)}`;
    if (row.face !== face) {
      row.face = face;
      if (entity.appearance) drawAvatarPortrait(row.canvas, entity.appearance, entity.sex, entity);
      else drawPortrait(row.canvas, { clip, figure, band: entity.band, principal, tint: hashOf(id) }, { drawClip, drawSprite, spriteFrame });
    }
    // The icons, from the server's own lists. The journeys, the yard and rest are on the main person's row: the server's rule.
    // What a trip brings home depends on how they go, which is asked when it is sent (public/going.js): the icon says what a
    // good trip gives, and the chooser what each way brings home of it.
    const carry = null;
    const offered = world.work?.[id] || [];
    const icons = panelActions({ entity, offered, catalogue: choreCache || new Map(), main: focused, homeId, homesteads,
      atHome: entity.location?.siteId === homeId, settable, carry, wants: world.watching ? null : household.wants });
    // The guided start shuts everything the step does not allow, and rings the one it asks for (public/lesson.js). It is
    // read here rather than decided here: `allow` is the server's list and the server refuses anything else in words.
    const shutting = lessonLocks(lesson);
    const pointed = bar ? pointedKey(lesson, icons) : null;
    const lessonFor = key => (shutting ? { shut: !allowsIcon(lesson, icons.find(one => one.key === key)), note: lessonNote, pointed: key === pointed } : null);
    // Why this person can do nothing at all, in the server's own words (docs/FAMILY_PANEL.md §14, owner 2026-09-21).
    // `offered` and `entity` are read for the row `panelActions` empties outright - somebody dead or captured - which has
    // no icon left to carry a reason. A bar the guided start has shut is not this: those icons are still `can`.
    const reason = rowReason(icons, { offered, entity });
    // On a journey the row says Travelling (owner, 2026-09-22: "their icon should say 'Travelling' next to it"). It goes
    // where a reason goes, by §14.1's rule, and it outranks the server's "... is on the road." because it is the same fact
    // in the owner's own word. Somebody carried away out of sight keeps the server's fuller sentence (`awayLine`), in the same place
    // and beside any icon still drawn: once refused icons were no longer drawn (8e6ecd5) nothing else carried it (2026-09-26).
    const travelling = travellingLine(entity) || awayLine(entity, icons);
    // The main person's icon group *is* the bar at the bottom of the screen, and it shows the line there. Everybody else's
    // group is not drawn at all (public/style.css), so their line goes on the row, which is where a student looks for them.
    // This is the way out the stylesheet's ceiling named, asked for by a class on 2026-09-21.
    // A baby's row says what the baby is doing on its own line (`life`), not that it is too young to be sent, and a grown-up stopped
    // by the little ones says why there once, not twice (docs/CHILDREN.md §3, §6).
    const silence = bar ? '' : travelling || (entity.baby || entity.aside ? '' : reason) || '';
    setText(row.why, silence);
    if (row.why.hidden !== !silence) row.why.hidden = !silence;
    // No switch on a child too young to be sent, who has nothing for auto to repeat or answer. Only that case: somebody on
    // the road or in the ranks has a reason on their row too, and theirs is the switch auto-fight is for.
    // A child under ten with works of their own has no "too young" reason on the row (sim/children.mjs), and still showed the
    // switch - which the server refuses them (`tooYoung`, sim/world.mjs) - until 2026-09-25: the age is the server's, and the
    // same line of ten `canLead` reads above.
    // Since 2026-09-26 a child of two or more has automation of their own (sim/childhood.mjs, owner: "yes, kids should be able to
    // be automated. no, it shouldn't go forever"); an infant has nothing it could choose, and has no switch.
    const noSwitch = Boolean((reason && /too young/.test(reason) && !(entity.age >= 2)) || entity.age < 2);
    if (row.auto.hidden !== noSwitch) row.auto.hidden = noSwitch;
    // Idle: nothing to do and something could be given them. Everybody else on the panel is visibly at something (a glow).
    const idle = isIdle(entity, icons, { withArmy: army.has(id) });
    setData(row.item, 'idle', String(idle));
    seen.push({ id, need: need?.kind || null, needs: needs.map(one => one.kind), needRank: place?.rank ?? null, needLeftMs: need?.leftMs ?? null, idle, focused, auto: onAuto, autoSays: autoSays || null, autoWaiting: Boolean(onAuto && entity.autoTask?.waiting), reason: reason || null, why: silence || null, travelling: travelling || null, life: life || null, word: shortWord || null, switchShown: !noSwitch, bar });
    // What can be pressed, as since 2026-09-22, and beside it the goals refused only for what the family has not got - a carreta
    // short of its hide, a hunt whose rifle is at the war - greyed, with what they want (owner, 2026-09-30; docs/FAMILY_PANEL.md §23).
    // As many goals as two rows of the bar's 80 px columns leave room for, at most six (owner, 2026-09-30: "Keep the bar readable at
    // 1024x600"): the bar is as wide as the screen less the column and its margins (public/style.css), or scrolls on a phone.
    const pressable = icon => icon.active || (icon.can && (!shutting || allowsIcon(lesson, icon)));
    const phone = innerWidth <= 760;
    const visibleIcons = barIcons(icons, pressable, shutting ? 0 : phone ? 6 : goalRoom(icons.filter(pressable).length + 1, innerWidth - 220));
    // Somebody with the men in a fight says why nothing can be asked of them (sim/battle-stage.mjs `heldByBattle`).
    // A baby's bar says what the baby is doing (docs/CHILDREN.md §6): it is given no work, and "too young" is not news.
    const visibleReason = visibleIcons.length ? null : travelling || entity.held || (entity.baby && life) || reason || 'No actions available right now.';
    // Somebody chosen who is not the main person: their bar opens with the labelled way to make them main, and says why it matters.
    const makeMain = bar && !focused && canLead && settable ? `Make ${entity.given || entity.name} the main person` : '';
    // The rooms of the house, as the last icon of the bar shown, whoever's it is, once the family has a house (owner, 2026-09-30,
    // "Move Idle and House off": it was a button on the main person's row). Pressed, it opens the rooms as tapping the house on
    // the map does (`[data-house]` below); it sends nothing, so nothing shuts it.
    const homeIcon = bar && house ? HOUSE_ICON : null;
    // The food gauge's level too: the ways to food glow on it (`feedsNow`), so a change of level redescribes the icons.
    const key = JSON.stringify([visibleReason, travelling, visibleIcons, shutting ? [lesson.step, lesson.allow, lesson.shut, pointed] : null, makeMain, Boolean(homeIcon), larderWas]);
    if (row.iconsKey !== key) {
      row.iconsKey = key;
      row.icons.setAttribute('aria-label', `What ${entity.name} can do`);
      // Changed in place, icon by icon: the button a student has focused or is pointing at stays the same button while what
      // it says changes around it, so keyboard focus and the popup survive every tick.
      const kept = new Map([...row.icons.querySelectorAll('.panel-icon')].map(button => [button.dataset.key, button]));
      const shownIcons = homeIcon ? [...visibleIcons, homeIcon] : visibleIcons;
      row.icons.style.setProperty('--action-columns', Math.max(makeMain ? 3 : 1, Math.ceil(shownIcons.length / 2)));
      const wanted = shownIcons.length ? shownIcons.map(icon => {
        const button = kept.get(icon.key) || panelIcon(id, icon);
        kept.delete(icon.key);
        describeIcon(button, icon, icon === homeIcon ? null : lessonFor(icon.key));
        return button;
      }) : [];
      if (!visibleIcons.length) {
        const word = row.icons.querySelector('.panel-reason:not(.panel-travelling)') || element('span', '', 'panel-reason');
        setText(word, visibleReason);
        wanted.push(word);
      } else if (travelling) {
        const word = row.icons.querySelector('.panel-travelling') || element('span', '', 'panel-reason panel-travelling');
        setText(word, travelling);
        wanted.push(word);
      }
      if (makeMain) {
        setText(row.makeMain, makeMain);
        const note = 'Only the main person travels, rests and works about the place, and on auto the main person decides the family’s leaving and its answers on the road.';
        row.makeMain.title = note; row.makeMain.setAttribute('aria-label', `${makeMain}. ${note}`);
        wanted.unshift(row.makeMain);
      }
      for (const leftover of [...kept.values(), ...[...row.icons.querySelectorAll('.panel-reason, .panel-make-main')].filter(node => !wanted.includes(node))]) leftover.remove();
      wanted.forEach((node, at) => { if (row.icons.children[at] !== node) row.icons.insertBefore(node, row.icons.children[at] || null); });
      if (panelTipFor?.entityId === id) showPanelTip(row.icons.querySelector(`[data-key="${panelTipFor.key}"]`));
    }
  });
  window.__familyPanel = order.map((id, at) => {
    const row = panelRows.get(id);
    return { id, role: row.item.dataset.role, name: byId.get(id).name, age: byId.get(id).age, active: [...row.icons.querySelectorAll('[data-active=true]')].map(icon => icon.dataset.key), ...seen[at] };
  });
  markUnseenRows(world);
}
/**
 * The column's foot, measured (docs/FAMILY_PANEL.md §17, owner 2026-09-25: "Fix it"). The column is its own scroll region
 * (`#family-panel`, public/style.css), and here its box is bounded above whatever stands along the bottom - the ability bar,
 * one row or two, as tall as its names make it, lifted during the guided start - by that bar's own measured top, written
 * into `--column-room`. It replaces `#hud-left{bottom:200px}`, two heights written down for a bar whose tiles then grew.
 *
 * Measured after the frame's changes, not in the middle of them (one animation frame, coalesced): the bar is hidden while a
 * rider talks, an errand or a way of going is chosen, and those are drawn after the panel in the same render.
 *
 * - **No bar drawn** - the meeting, the errand or the going chooser has it - keeps the room the bar last had, so the
 *   column does not run down under the meeting for the minute it stands and jump back up after. Before any bar has been
 *   measured there is none to stop above, only the Journal and Land buttons and the screen's edge.
 * - **Tight**: when the rows do not all fit, the auto sentence goes off everybody's row but the main person's
 *   (`#family-panel[data-tight=true]`). The sentence is still the switch's tooltip and accessible name (`autoLabel`), and the
 *   switch keeps its word and its glow. Decided afresh only when something that changes the answer changes - the room, the
 *   rows, the sentences, the fold, the main person - with the sentences put back to measure, and the scroll kept, in the
 *   same task, so nothing is ever painted in between.
 * - **The main person is scrolled into view** when they are chosen and whenever the room changes, and at no other time: a
 *   student scrolling down the list to find the youngest is not dragged back up every tick.
 */
let columnFitQueued = false, barRoomWas = null, columnKey = null, roomKey = null, scrolledFor = null;
/** The least a phone's column is given, in pixels: a portrait and a half, whatever the strip above it takes. */
const PHONE_COLUMN_FLOOR = 76;
function queueColumnFit() {
  if (columnFitQueued) return;
  columnFitQueued = true;
  requestAnimationFrame(() => { columnFitQueued = false; fitColumn(); });
}
addEventListener('resize', queueColumnFit);
function fitColumn() {
  const panel = $('#family-panel'), column = $('#hud-left');
  const stage = column?.offsetParent?.getBoundingClientRect();
  // A page with no family has no column.
  if (!panel || panel.hidden || !stage) {
    document.body.style.removeProperty('--column-room'); document.body.style.removeProperty('--phone-column'); document.body.style.removeProperty('--bar-room'); document.body.style.removeProperty('--right-foot'); columnKey = roomKey = null; return;
  }
  // A phone puts the family below the status across the top (the stylesheet's `bottom:auto` there), so its column is not held
  // up from the foot of the screen: it is given a height, from where it starts down to the same foot a column stops at
  // anywhere else (owner, 2026-09-27: the family of twenty's phone checks are a gate again, docs/GATES.md).
  const phone = matchMedia('(max-width:760px)').matches;
  const barBox = $('.panel-row[data-focused=true] .panel-icons')?.getBoundingClientRect();
  let bar = barBox && barBox.width > 0 && barBox.height > 0 ? barBox : null;
  if (bar) barRoomWas = stage.bottom - bar.top;
  else if (barRoomWas !== null) bar = { top: stage.bottom - barRoomWas, left: stage.left, right: stage.right, width: stage.width, height: barRoomWas };
  // How far up from the foot of the screen the bar reaches, for the panels over the map that stop above it rather than run
  // down over its icons (`--bar-room`: the call's menu, the land choosers, the walk-through, packing the wagon; the overlap
  // proof, owner 2026-09-28). While the bar steps aside, the height it last had, as the column keeps it.
  const barRoom = bar ? `${Math.round(stage.bottom - bar.top)}px` : '';
  if (document.body.style.getPropertyValue('--bar-room') !== barRoom) { if (barRoom) document.body.style.setProperty('--bar-room', barRoom); else document.body.style.removeProperty('--bar-room'); }
  // And the foot of the right-hand side (`--right-foot`), where the meeting, the call's menu and packing the wagon stand:
  // above the bar when the bar reaches under them (a long bar on a narrow screen), otherwise above the map's buttons only,
  // so a panel on the right is not cut short for a bar that stands in the middle.
  const rightFoot = `${bar && bar.right > stage.right - 12 - Math.min(532, stage.width / 2 - 36) ? Math.round(stage.bottom - bar.top + 8) : 74}px`;
  if (document.body.style.getPropertyValue('--right-foot') !== rightFoot) document.body.style.setProperty('--right-foot', rightFoot);
  const box = panel.getBoundingClientRect();
  const tools = $('#map-tools')?.getBoundingClientRect();
  // On a phone the tip over the map stands the screen's width, just above the bar (`placeTip`: it is kept clear of the column
  // only where the column is beside the map), so there the column stops above it while it stands - it covered the column's
  // last 90 px, and the youngest of a large family could not be scrolled out from under it (the family-twenty proof,
  // 2026-09-30). Elsewhere the tip stands to the right of the column and `columnRoom` passes it by.
  const tip = phone && $('#tip') && !$('#tip').hidden ? $('#tip').getBoundingClientRect() : null;
  const room = columnRoom({ height: stage.bottom, column: { left: box.left, right: box.right }, bar, others: [tools, tip].filter(Boolean) });
  const roomText = `${room}px`;
  if (phone) {
    document.body.style.removeProperty('--column-room');
    // Never less than a row and a half of portraits, so a phone with a tall strip still shows whose row is open.
    const tall = `${Math.max(PHONE_COLUMN_FLOOR, Math.floor(stage.bottom - room - box.top))}px`;
    if (document.body.style.getPropertyValue('--phone-column') !== tall) document.body.style.setProperty('--phone-column', tall);
  } else {
    document.body.style.removeProperty('--phone-column');
    if (document.body.style.getPropertyValue('--column-room') !== roomText) document.body.style.setProperty('--column-room', roomText);
  }
  const lines = [...panel.querySelectorAll('.panel-auto-line, .panel-life-line, .panel-away-line')].filter(line => !line.hidden).map(line => line.textContent);
  // And whether the lone parent's ability stands at the head of the column, open or folded (public/courtship.js): it takes room.
  const ask = $('#ask-neighbours');
  const key = JSON.stringify([room, Math.round(stage.height), panelRows.size, lines, panel.dataset.collapsed || '', focusedId, ask ? `${ask.hidden}:${ask.dataset.folded || ''}` : '', $('#house-card') ? `${$('#house-card').hidden}:${$('#house-card').dataset.quiet || ''}` : '']);
  if (key !== columnKey) {
    columnKey = key;
    const kept = panel.scrollTop;
    setData(panel, 'tight', 'false');
    setData(panel, 'short', 'false');
    setData(panel, 'tight', String(panel.scrollHeight > panel.clientHeight + 1));
    // Shorter still: the story cards at the head of the column (the neighbours', the house's) taking half of it or more, they
    // fold to their icons and buttons (public/style.css `data-short`), so the rows keep room beneath them.
    const cardsTall = [...panel.querySelectorAll('#family-cards > .story-card:not([hidden])')].reduce((sum, card) => sum + card.getBoundingClientRect().height, 0);
    setData(panel, 'short', String(panel.dataset.tight === 'true' && cardsTall > panel.clientHeight / 2));
    panel.scrollTop = kept;
  }
  // The room, not the sentences: a row's auto line changing as its person waits must not scroll the list under a student.
  const roomNow = `${room}:${Math.round(stage.height)}`;
  if (roomNow !== roomKey) { roomKey = roomNow; scrolledFor = null; }
  const chosen = focusedId ? panelRows.get(focusedId)?.item : null;
  if (chosen && scrolledFor !== focusedId) {
    scrolledFor = focusedId;
    const view = panel.getBoundingClientRect(), row = chosen.getBoundingClientRect();
    const top = row.top - view.top - panel.clientTop + panel.scrollTop;
    const next = scrollToShow({ top, bottom: top + row.height }, { scrollTop: panel.scrollTop, clientHeight: panel.clientHeight });
    if (Math.abs(next - panel.scrollTop) >= 1) panel.scrollTop = next;
  }
  placeMilitaryNotice();
  window.__column = { room, tight: panel.dataset.tight === 'true', barTop: bar ? Math.round(bar.top) : null, bottom: Math.round(panel.getBoundingClientRect().bottom) };
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
      // The family's colour, the one its people's names are marked with in a fight on the class view (public/battle-cinema.js).
      const colour = element('span', '', 'host-colour'); colour.style.background = familyColour(row.id); colour.setAttribute('aria-hidden', 'true');
      head.append(colour, element('span', row.name), element('span', row.settlement, 'host-family-settlement'));
      // Who plays it, and in the lobby a ready mark once it is rolled, named and packed (owner, 2026-09-29: "Show name + ready").
      if (row.student) head.append(element('span', row.student, 'host-student'));
      if (row.ready) { const ready = element('span', 'ready', 'host-ready'); ready.title = 'Rolled, named and packed'; head.append(ready); }
      const presence = element('span', PRESENCE_LABELS[row.presence] || row.presence, 'host-presence'); presence.dataset.presence = row.presence;
      head.append(presence);
      if (row.waiting) { const waiting = element('span', `${row.waiting} waiting`, 'host-waiting'); waiting.title = `${row.waiting} thing${row.waiting === 1 ? '' : 's'} wait${row.waiting === 1 ? 's' : ''} unanswered on this family`; head.append(waiting); }
      const people = element('ul', '', 'host-people');
      people.append(...row.people.map(person => { const line = element('li', ''); line.append(element('span', `${person.name} `), element('span', person.where)); return line; }));
      // The guided start, only when the student stopped it or took it back up (owner, 2026-09-22): a line of words, never
      // a banner, a sound or an alert, and not a live region either - the teacher reads it when they look.
      // A child lost to sickness, counted and not named (the owner, 2026-09-27; sim/host.mjs).
      // And of hunger (owner, 2026-09-30; sim/hunger.mjs): the same count, said apart.
      const children = n => (n === 1 ? 'A child' : `${n} children`);
      const sickLost = (row.lost || 0) - (row.lostHunger || 0);
      const lost = [...(sickLost > 0 ? [element('p', `${children(sickLost)} of this family died of sickness.`, 'host-lost')] : []), ...(row.lostHunger ? [element('p', `${children(row.lostHunger)} of this family died of hunger.`, 'host-lost')] : [])];
      item.append(head, ...(row.guided ? [element('p', row.guided, 'host-guided')] : []), people, ...lost);
      return item;
    }));
  }
  // The class's sickness, counted in words (sim/disease.mjs `classSickness`): "Measles: 4 sick, 1 very sick."
  const classSick = sicknessView(live), sickNode = $('#host-sickness');
  if (sickNode) { if (sickNode.textContent !== classSick) sickNode.textContent = classSick; sickNode.hidden = !classSick; }
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
      // A fight's spotlight follows the fight instead (`framingFor`, focus `battle`): both sides stay in the frame as they
      // move, which one fixed point at one zoom could not do across a charge and a withdrawal.
      // Since 2026-09-30 the film of the fight takes the camera there (public/battle-cinema.js) and puts the teacher's own view
      // back after, so the view is left as it is; a spotlight lit while the film has the camera is said by the banner alone.
      if (!(snapshot.world.host?.focus === 'battle' && snapshot.world.battle) && !hostCinema.driving) manualView = { cx: shown.x, cy: shown.y, scale: clampTo(Math.max(view.scale, view.limits.max * .45), view.limits) };
      window.__spotlightSeen = (window.__spotlightSeen || []).concat(shown.key);
    }
    if (!shown) hostLiveKeys.spotlight = null;
  }
  window.__hostLive = { families: rows, story: { paragraphs: story.paragraphs.length, topics: live.story?.topics || [], latest: story.latest }, spotlight: shown?.key || null, sickness: classSick };
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
  const warning = autoFlightWarning(window.__snapshot?.world, id);
  try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'set-main', entityId: id }); }
  catch (error) { say(error.message); return; }
  if (warning) say(warning);
}
/**
 * Warn, then allow (owner, 2026-09-29; the design audit's B11): on the flight east a main person on auto answers the order to leave
 * and the soldiers for the family (sim/auto.mjs `advanceAuto`, sim/pursuit.mjs). Somebody on auto made main there - by the star or,
 * since portrait = star, by their portrait - still becomes main, and the refusal line says in one plain sentence what that means.
 */
function autoFlightWarning(world, id) {
  const person = world?.entities?.find(one => one.id === id), flight = world?.flight;
  if (!person?.auto || !flight || !(flight.ask || ['ordered', 'fled', 'refuged', 'returning'].includes(flight.status))) return '';
  const [they, themself] = person.sex === 'female' ? ['she', 'herself'] : person.sex === 'male' ? ['he', 'himself'] : ['they', 'themselves'];
  return `${person.given || person.name} is on auto, so ${they} will answer ${flight.status === 'ordered' ? 'the order to leave' : 'the soldiers'} ${themself}.`;
}
/**
 * The star, and since 2026-09-29 the portrait (owner: *"it should be treated the same as clicking on the star"*): make this person
 * the main one - unless they are already - and go to them. One handler, so the two never drift apart.
 */
function pressStar(id) {
  if (id !== focusedId) chooseFocus(id);
  goToPerson(id);
}
/**
 * Take the camera to one of the family and open their card: the same watch a portrait starts (`cameraFor` centres on where
 * they are drawn and zooms in), which walks with them until the student pans, zooms or presses Follow.
 */
function goToPerson(id) {
  const world = window.__snapshot?.world;
  selectedId = id; selectionDismissed = false;
  // Out of sight on the road (`unseenOnRoad`): what is waiting on them opens - their card, for the "!" and the story cards - but the
  // camera does not go looking for somebody it cannot draw, and their row is not chosen.
  if (unseenOnRoad.has(id)) { if (world) { watchChase(world); renderSelection(world); renderTutorial(world); } return; }
  watchedId = id; manualView = null; fieldWatch = null; panelExpanded = id;
  if (world) { drawWorld(world); renderFamilyPanel(world); renderSelection(world); renderTutorial(world); }
}
/** What an unseen traveller's row says (owner, 2026-09-29): where they are going, and when they are back in view. */
function awayWords(world, entity) {
  // With the army: where the army is, by the server's own place name (owner, 2026-09-30, "Greyed, better words").
  const army = armyAwayWords(world, entity.id);
  if (army) return army;
  const to = entity.travel?.to;
  const where = !to ? 'On the road' : to === homeOf(world) ? 'On the road home' : `On the road to ${world.map?.sites?.[to]?.name || 'town'}`;
  return `${where} — back in view when they arrive`;
}
/** The frame's unseen travellers (`drawWorld`): kept, and the rows told, only when who they are or what their rows say has changed. */
function noteUnseen(next, world) {
  const key = map => JSON.stringify([...map]);
  if (key(next) === key(unseenOnRoad)) return;
  unseenOnRoad = next;
  window.__unseenOnRoad = next;
  // Not followed while unseen: the camera gives the family's frame back and stays there (`cameraFor`); watching them again
  // is a press on their portrait once they are drawn. Unless soldiers are after the family: then the chase is framed instead,
  // close enough for its horsemen and their order to be drawn - the family's frame is too far out to read them, and a figure drawn
  // again out there would only be followed in, faded out and dropped once more (the fade is the page's, and depends on the zoom).
  if (watchedId && next.has(watchedId)) { watchedId = null; if (world?.flight?.chase) watchChase(world, { draw: false }); }
  markUnseenRows(world);
}
/**
 * Greyed, not hidden (owner, 2026-09-29): the row dimmed, its line saying where they are going and that they are back in view on
 * arrival, and the portrait, the star and "Make main" held (`aria-disabled`), refused in a quiet line if pressed. The "!" is not
 * held: a question for them is answered from it or from its story card, whatever the row says.
 */
function markUnseenRows(world) {
  for (const [id, row] of panelRows) {
    const words = unseenOnRoad.get(id) || '';
    setData(row.item, 'unseen', String(Boolean(words)));
    for (const button of [row.portrait, row.focus, row.makeMain]) {
      if (words) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
    }
    setText(row.away, words);
    if (row.away.hidden !== !words) { row.away.hidden = !words; queueColumnFit(); }
  }
}
/** A press on an unseen traveller's portrait, star or "Make main": refused, in words, and nothing else happens. */
function refusedUnseen(id) {
  const words = unseenOnRoad.get(id);
  if (!words) return false;
  const person = entitiesOf(window.__snapshot?.world || {}).find(one => one.id === id);
  say(`${person?.given || person?.name || 'They'} cannot be chosen while out of sight. ${words}.`);
  return true;
}
/** Where on the card each need is answered. A rider has a panel of their own. */
const NEED_SECTIONS = { sighting: '#selection-work', alto: '#selection-flight', army: '#selection-army', camp: '#selection-work', courier: '#selection-work', flight: '#selection-flight', road: '#selection-flight', call: '#selection-call', asking: '#selection-work', child: '#selection-work', offer: '#selection-trade', sick: '#selection-nurse' };
/**
 * The tag on a "!": its number among the family's "!"s when there is more than one, and the time left where the question
 * will lapse, counted down on this page's own clock from what the server last said (S33). The server's clock is the one that
 * lapses the question; this only reads it out between ticks, which at the Study pace are nine and a half seconds apart.
 */
function paintNeedBadge(row) {
  const left = row.needDeadline === null ? null : leftWords(Math.max(0, row.needDeadline - performance.now()));
  const words = [row.needRank ? String(row.needRank) : '', left || ''].filter(Boolean).join(' · ');
  setText(row.needBadge, words);
  if (row.needBadge.hidden !== !words) row.needBadge.hidden = !words;
}
// Once a second, the countdowns on the "!"s and whether a tip's thing has come or gone (the town errand opens with no
// snapshot). Declared above the page's start-up, for the TDZ guard in tests/page-startup.test.mjs.
setInterval(() => {
  for (const row of panelRows.values()) if (row.needDeadline !== null) paintNeedBadge(row);
  paintMilitaryLeft();
  if (window.__snapshot?.world) renderTip(window.__snapshot.world);
}, 1000);
/**
 * The "!" on a row: go to the person and open what is waiting on them - the rider's conversation, or their card at the
 * question with its answers - and put the keyboard on the first answer. Nothing is decided here: the answers are the card's
 * buttons, sent as they always were, and the "!" goes when the projection stops saying anything is waiting.
 */
function openNeed(id, kind = null) {
  const world = window.__snapshot?.world;
  if (!world) return;
  const need = (kind && needsOf(world, id).find(one => one.kind === kind)) || needsOf(world, id)[0];
  // The "!" of a sighting takes the shot, as its card does (owner, 2026-10-02: "if players click on it in time").
  if (need?.kind === 'sighting' && takeTheShot(world, id)) return;
  goToPerson(id);
  if (!need) return;
  let target = null;
  if (need.kind === 'rider') {
    encounterOpen = true;
    renderEncounter(world);
    // The conversation itself, not its first question: the questions are drawn again every tick, and a focused one would be
    // replaced under the keyboard.
    target = $('#encounter');
  } else if (need.kind === 'call' && world.request?.kind !== 'supply') {
    // (The army's request for supplies is answered on the person's card, below: what to send, not who goes.)
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
  // The sick badge (sim/disease.mjs, docs/DISEASE.md §3.10): shown while the server says the person is sick.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-27 "the sick badge" - `mark-sick` is Claude-drawn today ("Claude-drawn
  // stand-ins (replace with Astra's)"); without its sheet, the road's nursing picture (`icon-tend-sick`, or its drawn glyph) in a
  // small disc. Astra's `mark-sick` replaces Claude's when registered (`paintSickMark`).
  const sickMark = element('span', '', 'panel-sick-mark');
  const sickCanvas = document.createElement('canvas');
  sickCanvas.width = sickCanvas.height = 48;
  sickCanvas.setAttribute('aria-hidden', 'true');
  sickMark.append(sickCanvas);
  sickMark.hidden = true;
  // Hunger on the portrait (sim/hunger.mjs, owner 2026-09-30): the face tinted and ringed by the stage, and an empty bowl in its
  // corner coloured the same - amber hungry, ember weak, red and pulsing starving (public/style.css `data-hunger`). No words.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-30 "the hunger mark" - a bowl drawn in the style sheet until Astra's
  // `mark-hunger` is registered.
  const hungerMark = element('span', '', 'panel-hunger-mark');
  hungerMark.setAttribute('aria-hidden', 'true');
  hungerMark.hidden = true;
  // In out of the weather (sim/shelter.mjs, owner 2026-10-02): a roof or a tent in the portrait's top right while the server says they
  // are in, the house, the tent or the wagon (public/style.css `data-at`). No words. stand-in: docs/ART_REQUESTS.md, request 2026-10-02
  // "the shelter mark" - drawn in the style sheet until Astra's `mark-shelter-house` and `mark-shelter-tent` are registered.
  const shelterMark = element('span', '', 'panel-shelter-mark');
  shelterMark.hidden = true;
  portrait.append(canvas, star, idleMark, sickMark, hungerMark, shelterMark);
  // The "!": its own button beside the portrait (a button cannot hold a button), shown only while somebody waits on them.
  const attention = panelMark('button', '!', 'panel-attention', 'mark-need');
  attention.type = 'button';
  attention.dataset.attention = id;
  attention.hidden = true;
  // Which "!" to answer first and how long it has (S33, 2026-09-28): a small tag on the mark, written by `paintNeedBadge`.
  const needBadge = element('span', '', 'panel-attention-badge');
  needBadge.setAttribute('aria-hidden', 'true');
  needBadge.hidden = true;
  attention.append(needBadge);
  const body = element('div', '', 'panel-body');
  const label = element('label', '', 'panel-label');
  const input = document.createElement('input');
  input.id = `panel-name-${id}`;
  input.className = 'panel-name';
  input.maxLength = 24; input.autocomplete = 'off'; input.spellcheck = false;
  input.dataset.rename = id;
  label.htmlFor = input.id;
  // The row's tools: a baby's word, the auto switch and the star, and nothing else (owner, 2026-09-30, "Move Idle and House off").
  // Idle is the portrait's own mark (`.panel-idle-mark`); the house's rooms are an icon on the bar (`HOUSE_ICON`). With the two
  // there, a row with all four was 393 px in a 304 px column at the 12 px type, and cut its star and its name.
  const tools = element('span', '', 'panel-tools');
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
  // A baby's one short word (owner, 2026-09-27: "Show a short word"): beside the name, so a column too tight for the baby's
  // sentence still says what it is doing without a line more. Shown only then (public/style.css).
  const word = element('span', '', 'panel-life-word');
  word.hidden = true;
  tools.append(word, auto, focus);
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
  // What the family's little ones are doing to or with this person (docs/CHILDREN.md, owner 2026-09-26): the server's sentence.
  const life = element('span', '', 'panel-life-line');
  life.hidden = true;
  // The sickness in the server's words (sim/disease.mjs `sicknessShown`): what they have, what they are doing, and what rest
  // would do - "Has the measles: walking. Resting would mend it sooner."
  const sick = element('span', '', 'panel-sick-line');
  sick.hidden = true;
  // Out of sight on the road (owner, 2026-09-29, `markUnseenRows`): where they are going, and that they are back in view on arrival.
  const away = element('span', '', 'panel-away-line');
  away.hidden = true;
  body.append(label, input, tools, note, why, away, autoSays, life, sick);
  item.append(portrait, attention, body, icons);
  // The one labelled way besides the star to change who the main person is (design audit 2026-09-28 B11): first in the bar of
  // somebody chosen who is not main. It sends `set-main` through the star's own handler (`data-focus`).
  const makeMain = element('button', '', 'panel-make-main');
  makeMain.type = 'button';
  makeMain.dataset.focus = id;
  const row = { item, portrait, canvas, label, input, icons, attention, needBadge, needDeadline: null, needRank: null, focus, auto, autoSays, life, sick, sickMark, hungerMark, shelterMark, word, note, why, away, makeMain, face: null, iconsKey: null };
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
/**
 * The sick badge: `mark-sick` where it can be drawn (then it is its own round token, `data-drawn`), else the nursing picture -
 * which is what a page shows while Astra's art wins over Claude's `mark-sick` (public/art-subjects.js, "the sick mark": her
 * `icon-tend-sick` in the cream disc). `data-picture` says which was drawn: `mark-sick`, `icon-tend-sick`, or the glyph before
 * any sheet has come.
 */
function paintSickMark(node) {
  const canvas = node.querySelector('canvas');
  const drawn = drawMark(canvas, 'mark-sick', { drawSprite, spriteFrame });
  if (!drawn) drawIcon(canvas, 'tend-sick', { drawSprite, spriteFrame });
  setData(node, 'drawn', String(drawn));
  setData(node, 'picture', drawn ? 'mark-sick' : spriteFrame('icon-tend-sick') ? 'icon-tend-sick' : 'glyph');
}
function paintMark(node, mark) {
  node.dataset.mark = mark;
  setData(node, 'drawn', String(drawMark(node.querySelector('canvas'), mark, { drawSprite, spriteFrame })));
}
/**
 * The house's rooms on the bar (owner, 2026-09-30, "Move Idle and House off"): made here, not sent by the server, because it is
 * not an order - it opens the rooms inside, where the furniture and the goods are set out. Always open; never glows.
 */
const HOUSE_ICON = Object.freeze({ key: 'go-inside', name: 'House', house: true, can: true, active: false,
  summary: 'Go inside the house to set out the furniture and the goods.', note: 'Opens the rooms inside the house.' });
function panelIcon(entityId, icon) {
  const button = element('button', '', 'panel-icon');
  button.type = 'button';
  button.dataset.key = icon.key;
  button.dataset.entityId = entityId;
  // What pressing it sends, in the same attributes the card's buttons carried, so the one dispatcher sends it.
  if (icon.kind === 'chore') { button.dataset.action = icon.onMap ? 'survey-start' : 'chore'; button.dataset.chore = icon.key; }
  else if (icon.visit) button.dataset.visit = 'true';
  else if (icon.destination) { button.dataset.action = 'travel'; button.dataset.destination = icon.destination; }
  else if (icon.house) button.dataset.house = entityId;
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
  // A way to food glows while the food is low (owner, 2026-10-02; public/family-panel.js `feedsNow`): the gauge's own level.
  setData(button, 'feeds', feedsNow(icon.key, larderWas) ? 'true' : '');
  button.dataset.active = String(icon.active);
  if (icon.active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
  // A goal refused only for what the family has not got (docs/FAMILY_PANEL.md §23): greyed like any refusal, and a strip along its
  // foot of what it wants - lit for what the family has, ember for what it has not - with the counts in its popup and its name.
  setData(button, 'goal', icon.goal ? 'true' : '');
  const needs = icon.needs || null;
  const needsKey = needs ? JSON.stringify(needs) : '';
  if ((button.dataset.needs || '') !== needsKey) { button.dataset.needs = needsKey; paintNeeds(button, needs); }
  const needWords = needs ? `Has ${needs.map(need => `${WANT_NAMES[need.want] || need.want} ${need.have} of ${need.need}`).join(', ')}.` : '';
  button.setAttribute('aria-label', [`${icon.name}.`, icon.summary, note, needWords, lesson?.pointed ? 'This is the step to do now.' : ''].filter(Boolean).join(' '));
}
/** The strip of what a goal wants along an icon's foot: one bead a want, `data-met` lit or ember, no words (the popup has them). */
function paintNeeds(button, needs) {
  let strip = button.querySelector('.panel-needs');
  if (!needs) { strip?.remove(); return; }
  if (!strip) { strip = element('span', '', 'panel-needs'); strip.setAttribute('aria-hidden', 'true'); button.append(strip); }
  strip.replaceChildren(...needs.map(need => {
    const bead = element('i', '');
    bead.dataset.want = need.want; bead.dataset.met = String(need.met);
    return bead;
  }));
}
/**
 * The small popup over an icon: what it is, its one sentence, and the server's price or reason - and, **armed** by a first tap
 * on a touch screen (triage D17, public/family-panel.js `iconPress`), a Send button that sends the order. Shown again for the
 * same icon (a hover, a focus, the row drawn again) it stays armed; for another icon, or refused now, it is not.
 */
function showPanelTip(button, { armed = false, pinned = false } = {}) {
  const tip = $('#panel-tip');
  if (!button) { hidePanelTip(); return; }
  const refused = button.getAttribute('aria-disabled') === 'true';
  const same = panelTipFor?.entityId === button.dataset.entityId && panelTipFor?.key === button.dataset.key;
  // What a goal wants, and the work that brings the first thing missing (docs/FAMILY_PANEL.md §23): a hide points at the hunt.
  let needs = null;
  try { needs = button.dataset.needs ? JSON.parse(button.dataset.needs) : null; } catch { needs = null; }
  const onBar = [...(button.closest('.panel-icons')?.querySelectorAll('.panel-icon') || [])].map(one => one.dataset.key);
  // Every way on for the first thing missing (owner, 2026-09-30): a hide by a hunt and from the tanner, a buy only where the
  // family's own town sells it (the server's `buy`).
  const ways = nextSteps(needs, onBar, window.__snapshot?.world?.household?.buy || []);
  panelTipFor = { entityId: button.dataset.entityId, key: button.dataset.key, armed: !refused && (armed || Boolean(same && panelTipFor.armed)),
    // Pressed (not hovered), a goal's popup stays while the pointer goes to its buttons.
    pinned: ways.length > 0 && (pinned || Boolean(same && panelTipFor.pinned)), go: ways[0]?.key || null };
  setText($('#panel-tip-name'), button.dataset.name);
  setText($('#panel-tip-summary'), button.dataset.summary);
  setText($('#panel-tip-note'), button.dataset.note || '');
  const list = $('#panel-tip-needs');
  if (list) {
    const key = needs ? JSON.stringify(needs) : '';
    if ((list.dataset.key || '') !== key) {
      list.dataset.key = key;
      list.replaceChildren(...(needs || []).map(need => {
        const item = element('b', `${WANT_NAMES[need.want] || need.want} ${need.have}/${need.need}`);
        item.dataset.want = need.want; item.dataset.met = String(need.met);
        return item;
      }));
    }
    list.hidden = !needs;
  }
  const host = $('#panel-tip-ways');
  if (host) {
    const key = JSON.stringify(ways);
    if ((host.dataset.key || '') !== key) {
      host.dataset.key = key;
      host.replaceChildren(...ways.map(way => {
        const go = element('button', way.label, 'panel-tip-go');
        go.type = 'button'; go.dataset.key = way.key; go.dataset.want = way.want;
        if (way.line) go.dataset.line = way.line;
        return go;
      }));
    }
    host.hidden = !ways.length;
  }
  setData(tip, 'pinned', String(panelTipFor.pinned));
  tip.dataset.refused = String(refused && button.dataset.active !== 'true');
  setData(tip, 'armed', String(panelTipFor.armed));
  const send = $('#panel-tip-send');
  if (send) {
    send.hidden = !panelTipFor.armed;
    send.setAttribute('aria-label', `Send: ${button.dataset.name}`);
  }
  tip.setAttribute('role', panelTipFor.armed ? 'group' : 'tooltip');
  tip.hidden = false;
  const box = button.getBoundingClientRect(), stage = $('.map-stage').getBoundingClientRect();
  const left = Math.max(8, Math.min(stage.width - tip.offsetWidth - 8, box.left - stage.left + box.width / 2 - tip.offsetWidth / 2));
  const below = box.bottom - stage.top + 8, above = box.top - stage.top - tip.offsetHeight - 8;
  tip.style.left = `${left}px`;
  tip.style.top = `${below + tip.offsetHeight < stage.height - 8 ? below : Math.max(8, above)}px`;
}
function hidePanelTip() { panelTipFor = null; const tip = $('#panel-tip'); if (tip) { tip.hidden = true; setData(tip, 'armed', 'false'); setData(tip, 'pinned', 'false'); } }
/**
 * Whether a press on an icon came from a touch screen (triage D17): the press's own pointer where the browser says it (a tap is
 * `touch`, a stylus `pen`), else the pointer that last went down, else whether this is a touch screen at all - `pointer: coarse`,
 * or a touch seen. A keyboard's press has no pointer (`detail` 0) and is never a tap.
 */
let lastPointer = '', touchSeen = matchMedia('(pointer: coarse)').matches;
document.addEventListener('pointerdown', event => { lastPointer = event.pointerType || ''; if (event.pointerType === 'touch') touchSeen = true; }, true);
document.addEventListener('touchstart', () => { touchSeen = true; }, { capture: true, passive: true });
function touchPress(event) {
  if (!event || event.detail === 0) return false;
  const pointer = event.pointerType || lastPointer;
  return pointer ? pointer === 'touch' || pointer === 'pen' : touchSeen;
}
// An armed popup goes when anything else is pressed: another icon arms its own, the map or a panel puts it away.
document.addEventListener('pointerdown', event => {
  if (!(panelTipFor?.armed || panelTipFor?.pinned) || event.target.closest?.('#panel-tip')) return;
  const icon = event.target.closest?.('.panel-icon');
  if (icon && icon.dataset.entityId === panelTipFor.entityId && icon.dataset.key === panelTipFor.key) return;
  hidePanelTip();
}, true);
// Send: the order the armed icon gives, sent exactly as a second tap on it sends it.
$('#panel-tip-send')?.addEventListener('click', () => {
  const icon = panelTipFor?.armed && panelRows.get(panelTipFor.entityId)?.icons.querySelector(`[data-key="${panelTipFor.key}"]`);
  if (icon) icon.click(); else hidePanelTip();
});
// A goal's way on (docs/FAMILY_PANEL.md §23): the work that brings the first thing it wants, pressed on the same person's bar - the
// hunt's place chooser for a hide, felling for logs, the town errand for an axe, a rifle or powder - exactly as pressing that icon.
$('#panel-tip-ways')?.addEventListener('click', event => {
  const way = event.target.closest('.panel-tip-go');
  const target = way && panelTipFor && panelRows.get(panelTipFor.entityId)?.icons.querySelector(`[data-key="${way.dataset.key}"]`);
  hidePanelTip();
  // A buy opens the town errand with its line on the list (`errandWanted`): the tanner's rawhide, the store's seed or powder.
  errandWanted = way?.dataset.line || null;
  if (target) { target.focus(); target.click(); }
  errandWanted = null;
});
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
// A popup armed by a tap (triage D17) stays when the finger lifts or the focus moves to its Send; a press elsewhere puts it away.
$('#family-panel')?.addEventListener('pointerout', event => { const icon = event.target.closest('.panel-icon'); if (icon && !icon.contains(event.relatedTarget) && !panelTipFor?.armed && !panelTipFor?.pinned) hidePanelTip(); });
$('#family-panel')?.addEventListener('focusin', event => { const icon = event.target.closest('.panel-icon'); if (icon) showPanelTip(icon); else hidePanelTip(); });
$('#family-panel')?.addEventListener('focusout', event => { if (!event.relatedTarget?.closest?.('.panel-icon') && !event.relatedTarget?.closest?.('#panel-tip') && !panelTipFor?.armed && !panelTipFor?.pinned) hidePanelTip(); });
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
    if (!row.sickMark.hidden) paintSickMark(row.sickMark);
    for (const icon of row.icons.querySelectorAll('.panel-icon')) drawIcon(icon.querySelector('canvas'), icon.dataset.key, { drawSprite, spriteFrame });
  }
  if (window.__snapshot) renderFamilyPanel(window.__snapshot.world);
}
function renderSelection(world) {
  const panel = $('#selection'), chosen = selectedEntity(world);
  const household = world.household;
  // Who is chosen on the map, card or none (presentation evidence for the proofs: since 2026-09-29 the card opens only for a
  // matter, so it no longer says who a tap chose; scripts/support/navigation.mjs reads this).
  window.__selected = chosen && !selectionDismissed ? chosen.id : null;
  // Nobody to give orders to until the die is rolled: setting one of the founding four to
  // work would use up the family's roll on people it is about to replace.
  // The Host may look at anybody in the class, read only: every person on its map is `observed`, so no control below is offered.
  if (!chosen || (world.role === 'host' && !chosen.observed) || selectionDismissed || familyCache?.canRoll || rollState === 'rolling') { panel.hidden = true; return; }
  // Nor for somebody away with the family at the neighbours' farms (sim/courtship.mjs): there is nobody on the map to stand beside,
  // nothing they may be sent to, and their row says where they are. The card comes back when they are home.
  if (chosen.visiting) { panel.hidden = true; releaseCrowding(); return; }
  panel.hidden = false;
  panel.dataset.entityId = chosen.id;
  // The detailed controls - Going by, a neighbour's homestead - are the main person's (docs/FAMILY_PANEL.md §11.3), as the server holds it.
  const commands = chosen.id === (household?.mainId || household?.principalId) && !chosen.observed;
  const task = taskFor(world, chosen);
  $('#selection-name').textContent = chosen.name;
  // How they are, in a line: the Host's look only. On a student's page it is on the person's row (owner, 2026-09-29).
  $('#selection-state').hidden = !hostView(world);
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
  // The sickness in the server's words, and who has had the measles, which a family knew (sim/disease.mjs `sicknessShown`).
  if (!chosen.observed && world.role !== 'host') {
    if (chosen.sickness?.line) $('#selection-state').textContent += ` · ${chosen.sickness.line}`;
    if (chosen.hadMeasles) $('#selection-state').textContent += ' · has had the measles';
  }
  // The call panel below carries the question itself. This line is what is left for a
  // person who has been asked something that is not open to them to answer any more.
  const calling = task?.status === 'open' && task.options?.length && !chosen.observed && world.role !== 'host';
  $('#selection-task').hidden = !task || calling;
  $('#selection-task').textContent = task && !calling ? task.text : '';
  $('#action-subject').textContent = commands ? `Ask ${chosen.name} to…`
    : hostView(world) ? 'The teacher watches; only the family gives orders.'
    : chosen.observed ? `${chosen.name} is not one of your family.`
    : !(chosen.age < 10) && !['dead', 'captured'].includes(chosen.health?.condition) ? `${chosen.name} is not the main person: only the main person travels, rests and works about the place.`
    : `${chosen.name} follows the household's work.`;
  const running = world.status === 'running';
  // Work can be set out before the teacher begins. Nothing advances until then - the
  // server does not tick a lobby - so this is a family getting ready rather than a family
  // getting ahead, and every plan in the class starts on the same minute.
  const settable = running || world.status === 'lobby';
  // Somebody is standing in front of this person waiting to be spoken to. The button is
  // theirs and nobody else's: a rider stopped one named person, and that is who can listen.
  const waiting = world.encounter?.status === 'open' && world.encounter.listenerId === chosen.id;
  const listen = $('#listen-rider');
  listen.hidden = !waiting || world.role === 'host';
  listen.textContent = waiting ? `Listen to ${world.encounter.carrierName}` : 'Listen';
  renderCall(world, chosen, running); renderFlight(world, chosen, running); renderNurse(world, chosen, running);
  renderArmyControl(world, chosen, running);
  renderWork(world, chosen, settable);
  // Trading stays shut until the class is running, because the neighbour it is addressed
  // to may not have joined yet. An offer to an empty chair is not a trade.
  renderTrade(world, chosen, running);
  // Owner, 2026-09-29, of this card as it opened on every person chosen - a name, a line of how they are, a neighbour's homestead
  // and *Go there*: *"just gets in the way. I haven't found a good use for it. Let's remove it if it isn't necessary for
  // something later."* (docs/FAMILY_PANEL.md, amendment 2026-09-29). On a student's page it opens only for a matter it alone
  // holds: a question put to this person (a call, work that stopped to ask, the army's, Travis's riders, the road east), the
  // family's flight on whoever answers for it, who nurses somebody very sick, somebody serving or taken, a rider waiting on
  // them, or a trade with them. Choosing a person - portrait, star, map, roster - with none of those opens nothing: how they are
  // is on their row, a neighbour's homestead is the Neighbours list (the bar's *Go to a neighbour's homestead* opens it).
  // The Host's read-only look at anybody in the class is kept as it was.
  if (!hostView(world) && !selectionMatter(world)) { panel.hidden = true; delete panel.dataset.entityId; releaseCrowding(); return; }
  positionSelection(world, chosen);
}
/**
 * Whether the card has anything but its name on it: a section with something in it, or a rider waiting (see renderSelection).
 * Never on a page watching another family (sim/watching.mjs): the stylesheet takes every section of the card off that page
 * (`body[data-watching=true]`), so a section with words in it - the watched family's flight, sent to show where it goes - left
 * a card with a name and a close button and nothing else (the watching proof, 2026-09-30, once the early-leaving card of
 * 2026-09-29 put a question on a neighbour family that had heard the Alamo had fallen).
 */
function selectionMatter(world) {
  if (world?.watching) return false;
  const filled = selector => { const one = $(selector); return Boolean(one && !one.hidden && one.childElementCount); };
  return ['#selection-call', '#selection-flight', '#selection-nurse', '#selection-army', '#selection-work', '#selection-trade'].some(filled) || !$('#listen-rider')?.hidden;
}
/**
 * The boxes the card is placed among, measured once and again only when something about them changes size - never on every
 * frame. Placing the card read five boxes and wrote its position on every animation frame, which forced the browser to lay
 * the page out twelve times a second (about 150 ms a nine-second load on a Chromebook-slow CPU, docs/PERFORMANCE_LOAD.md).
 * ceiling: the family panel and the buttons along the bottom are measured when they resize, not when they move without
 * resizing; nothing moves them today.
 */
const placement = { boxes: null, observer: null, left: null, top: null, docked: null, cap: null, width: null };
/** The card's width as the stylesheet has it (`#selection` max-width), and the least it is narrowed to when short of room. */
const CARD_WIDTH = 260, CARD_LEAST = 190;
/**
 * The messages fold to their button while a card has no room beside them (`cardCrowding`, the card's person and the screen's
 * size): on a small window, with the guided start's strip over the top and a land chooser down the left, the card the student
 * has just asked for and the messages' invitation wanted the same corner (1024x600, the overlap proof, owner 2026-09-28). The
 * card is what the student pressed; the messages are one press away on their button, and open again when the card closes.
 * A student who opens them anyway has chosen (`crowdingRefused`), and they stay open.
 */
let cardCrowding = null, crowdingRefused = null;
function releaseCrowding() { if (!cardCrowding) return; cardCrowding = null; placement.boxes = null; renderMilitaryNotice(window.__snapshot?.world); }
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
    // "How it ended" and the walk-through stand along the bottom too (the overlap proof, owner 2026-09-28).
    controls: ['#journal-toggle', '#map-nav', '#sound-control', '#sound-panel:not([hidden])', '#ending-open', '#tutorial', '.panel-row[data-focused=true] .panel-icons'].map(selector => document.querySelector(selector)?.getBoundingClientRect()).filter(box => box?.height),
    // The guided start's strip is **overhead**, not underfoot: it stands across the top middle, so the card is kept
    // *below* it rather than above it. Counting it among the controls pushed the card up to the top of the screen and
    // straight under the strip, which is the one thing that has to stay readable while a step is running (2026-09-21).
    // Play Solo's Pause and Save, the connection line and the lines the page says (in the column above the family) too.
    overhead: ['#lesson', '#lesson-resume', '#connection', '#solo-controls', '#session', '#world', '#food', '#supplies', '#field-summary', '#error', '#save-fault', '#lifecycle'].map(selector => document.querySelector(selector)?.getBoundingClientRect()).filter(box => box?.height),
    // Panels that stand down the right-hand side - the messages, packing the wagon, a town scene, the house plot, the
    // walk-through - are a wall the card turns back from, as it turns back from the screen's edge. (The messages were a
    // roof until 2026-09-28, and a card under a long message had 76px left above the map's buttons at 1280x689.)
    beside: ['#military-notice', '#wagon-load', '#town-scene', '#house-plot', '#house-placement', '#tutorial'].map(selector => document.querySelector(selector)).filter(element => element && !element.hidden).map(element => element.getBoundingClientRect()).filter(box => box.height && box.left > innerWidth / 2),
    // And on the left, a land chooser standing beside the folded faces (docs/FAMILY_PANEL.md §12.13) is part of the family's side.
    aside: ['#site-choose', '#survey-choose'].map(selector => document.querySelector(selector)).filter(element => element && !element.hidden).map(element => element.getBoundingClientRect()).filter(box => box.height && box.right < innerWidth / 2 + 80),
  };
  if (!placement.observer && typeof ResizeObserver === 'function') {
    placement.observer = new ResizeObserver(() => { placement.boxes = null; });
    for (const element of [canvas, panel, family, $('#journal-toggle'), $('#map-nav'), $('#ending-open'), $('#tutorial'), $('#lesson'), $('#military-notice'), $('#solo-controls'), $('#wagon-load'), $('#town-scene'), $('#house-plot'), $('#house-placement'), $('#error'), $('#site-choose'), $('#survey-choose'), ...document.querySelectorAll('.panel-icons')]) if (element) placement.observer.observe(element);
    window.addEventListener('resize', () => { placement.boxes = null; });
  }
  return placement.boxes;
}
function positionSelection(world, chosen = selectedEntity(world)) {
  const panel = $('#selection');
  if (panel.hidden || !chosen) { releaseCrowding(); return; }
  // Beside the person on a wide screen; docked on a phone, where a floating card would
  // simply cover the family it is describing.
  const canvas = $('#world-map'), spot = drawnAt.get(chosen.id);
  const { rect, panelWidth, panelHeight, family: familyBox, controls, overhead, beside, aside } = placementBoxes();
  const docked = rect.width < 760 || !spot;
  if (docked !== placement.docked) {
    placement.docked = docked; placement.left = null; placement.top = null;
    if (docked) { panel.dataset.docked = 'true'; panel.style.left = ''; panel.style.top = ''; panel.style.maxHeight = ''; panel.style.width = ''; placement.cap = placement.width = null; } else { delete panel.dataset.docked; panel.style.bottom = ''; }
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
  const px = spot.x * scaleX, py = spot.y * scaleY, reach = spot.size * scaleY;
  // The room across: from the family's column (and a land chooser standing beside its faces) to the panels down the right.
  // And never over the family panel down the left, when there is room beside it (docs/FAMILY_PANEL.md §7).
  const wall = Math.min(rect.width, ...beside.map(box => box.left - rect.left));
  const leftmost = Math.max(familyBox?.width ? familyBox.right - rect.left : 0, ...aside.map(box => box.right - rect.left));
  const margin = leftmost && leftmost + CARD_LEAST + 16 < wall ? leftmost + 8 : 8;
  // Narrower, down to its least, when that is all the room there is (1024 wide, with a land chooser on one side and the
  // messages on the other) - written from the room, never from the card's own measured width, or it would read as fitting
  // once narrowed and widen again on the next frame.
  const gap = Math.round(wall - 8 - margin);
  const width = gap < CARD_WIDTH ? `${Math.max(CARD_LEAST, gap)}px` : '';
  if (width !== placement.width) { panel.style.width = width; placement.width = width; }
  const wide = width ? Math.max(CARD_LEAST, gap) : panelWidth;
  const right = px + 26, flip = right + wide > wall - 8;
  let at = Math.round(Math.max(margin, flip ? px - wide - 26 : right));
  const across = box => at < box.right - rect.left && box.left - rect.left < at + wide;
  // The ability bar stands in the bottom middle, and the person the card is about is usually just above it, where the camera
  // keeps them: a card that would reach into the bar's side by a little steps off it sideways rather than standing on its
  // icons (the overlap proof, owner 2026-09-28: 30px of the bar's right-hand icons were under the card at 1366x768).
  for (const box of controls) {
    if (!across(box)) continue;
    const off = flip ? Math.round(box.left - rect.left - 8 - wide) : Math.round(box.right - rect.left + 8);
    if (Math.abs(off - at) <= wide / 2 && off >= margin && off + wide <= wall - 8) at = off;
  }
  const left = `${at}px`;
  // Never down over the row of buttons along the bottom: clamped to the canvas alone, a person standing low on a wide
  // screen put this card over Family, Follow and Land, and the journal could not be opened (found 2026-09-14). Only what
  // stands below the card itself counts, so a card beside the bar is not held up by the bar.
  const floor = Math.min(rect.height - 8, ...controls.filter(across).map(box => box.top - rect.top));
  // And never up under the guided start's strip: only the part of it the card would actually stand in front of counts, so
  // a card out at the right edge is not pushed down for a strip that ends in the middle.
  const roof = Math.max(8, ...overhead.filter(across).map(box => box.bottom - rect.top + 8));
  // And never on the person it is about: on a narrow screen, with the family's column on one side and a panel on the other,
  // beside them can be where they stand. Then it goes above them, or below them, whichever has the room.
  let from = roof, to = floor - 8, pinned = null;
  if (at < px + reach * .4 && at + wide > px - reach * .4) {
    const head = py - reach * .6 - 8, feet = py + reach * .55 + 8;
    const above = Math.min(to, head) - from, below = to - Math.max(from, feet);
    if (above >= Math.min(panelHeight, 220) || above >= below) { to = Math.min(to, head); pinned = 'above'; } else { from = Math.max(from, feet); pinned = 'below'; }
  }
  // Between the two it is never taller than the room there is: it scrolls inside itself, as it already could, rather than
  // running down over the map's buttons or off the foot of a short window (1366x657, a Chromebook with the browser's bars:
  // the overlap proof, 2026-09-28). Written every time and not only when short, or the capped height would read as fitting
  // and the cap would come off again on the next frame.
  const crowd = `${chosen.id}:${innerWidth}x${innerHeight}`;
  if (cardCrowding && cardCrowding !== crowd) releaseCrowding();
  const notice = $('#military-notice');
  if (!cardCrowding && crowdingRefused !== crowd && to - from < Math.min(panelHeight, 220) && notice && !notice.hidden && !$('#military-message')?.hidden) {
    cardCrowding = crowd; placement.boxes = null; renderMilitaryNotice(world);
  }
  const room = Math.max(120, Math.round(to - from));
  const cap = `min(76vh, 640px, ${room}px)`;
  if (cap !== placement.cap) { panel.style.maxHeight = cap; placement.cap = cap; }
  const tall = Math.min(panelHeight, room);
  const wanted = pinned === 'above' ? to - tall : pinned === 'below' ? from : py - tall / 2;
  // Never off the foot of the screen, whatever else gives.
  const top = `${Math.round(Math.min(rect.height - 8 - tall, Math.max(from, Math.min(to - tall, wanted))))}px`;
  // Written only when it changes: a style written every frame is a layout every frame.
  const moved = left !== placement.left || top !== placement.top;
  if (left !== placement.left) { panel.style.left = left; placement.left = left; }
  if (top !== placement.top) { panel.style.top = top; placement.top = top; }
  // A tip at first meeting keeps clear of the card wherever the card goes (the overlap proof, 2026-09-28).
  if (moved && tipShowing && !$('#tip')?.hidden) placeTip($('#tip'));
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
  // No die for a family a late student took over from the computer (owner, 2026-09-30): three steps, and said why.
  $('#surname-step').textContent = family.joinedBegun ? 'STEP 1 OF 3' : 'STEP 2 OF 4';
  $('#surname-begun').hidden = !family.joinedBegun;
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
/**
 * The die never hangs (classroom, 2026-09-30: "student tried to join late and it was stuck on the rolling for the family part.
 * wouldn't let him past."). A throw the class has not answered in this long is given up, said on the card, and the family asked
 * for again; and a refusal is said on the card itself - `say` writes to the world's own line, which is behind the curtain - and
 * the family fetched again at once, so a die the family can no longer throw is not offered and the page goes on.
 */
const ROLL_WAIT_MS = 12000;
let rollWatch = null, rollProblem = '';
async function refreshFamily() {
  forgetFamily();
  try {
    const result = await api('/api/family');
    if (result?.family) { familyCache = result.family; familyCacheId = result.mapId; }
  } catch { /* the next tick asks again (`ensureFamily`) */ }
  if (window.__snapshot) render(window.__snapshot);
}
function stopTumble() { clearInterval(tumble); tumble = null; $('#family-die')?.classList.remove('rolling'); $('#means-die')?.classList.remove('rolling'); }
/**
 * The second die (owner, 2026-09-25: "introduce rolling for starting wealth"; sim/means.mjs): thrown by the same press in a class
 * made since, and stopped on the server's number, with what it gave in the server's own words - the band, what the family comes
 * with, and who of them rides and walks. A class made before has one die, as it always had.
 */
function renderMeansDie(family) {
  const shown = Boolean(family?.meansDie || family?.means);
  $('#family-roll').dataset.means = String(shown);
  $('#means-roll-card').hidden = !shown;
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
  const setRollScene = visible => { const curtain = $('#creation'); if (curtain) curtain.dataset.rollVisible = String(visible); };
  const family = familyCache;
  if (world.role === 'host' || !world.householdId || !family) { panel.hidden = true; setRollScene(false); return; }
  if (rollState === 'rolling' && family.roll && Date.now() - rollStarted >= 900) {
    stopTumble();
    rollState = 'rolled';
  }
  // A family the server rolled as a late student joined (`rolledAtJoin`) is still thrown here; whether it is still to be thrown
  // is creationStep's, below.
  if ((rollState === 'idle' && !family.canRoll && !family.rolledAtJoin) || rollState === 'done') { panel.hidden = true; setRollScene(false); return; }
  // Not before the title screen has been answered (public/creation.js); once the die is in the air it stays until the family
  // has been met, which is what carries the page from the roll to the last name.
  if (rollState === 'idle' && creationStep(world, family) !== 'roll') { panel.hidden = true; setRollScene(false); return; }
  panel.hidden = false;
  setRollScene(true);
  panel.dataset.rollState = rollState;
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
    $('#family-roll-result').textContent = rollState === 'rolling' ? 'Rolling\u2026' : rollProblem;
    button.textContent = 'Roll the die';
    button.disabled = rollState === 'rolling';
  }
}
$('#roll-family')?.addEventListener('click', async () => {
  if (rollState === 'rolled') {
    rollState = 'done';
    metFamily();
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
  rollProblem = '';
  if (window.__snapshot) renderFamilyRoll(window.__snapshot.world);
  // Thrown already, by the server, as this student joined late (server/app.mjs `/api/join`): the die lands on its number and
  // there is nothing to ask the class - which also holds while the teacher has it paused.
  if (!familyCache?.canRoll && familyCache?.roll) {
    setTimeout(() => { if (window.__snapshot) render(window.__snapshot); }, 950);
    return;
  }
  clearTimeout(rollWatch);
  rollWatch = setTimeout(() => {
    if (rollState !== 'rolling' || familyCache?.roll) return;
    stopTumble(); rollState = 'idle';
    rollProblem = 'The die did not come back from the class. Press Roll the die again.';
    refreshFamily();
  }, ROLL_WAIT_MS);
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'roll-family' });
    // Asked for at once rather than on the next tick, which a paused class does not send.
    refreshFamily();
    // Let the dice tumble for a moment even when the server answers at once.
    setTimeout(() => { if (window.__snapshot) render(window.__snapshot); }, 950);
  } catch (error) {
    clearTimeout(rollWatch);
    stopTumble(); rollState = 'idle';
    rollProblem = error.message;
    say(error.message);
    // The family may have changed under the page while the die was offered - it had begun, or was rolled: asked for again, so a
    // die it can no longer throw is not offered and the page goes on to what comes next.
    refreshFamily();
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
  // A family of the poorest means packs a cart (sim/means.mjs), and the server says so (`wagon.vehicle`); one that is hard up
  // packs its ox, and carries its food itself (`'packs'`, owner 2026-09-25: "it should be possible to start with no wagon").
  // A Tejano family's cart is its carreta (sim/wagon.mjs `vehicleWord`), and is packed as the cart is.
  const vehicle = wagon.vehicle === 'cart' || wagon.vehicle === 'carreta' ? wagon.vehicle : wagon.vehicle === 'packs' ? 'packs' : wagon.wagons ? 'wagons' : 'wagon';
  reopen.textContent = `Repack the ${vehicle === 'packs' ? "ox's packs" : vehicle} (${wagon.used} of ${space})`;
  if (!wagonPacking) return;
  const choice = world.land?.stockChoice;
  const shape = JSON.stringify([household.load, wagon, choice, household.stock]);
  if (shape === wagonShown) return;
  wagonShown = shape;
  // A family fitted out with more than one wagon packs them together, and the server says how many (sim/wagon.mjs).
  $('#wagon-room').textContent = `${wagon.wagons ? `${wagon.wagons} wagons: ` : vehicle === 'cart' ? 'The cart: ' : vehicle === 'carreta' ? 'The carreta: ' : vehicle === 'packs' ? "No wagon or cart. The ox's packs: " : ''}${wagon.used} of ${space} space filled, ${space - wagon.used} left.`;
  $('#wagon-load-title').textContent = vehicle === 'cart' ? 'Pack the cart' : vehicle === 'carreta' ? 'Pack the carreta' : vehicle === 'packs' ? "Pack the ox's packs" : 'Pack the wagon';
  // What is packed, in the words the panel's other lines use: the wagon, the wagons, the cart, or the ox's packs.
  const packed = vehicle === 'packs' ? "the ox's packs" : `the ${vehicle}`;
  if ($('#wagon-when')) $('#wagon-when').textContent = `You can change all of this until your teacher presses Start. After that ${packed} ${['packs', 'wagons'].includes(vehicle) ? 'are' : 'is'} packed.`;
  // What the family carries on foot besides (sim/means.mjs `ARRIVAL_DAYS`), in the server's number: it is not the load's to change.
  $('#wagon-packs').hidden = !wagon.packs;
  $('#wagon-packs').textContent = !wagon.packs ? '' : vehicle === 'packs'
    ? `The family carries its food itself: ${wagon.packs} food on foot, in sacks and bundles.`
    : `Besides the ${vehicle}, the family carries ${wagon.packs} food on foot, in sacks and bundles.`;
  // Driving stock in: what each answer brings, in acres, animals and wagon space, before it is chosen (FIC-GONZ-008).
  // The herd itself was built on 2026-09-20 (docs/STOCK.md) and this panel went on offering only the acres and the wagon
  // cost, so the largest thing the choice did was never said where the choice was made. The numbers are the server's
  // (`stockChoice.herd`), never written here.
  $('#wagon-stock').hidden = !choice;
  if (choice) {
    $('#stock-no-text').textContent = `No stock. The family holds a labor of land, ${choice.laborAcres} acres, and brings no animals.`;
    const herd = choice.herd ? ` The family arrives with ${choice.herd.cattle} cattle and ${choice.herd.hogs} hogs, which feed themselves on the range and feed the family.` : '';
    $('#stock-yes-text').textContent = `Drive cattle and hogs in. The family holds a league and a labor, ${choice.stockAcres.toLocaleString('en-US')} acres - about ${Math.round(choice.stockAcres / choice.laborAcres)} times as much land - and the herd's keep takes ${choice.space} spaces of ${packed}.${herd}`;
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
  // In a class the teacher starts it, and the server is told the family is packed: the Host's row marks it ready once it is
  // rolled, named and packed too (owner, 2026-09-29: "Show name + ready"; sim/wagon.mjs `donePacking`).
  else if (lobby) {
    try { await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'done-packing' }); }
    catch (error) { say(error.message); }
  }
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
/**
 * The house's card (owner, 2026-09-29: "The choosing of a house button is hard to miss ... Let's do the same thing with the house
 * button"): the story cards' frame in moss green, at the head of the family's column under the neighbours' card, where the plain
 * "Choose a house" pill stood above it. Shown exactly when the pill was, and its button (`#house-open`, the pill's own id) does what
 * the pill did. It asks, glowing, until a house is chosen; then it is quiet - the icon and "Your house" - and stays, as the pill
 * did, to open the plan again. There is no "Not now": a family must have a roof, and the card stops asking the moment it has one
 * chosen. While the house site is still to be chosen the card is not shown, as the pill was not: the land chooser is open then
 * and its own words say the house comes after the place (`renderSite`). The first turn of this showed the card waiting, as a
 * greyed icon in the folded column, and at 1024x600 with a refusal on the screen the column overflowed and scrolled the Hide
 * names button out from under the land chooser (`npm run test:overlap`, guided-start-refused).
 */
function houseCard({ shown, quiet = false, title = 'Choose your house', note = '', label = 'Choose a house' }) {
  const card = $('#house-card'), open = $('#house-open');
  if (!card) return;
  if (card.hidden !== !shown) { card.hidden = !shown; queueColumnFit(); }
  // The button's own `hidden` follows the card, as the pill's did: what reads `#house-open` (the tips, the guided start) reads it.
  if (open.hidden !== !shown) open.hidden = !shown;
  if (!shown) return;
  setData(card, 'quiet', String(quiet));
  const text = (selector, words) => { const node = $(selector); if (node.textContent !== words) node.textContent = words; };
  text('#house-card-title', title);
  text('#house-card-note', note);
  if (open.textContent !== label) open.textContent = label;
  const icon = $('#house-card-icon');
  const says = quiet ? label : title;
  if (icon.title !== says) { icon.title = says; icon.setAttribute('aria-label', says); }
  if (card.title !== (quiet ? '' : note)) card.title = quiet ? '' : note;
  // The family panel's own icon for building a house (Astra's), drawn again until its sheet has come.
  if (icon.dataset.drawn !== 'true') {
    const canvas = $('#house-card-canvas'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    icon.dataset.drawn = String(Boolean(drawSprite(ctx, 'icon-build-house', canvas.width / 2, canvas.height * 0.92, canvas.height * 0.86)));
  }
}
function renderHousePlan(world) {
  const panel = $('#house-plan');
  if (!panel) return;
  // A family that plans its house piece by piece has the house plot instead (public/house-plot.js), open while it builds.
  if (plotted(world, plotCatalogue)) {
    panel.hidden = true;
    const available = !familyCache?.canRoll && !['rolling', 'rolled'].includes(rollState) && !wagonOpen;
    const has = Boolean(world.land.house);
    houseCard({ shown: available && !housePlanOpen, quiet: has, title: has ? 'Your house' : 'Choose your house', label: has ? 'Your house' : 'Choose a house',
      note: 'Choose a plan and where on your land it stands, then set the family to building it. Until it stands, the family camps.' });
    renderHousePlot(world, plotCatalogue, { open: available && housePlanOpen, drawSprite, spriteFrame, place: beginHousePlacement, send: command => api('/api/command', { ...command, id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}` }), rerender: () => window.__snapshot && render(window.__snapshot) });
    return;
  }
  renderHousePlot(world, plotCatalogue || { pieces: [], plans: [] }, { open: false });
  const choices = world.land?.choices;
  const available = Boolean(choices && houseCatalogue && world.role !== 'host' && !familyCache?.canRoll && !['rolling', 'rolled'].includes(rollState) && !wagonOpen);
  panel.hidden = !(available && housePlanOpen);
  const chosen = available && world.land.house?.layout;
  houseCard({ shown: available && !housePlanOpen, quiet: Boolean(chosen), title: chosen ? 'Your house' : 'Choose your house',
    label: chosen ? `House: ${houseCatalogue.get(chosen)?.name || chosen}` : 'Choose a house',
    note: 'Choose one of the houses, then set the family to “Work on the house”. Until it stands, the family camps.' });
  if (!available) return;
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
// Opened by a plot tapped on the map (or its chip on the field line) rather than by a work icon (owner, 2026-09-30): the chooser then
// says what the plot is now and offers its work, and another plot tapped is looked at for its own. `plotHover` is the plot lit under
// a mouse; `plotFocus` takes the keyboard to the chooser's first button once the plot is looked at.
let plotFromMap = false, plotHover = null, plotFocus = false, plotWhoKey = '';
/** The family's own plot under a point of the map (world miles), from its land line; null off every plot, and on the Host's map. */
function ownPlotAt(world, at) {
  if (world.role === 'host' || world.watching || !world.household) return null;
  return (world.land?.plots || []).find(plot => Math.abs(at.x - plot.x) <= PLOT_SIDE / 2 && Math.abs(at.y - plot.y) <= PLOT_SIDE / 2) || null;
}
/**
 * The plot chooser opened on one plot of the family's field, with no work chosen first (owner, 2026-09-30: "let me click on the fields
 * so i can select what is grown there"): planting for a bare plot, its crop and readiness for a growing one, bringing it in for a
 * ripe one, clearing for a staked one. Who goes is the person whose bar is shown, else the next the server would send
 * (public/family-panel.js `plotHand`), and the chooser can change it. Returns false when there is nobody to send at all.
 */
function openPlotChooser(world, plot, { focus = false } = {}) {
  const job = plotJobFor(plot);
  if (!job) return false;
  const who = plotHand({ job: plotWorkFor(plot) || job, work: world.work || {}, barId: panelBarId, mainId: focusedId, order: panelOrderIds });
  if (!who) return false;
  surveyFor = who; plotJob = job; plotFromMap = true; plotPick = null; plotFocus = focus;
  selectedId = null; selectionDismissed = true; hidePanelTip();
  lookAtPlot({ x: plot.x, y: plot.y });
  return true;
}
/** The plot the chooser is looking at, as the family's land line has it now, or null. */
const pickedPlot = world => (plotPick?.facts?.plotId && (world.land?.plots || []).find(plot => plot.id === plotPick.facts.plotId)) || null;
const CROP_WORD = { corn: 'Corn', cotton: 'Cotton' };
const PLOT_JOB_WORDS = {
  'survey-plot': { title: name => `Where ${name} surveys`, hint: 'Tap a place on your land, inside the dashed line, to look at ten acres there.', send: 'Survey it' },
  'clear-plot': { title: name => `Which plot ${name} clears`, hint: 'Tap one of your staked plots to look at the clearing it wants.', send: 'Clear it' },
  'fence-plot': { title: name => `Which plot ${name} fences`, hint: 'Tap one of your cleared plots to rail it in.', send: 'Fence it' },
  'fell-trees': { title: name => `Where ${name} fells`, hint: 'Tap timber on your land, inside the dashed line, to see what stands there to fell.', send: 'Fell there' },
  'hunt-land': { title: name => `Where ${name} hunts`, hint: 'Tap a place on your land, inside the dashed line, to see what game there is there.', send: 'Hunt there' },
  // A path cut out to a place (owner, 2026-10-02; sim/land-paths.mjs): the line it would follow is drawn while the student looks.
  'cut-path': { title: name => `Where ${name} cuts a path to`, hint: 'Tap a place on your land to see the path that would be cut to it from the house.', send: 'Cut the path' },
  // Each plot its own crop (owner, 2026-09-30): every bare plot unless one is tapped, and the crop is the button pressed.
  'plant-field': { title: name => `What ${name} plants`, hint: '', send: '' },
};
/** The family's bare cleared plots, as its own land line shows them (sim/survey.mjs `plotProjection`). */
const barePlotsShown = world => (world.land?.plots || []).filter(plot => plot.state === 'cleared' && !plot.sown);
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
  if (panel.hidden) { if (!person) { surveyFor = null; plotPick = null; plotFromMap = false; } delete $('#survey-suggested').dataset.key; return; }
  const facts = plotPick?.facts, words = PLOT_JOB_WORDS[plotJob];
  // A plot tapped on the map: what it is now - bare, growing, ripe or staked (owner, 2026-09-30).
  const tapped = plotFromMap ? pickedPlot(world) : null, stage = plotStage(tapped);
  const growingCrop = ['growing', 'ripe'].includes(stage) ? tapped.crop || 'corn' : null;
  $('#survey-eyebrow').textContent = growingCrop ? 'FIELD' : plotJob === 'survey-plot' ? 'SURVEY' : plotJob === 'clear-plot' ? 'CLEARING' : plotJob === 'hunt-land' ? 'HUNTING' : plotJob === 'fell-trees' ? 'FELLING' : plotJob === 'cut-path' ? 'PATH' : plotJob === 'plant-field' ? 'PLANTING' : 'FENCING';
  $('#survey-title').textContent = growingCrop ? `${CROP_WORD[growingCrop] || growingCrop} ${stage === 'ripe' ? 'ripe' : 'growing'}` : words.title(person.name);
  // Survey's facts say what the clearing would be; a plot's words already carry it. A refusal still names the plot.
  const surveyWork = plotJob === 'survey-plot' && facts?.spells ? ` Clearing it would be ${facts.spells} spells of work.` : '';
  // Planting with nothing tapped is every bare plot (owner, 2026-09-30): said, and the crop buttons plant them all.
  const planting = plotJob === 'plant-field', bare = planting ? barePlotsShown(world).length : 0;
  const hint = planting ? (bare ? `Every bare plot: ${bare === 1 ? 'one plot' : `${bare} plots`}, corn to eat or cotton to sell. Or tap one plot on the map to plant only that one.` : 'Every cleared plot has a crop in it.') : words.hint;
  $('#survey-text').textContent = !plotPick ? hint
    : !facts ? 'Looking the ground over…' : facts.can ? `${facts.words}${surveyWork}`
    // A growing or ripe plot's own words already say what is in it and when; the refusal to plant it would say it twice.
    : growingCrop && facts.words ? facts.words : [facts.words, facts.why].filter(Boolean).join(' ');
  $('#survey-send').textContent = words.send;
  $('#survey-send').hidden = planting || !facts?.can;
  $('#survey-send').disabled = plotSendPending;
  $('#plant-crops').hidden = !planting || (plotPick ? !facts?.can : !bare);
  // Each crop's seed on its own button (owner, 2026-09-30): a plot's, or every bare plot's together, from the chore catalogue; amber
  // when the house has less. The server still decides, and plants what the seed will when it is short (sim/chores.mjs `sowSeed`).
  const seeds = choreCache?.get('plant-field')?.seeds || null, plotsToSow = plotPick ? 1 : bare, inHouse = Number(world.household?.resources?.seed || 0);
  for (const button of document.querySelectorAll('#plant-crops .plant-crop')) {
    button.disabled = plotSendPending;
    const each = seeds?.[button.dataset.crop], cost = Number.isFinite(each) ? each * Math.max(1, plotsToSow) : null;
    const label = `Plant ${button.dataset.crop}`, seedWords = cost === null ? '' : `${cost} seed`;
    if (button.dataset.label !== `${label}|${seedWords}`) {
      button.dataset.label = `${label}|${seedWords}`;
      button.replaceChildren(document.createTextNode(label), ...(seedWords ? [element('small', seedWords, 'plant-seed')] : []));
    }
    setData(button, 'short', String(cost !== null && inHouse < cost));
  }
  $('#plant-all').hidden = !planting || !plotPick || bare < 2;
  // A ripe plot tapped: bring the crop in, as the harvest icon does (every ripe plot, by whoever is sent).
  const harvest = $('#plot-harvest');
  if (harvest) {
    harvest.hidden = !(stage === 'ripe' && facts);
    harvest.dataset.entityId = surveyFor || '';
    harvest.disabled = plotSendPending;
  }
  renderPlotWho(world, stage);
  // A cleared plot with no sound fence, tapped on the map: Fence it, beside whatever else it offers (owner, 2026-09-30, "Add 'Fence
  // it'"). Sent to the person chosen when the server would send them on fencing, else the next who may (`plotHand`).
  const fence = $('#plot-fence');
  if (fence) {
    const unfenced = Boolean(tapped && tapped.state === 'cleared' && tapped.fence !== 'sound' && facts);
    const fencer = unfenced ? plotHand({ job: 'fence-plot', work: world.work || {}, barId: surveyFor, mainId: focusedId, order: panelOrderIds }) : null;
    fence.hidden = !unfenced;
    fence.dataset.entityId = fencer || '';
    fence.disabled = plotSendPending;
  }
  const plots = JSON.stringify((world.land?.plots || []).map(plot => [plot.id, plot.state, plot.fence || '', plot.sown ? plot.crop || 'sown' : '']));
  // Suggested places are bare plots to plant and staked ones to clear: not shown under a growing or a ripe plot.
  renderSuggested($('#survey-suggested'), growingCrop ? 'none' : plotJob, `${plotJob}:${surveyFor}:${window.__snapshot?.sessionId}:${plots}`, plotPick?.point, lookAtPlot);
  // Opened from the keyboard (the field line's chip): to the first thing to press, once the plot has been looked at.
  if (plotFocus && facts) {
    plotFocus = false;
    [...panel.querySelectorAll('#plant-crops .plant-crop, #plot-harvest, #plot-fence, #survey-send, #survey-cancel')].find(one => !one.hidden && !one.closest('[hidden]'))?.focus();
  }
}
/**
 * Who a plot tapped on the map goes to, and the others who could (owner, 2026-09-30): a list of the family the server would send on
 * the plot's work now, in the panel's order, the one chosen first. Only for a plot opened from the map with work to send.
 */
function renderPlotWho(world, stage) {
  const line = $('#plot-who-line'), select = $('#plot-who');
  if (!line || !select) return;
  const tapped = plotFromMap ? pickedPlot(world) : null;
  const work = tapped && plotWorkFor(tapped);
  const hands = work ? plotHands({ job: work, work: world.work || {}, order: panelOrderIds }) : [];
  const ids = surveyFor && !hands.includes(surveyFor) ? [surveyFor, ...hands] : hands;
  line.hidden = !work || stage === 'growing' || !ids.length;
  if (line.hidden) return;
  const named = id => world.entities.find(entity => entity.id === id)?.name || id;
  const key = JSON.stringify(ids.map(id => [id, named(id)]));
  if (plotWhoKey !== key) {
    plotWhoKey = key;
    select.replaceChildren(...ids.map(id => { const option = element('option', named(id)); option.value = id; return option; }));
  }
  if (select.value !== surveyFor) select.value = surveyFor;
}
$('#plot-fence')?.addEventListener('click', async () => {
  const button = $('#plot-fence');
  if (plotSendPending || !plotPick || !button.dataset.entityId) return;
  plotSendPending = true; $('#survey-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'fence-plot', entityId: button.dataset.entityId, x: +plotPick.point.x.toFixed(3), y: +plotPick.point.y.toFixed(3) });
    surveyFor = null; plotPick = null; plotFromMap = false;
  } catch (error) { $('#survey-note').textContent = error.message; }
  finally { plotSendPending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#plot-who')?.addEventListener('change', event => { if (event.target.value) { surveyFor = event.target.value; if (window.__snapshot) render(window.__snapshot); } });
// Bringing in a ripe plot tapped on the map: the button carries the harvest order and the one dispatcher sends it; the chooser closes.
$('#plot-harvest')?.addEventListener('click', () => { setTimeout(() => { surveyFor = null; plotPick = null; plotFromMap = false; if (window.__snapshot) render(window.__snapshot); }); });
$('#survey-send')?.addEventListener('click', async () => {
  if (!plotPick?.facts?.can || plotSendPending) return;
  plotSendPending = true; $('#survey-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: plotJob, entityId: surveyFor, x: +plotPick.point.x.toFixed(3), y: +plotPick.point.y.toFixed(3) });
    surveyFor = null; plotPick = null; plotFromMap = false;
  } catch (error) { $('#survey-note').textContent = error.message; }
  finally { plotSendPending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#survey-cancel')?.addEventListener('click', () => { surveyFor = null; plotPick = null; plotFromMap = false; if (window.__snapshot) render(window.__snapshot); });
// The crop for the plot tapped, or for every bare plot (owner, 2026-09-30; sim/world.mjs `plant-field`). The server decides.
for (const button of document.querySelectorAll('#plant-crops .plant-crop')) button.addEventListener('click', async () => {
  if (plotSendPending || plotJob !== 'plant-field' || (plotPick && !plotPick.facts?.can)) return;
  plotSendPending = true; $('#survey-note').textContent = '';
  try {
    await api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'plant-field', entityId: surveyFor, crop: button.dataset.crop,
      ...(plotPick && { x: +plotPick.point.x.toFixed(3), y: +plotPick.point.y.toFixed(3) }) });
    surveyFor = null; plotPick = null; plotFromMap = false;
  } catch (error) { $('#survey-note').textContent = error.message; }
  finally { plotSendPending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#plant-all')?.addEventListener('click', () => { plotPick = null; $('#survey-note').textContent = ''; if (window.__snapshot) render(window.__snapshot); });
/**
 * Suggested places (triage 2.13, classroom audit S8, 2026-09-29): up to three buttons under the panel's words, from the server
 * (`/api/suggest`, sim/suggest.mjs), for the house site, ten acres to survey and the plot to clear or fence. Choosing a place was
 * a tap on the map and nothing else, so a student with only a keyboard could not farm, and a touch screen or a slow reader had
 * to hunt the map for somewhere the server would take. Pressing one moves the map there and looks at it exactly as a tap there
 * does; the panel's own button still sends it, and the server decides both times. Asked for once each time a choice opens (the
 * `key`), never on a tick. On the map itself the arrow keys move it and Enter looks at the spot in its middle (`tapAt`).
 */
let suggested = { key: '', places: [] }, suggestedAsking = '', suggestedFocus = false;
const SUGGESTED_JOBS = new Set(['site', 'survey-plot', 'clear-plot', 'fence-plot', 'plant-field']);
async function askSuggested(job, key) {
  suggestedAsking = key;
  let places = [];
  try { ({ places } = await api(`/api/suggest?job=${encodeURIComponent(job)}`)); } catch { places = []; }
  if (suggestedAsking !== key) return;
  suggestedAsking = '';
  suggested = { key, places: places || [] };
  if (window.__snapshot) render(window.__snapshot);
}
/** The map's middle on a place, at the zoom it has, as a student panning there would leave it. */
function centreMapOn(point) {
  const snapshot = window.__snapshot; if (!snapshot) return;
  const view = cameraFor(snapshot.world, $('#world-map'));
  stopWatching();
  manualView = { cx: point.x, cy: point.y, scale: view.scale };
  requestMapDraw();
}
function renderSuggested(root, job, key, picked, look) {
  if (!root) return;
  if (!SUGGESTED_JOBS.has(job)) { root.hidden = true; suggestedFocus = false; return; }
  // Asked for, and until the answer comes nothing is offered: the last choice's places are never shown under this one's.
  if (suggested.key !== key) { if (suggestedAsking !== key) askSuggested(job, key); root.hidden = true; if (root.childElementCount) root.replaceChildren(); delete root.dataset.key; return; }
  const places = suggested.places;
  root.hidden = !places.length;
  if (root.dataset.key !== key) {
    root.dataset.key = key;
    const focused = document.activeElement?.closest?.('.suggested') === root ? document.activeElement.dataset.index : null;
    root.replaceChildren(element('p', 'Suggested places', 'suggested-label'), ...places.map((place, index) => {
      const button = element('button', place.label);
      button.type = 'button'; button.dataset.index = String(index);
      if (place.words) button.title = place.words;
      button.addEventListener('click', () => { centreMapOn(place); look({ x: place.x, y: place.y }); });
      return button;
    }), element('p', 'Or move the map with the arrow keys and press Enter for the spot in its middle.', 'suggested-label'));
    if (focused !== null) root.querySelector(`button[data-index="${focused}"]`)?.focus();
    // The keyboard is taken to the first place when the student opened the choice from a work button (`survey-start`), or when
    // nothing else has it (the house site's panel opens by itself as the wagon comes in): never from under a student typing.
    else if (places.length && (suggestedFocus || [document.body, $('#world-map'), null].includes(document.activeElement))) root.querySelector('button')?.focus();
    suggestedFocus = false;
  }
  for (const button of root.querySelectorAll('button')) {
    const place = places[Number(button.dataset.index)];
    const on = String(Boolean(picked && place && Math.abs(picked.x - place.x) < 1e-6 && Math.abs(picked.y - place.y) < 1e-6));
    if (button.getAttribute('aria-pressed') !== on) button.setAttribute('aria-pressed', on);
  }
}
function renderSite(world) {
  const panel = $('#site-choose');
  if (!panel) return;
  const choosing = world.land?.choosingSite;
  panel.hidden = !choosing || world.role === 'host';
  if (panel.hidden) { sitePick = null; delete $('#site-suggested').dataset.key; return; }
  // The house waits for its site, and these words say so: its card comes when the place is chosen (`houseCard`).
  houseCard({ shown: false });
  const facts = sitePick?.facts;
  $('#site-text').textContent = !choosing.can ? choosing.why
    : !sitePick ? 'Tap a place on your land, inside the dashed line, to look it over. Once the place is chosen, you choose the house.'
    : !facts ? 'Looking the place over…'
    : facts.can ? facts.words : facts.why;
  $('#site-build').hidden = !facts?.can;
  $('#site-build').disabled = siteSetPending;
  if (choosing.can) renderSuggested($('#site-suggested'), 'site', `site:${window.__snapshot?.sessionId}:${window.__snapshot?.mapRevision || 0}`, sitePick?.point, lookAtSite);
  else $('#site-suggested').hidden = true;
}
/**
 * The house site's chooser folded while the family's land is off the screen, and open again once it is back (the gonzales-town
 * proof, 2026-09-30). It opens by itself as the wagon comes in, wherever the student is looking; since the suggested places
 * (triage 2.13) it stood 340 px tall beside the family's faces, and a student watching Gonzales could not click the cannon's men
 * under it. Measured on every frame drawn, from the wagon's mark the server sends: the camera moves between snapshots.
 * ceiling: the land counts as on the screen when its mark is; a land whose edge alone is in view folds the chooser.
 */
function foldSiteChooser(world, camera, canvas) {
  const panel = $('#site-choose');
  if (!panel || panel.hidden) return;
  const mark = world.land?.choosingSite?.mark;
  const at = mark && camera.toScreen(mark);
  const away = String(Boolean(at) && (at.x < 0 || at.y < 0 || at.x > canvas.width || at.y > canvas.height));
  if (panel.dataset.away !== away) panel.dataset.away = away;
}
$('#site-go')?.addEventListener('click', () => $('#map-nav [data-view=home]')?.click());
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
// The card's icon is the same button, for a column folded to its faces, where the icon is all of the card there is.
$('#house-card-icon')?.addEventListener('click', () => { if (!$('#house-open').disabled) $('#house-open').click(); });
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
/** What a paused game says to its player: a class waits for its teacher; Play Solo's player resumes it themselves. */
function pausedWords() {
  return window.__snapshot?.solo ? 'The game is paused. Press Resume, top right, to go on.' : 'The class is paused. Work continues when the teacher resumes.';
}
function guideLesson(world) {
  const lesson = lessonShowing(world), help = $('#lesson-help'), action = $('#lesson-action');
  lessonTarget = null;
  action.hidden = true;
  help.textContent = '';
  if (!lesson) return;
  const reveal = (target, label, text) => {
    lessonTarget = target; action.textContent = label; action.hidden = false; help.textContent = text;
  };
  if (world.status === 'paused') { help.textContent = pausedWords(); return; }
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
  help.textContent = world.status === 'paused' ? pausedWords()
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
/**
 * The old skippable walk-through ("New to this?") is not offered either (owner, 2026-09-28: "The starting tutorial needs to be
 * removed for now. We'll redo it from scratch later."). It was offered to every family with no guided start, which with the
 * guided start switched off (sim/lesson.mjs `LESSON_ENABLED`) would have been every family. The tips at first meeting
 * (public/tips.js) are the only guidance a new student is given now.
 * ceiling: off for everybody; the owner's rework of the tutorial replaces both.
 */
const OLD_WALKTHROUGH_OFFERED = false;
function renderTutorial(world) {
  const panel = $('#tutorial');
  if (!OLD_WALKTHROUGH_OFFERED) { if (panel) panel.hidden = true; return; }
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
let militarySession = null, militarySeen = new Set(), militaryCollapsed = false, militarySelected = null, militaryDeadline = null, militaryLeftTo = 'to answer';
/** The card's time left, counted down on this page's clock between ticks as the "!"s are (`paintNeedBadge`). */
function paintMilitaryLeft() {
  const line = $('#military-left');
  if (!line) return;
  const left = militaryDeadline === null ? null : leftWords(Math.max(0, militaryDeadline - performance.now()));
  const words = left ? `About ${left} left ${militaryLeftTo}.` : '';
  if (line.textContent !== words) line.textContent = words;
  if (line.hidden !== !words) line.hidden = !words;
}
function renderMilitaryNotice(world) {
  const panel = $('#military-notice');
  const notices = militaryNotices(world);
  panel.hidden = !notices.length;
  // A question that will not wait among them (triage 2026-09-29, 2.2): the messages stand above the town's scene and the rooms of
  // the house, which make room for them (`clearOfNotice`).
  if (notices.some(one => URGENT.has(one.kind))) setData(panel, 'urgent', 'true'); else if (panel.dataset.urgent) delete panel.dataset.urgent;
  if (!notices.length) { clearOfNotice(); return; }
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
  const folded = militaryCollapsed || Boolean(cardCrowding);
  write('#military-toggle', `${folded ? 'Open messages' : 'Keep playing'} · ${notices.length}`);
  $('#military-toggle').setAttribute('aria-expanded', String(!folded));
  $('#military-message').hidden = folded;
  write('#military-title', notice.title);
  write('#military-words', notice.text);
  write('#military-go', notice.action);
  // In the story cards' frame (owner, 2026-09-29): the moment's own accent, eyebrow and icon, and the time left where it lapses.
  setData(panel, 'accent', notice.kind);
  write('#military-eyebrow', notice.kind === 'call' && world.request?.kind !== 'call' ? 'Asked of the family' : EYEBROWS[notice.kind] || '');
  militaryDeadline = Number.isFinite(notice.leftMs) ? performance.now() + notice.leftMs : null;
  // Somebody very sick has a minute in which they cannot die (owner, 2026-09-29, C4): the time is the time to nurse them.
  militaryLeftTo = notice.kind === 'sick' ? 'to nurse them' : notice.kind === 'hunger' ? 'to find food' : 'to answer';
  paintMilitaryLeft();
  const icon = $('#military-icon');
  if (icon && icon.dataset.drawn !== `${ICONS[notice.kind]}:${spriteFrame(ICONS[notice.kind]) ? 1 : 0}`) {
    const ctx = icon.getContext('2d');
    ctx.clearRect(0, 0, icon.width, icon.height);
    const drawn = ICONS[notice.kind] && drawSprite(ctx, ICONS[notice.kind], icon.width / 2, icon.height * 0.9, icon.height * 0.84);
    icon.dataset.drawn = drawn ? `${ICONS[notice.kind]}:1` : '';
  }
  $('#military-next').hidden = notices.length < 2;
  placeMilitaryNotice();
}
/**
 * Where the messages card stands. Worked out on every render and again whenever the family's column is fitted (`fitColumn`: a
 * resize, a story card coming or going), so a window made smaller in a paused class does not leave it where the wider one had it
 * (the overlap proof, story cards at 400 px, 2026-09-29).
 */
function placeMilitaryNotice() {
  const panel = $('#military-notice');
  if (!panel || panel.hidden) return;
  // Below the guided start and below an open land chooser, never over either one's words or buttons (panels proof, 390px).
  // And below the story cards at the head of the family's column (the neighbours', the house's), which on a phone run across under
  // the status lines where this card starts: never over their buttons (the overlap proof, story cards at 400 px, 2026-09-29).
  // On a wider screen the column is on the other side and the stretch test below leaves it out.
  const above = ['#lesson', '#lesson-resume', '#site-choose', '#survey-choose', '#family-cards'].map(selector => $(selector)).filter(one => one && !one.hidden && one.getBoundingClientRect().height > 1);
  // Only what stands in the notice's own stretch of the screen: a land chooser beside the faces on the left no longer pushes
  // the messages on the right down onto the bar (the overlap proof, 1024x600, 2026-09-28). A phone's notice is as wide as
  // the screen, so there everything counts.
  const reach = innerWidth < 760 ? 0 : innerWidth - 12 - panel.offsetWidth;
  const top = Math.max(44, ...above.map(one => one.getBoundingClientRect()).filter(box => box.right > reach).map(box => box.bottom + 8));
  // And never down over the ability bar where it reaches under the right-hand side (1024x600): it scrolls instead.
  const foot = `calc(100% - ${Math.round(top)}px - var(--right-foot, 74px))`;
  if (panel.style.maxHeight !== foot) { panel.style.maxHeight = foot; panel.style.overflowY = 'auto'; }
  // On a phone the card is as wide as the screen, so it starts right of the family's faces and their "!": it must never
  // cover the other way to the same question (panels proof, 390px).
  const faces = innerWidth < 760 ? [...document.querySelectorAll('#family-panel .panel-portrait, #family-panel .panel-attention:not([hidden])')]
    .map(one => one.getBoundingClientRect()).filter(box => box.width && box.right < innerWidth / 2).map(box => box.right + 8) : [];
  const left = faces.length ? `${Math.round(Math.max(...faces))}px` : '';
  if (panel.style.left !== left) panel.style.left = left;
  if (panel.style.top !== `${top}px`) panel.style.top = `${top}px`;
  clearOfNotice();
}
/**
 * The town's scene and the inside of the house stand clear of the messages (triage 2026-09-29, 2.2: a student in Gonzales never
 * saw the army's ninety-second question, because the scene's card and the rooms were drawn over the card that asks it). The
 * messages keep their place at the head of the right-hand side, and above both (public/style.css); the scene's card stands
 * under them - or beside them, where a long message leaves no room under - and the rooms step to the left of them, or below
 * them on a phone. The rooms make way only for a question that will not wait (`URGENT`, public/military-attention.js): a
 * reminder - somebody inside the Alamo, a fight's account - stays behind the dialog the student opened, as it always has.
 * Worked out after the messages are placed and whenever the scene or the rooms open; written only when it changes, and taken
 * off when the messages go.
 */
function clearOfNotice() {
  const notice = $('#military-notice');
  const box = notice && !notice.hidden ? notice.getBoundingClientRect() : null;
  const standing = box && box.height > 1 && box.width > 1 ? box : null;
  standClear($('#town-scene'), standing, 'scene');
  // The rooms are drawn at the width they are given (public/interior.js): given another, they are drawn again at it.
  if (standClear($('#interior'), standing && notice.dataset.urgent === 'true' ? standing : null, 'rooms') && !$('#interior').hidden && window.__snapshot) renderInteriorPanel(window.__snapshot.world);
}
const CLEAR_STYLES = ['left', 'right', 'top', 'width', 'maxHeight', 'transform'], clearWritten = new WeakMap();
function standClear(panel, notice, kind) {
  if (!panel) return;
  const want = {};
  if (notice && !panel.hidden) {
    const foot = parseFloat(document.body.style.getPropertyValue('--right-foot')) || 74;
    const below = Math.round(notice.bottom + 8);
    if (kind === 'scene') {
      // Under the messages while there is a readable card's room there; else to their left, clear of the family's column.
      const column = innerWidth > 760 ? $('#family-panel')?.getBoundingClientRect() : null;
      const across = Math.round(notice.left - 8 - Math.max(12, column?.width ? column.right + 8 : 12));
      if (innerHeight - below - foot >= 200 || across < 260) {
        want.top = `${below}px`;
        want.maxHeight = `max(120px, min(66vh, 560px, calc(100% - ${below}px - var(--right-foot, 74px))))`;
      } else {
        want.right = `${Math.round(innerWidth - notice.left + 8)}px`;
        want.width = `${Math.min(400, across)}px`;
      }
    } else {
      // The rooms where they stand by themselves: in the middle, as wide as they can be up to 680.
      const width = Math.min(680, innerWidth - 32), left = (innerWidth - width) / 2;
      if (left + width > notice.left - 8) {
        const across = Math.round(notice.left - 12 - 16);
        if (innerWidth > 760 && across >= 420) {
          const wide = Math.min(680, across);
          want.left = `${Math.round(16 + (across - wide) / 2)}px`; want.width = `${wide}px`; want.transform = 'translateY(-50%)';
        } else {
          want.top = `${below}px`; want.transform = 'translateX(-50%)'; want.maxHeight = `calc(100% - ${below}px - 12px)`;
        }
      }
    }
  }
  // Compared with what was last written here, not with the style read back: the browser writes a `calc()` back in its own
  // words, and a comparison with those moved the rooms on every render, each render drawing them again (a loop, found by the
  // overlap proof, 2026-09-29).
  const key = JSON.stringify(want);
  if ((clearWritten.get(panel) || '{}') === key) return false;
  clearWritten.set(panel, key);
  for (const one of CLEAR_STYLES) panel.style[one] = want[one] || '';
  if (key !== '{}') setData(panel, 'clearOf', 'messages'); else delete panel.dataset.clearOf;
  return true;
}
$('#military-toggle')?.addEventListener('click', () => {
  // Folded to make room for a card: opening them is the student's choice, and it stands for as long as that card does.
  if (cardCrowding) { crowdingRefused = cardCrowding; cardCrowding = null; militaryCollapsed = false; placement.boxes = null; } else militaryCollapsed = !militaryCollapsed;
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
  // Watch: the camera on the field, both sides in the frame when they are drawn (docs/BATTLES.md §2.7). Only ever on this
  // press - the card itself never moves the camera, so it cannot take the view away mid-drag or mid-order.
  if (notice.kind === 'battle') { watchField(world, notice.field); return; }
  // To the person, chosen but not made main (B11, as a portrait): the army's questions are theirs to answer whoever is main.
  goToPerson(notice.entityId);
  if (notice.kind === 'siege' || notice.kind === 'account') $('#selection-close')?.focus();
  // A sighting's button takes the shot through the same door as its "!" (`openNeed`): the field opens to aim across (owner, 2026-10-02).
  else openNeed(notice.entityId, notice.kind === 'sighting' ? 'sighting' : null);
});
/**
 * Tips at first meeting (owner, 2026-09-28: "Short tips at first meeting"; public/tips.js, sim/tips.mjs, docs/LESSON.md §9).
 * One short tip at a time, over the map above the action bar - or, for the town errand, at the top of the errand's own list -
 * the first time its thing is on this student's screen. It blocks nothing: the words let clicks through to the map, and only
 * "Got it" takes a press. Put away by "Got it" or by Escape on it, or retired when its thing goes while it stands; either way
 * the server is told (`seen-tip`) and keeps it, so a reload or another Chromebook never shows it again. Never on the Host's
 * page (public/tips.js shows the Host nothing), so never on the projector.
 */
let tipShowing = null, tipFamily = null, tipPutAway = new Set(), tipBottom = null;
/**
 * Read aloud's buttons on the page's standing panels (owner, 2026-09-30, D15; public/read-aloud.js, docs/READ_ALOUD.md): the tip
 * over the map and the store's, the call's menu, the messages card, the questions on a person's card, and the journal's
 * newest line. Each reads what its panel shows at the press, in the narrator's voice. Made once; each is shown only while the
 * class can read aloud and its panel has words. A rider's lines and the tips list have theirs made as they are drawn.
 */
function mountReadAloud() {
  if (!readAloud) return;
  const narrate = text => (text && text.trim() ? [{ text: text.trim(), voice: 'narrator' }] : []);
  for (const selector of ['#tip', '#errand-tip']) {
    const panel = $(selector);
    panel?.querySelector('.tip-close')?.before(readAloud.button(() => narrate(TIPS[panel.dataset.tip] || ''), { className: 'read-aloud-tip' }));
  }
  $('#call-menu-text')?.after(readAloud.button(() => narrate($('#call-menu-text').textContent), { when: () => Boolean($('#call-menu-text')?.textContent) }));
  // The card's eyebrow, title and words, each said once (public/read-aloud.js `cardLines`): "A call to arms." then what is asked;
  // the starving card (sim/hunger.mjs, owner 2026-09-30) "No food. Paz is starving."
  $('#military-words')?.after(readAloud.button(() => narrate(cardLines({ eyebrow: $('#military-eyebrow')?.textContent, title: $('#military-title')?.textContent, words: $('#military-words')?.textContent })),
    { className: 'read-aloud-card', when: () => Boolean($('#military-words')?.textContent) }));
  // The end of the game (owner, 2026-09-30: "Yes, add it"): each part of a family's own breakdown, read by the narrator, one
  // button a part, drawn by public/ending.js. Never on the Host's page, where this is not made.
  setEndingReader(read => readAloud.button(() => read().flatMap(narrate), { compact: true, className: 'read-aloud-ending' }));
  // What a person's card asks - the army's questions, the road's, the call's, the sick - every question drawn on it now.
  const asked = () => [...($('#selection')?.querySelectorAll('.ask-text') || [])].filter(one => !one.closest('[hidden]') && one.textContent.trim());
  $('#selection-close')?.before(readAloud.button(() => asked().flatMap(one => narrate(one.textContent)), { compact: true, className: 'read-aloud-selection', when: () => asked().length > 0 }));
  // The journal's newest line, as the record keeps it (without the "into the story" the list adds).
  const newest = () => window.__snapshot?.world?.events?.at(-1);
  $('#event-log')?.previousElementSibling?.append(readAloud.button(() => narrate(newest()?.text || ''), { compact: true, className: 'read-aloud-journal', when: () => Boolean(newest()?.text) }));
  // These panels are drawn between snapshots too (a person chosen, a card opened): each change to one looks again, once.
  let looking = false;
  const look = () => { if (looking) return; looking = true; queueMicrotask(() => { looking = false; readAloud.refresh(); }); };
  const watcher = new MutationObserver(look);
  for (const selector of ['#selection', '#call-menu', '#military-notice', '#tip', '#errand-tip', '#event-log']) {
    const panel = $(selector);
    if (panel) watcher.observe(panel, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  }
}
/** A button for one line of a list that is drawn again (a rider's words, a tip in the list), the same button every time. */
function readLine(key, lines) {
  if (!readAloud) return null;
  if (!readButtons.has(key)) readButtons.set(key, readAloud.button(lines, { compact: true }));
  return readButtons.get(key);
}
/** Every render: ask once whether the class reads aloud, show the buttons that have words, and forget the ones gone. */
function renderReadAloud() {
  if (!readAloud) return;
  readAloud.ensure();
  readAloud.refresh();
  readAloud.tidy();
  for (const [key, button] of readButtons) if (!button.isConnected) readButtons.delete(key);
}
/** The popups a tip over the map is placed clear of, or waits behind (the errand is held in public/tips.js `tipToShow`). */
const TIP_HELD_BY = ['#house-plan', '#house-plot', '#going', '#wagon-load', '#site-choose', '#survey-choose'];
function renderTip(world, options = {}) {
  const panel = $('#tip');
  const was = panel?.hidden;
  try { placeTipFor(world, options); } finally {
    // The phone's column stops above a standing tip (`fitColumn`): fitted again whenever the tip comes or goes, which happens
    // between snapshots too (the page's own look for a tip).
    if (panel && panel.hidden !== was) queueColumnFit();
  }
}
function placeTipFor(world, { hidden = false } = {}) {
  const panel = $('#tip'), inline = $('#errand-tip');
  if (!panel) return;
  if ((world?.householdId || null) !== tipFamily) { tipFamily = world?.householdId || null; tipShowing = null; tipPutAway = new Set(); }
  renderTipsList(world);
  // Behind the curtain of making a family nothing is shown, and the tip standing is kept for when the curtain lifts: it is the
  // same showing, not a second one.
  // Nor on a page watching another family (sim/watching.mjs): there is nothing of theirs to do that a tip could be about.
  if (hidden || document.body.dataset.creating === 'true' || world?.watching) { panel.hidden = true; if (inline) inline.hidden = true; return; }
  const seen = [...(world?.household?.tipsSeen || []), ...tipPutAway];
  const errandOpen = document.body.dataset.errand === 'true';
  const { show, retire } = tipToShow(world, { seen, showing: tipShowing, errandOpen });
  if (retire) putTipAway(retire);
  // Presentation evidence for scripts/tips-browser-proof.mjs, read by nothing in the page: the tip standing, and every tip
  // this page has put up, in order, once each time one is put up.
  if (show && show !== tipShowing) (window.__tipsShown ??= []).push(show);
  tipShowing = show;
  window.__tip = show;
  const host = show === 'store' && inline ? inline : panel;
  for (const one of [panel, inline]) if (one && one !== host && !one.hidden) one.hidden = true;
  if (!show) { panel.hidden = true; if (inline) inline.hidden = true; return; }
  if (host.dataset.tip !== show) {
    host.dataset.tip = show;
    host.querySelector('.tip-words').textContent = TIPS[show] || '';
  }
  host.hidden = false;
  if (host !== panel) return;
  placeTip(panel);
  // Never over a popup the student opened - the house plan, the house plot, how they go, the wagon, a place being chosen
  // (owner, 2026-09-28: no tip may cover an open popup). Placed clear of them where there is room; where there is none it
  // waits hidden, neither retired nor seen, and stands again when the popup closes.
  const box = panel.getBoundingClientRect();
  const covers = TIP_HELD_BY.map(selector => $(selector)).filter(one => one && !one.hidden && getComputedStyle(one).display !== 'none')
    .map(one => one.getBoundingClientRect()).some(one => one.width > 1 && box.left < one.right && one.left < box.right && box.top < one.bottom && one.top < box.bottom);
  if (covers) panel.hidden = true;
}
/**
 * The tip over the map stands above the action bar, clear of the family's column, centred in what is left - and clear of
 * every card, question, popup and panel the student has open, beside it or above it, so it is read rather than hidden
 * under them. **One rule for all of them** (the overlap proof and the errand's fix, 2026-09-28): a tip never stands on or
 * under anything the student opened; where there is no room clear of it, the tip **waits** - hidden, neither retired nor
 * seen - and stands again at the next render with room for it, as it already did for the town errand (public/tips.js
 * `tipToShow`, which also puts the store's own tip inside the errand).
 */
const TIP_CLEAR_OF = ['#selection', '#call-menu', '#encounter', '#military-notice', '#lesson', '#lesson-resume', '#tutorial',
  '#errand', '#going', '#site-choose', '#survey-choose', '#wagon-load', '#house-plan', '#house-plot', '#house-placement', '#town-scene',
  '#interior', '#ending', '#family-journal[data-open=true]', '#ask-neighbours',
  // And the status lines at the top left, which can run wider than the column (a long supplies line; the overlap proof, 2026-09-29).
  '#session', '#world', '#food', '#supplies', '#field-summary', '#wagon-open', '#house-card', ...TIP_HELD_BY];
function placeTip(panel) {
  const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons');
  const barBox = bar ? bar.getBoundingClientRect() : null;
  // While a rider talks or a way is chosen the bar is not drawn: the tip keeps the place the bar last left it.
  if (barBox && barBox.height > 1) tipBottom = Math.round(innerHeight - barBox.top + 8);
  const column = $('#family-panel');
  const columnBox = column && !column.hidden && innerWidth > 760 ? column.getBoundingClientRect() : null;
  const edge = innerWidth > 760 ? 12 : 8;
  const left = columnBox && columnBox.width > 1 ? Math.round(columnBox.right + 8) : edge;
  const base = tipBottom ?? 150;
  const put = ({ bottom = base, from = left, to = edge } = {}) => {
    for (const [key, value] of [['bottom', `${bottom}px`], ['left', `${from}px`], ['right', `${to}px`]]) if (panel.style[key] !== value) panel.style[key] = value;
    return panel.getBoundingClientRect();
  };
  const over = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const standing = TIP_CLEAR_OF.map(selector => $(selector)).filter(one => one && !one.hidden && getComputedStyle(one).visibility !== 'hidden' && getComputedStyle(one).display !== 'none')
    .map(one => one.getBoundingClientRect()).filter(box => box.width > 1 && box.height > 1);
  // Tried first clear of the person the card is about as well, where the map drew them (the overlap proof, 2026-09-28: at
  // 1024x600 the tip stood on the person being given an order), and only then as before, clear of the panels alone.
  const card = $('#selection'), spot = card && !card.hidden && drawnAt.get(card.dataset.entityId);
  const person = [];
  if (spot) {
    const canvas = $('#world-map'), frame = canvas.getBoundingClientRect(), k = frame.width / (canvas.width || 1);
    person.push({ left: frame.left + (spot.x - spot.size * .35) * k, right: frame.left + (spot.x + spot.size * .35) * k, top: frame.top + (spot.y - spot.size * .6) * k, bottom: frame.top + (spot.y + spot.size * .55) * k });
  }
  const attempt = obstacles => {
    const clear = box => box.top >= 48 && !obstacles.some(one => over(box, one));
    let box = put();
    if (clear(box)) return true;
    const hit = obstacles.filter(one => over(box, one));
    // Beside whatever stands at the bar's height, in the widest stretch left free there...
    let free = [[left, innerWidth - edge]];
    for (const one of obstacles.filter(other => other.top < box.bottom && box.top < other.bottom)) {
      free = free.flatMap(([a, b]) => [[a, Math.min(b, one.left - 8)], [Math.max(a, one.right + 8), b]]).filter(([a, b]) => b - a > 0);
    }
    const [from, to] = free.reduce((best, span) => (span[1] - span[0] > best[1] - best[0] ? span : best), [0, 0]);
    // ceiling: 200px, where the words stand on their own lines under "Tip" and "Got it" (public/style.css); narrower than that a
    // tip is a column of single words, and it waits under the card instead. A card that could make room is the way out.
    if (to - from >= 200) {
      box = put({ from: Math.round(from), to: Math.round(innerWidth - to) });
      if (clear(box)) return true;
    }
    // ...or above it...
    box = put({ bottom: Math.round(innerHeight - Math.min(...hit.map(one => one.top)) + 8) });
    return clear(box);
  };
  window.__tipWaiting = null;
  if (person.length && attempt([...standing, ...person])) return;
  if (attempt(standing)) return;
  // ...and where there is no room anywhere, it waits: what the student opened outranks a tip, and a tip under it can be neither
  // read nor put away. Not put away: the same tip, placed again when the page next draws.
  put();
  panel.hidden = true;
  window.__tipWaiting = tipShowing;
}
// On a new size the tip is placed again with the rest, not left where the old size put it.
addEventListener('resize', () => { if (tipShowing && window.__snapshot?.world) renderTip(window.__snapshot.world); });
function putTipAway(id) {
  if (!id || tipPutAway.has(id)) return;
  tipPutAway.add(id);
  // The page remembers it at once; the server keeps it for good. A refusal (the family's student has gone) changes nothing here.
  api('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'seen-tip', tip: id }).catch(() => {});
}
function dismissTip() {
  const id = tipShowing;
  if (!id) return;
  const focused = document.activeElement?.closest?.('#tip, #errand-tip');
  putTipAway(id);
  tipShowing = null;
  if (window.__snapshot?.world) renderTip(window.__snapshot.world);
  // The keyboard goes back to the map rather than into nothing, unless the next tip took the same place.
  if (focused && focused.hidden) (focused.id === 'errand-tip' ? $('#errand-send') : $('#world-map'))?.focus?.({ preventScroll: true });
}
for (const selector of ['#tip', '#errand-tip']) {
  $(selector)?.querySelector('.tip-close')?.addEventListener('click', dismissTip);
  $(selector)?.addEventListener('keydown', event => {
    // Enter on "Got it" presses "Got it" and nothing else: inside the errand, Enter anywhere else sends the list
    // (public/errand.js), and a student putting a tip away must never send somebody to town by it.
    if (event.key === 'Enter' || event.key === ' ') { event.stopPropagation(); return; }
    if (event.key !== 'Escape') return;
    // Escape on the tip puts the tip away and nothing else: not the errand it stands in, not the card behind it.
    event.preventDefault(); event.stopPropagation();
    dismissTip();
  });
}
/**
 * The Tips button and its list (owner, 2026-09-29, triage D16 "Tips button"; public/tips.js `tipsToReread`, docs/LESSON.md §9):
 * every first-meeting tip this student has put away, latest first, to read again. It gates nothing - it shows no tip again,
 * sends nothing, and never names "Resume tutorial" - so the suspended guided start cannot come back through it. The button is
 * there once a tip has been put away, on a family's own page (never the Host's, never while watching another family); the list
 * opens above the map's buttons where the sound's sliders do, one of the two at a time, and closes on its ×, the button again,
 * or Escape, which gives the keyboard back to the button.
 */
let tipsListKey = '';
function renderTipsList(world) {
  const button = $('#tips-toggle'), list = $('#tips-list');
  if (!button || !list) return;
  const own = world && world.role !== 'host' && world.householdId && !world.watching;
  const tips = own ? tipsToReread([...(world.household?.tipsSeen || []), ...tipPutAway]) : [];
  if (button.hidden !== !tips.length) button.hidden = !tips.length;
  if (!tips.length && !list.hidden) closeTipsList();
  if (!list.hidden) placeTipsList();
  const key = tips.map(tip => tip.id).join(' ');
  if (key === tipsListKey) return;
  tipsListKey = key;
  const items = $('#tips-list-items');
  items.replaceChildren(...tips.map(tip => {
    const item = document.createElement('li'); item.dataset.tip = tip.id; setText(item, tip.words);
    const read = readLine(`tip:${tip.id}`, () => [{ text: tip.words, voice: 'narrator' }]);
    if (read) item.append(read);
    return item;
  }));
}
function openTipsList() {
  const list = $('#tips-list');
  if (!list) return;
  // One panel over the map's buttons at a time: the sound's sliders fold away.
  const sound = $('#sound-panel');
  if (sound && !sound.hidden) { sound.hidden = true; $('#sound-toggle')?.setAttribute('aria-expanded', 'false'); }
  list.hidden = false;
  placeTipsList();
  $('#tips-toggle')?.setAttribute('aria-expanded', 'true');
  $('#tips-list-close')?.focus({ preventScroll: true });
}
/**
 * The list keeps below whatever the student has open above the map's buttons - the card beside a person with its question, the
 * messages, a popup - by being shorter, and scrolls (the proof at 1024x768: it stood on the ¡Alto! card's answers); and beside the
 * bar, where the bar cannot narrow further, by being narrower (the overlap proof at 1024x600: 10px of the bar under it).
 * ceiling: never shorter than 140px, where it would show one tip, nor narrower than 200px; past those it stands where it is.
 */
function placeTipsList() {
  const list = $('#tips-list'), tools = $('#map-tools');
  if (!list || list.hidden || !tools) return;
  list.style.maxHeight = ''; list.style.width = '';
  let box = list.getBoundingClientRect();
  const floor = tools.getBoundingClientRect().top - 8;
  const bar = $('.panel-row[data-focused=true] .panel-icons')?.getBoundingClientRect();
  if (bar && bar.width > 1 && bar.right + 8 > box.left && bar.left < box.right && bar.top < box.bottom && box.top < bar.bottom) {
    const width = Math.floor(box.right - bar.right - 8);
    if (width >= 200) { list.style.width = `${width}px`; box = list.getBoundingClientRect(); }
  }
  const above = TIP_CLEAR_OF.map(selector => $(selector)).filter(one => one && !one.hidden && getComputedStyle(one).display !== 'none')
    .map(one => one.getBoundingClientRect()).filter(one => one.width > 1 && one.left < box.right && box.left < one.right && one.top < box.bottom && box.top < one.bottom && one.bottom < floor);
  if (!above.length) return;
  const room = Math.floor(floor - Math.max(...above.map(one => one.bottom)) - 8);
  if (room >= 140) list.style.maxHeight = `${room}px`;
}
function closeTipsList({ focus = false } = {}) {
  const list = $('#tips-list');
  if (!list || list.hidden) return;
  list.hidden = true;
  $('#tips-toggle')?.setAttribute('aria-expanded', 'false');
  if (focus) $('#tips-toggle')?.focus({ preventScroll: true });
  // The tip over the map waited while the list stood (public/style.css): it is placed again now there is room.
  if (tipShowing && window.__snapshot?.world) renderTip(window.__snapshot.world);
}
$('#tips-toggle')?.addEventListener('click', () => { if ($('#tips-list')?.hidden) openTipsList(); else closeTipsList(); });
$('#tips-list-close')?.addEventListener('click', () => closeTipsList({ focus: true }));
$('#tips-list')?.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.preventDefault(); event.stopPropagation();
  closeTipsList({ focus: true });
});
addEventListener('resize', () => placeTipsList());
// The sound's button opening its sliders folds the list away, as the list folds them.
document.addEventListener('click', event => { if (event.target.closest?.('#sound-toggle')) closeTipsList(); }, true);
/** The camera on a fight's field: both sides and the gun in the frame if they are drawn, or the field's middle close in. */
/**
 * The family's own chase framed (`chaseWatch`): what a "!" or a story card does for somebody out of sight while soldiers are after
 * the family - the soldiers and their order are drawn, and the answer is theirs to see given. Nothing when there is no chase.
 */
function watchChase(world, { draw = true } = {}) {
  const chase = world.flight?.chase;
  if (!chase || !Number.isFinite(chase.x) || !Number.isFinite(chase.y)) return;
  const canvas = $('#world-map'), view = cameraFor(world, canvas);
  stopWatching(); fieldWatch = null;
  // As close as watching a person goes (`cameraFor`), so the horsemen are drawn large enough to be read.
  manualView = { cx: chase.x, cy: chase.y, scale: clampTo(Math.max(view.scale, view.limits.max * .55), view.limits) };
  chaseWatch = { view: manualView };
  // Not from inside a frame (`noteUnseen` is called by `drawWorld`): the next frame takes the view up.
  if (draw) drawWorld(world);
}
function watchField(world, field) {
  const canvas = $('#world-map'), view = cameraFor(world, canvas);
  const points = world.battle ? battlePoints(world) : [];
  stopWatching();
  if (points.length) {
    const framed = fieldFrame(points), xs = framed.map(p => p.x), ys = framed.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs), height = Math.max(...ys) - Math.min(...ys);
    const scale = clampTo(Math.min(canvas.width / width, canvas.height / height), view.limits);
    manualView = { cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2, scale };
  } else if (field) manualView = { cx: field.x, cy: field.y, scale: clampTo(Math.max(view.scale, view.limits.max * .4), view.limits) };
  fieldWatch = { view: manualView };
  window.__watchedField = { at: performance.now(), view: { ...manualView } };
  // And follows it as a film would - the field, then the family's own in it - for as long as the student leaves the camera be
  // (public/battle-cinema.js, student mode: no fades, no title; a pan, a zoom, Follow or Esc ends it). Never started by itself.
  if (world.battle?.sides) studentCinema.resume({ ...cinemaInput(world, canvas), current: { ...manualView } }, performance.now());
  drawWorld(world);
}
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
  moveOn(world);
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
  $('#encounter-said').replaceChildren(...shown.map((line, index) => {
    const item = element('li', line.text);
    item.dataset.speaker = line.speaker;
    item.prepend(element('span', who(line), 'said-who'));
    // Read aloud in the speaker's own voice: the rider's (or Travis's runner's) and the family's person's, a man's or a woman's.
    const read = readLine(`said:${encounter.id}:${index}`, () => [{ text: line.text, voice: line.speaker === 'rider' ? 'rider' : voiceOfPerson(listener) }]);
    if (read) item.append(read);
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
  // Rebuilt only when what it offers changes: rebuilt every tick, a button was replaced between the press and the release and
  // the press was lost - found on 2026-09-29 by the one-rider proof at a tenth of a second a tick, pressing Done.
  const asksKey = JSON.stringify([encounter.id, live, runner, world.status === 'running', encounter.questions.map(question => question.id), runner ? (encounter.choices || []).map(choice => choice.answer) : []]);
  if ($('#encounter-asks').dataset.key !== asksKey) renderAsks(world, encounter, { live, runner });
  $('#encounter-asks').dataset.key = asksKey;
  $('#encounter-close').setAttribute('aria-label', runner && live ? 'Close this for now: he is still waiting for an answer' : live ? `Done: let ${encounter.carrierName} ride on` : 'Done');
  $('#encounter-note').textContent = runner
    ? live ? `${encounter.pressing ? `${encounter.carrierName} cannot wait much longer.` : `${encounter.carrierName} is waiting for an answer to take back.`} ${encounter.ifUnanswered || ''}`.trim()
      : encounter.reason === 'unanswered' ? `Nobody answered ${encounter.carrierName} in time, and the question lapsed: ${name} stays at their post, and he has gone back to Colonel Travis.` : `${name} gave ${encounter.carrierName} an answer, and he has gone back to Colonel Travis.`
    : live
      // What waits behind him, as a count and nothing more (sim/encounters.mjs `encounterProjection`).
      ? `${encounter.waiting ? `${encounter.waiting.words} ` : ''}Ask what you like, then press Done. Nothing said is lost when he rides on.`
      : encounter.reason === 'unanswered' ? `${encounter.carrierName} would wait no longer and rode on.`
        : encounter.reason === 'parted' ? `${name} and ${encounter.carrierName} were separated.`
          : `${name} let ${encounter.carrierName} ride on.`;
}
/** The conversation's buttons: the questions still to ask, the runner's two answers, and the one way out. */
function renderAsks(world, encounter, { live, runner }) {
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
  // One way out of every rider's conversation, the same every time (owner, 2026-09-29: "at the end of a conversation, sometimes
  // it's weird figuring out how to get rid of the conversation"): Done, last and primary, whether anything is left to ask or
  // not. It sends him on and puts the conversation away, and whatever waited behind him comes up next (`moveOn`). The × and
  // Escape do the same (`endConversation`). A finished one has its own Done, which only puts it away. Travis's runner needs an
  // answer, and his card says so rather than offering a way round it.
  if (live && !runner) {
    const leave = element('button', `Done — let ${encounter.carrierName} ride on`, 'ask-leave');
    leave.dataset.action = 'leave-rider';
    leave.dataset.entityId = encounter.listenerId;
    leave.disabled = world.status !== 'running';
    $('#encounter-asks').append(leave);
  } else if (!live) $('#encounter-asks').append(element('button', 'Done', 'ask-leave ask-done'));
}
/**
 * The conversation put away by Done, the × or Escape (owner, 2026-09-29): a rider still standing there is let go - the one
 * thing a student can mean by closing a conversation that asks nothing of them - and Travis's runner, who needs an answer, is
 * only put away, as it always was, with his card still saying he waits. Then, once the server has him gone, whatever waited
 * behind him comes up by itself (`moveOn`): the student asked to be done with this one, so the next is theirs to see.
 */
let moveOnFrom = null, moveOnUntil = 0, moveOnQuestion = false;
function endConversation(sendOn = true) {
  const encounter = window.__snapshot?.world?.encounter;
  const leave = $('#encounter .ask-leave:not(.ask-done)');
  if (sendOn && leave && !leave.disabled && !$('#encounter').hidden) leave.click();
  encounterOpen = false;
  $('#encounter').hidden = true;
  renderScreenMoments();
  if (encounter && encounter.kind !== 'alamo-runner') { moveOnFrom = encounter.id; moveOnUntil = performance.now() + 8000; moveOnQuestion = Boolean(encounter.waiting); }
}
/** After a conversation was put away: the first thing waiting on the family, opened as its "!" opens it, once he has gone. */
function moveOn(world) {
  if (!moveOnFrom || world.role === 'host') return;
  if (performance.now() > moveOnUntil) { moveOnFrom = null; return; }
  if (world.encounter?.id === moveOnFrom && world.encounter.status === 'open') return;
  moveOnFrom = null;
  if (encounterOpen || callMenuFor) return;
  const own = entitiesOf(world).filter(person => person.householdId === world.householdId).map(person => person.id);
  // In the order it came (owner, 2026-09-29): what waited behind him first, even if another rider has reined in since.
  const waited = moveOnQuestion && own.find(id => needsOf(world, id).some(one => one.kind === 'call'));
  if (waited) { openNeed(waited, 'call'); return; }
  const next = rankNeeds(world, own)[0];
  if (next && ['rider', 'call', 'courier'].includes(next.kind)) openNeed(next.id);
}
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || $('#encounter').hidden) return;
  // A tip standing over it is put away first, by its own Escape.
  if ($('#tip') && !$('#tip').hidden) return;
  event.preventDefault();
  if (window.__snapshot?.world?.encounter?.kind === 'alamo-runner') { encounterOpen = false; $('#encounter').hidden = true; renderScreenMoments(); return; }
  endConversation();
});
document.addEventListener('click', event => {
  if (!event.target.closest('[data-open-encounter]')) return;
  encounterOpen = true;
  if (window.__snapshot) renderEncounter(window.__snapshot.world);
});
bindEnding();
// The end-of-game flashback (public/flashback.js, docs/FLASHBACK.md): drawn with this page's own ground, houses and figures, on
// a camera of its own, at the video's own clock.
bindFlashback({
  camera: flashbackCamera, ground: flashbackGround, miniPerson, miniAnimal, miniWagon, homesteadHouse, animated,
  withClock: (ms, draw) => { const was = flashbackClock; flashbackClock = ms; try { return draw(); } finally { flashbackClock = was; } },
  landSettled: () => landMaking === 0 && !landLevels.pending,
});
bindNeighbours({
  command: order => api('/api/command', { ...order, id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}` }),
  // *Offer a trade* on the Neighbours sheet (triage 2026-09-29, 2.6): the trade with their person, as a press on them in the roster
  // of who is here opens it - the card beside them with the offer (`populateTrade`), sent through the same trade flow.
  trade: id => {
    selectedId = id; selectionDismissed = false;
    const world = window.__snapshot?.world;
    if (world) { drawWorld(world); renderSelection(world); }
  },
});
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
$('#encounter')?.addEventListener('click', event => {
  // Done: sent as every answer is (the action dispatcher), and the conversation goes with it.
  if (event.target.closest('.ask-leave')) setTimeout(() => endConversation(false), 0);
});
$('#encounter-close')?.addEventListener('click', () => {
  // A rider is let go (`endConversation`); a runner still waiting for an answer is only put away.
  if (window.__snapshot?.world?.encounter?.kind !== 'alamo-runner') endConversation();
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
      // A played family's call lapses after its minutes (sim/decision-budget.mjs `CALL_BUDGET_MS`): the server's words for it.
      ? { open: `Your family can choose how to respond.${request.pressing ? ' The call will not stand much longer.' : ''}${request.lapses ? ` ${request.lapses}` : ''}`, accepted: 'Somebody from your family went with the volunteers.', refused: 'Your family stayed home.', expired: request.lapsed ? 'Nobody answered in time, and the call lapsed: nobody from your family turned out.' : 'Nobody from your family answered.' }
      : request.kind === 'supply'
      ? { open: `Your family can choose what to send, or keep everything.${request.pressing ? ' The request will not stand much longer.' : ''}${request.lapses ? ` ${request.lapses}` : ''}` }
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
  // What is being said, for a screen reader, since the words are drawn over the speakers on the canvas.
  $('#battle-phase').textContent = battle ? `${battle.title || ''}${battle.lines?.length ? ` ${battle.lines.slice(-2).map(line => `${line.name ? `${line.name}: ` : ''}${line.text}${line.gloss ? ` (${line.gloss})` : ''}`).join(' ')}` : ''}`.trim() : '';
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
/**
 * How students join, on the Host's page (triage 1.8, classroom audit M2, 2026-09-29): the address to type, large enough to read
 * across a room from a projector, the class code, and a QR code of the address that a Chromebook's camera can read, made on this
 * computer by public/qr.js with no network service. Since 2026-09-30 (owner, "Code inside the address") the address carries the
 * class code as its path, `http://<laptop>:3000/<code>`, and the QR code is that same address, so a student who types it or scans
 * it types only their name (`addressCode`); the code is still shown under it for a student who typed the bare address. Open in the lobby; once the class runs it folds to one line, and the teacher opens it again for a
 * latecomer or a student coming back. The addresses are the server's own (`joinUrls`, server/deployment.mjs): which network the
 * students can reach is the teacher's to know, so the others are listed under the first. A server that found none (a test's) is
 * reached at this page's own address.
 */
let joinCardOpen = null, joinCardShown = '';
const JOIN_SITE_NAME = 'playtexas.github.io';
/**
 * **Join words** (owner, 2026-10-03, "Fewest words, no server"; docs/HOST_PAGE.md §2.17), at the top of the card when this
 * computer's address is a private one: *Go to playtexas.github.io and type* two or three words, numbered and large, *then the class
 * code*; the page there turns the words into this computer's bare address (public/join-words.js), which asks for the code as it
 * always has. The server makes them (`joinWords`, server/app.mjs `joinView`), for the
 * address the teacher has chosen as the students' network or, until then, its best guess - and the address, the QR code and the
 * words all follow that choice. The QR code stays the address itself: a scan goes straight to this computer, with or without the
 * Internet. Under *Students cannot connect?*: where this computer is, the choice of network when it has more than one, and a note
 * for IT in plain words.
 */
function renderJoinWords(join, code) {
  const words = join?.words || null;
  $('#join-words-box').hidden = !words;
  // The class code is said once: beside the words when there are words, else under the address for the bare address.
  document.querySelector('#join-card .join-code-line').hidden = Boolean(words);
  $('#join-address-step').textContent = words ? 'Or type this address, or scan the code with the camera:' : 'Type this address, or scan the code with the camera:';
  if (words) {
    $('#join-site').textContent = join.site;
    $('#join-words').replaceChildren(...words.map(word => element('li', word)));
    $('#join-words').setAttribute('aria-label', `The join words: ${words.join(', ')}`);
    $('#join-words-code').textContent = code;
  } else $('#join-words').replaceChildren();
  const where = join ? `${join.address}${join.label ? ` (${join.label})` : ''}, port ${join.port}` : location.host;
  $('#join-where').textContent = !join ? `This page is at ${location.host}.`
    : join.classroom ? `This computer is at ${where}, a classroom network address. The words and the address lead there.`
      : `This computer's address ${where} is not a classroom network address, so there are no join words: students type the address.`;
  const choices = join?.choices || [];
  $('#join-network-choice').hidden = choices.length < 2;
  if (choices.length >= 2) $('#join-network').replaceChildren(...choices.map(choice => {
    const option = element('option', `${choice.address}${choice.label ? ` (${choice.label})` : ''}${choice.classroom ? '' : ' - no words'}`);
    option.value = choice.address; option.selected = choice.address === join.address;
    return option;
  }));
  const address = join?.address || location.hostname, port = join?.port || location.port || 80;
  $('#join-it').textContent = [
    'Texas Revolution (a classroom game) - a note for IT.',
    `The teacher's laptop runs the game on this classroom's network at ${address}, port ${port} (TCP). Students open http://${address}:${port}/${code} in Chrome.`,
    'For that to work:',
    `1. Student devices must be able to reach the teacher's laptop on this network: client (AP) isolation off between them, or a rule allowing TCP port ${port} to ${address}.`,
    `2. Windows Firewall on the laptop must allow Node.js, or TCP port ${port}, on the Private profile.`,
    `3. ${JOIN_SITE_NAME} is a plain GitHub Pages page with no tracking that turns the words on the teacher's screen into the laptop's address and sends the browser there; nothing of the game leaves this network.`,
  ].join('\n');
}
$('#join-network')?.addEventListener('change', async event => {
  try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'join-network', address: event.target.value }); }
  catch (error) { say(error.message); }
});
$('#join-it-copy')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#join-it').textContent); $('#join-it-copy').textContent = 'Copied'; }
  catch { getSelection()?.selectAllChildren($('#join-it')); $('#join-it-copy').textContent = 'Selected: press Ctrl+C'; }
  setTimeout(() => { $('#join-it-copy').textContent = 'Copy this note for IT'; }, 3000);
});
function renderJoinLinks(snapshot) {
  const host = snapshot.world.role === 'host', panel = $('#join-links');
  panel.hidden = !host;
  if (!host) return;
  const join = snapshot.joinWords || null;
  // The address the teacher chose as the students' network (§2.17) first, then the rest the server ranked.
  const listed = snapshot.joinUrls?.length ? snapshot.joinUrls : [{ url: `${location.origin}/`, label: '' }];
  const urls = join ? [...listed.filter(entry => entry.address === join.address), ...listed.filter(entry => entry.address !== join.address)] : listed;
  const address = urls[0].url, code = snapshot.sessionCode || '';
  const open = joinCardOpen ?? snapshot.world.status === 'lobby';
  const shown = JSON.stringify([urls, code, open, join]);
  if (shown === joinCardShown) return;
  joinCardShown = shown;
  renderJoinWords(join, code);
  // The class code inside the address (owner, 2026-09-30): one thing to type, and the same address in the QR code.
  const coded = url => `${url.replace(/\/$/, '')}${code ? `/${code}` : ''}`;
  const plain = coded(address);
  $('#join-card-toggle').setAttribute('aria-expanded', String(open));
  // Folded, one short line as wide as its words: at 1024 px a wider one narrowed the room the fight's caption has between the
  // class and the teacher's controls until the caption fell back to the middle, over the class (test:overlap).
  $('#join-card-label').textContent = open ? 'How students join' : 'Join';
  $('#join-card-short').textContent = open ? '' : ` ${plain.replace(/^https?:\/\//, '')}`;
  $('#join-card').hidden = !open;
  // Broken, when the column is too narrow for it, only before the code - never inside it: the code is its own unbroken word.
  const where = plain.slice(0, plain.length - code.length), codeWord = element('span', code, 'join-address-code');
  if (code) $('#join-address').replaceChildren(document.createTextNode(where), document.createElement('wbr'), codeWord);
  else $('#join-address').textContent = plain;
  $('#join-code').textContent = code;
  try { $('#join-qr').innerHTML = qrSvg(plain, { label: `QR code for ${plain}` }); }
  catch { $('#join-qr').replaceChildren(); }
  // The next two the server ranked (a laptop has a VPN's and a virtual machine's addresses too, which students rarely reach).
  const others = urls.slice(1, 3).map(entry => `${coded(entry.url)}${entry.label ? ` (${entry.label})` : ''}`);
  $('#join-others').textContent = others.length ? `If that does not open, try ${others.join(' or ')}${urls.length > 3 ? ', or another the launcher lists' : ''}.` : '';
}
$('#join-card-toggle')?.addEventListener('click', () => {
  joinCardOpen = $('#join-card-toggle').getAttribute('aria-expanded') !== 'true';
  if (window.__snapshot) renderJoinLinks(window.__snapshot);
});
/**
 * The card of the Gonzales scene the student clicked (public/town-scenes.js `renderSceneCard`), kept open while the scene is
 * there and redrawn only when what it says changes, so a button under a finger is not replaced every tick. It closes by
 * itself when the scene ends or this page can no longer see it.
 */
function renderTownScene(world) {
  const root = $('#town-scene');
  if (!root) return;
  const scenes = world?.townScenes;
  if (!townSceneOpen || !scenes?.cards?.[townSceneOpen]) {
    if (townSceneOpen && !scenes?.cards?.[townSceneOpen]) townSceneOpen = null;
    root.hidden = true; townSceneShown = '';
    return;
  }
  const beat = scenes.scenes.find(scene => scene.id === townSceneOpen)?.beat;
  const key = JSON.stringify([beat, scenes.help?.[townSceneOpen] || null]);
  if (key === townSceneShown && !root.hidden) return;
  townSceneShown = key;
  const date = world.historicalDate ? new Date(`${world.historicalDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
  renderSceneCard(root, scenes, townSceneOpen, {
    date,
    onClose: () => { townSceneOpen = null; townSceneShown = ''; },
    onHelp: async (entityId, scene) => {
      try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'town-help', entityId, scene }); }
      catch (error) { say(error.message); }
    },
  });
  // Under the messages, or beside them, never over them (triage 2026-09-29, 2.2).
  clearOfNotice();
}
/**
 * A student with no family left to play, or whose little ones were taken in, watches another family (owner, 2026-09-29, "Follow
 * and watch"; sim/watching.mjs): the server sends that family's own page with its controls taken off, and `watching` - what
 * happened and whose family this is. The line goes in the status column; `data-watching` takes every control that would give an
 * order off the page (public/style.css), and the names cannot be typed in. Nothing here decides anything: the server refuses
 * every order all the same.
 */
function renderWatching(world) {
  const watching = world?.role !== 'host' && world?.watching ? world.watching : null;
  const line = $('#watching');
  const words = watching?.line || '';
  if (line.textContent !== words) line.textContent = words;
  line.hidden = !watching;
  const on = String(Boolean(watching));
  if (document.body.dataset.watching !== on) document.body.dataset.watching = on;
  const label = watching?.ofName ? `The people of ${watching.ofName}, whom you are watching` : "Your family's people";
  if ($('#family-panel').getAttribute('aria-label') !== label) $('#family-panel').setAttribute('aria-label', label);
}
function render(snapshot) {
  // The live map sends four palette indexes instead of four repeated words for every
  // person in the class. Expand only after receipt; simulation and saves keep words.
  for (const entity of [...(snapshot.world?.entities || []), ...(snapshot.world?.others || [])]) {
    if (entity.a !== undefined && !entity.appearance) entity.appearance = decodeAppearance(entity.a, entity.sex);
  }
  if (motionProjection.session !== snapshot.sessionId) { animationTime = 0; }
  // The kept ground is not thrown away here: it is drawn again when what it is drawn from changed (`groundInputs`), which a
  // render that only moved people did not.
  motionProjection.accept(snapshot, performance.now());
  // Everybody on the Host's map is somebody the teacher looks at and never orders: marked here rather than sent on every one.
  if (snapshot.world?.role === 'host') for (const entity of snapshot.world.others || []) entity.observed = true;
  ensureMap(snapshot); ensureHomes(snapshot); ensureChores(snapshot); ensureFamily(snapshot); ensureLandLevels(mapCache);
  // The famous people this page was sent: their sheets asked for now, so the map's first frame with them is not the one that
  // waits (public/famous-view.js `famousArt`). A sheet already here or on its way is not asked for twice (public/art.js).
  for (const one of snapshot.world?.famous || []) { const { sprites, clips } = famousArt(one); sprites.forEach(spriteReady); clips.forEach(clipReady); }
  // And the people of a fight this page is drawing: every pose of their own sheet (Astra's, or Claude's temporary one behind it),
  // so a scene reached by a jump of the clock - the burial party at noon - is drawn from the first frame it is on the field.
  for (const one of snapshot.world?.battle?.people || []) for (const name of Object.values(personArt(one.art) || {}).flat()) {
    if (typeof name !== 'string') continue;
    if (name.startsWith('clip:')) clipReady(name.slice(5)); else { spriteReady(name); clipReady(name); }
  }
  snapshot.world.map =mapCacheId === snapshot.mapId ? mapCache : (snapshot.world.map || EMPTY_MAP);
  $('#save-fault').hidden = !snapshot.fault;
  $('#save-fault').textContent = snapshot.fault?.message || '';
  $('#lifecycle').hidden = !snapshot.lifecycle;
  $('#lifecycle').textContent = snapshot.lifecycle?.message || '';
  // The class paused itself with no student in it (owner, 2026-09-29: "Pause after 3 min"; server/app.mjs `pauseIfEmpty`): why,
  // said plainly on the Host's page until Resume. The server sends it to the Host alone, and only while the class is paused.
  const pausedWords = emptyPauseWords(snapshot.emptyPaused);
  if ($('#host-paused').textContent !== pausedWords) $('#host-paused').textContent = pausedWords;
  $('#host-paused').hidden = !pausedWords;
  renderWatching(snapshot.world);
  window.__snapshot = snapshot;
  // For a proof that changes the snapshot in the page's hand and needs it drawn without waiting for a tick - a lobby does
  // not tick at all (scripts/support/lesson-stub.mjs). Nothing in the page ever calls it.
  window.__render = render;
  window.__received.push({ revision: snapshot.revision, tick: snapshot.world.tick });
  if (window.__received.length > 2000) window.__received.shift();
  $('#join').hidden = true; $('#rejoin').hidden = true; $('#away').hidden = true; $('#game').hidden = false;
  const world = snapshot.world, host = world.role === 'host';
  // "Connected" alone made a locked phone look like a student who had left. Away is a
  // household whose stream has closed within the grace window; it is not a count of who
  // is paying attention, and the Host line says so by naming the two separately.
  // And how many families the class has (2026-09-28): the students joined of the families there are.
  const presence = snapshot.presence;
  $('#connection').textContent = host
    ? (presence ? `${presence.here} here${presence.away ? ` · ${presence.away} away` : ''} of ${presence.joined} joined${snapshot.classSize ? ` · ${snapshot.classSize} families` : ''}` : `${snapshot.connected} connected`)
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
  // Play Solo's own Pause, Resume and Save (owner, 2026-09-27), on the player's page only and never once the server is stopping.
  const soloControls = Boolean(snapshot.solo) && !host && !snapshot.lifecycle;
  $('#solo-controls').hidden = !soloControls;
  if (soloControls) for (const button of $('#solo-controls').querySelectorAll('button')) {
    button.hidden = button.dataset.solo === 'solo-pause' ? world.status !== 'running' : button.dataset.solo === 'solo-resume' ? world.status !== 'paused' : false;
  }
  renderHostLive(snapshot, host);
  // Named paces rather than a number, because milliseconds a tick is not a thing a teacher
  // should have to hold in their head.
  const paces = { study: 9500, brisk: 4000, quick: 1000 };
  for (const button of $('#host-pace').querySelectorAll('button')) {
    // The pace chosen (`paceMs`), not how long this tick lasts: a fight's floor holds a tick longer (docs/BATTLES.md §15.1).
    button.dataset.active = String(paces[button.dataset.pace] === (snapshot.paceMs ?? snapshot.tickMs));
  }
  // The Host's button names the period that follows (sim/periods.mjs `nextPeriodLabel`).
  const next = $('#host-controls [data-action="next-period"]');
  if (next && world.ending?.host?.nextLabel && next.textContent !== world.ending.host.nextLabel && !next.dataset.confirming) next.textContent = world.ending.host.nextLabel;
  const statusLabel = world.slice?.complete ? 'story preserved' : { lobby: 'waiting to begin', running: '', paused: 'paused', ended: 'session ended' }[world.status] ?? world.status;
  $('#world').textContent = [world.historicalDate || timeLabel(world.minute ?? 0), statusLabel].filter(Boolean).join(' · ');
  // While a class is under way the stop is *Stop for today* (docs/HOST_PAGE.md §2.8): it saves the class paused, and stops the
  // server when it can. Stop Server, which does the same without the words, is offered only when no class is under way.
  const whenAvailable = { start: ['lobby'], pause: ['running'], resume: ['paused'], 'stop-for-today': ['running', 'paused'], end: ['running', 'paused'], 'new-class': ['lobby', 'ended'], 'stop-server': ['lobby', 'ended'] };
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
  renderClassPanel(snapshot);
  renderSlice(world);
  renderEnding(world);
  renderFlashback(snapshot);
  renderNeighbours(world);
  // Making the family comes before the world is seen (public/creation.js): the curtain, and no map drawn behind it.
  // The family's key comes last, once (triage 2026-09-29, 2.4); Play Solo has no way back in by a key, so none is shown there.
  const creating = renderCreation(world, familyCache, { familyKey: snapshot.solo ? null : snapshot.familyKey });
  renderLooks(familyCache, { blocked: creating !== 'looks' });
  // A snapshot that lands while a hand is on the map is drawn when the hand stops (`handOnMap`), not in the middle of the
  // gesture: a whole draw there is the stall a student feels as the map sticking under their finger.
  if (creating) { /* the curtain is up: nothing of the world is drawn */ } else if (performance.now() < handOnMapUntil) requestMapDraw(); else drawWorld(world);
  renderTownScene(world);
  // The lone parent's path: the ability at the head of the family's column while it is offered, and the scenes once pressed.
  renderAskNeighbours(world, { hidden: Boolean(creating) });
  courtshipScenes.update(creating ? null : world);
  renderInteriorPanel(world); renderHousehold(world); renderKnowledge(world); renderEncounter(world); renderFamilyRoll(world); renderWagonLoad(world); renderHousePlan(world); renderSite(world); renderSurvey(world); renderLesson(world); renderMilitaryNotice(world); renderTutorial(world);
  renderPanelBackdrop();
  // After the panels, so the tip is placed above the bar as it is drawn this time; never over the curtain of making a family.
  // Nor over the lone parent's scenes, which are the whole screen while they last (public/courtship.js).
  renderTip(world, { hidden: Boolean(creating) || courtshipScenes.open });
  renderReadAloud();
  soundscape?.observe(snapshot);
  // The shot aimed by the student (public/hunt-aim.js): the server's verdict comes in the snapshot after the trigger.
  huntAim.update(world);
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
/**
 * The lone parent's path, offered (sim/courtship.mjs `offerView`; owner 2026-09-29: "a special ability appears when they reach their
 * land. this ability should be highlighted and special looking"). A glowing card at the head of the family's column: what it is,
 * what it costs the family's day, **Go and ask**, and **Not now**, which folds it to its glowing icon - it is offered, never
 * pressed on the student, and it waits. Every sentence is the server's, and so is the refusal when it cannot be pressed yet.
 * Folded is remembered in this browser only (a per-viewer convenience).
 */
const ASK_FOLDED_KEY = 'texas-civ:ask-neighbours-folded';
let askSending = false, askError = '';
function askFolded() { try { return localStorage.getItem(ASK_FOLDED_KEY) === 'yes'; } catch { return false; } }
function setAskFolded(folded) { try { localStorage.setItem(ASK_FOLDED_KEY, folded ? 'yes' : 'no'); } catch { /* not kept */ } }
function renderAskNeighbours(world, { hidden = false } = {}) {
  const card = $('#ask-neighbours');
  if (!card) return;
  const offer = !hidden && world.role !== 'host' ? world.courtship?.offer : null;
  if (card.hidden !== !offer) { card.hidden = !offer; queueColumnFit(); }
  if (!offer) { askError = ''; return; }
  // Drawn again until the icon itself has been drawn (its sheet may arrive after the card first shows).
  if (card.dataset.icon !== 'drawn') {
    const icon = $('#ask-neighbours-icon'), ctx = icon.getContext('2d');
    ctx.clearRect(0, 0, icon.width, icon.height);
    card.dataset.icon = drawAskIcon(ctx, icon.width / 2, icon.height / 2 + 4, icon.width * 0.8);
  }
  setData(card, 'folded', String(askFolded()));
  const text = (selector, words) => { const node = $(selector); if (node.textContent !== words) node.textContent = words; };
  text('#ask-neighbours-title', offer.title);
  text('#ask-neighbours-says', offer.says);
  // Said on hover too, for a column too short to show it (public/style.css, `data-tight`).
  if (card.title !== offer.says) card.title = offer.says;
  text('#ask-neighbours-note', offer.note || '');
  const why = askError || (offer.can ? '' : offer.why || '');
  text('#ask-neighbours-why', why);
  $('#ask-neighbours-why').hidden = !why;
  $('#ask-neighbours-go').disabled = !offer.can || askSending;
}
$('#ask-neighbours-go')?.addEventListener('click', async () => {
  if (askSending) return;
  askSending = true; askError = '';
  $('#ask-neighbours-go').disabled = true;
  try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: 'ask-neighbours' }); }
  catch (error) { askError = error.message; }
  finally { askSending = false; if (window.__snapshot) render(window.__snapshot); }
});
$('#ask-neighbours-later')?.addEventListener('click', () => { setAskFolded(true); if (window.__snapshot) render(window.__snapshot); });
// The glowing icon unfolds the card (and, in a column folded to its faces, says what it is on hover and to a screen reader).
$('#ask-neighbours-open')?.addEventListener('click', () => { setAskFolded(false); if (window.__snapshot) render(window.__snapshot); });
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
  queueColumnFit();
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
  // Called on a sign-out, while the reconnector goes on listening for this page's class to come back (public/reconnect.js).
  showReconnecting(''); showReplaced(false);
  events?.close(); events = null;
  $('#game').hidden = true; $('#rejoin').hidden = true; $('#away').hidden = true; $('#join').hidden = hostPage;
  // The title screen is the join form's own backdrop (public/creation.js): the game's name is the first thing a student sees.
  if (!hostPage) showTitle();
  $('#connection').textContent = hostPage ? 'Host access required' : 'Ready to join';
  say(message);
}
/** The banner over the page while it is out of reach of the server; empty hides it. */
function showReconnecting(text) {
  const banner = $('#reconnecting');
  if (!banner) return;
  if (banner.textContent !== text) banner.textContent = text;
  banner.hidden = !text;
  document.body.dataset.reconnecting = String(Boolean(text));
}
/**
 * The notice on a page the server let go because this family (or the Host) is open in more tabs than it may hold (server/app.mjs
 * `STREAMS`, the classroom audit's M4). The game stays behind it; **Play here** takes a stream back, which lets the oldest
 * other tab go in its turn.
 */
function showReplaced(shown) {
  const notice = $('#replaced');
  if (!notice) return;
  if (shown) $('#replaced-words').textContent = hostPage
    ? 'The Host page is open in another tab or window, so this one has stopped updating.'
    : 'Your family is open in another tab or window, so this one has stopped updating.';
  if (shown) $('#replaced-here').textContent = hostPage ? 'Use this one' : 'Play here';
  notice.hidden = !shown;
  document.body.dataset.replaced = String(Boolean(shown));
}
$('#replaced-here')?.addEventListener('click', () => { showReplaced(false); connect(null); });
/**
 * The page's way back to its class after the stream breaks (2026-09-28, public/reconnect.js, the classroom audit's B3): it
 * keeps asking, a few seconds apart, with the game left on the screen behind a "Reconnecting" banner, and carries on with the
 * same family when the server answers - after a Wi-Fi drop, a Chromebook asleep, a restarted or stopped-and-started server.
 * Only a 401 goes to the join screen, where a student who has nothing but the class code can find their own name.
 * Declared above the page's first `connect`, which reaches it (the TDZ rule, tests/page-startup.test.mjs).
 * ceiling: the Host's cookie is named for the class that is open, and a new one is set only in the browser that opened
 * another class; a Host page in another browser (the launcher's own window) is signed out then, and is opened again from
 * the launcher. A host cookie that does not name the class is the way out if a teacher runs two Host browsers.
 */
const reconnect = reconnector({
  connected: snapshot => { showReconnecting(''); connect(snapshot); },
  signedOut: () => showJoin(hostPage
    ? 'This Host session ended. Reopen the Host page from the launcher.'
    : 'You are no longer joined to this class: your family was taken up on another device, or your teacher opened another class. If you were in this class, choose “I was already in this class” and tap your name.'),
  waiting: (tries, since) => {
    const stopped = window.__snapshot?.lifecycle?.state === 'stopping';
    showReconnecting(reconnectWords({ host: hostPage, stopped, solo: Boolean(window.__snapshot?.solo), seconds: (Date.now() - since) / 1000 }));
    if (hostPage) $('#connection').textContent = 'Reconnecting…';
    window.__reconnecting = { tries, since };
  },
});
// The Host's class controls (public/class-panel.js): class days, class size, late students and the classes on this computer.
const renderClassPanel = mountClassPanel({ $, api, element, command: (action, extra = {}) => api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, ...extra }) });
function connect(snapshot) {
  reconnect.stop();
  if (snapshot) render(snapshot);
  showReplaced(false);
  events?.close(); events = new EventSource('/api/events');
  events.onmessage = event => { showReconnecting(''); render(JSON.parse(event.data)); };
  // The server's ping, answered, is how it knows this page is awake (server/app.mjs `STREAMS`): a Chromebook put to sleep stops
  // answering and its family is let go within half a minute, so its student can take it up at another device. Answered from
  // the ping itself, not from a timer the browser would slow in a background tab.
  events.addEventListener('ping', event => {
    fetch('/api/here', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ stream: event.data }) }).catch(() => {});
  });
  // The same family (or the Host) opened in more tabs than a family may hold: the server let this one, the oldest, go. It says
  // so and stops asking, or it would take a stream back from the newest and the tabs would take turns for ever.
  events.addEventListener('replaced', () => {
    events?.close(); events = null;
    reconnect.stop();
    showReconnecting('');
    showReplaced(true);
  });
  // The stream is closed here and the page asks for itself (`reconnect`), rather than leaving the browser's own retry to run
  // alongside: one way back, and a 401 always read as one.
  events.onerror = () => {
    events?.close(); events = null;
    reconnect.start();
  };
}
// Two doors, one at a time. The toggle is a plain button so the pages stay usable with
// the strict content security policy and without any inline script.
function showDoor(which) {
  say('');
  $('#join').hidden = which !== 'join';
  $('#rejoin').hidden = which !== 'rejoin';
  $('#away').hidden = which !== 'away';
  // On the join form the class code first when it is asked for and empty (it comes first, §2.17), else the name.
  const codeBox = $('#join input[name="code"]'), codeFirst = codeBox && !codeBox.closest('label').hidden && !codeBox.value;
  $(which === 'join' ? (codeFirst ? '#join input[name="code"]' : '#join input[name="name"]') : which === 'away' ? '#away input[name="away-code"]' : '#rejoin input[name="key"]')?.focus();
}
/**
 * **The class code inside the address** (owner, 2026-09-30, by multiple choice: "Code inside the address"). The Host shows one
 * address to type, `http://<laptop>:3000/<code>`, and the server answers it with this page (server/app.mjs `CODE_PATH`). Opened
 * so, the code is taken from the address: the join asks only for a name, and the away list needs nothing typed. The server
 * checks it as it checks a typed one, at the join, the away list and the claim; told it came from the address (`via`), it
 * answers a wrong one as an old class's address, and the code boxes come back, empty, for the code on the Host screen. The bare
 * address asks for the code as it always did, and an older QR code's `?code=` fills the boxes as it always did.
 */
const CODE_IN_ADDRESS = /^\/([0-9A-Fa-fOoIiLl]{6})$/;
let addressCode = hostPage ? '' : CODE_IN_ADDRESS.exec(location.pathname)?.[1].toUpperCase() || '';
const codeInputs = () => document.querySelectorAll('#join [name=code], #away [name=away-code]');
function showCodeBoxes(shown) {
  for (const input of codeInputs()) input.closest('label').hidden = !shown;
  const intro = $('#join .join-intro');
  if (intro) intro.textContent = shown ? 'Your family begins here. Enter the class code your teacher gave you.' : 'Your family begins here. Type your name to join.';
}
/** The code in the address was refused - an old class's, or the address mistyped: the boxes, empty, for today's code. */
function addressRefused() {
  addressCode = '';
  for (const input of codeInputs()) input.value = '';
  showCodeBoxes(true);
  $('#join').hidden ? $('#away [name=away-code]')?.focus() : $('#join [name=code]')?.focus();
}
const viaAddress = () => (addressCode ? { via: 'address' } : {});
$('#rejoin-toggle').addEventListener('click', () => showDoor('rejoin'));
$('#join-toggle').addEventListener('click', () => showDoor('join'));
$('#away-toggle')?.addEventListener('click', () => {
  showDoor('away');
  // Nothing to type: the names are asked for at once with the address's code.
  if (addressCode) $('#away').requestSubmit();
});
$('#away-join-toggle')?.addEventListener('click', () => showDoor('join'));
$('#away-key-toggle')?.addEventListener('click', () => showDoor('rejoin'));
// A third door (2026-09-28, the classroom audit's B3 and S5): the class code, then your own name off the list of students
// whose family nobody is playing now (server/app.mjs `/api/away`), then that family on this device (`/api/claim`). For a
// student on a cart or guest Chromebook who has no cookie and never wrote their family key down.
$('#away').addEventListener('submit', async event => {
  event.preventDefault(); if (joinPending) return;
  joinPending = true; const code = new FormData(event.target).get('away-code').trim().toUpperCase(), button = $('#away-find');
  button.disabled = true; say('');
  try {
    const via = viaAddress();
    const { families } = await api('/api/away', { code, ...via });
    $('#away-names').replaceChildren(...families.map(family => {
      const item = element('li', '');
      const pick = element('button', family.name);
      pick.type = 'button'; pick.dataset.claim = family.householdId; pick.dataset.code = code;
      if (via.via) pick.dataset.via = via.via;
      pick.append(element('span', family.family, 'away-family'));
      item.append(pick);
      return item;
    }));
    if (!families.length) say('Nobody in this class is waiting to come back. If you are new to it, choose “I am joining for the first time”.');
  } catch (error) { if (error.codeRefused && addressCode) addressRefused(); say(error.message); }
  finally { joinPending = false; button.disabled = false; }
});
$('#away-names').addEventListener('click', async event => {
  const pick = event.target.closest('[data-claim]');
  if (!pick || joinPending) return;
  joinPending = true; say('');
  try { connect(await api('/api/claim', { code: pick.dataset.code, householdId: pick.dataset.claim, ...(pick.dataset.via && { via: pick.dataset.via }) })); $('#away-names').replaceChildren(); }
  catch (error) { if (error.codeRefused && addressCode) { $('#away-names').replaceChildren(); addressRefused(); } say(error.message); }
  finally { joinPending = false; }
});
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
  try { connect(await api('/api/join', { name: form.get('name'), code: form.get('code').trim().toUpperCase(), ...viaAddress() })); }
  catch (error) { if (error.codeRefused && addressCode) addressRefused(); say(error.message); }
  finally { joinPending = false; button.disabled = false; }
});
document.addEventListener('click', async event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { applyMapView(viewButton.dataset.view); return; }
  // Play Solo's own Pause, Resume and Save: orders of the player's, which the server takes only on a solo game.
  const soloButton = event.target.closest('[data-solo]');
  if (soloButton) {
    say('');
    try {
      await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action: soloButton.dataset.solo });
      if (soloButton.dataset.solo === 'solo-save') $('#solo-saved').textContent = `Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } catch (error) { say(error.message); }
    return;
  }
  // How fast the class watches. Sent like any other Host command, and not a world change; the server keeps it with the
  // class, so a class reopened tomorrow opens at the pace chosen today (server/app.mjs `state.pace`).
  const paceButton = event.target.closest('[data-pace]');
  if (paceButton) {
    say('');
    try { await api('/api/command', { id: crypto.randomUUID?.() || `cmd-${Date.now()}`, action: 'pace', pace: paceButton.dataset.pace }); }
    catch (error) { say(error.message); }
    return;
  }
  const pick = event.target.closest('[data-select]');
  if (pick) {
    if (refusedUnseen(pick.dataset.select)) return;
    selectedId = pick.dataset.select; selectionDismissed = false;
    // Chosen from the roster rather than off the map, so go and look at them. Somebody
    // picked off the map is already on screen and moving the camera would only be rude.
    const world = window.__snapshot?.world;
    const mine = world && entitiesOf(world).some(entity => entity.id === selectedId);
    if (mine) { watchedId = selectedId; manualView = null; }
    if (world) { drawWorld(world); renderSelection(world); renderTutorial(world); }
    return;
  }
  // A portrait on the family panel does exactly what their star does (owner, 2026-09-29: *"When clicking on a character portrait
  // it should be treated the same as clicking on the star."*, docs/FAMILY_PANEL.md, amendment 2026-09-29): it makes the person
  // the family's main person (`set-main`, refused in the server's own words, said on the refusal line, for anybody too young or
  // gone - the star's refusal), and the camera goes to them and zooms in, their card opens and the bar is theirs, as the
  // portrait always did (`goToPerson`: the same watch the roster starts, walking with them until the student pans, zooms or
  // presses Follow). Pressing the main person's portrait sends nothing and takes the camera back to them. This reverses the
  // design audit's B11 of 2026-09-28 (a portrait only chose): on auto the main person decides the family's leaving and its
  // answers on the road, and the owner has chosen that a press on a face hands that over, as the star does.
  const portrait = event.target.closest('[data-portrait]');
  if (portrait) { if (!refusedUnseen(portrait.dataset.portrait)) pressStar(portrait.dataset.portrait); return; }
  // The "!" on a row: to the person, and open what is waiting on them (docs/FAMILY_PANEL.md §11).
  const attention = event.target.closest('[data-attention]');
  if (attention) { openNeed(attention.dataset.attention); return; }
  // The auto switch on a row: on if it is off, off if it is on (docs/FAMILY_PANEL.md §11.7).
  const sw = event.target.closest('[data-auto]');
  if (sw) { setAutoFor(sw.dataset.auto, sw.getAttribute('aria-pressed') !== 'true'); return; }
  // The star: make this person the main one; on the main person already, go back to them.
  const star = event.target.closest('[data-focus]');
  if (star) { if (!refusedUnseen(star.dataset.focus)) pressStar(star.dataset.focus); return; }
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
    // Tap, then send (owner, 2026-09-29, triage D17; public/family-panel.js `iconPress`): on a touch screen the first tap shows
    // the cost, any warning and Send; the second tap, or Send, sends. A mouse or the keyboard sends at once, as before.
    const step = iconPress({
      touch: touchPress(event), refused: panelButton.getAttribute('aria-disabled') === 'true',
      armed: Boolean(panelTipFor?.armed && panelTipFor.entityId === panelButton.dataset.entityId && panelTipFor.key === panelButton.dataset.key),
      opensChooser: panelButton.dataset.chore === 'visit-shop' || Boolean(panelButton.dataset.visit) || panelButton.dataset.key === 'winter-recall' || panelButton.dataset.action === 'survey-start',
    });
    // A refused goal's popup is pinned with its way on (docs/FAMILY_PANEL.md §23); from the keyboard, the way on takes the focus.
    if (step === 'explain') { showPanelTip(panelButton, { pinned: true }); if (event.detail === 0 && panelTipFor?.go) $('#panel-tip-ways .panel-tip-go')?.focus(); return; }
    if (step === 'arm') { showPanelTip(panelButton, { armed: true }); window.__panelArmed = (window.__panelArmed || 0) + 1; return; }
    // Sending for somebody who serves is asked twice, on their card, where there is room to say what it costs.
    // Going to town to trade asks first what to buy and sell (docs/TOWNS.md §4b, owner 2026-09-24): the popup sends the order.
    // The tip over the map waits at once, not on the next second's look (public/tips.js `tipToShow`): never over the popup.
    if (panelButton.dataset.chore === 'visit-shop') { hidePanelTip(); errandPopup.open(panelButton.dataset.entityId, { line: errandWanted }); if (window.__snapshot?.world) renderTip(window.__snapshot.world); return; }
    // A neighbour's homestead is chosen from the Neighbours list, whose *Send … there* is the journey (owner, 2026-09-29: the
    // card that held a list of homesteads and *Go there* is gone).
    if (panelButton.dataset.visit) { hidePanelTip(); openNeighbours(); return; }
    if (panelButton.dataset.key === 'winter-recall') {
      selectedId = panelButton.dataset.entityId; selectionDismissed = false;
      const world = window.__snapshot?.world;
      if (world) { renderSelection(world); document.querySelector('#selection-work [data-action="winter-recall"]')?.focus(); }
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
  if (action === 'survey-start') { surveyFor = button.dataset.entityId; plotJob = button.dataset.chore; plotPick = null; plotFromMap = false; selectedId = null; selectionDismissed = true; suggestedFocus = true; if (window.__snapshot) render(window.__snapshot); return; }
  if (action !== 'start') startAnyway = false;
  if (confirmLabel[confirmKeyOf(button)] && button.dataset.confirming !== 'true') {
    resetConfirm(confirming);
    const key = confirmKeyOf(button);
    button.dataset.label = button.dataset.label || button.textContent;
    button.textContent = confirmLabel[key];
    button.dataset.confirming = 'true';
    button.dataset.confirmKey = key;
    button.dataset.armedAt = String(Date.now());
    confirming = button;
    // The Host's armed button says what it does, on the notice line, until it is pressed again or disarms.
    if (confirmWords[key]) { $('#host-notice').textContent = confirmWords[key]; $('#host-notice').hidden = false; $('#host-notice').dataset.confirmFor = key; }
    confirmTimer = setTimeout(() => resetConfirm(button), 6000);
    return;
  }
  // A double press is not a second thought: leaving for the east with next to nothing waits a moment for the second press.
  if (button.dataset.confirming === 'true' && SLOW_CONFIRM.has(button.dataset.confirmKey) && Date.now() - Number(button.dataset.armedAt || 0) < SLOW_CONFIRM_MS) return;
  resetConfirm(button);
  const world = window.__snapshot?.world;
  // *Take the shot* on a hunter's card is the student's own shot since 2026-10-02 (public/hunt-aim.js): the field opens to aim across.
  // Waiting for it to come closer and leaving it are answered as they always were; the hunter's own shot is what the window's end takes.
  if (action === 'answer-chore' && button.dataset.option === 'take') {
    const hunter = button.dataset.entityId || selectedEntity(world)?.id;
    if (hunter && takeTheShot(world, hunter)) return;
  }
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
    if (action === 'flee') { input.refuge = $('#flight-refuge')?.value; input.take = Object.fromEntries([...document.querySelectorAll('#selection-flight .flight-amount')].map(one => [one.dataset.take, Number(one.value) || 0])); input.route = { stops: [input.refuge], ways: [$('#flight-way')?.value || 'road'] }; }
    // The family's own route, from the editor (sim/flight-route.mjs); closed once the server has it.
    if (action === 'flight-route') input.route = { stops: [...(routeDraft?.stops || [])], ways: [...(routeDraft?.ways || [])] };
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
    if (action === 'flight-route') { routeDraft = null; routePicking = false; routeEditorKey = ''; }
    $('#host-notice').hidden = !(result.archived || result.stopping || result.stoppedForToday);
    if (result.archived) $('#host-notice').textContent = `New class ready. The previous class was archived as ${result.archived}. Share the new class code; students join again.`;
    if (result.stopping) $('#host-notice').textContent = 'Stopping the classroom server. The class was saved and paused.';
    if (result.stoppedForToday) $('#host-notice').textContent = result.stopping
      ? 'Stopped for today. The class was saved and paused where it stands, and the server is closing. Next class, open the Host as usual and press Resume.'
      : 'Stopped for today. The class was saved and paused where it stands. This server cannot close itself from here: stop it in its own window when you are ready. Next class, press Resume.';
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
  // While the film of a fight moves the camera, twice as often, so the glide is smooth (still never more than half the page's time).
  const fps = cinemaFor(world).driving ? 24 : 12;
  if (active && now - lastMapDraw >= Math.max(1000 / fps, animationDrawMs * 2) && now >= handOnMapUntil) {
    paintedFrame = now;
    drawingAnimation = true;
    const began = performance.now(); drawWorld(world); positionSelection(world);
    animationDrawMs = performance.now() - began; drawingAnimation = false;
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
onArtReady((status, sheet) => { redrawForArrival(sheet); repaintFamilyPanel(); });
loadArt();
// The class code a scanned QR code carries (`renderJoinLinks`): put in the join and the away forms, and taken out of the address
// bar, so the student types only their name and the code is not left on the screen.
// The code in the address itself (`addressCode`, above): put in both boxes, and the boxes put away. The address is left as it is,
// so a page reloaded before joining still has it.
if (addressCode) {
  for (const input of codeInputs()) input.value = addressCode;
  showCodeBoxes(false);
}
if (!hostPage && /[?&]code=/.test(location.search)) {
  const scanned = new URLSearchParams(location.search).get('code')?.trim().slice(0, 6) || '';
  for (const input of document.querySelectorAll('#join [name=code], #away [name=away-code]')) if (!input.value) input.value = scanned;
  history.replaceState(null, '', location.pathname);
}
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
