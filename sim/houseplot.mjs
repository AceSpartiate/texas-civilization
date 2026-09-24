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
// Only a class that counts its trees one by one (sim/woods.mjs `countsTrees`) plans a house this way, because only there are
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
// ceiling: the double chimney is not held by rain though the stick-and-mud one is. `HIST-TEX-017` gives Smithwick's "big
// double chimney" and says nothing of what it was laid up in, and a chimney the game cannot call cat-and-clay is not one
// it will stop for rain. Tag it `wet: 'daub'` the day a source says it was mud.
import { record } from './events.mjs';
import { improvementsOf, setImprovement } from './improvements.mjs';
import { USE_ORDER } from './felling.mjs';
import { rainHold } from './weather.mjs';

/** The house plot is this many eight-foot cells wide and deep. */
export const PLOT_COLUMNS = 8;
export const PLOT_ROWS = 6;
/** How many feet one cell of the plot is. A piece's size and place are in cells, to the half cell: four feet. */
export const CELL_FEET = 8;
/**
 * How wide a dog-run's open passage is, in feet between its two pens: `HIST-GONZ-025` gives "a ten- or fifteen-foot
 * passage", and the owner chose twelve (2026-09-24). It was one eight-foot cell until then, narrower than the source's
 * narrowest. A cell and a half of the plot, so its pieces stand to the half cell (`HALF`) rather than round it to sixteen.
 */
export const PASSAGE_FEET = 12;
const PASSAGE_CELLS = PASSAGE_FEET / CELL_FEET;
/** Half a cell, the finest a piece's size or place on the plot is measured in. */
const HALF = 2;
/** A course of wall logs above this one wants two people on it at once. */
export const TWO_HANDED_ABOVE = 6;
/** Work is counted in thirds of a spell, so one person on a two-handed course puts in a third. */
const THIRDS = 3;

/**
 * A stage's `wet` tag is what a wet sky does to it (`sim/weather.mjs` `rainHold`, `FIC-GONZ-290`): `daub` where mud is
 * laid up and would wash out before it set, `roof` where a roof goes on and would go on wet. **Every other stage is
 * untagged and the rain does not touch it** - felling, sills, the courses, framing, a floor, a loft under a roof already
 * on, a stone chimney. The tag sits on the stage and not on the piece because a pen is both: its walls go up in any
 * weather and its roof and its daubing do not.
 */
const course = (n, work) => ({ id: `course-${n}`, doing: `raising the walls, course ${n} of 10`, work, logs: { wall: 4 }, ...(n > TWO_HANDED_ABOVE && { hands: 2 }) });
const logPen = (courseWork) => [
  { id: 'sills', doing: 'laying the sills', work: 2, logs: { sill: 4 } },
  ...Array.from({ length: 10 }, (_, i) => course(i + 1, courseWork)),
  { id: 'roof', doing: 'putting on the rafters and riving the clapboards', work: 6, logs: { wall: 6 }, wet: 'roof' },
  { id: 'chink', doing: 'chinking and daubing the walls', work: 2, wet: 'daub' },
];
const piece = fields => Object.freeze({ ...fields, stages: Object.freeze(fields.stages.map(stage => Object.freeze(stage))) });

/**
 * The pieces a house is made of. `w` and `h` are cells, to the half cell (the passage is `PASSAGE_CELLS`, a cell and a
 * half, wide); `place` is the rule for where it may go (see `placeRefusal`); `pen` marks a room people sleep in, with its
 * `room`, `rest` (share of the ordinary rest) and `spoil` (share of the food spoiling a day); the rest of a piece's effect
 * is in `shelter`.
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
      { id: 'wattle', doing: 'weaving the walls and daubing them with mud', work: 6, wet: 'daub' },
      { id: 'thatch', doing: 'thatching the roof', work: 5, wet: 'roof' },
    ],
  }),
  // Its roof is four wall logs and four of work for every cell of passage it covers (it was one cell, 4 and 4, until
  // 2026-09-24): a passage twelve feet wide takes half again the rafters and clapboards of one eight feet wide.
  passage: piece({
    id: 'passage', name: 'Open passage', w: PASSAGE_CELLS, h: 2, place: 'between', needs: ['axe'],
    describe: 'An open breezeway twelve feet wide between two pens in a row, under one roof with them: the dog-run.',
    does: 'A cool place to keep things: food spoils half as fast in the pens beside it.',
    stages: [{ id: 'roof', doing: 'roofing over the passage', work: 4 * PASSAGE_CELLS, logs: { wall: 4 * PASSAGE_CELLS }, wet: 'roof' }],
  }),
  chimney: piece({
    id: 'chimney', name: 'Stick-and-mud chimney', w: 1, h: 1, place: 'end', needs: [],
    describe: 'A chimney of sticks laid up in clay against the end wall of a pen.',
    does: 'A fire indoors: rest mends 10 in 100 better in that pen. Sticks and clay catch fire (weather and fire will read it).',
    stages: [{ id: 'build', doing: 'laying up the chimney in sticks and clay', work: 4, wet: 'daub' }],
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
      { id: 'roof', doing: 'roofing the shed room', work: 3, logs: { any: 4 }, wet: 'roof' },
    ],
  }),
  porch: piece({
    id: 'porch', name: 'Porch', w: 2, h: 1, place: 'front', needs: ['axe'],
    describe: 'A roofed gallery along the front of a pen.',
    does: 'A shaded place to work. Nothing yet: weather will read it.',
    stages: [{ id: 'roof', doing: 'setting the porch posts and roof', work: 4, logs: { any: 4 }, wet: 'roof' }],
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
  // The east pen stands the passage's width beyond the west one's east wall, and its chimney beyond it: 7.5 cells, 60 feet.
  'dog-run': { name: 'Dog-run house', pieces: [['pen-round', 1, 2], ['passage', 3, 2], ['pen-round', 3 + PASSAGE_CELLS, 2], ['chimney', 0, 2], ['chimney', 5 + PASSAGE_CELLS, 2]] },
  saddlebag: { name: 'Saddlebag house', pieces: [['pen-round', 1, 2], ['chimney-double', 3, 2], ['pen-round', 4, 2]] },
  jacal: { name: 'Jacal', pieces: [['pen-jacal', 3, 2]] },
});
export const PLAN_IDS = Object.keys(PLANS);

/** The half cells a piece covers, as "column,row" in half cells: a passage a cell and a half wide covers three across. */
const cellsOf = p => { const kind = PIECES[p.type], w = kind.w * HALF, h = kind.h * HALF; return Array.from({ length: w * h }, (_, i) => `${p.x * HALF + (i % w)},${p.y * HALF + Math.floor(i / w)}`); };
/** Whether a place on the plot is a whole number of half cells. */
const onPlot = n => Number.isInteger(n * HALF);
const pensOf = pieces => pieces.filter(p => PIECES[p.type]?.pen);
const penAt = (pieces, x, y) => pensOf(pieces).find(pen => x >= pen.x && x < pen.x + 2 && y >= pen.y && y < pen.y + 2);

/** The pens a piece belongs to: the one it stands in, against, or between. */
export function pensFor(pieces, p) {
  const kind = PIECES[p.type];
  if (kind.pen) return [p];
  if (kind.place === 'in') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y === p.y);
  if (kind.place === 'between') return pensOf(pieces).filter(pen => pen.y === p.y && (pen.x + 2 === p.x || pen.x === p.x + kind.w));
  if (kind.place === 'end') return pensOf(pieces).filter(pen => (pen.x + 2 === p.x || pen.x - 1 === p.x) && p.y >= pen.y && p.y < pen.y + 2);
  if (kind.place === 'back') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y + 2 === p.y);
  if (kind.place === 'front') return pensOf(pieces).filter(pen => pen.x === p.x && pen.y - 1 === p.y);
  return [];
}

/** Why this piece cannot go here on this plot, or null. `pieces` is the plot as it stands, without the new piece. */
export function placeRefusal(pieces, p) {
  const kind = PIECES[p?.type];
  if (!kind) return 'That is not a piece of any house built here.';
  if (!onPlot(p.x) || !onPlot(p.y) || p.x < 0 || p.y < 0 || p.x + kind.w > PLOT_COLUMNS || p.y + kind.h > PLOT_ROWS) return 'That runs off the house plot.';
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

/** Every piece on the plot and none over another: `planInvalid`'s first two rules, for a plot while it is being changed. */
function fits(pieces) {
  const cells = pieces.filter(p => PIECES[p.type].place !== 'in').flatMap(cellsOf);
  return new Set(cells).size === cells.length && pieces.every(p => p.x >= 0 && p.y >= 0 && p.x + PIECES[p.type].w <= PLOT_COLUMNS && p.y + PIECES[p.type].h <= PLOT_ROWS);
}

/**
 * A house planned or raised before 2026-09-24, when a dog-run's open passage was one eight-foot cell, laid out again with
 * the passage `PASSAGE_FEET` wide: its east pen, and everything east of the passage in its rows, half a cell further east
 * (with what stands in, before or behind a pen that moves) - or, where that runs off the plot, its west pen and what is
 * west of it half a cell further west, the passage with them. Changes `house.pieces` in place and returns whether it did.
 *
 * Nothing is built, pulled down, paid or refunded: every piece keeps its stage and its progress. A passage already roofed
 * stays roofed; one begun keeps the four logs it took and its work so far, and now wants six of work in all; one not begun
 * wants the six logs a passage takes now. The house stands where it was placed and is drawn a half cell longer, and nothing
 * judges the ground under an old house again (sim/house-placement.mjs), so it opens as it was, only wider.
 * ceiling: a free-built plot with no half cell to spare on either side of an old passage is left as it was, and then fails
 * `plotInvalid` and its class does not open. No plan is one (the dog-run widens east to 7.5 cells of 8), the plot's grid has
 * not been offered to a student since the plans became the whole choice, and no save has one; the way out is to let such a
 * plot keep a narrow passage of its own.
 */
export function widenPassages(house) {
  const pieces = house?.pieces;
  if (!Array.isArray(pieces) || !pieces.every(p => PIECES[p?.type] && Number.isFinite(p.x) && Number.isFinite(p.y))) return false;
  const old = pieces.map(p => ({ ...p })), grow = PASSAGE_CELLS - 1;
  const rows = (p, passage) => p.y < passage.y + 2 && p.y + PIECES[p.type].h > passage.y;
  let changed = false;
  for (let i = 0; i < old.length; i++) {
    const passage = old[i];
    if (passage.type !== 'passage') continue;
    const pens = pensOf(old).filter(pen => pen.y === passage.y);
    if (!pens.some(pen => pen.x + 2 === passage.x) || !pens.some(pen => pen.x === passage.x + 1)) continue;
    // One side of the passage in its rows, and what stands in, before or behind a pen of that side.
    const side = east => {
      const moved = new Set(old.filter(p => p !== passage && rows(p, passage) && (east ? p.x >= passage.x + 1 : p.x + PIECES[p.type].w <= passage.x)));
      for (const p of old) if (['in', 'front', 'back'].includes(PIECES[p.type].place) && pensFor(old, p).some(pen => moved.has(pen))) moved.add(p);
      return moved;
    };
    const east = side(true), west = side(false);
    const tried = [[east, grow], [new Set([...west, passage]), -grow]].map(([moved, by]) => old.map(p => moved.has(p) ? { ...p, x: p.x + by } : p));
    const next = tried.find(fits);
    if (!next) continue;
    next.forEach((p, j) => Object.assign(old[j], p));
    changed = true;
  }
  if (!changed || planInvalid(old)) return false;
  old.forEach((p, j) => { pieces[j].x = p.x; pieces[j].y = p.y; });
  return true;
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

/** Every stage anybody could start now, pens first, then the rest in the order placed. */
function* startable(pieces) {
  const order = [...pensOf(pieces), ...pieces.filter(p => !PIECES[p.type].pen)];
  for (const p of order) {
    if (pieceDone(p) || !readyToStart(pieces, p)) continue;
    yield { piece: p, stage: PIECES[p.type].stages[p.stage] };
  }
}

/**
 * The next stage anybody can work on, pens first, then the rest in the order placed: `{ piece, stage }` or null.
 *
 * `here` is the day's weather where the house stands (`weatherAt`), and where it is wet the stages a wet sky holds up are
 * **passed over, not stopped** (`FIC-GONZ-290`): a family whose roof cannot go on today frames the shed room instead, and
 * comes back to the roof when the rain does. Called without a sky - every caller that has no world, and every class before
 * this - nothing is held and the order is exactly what it always was.
 */
export function nextStage(pieces, here = null) {
  for (const next of startable(pieces)) if (!rainHold(here, next.stage.wet)) return next;
  return null;
}

/**
 * The first stage the sky is holding up on this plot, or null: `{ piece, stage, why }`. What the family is told, and the
 * reason the house stands still on a day when the pile is full and the tools are in the house.
 */
export function weatherHold(pieces, here) {
  for (const next of startable(pieces)) {
    const why = rainHold(here, next.stage.wet);
    if (why) return { ...next, why };
  }
  return null;
}

/**
 * What the next stage of this plot wants before it can be worked: its logs, and the work in hours.
 *
 * The plan's whole remaining want was already on the panel, and a student reading "still wants 26 wall logs" could not tell
 * what the very next spell of work needed - so a family hauled eleven logs in and the house still would not go up (owner,
 * 2026-09-17: "say what the next house stage needs"). Null when nothing can be started.
 */
export function stageWants(pieces, here = null) {
  const next = nextStage(pieces, here);
  if (!next) return null;
  const logs = next.stage.logs || {};
  // Logs are wanted once, at the start of a stage: a stage part done has already taken them off the pile.
  const wants = next.piece.progress === 0 ? { ...(logs.wall && { wall: logs.wall }), ...(logs.sill && { sill: logs.sill }), ...(logs.any && { any: logs.any }) } : {};
  return { doing: next.stage.doing, piece: pieceWords(pieces, next.piece), logs: wants, hours: Math.round(next.stage.work * 3 * 20 / 60) };
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

/**
 * Why the house cannot be worked on now, or null: nothing planned, all built, a tool missing, logs short, or the sky on
 * the only work left (`FIC-GONZ-290`).
 *
 * The rain is the answer only when it is the whole answer. Logs are checked against the stage the family would actually
 * be working on, so on a wet day with an empty pile the reason given is the rain - which is right, because the roof would
 * not go on with the logs at the door either. Nothing here refuses felling or hauling, so the wet day is still the day to
 * bring the logs in.
 */
export function plotBuildRefusal(household, here = null) {
  const pieces = household.house?.pieces || [];
  if (!pensOf(pieces).length) return 'Place a pen on the house plot first.';
  if (pieces.every(pieceDone)) return 'The house is built.';
  const next = nextStage(pieces, here);
  if (!next) {
    const held = weatherHold(pieces, here);
    if (held) return `${rainWords(pieces, held)} Nothing else on the house can be begun until it clears.`;
    return 'Nothing can be started until the pens are further up.';
  }
  const missing = PIECES[next.piece.type].needs.filter(tool => household.tools?.[tool] === undefined);
  if (missing.length) return `${pieceWords(pieces, next.piece)} wants ${missing.map(tool => tool === 'axe' ? 'a felling axe' : `a ${tool}`).join(' and ')}.`.replace(/^t/, 'T');
  if (next.piece.progress === 0) {
    const short = logsShort(household.logs, next.stage.logs);
    if (short) return `${next.stage.doing.charAt(0).toUpperCase()}${next.stage.doing.slice(1)} on ${pieceWords(pieces, next.piece)} wants ${short}, and the log pile has not got them.`;
  }
  return null;
}

/** What the sky is holding up, in the family's words: "It is raining: the roof would go on wet on the round-log pen." */
export function rainWords(pieces, held) {
  return `It is raining: ${held.why} — ${held.stage.doing} on ${pieceWords(pieces, held.piece)} waits for a dry day.`;
}

/**
 * One spell of one person's work on the house. `hands` is how many people are on it now, the family's and neighbours';
 * `here` is the day's weather where the house stands, or null where nothing reads it.
 *
 * Returns true when the house is finished, or when the work must stop - logs short, or the rain on the only work left
 * (`FIC-GONZ-290`): the chore then stops, and the family is told which it was.
 */
export function plotBuildSpell(world, household, entity, hands, here = null) {
  const pieces = household.house.pieces;
  const next = nextStage(pieces, here);
  if (!next) {
    const held = weatherHold(pieces, here);
    if (held) {
      record(world, 'consequence', { actorId: entity?.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-290', text: `Work on the house stopped. ${rainWords(pieces, held)}` });
    }
    return true;
  }
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
