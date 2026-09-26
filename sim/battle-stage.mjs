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
import { ALAMO } from './battles/alamo.mjs';

/** How a side stands and moves (docs/BATTLES.md §2.4). The renderer lays figures out by these and nothing else. */
export const STYLES = Object.freeze(['ranks', 'loose', 'wall', 'bank', 'street', 'column', 'mounted', 'rout']);
/**
 * How a side fires in a phase. `volley`: by rank on an officer's word. `scattered`: every man on his own load, at his own
 * pace. `picket`: a few shots from the front, nobody else firing. `none`: nobody fires.
 */
export const FIRE = Object.freeze(['volley', 'scattered', 'picket', 'none']);
/** What a spoken line is, drawn on the bubble's edge (public/speech.js): solid for documented, dashed for anything else. */
export const LINE_KINDS = Object.freeze(['documented', 'reconstructed', 'tradition']);
export const SIDES = Object.freeze(['texian', 'mexican']);

/** Every engagement on the engine. Add one here and in sim/battles/ (docs/BATTLES.md §6). */
export const ENGAGEMENTS = Object.freeze({ [GONZALES.id]: GONZALES, [ALAMO.id]: ALAMO });
/**
 * The longer calendar steps a watched phase may be held at, beside the divisors of twenty minutes: an hour, and four hours -
 * a long siege's days, watched a quarter-day at a time (docs/BATTLES.md §7). Both are steps the page already draws as an
 * ordinary tick (public/motion.js `CALENDAR_STEPS`).
 */
export const LONG_STEPS = Object.freeze([60, 240]);
/** The parts of a side a phase may draw apart (docs/BATTLES.md §7.2): each its own count, style, place, facing and fire. */
const partsOf = at => at?.groups || null;

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
    if (phase.step !== undefined && (!(phase.step > 0) || phase.minutes % phase.step !== 0 || (20 % phase.step !== 0 && !LONG_STEPS.includes(phase.step)))) fail(`phase ${phase.id}'s step must divide both its length and twenty minutes`);
    if (phase.watched !== undefined && (phase.watched !== 'involved' || typeof def.involved !== 'function' || !phase.step)) fail(`phase ${phase.id} is watched only when somebody is involved, and its engagement cannot say when`);
    for (const side of SIDES) {
      const at = phase[side];
      if (!at || !STYLES.includes(at.style) || !FIRE.includes(at.fire || 'none')) fail(`phase ${phase.id} side ${side} needs a style and a fire`);
      const ids = new Set();
      for (const part of partsOf(at) || []) {
        if (!part.id || ids.has(part.id) || !STYLES.includes(part.style) || !FIRE.includes(part.fire || 'none') || !(part.drawn > 0) || part.drawn > 60) fail(`part ${part.id} of ${side} in ${phase.id} needs its own id, style, fire and a drawn sample of at most 60`);
        ids.add(part.id);
      }
      if (partsOf(at) && partsOf(at).reduce((sum, part) => sum + part.drawn, 0) > 120) fail(`${side} in ${phase.id} is drawn as more than 120 figures`);
    }
    for (const person of phase.people || []) {
      if (!person.id || !person.name || !SIDES.includes(person.side) || !person.at || !person.claimId) fail(`a named person in ${phase.id} needs an id, a name, a side, a place and the claim that puts them there`);
      if (person.falls !== undefined && !(person.falls >= 0 && person.falls <= phase.minutes)) fail(`${person.name} falls outside ${phase.id}`);
    }
    for (const [id, gun] of Object.entries(phase.guns || {})) {
      if (!def.guns?.some(one => one.id === id)) fail(`${phase.id} fires a gun ${id} the engagement has not got`);
      for (const shot of gun.shots || []) if (!(shot >= 0 && shot <= phase.minutes)) fail(`a shot of ${id} in ${phase.id} is outside it`);
      if (gun.every && !(gun.every > 0)) fail(`${id} in ${phase.id} fires every nothing`);
    }
    for (const line of phase.lines || []) {
      if (!line.id || !line.text || !LINE_KINDS.includes(line.kind) || !SIDES.includes(line.side) || !(line.at >= 0 && line.at <= phase.minutes)) fail(`line ${line.id} in ${phase.id} is malformed`);
      if (line.kind === 'documented' && !line.claimId) fail(`documented line ${line.id} carries no claim`);
      if (line.name && line.kind === 'reconstructed') fail(`reconstructed line ${line.id} is put in a named person's mouth`);
    }
    for (const fall of phase.falls || []) {
      if (!SIDES.includes(fall.side) || !(fall.count > 0) || !fall.claimId || !(fall.at >= 0 && fall.at <= phase.minutes)) fail(`a fall in ${phase.id} is malformed`);
      if (def.noFalling?.includes(fall.side)) fail(`${fall.side} may not be drawn falling at ${def.id}`);
    }
    for (const shot of phase.cannon || []) if (!(shot >= 0 && shot <= phase.minutes)) fail(`a cannon shot in ${phase.id} is outside it`);
  }
  if (!def.phases.some(phase => phase.contact)) fail('no phase is marked as contact');
  return def;
}
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
  for (const state of liveBattles(world)) {
    const step = stepOf(world, state.def, state.phase);
    if (!step) {
      // A phase nobody is held for (a siege's night): the clock goes at its own pace, but lands on the start of the next
      // phase that is watched, so a watched day never begins in the middle of a long tick.
      // Or on its end, so a class leaves a long engagement on the calendar's own grid and the next dated moment is met.
      const next = state.phases.slice(state.phase.index + 1).find(one => stepOf(world, state.def, one));
      const room = (next ? next.from : state.end) - world.minute;
      if (room > 0 && (best === null || room < best)) best = room;
      continue;
    }
    const room = state.phase.to - world.minute;
    const minutes = Math.max(1, Math.min(step, room));
    if (best === null || minutes < best) best = minutes;
  }
  // Also land exactly on a watched battle's first minute, so a fight never begins in the middle of a long tick.
  for (const [id, battle] of Object.entries(world.battles || {})) {
    const def = ENGAGEMENTS[id];
    if (!def || !Number.isFinite(battle.start) || world.minute >= battle.start || !stepOf(world, def, def.phases[0])) continue;
    const room = battle.start - world.minute;
    if (best === null || room < best) best = room;
  }
  return best;
}
/**
 * The step a phase holds the clock to in this class now: its own, or none when it is watched only while somebody of a
 * played family is involved (`watched: 'involved'`, the engagement's `involved`) and nobody is. A long siege's quiet days are
 * lived slowly for a class that has somebody inside and cost a class that has nobody there nothing (docs/BATTLES.md §7.3).
 */
export function stepOf(world, def, phase) {
  if (!phase?.step) return null;
  if (phase.watched === 'involved' && !def.involved(world)) return null;
  return phase.step;
}

const lerp = (a, b, part) => ({ x: a.x + (b.x - a.x) * part, y: a.y + (b.y - a.y) * part });
const ease = part => part < 0 ? 0 : part > 1 ? 1 : part * part * (3 - 2 * part);
/** Where a side stands at this moment: eased from its phase's `from` point to its `to`, both named points of the ground. */
export function sidePlace(ground, phase, side, into) {
  return placeOf(ground, phase[side], phase.minutes, into);
}
/** Where anything placed by `at`, `from`/`to` or `keys` stands `into` a phase of `minutes`: a side, a part of one, a gun. */
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
  return movingOf(phase[side], into);
}
function movingOf(at, into) {
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
/** Who has fallen by this minute: each fall's count, side and the minute it happened, never anybody's name. */
function fallenBy(state, minute) {
  const fallen = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const fall of phase.falls || []) if (phase.from + fall.at <= minute) fallen.push({ side: fall.side, ...(fall.group && { group: fall.group }), count: fall.count, minute: phase.from + fall.at, carried: Boolean(fall.carried), wounded: Boolean(fall.wounded), claimId: fall.claimId });
  }
  return fallen;
}
/**
 * The shots one of the engagement's guns has fired by this minute, in this phase and the one before: dated one by one
 * (`shots`), or a bombardment's steady rate (`every` minutes from `from` to `to` into the phase). The page fires each once.
 */
function gunFired(state, gunId, minute) {
  const shots = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    if (phase.to < minute - 2 * Math.max(phase.minutes, 60)) continue;
    const gun = phase.guns?.[gunId];
    if (!gun) continue;
    const dated = [...(gun.shots || [])];
    if (gun.every) for (let at = gun.from ?? 0; at <= Math.min(phase.minutes, gun.to ?? phase.minutes); at += gun.every) dated.push(at);
    for (const at of dated) if (phase.from + at <= minute) shots.push(phase.from + at);
  }
  return [...new Set(shots)].sort((a, b) => a - b).slice(-12);
}
/** How dark it is, 0 for day and 1 for a moonless night, eased across the phase where it changes (`light: [from, to]`). */
function darkness(phase, into) {
  const light = phase.light;
  if (light === undefined) return 0;
  if (!Array.isArray(light)) return light;
  return light[0] + (light[1] - light[0]) * Math.max(0, Math.min(1, into / phase.minutes));
}

/**
 * What a page that may watch the fight is sent (docs/BATTLES.md §2.1, §3): the phase it is in and nothing of any phase to come,
 * each side as a count, a style, a place and what it is doing, the lines said so far, the cannon's shots so far, the fallen so
 * far, and which of the people on this page's map are in the force. No fate, no future phase, no hidden count.
 *
 * `members` is the list of entity ids this viewer's page draws doing the force's work: the viewer's own family for a
 * student, everybody's for the Host (who is already sent every person, sim/overview.mjs).
 */
export function projectBattle(world, id, { members = [], legacyPhase = null, memberFalls = null, memberFacing = null } = {}) {
  const state = battleState(world, id);
  if (!state || state.before) return null;
  const { def, phase } = state;
  const ground = def.ground(world);
  const into = Math.min(state.into, phase.minutes);
  const texian = sidePlace(ground, phase, 'texian', into), mexican = sidePlace(ground, phase, 'mexican', into);
  const toward = { texian: facingOf(texian, mexican), mexican: facingOf(mexican, texian) };
  const point = name => { if (!ground[name]) throw new Error(`Ground has no point ${name}`); return ground[name]; };
  // Which way a side or a part of one faces: its own `face` point, its back to the enemy (`away`), or toward the other side.
  const faceOf = (side, at, place) => at.face === 'away' ? { x: -toward[side].x, y: -toward[side].y }
    : at.face ? facingOf(place, point(at.face)) : toward[side];
  const sides = SIDES.flatMap(side => {
    const at = phase[side], info = def.sides[side], place = side === 'texian' ? texian : mexican;
    const whole = {
      side, name: info.name, count: info.count, drawn: info.drawn, style: at.style, fire: state.over ? 'none' : at.fire || 'none',
      action: state.over ? 'gone' : at.action || 'stand', moving: !state.over && sideMoving(phase, side, into), x: place.x, y: place.y, facing: faceOf(side, at, place),
      spread: at.spread || info.spread, ...(at.mounted !== undefined ? { mounted: at.mounted } : info.mounted !== undefined ? { mounted: info.mounted } : {}),
      ...(at.dismounted && { dismounted: at.dismounted }), ...(info.figure && { figure: info.figure }),
    };
    // A side drawn in parts (docs/BATTLES.md §7.2): each part is its own entry, keyed by `group`, with its own count, place,
    // facing and fire; the side's own place stays the centre the other side faces and the family's people stand by.
    const parts = partsOf(at);
    if (!parts) return [whole];
    return parts.map(part => {
      const spot = part.at || part.from || part.keys ? placeOf(ground, part, phase.minutes, into) : place;
      return {
        ...whole, group: part.id, name: part.name || info.name, count: part.count ?? null, drawn: part.drawn, style: part.style,
        fire: state.over ? 'none' : part.fire || 'none', action: state.over ? 'gone' : part.action || 'stand',
        moving: !state.over && Boolean(part.keys || part.to) && movingOf(part, into), x: spot.x, y: spot.y, facing: faceOf(side, part, spot),
        spread: part.spread || null, mounted: Boolean(part.mounted), ...(part.ladders && { ladders: part.ladders }), ...(part.climbing && { climbing: true }),
        ...(part.figure && { figure: part.figure }),
      };
    });
  });
  const view = {
    id, name: def.name, phase: phase.id, title: phase.title || null, legacyPhase, caption: phase.caption, claimId: phase.claimId,
    minute: world.minute, live: state.live, over: state.over, contact: state.live && world.minute >= state.contact,
    step: phase.step || null, sides,
    lines: state.over ? [] : linesSaid(state, world.minute),
    commands: def.commands || null,
    ...(def.smokeScale && { smokeScale: def.smokeScale }),
    fallen: fallenBy(state, world.minute),
    members: [...members],
    ...(def.noFalling && { noFalling: def.noFalling }),
  };
  if (def.cannon) {
    const side = def.cannon.side, centre = side === 'texian' ? texian : mexican;
    view.cannon = { side, ...placeFrom(centre, toward[side], def.cannon.offset), shots: cannonFired(state, world.minute), crew: def.cannon.crew || 3, metal: def.cannon.metal || 'iron', claimId: def.cannon.claimId };
  }
  if (def.flag && phase.flag !== false) {
    const side = def.flag.side, centre = side === 'texian' ? texian : mexican;
    // A flag on a fixed place (a church tower) is drawn there; one carried with a side goes with it.
    const at = def.flag.at ? point(def.flag.at) : placeFrom(centre, toward[side], def.flag.offset);
    view.flag = { side, kind: def.flag.kind, x: at.x, y: at.y, ...(def.flag.at && { fixed: true }), claimId: def.flag.claimId, words: def.flag.words };
  }
  // The engagement's other guns (`def.guns`), each where the phase puts it, facing what it fires at, with its shots so far.
  const guns = (def.guns || []).flatMap(gun => {
    const now = phase.guns?.[gun.id];
    if (!now || state.over) return [];
    const at = point(now.at || gun.at), target = now.face || gun.face;
    return [{ id: gun.id, side: gun.side, x: at.x, y: at.y, facing: target ? facingOf(at, point(target)) : toward[gun.side], shots: gunFired(state, gun.id, world.minute),
      crew: gun.crew ?? 3, metal: gun.metal || 'iron', ...(now.canister && { canister: true }), ...(gun.name && { name: gun.name }), claimId: gun.claimId }];
  });
  if (guns.length) view.guns = guns;
  // Named people where the record puts them (Travis at the north battery), and whether they have fallen by now.
  const people = (phase.people || []).map(person => ({ id: person.id, name: person.name, side: person.side, ...point(person.at), pose: person.pose || 'stand',
    ...(person.falls !== undefined && into >= person.falls && { fell: phase.from + person.falls }), claimId: person.claimId }));
  if (people.length && !state.over) view.people = people;
  // Smoke going up from a place - huts burning, the pyres - seen from a distance, never what is burning (VISION.md §16).
  const plumes = (phase.plumes || []).filter(plume => into >= (plume.from || 0)).map(plume => ({ ...point(plume.at) }));
  if (plumes.length && !state.over) view.plumes = plumes;
  const dark = darkness(phase, into);
  if (dark > 0) view.light = +dark.toFixed(3);
  // A phase's own frame (the compound and what is round it), for the Host's camera and Watch.
  if (phase.frame) {
    const points = phase.frame.map(point);
    view.frame = { x0: Math.min(...points.map(p => p.x)), y0: Math.min(...points.map(p => p.y)), x1: Math.max(...points.map(p => p.x)), y1: Math.max(...points.map(p => p.y)) };
  }
  // A family's own person who has fallen by now, for the page that draws them - and only fallen already, never to come.
  if (memberFalls) {
    const fallen = Object.fromEntries(Object.entries(memberFalls).filter(([personId, minute]) => view.members.includes(personId) && minute <= world.minute));
    if (Object.keys(fallen).length) view.memberFalls = fallen;
  }
  if (memberFacing) view.memberFacing = Object.fromEntries(Object.entries(memberFacing).filter(([personId]) => view.members.includes(personId)));
  if (phase.parley && !state.over) {
    const between = lerp(texian, mexican, phase.parley.part ?? 0.5);
    view.parley = { x: between.x, y: between.y, people: phase.parley.people };
  }
  // The shape the old renderer and the old tests read: two formations with a count and a place and nobody's name.
  view.formations = sides.map(side => ({ id: `formation-${side.side}${side.group ? `-${side.group}` : ''}`, side: side.side, x: side.x, y: side.y, count: side.drawn }));
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
