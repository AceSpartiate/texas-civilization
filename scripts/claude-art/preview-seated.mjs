// Moving previews of Claude's art as the page puts it together (owner, 2026-09-29: "look at a moving preview for the running child
// and the wagon"): not a clip by itself, as scripts/claude-art/loops.mjs draws one, but laid out by the page's own functions in
// public/motion.js and public/work-art.js and drawn by public/art.js from the manifests the game loads. Writes to
// docs/evidence/claude-art/:
//   preview-rig.apng        the wagon and its ox as one drawing (`WAGON_RIG`, `seatLayout(..., rig)`) east, west, south and north,
//                           with a driver on the box, and again with four riders in the open tail (`bedLayout`), a person 56 px
//   preview-rig-strip.png   the same, one still; preview-rig-strip-40.png the same at a person 40 px (play size)
//   preview-yard.apng       a girl running at tag round the yard, turned by `DrawnHeading` and dressed by `entityClip`, and a boy
//                           carrying water to and fro (`fetchStep`, `fetchPose`), a person 77 px; preview-yard-strip.png every
//                           800 ms of it at half size
// The public/ folder is served on a local port for the run; nothing else is served or fetched.
// Run: node scripts/claude-art/preview-seated.mjs
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { withBrowser } from './kit/browser.mjs';

const PUBLIC = fileURLToPath(new URL('../../public/', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.html': 'text/html', '.svg': 'image/svg+xml' };
const GRASS = '#7f9f58';

/** An animated PNG from same-sized PNG frames, `delay` ms each (as scripts/claude-art/preview-poses.mjs writes them). */
function apng(pngs, delay) {
  const chunks = buf => { const out = []; let p = 8; while (p < buf.length) { const n = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8); out.push({ type, data: buf.subarray(p + 8, p + 8 + n) }); p += 12 + n; } return out; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([l, td, c]); };
  const ihdr = chunks(pngs[0]).find(c => c.type === 'IHDR').data, w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  const parts = [pngs[0].subarray(0, 8), chunk('IHDR', ihdr)];
  const actl = Buffer.alloc(8); actl.writeUInt32BE(pngs.length, 0); parts.push(chunk('acTL', actl));
  let seq = 0;
  pngs.forEach((png, i) => {
    const fctl = Buffer.alloc(26); fctl.writeUInt32BE(seq++, 0); fctl.writeUInt32BE(w, 4); fctl.writeUInt32BE(h, 8); fctl.writeUInt16BE(delay, 20); fctl.writeUInt16BE(1000, 22); parts.push(chunk('fcTL', fctl));
    for (const c of chunks(png).filter(c => c.type === 'IDAT')) {
      if (i === 0) parts.push(chunk('IDAT', c.data));
      else { const s = Buffer.alloc(4); s.writeUInt32BE(seq++); parts.push(chunk('fdAT', Buffer.concat([s, c.data]))); }
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// The page: draws one moment, `window.draw(t)`, with the game's own layout and art. The rig's riders are put in their order the way
// public/app.js `drawSeated` puts them (furthest up the screen first; before the rig coming toward the camera, after it otherwise).
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c"></canvas><script type="module">
import { loadArt, drawClip, clipReady } from '/art.js';
import { seatLayout, bedLayout, wagonRigClip, seatedClip, passengerClip, SEAT, entityClip, drawnClipName, DrawnHeading } from '/motion.js';
import { STROKES, fetchStep, fetchPose } from '/work-art.js';
const SIZE = { horse: 1.5, ox: 1.45, wagon: 1.55 };
const c = document.getElementById('c'), ctx = c.getContext('2d');
const person = (id, extra) => ({ id, kind: 'person', householdId: 'hh-1', health: { condition: 'well' }, ...extra });
const driver = person('hh-1-rosa', { sex: 'female', band: 'adult' });
const riders = [person('hh-1-c1', { sex: 'female', band: 'child' }), person('hh-1-c2', { sex: 'male', band: 'child' }), person('hh-1-c3', { sex: 'female', band: 'youth' }), person('hh-1-c4', { band: 'small' })];
function rig(x, y, size, direction, aboard, t) {
  const flip = direction === 'w', along = flip ? -1 : 1, clip = wagonRigClip({}, direction, aboard.length);
  const layout = seatLayout('wagon', direction, SIZE, 1, 1, true), rigPart = layout.find(p => p.part === 'rig');
  const seats = aboard.map((rider, i) => ({ ...bedLayout(direction, i, SIZE, 1, rigPart), rider })).sort((a, b) => a.dy - b.dy);
  if (seats.length) layout.splice(seats[0].behind ? 0 : layout.indexOf(rigPart) + 1, 0, ...seats);
  const sat = seatedClip(driver, direction, 'wagon');
  for (const part of layout) {
    const px = x + part.dx * size * along, py = y + part.dy * size, height = part.height * size;
    if (part.part === 'rig') {
      if (part.band) { ctx.save(); ctx.beginPath(); ctx.rect(px - height * 4, py - height * part.band, height * 8, height * 2); ctx.clip(); }
      drawClip(ctx, clip.id, px, py, height, { timeMs: t, flip: clip.upright ? false : flip });
      if (part.band) ctx.restore();
    } else if (part.part === 'passenger') {
      const sits = passengerClip(part.rider, direction), hip = py - height * SEAT.hip, whole = height * SEAT.driverHeight;
      drawClip(ctx, sits.id, px, hip + whole * SEAT.driverHip, whole, { timeMs: t, flip: sits.upright ? false : flip });
    } else drawClip(ctx, sat.id, px, py, height, { timeMs: t, flip: sat.upright ? false : flip });
  }
  return [clip.id, sat.id, ...aboard.map(one => passengerClip(one, direction).id)];
}
const label = (text, x, y, size = 12) => { ctx.fillStyle = '#23180f'; ctx.font = size + 'px Georgia'; ctx.fillText(text, x, y); };
window.rigScene = (t, size, heading = true) => {
  const col = size * 6.6, rowH = size * 4.2;
  c.width = 30 + col * 4; c.height = (heading ? 30 : 10) + rowH * 2;
  ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height);
  if (heading) label('The wagon and its ox as one drawing (Claude, temporary), laid out by public/motion.js: a driver on the box; then four riding in the open tail. A person ' + size + ' px.', 10, 18, 13);
  const used = new Set();
  ['e', 'w', 's', 'n'].forEach((direction, k) => [[], riders].forEach((aboard, r) => {
    const x = 20 + col * k + col * (direction === 'e' ? 0.42 : direction === 'w' ? 0.58 : 0.5), y = (heading ? 30 : 10) + rowH * r + (direction === 's' || direction === 'n' ? rowH * 0.62 : rowH * 0.7);
    rig(x, y, size, direction, aboard, t).forEach(id => used.add(id));
    label(direction + (aboard.length ? ', four riding' : ', the driver'), 20 + col * k, (heading ? 30 : 10) + rowH * (r + 1) - 6, 11);
  }));
  return [...used].filter(id => !clipReady(id));
};
// The yard: a girl running at tag round a square, and a boy carrying water to and fro.
const girl = person('hh-1-child-3', { sex: 'female', band: 'child', task: 'play', chore: { id: 'child-tag', doing: 'running at tag about the yard' } });
const yard = new DrawnHeading(1e-4), fetched = new DrawnHeading(1e-4);
const around = t => { const side = 1.6, speed = 1.3, s = (t / 1000 * speed) % (side * 4), leg = Math.floor(s / side), f = s % side;
  return [[f, 0], [side, f], [side - f, side], [0, side - f]][leg]; };
window.yardScene = t => {
  const size = 77; c.width = 620; c.height = 300;
  ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height);
  label('A girl running at tag, turned the way she is drawn going; a boy carrying water down and up (Claude, temporary). 77 px.', 8, 16, 12);
  const [gx, gy] = around(t), way = yard.update('girl', gx, gy);
  const binding = entityClip({ ...girl, ...(way && { yardHeading: way }) }), own = drawnClipName(binding, binding.id);
  const run = clipReady(own) ? own : binding.id, upright = (clipReady(own) ? binding.drawn.upright : binding.upright) || false;
  drawClip(ctx, run, 80 + gx * size, 70 + gy * size * 0.8 + size, size, { timeMs: t, flip: upright ? false : way === 'w' });
  label(run + (way === 'w' && !upright ? ' (mirrored)' : ''), 20, 290, 11);
  const step = fetchStep(STROKES.water.fetch, t, 3493), going = fetched.update('boy', step.dx, step.dy), pose = going ? fetchPose(STROKES.water, going) : null;
  const carry = 'boy-' + (pose ? pose.drawn : 'carry-water');
  drawClip(ctx, carry, 470 + step.dx * size, 60 + size + step.dy * size * 0.8, size, { timeMs: t, flip: pose ? !pose.upright && pose.west : false });
  label(carry, 400, 290, 11);
  return [run, carry].filter(id => !clipReady(id));
};
window.ready = loadArt().then(async () => { for (let i = 0; i < 60 && (window.rigScene(0, 56).length || window.yardScene(0).length); i++) await new Promise(r => setTimeout(r, 100)); });
</script></body>`;

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); return; }
  const file = normalize(join(PUBLIC, path));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });
try {
  await withBrowser(async (first, browser) => {
    const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => window.ready);
    const missing = await page.evaluate(() => [...window.rigScene(0, 56), ...window.yardScene(0)]);
    if (missing.length || errors.length) throw new Error(`not drawn: ${missing.join(', ')} ${errors.join(' | ')}`);
    // The strip: one still at 56 px and one at 40 px.
    const stills = [];
    for (const size of [56, 40]) { await page.evaluate(size => window.rigScene(700, size, size === 56), size); stills.push(await page.locator('#c').screenshot({ type: 'png' })); }
    await writeFile(`${OUT}preview-rig-strip.png`, stills[0]);
    await writeFile(`${OUT}preview-rig-strip-40.png`, stills[1]);
    const frames = [];
    for (let t = 0; t < 2080; t += 80) { await page.evaluate(t => window.rigScene(t, 56), t); frames.push(await page.locator('#c').screenshot({ type: 'png' })); }
    await writeFile(`${OUT}preview-rig.apng`, apng(frames, 80));
    const yard = [];
    for (let t = 0; t < 6400; t += 100) { await page.evaluate(t => window.yardScene(t), t); yard.push(await page.locator('#c').screenshot({ type: 'png' })); }
    await writeFile(`${OUT}preview-yard.apng`, apng(yard, 100));
    // And a strip of the yard: every 800 ms of the loop at half size, so the turns can be read on a still page.
    await page.evaluate(() => {
      const strip = document.createElement('canvas'); strip.id = 's'; strip.width = 310 * 4; strip.height = 150 * 2; document.body.append(strip);
      const sctx = strip.getContext('2d');
      for (let t = 0, n = 0; t < 6400; t += 50) { window.yardScene(t); if (t % 800 === 0) { sctx.drawImage(document.getElementById('c'), (n % 4) * 310, Math.floor(n / 4) * 150, 310, 150); n++; } }
    });
    await page.locator('#s').screenshot({ path: `${OUT}preview-yard-strip.png` });
    console.log(`preview-rig.apng ${frames.length} frames, preview-yard.apng ${yard.length} frames`);
  });
} finally {
  server.close();
}
