// Coleto and Palm Sunday on the battle engine (docs/BATTLES.md; docs/battle-research/staging.md §6, §7, §10; sim/fannin.mjs,
// sim/battles/coleto.mjs, sim/battles/goliad-massacre.mjs).
//
// What it holds: both engagements are data checked when they load and dated where the record puts them; Fannin's men march
// out of Goliad with the column and stand in the square; recall shuts when they march, on the director's clock; each man's fate
// falls at a staged moment from the roll the game always made, and a death waits for the word; a man with his horse may ride
// with Horton and get away; on Palm Sunday a man still wounded cannot run, the man who gets away starts home at once and tells
// his own story, and every other family is told at the word; the Host watches live and nobody without a man there is sent
// anything; a save opens where the fight is, with no `saveVersion` moved; and the clock is held to about ten real minutes of
// fighting at Coleto, never faster.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, lyingOnField, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { COLETO } from '../sim/battles/coleto.mjs';
import { GOLIAD_MASSACRE } from '../sim/battles/goliad-massacre.mjs';
import { HORTON_SHARE, massacreFate } from '../sim/fannin.mjs';
import { COLETO as COLETO_RATES } from '../sim/houston.mjs';
import { FANNIN_MARCHES, recallRefusal } from '../sim/winter.mjs';
import { rollFates } from '../sim/army.mjs';
import { share } from '../sim/shares.mjs';
import { TIMELINE } from '../sim/directors.mjs';
import { PACES } from '../server/app.mjs';
import { grownMen, momentOf, reseed, spring, until, withFannin } from './support/fannin.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const copy = value => JSON.parse(JSON.stringify(value));
const hour = minute => { const date = new Date(Date.UTC(1835, 8, 28, 6) + minute * 60000); return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`; };
const coletoFate = (world, man) => rollFates(world, [man.id], { event: 'coleto', ...COLETO_RATES })[0].fate;
const horton = (world, man) => share(world, man.id, 'horton') < HORTON_SHARE;

/**
 * A spring whose first twelve grown men between them meet every fate: killed and wounded at Coleto, escaped and spared on
 * Palm Sunday, one who could ride with Horton. Each of them with Fannin; the one who could ride with Horton has his family's
 * horse. Returns the men and who is who.
 */
function fanninClass({ men: count = 12 } = {}) {
  const world = spring();
  reseed(world, (men, w) => {
    const some = men.slice(0, count);
    const firstHorton = some.find(one => horton(w, one));
    return firstHorton && some.some(one => one !== firstHorton && coletoFate(w, one) === 'killed') && some.some(one => one !== firstHorton && coletoFate(w, one) === 'wounded')
      && some.some(one => one !== firstHorton && coletoFate(w, one) === 'unhurt' && massacreFate(w, one) === 'escaped')
      && some.some(one => one !== firstHorton && coletoFate(w, one) !== 'killed' && massacreFate(w, one) === 'spared')
      && some.some(one => one !== firstHorton && coletoFate(w, one) === 'unhurt' && massacreFate(w, one) === 'executed');
  });
  const men = grownMen(world).slice(0, count);
  const rider = men.find(one => horton(world, one));
  for (const man of men) withFannin(world, man, { horse: man === rider });
  const find = test => men.find(one => one !== rider && test(one));
  return {
    world, men, rider,
    killed: find(one => coletoFate(world, one) === 'killed'),
    wounded: find(one => coletoFate(world, one) === 'wounded'),
    escaper: find(one => coletoFate(world, one) === 'unhurt' && massacreFate(world, one) === 'escaped'),
    spared: find(one => coletoFate(world, one) !== 'killed' && massacreFate(world, one) === 'spared'),
    executed: find(one => coletoFate(world, one) === 'unhurt' && massacreFate(world, one) === 'executed'),
  };
}
const phaseOf = (world, id) => battleState(world, id)?.phase?.id;

test('both are checked when they load and dated where the record puts them: Coleto from nine on March 19, the square at one, the guns at a quarter past six; Palm Sunday\'s volleys at seven', () => {
  assert.equal(ENGAGEMENTS.coleto, COLETO); assert.equal(ENGAGEMENTS['goliad-massacre'], GOLIAD_MASSACRE);
  checkEngagement(COLETO); checkEngagement(GOLIAD_MASSACRE);
  const coleto = schedule(COLETO, TIMELINE['fannin-marches']), at = id => coleto.find(phase => phase.id === id).from;
  assert.equal(hour(at('march-out')), '3/19 9:00');
  assert.equal(hour(at('caught')), '3/19 13:00');
  assert.equal(hour(at('guns')), '3/20 6:15');
  assert.equal(hour(at('surrender')), '3/20 7:00');
  assert.equal(TIMELINE.coleto, at('caught'), 'the old Coleto moment is not the column caught');
  assert.equal(TIMELINE['goliad-surrender'], at('surrender'));
  // Recall shuts at the same minute the column marches (sim/winter.mjs), on the director's clock.
  assert.equal(TIMELINE['fannin-marches'], FANNIN_MARCHES + 1080);
  const palm = schedule(GOLIAD_MASSACRE, TIMELINE['goliad-eve']), on = id => palm.find(phase => phase.id === id).from;
  assert.equal(hour(on('eve')), '3/26 18:00');
  assert.equal(hour(on('muster')), '3/27 6:00');
  assert.equal(hour(on('volleys')), '3/27 7:00');
  assert.equal(TIMELINE['goliad-massacre'], on('volleys'));
  // Both end on the spring's four-hour clock (from dawn on March 14), so every tick after them falls where it always did and
  // the army's dated marches in April land on their days (found by tests/camp.test.mjs, 2026-09-25).
  for (const end of [coleto.at(-1).to, palm.at(-1).to]) assert.equal((end - TIMELINE['scrape-opens']) % 240, 0, `${hour(end)} is off the four-hour clock`);
  // Here the Texians are in the square, and at night the Mexicans are loose in the grass (staging.md §6.3).
  for (const id of ['square', 'assault-1', 'assault-2', 'assault-3', 'night', 'guns']) assert.equal(COLETO.phases.find(phase => phase.id === id).texian.style, 'square', id);
  assert.ok(['dusk', 'night', 'small-hours'].every(id => COLETO.phases.find(phase => phase.id === id).mexican.parts.filter(part => !part.mounted).every(part => part.style === 'loose')));
  // Three assaults, contact each (owner's K3).
  assert.deepEqual(COLETO.phases.filter(phase => /^assault-/.test(phase.id)).map(phase => phase.contact), [true, true, true]);
  // Nothing is said at the killing on Palm Sunday, and no volley there has its words (`FIC-GONZ-438`).
  const volleys = GOLIAD_MASSACRE.phases.find(phase => phase.id === 'volleys');
  assert.equal((volleys.lines || []).length, 0); assert.deepEqual(GOLIAD_MASSACRE.commands, {});
  // Every named speaker says only documented words; Fannin and Urrea say nothing (staging.md §6.4).
  for (const line of [...COLETO.phases, ...GOLIAD_MASSACRE.phases].flatMap(phase => phase.lines || [])) {
    if (line.name) assert.equal(line.kind, 'documented');
    assert.doesNotMatch(`${line.name || ''} ${line.text}`, /Fannin|Urrea|Portilla/, `a named commander is given words: ${line.text}`);
  }
});

test('Fannin\'s men march out of Goliad with the column at nine, walk with it to Coleto and stand in the square when it forms; nobody new joins him', () => {
  const { world, men, rider } = fanninClass();
  const man = men.find(one => one !== rider);
  const goliad = world.map.sites.goliad, coleto = world.map.sites.coleto;
  assert.ok(coleto, 'Coleto is not a place on the map');
  const fromGoliad = one => Math.hypot(one.location.x - goliad.x, one.location.y - goliad.y);
  until(world, () => phaseOf(world, 'coleto') === 'march-out');
  assert.equal(world.minute, momentOf(world, 'fannin-marches'), 'the fight did not start at the march');
  assert.ok(world.battles.coleto.participants[man.id], 'a man with Fannin was not marched out');
  const trail = [];
  until(world, () => { trail.push(fromGoliad(man)); return phaseOf(world, 'coleto') === 'square'; }, 200);
  // He went the whole way on foot a tick at a time, never jumping further than a walk.
  assert.ok(trail.at(-1) > 8, `he is ${trail.at(-1).toFixed(1)} miles from Goliad when the square forms`);
  for (let i = 1; i < trail.length; i++) assert.ok(trail[i] - trail[i - 1] < 3.2, `he jumped ${(trail[i] - trail[i - 1]).toFixed(2)} miles in a tick`);
  until(world, () => phaseOf(world, 'coleto') === 'assault-1', 50);
  stepWorld(world);
  assert.ok(Math.hypot(man.location.x - coleto.x, man.location.y - coleto.y) < 0.12, 'he is not in the square');
  assert.equal(man.location.siteId, 'coleto');
  assert.ok(Number.isFinite(world.battles.coleto.participants[man.id].fought), 'he was not in the line when it fired');
  // He cannot be sent anywhere while it is fought.
  assert.throws(() => applyAction(world, man.householdId, { action: 'chore', entityId: man.id, chore: 'hunt' }), /.+/);
  // K1: nothing a family can do puts a man with Fannin.
  for (const one of grownMen(world).slice(0, 5)) assert.ok(!(view(world, one.householdId).work[one.id] || []).some(entry => /fannin/i.test(entry.id)), 'joining Fannin was offered');
  validateWorld(world);
});

test('recall shuts when the column marches, on the director\'s clock - not eighteen hours before', () => {
  const { world, men, rider } = fanninClass();
  const [early, late] = men.filter(one => one !== rider);
  // The morning of March 19, three hours before nine: the family can still send for him (it shut at noon on the 18th before
  // 2026-09-25, eighteen hours before anybody marched).
  assert.equal(world.minute, momentOf(world, 'fannin-marches') - 180);
  assert.equal(recallRefusal(late, world), null, 'recall was shut before the column marched');
  applyAction(world, early.householdId, { action: 'winter-recall', entityId: early.id });
  assert.equal(early.service.status, 'released');
  until(world, () => world.minute >= momentOf(world, 'fannin-marches'));
  assert.match(recallRefusal(late, world) || '', /marched out of Goliad/);
  assert.throws(() => applyAction(world, late.householdId, { action: 'winter-recall', entityId: late.id }), /Fannin/);
  assert.ok(!world.battles.coleto.participants[early.id], 'a man sent for before the march was marched out anyway');
});

test('each man\'s fate falls at its moment inside the fighting, from the roll the game always made; a wound shows at once, a death waits for the word, and the dead man lies where he fell', () => {
  const { world, men, rider, killed, wounded } = fanninClass();
  until(world, () => phaseOf(world, 'coleto') === 'caught');
  const entries = world.battles.coleto.participants;
  for (const man of men.filter(one => one !== rider)) assert.equal(entries[man.id].fate, coletoFate(world, man), `${man.name}'s fate is not the roll`);
  const moment = entries[killed.id].at, hurt = entries[wounded.id].at;
  assert.match(moment.phase, /^assault-[123]$/, `a death fell outside the assaults: ${moment.phase}`);
  assert.match(hurt.phase, /^(assault-[123]|small-hours)$/);
  // Nothing before its moment, on the man or on the wire.
  until(world, () => world.minute >= moment.minute - 5, 200);
  assert.equal(killed.service.coleto, undefined, 'the fate was set before it fell');
  assert.ok(!view(world, killed.householdId).battle?.down?.[killed.id], 'his fall was sent before it happened');
  until(world, () => world.minute >= moment.minute, 20);
  assert.equal(killed.service.coleto, 'killed');
  assert.equal(killed.health.condition, 'well', 'a death was on the family\'s screen before the word');
  const watching = view(world, killed.householdId);
  assert.equal(watching.battle.down[killed.id].kind, 'killed', 'his own family, watching, did not see him fall');
  const at = { ...killed.location };
  until(world, () => world.minute >= hurt.minute, 400);
  assert.equal(wounded.health.condition, 'wounded', 'a wound did not show');
  until(world, () => battleState(world, 'coleto')?.over, 400);
  // He lies where he fell; the rest are marched back to Goliad, prisoners.
  assert.deepEqual(killed.location, at, 'the dead man was moved');
  assert.ok(lyingOnField(world, killed));
  assert.equal(view(world, killed.householdId).entities.find(one => one.id === killed.id).fallen, true, 'his family\'s map does not show him lying where he fell');
  for (const man of men.filter(one => one !== rider && one !== killed)) {
    assert.equal(man.service.status, 'prisoner');
    assert.equal(man.location.siteId, 'goliad', `${man.name} was not marched back to Goliad`);
  }
  // A prisoner is the family's to send nowhere.
  const prisoner = men.find(one => one !== rider && one !== killed);
  assert.throws(() => applyAction(world, prisoner.householdId, { action: 'chore', entityId: prisoner.id, chore: 'rest' }), /prisoner/);
  // Word of the massacre: now he is dead, on the screen and in the journal.
  until(world, () => world.director.milestones['massacre-word'], 2000);
  assert.equal(killed.health.condition, 'dead');
  assert.equal(lyingOnField(world, killed), null);
  validateWorld(world);
});

test('a man with his own horse may ride with Horton\'s scouts, is cut off in the timber when the column is caught, and rides home; nobody without one does', () => {
  const { world, rider, men } = fanninClass();
  assert.ok(rider, 'no man of this class rides with Horton');
  until(world, () => phaseOf(world, 'coleto') === 'march-out');
  assert.equal(world.battles.coleto.participants[rider.id].horton, true);
  // Nobody on foot is one of Horton's men, whatever his share.
  for (const man of men.filter(one => one !== rider)) assert.ok(!world.battles.coleto.participants[man.id].horton, `${man.name} rode with Horton without a horse`);
  until(world, () => phaseOf(world, 'coleto') === 'square', 200);
  stepWorld(world);
  assert.equal(rider.service.status, 'released');
  assert.equal(rider.service.coleto, 'horton');
  assert.ok(rider.travel?.to === world.households[rider.householdId].homeSiteId, 'Horton\'s man is not riding home');
  assert.equal(rider.travel.mode, 'horse');
  const account = view(world, rider.householdId).battleAccount;
  assert.ok(account && /Horton/.test(account.text) && /What happened:/.test(account.text), 'his family was not told through him what he saw');
  until(world, () => world.director.milestones['massacre-word'], 3000);
  assert.notEqual(rider.health.condition, 'dead', 'Horton\'s man was killed at Goliad');
});

test('Palm Sunday: each prisoner meets the record\'s share at its own moment; a man still wounded cannot run; the man who gets away starts home at once and tells it himself', () => {
  const { world, men, rider, killed, wounded, escaper, spared, executed } = fanninClass();
  until(world, () => phaseOf(world, 'goliad-massacre') === 'eve', 4000);
  const entries = world.battles['goliad-massacre'].participants;
  assert.ok(!entries[killed.id], 'a man killed at Coleto was among the prisoners');
  assert.ok(!entries[rider.id], 'Horton\'s man was among the prisoners');
  for (const man of men.filter(one => entries[one.id])) assert.equal(entries[man.id].fate, massacreFate(world, man));
  // G2: the wounded man is with the wounded, and is killed inside or spared - never runs.
  assert.equal(wounded.health.condition, 'wounded');
  assert.ok(['executed', 'spared'].includes(entries[wounded.id].fate), `a wounded man's fate was ${entries[wounded.id].fate}`);
  if (entries[wounded.id].fate === 'executed') assert.equal(entries[wounded.id].part, 'wounded');
  // Kept back at the muster.
  until(world, () => phaseOf(world, 'goliad-massacre') === 'marched', 200);
  assert.equal(spared.service.fate, 'spared'); assert.equal(entries[spared.id].part, 'kept');
  assert.equal(executed.service.fate, undefined, 'a fate fell before its moment');
  // Shot at one of the volleys, lying where he fell; nothing on his family's screen but what they watched.
  until(world, () => phaseOf(world, 'goliad-massacre') === 'escapes', 200);
  assert.equal(executed.service.fate, 'executed');
  assert.equal(entries[executed.id].down.kind, 'killed');
  assert.equal(executed.health.condition, 'well', 'a death was on the screen before the word');
  // The man who ran: away into the timber, and on his way home at once, telling it himself.
  until(world, () => phaseOf(world, 'goliad-massacre') === 'inside', 50);
  assert.equal(escaper.service.status, 'released');
  assert.equal(escaper.travel?.to, world.households[escaper.householdId].homeSiteId, 'the man who got away did not start home');
  const told = view(world, escaper.householdId).battleAccount;
  assert.ok(told && /broke and ran/.test(told.text) && /Palm Sunday/.test(told.text), 'he did not tell his own story');
  until(world, () => world.director.milestones['massacre-word'], 3000);
  assert.equal(executed.health.condition, 'dead'); assert.equal(spared.health.condition, 'captured');
  assert.notEqual(escaper.health.condition, 'dead');
  validateWorld(world);
});

test('afterwards every other family with a man there is told through whoever hears it at home - Coleto and Goliad together, the escapes, those spared, and "Remember Goliad"', () => {
  const { world, killed, executed, spared } = fanninClass();
  until(world, () => world.director.milestones['massacre-word'], 6000);
  for (const man of [killed, executed, spared]) {
    const account = view(world, man.householdId).battleAccount;
    assert.ok(account, `${man.name}'s family was not told`);
    assert.notEqual(account.entityId, man.id, 'the account came through the man himself, who is not at home');
    for (const part of ['What happened:', `What ${man.name} did:`, 'Why it ended so:', 'square three ranks deep', 'three roads', 'Twenty-eight escaped', 'Francita Alavez', 'Remember Goliad']) assert.ok(account.text.includes(part), `the account has no "${part}"`);
    assert.ok(world.events.some(event => event.householdId === man.householdId && event.text === account.text), 'the journal does not keep it');
  }
  assert.match(view(world, killed.householdId).battleAccount.text, /was killed in the fight on the prairie at Coleto/);
  assert.match(view(world, spared.householdId).battleAccount.text, /spared/);
  // Fannin's last requests are told as what was said afterward, never as fact (`HIST-TEX-519`).
  assert.match(view(world, executed.householdId).battleAccount.text, /It was said afterward that Fannin/);
});

test('who is sent what: the Host always, framed on the field while it is fought; a family only while its man is there; nobody else, not a fate before it falls', () => {
  const { world, men: all, killed, rider } = fanninClass();
  // One family's men are sent home before the march: that family has nobody there, and is never shown any of it.
  const without = Object.keys(world.households).find(id => id !== killed.householdId && id !== rider.householdId);
  for (const man of all.filter(one => one.householdId === without)) {
    const home = world.map.sites[world.households[without].homeSiteId];
    delete man.service; man.location = { x: home.x, y: home.y, siteId: home.id };
  }
  const men = all.filter(one => one.householdId !== without);
  const keys = /"legacyPhase"|"formations"|"participants"|"alerted"|"battleAlert"|"battleAccount"|"fate"/;
  let sampled = 0, framed = 0;
  until(world, () => {
    const live = ['coleto', 'goliad-massacre'].map(id => battleState(world, id)).find(state => state?.live);
    if (live) {
      sampled++;
      const host = view(world, undefined, 'host');
      assert.ok(host.battle && host.battle.id === live.def.id, `the Host was not sent ${live.def.id} at ${world.minute}`);
      if (live.fighting) { assert.equal(host.host.focus, 'battle'); framed++; }
      for (const pass of ['first', 'reconnect']) {
        const seen = view(world, without), text = JSON.stringify(seen);
        assert.equal(seen.battle, null, `a family with nobody there (${pass}) was sent the fight at ${world.minute}`);
        assert.ok(!keys.test(text), `a family with nobody there was sent ${keys.exec(text)?.[0]}`);
        assert.ok(!men.some(man => text.includes(man.id)), 'a family with nobody there was sent a name');
      }
      const own = view(world, killed.householdId);
      if (live.def.id === 'coleto' && !world.battles.coleto.participants[killed.id]?.released) {
        assert.ok(own.battle?.members.includes(killed.id), `his family was not sent the fight he is in at ${world.minute}`);
        for (const [id, down] of Object.entries(own.battle.down || {})) assert.ok(down.minute <= world.minute, `a fall of ${id} was sent before it happened`);
        assert.doesNotMatch(JSON.stringify(own.battle), /"fate"|"at":\{/, 'a fate still to fall rode the wire');
      }
    }
    return world.director.milestones['massacre-word'];
  }, 6000);
  assert.ok(sampled >= 110, `only ${sampled} ticks of the two were sampled`);
  assert.ok(framed >= 50, `the Host's camera was on the field for only ${framed} ticks`);
});

test('the alerts come through the man: Follow on the march, Watch when the column is caught and when the guns open, Follow at the muster; never to a family with nobody there', () => {
  const { world, men: all, rider, killed } = fanninClass();
  // A family whose one man is with Fannin and comes through Coleto (so every card reaches it), and a family with nobody there.
  const family = Object.keys(world.households).find(id => id !== rider.householdId && id !== killed.householdId && all.filter(one => one.householdId === id).length === 1 && coletoFate(world, all.find(one => one.householdId === id)) !== 'killed');
  const man = all.find(one => one.householdId === family);
  const without = Object.keys(world.households).find(id => id !== family && id !== rider.householdId && id !== killed.householdId);
  for (const one of all.filter(person => person.householdId === without)) {
    const home = world.map.sites[world.households[without].homeSiteId];
    delete one.service; one.location = { x: home.x, y: home.y, siteId: home.id };
  }
  const cards = new Map();
  until(world, () => {
    const alert = view(world, man.householdId).battleAlert;
    if (alert && !cards.has(alert.id)) cards.set(alert.id, { ...alert, phase: phaseOf(world, 'coleto') || phaseOf(world, 'goliad-massacre') });
    assert.equal(view(world, without).battleAlert, undefined, 'a family with nobody there was alerted');
    return world.director.milestones['goliad-leave-close'];
  }, 6000);
  const list = [...cards.values()];
  assert.deepEqual(list.map(card => [card.title, card.action]), [['Fannin marches out', 'Follow'], ['Caught on the prairie', 'Watch'], ['The guns at dawn', 'Watch'], ['The prisoners are formed', 'Follow']], JSON.stringify(list.map(card => card.title)));
  for (const card of list) {
    assert.match(card.text, new RegExp(`^At ${man.name}'s side`));
    assert.equal(card.entityId, man.id);
  }
  const coleto = world.map.sites.coleto;
  assert.ok(Math.hypot(list[1].field.x - coleto.x, list[1].field.y - coleto.y) < 0.2, 'Watch would frame somewhere other than the square');
});

test('a class saved in the middle of Coleto reopens in the middle of it, and one saved before the engine gains it from the clock, with no save version moved', () => {
  const { world, men } = fanninClass();
  until(world, () => phaseOf(world, 'coleto') === 'assault-2');
  const saved = copy(world);
  const reopened = copy(saved);
  assert.deepEqual(projectBattle(reopened, 'coleto', { members: [men[1].id] }), projectBattle(world, 'coleto', { members: [men[1].id] }));
  stepWorld(reopened); stepWorld(world);
  assert.deepEqual(projectBattle(reopened, 'coleto', { members: [] }), projectBattle(world, 'coleto', { members: [] }));
  assert.equal(reopened.saveVersion, world.saveVersion);
  // Saved with no record of the engine at all: the fight is found from the clock, where the clock has it.
  const old = copy(saved); delete old.battles;
  stepWorld(old);
  const found = battleState(old, 'coleto');
  assert.ok(found, 'a class saved with no record of the engine was not given the fight');
  assert.equal(found.battle.start, momentOf(old, 'fannin-marches'));
  assert.ok(found.phase.from <= old.minute && (found.over || old.minute < found.phase.to));
  validateWorld(old);
});

test('the clock is held for Coleto: the fighting about ten real minutes at the Study pace, the whole of it under fifteen, never faster than it was going', () => {
  const { world } = fanninClass();
  until(world, () => phaseOf(world, 'coleto') === 'march-out');
  let ticks = 0, fighting = 0;
  const faster = [];
  while (!battleState(world, 'coleto').over) {
    const state = battleState(world, 'coleto');
    const step = calendarMinutes(world);
    if (step > 240) faster.push({ minute: world.minute, step });
    if (state.fighting) fighting++;
    stepWorld(world); ticks++;
  }
  assert.deepEqual(faster, []);
  const real = count => count * PACES.study / 60000;
  assert.ok(real(fighting) >= 8 && real(fighting) <= 12, `the fighting took ${fighting} ticks, ${real(fighting).toFixed(1)} real minutes at the Study pace`);
  assert.ok(real(ticks) <= 15, `Coleto took ${ticks} ticks, ${real(ticks).toFixed(1)} real minutes`);
  // Palm Sunday, eve to the end, about six and a half.
  until(world, () => phaseOf(world, 'goliad-massacre') === 'eve', 4000);
  let palm = 0;
  while (!battleState(world, 'goliad-massacre').over) { stepWorld(world); palm++; }
  assert.ok(real(palm) <= 8, `Palm Sunday took ${palm} ticks, ${real(palm).toFixed(1)} real minutes`);
});
