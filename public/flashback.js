// The end-of-game flashback, on the page (docs/FLASHBACK.md). Owner, 2026-09-28: "a full family recap and flashback story. it
// should be a 1 minute video generated from key points and decisions they made, recorded and saved on the host computer and
// played back for the student at the [end] of the game."
//
// Three jobs, all presentation:
//   - **Draw** a family's script (sim/flashback.mjs, fetched from `/api/flashback/script`) frame by frame, with this page's own
//     art: the map's ground at each beat's place (public/app.js `flashbackGround`), the family's figures, the house as it stood,
//     the battle drawn by the one battle renderer from the engine's own projections, the road with the wagon and whoever came
//     after it, the Mexican columns where they truly were (the fog lifted), and over it the date, the caption and the
//     "meanwhile".
//   - **Record** it on the Host's page into a WebM file: each frame given to the browser's VP8 encoder (WebCodecs) at the video's
//     own timestamp, so a minute of video takes as long as the drawing does rather than a minute of the wall clock, and the
//     encoded frames put into a file by public/webm-writer.js. A browser without WebCodecs (the Host page opened on a LAN
//     address, which is not a secure context) records it in real time with MediaRecorder instead. The file is sent to the
//     server, which keeps it in the class's data folder (server/flashback.mjs).
//   - **Play** it: on a student's page their own family's, by itself, with a replay button and the captions as text below. The
//     Host's page plays nothing by itself: the teacher can look one family up and Watch it (owner, 2026-09-28).
//
// Nothing here decides anything about the story: the beats, their words and their order are the server's.
import { muxWebM } from '/webm-writer.js';
import { drawSprite, drawClip, spriteFrame, sheetsInFlight, loadArt, clipReady } from '/art.js';
// The lone parent's scenes' figures (public/courtship.js): who a person is drawn as, and their pose, for the homecoming's yard.
import { clipFor, figureOf } from '/courtship.js';
// Which videos to make next: the class's alone, then families two at a time (owner, 2026-09-30: "make two at once").
import { toStart } from '/making-plan.js';
import { drawArmy } from '/army-view.js';
import { drawRoad } from '/landscape-art.js';
import { placeSprite } from '/place-art.js';
import { createBattleView } from '/battle-view.js';

/** The video: 854 × 480 at 20 frames a second, VP8 at about six hundred kilobits a second - four or five megabytes a minute. */
export const VIDEO = Object.freeze({ width: 854, height: 480, fps: 20, bitrate: 600000, keyEveryMs: 2000 });
/** The ground is drawn this much larger than the picture, so the camera can move slowly over it within a beat. */
const OVERSCAN = 1.12;
const FADE_MS = 280;
/** How long the encoder may take no frames before a video is given up (`recordFlashback`). */
const ENCODER_STALL_MS = 30000;

let art = null;
/** The page's own drawing, from public/app.js: the ground, the camera, the figures and the houses. */
export function bindFlashback(hooks) {
  art = hooks;
  document.querySelector('#flashback-replay')?.addEventListener('click', () => replay());
  document.querySelector('#flashback-make-again')?.addEventListener('click', () => { makeAgain = true; if (lastSnapshot) renderFlashback(lastSnapshot); });
  bindFinale();
}

const make = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined && text !== null) node.textContent = text; if (className) node.className = className; return node; };
const round1 = value => Math.round(value * 10) / 10;
/** A tick of the page's own loop that a background tab does not slow (setTimeout is held to once a second there). */
const yieldNow = () => new Promise(resolve => { const channel = new MessageChannel(); channel.port1.onmessage = () => resolve(); channel.port2.postMessage(0); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ------------------------------------------------------------------------------------------------------------ drawing

/**
 * Where the camera stands for a beat, in miles: its centre and how many miles across the picture is. The centre is let down a
 * little, so what the beat is about stands above the caption at the foot of the picture rather than behind it.
 */
function cameraOf(beat, script, world) {
  const scene = beat.scene || {};
  // A beat of the class's video is at a family's own home (`homeSiteId`), not the script's (sim/class-flashback.mjs).
  const home = world.map?.sites?.[scene.homeSiteId || script.homeSiteId];
  const lift = view => ({ ...view, cy: view.cy + view.miles * (VIDEO.height / VIDEO.width) * 0.1 });
  const around = (points, least) => {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return lift({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, miles: Math.max(least, (maxX - minX) * 1.35, (maxY - minY) * 1.5 * VIDEO.width / VIDEO.height) });
  };
  if (scene.type === 'homes' && scene.homes?.length) return around(scene.homes, 24);
  if (scene.type === 'routes' && scene.routes?.length) return around(scene.routes.flatMap(route => route.points), 24);
  if (scene.type === 'battle' && scene.battle?.camera) return lift(scene.battle.camera);
  if (scene.type === 'road' && scene.route?.length > 1) {
    const xs = scene.route.map(p => p.x), ys = scene.route.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const miles = Math.max(8, (maxX - minX) * 1.25, (maxY - minY) * 1.4 * VIDEO.width / VIDEO.height);
    return lift({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, miles });
  }
  const at = scene.type === 'home' && home ? home : beat.place || home || { x: 0, y: 0 };
  return lift({ cx: at.x, cy: at.y, miles: scene.type === 'home' ? 0.55 : scene.miles || 24 });
}

/** The roads and the places' own pictures and names, over the ground: what a family would know the country by. */
function drawCountry(ctx, world, camera) {
  for (const route of Object.values(world.map?.routes || {})) {
    const points = (route.points || []).filter(Boolean).map(camera.toScreen);
    if (points.length < 2) continue;
    const width = Math.max(2, Math.min(46, camera.scale * .012 * (route.kind === 'track' ? .55 : 1) + camera.figure * .22));
    drawRoad(ctx, points, width);
  }
  for (const site of Object.values(world.map?.sites || {})) {
    if (!['town', 'village', 'landing', 'ferry', 'farmstead', 'distant', 'field', 'camp'].includes(site.kind)) continue;
    const q = camera.toScreen(site);
    if (q.x < -80 || q.y < -80 || q.x > ctx.canvas.width + 80 || q.y > ctx.canvas.height + 80) continue;
    const picture = placeSprite(site);
    if (picture) drawSprite(ctx, picture, q.x, q.y, Math.max(24, Math.min(90, camera.figure * 5)));
    if (camera.scale < 90 && site.kind !== 'ferry') label(ctx, site.name, q.x, q.y + 14, 13);
  }
}
function label(ctx, words, x, y, size = 13, { colour = '#3d3222', halo = '#f2e6c9' } = {}) {
  ctx.save();
  ctx.font = `${size}px Georgia, serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = halo; ctx.fillStyle = colour;
  ctx.strokeText(words, x, y); ctx.fillText(words, x, y);
  ctx.restore();
}

/** One beat's picture made ready: its ground drawn once, larger than the frame, and the camera it was drawn with. */
function prepareBeat(beat, script, world) {
  const scene = beat.scene || {};
  if (scene.type === 'title' || scene.type === 'closing' || scene.type === 'yard') return { beat };
  const view = cameraOf(beat, script, world);
  const over = scene.type === 'battle' ? 1 : OVERSCAN;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(VIDEO.width * over); canvas.height = Math.round(VIDEO.height * over);
  const scale = VIDEO.width / view.miles;
  const camera = art.camera(canvas, view.cx, view.cy, scale);
  const ctx = canvas.getContext('2d');
  art.ground(ctx, world, camera);
  drawCountry(ctx, world, camera);
  return { beat, canvas, camera, over };
}

/** A point of the map on the frame, through the slow move of the camera over the beat's ground. */
function framePoint(prepared, crop, point) {
  const q = prepared.camera.toScreen(point);
  return { x: (q.x - crop.x) * VIDEO.width / crop.w, y: (q.y - crop.y) * VIDEO.height / crop.h };
}
/** The part of the beat's ground in the frame at `local` (0..1 through the beat): a slow push in, as a film would. */
function cropAt(prepared, local) {
  const { canvas, over } = prepared;
  if (over === 1) return { x: 0, y: 0, w: canvas.width, h: canvas.height };
  const zoom = 1 + (over - 1) * (0.15 + 0.85 * local);
  const w = canvas.width / zoom, h = canvas.height / zoom;
  return { x: (canvas.width - w) / 2, y: (canvas.height - h) / 2, w, h };
}

const personOf = (script, id) => script.people.find(person => person.id === id);
/** A figure of the family, as the page draws it: walking (east or west) or standing facing the camera. */
function drawPerson(ctx, person, x, y, size, { walking = null, alpha = 1 } = {}) {
  if (!person) return;
  const entity = { ...person, observed: false, ...(walking ? { stepping: 'e', flip: walking === 'w' } : { scenePose: { pose: 'idle', face: 's' } }) };
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * alpha;
  art.miniPerson(ctx, x, y, size, entity);
  ctx.globalAlpha = was;
}
/** The family standing together at a point, the grown ones first. */
function drawGroup(ctx, script, ids, at, size, options = {}) {
  const people = ids.map(id => personOf(script, id)).filter(Boolean);
  const gap = size * 0.52;
  people.forEach((person, i) => drawPerson(ctx, person, at.x + (i - (people.length - 1) / 2) * gap, at.y + (i % 2) * size * 0.08, size, options));
  return people.length;
}
/** Where along a route, as a point and the way it heads, at a share of its length. */
function alongRoute(points, share) {
  let total = 0;
  const lengths = points.slice(1).map((p, i) => { const l = Math.hypot(p.x - points[i].x, p.y - points[i].y); total += l; return l; });
  let left = Math.max(0, Math.min(1, share)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? Math.min(1, left / lengths[i]) : 0, a = points[i], b = points[i + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y };
    }
    left -= lengths[i];
  }
  return { ...points.at(-1), dx: 1, dy: 0 };
}
/** Puffs of smoke over a burning place: grey, rising and spreading, drawn here as the army's camp fires are (public/army-view.js). */
function smoke(ctx, x, y, size, t) {
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const phase = ((t / 2600) + i / 9) % 1;
    ctx.fillStyle = `rgba(92,86,78,${0.42 * (1 - phase)})`;
    ctx.beginPath(); ctx.arc(x + Math.sin(i * 1.7 + phase * 3) * size * 0.4 + phase * size * 0.8, y - size * (0.3 + phase * 2.2), size * (0.25 + phase * 0.55), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** The Mexican columns where they really were at the beat's moment: drawn by the map's own army drawing. */
function drawColumns(ctx, prepared, crop, columns, t) {
  if (!columns?.length) return;
  const figure = Math.max(9, prepared.camera.figure * VIDEO.width / crop.w);
  for (const column of columns) {
    const at = framePoint(prepared, crop, column);
    if (at.x < -60 || at.y < -60 || at.x > VIDEO.width + 60 || at.y > VIDEO.height + 60) continue;
    drawArmy(ctx, { id: column.id, name: column.name, side: 'mexican', strength: column.strength, moving: column.moving, camp: column.camp, right: column.right }, at, {
      scale: prepared.camera.scale * VIDEO.width / crop.w, figure, time: t,
      draw: (clip, x, y, size, key, options) => art.animated(ctx, clip, x, y, size, key, options),
      mini: (c, x, y, size, entity) => art.miniPerson(c, x, y, size, entity),
    });
  }
}

/** A home beat: the house as it stood then, the family before it, a rider come with word, smoke over a burning farm. */
function drawHome(ctx, prepared, script, beat, local, t) {
  const crop = cropAt(prepared, local);
  const site = beat.scene.homeSiteId && script.sites?.[beat.scene.homeSiteId] || script.home;
  const home = prepared.camera && framePoint(prepared, crop, { x: site.x, y: site.y });
  const zoom = VIDEO.width / crop.w;
  const figure = prepared.camera.figure * zoom;
  const house = beat.scene.house || { shelter: 'house' };
  const size = prepared.camera.house.size * zoom;
  art.homesteadHouse(ctx, home.x, home.y, size, beat.scene.homeSiteId || script.homeSiteId, house);
  if (beat.scene.wagon) art.miniWagon(ctx, home.x - size * 1.3, home.y + size * .25, figure * 1.55, { id: 'flashback-wagon', condition: 'sound', laden: true });
  if (beat.scene.smoke) smoke(ctx, home.x, home.y - size * .3, size * .7, t);
  if (beat.scene.neighbours) for (let i = 0; i < 3; i++) drawPerson(ctx, { id: `neighbour-${i}`, kind: 'person' }, home.x + size * (1.5 + i * .35), home.y + size * .55, figure);
  drawGroup(ctx, script, beat.scene.people || [], { x: home.x, y: home.y + size * .55 }, figure);
  if (beat.scene.rider) {
    const x = home.x - VIDEO.width * .55 + Math.min(1, local / .45) * (VIDEO.width * .55 - size * 1.2);
    art.animated(ctx, local < .45 ? 'mounted-courier-e' : 'mounted-courier-graze', x, home.y + size * .45, figure * 1.5, 'flashback-rider');
  }
  drawColumns(ctx, prepared, crop, beat.scene.columns, t);
}
/** A map beat: the country round the place, the family's figures standing at it, larger than the map's scale would make them. */
function drawMapBeat(ctx, prepared, script, beat, local, t) {
  const crop = cropAt(prepared, local);
  const at = framePoint(prepared, crop, beat.place);
  if (beat.scene.crowd) for (let i = 0; i < 5; i++) drawSprite(ctx, i % 2 ? 'lean-to' : 'tent', at.x + (i - 2) * 46, at.y - 26 - (i % 2) * 8, 34);
  drawGroup(ctx, script, beat.scene.people || [], { x: at.x, y: at.y + 18 }, 30);
  if (beat.place?.name) label(ctx, beat.place.name, at.x, at.y + 40, 15);
  drawColumns(ctx, prepared, crop, beat.scene.columns, t);
}
/** A road beat: the route drawn in, and the family going along it, the wagon in front; soldiers behind it in a chase. */
function drawRoadBeat(ctx, prepared, script, beat, local, t) {
  const crop = cropAt(prepared, local);
  const route = beat.scene.route || [];
  if (route.length < 2) return drawMapBeat(ctx, prepared, script, beat, local, t);
  const points = route.map(point => framePoint(prepared, crop, point));
  const share = (beat.scene.from ?? 0) + ((beat.scene.to ?? 1) - (beat.scene.from ?? 0)) * local;
  // The way already come, and the way ahead faint.
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash([8, 7]); ctx.strokeStyle = 'rgba(122,54,34,.45)'; ctx.lineWidth = 3;
  ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  ctx.setLineDash([]); ctx.strokeStyle = 'rgba(122,54,34,.9)'; ctx.lineWidth = 4;
  const done = [];
  for (let s = 0; s <= share; s += 0.01) done.push(alongRoute(points, s));
  done.push(alongRoute(points, share));
  ctx.beginPath(); done.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  ctx.restore();
  const head = alongRoute(points, share);
  const west = head.dx < 0;
  const size = 28, dir = west ? 1 : -1;
  const home = beat.scene.homeward ? points.at(-1) : points[0];
  label(ctx, beat.scene.homeward ? 'home' : 'home', home.x, home.y - 12, 13, { colour: '#6b2a1a' });
  let x = head.x;
  if (beat.scene.wagon) {
    art.miniAnimal(ctx, x - dir * size * .9, head.y, size * 1.3, { id: 'flashback-ox', species: 'ox', travel: { points: [{ x: 0, y: 0 }, { x: west ? -1 : 1, y: 0 }], progress: 0.5, distance: 1, mode: 'wagon' } }, west);
    art.miniWagon(ctx, x, head.y, size * 1.5, { id: 'flashback-wagon', condition: 'sound', laden: true, travel: { points: [{ x: 0, y: 0 }, { x: west ? -1 : 1, y: 0 }], progress: 0.5, distance: 1, mode: 'wagon' } }, west);
    x += dir * size * 1.4;
  }
  (beat.scene.people || []).forEach((id, i) => drawPerson(ctx, personOf(script, id), x + dir * i * size * 0.5, head.y + (i % 2) * 3, size, { walking: west ? 'w' : 'e' }));
  if (beat.scene.soldiers) {
    const gap = size * (5 - 2.5 * Math.sin(Math.min(1, local) * Math.PI));
    for (let i = 0; i < 4; i++) art.animated(ctx, 'dragoon-march', x + dir * (gap + i * size * .9), head.y + (i % 2) * 6, size * 1.1, `flashback-dragoon-${i}`, { flip: west });
  }
  if (beat.scene.crowd) for (let i = 0; i < 4; i++) drawPerson(ctx, { id: `crowd-${i}`, kind: 'person' }, head.x - dir * (size * 1.6 + i * 16), head.y + 10 + (i % 2) * 5, size * .9);
  drawColumns(ctx, prepared, crop, beat.scene.columns, t);
}
/** A battle beat: the engine's projections, one after another, drawn by the one battle renderer, and the family's own among them. */
function drawBattleBeat(ctx, prepared, script, beat, local, t, battleView) {
  const frames = beat.scene.battle.frames;
  const index = Math.min(frames.length - 1, Math.floor(local * frames.length));
  const frameMs = beat.durationMs / frames.length;
  const crop = cropAt(prepared, local);
  const view = frames[index];
  battleView.draw(ctx, view, { camera: prepared.camera, time: t, now: t, tickMs: frameMs, bounds: { width: VIDEO.width, height: VIDEO.height }, named: true });
  // The family's own person, with the Texian side where it stands, named - and gone from the picture before the end where the
  // caption says they did not come through it. Nobody is drawn falling (VISION.md §16).
  const texian = view.sides.find(side => side.side === 'texian');
  if (!texian) return;
  const at = framePoint(prepared, crop, texian);
  const ids = beat.scene.people || [];
  const alpha = beat.death ? Math.max(0, Math.min(1, (0.7 - local) / 0.15)) : 1;
  ids.forEach((id, i) => {
    const person = personOf(script, id);
    const x = at.x + (i - (ids.length - 1) / 2) * 22, y = at.y + 16;
    drawPerson(ctx, person, x, y, Math.max(16, prepared.camera.figure * 1.2), { alpha });
    if (alpha > 0.05 && person) { ctx.save(); ctx.globalAlpha = alpha; label(ctx, person.name, x, y + 16, 13, { colour: '#6b2a1a' }); ctx.restore(); }
  });
}
// ------------------------------------------------------------------------------------------------ the class's own map beats

/** The class's homes on one map (sim/class-flashback.mjs `homes`): each a house, burned or standing, named, and a day where one is said. */
function drawHomes(ctx, prepared, beat, local) {
  const crop = cropAt(prepared, local);
  const size = Math.max(22, Math.min(46, prepared.camera.figure * 3 * VIDEO.width / crop.w));
  for (const [i, home] of (beat.scene.homes || []).entries()) {
    const at = framePoint(prepared, crop, home);
    // One after another, a beat's first half, so the eye goes round the class.
    const shown = Math.max(0, Math.min(1, (local * 3 - i / Math.max(1, beat.scene.homes.length)) * 4));
    if (shown <= 0) continue;
    ctx.save(); ctx.globalAlpha = shown;
    if (!(home.mark === 'burned' && drawSprite(ctx, 'cabin-ruin', at.x, at.y, size))) drawSprite(ctx, 'cabin-small', at.x, at.y, size);
    if (home.mark === 'burned') smoke(ctx, at.x, at.y - size * .4, size * .45, local * 4000);
    const words = home.note ? `${home.label}: ${home.note}` : home.label;
    label(ctx, words, at.x, at.y + 16, 14, { colour: home.mark === 'went' ? '#6b2a1a' : '#3d3222' });
    if (home.mark === 'went') { ctx.fillStyle = '#6b2a1a'; ctx.beginPath(); ctx.arc(at.x + size * .55, at.y - size * .7, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
/** The families' roads east together (sim/class-flashback.mjs `routes`), each family going along its own. */
function drawRoutes(ctx, prepared, beat, local) {
  const crop = cropAt(prepared, local);
  for (const route of beat.scene.routes || []) {
    const points = route.points.map(point => framePoint(prepared, crop, point));
    if (points.length < 2) continue;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([7, 6]); ctx.strokeStyle = 'rgba(122,54,34,.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.restore();
    const head = alongRoute(points, Math.min(1, local * 1.05));
    const west = head.dx < 0;
    if (route.wagon) art.miniWagon(ctx, head.x, head.y, 34, { id: `class-wagon-${route.householdId}`, condition: 'sound', laden: true, travel: { points: [{ x: 0, y: 0 }, { x: west ? -1 : 1, y: 0 }], progress: 0.5, distance: 1, mode: 'wagon' } }, west);
    else drawPerson(ctx, { id: `class-walker-${route.householdId}`, kind: 'person' }, head.x, head.y, 26, { walking: west ? 'w' : 'e' });
    label(ctx, route.label, points[0].x, points[0].y + 16, 13, { colour: '#6b2a1a' });
  }
}

// ------------------------------------------------------------------------------------------------ the homecoming, in the yard

/**
 * The homecoming's scenes after the story's minute (sim/flashback.mjs `epilogue`; owner, 2026-09-29, D10): the family in its own
 * yard, drawn large as the lone parent's scenes are (public/courtship.js), with Astra's figures and furniture - her cast in their
 * delivered poses, her cabins, the burned cabin, the house going up, her table, the elder for the land agent. What she has not
 * drawn is Claude's stand-in art: the wooden marker (`grave-marker`) and the coin and paper on the table (`coins-and-paper`),
 * each drawn in canvas until its sheet has come. stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the homecoming's scenes.
 */
const YARD_LIGHT = Object.freeze({ morning: ['#b9d3dc', '#f3e2bd'], noon: ['#a8c8d8', '#e6e3cf'], evening: ['#e7a86e', '#f6d59a'] });
/** A grown person's drawn height in the yard, and where the ground they stand on is. */
const YARD_PERSON = 0.27, YARD_GROUND = 0.74;
const BAND = Object.freeze({ infant: 0.36, small: 0.52, child: 0.7, youth: 0.9, adult: 1 });
/** The family's own house in the yard: Astra's whole-house pictures, and her burned cabin. */
const YARD_HOUSE = Object.freeze({ 'round-log': 'house-round-log', 'hewn-log': 'house-hewn-log', 'dog-run': 'house-dog-run', jacal: 'house-jacal' });

function paintYard(ctx, light, t) {
  const W = VIDEO.width, H = VIDEO.height;
  const backdrop = `courtship-yard-${light === 'noon' ? 'noon' : light === 'evening' ? 'evening' : 'morning'}`;
  const frame = spriteFrame(backdrop);
  if (frame && drawSprite(ctx, backdrop, W / 2 + (frame.anchorX - 0.5) * frame.w * Math.max(W / frame.w, H / frame.h), H - (1 - (frame.anchorY ?? 1)) * frame.h * Math.max(W / frame.w, H / frame.h), (frame.logicalHeight || frame.h) * Math.max(W / frame.w, H / frame.h)) > 0) return;
  const tones = YARD_LIGHT[light] || YARD_LIGHT.morning;
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, tones[0]); sky.addColorStop(1, tones[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const line = H * 0.47;
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? '#6f7f45' : '#56683a';
    for (let i = 0; i < 26; i++) {
      const x = (i / 25) * W * 1.1 - W * 0.05 + (pass ? W * 0.02 : 0), r = H * (0.05 + ((i * 37 + pass * 11) % 7) / 90);
      ctx.beginPath(); ctx.ellipse(x, line - r * 0.3 + pass * H * 0.02, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  const ground = ctx.createLinearGradient(0, line, 0, H);
  ground.addColorStop(0, '#9aa35e'); ground.addColorStop(1, '#6f7a3e');
  ctx.fillStyle = ground; ctx.fillRect(0, line, W, H - line);
  ctx.fillStyle = 'rgba(176,150,98,.5)';
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.72, W * 0.42, H * 0.1, 0, 0, Math.PI * 2); ctx.fill();
}
/** The evening's warmth, a lantern's glow about the table, and the storybook edge. */
function gradeYard(ctx, light, glowAt) {
  const W = VIDEO.width, H = VIDEO.height;
  ctx.save();
  if (light === 'evening') { ctx.fillStyle = 'rgba(255,146,62,.14)'; ctx.fillRect(0, 0, W, H); }
  if (glowAt) {
    const glow = ctx.createRadialGradient(glowAt.x, glowAt.y, 0, glowAt.x, glowAt.y, W * 0.3);
    glow.addColorStop(0, 'rgba(255,200,120,.28)'); glow.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  }
  const edge = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  edge.addColorStop(0, 'rgba(40,24,10,0)'); edge.addColorStop(1, 'rgba(40,24,10,.4)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
/** A person of the family in the yard: Astra's cast figure in a delivered pose, facing `face`; a child's own figure. */
function yardPerson(ctx, person, x, y, h, pose, face, t, { paused = true } = {}) {
  if (!person) return 0;
  const { figure, grown, appearance } = figureOf(person);
  const size = h * (BAND[person.band] ?? 1);
  let clip;
  if (pose === 'back') clip = { id: grown ? `${figure}-listen-n` : `${figure}-idle-n`, flip: false };
  else if (pose === 'front' || !grown) clip = { id: `${figure}-idle-${grown ? 's' : face === 'n' ? 'n' : 's'}`, flip: false };
  else clip = clipFor(person, pose, face === 'w' ? 'w' : 'e');
  ctx.save(); ctx.fillStyle = 'rgba(40,30,15,.22)';
  ctx.beginPath(); ctx.ellipse(x, y, size * 0.2, size * 0.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const drawn = drawClip(ctx, clip.id, x, y, size, { timeMs: t, seed: person.id, paused, flip: clip.flip, appearance });
  // A figure whose sheet has not come yet is drawn as the map draws people, never left out.
  if (!drawn) drawPerson(ctx, person, x, y, size * 0.8);
  return size;
}
/**
 * A wooden marker on a low mound, with a few flowers: Claude's `grave-marker` where its sheet has come, drawn here until then. `person`
 * is a grown person's height in the scene, which the frame's logical height is (scripts/claude-art/areas/homecoming.mjs).
 */
function marker(ctx, x, y, person) {
  if (drawSprite(ctx, 'grave-marker', x, y, person)) return;
  const h = person * 0.75;
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the homecoming's scenes, item 1 (the wooden marker), until the sheet loads.
  ctx.save();
  ctx.fillStyle = '#7b6247';
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.03, h * 0.34, h * 0.08, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#9b7a52'; ctx.strokeStyle = '#4b3a24'; ctx.lineWidth = Math.max(1, h * 0.02);
  const w = h * 0.2, top = y - h * 0.62;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.05); ctx.lineTo(x - w / 2, top + w * 0.3); ctx.quadraticCurveTo(x, top - w * 0.15, x + w / 2, top + w * 0.3); ctx.lineTo(x + w / 2, y - h * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [dx, colour] of [[-0.22, '#e8d36b'], [0.18, '#d98cb3'], [0.27, '#f3efe2']]) { ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(x + dx * h, y - h * 0.06, h * 0.022, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
/** The coin and a paper on the table: Claude's `coins-and-paper` where its sheet has come, drawn here until then; `person` as above. */
function coins(ctx, x, y, person) {
  if (drawSprite(ctx, 'coins-and-paper', x, y, person)) return;
  const h = person * 0.22;
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the homecoming's scenes, item 2 (the coin and the bill of sale), until the sheet loads.
  ctx.save();
  ctx.fillStyle = '#f2ead3'; ctx.strokeStyle = '#8c7248'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - h * 0.9, y - h * 0.1); ctx.lineTo(x - h * 0.1, y - h * 0.22); ctx.lineTo(x + h * 0.05, y); ctx.lineTo(x - h * 0.75, y + h * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#c9c9c4' : '#dcdcd6'; ctx.strokeStyle = '#7c7c74'; ctx.beginPath(); ctx.ellipse(x + h * 0.35, y - i * h * 0.07, h * 0.16, h * 0.06, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawYard(ctx, script, beat, local, t) {
  const scene = beat.scene;
  const W = VIDEO.width, H = VIDEO.height;
  const h = H * YARD_PERSON, ground = H * YARD_GROUND;
  paintYard(ctx, scene.light, t);
  const people = (scene.people || []).map(id => personOf(script, id)).filter(Boolean);
  const head = scene.head ? personOf(script, scene.head) : null;
  const others = people.filter(person => person !== head);
  const house = scene.house || {};
  const layout = house.layout && YARD_HOUSE[house.layout] ? house.layout : 'round-log';
  const houseAt = (x, height = h * 2.2) => {
    if (house.shelter === 'ruined') { if (!drawSprite(ctx, 'cabin-ruin', x, ground - h * 0.25, height * 0.8)) art.homesteadHouse(ctx, x, ground - h * 0.25, height * 0.8, script.homeSiteId, { shelter: 'ruined' }); return; }
    if (house.shelter === 'camp') { art.homesteadHouse(ctx, x, ground - h * 0.25, height * 0.6, script.homeSiteId, { shelter: 'camp' }); return; }
    if (!drawSprite(ctx, YARD_HOUSE[layout], x, ground - h * 0.25, height)) art.homesteadHouse(ctx, x, ground - h * 0.25, height, script.homeSiteId, { shelter: 'house', layout });
  };
  let glow = null;
  if (scene.part === 'home') {
    // Home, and what is left: the house (or the ashes) before them, the family turned to it, their backs to us.
    houseAt(W * 0.5);
    if (house.shelter === 'ruined') smoke(ctx, W * 0.5, ground - h * 0.9, h * 0.2, t);
    const step = Math.min(h * 0.46, (W * 0.8) / Math.max(1, people.length));
    people.forEach((person, i) => yardPerson(ctx, person, W / 2 + (i - (people.length - 1) / 2) * step, ground + h * 0.18, h, 'back', 'n', t));
  } else if (scene.part === 'rebuild') {
    // The ashes to one side, and the first logs of a new house going up beside them: Astra's house site and walls.
    drawSprite(ctx, 'cabin-ruin', W * 0.2, ground - h * 0.28, h * 1.5);
    const stage = local < 0.5 ? 'site' : 'walls';
    if (!drawSprite(ctx, `house-${layout}-${stage}`, W * 0.62, ground - h * 0.22, h * 1.9)) drawSprite(ctx, `house-round-log-${stage}`, W * 0.62, ground - h * 0.22, h * 1.9);
    const working = new Set(scene.working || []);
    let k = 0;
    people.forEach((person, i) => {
      if (working.has(person.id)) {
        // The grown at work: carrying up the logs, and at the notching (Astra's carry and repair).
        const carrying = k++ % 2 === 0;
        const x = carrying ? W * (0.32 + ((local * 0.35 + k * 0.13) % 0.25)) : W * (0.8 + (k % 3) * 0.05);
        yardPerson(ctx, person, x, ground + h * 0.1 + (k % 2) * h * 0.06, h, carrying ? 'carry' : 'repair', carrying ? 'e' : 'w', t, { paused: false });
      } else yardPerson(ctx, person, W * (0.4 + i * 0.05), ground + h * 0.26, h, 'front', 's', t);
    });
  } else if (scene.part === 'burial') {
    // Under the trees by the house at evening: a wooden marker for each they lost, the family before them, the head kneeling.
    drawSprite(ctx, 'live-oak-large', W * 0.84, ground - h * 0.2, h * 3) || drawSprite(ctx, 'oak-spreading', W * 0.84, ground - h * 0.2, h * 3);
    const n = Math.max(1, scene.markers || 1);
    // The markers to the right under the oak, the head kneeling before them, the rest a step back to the left, in the open.
    const markersAt = W * 0.66;
    for (let i = 0; i < n; i++) marker(ctx, markersAt + (i - (n - 1) / 2) * h * 0.55, ground - h * 0.12, h);
    if (head) yardPerson(ctx, head, markersAt - (n - 1) * h * 0.28 - h * 0.5, ground + h * 0.02, h, 'care', 'e', t);
    const room = markersAt - (n - 1) * h * 0.28 - h * 0.85;
    const step = Math.min(h * 0.42, (room - W * 0.04) / Math.max(1, others.length));
    others.forEach((person, i) => yardPerson(ctx, person, room - (others.length - 1 - i) * step - step / 2, ground + h * 0.3, h, 'back', 'n', t));
    glow = { x: markersAt, y: ground - h * 0.3 };
  } else if (scene.part === 'count' || scene.part === 'sale') {
    houseAt(W * 0.24, h * 2);
    if (scene.part === 'count') {
      // The head of household sits down at the table (Astra's seated rest pose, the table before them) to count what is left.
      if (head) yardPerson(ctx, head, W * 0.47, ground, h, 'rest', 'e', t);
      drawSprite(ctx, 'home-table', W * 0.55, ground + h * 0.04, h * 0.68);
      coins(ctx, W * 0.58, ground - h * 0.52, h);
      glow = { x: W * 0.55, y: ground - h * 0.4 };
    } else {
      // The farm sold: the head of household and the land agent (Astra's elder) across the table, the agent holding out the purse.
      drawSprite(ctx, 'home-table', W * 0.56, ground + h * 0.04, h * 0.68);
      coins(ctx, W * 0.58, ground - h * 0.52, h);
      if (head) yardPerson(ctx, head, W * 0.46, ground + h * 0.02, h, 'speak', 'e', t, { paused: false });
      yardPerson(ctx, { id: 'land-agent', official: true, band: 'adult', sex: 'male' }, W * 0.7, ground + h * 0.02, h, 'trade', 'w', t, { paused: false });
    }
    const step = Math.min(h * 0.4, (W * 0.3) / Math.max(1, others.length));
    others.forEach((person, i) => yardPerson(ctx, person, W * (scene.part === 'count' ? 0.78 : 0.34) + (i - (others.length - 1) / 2) * step * 0.9, ground + h * 0.3, h * 0.92, 'front', 's', t));
  }
  gradeYard(ctx, scene.light, glow);
}

/** The card the video opens on, and the one it closes on: parchment, the family's name, its people standing in a row. */
function drawCard(ctx, script, beat) {
  const wash = ctx.createLinearGradient(0, 0, VIDEO.width, VIDEO.height);
  wash.addColorStop(0, '#f6ecd2'); wash.addColorStop(1, '#dcc79d');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, VIDEO.width, VIDEO.height);
  ctx.strokeStyle = '#8c7248'; ctx.lineWidth = 3; ctx.strokeRect(14, 14, VIDEO.width - 28, VIDEO.height - 28);
  ctx.fillStyle = '#4b3e28'; ctx.textAlign = 'center';
  const closing = beat.kind === 'closing';
  ctx.font = '15px Georgia, serif'; ctx.fillText(closing ? 'SPRING, 1836' : 'TEXAS, 1835 – 1836', VIDEO.width / 2, 58);
  ctx.font = 'bold 34px Georgia, serif'; ctx.fillText(script.class ? 'Our class, looking back' : script.name.replace(/^the /, 'The '), VIDEO.width / 2, 100);
  // The class's cards stand the families' heads in a row (sim/class-flashback.mjs); a family's, all of its people.
  const people = beat.scene?.people && script.class ? beat.scene.people.map(id => personOf(script, id)).filter(Boolean) : script.people;
  const home = new Set(beat.scene?.home || people.map(person => person.name));
  const gap = Math.min(118, 700 / Math.max(3, people.length)), size = Math.min(130, gap * 1.35);
  people.forEach((person, i) => {
    const x = VIDEO.width / 2 + (i - (people.length - 1) / 2) * gap, y = 300;
    const here = !closing || home.has(person.name);
    drawPerson(ctx, person, x, y, size, { alpha: here ? 1 : 0.28 });
    // Somebody who died of sickness is never named in the video (docs/DISEASE.md §4): the server marks them `unnamed`. First
    // names only: the family's name is over them.
    if (!person.unnamed) label(ctx, person.name.split(' ')[0], x, y + 22, 15, { colour: here ? '#3d3222' : '#8b7b62' });
  });
}

/** Words wrapped to a width, in the context's current font. */
function wrap(ctx, words, width) {
  const lines = [];
  let line = '';
  for (const word of String(words).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
/** The words over the picture: the date, the caption in a band at the foot, and the "meanwhile" in its own box. */
function drawWords(ctx, beat, local) {
  if (beat.kind === 'title' || beat.kind === 'closing') {
    ctx.save(); ctx.fillStyle = '#4b3e28'; ctx.textAlign = 'center';
    ctx.font = '18px Georgia, serif';
    wrap(ctx, beat.caption, VIDEO.width - 120).slice(0, 4).forEach((line, i) => ctx.fillText(line, VIDEO.width / 2, 372 + i * 24));
    ctx.restore();
    return;
  }
  ctx.save();
  // The date, top left.
  ctx.font = 'bold 17px Georgia, serif';
  const dateWidth = ctx.measureText(beat.date).width + 22;
  ctx.fillStyle = 'rgba(246,236,210,.93)'; ctx.fillRect(14, 14, dateWidth, 32);
  ctx.strokeStyle = '#8c7248'; ctx.lineWidth = 1.5; ctx.strokeRect(14, 14, dateWidth, 32);
  ctx.fillStyle = '#3d3222'; ctx.textAlign = 'left'; ctx.fillText(beat.date, 25, 36);
  // The caption, at the foot.
  let size = 21;
  ctx.font = `${size}px Georgia, serif`;
  let lines = wrap(ctx, beat.caption, VIDEO.width - 60);
  if (lines.length > 3) { size = 18; ctx.font = `${size}px Georgia, serif`; lines = wrap(ctx, beat.caption, VIDEO.width - 60); }
  const band = lines.length * (size + 7) + 22;
  ctx.fillStyle = 'rgba(28,22,15,.8)'; ctx.fillRect(0, VIDEO.height - band, VIDEO.width, band);
  ctx.fillStyle = '#fff7e3'; ctx.textAlign = 'center';
  lines.forEach((line, i) => ctx.fillText(line, VIDEO.width / 2, VIDEO.height - band + 14 + size + i * (size + 7) - 4));
  // The fog lifted: what was really happening, in its own box, from a quarter of the way into the beat.
  if (beat.meanwhile && local > 0.2) {
    const alpha = Math.min(1, (local - 0.2) / 0.12);
    ctx.globalAlpha = alpha;
    ctx.font = '14px Georgia, serif';
    const body = wrap(ctx, beat.meanwhile.text, 318), heard = wrap(ctx, beat.meanwhile.heard, 318);
    const height = 34 + (body.length + heard.length) * 18;
    const x = VIDEO.width - 356, y = 14;
    ctx.fillStyle = 'rgba(38,52,66,.88)'; ctx.fillRect(x, y, 342, height);
    ctx.fillStyle = '#e9d9a8'; ctx.textAlign = 'left'; ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('MEANWHILE, UNKNOWN TO THE FAMILY', x + 12, y + 20);
    ctx.fillStyle = '#f4eee0'; ctx.font = '14px Georgia, serif';
    body.forEach((line, i) => ctx.fillText(line, x + 12, y + 40 + i * 18));
    ctx.font = 'italic 13px Georgia, serif'; ctx.fillStyle = '#cbd5dc';
    heard.forEach((line, i) => ctx.fillText(line, x + 12, y + 40 + (body.length + i) * 18));
  }
  ctx.restore();
}

/**
 * The flashback, drawn: a function that paints the frame at a time of the video onto a canvas. `prepare` must have run (the
 * grounds drawn) before the first frame; it is kept apart so the recorder can wait for the land's pictures and the art between.
 */
export function flashbackPainter(script, world) {
  const home = world.map?.sites?.[script.homeSiteId] || { x: 0, y: 0 };
  const film = { ...script, home, sites: world.map?.sites || {} };
  let prepared = [];
  // The battle renderer keeps its smoke and its fallen from frame to frame, by the time it is given: a pass that goes back to
  // the start of the video starts it afresh, or smoke born later than now would be drawn at a negative age.
  const freshBattleView = () => createBattleView({ animated: (...args) => art.animated(...args), drawSprite: (...args) => drawSprite(...args), miniPerson: (...args) => art.miniPerson(...args), clipReady: name => clipReady(name) });
  let battleView = freshBattleView();
  return {
    prepare() { prepared = film.beats.map(beat => prepareBeat(beat, film, world)); battleView = freshBattleView(); return prepared.length; },
    paint(ctx, t) {
      const index = Math.max(0, film.beats.findIndex(beat => t >= beat.startMs && t < beat.startMs + beat.durationMs));
      const beat = film.beats[index] || film.beats.at(-1);
      const local = Math.max(0, Math.min(1, (t - beat.startMs) / beat.durationMs));
      const ready = prepared[index] || { beat };
      art.withClock(t, () => {
        ctx.save();
        if (ready.canvas) {
          const crop = cropAt(ready, local);
          ctx.drawImage(ready.canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, VIDEO.width, VIDEO.height);
        }
        const type = beat.scene?.type;
        if (type === 'title' || type === 'closing') drawCard(ctx, film, beat);
        else if (type === 'home') drawHome(ctx, ready, film, beat, local, t);
        else if (type === 'road') drawRoadBeat(ctx, ready, film, beat, local, t);
        else if (type === 'battle') drawBattleBeat(ctx, ready, film, beat, local, t, battleView);
        else if (type === 'yard') drawYard(ctx, film, beat, local, t);
        else if (type === 'homes') drawHomes(ctx, ready, beat, local);
        else if (type === 'routes') drawRoutes(ctx, ready, beat, local);
        else drawMapBeat(ctx, ready, film, beat, local, t);
        drawWords(ctx, beat, local);
        // A fade up from black at each beat's start, and down at the very end.
        const fromStart = t - beat.startMs, toEnd = script.durationMs - t;
        const dark = Math.max(fromStart < FADE_MS ? 1 - fromStart / FADE_MS : 0, toEnd < FADE_MS * 2 ? 1 - toEnd / (FADE_MS * 2) : 0);
        if (dark > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, dark)})`; ctx.fillRect(0, 0, VIDEO.width, VIDEO.height); }
        // How far through the minute, a thin line at the foot.
        ctx.fillStyle = 'rgba(233,217,168,.85)'; ctx.fillRect(0, VIDEO.height - 3, VIDEO.width * t / script.durationMs, 3);
        ctx.restore();
      });
      return beat;
    },
  };
}

/** Every picture the video will draw asked for and arrived, and the land's pictures made, before the first frame is kept. */
async function warmUp(painter, script) {
  const scratch = document.createElement('canvas');
  scratch.width = VIDEO.width; scratch.height = VIDEO.height;
  const ctx = scratch.getContext('2d');
  await loadArt();
  const stats = { rounds: 0, waitedMs: 0, unsettled: 0 };
  for (let round = 0; round < 4; round++) {
    stats.rounds++;
    painter.prepare();
    for (const beat of script.beats) for (const share of [0.1, 0.5, 0.9]) painter.paint(ctx, beat.startMs + beat.durationMs * share);
    const started = performance.now();
    while ((sheetsInFlight() > 0 || !art.landSettled()) && performance.now() - started < 15000) await sleep(60);
    stats.waitedMs += performance.now() - started;
    if (sheetsInFlight() > 0 || !art.landSettled()) stats.unsettled++;
    if (round > 0 && sheetsInFlight() === 0 && art.landSettled()) break;
  }
  painter.prepare();
  return stats;
}

// ----------------------------------------------------------------------------------------------------------- recording

/** Whether this browser can record a flashback faster than it plays: WebCodecs' VP8 encoder, in a secure context. */
export async function canEncode() {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false;
  try { return Boolean((await VideoEncoder.isConfigSupported(encoderConfig())).supported); } catch { return false; }
}
const encoderConfig = () => ({ codec: 'vp8', width: VIDEO.width, height: VIDEO.height, bitrate: VIDEO.bitrate, framerate: VIDEO.fps, latencyMode: globalThis.__flashbackLatency || 'quality' });

/**
 * One family's video, made: every frame drawn at its own time and encoded at that time, then put in a WebM file. Returns
 * `{ bytes, durationMs, frames, how }`. `onProgress(share)` is told how far it has got.
 */
export async function recordFlashback(script, world, { onProgress = () => {} } = {}) {
  const painter = flashbackPainter(script, world);
  const began = performance.now();
  const warm = await warmUp(painter, script);
  warm.ms = Math.round(performance.now() - began);
  const canvas = document.createElement('canvas');
  canvas.width = VIDEO.width; canvas.height = VIDEO.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const total = Math.round(script.durationMs / 1000 * VIDEO.fps);
  if (await canEncode()) {
    const chunks = [];
    let failed = null;
    const encoder = new VideoEncoder({
      output: chunk => { const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data); chunks.push({ data, timestampMs: chunk.timestamp / 1000, key: chunk.type === 'key' }); },
      error: error => { failed = error; },
    });
    encoder.configure(encoderConfig());
    const keyEvery = Math.round(VIDEO.keyEveryMs / 1000 * VIDEO.fps);
    // Where the drawing time goes, by the kind of picture: presentation evidence for the measurement (docs/FLASHBACK.md §7).
    const paintMs = {};
    for (let i = 0; i < total; i++) {
      if (failed) throw failed;
      const t = i * 1000 / VIDEO.fps;
      const drawStart = performance.now();
      const drawn = painter.paint(ctx, t);
      const type = drawn?.scene?.type || 'card';
      paintMs[type] = (paintMs[type] || 0) + performance.now() - drawStart;
      const frame = new VideoFrame(canvas, { timestamp: Math.round(t * 1000), duration: Math.round(1e6 / VIDEO.fps) });
      encoder.encode(frame, { keyFrame: i % keyEvery === 0 });
      frame.close();
      const waitStart = performance.now();
      // An encoder that has failed, or stopped taking frames for half a minute, fails this video rather than holding the page.
      while (encoder.encodeQueueSize > 6) {
        if (failed) throw failed;
        if (performance.now() - waitStart > ENCODER_STALL_MS) throw new Error('The video encoder stopped.');
        // Woken by the encoder taking a frame (its `dequeue` event, which a tab in the background still gets), or after 50 ms.
        await new Promise(resolve => { encoder.addEventListener('dequeue', resolve, { once: true }); setTimeout(resolve, 50); });
      }
      paintMs.encodeWait = (paintMs.encodeWait || 0) + performance.now() - waitStart;
      if (i % 10 === 0) { onProgress(i / total); await yieldNow(); }
    }
    const flushStart = performance.now();
    await Promise.race([encoder.flush(), sleep(ENCODER_STALL_MS * 2).then(() => { throw new Error('The video encoder did not finish.'); })]);
    paintMs.flush = performance.now() - flushStart;
    encoder.close();
    if (failed) throw failed;
    chunks.sort((a, b) => a.timestampMs - b.timestampMs);
    const bytes = muxWebM({ width: VIDEO.width, height: VIDEO.height, frames: chunks, durationMs: script.durationMs, title: script.name });
    onProgress(1);
    return { bytes, durationMs: script.durationMs, frames: chunks.length, how: 'webcodecs', warm, paintMs: Object.fromEntries(Object.entries(paintMs).map(([k, v]) => [k, Math.round(v)])) };
  }
  // No encoder of its own: the picture played in real time into the browser's MediaRecorder, a minute for a minute.
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  const type = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'].find(kind => MediaRecorder.isTypeSupported?.(kind)) || 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: VIDEO.bitrate });
  const parts = [];
  recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
  const stopped = new Promise(resolve => { recorder.onstop = resolve; });
  recorder.start(1000);
  const realStart = performance.now();
  for (let i = 0; i < total; i++) {
    const t = i * 1000 / VIDEO.fps;
    while (performance.now() - realStart < t) await sleep(4);
    painter.paint(ctx, t);
    track.requestFrame?.();
    if (i % 10 === 0) onProgress(i / total);
  }
  await sleep(1000 / VIDEO.fps);
  recorder.stop();
  await stopped;
  const bytes = new Uint8Array(await new Blob(parts, { type: 'video/webm' }).arrayBuffer());
  onProgress(1);
  return { bytes, durationMs: script.durationMs, frames: total, how: 'mediarecorder', warm };
}

// ------------------------------------------------------------------------------------------------ making the class's videos

// `now`: every video being made, with how far it has got. `current` and `share` are the first of them, as the page has always
// said it; `peak` is the most made at once (presentation evidence for the proofs, read by nothing in the page).
const making = { running: false, now: new Map(), get current() { return this.now.keys().next().value ?? null; }, get share() { return this.now.values().next().value ?? 0; }, peak: 0, done: [], failed: new Map(), how: null };
let makeAgain = false;
/** Presentation evidence for the browser proof (scripts/flashback-browser-proof.mjs), read by nothing in the page. */
window.__flashback = making;

async function makeOne(householdId, world) {
  const response = await fetch(`/api/flashback/script?household=${encodeURIComponent(householdId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The script could not be read.');
  const started = performance.now();
  const video = await recordFlashback(result.script, world, { onProgress: share => { making.now.set(householdId, share); renderStatus(); } });
  const madeMs = Math.round(performance.now() - started);
  const upload = await fetch(`/api/flashback/video?household=${encodeURIComponent(householdId)}&version=${result.script.version}&madeMs=${madeMs}`, { method: 'POST', headers: { 'Content-Type': 'video/webm' }, body: video.bytes });
  const saved = await upload.json();
  if (!upload.ok) throw new Error(saved.error || 'The video could not be saved.');
  making.how = video.how;
  making.done.push({ householdId, at: Date.now(), madeMs, bytes: saved.bytes, durationMs: saved.durationMs, frames: video.frames, how: video.how, warm: video.warm, paintMs: video.paintMs });
}
/**
 * The videos still wanted, in the order they are wanted: on the Host's page the class's own first - it plays first (owner,
 * 2026-09-29, D10) - then the families students played, then the rest; on a Play Solo player's page its own.
 */
function wanted(snapshot) {
  const flashback = snapshot.flashback;
  const want = (id, made) => (!made || made.stale || makeAgain) && !making.failed.has(id) && !making.done.some(one => one.householdId === id);
  if (snapshot.world.role === 'host') {
    const families = flashback.families.filter(family => want(family.householdId, family.made)).sort((a, b) => Number(b.played) - Number(a.played)).map(family => family.householdId);
    return flashback.classVideo && want('class', flashback.classVideo.made) ? ['class', ...families] : families;
  }
  return want(flashback.householdId, flashback.made) ? [flashback.householdId] : [];
}
/** Make one video, and say so whatever came of it. */
async function makeAndKeep(id, world) {
  making.now.set(id, 0);
  making.peak = Math.max(making.peak, making.now.size);
  renderStatus(); if (lastSnapshot) renderFinale(lastSnapshot);
  try { await makeOne(id, world); }
  catch (error) {
    making.failed.set(id, error.message || String(error));
    // Where it went wrong, for whoever reads the console (and the browser proof, which reads it too).
    making.stacks = { ...(making.stacks || {}), [id]: String(error.stack || '').split('\n').slice(0, 6).join(' | ') };
    console.error('Flashback not made:', id, error);
  } finally { making.now.delete(id); }
}
/**
 * Make every video still wanted: the class's alone first, then the families' two at a time (`toStart`, public/making-plan.js), a
 * new one begun as each finishes, until none is wanted.
 */
/**
 * Whether the class video is playing on the class screen, or about to (its stage, from the moment it is made until the Host's page
 * says it has ended), or played again by the teacher: then the families' videos are made one at a time beside it.
 */
function classVideoPlaying(snapshot) {
  if (snapshot.world.role !== 'host') return false;
  if (snapshot.endSequence?.stage === 'class') return true;
  const video = document.querySelector('#finale-video');
  return Boolean(video && !video.hidden && !video.paused && !video.ended);
}
let wakeMaking = null;
async function makeMissing() {
  if (making.running || !art) return;
  making.running = true;
  const going = new Map();
  try {
    for (;;) {
      const snapshot = lastSnapshot;
      if (!snapshot?.flashback?.ready || !snapshot.world.map?.sites) break;
      // What is wanted and not being made; a video finished is out of `wanted` (done or failed) before its promise settles.
      // One at a time while the class video plays (owner, 2026-10-01: "One at a time"), two once it has ended (public/making-plan.js).
      for (const id of toStart(wanted(snapshot).filter(one => !going.has(one)), [...going.keys()], { classPlaying: classVideoPlaying(snapshot) })) going.set(id, makeAndKeep(id, snapshot.world).finally(() => going.delete(id)));
      if (!going.size) break;
      // Woken when a video is made, and when a snapshot comes (the class video ended: a second may begin at once).
      await Promise.race([...going.values(), new Promise(resolve => { wakeMaking = resolve; })]);
      wakeMaking = null;
    }
  } finally {
    making.running = false; makeAgain = false; renderStatus(); if (lastSnapshot) renderFinale(lastSnapshot);
  }
}

// --------------------------------------------------------------------------------------------------------------- playing

let lastSnapshot = null, shownKey = '', transcriptOf = null;
const nameOf = (snapshot, householdId) => householdId === 'class' ? 'The class'
  : snapshot.flashback?.families?.find(family => family.householdId === householdId)?.name || snapshot.world.ending?.host?.families?.find(family => family.householdId === householdId)?.name || snapshot.world.ending?.family?.name || householdId;
const videoUrl = (householdId, made) => `/api/flashback/video?household=${encodeURIComponent(householdId)}&v=${made?.bytes || 0}`;

async function showTranscript(householdId) {
  const list = document.querySelector('#flashback-transcript');
  if (!list || transcriptOf === householdId) return;
  transcriptOf = householdId;
  try {
    const result = await (await fetch(`/api/flashback/script?household=${encodeURIComponent(householdId)}&part=transcript`)).json();
    if (transcriptOf !== householdId) return;
    list.replaceChildren(...(result.beats || []).map(beat => {
      const item = make('li');
      item.append(make('strong', `${beat.date}. `), document.createTextNode(beat.caption));
      if (beat.meanwhile) item.append(make('span', ` Meanwhile: ${beat.meanwhile}`, 'flashback-meanwhile'));
      return item;
    }));
  } catch { transcriptOf = null; }
}
function play(householdId, made, { autoplay = true } = {}) {
  const video = document.querySelector('#flashback-video');
  if (!video || !made) return;
  const source = videoUrl(householdId, made);
  if (video.dataset.src !== source) { video.dataset.src = source; video.dataset.household = householdId; video.src = source; }
  video.hidden = false;
  document.querySelector('#flashback-replay').hidden = false;
  showTranscript(householdId);
  document.querySelector('#flashback-words').hidden = false;
  if (autoplay) { video.currentTime = 0; video.play().catch(() => { /* the student presses play */ }); }
}
function replay() {
  const video = document.querySelector('#flashback-video');
  if (!video?.src) return;
  video.currentTime = 0; video.play().catch(() => {});
}

function renderStatus() {
  const status = document.querySelector('#flashback-status');
  if (!status || !lastSnapshot?.flashback) return;
  const host = lastSnapshot.world.role === 'host';
  const flashback = lastSnapshot.flashback;
  if (making.now.size) {
    const left = wanted(lastSnapshot).length - making.now.size;
    const now = [...making.now].map(([id, share]) => `${host ? `${nameOf(lastSnapshot, id)}, ` : ''}${Math.round(share * 100)}%`).join(' and ');
    status.textContent = `${host ? 'Making the flashbacks on this computer' : 'Making your family’s flashback on this computer'}: ${now}${host && left > 0 ? ` · ${left} more after ${making.now.size > 1 ? 'these' : 'this'}` : ''}.`;
  } else if (!flashback.keeps) status.textContent = 'This server keeps no videos: it was started without a save folder.';
  else if (host) {
    const made = flashback.families.filter(family => family.made).length;
    status.textContent = `${made} of ${flashback.families.length} flashbacks made and saved on this computer.${making.failed.size ? ` ${making.failed.size} could not be made; see the list.` : ''}`;
  } else status.textContent = flashback.made ? '' : lastSnapshot.solo ? 'Your family’s flashback is being made on this computer.' : 'Your family’s flashback is being made on the teacher’s computer. It will play here when it is ready.';
}

function renderHostList(snapshot) {
  const list = document.querySelector('#flashback-families');
  if (!list) return;
  const rows = [...(snapshot.flashback.classVideo ? [{ householdId: 'class', played: true, made: snapshot.flashback.classVideo.made }] : []), ...snapshot.flashback.families];
  const key = JSON.stringify(rows) + [...making.failed.keys()].join();
  if (key === list.dataset.key) return;
  list.dataset.key = key;
  list.replaceChildren(...rows.map(family => {
    const row = make('li');
    row.append(make('span', `${nameOf(snapshot, family.householdId)}${family.played ? '' : ' (nobody played them)'}`, 'flashback-family'));
    if (family.made) {
      row.append(make('span', ` · ${Math.round(family.made.durationMs / 1000)} s · ${round1(family.made.bytes / 1048576)} MB `, 'flashback-facts'));
      // Only when the teacher chooses one: at the end the Host's screen plays the class's own video by itself, and no family's
      // (owner, 2026-09-28: "host can look up and watch one though"; 2026-09-29, D10).
      const button = make('button', 'Watch');
      button.addEventListener('click', () => { document.querySelector('#flashback-now').textContent = `Watching: ${nameOf(snapshot, family.householdId)}`; play(family.householdId, family.made); });
      row.append(button);
    } else row.append(make('span', making.failed.has(family.householdId) ? ` · not made: ${making.failed.get(family.householdId)}` : ' · waiting to be made', 'flashback-facts'));
    return row;
  }));
}

// ------------------------------------------------------------------------------------------------------------ the finale

/**
 * The end of the game as the class goes through it together (owner, 2026-09-29, D10; sim/end-sequence.mjs): over the whole screen
 * until the reveal. The stage is the server's (`snapshot.endSequence`); this page only follows it.
 *
 *   class    the Host's screen plays the class's own video, large, by itself, and tells the server when it has played to its end;
 *            a student's says to look at the class screen.
 *   family   every student's page plays its family's own video by itself, all at the same moment - the server's `playIn`, taken
 *            against this page's own clock when the snapshot came - with the story in words below (the flashback section, moved up
 *            here); a page that opens late starts where the others are. Nothing is told back: the stage ends on the server's
 *            clock (owner, 2026-09-30: "there shouldn't be a wait. the videos are supposed to autoplay"). The Host's screen counts
 *            down and says where each family is. Play Solo begins here.
 *   reveal   nothing over the screen: the ending panel shows the Host's table and each family's breakdown (public/ending.js), the
 *            videos below it to watch again.
 *
 * A video the browser will not start by itself (its autoplay policy) gets a large **Play** button, which starts it where the class
 * is, and nothing waits for it. Every video here is silent (VP8 alone; the captions are in the picture) and muted, which Chrome's
 * policy lets play without a gesture; the button is for a browser that still says no.
 */
async function tell(step) {
  try { await fetch('/api/end-sequence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step }) }); } catch { /* the server's clock moves the class on anyway */ }
}
const told = new Set();
const tellOnce = step => { const key = `${lastSnapshot?.sessionId}:${lastSnapshot?.endSequence?.since}:${step}`; if (told.has(key)) return; told.add(key); finaleSeen.told.push(step); tell(step); };
/** Presentation evidence for the proofs (scripts/end-sequence-browser-proof.mjs), read by nothing in the page. */
const finaleSeen = { stage: null, playing: null, told: [], started: null, blocked: 0 };
window.__finale = finaleSeen;

/**
 * When every family's video starts and the families' stage ends, on this page's clock: `performance.now()` at the snapshot that
 * first carried this start, plus the server's `playIn` and `endsIn`. Kept for one start (`playAt`): a later snapshot is no better.
 */
let clock = null;
function clockOf(snapshot) {
  const sequence = snapshot.endSequence;
  if (sequence?.stage !== 'family' || !Number.isFinite(sequence.playIn)) return null;
  if (clock?.playAt !== sequence.playAt) {
    clock = { playAt: sequence.playAt, startAt: performance.now() + sequence.playIn, endAt: performance.now() + sequence.endsIn };
    finaleSeen.clock = { startWall: Date.now() + sequence.playIn, endWall: Date.now() + sequence.endsIn };
  }
  return clock;
}
const seconds = ms => Math.max(0, Math.ceil(ms / 1000));

const STATE_WORDS = Object.freeze({ away: 'page closed', making: 'its video is being made', ready: 'ready', playing: 'watching', played: 'has seen it' });
function hostFamilyList(snapshot, at) {
  const list = document.querySelector('#finale-families');
  const families = (snapshot.endSequence?.families || []).map(one => ({ ...one, state: at && ['ready', 'playing'].includes(one.state) && performance.now() >= at.startAt ? 'playing' : one.state }));
  list.hidden = !families.length;
  const key = JSON.stringify(families);
  if (list.dataset.key === key) return;
  list.dataset.key = key;
  list.replaceChildren(...families.map(one => make('li', `${nameOf(snapshot, one.householdId)}: ${STATE_WORDS[one.state] || one.state}`, `finale-state-${one.state}`)));
}
/** Play a video from `from` seconds; a refusal shows the large Play button (`onRefused`), and nothing else waits for it. */
function start(video, from, onRefused) {
  const go = () => {
    if (Number.isFinite(from)) video.currentTime = Math.max(0, Math.min(from, Math.max(0, (video.duration || from) - 0.25)));
    video.play().then(() => hidePlayButton()).catch(() => { finaleSeen.blocked++; onRefused(); });
  };
  if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true });
}
function showPlayButton(action) {
  const button = document.querySelector('#finale-play');
  button.hidden = false;
  button.onclick = () => { hidePlayButton(); action(); };
}
function hidePlayButton() { const button = document.querySelector('#finale-play'); if (button) button.hidden = true; }

function playClass(snapshot, { autoplay }) {
  const video = document.querySelector('#finale-video');
  const made = snapshot.flashback?.classVideo?.made;
  if (!made) { video.hidden = true; return false; }
  const source = videoUrl('class', made);
  const again = () => start(video, video.currentTime, () => showPlayButton(again));
  if (video.dataset.src !== source) { video.dataset.src = source; video.src = source; if (autoplay) start(video, 0, () => showPlayButton(again)); }
  // The class stage begun again (Play the ending again): the same video, from the start.
  const since = String(snapshot.endSequence?.since ?? '');
  if (autoplay && video.dataset.since !== since) {
    video.dataset.since = since;
    if (video.currentTime > 0 || video.ended) start(video, 0, () => showPlayButton(again));
  }
  video.hidden = false;
  return true;
}

/**
 * The family's own video in the families' stage: loaded as soon as it is made, and started at the class's moment, from where the
 * class is (a page opened late, or reloaded, joins in the middle). Once for each start of the stage.
 */
let ownTimer = null, ownKey = '';
function scheduleOwn(snapshot) {
  const flashback = snapshot.flashback;
  const video = document.querySelector('#flashback-video');
  if (!flashback?.made) return;
  // Loaded now, played at the moment: `preload` has the page fetching the file while it waits.
  play(flashback.householdId, flashback.made, { autoplay: false });
  const at = clockOf(snapshot);
  if (!at) return;
  const key = `${at.playAt}:${flashback.made.bytes}`;
  if (key === ownKey) return;
  ownKey = key;
  clearTimeout(ownTimer);
  const go = () => {
    const from = (performance.now() - at.startAt) / 1000;
    finaleSeen.started = { householdId: flashback.householdId, from: Math.round(from * 10) / 10, at: Math.round(performance.now()), wall: Date.now() };
    const late = () => start(video, (performance.now() - at.startAt) / 1000, () => showPlayButton(late));
    start(video, from, () => showPlayButton(late));
  };
  ownTimer = setTimeout(go, Math.max(0, at.startAt - performance.now()));
}

export function renderFinale(snapshot) {
  const root = document.querySelector('#finale');
  if (!root) return;
  const stage = snapshot.flashback?.ready ? snapshot.endSequence?.stage || 'reveal' : null;
  const host = snapshot.world.role === 'host';
  const solo = Boolean(snapshot.solo);
  const section = document.querySelector('#flashback');
  const slot = document.querySelector('#finale-slot');
  finaleSeen.stage = stage;
  // The flashback section lives in the ending panel; for a family's own video it is moved up over the whole screen, and back.
  const ownVideo = !host && stage === 'family';
  if (ownVideo && section.parentElement !== slot) slot.append(section);
  // At the reveal the numbers come first (the breakdown, the Host's table), and the videos after them to be watched again.
  const ending = document.querySelector('#ending');
  if (!ownVideo && (section.parentElement === slot || (stage === 'reveal' && ending.lastElementChild !== section))) ending.append(section);
  // The Host's own controls (owner, 2026-09-30: "Controls button"): New Class, Stop Server and the rest, over the ending.
  const controls = document.querySelector('#finale-controls');
  controls.hidden = !host || !stage || stage === 'reveal';
  if (controls.hidden) delete document.body.dataset.finaleControls;
  if (stage !== 'family') { clearTimeout(ownTimer); ownKey = ''; }
  if (!stage || stage === 'reveal') {
    root.hidden = true;
    document.body.dataset.finale = '';
    hidePlayButton();
    const video = document.querySelector('#finale-video');
    if (!video.paused && video.dataset.replay !== 'true') video.pause();
    return;
  }
  root.hidden = false;
  document.body.dataset.finale = stage;
  const title = document.querySelector('#finale-title'), words = document.querySelector('#finale-words');
  const video = document.querySelector('#finale-video');
  const skip = document.querySelector('#finale-skip'), again = document.querySelector('#finale-again'), replayClass = document.querySelector('#finale-replay');
  skip.hidden = !(host || solo);
  skip.textContent = stage === 'class' ? 'Skip ahead to the families’ videos' : 'Skip ahead to the final numbers';
  again.hidden = !(host || solo) || stage === 'class';
  replayClass.hidden = true;
  const at = clockOf(snapshot);
  const countdown = at ? (performance.now() < at.startAt ? `start in ${seconds(at.startAt - performance.now())} s` : `are playing: the final numbers in ${seconds(at.endAt - performance.now())} s`) : null;
  if (host && stage === 'class') {
    title.textContent = 'Our class, looking back';
    const playing = playClass(snapshot, { autoplay: true });
    finaleSeen.playing = playing ? 'class' : null;
    replayClass.hidden = !playing;
    words.textContent = playing ? 'The story of the whole class. Each family’s own story comes next, on its own screen.'
      : making.current === 'class' ? `The class’s story is being made on this computer: ${Math.round(making.share * 100)}%.`
        : !snapshot.flashback?.keeps ? 'This server keeps no videos.' : making.failed.has('class') ? `The class’s story could not be made (${making.failed.get('class')}). Skip ahead to the families’ videos.` : 'The class’s story is being made on this computer.';
    document.querySelector('#finale-families').hidden = true;
  } else if (host && stage === 'family') {
    title.textContent = 'Each family’s own story, on its own screen';
    words.textContent = countdown ? `Every family’s story ${countdown}.`
      : `The families’ stories are being made on this computer${making.now.size && !making.now.has('class') ? `: ${[...making.now].map(([id, share]) => `${nameOf(snapshot, id)}, ${Math.round(share * 100)}%`).join(' and ')}` : ''}. They start together when every family whose page is open has its own.`;
    if (video.dataset.replay !== 'true') { video.hidden = true; if (!video.paused) video.pause(); }
    replayClass.hidden = !snapshot.flashback?.classVideo?.made;
    replayClass.textContent = 'Play the class video again';
    hostFamilyList(snapshot, at);
    finaleSeen.playing = video.dataset.replay === 'true' ? 'class' : null;
  } else if (stage === 'class') {
    title.textContent = 'Look up at the class screen';
    words.textContent = 'Your teacher’s screen is showing the story of the whole class. Your own family’s story comes next, here on your screen.';
    video.hidden = true;
    document.querySelector('#finale-families').hidden = true;
    finaleSeen.playing = null;
    // The family's own video loaded while the class video plays, so it can start the moment the class's ends (owner, 2026-09-30).
    const own = document.querySelector('#flashback-video'), made = snapshot.flashback?.made;
    if (own && made) { const source = videoUrl(snapshot.flashback.householdId, made); if (own.dataset.src !== source) { own.dataset.src = source; own.dataset.household = snapshot.flashback.householdId; own.src = source; } }
  } else {
    title.textContent = 'Our story, looking back';
    const now = performance.now();
    words.textContent = !at ? (snapshot.flashback?.made ? 'Your family’s story starts when every family’s is ready.' : 'Your family’s story is being made. It starts with every family’s.')
      : now < at.startAt ? `Your family’s story starts in ${seconds(at.startAt - now)} s, with every family’s.`
        : `Your family’s story, with every family’s. The final numbers in ${seconds(at.endAt - now)} s.`;
    video.hidden = true;
    document.querySelector('#finale-families').hidden = true;
    finaleSeen.playing = snapshot.flashback?.made ? snapshot.flashback.householdId : null;
    scheduleOwn(snapshot);
  }
}
function bindFinale() {
  const video = document.querySelector('#finale-video');
  if (!video) return;
  // The Host's page tells the server when the class's video begins and when it has played to its end (sim/end-sequence.mjs).
  video.addEventListener('play', () => { if (lastSnapshot?.endSequence?.stage === 'class' && video.dataset.replay !== 'true') tellOnce('class-playing'); });
  video.addEventListener('ended', () => {
    if (video.dataset.replay === 'true') { video.dataset.replay = ''; wakeMaking?.(); if (lastSnapshot) renderFinale(lastSnapshot); return; }
    if (lastSnapshot?.endSequence?.stage === 'class') { finaleSeen.classEnded = Date.now(); tellOnce('class-watched'); }
  });
  document.querySelector('#finale-skip').addEventListener('click', () => tell('skip'));
  const twice = event => {
    // Asked twice: the first press says what it does.
    const button = event.currentTarget;
    if (button.dataset.confirming !== 'true') { button.dataset.confirming = 'true'; button.textContent = 'Play it all again from the start?'; return; }
    button.dataset.confirming = ''; button.textContent = 'Play the ending again';
    tell('restart');
  };
  document.querySelector('#finale-again').addEventListener('click', twice);
  document.querySelector('#flashback-again')?.addEventListener('click', twice);
  document.querySelector('#finale-replay').addEventListener('click', () => {
    if (lastSnapshot?.endSequence?.stage === 'family') video.dataset.replay = 'true';
    if (!playClass(lastSnapshot, { autoplay: false })) return;
    video.hidden = false;
    start(video, 0, () => showPlayButton(() => start(video, 0, () => {})));
  });
  document.querySelector('#finale-controls').addEventListener('click', event => {
    const open = document.body.dataset.finaleControls !== 'open';
    if (open) document.body.dataset.finaleControls = 'open'; else delete document.body.dataset.finaleControls;
    event.currentTarget.setAttribute('aria-expanded', String(open));
    event.currentTarget.textContent = open ? 'Close controls' : 'Controls';
  });
  // The countdown said in seconds, and the Host's list of who is watching, while the families' stories run.
  setInterval(() => { if (lastSnapshot?.endSequence?.stage === 'family') renderFinale(lastSnapshot); }, 1000);
}

/** Draw the flashback's part of the ending, and make whatever videos this page is the one to make. */
export function renderFlashback(snapshot) {
  lastSnapshot = snapshot;
  wakeMaking?.();
  const section = document.querySelector('#flashback');
  if (!section) return;
  const flashback = snapshot.flashback;
  if (!flashback?.ready) {
    section.hidden = true;
    renderFinale(snapshot);
    // A class ended by mistake and taken up again (docs/HOST_PAGE.md §2.8): what this page made or failed to make, played and
    // read belongs to that ending, and its videos are gone from the server. When the class ends again it all starts afresh.
    if (!making.running && (making.done.length || making.failed.size || shownKey || transcriptOf)) {
      making.done.length = 0; making.failed.clear(); shownKey = ''; transcriptOf = null; told.clear(); clock = null;
    }
    return;
  }
  const stage = snapshot.endSequence?.stage || 'reveal';
  section.hidden = false;
  const host = snapshot.world.role === 'host';
  document.querySelector('#flashback-host').hidden = !host;
  const again = document.querySelector('#flashback-again');
  if (again) again.hidden = !(host || snapshot.solo) || stage !== 'reveal' || Boolean(snapshot.endSequence?.noVideos);
  document.querySelector('#flashback-title').textContent = host ? 'The flashbacks' : 'Our story, looking back';
  // The story in words is the family's from the moment its own video's turn comes, video or no video; the Host's, once one is chosen.
  document.querySelector('#flashback-words').hidden = host ? !transcriptOf : stage === 'class';
  if (!host && stage !== 'class') showTranscript(flashback.householdId);
  if (host) renderHostList(snapshot);
  else if (flashback.made && stage === 'reveal') {
    // After the reveal the family's own video is there to watch again, with Replay; it does not start by itself (it played with the
    // class's). The families' stage plays it on the class's clock (`scheduleOwn`, from `renderFinale`).
    const key = `${flashback.householdId}:${flashback.made.bytes}:after`;
    if (key !== shownKey) { shownKey = key; play(flashback.householdId, flashback.made, { autoplay: false }); }
  }
  renderStatus();
  renderFinale(snapshot);
  // The Host's page makes every family's; a Play Solo player's page makes its own, its computer being the Host's.
  if (flashback.keeps && (host || snapshot.solo) && wanted(snapshot).length) makeMissing();
}
