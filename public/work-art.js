// People at work, drawn at the work (owner, 2026-09-28: "When someone is working, I should see them actually working, not just
// standing near their task").
//
// **One table.** `WORK` maps every activity the server can report - a chore's id (`entity.chore.id`, the field the family
// panel's glowing icon also reads), or the standing task of working about the place or helping (`entity.task`) - to the
// way it is drawn while the person is *at* the work. `STROKES` is its vocabulary: which delivered cast pose the body takes
// and, where the library has no picture of the work itself, the procedural stand-in drawn with it (a tool, a lean or a
// pace, and a small effect timed to the pose's own strike). Nothing here reads a chore's steps, its costs or anything the
// projection did not send; `tests/work-art.test.mjs` reads every chore out of sim/ and fails if one is not in `WORK`, so a
// new task cannot silently fall back to somebody standing beside it.
//
// The words of a chore (`chore.doing`) choose only a *part* of the work (`by`: felling timber on a clearing is chopping,
// grubbing it out is digging) and whether they are walking to it or carrying from it. A change in those words leaves the
// activity drawn at its base stroke, never standing still.
//
// stand-in: docs/ART_REQUESTS.md, "Request 2026-09-28 — people at work". Every stroke whose `art` is 'stand-in' names its item;
// the rows are listed under *Stand-ins in use*. When a cast sheet of the work lands, its stroke's `pose` becomes that clip,
// `art` becomes 'delivered', and the procedural layer for it is deleted.
//
// ceiling: the effects are a handful of canvas rectangles and arcs a figure, drawn from a hash of the cycle and the particle's
// index, not a particle system; nothing is kept between frames but the beat counter the audio hook reads. A real effect sheet
// (item 15) replaces them.

export const WORK_REQUEST = 'Request 2026-09-28 — people at work';
const item = n => `${WORK_REQUEST}, item ${n}`;
const PLAY_REQUEST = "Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work";

/**
 * How each kind of work is drawn. `art`:
 *   - 'delivered': the cast sheets hold a painted cycle of this very work;
 *   - 'stand-in': the nearest painted pose, with a procedural tool, motion or effect, until `request` lands;
 *   - 'journey': the work is walking with the family on the road, drawn by the walk cycle;
 *   - 'play': a child's play, drawn by `littleClip` in public/motion.js (its own stand-in row);
 *   - 'still': held still on purpose - a hunter downwind, somebody resting or waiting in a line - with the reason.
 * `beat` is the frame of the pose on which the tool strikes (the cast `-work` cycle: raised, swinging, **down**, back), or,
 * for a pose with no strike, a whole `cycleMs` of its own. `effect` is drawn from the beat.
 */
export const STROKES = Object.freeze({
  hoe: { pose: 'work', art: 'delivered', effect: 'dust', beat: 2 },
  about: { pose: 'work', art: 'delivered', effect: 'dust', beat: 2 },
  sow: { pose: 'sow', art: 'delivered' },
  mend: { pose: 'repair', art: 'delivered' },
  tend: { pose: 'care', art: 'delivered' },
  search: { pose: 'search', art: 'delivered' },
  trade: { pose: 'trade', art: 'delivered' },
  carry: { pose: 'carry', art: 'delivered' },
  walk: { pose: 'walk', art: 'journey' },
  play: { art: 'play', request: PLAY_REQUEST },
  hold: { pose: 'idle-s', art: 'still', frozen: true, upright: true, why: 'a hunter waiting downwind holds still, or he is seen' },
  rest: { pose: 'rest', art: 'still', upright: true, why: 'a day of rest on the road is rest' },
  wait: { pose: 'idle-s', art: 'still', upright: true, why: 'standing in a line to sign the roll, vote or report' },
  // A felling axe (a maul, splitting rails) drawn over the hoe in the hoeing cycle's hands (owner, 2026-09-28: "Add a drawn axe").
  // `drawn`: a figure whose library holds a cycle of the work itself (`<figure>-chop`, six frames Claude-drawn today for all eight, Astra's
  // when she delivers) is drawn in it instead, with only the chips (`drawnStroke`).
  chop: { pose: 'work', art: 'stand-in', tool: 'axe', effect: 'chips', beat: 2, request: item(1), drawn: { pose: 'chop', beat: 3 } },
  // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)", area A - every `drawn` below but the chop's
  // is a Claude-drawn cycle for all eight cast figures (scripts/claude-art/areas/work.mjs; the chop is chop.mjs), and Astra's
  // `<figure>-<pose>` of the same name replaces it. `at` is where the effect comes from in the drawn frame (figure heights
  // ahead and up); `muzzle` where the rifle's smoke comes from; `ownFire` that the frame draws the fire itself.
  split: { pose: 'work', art: 'stand-in', tool: 'maul', effect: 'chips', beat: 2, request: item(2), drawn: { pose: 'split', beat: 3, at: [0.27, 0.02] } },
  notch: { pose: 'work', art: 'stand-in', tool: 'axe', effect: 'chips', beat: 2, request: item(3), drawn: { pose: 'notch', beat: 2, at: [0.25, 0.26] } },
  dig: { pose: 'work', art: 'stand-in', effect: 'earth', beat: 2, request: item(4), drawn: { pose: 'dig', beat: 3, at: [-0.06, 0.85] } },
  // The well dug waist-deep in its hole (item 4, `-dig-well`); until it is drawn, the dig.
  well: { pose: 'work', art: 'stand-in', effect: 'earth', beat: 2, request: item(4), drawn: { pose: 'dig-well', beat: 3, at: [-0.06, 0.65] } },
  grub: { pose: 'work', art: 'stand-in', effect: 'earth', beat: 2, request: item(4), drawn: { pose: 'dig', beat: 3, at: [-0.06, 0.85] } },
  reap: { pose: 'work', art: 'stand-in', effect: 'chaff', beat: 2, request: item(5), drawn: { pose: 'reap', beat: 1, at: [0.11, 0.63] } },
  whittle: { pose: 'repair', art: 'stand-in', effect: 'shavings', beat: 1, request: item(6), drawn: { pose: 'carpentry', beat: 1, at: [0.21, 0.3] } },
  shoot: { pose: 'idle-e', art: 'stand-in', tool: 'rifle', effect: 'smoke', cycleMs: 2600, request: item(7), drawn: { pose: 'fire', beat: 1, muzzle: [0.55, 0.59] } },
  shot: { pose: 'idle-e', art: 'stand-in', tool: 'rifle', frozen: true, request: item(7), drawn: { pose: 'aim', beat: 0 } },
  fish: { pose: 'rest', art: 'stand-in', tool: 'rod', effect: 'ripple', cycleMs: 2400, request: item(8), drawn: { pose: 'fish', beat: 1, at: [0.627, -0.105] } },
  gather: { pose: 'sow', art: 'stand-in', motion: 'bob', cycleMs: 1400, request: item(9), drawn: { pose: 'gather', beat: 0 } },
  butcher: { pose: 'care', art: 'stand-in', motion: 'bob', cycleMs: 1100, request: item(10), drawn: { pose: 'butcher', beat: 1 } },
  drill: { pose: 'walk', art: 'stand-in', motion: 'in-place', request: item(11), drawn: { pose: 'drill', beat: 0 } },
  guard: { pose: 'search', art: 'stand-in', tool: 'rifle', request: item(11), drawn: { pose: 'guard', beat: 0 } },
  // ceiling: pacing out and staking is one step of the chore, so the drawn cycle is the staking only; the pacing (the walk,
  // paced to and fro) is what somebody with no `-stake` is drawn at. A part told by the chore's words would show both.
  pace: { pose: 'walk', art: 'stand-in', motion: 'pace', cycleMs: 3600, reach: 0.4, request: item(12), drawn: { pose: 'stake', beat: 1 } },
  shoo: { pose: 'walk', art: 'stand-in', motion: 'pace', cycleMs: 1800, reach: 0.22, request: item(13) },
  scatter: { pose: 'sow', art: 'stand-in', request: `${PLAY_REQUEST}, item 1 (\`-scatter\`)` },
  fire: { pose: 'care', art: 'stand-in', effect: 'smoke', cycleMs: 1700, request: item(14), drawn: { pose: 'tend-fire', beat: 1, at: [0.295, 0], ownFire: true } },
});

/**
 * A stroke as it is drawn in a cycle of the work itself, for a figure whose library holds one (`<figure>-<drawn.pose>`): the
 * pose is that clip, the beat its own strike, and the stand-in's drawn tool, lean and pace go - the effect (the chips) stays,
 * timed to the new beat. The page asks for it only once `clipReady` says the clip can be drawn, figure by figure, so the
 * seven figures with no cycle yet keep the drawn axe over the hoe. Made once a stroke; frozen, so a frame makes nothing.
 * stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the only drawn cycle today, `rust-chop`,
 * is Claude-drawn (request 2026-09-28 — people at work, item 1); Astra's `<figure>-chop` of the same name replaces it.
 */
const DRAWN = new Map();
export function drawnStroke(stroke) {
  if (!stroke?.drawn) return null;
  let made = DRAWN.get(stroke);
  if (!made) {
    // The stand-in's own tool, motion and pace go with it (the clip's own frames time it, not `cycleMs`); the effect stays,
    // from where the drawn frame puts it.
    const { tool, motion, drawn, cycleMs, reach, ...rest } = stroke;
    made = Object.freeze({ ...rest, pose: drawn.pose, beat: drawn.beat, art: 'drawn', ...(drawn.at && { at: drawn.at }), ...(drawn.muzzle && { muzzle: drawn.muzzle }), ...(drawn.ownFire && { ownFire: true }) });
    DRAWN.set(stroke, made);
  }
  return made;
}

/**
 * Every activity the server reports, and how it is drawn at the work. `stroke` is the base; `by` a part of the work told by
 * the chore's own words; `spread` how far apart (in figure heights) several people at one piece of work stand round it, and
 * the one person alone stands that far to its west, facing it. An activity whose work *is* walking (`walk`) is drawn walking
 * whether or not the ground is moving under them.
 */
const HOUSE_PARTS = Object.freeze([[/waiting/, 'wait'], [/felling|hewing|cutting and setting/, 'chop']]);
export const WORK = Object.freeze({
  // At home: the land, the field, the house and the well (docs/LAND_GRANTS.md, docs/WOODS_AND_BUILDING.md).
  'survey-plot': { stroke: 'pace', spread: 0.6 },
  'cut-lane': { stroke: 'chop', spread: 0.6, by: [[/brush|grub/, 'grub']] },
  'dig-well': { stroke: 'well', spread: 0.45 },
  'plant-field': { stroke: 'hoe', spread: 0.8, by: [[/putting in seed|seed/, 'sow']] },
  'harvest-field': { stroke: 'reap', spread: 0.8, by: [[/carrying/, 'carry']] },
  'clear-plot': { stroke: 'grub', spread: 0.8, by: [[/felling|timber/, 'chop'], [/prairie sod|breaking/, 'hoe']] },
  'fence-plot': { stroke: 'split', spread: 0.8, by: [[/mesquite|cutting/, 'chop'], [/carrying/, 'carry']] },
  // The house's stage, in the server's words (sim/houses.mjs `stageOf`): felling for it first, then the walls and the roof.
  // The server walks them to the middle of the house's front (sim/house-placement.mjs `houseFront`): they stand along it.
  'build-house': { stroke: 'notch', spread: 1.8, arc: 'front', by: HOUSE_PARTS },
  'help-raise': { stroke: 'notch', spread: 1.8, arc: 'front', by: HOUSE_PARTS },
  'fell-trees': { stroke: 'chop', spread: 0.45 },
  // Retiring (2026-09-28: felling drops its logs on the one wood pile); kept while a saved class may be in the middle of it.
  'haul-logs': { stroke: 'carry', spread: 0.6 },
  'fetch-logs': { stroke: 'chop', spread: 0.45 },
  'make-carreta': { stroke: 'chop', spread: 0.7, by: [[/shaping|axle/, 'whittle']] },
  'make-furniture': { stroke: 'whittle', spread: 0.6, by: [[/felling|splitting/, 'chop'], [/carrying/, 'carry']] },
  'mend-hoe': { stroke: 'mend', spread: 0.6 },
  'practise-shooting': { stroke: 'shoot', spread: 0.6 },
  // Hunting and the country's food (docs/WOODS_AND_BUILDING.md §5, sim/gathering.mjs).
  'hunt-timber': { stroke: 'search', spread: 0.5, by: [[/waiting downwind|letting it come/, 'hold'], [/^the shot$/, 'shot']] },
  'hunt-land': { stroke: 'search', spread: 0.5, by: [[/waiting downwind|letting it come/, 'hold'], [/^the shot$/, 'shot']] },
  'hunt-road': { stroke: 'search', spread: 0.5, by: [[/waiting downwind|letting it come/, 'hold'], [/^the shot$/, 'shot']] },
  'take-small-game': { stroke: 'search', spread: 0.5 },
  'fish-the-water': { stroke: 'fish', spread: 0.9 },
  'fish-road': { stroke: 'fish', spread: 0.9 },
  'gather-oysters': { stroke: 'gather', spread: 0.7 },
  'cut-bee-tree': { stroke: 'chop', spread: 0.45 },
  // Stock (docs/STOCK.md): the killing is never drawn - a figure kneeling at the work, and the meat carried in.
  'butcher-beef': { stroke: 'butcher', spread: 0.5 },
  'butcher-hog': { stroke: 'butcher', spread: 0.5 },
  'look-to-stock': { stroke: 'search', spread: 0.6 },
  // Town, where the work is at a counter (docs/TOWNS.md).
  'sell-cotton': { stroke: 'trade', spread: 0.6 },
  'fetch-powder': { stroke: 'trade', spread: 0.6 },
  'fetch-seed': { stroke: 'trade', spread: 0.6 },
  'sell-food': { stroke: 'trade', spread: 0.6 },
  'replace-hoe': { stroke: 'trade', spread: 0.6 },
  'visit-shop': { stroke: 'trade', spread: 0.6 },
  'visit-shop-street': { stroke: 'trade', spread: 0.6 },
  'buy-furniture': { stroke: 'trade', spread: 0.6 },
  'trade-crossing': { stroke: 'trade', spread: 0.6 },
  // Going to the war, and to vote: the road, and then a line (sim/winter.mjs).
  'enlist-regular': { stroke: 'wait', spread: 0.5 },
  'enlist-auxiliary': { stroke: 'wait', spread: 0.5 },
  'join-garrison': { stroke: 'wait', spread: 0.5 },
  'join-relief': { stroke: 'wait', spread: 0.5 },
  'join-matamoros': { stroke: 'wait', spread: 0.5 },
  'join-houston': { stroke: 'wait', spread: 0.5 },
  'go-vote': { stroke: 'wait', spread: 0.5 },
  // Houston's camp (sim/camp.mjs).
  'camp-drill': { stroke: 'drill', spread: 0.7 },
  'camp-forage': { stroke: 'search', spread: 0.6 },
  'camp-guard': { stroke: 'guard', spread: 0.6 },
  'camp-scout': { stroke: 'search', spread: 0.6 },
  // Sickness (sim/disease.mjs).
  'tend-sick': { stroke: 'tend', spread: 0.5 },
  'nurse-home': { stroke: 'tend', spread: 0.5 },
  'rest-road': { stroke: 'rest', spread: 0.5 },
  // The children's own work and play (docs/CHILDREN.md, sim/children.mjs).
  'child-play': { stroke: 'play' },
  'child-stick-horse': { stroke: 'play' },
  'child-doll': { stroke: 'play' },
  'child-cart': { stroke: 'play' },
  'child-tag': { stroke: 'play' },
  'child-hide': { stroke: 'play' },
  'child-hoop': { stroke: 'play' },
  'child-marbles': { stroke: 'play' },
  'child-hens': { stroke: 'scatter', spread: 0.5 },
  'child-kindling': { stroke: 'gather', spread: 0.6 },
  'child-birds': { stroke: 'shoo', spread: 0.8 },
  'child-eggs': { stroke: 'gather', spread: 0.5 },
  'child-water': { stroke: 'carry', spread: 0.5 },
  'child-mind': { stroke: 'tend', spread: 0.5 },
  // The Runaway Scrape's own work (sim/flight-work.mjs).
  'flee-hide': { stroke: 'carry', spread: 0.6 },
  'flee-bundle': { stroke: 'gather', spread: 0.5 },
  'flee-cow': { stroke: 'shoo', spread: 0.6 },
  'road-lookout': { stroke: 'walk' },
  'road-sing': { stroke: 'walk' },
  'road-little-ones': { stroke: 'walk' },
  // A child of seven or more running to the neighbours for help (sim/acting.mjs, 2026-09-28): the work is the going.
  'child-help': { stroke: 'walk' },
  'camp-fire': { stroke: 'fire', spread: 0.6 },
  'ferry-help': { stroke: 'carry', spread: 0.7 },
  'share-food': { stroke: 'carry', spread: 0.6 },
  'ford-carry': { stroke: 'carry', spread: 0.6 },
  'camp-apart': { stroke: 'carry', spread: 0.6 },
  // No chore: working about the place at home (sim/routines.mjs: "a little food a day"), or helping where a call sent them.
  'task:work': { stroke: 'about', spread: 0.9 },
  'task:help': { stroke: 'carry', spread: 0.7 },
});

/** The bands a child cannot be set to work about the place in (sim/auto.mjs). */
const CHILD_BANDS = new Set(['child', 'small', 'infant']);
/**
 * The activity somebody is at, as the server said it, or null. `atHome` is the page's own reading of where they stand
 * (public/app.js sets it from the household's home site): working about the place happens nowhere else.
 */
export function activityOf(entity) {
  if (!entity || entity.kind !== 'person') return null;
  if (entity.chore?.id) return entity.chore.id;
  if (entity.task === 'work' && entity.atHome && !CHILD_BANDS.has(entity.band)) return 'task:work';
  if (entity.task === 'help') return 'task:help';
  return null;
}

// Coming and going, said in the chore's own words; carrying something as they come.
const GOING = /^(walking|coming|going|on the road|on the way|setting out|turning back|fetching the hoe|out to|bringing)/;
const CARRYING = /carrying|hauling|dragging/;
const NONE = Object.freeze([]);

/** The stroke somebody at `activity` is drawn at, from the chore's words: its base, or the part `by` names. */
export function strokeOf(activity, doing = '') {
  const entry = WORK[activity];
  if (!entry) return null;
  for (const [pattern, stroke] of entry.by || NONE) if (pattern.test(doing)) return stroke;
  return entry.stroke;
}

/**
 * The binding of somebody at their work, or null for anybody who is not (on the road, walking to or from it, or with no
 * work the table knows). `variant` is the cast figure; `strolling` the page's reading of the way they are being moved over
 * their own land this frame ('e', 'w', 'n', 's' or null: public/motion.js `ProjectionMotion.heading`).
 *
 * The returned object is shared and frozen: one per stroke and figure, made once, so a frame asks for it without making
 * anything. Its `work` is the stroke itself and `stroke` its name.
 */
const BOUND = new Map();
export function workClip(entity, variant) {
  const activity = activityOf(entity);
  if (!activity) return null;
  const doing = entity.chore?.doing || '';
  const key = strokeOf(activity, doing);
  const stroke = STROKES[key];
  if (!stroke || stroke.art === 'play') return null;
  // On the road the journey draws them (public/motion.js `grownClip`); a road chore at a halted camp is at its work.
  if (entity.travel && !entity.travel.halted) return null;
  // Being moved across their own land, or going to or from the work in its own words: the walk, or the carry if they are
  // bringing something in. Work that is itself walking with the family is the walk wherever they are.
  if (entity.strolling || stroke.art === 'journey' || GOING.test(doing)) {
    const heading = entity.strolling === 'n' || entity.strolling === 's' ? entity.strolling : null;
    if (CARRYING.test(doing) || key === 'carry') return bound(variant, 'carry', 'carry', false);
    return heading ? bound(variant, `walk-${heading}`, 'walk', true) : bound(variant, 'walk', 'walk', false);
  }
  return bound(variant, stroke.pose, key, Boolean(stroke.upright));
}
function bound(variant, pose, key, upright) {
  let byVariant = BOUND.get(variant);
  if (!byVariant) BOUND.set(variant, byVariant = new Map());
  const id = `${key}:${pose}`;
  let binding = byVariant.get(id);
  if (!binding) {
    const stroke = STROKES[key];
    binding = Object.freeze({ id: `${variant}-${pose}`, ...(stroke.frozen && { frozen: true }), ...(upright && { upright: true }), work: stroke, stroke: key });
    byVariant.set(id, binding);
  }
  return binding;
}

/** Whether somebody's activity is one this table draws at the work (and so the page reads their stride and their place). */
export const drawsAtWork = entity => {
  const activity = activityOf(entity);
  return Boolean(activity && WORK[activity] && STROKES[WORK[activity].stroke]?.art !== 'play');
};

/**
 * Where somebody stands at a piece of work shared with others, as an offset from the place the server put them all, in
 * figure heights: several people at one house, one well or one clearing stand round it instead of in one another, and each
 * faces it. `workmates` is everybody the page has; the ones at the same activity within a few yards are counted, in id order,
 * so the ring is the same every frame and on every screen. Written into `out` (`{ x, y, face }`), so a frame makes nothing.
 * ceiling: "the same place" is a few yards (`SAME_WORK_MILES`); the server gives the house, the well and a plot one point for
 * everybody at it, and a tree its own, so that is enough. People at two pieces of work that close would share a ring.
 */
export const SAME_WORK_MILES = 0.003;
export function workSlot(entity, workmates, out) {
  const activity = activityOf(entity), spread = WORK[activity]?.spread;
  out.x = 0; out.y = 0; out.face = null;
  if (!spread || !entity.location) return false;
  let index = 0, count = 0;
  for (const other of workmates || NONE) {
    if (other === entity || other.id === entity.id) { count++; continue; }
    // The others as the page has them, without its own reading of where they stand: the place is compared next.
    if (other.kind !== 'person' || !other.location || other.travel) continue;
    if ((other.chore?.id || (other.task === 'work' ? 'task:work' : other.task === 'help' ? 'task:help' : null)) !== activity) continue;
    if (Math.abs(other.location.x - entity.location.x) > SAME_WORK_MILES || Math.abs(other.location.y - entity.location.y) > SAME_WORK_MILES) continue;
    count++;
    if (other.id < entity.id) index++;
  }
  if (!count) count = 1;
  // The first stands to the west of the work facing east; the others round it, evenly, the ring flattened as the ground is.
  // Work with a front (the house) is stood along that side only, west to east, never inside it.
  const angle = WORK[activity].arc === 'front' ? Math.PI * (1 - (index + 0.5) / count) : Math.PI + (Math.PI * 2 * index) / count;
  out.x = Math.cos(angle) * spread;
  out.y = Math.sin(angle) * spread * 0.45;
  out.face = out.x > 0.01 ? 'w' : 'e';
  return true;
}

/**
 * Where in its cycle a stroke is at `timeMs`: the frame of the pose, the milliseconds since the stroke last struck, and the
 * number of that strike. `durations` is the pose clip's frame durations (null for a pose with no cycle, which then runs on
 * the stroke's own `cycleMs`). Written into `out`, so a frame makes nothing.
 */
export function strokeClock(stroke, durations, timeMs, out) {
  let period = 0;
  if (durations?.length) for (const each of durations) period += each;
  const own = !period || stroke.cycleMs;
  if (own) period = stroke.cycleMs || 1000;
  let beatAt = 0;
  if (!own && Number.isFinite(stroke.beat)) for (let i = 0; i < stroke.beat && i < durations.length; i++) beatAt += durations[i];
  const t = Math.max(0, timeMs);
  const since = (((t - beatAt) % period) + period) % period;
  out.period = period;
  out.since = since;
  out.count = Math.floor((t - beatAt) / period);
  let frame = 0;
  if (!own) { let edge = 0, at = t % period; for (let i = 0; i < durations.length; i++) { edge += durations[i]; if (at < edge) { frame = i; break; } } }
  out.frame = frame;
  return out;
}

/** The sideways shift and the facing of a pose that moves over the ground on the spot: pacing out a plot, shooing birds. */
export function strokeShift(stroke, clock) {
  if (stroke.motion !== 'pace') return 0;
  const u = clock.since / clock.period;
  return Math.sin(u * Math.PI * 2) * (stroke.reach || 0.3);
}
export function strokeFace(stroke, clock) {
  if (stroke.motion !== 'pace') return null;
  return Math.cos((clock.since / clock.period) * Math.PI * 2) >= 0 ? 'e' : 'w';
}
/** The lean (a shear about the feet) of a pose that bobs at its work: stooping to pick up, working at the meat. */
export function strokeLean(stroke, clock) {
  if (stroke.motion !== 'bob') return 0;
  return Math.sin((clock.since / clock.period) * Math.PI * 2) * 0.09;
}

// A cheap, repeatable scatter: the same particle of the same strike lands in the same place on every screen.
const scatter = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };

const EFFECTS = Object.freeze({
  // colour, how many, how long they fly, how far out and up (in figure heights), and their size.
  // `sheet`: the effect sheet that replaces these marks once it has loaded (stand-in: docs/ART_REQUESTS.md, "Claude-drawn
  // stand-ins (replace with Astra's)", area A - `fx-*` are Claude-drawn; Astra's of the same names replace them).
  chips: { colour: '#d9b77a', n: 5, life: 460, out: 0.55, up: 0.42, size: 0.045, from: 0.2, sheet: 'fx-wood-chips' },
  shavings: { colour: '#ead6a4', n: 3, life: 520, out: 0.25, up: 0.2, size: 0.035, from: 0.42, sheet: 'fx-shavings' },
  earth: { colour: '#6b4a2b', n: 4, life: 560, out: -0.5, up: 0.55, size: 0.055, from: 0.08, sheet: 'fx-earth-toss' },
  dust: { colour: 'rgba(190,165,120,.55)', n: 3, life: 620, out: 0.3, up: 0.12, size: 0.1, from: 0.02, puff: true, sheet: 'fx-dust' },
  ripple: { life: 1200, from: 0, ring: true, sheet: 'fx-ripple' },
  chaff: { colour: 'rgba(214,190,120,.7)', n: 4, life: 700, out: 0.35, up: 0.25, size: 0.04, from: 0.18 },
});

/**
 * Where the hoe is in each frame of each cast figure's hoeing cycle (`-work`), so a tool drawn over it is in the same hands:
 * `[gripX, gripY, headX, headY]` in figure heights from the feet (x toward the way they face, y down), for frames 0-3
 * (raised, swinging, down, back). Read by eye off each frame over a tenth-of-a-height grid, drawn at the atlas's own anchor
 * and logical height.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-28 — people at work, items 1 (`-chop`), 2 (`-split`) and 3 (`-notch`): the
 * felling axe and the maul drawn over the hoe until those sheets land; then `tool` goes and this table with it.
 * ceiling: read by eye to about a fiftieth of a height; the painted hoe's edge can show past the axe head by a pixel or two at
 * the classroom zoom. A figure missing here keeps the hoe.
 */
export const HAFTS = Object.freeze({
  rust: [[-0.144, -0.707, -0.375, -0.875], [0.096, -0.298, 0.375, -0.072], [0.11, -0.178, 0.298, -0.02], [0.048, -0.298, 0.279, -0.043]],
  teal: [[-0.144, -0.683, -0.375, -0.875], [0.168, -0.288, 0.375, -0.072], [0.11, -0.178, 0.298, -0.02], [0.072, -0.298, 0.279, -0.043]],
  elder: [[-0.144, -0.707, -0.375, -0.875], [0.313, -0.274, 0.529, -0.091], [0.192, -0.154, 0.313, -0.024], [0.096, -0.274, 0.279, -0.034]],
  blue: [[-0.168, -0.707, -0.375, -0.875], [0.313, -0.346, 0.553, -0.144], [0.168, -0.178, 0.337, -0.034], [0.192, -0.298, 0.394, -0.139]],
  'rust-woman': [[-0.168, -0.707, -0.442, -0.827], [0.087, -0.284, 0.327, -0.043], [0.072, -0.202, 0.279, -0.024], [0.024, -0.322, 0.279, -0.043]],
  indigo: [[-0.144, -0.731, -0.337, -0.899], [0.096, -0.274, 0.313, -0.043], [0.072, -0.154, 0.288, -0.01], [0.024, -0.298, 0.264, -0.024]],
  ochre: [[-0.04, -0.56, -0.36, -0.9], [0.096, -0.274, 0.327, -0.043], [0.096, -0.154, 0.28, -0.024], [0.024, -0.346, 0.279, -0.043]],
  'blue-girl': [[-0.168, -0.707, -0.394, -0.851], [0.072, -0.298, 0.327, -0.043], [0.072, -0.178, 0.28, -0.024], [-0.024, -0.346, 0.288, -0.043]],
});
/**
 * A felling axe or a maul in the hands of the hoeing cycle's `frame`, over the painted hoe: the haft from the hands through the
 * hoe's head, the axe's bit (the maul's block) on the side the hoe blade hangs, so it covers it. No allocation: a few paths.
 * Returns how many marks it drew (0 for a figure `HAFTS` does not know, which keeps its hoe).
 */
export function drawHaftTool(ctx, tool, figure, frame, x, y, size, dir) {
  const haft = HAFTS[figure]?.[frame];
  if (!haft) return 0;
  const gx = x + dir * haft[0] * size, gy = y + haft[1] * size, hx = x + dir * haft[2] * size, hy = y + haft[3] * size;
  let ux = hx - gx, uy = hy - gy;
  const length = Math.hypot(ux, uy) || 1;
  ux /= length; uy /= length;
  // The side the hoe blade hangs: the perpendicular that points down the screen.
  let px = -uy, py = ux;
  if (py < 0) { px = -px; py = -py; }
  // The head sits at the haft's end, a little back from the hoe blade's middle so the bit lies over the blade.
  const tx = hx - px * size * 0.03, ty = hy - py * size * 0.03;
  const ax = (along, side) => tx + ux * size * along + px * size * side, ay = (along, side) => ty + uy * size * along + py * size * side;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b2117'; ctx.lineWidth = Math.max(1.8, size * 0.05);
  ctx.beginPath(); ctx.moveTo(gx - ux * size * 0.06, gy - uy * size * 0.06); ctx.lineTo(ax(0.03, 0), ay(0.03, 0)); ctx.stroke();
  ctx.strokeStyle = '#8a6238'; ctx.lineWidth = Math.max(0.9, size * 0.03); ctx.stroke();
  ctx.fillStyle = tool === 'maul' ? '#4d4945' : '#71757a'; ctx.strokeStyle = '#231d17'; ctx.lineWidth = Math.max(0.8, size * 0.012);
  ctx.beginPath();
  if (tool === 'maul') {
    // A heavy block across the haft's end, as long on the one side as the other.
    ctx.moveTo(ax(0.04, -0.065), ay(0.04, -0.065)); ctx.lineTo(ax(0.04, 0.075), ay(0.04, 0.075));
    ctx.lineTo(ax(-0.035, 0.075), ay(-0.035, 0.075)); ctx.lineTo(ax(-0.035, -0.065), ay(-0.035, -0.065));
  } else {
    // The eye round the haft, the poll behind it, and the bit flaring out to its edge.
    ctx.moveTo(ax(0.03, -0.025), ay(0.03, -0.025)); ctx.lineTo(ax(0.055, 0.085), ay(0.055, 0.085));
    ctx.lineTo(ax(-0.065, 0.085), ay(-0.065, 0.085)); ctx.lineTo(ax(-0.03, -0.025), ay(-0.03, -0.025));
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (tool !== 'maul') {
    // The ground edge, bright.
    ctx.strokeStyle = '#d5d8d4'; ctx.lineWidth = Math.max(0.7, size * 0.01);
    ctx.beginPath(); ctx.moveTo(ax(0.05, 0.08), ay(0.05, 0.08)); ctx.lineTo(ax(-0.06, 0.08), ay(-0.06, 0.08)); ctx.stroke();
  }
  ctx.restore();
  return 2;
}

/**
 * Draw the stand-in's tool and effect over (and, for the rod's line and ripples, in front of) the figure just drawn at
 * (x, y), `size` tall, facing `dir` (1 east, -1 west). Does nothing for a delivered stroke with no effect, or under reduced
 * motion except the still tool. Returns how many marks it drew, which the proofs read.
 */
export function drawWorkLayer(ctx, stroke, x, y, size, dir, clock, still = false, figure = null, sprite = null) {
  let drawn = 0;
  const since = clock.since;
  // Under reduced motion the pose is held at its first frame, and so is the tool in its hands.
  if (stroke.tool === 'axe' || stroke.tool === 'maul') drawn += drawHaftTool(ctx, stroke.tool, figure, still ? 0 : clock.frame, x, y, size, dir);
  else if (stroke.tool === 'rifle') {
    // A long rifle held to the shoulder, level at the mark (practice) or, standing guard, sloped up.
    const up = stroke === STROKES.guard ? 0.3 : 0.04;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = Math.max(1.2, size * 0.035);
    ctx.beginPath(); ctx.moveTo(x - dir * size * 0.08, y - size * 0.56); ctx.lineTo(x + dir * size * 0.62, y - size * (0.6 + up)); ctx.stroke();
    ctx.restore();
    drawn++;
    if (!still && stroke.effect === 'smoke' && since < 700) drawn += muzzleSmoke(ctx, x + dir * size * 0.66, y - size * 0.61, size, dir, since);
  } else if (stroke.tool === 'rod') {
    // A cane pole out over the water, the line down to a float that bobs, and rings spreading from it.
    const bob = still ? 0 : Math.sin((since / clock.period) * Math.PI * 2) * size * 0.025;
    const tipX = x + dir * size * 0.95, tipY = y - size * 0.85, floatX = x + dir * size * 1.1, floatY = y + size * 0.04 + bob;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6d5332'; ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.beginPath(); ctx.moveTo(x + dir * size * 0.18, y - size * 0.42); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,36,30,.55)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(floatX, floatY); ctx.stroke();
    ctx.fillStyle = '#b8452c'; ctx.beginPath(); ctx.arc(floatX, floatY, Math.max(1.2, size * 0.022), 0, Math.PI * 2); ctx.fill();
    drawn += 3;
    if (!still) {
      const u = since / clock.period;
      ctx.strokeStyle = `rgba(230,240,245,${(0.6 * (1 - u)).toFixed(3)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(floatX, floatY + size * 0.01, size * (0.04 + 0.16 * u), size * (0.015 + 0.05 * u), 0, 0, Math.PI * 2); ctx.stroke();
      drawn++;
    }
    ctx.restore();
  }
  if (still) return drawn;
  // A drawn cycle of shooting (`-fire`): the flash and the smoke at its muzzle, from the shot.
  if (stroke.muzzle) return stroke.effect === 'smoke' && since < 700 ? drawn + muzzleSmoke(ctx, x + dir * size * stroke.muzzle[0], y - size * stroke.muzzle[1], size, dir, since) : drawn;
  if (stroke.effect === 'smoke' && !stroke.tool) {
    // A fire tended: grey puffs going up from in front of the kneeling figure.
    ctx.save();
    // From the fire: in front of the kneeling figure, or where a drawn cycle has its own fire (`at`, `ownFire`).
    const fx = stroke.at ? stroke.at[0] : 0.5;
    for (let i = 0; i < 3; i++) {
      const u = ((since / clock.period) + i / 3) % 1;
      ctx.fillStyle = `rgba(150,146,138,${(0.45 * (1 - u)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x + dir * size * (fx + 0.05 * Math.sin(u * 6 + i)), y - size * (0.1 + 0.7 * u), size * (0.05 + 0.07 * u), 0, Math.PI * 2); ctx.fill();
      drawn++;
    }
    if (!stroke.ownFire) {
      ctx.fillStyle = 'rgba(240,150,60,.85)';
      ctx.beginPath(); ctx.arc(x + dir * size * fx, y - size * 0.04, size * (0.035 + 0.01 * Math.sin(since / 90)), 0, Math.PI * 2); ctx.fill();
      drawn++;
    }
    ctx.restore();
    return drawn;
  }
  const effect = stroke.tool === 'rod' ? null : EFFECTS[stroke.effect]; // the rod draws its own rings
  if (!effect || since > effect.life) return drawn;
  const u = since / effect.life, sx = x + dir * size * (stroke.at ? stroke.at[0] : 0.5), sy = y - size * (stroke.at ? stroke.at[1] : effect.from);
  // The effect's own sheet where it has loaded (`fx-*`, three frames from the strike, drawn at the worker's height on the point
  // the effect comes from); the canvas marks below until then.
  if (sprite && effect.sheet && sprite(ctx, `${effect.sheet}-${Math.min(3, 1 + Math.floor(u * 3))}`, sx, sy, size, dir < 0)) return drawn + 1;
  if (effect.ring) {
    // Rings spreading from a float: the canvas stand-in for `fx-ripple`.
    ctx.save();
    ctx.strokeStyle = `rgba(230,240,245,${(0.6 * (1 - u)).toFixed(3)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx, sy, size * (0.04 + 0.16 * u), size * (0.015 + 0.05 * u), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return drawn + 1;
  }
  ctx.save();
  ctx.fillStyle = effect.colour;
  for (let i = 0; i < effect.n; i++) {
    const a = scatter(i + 1, clock.count), b = scatter(clock.count + 3, i + 7);
    const px = sx + dir * size * effect.out * (0.35 + 0.65 * a) * u;
    const py = sy - size * effect.up * (0.5 + b) * (u - u * u * 1.6);
    const s = size * effect.size * (effect.puff ? 0.6 + 1.4 * u : 1);
    ctx.globalAlpha = effect.puff ? 1 - u : Math.min(1, 1.6 * (1 - u));
    if (effect.puff) { ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(px - s / 2, py - s / 2, s, s * 0.7);
    drawn++;
  }
  ctx.restore();
  return drawn;
}

/** The flash and the smoke at a rifle's muzzle, once a shot (`since` under 700 ms). Returns how many marks it drew. */
function muzzleSmoke(ctx, mx, my, size, dir, since) {
  const u = since / 700;
  let marks = 0;
  ctx.save();
  if (u < 0.12) { ctx.fillStyle = 'rgba(255,214,120,.9)'; ctx.beginPath(); ctx.arc(mx, my, size * 0.05, 0, Math.PI * 2); ctx.fill(); marks++; }
  ctx.fillStyle = `rgba(222,218,206,${(0.75 * (1 - u)).toFixed(3)})`;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(mx + dir * size * (0.06 + 0.12 * u) * (i + 1), my - size * 0.05 * u * i, size * (0.04 + 0.08 * u), 0, Math.PI * 2); ctx.fill(); marks++; }
  ctx.restore();
  return marks;
}

/**
 * The strike of every tool, for whoever wants to hear it (the work sounds, later): `listener({ id, activity, stroke, x, y })`
 * once a strike, on the frame it lands. Costs nothing while nobody listens.
 */
const beatListeners = [];
const beatSeen = new Map();
export function onWorkBeat(listener) { beatListeners.push(listener); return () => { const at = beatListeners.indexOf(listener); if (at >= 0) beatListeners.splice(at, 1); }; }
export function workBeat(id, activity, key, clock, x, y) {
  if (!beatListeners.length) return;
  if (beatSeen.get(id) === clock.count) return;
  beatSeen.set(id, clock.count);
  for (const listener of beatListeners) listener({ id, activity, stroke: key, x, y });
}
