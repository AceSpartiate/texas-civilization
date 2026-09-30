// Nothing on the screen stands on anything else (owner, 2026-09-28: "Check for UI elements that block others. Move them
// somewhere else.").
//
// The students play on Chromebooks: 1366x768 and 1280x800 are the common screens, and a browser window with its tabs and
// address bar gives the page about 110px less than that. Some have smaller windows still. The teacher's page goes up on a
// projector. This walks real classes through every kind of thing the student's page and the Host's page put on the screen -
// the family's column, the ability bar and its tips, the card beside a person, the errand and the way of going, the meeting,
// the call's menu, the land chooser, the guided start and its X, the messages, the journal, the town and its talk, the lines
// the page says, the ending and its way back, Play Solo's Pause/Resume/Save and the walk-through; on the Host's page the
// class, the Rumor Mill, the teacher's controls, the spotlight and a fight - and at each size asks the browser
// (scripts/support/screen-furniture.mjs):
//   - which pieces share pixels. A pair **fails** unless it is listed in DELIBERATE below with its reason;
//   - which controls something else is drawn over (the middle, where a student presses, or three of five points);
//   - which pieces hang off the screen's edge;
//   - whether a panel stands over what the canvas draws for a student to read: the person being given an order, the person
//     a rider is talking to (a quarter of them under a panel fails), the fight's caption (a tenth), and the speech bubbles over heads in
//     Gonzales and at home (half of one under a panel fails; a bubble walks with its speaker, so its edge may touch one).
//
// Robust to furniture that does not exist: a panel another builder removes is simply never drawn, and a state that cannot
// be reached is reported as not reached, never as clean. Every state first asserts that what it opened is on the screen.
//
// Same computer only: headless Chrome at emulated sizes, not a Chromebook or a projector.
// Run: npm run test:overlap   (OVERLAP_SHOTS=dir for the screenshots; OVERLAP_RECORD=before|after names the evidence file,
// OVERLAP_OUT=path writes it elsewhere - the injections do, so a broken run never lands in docs/evidence)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies, taught } from '../tests/support/settled.mjs';
import { gonzalesClass, stepUntil } from '../tests/support/battle.mjs';
import { battleState } from '../sim/battle-stage.mjs';
import { spotlight } from '../sim/host.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { familyRoll } from '../sim/family.mjs';
import { chooseSite } from '../sim/homesite.mjs';
import { on, sceneClock } from '../sim/town-scenes.mjs';
import { playedToTheCall, startClassroom, openClass, openEncounter, openCallMenu, openSite } from './support/panel-states.mjs';
import { STUDENT_FURNITURE, HOST_FURNITURE, LEAST_TYPE, measureScreen, readSmallText } from './support/screen-furniture.mjs';
import { projectWorld } from '../sim/world.mjs';
import { URGENT, militaryNotices } from '../public/military-attention.js';

/**
 * `OVERLAP_ONLY` (a pattern) runs only the classes whose names match - call, lone, cards, home, rooms, fight, town, solo - for an
 * injection that needs one of them (scripts/overlap-injections.mjs `only`). A gate run sets none and runs every one.
 */
const ONLY = process.env.OVERLAP_ONLY ? new RegExp(process.env.OVERLAP_ONLY) : null;
const section = name => !ONLY || ONLY.test(name);
/**
 * The two things a student opens over the right-hand side and the middle that stood on the army's question (triage 2026-09-29,
 * 2.2): while the messages carry a question that will not wait (`flags.urgent`), neither may share a pixel with them or lie over
 * one of their buttons - not by the dialog's allowance, and not on a phone.
 */
const OVER_THE_QUESTION = /^(town scene|inside the house)$/;
const overTheQuestion = (a, b) => (a === 'messages' && OVER_THE_QUESTION.test(b)) || (b === 'messages' && OVER_THE_QUESTION.test(a));

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

/**
 * The student's screens: a Chromebook's two common panels, each whole (full screen) and inside a browser window with its
 * tabs and address bar, a smaller window, and a 1080p monitor.
 */
const STUDENT_SIZES = [
  { width: 1366, height: 768 }, { width: 1366, height: 657 },
  { width: 1280, height: 800 }, { width: 1280, height: 689 },
  { width: 1024, height: 600 }, { width: 1920, height: 1080 },
];
/** The Host's: a projector at 1080p and at its common older sizes, and the teacher's own Chromebook. */
const HOST_SIZES = [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }];

/**
 * Pairs that share pixels on purpose, each with why and where it was decided. Anything not matched here fails. `a` and `b`
 * are matched against either piece's name (a RegExp), or `kind` against either piece's kind.
 */
const DELIBERATE = [
  { kind: 'dialog', why: 'A dialog stands over the map on purpose and says so: the journal behind its own dimmed backdrop, the ending, the inside of the house, "reconnecting". Its own controls are held clear of everything (the covered check), and the guided start is not in this allowance - see below.', except: /^guided start$/ },
  { kind: 'tip', why: 'The tip is drawn at the icon the pointer or the keyboard is on, over whatever is beside it; it goes the moment the pointer leaves (docs/FAMILY_PANEL.md §4).' },
  { a: /^(house plans|house plot)$/, b: /^(family: |ability bar|map buttons|journal button|status: |wagon button|house card|lone parent ability)/, when: flags => flags.backdrop,
    why: 'Choosing a house and packing the wagon want the whole screen: the map behind goes dim and the panel says the family is behind it (docs/FAMILY_PANEL.md §12.11).' },
];
/**
 * Pairs that are faults, found here, and owned by another builder by the coordinator's say (2026-09-28): reported as PENDING on
 * every run and written to the evidence, never passed over in silence, and not failing this gate while that work is open.
 * Delete an entry the moment its owner's fix lands; the check is already written.
 */
const PENDING = [
  // The tip over the open errand was here until 2026-09-28, owned by the errand builder: fixed (a tip with no room waits).
  // The floating person card is being taken away by another builder (coordinator, 2026-09-29: a portrait's press to act as the
  // star). On the phone it lies over the column and its cards; at the supported sizes it stands on nothing, and is held there.
  { a: /^person card$/, b: /./, at: /^400x780$/, owner: 'the builder removing the floating person card (#selection), 2026-09-29' },
];
const pending = (pair, where = '') => PENDING.find(rule => (!rule.at || rule.at.test(where.split(' ').pop())) && ((rule.a.test(pair.a) && rule.b.test(pair.b)) || (rule.a.test(pair.b) && rule.b.test(pair.a))));
/**
 * The phone (owner, 2026-09-29, for the story cards): not a size a class is supported on - the gates hold 1366x768 down to
 * 1024x600, and `npm run test:panels` records its 390px pairs rather than holding them (its own note). Here the phone is held
 * for the cards at the head of the column, which must stand clear of everything on it; every other pair a phone makes (the
 * ability bar's two rows over the map's buttons, the messages over the status lines, the first-meeting tip over the rows) is
 * written to the evidence as `phoneRecorded`, printed on every run, and not held.
 * `ceiling:` the phone's own layout is not built; a supported phone size would move these into the faults.
 */
const PHONE_HELD = /^(house card|lone parent ability)$/;
const phoneOnly = (where, a, b) => where.endsWith(' 400x780') && !PHONE_HELD.test(a) && !PHONE_HELD.test(b);
const phoneRecorded = [];
const deliberate = (pair, flags) => DELIBERATE.find(rule => {
  if (rule.when && !rule.when(flags)) return false;
  if (rule.except && (rule.except.test(pair.a) || rule.except.test(pair.b))) return false;
  if (rule.kind) return pair.kinds.includes(rule.kind);
  return (rule.a.test(pair.a) && rule.b.test(pair.b)) || (rule.a.test(pair.b) && rule.b.test(pair.a));
});
/** What may lie over a control without that being a fault: a dialog or a tooltip, or the dim a dialog brings with it. */
const DELIBERATE_COVER = /^(journal|ending|inside the house|reconnecting|icon tip|lone parent scenes|#journal-backdrop|#panel-backdrop)$/;

/**
 * A class on the real land whose first family was rolled with one parent, in at its land with the house site chosen: the lone
 * parent's path is offered at the head of its column (sim/courtship.mjs, owner 2026-09-29). Rolled and brought in in process,
 * and put back in its lobby for the student to join, as `playedToTheTown` does.
 */
const LONE_SEED = (() => { for (let n = 0; n < 100000; n++) if (familyRoll(`overlap-lone-${n}`, 'hh-1') === 3) return `overlap-lone-${n}`; throw new Error('no seed'); })();
function lonelyOnTheLand(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  rollFamily(world, world.households['hh-1']);
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.arriving) && guard++ < 800) stepWorld(world);
  const household = world.households['hh-1'];
  if (household.choosingSite) chooseSite(world, household, world.map.sites[household.homeSiteId]);
  while (household.arriving && guard++ < 1200) stepWorld(world);
  world.status = 'lobby';
  return world;
}
/**
 * The same family, still with no house, on the morning its settlement's call reaches it: the neighbours' card, the house's card and
 * the call to arms (in the story cards' frame since 2026-09-29, public/military-attention.js) all on the screen at once.
 */
function lonelyAtTheCall(seed, playerCount) {
  const world = lonelyOnTheLand(seed, playerCount);
  world.status = 'running';
  for (let i = 0; i < 4000 && !world.calls?.['hh-1'] && !world.director.complete; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}
/** Whether the first family's page would carry a question that will not wait (public/military-attention.js `URGENT`). */
const askedOfTheFirst = world => militaryNotices(projectWorld(world, 'hh-1', 'student', { includeMap: false })).some(one => URGENT.has(one.kind));
/**
 * A class at home under its roofs (tests/support/settled.mjs), played in process to the morning a rider stops at the first family
 * (about ninety ticks in): the rooms of the house can be opened while the army's rider waits (triage 2026-09-29, 2.2).
 */
function housedWithARider(seed, playerCount) {
  const world = taught(keepFoundingFamilies(createSettledWorld(seed, playerCount)));
  world.status = 'running';
  for (let i = 0; i < 3000 && !askedOfTheFirst(world); i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}
/** Open one of Gonzales's scenes where the page drew it (as scripts/gonzales-town-browser-proof.mjs `openCard` does). */
async function openTownScene(page) {
  await page.waitForFunction(() => Object.keys(window.__townSceneSpots || {}).length, null, { timeout: 20000 }).catch(() => {});
  const points = await page.evaluate(() => {
    const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    const toPage = (x, y) => ({ x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height });
    return Object.entries(window.__townSceneSpots || {}).flatMap(([id, spot]) => [
      ...(window.__townCast || []).filter(one => one.sceneId === id && Number.isFinite(one.sx)).map(one => toPage(one.sx, one.sy)),
      toPage(spot.x, spot.y - (window.__camera?.figure || 18) * .4),
    ]).filter(p => p.x > 0 && p.y > 0 && p.x < innerWidth && p.y < innerHeight);
  });
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    if (await page.waitForFunction(() => !document.querySelector('#town-scene').hidden, null, { timeout: 1500 }).then(() => true, () => false)) return true;
    if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
  }
  return false;
}
/**
 * A first-meeting tip put away before a class is paused to be measured: paused, the town's talk stands still where it was said,
 * and a tip coming up after that stood on a bubble that could no longer step aside. Tips are measured in their own states.
 */
async function tipsAway(page) {
  for (let i = 0; i < 4 && await page.locator('#tip .tip-close').isVisible().catch(() => false); i++) { await page.locator('#tip .tip-close').click(); await page.waitForTimeout(300); }
}
const urgentUp = page => page.waitForFunction(() => { const one = document.querySelector('#military-notice'); return one && !one.hidden && one.dataset.urgent === 'true'; }, null, { timeout: 30000 }).then(() => true, () => false);

/** A phone, for the cards: the family's column across the top and the cards in it. */
const PHONE = { width: 400, height: 780 };

/** scripts/gonzales-town-browser-proof.mjs's class: the first family's main person in Gonzales on September 29. */
function playedToTheTown(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  let guard = 0;
  while (Object.values(world.households).some(h => h.members.some(id => world.entities[id].travel)) && guard++ < 600) stepWorld(world);
  while (sceneClock(world) < on(0, 5) && guard++ < 2000) stepWorld(world);
  const principal = world.entities[world.households['hh-1'].principalId];
  applyAction(world, 'hh-1', { action: 'travel', entityId: principal.id, destination: 'gonzales' });
  while ((principal.travel || sceneClock(world) < on(0, 11)) && guard++ < 3000) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const SHOTS = process.env.OVERLAP_SHOTS || join('test-results', 'overlap');
const RECORD = process.env.OVERLAP_RECORD || 'after';
const OUT = process.env.OVERLAP_OUT || `docs/evidence/overlap-${RECORD}.json`;
mkdirSync(SHOTS, { recursive: true });
mkdirSync('docs/evidence', { recursive: true });

const record = [];
const notReached = [];
// The card beside a person opens only for a matter it alone holds (owner, 2026-09-29: "just gets in the way"; docs/FAMILY_PANEL.md,
// amendment 2026-09-29). A portrait pressed on somebody with nothing to answer that opens it is a fault here.
const cardFaults = [];
/** After a portrait press: the card is shut, or it holds a matter (a filled section, a rider waiting) and is measured. */
async function personCard(page, state, where) {
  const card = await page.evaluate(() => {
    const node = document.querySelector('#selection');
    const filled = ['#selection-call', '#selection-flight', '#selection-nurse', '#selection-army', '#selection-work', '#selection-trade'].filter(selector => { const one = document.querySelector(selector); return one && !one.hidden && one.childElementCount; });
    const rider = document.querySelector('#listen-rider');
    return { open: Boolean(node && !node.hidden), matter: filled.length > 0 || Boolean(rider && !rider.hidden), filled, who: node?.dataset.entityId || null };
  });
  if (card.open && !card.matter) cardFaults.push({ where, what: 'person card', text: `the card opened on ${card.who} with nothing to answer` });
  else if (card.open) await walk(page, state, { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'person card' });
  return card;
}
const errors = [];

/** Measure the page at every size, with a screenshot of each, and keep what was found. */
async function walk(page, state, { sizes, furniture, host = false, settle = 450, expect = null }) {
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.waitForTimeout(settle);
    const seen = await measureScreen(page, furniture);
    const at = `${size.width}x${size.height}`;
    // Trap (a): a state whose own panel is not on the screen measured nothing, and would read as clean.
    for (const one of [expect].flat().filter(Boolean)) assert.ok(seen.drawn.some(piece => piece.name === one), `${host ? 'host' : 'student'} ${state} ${at}: "${one}" is not drawn, so this state measured nothing`);
    const shot = join(SHOTS, `${host ? 'host' : 'student'}-${state}-${at}.png`);
    await page.screenshot({ path: shot });
    // The student's page sets no type under 12 px (triage 2026-09-29, 2.12): every word drawn, in every state and at every size.
    const small = host ? [] : await readSmallText(page);
    record.push({ page: host ? 'host' : 'student', state, at, shot, small, ...seen });
  }
}

const poster = (url, cookie) => async (path, body) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  if (response.status !== 200) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response;
};

/**
 * The line the page says when the server refuses an order, with the server's own words in it. The refusal is real - an order
 * sent from this page for a journey to nowhere - and its words are put where `say` in public/app.js puts every refusal.
 * `ceiling:` the line is filled from here rather than by a button that happens to be refused in this state, because which
 * buttons are refused changes with every step of the lesson; the line's place is what is measured.
 */
async function sayARefusal(page) {
  return page.evaluate(async () => {
    const id = window.__snapshot?.world.household?.principalId || window.__snapshot?.world.household?.members?.[0];
    const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `overlap-refused-${Date.now()}`, action: 'travel', entityId: id, destination: 'nowhere-at-all' }) });
    const words = (await response.json().catch(() => ({}))).error || 'The server refused that order.';
    document.querySelector('#error').textContent = words;
    // As a refusal is followed by the page's next render, which places what stands beside the line again.
    if (window.__render && window.__snapshot) window.__render(window.__snapshot);
    return words;
  });
}
const unsay = page => page.evaluate(() => { document.querySelector('#error').textContent = ''; });

async function joinAs(page, url, app, name) {
  await page.goto(url);
  // A class stepped far in process (the fight's morning) is a large first snapshot: the join form can take a while.
  await page.locator('#join [name=name]').waitFor({ state: 'visible', timeout: 90000 });
  await page.locator('#join [name=name]').fill(name);
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId);
  await meetFamily(page);
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
try {
  // ======================================================== a class in its guided start, on the morning the call arrives
  // The real land, played in process to the morning the settlement's call reaches the family while a rider stands with
  // somebody of it (scripts/support/panel-states.mjs): the guided start, the messages, the meeting, the call's menu and the
  // site chooser all belong to this morning.
  if (section('call')) {
    const room = await startClassroom((seed, count) => playedToTheCall(seed, count), 'overlap-call');
    try {
      const { page, errors: pageErrors, context } = await openClass(room.app, browser, STUDENT_SIZES[0], room);
      await page.waitForTimeout(800);
      await walk(page, 'guided-start', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'ability bar' });

      // The rider and the call first: a rider rides on, and the screens above take the world's minutes.
      const meeting = await openEncounter(page);
      if (meeting.reached) await walk(page, 'meeting', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'meeting' });
      else notReached.push('student meeting: no rider was standing');
      await page.locator('#encounter-close').click({ force: true, timeout: 3000 }).catch(() => {});
      // The card comes back when the meeting closes (it stands aside while the rider talks) - or what waited behind the rider
      // comes up in its place, since closing a conversation moves straight on to it (owner, 2026-09-29, docs/COLONIES.md §5.4b).
      if (meeting.reached && await page.locator('#selection').evaluate(node => !node.hidden).catch(() => false)) {
        await page.setViewportSize(STUDENT_SIZES[0]);
        await page.waitForTimeout(300);
        assert.ok(await page.locator('#selection').isVisible() || await page.locator('#call-menu').isVisible(), 'neither the card nor what waited came back when the meeting closed');
      }

      const call = await openCallMenu(page);
      if (call.reached) await walk(page, 'call-menu', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'call menu' });
      else notReached.push('student call-menu: the call never reached this family');
      await page.locator('#call-menu-close').click({ force: true }).catch(() => {});

      await sayARefusal(page);
      await walk(page, 'guided-start-refused', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'error line' });
      await unsay(page);

      // The card beside a person: what pressing a portrait does.
      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('.panel-portrait').first().click().catch(() => {});
      await page.waitForTimeout(600);
      await personCard(page, 'person-card', 'student guided start, a portrait pressed');

      // The tip over an icon of the bar.
      await page.setViewportSize(STUDENT_SIZES[0]);
      const icon = page.locator('.panel-row[data-focused=true] .panel-icon').first();
      if (await icon.isVisible().catch(() => false)) {
        await icon.hover();
        await page.waitForTimeout(300);
        if (await page.locator('#panel-tip').isVisible()) await walk(page, 'icon-tip', { sizes: STUDENT_SIZES.slice(0, 1), furniture: STUDENT_FURNITURE, settle: 100, expect: 'icon tip' });
        else notReached.push('student icon-tip: no tip on hover');
        await page.mouse.move(700, 5);
      } else notReached.push('student icon-tip: no icon on the bar');

      const site = await openSite(page);
      if (site.reached) await walk(page, 'site-chooser', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'site chooser' });
      else notReached.push('student site-chooser: not offered');

      // The journal, over everything and dimming the map on purpose.
      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('#journal-toggle').click().catch(() => {});
      await page.waitForTimeout(400);
      if (await page.locator('#family-journal[data-open=true]').isVisible()) await walk(page, 'journal', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'journal' });
      else notReached.push('student journal (guided start): did not open');
      await page.locator('#journal-close').click({ force: true }).catch(() => {});

      // The guided start stopped with its X: "Resume tutorial" where the strip was, for five minutes (docs/LESSON.md).
      await page.setViewportSize(STUDENT_SIZES[0]);
      if (await page.locator('#lesson-stop').isVisible().catch(() => false)) {
        await page.locator('#lesson-stop').click();
        await page.locator('#lesson-stop-yes').click();
        await page.locator('#lesson-resume').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
        if (await page.locator('#lesson-resume').isVisible()) await walk(page, 'resume-offered', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'resume tutorial' });
        else notReached.push('student resume-offered: no "Resume tutorial" after the X');
      } else notReached.push('student resume-offered: the guided start has no X');
      errors.push(...pageErrors);
      await context.close();
    } finally { await room.app.close(); }
  }

  // ================================================== the lone parent's path: the ability at the head of the column, and the scenes
  if (section('lone')) {
    const room = await startClassroom(lonelyOnTheLand, LONE_SEED);
    try {
      const { page, errors: pageErrors, context } = await openClass(room.app, browser, STUDENT_SIZES[0], room);
      await page.locator('#ask-neighbours').waitFor({ state: 'visible', timeout: 30000 });
      await walk(page, 'lone-parent-ability', { sizes: [...STUDENT_SIZES, PHONE], furniture: STUDENT_FURNITURE, expect: 'lone parent ability' });
      // Folded by "Not now" to its glowing icon, which stays.
      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('#ask-neighbours-later').click();
      await walk(page, 'lone-parent-folded', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'lone parent ability' });
      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('#ask-neighbours-open').click();
      await page.locator('#ask-neighbours-go').click();
      await page.locator('#courtship').waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForFunction(() => window.__courtship?.mode === 'scene', null, { timeout: 30000 });
      await walk(page, 'lone-parent-scenes', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'lone parent scenes' });
      errors.push(...pageErrors);
      await context.close();
    } finally { await room.app.close(); }
  }
  // ================================ the story cards together (owner, 2026-09-29): the neighbours', the house's and the call to arms
  if (section('cards')) {
    const room = await startClassroom(lonelyAtTheCall, LONE_SEED);
    try {
      const { page, errors: pageErrors, context } = await openClass(room.app, browser, STUDENT_SIZES[0], room);
      await page.locator('#house-card').waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForFunction(() => !document.querySelector('#military-notice').hidden, null, { timeout: 30000 }).catch(() => {});
      const cards = await page.evaluate(() => ({ ask: !document.querySelector('#ask-neighbours').hidden, alert: document.querySelector('#military-notice').hidden ? null : document.querySelector('#military-notice').dataset.accent }));
      if (!cards.ask || !cards.alert) notReached.push(`student story-cards: the neighbours' card ${cards.ask ? 'shown' : 'not shown'}, the alert ${cards.alert || 'not shown'}`);
      await walk(page, 'story-cards', { sizes: [STUDENT_SIZES[0], STUDENT_SIZES[4], PHONE], furniture: STUDENT_FURNITURE, expect: 'house card' });
      errors.push(...pageErrors);
      await context.close();
    } finally { await room.app.close(); }
  }
  // ============================ the rooms of the house open while the army's rider waits (triage 2026-09-29, 2.2): he is not hidden
  if (section('rooms')) {
    const room = await startClassroom(housedWithARider, 'overlap-rooms');
    try {
      const { page, errors: pageErrors, context } = await openClass(room.app, browser, STUDENT_SIZES[0], room);
      const asked = await urgentUp(page);
      const house = page.locator('.panel-house:not([hidden])').first();
      if (asked && await house.isVisible().catch(() => false)) {
        await house.click();
        await page.locator('#interior').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        await tipsAway(page);
        // Paused by the teacher while it is measured, so the rider does not ride on in the middle of it.
        await room.post('/api/command', { id: `overlap-rooms-pause-${Date.now()}`, action: 'pause' }, room.hostCookie);
        await page.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 15000 }).catch(() => {});
        if (await page.locator('#interior').isVisible() && await urgentUp(page)) await walk(page, 'rooms-asked', { sizes: [...STUDENT_SIZES, PHONE], furniture: STUDENT_FURNITURE, expect: ['inside the house', 'messages'] });
        else notReached.push('student rooms-asked: the rooms or the question were gone before they were measured');
      } else notReached.push(`student rooms-asked: ${asked ? 'no House on the main person\'s row' : 'no question that will not wait reached the family'}`);
      errors.push(...pageErrors);
      await context.close();
    } finally { await room.app.close(); }
  }

  // ========================================================================== a class past its guided start, at home
  if (section('home')) {
    // The Host's spotlight is lit in the world as the class is made, with the real words of the first one a class sees
    // (sim/directors.mjs, the dawn at Gonzales): the banner is what is measured, and waiting for the fight takes an hour.
    // Saved to a folder of its own, so the Host has its Classes list (server/app.mjs `shelfDir`), which a class kept only in
    // memory does not.
    const saves = mkdtempSync(join(tmpdir(), 'texas-overlap-'));
    const app = createClassroom({ seed: 'overlap-home', playerCount: 5, tickMs: 700, savePath: join(saves, 'classroom.json'), worldFactory: (seed, count) => {
      const world = taught(keepFoundingFamilies(createSettledWorld(seed, count)));
      spotlight(world, { key: 'gonzales-dawn', text: 'Gonzales, first light on October 2: the Texian volunteers go out of the timber on Williams’s land against Castañeda’s dragoons.', siteId: 'gonzales', claimId: 'HIST-TEX-473' });
      return world;
    } });
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    try {
      const hostCookie = (await poster(url)('/api/host', { key: app.state.hostKey })).headers.get('set-cookie').split(';')[0];
      const send = poster(url, hostCookie);
      // The Host's page in the lobby: the class size, late students, the classes, the join links and the days a game takes.
      const hostContext = await browser.newContext({ viewport: HOST_SIZES[0] });
      const host = await hostContext.newPage();
      host.on('pageerror', error => errors.push(`host: ${error.message}`));
      await host.goto(`${url}/host#${app.state.hostKey}`);
      await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
      await host.waitForTimeout(600);
      await walk(host, 'lobby', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, expect: 'teacher controls' });
      for (const toggle of ['#classes-toggle', '#recover-toggle']) await host.locator(toggle).click().catch(() => {});
      await walk(host, 'lobby-panels-open', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, expect: 'recover' });
      for (const toggle of ['#classes-toggle', '#recover-toggle']) await host.locator(toggle).click().catch(() => {});

      const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: STUDENT_SIZES[0] });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await joinAs(page, url, app, 'Chromebook');
      for (let i = 2; i <= 5; i++) await poster(url)('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
      // The lobby: packing the wagon, then "Repack the wagon" once it is done, until the teacher presses Start.
      await page.waitForTimeout(600);
      if (await page.locator('#wagon-load').isVisible().catch(() => false)) {
        await walk(page, 'lobby-wagon', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'wagon load' });
        await page.setViewportSize(STUDENT_SIZES[0]);
        await page.locator('#wagon-done').click();
        await page.waitForTimeout(500);
      } else notReached.push('student lobby-wagon: no wagon to pack');
      await walk(page, 'lobby', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE });
      await page.setViewportSize(STUDENT_SIZES[0]);
      await send('/api/command', { id: `overlap-start-${Date.now()}`, action: 'start', anyway: true });
      await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
      if (await page.locator('#tutorial-skip').isVisible().catch(() => false)) await page.locator('#tutorial-skip').click();
      await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icons'), null, { timeout: 30000 });
      await page.waitForTimeout(800);
      await walk(page, 'at-home', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'ability bar' });
      await host.waitForFunction(() => !document.querySelector('#host-spotlight')?.hidden, null, { timeout: 10000 }).catch(() => {});
      if (await host.locator('#host-spotlight').isVisible()) await walk(host, 'running-spotlight', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, expect: 'spotlight' });
      else { notReached.push('host running-spotlight: the banner was not drawn'); await walk(host, 'running', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true }); }

      // The sound's panel of sliders, opened from its button beside the Journal.
      await page.setViewportSize(STUDENT_SIZES[0]);
      if (await page.locator('#sound-toggle').isVisible().catch(() => false)) {
        await page.locator('#sound-toggle').click();
        await page.waitForTimeout(300);
        if (await page.locator('#sound-panel').isVisible()) await walk(page, 'sound-panel', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'sound panel' });
        await page.locator('#sound-toggle').click().catch(() => {});
      } else notReached.push('student sound-panel: no sound control');

      await sayARefusal(page);
      await walk(page, 'at-home-refused', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'error line' });
      await unsay(page);

      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('.panel-portrait').first().click().catch(() => {});
      await page.waitForTimeout(700);
      await personCard(page, 'home-person-card', 'student at home, a portrait pressed');
      await page.locator('#selection-close').click({ force: true }).catch(() => {});

      // The errand to town, chosen in a popup before anybody leaves (docs/TOWNS.md §4b).
      await page.setViewportSize(STUDENT_SIZES[0]);
      const shop = page.locator('.panel-row[data-focused=true] .panel-icon[data-key="visit-shop"]');
      if (await shop.isVisible().catch(() => false)) {
        await shop.click();
        await page.locator('#errand').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        await page.waitForFunction(() => document.querySelectorAll('#errand .errand-line').length > 3, null, { timeout: 10000 }).catch(() => {});
        if (await page.locator('#errand').isVisible()) await walk(page, 'errand', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'errand popup' });
        else notReached.push('student errand: the popup never opened');
        await page.locator('#errand-cancel').click({ force: true }).catch(() => {});
      } else notReached.push('student errand: no "go to a shop" icon on the bar');

      // How they will go (docs/FAMILY_PANEL.md §15): a journey's icon asks the way before anybody leaves.
      await page.setViewportSize(STUDENT_SIZES[0]);
      const keys = await page.evaluate(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(one => one.dataset.key));
      const journey = keys.find(key => /^travel|visit-(?!shop)/.test(key || ''));
      if (journey) {
        await page.locator(`.panel-row[data-focused=true] .panel-icon[data-key="${journey}"]`).click().catch(() => {});
        await page.locator('#going').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        if (await page.locator('#going').isVisible()) await walk(page, 'going', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'going popup' });
        else notReached.push(`student going: "${journey}" did not ask the way`);
        await page.locator('#going-cancel').click({ force: true }).catch(() => {});
      } else notReached.push(`student going: no journey on the bar (${keys.join(', ')})`);

      // The journal, with the family's key and its story.
      await page.setViewportSize(STUDENT_SIZES[0]);
      await page.locator('#journal-toggle').click().catch(() => {});
      await page.waitForTimeout(400);
      if (await page.locator('#family-journal[data-open=true]').isVisible()) await walk(page, 'home-journal', { sizes: STUDENT_SIZES.slice(0, 2), furniture: STUDENT_FURNITURE, expect: 'journal' });
      else notReached.push('student home-journal: did not open');
      await page.locator('#journal-close').click({ force: true }).catch(() => {});

      // Paused by the teacher.
      await send('/api/command', { id: `overlap-pause-${Date.now()}`, action: 'pause' });
      await page.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 15000 }).catch(() => {});
      await walk(page, 'paused', { sizes: STUDENT_SIZES.slice(0, 2), furniture: STUDENT_FURNITURE, expect: 'ability bar' });
      await send('/api/command', { id: `overlap-resume-${Date.now()}`, action: 'resume' });

      // The end: the ending over the map, then closed, with its way back.
      await send('/api/command', { id: `overlap-end-${Date.now()}`, action: 'end' });
      await page.waitForFunction(() => window.__snapshot?.world.status === 'ended', null, { timeout: 20000 }).catch(() => {});
      await page.locator('#ending').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      if (await page.locator('#ending').isVisible()) {
        await walk(page, 'ending', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'ending' });
        await page.locator('#ending-close').click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
        await walk(page, 'ended-map', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'ending button' });
      } else notReached.push('student ending: the class did not end');
      await host.waitForTimeout(600);
      await walk(host, 'ended', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, expect: 'ending' });
      await host.locator('#ending-close').click({ force: true }).catch(() => {});
      await host.waitForTimeout(300);
      await walk(host, 'ended-map', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, expect: 'ending button' });
      await context.close();
      await hostContext.close();
    } finally { await app.close(); rmSync(saves, { recursive: true, force: true }); }
  }

  // ================================================================================== a fight, as the Host watches it
  // The class at Gonzales played in process to first light on October 2 (tests/support/battle.mjs), and handed to the
  // browser running: the Host sees the fight drawn with its caption over the top of the map, and the spotlight's banner.
  if (section('fight')) {
    const app = createClassroom({ seed: 'overlap-fight', playerCount: 5, tickMs: 4000, worldFactory: seed => {
      const world = gonzalesClass(seed, { fighters: 'first' });
      stepUntil(world, () => battleState(world, 'gonzales')?.phase?.id === 'dawn-skirmish', 3000);
      return world;
    } });
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    try {
      const hostContext = await browser.newContext({ viewport: HOST_SIZES[0] });
      const host = await hostContext.newPage();
      host.on('pageerror', error => errors.push(`host: ${error.message}`));
      await host.goto(`${url}/host#${app.state.hostKey}`);
      await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
      const fighting = await host.waitForFunction(() => window.__snapshot?.world.battle && window.__battleCaption, null, { timeout: 20000 }).then(() => true, () => false);
      if (fighting) await walk(host, 'fight', { sizes: HOST_SIZES, furniture: HOST_FURNITURE, host: true, settle: 700 });
      else notReached.push('host fight: no fight was drawn');
      // A student who comes late, into a class already running on the morning of the fight (B2 of the classroom audit):
      // the first screen they see, whatever their family is doing.
      const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: STUDENT_SIZES[0] });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(`late: ${error.message}`));
      await joinAs(page, url, app, 'Late');
      await page.waitForFunction(() => document.querySelector('#family-panel') && !document.querySelector('#family-panel').hidden, null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(800);
      await walk(page, 'late-on-the-fight-morning', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE });
      await context.close();
      await hostContext.close();
    } finally { await app.close(); }
  }

  // ======================================================================= Gonzales, where people talk over their heads
  // The class scripts/gonzales-town-browser-proof.mjs builds: the real land, played to the morning of September 29 with the
  // first family's main person walked into town, where the town's scenes are said in bubbles over the speakers
  // (public/speech.js). Measured, not held: a bubble goes where its speaker stands.
  if (section('town')) {
    const app = createClassroom({ seed: 'gonzales-town-proof', playerCount: 5, tickMs: 1400, worldFactory: playedToTheTown });
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    try {
      const hostCookie = (await poster(url)('/api/host', { key: app.state.hostKey })).headers.get('set-cookie').split(';')[0];
      const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: STUDENT_SIZES[0] });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(`town: ${error.message}`));
      await joinAs(page, url, app, 'Watcher');
      for (let i = 2; i <= 5; i++) await poster(url)('/api/join', { name: `Student ${i}`, code: app.state.sessionCode });
      if (await page.locator('#wagon-done').isVisible().catch(() => false)) await page.locator('#wagon-done').click();
      await poster(url, hostCookie)('/api/command', { id: `overlap-town-start-${Date.now()}`, action: 'start', anyway: true });
      await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
      if (await page.locator('#lesson-stop').isVisible().catch(() => false)) {
        await page.locator('#lesson-stop').click();
        await page.locator('#lesson-stop-yes').click();
        await page.waitForFunction(() => !window.__snapshot.world.lesson, null, { timeout: 15000 }).catch(() => {});
      }
      if (await page.locator('#selection-close').isVisible().catch(() => false)) await page.locator('#selection-close').click();
      await page.locator('#map-nav [data-view=gonzales]').click();
      await page.waitForFunction(() => window.__camera?.scale >= 200, null, { timeout: 10000 }).catch(() => {});
      const talking = await page.waitForFunction(() => (window.__townSaid || []).some(line => line.box), null, { timeout: 45000, polling: 100 }).then(() => true, () => false);
      if (talking) await walk(page, 'town-talk', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, settle: 250 });
      else notReached.push('student town-talk: nobody spoke in Gonzales within 45s');
      // A scene's card open while the family is asked something that will not wait (triage 2026-09-29, 2.2): the family in this
      // class is asked from the day its man reaches the town. Paused while it is measured, so the scene does not end under it.
      await page.setViewportSize(STUDENT_SIZES[0]);
      const asked = await urgentUp(page);
      await tipsAway(page);
      if (asked && await openTownScene(page)) {
        await tipsAway(page);
        await poster(url, hostCookie)('/api/command', { id: `overlap-town-pause-${Date.now()}`, action: 'pause' });
        await page.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 15000 }).catch(() => {});
        if (await page.locator('#town-scene').isVisible() && await urgentUp(page)) await walk(page, 'town-scene-asked', { sizes: [...STUDENT_SIZES, PHONE], furniture: STUDENT_FURNITURE, expect: ['town scene', 'messages'] });
        else notReached.push('student town-scene-asked: the scene or the question were gone before they were measured');
      } else notReached.push(`student town-scene-asked: ${asked ? 'no scene could be opened' : 'no question that will not wait reached the family'}`);
      await context.close();
    } finally { await app.close(); }
  }

  // ================================================================================ Play Solo: Pause, Resume and Save
  if (section('solo')) {
    const app = createClassroom({ seed: 'overlap-solo', playerCount: 15, tickMs: 700, solo: true });
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    try {
      const game = await (await poster(url)('/api/solo', { key: app.state.hostKey })).json();
      const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: STUDENT_SIZES[0] });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(`solo: ${error.message}`));
      await page.goto(game.playUrl);
      await meetFamily(page, 'Solitaire');
      await page.locator('#solo-controls').waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1200);
      if (await page.locator('#solo-controls').isVisible()) {
        await walk(page, 'solo', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'solo controls' });
        await page.setViewportSize(STUDENT_SIZES[0]);
        await page.locator('.panel-portrait').first().click().catch(() => {});
        await page.waitForTimeout(600);
        await personCard(page, 'solo-person-card', 'Play Solo, a portrait pressed');
        await page.locator('#selection-close').click({ force: true }).catch(() => {});
        await page.locator('[data-solo=solo-save]').click().catch(() => {});
        await page.waitForTimeout(500);
        await walk(page, 'solo-saved', { sizes: STUDENT_SIZES, furniture: STUDENT_FURNITURE, expect: 'solo controls' });
      } else notReached.push('student solo: no solo controls');
      await context.close();
    } finally { await app.close(); }
  }
} finally {
  await browser.close();
}

// -------------------------------------------------------------------------------------------------------- the verdict
const faults = [...cardFaults];
const allowed = [];
const held = [];
for (const one of record) {
  const where = `${one.page} ${one.state} ${one.at}`;
  // Type under the least a student's page may set (2.12), one fault for each piece of text wherever it was seen.
  for (const entry of one.small || []) faults.push({ where, what: 'small type', text: `${entry.at} "${entry.text}" is set at ${entry.size}px, under ${LEAST_TYPE}px` });
  for (const pair of one.overlaps) {
    if (one.flags?.urgent && overTheQuestion(pair.a, pair.b)) { faults.push({ where, what: 'over the question', text: `${pair.a} and ${pair.b} share ${pair.shared.w}x${pair.shared.h}px at ${pair.at.x},${pair.at.y} while the messages ask something that will not wait` }); continue; }
    const rule = deliberate(pair, one.flags);
    const theirs = pending(pair, where);
    if (rule) allowed.push({ where, a: pair.a, b: pair.b, shared: pair.shared, why: rule.why });
    else if (theirs) held.push({ where, a: pair.a, b: pair.b, shared: pair.shared, owner: theirs.owner });
    else if (phoneOnly(where, pair.a, pair.b)) phoneRecorded.push(`${where}: ${pair.a} and ${pair.b} share ${pair.shared.w}x${pair.shared.h}px`);
    else faults.push({ where, what: 'overlap', text: `${pair.a} and ${pair.b} share ${pair.shared.w}x${pair.shared.h}px at ${pair.at.x},${pair.at.y}` });
  }
  for (const entry of one.covered) {
    if (!entry.centre && entry.points < 3) continue;
    if (one.flags?.urgent && entry.by.some(by => overTheQuestion(entry.in, by))) { faults.push({ where, what: 'over the question', text: `"${entry.control}" in ${entry.in} is under ${entry.by.join(', ')} while the messages ask something that will not wait` }); continue; }
    if (entry.by.every(by => DELIBERATE_COVER.test(by))) continue;
    const theirs = entry.by.every(by => pending({ a: entry.in, b: by }, where));
    if (theirs) { held.push({ where, a: entry.in, b: entry.by.join(', '), shared: { w: 0, h: 0 }, owner: pending({ a: entry.in, b: entry.by[0] }, where).owner, control: entry.control }); continue; }
    if (entry.by.every(by => phoneOnly(where, entry.in, by))) { phoneRecorded.push(`${where}: "${entry.control}" in ${entry.in} under ${entry.by.join(', ')}`); continue; }
    faults.push({ where, what: 'covered', text: `"${entry.control}" in ${entry.in} is under ${entry.by.join(', ')} (${entry.points} of ${entry.of} points${entry.centre ? ', the middle too' : ''})` });
  }
  for (const entry of one.offScreen) faults.push({ where, what: 'off the screen', text: `${entry.name} at ${JSON.stringify(entry.box)}` });
  for (const entry of one.unreachable || []) faults.push({ where, what: 'cut away', text: `"${entry.control}" in ${entry.in} is cut off by ${entry.cutBy}, which does not scroll` });
  for (const entry of one.canvas.hidden) {
    // A bubble goes where its speaker stands, so its edge may touch a panel as they walk; half of it under one is words a
    // student cannot read, which `speechRoom` in public/app.js exists to prevent.
    // The fight's caption is a paragraph a student reads: a tenth of it under a panel is a line gone.
    if (entry.share < (/^bubble/.test(entry.what) ? 0.5 : /caption/.test(entry.what) ? 0.1 : 0.25)) continue;
    // The family frame is the camera's own (Follow): a person it happens to put under a panel is one press on their
    // portrait from the middle of the screen. What is held is the person the student has put the camera on.
    if (/being ordered/.test(entry.what) && one.following) continue;
    faults.push({ where, what: 'canvas', text: `${entry.what} is ${Math.round(entry.share * 100)}% under ${entry.under}` });
  }
}
const bubbles = record.flatMap(one => one.canvas.hidden.filter(entry => /^bubble/.test(entry.what)).map(entry => ({ where: `${one.page} ${one.state} ${one.at}`, ...entry })));
const bubblesSeen = record.reduce((sum, one) => sum + one.canvas.read.filter(entry => /^bubble/.test(entry.what)).length, 0);

const byWhat = new Map();
for (const fault of faults) { const key = `${fault.what}: ${fault.text.replace(/\d+x\d+px at \d+,\d+/, '').replace(/ \(\d of \d points.*\)$/, '')}`; if (!byWhat.has(key)) byWhat.set(key, []); byWhat.get(key).push(fault.where); }
console.log(`\n${record.length} screens measured (${new Set(record.map(one => `${one.page} ${one.state}`)).size} states), ${faults.length} faults, ${allowed.length} deliberate overlaps`);
for (const [key, where] of byWhat) console.log(`FAULT ${key}\n      at ${where.join('; ')}`);
for (const line of notReached) console.log(`NOT REACHED ${line}`);
for (const one of held) console.log(`PENDING ${one.where}: ${one.a} and ${one.b} share ${one.shared.w}x${one.shared.h}px - owned by ${one.owner}`);
for (const line of phoneRecorded) console.log(`PHONE (recorded, not held) ${line}`);
console.log(`speech bubbles: ${bubblesSeen} measured, ${bubbles.length} partly under a panel${bubbles.length ? `: ${bubbles.map(one => `${one.where} ${one.what} under ${one.under} ${Math.round(one.share * 100)}%`).join('; ')}` : ''}`);
if (errors.length) console.log(`page errors: ${errors.join(' | ')}`);

writeFileSync(OUT, `${JSON.stringify({
  record: `overlap-${RECORD}`, date: new Date().toISOString().slice(0, 10),
  task: 'Owner, 2026-09-28: "Check for UI elements that block others. Move them somewhere else." Every kind of thing the student\'s and the Host\'s page put on the screen, at Chromebook, smaller-window, 1080p and projector sizes; pairs sharing pixels, controls drawn over, pieces off the screen, and panels over what the canvas draws for a student to read.',
  environment: 'Same computer: local classroom servers and headless Chrome at emulated sizes. Not a Chromebook, a projector, a physical LAN or a touch screen.',
  studentSizes: STUDENT_SIZES, hostSizes: HOST_SIZES, deliberate: DELIBERATE.map(rule => ({ ...(rule.kind ? { kind: rule.kind } : { a: String(rule.a), b: String(rule.b) }), why: rule.why })),
  summary: { screens: record.length, faults: faults.length, allowed: allowed.length, bubblesMeasured: bubblesSeen, bubblesUnderAPanel: bubbles.length },
  // Grouped: one entry per thing wrong, with every screen it was wrong on.
  faults: [...byWhat].map(([what, where]) => ({ what, where })), pendingElsewhere: held, phoneRecorded, notReached, bubbles, pageErrors: errors,
  // Each screen as measured, kept small: what was drawn where, every pair that shared pixels, and the controls that count.
  screens: record.map(one => ({ page: one.page, state: one.state, at: one.at, shot: one.shot, following: one.following, unreachable: one.unreachable, drawn: one.drawn.map(piece => `${piece.name} ${piece.box.x},${piece.box.y} ${piece.box.w}x${piece.box.h}`), overlaps: one.overlaps.map(pair => `${pair.a} x ${pair.b} ${pair.shared.w}x${pair.shared.h}`), covered: one.covered.filter(entry => entry.centre || entry.points >= 3).map(entry => `"${entry.control}" in ${entry.in} under ${entry.by.join(', ')}`), offScreen: one.offScreen, canvas: one.canvas.hidden, ...(Object.values(one.flags).some(Boolean) && { flags: one.flags }) })),
}, null, 2)}\n`);
console.log(`wrote ${OUT}`);

assert.deepEqual(errors, [], `the pages threw: ${errors.join(' | ')}`);
// The army's question over the town's scene and over the rooms (2.2) is not a state this proof may quietly fail to reach.
assert.deepEqual(notReached.filter(line => /(rooms|town-scene)-asked/.test(line)), [], 'the question over the scene or the rooms was not measured');
assert.deepEqual(faults.map(one => `${one.where}: ${one.what}: ${one.text}`), [], `${faults.length} things on the screen stand on something else`);
console.log('PASS nothing on the screen stands on anything else, at every size and in every state reached');
