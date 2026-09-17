// Local sprite and animation library. Everything here is presentation-only: callers
// own the clock and the ground position. No function reads or changes simulation state.
// A missing atlas always returns 0, preserving the caller's procedural fallback.
const BASE = '/assets/frontier-v1/';
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)". A second, separate library of frames
// Claude drew for requests Astra has not delivered (scripts/build-claude-standins.mjs). Its sheets carry absolute image
// paths and every entry `madeBy: "claude"`; a frame of the same name in Astra's atlas always wins, so her delivery
// replaces a stand-in the moment it is registered. Missing or unreadable, it changes nothing.
const STANDIN_MANIFEST = '/assets/claude-standins/atlas.json';
const CORE_SHEETS = ['nature', 'buildings', 'transport', 'civilians'];
const MOTIONS = new Set(['none', 'sway', 'breathe', 'rock', 'recoil', 'drift', 'pulse']);
const art = { status: 'idle', frames: {}, sheets: {}, images: {}, clips: {} };
let manifestPending = null;
const sheetPending = new Map();
const listeners = new Set();

/** Repaint notifications include later lazy sheets. Returns an unsubscribe function. */
export function onArtReady(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function artStatus() { return art.status; }
export function hasSprite(name) {
  const frame = art.frames[name];
  return Boolean(frame && art.images[frame.sheet]);
}

function notifyReady() {
  for (const listener of listeners) listener(art.status);
}
function loadImage(source) {
  return new Promise(resolve => {
    if (typeof Image !== 'function') { resolve(null); return; }
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
async function readManifest(name) {
  try {
    const response = await fetch(name.startsWith('/') ? name : BASE + name);
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
/** Add the Claude-drawn stand-ins behind Astra's frames: hers keep their names, theirs fill the gaps. */
function mergeStandins(standins) {
  if (!standins?.sheets || !standins.frames) return;
  for (const [name, sheet] of Object.entries(standins.sheets)) if (!art.sheets[name]) art.sheets[name] = sheet;
  for (const [name, frame] of Object.entries(standins.frames)) if (!art.frames[name] && art.sheets[frame.sheet]) art.frames[name] = frame;
}
function ensureManifests() {
  if (!manifestPending) {
    art.status = 'loading';
    manifestPending = (async () => {
      const [atlas, animation, standins] = await Promise.all([readManifest('atlas.json'), readManifest('animation.json'), readManifest(STANDIN_MANIFEST)]);
      art.frames = atlas?.frames || {};
      art.sheets = atlas?.sheets || {};
      art.clips = animation?.clips || {};
      mergeStandins(standins);
      if (!atlas) art.status = 'unavailable';
      return Boolean(atlas);
    })();
  }
  return manifestPending;
}
function requestSheet(name) {
  if (!art.sheets[name]) return Promise.resolve(null);
  if (!sheetPending.has(name)) {
    sheetPending.set(name, (async () => {
      const source = art.sheets[name].image;
      const image = await loadImage(source.startsWith('/') ? source : BASE + source);
      if (image) art.images[name] = image;
      art.status = Object.keys(art.images).length ? 'ready' : 'unavailable';
      notifyReady();
      return image;
    })());
  }
  return sheetPending.get(name);
}

/**
 * Normal play decodes only the core scenery/transport sheets and civilians, if supplied.
 * drawSprite/drawClip request a missing sheet on first use. The developer catalog uses
 * loadArt({ all: true }); a caller may also explicitly preload { sheets: ['military'] }.
 * Concurrent calls share manifest and sheet requests, including failed requests.
 */
export async function loadArt({ all = false, sheets = [] } = {}) {
  if (!await ensureManifests()) return art;
  const wanted = all ? Object.keys(art.sheets) : [...CORE_SHEETS, ...sheets];
  await Promise.all([...new Set(wanted)].filter(name => art.sheets[name]).map(requestSheet));
  art.status = Object.keys(art.images).length ? 'ready' : 'unavailable';
  return art;
}

/** Draw a frame by its ground anchor. Height refers to the pose family's logical
 * reference height; tightly cropped poses do not resize the person between frames.
 * Returns its screen width, or 0 for a fallback. */
export function drawSprite(ctx, name, x, y, height, { flip = false, alpha = 1, anchor } = {}) {
  const frame = art.frames[name];
  const image = frame && art.images[frame.sheet];
  if (!image || !(height > 0)) {
    if (frame && !image) requestSheet(frame.sheet);
    return 0;
  }
  const scale = height / (frame.logicalHeight || frame.h);
  const width = frame.w * scale, drawnHeight = frame.h * scale;
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, -width * (anchor?.[0] ?? frame.anchorX), -drawnHeight * (anchor?.[1] ?? frame.anchorY), width, drawnHeight);
  ctx.restore();
  return width;
}

export function spriteNames() { return Object.keys(art.frames); }
export function spriteFrame(name) { return art.frames[name] ? { ...art.frames[name] } : null; }
export function sheetInfo() { return Object.fromEntries(Object.entries(art.sheets).map(([name, sheet]) => [name, { ...sheet }])); }
export function clipNames() { return Object.keys(art.clips); }
export function clipInfo(name) {
  const clip = art.clips[name];
  return clip ? structuredClone(clip) : null;
}

function neutralMotion() { return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }; }
function clipDuration(clip) {
  if (!clip || !Array.isArray(clip.frames) || !clip.frames.length) return 0;
  let total = 0;
  for (const frame of clip.frames) {
    if (typeof frame.sprite !== 'string' || !frame.sprite || !Number.isFinite(frame.duration) || frame.duration <= 0) return 0;
    total += frame.duration;
  }
  return Number.isFinite(total) ? total : 0;
}
function motionAt(kind, progress) {
  const motion = neutralMotion();
  const wave = Math.sin(progress * Math.PI * 2);
  if (kind === 'sway') motion.rotation = wave * .026;
  else if (kind === 'breathe') { motion.scaleY = 1 + wave * .018; motion.scaleX = 1 - wave * .006; }
  else if (kind === 'rock') { motion.rotation = wave * .018; motion.y = -Math.abs(wave) * .006; }
  else if (kind === 'recoil') {
    const kick = progress < 1 / 3 ? Math.sin(progress * Math.PI * 3) : 0;
    motion.x = -kick * .08; // The carriage rolls back; the gun never stretches.
  } else if (kind === 'drift') { motion.x = wave * .025; motion.y = -Math.abs(wave) * .025; }
  else if (kind === 'pulse') {
    const pulse = (1 - Math.cos(progress * Math.PI * 2)) / 2;
    motion.scaleX = motion.scaleY = 1 + pulse * .025; motion.alpha = 1 - pulse * .15;
  }
  return motion;
}

/**
 * Pure time sampling. Frame durations are milliseconds, independent of repaint rate.
 * `duration` optionally sets the procedural motion cycle; it never retimes the frames.
 * A non-looping clip clamps to its last pose. Pause/reduced motion choose a stable first
 * pose and neutral transform. To freeze a particular frame, hold timeMs in the caller
 * instead. Motion x/y are fractions of the requested drawing height, rotation radians.
 */
export function sampleClip(clip, timeMs = 0, paused = false, reducedMotion = false) {
  const durationMs = clipDuration(clip);
  if (!durationMs) return null;
  const frozen = paused || reducedMotion;
  const elapsed = frozen ? 0 : (Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0);
  const looping = clip.loop !== false;
  const at = looping ? elapsed % durationMs : Math.min(elapsed, durationMs);
  let frameIndex = clip.frames.length - 1, edge = 0;
  for (let index = 0; index < clip.frames.length; index++) {
    edge += clip.frames[index].duration;
    if (at < edge) { frameIndex = index; break; }
  }
  const motionDuration = Number.isFinite(clip.duration) && clip.duration > 0 ? clip.duration : durationMs;
  const motionProgress = looping ? (elapsed % motionDuration) / motionDuration : Math.min(1, elapsed / motionDuration);
  const kind = MOTIONS.has(clip.motion) ? clip.motion : 'none';
  return {
    sprite: clip.frames[frameIndex].sprite,
    frameIndex,
    timeMs: at,
    durationMs,
    progress: at / durationMs,
    ended: !looping && elapsed >= durationMs,
    motion: frozen ? neutralMotion() : motionAt(kind, motionProgress),
  };
}

function hashKey(key) {
  let hash = 0;
  for (const character of String(key)) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/**
 * Draw a clip about the same ground anchor as a static sprite. The clock and a stable
 * optional entity seed come from the caller; neither Date nor simulation state is read.
 * Looping clips can be de-synchronised by seed. One-shots always begin at their start.
 */
export function drawClip(ctx, name, x, y, height, {
  timeMs = 0, seed = 0, paused = false, reducedMotion = false, flip = false, alpha = 1,
} = {}) {
  const clip = art.clips[name];
  const duration = clipDuration(clip);
  if (!duration || !(height > 0)) return 0;
  const offset = clip.loop !== false && seed !== 0 && seed !== '' && seed != null ? hashKey(seed) / 4294967296 * duration : 0;
  const sample = sampleClip(clip, timeMs + offset, paused, reducedMotion);
  if (!sample) return 0;
  const motion = sample.motion;
  ctx.save();
  ctx.translate(x + motion.x * height * (flip ? -1 : 1) * (clip.recoilSign || 1), y + motion.y * height);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(motion.rotation);
  ctx.scale(motion.scaleX, motion.scaleY);
  const width = drawSprite(ctx, sample.sprite, 0, (clip.bodyOffsetY || 0) * height, height, { alpha: alpha * motion.alpha });
  // Rigs keep body/cargo separate from wheels. Parts use explicit local pivots;
  // rotating a complete wagon image would turn the occupants upside down.
  for (const part of clip.parts || []) {
    ctx.save(); ctx.translate(part.x * height, part.y * height);
    const spin = paused || reducedMotion ? 0 : timeMs / 1000 * (part.turnsPerSecond || 0) * Math.PI * 2;
    ctx.rotate(spin);
    drawSprite(ctx, part.sprite, 0, 0, part.height * height, { alpha, anchor: part.anchor });
    ctx.restore();
  }
  ctx.restore();
  return width * Math.abs(motion.scaleX);
}

/** Stable visual variety: a camera move never picks a different building or person. */
export function pickSprite(options, key) {
  if (!options.length) return undefined;
  // Keep the original signed-hash mapping so existing homes retain their appearance.
  let hash = 0;
  for (const character of String(key)) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return options[((hash % options.length) + options.length) % options.length];
}
