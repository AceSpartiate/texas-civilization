// San Patricio and Agua Dulce Creek on the battle engine (sim/south.mjs, sim/battles/san-patricio.mjs, -agua-dulce.mjs;
// docs/BATTLES.md §6.14, docs/battle-research/staging.md §4).
//
// What it holds: both fights are data the engine checks, dated where the record puts them (San Patricio at three on February
// 27, Agua Dulce at half past ten on March 2) and played for minutes a class can watch; a man sent south is at San Patricio,
// in the force before the first shot, or with Grant's party on the road south; his fate is the roll it always was and lands at
// its own staged moment inside the fighting, on nobody's screen before then and in nobody's reports before the word; nobody
// can be sent for once the fight has begun, and the refusal tells nothing; the Host sees it live, a family with somebody there
// sees it and is alerted, and a family with nobody there is sent nothing; afterwards the escaped ride for Goliad, the prisoners
// are marched south, and the family is told in plain words when the word comes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepWorld, validateWorld, projectWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, schedule } from '../sim/battle-stage.mjs';
import { SAN_PATRICIO } from '../sim/battles/san-patricio.mjs';
import { AGUA_DULCE } from '../sim/battles/agua-dulce.mjs';
import { SOUTH_RATES, share } from '../sim/alamo.mjs';
import { frailty } from '../sim/army.mjs';
import { recallRefusal, winterRefusal } from '../sim/winter.mjs';
import { southFate, southProjection } from '../sim/south.mjs';
import { dateOf } from '../sim/clock.mjs';
import { PACES } from '../server/app.mjs';
import { momentOf, sendSouth, until, untilMoment, winterClass } from './support/south.mjs';

const copy = value => JSON.parse(JSON.stringify(value));
const hour = (world, minute) => { const d = dateOf(world, minute); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const student = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
/** Put somebody where they serve, as if they had walked there (tests/alamo.test.mjs's own helper). */
const serve = (world, person, siteId) => {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind: 'matamoros', status: 'serving', since: world.minute, siteId };
};
const grownMen = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16 && !['dead', 'captured'].includes(person.health.condition));

let many = null;
/** Fourteen men at San Patricio before Grant rides, so both parties and every fate are in the class; stepped to the night. */
const southClass = () => copy(many ??= (() => {
  const world = winterClass();
  const men = grownMen(world).slice(0, 14);
  for (const man of men) serve(world, man, 'san-patricio');
  return { world, men: men.map(man => man.id) };
})());

test('both fights are data the engine checks: nobody named speaks, no row is drawn, and the dead are the record\'s', () => {
  for (const def of [SAN_PATRICIO, AGUA_DULCE]) {
    assert.equal(ENGAGEMENTS[def.id], def, `${def.id} is not on the engine`);
    checkEngagement(def);
    for (const line of def.phases.flatMap(phase => phase.lines || [])) {
      assert.equal(line.name, undefined, `${line.id} is put in a named man's mouth`);
      assert.notEqual(line.kind, 'documented', `${line.id}: no words of these fights are documented`);
    }
    // Neither side stood in rows (staging.md §4.3): no phase draws ranks.
    for (const phase of def.phases) for (const side of ['texian', 'mexican']) {
      assert.notEqual(phase[side].style, 'ranks', `${def.id} ${phase.id} ${side} in ranks`);
      for (const part of phase[side].parts || []) assert.notEqual(part.style, 'ranks');
    }
  }
  const dead = def => def.phases.flatMap(phase => phase.falls || []).filter(fall => fall.side === 'texian').reduce((sum, fall) => sum + fall.count, 0);
  assert.equal(dead(SAN_PATRICIO), 8, 'San Patricio: TSHA\'s eight killed');
  assert.equal(dead(AGUA_DULCE), 14, 'Agua Dulce: the fourteen of twenty-six not taken or escaped');
  // The engine refuses what the record does not allow: a named man given a reconstructed line; parts drawing more men than
  // the side has; a fall in a part that is not there.
  const bad = change => { const def = copy(SAN_PATRICIO); def.ground = SAN_PATRICIO.ground; def.scenery = SAN_PATRICIO.scenery; change(def); return () => checkEngagement(def); };
  assert.throws(bad(def => { def.phases[1].lines[1].name = 'Johnson'; }), /named person/);
  assert.throws(bad(def => { def.phases[1].texian.parts[0].drawn = 30; }), /draw more/);
  assert.throws(bad(def => { def.phases[1].falls[0].part = 'the-church'; }), /names no part/);
});

test('San Patricio is fought at three in the morning of February 27, Agua Dulce at half past ten on March 2, and the day never moves', () => {
  const world = winterClass();
  const sp = schedule(SAN_PATRICIO, momentOf(world, SAN_PATRICIO.startKey)), ad = schedule(AGUA_DULCE, momentOf(world, AGUA_DULCE.startKey));
  const from = (phases, id) => phases.find(phase => phase.id === id).from;
  assert.equal(hour(world, from(sp, 'night')), '2/27 1:00');
  assert.equal(hour(world, from(sp, 'surprise')), '2/27 3:00');
  assert.equal(from(sp, 'surprise'), momentOf(world, 'san-patricio'), 'the old moment and the fight disagree');
  assert.equal(hour(world, from(sp, 'yield') + 5), '2/27 3:15', 'over within a quarter of an hour');
  assert.equal(hour(world, from(ad, 'drive')), '3/2 5:30');
  assert.equal(hour(world, from(ad, 'ambush')), '3/2 10:30');
  assert.equal(from(ad, 'ambush'), momentOf(world, 'agua-dulce'), 'Agua Dulce is not at half past ten');
});

test('each fight plays three to six real minutes at the Study pace, and the clock never runs faster for it', () => {
  const { world } = southClass();
  for (const [id, def] of [['san-patricio', SAN_PATRICIO], ['agua-dulce', AGUA_DULCE]]) {
    until(world, () => world.battles?.[id] && battleState(world, id)?.live && world.minute >= battleState(world, id).contact);
    const state = battleState(world, id);
    // The fighting: from the first shot until the clock is let go at twenty minutes a tick again.
    const released = state.phases.find(phase => phase.from >= state.contact && (!phase.step || phase.step >= 20));
    let ticks = 0;
    const faster = [];
    while (world.minute < released.from) {
      const step = calendarMinutes(world);
      if (step > 20) faster.push(step);
      stepWorld(world); ticks++;
    }
    assert.deepEqual(faster, [], `${id}: the fight let the clock run past twenty minutes a tick`);
    const real = ticks * PACES.study / 1000;
    assert.ok(real >= 180 && real <= 360, `${id}: the fighting took ${ticks} ticks, ${real} real seconds at the Study pace`);
    assert.ok(def.phases.some(phase => phase.contact));
  }
});

test('a man sent south is at San Patricio, and in the force before the first shot, or rides with Grant and drives the horses north', () => {
  const world = winterClass();
  const { sent } = sendSouth(world, 5);
  assert.ok(sent.length >= 4, `only ${sent.length} families could send a man south`);
  untilMoment(world, 'grant-rides');
  for (const man of sent) {
    assert.equal(man.service?.kind, 'matamoros', `${man.name} did not join`);
    assert.ok(['san-patricio', 'matamoros-road'].includes(man.location.siteId) || man.travel?.to === 'matamoros-road', `${man.name} is at ${man.location.siteId}, not San Patricio`);
  }
  untilMoment(world, 'san-patricio');
  const sp = world.battles['san-patricio'];
  const johnson = sent.filter(man => man.service.party === 'san-patricio');
  assert.ok(johnson.length, 'nobody sent was in Johnson\'s party: the class wants another seed');
  for (const man of johnson) {
    const entry = sp.participants[man.id];
    assert.ok(entry, `${man.name} was not in the force at San Patricio`);
    assert.ok(entry.joined < momentOf(world, 'san-patricio'), `${man.name} joined the force after the first shot`);
    assert.ok(Math.hypot(man.location.x - world.map.sites['san-patricio'].x, man.location.y - world.map.sites['san-patricio'].y) < 0.3, `${man.name} is not in the town`);
  }
  const grant = sent.filter(man => man.service.party === 'agua-dulce' || man.service.escapedFrom === 'agua-dulce');
  // The charge by the fight's own clock, not the director's moment (tests the fight's hour separately).
  until(world, () => world.battles?.['agua-dulce'] && battleState(world, 'agua-dulce')?.fighting);
  const charge = battleState(world, 'agua-dulce').contact;
  for (const man of grant) {
    const entry = world.battles['agua-dulce'].participants[man.id];
    assert.ok(entry && entry.joined < charge, `${man.name} was not with Grant's party before the charge`);
    const ground = world.map.sites['agua-dulce'];
    assert.ok(Math.hypot(man.location.x - ground.x, man.location.y - ground.y) < 1, `${man.name} was not at the creek when the dragoons came`);
  }
  validateWorld(world);
});

test('the join is refused, in words, once a man could not reach San Patricio before the raid, and offered before', () => {
  const world = winterClass();
  const household = Object.values(world.households).find(one => one.settlementId && one.settlementId !== 'victoria');
  const man = household.members.map(id => world.entities[id]).find(person => person.sex === 'male' && (person.age ?? 30) >= 16);
  assert.equal(winterRefusal(world, household, man, 'join-matamoros'), null, 'the join was refused in January');
  untilMoment(world, 'san-patricio-night');
  // Three days before the raid, far off: too late.
  const later = copy(world);
  later.minute = momentOf(later, 'san-patricio-night') - 3 * 1440;
  later.director.milestones = Object.fromEntries(Object.entries(later.director.milestones).filter(([key]) => momentOf(later, key) <= later.minute));
  const why = winterRefusal(later, later.households[household.id], later.entities[man.id], 'join-matamoros');
  assert.match(why || '', /would not reach Johnson's men at San Patricio before the end of the month/);
});

test('each man\'s fate is the roll it always was, lands at its own moment inside the fight, and is on no screen and in no report before', () => {
  const { world: again, men } = southClass();
  const fates = { killed: 0, captured: 0, escaped: 0 };
  const seen = {};
  const ids = men;
  // Tick by tick through both fights, checking every tick.
  for (let t = 0; t < 6000 && !(again.battles?.['agua-dulce'] && battleState(again, 'agua-dulce')?.over); t++) {
    stepWorld(again);
    for (const id of ids) {
      const person = again.entities[id], fight = person.service?.fight || person.service?.escapedFrom;
      const fate = fight && again.battles[fight]?.fates?.[id];
      if (!fate) continue;
      if (again.minute < fate.at) assert.equal(person.service.fate, undefined, `${person.name}'s fate landed before its moment`);
      else if (!seen[id]) {
        seen[id] = true;
        // The same roll sim/alamo.mjs `fightSouth` makes: frailty-weighted death, the record's shares.
        const rates = SOUTH_RATES[fight], dies = 1 - (1 - rates.killed) ** frailty(person), roll = share(again, id, fight);
        assert.equal(fate.fate, roll < dies ? 'killed' : roll < dies + rates.captured ? 'captured' : 'escaped');
        assert.equal(fate.fate, southFate(again, person, fight));
        fates[fate.fate]++;
      }
      // Nobody's health says it before the word.
      if (again.minute < momentOf(again, fight === 'san-patricio' ? 'san-patricio-news' : 'agua-dulce-news')) assert.ok(!['dead', 'captured'].includes(person.health.condition), `${person.name} is ${person.health.condition} before the word`);
      // On the wire: a fate is sent only once it has happened.
      const state = again.battles[fight] && battleState(again, fight);
      if (state?.live) {
        const view = student(again, person.householdId).battle;
        if (view?.id === fight) {
          const sent = view.memberFates?.[id];
          if (again.minute < fate.at) assert.equal(sent, undefined, `${person.name}'s fate went on the wire before it happened`);
          else assert.equal(sent?.fate, fate.fate);
        }
      }
    }
  }
  assert.ok(Object.keys(seen).length >= 10, `only ${Object.keys(seen).length} of fourteen men were resolved in the fights`);
  assert.ok(fates.killed && fates.captured && fates.escaped, `the class did not see every fate: ${JSON.stringify(fates)}`);
  // After the word, the dead are dead and the prisoners prisoners; the escaped are Fannin's at Goliad.
  until(again, () => again.director.milestones['agua-dulce-news']);
  for (const id of ids) {
    const person = again.entities[id];
    const fight = person.service.fight || person.service.escapedFrom;
    const fate = again.battles[fight]?.fates?.[id]?.fate;
    if (!fate) continue;
    if (fate === 'escaped') { assert.equal(person.service.kind, 'fannin'); assert.equal(person.service.escapedFrom, fight); }
    else assert.equal(person.health.condition, fate === 'killed' ? 'dead' : 'captured', `${person.name} is ${person.health.condition}, not ${fate}`);
  }
  validateWorld(again);
});

test('nobody can be sent for once the fight begins, and the refusal says nothing of what became of them', () => {
  const { world, men } = southClass();
  const person = world.entities[men[0]];
  assert.equal(recallRefusal(person, world), null, 'a man at San Patricio in January could not be sent for');
  untilMoment(world, 'san-patricio');
  const inFight = men.map(id => world.entities[id]).filter(one => one.service?.fight === 'san-patricio');
  assert.ok(inFight.length);
  for (const one of inFight) assert.match(recallRefusal(one, world), /nobody can reach/i);
  until(world, () => world.minute >= momentOf(world, 'san-patricio') + 20);
  for (const one of inFight.filter(man => man.service.kind === 'matamoros')) {
    const why = recallRefusal(one, world);
    assert.match(why, /No word has come from San Patricio/);
    assert.doesNotMatch(why, /kill|dead|captur|prisoner|escap|got away/i, 'the refusal told the family his fate');
  }
});

test('the Host sees each fight live and is framed on it; a family with a man there sees it and is alerted; a family with nobody there is sent nothing', () => {
  const world = winterClass();
  const { sent, home } = sendSouth(world, 4);
  const nobody = home[0];
  let hostLive = 0, hostFramed = 0, alerted = new Set(), watched = new Set();
  for (let t = 0; t < 20000 && world.minute < momentOf(world, 'agua-dulce') + 90; t++) {
    stepWorld(world);
    const live = ['san-patricio', 'agua-dulce'].find(id => world.battles?.[id] && battleState(world, id)?.live);
    if (!live) continue;
    const shown = host(world);
    if (shown.battle?.id === live) hostLive++;
    if (shown.host?.focus === 'battle') hostFramed++;
    for (const man of sent) {
      const view = student(world, man.householdId);
      if (view.battle) watched.add(man.householdId);
      if (view.battleAlert) { alerted.add(man.householdId); assert.match(view.battleAlert.text, new RegExp(`At ${man.name}'s side`)); assert.ok(view.battleAlert.field); }
      // Nothing from a phase to come: its caption, a later line.
      if (view.battle) {
        const text = JSON.stringify(view.battle);
        const state = battleState(world, view.battle.id);
        for (const phase of state.phases.filter(one => one.from > world.minute)) assert.ok(!text.includes(phase.caption), `${phase.id}'s caption was sent early`);
        for (const line of view.battle.lines) assert.ok(line.minute <= world.minute);
        assert.doesNotMatch(text, /"participants"|"fates"|"outcome"/);
      }
    }
    const theirs = student(world, nobody.id);
    assert.equal(theirs.battle, null, 'a family with nobody there was sent the fight');
    assert.equal(theirs.battleAlert, undefined, 'a family with nobody there was alerted');
  }
  assert.ok(hostLive > 30 && hostFramed > 20, `the Host saw ${hostLive} ticks live, framed on ${hostFramed}`);
  assert.ok(watched.size >= 1 && alerted.size >= 1, 'no family with a man there saw or was alerted to its fight');
});

test('afterwards the escaped ride for Goliad and the prisoners are marched south; at the word each family is told in plain words, and nobody else', () => {
  const { world, men } = southClass();
  until(world, () => world.director.milestones['agua-dulce-news']);
  const households = new Set(men.map(id => world.entities[id].householdId));
  for (const id of men) {
    const person = world.entities[id];
    const fight = person.service.fight || person.service.escapedFrom;
    const fate = world.battles[fight]?.fates?.[id];
    if (!fate) continue;
    if (fate.fate === 'escaped') assert.ok(person.location.siteId === 'goliad' || person.travel?.to === 'goliad', `${person.name} escaped and did not go to Goliad`);
    if (fate.fate === 'captured') assert.ok(person.location.siteId === 'matamoros-road' || person.travel?.to === 'matamoros-road', `${person.name} was taken and not marched south`);
    const told = world.battles[fight].told[person.householdId];
    assert.ok(told, `${person.name}'s family was not told of ${fight}`);
    assert.match(told.text, /What happened:/); assert.match(told.text, /What yours did:/); assert.match(told.text, /Why it ended so:/);
    assert.match(told.text, /do not agree/, 'the disputes are not said');
    assert.ok(told.text.includes(person.name));
    const said = fate.fate === 'killed' ? /killed/ : fate.fate === 'captured' ? /(prisoner|sent south toward Matamoros)/ : /(Goliad)/;
    assert.match(told.text, said);
  }
  for (const household of Object.values(world.households)) {
    if (households.has(household.id)) continue;
    for (const id of ['san-patricio', 'agua-dulce']) assert.equal(world.battles[id]?.told?.[household.id], undefined, 'a family with nobody there was told an account');
  }
  // The card through the family, the day the word comes.
  const withAccount = [...households].map(id => southProjection(world, id, 'student')).filter(one => one?.account);
  assert.ok(withAccount.length >= 1, 'no family had the account on its card');
});

test('a class saved in the middle of San Patricio reopens there, and one saved before the engine gains the fight from the clock', () => {
  const { world } = southClass();
  until(world, () => world.battles?.['san-patricio'] && battleState(world, 'san-patricio')?.phase?.id === 'houses');
  const saved = copy(world);
  validateWorld(saved);
  assert.deepEqual(host(saved).battle, host(world).battle);
  stepWorld(world); stepWorld(saved);
  assert.deepEqual(saved.battles, world.battles);
  const old = copy(world);
  delete old.battles;
  validateWorld(old);
  stepWorld(old);
  assert.ok(old.battles['san-patricio'], 'the old save gained no record of the fight');
});
