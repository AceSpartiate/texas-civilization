// The Alamo drawn by the one renderer (public/battle-view.js), from the engine's own projection of sim/battles/alamo.mjs, on
// a canvas that records what is drawn: the garrison along its walls, the guns and their canister, the named people where the
// record puts them, the ladders, the night, and a family's own man going down at his post and lying still (docs/BATTLES.md
// §7). Each test is proved by an injection that fails it and no other in this file (scripts/battle-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity } from '../public/battle-view.js';
import { militaryNotices } from '../public/military-attention.js';
import { phaseOffset, projectBattle } from '../sim/battle-stage.mjs';
import { ALAMO } from '../sim/battles/alamo.mjs';

function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  const ctx = new Proxy({ calls, globalAlpha: 1, fillStyle: '', measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { if (key === 'fillStyle') target.calls.push(['fillStyle', value]); target[key] = value; return true; },
  });
  return ctx;
}
function fakeArt() {
  const drawn = [];
  return {
    drawn,
    animated: (ctx, clip, x, y, size, seed, options) => { drawn.push({ clip, x, y, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { drawn.push({ sprite, x, y, ...options }); return size; },
    miniPerson: () => {},
  };
}
// Béxar at the map's origin; the compound 0.3 miles east. A camera at the compound's scale.
const camera = { toScreen: p => ({ x: 683 + (p.x - 0.33) * 2600, y: 384 + (p.y + 0.11) * 2600 }), figure: 40, scale: 2600 };
const world = minute => ({ minute, map: { sites: { bexar: { x: 0, y: 0 } } }, battles: { alamo: { id: 'alamo', start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } });
const at = (phase, into = 0) => phaseOffset(ALAMO, phase) + into;
const alamo = (minute, options = {}) => projectBattle(world(minute), 'alamo', options);
/** Frames at 60 a second for `seconds`, the clock moving `perTick` minutes each `tickMs`. */
function run(view, art, from, { seconds, perTick = 2, tickMs = 1000, options = {}, t0 = 0 }) {
  let last = null, ctx = null;
  for (let t = t0; t < t0 + seconds * 1000; t += 1000 / 60) {
    ctx = fakeContext();
    last = view.draw(ctx, alamo(from + Math.floor((t - t0) / tickMs) * perTick, options), { camera, time: t, now: t, tickMs, wind: { x: 0.3, y: 0 }, bounds: { width: 1366, height: 768 } });
  }
  return { last, ctx };
}

test('the garrison stands along its walls, evenly, each wall facing out over itself, and a family\'s man takes one place on it', () => {
  const battle = alamo(at('day-24', 100));
  const north = battle.sides.find(side => side.group === 'north'), west = battle.sides.find(side => side.group === 'west');
  assert.ok(north && west, 'the walls are not drawn as parts of the garrison');
  assert.ok(north.facing.y < -0.9 && west.facing.x < -0.9, 'a wall does not face out over itself');
  const slots = layoutSide(north);
  assert.equal(slots.length, north.drawn);
  const spanned = Math.max(...slots.map(slot => slot.across)) - Math.min(...slots.map(slot => slot.across));
  assert.ok(Math.abs(spanned - north.spread.width) < 1e-9, `the north wall's men do not stand along its length: ${spanned}`);
  assert.ok(regularity(slots.map(slot => ({ x: slot.across, y: slot.along }))) < 0.1, 'the men on the wall do not stand evenly');
  // The Mexican lines outside are loose parties, not a wall.
  assert.ok(battle.sides.filter(side => side.side === 'mexican').every(side => side.style !== 'wall'));
});

test('the guns fire each dated shot once, the defenders\' canister throws a cone of smoke, and the batteries bombard all day', () => {
  const art = fakeArt(), view = createBattleView(art);
  const { last } = run(view, art, at('repulse'), { seconds: 12, perTick: 2 });
  assert.ok(last.gunShots['north-gun'] >= 3, `the north battery fired ${last.gunShots['north-gun']} canister`);
  assert.ok(last.gunShots.eighteen >= 1, 'the 18-pounder did not fire');
  assert.ok(last.smoke >= 30, `the canister left only ${last.smoke} puffs`);
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-gun-ram' || one.clip === 'volunteer-gun-fire'), 'no crew served the defenders\' guns');
  // A day of the siege: the Mexican batteries at work, and their crews are regulars.
  const artDay = fakeArt(), day = createBattleView(artDay);
  const siege = run(day, artDay, at('day-26'), { seconds: 20, perTick: 240, tickMs: 9500 }).last;
  assert.ok(Object.keys(siege.gunShots).some(id => id.startsWith('battery-')), `no battery fired on a siege day: ${JSON.stringify(siege.gunShots)}`);
  assert.ok(artDay.drawn.some(one => one.clip === 'regular-gun-ram' || one.clip === 'regular-gun-fire'), 'the batteries have no Mexican crews');
});

test('a family\'s man at his post fires until the moment he falls, then goes down and lies still, and never fires again', () => {
  const art = fakeArt(), view = createBattleView(art);
  const man = { id: 'p-1', kind: 'person' };
  const fell = at('north-wall', 4);
  const options = { members: [man.id], memberFalls: { [man.id]: fell }, memberFacing: { [man.id]: { x: 0, y: -1 } } };
  const poses = [];
  for (let t = 0; t < 26000; t += 1000 / 30) {
    const minute = at('repulse') + Math.floor(t / 1000) * 2;
    view.draw(fakeContext(), alamo(minute, options), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    view.memberDrawn(man.id, { x: 0.33, y: -0.11 }, 40);
    poses.push({ minute, pose: view.memberPose(man, t) });
  }
  const before = poses.filter(one => one.minute < fell), after = poses.filter(one => one.minute > fell + 2);
  assert.ok(before.some(one => one.pose.clip === 'volunteer-fire-reload'), 'he did not fire before he fell');
  assert.ok(before.every(one => !/idle/.test(one.pose.clip || '')), 'he stood idle at his post while the wall was attacked');
  assert.ok(before.every(one => !one.pose.rotate && one.pose.sprite !== 'volunteer-reclining'), 'he was drawn falling before his moment');
  assert.ok(poses.some(one => one.pose.rotate), 'he was not seen going down');
  assert.ok(after.length && after.every(one => one.pose.sprite === 'volunteer-reclining' && !one.pose.clip), 'he did not lie still after he fell');
  assert.ok(view.evidence.memberFalls.includes(man.id));
});

test('Travis is drawn at the north battery, says only his documented words there, and falls among the first; Joe hides, then comes out', () => {
  const art = fakeArt(), view = createBattleView(art);
  const { last } = run(view, art, at('alarm'), { seconds: 5, perTick: 1 });
  assert.deepEqual(last.people.map(one => one.name), ['Travis']);
  assert.ok(last.linesShown.includes('al-travis'), 'Travis\'s words were not drawn over him');
  const fall = run(view, art, at('repulse'), { seconds: 6, perTick: 2, t0: 6000 }).last;
  assert.ok(fall.people.find(one => one.name === 'Travis')?.fell, 'Travis did not fall in the repulse');
  const artRooms = fakeArt(), rooms = createBattleView(artRooms);
  run(rooms, artRooms, at('rooms'), { seconds: 2, perTick: 2 });
  assert.ok(artRooms.drawn.some(one => one.clip === 'joe-hide'), 'Joe was not drawn hiding');
  const artEnd = fakeArt(), end = createBattleView(artEnd);
  const said = run(end, artEnd, at('end', 5), { seconds: 12, perTick: 1 }).last;
  assert.ok(artEnd.drawn.some(one => one.clip === 'joe-emerge'), 'Joe was not drawn coming out');
  assert.ok(said.linesShown.includes('e-joe'), 'Joe\'s own words were not drawn');
});

test('the columns carry ladders, climb the north wall on them, and the assault is fought in the dark until the dawn comes up', () => {
  const art = fakeArt(), view = createBattleView(art);
  const { ctx } = run(view, art, at('north-wall'), { seconds: 4, perTick: 2 });
  assert.ok(art.drawn.some(one => one.clip === 'regular-march-n'), 'nobody was drawn going up a ladder');
  assert.ok(ctx.calls.filter(call => call[0] === 'lineTo').length >= 12, 'no ladders were drawn');
  const dark = ctx.calls.find(call => call[0] === 'fillStyle' && /rgba\(14,20,44/.test(call[1]));
  assert.ok(dark, 'the assault before dawn was drawn in daylight');
  const artDay = fakeArt(), day = createBattleView(artDay);
  const noon = run(day, artDay, at('day-26', 300), { seconds: 1 }).ctx;
  assert.ok(!noon.calls.some(call => call[0] === 'fillStyle' && /rgba\(14,20,44/.test(call[1])), 'a siege day was drawn dark');
  assert.ok(alamo(at('advance')).light > alamo(at('end', 25)).light, 'the dawn did not come up through the assault');
});

test('the red flag of no quarter flies over Béxar as a plain red field, never as the Come and Take It flag', () => {
  const art = fakeArt(), view = createBattleView(art);
  const { ctx } = run(view, art, at('red-flag', 30), { seconds: 1, perTick: 20 });
  assert.ok(ctx.calls.some(call => call[0] === 'fillStyle' && call[1] === '#a3241c'), 'the red flag was not drawn red');
  assert.ok(!art.drawn.some(one => one.clip === 'flag-come-and-take-it-wind'), 'the Alamo was drawn with the Gonzales flag');
  assert.equal(alamo(at('red-flag', 30)).flag.kind, 'red');
});

test('the storming\'s card goes up over the quiet reminder that somebody is inside, and not over a question', () => {
  const world = {
    role: 'student', householdId: 'hh-1', request: null, encounter: null,
    entities: [{ id: 'p-1', name: 'Asa Tuttle', given: 'Asa', householdId: 'hh-1', health: { condition: 'well' }, service: { besieged: true, status: 'serving' } }],
    battleAlert: { id: 'battle:alamo:assault:hh-1', entityId: 'p-1', title: 'The walls are stormed', text: "At Asa Tuttle's side: they're at the walls!", field: { x: 1, y: 1 } },
  };
  const kinds = militaryNotices(world).map(notice => notice.kind);
  assert.ok(kinds.includes('battle'), `the storming's card was held back by the reminder: ${kinds}`);
  world.entities[0].service.courier = 'open';
  assert.ok(!militaryNotices(world).some(notice => notice.kind === 'battle'), 'the card went up over an open question');
});
