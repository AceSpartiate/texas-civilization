// The short bar, "More", the idle mark and the play-through's small defects, in a real browser (owner, 2026-10-09, by multiple choice:
// "Short bar + More"; the guided start stays off and tips are the only guidance). docs/FAMILY_PANEL.md, amendment 2026-10-09.
//
// The class is the play-through's own (seed `playthrough-1`, eight families on the colonies map with neighbours; the student's
// family rolls 5: father, mother, daughters of 13, 10 and 6), joined and made as a student does, at 1366x768:
//
// 1. An empty last name says what is needed.
// 2. On the land: while the house-site card is open no tip stands (the arrival's "order" tip waits); "Set the house here" is inside
//    the card without scrolling, at 1366x768 and at 1024x768; the house chooser that follows holds the tip too, and the tip comes
//    when it closes, its "Got it" pressing only itself; after it is put away the next tip waits its gap.
// 3. The short bar: every grown person's bar is ten tiles or fewer, "More" among them; "More" is reached with the keyboard and
//    opens the full bar in place; it is remembered for that person across choosing somebody else and a reload, and closes again.
//    A work behind "More" that the person is set to stays on the short bar, glowing; one the refusal line names is drawn.
// 4. The idle mark: a person resting with work open to them carries the ringed mark, on top of everything else on the face.
// 5. A small child's portrait chooses her and shows her own short bar with no "too young to be sent".
// 6. The journal's roster reads in sentences; and a second tab on the same family does not show "Make my family" again.
//
// Same computer only: headless Chrome. Run: npm run test:simple-ui
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
const shot = async (page, name) => { const path = `docs/evidence/simple-ui-${name}.png`; await page.screenshot({ path }); shots.push(path); };
async function until(page, message, fn, arg, options = { timeout: 30000 }) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}

const app = createClassroom({ seed: 'playthrough-1', playerCount: 8, tickMs: 9500,
  worldFactory: (seed, n) => createGonzalesWorld(seed, n, { map: 'colonies', neighbours: true }) });
const port = await app.listen(0, '127.0.0.1');
const url = `http://127.0.0.1:${port}`;
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(`page: ${error.message}`));
const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();

/** The bar as drawn: the visible tiles of the chosen person's bar, "More" apart, and what each is. */
const bar = () => page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 2 && r.height > 2 && s.display !== 'none' && s.visibility !== 'hidden'; };
  const row = document.querySelector('.panel-row[data-focused=true]');
  const tiles = [...(row?.querySelectorAll('.panel-icons .panel-icon') || [])].filter(vis);
  const more = tiles.find(tile => tile.classList.contains('panel-more')) || null;
  const works = tiles.filter(tile => tile !== more);
  return { id: row?.dataset.entityId, name: row?.querySelector('.panel-name')?.value, tiles: tiles.length, works: works.map(tile => tile.dataset.key),
    active: works.filter(tile => tile.dataset.active === 'true').map(tile => tile.dataset.key),
    why: works.filter(tile => tile.dataset.cue === 'true' || tile.dataset.feeds === 'true').map(tile => `${tile.dataset.key}:${tile.dataset.cue === 'true' ? 'cue' : 'feeds'}`),
    more: more ? { expanded: more.getAttribute('aria-expanded'), label: more.getAttribute('aria-label'), word: more.textContent.trim() } : null };
});
const command = input => page.evaluate(async body => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}${Date.now()}`, ...body }) });
  return { status: response.status, error: (await response.json()).error || '' };
}, input);

try {
  await page.goto(url);
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await page.locator('[name=code]').fill(app.state.sessionCode); await page.locator('[name=name]').fill('Leo');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  for (let i = 2; i <= 8; i++) await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Kid ${i}`, code: app.state.sessionCode }) });

  // ------------------------------------------------------------------------------------------- 1. an empty last name
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await until(page, 'the die never settled', () => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#surname-input').fill('   ');
  await page.locator('#surname-save').click();
  const emptyName = await page.evaluate(() => ({ error: document.querySelector('#surname-error').textContent, open: !document.querySelector('#surname').hidden, focus: document.activeElement?.id }));
  observed.emptyName = emptyName;
  assert.match(emptyName.error, /last name/i, `an empty last name says nothing: "${emptyName.error}"`);
  assert.equal(emptyName.open, true, 'an empty last name closed the card');
  assert.equal(emptyName.focus, 'surname-input', 'an empty last name does not put the keyboard back in the box');
  ok(`an empty last name says what is needed ("${emptyName.error}") and the card stays, with the keyboard in the box`);
  await page.locator('#surname-input').fill('');
  await meetFamily(page, 'Hill');
  await page.locator('#wagon-done').click({ timeout: 5000 }).catch(() => {});
  await host.getByRole('button', { name: 'Start' }).click();
  await until(page, 'the class never began', () => window.__snapshot?.world.status === 'running');
  // On the road in, the arrival's tip.
  await until(page, 'no tip on the road in', () => window.__tip === 'arrive' || window.__tipWaitingFor === 'arrive', null, { timeout: 20000 });
  observed.roadIn = await page.evaluate(() => ({ tip: window.__tip, waiting: window.__tipWaitingFor, open: ['#wagon-load', '#selection', '#house-plot', '#site-choose', '#key-card', '#creation'].filter(selector => { const one = document.querySelector(selector); return one && !one.hidden && one.getBoundingClientRect().height > 1; }) }));
  app.setPace(400);
  await until(page, 'the family never reached its land', () => window.__snapshot?.world?.land?.choosingSite?.can, null, { timeout: 120000 });
  app.setPace(9500);

  // -------------------------------------------------------------------------------- 2. no tip over the house-site card
  // Past the fifteen seconds a tip put away (or retired: the arrival's, as the family arrives) leaves clear, so what holds the tip
  // back now is the card alone.
  await page.waitForTimeout(17000);
  const onSite = await page.evaluate(() => ({ site: !document.querySelector('#site-choose').hidden, tip: !document.querySelector('#tip').hidden, standing: window.__tip, waiting: window.__tipWaitingFor }));
  observed.onSite = onSite;
  assert.equal(onSite.site, true, 'the house-site card is not open on arrival');
  assert.equal(onSite.tip, false, `a tip (${onSite.standing}) stands while the house-site card is open`);
  assert.ok(onSite.waiting, 'no tip is waiting for the card to close: the arrival has nothing to say');
  ok(`on arrival the house-site card is open and no tip stands over it; "${onSite.waiting}" waits for it to close`);

  // "Set the house here" inside the card, without scrolling, at both sizes.
  await page.locator('#site-suggested button').first().click();
  await until(page, '"Set the house here" never came', () => !document.querySelector('#site-build').hidden);
  for (const size of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(600);
    const fold = await page.evaluate(() => {
      const button = document.querySelector('#site-build').getBoundingClientRect(), card = document.querySelector('#site-choose').getBoundingClientRect();
      const hit = document.elementFromPoint(button.left + button.width / 2, button.top + button.height / 2);
      return { button: { top: Math.round(button.top), bottom: Math.round(button.bottom) }, card: { top: Math.round(card.top), bottom: Math.round(card.bottom) }, reached: hit?.id === 'site-build', inView: button.bottom <= innerHeight };
    });
    observed[`fold${size.width}`] = fold;
    assert.ok(fold.button.bottom <= fold.card.bottom + 1 && fold.button.top >= fold.card.top, `${size.width}: "Set the house here" stands ${fold.button.bottom - fold.card.bottom}px below the card's fold`);
    assert.ok(fold.reached && fold.inView, `${size.width}: "Set the house here" is covered or off the screen`);
    if (size.width === 1024) await shot(page, 'site-card-1024');
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  ok(`"Set the house here" stands inside the site card without scrolling at 1366x768 (${observed.fold1366.button.bottom} <= ${observed.fold1366.card.bottom}) and 1024x768 (${observed.fold1024.button.bottom} <= ${observed.fold1024.card.bottom}), and a press reaches it`);
  await page.locator('#site-build').click();
  await until(page, 'the site was never set', () => !window.__snapshot?.world?.land?.choosingSite);

  // The house chooser: the tip waits behind it, and comes when it closes. Opened by "Choose a house" on the house's card, as the
  // play-through's student opened it (018), unless it has opened by itself.
  await page.waitForTimeout(1500);
  if (await page.locator('#house-open').isVisible().catch(() => false)) await page.locator('#house-open').click();
  const chooser = await page.waitForFunction(() => ['#house-plot', '#house-plan'].find(selector => { const one = document.querySelector(selector); return one && !one.hidden && one.getBoundingClientRect().height > 40; }) || null, null, { timeout: 20000 }).then(handle => handle.jsonValue(), () => null);
  if (chooser) {
    // Held open past any tip's gap: the chooser alone holds the tip back.
    await page.waitForTimeout(17000);
    const behind = await page.evaluate(() => ({ tip: !document.querySelector('#tip').hidden, standing: window.__tip, waiting: window.__tipWaitingFor }));
    assert.ok(behind.waiting, 'no tip was waiting behind the house chooser: this proves nothing');
    observed.houseChooser = { chooser, ...behind };
    assert.equal(behind.tip, false, `a tip (${behind.standing}) stands over the house chooser, where its "Got it" pressed the chooser's dim`);
    await shot(page, 'house-chooser-no-tip');
    await page.locator(chooser === '#house-plot' ? '#plot-close' : '#house-plan [aria-label*="Close"], #house-plan button:has-text("Close")').first().click();
    await until(page, 'the tip never came after the house chooser closed', () => !document.querySelector('#tip').hidden, null, { timeout: 20000 });
    const tip = await page.evaluate(() => { const close = document.querySelector('#tip .tip-close').getBoundingClientRect(); const on = document.elementFromPoint(close.left + close.width / 2, close.top + close.height / 2); return { id: window.__tip, closeReached: Boolean(on?.closest('.tip-close')) }; });
    assert.ok(tip.closeReached, 'something is drawn over the tip\'s "Got it"');
    await page.locator('#tip .tip-close').click();
    const after = await page.evaluate(() => ({ tip: !document.querySelector('#tip').hidden, plot: !document.querySelector('#house-plot').hidden }));
    assert.equal(after.plot, false, 'pressing "Got it" opened or left the house chooser');
    ok(`the house chooser (${chooser}) holds the tip; once it closes "${tip.id}" stands, its "Got it" is the one pressed, and nothing else changes`);
    // The gap: the next tip waits.
    await page.waitForTimeout(4000);
    const gap = await page.evaluate(() => ({ tip: !document.querySelector('#tip').hidden, standing: window.__tip, waiting: window.__tipWaitingFor }));
    observed.gap = gap;
    assert.equal(gap.tip, false, `the next tip (${gap.standing}) came 4 seconds after one was put away`);
    ok(`after a tip is put away the screen stays clear (4 s later: none standing${gap.waiting ? `, "${gap.waiting}" waiting` : ''})`);
  } else throw new assert.AssertionError({ message: 'the house chooser never opened' });

  // ---------------------------------------------------------------------------------------------- 3. the short bar
  const ids = await page.evaluate(() => (window.__familyPanel || []).map(row => ({ id: row.id, age: row.age })));
  const bars = [];
  for (const one of ids) {
    await page.locator(`.panel-portrait[data-portrait="${one.id}"]`).click();
    await until(page, `${one.id}'s bar never came`, id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, one.id);
    await page.waitForTimeout(400);
    bars.push({ ...one, ...(await bar()), waiting: await page.evaluate(id => window.__familyPanel.find(row => row.id === id)?.more || [], one.id) });
  }
  observed.bars = bars;
  for (const one of bars.filter(person => person.age >= 10)) {
    // Ten tiles, "More" among them - beside whatever the rule keeps up because the person is at it or it glows (the house's cue, a way to
    // food while the food is low), which is never put behind "More".
    const kept = new Set([...one.active, ...one.why.map(entry => entry.split(':')[0])]);
    assert.ok(one.tiles - kept.size <= 10, `${one.name}'s bar has ${one.tiles} tiles: ${one.works.join(', ')} (active ${one.active.join(', ')}; ${JSON.stringify(one.why)})`);
    // "More" wherever two or more works wait behind it (somebody busy, or stopped by a little one, may have nothing that waits).
    if (one.waiting.length >= 2) assert.ok(one.more, `${one.name}'s bar has no "More", with ${one.waiting.join(', ')} behind it`);
  }
  assert.ok(bars.filter(person => person.age >= 10 && person.more).length >= 2, `hardly a grown bar has "More": ${bars.map(one => `${one.name} ${one.tiles}`).join(', ')}`);
  const child = bars.find(person => person.age < 10);
  assert.ok(child?.more && child.works.includes('child-play') && !child.works.includes('child-doll'), `the small child's bar is not short: ${child?.works.join(', ')}`);
  ok(`every grown person's bar is ten tiles or fewer with "More", beside what they are at or what glows (${bars.map(one => `${one.name} ${one.tiles}${one.active.length + one.why.length ? ` [${[...one.active, ...one.why].join(', ')}]` : ''}`).join(', ')}); the 6-year-old's keeps her works and one play`);

  // "More" from the keyboard, the full bar in place, remembered, and closed.
  const grown = bars.find(person => person.age >= 18);
  await page.locator(`.panel-portrait[data-portrait="${grown.id}"]`).click();
  await page.waitForTimeout(400);
  const shortBefore = await bar();
  await shot(page, 'short-bar');
  await page.locator('.panel-row[data-focused=true] .panel-more').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('panel-more')), true, 'the keyboard cannot reach "More"');
  await page.keyboard.press('Enter');
  await until(page, '"More" did not open', () => document.querySelector('.panel-row[data-focused=true] .panel-more')?.getAttribute('aria-expanded') === 'true');
  await page.waitForTimeout(300);
  const full = await bar();
  observed.more = { before: shortBefore, full };
  assert.ok(full.works.length > shortBefore.works.length, `"More" opened nothing: ${shortBefore.works.length} works before, ${full.works.length} after`);
  for (const key of shortBefore.works) assert.ok(full.works.includes(key), `opening "More" took ${key} off the bar`);
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('panel-more')), true, 'the keyboard lost its place on "More" when it opened');
  await shot(page, 'more-open');
  ok(`"More" is reached with the keyboard and opens the full bar in place: ${shortBefore.works.length} works, then ${full.works.length}, the focus kept on it ("${full.more.word}")`);
  const other = bars.find(person => person.id !== grown.id && person.age >= 10);
  await page.locator(`.panel-portrait[data-portrait="${other.id}"]`).click();
  await page.waitForTimeout(400);
  const otherBar = await bar();
  assert.notEqual(otherBar.more?.expanded, 'true', `"More" opened on ${other.name} as well: it is per person`);
  await page.locator(`.panel-portrait[data-portrait="${grown.id}"]`).click();
  await page.waitForTimeout(400);
  assert.equal((await bar()).more?.expanded, 'true', '"More" forgot it was open when another person was chosen and then this one');
  await page.reload();
  await until(page, 'the bar never came back after the reload', () => document.querySelector('.panel-row[data-focused=true] .panel-more'), null, { timeout: 30000 });
  await page.locator(`.panel-portrait[data-portrait="${grown.id}"]`).click();
  await page.waitForTimeout(600);
  assert.equal((await bar()).more?.expanded, 'true', '"More" forgot it was open across a reload');
  await page.locator('.panel-row[data-focused=true] .panel-more').click();
  await until(page, '"More" did not close', () => document.querySelector('.panel-row[data-focused=true] .panel-more')?.getAttribute('aria-expanded') === 'false');
  ok(`"More" is per person (closed on ${other.name}), remembered for ${grown.name} across choosing another and a reload, and closes again`);

  // A work behind "More" the person is set to stays on the short bar, glowing.
  const hidden = full.works.filter(key => !shortBefore.works.includes(key));
  const toDo = ['fish-the-water', 'milk-cow', 'keep-house', 'wash-clothes', 'cut-bee-tree'].find(key => hidden.includes(key)) || null;
  if (toDo) {
    const sent = await command({ action: 'chore', chore: toDo, entityId: grown.id });
    assert.equal(sent.status, 200, `${toDo} was refused: ${sent.error}`);
    app.setPace(1500);
    await until(page, `${toDo} never glowed on the short bar`, key => {
      const row = document.querySelector('.panel-row[data-focused=true]');
      const icon = row?.querySelector(`.panel-icons .panel-icon[data-key="${key}"]`);
      return row?.querySelector('.panel-more')?.getAttribute('aria-expanded') !== 'true' && icon?.dataset.active === 'true' && icon.getBoundingClientRect().width > 2;
    }, toDo);
    app.setPace(9500);
    observed.activeShown = toDo;
    ok(`a work behind "More" (${toDo}) that the person is set to stands on the short bar, glowing`);
    await command({ action: 'stop-chore', entityId: grown.id });
  }
  // One the refusal line names is drawn. The line is written here, in the server's way of quoting a work, because no refusal of the
  // first hour names a work behind "More"; what is proved is that the page reads the line it shows (tests/short-bar.test.mjs holds
  // the rule for tips and story cards too).
  const nameable = await page.evaluate(() => { const row = window.__familyPanel.find(one => one.bar); return row?.more || []; });
  const target = nameable[0];
  if (target) {
    await page.evaluate(key => {
      const words = { 'butcher-hog': 'Kill a hog', 'butcher-beef': 'Kill a beef', 'make-furniture': 'Make furniture', 'buy-furniture': 'Buy furniture from the carpenter', 'look-to-stock': 'Ride the range after the stock', 'milk-cow': 'Milk the cow', 'keep-house': 'Keep house', 'wash-clothes': 'Wash clothes', 'fish-the-water': 'Fish the creek', 'cut-bee-tree': 'Cut a bee tree', 'practise-shooting': 'Practise at the mark', 'cut-lane': 'Cut the lane to the road', 'fence-plot': 'Fence a cleared plot', 'make-carreta': 'Make a carreta', 'survey-plot': 'Survey ten acres', visit: 'Go to a neighbour’s homestead', work: 'Work about the place' };
      const error = document.querySelector('#error');
      error.textContent = `Not yet: try “${words[key] || key}” first.`;
      error.hidden = false;
    }, target);
    app.setPace(1500);
    await until(page, `the work the refusal line names (${target}) stays behind "More"`, key => {
      const icon = document.querySelector(`.panel-row[data-focused=true] .panel-icons .panel-icon[data-key="${key}"]`);
      return icon && icon.getBoundingClientRect().width > 2;
    }, target, { timeout: 15000 });
    app.setPace(9500);
    observed.namedShown = { target };
    ok(`a work behind "More" that the refusal line names (${target}) is drawn on the short bar`);
    await page.evaluate(() => { document.querySelector('#error').textContent = ''; });
  }

  // --------------------------------------------------------------------------------------------------- 4. the idle mark
  app.setPace(800);
  const idle = await page.waitForFunction(() => {
    const row = document.querySelector('.panel-row[data-idle=true]');
    if (!row) return null;
    const mark = row.querySelector('.panel-idle-mark'), box = mark.getBoundingClientRect();
    if (box.width < 2) return null;
    // The marks take no clicks (`pointer-events:none`), so for this one look every mark on the face is made hit-testable: what the
    // browser finds at the idle mark's middle is then whatever is drawn on top there.
    const marks = [...row.querySelectorAll('.panel-portrait > span')];
    for (const one of marks) one.style.pointerEvents = 'auto';
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    for (const one of marks) one.style.pointerEvents = '';
    const style = getComputedStyle(mark);
    const z = one => Number(getComputedStyle(one).zIndex) || 0;
    return { id: row.dataset.entityId, size: Math.round(box.width), onTop: Boolean(hit && mark.contains(hit)), on: hit?.className || hit?.tagName, drawn: mark.dataset.drawn,
      ring: style.borderTopColor, ringWidth: parseFloat(style.borderTopWidth), round: style.borderRadius, z: z(mark), above: Math.max(0, ...marks.filter(one => one !== mark).map(z)) };
  }, null, { timeout: 60000 }).then(handle => handle.jsonValue());
  app.setPace(9500);
  observed.idle = idle;
  assert.ok(idle.size >= 18, `the idle mark is ${idle.size}px, too small to see`);
  assert.ok(idle.onTop, `something is drawn over the idle mark: ${idle.on}`);
  // A token in the house style of the sick and hunger marks: a disc with a ring, over every other mark the face can carry.
  assert.ok(idle.ringWidth >= 1 && idle.round === '50%', `the idle mark is not a ringed disc: ${idle.ringWidth}px ${idle.ring}, radius ${idle.round}`);
  assert.ok(idle.z > idle.above, `another mark on the face can stand over the idle mark (z ${idle.z} against ${idle.above})`);
  await page.locator(`.panel-row[data-entity-id="${idle.id}"] .panel-portrait`).screenshot({ path: 'docs/evidence/simple-ui-idle-mark.png' });
  shots.push('docs/evidence/simple-ui-idle-mark.png');
  ok(`a resting person with work open carries the ringed idle mark, ${idle.size}px, with nothing over it`);

  // ------------------------------------------------------------------------------------------- 5. a small child's face
  await page.evaluate(() => { document.querySelector('#error').textContent = ''; });
  const mainBefore = await page.evaluate(() => window.__snapshot.world.household.mainId || window.__snapshot.world.household.principalId);
  await page.locator(`.panel-portrait[data-portrait="${child.id}"]`).click();
  await until(page, 'the small child\'s bar never came', id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, child.id);
  await page.waitForTimeout(1500);
  const chose = await page.evaluate(() => ({ error: document.querySelector('#error').textContent, main: window.__snapshot.world.household.mainId || window.__snapshot.world.household.principalId }));
  observed.childFace = chose;
  assert.doesNotMatch(chose.error, /too young/i, `choosing the small child said "${chose.error}"`);
  assert.equal(chose.main, mainBefore, 'choosing the small child changed the main person');
  ok('a small child\'s portrait chooses her and shows her bar, with no "too young to be sent" and the main person unchanged');

  // ----------------------------------------------------------------------------- 6. the roster, and a second tab
  const roster = await page.evaluate(() => [...document.querySelectorAll('#family li button')].map(button => button.textContent));
  observed.roster = roster;
  assert.ok(roster.length >= 5, 'the journal has no roster');
  for (const line of roster) {
    assert.match(line, /^[A-Z][^:]* (is|has) .*\.$/, `the roster reads like a log: "${line}"`);
    assert.doesNotMatch(line, /Family \d+ home|: rest,|, well$/, `the roster reads like a log: "${line}"`);
  }
  ok(`the journal's roster reads in sentences ("${roster[0]}")`);
  const second = await context.newPage();
  second.on('pageerror', error => errors.push(`second: ${error.message}`));
  await second.goto(url);
  let beginSeen = false;
  for (let i = 0; i < 12; i++) {
    beginSeen ||= await second.evaluate(() => { const card = document.querySelector('#creation-begin'); return Boolean(card && !card.hidden && card.getBoundingClientRect().height > 20); });
    await second.waitForTimeout(250);
  }
  await second.waitForFunction(() => document.querySelector('#creation')?.hidden && document.querySelector('#family-panel') && !document.querySelector('#family-panel').hidden, null, { timeout: 20000 });
  assert.equal(beginSeen, false, 'a second tab on a family already made showed "Make my family" again');
  ok('a second tab on the made family goes straight to the game, with no "Make my family" card');
  await second.close();

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
} finally {
  writeFileSync('docs/evidence/simple-ui-browser.json', `${JSON.stringify({ when: new Date().toISOString(), pass, observed, shots, errors }, null, 2)}\n`);
  await browser.close();
  await app.close?.();
}
console.log(`${pass.length} checks passed`);
process.exit(0);
