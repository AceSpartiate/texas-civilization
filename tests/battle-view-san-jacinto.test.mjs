// The renderer's pieces San Jacinto brought to the engine (public/battle-view.js; docs/BATTLES.md §8), on a canvas that
// records what is drawn: a camp at rest, a formed line firing on its own officers' English words, the rout with men giving
// themselves up where they stand, the dead lying where they fell while their side runs on, a group of horse drawn apart from
// its side as riders, and the breastwork and the marsh. (Guns on their ground and a family's man falling at his minute are the
// engine's own since the storming of Béxar, and tested there: tests/battle-bexar-view.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView, layoutSide, regularity } from '../public/battle-view.js';
import { isClaude, drawsClaude } from './support/claude-names.mjs';

function fakeContext() {
  const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; },
  });
  return ctx;
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
const camera = { toScreen: p => ({ x: 683 + p.x * 1800, y: 384 + p.y * 1800 }), figure: 30, scale: 1800 };
const side = (name, style, fire, x, extra = {}) => ({ side: name, name, count: 100, drawn: 60, style, fire, action: 'stand', moving: false, x, y: 0, facing: { x: name === 'texian' ? 1 : -1, y: 0 }, ...extra });
const battle = (minute, over = {}) => ({
  id: 'san-jacinto', phase: 'x', minute, caption: 'x', live: true, over: false, lines: [], fallen: [], members: [], formations: [],
  sides: [side('texian', 'ranks', 'none', -0.3), side('mexican', 'camp', 'none', 0.3, { pose: 'rest' })], ...over,
});
function run(view, make, { seconds, from = 0, tickMs = 1000, art = null } = {}) {
  let last = null;
  for (let t = from; t < from + seconds * 1000; t += 1000 / 60) last = view.draw(fakeContext(), make(Math.floor(t / tickMs), t), { camera, time: t, now: t, tickMs, wind: { x: 0.3, y: 0 }, bounds: { width: 1366, height: 768 } });
  return last;
}

test('Lamar rides in his own art and reaches down during the April 20 rescue beat', () => {
  const art = fakeArt(), view = createBattleView(art);
  const lamar = { id: 'lamar', art: 'lamar', name: 'Lamar', side: 'texian', x: 0, y: 0, right: true, pose: 'ride' };
  const scene = minute => battle(minute + 100000, { phase: 'skirmish', phaseMinute: minute, people: [lamar] });
  run(view, scene, { seconds: 1, from: 20000 });
  assert.ok(art.drawn.some(one => one.clip === 'lamar-mounted-walk-e'));
  art.drawn.length = 0;
  run(view, scene, { seconds: 1, from: 45000 });
  assert.ok(art.drawn.some(one => one.sprite === 'lamar-mounted-rescue-e'));
  art.drawn.length = 0;
  run(view, scene, { seconds: 1, from: 51000 });
  assert.ok(art.drawn.some(one => one.clip === 'lamar-mounted-walk-e'));
});

test('Sherman rides in his own art and signals the April 20 sortie', () => {
  const art = fakeArt(), view = createBattleView(art);
  const sherman = { id: 'sherman', art: 'sherman', name: 'Sherman', side: 'texian', x: 0, y: 0, right: true, pose: 'ride' };
  const scene = minute => battle(minute + 100000, { phase: 'skirmish', phaseMinute: minute, people: [sherman] });
  run(view, scene, { seconds: 1, from: 20000 });
  assert.ok(art.drawn.some(one => one.clip === 'sherman-mounted-walk-e'));
  art.drawn.length = 0;
  run(view, scene, { seconds: 1, from: 23000 });
  assert.ok(art.drawn.some(one => one.sprite === 'sherman-mounted-rally-e'));
  art.drawn.length = 0;
  run(view, scene, { seconds: 1, from: 26000 });
  assert.ok(art.drawn.some(one => one.clip === 'sherman-mounted-walk-e'));
});

test('Rusk rides in his own art and uses his open-hand stop gesture on the bank', () => {
  const art = fakeArt(), view = createBattleView(art);
  const rusk = { id: 'rusk', art: 'rusk', name: 'Rusk', side: 'texian', x: 0, y: 0, right: true };
  run(view, minute => battle(minute, { phase: 'skirmish', people: [{ ...rusk, pose: 'ride' }] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'rusk-mounted-walk-e'));
  art.drawn.length = 0;
  run(view, minute => battle(minute, { phase: 'killing', people: [{ ...rusk, pose: 'stop' }] }), { seconds: 1, from: 1000 });
  assert.ok(art.drawn.some(one => one.clip === 'rusk-stop'));
});

test('Hockley commands the Twin Sisters with his own battery poses', () => {
  const art = fakeArt(), view = createBattleView(art);
  const hockley = { id: 'hockley', art: 'hockley', name: 'Hockley', side: 'texian', x: 0, y: 0, right: true, pose: 'gun' };
  run(view, minute => battle(minute, { phase: 'guns', people: [hockley] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'hockley-battery-command'));
});

test('McCulloch serves a Twin Sister in his own gun crew poses', () => {
  const art = fakeArt(), view = createBattleView(art);
  const mcculloch = { id: 'mcculloch', art: 'mcculloch', name: 'McCulloch', side: 'texian', x: 0, y: 0, right: true, pose: 'gun' };
  run(view, minute => battle(minute, { phase: 'guns', people: [mcculloch] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'mcculloch-gun-service'));
});

test('only the named Twin Sisters use their dedicated service crew', () => {
  const art = fakeArt(), view = createBattleView(art);
  const guns = [
    { id: 'twin-sister-1', side: 'texian', x: -0.05, y: 0, facing: { x: 1, y: 0 }, crew: 3, shots: [] },
    { id: 'mexican-gun', side: 'mexican', x: 0.05, y: 0, facing: { x: -1, y: 0 }, crew: 3, shots: [] },
  ];
  run(view, minute => battle(minute, { guns }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'twin-crew-gun-ram'));
  assert.ok(art.drawn.some(one => one.clip === 'twin-crew-gun-shot-carry'));
  assert.ok(art.drawn.some(one => one.clip === 'twin-crew-gun-ready'));
  assert.ok(art.drawn.some(one => one.clip === 'regular-gun-ram'));
  assert.ok(!art.drawn.some(one => one.clip === 'volunteer-gun-ram'), 'a generic crew still serves a Twin Sister');
});

test('Castrillón keeps his own command, walk, fall and still art at San Jacinto', () => {
  const art = fakeArt(), view = createBattleView(art);
  const person = { id: 'castrillon', art: 'castrillon', name: 'Castrillón', side: 'mexican', x: 0, y: 0, right: true, pose: 'command' };
  run(view, minute => battle(minute, { people: [person] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.sprite === 'castrillon-command'));
  art.drawn.length = 0;
  run(view, minute => battle(minute, { people: [{ ...person, moving: true }] }), { seconds: 1, from: 1000 });
  assert.ok(art.drawn.some(one => one.clip === 'castrillon-walk-e'));
  art.drawn.length = 0;
  run(view, minute => battle(minute, { people: [{ ...person, fell: 2 }] }), { seconds: 2, from: 2000 });
  assert.ok(art.drawn.some(one => one.clip === 'castrillon-fall'));
  assert.ok(art.drawn.some(one => one.sprite === 'castrillon-still'));
  assert.ok(!art.drawn.some(one => one.sprite === 'regular-reclining'));
});

test('Almonte uses his own surrender and interpreter poses', () => {
  const art = fakeArt(), view = createBattleView(art);
  const person = { id: 'almonte', art: 'almonte', name: 'Almonte', side: 'mexican', x: 0, y: 0, right: true };
  run(view, minute => battle(minute, { people: [{ ...person, pose: 'surrender' }] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.sprite === 'almonte-surrender'));
  art.drawn.length = 0;
  run(view, minute => battle(minute, { people: [{ ...person, pose: 'interpret' }] }), { seconds: 1, from: 1000 });
  assert.ok(art.drawn.some(one => one.sprite === 'almonte-interpret'));
  assert.ok(!art.drawn.some(one => one.clip === 'regular-surrender'));
});

test('Burleson commands in his own officer art', () => {
  const art = fakeArt(), view = createBattleView(art);
  const person = { id: 'burleson', art: 'burleson', name: 'Burleson', side: 'texian', x: 0, y: 0, right: true, pose: 'command' };
  run(view, minute => battle(minute, { people: [person] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'burleson-command-cycle'));
});

test('Deaf Smith rides on his own scout sheet', () => {
  const art = fakeArt(), view = createBattleView(art);
  const person = { id: 'deaf-smith', art: 'deaf-smith', name: 'Deaf Smith', side: 'texian', x: 0, y: 0, right: true, pose: 'ride' };
  run(view, minute => battle(minute, { people: [person] }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.clip === 'deaf-smith-mounted-walk-e'));
  assert.ok(!art.drawn.some(one => one.clip === 'mounted-courier-e'));
});

test('the San Jacinto sword exchange uses both named figures', () => {
  const art = fakeArt(), view = createBattleView(art);
  const people = [
    { id: 'almonte', art: 'almonte', name: 'Almonte', side: 'mexican', x: -0.01, y: 0, right: true, pose: 'offer-sword' },
    { id: 'burleson', art: 'burleson', name: 'Burleson', side: 'texian', x: 0.01, y: 0, right: false, pose: 'receive-sword' },
  ];
  run(view, minute => battle(minute, { people }), { seconds: 1 });
  assert.ok(art.drawn.some(one => one.sprite === 'almonte-offer-sword'));
  assert.ok(art.drawn.some(one => one.sprite === 'burleson-receive-sword'));
});

test('a camp at rest (pose `rest`) is scattered and unformed, some standing and some sitting, and fires nothing; the formed line against it stands in even ranks', () => {
  const art = fakeArt(), view = createBattleView(art);
  const shown = run(view, minute => battle(minute), { seconds: 3 });
  assert.equal(shown.shotsTotal, 0, 'a camp at rest fired');
  assert.ok(shown.regularity.mexican > 0.2, `the camp stands too evenly: ${shown.regularity.mexican}`);
  assert.ok(shown.regularity.texian < 0.08, `the formed line is not even: ${shown.regularity.texian}`);
  const camp = layoutSide(side('mexican', 'camp', 'none', 0));
  const sitting = camp.filter(slot => slot.rest === 'sit').length;
  assert.ok(sitting > 8 && sitting < 40, `${sitting} of 60 sitting`);
  assert.ok(art.drawn.some(one => one.clip === 'regular-rest-sit') && art.drawn.some(one => /^regular-idle-/.test(one.clip || '')), 'the camp is not drawn at rest');
  assert.equal(shown.styles.mexican, 'camp');
});

test('the Texian line fires its volley on its own officers\' words in English; the Mexican ranks on theirs in Spanish', () => {
  const commands = { volley: [{ text: '¡Preparen las armas!', gloss: 'Make ready!' }, { text: '¡Apunten!', gloss: 'Take aim!' }, { text: '¡Fuego!', gloss: 'Fire!' }], bySide: { texian: { volley: [{ text: 'Make ready!' }, { text: 'Aim low!' }, { text: 'Fire!' }] } } };
  const all = [];
  const v2 = createBattleView(fakeArt());
  for (let t = 0; t < 24000; t += 1000 / 30) { const e = v2.draw(fakeContext(), battle(Math.floor(t / 1000), { commands, sides: [side('texian', 'ranks', 'volley', -0.3), side('mexican', 'ranks', 'volley', 0.3)] }), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } }); for (const b of e.bubbles) all.push(b); }
  assert.ok(all.some(b => b.side === 'texian' && b.text === 'Aim low!'), 'the Texian officers gave no words');
  assert.ok(!all.some(b => b.side === 'texian' && /¡/.test(b.text)), 'the Texian officers spoke Spanish');
  assert.ok(all.some(b => b.side === 'mexican' && b.text === '¡Apunten!'));
  assert.ok(v2.evidence.shotsBy.texian > 0 && v2.evidence.shotsBy.mexican > 0);
});

test('in the rout a share of the broken side gives itself up where it stands, and the dead lie where they fell while the side runs on past them', () => {
  const view = createBattleView(fakeArt());
  const make = (minute, t) => battle(minute, {
    sides: [side('texian', 'rout', 'scattered', -0.3 + t / 40000, { action: 'advance', moving: true }), side('mexican', 'rout', 'none', 0.1 + t / 20000, { action: 'withdraw', moving: true, surrendering: 0.25, facing: { x: 1, y: 0 } })],
    fallen: [{ side: 'mexican', count: 6, minute: 2, claimId: 'X' }],
  });
  run(view, make, { seconds: 4 });
  const first = view.evidence;
  assert.ok(first.surrendering >= 8 && first.surrendering <= 25, `${first.surrendering} with their hands up`);
  assert.equal(first.fallenBy.mexican, 6);
  // Where the fallen are drawn now, and a few seconds later with the side gone on.
  const art = fakeArt(), view2 = createBattleView(art);
  run(view2, make, { seconds: 4 });
  const reclining = () => art.drawn.filter(one => one.sprite === 'regular-reclining').slice(-6).map(one => Math.round(one.x));
  const before = reclining();
  art.drawn.length = 0;
  run(view2, make, { seconds: 3, from: 4000 });
  const after = reclining();
  assert.equal(before.length, 6);
  assert.deepEqual(after.sort(), before.sort(), 'the dead slid along with the side running past them');
  // A later fall never lands on a man already down: counts add up.
  const view3 = createBattleView(fakeArt());
  // Five falls of ten out of sixty: laid over each other by chance, some would land on men already down.
  run(view3, (minute, t) => ({ ...make(minute, t), fallen: [1, 2, 3, 4, 5].map(at => ({ side: 'mexican', count: 10, minute: at, claimId: 'X' })) }), { seconds: 7 });
  assert.equal(view3.evidence.fallenBy.mexican, 50, 'a later fall landed on a man already down');
});

test('a group of horse is drawn apart from its side, as riders, with its own fall; the breastwork, the fires and the marsh stand on the ground', () => {
  // Claude's marsh edge drawn; the horsemen and the breastwork are Astra's (2026-10-03).
  const art = fakeArt({ claude: true }), view = createBattleView(art);
  const works = [
    { id: 'breastwork', kind: 'breastwork', x: 0.2, y: 0, width: 0.3, across: { x: 0, y: 1 } },
    { id: 'fires', kind: 'fires', x: 0.3, y: 0, width: 0.2, across: { x: 0, y: 1 } },
    { id: 'marsh', kind: 'marsh', x: 0.1, y: 0.1, width: 0.3, across: { x: 0, y: 1 } },
  ];
  const groups = [{ id: 'sherman', side: 'texian', name: 'Sherman’s horsemen', drawn: 6, style: 'mounted', mounted: true, fire: 'scattered', action: 'advance', moving: false, x: 0, y: -0.1, facing: { x: 1, y: 0 } }];
  run(view, minute => battle(minute, { works, groups, fallen: [{ side: 'texian', unit: 'sherman', count: 1, minute: 1, wounded: true, claimId: 'X' }] }), { seconds: 12 });
  const e = view.evidence;
  assert.deepEqual(Object.keys(e.groups), ['sherman']);
  assert.equal(e.figures.texian, 60, 'the group was counted in the side');
  assert.equal(e.fallenBy['g:sherman'], 1);
  assert.equal(e.fallenBy.texian, undefined);
  // A Texian horseman is Astra's mounted volunteer (2026-10-03): standing mounted, and her firing transition at the shot.
  assert.ok(art.drawn.some(one => /^volunteer-mounted-idle-/.test(one.sprite || '')), 'the stationary Texian horsemen are not drawn mounted');
  assert.ok(art.drawn.some(one => one.clip === 'volunteer-mounted-fire-cycle'), 'the mounted firing pose is missing');
  assert.ok(e.shotsBy.texian > 0, 'the horsemen did not fire');
  assert.ok(e.works > 20, `only ${e.works} pieces of works drawn`);
  for (const piece of ['breastwork-packs-left', 'breastwork-packs-right']) assert.ok(art.drawn.some(one => one.sprite === piece), `no ${piece} in the breastwork`);
  assert.ok(art.drawn.some(one => one.clip === 'reeds-wind') && art.drawn.some(one => one.clip === 'fire-flicker'));
  // The marsh's edge under its reeds (Claude's `marsh-edge-*` tiles), all three kinds of tile, before the first reed.
  const firstEdge = art.drawn.findIndex(one => /^marsh-edge-\d$/.test(one.sprite || '')), firstReed = art.drawn.findIndex(one => one.clip === 'reeds-wind');
  assert.deepEqual([...new Set(art.drawn.filter(one => /^marsh-edge-\d$/.test(one.sprite || '')).map(one => one.sprite))].sort(), ['marsh-edge-1', 'marsh-edge-2', 'marsh-edge-3'], 'the marsh has no edge');
  assert.ok(firstEdge >= 0 && firstEdge < firstReed, 'the marsh edge is drawn under its reeds');
  // The opening in the middle of the breastwork where the gun stood (`HIST-TEX-522`).
  const pieces = art.drawn.filter(one => ['breastwork-packs-left', 'breastwork-packs-right'].includes(one.sprite)).map(one => one.y);
  assert.ok(!pieces.some(y => Math.abs(y - 384) < 0.015 * 1800), 'the breastwork has no opening for the gun');
});

// Astra's camp at rest, stacked arms and baggage breastwork (2026-10-03) replaced Claude's of the same subjects at the merge of
// 2026-10-04; the library's seated wounded and crates are drawn only while her sheets load.
test('the camp sits at rest in Astra\'s own pose with its arms stacked, and the breastwork is her packs and baggage with the gun\'s gap', () => {
  const art = fakeArt(), view = createBattleView(art);
  const works = [{ id: 'breastwork', kind: 'breastwork', x: 0.2, y: 0, width: 0.3, across: { x: 0, y: 1 } }, { id: 'fires', kind: 'fires', x: 0.3, y: 0, width: 0.2, across: { x: 0, y: 1 } }];
  run(view, minute => battle(minute, { works }), { seconds: 3 });
  assert.ok(art.drawn.some(one => one.clip === 'regular-rest-sit') && !art.drawn.some(one => one.clip === 'regular-injured-rest'), 'men at rest are drawn as the wounded');
  assert.ok(art.drawn.some(one => /^musket-stack-(small|large)$/.test(one.sprite || '')), 'no arms stacked by the fires');
  const segments = art.drawn.filter(one => /^breastwork-packs-(left|right)$/.test(one.sprite || ''));
  assert.ok(segments.length >= 8, `only ${segments.length} segments of the breastwork`);
  assert.ok(!art.drawn.some(one => ['crate', 'sacks', 'barrel'].includes(one.sprite)), 'the library\'s crates are drawn as well');
  assert.ok(!segments.some(one => Math.abs(one.y - 384) < 0.015 * 1800), 'the breastwork has no opening for the gun');
});
