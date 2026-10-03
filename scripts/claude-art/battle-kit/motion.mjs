// Area C's clips moving, beside Astra's nearest military clips (the brief: "render looping previews beside Astra's nearest
// military clips and judge them moving"). Two outputs, both drawn with the game's own arithmetic (scaled by logical height, set
// on the ground anchor, each clip's own frame durations):
//   docs/evidence/claude-art/motion-battles.png   every clip as a filmstrip - one full cycle sampled evenly in time - and its
//                                                 onion skin (all samples laid over each other: do the feet stay planted, does the
//                                                 body move on arcs?), Astra's clip on the left of each row, Claude's after it;
//   docs/evidence/claude-art/motion-battles.webm  the same clips looping side by side for eight seconds, at a figure of 90 px,
//                                                 where Playwright can record video (skipped, and said, where it cannot).
// Run: node scripts/claude-art/battle-kit/motion.mjs
import { readFileSync, mkdirSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser } from '../kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../../public/assets/frontier-v1/', import.meta.url));
const CLAUDE = fileURLToPath(new URL('../../../public/assets/claude-standins/', import.meta.url));
const astra = JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8')), astraClips = JSON.parse(readFileSync(ASTRA + 'animation.json', 'utf8')).clips;
const claude = JSON.parse(readFileSync(CLAUDE + 'atlas.json', 'utf8'));

// [Astra's clip (h: its drawn height in persons), Claude's clips compared with it]
const ROWS = [
  [['volunteer-fire-reload', 1], ['rust-fire-reload', 1], ['teal-fire-reload', 1], ['elder-fire-reload', 1]],
  [['regular-fire-reload', 1], ['skirmisher-kneel-fire', 1], ['regular-loophole-fire', 1], ['regular-prone-fire-cycle', 1]],
  [['volunteer-fire-reload', 1], ['volunteer-bank-climb', 1], ['volunteer-parapet-fire-e', 1], ['volunteer-loophole-fire', 1]],
  [['regular-march', 1], ['skirmisher-run-e', 1], ['figure-wading-regular', 1], ['regular-march-column', 1]],
  [['volunteer-march', 1], ['bearers-carry', 1], ['burial-party-walk-e', 1], ['volunteer-dig', 1]],
  [['volunteer-gun-ram', 1], ['settler-gun-ram', 1], ['settler-gun-carry', 1], ['volunteer-crowbar', 1]],
  [['travis-walk-e', 1], ['kimbell-walk-e', 1], ['sanchez-navarro-walk-e', 1], ['ana-esparza-walk-e', 1]],
  [['houston-mounted-walk-e', 1.35], ['kimbell-mounted-walk-e', 1.35], ['smither-mounted-walk-e', 1.35], ['ana-esparza-carry-toddler', 1]],
  [['castrillon-walk-e', 1], ['castrillon-walk-s', 1], ['barragan-walk-n', 1], ['volunteer-camp-cook', 1]],
];
const clipOf = name => claude.clips[name] ? { lib: 'c', ...claude.clips[name] } : astraClips[name] ? { lib: 'a', ...astraClips[name] } : null;

const sheetsUsed = new Set();
const rows = ROWS.map(row => row.map(([name, h]) => {
  const clip = clipOf(name);
  if (!clip) throw new Error(`no clip ${name}`);
  const frames = clip.frames.map(f => {
    const atlas = clip.lib === 'a' ? astra : claude, fr = atlas.frames[f.sprite];
    sheetsUsed.add(`${clip.lib}:${fr.sheet}`);
    return { ...fr, lib: clip.lib, duration: f.duration };
  });
  return { name, h, lib: clip.lib, frames };
}));
const images = Object.fromEntries([...sheetsUsed].map(key => {
  const [lib, sheet] = key.split(':');
  const file = lib === 'a' ? ASTRA + astra.sheets[sheet].image : CLAUDE + claude.sheets[sheet].image.split('/').at(-1);
  return [key, 'data:image/png;base64,' + readFileSync(file).toString('base64')];
}));

const page = (mode, H) => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#7f9f58"><canvas id="c"></canvas><script>
const rows = ${JSON.stringify(rows)}, sources = ${JSON.stringify(images)}, H = ${H}, mode = '${mode}', SAMPLES = 8;
const c = document.getElementById('c'), ctx = c.getContext('2d');
const load = src => new Promise(done => { const im = new Image(); im.onload = () => done(im); im.src = src; });
const total = clip => clip.frames.reduce((s, f) => s + f.duration, 0);
const at = (clip, t) => { let e = 0; t %= total(clip); for (const f of clip.frames) { e += f.duration; if (t < e) return f; } return clip.frames.at(-1); };
function put(img, f, x, y, h, alpha = 1) {
  const s = h / (f.logicalHeight || f.h), w = f.w * s, hh = f.h * s;
  ctx.globalAlpha = alpha; ctx.drawImage(img[f.lib + ':' + f.sheet], f.x, f.y, f.w, f.h, x - w * f.anchorX, y - hh * f.anchorY, w, hh); ctx.globalAlpha = 1;
}
(async () => {
  const img = {}; for (const [k, v] of Object.entries(sources)) img[k] = await load(v);
  if (mode === 'strip') {
    const cellW = H * 1.25, clipW = cellW * (SAMPLES + 1.6), rowH = H * 1.75;
    c.width = Math.ceil(24 + 2 * clipW); c.height = Math.ceil(40 + rows.reduce((s, r) => s + Math.ceil(r.length / 2) * rowH, 0));
    ctx.fillStyle = '#7f9f58'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#23180f'; ctx.font = 'bold 14px Georgia';
    ctx.fillText('Area C clips moving: each a full cycle sampled evenly in time (' + SAMPLES + ' samples), then its onion skin. Astra\\'s clip first in each group (dark label), Claude\\'s after it (red label, temporary).', 10, 22);
    let y = 40;
    for (const row of rows) {
      row.forEach((clip, i) => {
        const col = i % 2, top = y + Math.floor(i / 2) * rowH, ground = top + H * 1.35, x0 = 12 + col * clipW, h = H * clip.h, T = total(clip);
        ctx.fillStyle = clip.lib === 'a' ? '#23180f' : '#7a1e10'; ctx.font = '12px Georgia'; ctx.fillText((clip.lib === 'a' ? 'Astra: ' : 'Claude: ') + clip.name + ' (' + T + ' ms)', x0, top + 12);
        ctx.strokeStyle = 'rgba(40,30,10,.35)'; ctx.beginPath(); ctx.moveTo(x0, ground + 1); ctx.lineTo(x0 + clipW - 20, ground + 1); ctx.stroke();
        for (let k = 0; k < SAMPLES; k++) put(img, at(clip, T * k / SAMPLES), x0 + cellW * (k + 0.5), ground, h);
        for (let k = 0; k < SAMPLES; k++) put(img, at(clip, T * k / SAMPLES), x0 + cellW * (SAMPLES + 0.8), ground, h, 0.28);
      });
      y += Math.ceil(row.length / 2) * rowH;
    }
  } else {
    const cellW = H * 1.9, rowH = H * 1.6;
    c.width = Math.ceil(cellW * 4 + 20); c.height = Math.ceil(rows.length * rowH + 20);
    const t0 = performance.now();
    const frame = () => {
      const t = performance.now() - t0;
      ctx.fillStyle = '#7f9f58'; ctx.fillRect(0, 0, c.width, c.height);
      rows.forEach((row, r) => row.forEach((clip, i) => {
        const x = 10 + cellW * (i + 0.5), g = 10 + rowH * (r + 0.85);
        put(img, at(clip, t), x, g, H * clip.h);
        ctx.fillStyle = clip.lib === 'a' ? '#23180f' : '#7a1e10'; ctx.font = '11px Georgia'; ctx.fillText(clip.name, x - cellW * 0.45, g + 13);
      }));
      requestAnimationFrame(frame);
    };
    frame();
  }
  document.title = 'done';
})();
</script></body>`;

mkdirSync(OUT, { recursive: true });
await withBrowser(async (first, browser) => {
  await first.setViewportSize({ width: 2800, height: 4000 });
  await first.setContent(page('strip', 90));
  await first.waitForFunction(() => document.title === 'done');
  const size = await first.evaluate(() => ({ w: document.getElementById('c').width, h: document.getElementById('c').height }));
  await first.screenshot({ path: OUT + 'motion-battles.png', clip: { x: 0, y: 0, width: size.w, height: size.h } });
  console.log(OUT + 'motion-battles.png');
  // The looping preview: Playwright records a page's video where its ffmpeg is installed.
  try {
    const context = await browser.newContext({ viewport: { width: 700, height: 1310 }, recordVideo: { dir: OUT + 'motion-video', size: { width: 700, height: 1310 } } });
    const page2 = await context.newPage();
    await page2.setContent(page('loop', 60));
    await page2.waitForFunction(() => document.title === 'done');
    await page2.waitForTimeout(8000);
    const video = page2.video();
    await context.close();
    const path = await video.path();
    if (existsSync(OUT + 'motion-battles.webm')) unlinkSync(OUT + 'motion-battles.webm');
    renameSync(path, OUT + 'motion-battles.webm');
    console.log(OUT + 'motion-battles.webm');
  } catch (error) { console.log(`no video: ${error.message.split('\n')[0]}`); }
});
