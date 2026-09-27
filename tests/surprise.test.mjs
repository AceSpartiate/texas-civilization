// The surprise at Béxar (owner, 2026-09-26; docs/battle-research/surprise-at-bexar.md, sim/surprise.mjs).
//
// "news appropriate to that, but not that he's marching. players should be shocked and scared when he's spotted, close to
// Bexar and texas is unprepared." And the true story of the snow march "At the ending"; and the Yucatán correction, "Fix now".
//
// Four things are held here, each proved by an injection that fails it alone (scripts/surprise-injections.mjs):
//   - before February 23 no family knows or is told that Santa Anna is marching or has crossed the Rio Grande - except Blas
//     Herrera's warning, heard only by a family with somebody in Béxar, and told as a report the officers did not believe;
//   - on February 23 a family with somebody in or near Béxar is told through that person, with the card, on the day; every
//     other family hears it only when a rider brings it - Gonzales's first, the other settlements' after;
//   - the ending's reveal tells the snow march and why Béxar was caught unprepared, and names no virtue;
//   - `HIST-TEX-053` and `-068` are corrected, the snow's rows registered, and no game text puts the Yucatán dead in the snow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { dateOf, momentOf } from '../sim/directors.mjs';
import { hostEnding, familyEnding } from '../sim/ending.mjs';
import { NEAR_BEXAR_MILES, REVEAL } from '../sim/surprise.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
const day = (world, minute) => dateOf(world, minute).toISOString().slice(0, 10);

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('surprise-class', 8, { map: 'colonies' });
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
const settlement = household => household.settlementId || 'gonzales';
const homeOf = (world, household) => world.map.sites[household.homeSiteId];
/** Keep a family's people at home and out of every service, so it has nobody in or near Béxar. */
const keepHome = (world, household) => {
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || person.kind !== 'person') continue;
    const site = homeOf(world, household);
    Object.assign(person, { service: null, chore: null, travel: null, task: 'rest', location: { x: site.x, y: site.y, siteId: household.homeSiteId } });
  }
};
/** Somebody in the garrison at Béxar, for a family a student plays. */
const garrison = (world, person) => {
  const site = world.map.sites.bexar;
  Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' } });
  person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' };
  world.households[person.householdId].played = true;
};
/**
 * The class's three families for these tests: one with a man in the garrison, one of Gonzales and one of another settlement
 * kept at home, run to `key` with the two kept at home each tick (the neighbours' director may otherwise send them).
 */
function cast(world) {
  const households = Object.values(world.households);
  const gonzales = households.find(household => settlement(household) === 'gonzales');
  const far = households.find(household => settlement(household) !== 'gonzales');
  const inside = households.find(household => household !== gonzales && household !== far && household.members.some(id => grownMan(world.entities[id])));
  const man = inside.members.map(id => world.entities[id]).find(grownMan);
  garrison(world, man);
  for (const household of [gonzales, far]) { household.played = true; keepHome(world, household); }
  return { inside, man, gonzales, far };
}
/** Run to a moment, keeping the families at home each tick, and `hold` whatever else the test pins in place. */
const runTo = (world, homes, key, hold = () => {}) => until(world, () => { for (const household of homes) keepHome(world, household); hold(); return world.director.milestones[key]; });
/** Says, in any words, that something is on the march, coming, or over the river... */
const MOVING = /\b(?:is|are|was|were) marching\b|\bmarching on\b|\bhas crossed\b|\bhave crossed\b|\bcrossed the Rio Grande\b|\bover the Rio Grande\b|\bon the march\b|\b(?:is|are) coming\b|\bon (?:his|its|their) way\b/i;
/** ...in a sentence about Santa Anna or the Mexican army. */
const THEM = /Santa Anna|Mexican (?:army|soldiers|troops|cavalry)|the enemy|a great army/i;
const MARCHING = { test: text => (text || '').split(/(?<=[.!?])\s+/).some(sentence => THEM.test(sentence) && MOVING.test(sentence)) };
const DISBELIEVED = /do not believe/i;
const saysMarching = (text, why) => assert.ok(!MARCHING.test(text), why);

test('before February 23 nobody hears that Santa Anna is marching; Herrera\'s warning is heard only in Béxar, disbelieved', () => {
  const world = winter();
  const { inside, man, gonzales, far } = cast(world);
  runTo(world, [gonzales, far], 'herrera');
  // The warning: the family with a man in Béxar, as the officers took it; not the families at home, not the public.
  const heard = world.knowledge.households[inside.id]['herrera-report'];
  assert.ok(heard, 'the family with a man in Béxar did not hear Herrera\'s warning');
  assert.match(heard.text, DISBELIEVED, 'the warning was not told as disbelieved');
  assert.equal(heard.status, 'rumor');
  assert.match(heard.source, new RegExp(man.name));
  for (const household of [gonzales, far]) assert.equal(world.knowledge.households[household.id]['herrera-report'], undefined, `${household.id}, with nobody in Béxar, heard Herrera`);
  assert.equal(world.knowledge.public['herrera-report'], undefined, 'Herrera\'s warning is the public\'s, and every tavern repeats it');
  // The way out, said to the garrison's family with the warning, still open.
  assert.ok(world.events.some(event => event.actorId === man.id && event.householdId === inside.id && /can still be sent for/.test(event.text)), 'the garrison\'s family was not told the way out');
  runTo(world, [gonzales, far], 'spring-grass');
  // The last moment before the bell: what was known and said then, kept before each tick until the tick that rings it.
  let before = null;
  runTo(world, [gonzales, far], 'alamo-siege', () => { if (!world.director.milestones['alamo-siege'] && world.minute >= momentOf(world, 'alamo-siege') - 2 * 1440) before = { knowledge: structuredClone(world.knowledge), events: world.events.length, minute: world.minute }; });
  assert.ok(before && before.minute < momentOf(world, 'alamo-siege') && before.minute >= momentOf(world, 'spring-grass'));
  // What every family knows the night before, and everything its journal says: nothing of a march.
  const said = world.events.slice(0, before.events);
  for (const household of Object.values(world.households)) {
    for (const [topicId, report] of Object.entries(before.knowledge.households[household.id] || {})) {
      if (topicId === 'herrera-report') { assert.match(report.text, DISBELIEVED); continue; }
      saysMarching(report.text, `${household.id} knows "${report.text}"`);
    }
    for (const event of said) {
      if (event.householdId !== household.id || event.visibility === 'sealed' || event.topicId === 'herrera-report' || event.minute < momentOf(world, 'winter-opens')) continue;
      saysMarching(event.text, `${household.id} was told "${event.text}"`);
    }
  }
  for (const report of Object.values(before.knowledge.public)) saysMarching(report.text, `the public knows "${report.text}"`);
  // And what they did hear is what Béxar believed: no army before the grass.
  for (const household of [gonzales, far]) assert.match(before.knowledge.households[household.id]['winter-grass']?.text || '', /grass/, `${household.id} never heard what Béxar believed`);
});

test('on February 23 a family with somebody in or near Béxar hears the bell through them; everybody else only when a rider comes', () => {
  const world = winter();
  const { inside, man, gonzales, far } = cast(world);
  // Somebody of a third family on the road two miles out of Béxar when the bell rings: near enough to hear it.
  const nearFamily = Object.values(world.households).find(household => ![inside, gonzales, far].includes(household) && household.members.some(id => grownMan(world.entities[id])));
  const walker = nearFamily.members.map(id => world.entities[id]).find(grownMan);
  const siege = momentOf(world, 'alamo-siege');
  const bexar = world.map.sites.bexar;
  nearFamily.played = true;
  assert.ok(2 <= NEAR_BEXAR_MILES);
  const twoMilesOut = () => { if (!world.director.milestones['alamo-siege']) Object.assign(walker, { service: null, chore: null, travel: null, task: 'rest', location: { x: bexar.x + 2, y: bexar.y, siteId: null } }); };
  runTo(world, [gonzales, far], 'alamo-siege', twoMilesOut);
  // Through the person, on the day: in what the family knows, and in its journal.
  for (const [household, person] of [[inside, man], [nearFamily, walker]]) {
    const report = world.knowledge.households[household.id]['bexar-arrival'];
    assert.ok(report, `${household.id}, with ${person.name} at Béxar, was not told`);
    assert.equal(day(world, report.receivedMinute), '1836-02-23');
    assert.match(report.source, new RegExp(person.name));
    assert.match(report.text, /bell/);
  }
  // The card at the person's side, with Watch, while the army comes in.
  until(world, () => view(world, inside.id).battleAlert?.id?.includes(':siege:'), 40);
  for (const [household, person] of [[inside, man], [nearFamily, walker]]) {
    const alert = view(world, household.id).battleAlert;
    assert.ok(alert, `${household.id} had no card when the bell rang`);
    assert.equal(alert.entityId, person.id, 'the card did not come through the family\'s own person');
    assert.match(alert.text, /side/);
    assert.match(alert.text, /bell/);
  }
  // The Host's camera on it.
  assert.equal(host(world).live.spotlight?.key, 'alamo-siege', 'the Host was not shown the bell');
  assert.match(host(world).live.spotlight.text, /bell/);
  // Nobody else: not the family of Gonzales, not the far one - no card, no word, no battle, nothing in the journal.
  for (const household of [gonzales, far]) {
    const seen = view(world, household.id);
    assert.equal(world.knowledge.households[household.id]['bexar-arrival'], undefined, `${household.id} heard it on the day`);
    assert.ok(!seen.battleAlert && !seen.battle, `${household.id} was sent the arrival`);
    assert.ok(!seen.events.some(event => event.minute >= siege && /Béxar|Alamo|bell/.test(event.text)), `${household.id}'s journal has it on the day`);
  }
  assert.equal(world.knowledge.public['bexar-arrival'], undefined, 'the public had it on the day');
  // Gonzales when Travis's letter to Ponton comes in; the other settlements not until the riders carry it on.
  runTo(world, [gonzales, far], 'arrival-gonzales');
  const first = world.knowledge.households[gonzales.id]['bexar-arrival'];
  assert.ok(first, 'Gonzales never heard');
  assert.equal(first.receivedMinute, world.minute);
  assert.equal(day(world, first.receivedMinute), '1836-02-24');
  assert.match(first.text, /enemy in large force is in sight/);
  assert.equal(world.knowledge.households[far.id]['bexar-arrival'], undefined, 'the far family heard with Gonzales');
  runTo(world, [gonzales, far], 'travis-colonies');
  const later = world.knowledge.households[far.id]['bexar-arrival'];
  assert.ok(later, 'the far family never heard');
  assert.equal(later.receivedMinute, momentOf(world, 'travis-colonies'));
  assert.ok(later.receivedMinute > first.receivedMinute);
});

test('the ending reveals the snow march and why Béxar was caught unprepared, once the class has lived February 23', () => {
  const virtue = /\b(good|better|best|brave\w*|loyal\w*|patriot\w*|hero\w*|virtu\w*|honou?r\w*|worthy|courag\w*|coward\w*|deserv\w*|right|wrong)\b/i;
  const early = winter();
  early.status = 'ended';
  assert.equal(hostEnding(early).reveal, undefined, 'the reveal came before the class reached February 23');
  const world = winter();
  const { inside } = cast(world);
  untilMoment(world, 'alamo-siege');
  assert.equal(hostEnding(world).reveal, undefined, 'the reveal came while the class runs');
  assert.equal('ending' in host(world), false);
  world.status = 'ended';
  for (const reveal of [hostEnding(world).reveal, familyEnding(world, inside.id).reveal, host(world).ending.host.reveal, view(world, inside.id).ending.family.reveal]) {
    assert.ok(reveal, 'no reveal at the ending');
    const text = [reveal.title, ...reveal.paragraphs, reveal.ask].join(' ');
    // The snow, from the officers who were there: the date, the place, the depth, the cost, and Santa Anna ahead of it.
    for (const said of [/snow/, /February 13/, /Coahuila/, /sixteen inches/, /mules/, /oxen/, /Guerrero/, /Filisola/]) assert.match(text, said);
    // What the Texians believed, and why they were caught unprepared.
    for (const said of [/grass/, /Herrera/, /did not believe/, /bell/, /Sutherland/]) assert.match(text, said);
    // The Yucatán dead where they died.
    assert.match(text, /Urrea/); assert.match(text, /February 25/);
    for (const line of [reveal.title, ...reveal.paragraphs, reveal.ask]) assert.doesNotMatch(line, virtue, line);
  }
  for (const value of Object.values(REVEAL)) assert.doesNotMatch(value, virtue, value);
});

test('the Yucatán dead are Urrea\'s, in the norther of February 25: the rows corrected and no game text puts them in the snow', () => {
  const history = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');
  const row = id => history.split(/\r?\n/).find(line => line.startsWith(`| **${id}** |`)) || '';
  assert.doesNotMatch(row('HIST-TEX-053'), /snow had fallen on them by February 13/, '053 still has the snow by the 13th');
  assert.doesNotMatch(row('HIST-TEX-053'), /recruits from the tropics died of exposure in it(?!: \*\*they did not)/);
  for (const id of ['HIST-TEX-053', 'HIST-TEX-068', 'HIST-TEX-603']) {
    assert.match(row(id), /Urrea/, `${id} does not name Urrea's column`);
    assert.match(row(id), /February 25/, `${id} does not date the norther`);
  }
  assert.doesNotMatch(row('HIST-TEX-068'), /"Some of Santa Anna's troops, recruited from the Yucatán, died of hypothermia"; for the refugees/, '068 still quotes the Yucatán sentence uncorrected');
  for (const id of ['HIST-TEX-600', 'HIST-TEX-601', 'HIST-TEX-602', 'HIST-TEX-603', 'HIST-TEX-604']) assert.ok(row(id), `${id} is not registered`);
  // Every sentence the game can put on a screen: none has the Yucatán dead and the snow in it together.
  for (const folder of ['sim', 'sim/battles', 'public']) {
    for (const file of readdirSync(new URL(`../${folder}/`, import.meta.url)).filter(name => /\.m?js$/.test(name))) {
      // What can reach a screen is the code's strings, not its notes: a note that names both to keep them apart passes.
      const source = readFileSync(new URL(`../${folder}/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
      const strings = source.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
      for (const sentence of strings.flatMap(text => text.split(/(?<=[.!?])\s+/))) assert.ok(!(/Yucat[aá]n/i.test(sentence) && /snow/i.test(sentence)), `${folder}/${file}: "${sentence.slice(0, 160)}"`);
    }
  }
});
