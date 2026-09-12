// How somebody goes, proved in a real browser.
//
// The unit tests in tests/travel-modes.test.mjs prove the simulation: that the ox is
// rivalrous, that the wagon hauls and the horse hurries, that the ford turns a wagon back.
// None of that reaches a student unless the control exists, says why a way is shut, and
// the animals are actually drawn leaving the yard - which is the part only a browser can
// answer. The library has carried `ox-walk`, `horse-walk` and `wagon-loaded-travel` since
// the art landed and nothing had ever set travel on a piece of property, so until today a
// family's animals had never once been seen to move.
//
// Run: npm run test:travel
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

const app = createClassroom({ seed: 'travel-proof', playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const command = action => post('/api/command', { id: `proof-${action}-${crypto.randomUUID()}`, action }, hostCookie);

  // Reduced motion is on by default in headless Chrome, and this renderer honours it by
  // switching interpolation off - correct behaviour and the wrong thing to watch.
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Travel reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await command('start');
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const choose = async id => {
    await page.locator('#journal-toggle').click();
    await page.locator(`[data-select="${id}"]`).click();
    await page.locator('#journal-close').click();
    await page.locator('#selection').waitFor({ state: 'visible' });
  };
  await choose('hh-1-thomas');

  // ------------------------------------------------------------------ the control exists
  await page.locator('#selection-travel').waitFor({ state: 'visible' });
  const offered = await page.locator('#travel-modes button').allTextContents();
  assert.deepEqual(offered, ['On foot', 'On the horse', 'With the ox and wagon'], `offered ${JSON.stringify(offered)}`);
  ok('a student is offered all three ways of going, named in words');
  assert.equal(await page.locator('#travel-modes button[aria-pressed=true]').textContent(), 'On foot');
  ok('and starts on the one that is always possible');

  // --------------------------------------------------- what a trip would bring home, said
  const onFoot = await page.locator('button[data-chore=hunt-timber] .work-note').textContent();
  await page.locator('#travel-modes button[data-mode=wagon]').click();
  await page.waitForFunction(() => document.querySelector('#travel-modes button[data-mode=wagon]')?.getAttribute('aria-pressed') === 'true');
  const withWagon = await page.locator('button[data-chore=hunt-timber] .work-note').textContent();
  assert.match(onFoot, /Brings home 5 food of \d+; the rest is left behind\./, onFoot);
  assert.ok(!/left behind/.test(withWagon), withWagon);
  ok(`the hunt says what it will bring home before it is chosen: on foot "${onFoot.match(/Brings home[^.]+\./)[0]}"`);

  // --------------------------------------------------------------- the animals leave the yard
  await page.locator('button[data-action=travel][data-destination=gonzales]').click();
  await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.travel?.mode === 'wagon');
  ok('choosing the wagon and pressing Travel sends them with the wagon');
  const harnessed = await page.evaluate(() => window.__snapshot.world.entities
    .filter(e => ['hh-1-animal', 'hh-1-wagon'].includes(e.id))
    .map(e => ({ id: e.id, travelling: Boolean(e.travel), borrowedBy: e.borrowedBy, mode: e.travel?.mode })));
  assert.equal(harnessed.length, 2);
  assert.ok(harnessed.every(e => e.travelling && e.borrowedBy === 'hh-1-thomas' && e.mode === 'wagon'), JSON.stringify(harnessed));
  ok('the ox and the wagon are on the road with him, not left standing at home');

  // Drawn, not merely projected: sample where each is actually painted, two frames apart.
  const moved = await page.evaluate(async () => {
    const at = () => ({ ...window.__drawnAt });
    const first = at();
    await new Promise(resolve => setTimeout(resolve, 900));
    const later = at();
    const shifted = id => first[id] && later[id] && Math.hypot(later[id].x - first[id].x, later[id].y - first[id].y);
    return { ox: shifted('hh-1-animal'), wagon: shifted('hh-1-wagon'), man: shifted('hh-1-thomas') };
  });
  assert.ok(moved.ox > 0.5 && moved.wagon > 0.5, `ox moved ${moved.ox}px, wagon ${moved.wagon}px on screen`);
  ok(`the ox and wagon are drawn travelling, not teleported (${moved.ox.toFixed(1)}px and ${moved.wagon.toFixed(1)}px of screen movement)`);
  // `__animationClips` is the set of clips the last frame actually bound, which is the
  // renderer's own record of what it drew rather than what it was asked to draw.
  const clips = await page.evaluate(() => [...(window.__animationClips || [])].sort());
  assert.ok(clips.some(clip => /^wagon-(loaded-|empty-)?travel$/.test(clip)), clips.join(' '));
  assert.ok(clips.some(clip => /^ox-walk/.test(clip)), clips.join(' '));
  ok('and are drawn with the walking and rolling cycles the art library has always carried');

  // --------------------------------------------------- one wagon, and the reason is plain
  await choose('hh-1-rosa');
  await page.locator('#selection-travel').waitFor({ state: 'visible' });
  const shut = page.locator('#travel-modes button[data-mode=wagon]');
  assert.equal(await shut.isDisabled(), true);
  const why = await shut.getAttribute('title');
  assert.match(why, /Thomas has the ox/, why);
  ok(`a second person is told who has it, in words: "${why}"`);
  assert.equal(await page.locator('#travel-modes button[data-mode=foot]').isDisabled(), false);
  ok('and walking is never taken away from anybody');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/travel-modes-browser.json', JSON.stringify({
    record: 'travel-modes-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: '"okay, so horse for speed, ox and wagon for heavy?"',
    checks: pass,
    measured: { screenPixelsMovedInNineTenthsOfASecond: moved, clipsBound: clips },
    notProved: [
      'That the three ways feel different to a class. They are measurably different; no room has used them.',
      'That the wagon is worth its extra time on a real map at a real pace. That is a balance question and needs a played class.',
      'Anything about the ford in ordinary play: the only road a student can order that crosses it is the march upriver, which is refused for the wagon before anything moves. The refusal itself is proved in tests/travel-modes.test.mjs.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/travel-modes-browser.json');
} finally {
  await browser.close();
  await app.close();
}
