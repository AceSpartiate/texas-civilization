// What the renderer (public/battle-view.js) and the engine's projection (sim/battle-stage.mjs) gained for Coleto and Palm Sunday
// on 2026-09-25, on the storming of Béxar's own groups, guns, flags and staged fates: the hollow square, the light of the hour,
// the surrender, a man who lies where he fell, a family's man drawn down, a named woman, and the Follow card. On a canvas that
// records what is drawn, as tests/battle-view.test.mjs does; scripts/battle-coleto-browser-proof.mjs holds the same on a page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, hollowness, layoutSide, regularity } from '../public/battle-view.js';
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
const bounds = { width: 1366, height: 768 };
/** A camera over a fight's ground: the Texians' middle in the middle of a 1366x768 page, at `scale` pixels a mile. */
const cameraOn = (battle, scale = 1800) => { const c = battle.sides.find(side => side.side === 'texian'); return { toScreen: p => ({ x: 683 + (p.x - c.x) * scale, y: 384 + (p.y - c.y) * scale }), figure: 30, scale }; };
function run(view, make, { seconds, from = 0, tickMs = 1000, named = false, ctx = null, camera = null }) {
  let last = null;
  const cam = camera || cameraOn(make(0));
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(ctx || fakeContext(), make(Math.floor(t / tickMs)), { camera: cam, time: t, now: t, tickMs, bounds, named });
  return last;
}
/** A class's world as far as the two engagements ask of it: the colonies map's places, and a clock. */
function worldAt(minute) {
  const places = coloniesMap().places;
  return { minute, map: { sites: places }, battles: {} };
}
/** The engagement's own projection at a phase, `into` minutes in: what a watching page is sent. */
function projected(def, phaseId, into = 0, { members = [], fates = null, units = null } = {}) {
  const start = 100000;
  const phase = schedule(def, start).find(one => one.id === phaseId);
  const world = worldAt(phase.from + into);
  armBattle(world, def.id, start);
  if (fates) world.battles[def.id].fates = structuredClone(fates);
  return projectBattle(world, def.id, { members, ...(fates && { fates: world.battles[def.id].fates }), ...(units && { units }) });
}
const bodies = (battle, side) => [...battle.sides.filter(one => one.side === side), ...(battle.groups || []).filter(one => one.side === side)];

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
  // Hollow: nobody stands in its middle, where the carts are.
  assert.ok(hollowness(square.map(slot => ({ x: slot.across, y: slot.along }))) > 0.6, 'the square is not hollow');
  const night = projected(COLETO, 'night');
  const marksmen = bodies(night, 'mexican').filter(body => body.style === 'loose');
  assert.ok(marksmen.length >= 3, 'the marksmen are not loose in the grass at night');
  const points = slots => slots.map(slot => ({ x: slot.across, y: slot.along }));
  const loose = layoutSide(marksmen[0]);
  assert.ok(regularity(points(loose)) > 2 * regularity(points(square.filter(slot => slot.face === 0 && slot.rank === 0))), 'the loose marksmen stand as evenly as the square');
  assert.ok(hollowness(points(loose)) < 0.4, 'the marksmen stand in a ring of their own');
});

test('the Mexicans come on from four sides, drawn apart from their side; the officer\'s words over the men firing, and the square has its own', () => {
  const assault = projected(COLETO, 'assault-1', 18);
  assert.deepEqual(assault.groups.map(group => group.id), ['left', 'right', 'rear']);
  assert.ok(assault.groups.every(group => group.side === 'mexican'));
  // Each stands on its own side of the square, and closer at the height of the assault than when it formed.
  const texian = assault.sides.find(side => side.side === 'texian');
  const early = projected(COLETO, 'assault-1', 0);
  for (const body of bodies(assault, 'mexican')) {
    const then = bodies(early, 'mexican').find(one => (one.id || one.side) === (body.id || body.side));
    assert.ok(Math.hypot(body.x - texian.x, body.y - texian.y) < Math.hypot(then.x - texian.x, then.y - texian.y), `${body.id || body.side} did not come on`);
  }
  const art = fakeArt(), view = createBattleView(art);
  const evidence = run(view, () => assault, { seconds: 24 });
  assert.deepEqual(Object.keys(evidence.groups).sort(), ['left', 'rear', 'right']);
  assert.ok(evidence.figures.texian >= 55 && evidence.figures.mexican >= 15, JSON.stringify(evidence.figures));
  assert.ok(evidence.shotsBy.texian > 5 && evidence.shotsBy.mexican > 5, `both sides did not fire: ${JSON.stringify(evidence.shotsBy)}`);
  const said = new Set();
  const again = createBattleView(fakeArt()), camera = cameraOn(assault);
  for (let t = 0; t < 24000; t += 1000 / 60) for (const bubble of again.draw(fakeContext(), assault, { camera, time: t, now: t, tickMs: 1000, bounds }).bubbles) said.add(bubble.text);
  assert.ok(said.has('Front rank, make ready!') || said.has('Present!'), `the square's own words were not said: ${[...said]}`);
  assert.ok(said.has('¡Apunten!') || said.has('¡Preparen las armas!'), `the Mexican officer said nothing: ${[...said]}`);
});

test('the guns at the corners and the battery fire, each shot once, served by men of their own side; the night darkens the field under the flashes', () => {
  const guns = projected(COLETO, 'guns', 12);
  assert.ok(guns.guns.some(gun => gun.side === 'mexican') && guns.guns.some(gun => gun.side === 'texian'), 'the battery and the corner guns are not both on the field');
  assert.ok(guns.guns.find(gun => gun.id === 'battery-1').shots.length >= 2);
  // Not before they came up: at the first assault there is no Mexican battery.
  assert.ok(!projected(COLETO, 'assault-1', 10).guns.some(gun => gun.side === 'mexican'), 'the Mexican battery was there before it came up in the night');
  const art = fakeArt(), view = createBattleView(art);
  const make = minute => ({ ...guns, minute: guns.minute + minute, guns: guns.guns.map(gun => ({ ...gun, shots: minute >= 2 ? [...gun.shots, guns.minute + 2] : gun.shots })) });
  const evidence = run(view, make, { seconds: 6, camera: cameraOn(guns, 900) });
  assert.ok(evidence.gunShots >= 2, `the guns did not fire: ${evidence.gunShots}`);
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
  const art = fakeArt(), view = createBattleView(art), camera = cameraOn(projected(COLETO, 'assault-1', 0));
  let lying = null, company = null, moved = null;
  for (let t = 0; t < 50000; t += 1000 / 30) {
    const into = Math.floor(t / 1000);
    const battle = projected(COLETO, 'assault-1', into);
    view.draw(fakeContext(), battle, { camera, time: t, now: t, tickMs: 1000, bounds });
    const front = battle.sides.find(side => side.side === 'mexican');
    // The fall in the front at the twenty-first minute: note where he lay, and where his company was, and later.
    if (into === 30 && !lying) { art.drawn.length = 0; view.draw(fakeContext(), battle, { camera, time: t, now: t, tickMs: 1000, bounds }); lying = art.drawn.filter(one => one.sprite === 'regular-reclining').map(one => `${Math.round(one.x)},${Math.round(one.y)}`); company = { x: front.x, y: front.y }; }
    if (into === 49) { art.drawn.length = 0; view.draw(fakeContext(), battle, { camera, time: t + 1, now: t + 1, tickMs: 1000, bounds }); moved = { at: art.drawn.filter(one => one.sprite === 'regular-reclining').map(one => `${Math.round(one.x)},${Math.round(one.y)}`), front: { x: front.x, y: front.y } }; break; }
  }
  assert.ok(lying.length >= 1, 'nobody of the front fell');
  assert.ok(Math.hypot(moved.front.x - company.x, moved.front.y - company.y) > 0.05, 'the front did not fall back');
  for (const spot of lying) assert.ok(moved.at.includes(spot), `a fallen man moved with his company: ${spot} not in ${moved.at}`);
  // A family's man, staged with the engine's fates (sim/battle-stage.mjs `stageFate`): nothing before his minute, down after it.
  const fell = schedule(COLETO, 100000).find(phase => phase.id === 'assault-1').from + 30;
  const fates = { 'hh-1-parent-1': { fate: 'killed', minute: fell, lies: true } };
  const before = projected(COLETO, 'assault-1', 20, { members: ['hh-1-parent-1'], fates });
  assert.equal(before.memberFates, undefined, 'his fall was sent before it happened');
  const after = projected(COLETO, 'assault-1', 31, { members: ['hh-1-parent-1'], fates });
  assert.deepEqual(after.memberFates, { 'hh-1-parent-1': { fate: 'killed', minute: fell } });
  const seen = createBattleView(fakeArt());
  seen.draw(fakeContext(), after, { camera, time: 0, now: 0, tickMs: 1000, bounds });
  assert.equal(seen.memberPose({ id: 'hh-1-parent-1' }, 5000).sprite, 'volunteer-reclining');
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

test('the surrender is drawn with hands raised and a white flag at a corner; Palm Sunday\'s named woman is drawn as a townswoman and named, and its guard counts nobody', () => {
  const surrender = projected(COLETO, 'surrender', 30);
  assert.equal(surrender.flags?.[0]?.kind, 'white');
  const art = fakeArt();
  run(createBattleView(art), () => surrender, { seconds: 2 });
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-surrender'), 'nobody in the square put up his hands');
  const eve = projected(GOLIAD_MASSACRE, 'eve', 20);
  const guard = eve.sides.find(side => side.side === 'mexican');
  assert.equal(guard.count, null, 'the guard was given a number the record does not');
  assert.ok(eve.groups.some(group => group.name === 'Francita Alavez' && group.civilians && group.named));
  const drawnEve = fakeArt(), ctx = fakeContext();
  run(createBattleView(drawnEve), minute => projected(GOLIAD_MASSACRE, 'eve', 20 + minute), { seconds: 3, named: true, ctx, camera: cameraOn(eve, 900) });
  assert.ok(drawnEve.drawn.some(one => /^rust-woman-(walk|idle)/.test(one.clip || '')), 'she was drawn as a soldier');
  assert.ok(ctx.calls.some(call => call[0] === 'fillText' && call[1] === 'Francita Alavez'), 'she was not named');
  assert.ok(!ctx.calls.some(call => call[0] === 'fillText' && /The guard · about/.test(call[1])), 'the guard was labelled with a count');
  // The volleys: the guards fire, the prisoners fall and lie still, and nothing is said.
  const volleys = projected(GOLIAD_MASSACRE, 'volleys', 10);
  assert.deepEqual(volleys.lines.filter(line => line.phase === 'volleys'), []);
  const killing = fakeArt();
  const said = new Set(), killer = createBattleView(killing), camera = cameraOn(volleys, 500);
  let evidence = null;
  for (let t = 0; t < 12000; t += 1000 / 60) {
    evidence = killer.draw(fakeContext(), projected(GOLIAD_MASSACRE, 'volleys', Math.min(19, Math.floor(t / 1000))), { camera, time: t, now: t, tickMs: 1000, bounds });
    for (const bubble of evidence.bubbles) said.add(bubble.text);
  }
  assert.ok(evidence.fallen >= 40, `the prisoners did not fall: ${evidence.fallen}`);
  assert.ok(evidence.shotsBy.mexican > 0 && !evidence.shotsBy.texian, 'the wrong side fired');
  assert.ok(![...said].some(text => /Preparen|Apunten|Fuego/.test(text)), `an order was given at the killing: ${[...said]}`);
  assert.ok(!killing.drawn.some(one => /blood|gore|corpse/.test(one.sprite || one.clip || '')));
});

test('the card: Follow on a march or a muster, Watch in a fight, through the family\'s own man', () => {
  const world = { role: 'student', householdId: 'hh-1', entities: [{ id: 'p', householdId: 'hh-1', name: 'Enos', health: { condition: 'well' } }] };
  const follow = militaryNotices({ ...world, battleAlert: { id: 'battle:coleto:march:hh-1', entityId: 'p', title: 'Fannin marches out', text: 'At Enos\'s side', field: { x: 0, y: 0 }, action: 'Follow' } });
  assert.equal(follow[0].action, 'Follow'); assert.equal(follow[0].kind, 'battle');
  const watch = militaryNotices({ ...world, battleAlert: { id: 'battle:coleto:caught:hh-1', entityId: 'p', title: 'Caught on the prairie', text: 'At Enos\'s side', field: { x: 0, y: 0 } } });
  assert.equal(watch[0].action, 'Watch');
});
