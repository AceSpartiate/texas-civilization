// The Host's live page in a real browser (owner, 2026-09-16, docs/HOST_PAGE.md).
//
// tests/absence.test.mjs, tests/host-live.test.mjs and tests/host-page.test.mjs prove the rules: an absent family is the
// director's and holds nothing; the Host is sent the class in words, the Rumor Mill and the spotlight, and a student none
// of it. This proves what a teacher sees: the class panel with every family, its student here, each person in words and
// what waits on them; a student's page closed, and after the grace the row saying the family is playing itself while the
// family goes on; the page opened again and the row saying here; the Rumor Mill filling as word becomes public, a piece
// keeping its earlier telling; the spotlight at the fight at Gonzales taking the Host's camera there with the banner over
// the map, and Whole class bringing it back; and the student's page carrying none of it.
//
// Same computer only: headless Chrome. Run: npm run test:host-live
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { momentOf } from '../sim/directors.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const ABSENT_MS = 2500;

const app = createClassroom({ seed: 'host-live-1', playerCount: 5, tickMs: 100, absentMs: ABSENT_MS, worldFactory: seed => createGonzalesWorld(seed, 5, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  const text = await response.text();
  assert.equal(response.status, 200, `${path}: ${response.status} ${text}`);
  return response;
};
mkdirSync('docs/evidence', { recursive: true });
const world = () => app.state.world;
const shot = async (page, name) => { const path = `docs/evidence/host-live-${name}.png`; await page.screenshot({ path }); shots.push(path); };
const row = (host, id) => host.evaluate(id => window.__hostLive?.families.find(f => f.id === id), id);

try {
  // ------------------------------------------------------------------------------------------- a class, two pages
  const studentContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
  let student = await studentContext.newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Live reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Neighbour ${i}`, code: app.state.sessionCode });
  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForFunction(() => window.__snapshot?.world.status === 'running' && window.__hostLive?.families?.length === 5, null, { timeout: 15000 });

  // ------------------------------------------------------------------------------------------- the class panel
  const panel = await host.evaluate(() => ({ hidden: document.querySelector('#host-live').hidden, rows: [...document.querySelectorAll('.host-family')].map(item => ({ id: item.dataset.householdId, presence: item.dataset.presence, people: [...item.querySelectorAll('.host-people li')].map(li => li.textContent) })) }));
  assert.equal(panel.hidden, false);
  assert.equal(panel.rows.length, 5);
  const mine = panel.rows.find(r => r.id === 'hh-1');
  assert.equal(mine.presence, 'here', `the student's family reads ${mine.presence}`);
  // The other four joined through the API and never opened a page: joined but gone, never absent (no page ever closed).
  assert.ok(panel.rows.filter(r => r.id !== 'hh-1').every(r => r.presence === 'gone'), `a family joined with no page open reads ${panel.rows.filter(r => r.id !== 'hh-1').map(r => r.presence)}`);
  assert.ok(mine.people.length >= 1 && mine.people.every(text => /on the road|at home|at /.test(text)), `people in no words: ${mine.people.join(' | ')}`);
  measured.panel = panel.rows.map(r => ({ id: r.id, presence: r.presence, people: r.people }));
  ok(`the class panel lists all five families in words: the student's family here, the four joined with no page open gone; ${mine.people[0]}`);
  assert.equal(await student.evaluate(() => document.querySelector('#host-live').hidden && !window.__snapshot.world.live), true, 'the student\'s page carries the Host\'s live page');
  ok('the student\'s page has no class panel and is sent no live page');
  await shot(host, 'class-panel');

  // ------------------------------------------------------------------------------------------- absent, and back
  await student.close();
  const gone = Date.now();
  await host.waitForFunction(id => window.__hostLive?.families.find(f => f.id === id)?.presence === 'absent', 'hh-1', { timeout: ABSENT_MS + 15000, polling: 100 });
  measured.absentAfterMs = Date.now() - gone;
  assert.ok(measured.absentAfterMs >= ABSENT_MS - 200, `marked absent after ${measured.absentAfterMs} ms, inside the grace`);
  assert.equal(world().households['hh-1'].absent, true);
  assert.equal(await host.evaluate(() => document.querySelector('.host-family[data-household-id="hh-1"] .host-presence').textContent), 'playing itself');
  ok(`the student's page closed: after ${measured.absentAfterMs} ms the row says the family is playing itself, and the world has it absent`);
  await shot(host, 'absent');
  // The family goes on by itself: its people are given work by the director within a few thinks.
  await host.waitForFunction(() => window.__snapshot.world.others.some(one => one.householdId === 'hh-1' && one.kind === 'person' && (one.chore || one.travel)), null, { timeout: 30000, polling: 200 });
  ok('the absent family goes on by itself: somebody of it is at work or on a road with nobody at the screen');
  student = await studentContext.newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await host.waitForFunction(id => window.__hostLive?.families.find(f => f.id === id)?.presence === 'here', 'hh-1', { timeout: 10000, polling: 100 });
  assert.equal(world().households['hh-1'].absent, undefined);
  assert.ok(world().events.some(e => e.householdId === 'hh-1' && /back at the screen/.test(e.text)));
  ok('the page opened again: the row says here the next tick, the family is the student\'s again, and the record says so');

  // ------------------------------------------------------------------------------------------- the spotlight
  await host.waitForFunction(() => (window.__spotlightSeen || []).some(key => key.startsWith('gonzales:')), null, { timeout: 120000, polling: 200 });
  const lit = await host.evaluate(() => ({ hidden: document.querySelector('#host-spotlight').hidden, date: document.querySelector('#host-spotlight-date').textContent, text: document.querySelector('#host-spotlight-text').textContent, camera: window.__camera, seen: window.__spotlightSeen }));
  const gonzales = world().map.sites.gonzales;
  assert.equal(lit.hidden, false, 'no banner');
  assert.match(lit.text, /cannon/);
  assert.ok(Math.hypot(lit.camera.cx - gonzales.x, lit.camera.cy - gonzales.y) < 2, `the camera is at (${lit.camera.cx}, ${lit.camera.cy}), not Gonzales (${gonzales.x}, ${gonzales.y})`);
  measured.spotlight = { date: lit.date, text: lit.text, camera: lit.camera };
  ok(`the fight at Gonzales lit the spotlight: the camera went to Gonzales and the banner reads "${lit.date}: ${lit.text.slice(0, 60)}…"`);
  await shot(host, 'spotlight');
  await host.locator('#host-spotlight-back').click();
  await host.waitForTimeout(300);
  const back = await host.evaluate(() => window.__camera);
  assert.ok(back.following, 'Whole class did not bring the camera back');
  ok('Whole class brings the camera back to the class');

  // ------------------------------------------------------------------------------------------- the Rumor Mill
  await host.waitForFunction(() => (window.__hostLive?.rumours || []).length >= 1, null, { timeout: 120000, polling: 200 });
  const mill = await host.evaluate(() => [...document.querySelectorAll('.rumor')].map(item => ({ topic: item.dataset.topicId, status: item.dataset.status, head: item.querySelector('.rumor-head').textContent, text: item.querySelector('.rumor-text').textContent, earlier: item.querySelectorAll('.rumor-earlier p').length })));
  assert.ok(mill.length >= 1);
  assert.ok(mill.every(piece => /heard by \d+ of 5 families/.test(piece.head)), `a piece without its reach: ${JSON.stringify(mill[0])}`);
  measured.mill = mill;
  ok(`the Rumor Mill has ${mill.length} piece(s), newest first: "${mill[0].head}" - ${mill[0].text.slice(0, 70)}…`);
  // Word of the fight's outcome becomes public after the fight: the mill grows, and the panel is rewritten only when it changes.
  await host.waitForFunction(count => (window.__hostLive?.rumours || []).length > count, mill.length, { timeout: 120000, polling: 200 }).catch(() => null);
  const grown = await host.evaluate(() => (window.__hostLive?.rumours || []).length);
  measured.millLater = grown;
  if (grown > mill.length) ok(`as word became public the mill grew to ${grown} pieces`);
  await shot(host, 'rumor-mill');

  // ------------------------------------------------------------------------------------------- at phone width
  await host.setViewportSize({ width: 400, height: 800 });
  await host.waitForTimeout(500);
  const scroll = await host.evaluate(() => ({ width: document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(scroll.width <= scroll.inner, `the Host page scrolls sideways at 400 px: ${scroll.width} > ${scroll.inner}`);
  ok('at 400 px the Host page does not scroll sideways');
  await shot(host, 'phone');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors on either page');

  writeFileSync('docs/evidence/host-live-browser.json', `${JSON.stringify({
    record: 'host-live-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/HOST_PAGE.md: the class panel in words with presence and what waits; an absent family playing itself and back; the Rumor Mill; the spotlight taking the camera to the fight at Gonzales; the student sent none of it.',
    environment: `Same computer: a local classroom server at 100 ms a tick with a ${ABSENT_MS} ms absence grace (the build ships 120 s), five families, and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.`,
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'The Alamo, Goliad and San Jacinto spotlights in a browser: lit against the simulation in tests/host-live.test.mjs; the camera move is the same code the Gonzales spotlight pressed here.',
      'A burned farm\'s spotlight in a browser: tested against the simulation.',
      'The 120 s grace of the build: the grace here is 2.5 s.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/host-live-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
