// Béxar before the bell: the warning signs, seen and not explained (owner, 2026-09-27, by multiple choice; sim/town-scenes.mjs
// `BEXAR_BEATS`, docs/battle-research/surprise-at-bexar.md §3 and §6).
//
// A family with somebody in or near Béxar sees, on their dates, the Tejano families packing up and leaving, fifteen of the Tejano
// volunteers going on the 21st, and the fandango of the night of the 22nd - drawn as the town's scenes and told in its journal in
// plain words, with nobody saying what they mean, so the bell of the 23rd still lands. A family elsewhere sees nothing.
//
// Every test was seen failing alone against the regression it guards - `node scripts/surprise-injections.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { ARRIVAL_MINUTES, TIMELINE } from '../sim/directors.mjs';
import { CALENDAR_SCALE } from '../sim/clock.mjs';
import { BEXAR_BEATS, FEB_20, TOWN_BEATS, TOWN_CAST, feb, sceneClock } from '../sim/town-scenes.mjs';

const HISTORY = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('bexar-signs-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
const alive = person => !['dead', 'captured'].includes(person.health.condition);
const grownMan = person => person.householdId && person.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16 && alive(person);
/** Keep a family's people at home and out of every service, so it has nobody in or near Béxar. */
const keepHome = (world, household) => {
  const site = world.map.sites[household.homeSiteId];
  for (const id of household.members) {
    const person = world.entities[id];
    if (person?.kind !== 'person') continue;
    delete person.service;
    Object.assign(person, { chore: null, travel: null, task: 'rest', location: { x: site.x, y: site.y, siteId: household.homeSiteId } });
  }
};
/** One family with a man in the garrison at Béxar, and two kept at home - one of Gonzales and one of another settlement. */
function cast(world) {
  const households = Object.values(world.households);
  const gonzales = households.find(household => (household.settlementId || 'gonzales') === 'gonzales');
  const far = households.find(household => (household.settlementId || 'gonzales') !== 'gonzales');
  const inside = households.find(household => household !== gonzales && household !== far && household.members.some(id => grownMan(world.entities[id])));
  const man = inside.members.map(id => world.entities[id]).find(grownMan);
  const site = world.map.sites.bexar;
  Object.assign(man, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' }, service: { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' } });
  for (const household of [inside, gonzales, far]) household.played = true;
  return { inside, man, gonzales, far };
}
/** Every word a beat has for anybody: its talk, its card and what the journal is told. */
const wordsOf = beat => [
  ...(beat.talk || []).flat().map(([, text]) => text),
  ...(beat.card ? [beat.card.title, beat.card.teller, ...beat.card.said, ...beat.card.known.map(item => item.text), beat.card.madeUp] : []),
  beat.told('Tomás'),
];
/** What would say what the signs mean: an army, who, where from, or why. */
const MEANING = /army|soldier|Santa Anna|enemy|Mexican|march|coming|Rio Grande|Medina|cavalry|surprise|in the path|danger|flee|war\b/i;

test('the rule: Béxar’s signs come on their dates - families packing from the evening of the 20th, the volunteers going on the 21st, the fandango on the night of the 22nd - each long enough to be seen on the half-day calendar', () => {
  // The same February 20 as the director's Herrera at nine that evening.
  assert.equal(FEB_20, TIMELINE.herrera - ARRIVAL_MINUTES - 21 * 60, 'Béxar and the director count February from different mornings');
  const byId = Object.fromEntries(BEXAR_BEATS.map(beat => [beat.id, beat]));
  assert.equal(byId['bx-packing'].from, feb(20, 16), 'the families pack from the evening of the 20th (HIST-TEX-650)');
  assert.ok(byId['bx-volunteers'].from >= feb(21, 0) && byId['bx-volunteers'].from < feb(22, 0), 'the volunteers go on the 21st (HIST-TEX-650)');
  assert.ok(byId['bx-fandango'].from >= feb(22, 12) && byId['bx-fandango'].from < feb(23, 0), 'the fandango is the night of the 22nd (HIST-TEX-614)');
  for (const beat of BEXAR_BEATS) {
    assert.equal(beat.site, 'bexar');
    assert.equal(beat.period, 2, `${beat.id} is not in the second period, where February is`);
    assert.ok(beat.to <= feb(23, 14, 30), `${beat.id} runs past the bell of the 23rd`);
    // A tick of the winter calendar is at most half a day, and falls at whatever hour the last dated moment left it (Herrera's
    // nine in the evening moves every tick after it): a beat at least as long as the longest tick always has a tick in it.
    assert.ok(beat.to - beat.from >= Math.max(...Object.values(CALENDAR_SCALE)), `${beat.id} is ${(beat.to - beat.from) / 60} hours long and can fall between two ticks`);
  }
  // Gonzales's scenes are the first period's: the two towns never have beats at once.
  for (const beat of TOWN_BEATS) assert.ok((beat.period || 1) === 1 && !beat.site, `${beat.id} is not Gonzales's`);
  // Every speaker is somebody of the town, nobody named in the record is given words, and every claim is registered.
  for (const beat of BEXAR_BEATS) {
    for (const [speaker, text] of (beat.talk || []).flat()) {
      assert.ok(TOWN_CAST[speaker], `${beat.id}: "${text}" is said by ${speaker}, who is nobody in Béxar`);
      assert.ok(!TOWN_CAST[speaker].name, `${beat.id}: ${TOWN_CAST[speaker].name} is given words the record does not give`);
    }
    for (const id of [beat.claimId, ...beat.card.known.map(item => item.claimId), ...(beat.talk || []).flat().map(([, , extra]) => extra?.claimId)].filter(Boolean)) {
      assert.ok(HISTORY.includes(`| **${id}** |`), `${beat.id} cites ${id}, which is not registered in HISTORY.md`);
    }
  }
});

test('the rule: nobody says what the signs mean - no line, card or word to the family names an army, who, or why', () => {
  for (const beat of BEXAR_BEATS) {
    for (const text of wordsOf(beat)) assert.doesNotMatch(text, MEANING, `${beat.id} says what it means: "${text}"`);
  }
});

test('the rule: a family with somebody at Béxar sees the signs and is told them on their dates; a family elsewhere sees and hears nothing; the Host sees them all', () => {
  const world = winter();
  const { inside, man, gonzales, far } = cast(world);
  const seen = { inside: new Set(), gonzales: new Set(), far: new Set(), host: new Set() };
  const when = {};
  until(world, () => {
    for (const household of [gonzales, far]) keepHome(world, household);
    const now = sceneClock(world);
    for (const [who, household] of [['inside', inside], ['gonzales', gonzales], ['far', far]]) {
      const scenes = view(world, household.id).townScenes;
      if (scenes?.siteId !== 'bexar') continue;
      for (const scene of scenes.scenes) { seen[who].add(scene.beat); when[scene.beat] ??= now; }
      if (who === 'inside') {
        // Only what is drawn speaks, and the cards ride with what is seen.
        const drawn = new Set(scenes.people.map(one => one.id));
        for (const line of scenes.lines) assert.ok(drawn.has(line.speakerId), `${line.speakerId} speaks and is not drawn`);
        for (const scene of scenes.scenes) assert.ok(scenes.cards[scene.id], `${scene.id} has no card`);
      }
    }
    for (const scene of host(world).townScenes?.scenes || []) seen.host.add(scene.beat);
    return now >= feb(23, 12);
  });
  assert.ok(sceneClock(world) >= feb(23, 12), 'the class never reached the 23rd');
  assert.deepEqual([...seen.inside].sort(), ['bx-fandango', 'bx-leaving', 'bx-packing', 'bx-volunteers'], `the family with a man in Béxar saw ${[...seen.inside]}`);
  assert.deepEqual([...seen.gonzales], [], 'a family at home in Gonzales saw Béxar');
  assert.deepEqual([...seen.far], [], 'a family of another settlement saw Béxar');
  assert.deepEqual([...seen.host].sort(), ['bx-fandango', 'bx-leaving', 'bx-packing', 'bx-volunteers'], 'the Host does not see Béxar');
  for (const beat of BEXAR_BEATS) assert.ok(when[beat.id] >= beat.from && when[beat.id] < beat.to, `${beat.id} was seen off its dates`);
  // Told in plain words, once each, through the family's man there - and to nobody else.
  const said = household => world.events.filter(event => event.householdId === household.id).map(event => event.text);
  for (const beat of BEXAR_BEATS) {
    const line = beat.told(man.name);
    assert.equal(said(inside).filter(text => text === line).length, 1, `the family was not told once: "${line}"`);
    for (const household of [gonzales, far]) assert.ok(!said(household).some(text => text === beat.told(man.name) || text.includes('at Béxar, saw') || text.includes('fandango')), `${household.id} was told of Béxar's signs`);
  }
  assert.ok(view(world, inside.id).events.some(event => event.text === BEXAR_BEATS[0].told(man.name)), 'the family\'s own page does not have it');
  validateWorld(world);
});
