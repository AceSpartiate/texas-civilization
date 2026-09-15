// The house plot: a house planned piece by piece and raised stage by stage from the family's own logs.
//
// docs/WOODS_AND_BUILDING.md §6.2-6.3, build steps 5 and 6. The owner (2026-09-15): a family builds a period plan - a
// round-log or hewn-log cabin, a dog-run, a saddlebag, a jacal - or free-builds on a grid from the pieces those plans are
// made of. Every piece says what it needs and does before it is placed; every stage of it takes its logs off the family's
// log pile (sim/felling.mjs) and its work from whoever is set to the house, and says what it is: the sills, the walls
// course by course, the roof, the chinking. A course above the sixth wants two people on it at once, or goes at a third
// of the pace - the reason a house-raising helps. The family sleeps under its own roof once one pen stands; the rest can
// follow.
//
// Only a class that counts its trees one by one (`woodsRule` 'landfire') plans a house this way, because only there are
// there logs to build it from. Every other class, and every class saved before, plans one of the four houses of
// sim/houses.mjs and raises it as one bar of work, as it always did.
//
// What is history and what is not:
//   - Round and hewn log pens, the dog-run's open passage (`HIST-GONZ-025`, `-035`), stick-and-mud and stone chimneys
//     (`HIST-GONZ-029`), riven clapboard roofs (`HIST-GONZ-030`), dirt and puncheon floors (`HIST-GONZ-031`), the jacal
//     (`HIST-GONZ-026`), and two pens round a big double chimney (`HIST-TEX-017`) are the period's.
//   - The grid, every piece's size in cells, every log count and amount of work, which stages want two hands, where a
//     piece may go, and what each does for rest, food and room are invented (`FIC-GONZ-033`).
// ceiling: a pen goes up in tens of hours of the family's time, not the week a settler and a helper took (`HIST-GONZ-032`),
// because a class lasts under two days (owner 2026-09-15: real counts, compressed time).
// ceiling: a stone chimney is not refused where no stone is near; the land has no rock layer. A stone chimney costs more
// work and is otherwise a stick-and-mud one until weather and fire read it.
// ceiling: a porch does nothing yet; weather will read it.
import { record } from './events.mjs';
import { improvementsOf, setImprovement } from './improvements.mjs';
import { USE_ORDER } from './felling.mjs';

/** The house plot is this many eight-foot cells wide and deep. */
export const PLOT_COLUMNS = 8;
export const PLOT_ROWS = 6;
/** A course of wall logs above this one wants two people on it at once. */
export const TWO_HANDED_ABOVE = 6;
/** Work is counted in thirds of a spell, so one person on a two-handed course puts in a third. */
const THIRDS = 3;

const course = (n, work) => ({ id: `course-${n}`, doing: `raising the walls, course ${n} of 10`, work, logs: { wall: 4 }, ...(n > TWO_HANDED_ABOVE && { hands: 2 }) });
const logPen = (courseWork) => [
  { id: 'sills', doing: 'laying the sills', work: 2, logs: { sill: 4 } },
  ...Array.from({ length: 10 }, (_, i) => course(i + 1, courseWork)),
  { id: 'roof', doing: 'putting on the rafters and riving the clapboards', work: 6, logs: { wall: 6 } },
  { id: 'chink', doing: 'chinking and daubing the walls', work: 2 },
];
const piece = fields => Object.freeze({ ...fields, stages: Object.freeze(fields.stages.map(stage => Object.freeze(stage))) });

/**
 * The pieces a house is made of. `w` and `h` are cells; `place` is the rule for where it may go (see `placeRefusal`);
 * `pen` marks a room people sleep in, with its `room`, `rest` (share of the ordinary rest) and `spoil` (share of the food
 * spoiling a day); the rest of a piece's effect is in `shelter`.
 */
export const PIECES = Object.freeze({
  'pen-round': piece({
    id: 'pen-round', name: 'Round-log pen', w: 2, h: 2, place: 'ground', pen: true, needs: ['axe'], room: 4, rest: 0.85, spoil: 0.015,
    describe: 'A room sixteen feet square of logs with the bark on, notched at the corners.',
    does: 'Holds four. Round logs leave gaps: rest mends at 85 in 100, and 1.5 in 100 of the food spoils a day.',
    stages: logPen(2),
  }),
  'pen-hewn': piece({
    id: 'pen-hewn', name: 'Hewn-log pen', w: 2, h: 2, place: 'ground', pen: true, needs: ['axe', 'broadaxe'], room: 4, rest: 1.15, spoil: 0,
    describe: 'A room sixteen feet square of logs hewn flat with the broadaxe, so they lie close.',
    does: 'Holds four. Tight walls: rest mends at 115 in 100 and the food keeps. Every course is hewn first, half again the work.',
    stages: logPen(3),
  }),
  'pen-jacal': piece({
    id: 'pen-jacal', name: 'Jacal', w: 2, h: 2, place: 'ground', pen: true, needs: [], room: 3, rest: 0.9, spoil: 0.01,
    describe: 'Posts set in the ground, walls of sticks and mud between, a roof of thatch.',
    does: 'Holds three. No logs and no axe: rest mends at 90 in 100, and 1 in 100 of the food spoils a day.',
    stages: [
      { id: 'posts', doing: 'cutting and setting the posts', work: 3 },
      { id: 'wattle', doing: 'weaving the walls and daubing them with mud', work: 6 },
      { id: 'thatch', doing: 'thatching the roof', work: 5 },
    ],
  }),
  passage: piece({
    id: 'passage', name: 'Open passage', w: 1, h: 2, place: 'between', needs: ['axe'],
    describe: 'An open breezeway between two pens in a row, under one roof with them: the dog-run.',
    does: 'A cool place to keep things: food spoils half as fast in the pens beside it.',
    stages: [{ id: 'roof', doing: 'roofing over the passage', work: 4, logs: { wall: 4 } }],
  }),
  chimney: piece({
    id: 'chimney', name: 'Stick-and-mud chimney', w: 1, h: 1, place: 'end', needs: [],
    describe: 'A chimney of sticks laid up in clay against the end wall of a pen.',
    does: 'A fire indoors: rest mends 10 in 100 better in that pen. Sticks and clay catch fire (weather and fire will read it).',
    stages: [{ id: 'build', doing: 'laying up the chimney in sticks and clay', work: 4 }],
  }),
  'chimney-stone': piece({
    id: 'chimney-stone', name: 'Stone chimney', w: 1, h: 1, place: 'end', needs: [],
    describe: 'A chimney of stone against the end wall of a pen, where stone can be had.',
    does: 'A fire indoors: rest mends 10 in 100 better in that pen, and stone does not catch.',
    stages: [{ id: 'build', doing: 'laying up the stone chimney', work: 10 }],
  }),
  'chimney-double': piece({
    id: 'chimney-double', name: 'Double chimney', w: 1, h: 2, place: 'between', needs: [],
    describe: 'One big chimney between two pens, a fireplace on each side: the saddlebag house.',
    does: 'Both pens warmed: rest mends 10 in 100 better in each.',
    stages: [{ id: 'build', doing: 'laying up the double chimney', work: 7 }],
  }),
  shed: piece({
    id: 'shed', name: 'Shed room', w: 2, h: 1, place: 'back', needs: ['axe'],
    describe: 'A lean-to room against the back wall of a pen.',
    does: 'Holds two more, and keeps the stores: food spoils a third less.',
    stages: [
      { id: 'frame', doing: 'framing the shed room', work: 4, logs: { any: 6 } },
      { id: 'roof', doing: 'roofing the shed room', work: 3, logs: { any: 4 } },
    ],
  }),
  porch: piece({
    id: 'porch', name: 'Porch', w: 2, h: 1, place: 'front', needs: ['axe'],
    describe: 'A roofed gallery along the front of a pen.',
    does: 'A shaded place to work. Nothing yet: weather will read it.',
    stages: [{ id: 'roof', doing: 'setting the porch posts and roof', work: 4, logs: { any: 4 } }],
  }),
  loft: piece({
    id: 'loft', name: 'Loft', w: 2, h: 2, place: 'in', needs: ['axe'], after: 'roof',
    describe: 'Joists and a floor of boards under the roof of a pen.',
    does: 'Holds two more.',
    stages: [{ id: 'loft', doing: 'laying the loft', work: 3, logs: { wall: 4 } }],
  }),
  floor: piece({
    id: 'floor', name: 'Puncheon floor', w: 2, h: 2, place: 'in', needs: ['axe'], after: 'sills',
    describe: 'Split logs hewn flat on one face and laid for a floor, instead of the earth.',
    does: 'Drier than earth: rest mends 5 in 100 better in that pen.',
    stages: [{ id: 'floor', doing: 'splitting and laying puncheons', work: 4, logs: { wall: 6 } }],
  }),
});
export const PIECE_IDS = Object.keys(PIECES);

/** The period plans, as pieces on the plot. The four houses of sim/houses.mjs, and the saddlebag. */
export const PLANS = Object.freeze({
  'round-log': { name: 'Round-log cabin', pieces: [['pen-round', 3, 2], ['chimney', 5, 2]] },
  'hewn-log': { name: 'Hewn-log cabin', pieces: [['pen-hewn', 3, 2], ['chimney', 5, 2]] },
  'dog-run': { name: 'Dog-run house', pieces: [['pen-round', 1, 2], ['passage', 3, 2], ['pen-round', 4, 2], ['chimney', 0, 2], ['chimney', 6, 2]] },
  saddlebag: { name: 'Saddlebag house', pieces: [['pen-round', 1, 2], ['chimney-double', 3, 2], ['pen-round', 4, 2]] },
  jacal: { name: 'Jacal', pieces: [['pen-jacal', 3, 2]] },
});
export const PLAN_IDS = Object.keys(PLANS);

const cellsOf = p => { const kind = PIECES[p.type]; return Array.from({ length: kind.w * kind.h }, (_, i) => `${p.x + (i % kind.w)},${p.y + Math.floor(i / kind.w)}`); };
const pensOf = pieces => pieces.filter(p => PIECES[p.type]?.pen);
const penAt = (pieces, x, y) => pensOf(pieces).find(pen => x >= pen.x && x < pen.x + 2 && y >= pen.y && y < pen.y + 2);

/** The pens a piece belongs to: the one it stands in, against, or between. */
export function pensFor(pieces, p) {
  const kind = PIECES[p.type];
  if (kind.pen) return [p];
  if (kind.place === 'in') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y === p.y);
  if (kind.place === 'between') return pensOf(pieces).filter(pen => pen.y === p.y && (pen.x + 2 === p.x || pen.x === p.x + 1));
  if (kind.place === 'end') return pensOf(pieces).filter(pen => (pen.x + 2 === p.x || pen.x - 1 === p.x) && p.y >= pen.y && p.y < pen.y + 2);
  if (kind.place === 'back') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y + 2 === p.y);
  if (kind.place === 'front') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y - 1 === p.y);
  return [];
}

/** Why this piece cannot go here on this plot, or null. `pieces` is the plot as it stands, without the new piece. */
export function placeRefusal(pieces, p) {
  const kind = PIECES[p?.type];
  if (!kind) return 'That is not a piece of any house built here.';
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0 || p.x + kind.w > PLOT_COLUMNS || p.y + kind.h > PLOT_ROWS) return 'That runs off the house plot.';
  if (kind.place === 'in') {
    const pen = pensOf(pieces).find(each => each.x === p.x && each.y === p.y);
    if (!pen || pen.type === 'pen-jacal') return `A ${kind.name.toLowerCase()} goes inside a log pen.`;
    if (pieces.some(each => each.type === p.type && each.x === p.x && each.y === p.y)) return `That pen already has a ${kind.name.toLowerCase()}.`;
    return null;
  }
  const taken = new Set(pieces.filter(each => PIECES[each.type].place !== 'in').flatMap(cellsOf));
  if (cellsOf(p).some(cell => taken.has(cell))) return 'Something is already built there.';
  if (kind.place === 'ground') return null;
  const pens = pensFor(pieces, p);
  if (kind.place === 'between') return pens.length === 2 ? null : `A ${kind.name.toLowerCase()} goes between two pens side by side.`;
  if (kind.place === 'end') return pens.length ? null : 'A chimney goes against the end wall of a pen.';
  if (kind.place === 'back') return pens.length ? null : 'A shed room goes against the back wall of a pen.';
  if (kind.place === 'front') return pens.length ? null : 'A porch goes along the front of a pen.';
  return null;
}

/** Whether a whole plot is a plot: every piece where it may go, given all the others. */
export function planInvalid(pieces) {
  if (!Array.isArray(pieces)) return 'Invalid house plot';
  for (let i = 0; i < pieces.length; i++) {
    const others = pieces.filter((_, j) => j !== i);
    // A piece set against a pen is checked against the pens; the pens against everything else.
    const why = placeRefusal(others, pieces[i]);
    if (why) return why;
  }
  return null;
}

/** A plan's pieces, fresh, with no work done. */
export const planPieces = planId => PLANS[planId].pieces.map(([type, x, y]) => ({ type, x, y, stage: 0, progress: 0 }));

/** Whether a piece is finished. */
export const pieceDone = p => p.stage >= PIECES[p.type].stages.length;
/** Whether a pen has got past a stage: its sills laid, its walls up, its roof on. */
function penPast(pen, stageId) {
  const stages = PIECES[pen.type].stages;
  if (pen.type === 'pen-jacal') return pieceDone(pen) || pen.stage > stages.findIndex(stage => stage.id === ({ sills: 'posts', walls: 'wattle', roof: 'thatch' }[stageId] || stageId));
  const last = stageId === 'walls' ? stages.findIndex(stage => stage.id === 'course-10') : stages.findIndex(stage => stage.id === stageId);
  return pen.stage > last;
}
/** What must stand before a piece can be started. */
function readyToStart(pieces, p) {
  const kind = PIECES[p.type];
  if (kind.pen) return true;
  const pens = pensFor(pieces, p);
  if (!pens.length) return false;
  if (kind.place === 'in') return pens.every(pen => penPast(pen, kind.after));
  if (kind.place === 'end') return pens.every(pen => penPast(pen, 'sills'));
  return pens.every(pen => penPast(pen, 'walls'));
}

/** The next stage anybody can work on, pens first, then the rest in the order placed: `{ piece, stage }` or null. */
export function nextStage(pieces) {
  const order = [...pensOf(pieces), ...pieces.filter(p => !PIECES[p.type].pen)];
  for (const p of order) {
    if (pieceDone(p) || !readyToStart(pieces, p)) continue;
    return { piece: p, stage: PIECES[p.type].stages[p.stage] };
  }
  return null;
}

const WHERE = ['west', 'east'];
/** A piece in words: "the round-log pen", "the east pen" where there are two. */
export function pieceWords(pieces, p) {
  const kind = PIECES[p.type];
  if (kind.pen && pensOf(pieces).length > 1) {
    const order = pensOf(pieces).sort((a, b) => a.x - b.x || a.y - b.y);
    return `the ${WHERE[order.indexOf(p)] || 'third'} pen`;
  }
  return `the ${kind.name.toLowerCase()}`;
}

/**
 * Whether the pile holds a stage's logs, or what it is short of. A sound log lays up in a wall or under it: straight wall
 * timber and rot-proof sill timber (post oak, cedar, live oak) each serve for either, the right kind taken first - post oak
 * was laid up in the walls of Texas log houses as much as under them. Poor logs serve only where `any` log will do.
 */
export function logsShort(pile = {}, logs = {}) {
  const sound = (pile.wall || 0) + (pile.sill || 0), poor = pile.poor || 0;
  const wanted = (logs.wall || 0) + (logs.sill || 0), any = logs.any || 0;
  if (sound < wanted) return logs.sill && !logs.wall ? `${logs.sill} sill logs` : `${wanted} sound logs`;
  if (sound - wanted + poor < any) return `${any} logs of any kind`;
  return null;
}
/** Take a stage's logs off the pile: each from its own kind first and then the other sound kind, `any` from the poorest first. */
function takeLogs(pile, logs = {}) {
  for (const [use, other] of [['wall', 'sill'], ['sill', 'wall']]) {
    let n = logs[use] || 0;
    const own = Math.min(n, pile[use]); pile[use] -= own; n -= own;
    pile[other] -= n;
  }
  let any = logs.any || 0;
  for (const use of [...USE_ORDER].reverse()) { const taken = Math.min(any, pile[use]); pile[use] -= taken; any -= taken; }
}

/** Why the house cannot be worked on now, or null: nothing planned, all built, a tool missing, or logs short. */
export function plotBuildRefusal(household) {
  const pieces = household.house?.pieces || [];
  if (!pensOf(pieces).length) return 'Place a pen on the house plot first.';
  if (pieces.every(pieceDone)) return 'The house is built.';
  const next = nextStage(pieces);
  if (!next) return 'Nothing can be started until the pens are further up.';
  const missing = PIECES[next.piece.type].needs.filter(tool => household.tools?.[tool] === undefined);
  if (missing.length) return `${pieceWords(pieces, next.piece)} wants ${missing.map(tool => tool === 'axe' ? 'a felling axe' : `a ${tool}`).join(' and ')}.`.replace(/^t/, 'T');
  if (next.piece.progress === 0) {
    const short = logsShort(household.logs, next.stage.logs);
    if (short) return `${next.stage.doing.charAt(0).toUpperCase()}${next.stage.doing.slice(1)} on ${pieceWords(pieces, next.piece)} wants ${short}, and the log pile has not got them.`;
  }
  return null;
}

/**
 * One spell of one person's work on the house. `hands` is how many people are on it now, the family's and neighbours'.
 * Returns true when the house is finished, or when the work must stop (logs short): the chore then stops.
 */
export function plotBuildSpell(world, household, entity, hands) {
  const pieces = household.house.pieces;
  const next = nextStage(pieces);
  if (!next) return true;
  const { piece: p, stage } = next;
  if (p.progress === 0) {
    const short = logsShort(household.logs, stage.logs);
    if (short) {
      record(world, 'consequence', { actorId: entity?.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-033', text: `Work on the house stopped: ${stage.doing} on ${pieceWords(pieces, p)} wants ${short}, and the log pile has not got them.` });
      return true;
    }
    if (stage.logs) { household.logs = { wall: 0, sill: 0, poor: 0, ...household.logs }; takeLogs(household.logs, stage.logs); }
  }
  p.progress += stage.hands === 2 && hands < 2 ? 1 : THIRDS;
  if (p.progress < stage.work * THIRDS) return false;
  p.stage += 1;
  p.progress = 0;
  const kind = PIECES[p.type];
  if (kind.pen && pieceDone(p)) {
    if (improvementsOf(household).cabin !== 'sound') setImprovement(world, household, 'cabin', 'sound');
    record(world, 'property', { actorId: entity?.id, householdId: household.id, importance: 3, claimId: 'FIC-GONZ-033', text: `${pieceWords(pieces, p).replace(/^t/, 'T')} is finished. ${pensOf(pieces).filter(pieceDone).length === 1 ? 'The family sleeps under its own roof tonight.' : 'The family has another room.'}` });
  }
  if (pieces.every(pieceDone)) {
    record(world, 'property', { actorId: entity?.id, householdId: household.id, importance: 3, claimId: 'FIC-GONZ-033', text: `The house is built: ${houseWords(pieces)}.` });
    return true;
  }
  return false;
}

/** The whole house in words: "two round-log pens with an open passage and two stick-and-mud chimneys". */
export function houseWords(pieces) {
  const counts = {};
  for (const p of pieces) counts[p.type] = (counts[p.type] || 0) + 1;
  const word = (type, n) => `${n === 1 ? 'a' : ['', '', 'two', 'three', 'four'][n] || n} ${PIECES[type].name.toLowerCase()}${n > 1 ? (PIECES[type].name.endsWith('ch') ? 'es' : 's') : ''}`;
  const parts = Object.entries(counts).map(([type, n]) => word(type, n));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
}

/**
 * What a house of these pieces does for the family, counting only what is finished (`built`) or all of it (a plan being
 * looked at): room, the share of the ordinary rest, and the share of the food that spoils a day. Null with no pen.
 */
export function plotShelter(pieces, { built = true } = {}) {
  const counted = built ? pieces.filter(pieceDone) : pieces;
  const pens = pensOf(counted);
  if (!pens.length) return null;
  let room = 0, rest = 0, spoil = Infinity;
  for (const pen of pens) {
    const kind = PIECES[pen.type];
    const about = counted.filter(p => p !== pen && pensFor(counted, p).includes(pen));
    room += kind.room + (about.some(p => p.type === 'loft') ? 2 : 0);
    const warmed = about.some(p => ['chimney', 'chimney-stone', 'chimney-double'].includes(p.type));
    rest += kind.rest + (warmed ? 0.1 : 0) + (about.some(p => p.type === 'floor') ? 0.05 : 0);
    const cool = about.some(p => p.type === 'passage') ? 0.5 : 1;
    const stored = about.some(p => p.type === 'shed') ? 2 / 3 : 1;
    spoil = Math.min(spoil, kind.spoil * cool * stored);
  }
  room += counted.filter(p => p.type === 'shed').length * 2;
  const round4 = value => Math.round(value * 10000) / 10000;
  return { room, restShare: round4(rest / pens.length), spoilagePerDay: round4(spoil) };
}

/** What a plot wants in all: logs by use, hours of one ordinary person's work, and tools. */
export function plotNeeds(pieces) {
  const logs = { wall: 0, sill: 0, any: 0 };
  let thirds = 0;
  const tools = new Set();
  for (const p of pieces) {
    const kind = PIECES[p.type];
    kind.needs.forEach(tool => tools.add(tool));
    kind.stages.forEach((stage, i) => {
      if (i < p.stage) return;
      for (const [use, n] of Object.entries(stage.logs || {})) if (i > p.stage || p.progress === 0) logs[use] += n;
      thirds += stage.work * THIRDS - (i === p.stage ? p.progress : 0);
    });
  }
  return { logs, hours: Math.round(thirds / THIRDS) * 3 * 20 / 60, tools: [...tools] };
}

/** How far up the first pen is, as the picture of a house going up: site, walls, roofing, finished. */
export function plotPhase(pieces) {
  const pen = pensOf(pieces)[0];
  if (!pen) return null;
  if (pieceDone(pen)) return 'finished';
  const id = PIECES[pen.type].stages[pen.stage].id;
  return ['sills', 'posts'].includes(id) ? 'site' : /^course|^wattle/.test(id) ? 'walls' : 'roofing';
}

/** Which of the four house pictures a plot looks like from outside. */
export function plotLayout(pieces) {
  const pens = pensOf(pieces);
  if (pens.length > 1) return 'dog-run';
  return pens[0]?.type === 'pen-hewn' ? 'hewn-log' : pens[0]?.type === 'pen-jacal' ? 'jacal' : 'round-log';
}

/** Whether a pen's walls are going up now: the stage a neighbour standing on the land can help raise. */
export const plotRaising = pieces => pensOf(pieces).some(pen => !pieceDone(pen) && /^course|^wattle/.test(PIECES[pen.type].stages[pen.stage].id));

/** The piece record is well formed. */
export function plotInvalid(house) {
  if (!Array.isArray(house.pieces)) return 'Invalid house plot';
  for (const p of house.pieces) {
    const kind = PIECES[p?.type];
    if (!kind || !Number.isInteger(p.stage) || p.stage < 0 || p.stage > kind.stages.length || !Number.isInteger(p.progress) || p.progress < 0) return 'Invalid house piece';
    if (!pieceDone(p) && p.progress >= kind.stages[p.stage].work * THIRDS) return 'Invalid house piece';
  }
  if (house.plan !== undefined && house.plan !== 'own' && !PLANS[house.plan]) return 'Invalid house plan';
  return planInvalid(house.pieces);
}

/** The catalogue, for `/api/chores`: fixed for a class. */
export const plotCatalogue = () => ({
  columns: PLOT_COLUMNS, rows: PLOT_ROWS, twoHandedAbove: TWO_HANDED_ABOVE,
  pieces: PIECE_IDS.map(id => { const kind = PIECES[id]; return { id, name: kind.name, w: kind.w, h: kind.h, place: kind.place, pen: Boolean(kind.pen), needs: kind.needs, describe: kind.describe, does: kind.does, stageCount: kind.stages.length, ...plotNeeds([{ type: id, x: 0, y: 0, stage: 0, progress: 0 }]) }; }),
  plans: PLAN_IDS.map(id => ({ id, name: PLANS[id].name, pieces: PLANS[id].pieces })),
});
