// Who a family is, as well as where it starts (owner, 2026-09-29: "build all of these as possible starts except for the native
// american options ... ensure that skin tone options based on the race of the characters is locked to what is realistic"; and, of
// the Black family's start, "Free Black family"). sim/starts.mjs, sim/tejano.mjs, sim/start-story.mjs; docs/FAMILY_CREATION.md,
// *The family's start*.
//
// Every test here was proved by injecting the regression it guards (scripts/starts-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { dealCounts } from '../sim/colonies-map.mjs';
import { EARLY, FREE_BLACK_FROM, POOLS, SKIN_RANGES, STARTS_SEATED, TEJANO_PLACES, dealStarts, skinChoices, startCounts } from '../sim/starts.mjs';
import { SKIN } from '../sim/look-vocabulary.mjs';
import { familyRoll } from '../sim/family.mjs';
import { appearanceOf, setAppearance } from '../sim/appearance.mjs';
import { dealNeighbours, rollSpouse } from '../sim/courtship.mjs';
import { choresFor } from '../sim/chores.mjs';
import { familyEnding } from '../sim/ending.mjs';
import { ambientFor } from '../sim/ambient.mjs';
import { FREE_BLACK_WORD, ROAD_WORDS, advanceStarts, minuteOn, roadGroups } from '../sim/start-story.mjs';
import { heardOut } from './support/heard-out.mjs';
import { feed } from './support/fed.mjs';

const colonies = (seed, n, starts = true) => createGonzalesWorld(seed, n, { map: 'colonies', starts });
const people = (world, household) => household.members.map(id => world.entities[id]);
const parents = (world, household) => people(world, household).filter(one => ['father', 'mother'].includes(one.kin?.role));
const children = (world, household) => people(world, household).filter(one => ['son', 'daughter'].includes(one.kin?.role));
const of = (world, heritage) => Object.values(world.households).filter(household => household.heritage === heritage);
const range = heritage => skinChoices(heritage);
const until = (world, done, limit = 12000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); return done(); };

test('a class that deals starts seats Victoria, whose families are Tejano; one of Liberty\'s is free Black from ten families; the first of each is among the first six to join', () => {
  for (const [seed, n] of [['deal-a', 5], ['deal-b', 9], ['deal-c', 10], ['deal-d', 15], ['deal-e', 22], ['deal-f', 30]]) {
    const world = colonies(seed, n);
    assert.equal(world.starts, 1);
    const counts = {};
    for (const household of Object.values(world.households)) counts[household.settlementId] = (counts[household.settlementId] || 0) + 1;
    // From twenty, one of them near Béxar (owner, 2026-09-29: "Béxar at 20+"; tests/starts-bexar.test.mjs).
    assert.deepEqual(counts, Object.fromEntries(Object.entries(startCounts(n, dealCounts)).filter(([, k]) => k)), `${n}: the counts, Victoria seated`);
    assert.ok(counts.victoria >= 1, `${n}: Victoria has a family`);
    for (const household of Object.values(world.households)) {
      assert.equal(household.heritage === 'tejano', TEJANO_PLACES.includes(household.settlementId), `${n}: ${household.id} at ${household.settlementId} is ${household.heritage}`);
      if (household.heritage === 'free-black') assert.equal(household.settlementId, 'liberty');
    }
    const free = of(world, 'free-black');
    assert.equal(free.length, n >= FREE_BLACK_FROM ? 1 : 0, `${n}: free Black families`);
    const order = id => Number(id.slice(3)) - 1;
    assert.ok(Math.min(...of(world, 'tejano').map(household => order(household.id))) < EARLY, `${n}: a Tejano family among the first ${EARLY}`);
    for (const household of free) assert.ok(order(household.id) < EARLY, `${n}: the free Black family among the first ${EARLY}`);
  }
});

test('moving a start early exchanges only two families on the same side of the burn zone, and keeps every family\'s land', () => {
  // Forty layouts, so the seeded choice among the early families meets both sides many times over.
  for (let k = 0; k < 40; k++) {
    const places = Array.from({ length: 12 }, (_, i) => ({ x: i + k * 100, y: i * 2, settlementId: i === 9 ? 'victoria' : i === 10 || i === 11 ? 'liberty' : 'san-felipe' }));
    const side = place => place.x % 3 === 0;
    const before = structuredClone(places);
    const starts = dealStarts(places, { sideOf: side });
    assert.deepEqual([...places].sort((a, b) => a.x - b.x), before, 'the same land, only reordered');
    places.forEach((place, i) => assert.equal(side(place), side(before[i]), `layout ${k}: family ${i + 1} keeps its side of the zone`));
    assert.ok(starts.indexOf('tejano') < EARLY && starts.indexOf('free-black') < EARLY);
    assert.equal(places[starts.indexOf('tejano')].settlementId, 'victoria');
    assert.equal(places[starts.indexOf('free-black')].settlementId, 'liberty');
  }
});

// The names of such a class were the mixed pools (`NAME_POOLS`) until the owner's word of 2026-10-01 ("the default names should be
// appropriate for the race being played"): now the names of the family's place, Tejano at Victoria, Anglo-American elsewhere
// (sim/starts.mjs `namingOf`; every way a name is dealt is held by tests/names-by-start.test.mjs).
test('a class made without starts deals none and offers every tone, as before; its names are of each family\'s place', () => {
  const world = colonies('old-way', 25, false);
  assert.equal(world.starts, undefined);
  for (const household of Object.values(world.households)) {
    assert.equal(household.heritage, undefined);
    rollFamily(world, household);
    for (const person of parents(world, household)) assert.deepEqual(projectFamily(world, household.id).people.find(one => one.id === person.id).choices.skin, SKIN);
    const pools = household.settlementId === 'victoria' ? POOLS.tejano : POOLS.anglo;
    for (const person of people(world, household)) assert.ok(pools[person.kin.role].includes(person.name), `${household.settlementId}: ${person.name}`);
  }
  assert.equal(projectFamily(world, 'hh-1').start, undefined);
  assert.equal(Object.values(world.households).filter(household => household.settlementId === 'victoria').length, dealCounts(25).victoria);
  // Twenty-five families, so one of them is at Victoria and named as its place's people are (a class of twelve with no starts has none there).
  assert.ok(Object.values(world.households).some(household => household.settlementId === 'victoria'), 'no family at Victoria to be named Tejano');
});

test('each start\'s parents are offered only its skin tones, dealt within them, refused outside them, and a tone outside them does not open', () => {
  assert.deepEqual(range('anglo'), ['fair', 'light', 'warm light', 'olive', 'tan']);
  assert.deepEqual(range('tejano'), ['light', 'warm light', 'olive', 'tan', 'copper', 'brown']);
  assert.deepEqual(range('free-black'), ['olive', 'tan', 'copper', 'brown', 'dark brown', 'deep brown']);
  for (const seed of ['tones-a', 'tones-b', 'tones-c']) {
    const world = colonies(seed, 12);
    for (const household of Object.values(world.households)) {
      rollFamily(world, household);
      const book = projectFamily(world, household.id);
      for (const person of parents(world, household)) {
        const row = book.people.find(one => one.id === person.id);
        assert.deepEqual(row.choices.skin, range(household.heritage), `${household.heritage} offers its own range`);
        assert.ok(range(household.heritage).includes(row.appearance.skin), `${household.heritage}: dealt ${row.appearance.skin}`);
      }
    }
    for (const household of Object.values(world.households)) {
      const parent = parents(world, household)[0];
      const outside = SKIN.find(tone => !range(household.heritage).includes(tone));
      assert.throws(() => setAppearance(world, household, { entityId: parent.id, skin: outside, hair: 'black', clothing: 'rust', head: parent.sex === 'female' ? 'bonnet' : 'hat' }), /not one of the choices for skin/);
    }
    const free = of(world, 'free-black')[0];
    const mother = parents(world, free)[0];
    mother.appearance = { skin: 'fair', hair: 'black', clothing: 'rust', head: mother.sex === 'female' ? 'bonnet' : 'hat' };
    assert.throws(() => validateWorld(world), /Invalid appearance/);
  }
});

test('children take a tone between their parents, so inside the start\'s range', () => {
  for (const seed of ['kids-a', 'kids-b']) {
    const world = colonies(seed, 12);
    for (const household of Object.values(world.households)) {
      rollFamily(world, household);
      const tones = parents(world, household).map(parent => SKIN.indexOf(appearanceOf(world, parent).skin));
      for (const child of children(world, household)) {
        const tone = SKIN.indexOf(appearanceOf(world, child).skin);
        assert.ok(tone >= Math.min(...tones) && tone <= Math.max(...tones), `${child.id} between the parents`);
        assert.ok(range(household.heritage).includes(SKIN[tone]), `${household.heritage}: ${child.id} is ${SKIN[tone]}`);
      }
    }
  }
});

test('names are dealt from the start\'s own pools, and a Tejano family plants corn', () => {
  const world = colonies('names-a', 30);
  for (const household of Object.values(world.households)) {
    const pools = household.heritage === 'tejano' ? POOLS.tejano : POOLS.anglo;
    for (const person of people(world, household)) assert.ok(pools[person.kin.role].includes(person.name), `${household.heritage}: ${person.name}`);
    rollFamily(world, household);
    for (const person of people(world, household)) assert.ok(pools[person.kin.role].includes(person.name), `${household.heritage}: rolled ${person.name}`);
    if (household.heritage === 'tejano') assert.equal(household.field.crop, 'corn');
  }
});

test('a lone parent\'s new husband or wife is of the family\'s start: tone, name and the family they come from', () => {
  for (const heritage of ['tejano', 'free-black', 'anglo']) {
    for (const seed of ['wed-a', 'wed-b', 'wed-c', 'wed-d']) {
      const world = colonies(seed, 12);
      const household = of(world, heritage)[0];
      rollFamily(world, household);
      const parent = parents(world, household)[0];
      const taken = new Set();
      const { two, spouseSex, age } = dealNeighbours(world, household, parent, taken);
      const spouse = rollSpouse(world, household, parent, spouseSex, age, taken);
      const looks = appearanceOf(world, { id: spouse.id, kind: 'person', householdId: household.id, sex: spouse.sex, age: spouse.age, kin: { role: spouse.role } });
      assert.ok(range(heritage).includes(looks.skin), `${heritage}: the spouse is ${looks.skin}`);
      assert.ok((heritage === 'tejano' ? POOLS.tejano : POOLS.anglo)[spouse.role].includes(spouse.given), `${heritage}: ${spouse.given}`);
      for (const one of two.people) assert.ok(range(heritage).includes(one.appearance.skin), `${heritage}: the spouse's family is ${one.appearance.skin}`);
      if (heritage === 'tejano') assert.ok(['Salcedo', 'Montañez', 'Treviño', 'Villa', 'Olivares', 'Serna'].includes(two.surname), two.surname);
      if (heritage === 'free-black') assert.ok(['Tanner', 'Bledsoe'].includes(two.surname), two.surname);
      if (heritage === 'anglo') assert.ok(['Ashby', 'Tolliver', 'Kittredge', 'Whitlow', 'Pruett', 'Hensley'].includes(two.surname), two.surname);
    }
  }
});

test('the start is on the family\'s own book only: not on the tick, and not on another family\'s page', () => {
  const world = colonies('seen-a', 12);
  const free = of(world, 'free-black')[0], other = Object.values(world.households).find(household => household.heritage === 'anglo');
  for (const household of Object.values(world.households)) rollFamily(world, household);
  assert.equal(projectFamily(world, free.id).start.heritage, 'free-black');
  assert.match(projectFamily(world, free.id).start.lead, /free and Black/);
  assert.equal(projectFamily(world, other.id).start.heritage, 'anglo');
  const own = JSON.stringify(projectWorld(world, free.id, 'student', { includeMap: false }));
  assert.ok(!own.includes('"heritage"'), 'the tick carries no start');
  const theirs = JSON.stringify(projectWorld(world, other.id, 'student', { includeMap: false }));
  assert.ok(!theirs.includes('free-black') && !theirs.includes('free and Black'), 'another family is sent nothing of it');
});

test('the start\'s story is told once, at its moment: the law to a free Black family only, and the ending\'s last line', () => {
  const world = colonies('law-a', 12);
  const free = of(world, 'free-black')[0], tejano = of(world, 'tejano')[0], anglo = of(world, 'anglo')[0];
  world.status = 'running';
  const lines = id => world.events.filter(event => event.householdId === id && FREE_BLACK_WORD.some(word => word.text === event.text));
  world.minute = minuteOn(world, FREE_BLACK_WORD[0].on) - 60;
  advanceStarts(world);
  assert.equal(lines(free.id).length, 0, 'not before its day');
  world.minute = minuteOn(world, FREE_BLACK_WORD[0].on);
  advanceStarts(world); advanceStarts(world);
  assert.equal(lines(free.id).length, 1, 'once, on its day');
  world.minute = minuteOn(world, FREE_BLACK_WORD[1].on) + 10;
  advanceStarts(world);
  assert.equal(lines(free.id).length, 2);
  assert.equal(lines(anglo.id).length + lines(tejano.id).length, 0, 'nobody else is told');
  assert.match(familyEnding(world, free.id).story.at(-1), /Ashworth Act/);
  assert.match(familyEnding(world, tejano.id).story.at(-1), /De León’s colony/);
  assert.ok(!familyEnding(world, anglo.id).story.some(line => /Ashworth|De León/.test(line)));
});

test('only the start\'s own modules read a family\'s start: no price, trade, work, fate or director does', () => {
  // VISION.md §15: nothing about a person is inferred from where their family came from. What a start may change is the names, the
  // tones, the card, the story's lines, a Tejano family's corn and Seguín's company, and the neighbours on the lone parent's path.
  const allowed = new Set(['sim/appearance.mjs', 'sim/colonies-region.mjs', 'sim/courtship.mjs', 'sim/family.mjs', 'sim/start-story.mjs', 'sim/starts.mjs', 'sim/tejano.mjs', 'sim/world.mjs', 'public/creation.js',
    // What a Tejano family's cart is called and how it is drawn (the owner, 2026-09-30), never what it carries.
    'sim/means.mjs', 'sim/wagon.mjs']);
  const readers = [];
  for (const dir of ['sim', 'sim/battles', 'public', 'server']) {
    for (const name of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (!/\.m?js$/.test(name)) continue;
      const text = readFileSync(new URL(`../${dir}/${name}`, import.meta.url), 'utf8');
      if (/heritage|seguinFamily|heritageOf/.test(text)) readers.push(`${dir}/${name}`);
    }
  }
  const tejano = readFileSync(new URL('../sim/calls.mjs', import.meta.url), 'utf8');
  assert.deepEqual(readers.filter(file => !allowed.has(file) && file !== 'sim/calls.mjs'), [], 'a module outside the start reads it');
  // The call reads it only to say the Tejano volunteers' words and mark the company, never whether a man may go.
  assert.ok(!/seguinFamily[^\n]*can:|can:[^\n]*seguinFamily/.test(tejano));
});

/** A class of ten with starts in which the family of `heritage` is a lone parent's, played, on its land, running. */
function loneOf(heritage) {
  for (let n = 0; n < 400; n++) {
    const world = colonies(`lone-${heritage}-${n}`, 10);
    const household = of(world, heritage)[0];
    if (familyRoll(world.seed, household.id) > 3) continue;
    rollFamily(world, household); household.played = true;
    world.status = 'running';
    until(world, () => !household.arriving, 400);
    if (household.choosingSite) {
      const home = world.map.sites[household.homeSiteId];
      applyAction(world, household.id, { action: 'choose-site', x: home.x, y: home.y });
      until(world, () => !household.arriving && !household.choosingSite, 60);
    }
    return { world, household };
  }
  throw new Error(`no lone ${heritage} family`);
}

test('a Tejano family is married by the priest from La Bahía; an Anglo-American or a free Black family by bond', () => {
  // Owner, 2026-09-29: "Priest from La Bahía" (docs/FAMILY_CREATION.md, *The family's start*).
  for (const heritage of ['tejano', 'free-black', 'anglo']) {
    const { world, household } = loneOf(heritage);
    applyAction(world, household.id, { action: 'ask-neighbours' });
    const { script } = projectWorld(world, household.id, 'student', { includeMap: false }).courtship;
    const wedding = script.scenes.find(scene => scene.id === 'wedding');
    const words = wedding.lines.map(line => line.text).join(' ');
    until(world, () => household.courtship?.stage === 'home', 200);
    const told = world.events.filter(event => event.householdId === household.id && event.type === 'courtship').map(event => event.text).join(' ');
    if (heritage === 'tejano') {
      assert.equal(script.rite, 'priest');
      assert.equal(script.cast.commissioner.name, 'The priest');
      assert.match(words, /La Bahía/); assert.doesNotMatch(words, /bond|sign/i, 'a bond at a Tejano wedding');
      assert.equal(wedding.history.claimId, 'HIST-TEX-781');
      assert.match(wedding.history.text, /no priest of its own; a priest came from La Bahía/);
      assert.match(told, /married by the priest from La Bahía/); assert.doesNotMatch(told, /married by bond/);
    } else {
      assert.equal(script.rite, 'bond');
      assert.match(words, /bond/); assert.equal(wedding.history.claimId, 'HIST-TEX-740');
      assert.match(told, /married by bond/);
    }
    validateWorld(world);
  }
});

test('a company or a told line that could not have been does not open', () => {
  const world = colonies('valid-a', 12);
  const anglo = of(world, 'anglo')[0];
  world.entities[anglo.members[0]].company = 'seguin';
  assert.throws(() => validateWorld(world), /Invalid company/);
  delete world.entities[anglo.members[0]].company;
  world.households[anglo.id].heritage = 'tejano';
  assert.throws(() => validateWorld(world), /De León/);
});

// ------------------------------------------------------------------------------------------------ a class played to the spring

let played = null;
/** A class of ten with starts, its Tejano and free Black families a student's, the Tejano man sent with Seguín, played to the spring. */
function springClass() {
  if (played) return structuredClone(played);
  const world = createGonzalesWorld('starts-spring-1', 10, { map: 'colonies', starts: true, neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const tejano = of(world, 'tejano')[0], free = of(world, 'free-black')[0];
  tejano.played = true; free.played = true;
  world.status = 'running';
  // Fed for the two periods they are stepped through with no order given (a played family can starve; tests/support/fed.mjs):
  // after the first tick, which gives every family its means (sim/means.mjs `settleMeans`) and so its store.
  stepWorld(world);
  feed(world, [tejano, free], 400);
  until(world, () => world.calls?.[tejano.id]);
  heardOut(world, tejano.id);
  const answerers = projectWorld(world, tejano.id, 'student', { includeMap: false }).request?.answerers || {};
  const [manId, options] = Object.entries(answerers).find(([, list]) => list.find(option => option.id === 'turn-out')?.can);
  const call = { options: options.map(option => option.label) };
  applyAction(world, tejano.id, { action: 'turn-out', entityId: manId, mode: 'horse' });
  const company = world.entities[manId].company;
  until(world, () => world.director.complete);
  const autumn = world.events.filter(event => event.householdId === tejano.id).map(event => event.text);
  beginSecondPeriod(world); world.status = 'running';
  // And again for the second period: the winter leaves a family a fortnight's food, and these give no orders.
  feed(world, [tejano, free], 400);
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  played = { world, tejanoId: tejano.id, freeId: free.id, manId, call, company, autumn };
  return structuredClone(played);
}

test('a Tejano family\'s man rides with Seguín\'s company in the autumn, and is told what it did and that it went home', () => {
  const { world, tejanoId, manId, call, company } = springClass();
  const autumn = world.events.filter(event => event.householdId === tejanoId).map(event => event.text);
  assert.ok(call.options.some(label => /Seguín's company/.test(label)), call.options.join(' | '));
  assert.equal(company, 'seguin');
  assert.ok(autumn.some(text => /On the Salado, Juan Seguín's company/.test(text)), 'the Salado');
  assert.ok(autumn.some(text => /given leave to go home and guard their families/.test(text)), 'the leave');
  assert.equal(world.entities[manId].company, 'seguin');
  const anglo = of(world, 'anglo').find(household => world.calls?.[household.id]?.status === 'accepted');
  if (anglo) for (const id of world.calls[anglo.id].actorIds) assert.equal(world.entities[id].company, undefined, 'an Anglo volunteer is nobody\'s company');
  assert.ok(!world.events.some(event => event.householdId !== tejanoId && /Seguín's company of Tejano volunteers/.test(event.text)));
});

test('in the spring a Tejano family\'s man may join Seguín\'s company in Houston\'s army, and nobody else\'s may', () => {
  const { world, tejanoId, manId } = springClass();
  const tejano = world.households[tejanoId];
  const man = world.entities[manId];
  const offered = entity => choresFor(world, world.households[entity.householdId], entity).find(chore => chore.id === 'join-seguin');
  until(world, () => !man.travel && man.location.siteId === tejano.homeSiteId && offered(man)?.can, 3000);
  assert.ok(offered(man)?.can, offered(man)?.why || 'not offered');
  // An Anglo family's man who is offered Houston's army is not offered Seguín's company.
  const houstonOf = entity => choresFor(world, world.households[entity.householdId], entity).find(chore => chore.id === 'join-houston');
  const anglo = of(world, 'anglo').flatMap(household => parents(world, household).filter(one => one.sex === 'male')).find(one => houstonOf(one));
  assert.ok(anglo, 'an Anglo family\'s man offered Houston\'s army');
  assert.equal(offered(anglo), undefined, 'not put in front of an Anglo family\'s man');
  // As a Tejano man who stayed home in the autumn: joining in the spring is what makes him Seguín's.
  delete man.company;
  applyAction(world, tejanoId, { action: 'chore', entityId: manId, chore: 'join-seguin', mode: 'foot' });
  until(world, () => man.service?.status === 'serving', 4000);
  assert.equal(man.service?.kind, 'houston');
  assert.equal(man.company, 'seguin');
  assert.ok(world.events.some(event => event.householdId === tejanoId && /joined Juan Seguín's company, the Tejano company of Houston's army/.test(event.text)));
});

test('on the road east a family passes enslaved people, drawn where it is and told once, and hears of escapes at a crossing', () => {
  const { world } = springClass();
  let road = null, crossing = null;
  for (let t = 0; t < 8000 && world.status === 'running' && !(road && crossing); t++) {
    stepWorld(world);
    // The tick a family passes the halted wagons: drawn on its own page, where it is, and on nobody else's.
    for (const id of Object.keys(world.roadPassed || {})) {
      if (road || world.roadPassed[id].minute !== world.minute) continue;
      const other = Object.keys(world.households).find(one => one !== id);
      const named = group => group.id === `enslaved:road:${id}`;
      road = { id, mine: roadGroups(world, id).filter(named), theirs: roadGroups(world, other).filter(named), host: roadGroups(world, null, true).filter(named) };
    }
    // A family waiting its turn at a river: the group at that crossing, on its page.
    const waiting = !crossing && Object.values(world.households).find(household => household.flight?.status === 'fled' && household.flight.crossing);
    if (waiting) {
      const view = projectWorld(world, waiting.id, 'student', { includeMap: false });
      crossing = { id: waiting.id, siteId: waiting.flight.crossing.siteId, groups: roadGroups(world, waiting.id), crowds: ambientFor(world, waiting.id, 'student', view)?.crowds || [] };
    }
  }
  assert.ok(road, 'a family passed the halted wagons');
  assert.equal(road.mine.length, 1, 'drawn on its own page');
  assert.equal(road.theirs.length, 0, 'not on another family\'s page');
  assert.equal(road.host.length, 1, 'the Host sees it');
  for (const group of [...road.mine, ...road.host]) {
    assert.equal(group.pairs.length, 0, 'no words put in their mouths');
    for (const one of group.people) assert.ok(range('free-black').includes(one.look.skin));
  }
  for (const id of Object.keys(world.roadPassed)) assert.equal(world.events.filter(event => event.householdId === id && event.text === ROAD_WORDS.road).length, 1, `${id} told once`);
  assert.ok(crossing, 'a family waited at a crossing');
  assert.ok(crossing.groups.some(group => group.siteId === crossing.siteId), 'the waiting family sees the group at its crossing');
  assert.ok(crossing.crowds.some(crowd => crowd.kind === 'enslaved'), 'on its page');
  assert.equal(world.events.filter(event => event.householdId === crossing.id && /slipped away in the confusion/.test(event.text)).length, 1, 'told once');
  // Nothing about them is anything a family can use: they are in no household, own nothing and take no order.
  assert.ok(!Object.keys(world.entities).some(key => key.startsWith('enslaved')));
});
