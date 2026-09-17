// The whole game in a real browser: one class from the lobby to the road home, through all three periods, a student and
// the Host watching the whole way (owner, 2026-09-16: the next item after the auto switch).
//
// Every proof before this one covers a period at a time and hands the class to the browser part-played. This one hands
// over nothing: the student joins, rolls, chooses where the house stands, sets the family to work, sends somebody when
// the settlement calls, watches the interim standings, and the Host continues the class twice; in the winter somebody is
// sent to vote or to enlist; in the spring the family is told to leave and goes; and the game ends on the road home with
// the final numbers on both pages. Throughout, a stall detector fails the run if the class stops advancing while it says
// it is running - the failure a playtest would meet first - and names where it stood. The play itself is shared with the
// solo run (scripts/solo-game-browser-proof.mjs) in scripts/support/whole-game.mjs.
//
// The class is small (five families, four of them automatic) and quick (100 ms a tick); what is proved is that nothing
// stalls, refuses wrongly or throws across a whole game, not how long a class period takes at the Study pace.
//
// Same computer only: headless Chrome. Run: npm run test:whole-game
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { playWholeGame } from './support/whole-game.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const TICK_MS = 100;

const app = createClassroom({ seed: 'whole-game-1', playerCount: 5, tickMs: TICK_MS, worldFactory: seed => createGonzalesWorld(seed, 5, { map: 'colonies', neighbours: true }) });
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
const household = () => world().households['hh-1'];
const shot = async (page, name) => { const path = `docs/evidence/whole-game-${name}.png`; await page.screenshot({ path }); shots.push(path); };

try {
  // ------------------------------------------------------------------------------------------------------- the lobby
  const student = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Whole-game reader');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Neighbour ${i}`, code: app.state.sessionCode });
  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.
  await student.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await student.locator('#creation-begin-button').click();
  await student.locator('#roll-family').click();
  await student.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await student.locator('#roll-family').click();
  // The family's last name and how the parents look, asked for after the roll (owner, 2026-09-17).
  await meetFamily(student);
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  if (await student.locator('#tutorial-skip').isVisible()) await student.locator('#tutorial-skip').click();
  await student.locator('#family-panel').waitFor({ state: 'visible' });
  await student.waitForFunction(() => window.__familyPanel?.length >= 1);
  const people = household().members.map(id => world().entities[id]).filter(one => one.kind === 'person');
  ok(`the student joined as hh-1 in ${household().settlementId} and rolled a family of ${people.length}: ${people.map(one => `${one.name} (${one.kin?.role || 'principal'}, ${one.age})`).join(', ')}`);

  const host = await (await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  ok('the Host started the class with five families joined');

  await playWholeGame({ app, student, host, ok, measured, shot });

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors on either page across the whole game');

  writeFileSync('docs/evidence/whole-game-browser.json', `${JSON.stringify({
    record: 'whole-game-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'One class from the lobby to the road home through all three periods, a student and the Host in the browser the whole way: nothing stalls, refuses wrongly or throws.',
    environment: `Same computer: a local classroom server at ${TICK_MS} ms a tick (not the Study pace) with five families, four automatic, and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.`,
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'The Study pace: the class here runs at 100 ms a tick, so real minutes per period are not measured.',
      'A full class of students: one student is in the browser; the other four families are automatic.',
      'Every branch: one call answered, one winter order, one flight by hand; the period proofs press the rest.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/whole-game-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
