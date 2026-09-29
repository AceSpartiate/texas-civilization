// Screenshots of the story cards at the head of the family's column (owner, 2026-09-29), for the owner: a lone parent on arrival with
// both cards, at 1366x768, 1024x600 and a 400 px phone. Not a gate - `npm run test:overlap` is - just the pictures, and what the column
// did at each size (`docs/evidence/story-cards-column-*.png`).
//
// Run: node scripts/story-cards-shots.mjs (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as the proofs).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { familyRoll } from '../sim/family.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { startClassroom, openClass } from './support/panel-states.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SEED = (() => { for (let n = 0; n < 100000; n++) if (familyRoll(`overlap-lone-${n}`, 'hh-1') === 3) return `overlap-lone-${n}`; throw new Error('no seed'); })();
function lonely(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  rollFamily(world, world.households['hh-1']);
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.arriving) && guard++ < 800) stepWorld(world);
  const household = world.households['hh-1'];
  if (household.choosingSite) chooseSite(world, household, world.map.sites[household.homeSiteId]);
  while (household.arriving && guard++ < 1200) stepWorld(world);
  world.status = 'lobby';
  return world;
}
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const room = await startClassroom(lonely, SEED);
const seen = {};
try {
  const { page, context } = await openClass(room.app, browser, { width: 1366, height: 768 }, room);
  await page.locator('#house-card').waitFor({ state: 'visible', timeout: 30000 });
  for (let i = 0; i < 4; i++) { if (await page.locator('#tip:not([hidden]) .tip-close').isVisible()) await page.locator('#tip .tip-close').click(); await page.waitForTimeout(200); }
  for (const size of [{ width: 1366, height: 768 }, { width: 1024, height: 600 }, { width: 400, height: 780 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(700);
    const at = `${size.width}x${size.height}`;
    seen[at] = await page.evaluate(() => {
      const panel = document.querySelector('#family-panel'), box = one => { const r = document.querySelector(one).getBoundingClientRect(); const p = panel.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), inView: r.top >= p.top - 1 && r.bottom <= p.bottom + 1 }; };
      const w = one => Math.round(document.querySelector(one).getBoundingClientRect().width);
      return { widths: { panel: w('#family-panel'), cards: w('#family-cards'), ask: w('#ask-neighbours'), house: w('#house-card') }, tight: panel.dataset.tight, short: panel.dataset.short || 'false', fold: box('#family-collapse'), ask: box('#ask-neighbours'), house: box('#house-card'), rows: box('#family-rows') };
    });
    await page.screenshot({ path: `docs/evidence/story-cards-column-${at}.png` });
  }
  await context.close();
} finally { await room.app.close(); await browser.close(); }
writeFileSync('docs/evidence/story-cards-column.json', `${JSON.stringify({ when: new Date().toISOString(), seen }, null, 2)}\n`);
console.log(JSON.stringify(seen, null, 1));
