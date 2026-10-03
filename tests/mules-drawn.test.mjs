// The family's mule as the page draws it (owner, 2026-10-03, "buy a mule in town"; docs/ART_REQUESTS.md, request 2026-10-03 -
// riders in every vehicle). tests/mules.test.mjs holds what the mule does; this holds that the page reads it as a mule: drawn as
// Claude's mule on its halter or saddled under a rider, never as an ox (a class saved before there were horses taught the page that
// every animal not a horse is an ox); somebody on it in the saddle, with the mule drawn under them and not again beside them; the
// ox alone yoked to a wagon; and the mule's clips on disk, every one a Claude stand-in that names the request.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { carriedWithRider, entityClip, inTheSaddle, mountOf, seatOf, underARider, wagonTeams } from '../public/motion.js';

const claude = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/claude-standins/atlas.json', import.meta.url)), 'utf8'));
const road = { points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], progress: 0.5, distance: 1 };
const rider = { id: 'hh-1-rosa', kind: 'person', householdId: 'hh-1', band: 'adult', travel: { ...road, mode: 'mule' } };
const mule = { id: 'hh-1-mule', kind: 'animal', species: 'mule', householdId: 'hh-1', borrowedBy: 'hh-1-rosa', travel: { ...road, mode: 'mule' } };
const horse = { id: 'hh-1-horse', kind: 'animal', species: 'horse', householdId: 'hh-1', borrowedBy: null, travel: null };

test('a mule is drawn as Claude\'s mule - standing, led on its halter, saddled under a rider - and never as an ox', () => {
  assert.equal(entityClip({ ...mule, travel: null }).id, 'mule-idle');
  assert.equal(entityClip({ ...mule, travel: { ...road, mode: 'foot' } }).id.replace(/-[nse]$/, ''), 'mule-walk', 'a led mule is not drawn on its halter');
  assert.match(entityClip(mule).id, /^mule-saddled-walk/, 'a ridden mule is not drawn saddled');
  for (const one of [{ ...mule, travel: null }, mule]) assert.doesNotMatch(entityClip(one).id, /^ox/, 'the mule was drawn as an ox');
  for (const clip of ['mule-idle', 'mule-walk', 'mule-walk-e', 'mule-walk-s', 'mule-walk-n', 'mule-saddled-walk', 'mule-saddled-walk-e', 'mule-saddled-walk-s', 'mule-saddled-walk-n']) {
    assert.ok(claude.clips[clip], `${clip} is not on disk`);
    assert.equal(claude.clips[clip].madeBy, 'claude');
  }
  assert.equal(claude.sheets['claude-family-mule'].request, 'Request 2026-10-03 — riders in every vehicle');
  // The page's own drawing asks for the same clips (public/app.js `miniAnimal`) and says so with a stand-in mark.
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  assert.match(app, /if \(entity\.species === 'mule'\) \{/);
  assert.match(app, /stand-in: docs\/ART_REQUESTS\.md, request 2026-10-03 - riders in every vehicle \(the mule itself, item 1\)/);
});

test('somebody on the mule sits in its saddle, the mule under them and not drawn again beside them', () => {
  const entities = [rider, mule, horse];
  assert.equal(inTheSaddle(rider), true);
  assert.equal(seatOf(rider, entities), 'horse', 'the rider on the mule was drawn walking');
  assert.equal(mountOf(rider, entities), mule, 'the mount under the rider is not the mule they took');
  assert.equal(underARider(mule), true);
  assert.equal(carriedWithRider(mule, entities), true, 'the ridden mule is drawn a second time beside its rider');
  assert.equal(carriedWithRider(horse, entities), false);
  // Seated on it for the family's journey together (sim/company.mjs `saddle`): the same.
  const seated = { ...rider, travel: { ...road, mode: 'wagon', saddle: true, rides: mule.id } };
  const walked = { ...mule, borrowedBy: null, travel: { ...road, mode: 'wagon' } };
  assert.equal(mountOf(seated, [seated, walked, horse]), walked);
  assert.equal(carriedWithRider(walked, [seated, walked]), true);
  // A mule walking home on its halter beside a rider on the horse is no rider's mount.
  const led = { ...mule, travel: { ...road, mode: 'foot' } };
  const onHorse = { ...rider, travel: { ...road, mode: 'horse' } };
  assert.equal(underARider(led), false);
  assert.equal(mountOf(onHorse, [onHorse, led, { ...horse, borrowedBy: rider.id, travel: { ...road, mode: 'horse' } }]).species, 'horse');
});

test('the ox alone is yoked to a wagon: a mule on the wagon\'s road is not taken for its ox', () => {
  const wagon = { id: 'hh-1-wagon', kind: 'wagon', householdId: 'hh-1', borrowedBy: 'hh-1-thomas', travel: { ...road, mode: 'wagon' } };
  const driver = { id: 'hh-1-thomas', kind: 'person', householdId: 'hh-1', principal: true, band: 'adult', travel: { ...road, mode: 'wagon' } };
  const walking = { ...mule, borrowedBy: 'hh-1-thomas', travel: { ...road, mode: 'wagon' } };
  assert.equal(wagonTeams('hh-1', [wagon, driver, walking])[0].ox, null, 'the mule was yoked to the wagon');
  const ox = { id: 'hh-1-animal', kind: 'animal', species: 'ox', householdId: 'hh-1', borrowedBy: 'hh-1-thomas', travel: { ...road, mode: 'wagon' } };
  assert.equal(wagonTeams('hh-1', [wagon, driver, walking, ox])[0].ox, ox);
});
