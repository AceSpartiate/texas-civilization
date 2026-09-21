// The same journey at a slow clock and a fast one, proved in a real browser.
//
// Owner, 2026-09-21, after a real class played it on Chromebooks: "students saw characters moving too fast. i thought we
// were going to use fog of war for that? if they're moving too fast then players shouldn't be able to follow them until
// they arrive." The rule is sim/sight.mjs and the unit tests are tests/travel-sight.test.mjs; what only a browser can
// answer is whether the page actually draws a figure in the one case and nothing at all in the other, and whether the
// student is left knowing where their person went.
//
// Two classes are played, both on the real land, both sending the same person on foot from their own land to Gonzales:
//   1. the farming day (twenty minutes a tick, a mile of road): the walker is drawn, walking, and the card says how far
//      along they are;
//   2. the gathering (four hours a tick, three and a half miles of road): the server sends no place for them at all, the
//      page draws nobody, and the card says where they went, how far is left and roughly when they will be there. The
//      teacher's own page, looking at the same class on the same tick, still has them on the road.
// Screenshots go to docs/evidence/travel-sight/, the numbers to docs/evidence/travel-sight.json.
//
// Same computer only: headless Chrome, 1280 x 850. Nothing here is a Chromebook or a classroom projector.
// Run: npm run test:travel-sight   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the other proofs)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { WATCHABLE_MILES_A_TICK } from '../sim/sight.mjs';
import { keepFoundingFamilies, settle } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const WRITE = !process.env.PROOF_NO_WRITE;
const SHOTS = 'docs/evidence/travel-sight';
const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

/** A class on the real land with every family already on its own land under a roof, as the other proofs start one. */
const onTheLand = (seed, count) => keepFoundingFamilies(settle(createGonzalesWorld(seed, count, { map: 'colonies' })));

/**
 * The same class, played in process to October 3 and handed back to the lobby: the gathering, where the calendar is four
 * hours a tick (sim/clock.mjs `CALENDAR_SCALE`) and a man on his own feet covers three and a half miles between two
 * painted frames. This is a real state of a real class, reached the way a class reaches it, not a phase poked in.
 */
function atTheGathering(seed, count) {
  const world = onTheLand(seed, count);
  world.status = 'running';
  for (let i = 0; i < 4000 && !(world.director.phase === 'gathering' && calendarMinutes(world) === 240); i++) stepWorld(world);
  assert.equal(world.director.phase, 'gathering', 'the class never reached the gathering');
  assert.equal(calendarMinutes(world), 240, 'the gathering is not on the four-hour clock');
  world.status = 'lobby';
  return world;
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [], record = {};
const shots = [];

/**
 * One class played through to a person walking to Gonzales, with the student's page and the teacher's page both open, and
 * everything the two of them show of that person read off at the same moment.
 */
async function play(name, { worldFactory, tickMs }) {
  const app = createClassroom({ seed: `travel-sight-${name}`, playerCount: 5, tickMs, worldFactory });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const post = async (path, body, cookie) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
    return response;
  };
  // The teacher's page keeps its own browser context: a host cookie in the student's jar makes every order the student
  // gives come back "Host action unavailable" (found the first time this proof was run).
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: 'no-preference' });
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: 'no-preference' });
  try {
    const hostReply = await post('/api/host', { key: app.state.hostKey });
    const hostCookie = hostReply.headers.get('set-cookie').split(';')[0];
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${name} student: ${error.message}`));
    await page.goto(url);
    await page.locator('[name=name]').fill('Sight reader');
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(page);
    for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
    await post('/api/command', { id: `start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
    for (const id of ['#journal-close', '#wagon-done', '#tutorial-skip', '#house-close', '#plot-close']) {
      if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click().catch(() => {});
    }
    await page.getByRole('button', { name: /No thanks/ }).click().catch(() => {});
    // The teacher's own page on the same class, opened before the journey so it is looking at the same ticks.
    const host = await hostContext.newPage();
    host.on('pageerror', error => errors.push(`${name} host: ${error.message}`));
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world?.role === 'host', null, { timeout: 60000 });

    const main = await page.waitForFunction(() => {
      const world = window.__snapshot?.world;
      const person = world?.entities.find(entity => entity.principal);
      return person && !person.travel && person.location?.siteId ? person.id : null;
    }, null, { timeout: 120000, polling: 100 }).then(handle => handle.jsonValue());
    const sent = await page.evaluate(async id => {
      const command = body => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${body.action}-${crypto.randomUUID()}`, entityId: id, ...body }) });
      await command({ action: 'stop-chore' });
      const response = await command({ action: 'travel', destination: 'gonzales', mode: 'foot' });
      return { status: response.status, text: await response.text() };
    }, main);
    assert.equal(sent.status, 200, `sending ${main} to Gonzales: ${sent.text}`);
    // A rider standing at the gate holds the whole class's calendar at the farming scale for as long as the family has not
    // answered him (sim/clock.mjs `deciding`), which is right and is exactly why this proof kept finding a four-hour class
    // running at twenty minutes a tick. So any rider waiting is heard and let go before the road is read.
    const answerRiders = async () => {
      for (let i = 0; i < 4; i++) {
        const listener = await page.evaluate(() => (window.__snapshot?.world?.encounter?.status === 'open' ? window.__snapshot.world.encounter.listenerId : null));
        if (!listener) return;
        await page.locator(`.panel-portrait[data-portrait="${listener}"]`).click().catch(() => {});
        await page.waitForTimeout(400);
        for (const control of ['#listen-rider', '#encounter .ask-leave', '#encounter-close']) {
          if (await page.locator(control).isVisible().catch(() => false)) await page.locator(control).click().catch(() => {});
          await page.waitForTimeout(400);
        }
      }
    };
    // On the road and past the tick they set out on, with the class's own calendar actually in force.
    const wanted = name === 'fast';
    for (let deadline = Date.now() + 180000; ;) {
      await answerRiders();
      const state = await page.evaluate(id => {
        const person = window.__snapshot.world.entities.find(entity => entity.id === id);
        return person?.travel ? { away: Boolean(person.travel.away), progress: person.travel.progress ?? null, miles: person.travel.miles ?? null } : null;
      }, main);
      if (state && (wanted ? state.away && state.miles > 0 : !state.away && state.progress > 0)) break;
      assert.ok(Date.now() < deadline, `${name}: the journey never reached the state this proof reads: ${JSON.stringify(state)}`);
      await page.waitForTimeout(400);
    }
    // The person's card open, which is where a student is told what became of them.
    await page.locator(`.panel-portrait[data-portrait="${main}"]`).click();
    await page.waitForTimeout(900);

    const seen = await page.evaluate(id => {
      const world = window.__snapshot.world, person = world.entities.find(entity => entity.id === id);
      const drawn = window.__drawnAt?.[id] || null;
      const panel = document.querySelector(`.panel-row[data-entity-id="${id}"]`);
      const reason = panel?.querySelector('.panel-reason')?.textContent
        || [...(panel?.querySelectorAll('.panel-icon[aria-disabled=true]') || [])].map(icon => icon.dataset.note).find(note => note) || '';
      return {
        minute: world.minute, tickMs: window.__snapshot.tickMs,
        location: person.location, away: Boolean(person.travel?.away),
        travel: person.travel && { to: person.travel.to, miles: person.travel.miles ?? null, back: person.travel.back ?? null, progress: person.travel.progress ?? null, step: person.travel.step ?? null, points: person.travel.points?.length ?? 0 },
        drawn: drawn ? { x: Math.round(drawn.x), y: Math.round(drawn.y) } : null,
        card: document.querySelector('#selection-state')?.textContent || '',
        row: reason,
        spoken: document.querySelector('#world-description')?.textContent || '',
      };
    }, main);
    const teacher = await host.evaluate(id => {
      const world = window.__snapshot.world, seen = (world.others || []).find(entity => entity.id === id);
      const family = window.__hostLive?.families?.find(one => one.id === 'hh-1');
      return {
        location: seen?.location || null, road: seen?.travel?.points?.length || 0, progress: seen?.travel?.progress ?? null,
        drawn: window.__drawnAt?.[id] ? true : false,
        where: family?.people?.map(person => person.where) || [],
      };
    }, main);
    if (WRITE) {
      mkdirSync(SHOTS, { recursive: true });
      const student = `${SHOTS}/${name}-student.png`, teacherShot = `${SHOTS}/${name}-host.png`;
      await page.screenshot({ path: student });
      await host.screenshot({ path: teacherShot });
      shots.push(student, teacherShot);
    }
    return { person: main, seen, teacher };
  } finally {
    await context.close();
    await hostContext.close();
    await app.close();
  }
}

try {
  // -------------------------------------------------------------------- 1. the farming day: a mile a tick, and watched
  record.slow = await play('slow', { worldFactory: onTheLand, tickMs: 2500 });
  const slow = record.slow.seen;
  ok(`at twenty minutes a tick the walker is on the map, ${slow.travel.step} mile a tick, and the page draws them`,
    slow.away === false && slow.location && slow.drawn && slow.travel.points > 1 && slow.travel.step <= WATCHABLE_MILES_A_TICK);
  ok(`and the card says how far along the road they are: "${slow.card}"`, /On the road to Gonzales · \d+%/.test(slow.card));
  ok('the teacher sees the same walker on the same road', Boolean(record.slow.teacher.location) && record.slow.teacher.road > 1);

  // ------------------------------------------------- 2. the gathering: three and a half miles a tick, and out of sight
  record.fast = await play('fast', { worldFactory: atTheGathering, tickMs: 2500 });
  const fast = record.fast.seen;
  if (process.env.PROOF_DEBUG) console.log(JSON.stringify(record.fast, null, 2));
  ok('at four hours a tick the server sends no place for them at all', fast.away === true && fast.location === null && fast.travel.points === 0);
  ok('and no road, no progress and no pace with it', fast.travel.progress === null && fast.travel.step === null);
  ok('so the page draws nobody: there is no figure to skate across the map', fast.drawn === null);
  ok(`the card says what became of them: "${fast.card}"`, /^Away on the road to Gonzales · about \d+ miles off · should be there /.test(fast.card));
  ok(`their row on the family panel says the same: "${fast.row}"`, /is away on the road to Gonzales, about \d+ miles off, and should be there /.test(fast.row));
  ok(`and the page says it aloud for a screen reader: "${fast.spoken.slice(0, 120)}"`, /is away on the road to Gonzales/.test(fast.spoken));
  ok(`the teacher is not a family and still has them on the road at ${JSON.stringify(record.fast.teacher.location)}`,
    Boolean(record.fast.teacher.location) && record.fast.teacher.road > 1 && Number.isFinite(record.fast.teacher.progress));
  ok(`and the teacher's class panel says where they are: "${record.fast.teacher.where.find(where => /road/.test(where))}"`,
    record.fast.teacher.where.some(where => /on the road to Gonzales/.test(where)));
  assert.deepEqual(errors, [], 'the pages raised errors');
  ok('the pages raised no errors');
} finally {
  await browser.close();
}

if (WRITE) {
  writeFileSync('docs/evidence/travel-sight.json', `${JSON.stringify({
    record: 'travel-sight-browser',
    date: new Date().toISOString().slice(0, 10),
    ownerDirection: 'Owner, 2026-09-21, after a real class on Chromebooks: "students saw characters moving too fast. i thought we were going to use fog of war for that? if they\'re moving too fast then players shouldn\'t be able to follow them until they arrive."',
    how: 'node scripts/travel-sight-proof.mjs: two classes on the real land, five families, a student page and the teacher\'s page open on each, both sending the same person on foot from their own land to Gonzales. The first runs the farming day (twenty minutes a tick); the second is played in process to October 3 first, so it runs the gathering (four hours a tick). Headless Chrome 1280x850 on this computer.',
    threshold: { milesATick: WATCHABLE_MILES_A_TICK },
    ...record,
    screenshots: shots,
    pass,
    limitations: [
      'Same computer, headless Chrome. Nothing here is a Chromebook, a classroom projector or a physical LAN.',
      'On foot at two of the four calendars. The horse, the ox wagon and a courier at every calendar are the same rule on other numbers (tests/travel-sight.test.mjs).',
    ],
  }, null, 2)}\n`);
  console.log('wrote docs/evidence/travel-sight.json');
}
