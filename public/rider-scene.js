// A rider's visit, played as a scene (owner, 2026-10-05: "I want to radically redesign the whole rider and or news person shows
// up. The conversation is boring. Let's redo each of them as a cutscene sort of like with the wedding. The environment should
// change in the cutscene based on where they are and who's around them."; docs/COLONIES.md §5.4e).
//
// Over the whole screen, on the cutscene's stage (public/cutscene.js): the place where the family's person is standing - their
// own yard with the house as it stands and the field as it is, a town's street, the volunteers' camp, a ford, the road or the
// woods - with whoever is near standing in it, the family on the left and the town's people or volunteers behind the rider on
// the right. The rider rides in and gets down; the questions are asked by the people there and answered by him; when he is let go
// he mounts and rides on, and the family says its last words. Every person, line and place is the server's (sim/rider-scene.mjs,
// sim/rider-talk.mjs): this file draws them, and decides only when each part of the riding in and out is drawn.
//
// The words go along the foot of the screen in the meeting's own strip (public/app.js `renderEncounter`, which paces them a line
// at a time); this tells it when the rider has got down and the talk can begin (`ready`), and is told who is speaking (`speaker`).
//
// Backdrops. stand-in: docs/ART_REQUESTS.md, request 2026-10-05 - rider scenes' backdrops: until the painted backdrops are drawn,
// the ground of each scene is the map's own ground at that spot (the flashback's `flashbackGround`, public/app.js), laid back
// toward a painted sky as a field seen from where the people stand, with the library's buildings, tents and trees set on it.
import { clipInfo, drawClip, drawSprite, sampleClip, spriteFrame } from './art.js';
import { clamp, clipFor, createStage, personHeight, placeCast, reducedMotion, skyTones } from './cutscene.js';
import { castVariant } from './motion.js';

/** The riding in, the getting down, the getting up and the riding on, in milliseconds; the fade from and to the map. */
export const RIDE_IN_MS = 1700, DISMOUNT_MS = 2050, REMOUNT_MS = 1850, RIDE_OUT_MS = 1500, FADE_MS = 700, REDUCED_FADE_MS = 220;
/** The ground the people stand on, down the scene: higher than the wedding's, because the strip at the foot holds the questions. */
export const SCENE_GROUND = 0.56;
/** Where the sky meets the land. */
export const HORIZON = 0.33;
/** A person's height in a rider's scene, as a share of the screen's. */
export const SCENE_PERSON = 0.24;
/**
 * The rider on foot, in the courier sheets' own pixels (Astra's `courier-dismount` sheet, 2026-09-12 request): every frame of
 * the getting down, standing by the horse and getting up is drawn at one scale, so the horse never grows or shrinks between them.
 */
export const COURIER_MAN = 190, COURIER_MOUNTED = 239;

/**
 * The buildings of a town's street by who built it. stand-in: docs/ART_REQUESTS.md, request 2026-10-05 - rider scenes' backdrops,
 * items 1-2. ceiling: by who built the town, not each town's own buildings; a street painted for each researched town would undo it.
 */
export const STREET = Object.freeze({
  gonzales: ['storehouse', 'shop-blacksmith', 'cabin-wide', 'shop-carpenter'],
  anglo: ['cabin-wide', 'shop-tavern', 'storehouse', 'shop-blacksmith'],
  tejano: ['jacal-broad', 'town-mexican-river', 'church-generic'],
  irish: ['village-irish-colony', 'cabin-wide'],
});
const TEJANO_TOWNS = new Set(['bexar', 'goliad', 'laredo', 'victoria', 'presidio-rio-grande', 'matamoros']);
const IRISH_TOWNS = new Set(['san-patricio', 'refugio']);
/** How tall each picture stands beside a grown person (1 is a person's height). */
const SIZE = Object.freeze({
  'house-round-log': 2.35, 'house-hewn-log': 2.35, 'house-dog-run': 2.35, 'house-jacal': 2.1, 'cabin-ruin': 1.9, tent: 1.25, campfire: 0.55,
  'camp-cookpot-tripod': 0.75, storehouse: 1.8, 'cabin-wide': 2, 'shop-tavern': 2.1, 'shop-blacksmith': 2.1, 'shop-carpenter': 2.1,
  'jacal-broad': 1.5, 'town-mexican-river': 2.4, 'church-generic': 2.4, 'village-irish-colony': 2.4, 'alamo-wall-corner': 2.2,
  'post-oak-large': 3.2, 'live-oak-large': 2.6, 'pecan-large': 3.3, cottonwood: 3.6, 'cypress-bald-large': 3.2, 'corn-mature': 0.85,
  'corn-young': 0.55, 'cotton-mature': 0.6, 'cotton-young': 0.45, 'fence-rail': 0.75,
});
const HOUSE_ART = Object.freeze({ 'round-log': 'house-round-log', 'hewn-log': 'house-hewn-log', 'dog-run': 'house-dog-run', jacal: 'house-jacal', saddlebag: 'house-round-log' });

/** The pieces set on the ground of a setting: what, where across the screen (0 to 1), how far back (0 at the people, 1 the horizon). */
export function piecesOf(setting) {
  const pieces = [];
  const put = (name, x, back = 0.35, size = SIZE[name] || 1, flip = false) => pieces.push({ name, x, back, size, flip });
  const kind = setting?.kind || 'road';
  if (kind === 'home') {
    const house = setting.house || { shelter: 'camp' };
    if (house.shelter === 'house') put(HOUSE_ART[house.layout] || 'house-round-log', 0.17, 0.3);
    else if (house.shelter === 'building') put(`house-${HOUSE_ART[house.layout] ? house.layout : 'round-log'}-${house.phase || 'site'}`, 0.17, 0.3, 2.35);
    else if (house.shelter === 'ruined') put('cabin-ruin', 0.17, 0.3);
    else { put('tent', 0.14, 0.3); put('campfire', 0.27, 0.22); }
    if (setting.field?.crop && setting.field.state !== 'bare') {
      const crop = `${setting.field.crop}-${setting.field.state === 'ripe' ? 'mature' : 'young'}`;
      for (let i = 0; i < 6; i++) put(crop, 0.66 + i * 0.06, 0.62 + (i % 2) * 0.04);
      put('fence-rail', 0.7, 0.5); put('fence-rail', 0.86, 0.5);
    }
    if (setting.woods) { put('post-oak-large', 0.04, 0.7); put('live-oak-large', 0.93, 0.78, undefined, true); }
  } else if (kind === 'town') {
    const id = setting.siteId || '';
    const row = id === 'gonzales' ? STREET.gonzales : TEJANO_TOWNS.has(id) ? STREET.tejano : IRISH_TOWNS.has(id) ? STREET.irish : STREET.anglo;
    row.forEach((name, i) => put(name, row.length === 1 ? 0.5 : 0.08 + i * (0.84 / (row.length - 1)), 0.62));
  } else if (kind === 'camp') {
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-05 - rider scenes' backdrops, item 3: the library's tents and fire.
    put('tent', 0.1, 0.55); put('tent', 0.3, 0.7); put('tent', 0.86, 0.6, undefined, true); put('tent', 0.68, 0.78);
    put('campfire', 0.5, 0.42); put('camp-cookpot-tripod', 0.56, 0.45);
    if (setting.woods) put('post-oak-large', 0.97, 0.85);
  } else if (kind === 'alamo') {
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-05 - rider scenes' backdrops, item 7: a corner of wall and the church.
    put('alamo-wall-corner', 0.16, 0.5); put('church-generic', 0.78, 0.7);
  } else if (kind === 'ford') {
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-05 - rider scenes' backdrops, items 4-5: the water painted, the library's trees.
    put('cottonwood', 0.08, 0.78); put('cypress-bald-large', 0.92, 0.82, undefined, true);
  } else if (setting.woods) {
    put('post-oak-large', 0.06, 0.55); put('pecan-large', 0.2, 0.8); put('live-oak-large', 0.84, 0.7, undefined, true); put('post-oak-large', 0.97, 0.5);
  }
  return pieces;
}

/**
 * The scene, bound to the meeting's own part of the page (`#encounter`). `hooks` are the map's own drawing, lent as the flashback
 * borrows them: `camera(canvas, cx, cy, scale)` and `ground(ctx, world, camera)`.
 */
export function createRiderScene({ root, hooks = {} }) {
  const canvas = root.querySelector('#encounter-canvas');
  const stage = createStage(canvas);
  const ctx = stage.ctx;
  const evidence = { open: false, id: null, phase: 'closed', setting: null, place: null, backdrop: null, pieces: [], drawn: [], rider: null, speaker: null, timeline: [] };
  window.__riderScene = evidence;
  let data = null, world = null, phase = 'closed', since = 0, frame = 0, speakerId = null, onGone = null;
  let ground = { key: null, canvas: null, kind: null };
  const clips = new Map();
  const clipOf = name => { if (!clips.has(name)) clips.set(name, clipInfo(name)); return clips.get(name); };
  const fadeMs = () => (reducedMotion() ? REDUCED_FADE_MS : FADE_MS);
  // A meeting whose riding in has been seen on this page is not ridden in again when it is opened again (a per-viewer convenience).
  const seen = id => { try { return sessionStorage.getItem(`rider-scene:${id}`) === 'arrived'; } catch { return false; } };
  const remember = id => { try { sessionStorage.setItem(`rider-scene:${id}`, 'arrived'); } catch { /* a private window */ } };

  function setPhase(to) {
    phase = to; since = performance.now(); evidence.phase = to;
    evidence.timeline.push({ phase: to, at: Math.round(since), reduced: reducedMotion() });
    if (evidence.timeline.length > 60) evidence.timeline.shift();
    root.dataset.phase = to;
  }

  /** The scene comes up for this meeting: ridden into if it is open and has not been seen, standing already if it has. */
  function show(encounter, snapshotWorld) {
    world = snapshotWorld;
    if (!encounter?.scene) return;
    const fresh = data?.id !== encounter.id;
    const was = data?.status;
    data = encounter;
    // He would wait no longer, or was sent on from elsewhere, while the scene stood open: he mounts and rides off, and the
    // scene stays for the student to read the last words and put away.
    if (!fresh && phase === 'talk' && was === 'open' && encounter.status === 'closed' && encounter.kind !== 'alamo-runner') { setPhase(reducedMotion() ? 'away' : 'departing'); return; }
    if (!fresh && phase !== 'closed') return;
    evidence.open = true; evidence.id = encounter.id; evidence.setting = encounter.scene.setting; evidence.place = encounter.scene.place;
    speakerId = null;
    if (encounter.status === 'open' && !seen(encounter.id) && !reducedMotion()) setPhase('arrive');
    else { remember(encounter.id); setPhase('talk'); }
    if (!frame) frame = requestAnimationFrame(draw);
  }
  /** The latest of the meeting it is showing (its words, a status closed). */
  function keep(encounter) { if (encounter && data && encounter.id === data.id) data = encounter; }
  /** Put away at once: Escape, the ×, a page that has moved on. */
  function hide() {
    evidence.open = false; setPhase('closed');
    if (frame) cancelAnimationFrame(frame);
    frame = 0; data = null; onGone = null;
  }
  /** He mounts and rides on, then the black; `done` when the scene is over. Straight to the black where less motion is asked for. */
  function leave(done) {
    if (!data || phase === 'leave' || phase === 'gone') { done?.(); return; }
    onGone = done || null;
    setPhase('leave');
  }

  // ------------------------------------------------------------------ the ground

  /**
   * The map's own ground at the spot, laid back toward the horizon (stand-in: request 2026-10-05 - rider scenes' backdrops): drawn
   * once from above as the flashback draws it, then laid down a band at a time, the far bands squeezed and widened and the near
   * ones opened out, so it reads as the field in front of the people. Kept until the scene or the screen's size changes.
   */
  function groundFor(width, height) {
    const at = data?.scene?.at;
    const light = data?.scene?.setting?.light || 'noon';
    const key = `${data?.id}:${Math.round(width)}x${Math.round(height)}:${light}`;
    if (ground.key === key) return ground;
    ground = { key, canvas: null, kind: 'painted' };
    if (!at || !world?.map || typeof hooks.ground !== 'function' || typeof hooks.camera !== 'function') return ground;
    try {
      const top = document.createElement('canvas');
      top.width = 640; top.height = 400;
      const miles = 0.55;
      const camera = hooks.camera(top, at.x, at.y - miles * 0.18, top.width / miles);
      hooks.ground(top.getContext('2d'), world, camera);
      const laid = document.createElement('canvas');
      laid.width = Math.max(1, Math.round(width)); laid.height = Math.max(1, Math.round(height));
      const g = laid.getContext('2d');
      const horizon = height * HORIZON, depth = height - horizon, bands = 56;
      for (let i = 0; i < bands; i++) {
        const t0 = i / bands, t1 = (i + 1) / bands;
        // Far bands hold many rows of the ground, near ones few: the source row runs as the square root of the screen row.
        const v0 = Math.sqrt(t0), v1 = Math.sqrt(t1);
        const span = top.width * (1 - 0.55 * (t0 + t1) / 2);
        g.drawImage(top, (top.width - span) / 2, v0 * top.height, span, Math.max(1, (v1 - v0) * top.height), 0, horizon + t0 * depth, width, depth / bands + 1);
      }
      // Darker nearer the people and hazed toward the horizon, as a field looks at that hour.
      const shade = g.createLinearGradient(0, horizon, 0, height);
      const [, far] = skyTones(light);
      shade.addColorStop(0, far); shade.addColorStop(0.18, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(40,30,15,.28)');
      g.fillStyle = shade; g.fillRect(0, horizon, width, depth);
      ground = { key, canvas: laid, kind: 'map-ground' };
    } catch { ground = { key, canvas: null, kind: 'painted' }; }
    return ground;
  }

  function drawBackdrop(width, height) {
    const setting = data.scene.setting || {};
    const light = setting.light || 'noon';
    const horizon = height * HORIZON;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + height * 0.05);
    const tones = skyTones(light);
    sky.addColorStop(0, tones[0]); sky.addColorStop(1, tones[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    const laid = groundFor(width, height);
    if (laid.canvas) ctx.drawImage(laid.canvas, 0, 0, width, height);
    else {
      // No map to stand on (a class on the invented country before its ground has loaded): the wedding's painted yard.
      const fill = ctx.createLinearGradient(0, horizon, 0, height);
      fill.addColorStop(0, light === 'night' ? '#39422c' : '#9aa35e'); fill.addColorStop(1, light === 'night' ? '#262b1d' : '#6f7a3e');
      ctx.fillStyle = fill; ctx.fillRect(0, horizon, width, height - horizon);
    }
    // Timber along the horizon where there is timber about, or along the water.
    if (setting.woods || setting.kind === 'ford' || setting.water) stage.paintTreeline(width, height, horizon + height * 0.006, light, { count: 44, alpha: 0.8, scale: 0.5 });
    // The water at a ford, across the ground behind the people.
    if (setting.kind === 'ford') {
      const y = height * (HORIZON + 0.1);
      const water = ctx.createLinearGradient(0, y - height * 0.03, 0, y + height * 0.04);
      water.addColorStop(0, light === 'night' ? '#26334a' : '#7fa3b8'); water.addColorStop(1, light === 'night' ? '#1b2436' : '#5d8196');
      ctx.fillStyle = water;
      ctx.beginPath(); ctx.moveTo(0, y - height * 0.02);
      for (let x = 0; x <= width; x += width / 12) ctx.lineTo(x, y - height * 0.02 + Math.sin(x / width * Math.PI * 2) * height * 0.01);
      for (let x = width; x >= 0; x -= width / 12) ctx.lineTo(x, y + height * 0.035 + Math.sin(x / width * Math.PI * 2 + 1) * height * 0.012);
      ctx.closePath(); ctx.fill();
    }
    // The road the rider came by, running back to the horizon.
    if (setting.kind === 'road' || setting.kind === 'ford') {
      ctx.save(); ctx.fillStyle = light === 'night' ? 'rgba(70,58,40,.45)' : 'rgba(170,140,95,.55)';
      ctx.beginPath(); ctx.moveTo(width * 0.47, horizon); ctx.lineTo(width * 0.53, horizon); ctx.lineTo(width * 0.95, height); ctx.lineTo(width * 0.45, height); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    return laid.kind;
  }

  /** The buildings, tents and trees set on the ground, far ones first. Returns the names drawn. */
  function drawPieces(width, height, h) {
    const drawn = [];
    const groundY = height * SCENE_GROUND, horizon = height * HORIZON;
    for (const piece of piecesOf(data.scene.setting).sort((a, b) => b.back - a.back)) {
      if (!spriteFrame(piece.name)) continue;
      const y = groundY - (groundY - horizon) * piece.back;
      const scale = 1 - piece.back * 0.55;
      if (drawSprite(ctx, piece.name, width * piece.x, y, h * piece.size * scale, { flip: piece.flip }) > 0) drawn.push(piece.name);
    }
    return drawn;
  }

  /** One of the courier sheets' clips at one scale for the whole sheet (`COURIER_MAN`). */
  function drawCourier(name, x, y, k, t, flip) {
    const clip = clipOf(name);
    if (!clip) return null;
    const sample = sampleClip(clip, t, false, reducedMotion());
    const frameOf = sample && spriteFrame(sample.sprite);
    if (!frameOf) return null;
    return drawSprite(ctx, sample.sprite, x, y, (frameOf.logicalHeight || frameOf.h) * k, { flip }) > 0 ? sample.sprite : null;
  }

  /**
   * The rider, by where in his visit he is: riding in from the right and getting down by his horse, standing by it talking or
   * listening, getting up and riding off the way he came. Travis's runner walks in and out on foot.
   */
  function drawRider(width, height, h, now) {
    const rider = data.scene.rider || {};
    const elapsed = now - since;
    const x0 = width / 2 + h * 1.0, y = height * SCENE_GROUND;
    const k = h / COURIER_MAN;
    const talking = speakerId && speakerId === rider.id;
    let x = x0, sprite = null, state = phase;
    if (rider.on === 'foot') {
      const figure = { band: 'adult', sex: 'male', appearance: null };
      if (phase === 'arrive' && elapsed < RIDE_IN_MS) { x = x0 + (width * 0.6) * (1 - elapsed / RIDE_IN_MS); sprite = drawClip(ctx, 'courier-march', x, y, h * 1.02, { timeMs: now, flip: true }) ? 'courier-march' : null; state = 'walking-in'; }
      else if (['leave', 'gone', 'departing', 'away'].includes(phase)) { const t = phase === 'away' ? 1 : clamp(elapsed / RIDE_OUT_MS, 0, 1); x = x0 + width * 0.6 * t; sprite = drawClip(ctx, 'courier-march', x, y, h * 1.02, { timeMs: now }) ? 'courier-march' : null; state = 'walking-out'; }
      else { const clip = clipFor(figure, talking ? 'speak' : 'idle', 'w'); sprite = stage.drawPerson(figure, { x, y, h, id: rider.id }, clip, { at: now, speaking: talking }) ? clip.id : null; }
      return { x, y, state, sprite, top: y - h * 1.05 };
    }
    stage.shadow(x0, y, h * 1.6, 0.35);
    if (phase === 'arrive') {
      if (elapsed < RIDE_IN_MS) {
        // Riding in from off the right at a canter that slows to his place.
        const t = elapsed / RIDE_IN_MS, eased = 1 - (1 - t) * (1 - t);
        x = x0 + width * 0.7 * (1 - eased);
        sprite = drawClip(ctx, 'mounted-courier-e', x, y, COURIER_MOUNTED * k, { timeMs: now, flip: true }) ? 'mounted-courier-e' : null;
        state = 'riding-in';
      } else { sprite = drawCourier('courier-dismount', x, y, k, elapsed - RIDE_IN_MS, true); state = 'dismounting'; }
    } else if (['leave', 'gone', 'departing', 'away'].includes(phase)) {
      if (phase === 'away' || elapsed >= REMOUNT_MS + RIDE_OUT_MS) return { x: width * 2, y, state: 'gone', sprite: null, top: y };
      if (elapsed < REMOUNT_MS && !reducedMotion()) { sprite = drawCourier('courier-remount', x, y, k, elapsed, true); state = 'mounting'; }
      else {
        // Back the way he came, off the right.
        const t = clamp((elapsed - REMOUNT_MS) / RIDE_OUT_MS, 0, 1);
        x = x0 + width * 0.7 * t * t;
        sprite = drawClip(ctx, 'mounted-courier-e', x, y, COURIER_MOUNTED * k, { timeMs: now }) ? 'mounted-courier-e' : null;
        state = 'riding-on';
      }
    } else { sprite = drawCourier(talking ? 'courier-onfoot-speak' : 'courier-onfoot-listen', x, y, k, now, true); state = talking ? 'speaking' : 'listening'; }
    // While the courier sheets are still on their way he is drawn as a grown man of the cast, so the scene is never without him.
    if (!sprite && (phase === 'talk' || state === 'dismounting')) {
      const figure = { band: 'adult', sex: 'male', appearance: null };
      const clip = clipFor(figure, talking ? 'speak' : 'idle', 'w');
      stage.drawPerson(figure, { x: x0 - h * 0.3, y, h, id: rider.id }, clip, { at: now, speaking: talking });
      sprite = `loading:${clip.id}`;
    }
    return { x, y, state, sprite, top: y - COURIER_MAN * k * 1.04 };
  }

  function drawPeople(width, height, now) {
    const scene = data.scene;
    const entries = (scene.order || Object.keys(scene.cast)).map(id => scene.cast[id]).filter(Boolean);
    const { places, h } = placeCast(entries, width, height, { ground: SCENE_GROUND, share: SCENE_PERSON, gap: 0.62, step: 0.48 });
    const drawn = [];
    const speakerPlace = places.find(place => place.id === speakerId);
    stage.glow(speakerPlace);
    const back = places.filter(place => place.row < 0), front = places.filter(place => place.row >= 0);
    for (const place of back) drawn.push(person(place, now));
    const rider = drawRider(width, height, h, now);
    for (const place of front) drawn.push(person(place, now));
    if (speakerPlace) stage.nameTag(scene.cast[speakerId]?.given || '', speakerPlace.x, speakerPlace.y - speakerPlace.h * 1.04, width);
    else if (speakerId && speakerId === scene.rider?.id && ['speaking', 'listening'].includes(rider.state)) stage.nameTag(scene.rider.given || scene.rider.name, rider.x, rider.top, width);
    return { drawn, rider: { state: rider.state, sprite: rider.sprite, x: Math.round(rider.x), y: Math.round(rider.y) } };

    function person(place, at) {
      const one = scene.cast[place.id].family || scene.cast[place.id].appearance ? scene.cast[place.id] : { ...scene.cast[place.id], variant: castVariant(scene.cast[place.id]) };
      const speaking = place.id === speakerId;
      const clip = clipFor(one, speaking ? 'speak' : 'idle', place.face === 'w' ? 'w' : 'e');
      const width_ = stage.drawPerson(one, place, clip, { at, speaking });
      return { id: place.id, role: one.role, clip: clip.id, x: Math.round(place.x), y: Math.round(place.y), h: Math.round(place.h), drawn: width_ > 0 };
    }
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (!data?.scene || phase === 'closed') return;
    const { width, height } = stage.fit();
    ctx.clearRect(0, 0, width, height);
    const elapsed = now - since;
    const h = personHeight(width, height, SCENE_PERSON);
    const backdrop = drawBackdrop(width, height);
    const pieces = drawPieces(width, height, h);
    const people = drawPeople(width, height, now);
    stage.grade(width, height, data.scene.setting?.light || 'noon', now);
    // Up out of black as he comes, and down into it once he has gone.
    let dark = 0;
    if (phase === 'arrive') dark = 1 - clamp(elapsed / fadeMs(), 0, 1);
    const leaving = reducedMotion() ? 0 : REMOUNT_MS + RIDE_OUT_MS;
    if (phase === 'leave') dark = clamp((elapsed - leaving) / fadeMs(), 0, 1);
    stage.darken(dark, width, height);
    Object.assign(evidence, { backdrop, pieces, drawn: people.drawn, rider: people.rider, speaker: speakerId, dark: +dark.toFixed(2) });
    // On foot (Travis's runner) the arriving is only the walk in.
    if (phase === 'arrive' && elapsed >= RIDE_IN_MS + (data.scene.rider?.on === 'foot' ? 0 : DISMOUNT_MS)) { remember(data.id); setPhase('talk'); }
    else if (phase === 'departing' && elapsed >= REMOUNT_MS + RIDE_OUT_MS) setPhase('away');
    else if (phase === 'leave' && elapsed >= leaving + fadeMs()) finish();
  }

  /** His going cut short (Continue, Escape): over now. */
  function finish() {
    if (phase !== 'leave') return;
    setPhase('gone');
    const done = onGone; onGone = null;
    done?.();
  }

  return {
    show, keep, hide, leave, finish,
    /** Who is speaking now, by id: the one whose line the strip has just put up. */
    speaker(id) { speakerId = id || null; evidence.speaker = speakerId; },
    /** Whether the talk can begin: he has got down from his horse (at once, where less motion is asked for). */
    ready(id) { return Boolean(data) && data.id === id && phase !== 'arrive'; },
    get phase() { return phase; },
    get leaving() { return phase === 'leave' || phase === 'gone' ? data : null; },
  };
}
