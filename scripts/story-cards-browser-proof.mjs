// The story cards, in a real browser (owner, 2026-09-29): the house's card beside the neighbours' card, and every big moment of a
// family member in the same frame - "Let's do the same thing with the house button", and "use that same style as the alert for when
// a family member is going through a major event like a battle, etc. Use your best judgement."
//
// A class of the invented country whose first family was rolled with one parent, on its land with no house: the neighbours' card and
// the house's card at the head of the column. The class is paused, and each moment is then put into the page's own snapshot and drawn
// (`window.__render`, as scripts/support/lesson-stub.mjs does) - the card is drawn from the projection alone
// (public/military-attention.js), so this is every moment's card as the family would see it, without playing a class to each of them.
// The rules - who is sent which moment, what outranks what - are the node tests' (tests/military-attention.test.mjs); here: each card
// is shown, in its own accent and icon, glowing (the account of a fight still), with its time left where it has one; ¡Alto! and the
// order to leave stand where the Watch card would; and a screenshot of each for the owner (docs/evidence/story-card-*.png).
//
// Same computer only: headless Chrome at 1366x768. Run: npm run test:story-cards
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { EYEBROWS } from '../public/military-attention.js';
import { projectWorld } from '../sim/world.mjs';
import { orderOut } from '../sim/scrape.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { rowsFit } from './support/row-fit.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
mkdirSync('docs/evidence', { recursive: true });

const seed = (() => { for (let n = 0; n < 100000; n++) if (familyRoll(`story-cards-${n}`, 'hh-1') === 3) return `story-cards-${n}`; throw new Error('no seed'); })();
const app = createClassroom({ seed, playerCount: 5, tickMs: 300, worldFactory: (s, count) => createGonzalesWorld(s, count) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Card reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page, 'Hollister');
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForTimeout(400);
  if (app.state.world.status === 'lobby') await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running' && !window.__snapshot.world.land?.arriving, null, { timeout: 90000 });
  await page.locator('#house-card').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#ask-neighbours').waitFor({ state: 'visible', timeout: 30000 });
  // Paused, so no tick draws over what is put into the page.
  await host.getByRole('button', { name: 'Pause' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'paused');
  await page.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  for (let i = 0; i < 4; i++) { if (await page.locator('#tip:not([hidden]) .tip-close').isVisible()) await page.locator('#tip .tip-close').click(); await page.waitForTimeout(200); }
  await page.locator('#selection-close').click({ timeout: 1000 }).catch(() => {});

  // ------------------------------------------------------------------ the two cards at the head of the column
  observed.column = await page.evaluate(() => {
    const box = one => document.querySelector(one).getBoundingClientRect(), style = one => getComputedStyle(document.querySelector(one));
    const fold = box('#family-collapse'), ask = box('#ask-neighbours'), house = box('#house-card'), rows = box('#family-rows');
    return { askAccent: document.querySelector('#ask-neighbours').dataset.accent, houseAccent: document.querySelector('#house-card').dataset.accent,
      askGlow: style('#ask-neighbours').animationName, houseGlow: style('#house-card').animationName,
      askEdge: style('#ask-neighbours').borderTopColor, houseEdge: style('#house-card').borderTopColor,
      order: ask.bottom <= house.top, clearOfFold: ask.top >= fold.bottom, aboveRows: house.bottom <= rows.top + 1 };
  });
  assert.equal(observed.column.order, true, 'the neighbours’ card is not first: using it builds the house');
  assert.equal(observed.column.clearOfFold, true, 'the cards stand on Hide names');
  assert.equal(observed.column.aboveRows, true, 'the cards stand on the family’s rows');
  assert.equal(observed.column.houseGlow, 'card-glow', 'the house card does not glow'); assert.equal(observed.column.askGlow, 'card-glow');
  assert.notEqual(observed.column.askEdge, observed.column.houseEdge, 'the two cards cannot be told apart');
  await page.screenshot({ path: 'docs/evidence/story-cards-both.png' }); shots.push('docs/evidence/story-cards-both.png');
  ok(`the neighbours' card (${observed.column.askEdge}) first and the house's (${observed.column.houseEdge}) under it, both glowing, under Hide names and over the rows`);
  // Under the cards, the family's rows on one line with the names whole (owner, 2026-09-30, "Move age off the row"): this family's
  // Ramona was cut beside "Daughter, 15".
  observed.rowFit = {};
  for (const size of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 1024, height: 600 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(500);
    const fit = await rowsFit(page), at = `${size.width}x${size.height}`;
    observed.rowFit[at] = { names: fit.rows.map(row => `${row.label} ${row.name} (${row.room} px)`), out: fit.out };
    assert.ok(fit.rows.length, `at ${at} no family row was measured`);
    assert.deepEqual(fit.out, [], `at ${at} a row under the story cards runs past its column, onto a second line, or cuts its name`);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(500);
  ok(`the rows under the cards stand on one line with the names whole at 1366x768, 1024x768 and 1024x600: ${observed.rowFit['1024x600'].names.join(', ')}`);

  // ------------------------------------------------------------------ every moment, in its own card
  const moments = await page.evaluate(() => {
    const w = window.__snapshot.world, own = w.entities.filter(one => one.householdId === w.householdId && one.kind === 'person');
    // The lone parent: the oldest of the family, and its principal, whom the family's own decisions go to.
    const grown = [...own].sort((x, y) => (y.age ?? 30) - (x.age ?? 30))[0];
    return { id: grown.id, name: grown.name };
  });
  // Each set as the server projects it (sim/road.mjs `roadAskProjection`): a road question always comes with its answers, which the
  // person card - opened for a matter since portrait = star - lists. The first turn of this left them out, and the ask id was not a real one.
  // The order to leave, as the server projects it (sim/scrape.mjs `orderOut`, sim/world.mjs `projectWorld`): told on a copy of the class's
  // own world, so the card and the person card opened for it read what a family is really sent - its room, its load, its time left.
  const orderedFlight = () => {
    const copy = structuredClone(app.state.world);
    orderOut(copy, copy.households['hh-1'], 'story-cards');
    const flight = projectWorld(copy, 'hh-1', 'student', { includeMap: false }).flight;
    assert.ok(flight?.status === 'ordered' && Number.isFinite(flight.leftMs), `the order to leave was not projected with its time left: ${JSON.stringify(flight)?.slice(0, 200)}`);
    return flight;
  };
  const cases = [
    { kind: 'alto', left: true, set: `w.flight = { status: 'fled', ask: { id: 'alto', openedMinute: w.minute, text: 'Soldiers on the road shout “¡Alto!”: halt, and lose the wagon, or run for it.', leftMs: 30000, fallback: ['halt'], options: [{ id: 'halt', label: 'Halt, as they order', note: 'The soldiers take the wagon.' }, { id: 'run', label: 'Run for it', note: 'They fire after a second order.' }] } };` },
    { kind: 'road', left: true, set: `w.flight = { status: 'fled', ask: { id: 'bog', openedMinute: w.minute, text: 'The wagon is bogged to the axles at the creek. Dig it out, or leave it?', leftMs: 90000, fallback: ['wait'], options: [{ id: 'dig', label: 'Unload and dig it out', note: 'Hours of work.' }, { id: 'wait', label: 'Wait for the ground to dry', note: 'Nothing spent.' }, { id: 'abandon', label: 'Leave the wagon and go on on foot', note: 'The wagon stays in the mud.' }] } };` },
    { kind: 'flight', left: true, set: `w.flight = ${JSON.stringify(orderedFlight())};` },
    { kind: 'call', left: true, set: `w.request = { id: 'call-proof', kind: 'call', status: 'open', text: 'Gonzales asks every man who can bear arms to turn out.', answerers: { [P]: [{ id: 'turn-out', label: 'Turn out' }] }, options: [{ id: 'turn-out', label: 'Turn out' }], leftMs: 90000 };` },
    // Very sick, with the minute in which they cannot die counted down (owner, 2026-09-29, C4: "60 s minimum").
    { kind: 'sick', left: 'nurse', set: `person.sickness = { grave: true, leftMs: 45000, line: 'very sick with the measles: nurse them, keep them warm.' };` },
    // What the army before Béxar asks of the family (owner, 2026-09-29, D5: "Supply request"; sim/supplies.mjs).
    { name: 'supply', kind: 'call', left: true, eyebrow: 'Asked of the family', title: 'The army asks for supplies', button: 'Choose what to send', set: `w.request = { id: 'supply-proof', kind: 'supply', status: 'open', text: 'Word has come from the army before Béxar, sent on by the committee: the camp is out of flour and the corn is gone. What can your family send?', answerers: { [P]: [{ id: 'supply-food', label: 'Send 6 food', note: '', can: true }, { id: 'supply-powder', label: 'Send 2 powder', note: '', can: true }, { id: 'supply-horse', label: 'Send the horse', note: '', can: false, why: 'The family has no horse at home that is free to go.' }, { id: 'supply-none', label: 'Keep what the family has', note: '', can: true }] }, options: [{ id: 'supply-food', label: 'Send 6 food', note: '', can: true }], leftMs: 300000 };` },
    // Something sighted on a hunt (owner, 2026-10-02; sim/hunt-aim.mjs): fifteen seconds to take the shot.
    { kind: 'sighting', left: true, title: 'A deer!', button: 'Take the shot', set: `person.chore = { id: 'hunt-land', doing: 'downwind, with the shot there to take', ask: { id: 'shot', openedMinute: w.minute, text: person.name + ' is downwind of a deer, with a shot to take.', leftMs: 15000, fallback: 'take', options: [{ id: 'take', label: 'Take the shot', note: 'One powder.', can: true }, { id: 'wait', label: 'Wait for it to come closer', note: 'One powder, three more hours.', can: true }, { id: 'leave', label: 'Leave it and come home', note: 'Nothing spent.', can: true }], sight: { seed: 'story-card', quarry: 'deer', cover: 'timber', month: 9, sky: 'fair', hand: { skill: 2, sway: 0.3, hangMs: 0, words: '' } } } };` },
    { kind: 'rider', left: false, set: `w.encounter = { id: 'enc-proof', status: 'open', listenerId: P, carrierName: 'Silas Roe' };` },
    { kind: 'courier', left: false, set: `person.service = { status: 'serving', besieged: true, courier: 'open' };` },
    { kind: 'orders', left: false, set: `person.service = { status: 'serving', road: 'open' };` },
    { kind: 'battle', left: false, set: `w.battleAlert = { id: 'alert-proof', entityId: P, title: 'The fight at Concepción', text: 'At ' + person.name + '\\u2019s side: the Mexican infantry is coming down on the bend of the river.', action: 'Watch', field: null };` },
    { kind: 'account', left: false, set: `w.battleAccount = { id: 'account-proof', entityId: P, title: 'After Concepción', text: person.name + ' came through it, and helped carry a wounded man back from the bend.' };` },
    { kind: 'siege', left: false, set: `person.service = { status: 'serving', besieged: true };` },
  ];
  observed.cards = {};
  for (const one of cases) {
    const shown = await page.evaluate(({ set, P }) => {
      window.__cleanSnapshot ??= structuredClone(window.__snapshot);
      const base = structuredClone(window.__cleanSnapshot);
      const w = base.world, person = w.entities.find(e => e.id === P);
      delete w.flight; delete w.request; delete w.encounter; delete w.battleAlert; delete w.battleAccount;
      // eslint-disable-next-line no-new-func
      new Function('w', 'person', 'P', set)(w, person, P);
      window.__render(base);
      return true;
    }, { set: one.set, P: moments.id });
    assert.ok(shown);
    await page.waitForTimeout(700);
    const seen = await page.evaluate(() => {
      const card = document.querySelector('#military-notice'), style = getComputedStyle(card);
      return { hidden: card.hidden, accent: card.dataset.accent, glow: style.animationName, edge: style.borderTopColor, eyebrow: document.querySelector('#military-eyebrow').textContent,
        title: document.querySelector('#military-title').textContent, button: document.querySelector('#military-go').textContent, left: document.querySelector('#military-left').hidden ? null : document.querySelector('#military-left').textContent,
        icon: document.querySelector('#military-icon').dataset.drawn || '', open: !document.querySelector('#military-message').hidden };
    });
    observed.cards[one.name || one.kind] = seen;
    assert.equal(seen.hidden, false, `${one.kind}: no card`);
    assert.equal(seen.open, true, `${one.kind}: the card came up folded`);
    assert.equal(seen.accent, one.kind, `${one.kind}: the card is in the ${seen.accent} accent`);
    assert.equal(seen.glow, one.kind === 'account' ? 'none' : 'card-glow', `${one.kind}: the card's glow is ${seen.glow}`);
    assert.equal(seen.eyebrow, one.eyebrow ?? EYEBROWS[one.kind], `${one.kind}: the card's eyebrow says "${seen.eyebrow}"`);
    if (one.title) assert.equal(seen.title, one.title, `${one.name}: the card is headed "${seen.title}"`);
    if (one.button) assert.equal(seen.button, one.button, `${one.name}: the card's button says "${seen.button}"`);
    assert.ok(seen.icon.endsWith(':1'), `${one.kind}: no icon drawn`);
    if (one.left) assert.match(seen.left || '', one.left === 'nurse' ? /^About .+ left to nurse them\.$/ : /^About .+ left to answer\.$/, `${one.kind}: no time left on the card ("${seen.left}")`);
    const path = `docs/evidence/story-card-${one.name || one.kind}.png`;
    await page.screenshot({ path }); shots.push(path);
  }
  const edges = new Set(Object.values(observed.cards).map(card => card.edge));
  assert.ok(edges.size >= 8, `only ${edges.size} accents for ${cases.length} kinds`);
  ok(`every moment in its own card: ${Object.entries(observed.cards).map(([kind, card]) => `${kind} "${card.title}"`).join(', ')} - ${edges.size} accents, the account still, the others glowing`);

  // ------------------------------------------------------------------ the road outranks the fight
  const both = await page.evaluate(({ P, flight }) => {
    const base = structuredClone(window.__cleanSnapshot), w = base.world;
    w.flight = flight;
    w.battleAlert = { id: 'alert-ranked', entityId: P, title: 'The fight', text: 'At their side.', action: 'Watch', field: null };
    window.__render(base);
    return true;
  }, { P: moments.id, flight: orderedFlight() });
  assert.ok(both);
  await page.waitForTimeout(500);
  observed.ranked = await page.evaluate(() => ({ accent: document.querySelector('#military-notice').dataset.accent, next: !document.querySelector('#military-next').hidden }));
  assert.equal(observed.ranked.accent, 'flight', 'the Watch card stood over the order to leave');
  assert.equal(observed.ranked.next, false, 'the Watch card was put up behind the order to leave');
  ok('with the order to leave open, its card stands and the Watch card is not put up at all, as before');

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
} finally {
  writeFileSync('docs/evidence/story-cards-browser.json', `${JSON.stringify({ proof: 'npm run test:story-cards', when: new Date().toISOString(), pass, observed, shots, errors, note: 'Same computer only: headless Chrome at 1366x768. Each moment drawn from a projection put into the paused page (window.__render); who is sent which moment is tests/military-attention.test.mjs.' }, null, 2)}\n`);
  await browser.close();
  await app.close();
}
console.log(`${pass.length} checks passed`);
