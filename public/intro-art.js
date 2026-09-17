// The title screen's scene (owner, 2026-09-17: "a professional game introduction experience").
//
// A Texas evening in 1835 looking east over the colonies: the sky, a line of hills, the timber, a river running down, a
// rail fence, a cabin with its chimney smoking, the wagon and the ox beside it, and a family standing in the grass. Drawn in
// canvas so it costs nothing to ship and scales to any screen.
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the title scene. Astra's painting of the
// same view replaces `drawIntroScene` with a single image, and the page keeps its layout.

const SKY = [[0, '#2c3d52'], [0.35, '#6b6a63'], [0.58, '#c98b52'], [0.78, '#e8b268'], [1, '#f3d79b']];

/** Draw the scene to fill this canvas. The canvas keeps its own pixel size; the scene is laid out in its own units. */
export function drawIntroScene(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  for (const [at, colour] of SKY) sky.addColorStop(at, colour);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

  // The sun, low and hazy, and its light on the cloud bars.
  const sunX = w * 0.68, sunY = h * 0.62;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.5);
  glow.addColorStop(0, 'rgba(255,236,190,0.95)'); glow.addColorStop(0.35, 'rgba(240,190,120,0.35)'); glow.addColorStop(1, 'rgba(240,190,120,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h * 0.8);
  ctx.fillStyle = 'rgba(255,240,205,0.9)';
  ctx.beginPath(); ctx.arc(sunX, sunY, h * 0.055, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(70,72,74,0.35)';
  for (const [y, x0, x1, tall] of [[0.24, 0.05, 0.52, 0.018], [0.32, 0.45, 0.95, 0.014], [0.44, 0.12, 0.78, 0.012]]) {
    ctx.beginPath(); ctx.ellipse(w * (x0 + x1) / 2, h * y, w * (x1 - x0) / 2, h * tall, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Three lines of country, each darker and nearer: the far hills, the timber, the near rise.
  const ridge = (baseline, height, colour, seed) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * baseline);
    for (let x = 0; x <= w; x += w / 48) {
      const n = Math.sin((x / w) * 6.3 * seed) + Math.sin((x / w) * 13.7 * seed + 1.2) * 0.5 + Math.sin((x / w) * 27.1 * seed + 2.4) * 0.22;
      ctx.lineTo(x, h * baseline - n * h * height);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  };
  ridge(0.70, 0.030, '#6d7a6a', 1.0);
  ridge(0.755, 0.022, '#55654f', 1.7);

  // The timber along the far bank: a band of crowns.
  ctx.fillStyle = '#3f5238';
  for (let x = -20; x < w + 20; x += 13) {
    const tall = 10 + ((Math.sin(x * 0.7) + 1) / 2) * 16;
    ctx.beginPath(); ctx.ellipse(x, h * 0.772, 11, tall * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  }
  ridge(0.815, 0.014, '#46583d', 2.6);

  // The river, catching the low sun.
  ctx.fillStyle = '#7e8f8d';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.80);
  ctx.bezierCurveTo(w * 0.47, h * 0.86, w * 0.33, h * 0.9, w * 0.38, h);
  ctx.lineTo(w * 0.52, h);
  ctx.bezierCurveTo(w * 0.50, h * 0.9, w * 0.56, h * 0.86, w * 0.47, h * 0.80);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,225,180,0.35)';
  for (let i = 0; i < 6; i++) { const y = h * (0.83 + i * 0.028); ctx.fillRect(w * (0.40 + i * 0.004), y, w * (0.07 - i * 0.004), 2); }

  // The grass of the near field.
  const grass = ctx.createLinearGradient(0, h * 0.80, 0, h);
  grass.addColorStop(0, '#5f6f42'); grass.addColorStop(1, '#4a5a34');
  ctx.fillStyle = grass; ctx.fillRect(0, h * 0.80, w, h * 0.2);

  // The cabin, left of centre, with its chimney and smoke.
  const cx = w * 0.235, cy = h * 0.845, cw = w * 0.115, ch = h * 0.115;
  ctx.fillStyle = '#6a4d32'; ctx.fillRect(cx - cw / 2, cy - ch * 0.55, cw, ch * 0.62);
  ctx.strokeStyle = '#4b361f'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - cw / 2, cy - ch * 0.55 + (ch * 0.62 / 5) * i); ctx.lineTo(cx + cw / 2, cy - ch * 0.55 + (ch * 0.62 / 5) * i); ctx.stroke(); }
  ctx.fillStyle = '#7d5a3a';
  ctx.beginPath(); ctx.moveTo(cx - cw * 0.62, cy - ch * 0.5); ctx.lineTo(cx, cy - ch * 0.95); ctx.lineTo(cx + cw * 0.62, cy - ch * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2d20'; ctx.fillRect(cx - cw * 0.08, cy - ch * 0.28, cw * 0.18, ch * 0.35);
  ctx.fillStyle = '#e9c37a'; ctx.fillRect(cx - cw * 0.34, cy - ch * 0.3, cw * 0.14, cw * 0.1);
  ctx.fillStyle = '#5b4a38'; ctx.fillRect(cx + cw * 0.38, cy - ch * 1.02, cw * 0.13, ch * 0.5);
  ctx.fillStyle = 'rgba(226,222,210,0.5)';
  for (let i = 0; i < 5; i++) { const t = i / 5; ctx.beginPath(); ctx.arc(cx + cw * 0.44 + Math.sin(i) * 6, cy - ch * (1.08 + t * 0.6), 4 + t * 7, 0, Math.PI * 2); ctx.fill(); }

  // A rail fence running off to the right, and the wagon with its ox beside the cabin.
  ctx.strokeStyle = '#6b573b'; ctx.lineWidth = 2;
  for (let x = w * 0.33; x < w * 0.95; x += w * 0.045) {
    const y = h * (0.895 + (x / w) * 0.03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 13); ctx.lineTo(x + w * 0.045 - 6, y - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x + w * 0.045 - 6, y - 4); ctx.stroke();
  }
  const wx = w * 0.40, wy = h * 0.875;
  ctx.fillStyle = '#e7dcc2';
  ctx.beginPath(); ctx.ellipse(wx, wy - 14, 26, 15, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#6b4f33'; ctx.fillRect(wx - 26, wy - 14, 52, 10);
  ctx.strokeStyle = '#4a3722'; ctx.lineWidth = 2;
  for (const dx of [-17, 17]) { ctx.beginPath(); ctx.arc(wx + dx, wy + 1, 7, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#5b4632';
  ctx.beginPath(); ctx.ellipse(wx - 48, wy - 8, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(wx - 62, wy - 14, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(wx - 58, wy - 2, 3, 9); ctx.fillRect(wx - 40, wy - 2, 3, 9);

  // The family, standing in the near grass, drawn as the evening leaves them: dark against the light.
  const person = (x, y, tall, skirt) => {
    ctx.fillStyle = '#2f2a23';
    ctx.beginPath(); ctx.arc(x, y - tall, tall * 0.19, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    if (skirt) { ctx.moveTo(x - tall * 0.1, y - tall * 0.82); ctx.lineTo(x + tall * 0.1, y - tall * 0.82); ctx.lineTo(x + tall * 0.27, y); ctx.lineTo(x - tall * 0.27, y); }
    else { ctx.moveTo(x - tall * 0.13, y - tall * 0.82); ctx.lineTo(x + tall * 0.13, y - tall * 0.82); ctx.lineTo(x + tall * 0.15, y); ctx.lineTo(x - tall * 0.15, y); }
    ctx.closePath(); ctx.fill();
  };
  person(w * 0.545, h * 0.965, h * 0.115, false);
  person(w * 0.58, h * 0.97, h * 0.108, true);
  person(w * 0.607, h * 0.975, h * 0.072, true);
  person(w * 0.628, h * 0.978, h * 0.06, false);

  // A last wash of evening over everything, so the cards on top read clearly.
  const dusk = ctx.createLinearGradient(0, h * 0.5, 0, h);
  dusk.addColorStop(0, 'rgba(24,26,22,0)'); dusk.addColorStop(1, 'rgba(24,26,22,0.35)');
  ctx.fillStyle = dusk; ctx.fillRect(0, h * 0.5, w, h * 0.5);
}
