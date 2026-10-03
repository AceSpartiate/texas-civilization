// The famous people drawn by the one renderer (public/battle-view.js, public/speech.js) from the engine's own projection, on a
// canvas that records what is drawn: each named under their figure, their words out of their own figure headed with their name,
// Crockett's "one account" tag, Emily West's stage direction, the Twin Sisters' name (docs/BATTLES.md §2c, §14).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleView } from '../public/battle-view.js';
import { isClaude } from './support/claude-names.mjs';
import { phaseOffset, projectBattle } from '../sim/battle-stage.mjs';
import { ENGAGEMENTS } from '../sim/battle-stage.mjs';

function fakeContext() {
  const calls = [];
  const noop = name => (...args) => { calls.push([name, ...args]); };
  return new Proxy({ calls, globalAlpha: 1, fillStyle: '', measureText: text => ({ width: String(text).length * 6 }), createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }) }, {
    get(target, key) { return key in target ? target[key] : noop(key); },
    set(target, key, value) { target[key] = value; return true; },
  });
}
// Claude's temporary frames answer "not loaded" unless `claude` (tests/support/claude-names.mjs): the library stand-ins are held.
const fakeArt = ({ claude = false } = {}) => ({ animated: (ctx, clip, x, y, size) => !claude && isClaude(clip) ? 0 : size, drawSprite: (ctx, sprite, x, y, size) => !claude && isClaude(sprite) ? 0 : size, miniPerson: () => {} });
const SITES = { bexar: { x: 0, y: 0 }, lynchburg: { x: 0, y: 0 } };
const world = (id, minute) => ({ minute, map: { sites: SITES }, battles: { [id]: { id, start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } });
/** A camera centred on a point of the engagement's ground, at `scale` pixels a mile. */
function cameraOn(id, point, scale) {
  const centre = ENGAGEMENTS[id].ground(world(id, 0))[point];
  return { toScreen: p => ({ x: 683 + (p.x - centre.x) * scale, y: 420 + (p.y - centre.y) * scale }), figure: 40, scale };
}
/** Frames at 60 a second for `seconds`, the clock at `from` and moving `perTick` minutes a second. */
function run(id, phase, into, camera, { seconds = 6, perTick = 1, claude = false } = {}) {
  const view = createBattleView(fakeArt({ claude }));
  let last = null; const texts = new Set();
  for (let t = 0; t < seconds * 1000; t += 1000 / 60) {
    const ctx = fakeContext();
    const minute = phaseOffset(ENGAGEMENTS[id], phase) + into + Math.floor(t / 1000) * perTick;
    last = view.draw(ctx, projectBattle(world(id, minute), id), { camera, time: t, now: t, tickMs: 1000, bounds: { width: 1366, height: 768 } });
    for (const call of ctx.calls) if (call[0] === 'fillText') texts.add(call[1]);
  }
  return { last, texts, bubbles: last.bubbles };
}

test('at the Alamo each famous person is named under their figure, Travis\'s words come out of him under his name, and Crockett taken carries the "one account" tag', () => {
  const alarm = run('alamo', 'alarm', 1, cameraOn('alamo', 'plaza', 2600), { seconds: 4 });
  for (const name of ['Travis', 'Joe', 'Crockett', 'Bowie']) {
    assert.ok(alarm.texts.has(name), `${name} was not written on the field`);
    assert.ok(alarm.last.people.find(one => one.name === name)?.labelled, `${name} was not labelled`);
  }
  const travis = alarm.bubbles.find(one => one.id === 'al-travis') || [...alarm.last.linesShown].includes('al-travis');
  assert.ok(travis, 'Travis\'s words were not drawn');
  assert.ok(alarm.texts.has('Travis:'), 'the bubble does not say who is speaking');
  const end = run('alamo', 'end', 14, cameraOn('alamo', 'before-church', 2600), { seconds: 2 });
  const crockett = end.last.people.find(one => one.id === 'crockett');
  assert.equal(crockett.tag, 'One account (de la Peña) · disputed', 'Crockett\'s tag was not drawn');
  assert.ok(end.texts.has('One account (de la Peña) · disputed'));
  // The Esparza family named in the church (owner, 2026-09-26: "yes, add enrique and his family"), and Gregorio's brother at
  // the burial.
  const church = run('alamo', 'alarm', 0, cameraOn('alamo', 'sacristy', 5200), { seconds: 3 });
  for (const name of ['Ana Esparza', 'María de Jesús', 'Enrique', 'Manuel', 'Francisco', 'Esparza', 'Mrs. Dickinson']) {
    assert.ok(church.texts.has(name), `${name} was not written in the church`);
    assert.ok(church.last.people.find(one => one.name === name)?.labelled, `${name} was not labelled`);
  }
  assert.ok(run('alamo', 'burial', 0, cameraOn('alamo', 'church-front', 1600), { seconds: 1 }).texts.has('Francisco Esparza'), 'Francisco Esparza was not named at the burial');
});

test('at the Alamo the Esparza family is drawn as a woman and children, Ana\'s words come out of her under her name, and Gregorio\'s body is carried as a wrapped bundle, never as a body', () => {
  const alarm = run('alamo', 'alarm', 0, cameraOn('alamo', 'sacristy', 5200), { seconds: 3 });
  // The family drawn as the library's woman and children (stand-ins), the children smaller.
  const drawn = id => alarm.last.people.find(one => one.id === id)?.drawnAs;
  assert.equal(drawn('ana-esparza'), 'indigo-rest'); assert.equal(drawn('enrique-esparza'), 'boy-rest'); assert.equal(drawn('manuel-esparza'), 'smallchild-rest');
  assert.ok(alarm.texts.has('Ana Esparza:'), 'Ana\'s bubble does not say who is speaking');
  const carried = run('alamo', 'burial', 0, cameraOn('alamo', 'church-front', 1600), { seconds: 2 });
  const francisco = carried.last.people.find(one => one.id === 'francisco-esparza');
  assert.equal(francisco?.bears, 'esparza'); assert.match(francisco.drawnAs || '', /\+shroud$/, 'the body is not drawn as a wrapped bundle between two bearers');
  assert.ok(!carried.last.people.some(one => one.id === 'esparza'), 'Gregorio is drawn as a body as well as carried');
});

test('at San Jacinto the Twin Sisters are named under the gun, Emily West\'s words carry their stage direction, and the Napoleon of the West comes out of Santa Anna', () => {
  const guns = run('san-jacinto', 'guns', 0, cameraOn('san-jacinto', 'twinSister1', 900), { seconds: 3 });
  assert.ok(guns.texts.has('Twin Sisters'), 'the Twin Sisters were not named');
  assert.ok(guns.last.guns.some(gun => gun.name === 'Twin Sisters'));
  const parade = run('san-jacinto', 'parade', 5, cameraOn('san-jacinto', 'picnicTent', 600), { seconds: 6 });
  const emily = [...(parade.bubbles || [])].find(one => one.person === 'emily-west');
  assert.ok(emily, 'Emily West\'s words were not drawn over her');
  assert.equal(emily.manner, 'with a forced smile', 'her stage direction was not drawn');
  assert.ok(parade.texts.has('Emily West:'), 'her bubble does not say who is speaking');
  assert.ok([...parade.texts].some(text => /^⁣?\(with a forced smile\)/.test(text)), 'the stage direction was not written ahead of her words');
  const taken = run('san-jacinto', 'taken', 30, cameraOn('san-jacinto', 'texianCamp', 900), { seconds: 5, perTick: 2 });
  const napoleon = taken.bubbles.find(one => one.id === 'sj-napoleon');
  assert.ok(napoleon && napoleon.name === 'Santa Anna' && napoleon.named, 'the Napoleon of the West did not come out of Santa Anna');
  assert.equal(napoleon.kind, 'tradition');
});

test('with Claude\'s temporary sheets loaded, the Esparza family, the burial party and the roster\'s remaining people are drawn from their own frames, not the library\'s', () => {
  const alarm = run('alamo', 'alarm', 0, cameraOn('alamo', 'sacristy', 5200), { seconds: 3, claude: true });
  const drawn = id => alarm.last.people.find(one => one.id === id)?.drawnAs;
  assert.equal(drawn('ana-esparza'), 'ana-esparza-seated'); assert.equal(drawn('enrique-esparza'), 'enrique-esparza-seated-huddled');
  assert.equal(drawn('maria-de-jesus'), 'maria-de-jesus-seated-huddled');
  const carried = run('alamo', 'burial', 0, cameraOn('alamo', 'church-front', 1600), { seconds: 2, claude: true });
  assert.equal(carried.last.people.find(one => one.id === 'francisco-esparza')?.drawnAs, 'burial-party-walk-e', 'the burial party is not its own frames');
  const barragan = run('alamo', 'end', 12, cameraOn('alamo', 'joe-door', 2600), { seconds: 1, claude: true });
  // Astra's own Barragán since 2026-10-03 (his intervention at Joe's door), where Claude's command pose stood in.
  assert.match(barragan.last.people.find(one => one.id === 'barragan')?.drawnAs || '', /^barragan-(intervene|command)$/);
});
