// A hunt, watched.
//
// tests/hunting.test.mjs proves the simulation: that a hunt is stages in a place rather
// than one spot, that the shot happens once and is written down, that nothing names the
// quarry. What it cannot prove is the thing the owner actually asked for - that you can
// *see* it. That needs a browser: the hunter has to move through the timber, the projected
// deer has to use its alert art at the decision, the poses have to change, and the smoke
// and homeward carry have to be painted.
//
// Run: npm run test:hunt
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom, PACES } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
// A settled class: these families are at home under a roof, as every class began before arrivals
// (docs/SETTLING_IN.md step 2). This proves the work, not the arrival - tests/arrival.test.mjs does that.
import { figureOf, GAIT_CEILING } from '../public/motion.js';
import { meetFamily } from './support/meet-family.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

// The hunter is the founding four's son, drawn as the adolescent boy he is (public/motion.js `figureOf`, sim/town.mjs `seenAs`).
const HUNTER_FIGURE = figureOf({ id: 'hh-1-mateo', kind: 'person', sex: 'male', band: 'youth' });
const app = createClassroom({ seed: 'hunt-proof', playerCount: 5, tickMs: 400, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
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
  await page.goto(url);
  await page.locator('[name=name]').fill('Hunt reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The title screen and the family made, before the world is drawn (public/creation.js, owner 2026-09-17).
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  await page.locator('#journal-toggle').click();
  await page.locator('[data-select="hh-1-mateo"]').click();
  await page.locator('#journal-close').click();
  await page.locator('#selection').waitFor({ state: 'visible' });
  // Before anybody sets out: a hand that has never had the knack can be taught one, and
  // the price of the lesson is on the button.
  // His work is on his row of the family panel (docs/FAMILY_PANEL.md); the price is in the icon's popup.
  await asMain(page, 'hh-1-mateo');
  const mateo = key => page.locator(`.panel-row[data-entity-id="hh-1-mateo"] .panel-icon[data-key="${key}"]`);
  const mark = `${await mateo('practise-shooting').getAttribute('data-name')}: ${await mateo('practise-shooting').getAttribute('data-note')}`;
  assert.match(mark, /2 powder/, `the mark does not state its price: "${mark}"`);
  ok(`a poor shot can be taught: "${mark}"`);
  app.setPace(PACES.brisk);
  await mateo('hunt-timber').click();
  // And then stop watching him. Choosing somebody in the journal locks the camera to them,
  // which pins the figure at the centre of the screen where it cannot appear to move at
  // all - the same trap the pace measurement fell into. The ordinary family frame is both
  // what a student is actually looking at and the only view in which "did he move" is a
  // question with an answer.
  await page.locator('#map-nav [data-view=follow]').click();

  // Follow the whole thing, sampling what was painted rather than what was sent. The
  // animation clip set is rebuilt every frame, so it has to be accumulated as it goes, and
  // the hunt now stops in the middle to ask - so this runs in two halves with the family's
  // answer between them, exactly as a class would.
  //
  // The road is watched from further out. In the family's frame here a figure is at its 7-pixel floor and a walker covers
  // about ten of his own heights a real second at the Brisk pace, so on the road he is faded out through the middle of it
  // (public/motion.js `travelSight`, owner's direction 2026-09-22) and his walk could be caught only in the hundred yards
  // at each end - which a busy machine may not paint. So while he is on the road the view is taken out, a press at a time,
  // until his drawn speed - the miles the server says a tick carries him, at this camera's pixels a mile, over the real
  // tick, against the figure's drawn height: the page's own formula - is under `GAIT_CEILING` with a margin, where nothing
  // fades and he is a figure walking the whole way; in the timber it goes back to the family's frame, where the timber
  // checks below were always made.
  const follow = (untilAsk) => page.evaluate(async ({ stopAtAsk, variant, below }) => {
    window.__huntWatch = window.__huntWatch || { clips: [], stages: [], timberSpots: [], sawSmoke: false, marks: [], road: [] };
    const seen = window.__huntWatch;
    const clips = new Set(seen.clips), stages = new Set(seen.stages);
    const nav = view => document.querySelector(`#map-nav [data-view=${view}]`);
    let pressed = 0;
    const start = performance.now();
    while (performance.now() - start < 300000) {
      const world = window.__snapshot?.world;
      const hunter = world?.entities.find(entity => entity.id === 'hh-1-mateo');
      if (!hunter) break;
      for (const clip of window.__animationClips || []) clips.add(clip);
      const camera = window.__camera, now = performance.now();
      if (hunter.travel && camera?.figure) {
        const miles = Number.isFinite(hunter.travel.step) ? hunter.travel.step : hunter.travel.speed;
        const speed = miles * camera.scale / camera.figure / (window.__snapshot.tickMs / 1000);
        if (speed >= below * 0.8) { if (now - pressed > 200) { nav('out').click(); pressed = now; } }
        else {
          const painted = [...(window.__animationClips || [])];
          seen.road.push({ doing: hunter.chore?.doing || null, speed: +speed.toFixed(3), scale: +camera.scale.toFixed(1), figure: camera.figure,
            alpha: window.__travelSight?.get('hh-1-mateo')?.alpha ?? 1, pageSpeed: window.__travelSight?.get('hh-1-mateo')?.heightsPerSecond ?? null,
            walk: painted.some(clip => clip.startsWith(`${variant}-walk`)), carry: painted.includes(`${variant}-carry`) });
        }
      } else if (!hunter.travel && camera && !camera.following && now - pressed > 200) { nav('follow').click(); pressed = now; }
      if ((window.__animationClips || new Set()).has('musket-smoke')) seen.sawSmoke = true;
      if (hunter.chore?.doing) stages.add(hunter.chore.doing);
      for (const mark of window.__viewMarks || []) {
        if (mark.id === 'hh-1-mateo' && !seen.marks.includes(mark.kind)) seen.marks.push(mark.kind);
      }
      const drawn = window.__drawnAt?.['hh-1-mateo'];
      // Where they were painted while standing in the timber, which is the part that has
      // to move. On the road they are obviously moving; that proves nothing here.
      if (drawn && !hunter.travel && hunter.location.siteId && hunter.location.siteId !== world.household.homeSiteId) {
        seen.timberSpots.push({ x: Math.round(drawn.x), y: Math.round(drawn.y), doing: hunter.chore?.doing });
      }
      if (stopAtAsk && hunter.chore?.ask) break;
      if (!stopAtAsk && !hunter.chore && stages.size) break;
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    seen.clips = [...clips]; seen.stages = [...stages];
    return { ...seen, asking: Boolean(window.__snapshot?.world.entities.find(e => e.id === 'hh-1-mateo')?.chore?.ask) };
  }, { stopAtAsk: untilAsk, variant: HUNTER_FIGURE, below: GAIT_CEILING });

  // ------------------------------------------------------ the work stops and asks the family
  const atAsk = await follow(true);
  assert.ok(atAsk.asking, 'the hunt ran to the end without ever asking the family anything');
  const question = (await page.locator('#selection-work .ask-text').textContent()).trim();
  const options = await page.locator('#selection-work button[data-action=answer-chore]').evaluateAll(buttons =>
    buttons.map(button => ({ option: button.dataset.option, label: button.querySelector('.work-name')?.textContent, note: button.querySelector('.work-note')?.textContent })));
  assert.equal(options.length, 3, `the family was offered ${options.length} answers`);
  assert.deepEqual(options.map(entry => entry.option), ['take', 'wait', 'leave']);
  for (const entry of options) assert.ok(entry.note && entry.note.length > 8, `"${entry.option}" says nothing about what it would do`);
  ok(`the hunt stops and asks: "${question}"`);
  ok(`and every answer says what it would cost before it is pressed \u2014 ${options.map(entry => `${entry.label} (${entry.note})`).join('; ')}`);
  assert.ok(atAsk.marks.includes('asking'), `nothing on the map said the hunt was waiting: ${JSON.stringify(atAsk.marks)}`);
  assert.ok(atAsk.clips.includes('deer-alert'), `the quarry did not look alert at the decision: ${JSON.stringify(atAsk.clips)}`);
  assert.ok(!atAsk.clips.includes('deer-bound'), 'the renderer invented an escape before the family answered');
  ok('the projected deer is visible and alert while the family decides, without inventing an escape');
  ok('and the person carries a mark, so a student looking at the map knows the hunt is waiting on them');
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/hunt-decision.png' });

  // The work must not go on past a question nobody has answered.
  const held = await page.evaluate(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-mateo').chore.step);
  await page.waitForTimeout(1200);
  const stillHeld = await page.evaluate(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-mateo').chore?.step);
  assert.equal(stillHeld, held, 'the work carried on past a question nobody had answered');
  ok('nothing moves while it waits: three ticks passed and the work had not gone a step further');

  await page.locator('#selection-work button[data-option=wait]').click();
  await page.waitForFunction(() => !window.__snapshot.world.entities.find(e => e.id === 'hh-1-mateo')?.chore?.ask);
  ok('the family answers, and the hunt goes on');

  const watched = await follow(false);

  // ------------------------------------------------------------------- the stages happened
  for (const stage of ['reading the ground at the edge of the timber', 'working up through the timber', 'waiting downwind, and still', 'the shot']) {
    assert.ok(watched.stages.includes(stage), `the class never saw "${stage}": ${JSON.stringify(watched.stages)}`);
  }
  ok(`a student watches four named stages of a hunt, not one: ${watched.stages.filter(s => !/road|home/.test(s)).map(s => `"${s}"`).join(', ')}`);

  // ------------------------------------------------------- and the figure moved through them
  const distinct = new Set(watched.timberSpots.map(spot => `${spot.x},${spot.y}`));
  assert.ok(watched.timberSpots.length > 3, `the hunter was painted in the timber ${watched.timberSpots.length} times`);
  assert.ok(distinct.size >= 3, `the hunter was painted in ${distinct.size} place(s) in the timber`);
  const xs = [...distinct].map(key => Number(key.split(',')[0]));
  const spread = Math.max(...xs) - Math.min(...xs);
  ok(`and is painted working through the trees, not standing on one spot (${distinct.size} places, ${spread}px apart on screen)`);

  // ------------------------------------------------------------------ with the right poses
  //
  // The hunter's own colour, not just any figure's. Three other people are standing about
  // the farm in this frame, and `-idle-s` from one of them would have satisfied a looser
  // check while the hunter did nothing at all - which is the weak assertion this replaced.
  const variant = HUNTER_FIGURE;
  const wanted = {
    reading: `${variant}-search`, still: `${variant}-idle-s`, carrying: `${variant}-carry`,
  };
  for (const [stage, clip] of Object.entries(wanted)) {
    assert.ok(watched.clips.includes(clip), `the hunter was never drawn ${stage} (${clip}): ${JSON.stringify(watched.clips)}`);
  }
  const walking = watched.clips.filter(clip => clip.startsWith(`${variant}-walk`));
  assert.ok(walking.length, `the hunter was never drawn walking: ${JSON.stringify(watched.clips)}`);
  ok(`the hunter's own poses change with the stages: ${[...Object.values(wanted), walking[0]].join(', ')}`);
  const bound = { ...wanted, walking: walking[0] };
  ok('and they are drawn carrying something home, which the carry cycle had never been used for outside the harvest');
  // On the road, a whole figure walking at a walk: under GAIT_CEILING by the page's own formula, the page itself agreeing,
  // nothing of him faded away (alpha 1), and the cycle painted - on many frames of each road, not one lucky frame of a fade.
  const onFoot = key => watched.road.filter(frame => frame[key] && frame.alpha === 1 && frame.speed < GAIT_CEILING && frame.pageSpeed !== null && frame.pageSpeed < GAIT_CEILING);
  const road = { out: onFoot('walk'), home: onFoot('carry') };
  const disagree = watched.road.filter(frame => frame.pageSpeed > 0 && Math.abs(frame.pageSpeed - frame.speed) > frame.speed * 0.05);
  assert.equal(disagree.length, 0, `the page measured his speed differently from its formula: ${JSON.stringify(disagree.slice(0, 3))}`);
  for (const [way, frames] of Object.entries(road)) {
    assert.ok(frames.length >= 12, `on the road ${way} he was drawn as a walking figure on ${frames.length} frames: ${JSON.stringify(watched.road.slice(-5))}`);
  }
  const widest = Math.max(...[...road.out, ...road.home].map(frame => frame.speed));
  ok(`on the road he is a figure, walking out (${road.out.length} frames) and carrying home (${road.home.length}), drawn at no more than ${widest.toFixed(2)} of his heights a second, under ${GAIT_CEILING}, at ${road.out[0].scale} pixels a mile`);

  // --------------------------------------------------------------------------- and the shot
  assert.ok(watched.sawSmoke, `no smoke was ever drawn: ${JSON.stringify(watched.clips)}`);
  ok('the shot is a puff of smoke in the trees; the server removes the projected deer after it');
  assert.ok(!watched.clips.some(clip => /volunteer|regular|military/.test(clip)),
    `a militia sheet was borrowed for a farmer: ${watched.clips.filter(c => /volunteer|regular/.test(c))}`);
  ok('no soldier appears in the timber: the militia firing sheets were not borrowed for a civilian');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/hunting-browser.json', JSON.stringify({
    record: 'hunting-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: [
      '"when they\'re out hunting, maybe i should see them actually hunting?"',
      '"polish hunting. it needs to be more than just [tell character to hunt and boom they do]."',
    ],
    theQuestion: question,
    theAnswers: options,
    checks: pass,
    measured: {
      stages: watched.stages,
      placesPaintedInTheTimber: distinct.size,
      screenSpreadPixels: spread,
      clipsBound: watched.clips.sort(),
      smokeDrawn: watched.sawSmoke,
      // The road watched from further out, where a walker is drawn inside his own gait and never fades (public/motion.js GAIT_CEILING).
      road: { gaitCeiling: GAIT_CEILING, walkingOutFrames: road.out.length, carryingHomeFrames: road.home.length, pixelsAMile: road.out[0].scale, figurePixels: road.out[0].figure, mostHeightsASecond: +widest.toFixed(3) },
    },
    notProved: [
      'That it reads as hunting to a twelve-year-old. Four stages, four poses, movement through the trees and a puff of smoke are what is measurably on screen; whether that says "hunting" is a classroom question.',
      'Escape and drinking behavior. Those authored clips are registered for later states, but this hunt projection does not supply either state.',
      'That the stages are the right length at the study pace. A hunt spends six to eight ticks in the timber, which is about a minute; nobody has watched one at that speed.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/hunting-browser.json');
} finally {
  await browser.close();
  await app.close();
}
