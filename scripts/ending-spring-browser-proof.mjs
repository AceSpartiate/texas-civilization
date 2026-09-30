// The final ending of a class played to April, in a real browser (docs/audits/2026-09-29-triage.md 2.8, 2.9, 2.10, 2.11, 3.6,
// 3.7; sim/ending.mjs, public/ending.js). npm run test:ending proves the interim standings of a live first period; this proves
// the last period's reckoning, which the whole war's classes end on.
//
// A class of five families on the real land is played headless through the autumn, the winter and the spring
// (tests/support/ended-class.mjs) and handed to a classroom server as its save, with one student's family. Then, in headless
// Chrome:
//   - the Host's table has the spring beside October - when each family heard the Alamo had fallen, fled or stayed and where it
//     was at the end, the farm - and no "Road miles from Gonzales"; each cell is the server's; the questions for the class are
//     the class's own first and none is about the scoring; the footer is the whole formula, prisoners' share and all (3.7);
//   - nobody under 18 who died of a sickness is named anywhere on the Host's page (2.11);
//   - the family's page shows each award with its own sum (the part's weight × the miles' multiplier) and no bare "(16)", the
//     coin in whole reales, the sum said in sentences, and its spring as it was (2.9);
//   - a family with no award reads "No award was earned.", not "the events of that October" (3.6).
// Screenshots: docs/evidence/ending-spring-host.png, ending-spring-host-questions.png, ending-spring-family.png,
// ending-spring-family-awards.png, ending-spring-no-awards.png.
//
// Same computer only: headless Chrome. Run: npm run test:ending-spring
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createClassroom } from '../server/app.mjs';
import { endedClass } from '../tests/support/ended-class.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { DISCUSSION, UNNAMED_UNDER, hostEnding, familyEnding } from '../sim/ending.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const VIRTUE = /\b(good|better|best|brave\w*|loyal\w*|patriot\w*|hero\w*|virtu\w*|honou?r\w*|worthy|courag\w*|coward\w*|deserv\w*|right|wrong)\b/i;
mkdirSync('docs/evidence', { recursive: true });

const started = Date.now();
const world = endedClass('ending-spring-proof', 5, { played: 2, surname: 'Springwright' });
const closing = hostEnding(world);
const flights = Object.fromEntries(Object.values(world.households).map(household => [household.id, household.flight?.status || null]));
ok(`a class of five families was played headless to April in ${Math.round((Date.now() - started) / 1000)} s: ${JSON.stringify(flights)}`);

const folder = mkdtempSync(join(tmpdir(), 'ending-spring-'));
const credential = randomBytes(24).toString('hex'), hostKey = randomBytes(24).toString('hex'), sessionId = randomBytes(6).toString('hex');
const save = { saveVersion: 3, revision: 1, hostKey, sessionId, sessionCode: 'SPRNG1', clients: { [createHash('sha256').update(credential).digest('hex')]: { name: 'Ending reader', householdId: 'hh-1', commands: [] } }, hostCommands: [], world };
writeFileSync(join(folder, 'class.json'), JSON.stringify(save));
const app = createClassroom({ savePath: join(folder, 'class.json'), tickMs: 1000 });
const url = `http://127.0.0.1:${await app.listen(0, '127.0.0.1')}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const shots = [];
try {
  // ------------------------------------------------------------------------------------------------------------ the Host
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  assert.equal((await hostContext.request.post(`${url}/api/host`, { data: { key: hostKey } })).status(), 200, 'the Host could not sign in');
  const host = await hostContext.newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host`);
  await host.waitForFunction(() => window.__snapshot?.world?.ending?.host);
  // The flashback's making (docs/FLASHBACK.md) runs on the Host's page by itself; it is not what is looked at here.
  await host.locator('#ending').waitFor({ state: 'visible', timeout: 30000 });
  const sent = await host.evaluate(() => window.__snapshot.world.ending.host);
  assert.equal(sent.interim, false, 'the end of the third period was interim');
  await host.locator('#ending thead th').first().waitFor({ timeout: 30000 }).catch(async () => { const dom = await host.evaluate(() => ({ tables: document.querySelectorAll("#ending table").length, ths: document.querySelectorAll("#ending th").length, wrap: document.querySelector("#ending .ending-table-wrap")?.outerHTML.slice(0, 600) })); throw new Error(`the Host has no table: ${JSON.stringify(dom)}`); });
  const heads = await host.locator('#ending thead th').allInnerTexts();
  assert.deepEqual(heads, ['Family', 'Who went', 'Heard of the cannon', 'Heard the Alamo fell', 'In the spring', 'Farm', 'Taken prisoner', 'Coin', 'Glory', 'Land', 'Final'], `the Host's columns: ${heads.join(' | ')}`);
  const column = async n => host.locator(`#ending tbody tr td:nth-child(${n})`).allInnerTexts();
  assert.deepEqual(await column(4), sent.families.map(family => family.heardAlamo || '—'), 'the Alamo column is not the server\'s');
  assert.deepEqual(await column(5), sent.families.map(family => family.spring || '—'), 'the spring column is not the server\'s');
  assert.deepEqual(await column(6), sent.families.map(family => family.farm || '—'), 'the farm column is not the server\'s');
  assert.ok(sent.families.every(family => family.spring), `a family in a class played to April has no spring: ${JSON.stringify(sent.families.map(family => family.spring))}`);
  for (const family of sent.families) {
    if (world.households[family.householdId].flight?.status === 'fled') assert.equal(family.spring, 'Fled; still on the road east');
  }
  ok(`the Host's table has the spring beside October: ${sent.families.map(family => `${family.name}: ${family.spring}, farm ${family.farm}, heard the Alamo ${family.heardAlamo}`).join('; ')}`);
  const questions = await host.locator('#ending ol').last().locator('li').allInnerTexts();
  assert.deepEqual(questions, sent.discussion, 'the questions on the page are not the server\'s');
  assert.deepEqual(questions.slice(-DISCUSSION.length), [...DISCUSSION], 'the standing questions do not follow the class\'s own');
  for (const question of questions) assert.doesNotMatch(question, /coin|glory|scor|points/i, `a question for the class is about the scoring: ${question}`);
  for (const question of questions) assert.match(question, /^[A-Z]/, `a question on the projector begins in lower case: ${question}`);
  ok(`the questions for the class: ${questions.length - DISCUSSION.length} of the class's own first, then ${DISCUSSION.length} standing ones, none about the scoring`);
  const hostText = await host.locator('#ending').innerText();
  assert.ok(hostText.includes(sent.formulaWords), 'the Host\'s footer is not the server\'s formula');
  assert.match(hostText, /1\.5 parts for each person taken prisoner/, 'the Host\'s footer leaves out the prisoners\' share');
  assert.doesNotMatch(hostText, /Road miles from Gonzales/);
  assert.doesNotMatch(hostText, VIRTUE, 'the Host\'s page names a virtue');
  ok('the footer is the whole formula as the server counts it, prisoners\' share and all; no "Road miles from Gonzales" and no virtue word');
  // Nobody under 18 who died of a sickness is named on the projector (docs/DISEASE.md §4).
  const unnamed = Object.values(world.entities).filter(person => person.kind === 'person' && person.health?.condition === 'dead' && person.health.disease && (person.age ?? 30) < UNNAMED_UNDER);
  const wentText = (await column(2)).join(' | ');
  for (const person of unnamed) assert.ok(!wentText.includes(person.name), `${person.name}, dead of a sickness at ${person.age}, is named under "Who went"`);
  ok(`"Who went" names nobody under ${UNNAMED_UNDER} who died of a sickness (${unnamed.length} such in this class): ${wentText}`);
  // The panel scrolls inside itself: each picture is the panel scrolled to what it shows.
  const shot = async (page, selector, path) => {
    await page.evaluate(which => document.querySelector(which).scrollIntoView({ block: 'start' }), selector);
    await page.locator('#ending').screenshot({ path });
    shots.push(path);
  };
  await shot(host, '#ending .ending-winner', 'docs/evidence/ending-spring-host.png');
  await shot(host, '#ending .ending-table-wrap + .ending-sum', 'docs/evidence/ending-spring-host-questions.png');

  // ---------------------------------------------------------------------------------------------------------- the family
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: `tr_student_${sessionId}`, value: credential, url }]);
  const student = await context.newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await meetFamily(student, 'Springwright', { timeout: 15000 });
  await student.waitForFunction(() => window.__snapshot?.world?.ending?.family);
  // The flashback's video, if one was made already, may stand over the ending: close it.
  if (await student.locator('#flashback-close').isVisible().catch(() => false)) await student.locator('#flashback-close').click();
  if (await student.locator('#ending-open').isVisible()) await student.locator('#ending-open').click();
  await student.locator('#ending').waitFor({ state: 'visible', timeout: 30000 });
  const own = await student.evaluate(() => window.__snapshot.world.ending.family);
  assert.deepEqual(own, JSON.parse(JSON.stringify({ ...familyEnding(world, 'hh-1'), interim: false })), 'the family\'s ending on the wire is not the server\'s');
  const worths = await student.locator('#ending .ending-awards .ending-worth').allInnerTexts();
  assert.equal(worths.length, own.awards.length, 'an award has no line of its own');
  // A part's sum, or - since 2026-09-29 (owner, D8; sim/farm-sale.mjs) - the burned farm's own line.
  for (const line of worths) assert.match(line, /^(.+ counts \d+ × \d+ \((\d+ road miles from home|close to home)\) = \d+(, (taken away( twice over)?|counted as -?\d+))?(: -?\d+)?|A burned farm counts \d+) glory\.$/, line);
  const familyText = await student.locator('#ending').innerText();
  assert.doesNotMatch(familyText, /\(\d+\)\s*$/m, 'an award still ends in a bare number');
  assert.doesNotMatch(familyText, /\d\.\d+ reales?/, 'the coin is not in whole reales');
  assert.ok(familyText.includes(own.sumSaid), 'the sum is not said in sentences');
  const flightText = own.story.find(line => /in the spring/.test(line));
  if (world.households['hh-1'].flight?.status === 'fled') assert.match(flightText, /still on the road east/);
  if (world.households['hh-1'].flight?.status === 'refuged') assert.match(flightText, /camped at/);
  assert.doesNotMatch(familyText, VIRTUE, 'the family\'s page names a virtue');
  ok(`the family sees ${worths.length} awards each with its own sum ("${worths[0]}"), and its number said: "${own.sumSaid}"`);
  ok(`its spring as it was: "${flightText}"`);
  await shot(student, '#ending .ending-title', 'docs/evidence/ending-spring-family.png');
  await shot(student, '#ending section:has(> .ending-awards)', 'docs/evidence/ending-spring-family-awards.png');
  // A family with no award (3.6): the page drawn with the same reckoning and no awards.
  const empty = await student.evaluate(async family => {
    const { renderEnding } = await import('/ending.js');
    renderEnding({ ending: { family: { ...family, awards: [] } } });
    return document.querySelector('#ending').innerText;
  }, own);
  assert.match(empty, /No award was earned\./);
  assert.doesNotMatch(empty, /that October/);
  ok('a family with no award reads "No award was earned.", not "the events of that October"');
  await student.evaluate(() => [...document.querySelectorAll('#ending h3')].find(one => one.textContent === 'What earned glory').scrollIntoView({ block: 'start' }));
  await student.locator('#ending').screenshot({ path: 'docs/evidence/ending-spring-no-awards.png' });
  shots.push('docs/evidence/ending-spring-no-awards.png');
  assert.deepEqual(errors, [], errors.join(' | '));
  ok('no page error on either page');
} finally {
  writeFileSync('docs/evidence/ending-spring-browser.json', `${JSON.stringify({ at: new Date().toISOString(), flights, pass, errors, shots, host: { discussion: closing.discussion, families: closing.families.map(({ name, went, heard, heardAlamo, spring, farm, prisoners, money, glory, land, final }) => ({ name, went, heard, heardAlamo, spring, farm, prisoners, money, glory, land, final })) } }, null, 1)}\n`);
  await browser.close();
  await app.close();
  rmSync(folder, { recursive: true, force: true });
}
console.log(`\n${pass.length} checks passed.`);
