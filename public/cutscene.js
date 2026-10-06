// The cutscene's stage: what the lone parent's scenes (public/courtship.js) and a rider's scene (public/rider-scene.js) draw with.
//
// The owner, 2026-10-05: "Let's redo each of them as a cutscene sort of like with the wedding." So the wedding's picture - a
// canvas over the whole screen, people standing on the ground of a place, the one speaking glowing at their feet and named over
// their head, the light of the hour over it all, fades to black - is taken out of the wedding and kept here, and both kinds of
// scene draw with it. Pure drawing: who stands where, what is said and when is each scene's own (and the server's).
import { clipReady, drawClip, drawSprite } from './art.js';
import { avatarVariant } from './avatar-art.js';

/** A grown person's drawn height, as a share of the scene's height (and never wider than a share of its width). */
export const PERSON_SHARE = 0.27, PERSON_WIDTH_SHARE = 0.15;
/** Where the ground the people stand on is, down the scene. The strip at the foot covers what is below. */
export const GROUND = 0.73;
/** How big a child is drawn, by band, as the map draws them (public/motion.js `FIGURE_SCALE`). */
export const BAND_SCALE = Object.freeze({ infant: 0.36, small: 0.52, child: 0.7, youth: 0.9, adult: 1 });
/** Poses a grown cast figure has for the scenes (Claude-drawn, request 2026-09-29, item 1), and what stands in for each until then. */
const POSE_STANDIN = Object.freeze({ greet: 'speak', laugh: 'speak', shy: 'idle', vow: 'idle', 'read-paper': 'speak', speak: 'speak' });

export const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** A grown person's height in a scene of this size. */
export const personHeight = (width, height, share = PERSON_SHARE) => Math.min(height * share, width * PERSON_WIDTH_SHARE);

/** The figure a person of the scenes is drawn as: a child's own, a grown person's cast chosen by their looks, the elder for the officer. */
export function figureOf(person) {
  // The priest who marries a Tejano family (sim/courtship.mjs `rite: 'priest'`) is the elder in the dark clothes the server gives him.
  if (person?.official) return { figure: 'elder', grown: true, appearance: person.priest ? person.appearance || null : null };
  const band = person?.band || 'adult';
  if (band === 'infant') return { figure: 'infant', grown: false, appearance: person.appearance || null };
  if (band === 'small') return { figure: 'smallchild', grown: false, appearance: person.appearance || null };
  if (band === 'child') return { figure: person.sex === 'female' ? 'girl' : 'boy', grown: false, appearance: person.appearance || null };
  // Somebody not of the family, with no looks of their own sent (a town's keeper, a volunteer): the figure the map draws them as.
  if (person?.variant && !person.appearance) return { figure: person.variant, grown: true, appearance: null };
  // An adolescent is Astra's adolescent figure, a grown person her figure for their head (public/avatar-identity.js, 2026-10-02).
  return { figure: avatarVariant(person?.appearance, person?.sex || 'male', person || {}), grown: true, appearance: person?.appearance || null };
}

/**
 * The clip for somebody in a pose, facing `face` ('e' or 'w'), and whether it is mirrored. `ready` says whether a clip can be
 * drawn now (public/art.js `clipReady`): a pose not drawn yet falls back to the nearest delivered one (`POSE_STANDIN`).
 */
export function clipFor(person, pose, face, ready = clipReady) {
  const { figure, grown } = figureOf(person);
  // Astra's family figures of 2026-10-02 (`father-*`, `mother-*`, `youth-*`) have no west idle: the east one is mirrored.
  const idle = face === 'w' && /^(father|mother|youth)-/.test(figure) ? { id: `${figure}-idle-e`, flip: true } : { id: `${figure}-idle-${face}`, flip: false };
  if (!grown || !pose || pose === 'idle') return idle;
  if (pose === 'front') return { id: `${figure}-idle-s`, flip: false };
  // The officer's reading pose is the elder's own (request item 2); the scene's four poses are every cast figure's (item 1).
  const own = pose === 'read-paper' ? `elder-read-paper` : `${figure}-${pose}`;
  if (ready(own)) return { id: own, flip: face === 'w' };
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's wedding, items 1 and 2: the delivered speaking cycle
  // for a greeting, a laugh or the reading, and standing still for a shy glance or the vow, until those poses are drawn.
  const fallback = POSE_STANDIN[pose] || 'idle';
  return fallback === 'speak' ? { id: `${figure}-speak`, flip: face === 'w' } : idle;
}

/**
 * Where everybody of a scene stands, from the data each person carries (sim/rider-scene.mjs `layoutOf`): `side` (left of the
 * middle or right of it), `slot` (0 nearest the middle, each step about half a person further out), `row` (1 a step in front,
 * -1 a step behind) and `face`. Children stand closer together than grown people. A crowd too wide for the screen is drawn closer
 * rather than cut. Pure: the proofs and tests read it.
 */
export function placeCast(entries, width, height, { ground: groundShare = GROUND, share = PERSON_SHARE, gap = 0.55, step = 0.5 } = {}) {
  const h = personHeight(width, height, share);
  const ground = height * groundShare;
  const centre = width / 2;
  const places = entries.filter(Boolean).map(entry => {
    const scale = BAND_SCALE[entry.band] ?? 1;
    const row = entry.row || 0;
    const sign = entry.side === 'left' ? -1 : entry.side === 'right' ? 1 : 0;
    const x = centre + sign * h * (gap + (entry.slot || 0) * step);
    // A step behind is a little smaller and higher up the ground; a step in front a little lower.
    const depth = row < 0 ? 0.88 : 1;
    return { id: entry.id, x, y: ground + row * h * 0.12, h: h * scale * depth, face: entry.face || (sign < 0 ? 'e' : 'w'), row };
  });
  const xs = places.map(place => place.x);
  if (xs.length) {
    const lo = Math.min(...xs) - h * 0.3, hi = Math.max(...xs) + h * 0.3;
    const room = width * 0.96;
    if (hi - lo > room) { const squeeze = room / (hi - lo); for (const place of places) place.x = centre + (place.x - (lo + hi) / 2) * squeeze; }
    else if (lo < width * 0.02) { for (const place of places) place.x += width * 0.02 - lo; }
    else if (hi > width * 0.98) { for (const place of places) place.x -= hi - width * 0.98; }
  }
  places.sort((a, b) => a.y - b.y);
  return { places, h, ground };
}

/** The stage over one canvas: fitting it to the screen, the painted yard, the light, the speaker's glow and name, the black. */
export function createStage(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio)), height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: canvas.clientWidth, height: canvas.clientHeight, ratio };
  }

  /** A painted yard: sky, a line of trees, the ground and a worn place before the door. The stand-in until item 5 is drawn. */
  function paintYard(width, height, light, { treeline: line = 0.47, worn = true } = {}) {
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    const tones = skyTones(light);
    sky.addColorStop(0, tones[0]); sky.addColorStop(1, tones[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    // The tree line: rounded crowns in two greens, drawn from a fixed pattern so the scene does not shimmer.
    const treeline = height * line;
    paintTreeline(width, height, treeline, light);
    const ground = ctx.createLinearGradient(0, treeline, 0, height);
    ground.addColorStop(0, light === 'night' ? '#39422c' : '#9aa35e'); ground.addColorStop(1, light === 'night' ? '#262b1d' : '#6f7a3e');
    ctx.fillStyle = ground; ctx.fillRect(0, treeline, width, height - treeline);
    if (worn) {
      ctx.fillStyle = light === 'night' ? 'rgba(70,60,40,.35)' : 'rgba(176,150,98,.55)';
      ctx.beginPath(); ctx.ellipse(width / 2, height * 0.7, width * 0.42, height * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function paintTreeline(width, height, treeline, light, { count = 26, alpha = 1, scale = 1 } = {}) {
    ctx.save(); ctx.globalAlpha = alpha;
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = light === 'night' ? (pass ? '#233126' : '#1b271e') : pass ? '#6f7f45' : '#56683a';
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1)) * width * 1.1 - width * 0.05 + (pass ? width * 0.02 : 0);
        const r = height * (0.05 + ((i * 37 + pass * 11) % 7) / 90) * scale;
        ctx.beginPath(); ctx.ellipse(x, treeline - r * 0.3 + pass * height * 0.02 * scale, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /** The light of the hour over the whole picture, and a soft edge like an old storybook page; `motes` drifting in warm air. */
  function grade(width, height, light, at, { motes = false } = {}) {
    ctx.save();
    if (light === 'morning') { const g = ctx.createLinearGradient(0, 0, width, height); g.addColorStop(0, 'rgba(255,236,190,.22)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
    if (light === 'evening') { ctx.fillStyle = 'rgba(255,146,62,.16)'; ctx.fillRect(0, 0, width, height); }
    if (light === 'night') {
      ctx.fillStyle = 'rgba(16,24,48,.34)'; ctx.fillRect(0, 0, width, height);
      // A lantern's warmth about the people, so a scene by night is still warm.
      const glow = ctx.createRadialGradient(width / 2, height * 0.62, 0, width / 2, height * 0.62, width * 0.45);
      glow.addColorStop(0, 'rgba(255,196,110,.30)'); glow.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    }
    const edge = ctx.createRadialGradient(width / 2, height * 0.55, Math.min(width, height) * 0.35, width / 2, height * 0.55, Math.max(width, height) * 0.75);
    edge.addColorStop(0, 'rgba(40,24,10,0)'); edge.addColorStop(1, 'rgba(40,24,10,.42)');
    ctx.fillStyle = edge; ctx.fillRect(0, 0, width, height);
    // A few motes of light drifting in the warm air (not where motion is to be kept still).
    if (motes && !reducedMotion()) {
      for (let i = 0; i < 18; i++) {
        const t = (at / 9000 + i / 18) % 1;
        const x = width * ((i * 0.618) % 1), y = height * (0.62 - t * 0.5);
        ctx.fillStyle = `rgba(255,226,150,${0.35 * Math.sin(t * Math.PI)})`;
        ctx.beginPath(); ctx.arc(x + Math.sin(at / 1300 + i) * 8, y, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /** A backdrop drawn to cover the scene, anchored at its foot so the ground is never cut away. */
  function drawCover(name, frameOf, width, height) {
    const logicalH = frameOf.logicalHeight || frameOf.h;
    const scale = Math.max(width / frameOf.w, height / frameOf.h);
    const drawnH = logicalH * scale;
    const anchorY = frameOf.anchorY ?? 1;
    return drawSprite(ctx, name, width / 2 + (frameOf.anchorX - 0.5) * frameOf.w * scale, height - (1 - anchorY) * frameOf.h * scale, drawnH) > 0;
  }

  /** The speaker's warm ring on the ground, under everybody. */
  function glow(place) {
    if (!place) return;
    ctx.save();
    const g = ctx.createRadialGradient(place.x, place.y, 0, place.x, place.y, place.h * 0.45);
    g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(place.x, place.y, place.h * 0.45, place.h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  /** A soft shadow on the ground under somebody. */
  function shadow(x, y, h, wide = 0.2) {
    ctx.save();
    ctx.fillStyle = 'rgba(40,30,15,.22)';
    ctx.beginPath(); ctx.ellipse(x, y, h * wide, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  /** One person of the scene in their clip: only the speaker moves; the rest stand and breathe (a paused clip). */
  function drawPerson(person, place, clip, { at = 0, speaking = false } = {}) {
    shadow(place.x, place.y, place.h);
    return drawClip(ctx, clip.id, place.x, place.y, place.h, { timeMs: at, seed: place.id, paused: !speaking, reducedMotion: reducedMotion(), flip: clip.flip, appearance: figureOf(person).appearance });
  }

  /** The speaker's name over their head, in a small warm tag with its point toward them. */
  function nameTag(text, x, y, width) {
    if (!text) return;
    ctx.save();
    ctx.font = '600 15px Georgia, serif';
    const w = ctx.measureText(text).width + 18, h = 24;
    const left = clamp(x - w / 2, 6, width - w - 6), top = y - h;
    ctx.fillStyle = 'rgba(252,244,224,.95)'; ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(left, top, w, h, 7) : ctx.rect(left, top, w, h);
    ctx.moveTo(clamp(x, left + 8, left + w - 8) - 6, top + h); ctx.lineTo(x, top + h + 8); ctx.lineTo(clamp(x, left + 8, left + w - 8) + 6, top + h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a2e14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, left + w / 2, top + h / 2 + 1);
    ctx.restore();
  }

  /** Black over the scene, as much as `dark` (0 to 1). */
  function darken(dark, width, height) {
    if (dark <= 0) return;
    ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, width, height);
  }
  /** Words said on the black between one place and the next (the travel), faded by `alpha`. */
  function onBlack(text, alpha, width, height) {
    if (!text) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `italic ${Math.round(clamp(width / 40, 18, 30))}px Georgia, serif`;
    ctx.fillText(text, width / 2, height * 0.42, width * 0.9);
    ctx.restore();
  }

  return { canvas, ctx, fit, paintYard, paintTreeline, grade, drawCover, glow, shadow, drawPerson, nameTag, darken, onBlack };
}

/** The sky's two colours by the light of the hour. */
export function skyTones(light) {
  return { morning: ['#b9d3dc', '#f3e2bd'], noon: ['#a8c8d8', '#e6e3cf'], evening: ['#e7a86e', '#f6d59a'], night: ['#27344f', '#5a5670'] }[light] || ['#b9d3dc', '#efe2c0'];
}
