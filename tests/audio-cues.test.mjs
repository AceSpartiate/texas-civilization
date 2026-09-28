// Which sound each event in the game makes (public/audio-cues.js, docs/AUDIO.md §4), and that every recipe of
// public/audio-synth.js builds without error. The page only ever sounds what it was sent: the bell is rung for a family
// whose own person heard it, not for one a rider told (FIC-GONZ-622).
//
// Each proven by injection on 2026-09-28 (docs/AUDIO.md §7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCueState, fireLevel, frameCues, moodFor, riverLevel, snapshotCues } from '../public/audio-cues.js';
import { SOUNDS, BEDS } from '../public/audio-mix.js';
import { RECIPES, makeBed, makeNoise } from '../public/audio-synth.js';
import { createMockAudio } from './support/mock-audio.mjs';

const base = (world = {}) => ({ world: { role: 'player', status: 'running', minute: 600, tick: 1, entities: [], ...world } });
/** A state that has already seen a first, empty snapshot, so the next one is heard. */
function started(world = {}) { const state = createCueState(1); snapshotCues(state, base(world)); return state; }
const ids = cues => cues.map(cue => cue.id);
const screen = { width: 1000, height: 700 };
const camera = (cx = 100, cy = 100, scale = 2000) => ({ cx, cy, scale, figure: 30, toScreen: p => ({ x: 500 + (p.x - cx) * scale, y: 350 + (p.y - cy) * scale }) });

test('a page opened in the middle of a class hears nothing of what was already there', () => {
  const state = createCueState(1);
  const cues = snapshotCues(state, base({ encounter: { id: 'e1', status: 'open' }, reports: [{ topicId: 'x', receivedMinute: 1, source: 'a rider' }], battle: { id: 'alamo', phase: 'arrival', sides: [{ side: 'mexican', x: 1, y: 1 }], lines: [{ id: 'a-bell' }] } }));
  assert.deepEqual(cues, []);
  // ...and hears the next thing that comes.
  assert.deepEqual(ids(snapshotCues(state, base({ encounter: { id: 'e2', status: 'open' } }))), ['question']);
});

test('the bell rings for a family whose own person heard it at Béxar, once; a family a rider told hears news', () => {
  const heard = started();
  assert.deepEqual(ids(snapshotCues(heard, base({ reports: [{ topicId: 'bexar-arrival', receivedMinute: 870, source: 'Ana Ruiz, at Béxar' }] }))), ['bell']);
  assert.deepEqual(ids(snapshotCues(heard, base({ battleAlert: { id: 'battle:alamo:siege:14', title: 'The bell at Béxar: the Mexican army is here' }, reports: [{ topicId: 'bexar-arrival', receivedMinute: 870, source: 'Ana Ruiz, at Béxar' }] }))), []);
  const told = started();
  assert.deepEqual(ids(snapshotCues(told, base({ reports: [{ topicId: 'bexar-arrival', receivedMinute: 2400, source: 'a rider from Gonzales' }] }))), ['news']);
  // Watching the Alamo's first minute rings it too (families there, and the Host).
  const watching = started();
  assert.deepEqual(ids(snapshotCues(watching, base({ battle: { id: 'alamo', phase: 'arrival', sides: [{ side: 'mexican', x: 1, y: 1 }], lines: [{ id: 'a-bell', role: 'sentry', text: 'The enemy are in view!' }] } }))), ['bell']);
});

test('a bugler\'s line is a bugle - the parley\'s own call for a parley - and a drum only where a line names one', () => {
  const state = started();
  const sides = [{ side: 'texian', x: 0, y: 0 }, { side: 'mexican', x: 5, y: 5 }];
  const cues = snapshotCues(state, base({ battle: { id: 'bexar', phase: 'flag', sides, lines: [{ id: 'b-bugle', role: 'bugler', text: '(a bugle sounds for a parley)' }] } }));
  assert.deepEqual(cues.map(cue => [cue.id, cue.opts?.call]), [['bugle', 'parley']]);
  assert.deepEqual(cues[0].point, { x: 5, y: 5 });
  const charge = snapshotCues(started(), base({ battle: { id: 'concepcion', phase: 'charge', sides, lines: [{ id: 'c-bugle-1', role: 'bugler', text: '[The bugle sounds the charge]' }, { id: 'c-shout', role: 'officer', text: 'Fire!' }] } }));
  assert.deepEqual(charge.map(cue => [cue.id, cue.opts?.call]), [['bugle', 'attack']]);
  // The Alamo's assault: the bugles are in the phase's caption, not a line.
  const assault = snapshotCues(started(), base({ battle: { id: 'alamo', phase: 'assault', caption: 'The silence breaks: shouts of “¡Viva Santa Anna!”, and the bugles sounding the attack.', sides, lines: [] } }));
  assert.deepEqual(ids(assault), ['bugle']);
  assert.deepEqual(ids(snapshotCues(started(), base({ battle: { id: 'x', phase: 'p', sides, lines: [{ id: 'd', role: 'drummer', side: 'mexican', text: '(the drums beat)' }] } }))), ['drum']);
});

test('questions, ¡Alto!, a question turning pressing, and a lapse said once', () => {
  const state = started();
  assert.deepEqual(ids(snapshotCues(state, base({ encounter: { id: 'rider-1', status: 'open' } }))), ['question']);
  assert.deepEqual(ids(snapshotCues(state, base({ encounter: { id: 'rider-1', status: 'open' } }))), []);
  assert.deepEqual(ids(snapshotCues(state, base({ flight: { status: 'fled', ask: { id: 'alto', openedMinute: 900 }, chase: { x: 3, y: 4 } } }))), ['alto']);
  assert.deepEqual(ids(snapshotCues(state, base({ flight: { status: 'fled', ask: { id: 'ford', openedMinute: 950 } } }))), ['question']);
  const fresh = started();
  assert.deepEqual(ids(snapshotCues(fresh, base({ request: { id: 'call-1', kind: 'call' } }))), ['question']);
  assert.deepEqual(ids(snapshotCues(fresh, base({ request: { id: 'call-1', kind: 'call', pressing: true } }))), ['lapse']);
  assert.deepEqual(ids(snapshotCues(fresh, base({ request: { id: 'call-1', kind: 'call', pressing: true } }))), []);
});

test('the family\'s own: a baby crying, a shot at the hunt, a tree going over', () => {
  const state = started();
  const baby = { id: 'p-baby', kind: 'person', baby: { state: 'cry' } };
  const cues = snapshotCues(state, base({ entities: [baby, { id: 'p-father', kind: 'person', chore: { id: 'hunt-land', doing: 'the shot' } }, { id: 'p-son', kind: 'person', chore: { id: 'fell-trees', doing: 'felling a post oak' } }] }));
  assert.deepEqual(cues.map(cue => [cue.id, cue.entity]), [['baby', 'p-baby'], ['musket', 'p-father']]);
  const next = snapshotCues(state, base({ tick: 2, entities: [{ ...baby, baby: { state: 'held' } }, { id: 'p-son', kind: 'person', chore: { id: 'fell-trees', doing: 'felling a live oak' } }] }));
  assert.deepEqual(next.map(cue => [cue.id, cue.entity]), [['tree-fall', 'p-son']]);
  // The Host is sent no babies: nothing cries on the projector.
  const host = started({ role: 'host' });
  assert.deepEqual(ids(snapshotCues(host, base({ role: 'host', others: [{ id: 'x', kind: 'person' }] }))), []);
});

test('a frame\'s shots are heard where they were drawn: a rank\'s volley, a gun, a chase\'s shot and its ¡Alto!', () => {
  const state = createCueState(2);
  const rank = Array.from({ length: 12 }, (_, i) => ({ x: 400 + i * 4, y: 350, size: 1 }));
  const { cues } = frameCues(state, { world: null, camera: camera(), size: screen, battle: { heard: [...rank, { x: 900, y: 350, size: 2.4 }] }, chase: { heard: [], spoken: [{ id: 'alto', x: 520, y: 340 }] }, ambient: false }, 0);
  assert.deepEqual(ids(cues).sort(), ['alto', 'cannon', 'volley']);
  assert.ok(cues.find(cue => cue.id === 'cannon').pan > 0.4, 'the gun on the right of the screen is heard on the right');
});

test('work and travel near the camera keep their rhythm: the axe, the hammer, hoofs and the wagon', () => {
  const state = createCueState(3);
  const world = { role: 'player', minute: 600, entities: [
    { id: 'a', kind: 'person', chore: { id: 'fell-trees', doing: 'felling a post oak' } },
    { id: 'b', kind: 'person', chore: { id: 'build-house', doing: 'raising the walls, course 3 of 10' } },
    { id: 'h', kind: 'animal', species: 'horse', travel: { mode: 'horse', speed: 4 } },
    { id: 'w', kind: 'wagon', travel: { mode: 'wagon' } },
    { id: 'far', kind: 'person', chore: { id: 'fell-trees', doing: 'felling a post oak' } },
  ] };
  const drawnAt = new Map([['a', { x: 480, y: 340 }], ['b', { x: 520, y: 360 }], ['h', { x: 500, y: 300 }], ['w', { x: 450, y: 380 }], ['far', { x: 9000, y: 9000 }]]);
  const heard = [];
  for (let now = 0; now <= 12000; now += 250) heard.push(...frameCues(state, { world, camera: camera(), size: screen, drawnAt, ambient: true }, now).cues);
  const count = id => heard.filter(cue => cue.id === id).length;
  assert.ok(count('axe') >= 7 && count('axe') <= 12, `axe ${count('axe')} in 12 s`);
  assert.ok(count('hammer') >= 9 && count('hammer') <= 16, `hammer ${count('hammer')} in 12 s`);
  assert.ok(count('hoof') >= 15, `hoof ${count('hoof')}`);
  assert.ok(count('wagon') >= 3 && count('wagon') <= 7, `wagon ${count('wagon')}`);
  // Nobody off the screen is heard at all.
  assert.equal(heard.filter(cue => cue.gain === 0).length, 0);
});

test('the weather at the middle of the view: rain and a storm\'s thunder, a norther\'s wind, and fair weather silent', () => {
  const weather = kinds => ({ day: 1, bounds: { westOf: 140, eastOf: 260 }, regions: Object.fromEntries(['west', 'centre', 'east'].map(name => [name, { kind: kinds, water: 0, since: 0, wet: false, wind: { from: 0, force: kinds === 'norther' ? 1 : kinds === 'storm' ? 0.7 : kinds === 'rain' ? 0.3 : 0.15 } }])) });
  const run = kind => {
    const state = createCueState(4), cues = [];
    let beds;
    for (let now = 0; now <= 40000; now += 250) { const out = frameCues(state, { world: { role: 'player', minute: 600, weather: weather(kind), entities: [] }, camera: camera(200), size: screen, ambient: true }, now); cues.push(...out.cues); beds = out.beds; }
    return { beds, thunder: cues.filter(cue => cue.id === 'thunder').length };
  };
  const storm = run('storm'), rain = run('rain'), norther = run('norther'), fair = run('fair');
  assert.ok(storm.beds.rain > 0.9 && storm.thunder >= 1 && storm.thunder <= 4, JSON.stringify(storm));
  assert.ok(rain.beds.rain > 0.9 && rain.thunder === 0, JSON.stringify(rain));
  assert.ok(norther.beds.wind > 0.8 && norther.beds.rain === 0, JSON.stringify(norther));
  assert.equal(fair.beds.rain, 0); assert.equal(fair.beds.wind, 0); assert.equal(fair.thunder, 0);
});

test('the river is heard near a crossing, and fire near a burning town or the family\'s camp', () => {
  const map = { sites: { f: { id: 'f', kind: 'ford', x: 100.01, y: 100 }, home: { id: 'home', kind: 'homestead', x: 100, y: 100.01 } } };
  assert.ok(riverLevel({ map }, camera(), screen) > 0.8);
  assert.equal(riverLevel({ map }, camera(150), screen), 0);
  assert.ok(fireLevel({ map, fires: [{ id: 't', kind: 'town', x: 100, y: 100 }] }, camera(), screen) > 0.9);
  assert.ok(fireLevel({ map, household: { homeSiteId: 'home' }, land: { shelter: 'camp' } }, camera(), screen) > 0.4);
  assert.equal(fireLevel({ map, household: { homeSiteId: 'home' }, land: { shelter: 'house' } }, camera(), screen), 0);
});

test('the music follows the game: title, farm, war, battle, the Scrape, the ending', () => {
  assert.equal(moodFor(null), 'title');
  assert.equal(moodFor({ status: 'lobby' }), 'title');
  assert.equal(moodFor({ status: 'running' }, { creating: true }), 'title');
  assert.equal(moodFor({ status: 'running' }), 'farm');
  assert.equal(moodFor({ status: 'running', request: { kind: 'call' } }), 'war');
  assert.equal(moodFor({ status: 'running', army: { id: 'a' } }), 'war');
  assert.equal(moodFor({ status: 'running', battle: { sides: [], over: false } }), 'battle');
  assert.equal(moodFor({ status: 'running', battle: { sides: [], over: true } }), 'farm');
  assert.equal(moodFor({ status: 'running', flight: { status: 'fled' } }), 'scrape');
  assert.equal(moodFor({ status: 'running', flight: { status: 'home' } }), 'farm');
  assert.equal(moodFor({ status: 'ended', ending: { family: {} } }), 'ending');
  assert.equal(moodFor({ role: 'host', status: 'running', historicalDate: '1835-09-20' }), 'farm');
  assert.equal(moodFor({ role: 'host', status: 'running', historicalDate: '1835-12-05' }), 'war');
  assert.equal(moodFor({ role: 'host', status: 'running', historicalDate: '1836-03-20' }), 'scrape');
});

test('every sound and bed builds from its recipe, starts its sources and says how long it lasts', () => {
  const audio = createMockAudio();
  const ctx = new audio.AudioContext();
  const noise = makeNoise(ctx), out = ctx.createGain();
  for (const id of Object.keys(SOUNDS)) {
    const before = audio.log.starts;
    const seconds = RECIPES[id](ctx, out, 0, { call: 'attack', pattern: 'roll', count: 12 }, noise);
    assert.ok(seconds > 0 && seconds < 12, `${id} lasts ${seconds}`);
    assert.ok(audio.log.starts > before, `${id} started nothing`);
  }
  for (const kind of Object.keys(BEDS)) {
    const bed = makeBed(ctx, kind, out, noise);
    bed.set(0.5); assert.equal(bed.level, 0.5); bed.stop();
  }
});
