// The rest of "what a family knows decides what it can do": the upriver call, and how the
// fight ended.
//
// The upriver call used to open on the clock with "are crossing the river tonight" for
// anybody in Gonzales until dawn - false for everybody who reached town after the crossing.
// The crossing is now news (`HIST-GONZ-003`) that a family learns by being in town, and the
// call says what they were told and when.
//
// And the outcome of the fight was the last report still delivered the old way, by a
// courier posting it through the door. It is now carried by riders who come down from the
// camp and say it to somebody, on the same terms as the cannon news (`FIC-GONZ-013`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { CAMP_SITE, CROSSING, TIMELINE } from '../sim/directors.mjs';
import { CONVERSATIONS, carriedInPerson } from '../sim/encounters.mjs';
import { learn } from '../sim/knowledge.mjs';

const OUTCOME = 'gonzales-outcome';
/** hh-1 has agreed to carry the food, and its principal is standing at home. */
function agreed(seed) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  while (!world.truth['cannon-request']) stepWorld(world);
  learn(world, 'hh-1', 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  stepWorld(world);
  const entity = world.entities[world.households['hh-1'].principalId];
  applyAction(world, 'hh-1', { action: 'help', entityId: entity.id });
  return { world, entity };
}
const inTown = (world, entity) => {
  entity.travel = null;
  entity.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
};

test('the upriver call is asked because the family was told of the crossing, and it says when', () => {
  // In town when the force goes over: told on the spot, and asked in the present tense.
  const early = agreed('crossing-early');
  inTown(early.world, early.entity);
  while (early.world.minute < TIMELINE.crossing) stepWorld(early.world);
  const heard = early.world.knowledge.households['hh-1'][CROSSING];
  assert.ok(heard, 'standing in Gonzales at the crossing, the family was not told of it');
  assert.equal(heard.source, 'Told in Gonzales');
  assert.equal(heard.receivedMinute, early.world.truth[CROSSING].minute);
  assert.match(early.world.marches['hh-1'].text, /are crossing the river tonight/);
  assert.ok(early.world.events.find(e => e.id === early.world.marches['hh-1'].id).causes.includes(heard.eventId), 'the call does not point at what the family was told');

  // Kept at home until five hours after, then in town: told by whoever is left, and asked to follow.
  const late = agreed('crossing-late');
  late.entity.travel = null;
  late.entity.location = { ...late.world.map.sites[late.world.households['hh-1'].homeSiteId], siteId: late.world.households['hh-1'].homeSiteId };
  while (late.world.minute < TIMELINE.crossing + 300) stepWorld(late.world);
  assert.equal(late.world.marches['hh-1'], undefined, 'a family nobody told was asked anyway');
  inTown(late.world, late.entity);
  stepWorld(late.world);
  const march = late.world.marches['hh-1'];
  assert.ok(march, 'reaching town while the force was still upriver, the family was never asked');
  assert.doesNotMatch(march.text, /are crossing the river tonight/, 'somebody arriving hours later was told it was happening now');
  assert.match(march.text, /crossed the river \d+ hours ago/);
  assert.match(march.text, /follow them/);
  validateWorld(late.world);
});

/** A class nobody plays, run to the end of the slice. */
function wholeSlice(seed, players = 15) {
  const world = createGonzalesWorld(seed, players);
  world.status = 'running';
  while (world.status === 'running') stepWorld(world);
  return world;
}

test('how the fight ended is said to each family by a rider who came down from the camp', () => {
  assert.equal(carriedInPerson(OUTCOME), true);
  const world = wholeSlice('outcome-riders');
  const heard = Object.keys(world.households).map(id => world.knowledge.households[id][OUTCOME]);
  assert.ok(heard.every(Boolean), 'a family never heard how it ended before the slice closed');
  assert.ok(heard.every(report => !/^Courier /.test(report.source)), 'the outcome was still posted through a door');
  assert.equal(world.events.filter(event => event.type === 'report-delivered').length, 0);
  const met = Object.values(world.encounters).filter(encounter => encounter.topicId === OUTCOME);
  assert.equal(met.length, 15, 'every family met somebody carrying it');
  assert.ok(met.every(encounter => encounter.originSiteId === CAMP_SITE), 'the word started somewhere other than where the fight was');
  const hands = heard.map(report => report.hands ?? 0);
  assert.ok(Math.max(...hands) > Math.min(...hands), 'a far family’s account came through no more hands than a near one’s');
  validateWorld(world);
});

test('word is never handed on to somebody with the same name as a rider who already carried it', () => {
  for (const seed of ['gonzales', 'outcome-riders']) {
    const world = wholeSlice(seed);
    for (const encounter of Object.values(world.encounters)) {
      const names = [...encounter.provenance.map(hop => hop.name), encounter.carrierName];
      assert.equal(new Set(names).size, names.length, `${encounter.id} came through ${names.join(' -> ')}`);
    }
  }
});

test('what a rider says about the fight stays inside what HISTORY.md allows', () => {
  const script = CONVERSATIONS[OUTCOME];
  const accounts = [
    { origin: "Ezekiel Williams's land", departedAgo: 'an hour', observedAgo: 'an hour', firsthand: true, hands: 0 },
    { origin: "Ezekiel Williams's land", departedAgo: 'an hour', observedAgo: '3 hours', firsthand: false, hands: 1, toldBy: 'Abner Teel', toldAt: 'Gonzales', tellerSaw: true },
    { origin: "Ezekiel Williams's land", departedAgo: 'an hour', observedAgo: '5 hours', firsthand: false, hands: 3, toldBy: 'Willa Hines', toldAt: 'the fork of the road', tellerSaw: false },
  ];
  for (const account of accounts) {
    const opening = script.opening(account);
    assert.match(opening, /Béxar/); assert.match(opening, /cannon did not go with them/);
    for (const text of [opening, ...script.lines.map(line => line.answer(account))]) {
      // No counts of men, of the dead, or of shots - only how long ago, and how many hands.
      assert.doesNotMatch(text.replace(/through \d+ hands|\d+ (hours|days)/g, ''), /\d/, text);
      // No rout, no casualty claimed either way, no wound, no slogan, no parley.
      assert.doesNotMatch(text, /\brout|\bran away|\bfled\b|nobody was killed|were killed|\bdead\b|wounded|come and take/i, text);
    }
    if (!account.firsthand) {
      assert.match(opening, /did not see any of this myself/);
      assert.doesNotMatch(script.lines.find(line => line.id === 'saw-it').answer(account), /^I was/, 'a rider who was told claims to have been there');
    }
  }
  assert.equal(new Set(script.lines.map(line => line.id)).size, script.lines.length);
});
