// One appearance-driven figure for the chooser, the family card, and the live world.
// Kept procedural so every combination has the same walking/working frames without
// exporting thousands of near-identical sprite sheets.
import { SKIN_COLOURS, HAIR_COLOURS, CLOTHING_COLOURS } from '/looks-art.js';

const ink = '#382d23';
const color = (table, key, fallback) => table[key] || table[fallback];
function shift(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [16, 8, 0].map(bit => Math.max(0, Math.min(255, ((n >> bit) & 255) + amount)).toString(16).padStart(2, '0')).join('');
}
function shape(ctx, fill, line, path) {
  ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1.25; ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, fill, line = ink) {
  shape(ctx, fill, line, () => ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2));
}
function limb(ctx, a, b, c, d, width, fill) {
  ctx.strokeStyle = ink; ctx.lineWidth = width + 2;
  ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
}
function head(ctx, appearance, sex) {
  const skin = color(SKIN_COLOURS, appearance.skin, 'olive');
  const hair = color(HAIR_COLOURS, appearance.hair, 'brown');
  const style = appearance.head;
  const bonnet = style === 'bonnet', scarf = style === 'headscarf';
  if (sex === 'female' && ['loose hair', 'braid', 'pinned hair'].includes(style)) {
    ellipse(ctx, 0, -69, 12, style === 'loose hair' ? 19 : 13, hair);
    if (style === 'braid') limb(ctx, 9, -72, 14, -47, 5, hair);
  }
  ellipse(ctx, -10, -65, 2.2, 4, skin);
  ellipse(ctx, 10, -65, 2.2, 4, skin);
  ellipse(ctx, 0, -67, 10, 13, skin);
  if (!bonnet && !scarf) {
    shape(ctx, hair, ink, () => {
      ctx.moveTo(-10, -68); ctx.quadraticCurveTo(-11, -82, 0, -81);
      ctx.quadraticCurveTo(10, -82, 10, -68);
      ctx.quadraticCurveTo(5, -73, 0, -73);
      ctx.quadraticCurveTo(-5, -73, -10, -68);
    });
    if (sex === 'female') { ctx.strokeStyle = shift(hair, 32); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(0, -73); ctx.stroke(); }
  }
  if (style === 'beard' || style === 'hat and beard') {
    shape(ctx, hair, ink, () => { ctx.moveTo(-9, -64); ctx.quadraticCurveTo(-9, -50, 0, -50); ctx.quadraticCurveTo(9, -50, 9, -64); ctx.quadraticCurveTo(6, -58, 0, -58); ctx.quadraticCurveTo(-6, -58, -9, -64); });
  }
  if (style === 'moustache') {
    shape(ctx, hair, ink, () => { ctx.moveTo(-6, -59); ctx.quadraticCurveTo(-2, -63, 0, -60); ctx.quadraticCurveTo(2, -63, 6, -59); ctx.quadraticCurveTo(2, -58, 0, -60); ctx.quadraticCurveTo(-2, -58, -6, -59); });
  }
  ctx.fillStyle = ink; for (const side of [-1, 1]) ellipse(ctx, side * 4, -66, .7, 1, ink, ink);
  ctx.strokeStyle = shift(skin, -58); ctx.lineWidth = .7; ctx.beginPath();
  ctx.moveTo(0, -65); ctx.lineTo(-.7, -61); ctx.lineTo(1, -61);
  if (!['beard', 'hat and beard', 'moustache'].includes(style)) { ctx.moveTo(-2.2, -57); ctx.quadraticCurveTo(0, -56, 2.2, -57); }
  ctx.stroke();
  if (style === 'pinned hair') ellipse(ctx, 7, -76, 5, 4, hair);
  if (bonnet || scarf) {
    const fabric = bonnet ? '#e9dfc4' : shift(color(CLOTHING_COLOURS, appearance.clothing, 'teal'), 44);
    shape(ctx, fabric, ink, () => { ctx.moveTo(-12, -60); ctx.quadraticCurveTo(-16, -82, 0, -84); ctx.quadraticCurveTo(16, -82, 12, -60); ctx.quadraticCurveTo(9, -76, 0, -76); ctx.quadraticCurveTo(-9, -76, -12, -60); });
    if (bonnet) { limb(ctx, -11, -60, -5, -50, 1.1, fabric); limb(ctx, 11, -60, 5, -50, 1.1, fabric); }
  }
  if (style === 'hat' || style === 'hat and beard' || style === 'straw hat') {
    const felt = style === 'straw hat' ? '#c5a25e' : '#564936';
    ellipse(ctx, 0, -79, style === 'straw hat' ? 16 : 15, 2.4, felt);
    shape(ctx, felt, ink, () => { ctx.moveTo(-9, -79); ctx.lineTo(-8, -88); ctx.quadraticCurveTo(0, -90, 8, -88); ctx.lineTo(9, -79); ctx.closePath(); });
    ctx.strokeStyle = style === 'straw hat' ? '#897343' : '#a98651'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-9, -81); ctx.lineTo(9, -81); ctx.stroke();
  }
}

/** Feet at (x,y), height in pixels. The same layers are used in creation and play. */
export function drawAvatar(ctx, x, y, height, appearance, sex = 'male', { phase = 0, walking = false, flip = false, bust = false, working = false } = {}) {
  if (!appearance || height < 5) return false;
  const skin = color(SKIN_COLOURS, appearance.skin, 'olive');
  const cloth = color(CLOTHING_COLOURS, appearance.clothing, 'rust');
  const step = walking ? Math.sin(phase) : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale((flip ? -1 : 1) * height / 92, height / 92);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.4;
  if (!bust) {
    ellipse(ctx, 0, 1, 18, 3.8, '#342d2480', '#342d2400');
    const trouser = sex === 'female' ? shift(cloth, -32) : '#544737';
    for (const side of [-1, 1]) {
      const swing = step * side * 6;
      limb(ctx, side * 5, -28, side * 6 + swing, -7, 7, trouser);
      limb(ctx, side * 6 + swing, -7, side * 6 + swing * 1.4, -2, 7, '#46382a');
    }
    if (sex === 'female') shape(ctx, shift(cloth, -13), ink, () => { ctx.moveTo(-12, -44); ctx.lineTo(12, -44); ctx.lineTo(16, -25); ctx.quadraticCurveTo(0, -22, -16, -25); ctx.closePath(); });
  }
  // Coat or bodice, shaded side and stitched central seam.
  shape(ctx, shift(cloth, -23), ink, () => { ctx.moveTo(-11, -57); ctx.lineTo(11, -57); ctx.lineTo(14, -33); ctx.quadraticCurveTo(0, -30, -14, -33); ctx.closePath(); });
  shape(ctx, cloth, ink, () => { ctx.moveTo(-11, -57); ctx.lineTo(5, -58); ctx.lineTo(7, -34); ctx.lineTo(-13, -35); ctx.closePath(); });
  if (sex === 'male') {
    shape(ctx, '#e9e0c9', ink, () => { ctx.moveTo(-4, -58); ctx.lineTo(0, -49); ctx.lineTo(4, -58); ctx.closePath(); });
    ctx.strokeStyle = shift(cloth, -48); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -34); ctx.stroke();
  } else {
    shape(ctx, '#e7d5aa', ink, () => { ctx.moveTo(-8, -57); ctx.quadraticCurveTo(0, -51, 8, -57); ctx.lineTo(0, -53); ctx.closePath(); });
    shape(ctx, '#eadcc0', ink, () => { ctx.moveTo(-7, -45); ctx.lineTo(7, -45); ctx.lineTo(8, -30); ctx.quadraticCurveTo(0, -27, -8, -30); ctx.closePath(); });
  }
  for (const side of [-1, 1]) {
    const lift = working && side === 1 ? -9 - 4 * Math.sin(phase * 1.2) : step * side * 4;
    limb(ctx, side * 11, -54, side * 16 + step * side * 2, -41 + lift, 6, shift(cloth, -15));
    limb(ctx, side * 16 + step * side * 2, -41 + lift, side * 14 + step * side * 3, -34 + lift, 5, shift(cloth, -15));
    ellipse(ctx, side * 14 + step * side * 3, -32 + lift, 2.7, 3.2, skin);
  }
  shape(ctx, skin, ink, () => ctx.rect(-3, -59, 6, 8));
  head(ctx, appearance, sex);
  ctx.restore();
  return true;
}

export function drawAvatarPortrait(canvas, appearance, sex) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#efe7d0'); gradient.addColorStop(1, '#c9b78c');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#b4a27d'; ctx.lineWidth = Math.max(1, size / 70);
  ctx.strokeRect(2, 2, size - 4, size - 4);
  ctx.save(); ctx.beginPath(); ctx.rect(4, 4, size - 8, size - 8); ctx.clip();
  drawAvatar(ctx, size / 2, size * 2.17, size * 2.17, appearance, sex);
  ctx.restore();
}

export function drawAvatarFigure(canvas, appearance, sex) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ddd0aa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#b8ad86'; ctx.fillRect(0, canvas.height * .82, canvas.width, canvas.height * .18);
  drawAvatar(ctx, canvas.width / 2, canvas.height * .94, canvas.height * .79, appearance, sex);
}
