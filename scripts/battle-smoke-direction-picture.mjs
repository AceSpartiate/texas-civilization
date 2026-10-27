// Which way the smoke goes, as a picture (owner, 2026-10-27: "smoke plumes from gunfire: do they go in the right direction?
// always?"; docs/BATTLES.md §17.1). Drawn by the page's own battle renderer with the library's and Astra's sheets in a real
// browser: a line firing north, one firing south, one firing east, a man in each face of a square (north, east, south, west), a gun
// laid north, and Travis at the north battery - each after fifteen seconds of its own firing on a still day, the enemy off the top,
// bottom or right of the panel as marked. Run it in a tree of the code before the change and in the tree after:
//
//   node scripts/battle-smoke-direction-picture.mjs <label>   -> docs/evidence/battle-see/smoke-direction-<label>.png
//
// Same computer, the standard Playwright environment (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE). Nothing is asserted: it is a picture.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';

const label = process.argv[2] || 'after';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const WANTED = /^(volunteer|regular|smoke|muzzle|cannon|travis)/;
const sheets = [...new Set(Object.entries(atlas.frames).filter(([name]) => WANTED.test(name)).map(([, frame]) => frame.sheet))];

const app = createClassroom({ seed: 'smoke-direction-picture', playerCount: 5 }), port = await app.listen(0, '127.0.0.1');
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1400, height: 760 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.evaluate(async ({ sheets, label }) => {
    const art = await import('/art.js');
    const { createBattleView } = await import('/battle-view.js');
    await art.loadArt({ sheets });
    const wrap = { animated: (ctx, clip, x, y, size, seed, o = {}) => art.drawClip(ctx, clip, x, y, size, { timeMs: o.timeMs ?? 0, flip: o.flip }), drawSprite: art.drawSprite, miniPerson: () => {}, clipReady: art.clipReady };
    const root = document.createElement('section');
    root.id = 'sheet';
    root.style.cssText = 'position:fixed;left:0;top:0;z-index:999999;background:#fff;display:grid;grid-template-columns:repeat(3,452px);gap:6px;padding:6px;font:13px system-ui';
    document.body.append(root);
    const W = 452, H = 330, scale = 1500;
    const camera = { toScreen: p => ({ x: W / 2 + p.x * scale, y: H / 2 + 30 + p.y * scale }), figure: scale * 0.019, scale };
    const base = minute => ({ id: 'picture', phase: 'fight', minute, caption: '', live: true, over: false, lines: [], fallen: [], members: [], commands: null, formations: [] });
    const quiet = { side: 'mexican', name: 'mexican', count: 10, drawn: 1, style: 'ranks', fire: 'none', action: 'stand', moving: false, x: 5, y: 5, facing: { x: -1, y: 0 } };
    const line = facing => ({ side: 'texian', name: 'texian', count: 60, drawn: 7, style: 'loose', fire: 'scattered', action: 'stand', moving: false, x: 0, y: 0, facing, spread: { width: 0.16, depth: 0.04 } });
    const panels = [
      ['A line firing NORTH (the enemy above)', minute => ({ ...base(minute), sides: [line({ x: 0, y: -1 }), quiet] }), 'n'],
      ['A line firing SOUTH (the enemy below)', minute => ({ ...base(minute), sides: [line({ x: 0, y: 1 }), quiet] }), 's'],
      ['A line firing EAST (the enemy to the right)', minute => ({ ...base(minute), sides: [line({ x: 1, y: 0 }), quiet] }), 'e'],
      ['A square firing out of all four faces', minute => ({ ...base(minute), sides: [{ side: 'texian', name: 'texian', count: 300, drawn: 24, style: 'square', fire: 'volley', action: 'stand', moving: false, x: 0, y: -0.01, facing: { x: 1, y: 0 } }, quiet] }), 'all'],
      ['A gun laid NORTH (the enemy above)', minute => ({ ...base(minute), sides: [{ ...line({ x: 0, y: -1 }), drawn: 1, fire: 'none' }, quiet], guns: [{ id: 'g', side: 'texian', x: 0, y: 0.02, facing: { x: 0, y: -1 }, metal: 'iron', crew: 3, shots: minute >= 1 ? [1, 9] : [] }] }), 'n'],
      ['Travis at the north battery, firing NORTH', minute => ({ ...base(minute), sides: [{ ...line({ x: 0, y: -1 }), drawn: 1, fire: 'none', x: 2 }, quiet], people: [{ id: 'travis', name: 'Travis', side: 'texian', art: 'travis', pose: 'fire', x: 0, y: 0, right: true, aimHeading: 'north' }] }), 'n'],
    ];
    for (const [title, make, way] of panels) {
      const box = document.createElement('figure');
      box.style.cssText = 'margin:0';
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d'), view = createBattleView(wrap);
      for (let t = 0; t <= 15000; t += 1000 / 30) {
        ctx.fillStyle = '#8fa86a'; ctx.fillRect(0, 0, W, H);
        view.draw(ctx, make(Math.floor(t / 1000)), { camera, time: t, now: t, tickMs: 1000, bounds: { width: W, height: H } });
      }
      // Where the enemy is.
      ctx.fillStyle = '#7a1f1f'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      const marks = { n: [[W / 2, 18, '▲ enemy']], s: [[W / 2, H - 8, '▼ enemy']], e: [[W - 40, H / 2, 'enemy ▶']], all: [[W / 2, 18, '▲'], [W / 2, H - 8, '▼'], [W - 14, H / 2, '▶'], [14, H / 2, '◀']] }[way];
      for (const [x, y, text] of marks) ctx.fillText(text, x, y);
      const caption = document.createElement('figcaption');
      caption.textContent = `${label}: ${title}`;
      box.append(canvas, caption);
      root.append(box);
    }
  }, { sheets, label });
  mkdirSync('docs/evidence/battle-see', { recursive: true });
  await page.locator('#sheet').screenshot({ path: `docs/evidence/battle-see/smoke-direction-${label}.png` });
  if (errors.length) console.error(errors.join('\n'));
  console.log(`docs/evidence/battle-see/smoke-direction-${label}.png`);
} finally {
  await browser?.close();
  await app.close?.();
  process.exit(0);
}
