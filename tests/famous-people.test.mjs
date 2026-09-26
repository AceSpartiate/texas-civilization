// The famous people of 1835-36 (owner, 2026-09-26: "they should be labelled, saying and doing the things that they likely would
// have, dying the way they should (Travis, Bowie, Crocett come to mind as an example)"; docs/BATTLES.md §2c; sim/people.mjs).
//
// What is held here: the roster's itineraries fit the engagements' own clocks; every famous death falls at its minute and
// place and never before; named words come out of the named person's own figure and are never reconstructed; Joe lives in
// every text; Emily West's picnic is tradition and never the record; the legends are spoken as tradition; the Twin Sisters are
// named and fire where the record puts them; a family sees a famous person only under the sight rules; nothing is stored.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, checkEngagement, projectBattle, phaseOffset, schedule, peopleOnFields } from '../sim/battle-stage.mjs';
import { PEOPLE, on } from '../sim/people.mjs';
import { TIMELINE } from '../sim/directors.mjs';
import { ALAMO } from '../sim/battles/alamo.mjs';
import { SAN_JACINTO_BATTLE } from '../sim/battles/san-jacinto.mjs';
import { FALL_ACCOUNT, ALAMO_WORD } from '../sim/alamo.mjs';
import { STORY_LINES } from '../sim/rumour-story.mjs';
import { famousNow, famousSeen, whenOf, FAMOUS_SIGHT_MILES } from '../sim/famous.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld } from '../sim/world.mjs';

const copy = value => JSON.parse(JSON.stringify(value));
/** A bare world holding one engagement from minute 0, on a map with the places the engagements stand at. */
const SITES = { bexar: { x: -61.6, y: 4.6, name: 'Béxar' }, lynchburg: { x: 144.4, y: -19.1, name: 'Lynchburg' }, gonzales: { x: 1.1, y: -0.7, name: 'Gonzales' },
  ford: { x: 0.9, y: -0.5, name: 'the ford' }, 'williams-camp': { x: 0.8, y: 1.8, name: 'Williams' }, 'san-patricio': { x: -18.4, y: 104.3, name: 'San Patricio' },
  'agua-dulce': { x: -20.4, y: 127.5, name: 'Agua Dulce' }, 'matamoros-road': { x: -20.4, y: 128.9 }, goliad: { x: 5.3, y: 58.1, name: 'Goliad' }, coleto: { x: 14.3, y: 55.4, name: 'Coleto' },
  victoria: { x: 28.2, y: 47.2, name: 'Victoria' }, refugio: { x: 11.8, y: 82.3 }, confluence: { x: 0, y: 0 } };
function fieldAt(id, phaseId, into) {
  const def = ENGAGEMENTS[id];
  const minute = phaseOffset(def, phaseId) + into;
  const world = { minute, map: { sites: SITES }, battles: { [id]: { id, start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } };
  return { world, view: projectBattle(world, id) };
}
const personIn = (view, id) => (view?.people || []).find(one => one.id === id);
const at = (def, point, world) => def.ground(world)[point];
const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;

test('every engagement names its famous people from one roster, and each fate falls in a phase that draws them', () => {
  for (const def of Object.values(ENGAGEMENTS)) checkEngagement(def);
  for (const one of Object.values(PEOPLE)) {
    assert.ok(one.name && one.claimId && one.art, `${one.id} has no name, claim or art`);
    if (one.fate) assert.ok(ENGAGEMENTS[one.fate.battle], `${one.id}'s fate is in no engagement`);
  }
  // A phase that names somebody not on the roster, or gives a named person a place of its own, is refused.
  const bad = change => { const def = copy(ALAMO); def.ground = ALAMO.ground; change(def); return () => checkEngagement(def); };
  assert.throws(bad(def => { def.phases.find(p => p.id === 'alarm').people.push({ id: 'davy', at: 'plaza' }); }), /nobody on the roster/);
  assert.throws(bad(def => { def.phases.find(p => p.id === 'alarm').people[0].falls = 3; }), /from the roster/);
});

test('the roster\'s itineraries fit the engagements\' clocks: nobody is on the campaign map while their own battle draws them', () => {
  // On the timeline's own minutes (a class that arrived at dawn on September 28).
  const world = { director: { arrival: true } };
  const starts = Object.fromEntries(Object.values(ENGAGEMENTS).map(def => [def.id, TIMELINE[def.startKey]]));
  for (const one of Object.values(PEOPLE)) {
    const windows = [];
    for (const def of Object.values(ENGAGEMENTS)) {
      for (const phase of schedule(def, starts[def.id])) {
        const drawn = (phase.people || []).some(entry => entry.id === one.id) || (phase.parley?.people || []).some(p => p.id === one.id) || (phase.legendScene?.people || []).includes(one.id);
        if (drawn) windows.push([phase.from, phase.to, `${def.id}:${phase.id}`]);
      }
    }
    for (const leg of one.map || []) {
      const from = whenOf(world, leg.from), until = whenOf(world, leg.until);
      assert.ok(from < until, `${one.id}'s leg ends before it begins`);
      for (const [a, b, where] of windows) assert.ok(until <= a || from >= b, `${one.id} is on the map and at ${where} at once`);
    }
  }
  // Dated as the record dates them: Travis at Béxar from February 3, Crockett from the 8th, Bowie from January 19; the Twin
  // Sisters with Houston's army from April 11 (the Handbook's Twin Sisters); Emily West taken on April 16.
  assert.equal(PEOPLE.travis.map[0].from, on(1836, 2, 3, 16));
  assert.equal(PEOPLE.crockett.map[0].from, on(1836, 2, 8, 14));
  assert.equal(PEOPLE['twin-sisters'].map[0].from, on(1836, 4, 11, 16));
  assert.equal(PEOPLE['emily-west'].map[0].until, on(1836, 4, 16, 12));
});

test('Travis falls at the north battery at his moment, and not a minute before; he lies there until the dead are carried out', () => {
  const fate = PEOPLE.travis.fate;
  const before = fieldAt('alamo', 'repulse', fate.at - 1), after = fieldAt('alamo', 'repulse', fate.at);
  assert.ok(personIn(before.view, 'travis') && !personIn(before.view, 'travis').fell, 'Travis fell before his minute');
  const fell = personIn(after.view, 'travis');
  assert.ok(Number.isFinite(fell?.fell), 'Travis did not fall at his minute');
  assert.ok(near(fell, at(ALAMO, 'north-battery', after.world)), 'Travis fell away from the north battery');
  // Running to the battery at the alarm, speaking Joe's words for him from his own figure.
  const alarm = fieldAt('alamo', 'alarm', 3);
  assert.ok(personIn(alarm.view, 'travis'), 'Travis is not at the alarm');
  const line = alarm.view.lines.find(one => one.id === 'al-travis');
  assert.equal(line.person, 'travis'); assert.equal(line.name, 'Travis'); assert.equal(line.kind, 'documented');
  const rooms = fieldAt('alamo', 'rooms', 5), after2 = fieldAt('alamo', 'after', 30);
  assert.ok(Number.isFinite(personIn(rooms.view, 'travis')?.fell), 'Travis does not lie where he fell');
  assert.ok(!personIn(after2.view, 'travis'), 'Travis lies on the battery after the pyres');
});

test('Bowie lies ill on his cot in his room on the south side, and lies still there when that barrack is carried; nothing of how is drawn', () => {
  for (const phase of ['day-24', 'day-4', 'alarm', 'north-wall']) {
    const one = personIn(fieldAt('alamo', phase, 1).view, 'bowie');
    assert.equal(one?.pose, 'sick', `Bowie is not on his cot in ${phase}`);
    assert.ok(near(one, at(ALAMO, 'bowie-room', fieldAt('alamo', phase, 1).world)), `Bowie is not in his room in ${phase}`);
  }
  const fate = PEOPLE.bowie.fate;
  assert.equal(fate.phase, 'fallback'); assert.equal(fate.pose, 'still-bed');
  assert.ok(!personIn(fieldAt('alamo', 'fallback', fate.at - 1).view, 'bowie').fell, 'Bowie is dead before the barrack is carried');
  const still = personIn(fieldAt('alamo', 'fallback', fate.at).view, 'bowie');
  assert.ok(Number.isFinite(still.fell) && still.still === 'still-bed', 'Bowie does not lie still on his cot');
  // Not the long barrack: the audit's error 7.
  assert.doesNotMatch(ALAMO.phases.find(p => p.id === 'rooms').caption, /long barrack[^.]*Bowie|Bowie is killed in his bed/);
  assert.match(ALAMO.phases.find(p => p.id === 'rooms').caption, /south side/);
});

test('Crockett fights through the assault and, as de la Peña tells it, is taken and killed before Santa Anna after it - labelled one account, the other accounts on screen', () => {
  for (const phase of ['alarm', 'repulse', 'north-wall', 'fallback', 'rooms']) {
    const one = personIn(fieldAt('alamo', phase, 2).view, 'crockett');
    assert.ok(one && !one.fell, `Crockett is not fighting in ${phase}`);
    assert.equal(one.pose, 'fire', `Crockett is not firing in ${phase}`);
  }
  const fate = PEOPLE.crockett.fate;
  assert.equal(fate.phase, 'end'); assert.equal(fate.account, 'de la Peña'); assert.ok(fate.disputed);
  const taken = fieldAt('alamo', 'end', fate.at - 1);
  const crockett = personIn(taken.view, 'crockett');
  assert.equal(crockett.pose, 'captive'); assert.ok(!crockett.fell);
  assert.match(crockett.tag, /one account/i); assert.match(crockett.tag, /disputed/);
  assert.ok(personIn(taken.view, 'santa-anna'), 'Santa Anna is not there'); assert.ok(personIn(taken.view, 'castrillon'), 'Castrillón is not there');
  assert.ok(Number.isFinite(personIn(fieldAt('alamo', 'end', fate.at).view, 'crockett').fell), 'Crockett does not fall at his minute');
  const caption = ALAMO.phases.find(p => p.id === 'end').caption;
  for (const words of [/de la Peña/, /Joe said/, /Susanna Dickinson/, /1955/, /genuine/, /not known for certain/]) assert.match(caption, words);
  // Crockett's words at the Alamo: none - no source gives him any.
  assert.ok(!Object.values(ENGAGEMENTS).flatMap(def => def.phases.flatMap(p => p.lines || [])).some(line => line.person === 'crockett'));
});

test('the church guns and their gunners fall together; Castrillón falls walking away at San Jacinto; Grant and Fannin are told, never drawn', () => {
  for (const id of ['bonham', 'almeron-dickinson', 'esparza']) {
    const fate = PEOPLE[id].fate;
    assert.equal(fate.phase, 'rooms');
    assert.ok(Number.isFinite(personIn(fieldAt('alamo', 'rooms', fate.at).view, id).fell), `${id} does not fall with the church`);
  }
  const cf = PEOPLE.castrillon.fate;
  const charge = fieldAt('san-jacinto', 'charge', cf.at);
  assert.ok(near(personIn(charge.view, 'castrillon'), at(SAN_JACINTO_BATTLE, 'castrillonWalk', charge.world)), 'Castrillón falls away from where he walked');
  assert.ok(Number.isFinite(personIn(charge.view, 'castrillon').fell));
  assert.ok(!personIn(fieldAt('san-jacinto', 'charge', cf.at - 1).view, 'castrillon').fell);
  for (const id of ['grant', 'fannin']) {
    const fate = PEOPLE[id].fate, def = ENGAGEMENTS[fate.battle];
    assert.ok(fate.told);
    for (const phase of def.phases) for (let into = 0; into < phase.minutes; into += Math.max(1, Math.floor(phase.minutes / 12))) {
      const one = personIn(fieldAt(def.id, phase.id, into).view, id);
      assert.ok(!one?.fell, `${id} is drawn dying at ${phase.id}`);
      if (def.phases.indexOf(phase) >= def.phases.findIndex(p => p.id === fate.phase) && into >= fate.at) assert.ok(!one, `${id} is drawn at or after his killing (${phase.id})`);
    }
  }
  assert.match(ENGAGEMENTS['agua-dulce'].phases.find(p => p.id === 'after').caption, /gave himself up/);
  assert.match(ENGAGEMENTS['goliad-massacre'].phases.find(p => p.id === 'inside').caption, /Spohn/);
});

test('every named line comes out of its speaker\'s own figure, drawn there at that minute, and none is reconstructed', () => {
  let named = 0;
  for (const def of Object.values(ENGAGEMENTS)) {
    for (const phase of def.phases) {
      for (const line of phase.lines || []) {
        assert.equal(line.name, undefined, `${line.id} names its speaker in text`);
        if (!line.person) continue;
        named++;
        assert.ok(['documented', 'tradition'].includes(line.kind), `${line.person} is given ${line.kind} words (${line.id})`);
        assert.ok(line.claimId, `${line.id} has no claim`);
        const { view } = fieldAt(def.id, phase.id, line.at);
        const drawn = new Set([...(view.people || []).filter(one => !one.fell).map(one => one.id), ...(view.parley?.people || []).map(one => one.id), ...(view.legendScene?.people || []).map(one => one.id)]);
        assert.ok(drawn.has(line.person), `${line.person} says ${line.id} at ${def.id}:${phase.id} without being drawn`);
        assert.equal(view.lines.find(one => one.id === line.id)?.name, PEOPLE[line.person].name, `${line.id} is sent without its speaker's name`);
      }
    }
  }
  assert.ok(named >= 18, `only ${named} named lines`);
  // The rule is the engine's: a reconstructed line in a named mouth, or a line from somebody not there, is refused.
  const bad = change => { const def = copy(ALAMO); def.ground = ALAMO.ground; change(def); return () => checkEngagement(def); };
  assert.throws(bad(def => { def.phases.find(p => p.id === 'alarm').lines.find(l => l.id === 'al-walls').person = 'travis'; }), /named person/);
  assert.throws(bad(def => { def.phases.find(p => p.id === 'alarm').lines.find(l => l.id === 'al-travis').person = 'bonham'; def.phases.find(p => p.id === 'alarm').people = def.phases.find(p => p.id === 'alarm').people.filter(one => one.id !== 'bonham'); }), /without being drawn/);
});

test('Joe lives in every text: he fights beside Travis, takes cover and fires, comes out, is hurt and saved, is brought before Santa Anna and goes to Gonzales', () => {
  const erased = /every man (in it|who fought|inside)|all (the )?(men|defenders) (were|was) killed|servant Joe/i;
  for (const text of [FALL_ACCOUNT, ALAMO_WORD.fall, ALAMO_WORD.fallRumour, STORY_LINES['alamo-fall'].told, ALAMO.outcome, ...ALAMO.phases.map(p => p.caption)]) assert.doesNotMatch(text, erased, text.slice(0, 80));
  for (const text of [FALL_ACCOUNT, ALAMO_WORD.fall, STORY_LINES['alamo-fall'].told, ALAMO.outcome]) {
    assert.match(text, /Joe/); assert.match(text, /nearly every|Nearly every/);
  }
  assert.match(FALL_ACCOUNT, /Travis/); assert.match(FALL_ACCOUNT, /Bowie/); assert.match(FALL_ACCOUNT, /Crockett/);
  // His own sequence (Gray, March 20, 1836; `HIST-TEX-502`, `-549`).
  assert.ok(near(personIn(fieldAt('alamo', 'repulse', 1).view, 'joe'), at(ALAMO, 'joe-battery', fieldAt('alamo', 'repulse', 1).world)), 'Joe is not beside Travis on the battery');
  assert.equal(personIn(fieldAt('alamo', 'repulse', 12).view, 'joe').pose, 'fire-hidden', 'Joe is not firing from the house after Travis fell');
  assert.equal(personIn(fieldAt('alamo', 'rooms', 5).view, 'joe').pose, 'fire-hidden');
  assert.equal(personIn(fieldAt('alamo', 'end', 7).view, 'joe').pose, 'emerge');
  const hurt = personIn(fieldAt('alamo', 'end', 12).view, 'joe');
  assert.ok(Number.isFinite(hurt.hurt) && !hurt.fell, 'Joe is not hurt and alive');
  assert.ok(personIn(fieldAt('alamo', 'end', 12).view, 'barragan'), 'Captain Barragán is not there to save him');
  const after = fieldAt('alamo', 'after', 400);
  assert.ok(near(personIn(after.view, 'joe'), at(ALAMO, 'musquiz-door', after.world)), 'Joe is not brought to Santa Anna in Béxar');
  assert.ok(near(personIn(after.view, 'santa-anna'), at(ALAMO, 'musquiz', after.world)));
  assert.notEqual(PEOPLE.joe.fate.kind, 'killed');
  assert.deepEqual(PEOPLE.joe.map.find(leg => leg.road)?.road, ['bexar', 'gonzales']);
  // He is never drawn fallen in any phase.
  for (const phase of ALAMO.phases) assert.ok(!personIn(fieldAt('alamo', phase.id, Math.floor(phase.minutes / 2)).view, 'joe')?.fell, `Joe fell in ${phase.id}`);
});

test('Emily West\'s picnic is a story told later: tradition, with a stage direction, never the record, never more than talk and a meal', () => {
  const lines = SAN_JACINTO_BATTLE.phases.flatMap(p => (p.lines || []).map(line => ({ ...line, phase: p.id }))).filter(line => line.person === 'emily-west');
  assert.ok(lines.length >= 4, 'Emily West says nothing at the picnic');
  for (const line of lines) {
    assert.equal(line.kind, 'tradition', `${line.id} is not tradition`);
    assert.ok(line.manner && line.manner.length <= 30, `${line.id} has no stage direction`);
    assert.equal(line.claimId, 'HIST-TEX-560');
    assert.match(line.gloss, /told later/); assert.match(line.gloss, /New Washington/);
    assert.doesNotMatch(line.text, /kiss|embrace|bed|darling|lover|sweetheart|beautiful|my dear|touch/i);
    const phase = SAN_JACINTO_BATTLE.phases.find(p => p.id === line.phase);
    assert.equal(phase.legendScene?.kind, 'tradition', `${line.id} is said outside the legend`);
  }
  assert.ok(lines.some(line => /sarcastic/.test(line.manner)), 'none of her lines is marked as played');
  assert.ok(!Object.values(ENGAGEMENTS).flatMap(def => def.phases.flatMap(p => p.lines || [])).some(line => line.person === 'emily-west' && line.kind === 'documented'));
  assert.ok(!Object.values(ENGAGEMENTS).flatMap(def => def.phases.flatMap(p => p.lines || [])).some(line => line.person === 'santa-anna' && line.id.startsWith('sj-emily')), 'Santa Anna is given words at the picnic');
  // The caption says it is a later story and that she had been taken by his army.
  assert.match(SAN_JACINTO_BATTLE.phases.find(p => p.id === 'waiting').caption, /later, disputed story/);
  assert.match(SAN_JACINTO_BATTLE.phases.find(p => p.id === 'waiting').caption, /taken by his army at New Washington/);
  // Her documented itinerary: New Washington, taken on April 16, with the army, then in its camp.
  assert.equal(PEOPLE['emily-west'].map[0].place, 'New Washington');
  assert.equal(PEOPLE['emily-west'].map[1].with, 'column:santa-anna');
  assert.ok(personIn(fieldAt('san-jacinto', 'camped', 30).view, 'emily-west'), 'Emily West is not in the Mexican camp');
});

test('the legends are spoken on the field as tradition, glossed as told later: the line in the sand, "stop that firing", the Napoleon of the West', () => {
  const all = Object.values(ENGAGEMENTS).flatMap(def => def.phases.flatMap(p => (p.lines || []).map(line => ({ ...line, battle: def.id, phase: p.id }))));
  const find = id => all.find(line => line.id === id);
  for (const [id, person, claim] of [['line-sand', 'travis', 'HIST-TEX-567'], ['sj-stop-firing', 'houston', 'HIST-TEX-564'], ['sj-napoleon', 'santa-anna', 'HIST-TEX-559'], ['sj-remember', 'houston', 'HIST-TEX-559']]) {
    const line = find(id);
    assert.ok(line, `${id} is not spoken`);
    assert.equal(line.kind, 'tradition'); assert.equal(line.person, person); assert.equal(line.claimId, claim);
    assert.match(line.gloss, /told later/);
  }
  assert.match(find('sj-napoleon').text, /Napoleon of the West/);
  assert.match(find('line-sand').text, /across this line/);
  assert.match(ALAMO.phases.find(p => p.id === 'the-line').caption, /Historians doubt it/);
});

test('the Twin Sisters are named and fire where the record puts them: before the camp on April 20 under Neill, who is hit, and within two hundred yards on the 21st under Hockley', () => {
  const skirmish = fieldAt('san-jacinto', 'skirmish', 20);
  const twins = skirmish.view.guns.filter(gun => gun.id.startsWith('twins-20'));
  assert.equal(twins.length, 2); assert.ok(twins.some(gun => gun.named && gun.name === 'Twin Sisters'));
  assert.ok(twins.reduce((sum, gun) => sum + gun.shots.length, 0) >= 3, 'the Twin Sisters did not answer on the 20th');
  const neill = personIn(fieldAt('san-jacinto', 'skirmish', PEOPLE.neill.fate.at).view, 'neill');
  assert.ok(Number.isFinite(neill.hurt), 'Neill is not wounded at the guns');
  assert.ok(!personIn(fieldAt('san-jacinto', 'skirmish', PEOPLE.neill.fate.at - 1).view, 'neill').hurt);
  // The skirmish's Texian hurt: Neill at the guns, and two of Sherman's horsemen (Houston: "two men severely wounded").
  assert.equal(SAN_JACINTO_BATTLE.phases.find(p => p.id === 'skirmish').falls.filter(f => f.side === 'texian').length, 2);
  const guns = fieldAt('san-jacinto', 'guns', 5);
  const station = guns.view.guns.filter(gun => gun.id.startsWith('twin-sister'));
  assert.ok(station.some(gun => gun.named && gun.name === 'Twin Sisters'));
  assert.ok(station.reduce((sum, gun) => sum + gun.shots.length, 0) >= 3);
  for (const id of ['hockley', 'mcculloch']) assert.ok(personIn(guns.view, id), `${id} is not at the guns`);
  assert.match(SAN_JACINTO_BATTLE.phases.find(p => p.id === 'parade').caption, /family story told later they were named at Brazoria for the twin daughters of Dr. Charles Rice/);
  assert.match(SAN_JACINTO_BATTLE.phases.find(p => p.id === 'guns').caption, /later tellers say broken horseshoes/);
  assert.equal(PEOPLE['twin-sisters'].map[0].with, 'houston');
});

test('Houston rides with the line, is wounded in the charge at his minute, and lies wounded the next day; the Napoleon of the West comes out of Santa Anna', () => {
  const fate = PEOPLE.houston.fate;
  assert.ok(personIn(fieldAt('san-jacinto', 'advance', 10).view, 'houston'), 'Houston is not with the line');
  assert.ok(!personIn(fieldAt('san-jacinto', 'charge', fate.at - 1).view, 'houston').hurt);
  assert.ok(Number.isFinite(personIn(fieldAt('san-jacinto', 'charge', fate.at).view, 'houston').hurt), 'Houston is not hurt at his minute');
  const taken = fieldAt('san-jacinto', 'taken', 35).view;
  assert.deepEqual(taken.parley.people.map(one => one.id), ['houston', 'santa-anna']);
  assert.equal(taken.lines.find(line => line.id === 'sj-napoleon')?.name, 'Santa Anna');
});

test('a family sees a famous person on the map only where its own people could, and nobody is drawn on the map and a field at once', () => {
  const world = createGonzalesWorld('famous-map', 5, { map: 'colonies' });
  world.minute = whenOf(world, on(1836, 2, 12, 12));
  const host = famousNow(world);
  for (const id of ['travis', 'bowie', 'crockett']) assert.ok(host.some(one => one.id === id), `${id} is not at Béxar on February 12`);
  const household = Object.values(world.households)[0];
  // Nobody of the family near Béxar: nothing is sent.
  assert.deepEqual(famousSeen(world, household.id, 'student'), []);
  assert.equal(projectWorld(world, household.id, 'student', { includeMap: false }).famous, undefined);
  // One of them rides into Béxar: Travis, Bowie and Crockett are seen, and only them.
  const person = world.entities[household.members[0]];
  const bexar = world.map.sites.bexar;
  person.location = { x: bexar.x, y: bexar.y, siteId: 'bexar' };
  const seen = famousSeen(world, household.id, 'student');
  assert.deepEqual(seen.map(one => one.id).sort(), ['bowie', 'crockett', 'travis']);
  for (const one of seen) assert.ok(Math.hypot(one.x - bexar.x, one.y - bexar.y) <= FAMOUS_SIGHT_MILES);
  assert.ok(projectWorld(world, null, 'host', { includeMap: false }).famous.length >= 3);
  // Before the famous are anywhere, or after, nobody: a save from before is simply empty, and nothing is written to the world.
  const before = JSON.stringify(world);
  famousSeen(world, household.id, 'student'); projectWorld(world, household.id, 'student', { includeMap: false });
  assert.equal(JSON.stringify(world), before, 'seeing the famous changed the world');
  // A live battle draws its own famous people; the map does not draw them again.
  const field = fieldAt('alamo', 'alarm', 2);
  const onField = peopleOnFields(field.world);
  assert.ok(onField.has('travis') && onField.has('joe'));
});

test('a fate is never sent before its minute, and nothing of a later phase is sent', () => {
  for (const one of Object.values(PEOPLE)) {
    const fate = one.fate;
    if (!fate || fate.told || fate.byFall) continue;
    const early = fieldAt(fate.battle, fate.phase, Math.max(0, fate.at - 1));
    const shown = personIn(early.view, one.id);
    if (fate.at > 0) assert.ok(!shown?.fell && !shown?.hurt, `${one.id}'s fate is sent a minute early`);
    // Nobody of a later phase is in this one's projection.
    const def = ENGAGEMENTS[fate.battle], index = def.phases.findIndex(p => p.id === fate.phase);
    const drawnNow = new Set((def.phases[index].people || []).map(entry => entry.id));
    for (const person of early.view.people || []) assert.ok(drawnNow.has(person.id) || Number.isFinite(person.fell), `${person.id} is sent from another phase`);
  }
});
