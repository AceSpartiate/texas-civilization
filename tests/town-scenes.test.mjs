// Gonzales before the fight (sim/town-scenes.mjs, docs/BATTLES.md §5 step 2): the town's dated scenes, who is sent them,
// what may be said in them and by whom, and what a family's own person may do there. The page's side is
// scripts/gonzales-town-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { ARRIVAL_MINUTES, TIMELINE } from '../sim/directors.mjs';
import { RESIDENTS } from '../sim/town.mjs';
import { KEEPERS } from '../sim/shops.mjs';
import { canAnswerCalls, sexOf, tooYoung } from '../sim/family.mjs';
import { HELP, SCENE_ARRIVAL, TOWN_BEATS, TOWN_CAST, activeBeats, on, residentSpot, sceneClock, townScenesFor } from '../sim/town-scenes.mjs';

const HISTORY = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');
const moment = key => TIMELINE[key] - ARRIVAL_MINUTES;

/**
 * A class on the real land played to `until` (minutes from midnight on September 29), with the first family's grown man and
 * grown woman walked into Gonzales on the morning of the 29th and the second family at home. Found by seed, so a family
 * with both is used rather than assumed.
 */
function townClass(until = on(0, 11)) {
  for (let n = 0; n < 60; n++) {
    const world = createGonzalesWorld(`town-scenes-${n}`, 5, { map: 'colonies' });
    const people = world.households['hh-1'].members.map(id => world.entities[id]);
    const man = people.find(one => canAnswerCalls(one) && sexOf(one) === 'male'), woman = people.find(one => sexOf(one) === 'female' && !tooYoung(one));
    if (!man || !woman) continue;
    world.status = 'running';
    let guard = 0;
    while (Object.values(world.households).some(h => h.members.some(id => world.entities[id].travel)) && guard++ < 600) stepWorld(world);
    // Set down in the town rather than walked there: a family may live eighty miles off, and the walk is not what this
    // tests (the browser proof walks its person in).
    const town = world.map.sites.gonzales;
    for (const one of [man, woman]) one.location = { x: town.x, y: town.y, siteId: 'gonzales' };
    while (sceneClock(world) < until && guard++ < 6000) stepWorld(world);
    assert.equal(man.location.siteId, 'gonzales');
    assert.equal(woman.location.siteId, 'gonzales');
    return { world, man, woman };
  }
  throw new Error('no seed gave a family with a grown man and a grown woman');
}
const playTo = (world, until) => { for (let guard = 0; sceneClock(world) < until && guard < 6000; guard++) stepWorld(world); };
const known = id => Boolean(TOWN_CAST[id]) || RESIDENTS.some(one => one.id === id) || Object.keys(KEEPERS.gonzales).some(trade => id === `town-${trade}-gonzales`);
const lines = beat => (beat.talk || []).flat();

test("the town keeps the director's clock: nothing before the soldiers come, no word of the fight before the director has it", () => {
  assert.equal(SCENE_ARRIVAL, ARRIVAL_MINUTES, 'the town and the director count from different mornings');
  const first = Math.min(...TOWN_BEATS.map(beat => beat.from));
  assert.ok(first >= moment('notice'), `the town is alarmed at ${first}, before the director's notice at ${moment('notice')}`);
  // Castañeda reached the river about noon on the 29th (HIST-TEX-460); the alarm begins then.
  assert.equal(TOWN_BEATS.find(beat => beat.id === 'street-alarm').from, on(0, 12));
  // The men cross the evening of October 1 (HIST-TEX-465), before the director's crossing moment - never after it.
  assert.ok(TOWN_BEATS.find(beat => beat.id === 'crossing-over').from <= moment('crossing'));
  // Word of how it ended reaches the town when the director says the town has it, and the men after that.
  assert.equal(TOWN_BEATS.find(beat => beat.id === 'street-word').from, moment('resolved'));
  // The town hears the gun when the fight fires it at first light (the fight's `FIC-GONZ-417`), not before.
  assert.equal(TOWN_BEATS.find(beat => beat.id === 'street-gun').from, moment('approach'));
  for (const beat of TOWN_BEATS.filter(one => one.id === 'street-return' || one.id === 'street-word')) {
    assert.ok(beat.from >= moment('resolved'), `${beat.id} tells the outcome before the director has decided it`);
  }
  for (const beat of TOWN_BEATS.filter(one => one.from < moment('resolved'))) {
    for (const [, text] of lines(beat)) assert.doesNotMatch(text, /toward Béxar|baggage|not a man lost|it has begun/i, `${beat.id} says how it ended before it has`);
  }
});

test('each scene has one beat at a time, and nobody of the town is in two places at once', () => {
  for (let at = on(0, 0); at < on(4, 0); at += 10) {
    const beats = TOWN_BEATS.filter(beat => at >= beat.from && at < beat.to);
    const scenes = beats.map(beat => beat.scene);
    assert.equal(new Set(scenes).size, scenes.length, `at ${at} a scene has two beats: ${beats.map(beat => beat.id)}`);
    const ids = beats.flatMap(beat => [...(beat.people || []).map(one => one.id), ...(beat.residents || []).map(one => one.id)]);
    const twice = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual(twice, [], `at ${at} somebody is in two beats: ${beats.map(beat => beat.id)}`);
  }
});

test('only the record puts words in a named mouth; everything else is reconstructed, and every claim is registered', () => {
  const claims = new Set(), taunted = new Set();
  for (const beat of TOWN_BEATS) {
    for (const [speaker, text, extra = {}] of lines(beat)) {
      assert.ok(known(speaker), `${beat.id}: "${text}" is said by ${speaker}, who is nobody in the town`);
      const kind = extra.kind || 'reconstructed';
      assert.ok(['documented', 'reconstructed', 'tradition'].includes(kind), `${beat.id}: "${text}" is of no kind the page knows`);
      if (TOWN_CAST[speaker]?.name) assert.equal(kind, 'documented', `${beat.id}: ${TOWN_CAST[speaker].name} is given words the record does not give him: "${text}"`);
      if (kind === 'documented') assert.ok(extra.claimId, `${beat.id}: "${text}" is shown as on record with no claim`);
      // HIST-TEX-469: "come and take it" was never said to the soldiers in anything of 1835. The flag's makers say it as the
      // words to go on the flag; elsewhere it is the men's taunt the owner asked for (2026-09-25), and then only as a later
      // memory: `tradition`, unnamed, with a gloss that says who remembered it.
      if (/come and take it/i.test(text) && beat.scene !== 'flag') {
        assert.equal(kind, 'tradition', `${beat.id}: "${text}" is shown as ${kind}, not as the later memory it is`);
        assert.equal(extra.claimId, 'HIST-TEX-469');
        assert.match(extra.gloss || '', /remembered/, `${beat.id}: "${text}" does not say it was remembered later`);
        taunted.add(beat.scene);
      }
      if (extra.claimId) claims.add(extra.claimId);
    }
    for (const item of beat.card?.known || []) if (item.claimId) claims.add(item.claimId);
  }
  for (const id of claims) assert.ok(HISTORY.includes(`**${id}**`), `${id} is cited by the town and not registered in HISTORY.md`);
  // The owner, 2026-09-25: "have the men say it as a taunt of sorts" - one of the eighteen calls it across the river.
  assert.deepEqual([...taunted], ['crossing'], 'the men at the crossing never call the flag\'s words across the river');
  const documented = TOWN_BEATS.flatMap(beat => lines(beat).filter(([, , extra = {}]) => extra.kind === 'documented').map(([speaker, text]) => ({ speaker, text })));
  assert.deepEqual(documented.map(one => one.speaker), ['gz-clements'], 'the only words in the town on record are the regidor\'s letter');
  assert.equal(documented[0].text, 'I cannot now will not deliver to you the cannon');
  // The flag's makers are not named (HIST-TEX-468).
  for (const beat of TOWN_BEATS.filter(one => one.scene === 'flag')) {
    for (const one of beat.people || []) assert.ok(!TOWN_CAST[one.id].name, `${one.id} at the flag has a name the record does not give`);
  }
});

test('a family sees the town only while one of its own is standing there; the Host sees it all; nothing later is on the wire', () => {
  const { world, man, woman } = townClass(on(0, 13));
  const mine = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.ok(mine.townScenes, 'a family with two people in Gonzales is sent nothing of it');
  assert.deepEqual(mine.townScenes.scenes.map(scene => scene.beat).sort(), ['camp-mound', 'crossing-hold', 'leaving-load', 'orchard-hidden', 'street-alarm']);
  // Nothing of what the town will do: no flag, no reading, no return, and no schedule.
  const text = JSON.stringify(mine.townScenes);
  for (const later of ['Come and take it', 'I cannot now will not', 'baggage', 'Moore is colonel', '"from":', 'flagHouse']) assert.ok(!text.includes(later), `the first afternoon already carries "${later}"`);
  // Every line on the wire is said by somebody drawn or posed on that page.
  const there = new Set([...mine.townScenes.people.map(one => one.id), ...Object.keys(mine.townScenes.poses)]);
  for (const line of mine.townScenes.lines) assert.ok(there.has(line.speakerId), `"${line.text}" is put over ${line.speakerId}, who is not there`);

  const away = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  assert.ok(!('townScenes' in away), 'a family out on its land is sent the town');
  for (const words of ['Soldiers on the far bank', 'gz-eighteen', 'breastwork']) assert.ok(!JSON.stringify(away).includes(words), `a family on its land is sent "${words}"`);

  const host = projectWorld(world, null, 'host', { includeMap: false });
  assert.deepEqual(host.townScenes.scenes.map(scene => scene.beat).sort(), mine.townScenes.scenes.map(scene => scene.beat).sort());
  assert.deepEqual(host.townScenes.help, {}, 'the Host is offered a family\'s help');

  // At the crossing, and not in the town: the river and the far bank, not the street.
  const ford = world.map.sites.ford;
  for (const one of [man, woman]) one.location = { x: ford.x, y: ford.y, siteId: 'ford' };
  const atFord = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.deepEqual(atFord.townScenes.scenes.map(scene => scene.id).sort(), ['camp', 'crossing']);
  // On the road, nowhere: nothing.
  man.location = { x: ford.x, y: ford.y, siteId: null }; man.travel = { from: 'ford', to: 'gonzales', points: [ford, world.map.sites.gonzales], progress: 0, distance: 1 };
  woman.location = { ...world.map.sites[world.households['hh-1'].homeSiteId], siteId: world.households['hh-1'].homeSiteId };
  assert.equal(townScenesFor(world, 'hh-1', 'student'), null, 'somebody on the road, and somebody at home, see the town');
});

test('the women make the flag on September 30 and October 1, and the men cross with it that night', () => {
  const at = minute => activeBeats({ director: { arrival: true }, period: 1, map: { sites: { gonzales: { x: 0, y: 0 } } }, minute: minute + SCENE_ARRIVAL }).map(beat => beat.id);
  assert.ok(at(on(1, 20)).includes('flag-cloth'));
  assert.ok(at(on(2, 14)).includes('flag-painted'));
  assert.ok(!at(on(1, 10)).some(id => id.startsWith('flag')), 'the flag is being made before the thirtieth');
  assert.ok(!at(on(3, 12)).some(id => id.startsWith('flag')), 'the flag is still being made on the day of the fight');
  const over = TOWN_BEATS.find(beat => beat.id === 'crossing-over');
  assert.ok(over.people.some(one => one.carries === 'flag'), 'the flag does not go over the river with the men');
  assert.ok(TOWN_BEATS.find(beat => beat.id === 'flag-cloth').people.every(one => ['blue-girl', 'teal', 'indigo', 'girl'].includes(TOWN_CAST[one.id].figure)), 'somebody other than the women and a girl is making the flag');
});

test('the town\'s invented people go where the town is gathering, and back to their round after', () => {
  const { world } = townClass(on(0, 13));
  const ruth = world.entities['town-crandall'];
  assert.deepEqual({ x: ruth.location.x, y: ruth.location.y }, residentSpot(world, 'town-crandall'), 'Ruth Crandall is not with the town in the street');
  const town = world.map.sites.gonzales;
  const round = RESIDENTS.find(one => one.id === 'town-crandall').round;
  playTo(world, on(1, 1));
  assert.equal(residentSpot(world, 'town-crandall'), null, 'the street is still full in the middle of the night');
  assert.ok(round.some(spot => Math.abs(town.x + spot.x - ruth.location.x) < 1e-6 && Math.abs(town.y + spot.y - ruth.location.y) < 1e-6), 'Ruth Crandall did not go back to her round');
  // A shopkeeper is posed at the door and never moved from it: the counter stays where it is.
  playTo(world, on(1, 8));
  const tavern = world.entities['town-tavern-gonzales'];
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.ok(view.townScenes.poses['town-tavern-gonzales'], 'the tavern keeper is not part of the town\'s morning');
  assert.ok(Math.abs(tavern.location.x - (town.x + tavern.shopSpot.x)) < 0.01, 'the tavern keeper was moved off her door');
});

test('a family\'s own person may lend a hand where the record has people doing that work, and the family remembers it', () => {
  const { world, man, woman } = townClass(on(1, 12, 30));
  assert.throws(() => applyAction(world, 'hh-1', { action: 'town-help', entityId: man.id, scene: 'flag' }), /Nobody in Gonzales is asking/, 'the flag is asked for help before the cloth is out');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'town-help', entityId: woman.id, scene: 'cannon' }), /could help the women with the flag instead/);
  const view = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const offer = view.townScenes.help.cannon;
  assert.deepEqual(offer.people.map(one => [one.id, one.can]).sort(), [[man.id, true], [woman.id, false]].sort());
  applyAction(world, 'hh-1', { action: 'town-help', entityId: man.id, scene: 'cannon' });
  assert.equal(man.townHelp.sceneId, 'cannon');
  assert.equal(man.location.siteId, 'gonzales');
  assert.ok(projectWorld(world, 'hh-1', 'student', { includeMap: false }).townScenes.poses[man.id], 'the man helping is not drawn at the work');
  // Seen helping by another family standing in the town, as anybody would be: the work, not the family's business.
  const saved = JSON.parse(JSON.stringify(world));
  validateWorld(saved);
  assert.deepEqual(saved.entities[man.id].townHelp, man.townHelp, 'the help did not survive a save');
  // The woman goes to the flag once the cloth is out; sending her home ends it, and the family remembers.
  playTo(world, on(1, 15));
  applyAction(world, 'hh-1', { action: 'town-help', entityId: woman.id, scene: 'flag' });
  assert.equal(woman.townHelp.sceneId, 'flag');
  applyAction(world, 'hh-1', { action: 'set-main', entityId: woman.id });
  applyAction(world, 'hh-1', { action: 'travel', entityId: woman.id, destination: world.households['hh-1'].homeSiteId });
  stepWorld(world);
  assert.equal(woman.townHelp, undefined, 'she is still helping on the road home');
  const hers = world.events.filter(event => event.type === 'consequence' && event.actorId === woman.id && event.claimId === 'FIC-GONZ-412');
  assert.equal(hers.length, 1);
  assert.match(hers[0].text, /helped the women of Gonzales with the flag/);
  // The gun is done on the evening of October 1, and his help with it.
  playTo(world, on(2, 20));
  assert.equal(man.townHelp, undefined, 'he is still at the gun after it went over the river');
  assert.equal(world.events.filter(event => event.type === 'consequence' && event.actorId === man.id && event.claimId === 'FIC-GONZ-412').length, 1);
  // Out of the town, nobody can help anything.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'town-help', entityId: woman.id, scene: 'flag' }), /Nobody in Gonzales|not in Gonzales/);
  assert.equal(Object.keys(HELP).sort().join(), 'cannon,flag');
});

test('a class saved before the town had scenes, or at any moment in them, opens where the town was; no save version moved', () => {
  const { world } = townClass(on(1, 16, 30));
  const before = projectWorld(world, 'hh-1', 'student', { includeMap: false }).townScenes;
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  assert.deepEqual(projectWorld(reopened, 'hh-1', 'student', { includeMap: false }).townScenes, before, 'a reopened class shows a different town');
  // Nothing about the scenes is stored but a family's help: the world carries no key of them.
  assert.ok(!('townScenes' in world), 'the town\'s scenes were written into the world');
  // A class saved before arrivals keeps its old clock (midnight on the 29th is minute zero).
  const old = { ...reopened, director: { ...reopened.director, arrival: undefined }, minute: on(1, 16, 30) };
  assert.equal(sceneClock(old), on(1, 16, 30));
  assert.ok(activeBeats(old).some(beat => beat.id === 'crossing-reading'));
  // The winter and the spring have no Gonzales scenes.
  assert.deepEqual(activeBeats({ ...reopened, period: 2 }), []);
});

test('every word is put over somebody who is there to say it, every hour of the four days', () => {
  const { world } = townClass(on(0, 12));
  let heard = 0;
  for (let guard = 0; sceneClock(world) < on(3, 20) && guard < 400; guard++) {
    const view = projectWorld(world, null, 'host', { includeMap: false }).townScenes;
    if (view) {
      const there = new Set([...view.people.map(one => one.id), ...Object.keys(view.poses)]);
      for (const line of view.lines) {
        assert.ok(there.has(line.speakerId), `at ${sceneClock(world)} "${line.text}" is put over ${line.speakerId}, who is not there`);
        heard++;
      }
    }
    stepWorld(world);
  }
  assert.ok(heard > 100, `only ${heard} lines were said in four days`);
});
