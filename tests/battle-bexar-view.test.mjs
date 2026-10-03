// The storming of Béxar drawn (public/battle-view.js on the projection sim/battle-stage.mjs makes of sim/battles/
// bexar-storming.mjs), on a canvas that records what is asked of it. scripts/battle-bexar-browser-proof.mjs holds the same on
// a real page; these hold the rules underneath, frame by frame.
//
// Street fighting, not two lines (docs/battle-research/staging.md §3.3): most of each division is inside the stone houses and
// is seen as flashes and smoke at the walls; men on the roofs stand up on the houses; the guns fire the shots the server
// dated, once each; a door is worked at with a bar until it gives and then is a hole; the townspeople walk out unhurt and
// never fire; Milam falls where the record puts him and is named; a family's man falls at his own staged moment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';
import { isClaude, drawsClaude } from './support/claude-names.mjs';
import { armBattle, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { BEXAR_STORMING } from '../sim/battles/bexar-storming.mjs';
import { bexarClass, momentOf } from './support/bexar.mjs';

const ID = 'bexar-storming';
function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  return new Proxy({ calls, globalAlpha: 1, measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
}
/**
 * The page's art, recorded. By default it answers "not loaded" for Claude's temporary frames (tests/support/claude-names.mjs),
 * so these tests hold the library stand-ins drawn while a Claude sheet is on its way; `{ claude: true }` draws them too, and
 * `{ claude: name => ... }` draws those it says yes to.
 */
function fakeArt({ claude = false } = {}) {
  const drawn = [];
  return {
    drawn,
    animated: (ctx, clip, x, y, size, seed, options) => { if (isClaude(clip) && !drawsClaude(claude, clip)) return 0; drawn.push({ clip, x, y, ...options }); return size; },
    drawSprite: (ctx, sprite, x, y, size, options) => { if (isClaude(sprite) && !drawsClaude(claude, sprite)) return 0; drawn.push({ sprite, x, y, ...options }); return size; },
    miniPerson: () => {},
  };
}

let town = null;
/** A class at the storming, and the projection of any minute of it: the engine reads the clock, so the minute is set. */
function at(phaseId, into, options = {}) {
  town ??= (() => { const { world } = bexarClass('bexar-view', ['fighter', 'home']); armBattle(world, ID, momentOf(world, 'milam')); return world; })();
  const phase = schedule(BEXAR_STORMING, town.battles[ID].start).find(one => one.id === phaseId);
  town.minute = phase.from + into;
  return projectBattle(town, ID, options);
}
/** The camera on the town, about as Watch frames it at 1366x768. */
function cameraOn(battle) {
  const bexar = town.map.sites.bexar, cx = bexar.x + 0.1, cy = bexar.y - 0.07, scale = 1700;
  return { toScreen: p => ({ x: 683 + (p.x - cx) * scale, y: 384 + (p.y - cy) * scale }), figure: 32, scale };
}
/** Draw `seconds` of frames, a new tick each second, the minute of each tick from `minuteAt(tick)`. */
function play(view, phaseId, { seconds, from = 0, into = tick => tick, options = {}, art = null, ctxs = null }) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 30) {
    const battle = at(phaseId, into(Math.floor(t / 1000)), options);
    const ctx = fakeContext(); ctxs?.push(ctx);
    last = view.draw(ctx, battle, { camera: cameraOn(battle), time: t, now: t, tickMs: 1000, wind: { x: 0.2, y: 0 }, bounds: { width: 1366, height: 768 } });
  }
  return last;
}

test('in the houses most men are out of sight: the fire is flashes and smoke at the walls, the roofs are manned, and the guns fire their dated shots once each', () => {
  const art = fakeArt(), view = createBattleView(art);
  // The first day and night in the houses, two hours of it a tick.
  const shown = play(view, 'pinned-5', { seconds: 16, into: tick => 20 + tick * 120 });
  assert.ok(shown.loopholeShots >= 30, `only ${shown.loopholeShots} shots through the loopholes in sixteen seconds`);
  assert.ok(shown.smokeInView >= 10, `no smoke at the walls: ${shown.smokeInView}`);
  // Johnson's division: 24 men in the house, of whom only the few in the doorway or the yard are drawn.
  assert.ok(shown.groups.johnson > 0 && shown.groups.johnson <= 6, `Johnson's division drawn as ${shown.groups.johnson} figures standing in the street`);
  assert.ok(shown.groups.roofs >= 5, 'nobody on the roofs round the plaza');
  // The guns: each shot the server dated is fired once, as a flash and a bank of smoke, and never again.
  assert.ok(shown.gunShots >= 10, `the guns fired ${shown.gunShots} times`);
  const battle = at('pinned-5', 20 + 15 * 120);
  const dated = battle.guns.reduce((sum, gun) => sum + gun.shots.length, 0);
  assert.ok(shown.gunShots <= 16 * dated, 'a gun fired more than the server dated');
  assert.ok(art.drawn.some(one => one.clip === 'regular-gun-ram' || one.clip === 'regular-gun-fire'), 'the Mexican guns are served by nobody');
  assert.ok(art.drawn.some(one => one.sprite === 'palisade'), 'no palisade across the street');
  assert.ok(art.drawn.some(one => one.clip === 'rust-work' || one.clip === 'teal-work'), 'nobody digs the trench at night');
});

test('Neill serves his own gun during the Béxar feint', () => {
  const art = fakeArt(), view = createBattleView(art);
  play(view, 'feint', { seconds: 2, into: tick => 4 + tick });
  assert.ok(art.drawn.some(one => one.clip === 'neill-gun-service'), 'Neill was not drawn serving his own gun');
});

test('Johnson takes command in his own art at seven on the seventh', () => {
  const art = fakeArt(), view = createBattleView(art);
  play(view, 'night-7', { seconds: 2, into: tick => 179 + tick });
  assert.ok(art.drawn.some(one => one.sprite === 'johnson-idle' || one.clip === 'johnson-walk-e'), JSON.stringify([...new Set(art.drawn.map(one => one.sprite || one.clip).filter(name => /johnson/.test(name)))]));
  assert.ok(art.drawn.some(one => one.clip === 'johnson-command'));
});

test('Burleson rides into the Béxar talks on his own mounted sheet', () => {
  const art = fakeArt(), view = createBattleView(art);
  play(view, 'parley', { seconds: 2, into: tick => 55 + tick });
  // Riding his own horse by the way he goes since Astra's cardinal riding (2026-10-03): east, north or south.
  assert.ok(art.drawn.some(one => /^burleson-mounted-walk-[ens]$/.test(one.clip || '')), JSON.stringify([...new Set(art.drawn.map(one => one.clip).filter(Boolean))]));
  assert.ok(!art.drawn.some(one => one.clip === 'mounted-courier-e'));
});

test('Cos leaves Béxar on his own mounted sheet', () => {
  const art = fakeArt(), view = createBattleView(art);
  play(view, 'marching-out', { seconds: 2, into: tick => 20 + tick });
  assert.ok(art.drawn.some(one => one.clip === 'cos-mounted-walk-e'));
});

test('into the houses: the columns go down the streets, men on the Veramendi roof, and the officer\'s words before each volley at the barricade', () => {
  const view = createBattleView(fakeArt());
  const words = new Set();
  for (let t = 0; t < 20000; t += 50) {
    const battle = at('entry', 20 + Math.floor(t / 1000) * 2);
    const shown = view.draw(fakeContext(), battle, { camera: cameraOn(battle), time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    for (const bubble of shown.bubbles) words.add(bubble.text);
  }
  assert.ok(['¡Preparen!', '¡Apunten!', '¡Fuego!'].every(word => words.has(word)), `the volley's words were not given: ${[...words]}`);
  assert.ok([...words].some(word => /wall|door|roof|hole/i.test(word)), `no Texian talk in the streets: ${[...words]}`);
  assert.ok(view.evidence.unitsSeen.includes('roof-greys'), 'nobody went up on the Veramendi roof');
});

test('Karnes\'s door: a man at the bar until it gives, then the hole; the family inside walks out unhurt and never fires', () => {
  const art = fakeArt(), view = createBattleView(art);
  // Minute by minute through the door (the bar from minute 1, open at 5) and the family let out.
  const shown = play(view, 'karnes', { seconds: 30, into: tick => tick });
  assert.ok(art.drawn.some(one => one.clip === 'karnes-crowbar-work'), `Karnes did not work at the door with his crowbar: ${JSON.stringify([...new Set(art.drawn.map(one => one.clip || one.sprite).filter(name => /karnes|gun-ram/.test(name)))])}`);
  assert.ok(!art.drawn.some(one => one.clip === 'volunteer-gun-ram'), 'a generic worker was duplicated beside Karnes');
  assert.ok(art.drawn.some(one => one.sprite === 'karnes-idle'), 'Karnes did not return to an idle pose after the door gave');
  assert.ok(art.drawn.some(one => one.sprite === 'wall-breach'), 'the door never gave');
  assert.ok(shown.breachesOpened >= 1);
  assert.ok(shown.civiliansSeen >= 3, `the family inside was not seen: ${shown.civiliansSeen}`);
  // Béxar's own townspeople (Claude-drawn stand-ins), or the settlers' figures behind them while their sheet has not loaded.
  const folk = art.drawn.filter(one => /^(bexar-(woman|man|girl|boy)|rust-woman|smallchild|elder|indigo)-/.test(one.clip || one.sprite || ''));
  assert.ok(folk.length > 0 && folk.every(one => !/fire|injured|reclining/.test(one.clip || one.sprite)), 'a townsperson was drawn firing or hurt');
  assert.ok(view.evidence.unitsSeen.includes('york'), 'York\'s company never followed him in');
});

test('Milam falls in the Veramendi yard at half past three, named, and nobody gives him words', () => {
  const art = fakeArt(), view = createBattleView(art), ctxs = [];
  const shown = play(view, 'milam', { seconds: 6, into: tick => tick * 5, ctxs });
  assert.deepEqual(shown.namedFalls, ['Milam']);
  assert.ok(art.drawn.some(one => one.sprite === 'volunteer-reclining'), 'he was not drawn lying still');
  assert.ok(ctxs.some(ctx => ctx.calls.some(call => call[0] === 'fillText' && call[1] === 'Milam')), 'his name is not under him');
  assert.ok(!shown.bubbles.some(bubble => /Milam/.test(bubble.text)), 'words were put in the yard');
});

test('dawn on the 9th: the guns stop, the bugle is heard, and a white flag comes to the plaza', () => {
  const art = fakeArt(), view = createBattleView(art);
  const said = new Set();
  let shown = null;
  for (let t = 0; t < 12000; t += 50) {
    const battle = at('flag', Math.min(39, Math.floor(t / 1000) * 5));
    shown = view.draw(fakeContext(), battle, { camera: cameraOn(battle), time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    for (const bubble of shown.bubbles) said.add(bubble.text);
  }
  assert.ok(shown.whiteFlag, 'no white flag was drawn');
  assert.ok(art.drawn.some(one => one.sprite === 'white-flag-regular-idle-e' || one.clip === 'white-flag-regular-walk-e'), 'the Mexican flag bearer does not use his own art');
  assert.ok(art.drawn.some(one => one.clip === 'regular-bugler-call'), 'the documented bugle call has no visible bugler');
  assert.ok([...said].some(text => /bugle/.test(text)) && [...said].some(text => /white flag/i.test(text)), `the flag's words: ${[...said]}`);
  const after = at('flag', 30);
  assert.ok(after.guns.every(gun => gun.shots.every(shot => shot <= after.minute - 20)), 'a gun fired after the cannonade stopped');
});

test('a family\'s man stands in his unit and fires with it, and falls at the moment the server staged, not before', () => {
  const view = createBattleView(fakeArt());
  const id = 'hh-1-man', fallAt = 40;
  const options = minute => ({ members: [id], units: { [id]: 'johnson' }, fates: { [id]: { fate: 'killed', minute: at('entry', fallAt).minute, applied: true } } });
  const poses = [];
  for (let t = 0; t < 12000; t += 1000 / 30) {
    const tick = Math.floor(t / 1000), minute = 20 + tick * 3;
    const battle = at('entry', minute, options(minute));
    view.draw(fakeContext(), battle, { camera: cameraOn(battle), time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    const pose = view.memberPose({ id }, t);
    view.memberDrawn(id, { x: battle.groups.find(group => group.id === 'johnson').x, y: battle.groups.find(group => group.id === 'johnson').y }, 32);
    poses.push({ minute, pose: pose.clip || pose.sprite, unit: battle.memberUnits?.[id] });
  }
  assert.ok(poses.every(one => one.unit === 'johnson'));
  assert.ok(poses.some(one => one.minute < fallAt && one.pose === 'volunteer-fire-reload'), 'he never fired with his division');
  assert.ok(poses.filter(one => one.minute < fallAt - 3).every(one => one.pose !== 'volunteer-reclining'), 'he was drawn down before his moment');
  assert.ok(poses.filter(one => one.minute > fallAt + 9).every(one => one.pose === 'volunteer-reclining'), 'he was not drawn lying still after it');
});

test('with Claude\'s temporary sheets loaded: the barricade, the trench dug by a volunteer, the loophole\'s man and the crowbar are their own frames', () => {
  const art = fakeArt({ claude: true }), view = createBattleView(art);
  play(view, 'pinned-5', { seconds: 16, into: tick => 20 + tick * 120 });
  assert.ok(art.drawn.some(one => one.sprite === 'barricade-street') && !art.drawn.some(one => one.sprite === 'palisade'), 'the street barricade is still the palisade');
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-dig') && !art.drawn.some(one => one.clip === 'rust-work' || one.clip === 'teal-work'), 'the trench is dug by settlers at the hoe');
  assert.ok(art.drawn.some(one => /^(volunteer|regular)-loophole-fire/.test(one.clip || one.sprite || '')), 'nobody was drawn at a loophole');
  const door = fakeArt({ claude: true });
  play(createBattleView(door), 'karnes', { seconds: 30, into: tick => tick });
  // Karnes forces it himself since Astra drew him with his crowbar (2026-09-28): her `karnes-crowbar-work`, and neither the rammer
  // nor Claude's generic `volunteer-crowbar` beside him.
  assert.ok(door.drawn.some(one => one.clip === 'karnes-crowbar-work'), 'Karnes is not at the door with his own crowbar');
  assert.ok(!door.drawn.some(one => one.clip === 'volunteer-gun-ram' || one.clip === 'volunteer-crowbar'), 'the door is forced with the rammer or by a second man');
});
