// Renderers consume the server's permitted projection. They never advance simulation state.
import { drawSprite, drawClip, clipInfo, hasSprite, loadArt, onArtReady, pickSprite } from '/art.js';
import { ProjectionMotion, entityClip, travelHeading, travelDirection, figureScale } from '/motion.js';
const $ = selector => document.querySelector(selector);
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
let animationTime = 0, previousFrame = 0, paintedFrame = 0;
function animated(ctx, clip, x, y, size, seed = 0, options = {}) {
  const width = drawClip(ctx, clip, x, y, size, { timeMs: animationTime, seed, reducedMotion: reducedMotion.matches, ...options });
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
const homeOf = world => sitesOf(world).find(site => site.id === world.household?.homeSiteId)?.id || `home-${String(world.householdId || '').split('-').at(-1)}`;
const placeName = (world, id) => world.map?.sites?.[id]?.name || id || 'On the road';
const timeLabel = minutes => minutes < 60 ? `${Math.floor(minutes)} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} hours` : `${(minutes / 1440).toFixed(1)} days`;
function element(tag, content, className) { const el = document.createElement(tag); el.textContent = content; if (className) el.className = className; return el; }
// Teacher actions that discard a class or close the server ask twice, in the page
// itself, so a browser dialog never blocks the projected Host.
const confirmLabel = { 'new-class': 'Confirm new class', 'stop-server': 'Confirm stop' };
let confirming = null, confirmTimer = null, authRecheck = false, startAnyway = false;
// The map is public geography that never changes during a class, so it is fetched once
// and re-attached to each snapshot. A new class rotates the session id and invalidates it.
let mapCache = null, mapCacheId = null, mapPending = null;
// Which change to the homesteads the cached map has (sim/homesite.mjs): a family choosing its house site moves its home and lane.
let mapRevision = 0, homesPending = null;
// The map is the interface: a person is chosen by clicking them, and their instructions
// appear beside them. Nobody selected falls back to the person this household directs.
let selectedId = null, selectionDismissed = false;
const EMPTY_MAP = { sites: {}, routes: {}, terrain: [] };
// The catalogue of work is fixed for a class, so it is fetched once alongside the map.
// Only whether a given person may do a given chore rides on the tick.
let choreCache = null, choreCacheId = null, chorePending = null, modeCache = null;
// What a family can pack, and the wagon's space: fixed for a class, so it comes with the chores.
let wagonCatalogue = null;
// The houses a family can choose, and what each needs and does: fixed too, and fetched the same way.
let houseCatalogue = null;
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
    choreCacheId = result.mapId;
    if (window.__snapshot) render(window.__snapshot);
  }).catch(() => { chorePending = null; });
}
// Who this family is. Fetched once and re-fetched when somebody in it is renamed, on the
// same contract as the map and the chore catalogue: it changes rarely, so it has no
// business on a channel that fires every tick. That lesson has now been learned here three
// times, most recently at about four hundred and fifty bytes a tick.
let familyCache = null, familyCacheId = null, familyPending = null;
function ensureFamily(snapshot) {
  if (!snapshot.mapId || snapshot.world?.role === 'host' || !snapshot.world?.householdId) return;
  if ((familyCache && familyCacheId === snapshot.mapId) || familyPending === snapshot.mapId) return;
  familyPending = snapshot.mapId;
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
    mapCache = result.map; mapCacheId = result.mapId; mapRevision = result.map.revision || 0; reliefCaches.clear();
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
  // A child is drawn smaller than a grown person (stand-in until child art exists; the scale stays).
  if (!entity.side) size *= figureScale(entity);
  const binding = entity.side ? { id: `${entity.side === 'mexican' ? 'regular' : 'volunteer'}-idle-e` } : entityClip(entity, entity.observed);
  // A north or south cycle is drawn facing that way already; mirroring it would turn a
  // person walking away into a person walking away backwards.
  if (animated(ctx, binding.id, x, y, size, entity.id || entity.side, { paused: binding.frozen, flip: binding.upright ? false : entity.flip })) return;
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
  if (entity.travel && animated(ctx, heading ? `${beast}-walk-${heading}` : `${beast}-walk`, x, y, size, entity.id, { flip: heading ? false : flip })) return;
  if (!entity.travel && animated(ctx, beast === 'horse' ? 'horse-chestnut-idle' : 'ox-brown-idle', x, y, size, entity.id, { flip })) return;
  if (drawSprite(ctx, beast === 'horse' ? 'horse-chestnut' : 'ox-brown', x, y, size, { flip })) return;
  groundShadow(ctx, x, y, size * .42);
  ctx.fillStyle = '#815f3e'; ctx.fillRect(x - size * .5, y - size * .62, size, size * .45); ctx.fillRect(x + size * .34, y - size * .88, size * .3, size * .38);
  ctx.fillStyle = '#534830'; for (const leg of [-.36, .28]) ctx.fillRect(x + size * leg, y - size * .22, size * .13, size * .22);
}
function miniWagon(ctx, x, y, size, entity = {}, flip = false) {
  const rolling = entity.travel ? (entity.laden ? 'wagon-loaded-travel' : 'wagon-travel') : 'wagon-idle';
  if (entity.condition === 'sound' && animated(ctx, rolling, x, y, size, entity.id, { flip: !flip })) return;
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
 * A house on a homestead, by what kind it is (docs/SETTLING_IN.md step 4).
 *
 * stand-in: the four houses are drawn from the cabins the library already has - a round-log cabin as
 * the weathered cabin, a hewn-log cabin as the small cabin, a dog-run as the wide cabin, and a jacal
 * as the open shed - and a house going up as the family's camp with felled logs beside it. Requested
 * in docs/ART_REQUESTS.md (houses, 2026-09-12 second request) as per-type exteriors by stage.
 */
const HOUSE_STAND_INS = { 'round-log': 'cabin-weathered', 'hewn-log': 'cabin-small', 'dog-run': 'cabin-wide', jacal: 'shed-open' };
function homesteadHouse(ctx, x, y, size, id, view) {
  if (view.shelter === 'camp') return homesteadCamp(ctx, x, y, size, id);
  if (view.shelter === 'building') {
    homesteadCamp(ctx, x - size * .3, y + size * .1, size * .8, id);
    // stand-in: logs felled for a house, until the construction-stage art arrives.
    drawSprite(ctx, 'log-fallen', x + size * .38, y - size * .08, size * .5);
    drawSprite(ctx, 'log-fallen', x + size * .46, y + size * .08, size * .46);
    return;
  }
  if (view.shelter === 'house' && view.layout && drawSprite(ctx, HOUSE_STAND_INS[view.layout], x, y, size * (view.layout === 'jacal' ? .8 : 1))) return;
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
function postOak(ctx, x, y, size, tint = 0) {
  if (animated(ctx, `${TIMBER_TREES[((tint % 3) + 3) % 3]}-wind`, x, y, size, tint)) return;
  if (drawSprite(ctx, TIMBER_TREES[((tint % 3) + 3) % 3], x, y, size)) return;
  ctx.fillStyle = '#6a4a33';
  ctx.fillRect(x - size * .09, y - size * .5, size * .18, size * .5);
  const greens = ['#5f8a48', '#6d9a52', '#57803f'];
  // A negative tint must not index off the end: an undefined fill silently keeps the trunk colour.
  ctx.fillStyle = greens[((tint % greens.length) + greens.length) % greens.length];
  for (const [dx, dy, r] of [[-.42, -1.12, .46], [.4, -1.10, .44], [0, -1.36, .54], [0, -1.0, .48]]) {
    ctx.beginPath(); ctx.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2); ctx.fill();
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
function drawEntity(ctx, entity, point, named, size = 20, marks = {}) {
  // Cosmetic separation only. Overlapping drawings must never imply different true positions.
  const spread = size / 26;
  // On the road a person is drawn exactly where the server says they are. Their ox and
  // their wagon are at the same point on the same road, so without this they would be
  // drawn standing inside each other; a hand's width apart reads as a family travelling
  // together and still never claims a different true position.
  const offset = entity.travel
    ? (entity.kind === 'wagon' ? { x: -2.4, y: .5 } : entity.kind === 'animal' ? { x: -1.1, y: .2 } : { x: 0, y: 0 })
    : stableOffset(entity.id);
  const x = point.x + offset.x * spread, y = point.y + offset.y * spread * .8;
  // Everything is drawn standing on (x, y), so `size` is a height and the click target
  // is the body above that point, not a circle centred on the feet.
  const height = size * (entity.kind === 'animal' ? (entity.species === 'horse' ? SIZE.horse : SIZE.ox) : entity.kind === 'wagon' ? SIZE.wagon : 1);
  drawnAt.set(entity.id, { x, y: y - height * .45, size: height });
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
  if (entity.kind === 'person') miniPerson(ctx, x, y, size, { ...entity, observed: marks.observed, flip });
  else if (entity.kind === 'animal') miniAnimal(ctx, x, y, height, entity, flip);
  else if (entity.kind === 'wagon') miniWagon(ctx, x, y, height, entity, flip);
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
  // Something is being asked of this person. The mark is the invitation; clicking is the
  // answer, so it is collected and drawn last: a cabin roof standing between the camera
  // and a person must never hide the one thing on screen asking to be pressed.
  if (marks.mark) marks.mark.list.push({ id: entity.id, kind: marks.mark.kind || 'task', x, y: y - height, size, glyph: marks.mark.glyph, tone: marks.mark.tone });
  // The label sits just under the feet whatever the zoom - scaling the offset with the
  // sprite would fling a name a screen's width below a close-up figure - and it is
  // handed back rather than drawn, because the ox drawn after this person would
  // otherwise stand on their name.
  if (named || entity.principal) {
    marks.labels?.push({
      name: entity.name || entity.id, x, y: y + Math.max(13, Math.min(26, size * .22)),
      font: `${Math.round(Math.max(11, Math.min(16, size * .26)))}px system-ui`,
    });
  }
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
// Which person, if any, has something waiting for them.
const taskFor = (world, entity) => {
  const request = world.request;
  if (request?.status !== 'open') return null;
  // Everybody who could answer it, each with their own prices. A class served by an older
  // server has no `answerers`, and there the call was the principal's or the march's person's.
  if (request.answerers) return request.answerers[entity.id] ? { ...request, options: request.answerers[entity.id] } : null;
  const asked = request.actorId || world.household?.principalId;
  return entity.id === asked ? request : null;
};
// How far word has travelled from the person who saw it, said the way a person would say
// it. Beyond the third hand nobody counts, they just know it has been about.
const handLabel = hands => hands === 1 ? 'second-hand' : hands === 2 ? 'third-hand' : `through ${hands} hands`;
// Who, if anybody, is standing with a rider right now. A meeting is the household's, but
// it belongs to one named person: the one the rider actually stopped for.
const meetingFor = (world, entity) => {
  const encounter = world.encounter;
  return encounter?.status === 'open' && encounter.listenerId === entity.id ? encounter : null;
};
export function selectedEntity(world) {
  const own = entitiesOf(world);
  return own.find(entity => entity.id === selectedId)
    || observedOf(world).find(entity => entity.id === selectedId)
    || own.find(entity => entity.id === world.household?.principalId) || null;
}
function entityAt(point) {
  let best = null, bestDistance = Infinity;
  for (const [id, spot] of drawnAt) {
    // Reach must not grow with the sprite, or a zoomed-in ox swallows the clicks meant
    // for the person standing next to it. It must not shrink below a fingertip either.
    const reach = Math.max(22, Math.min(64, spot.size * .55));
    const distance = Math.hypot(spot.x - point.x, spot.y - point.y);
    if (distance < reach && distance < bestDistance) { best = id; bestDistance = distance; }
  }
  return best;
}
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
// See `figure` in cameraFor: the symbolic size of a person, in miles of ground.
const PERSON_MILES = 0.115;
// Below this many screen pixels per world mile, a neighbour's homestead is smaller than
// the label that would sit on it. Fords and other minor names thin out at the same point.
const HOMESTEAD_LEGIBLE = 11;
// Every drawn object as a multiple of a person, so the whole scene grows together and
// an ox never ends up smaller than the family leading it.
const SIZE = {
  cabin: 3.3, settlementCabin: 2.5, camp: 2.1,
  timberTree: 1.95, loneTree: 2.05, sapling: 1.15, scrub: 1.0,
  tuft: .6, rock: .5, crop: .95,
  ox: 1.45, horse: 1.5, wagon: 1.55,
};
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
/**
 * How each person goes, remembered per person rather than for the whole family.
 *
 * Rosa taking the wagon to the timber must not put Thomas on it too - there is one wagon,
 * and a shared setting would silently propose the impossible. Nothing here decides what
 * is allowed: the server sends every way with the reason for any that are shut, and this
 * only remembers which of the open ones was last pressed.
 */
const travelModeByEntity = new Map();
const modeFor = id => travelModeByEntity.get(id) || 'foot';
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
  return { min: cover, max: Math.max(cover * 30, canvas.width / 1.6) };
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
  const sites = sitesOf(world), home = world.map?.sites?.[homeOf(world)];
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
function cameraFor(world, canvas) {
  const auto = autoView(world, canvas), limits = scaleLimits(world, canvas);
  // Watching somebody beats both the automatic frame and a remembered pan, and it reads
  // their drawn position rather than their last reported one, so the view walks with them
  // instead of jumping once a tick.
  const watched = watchedId ? entitiesOf(world).find(entity => entity.id === watchedId) : null;
  const at = watched?.location
    ? motionProjection.position(watched, performance.now(), reducedMotion.matches || world.status !== 'running')
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
    named: scale > 3.2,
  };
}
// Pointer events cover mouse, touch and stylus with one path, so a Chromebook trackpad
// and a phone get the same panning without a separate touch implementation.
function fitCanvas() {
  const canvas = $('#world-map'), rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(Math.min(2200, rect.width * ratio)), height = Math.round(Math.min(2200, rect.height * ratio));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width; canvas.height = height;
  return true;
}
function installMapNavigation() {
  const canvas = $('#world-map');
  fitCanvas();
  window.addEventListener('resize', () => { if (fitCanvas() && window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); } });
  const active = new Map();
  let anchor = null;
  const localPoint = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };
  const currentView = () => {
    const snapshot = window.__snapshot; if (!snapshot) return null;
    const camera = cameraFor(snapshot.world, canvas);
    return { cx: camera.cx, cy: camera.cy, scale: camera.scale, limits: camera.limits };
  };
  const centre = () => {
    const points = [...active.values()];
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  };
  const spread = () => {
    const points = [...active.values()];
    return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  const beginGesture = () => {
    const view = currentView(); if (!view) return;
    anchor = { view, screen: centre(), spread: spread() };
  };
  let pressedAt = null, travelled = 0;
  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture(event.pointerId);
    active.set(event.pointerId, localPoint(event));
    if (active.size === 1) { pressedAt = localPoint(event); travelled = 0; }
    beginGesture();
  });
  canvas.addEventListener('pointermove', event => {
    if (!active.has(event.pointerId) || !anchor) return;
    active.set(event.pointerId, localPoint(event));
    const scale = anchor.spread > 12 && spread() > 12 ? clampTo(anchor.view.scale * spread() / anchor.spread, anchor.view.limits) : anchor.view.scale;
    const moved = centre();
    if (pressedAt) travelled = Math.max(travelled, Math.hypot(moved.x - pressedAt.x, moved.y - pressedAt.y));
    // Taking hold of the map is taking the camera back.
    stopWatching();
    manualView = {
      scale,
      cx: anchor.view.cx + (anchor.screen.x - moved.x) / scale,
      cy: anchor.view.cy + (anchor.screen.y - moved.y) / scale,
    };
    if (window.__snapshot) drawWorld(window.__snapshot.world);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    canvas.addEventListener(type, event => {
      // A tap that did not drag is a choice of person, not a pan.
      if (type === 'pointerup' && pressedAt && travelled < 7 && active.size === 1 && siteLooking()) {
        // Looking over the family's own land for a house site: a tap is a place, not a person.
        const view = currentView(), at = localPoint(event);
        if (view) lookAtSite({ x: view.cx + (at.x - canvas.width / 2) / view.scale, y: view.cy + (at.y - canvas.height / 2) / view.scale });
      } else if (type === 'pointerup' && pressedAt && travelled < 7 && active.size === 1) {
        const hit = entityAt(localPoint(event));
        selectedId = hit;
        selectionDismissed = !hit;
        if (window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); renderTutorial(window.__snapshot.world); }
      }
      active.delete(event.pointerId);
      if (!active.size) pressedAt = null;
      anchor = active.size ? (beginGesture(), anchor) : null;
    });
  }
  canvas.addEventListener('wheel', event => {
    const view = currentView(); if (!view) return;
    event.preventDefault();
    const scale = clampTo(view.scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), view.limits);
    // Keep the point under the cursor still, so zooming feels like a map and not a slideshow.
    const point = localPoint(event);
    stopWatching();
    manualView = {
      scale,
      cx: view.cx + (point.x - canvas.width / 2) * (1 / view.scale - 1 / scale),
      cy: view.cy + (point.y - canvas.height / 2) * (1 / view.scale - 1 / scale),
    };
    drawWorld(window.__snapshot.world);
  }, { passive: false });
}
function applyMapView(action) {
  const snapshot = window.__snapshot; if (!snapshot) return;
  const world = snapshot.world, canvas = $('#world-map');
  if (action === 'follow') { manualView = null; stopWatching(); drawWorld(world); return; }
  const view = cameraFor(world, canvas);
  if (action === 'in' || action === 'out') {
    manualView = { cx: view.cx, cy: view.cy, scale: clampTo(view.scale * (action === 'in' ? 1.4 : 1 / 1.4), view.limits) };
  } else {
    const site = world.map?.sites?.[action === 'home' ? homeOf(world) : action];
    if (!site) return;
    manualView = { cx: site.x, cy: site.y, scale: clampTo(Math.max(view.scale, view.limits.max * .45), view.limits) };
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
function paintRelief(ctx, grid, camera, key) {
  if (!grid?.values?.length) return false;
  const topLeft = camera.toScreen({ x: grid.minX, y: grid.minY });
  const bottomRight = camera.toScreen({ x: grid.minX + grid.cellX * (grid.columns - 1), y: grid.minY + grid.cellY * (grid.rows - 1) });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(reliefImage(grid, key), topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  return true;
}
// The province underneath, the home country painted over it. One world, one camera; only
// the density of what is drawn changes with distance.
const PROVINCE_COVER = {
  forest: '#7f9166', savannah: '#a9b681', prairie: '#c0c68f', marsh: '#9fb195',
  brush: '#b4ac81', plateau: '#c2b891',
};
function drawProvince(ctx, world, camera) {
  const province = world.map?.province;
  if (!province) return false;
  const painted = paintRelief(ctx, province.relief, camera, 'province');
  ctx.globalAlpha = .5;
  for (const belt of province.belts) {
    const points = belt.points.map(camera.toScreen);
    ctx.fillStyle = PROVINCE_COVER[belt.cover] || '#b0bb8c';
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
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
  stroke(province.escarpment, '#9a9070', Math.max(1, camera.scale * .6), [9, 7]);
  for (const road of province.roads) stroke(road.points, '#b9a97f', Math.max(1, camera.scale * .5), [8, 6]);
  for (const river of province.rivers) stroke(river.points, '#8fb0bd', Math.max(1.2, river.width * camera.scale * .5));
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
  return painted;
}
// The colony's own shaded relief is a small rectangle laid over the province's. Its edges
// are square, so once the camera pulls back it stops reading as ground and starts reading
// as a block of the wrong colour floating in open prairie. Fade it with distance: by the
// time the whole country is on screen, the province's continuous relief is all that is
// left, and there is no seam to see.
export const HOME_RELIEF_GONE = 7, HOME_RELIEF_FULL = 18;
export const homeReliefOpacity = scale =>
  Math.max(0, Math.min(1, (scale - HOME_RELIEF_GONE) / (HOME_RELIEF_FULL - HOME_RELIEF_GONE)));
function drawRelief(ctx, world, camera) {
  drawProvince(ctx, world, camera);
  const opacity = homeReliefOpacity(camera.scale);
  if (opacity <= 0) return false;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const painted = paintRelief(ctx, world.map?.relief, camera, 'home');
  ctx.restore();
  return painted;
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
// Close in, open country is not a flat wash. Tufts, stones and lone post oaks are keyed
// to their position in the world, so they sit still while the camera moves over them.
function groundHash(cx, cy) {
  let value = Math.imul(cx ^ 0x27d4eb2f, 0x165667b1) ^ Math.imul(cy ^ 0x9e3779b9, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0x2c1b3c6d);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
function drawGroundDetail(ctx, world, camera) {
  if (camera.scale < 34) return;
  const canvas = ctx.canvas;
  const topLeft = camera.toWorld({ x: 0, y: 0 }), bottomRight = camera.toWorld({ x: canvas.width, y: canvas.height });
  const cell = 0.055;
  const startX = Math.floor(topLeft.x / cell), endX = Math.ceil(bottomRight.x / cell);
  const startY = Math.floor(topLeft.y / cell), endY = Math.ceil(bottomRight.y / cell);
  const cells = (endX - startX + 1) * (endY - startY + 1);
  if (cells > 26000) return;
  const figure = camera.figure;
  // There is a ceiling on how many objects one frame can afford. Spending it top to
  // bottom and stopping when it runs out leaves the lower half of a tall phone screen
  // as bare paint, so thin the whole viewport evenly instead: fewer objects per acre,
  // over all of it. `share` then reads the kind out of the roll independently of how
  // hard it was thinned, or a sparse view would turn every surviving tuft into an oak.
  const density = Math.min(.105, 400 / Math.max(1, cells));
  const scattered = [];
  for (let cy = startY; cy <= endY; cy++) {
    for (let cx = startX; cx <= endX; cx++) {
      const roll = groundHash(cx, cy);
      if (roll > density) continue;
      const jitter = groundHash(cx + 8191, cy - 5077);
      // Kind is independent of LOD density: panning or zooming cannot turn a tuft into a tree.
      scattered.push({ share: groundHash(cx+973,cy-997), seed: cx + cy, point: camera.toScreen({ x: (cx + jitter) * cell, y: (cy + groundHash(cx - 331, cy + 977)) * cell }) });
    }
  }
  // Painted back to front, so a tuft in front of a rock overlaps it rather than being
  // cut in half by it.
  scattered.sort((a, b) => a.point.y - b.point.y);
  for (const { share, seed, point } of scattered) {
    if (share < .055 && camera.scale > 90) {
      // A lone open-grown oak standing out of the prairie.
      postOak(ctx, point.x, point.y, figure * SIZE.loneTree, seed);
    } else if (share < .095) {
      if (!drawSprite(ctx, 'rocks', point.x, point.y, figure * SIZE.rock)) {
        ctx.fillStyle = '#b9b7a4';
        ctx.beginPath(); ctx.ellipse(point.x, point.y, figure * .17, figure * .12, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (share < .21) {
      // Thorny scrub and prickly pear belong to this country as much as the grass does.
      const bush = share < .17 ? 'scrub' : 'prickly-pear';
      if (!drawSprite(ctx, bush, point.x, point.y, figure * SIZE.scrub)) {
        ctx.fillStyle = '#7c8f5c';
        ctx.beginPath(); ctx.ellipse(point.x, point.y - figure * .12, figure * .26, figure * .2, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (!drawSprite(ctx, 'grass-tuft', point.x, point.y, figure * SIZE.tuft)) {
      // A tuft of bunch grass (HIST-GONZ-017).
      ctx.strokeStyle = share < .5 ? '#93a066' : '#87975d';
      ctx.lineWidth = Math.max(.7, figure * .07); ctx.lineCap = 'round';
      ctx.beginPath();
      for (const lean of [-.22, 0, .22]) {
        ctx.moveTo(point.x + lean * figure * .3, point.y);
        ctx.lineTo(point.x + lean * figure * .9, point.y - figure * .26);
      }
      ctx.stroke();
    }
  }
}
function drawTerrain(ctx, world, camera) {
  const figure = camera.figure;
  for (const feature of world.map?.terrain || []) {
    const style = TERRAIN_STYLE[feature.kind]; if (!style) continue;
    let points = (feature.points || []).map(camera.toScreen); if (points.length < 2) continue;
    if (!style.fill) {
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      // On the real land (docs/COLONIES.md) a river's course is its true meandering course, and drawn at the invented
      // map's width every bend runs into the next like a flood. There it is drawn near its true width: about eighty
      // metres for a river and a few metres for a creek, never thinner than a readable line.
      const trueWidth = world.map?.source ? Math.max(feature.kind === 'river' ? 2.2 : 1.1, (feature.kind === 'river' ? 0.05 : 0.012) * camera.scale) : null;
      ctx.strokeStyle = style.stroke; ctx.lineWidth = trueWidth ?? Math.max(1.5, Math.min(26, style.width * camera.scale * .55));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      continue;
    }
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.save();
    // Timber has no edge you could walk up to and touch. Drawn at full strength its
    // polygon reads as a ruled wedge of darker paint across the prairie, so the fill is
    // only a tint and the trees standing in it do the work of saying where the wood is.
    if (feature.kind === 'woods') ctx.globalAlpha *= camera.scale > 26 ? 0 : .4;
    // The commons is trodden ground, not a paved square. Same reason, same treatment.
    else if (feature.kind === 'town') ctx.globalAlpha *= .5;
    ctx.fillStyle = style.fill; ctx.fill();
    ctx.restore();
    if (feature.kind === 'field') {
      // Corn and cotton in rows, and the split-rail fence that kept stock out of them
      // (HIST-GONZ-013).
      // A field is as big as the family has made it. The polygon on the map is the whole
      // labor of ground a household holds; what is drawn worked is the share of it that
      // has actually been broken, growing out of the corner nearest the cabin. The map
      // itself never changes - it is fetched once a class - so the size has to come from
      // the household, which is authoritative and arrives every tick.
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const edgeLeft = Math.min(...xs), edgeRight = Math.max(...xs);
      const edgeTop = Math.min(...ys), edgeBottom = Math.max(...ys);
      const ownLand = world.household && feature.ownerHouseholdId === world.household.id ? world.household : null;
      const worked = Math.sqrt((ownLand ? (world.land?.cleared ?? 1) : 1) / (world.land?.clearingMax ?? 4));
      const left = edgeLeft, top = edgeTop;
      const right = edgeLeft + (edgeRight - edgeLeft) * worked;
      const bottom = edgeTop + (edgeBottom - edgeTop) * worked;
      points = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      const spacing = Math.max(4, camera.scale * .045);
      // What is standing in the field is what the household actually planted. It used to
      // be picked from the field's id, which looked the same but asserted a crop the
      // world had never modelled - exactly the thing the terrain rule forbids.
      const own = world.household?.field && feature.ownerHouseholdId === world.household.id ? world.household.field : null;
      const crop = own ? `${own.crop}-${own.state === 'ripe' ? 'mature' : 'young'}` : null;
      const bare = !own || own.state === 'bare';
      const plants = !bare && hasSprite(crop) && figure * SIZE.crop > 9;
      if (bare) {
        // Turned earth. Nothing is growing, and nothing is drawn growing.
        ctx.fillStyle = 'rgba(150,124,86,.45)'; ctx.fill();
        ctx.save();ctx.clip();ctx.strokeStyle='rgba(117,85,49,.24)';ctx.lineWidth=Math.max(1,figure*.045);
        for(let y=top+spacing;y<bottom;y+=Math.max(7,spacing)){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}
        ctx.restore();
      } else if (spacing > 4.5 && right - left > 12) {
        ctx.strokeStyle = '#8a9350'; ctx.lineWidth = Math.max(1, spacing * .28);
        const step = plants ? Math.max(spacing, figure * SIZE.crop * .62) : spacing;
        for (let rowY = top + step; rowY < bottom - step * .4; rowY += step) {
          if (!plants) {
            ctx.beginPath(); ctx.moveTo(left + spacing * .5, rowY); ctx.lineTo(right - spacing * .5, rowY); ctx.stroke();
            continue;
          }
          for (let plantX = left + step * .6; plantX < right - step * .3; plantX += step * .8) {
            drawSprite(ctx, crop, plantX, rowY, figure * SIZE.crop);
          }
        }
      }
      // The rail fence used to be drawn round every field unconditionally, which was a
      // picture of something the world had never modelled. A family starts without one,
      // splits rails to raise it, and until they do the stock are in the crop.
      const fence = feature.ownerHouseholdId === world.household?.id ? world.land?.fence : 'sound';
      if (camera.scale > 40 && fence && fence !== 'none') railFence(ctx, points, figure, fence === 'ruined');
      // How big this family's field was actually drawn, and what was round it. Same
      // contract as `window.__drawnAt`: presentation evidence, read by proofs and by
      // nothing in the application. A field that grows is the only visible sign that an
      // afternoon of clearing happened, and "did it grow" is not a question the
      // projection can answer - the map polygon never changes.
      if (ownLand) window.__fieldRect = { x: left, y: top, width: right - left, height: bottom - top, fence, cleared: world.land?.cleared ?? 1 };
    } else if (feature.kind === 'woods' && camera.scale > 26) {
      // Close in, timber resolves into individual trees rather than a green wash. Timber
      // follows the water here, so a share of it is drawn as river-bottom cottonwood
      // rather than making every stand the same upland oak (HIST-GONZ-012).
      const area = Math.abs(points.reduce((sum, p, i) => sum + (p.x * points[(i + 1) % points.length].y - points[(i + 1) % points.length].x * p.y), 0) / 2);
      const count = Math.min(64, Math.round(area / Math.max(900, figure * figure * 9)));
      const stand = scatterInside(points, seedOf(feature.id), count).sort((a, b) => a.y - b.y);
      for (const spot of stand) {
        if (spot.tint % 5 === 3) { if (drawSprite(ctx, 'cottonwood', spot.x, spot.y, figure * SIZE.timberTree * 1.12)) continue; }
        else if (spot.tint % 7 === 5) { if (drawSprite(ctx, 'sapling', spot.x, spot.y, figure * SIZE.sapling)) continue; }
        postOak(ctx, spot.x, spot.y, figure * SIZE.timberTree, spot.tint);
      }
    }
  }
}
/**
 * The land the family holds, as a boundary on its own map (docs/LAND_GRANTS.md). Only its own: a
 * neighbour's grant is theirs to know. Marked with a dashed line of survey-chain brown, because no
 * fence or marker stands on it yet.
 */
/** The place the family is looking over for its house, as a stake on its own land. */
function drawSitePick(ctx, world, camera) {
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
  // Presentation evidence for proofs, on the same contract as `window.__fieldRect`.
  window.__holdingRect = { kind: holding.kind, acres: holding.acres, corners };
}
export function drawWorld(world) {
  window.__animationClips = new Set();
  const canvas = $('#world-map'), ctx = canvas.getContext('2d');
  fitCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#9fbe73'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const camera = cameraFor(world, canvas);
  window.__camera = { kind: camera.kind, scale: camera.scale, named: camera.named, cx: camera.cx, cy: camera.cy, following: camera.following };
  window.__relief = drawRelief(ctx, world, camera);
  drawGroundDetail(ctx, world, camera);
  drawTerrain(ctx, world, camera);
  drawHolding(ctx, world, camera);
  // Worn dirt, not a drafting line: a soft verge with a packed track down the middle.
  for (const route of Object.values(world.map?.routes || {})) {
    const points = (route.points || []).filter(Boolean).map(camera.toScreen); if (points.length < 2) continue;
    const track = route.kind === 'track' ? .55 : 1;
    const width = Math.max(2, Math.min(46, camera.scale * .06 * track + camera.figure * .22));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = '#a8a173'; ctx.lineWidth = width * 1.5; ctx.stroke();
    ctx.strokeStyle = '#c6b183'; ctx.lineWidth = width; ctx.stroke();
  }
  const homeId = homeOf(world);
  // Buildings and people share one back-to-front order, so a family standing south of
  // their cabin is in front of it and one standing north is behind it. Sorting the two
  // separately would put every person on top of every roof in the county.
  const labels = [];
  const standing = [];
  for (const site of sitesOf(world)) {
    // A road junction is a shape in the network, not a place: it must never draw a building.
    if (site.kind === 'junction') continue;
    const q = camera.toScreen(site), settlement = site.kind === 'town' || site.id === 'gonzales';
    // A colony fifteen miles across is fifty pixels wide at province scale, and sixteen
    // holdings drawn inside it are one brown smudge with the labels piled on top. Another
    // family's homestead is drawn only once it would be legible on its own; the student's
    // own land and the town are always drawn, because those are the two places that mean
    // anything at that distance. Nothing is hidden that the student could act on: a
    // neighbour's cabin is scenery, and their people are reached by standing with them.
    const ownLand = site.id === homeId;
    if (site.kind === 'homestead' && !ownLand && camera.scale < HOMESTEAD_LEGIBLE) continue;
    if (settlement || site.kind === 'homestead' || !site.kind) {
      const size = Math.max(5, camera.figure * (settlement ? SIZE.settlementCabin : SIZE.cabin));
      // What is on this land, as this family knows it: its own as it is, a neighbour's as it was
      // last seen, and one nobody has been to see as it was at dawn on the 28th - a camp, in a class
      // that began with the families arriving (sim/houses.mjs, `noteLandSeen`).
      const view = settlement ? null : ownLand && world.land ? ownLandView(world.land) : (world.household?.seenLand?.[site.id] || (world.arrivalClass ? { shelter: 'camp' } : { shelter: 'house' }));
      standing.push({ y: q.y, draw: () => view ? homesteadHouse(ctx, q.x, q.y, size, site.id, view) : miniBuilding(ctx, q.x, q.y, size, true, site.id) });
      // stand-in: the family's cattle and hogs as two oxen grazing past the house, until the stock art
      // arrives (docs/ART_REQUESTS.md, stock 2026-09-13). Own land only: the herd is not an entity yet.
      if (ownLand && world.household?.stock && world.land && !world.land.arriving) {
        for (const [dx, dy, flip] of [[1.25, .35, false], [1.7, .55, true]]) {
          const x = q.x + size * dx, y = q.y + size * dy;
          standing.push({ y, draw: () => drawSprite(ctx, 'ox-brown', x, y, size * .55, { flip }) });
        }
      }
    } else if (site.kind === 'ford') {
      // The crossing is drawn as a break in the bank, not as a building or a bridge.
      const width = Math.max(6, camera.figure * .9);
      ctx.strokeStyle = '#cbbb92'; ctx.lineWidth = Math.max(2, Math.min(11, camera.figure * .16)); ctx.setLineDash([Math.max(3, camera.figure * .22), Math.max(3, camera.figure * .22)]);
      ctx.beginPath(); ctx.moveTo(q.x - width, q.y); ctx.lineTo(q.x + width, q.y); ctx.stroke(); ctx.setLineDash([]);
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
    const worthNaming = settlement || ownLand || (camera.scale >= HOMESTEAD_LEGIBLE && (site.kind === 'ford' || (camera.named && site.kind !== 'camp')));
    // A place name goes above its buildings. Below is where the family stands, and a
    // homestead's own name landing on top of four people and an ox is unreadable.
    if (worthNaming) {
      const roof = site.kind === "ford" ? -10 : camera.figure * (settlement ? SIZE.settlementCabin * 1.5 : SIZE.cabin) + 6;
      // A family's own place is "Home". The map was generated when every household was
      // called Family N and it is fetched once a class, so it cannot follow a rename -
      // but nobody calls their own house by its number, and this is the one label that
      // was reading as a leftover once families started having names.
      labels.push({ name: ownLand ? 'Home' : site.name, x: q.x, y: q.y - Math.max(12, roof) });
    }
  }
  const entities = entitiesOf(world).filter(entity => entity.location);
  // Everyone else standing where your family is standing. Drawn plainly, never with a
  // request mark and never with a selection ring that implies you can order them.
  const observed = observedOf(world).filter(entity => entity.location);
  drawnAt.clear();
  const chosen = selectedEntity(world);
  const pending = [];
  // Six names around one cabin is a smear, not information. Below this size - which a
  // phone at the default framing is - only the principal is named; the rest are reached
  // by clicking them, and the hidden roster still lists every one of them by name.
  const roomForNames = camera.named && camera.figure > 34;
  for (const entity of entities) {
    const point = camera.toScreen(motionProjection.position(entity, performance.now(), reducedMotion.matches || world.status !== 'running'));
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
    standing.push({ y: point.y, draw: () => drawEntity(ctx, entity, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark,
      labels, heading: destination ? destination.x - entity.location.x : 0,
    }) });
  }
  for (const entity of observed) {
    const point = camera.toScreen(motionProjection.position(entity, performance.now(), reducedMotion.matches || world.status !== 'running'));
    standing.push({ y: point.y, draw: () => drawEntity(ctx, { ...entity, health: { condition: entity.condition } }, point, roomForNames, camera.figure, {
      selected: entity.id === chosen?.id, mark: null, labels, observed: true,
    }) });
  }
  standing.sort((a, b) => a.y - b.y);
  for (const item of standing) item.draw();
  const placeFont = `${Math.round(Math.max(11, Math.min(16, camera.scale * 1.1)))}px system-ui`;
  for (const label of labels) { ctx.font = label.font || placeFont; caption(ctx, label.name, label.x, label.y); }
  for (const mark of pending) drawTaskMark(ctx, mark);
  // Who was marked as having somebody waiting on them, and why. Presentation evidence on
  // the same contract as `__viewEntities` and `__drawnAt`: read by proofs and by nothing
  // in the application. It exists because the invitation to listen to a rider is now a
  // mark over a person in the world rather than a card in the corner of the screen, and
  // "is the invitation actually there" is not a question a projection can answer.
  window.__viewMarks = pending.map(mark => ({ id: mark.id, kind: mark.kind }));
  window.__viewFormations = drawFormations(ctx, world.battle, camera.toScreen, camera.named, world.tick, camera.figure);
  canvas.dataset.formationIds = window.__viewFormations.join(' ');
  window.__viewEntities = entities.map(entity => entity.id);
  // Where each figure was actually drawn this frame, and how tall it was drawn, in screen
  // pixels. The same contract as `__viewEntities` and `__animationClips`: presentation
  // evidence, read by proofs and by nothing in the application. It exists because the one
  // question worth asking about motion - how fast does a person cross the screen relative
  // to their own size - cannot be answered from the projection, which only moves once a
  // tick while the figure is drawn every frame between.
  window.__drawnAt = Object.fromEntries([...drawnAt].map(([id, spot]) => [id, { x: spot.x, y: spot.y, size: spot.size }]));
  // Presentation evidence, same contract as __viewEntities: who was drawn because they
  // were seen, kept as a separate list so a proof can tell the two apart.
  window.__viewObserved = observed.map(entity => entity.id);
  // The stake goes in over everything else on the ground, so the place being looked at is never hidden under a road or a cow.
  drawSitePick(ctx, world, camera);
  const travellers = entities.filter(entity => entity.travel);
  const here = entities.filter(entity => entity.location.siteId).map(entity => `${entity.name} (${entity.task || entity.kind})`);
  const journey = travellers.map(entity => `${entity.name} is on the road to ${placeName(world, entity.travel.to)}, about ${Math.round((entity.travel.progress || 0) / (entity.travel.distance || 1) * 100)}% of the way.`).join(' ');
  const settled = here.length ? `At ${placeName(world, entities.find(e => e.location.siteId)?.location.siteId)}: ${here.join(', ')}.` : '';
  const met = observed.length
    ? ` Also here: ${observed.map(e => `${e.name}${e.resident ? ' of Gonzales' : ''}`).join(', ')}.`
    : '';
  const battleText = window.__viewFormations.length ? ` ${world.battle.caption} Miniature groups show the opposing formations.` : '';
  const meeting = world.encounter?.status === 'open'
    ? ` ${entities.find(e => e.id === world.encounter.listenerId)?.name || 'Someone'} has met a rider, who has stopped to speak with them.`
    : '';
  $('#world-description').textContent = `${settled}${met} ${journey}${meeting}${battleText}`.trim() || 'The world will appear when the class begins.';
  const follow = $('#map-nav [data-view=follow]');
  if (follow) {
    follow.dataset.active = String(camera.following);
    // Naming who is being watched, because a camera that has stopped following the family
    // should say why rather than leaving a student to wonder where everyone went.
    const watched = watchedId ? entities.find(entity => entity.id === watchedId) : null;
    follow.textContent = camera.following ? 'Following' : watched ? `Watching ${watched.name}` : 'Follow';
  }
  $('#map-title').textContent = camera.title;
  $('#map-framing').textContent = 'Prototype · fictional families';
  canvas.setAttribute('aria-label', $('#world-description').textContent);
}
function renderHousehold(world) {
  const household = world.household;
  if (!household) { $('#selection').hidden = true; $('#food').textContent = ''; $('#supplies').textContent = ''; return; }
  $('#family-title').textContent = familyCache?.name || 'Your family';
  renderFamilyBook();
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
    const button = element('button', `${entity.name}: ${entity.task || 'resting'}, ${entity.travel ? `on the road to ${placeName(world, entity.travel.to)}` : placeName(world, entity.location?.siteId)}, ${entity.health?.condition || 'well'}${taskFor(world, entity) ? '. Someone is asking for help.' : ''}${meeting ? '. A rider has stopped to speak with them.' : ''}${entity.chore?.ask ? '. Waiting on your word.' : ''}`);
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
    const who = entity.resident ? 'of Gonzales' : entity.household ? `of ${entity.household}` : 'passing through';
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
    const li = element('li', land.arriving
      ? `Their land: they are still on the road in with the wagon.${camp}`
      : land.cabin === 'ruined'
      ? `Their land: the cabin is gone. Ground broken ${land.cleared} of a possible ${land.clearingMax}.`
      : `Their land: ground broken ${land.cleared} of a possible ${land.clearingMax}${land.fence === 'sound' ? ', the field fenced' : land.fence === 'ruined' ? ', the fence pulled down' : ', no fence round the crop'}.${camp}`);
    li.dataset.land = 'true';
    li.dataset.cleared = String(land.cleared);
    li.dataset.fence = land.fence;
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
  $('#property').replaceChildren(...ground, ...cargo, ...property.map(entity => { const li = element('li', `${entity.name}: ${entity.kind} at ${placeName(world, entity.location?.siteId)}`); li.dataset.entityId = entity.id; return li; }));
  const memory = world.events || [];
  $('#event-log').replaceChildren(...memory.slice(-12).reverse().map(event => { const li = element('li', `${event.text || event.type} (${timeLabel(event.minute ?? 0)} into the story)`); li.dataset.eventId = event.id; return li; }));
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
function renderTravelModes(world, chosen, settable) {
  const wrap = $('#selection-travel'), host = $('#travel-modes');
  const offered = world.travelModes?.[chosen.id];
  // And not while somebody is standing in a wood waiting to be answered. How they would
  // set out on the next journey is not an answer to the question in front of them, and a
  // greyed-out row of it above the question is clutter at the one moment that matters.
  if (!offered?.length || chosen.observed || world.role === 'host' || chosen.chore?.ask) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const open = offered.find(entry => entry.id === modeFor(chosen.id) && entry.can);
  if (!open) travelModeByEntity.delete(chosen.id);
  const picked = modeFor(chosen.id);
  host.replaceChildren(...offered.map(entry => {
    const spec = modeCache?.get(entry.id);
    const button = element('button', spec?.name || entry.id);
    button.dataset.mode = entry.id;
    button.type = 'button';
    // On the road the choice has already been made; it is shown, not offered.
    button.disabled = !settable || !entry.can || Boolean(chosen.travel) || Boolean(chosen.chore);
    button.setAttribute('aria-pressed', String(entry.id === picked));
    button.title = entry.can ? (spec?.describe || '') : entry.why;
    return button;
  }));
  const chosenSpec = modeCache?.get(picked);
  const shut = offered.find(entry => entry.id !== picked && !entry.can);
  $('#travel-note').textContent = chosen.travel
    ? ''
    : chosenSpec?.describe || (shut ? shut.why : '');
}
function renderWork(world, chosen, running) {
  const panel = $('#selection-work');
  const key = JSON.stringify([chosen.id, running, modeFor(chosen.id), world.land, chosen.health?.condition, Boolean(chosen.chore), chosen.chore?.ask?.openedMinute ?? null,
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
  const permitted = world.work?.[chosen.id];
  if (!permitted?.length || !choreCache || chosen.health?.condition === 'dead' || chosen.health?.condition === 'captured') return;
  // Server says who may do what; the catalogue says what each thing is called and costs.
  const offered = permitted.map(entry => ({ ...choreCache.get(entry.id), ...entry })).filter(entry => entry.name);
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
  if (chosen.chore) {
    const stop = element('button', 'Call off the work');
    stop.dataset.action = 'stop-chore';
    stop.className = 'work-stop';
    stop.disabled = !running;
    host.append(stop);
    return;
  }
  // A chore that wants a worn tool is not "refused" when the tool is sound, it is simply
  // not a thing to do. Showing it greyed out would be clutter pretending to be a choice.
  // Work that is not refused so much as not a thing to do right now. A corn family has no
  // cotton to take to the store and never will; a greyed-out line saying so all afternoon
  // is clutter pretending to be a choice, which is the same reason a sound hoe hides the
  // mending.
  const shown = offered.filter(entry => entry.can || !/^The hoe is sound|^Not enough cotton/.test(entry.why));
  if (!shown.length) return;
  for (const entry of shown) {
    const button = element('button', '');
    button.dataset.action = 'chore';
    button.dataset.chore = entry.id;
    button.disabled = !running || !entry.can;
    button.className = 'work-option';
    button.append(element('span', entry.cost ? `${entry.name} · ${entry.cost}` : entry.name, 'work-name'));
    // Either why it cannot be done, or what it is - never nothing. For a trip that hauls
    // something back, what it would actually bring home the way this person is set to
    // travel, which is the whole visible cost of choosing to walk instead of taking the
    // wagon. Both numbers come from the server; putting them side by side is formatting.
    const carry = world.travelModes?.[chosen.id]?.find(mode => mode.id === modeFor(chosen.id))?.carry;
    const haul = entry.haul && Number.isFinite(carry)
      ? ` Brings home ${Math.min(entry.haul.got, carry)} ${entry.haul.resource}${entry.haul.got > carry ? ` of ${entry.haul.got}; the rest is left behind.` : '.'}`
      : '';
    // A standing crop, and what the stock will have had out of it if nobody fenced the
    // field. Both numbers come from the server; saying them before the work is chosen is
    // the same rule the tool's remaining uses follow - a cost you can see coming.
    const crop = entry.crop
      ? entry.crop.share < 1
        ? ` About ${Math.round(entry.crop.grown * entry.crop.share)} food of ${Math.round(entry.crop.grown)} standing; the rest has gone to stock in an unfenced field.`
        : ` About ${Math.round(entry.crop.grown)} food standing.`
      : '';
    button.append(element('span', entry.can ? `${entry.describe}${haul}${crop}` : entry.why, 'work-note'));
    if (!entry.can) button.title = entry.why;
    host.append(button);
  }
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
  row.hidden = !commands || !homes.length || !from;
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
  if (!chosen || world.role === 'host' || selectionDismissed || familyCache?.canRoll || rollState === 'rolling') { panel.hidden = true; return; }
  panel.hidden = false;
  panel.dataset.entityId = chosen.id;
  const commands = chosen.id === household?.principalId && chosen.principal && !chosen.observed;
  const task = taskFor(world, chosen);
  $('#selection-name').textContent = chosen.name;
  // What someone is doing is the chore's own words when they are on one - "breaking the
  // rows" says more than "work", and it is the step the server is actually running.
  if (chosen.observed) {
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
      ? `On the road to ${placeName(world, chosen.travel.to)} · ${Math.round((chosen.travel.progress || 0) / (chosen.travel.distance || 1) * 100)}%`
      : `${chosen.task || 'resting'} · ${placeName(world, chosen.location?.siteId)} · ${chosen.health?.condition || 'well'}`;
  // The call panel below carries the question itself. This line is what is left for a
  // person who has been asked something that is not open to them to answer any more.
  const calling = task?.status === 'open' && task.options?.length && !chosen.observed && world.role !== 'host';
  $('#selection-task').hidden = !task || calling;
  $('#selection-task').textContent = task && !calling ? task.text : '';
  $('#action-subject').textContent = commands ? `Ask ${chosen.name} to…`
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
    button.disabled = !settable || Boolean(chosen.travel) || (action === 'travel' && (!destination || chosen.location?.siteId === destination));
  }
  // Somebody is standing in front of this person waiting to be spoken to. The button is
  // theirs and nobody else's: a rider stopped one named person, and that is who can listen.
  const waiting = world.encounter?.status === 'open' && world.encounter.listenerId === chosen.id;
  const listen = $('#listen-rider');
  listen.hidden = !waiting || world.role === 'host';
  listen.textContent = waiting ? `Listen to ${world.encounter.carrierName}` : 'Listen';
  renderCall(world, chosen, running);
  renderTravelModes(world, chosen, settable);
  renderWork(world, chosen, settable);
  // Trading stays shut until the class is running, because the neighbour it is addressed
  // to may not have joined yet. An offer to an empty chair is not a trade.
  renderTrade(world, chosen, running);
  positionSelection(world, chosen);
}
function positionSelection(world, chosen = selectedEntity(world)) {
  const panel = $('#selection');
  if (panel.hidden || !chosen) return;
  // Beside the person on a wide screen; docked on a phone, where a floating card would
  // simply cover the family it is describing.
  const canvas = $('#world-map'), spot = drawnAt.get(chosen.id);
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 760 || !spot) {
    panel.dataset.docked = 'true';
    panel.style.left = ''; panel.style.top = '';
  } else {
    delete panel.dataset.docked;
    const scaleX = rect.width / canvas.width, scaleY = rect.height / canvas.height;
    const right = spot.x * scaleX + 26, flip = right + panel.offsetWidth > rect.width - 8;
    panel.style.left = `${Math.max(8, flip ? spot.x * scaleX - panel.offsetWidth - 26 : right)}px`;
    panel.style.top = `${Math.max(8, Math.min(rect.height - panel.offsetHeight - 8, spot.y * scaleY - panel.offsetHeight / 2))}px`;
  }
}
/**
 * Who we are: every person, what they are to the rest, and a box to rename them in.
 *
 * The roles are the world's and do not move - a student renaming somebody does not change
 * whose child they are - and the names are entirely the student's. Ids never change at all,
 * which is what lets skills and faces stay put through a rename.
 */
function renderFamilyBook() {
  const host = $('#family-kin'), form = $('#family-name-form');
  const family = familyCache;
  if (!family) { host.replaceChildren(); form.hidden = true; return; }
  // Nobody to name until the die is rolled: renaming first would be naming people the roll
  // is about to replace, so the server refuses it and the book does not offer it.
  if (family.canRoll) { host.replaceChildren(); form.hidden = true; $('#family-book-note').textContent = 'Roll the die to find out who your family is.'; return; }
  form.hidden = false;
  const nameInput = $('#family-name-input');
  // Never overwrite what somebody is in the middle of typing.
  if (document.activeElement !== nameInput) nameInput.value = family.named ? family.name : '';
  nameInput.placeholder = family.name;
  $('#family-book-note').textContent = family.named
    ? 'Names are yours to change. Who is whose is not.'
    : `Nobody has named this family yet, so it goes by ${family.name}.`;
  host.replaceChildren(...family.people.map(person => {
    const item = element('li', '', 'kin-row');
    item.dataset.entityId = person.id;
    item.dataset.role = person.role || '';
    const form_ = element('form', '', 'name-row');
    form_.dataset.entityId = person.id;
    const age = !Number.isFinite(person.age) ? '' : person.age === 0 ? ', under a year' : `, ${person.age}`;
    const label = element('label', `${person.role || 'of this family'}${age}`);
    label.htmlFor = `rename-${person.id}`;
    const input = element('input');
    input.id = `rename-${person.id}`;
    input.name = 'rename';
    input.maxLength = 24;
    input.autocomplete = 'off';
    if (document.activeElement !== input) input.value = person.name;
    const save = element('button', 'Rename');
    save.type = 'submit';
    form_.append(label, input, save);
    item.append(form_);
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
    text: 'Four people live here and all four can work. The panel beside them is open on Thomas, who the big decisions belong to later on; click any of the others and it follows them. The ox and the wagon are yours too.',
    arriving: 'Your family is on the road in with the wagon, the ox and the horse. When your teacher begins they drive onto their own land, where there is no house yet, and camp by the wagon. The panel beside them follows whoever you click.',
    next: 'Go on',
  },
  {
    id: 'work',
    title: 'Give them something to do',
    text: 'The panel beside them lists the work they can do today. Plant the field turns the rows and puts in seed, and it is where a year on this land starts. Choose a job for them.',
    doing: 'Waiting for somebody to be set to work.',
    done: world => entitiesOf(world).some(person => person.chore),
    // Nobody can start work on the road, so a family still coming in is told what to do once it
    // is there instead of being left waiting on a step it cannot finish.
    arriving: 'The panel beside them lists the work they can do. None of it can start on the road: once they are on their land, choose a job for one of them. Plant the field turns the rows and puts in seed, and it is where a year on this land starts.',
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
const DIE_FACES = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
let rollState = 'idle', tumble = null, rollStarted = 0;
function stopTumble() { clearInterval(tumble); tumble = null; $('#family-die')?.classList.remove('rolling'); }
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
  panel.hidden = false;
  const die = $('#family-die'), button = $('#roll-family');
  if (rollState === 'rolled') {
    die.textContent = DIE_FACES[family.roll - 1];
    $('#family-roll-result').textContent = `You rolled a ${family.roll}.`;
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
    const toggle = $('#journal-toggle');
    if (toggle && $('#family-journal')?.dataset.open !== 'true') toggle.click();
    if (window.__snapshot) render(window.__snapshot);
    return;
  }
  if (rollState !== 'idle') return;
  rollState = 'rolling'; rollStarted = Date.now();
  const die = $('#family-die');
  if (!reducedMotion.matches) {
    die.classList.add('rolling');
    tumble = setInterval(() => { die.textContent = DIE_FACES[Math.floor(Math.random() * 6)]; }, 90);
  } else die.textContent = '?';
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
  reopen.textContent = `Repack the wagon (${wagon.used} of ${space})`;
  if (!wagonPacking) return;
  const choice = world.land?.stockChoice;
  const shape = JSON.stringify([household.load, wagon, choice, household.stock]);
  if (shape === wagonShown) return;
  wagonShown = shape;
  $('#wagon-room').textContent = `${wagon.used} of ${space} space filled, ${space - wagon.used} left.`;
  // Driving stock in: what each answer brings, in acres and wagon space, before it is chosen (FIC-GONZ-008).
  $('#wagon-stock').hidden = !choice;
  if (choice) {
    $('#stock-no-text').textContent = `No stock. The family holds a labor of land, ${choice.laborAcres} acres.`;
    $('#stock-yes-text').textContent = `Drive cattle and hogs in. The family holds a league and a labor, ${choice.stockAcres.toLocaleString('en-US')} acres, and the herd's keep takes ${choice.space} spaces of the wagon.`;
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
    const li = element('li', ''); li.dataset.item = item.id; li.dataset.loaded = String(count > 0);
    const space = item.space === 1 ? '1 space' : `${item.space} space`;
    li.append(element('span', `${item.name} · ${space}${item.most > 1 ? ' each' : ''}`, 'wagon-name'));
    const controls = element('span', '', 'wagon-controls');
    if (item.most > 1) {
      controls.append(
        control('−', item.id, count - 1, `${item.id}-less`, { 'aria-label': `One less: ${item.name}`, ...(count === 0 && { disabled: 'true' }) }),
        element('span', String(count), 'wagon-count'),
        control('+', item.id, count + 1, `${item.id}-more`, { 'aria-label': `One more: ${item.name}`, ...(count >= item.most && { disabled: 'true' }) }),
      );
    } else {
      controls.append(control(count ? 'Loaded' : 'Load', item.id, count ? 0 : 1, `${item.id}-toggle`, { 'aria-pressed': String(Boolean(count)), 'aria-label': `${item.name}: ${count ? 'loaded, press to take it out' : 'not loaded, press to load it'}` }));
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
$('#wagon-done')?.addEventListener('click', () => { wagonPacking = false; if (window.__snapshot) render(window.__snapshot); $('#wagon-open')?.focus(); });
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
  : land.shelter === 'camp' ? (land.house?.work > 0 ? { shelter: 'building', layout: land.house.layout } : { shelter: 'camp' })
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
$('#house-close')?.addEventListener('click', () => { housePlanOpen = false; if (window.__snapshot) render(window.__snapshot); $('#house-open')?.focus(); });
function renderTutorial(world) {
  const panel = $('#tutorial');
  // A rider standing in the yard outranks a lesson in how to hold a hoe, and the two use
  // the same corner of the screen.
  // The die comes first: the walk-through sets people to work, and a family that has been
  // set to work can no longer be rolled.
  const busy = world.role === 'host' || !world.householdId || world.encounter?.status === 'open' || familyCache?.canRoll || ['rolling', 'rolled'].includes(rollState) || wagonOpen || housePlanOpen
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
  $('#arrival').textContent = live && world.role !== 'host' ? `${name} has met a rider. Choose ${name} and listen.` : '';
  const panel = $('#encounter');
  panel.hidden = !encounter || !encounterOpen || world.role === 'host';
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
  const chain = encounter.firsthand
    ? `Rode from ${encounter.origin}`
    : `Had it from ${encounter.toldBy} at ${encounter.toldAt} · ${handLabel(encounter.hands)} out of ${encounter.origin}`;
  $('#encounter-origin').textContent = `${chain} · ${timeLabel(encounter.rodeForMinutes)} on the road · already ${timeLabel(encounter.observedAgoMinutes)} old when they set out`;
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
  if (live) {
    const leave = element('button', `Let ${encounter.carrierName} ride on`, 'ask-leave');
    leave.dataset.action = 'leave-rider';
    leave.dataset.entityId = encounter.listenerId;
    leave.disabled = world.status !== 'running';
    $('#encounter-asks').append(leave);
  }
  $('#encounter-note').textContent = live
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
$('#encounter-close')?.addEventListener('click', () => {
  encounterOpen = false;
  $('#encounter').hidden = true;
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
      : request.kind === 'rumor'
      ? { open: 'Your family can choose how to respond.', accepted: 'Your family went to see for itself.', refused: 'Your family stayed home.', expired: 'Nobody went to find out.' }
      : { open: 'Your family can choose how to respond.', accepted: 'Your family chose to help.', refused: 'Your family chose to stay home.', expired: 'This request has passed.' };
    $('#request-status').textContent = said[request.status] || '';
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
  motionProjection.accept(snapshot, performance.now());
  ensureMap(snapshot); ensureHomes(snapshot); ensureChores(snapshot); ensureFamily(snapshot);
  snapshot.world.map = mapCacheId === snapshot.mapId ? mapCache : (snapshot.world.map || EMPTY_MAP);
  $('#save-fault').hidden = !snapshot.fault;
  $('#save-fault').textContent = snapshot.fault?.message || '';
  $('#lifecycle').hidden = !snapshot.lifecycle;
  $('#lifecycle').textContent = snapshot.lifecycle?.message || '';
  window.__snapshot = snapshot;
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
  $('#session').textContent = host ? `Class code ${snapshot.sessionCode}` : (familyCache?.name || world.household?.name || '');
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
  // Named paces rather than a number, because milliseconds a tick is not a thing a teacher
  // should have to hold in their head.
  const paces = { study: 9500, brisk: 4000, quick: 1000 };
  for (const button of $('#host-pace').querySelectorAll('button')) {
    button.dataset.active = String(paces[button.dataset.pace] === snapshot.tickMs);
  }
  const statusLabel = world.slice?.complete ? 'story preserved' : { lobby: 'waiting to begin', running: '', paused: 'paused', ended: 'session ended' }[world.status] ?? world.status;
  $('#world').textContent = [world.historicalDate || timeLabel(world.minute ?? 0), statusLabel].filter(Boolean).join(' · ');
  const whenAvailable = { start: ['lobby'], pause: ['running'], resume: ['paused'], end: ['running', 'paused'], 'new-class': ['lobby', 'ended'], 'stop-server': ['lobby', 'running', 'paused', 'ended'] };
  for (const button of $('#host-controls').querySelectorAll('button')) {
    const allowed = (whenAvailable[button.dataset.action] || []).includes(world.status);
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
  drawWorld(world); renderHousehold(world); renderKnowledge(world); renderEncounter(world); renderFamilyRoll(world); renderWagonLoad(world); renderHousePlan(world); renderSite(world); renderTutorial(world);
}
function showJoin(message) {
  events?.close(); events = null;
  $('#game').hidden = true; $('#rejoin').hidden = true; $('#join').hidden = hostPage;
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
  if (event.target.closest('#selection-close')) {
    selectedId = null; selectionDismissed = true;
    if (window.__snapshot) { drawWorld(window.__snapshot.world); renderSelection(window.__snapshot.world); }
    return;
  }
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  say('');
  const action = button.dataset.action;
  if (action !== 'start') startAnyway = false;
  if (confirmLabel[action] && button.dataset.confirming !== 'true') {
    resetConfirm(confirming);
    button.dataset.label = button.dataset.label || button.textContent;
    button.textContent = confirmLabel[action];
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
    input.entityId = button.dataset.entityId || (action === 'offer' ? $('#trade-from')?.value : null) || selectedEntity(world)?.id || world?.household?.principalId;
    if (button.dataset.offerId) input.offerId = button.dataset.offerId;
    if (action === 'offer') {
      input.toEntityId = button.dataset.toEntityId;
      input.give = { [$('#trade-give-good').value]: Number($('#trade-give-amount').value) };
      input.ask = { [$('#trade-ask-good').value]: Number($('#trade-ask-amount').value) };
    }
    if (button.dataset.destination) input.destination = button.dataset.destination === 'home' ? homeOf(world) : button.dataset.destination;
    if (button.dataset.chore) input.chore = button.dataset.chore;
    if (button.dataset.option) input.option = button.dataset.option;
    // Every order that can put somebody on a road carries how they mean to go.
    if (['travel', 'chore', 'help', 'go-upriver', 'go-see'].includes(action) && input.entityId) input.mode = modeFor(input.entityId);
    if (button.dataset.lineId) input.lineId = button.dataset.lineId;
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
$('#family-book')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target.closest('form');
  const input = form?.querySelector('input[name=rename]');
  if (!input) return;
  const world = window.__snapshot?.world;
  const order = { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action: 'rename', name: input.value };
  if (form.dataset.entityId) order.entityId = form.dataset.entityId;
  try {
    await api('/api/command', order);
    forgetFamily();
    input.blur();
    if (window.__snapshot) render(window.__snapshot);
  } catch (error) { say(error.message); }
});
$('#travel-modes')?.addEventListener('click', event => {
  const button = event.target.closest('button[data-mode]');
  if (!button || button.disabled) return;
  const world = window.__snapshot?.world, chosen = world && selectedEntity(world);
  if (!chosen) return;
  travelModeByEntity.set(chosen.id, button.dataset.mode);
  renderedWork = null;
  render(window.__snapshot);
});
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
  if (active && now - paintedFrame >= 1000 / 12) {
    paintedFrame = now;
    const began = performance.now(); drawWorld(world); positionSelection(world);
    window.__animation = { timeMs: animationTime, clips: [...window.__animationClips], drawMs: performance.now() - began };
  }
  requestAnimationFrame(animateMap);
}
requestAnimationFrame(animateMap);
reducedMotion.addEventListener('change', () => { if (window.__snapshot) drawWorld(window.__snapshot.world); });
// The map draws immediately with its own shapes, and repaints once when the sprite
// sheets arrive. Nothing waits on the art: a stalled or missing download costs detail,
// never a working class.
onArtReady(() => { if (window.__snapshot) drawWorld(window.__snapshot.world); });
loadArt();
try {
  if (hostPage && location.hash) { await api('/api/host', { key: location.hash.slice(1) }); history.replaceState(null, '', '/host'); }
  connect(await api('/api/state'));
} catch (error) { $('#join').hidden = hostPage; $('#connection').textContent = hostPage ? 'Host access required' : 'Ready to join'; if (hostPage) say(error.message); }
