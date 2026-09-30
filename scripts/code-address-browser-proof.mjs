// The class code inside the address, in a real browser (owner, 2026-09-30, by multiple choice: "Code inside the address").
//
// The Host shows `http://<laptop>:3000/<code>`; a student who opens it types only their name. Walked here:
//   1. The Host's card shows that one address, and its QR code is that address.
//   2. The coded address: no code box on the join form, a name, Join, and into the class.
//   3. The bare address still asks for the code, and joins with it.
//   4. An older QR code's `?code=` still fills the box.
//   5. The away list on the coded address: "I was already in this class" shows the names with nothing typed, and a tap takes the
//      family back.
//   6. After a New Class, yesterday's address: the join says it is an old class address, the code box comes back empty, and
//      today's code typed there joins.
//   7. `/host` is still the Host's page.
//
// Same computer only, headless Chrome at 1366x768. No Chromebook, camera, LAN or classroom claim.
// Run: npm run test:code-address
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { qrSvg } from '../public/qr.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const VIEW = { width: 1366, height: 768 };
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const dir = mkdtempSync(join(tmpdir(), 'texas-code-address-proof-'));
const app = createClassroom({ seed: 'code-address-proof', savePath: join(dir, 'class.json'), playerCount: 6, tickMs: 1000 });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });

async function student(path) {
  const context = await browser.newContext({ viewport: VIEW });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${path}: ${error.message}`));
  await page.goto(url + path);
  await page.locator('#join').waitFor({ state: 'visible', timeout: 30000 });
  return page;
}
const joined = page => page.waitForFunction(() => window.__snapshot?.world.householdId, null, { timeout: 30000 }).then(() => page.evaluate(() => window.__snapshot.world.householdId));

try {
  mkdirSync('docs/evidence', { recursive: true });
  const code = app.state.sessionCode;

  // ------------------------------------------------------------------ 1. the Host's card
  const hostContext = await browser.newContext({ viewport: VIEW });
  const hostPage = await hostContext.newPage();
  hostPage.on('pageerror', error => errors.push(`host: ${error.message}`));
  await hostPage.goto(`${url}/host#${app.state.hostKey}`);
  await hostPage.locator('#join-card').waitFor({ state: 'visible', timeout: 30000 });
  const card = await hostPage.evaluate(() => ({ address: document.querySelector('#join-address').textContent, code: document.querySelector('#join-code').textContent,
    qr: document.querySelector('#join-qr path').getAttribute('d'), path: location.pathname }));
  assert.equal(card.address, `${url}/${code}`, 'the Host does not show the address with the code in it');
  assert.equal(card.qr, qrSvg(`${url}/${code}`, { label: 'x' }).match(/<path d="([^"]+)"/)[1], 'the QR code is not the address shown');
  assert.equal(card.path, '/host', 'the Host page left its own address');
  observed.card = card;
  await hostPage.screenshot({ path: 'docs/evidence/code-address-host.png' });
  shots.push('docs/evidence/code-address-host.png');
  ok(`1 & 7: the Host's card shows ${card.address}, the QR code is that address, and the Host stays on /host`);

  // ------------------------------------------------------------------ 2. the coded address
  const coded = await student(`/${code}`);
  assert.equal(await coded.locator('#join [name=code]').isVisible(), false, 'the coded address still asks for the code');
  assert.equal(await coded.locator('#join [name=name]').isVisible(), true);
  observed.codedIntro = (await coded.locator('#join .join-intro').innerText()).trim();
  assert.doesNotMatch(observed.codedIntro, /class code/i, 'the join form still talks of a class code');
  await coded.screenshot({ path: 'docs/evidence/code-address-join.png' });
  shots.push('docs/evidence/code-address-join.png');
  await coded.locator('[name=name]').fill('Addressed');
  await coded.getByRole('button', { name: 'Join', exact: true }).click();
  observed.codedFamily = await joined(coded);
  assert.equal(new URL(coded.url()).pathname, `/${code}`);
  ok(`2: at /${code} the join asks only for a name ("${observed.codedIntro}"), and the student is in (${observed.codedFamily})`);

  // ------------------------------------------------------------------ 3. the bare address
  const bare = await student('/');
  assert.equal(await bare.locator('#join [name=code]').isVisible(), true, 'the bare address no longer asks for the code');
  await bare.locator('[name=name]').fill('Bare address');
  await bare.locator('[name=code]').fill(code.toLowerCase());
  await bare.getByRole('button', { name: 'Join', exact: true }).click();
  observed.bareFamily = await joined(bare);
  ok(`3: the bare address still asks for the code, and joins with it typed (${observed.bareFamily})`);

  // ------------------------------------------------------------------ 4. an older QR code
  const older = await student(`/?code=${code}`);
  await older.waitForFunction(wanted => document.querySelector('#join [name=code]').value === wanted, code, { timeout: 10000 });
  assert.equal(new URL(older.url()).search, '', 'the code is left in the address bar');
  ok('4: an older QR code\'s ?code= still fills the code box, and leaves the address bar clean');

  // ------------------------------------------------------------------ 5. the away list, with nothing typed
  // A student who joined and is not here now (joined, never opened the game), coming back on a Chromebook that has forgotten them.
  const away = await browser.newContext();
  assert.equal((await away.request.post(`${url}/api/join`, { data: { name: 'Came back', code } })).status(), 200);
  const back = await student(`/${code}`);
  await back.locator('#away-toggle').click();
  await back.locator('#away-names [data-claim]').first().waitFor({ state: 'visible', timeout: 15000 });
  assert.equal(await back.locator('#away [name=away-code]').isVisible(), false, 'the away list asked for the code again');
  observed.awayNames = await back.locator('#away-names [data-claim]').allInnerTexts();
  await back.locator('#away-names [data-claim]', { hasText: 'Came back' }).click();
  observed.awayFamily = await joined(back);
  ok(`5: on the coded address "I was already in this class" shows the names with nothing typed (${observed.awayNames.join(', ')}) and a tap takes the family back (${observed.awayFamily})`);

  // ------------------------------------------------------------------ 6. yesterday's address, after a New Class
  const newClass = await hostPage.evaluate(async () => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `cmd-new-class-${Date.now()}`, action: 'new-class', name: 'Period 5' }) })).status);
  assert.equal(newClass, 200);
  const today = app.state.sessionCode;
  assert.notEqual(today, code);
  const stale = await student(`/${code}`);
  await stale.locator('[name=name]').fill('Yesterday\'s address');
  await stale.getByRole('button', { name: 'Join', exact: true }).click();
  await stale.waitForFunction(() => /old class address/.test(document.querySelector('#join-error')?.textContent || ''), null, { timeout: 15000 });
  observed.stale = (await stale.locator('#join-error').innerText()).trim();
  assert.equal(await stale.locator('#join-error').isVisible(), true);
  assert.equal(await stale.locator('#join [name=code]').isVisible(), true, 'no code box to type today\'s code in');
  assert.equal(await stale.locator('#join [name=code]').inputValue(), '', 'the old code is left in the box');
  await stale.screenshot({ path: 'docs/evidence/code-address-old.png' });
  shots.push('docs/evidence/code-address-old.png');
  await stale.locator('[name=code]').fill(today);
  await stale.getByRole('button', { name: 'Join', exact: true }).click();
  observed.staleFamily = await joined(stale);
  ok(`6: yesterday's address says "${observed.stale}", gives back the code box, and today's code typed there joins (${observed.staleFamily})`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/code-address-browser.json', `${JSON.stringify({
    record: 'The class code inside the join address, in a real browser (owner, 2026-09-30)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS', viewport: VIEW,
    note: 'Same computer, headless Chrome. No Chromebook, camera, LAN or classroom claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
  rmSync(dir, { recursive: true, force: true });
}
