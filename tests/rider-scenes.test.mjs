// Every rider who reaches a family plays as a scene (owner, 2026-10-05: "I want to radically redesign the whole rider and or news
// person shows up. The conversation is boring. Let's redo each of them as a cutscene sort of like with the wedding. The
// environment should change in the cutscene based on where they are and who's around them."; "Every rider who reaches you";
// docs/COLONIES.md §5.4e, `FIC-GONZ-1195` to `-1199`).
//
// The server decides where (sim/rider-scene.mjs `settingFor`), who (`castFor`), who asks each question and what the people standing
// there say (sim/rider-talk.mjs), and gives every word carried by express a rider who says it (sim/encounters.mjs `tellPassing`).
// What these tests hold: the setting follows where the person actually stands; the cast is whoever is near and nobody else; every
// word the director sends by express has a conversation; the knowledge rules are the riders' own - the word is known the minute
// it is said, an answer is never on the wire before it is asked, a reaction never comes before what it reacts to; one family
// listens to one rider at a time; a family nobody plays is told as before; and a class saved before any of this still opens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, beginTravel, dispatchReport, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { NEAR_MILES, castFor, lightOf, settingFor } from '../sim/rider-scene.mjs';
import { TOPIC_MOOD, askerFor, expressScript, wordAsSaid } from '../sim/rider-talk.mjs';
import { CONVERSATIONS, accountOf, blockedByWater, linesOf, tellPassing } from '../sim/encounters.mjs';
import { establishTruth } from '../sim/knowledge.mjs';
import { sendExpress } from '../sim/expresses.mjs';
import { partOfDay } from '../sim/courtship.mjs';
import { dateOf } from '../sim/clock.mjs';
import { STREET, piecesOf } from '../public/rider-scene.js';
import { placeCast } from '../public/cutscene.js';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const openOf = (world, householdId) => Object.values(world.encounters || {}).find(one => one.householdId === householdId && one.status === 'open');
const stand = (person, site) => { person.travel = null; person.chore = null; person.task = 'rest'; person.location = { x: site.x, y: site.y, siteId: site.id }; };
/** The invented Gonzales country with its families at home, the cannon news in the world and no rider yet on the road. */
function country(seed = 'scenes', players = 5) {
  const world = createGonzalesWorld(seed, players);
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth['cannon-request']) stepWorld(world);
  for (const household of Object.values(world.households)) {
    delete household.arriving;
    for (const id of household.members) stand(world.entities[id], world.map.sites[household.homeSiteId]);
  }
  return world;
}
const membersOf = (world, householdId) => world.households[householdId].members.map(id => world.entities[id]);

test('the scene is where the person the rider stopped is standing: their yard, a town, the camp, a ford, the road or the woods', () => {
  const world = country('where');
  const person = membersOf(world, 'hh-2')[0];
  const sites = world.map.sites;
  assert.equal(settingFor(world, person).kind, 'home', 'at their own house');
  const home = settingFor(world, person);
  assert.ok(home.house && ['camp', 'building', 'house', 'ruined'].includes(home.house.shelter), 'the yard carries the house as it stands');
  stand(person, sites.gonzales);
  assert.deepEqual([settingFor(world, person).kind, settingFor(world, person).siteId, settingFor(world, person).name], ['town', 'gonzales', 'Gonzales'], 'in the town\'s street');
  stand(person, sites.ford);
  assert.equal(settingFor(world, person).kind, 'ford', 'at the ford');
  stand(person, sites['williams-camp']);
  assert.equal(settingFor(world, person).kind, 'camp', 'at the camp');
  stand(person, sites[world.households['hh-2'].homeSiteId]);
  person.service = { kind: 'gathering', status: 'serving', since: world.minute };
  assert.equal(settingFor(world, person).kind, 'camp', 'a man serving with the volunteers is in camp wherever the army stands');
  delete person.service;
  const roads = Object.values(sites).filter(site => site.kind === 'junction').map(site => { stand(person, site); return settingFor(world, person); });
  assert.ok(roads.some(one => one.kind === 'road'), `no fork of the road reads as the road: ${roads.map(one => one.kind)}`);
  const woods = Object.values(sites).filter(site => site.kind === 'woods').map(site => { stand(person, site); return settingFor(world, person); });
  assert.ok(woods.some(one => one.woods), 'standing in the timber has no woods about it');
  assert.ok(woods.filter(one => one.kind === 'road').every(one => one.name === 'In the woods'), 'the road through the timber is not called the woods');
});

test('whoever is near is in the scene, the person he stopped first, and nobody away or across the river', () => {
  const world = country('who');
  const [listener, ...rest] = membersOf(world, 'hh-3');
  const setting = settingFor(world, listener);
  const blocked = (a, b) => blockedByWater(world, a, b);
  let cast = castFor(world, listener, setting, blocked);
  assert.equal(cast[0].id, listener.id);
  assert.equal(cast[0].role, 'listener');
  assert.deepEqual(cast.slice(1).filter(one => one.role === 'family').map(one => one.id).sort(), rest.map(one => one.id).sort(), 'the family at home is in the yard');
  // One of them away up the road is not.
  const away = rest[0];
  stand(away, world.map.sites.gonzales);
  cast = castFor(world, listener, settingFor(world, listener), blocked);
  assert.ok(!cast.some(one => one.id === away.id), 'somebody in town is in the yard at home');
  // Two people a stone's throw apart with the Guadalupe between them are not in one scene.
  const river = world.map.terrain.find(feature => feature.kind === 'river');
  const [a, b] = [river.points[1], river.points[2]];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, len = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
  const across = rest[1];
  listener.location = { x: mid.x + nx * 0.06, y: mid.y + ny * 0.06, siteId: listener.location.siteId };
  across.location = { x: mid.x - nx * 0.06, y: mid.y - ny * 0.06, siteId: null };
  assert.ok(Math.hypot(listener.location.x - across.location.x, listener.location.y - across.location.y) < NEAR_MILES);
  cast = castFor(world, listener, settingFor(world, listener), blocked);
  assert.ok(!cast.some(one => one.id === across.id), 'somebody across the river is in the scene');
  // In town: the town's own people stand about the family's, and a neighbour of another family there is a neighbour.
  stand(listener, world.map.sites.gonzales);
  const neighbour = membersOf(world, 'hh-4')[0];
  stand(neighbour, world.map.sites.gonzales);
  cast = castFor(world, listener, settingFor(world, listener), blocked);
  const town = cast.filter(one => one.role === 'town');
  assert.ok(town.length >= 1 && town.every(one => world.entities[one.id].resident || world.entities[one.id].townSiteId), `the town's people are not in the street: ${JSON.stringify(cast)}`);
  assert.ok(cast.some(one => one.id === away.id && one.role === 'family'), 'the family member in town stands with the one met in town');
  assert.ok(cast.length <= 8, 'a crowd, not the whole street');
  assert.ok(!cast.some(one => world.entities[one.id].courier), 'a rider is not one of the people about him');
  // In camp: the volunteers about him.
  for (const person of [listener, neighbour]) { stand(person, world.map.sites['williams-camp']); person.service = { kind: 'gathering', status: 'serving', since: world.minute }; }
  cast = castFor(world, listener, settingFor(world, listener), blocked);
  assert.equal(cast.find(one => one.id === neighbour.id)?.role, 'volunteer', 'another family\'s man in camp is a volunteer');
});

test('the rider who stops is met in a scene: the people standing there react, ask the questions, and say goodbye - never ahead of him', () => {
  const world = country('talk');
  world.households['hh-2'].played = true;
  dispatchReport(world, 'cannon-request', 'hh-2');
  for (let i = 0; i < 60 && !openOf(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openOf(world, 'hh-2');
  assert.ok(encounter, 'the rider reached the family');
  assert.equal(encounter.scene.setting.kind, 'home');
  const castIds = encounter.scene.cast.map(one => one.id);
  assert.deepEqual(castIds.sort(), [...world.households['hh-2'].members].sort(), 'the whole family at home is in the yard');
  // The opening is said and the family knows it; what the people standing there said came after it, and they are of the scene.
  assert.equal(encounter.said.length, 1);
  assert.ok(encounter.talk.length >= 1, 'nobody said a word when they heard it');
  for (const line of encounter.talk) { assert.ok(line.after >= 1, 'something was said before the rider spoke'); assert.ok(castIds.includes(line.speakerId)); }
  // A question, asked by somebody standing there: the one its button names.
  const projected = view(world, 'hh-2').encounter;
  assert.ok(projected.scene && projected.scene.cast[encounter.listenerId], 'the page is not sent the scene');
  assert.ok(projected.questions.every(question => castIds.includes(question.by)), 'a question is asked by somebody not there');
  const question = projected.questions.find(one => one.id === 'how-many');
  const talkBefore = encounter.talk.length;
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'how-many' });
  assert.equal(encounter.said[1].speakerId || encounter.listenerId, question.by, 'the question was asked by somebody other than its button said');
  assert.match(encounter.said[1].text, /How many/);
  assert.equal(encounter.said[2].speaker, 'rider');
  const reaction = encounter.talk.slice(talkBefore);
  assert.ok(reaction.length === 1 && reaction[0].after === 3, 'the reaction to the answer did not come after it');
  // Done: the farewell and the last words, then he is gone.
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
  const closing = encounter.talk.filter(line => line.farewell || line.closing);
  assert.ok(closing.length >= 2, 'nobody said goodbye');
  assert.ok(closing.some(line => line.speakerId === 'rider'), 'the rider did not answer the farewell');
  assert.ok(closing.every(line => line.after === encounter.said.length), 'goodbye was said before the conversation was over');
  validateWorld(world);
});

test('somebody of the family away with the volunteers is asked after, by their own, and the rider has no names', () => {
  const world = country('kin');
  world.households['hh-2'].played = true;
  const people = membersOf(world, 'hh-2');
  const father = people.find(one => one.kin?.role === 'father');
  const mother = people.find(one => one.kin?.role === 'mother');
  stand(father, world.map.sites['williams-camp']);
  father.service = { kind: 'gathering', status: 'serving', since: world.minute };
  dispatchReport(world, 'cannon-request', 'hh-2');
  for (let i = 0; i < 60 && !openOf(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openOf(world, 'hh-2');
  assert.ok(encounter && encounter.scene.setting.kind === 'home');
  assert.equal(encounter.kin?.id, father.id, 'the one away is not asked after');
  // The wife asks something first; the one away is still asked after by her.
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'what-wanted' });
  assert.equal(encounter.said.at(-2).speakerId || encounter.listenerId, mother.id, 'the mother did not ask the town question');
  const kin = linesOf(encounter).find(line => line.id === 'kin');
  assert.match(kin.ask, new RegExp(father.name.split(' ')[0]));
  assert.equal(askerFor(world, encounter, kin), mother.id, 'the one away is asked after by somebody other than their wife');
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'kin' });
  assert.match(encounter.said.at(-1).text, /names?/i, 'the rider gave a name or a fate');
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
  assert.ok(encounter.talk.some(line => line.farewell && line.speakerId === mother.id && line.text.includes(father.name.split(' ')[0])), 'the wife sends no word to the one away');
});

test('every word the director sends by express has a rider who can say it and be asked about it', () => {
  const source = readFileSync(new URL('../sim/directors.mjs', import.meta.url), 'utf8');
  const sent = [...new Set([...source.matchAll(/(?:sendWord|carryWord|sendExpress)\(world, '([a-z0-9-]+)'/g)].map(match => match[1]))];
  assert.ok(sent.length >= 20, `only ${sent.length} words found`);
  const accounts = [
    { departedAgo: 'an hour', observedAgo: '3 days', firsthand: true, express: true, stop: 'Gonzales', from: 'Gonzales' },
    { departedAgo: '5 hours', observedAgo: '2 days', firsthand: false, express: true, stop: 'San Felipe de Austin', from: 'Béxar' },
  ];
  for (const topic of sent) {
    assert.ok(TOPIC_MOOD[topic], `${topic} has no mood for what the people say`);
    const script = expressScript(topic);
    assert.ok(script.lines.some(line => line.id === 'extra'), `${topic} has nothing written of its own to be asked`);
    for (const status of ['rumor', 'unconfirmed', 'confirmed', 'contradicted']) for (const account of accounts) {
      const word = { text: 'Word has come that the volunteers took the presidio.', source: 'Word from the army', status };
      const said = [script.opening({ ...account, word }), ...script.lines.map(line => line.answer({ ...account, word })), ...script.lines.map(line => line.ask)];
      for (const text of said) assert.ok(typeof text === 'string' && text.length > 3 && !/undefined|null|\{|\}|NaN/.test(text), `${topic}: "${text}"`);
    }
  }
  assert.equal(wordAsSaid('Word has come that Béxar has fallen.'), 'Béxar has fallen.');
  assert.equal(wordAsSaid('Word from Béxar: Colonel Travis does not look for them.'), 'Colonel Travis does not look for them.');
});

test('an express rider tells the family where its person stands: the word said and known on one minute, no answer sent before it is asked', () => {
  const world = createGonzalesWorld('express-scene', 6, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (const household of Object.values(world.households)) if (household.id !== 'hh-2') household.played = true;
  establishTruth(world, { id: 'winter-council', text: 'The government at San Felipe has fallen out with itself.', siteId: 'san-felipe', classification: 'DOCUMENTED', claimId: 'HIST-TEX-050' });
  assert.ok(sendExpress(world, 'winter-council', { from: 'san-felipe', status: 'confirmed', text: 'The government at San Felipe has fallen out with itself: the council has put out Governor Smith.', source: 'Word from San Felipe', beginTravel }));
  const heard = (id = null) => (id ? [id] : Object.keys(world.households)).every(one => world.knowledge.households[one]?.['winter-council']);
  const step = done => {
    for (let t = 0; t < 4000 && !done(); t++) {
      stepWorld(world);
      // Until a family's rider has said it, nothing of it is in what the family's page is sent.
      for (const id of Object.keys(world.households)) if (!world.knowledge.households[id]?.['winter-council']) assert.ok(!JSON.stringify(view(world, id)).includes('fallen out'), `${id} was sent the word before it was told`);
    }
  };
  step(() => heard('hh-1'));
  assert.ok(heard('hh-1'), 'the played family never heard');
  const scene = Object.values(world.encounters).find(one => one.topicId === 'winter-council' && one.householdId === 'hh-1');
  assert.ok(scene?.passing && scene.via === 'express', 'the played family got no rider');
  assert.equal(scene.status, 'open', 'the rider who came is not standing with the family');
  const known = world.knowledge.households['hh-1']['winter-council'];
  assert.equal(scene.said[0].minute, known.receivedMinute, 'the word was said on another minute than it was known');
  assert.ok(scene.said[0].text.includes('council has put out Governor Smith'), 'the rider did not say the word');
  assert.equal(world.entities[scene.listenerId].householdId, 'hh-1');
  assert.ok(scene.scene.cast.some(one => one.id === scene.listenerId && one.role === 'listener'));
  // The provenance a family can walk back: the express's rider at the stop it was read at, unless it came in where they are.
  for (const hop of scene.provenance) assert.ok(world.map.sites[hop.atSiteId] && hop.name);
  // Answers: none on the wire before asked; each said when asked, by somebody of the scene.
  const lines = linesOf(scene), account = accountOf(world, scene);
  const wire = JSON.stringify(view(world, 'hh-1'));
  for (const line of lines) assert.ok(!wire.includes(line.answer(account).slice(0, 40)), `an unasked answer reached the page: ${line.id}`);
  const by = view(world, 'hh-1').encounter.questions.find(one => one.id === 'sure').by;
  applyAction(world, 'hh-1', { action: 'ask-rider', entityId: scene.listenerId, lineId: 'sure' });
  assert.equal(scene.said.at(-2).speakerId || scene.listenerId, by);
  assert.match(scene.said.at(-1).text, /no doubt/);
  // A family nobody plays knows it as before, and is shown no scene.
  step(() => heard());
  assert.ok(heard(), 'a family never heard');
  assert.ok(!Object.values(world.encounters).some(one => one.topicId === 'winter-council' && one.householdId === 'hh-2'), 'a family nobody plays was given a scene');
  validateWorld(world);
});

test('one family listens to one rider at a time: the next has said his word and waits his turn, and comes on when the first has gone', () => {
  const world = country('queue');
  world.households['hh-2'].played = true;
  const [listener] = membersOf(world, 'hh-2');
  for (const id of ['winter-terms', 'declaration']) establishTruth(world, { id, text: `The ${id} news.`, siteId: 'gonzales' });
  const first = tellPassing(world, 'hh-2', { topicId: 'winter-terms', listenerId: listener.id, text: 'General Houston calls for volunteers.', source: 'A printed call', fromSiteId: 'gonzales' });
  const second = tellPassing(world, 'hh-2', { topicId: 'declaration', listenerId: listener.id, text: 'The convention has declared Texas independent.', source: 'Word from Washington', fromSiteId: 'gonzales' });
  assert.equal(first.status, 'open');
  assert.equal(second.status, 'waiting', 'two riders talked to one family at once');
  assert.equal(second.said.length, 1, 'the second did not say his word when he came');
  validateWorld(world);
  stepWorld(world);
  assert.equal(first.status, 'open');
  assert.equal(second.status, 'waiting', 'the next came on while the first still talked');
  let projected = view(world, 'hh-2').encounter;
  assert.equal(projected.id, first.id, 'the page was shown the rider waiting instead of the one talking');
  assert.equal(projected.queued, 1);
  assert.match(projected.waiting.words, /Another rider/);
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: listener.id });
  assert.equal(second.status, 'waiting', 'the next came on before the first had gone');
  stepWorld(world); stepWorld(world);
  assert.equal(second.status, 'open', 'the next never came on');
  projected = view(world, 'hh-2').encounter;
  assert.equal(projected.id, second.id);
  assert.ok(second.said[0].minute < second.openedMinute, 'his word was not said when he came');
});

test('a class saved before rider scenes still opens: a meeting in progress has its scene settled from where its people stand', () => {
  const world = country('old');
  world.households['hh-2'].played = true;
  dispatchReport(world, 'cannon-request', 'hh-2');
  for (let i = 0; i < 60 && !openOf(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openOf(world, 'hh-2');
  // As a save of 2026-10-04 has it: no scene, nobody's words but the two of them, no asker on a line.
  delete encounter.scene; delete encounter.talk; delete encounter.kin;
  for (const line of encounter.said) delete line.speakerId;
  const reloaded = JSON.parse(JSON.stringify(world));
  validateWorld(reloaded);
  const projected = view(reloaded, 'hh-2').encounter;
  assert.equal(projected.scene.setting.kind, 'home', 'a meeting in progress has no scene to play');
  assert.deepEqual(projected.talk, []);
  const live = openOf(reloaded, 'hh-2');
  applyAction(reloaded, 'hh-2', { action: 'ask-rider', entityId: live.listenerId, lineId: 'saw-it' });
  applyAction(reloaded, 'hh-2', { action: 'leave-rider', entityId: live.listenerId });
  for (let i = 0; i < 3; i++) stepWorld(reloaded);
  validateWorld(reloaded);
  // A stored scene of a kind nobody knows is refused.
  const bad = JSON.parse(JSON.stringify(world));
  openOf(bad, 'hh-2').scene = { setting: { kind: 'moon' }, cast: [] };
  assert.throws(() => validateWorld(bad), /rider scene/);
  assert.equal(CONVERSATIONS['cannon-request'].lines.length, 5);
});

test('the scene is lit by the class\'s own clock, the wedding\'s hours', () => {
  const world = country('light');
  for (let hour = 0; hour < 24; hour++) {
    const minute = hour * 60 + 20;
    const ours = lightOf(world, minute), theirs = partOfDay(dateOf(world, minute));
    assert.deepEqual([ours.light, ours.when], [theirs.light, theirs.when], `at ${hour}:20`);
  }
});

test('the page sets each place with its own pieces and stands the family on the left, the town\'s people behind the rider', () => {
  const names = setting => piecesOf(setting).map(piece => piece.name);
  assert.ok(names({ kind: 'home', house: { shelter: 'house', layout: 'dog-run' } }).includes('house-dog-run'));
  assert.ok(names({ kind: 'home', house: { shelter: 'camp' } }).includes('tent'));
  assert.ok(names({ kind: 'home', house: { shelter: 'camp' }, field: { crop: 'cotton', state: 'ripe' } }).includes('cotton-mature'));
  assert.deepEqual(names({ kind: 'town', siteId: 'gonzales' }), STREET.gonzales);
  assert.deepEqual(names({ kind: 'town', siteId: 'bexar' }), STREET.tejano);
  assert.ok(names({ kind: 'camp' }).filter(name => name === 'tent').length >= 3);
  assert.ok(names({ kind: 'road', woods: true }).some(name => /oak|pecan/.test(name)));
  const { places, h } = placeCast([
    { id: 'mother', band: 'adult', side: 'left', slot: 0, row: 0, face: 'e' },
    { id: 'boy', band: 'child', side: 'left', slot: 0.6, row: 1, face: 'e' },
    { id: 'keeper', band: 'adult', side: 'right', slot: 1.4, row: -1, face: 'w' },
  ], 1366, 768, { ground: 0.6, share: 0.25 });
  const at = id => places.find(place => place.id === id);
  assert.ok(at('mother').x < 683 && at('boy').x < 683 && at('keeper').x > 683);
  assert.ok(at('boy').y > at('mother').y && at('keeper').y < at('mother').y, 'the child is not in front or the keeper not behind');
  assert.ok(at('boy').h < h && at('keeper').h < h);
  assert.equal(places[0].id, 'keeper', 'the one behind is not drawn first');
});
