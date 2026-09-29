// The one browser the Claude art is rasterised in: the Playwright/Chrome the browser proofs use (PLAYWRIGHT_MODULE and
// BROWSER_EXECUTABLE, as HANDOFF.md's proof commands set them; a plain `playwright` install also works). No rasteriser
// dependency is added: an SVG is inlined in a page and screenshotted with a transparent background.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// The owner's machine's Playwright and Chrome (HANDOFF.md's proof commands), used only when the environment names none and
// they are there, so a builder can run the art scripts without setting two variables first.
const KNOWN_PLAYWRIGHT = join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright');
const KNOWN_CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export async function withBrowser(work) {
  const require = createRequire(import.meta.url);
  const module = process.env.PLAYWRIGHT_MODULE || (existsSync(KNOWN_PLAYWRIGHT) ? KNOWN_PLAYWRIGHT : 'playwright');
  const executablePath = process.env.BROWSER_EXECUTABLE || (existsSync(KNOWN_CHROME) ? KNOWN_CHROME : undefined);
  const { chromium } = require(module);
  const browser = await chromium.launch({ headless: true, ...(executablePath && { executablePath }) });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    return await work(page, browser);
  } finally { await browser.close(); }
}

/** Screenshot `html` at width by height with a transparent ground; returns the PNG bytes (and writes `path` if given). */
export async function shoot(page, html, width, height, path, { transparent = true } = {}) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map(image => image.complete ? null : new Promise(done => { image.onload = image.onerror = done; }))));
  await page.waitForTimeout(30);
  return page.screenshot({ ...(path && { path }), omitBackground: transparent, clip: { x: 0, y: 0, width, height }, type: 'png' });
}
