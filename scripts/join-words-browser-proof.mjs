// Join words, in a real browser (owner, 2026-10-03, "Fewest words, no server"; docs/HOST_PAGE.md §2.17).
//
// Walked here, with the class server listening on this computer's real classroom address (the first private one it has):
//   1. The Host's card: "Go to playtexas.github.io and type:" the words, numbered and large, then the class code; the address and
//      its QR code still carry the code. The words are the ones sim/join-words.mjs makes for this computer's address and port.
//   2. The network choice: choosing another of this computer's addresses changes the words, and choosing back restores them.
//   3. The page (site/playtexas/, served from a tiny local server as GitHub Pages would serve it): a word that is not on the list
//      is refused in words; the real words, typed loosely (capitals, hyphens), go to the laptop's bare address, where the class
//      code box comes first and large; the code typed from the Host screen and a name join the class. Nothing the page loads
//      comes from anywhere but its own server.
//   4. A link with the words after # goes straight on.
//   5. Words whose class does not answer: the browser's error, then Back - and the page opens "Didn't work?" and says so.
//
// Same computer only: headless Chrome reaching its own classroom address. No Chromebook, no school network, no GitHub Pages.
// Run: npm run test:join-words (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE as for every proof).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { joinCandidates } from '../server/deployment.mjs';
import { encodeJoin, isClassroomAddress } from '../sim/join-words.mjs';
import { qrSvg } from '../public/qr.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
// The students' pages at VIEW (e.g. VIEW=480x800; 1366x768 by default); the Host's page at it too unless it is narrower than a
// teacher's laptop, when the Host stays at 1366x768. Evidence other than the default size is kept with the width in its name.
const [viewWidth, viewHeight] = (process.env.VIEW || '1366x768').split('x').map(Number);
const VIEW = { width: viewWidth || 1366, height: viewHeight || 768 };
const HOST_VIEW = VIEW.width >= 1024 ? VIEW : { width: 1366, height: 768 };
const SUFFIX = VIEW.width === 1366 && VIEW.height === 768 ? '' : `-${VIEW.width}`;
const pass = [], observed = {}, errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const dir = mkdtempSync(join(tmpdir(), 'texas-join-words-proof-'));

// The class server, on every interface, told this computer's own addresses as the real server would be.
const joinUrls = [];
const app = createClassroom({ seed: 'join-words-proof', savePath: join(dir, 'class.json'), playerCount: 6, tickMs: 1000, joinUrls });
// On the class server's own port when it is free, so the words are the three a classroom sees; any port otherwise.
const usual = await new Promise(done => { const probe = createServer(); probe.once('error', () => done(false)); probe.listen(1835, '0.0.0.0', () => probe.close(() => done(true))); });
const port = await app.listen(usual ? 1835 : 0, '0.0.0.0');
joinUrls.push(...joinCandidates(port).filter(entry => isClassroomAddress(entry.address)));
if (!joinUrls.length) { console.error('This computer has no private classroom address to prove join words on.'); await app.close(); process.exit(1); }
const lan = joinUrls[0].address;

// The page as GitHub Pages serves it: the folder's files, nothing else.
const SITE = new URL('../site/playtexas/', import.meta.url);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
const site = createServer((req, res) => {
  const name = new URL(req.url, 'http://x').pathname.replace(/^\//, '') || 'index.html';
  if (!/^(assets\/)?[\w.-]+$/.test(name)) { res.writeHead(404); return res.end(); }
  try { const body = readFileSync(new URL(name, SITE)); res.writeHead(200, { 'Content-Type': `${TYPES[extname(name)] || 'application/octet-stream'}; charset=utf-8` }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(done => site.listen(0, '127.0.0.1', done));
const siteUrl = `http://127.0.0.1:${site.address().port}/`;
// A port nothing answers on, for the words whose class does not open.
const closed = await new Promise(done => { const probe = createServer(); probe.listen(0, '127.0.0.1', () => { const { port: free } = probe.address(); probe.close(() => done(free)); }); });

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
let record = {};
try {
  mkdirSync('docs/evidence', { recursive: true });
  const code = app.state.sessionCode, words = encodeJoin({ address: lan, port });
  const bare = `http://${lan}:${port}/`;

  // ------------------------------------------------------------------ 1. the Host's card
  const hostContext = await browser.newContext({ viewport: HOST_VIEW });
  const host = await hostContext.newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`http://127.0.0.1:${port}/host#${app.state.hostKey}`);
  await host.locator('#join-words-box').waitFor({ state: 'visible', timeout: 30000 });
  const card = await host.evaluate(() => ({
    site: document.querySelector('#join-site').textContent, words: [...document.querySelectorAll('#join-words li')].map(item => item.textContent),
    size: parseFloat(getComputedStyle(document.querySelector('#join-words li')).fontSize), code: document.querySelector('#join-words-code').textContent,
    codeSize: parseFloat(getComputedStyle(document.querySelector('#join-words-code')).fontSize), address: document.querySelector('#join-address').textContent,
    qr: document.querySelector('#join-qr path').getAttribute('d'), options: [...document.querySelectorAll('#join-network option')].map(option => option.value),
  }));
  assert.equal(card.site, 'playtexas.github.io');
  assert.deepEqual(card.words, words, 'the Host does not show the words this computer\'s address makes');
  assert.ok(card.size >= 22 && card.codeSize >= 22, `the words at ${card.size}px and the code at ${card.codeSize}px`);
  assert.equal(card.code, code);
  assert.equal(card.address, `${bare}${code}`, 'the address under the words no longer carries the code');
  assert.equal(card.qr, qrSvg(`${bare}${code}`, { label: 'x' }).match(/<path d="([^"]+)"/)[1], 'the QR code is not the coded address');
  observed.card = card;
  await host.screenshot({ path: `docs/evidence/join-words-host${SUFFIX}.png` });
  ok(`1: the Host shows "playtexas.github.io" and ${words.map((word, at) => `${at + 1} ${word}`).join(' ')} at ${card.size}px, then the class code ${code}; the address and QR code are ${card.address}`);

  // ------------------------------------------------------------------ 2. choosing the students' network
  if (joinUrls.length > 1) {
    const other = joinUrls[1].address;
    await host.locator('#join-check summary').click();
    await host.locator('#join-network').selectOption(other);
    await host.waitForFunction(wanted => [...document.querySelectorAll('#join-words li')].map(item => item.textContent).join(' ') === wanted, encodeJoin({ address: other, port }).join(' '), { timeout: 10000 });
    assert.match(await host.locator('#join-address').textContent(), new RegExp(`^http://${other.replace(/\./g, '\\.')}:${port}/${code}$`));
    observed.otherNetwork = { address: other, words: encodeJoin({ address: other, port }) };
    await host.locator('#join-network').selectOption(lan);
    await host.waitForFunction(wanted => [...document.querySelectorAll('#join-words li')].map(item => item.textContent).join(' ') === wanted, words.join(' '), { timeout: 10000 });
    ok(`2: choosing ${other} as the students' network shows its words (${observed.otherNetwork.words.join(' ')}) and address; choosing ${lan} again restores them`);
  } else ok('2: (this computer has one classroom address, so there is no network to choose)');
  observed.itNote = await host.locator('#join-it').textContent();
  assert.match(observed.itNote, new RegExp(`${lan.replace(/\./g, '\\.')}, port ${port} \\(TCP\\)`));

  // ------------------------------------------------------------------ 3. the page: refused, then typed, then joined
  const studentContext = await browser.newContext({ viewport: VIEW });
  const student = await studentContext.newPage();
  student.on('pageerror', error => errors.push(`page: ${error.message}`));
  const pageRequests = [];
  student.on('request', request => { if (request.frame() === student.mainFrame() && new URL(request.url()).host === new URL(siteUrl).host) pageRequests.push(request.url()); else if (!student.url().startsWith(bare) && !request.url().startsWith(bare)) pageRequests.push(`ELSEWHERE ${request.url()}`); });
  const missing = [];
  student.on('response', response => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
  await student.goto(siteUrl, { waitUntil: 'load' });
  await student.locator('#words').waitFor({ state: 'visible' });
  assert.deepEqual(missing, [], `the page asked for files it does not have: ${missing.join(', ')}`);
  await student.screenshot({ path: `docs/evidence/join-words-page${SUFFIX}.png` });
  await student.locator('#words').fill(`${words[0]} crame`);
  await student.locator('#go').click();
  observed.refused = (await student.locator('#say').textContent()).trim();
  assert.match(observed.refused, /Word 2, "crame", is not one of the words/);
  assert.equal(await student.locator('#say').getAttribute('class'), 'is-error');
  await student.screenshot({ path: `docs/evidence/join-words-page-refused${SUFFIX}.png` });
  await student.locator('#words').fill('');
  await student.locator('#words').pressSequentially(words.map(word => word.toUpperCase()).join('-'), { delay: 10 });
  observed.read = await student.locator('#read li').allTextContents();
  await Promise.all([student.waitForURL(bare, { timeout: 15000 }), student.locator('#go').click()]);
  assert.deepEqual(pageRequests.filter(entry => entry.startsWith('ELSEWHERE')), [], `the page loaded something from elsewhere: ${pageRequests.join(', ')}`);
  observed.pageLoaded = pageRequests.map(entry => new URL(entry).pathname);
  await student.locator('#join').waitFor({ state: 'visible', timeout: 30000 });
  const form = await student.evaluate(() => {
    const box = document.querySelector('#join [name=code]');
    return { codeShown: !box.closest('label').hidden, codeSize: parseFloat(getComputedStyle(box).fontSize), codeFirst: box.compareDocumentPosition(document.querySelector('#join [name=name]')) === Node.DOCUMENT_POSITION_FOLLOWING, focused: document.activeElement?.name || null };
  });
  assert.ok(form.codeShown, 'the bare address did not ask for the class code');
  assert.ok(form.codeFirst, 'the class code box is not first');
  assert.ok(form.codeSize >= 28, `the code box at ${form.codeSize}px`);
  observed.form = form;
  await student.screenshot({ path: `docs/evidence/join-words-class${SUFFIX}.png` });
  await student.locator('#join [name=code]').fill(code.toLowerCase());
  await student.locator('#join [name=name]').fill('Came by words');
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  observed.family = await student.waitForFunction(() => window.__snapshot?.world.householdId, null, { timeout: 30000 }).then(handle => handle.jsonValue());
  ok(`3: "crame" refused ("${observed.refused}"); "${words.map(word => word.toUpperCase()).join('-')}" went to ${bare}, loading only ${observed.pageLoaded.join(', ')} from the page's own server; there the class code box came first at ${form.codeSize}px, and the code and a name joined the class (${observed.family})`);

  // ------------------------------------------------------------------ 4. the link with the words after #
  const linkContext = await browser.newContext({ viewport: VIEW });
  const linked = await linkContext.newPage();
  linked.on('pageerror', error => errors.push(`link: ${error.message}`));
  await Promise.all([linked.waitForURL(bare, { timeout: 15000 }), linked.goto(`${siteUrl}#${words.join('-')}`)]);
  await linked.locator('#join').waitFor({ state: 'visible', timeout: 30000 });
  ok(`4: ${siteUrl}#${words.join('-')} went straight on to ${bare}`);

  // ------------------------------------------------------------------ 5. a class that does not answer, and Back
  const dead = encodeJoin({ address: lan, port: closed });
  const failed = await (await browser.newContext({ viewport: VIEW })).newPage();
  failed.on('pageerror', error => errors.push(`failed: ${error.message}`));
  await failed.goto(siteUrl);
  await failed.locator('#words').fill(dead.join(' '));
  await failed.locator('#go').click();
  await failed.waitForURL(url => url.toString().startsWith(`http://${lan}:${closed}`) || url.toString().startsWith('chrome-error:'), { timeout: 15000 }).catch(() => {});
  await failed.waitForTimeout(1500);
  observed.failedAt = failed.url();
  await failed.goBack({ waitUntil: 'load' }).catch(() => {});
  await failed.waitForFunction(() => document.body.dataset.state === 'came-back', null, { timeout: 15000 });
  const back = await failed.evaluate(() => ({ open: document.querySelector('#help').open, say: document.querySelector('#say').textContent, tell: document.querySelector('#help-tell').textContent, words: document.querySelector('#words').value }));
  assert.ok(back.open, '"Didn\'t work?" is not open');
  assert.match(back.say, /did not open/);
  assert.match(back.tell, new RegExp(`${lan.replace(/\./g, '\\.')}, port ${closed}`));
  assert.equal(back.words, dead.join(' '));
  observed.cameBack = back;
  await failed.screenshot({ path: `docs/evidence/join-words-didnt-work${SUFFIX}.png` });
  ok(`5: words for a port nothing answers on (${dead.join(' ')}) left the student at ${observed.failedAt}; Back brought the page with "Didn't work?" open, "${back.say}", and what to tell the teacher: ${back.tell}`);

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
  record = { verdict: 'PASS', checks: pass.length, observed };
} catch (error) {
  record = { verdict: 'FAIL', error: error.message, checks: pass.length, observed };
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
  site.close();
  rmSync(dir, { recursive: true, force: true });
  writeFileSync(`docs/evidence/join-words-browser${SUFFIX}.json`, `${JSON.stringify({ record: 'join-words', date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, view: VIEW, address: 'this computer\'s own first private address', ...record, passed: pass }, null, 2)}\n`);
}
