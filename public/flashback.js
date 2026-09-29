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
import { drawSprite, sheetsInFlight, loadArt, clipReady } from '/art.js';
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
  const home = world.map?.sites?.[script.homeSiteId];
  const lift = view => ({ ...view, cy: view.cy + view.miles * (VIDEO.height / VIDEO.width) * 0.1 });
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
  if (scene.type === 'title' || scene.type === 'closing') return { beat };
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
  const home = prepared.camera && framePoint(prepared, crop, { x: script.home.x, y: script.home.y });
  const zoom = VIDEO.width / crop.w;
  const figure = prepared.camera.figure * zoom;
  const house = beat.scene.house || { shelter: 'house' };
  const size = prepared.camera.house.size * zoom;
  art.homesteadHouse(ctx, home.x, home.y, size, script.homeSiteId, house);
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
/** The card the video opens on, and the one it closes on: parchment, the family's name, its people standing in a row. */
function drawCard(ctx, script, beat) {
  const wash = ctx.createLinearGradient(0, 0, VIDEO.width, VIDEO.height);
  wash.addColorStop(0, '#f6ecd2'); wash.addColorStop(1, '#dcc79d');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, VIDEO.width, VIDEO.height);
  ctx.strokeStyle = '#8c7248'; ctx.lineWidth = 3; ctx.strokeRect(14, 14, VIDEO.width - 28, VIDEO.height - 28);
  ctx.fillStyle = '#4b3e28'; ctx.textAlign = 'center';
  const closing = beat.kind === 'closing';
  ctx.font = '15px Georgia, serif'; ctx.fillText(closing ? 'SPRING, 1836' : 'TEXAS, 1835 – 1836', VIDEO.width / 2, 58);
  ctx.font = 'bold 34px Georgia, serif'; ctx.fillText(script.name.replace(/^the /, 'The '), VIDEO.width / 2, 100);
  const people = script.people;
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
  const film = { ...script, home };
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

const making = { running: false, current: null, share: 0, done: [], failed: new Map(), how: null };
let makeAgain = false;
/** Presentation evidence for the browser proof (scripts/flashback-browser-proof.mjs), read by nothing in the page. */
window.__flashback = making;

async function makeOne(householdId, world) {
  const response = await fetch(`/api/flashback/script?household=${encodeURIComponent(householdId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The script could not be read.');
  const started = performance.now();
  const video = await recordFlashback(result.script, world, { onProgress: share => { making.share = share; renderStatus(); } });
  const madeMs = Math.round(performance.now() - started);
  const upload = await fetch(`/api/flashback/video?household=${encodeURIComponent(householdId)}&version=${result.script.version}&madeMs=${madeMs}`, { method: 'POST', headers: { 'Content-Type': 'video/webm' }, body: video.bytes });
  const saved = await upload.json();
  if (!upload.ok) throw new Error(saved.error || 'The video could not be saved.');
  making.how = video.how;
  making.done.push({ householdId, madeMs, bytes: saved.bytes, durationMs: saved.durationMs, frames: video.frames, how: video.how, warm: video.warm, paintMs: video.paintMs });
}
/** The families still wanting a video, the families students played first: they are waiting for theirs. */
function wanted(snapshot) {
  const flashback = snapshot.flashback;
  if (snapshot.world.role === 'host') return flashback.families.filter(family => (!family.made || family.made.stale || makeAgain) && !making.failed.has(family.householdId) && !making.done.some(one => one.householdId === family.householdId)).sort((a, b) => Number(b.played) - Number(a.played)).map(family => family.householdId);
  return (!flashback.made || flashback.made.stale) && !making.failed.has(flashback.householdId) && !making.done.some(one => one.householdId === flashback.householdId) ? [flashback.householdId] : [];
}
async function makeMissing() {
  if (making.running || !art) return;
  making.running = true;
  try {
    for (;;) {
      const snapshot = lastSnapshot;
      if (!snapshot?.flashback?.ready || !snapshot.world.map?.sites) break;
      const next = wanted(snapshot)[0];
      if (!next) break;
      making.current = next; making.share = 0; renderStatus();
      try { await makeOne(next, snapshot.world); }
      catch (error) {
        making.failed.set(next, error.message || String(error));
        // Where it went wrong, for whoever reads the console (and the browser proof, which reads it too).
        making.stacks = { ...(making.stacks || {}), [next]: String(error.stack || '').split('\n').slice(0, 6).join(' | ') };
        console.error('Flashback not made:', next, error);
      }
    }
  } finally {
    making.running = false; making.current = null; makeAgain = false; renderStatus();
  }
}

// --------------------------------------------------------------------------------------------------------------- playing

let lastSnapshot = null, autoplayed = false, shownKey = '', transcriptOf = null;
const nameOf = (snapshot, householdId) => snapshot.world.ending?.host?.families?.find(family => family.householdId === householdId)?.name || snapshot.world.ending?.family?.name || householdId;
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
  if (making.current) {
    const left = wanted(lastSnapshot).length;
    status.textContent = `${host ? 'Making the flashbacks on this computer' : 'Making your family’s flashback on this computer'}: ${host ? `${nameOf(lastSnapshot, making.current)}, ` : ''}${Math.round(making.share * 100)}%${host && left > 1 ? ` · ${left - 1} more after this` : ''}.`;
  } else if (!flashback.keeps) status.textContent = 'This server keeps no videos: it was started without a save folder.';
  else if (host) {
    const made = flashback.families.filter(family => family.made).length;
    status.textContent = `${made} of ${flashback.families.length} flashbacks made and saved on this computer.${making.failed.size ? ` ${making.failed.size} could not be made; see the list.` : ''}`;
  } else status.textContent = flashback.made ? '' : lastSnapshot.solo ? 'Your family’s flashback is being made on this computer.' : 'Your family’s flashback is being made on the teacher’s computer. It will play here when it is ready.';
}

function renderHostList(snapshot) {
  const list = document.querySelector('#flashback-families');
  if (!list) return;
  const key = JSON.stringify(snapshot.flashback.families) + [...making.failed.keys()].join();
  if (key === list.dataset.key) return;
  list.dataset.key = key;
  list.replaceChildren(...snapshot.flashback.families.map(family => {
    const row = make('li');
    row.append(make('span', `${nameOf(snapshot, family.householdId)}${family.played ? '' : ' (nobody played them)'}`, 'flashback-family'));
    if (family.made) {
      row.append(make('span', ` · ${Math.round(family.made.durationMs / 1000)} s · ${round1(family.made.bytes / 1048576)} MB `, 'flashback-facts'));
      // Only when the teacher chooses one: the Host's screen plays nothing by itself (owner, 2026-09-28: "players see it in
      // their screens, not the host screen. host can look up and watch one though").
      const button = make('button', 'Watch');
      button.addEventListener('click', () => { document.querySelector('#flashback-now').textContent = `Watching: ${nameOf(snapshot, family.householdId)}`; play(family.householdId, family.made); });
      row.append(button);
    } else row.append(make('span', making.failed.has(family.householdId) ? ` · not made: ${making.failed.get(family.householdId)}` : ' · waiting to be made', 'flashback-facts'));
    return row;
  }));
}

/** Draw the flashback's part of the ending, and make whatever videos this page is the one to make. */
export function renderFlashback(snapshot) {
  lastSnapshot = snapshot;
  const section = document.querySelector('#flashback');
  if (!section) return;
  const flashback = snapshot.flashback;
  if (!flashback?.ready) {
    section.hidden = true;
    // A class ended by mistake and taken up again (docs/HOST_PAGE.md §2.8): what this page made or failed to make, played and
    // read belongs to that ending, and its videos are gone from the server. When the class ends again it all starts afresh.
    if (!making.running && (making.done.length || making.failed.size || shownKey || transcriptOf)) {
      making.done.length = 0; making.failed.clear(); shownKey = ''; autoplayed = false; transcriptOf = null; queue = [];
    }
    return;
  }
  section.hidden = false;
  const host = snapshot.world.role === 'host';
  document.querySelector('#flashback-host').hidden = !host;
  document.querySelector('#flashback-title').textContent = host ? 'The families’ flashbacks' : 'Our story, looking back';
  // The story in words is the family's from the moment the class ends, video or no video; the Host's, once a family is chosen.
  document.querySelector('#flashback-words').hidden = host && !transcriptOf;
  if (!host) showTranscript(flashback.householdId);
  if (host) renderHostList(snapshot);
  else if (flashback.made) {
    const key = `${flashback.householdId}:${flashback.made.bytes}`;
    if (key !== shownKey) { shownKey = key; play(flashback.householdId, flashback.made, { autoplay: !autoplayed }); autoplayed = true; }
  }
  renderStatus();
  // The Host's page makes every family's; a Play Solo player's page makes its own, its computer being the Host's.
  if (flashback.keeps && (host || snapshot.solo) && wanted(snapshot).length) makeMissing();
}
