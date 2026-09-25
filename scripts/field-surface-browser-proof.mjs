import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClassroom } from '../server/app.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 5 });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  const page = await browser.newPage({ viewport: { width: 1260, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/field-surface.js`);
  await page.setContent('<style>body{margin:0;background:#243429}canvas{display:block}</style><canvas width="1260" height="900"></canvas>');
  const result = await page.evaluate(async inject => {
    const { drawFieldSurface: renderer } = await import('/field-surface.js');
    const drawFieldSurface = inject === 'blank' ? () => {} : renderer;
    const { loadArt, drawSprite } = await import('/art.js');
    await loadArt();
    const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
    ctx.fillStyle = '#243429'; ctx.fillRect(0, 0, 1260, 900);
    ctx.fillStyle = '#f2e4bf'; ctx.font = '28px Georgia'; ctx.fillText('Fields • earth, growth and harvest', 32, 43);
    ctx.fillStyle = '#b9c6aa'; ctx.font = '14px sans-serif'; ctx.fillText('Existing corn and cotton art on textured, irregular field beds. Surveyed acreage stays unchanged.', 32, 70);
    const cases = [
      { title: 'Turned earth', growing: null },
      { title: 'Young corn', growing: { crop: 'corn', state: 'planted' } },
      { title: 'Ripe corn', growing: { crop: 'corn', state: 'ripe' } },
      { title: 'Clearing in progress', clearing: true },
      { title: 'Young cotton', growing: { crop: 'cotton', state: 'planted' } },
      { title: 'Ripe cotton', growing: { crop: 'cotton', state: 'ripe' } },
    ];
    const samples = [];
    cases.forEach((item, i) => {
      const x = 25 + (i % 3) * 410, y = 96 + Math.floor(i / 3) * 395;
      ctx.fillStyle = '#768b57'; ctx.fillRect(x, y, 390, 345);
      // Context at the same scale: the small nature frames already used beside the fields.
      for (let j = 0; j < 18; j++) drawSprite(ctx, 'grass-tuft', x + 7 + (j * 67 % 375), y + 12 + (j * 113 % 325), 14);
      const bounds = { left: x + 45, top: y + 25, right: x + 345, bottom: y + 320 };
      drawFieldSurface(ctx, bounds, { identity: 'proof-plot', figure: 34, drawSprite, ...item });
      ctx.fillStyle = '#f2e4bf'; ctx.font = '19px Georgia'; ctx.fillText(item.title, x + 6, y + 374);
      const data = ctx.getImageData(x + 45, y + 25, 300, 295).data;
      let hash = 2166136261; for (const n of data) hash = Math.imul(hash ^ n, 16777619) >>> 0;
      samples.push({ title: item.title, hash });
    });
    // Real pixel comparisons catch a blank renderer, ignored crop state and unstable seeded detail.
    const testCanvas = document.createElement('canvas'); testCanvas.width = testCanvas.height = 300;
    const t = testCanvas.getContext('2d'), bounds = { left: 10, top: 10, right: 290, bottom: 290 };
    const pixels = () => {
      t.clearRect(0, 0, 300, 300); drawFieldSurface(t, bounds, { identity: 'repeat', figure: 30, drawSprite });
      return testCanvas.toDataURL();
    };
    const first = pixels(), stable = first === pixels();
    const calls = [];
    drawFieldSurface(t, bounds, { growing: null, drawSprite: (...args) => calls.push(args[1]) });
    const bareCalls = calls.length;
    drawFieldSurface(t, bounds, { growing: { crop: 'cotton', state: 'ripe' }, figure: 30, drawSprite: (...args) => calls.push(args[1]) });
    const cropNames = [...new Set(calls)];
    const tiny = document.createElement('canvas'); tiny.width = tiny.height = 16;
    drawFieldSurface(tiny.getContext('2d'), { left: 0, top: 0, right: 16, bottom: 16 });
    return { samples, stable, bareCalls, cropNames, tinyVisible: tiny.getContext('2d').getImageData(8, 8, 1, 1).data[3] > 0 };
  }, process.env.FIELD_SURFACE_INJECT || null);
  assert.equal(new Set(result.samples.map(s => s.hash)).size, 6, 'field stages look identical or are not drawn');
  assert.equal(result.stable, true, 'soil changes between identical redraws');
  assert.equal(result.bareCalls, 0, 'bare ground invents a crop');
  assert.deepEqual(result.cropNames, ['cotton-mature']);
  assert.equal(result.tinyVisible, true, 'field disappears at distant zoom');
  mkdirSync('docs/evidence', { recursive: true });
  await page.screenshot({ path: 'docs/evidence/field-surface-contact.png' });
  writeFileSync('docs/evidence/field-surface-browser.json', JSON.stringify({ result: 'PASS', ...result }, null, 2));
  console.log('PASS: six distinct field states, stable redraws, truthful crop sprites, distant visibility.');
} finally { await browser.close(); await app.close(); }
