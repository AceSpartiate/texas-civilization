// Ambient life (sim/ambient.mjs, public/ambient.js, docs/AMBIENT.md; owner, 2026-09-28): the idle are drawn at something, and
// neighbours say a few short words to each other - never what the family has not heard, never in a named mouth, and never
// changing the class.
//
// Each test is named for a rule. Every one was seen failing alone against the regression it guards - `node
// scripts/ambient-injections.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { dateOf } from '../sim/clock.mjs';
import { PEOPLE } from '../sim/people.mjs';
import { TOWN_CAST } from '../sim/town-scenes.mjs';
import { entityClip, CHILD_POSES } from '../public/motion.js';
import { CAMP_MEN as PAGE_CAMP_MEN } from '../public/army-view.js';
import {
  ACTIVITIES, CAMP_MEN, EXCHANGES, HOST_EXCHANGES, LINE_CHARS, LINE_WORDS, PAGE_EXCHANGES, WORD_FIRST_MINUTES, WORD_MILES_A_DAY,
  ambientFor, campAmbient, classAmbient, crowdAt, hearsayOf, syllables, unreadable,
} from '../sim/ambient.mjs';
import { settle, taught } from './support/settled.mjs';

const GONE = ['dead', 'captured'];
const STILL = ['wounded', 'hurt', 'sick', 'very sick', 'dead', 'captured'];

/** A class on the real land, arrived and taught, running, with every family's people home. */
function settledClass(seed = 'ambient-class', families = 5) {
  const world = taught(settle(createGonzalesWorld(seed, families, { map: 'colonies' })));
  world.status = 'running';
  return world;
}
/** A class played from its arrival for `ticks`, as the director plays it. */
function playedClass(seed, ticks, families = 5) {
  const world = createGonzalesWorld(seed, families, { map: 'colonies' });
  world.status = 'running';
  for (let t = 0; t < ticks; t++) stepWorld(world);
  return world;
}
const pages = world => [...Object.keys(world.households).map(id => [id, 'student']), [null, 'host']];
const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const peopleOf = v => [...(v.entities || []), ...(v.others || [])].filter(one => one.kind === 'person');
/** Set somebody down standing in a place, with nothing to do. */
function standIn(world, entity, siteId, dx = 0, dy = 0) {
  const site = world.map.sites[siteId];
  entity.travel = null; entity.chore = null; entity.task = 'work';
  entity.location = { x: site.x + dx, y: site.y + dy, siteId };
}
const grownOf = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.kind === 'person' && !one.principal && !(one.age < 16));

/**
 * Whether a person on a page is one the page would otherwise draw standing idle, judged from what the page was sent and not
 * from sim/ambient.mjs: a person standing about (or halted on a journey), well, not resting, not the student's own, not a
 * rider, with no work of their own that the page draws, and nobody else's to draw (a meeting, a child's call, a town scene).
 */
function wouldStandIdle(world, v, one, role) {
  const e = world.entities[one.id];
  const own = one.householdId && one.householdId === v.householdId && role !== 'host';
  if (!e || one.principal || e.principal || one.carrier || e.courier || e.report || e.runner) return false;
  if (STILL.includes(one.condition || one.health?.condition || e.health?.condition)) return false;
  if (e.task === 'rest') return false;
  if (e.travel && !(e.travel.halted || world.minute < e.travel.waitUntil)) return false;
  if (e.travel && (e.travel.drives || e.travel.rides || e.travel.saddle || e.travel.carried)) return false;
  if (e.chore) return false;
  if (e.householdId && Number.isFinite(e.age) && e.age < 10 && (own || role === 'host')) return false;
  if (Number.isFinite(e.age) && e.age < 2) return false;
  if (e.talk || e.aside || e.carriedBy || e.townHelp || one.facing || one.speaking || one.held || one.fallen) return false;
  if (v.townScenes?.poses?.[one.id]) return false;
  if (Object.values(world.encounters || {}).some(m => m.status === 'open' && m.listenerId === one.id)) return false;
  return true;
}
/** The clip the page draws for this person, through the page's own choice (public/motion.js `entityClip`). */
function drawnClip(v, one, role) {
  const own = one.householdId && one.householdId === v.householdId && role !== 'host';
  const observed = !own && role !== 'host';
  return entityClip({ ...one, health: one.health || { condition: one.condition || 'well' } }, observed).id;
}
const standing = clip => /-idle-[nsew]$/.test(clip) && !/^(volunteer|regular|dragoon)-/.test(clip);

test('everybody a page would draw standing idle is drawn at something instead, on every page, across a played class', () => {
  const world = playedClass('ambient-idle', 260);
  let checked = 0, drawnAt = new Set();
  for (let sample = 0; sample < 14; sample++) {
    for (let t = 0; t < 9; t++) stepWorld(world);
    for (const [householdId, role] of pages(world)) {
      const v = view(world, householdId, role);
      for (const one of peopleOf(v)) {
        if (!wouldStandIdle(world, v, one, role)) continue;
        const clip = drawnClip(v, one, role);
        checked++;
        drawnAt.add(clip.replace(/^[a-z]+(-girl|-woman)?-/, ''));
        assert.ok(!standing(clip), `${one.id} (${role} ${householdId || ''}, tick ${world.tick}) is drawn standing idle: ${clip}, amb ${JSON.stringify(one.amb)}`);
      }
    }
  }
  assert.ok(checked > 200, `only ${checked} idle people were sampled; the check saw too little`);
  assert.ok(drawnAt.size >= 6, `the idle are drawn at only ${[...drawnAt].join(', ')}`);
});

test('a town\'s keepers keep company, and one walks to a neighbour\'s door to talk; a family\'s person is never walked', () => {
  const world = settledClass('ambient-visit');
  let visits = 0, familyWalked = 0, pairs = 0;
  for (let t = 0; t < 400; t++) {
    stepWorld(world);
    const { acts } = classAmbient(world);
    for (const [id, amb] of acts) {
      if (amb.with) pairs++;
      if (!amb.at) continue;
      if (world.entities[id].householdId) familyWalked++;
      else {
        visits++;
        const other = world.entities[amb.with];
        assert.ok(Math.hypot(amb.at.x - other.location.x, amb.at.y - other.location.y) < 0.02, `${id} walked to a place not beside ${amb.with}`);
      }
    }
  }
  assert.ok(pairs > 50 && visits > 5, `pairs ${pairs}, visits ${visits}`);
  assert.equal(familyWalked, 0, 'a family\'s own person was walked somewhere by ambient life');
});

test('the same class gives the same activities and the same words: from the seed, the tick and nothing else', () => {
  const a = settledClass('ambient-same'), b = settledClass('ambient-same');
  for (let t = 0; t < 120; t++) {
    stepWorld(a); stepWorld(b);
    if (t % 10) continue;
    for (const [householdId, role] of pages(a)) {
      const va = view(a, householdId, role), vb = view(b, householdId, role);
      assert.deepEqual(va.ambient || null, vb.ambient || null, `tick ${a.tick}: the ${role} page's ambient life differs between two runs`);
      assert.deepEqual(peopleOf(va).map(one => one.amb || null), peopleOf(vb).map(one => one.amb || null));
    }
    // A class saved and loaded is the same class: nothing of this is in the save, and the loaded one works it out the same.
    const loaded = JSON.parse(JSON.stringify(a));
    validateWorld(loaded);
    assert.deepEqual(view(loaded, null, 'host').ambient || null, view(a, null, 'host').ambient || null);
  }
  // Another class's seed is another afternoon: the same keepers, at other things.
  const c = settledClass('ambient-other'), d = settledClass('ambient-same');
  let differ = 0, compared = 0;
  for (let t = 0; t < 60; t++) {
    stepWorld(c); stepWorld(d);
    for (const [id, amb] of classAmbient(d).acts) {
      if (d.entities[id].householdId || !classAmbient(c).acts.has(id)) continue;
      compared++;
      if (classAmbient(c).acts.get(id).a !== amb.a) differ++;
    }
  }
  assert.ok(compared > 300 && differ > compared / 4, `two seeds gave the keepers the same activities ${compared - differ} times in ${compared}`);
});

test('ambient life changes nothing: the world projected every tick is the world never projected', () => {
  const a = settledClass('ambient-pure'), b = settledClass('ambient-pure');
  for (let t = 0; t < 90; t++) {
    stepWorld(a); stepWorld(b);
    const before = JSON.stringify(a);
    for (const [householdId, role] of pages(a)) view(a, householdId, role);
    assert.equal(JSON.stringify(a), before, `projecting at tick ${a.tick} changed the world`);
  }
  assert.equal(JSON.stringify(a), JSON.stringify(b), 'a class projected every tick went differently from one never projected');
});

test('every line is short and plain: eight words, 48 characters, short words, no modern talk', () => {
  const modern = /\b(ok|okay|yeah|yep|nope|cool|awesome|guys|hey|wow|stuff|kinda|gonna|wanna|gotta|kids|dude|totally|literally)\b/i;
  let words = 0, sounds = 0;
  for (const exchange of EXCHANGES) {
    assert.equal(exchange.lines.length, 2, `${exchange.id} is not two lines`);
    for (const text of [...exchange.lines, ...(exchange.hedged || [])]) {
      assert.equal(unreadable(text), null, `"${text}" (${exchange.id}): ${unreadable(text)}`);
      assert.ok(text.split(/\s+/).length <= LINE_WORDS && text.length <= LINE_CHARS);
      assert.doesNotMatch(text, modern, `"${text}" is modern talk`);
      assert.match(text, /^[A-Z¿¡]/, `"${text}" does not begin a sentence`);
      assert.match(text, /[.!?]$/, `"${text}" does not end one`);
      for (const word of text.split(/\s+/)) { words++; sounds += syllables(word); }
    }
    if (exchange.topic) assert.ok(exchange.hedged?.length === 2, `${exchange.id} says news with no hedged words for a rumour`);
  }
  assert.ok(sounds / words <= 1.4, `the lines run ${(sounds / words).toFixed(2)} syllables a word`);
  assert.ok(EXCHANGES.length >= 60, `only ${EXCHANGES.length} exchanges: a class would hear the same few all afternoon`);
  // The bound itself holds a long word to account.
  assert.notEqual(unreadable('The unconstitutional proclamation was published.'), null);
  assert.notEqual(unreadable('One two three four five six seven eight nine.'), null);
});

test('nobody named in the record is ever given a line: every speaker is invented or unnamed, every line reconstructed', () => {
  const world = playedClass('ambient-named', 200);
  const named = new Set([...Object.keys(PEOPLE), ...Object.entries(TOWN_CAST).filter(([, one]) => one.name).map(([id]) => id)]);
  let heard = 0;
  for (let t = 0; t < 240; t++) {
    stepWorld(world);
    for (const [householdId, role] of pages(world)) {
      for (const line of view(world, householdId, role).ambient?.lines || []) {
        heard++;
        assert.equal(line.kind, 'reconstructed');
        assert.equal(line.claimId, 'FIC-GONZ-731');
        assert.ok(!named.has(line.speakerId), `${line.speakerId}, a named person, was given "${line.text}"`);
        const e = world.entities[line.speakerId];
        if (e) {
          assert.ok(e.householdId || e.resident, `${line.speakerId} is neither a family's person nor an invented townsperson`);
          assert.ok(!e.runner && !e.courier && !e.report, `${line.speakerId} carries word and was given a line`);
        } else assert.match(line.speakerId, /^(camp|crowd):/, `${line.speakerId} is nobody drawn`);
        assert.ok(EXCHANGES.some(one => [...one.lines, ...(one.hedged || [])].includes(line.text)), `"${line.text}" is no line of the table`);
      }
    }
  }
  assert.ok(heard > 50, `only ${heard} lines were heard`);
});

/**
 * A town with two families' people standing about in it: the first family's and the second's. San Felipe, which has no dated
 * scenes of its own (Gonzales's, in the first days, are the town's own talk and win).
 */
const TOWN = 'san-felipe';
function townWithFamilies(seed) {
  const world = settledClass(seed);
  const [one, two] = ['hh-1', 'hh-2'].map(id => grownOf(world, world.households[id])[0]);
  const keep = () => { standIn(world, one, TOWN, 0.004, 0.02); standIn(world, two, TOWN, -0.004, 0.02); };
  keep();
  return { world, one, two, keep };
}
/** Every news line of the table and the topic (or family of topics) it speaks of. */
const newsLines = EXCHANGES.filter(one => one.topic).flatMap(one => [...one.lines, ...one.hedged].map(text => [text, one.topic]));
const aboutTopic = (topic, id) => topic.endsWith(':') || topic.endsWith('-') ? id.startsWith(topic) : topic === id;

test('war news is said only to a family that has heard it, only by people who could know it', () => {
  const { world, keep } = townWithFamilies('ambient-news');
  // The Alamo falls, and only the second family hears it; the town has had time to hear it too.
  establishTruth(world, { id: 'alamo-fall', text: 'The Alamo has fallen.', siteId: TOWN, classification: 'DOCUMENTED' });
  learn(world, 'hh-2', 'alamo-fall', { status: 'confirmed' });
  world.minute += 3 * 1440;
  const heard = { 'hh-1': [], 'hh-2': [] };
  for (let t = 0; t < 700; t++) {
    stepWorld(world);
    keep();
    for (const id of ['hh-1', 'hh-2']) for (const line of view(world, id).ambient?.lines || []) heard[id].push(line.text);
  }
  const alamo = newsLines.filter(([, topic]) => topic === 'alamo-fall').map(([text]) => text);
  const unknown = heard['hh-1'].filter(text => newsLines.some(([news, topic]) => news === text && !Object.keys(world.knowledge.households['hh-1']).some(id => aboutTopic(topic, id))));
  assert.deepEqual(unknown, [], `the first family, which never heard it, was told: ${unknown.join(' / ')}`);
  assert.ok(heard['hh-1'].length > 20, `the first family heard only ${heard['hh-1'].length} lines`);
  assert.ok(heard['hh-2'].some(text => alamo.includes(text)), 'the second family heard the Alamo news and nobody in town ever spoke of it');
  // And a family that heard it does not hear its keeper speak of it before word could have walked to him: a keeper far off.
  const here = world.map.sites[TOWN];
  const far = Object.values(world.map.sites).find(site => site.kind === 'town' && Math.hypot(site.x - here.x, site.y - here.y) > 60);
  establishTruth(world, { id: 'san-jacinto', text: 'Houston won.', siteId: TOWN, classification: 'DOCUMENTED' });
  learn(world, 'hh-2', 'san-jacinto', { status: 'confirmed' });
  assert.equal(hearsayOf(world, 'san-jacinto', far), null, 'a storekeeper sixty miles off knew of it the minute it happened');
  const days = Math.hypot(far.x - here.x, far.y - here.y) / WORD_MILES_A_DAY;
  world.minute += Math.ceil(days * 1440 + WORD_FIRST_MINUTES);
  assert.equal(hearsayOf(world, 'san-jacinto', far), 'rumor');
  world.minute += 2 * 1440;
  assert.equal(hearsayOf(world, 'san-jacinto', far), 'confirmed');
  // The Host's public reports are not what a townsperson has heard.
  establishTruth(world, { id: 'declaration', text: 'Texas declared.', siteId: 'washington', classification: 'DOCUMENTED' });
  learn(world, 'public', 'declaration', { status: 'confirmed' });
  assert.equal(hearsayOf(world, 'declaration', world.map.sites.victoria), null, 'the Host\'s public report was taken for what a keeper had heard');
});

test('a rumour is spoken as a rumour: hedged words until every one at the table has it for sure', () => {
  const { world, keep } = townWithFamilies('ambient-rumour');
  establishTruth(world, { id: 'alamo-siege', text: 'Travis is besieged.', siteId: TOWN, classification: 'DOCUMENTED' });
  for (const id of ['hh-1', 'hh-2']) learn(world, id, 'alamo-siege', { status: 'rumor' });
  world.minute += 5 * 1440;
  const siege = EXCHANGES.find(line => line.id === 'siege');
  const said = new Set();
  for (let t = 0; t < 900 && said.size < 1; t++) {
    stepWorld(world);
    keep();
    for (const line of view(world, 'hh-1').ambient?.lines || []) if ([...siege.lines, ...siege.hedged].includes(line.text)) said.add(line.text);
  }
  assert.ok(said.size, 'nobody ever spoke of the siege');
  for (const text of said) assert.ok(siege.hedged.includes(text), `"${text}" was said as sure news to a family that has only a rumour`);
});

test('a page is sent a few exchanges a tick at most, the Host a few a place; none at night, in a fight or a chase', () => {
  const world = playedClass('ambient-pace', 200);
  let nights = 0;
  for (let t = 0; t < 200; t++) {
    stepWorld(world);
    for (const [householdId, role] of pages(world)) {
      const v = view(world, householdId, role);
      const lines = v.ambient?.lines || [];
      assert.ok(lines.length <= 2 * (role === 'host' ? HOST_EXCHANGES : PAGE_EXCHANGES), `${lines.length} lines to the ${role} at tick ${world.tick}`);
      const places = lines.filter(line => line.order === 0).map(line => line.pair);
      assert.equal(new Set(places).size, places.length, 'one pair said two things on one tick');
      const hour = dateOf(world, world.minute).getUTCHours();
      if (hour < 6 || hour >= 21) { nights++; assert.equal(lines.length, 0, `words at ${hour} o'clock at night`); }
    }
  }
  assert.ok(nights > 0, 'no night was sampled');
  // Quiet while the page watches a fight or a chase, or a rider talks with one of the family.
  const { world: quietWorld, keep } = townWithFamilies('ambient-quiet');
  for (let t = 0; t < 30; t++) { stepWorld(quietWorld); keep(); }
  const spoken = { host: 0, student: 0 };
  for (const [extra, roles] of [[{ battle: { sides: [{}] } }, ['host', 'student']], [{ flight: { chase: { phase: 'seen' } } }, ['student']], [{ encounter: { status: 'open' } }, ['student']]]) {
    for (let t = 0; t < 60; t++) {
      stepWorld(quietWorld);
      keep();
      for (const role of roles) {
        const householdId = role === 'host' ? null : 'hh-1';
        const v = view(quietWorld, householdId, role);
        spoken[role] += v.ambient?.lines?.length || 0;
        const again = ambientFor(quietWorld, householdId, role, { ...v, ...extra });
        assert.ok(!again?.lines, `words were sent to the ${role} while the page watched ${Object.keys(extra)[0]}`);
      }
    }
  }
  assert.ok(spoken.host > 0 && spoken.student > 0, `the quiet was never tested against talk: ${JSON.stringify(spoken)}`);
});

test('the family\'s own: the student\'s person stands ready, the busy are at their work, and nothing reads as ordered work', () => {
  const world = settledClass('ambient-own');
  let seen = 0;
  for (let t = 0; t < 300; t++) {
    stepWorld(world);
    for (const householdId of Object.keys(world.households)) {
      for (const one of view(world, householdId).entities.filter(e => e.kind === 'person')) {
        const e = world.entities[one.id];
        if (e.principal) assert.equal(one.amb, undefined, `the student's own ${one.id} was put to ${one.amb?.a}`);
        if (e.chore) assert.equal(one.amb, undefined, `${one.id}, at ${e.chore.id}, was drawn at ${one.amb?.a} on their own page`);
        if (!one.amb) continue;
        seen++;
        assert.notEqual(one.amb.p, 'work', `${one.id} was drawn at the hoe's swing, which reads as work a student orders`);
        if (one.amb.p === 'sow') assert.equal(one.amb.prop, 'hens', `${one.id} was drawn sowing with no hens to feed`);
      }
    }
  }
  assert.ok(seen > 100, `only ${seen} of the families' own were seen at something`);
});

test('a neighbour\'s person at work is left at their work on every page: only the idle are given something to do', () => {
  const { world, two, keep } = townWithFamilies('ambient-private');
  let compared = 0, idle = 0;
  for (let t = 0; t < 120; t++) {
    stepWorld(world);
    keep();
    // The same moment three times over: the neighbour idle, trading, and hunting.
    const at = chore => { const copy = JSON.parse(JSON.stringify(world)); copy.entities[two.id].chore = chore; return ['hh-1', null].map(id => peopleOf(view(copy, id, id ? 'student' : 'host')).find(o => o.id === two.id)); };
    for (const busy of [at({ id: 'visit-shop', doing: 'trading for seed' }), at({ id: 'hunt', doing: 'hunting in the timber' })]) {
      for (const seen of busy) assert.equal(seen.amb, undefined, `${two.id}, at work, was drawn at ${seen.amb?.a} instead`);
    }
    if (at(null).every(seen => seen.amb)) idle++;
    compared++;
  }
  assert.ok(compared > 100 && idle > 100, `idle ${idle} of ${compared}`);
});

test('the camps\' men are at the fire, the cards, a rifle or the drill, and the page and the server count the same men', () => {
  assert.equal(CAMP_MEN, PAGE_CAMP_MEN, 'the server and the page draw different numbers of men in a camp');
  const world = settledClass('ambient-camp');
  const kinds = new Set();
  for (let t = 0; t < 80; t++) {
    stepWorld(world);
    for (const army of [{ id: 'force', side: 'texian', strength: 30 }, { id: 'houston', side: 'texian', strength: 12 }, { id: 'sesma', side: 'mexican', strength: 700 }]) {
      const camp = campAmbient(world, army);
      assert.equal(camp.acts.length, Math.min(CAMP_MEN, army.strength));
      for (const man of camp.acts) {
        kinds.add(man.a);
        if (army.side === 'mexican') assert.equal(man.f, 'regular', 'a Mexican camp was drawn in the colonists\' clothes');
        assert.notEqual(man.f, 'rust', 'a camp man wore the student\'s own coat');
      }
      if (army.side === 'mexican') assert.equal(camp.pairs.length, 0, 'a Mexican camp was given English talk');
    }
    assert.equal(campAmbient(world, { id: 'column', side: 'mexican', strength: 900, moving: true }), null, 'a column on the march was given a camp');
  }
  for (const kind of ['rifle', 'fire', 'cards', 'drill']) assert.ok(kinds.has(kind), `nobody in camp was ever at ${kind}: ${[...kinds].join(', ')}`);
});

test('the crowd at a refuge: a few unnamed people round a fire, seen by the families camped there and the Host only', () => {
  const world = settledClass('ambient-refuge');
  const household = world.households['hh-1'];
  household.flight = { status: 'refuged', refuge: 'liberty' };
  for (const id of household.members) standIn(world, world.entities[id], 'liberty', 0.001, 0.001);
  for (let t = 0; t < 12; t++) stepWorld(world);
  household.flight = { ...household.flight, status: 'refuged', refuge: 'liberty' };
  for (const id of household.members) standIn(world, world.entities[id], 'liberty', 0.001, 0.001);
  const crowd = crowdAt(world, 'liberty');
  assert.ok(crowd.people.length >= 4 && crowd.people.length <= 8, `${crowd.people.length} in the crowd`);
  for (const one of crowd.people) assert.ok(!one.name, 'somebody of the crowd was named');
  assert.ok(view(world, 'hh-1').ambient?.crowds?.some(one => one.siteId === 'liberty'), 'the family camped at Liberty does not see the crowd there');
  assert.ok(!view(world, 'hh-2').ambient?.crowds?.length, 'a family at home was sent the crowd at Liberty');
  assert.ok(view(world, null, 'host').ambient?.crowds?.some(one => one.siteId === 'liberty'), 'the Host does not see the crowd');
});

test('every activity is drawn in a pose the cast holds, and a child\'s in a pose the children\'s sheets hold', () => {
  const cast = ['work', 'carry', 'sow', 'repair', 'care', 'search', 'trade', 'rest', 'speak'];
  for (const [id, activity] of Object.entries(ACTIVITIES)) {
    if (activity.who === 'child') assert.ok(CHILD_POSES.girl.includes(activity.pose) && CHILD_POSES.boy.includes(activity.pose), `${id} is drawn in ${activity.pose}, which no child's sheet holds`);
    else assert.ok(cast.includes(activity.pose), `${id} is drawn in ${activity.pose}, which the cast does not hold`);
  }
});
