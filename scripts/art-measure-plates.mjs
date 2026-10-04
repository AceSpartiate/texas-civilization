// Before-and-after plates for docs/ART_REQUESTS.md C1-C3 (2026-10-04): Astra's frames as the game drew them with the old
// measurements and with the new, drawn in Chrome by the game's own drawSprite (public/art.js) at one requested height.
//
// Run: node scripts/art-measure-plates.mjs [before-ref]   (before-ref defaults to origin/main's atlas.json)
// Writes docs/evidence/art-measure-anchor.png (C1) and docs/evidence/art-measure-scale.png (C2, C3), each with the old
// measurement on the left and the new on the right. Needs PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE like the proofs.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const beforeRef = process.argv[2] || 'origin/main';
const beforeAtlas = execFileSync('git', ['show', `${beforeRef}:public/assets/frontier-v1/atlas.json`], { maxBuffer: 64 << 20 }).toString();

// C1: each clip's frames laid over one another, faint, on one ground point (the red cross). A figure that stays put is
// one sharp body with its legs fanned; one that slides is a smear along the path.
const ANCHOR = ['javelina-alert-run', 'seguin-mounted-canter-e', 'bison-run', 'mustang-gallop', 'sherman-walk-e', 'mcculloch-walk-e', 'hockley-walk-e', 'grant-mounted-gallop-e'];
// C2 and C3: frames side by side at one requested height (the blue dashed line), standing on the red ground line.
const SCALE = [
  ['the deer: grazing, head up, alert, bounding, drinking', ['deer-idle-1', 'deer-idle-4', 'deer-alert-1', 'deer-bound-3', 'deer-drink-1']],
  ['the gun crew: carrying the rammer, ramming, lifting the shot, at the lanyard', ['volunteer-rammer-carry-1', 'volunteer-ram-1', 'volunteer-roundshot-lift', 'volunteer-lanyard-pull', 'volunteer-e']],
  ['camp and loophole beside a man standing', ['volunteer-sandbag-carry-2', 'volunteer-rest-sit-1', 'volunteer-sleep-1', 'volunteer-loophole-aim', 'regular-rest-sit-1']],
  ['Gonzales\' rammer; the Twin Sisters\' crew; Castrillon on the crate', ['settler-gun-ram-1', 'settler-gun-rammer-cover-1', 'twin-crew-shot-carry', 'twin-crew-ram', 'castrillon-crate-command-1']],
  ['famous: Hockley and Sherman walking, and the action pose that set their height', ['hockley-walk-e-1', 'hockley-fire-signal', 'sherman-walk-e-1', 'sherman-rally', 'susanna-child-walk-e-1']],
];

async function draw(page, kind) {
  return page.evaluate(async ({ kind, ANCHOR, SCALE }) => {
    const { loadArt, drawSprite, clipInfo, spriteFrame } = await import('/art.js');
    await loadArt();
    const wanted = [...ANCHOR.flatMap(id => clipInfo(id).frames.map(f => f.sprite)), ...SCALE.flatMap(([, names]) => names)];
    await loadArt({ sheets: [...new Set(wanted.map(name => spriteFrame(name).sheet))] });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const ground = (x0, x1, y) => { ctx.strokeStyle = '#d02020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); };
    const label = (text, x, y) => { ctx.fillStyle = '#2a2418'; ctx.font = '13px sans-serif'; ctx.fillText(text, x, y); };
    if (kind === 'anchor') {
      canvas.width = 760; canvas.height = ANCHOR.length * 150 + 10;
      ctx.fillStyle = '#a8b38f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ANCHOR.forEach((id, row) => {
        const y = row * 150 + 130, frames = clipInfo(id).frames.map(f => f.sprite);
        const wide = Math.max(...frames.map(n => spriteFrame(n).w / (spriteFrame(n).logicalHeight || spriteFrame(n).h)));
        const height = Math.min(110, 300 / wide);
        ground(20, 740, y);
        for (const name of frames) drawSprite(ctx, name, 380, y, height, { alpha: 0.32 });
        ctx.strokeStyle = '#d02020'; ctx.beginPath(); ctx.moveTo(380, y - height * 1.15); ctx.lineTo(380, y + 8); ctx.moveTo(372, y); ctx.lineTo(388, y); ctx.stroke();
        label(`${id} (${frames.length} frames)`, 20, y - 112);
      });
    } else {
      canvas.width = 900; canvas.height = SCALE.length * 190 + 10;
      ctx.fillStyle = '#a8b38f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      SCALE.forEach(([title, names], row) => {
        const y = row * 190 + 170, height = 130;
        ground(10, 890, y);
        ctx.strokeStyle = '#2050d0'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(10, y - height); ctx.lineTo(890, y - height); ctx.stroke(); ctx.setLineDash([]);
        label(title, 14, y - height - 12);
        names.forEach((name, i) => drawSprite(ctx, name, 95 + i * 175, y, height));
        names.forEach((name, i) => { ctx.font = '10px monospace'; ctx.fillStyle = '#2a2418'; ctx.fillText(name, 20 + i * 175, y + 14); });
      });
    }
    return canvas.toDataURL('image/png');
  }, { kind, ANCHOR, SCALE });
}

const app = createClassroom({ playerCount: 5, seed: 'art-measure-plates' }), port = await app.listen(0, '127.0.0.1');
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const shots = {};
  for (const when of ['before', 'after']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
    if (when === 'before') await page.route('**/assets/frontier-v1/atlas.json', route => route.fulfill({ body: beforeAtlas, contentType: 'application/json' }));
    await page.goto(`http://127.0.0.1:${port}`);
    shots[when] = { anchor: await draw(page, 'anchor'), scale: await draw(page, 'scale') };
    await page.close();
  }
  mkdirSync('docs/evidence', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
  for (const kind of ['anchor', 'scale']) {
    await page.setContent(`<body style="margin:0;background:#f2ead6;font:15px sans-serif"><div id="plate" style="display:inline-flex;gap:12px;padding:10px">
      ${['before', 'after'].map(when => `<div><div style="padding:4px 0 6px"><b>${when === 'before' ? `Before (${beforeRef})` : 'After (art-measure)'}</b></div><img src="${shots[when][kind]}"></div>`).join('')}</div></body>`);
    await page.locator('#plate').screenshot({ path: `docs/evidence/art-measure-${kind}.png` });
  }
  console.log('wrote docs/evidence/art-measure-anchor.png and docs/evidence/art-measure-scale.png');
} finally { await browser?.close(); await app.close(); }
