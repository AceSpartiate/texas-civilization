// Two-pen houses at every turn, drawn by the page's own drawHousePlot with Astra's sheets in a real browser: a picture of how the
// rear walls sit (batch 2 of docs/ART_PLAN_LOCAL_2026-10-25.md: her rear full walls raised to the front's height, and a house of
// two pens no longer drawn from behind whole). Run it in a tree before the change and in the tree after:
//
//   node scripts/local-art/houses-compare.mjs <out.png>     (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the proofs)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../../server/app.mjs';
import { plotCatalogue } from '../../sim/houseplot.mjs';

const out = process.argv[2];
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const atlas = JSON.parse(readFileSync(new URL('../../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const sheets = [...new Set(Object.entries(atlas.frames).filter(([name]) => /^house-/.test(name)).map(([, frame]) => frame.sheet))];
const app = createClassroom({ seed: 'houses-compare', playerCount: 5 }), port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/landscape-art.js`);
  const png = await page.evaluate(async ({ sheets, catalogue }) => {
    const art = await import('/art.js'), { drawHousePlot } = await import('/house-plot.js');
    await art.loadArt({ sheets });
    const canvas = document.createElement('canvas'); canvas.width = 1360; canvas.height = 760;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#9fae78'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const plan = id => catalogue.plans.find(p => p.id === id).pieces.map(([type, x, y]) => [type, x, y, catalogue.pieces.find(k => k.id === type).stageCount, 0]);
    ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#222';
    ['dog-run', 'saddlebag'].forEach((id, row) => [0, 90, 180, 270].forEach((rotation, col) => {
      const x = 170 + col * 340, y = 300 + row * 370;
      ctx.fillText(`${id} ${rotation}°`, x - 150, y - 270);
      drawHousePlot(ctx, x, y, 80, { house: { pieces: plan(id) } }, catalogue, art.drawSprite, art.spriteFrame, { rotation });
    }));
    return canvas.toDataURL('image/png');
  }, { sheets, catalogue: plotCatalogue() });
  writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
  console.log(out);
} finally {
  await browser.close();
  process.exit(0);
}
