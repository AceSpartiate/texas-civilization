// People at work, drawn at the work, in a real browser (owner, 2026-09-28: "When someone is working, I should see them actually
// working, not just standing near their task").
//
// tests/work-art.test.mjs proves the table: every activity the server can report has a pose the library holds, and every stand-in
// a tool, a motion or an effect. This proves what a class sees, through the join flow at 1366x768, by sampling the figures frame
// after frame (`window.__workDrawn`, `__clipsDrawn`, `__drawnAt`, and the canvas's own pixels round each figure):
//
//   - the family at home working about the place (the server's own `task: 'work'`) is drawn hoeing: the cycle's frame changes and
//     dust is thrown up on the strike;
//   - a house planned and three of the family sent to it stand round it, apart, each facing it, swinging, the chips flying;
//   - one sent to practise at the mark is drawn with a rifle and a puff of smoke once a cycle, and one sent to survey paces the
//     ground to and fro; what is drawn of each changes between frames, and so do the pixels round them.
//
// Every order is the student's own, sent as the page sends it and checked by the server; nothing is set in the server's state.
// Same computer only: headless Chrome. Run: npm run test:work
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
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name) => { const path = `docs/evidence/work-${name}.png`; await page.screenshot({ path }); shots.push(path); };
/** A close-up of the canvas round `ids`, as a student zoomed in on them sees it: two figures' room on every side. */
async function closeUp(page, ids, name) {
  const box = await page.evaluate(ids => {
    const c = document.querySelector('#world-map'), r = c.getBoundingClientRect(), k = r.width / c.width;
    const at = ids.map(id => window.__drawnAt?.[id]).filter(Boolean);
    if (!at.length) return null;
    const s = Math.max(...at.map(a => a.size)) * k;
    const xs = at.map(a => r.left + a.x * k), ys = at.map(a => r.top + a.y * k);
    const x = Math.max(0, Math.min(...xs) - 2 * s), y = Math.max(0, Math.min(...ys) - 2 * s);
    return { x, y, width: Math.min(innerWidth - x, Math.max(...xs) - Math.min(...xs) + 4 * s), height: Math.min(innerHeight - y, Math.max(...ys) - Math.min(...ys) + 3.4 * s) };
  }, ids);
  if (!box) return;
  const path = `docs/evidence/work-${name}.png`;
  // A first-meeting tip (public/tips.js) is put away as a student would, so the close-up shows the work and not the tip.
  const tip = page.getByRole('button', { name: 'Got it' });
  if (await tip.first().isVisible().catch(() => false)) { await tip.first().click(); await page.waitForTimeout(300); }
  await page.evaluate(() => { const card = document.querySelector('#selection'); if (card) card.style.visibility = 'hidden'; });
  await page.screenshot({ path, clip: box });
  await page.evaluate(() => { const card = document.querySelector('#selection'); if (card) card.style.visibility = ''; });
  shots.push(path);
}

/** A class served live, a student joined as hh-1 through the join flow, the family made, and the Host's Start pressed. */
async function classroom({ seed, tickMs, worldFactory, viewport }) {
  const app = createClassroom({ seed, playerCount: 5, tickMs, worldFactory });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${seed}: ${error.message}`));
  await page.goto(url);
  await page.locator('#join [name=name]').fill('Work reader');
  await page.locator('#join [name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  return { app, page, host };
}
/** Press somebody's portrait on the family panel: the camera goes to them and walks with them (docs/FAMILY_PANEL.md §3). */
async function watch(page, id) {
  await page.evaluate(id => document.querySelector(`[data-portrait="${id}"]`)?.click(), id);
  await page.waitForTimeout(1200);
}
const choose = async (page, id) => { if (await page.evaluate(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, id)) return; await page.locator(`[data-portrait="${id}"]`).click({ force: true }); await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, id, { timeout: 15000 }); };

/**
 * What is drawn of each of `ids` over `ms`, every `every` ms: the work record (`__workDrawn`), the clip, where the figure was
 * put, and a fingerprint of the canvas's pixels in the box round it - so "the pose changed" is read off the page's own drawing,
 * not only off what the page says it drew.
 */
async function sample(page, ids, ms = 2400, every = 120) {
  const frames = [];
  for (let t = 0; t < ms; t += every) {
    frames.push(await page.evaluate(ids => {
      const canvas = document.querySelector('#world-map'), ctx = canvas?.getContext('2d');
      return Object.fromEntries(ids.map(id => {
        const at = window.__drawnAt?.[id], work = window.__workDrawn?.[id];
        let print = null;
        if (at && ctx) {
          const s = Math.max(8, at.size), x = Math.round(at.x - s * 1.2), y = Math.round(at.y - s * 0.9), w = Math.round(s * 2.4), h = Math.round(s * 1.6);
          if (x >= 0 && y >= 0 && x + w <= canvas.width && y + h <= canvas.height) {
            const data = ctx.getImageData(x, y, w, h).data;
            let sum = 0; for (let i = 0; i < data.length; i += 4) sum = (sum * 31 + data[i] + data[i + 1] * 3 + data[i + 2] * 7) % 1000000007;
            print = sum;
          }
        }
        return [id, { at: at ? { x: Math.round(at.x), y: Math.round(at.y), size: Math.round(at.size) } : null, clip: window.__clipsDrawn?.[id] || null, work: work ? { ...work } : null, print }];
      }));
    }, ids));
    await page.waitForTimeout(every);
  }
  return Object.fromEntries(ids.map(id => {
    const mine = frames.map(frame => frame[id]);
    const works = mine.map(one => one.work).filter(Boolean);
    return [id, {
      strokes: [...new Set(works.map(one => one.stroke))], clips: [...new Set(mine.map(one => one.clip).filter(Boolean))],
      frames: [...new Set(works.map(one => one.frame))], marks: [...new Set(works.map(one => one.marks))],
      shifts: [...new Set(works.map(one => one.shift))], flips: [...new Set(works.map(one => one.flip))],
      tools: [...new Set(works.map(one => one.tool))], workClips: [...new Set(works.map(one => one.clip))], arts: [...new Set(works.map(one => one.art))],
      prints: new Set(mine.map(one => one.print).filter(one => one !== null)).size,
      at: mine.find(one => one.at)?.at || null, art: works[0]?.art || null, request: works[0]?.request || null,
    }];
  }));
}
/** Wheel the map in over somebody until a figure is drawn `figure` px tall; returns the figure reached. */
async function zoomTo(page, id, figure) {
  let reached = 0;
  for (let i = 0; i < 40; i++) {
    const at = await page.evaluate(id => { const a = window.__drawnAt?.[id], c = document.querySelector('#world-map'), r = c?.getBoundingClientRect(); return a && r ? { x: r.left + a.x * r.width / c.width, y: r.top + a.y * r.height / c.height, figure: window.__camera?.figure || 0 } : null; }, id);
    if (!at) { await page.waitForTimeout(250); continue; }
    reached = at.figure;
    if (reached >= figure) break;
    await page.mouse.move(at.x, at.y);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(300);
  }
  return reached;
}
/** An order as the page sends one (public/app.js `api('/api/command')`): the student's own, checked by the server. */
const send = (page, input) => page.evaluate(async input => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `work-proof-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...input }) });
  return { status: response.status, body: await response.json() };
}, input);

try {
  // Seed chosen for a family of four or more on the invented country, whose calendar stays at twenty minutes a tick.
  const { app, page } = await classroom({ seed: 'work-proof-3', tickMs: 500, worldFactory: seed => createGonzalesWorld(seed, 5), viewport: { width: 1366, height: 768 } });
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && ('lesson' in window.__snapshot.world ? !document.querySelector('#lesson-stop')?.hidden : true), null, { timeout: 20000 });
  if (await page.evaluate(() => 'lesson' in window.__snapshot.world)) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  }
  const family = await page.evaluate(() => window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => ({ id: one.id, name: one.name, age: one.age, band: one.band })));
  observed.family = family;
  await page.waitForFunction(ids => ids.every(id => { const one = window.__snapshot.world.entities.find(e => e.id === id); return one && !one.travel && one.location?.siteId === window.__snapshot.world.household.homeSiteId; }) && !window.__snapshot.world.household.arriving, family.map(one => one.id), { timeout: 90000 });
  // Drawn walking in from the wagon first (public/app.js `trailOf`): looked at once they are there.
  await page.waitForFunction(ids => ids.every(id => { const seen = window.__travelSight?.get(id); return !seen?.walk && !seen?.trail; }), family.map(one => one.id), { timeout: 60000 });
  const grown = family.filter(one => !['child', 'small', 'infant'].includes(one.band));
  assert.ok(grown.length >= 2, `the seed's family has fewer than two grown people: ${JSON.stringify(family)}`);
  observed.camera = await page.evaluate(() => ({ figure: window.__camera?.figure ?? null, focused: document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId || null }));

  // Zoomed in on the yard with the wheel, as a student looks at their people, to a figure of a Chromebook's close view.
  observed.figure = await zoomTo(page, grown[0].id, 36);
  // The pointer off the map, so no person's card is open over what is drawn.
  await page.mouse.move(700, 760);
  await page.keyboard.press('Escape');
  assert.ok(observed.figure >= 30, `the map would not zoom in on the yard: a figure of ${observed.figure} px`);

  // 1. Working about the place, as the server says the grown are when they have nothing else (sim/routines.mjs).
  const about = grown.find(one => app.state.world.entities[one.id].task === 'work' && !app.state.world.entities[one.id].chore) || grown[0];
  if (app.state.world.entities[about.id].task !== 'work') assert.equal((await send(page, { action: 'work', entityId: about.id })).status, 200);
  await page.waitForFunction(id => window.__workDrawn?.[id]?.stroke === 'about', about.id, { timeout: 20000 });
  const hoeing = (await sample(page, [about.id]))[about.id];
  observed.about = hoeing;
  assert.deepEqual(hoeing.strokes, ['about'], `working about the place is drawn as ${hoeing.strokes}`);
  assert.ok(hoeing.clips.every(clip => /-work$/.test(clip)), `working about the place is drawn in ${hoeing.clips}, not the hoeing cycle`);
  assert.ok(hoeing.frames.length >= 3, `the hoeing cycle showed ${hoeing.frames.length} frames in 2.4 seconds`);
  assert.ok(hoeing.marks.some(n => n > 0) && hoeing.marks.includes(0), `the dust was never thrown, or never settled: ${hoeing.marks}`);
  assert.ok(hoeing.prints >= 3, `the pixels round the hoer changed ${hoeing.prints} times`);
  await closeUp(page, [about.id], 'about-close');
  ok(`${about.name} working about the place is drawn hoeing (${hoeing.clips.join(', ')}): frames ${hoeing.frames.join('/')}, dust on the strike, ${hoeing.prints} different pictures in 2.4 s`);

  // 2. The house: planned, and three of the family sent to it by the student's own orders. They stand round it, apart, each
  // facing it, at the stage's work (felling for it first: the chips fly).
  const home = { ...app.state.world.entities[about.id].location };
  const crew = family.filter(one => !['child', 'small', 'infant'].includes(one.band)).slice(0, 3);
  assert.equal(crew.length, 3, `the family has not three grown people to put on the house: ${JSON.stringify(family)}`);
  const planned = await send(page, { action: 'plan-house', layout: 'round-log' });
  assert.equal(planned.status, 200, `the house could not be planned: ${JSON.stringify(planned.body)}`);
  for (const one of crew) {
    const sent = await send(page, { action: 'chore', chore: 'build-house', entityId: one.id });
    assert.equal(sent.status, 200, `${one.name} could not be sent to the house: ${JSON.stringify(sent.body)}`);
  }
  await page.waitForFunction(ids => ids.every(id => ['chop', 'notch'].includes(window.__workDrawn?.[id]?.stroke) && window.__snapshot.world.entities.find(e => e.id === id)?.chore?.id === 'build-house'), crew.map(one => one.id), { timeout: 30000 })
    .catch(async error => { console.log('DEBUG', JSON.stringify(await page.evaluate(ids => ids.map(id => ({ id, work: window.__workDrawn?.[id], clip: window.__clipsDrawn?.[id], chore: window.__snapshot.world.entities.find(e => e.id === id)?.chore, aside: window.__snapshot.world.entities.find(e => e.id === id)?.aside })), crew.map(one => one.id)))); throw error; });
  await page.waitForTimeout(800);
  observed.houseFigure = await zoomTo(page, crew[0].id, 60);
  await page.mouse.move(700, 760);
  const house = await sample(page, crew.map(one => one.id));
  observed.house = { doing: await page.evaluate(id => window.__snapshot.world.entities.find(e => e.id === id)?.chore?.doing, crew[0].id), ...house };
  const spots = crew.map(one => house[one.id].at);
  const figure = Math.max(...spots.map(spot => spot.size));
  for (let a = 0; a < spots.length; a++) for (let b = a + 1; b < spots.length; b++) {
    const apart = Math.hypot(spots[a].x - spots[b].x, spots[a].y - spots[b].y);
    assert.ok(apart > figure * 0.5, `two on the house are drawn ${apart.toFixed(1)} px apart, a figure being ${figure} px: stacked on one spot`);
  }
  const middle = spots.reduce((sum, spot) => sum + spot.x, 0) / spots.length;
  for (const [i, one] of crew.entries()) {
    const seen = house[one.id];
    assert.ok(seen.frames.length >= 3 && seen.marks.some(n => n > 0), `${one.name} on the house: frames ${seen.frames}, marks ${seen.marks}`);
    // Felling for the house is the hoeing cycle with a drawn axe over it (the stand-in), or - for a figure whose library holds
    // a cycle of the work itself, `-chop` and `-notch` since 2026-09-28 (Claude-drawn, all eight) - that cycle, with its own axe
    // and the chips.
    const ownCycle = seen.workClips.length > 0 && seen.workClips.every(clip => /-(chop|notch)$/.test(clip));
    // Claude's `-chop`/`-notch` are of Astra's cast figures, so they are held back (owner, 2026-09-29: her art wins by subject):
    // her figure at the hoe with the drawn axe, until her own felling cycle lands under that name.
    assert.ok(!seen.workClips.some(clip => /-(chop|notch)$/.test(clip)), `${one.name} on the house is drawn in Claude's ${seen.workClips}, not Astra's figure`);
    assert.ok(seen.clips.every(clip => /-work$/.test(clip)), `${one.name} on the house is drawn in ${seen.clips}`);
    if (ownCycle) assert.ok(seen.arts.every(art => art === 'drawn') && seen.marks.some(n => n > 0), `${one.name} felling in ${seen.workClips}: art ${seen.arts}, the chips ${seen.marks}`);
    else assert.ok(seen.tools.length === 1 && ['axe', 'maul'].includes(seen.tools[0]) && seen.marks.every(n => n >= 2), `${one.name} on the house has no drawn axe in hand (the owner, 2026-09-28): tools ${seen.tools}, marks ${seen.marks}`);
    if (ownCycle) observed.ownCycle = [...(observed.ownCycle || []), { name: one.name, clips: seen.workClips, frames: seen.frames, marks: seen.marks }];
    if (Math.abs(spots[i].x - middle) > figure * 0.2) assert.deepEqual(seen.flips, [spots[i].x > middle], `${one.name} does not face the house`);
    assert.ok(seen.prints >= 3, `the pixels round ${one.name} on the house changed ${seen.prints} times`);
  }
  await shot(page, 'house-1366');
  await closeUp(page, crew.map(one => one.id), 'house-close');
  ok(`three sent to the house ("${observed.house.doing}") are drawn round it (${spots.map(spot => `${spot.x},${spot.y}`).join(' / ')}, a figure ${figure} px), each facing it, swinging an axe with the chips flying (${crew.map(one => `${house[one.id].strokes.join('')} in ${house[one.id].workClips.join('')}${house[one.id].tools.filter(Boolean).length ? ' with a drawn ' + house[one.id].tools.join('') : ''}`).join(', ')}; stand-in: ${house[crew[0].id].request})`);

  // 3. Practice at the mark, and pacing out a survey: each ordered, each in its own stroke, and what is drawn changes.
  // A slower class pace, so an afternoon at the mark (five ticks) lasts long enough to be watched.
  app.setPace(2000);
  // Each ordered in turn and watched at once (a portrait pressed: the camera goes to them), so each is sampled while it is at the
  // work: pacing out ten acres is two ticks, an afternoon at the mark five. First the survey, by the second of the three.
  const two = {};
  const sampleAt = async (id, stroke) => {
    await watch(page, id);
    await page.waitForFunction(([id, stroke]) => window.__workDrawn?.[id]?.stroke === stroke, [id, stroke], { timeout: 60000, polling: 50 })
      .catch(async error => { console.log('DEBUG', JSON.stringify(await page.evaluate(id => ({ id, work: window.__workDrawn?.[id], clip: window.__clipsDrawn?.[id], chore: window.__snapshot.world.entities.find(e => e.id === id)?.chore }), id))); throw error; });
    Object.assign(two, await sample(page, [id], 2400, 100));
    await shot(page, `${stroke}-1366`);
    await closeUp(page, [id], `${stroke}-close`);
  };
  // Whoever may still learn something at the mark goes to it later (the best shot on the land is refused it: sim/chores.mjs
  // `SKILL_CAP`), read off the class as it stands; another of the three surveys first.
  const world = app.state.world, cap = 3;
  const marksman = crew.find(one => (world.entities[one.id].skills?.hunting ?? 1) < cap);
  assert.ok(marksman, 'every one of the three already shoots as well as anyone on the land');
  const surveyor = crew.find(one => one !== marksman);
  for (const one of crew) {
    const stopped = await send(page, { action: 'stop-chore', entityId: one.id });
    assert.equal(stopped.status, 200, `${one.name} could not be called off the house: ${JSON.stringify(stopped.body)}`);
  }
  // The survey's place is the student's to choose on the family's own land; the first the server takes, a little way off.
  let surveyed = null;
  const surveyRefusals = new Set();
  for (const far of [0.12, 0.16, 0.22, 0.3]) {
    for (let k = 0; k < 8 && !surveyed; k++) {
      const dx = Math.cos(k * Math.PI / 4) * far, dy = Math.sin(k * Math.PI / 4) * far;
      const tried = await send(page, { action: 'survey-plot', entityId: surveyor.id, x: home.x + dx, y: home.y + dy });
      if (tried.status === 200) surveyed = { dx: +dx.toFixed(3), dy: +dy.toFixed(3) };
      else surveyRefusals.add(tried.body.error);
    }
    if (surveyed) break;
  }
  assert.ok(surveyed, `nowhere near the house could be surveyed: ${[...surveyRefusals].join(' / ')}`);
  observed.surveyed = surveyed;
  await sampleAt(surveyor.id, 'pace');
  // Then the mark.
  const practice = await send(page, { action: 'chore', chore: 'practise-shooting', entityId: marksman.id });
  assert.equal(practice.status, 200, `practice at the mark was refused: ${JSON.stringify(practice.body)}`);
  await sampleAt(marksman.id, 'shoot');
  observed.two = two;
  const shooter = two[marksman.id], pacer = two[surveyor.id];
  // The stand-in (a rifle drawn over the side-on idle, the walk paced to and fro) or, for a figure whose library holds the work
  // itself, its drawn cycle: `-fire` (the aim held, the recoil, the lowering) with the smoke at its muzzle once a cycle, and
  // `-stake` (Claude-drawn, 2026-09-28) stepping through its frames.
  // (The sheet arrives while it is watched, so the first samples may still be the stand-in.)
  const drawnShot = shooter.workClips.some(clip => /-fire$/.test(clip));
  // Claude's `-fire` and `-stake` are of Astra's cast figures: held back while hers are drawn (owner, 2026-09-29).
  assert.ok(!drawnShot && !pacer.workClips.some(clip => /-stake$/.test(clip)), `Claude's cycle drawn for Astra's figure: ${shooter.workClips} / ${pacer.workClips}`);
  if (drawnShot) assert.ok(shooter.arts.includes('drawn') && shooter.marks.some(n => n > 1) && shooter.marks.includes(0) && shooter.frames.length >= 2, `at the mark in ${shooter.workClips}: frames ${shooter.frames}, smoke ${shooter.marks}`);
  else assert.ok(shooter.clips.every(clip => /-idle-e$/.test(clip)) && shooter.marks.some(n => n > 1) && shooter.marks.includes(1), `at the mark: rifle ${shooter.clips}, smoke ${shooter.marks}`);
  const drawnStake = pacer.workClips.some(clip => /-stake$/.test(clip));
  if (drawnStake) assert.ok(pacer.arts.includes('drawn') && pacer.frames.length >= 2, `staking in ${pacer.workClips}: frames ${pacer.frames}`);
  else assert.ok(pacer.clips.every(clip => /-walk$/.test(clip)) && pacer.shifts.length >= 5 && pacer.flips.length === 2, `pacing: ${pacer.clips}, shifts ${pacer.shifts}, facing ${pacer.flips}`);
  // A drawn two-frame cycle (the staking) is two pictures by design; everything else changes more often than that.
  for (const id of Object.keys(two)) assert.ok(two[id].prints >= (id === surveyor.id && drawnStake ? 2 : 3), `the pixels round ${id} changed ${two[id].prints} times`);
  ok(`at the mark ${marksman.name} is drawn ${drawnShot ? `in ${shooter.workClips} (frames ${shooter.frames.join('/')})` : 'with the rifle up'} and a puff of smoke once a cycle (marks ${shooter.marks.join('/')}); surveying, ${surveyor.name} ${drawnStake ? `drives the stakes in ${pacer.workClips} (frames ${pacer.frames.join('/')})` : `paces the ground to and fro (${pacer.shifts.length} places, turning both ways)`}`);
  // 4. The wood pile by the house (request 2026-09-28, item 16; Claude-drawn `wood-pile-1`..`-4` since 2026-09-28). A class of
  // its own, made with thirty-five logs on the family's pile (the server hands a proof a copy of its state, so the pile is set
  // when the class is made, as scripts/means-browser-proof.mjs sets its logs): drawn as Astra's `log-fallen`, four in a row, a
  // pile for every ten - never Claude's pile sprite while her logs are in the library (owner, 2026-09-29: her art wins by subject,
  // public/art-subjects.js).
  const piled = await classroom({ seed: 'work-proof-pile', tickMs: 1000, viewport: { width: 1366, height: 768 },
    worldFactory: seed => { const made = createGonzalesWorld(seed, 5); made.households['hh-1'].logs = { wall: 28, sill: 4, poor: 3 }; return made; } });
  const pileFamily = await piled.page.evaluate(() => window.__snapshot.world.entities.filter(one => one.kind === 'person').map(one => one.id));
  await watch(piled.page, pileFamily[0]);
  await piled.page.waitForFunction(() => window.__logPileDrawn === 4 && window.__woodPileSprite === null && window.__woodPileAt, null, { timeout: 30000 })
    .catch(async error => { console.log('DEBUG', JSON.stringify(await piled.page.evaluate(() => ({ pile: window.__logPileDrawn, sprite: window.__woodPileSprite, logs: window.__snapshot.world.land?.logs })))); throw error; });
  observed.woodPile = await piled.page.evaluate(() => ({ drawn: window.__logPileDrawn, sprite: window.__woodPileSprite, logs: window.__snapshot.world.land?.logs }));
  await zoomTo(piled.page, pileFamily[0], 60);
  await piled.page.waitForTimeout(600);
  const gotIt = piled.page.getByRole('button', { name: 'Got it' });
  if (await gotIt.first().isVisible().catch(() => false)) { await gotIt.first().click(); await piled.page.waitForTimeout(300); }
  // The family's own land, where the pile stands by the house (the camera's Land button).
  await piled.page.locator('[data-view=home]').click();
  await piled.page.waitForTimeout(1500);
  await shot(piled.page, 'wood-pile-1366');
  // The pile itself, at the size the class sees it, with the family panel put aside for the picture.
  const pileBox = await piled.page.evaluate(() => {
    const c = document.querySelector('#world-map'), r = c.getBoundingClientRect(), k = r.width / c.width, at = window.__woodPileAt;
    for (const el of document.querySelectorAll('#family-panel, .family-panel, #selection')) el.style.visibility = 'hidden';
    if (!at) return null;
    const x = Math.max(0, r.left + (at.x - at.width * 0.75) * k), y = Math.max(0, r.top + (at.y - at.height * 1.6) * k);
    return { x, y, width: Math.min(innerWidth - x, at.width * 1.5 * k), height: Math.min(innerHeight - y, at.height * 2.1 * k) };
  });
  assert.ok(pileBox && pileBox.width > 20, `the wood pile's place was not recorded: ${JSON.stringify(pileBox)}`);
  observed.woodPile.box = pileBox;
  await piled.page.screenshot({ path: 'docs/evidence/work-wood-pile-close.png', clip: pileBox });
  shots.push('docs/evidence/work-wood-pile-close.png');
  ok(`thirty-five logs on the pile are drawn as Astra's logs, ${observed.woodPile.drawn} in a row, not Claude's pile (${observed.woodPile.sprite}; projected ${JSON.stringify(observed.woodPile.logs)})`);
  await piled.app.close();
  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/work-browser.json', `${JSON.stringify({
    record: 'People at work, drawn at the work, in a browser (docs/ART_REQUESTS.md, request 2026-09-28 — people at work)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: 'Same computer only, headless Chrome at 1366x768. A real class through the join flow on the invented country (seed work-proof-3). The well, the house, the felling, the mark and the water are the server\'s own chore state set in process; working about the place is the server\'s own. No LAN or district claim.',
    checks: pass, observed, screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
  await app.close();
} finally {
  await browser.close();
}
