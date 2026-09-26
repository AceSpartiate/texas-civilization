// The one battle engine (docs/BATTLES.md §3, and §6 for how to add an engagement).
//
// Owner, 2026-09-25: "wouldn't the mexican army be in rows, but the texians in unorganized chaos? shouldn't there be talking,
// orders given, taunting etc? it's okay to make battles last longer to show the full experience as long as it appears correct
// to the player. players that have a character there should get an alert to watch. if they sent a character, it needs to
// happen in such a way that their character arrives in time to participate and does participate."
//
// An engagement is data (sim/battles/<id>.mjs): its ground, where on the director's clock it starts, its phases with their
// game-minute lengths and the calendar step each is watched at, each side's style, count, place and fire in every phase, the
// lines spoken and when, the moments anybody falls, and what follows. Everything a page is sent is worked out here from that
// data and the clock, so a class saved in the middle of a fight reopens in the middle of it and an old save with no
// `world.battles` opens with none - the correct empty value, and no `saveVersion` moves (CLAUDE.md).
//
// What is stored in `world.battles[id]` is only what the clock cannot give back: when this class's clock put the start, who
// of the families was in the force and from when, and which families have been alerted, told and have heard. Phase, the
// sides' places, the fire, the lines and the fallen are all recomputed from the minute.
//
// Nothing in a formation is a person (`FIC-GONZ-006`): a side is a count and a style, drawn as a sample. A family's own people
// are real entities at their own positions, in the force (`members`), and the renderer draws them doing what it does.
import { GONZALES } from './battles/gonzales.mjs';
import { SAN_JACINTO_BATTLE } from './battles/san-jacinto.mjs';

/** How a side stands and moves (docs/BATTLES.md §2.4). The renderer lays figures out by these and nothing else. */
// `camp` (docs/battle-research/staging.md §9): a force at rest and not formed - sitting, standing about, at its fires.
export const STYLES = Object.freeze(['ranks', 'loose', 'wall', 'bank', 'street', 'column', 'mounted', 'rout', 'camp']);
/** What stands on a battle's ground (`works`): drawn under the figures, from the phase it is built in until the one it is gone. */
export const WORK_KINDS = Object.freeze(['breastwork', 'fires', 'marsh', 'water']);
/**
 * How a side fires in a phase. `volley`: by rank on an officer's word. `scattered`: every man on his own load, at his own
 * pace. `picket`: a few shots from the front, nobody else firing. `none`: nobody fires.
 */
export const FIRE = Object.freeze(['volley', 'scattered', 'picket', 'none']);
/** What a spoken line is, drawn on the bubble's edge (public/speech.js): solid for documented, dashed for anything else. */
export const LINE_KINDS = Object.freeze(['documented', 'reconstructed', 'tradition']);
export const SIDES = Object.freeze(['texian', 'mexican']);

/** Every engagement on the engine. Add one here and in sim/battles/ (docs/BATTLES.md §6). */
export const ENGAGEMENTS = Object.freeze({ [GONZALES.id]: GONZALES, [SAN_JACINTO_BATTLE.id]: SAN_JACINTO_BATTLE });
/**
 * The guns of an engagement: `guns`, each with its own id, place and shots (`phase.shots[id]`), or the one `cannon` Gonzales
 * has, whose shots are `phase.cannon`.
 */
export const gunsOf = def => def.guns || (def.cannon ? [{ id: 'cannon', ...def.cannon }] : []);
const shotsOf = (def, phase, gunId) => phase.shots?.[gunId] || (!def.guns && gunId === 'cannon' ? phase.cannon : null) || [];

/**
 * The rules an engagement's data is held to, checked when this module loads so a malformed battle never reaches a class.
 * The talk rules are `FIC-GONZ-447`: a documented line carries a claim; a named person speaks only documented words; a
 * reconstructed line never names anybody; a disputed line is `tradition` and says so.
 */
export function checkEngagement(def) {
  const fail = why => { throw new Error(`Engagement ${def?.id}: ${why}`); };
  if (!def?.id || !def.startKey || !Array.isArray(def.phases) || !def.phases.length) fail('needs an id, a start and phases');
  for (const side of SIDES) {
    const s = def.sides?.[side];
    if (!s || !(s.count > 0) || !(s.drawn > 0) || s.drawn > 60) fail(`side ${side} needs a count and a drawn sample of at most 60`);
  }
  const seen = new Set();
  for (const phase of def.phases) {
    if (!phase.id || seen.has(phase.id)) fail(`phase ${phase.id} is missing or repeated`);
    seen.add(phase.id);
    if (!(phase.minutes > 0) || !Number.isInteger(phase.minutes)) fail(`phase ${phase.id} needs whole minutes`);
    if (phase.step !== undefined && (!(phase.step > 0) || phase.minutes % phase.step !== 0 || 20 % phase.step !== 0)) fail(`phase ${phase.id}'s step must divide both its length and twenty minutes`);
    for (const side of SIDES) {
      const at = phase[side];
      if (!at || !STYLES.includes(at.style) || !FIRE.includes(at.fire || 'none')) fail(`phase ${phase.id} side ${side} needs a style and a fire`);
    }
    for (const line of phase.lines || []) {
      if (!line.id || !line.text || !LINE_KINDS.includes(line.kind) || !SIDES.includes(line.side) || !(line.at >= 0 && line.at <= phase.minutes)) fail(`line ${line.id} in ${phase.id} is malformed`);
      if (line.kind === 'documented' && !line.claimId) fail(`documented line ${line.id} carries no claim`);
      if (line.name && line.kind === 'reconstructed') fail(`reconstructed line ${line.id} is put in a named person's mouth`);
    }
    for (const fall of phase.falls || []) {
      if (!SIDES.includes(fall.side) || !(fall.count > 0) || !fall.claimId || !(fall.at >= 0 && fall.at <= phase.minutes)) fail(`a fall in ${phase.id} is malformed`);
      if (def.noFalling?.includes(fall.side)) fail(`${fall.side} may not be drawn falling at ${def.id}`);
      if (fall.party && !(phase.parties || []).some(party => party.id === fall.party && party.side === fall.side)) fail(`a fall in ${phase.id} is from a party that is not there`);
    }
    for (const shot of phase.cannon || []) if (!(shot >= 0 && shot <= phase.minutes)) fail(`a cannon shot in ${phase.id} is outside it`);
    // A party: a few men drawn apart from their side (a detachment of horse, a column coming in), with their own place.
    for (const party of phase.parties || []) {
      if (!party.id || !SIDES.includes(party.side) || !STYLES.includes(party.style) || !FIRE.includes(party.fire || 'none') || !(party.drawn > 0) || party.drawn > 20 || !(party.at || party.from || party.keys)) fail(`party ${party.id} in ${phase.id} is malformed`);
    }
    for (const [gunId, shots] of Object.entries(phase.shots || {})) {
      if (!gunsOf(def).some(gun => gun.id === gunId)) fail(`${phase.id} fires a gun ${gunId} the engagement does not have`);
      for (const shot of shots) if (!(shot >= 0 && shot <= phase.minutes)) fail(`a shot of ${gunId} in ${phase.id} is outside it`);
    }
  }
  const phaseIds = new Set(def.phases.map(phase => phase.id));
  for (const gun of gunsOf(def)) {
    if (!gun.id || !SIDES.includes(gun.side)) fail(`gun ${gun.id} needs an id and a side`);
    for (const key of ['from', 'until']) if (gun[key] && !phaseIds.has(gun[key])) fail(`gun ${gun.id}'s ${key} is not a phase`);
    if (gun.pin && !phaseIds.has(gun.pin.phase)) fail(`gun ${gun.id} is pinned at a phase that is not there`);
  }
  for (const work of def.works || []) {
    if (!work.id || !WORK_KINDS.includes(work.kind) || !work.at || !(work.width > 0) || !work.claimId) fail(`work ${work.id} is malformed`);
    for (const key of ['from', 'until']) if (work[key] && !phaseIds.has(work[key])) fail(`work ${work.id}'s ${key} is not a phase`);
  }
  if (!def.phases.some(phase => phase.contact)) fail('no phase is marked as contact');
  return def;
}
/** Whether a thing shown from phase `from` until phase `until` (both optional) stands in this phase. */
const standsIn = (def, thing, phase) => {
  const index = id => def.phases.findIndex(one => one.id === id);
  return (!thing.from || phase.index >= index(thing.from)) && (!thing.until || phase.index < index(thing.until));
};
for (const def of Object.values(ENGAGEMENTS)) checkEngagement(def);

/**
 * Every calendar step a battle ever watches at, which the page has to know is an ordinary tick and not a Host's jump
 * (public/motion.js `CALENDAR_STEPS`; tests/movement.test.mjs holds the two equal).
 */
export const BATTLE_STEPS = Object.freeze([...new Set(Object.values(ENGAGEMENTS).flatMap(def => def.phases.map(phase => phase.step).filter(Boolean)))].sort((a, b) => a - b));

/** Each phase with the minute of this class's clock it runs from and to. */
export function schedule(def, start) {
  let at = start;
  return def.phases.map((phase, index) => { const from = at; at += phase.minutes; return { ...phase, index, from, to: at }; });
}
/** Minutes from an engagement's start to the start of one of its phases: how the director dates its own moments. */
export function phaseOffset(def, phaseId) {
  let at = 0;
  for (const phase of def.phases) { if (phase.id === phaseId) return at; at += phase.minutes; }
  throw new Error(`${def.id} has no phase ${phaseId}`);
}
export const engagementMinutes = def => def.phases.reduce((sum, phase) => sum + phase.minutes, 0);

/**
 * Make sure this class has a record of an engagement, starting where its director says. Called every tick by the director
 * that owns the fight; a class saved before the engine has none and gains it here, empty, with nothing it can have missed.
 */
export function armBattle(world, id, start) {
  if (!world.battles) world.battles = {};
  const battle = world.battles[id] ||= { id, start, participants: {}, alerted: {}, told: {}, heard: {} };
  // The director's clock is the authority: a class whose timeline moved (a save from before arrivals) re-anchors.
  battle.start = start;
  for (const key of ['participants', 'alerted', 'told', 'heard']) battle[key] ||= {};
  return battle;
}

/** Where an engagement stands at this minute of the class's clock: its phase, how far into it, and whether it is live. */
export function battleState(world, id, minute = world.minute) {
  return stateOf(ENGAGEMENTS[id], world.battles?.[id], minute);
}
function stateOf(def, battle, minute) {
  if (!def || !battle || !Number.isFinite(battle.start)) return null;
  const phases = schedule(def, battle.start);
  const end = phases.at(-1).to;
  if (minute < battle.start) return { def, battle, phases, phase: null, before: true, over: false, live: false, end };
  if (minute >= end) return { def, battle, phases, phase: phases.at(-1), into: phases.at(-1).minutes, before: false, over: true, live: false, end };
  const phase = phases.find(one => minute >= one.from && minute < one.to);
  const firstContact = phases.find(one => one.contact);
  return { def, battle, phases, phase, into: minute - phase.from, before: false, over: false, live: true, end, contact: firstContact.from, fighting: minute >= firstContact.from && phase.index <= lastFighting(phases).index };
}
const lastFighting = phases => [...phases].reverse().find(one => one.contact) || phases.at(-1);
/**
 * Where an engagement starts on a class's clock, said by the director that owns it (`startsAt`), for the clock's sake only:
 * a class saved before the engine knew a fight has no record of it until its director's next tick arms it, and that first
 * tick must already be held to the fight's step, or a save opened in the middle of the charge ran on half a day at once.
 * Nothing is written: the record is still made by `armBattle`.
 */
const starts = new Map();
export function startsAt(id, resolve) { starts.set(id, resolve); }
function battlesOf(world) {
  const battles = { ...(world.battles || {}) };
  for (const [id, resolve] of starts) {
    if (battles[id]) continue;
    const start = resolve(world);
    if (Number.isFinite(start)) battles[id] = { id, start };
  }
  return battles;
}
/** Every engagement being fought at this minute. */
export const liveBattles = world => Object.keys(world.battles || {}).map(id => battleState(world, id)).filter(state => state?.live);

/**
 * How many minutes of the calendar the next tick may carry while a watched phase runs, or null when no battle holds it.
 *
 * `FIC-GONZ-445`: the shared clock is held to the phase's `step` so the fighting plays for minutes a class can watch -
 * three to six real minutes at the Study pace - and never lands past the next phase's start. It only ever slows the clock:
 * `battleMinutes` in sim/military-pacing.mjs takes the smaller of this and whatever the clock proposed.
 */
export function battleStep(world) {
  let best = null;
  const battles = battlesOf(world);
  const live = Object.entries(battles).map(([id, battle]) => stateOf(ENGAGEMENTS[id], battle, world.minute)).filter(state => state?.live);
  for (const state of live) {
    const step = state.phase.step;
    // A phase nobody watches runs at the class's own pace, but lands exactly on the next watched one: a long tick of the
    // campaign calendar never carries a class past the start of a fight (San Jacinto's quiet afternoon, then the parade).
    if (!step) {
      const next = state.phases.find(one => one.index > state.phase.index && one.step);
      if (next && (best === null || next.from - world.minute < best)) best = Math.max(1, next.from - world.minute);
      continue;
    }
    const room = state.phase.to - world.minute;
    const minutes = Math.max(1, Math.min(step, room));
    if (best === null || minutes < best) best = minutes;
  }
  // Also land exactly on a watched battle's first minute, so a fight never begins in the middle of a long tick.
  for (const [id, battle] of Object.entries(battles)) {
    const def = ENGAGEMENTS[id];
    if (!def || !Number.isFinite(battle.start) || world.minute >= battle.start || !def.phases[0].step) continue;
    const room = battle.start - world.minute;
    if (best === null || room < best) best = room;
  }
  return best;
}

const lerp = (a, b, part) => ({ x: a.x + (b.x - a.x) * part, y: a.y + (b.y - a.y) * part });
const ease = part => part < 0 ? 0 : part > 1 ? 1 : part * part * (3 - 2 * part);
/** Where a side stands at this moment: eased from its phase's `from` point to its `to`, both named points of the ground. */
export function sidePlace(ground, phase, side, into) {
  return placeOf(ground, phase[side], phase.minutes, into);
}
/** Where a side or a party stands at this moment of a phase `minutes` long: at a point, eased from one to another, or by keys. */
export function placeOf(ground, at, minutes, into) {
  const point = name => { if (!ground[name]) throw new Error(`Ground has no point ${name}`); return ground[name]; };
  // Keyframes, `[[minute, point], ...]`: a charge out and back, a fall back to the trees, held between the keys.
  if (at.keys) {
    const keys = at.keys;
    if (into <= keys[0][0]) return point(keys[0][1]);
    for (let i = 1; i < keys.length; i++) {
      const [m0, p0] = keys[i - 1], [m1, p1] = keys[i];
      if (into <= m1) return lerp(point(p0), point(p1), ease((into - m0) / Math.max(1, m1 - m0)));
    }
    return point(keys.at(-1)[1]);
  }
  const from = point(at.from || at.at), to = point(at.to || at.from || at.at);
  return lerp(from, to, ease(into / minutes));
}
/** Whether a side is on the move at this moment of its phase, which is what the page draws as marching. */
export function sideMoving(phase, side, into) {
  return movingAt(phase[side], into);
}
function movingAt(at, into) {
  if (at.keys) {
    for (let i = 1; i < at.keys.length; i++) if (into >= at.keys[i - 1][0] && into < at.keys[i][0] && at.keys[i - 1][1] !== at.keys[i][1]) return true;
    return false;
  }
  return Boolean(at.to && at.to !== (at.from || at.at));
}
/** The unit vector from one side toward the other: which way each faces. */
function facingOf(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, span = Math.hypot(dx, dy) || 1;
  return { x: dx / span, y: dy / span };
}

/**
 * Where a family's own person stands in a loose force: a stable place scattered through the force's ground, decided by who
 * they are, so the same class always stands the same way and two of a family never stand on one spot. Miles, relative to
 * the force's centre, in the frame whose `x` runs toward the enemy.
 */
export function looseSlot(personId, index, spread) {
  let hash = 2166136261;
  for (const character of String(personId)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const a = ((hash >>> 0) % 1000) / 1000, b = ((Math.imul(hash, 2654435761) >>> 0) % 1000) / 1000;
  // Toward the front third of the force: a man who came to fight is in the firing line, not with the horses at the back.
  return { along: -spread.depth * (0.1 + 0.35 * a), across: spread.width * ((index % 2 ? 1 : -1) * (0.08 + 0.34 * b)) };
}
/**
 * Where a family's own person stands in a formed line (`ranks`): one of three ranks and a stable place along it, decided by
 * who they are. `drift` (0 to 1) is how far they have fallen out of it: a man who has not drilled lags behind the rank as the
 * line walks (San Jacinto, `FIC-GONZ-443`; `HIST-TEX-075`, the drill "had a good effect in disciplining us").
 */
export function rankSlot(personId, { drift = 0, width = 0.38 } = {}) {
  let hash = 2166136261;
  for (const character of String(personId)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const a = ((hash >>> 0) % 1000) / 1000, b = ((Math.imul(hash, 2654435761) >>> 0) % 1000) / 1000, c = ((Math.imul(hash, 40503) >>> 0) % 1000) / 1000;
  return { along: -Math.floor(b * 3) * 0.03 - drift * (0.008 + 0.022 * c), across: width * (a - 0.5) + drift * 0.012 * (c - 0.5) };
}
/** A point `offset` from `centre` in the frame whose first axis runs along `facing`. */
export function placeFrom(centre, facing, { along, across }) {
  const side = { x: -facing.y, y: facing.x };
  return { x: centre.x + facing.x * along + side.x * across, y: centre.y + facing.y * along + side.y * across };
}

/** The lines that have been said by this minute: this phase's so far, and the last few of the one before it. */
function linesSaid(state, minute) {
  const said = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const line of phase.lines || []) {
      const at = phase.from + line.at;
      if (at <= minute) said.push({ ...line, minute: at, phase: phase.id });
    }
  }
  return said.slice(-8);
}
/** The shots the cannon has fired by this minute in this phase and the one before (the page fires each once, when it sees it). */
function cannonFired(state, minute) {
  const shots = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const at of phase.cannon || []) if (phase.from + at <= minute) shots.push(phase.from + at);
  }
  return shots.slice(-6);
}
/** Each shot one gun has fired by this minute (the page fires each once, when it sees it): the last six. */
function gunFired(state, minute, gunId) {
  const shots = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const at of shotsOf(state.def, phase, gunId)) if (phase.from + at <= minute) shots.push(phase.from + at);
  }
  return shots.slice(-6);
}
/** Who has fallen by this minute: each fall's count, side and the minute it happened, never anybody's name. */
function fallenBy(state, minute) {
  const fallen = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const fall of phase.falls || []) if (phase.from + fall.at <= minute) fallen.push({ side: fall.side, count: fall.count, minute: phase.from + fall.at, carried: Boolean(fall.carried), wounded: Boolean(fall.wounded), claimId: fall.claimId, ...(fall.party && { party: fall.party }) });
  }
  return fallen;
}

/**
 * What a page that may watch the fight is sent (docs/BATTLES.md §2.1, §3): the phase it is in and nothing of any phase to come,
 * each side as a count, a style, a place and what it is doing, the lines said so far, the cannon's shots so far, the fallen so
 * far, and which of the people on this page's map are in the force. No fate, no future phase, no hidden count.
 *
 * `members` is the list of entity ids this viewer's page draws doing the force's work: the viewer's own family for a
 * student, everybody's for the Host (who is already sent every person, sim/overview.mjs).
 */
export function projectBattle(world, id, { members = [], memberStates = null, legacyPhase = null } = {}) {
  const state = battleState(world, id);
  if (!state || state.before) return null;
  const { def, phase } = state;
  const ground = def.ground(world);
  const into = Math.min(state.into, phase.minutes);
  const texian = sidePlace(ground, phase, 'texian', into), mexican = sidePlace(ground, phase, 'mexican', into);
  const toward = { texian: facingOf(texian, mexican), mexican: facingOf(mexican, texian) };
  const sides = SIDES.map(side => {
    const at = phase[side], info = def.sides[side], place = side === 'texian' ? texian : mexican;
    return {
      side, name: info.name, count: at.count ?? info.count, drawn: info.drawn, style: at.style, fire: state.over ? 'none' : at.fire || 'none',
      action: state.over ? 'gone' : at.action || 'stand', moving: !state.over && sideMoving(phase, side, into), x: place.x, y: place.y, facing: at.face === 'away' ? { x: -toward[side].x, y: -toward[side].y } : toward[side],
      spread: at.spread || info.spread, ...(at.mounted !== undefined ? { mounted: at.mounted } : info.mounted !== undefined ? { mounted: info.mounted } : {}),
      ...(at.dismounted && { dismounted: at.dismounted }), ...(info.figure && { figure: info.figure }),
      // A side forming in haste stands in uneven ranks; a share of a broken side has its hands up (drawn, not counted).
      ...(at.ragged && { ragged: true }), ...(at.surrendering && !state.over && { surrendering: at.surrendering }),
    };
  });
  // Parties: a few men of a side drawn apart from it, with their own place, style and fire (docs/BATTLES.md §6.12's way out).
  // One on the move faces the way it goes; one standing faces the other side.
  const parties = state.over ? [] : (phase.parties || []).map(party => {
    const place = placeOf(ground, party, phase.minutes, into), ahead = placeOf(ground, party, phase.minutes, Math.min(phase.minutes, into + 1));
    const moving = movingAt(party, into) && Math.hypot(ahead.x - place.x, ahead.y - place.y) > 1e-6;
    const enemy = party.side === 'texian' ? mexican : texian;
    const facing = moving ? facingOf(place, ahead) : party.face === 'away' ? facingOf(enemy, place) : facingOf(place, enemy);
    return {
      id: party.id, side: party.side, name: party.name, count: party.count ?? null, drawn: party.drawn, style: party.style, fire: party.fire || 'none',
      action: party.action || 'stand', moving, x: place.x, y: place.y, facing, ...(party.spread && { spread: party.spread }), ...(party.mounted && { mounted: true }), claimId: party.claimId || null,
    };
  });
  const view = {
    id, name: def.name, phase: phase.id, title: phase.title || null, legacyPhase, caption: phase.caption, claimId: phase.claimId,
    minute: world.minute, live: state.live, over: state.over, contact: state.live && world.minute >= state.contact,
    step: phase.step || null, sides,
    lines: state.over ? [] : linesSaid(state, world.minute),
    commands: def.commands || null,
    fallen: fallenBy(state, world.minute),
    members: [...members],
    ...(def.noFalling && { noFalling: def.noFalling }),
    ...(parties.length && { parties }),
  };
  // How each of this page's own people in the force is, once the moment it happened has come (docs/BATTLES.md §2.6): the
  // director says whose and when; nothing is sent before its minute, and nobody else's.
  if (memberStates) {
    const states = Object.fromEntries(Object.entries(memberStates).filter(([person, one]) => members.includes(person) && Number.isFinite(one?.at) && one.at <= world.minute));
    if (Object.keys(states).length) view.memberStates = states;
  }
  // The guns: each with its side until it takes its station, and there after (`pin`).
  if (def.guns) {
    const pinned = gun => Boolean(gun.pin) && phase.index >= def.phases.findIndex(one => one.id === gun.pin.phase);
    view.guns = gunsOf(def).filter(gun => standsIn(def, gun, phase)).map(gun => {
      const centre = gun.side === 'texian' ? texian : mexican;
      const at = pinned(gun) ? placeFrom(ground[gun.pin.point], toward[gun.side], { along: 0, across: gun.pin.across || 0 }) : placeFrom(centre, toward[gun.side], gun.offset);
      return { id: gun.id, side: gun.side, ...at, pinned: pinned(gun), shots: gunFired(state, world.minute, gun.id), crew: gun.crew || 3, metal: gun.metal || 'iron', claimId: gun.claimId };
    });
  }
  // What stands on the ground, laid across the line from one camp to the other.
  if (def.works) {
    const across = ground.toward ? { x: -ground.toward.y, y: ground.toward.x } : { x: -toward.texian.y, y: toward.texian.x };
    view.works = def.works.filter(work => standsIn(def, work, phase)).map(work => ({ id: work.id, kind: work.kind, x: ground[work.at].x, y: ground[work.at].y, width: work.width, across, claimId: work.claimId }));
  }
  if (def.cannon) {
    const side = def.cannon.side, centre = side === 'texian' ? texian : mexican;
    view.cannon = { side, ...placeFrom(centre, toward[side], def.cannon.offset), shots: cannonFired(state, world.minute), crew: def.cannon.crew || 3, metal: def.cannon.metal || 'iron', claimId: def.cannon.claimId };
  }
  if (def.flag && phase.flag !== false) {
    const side = def.flag.side, centre = side === 'texian' ? texian : mexican;
    view.flag = { side, kind: def.flag.kind, ...placeFrom(centre, toward[side], def.flag.offset), claimId: def.flag.claimId, words: def.flag.words };
  }
  if (phase.parley && !state.over) {
    const between = phase.parley.at ? ground[phase.parley.at] : lerp(texian, mexican, phase.parley.part ?? 0.5);
    view.parley = { x: between.x, y: between.y, people: phase.parley.people };
  }
  // The shape the old renderer and the old tests read: two formations with a count and a place and nobody's name.
  view.formations = sides.map(side => ({ id: `formation-${side.side}`, side: side.side, x: side.x, y: side.y, count: side.drawn }));
  return view;
}

/**
 * Whether this person is with a force in a live battle and may not be sent anywhere else until it is over: somebody who
 * went to fight fights, and comes back with the men (owner, 2026-09-25: "it needs to happen in such a way that their
 * character arrives in time to participate and does participate"). Returns the reason in the family's words, or null.
 */
export function heldByBattle(world, entity) {
  for (const [id, battle] of Object.entries(world.battles || {})) {
    if (!battle.participants?.[entity.id] || battle.participants[entity.id].released) continue;
    const state = battleState(world, id);
    if (!state || state.over) continue;
    return state.def.held?.(entity.name) || `${entity.name} is with the men in the fight, and comes back with them when it is over.`;
  }
  return null;
}
