// The four panels the screen-overlap study could not reach honestly, and the one instrument they are measured with.
//
// `scripts/screen-overlap-study.mjs` asks the browser what is drawn over what for every control a student can press.
// Four panels were **excluded** from it (docs/FAMILY_PANEL.md §12.11): the two that ask for a place on the map
// (`#site-choose`, `#survey-choose`), the meeting (`#encounter`) and the call's one menu (`#call-menu`). An earlier turn
// of that script simply unhid them, and **an empty panel has almost no height, so it covered nothing and the run read as
// clean** - worse than not asking. This reaches each of them with the server's own content in it instead.
//
// Shared by the study that reports what it finds and the proof that refuses to pass when it finds a fault
// (`scripts/panels-browser-proof.mjs`), so that the numbers in the evidence and the numbers the gate holds to are the
// same numbers - the arrangement `scripts/support/creation-geometry.mjs` is built on, and for the same reason.
//
// **The three traps that instrument was built around, all of which have already cost this codebase a wrong answer:**
//   (a) A hidden or empty element has a box of zero size. It overlaps nothing, it is never off the screen, and a state
//       full of them reads as clean. `measurePanel` returns `real`, and a caller that does not check it is measuring
//       nothing. This is the trap that took these four panels out of the study in the first place.
//   (b) A `position:fixed` box is **not** clipped by an ancestor that scrolls, so a naive ancestor walk reports clipping
//       that does not happen. `clipBoxOf` stops its walk at the first `position:fixed` box. The ability bar is exactly
//       such a box (`.panel-row[data-focused=true] .panel-icons` is `position:fixed`), so without this every icon on it
//       would read as clipped by the column it belongs to in the page.
//   (c) A control clipped at the fold of a scrolling list keeps its whole layout box, so a point sampled from it lands
//       on a part of a button nobody can see. On a phone the ability bar scrolls sideways, and the icons past its fold
//       would otherwise read as *covered by the bar*. Every box is cut to its clipping ancestor before it is sampled.
//
// Every number this returns was checked against screenshots looked at by eye before any of it was believed
// (`test-results/panels-*.png`).
import { createClassroom } from '../../server/app.mjs';
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../../sim/world.mjs';
import { pickSite } from '../../sim/neighbours.mjs';
import { setImprovement } from '../../sim/improvements.mjs';
import { meetFamily } from './meet-family.mjs';

/** Everything on the screen a student is meant to be able to press or read - the study's own list, unchanged. */
export const CONTROLS = 'button:not([hidden]):not(:disabled),.panel-icon,.panel-focus,.panel-name,#lesson-says,#lesson-help';

/**
 * A class on the **real land** played in process to the morning its settlement's call reaches hh-1, and handed to the
 * browser in the lobby - the arrangement `scripts/family-commands-browser-proof.mjs` uses, for the same reason: a rider
 * at the gate and a call from the settlement both take a morning of the world, and neither is what is being measured.
 *
 * It hands over three of the four states at once, because on the real land they really do arrive together: the family is
 * coming in and has a house site to choose (`#site-choose`), a rider is standing with somebody (`#encounter`), and the
 * settlement has asked the family for men (`#call-menu`).
 */
export function playedToTheCall(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  // Both at once, not whichever comes first: a seed where the rider had ridden on by the time the call arrived handed
  // over a class with no meeting in it, and the study said `#encounter` was never drawn - which is the honest answer,
  // and a waste of a run. Waited for rather than chosen by seed, so this does not turn on one lucky world.
  const standing = () => Object.values(world.encounters || {}).some(one => one.householdId === 'hh-1' && one.status === 'open');
  for (let i = 0; i < 4000 && !(world.calls?.['hh-1'] && standing()) && !world.director.complete; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

/**
 * The same class, one step further on: the house site chosen as a neighbour chooses it, the cabin standing, and the
 * guided start on the step that asks for the stake - which is the only state in which a student is offered the control
 * that opens `#survey-choose`, because the lesson shuts every other icon until its own step comes round
 * (`sim/lesson.mjs`).
 *
 * `ceiling:` the cabin is put up and the step is set here rather than played, the way
 * `scripts/family-commands-browser-proof.mjs` hands over a housed class: raising a house takes an afternoon of the world
 * and this is about where a panel is drawn, not how long a cabin takes. What the panel says is still the server's -
 * every word in it comes from `/api/plot` and the family's own grant. Play the three steps for real if a class is ever
 * measured end to end.
 */
export function playedToTheStake(seed, playerCount) {
  const world = playedToTheCall(seed, playerCount);
  // On to the morning the wagon actually stops. A family still on the track in is refused the site in the server's own
  // words ("The family chooses where its house stands when it reaches its land"), and a site refused is a stake refused:
  // the first turn of this reached a `#survey-choose` that was never drawn, and said so rather than pretending.
  // **Still running while the site is chosen.** `chooseRefusal` refuses a class in the lobby in so many words - "The
  // family chooses where its house stands when it reaches its land" - so a site chosen after the handover is no site at
  // all, and the stake stays shut behind it. The first turn of this did exactly that, and the study reported
  // `#survey-choose` as never drawn rather than pretending it had measured one.
  world.status = 'running';
  for (let i = 0; i < 2000 && world.households['hh-1'].arriving; i++) stepWorld(world);
  const land = projectWorld(world, 'hh-1', 'student', { includeMap: false }).land;
  if (land?.choosingSite?.can) {
    for (const point of pickSite(land.grant.bounds, land.choosingSite.mark)) {
      try { applyAction(world, 'hh-1', { action: 'choose-site', x: point.x, y: point.y }); break; } catch { /* the next point */ }
    }
  }
  world.status = 'lobby';
  for (const household of Object.values(world.households)) {
    delete household.house;
    setImprovement(world, household, 'cabin', 'sound');
    // `advanceLesson` only ever walks *forward*, so a step set here stands until the world finishes it.
    household.lesson = { step: 'survey' };
  }
  return world;
}

/**
 * A classroom of this shape, listening on a free port, with the Host already signed in. `tickMs` is slower than the
 * studies' usual 250: the states measured here are ones a class arrives at and then sits in, and a world running four
 * times faster than a person reads simply runs past them while the screenshots are taken.
 */
export async function startClassroom(worldFactory, seed) {
  const app = createClassroom({ seed, playerCount: 5, tickMs: 700, worldFactory });
  const port = await app.listen(0, '127.0.0.1');
  const url = `http://127.0.0.1:${port}`;
  const post = async (path, body, cookie) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    if (response.status !== 200) throw new Error(`${path}: ${response.status}`);
    return response;
  };
  const host = await post('/api/host', { key: app.state.hostKey });
  return { app, url, post, hostCookie: host.headers.get('set-cookie').split(';')[0] };
}

/** The family joined, the wizard answered and the class running, at one size. The page a student is looking at. */
export async function openClass(app, browser, screen, { url, post, hostCookie }) {
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: screen });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Chromebook');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible', timeout: 30000 });
  await post('/api/command', { id: `cmd-start-${Date.now()}`, action: 'start', anyway: true }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icons'), null, { timeout: 60000 });
  return { context, page, errors };
}

/**
 * Everything on the screen while one panel stands. Measured in the page, all of it, so that every number is the
 * browser's own and not this script's arithmetic.
 *
 * `real` is trap (a): whether the panel being measured is genuinely drawn, big enough to be a panel, and carrying
 * controls a student could press. `covered` is every control of the **page** whose own points belong to something else.
 * `against` is the plain overlap rectangle between the panel and each piece of furniture the screen is fought over by -
 * the family's column, the guided start's strip and the ability bar - because a number is what the owner asked for.
 */
export const measurePanel = (page, panelSelector, controls = CONTROLS) => page.evaluate(({ selector, selectorOfControls }) => {
  const name = element => {
    if (!element) return 'nothing';
    const id = element.id || element.closest('[id]')?.id;
    return id ? `#${id}` : `${element.tagName.toLowerCase()}.${[...element.classList].join('.') || '?'}`;
  };
  const rect = box => ({ x: Math.round(box.x ?? box.left), y: Math.round(box.y ?? box.top), w: Math.round(box.width), h: Math.round(box.height) });
  const panel = document.querySelector(selector);
  const panelBox = panel ? panel.getBoundingClientRect() : null;
  const ownControls = panel ? [...panel.querySelectorAll('button:not([hidden]):not(:disabled),input:not([type=hidden]):not(:disabled)')]
    .filter(one => { const box = one.getBoundingClientRect(); return box.width >= 2 && box.height >= 2 && getComputedStyle(one).visibility !== 'hidden'; }) : [];
  // Trap (a). A hidden panel has a box of zero size: it overlaps nothing, it is never off the screen, and a state full of
  // them reads as perfectly clean. 120x60 is smaller than any of the four really is and larger than any of them collapsed.
  const real = Boolean(panel) && !panel.hidden && getComputedStyle(panel).visibility !== 'hidden'
    && panelBox.width >= 120 && panelBox.height >= 60;

  // Trap (b): the walk stops at the first `position:fixed` box, because such a box is not clipped by an ancestor that
  // scrolls above it. The ability bar is one, and without this every icon on it reads as clipped by `#hud-left`.
  const clipBoxOf = control => {
    for (let node = control.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') return node.getBoundingClientRect();
      if (style.position === 'fixed') break;
    }
    return null;
  };
  // Trap (c): what is drawn of a control, which is its own box cut to whatever clips it. A point sampled outside this is
  // a point on a part of a button nobody can see, and on a phone - where the ability bar scrolls sideways - sampling the
  // whole layout box reads every icon past the fold as covered by the bar it is on.
  const shown = control => {
    const box = control.getBoundingClientRect(), clip = clipBoxOf(control);
    if (!clip) return box;
    const top = Math.max(box.top, clip.top), bottom = Math.min(box.bottom, clip.bottom);
    const left = Math.max(box.left, clip.left), right = Math.min(box.right, clip.right);
    return { top, bottom, left, right, x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  };

  /**
   * Who is on top at each of one control's own points, once its box has been cut to what is drawn of it. `null` means
   * the control itself is there, which is the control working.
   */
  const whoIsOnTop = control => {
    const whole = control.getBoundingClientRect();
    if (whole.width < 2 || whole.height < 2 || getComputedStyle(control).visibility === 'hidden') return null;
    const box = shown(control);
    // Scrolled out of the box it lives in is reachable - the student scrolls to it - and is not a fault.
    if (box.width < 2 || box.height < 2) return { scrolledAway: true, box: rect(whole) };
    const points = [[box.left + box.width / 2, box.top + box.height / 2],
      [box.left + 3, box.top + 3], [box.right - 3, box.top + 3], [box.left + 3, box.bottom - 3], [box.right - 3, box.bottom - 3]];
    // A panel that dims the map behind it is covering the family on purpose and says so in words (§12.11). That is the
    // answer to this study, not another instance of the fault, so it is counted apart.
    const dimmers = '#panel-backdrop,#house-plan,#house-plot';
    let deliberate = document.body.dataset.panel === 'true';
    const over = points.map(([x, y]) => {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { deliberate = false; return 'off the screen'; }
      const top = document.elementFromPoint(x, y);
      if (top && (top === control || control.contains(top) || top.contains(control))) return null;
      if (!top || !top.closest(dimmers)) deliberate = false;
      return name(top);
    });
    return {
      box, deliberate, over, blocked: over.filter(Boolean),
      onScreen: box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight,
    };
  };
  const entryFor = (control, seen) => ({
    control: name(control), label: (control.dataset?.name || control.textContent || control.getAttribute('aria-label') || '').trim().slice(0, 40),
    box: rect(seen.box), onScreen: seen.onScreen, points: seen.over.length, blocked: seen.blocked.length,
    centreBlockedBy: seen.over[0], by: [...new Set(seen.blocked)],
  });

  const covered = [], partly = [], offScreen = [], scrolledAway = [], dimmed = [];
  for (const control of document.querySelectorAll(selectorOfControls)) {
    const seen = whoIsOnTop(control);
    if (!seen) continue;
    if (seen.scrolledAway) { scrolledAway.push({ control: name(control), label: (control.textContent || '').trim().slice(0, 40), box: seen.box }); continue; }
    if (!seen.blocked.length && seen.onScreen) continue;
    const entry = entryFor(control, seen);
    if (seen.deliberate && seen.blocked.length) { dimmed.push(entry); continue; }
    if (!seen.onScreen) offScreen.push(entry);
    else if (seen.blocked.length === seen.over.length) covered.push(entry);
    else partly.push(entry);
  }
  // The panel's own controls are asked **directly** rather than looked up in the list above. Two reasons, and both have
  // put a hole in a check of this kind before: the list is drawn from the study's own selector, which is buttons and the
  // family panel's parts and no `input` at all - so a covered tick in the call's menu would never have appeared in it -
  // and `name()` answers with the nearest ancestor that has an id, so several controls of one panel share a name and a
  // match on it is a match on all of them.
  const ownCovered = ownControls.map(one => [one, whoIsOnTop(one)])
    .filter(([, seen]) => seen && !seen.scrolledAway && seen.onScreen && seen.blocked.length === seen.over.length && !seen.deliberate)
    .map(([one, seen]) => `${one.id ? `#${one.id}` : `${one.tagName.toLowerCase()}.${[...one.classList].join('.') || '?'}`} under ${[...new Set(seen.blocked)].join(', ')}`);

  // `faces` and `fold` are the folded strip itself - the portraits and the button above them - and not `#family-panel`,
  // which on a phone is a full-width flex box: measured as the faces, it has the placement panel over 268px of empty
  // box (2026-09-22). `column` stays, and stays wider than both, because its width is the widest status line.
  // The three pieces of furniture the screen is fought over by, and the plain overlap rectangle of each with the panel.
  const furniture = { column: '#hud-left', faces: '#family-rows', fold: '#family-collapse', strip: '#lesson', bar: '.panel-row[data-focused=true] .panel-icons', card: '#selection' };
  const against = {};
  for (const [label, where] of Object.entries(furniture)) {
    const node = document.querySelector(where);
    const other = node && !node.hidden ? node.getBoundingClientRect() : null;
    if (!panelBox || !other || other.width < 2 || other.height < 2) { against[label] = null; continue; }
    const wide = Math.min(panelBox.right, other.right) - Math.max(panelBox.left, other.left);
    const deep = Math.min(panelBox.bottom, other.bottom) - Math.max(panelBox.top, other.top);
    against[label] = { box: rect(other), overlapWidth: Math.round(wide), overlapHeight: Math.round(deep), shares: wide > 0 && deep > 0 };
  }

  return {
    panel: selector, real, panelBox: panelBox ? rect(panelBox) : null,
    panelFits: Boolean(panelBox) && panelBox.top >= -0.5 && panelBox.bottom <= innerHeight + 0.5 && panelBox.left >= -0.5 && panelBox.right <= innerWidth + 0.5,
    ownControls: ownControls.length,
    // A control of the panel itself that something is drawn over: the panel cannot be used at all then.
    ownControlsCovered: ownCovered,
    words: panel ? (panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140) : null,
    lessonRoom: getComputedStyle(document.body).getPropertyValue('--lesson-room').trim() || null,
    covered, partly, offScreen, scrolledOutOfItsBox: scrolledAway, dimmedOnPurpose: dimmed.length, against,
  };
}, { selector: panelSelector, selectorOfControls: controls });

/**
 * Press it the way a student does. Playwright refuses a click that would land on another element and names it, which is
 * the whole question: a control something else is drawn over is not a control. An "!" is a *pulsing* mark, so a refusal
 * for want of a still element is not a refusal for want of clear pixels, and the two are told apart here - the first is
 * no fault at all and the codebase has read it as one before.
 */
export async function pressLikeAStudent(page, selector) {
  try { await page.locator(selector).click({ timeout: 8000 }); return { pressed: true, by: null }; }
  catch (error) {
    const over = /<([a-z]+) id="([^"]+)"[^>]*>[^<]*<\/\1> from <([a-z]+) id="([^"]+)"/.exec(error.message);
    const moving = /element is not stable/.test(error.message);
    await page.locator(selector).click({ force: true, timeout: 8000 }).catch(() => {});
    return { pressed: false, by: over ? `#${over[4]}` : null, moving: moving && !over, why: error.message.replace(/[\r\n]+/g, ' ').slice(0, 200) };
  }
}

/** The rider standing with somebody of this family, and their conversation opened from the panel's own "!". */
export async function openEncounter(page) {
  const listener = await page.evaluate(() => window.__snapshot?.world.encounter?.status === 'open' ? window.__snapshot.world.encounter.listenerId : null);
  if (!listener) return { listener: null, reached: false };
  const reach = await pressLikeAStudent(page, `.panel-row[data-entity-id="${listener}"] .panel-attention`);
  await page.locator('#encounter').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  // The lines are spoken one at a time; the panel is at its full height only once the rider has finished.
  await page.waitForTimeout(1800);
  return { listener, reached: await page.locator('#encounter').isVisible(), reach };
}

/**
 * The settlement's call, opened from the "!" it puts on everybody of the family who may answer.
 *
 * **Every marked person is tried, not the first.** A rider standing with somebody is the more pressing need and their
 * "!" opens the conversation instead (docs/FAMILY_PANEL.md §11.2), so on a class that has both - which is exactly the
 * class this measures - the first mark on the panel can be somebody else's. Pressing one and believing the answer gave
 * a run in which `#call-menu` was never drawn and the card opened instead.
 */
export async function openCallMenu(page) {
  const marked = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.panel-row')]
      .filter(row => { const mark = row.querySelector('.panel-attention'); return mark && !mark.hidden; })
      .sort((a, b) => Number(b.querySelector('.panel-attention').dataset.need === 'call') - Number(a.querySelector('.panel-attention').dataset.need === 'call'))
      .map(row => row.dataset.entityId);
    // And everybody the server says may answer, mark or no mark: a mark that has not been redrawn yet is not an answer
    // to "who can open this", and the server's own list is.
    return [...new Set([...rows, ...Object.keys(window.__snapshot?.world.request?.answerers || {})])];
  });
  for (const who of marked) {
    const reach = await pressLikeAStudent(page, `.panel-row[data-entity-id="${who}"] .panel-attention`);
    await page.locator('#call-menu').waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
    if (await page.locator('#call-menu').isVisible()) { await page.waitForTimeout(500); return { who, reached: true, reach, tried: marked.length }; }
    // Whatever opened instead is put away before the next is tried, so one panel is never measured through another.
    for (const close of ['#encounter-close', '#selection-close']) await page.locator(close).click({ force: true, timeout: 2000 }).catch(() => {});
  }
  return { who: null, reached: false, tried: marked.length };
}

/**
 * All four panels, each in a real state with the server's own content in it, at one screen size. One walk, shared by
 * the study that reports what it finds and the proof that refuses to pass on a fault, so the numbers are the same
 * numbers.
 *
 * Two classes, because `#site-choose` and `#survey-choose` are the same moment of a family's life seen twice: the first
 * only exists while the house has no place, and the second only once it has one. Every state is screenshotted, because
 * nothing here was believed until it had been looked at (`test-results/panels-*.png`).
 */
export async function measureFourPanels(browser, screen, { shot } = {}) {
  const at = screen.width;
  const seen = [];
  const take = async (page, state, panel, how) => {
    const measured = await measurePanel(page, panel);
    const path = `test-results/panels-${state}-${at}.png`;
    await page.screenshot({ path });
    if (shot) shot(path);
    seen.push({ state, panel, how, screenshot: path, measured });
    return measured;
  };

  // One seed at every size, so that what changes between 1366, 1024 and a phone is the screen and nothing else.
  const first = await startClassroom(playedToTheCall, 'overlap-panels-2');
  try {
    const { context, page, errors } = await openClass(first.app, browser, screen, first);
    await page.waitForTimeout(1500);
    // **The rider first.** He is the one thing here that leaves of its own accord - "They will not wait for ever" is the
    // panel's own line - and the first turn of this walked the land-tapping first, spent twenty seconds on it and found
    // no meeting left to measure. The call waits, and the house site waits until it is chosen.
    const meeting = await openEncounter(page);
    await take(page, 'encounter', '#encounter', `a rider stopped for ${meeting.listener || 'nobody'}, the conversation opened from the panel's own "!"`);
    // The rider is let ride on rather than merely closed. A rider standing with somebody outranks the call on that
    // person's row (`needsOf` in public/family-panel.js), so a class that still has one can have no "!" left that opens
    // the menu at all - which is what happened at 390 when the conversation was only shut.
    await page.locator('#encounter .ask-leave').click({ force: true, timeout: 5000 }).catch(() => {});
    await page.locator('#encounter-close').click({ force: true, timeout: 3000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector('#encounter').hidden, null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    // "The bar comes back the instant the meeting closes" (owner, 2026-09-22): the other half of the bar stepping aside,
    // and the half a rule that only hid it would get wrong.
    seen[seen.length - 1].afterwards = await page.evaluate(() => {
      const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons');
      const box = bar?.getBoundingClientRect();
      return { meetingShut: document.querySelector('#encounter').hidden, barDrawn: Boolean(bar) && getComputedStyle(bar).display !== 'none' && box.width > 20 && box.height > 20 };
    });
    const call = await openCallMenu(page);
    await take(page, 'call-menu', '#call-menu', `the settlement's call, opened from ${call.who || 'nobody'}'s "!"`);
    await page.locator('#call-menu-close').click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    // The wagon is coming in and the family has a place to choose for the house: the panel is up of its own accord, and
    // a place on the land is tapped so it carries "Set the house here" and the server's words about that ground.
    const site = await openSite(page);
    await take(page, 'site-choose', '#site-choose', `the family coming in to its own land, a place on it looked over: "${(site.said || '').trim().slice(0, 60)}"`);
    seen[seen.length - 1].pageErrors = errors.slice();
    await context.close();
  } finally { await first.app.close(); }

  const second = await startClassroom(playedToTheStake, 'overlap-stake-1');
  try {
    const { context, page, errors } = await openClass(second.app, browser, screen, second);
    await page.waitForTimeout(1500);
    // "Opens again afterwards" (owner, 2026-09-22): the fold is asked before, during and after, because a fold that never
    // opened again would pass every overlap check here and take the student's names away for good.
    const folded = () => page.evaluate(() => document.querySelector('#family-panel')?.dataset.collapsed === 'true');
    const before = await folded();
    const survey = await openSurvey(page);
    const measured = await take(page, 'survey-choose', '#survey-choose', `the stake pressed and a place on the family's own land tapped: "${(survey.said || '').trim().slice(0, 60)}"`);
    measured.tapped = survey.tapped;
    const during = await folded();
    await page.locator('#survey-cancel').click({ force: true, timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector('#survey-choose').hidden, null, { timeout: 10000 }).catch(() => {});
    seen[seen.length - 1].afterwards = { foldedBefore: before, foldedDuring: during, panelShut: await page.locator('#survey-choose').isHidden(), foldedAfter: await folded() };
    seen[seen.length - 1].pageErrors = errors.slice();
    await context.close();
  } finally { await second.app.close(); }
  return seen;
}

/**
 * A place on the family's own land, tapped on the map the way a finger does.
 *
 * Both placement panels open with a hint and **no button at all** - `#site-build` and `#survey-send` are hidden until
 * the server has looked the ground over - so a panel measured before this has been done is a panel with no control on
 * it, which is most of trap (a) again: half a panel, and every number taken off it too small. The grant is read from
 * `window.__holdingRect`, the map's own presentation evidence, on the contract `__plotsDrawn` is on.
 */
export async function tapTheHolding(page, waitFor) {
  // The card of whoever is being watched is put away first. On a phone it is docked across the bottom half of the
  // screen, and a tap meant for the land lands on the card instead - which is how a run reached a `#site-choose` that
  // still said "Tap a place on your land" and carried no button at all.
  await page.locator('#selection-close').click({ force: true, timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
  // "Land" first, because opening a meeting takes the camera to the person it belongs to and leaves it zoomed close on
  // them: at a phone's size the holding was then not on the screen at all, and stepping out six times did not find it.
  //
  // **Sent to the element, not to the pixel.** At 390 the map's own buttons have the ability bar's bottom padding over
  // three of their five points, centre included (docs/evidence/screen-overlap-390.json), so a `force` click - which
  // still goes to a point on the screen - is taken by the bar and the camera never moves. That is a fault of the phone
  // layout, recorded in §12.12; here it is simply routed around, because this is not what is being measured.
  const pressTheMap = view => page.evaluate(which => document.querySelector(`#map-nav [data-view=${which}]`)?.click(), view);
  await pressTheMap('home');
  await page.waitForTimeout(600);
  for (let step = 0; step < 8; step++) {
    const roomy = await page.evaluate(() => {
      const holding = window.__holdingRect, canvas = document.querySelector('#world-map');
      // A margin in share of the canvas, not in pixels: 200px of a 768px screen is a wide border and of an 844px phone
      // it is most of the map, so a fixed one asks a phone for room it has not got.
      const side = canvas.width * 0.06, end = canvas.height * 0.12;
      return Boolean(holding) && holding.corners.every(point => point.x > side && point.y > end && point.x < canvas.width - side && point.y < canvas.height - end);
    });
    if (roomy) break;
    await pressTheMap('out');
    await page.waitForTimeout(350);
  }
  // A point inside the holding that is **really the map** at the moment of the tap. Asked of the browser rather than
  // worked out: the middle of the grant can be under a panel, and a tap that another element takes is not a tap on the
  // land, however good the arithmetic was.
  const at = await page.evaluate(() => {
    const holding = window.__holdingRect;
    if (!holding) return null;
    const canvas = document.querySelector('#world-map'), box = canvas.getBoundingClientRect();
    const toPage = point => ({ x: box.left + point.x * box.width / canvas.width, y: box.top + point.y * box.height / canvas.height });
    const middle = { x: holding.corners.reduce((sum, one) => sum + one.x, 0) / holding.corners.length, y: holding.corners.reduce((sum, one) => sum + one.y, 0) / holding.corners.length };
    const tries = [middle, ...holding.corners.flatMap(corner => [0.35, 0.6, 0.8].map(share => ({ x: middle.x + (corner.x - middle.x) * share, y: middle.y + (corner.y - middle.y) * share })))];
    for (const point of tries.map(toPage)) {
      if (point.x < 4 || point.y < 4 || point.x > innerWidth - 4 || point.y > innerHeight - 4) continue;
      if (document.elementFromPoint(point.x, point.y)?.id === 'world-map') return point;
    }
    return null;
  });
  if (!at) return { tapped: null, said: null };
  await page.mouse.click(at.x, at.y);
  await page.waitForFunction(where => {
    const said = document.querySelector(where)?.textContent || '';
    return /\S/.test(said) && !/Looking the (ground|place) over/.test(said);
  }, waitFor, { timeout: 15000 }).catch(() => {});
  return { tapped: at, said: await page.locator(waitFor).textContent().catch(() => null) };
}

/** The family coming in to its own land, with a place on it looked over, so the panel carries its button and its words. */
export async function openSite(page) {
  await page.locator('#site-choose').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const tap = await tapTheHolding(page, '#site-text');
  return { reached: await page.locator('#site-choose').isVisible(), ...tap };
}

/**
 * The stake pressed and a place on the family's own land tapped on the map, so that `#survey-choose` carries the
 * server's own words about that ground and not the empty hint it opens with.
 */
export async function openSurvey(page) {
  const pressed = await page.evaluate(() => {
    const icon = document.querySelector('.panel-icon[data-action=survey-start][data-chore=survey-plot]:not([aria-disabled=true])');
    if (!icon) return false;
    icon.click();
    return true;
  });
  if (!pressed) return { reached: false, tapped: null, said: null };
  await page.locator('#survey-choose').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const tap = await tapTheHolding(page, '#survey-text');
  return { reached: await page.locator('#survey-choose').isVisible(), ...tap };
}
