// Moving previews: each Claude clip beside the nearest clip of Astra's, as the game plays them (docs/ART_STYLE.md: "check it
// beside existing game art at actual play size"; the area D brief: "judge them moving"). Writes two things to
// docs/evidence/claude-art/:
//   loops-<name>.png   a filmstrip - every frame of each clip in order at 77 px and 150 px, and an onion skin of the frames
//                      laid over each other, so a hoof that slides or a wheel that jumps shows on a still page
//   loops-<name>.html  the same clips looping at their own frame durations on the map's grass (open it in a browser)
//
// Run: node scripts/claude-art/loops.mjs <name> <claude-clip>[=<astra-clip>] ...
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser, shoot } from './kit/browser.mjs';

const OUT = fileURLToPath(new URL('../../docs/evidence/claude-art/', import.meta.url));
const ASTRA = fileURLToPath(new URL('../../public/assets/frontier-v1/', import.meta.url));
const CLAUDE = fileURLToPath(new URL('../../public/assets/claude-standins/', import.meta.url));
const astra = { ...JSON.parse(readFileSync(ASTRA + 'atlas.json', 'utf8')), clips: JSON.parse(readFileSync(ASTRA + 'animation.json', 'utf8')).clips };
const claude = JSON.parse(readFileSync(CLAUDE + 'atlas.json', 'utf8'));
const GRASS = '#7f9f58';

/** One clip's frames with their pictures: [{ sheetKey, frame, duration }], and the height it is drawn at (persons). */
function clipOf(lib, name, height) {
  const L = lib === 'a' ? astra : claude, clip = L.clips[name];
  if (!clip) throw new Error(`${lib === 'a' ? 'Astra' : 'Claude'} has no clip ${name}`);
  return { lib, name, height, frames: clip.frames.map(f => ({ sheet: `${lib}:${L.frames[f.sprite].sheet}`, frame: L.frames[f.sprite], duration: f.duration })) };
}
const sheetFile = key => { const [lib, sheet] = key.split(':'); return lib === 'a' ? ASTRA + astra.sheets[sheet].image : CLAUDE + claude.sheets[sheet].image.split('/').at(-1); };
/** A Claude clip's height in persons: its frames' `height` from the provenance note is not stored, so read it from the size its logical height stands for. */
const personsOf = (lib, name) => {
  const f = (lib === 'a' ? astra : claude).frames[(lib === 'a' ? astra : claude).clips[name].frames[0].sprite];
  if (/ride|mounted|gallop|lancer|dragoon|forager|volunteer-ride/.test(name)) return 1.8;
  if (/wagon-ox|wagon-travel/.test(name)) return 1.55;
  if (/cart|carreta/.test(name)) return 1.24;
  if (/herd|mustang/.test(name)) return 1.15;
  if (/ox-walk|ox-packed/.test(name)) return 1.45;
  if (/mule|horse-walk/.test(name)) return 1.5;
  if (/cow|cattle/.test(name)) return 1.2;
  return f.logicalHeight ? 1 : 1;
};

export async function loops(name, pairs) {
  const rows = pairs.map(([c, a]) => [clipOf('c', c, personsOf('c', c)), ...(a ? [clipOf('a', a, personsOf('a', a))] : [])]);
  const sheets = [...new Set(rows.flat().flatMap(clip => clip.frames.map(f => f.sheet)))];
  const sources = Object.fromEntries(sheets.map(key => [key, 'data:image/png;base64,' + readFileSync(sheetFile(key)).toString('base64')]));
  const data = JSON.stringify(rows), src = JSON.stringify(sources);
  const draw = `const rows = ${data}, sources = ${src};
const img = {};
const load = s => new Promise(done => { const im = new Image(); im.onload = () => done(im); im.src = s; });
const put = (ctx, f, sheet, x, ground, height) => { const s = height / (f.logicalHeight || f.h), w = f.w * s, h = f.h * s; ctx.drawImage(img[sheet], f.x, f.y, f.w, f.h, x - w * f.anchorX, ground - h * f.anchorY, w, h); return w; };`;
  // The filmstrip.
  const W = 2600, lineH = [77, 150].map(s => s * 2.2 + 30), H = 50 + rows.flat().length * (lineH[0] + lineH[1] + 20);
  const strip = `<!doctype html><body style="margin:0;background:${GRASS}"><canvas id="c" width="${W}" height="${H}"></canvas><script>${draw}
(async () => { for (const [k, s] of Object.entries(sources)) img[k] = await load(s);
  const ctx = document.getElementById('c').getContext('2d'); ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, ${W}, ${H});
  ctx.fillStyle = '#23180f'; ctx.font = 'bold 15px Georgia'; ctx.fillText(${JSON.stringify(`${name}: each clip's frames in order, then all of them laid over each other (onion skin); Claude's (temporary) above Astra's nearest. 77 px and 150 px a person.`)}, 12, 24);
  let top = 50;
  for (const clip of rows.flat()) for (const size of [77, 150]) {
    const ground = top + size * 1.9, height = size * clip.height;
    ctx.fillStyle = clip.lib === 'a' ? '#23180f' : '#6a1e10'; ctx.font = '12px Georgia'; ctx.fillText((clip.lib === 'a' ? 'Astra: ' : 'Claude: ') + clip.name + ' @' + size, 8, top + 14);
    let x = 40;
    for (const f of clip.frames) { const w = put(ctx, f.frame, f.sheet, x + height * 0.9, ground, height); x += Math.max(w, height * 0.5) + 16; }
    ctx.globalAlpha = 0.4; for (const f of clip.frames) put(ctx, f.frame, f.sheet, x + height * 1.1, ground, height); ctx.globalAlpha = 1;
    top += size * 2.2 + 30 + (size === 150 ? 20 : 0);
  }
  document.title = 'done'; })();</script></body>`;
  // The moving page.
  const page = `<!doctype html><meta charset="utf-8"><title>${name}: moving</title><body style="margin:0;background:${GRASS};font:13px Georgia;color:#23180f">
<p style="margin:8px 12px">${name}: Claude-drawn clips (temporary, left) looping beside Astra's nearest (right) at their own frame durations, at 77 px a person.</p>
<canvas id="c" width="1400" height="${rows.length * 190 + 20}"></canvas><script>${draw}
(async () => { for (const [k, s] of Object.entries(sources)) img[k] = await load(s);
  const ctx = document.getElementById('c').getContext('2d'), t0 = performance.now();
  const frameAt = (clip, t) => { const total = clip.frames.reduce((s, f) => s + f.duration, 0); let at = t % total; for (const f of clip.frames) { if (at < f.duration) return f; at -= f.duration; } return clip.frames[0]; };
  const tick = () => { const t = performance.now() - t0; ctx.fillStyle = '${GRASS}'; ctx.fillRect(0, 0, 1400, ${rows.length * 190 + 20});
    rows.forEach((row, i) => row.forEach((clip, j) => { const f = frameAt(clip, t); put(ctx, f.frame, f.sheet, 220 + j * 600, 160 + i * 190, 77 * clip.height); ctx.fillStyle = '#23180f'; ctx.fillText(clip.name, 40 + j * 600, 180 + i * 190); }));
    requestAnimationFrame(tick); };
  tick(); })();</script></body>`;
  mkdirSync(OUT, { recursive: true });
  // The page on disk reads the sheets from the repository rather than carrying them, so it stays small.
  const relative = key => { const [lib, sheet] = key.split(':'); return lib === 'a' ? `../../../public/assets/frontier-v1/${astra.sheets[sheet].image}` : `../../../public/assets/claude-standins/${claude.sheets[sheet].image.split('/').at(-1)}`; };
  writeFileSync(`${OUT}loops-${name}.html`, page.replace(src, JSON.stringify(Object.fromEntries(sheets.map(key => [key, relative(key)])))));
  await withBrowser(async p => {
    await p.setViewportSize({ width: W, height: Math.ceil(H) });
    await p.setContent(strip);
    await p.waitForFunction(() => document.title === 'done');
    await p.screenshot({ path: `${OUT}loops-${name}.png`, clip: { x: 0, y: 0, width: W, height: Math.ceil(H) } });
  });
  return `${OUT}loops-${name}.png`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [name, ...specs] = process.argv.slice(2);
  console.log(await loops(name, specs.map(spec => spec.split('='))));
}
