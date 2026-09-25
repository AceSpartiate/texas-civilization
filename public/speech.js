// Words drawn over the person saying them (docs/BATTLES.md §2.5).
//
// One helper for every scene that talks - a battle's orders and shouts, a town's worried talk before one - so a line
// looks the same wherever it is said. A line is data from the server, never invented here:
//
//   { id, text, gloss?, kind: 'documented' | 'reconstructed' | 'tradition', claimId?, speaker: { role, side?, name? } }
//
// `gloss` is the English under a Spanish order. `kind` is shown only as the bubble's edge: a documented line is drawn
// with a solid edge, anything reconstructed or traditional with a dashed one, so a class can be taught to tell the
// difference and nothing reconstructed is dressed up as a quotation. A named historical person speaks only a
// documented line; that rule is the server's to keep, and this draws whatever it is given.

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
export function drawSpeech(ctx, line, x, y, { alpha = 1, bounds = null, scale = 1 } = {}) {
  if (!line?.text || alpha <= 0) return null;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  const size = Math.max(11, Math.round(13 * scale));
  ctx.font = `${size}px Georgia`;
  const width = Math.min(MAX_WIDTH * scale, Math.max(60, ctx.measureText(line.text).width + 2));
  const words = wrap(ctx, line.text, width);
  ctx.font = `italic ${Math.max(10, size - 2)}px Georgia`;
  const gloss = line.gloss ? wrap(ctx, line.gloss, width) : [];
  ctx.font = `${size}px Georgia`;
  const inner = Math.max(...words.map(text => ctx.measureText(text).width), ...(gloss.length ? [Math.min(width, Math.max(...gloss.map(text => ctx.measureText(text).width)))] : [0]));
  const w = inner + PAD * 2, h = words.length * LINE * scale + gloss.length * GLOSS_LINE * scale + PAD * 2;
  let left = x - w / 2;
  const top = Math.max(2, y - GAP * scale - h);
  if (bounds) left = Math.max(2, Math.min(bounds.width - w - 2, left));
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
  words.forEach((text, index) => ctx.fillText(text, left + PAD, top + PAD + index * LINE * scale));
  ctx.font = `italic ${Math.max(10, size - 2)}px Georgia`;
  ctx.fillStyle = '#5d5341';
  gloss.forEach((text, index) => ctx.fillText(text, left + PAD, top + PAD + words.length * LINE * scale + index * GLOSS_LINE * scale));
  ctx.restore();
  return { x: left, y: top, w, h };
}

/** How opaque a line is `ageMs` after it was first shown, for a line meant to be read for `holdMs`. */
export function speechAlpha(ageMs, holdMs = 4500) {
  if (ageMs < 0) return 0;
  if (ageMs < 250) return ageMs / 250;
  if (ageMs < holdMs) return 1;
  return Math.max(0, 1 - (ageMs - holdMs) / 600);
}
