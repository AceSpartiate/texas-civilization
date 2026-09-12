import { record } from './events.mjs';
import { establishTruth, learn } from './knowledge.mjs';
import { TIRING_MILES } from './routines.mjs';

// Date is anchored; these within-day times, pacing, and formation positions are schematic.
// `crossing` is the night of October 1, when the force went over to the west bank and
// started upriver (HIST-GONZ-003). It is when a household that carried food to town is
// asked whether its person goes on with them. 4200 minutes from midnight on the 29th is
// late on the 1st; `approach` at 4680 is dawn on the 2nd, and the call shuts then.
export const TIMELINE = Object.freeze({ notice: 600, publicNotice: 1440, gathering: 3000, crossing: 4200, approach: 4680, exchange: 4760, withdrawal: 4840, resolved: 4920, publicOutcome: 5400, finish: 5680 });
export const HISTORICAL_OUTCOME = 'Mexican detachment withdraws; Texians retain the cannon.';
const captions = {
  gathering: 'People gather near Gonzales. Supplies and civilian work support them.',
  approach: 'Texian militia advances toward the Mexican camp on the morning of October 2.',
  exchange: 'A brief clash takes place. The Texians fire the cannon.',
  withdrawal: 'The Mexican detachment withdraws toward Béxar.',
  resolved: HISTORICAL_OUTCOME,
};
// Where the clash actually stood, read off the map rather than written down here.
// HIST-GONZ-008 puts it about seven miles upriver of the contested ford on Ezekiel
// Williams's land, and `buildGonzalesRegion` already places that site; HIST-GONZ-007
// has the Texians crossing to the west bank and marching upriver to reach it. So the
// Mexican camp is the site, the Texians arrive from the ford behind them, and
// Castañeda withdraws on up the river away from Gonzales, toward Béxar.
//
// These are derived every tick rather than stored, which is the whole point: a class
// saved by a build that hardcoded them - or by any later map - re-anchors on load
// instead of drawing the battle wherever the old coordinate space happened to put it.
// No save version moves, because nothing here is remembered, only recomputed.
export function battleGround(world) {
  const camp = world.map.sites['williams-camp'], ford = world.map.sites.ford;
  const dx = ford.x - camp.x, dy = ford.y - camp.y, span = Math.hypot(dx, dy) || 1;
  const toward = { x: dx / span, y: dy / span };
  const at = (from, unit, miles) => ({ x: from.x + unit.x * miles, y: from.y + unit.y * miles });
  return {
    mexican: { x: camp.x, y: camp.y },
    // Formed up downriver of the camp, between it and the crossing they came over.
    texianStart: at(camp, toward, 1.15),
    texianClosed: at(camp, toward, 0.34),
    // Away from the ford is upriver and inland - the road back to Béxar.
    mexicanGone: at(camp, toward, -2.4),
  };
}
export function initializeDirectors(world) {
  const ground = battleGround(world);
  world.director = { milestones: {}, dispatches: {}, complete: false, phase: 'home', battle: { phase: 'waiting', formations: [
    { id: 'formation-texian', side: 'texian', x: ground.texianStart.x, y: ground.texianStart.y, count: 12 },
    { id: 'formation-mexican', side: 'mexican', x: ground.mexican.x, y: ground.mexican.y, count: 12 },
  ] }, frames: [] };
  world.requests = {};
  world.marches = {};
  for (const [id, minute] of Object.entries(TIMELINE)) world.barriers.push({ id: `gonzales:${id}`, minute, kind: 'historical-scene', resolved: false });
}
function once(world, key, action) {
  if (world.director.milestones[key] || world.minute < TIMELINE[key]) return;
  action(); world.director.milestones[key] = true;
  // A class saved before this milestone existed has no barrier for it. There is nothing
  // to resolve in that case, which is the correct empty value, so no save version moves.
  const barrier = world.barriers.find(b => b.id === `gonzales:${key}`);
  if (barrier) barrier.resolved = true;
}
export const CAMP_SITE = 'williams-camp';
function presentAt(world, householdId, siteId) {
  return world.households[householdId].members.some(id => world.entities[id].location.siteId === siteId);
}
const atGonzales = (world, householdId) => presentAt(world, householdId, 'gonzales');
const atCamp = (world, householdId) => presentAt(world, householdId, CAMP_SITE);
// Seeing it happen means standing at the camp where it happens, or in the town it can be
// seen from. Both are real positions a person walked to, never a camera setting.
const witnessing = (world, householdId) => atCamp(world, householdId) || atGonzales(world, householdId);

// What going upriver costs, stated before the choice and resolved from the person's own
// state rather than from a die. Fresh, and they come back tired; already tired, and they
// come back hurt. That makes who a family sent - and how far that person had already
// walked - decide the outcome, which is the interaction VISION.md asks systems to have
// with each other.
//
// It stops at a minor, recoverable condition and never reaches a wound, a capture or a
// death. HISTORY.md excludes individual wounds and casualty counts at Gonzales as
// historical fact, and FIC-GONZ-005 permits only fatigue or a minor condition as
// fiction. The Battle of Gonzales is not the place to invent a casualty.
// ceiling: the second rung is unreachable inside one slice. Nothing makes anybody
// tired before `settleHelp`, which is the same moment this cost is applied, so every
// marcher is 'well' when it lands and 'minor-injury' never occurs in a played class.
// It is kept because state is preserved between arcs - somebody who ends this slice
// tired starts the next one tired - and because a fatigue system is already on the
// roadmap. Until one exists, the stated risk a student reads is always the first rung.
const MARCH_COST = Object.freeze({ well: 'tired', tired: 'minor-injury' });
const MEND_MINUTES = 4320;
export function marchCost(condition) { return MARCH_COST[condition] || condition; }
export function marchRisk(name, condition) {
  if (condition === 'well') return `${name} will come back tired.`;
  if (condition === 'tired') return `${name} is already tired. Going on will leave ${name} hurt, and mending takes days.`;
  return `Going on will not mend what ${name} is already carrying.`;
}
function offerRequests(world) {
  for (const household of Object.values(world.households)) {
    const report = world.knowledge.households[household.id]['cannon-request'];
    if (!report || world.requests[household.id] || world.minute >= TIMELINE.approach) continue;
    // A neighbour speaking, not a rules panel. What each choice costs belongs on the
    // controls; a request that has to explain itself is a badly designed request.
    const text = 'A neighbour is at the door. They are carrying food to the people gathering near Gonzales, and ask whether Thomas can help take it.';
    const id = record(world, 'pressure', { householdId: household.id, text, classification: 'FICTIONAL FOR GAMEPLAY', causes: [report.eventId], importance: 2 });
    world.requests[household.id] = { id, text, status: 'open', offeredMinute: world.minute };
  }
}
// The second call, and the one that puts a family member where the fighting is. It is
// only ever put to a household whose person actually stood in Gonzales when the force
// moved out - carrying food to a gathering and marching upriver to a fight are two
// different acts, and the game asks separately about the second.
function offerMarch(world) {
  if (!world.marches) world.marches = {};
  if (world.minute < TIMELINE.crossing || world.minute >= TIMELINE.approach) return;
  for (const household of Object.values(world.households)) {
    const request = world.requests[household.id];
    if (!request || request.status !== 'accepted' || world.marches[household.id]) continue;
    const entity = world.entities[household.principalId];
    if (entity.location.siteId !== 'gonzales') continue;
    if (['dead', 'captured'].includes(entity.health.condition)) continue;
    const text = `The men who took the cannon are crossing the river tonight and going upriver after the Mexican camp. They ask whether ${entity.name} will come as far as the camp with the supplies.`;
    const id = record(world, 'pressure', { householdId: household.id, actorId: entity.id, text, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-011', causes: [request.choiceId], importance: 2 });
    // The cost is settled here, once, and carried on the offer. It is NOT recomputed when
    // the march is paid out, because the nine miles up the river are themselves enough to
    // tire somebody: read it again at the end and a family shown "will come back tired"
    // would be handed a hurt man instead. A control that states a price must charge it.
    const promised = marchCost(entity.health.condition);
    world.marches[household.id] = { id, text, status: 'open', actorId: entity.id, offeredMinute: world.minute, promised, risk: marchRisk(entity.name, entity.health.condition) };
  }
}
/**
 * Whether this family can answer a call this way, and if not, why - in the words the
 * student will read on the control.
 *
 * The same rule the work controls follow, arriving late to the one decision the lesson
 * turns on. Until now these two answers were offered whatever the family's state and
 * failed on the press: "Help - 2 food" sat there enabled for a household with one food.
 *
 * It is one function rather than two because the throw and the greyed-out button have to
 * agree. `choreAvailability` learned that the hard way; a control that says a thing is
 * possible and then refuses it is worse than a control that was never offered.
 */
export function callAvailability(world, householdId, entity, action) {
  const household = world.households[householdId];
  if (['dead', 'captured'].includes(entity.health.condition)) return { can: false, why: `${entity.name} cannot answer.` };
  if (action === 'help') {
    if (entity.travel) return { can: false, why: 'Wait until this person arrives.' };
    if (household.resources.food < 2) return { can: false, why: 'Helping needs two food. Staying home is also a valid choice.' };
    return { can: true, why: '' };
  }
  if (action === 'stay') {
    if (entity.location.siteId !== household.homeSiteId) return { can: false, why: 'Return home before choosing to stay and prepare.' };
    return { can: true, why: '' };
  }
  if (action === 'go-upriver') {
    if (entity.travel) return { can: false, why: 'Wait until this person arrives.' };
    return { can: true, why: '' };
  }
  return { can: true, why: '' };
}

/**
 * What each answer to a call would cost, said before it is chosen.
 *
 * Shaped deliberately like a chore's question - a line of text and options that each carry
 * their own price in the person's own words - because it is the same kind of thing and a
 * student who has learned one should not have to learn the other. See
 * docs/evidence/one-decision-shape.json.
 */
export function requestOptions(world, householdId, request, kind) {
  const household = world.households[householdId];
  const entity = world.entities[request.actorId || household.principalId];
  const offer = (id, label, note) => ({ id, label, note, ...callAvailability(world, householdId, entity, id) });
  if (kind === 'march') {
    return [
      offer('go-upriver', 'Go upriver to the camp', request.risk || `${entity.name} would go on with them.`),
      offer('stay-in-town', 'Stay in town with the supplies', `The supplies go on without ${entity.name}.`),
    ];
  }
  const tired = entity.health.condition === 'tired' ? ` ${entity.name} is already tired.` : '';
  return [
    offer('help', 'Carry the food to Gonzales', `Two food out of the store, and the road there and back.${tired}`),
    offer('stay', 'Stay home and prepare', `One food set aside, and ${entity.name} stays where the family can use them.`),
  ];
}

export function handleMarch(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const march = world.marches?.[householdId];
  if (!march || march.status !== 'open') throw new Error('Nobody is asking that.');
  if (world.minute >= TIMELINE.approach) throw new Error('They have already gone upriver.');
  if (march.actorId !== entity.id) throw new Error(`${entity.name} was not the one asked.`);
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  // Refused before a single thing moves. This function records the choice and then sends
  // somebody walking, so a journey that turns out to be impossible after the decision is
  // written down would leave a household that had agreed to go and nobody on the road.
  if (action === 'go-upriver') {
    const why = travelRefusal?.(world, entity, CAMP_SITE, mode);
    if (why) throw new Error(why);
  }
  march.status = action === 'go-upriver' ? 'accepted' : 'refused';
  march.choiceId = record(world, 'choice', {
    actorId: entity.id, householdId, decision: action, causes: [march.id], importance: 2,
    text: action === 'go-upriver'
      ? `${entity.name} will go upriver with them to the camp.`
      : `${entity.name} will stay in Gonzales with what is left of the supplies.`,
  });
  if (action === 'go-upriver') {
    entity.commitments.push({ id: 'gonzales-march', type: 'service', status: 'active', choiceId: march.choiceId });
    // A real journey over the ford and up the west bank. `findPath` routes it; nobody is
    // ever placed at the camp without having walked there.
    beginTravel(world, entity, CAMP_SITE, march.choiceId, 'help', mode);
  } else {
    entity.task = 'help';
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, importance: 2, causes: [march.choiceId], text: `${entity.name} stayed in Gonzales when the others crossed. The family's supplies went on without him.` });
    remember(world, world.households[householdId], entity, consequence, `${entity.name} went as far as Gonzales and no further.`);
  }
}
export function handleChoice(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const request = world.requests?.[householdId];
  if (!request || request.status !== 'open' || !world.knowledge.households[householdId]['cannon-request']) throw new Error('There is no known open request.');
  if (world.minute >= TIMELINE.approach) throw new Error('This gathering request has closed.');
  if (entity.travel) throw new Error('Wait until this person arrives.');
  const household = world.households[householdId];
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  // Same rule as the march: the food is spent and the promise is written down below, so
  // an impossible journey has to be refused before either happens.
  if (action === 'help' && entity.location.siteId !== 'gonzales') {
    const why = travelRefusal?.(world, entity, 'gonzales', mode);
    if (why) throw new Error(why);
  }
  request.status = action === 'help' ? 'accepted' : 'refused';
  request.choiceId = record(world, 'choice', { actorId: entity.id, householdId, text: action === 'help' ? `${entity.name} will carry food to Gonzales.` : `${entity.name} will stay home and prepare the household.`, decision: action, causes: [request.id], importance: 2 });
  if (action === 'help') {
    household.resources.food = Math.round((household.resources.food - 2) * 10000) / 10000;
    entity.commitments.push({ id: 'gonzales-supplies', type: 'service', status: 'active', choiceId: request.choiceId });
    if (entity.location.siteId !== 'gonzales') beginTravel(world, entity, 'gonzales', request.choiceId, 'help', mode);
    else { entity.task = 'help'; record(world, 'arrival', { actorId: entity.id, householdId, destination: 'gonzales', purpose: 'help', text: `${entity.name} offers supplies where he is already present.`, causes: [request.choiceId] }); }
  } else {
    entity.task = 'work'; household.prepared = true; household.resources.food += 1;
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, text: `${entity.name} stayed home and set aside one food. The family kept its labor and transportation nearby.`, causes: [request.choiceId], importance: 2 });
    remember(world, household, entity, consequence, 'Your family kept Thomas home and prepared supplies.');
  }
}
function remember(world, household, entity, cause, text) {
  const id = record(world, 'memory', { actorId: entity.id, householdId: household.id, text, causes: [cause], importance: 3 });
  household.memories.push(id);
}
function settleHelp(world) {
  for (const [householdId, request] of Object.entries(world.requests)) {
    if (request.status !== 'accepted' || request.consequenceId) continue;
    const household = world.households[householdId], entity = world.entities[household.principalId];
    const arrival = world.events.find(e => e.type === 'arrival' && e.actorId === entity.id && e.purpose === 'help' && e.minute >= request.offeredMinute);
    if (!arrival || world.minute < TIMELINE.resolved) continue;
    const outcome = world.truth['gonzales-outcome'];
    const march = world.marches?.[householdId];
    // Three different people end up here: one who carried food to town, one who went on
    // upriver and stood at the camp, and one who set out upriver and was still on the
    // road when it happened. They must not collapse into the same sentence.
    const wentOn = march?.status === 'accepted';
    // ceiling: at this map scale the walk from Gonzales to the camp is short enough that
    // everybody who answers is there in time, so `stillWalking` never occurs in ordinary
    // play and no test can make it fail. It is kept because it is the honest outcome the
    // moment the map grows, travel slows, or the crossing window tightens - any of which
    // would otherwise start telling people they saw something they missed.
    const reachedCamp = wentOn && Number.isFinite(march.witnessed);
    const stillWalking = wentOn && !reachedCamp;

    // Standing there is worth more to a neighbour than handing over a sack in town, and
    // it is the relationship that later arcs inherit.
    household.relationships.neighbor += reachedCamp ? 2 : 1;

    const before = entity.health.condition;
    // Never replace a death, capture or an existing injury with a lighter state. A person
    // who went upriver gets exactly the cost their control named; everybody else is tired
    // from the errand.
    const promised = reachedCamp ? (march.promised || marchCost(before)) : null;
    const after = promised
      ? (['dead', 'captured', 'minor-injury'].includes(before) ? before : promised)
      : (['well', 'tired'].includes(before) ? 'tired' : before);
    if (after !== before) entity.health = after === 'minor-injury' ? { condition: after, recoversAt: world.minute + MEND_MINUTES } : { condition: after };
    // A condition imposed here needs the exertion that justifies it, or the two systems
    // contradict each other: `advanceRoutine` would see somebody freshly called tired
    // with hardly any miles on them and announce them fit again on the very next tick.
    // Whoever did this errand has a day's walking in them, and has to rest it off.
    if (['tired', 'minor-injury'].includes(after)) entity.exertion = Math.max(entity.exertion || 0, TIRING_MILES);

    for (const commitment of entity.commitments) if (['gonzales-supplies', 'gonzales-march'].includes(commitment.id)) commitment.status = reachedCamp || commitment.id === 'gonzales-supplies' ? 'fulfilled' : 'unresolved';
    if (!entity.travel && entity.task === 'help') entity.task = 'rest';

    const state = after === before ? `${entity.name}'s existing condition is unchanged.`
      : after === 'minor-injury' ? `${entity.name} is hurt, and will be days mending.`
      : `${entity.name} is tired.`;
    const where = reachedCamp
      ? `${entity.name} stood at the camp on Williams's land when it happened, and saw it.`
      : stillWalking
        ? `${entity.name} set out upriver but was not there when it happened, and saw none of it.`
        : `${entity.name}'s food reached Gonzales.`;
    request.consequenceId = record(world, 'consequence', { householdId, actorId: entity.id, importance: 3, causes: [arrival.id, outcome.eventId, ...(march?.choiceId ? [march.choiceId] : [])], text: `${where} The neighbor remembers the assistance. ${state} Current location and any return journey remain unchanged.` });
    remember(world, household, entity, request.consequenceId, reachedCamp
      ? `${entity.name} went upriver to the camp and was there for it; the family remembers what it cost.`
      : stillWalking
        ? `${entity.name} set out upriver and got there too late; the family remembers the walk and not the fight.`
        : `${entity.name} carried food to Gonzales; the family remembers his absence and its assistance.`);
  }
}
function setBattlePhase(world, phase) {
  world.director.battle.phase = phase;
  world.director.lastBattleEventId = record(world, 'battle-phase', { text: captions[phase], phase, siteId: 'gonzales', classification: phase === 'gathering' ? 'FICTIONAL FOR GAMEPLAY' : 'DOCUMENTED', claimId: phase === 'gathering' ? 'FIC-GONZ-006' : phase === 'approach' || phase === 'exchange' ? 'HIST-GONZ-003' : 'HIST-GONZ-004', causes: [world.director.lastBattleEventId || world.truth['cannon-request'].eventId] });
}
function moveFormations(world) {
  const battle = world.director.battle;
  const [texian, mexican] = battle.formations;
  const ground = battleGround(world);
  const between = (from, to, part) => ({ x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part });
  const place = (formation, point) => { formation.x = point.x; formation.y = point.y; };
  // Re-anchored on every phase, including the two that do not move anybody. A save
  // written against a different map opens with its formations back where the fighting
  // is rather than wherever its old coordinates pointed.
  place(texian, ground.texianStart); place(mexican, ground.mexican);
  if (battle.phase === 'approach') place(texian, between(ground.texianStart, ground.texianClosed, Math.min(1, (world.minute - TIMELINE.approach) / 80)));
  if (battle.phase === 'exchange') place(texian, ground.texianClosed);
  if (battle.phase === 'withdrawal') { place(texian, ground.texianClosed); place(mexican, between(ground.mexican, ground.mexicanGone, Math.min(1, (world.minute - TIMELINE.withdrawal) / 80))); }
  if (battle.phase === 'resolved') { place(texian, ground.texianClosed); place(mexican, ground.mexicanGone); }
  if (['approach', 'exchange', 'withdrawal', 'resolved'].includes(battle.phase)) {
    const last = world.director.frames.at(-1);
    if (!last || last.phase !== battle.phase) world.director.frames.push(structuredClone({ ...battle, minute: world.minute, caption: captions[battle.phase] }));
  }
}
export function advanceDirectors(world, movement) {
  if (!world.director || world.director.complete) return;
  once(world, 'notice', () => {
    establishTruth(world, { id: 'cannon-request', text: 'A Mexican detachment has reached the Guadalupe opposite Gonzales to reclaim the cannon. Local settlers have refused to return it.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-002' });
    learn(world, 'hh-1', 'cannon-request', { source: 'Nearby neighbor (fictional report)' });
    world.director.phase = 'news';
  });
  if (world.truth['cannon-request']) {
    for (const [index, household] of Object.values(world.households).entries()) {
      if (witnessing(world, household.id)) learn(world, household.id, 'cannon-request', { source: 'Local observation' });
      if (index > 0 && !world.director.dispatches[household.id] && world.minute >= TIMELINE.notice + (index - 1) * 40) {
        movement.dispatchReport(world, 'cannon-request', household.id);
        world.director.dispatches[household.id] = true;
      }
    }
  }
  once(world, 'publicNotice', () => learn(world, 'public', 'cannon-request', { source: 'Public report (reconstructed timing)' }));
  offerRequests(world); offerMarch(world);
  once(world, 'gathering', () => setBattlePhase(world, 'gathering'));
  once(world, 'approach', () => {
    // Silence is an answer, and it used to be the only one this game did not write down.
    // A family that let the neighbour go unanswered has a story, and VISION.md §20 builds
    // the epilogue out of exactly these. The hunt already says "Nobody answered"; this is
    // the same rule arriving at the decision that matters more.
    for (const [householdId, request] of Object.entries(world.requests)) {
      if (request.status !== 'open') continue;
      request.status = 'expired';
      record(world, 'consequence', {
        householdId, importance: 2, causes: [request.id],
        text: 'Nobody answered the neighbour at the door. The food went on to Gonzales without this family.',
      });
    }
    // An unanswered call is not a refusal. It closed because the force left without them.
    for (const [householdId, march] of Object.entries(world.marches || {})) {
      if (march.status !== 'open') continue;
      march.status = 'expired';
      const waiting = world.entities[march.actorId];
      record(world, 'consequence', {
        householdId, actorId: march.actorId, importance: 2, causes: [march.id],
        text: `Nobody answered, and the men crossed the river without ${waiting?.name || 'them'}.`,
      });
    }
    setBattlePhase(world, 'approach');
  });
  once(world, 'exchange', () => setBattlePhase(world, 'exchange'));
  // Whether somebody was actually standing there when it happened is decided here, while
  // it is happening - not afterwards from where they finally ended up. Answering the call
  // late and arriving after the shooting is a different story from being there for it.
  if (['approach', 'exchange', 'withdrawal'].includes(world.director.battle.phase)) {
    for (const [householdId, march] of Object.entries(world.marches || {})) {
      if (march.status === 'accepted' && !march.witnessed && atCamp(world, householdId)) march.witnessed = world.minute;
    }
  }
  once(world, 'withdrawal', () => setBattlePhase(world, 'withdrawal'));
  once(world, 'resolved', () => {
    setBattlePhase(world, 'resolved');
    const truth = establishTruth(world, { id: 'gonzales-outcome', text: HISTORICAL_OUTCOME, siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-004', causes: [world.director.lastBattleEventId] });
    for (const household of Object.values(world.households)) {
      if (witnessing(world, household.id)) learn(world, household.id, truth.id, { source: 'Local observation' });
      else movement.dispatchReport(world, truth.id, household.id);
    }
  });
  settleHelp(world); moveFormations(world);
  once(world, 'publicOutcome', () => learn(world, 'public', 'gonzales-outcome', { source: 'Public report (reconstructed timing)' }));
  once(world, 'finish', () => {
    world.director.complete = true; world.director.phase = 'preserved'; world.status = 'ended';
    record(world, 'slice-preserved', { visibility: 'public', text: 'The Gonzales prototype stops here. Families, absences, property, and memories are saved for the next arc. The Revolution continues beyond this slice.' });
  });
}
export function directorProjection(world, householdId, role) {
  if (!world.director) return {};
  const publicOutcome = world.knowledge.public['gonzales-outcome'];
  let battle = null;
  let host = { focus: 'regional', caption: 'The Host shows public reports; households may know different things.' };
  if (role === 'host' && publicOutcome) {
    const index = Math.min(world.director.frames.length - 1, Math.floor((world.minute - publicOutcome.receivedMinute) / 60));
    const frame = world.director.frames[Math.max(0, index)];
    if (frame) battle = { ...frame, reconstruction: true };
    host = { focus: 'reconstruction', caption: 'Delayed reconstruction: news of Gonzales has now become public. This shows the earlier clash.' };
  } else if (role === 'student' && householdId && witnessing(world, householdId) && world.director.battle.phase !== 'waiting') {
    battle = { ...world.director.battle, caption: captions[world.director.battle.phase], reconstruction: false };
  }
  // The upriver call takes the panel while it is open, because it is the one in front
  // of the family right now. The food call stays in the event log either way.
  const march = householdId && world.marches?.[householdId];
  const request = (march && march.status === 'open' ? march : null) || (householdId && world.requests[householdId]);
  const shown = request ? { id: request.id, text: request.text, status: request.status, kind: request === march ? 'march' : 'supplies' } : null;
  if (shown && shown.kind === 'march' && march.status === 'open') {
    // The stored text, not a fresh reading: the button must not quietly change its price
    // while a student is looking at it.
    shown.actorId = march.actorId;
    shown.risk = march.risk;
  }
  // Each answer with its own price, computed here and never guessed at by the client -
  // the same shape a chore's question takes, so the two read as one kind of decision.
  if (shown && shown.status === 'open') shown.options = requestOptions(world, householdId, shown, shown.kind);
  return structuredClone({ request: shown, battle, host: role === 'host' ? host : null, slice: { title: 'Gonzales', complete: world.director.complete }, historicalDate: new Date(Date.UTC(1835, 8, 29) + world.minute * 60000).toISOString().slice(0, 10) });
}
