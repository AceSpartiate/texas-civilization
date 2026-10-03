// Visual proof of the shared age-aware avatar path at world scale and in portraits.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app = createClassroom({ playerCount: 5, seed: 'age-art-proof' });
const port = await app.listen(0, '127.0.0.1');
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 650 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}`);
  const proof = await page.evaluate(async () => {
    const { loadArt } = await import('/art.js');
    const { drawAvatar, drawAvatarPortrait, avatarVariant } = await import('/avatar-art.js');
    const { figureScale } = await import('/motion.js');
    await loadArt({ sheets: ['people-children-idle', 'people-family-youth-boy', 'people-family-youth-girl', 'people-family-father-hat', 'people-family-mother-scarf'] });
    const canvas = document.createElement('canvas');
    canvas.id = 'age-art-proof'; canvas.width = 1440; canvas.height = 560;
    canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:999;background:#f4ead2';
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#493824'; ctx.font = 'bold 25px Georgia';
    ctx.fillText('One family palette, age-appropriate bodies', 35, 43);
    ctx.font = '15px system-ui'; ctx.fillText('The same avatar renderer supplies world figures and family portraits.', 35, 70);
    const cases = [
      ['Infant', 'infant', 'female', 1], ['Toddler', 'small', 'male', 3],
      ['Girl', 'child', 'female', 7], ['Boy', 'child', 'male', 7],
      ['Teen girl', 'youth', 'female', 13], ['Teen boy', 'youth', 'male', 13],
      ['Mom', 'adult', 'female', 35], ['Dad', 'adult', 'male', 35],
      ['Child / darker palette', 'child', 'female', 7],
    ];
    return cases.map(([label, band, sex, age], i) => {
      const person = { id: `proof-${i}`, kind: 'person', band, sex, age };
      const appearance = { skin: i === 8 ? 'deep brown' : 'olive', hair: i === 8 ? 'black' : 'chestnut', clothing: 'forest', head: sex === 'female' ? 'headscarf' : 'hat' };
      const x = 80 + i * 159;
      const height = 215 * figureScale(person);
      const drawn = drawAvatar(ctx, x, 334, height, appearance, sex, { person });
      ctx.fillStyle = '#493824'; ctx.textAlign = 'center'; ctx.font = '14px system-ui';
      ctx.fillText(label, x, 360); ctx.fillText(`Age ${age}`, x, 382);
      const portrait = document.createElement('canvas'); portrait.width = portrait.height = 96;
      const portraitDrawn = drawAvatarPortrait(portrait, appearance, sex, person);
      ctx.drawImage(portrait, x - 48, 402);
      return { label, band, age, variant: avatarVariant(appearance, sex, person), height, drawn: Boolean(drawn), portraitDrawn };
    });
  });
  assert.ok(proof.every(one => one.drawn && one.portraitDrawn), 'an age-specific figure or portrait is missing');
  assert.deepEqual(proof.map(one => one.variant), ['infant', 'smallchild', 'girl', 'boy', 'youth-girl', 'youth-boy', 'mother-scarf', 'father-hat', 'girl']);
  assert.deepEqual(errors, []);
  mkdirSync('docs/evidence', { recursive: true });
  await page.locator('#age-art-proof').screenshot({ path: 'docs/evidence/family-age-art.png' });
  writeFileSync('docs/evidence/family-age-art.json', JSON.stringify({ verdict: 'PASS', cases: proof, errors }, null, 2) + '\n');
  console.log(`PASS: ${proof.length} age-specific world figures and portraits`);
} finally {
  await browser?.close();
  await app.close();
}
