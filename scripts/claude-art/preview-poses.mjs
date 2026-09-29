// See an area module's clips moving, beside Astra's nearest (the builder's brief for area A: "Render a looping preview of each
// clip beside Astra's nearest clip ... and judge it moving"). For one figure (rust unless named), every clip of the module is
// drawn from its own SVGs at its own timing, each beside the Astra clip its module names as nearest (`NEAREST`, pose ->
// her pose), on the map's grass, and written to docs/evidence/claude-art/:
//   preview-<module>.apng        the clips moving at play speed, a person 77 px (an animated PNG: open it in a browser)
//   preview-<module>-strip.png   every 100 ms of 2.4 s, a person 77 px, one row a clip and hers under it: timing without playing
//   preview-<module>-onion.png   each clip's frames laid over one another at 150 px, the feet marked: what moves and what stays
// Run: node scripts/claude-art/preview-poses.mjs <module> [figure]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { withBrowser } from './kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../public/assets/frontier-v1/', import.meta.url));
const SHARED = readFileSync(fileURLToPath(new URL('../../public/assets/claude-standins/svg/_shared-defs.svg', import.meta.url)), 'utf8');
const atlas = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8'));
const animation = JSON.parse(readFileSync(ASTRA + 'animation.json', 'utf8'));
const GRASS = '#7f9f58';

/** A module's clip as a subject: its frames drawn from their SVGs, and its timing. */
export function moduleSubject(m, clipName) {
  const clip = m.CLIPS[clipName], all = Object.values(m.SHEETS).flatMap(s => s.frames);
  const frames = clip.frames.map(({ sprite }) => {
    const frame = all.find(f => f.name === sprite), f = frame.draw();
    const svg = f.svg.replace('<defs>', `<defs>${SHARED.replace(/<\/?defs>/g, '')}`);
    const [w, h] = f.svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
    return { src: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), sx: 0, sy: 0, w, h, anchorX: f.anchorX, anchorY: f.anchorY, logicalHeight: f.logicalHeight || h };
  });
  return { label: `Claude ${clipName}`, frames, durations: clip.frames.map(f => f.duration), beat: clip.beat };
}
/** One of Astra's clips as a subject. */
export function astraSubject(clipName) {
  const c = animation.clips[clipName];
  if (!c) return null;
  const sheets = {};
  const frames = c.frames.map(({ sprite }) => {
    const f = atlas.frames[sprite], sheet = atlas.sheets[f.sheet];
    sheets[f.sheet] ??= 'data:image/png;base64,' + readFileSync(ASTRA + sheet.image).toString('base64');
    return { src: sheets[f.sheet], sx: f.x, sy: f.y, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY, logicalHeight: f.logicalHeight || f.h };
  });
  return { label: `Astra ${clipName}`, frames, durations: c.frames.map(f => f.duration) };
}

const LIB = `const frameAt = (s, t) => { const total = s.durations.reduce((a, b) => a + b, 0); let at = t % total; for (let i = 0; i < s.durations.length; i++) { if (at < s.durations[i]) return i; at -= s.durations[i]; } return 0; };
const images = new Map();
const loadAll = async subjects => { for (const s of subjects) for (const f of s.frames) if (!images.has(f.src)) images.set(f.src, await new Promise(d => { const im = new Image(); im.onload = () => d(im); im.onerror = () => d(null); im.src = f.src; })); };
const put = (ctx, f, cx, ground, size, alpha = 1) => { const k = size / f.logicalHeight, w = f.w * k, h = f.h * k; ctx.globalAlpha = alpha; ctx.drawImage(images.get(f.src), f.sx, f.sy, f.w, f.h, cx - w * f.anchorX, ground - h * f.anchorY, w, h); ctx.globalAlpha = 1; };`;

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

async function canvasPage(browser, width, height, script) {
  const p = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: Math.ceil(width), height: Math.ceil(height) } });
  await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:${GRASS}"><canvas id="c" width="${Math.ceil(width)}" height="${Math.ceil(height)}"></canvas><script>${LIB}
const c = document.getElementById('c'), ctx = c.getContext('2d');
${script}</script></body>`);
  await p.evaluate(() => window.ready);
  return p;
}

/** Pairs of [Claude clip, Astra's nearest] as rows. */
export async function preview(browser, name, pairs, { cycle = 2400, step = 80 } = {}) {
  const subjects = pairs.flat().filter(Boolean);
  // The strip: every 100 ms of `cycle`, a person 77 px.
  {
    const size = 77, steps = cycle / 200, rowH = size * 1.55, width = 200 + steps * size * 0.95, height = 30 + subjects.length * rowH;
    const p = await canvasPage(browser, width, height, `const subjects = ${JSON.stringify(subjects)};
window.ready = loadAll(subjects).then(() => { ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#23180f'; ctx.font = 'bold 13px Georgia';
  ctx.fillText(${JSON.stringify(`${name}: every 200 ms of ${cycle / 1000} s at a person 77 px; each Claude clip (temporary) above Astra's nearest`)}, 10, 18);
  subjects.forEach((s, r) => { const ground = 30 + r * ${rowH} + ${size} * 1.2; ctx.fillStyle = s.label.startsWith('Astra') ? '#23180f' : '#6a1e10'; ctx.font = '11px Georgia'; ctx.fillText(s.label, 6, ground - 30);
    for (let k = 0; k < ${steps}; k++) { const i = frameAt(s, k * 200); put(ctx, s.frames[i], 200 + k * ${size} * 0.95 + ${size} * 0.4, ground, ${size}); ctx.fillStyle = '#23180f'; ctx.font = '9px Georgia'; ctx.fillText((k * 200) + '·' + (i + 1) + (s.beat === i ? '!' : ''), 186 + k * ${size} * 0.95 + ${size} * 0.4, ground + 11); } }); });`);
    await p.locator('#c').screenshot({ path: `${OUT}preview-${name}-strip.png` }); await p.close();
  }
  // The onion: every frame of each Claude clip over one another at 150 px, the first stronger; blue marks under the first frame's feet.
  {
    const claude = pairs.map(pair => pair[0]), size = 150, colW = size * 1.25, perRow = 6, rows = Math.ceil(claude.length / perRow);
    const width = 30 + Math.min(perRow, claude.length) * colW, height = 30 + rows * size * 1.45;
    const p = await canvasPage(browser, width, height, `const subjects = ${JSON.stringify(claude)};
window.ready = loadAll(subjects).then(() => { ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#23180f'; ctx.font = 'bold 13px Georgia';
  ctx.fillText(${JSON.stringify(`${name}: each clip's frames laid over one another at a person 150 px (the first frame strongest)`)}, 10, 18);
  subjects.forEach((s, n) => { const cx = 20 + (n % ${perRow}) * ${colW} + ${size} * 0.55, ground = 30 + Math.floor(n / ${perRow}) * ${size} * 1.45 + ${size} * 1.2;
    s.frames.forEach((f, i) => put(ctx, f, cx, ground, ${size}, i === 0 ? 0.9 : 0.4));
    ctx.fillStyle = '#23180f'; ctx.font = '11px Georgia'; ctx.fillText(s.label.replace('Claude ', ''), cx - 50, ground + 16); }); });`);
    await p.locator('#c').screenshot({ path: `${OUT}preview-${name}-onion.png` }); await p.close();
  }
  // Every frame of every Claude clip, one after another at a person 200 px: the drawing itself.
  {
    const frames = pairs.flatMap(pair => pair[0].frames.map((f, i) => ({ f, label: `${pair[0].label.replace('Claude ', '')} ${i + 1}` })));
    const size = 200, colW = size * 0.95, perRow = 8, rows = Math.ceil(frames.length / perRow), width = 20 + perRow * colW, height = 20 + rows * size * 1.3;
    const p = await canvasPage(browser, width, height, `const frames = ${JSON.stringify(frames)};
window.ready = loadAll([{ frames: frames.map(x => x.f) }]).then(() => { ctx.fillStyle = '#d9cda8'; ctx.fillRect(0, 0, c.width, c.height);
  frames.forEach((x, n) => { const cx = 10 + (n % ${perRow}) * ${colW} + ${colW} * 0.5, ground = 10 + Math.floor(n / ${perRow}) * ${size} * 1.3 + ${size} * 1.12;
    put(ctx, x.f, cx, ground, ${size}); ctx.fillStyle = '#23180f'; ctx.font = '11px Georgia'; ctx.fillText(x.label, cx - 60, ground + 14); }); });`);
    await p.locator('#c').screenshot({ path: `${OUT}preview-${name}-frames.png` }); await p.close();
  }
  // The animation, a person 77 px: each pair side by side, rows of four pairs.
  {
    const size = 77, perRow = 4, pairW = size * 2.6, rows = Math.ceil(pairs.length / perRow), width = 20 + Math.min(perRow, pairs.length) * pairW, height = 30 + rows * size * 1.55;
    const p = await canvasPage(browser, width, height, `const pairs = ${JSON.stringify(pairs)};
window.ready = loadAll(pairs.flat().filter(Boolean));
window.draw = t => { ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#23180f'; ctx.font = 'bold 12px Georgia'; ctx.fillText(${JSON.stringify(`${name}: Claude (left of each pair, temporary) and Astra's nearest (right), a person 77 px`)}, 8, 16);
  pairs.forEach((pair, n) => { const x = 10 + (n % ${perRow}) * ${pairW}, ground = 30 + Math.floor(n / ${perRow}) * ${size} * 1.55 + ${size} * 1.18;
    pair.forEach((s, k) => { if (!s) return; put(ctx, s.frames[frameAt(s, t)], x + ${size} * (0.55 + k * 1.15), ground, ${size}); });
    ctx.fillStyle = '#23180f'; ctx.font = '10px Georgia'; ctx.fillText(pair[0].label.replace('Claude ', ''), x + 4, ground + 13); }); };`);
    const pngs = [];
    for (let t = 0; t < cycle; t += step) { await p.evaluate(t => window.draw(t), t); pngs.push(await p.locator('#c').screenshot({ type: 'png' })); }
    writeFileSync(`${OUT}preview-${name}.apng`, apng(pngs, step)); await p.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const [module, figure = 'rust'] = process.argv.slice(2);
  const m = await import(new URL(`./areas/${module}.mjs`, import.meta.url));
  const nearest = m.NEAREST || {};
  // A clip is a figure's when that figure is the longest cast name it starts with (`rust-woman-sew` is not rust's).
  const owner = n => (m.FIGURES || []).filter(f => n.startsWith(`${f}-`)).sort((a, b) => b.length - a.length)[0];
  const mine = Object.keys(m.CLIPS).filter(name => owner(name) === figure);
  const pairs = (mine.length ? mine : Object.keys(m.CLIPS))
    .map(name => { const pose = name.slice(figure.length + 1), hers = nearest[pose] ?? nearest[name]; return [moduleSubject(m, name), hers ? astraSubject(animation.clips[hers] ? hers : `${figure}-${hers}`) : null]; });
  await withBrowser(async (first, browser) => { await preview(browser, `${module}${figure === 'rust' ? '' : '-' + figure}`, pairs, { cycle: m.PREVIEW_CYCLE || 2400 }); });
  console.log(`preview-${module}: ${pairs.length} clips`);
}
