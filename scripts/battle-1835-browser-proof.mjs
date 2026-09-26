// Concepción and the Grass Fight, watched in a real class (docs/BATTLES.md; docs/battle-research/staging.md §1, §2; owner,
// 2026-09-25: "if they sent a character, it needs to happen in such a way that their character arrives in time to participate
// and does participate ... players should walk away understanding what happened").
//
// Each fight is a class on the real land played in process to the eve of it (the march to Béxar is some hundreds of ticks)
// and then served live: the students join on the page, the Host starts the class on its page, and every answer is a press.
//
// Concepción: hh-1's man goes with Bowie and Fannin's division (pressed on his card), hh-2's stays with the main army, hh-3
// has nobody in the army. The class's seed is one under which hh-1's man is killed crossing the open, so the staged fate is
// seen on the page. The Grass Fight: hh-1's rider goes out with Bowie, hh-2's man on foot with Jack (and is slightly hurt at
// the ditch, by the seed), hh-3's stays in camp, hh-4 has nobody there. For each it holds:
//   - the alert through the person before contact, with Watch, and Watch frames the fight with the family's person in it;
//   - fire and smoke on the screen at several sampled moments of the fighting, and the Texian volunteers firing again and
//     again; fog over Concepción until it lifts;
//   - each side spread as staged: Concepción's Texians loose under the bank against the Mexican infantry's ranks; at the
//     Grass Fight the guard scattered in its creek bed and Jack's men in double file until the ditch fires;
//   - talk drawn: a Spanish order with its English, the Texians' own shouts, a documented line;
//   - the family's person in the force, in its poses, and hit at the staged moment where the seed hits them;
//   - the Host live, its camera on the field, its spotlight lit there;
//   - a family with somebody in the army but not the force sent the fight only once the firing can be heard;
//   - a family with nobody there sent nothing - not the fight, not an alert, not a name - before and after a reload;
//   - afterwards, the account in plain words through the person, and the journal keeps it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:battle-concepcion | test:battle-grass
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { concepcionFate, grassFate } from '../sim/army.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const which = process.argv[2] || 'all';
const RISK = /kill|die|death|danger|risk|wound/i;

const until = (world, done, limit = 4000) => { for (let tick = 0; tick < limit && !done() && world.status === 'running'; tick++) stepWorld(world); return done(); };
/** Send a family's first grown person who can turn out, on the way given. Returns their id. */
function turnOut(world, householdId, mode) {
  until(world, () => world.calls?.[householdId]);
  const answerers = projectWorld(world, householdId, 'student', { includeMap: false }).request?.answerers || {};
  const found = Object.entries(answerers).find(([, options]) => options.find(option => option.id === 'turn-out')?.can);
  if (!found) throw new Error(`${householdId} has nobody who can turn out`);
  applyAction(world, householdId, { action: 'turn-out', entityId: found[0], mode });
  return found[0];
}
/** Change the class's seed until `test` holds (every later roll moves with it; the fight's own dates never do). */
function seedFor(world, test) {
  for (let n = 0; n < 50000; n++) { world.seed = `${world.seed.split('~')[0]}~${n}`; if (test()) return; }
  throw new Error('no seed found');
}

const factories = {
  // Played to October 21, the day before the division's question, with hh-1 and hh-2's volunteers in the ranks.
  concepcion: (seed, count) => {
    const world = createGonzalesWorld(seed, count, { map: 'colonies' });
    world.status = 'running';
    const a = turnOut(world, 'hh-1', 'horse'), b = turnOut(world, 'hh-2', 'horse');
    until(world, () => world.army?.members.includes(a) && world.army.members.includes(b));
    until(world, () => world.minute >= momentOf(world, 'detachment') - 1440);
    seedFor(world, () => concepcionFate(world, a) === 'killed');
    world.proof = { a, b };
    world.status = 'lobby';
    return world;
  },
  // Played to the morning of November 25, the pledge answered, with hh-1's rider, hh-2's man on foot and hh-3's in the camp.
  grass: (seed, count) => {
    const world = createGonzalesWorld(seed, count, { map: 'colonies' });
    world.status = 'running';
    const a = turnOut(world, 'hh-1', 'horse'), b = turnOut(world, 'hh-2', 'foot'), c = turnOut(world, 'hh-3', 'horse');
    const people = [a, b, c];
    until(world, () => people.every(id => world.army?.members.includes(id)));
    // Every question before the fight answered so the three stay in the ranks: in for the storm, pledged to stay.
    until(world, () => {
      for (const id of people) for (const key of ['storm', 'pledge']) {
        if (world.army.questions?.[key]?.asks?.[id] === 'open') applyAction(world, world.entities[id].householdId, { action: 'army-answer', entityId: id, question: key, answer: 'yes' });
      }
      return world.minute >= momentOf(world, 'grass-alarm') - 720;
    });
    if (!people.every(id => world.army.members.includes(id))) throw new Error('a volunteer left the army before the Grass Fight');
    seedFor(world, () => grassFate(world, world.entities[b]) === 'wounded' && grassFate(world, world.entities[a]) === 'unhurt');
    world.proof = { a, b, c };
    world.status = 'lobby';
    return world;
  },
};

const results = {};
for (const fight of ['concepcion', 'grass'].filter(one => which === 'all' || which === one)) results[fight] = await prove(fight);
mkdirSync('docs/evidence', { recursive: true });
let previous = {};
try { previous = JSON.parse(readFileSync('docs/evidence/battle-1835-browser.json', 'utf8')); } catch { /* the first run */ }
writeFileSync('docs/evidence/battle-1835-browser.json', `${JSON.stringify({
  record: 'battle-1835-browser', date: new Date().toISOString().slice(0, 10),
  environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Each class is played in process to the eve of its fight and then served live. Not physical LAN or district acceptance.',
  ...previous, ...results,
}, null, 2)}\n`);
console.log(`\nWrote docs/evidence/battle-1835-browser.json`);

async function prove(fight) {
  const pass = [], evidence = { samples: [] };
  const ok = label => { pass.push(label); console.log('PASS', `[${fight}]`, label); };
  // A second a tick until the fighting (the Host's Quick): long enough for three students to answer the Grass Fight's alarm,
  // which at Study is two and a half real minutes.
  const app = createClassroom({ seed: `battle-${fight}`, playerCount: 5, tickMs: 1000, worldFactory: factories[fight] });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const errors = [];
  const pageFor = async viewport => { const page = await (await browser.newContext({ viewport })).newPage(); page.setDefaultTimeout(30000); page.on('pageerror', error => errors.push(`${fight}: ${error.message}`)); return page; };
  const shot = (page, name) => page.screenshot({ path: `test-results/battle-${fight}-${name}.png` });
  const proof = app.state.world.proof;
  const battleId = fight === 'grass' ? 'grass-fight' : 'concepcion';
  try {
    mkdirSync('test-results', { recursive: true });
    const host = await pageFor({ width: 1366, height: 768 });
    await host.goto(`${url}/host#${app.state.hostKey}`);
    await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
    const who = fight === 'grass'
      ? { 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 }, 'hh-3': { width: 1024, height: 768 }, 'hh-4': { width: 1024, height: 768 } }
      : { 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 }, 'hh-3': { width: 1024, height: 768 } };
    const students = {};
    for (const [householdId, viewport] of Object.entries(who)) {
      const page = await pageFor(viewport);
      await page.goto(url);
      await page.locator('[name=name]').fill(`Student ${householdId}`);
      await page.locator('[name=code]').fill(app.state.sessionCode);
      await page.getByRole('button', { name: 'Join', exact: true }).click();
      await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
      await meetFamily(page, `Family${householdId.slice(3)}`, { timeout: 3000 });
      students[householdId] = page;
    }
    await host.waitForFunction(count => window.__snapshot.connected === count, Object.keys(who).length);
    await host.getByRole('button', { name: 'Start', exact: true }).click();
    if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
      await host.getByRole('button', { name: /Start/ }).first().click();
      await host.waitForFunction(() => window.__snapshot.world.status === 'running');
    }
    ok(`${Object.keys(who).length} students joined on the page and the Host started the class`);

    /** Answer a question on the volunteer's own card by pressing it. */
    const press = async (page, personId, selector, open) => {
      await page.waitForFunction(open, personId, { timeout: 120000 });
      await page.locator(`.panel-row[data-entity-id="${personId}"] .panel-portrait`).click();
      const button = page.locator(selector);
      await button.waitFor({ state: 'visible' });
      const text = (await page.locator('#selection-army').innerText()).replace(/\s+/g, ' ').trim();
      await button.click();
      return text;
    };
    const fighter = students['hh-1'];
    let fated;
    if (fight === 'concepcion') {
      const asked = await press(fighter, proof.a, '#selection-army button[data-action="detachment-go"]', id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.detachment === 'open');
      assert.match(asked, /Bowie and Fannin/); assert.doesNotMatch(asked, RISK);
      await press(students['hh-2'], proof.b, '#selection-army button[data-action="detachment-stay"]', id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.detachment === 'open');
      await fighter.waitForFunction(id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.detachment === 'go', proof.a);
      ok(`hh-1 pressed "go with Bowie and Fannin" on its man's card ("${asked.slice(0, 90)}…") and hh-2 kept its man with the main army`);
      fated = proof.a;
    } else {
      const question = (id, key) => `#selection-army button[data-action="army-answer"][data-question="grass"][data-answer="${key}"]`;
      const open = id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === 'grass' && q.answer === 'open');
      const asked = await press(fighter, proof.a, question(proof.a, 'yes'), open);
      assert.match(asked, /Bowie is taking the horsemen and Jack the men on foot/); assert.doesNotMatch(asked, RISK);
      await press(students['hh-2'], proof.b, question(proof.b, 'yes'), open);
      await press(students['hh-3'], proof.c, question(proof.c, 'no'), open);
      ok(`at the alarm hh-1's rider and hh-2's man on foot pressed "go" and hh-3's pressed "stay in camp" ("${asked.slice(0, 90)}…")`);
      fated = proof.b;
    }
    // The fighting is watched a second a tick (the Host's own Quick), so a page can be sampled through it.
    await host.getByRole('button', { name: 'Quick', exact: true }).click();

    // ---------------------------------------------------------------- the alert through the person, before contact, and Watch
    const alerted = await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-go')?.textContent === 'Watch', null, { timeout: 120000 }).then(() => true, () => false);
    assert.ok(alerted, 'no alert with Watch came through the person before the fighting');
    const alert = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, minute: window.__snapshot.world.minute, contact: window.__snapshot.world.battle?.contact || false }));
    assert.ok(/side/.test(alert.words), `the alert did not come through the person: ${alert.words}`);
    assert.equal(alert.contact, false, 'the alert came only once the fighting had begun');
    await fighter.locator('#military-go').click();
    // The camera goes at once; the person, out of the army's halted road this tick, is walked to where they stand over a tick.
    await fighter.waitForFunction(id => { const at = window.__drawnAt?.[id]; return at && at.x > 0 && at.x < innerWidth && at.y > 0 && at.y < innerHeight; }, proof.a, { timeout: 8000 }).catch(() => {});
    const watched = await fighter.evaluate(id => ({ kind: window.__camera?.kind, camera: window.__camera, drawn: window.__drawnAt?.[id], w: innerWidth, h: innerHeight, sides: window.__snapshot.world.battle?.sides?.map(s => [s.group || s.side, s.action, s.x, s.y]), me: window.__snapshot.world.entities.find(one => one.id === id)?.location }), proof.a);
    assert.equal(watched.kind, 'battle', `Watch did not frame the fight: ${watched.kind}`);
    assert.ok(watched.drawn && watched.drawn.x > 0 && watched.drawn.x < watched.w && watched.drawn.y > 0 && watched.drawn.y < watched.h, `Watch framed the fight without the family's own person in it: ${JSON.stringify(watched)}`);
    evidence.alert = alert;
    ok(`the alert "${alert.title}" came through the person before contact ("${alert.words.slice(0, 80)}…"), and Watch framed the fight with the family's person on screen`);
    await shot(fighter, 'alert');

    // ---------------------------------------------------------------- the fighting, sampled at several moments at two sizes
    const sample = async (page, label) => {
      const one = await page.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, view: window.__battleView, camera: window.__camera?.kind, size: `${innerWidth}x${innerHeight}` }));
      evidence.samples.push({ label, phase: one.phase, minute: one.minute, size: one.size, camera: one.camera, view: one.view && { groups: one.view.groups, regularityBy: one.view.regularityBy, shotsBy: one.view.shotsBy, smokeInView: one.view.smokeInView, fog: one.view.fog, bubbles: one.view.bubbles.map(b => b.text), members: one.view.members, memberClips: one.view.memberClips, memberFates: one.view.memberFates, cannonShots: one.view.cannonShots, frameMs: one.view.frameMs } });
      return one;
    };
    const keepWatching = async page => { if (await page.locator('#military-go').isVisible().catch(() => false) && (await page.locator('#military-go').textContent()) === 'Watch') await page.locator('#military-go').click(); };
    const phases = fight === 'concepcion' ? [['ringed', 3, 1366], ['charges', 5, 1024], ['retreat', 2, 1024]] : [['bowie', 3, 1366], ['ambush', 3, 1024], ['sortie', 3, 1024]];
    const moments = [];
    let hostDuring = null;
    for (const [phase, count, width] of phases) {
      await fighter.setViewportSize({ width, height: 768 });
      await fighter.waitForFunction(id => window.__snapshot.world.battle?.phase === id, phase, { timeout: 240000 });
      await keepWatching(fighter);
      for (let i = 0; i < count; i++) {
        await fighter.waitForTimeout(1900); moments.push(await sample(fighter, `${width} ${phase} ${i}`));
        if (i === 1) await shot(fighter, `${phase}-${width}`);
        // The Host, while it is being fought: live, framed on the field.
        if (i === 1 && !hostDuring && ['charges', 'ambush'].includes(phase)) { hostDuring = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.id, phase: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, camera: window.__camera?.kind, drawn: window.__battleView?.figures, smoke: window.__battleView?.smokeInView, seen: window.__spotlightSeen })); await shot(host, 'host'); }
      }
    }
    for (const one of moments) assert.equal(one.camera, 'battle', `at ${one.minute} Watch no longer framed the fight`);
    for (let i = 1; i < moments.length; i++) {
      if (moments[i].phase !== moments[i - 1].phase) continue;
      const was = moments[i - 1].view.shotsBy?.texian || 0, now = moments[i].view.shotsBy?.texian || 0;
      assert.ok(now > was, `no shot was fired between two moments of the ${moments[i].phase} by the Texians (${was} -> ${now})`);
    }
    for (const one of moments) assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in the ${one.phase}: ${one.view.smokeInView}`);
    ok(`fire and smoke on the screen at every one of ${moments.length} sampled moments (smoke in view ${Math.min(...moments.map(one => one.view.smokeInView))}-${Math.max(...moments.map(one => one.view.smokeInView))} puffs; the Texians firing again between every two moments of a phase)`);
    if (fight === 'concepcion') {
      const foggy = moments.find(one => one.phase === 'ringed');
      assert.ok(foggy.view.fog > 0.5, `no fog over the field in the ringed phase: ${foggy.view.fog}`);
      // The first moment of the charges: before the Mexican dead leave gaps in the ranks (which a nearest-neighbour measure reads as loosening).
      const charge = moments.filter(one => one.phase === 'charges' && one.view.regularityBy?.texian && one.view.regularityBy?.mexican).sort((p, q) => p.view.regularityBy.mexican - q.view.regularityBy.mexican)[0];
      assert.ok(charge && charge.view.regularityBy.texian > 3 * charge.view.regularityBy.mexican, `the Texians under the bank are not looser than the Mexican ranks: ${JSON.stringify(charge?.view.regularityBy)}`);
      assert.ok(moments.some(one => one.view.cannonShots > 0), 'the Mexican gun never fired');
      ok(`fog over the field while ringed (${foggy.view.fog}); in the charges the Texians loose under the bank (${charge.view.regularityBy.texian.toFixed(3)}) and the Mexican infantry in ranks (${charge.view.regularityBy.mexican.toFixed(3)}); the gun fired`);
    } else {
      const bed = moments.find(one => one.phase === 'bowie' && one.view.regularityBy?.mexican);
      assert.ok(bed && bed.view.regularityBy.mexican > 0.1, `the guard is drawn in rows, not scattered in its creek bed: ${JSON.stringify(bed?.view.regularityBy)}`);
      const column = moments.find(one => one.phase === 'bowie' && one.view.regularityBy?.jack);
      assert.ok(column && column.view.regularityBy.jack < 0.12, `Jack's infantry is not in double file on its way out: ${JSON.stringify(column?.view.regularityBy)}`);
      assert.ok(moments.some(one => one.phase === 'ambush' && one.view.groups?.ditch > 0), 'the men in the ditch were never drawn');
      assert.ok(moments.some(one => one.phase === 'sortie' && one.view.groups?.sortie > 0 && one.view.regularityBy.sortie < 0.08), 'the sortie from the town was not drawn in its ranks');
      ok(`the guard scattered in its creek bed (${bed.view.regularityBy.mexican.toFixed(3)}), Jack's men in double file (${column.view.regularityBy.jack.toFixed(3)}), the ditch and the sortie's ranks drawn`);
    }
    const allSaid = await fighter.evaluate(() => window.__battleView.linesShown);
    const want = fight === 'concepcion' ? { mex: ['c-bayoneta', 'c-marchen', 'c-retirada', 'c-alli'], tex: ['c-gunners', 'c-wait', 'c-pecans', 'c-comeon', 'c-take', 'c-turn', 'c-down', 'c-under', 'c-steps', 'c-waste', 'c-many', 'c-ten', 'c-knife'], doc: ['c-bugle-1', 'c-bugle-2', 'c-bugle-3', 'c-bugle-4'] }
      : { mex: ['g-pie', 'g-fuego'], tex: ['g-ravine', 'g-cover', 'g-down', 'g-flank', 'g-charge', 'g-cleared', 'g-other', 'g-turn', 'g-grape'], doc: [] };
    assert.ok(allSaid.some(id => want.mex.includes(id)) || evidence.samples.some(one => one.view?.bubbles?.some(text => /^¡/.test(text))), `no Spanish order was drawn: ${JSON.stringify(allSaid)}`);
    assert.ok(allSaid.some(id => want.tex.includes(id)), `no Texian shout was drawn: ${JSON.stringify(allSaid)}`);
    if (want.doc.length) assert.ok(allSaid.some(id => want.doc.includes(id)), `no documented bugle call was drawn: ${JSON.stringify(allSaid)}`);
    ok(`words drawn over the speakers: ${allSaid.join(', ')}`);

    // ---------------------------------------------------------------- the family's person in the force, and the staged fate
    const personIn = await fighter.evaluate(id => ({ members: window.__battleView?.members, clips: window.__battleView?.memberClips, drawn: window.__drawnAt?.[id] }), proof.a);
    assert.ok(personIn.members?.includes(proof.a) && personIn.drawn, `the family's person was not drawn in the force: ${JSON.stringify(personIn)}`);
    assert.ok(personIn.clips.some(clip => ['volunteer-fire-reload', 'volunteer-load', 'volunteer-e', 'volunteer-w'].includes(clip)), `the family's person never took the force's poses: ${JSON.stringify(personIn.clips)}`);
    const fatePage = fight === 'concepcion' ? fighter : students['hh-2'];
    const expected = fight === 'concepcion' ? 'killed' : 'wounded';
    const fell = await fatePage.waitForFunction(([id, fate]) => window.__battleView?.memberFates?.some(one => one.id === id && one.fate === fate && one.drawn), [fated, expected], { timeout: 120000 }).then(() => true, () => false);
    assert.ok(fell, `the family's person was not drawn ${expected} at the staged moment`);
    const fateSeen = await fatePage.evaluate(id => ({ fates: window.__battleView.memberFates, clips: window.__battleView.memberClips, phase: window.__snapshot.world.battle.phase, minute: window.__snapshot.world.minute, health: window.__snapshot.world.entities.find(one => one.id === id)?.health?.condition }), fated);
    assert.ok(fateSeen.clips.includes(expected === 'killed' ? 'volunteer-reclining' : 'volunteer-injured') || fateSeen.clips.includes('volunteer-injured'), `the fate was not drawn in its pose: ${JSON.stringify(fateSeen)}`);
    await shot(fatePage, 'fate');
    evidence.fate = fateSeen;
    ok(`the family's own person ${proof.a} is drawn in the force in its poses (${personIn.clips.join(', ')}), and ${fated} is drawn ${expected} in the ${fateSeen.phase} at minute ${fateSeen.minute}, their panel saying ${fateSeen.health}`);

    // ---------------------------------------------------------------- the Host, live, on the field
    const hostView = hostDuring;
    assert.ok(hostView?.battle === battleId && hostView.drawn?.texian > 0, `the Host was not sent the fight live: ${JSON.stringify(hostView)}`);
    assert.equal(hostView.focus, 'battle', `the Host's camera was not sent to the field while it was fought: ${JSON.stringify(hostView)}`);
    assert.equal(hostView.camera, 'battle', `the Host's page did not frame the field: ${JSON.stringify(hostView)}`);
    assert.ok(hostView.seen?.some(key => key.startsWith(battleId === 'grass-fight' ? 'grass-fight' : 'concepcion')), `the Host's spotlight never lit the field: ${JSON.stringify(hostView.seen)}`);
    evidence.host = hostView;
    ok(`the Host sees it live (${hostView.phase}), its camera framed on the field (${hostView.camera}), smoke in view ${hostView.smoke}, its spotlight lit there`);

    // ---------------------------------------------------------------- somebody in the army but not the force, and nobody at all
    const nearby = students[fight === 'concepcion' ? 'hh-2' : 'hh-3'];
    const heard = await nearby.evaluate(() => ({ battle: window.__snapshot.world.battle?.phase, members: window.__snapshot.world.battle?.members, alert: window.__snapshot.world.battleAlert?.title }));
    assert.ok(heard.battle && heard.members.length === 0, `the family nearby was not sent the firing it could hear: ${JSON.stringify(heard)}`);
    ok(`the family ${fight === 'concepcion' ? 'with its man at Espada' : 'with its man in camp'} is sent the fight it can hear (${heard.alert}), with nobody's person in it`);
    const nobody = students[fight === 'concepcion' ? 'hh-3' : 'hh-4'];
    for (const pass2 of ['first', 'reload']) {
      if (pass2 === 'reload') { await nobody.reload(); await nobody.waitForFunction(() => window.__snapshot?.world?.householdId); }
      const raw = await nobody.evaluate(async () => (await fetch('/api/state')).text());
      const world = JSON.parse(raw).world;
      assert.equal(world.battle, null, `the family with nobody there was sent the battle (${pass2})`);
      assert.ok(!world.battleAlert && !world.battleAccount, `the family with nobody there was alerted or told (${pass2})`);
      assert.ok(!raw.includes(proof.a) && !raw.includes(fated), `the family with nobody there was sent a fighter's id (${pass2})`);
      const part = /"memberFates"|"participants"|"fallen"|"alerted"/.exec(raw);
      assert.ok(!part, `the family with nobody there was sent part of the battle: ${part?.[0]}`);
    }
    ok('the family with nobody there was sent nothing of the fight - no battle, no alert, no name - before and after a reload');

    // ---------------------------------------------------------------- afterwards: the account, through the person
    const accountPage = fight === 'concepcion' ? fighter : students['hh-2'];
    const accounted = await accountPage.waitForFunction(() => window.__snapshot.world.battleAccount, null, { timeout: 300000 }).then(() => true, () => false);
    assert.ok(accounted, 'the account never came');
    await accountPage.waitForFunction(() => !document.querySelector('#military-notice').hidden && /What happened/.test(document.querySelector('#military-words').textContent), null, { timeout: 60000 });
    const account = await accountPage.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text)), date: window.__snapshot.world.historicalDate }));
    assert.match(account.words, /What happened/); assert.match(account.words, /Why it ended so/);
    assert.match(account.words, fight === 'concepcion' ? /killed crossing the open ground/ : /slightly hurt/);
    assert.ok(account.journal, 'the journal did not keep the account');
    await shot(accountPage, 'account');
    evidence.account = account;
    ok(`the account came through the person on ${account.date} ("${account.title}") and the journal keeps it`);
    const nearbyAccount = await nearby.waitForFunction(() => window.__snapshot.world.battleAccount?.text, null, { timeout: 60000 }).then(async () => nearby.evaluate(() => window.__snapshot.world.battleAccount.text), () => null);
    assert.match(nearbyAccount || '', fight === 'concepcion' ? /came up the river an hour after/ : /stayed in the camp at the mill/);
    ok('the family nearby is told what its own person was doing while it was fought');

    assert.deepEqual(errors, []);
    ok('no page errors');
    return { checks: pass, ...evidence };
  } finally {
    await browser.close(); await app.close();
  }
}
