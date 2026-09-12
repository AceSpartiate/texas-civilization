// Who we are, in a real browser.
//
// tests/family.test.mjs proves the model: that names are dealt across a class, that kin is
// the world's and names are the student's, that ids never move. What it cannot prove is
// that a student can actually do any of it - that the book opens on the question somebody
// asked, that a new name reaches the map, and that a line of junk typed into a box comes
// back as a name. And one thing only a browser can answer at all: that who a family is is
// **fetched once** rather than sent on every tick.
//
// Run: npm run test:family
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

const app = createClassroom({ seed: 'family-proof', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
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
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  // Counted, because "fetched once rather than sent every tick" is a claim about the wire.
  let familyFetches = 0;
  page.on('request', request => { if (request.url().includes('/api/family')) familyFetches++; });

  await page.goto(url);
  await page.locator('[name=name]').fill('Family reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });

  // ------------------------------------------------------- the book answers the question
  await page.locator('#journal-toggle').click();
  await page.locator('#family-book').waitFor({ state: 'visible' });
  const rows = await page.locator('#family-kin .kin-row').evaluateAll(items => items.map(item => ({
    id: item.dataset.entityId,
    role: item.querySelector('label')?.textContent,
    name: item.querySelector('input')?.value,
    of: item.querySelector('.kin-of')?.textContent,
  })));
  assert.equal(rows.length, 4, `the book lists ${rows.length} people`);
  assert.deepEqual(rows.map(row => row.role), ['father', 'mother', 'daughter', 'son']);
  for (const row of rows) assert.ok(row.of && row.of.length > 10, `${row.role} does not say who they are to anybody`);
  assert.equal(new Set(rows.map(row => row.name)).size, 4, 'a family with two people of one name');
  ok(`the book says who everybody is: ${rows.map(row => `${row.name} (${row.role})`).join(', ')}`);
  ok(`and in sentences — "${rows[0].of}"`);

  const before = rows[2];
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/family-book.png' });

  // -------------------------------------------------------------- a student renames one
  const row = page.locator(`#family-kin .kin-row[data-entity-id="${before.id}"]`);
  await row.locator('input').fill('Winnie');
  await row.locator('button').click();
  await page.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.name === 'Winnie', before.id);
  ok(`renaming reaches the world: ${before.name} is Winnie now`);
  // And the book, which had to be re-fetched, because it is not on the tick channel.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('#family-kin input')].some(input => input.value === 'Winnie'));
  const after = await page.locator(`#family-kin .kin-row[data-entity-id="${before.id}"] .kin-of`).textContent();
  assert.match(after, /Daughter of /, after);
  ok('and the book still knows whose child they are, because a name is not an identity');
  // Their brother's line names her too, which is the whole point of re-fetching it.
  const sibling = await page.locator('#family-kin .kin-row[data-role=son] .kin-of').textContent();
  assert.ok(!sibling.includes(before.name), `the son is still described as ${before.name}'s brother`);

  // ------------------------------------------------------------ and names the family too
  await page.locator('#family-name-input').fill('  The Elm Creek place  ');
  await page.locator('#family-name-form button').click();
  await page.waitForFunction(() => document.querySelector('#family-title')?.textContent === 'The Elm Creek place');
  ok('a family can name itself, and the name reaches the rest of the page');

  // ------------------------------------------------- and junk comes back as a name or not
  await page.locator('#family-name-input').fill('<b>Bad</b> 1234 \u{1F600}');
  await page.locator('#family-name-form button').click();
  await page.waitForFunction(() => document.querySelector('#family-title')?.textContent === 'bBadb');
  ok('what a student types is cleaned before anybody else reads it: "<b>Bad</b> 1234 \u{1F600}" became "bBadb"');
  await page.locator('#family-name-input').fill('!!!');
  await page.locator('#family-name-form button').click();
  await page.waitForFunction(() => /at least one letter/.test(document.querySelector('#error')?.textContent || ''));
  ok('and a name with no letters in it is refused, in words');

  // ------------------------------------------------- fetched once, not sent on every tick
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  const fetchesBefore = familyFetches;
  const tickBefore = await page.evaluate(() => window.__snapshot.world.tick);
  await page.waitForFunction(tick => window.__snapshot.world.tick >= tick + 8, tickBefore, { timeout: 30000 });
  const ticks = await page.evaluate(() => window.__snapshot.world.tick) - tickBefore;
  assert.equal(familyFetches, fetchesBefore, `who the family is was fetched ${familyFetches - fetchesBefore} more times over ${ticks} ticks`);
  // Without the map, which rides on the first snapshot of a session and never again -
  // quoting the whole thing here would report about sixty thousand bytes a tick, which is
  // sixty thousand bytes wrong.
  const wire = await page.evaluate(() => {
    const { map, ...rest } = window.__snapshot.world;
    return JSON.stringify(rest).length;
  });
  assert.ok(!(await page.evaluate(() => 'family' in window.__snapshot.world)), 'who the family is rides on every tick');
  ok(`and it is fetched once: ${ticks} ticks passed and nothing asked again (a tick is ${wire} bytes without the map)`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/family-browser.json', JSON.stringify({
    record: 'family-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    task: 'HANDOFF next task 2: let a student name their own family, and make family relationships exist and be visible.',
    started: 'The first person to play this asked who the mother and the father were, and the game had no answer.',
    checks: pass,
    measured: { people: rows, tickBytes: wire, familyFetchesDuringPlay: familyFetches - fetchesBefore, ticksWatched: ticks },
    notProved: [
      'That a class names anything. The controls are there and work; whether a room of twelve-year-olds uses them is a classroom question.',
      'Anything about what students type. Names are held to a shape - letters, marks, spaces, name punctuation, one line, twenty-four characters - and every rename is written into the family record so a teacher can see what was changed. No code judges what a name means, and none should pretend to.',
      'That every household has a different shape. They do not: every family is still two parents and two children, which is marked as a ceiling in sim/family.mjs. Only the names differ.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/family-browser.json');
} finally {
  await browser.close();
  await app.close();
}
