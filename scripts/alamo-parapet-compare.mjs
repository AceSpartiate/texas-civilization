// The Alamo's garrison over its parapets, before and after, drawn by the page's own modules with Astra's sheets in a real
// browser: the north, west and south walls (with the palisade) on Feb. 25, the huts burning and every wall firing, each at three
// cameras - the compound framed whole as Watch frames it at 1366 (about 2,500 pixels a mile), closer, and closest - with the
// figure size the map gives each (public/app.js: PERSON_MILES of ground, at most 150). Run it in a tree of the code before the
// change and in the tree after, each writing its own sheet:
//
//   node scripts/alamo-parapet-compare.mjs <label>   -> test-results/alamo-parapet-<label>.png
//
// Same computer, the standard Playwright environment (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE). Nothing is asserted: it is a picture.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { phaseOffset, projectBattle } from '../sim/battle-stage.mjs';
import { ALAMO } from '../sim/battles/alamo.mjs';

const label = process.argv[2] || 'after';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const world = minute => ({ minute, map: { sites: { bexar: { x: 0, y: 0 } } }, battles: { alamo: { id: 'alamo', start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } });
const battle = projectBattle(world(phaseOffset(ALAMO, 'huts') + 30), 'alamo', {});
const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const WANTED = /^(volunteer|regular|smoke|musket|muzzle|alamo-|cannon|canister|travis|lancer|dragoon|bexar-|san-fernando)/;
const sheets = [...new Set(Object.entries(atlas.frames).filter(([name]) => WANTED.test(name)).map(([, frame]) => frame.sheet))];

const app = createClassroom({ seed: 'alamo-parapet-compare', playerCount: 5 }), port = await app.listen(0, '127.0.0.1');
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const shown = await page.evaluate(async ({ battle, sheets, label }) => {
    const art = await import('/art.js');
    const { createBattleView } = await import('/battle-view.js');
    const { bexarDrawables, drawBexarGround } = await import('/bexar-art.js');
    const { alamoOnMap, bexarToSite } = await import('/bexar-layout.js');
    await art.loadArt({ sheets });
    const wrap = { animated: (ctx, clip, x, y, size, seed, o = {}) => art.drawClip(ctx, clip, x, y, size, { timeMs: o.timeMs ?? 0, flip: o.flip }), drawSprite: art.drawSprite, miniPerson: () => {}, clipReady: art.clipReady };
    const root = document.createElement('section');
    root.style.cssText = 'position:fixed;left:0;top:0;z-index:999999;background:#fff;display:grid;grid-template-columns:repeat(3,480px);gap:6px;padding:6px';
    document.body.append(root);
    const head = document.createElement('div');
    head.textContent = `The Alamo's garrison over its parapets, Feb. 25 (the huts burning): ${label}`;
    head.style.cssText = 'grid-column:1/-1;font:15px Georgia;padding:2px 4px';
    root.append(head);
    const panel = title => {
      const box = document.createElement('div'), c = document.createElement('canvas'), h = document.createElement('div');
      c.width = 480; c.height = 300; h.textContent = title; h.style.cssText = 'font:13px Georgia;padding:2px 4px';
      box.append(h, c); root.append(box);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, 480, 300); return ctx;
    };
    const group = id => battle.groups.find(g => g.id === id);
    const between = (a, b) => ({ x: (group(a).x + group(b).x) / 2, y: (group(a).y + group(b).y) / 2 });
    const views = [['the north wall', group('north'), 60], ['the west wall', group('west'), 0], ['the low barrack and the palisade', between('south', 'palisade'), -40]];
    const out = {};
    for (const [name, centre, down] of views) for (const [scale, title] of [[2500, 'as Watch frames it'], [4000, 'closer'], [7000, 'closest']]) {
      const ctx = panel(`${name}, ${title} (${scale} px a mile)`);
      const figure = Math.max(7, Math.min(150, scale * 0.019));
      const camera = { scale, figure, toScreen: p => ({ x: 240 + (p.x - centre.x) * scale, y: 150 + down + (p.y - centre.y) * scale }) };
      // Each frame on the compound drawn afresh, so the last frame is a frame and not every pose of the run laid over each other.
      const view = createBattleView(wrap); let seen;
      for (let t = 0; t <= 9000; t += 250) {
        ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, 480, 300);
        drawBexarGround(ctx, p => camera.toScreen(bexarToSite(p)), scale / 5280, { river: false });
        const items = bexarDrawables(ctx, p => camera.toScreen(bexarToSite(p)), scale / 5280, { alamoProject: p => camera.toScreen(alamoOnMap(p)) });
        items.sort((a, b) => a.y - b.y).forEach(item => item.draw());
        seen = view.draw(ctx, battle, { camera, time: t, now: t, tickMs: 1000, bounds: { width: 480, height: 300 } });
      }
      out[`${name}@${scale}`] = seen.parapet || null;
    }
    return out;
  }, { battle, sheets, label });
  mkdirSync('test-results', { recursive: true });
  await page.locator('section').last().screenshot({ path: `test-results/alamo-parapet-${label}.png` });
  console.log(JSON.stringify({ label, shown, errors }, null, 1));
} finally { await browser?.close(); await app.close(); }
