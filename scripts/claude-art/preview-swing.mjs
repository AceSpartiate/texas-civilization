// See a swing moving (owner, 2026-09-28: "make sure the chop swings look natural"). Renders, beside Astra's own hoeing cycle
// (`rust-work`, her four frames at her timing), the rig's chop, hoe, split and dig at their clip timing, on the map's grass at
// a person 77 px and 150 px, and writes to docs/evidence/claude-art/:
//   swing-preview.apng       the swings moving, at play speed (an animated PNG: open it in a browser)
//   swing-strip.png          the same, sampled every 100 ms on one sheet, for reading the timing without playing it
//   swing-onion.png          each swing's six frames laid over one another at 150 px, with the tool head's path traced and the
//                            feet marked: the arc should be one smooth curve and the feet one pair of marks
//   chop-cast-preview.apng   the chop for all eight cast figures at 77 px, moving
// Run: node scripts/claude-art/preview-swing.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { personFrame, drawPerson, frameOf } from './kit/rig.mjs';
import { POSES, SWINGS } from './kit/poses.mjs';
import { swingFrames } from './kit/swing-check.mjs';
import { UNIT, PEOPLE } from './kit/style.mjs';
import { withBrowser } from './kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../public/assets/frontier-v1/', import.meta.url));
const SHARED = readFileSync(fileURLToPath(new URL('../../public/assets/claude-standins/svg/_shared-defs.svg', import.meta.url)), 'utf8');
const atlas = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8'));
const animation = JSON.parse(readFileSync(ASTRA + 'animation.json', 'utf8'));
const GRASS = '#7f9f58', CAST = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];

/** One animated subject: its frames (image source, box, anchor, logical height) and durations. */
function claudeSubject(figure, swing) {
  const frames = POSES[swing](frameOf(figure)).map((pose, i) => {
    const f = personFrame(`${figure}-${swing}-p${i}`, ink => drawPerson(ink, figure, pose));
    const svg = f.svg.replace('<defs>', `<defs>${SHARED.replace(/<\/?defs>/g, '')}`);
    return { src: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), sx: 0, sy: 0, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY, logicalHeight: f.logicalHeight };
  });
  return { label: `Claude ${figure} ${swing}`, frames, durations: SWINGS[swing].durations, beat: SWINGS[swing].beat };
}
function astraSubject(clip) {
  const c = animation.clips[clip], sheets = {};
  const frames = c.frames.map(({ sprite }) => {
    const f = atlas.frames[sprite], sheet = atlas.sheets[f.sheet];
    sheets[f.sheet] ??= 'data:image/png;base64,' + readFileSync(ASTRA + sheet.image).toString('base64');
    return { src: sheets[f.sheet], sx: f.x, sy: f.y, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY, logicalHeight: f.logicalHeight || f.h };
  });
  return { label: `Astra ${clip}`, frames, durations: c.frames.map(f => f.duration) };
}

/** A page that draws `subjects` in rows at the given sizes at time `t` (window.draw(t)). */
function page(subjects, sizes, width, height, title) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c" width="${width}" height="${height}"></canvas><script>
const subjects = ${JSON.stringify(subjects)}, sizes = ${JSON.stringify(sizes)};
const c = document.getElementById('c'), ctx = c.getContext('2d'), images = new Map();
const load = src => images.get(src) || (images.set(src, new Promise(done => { const im = new Image(); im.onload = () => done(im); im.src = src; })), images.get(src));
window.ready = Promise.all(subjects.flatMap(s => s.frames.map(f => load(f.src)))).then(async () => { for (const [k, v] of images) images.set(k, await v); });
const frameAt = (s, t) => { const total = s.durations.reduce((a, b) => a + b, 0); let at = t % total; for (let i = 0; i < s.durations.length; i++) { if (at < s.durations[i]) return i; at -= s.durations[i]; } return 0; };
window.draw = t => {
  ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#23180f'; ctx.font = 'bold 14px Georgia'; ctx.fillText(${JSON.stringify(title)} + '  t=' + (t / 1000).toFixed(2) + ' s', 10, 20);
  let y = 30;
  for (const size of sizes) {
    const ground = y + size * 1.55; let x = 20;
    for (const s of subjects) {
      const i = frameAt(s, t), f = s.frames[i], k = size / f.logicalHeight, w = f.w * k, h = f.h * k;
      const cx = x + size * 0.55;
      ctx.drawImage(images.get(f.src), f.sx, f.sy, f.w, f.h, cx - w * f.anchorX, ground - h * f.anchorY, w, h);
      if (size === sizes[sizes.length - 1]) { ctx.fillStyle = '#23180f'; ctx.font = '11px Georgia'; ctx.fillText(s.label + ' · ' + (i + 1) + (s.beat === i ? ' (strike)' : ''), x, ground + 16); }
      x += size * 1.5;
    }
    y = ground + 26;
  }
};
</script></body>`;
}

/** Assemble screenshots (PNG buffers of one size) into a looping animated PNG, `delay` ms a frame. */
function apng(pngs, delay) {
  const chunks = buf => { const out = []; let p = 8; while (p < buf.length) { const n = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8); out.push({ type, data: buf.subarray(p + 8, p + 8 + n) }); p += 12 + n; } return out; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([len, td, crc]); };
  const first = chunks(pngs[0]), ihdr = first.find(c => c.type === 'IHDR').data, w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  const parts = [pngs[0].subarray(0, 8), chunk('IHDR', ihdr)];
  const actl = Buffer.alloc(8); actl.writeUInt32BE(pngs.length, 0); actl.writeUInt32BE(0, 4); parts.push(chunk('acTL', actl));
  let seq = 0;
  pngs.forEach((png, i) => {
    const fctl = Buffer.alloc(26); fctl.writeUInt32BE(seq++, 0); fctl.writeUInt32BE(w, 4); fctl.writeUInt32BE(h, 8); fctl.writeUInt32BE(0, 12); fctl.writeUInt32BE(0, 16);
    fctl.writeUInt16BE(delay, 20); fctl.writeUInt16BE(1000, 22); fctl[24] = 0; fctl[25] = 0; parts.push(chunk('fcTL', fctl));
    for (const c of chunks(png).filter(c => c.type === 'IDAT')) {
      if (i === 0) parts.push(chunk('IDAT', c.data));
      else { const s = Buffer.alloc(4); s.writeUInt32BE(seq++); parts.push(chunk('fdAT', Buffer.concat([s, c.data]))); }
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

async function animate(browser, subjects, sizes, file, title, { cycle = 2400, step = 40 } = {}) {
  const width = 40 + subjects.length * Math.max(...sizes) * 1.5, height = 40 + sizes.reduce((s, z) => s + z * 1.55 + 26, 0);
  const p = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: Math.ceil(width), height: Math.ceil(height) } });
  await p.setContent(page(subjects, sizes, Math.ceil(width), Math.ceil(height), title));
  await p.evaluate(() => window.ready);
  const pngs = [];
  for (let t = 0; t < cycle; t += step) { await p.evaluate(t => window.draw(t), t); pngs.push(await p.locator('#c').screenshot({ type: 'png' })); }
  writeFileSync(OUT + file, apng(pngs, step));
  await p.close();
  return pngs.length;
}

async function strip(browser, subjects, file) {
  // Every 100 ms of one cycle, the frames side by side at 77 px: the timing read without playing it.
  const size = 77, steps = 12, rowH = size * 1.9, width = 180 + steps * size * 1.1, height = 30 + subjects.length * rowH;
  const p = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: Math.ceil(width), height: Math.ceil(height) } });
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c" width="${Math.ceil(width)}" height="${Math.ceil(height)}"></canvas><script>
const subjects = ${JSON.stringify(subjects)}; const c = document.getElementById('c'), ctx = c.getContext('2d'), images = new Map();
const frameAt = (s, t) => { const total = s.durations.reduce((a, b) => a + b, 0); let at = t % total; for (let i = 0; i < s.durations.length; i++) { if (at < s.durations[i]) return i; at -= s.durations[i]; } return 0; };
window.ready = (async () => { for (const s of subjects) for (const f of s.frames) if (!images.has(f.src)) images.set(f.src, await new Promise(d => { const im = new Image(); im.onload = () => d(im); im.src = f.src; })); })();
window.draw = () => { ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#23180f'; ctx.font = 'bold 13px Georgia'; ctx.fillText('Every 100 ms of one cycle, a person 77 px (Astra\\'s hoe runs 800 ms a cycle; the Claude swings 1200 ms)', 10, 18);
  subjects.forEach((s, r) => { const ground = 30 + r * ${rowH} + ${size} * 1.35; ctx.fillStyle = '#23180f'; ctx.font = '11px Georgia'; ctx.fillText(s.label, 6, ground - 20);
    for (let k = 0; k < ${steps}; k++) { const i = frameAt(s, k * 100), f = s.frames[i], sc = ${size} / f.logicalHeight, w = f.w * sc, h = f.h * sc, cx = 180 + k * ${size} * 1.1 + ${size} * 0.45;
      ctx.drawImage(images.get(f.src), f.sx, f.sy, f.w, f.h, cx - w * f.anchorX, ground - h * f.anchorY, w, h); ctx.font = '10px Georgia'; ctx.fillText((k * 100) + ' ms · ' + (i + 1), cx - 20, ground + 12); } }); };
</script></body>`;
  await p.setContent(html); await p.evaluate(() => window.ready); await p.evaluate(() => window.draw());
  await p.locator('#c').screenshot({ path: OUT + file }); await p.close();
}

async function onion(browser, figure, file) {
  // Each swing's six frames over one another at 150 px, the tool head's path traced in red and the feet marked in blue.
  const size = 150, k = size / PEOPLE.logicalHeight, unit = UNIT * k, swings = Object.keys(SWINGS), colW = size * 1.9;
  const layers = swings.map(swing => ({ swing, frames: claudeSubject(figure, swing).frames, heads: swingFrames(figure, swing).map(j => j.head), feet: POSES[swing](frameOf(figure))[0].feet }));
  const width = 30 + swings.length * colW, height = size * 1.9;
  const p = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: Math.ceil(width), height: Math.ceil(height) } });
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c" width="${Math.ceil(width)}" height="${Math.ceil(height)}"></canvas><script>
const layers = ${JSON.stringify(layers)}; const c = document.getElementById('c'), ctx = c.getContext('2d');
window.ready = (async () => { ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#23180f'; ctx.font = 'bold 13px Georgia'; ctx.fillText('${figure}: each swing\\'s six frames laid over one another; red, the path of the tool\\'s head; blue, the feet', 10, 18);
  for (const [n, l] of layers.entries()) { const ox = 20 + n * ${colW} + ${size} * 0.7, ground = ${size} * 1.65;
    for (const [i, f] of l.frames.entries()) { const im = await new Promise(d => { const x = new Image(); x.onload = () => d(x); x.src = f.src; }); const s = ${size} / f.logicalHeight;
      ctx.globalAlpha = i === 0 ? 0.9 : 0.35; ctx.drawImage(im, ox - f.w * s * f.anchorX, ground - f.h * s * f.anchorY, f.w * s, f.h * s); }
    ctx.globalAlpha = 1; ctx.strokeStyle = '#c0281c'; ctx.lineWidth = 2; ctx.beginPath();
    l.heads.concat([l.heads[0]]).forEach(([x, y], i) => { const px = ox + x * ${unit}, py = ground - y * ${unit}; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
    for (const [x, y] of l.heads) { ctx.fillStyle = '#c0281c'; ctx.beginPath(); ctx.arc(ox + x * ${unit}, ground - y * ${unit}, 3, 0, 7); ctx.fill(); }
    for (const w of ['near', 'far']) { const [x] = l.feet[w]; ctx.fillStyle = '#1f4fa0'; ctx.fillRect(ox + x * ${unit} - 4, ground - 2, 8, 4); }
    ctx.fillStyle = '#23180f'; ctx.font = '12px Georgia'; ctx.fillText(l.swing, ox - 20, ground + 18); } })();
</script></body>`;
  await p.setContent(html); await p.evaluate(() => window.ready);
  await p.locator('#c').screenshot({ path: OUT + file }); await p.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const main = [astraSubject('rust-work'), ...Object.keys(SWINGS).map(swing => claudeSubject('rust', swing))];
  await withBrowser(async (first, browser) => {
    console.log('swing-preview.apng', await animate(browser, main, [77, 150], 'swing-preview.apng', 'Astra\'s rust-work beside the Claude rig\'s swings, at play speed'), 'frames');
    await strip(browser, main, 'swing-strip.png');
    await onion(browser, 'rust', 'swing-onion.png');
    const cast = [astraSubject('rust-work'), ...CAST.map(figure => claudeSubject(figure, 'chop'))];
    console.log('chop-cast-preview.apng', await animate(browser, cast, [77], 'chop-cast-preview.apng', 'The chop for all eight cast figures, a person 77 px'), 'frames');
  });
}
