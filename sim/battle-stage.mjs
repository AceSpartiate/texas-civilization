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
import { COLETO } from './battles/coleto.mjs';
import { GOLIAD_MASSACRE } from './battles/goliad-massacre.mjs';

/**
 * How a side stands and moves (docs/BATTLES.md §2.4). The renderer lays figures out by these and nothing else.
 * `square` (2026-09-25, Coleto; docs/battle-research/staging.md §9): four faces of three ranks facing outward.
 */
export const STYLES = Object.freeze(['ranks', 'loose', 'wall', 'bank', 'street', 'column', 'mounted', 'rout', 'square']);
/** What a side is doing: `surrender` (2026-09-25, Coleto) is drawn with hands raised and the arms laid down. */
export const ACTIONS = Object.freeze(['stand', 'hold', 'advance', 'withdraw', 'gone', 'follow', 'surrender']);
/** How much light a phase is fought in (2026-09-25): the renderer darkens the field for night and dusk, greys it for fog. */
export const LIGHTS = Object.freeze(['day', 'dusk', 'night', 'dawn', 'fog']);
/**
 * The calendar steps a phase may be watched at: those dividing twenty minutes, and the whole hours of the other clocks, which
 * public/motion.js `CALENDAR_STEPS` draws as an ordinary tick. A night or a march between the fighting is watched at an
 * hour or four (Coleto's night, docs/battle-research/staging.md §9 "background pace inside a battle").
 */
const WATCHABLE = step => step > 0 && (20 % step === 0 || [60, 240].includes(step));
/**
 * How a side fires in a phase. `volley`: by rank on an officer's word. `scattered`: every man on his own load, at his own
 * pace. `picket`: a few shots from the front, nobody else firing. `none`: nobody fires.
 */
export const FIRE = Object.freeze(['volley', 'scattered', 'picket', 'none']);
/** What a spoken line is, drawn on the bubble's edge (public/speech.js): solid for documented, dashed for anything else. */
export const LINE_KINDS = Object.freeze(['documented', 'reconstructed', 'tradition']);
export const SIDES = Object.freeze(['texian', 'mexican']);

/** Every engagement on the engine. Add one here and in sim/battles/ (docs/BATTLES.md §6). */
export const ENGAGEMENTS = Object.freeze({ [GONZALES.id]: GONZALES, [COLETO.id]: COLETO, [GOLIAD_MASSACRE.id]: GOLIAD_MASSACRE });

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
    if (phase.step !== undefined && (!WATCHABLE(phase.step) || phase.minutes % phase.step !== 0)) fail(`phase ${phase.id}'s step must divide both its length and twenty minutes (or be a whole hour or four)`);
    if (phase.light !== undefined && !LIGHTS.includes(phase.light)) fail(`phase ${phase.id}'s light is not one of ${LIGHTS.join(', ')}`);
    for (const side of SIDES) {
      const at = phase[side];
      if (!at || !STYLES.includes(at.style) || !FIRE.includes(at.fire || 'none')) fail(`phase ${phase.id} side ${side} needs a style and a fire`);
      if (at.action !== undefined && !ACTIONS.includes(at.action)) fail(`phase ${phase.id} side ${side} does something the engine cannot draw: ${at.action}`);
      if (at.drawn !== undefined && !(at.drawn > 0 && at.drawn <= 60)) fail(`phase ${phase.id} side ${side} draws more than sixty`);
      // A side in parts (2026-09-25): detachments of it, each with its own place, style and fire, sharing out its drawn sample.
      for (const part of at.parts || []) {
        if (!part.id || !(part.share > 0) || !STYLES.includes(part.style || at.style) || !FIRE.includes(part.fire || at.fire || 'none')) fail(`part ${part.id} of ${side} in ${phase.id} is malformed`);
        if (!part.at && !part.from && !part.keys) fail(`part ${part.id} of ${side} in ${phase.id} stands nowhere`);
      }
      if (at.parts && Math.abs(at.parts.reduce((sum, part) => sum + part.share, 0) - 1) > 0.01) fail(`the parts of ${side} in ${phase.id} do not add up to the whole`);
    }
    for (const line of phase.lines || []) {
      if (!line.id || !line.text || !LINE_KINDS.includes(line.kind) || !SIDES.includes(line.side) || !(line.at >= 0 && line.at <= phase.minutes)) fail(`line ${line.id} in ${phase.id} is malformed`);
      if (line.kind === 'documented' && !line.claimId) fail(`documented line ${line.id} carries no claim`);
      if (line.name && line.kind === 'reconstructed') fail(`reconstructed line ${line.id} is put in a named person's mouth`);
    }
    for (const fall of phase.falls || []) {
      if (!SIDES.includes(fall.side) || !(fall.count > 0) || !fall.claimId || !(fall.at >= 0 && fall.at <= phase.minutes)) fail(`a fall in ${phase.id} is malformed`);
      if (def.noFalling?.includes(fall.side)) fail(`${fall.side} may not be drawn falling at ${def.id}`);
      if (fall.part && !(phase[fall.side].parts || []).some(part => part.id === fall.part)) fail(`a fall in ${phase.id} is in a part ${fall.side} does not have`);
    }
    // A shot is a minute (the one gun, `cannon`) or `{ gun, at }` for one of several (`cannons`, 2026-09-25).
    for (const shot of phase.cannon || []) {
      const at = typeof shot === 'number' ? shot : shot?.at;
      if (!(at >= 0 && at <= phase.minutes)) fail(`a cannon shot in ${phase.id} is outside it`);
      if (typeof shot !== 'number' && !(def.cannons || []).some(gun => gun.id === shot.gun)) fail(`a shot in ${phase.id} is fired by a gun ${def.id} does not have`);
    }
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
    const step = state.phase.step;
    if (!step) continue;
    const room = state.phase.to - world.minute;
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
  const at = phase[side];
  // A side in parts with no place of its own stands where its parts stand, weighted by their shares.
  if (at.parts && !at.at && !at.from && !at.keys) {
    const places = at.parts.map(part => ({ share: part.share, at: specPlace(ground, part, phase.minutes, into) }));
    return places.reduce((sum, one) => ({ x: sum.x + one.at.x * one.share, y: sum.y + one.at.y * one.share }), { x: 0, y: 0 });
  }
  return specPlace(ground, at, phase.minutes, into);
}
/** Where one side or part stands `into` a phase of `minutes`: at a point, eased from one to another, or along keyframes. */
function specPlace(ground, at, minutes, into) {
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
  const at = phase[side];
  if (at.parts && !at.at && !at.from && !at.keys) return at.parts.some(part => specMoving(part, into));
  return specMoving(at, into);
}
function specMoving(at, into) {
  if (at.keys) {
    for (let i = 1; i < at.keys.length; i++) if (into >= at.keys[i - 1][0] && into < at.keys[i][0] && at.keys[i - 1][1] !== at.keys[i][1]) return true;
    return false;
  }
  return Boolean(at.to && at.to !== (at.from || at.at));
}
/** Where one part of a side stands at this moment; for a side not in parts, the side. */
export function partPlace(ground, phase, side, partId, into) {
  const part = phase[side].parts?.find(one => one.id === partId);
  return part ? specPlace(ground, part, phase.minutes, into) : sidePlace(ground, phase, side, into);
}
/** The unit vector from one side toward the other: which way each faces. */
function facingOf(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, span = Math.hypot(dx, dy);
  // Two places on one spot (a side surrounding the other has its middle on it) face nowhere: east, rather than no way at all.
  if (span < 1e-9) return { x: 1, y: 0 };
  return { x: dx / span, y: dy / span };
}
/**
 * Which way a side or part faces: toward the other side, away from it (`face: 'away'`), or toward a named point of the ground
 * (`face: 'timber'`), which a square that faces every way uses to keep its front where the record puts it.
 */
function faceOf(ground, spec, place, toward) {
  if (spec.face === 'away') return { x: -toward.x, y: -toward.y };
  if (spec.face && ground[spec.face]) return facingOf(place, ground[spec.face]);
  return toward;
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

/** `total` whole figures shared out by `shares`, largest remainder first, so they add up to `total` exactly. */
function shareOut(total, shares) {
  const sum = shares.reduce((a, b) => a + b, 0) || 1, exact = shares.map(share => share / sum * total);
  const whole = exact.map(Math.floor);
  let left = total - whole.reduce((a, b) => a + b, 0);
  for (const index of exact.map((value, i) => [value % 1, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i)) { if (left-- <= 0) break; whole[index]++; }
  return whole;
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
function cannonFired(state, minute, gun = null) {
  const shots = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const shot of phase.cannon || []) {
      // One gun (`cannon`) fires the plain minutes; each of several (`cannons`) fires the shots given its id.
      const at = typeof shot === 'number' ? shot : shot.at;
      if ((gun === null ? typeof shot !== 'number' : typeof shot === 'number' || shot.gun !== gun) || phase.from + at > minute) continue;
      shots.push(phase.from + at);
    }
  }
  return shots.slice(-6);
}
/** Who has fallen by this minute: each fall's count, side and the minute it happened, never anybody's name. */
function fallenBy(state, minute) {
  const fallen = [];
  for (const phase of state.phases) {
    if (phase.from > minute) break;
    for (const fall of phase.falls || []) if (phase.from + fall.at <= minute) fallen.push({ side: fall.side, count: fall.count, minute: phase.from + fall.at, carried: Boolean(fall.carried), wounded: Boolean(fall.wounded), claimId: fall.claimId, ...(fall.part && { part: fall.part }) });
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
export function projectBattle(world, id, { members = [], legacyPhase = null } = {}) {
  const state = battleState(world, id);
  if (!state || state.before) return null;
  const { def, phase } = state;
  const ground = def.ground(world);
  const into = Math.min(state.into, phase.minutes);
  const texian = sidePlace(ground, phase, 'texian', into), mexican = sidePlace(ground, phase, 'mexican', into);
  const toward = { texian: facingOf(texian, mexican), mexican: facingOf(mexican, texian) };
  const sides = SIDES.map(side => {
    const at = phase[side], info = def.sides[side], place = side === 'texian' ? texian : mexican;
    const drawn = at.drawn ?? info.drawn;
    const shown = {
      // A phase may give a side a different count from the engagement's: Urrea's 280 at Coleto are 1,400 by the morning.
      // A force the record gives no number for (`uncounted`, the guard at Goliad) is sent with none, and labelled with none.
      side, name: at.name || info.name, count: at.count ?? (info.uncounted ? null : info.count), drawn, style: at.style, fire: state.over ? 'none' : at.fire || 'none',
      action: state.over ? 'gone' : at.action || 'stand', moving: !state.over && sideMoving(phase, side, into), x: place.x, y: place.y, facing: faceOf(ground, at, place, toward[side]),
      spread: at.spread || info.spread, ...(at.mounted !== undefined ? { mounted: at.mounted } : info.mounted !== undefined ? { mounted: info.mounted } : {}),
      ...(at.dismounted && { dismounted: at.dismounted }), ...(info.figure && { figure: info.figure }),
    };
    // Parts (2026-09-25): each its own place, style, fire and a share of the drawn sample, facing the other side's middle.
    // The shares are whole figures, largest remainder, so the parts together are the side's drawn sample exactly.
    if (at.parts) {
      const other = side === 'texian' ? mexican : texian;
      const counts = shareOut(drawn, at.parts.map(part => part.share));
      shown.parts = at.parts.map((part, index) => {
        const where = specPlace(ground, part, phase.minutes, into), facing = facingOf(where, other);
        return {
          id: part.id, drawn: counts[index], style: part.style || at.style, fire: state.over ? 'none' : part.fire || at.fire || 'none',
          action: state.over ? 'gone' : part.action || at.action || 'stand', moving: !state.over && specMoving(part, into), x: where.x, y: where.y,
          facing: faceOf(ground, part, where, facing), ...(part.spread && { spread: part.spread }),
          ...(part.mounted !== undefined && { mounted: part.mounted }), ...(part.figure && { figure: part.figure }), ...(part.name && { name: part.name }),
        };
      });
    }
    return shown;
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
  };
  if (def.cannon) {
    const side = def.cannon.side, centre = side === 'texian' ? texian : mexican;
    view.cannon = { side, ...placeFrom(centre, toward[side], def.cannon.offset), shots: cannonFired(state, world.minute), crew: def.cannon.crew || 3, metal: def.cannon.metal || 'iron', claimId: def.cannon.claimId };
  }
  // Several guns (2026-09-25): each at a named point of the ground, on the field from the phase it came up in, facing the
  // other side, with its own shots. Coleto's corner guns and the Mexican battery that came up in the night.
  if (def.cannons) {
    const since = id => state.phases.findIndex(one => one.id === id);
    view.cannons = def.cannons.filter(gun => !gun.from || since(gun.from) <= phase.index).filter(gun => !gun.until || phase.index < since(gun.until)).map(gun => {
      const at = ground[gun.at], other = gun.side === 'texian' ? mexican : texian;
      return { id: gun.id, side: gun.side, x: at.x, y: at.y, facing: facingOf(at, other), shots: state.over ? [] : cannonFired(state, world.minute, gun.id), crew: gun.crew ?? 3, metal: gun.metal || 'iron', claimId: gun.claimId };
    });
  }
  // A phase's own flag (the white flag at Coleto, 2026-09-25) stands at a named point, over the engagement's.
  if (phase.flag && typeof phase.flag === 'object' && !state.over) view.flag = { side: phase.flag.side, kind: phase.flag.kind, ...ground[phase.flag.at], claimId: phase.flag.claimId };
  else if (def.flag && phase.flag !== false) {
    const side = def.flag.side, centre = side === 'texian' ? texian : mexican;
    view.flag = { side, kind: def.flag.kind, ...placeFrom(centre, toward[side], def.flag.offset), claimId: def.flag.claimId, words: def.flag.words };
  }
  if (phase.light && phase.light !== 'day') view.light = phase.light;
  // A family's own person hit or killed in the fight (docs/BATTLES.md §2.6): only a member this page is drawing, only once the
  // minute of it has come, and only what the page draws - down, or hurt - never a fate still to fall.
  const down = {};
  for (const id of members) {
    const entry = state.battle.participants?.[id]?.down;
    if (entry && entry.minute <= world.minute) down[id] = { kind: entry.kind, minute: entry.minute };
  }
  if (Object.keys(down).length) view.down = down;
  if (phase.parley && !state.over) {
    const between = lerp(texian, mexican, phase.parley.part ?? 0.5);
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
/**
 * Whether this person was killed in a fight their family has not yet had word of: the man is drawn lying where he fell on his
 * own family's map (staging.md §9, "drawn for the participant's viewpoint only"), while his health, the journal and the
 * family's reports wait for the word (`FIC-GONZ-439`). Returns where and when, or null. Nobody else is ever told.
 */
export function lyingOnField(world, entity) {
  if (entity?.health?.condition === 'dead') return null;
  for (const [id, battle] of Object.entries(world.battles || {})) {
    const down = battle.participants?.[entity.id]?.down;
    if (down?.kind === 'killed' && down.minute <= world.minute) return { battle: id, minute: down.minute };
  }
  return null;
}
export function heldByBattle(world, entity) {
  for (const [id, battle] of Object.entries(world.battles || {})) {
    if (!battle.participants?.[entity.id] || battle.participants[entity.id].released) continue;
    const state = battleState(world, id);
    if (!state || state.over) continue;
    return state.def.held?.(entity.name) || `${entity.name} is with the men in the fight, and comes back with them when it is over.`;
  }
  return null;
}
