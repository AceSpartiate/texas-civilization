// The director's part of Concepción and the Grass Fight on the engine (docs/BATTLES.md §6.2 steps 3-5; staged in
// docs/battle-research/staging.md §1 and §2). What sim/directors.mjs does for Gonzales, for these two:
//
//   - the arrival: at Concepción the division actually leaves Espada at two on October 27 and walks to the bend, with every
//     family's person who went with it; at the Grass Fight a yes is a departure, with Bowie's horsemen for a man whose horse
//     is with him or Jack's infantry for a man on foot, and the question shuts when they ride out (`FIC-GONZ-420`, `-421`);
//   - the families' people stood in the force, doing what it does, until the director sends them back to the ranks;
//   - each person's fate resolved at a staged moment inside the fighting, visible to whoever watches (docs/BATTLES.md §2.6,
//     `FIC-GONZ-422`), from the rolls the army already makes (sim/army.mjs `concepcionFate`, `grassFate`);
//   - the alert through the person, with Watch; the Host's spotlight on the field; what each family is sent;
//   - the aftermath: the main army comes up at Concepción and the division rejoins it; at the mill the men go back into camp;
//     and the account in plain words through the person (at Concepción on the day, as the word of it came; at the Grass Fight
//     when the fuller word rides home, `HIST-TEX-034`) (`FIC-GONZ-424`).
//
// Nothing here moves a date or depends on who came: the engagements' own schedules (sim/battles/concepcion.mjs,
// sim/battles/grass-fight.mjs) date everything, and the fixed outcome is theirs.
import { record } from './events.mjs';
import { spotlight } from './host.mjs';
import { calendarMinutes } from './clock.mjs';
import { armBattle, battleState, fatesDue, looseSlot, placeFrom, projectBattle, stageFate } from './battle-stage.mjs';
import { CONCEPCION } from './battles/concepcion.mjs';
import { GRASS_FIGHT } from './battles/grass-fight.mjs';
import {
  OBJECTIVE, closeDetachment, closeQuestion, concepcionFate, concepcionPresent, grassFate, grassPresent, rejoinRanks,
  resolveConcepcionFighter, resolveGrassFighter, tellConcepcionFighter,
} from './army.mjs';
import { modeWith } from './keeping.mjs';

const GONE = ['dead', 'captured'];
const hashOf = key => { let h = 2166136261; for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const phaseOf = (state, id) => state.phases.find(phase => phase.id === id);
/** How far apart a force's people stand, by how it stands, where the engagement gives no spread of its own. */
const SPREADS = { bank: { width: 0.12, depth: 0.03 }, loose: { width: 0.2, depth: 0.12 }, mounted: { width: 0.16, depth: 0.07 }, column: { width: 0.05, depth: 0.28 }, ranks: { width: 0.2, depth: 0.05 }, rout: { width: 0.25, depth: 0.2 } };

/** A class that fought one of these before the engine keeps what it had: the milestone set, and no record of the fight. */
const foughtBeforeTheEngine = (world, id, milestone) => !world.battles?.[id] && Boolean(world.director?.milestones?.[milestone]);

/**
 * Where each of the families' people with a force stands this tick: at their own place in their group, walked to at a
 * walker's pace (a rider's, riding), as Gonzales's `standWithTheForce` does. The fallen do not move, except the dead and
 * wounded carried back under cover once the fighting is past (`carryTo`). Horses are held where the force holds them.
 */
function standInTheForce(world, id, battle, { groupOf, carryTo = null, horses = null, riding = () => false }) {
  const view = projectBattle(world, id, {});
  if (!view) return;
  const bodies = [...view.sides.map(side => ({ ...side, key: side.side })), ...(view.groups || []).map(group => ({ ...group, key: group.id }))];
  const sideOf = key => bodies.find(body => body.key === key);
  const byGroup = {};
  const reach = Math.max(0.05, calendarMinutes(world) / 20);
  const ids = Object.keys(battle.participants).sort();
  for (const personId of ids) {
    const entry = battle.participants[personId], person = world.entities[personId];
    if (!person || entry.released) continue;
    // A fate staged for later is nobody's business yet (sim/battle-stage.mjs `stageFate`): only one that has fallen moves them.
    const fate = battle.fates?.[personId]?.applied ? battle.fates[personId] : null;
    const key = groupOf(personId, entry, view);
    const side = sideOf(key) || sideOf('texian');
    // Which part of the force they stand in now, so the drawing fires and moves them with it (`memberGroups`).
    entry.at = side.key;
    const index = (byGroup[key] = (byGroup[key] ?? -1) + 1);
    let target;
    // A man killed lies where he fell (the renderer draws him lying still). ceiling: he is not carried back under the bank as
    // Andrews was; a carrying pose (docs/ART_REQUESTS.md, "the wounded carried") is the way to draw it.
    if (fate?.fate === 'killed') continue;
    if (fate?.fate === 'wounded') {
      // Down where he was hit until the fight has passed him; then helped back under cover (the renderer draws the helpers).
      if (!carryTo || !carryTo(view)) continue;
      target = placeFrom(carryTo(view), { x: 1, y: 0 }, looseSlot(personId, index, { width: 0.06, depth: 0.02 }));
      fate.carried = true;
    } else {
      const spread = side.style === 'column' ? SPREADS.column : side.spread || SPREADS[side.style] || SPREADS.loose;
      target = placeFrom(side, side.facing, looseSlot(personId, index, spread));
    }
    const step = reach * (riding(entry, view) ? 3 : fate?.carried ? 0.5 : 1);
    const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y);
    const part = gap <= step ? 1 : step / gap;
    person.location = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part, siteId: OBJECTIVE };
    // In the line while it fired: what the account and the participation record are written from. Never projected.
    if (!Number.isFinite(entry.fought) && side.fire && side.fire !== 'none' && !fate) entry.fought = world.minute;
    // A horse that came with them is held with the horses, or walks beside them on the way.
    for (const beast of Object.values(world.entities)) {
      if (beast.borrowedBy !== personId || beast.kind !== 'animal' || (beast.travel && beast.travel.purpose !== 'march')) continue;
      const held = horses?.(view, entry) || { x: person.location.x - 0.012, y: person.location.y + 0.006 };
      beast.travel = null;
      beast.location = { x: held.x + (hashOf(`${beast.id}:x`) - 0.5) * 0.02, y: held.y + (hashOf(`${beast.id}:y`) - 0.5) * 0.02, siteId: OBJECTIVE };
    }
  }
}

/** Out of the ranks and into a force: off the army's halted journey, standing where the ranks stood, and recorded. */
function joinTheForce(world, battle, person, group) {
  person.travel = null;
  person.location = { x: person.location.x, y: person.location.y, siteId: OBJECTIVE };
  person.task = 'help';
  battle.participants[person.id] = { householdId: person.householdId, joined: world.minute, group };
}
/** Back into the ranks once it is over, the family told through the person. */
function release(world, battle, personId) {
  const entry = battle.participants[personId];
  if (!entry || entry.released) return;
  entry.released = world.minute;
  const person = world.entities[personId];
  if (person && !GONE.includes(person.health?.condition) && world.army?.members.includes(personId)) rejoinRanks(world, person);
}

/** An alert through a family's person (docs/BATTLES.md §2.7): once for each stage of the coming fight, with Watch. */
function alert(world, battle, household, person, stage, title, text) {
  const had = battle.alerted[household.id];
  if (had && (had.stage === stage || (had.stages || []).includes(stage))) return;
  const eventId = record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-424', text });
  battle.alerted[household.id] = { eventId, minute: world.minute, entityId: person.id, text, title, stage, stages: [...(had?.stages || []), stage] };
}

// ================================================================================================== Concepción

/**
 * Which families' people went with the division, and on which arm of the bend they camp: Fannin's (the side's main body) or
 * Bowie's. A man whose roll has him hit is on Bowie's side, with the men Bowie moves across the open to Fannin's in the
 * charges - "exposure, not frailty, is what the record shows" (`HIST-TEX-481`) - and so are some who come through.
 */
function concepcionGroup(world, personId) {
  const fate = concepcionFate(world, personId);
  return fate !== 'unhurt' || hashOf(`${world.seed}:${personId}:bank`) < 0.4 ? 'bowie' : 'texian';
}
/** The minute a hit fighter's fate falls: one of the gun's five discharges in the charges (`FIC-GONZ-422`). */
function concepcionMoment(world, state, personId, fate) {
  const charges = phaseOf(state, 'charges'), retreat = phaseOf(state, 'retreat');
  if (fate === 'unhurt') return retreat.from;
  const shots = charges.guns?.brass || [];
  return charges.from + shots[Math.floor(hashOf(`${world.seed}:${personId}:discharge`) * shots.length)];
}

/**
 * Where the army is on its road while the main body comes up from Espada: from when the firing is heard at eight until it
 * comes in about half past nine (`HIST-TEX-021`, `-481`). Called before the army moves, so its ranks stand where it is.
 * ceiling: the army's own road from Espada to Concepción is a straight line on this map, as it has always been.
 */
export function concepcionArmyProgress(world, momentOf) {
  const army = world.army, road = army?.road;
  if (!road?.campaign || road.camp || road.stops?.espada === undefined || foughtBeforeTheEngine(world, 'concepcion', 'concepcion')) return;
  const start = momentOf(world, CONCEPCION.startKey);
  let from = start, heard = null, arrives = null;
  for (const phase of CONCEPCION.phases) { if (phase.id === 'fog-lifts') heard = from; if (phase.id === 'main-army') arrives = from; from += phase.minutes; }
  if (world.minute <= heard || world.minute > from) return;
  const part = Math.max(0, Math.min(1, (world.minute - heard) / (arrives - heard)));
  army.progress = Math.max(army.progress, road.stops.espada + part * (road.distance - road.stops.espada));
}

/** Concepción, every tick of the campaign once the army has formed (called by sim/directors.mjs `advanceGathering`). */
export function advanceConcepcion(world, movement, { momentOf, sendWord }) {
  if (!world.army || foughtBeforeTheEngine(world, 'concepcion', 'concepcion')) return;
  const battle = armBattle(world, 'concepcion', momentOf(world, CONCEPCION.startKey));
  battle.fates ||= {}; battle.done ||= {};
  const state = battleState(world, 'concepcion');
  if (!state || state.before) return;
  // A class whose clock was carried past the whole fight without a tick inside it keeps it as never fought here.
  if (state.over && !battle.done.out) { battle.done.out = battle.done.word = battle.done.present = world.minute; battle.done.skipped = true; return; }
  if (battle.done.skipped) return;
  const phaseId = state.phase.id, army = world.army;
  const ground = CONCEPCION.ground(world);

  // Two o'clock on the 27th: the question shuts, and the division leaves the ranks and marches (`FIC-GONZ-420`).
  if (!battle.done.out) {
    battle.done.out = world.minute;
    closeDetachment(world);
    for (const [personId, answer] of Object.entries(army.detachment?.asks || {})) {
      const person = world.entities[personId];
      if (answer !== 'go' || !person || !army.members.includes(personId) || GONE.includes(person.health?.condition)) continue;
      if (person.travel && person.travel.purpose !== 'march') continue;
      joinTheForce(world, battle, person, concepcionGroup(world, personId));
      // The fate, decided now from the roll the fight has always made and staged at its moment (docs/BATTLES.md §2.6).
      const fate = concepcionFate(world, personId);
      if (fate !== 'unhurt') stageFate(world, 'concepcion', personId, { fate, minute: concepcionMoment(world, state, personId, fate) });
      record(world, 'army', { actorId: personId, householdId: person.householdId, importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-019', text: `${person.name} marched up the river from Espada with Bowie and Fannin's division.` });
    }
  }

  // Each family's person's staged fate as its moment comes (sim/battle-stage.mjs `fatesDue`), and the unhurt counted as
  // having fought once the charges are over.
  for (const due of fatesDue(world, 'concepcion')) {
    const person = world.entities[due.personId];
    battle.fates[due.personId].applied = world.minute;
    if (person && !battle.participants[due.personId]?.released) resolveConcepcionFighter(world, person, due.fate, { causeId: battle.alerted[person.householdId]?.eventId || null });
  }
  if (world.minute >= phaseOf(state, 'retreat').from) {
    for (const [personId, entry] of Object.entries(battle.participants)) {
      const person = world.entities[personId];
      if (!person || battle.fates?.[personId] || entry.resolved || entry.released) continue;
      entry.resolved = world.minute;
      resolveConcepcionFighter(world, person, 'unhurt', { causeId: battle.alerted[person.householdId]?.eventId || null });
    }
  }

  // The families' people in the force: on their arm of the bend; Bowie's men who cross with Coleman's in the charges.
  standInTheForce(world, 'concepcion', battle, {
    groupOf: (personId, entry, view) => {
      if (entry.group !== 'bowie') return 'texian';
      // In the charges the men Bowie moves across the open to Fannin's side: every one whose roll has him hit, and some who
      // come through, decided by who he is (`HIST-TEX-481`, `FIC-GONZ-422`).
      const crosses = (view.groups || []).some(group => group.id === 'coleman') && (concepcionFate(world, personId) !== 'unhurt' || hashOf(`${world.seed}:${personId}:cross`) < 0.5);
      return crosses ? 'coleman' : (view.groups || []).some(group => group.id === 'bowie') ? 'bowie' : 'texian';
    },
    // Carried under the bank once the gun is taken.
    carryTo: view => ['retreat', 'aftermath', 'main-army', 'burial'].includes(view.phase) ? ground.fannin : null,
    horses: () => ['march'].includes(phaseId) ? null : ground.horses,
  });

  // The alerts, through the person (`FIC-GONZ-424`): the march, the night in camp, the horsemen in the fog; and the main
  // army's families, who hear the firing up the river.
  if (!state.over) {
    for (const household of Object.values(world.households)) {
      const mine = Object.entries(battle.participants).filter(([personId, entry]) => entry.householdId === household.id && !entry.released && !GONE.includes(world.entities[personId]?.health?.condition)).map(([personId]) => world.entities[personId]);
      const person = mine[0];
      if (person) {
        if (phaseId === 'march') alert(world, battle, household, person, 'march', 'The division marches', `At ${person.name}'s side: Bowie and Fannin are taking their division up the river from Espada toward Béxar, and ${person.name} is marching with them. They mean to camp tonight in a bend of the river near Mission Concepción.`);
        else if (['camp', 'breakfast'].includes(phaseId)) alert(world, battle, household, person, 'camp', 'Camp at Concepción', `At ${person.name}'s side, the sergeant: "Bowie's men are camped in the river bend by Mission Concepción, about two miles below the town. The Mexican guns fired from Béxar at sundown. The captains say sleep on your arms tonight."`);
        else if (['alarm', 'ringed', 'fog-lifts', 'charges'].includes(phaseId)) alert(world, battle, household, person, 'alarm', 'The fight at Concepción', `At ${person.name}'s side, the picket: "Mexican horsemen have come out of the fog and fired on the picket!" ${person.name} is under the riverbank with Bowie and Fannin's men.`);
        continue;
      }
      const inArmy = household.members.map(memberId => world.entities[memberId]).find(one => one && army.members.includes(one.id) && !battle.participants[one.id]);
      if (inArmy && world.minute >= phaseOf(state, 'fog-lifts').from && world.minute < phaseOf(state, 'burial').from) {
        alert(world, battle, household, inArmy, 'heard', 'Firing up the river', `At ${inArmy.name}'s side, at Espada: firing up the river toward Concepción, heavy and steady. The army is getting ready to march to Bowie and Fannin.`);
      }
    }
  }

  // The Host's camera on the field when the fog lifts (docs/BATTLES.md §2.1). The director's `concepcion` moment is the same
  // minute; it lights it (sim/directors.mjs).

  // The word, when the Mexicans have gone: the country hears of it on the day (`FIC-GONZ-039`, `HIST-TEX-020`).
  if (!battle.done.word && world.minute >= phaseOf(state, 'aftermath').from) {
    battle.done.word = world.minute;
    const eventId = record(world, 'milestone', {
      visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-020',
      text: 'Word has come of a fight at Mission Concepción on the morning of the 28th. About ninety men under Bowie and Fannin, surrounded in the fog, beat back the Mexican cavalry and infantry and took a cannon. Richard Andrews of Mina was killed. How many of the Mexican soldiers fell, the reports do not agree: sixteen dead were counted on the field, and others say fifty, sixty-seven, or more.',
    });
    battle.wordId = eventId;
    sendWord(world, 'concepcion-fight', { truth: world.events.find(event => event.id === eventId).text, claimId: 'HIST-TEX-020' });
  }
  // The main army comes up: everybody with it was present, and is told so.
  if (!battle.done.present && world.minute >= phaseOf(state, 'main-army').from) {
    battle.done.present = world.minute;
    for (const personId of [...army.members]) if (!battle.participants[personId]) concepcionPresent(world, personId, battle.wordId || null);
  }
  // The division rejoins the army at Concepción, and each family is told what happened through its own person.
  if (world.minute >= phaseOf(state, 'burial').from || state.over) {
    const told = new Set();
    for (const [personId, entry] of Object.entries(battle.participants)) {
      if (entry.released) continue;
      const person = world.entities[personId];
      const fate = battle.fates?.[personId]?.applied ? battle.fates[personId].fate : 'unhurt';
      if (person) tellConcepcionFighter(world, person, fate, battle.wordId || null);
      release(world, battle, personId);
      if (person && !told.has(entry.householdId)) { told.add(entry.householdId); tellAccount(world, battle, person, concepcionAccount(world, person, entry, fate), `What ${person.name} saw at Concepción`, 'HIST-TEX-481'); }
    }
    for (const household of Object.values(world.households)) {
      if (battle.told[household.id] || told.has(household.id)) continue;
      const inArmy = household.members.map(memberId => world.entities[memberId]).find(one => one && world.participation?.concepcion?.[one.id]?.role === 'present' && !GONE.includes(one.health?.condition));
      if (inArmy) tellAccount(world, battle, inArmy, concepcionAccount(world, inArmy, null, 'present'), `Word from Concepción`, 'HIST-TEX-021');
    }
  }
}
function tellAccount(world, battle, person, text, title, claimId) {
  const eventId = record(world, 'consequence', { householdId: person.householdId, actorId: person.id, importance: 3, classification: 'DOCUMENTED', claimId, causes: battle.wordId ? [battle.wordId] : [], text });
  const household = world.households[person.householdId];
  household?.memories?.push(record(world, 'memory', { actorId: person.id, householdId: person.householdId, text: title, causes: [eventId], importance: 3 }));
  battle.told[person.householdId] = { eventId, minute: world.minute, tick: world.tick, entityId: person.id, text, title };
}

/**
 * The plain-words account of Concepción for a family who had somebody there (docs/battle-research/staging.md §1.8): what
 * happened, what their person did, why it ended so, and what comes next. Only what the record gives (`HIST-TEX-480`, `-481`,
 * `-484`); the Mexican loss said as the reports have it, disputed.
 */
export function concepcionAccount(world, person, entry, fate) {
  const name = person.name;
  const company = entry?.group === 'bowie' ? 'with Bowie on the north side of the bend' : "with Fannin's company on the south side of the bend";
  const did = {
    unhurt: `${name} marched up the river from Espada with the division, spent the night under the bank, and was ${company}: climbing up to fire and dropping back to load all through the fog and the charges. ${name} came through unhurt.`,
    wounded: `${name} marched up the river from Espada with the division and was ${company}. When Bowie moved men across the open to help Fannin's side, ${name} went with them and was hit by a ball, and will be some days mending.`,
    killed: `${name} marched up the river from Espada with the division and was ${company}. When Bowie moved men across the open to help Fannin's side, ${name} went with them and was killed crossing the open ground, and was buried under the pecans by the river.`,
    present: `${name} was with the main army at Espada, heard the firing, and came up the river an hour after the fight was over.`,
  }[fate];
  const next = fate === 'killed'
    ? 'The army is now camped at Concepción and closing on Béxar.'
    : `The army is now camped at Concepción and closing on Béxar, but many men are talking of going home for winter clothes. Whether ${name} stays with the army or comes home is the family's to say: it can send for ${name}.`;
  return [
    'What happened: on the morning of October 28 about ninety of our volunteers under Jim Bowie and James Fannin were camped in a bend of the San Antonio River near Mission Concepción, below Béxar. In the fog, Mexican cavalry and infantry with two cannon surrounded them. Our men kept down under the high riverbank, climbing up to fire and dropping back to load, so the Mexican bullets and cannon shot mostly went over their heads. When the fog lifted, the Mexican infantry charged three times behind a cannon, and three times the riflemen shot down the gunners and drove them back. Then the Mexicans retreated to Béxar and our men took the cannon. One volunteer, Richard Andrews, was killed; he had crossed open ground to join the other side of the bend.',
    `What ${name} did: ${did}`,
    'Why it ended so: the bank sheltered the Texians, and their rifles could reach the gunners at eighty yards, while the Mexican grapeshot went high into the pecan trees. After three charges had failed, the retreat was sounded. How many of the Mexican soldiers fell, the reports do not agree: sixteen dead were counted on the field, and others say fifty, sixty-seven, or more.',
    `What comes next: ${next}`,
  ].join('\n\n');
}

// ================================================================================================== the Grass Fight

/** Which party a man goes out with: Bowie's horsemen if his horse is with him in the camp, Jack's infantry if he is on foot. */
const grassParty = (world, person) => modeWith(world, person) === 'horse' ? 'texian' : 'jack';
/** The minute a fighter's fate falls (`FIC-GONZ-422`): a rider at Bowie's first exchange, a man with Jack at the ditch's first volley. */
function grassMoment(state, entry, fate) {
  const bowie = phaseOf(state, 'bowie'), ambush = phaseOf(state, 'ambush'), follow = phaseOf(state, 'follow');
  if (fate === 'unhurt') return follow.from + follow.minutes;
  return entry.group === 'texian' ? bowie.from + 6 : ambush.from + 2;
}

/** The Grass Fight, every tick of the siege (called by sim/directors.mjs `advanceSiege`). */
export function advanceGrassFight(world, movement, { momentOf }) {
  if (!world.army || foughtBeforeTheEngine(world, 'grass-fight', 'grass-fight')) return;
  const battle = armBattle(world, 'grass-fight', momentOf(world, GRASS_FIGHT.startKey));
  battle.fates ||= {}; battle.done ||= {}; battle.outcomes ||= [];
  const state = battleState(world, 'grass-fight');
  if (!state || state.before) return;
  // A class whose clock was carried past the whole fight without a tick inside it (a test set to a later day) keeps it as never
  // fought here: nobody is told of a fight nobody was sent to.
  if (state.over && !battle.done.closed) { battle.done.closed = battle.done.settled = battle.done.accounts = world.minute; return; }
  const phaseId = state.phase.id, army = world.army;
  const beginTravel = movement?.beginTravel;
  const rideOut = phaseOf(state, 'ride-out').from;
  // The question shuts when they ride out (staging.md §2.6: not six hours later); anybody not answered is answered as auto
  // answers, and a yes decided that way rides out too.
  if (world.minute >= rideOut && !battle.done.closed) { battle.done.closed = world.minute; closeQuestion(world, 'grass', { beginTravel }); }
  // A yes is a departure: the man goes to his party as it forms, and out with it. Never after it has gone.
  if (world.minute <= rideOut) {
    for (const [personId, answer] of Object.entries(army.questions?.grass?.asks || {})) {
      const person = world.entities[personId];
      if (answer !== 'yes' || battle.participants[personId] || !person || !army.members.includes(personId) || GONE.includes(person.health?.condition)) continue;
      if (person.travel && person.travel.purpose !== 'march') continue;
      const party = grassParty(world, person);
      joinTheForce(world, battle, person, party);
      const fate = grassFate(world, person);
      if (fate !== 'unhurt') stageFate(world, 'grass-fight', personId, { fate, minute: grassMoment(state, battle.participants[personId], fate) });
      record(world, 'army', { actorId: personId, householdId: person.householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-421', text: party === 'texian' ? `${person.name} ran for a horse and rode out with Bowie's horsemen after the pack train.` : `${person.name} fell in with Jack's men on foot and went out after the pack train.` });
    }
  }
  // Each staged fate as its moment comes (sim/battle-stage.mjs `fatesDue`). A man who runs is off the field and on the road
  // home at once.
  for (const due of fatesDue(world, 'grass-fight')) {
    const person = world.entities[due.personId], entry = battle.participants[due.personId];
    battle.fates[due.personId].applied = world.minute;
    if (!person || !entry || entry.released) continue;
    resolveGrassFighter(world, person, due.fate, { beginTravel, outcomes: battle.outcomes });
    if (due.fate === 'ran') entry.released = world.minute;
  }
  standInTheForce(world, 'grass-fight', battle, {
    groupOf: (personId, entry) => entry.group,
    // Helped back to where the horses are held once the fight has moved on.
    carryTo: view => ['sortie', 'follow', 'grass', 'back'].includes(view.phase) ? GRASS_FIGHT.ground(world).bowieRide : null,
    horses: (view, entry) => entry.group === 'texian' && !['alarm', 'ride-out', 'back'].includes(view.phase) ? GRASS_FIGHT.ground(world).bowieRide : null,
    riding: (entry, view) => entry.group === 'texian' && ['ride-out', 'bowie'].includes(view.phase),
  });
  // The alerts, through the person (`FIC-GONZ-424`): riding out, and the firing; and the camp's families, who hear it.
  if (!state.over) {
    const bowieFrom = phaseOf(state, 'bowie').from, grassFrom = phaseOf(state, 'grass').from;
    for (const household of Object.values(world.households)) {
      const out = Object.entries(battle.participants).find(([personId, entry]) => entry.householdId === household.id && !entry.released && !GONE.includes(world.entities[personId]?.health?.condition));
      if (out) {
        const person = world.entities[out[0]], party = out[1].group === 'texian' ? "Bowie's horsemen" : "Jack's infantry";
        if (world.minute < bowieFrom) alert(world, battle, household, person, 'out', 'After the pack train', `At ${person.name}'s side: ${person.name} is going out with ${party} after the pack train, west of the town. They say it carries silver.`);
        else if (world.minute < grassFrom) alert(world, battle, household, person, 'firing', 'Firing west of the town', `At ${person.name}'s side: firing west of the town, by the Alazán. ${person.name} is with ${party}.`);
        continue;
      }
      const inCamp = household.members.map(memberId => world.entities[memberId]).find(one => one && army.members.includes(one.id) && !battle.participants[one.id]);
      if (inCamp && world.minute >= bowieFrom && world.minute < grassFrom) alert(world, battle, household, inCamp, 'heard', 'Firing to the west', `At ${inCamp.name}'s side, in the camp at the mill: firing to the west. The camp guard is standing to.`);
    }
  }
  // Back in camp: everybody still out rejoins the ranks, the rest of the camp was present, and the army's record of it is
  // kept for the word that rides home five days later (`tellGrassFight`, `grassAccounts`).
  if (state.over && !battle.done.settled) {
    battle.done.settled = world.minute;
    for (const [personId, entry] of Object.entries(battle.participants)) {
      if (!battle.fates?.[personId]?.applied && !entry.resolved) { const person = world.entities[personId]; if (person) { entry.resolved = world.minute; resolveGrassFighter(world, person, 'unhurt', { beginTravel, outcomes: battle.outcomes }); } }
      if (!entry.released) release(world, battle, personId);
    }
    for (const personId of [...army.members]) if (!battle.participants[personId]) grassPresent(world, personId, { outcomes: battle.outcomes });
    army.grass = { outcomes: [...battle.outcomes], told: false, minute: world.minute };
  }
}

/**
 * When the fuller word rides home (`grass-news`, December 3; `HIST-TEX-034`): each family who had somebody at the Grass Fight or
 * in the camp is given the account in plain words through that person (docs/battle-research/staging.md §2.8).
 */
export function grassAccounts(world, causeId) {
  const battle = world.battles?.['grass-fight'];
  if (!battle || battle.done?.accounts) return;
  battle.done ||= {};
  battle.done.accounts = world.minute;
  battle.wordId = causeId || null;
  const told = new Set();
  for (const { id, fate } of battle.outcomes || []) {
    const person = world.entities[id];
    if (!person?.householdId || told.has(person.householdId)) continue;
    // A family's own person out with the men is told before one who stayed in the camp.
    const out = Object.entries(battle.participants).find(([personId, entry]) => entry.householdId === person.householdId && world.entities[personId]);
    const who = out ? world.entities[out[0]] : person;
    const whoFate = out ? (battle.fates?.[out[0]]?.applied ? battle.fates[out[0]].fate : 'unhurt') : fate;
    told.add(person.householdId);
    tellAccount(world, battle, who, grassAccount(world, who, out?.[1] || null, whoFate), `Word of the fight west of Béxar`, 'HIST-TEX-031');
  }
}

/** The plain-words account of the Grass Fight (staging.md §2.8): only what the record gives (`HIST-TEX-031`, `-032`, `-483`). */
export function grassAccount(world, person, entry, fate) {
  const name = person.name;
  const party = entry?.group === 'texian' ? `rode out with Bowie's horsemen` : `went out on foot with Jack's men`;
  const did = {
    unhurt: `${name} ${party}${entry?.group === 'texian' ? ', got down with them in the ravines, and fought on foot' : ', was in the column when it was fired on from the ditch, and charged it'}. ${name} came back to the camp unhurt.`,
    wounded: `${name} ${party} and was slightly hurt when the firing began, and will be some days mending.`,
    ran: `${name} ${party}, but ran from the field when the firing began, and has started for home.`,
    present: `${name} stayed in the camp at the mill with the guard while the others went out.`,
  }[fate] || `${name} was in the camp at the mill.`;
  return [
    "What happened: on November 26 Deaf Smith rode into the camp north of Béxar with news of a Mexican pack train coming in from the west. The men believed it carried silver to pay the soldiers in Béxar. Jim Bowie went out with about forty horsemen and William Jack with about a hundred men on foot. A mile west of the town Bowie's men caught the train; its guard jumped into a dry creek bed and both sides fought on foot. Jack's men were fired on from a hidden ditch, charged it and cleared it, and soldiers who came out of the town with a cannon were driven back. When the packs were cut open they held grass, cut to feed the horses in Béxar. No one on our side was killed.",
    `What ${name} did: ${did}`,
    'Why it ended so: the train\'s guard had only a creek bed to fight from and was outnumbered, and the soldiers who came out of the town went back under their own guns rather than be cut off. The Texians followed until the guns in Béxar fired on them, and were called back. How many Mexican soldiers fell, the reports do not agree: three, fifteen, about fifty, or sixty.',
    fate === 'ran' ? `What comes next: ${name} is on the road home.` : 'What comes next: the army is still camped at the mill before Béxar, with winter coming on and the men restless.',
  ].join('\n\n');
}

// ================================================================================================== what each page is sent

/** Who of the families is in a force now, or has fallen in it, for the drawing: never anybody released back to the ranks. */
function inTheForce(world, battle) {
  return Object.keys(battle.participants).filter(personId => {
    const entry = battle.participants[personId];
    return world.entities[personId] && (!entry.released || (battle.fates?.[personId]?.fate === 'ran' && world.entities[personId].travel));
  }).sort();
}
/** The staged fates, as `projectBattle` takes them: it sends each only once its minute has come. */
const fatesOf = battle => battle.fates || {};
/** Which unit each of the families' people stands in now (`memberUnits`): Bowie's companies, Coleman's men, Jack's. */
const unitsOf = battle => Object.fromEntries(Object.entries(battle.participants).map(([id, entry]) => [id, entry.at || entry.group]).filter(([, key]) => key && key !== 'texian'));
/** From when a family with somebody in the army but not in the force hears the fight and is sent it (docs/BATTLES.md §2.1). */
const HEARD_FROM = { concepcion: 'fog-lifts', 'grass-fight': 'bowie' };
/** The phases the Host's camera is sent to the field for. */
const FIELD = { concepcion: ['alarm', 'ringed', 'fog-lifts', 'charges', 'retreat'], 'grass-fight': ['bowie', 'ambush', 'sortie', 'follow'] };

/** The field's middle, where Watch and the Host's spotlight go. */
export function battleField(world, id) {
  if (id === 'concepcion') { const ground = CONCEPCION.ground(world); return { x: (ground.bend.x + ground.line.x) / 2, y: (ground.bend.y + ground.line.y) / 2 }; }
  const ground = GRASS_FIGHT.ground(world);
  return { x: (ground.bowieLine.x + ground.jackApproach.x) / 2, y: (ground.bowieLine.y + ground.jackApproach.y) / 2 };
}

/**
 * What a page is sent of Concepción or the Grass Fight (docs/BATTLES.md §2.1, `FIC-GONZ-447`): the Host always while it is
 * fought, its camera on the field for the fighting; a family while one of its own people is in the force, or - from when the
 * firing can be heard - while one is with the army nearby; nobody else. Returns `{ battle, host, battleAlert, battleAccount }`
 * with nulls, for sim/directors.mjs `directorProjection` to use when no other fight is being sent.
 */
export function campaignBattleProjection(world, householdId, role) {
  const out = { battle: null, host: null, battleAlert: null, battleAccount: null };
  for (const id of ['concepcion', 'grass-fight']) {
    const battle = world.battles?.[id];
    if (!battle) continue;
    const state = battleState(world, id);
    const forced = inTheForce(world, battle);
    const heard = state?.live && world.minute >= phaseOf(state, HEARD_FROM[id]).from;
    if (state?.live && !out.battle) {
      const options = { fates: fatesOf(battle), units: unitsOf(battle) };
      if (role === 'host') {
        out.battle = { ...projectBattle(world, id, { members: forced, ...options }), reconstruction: false };
        out.host = { focus: FIELD[id].includes(state.phase.id) ? 'battle' : 'regional', caption: `${ENGAGEMENT_NAMES[id]}, live. Families with somebody there see it too; the rest have not heard yet.`, ...battleField(world, id) };
      } else if (role === 'student' && householdId) {
        const own = forced.filter(personId => battle.participants[personId].householdId === householdId);
        const withArmy = world.households[householdId]?.members.some(personId => world.army?.members.includes(personId) && !battle.participants[personId]);
        if (own.length) out.battle = { ...projectBattle(world, id, { members: forced, ...options }), reconstruction: false };
        else if (withArmy && heard) out.battle = { ...projectBattle(world, id, { members: [], ...options }), reconstruction: false };
      }
    }
    if (role === 'student' && householdId) {
      const alerted = battle.alerted?.[householdId];
      const person = alerted && world.entities[alerted.entityId];
      const done = !state || state.over || ['burial', 'grass', 'back'].includes(state.phase?.id);
      if (alerted && person && !GONE.includes(person.health?.condition) && !done && !out.battleAlert) {
        out.battleAlert = { id: `battle:${id}:${householdId}:${alerted.stage}`, entityId: person.id, title: alerted.title, text: alerted.text, field: battleField(world, id), watching: Boolean(out.battle) };
      }
      // The card stays a day, and at least long enough to read: a day of the campaign calendar is only two ticks.
      const told = battle.told?.[householdId];
      const showing = told && (world.minute - told.minute <= 1440 || world.tick - (told.tick ?? -Infinity) <= ACCOUNT_TICKS && world.minute - told.minute <= 3 * 1440);
      if (showing && world.entities[told.entityId] && !out.battleAccount) {
        out.battleAccount = { id: `account:${id}:${householdId}`, entityId: told.entityId, title: told.title, text: told.text };
      }
    }
  }
  return out;
}
const ENGAGEMENT_NAMES = { concepcion: 'The fight at Concepción', 'grass-fight': 'The Grass Fight' };
/** How many ticks, at least, the account's card stays up: about four minutes at the Study pace (`FIC-GONZ-424`). */
const ACCOUNT_TICKS = 24;
