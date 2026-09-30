// The join address shown large on the Host, with a QR code made on this computer (triage 1.8, 2026-09-29), in a real browser.
//
// In the lobby the Host's page shows the address to type, large, with the class code inside it (`/<code>`, owner 2026-09-30), and a
// QR code of that same address;
// the QR code on the page is the one public/qr.js makes for that text (tests/qr.test.mjs holds the encoder to an independent
// one). Once the class runs the card folds to one line that still says the address and the code, and opens again. A student
// who scans it lands on the join form with the class code already in, and the code is taken out of the address bar. No request
// leaves this computer: every request the Host's page makes is to the class's own server.
//
// Run: npm run test:join-card (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE as for every proof). Same computer only: no phone or
// Chromebook camera has read the code here.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { qrSvg } from '../public/qr.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
// Two addresses as server/deployment.mjs ranks them: the classroom's network first, a VPN's after. Only the port is real.
const joinUrls = [];
const app = createClassroom({ seed: 'join-card', playerCount: 5, tickMs: 1000, joinUrls });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
joinUrls.push({ label: 'Wi-Fi', address: '127.0.0.1', url: `${url}/` }, { label: 'NordLynx', address: '10.5.0.2', url: `http://10.5.0.2:${port}/` });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [], elsewhere = [];

let record = {};
try {
  const code = app.state.sessionCode;
  for (const [width, height] of [[1920, 1080], [1366, 768], [1024, 768]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(url) && !request.url().startsWith('data:')) elsewhere.push(request.url()); });
    await page.goto(`${url}/host#${app.state.hostKey}`);
    await page.locator('#join-card').waitFor({ state: 'visible', timeout: 15000 });
    const card = await page.evaluate(() => ({
      address: document.querySelector('#join-address').textContent, code: document.querySelector('#join-code').textContent,
      size: parseFloat(getComputedStyle(document.querySelector('#join-address')).fontSize), codeSize: parseFloat(getComputedStyle(document.querySelector('#join-code')).fontSize),
      qr: document.querySelector('#join-qr path').getAttribute('d'), qrLabel: document.querySelector('#join-qr svg').getAttribute('aria-label'), qrBox: document.querySelector('#join-qr svg').getBoundingClientRect().toJSON(),
      others: document.querySelector('#join-others').textContent, expanded: document.querySelector('#join-card-toggle').getAttribute('aria-expanded'),
      lines: Math.round(document.querySelector('#join-address').getBoundingClientRect().height / parseFloat(getComputedStyle(document.querySelector('#join-address')).lineHeight)),
      codeRects: document.querySelector('#join-address .join-address-code')?.getClientRects().length ?? 0,
      inView: (() => { const box = document.querySelector('#join-card').getBoundingClientRect(); return box.top >= 0 && box.left >= 0 && box.right <= innerWidth; })(),
    }));
    // The class code inside the address (owner, 2026-09-30): one thing to type.
    assert.equal(card.address, `${url}/${code}`, 'the first address, with the class code in it, as typed');
    assert.equal(card.code, code);
    assert.ok(card.size >= 22 && card.codeSize >= 22, `large: ${card.size}px and ${card.codeSize}px`);
    // With the code in it the address can be too long for the teacher's column at 22 px: it breaks only before the code, so the
    // code is always one unbroken word, and the address at most two lines.
    assert.ok(card.lines <= 2, `the address on ${card.lines} lines`);
    assert.equal(card.codeRects, 1, 'the class code in the address is broken across lines');
    assert.equal(card.expanded, 'true', 'open in the lobby');
    assert.ok(card.inView, 'the card on the screen');
    assert.ok(card.qrBox.width >= 170 && card.qrBox.height >= 170, `the QR code big enough to scan: ${card.qrBox.width}px`);
    const expected = qrSvg(`${url}/${code}`, { label: `QR code for ${url}/${code}` });
    assert.equal(card.qr, expected.match(/<path d="([^"]+)"/)[1], 'the QR code on the page is the same address with the class code in it, made by public/qr.js');
    assert.equal(card.qrLabel, `QR code for ${url}/${code}`, 'and it says so to a screen reader');
    assert.match(card.others, new RegExp(`try http://10\\.5\\.0\\.2:\\d+/${code} \\(NordLynx\\)`), 'the other address under it, with the code in it too');
    ok(`${width}x${height}: the lobby shows ${card.address} at ${card.size}px on ${card.lines} line${card.lines === 1 ? '' : 's'} with the code unbroken, code ${card.code} at ${card.codeSize}px, and a ${Math.round(card.qrBox.width)}px QR code of the address with the code`);
    await context.close();
  }

  // Started: folded to one line that still says where and which code, and opened again by the teacher.
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/host#${app.state.hostKey}`);
  await page.locator('#join-card').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('[data-action=start]').click();
  await page.locator('[data-action=start]').click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  await page.locator('#join-card').waitFor({ state: 'hidden', timeout: 5000 });
  const short = (await page.locator('#join-card-toggle').textContent()).trim();
  assert.match(short, new RegExp(`^Join 127\\.0\\.0\\.1:${port}/${code}$`));
  const width = await page.locator('#join-links').evaluate(one => one.getBoundingClientRect().width);
  assert.ok(width < 300, `folded, as wide as its words (${Math.round(width)}px), so the fight's caption keeps its room at the top`);
  assert.equal(await page.locator('#join-card-toggle').getAttribute('aria-expanded'), 'false');
  ok(`once the class runs the card folds to one line: "${short}"`);
  await page.locator('#join-card-toggle').focus();
  await page.keyboard.press('Enter');
  await page.locator('#join-card').waitFor({ state: 'visible', timeout: 5000 });
  assert.equal(await page.locator('#join-card-toggle').getAttribute('aria-expanded'), 'true');
  await page.waitForTimeout(1500);
  assert.ok(await page.locator('#join-card').isVisible(), 'it stays open across ticks');
  ok('the teacher opens it again with the keyboard for a latecomer, and it stays open across ticks');
  await context.close();

  // An older QR code's `?code=` (before 2026-09-30) still works: the join form with the code in, and the code gone from the address bar.
  const student = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const phone = await student.newPage();
  phone.on('pageerror', error => errors.push(error.message));
  await phone.goto(`${url}/?code=${code}`);
  await phone.locator('#join [name=code]').waitFor({ state: 'attached', timeout: 15000 });
  await phone.waitForFunction(wanted => document.querySelector('#join [name=code]').value === wanted, code, { timeout: 10000 });
  assert.equal(new URL(phone.url()).search, '', 'the code is not left in the address bar');
  ok(`a student who scans it has the class code ${code} already in the join form, and the address bar is clean`);
  await student.close();

  assert.deepEqual(elsewhere, [], 'no request left the class server');
  ok('no request from the Host\'s page left the class\'s own server (the QR code is made in the page)');
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
  record = { verdict: 'PASS', checks: pass.length };
} catch (error) {
  record = { verdict: 'FAIL', error: error.message, checks: pass.length };
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/join-card.json', `${JSON.stringify({ record: 'join-card', date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, ...record, passed: pass }, null, 2)}\n`);
}
