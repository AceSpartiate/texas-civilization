// Render the actual Alamo aftermath projection with the actual battle renderer and atlas.
// The two screenshots show assembly at 3 p.m. and burning at 5 p.m.; sites are reconstructed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { ENGAGEMENTS, phaseOffset, projectBattle } from '../sim/battle-stage.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 5 });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const fieldAt = into => {
  const world = { minute: phaseOffset(ENGAGEMENTS.alamo, 'after') + into, map: { sites: { bexar: { x: -61.6, y: 4.6 } } }, battles: { alamo: { id: 'alamo', start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } };
  return projectBattle(world, 'alamo');
};
try {
  await page.goto(`http://127.0.0.1:${port}/`);
  mkdirSync('docs/evidence', { recursive: true });
  for (const [name, into] of [['assembled', 480], ['burning', 600]]) {
    const battle = fieldAt(into);
    assert.equal(battle.plumes.length, 3);
    const result = await page.evaluate(async battle => {
      const art = await import('/art.js');
      const { createBattleView } = await import('/battle-view.js');
      await art.loadArt({ sheets: ['alamo-funeral-pyre'] });
      const canvas = document.createElement('canvas');
      canvas.width = 1366; canvas.height = 768;
      canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:1366px;height:768px';
      document.body.append(canvas);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#9aa760'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const sites = battle.plumes;
      const cx = sites.reduce((sum, one) => sum + one.x, 0) / sites.length;
      const cy = sites.reduce((sum, one) => sum + one.y, 0) / sites.length;
      const camera = { figure: 22, scale: 1500, toScreen: one => ({ x: 683 + (one.x - cx) * 1500, y: 390 + (one.y - cy) * 1500 }) };
      const view = createBattleView({ drawSprite: art.drawSprite, animated: art.drawClip, miniPerson() {} });
      const drawn = view.draw(ctx, battle, { camera, time: 1320, now: 1320, tickMs: 1000, bounds: { width: canvas.width, height: canvas.height } });
      return { plumes: drawn?.plumes, loaded: art.hasSprite('alamo-pyre-unlit'), clip: art.clipReady('alamo-pyre-burning') };
    }, battle);
    assert.equal(result.plumes, 3);
    assert.ok(result.loaded && result.clip);
    await page.locator('canvas').last().screenshot({ path: `docs/evidence/alamo-pyres-${name}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: three separated Alamo pyres rendered assembled and burning at their projected afternoon times');
} finally {
  await browser.close();
  await app.close();
}
