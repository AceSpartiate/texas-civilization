// Batch W of docs/ART_PLAN_LOCAL_2026-10-25.md, before and after, drawn by the page's own modules with Astra's sheets in a real
// browser: the Alamo's garrison on its north wall, Concepción's retreat and the priest's carts after it, a dragoon's shot in the
// chase, the saddlebag house's double chimney and a pen's puncheon floor, and a baby in the arms of the baseline caregiver on the
// horse. The family wagon's open cover is shown by test:means (`means-rich-arrival-1366.png`), since it is drawn inside
// public/app.js. Run it in a tree of the code before the change and in the tree after, each writing its own sheet:
//
//   node scripts/batch-w-compare.mjs <label>   -> test-results/batch-w-<label>.png
//
// Same computer, the standard Playwright environment (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE). Nothing is asserted: it is a picture.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { phaseOffset, projectBattle } from '../sim/battle-stage.mjs';
import { ALAMO } from '../sim/battles/alamo.mjs';
import { CONCEPCION } from '../sim/battles/concepcion.mjs';
import { plotCatalogue } from '../sim/houseplot.mjs';

const label = process.argv[2] || 'after';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const world = (id, minute) => ({ minute, map: { sites: { bexar: { x: 0, y: 0 } } }, battles: { [id]: { id, start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } });
const battleAt = (def, phase, into) => projectBattle(world(def.id, phaseOffset(def, phase) + into), def.id, {});
const ground = CONCEPCION.ground(world('concepcion', 0));
const scenes = {
  alamo: battleAt(ALAMO, 'huts', 30),
  retreat: battleAt(CONCEPCION, 'retreat', 6),
  carts: battleAt(CONCEPCION, 'main-army', 8),
  centres: { retreat: { x: (ground.line.x + ground.ford.x) / 2, y: (ground.line.y + ground.ford.y) / 2 }, carts: { x: (ground.ford.x + ground.line.x) / 2, y: ground.ford.y + (ground.line.y - ground.ford.y) * 0.45 } },
};
const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const WANTED = /^(house-|volunteer|regular|limber-mules|padre|casualty-cart|dragoon|infant-with|indigo-ride|mounted|horse|smoke|musket|muzzle|alamo-)/;
const sheets = [...new Set(Object.entries(atlas.frames).filter(([name]) => WANTED.test(name)).map(([, frame]) => frame.sheet))];

const app = createClassroom({ seed: 'batch-w-compare', playerCount: 5 }), port = await app.listen(0, '127.0.0.1');
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const shown = await page.evaluate(async ({ scenes, sheets, catalogue }) => {
    const art = await import('/art.js'), motion = await import('/motion.js');
    const { createBattleView } = await import('/battle-view.js'), { createChaseView } = await import('/chase-view.js');
    const { drawHousePlot } = await import('/house-plot.js'), { bexarDrawables, drawBexarGround } = await import('/bexar-art.js');
    const { alamoOnMap, bexarToSite } = await import('/bexar-layout.js');
    await art.loadArt({ sheets });
    const wrap = { animated: (ctx, clip, x, y, size, seed, o = {}) => art.drawClip(ctx, clip, x, y, size, { timeMs: o.timeMs ?? 0, flip: o.flip }), drawSprite: art.drawSprite, miniPerson: () => {}, clipReady: art.clipReady };
    const root = document.createElement('section');
    root.style.cssText = 'position:fixed;left:0;top:0;z-index:999999;background:#fff;display:grid;grid-template-columns:repeat(3,480px);gap:6px;padding:6px';
    document.body.append(root);
    const panel = title => {
      const box = document.createElement('div'), c = document.createElement('canvas'), h = document.createElement('div');
      c.width = 480; c.height = 300; h.textContent = title; h.style.cssText = 'font:13px Georgia;padding:2px 4px';
      box.append(h, c); root.append(box);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, 480, 300); return ctx;
    };
    const out = {};
    // The Alamo's north wall at the repulse: the compound drawn as the map draws it, then the garrison over it.
    {
      const ctx = panel('The Alamo, the north wall (the huts burned, Feb. 25)'), north = scenes.alamo.groups.find(g => g.id === 'north');
      const scale = 7000, camera = { scale, figure: 46, toScreen: p => ({ x: 240 + (p.x - north.x) * scale, y: 190 + (p.y - north.y) * scale }) };
      const project = p => { const o = bexarToSite(p); return camera.toScreen(o); };
      drawBexarGround(ctx, project, scale / 5280, { river: false });
      const items = bexarDrawables(ctx, project, scale / 5280, { alamoProject: p => camera.toScreen(alamoOnMap(p)) });
      items.sort((a, b) => a.y - b.y).forEach(item => item.draw());
      const view = createBattleView(wrap); let seen;
      for (let t = 0; t <= 9000; t += 250) seen = view.draw(ctx, scenes.alamo, { camera, time: t, now: t, tickMs: 1000, bounds: { width: 480, height: 300 } });
      out.alamo = seen.parapet || null;
    }
    // Concepción: the retreat, and the priest's carts coming down from the ford after.
    for (const [key, title] of [['retreat', 'Concepción, the retreat'], ['carts', 'Concepción, the army comes up']]) {
      const ctx = panel(title), centre = scenes.centres[key];
      const scale = 1600, camera = { scale, figure: 52, toScreen: p => ({ x: 240 + (p.x - centre.x) * scale, y: 150 + (p.y - centre.y) * scale }) };
      const view = createBattleView(wrap); let seen;
      for (let t = 0; t <= 1200; t += 100) seen = view.draw(ctx, scenes[key], { camera, time: t, now: t, tickMs: 1000, bounds: { width: 480, height: 300 } });
      out[key] = seen.groups;
    }
    // The chase: a dragoon's shot, at the recoil.
    {
      const ctx = panel('The chase: a dragoon fires'), view = createChaseView(wrap);
      const camera = { scale: 4000, figure: 60, toScreen: p => ({ x: 20 + p.x * 4000, y: 230 + p.y * 4000 }) };
      const base = { id: 'chase-1', kind: 'cavalry', men: 2, phase: 'seen', x: 0, y: 0, dir: { x: 1, y: 0 }, lines: [] };
      view.draw(ctx, [{ ...base, minute: 10, soldiers: [{ g: 120 }, { g: 120 }], shots: [] }], { camera, now: 0, time: 0, tickMs: 1000 });
      const shotAt = 1000 + 450;
      ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, 480, 300);
      for (let now = 1000; now <= shotAt + 60; now += 20) { ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, 480, 300); out.chase = view.draw(ctx, [{ ...base, minute: 12, soldiers: [{ g: 110 }, { g: 110 }], shots: [{ n: 1, man: 1, minute: 11, hit: false, yards: 110 }] }], { camera, now, time: now, tickMs: 1000 }).fireClips || []; }
    }
    // The saddlebag house finished, and a round-log pen at its low walls with a puncheon floor laid.
    {
      const ctx = panel('The saddlebag; a pen with its floor');
      const plan = id => catalogue.plans.find(p => p.id === id).pieces.map(([type, x, y]) => { const kind = catalogue.pieces.find(k => k.id === type); return [type, x, y, kind.stageCount, 0]; });
      drawHousePlot(ctx, 150, 250, 62, { house: { pieces: plan('saddlebag') } }, catalogue, art.drawSprite, art.spriteFrame);
      const cabin = catalogue.plans.find(p => p.id === 'round-log').pieces.map(([type, x, y]) => { const kind = catalogue.pieces.find(k => k.id === type); return [type, x, y, kind.pen ? 4 : 0, 0]; });
      const pen = cabin.find(([type]) => type.startsWith('pen-'));
      cabin.push(['floor', pen[1], pen[2], catalogue.pieces.find(k => k.id === 'floor').stageCount, 0]);
      drawHousePlot(ctx, 370, 250, 62, { house: { pieces: cabin.filter(([type]) => !type.startsWith('chimney')) } }, catalogue, art.drawSprite, art.spriteFrame);
    }
    // A baby in the arms of the baseline indigo caregiver on the horse.
    {
      const ctx = panel('A baby in her arms on the horse');
      const id = Array.from({ length: 40 }, (_, i) => `hh-1-p${i}`).find(id => motion.figureOf({ kind: 'person', sex: 'female', band: 'adult', id }) === 'indigo');
      const road = { points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], progress: 0 };
      const rider = { kind: 'person', id, householdId: 'hh-1', sex: 'female', band: 'adult', travel: { mode: 'foot', saddle: true, rides: 'hh-1-horse', ...road } };
      const entities = [rider, { kind: 'person', id: 'hh-1-baby', householdId: 'hh-1', band: 'infant', age: 0.5, travel: { saddle: true, rides: 'hh-1-horse', carried: id } }, { kind: 'animal', id: 'hh-1-horse', householdId: 'hh-1', species: 'horse' }];
      const paired = motion.mountedInfantClip?.(rider, entities), clip = paired && art.clipReady(paired.id) ? paired : motion.seatedClip(rider, 'e', 'horse');
      art.drawClip(ctx, clip.id, 240, 270, 40 * motion.MOUNTED_HEIGHT * 2.6, { timeMs: 0 });
      out.rider = clip.id;
    }
    return out;
  }, { scenes, sheets, catalogue: plotCatalogue() });
  mkdirSync('test-results', { recursive: true });
  await page.locator('section').last().screenshot({ path: `test-results/batch-w-${label}.png` });
  console.log(JSON.stringify({ label, shown, errors }, null, 1));
} finally { await browser?.close(); await app.close(); }
