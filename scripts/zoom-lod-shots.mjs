// The same spot on the map at many zooms, for looking at what appears, vanishes or changes shape as a student zooms
// (docs/PERFORMANCE_RENDER.md, "Zoom"). Owner, 2026-09-17: "Rivers and forests pop in and out of their places during zoom.
// their shapes and sizes change too."
//
// A solo game of the colonies; the camera goes to the family's land and zooms out one wheel step at a time with the pointer
// held on the middle of the map, so the ground under it stays put. Each step is photographed; contact sheets tile them in
// order, and a close pair of sheets shows each band change. People and shapes the server moves are part of the picture.
//
// Same computer, headless Chrome. Run: node scripts/zoom-lod-shots.mjs --label before [--steps 52] [--at home|gonzales]
//   writes docs/evidence/zoom-lod-<label>-sheet-<n>.png and docs/evidence/zoom-lod-<label>.json
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// `--root <dir>` measures another copy of the game (an export of an earlier commit) with this script, for a before and after.
const rootArg = process.argv.indexOf('--root');
const root = rootArg > 0 ? pathToFileURL(`${resolve(process.argv[rootArg + 1])}/`).href : new URL('../', import.meta.url).href;
const { createClassroom } = await import(new URL('server/app.mjs', root).href);
const { createGonzalesWorld } = await import(new URL('sim/gonzales.mjs', root).href);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const LABEL = arg('label', 'run'), STEPS = Number(arg('steps', 60)), AT = arg('at', 'home'), PER_SHEET = Number(arg('sheet', 12));
// `--only 10,12` keeps just those steps, at full size, for a close look at a band change.
const ONLY = arg('only', null)?.split(',').map(Number);

// A world that does not move while it is photographed: the class is paused once the page has it.
// Every solo game is dealt on the same seed, so a before and an after look at the same family on the same ground.
const app = createClassroom({ seed: 'perf-render-1', playerCount: 15, tickMs: 1000, solo: true, worldFactory: (seed, n) => createGonzalesWorld('perf-render-1', n, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shots = [];
try {
  const game = app.newSoloGame('Zoom reader');
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url + game.path);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && window.__snapshot.world.map?.province, null, { timeout: 60000 });
  for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip']) if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
  await page.waitForTimeout(4000);
  app.state.world.status = 'paused';
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'paused', null, { timeout: 30000 }).catch(() => {});
  await page.locator(`#map-nav [data-view="${AT}"]`).click();
  const box = await page.locator('#world-map').boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(centre.x, centre.y);
  // In to the closest the map allows, then out one step at a time.
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(30); }
  let lastScale = null;
  for (let step = 0; step < STEPS; step++) {
    // Let tiles and art that the new view asked for arrive, as a student waiting a moment would see them.
    await page.waitForTimeout(700);
    await page.waitForLoadState('networkidle').catch(() => {});
    const scale = await page.evaluate(() => window.__camera?.scale);
    if (scale === lastScale && step) break;
    lastScale = scale;
    // The map's own pixels, without the panels laid over it.
    const png = await page.locator('#world-map').evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]);
    shots.push({ step, scale: Math.round(scale * 10) / 10, png });
    await page.mouse.wheel(0, 100);
  }
  if (ONLY) {
    mkdirSync('docs/evidence', { recursive: true });
    for (const shot of shots.filter(one => ONLY.includes(one.step))) writeFileSync(`docs/evidence/zoom-lod-${LABEL}-step-${shot.step}.png`, Buffer.from(shot.png, 'base64'));
  }
  // Contact sheets, in order, the scale under each.
  mkdirSync('docs/evidence', { recursive: true });
  const sheet = await context.newPage();
  const sheets = [];
  for (let s = 0; s * PER_SHEET < shots.length; s++) {
    const part = shots.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
    await sheet.setViewportSize({ width: 1646, height: 400 });
    await sheet.setContent(`<body style="margin:0;background:#222;color:#eee;font:13px system-ui;display:grid;grid-template-columns:repeat(4,410px);align-content:start;gap:2px">${part.map(shot => `<figure style="margin:0;position:relative"><img style="width:410px;display:block" src="data:image/png;base64,${shot.png}"><figcaption style="position:absolute;left:4px;top:2px;background:#000a;padding:1px 4px">step ${shot.step} · scale ${shot.scale}</figcaption></figure>`).join('')}</body>`);
    const path = `docs/evidence/zoom-lod-${LABEL}-sheet-${s + 1}.png`;
    await sheet.screenshot({ path, fullPage: true });
    sheets.push(path);
  }
  writeFileSync(`docs/evidence/zoom-lod-${LABEL}.json`, `${JSON.stringify({ record: 'zoom-lod', label: LABEL, date: new Date().toISOString().slice(0, 10), at: AT, browser: await browser.version(), scales: shots.map(shot => shot.scale), sheets }, null, 2)}\n`);
  console.log(sheets.join('\n'));
} finally {
  await browser.close();
  await app.close();
}
