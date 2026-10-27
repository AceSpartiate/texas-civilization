// Before-and-after pictures of the fights as a class sees them (owner, 2026-10-27: "it was kind of hard to see the battles";
// docs/BATTLES.md §17). Not a proof: it asserts nothing. For one fight it builds a class in process up to the eve of the fighting,
// serves it live, joins the student whose man is in it (who presses Watch when the card comes, as a student does) and opens the
// Host's page, and at each named phase of the fighting takes, at the same moment, the Host's projector page at 1366x768 and the
// student's page at 1366x768 and at a Chromebook's 1024x600 (the same page, resized for the picture and back).
//
//   node scripts/battle-see-shots.mjs <gonzales|coleto|alamo> <before|after>
//
// Pictures and what the page said it drew: docs/evidence/battle-see/<label>/<fight>-<phase>-<page>.png and <fight>.json.
// Same computer, headless Chrome: never a Chromebook, a projector or a classroom.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { rollFates } from '../sim/army.mjs';
import { COLETO } from '../sim/houston.mjs';
import { SETTLEMENT_DAYS } from '../sim/scrape.mjs';
import { withFannin } from '../tests/support/fannin.mjs';
import { gonzalesClass, TIMELINE } from '../tests/support/battle.mjs';
import { feed } from '../tests/support/fed.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { alamoClass, fatherOf } from './support/alamo-class.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const [fight = 'gonzales', label = 'after'] = process.argv.slice(2);
const until = (world, done, limit = 20000) => { for (let i = 0; i < limit && !done() && world.status === 'running'; i++) stepWorld(world); };

/** Each fight: its class, and the moments pictured (a phase, and seconds into it). */
const FIGHTS = {
  gonzales: {
    pace: 400,
    shots: [['dawn-skirmish', 9], ['fight', 6]],
    factory(seed, count) {
      const world = gonzalesClass(seed, { players: count, fighters: ['hh-1', 'hh-2'], townsfolk: ['hh-3'], stayers: ['hh-4', 'hh-5'] });
      const answered = new Set();
      for (let tick = 0; tick < 3000 && answered.size < 3; tick++) {
        stepWorld(world);
        for (const id of ['hh-1', 'hh-2', 'hh-3']) {
          if (answered.has(id) || world.marches[id]?.status !== 'open') continue;
          applyAction(world, id, { action: id === 'hh-3' ? 'stay-in-town' : 'go-upriver', entityId: world.marches[id].actorId, mode: 'foot' });
          answered.add(id);
        }
      }
      until(world, () => world.minute >= TIMELINE.crossing - 200, 3000);
      world.status = 'lobby';
      return world;
    },
  },
  coleto: {
    pace: 300,
    shots: [['assault-1', 14], ['assault-2', 14], ['guns', 6]],
    factory(seed, count) {
      const quiet = settlementId => { const days = SETTLEMENT_DAYS[settlementId || 'gonzales']; return !days || days.order <= 221760 + 17 * 1440 || days.order >= 221760 + 31 * 1440 + 3 * 1440; };
      let world = null;
      for (let k = 0; k < 400; k++) {
        world = createGonzalesWorld(`${seed}-${k}`, count, { map: 'colonies', neighbours: true });
        if (['hh-1', 'hh-2', 'hh-3'].every(id => quiet(world.households[id].settlementId))) break;
      }
      for (const household of Object.values(world.households)) rollFamily(world, household);
      world.status = 'running';
      until(world, () => world.director.complete);
      beginSecondPeriod(world); world.status = 'running';
      until(world, () => world.director.complete);
      beginThirdPeriod(world); world.status = 'running';
      until(world, () => world.minute >= momentOf(world, 'fannin-marches') - 300);
      const father = id => world.entities[world.households[id].principalId];
      const [a, b] = [father('hh-1'), father('hh-2')];
      const original = world.seed;
      for (let k = 0; k < 4000; k++) {
        world.seed = `${original}:${k}`;
        if (rollFates(world, [a.id], { event: 'coleto', ...COLETO })[0].fate === 'unhurt') break;
      }
      for (const man of [a, b]) { man.health = { condition: 'well' }; withFannin(world, man); }
      for (const id of ['hh-1', 'hh-2']) world.households[id].lesson = { ...world.households[id].lesson, step: 'done', stopped: true, at: world.minute };
      feed(world);
      world.status = 'lobby';
      return world;
    },
  },
  alamo: {
    pace: 300,
    shots: [['alarm', 3], ['repulse', 8], ['north-wall', 6]],
    factory(seed, count) {
      const world = alamoClass(seed, count, { stopBefore: 1500 });
      const man = fatherOf(world, 'hh-1');
      world.status = 'running';
      // Through the siege in process: the runner's question answered "stay", so the man is inside at the assault.
      until(world, () => {
        if (man.service?.courier === 'open') applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'stay' });
        return world.minute >= momentOf(world, 'alamo-assault') - 240;
      });
      feed(world);
      world.status = 'lobby';
      return world;
    },
  },
};
const spec = FIGHTS[fight];
if (!spec) throw new Error(`no fight ${fight}`);
const directory = mkdtempSync(join(tmpdir(), 'texas-see-'));
const out = `docs/evidence/battle-see/${label}`;
mkdirSync(out, { recursive: true });
const app = createClassroom({ seed: `battle-see-${fight}`, playerCount: 5, tickMs: spec.pace, savePath: join(directory, 'class.json'), worldFactory: spec.factory, battleFloors: { scale: 0.5 } });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const record = { fight, label, shots: [] };
const look = page => page.evaluate(() => {
  const b = window.__battleView, cam = window.__camera;
  return { phase: window.__snapshot?.world.battle?.phase || null, figurePx: cam?.figure ? Math.round(cam.figure * 0.95) : null, scale: cam ? Math.round(cam.scale) : null, cinema: window.__cinema?.state || 'off', followed: window.__cinema?.followed || null,
    figures: b?.figures, cover: b?.cover, banksInView: b?.banksInView, smokeInView: b?.smokeInView, menThinned: b?.menThinned ?? null, puffsThinned: b?.puffsThinned ?? null, film: document.body.dataset.film || null,
    messages: { accent: document.querySelector('#military-notice')?.dataset.accent || null, open: !document.querySelector('#military-message')?.hidden, title: document.querySelector('#military-title')?.textContent || null, go: document.querySelector('#military-go')?.textContent || null, toggle: document.querySelector('#military-toggle')?.textContent || null }, alert: window.__snapshot?.world.battleAlert ? { id: window.__snapshot.world.battleAlert.id, field: Boolean(window.__snapshot.world.battleAlert.field) } : null };
});
try {
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const student = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  student.setDefaultTimeout(30000);
  await student.goto(url);
  await student.locator('[name=name]').fill('Student hh-1');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(id => window.__snapshot?.world.householdId === id, 'hh-1');
  await meetFamily(student, 'Seen', { timeout: 3000 });
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 10000 }).catch(async () => { await host.getByRole('button', { name: /Start/ }).first().click(); });
  // The student presses Watch whenever the card offers it, and answers the Alamo's runner "stay", as the proofs do.
  const press = async () => {
    const watch = student.locator('#military-go');
    if (await watch.isVisible().catch(() => false) && /Watch/.test(await watch.textContent().catch(() => ''))) await watch.click().catch(() => {});
    const stay = student.locator('#encounter-asks [data-action="alamo-courier"][data-answer="stay"]');
    if (await stay.isVisible().catch(() => false)) await stay.click().catch(() => {});
  };
  for (const [phase, seconds] of spec.shots) {
    const deadline = Date.now() + 600000;
    while (Date.now() < deadline) {
      await press();
      if (await host.evaluate(id => window.__snapshot?.world.battle?.phase === id, phase)) break;
      await host.waitForTimeout(250);
    }
    for (let i = 0; i < seconds * 4; i++) { await press(); await host.waitForTimeout(250); }
    const name = page => `${out}/${fight}-${phase}-${page}.png`;
    await Promise.all([host.screenshot({ path: name('host') }), student.screenshot({ path: name('student-1366') })]);
    const seen = { phase, host: await look(host), student1366: await look(student) };
    await student.setViewportSize({ width: 1024, height: 600 });
    await student.waitForTimeout(700);
    await student.screenshot({ path: name('student-1024') });
    seen.student1024 = await look(student);
    await student.setViewportSize({ width: 1366, height: 768 });
    record.shots.push(seen);
    console.log(JSON.stringify(seen));
  }
  writeFileSync(`${out}/${fight}.json`, `${JSON.stringify(record, null, 2)}\n`);
} finally {
  await browser.close();
  await app.close?.();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
