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
import { BEXAR_STORMING } from './battles/bexar-storming.mjs';
import { SAN_JACINTO_BATTLE } from './battles/san-jacinto.mjs';

/** How a side stands and moves (docs/BATTLES.md §2.4). The renderer lays figures out by these and nothing else. */
// `camp` (docs/battle-research/staging.md §9, added for San Jacinto): a force at rest and not formed - sitting, standing
// about, at its fires.
export const STYLES = Object.freeze(['ranks', 'loose', 'wall', 'bank', 'street', 'column', 'mounted', 'rout', 'camp']);
/** What stands on a battle's ground (`works`, San Jacinto): drawn under the figures, from the phase it is built in until the one it is gone. */
export const WORK_KINDS = Object.freeze(['breastwork', 'fires', 'marsh', 'water']);
/**
 * What a group stands behind (docs/battle-research/staging.md §9, added for Béxar 2026-09-25). `loophole`: inside a stone
 * house, firing through holes cut in the wall - only the flash and the smoke are seen. `roof`: on a flat roof behind its
 * parapet. `barricade`: behind a street's palisade. `sandbags`: behind a breastwork of filled sacks.
 */
export const COVERS = Object.freeze(['loophole', 'roof', 'barricade', 'sandbags']);
/** The flags a phase may show where the record puts them: a white flag of truce. (The red or black flag is told in words.) */
export const FLAG_KINDS = Object.freeze(['white']);
/**
 * How a side fires in a phase. `volley`: by rank on an officer's word. `scattered`: every man on his own load, at his own
 * pace. `picket`: a few shots from the front, nobody else firing. `none`: nobody fires.
 */
export const FIRE = Object.freeze(['volley', 'scattered', 'picket', 'none']);
/** What a spoken line is, drawn on the bubble's edge (public/speech.js): solid for documented, dashed for anything else. */
export const LINE_KINDS = Object.freeze(['documented', 'reconstructed', 'tradition']);
export const SIDES = Object.freeze(['texian', 'mexican']);

/** Every engagement on the engine. Add one here and in sim/battles/ (docs/BATTLES.md §6). */
export const ENGAGEMENTS = Object.freeze({ [GONZALES.id]: GONZALES, [BEXAR_STORMING.id]: BEXAR_STORMING, [SAN_JACINTO_BATTLE.id]: SAN_JACINTO_BATTLE });

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
    // A background pace (Béxar's four days between its held episodes): calendar minutes a tick at most while a played
    // family has somebody in the force, a whole number of twenty-minute ticks, and never alongside a step.
    if (phase.background !== undefined && (phase.step !== undefined || !(phase.background > 0) || phase.background % 20 !== 0)) fail(`phase ${phase.id}'s background pace must be whole twenties of minutes, and not with a step`);
    for (const side of SIDES) {
      const at = phase[side];
      if (!at || !STYLES.includes(at.style) || !FIRE.includes(at.fire || 'none')) fail(`phase ${phase.id} side ${side} needs a style and a fire`);
      if (at.cover !== undefined && !COVERS.includes(at.cover)) fail(`phase ${phase.id} side ${side} stands behind nothing the renderer knows`);
    }
    // Groups drawn apart from their side: a division in its own house, men on a roof, a file along a wall, the townspeople.
    const units = new Set(SIDES), civilians = new Set();
    let figures = SIDES.reduce((sum, side) => sum + def.sides[side].drawn, 0);
    for (const group of phase.groups || []) {
      if (!group?.id || units.has(group.id) || !SIDES.includes(group.side) || !STYLES.includes(group.style) || !FIRE.includes(group.fire || 'none') || !(group.drawn > 0) || group.drawn > 40) fail(`group ${group?.id} in ${phase.id} is malformed`);
      if (group.cover !== undefined && !COVERS.includes(group.cover)) fail(`group ${group.id} in ${phase.id} stands behind nothing the renderer knows`);
      if (group.civilians && (group.fire || 'none') !== 'none') fail(`the townspeople in ${phase.id} are given a fire`);
      if (group.civilians) civilians.add(group.id);
      units.add(group.id); figures += group.drawn;
    }
    if (figures > 170) fail(`phase ${phase.id} draws ${figures} figures; a Chromebook's frame holds about 170`);
    for (const line of phase.lines || []) {
      if (!line.id || !line.text || !LINE_KINDS.includes(line.kind) || !SIDES.includes(line.side) || !(line.at >= 0 && line.at <= phase.minutes)) fail(`line ${line.id} in ${phase.id} is malformed`);
      if (line.kind === 'documented' && !line.claimId) fail(`documented line ${line.id} carries no claim`);
      if (line.name && line.kind === 'reconstructed') fail(`reconstructed line ${line.id} is put in a named person's mouth`);
      if (line.kind === 'tradition' && !line.claimId) fail(`tradition line ${line.id} carries no claim saying why it is doubted`);
      if (line.unit !== undefined && (!units.has(line.unit) || civilians.has(line.unit))) fail(`line ${line.id} in ${phase.id} is said by nobody there`);
    }
    for (const fall of phase.falls || []) {
      if (!SIDES.includes(fall.side) || !(fall.count > 0) || !fall.claimId || !(fall.at >= 0 && fall.at <= phase.minutes)) fail(`a fall in ${phase.id} is malformed`);
      if (def.noFalling?.includes(fall.side)) fail(`${fall.side} may not be drawn falling at ${def.id}`);
      if (fall.unit !== undefined && !units.has(fall.unit)) fail(`a fall in ${phase.id} is in a group that is not there`);
      if (civilians.has(fall.unit)) fail(`the townspeople are never drawn hurt (${phase.id})`);
    }
    for (const shot of phase.cannon || []) if (!(shot >= 0 && shot <= phase.minutes)) fail(`a cannon shot in ${phase.id} is outside it`);
    for (const [gunId, fire] of Object.entries(phase.guns || {})) {
      if (!def.guns?.some(gun => gun.id === gunId)) fail(`phase ${phase.id} fires a gun ${gunId} the engagement has not got`);
      if (Array.isArray(fire)) { for (const at of fire) if (!(at >= 0 && at <= phase.minutes)) fail(`a shot of ${gunId} in ${phase.id} is outside it`); }
      else if (!(fire?.every > 0)) fail(`gun ${gunId} in ${phase.id} needs its shots dated or an interval`);
    }
    for (const breach of phase.breaches || []) if (!breach.point || !SIDES.includes(breach.side) || !(breach.at >= 0 && breach.at <= phase.minutes)) fail(`a breach in ${phase.id} is malformed`);
    for (const flag of phase.flags || []) if (!FLAG_KINDS.includes(flag.kind) || !SIDES.includes(flag.side) || !flag.claimId || !(flag.from >= 0 && flag.from <= phase.minutes)) fail(`a flag in ${phase.id} is malformed`);
  }
  const phaseIds = new Set(def.phases.map(phase => phase.id));
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
/** And every background pace (a fight going on between its held episodes), which is an ordinary tick too. */
export const BATTLE_PACES = Object.freeze([...new Set(Object.values(ENGAGEMENTS).flatMap(def => def.phases.map(phase => phase.background).filter(Boolean)))].sort((a, b) => a - b));

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

/**
 * A family's person's fate in a deadly fight, staged at a moment inside it (docs/BATTLES.md §2.6; staging.md §9 "Fates at
 * staged moments"): decided when they join the force - from the roll the battle already makes, so the odds never move - and
 * kept in `world.battles[id].fates` with the minute it falls due. Never projected before that minute. The director applies
 * it when the clock reaches it (`fatesDue`) and marks it `applied`.
 */
export function stageFate(world, id, personId, fate) {
  const battle = world.battles?.[id];
  if (!battle) return null;
  battle.fates ||= {};
  return battle.fates[personId] ||= { ...fate };
}
/** The staged fates whose minute has come and which have not been applied yet. */
export const fatesDue = (world, id, minute = world.minute) => Object.entries(world.battles?.[id]?.fates || {})
  .filter(([, fate]) => !fate.applied && fate.minute <= minute).map(([personId, fate]) => ({ personId, ...fate }));
/**
 * Whether a family somebody plays has one of its own people in this force: what a background pace waits on, since a fight
 * nobody's person is in need not hold the class between its episodes (docs/battle-research/staging.md §3.2).
 */
export function watchedByAFamily(world, battle) {
  return Object.entries(battle?.participants || {}).some(([id, entry]) => {
    if (entry.released) return false;
    const person = world.entities?.[id], household = world.households?.[person?.householdId];
    return Boolean(person && household?.played && !household.absent && !['dead', 'captured'].includes(person.health?.condition));
  });
}

/** Where an engagement stands at this minute of the class's clock: its phase, how far into it, and whether it is live. */
export function battleState(world, id, minute = world.minute) {
  const def = ENGAGEMENTS[id], battle = world.battles?.[id];
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
 * Where an engagement starts on a class's clock, said by the director that owns it (`startsAt`, San Jacinto), for the clock's
 * sake only: a class saved before the engine knew a fight has no record of it until its director's next tick arms it, and
 * that first tick must already be held to the fight's step, or a save opened in the middle of the charge ran on half a day at
 * once. Nothing is written: the record is still made by `armBattle`.
 */
const starts = new Map();
export function startsAt(id, resolve) { starts.set(id, resolve); }
function clockStates(world) {
  const states = liveBattles(world);
  for (const [id, resolve] of starts) {
    if (world.battles?.[id]) continue;
    const start = resolve(world);
    if (!Number.isFinite(start)) continue;
    const state = battleState({ ...world, battles: { [id]: { id, start } } }, id);
    if (state?.live) states.push(state);
  }
  return states;
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
  for (const state of clockStates(world)) {
    const step = state.phase.step;
    const room = state.phase.to - world.minute;
    if (!step) {
      // Between held episodes (Béxar): the fight goes on at its background pace while a played family has somebody in it,
      // and in any case a tick lands on the start of the next watched phase rather than running past it.
      const next = state.phases[state.phase.index + 1];
      const background = state.phase.background && watchedByAFamily(world, state.battle) ? state.phase.background : null;
      const cap = background ?? (next && (next.step || next.background) ? room : null);
      if (cap === null) continue;
      const minutes = Math.max(1, Math.min(cap, room));
      if (best === null || minutes < best) best = minutes;
      continue;
    }
    const minutes = Math.max(1, Math.min(step, room));
    if (best === null || minutes < best) best = minutes;
  }
  // Also land exactly on a watched battle's first minute, so a fight never begins in the middle of a long tick.
  for (const [id, battle] of Object.entries(world.battles || {})) {
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
/** Where a unit - a side's own body, or a group drawn apart from it (`phase.groups`) - stands at this moment of its phase. */
export function unitPlace(ground, phase, unitId, into) {
  if (SIDES.includes(unitId)) return sidePlace(ground, phase, unitId, into);
  const group = (phase.groups || []).find(one => one.id === unitId);
  return group ? placeOf(ground, group, phase.minutes, into) : null;
}
/** The one rule for a place from `at`, `from`/`to` or `keys`, shared by sides and groups. */
function placeOf(ground, at, minutes, into) {
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
  return specMoving(phase[side], into);
}
function specMoving(at, into) {
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
/**
 * Who has fallen by this minute: each fall's count, side and the minute it happened, never a family's person's name. A fall
 * the record puts at a place (`point`) and on a named man (Milam in the Veramendi yard, `HIST-TEX-039`) carries both; a fall
 * in a group names the group. An engagement fought over days lets the fallen be carried off the field after `fallsLinger`.
 */
function fallenBy(state, minute, ground) {
  const fallen = [], linger = state.def.fallsLinger ?? Infinity;
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const fall of phase.falls || []) {
      const at = phase.from + fall.at;
      if (at > minute || minute - at > linger) continue;
      const place = fall.point && ground[fall.point];
      fallen.push({ side: fall.side, count: fall.count, minute: at, carried: Boolean(fall.carried), wounded: Boolean(fall.wounded), claimId: fall.claimId, ...(fall.unit && { unit: fall.unit }), ...(place && { x: place.x, y: place.y }), ...(fall.name && { name: fall.name }) });
    }
  }
  return fallen;
}
/**
 * Each gun's shots by this minute (the page fires each once, when it sees it): dated one by one in a held phase, or at an
 * interval through a phase fought in the background (`{ every }`, from the phase's start). The last eight.
 */
function gunShots(state, gunId, minute) {
  const shots = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    const fire = phase.guns?.[gunId];
    if (!fire) continue;
    if (Array.isArray(fire)) { for (const at of fire) if (phase.from + at <= minute) shots.push(phase.from + at); continue; }
    const last = Math.min(minute, phase.to - 1);
    for (let at = phase.from + (fire.from ?? fire.every); at <= last && at < phase.from + (fire.to ?? phase.minutes); at += fire.every) if (at > minute - 480) shots.push(at);
  }
  return shots.slice(-8);
}
/** Walls and doors broken so far: where, by whom, and from when the bar was at it. Nothing before the work began. */
function breachesBy(state, minute, ground) {
  const out = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const breach of phase.breaches || []) {
      const at = phase.from + breach.at, from = phase.from + (breach.from ?? Math.max(0, breach.at - 3));
      if (from > minute || !ground[breach.point]) continue;
      out.push({ x: ground[breach.point].x, y: ground[breach.point].y, side: breach.side, from, at, open: at <= minute, ...(breach.claimId && { claimId: breach.claimId }) });
    }
  }
  return out;
}

/**
 * What a page that may watch the fight is sent (docs/BATTLES.md §2.1, §3): the phase it is in and nothing of any phase to come,
 * each side as a count, a style, a place and what it is doing, the lines said so far, the cannon's shots so far, the fallen so
 * far, and which of the people on this page's map are in the force. No fate, no future phase, no hidden count.
 *
 * `members` is the list of entity ids this viewer's page draws doing the force's work: the viewer's own family for a
 * student, everybody's for the Host (who is already sent every person, sim/overview.mjs).
 */
export function projectBattle(world, id, { members = [], legacyPhase = null, units = null, fates = null } = {}) {
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
      ...(at.dismounted && { dismounted: at.dismounted }), ...(info.figure && { figure: info.figure }), ...(at.cover && { cover: at.cover }),
      // A side forming in haste stands in uneven ranks; a share of a broken side has its hands up (drawn, not counted).
      ...(at.ragged && { ragged: true }), ...(at.surrendering && !state.over && { surrendering: at.surrendering }),
    };
  });
  const view = {
    id, name: def.name, phase: phase.id, title: phase.title || null, legacyPhase, caption: phase.caption, claimId: phase.claimId,
    minute: world.minute, live: state.live, over: state.over, contact: state.live && world.minute >= state.contact,
    step: phase.step || null, sides,
    lines: state.over ? [] : linesSaid(state, world.minute),
    commands: def.commands || null,
    fallen: fallenBy(state, world.minute, ground),
    members: [...members],
    ...(def.noFalling && { noFalling: def.noFalling }),
  };
  // Groups drawn apart from their side (Béxar's divisions in their houses, men on the roofs, a file under the loopholes, the
  // townspeople let out through a breach): each where it stands now, facing what it faces, doing what it does.
  if (phase.groups?.length) {
    view.groups = phase.groups.map(group => {
      const place = placeOf(ground, group, phase.minutes, into);
      const enemy = group.face ? ground[group.face] : group.side === 'texian' ? mexican : texian;
      const facing = facingOf(place, enemy);
      return {
        id: group.id, side: group.side, name: group.name || null, count: group.count || null, drawn: group.drawn, style: group.style,
        fire: state.over ? 'none' : group.fire || 'none', action: state.over ? 'gone' : group.action || 'stand',
        moving: !state.over && specMoving(group, into), x: place.x, y: place.y, facing: group.away ? { x: -facing.x, y: -facing.y } : facing,
        spread: group.spread || null, ...(group.cover && { cover: group.cover }), ...(group.civilians && { civilians: true }), ...(group.mounted && { mounted: true }),
      };
    });
  }
  // The guns standing on the ground in this phase, each with its shots so far (`def.guns`, `phase.guns`).
  const guns = (def.guns || []).filter(gun => phase.guns && gun.id in phase.guns && ground[gun.at]);
  if (guns.length) {
    view.guns = guns.map(gun => {
      const at = ground[gun.at], target = ground[gun.face] || (gun.side === 'texian' ? mexican : texian);
      return { id: gun.id, side: gun.side, x: at.x, y: at.y, facing: facingOf(at, target), metal: gun.metal || 'iron', crew: gun.crew ?? 3, shots: state.over ? [] : gunShots(state, gun.id, world.minute), claimId: gun.claimId };
    });
  }
  // What stands on the ground (San Jacinto's breastwork, the camps' fires, the marsh), laid across the line between the camps.
  if (def.works) {
    const across = ground.toward ? { x: -ground.toward.y, y: ground.toward.x } : { x: -toward.texian.y, y: toward.texian.x };
    const works = def.works.filter(work => standsIn(def, work, phase) && ground[work.at]).map(work => ({ id: work.id, kind: work.kind, x: ground[work.at].x, y: ground[work.at].y, width: work.width, across, claimId: work.claimId }));
    if (works.length) view.works = works;
  }
  const breaches = breachesBy(state, world.minute, ground);
  if (breaches.length) view.breaches = breaches;
  // A flag where the record puts one, from the minute it came out (the white flag at Béxar, `HIST-TEX-491`).
  const flags = (phase.flags || []).filter(flag => flag.from <= into).map(flag => {
    const place = placeOf(ground, flag, phase.minutes, into);
    return { side: flag.side, kind: flag.kind, x: place.x, y: place.y, claimId: flag.claimId };
  });
  if (flags.length && !state.over) view.flags = flags;
  // The ground a page frames the fight on, where the engagement names it (the town and the Alamo's guns at its edge).
  const frame = (phase.frame || def.frame || []).map(name => ground[name]).filter(Boolean);
  if (frame.length) view.frame = frame.map(point => ({ x: point.x, y: point.y }));
  // Which unit each of the members stands in, so the page poses them with that unit's fire, and a member's own fate once -
  // and only once - its minute has come (docs/BATTLES.md §2.6). Nothing staged for later is sent.
  if (units) {
    const shown = Object.fromEntries(members.filter(one => units[one]).map(one => [one, units[one]]));
    if (Object.keys(shown).length) view.memberUnits = shown;
  }
  if (fates) {
    const fell = Object.fromEntries(members.filter(one => fates[one] && fates[one].minute <= world.minute).map(one => [one, { fate: fates[one].fate, minute: fates[one].minute, ...(fates[one].grade && { grade: fates[one].grade }) }]));
    if (Object.keys(fell).length) view.memberFates = fell;
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
