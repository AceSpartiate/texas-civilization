// San Jacinto on the battle engine (docs/BATTLES.md §8, docs/battle-research/staging.md §8; owner 2026-09-25).
//
// The staging and its timing; every way a man used to be late, miss it or "fight" without being there, each fixed
// (staging.md §8.6 a-h); the line, the fates at their moments, the alert, who is sent what, the capture of Santa Anna,
// the account and the families turning home; a save in the middle of it and an old save with none of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, phaseOffset, projectBattle, schedule, heldByBattle } from '../sim/battle-stage.mjs';
import { SAN_JACINTO_BATTLE } from '../sim/battles/san-jacinto.mjs';
import { houstonCamp, fightSanJacinto } from '../sim/houston.mjs';
import { joinService } from '../sim/winter.mjs';
import { withFamily, overtake, PRISONER_SHARE } from '../sim/road.mjs';
import { share } from '../sim/scrape.mjs';
import { armiesNow } from '../sim/armies.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { grownMen, momentOf, seedFor, serve, spring, until, untilMoment, view } from './support/san-jacinto.mjs';

const STUDY_SECONDS = 9.5;
const ID = 'san-jacinto';
const DEF = SAN_JACINTO_BATTLE;
const at = (world, phase) => momentOf(world, DEF.startKey) + phaseOffset(DEF, phase);
const copy = value => JSON.parse(JSON.stringify(value));
/** A family's man with Houston at Harrisburg before the army marches for Lynchburg, and the class stepped to `phase`. */
// `played`: the men's families are played and present, so the fight's lead-up and aftermath are held for them as a watching
// student's are (docs/BATTLES.md §2b.11); a family nobody plays has them pass at the class's own pace.
function withTheArmy(count = 3, phase = 'arrive', { played = false } = {}) {
  const world = spring();
  untilMoment(world, 'houston-harrisburg');
  until(world, () => houstonCamp(world) === 'harrisburg');
  const men = grownMen(world).slice(0, count).map(man => serve(world, man, 'harrisburg'));
  if (played) for (const man of men) { world.households[man.householdId].played = true; delete world.households[man.householdId].absent; }
  until(world, () => world.minute >= at(world, phase));
  return { world, men };
}

test('San Jacinto stands on the director\'s clock: the armies meet April 20, the parade at half past three, the battle at half past four, Santa Anna brought in on the 22nd, over with the word', () => {
  checkEngagement(DEF);
  assert.equal(ENGAGEMENTS[ID], DEF);
  const world = spring();
  const day = minute => new Date(Date.UTC(1835, 8, 28, 6) + minute * 60000).toISOString().slice(0, 16);
  assert.equal(day(at(world, 'arrive')), '1836-04-20T12:00');
  assert.equal(day(at(world, 'skirmish')), '1836-04-20T16:00');
  assert.equal(day(at(world, 'morning')), '1836-04-21T09:00', 'Cos did not come in about nine');
  assert.equal(day(at(world, 'parade')), '1836-04-21T15:30', 'the parade is not at half past three');
  // The old moments did not move: the battle at half past four, Santa Anna the 22nd, the word the 23rd.
  assert.equal(at(world, 'volley'), momentOf(world, 'san-jacinto'));
  assert.equal(day(momentOf(world, 'san-jacinto')), '1836-04-21T16:30');
  assert.equal(at(world, 'taken'), momentOf(world, 'santa-anna-taken'));
  assert.equal(day(momentOf(world, 'santa-anna-taken')), '1836-04-22T12:00');
  const phases = schedule(DEF, momentOf(world, DEF.startKey));
  assert.equal(phases.at(-1).to, momentOf(world, 'victory-word'), 'the engagement does not end with the word of it');
  // "About eighteen minutes from the time of close action until we were in possession of the enemy's encampment" (Houston).
  assert.equal(phaseOffset(DEF, 'killing') - phaseOffset(DEF, 'volley'), 18);
});

test('the fighting plays three to six real minutes at the Study pace, the clock lands on every watched phase and never runs faster for it', () => {
  const { world } = withTheArmy(1, 'camped', { played: true });
  const seen = {};
  let last = world.minute;
  const quiet = calendarMinutes(world);
  while (world.minute < momentOf(world, 'victory-word')) {
    const before = world.minute, phase = battleState(world, ID).phase;
    stepWorld(world);
    const step = world.minute - before;
    if (phase.step) assert.ok(step <= phase.step, `${phase.id} ran ${step} minutes a tick, more than its ${phase.step}`);
    assert.ok(step <= Math.max(quiet, 720), 'the battle ran the clock faster');
    const now = battleState(world, ID);
    if (!now || now.over) break;
    seen[now.phase.id] = (seen[now.phase.id] || 0) + 1;
    if (now.phase.id !== battleState({ ...world, minute: before }, ID)?.phase?.id && now.phase.step) assert.equal(world.minute, now.phase.from, `the clock did not land on the start of ${now.phase.id}`);
    last = world.minute;
  }
  const fighting = ['guns', 'volley', 'charge', 'rout', 'killing'].reduce((sum, id) => sum + (seen[id] || 0), 0);
  const seconds = fighting * STUDY_SECONDS;
  assert.ok(seconds >= 180 && seconds <= 360, `the fighting played ${seconds} seconds at Study (${JSON.stringify(seen)})`);
  for (const id of ['parade', 'advance', 'guns', 'volley', 'charge', 'rout', 'killing', 'taken']) assert.ok(seen[id] >= 1, `${id} was never on the screen`);
  assert.ok(last > 0);
});

test('the Emily West picnic is a dated, explicitly traditional scene visible only to battle witnesses', () => {
  const { world, men } = withTheArmy(1, 'waiting');
  assert.equal(view(world, undefined, 'host').battle.legendScene, undefined, 'the afternoon scene began before its stated hour');
  until(world, () => world.minute >= at(world, 'waiting') + 120);
  const host = view(world, undefined, 'host');
  const witness = view(world, men[0].householdId);
  assert.equal(host.battle.phase, 'waiting');
  assert.equal(host.battle.legendScene?.id, 'emily-west-picnic');
  assert.equal(host.battle.legendScene?.kind, 'tradition');
  assert.equal(host.battle.legendScene?.claimId, 'HIST-TEX-560');
  assert.equal(witness.battle?.legendScene?.id, 'emily-west-picnic');
  assert.match(host.battle.caption, /later story|tradition/i);
  assert.ok(!DEF.phases.find(phase => phase.id === 'morning').legendScene, 'the picnic appeared before the afternoon');
  assert.ok(!DEF.phases.find(phase => phase.id === 'rout').legendScene, 'the picnic outlived the attack');
  assert.equal(DEF.phases.find(phase => phase.id === 'guns').legendScene?.moment, 'alarm');
});

test('the formed Texian line against the camp at rest; the line comes apart at the breastwork and both sides are a rout; the documented cries, the tune as tradition, nobody named given words', () => {
  const phase = id => DEF.phases.find(one => one.id === id);
  for (const id of ['parade', 'advance', 'guns', 'volley']) assert.equal(phase(id).texian.style, 'ranks', `${id}: the Texians are not the formed side`);
  for (const id of ['camped', 'night', 'morning', 'waiting', 'parade', 'advance']) assert.equal(phase(id).mexican.style, 'camp', `${id}: the Mexican camp is not at rest`);
  assert.equal(phase('guns').mexican.ragged, true, 'the Mexicans form in haste, and raggedly');
  assert.equal(phase('charge').texian.style, 'loose');
  assert.equal(phase('rout').texian.style, 'rout'); assert.equal(phase('rout').mexican.style, 'rout');
  assert.ok(phase('rout').mexican.surrendering > 0 && phase('killing').mexican.surrendering > phase('rout').mexican.surrendering);
  const lines = DEF.phases.flatMap(one => (one.lines || []).map(line => ({ ...line, phase: one.id })));
  const alamo = lines.filter(line => line.text === 'Remember the Alamo!'), goliad = lines.filter(line => line.text === 'Remember Goliad!');
  assert.ok(alamo.length && alamo.every(line => line.kind === 'documented' && line.claimId === 'HIST-TEX-522'), 'the war-cry is not documented to Houston\'s report');
  assert.ok(goliad.length && goliad.every(line => line.kind === 'documented' && line.claimId === 'HIST-TEX-523'));
  assert.ok(alamo.some(line => line.phase === 'charge'));
  assert.equal(lines.find(line => line.text === 'Me no Alamo!')?.kind, 'tradition');
  assert.ok(lines.every(line => !line.name), 'a named person was given a line');
  assert.ok(lines.filter(line => line.side === 'mexican' && /[¡¿]/.test(line.text)).every(line => line.gloss), 'Spanish without its English');
  // The tune (owner's J3): named in the caption as tradition, both versions, no sound.
  assert.match(phase('advance').caption, /Will You Come to the Bower/);
  assert.match(phase('advance').caption, /fifer/); assert.match(phase('advance').caption, /fiddlers/); assert.match(phase('advance').caption, /tradition/);
  // "Siesta" is the Handbook's word, said as that and not as the game's own.
  assert.match(phase('waiting').caption, /Handbook of Texas calls it the afternoon siesta/);
  assert.ok(!DEF.phases.filter(one => one.id !== 'waiting').some(one => /siesta/i.test(one.caption)));
  // Houston and Santa Anna are named only in the scene of the capture, and say nothing.
  assert.deepEqual(phase('taken').parley.people.map(person => person.name), ['Houston', 'Santa Anna']);
  assert.equal(phase('taken').parley.people[0].pose, 'injured');
  // The drawn falls are the record's shares: about 630 of about 1,200 Mexicans killed, and of 910 Texians nine and thirty.
  const falls = side => DEF.phases.flatMap(one => one.falls || []).filter(fall => fall.side === side && !fall.unit);
  const mexican = falls('mexican').reduce((sum, fall) => sum + fall.count, 0) / DEF.sides.mexican.drawn;
  assert.ok(Math.abs(mexican - 630 / 1200) < 0.06, `${(mexican * 100).toFixed(0)} in 100 of the drawn Mexicans fall`);
  assert.ok(falls('texian').reduce((sum, fall) => sum + fall.count, 0) <= 3);
  // The killing at the marsh is drawn as the battles are (owner, docs/BATTLES.md §2b.2): figures fall there.
  assert.ok((phase('killing').falls || []).length >= 3);
});

test('presence by place: only the men standing at the Lynchburg camp are in the line; a man stranded at an old camp is not rolled and is told so', () => {
  const { world, men } = withTheArmy(3, 'arrive');
  const [inLine, , stranded] = men;
  assert.ok(men.every(man => man.location.siteId === 'lynchburg' && !man.travel), 'the forced march did not bring every well man to Lynchburg by noon on the 20th');
  // Stranded at Burnett's, where the army last sent nobody: before this, still rolled as a fighter.
  const burnetts = world.map.sites.burnetts;
  stranded.location = { x: burnetts.x, y: burnetts.y, siteId: 'burnetts' };
  stranded.service.siteId = 'harrisburg';
  untilMoment(world, 'san-jacinto');
  stepWorld(world);
  assert.ok(inLine.service.fate, 'a man in the line was not rolled');
  assert.equal(stranded.service.fate, undefined, 'a man who was not there was rolled as a fighter');
  assert.equal(stranded.service.absent, 'road');
  assert.ok(world.battles[ID].participants[inLine.id]?.fought, 'the man in the line did not fire with it');
  assert.equal(world.battles[ID].participants[stranded.id], undefined);
  assert.equal(world.glory[inLine.householdId].awards[`san-jacinto:${inLine.id}`]?.role, 'fought');
  assert.equal(world.glory[stranded.householdId]?.awards?.[`san-jacinto:${stranded.id}`], undefined, 'a man not there was given a part in it');
  untilMoment(world, 'victory-word'); stepWorld(world);
  assert.ok(world.events.some(event => event.actorId === stranded.id && /had not reached the army at San Jacinto/.test(event.text)));
  validateWorld(world);
});

test('the army\'s march to Lynchburg takes every well man at Harrisburg there by the 20th; a sick man stays with the baggage, is present and not in the line, and is said so', () => {
  const world = spring();
  untilMoment(world, 'houston-harrisburg');
  until(world, () => houstonCamp(world) === 'harrisburg');
  const [well, sick] = grownMen(world).slice(0, 2).map(man => serve(world, man, 'harrisburg'));
  sick.health = { condition: 'sick', recoversAt: world.minute + 10 * 1440 };
  untilMoment(world, 'houston-lynchburg'); stepWorld(world);
  assert.ok(sick.service.baggage, 'the sick man was not left with the baggage');
  assert.equal(sick.travel, null, 'the sick man marched with the army');
  assert.ok(world.events.some(event => event.actorId === sick.id && /stays behind at Harrisburg with the baggage/.test(event.text)));
  until(world, () => world.minute >= at(world, 'arrive'));
  assert.equal(well.location.siteId, 'lynchburg');
  // Well again at Harrisburg, and still not taken on: he stays with the baggage (owner's J1).
  sick.health = { condition: 'well' };
  untilMoment(world, 'san-jacinto'); stepWorld(world);
  assert.equal(sick.location.siteId, 'harrisburg');
  assert.equal(sick.service.fate, undefined); assert.equal(sick.service.absent, 'baggage');
  assert.equal(world.glory[sick.householdId].awards[`san-jacinto:${sick.id}`]?.role, 'present');
  // His family is sent nothing of the fight: he is eight miles off with the baggage.
  if (sick.householdId !== well.householdId) {
    const shown = view(world, sick.householdId);
    assert.equal(shown.battle, null); assert.ok(!shown.battleAlert);
  }
  untilMoment(world, 'victory-word'); stepWorld(world);
  const account = world.events.find(event => event.householdId === sick.householdId && /What happened/.test(event.text));
  assert.match(account.text, /left sick with the baggage at Harrisburg/);
  validateWorld(world);
});

test('a man who joins at a camp the army has left keeps that camp and follows it at the forced march; one who arrives after the battle is told the real place', () => {
  const world = spring();
  untilMoment(world, 'houston-harrisburg');
  until(world, () => houstonCamp(world) === 'harrisburg');
  const [late, after] = grownMen(world);
  const burnetts = world.map.sites.burnetts;
  late.travel = null; late.chore = null; late.location = { x: burnetts.x, y: burnetts.y, siteId: 'burnetts' };
  const household = world.households[late.householdId];
  joinService(world, household, late, 'houston');
  assert.equal(late.service.siteId, 'burnetts', 'the joiner was given the camp he never reached, and left standing');
  assert.ok(world.events.some(event => event.actorId === late.id && /marched on to Harrisburg/.test(event.text)));
  late.service.leave = 'no'; late.service.road = 'no';
  stepWorld(world);
  assert.equal(late.travel?.to, 'harrisburg', 'the joiner did not follow the army from the old camp');
  assert.equal(late.travel.forced, true);
  until(world, () => world.minute >= at(world, 'parade'));
  assert.equal(late.location.siteId, 'lynchburg', 'the joiner never reached the army before the battle');
  untilMoment(world, 'san-jacinto'); stepWorld(world);
  assert.ok(late.service.fate, 'the joiner did not fight');
  // After the battle: nobody joins, and the man is told where he got to, not "Gonzales".
  const lynchburg = world.map.sites.lynchburg;
  after.travel = null; after.chore = { id: 'join-houston' }; after.location = { x: lynchburg.x, y: lynchburg.y, siteId: 'lynchburg' };
  joinService(world, world.households[after.householdId], after, 'houston');
  const said = world.events.filter(event => event.actorId === after.id).at(-1).text;
  assert.match(said, /reached Lynchburg after the battle was fought/);
  assert.ok(!/Gonzales/.test(said));
  validateWorld(world);
});

test('a man can set out to join Houston from the family\'s refuge or its road east, the control says when he would be with the army, and he is in the line', () => {
  const world = spring();
  stepWorld(world);
  // The road: the first Gonzales family, told to leave, sets out east with the wagon.
  const household = Object.values(world.households).find(one => one.settlementId === 'gonzales' && one.flight?.status === 'ordered') || Object.values(world.households).find(one => one.flight?.status === 'ordered');
  assert.ok(household, 'no family is told to leave at dawn on March 14');
  household.played = true;
  const main = world.entities[household.mainId || household.principalId];
  household.resources = { ...household.resources, food: 20 };
  applyAction(world, household.id, { action: 'flee', entityId: main.id, take: { food: 20 }, refuge: 'san-felipe' });
  stepWorld(world);
  const man = household.members.map(id => world.entities[id]).find(one => one.kind === 'person' && one.sex === 'male' && (one.age ?? 0) >= 16 && one.travel?.purpose === 'flee');
  assert.ok(man, 'no grown man is on the road with the family');
  household.mainId = man.id;
  const offered = view(world, household.id).work[man.id]?.find(entry => entry.id === 'join-houston');
  assert.ok(offered?.can, `joining from the road was refused: ${offered?.why}`);
  // And from a refuge: another family, camped at San Felipe.
  const camped = Object.values(world.households).find(one => one !== household && one.members.some(id => { const p = world.entities[id]; return p.kind === 'person' && p.sex === 'male' && (p.age ?? 0) >= 16 && !p.service && p.health.condition === 'well'; }));
  const felipe = world.map.sites['san-felipe'];
  for (const id of camped.members) { const p = world.entities[id]; if (p.kind !== 'person') continue; p.travel = null; p.chore = null; p.location = { x: felipe.x, y: felipe.y, siteId: 'san-felipe' }; }
  camped.flight = { ...(camped.flight || {}), status: 'refuged', refuge: 'san-felipe', crossed: [] };
  const campedMan = camped.members.map(id => world.entities[id]).find(p => p.kind === 'person' && p.sex === 'male' && (p.age ?? 0) >= 16 && !p.service && p.health.condition === 'well');
  const fromRefuge = view(world, camped.id).work[campedMan.id]?.find(entry => entry.id === 'join-houston');
  assert.ok(fromRefuge?.can, `joining from the refuge was refused: ${fromRefuge?.why}`);
  assert.match(fromRefuge.cost, /would be with the army at/);
  assert.match(offered.cost, /would be with the army at .+ about (March|April) \d+/, `no arrival on the control: ${offered.cost}`);
  applyAction(world, household.id, { action: 'chore', entityId: man.id, chore: 'join-houston', mode: 'foot' });
  assert.ok(man.travel && man.travel.purpose !== 'flee', 'he did not leave the family\'s road for the army');
  assert.ok(!withFamily(world, household).people.includes(man));
  until(world, () => man.service?.kind === 'houston', 2000);
  assert.equal(man.service?.kind, 'houston', 'he never joined the army');
  man.service.leave = 'no'; man.service.road = 'no';
  until(world, () => world.minute >= at(world, 'parade'));
  assert.equal(man.location.siteId, 'lynchburg', 'the man who joined from the road was not at the battle');
  untilMoment(world, 'san-jacinto'); stepWorld(world);
  assert.ok(man.service.fate, 'the man who joined from the road did not fight');
  validateWorld(world);
});

test('a family refuged at Lynchburg: a man with the army camped there is not with his family, is not taken when the column comes, and does not eat its food', () => {
  const world = spring();
  untilMoment(world, 'houston-lynchburg');
  const man = grownMen(world).find(one => share(world, one.id, 'overtaken') < PRISONER_SHARE);
  const household = world.households[man.householdId];
  serve(world, man, 'lynchburg');
  const site = world.map.sites.lynchburg;
  for (const id of household.members) {
    const one = world.entities[id];
    if (one === man || one.kind !== 'person' || ['dead', 'captured'].includes(one.health.condition)) continue;
    one.travel = null; one.chore = null; one.location = { x: site.x, y: site.y, siteId: 'lynchburg' };
  }
  household.flight = { ...(household.flight || {}), status: 'refuged', refuge: 'lynchburg', crossed: [] };
  assert.ok(!withFamily(world, household).people.includes(man), 'the serving man was counted with his refugee family');
  overtake(world, household, { id: 'santa-anna', name: 'Santa Anna’s column', toward: 'lynchburg' });
  assert.notEqual(man.health.condition, 'captured', 'a man serving with the army was taken prisoner with his refugee family');
  assert.equal(man.service.status, 'serving');
  validateWorld(world);
});

test('from the parade the men of the families are in the line, held there, in the ranks and firing with it; the alert comes through each before contact, and nobody else is told', () => {
  const { world, men } = withTheArmy(3, 'arrive');
  stepWorld(world);
  const [first] = men;
  const early = view(world, first.householdId);
  assert.ok(early.battle && early.battle.id === ID, 'the family with a man in the camp was not sent the armies facing each other');
  assert.ok(early.battleAlert && /Santa Anna's army has come up/.test(early.battleAlert.text) && early.battleAlert.field, 'no alert when the armies met');
  assert.match(early.battleAlert.text, /side/);
  // Before the parade he may still be sent for; from the parade, not.
  assert.equal(heldByBattle(world, first), null);
  until(world, () => world.minute >= at(world, 'parade'));
  stepWorld(world);
  assert.ok(world.battles[ID].participants[first.id], 'he did not fall in at the parade');
  assert.ok(heldByBattle(world, first), 'he could be sent away from the line');
  assert.throws(() => applyAction(world, first.householdId, { action: 'winter-recall', entityId: first.id }), /Santa Anna's camp/);
  const parade = view(world, first.householdId);
  assert.equal(parade.battleAlert?.title, 'The attack at San Jacinto');
  assert.match(parade.battleAlert.text, /Parade under arms/);
  assert.equal(parade.battle.contact, false, 'the alert came only once the fighting had begun');
  // In the ranks: near the Texian centre, in the members, and the line itself formed.
  until(world, () => world.minute >= at(world, 'guns'));
  const guns = view(world, first.householdId);
  const texian = guns.battle.sides.find(side => side.side === 'texian');
  assert.equal(texian.style, 'ranks');
  assert.ok(guns.battle.members.includes(first.id));
  assert.ok(Math.hypot(first.location.x - texian.x, first.location.y - texian.y) < 0.3, 'the man is not in the line');
  // Nobody else: a family with nobody there.
  const lonely = Object.values(world.households).find(one => !men.some(man => man.householdId === one.id) && !one.members.some(id => world.entities[id].service?.kind === 'houston'));
  const other = view(world, lonely.id);
  assert.equal(other.battle, null); assert.ok(!other.battleAlert && !other.battleAccount);
  assert.ok(!JSON.stringify(other).includes(first.id), 'another family was sent the fighter\'s id');
  assert.ok(!/"participants"|"memberFates"|"fates"|"alerted"|"fallen"/.test(JSON.stringify(other)));
  // The Host: live, the camera on the field while a watched phase runs.
  const host = view(world, undefined, 'host');
  assert.equal(host.battle?.id, ID); assert.equal(host.host.focus, 'battle');
  until(world, () => world.minute >= at(world, 'volley') + 1);
  assert.ok(world.battles[ID].participants[first.id].fought);
  validateWorld(world);
});

test('a man killed goes down at his own minute in the charge: his family\'s page and the Host\'s draw it then, nobody else\'s, and his panel and journal wait for the word', () => {
  const { world, men } = withTheArmy(2, 'waiting');
  const [man, other] = men;
  world.seed = seedFor(world, man, 'killed');
  untilMoment(world, 'san-jacinto'); stepWorld(world);
  const entry = world.battles[ID].participants[man.id];
  assert.equal(man.service.fate, 'killed');
  assert.ok(entry.fallsAt > at(world, 'charge') && entry.fallsAt < at(world, 'rout'), `he falls at ${entry.fallsAt}, not in the charge`);
  // Before his minute: nothing of it anywhere.
  assert.equal(view(world, man.householdId).battle.memberFates, undefined, 'his fall was sent before it happened');
  until(world, () => world.minute >= entry.fallsAt);
  const own = view(world, man.householdId);
  assert.deepEqual(own.battle.memberFates?.[man.id], { fate: 'killed', minute: entry.fallsAt });
  assert.equal(view(world, undefined, 'host').battle.memberFates?.[man.id]?.fate, 'killed');
  if (other.householdId !== man.householdId) assert.equal(view(world, other.householdId).battle.memberFates?.[man.id], undefined, 'another family was sent his fall');
  // The panel and the journal do not know yet.
  assert.equal(man.health.condition, 'well');
  assert.ok(!own.events.some(event => /killed/.test(event.text || '')), 'the family\'s journal knew before the word');
  // He lies where he fell while the line goes on.
  const where = { ...man.location };
  until(world, () => world.minute >= at(world, 'killing'));
  assert.deepEqual({ x: man.location.x, y: man.location.y }, { x: where.x, y: where.y }, 'the fallen man was moved on with the line');
  untilMoment(world, 'victory-word'); stepWorld(world);
  assert.equal(man.health.condition, 'dead');
  const card = view(world, man.householdId).battleAccount;
  assert.ok(card && card.entityId !== man.id, 'the account came through the dead man');
  assert.match(card.title, /What became of/);
  assert.match(card.text, /killed in the charge at the breastwork/);
  validateWorld(world);
});

test('Santa Anna is brought before the wounded Houston on the 22nd: the prisoners\' documented cry, both named, neither given words; his column is not drawn beside the battle', () => {
  const { world } = withTheArmy(1, 'arrive', { played: true });
  stepWorld(world);
  assert.ok(!armiesNow(world).some(army => army.id === 'santa-anna'), 'Santa Anna’s column was drawn beside the battle');
  assert.ok(!armiesNow(world).some(army => army.id === 'houston'), 'Houston’s army was drawn twice');
  until(world, () => world.minute >= at(world, 'taken') + 20);
  const host = view(world, undefined, 'host');
  assert.equal(host.battle.phase, 'taken');
  assert.deepEqual(host.battle.parley.people.map(person => person.name), ['Houston', 'Santa Anna']);
  const cry = host.battle.lines.find(line => line.text === '¡El Presidente!');
  assert.ok(cry && cry.kind === 'documented' && cry.claimId === 'HIST-TEX-523' && !cry.name);
  assert.ok(!host.battle.lines.some(line => line.name), 'a named man was given words');
  assert.ok(world.spotlight.key === 'santa-anna-taken' || world.events.some(event => event.type === 'spotlight' && /Santa Anna is found/.test(event.text)));
});

test('afterwards: the account through the man in plain words, the families at their refuges turn for home, the men go home, and the class ends on the road home with the war won', () => {
  const { world, men } = withTheArmy(2, 'arrive');
  // A refugee family camped at Lynchburg with nobody in the fight hears it, in words.
  const lynchburg = world.map.sites.lynchburg;
  const refugees = Object.values(world.households).find(one => !men.some(man => man.householdId === one.id) && !one.members.some(id => world.entities[id].service?.kind === 'houston'));
  for (const id of refugees.members) { const one = world.entities[id]; if (one.kind !== 'person' || ['dead', 'captured'].includes(one.health.condition)) continue; one.travel = null; one.chore = null; one.location = { x: lynchburg.x, y: lynchburg.y, siteId: 'lynchburg' }; }
  refugees.flight = { ...(refugees.flight || {}), status: 'refuged', refuge: 'lynchburg', crossed: [] };
  // A mile and a half off, across the ferry: they do not see the men in the line, who are out on the field.
  until(world, () => world.minute >= at(world, 'rout'));
  assert.ok(!JSON.stringify(view(world, refugees.id)).includes(men[0].id), 'the family at Lynchburg was sent a man who is out on the field');
  untilMoment(world, 'victory-word'); stepWorld(world);
  const heard = world.events.filter(event => event.householdId === refugees.id && /At Lynchburg, .+ hears/.test(event.text));
  assert.ok(heard.length >= 1, 'the family at Lynchburg did not hear the battle');
  assert.equal(view(world, refugees.id).battle, null);
  const [man] = men;
  const card = view(world, man.householdId).battleAccount;
  assert.ok(card, 'no account came');
  assert.match(card.title, new RegExp(`What ${man.name} saw at San Jacinto`));
  for (const part of ['What happened', 'What your family\'s own did', 'Why it ended so', 'eighteen minutes', 'Remember the Alamo', 'Santa Anna was found hiding in the grass']) assert.ok(card.text.includes(part), `the account does not say "${part}"`);
  assert.ok(world.events.some(event => event.householdId === man.householdId && event.text === card.text), 'the journal does not keep the account');
  assert.equal(man.service.status, 'released');
  assert.equal(refugees.flight.status, 'returning', 'the refugee family did not turn for home');
  until(world, () => world.director.complete);
  assert.ok(world.events.some(event => event.type === 'slice-preserved' && /Santa Anna was taken the next day/.test(event.text)));
  assert.equal(view(world, undefined, 'host').ending.host.canContinue, false);
});

test('a class saved in the middle of San Jacinto reopens in the middle of it; one saved before the engine gains it from the clock; no save version moves; a Host\'s jump crosses the quiet night but not the fight', () => {
  const { world } = withTheArmy(1, 'night');
  const quiet = resolveTimeJump(world, 120);
  assert.ok(quiet.advancedMinutes > 0 || quiet.blockedBy?.startsWith('military'), `the quiet night could not be jumped: ${quiet.blockedBy}`);
  const long = resolveTimeJump(world, 3 * 1440);
  assert.equal(long.advancedMinutes, 0); assert.equal(long.blockedBy, `battle:${ID}`, 'a jump ran over the parade');
  until(world, () => world.minute >= at(world, 'charge') + 2);
  const saved = copy(world);
  assert.equal(battleState(saved, ID).phase.id, 'charge');
  assert.deepEqual(projectBattle(saved, ID, {}).sides, projectBattle(world, ID, {}).sides);
  // An old save: no record of San Jacinto at all.
  const old = copy(world);
  delete old.battles[ID];
  stepWorld(old);
  assert.ok(old.battles[ID], 'an old save was not given the fight from the clock');
  stepWorld(world);
  assert.equal(battleState(old, ID).phase.id, battleState(world, ID).phase.id, 'the old save reopened somewhere else in the fight');
  assert.equal(old.minute, world.minute);
  assert.ok(!('saveVersion' in world));
  validateWorld(old);
});

test('the invented country has no San Jacinto: nothing is armed, and fightSanJacinto still rolls presence by place', () => {
  const world = spring();
  const [man] = grownMen(world);
  serve(world, man, 'lynchburg');
  const map = world.map;
  world.map = { ...map, sites: { ...map.sites } };
  delete world.map.sites.lynchburg;
  stepWorld(world);
  assert.equal(world.battles?.[ID], undefined);
  world.map = map;
  fightSanJacinto(world, null);
  assert.ok(man.service.fate, 'a man at Lynchburg was not rolled');
});
