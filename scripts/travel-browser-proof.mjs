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
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { asMain } from './support/main-person.mjs';
// A settled class: these families are at home under a roof, as every class began before arrivals
// (docs/SETTLING_IN.md step 2). This proves the work, not the arrival - tests/arrival.test.mjs does that.

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

const app = createClassroom({ seed: 'travel-proof', playerCount: 5, tickMs: 250, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
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
  // The title screen and the family made, before anything is drawn (public/creation.js, owner 2026-09-17): this proof
  // predates it and stood at the title screen until 2026-09-18.
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await command('start');
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const choose = async id => {
    await page.locator('#journal-toggle').click();
    await page.locator(`[data-select="${id}"]`).click();
    await page.locator('#journal-close').click();
    await page.locator('#selection').waitFor({ state: 'visible' });
  };

  // ------------------------------------------------------------------ the control exists
  // Since 2026-09-24 how they go is asked when a journey is sent (owner: "when sending someone to travel, the game should ask
  // how they'll travel"; public/going.js), not set beforehand on the card: pressing Travel opens the chooser.
  const hunt = page.locator('.panel-row[data-entity-id="hh-1-thomas"] .panel-icon[data-key=hunt-timber]');
  const note = await hunt.getAttribute('data-note');
  await page.locator('#selection-close').click().catch(() => {});
  await page.locator('button[data-action=travel][data-destination=gonzales]').click();
  await page.locator('#going').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__going?.ways?.length === 3);
  const offered = await page.locator('#going [data-way] .going-way-name').allTextContents();
  assert.deepEqual(offered, ['On the horse (quickest)', 'On foot', 'With the ox and wagon'], `offered ${JSON.stringify(offered)}`);
  ok('a student is offered all three ways of going, named in words, when they send somebody');
  assert.equal(await page.locator('#going [data-way][aria-pressed=true]').getAttribute('data-way'), 'horse');
  ok('and starts on the quickest that can go, which the server marks');

  // --------------------------------------------------- what a trip would bring home, said
  // The hunt's icon says what a good trip gives; what each way brings home of it is the chooser's (docs/FAMILY_PANEL.md §15).
  assert.match(note, /A good trip gives about \d+ food; what comes home depends on how they go\./, note);
  ok(`the hunt says what it would give before it is chosen: "${note.match(/A good trip[^;]+/)[0]}"`);

  // --------------------------------------------------------------- the animals leave the yard
  await page.locator('#going [data-way=wagon]').click();
  await page.locator('#going-send').click();
  await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.travel?.mode === 'wagon');
  ok('choosing the wagon in the chooser and pressing Send sends them with the wagon');
  const harnessed = await page.evaluate(() => window.__snapshot.world.entities
    .filter(e => ['hh-1-animal', 'hh-1-wagon'].includes(e.id))
    .map(e => ({ id: e.id, travelling: Boolean(e.travel), borrowedBy: e.borrowedBy, mode: e.travel?.mode })));
  assert.equal(harnessed.length, 2);
  assert.ok(harnessed.every(e => e.travelling && e.borrowedBy === 'hh-1-thomas' && e.mode === 'wagon'), JSON.stringify(harnessed));
  ok('the ox and the wagon are on the road with him, not left standing at home');

  // Drawn, not merely projected: sample where each is actually painted, two frames apart. Since 2026-09-16 the ox and wagon
  // are drawn with their driver sitting on the wagon (public/app.js `drawSeated`, scripts/riding-browser-proof.mjs), so
  // their painted places are the parts of his seated drawing.
  const moved = await page.evaluate(async () => {
    const at = () => Object.fromEntries((window.__seatedDrawn?.['hh-1-thomas']?.parts || []).map(part => [part.part, part]));
    const first = at();
    await new Promise(resolve => setTimeout(resolve, 900));
    const later = at();
    const shifted = id => first[id] && later[id] && Math.hypot(later[id].x - first[id].x, later[id].y - first[id].y);
    return { ox: shifted('ox'), wagon: shifted('wagon'), man: shifted('rider') };
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
  await asMain(page, 'hh-1-rosa');
  await page.locator('.panel-row[data-entity-id="hh-1-rosa"] .panel-icon[data-key=hunt-timber]').click();
  await page.locator('#going').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__going?.ways?.length === 3);
  const shut = page.locator('#going [data-way=wagon]');
  assert.equal(await shut.isDisabled(), true);
  const why = await shut.getAttribute('title');
  const holder = app.state.world.entities['hh-1-thomas'].name;
  // Said with what he is doing with them, where that adds anything (owner, 2026-09-24; sim/keeping.mjs `hasWords`).
  assert.match(why, new RegExp(`^${holder} has the ox and wagon(, [^.]+)?\\.$`), why);
  ok(`a second person is told who has it, in words: "${why}"`);
  assert.equal(await page.locator('#going [data-way=foot]').isDisabled(), false);
  ok('and walking is never taken away from anybody');
  await page.keyboard.press('Escape');
  await page.locator('#going').waitFor({ state: 'hidden' });

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
