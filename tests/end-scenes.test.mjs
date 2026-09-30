// The end of the game's two videos, as scripts (owner, 2026-09-29, the triage's D10; docs/FLASHBACK.md §11 and §12):
//
//   - each family's own video goes on past its story's minute to the homecoming: home and what is left, the first logs of a new
//     house where the farm was burned, the family remembering its dead, and the head of household counting at the table - and,
//     where the farm stands, selling it (D8), at the price the ending counts (sim/farm-sale.mjs);
//   - the class's own video (sim/class-flashback.mjs), two and a half minutes at most, from several families' points of view.
//
// Both hold to the flashback's words: no virtue, no gore, no glory and no final number, nobody who died of a sickness named.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { endedClass } from './support/ended-class.mjs';
import { EPILOGUE_MS, GORE_WORDS, VIRTUE_WORDS, flashbackScripts } from '../sim/flashback.mjs';
import { CLASS_MOST_BEATS, CLASS_MS, classFlashbackScript } from '../sim/class-flashback.mjs';
import { familyEnding } from '../sim/ending.mjs';
import { farmAtEnd } from '../sim/farm-sale.mjs';
import { homecomings } from '../sim/homecoming.mjs';

// CLASS_FIXTURE: the same class saved to a file, to try an injected regression in seconds.
const ENDED = process.env.CLASS_FIXTURE ? JSON.parse(readFileSync(process.env.CLASS_FIXTURE, 'utf8')) : endedClass('end-scenes', 6, { played: 4 });
const fresh = () => structuredClone(ENDED);
const SCRIPTS = flashbackScripts(fresh());
const hasWord = (text, word) => new RegExp(`\\b${word}\\b`, 'i').test(text);
const clean = (label, text) => {
  for (const word of [...VIRTUE_WORDS, ...GORE_WORDS]) assert.ok(!hasWord(text, word), `${label}: "${word}" in "${text}"`);
  assert.ok(!/\bglory\b|\bpoints?\b|final number/i.test(text), `${label}: glory in "${text}"`);
};

test('each family that came home sees what is left, rebuilds where it burned, remembers its dead and counts what it has, in that order', () => {
  const world = fresh();
  const { trips } = homecomings(world);
  let burned = 0, sold = 0, burials = 0;
  for (const [id, script] of Object.entries(SCRIPTS)) {
    const household = world.households[id];
    const after = script.beats.filter(beat => beat.epilogue);
    const trip = trips[id];
    if (!after.length) continue;
    const kinds = after.map(beat => beat.kind);
    // The order the owner gave: home and what's left, rebuild if necessary, the burial, then the head of household counting.
    const order = ['home', 'rebuild', 'burial', 'count', 'sale'];
    assert.deepEqual(kinds, [...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b)), `${id}'s homecoming is out of order: ${kinds}`);
    assert.equal(kinds[0], 'home');
    for (const beat of after) { assert.equal(beat.durationMs, EPILOGUE_MS[beat.kind]); assert.equal(beat.scene.type, 'yard'); clean(`${id} ${beat.kind}`, beat.caption); }
    // Rebuilding only where the farm was burned; the sale only where it stands, at the ending's own price.
    assert.equal(kinds.includes('rebuild'), trip.house === 'burned', `${id}: rebuilding where nothing burned, or none where it did`);
    const farm = farmAtEnd(world, household);
    const sale = after.find(beat => beat.kind === 'sale');
    if (farm.kind === 'sale') {
      sold++;
      assert.ok(sale, `${id}'s intact farm was not sold in its video`);
      assert.equal(sale.sale, farm.total);
      assert.equal(familyEnding(world, id).sale, farm.total, 'the video and the ending sold the farm for different prices');
      assert.match(sale.caption, new RegExp(`for ${farm.total} reales\\. With the coin in the house, the family had ${household.resources.money + farm.total} reales\\.`));
    } else assert.equal(sale, undefined, `${id}'s farm was sold in its video and not at the ending`);
    const count = after.find(beat => beat.kind === 'count');
    assert.ok(count, `${id}: nobody counted what was left`);
    assert.match(count.caption, new RegExp(`count what the family had left: ${household.resources.money} reales? in coin`));
    if (trip.house === 'burned') { burned++; assert.match(count.caption, /nothing left of it to sell/); }
    // The head of household: the father if he is home, else the mother, else the eldest.
    const head = world.entities[count.scene.head];
    const home = count.scene.people.map(pid => world.entities[pid]);
    const father = home.find(person => person.kin?.role === 'father'), mother = home.find(person => person.kin?.role === 'mother');
    assert.equal(head.id, (father || mother || head).id, `${id}: ${head.name} counted, not the head of the household`);
    // Everybody the family lost, remembered; somebody who died of a sickness never by name (docs/DISEASE.md §4).
    const lost = household.members.map(pid => world.entities[pid]).filter(person => person.health?.condition === 'dead');
    const burial = after.find(beat => beat.kind === 'burial');
    assert.equal(Boolean(burial), lost.length > 0, `${id}: a burial with nobody lost, or none with somebody lost`);
    if (burial) {
      burials++;
      assert.equal(burial.scene.markers, lost.length);
      for (const person of lost) {
        const first = person.name.split(' ')[0];
        if (person.health.disease) assert.ok(!hasWord(burial.caption, first), `${id}: ${first}, dead of a sickness, named at the burial`);
        else assert.ok(hasWord(burial.caption, first), `${id}: ${first} is not remembered`);
      }
    }
  }
  assert.ok(burned >= 1 && sold >= 1, `the class did not try both: ${burned} burned, ${sold} sold`);
  console.log(`homecoming scenes: ${burned} burned, ${sold} sold, ${burials} burials`);
});

test('a death of sickness is remembered at the burial without a name', () => {
  const world = fresh();
  const household = Object.values(world.households).find(one => SCRIPTS[one.id].beats.some(beat => beat.kind === 'count'));
  const child = household.members.map(id => world.entities[id]).find(person => ['son', 'daughter'].includes(person.kin?.role) && person.health?.condition !== 'dead' && person.health?.condition !== 'captured');
  assert.ok(child, 'no child to plant');
  child.health = { condition: 'dead', disease: 'measles' };
  world.events.push({ id: `evt-planted-${child.id}`, type: 'consequence', minute: world.minute - 3000, actorId: child.id, householdId: household.id, importance: 3, sickness: 'died', text: `${child.name} died of the measles.` });
  const script = flashbackScripts(world)[household.id];
  const burial = script.beats.find(beat => beat.kind === 'burial');
  assert.ok(burial, 'the child who died was not remembered');
  assert.ok(!hasWord(burial.caption, child.name.split(' ')[0]), `named at the burial: ${burial.caption}`);
  assert.match(burial.caption, /a child of the family|a son|a daughter/);
});

test('the class\'s own video: two and a half minutes at most, in order, from several families, and none of the ending\'s numbers', () => {
  const world = fresh();
  // A child of a played family dead of a sickness in the spring, so the class screen has one it must not name (docs/DISEASE.md §4).
  const sickFamily = Object.values(world.households).find(household => household.played && household.members.some(id => ['son', 'daughter'].includes(world.entities[id].kin?.role) && world.entities[id].health?.condition !== 'dead'));
  const sickChild = sickFamily.members.map(id => world.entities[id]).find(person => ['son', 'daughter'].includes(person.kin?.role) && person.health?.condition !== 'dead');
  sickChild.health = { condition: 'dead', disease: 'measles' };
  world.events.push({ id: `evt-planted-class-${sickChild.id}`, type: 'consequence', minute: world.minute - 5000, actorId: sickChild.id, householdId: sickFamily.id, importance: 3, sickness: 'died', text: `${sickChild.name} died of the measles.` });
  const script = classFlashbackScript(world, flashbackScripts(world));
  assert.ok(script.durationMs <= CLASS_MS, `the class video is ${script.durationMs} ms`);
  assert.ok(script.durationMs >= 60000, `the class video is only ${script.durationMs} ms`);
  assert.equal(script.beats[0].kind, 'title');
  assert.equal(script.beats.at(-1).kind, 'closing');
  assert.ok(script.beats.length - 2 <= CLASS_MOST_BEATS);
  let at = 0;
  for (const beat of script.beats) { assert.equal(beat.startMs, at); at += beat.durationMs; clean(`class ${beat.kind}`, beat.caption); assert.ok(beat.caption.length < 300, beat.caption); }
  assert.equal(at, script.durationMs);
  const minutes = script.beats.slice(1, -1).map(beat => beat.minute);
  assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b), 'the class video is out of order');
  const kinds = new Set(script.beats.map(beat => beat.kind));
  for (const kind of ['arrival', 'flight', 'home']) assert.ok(kinds.has(kind), `the class video has no ${kind}`);
  assert.ok(kinds.has('fight'), 'no fight a family\'s person was in');
  // From several families' points of view: at least three of the played families are named in it.
  const played = Object.values(world.households).filter(household => household.played);
  const words = script.beats.map(beat => beat.caption).join(' ');
  const named = played.filter(household => words.includes(household.surname ? `${household.surname} family` : world.entities[household.principalId].name));
  assert.ok(named.length >= Math.min(3, played.length), `only ${named.length} families are named in the class video`);
  assert.ok(/[Ss]ickness came to/.test(words), 'the planted sickness is not in the class video: the test tries nothing');
  // Nobody who died of a sickness is named on the projector, and no final number is in it.
  for (const household of Object.values(world.households)) {
    for (const person of household.members.map(id => world.entities[id])) {
      if (person.health?.condition === 'dead' && person.health.disease) assert.ok(!words.includes(person.name), `${person.name}, dead of a sickness, is named on the class screen`);
    }
    assert.ok(!new RegExp(`\\b${familyEnding(world, household.id).final}\\b`).test(words) || familyEnding(world, household.id).final < 10, 'a final number is in the class video');
  }
  // The figures it draws are the class's own people, and the title card stands the families' heads in a row.
  assert.ok(script.beats[0].scene.people.every(id => script.people.some(person => person.id === id)));
  console.log(`class video: ${Math.round(script.durationMs / 1000)} s, ${script.beats.length} beats: ${script.beats.map(beat => beat.kind).join(', ')}`);
});

test('the class\'s video exists only once the class has ended for good', () => {
  const world = fresh();
  world.status = 'running';
  assert.equal(classFlashbackScript(world, SCRIPTS), null);
  world.status = 'ended';
  world.director.milestones['bexar-end'] = 1; world.period = 1;
  assert.equal(classFlashbackScript(world, SCRIPTS), null, 'the interim standings had a class video');
});
