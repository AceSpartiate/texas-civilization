// The shot aimed by the student (owner, 2026-10-02, verbatim: "when a character goes hunting, when they see an animal the player
// should see an alert. if players click on it in time, then a first person mini game starts where they have to aim and hit the
// moving animal. if they miss, the animal runs away."; sim/hunt-aim.mjs, sim/chores.mjs `beginAim`/`fireShot`, `FIC-GONZ-1080`).
//
// The server is the authority on all of it: what was sighted, when the student began to aim (its own clock, `now`), whether the shot
// was in time and whether it hit - judged from the path it made, never the page's word. Each test here was proved by injecting the
// regression it guards (scripts/hunt-aim-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { autoChoice } from '../sim/chores.mjs';
import { QUESTION_BUDGETS } from '../sim/decision-budget.mjs';
import { AHEAD_MS, LEAD_MS, VIEW, aimPath, animalAt, handOf, judgeShot, swayAt } from '../sim/hunt-aim.mjs';
import { needsOf } from '../public/family-panel.js';
import { militaryNotices } from '../public/military-attention.js';

const NOW = 5_000_000;
const view = (world, householdId = 'hh-1', role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
/** A played family at its screen sends its son to hunt the timber, and the class runs until he has sighted something. */
function sighted(seed = 'aim', { played = true, powder = 4, auto = false, absent = false } = {}) {
  const world = createSettledWorld(seed);
  world.status = 'running';
  const household = world.households['hh-1'];
  household.played = played;
  household.resources.powder = powder;
  const hunter = world.entities['hh-1-mateo'];
  if (auto) hunter.auto = true;
  if (absent) household.absent = true;
  applyAction(world, 'hh-1', { action: 'chore', entityId: hunter.id, chore: 'hunt-timber' });
  for (let tick = 0; tick < 300 && hunter.chore && !hunter.chore.ask; tick++) stepWorld(world);
  return { world, household, hunter };
}
/** The student takes up the sighting at `NOW`; where the sights must be held to put the ball in the body at `t` (the still moment). */
function aimed(world, hunter, { calm = false, at = null } = {}) {
  applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id, ...(calm && { calm: true }) }, { now: NOW });
  const path = aimPath(hunter.chore.ask.sight, { calm });
  const t = at ?? Math.round((path.stopAt + path.goAt) / 2);
  const animal = animalAt(path, t + path.hangMs), sway = swayAt(path, t);
  return { path, t, x: animal.body.cx - sway.dx, y: animal.body.cy - sway.dy };
}
/** The trigger, as the page sends it, reaching the server a tenth of a second after the page's own `t`. */
const fire = (world, hunter, shot, now = NOW + shot.t + 100) => applyAction(world, 'hh-1', { action: 'fire-shot', entityId: hunter.id, t: shot.t, x: shot.x, y: shot.y }, { now });
const homeAgain = (world, hunter) => { for (let tick = 0; tick < 400 && hunter.chore; tick++) { stepWorld(world); validateWorld(world); } };
const said = (world, hunter, pattern) => world.events.some(event => event.actorId === hunter.id && pattern.test(event.text));

test('a sighting is an alert with a short window: the "!" and the card, fifteen real seconds, the quarry and the hunter\'s hand', () => {
  const { world, hunter } = sighted('aim-alert');
  const ask = hunter.chore.ask;
  assert.equal(ask.id, 'shot');
  assert.equal(ask.sight.quarry, 'deer', 'a class of the old rules hunts a deer');
  assert.ok(['timber', 'brush', 'open'].includes(ask.sight.cover) && ask.sight.hand.sway > 0 && typeof ask.sight.seed === 'string');
  const page = view(world);
  const shown = page.entities.find(one => one.id === hunter.id);
  assert.equal(shown.chore.ask.leftMs, QUESTION_BUDGETS.sighting, 'the sighting went to the page without its fifteen seconds');
  assert.equal(QUESTION_BUDGETS.sighting, 15_000);
  assert.equal(needsOf(page, hunter.id)[0].kind, 'sighting');
  const card = militaryNotices(page).find(notice => notice.kind === 'sighting');
  assert.ok(card, 'no card for the sighting');
  assert.equal(card.title, 'A deer!'); assert.equal(card.action, 'Take the shot'); assert.equal(card.leftMs, QUESTION_BUDGETS.sighting);
  assert.match(card.text, /downwind of a deer .* Take the shot yourself, or \w+ will\./);
  // Taken up, nothing more waits on the student there: the field is open on their page.
  applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id }, { now: NOW });
  assert.ok(!needsOf(view(world), hunter.id).some(need => need.kind === 'sighting'), 'the alert stood while the student was aiming');
});

test('clicked in time and hit: the server judges it from its own path, the powder is spent once, and the kill comes home with its hide', () => {
  const { world, household, hunter } = sighted('aim-hit');
  const before = { powder: household.resources.powder, food: household.resources.food, hides: household.resources.hides ?? 0 };
  const shot = aimed(world, hunter);
  fire(world, hunter, shot);
  assert.equal(hunter.chore.shot.hit, true, `the shot into the body missed: ${JSON.stringify(hunter.chore.shot)}`);
  assert.deepEqual(hunter.chore.flags.slice(-2), ['aimed', 'hit']);
  assert.equal(hunter.chore.ask, null);
  homeAgain(world, hunter);
  assert.equal(household.resources.powder, before.powder - 1, 'the shot did not spend exactly one powder');
  assert.ok(household.resources.food > before.food + 3, `no meat came home: ${before.food} -> ${household.resources.food}`);
  assert.equal(household.resources.hides ?? 0, before.hides + 1, 'the hide did not come home');
  assert.ok(said(world, hunter, /raised the rifle and took the shot/) && said(world, hunter, /fired in/));
  assert.ok(!said(world, hunter, /missed/));
});

test('a miss yields nothing: the powder is spent, the animal runs, and the journal says so', () => {
  const { world, household, hunter } = sighted('aim-miss');
  const powder = household.resources.powder, food = household.resources.food;
  const shot = aimed(world, hunter);
  fire(world, hunter, { ...shot, y: 0.5 }); // into the sky over it
  assert.equal(hunter.chore.shot.hit, false);
  assert.deepEqual(hunter.chore.flags.slice(-2), ['aimed', 'missed']);
  assert.equal(hunter.chore.quarry?.fled, true, 'the animal that was missed did not run');
  homeAgain(world, hunter);
  assert.equal(household.resources.powder, powder - 1, 'a missed shot spent no powder');
  assert.ok(household.resources.food <= food, `a missed shot brought food home: ${food} -> ${household.resources.food}`);
  assert.ok(said(world, hunter, /fired and missed, and the deer was away into/));
});

test('nobody took the sighting up in time: the hunter takes the shot himself, at the odds the hunt always had', () => {
  for (const [ms, ticks] of [[1000, 15], [9500, 2]]) {
    const { world, household, hunter } = sighted(`aim-silence-${ms}`);
    const powder = household.resources.powder;
    const would = autoChoice(world, household, hunter);
    let waited = 0;
    while (hunter.chore?.ask && waited < 100) { stepWorld(world, { realMs: ms }); waited++; }
    assert.equal(waited, ticks, `at ${ms} ms a tick the sighting stood ${waited} ticks, not fifteen seconds`);
    const label = { take: 'take the shot', wait: 'wait for it to come closer' }[would];
    assert.ok(said(world, hunter, new RegExp(`Nobody answered\\. \\w+ decided alone: ${label}\\.`)), `the hunter did not take the shot himself (${would})`);
    assert.ok(!world.events.some(event => event.actorId === hunter.id && event.lapsed), 'the sighting lapsed with nothing chosen, as it did before 2026-10-02');
    homeAgain(world, hunter);
    assert.equal(household.resources.powder, powder - 1, 'the hunter\'s own shot was not fired');
  }
});

test('no shot without a sighting: nothing to aim at, nothing in the sights, one shot only, never after the animal has gone', () => {
  const { world, household, hunter } = sighted('aim-refused');
  // Somebody with nothing sighted.
  const other = world.entities['hh-1-elena'] || Object.values(world.entities).find(one => one.householdId === 'hh-1' && one.kind === 'person' && one.id !== hunter.id);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'aim-shot', entityId: other.id }, { now: NOW }), /Nothing has been sighted/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'fire-shot', entityId: other.id, t: 1000, x: 8, y: 6 }, { now: NOW }), /Nothing is in the sights/);
  // Sighted, but the field never opened: a page cannot fire straight off.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'fire-shot', entityId: hunter.id, t: 3000, x: 8, y: 6 }, { now: NOW }), /Nothing is in the sights/);
  // Another family cannot aim this one's hunter.
  assert.throws(() => applyAction(world, 'hh-2', { action: 'aim-shot', entityId: hunter.id }, { now: NOW }));
  const shot = aimed(world, hunter);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id }, { now: NOW }), /already being taken/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'fire-shot', entityId: hunter.id, t: 'soon', x: 8, y: 6 }, { now: NOW + 3000 }), /could not be read/);
  fire(world, hunter, shot);
  assert.throws(() => fire(world, hunter, shot), /Nothing is in the sights/, 'a second shot at one animal');
  // Fired after it had crossed out of the view: nothing fired, nothing spent.
  const late = sighted('aim-late');
  const path = aimed(late.world, late.hunter).path;
  const powder = late.household.resources.powder;
  fire(late.world, late.hunter, { t: path.goneAt + 400, x: 8, y: 6 }, NOW + path.goneAt + 500);
  assert.equal(late.hunter.chore.shot.held, true);
  assert.deepEqual(late.hunter.chore.flags.slice(-2), ['fled', 'empty']);
  homeAgain(late.world, late.hunter);
  assert.equal(late.household.resources.powder, powder, 'a shot after the animal had gone spent powder');
  assert.ok(said(late.world, late.hunter, /gone into .* before .* fired\. No powder was spent\./));
  void household;
});

test('the page\'s moment is bounded by the server\'s own clock: a shot claimed ahead of what the server has seen is judged when it was', () => {
  const { world, hunter } = sighted('aim-clock');
  const shot = aimed(world, hunter);
  // The page claims the still moment, but the server has seen only a fifth of a second since the aim began.
  fire(world, hunter, shot, NOW + 200);
  assert.equal(hunter.chore.shot.t, 200 + AHEAD_MS, 'the claimed moment was not bounded by the server\'s clock');
  assert.equal(hunter.chore.shot.hit, false, 'a shot taken before the animal had come to its place hit it there');
});

test('the field opened and never fired: the animal is gone when its seconds are out, and nothing is spent', () => {
  const { world, household, hunter } = sighted('aim-unfired');
  const powder = household.resources.powder;
  applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id }, { now: NOW });
  let ticks = 0;
  while (hunter.chore?.ask && ticks < 50) { stepWorld(world, { realMs: 1000 }); ticks++; }
  assert.equal(ticks, QUESTION_BUDGETS.aim / 1000, `the open field stood ${ticks} seconds`);
  assert.deepEqual(hunter.chore.flags.slice(-2), ['fled', 'empty']);
  homeAgain(world, hunter);
  assert.equal(household.resources.powder, powder);
  assert.ok(said(world, hunter, /before .* fired\. No powder was spent\./));
});

test('powder: none in the house, no aim; a hit and a miss spend one; a held fire spends none', () => {
  const dry = sighted('aim-dry', { powder: 1 });
  // The last powder goes to the war with somebody before the student takes the shot.
  dry.household.resources.powder = 0;
  assert.throws(() => applyAction(dry.world, 'hh-1', { action: 'aim-shot', entityId: dry.hunter.id }, { now: NOW }), /no powder/i);
  const held = sighted('aim-held');
  const powder = held.household.resources.powder;
  aimed(held.world, held.hunter);
  applyAction(held.world, 'hh-1', { action: 'fire-shot', entityId: held.hunter.id, hold: true }, { now: NOW + 2000 });
  assert.equal(held.hunter.chore.shot.held, true);
  homeAgain(held.world, held.hunter);
  assert.equal(held.household.resources.powder, powder, 'letting it go spent powder');
  assert.ok(said(held.world, held.hunter, /held fire, and the deer was away into .* No powder was spent\./));
});

test('a hunter on auto, or a family whose student has gone, is answered at once as before: no window, nothing to aim', () => {
  for (const options of [{ auto: true }, { absent: true }]) {
    const { world, household, hunter } = sighted('aim-auto', options);
    // The question was settled the tick it was asked: the hunt went straight past it.
    assert.ok(!hunter.chore?.ask, `${JSON.stringify(options)}: the hunt stopped to ask`);
    assert.ok(!world.decisionClock || !Object.keys(world.decisionClock).some(key => key.startsWith('work:') || key.startsWith('aim:')), 'a window was opened for nobody');
    assert.throws(() => applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id }, { now: NOW }));
    void household;
  }
  // Put on auto with the sighting open: theirs to take as they judge it, not the student's to aim.
  const { world, hunter } = sighted('aim-auto-late');
  hunter.auto = true;
  assert.throws(() => applyAction(world, 'hh-1', { action: 'aim-shot', entityId: hunter.id }, { now: NOW }), /on auto/);
});

test('nobody else hears of it: another family\'s page and the Host\'s projection carry nothing of the sighting, the aim or the shot', () => {
  const { world, hunter } = sighted('aim-private');
  const seed = hunter.chore.ask.sight.seed;
  const shot = aimed(world, hunter);
  for (const [who, role] of [['hh-2', 'student'], [null, 'host']]) {
    const text = JSON.stringify(view(world, who, role));
    assert.ok(!text.includes(seed) && !text.includes('"aim"') && !text.includes('startedAt'), `${role} ${who}: the sighting reached them`);
  }
  fire(world, hunter, shot);
  for (const [who, role] of [['hh-2', 'student'], [null, 'host']]) {
    const page = view(world, who, role);
    const seen = [...(page.others || []), ...(page.entities || [])].find(one => one.id === hunter.id);
    assert.ok(!seen?.chore?.shot && !seen?.chore?.flags, `${role} ${who}: the shot reached them`);
  }
  assert.ok(view(world).entities.find(one => one.id === hunter.id).chore.shot, 'the family\'s own page was not told what came of the shot');
});

test('less motion: no bounding, a slower run and a longer stop, asked by the page and honoured by the server', () => {
  const { world, hunter } = sighted('aim-calm');
  const quick = aimPath(hunter.chore.ask.sight), calm = aimPath(hunter.chore.ask.sight, { calm: true });
  assert.ok(quick.hop > 0 && calm.hop === 0, 'the deer bounds with less motion');
  assert.ok(calm.speed < quick.speed && calm.goAt - calm.stopAt > quick.goAt - quick.stopAt && calm.swayPeriods[0] > quick.swayPeriods[0]);
  const shot = aimed(world, hunter, { calm: true });
  assert.equal(hunter.chore.ask.aim.calm, true);
  fire(world, hunter, shot);
  assert.equal(hunter.chore.shot.hit, true, 'the calm field\'s shot was judged on the quick field\'s path');
});

test('the judging: a ball finds the body where the animal is when the powder goes off, wandering with the hunter\'s hand', () => {
  const sight = { seed: 'judge', quarry: 'deer', cover: 'timber', hand: handOf({ skill: 1 }) };
  const path = aimPath(sight);
  const t = Math.round((path.stopAt + path.goAt) / 2), body = animalAt(path, t).body, sway = swayAt(path, t);
  assert.equal(judgeShot(path, { t, x: body.cx - sway.dx, y: body.cy - sway.dy }).hit, true);
  // The hand's wander is the server's to add: the sights held on the body with the wander left out may go wide.
  assert.ok(Math.hypot(sway.dx, sway.dy) <= path.sway * 1.01);
  assert.equal(judgeShot(path, { t, x: body.cx - sway.dx, y: body.cy - sway.dy - body.ry * 2.5 }).hit, false, 'a ball over its back hit');
  assert.equal(judgeShot(path, { t: LEAD_MS / 2, x: animalAt(path, 0).body.cx, y: animalAt(path, 0).body.cy }).hit, false, 'a ball hit an animal not yet in view');
  // A steadier hand wanders less, a tired one more, and a rifle put in order less again.
  assert.ok(handOf({ skill: 3 }).sway < handOf({ skill: 2 }).sway && handOf({ skill: 2 }).sway < handOf({ skill: 1 }).sway);
  assert.ok(handOf({ skill: 2, tired: true }).sway > handOf({ skill: 2 }).sway && handOf({ skill: 1, rifleTrue: true }).sway < handOf({ skill: 1 }).sway);
  // Damp powder hangs fire: the animal is judged where it is a moment after the trigger.
  const wet = aimPath({ ...sight, hand: handOf({ skill: 1, damp: true }) });
  assert.ok(wet.hangMs > 0);
  assert.equal(judgeShot(wet, { t: 1000, x: 0, y: 0 }).at, 1000 + wet.hangMs);
  // The field is the same box on every screen.
  assert.deepEqual([VIEW.w, VIEW.h], [16, 9]);
});

test('a save holds the sighting and the aim, and a broken one is refused', () => {
  const { world, hunter } = sighted('aim-save');
  aimed(world, hunter);
  validateWorld(structuredClone(world));
  const broken = structuredClone(world);
  broken.entities[hunter.id].chore.ask.sight.cover = 'ocean';
  assert.throws(() => validateWorld(broken), /Invalid sighting/);
  const noClock = structuredClone(world);
  delete noClock.entities[hunter.id].chore.ask.aim.startedAt;
  assert.throws(() => validateWorld(noClock), /Invalid aim/);
});
