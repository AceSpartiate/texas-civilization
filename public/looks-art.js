// A parent's head and shoulders, drawn from their looks, for the How We Look pop-up (owner, 2026-09-17: "The How We Look
// section should have images for each section too").
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - looks portraits, and request 2026-09-12
// (second) - layered people. Drawn in strokes and flat colour by Claude; Astra's layered people sheets replace every call to
// `drawLooks` with the figure itself, and the pop-up keeps its layout.

/** The colour each word stands for. Words, not judgements (sim/appearance.mjs). */
export const SKIN_COLOURS = Object.freeze({ fair: '#f1d3bc', light: '#e3b995', olive: '#c69a6c', tan: '#b3805a', brown: '#8a5a3b', 'dark brown': '#684029', 'deep brown': '#4a2d1e' });
export const HAIR_COLOURS = Object.freeze({ black: '#1f1a17', 'dark brown': '#3b2618', brown: '#6b4428', auburn: '#853a1d', red: '#b04a2a', fair: '#d6b574', grey: '#9d9a95' });
export const CLOTHING_COLOURS = Object.freeze({ rust: '#9a4a2a', indigo: '#35406d', ochre: '#b8892f', teal: '#2f6b6a', butternut: '#a88a55', grey: '#7a7670', cream: '#e3d8bb' });

const shade = (hex, by) => {
  const n = parseInt(hex.slice(1), 16);
  const channel = shift => Math.max(0, Math.min(255, ((n >> shift) & 255) + by));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
};

/**
 * Draw one parent into a canvas, filling it: `looks` is `{ skin, hair, clothing, head }` in the game's words and `sex` is
 * 'male' or 'female'. The canvas is square; the drawing scales with it.
 */
export function drawLooks(canvas, looks, sex) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  const skin = SKIN_COLOURS[looks.skin] || SKIN_COLOURS.olive;
  const hair = HAIR_COLOURS[looks.hair] || HAIR_COLOURS.brown;
  const cloth = CLOTHING_COLOURS[looks.clothing] || CLOTHING_COLOURS.grey;
  const line = '#3a2c1c';
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = '#efe3c4'; ctx.fillRect(0, 0, s, s);
  ctx.lineWidth = Math.max(1, s / 64); ctx.strokeStyle = line; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const cx = s / 2, headY = s * 0.44, r = s * 0.2;
  const path = (fill, draw) => { ctx.beginPath(); draw(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };

  // Hair behind the head: a woman's falls to the collar under the bonnet or is gathered at the back.
  if (sex === 'female' && looks.head === 'pinned hair') path(hair, () => ctx.ellipse(cx, headY - r * 0.05, r * 1.12, r * 1.15, 0, 0, Math.PI * 2));
  // Shoulders and the coat or dress.
  path(cloth, () => { ctx.moveTo(s * 0.08, s); ctx.quadraticCurveTo(s * 0.12, s * 0.7, cx, s * 0.68); ctx.quadraticCurveTo(s * 0.88, s * 0.7, s * 0.92, s); ctx.closePath(); });
  if (sex === 'male') { // a shirt collar and lapels
    path('#efe8d6', () => { ctx.moveTo(cx - r * 0.45, s * 0.69); ctx.lineTo(cx, s * 0.84); ctx.lineTo(cx + r * 0.45, s * 0.69); ctx.closePath(); });
    ctx.strokeStyle = shade(cloth, -40); ctx.beginPath(); ctx.moveTo(cx - r * 0.5, s * 0.7); ctx.lineTo(cx - r * 0.1, s * 0.95); ctx.moveTo(cx + r * 0.5, s * 0.7); ctx.lineTo(cx + r * 0.1, s * 0.95); ctx.stroke(); ctx.strokeStyle = line;
  } else { // a kerchief at the neck
    path('#f2ecdc', () => { ctx.moveTo(cx - r * 0.8, s * 0.7); ctx.quadraticCurveTo(cx, s * 0.9, cx + r * 0.8, s * 0.7); ctx.quadraticCurveTo(cx, s * 0.76, cx - r * 0.8, s * 0.7); });
  }
  // Neck and head.
  path(skin, () => ctx.rect(cx - r * 0.32, headY + r * 0.7, r * 0.64, r * 0.55));
  path(skin, () => ctx.ellipse(cx, headY, r * 0.86, r, 0, 0, Math.PI * 2));
  // Ears.
  path(skin, () => ctx.ellipse(cx - r * 0.86, headY + r * 0.05, r * 0.14, r * 0.22, 0, 0, Math.PI * 2));
  path(skin, () => ctx.ellipse(cx + r * 0.86, headY + r * 0.05, r * 0.14, r * 0.22, 0, 0, Math.PI * 2));

  // Hair on top of the head (not under a bonnet, which covers it).
  if (!(sex === 'female' && looks.head === 'bonnet')) {
    path(hair, () => {
      ctx.moveTo(cx - r * 0.88, headY - r * 0.05);
      ctx.quadraticCurveTo(cx - r * 0.9, headY - r * 1.15, cx, headY - r * 1.05);
      ctx.quadraticCurveTo(cx + r * 0.9, headY - r * 1.15, cx + r * 0.88, headY - r * 0.05);
      ctx.quadraticCurveTo(cx + r * 0.6, headY - r * 0.55, cx, headY - r * 0.6);
      ctx.quadraticCurveTo(cx - r * 0.6, headY - r * 0.55, cx - r * 0.88, headY - r * 0.05);
    });
    if (sex === 'female') { // parted down the middle
      ctx.beginPath(); ctx.moveTo(cx, headY - r * 1.02); ctx.lineTo(cx, headY - r * 0.62); ctx.stroke();
    }
  }
  // The beard, before the face so the eyes sit above it.
  if (looks.head === 'beard') {
    path(hair, () => {
      ctx.moveTo(cx - r * 0.84, headY + r * 0.05);
      ctx.quadraticCurveTo(cx - r * 0.8, headY + r * 1.25, cx, headY + r * 1.28);
      ctx.quadraticCurveTo(cx + r * 0.8, headY + r * 1.25, cx + r * 0.84, headY + r * 0.05);
      ctx.quadraticCurveTo(cx + r * 0.5, headY + r * 0.5, cx, headY + r * 0.42);
      ctx.quadraticCurveTo(cx - r * 0.5, headY + r * 0.5, cx - r * 0.84, headY + r * 0.05);
    });
    path(skin, () => ctx.ellipse(cx, headY + r * 0.6, r * 0.26, r * 0.1, 0, 0, Math.PI * 2));
  }
  // The face: eyes, brows, nose, mouth.
  ctx.fillStyle = line;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * r * 0.33, headY + r * 0.02, Math.max(1, r * 0.08), 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = shade(hair, -10);
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + side * r * 0.18, headY - r * 0.2); ctx.lineTo(cx + side * r * 0.5, headY - r * 0.22); ctx.stroke(); }
  ctx.strokeStyle = shade(skin, -60);
  ctx.beginPath(); ctx.moveTo(cx, headY + r * 0.05); ctx.lineTo(cx - r * 0.08, headY + r * 0.32); ctx.lineTo(cx + r * 0.04, headY + r * 0.34); ctx.stroke();
  if (looks.head !== 'beard') { ctx.beginPath(); ctx.moveTo(cx - r * 0.22, headY + r * 0.56); ctx.quadraticCurveTo(cx, headY + r * 0.64, cx + r * 0.22, headY + r * 0.56); ctx.stroke(); }
  ctx.strokeStyle = line;

  // What is on the head.
  if (looks.head === 'hat') {
    const felt = '#4a3a28';
    path(felt, () => ctx.ellipse(cx, headY - r * 0.62, r * 1.45, r * 0.26, 0, 0, Math.PI * 2));
    path(felt, () => { ctx.moveTo(cx - r * 0.72, headY - r * 0.66); ctx.lineTo(cx - r * 0.62, headY - r * 1.5); ctx.quadraticCurveTo(cx, headY - r * 1.62, cx + r * 0.62, headY - r * 1.5); ctx.lineTo(cx + r * 0.72, headY - r * 0.66); ctx.closePath(); });
    ctx.strokeStyle = '#8b6f45'; ctx.lineWidth *= 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.7, headY - r * 0.82); ctx.lineTo(cx + r * 0.7, headY - r * 0.82); ctx.stroke(); ctx.lineWidth /= 2; ctx.strokeStyle = line;
  } else if (looks.head === 'bonnet') {
    const linen = '#efe7d3';
    path(linen, () => {
      ctx.moveTo(cx - r * 1.1, headY + r * 0.55);
      ctx.quadraticCurveTo(cx - r * 1.35, headY - r * 1.35, cx, headY - r * 1.35);
      ctx.quadraticCurveTo(cx + r * 1.35, headY - r * 1.35, cx + r * 1.1, headY + r * 0.55);
      ctx.quadraticCurveTo(cx + r * 0.8, headY - r * 0.7, cx, headY - r * 0.72);
      ctx.quadraticCurveTo(cx - r * 0.8, headY - r * 0.7, cx - r * 1.1, headY + r * 0.55);
    });
    ctx.strokeStyle = '#b7a784';
    ctx.beginPath(); ctx.moveTo(cx - r * 0.95, headY - r * 0.5); ctx.quadraticCurveTo(cx, headY - r * 1.05, cx + r * 0.95, headY - r * 0.5); ctx.stroke();
    ctx.strokeStyle = line;
    ctx.beginPath(); ctx.moveTo(cx - r * 0.7, headY + r * 0.9); ctx.lineTo(cx - r * 0.2, headY + r * 1.4); ctx.moveTo(cx + r * 0.7, headY + r * 0.9); ctx.lineTo(cx + r * 0.2, headY + r * 1.4); ctx.stroke();
  } else if (looks.head === 'pinned hair') {
    path(hair, () => ctx.ellipse(cx, headY - r * 1.05, r * 0.42, r * 0.3, 0, 0, Math.PI * 2));
  }
}
