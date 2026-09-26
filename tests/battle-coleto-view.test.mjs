// What the renderer (public/battle-view.js) and the engine's projection (sim/battle-stage.mjs) gained for Coleto and Palm Sunday
// on 2026-09-25: the hollow square, a side drawn in parts, several guns, the light of the hour, a white flag, the surrender, a man
// who lies where he fell, a family's man drawn down, a named woman in her own figure, and the Follow card. On a canvas that
// records what is drawn, as tests/battle-view.test.mjs does; scripts/battle-coleto-browser-proof.mjs holds the same on a page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity, unitsOf } from '../public/battle-view.js';
import { militaryNotices } from '../public/military-attention.js';
import { armBattle, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { COLETO } from '../sim/battles/coleto.mjs';
import { GOLIAD_MASSACRE } from '../sim/battles/goliad-massacre.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';

function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  const ctx = new Proxy({ calls, globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { if (key === 'fillStyle') calls.push(['fillStyle', value]); target[key] = value; return true; },
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
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const bounds = { width: 1366, height: 768 };
function run(view, make, { seconds, from = 0, tickMs = 1000, named = false, ctx = null }) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(ctx || fakeContext(), make(Math.floor(t / tickMs)), { camera, time: t, now: t, tickMs, bounds, named });
  return last;
}
/** A class's world as far as the two engagements ask of it: the colonies map's places, and a clock. */
function worldAt(minute) {
  const places = coloniesMap().places;
  return { minute, map: { sites: places }, battles: {} };
}
/** The engagement's own projection at a phase, `into` minutes in: what a watching page is sent. */
function projected(def, phaseId, into = 0, { members = [], participants = {} } = {}) {
  const start = 100000;
  const phase = schedule(def, start).find(one => one.id === phaseId);
  const world = worldAt(phase.from + into);
  armBattle(world, def.id, start);
  Object.assign(world.battles[def.id].participants, participants);
  return projectBattle(world, def.id, { members });
}

test('the square is four faces of three ranks, each man facing out of his own face, drawn evenly; the marksmen in the grass are loose', () => {
  const square = layoutSide({ side: 'texian', style: 'square', drawn: 60 });
  assert.equal(square.length, 60);
  for (const face of [0, 1, 2, 3]) assert.equal(square.filter(slot => slot.face === face).length, 15);
  assert.deepEqual([...new Set(square.map(slot => slot.rank))].sort(), [0, 1, 2]);
  // Each faces out: the front face forward, the rear back, the flanks to either side.
  for (const slot of square) {
    const outward = slot.out.along ? slot.along * slot.out.along : slot.across * slot.out.across;
    assert.ok(outward > 0.02, 'a man in the square faces in');
  }
  // No two of its men stand on one spot, at the corners least of all, where two faces meet (found by the browser proof,
  // 2026-09-25: a square whose faces ran further than its inner rank stood had its corners doubled, and read as loose).
  const nearest = square.map((slot, i) => Math.min(...square.filter((_, j) => j !== i).map(other => Math.hypot(slot.along - other.along, slot.across - other.across))));
  assert.ok(Math.min(...nearest) > 0.012, `two men of the square stand ${Math.min(...nearest).toFixed(3)} miles apart`);
  assert.ok(regularity(square.map(slot => ({ x: slot.across, y: slot.along }))) < 0.2, 'the square is not even');
  const night = projected(COLETO, 'night');
  const marksmen = unitsOf(night).filter(unit => unit.side === 'mexican' && unit.style === 'loose');
  assert.ok(marksmen.length >= 3, 'the marksmen are not loose in the grass at night');
  const points = slots => slots.map(slot => ({ x: slot.across, y: slot.along }));
  const loose = layoutSide(marksmen[0]);
  assert.ok(regularity(points(loose)) > 2 * regularity(points(square.filter(slot => slot.face === 0 && slot.rank === 0))), 'the loose marksmen stand as evenly as the square');
});

test('a side in parts is drawn apart, the parts adding up to the side\'s sample; the officer\'s words come from the unit firing, and the square has its own', () => {
  const assault = projected(COLETO, 'assault-1', 18);
  const mexican = assault.sides.find(side => side.side === 'mexican');
  assert.deepEqual(mexican.parts.map(part => part.id), ['left', 'right', 'front', 'rear']);
  assert.equal(mexican.parts.reduce((sum, part) => sum + part.drawn, 0), mexican.drawn);
  // Each part stands on its own side of the square, and closer at the height of the assault than when it formed.
  const texian = assault.sides.find(side => side.side === 'texian');
  const early = projected(COLETO, 'assault-1', 0).sides.find(side => side.side === 'mexican');
  for (const part of mexican.parts) {
    const now = Math.hypot(part.x - texian.x, part.y - texian.y), then = early.parts.find(one => one.id === part.id);
    assert.ok(now < Math.hypot(then.x - texian.x, then.y - texian.y), `${part.id} did not come on`);
  }
  const art = fakeArt(), view = createBattleView(art);
  const evidence = run(view, () => assault, { seconds: 24 });
  assert.equal(evidence.units, 5, 'the square and four Mexican parts were not drawn as five bodies');
  assert.ok(evidence.figures.texian >= 55 && evidence.figures.mexican >= 50, JSON.stringify(evidence.figures));
  assert.ok(evidence.shotsBy.texian > 5 && evidence.shotsBy.mexican > 5, `both sides did not fire: ${JSON.stringify(evidence.shotsBy)}`);
  const said = new Set();
  const again = createBattleView(fakeArt());
  for (let t = 0; t < 24000; t += 1000 / 60) for (const bubble of again.draw(fakeContext(), assault, { camera, time: t, now: t, tickMs: 1000, bounds }).bubbles) said.add(bubble.text);
  assert.ok(said.has('Front rank, make ready!') || said.has('Present!'), `the square's own words were not said: ${[...said]}`);
  assert.ok(said.has('¡Apunten!') || said.has('¡Preparen las armas!'), `the Mexican officer said nothing: ${[...said]}`);
});

test('several guns fire, each shot once, served by men of their own side; the night darkens the field under the flashes', () => {
  const guns = projected(COLETO, 'guns', 12);
  assert.ok(guns.cannons.some(gun => gun.side === 'mexican') && guns.cannons.some(gun => gun.side === 'texian'), 'the battery and the corner guns are not both on the field');
  assert.ok(guns.cannons.find(gun => gun.id === 'battery-1').shots.length >= 2);
  // Not before they came up: at the first assault there is no Mexican battery.
  assert.ok(!projected(COLETO, 'assault-1', 10).cannons.some(gun => gun.side === 'mexican'), 'the Mexican battery was there before it came up in the night');
  const art = fakeArt(), view = createBattleView(art);
  const make = minute => ({ ...guns, minute: guns.minute + minute, cannons: guns.cannons.map(gun => ({ ...gun, shots: minute >= 2 ? [...gun.shots, guns.minute + 2] : gun.shots })) });
  const evidence = run(view, make, { seconds: 6 });
  assert.ok(evidence.cannonShots >= 2, `the guns did not fire: ${evidence.cannonShots}`);
  assert.ok(art.drawn.some(one => one.clip === 'regular-gun-ram') && art.drawn.some(one => one.clip === 'volunteer-gun-ram'), 'a gun was served by the other side\'s men');
  // The night: the field darkened, and the flashes drawn over the dark.
  const night = projected(COLETO, 'night', 60);
  assert.equal(night.light, 'night');
  const ctx = fakeContext();
  run(createBattleView(fakeArt()), () => night, { seconds: 8, ctx });
  const fills = ctx.calls.filter(call => call[0] === 'fillStyle').map(call => call[1]);
  assert.ok(fills.some(fill => /rgba\(10,16,40/.test(fill)), 'the night was not drawn');
  assert.equal(projected(COLETO, 'assault-1', 10).light, undefined, 'the afternoon was drawn dark');
});

test('a man who falls lies where he fell while his company falls back; a family\'s man hit is drawn down, never before; in the square he faces out of his own face', () => {
  const art = fakeArt(), view = createBattleView(art);
  const phases = ['assault-1'];
  let lying = null, company = null, moved = null;
  for (let t = 0; t < 50000; t += 1000 / 30) {
    const into = Math.floor(t / 1000);
    const battle = projected(COLETO, phases[0], into);
    view.draw(fakeContext(), battle, { camera, time: t, now: t, tickMs: 1000, bounds });
    const front = battle.sides.find(side => side.side === 'mexican').parts.find(part => part.id === 'front');
    // The fall in the front at the twenty-first minute: note where he lay, and where his company was, and later.
    if (into === 30 && !lying) { art.drawn.length = 0; view.draw(fakeContext(), battle, { camera, time: t, now: t, tickMs: 1000, bounds }); lying = art.drawn.filter(one => one.sprite === 'regular-reclining').map(one => `${Math.round(one.x)},${Math.round(one.y)}`); company = { x: front.x, y: front.y }; }
    if (into === 49) { art.drawn.length = 0; view.draw(fakeContext(), battle, { camera, time: t + 1, now: t + 1, tickMs: 1000, bounds }); moved = { at: art.drawn.filter(one => one.sprite === 'regular-reclining').map(one => `${Math.round(one.x)},${Math.round(one.y)}`), front: { x: front.x, y: front.y } }; break; }
  }
  assert.ok(lying.length >= 1, 'nobody of the front fell');
  assert.ok(Math.hypot(moved.front.x - company.x, moved.front.y - company.y) > 0.05, 'the front did not fall back');
  for (const spot of lying) assert.ok(moved.at.includes(spot), `a fallen man moved with his company: ${spot} not in ${moved.at}`);
  // A family's man: nothing before his minute, down after it; the fate itself never on the wire.
  const fell = schedule(COLETO, 100000).find(phase => phase.id === 'assault-1').from + 30;
  const participants = { 'hh-1-parent-1': { householdId: 'hh-1', fate: 'killed', at: { phase: 'assault-1', minute: fell }, down: { kind: 'killed', minute: fell } } };
  const before = projected(COLETO, 'assault-1', 20, { members: ['hh-1-parent-1'], participants });
  assert.equal(before.down, undefined, 'his fall was sent before it happened');
  const after = projected(COLETO, 'assault-1', 31, { members: ['hh-1-parent-1'], participants });
  assert.deepEqual(after.down, { 'hh-1-parent-1': { kind: 'killed', minute: fell } });
  assert.doesNotMatch(JSON.stringify(after), /"fate"|"participants"/);
  const seen = createBattleView(fakeArt());
  seen.draw(fakeContext(), after, { camera, time: 0, now: 0, tickMs: 1000, bounds });
  assert.equal(seen.memberPose({ id: 'hh-1-parent-1' }, 0).sprite, 'volunteer-reclining');
  // Alive in the square, east of its middle: he faces east, out of his own face, whichever way the square's front is.
  const alive = projected(COLETO, 'assault-1', 20, { members: ['hh-1-parent-1'] });
  const square = alive.sides.find(side => side.side === 'texian');
  const facingOf = pose => pose.sprite ? (pose.sprite.endsWith('-e') ? 'e' : pose.sprite.endsWith('-w') ? 'w' : pose.flip ? 'w' : 'e') : pose.flip ? 'w' : 'e';
  const posedAt = (dx, time) => {
    const eyes = createBattleView(fakeArt());
    eyes.memberDrawn('hh-1-parent-1', { x: square.x + dx, y: square.y }, 30);
    eyes.draw(fakeContext(), alive, { camera, time, now: time, tickMs: 1000, bounds });
    return eyes.memberPose({ id: 'hh-1-parent-1' }, time);
  };
  for (const time of [0, 2500, 5000, 9000]) {
    assert.equal(facingOf(posedAt(0.06, time)), 'e', 'a man on the east face of the square faced in');
    assert.equal(facingOf(posedAt(-0.06, time)), 'w', 'a man on the west face of the square faced in');
  }
});

test('the surrender is drawn with hands raised and a white flag at a corner; Palm Sunday\'s named woman is drawn in her own figure and named, and its guard counts nobody', () => {
  const surrender = projected(COLETO, 'surrender', 30);
  assert.equal(surrender.flag.kind, 'white');
  const art = fakeArt();
  run(createBattleView(art), () => surrender, { seconds: 2 });
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-surrender'), 'nobody in the square put up his hands');
  const eve = projected(GOLIAD_MASSACRE, 'eve', 20);
  const guard = eve.sides.find(side => side.side === 'mexican');
  assert.equal(guard.count, null, 'the guard was given a number the record does not');
  assert.ok(guard.parts.some(part => part.name === 'Francita Alavez' && part.figure === 'rust-woman'));
  const drawnEve = fakeArt(), ctx = fakeContext();
  run(createBattleView(drawnEve), minute => projected(GOLIAD_MASSACRE, 'eve', 20 + minute), { seconds: 3, named: true, ctx });
  assert.ok(drawnEve.drawn.some(one => /^rust-woman-(walk|idle)/.test(one.clip || '')), 'she was drawn as a soldier');
  assert.ok(ctx.calls.some(call => call[0] === 'fillText' && call[1] === 'Francita Alavez'), 'she was not named');
  assert.ok(!ctx.calls.some(call => call[0] === 'fillText' && /The guard · about/.test(call[1])), 'the guard was labelled with a count');
  // The volleys: the guards fire, the prisoners fall and lie still, and nothing is said.
  const volleys = projected(GOLIAD_MASSACRE, 'volleys', 10);
  assert.deepEqual(volleys.lines.filter(line => line.phase === 'volleys'), []);
  const killing = fakeArt();
  const evidence = run(createBattleView(killing), minute => projected(GOLIAD_MASSACRE, 'volleys', Math.min(19, minute)), { seconds: 12 });
  assert.ok(evidence.fallen >= 40, `the prisoners did not fall: ${evidence.fallen}`);
  assert.ok(evidence.shotsBy.mexican > 0 && !evidence.shotsBy.texian, 'the wrong side fired');
  assert.ok(!evidence.bubbles.some(bubble => /Preparen|Apunten|Fuego/.test(bubble.text)), 'an order was given at the killing');
  assert.ok(!killing.drawn.some(one => /blood|gore|corpse/.test(one.sprite || one.clip || '')));
});

test('the card: Follow on a march or a muster, Watch in a fight, through the family\'s own man', () => {
  const world = { role: 'student', householdId: 'hh-1', entities: [{ id: 'p', householdId: 'hh-1', name: 'Enos', health: { condition: 'well' } }] };
  const follow = militaryNotices({ ...world, battleAlert: { id: 'battle:coleto:march:hh-1', entityId: 'p', title: 'Fannin marches out', text: 'At Enos\'s side', field: { x: 0, y: 0 }, action: 'Follow' } });
  assert.equal(follow[0].action, 'Follow'); assert.equal(follow[0].kind, 'battle');
  const watch = militaryNotices({ ...world, battleAlert: { id: 'battle:coleto:caught:hh-1', entityId: 'p', title: 'Caught on the prairie', text: 'At Enos\'s side', field: { x: 0, y: 0 } } });
  assert.equal(watch[0].action, 'Watch');
});
