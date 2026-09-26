// The one battle renderer (docs/BATTLES.md §3, §6). It replaced `drawFormations` in public/app.js on 2026-09-25.
//
// Owner, 2026-09-25: "when i try to watch a battle ... i see npc's just standing around ... the battle itself never actually
// takes place. there's no smoke from the gunfire." And: "wouldn't the mexican army be in rows, but the texians in
// unorganized chaos? shouldn't there be talking, orders given, taunting etc?"
//
// Everything drawn here is presentation of what the server sent (sim/battle-stage.mjs `projectBattle`): each side's count,
// style, place and fire in the phase it is in, the lines said so far, the cannon's shots so far, who has fallen. It never
// decides anything, and nothing here reaches the simulation. What it adds is only what a picture needs between two ticks:
//   - each drawn figure is a sample of a count (`FIC-GONZ-006`), laid out by the side's style with a stable seed, so the
//     same fight is always drawn the same way;
//   - each figure is on its own looping cycle - a Texian at his own pace, with his own wait between loads; a Mexican rank on
//     its officer's word - so the line is never frozen on the ramrod as the old one-shot clip left it;
//   - every shot leaves smoke that accumulates, lingers and drifts with the day's wind, and thins once firing stops;
//   - a side moves smoothly from where the last tick had it to where this one has it, never jumping;
//   - words are drawn over whoever says them (public/speech.js), each at the moment of the tick the server dated it.
// A family's own person in the force is a real entity drawn by public/app.js at the place the server gave them; this only
// tells app.js which pose they are in (`memberPose`) so they fire and load with the men around them.
// Relative, so the same module loads in the page (as /speech.js) and under node for tests/battle-view.test.mjs.
import { drawSpeech, speechAlpha } from './speech.js';

/** Miles between figures, by style. A person is drawn 0.019 miles tall (sim/house-footprint.mjs `PERSON_MILES`). */
const LAYOUT = Object.freeze({
  ranks: { across: 0.021, rank: 0.03 },
  mounted: { across: 0.03, rank: 0.048 },
  column: { across: 0.022, rank: 0.026 },
  wall: { across: 0.018, rank: 0.02 },
  loose: { width: 0.44, depth: 0.22, gap: 0.02 },
  bank: { width: 0.5, depth: 0.08, gap: 0.018 },
  street: { width: 0.3, depth: 0.3, gap: 0.02 },
  rout: { width: 0.6, depth: 0.5, gap: 0.03 },
});
/** One load of a musket in the library's cycle: aim 700, fire 120, load 750, ramrod 900 (public/assets/frontier-v1/animation.json). */
const FIRE_CLIP_MS = 2470, AIM_MS = 700;
/** How long a Texian waits, at his own pace, between loads: seconds, not a drill-book rate. `FIC-GONZ-446`. */
const WAIT_MIN_MS = 3500, WAIT_SPAN_MS = 9000;
/**
 * A rank's volley on the officer's word: the whole cycle, and when in it each word is said.
 * ceiling: the volley's rhythm is each page's own and is not dated by the server, as no musket's shot is; a volley that
 * matters to the history (a first volley at a dated minute) would be a server-dated shot, as the cannon's are.
 */
const VOLLEY_MS = 11000, VOLLEY_WORDS_AT = [0, 1500, 2600];
// ceiling: at most 170 puffs on the field at once, the oldest let go first, so a Chromebook's frame stays under a few
// milliseconds (measured by scripts/battle-gonzales-browser-proof.mjs); a battle with far more men firing than Gonzales -
// San Jacinto's eighteen minutes - may want the puffs merged into banks rather than a higher cap.
const SMOKE_CAP = 170, SMOKE_LIFE_MS = 32000, CANNON_SMOKE_LIFE_MS = 45000;

const hash = key => {
  let h = 2166136261;
  for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
const clamp01 = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Where each figure of a side stands, in miles relative to the side's centre: `along` toward the enemy, `across` to his
 * left. Worked out once per side, style and count; a stable seed means a camera move never reshuffles a line.
 * ceiling: laid out on open ground whatever is under it - a man may stand in the timber's trees or, at a battle fought on a
 * bank, in the water. The ground's own classes (public/ground-classes.js) are the way out once an engagement is fought
 * where it matters (Concepción's riverbank).
 */
export function layoutSide(side) {
  // A part (§6.13) that is not formed is laid out once, scattered, whatever its style this phase: asleep, running or giving up,
  // the same men stand in the same places.
  const style = side.part && !FORMED.includes(side.style) ? 'loose' : side.style === 'camp' ? 'loose' : side.style;
  const n = Math.max(0, Math.min(60, side.drawn | 0)), seed = side.part ? `${side.side}:${side.part}:${n}` : `${side.side}:${style}:${n}`;
  const out = [];
  if (['ranks', 'mounted', 'column', 'wall'].includes(style)) {
    const spec = LAYOUT[style];
    const ranks = style === 'column' ? Math.ceil(n / 4) : style === 'wall' ? 1 : n > 30 ? 3 : 2;
    const perRank = Math.ceil(n / ranks);
    for (let i = 0; i < n; i++) {
      const rank = style === 'column' ? i % 4 : Math.floor(i / perRank), file = style === 'column' ? Math.floor(i / 4) : i % perRank;
      const jitter = (hash(`${seed}:${i}:j`) - 0.5) * 0.003;
      // A column runs along the line of march; a rank runs across it.
      out.push(style === 'column'
        ? { along: -file * spec.rank + jitter, across: (rank - 1.5) * spec.across, rank: 0, index: i }
        : { along: -rank * spec.rank + jitter, across: (file - (perRank - 1) / 2) * spec.across + jitter, rank, index: i });
    }
    return out;
  }
  // Loose, bank, street and rout: scattered through an area with a minimum gap, no two figures on one spot, no rows.
  const spec = LAYOUT[style] || LAYOUT.loose;
  const width = side.spread?.width ?? spec.width, depth = side.spread?.depth ?? spec.depth;
  // A part huddled in a small place - eight men round a fire, a house's men at its door (§6.13) - keeps its men apart by what
  // the place allows, so every one of them is drawn. A whole side keeps the style's own gap, as it always has.
  const gap = side.part ? Math.min(spec.gap, 0.6 * Math.sqrt(width * depth * 0.6 / Math.max(1, n))) : spec.gap;
  for (let i = 0, tries = 0; out.length < n && tries < n * 40; tries++) {
    const a = hash(`${seed}:${tries}:a`), b = hash(`${seed}:${tries}:b`);
    // Thicker toward the middle and the front, thinner at the ends: men bunch behind the best cover, not in a grid.
    const across = (a - 0.5) * width * (0.7 + 0.6 * b), along = -Math.pow(b, 1.4) * depth;
    if (out.some(o => Math.hypot(o.along - along, o.across - across) < gap)) continue;
    out.push({ along, across, rank: 0, index: i++, kneel: hash(`${seed}:${tries}:k`) < (style === 'bank' ? 0.6 : 0.3), wait: WAIT_MIN_MS + hash(`${seed}:${tries}:w`) * WAIT_SPAN_MS, phase: hash(`${seed}:${tries}:p`) });
  }
  return out;
}
/** One layout per side, style, count and ground: a force gathered close at night is not laid out as the line at dawn. */
const layoutKey = side => side.part
  ? `${side.side}:${side.part}:${FORMED.includes(side.style) ? side.style : 'scatter'}:${side.drawn}:${side.spread?.width ?? ''}:${side.spread?.depth ?? ''}`
  : `${side.side}:${side.style}:${side.drawn}:${side.spread?.width ?? ''}:${side.spread?.depth ?? ''}`;
/** The styles laid out in files and ranks; every other is scattered. A part keeps one scattered layout through its phases. */
const FORMED = Object.freeze(['ranks', 'mounted', 'column', 'wall']);
/** A figure's place on the ground from its slot: the side's centre, turned to face the way the side faces. */
const onGround = (centre, facing, slot) => ({
  x: centre.x + facing.x * slot.along - facing.y * slot.across,
  y: centre.y + facing.y * slot.along + facing.x * slot.across,
});
/** How regular a set of screen points is: the spread of each one's distance to its nearest neighbour over the mean. */
export function regularity(points) {
  if (points.length < 3) return null;
  const nearest = points.map((p, i) => Math.min(...points.filter((_, j) => j !== i).map(q => Math.hypot(p.x - q.x, p.y - q.y))));
  const mean = nearest.reduce((s, d) => s + d, 0) / nearest.length;
  const sd = Math.sqrt(nearest.reduce((s, d) => s + (d - mean) ** 2, 0) / nearest.length);
  return mean ? sd / mean : null;
}

/**
 * The renderer. `art` is what app.js already draws with: `animated(ctx, clip, x, y, size, seed, options)` (returns 0 when a
 * clip is not loaded), `drawSprite`, `hasSprite` and `miniPerson` for the fallback figure.
 */
export function createBattleView(art) {
  const view = {
    key: null, minute: null, tickAt: 0, tickMs: 1000, sides: new Map(), layouts: new Map(),
    smoke: [], flashes: [], shotsSeen: new Set(), linesSeen: new Map(), commandsAt: 0, fallenAt: new Map(),
    members: new Map(), memberSpots: new Map(), bubbles: [], cannonFiredAt: [], frameMs: [], evidence: null,
    // Presentation evidence across frames, read by scripts/battle-gonzales-browser-proof.mjs and by nothing in the page.
    shotsTotal: 0, shotsBy: {}, linesShown: new Set(), memberClips: new Set(),
    // §6.13: where each fallen figure went down (it lies there while its part moves on), the herd, and when each of the page's
    // own people's fates was first seen.
    fallenSpots: new Map(), herd: null, fateSeen: new Map(),
  };
  // A Texian on horseback (Grant's party, `mounted` on the side) is drawn riding. stand-in: docs/ART_REQUESTS.md, request
  // 2026-09-25 "a volunteer on horseback" - the mounted courier's riding clip, until a mounted volunteer exists.
  const figureOf = (side, slot) => side.side === 'mexican'
    ? (side.style === 'mounted' && !(slot.rank < (side.dismounted || 0)) ? 'dragoon' : 'regular')
    : side.mounted && side.pose !== 'surrender' && side.style !== 'camp' ? 'rider' : 'volunteer';

  /** A new tick of the battle: remember where each side was drawn, so it walks from there to the new place. */
  function accept(battle, now, tickMs) {
    const key = `${battle.id}`;
    if (view.key !== key) {
      view.key = key; view.sides.clear(); view.smoke = []; view.flashes = []; view.shotsSeen.clear(); view.linesSeen.clear(); view.fallenAt.clear(); view.cannonFiredAt = [];
      view.minute = null; view.fallenSpots.clear(); view.herd = null; view.fateSeen.clear();
    }
    if (battle.minute === view.minute) return;
    const previousMinute = view.minute;
    view.tickMs = Math.max(200, tickMs || 1000);
    for (const side of battle.sides) {
      const was = view.sides.get(side.side);
      const drawnAt = was ? placeAt(was, now) : { x: side.x, y: side.y };
      view.sides.set(side.side, { ...side, from: drawnAt, to: { x: side.x, y: side.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs });
      // Each part of a side walks from where it was drawn too (§6.13).
      for (const part of side.parts || []) {
        const partKey = `${side.side}:${part.id}`, had = view.sides.get(partKey);
        const partAt = had ? placeAt(had, now) : { x: part.x, y: part.y };
        view.sides.set(partKey, { ...part, side: side.side, from: partAt, to: { x: part.x, y: part.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs });
      }
    }
    if (battle.herd) {
      const herdAt = view.herd ? placeAt(view.herd, now) : { x: battle.herd.x, y: battle.herd.y };
      view.herd = { ...battle.herd, from: herdAt, to: { x: battle.herd.x, y: battle.herd.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs };
    } else view.herd = null;
    // Words and shots dated inside the tick that just ended are given the real moment of the tick they fell in, so a line
    // said at the fourth minute of a five-minute tick is drawn four fifths of the way through it.
    const span = previousMinute === null ? 0 : Math.max(1, battle.minute - previousMinute);
    const when = minute => previousMinute === null ? now : now + clamp01((minute - previousMinute) / span) * view.tickMs * 0.9;
    for (const line of battle.lines || []) {
      if (view.linesSeen.has(line.id)) continue;
      // A page opened in the middle of a fight hears the latest line, not a speech of everything already said.
      if (previousMinute === null && line !== battle.lines.at(-1)) { view.linesSeen.set(line.id, { at: -Infinity, line }); continue; }
      view.linesSeen.set(line.id, { at: when(line.minute), line });
    }
    for (const shot of battle.cannon?.shots || []) {
      if (view.shotsSeen.has(shot)) continue;
      view.shotsSeen.add(shot);
      if (previousMinute !== null || shot === battle.minute) view.cannonFiredAt.push(when(shot));
    }
    for (const fall of battle.fallen || []) {
      const id = `${fall.side}:${fall.part || ''}:${fall.minute}`;
      if (!view.fallenAt.has(id)) view.fallenAt.set(id, { ...fall, at: previousMinute === null ? now - 60000 : when(fall.minute) });
    }
    view.minute = battle.minute;
  }
  function placeAt(side, now) {
    const t = side.duration ? clamp01((now - side.at) / side.duration) : 1;
    return { x: lerp(side.from.x, side.to.x, t), y: lerp(side.from.y, side.to.y, t) };
  }

  /** Smoke from one discharge, in miles on the ground so it stays put when the camera moves and drifts with the wind. */
  function puff(x, y, now, { big = false, wind } = {}) {
    const w = wind || { x: 0, y: 0 };
    view.smoke.push({
      x, y, born: now, life: big ? CANNON_SMOKE_LIFE_MS : SMOKE_LIFE_MS * (0.75 + 0.5 * Math.random()),
      // Miles a real millisecond: the wind's screen vector (public/weather-art.js `windVector`, y down the page as the
      // ground's y is), and a little rise of the hot smoke up the page. A still fog morning barely moves it; a norther
      // carries it off the field.
      vx: w.x * 2.2e-6 + (Math.random() - 0.5) * 2e-7, vy: w.y * 2.2e-6 - 1.2e-7 - Math.random() * 1e-7,
      size0: big ? 1.6 : 0.6, size1: big ? 7 : 3.1 + Math.random() * 1.4, alpha: big ? 0.85 : 0.62,
      seed: Math.random(),
    });
    if (view.smoke.length > SMOKE_CAP) view.smoke.splice(0, view.smoke.length - SMOKE_CAP);
  }
  function flash(x, y, facingRight, now, size) { view.flashes.push({ x, y, right: facingRight, born: now, size }); }

  /**
   * The pose a family's person in the force is drawn in this frame, or null for anybody not in it: the same own-pace cycle
   * as the Texians round them. app.js asks this before it draws the person, and draws them in it.
   * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "a family's own people firing" - a family's person in the force is
   * drawn in the volunteer militia's firing cycle, not in their own cast figure, until each cast has an aim/fire/load set.
   */
  function memberPose(entity, time) {
    const member = view.members.get(entity.id);
    if (!member) return null;
    const pose = poseOf(member, time);
    view.memberClips.add(pose.clip || pose.sprite);
    return pose;
  }
  function poseOf(member, time) {
    const side = view.sides.get('texian');
    const right = (side?.facing?.x ?? 1) >= 0;
    // A fate the server has sent (§6.13): hit, then lying still; or hands up. No blood, no gore (VISION.md §16).
    if (member.fate?.fate === 'killed') return (performance.now() - member.fateAt) < 700 ? { clip: 'volunteer-injured-rest', timeMs: time } : { sprite: 'volunteer-reclining', still: true };
    if (member.fate?.fate === 'captured' || member.pose === 'surrender') return { clip: 'volunteer-surrender', timeMs: time };
    if (member.pose === 'asleep') return { sprite: 'volunteer-reclining', still: true };
    if (member.mounted) return { clip: 'mounted-courier-e', flip: !right, timeMs: time, scale: 1.35 };
    if (!member.firing) return { clip: member.moving ? 'volunteer-march' : right ? 'volunteer-idle-e' : 'volunteer-idle-w', flip: member.moving ? !right : false, timeMs: time };
    const cycle = FIRE_CLIP_MS + member.wait, t = (time + member.offset) % cycle;
    if (t < member.wait) return { sprite: member.kneel ? 'volunteer-load' : right ? 'volunteer-e' : 'volunteer-w', flip: member.kneel ? !right : false, still: true };
    return { clip: 'volunteer-fire-reload', flip: !right, timeMs: t - member.wait };
  }
  /** Where app.js drew a member this frame, on the ground: the next shot's smoke comes from there. */
  function memberDrawn(id, ground, sizePx) { view.memberSpots.set(id, { ...ground, sizePx }); }

  /**
   * Draw one frame of the battle. `camera` is `{ toScreen, figure, scale }`; `time` the page's animation clock; `now` the
   * frame's performance.now(); `wind` the day's wind vector where the fight is (public/weather-art.js `weatherMix`).
   */
  function draw(ctx, battle, { camera, time, now, tickMs, wind = null, reducedMotion = false, paused = false, bounds = null, named = false }) {
    const started = performance.now();
    // Held still: nothing new is fired and no cycle moves, for somebody who asked for less motion or a class the Host paused.
    const still = reducedMotion || paused;
    if (!battle) { view.key = null; view.members.clear(); view.evidence = null; return null; }
    accept(battle, now, tickMs);
    const figurePx = Math.max(7, Math.min(60, camera.figure * 0.95));
    const drawn = { texian: [], mexican: [] };
    let flashes = 0, shots = 0;
    const fallenSlots = fallenBySide(battle, now);
    // Members first, so the sampled figures give them room: nothing sampled is drawn on a family's person.
    view.members.clear();
    const texianSide = battle.sides.find(side => side.side === 'texian');
    for (const id of battle.members || []) {
      // The part of the force this person is in (§6.13), whose pose and fire they share, and their fate once it has come.
      const partId = battle.memberParts?.[id], group = (partId && texianSide?.parts?.find(part => part.id === partId)) || texianSide;
      const fate = battle.memberFates?.[id] || null;
      if (fate && !view.fateSeen.has(id)) view.fateSeen.set(id, fate.minute < battle.minute - 1 ? now - 60000 : now);
      const pose = group?.pose || (group?.style === 'camp' ? 'asleep' : 'stand');
      view.members.set(id, {
        firing: ['scattered', 'volley', 'picket'].includes(group?.fire) && group.action !== 'gone' && !['asleep', 'surrender'].includes(pose) && !fate,
        moving: Boolean(group?.moving) || ['advance', 'withdraw', 'follow'].includes(group?.action) && !group?.parts,
        wait: WAIT_MIN_MS + hash(`${id}:w`) * WAIT_SPAN_MS, offset: hash(`${id}:o`) * 20000, kneel: hash(`${id}:k`) < 0.3,
        pose, mounted: Boolean(texianSide?.mounted), fate, fateAt: fate ? view.fateSeen.get(id) : null,
      });
    }
    // Members fire on their own cycle; their shot is spawned from where app.js drew them.
    for (const [id, member] of view.members) {
      const spot = view.memberSpots.get(id);
      if (!spot || !member.firing || still) continue;
      const cycle = FIRE_CLIP_MS + member.wait, t = (time + member.offset) % cycle, shotAt = member.wait + AIM_MS;
      const key = `${id}:${Math.floor((time + member.offset) / cycle)}`;
      if (t >= shotAt && t < shotAt + 400 && !view.shotsSeen.has(key)) {
        view.shotsSeen.add(key);
        const right = (texianSide.facing?.x ?? 1) >= 0;
        puff(spot.x + (right ? 1 : -1) * 0.012, spot.y - 0.006, now, { wind });
        flash(spot.x + (right ? 1 : -1) * 0.012, spot.y, right, now, 1); shots++;
      }
    }
    const memberPoints = [...view.memberSpots.entries()].filter(([id]) => view.members.has(id)).map(([, spot]) => spot);

    const figures = [];
    // The houses and groves the fight is among, behind everybody (§6.13), and the herd.
    const sceneryDrawn = drawScenery(ctx, battle, camera, figurePx, time);
    const herdDrawn = drawHerd(ctx, camera, figurePx, time, now);
    const poses = { asleep: 0, hidden: 0, surrender: 0, rider: 0 };
    const hiddenFire = [];
    for (const whole of battle.sides) {
      // A side in parts (§6.13) is drawn part by part, each its own group of the side's figures at its own place.
      const groups = whole.parts?.length
        ? whole.parts.map(part => ({ ...part, side: whole.side, part: part.id, mounted: whole.mounted, dismounted: whole.dismounted, key: `${whole.side}:${part.id}` }))
        : [{ ...whole, key: whole.side }];
      for (const side of groups) {
      const shown = view.sides.get(side.key);
      const centre = placeAt(shown, now);
      const key = layoutKey(side);
      if (!view.layouts.has(key)) view.layouts.set(key, layoutSide(side));
      const slots = view.layouts.get(key);
      const facing = side.facing, right = facing.x >= 0;
      const volley = side.fire === 'volley';
      // The rank whose turn it is, and where in the officer's cycle the rank stands.
      const cycleAt = (time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) % VOLLEY_MS, cycleNo = Math.floor((time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) / VOLLEY_MS);
      const ranks = Math.max(1, ...slots.map(slot => slot.rank + 1));
      const firingRank = cycleNo % Math.min(ranks, side.dismounted ? Math.max(1, side.dismounted) : ranks);
      const fallen = fallenSlots.get(side.key) || new Map();
      const pose = side.pose && side.pose !== 'stand' ? side.pose : side.style === 'camp' ? 'asleep' : 'stand';
      for (const slot of slots) {
        const seed = side.part ? `${side.side}:${side.part}:${slot.index}` : `${side.side}:${slot.index}`;
        // Shut in a house: the man is not drawn; his shot is a flash and a puff at the house's door and windows.
        const at = pose === 'hidden' ? { x: centre.x + facing.x * 0.012 + (slot.across || 0) * 0.35, y: centre.y + facing.y * 0.012 + (slot.along || 0) * 0.2 } : onGround(centre, facing, slot);
        const down = fallen.get(slot.index);
        // A man who fell lies where he fell, whatever his part does after (§6.13).
        const spotKey = `${side.key}:${slot.index}`;
        if (down && !view.fallenSpots.has(spotKey)) view.fallenSpots.set(spotKey, at);
        const ground = down ? view.fallenSpots.get(spotKey) : at;
        if (memberPoints.some(m => Math.hypot(m.x - ground.x, m.y - ground.y) < 0.014)) continue;
        const kind = figureOf(side, slot);
        const point = camera.toScreen(ground);
        const size = kind === 'dragoon' || kind === 'rider' ? figurePx * 1.35 : figurePx;
        let clip = null, sprite = null, timeMs = time, flip = !right, still = false;
        if (down) {
          // A wounded man went with his side when it left the field.
          if (down.wounded && side.action === 'gone') continue;
          // Falling, then lying still: no blood, no gore (VISION.md §16), and carried off once the fighting is over.
          figures.push({ y: point.y, kind: 'fallen', side: side.side, point, size: figurePx, down, slot, ground, facingRight: right });
          continue;
        }
        if (side.action === 'gone') continue;
        const moving = Boolean(side.moving);
        if (pose === 'hidden') {
          poses.hidden++;
          if (side.fire !== 'none' && !still) hiddenFire.push({ seed, ground, right, slot });
          continue;
        }
        if (pose === 'asleep') {
          // Asleep on the ground by the fire, rolled in a blanket.
          poses.asleep++;
          figures.push({ y: point.y, kind, side: side.side, point, size, clip: null, sprite: `${kind === 'rider' ? 'volunteer' : kind}-reclining`, timeMs, flip: slot.index % 2 === 0, still: true, seed });
          drawn[side.side].push(point);
          continue;
        }
        if (pose === 'surrender') {
          poses.surrender++;
          figures.push({ y: point.y, kind, side: side.side, point, size: figurePx, clip: `${kind === 'rider' ? 'volunteer' : kind}-surrender`, sprite: null, timeMs: time + slot.index * 137, flip: false, still: false, seed });
          drawn[side.side].push(point);
          continue;
        }
        if (kind === 'rider') {
          // A man on horseback: riding, and his shot from where his hands are, as a dragoon's is.
          poses.rider++;
          clip = 'mounted-courier-e'; flip = !right;
          if (!still && (side.fire === 'scattered' || (side.fire === 'picket' && slot.index % 4 === 0))) {
            const wait = 7000 + hash(`${seed}:rw`) * 12000, shifted = time + hash(`${seed}:rp`) * 25000, t = shifted % wait;
            const shotKey = `${seed}:r${Math.floor(shifted / wait)}`;
            if (t < 400 && !view.shotsSeen.has(shotKey)) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.014, y: ground.y - 0.012 };
              puff(muzzle.x, muzzle.y, now, { wind }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (kind === 'dragoon') {
          clip = moving ? 'dragoon-march' : right ? 'dragoon-idle-e' : 'dragoon-idle-w';
          flip = moving ? !right : false;
          // A dragoon firing his carbine from the saddle: the flash and the smoke from where his hands are, on his own long
          // wait between shots. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "a dragoon firing from the saddle" - the
          // library has no mounted firing pose, so the rider holds his pose and only the shot is drawn.
          if (!still && (side.fire === 'scattered' || (side.fire === 'picket' && slot.index % 6 === 0))) {
            const wait = 9000 + hash(`${seed}:dw`) * 16000, shifted = time + hash(`${seed}:dp`) * 25000, t = shifted % wait;
            const shotKey = `${seed}:d${Math.floor(shifted / wait)}`;
            if (t < 400 && !view.shotsSeen.has(shotKey)) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.014, y: ground.y - 0.012 };
              puff(muzzle.x, muzzle.y, now, { wind }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (side.fire === 'scattered' || (side.fire === 'picket' && slot.along > -0.03 && slot.index % 5 === 0)) {
          const wait = slot.wait ?? (WAIT_MIN_MS + hash(`${seed}:w`) * WAIT_SPAN_MS), cycle = FIRE_CLIP_MS + wait;
          const t = (time + (slot.phase ?? hash(`${seed}:p`)) * 20000) % cycle;
          if (t < wait) { sprite = slot.kneel ? `${kind}-load` : `${kind}-${right ? 'e' : 'w'}`; still = true; flip = slot.kneel ? !right : false; }
          else {
            clip = `${kind}-fire-reload`; timeMs = t - wait;
            const shotKey = `${seed}:${Math.floor((time + (slot.phase ?? 0) * 20000) / cycle)}`;
            if (timeMs >= AIM_MS && timeMs < AIM_MS + 400 && !view.shotsSeen.has(shotKey) && !still) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.012, y: ground.y - 0.004 };
              puff(muzzle.x, muzzle.y, now, { wind }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (volley && (slot.rank === firingRank) && (kind !== 'dragoon')) {
          const into = cycleAt - VOLLEY_WORDS_AT[1];
          if (into < 0 || into > FIRE_CLIP_MS) { sprite = `${kind}-${right ? 'e' : 'w'}`; still = true; flip = false; }
          else {
            clip = `${kind}-fire-reload`; timeMs = into;
            const shotKey = `${seed}:v${cycleNo}`;
            if (into >= AIM_MS && into < AIM_MS + 400 && !view.shotsSeen.has(shotKey) && !still) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.012, y: ground.y - 0.004 };
              puff(muzzle.x, muzzle.y, now, { wind }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (moving) { clip = `${kind}-march`; flip = !right; }
        else { sprite = `${kind}-${right ? 'e' : 'w'}`; still = true; flip = false; }
        figures.push({ y: point.y, kind, side: side.side, point, size, clip, sprite, timeMs, flip, still, seed });
        drawn[side.side].push(point);
      }
      }
    }
    // Shots from inside the houses: each man on his own reload, the flash at the door or a window, the smoke drifting off it.
    for (const { seed, ground, right } of hiddenFire) {
      if (still) break;
      const wait = WAIT_MIN_MS + hash(`${seed}:hw`) * WAIT_SPAN_MS, cycle = FIRE_CLIP_MS + wait, shifted = time + hash(`${seed}:hp`) * 20000;
      const t = shifted % cycle, shotKey = `${seed}:h${Math.floor(shifted / cycle)}`;
      if (t >= wait + AIM_MS && t < wait + AIM_MS + 400 && !view.shotsSeen.has(shotKey)) {
        view.shotsSeen.add(shotKey); shots++; view.shotsBy.texian = (view.shotsBy.texian || 0) + 1;
        puff(ground.x + (right ? 1 : -1) * 0.004, ground.y - 0.008, now, { wind }); flash(ground.x, ground.y - 0.004, right, now, 0.8);
      }
    }
    // Back to front, so a man nearer the camera stands in front of the one behind him.
    figures.sort((a, b) => a.y - b.y);
    for (const f of figures) {
      if (f.kind === 'fallen') { drawFallen(ctx, f, now); continue; }
      let ok = 0;
      if (f.clip) ok = art.animated(ctx, f.clip, f.point.x, f.point.y, f.size, f.seed, { timeMs: f.timeMs, flip: f.flip, paused: reducedMotion });
      else if (f.sprite) ok = art.drawSprite(ctx, f.sprite, f.point.x, f.point.y, f.size, { flip: f.flip });
      if (!ok) art.miniPerson(ctx, f.point.x, f.point.y, f.size, { side: f.side, flip: f.flip });
    }
    // The cannon and the men serving it.
    let cannonShown = null;
    if (battle.cannon) cannonShown = drawCannon(ctx, battle, camera, figurePx, time, now, wind, still);
    if (battle.flag) drawFlag(ctx, battle.flag, camera, figurePx, time, wind);
    if (battle.parley) drawParley(ctx, battle, camera, figurePx, time);
    // Night (§6.13): the field dark but for lit windows, the fire and the flashes, which are drawn over it.
    const night = battle.light === 'night' || battle.light === 'dawn' ? drawNight(ctx, battle, camera, figurePx, now, bounds) : null;
    // Flashes: a tenth of a second each, over the figures.
    view.flashes = view.flashes.filter(f => now - f.born < 130);
    for (const f of view.flashes) {
      const p = camera.toScreen(f), s = figurePx * 0.34 * f.size;
      if (night) glow(ctx, p.x, p.y - figurePx * 0.55, figurePx * 1.6, 'rgba(255,200,120,.45)');
      if (!art.drawSprite(ctx, f.right ? 'muzzle-flash-e' : 'muzzle-flash-w', p.x, p.y - figurePx * 0.55, s)) {
        ctx.fillStyle = 'rgba(255,214,120,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y - figurePx * 0.55, s * 0.35, 0, Math.PI * 2); ctx.fill();
      }
      flashes++;
    }
    const smokeDrawn = drawSmoke(ctx, camera, figurePx, now, reducedMotion, bounds);
    const bubbles = drawLines(ctx, battle, camera, figurePx, now, time, bounds, drawn);
    view.shotsTotal += shots;
    for (const bubble of bubbles) view.linesShown.add(bubble.id);
    if (named) labelSides(ctx, battle, camera, figurePx, drawn);
    const ms = performance.now() - started;
    view.frameMs.push(ms); if (view.frameMs.length > 240) view.frameMs.shift();
    const sorted = [...view.frameMs].sort((a, b) => a - b);
    view.evidence = {
      id: battle.id, phase: battle.phase, minute: battle.minute, figures: { texian: drawn.texian.length, mexican: drawn.mexican.length },
      regularity: { texian: regularity(drawn.texian), mexican: regularity(drawn.mexican) },
      flashes, shots, shotsTotal: view.shotsTotal, shotsBy: { ...view.shotsBy }, smoke: smokeDrawn.alive, smokeInView: smokeDrawn.inView, smokeCentre: smokeDrawn.centre, bubbles, linesShown: [...view.linesShown],
      members: [...view.members.keys()], memberClips: [...view.memberClips],
      memberPoses: [...view.members.keys()].map(id => ({ id, drawn: view.memberSpots.has(id) })),
      cannon: cannonShown, cannonShots: view.cannonFiredAt.length, fallen: [...fallenSlots.values()].reduce((s, m) => s + m.size, 0),
      parts: Object.fromEntries(battle.sides.map(side => [side.side, (side.parts || []).length])), poses, scenery: sceneryDrawn, herd: herdDrawn,
      night: Boolean(night), lit: night?.lit || 0, memberFates: Object.fromEntries([...view.members].filter(([, m]) => m.fate).map(([id, m]) => [id, m.fate.fate])),
      frameMs: { last: +ms.toFixed(2), median: +sorted[Math.floor(sorted.length / 2)].toFixed(2), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2) },
    };
    view.memberSpots.clear();
    return view.evidence;
  }

  /** Which sampled figures are down, by side: the fall's count taken from the middle of the front, stable for the fight. */
  function fallenBySide(battle, now) {
    const bySide = new Map();
    for (const fall of view.fallenAt.values()) {
      if (fall.at > now) continue;
      const whole = battle.sides.find(one => one.side === fall.side);
      if (!whole || battle.noFalling?.includes(fall.side)) continue;
      // A fall in a part (§6.13) takes its men from that part; the rest take theirs from the whole side, as they always did.
      const part = fall.part ? whole.parts?.find(one => one.id === fall.part) : null;
      if (fall.part && !part) continue;
      const side = part ? { ...part, side: whole.side, part: part.id } : whole, key = part ? `${whole.side}:${part.id}` : whole.side;
      const slots = view.layouts.get(layoutKey(side)) || layoutSide(side);
      const map = bySide.get(key) || new Map();
      const order = [...slots].sort((a, b) => hash(`${fall.minute}:${a.index}`) - hash(`${fall.minute}:${b.index}`)).filter(slot => !map.has(slot.index));
      for (const slot of order.slice(0, fall.count)) map.set(slot.index, { at: fall.at, carried: fall.carried || (battle.over && !part), wounded: fall.wounded });
      bySide.set(key, map);
    }
    return bySide;
  }
  /** The houses, the fire and the groves, where the engagement's data puts them (§6.13), and what of them is lit. */
  function drawScenery(ctx, battle, camera, figurePx, time) {
    let count = 0;
    for (const item of battle.scenery || []) {
      const p = camera.toScreen(item);
      if (item.kind === 'grove') {
        for (let i = 0; i < (item.trees || 5); i++) {
          const a = hash(`${item.id}:${i}:a`) * Math.PI * 2, r = Math.sqrt(hash(`${item.id}:${i}:r`)) * (item.spread || 0.08);
          const q = camera.toScreen({ x: item.x + Math.cos(a) * r, y: item.y + Math.sin(a) * r * 0.7 });
          const tree = i % 3 === 2 ? 'mesquite-large' : 'live-oak-large';
          if (!art.drawSprite(ctx, tree, q.x, q.y, figurePx * 3.2)) { ctx.fillStyle = '#5d7148'; ctx.beginPath(); ctx.arc(q.x, q.y - figurePx, figurePx * 1.1, 0, Math.PI * 2); ctx.fill(); }
        }
      } else if (item.kind === 'campfire') {
        if (!art.animated(ctx, 'campfire', p.x, p.y, figurePx * 0.9, item.id, { timeMs: time })) art.drawSprite(ctx, 'campfire', p.x, p.y, figurePx * 0.9);
      } else if (!art.drawSprite(ctx, item.sprite || 'cabin-small', p.x, p.y, figurePx * 2.4)) {
        ctx.fillStyle = '#8a7658'; ctx.fillRect(p.x - figurePx, p.y - figurePx * 1.2, figurePx * 2, figurePx * 1.2);
      }
      count++;
    }
    return count;
  }
  /** Several hundred horses as a loose herd a few dozen strong, moving with the drive and scattering in the charge. */
  function drawHerd(ctx, camera, figurePx, time, now) {
    const herd = view.herd;
    if (!herd) return 0;
    const at = placeAt(herd, now), right = herd.to.x >= herd.from.x;
    const n = Math.min(24, Math.max(6, Math.round((herd.count || 60) / 12)));
    const width = herd.scatter ? 0.7 : 0.26, depth = herd.scatter ? 0.5 : 0.16;
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "a driven herd" - the library's mustang, repeated, galloping or grazing.
    for (let i = 0; i < n; i++) {
      const q = camera.toScreen({ x: at.x + (hash(`herd:${i}:x`) - 0.5) * width, y: at.y + (hash(`herd:${i}:y`) - 0.5) * depth });
      const moving = herd.moving || herd.scatter;
      if (!art.animated(ctx, moving ? 'mustang-gallop' : 'mustang-graze', q.x, q.y, figurePx * 1.15, `herd:${i}`, { timeMs: time + i * 211, flip: !right })) {
        ctx.fillStyle = '#7a5b3c'; ctx.fillRect(q.x - figurePx * 0.4, q.y - figurePx * 0.5, figurePx * 0.8, figurePx * 0.35);
      }
    }
    return n;
  }
  /** A warm light on the ground: a lantern, the fire, a musket's flash in the dark. */
  function glow(ctx, x, y, r, colour) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  /**
   * The dark of a night fight over the whole view, and the lit windows and the fire through it. stand-in: docs/ART_REQUESTS.md,
   * request 2026-09-25 "San Patricio by night" - a wash on the canvas and a drawn glow, until a night layer exists.
   */
  function drawNight(ctx, battle, camera, figurePx, now, bounds) {
    const width = bounds?.width ?? ctx.canvas?.width ?? 0, height = bounds?.height ?? ctx.canvas?.height ?? 0;
    ctx.save(); ctx.fillStyle = battle.light === 'dawn' ? 'rgba(20,26,48,.3)' : 'rgba(8,12,30,.7)'; ctx.fillRect(0, 0, width, height); ctx.restore();
    let lit = 0;
    for (const item of battle.scenery || []) {
      if (!item.lit) continue;
      const p = camera.toScreen(item);
      glow(ctx, p.x, p.y - figurePx * (item.kind === 'campfire' ? 0.2 : 0.6), figurePx * (item.kind === 'campfire' ? 2.6 : 1.8), 'rgba(255,184,96,.55)');
      lit++;
    }
    return { lit };
  }
  function drawFallen(ctx, f, now) {
    const since = now - f.down.at, kind = f.side === 'mexican' ? 'regular' : 'volunteer';
    const x = f.point.x, y = f.point.y;
    if (f.down.wounded) {
      // Hit, and helped back from the line, sitting up: a wound, not a death (the record's own word where it is disputed).
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the wounded carried" - a dragoon hit in the saddle is drawn as the
      // library's seated wounded soldier helped back by two comrades on foot, until a mounted wounded pose exists.
      // Away from the enemy: the side faces right when the enemy is to its right, so the rear is to its left.
      const back = -Math.min(1, since / 25000) * f.size * 2.4 * (f.facingRight ? 1 : -1);
      if (!art.drawSprite(ctx, `${kind}-injured`, x + back, y, f.size)) art.miniPerson(ctx, x + back, y, f.size, { side: f.side });
      for (const off of [-0.45, 0.45]) art.animated(ctx, `${kind}-march`, x + back + off * f.size, y + 2, f.size, `${f.slot.index}:${off}`, { flip: f.facingRight });
      return;
    }
    if (since < 600) {
      // Going down: the standing figure tips over about its feet.
      ctx.save(); ctx.translate(x, y); ctx.rotate((f.side === 'mexican' ? 1 : -1) * (since / 600) * 1.2);
      if (!art.drawSprite(ctx, `${kind}-${f.side === 'mexican' ? 'w' : 'e'}`, 0, 0, f.size)) art.miniPerson(ctx, 0, 0, f.size, { side: f.side });
      ctx.restore();
      return;
    }
    // Lying still. Carried: two comrades walk him back from the line (VISION.md §16 names both).
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the wounded carried" - two walking figures beside the lying one,
    // until a carrying pose exists.
    const carry = f.down.carried ? Math.min(1, (since - 600) / 20000) : 0;
    const dx = carry * f.size * 3 * (f.side === 'mexican' ? 1 : -1);
    if (!art.drawSprite(ctx, `${kind}-reclining`, x + dx, y, f.size)) { ctx.fillStyle = '#6b6153'; ctx.fillRect(x + dx - f.size * 0.4, y - f.size * 0.12, f.size * 0.8, f.size * 0.12); }
    if (f.down.carried) for (const off of [-0.45, 0.45]) art.animated(ctx, `${kind}-march`, x + dx + off * f.size, y + 2, f.size, `${f.slot.index}:${off}`, { flip: f.side !== 'mexican' });
  }

  function drawCannon(ctx, battle, camera, figurePx, time, now, wind, reducedMotion) {
    const gun = battle.cannon, side = battle.sides.find(one => one.side === gun.side);
    const right = (side?.facing?.x ?? 1) >= 0;
    const shown = view.sides.get(gun.side), live = shown ? placeAt(shown, now) : side;
    // The gun moves with its side: its offset from the side's centre, carried smoothly with it.
    const at = { x: gun.x + (live.x - side.x), y: gun.y + (live.y - side.y) };
    const p = camera.toScreen(at), size = figurePx * 1.4;
    const last = view.cannonFiredAt.filter(t => t <= now).at(-1);
    const since = last === undefined ? Infinity : now - last;
    const metal = gun.metal === 'bronze' ? 'bronze' : 'iron';
    const name = `cannon-${metal}-${right ? 'e' : 'w'}`;
    const firing = since < 900;
    if (firing) art.animated(ctx, `${name}-recoil`, p.x, p.y, size, 0, { timeMs: since });
    else art.drawSprite(ctx, name, p.x, p.y, size) || (ctx.fillStyle = '#3b3a36', ctx.fillRect(p.x - size * 0.4, p.y - size * 0.3, size * 0.8, size * 0.22));
    // The crew: one ramming between shots, one bringing the charge, one at the touch-hole who pulls and covers his ears.
    // stand-in: the library's gun-crew cycles are drawn for a carriage gun's crew; the Gonzales gun's own crew and mount are
    // not drawn (docs/ART_REQUESTS.md, request 2026-09-25 "the Gonzales cannon on its wheels").
    const back = right ? -1 : 1;
    const crew = [
      { clip: firing ? 'volunteer-gun-fire' : 'volunteer-gun-ram', dx: back * 0.75, t: firing ? since : time },
      { clip: 'volunteer-gun-shot-carry', dx: back * 1.35, t: time },
      { clip: firing ? 'volunteer-gun-fire' : 'volunteer-idle-e', dx: back * 0.2, dy: 0.35, t: firing ? since : time },
    ].slice(0, gun.crew || 3);
    for (const man of crew) art.animated(ctx, man.clip, p.x + man.dx * figurePx, p.y + (man.dy || 0) * figurePx, figurePx, `crew:${man.clip}:${man.dx}`, { timeMs: man.t, flip: !right, paused: reducedMotion });
    // Each shot, once: the flash, and a bank of smoke that lies on the field long after.
    const pending = view.cannonFiredAt.filter(t => t <= now && !view.shotsSeen.has(`cannon:${t}`));
    for (const t of pending) {
      view.shotsSeen.add(`cannon:${t}`);
      if (reducedMotion) continue;
      view.shotsTotal++;
      const muzzle = { x: at.x + (right ? 1 : -1) * 0.02, y: at.y - 0.004 };
      flash(muzzle.x, muzzle.y, right, now, 2.4);
      for (let i = 0; i < 4; i++) puff(muzzle.x + (right ? 1 : -1) * i * 0.008, muzzle.y + (Math.random() - 0.5) * 0.01, now, { big: true, wind });
    }
    return { x: Math.round(p.x), y: Math.round(p.y), firing, shots: view.cannonFiredAt.filter(t => t <= now).length };
  }

  /**
   * The flag, where the record puts it (sim/battles/<id>.mjs `flag`).
   * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the Come and Take It flag" - drawn on the canvas, a white field with a
   * black cannon, a star over it and the words under it, until Astra's flag lands.
   */
  function drawFlag(ctx, flag, camera, figurePx, time, wind) {
    const texian = view.sides.get(flag.side), side = texian ? placeAt(texian, performance.now()) : null;
    const base = side ? { x: flag.x + (side.x - texian.to.x), y: flag.y + (side.y - texian.to.y) } : flag;
    const p = camera.toScreen(base), pole = figurePx * 1.9, w = figurePx * 1.15, h = figurePx * 0.72;
    const wave = Math.sin(time / 420) * 0.08 + (wind?.x || 0) * 0.3;
    ctx.save();
    ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = Math.max(1.2, figurePx * 0.05);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - pole); ctx.stroke();
    ctx.translate(p.x, p.y - pole);
    ctx.transform(1, wave * 0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#f3efe4'; ctx.strokeStyle = '#6d6250'; ctx.lineWidth = 1;
    ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#1f1d1a';
    // The star over the gun.
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? h * 0.05 : h * 0.12, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(w * 0.5 + Math.cos(a) * r, h * 0.2 + Math.sin(a) * r); }
    ctx.fill();
    // The gun: a barrel on a wheel.
    ctx.fillRect(w * 0.28, h * 0.38, w * 0.46, h * 0.12);
    ctx.beginPath(); ctx.arc(w * 0.42, h * 0.56, h * 0.08, 0, Math.PI * 2); ctx.fill();
    if (figurePx >= 22) {
      ctx.font = `bold ${Math.max(6, Math.round(h * 0.16))}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(flag.words || 'COME AND TAKE IT', w * 0.5, h * 0.82, w * 0.92);
    }
    ctx.restore();
  }

  function drawParley(ctx, battle, camera, figurePx, time) {
    const p = camera.toScreen(battle.parley);
    const people = battle.parley.people || [];
    const texRight = (battle.sides.find(s => s.side === 'texian')?.facing?.x ?? 1) >= 0;
    // The two commanders a few yards apart between the lines; each is drawn as his side is, and named, because the record
    // names them. Neither says anything here that is not a documented line (sim/battle-stage.mjs `checkEngagement`).
    const spots = [{ side: 'texian', dx: texRight ? -1.2 : 1.2 }, { side: 'mexican', dx: texRight ? 1.2 : -1.2 }];
    view.parleySpots = {};
    for (const spot of spots) {
      const who = people.find(one => one.side === spot.side);
      const x = p.x + spot.dx * figurePx, size = spot.side === 'mexican' && who?.mounted ? figurePx * 1.35 : figurePx;
      const faceRight = spot.dx < 0;
      const clip = spot.side === 'mexican' ? (who?.mounted ? `dragoon-idle-${faceRight ? 'e' : 'w'}` : `regular-idle-${faceRight ? 'e' : 'w'}`) : `volunteer-idle-${faceRight ? 'e' : 'w'}`;
      if (!art.animated(ctx, clip, x, p.y, size, `parley:${spot.side}`, { timeMs: time })) art.miniPerson(ctx, x, p.y, size, { side: spot.side });
      view.parleySpots[spot.side] = { x, y: p.y - size };
      if (who?.name && figurePx >= 14) {
        ctx.font = `${Math.round(Math.max(11, Math.min(15, figurePx * 0.3)))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(who.name, x, p.y + 14); ctx.fillStyle = '#26382e'; ctx.fillText(who.name, x, p.y + 14);
      }
    }
  }

  function drawSmoke(ctx, camera, figurePx, now, reducedMotion, bounds) {
    view.smoke = view.smoke.filter(s => now - s.born < s.life);
    if (reducedMotion) return { alive: view.smoke.length, inView: 0 };
    let inView = 0;
    for (const s of view.smoke) {
      const age = now - s.born, t = age / s.life;
      const at = camera.toScreen({ x: s.x + s.vx * age, y: s.y + s.vy * age });
      if (bounds && at.x >= 0 && at.y >= 0 && at.x <= bounds.width && at.y <= bounds.height) inView++;
      const size = figurePx * lerp(s.size0, s.size1, Math.sqrt(t));
      const alpha = s.alpha * (t < 0.04 ? t / 0.04 : Math.pow(1 - t, 1.3));
      const sprite = t < 0.08 ? 'smoke-growing' : s.seed < 0.5 ? 'smoke-dispersing' : 'smoke-dense';
      if (!art.drawSprite(ctx, sprite, at.x, at.y - figurePx * 0.4, size, { alpha: sprite === 'smoke-dense' ? alpha * 0.7 : alpha, flip: s.seed > 0.7 })) {
        const g = ctx.createRadialGradient(at.x, at.y - size * 0.4, 0, at.x, at.y - size * 0.4, size * 0.5);
        g.addColorStop(0, `rgba(226,224,216,${alpha})`); g.addColorStop(1, 'rgba(226,224,216,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at.x, at.y - size * 0.4, size * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Where the smoke lies now, on the ground: the middle of every puff where the wind has taken it (evidence only).
    const centre = view.smoke.length ? view.smoke.reduce((sum, s) => ({ x: sum.x + s.x + s.vx * (now - s.born), y: sum.y + s.y + s.vy * (now - s.born) }), { x: 0, y: 0 }) : null;
    return { alive: view.smoke.length, inView, centre: centre && { x: centre.x / view.smoke.length, y: centre.y / view.smoke.length } };
  }

  /** Every line said this tick or lately, over whoever said it; the Mexican officer's words as each volley comes. */
  function drawLines(ctx, battle, camera, figurePx, now, time, bounds, drawn) {
    const shown = [];
    const boxes = [];
    const scale = Math.max(0.85, Math.min(1.15, figurePx / 30));
    const speakerAt = line => {
      if (line.name && view.parleySpots?.[line.side]) return view.parleySpots[line.side];
      const points = drawn[line.side];
      if (!points?.length) return null;
      if (line.role === 'officer' || line.role === 'commander') {
        // The officer rides or stands at the front of the middle of his men.
        const side = view.sides.get(line.side);
        if (side) { const c = camera.toScreen(placeAt(side, now)); return { x: c.x, y: c.y - figurePx * (line.side === 'mexican' ? 1.4 : 1.05) }; }
      }
      const pick = points[Math.floor(hash(line.id) * points.length)];
      return { x: pick.x, y: pick.y - figurePx * 1.02 };
    };
    const put = (line, at, alpha) => {
      if (!at) return;
      let y = at.y;
      // Two bubbles never on top of each other: a later one steps up over the one already drawn.
      for (let i = 0; i < 4; i++) {
        const probe = { x: at.x - 110 * scale, y: y - 70 * scale, w: 220 * scale, h: 60 * scale };
        if (!boxes.some(b => probe.x < b.x + b.w && b.x < probe.x + probe.w && probe.y < b.y + b.h && b.y < probe.y + probe.h)) break;
        y -= 48 * scale;
      }
      const box = drawSpeech(ctx, line, at.x, y, { alpha, bounds, scale });
      if (box) { boxes.push(box); shown.push({ id: line.id, text: line.text, gloss: line.gloss || null, kind: line.kind, side: line.side, claimId: line.claimId || null }); }
    };
    for (const { at, line } of view.linesSeen.values()) {
      const hold = Math.max(3800, 70 * line.text.length);
      const alpha = speechAlpha(now - at, hold);
      if (alpha > 0) put(line, speakerAt(line), alpha);
    }
    // The officer's words, each volley, from the record's reconstructed drill (never a named man's).
    for (const side of battle.sides) {
      if (side.fire !== 'volley' || !battle.commands?.volley) continue;
      const cycleAt = (time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) % VOLLEY_MS;
      battle.commands.volley.forEach((word, i) => {
        const since = cycleAt - VOLLEY_WORDS_AT[i];
        if (since < 0 || since > 1300) return;
        put({ ...word, id: `command:${i}`, side: side.side, role: 'officer', kind: word.kind || 'reconstructed' }, speakerAt({ side: side.side, role: 'officer', id: 'officer' }), speechAlpha(since, 900));
      });
    }
    return shown;
  }

  function labelSides(ctx, battle, camera, figurePx, drawn) {
    ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const side of battle.sides) {
      const points = drawn[side.side];
      if (!points.length) continue;
      const x = points.reduce((s, p) => s + p.x, 0) / points.length, y = Math.max(...points.map(p => p.y)) + 16;
      const text = `${side.name}${side.count ? ` · about ${side.count}` : ''}`;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(text, x, y); ctx.fillStyle = '#26382e'; ctx.fillText(text, x, y);
    }
  }

  return { draw, memberPose, memberDrawn, get evidence() { return view.evidence; }, get smoke() { return view.smoke.length; } };
}
