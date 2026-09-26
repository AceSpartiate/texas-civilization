// Coleto and Palm Sunday, watched in a real class (docs/BATTLES.md; docs/battle-research/staging.md §6-§7; owner, 2026-09-25:
// "players that have a character there should get an alert to watch ... players should walk away understanding what happened").
//
// A class on the colonies map, played in process through the first two periods and into the spring to the morning of March
// 19, 1836 (the first period alone is some four hundred ticks), with two families' fathers serving with Fannin at Goliad as
// men who got away from the south are. Then served live: three students join by the join page and make their families; one
// family's man comes through Coleto and is among the prisoners on Palm Sunday, the second's is hit at Coleto, the third has
// nobody there. Every card is pressed on the page. It holds:
//   - the march out comes to the family through its man, with Follow, before any fighting, and Follow frames the column;
//   - when the column is caught a Watch card comes, and Watch frames the square;
//   - across several moments of the three assaults there is fire and smoke on the screen, both sides firing;
//   - at dusk the Texians stand in their square, measurably more even than the Mexican marksmen loose in the grass;
//   - words are drawn over the speakers: the square's own orders and the Mexican officers', each labelled;
//   - the family's own man is drawn in the square, in its firing poses; the second family sees its man hit and sitting hurt;
//   - the Host sees both live, its camera on the field, and its spotlight lights it;
//   - the family with nobody there is sent nothing of either - no battle, no alert, no name - before and after a reload;
//   - the surrender's white flag; on Palm Sunday the Follow card at the muster, the guards' fire and the prisoners falling
//     with nothing said, the family's man drawn lying where he fell, no Spanish order at the killing;
//   - afterwards, at the word, the family is given the account through whoever hears it at home, and the journal keeps it.
// At 1366x768 and 1024x768, headless Chrome, same computer. Run: npm run test:battle-coleto
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { rollFates } from '../sim/army.mjs';
import { COLETO } from '../sim/houston.mjs';
import { massacreFate } from '../sim/fannin.mjs';
import { SETTLEMENT_DAYS } from '../sim/scrape.mjs';
import { withFannin } from '../tests/support/fannin.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const evidence = { samples: [], people: {} };
const until = (world, done, limit = 9000) => { for (let i = 0; i < limit && !done() && world.status === 'running'; i++) stepWorld(world); };

/**
 * The class: a seed whose first three families live where the spring's order to leave has come and gone before March 19, or
 * will not come until after the word of Palm Sunday (sim/scrape.mjs `SETTLEMENT_DAYS`), so no family's flight holds the clock
 * while the proof watches; then a class seed under which the first family's father comes through Coleto and dies on Palm
 * Sunday and the second's is hit at Coleto. Both are put with Fannin at Goliad on the morning of March 19.
 */
const quiet = settlementId => { const days = SETTLEMENT_DAYS[settlementId || 'gonzales']; return !days || days.order <= 221760 + 17 * 1440 || days.order >= 221760 + 31 * 1440 + 3 * 1440; };
function atGoliad(seed, playerCount) {
  let world = null;
  for (let k = 0; k < 400; k++) {
    world = createGonzalesWorld(`${seed}-${k}`, playerCount, { map: 'colonies', neighbours: true });
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
    const fate = man => rollFates(world, [man.id], { event: 'coleto', ...COLETO })[0].fate;
    if (fate(a) === 'unhurt' && massacreFate(world, a) === 'executed' && fate(b) === 'wounded') break;
  }
  for (const man of [a, b]) {
    man.health = { condition: 'well' };
    assert.ok(withFannin(world, man), `${man.name} could not be put with Fannin`);
  }
  world.status = 'lobby';
  return world;
}

const directory = mkdtempSync(join(tmpdir(), 'texas-coleto-'));
const app = createClassroom({ seed: 'battle-coleto', playerCount: 5, tickMs: 300, savePath: join(directory, 'class.json'), worldFactory: atGoliad });
assert.equal(app.state.world.period, 3, 'the class did not reach the spring');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
async function pageFor(viewport) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `docs/evidence/battle-coleto-${name}.png` });
const phaseOn = (page, id) => page.waitForFunction(phase => window.__snapshot?.world.battle?.phase === phase, id, { timeout: 240000 });
const world = () => app.state.world;

try {
  mkdirSync('docs/evidence', { recursive: true });
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 }, 'hh-3': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport);
    await page.goto(url);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Square', 'hh-2': 'Hurt', 'hh-3': 'Homeward' }[householdId]);
    students[householdId] = page;
  }
  const { 'hh-1': fighter, 'hh-2': hurt, 'hh-3': stayer } = students;
  for (let i = 4; i <= 5; i++) {
    const response = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Reader ${i}`, code: app.state.sessionCode }) });
    assert.equal(response.status, 200);
  }
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await fighter.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // A second a tick, so a page can be sampled through the fighting (the Host's own Quick).
  await host.getByRole('button', { name: 'Quick', exact: true }).click();
  const manA = world().households['hh-1'].principalId, manB = world().households['hh-2'].principalId;
  evidence.people = { fighter: manA, hurt: manB };
  ok(`three students joined and made their families; ${world().entities[manA].name} and ${world().entities[manB].name} are with Fannin at Goliad`);

  // ------------------------------------------------------------------ the march out: Follow, through the man, before contact
  // A card on the page, open, with this title and this button (public/military-attention.js; a fresh card opens itself).
  const card = (page, title, action, timeout = 240000) => page.waitForFunction(([title, action]) => !document.querySelector('#military-notice').hidden && !document.querySelector('#military-message').hidden
    && new RegExp(title).test(document.querySelector('#military-title')?.textContent || '') && document.querySelector('#military-go')?.textContent === action, [title, action], { timeout }).then(() => true, () => false);
  assert.ok(await card(fighter, 'Fannin marches out', 'Follow'), 'no Follow card came through the man when the column marched out');
  const march = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, phase: window.__snapshot.world.battle?.phase, contact: window.__snapshot.world.battle?.contact, field: window.__snapshot.world.battleAlert?.field }));
  assert.ok(/side/.test(march.words) && march.contact === false, `the march card did not come through the man before the fighting: ${JSON.stringify(march)}`);
  await fighter.locator('#military-go').click();
  await fighter.waitForTimeout(400);
  const followed = await fighter.evaluate(() => ({ camera: window.__camera, battle: window.__snapshot.world.battle }));
  const column = followed.battle.sides.find(side => side.side === 'texian');
  const off = Math.hypot(followed.camera.cx - column.x, followed.camera.cy - column.y);
  assert.ok(off < 1.5 && followed.camera.kind === 'battle', `Follow did not frame the column: ${off.toFixed(2)} miles off, camera ${followed.camera.kind}`);
  evidence.march = { ...march, cameraMilesFromColumn: +off.toFixed(3) };
  ok(`"${march.title}" came through the man during the ${march.phase}, and Follow framed the column ${off.toFixed(2)} miles from its middle`);
  await shot(fighter, 'march');

  // ------------------------------------------------------------------ caught: Watch
  await phaseOn(fighter, 'caught');
  assert.ok(await card(fighter, 'Caught on the prairie', 'Watch'), 'no Watch card came when the column was caught');
  const caught = await fighter.evaluate(() => document.querySelector('#military-title').textContent);
  await fighter.locator('#military-go').click();
  await fighter.waitForTimeout(400);
  ok(`"${caught}" came with Watch when the cavalry caught the column`);

  // ------------------------------------------------------------------ the assaults, sampled at several moments
  const sample = async (page, label) => {
    const one = await page.evaluate(() => ({ phase: window.__snapshot.world.battle?.phase, minute: window.__snapshot.world.minute, caption: window.__battleCaption?.text, view: window.__battleView, frame: window.__animation?.drawMs, camera: window.__camera?.kind, size: `${innerWidth}x${innerHeight}` }));
    evidence.samples.push({ label, phase: one.phase, minute: one.minute, camera: one.camera, size: one.size, view: one.view && { figures: one.view.figures, regularity: one.view.regularity, shotsBy: one.view.shotsBy, smokeInView: one.view.smokeInView, bubbles: one.view.bubbles.map(b => b.text), members: one.view.members, memberClips: one.view.memberClips, fallen: one.view.fallen, down: one.view.down, light: one.view.light, guns: one.view.guns, cannonShots: one.view.cannonShots, frameMs: one.view.frameMs } });
    return one;
  };
  const moments = [];
  await phaseOn(fighter, 'assault-1');
  for (let i = 0; i < 5; i++) { await fighter.waitForTimeout(1800); moments.push(await sample(fighter, `1366 ${i}`)); if (i === 2) await shot(fighter, 'assault'); }
  await phaseOn(fighter, 'assault-2');
  for (let i = 0; i < 4; i++) { await fighter.waitForTimeout(1800); moments.push(await sample(fighter, `1366 second ${i}`)); }
  const firing = moments.filter(one => /^assault-/.test(one.phase));
  assert.ok(firing.length >= 6, `only ${firing.length} moments of the assaults were sampled`);
  for (const one of firing) assert.equal(one.camera, 'battle', `at ${one.minute} Watch was not on the fight`);
  for (let i = 1; i < firing.length; i++) {
    if (firing[i].phase !== firing[i - 1].phase) continue;
    for (const side of ['texian', 'mexican']) assert.ok((firing[i].view.shotsBy[side] || 0) > (firing[i - 1].view.shotsBy[side] || 0), `no shot was fired by the ${side} side between two moments of the ${firing[i].phase}`);
  }
  for (const one of firing) assert.ok(one.view.smokeInView >= 3, `no smoke on screen at ${one.minute} in the ${one.phase}: ${one.view.smokeInView}`);
  ok(`fire from both sides and smoke on the screen at each of ${firing.length} sampled moments of the assaults (smoke in view ${Math.min(...firing.map(one => one.view.smokeInView))}-${Math.max(...firing.map(one => one.view.smokeInView))} puffs)`);
  const allSaid = await fighter.evaluate(() => window.__battleView.linesShown);
  const bubbles = [...new Set(moments.flatMap(one => one.view.bubbles))];
  assert.ok(allSaid.length >= 3 && bubbles.some(text => /rank|Present|Fire!/.test(text)) && bubbles.some(text => /¡/.test(text)), `the orders on both sides were not drawn over the speakers: ${JSON.stringify({ allSaid, bubbles })}`);
  ok(`words drawn over the speakers: ${[...new Set([...allSaid, ...bubbles])].slice(0, 12).join(' | ')}`);
  const inSquare = await fighter.evaluate(id => ({ clips: window.__battleView?.memberClips, members: window.__battleView?.members, drawn: window.__drawnAt?.[id] }), manA);
  assert.ok(inSquare.members?.includes(manA) && inSquare.drawn && inSquare.clips.includes('volunteer-fire-reload'), `the family's man was not drawn firing in the square: ${JSON.stringify(inSquare)}`);
  const coleto = world().map.sites.coleto, a = world().entities[manA];
  assert.ok(Math.hypot(a.location.x - coleto.x, a.location.y - coleto.y) < 0.15, 'the family\'s man is not in the square at Coleto');
  ok(`the family's own man ${manA} is in the square at Coleto, drawn in its poses: ${inSquare.clips.join(', ')}`);
  const frames = moments.map(one => one.view?.frameMs?.p95).filter(Number.isFinite);
  evidence.frameMs = { battleP95Max: Math.max(...frames), mapDrawMs: moments.map(one => one.frame).filter(Number.isFinite) };
  ok(`the battle draws in ${Math.max(...frames).toFixed(1)} ms at its slowest 95th percentile, of a map frame of ${Math.max(...evidence.frameMs.mapDrawMs).toFixed(1)} ms at most`);

  // ------------------------------------------------------------------ the second family sees its man hit, at 1024
  await hurt.waitForFunction(id => window.__snapshot?.world.battle?.down?.[id]?.kind === 'wounded', manB, { timeout: 240000 });
  await hurt.waitForTimeout(800);
  const hit = await hurt.evaluate(id => ({ down: window.__battleView?.down?.[id], clips: window.__battleView?.memberClips, phase: window.__snapshot.world.battle.phase, health: window.__snapshot.world.entities.find(one => one.id === id)?.health?.condition }), manB);
  assert.equal(hit.down, 'wounded'); assert.ok(hit.clips.includes('volunteer-injured'), `the hurt man was not drawn sitting hurt: ${JSON.stringify(hit)}`);
  await shot(hurt, 'hurt-1024');
  ok(`at 1024x768 the second family sees its man hit in the ${hit.phase} and drawn sitting hurt, no blood (${hit.health} on its screen)`);

  // ------------------------------------------------------------------ the Host, live
  const hostView = await host.evaluate(() => ({ battle: window.__snapshot.world.battle?.phase, focus: window.__snapshot.world.host?.focus, drawn: window.__battleView?.figures, seen: window.__spotlightSeen }));
  assert.ok(hostView.battle && hostView.drawn?.texian > 0, `the Host was not sent Coleto live: ${JSON.stringify(hostView)}`);
  assert.equal(hostView.focus, 'battle', 'the Host\'s camera was not sent to the field');
  assert.ok(hostView.seen?.some(key => key.startsWith('coleto')), `the Host's spotlight never lit the field: ${JSON.stringify(hostView.seen)}`);
  await shot(host, 'host');
  ok(`the Host sees Coleto live (${hostView.battle}), its camera on the field and its spotlight lit`);

  // ------------------------------------------------------------------ nobody else is sent any of it
  const nothing = async label => {
    const raw = await stayer.evaluate(async () => (await fetch('/api/state')).text());
    const seen = JSON.parse(raw).world;
    assert.equal(seen.battle, null, `the family with nobody there was sent the battle (${label})`);
    assert.ok(!seen.battleAlert && !seen.battleAccount, `the family with nobody there was sent a card (${label})`);
    assert.ok(![manA, manB].some(id => raw.includes(id)), `the family with nobody there was sent a name (${label})`);
    const part = /"legacyPhase"|"participants"|"alerted"|"fallen"|"down"/.exec(raw);
    assert.ok(!part, `the family with nobody there was sent part of the battle: ${part?.[0]} (${label})`);
    assert.equal(await stayer.evaluate(() => window.__battleView), null, `the family with nobody there drew a battle (${label})`);
  };
  await nothing('Coleto');
  await stayer.reload();
  await stayer.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-3');
  await nothing('Coleto, after a reload');
  ok('the family with nobody there was sent nothing of Coleto - no battle, no card, no name - before and after a reload');

  // ------------------------------------------------------------------ dusk: the square against the marksmen in the grass
  await phaseOn(fighter, 'dusk');
  await fighter.waitForTimeout(1500);
  const dusk = await sample(fighter, '1366 dusk');
  assert.ok(dusk.view.regularity.mexican > 2 * dusk.view.regularity.texian, `the square is not more even than the marksmen in the grass: ${JSON.stringify(dusk.view.regularity)}`);
  assert.equal(dusk.view.light, 'dusk');
  ok(`at dusk the Texians stand in their square and the Mexicans lie loose in the grass: nearest-neighbour spread ${dusk.view.regularity.texian.toFixed(3)} against ${dusk.view.regularity.mexican.toFixed(3)}, the light ${dusk.view.light}`);
  await shot(fighter, 'dusk');

  // ------------------------------------------------------------------ the guns at dawn, and the white flag
  assert.ok(await card(fighter, 'The guns at dawn', 'Watch'), 'no card came when the Mexican guns opened');
  await fighter.locator('#military-go').click();
  await phaseOn(fighter, 'guns');
  await fighter.waitForTimeout(2500);
  const guns = await sample(fighter, '1366 guns');
  assert.ok(guns.view.guns >= 5 && guns.view.cannonShots >= 1, `the Mexican battery did not fire: ${JSON.stringify({ guns: guns.view.guns, shots: guns.view.cannonShots })}`);
  ok(`at a quarter past six the Mexican guns open (${guns.view.cannonShots} shots seen), and the card said so`);
  await phaseOn(fighter, 'surrender');
  await fighter.waitForTimeout(1200);
  const flag = await fighter.evaluate(() => ({ flag: window.__snapshot.world.battle.flag, caption: window.__battleCaption?.text }));
  assert.equal(flag.flag?.kind, 'white'); assert.match(flag.caption, /white flag/);
  await shot(fighter, 'surrender');
  ok(`the surrender: a white flag at a corner of the square, and the caption "${flag.caption.slice(0, 80)}..."`);

  // ------------------------------------------------------------------ Palm Sunday
  assert.ok(await card(fighter, 'The prisoners are formed', 'Follow', 600000), 'no Follow card came at the muster');
  const muster = await fighter.evaluate(() => ({ words: document.querySelector('#military-words').textContent, phase: window.__snapshot.world.battle?.phase }));
  assert.match(muster.words, /side/);
  await fighter.locator('#military-go').click();
  ok(`at the muster the Follow card came through the man: "${muster.words.slice(0, 90)}..."`);
  await fighter.setViewportSize({ width: 1024, height: 768 });
  await phaseOn(fighter, 'volleys');
  const killing = [];
  for (let i = 0; i < 4; i++) { await fighter.waitForTimeout(1600); killing.push(await sample(fighter, `1024 volleys ${i}`)); if (i === 2) await shot(fighter, 'volleys-1024'); }
  assert.ok(killing.at(-1).view.fallen > killing[0].view.fallen || killing.at(-1).view.fallen >= 20, `the prisoners were not drawn falling: ${killing.map(one => one.view.fallen)}`);
  assert.ok((killing.at(-1).view.shotsBy.mexican || 0) > 0, 'the guards were not drawn firing');
  assert.ok(!killing.some(one => one.view.bubbles.some(text => /Preparen|Apunten|Fuego/.test(text))), 'an order was drawn at the killing');
  assert.match(killing.at(-1).caption || '', /open fire on the prisoners/);
  await fighter.waitForFunction(id => window.__battleView?.down?.[id] === 'killed', manA, { timeout: 60000 });
  ok(`on Palm Sunday the guards fire and the prisoners fall and lie still (${killing.at(-1).view.fallen} figures down), nothing is said, the family's man is drawn where he fell, and the caption says it plainly`);
  await nothing('Palm Sunday');
  ok('the family with nobody there was sent nothing of Palm Sunday');

  // ------------------------------------------------------------------ afterwards: the account at the word
  await fighter.waitForFunction(() => /What became of/.test(window.__snapshot?.world.battleAccount?.title || ''), null, { timeout: 480000 });
  await fighter.waitForFunction(() => !document.querySelector('#military-notice').hidden && /What became of/.test(document.querySelector('#military-title').textContent), null, { timeout: 60000 });
  const account = await fighter.evaluate(() => ({ title: document.querySelector('#military-title').textContent, words: document.querySelector('#military-words').textContent, journal: window.__snapshot.world.events.some(event => /Why it ended so/.test(event.text) && /Remember Goliad/.test(event.text)) }));
  for (const part of ['What happened', 'Why it ended so', 'Francita Alavez', 'Remember Goliad']) assert.ok(account.words.includes(part), `the account has no "${part}"`);
  assert.ok(account.journal, 'the journal did not keep the account');
  await shot(fighter, 'account');
  evidence.account = account.title;
  ok(`at the word the family is told "${account.title}" through whoever heard it at home, and the journal keeps it`);

  assert.deepEqual(errors, [], `a page threw: ${errors.join(' | ')}`);
  writeFileSync('docs/evidence/battle-coleto-browser.json', `${JSON.stringify({
    record: 'battle-coleto-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768 and 1024x768. Not physical LAN or district acceptance.',
    note: 'A class on the colonies map played in process through two periods and into the spring to the morning of March 19, 1836, with two families\' fathers put with Fannin at Goliad as men who got away from the south; then served live and watched through Coleto and Palm Sunday at the Quick pace.',
    checks: pass, ...evidence,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed. Wrote docs/evidence/battle-coleto-browser.json`);
} finally {
  if (errors.length) console.log('page errors:', errors.join(' | '));
  await browser.close(); await app.close(); rmSync(directory, { recursive: true, force: true });
}
