// Words drawn over the person saying them (docs/BATTLES.md §2.5).
//
// One helper for every scene that talks - a battle's orders and shouts, a town's worried talk before one - so a line
// looks the same wherever it is said. A line is data from the server, never invented here:
//
//   { id, text, gloss?, kind: 'documented' | 'reconstructed' | 'tradition', claimId?, name?, manner?, speaker: { role, side? } }
//
// `gloss` is the English under a Spanish order. `kind` is shown only as the bubble's edge: a documented line is drawn
// with a solid edge, anything reconstructed or traditional with a dashed one, so a class can be taught to tell the
// difference and nothing reconstructed is dressed up as a quotation. `name` heads the bubble of a named historical person,
// who speaks only documented or tradition words (docs/BATTLES.md §2c.4); `manner` is a stage direction drawn in italics ahead
// of the words. Those rules are the server's to keep (sim/battle-stage.mjs), and this draws whatever it is given.

const PAD = 6, GAP = 10, MAX_WIDTH = 220, LINE = 15, GLOSS_LINE = 13;

function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws `line` in a bubble whose tail points down at (x, y), the top of the speaker's head. `alpha` fades a line in
 * and out; `bounds` ({ width, height }) keeps the bubble on the canvas, sliding it sideways rather than cutting it.
 * Returns the bubble's box, so a caller can keep two bubbles from covering each other.
 */
export function drawSpeech(ctx, line, x, y, { alpha = 1, bounds = null, scale = 1, measure = false, layout = null } = {}) {
  if (!line?.text || alpha <= 0) return null;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  const size = Math.max(11, Math.round(13 * scale));
  // A named speaker's bubble says who is speaking, first, in small capitals (`FIC-GONZ-457`); a stage direction (`manner`,
  // owner 2026-09-26: Emily West's lines to Santa Anna "*sarcastically*") goes in italics ahead of the words.
  const head = line.name ? `${line.name}:` : '';
  const manner = line.manner ? `(${line.manner})` : '';
  ctx.font = `${size}px Georgia`;
  const width = Math.min(MAX_WIDTH * scale, Math.max(60, ctx.measureText(`${manner} ${line.text}`).width + 2));
  const words = wrap(ctx, manner ? `⁣${manner} ${line.text}` : line.text, width);
  ctx.font = `italic ${Math.max(10, size - 2)}px Georgia`;
  const gloss = line.gloss ? wrap(ctx, line.gloss, width) : [];
  ctx.font = `bold ${Math.max(10, size - 2)}px Georgia`;
  const headWidth = head ? ctx.measureText(head).width : 0;
  ctx.font = `${size}px Georgia`;
  const inner = Math.max(headWidth, ...words.map(text => ctx.measureText(text).width), ...(gloss.length ? [Math.min(width, Math.max(...gloss.map(text => ctx.measureText(text).width)))] : [0]));
  const headH = head ? GLOSS_LINE * scale : 0;
  const w = inner + PAD * 2, h = headH + words.length * LINE * scale + gloss.length * GLOSS_LINE * scale + PAD * 2;
  let left = x - w / 2;
  let top = Math.max(2, y - GAP * scale - h);
  // `bounds.room(top, bottom)`, when given, is the part of the canvas no panel stands over at the bubble's height: the bubble
  // slides along into it, its tail still to the speaker, rather than being drawn under the family's column or a chooser
  // (the overlap proof, owner 2026-09-28). Where the room is narrower than the bubble, the whole width is used as before.
  if (bounds) {
    const room = bounds.room?.(top, top + h, x, w);
    const fits = room && room.right - room.left >= w;
    left = Math.max(fits ? room.left : 2, Math.min((fits ? room.right : bounds.width - 2) - w, left));
  }
  // Only where it would go, for a caller that places bubbles itself.
  if (measure) { ctx.restore(); return { x: left, y: top, w, h }; }
  // Laid out with the frame's other bubbles (`speechLayout`): lifted or slid clear of them, or not drawn this frame.
  if (layout) {
    const spot = layout.place({ id: line.id ?? null, x, y, w, h, left, top });
    if (!spot) { ctx.restore(); return null; }
    ({ left, top } = spot);
  }
  ctx.fillStyle = line.speaker?.side === 'mexican' ? '#f6efe2' : '#fbf6ea';
  ctx.strokeStyle = '#4c422e';
  ctx.lineWidth = 1.2;
  if (line.kind !== 'documented') ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(left, top, w, h, 6) : ctx.rect(left, top, w, h);
  // The tail, from under the bubble to the speaker, kept inside the bubble's own width.
  const tail = Math.max(left + 8, Math.min(left + w - 8, x));
  ctx.moveTo(tail - 5, top + h);
  ctx.lineTo(x, Math.max(top + h + 2, y - 2));
  ctx.lineTo(tail + 5, top + h);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#2f2a1f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (head) { ctx.font = `bold ${Math.max(10, size - 2)}px Georgia`; ctx.fillStyle = '#4c3a1e'; ctx.fillText(head, left + PAD, top + PAD); ctx.fillStyle = '#2f2a1f'; ctx.font = `${size}px Georgia`; }
  words.forEach((text, index) => {
    const at = top + PAD + headH + index * LINE * scale;
    // The stage direction, in italics, where it begins the first line (it is marked with an invisible separator).
    if (index === 0 && text.startsWith('⁣')) {
      const close = text.indexOf(')') + 1 || text.length, direction = text.slice(1, close), rest = text.slice(close);
      ctx.font = `italic ${size}px Georgia`; ctx.fillStyle = '#5d5341'; ctx.fillText(direction, left + PAD, at);
      const dx = ctx.measureText(direction).width;
      ctx.font = `${size}px Georgia`; ctx.fillStyle = '#2f2a1f'; ctx.fillText(rest, left + PAD + dx, at);
      return;
    }
    ctx.fillText(text, left + PAD, at);
  });
  ctx.font = `italic ${Math.max(10, size - 2)}px Georgia`;
  ctx.fillStyle = '#5d5341';
  gloss.forEach((text, index) => ctx.fillText(text, left + PAD, top + PAD + headH + words.length * LINE * scale + index * GLOSS_LINE * scale));
  ctx.restore();
  // What was drawn, for the proofs: the speaker's name heading the bubble, and the stage direction ahead of the words.
  // The tail with it (from under the bubble to the head), so a proof can hold other bubbles off it (`npm run test:chatter`).
  return { x: left, y: top, w, h, tail: tailOf(left, top, w, h, x, y).map(Math.round), ...(head && { named: true }), ...(manner && { manner: line.manner }) };
}

// ---------------------------------------------------------------------------------------------------------------------------
// One frame's bubbles, laid out together
// ---------------------------------------------------------------------------------------------------------------------------
/**
 * Owner, 2026-09-29: *"When playing, text boxes for npc and player characters overlap frequently."* The family's own talk, the
 * town's scenes and the neighbours' chatter were each drawn by their own code, over their own speaker, with nothing between them:
 * a child and the parent it stopped stood a step apart and their two bubbles were drawn one on the other (at a farm at 1366x768
 * every frame of fifteen seconds had two bubbles on each other), a town's two scenes talked over each other, the neighbours kept
 * off the family's bubbles but not the town's, and a bubble was drawn over the names on the map (Gonzales: "over a name" in
 * half the frames). `npm run test:chatter`, its crowd.
 *
 * Now every bubble of a frame is placed by one layout, in the order the page asks - the family's own first, then the town's
 * scenes, then the neighbours - and each goes where it would stand over its speaker if that is clear of every bubble already
 * placed, those bubbles' tails, the names on the map and the marks asking the student something. If not, it is lifted
 * (stacked above what is in the way) or slid along, as little as will clear it, and keeps a tail to its speaker; a bubble keeps
 * the place it was given on the frame before while that place is still clear, so nothing being read jumps about. A bubble with
 * nowhere near its speaker to go is not drawn this frame; the neighbours' talk waits for room (public/ambient.js).
 * ceiling: bubbles are placed first come, first served, never moved to make room for a later one; a real solver (every bubble
 * at once) would fit more in a crowd, and is the way out if a crowded screen ever has to hold more than the few it does.
 */
const MARGIN = 4, MAX_RAISE = 110, MAX_TAIL = 150, KEEP_MS = 1500;
/** Where each line stood last, relative to where it would stand over its speaker (`dx`, `dy`), and when. */
const lastSpot = new Map();
/** Two boxes sharing more than their edges, with `margin` round the first. */
export const boxesMeet = (a, b, margin = 0) => a.x - margin < b.x + b.w && b.x < a.x + a.w + margin && a.y - margin < b.y + b.h && b.y < a.y + a.h + margin;
/** A tail, `[x0, y0, x1, y1]` from under its bubble to the head, through the inside of a box (Liang-Barsky). */
export function tailThrough([x0, y0, x1, y1], box) {
  const l = box.x + 1, r = box.x + box.w - 1, t = box.y + 1, b = box.y + box.h - 1, dx = x1 - x0, dy = y1 - y0;
  let lo = 0, hi = 1;
  for (const [p, q] of [[-dx, x0 - l], [dx, r - x0], [-dy, y0 - t], [dy, b - y0]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const k = q / p;
    if (p < 0) { if (k > hi) return false; lo = Math.max(lo, k); } else { if (k < lo) return false; hi = Math.min(hi, k); }
  }
  return lo < hi;
}
/** The tail of a bubble at `left`, `top`, `w` x `h` whose speaker's head is at (x, y): as `drawSpeech` draws it. */
export function tailOf(left, top, w, h, x, y) {
  return [Math.max(left + 8, Math.min(left + w - 8, x)), top + h, x, Math.max(top + h + 2, y - 2)];
}
/**
 * A layout for one frame: `avoid` is what no bubble may cover (the names on the map, a mark over a head), `room` the canvas's
 * free stretch at a height (app.js `speechRoom`). Pass it to `drawSpeech` as `layout`; `placed` is every bubble given a place.
 */
export function speechLayout({ width, height, room = null, avoid = [], now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) } = {}) {
  const fixed = avoid.filter(box => box && box.w > 0 && box.h > 0);
  const placed = [];
  for (const [id, spot] of lastSpot) if (now - spot.at > KEEP_MS) lastSpot.delete(id);
  const clear = (box, tail) => {
    if (box.x < 2 || box.y < 2 || box.x + box.w > width - 2 || box.y + box.h > height - 2) return false;
    for (const other of fixed) if (boxesMeet(box, other, MARGIN)) return false;
    for (const other of placed) {
      if (boxesMeet(box, other, MARGIN) || tailThrough(other.tail, box) || tailThrough(tail, other)) return false;
    }
    return true;
  };
  // Inside the stretch no panel stands over at that height, where there is one wide enough.
  const inRoom = (left, top, w, h, x) => {
    const span = room?.(top, top + h, x, w);
    return !room || (span && left >= span.left - 0.5 && left + w <= span.right + 0.5);
  };
  return {
    placed,
    avoid(box) { if (box && box.w > 0 && box.h > 0) fixed.push(box); },
    /** A place for a bubble `w` x `h` that would stand at `left`, `top` over the head at (x, y), or null if there is none near. */
    place({ id = null, x, y, w, h, left, top }) {
      // Clear of everything, and no further from the speaker than a tail still reads as theirs (`MAX_TAIL`): a bubble slid
      // across the screen to the only room clear of the panels was words over nobody (a tail of 718 px at 1024x600).
      const fits = (l, t) => {
        const box = { x: l, y: t, w, h }, tail = tailOf(l, t, w, h, x, y);
        if (Math.hypot(tail[2] - tail[0], tail[3] - tail[1]) > MAX_TAIL) return null;
        return clear(box, tail) ? { box, tail } : null;
      };
      const keep = (l, t, found) => {
        placed.push({ ...found.box, tail: found.tail, id });
        if (id != null) lastSpot.set(id, { dx: l - x, dy: t - top, at: now });
        return { left: l, top: t, tail: found.tail };
      };
      // Where it stood on the last frame, if that is still clear: a bubble being read stays put (with its speaker).
      const before = id != null && lastSpot.get(id);
      if (before) {
        const l = x + before.dx, t = top + before.dy, found = inRoom(l, t, w, h, x) && fits(l, t);
        if (found) return keep(l, t, found);
      }
      // Where it would stand, then lifted above whatever is in the way, then slid along beside it or to the edge of the room
      // clear of the panels; nearest the speaker first.
      const blockers = [...fixed, ...placed];
      const tops = new Set([top]);
      for (const other of blockers) {
        const t = other.y - h - MARGIN - 1;
        if (t < top && t >= top - MAX_RAISE && t >= 2) tops.add(t);
      }
      const tries = [];
      for (const t of tops) {
        const span = room?.(t, t + h, x, w);
        const [a, b] = span ? [span.left, span.right] : [2, width - 2];
        const lefts = new Set([left, x - w / 2, a, b - w]);
        for (const other of blockers) {
          if (other.y >= t + h + MARGIN || other.y + other.h <= t - MARGIN) continue;
          lefts.add(other.x + other.w + MARGIN + 1);
          lefts.add(other.x - w - MARGIN - 1);
        }
        for (const raw of lefts) {
          for (const l of new Set([raw, Math.max(a, Math.min(b - w, raw))])) tries.push({ l, t, cost: Math.abs(l + w / 2 - x) + 1.6 * (top - t) });
        }
      }
      tries.sort((p, q) => p.cost - q.cost);
      for (const { l, t } of tries) {
        const found = inRoom(l, t, w, h, x) && fits(l, t);
        if (found) return keep(l, t, found);
      }
      // No room clear of the panels within reach of the speaker. A speaker the student can see keeps their words beside them,
      // partly under the panel, rather than on another's or across the screen (the overlap proof holds a panel to half a
      // bubble); a speaker under a panel says nothing until they come out from it, and the neighbours' line waits.
      const seen = !room || (spot => spot && spot.left <= x && x <= spot.right)(room(y - 2, y, x, 0));
      if (!seen) return null;
      for (const { l, t } of tries) {
        const found = fits(l, t);
        if (found) return keep(l, t, found);
      }
      return null;
    },
  };
}

/** How opaque a line is `ageMs` after it was first shown, for a line meant to be read for `holdMs`. */
export function speechAlpha(ageMs, holdMs = 4500) {
  if (ageMs < 0) return 0;
  if (ageMs < 250) return ageMs / 250;
  if (ageMs < holdMs) return 1;
  return Math.max(0, 1 - (ageMs - holdMs) / 600);
}
