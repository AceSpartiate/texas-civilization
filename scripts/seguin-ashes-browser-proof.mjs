// Art-integration storyboard, not a postwar gameplay trigger.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 5 });
const port = await app.listen(0, '127.0.0.1');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`http://127.0.0.1:${port}/`);
  mkdirSync('docs/evidence', { recursive: true });
  for (const mode of ['gather', 'honors', 'church-claim', 'discovery']) {
    const result = await page.evaluate(async mode => {
      const art = await import('/art.js');
      await art.loadArt({ sheets: ['famous-seguin-ashes', 'alamo-ash-sites-1837', 'seguin-funeral-props', 'san-fernando-1936'] });
      document.querySelector('#ashes-proof')?.remove();
      const canvas = document.createElement('canvas'); canvas.id = 'ashes-proof'; canvas.width = 1200; canvas.height = 700;
      canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:1200px;height:700px';
      document.body.append(canvas);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = mode === 'discovery' || mode === 'church-claim' ? '#b7a47e' : '#9ea76d';
      ctx.fillRect(0, 0, 1200, 700);
      let caption, claim;
      if (mode === 'gather') {
        art.drawSprite(ctx, 'ash-site-small-a', 300, 470, 170);
        art.drawSprite(ctx, 'ash-site-large', 860, 550, 240);
        art.drawClip(ctx, 'seguin-ashes-collect', 520, 480, 260, { timeMs: 2200 });
        caption = 'Seguín gathers ashes at one of three sites'; claim = 'Gathering documented · solitary gesture dramatized';
      } else if (mode === 'honors') {
        art.drawSprite(ctx, 'funeral-coffin-honors', 600, 520, 350);
        art.drawSprite(ctx, 'seguin-ashes-rise', 900, 550, 230);
        caption = 'The black-covered coffin receives public military honors'; claim = 'Documented 1837 funeral';
      } else if (mode === 'church-claim') {
        art.drawSprite(ctx, 'funeral-coffin-church-floor', 600, 570, 440);
        caption = 'Seguín later recalled a grave inside San Fernando'; claim = 'Later account · conflicts with earlier outdoor interment account';
      } else {
        art.drawSprite(ctx, 'san-fernando-box-found', 420, 550, 365);
        art.drawSprite(ctx, 'san-fernando-marble-memorial', 900, 560, 350);
        caption = 'A box was found in 1936; a marble memorial came later'; claim = 'Identity of the remains disputed';
      }
      ctx.fillStyle = 'rgba(29,35,29,.9)'; ctx.fillRect(0, 0, 1200, 94);
      ctx.fillStyle = '#f5f0df'; ctx.font = 'bold 27px Georgia'; ctx.fillText(caption, 34, 40);
      ctx.font = '18px system-ui'; ctx.fillText(claim, 35, 72);
      const clip = art.clipInfo('seguin-ashes-collect');
      return { loaded: art.hasSprite('seguin-ashes-rise'), clip: art.clipReady('seguin-ashes-collect'),
        first: art.sampleClip(clip, 0)?.sprite, middle: art.sampleClip(clip, 2200)?.sprite, last: art.sampleClip(clip, 9000)?.sprite };
    }, mode);
    assert.ok(result.loaded && result.clip);
    assert.equal(result.first, 'seguin-ashes-stand');
    assert.equal(result.middle, 'seguin-ashes-gather');
    assert.equal(result.last, 'seguin-ashes-rise');
    await page.locator('#ashes-proof').screenshot({ path: `docs/evidence/seguin-ashes-${mode}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: Seguín collection, public funeral, later church account and disputed 1936 discovery art rendered');
} finally {
  await browser.close();
  await app.close();
}
