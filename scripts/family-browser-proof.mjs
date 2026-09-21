// Who we are, in a real browser.
//
// tests/family.test.mjs proves the model: that names are dealt across a class, that kin is
// the world's and names are the student's, that ids never move. What it cannot prove is
// that a student can actually do any of it - that the book opens on the question somebody
// asked, that a new name reaches the map, and that a line of junk typed into a box comes
// back as a name. Since 2026-09-17 the family's last name is given in the pop-up after the roll and first names on the
// family panel (docs/FAMILY_CREATION.md amendment); the book says who is whose and edits nothing. And one thing only a browser can answer at all: that who a family is is
// **fetched once** rather than sent on every tick.
//
// Run: npm run test:family
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

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

  // ---------------------------------------------------------------------- the die first
  // A family has to be rolled before its book says who anybody is (docs/FAMILY_CREATION.md): before that the book asks for
  // the roll. Rolled here as a student does, on the twenty-sided die, and the book opens on "Meet your family".
  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  const rolled = await page.locator('#family-roll-result').textContent();
  assert.match(rolled, /^You rolled an? (\d|1\d|20)\.$/);
  await page.locator('#roll-family').click();
  // The last name, asked for at once, and carried by everybody (owner, 2026-09-17).
  assert.equal(await meetFamily(page, 'Hollis'), 'Hollis', 'the last name was not asked for after the roll');
  const family = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family);
  assert.ok(family.people.every(person => person.name === `${person.given} Hollis`), 'somebody does not carry the last name');
  ok(`the die is rolled in the page, and the family is the server's: "${rolled}", ${family.people.length} people, every one a Hollis`);

  // ------------------------------------------------------- the book answers the question
  // The wagon is up for a family that has not packed, and since 2026-09-21 a panel that covers the family dims the map
  // behind it (docs/FAMILY_PANEL.md §12.11). The dim lies over the Journal button and Chrome refuses a click through it,
  // which is the dim working. The wagon is put away first, the way a student puts it away.
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#family-journal').getAttribute('data-open') !== 'true') await page.locator('#journal-toggle').click();
  await page.locator('#family-kin .kin-row').first().waitFor({ state: 'visible' });
  const rows = await page.locator('#family-kin .kin-row').evaluateAll(items => items.map(item => ({
    id: item.dataset.entityId,
    role: item.dataset.role,
    name: item.querySelector('strong')?.textContent,
    of: item.querySelector('.kin-of')?.textContent,
  })));
  assert.equal(rows.length, family.people.length, `the book lists ${rows.length} people`);
  const parents = rows.filter(row => ['father', 'mother'].includes(row.role)).length;
  assert.ok(parents >= 1 && rows.slice(0, parents).every(row => ['father', 'mother'].includes(row.role)), 'parents first');
  assert.ok(rows.slice(parents).every(row => ['son', 'daughter'].includes(row.role)), 'then the children');
  assert.ok(rows.some(row => row.role === 'daughter') && rows.some(row => row.role === 'son'), 'this seed rolls a daughter and a son, which the rename below needs');
  for (const row of rows) assert.ok(row.of && row.of.length > 10, `${row.role} does not say who they are to anybody`);
  assert.equal(new Set(rows.map(row => row.name)).size, rows.length, 'a family with two people of one name');
  assert.equal(await page.locator('#family-journal input, #family-journal select').count(), 0, 'the book still edits something');
  ok(`the book says who everybody is, and edits nothing: ${rows.map(row => `${row.name} (${row.role})`).join(', ')}`);
  ok(`and in sentences — "${rows[0].of}"`);

  const before = rows.find(row => row.role === 'daughter');
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/family-book.png' });
  // Put the journal away; its close button, because the open sheet covers the toggle on a narrow screen.
  if (await page.locator('#journal-close').isVisible()) await page.locator('#journal-close').click();
  else await page.locator('#journal-toggle').click();

  // ------------------------------------------------------ a student renames one, on the panel
  const box = page.locator(`#panel-name-${before.id}`);
  assert.equal(await box.inputValue(), before.name.replace(/ Hollis$/, ''), 'the panel box is not the first name');
  await box.fill('Winnie');
  await box.press('Tab');
  await page.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.name === 'Winnie Hollis', before.id);
  ok(`renaming on the panel changes the first name and keeps the last: ${before.name} is Winnie Hollis now`);
  // And the book, which had to be re-fetched, because it is not on the tick channel.
  await page.waitForFunction(id => document.querySelector(`#family-kin .kin-row[data-entity-id="${id}"] strong`)?.textContent === 'Winnie Hollis', before.id);
  const after = await page.locator(`#family-kin .kin-row[data-entity-id="${before.id}"] .kin-of`).textContent();
  assert.match(after, /Daughter of /, after);
  ok('and the book still knows whose child they are, because a name is not an identity');
  const siblings = await page.locator('#family-kin .kin-row[data-role=son] .kin-of').allTextContents();
  assert.ok(siblings.length && siblings.every(line => !line.includes(before.name)), `a son is still described as ${before.name}'s brother`);
  assert.equal(await page.locator('#family-title').textContent(), 'The Hollis family');
  ok('the family is "The Hollis family" on the page');

  // ------------------------------------------------- and junk comes back as a name or not
  await box.fill('<b>Bad</b> 1234 😀');
  await box.press('Enter');
  await page.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.name === 'bBadb Hollis', before.id);
  ok('what a student types is cleaned before anybody else reads it: "<b>Bad</b> 1234 😀" became "bBadb"');
  await box.fill('!!!');
  await box.press('Enter');
  await page.waitForFunction(() => /at least one letter/.test(document.querySelector('#error')?.textContent || ''));
  ok('and a name with no letters in it is refused, in words');
  const again = await page.evaluate(async () => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-surname-${Date.now()}`, action: 'rename', surname: 'Navarro' }) })).json());
  assert.match(again.error || '', /is Hollis, and it is kept/);
  ok('and the last name, once given, is kept: a second one is refused in words');

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
      'Every face of the die in a browser. This run rolls the seed it is given; tests/family-roll.test.mjs checks all twenty faces.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/family-browser.json');
} finally {
  await browser.close();
  await app.close();
}
