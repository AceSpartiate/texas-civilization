// The storming of Béxar on the engine (sim/battles/bexar-storming.mjs, sim/bexar-fight.mjs; docs/BATTLES.md §2b.3; docs/
// battle-research/staging.md §3).
//
// What it holds: the fight is checked data, staged on the town the map draws; it stands on the director's clock as four held
// episodes of about twelve real minutes at the Study pace, with the town fighting at a slower pace between them only while a
// played family has somebody in it; a yes to Milam walks from the mill at three into the town, before contact, and stands in
// a division doing what it does; a yes to the camp's companies walks in on the 8th before the Priest's House; the white flag
// comes whether or not the companies were asked for; a man who is hit is hit at a moment inside the fighting on a day weighted
// by Johnson's own daily losses, falls where he stands, and his family learns it only when the word comes; the Host watches it
// live, a family with somebody in the town or at the mill watches it, and nobody else is sent any of it; nothing is sent before
// it happens; a save reopens where it was; and afterwards each family with somebody there is told, through that person, what
// happened, what they did and why it ended so.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { BEXAR_OFFSETS, BEXAR_STORMING, MILL_OFFSET } from '../sim/battles/bexar-storming.mjs';
import { FATE_DAYS, fateMoment } from '../sim/bexar-fight.mjs';
import { SIEGE_CAMPS, stormingFate } from '../sim/army.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { PACES } from '../server/app.mjs';
import { BEXAR_LAYOUT, bexarToSite } from '../public/bexar-layout.js';
import { answerAsPlayed, bexarClass, momentOf, TIMELINE } from './support/bexar.mjs';

const ID = 'bexar-storming';
const copy = value => JSON.parse(JSON.stringify(value));
const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const phaseOf = world => battleState(world, ID)?.phase?.id;
const startOf = (world, id) => battleState(world, ID).phases.find(phase => phase.id === id).from;
const hour = minute => { const date = new Date(Date.UTC(1835, 8, 28, 6) + minute * 60000); return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`; };
const HELD = { entry: ['roll', 'out', 'feint', 'entry', 'cannonade'], milam: ['karnes', 'yard', 'milam'], priests: ['priests-house'], flag: ['flag', 'truce'] };

/** A seed under which this person's roll in the storming comes out as `want` (and, for a wound, `grade`). */
function seedFor(person, want, grade) {
  for (let n = 0; n < 5000; n++) {
    const seed = `bexar-fate-${n}`;
    const fate = stormingFate({ seed, entities: { [person.id]: person } }, person.id);
    if (fate.fate === want && (!grade || fate.grade === grade)) return seed;
  }
  throw new Error(`no seed makes ${person.id} ${want}`);
}

/**
 * A class played from the morning of December 4 to its end, sampled every tick. `roles` as tests/support/bexar.mjs; `fate`
 * picks a seed under which the fighter is killed, or wounded with a grade.
 */
const runs = new Map();
function run(label, { roles = ['fighter', 'reserve', 'reinforce', 'home'], fate = null, stopAt = null } = {}) {
  if (runs.has(label)) return runs.get(label);
  let seed = `bexar-run-${label}`;
  if (fate) {
    const probe = bexarClass('probe', roles).people.fighter[0].person;
    seed = seedFor(probe, fate.fate, fate.grade);
  }
  const { world, people } = bexarClass(seed, roles);
  const samples = [];
  const end = stopAt ? momentOf(world, stopAt) : momentOf(world, 'bexar-end');
  for (let i = 0; i < 4000 && world.minute < end && world.status === 'running'; i++) {
    answerAsPlayed(world, people);
    const before = { minute: world.minute, phase: phaseOf(world), live: Boolean(battleState(world, ID)?.live), step: calendarMinutes(world), where: {} };
    for (const [role, list] of Object.entries(people)) before.where[role] = { ...world.entities[list[0].person.id].location };
    stepWorld(world);
    const live = Boolean(battleState(world, ID)?.live);
    const sample = { from: before.minute, minute: world.minute, step: world.minute - before.minute, phase: live ? phaseOf(world) : null, phaseBefore: before.live ? before.phase : null, where: {}, travel: {}, views: {} };
    for (const [role, list] of Object.entries(people)) {
      const person = world.entities[list[0].person.id];
      sample.where[role] = { ...person.location }; sample.travel[role] = Boolean(person.travel);
      sample.moved = sample.moved || {};
      sample.moved[role] = Math.hypot(person.location.x - before.where[role].x, person.location.y - before.where[role].y);
      if (live) {
        const seen = view(world, list[0].household.id);
        sample.views[role] = { battle: seen.battle && { phase: seen.battle.phase, members: seen.battle.members, memberFates: seen.battle.memberFates || null, memberUnits: seen.battle.memberUnits || null }, alert: seen.battleAlert || null, account: seen.battleAccount || null, text: role === 'home' ? JSON.stringify(seen) : null, seen: [...seen.entities, ...seen.others].map(entity => entity.id) };
      }
    }
    const host = live ? view(world, undefined, 'host') : null;
    sample.host = { battle: host?.battle ? { phase: host.battle.phase, members: host.battle.members.length } : null, focus: host?.host?.focus, spotlight: world.spotlight?.key };
    sample.health = Object.fromEntries(Object.entries(people).map(([role, list]) => [role, world.entities[list[0].person.id].health?.condition || 'well']));
    samples.push(sample);
  }
  const result = { world, people, samples, seed };
  runs.set(label, result);
  return result;
}

test('the storming is checked data: named men speak only what a record gives them, Milam\'s call as tradition, and nobody falls who may not', () => {
  assert.equal(ENGAGEMENTS[ID], BEXAR_STORMING);
  checkEngagement(BEXAR_STORMING);
  const lines = BEXAR_STORMING.phases.flatMap(phase => phase.lines || []);
  for (const line of lines) {
    if (line.name) assert.ok(['documented', 'tradition'].includes(line.kind) && /^HIST-/.test(line.claimId), `${line.name} speaks a ${line.kind} line`);
    assert.doesNotMatch(line.text, /powder is as cheap|line (in|on) the (ground|sand)|who will cross/i, 'a line the research says not to use is spoken');
  }
  // Owner question B2 (a): Milam says his call, drawn as tradition, with the claim row explaining how we know it.
  const milam = lines.find(line => line.name === 'Milam');
  assert.equal(milam.kind, 'tradition'); assert.equal(milam.claimId, 'HIST-TEX-492'); assert.match(milam.gloss, /later/);
  // Condelle's refusal is reported speech, documented, in his own Spanish with the English under it.
  const condelle = lines.find(line => line.name === 'Condelle');
  assert.equal(condelle.kind, 'documented'); assert.equal(condelle.claimId, 'HIST-TEX-491'); assert.ok(condelle.gloss);
  // Milam says nothing where he falls: the yard falls quiet (staging.md §3.4).
  assert.deepEqual(BEXAR_STORMING.phases.find(phase => phase.id === 'milam').lines || [], []);
  // The rules hold: a named man given reconstructed words, the townspeople given a fire or a fall, too many figures, a
  // background pace with a step, each refused when the engagement loads.
  const bad = change => { const def = copy(BEXAR_STORMING); def.ground = BEXAR_STORMING.ground; change(def); return () => checkEngagement(def); };
  const phase = (def, id) => def.phases.find(one => one.id === id);
  assert.throws(bad(def => { phase(def, 'karnes').lines[0].name = 'Karnes'; }), /named person/);
  assert.throws(bad(def => { phase(def, 'karnes').groups.find(group => group.civilians).fire = 'scattered'; }), /townspeople/);
  assert.throws(bad(def => { phase(def, 'karnes').falls.push({ side: 'texian', count: 1, at: 20, claimId: 'HIST-TEX-043', unit: 'townsfolk' }); }), /never drawn hurt/);
  assert.throws(bad(def => { phase(def, 'entry').groups.push({ id: 'crowd', side: 'texian', drawn: 40, style: 'loose', at: 'garza' }); }), /figures/);
  assert.throws(bad(def => { phase(def, 'pinned-6').step = 20; }), /background/);
  assert.throws(bad(def => { phase(def, 'milam').lines = [{ id: 'x', at: 1, side: 'texian', role: 'commander', kind: 'tradition', text: 'x', name: 'Milam' }]; }), /tradition line/);
});

test('the storming is staged on the town the map draws: its houses are the assembly\'s, the mill half a mile north, the Alamo at the east edge', () => {
  const points = new Set(Object.keys(BEXAR_OFFSETS));
  const named = [];
  for (const phase of BEXAR_STORMING.phases) {
    for (const spec of [phase.texian, phase.mexican, ...(phase.groups || [])]) {
      for (const name of [spec.at, spec.from, spec.to, spec.face, ...(spec.keys || []).map(key => key[1])]) if (name && name !== 'away') named.push([phase.id, name]);
    }
    // A flag's rom is the minute it comes out; its place is t or its keys.
    for (const flag of phase.flags || []) for (const name of [flag.at, ...(flag.keys || []).map(key => key[1])]) if (name) named.push([phase.id, name]);
    for (const fall of phase.falls || []) if (fall.point) named.push([phase.id, fall.point]);
    for (const breach of phase.breaches || []) named.push([phase.id, breach.point]);
    for (const name of phase.frame || []) named.push([phase.id, name]);
  }
  for (const gun of BEXAR_STORMING.guns) named.push(['guns', gun.at], ['guns', gun.face]);
  for (const [where, name] of named) assert.ok(points.has(name), `${where} names a point ${name} that is not on the ground`);
  // Every house a unit holds stands on one of the illustrated town's houses (docs/BEXAR_ASSEMBLY.md: staged on the assembly's
  // houses nearest the research's offsets, never labelled).
  const houses = BEXAR_LAYOUT.buildings.map(building => bexarToSite(building));
  for (const name of ['garza', 'veramendi', 'mcdonald', 'karnes', 'row', 'priests', 'hospital']) {
    const at = BEXAR_OFFSETS[name], nearest = Math.min(...houses.map(house => Math.hypot(house.x - at.x, house.y - at.y)));
    assert.ok(nearest < 0.012, `${name} stands ${Math.round(nearest * 5280)} feet from any house of the town`);
  }
  // North of the plaza, and the Garza house nearer the research's +0.02, -0.15 than the plaza is.
  assert.ok(BEXAR_OFFSETS.garza.y < -0.08 && BEXAR_OFFSETS.veramendi.y < -0.05 && BEXAR_OFFSETS.priests.y > -0.08);
  assert.ok(BEXAR_OFFSETS.alamoWest.x > 0.25, 'the Alamo\'s guns are not at the east edge');
  // The mill moved to about 0.45 of a mile north (staging.md §3.1), and the army's camp is that point.
  assert.deepEqual([MILL_OFFSET.dx, MILL_OFFSET.dy], [0, -0.45]);
  assert.deepEqual([SIEGE_CAMPS.mill.dx, SIEGE_CAMPS.mill.dy], [MILL_OFFSET.dx, MILL_OFFSET.dy]);
});

test('the storming stands on the director\'s clock, and its four held episodes play about twelve real minutes at the Study pace', () => {
  const phases = schedule(BEXAR_STORMING, TIMELINE.milam);
  const at = id => phases.find(phase => phase.id === id).from;
  assert.equal(TIMELINE['bexar-roll'], at('roll'));
  assert.equal(TIMELINE.assault, at('feint'));
  assert.equal(TIMELINE['milam-killed'], at('milam'));
  assert.equal(TIMELINE.reinforce, at('row'));
  assert.equal(TIMELINE['cos-marches'], at('marching-out'));
  assert.ok(TIMELINE['white-flag'] >= at('flag') && TIMELINE['white-flag'] < at('parley'), 'the white flag is outside its episode');
  assert.equal(hour(at('call')), '12/4 18:00');
  assert.equal(hour(at('roll')), '12/5 2:00');
  assert.equal(hour(at('out')), '12/5 3:00');
  assert.equal(hour(at('feint')), '12/5 5:00');
  assert.equal(hour(at('karnes')), '12/7 12:00');
  assert.equal(hour(at('milam')), '12/7 15:30');
  assert.equal(hour(at('priests-house')), '12/8 22:00');
  assert.equal(hour(at('flag')), '12/9 6:20');
  assert.equal(hour(at('marching-out')), '12/14 9:00');
  // In a class: the held episodes, tick by tick.
  const { samples } = run('main');
  const seconds = Object.fromEntries(Object.entries(HELD).map(([episode, ids]) => [episode, samples.filter(sample => ids.includes(sample.phaseBefore)).length * PACES.study / 1000]));
  const total = Object.values(seconds).reduce((sum, s) => sum + s, 0);
  assert.ok(total >= 630 && total <= 810, `the four episodes take ${total} real seconds at Study: ${JSON.stringify(seconds)}`);
  for (const [episode, s] of Object.entries(seconds)) assert.ok(s >= 90, `the ${episode} episode is only ${s} seconds`);
  // Every held tick is the phase's own step, or the room left before the next phase: never more.
  for (const sample of samples) {
    const phase = BEXAR_STORMING.phases.find(one => one.id === sample.phaseBefore);
    if (phase?.step) assert.ok(sample.step <= phase.step, `a ${sample.step}-minute tick in ${phase.id}, held at ${phase.step}`);
  }
});

test('between the episodes the town fights on at two hours a tick while a played family has somebody in it, and not otherwise; never faster', () => {
  const background = BEXAR_STORMING.phases.filter(phase => phase.background).map(phase => phase.id);
  const inTown = run('main').samples.filter(sample => background.includes(sample.phaseBefore));
  assert.ok(inTown.every(sample => sample.step <= 120), `a background tick ran past two hours: ${inTown.filter(sample => sample.step > 120).map(sample => sample.step)}`);
  assert.ok(inTown.length >= 40 && inTown.length <= 60, `${inTown.length} background ticks with a family in the town`);
  // With nobody of a played family in the town (only a man at the mill, and a family at home), the four days are not held.
  const nobody = run('reserve-only', { roles: ['reserve', 'home'] }).samples.filter(sample => background.includes(sample.phaseBefore));
  assert.ok(nobody.length < inTown.length / 2, `the town held the class for ${nobody.length} ticks with nobody of a played family in it`);
  // Nor does the storming ever run the clock faster than its own campaign scale.
  assert.ok(run('main').samples.every(sample => sample.step <= 720));
});

test('a yes to Milam walks out of the mill at three and into the town before contact, stands in a division and fights, and cannot be sent away', () => {
  const { world, people, samples } = run('main');
  const fighter = people.fighter[0].person, entry = world.battles[ID].participants[fighter.id];
  const out = startOf(world, 'out'), feint = startOf(world, 'feint'), cannonade = startOf(world, 'cannonade');
  assert.equal(world.army.questions.milam.asks[fighter.id], 'yes');
  assert.ok(entry, 'the man who said yes never went in');
  assert.equal(entry.joined, out, `he left the mill at ${hour(entry.joined)}, not at three`);
  assert.ok(['texian', 'johnson'].includes(entry.division));
  // Walked, never set down: no tick moved him further than a walker goes in it (a mile in twenty minutes of the calendar).
  for (const sample of samples.filter(one => one.minute > out && one.minute <= cannonade)) {
    assert.ok(sample.moved.fighter <= Math.max(0.05, sample.step / 20) + 1e-6, `he jumped ${sample.moved.fighter.toFixed(3)} miles in a ${sample.step}-minute tick at ${hour(sample.minute)}`);
  }
  // At the fence with the column by five, and in the division's house by seven.
  const mill = { x: world.map.sites.bexar.x + MILL_OFFSET.dx, y: world.map.sites.bexar.y + MILL_OFFSET.dy };
  const atFeint = samples.find(sample => sample.minute === feint).where.fighter;
  assert.equal(atFeint.siteId, 'bexar');
  assert.ok(Math.hypot(atFeint.x - mill.x, atFeint.y - mill.y) > 0.12, 'at contact he was still at the mill');
  const house = BEXAR_OFFSETS[entry.division === 'johnson' ? 'veramendi' : 'garza'];
  const atSeven = samples.find(sample => sample.minute === cannonade).where.fighter;
  const off = Math.hypot(atSeven.x - (world.map.sites.bexar.x + house.x), atSeven.y - (world.map.sites.bexar.y + house.y));
  assert.ok(off < 0.06, `at seven he was ${off.toFixed(3)} miles from his division's house`);
  // In the line while it fired, and drawn in his unit on his family's page.
  assert.ok(entry.fought >= startOf(world, 'entry') && entry.fought < cannonade, `he never fought in the entry (${entry.fought})`);
  const drawn = samples.find(sample => sample.phase === 'entry').views.fighter.battle;
  assert.ok(drawn.members.includes(fighter.id));
  assert.equal(drawn.memberUnits[fighter.id], entry.division);
  // Milam's call shut at the roll, so every yes was a man at the mill when the divisions walked out.
  assert.equal(world.army.questions.milam.closed, true);
  // Nobody in the fight can be sent anywhere else until it is over.
  const mid = run('held', { stopAt: 'milam-killed' });
  const man = mid.people.fighter[0];
  assert.throws(() => applyAction(mid.world, man.household.id, { action: 'send-for', entityId: man.person.id }), /fighting in San Antonio/);
  validateWorld(world);
});

test('a yes to the camp\'s companies walks in on the 8th, before the Priest\'s House; the reserve stays at the mill and is never hurt', () => {
  const { world, people, samples } = run('main');
  const man = people.reinforce[0].person, entry = world.battles[ID].participants[man.id];
  assert.equal(world.army.questions.reinforce.asks[man.id], 'yes');
  assert.ok(entry && entry.via === 'reinforce', 'the man who said yes to the camp\'s companies never went in');
  assert.ok(entry.joined >= TIMELINE.reinforce && entry.joined < startOf(world, 'priests-house'));
  const atNight = samples.find(sample => sample.minute === startOf(world, 'priests-house')).where.reinforce;
  const house = BEXAR_OFFSETS.veramendi, bexar = world.map.sites.bexar;
  assert.ok(Math.hypot(atNight.x - (bexar.x + house.x), atNight.y - (bexar.y + house.y)) < 0.06, 'the companies\' man was not in the town by night');
  // The reserve: never in the town, at the mill throughout, present and unhurt.
  const reserve = people.reserve[0].person;
  assert.equal(world.battles[ID].participants[reserve.id], undefined);
  const mill = { x: bexar.x + MILL_OFFSET.dx, y: bexar.y + MILL_OFFSET.dy };
  for (const sample of samples.filter(one => one.minute < TIMELINE['cos-marches'] && one.minute > TIMELINE.milam)) {
    assert.ok(Math.hypot(sample.where.reserve.x - mill.x, sample.where.reserve.y - mill.y) < 0.2, `the reserve's man left the mill at ${hour(sample.minute)}`);
  }
  assert.equal(world.participation['bexar-storming'][reserve.id].role, 'present');
  assert.ok(samples.every(sample => sample.health.reserve === 'well' || sample.health.reserve === 'tired'));
});

test('the white flag comes whether or not the camp\'s companies were ever asked for', () => {
  const { world, people } = bexarClass('bexar-flag-alone', ['fighter', 'home']);
  const until = minute => { for (let i = 0; i < 3000 && world.minute < minute; i++) { answerAsPlayed(world, people); stepWorld(world); } };
  until(TIMELINE.reinforce + 1);
  // The old guard: the flag waited on `ugartechea`, whose own close waited on the reinforce question. Hold that close forever.
  world.army.questions.reinforce.openedMinute = Number.MAX_SAFE_INTEGER / 2;
  until(TIMELINE['white-flag'] + 60);
  assert.equal(world.director.milestones.ugartechea, undefined, 'the test did not hold the reinforcement back');
  assert.equal(world.director.milestones['white-flag'], true, 'the white flag waited on the reinforcement');
  assert.ok(world.army.storming, 'the storming was never resolved');
});

test('a family\'s man who is hit is hit on a day weighted by Johnson\'s losses, at a moment inside the fighting, in a phase that fits', () => {
  const state = { phases: schedule(BEXAR_STORMING, 0) };
  const days = { 5: 0, 6: 0, 7: 0, 8: 0 }, n = 4000;
  const dayOf = minute => 4 + Math.floor((minute + 18 * 60) / 1440);
  for (let i = 0; i < n; i++) {
    const moment = fateMoment({ seed: 'dist' }, `p-${i}`, state, { via: 'milam' });
    const phase = state.phases.find(one => one.id === moment.phase);
    assert.ok(moment.minute >= phase.from && moment.minute < phase.to, `a hit at ${moment.minute} is outside ${phase.id}`);
    assert.ok(phase.contact, `a hit lands in ${phase.id}, where nobody fights`);
    days[dayOf(moment.minute)]++;
  }
  for (const day of FATE_DAYS) assert.ok(Math.abs(days[day.day] / n - day.share) < 0.03, `December ${day.day} took ${(100 * days[day.day] / n).toFixed(1)} in 100 of the hits, not ${100 * day.share}`);
  // A man who came in with the companies on the 8th is hit only on the 8th, after he is in the town.
  for (let i = 0; i < 400; i++) {
    const moment = fateMoment({ seed: 'dist' }, `r-${i}`, state, { via: 'reinforce' });
    assert.equal(dayOf(moment.minute), 8);
    if (moment.phase === 'row') assert.ok(moment.minute - state.phases.find(one => one.id === 'row').from >= 180);
  }
});

test('killed: he falls at his staged moment where he stands, his family watching sees it then and not before, and is told only when the word comes', () => {
  const { world, people, samples } = run('killed', { fate: { fate: 'killed' } });
  const man = people.fighter[0], fate = world.battles[ID].fates[man.person.id];
  assert.equal(fate.fate, 'killed');
  assert.ok(fate.minute < TIMELINE['white-flag'], 'his fate waited for the white flag');
  const phase = BEXAR_STORMING.phases.find(one => one.id === fate.phase);
  assert.ok(phase.contact);
  // Alive until the tick his moment falls in, dead from it.
  const landed = samples.find(sample => sample.health.fighter === 'dead');
  assert.ok(landed && landed.from < fate.minute && landed.minute >= fate.minute, `he died at ${hour(landed?.minute)}, staged for ${hour(fate.minute)}`);
  // Where he stood, in the town - not Béxar's point, as when everything was resolved at the flag.
  const body = world.entities[man.person.id].location, bexar = world.map.sites.bexar;
  assert.ok(Math.hypot(body.x - bexar.x, body.y - bexar.y) > 0.03 && body.siteId === 'bexar', 'he was laid at Béxar\'s point rather than where he fell');
  // His family's page: his fall is sent at his moment, never before.
  for (const sample of samples) {
    const fell = sample.views.fighter?.battle?.memberFates?.[man.person.id];
    if (sample.minute < fate.minute) assert.equal(fell, undefined, `his fall was sent at ${hour(sample.minute)}, before it happened`);
  }
  assert.equal(landed.views.fighter.battle.memberFates[man.person.id].fate, 'killed', 'his family, watching, was not shown him fall');
  // Nothing in the journal says so until the word of the victory; no account comes through him.
  const told = world.events.filter(event => event.householdId === man.household.id && event.type === 'consequence' && /killed/.test(event.text));
  assert.ok(told.length && told.every(event => event.minute >= TIMELINE['bexar-victory']), 'the family was told he was killed before the word came');
  assert.match(told[0].text, /on December \d+/, 'the word does not say which day');
  assert.ok(!samples.some(sample => sample.views.fighter?.account?.entityId === man.person.id), 'an account came through a man who was killed');
});

test('wounded: he falls at his moment, is carried to the house used as a hospital, stays in Béxar, and tells his family through the account', () => {
  const { world, people, samples } = run('wounded', { fate: { fate: 'wounded', grade: 'severe' } });
  const man = people.fighter[0], person = world.entities[man.person.id], fate = world.battles[ID].fates[man.person.id];
  assert.equal(fate.fate, 'wounded');
  const landed = samples.find(sample => sample.health.fighter === 'wounded');
  assert.ok(landed.minute >= fate.minute && landed.from < fate.minute);
  const hospital = { x: world.map.sites.bexar.x + BEXAR_OFFSETS.hospital.x, y: world.map.sites.bexar.y + BEXAR_OFFSETS.hospital.y };
  const later = samples.find(sample => sample.minute > fate.minute + 240);
  assert.ok(Math.hypot(later.where.fighter.x - hospital.x, later.where.fighter.y - hospital.y) < 0.02, 'the wounded man was not carried to the hospital house');
  // Still there when the army goes home.
  assert.equal(person.location.siteId, 'bexar'); assert.equal(person.travel, null);
  const account = samples.map(sample => sample.views.fighter?.account).find(Boolean);
  assert.ok(account && account.entityId === person.id, 'no account came through the wounded man');
  assert.match(account.text, /wounded on December \d+/); assert.match(account.text, /hospital/);
});

test('the Host watches it live and is spotlit on the town for each episode; the family in it and the family at the mill watch; the family at home is sent nothing', () => {
  const { world, people, samples } = run('main');
  const live = samples.filter(sample => sample.phase && sample.minute < startOf(world, 'marching-out') + 120 && sample.minute >= TIMELINE.milam);
  assert.ok(live.every(sample => sample.host.battle), 'the Host was not sent the storming live');
  for (const sample of live) {
    const phase = BEXAR_STORMING.phases.find(one => one.id === sample.phase);
    assert.equal(sample.host.focus, phase.step && phase.contact ? 'battle' : 'regional', `the Host's camera at ${sample.phase}`);
  }
  const spots = new Set(samples.map(sample => sample.host.spotlight));
  for (const key of ['bexar-entry', 'bexar-karnes', 'bexar-milam', 'bexar-priests', 'bexar-flag', 'bexar-cos']) assert.ok(spots.has(key), `no spotlight ${key}`);
  const spot = world.events.find(event => event.type === 'spotlight' && /Karnes/.test(event.text));
  assert.ok(spot, 'the Karnes spotlight is not in the record');
  // The fighter's family sees its man in the force, and only people it already sees there.
  const inTown = live.filter(sample => sample.views.fighter?.battle && ['entry', 'karnes', 'priests-house'].includes(sample.phase));
  assert.ok(inTown.length > 10);
  for (const sample of inTown) assert.ok(sample.views.fighter.battle.members.every(id => sample.views.fighter.seen.includes(id)), 'told of a man in the force it cannot see');
  // The family at the mill watches from there; the family at home sees none of it, before or after a reconnect.
  assert.ok(live.filter(sample => sample.phase === 'entry').every(sample => sample.views.reserve.battle), 'the reserve at the mill was not shown the fight it was beside');
  const secret = new RegExp(`"legacyPhase"|"participants"|"fates"|"memberFates"|"battleAlert"|"battleAccount"|${people.fighter[0].person.id}|${people.reinforce[0].person.id}`);
  for (const sample of live) {
    assert.equal(sample.views.home.battle, null, `the family at home was sent the battle at ${hour(sample.minute)}`);
    assert.ok(!secret.test(sample.views.home.text), `the family at home was sent part of it: ${secret.exec(sample.views.home.text)?.[0]}`);
  }
  const home = people.home[0].household.id;
  assert.equal(view(world, home).battle, null);
});

test('the alert comes through the person before each episode, with Watch on the town; the reserve is told what it hears; nobody else is alerted', () => {
  const { world, people, samples } = run('main');
  const alerts = role => { const seen = new Map(); for (const sample of samples) { const alert = sample.views[role]?.alert; if (alert && !seen.has(alert.id)) seen.set(alert.id, { ...alert, minute: sample.minute }); } return [...seen.values()]; };
  const fighter = alerts('fighter');
  const episode = id => fighter.find(alert => alert.id.endsWith(`:${id}`));
  for (const [id, before] of [['entry', 'feint'], ['karnes', 'afternoon'], ['priests', 'night-8'], ['flag', 'parley']]) {
    const alert = episode(id);
    assert.ok(alert, `no ${id} alert`);
    assert.match(alert.text, new RegExp(`^At ${people.fighter[0].person.name}'s side`));
    assert.ok(alert.minute < startOf(world, before), `the ${id} alert came at ${hour(alert.minute)}`);
    const centre = { x: world.map.sites.bexar.x + 0.1, y: world.map.sites.bexar.y - 0.07 };
    assert.ok(Math.hypot(alert.field.x - centre.x, alert.field.y - centre.y) < 0.1, 'Watch would frame somewhere other than the town');
  }
  assert.ok(episode('entry').minute < startOf(world, 'feint'), 'the entry alert came after contact');
  const reserve = alerts('reserve');
  assert.ok(reserve.some(alert => alert.id.endsWith(':heard') && /cannon fire/.test(alert.text)) && reserve.some(alert => alert.id.endsWith(':flag')));
  assert.ok(!reserve.some(alert => alert.id.endsWith(':karnes')), 'the mill was told of Karnes\'s door as if it were there');
  assert.deepEqual(alerts('home'), []);
  // Each episode's notice is written once.
  const notices = world.events.filter(event => event.type === 'notice' && event.householdId === people.fighter[0].household.id && event.claimId === 'FIC-GONZ-428');
  assert.equal(notices.length, new Set(notices.map(event => event.text)).size);
});

test('a page is sent nothing of the storming that has not happened yet', () => {
  const { world } = bexarClass('bexar-future', ['fighter', 'home']);
  const end = schedule(BEXAR_STORMING, momentOf(world, 'milam')).find(phase => phase.id === 'parley').from + 1;
  const seen = new Set();
  for (let i = 0; i < 3000 && world.minute < end; i++) {
    stepWorld(world);
    const shown = projectBattle(world, ID, { members: [] });
    if (!shown) continue;
    seen.add(shown.phase);
    for (const line of shown.lines) assert.ok(line.minute <= world.minute, `a line from ${line.minute} was sent at ${world.minute}`);
    for (const gun of shown.guns || []) for (const shot of gun.shots) assert.ok(shot <= world.minute, `a shot of ${gun.id} from ${shot} was sent at ${world.minute}`);
    for (const breach of shown.breaches || []) { assert.ok(breach.from <= world.minute); assert.equal(breach.open, breach.at <= world.minute); }
    for (const fall of shown.fallen) assert.ok(fall.minute <= world.minute);
    const text = JSON.stringify(shown);
    assert.doesNotMatch(text, /"phases"|"participants"|"fates"|"outcome"/);
    for (const phase of BEXAR_STORMING.phases.filter(one => one.id !== shown.phase)) assert.ok(!text.includes(phase.caption), `the caption of ${phase.id} was sent during ${shown.phase}`);
  }
  for (const id of ['call', 'roll', 'out', 'feint', 'entry', 'cannonade', 'karnes', 'milam', 'priests-house', 'flag', 'truce']) assert.ok(seen.has(id), `${id} was never seen: ${[...seen]}`);
});

test('a class saved in the middle of the storming reopens in the middle of it; an old save gains it from the clock; no save version moves', () => {
  // A man who comes through unhurt, so he is still in the town when the save is made.
  const probe = bexarClass('probe', ['fighter', 'reserve']).people.fighter[0].person;
  const { world, people } = bexarClass(seedFor(probe, 'unhurt'), ['fighter', 'reserve']);
  for (let i = 0; i < 3000 && world.minute < TIMELINE['milam-killed'] - 30; i++) { answerAsPlayed(world, people); stepWorld(world); }
  assert.equal(phaseOf(world), 'yard');
  const saved = copy(world);
  validateWorld(saved);
  const fighter = people.fighter[0].person.id;
  const members = [fighter];
  assert.deepEqual(projectBattle(saved, ID, { members }), projectBattle(world, ID, { members }));
  stepWorld(world); stepWorld(saved);
  assert.equal(phaseOf(saved), phaseOf(world));
  assert.deepEqual(saved.battles, world.battles);
  assert.deepEqual(saved.entities[fighter].location, world.entities[fighter].location);
  // A class saved before the engine knew the storming: no `world.battles` record of it. It opens, and gains the fight where
  // the clock says it is; the men who said yes to Milam walk into the town from where they stand.
  const old = copy(world);
  delete old.battles[ID];
  validateWorld(old);
  stepWorld(old);
  assert.equal(phaseOf(old), battleState(world, ID, old.minute).phase.id);
  const willing = old.army.members.filter(id => old.army.questions.milam.asks[id] === 'yes' && old.entities[id].health?.condition !== 'dead');
  assert.ok(willing.length && willing.every(id => old.battles[ID].participants[id]), 'the men who said yes to Milam did not go into the town of an old save');
  assert.equal(copy(old).saveVersion, copy(world).saveVersion);
  // A class that fought the storming before this build (the flag already come) gains nobody in the town.
  const done = copy(world);
  delete done.battles[ID];
  done.director.milestones['white-flag'] = true;
  stepWorld(done);
  assert.deepEqual(done.battles[ID].participants, {});
});

test('afterwards each family with somebody there is told through that person what happened, what they did and why; the men go home, the wounded stay', () => {
  const { world, people, samples } = run('main');
  const account = role => samples.map(sample => sample.views[role]?.account).find(Boolean);
  const fighter = account('fighter'), reserve = account('reserve'), reinforce = account('reinforce');
  for (const [role, card] of [['fighter', fighter], ['reserve', reserve], ['reinforce', reinforce]]) {
    assert.ok(card, `the ${role}'s family was given no account`);
    const name = people[role][0].person.name;
    for (const part of ['What happened:', `What ${name} did:`, 'Why it ended so:', 'What comes next:']) assert.ok(card.text.includes(part), `the ${role}'s account has no "${part}"`);
    assert.match(card.text, /Milam was shot/); assert.match(card.text, /Constitution of 1824/); assert.match(card.text, /carrying water/);
    assert.ok(world.events.some(event => event.text === card.text), 'the journal does not keep it');
  }
  assert.match(fighter.text, /division/); assert.match(fighter.text, /loopholes/);
  assert.match(reserve.text, /held the camp at the old mill/);
  assert.match(reinforce.text, /companies sent from the camp on the 8th/);
  assert.equal(account('home'), undefined, 'a family with nobody there was given an account');
  const told = samples.find(sample => sample.views.fighter?.account);
  assert.ok(told.minute >= TIMELINE.capitulation, 'the account came before the capitulation');
  // The army breaks up on the 14th: the man who fought in the town starts home from it.
  const man = world.entities[people.fighter[0].person.id];
  if (man.health?.condition !== 'dead' && man.health?.condition !== 'wounded') assert.ok(man.travel?.to === people.fighter[0].household.homeSiteId || man.location.siteId === people.fighter[0].household.homeSiteId, 'the man who fought did not start home');
  assert.equal(world.status, 'ended');
});
