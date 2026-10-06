// A volunteer away at the war (owner, 2026-10-05; docs/MILITARY_EXPERIENCE.md, "Away at the war").
//
// "When my character reached Gonzales I never received a notification that he was participating in battle. I went to check
// on him and he was just standing around in town doing nothing ... They should have food on them, not be pulling from the
// home supply."
//
// Phase 1: a far family's volunteer standing in Gonzales when the men go up the river goes with them, is alerted through
// himself with a Watch, stands in the line and is given the account; one who rides in after it is told it by the men in the
// town; and nobody away at the war is counted in what the family at home eats.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, goingFor, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { dailyDraw } from '../sim/hunger.mjs';
import { eatenADay } from '../sim/family.mjs';
import { awayWithTheArmy } from '../sim/acting.mjs';
import { overhear } from '../sim/militia.mjs';
import { CAMP_CHORES } from '../sim/camp.mjs';
import { panelActions } from '../public/family-panel.js';
import { establishTruth } from '../sim/knowledge.mjs';
import { dateOf } from '../sim/clock.mjs';
import * as ARMY from '../sim/army.mjs';
import { frailty, rollFates } from '../sim/army.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const letRidersGo = world => {
  for (const one of Object.values(world.encounters || {})) {
    if (one.status !== 'open' || one.kind) continue;
    try { applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ }
  }
};

/**
 * One real-map class: every far family's principal turns out the moment its call is put. In this class the families of Mina
 * reach Gonzales before the men go up the river on the night of October 1 and those of San Felipe after the fight. Snapshots of
 * what each family is sent are kept as it runs, so every test reads the same class.
 */
let played = null;
function warClass() {
  if (played) return played;
  const world = createGonzalesWorld('probe-calls', 15, { map: 'colonies' });
  world.status = 'running';
  const sent = {}, alerts = {}, accounts = {}, draws = {};
  while (world.minute < momentOf(world, 'resolved') + 600) {
    stepWorld(world);
    letRidersGo(world);
    for (const [householdId, call] of Object.entries(world.calls || {})) {
      if (call.status !== 'open' || sent[householdId]) continue;
      const household = world.households[householdId];
      try { applyAction(world, householdId, { action: 'turn-out', entityId: household.principalId }); sent[householdId] = household.principalId; } catch { sent[householdId] = null; }
    }
    for (const householdId of Object.keys(sent)) {
      const seen = view(world, householdId);
      if (seen.battleAlert && !alerts[householdId]) alerts[householdId] = { ...seen.battleAlert, minute: world.minute };
      if (seen.battleAccount && !accounts[householdId]) accounts[householdId] = { ...seen.battleAccount, minute: world.minute };
      // What the family is said to eat a day while its man is away at the war, against everybody else of it.
      const household = world.households[householdId], person = world.entities[sent[householdId] || ''];
      if (person && awayWithTheArmy(world, person) && draws[householdId] === undefined) {
        const home = household.members.map(id => world.entities[id]).filter(one => one.id !== person.id && one.health.condition !== 'dead');
        draws[householdId] = { eat: dailyDraw(world, household).eat, without: eatenADay(world, home) };
      }
    }
  }
  validateWorld(world);
  return (played = { world, sent, alerts, accounts, draws });
}
const settlementOf = (world, householdId) => world.households[householdId].settlementId;

test('a far volunteer in Gonzales when the men go up the river goes with them, is alerted, fights and is given the account', () => {
  const { world, sent, alerts, accounts } = warClass();
  const early = Object.keys(sent).filter(id => settlementOf(world, id) === 'mina' && sent[id]);
  assert.ok(early.length >= 1, 'no family of Mina turned out');
  for (const householdId of early) {
    const id = sent[householdId], person = world.entities[id];
    const march = world.marches[householdId];
    assert.ok(march?.enrolled && march.status === 'accepted' && march.actorIds.includes(id), `${person.name} was not taken up the river`);
    // The alert came through him before contact, with the field to watch.
    const alert = alerts[householdId];
    assert.ok(alert && alert.entityId === id && alert.field, `${person.name}'s family was never alerted`);
    assert.ok(alert.minute < momentOf(world, 'approach'), 'the alert came after the fighting began');
    // In the line while it fired, and the part written down from it.
    const entry = world.battles.gonzales.participants[id];
    assert.ok(Number.isFinite(entry?.fought), `${person.name} was not in the line`);
    assert.equal(world.participation.gonzales[id]?.role, 'fought');
    // The account afterwards, through him, saying he goes back to the volunteers' camp.
    assert.ok(accounts[householdId]?.entityId === id, `${person.name}'s family was never told what he saw`);
    assert.match(accounts[householdId].text, /volunteers' camp/);
    // Back in Gonzales, still away at the war.
    assert.equal(person.location.siteId, 'gonzales');
    assert.ok(awayWithTheArmy(world, person), `${person.name} came back from the fight as if home`);
  }
});

test('a far volunteer who rides into Gonzales after the fight is told it there, and the family knows how it ended', () => {
  const { world, sent, accounts } = warClass();
  const late = Object.keys(sent).filter(id => settlementOf(world, id) === 'san-felipe' && sent[id] && world.calls[id].arrived?.[sent[id]] >= momentOf(world, 'resolved'));
  assert.ok(late.length >= 1, 'nobody from San Felipe came after the fight');
  for (const householdId of late) {
    const person = world.entities[sent[householdId]];
    assert.equal(world.battles.gonzales.participants[person.id], undefined);
    const account = accounts[householdId];
    assert.ok(account, `${person.name}'s family was never told`);
    assert.equal(account.title, `What ${person.name} heard in Gonzales`);
    assert.match(account.text, /too late to be in it/);
    assert.ok(world.knowledge.households[householdId]['gonzales-outcome'], 'the family never learned how it ended');
  }
});

test('nobody away at the war is counted in what the family at home eats', () => {
  const { draws } = warClass();
  const measured = Object.values(draws);
  assert.ok(measured.length >= 3);
  for (const { eat, without } of measured) assert.ok(eat <= without + 1e-9, `the family's day counted the man at the war: ${eat} against ${without}`);
});

// ---------------------------------------------------------------------------------------------------------------------------
// Phases 2-6: the camp's work, the militia's powder, the pack, staying, and what he overhears.
// ---------------------------------------------------------------------------------------------------------------------------
const copyOf = () => structuredClone(warClass().world);
/** A far family's volunteer standing in the volunteers' camp at Gonzales, of a family a student plays and is at the screen of. */
function campMan(world, settlement = 'mina') {
  const household = Object.values(world.households).find(one => one.settlementId === settlement && world.calls[one.id]?.status === 'accepted');
  const person = world.entities[world.calls[household.id].actorId];
  household.played = true;
  delete household.absent;
  return { household, person };
}
const workOf = (world, household, person) => view(world, household.id).work[person.id];
const order = (world, household, person, chore) => {
  if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: person.id });
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore });
};
const finishWork = (world, person, limit = 40) => { const id = person.chore?.id; for (let i = 0; i < limit && person.chore?.id === id; i++) stepWorld(world); };

test("the militia bar replaces the home bar: only the camp's work, taken up by himself when idle, done at the volunteers' camp", () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  const offered = workOf(world, household, person);
  assert.ok(offered.length > 0);
  assert.deepEqual(offered.filter(entry => !CAMP_CHORES.includes(entry.id)).map(entry => entry.id), [], 'home work is on his bar');
  // The page draws the militia's bar: the camp's work, coming home, and nothing of the farm or the main person's orders.
  const seen = view(world, household.id).entities.find(one => one.id === person.id);
  assert.ok(seen.militia, 'his row is not told he is away at the war');
  const icons = panelActions({ entity: seen, offered, main: true, homeId: household.homeSiteId });
  assert.ok(icons.some(icon => icon.key === 'send-for'), 'no way to bring him home');
  assert.deepEqual(icons.filter(icon => icon.kind === 'order' && !['send-for', 'stop-chore'].includes(icon.key)).map(icon => icon.key), []);
  // Left alone, he takes up the camp's work himself, and stands at it on the commons, not on the town's point.
  if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: person.id });
  for (let i = 0; i < 4 && !person.chore; i++) stepWorld(world);
  assert.ok(person.chore && CAMP_CHORES.includes(person.chore.id), `${person.name} stood idle in the camp`);
  for (let i = 0; i < 3; i++) stepWorld(world);
  const town = world.map.sites.gonzales;
  assert.ok(Math.hypot(person.location.x - town.x, person.location.y - town.y) > 0.03, `${person.name} is standing on the town's point`);
});

test('a duty picked by the student is done and does what it says: the mess feeds him whole, a turn at a time', () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  delete person.militia.mess;
  order(world, household, person, 'camp-cook');
  assert.equal(person.chore.id, 'camp-cook');
  finishWork(world, person);
  assert.equal(person.militia.fed, Math.floor(world.minute / 1440), 'the mess did not feed him');
  // His turn at the mess comes round again in days, not at once.
  assert.match(workOf(world, household, person).find(entry => entry.id === 'camp-wood').why, /turn at the mess/);
});

test('powder and ball come from the militia, not from home: moulding waits for the lead, then adds to what he carries', () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: person.id });
  // Before October 11 there is no lead in the camp to mould (HIST-TEX-1185).
  assert.match(workOf(world, household, person).find(entry => entry.id === 'camp-bullets').why, /no lead in the camp/);
  // After it, a spell of moulding is more rounds for him and not a grain from the house.
  while (dateOf(world, world.minute).getTime() < Date.UTC(1835, 9, 11)) stepWorld(world);
  person.militia.rounds = 0;
  const home = household.resources.powder;
  order(world, household, person, 'camp-bullets');
  finishWork(world, person);
  assert.equal(person.militia.rounds, 2, 'moulding did not add to his rounds');
  assert.equal(household.resources.powder, home, "the house's powder was spent at the war");
});

test('the pack: he eats from it, not the home store, and with it empty and nothing to feed him he walks home and says why', () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  // Nothing in his pack, no coin, and kept at the drill: the camp's beef is half his day.
  person.militia.pack = 0; household.resources.money = 0;
  const start = world.minute;
  const serving = () => person.commitments.some(one => one.id === 'volunteer' && one.status === 'active');
  while (serving() && world.minute - start < 6 * 1440) {
    if (!person.travel) { person.chore = { id: 'camp-drill', step: 0, wait: 99, doing: 'drilling with the company' }; person.task = 'work'; }
    stepWorld(world);
  }
  assert.ok(world.minute - start <= 3 * 1440, `he stayed ${(world.minute - start) / 1440} days with nothing to eat`);
  assert.equal(person.travel?.to, household.homeSiteId, `${person.name} did not start home`);
  assert.ok(world.events.some(event => event.actorId === person.id && /nothing of his own to eat for 2 days/.test(event.text)), 'the family was not told why he came home');
  assert.ok(person.hunger?.want > 0, 'going short cost him nothing');
  assert.equal(person.militia?.pack || 0, 0, "the family's store filled his pack at the war");
});

test('a pack size the house cannot fill is shut, and the chosen days are taken out of the store when he turns out', () => {
  const world = createGonzalesWorld('probe-calls', 15, { map: 'colonies' });
  world.status = 'running';
  let household = null;
  while (!household && world.minute < 6000) {
    stepWorld(world); letRidersGo(world);
    household = Object.values(world.households).find(one => world.calls?.[one.id]?.status === 'open');
  }
  const person = world.entities[household.principalId];
  const ration = eatenADay(world, [person]);
  household.resources.food = ration * 7 + 0.1;
  // The going popup's food row, from the server (sim/world.mjs `goingFor`): three, seven and fourteen days, never skipped.
  const going = goingFor(world, household.id, person.id, { action: 'turn-out' });
  assert.deepEqual(going.rations.options.map(one => [one.days, one.can]), [[3, true], [7, true], [14, false]]);
  assert.equal(going.oneWay, undefined, 'the popup would be skipped with a food question on it');
  assert.throws(() => applyAction(world, household.id, { action: 'turn-out', entityId: person.id, packDays: 14 }), /food for only/);
  const store = household.resources.food;
  applyAction(world, household.id, { action: 'turn-out', entityId: person.id, packDays: 7 });
  assert.ok(Math.abs(store - household.resources.food - ration * 7) < 1e-6, `${store} became ${household.resources.food}`);
  assert.ok(Math.abs(person.militia.pack - ration * 7) < 1e-6);
});

test('staying in Gonzales: work for hire paid in whole reales, board that feeds and roofs him; and any of the family sent home', () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  const coin = household.resources.money || 0;
  for (let i = 0; i < 2; i++) { order(world, household, person, 'town-wages'); finishWork(world, person); }
  assert.equal((household.resources.money || 0) - coin, 1, 'two days for hire did not pay the family a real');
  order(world, household, person, 'town-board');
  finishWork(world, person);
  assert.equal(person.militia.shelter, 'board');
  assert.equal(person.militia.fed, Math.floor(world.minute / 1440));
  // Sent for when he is not the main person: he walks home, his promise ended.
  household.mainId = household.members.find(id => id !== person.id && world.entities[id].kind === 'person');
  if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: person.id });
  applyAction(world, household.id, { action: 'send-for', entityId: person.id });
  assert.equal(person.travel?.to, household.homeSiteId);
  assert.ok(!person.commitments.some(one => one.id === 'volunteer' && one.status === 'active'));
});

test("what he overhears: what the place has heard and the family has not, said over two of the camp's men and known from then; never more", () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  // Word of Goliad taken a week ago has walked to Gonzales; word of a fight an hour old at Béxar has not.
  establishTruth(world, { id: 'goliad-taken', text: 'The volunteers took Goliad.', siteId: 'goliad', classification: 'DOCUMENTED' });
  world.truth['goliad-taken'].minute = world.minute - 7 * 1440;
  establishTruth(world, { id: 'concepcion-fight', text: 'A fight at Concepción.', siteId: 'bexar', classification: 'DOCUMENTED' });
  delete world.knowledge.households[household.id]['goliad-taken'];
  delete world.knowledge.households[household.id]['concepcion-fight'];
  delete world.heardAt;
  assert.ok(awayWithTheArmy(world, person));
  overhear(world);
  const known = world.knowledge.households[household.id]['goliad-taken'];
  assert.ok(known, 'the family never heard what was said in the camp');
  assert.match(known.source, /Heard it said at Gonzales/);
  // However long he stays and listens, nothing the place has not heard.
  for (let i = 0; i < 4; i++) { delete world.heardAt; overhear(world); }
  assert.equal(world.knowledge.households[household.id]['concepcion-fight'], undefined, 'the family heard news the place has not');
  // Said on the family's page over two of the camp's men, and on nobody else's.
  const lines = view(world, household.id).townScenes?.lines || [];
  assert.ok(lines.some(line => line.heard && /Goliad/.test(line.text)), 'nothing was said over the camp');
  const other = Object.values(world.households).find(one => one.id !== household.id && world.calls[one.id]?.status === 'accepted');
  assert.ok(!(view(world, other.id).townScenes?.lines || []).some(line => line.heard), 'another family read what was said to this one');
});

test("three days of drill at the volunteers' camp steady a man in the autumn's rolled fights, and nobody who never drilled moves", () => {
  const world = copyOf();
  const { person } = campMan(world);
  const plain = { ...structuredClone(person), id: `${person.id}-plain` }; delete plain.militia;
  const drilled = { ...structuredClone(person), id: `${person.id}-plain`, militia: { drilled: 3 } };
  // The weight itself: three quarters of his frailty, the rule of Houston's camp; a man who never drilled weighs his frailty.
  assert.ok(Math.abs(ARMY.militiaSteadiness(drilled) - frailty(drilled) * 0.75) < 1e-9);
  assert.equal(ARMY.militiaSteadiness(plain), frailty(plain));
  // And it is what the autumn's fights roll against by default: the same seeded roll (the same id and event), a death rate just
  // past where it kills the undrilled man, spares the drilled one.
  const fateAt = (one, death) => { world.entities[one.id] = one; return rollFates(world, [one.id], { event: 'drill-check', death, wound: 0 })[0].fate; };
  let low = 0, high = 1;
  for (let i = 0; i < 40; i++) { const mid = (low + high) / 2; if (fateAt(plain, mid) === 'killed') high = mid; else low = mid; }
  const death = Math.min(1, high * 1.1);
  assert.equal(fateAt(plain, death), 'killed');
  assert.notEqual(fateAt(drilled, death), 'killed', 'the drill counted for nothing in the roll');
});

test("an enlisted man - the garrison shut in the Alamo - overhears nothing for his family: the war's word reaches it by its own couriers", () => {
  const world = copyOf();
  const { household, person } = campMan(world);
  // Put in the garrison at Béxar, as sim/alamo.mjs does: the army's man, no longer a volunteer of the gathering.
  const site = world.map.sites.bexar;
  Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' }, service: { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' } });
  assert.ok(awayWithTheArmy(world, person));
  establishTruth(world, { id: 'alamo-siege', text: 'The Alamo is besieged.', siteId: 'bexar', classification: 'DOCUMENTED' });
  world.truth['alamo-siege'].minute = world.minute - 7 * 1440;
  delete world.knowledge.households[household.id]['alamo-siege'];
  for (let i = 0; i < 3; i++) { delete world.heardAt; overhear(world); }
  assert.equal(world.knowledge.households[household.id]['alamo-siege'], undefined, 'the family heard the siege through its man inside');
  assert.ok(!world.events.some(event => event.actorId === person.id && /heard men talking/.test(event.text)), 'the man in the garrison overheard for his family');
});
