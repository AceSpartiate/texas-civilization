// Ambient life, drawn (sim/ambient.mjs, docs/AMBIENT.md; owner, 2026-09-28: "i don't want to see npc just standing around when
// they're idle ... they should talk to each other too via chat bubbles over their heads, very short, easy to read sentences.").
//
// The server decides everything here: who is at what (`amb` on each person it sends), who keeps company with whom, where a
// townsperson walks to visit a neighbour, what the men of a camp and the crowd at a refuge are doing, and the few words said on
// a tick. This file only draws it: a person walked to a neighbour's door and back at a person's pace (the town's own walker,
// public/town-scenes.js), a load carried a few steps back and forth, the fire, the pot, the bucket and the hens beside the
// people at them, the camp's men and the crowd in their poses, and the words over the right heads - a few at a time, each
// held long enough to read, never over a bubble already drawn or a mark asking the student something.
import { drawClip, drawSprite } from '/art.js';
import { drawSpeech, speechAlpha } from '/speech.js';
import { TOWN_WALK } from '/town-scenes.js';

/** At most this many ambient bubbles on the screen at once, and exchanges running at once (`npm run test:chatter`). */
export const ON_SCREEN = 3, EXCHANGES_AT_ONCE = 2;
/**
 * How long a line is held to be read, and when the reply begins: once the first has faded, so the two never stand over each
 * other's heads at once. A whole exchange is 8.8 seconds, inside a tick of the Study pace (9.5 s).
 */
export const LINE_MS = 3800, REPLY_AFTER_MS = LINE_MS + 600;
/** A load is carried this many drawn heights each way, a leg taking this long. */
export const PACE_HEIGHTS = 1.5, PACE_MS = 4200;
/** A drawn person's height on the ground, in miles: sim/house-footprint.mjs `PERSON_MILES`, which the page passes where it can. */
const PERSON_WIDTH_MILES = 0.019;
/** How near to where a person belongs counts as home again after a visit, in miles. */
const HOME_MILES = 0.002;

/**
 * Where somebody at an ambient activity is drawn this frame, walking or pacing or standing, or null for anybody the page
 * draws as it always has. `home` is where they belong on the ground (their place with the page's separation folded in, in
 * miles); a visitor (`amb.at`) is walked to the neighbour's door and, the visit over, walked home again before anything
 * else draws them. Returns `{ at, stepping, amb }`: `stepping` a heading while the feet are moving, `amb` the activity as
 * drawn this frame (turned to whoever they keep company with).
 */
export function ambientGround(entity, home, { walker, now, time, figure, scale, frozen, reducedMotion, whereIs, personMiles = PERSON_WIDTH_MILES }) {
  const amb = entity.amb;
  const one = walker.seen(entity.id);
  if (!amb && !one?.away) return null;
  const pace = TOWN_WALK * figure / Math.max(1, scale);
  // Carrying something back and forth: to a spot a few steps east of their place, then a few steps west, walked there by the
  // same walker at the same pace as everybody, so the carrier never slides or jumps - not at the turn, not when the carrying
  // begins or ends, not at a zoom. The steps are measured on the ground (`personMiles`, a person's width of it, as the page's
  // separation is). Standing still while the class is paused (the page's clock stands still); not paced under reduced motion.
  // ceiling: the steps are the page's, a drawing a step and a half either side of where the server has them, like the
  // separation `stableOffset` gives; a well or a woodpile the server places is the way out if the carrying is to go somewhere.
  let target = amb?.at || home;
  if (amb?.pace && !amb.at && !reducedMotion) {
    const span = PACE_HEIGHTS * personMiles;
    // A leg is the walk across and a breath at the end, whatever the zoom makes the walk.
    const leg = span / Math.max(1e-9, pace) * 1000 + 400;
    const east = Math.floor((time + seedOf(entity.id) * leg * 2) / leg) % 2 === 0;
    target = { x: home.x + (east ? .5 : -.5) * span, y: home.y };
  }
  const walked = walker.step(entity.id, target, now, frozen || reducedMotion ? 1e3 : pace);
  walked.away = Boolean(amb?.at) || Math.hypot(walked.at.x - home.x, walked.at.y - home.y) > HOME_MILES;
  const base = walked.at;
  if (!amb) return { at: base, base, stepping: walked.moving ? walked.dir : null, amb: null };
  if (walked.moving) return { at: base, base: amb.pace ? home : base, stepping: walked.dir, amb };
  // Keeping company: turned to the other, wherever the page drew them last.
  const other = amb.with && whereIs?.(amb.with);
  const turned = other ? { ...amb, f: other.x >= base.x ? 'e' : 'w' } : amb;
  return { at: base, base: amb.pace ? home : base, stepping: null, amb: turned };
}
const seedOf = id => { let n = 0; for (const c of String(id)) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0; return (n % 1000) / 1000; };

/**
 * The thing beside somebody at an activity, as a standing item the map sorts with its people: the fire and the pot at the
 * hands of whoever is kneeling at them, the bucket beside the washing, the woodpile at the end of the carrying, and two hens
 * at the feet of whoever feeds them. Null for an activity with nothing beside it.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-28 - ambient life, item 2: the washtub, the frontier woodpile and the two hens
 * pecking are Claude-drawn ("Claude-drawn stand-ins (replace with Astra's)", area A: `washtub`, `woodpile-frontier`,
 * `hens-pecking`), drawn at the height of the person beside them; Astra's of the same names replace them. Before their sheet
 * has loaded, the plain bucket, the Alamo's firewood and `chicken-idle` stand in as they did.
 */
const EAST = Object.freeze({ flip: false }), WEST = Object.freeze({ flip: true });
export function propItem(ctx, amb, point, figure, { time = 0, flip = false } = {}) {
  if (!amb?.prop) return null;
  const ahead = flip ? -1 : 1, size = figure;
  const at = (dx, dy = 0) => ({ x: point.x + dx * size * ahead, y: point.y + dy * size });
  switch (amb.prop) {
    case 'fire': { const p = at(.5, .02); return { y: p.y + .5, kind: 'fire', draw: () => drawClip(ctx, 'fire-flicker', p.x, p.y, size * .42, { timeMs: time, seed: 'amb-fire' }) || drawSprite(ctx, 'campfire', p.x, p.y, size * .36) } }
    case 'pot': { const p = at(.52, .02); return { y: p.y + .5, kind: 'pot', draw: () => { drawClip(ctx, 'fire-flicker', p.x, p.y, size * .34, { timeMs: time, seed: 'amb-pot' }) || drawSprite(ctx, 'campfire', p.x, p.y, size * .3); drawSprite(ctx, 'cooking-pot', p.x, p.y - size * .06, size * .26); } } }
    // The washtub where the kneeling washer's hands reach (its board leans toward her: mirrored with her).
    case 'bucket': { const p = at(.36, .01); return { y: p.y + .5, kind: 'bucket', draw: () => drawSprite(ctx, 'washtub', p.x, p.y, size, flip ? WEST : EAST) || drawSprite(ctx, 'bucket', at(.42, .01).x, p.y, size * .24) } }
    // At the west end of the few steps the wood is carried (`ambientGround`), whichever way the carrier is turned.
    case 'firewood': { const p = { x: point.x - size * 1.05, y: point.y - size * .02 }; return { y: p.y - .5, kind: 'firewood', draw: () => drawSprite(ctx, 'woodpile-frontier', p.x, p.y, size) || drawSprite(ctx, 'alamo-firewood', p.x, p.y, size * .3) } }
    case 'hens': {
      const a = at(.55, .04), b = at(.85, -.02);
      const pair = at(.7, .02);
      return { y: a.y + .5, kind: 'hens', draw: () => { if (drawClip(ctx, 'hens-pecking', pair.x, pair.y, size, { timeMs: time, seed: 'amb-hens', flip })) return; drawClip(ctx, 'chicken-idle', a.x, a.y, size * .26, { timeMs: time, seed: 'amb-hen-a', flip }); drawClip(ctx, 'chicken-idle', b.x, b.y, size * .24, { timeMs: time, seed: 'amb-hen-b', flip: !flip }); } };
    }
    default: return null;
  }
}

/**
 * The clip for one of a camp's men (public/army-view.js) or the crowd at a refuge doing `one.p`, facing `one.face`: the
 * military sheets' own poses for a rifleman or a regular, the cast's for everybody else. Returns `{ id, flip }`, and `base`
 * where `id` is a soldier at rest (`SOLDIERS_AT_REST`) whose sheet may not be drawable yet: the delivered pose to draw then.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-28 - ambient life, item 3: a rifle cleaned, a man sitting and a man cooking
 * are Claude-drawn (`<volunteer|regular>-clean-rifle`, `-camp-sit`, `-camp-cook`; "Claude-drawn stand-ins (replace with
 * Astra's)", area A), and until they load the ramrod's stroke and the standing idle.
 */
export const SOLDIERS_AT_REST = Object.freeze({ rifle: 'clean-rifle', sit: 'camp-sit', cook: 'camp-cook' });
export function figureClip(one, stepping = null) {
  const figure = one.f || one.figure, face = one.face === 'w' ? 'w' : 'e';
  if (figure === 'volunteer' || figure === 'regular') {
    const rest = SOLDIERS_AT_REST[one.a];
    if (rest) return { id: `${figure}-${rest}`, flip: face === 'w', base: one.p === 'idle' ? `${figure}-idle-${face}` : `${figure}-${one.p}`, baseFlip: one.p === 'idle' ? false : face === 'w' };
    if (one.p === 'idle') return { id: `${figure}-idle-${face}`, flip: false };
    if (one.p === 'march') return { id: `${figure}-march`, flip: (stepping || face) === 'w' };
    return { id: `${figure}-${one.p}`, flip: face === 'w' };
  }
  if (stepping && one.p === 'carry') return { id: `${figure}-carry`, flip: stepping === 'w' };
  if (one.p === 'idle' || one.p.startsWith('idle-')) return { id: `${figure}-${one.p === 'idle' ? `idle-${face}` : one.p}`, flip: false };
  return { id: `${figure}-${one.p}`, flip: face === 'w' };
}
/** Somebody pacing with a load: how far off their spot, in drawn heights, and which way they are going now. */
function paced(id, time, reducedMotion) {
  if (reducedMotion) return { dx: 0, stepping: null };
  const phase = ((time + seedOf(id) * PACE_MS * 2) % (PACE_MS * 2)) / PACE_MS;
  const out = phase < 1 ? phase : 2 - phase;
  return { dx: (out - .5) * PACE_HEIGHTS, stepping: phase < 1 ? 'e' : 'w' };
}
/**
 * For public/army-view.js: the clip and step of the man drawn at `index` of a camp, from the server's `ambient.camps`, or null
 * for a camp with nothing sent (a column on the march, or a class saved before), which then draws its men as it always did.
 */
export function campMan(camp, index, { time = 0, reducedMotion = false, key = '' } = {}) {
  const one = camp?.acts?.[index];
  if (!one) return null;
  const step = one.pace ? paced(`${key}:${index}`, time, reducedMotion) : { dx: 0, stepping: null };
  const clip = figureClip(one, step.stepping);
  return { ...clip, dx: step.dx, prop: one.prop || null, act: one.a };
}

/**
 * The crowd camped at a refuge (sim/ambient.mjs `crowdAt`), as standing items: their fire, and each of them at what they are
 * doing. Fills `heads` (id -> head point) so their words go over the right heads.
 */
export function crowdDrawables(ctx, crowds, { toScreen, figure, time = 0, reducedMotion = false, heads, evidence = null }) {
  const items = [];
  for (const crowd of crowds || []) {
    const fire = toScreen(crowd.fire);
    items.push({ y: fire.y, draw: () => drawClip(ctx, 'fire-flicker', fire.x, fire.y, figure * .5, { timeMs: time, seed: crowd.siteId }) || drawSprite(ctx, 'campfire', fire.x, fire.y, figure * .44) });
    for (const one of crowd.people) {
      const height = figure * (one.small || 1);
      const step = one.pace ? paced(one.id, time, reducedMotion) : { dx: 0, stepping: null };
      // The steps on the ground (a person's width of it a height, as `ambientGround`), so a zoom moves nobody.
      const p = toScreen({ x: one.x + step.dx * PERSON_WIDTH_MILES, y: one.y });
      const clip = figureClip(one, step.stepping);
      heads.set(one.id, { x: p.x, y: p.y - height, size: height });
      items.push({ y: p.y, draw: () => { if (!drawClip(ctx, clip.id, p.x, p.y, height, { timeMs: time, seed: one.id, flip: clip.flip }) && !(clip.base && drawClip(ctx, clip.base, p.x, p.y, height, { timeMs: time, seed: one.id, flip: clip.baseFlip }))) fallback(ctx, p.x, p.y, height); } });
      evidence?.push({ id: one.id, act: one.a, clip: clip.id });
    }
  }
  return items;
}
function fallback(ctx, x, y, size) {
  ctx.fillStyle = '#6d5a68'; ctx.strokeStyle = '#392e20'; ctx.lineWidth = Math.max(.8, size * .045);
  ctx.beginPath(); ctx.moveTo(x - size * .18, y); ctx.lineTo(x + size * .18, y); ctx.lineTo(x + size * .14, y - size * .66); ctx.lineTo(x - size * .14, y - size * .66); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8b08a'; ctx.beginPath(); ctx.arc(x, y - size * .78, size * .12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

// ---------------------------------------------------------------------------------------------------------------------------
// The words
// ---------------------------------------------------------------------------------------------------------------------------
/**
 * Every exchange heard lately, by its first line's id: when it was first drawn, so it is held for its reading time whatever the
 * tick does. A line the server stops sending is still finished; a line sent again is not begun again.
 * ceiling: kept for thirty seconds and then forgotten - a page open all afternoon holds the last half-minute of talk only.
 */
const heard = new Map();
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/**
 * The words between neighbours (sim/ambient.mjs `EXCHANGES`), over the heads that say them: the first line, then the reply a
 * little after, each held `LINE_MS` to be read and faded in and out, at most `ON_SCREEN` at once. A bubble that would cover
 * one already drawn this frame - a child's, a town scene's - or a mark asking the student something (`avoid`) is left unsaid,
 * and so is a line whose speaker is not drawn on this page: words are never put in the air over nobody.
 */
export function drawAmbientSpeech(ctx, lines, headOfAny, { now, bounds, avoid = [], evidence = null, max = ON_SCREEN } = {}) {
  // Only a speaker on the screen: a bubble is never pinned to the edge for somebody out of sight.
  const headOf = id => { const head = headOfAny(id); return head && (!bounds || (head.x >= 0 && head.x <= bounds.width && head.y >= 0 && head.y <= bounds.height)) ? head : null; };
  const running = () => [...heard.values()].filter(one => one.admitted && now - one.at < REPLY_AFTER_MS + LINE_MS + 600).length;
  for (const line of lines || []) {
    const key = `${line.pair}:${line.id.split(':').slice(-2, -1)[0]}`;
    // An exchange is let in when it first comes, if fewer than `EXCHANGES_AT_ONCE` are running and its first speaker is drawn
    // here; otherwise it is never said on this page, rather than said in part.
    if (!heard.has(key)) heard.set(key, { at: now, lines: [], admitted: running() < EXCHANGES_AT_ONCE && Boolean(headOf(line.speakerId)) });
    const exchange = heard.get(key);
    if (!exchange.lines.some(one => one.id === line.id)) exchange.lines.push(line);
  }
  const showing = [];
  for (const [key, exchange] of heard) {
    if (now - exchange.at > 30000) { heard.delete(key); continue; }
    if (!exchange.admitted) continue;
    for (const line of exchange.lines) {
      const age = now - exchange.at - line.order * REPLY_AFTER_MS;
      const alpha = speechAlpha(age, LINE_MS);
      if (alpha > 0) showing.push({ line, alpha, age });
    }
  }
  // The oldest first: a reply is never cut off by a newer exchange starting.
  showing.sort((a, b) => b.age - a.age);
  const boxes = [...avoid], shown = [];
  for (const { line, alpha } of showing) {
    if (shown.length >= max) break;
    const head = headOf(line.speakerId);
    if (!head) continue;
    const box = drawSpeech(ctx, line, head.x, head.y, { alpha, bounds, measure: true });
    if (!box || boxes.some(other => overlaps(box, other))) continue;
    drawSpeech(ctx, line, head.x, head.y, { alpha, bounds });
    boxes.push(box);
    shown.push({ id: line.id, speakerId: line.speakerId, kind: line.kind, text: line.text, box: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) } });
  }
  evidence?.push(...shown);
  return shown;
}
